// background.js - Service worker with Fairy-Stockfish UCI engine via Web Worker

let engineWorker = null;
let isEngineReady = false;
let pendingMoveRequests = new Map();
let requestIdCounter = 0;

// Engine configuration
const CONFIG = {
    variant: "chess",
    searchDepth: 15
};

// Initialize engine worker
function initializeEngine() {
    try {
        engineWorker = new Worker('./engine-worker.js');
        
        // Handle messages from worker
        engineWorker.onmessage = (event) => {
            const { type, bestMove, error } = event.data;
            
            if (type === 'READY') {
                isEngineReady = true;
                console.log("[background.js] Fairy-Stockfish UCI engine ready");
            } else if (type === 'BEST_MOVE') {
                // Resolve the first pending move request
                const firstEntry = pendingMoveRequests.entries().next();
                if (!firstEntry.done) {
                    const [requestId, callback] = firstEntry.value;
                    pendingMoveRequests.delete(requestId);
                    callback({ bestMove });
                }
            } else if (type === 'ERROR') {
                console.error("[background.js] Engine worker error:", error);
                // Reject all pending requests
                pendingMoveRequests.forEach(callback => {
                    callback({ error });
                });
                pendingMoveRequests.clear();
            }
        };
        
        engineWorker.onerror = (error) => {
            console.error("[background.js] Worker error:", error);
            isEngineReady = false;
        };
        
    } catch (error) {
        console.error("[background.js] Engine worker initialization failed:", error);
    }
}

// Calculate best move using UCI engine
function calculateBestMove(fen) {
    return new Promise((resolve, reject) => {
        if (!isEngineReady || !engineWorker) {
            reject(new Error("Engine not ready"));
            return;
        }
        
        // Store callback for when worker responds
        const requestId = requestIdCounter++;
        pendingMoveRequests.set(requestId, (response) => {
            if (response.error) {
                reject(new Error(response.error));
            } else {
                resolve(response.bestMove);
            }
        });
        
        // Send calculation request to worker
        engineWorker.postMessage({
            type: 'CALCULATE_MOVE',
            fen: fen,
            depth: CONFIG.searchDepth
        });
    });
}

// Message handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "CALCULATE_MOVE") {
        if (!isEngineReady) {
            sendResponse({ error: "Engine not ready" });
            return true;
        }
        
        calculateBestMove(request.fen)
            .then(bestMove => {
                console.log(`[background.js] FEN: ${request.fen}`);
                console.log(`[background.js] Best move: ${bestMove}`);
                sendResponse({ bestMove });
            })
            .catch(error => {
                console.error("[background.js] Calculation error:", error);
                sendResponse({ error: error.message });
            });
        
        return true; // Keep message channel open for async response
    }
    
    if (request.type === "GET_STATUS") {
        sendResponse({
            engineReady: isEngineReady,
            variant: CONFIG.variant,
            depth: CONFIG.searchDepth
        });
        return true;
    }
    
    if (request.type === "SET_CONFIG") {
        Object.assign(CONFIG, request.config);
        
        // Update worker depth if needed
        if (request.config.searchDepth && engineWorker) {
            engineWorker.postMessage({
                type: 'SET_DEPTH',
                depth: request.config.searchDepth
            });
        }
        
        sendResponse({ success: true, config: CONFIG });
        return true;
    }
});

// Initialize on startup
initializeEngine();

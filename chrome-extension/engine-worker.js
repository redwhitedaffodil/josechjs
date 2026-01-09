// engine-worker.js - Web Worker for Fairy-Stockfish UCI Engine

importScripts('./lib/fsf14.js');

let fsfEngine = null;
let isReady = false;
let pendingResponse = null;

// Initialize the Fairy-Stockfish engine
async function initEngine() {
    try {
        fsfEngine = await Fsf14Web({
            locateFile: (file) => `./lib/${file}`,
            listen: (output) => handleEngineOutput(output),
            onError: (error) => console.error('[engine-worker] Error:', error)
        });
        
        // Send initial UCI command to initialize engine
        fsfEngine.uci('uci');
        console.log('[engine-worker] Fairy-Stockfish engine initialized');
    } catch (error) {
        console.error('[engine-worker] Engine initialization failed:', error);
        postMessage({ type: 'ERROR', error: error.message });
    }
}

// Handle output from the engine
function handleEngineOutput(output) {
    console.log('[engine-worker] Engine output:', output);
    
    // Check if engine is ready
    if (output.includes('uciok')) {
        fsfEngine.uci('isready');
    } else if (output.includes('readyok')) {
        isReady = true;
        postMessage({ type: 'READY' });
    }
    
    // Parse bestmove from engine output
    const bestmoveMatch = output.match(/^bestmove\s+([a-h][1-8][a-h][1-8][qrbn]?)/);
    if (bestmoveMatch && pendingResponse) {
        const bestMove = bestmoveMatch[1];
        pendingResponse({ bestMove });
        pendingResponse = null;
    }
}

// Handle messages from background script
self.onmessage = function(event) {
    const { type, fen, depth } = event.data;
    
    if (type === 'CALCULATE_MOVE') {
        if (!isReady || !fsfEngine) {
            postMessage({ 
                type: 'ERROR', 
                error: 'Engine not ready' 
            });
            return;
        }
        
        // Set up promise to wait for bestmove
        pendingResponse = (result) => {
            postMessage({ 
                type: 'BEST_MOVE', 
                bestMove: result.bestMove 
            });
        };
        
        // Send UCI commands to engine
        const searchDepth = depth || 15;
        fsfEngine.uci(`position fen ${fen}`);
        fsfEngine.uci(`go depth ${searchDepth}`);
        
    } else if (type === 'SET_DEPTH') {
        // Depth will be used in next calculation
        console.log('[engine-worker] Depth set to:', depth);
    }
};

// Initialize engine on worker startup
initEngine();

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
        // Wait a bit before sending isready to ensure engine is stable
        setTimeout(() => fsfEngine.uci('isready'), 10);
    } else if (output.includes('readyok')) {
        isReady = true;
        postMessage({ type: 'READY' });
    }
    
    // Parse bestmove from engine output
    // Handle standard moves (e2e4), castling (e1g1), and promotion (e7e8q)
    const bestmoveMatch = output.match(/^bestmove\s+([a-z][0-9][a-z][0-9][qrbnk]?)/);
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
        
        // Reject if already calculating
        if (pendingResponse) {
            postMessage({ 
                type: 'ERROR', 
                error: 'Engine is busy calculating another move' 
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
        
        // Send UCI commands to engine with slight delay to ensure proper sequencing
        const searchDepth = depth || 15;
        fsfEngine.uci(`position fen ${fen}`);
        // Small delay to let position command be processed
        setTimeout(() => {
            fsfEngine.uci(`go depth ${searchDepth}`);
        }, 5);
        
    } else if (type === 'SET_DEPTH') {
        // Depth will be used in next calculation
        console.log('[engine-worker] Depth set to:', depth);
    }
};

// Initialize engine on worker startup
initEngine();

// background.js - Service worker with ffish engine

let ffish = null;
let isEngineReady = false;

// Engine configuration
const CONFIG = {
    variant: "chess",
    searchDepth: 15
};

// Initialize ffish engine
async function initializeEngine() {
    try {
        const Module = await import('./lib/ffish.js');
        ffish = await Module.default();
        isEngineReady = true;
        console.log("[background.js] Fairy-Stockfish initialized");
    } catch (error) {
        console.error("[background.js] Engine initialization failed:", error);
    }
}

// Calculate best move
function calculateBestMove(fen) {
    if (!isEngineReady || !ffish) {
        throw new Error("Engine not ready");
    }
    
    let board = null;
    
    try {
        const validation = ffish.validateFen(fen, CONFIG.variant);
        if (validation !== 1) {
            throw new Error(`Invalid FEN (error code: ${validation})`);
        }
        
        board = new ffish.Board(CONFIG.variant, fen);
        
        if (board.isGameOver()) {
            return null;
        }
        
        const legalMoves = board.legalMoves().split(" ").filter(m => m);
        
        if (legalMoves.length === 0) {
            return null;
        }
        
        if (legalMoves.length === 1) {
            return legalMoves[0];
        }
        
        const bestMove = selectBestMove(board, legalMoves);
        return bestMove;
        
    } finally {
        if (board) {
            board.delete(); // CRITICAL: Free memory
        }
    }
}

// Move selection with position evaluation
function selectBestMove(board, legalMoves) {
    let bestMove = null;
    let bestScore = -Infinity;
    const isWhite = board.turn();
    
    for (const move of legalMoves) {
        board.push(move);
        const score = evaluatePosition(board, !isWhite);
        board.pop();
        
        const adjustedScore = isWhite ? score : -score;
        if (adjustedScore > bestScore) {
            bestScore = adjustedScore;
            bestMove = move;
        }
    }
    
    return bestMove || legalMoves[0];
}

// Position evaluation
function evaluatePosition(board, forWhite) {
    let score = 0;
    
    if (board.isGameOver()) {
        if (board.isCheck()) {
            return forWhite ? -10000 : 10000;
        }
        return 0;
    }
    
    if (board.isCheck()) {
        score += forWhite ? -50 : 50;
    }
    
    const mobility = board.legalMoves().split(" ").filter(m => m).length;
    score += forWhite ? -mobility : mobility;
    
    const fen = board.fen();
    const pieceSection = fen.split(" ")[0];
    
    const pieceValues = {
        'P': 100, 'N': 320, 'B': 330, 'R': 500, 'Q': 900, 'K': 0,
        'p': -100, 'n': -320, 'b': -330, 'r': -500, 'q': -900, 'k': 0
    };
    
    for (const char of pieceSection) {
        if (pieceValues[char] !== undefined) {
            score += pieceValues[char];
        }
    }
    
    return forWhite ? score : -score;
}

// Message handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "CALCULATE_MOVE") {
        if (!isEngineReady) {
            sendResponse({ error: "Engine not ready" });
            return true;
        }
        
        try {
            const bestMove = calculateBestMove(request.fen);
            console.log(`[background.js] FEN: ${request.fen}`);
            console.log(`[background.js] Best move: ${bestMove}`);
            sendResponse({ bestMove });
        } catch (error) {
            console.error("[background.js] Calculation error:", error);
            sendResponse({ error: error.message });
        }
        
        return true;
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
        sendResponse({ success: true, config: CONFIG });
        return true;
    }
});

// Initialize on startup
initializeEngine();

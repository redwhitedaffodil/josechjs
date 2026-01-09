// ==UserScript==
// @name         Lichess Bot (js-chess-engine)
// @description  Fully automated lichess bot using js-chess-engine
// @author       Nuro
// @match        *://lichess.org/*
// @run-at       document-start
// @grant        none
// @require      https://raw.githubusercontent.com/redwhitedaffodil/josechjs/refs/heads/main/dist/js-chess-engine.js
// ==/UserScript==

const AI_LEVEL = 2;  // 0-4, maps roughly to stockfish depth 10
let webSocketWrapper = null;

function interceptWebSocket() {
    const OriginalWebSocket = window.WebSocket;
    const webSocketProxy = new Proxy(OriginalWebSocket, {
        construct: function (target, args) {
            const wrappedWebSocket = new target(...args);
            webSocketWrapper = wrappedWebSocket;

            wrappedWebSocket.addEventListener("message", function (event) {
                const message = JSON.parse(event.data);
                console.log(message);
                
                if (message.d && typeof message.d.fen === "string" && typeof message.v === "number") {
                    let fen = message.d.fen;
                    
                    // Append turn indicator
                    const isWhitesTurn = message.v % 2 === 0;
                    fen += isWhitesTurn ? " w" : " b";
                    
                    // Calculate and send move (synchronous)
                    calculateAndSendMove(fen);
                }
            });
            
            return wrappedWebSocket;
        }
    });

    window.WebSocket = webSocketProxy;
}

function calculateAndSendMove(fen) {
    try {
        // Complete FEN with castling, en passant, and move counters if missing
        const fullFen = completeFen(fen);
        
        // Use standalone aiMove function - accepts FEN string directly
        const jsChessEngine = window["js-chess-engine"];
        const move = jsChessEngine.aiMove(fullFen, AI_LEVEL);
        
        // Convert { E2: "E4" } to "e2e4"
        const bestMove = convertMoveToLichess(move);
        
        // Send move via WebSocket
        webSocketWrapper.send(JSON.stringify({
            t: "move",
            d: { u: bestMove, b: 1, l: 1000, a: 1 }
        }));
        
        console.log(`[js-chess-engine] Move: ${bestMove}`);
    } catch (error) {
        console.error("[js-chess-engine] Error:", error);
    }
}

function completeFen(partialFen) {
    // Lichess provides partial FEN: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b"
    // js-chess-engine needs full FEN: add castling, en passant, halfmove, fullmove
    const parts = partialFen.split(" ");
    if (parts.length === 2) {
        // Add defaults: castling=KQkq, en-passant=-, halfmove=0, fullmove=1
        return `${parts[0]} ${parts[1]} KQkq - 0 1`;
    }
    return partialFen;
}

function convertMoveToLichess(move) {
    const from = Object.keys(move)[0].toLowerCase();
    const to = Object.values(move)[0].toLowerCase();
    return from + to;
}

// Initialize
interceptWebSocket();

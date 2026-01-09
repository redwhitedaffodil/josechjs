// content.js - Runs in page context, intercepts WebSocket
let webSocketWrapper = null;

function interceptWebSocket() {
    const OriginalWebSocket = window.WebSocket;
    
    window.WebSocket = new Proxy(OriginalWebSocket, {
        construct(target, args) {
            const ws = new target(...args);
            webSocketWrapper = ws;
            
            ws.addEventListener("message", async (event) => {
                try {
                    const message = JSON.parse(event.data);
                    
                    if (message.d?.fen && typeof message.v === "number") {
                        const fen = buildCompleteFen(message.d.fen, message.v);
                        
                        // Send to background for engine calculation
                        const response = await chrome.runtime.sendMessage({
                            type: "CALCULATE_MOVE",
                            fen: fen
                        });
                        
                        if (response?.bestMove) {
                            sendMove(response.bestMove);
                        }
                    }
                } catch (e) {
                    console.error("[content.js] Error:", e);
                }
            });
            
            return ws;
        }
    });
}

function buildCompleteFen(partialFen, moveNumber) {
    const turn = (moveNumber % 2 === 0) ? "w" : "b";
    const parts = partialFen.split(" ");
    
    if (parts.length === 1) {
        return `${partialFen} ${turn} KQkq - 0 1`;
    } else if (parts.length === 2) {
        return `${parts[0]} ${parts[1]} KQkq - 0 1`;
    }
    return partialFen;
}

function sendMove(move) {
    if (webSocketWrapper?.readyState === WebSocket.OPEN) {
        webSocketWrapper.send(JSON.stringify({
            t: "move",
            d: { u: move, b: 1, l: 1000, a: 1 }
        }));
        console.log(`[content.js] Sent move: ${move}`);
    }
}

// Initialize
interceptWebSocket();
console.log("[content.js] WebSocket interception active");

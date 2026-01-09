# Lichess Chess Assistant - Chrome Extension

A Chrome extension powered by Fairy-Stockfish (ffish-es6) for chess analysis on Lichess.

## Setup

### 1. Install ffish-es6 (Already Done)

The ffish-es6 library files have already been copied to the `lib/` directory:
- `lib/ffish.js` - JavaScript glue code
- `lib/ffish.wasm` - WebAssembly binary

If you need to update these files:

```bash
npm install ffish-es6
cp node_modules/ffish-es6/ffish.js lib/
cp node_modules/ffish-es6/ffish.wasm lib/
```

### 2. Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select this `chrome-extension/` directory

## Features

- **Professional-grade Fairy-Stockfish engine** (~3200 ELO)
- **Supports 80+ chess variants** (Standard, Crazyhouse, Atomic, etc.)
- **Configurable search depth** (10-25 moves ahead)
- **Clean popup UI** for settings
- **WebSocket interception** for automatic move detection
- **Memory-efficient** with proper WASM cleanup

## Usage

1. Load the extension in Chrome (see Setup above)
2. Navigate to a game on [lichess.org](https://lichess.org)
3. The extension will automatically detect game positions via WebSocket
4. Best moves are calculated and can be sent automatically
5. Configure settings via the extension popup (click the chess icon)

## Architecture

### Files

- `manifest.json` - Chrome Extension Manifest V3 configuration
- `background.js` - Service worker with engine logic and move calculation
- `content.js` - Content script for WebSocket interception
- `popup/popup.html` - Settings UI
- `popup/popup.js` - Settings logic
- `lib/ffish.js` - ffish-es6 JavaScript glue code
- `lib/ffish.wasm` - Fairy-Stockfish WebAssembly binary
- `icons/` - Extension icons (16x16, 48x48, 128x128)

### How It Works

1. **Content Script (`content.js`)**:
   - Runs on lichess.org pages
   - Intercepts WebSocket messages to detect game positions
   - Sends FEN positions to background service worker
   - Receives best moves and sends them via WebSocket

2. **Background Service Worker (`background.js`)**:
   - Initializes Fairy-Stockfish WASM engine on startup
   - Calculates best moves using ffish Board API
   - Evaluates positions with material and mobility heuristics
   - Handles settings storage and retrieval

3. **Popup UI (`popup/`)**:
   - Displays engine status
   - Allows variant selection (80+ variants)
   - Configurable search depth (10-25)
   - Saves settings to background worker

## API Comparison: js-chess-engine vs ffish-es6

| Feature | js-chess-engine | ffish-es6 |
|---------|-----------------|-----------|
| **Initialization** | `new Game(fen)` | `new ffish.Board(variant, fen)` |
| **Make Move** | `game.move(from, to)` | `board.push("e2e4")` |
| **Move Format** | `{ E2: "E4" }` object | `"e2e4"` UCI string |
| **Get Legal Moves** | `game.moves()` → Object | `board.legalMoves()` → String |
| **FEN Export** | `game.exportFEN()` | `board.fen()` |
| **Memory Mgmt** | Automatic (JS GC) | **Manual** (`board.delete()`) |
| **Variants** | Chess only | 80+ variants |
| **Engine Strength** | ~1500 ELO (weak) | ~3200 ELO (professional) |
| **Size** | ~26KB | ~897KB (WASM) |

## Benefits Over js-chess-engine

✅ **Professional Engine**: Fairy-Stockfish core provides ~3200 ELO strength  
✅ **80+ Variants**: Standard, Crazyhouse, Atomic, Horde, etc.  
✅ **Built-in FEN Validation**: `ffish.validateFen(fen, variant)`  
✅ **Multiple Move Notations**: SAN, LAN, UCI, Shogi  
✅ **PGN Parsing**: Native support for reading game files  
✅ **Better Move Quality**: Professional-grade evaluation  

⚠️ **Trade-offs**:
- Larger file size (~897KB WASM vs ~26KB pure JS)
- Manual memory management required (`board.delete()`)
- WASM initialization time (~100-500ms)

## Troubleshooting

### Engine Not Initializing

If you see "Engine not ready" errors:

1. Check browser console for WASM loading errors
2. Ensure `lib/ffish.wasm` exists and is accessible
3. Verify Content Security Policy allows `'wasm-unsafe-eval'`
4. Reload the extension

### Moves Not Being Sent

If moves aren't appearing:

1. Check that you're on lichess.org
2. Open browser console and look for `[content.js]` messages
3. Verify WebSocket interception is active
4. Check that the game has started

### Performance Issues

If the extension is slow:

1. Reduce search depth in settings (try 10 instead of 15)
2. Close other tabs to free up memory
3. Check that `board.delete()` is being called (memory leaks)

## Development

### Testing Locally

```bash
# Load extension in Chrome
1. chrome://extensions/
2. Enable Developer mode
3. Load unpacked -> select chrome-extension/

# View logs
1. Background worker: chrome://extensions/ -> "service worker" link
2. Content script: Open DevTools on lichess.org page
3. Popup: Right-click popup -> "Inspect"
```

### Updating ffish

```bash
npm update ffish-es6
cp node_modules/ffish-es6/ffish.js lib/
cp node_modules/ffish-es6/ffish.wasm lib/
```

## License

This extension uses:
- **Fairy-Stockfish**: GPL-3.0 license
- **ffish-es6**: GPL-3.0 license

See the original projects for more details:
- [Fairy-Stockfish](https://github.com/ianfab/Fairy-Stockfish)
- [ffish-es6](https://www.npmjs.com/package/ffish-es6)

## Credits

- **Fairy-Stockfish**: Fabian Fichter, Johannes Czech
- **Original js-chess-engine**: Josef Jadrny
- **Extension Development**: Migration from Violentmonkey userscript

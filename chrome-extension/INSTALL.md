# Chrome Extension Installation Guide

## Quick Start

### 1. Load Extension in Chrome

1. Open Google Chrome
2. Navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle switch in top-right corner)
4. Click **"Load unpacked"** button
5. Navigate to and select the `chrome-extension/` directory
6. The extension should now appear in your extensions list

### 2. Verify Installation

After loading:
- You should see "Lichess Chess Assistant" in your extensions list
- A chess piece icon should appear in your Chrome toolbar
- Status should show "Enabled"

### 3. Test the Extension

1. Navigate to [lichess.org](https://lichess.org)
2. Start a game (any time control)
3. Open Chrome DevTools (F12) and check the Console tab
4. Look for messages like:
   ```
   [content.js] WebSocket interception active
   [background.js] Fairy-Stockfish initialized
   ```

### 4. Configure Settings

1. Click the chess piece icon in your Chrome toolbar
2. The popup should show "✓ Engine ready"
3. Select your preferred variant (default: Standard Chess)
4. Choose search depth (default: 15 - Balanced)

## Troubleshooting

### Extension Not Loading

**Issue**: Error when loading unpacked extension

**Solutions**:
- Run the validation script: `bash chrome-extension/validate.sh`
- Check that all files are present (manifest.json, background.js, etc.)
- Ensure `lib/ffish.wasm` exists and is not corrupted
- Try reloading Chrome and attempting again

### Engine Not Initializing

**Issue**: Popup shows "Engine loading..." indefinitely

**Solutions**:
1. Click "service worker" link next to the extension in chrome://extensions/
2. Check the console for errors
3. Common issues:
   - WASM file failed to load → Check Content Security Policy
   - Module import error → Ensure background.js is marked as ES module
   - Path issues → Verify lib/ffish.js and lib/ffish.wasm exist

**How to check**:
```javascript
// In service worker console:
chrome.runtime.reload(); // Reload the extension
```

### WebSocket Not Intercepted

**Issue**: No moves being calculated on Lichess

**Solutions**:
1. Open DevTools on the Lichess page
2. Check Console for `[content.js]` messages
3. Verify the content script is injecting:
   - Reload the page
   - Look for "[content.js] WebSocket interception active"
4. Ensure host permissions are granted:
   - Go to chrome://extensions/
   - Click "Details" on Lichess Chess Assistant
   - Scroll to "Site access"
   - Select "On all sites" or add lichess.org specifically

### Moves Not Sending

**Issue**: Best move calculated but not sent to Lichess

**Solutions**:
- Check that the game has actually started
- Verify it's your turn
- Ensure WebSocket is in OPEN state
- Check browser console for errors in sendMove()

### Performance Issues

**Issue**: Extension is slow or laggy

**Solutions**:
1. Reduce search depth in settings (try 10 instead of 15)
2. Close unnecessary Chrome tabs
3. Check for memory leaks:
   - Open service worker console
   - Run `chrome.runtime.reload()` periodically
   - Verify board.delete() is being called

## Advanced Configuration

### Changing Default Settings

Edit `background.js` to change defaults:

```javascript
const CONFIG = {
    variant: "chess",      // Change to "crazyhouse", "atomic", etc.
    searchDepth: 15        // Change to 10, 20, or 25
};
```

### Enabling Debug Logging

Add more console.log statements in:
- `background.js` - Engine calculations
- `content.js` - WebSocket messages
- `popup/popup.js` - Settings changes

### Testing Without Lichess

You can test the engine directly in the service worker console:

```javascript
// In chrome://extensions/ -> service worker console
const testFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
calculateBestMove(testFen);
```

## Supported Variants

The extension supports 80+ chess variants via Fairy-Stockfish:

### Popular Variants
- **Standard Chess** (default)
- **Crazyhouse** - Captured pieces can be dropped
- **Atomic** - Captures cause explosions
- **Antichess** - Lose all your pieces to win
- **Horde** - White starts with 36 pawns
- **King of the Hill** - Move king to center
- **Three-Check** - Check opponent 3 times
- **Racing Kings** - Race kings to 8th rank

### All Variants
See popup dropdown or check Fairy-Stockfish documentation for complete list.

## Updating the Extension

### Manual Update

1. Make changes to files in `chrome-extension/`
2. Go to chrome://extensions/
3. Click the **refresh** icon on the extension card
4. Or click "Remove" and reload it

### Updating ffish Library

```bash
npm install ffish-es6@latest
cp node_modules/ffish-es6/ffish.js chrome-extension/lib/
cp node_modules/ffish-es6/ffish.wasm chrome-extension/lib/
```

Then reload the extension in Chrome.

## Uninstallation

1. Go to chrome://extensions/
2. Find "Lichess Chess Assistant"
3. Click "Remove"
4. Confirm removal

The extension files remain on disk and can be reloaded anytime.

## Privacy & Permissions

### Required Permissions

- **storage**: Save user settings (variant, depth)
- **scripting**: Inject content script on Lichess
- **host_permissions**: Access lichess.org pages

### Data Collection

This extension does NOT:
- ❌ Collect personal information
- ❌ Send data to external servers
- ❌ Track browsing history
- ❌ Use analytics

All processing happens locally in your browser.

## Getting Help

### Common Error Messages

**"Engine not ready"**
- Wait a few seconds for WASM to initialize
- Check service worker console for errors

**"Invalid FEN (error code: X)"**
- The position received is malformed
- Usually indicates a parsing issue
- Check content.js FEN building logic

**"Module not found: ./lib/ffish.js"**
- File path issue
- Verify lib/ffish.js exists
- Check manifest.json paths

### Viewing Logs

1. **Service Worker**: chrome://extensions/ → "service worker" link
2. **Content Script**: DevTools on Lichess page → Console
3. **Popup**: Right-click popup → "Inspect"

## Credits

- **Engine**: Fairy-Stockfish (Fabian Fichter, Johannes Czech)
- **WASM Library**: ffish-es6
- **Original Concept**: js-chess-engine by Josef Jadrny

## License

GPL-3.0 (same as Fairy-Stockfish)

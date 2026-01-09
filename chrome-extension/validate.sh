#!/bin/bash

# Chrome Extension Validation Script
# Validates the extension structure and files before loading into Chrome

set -e

EXTENSION_DIR="/home/runner/work/josechjs/josechjs/chrome-extension"
cd "$EXTENSION_DIR"

echo "🔍 Validating Chrome Extension..."
echo ""

# 1. Check manifest.json
echo "✓ Checking manifest.json..."
if ! python3 -m json.tool manifest.json > /dev/null 2>&1; then
    echo "❌ manifest.json is not valid JSON"
    exit 1
fi
echo "  ✓ Valid JSON"

# 2. Check required files
echo ""
echo "✓ Checking required files..."
REQUIRED_FILES=(
    "manifest.json"
    "background.js"
    "content.js"
    "popup/popup.html"
    "popup/popup.js"
    "lib/ffish.js"
    "lib/ffish.wasm"
    "icons/icon16.png"
    "icons/icon48.png"
    "icons/icon128.png"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "  ❌ Missing: $file"
        exit 1
    fi
    echo "  ✓ $file"
done

# 3. Check JavaScript syntax
echo ""
echo "✓ Validating JavaScript syntax..."
for jsfile in background.js content.js popup/popup.js; do
    if ! node --check "$jsfile" 2>&1; then
        echo "  ❌ Syntax error in $jsfile"
        exit 1
    fi
    echo "  ✓ $jsfile"
done

# 4. Check WASM file
echo ""
echo "✓ Checking WASM file..."
WASM_SIZE=$(stat -f%z "lib/ffish.wasm" 2>/dev/null || stat -c%s "lib/ffish.wasm" 2>/dev/null)
if [ "$WASM_SIZE" -lt 100000 ]; then
    echo "  ❌ ffish.wasm seems too small (${WASM_SIZE} bytes)"
    exit 1
fi
echo "  ✓ ffish.wasm (${WASM_SIZE} bytes)"

# 5. Check icons
echo ""
echo "✓ Validating icon files..."
for icon in icons/*.png; do
    if ! file "$icon" | grep -q "PNG image data"; then
        echo "  ❌ $icon is not a valid PNG"
        exit 1
    fi
    echo "  ✓ $icon"
done

echo ""
echo "✅ All validations passed!"
echo ""
echo "📦 Extension is ready to load in Chrome"
echo ""
echo "To install:"
echo "1. Open Chrome and go to chrome://extensions/"
echo "2. Enable 'Developer mode' (top-right toggle)"
echo "3. Click 'Load unpacked'"
echo "4. Select this directory: $EXTENSION_DIR"
echo ""

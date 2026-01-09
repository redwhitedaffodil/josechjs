// popup.js
document.addEventListener('DOMContentLoaded', async () => {
    const statusEl = document.getElementById('status');
    const variantEl = document.getElementById('variant');
    const depthEl = document.getElementById('depth');
    
    try {
        const status = await chrome.runtime.sendMessage({ type: "GET_STATUS" });
        
        if (status.engineReady) {
            statusEl.textContent = "✓ Engine ready";
            statusEl.className = "status ready";
            variantEl.value = status.variant;
            depthEl.value = status.depth.toString();
        } else {
            statusEl.textContent = "⏳ Engine loading...";
        }
    } catch (e) {
        statusEl.textContent = "❌ Error: " + e.message;
    }
    
    variantEl.addEventListener('change', saveSettings);
    depthEl.addEventListener('change', saveSettings);
    
    async function saveSettings() {
        const config = {
            variant: variantEl.value,
            searchDepth: parseInt(depthEl.value)
        };
        
        await chrome.runtime.sendMessage({ type: "SET_CONFIG", config });
        console.log("Settings saved:", config);
    }
});

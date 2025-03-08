// popup.js - updated with error handling
document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('toggleSwitch');
    const statusText = document.getElementById('statusText');
    const clearHistoryBtn = document.getElementById('clearHistory');

    // Check if current tab is a YouTube page
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const isYouTubePage = tabs[0]?.url?.includes('youtube.com');

        if (!isYouTubePage) {
            statusText.textContent = 'Open YouTube to use this extension';
            toggle.disabled = true;
            clearHistoryBtn.disabled = true;
            return;
        }

        // Load saved state
        chrome.storage.local.get(['extensionEnabled'], (result) => {
            // Default to true if not set
            if (result.extensionEnabled === undefined) {
                result.extensionEnabled = true;
                chrome.storage.local.set({ extensionEnabled: true });
            }

            // Update toggle state and status text
            toggle.disabled = false;
            clearHistoryBtn.disabled = false;
            toggle.checked = result.extensionEnabled;
            statusText.textContent = result.extensionEnabled ? 'Extension is Active 🟢' : 'Extension is Inactive 🔴';
        });
    });

    // Listen for messages from content script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "updateToggle") {
            toggle.checked = request.enabled;
            statusText.textContent = request.enabled ? 'Extension is Active 🟢' : 'Extension is Inactive 🔴';
        }
    });
// Notify content script of extension state
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0] || !tabs[0].id) return;

    chrome.tabs.sendMessage(tabs[0].id, { action: "getExtensionState" }, (response) => {
        // Check for error
        if (chrome.runtime.lastError) {
            console.log("Communication fallback:", chrome.runtime.lastError.message);
            // Fall back to stored state
            chrome.storage.local.get(['extensionEnabled'], (result) => {
                const isEnabled = result.extensionEnabled ?? true;
                toggle.checked = isEnabled;
                statusText.textContent = isEnabled ? 'Extension is Active 🟢' : 'Extension is Inactive 🔴';
            });
            return;
        }

        // If we got a response, use it
        if (response) {
            toggle.checked = response.enabled;
            statusText.textContent = response.enabled ? 'Extension is Active 🟢' : 'Extension is Inactive 🔴';
        }
    });
});

    // Save state on toggle
    toggle.addEventListener('change', () => {
        const isEnabled = toggle.checked;
        chrome.storage.local.set({ extensionEnabled: isEnabled }, () => {
            statusText.textContent = isEnabled ? 'Extension is Active 🟢' : 'Extension is Inactive 🔴';

            // Send state to content script with error handling
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0] && tabs[0].id) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        action: "toggleExtension",
                        enabled: isEnabled
                    }).catch(error => {
                        console.log("Communication error:", error);
                    });
                }
            });
        });
    });

    // Clear history button
    clearHistoryBtn.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: "clearHistory" });
        statusText.textContent = 'Clearing history...';
        setTimeout(() => {
            statusText.textContent = toggle.checked ? 'Extension is Active 🟢' : 'Extension is Inactive 🔴';
        }, 2000);
    });
});
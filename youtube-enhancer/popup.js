/**
 * YouTube Enhancer - Popup UI Controller
 * Manages extension toggle state and user interactions
 */

// Configuration constants
const CONFIG = {
    STATUS_UPDATE_DELAY: 2000,
    DEFAULT_ENABLED: true,
    ANIMATION_DURATION: 300
};

// UI state management
let isProcessingAction = false;

/**
 * Initialize popup UI when DOM is fully loaded
 */
document.addEventListener('DOMContentLoaded', () => {
    // Get UI elements
    const toggle = document.getElementById('toggleSwitch');
    const statusText = document.getElementById('statusText');
    const clearHistoryBtn = document.getElementById('clearHistory');
    const container = document.querySelector('.container');

    // Check if current tab is a YouTube page
    checkYouTubeTab()
        .then(isYouTube => {
            if (!isYouTube) {
                disableControls(toggle, clearHistoryBtn);
                updateStatus(statusText, 'Open YouTube to use this extension', 'warning');
                return;
            }

            // Initialize controls and state
            initializeExtensionState(toggle, statusText, clearHistoryBtn);
        })
        .catch(error => {
            console.error('Tab access error:', error);
            disableControls(toggle, clearHistoryBtn);
            updateStatus(statusText, 'Error accessing tab information', 'error');
        });

    // Listen for messages from content or background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "updateToggle") {
            toggle.checked = request.enabled;
            updateStatus(
                statusText,
                request.enabled ? 'Extension is Active 🟢' : 'Extension is Inactive 🔴',
                request.enabled ? 'active' : 'inactive'
            );
        } else if (request.action === "historyCleared") {
            updateStatus(statusText, 'History cleared successfully! ✓', 'success');

            // Reset status after delay
            setTimeout(() => {
                updateStatus(
                    statusText,
                    toggle.checked ? 'Extension is Active 🟢' : 'Extension is Inactive 🔴',
                    toggle.checked ? 'active' : 'inactive'
                );
            }, CONFIG.STATUS_UPDATE_DELAY);
        }
    });

    // Save state on toggle switch change
    toggle.addEventListener('change', () => {
        if (isProcessingAction) return;
        isProcessingAction = true;

        const isEnabled = toggle.checked;
        applyPulseAnimation(container);

        // Save state to storage
        chrome.storage.local.set({ extensionEnabled: isEnabled }, () => {
            updateStatus(
                statusText,
                isEnabled ? 'Extension is Active 🟢' : 'Extension is Inactive 🔴',
                isEnabled ? 'active' : 'inactive'
            );

            // Send state to content script
            sendMessageToActiveTab({
                action: "toggleExtension",
                enabled: isEnabled
            }).finally(() => {
                isProcessingAction = false;
            });
        });
    });

    // Clear history button action
    clearHistoryBtn.addEventListener('click', () => {
        if (isProcessingAction) return;
        isProcessingAction = true;

        clearHistoryBtn.classList.add('active');
        updateStatus(statusText, 'Clearing history...', 'processing');

        // Send clear history request
        chrome.runtime.sendMessage({ action: "clearHistory" }, (response) => {
            setTimeout(() => {
                clearHistoryBtn.classList.remove('active');
                isProcessingAction = false;

                if (chrome.runtime.lastError) {
                    updateStatus(statusText, 'Error clearing history', 'error');
                    console.error('History clearing error:', chrome.runtime.lastError);
                    return;
                }

                updateStatus(statusText, 'History cleared successfully! ✓', 'success');

                // Reset status after delay
                setTimeout(() => {
                    updateStatus(
                        statusText,
                        toggle.checked ? 'Extension is Active 🟢' : 'Extension is Inactive 🔴',
                        toggle.checked ? 'active' : 'inactive'
                    );
                }, CONFIG.STATUS_UPDATE_DELAY);
            }, 500); // Short delay for button animation
        });
    });
});

/**
 * Check if the active tab is a YouTube page
 * @returns {Promise<boolean>} Promise resolving to true if active tab is YouTube
 */
function checkYouTubeTab() {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
                return;
            }

            const activeTab = tabs[0];
            const isYouTubePage = activeTab?.url?.includes('youtube.com') || false;
            resolve(isYouTubePage);
        });
    });
}

/**
 * Initialize extension state from storage and active tab
 * @param {HTMLElement} toggle - Toggle switch element
 * @param {HTMLElement} statusText - Status text element
 * @param {HTMLElement} clearHistoryBtn - Clear history button
 */
function initializeExtensionState(toggle, statusText, clearHistoryBtn) {
    // Enable controls
    toggle.disabled = false;
    clearHistoryBtn.disabled = false;

    // First try to get state from content script (most accurate)
    sendMessageToActiveTab({ action: "getExtensionState" })
        .then(response => {
            if (response) {
                toggle.checked = response.enabled;
                updateStatus(
                    statusText,
                    response.enabled ? 'Extension is Active 🟢' : 'Extension is Inactive 🔴',
                    response.enabled ? 'active' : 'inactive'
                );
            }
        })
        .catch(() => {
            // Fall back to stored state if content script is not ready or error occurs
            chrome.storage.local.get(['extensionEnabled'], (result) => {
                const isEnabled = result.extensionEnabled ?? CONFIG.DEFAULT_ENABLED;

                // Save default if not set
                if (result.extensionEnabled === undefined) {
                    chrome.storage.local.set({ extensionEnabled: isEnabled });
                }

                toggle.checked = isEnabled;
                updateStatus(
                    statusText,
                    isEnabled ? 'Extension is Active 🟢' : 'Extension is Inactive 🔴',
                    isEnabled ? 'active' : 'inactive'
                );
            });
        });
}

/**
 * Update status text with appropriate styling
 * @param {HTMLElement} statusElement - Status text element
 * @param {string} message - Status message to display
 * @param {string} type - Status type (active, inactive, warning, error, success, processing)
 */
function updateStatus(statusElement, message, type) {
    // Remove all status classes
    statusElement.classList.remove('status-active', 'status-inactive', 'status-warning', 'status-error', 'status-success', 'status-processing');

    // Add appropriate class
    statusElement.classList.add(`status-${type}`);

    // Set text with animation
    statusElement.style.opacity = '0';
    setTimeout(() => {
        statusElement.textContent = message;
        statusElement.style.opacity = '1';
    }, 150);
}

/**
 * Disable UI controls and update their appearance
 * @param {HTMLElement} toggle - Toggle switch element
 * @param {HTMLElement} clearBtn - Clear history button
 */
function disableControls(toggle, clearBtn) {
    toggle.disabled = true;
    clearBtn.disabled = true;
    toggle.classList.add('disabled');
    clearBtn.classList.add('disabled');
}

/**
 * Send a message to the active tab with error handling
 * @param {Object} message - Message to send
 * @returns {Promise<any>} Promise resolving to the response
 */
function sendMessageToActiveTab(message) {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
                return;
            }

            const activeTab = tabs[0];
            if (!activeTab || !activeTab.id) {
                reject(new Error('No active tab found'));
                return;
            }

            chrome.tabs.sendMessage(activeTab.id, message, response => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                    return;
                }
                resolve(response);
            });
        });
    });
}

/**
 * Apply a subtle pulse animation to an element
 * @param {HTMLElement} element - Element to animate
 */
function applyPulseAnimation(element) {
    element.classList.add('pulse');
    setTimeout(() => {
        element.classList.remove('pulse');
    }, CONFIG.ANIMATION_DURATION);
}

// Improved checkYouTubeTab
async function checkYouTubeTab() {
    try {
        const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
        return !!tab?.url?.match(/^https?:\/\/(www\.)?youtube\.com/);
    } catch (error) {
        console.error('Tab check error:', error);
        return false;
    }
}

// Enhanced message handler
chrome.runtime.onMessage.addListener((request) => {
    if (request.action === "historyCleared") {
        updateStatus(statusText, 'History cleared successfully! ✓', 'success');
        setTimeout(() => {
            update
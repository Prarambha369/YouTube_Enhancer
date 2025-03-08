// Main content script that runs on YouTube pages
let styleElement = null;

// Initialize extension
function initializeExtension() {
  replaceVoiceSearch();
  chrome.runtime.sendMessage({ action: "contentScriptReady" });
  // Check initial state and apply
  chrome.storage.local.get(['extensionEnabled'], (result) => {
    const isEnabled = result.extensionEnabled ?? true;
    toggleExtensionFeatures(isEnabled);
  });
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "toggleExtension") {
    toggleExtensionFeatures(message.enabled);
  }
  else if (message.action === "getExtensionState") {
    chrome.storage.local.get(['extensionEnabled'], (result) => {
      sendResponse({ enabled: result.extensionEnabled ?? true });
    });
    return true; // Required for asynchronous response
  }
});

// Toggle extension features and manage CSS dynamically
function toggleExtensionFeatures(enabled) {
  document.body.classList.toggle('youtube-enhancer-enabled', enabled);

  if (enabled) {
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.textContent = `
                /* Make masthead transparent */
                body.youtube-enhancer-enabled #masthead > .ytd-masthead.style-scope {
                    background-color: transparent !important;
                }
                
                /* Center ytd-browse in the middle of the page */
                body.youtube-enhancer-enabled ytd-browse.ytd-page-manager.style-scope {
                    margin-left: auto !important;
                    margin-right: auto !important;
                    max-width: 1400px !important;
                    width: 95% !important;
                    display: block !important;
                }
                
                /* Override hiding rules */
                body.youtube-enhancer-enabled .ytd-rich-grid-renderer,
                body.youtube-enhancer-enabled ytd-rich-grid-renderer,
                body.youtube-enhancer-enabled ytd-two-column-browse-results-renderer ytd-rich-grid-renderer {
                    display: block !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                }
                
                /* Grid layout styles for 6 videos per row */
                body.youtube-enhancer-enabled .ytd-two-column-browse-results-renderer.style-scope > .ytd-rich-grid-renderer.style-scope {
                    display: grid !important;
                    grid-template-columns: repeat(6, 1fr) !important;
                    gap: 16px !important;
                    width: 100% !important;
                }
                
                body.youtube-enhancer-enabled ytd-rich-grid-renderer {
                    --ytd-rich-grid-items-per-row: 6 !important;
                }
                
                body.youtube-enhancer-enabled ytd-rich-grid-row {
                    display: flex !important;
                    flex-direction: row !important;
                    width: 100% !important;
                    flex-wrap: nowrap !important;
                }
                
                body.youtube-enhancer-enabled ytd-rich-item-renderer {
                    width: calc(100% / 6 - 16px) !important;
                    margin: 0 8px 16px !important;
                    min-width: 0 !important;
                    max-width: none !important;
                    flex: 1 1 calc(100% / 6 - 16px) !important;
                }
                
                body.youtube-enhancer-enabled ytd-thumbnail,
                body.youtube-enhancer-enabled #thumbnail {
                    width: 100% !important;
                }
                
                body.youtube-enhancer-enabled #video-title {
                    font-size: 13px !important;
                    line-height: 1.3 !important;
                }
      `;
      document.head.appendChild(styleElement);

      // Force style recalculation to apply changes immediately
      setTimeout(() => {
        document.body.style.transition = 'none';
        document.body.offsetHeight;
        document.body.style.transition = '';
      }, 100);
    }
  } else {
    if (styleElement) {
      styleElement.remove();
      styleElement = null;
    }
  }
}
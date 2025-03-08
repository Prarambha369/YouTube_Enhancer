/**
 * YouTube Enhancer - Content Script
 * Enhances the YouTube browsing experience with custom layouts and features
 */

// Centralized configuration
const CONFIG = {
  DEBOUNCE_TIME: 300,         // Milliseconds to wait before processing DOM changes
  GRID_COLUMNS: 6,            // Number of video columns in grid layout
  ITEM_GAP: 16,               // Gap between video items in px
  STYLE_REFRESH_DELAY: 100,   // Delay for style recalculation
  CUSTOM_CLASS: 'youtube-enhancer-enabled'
};

// Global variable to track the style element
let styleElement = null;

/**
 * Initialize the extension based on document readiness
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
  initializeExtension();
}

/**
 * Initialize the extension features
 */
function initializeExtension() {
  try {
    replaceVoiceSearch();
    const observer = setupMutationObserver();

    // Register cleanup handler
    window.addEventListener('beforeunload', () => {
      if (observer) observer.disconnect();
    });

    chrome.runtime.sendMessage({ action: "contentScriptReady" });

    // Check initial state and toggle features accordingly
    chrome.storage.local.get(['extensionEnabled'], (result) => {
      const isEnabled = result.extensionEnabled ?? true;
      toggleExtensionFeatures(isEnabled);
    });
  } catch (error) {
    logError('Initialization error', error);
  }
}

/**
 * Toggle extension features based on enabled state
 * @param {boolean} enabled - Whether the extension should be enabled
 */
function toggleExtensionFeatures(enabled) {
  try {
    document.body.classList.toggle(CONFIG.CUSTOM_CLASS, enabled);

    if (enabled) {
      injectStyles();
    } else {
      removeStyles();
    }
  } catch (error) {
    logError('Toggle features error', error);
  }
}

/**
 * Generate dynamic CSS styles based on configuration
 * @returns {string} - Generated CSS content
 */
function generateDynamicStyles() {
  return `
        /* Make masthead transparent */
        body.${CONFIG.CUSTOM_CLASS} #masthead > .ytd-masthead.style-scope {
            background-color: transparent !important;
        }
        
        /* Center ytd-browse in the middle of the page */
        body.${CONFIG.CUSTOM_CLASS} ytd-browse.ytd-page-manager.style-scope {
            margin-left: auto !important;
            margin-right: auto !important;
            max-width: 1400px !important;
            width: 95% !important;
            display: block !important;
        }
        
        /* CRITICAL: Override hiding rules */
        body.${CONFIG.CUSTOM_CLASS} .ytd-rich-grid-renderer,
        body.${CONFIG.CUSTOM_CLASS} ytd-rich-grid-renderer,
        body.${CONFIG.CUSTOM_CLASS} ytd-two-column-browse-results-renderer ytd-rich-grid-renderer {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
        }
        
        /* Grid layout styles */
        body.${CONFIG.CUSTOM_CLASS} #contents.ytd-rich-grid-renderer {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
        }
        
        body.${CONFIG.CUSTOM_CLASS} .ytd-two-column-browse-results-renderer.style-scope > .ytd-rich-grid-renderer.style-scope {
            display: grid !important;
            grid-template-columns: repeat(${CONFIG.GRID_COLUMNS}, 1fr) !important;
            gap: ${CONFIG.ITEM_GAP}px !important;
            width: 100% !important;
        }
        
        body.${CONFIG.CUSTOM_CLASS} ytd-rich-grid-renderer {
            --ytd-rich-grid-items-per-row: ${CONFIG.GRID_COLUMNS} !important;
        }
        
        body.${CONFIG.CUSTOM_CLASS} ytd-rich-grid-row {
            display: flex !important;
            flex-direction: row !important;
            width: 100% !important;
            flex-wrap: nowrap !important;
        }
        
        body.${CONFIG.CUSTOM_CLASS} ytd-rich-item-renderer {
            width: calc(100% / ${CONFIG.GRID_COLUMNS} - ${CONFIG.ITEM_GAP}px) !important;
            margin: 0 ${CONFIG.ITEM_GAP/2}px ${CONFIG.ITEM_GAP}px !important;
            min-width: 0 !important;
            max-width: none !important;
            flex: 1 1 calc(100% / ${CONFIG.GRID_COLUMNS} - ${CONFIG.ITEM_GAP}px) !important;
        }
        
        body.${CONFIG.CUSTOM_CLASS} ytd-thumbnail,
        body.${CONFIG.CUSTOM_CLASS} #thumbnail {
            width: 100% !important;
        }
        
        body.${CONFIG.CUSTOM_CLASS} #video-title {
            font-size: 13px !important;
            line-height: 1.3 !important;
        }
    `;
}

/**
 * Inject custom styles dynamically
 */
function injectStyles() {
  if (styleElement) return;

  try {
    styleElement = document.createElement('style');
    styleElement.id = 'youtube-enhancer-styles';
    styleElement.textContent = generateDynamicStyles();

    document.head.appendChild(styleElement);
    forceStyleRecalculation();
  } catch (error) {
    logError('Style injection error', error);
  }
}

/**
 * Remove injected styles
 */
function removeStyles() {
  try {
    if (styleElement) {
      styleElement.remove();
      styleElement = null;
    }
  } catch (error) {
    logError('Style removal error', error);
  }
}

/**
 * Force style recalculation
 */
function forceStyleRecalculation() {
  setTimeout(() => {
    try {
      document.body.style.transition = 'none';
      document.body.offsetHeight; // Trigger reflow
      document.body.style.transition = '';
    } catch (error) {
      logError('Style recalculation error', error);
    }
  }, CONFIG.STYLE_REFRESH_DELAY);
}

/**
 * Replace voice search button with history clear button
 */
function replaceVoiceSearch() {
  try {
    const voiceSearchButton = document.querySelector('#voice-search-button');
    if (!voiceSearchButton || document.querySelector('#enhanced-trash-button')) return;

    const trashButton = document.createElement('button');
    trashButton.id = 'enhanced-trash-button';
    trashButton.className = 'custom-button';
    trashButton.setAttribute('aria-label', 'Clear History');
    trashButton.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: transparent;
            border: none;
            cursor: pointer;
            padding: 8px;
            border-radius: 50%;
        `;

    // Optimized event handling for hover effects
    const handleTrashButtonHover = (e) => {
      e.currentTarget.style.backgroundColor = e.type === 'mouseover'
          ? 'rgba(255, 255, 255, 0.1)'
          : 'transparent';
    };

    trashButton.addEventListener('mouseover', handleTrashButtonHover);
    trashButton.addEventListener('mouseout', handleTrashButtonHover);

    const icon = document.createElement('img');
    icon.src = chrome.runtime.getURL('icons/trash.png');
    icon.alt = 'Clear History';
    icon.style.cssText = `
            width: 20px;
            height: 20px;
            filter: invert(100%);
        `;

    trashButton.appendChild(icon);
    trashButton.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: "clearHistory" });
    });

    voiceSearchButton.parentNode.replaceChild(trashButton, voiceSearchButton);
  } catch (error) {
    logError('Voice search button replacement error', error);
  }
}

/**
 * Set up MutationObserver for dynamic content
 * @returns {MutationObserver} - The created observer instance
 */
function setupMutationObserver() {
  try {
    const observerConfig = {
      childList: true,
      subtree: true
    };

    const observer = new MutationObserver((mutations) => {
      // Debounce function to avoid excessive calls
      if (observer.timeout) {
        clearTimeout(observer.timeout);
      }

      observer.timeout = setTimeout(() => {
        try {
          // Only try to replace the voice search button if needed
          if (!document.querySelector('#enhanced-trash-button')) {
            replaceVoiceSearch();
          }
        } catch (error) {
          logError('Mutation handler error', error);
        }
        observer.timeout = null;
      }, CONFIG.DEBOUNCE_TIME);
    });

    observer.observe(document.body, observerConfig);
    return observer;
  } catch (error) {
    logError('MutationObserver setup error', error);
    return null;
  }
}

/**
 * Log errors to console and send to background script
 * @param {string} context - Error context description
 * @param {Error} error - The error object
 */
function logError(context, error) {
  console.error(`YouTube Enhancer - ${context}:`, error);
  chrome.runtime.sendMessage({
    action: "logError",
    context: context,
    error: error.message,
    stack: error.stack
  });
}

// Message listener for extension state changes
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    if (message.action === 'toggleExtension') {
      toggleExtensionFeatures(message.enabled);
    } else if (message.action === 'getExtensionState') {
      chrome.storage.local.get(['extensionEnabled'], (result) => {
        try {
          sendResponse({ enabled: result.extensionEnabled ?? true });
        } catch (error) {
          logError('Get extension state error', error);
          sendResponse({ enabled: true, error: error.message });
        }
      });
      return true; // Keep message channel open for async response
    }
  } catch (error) {
    logError('Message handling error', error);
  }
});
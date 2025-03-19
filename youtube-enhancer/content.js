// ===========================
// YouTube Enhancer - Content Script
// Enhances the YouTube browsing experience with custom layouts, UI tweaks, and video controls.
// ===========================

/* ===========================
   Module: UI Enhancer
   - Handles custom CSS injection, voice search button replacement, and UI-related mutation observing.
   =========================== */
(() => {
  // Centralized configuration for UI enhancements
  const CONFIG = {
    DEBOUNCE_TIME: 300,         // Delay before processing DOM changes
    GRID_COLUMNS: 6,            // Number of video columns in grid layout
    ITEM_GAP: 16,               // Gap between video items (px)
    STYLE_REFRESH_DELAY: 100,   // Delay for style recalculation
    CUSTOM_CLASS: 'youtube-enhancer-enabled'
  };

  // Global variable to track the style element
  let styleElement = null;

  /**
   * Initialize UI enhancements when DOM is ready.
   */
  function initializeEnhancer() {
    try {
      replaceVoiceSearch();
      const observer = setupMutationObserver();

      // Cleanup observer on unload
      window.addEventListener('beforeunload', () => {
        if (observer) observer.disconnect();
      });

      // Notify background that content script is ready
      chrome.runtime.sendMessage({ action: "contentScriptReady" });

      // Check and apply extension enabled state
      chrome.storage.local.get(['extensionEnabled'], (result) => {
        const isEnabled = result.extensionEnabled ?? true;
        toggleExtensionFeatures(isEnabled);
      });
    } catch (error) {
      logError('UI Initialization error', error);
    }
  }

  /**
   * Toggle extension features (CSS/markup) based on enabled state.
   * @param {boolean} enabled
   */
  function toggleExtensionFeatures(enabled) {
    try {
      document.body.classList.toggle(CONFIG.CUSTOM_CLASS, enabled);
      enabled ? injectStyles() : removeStyles();
    } catch (error) {
      logError('Toggle features error', error);
    }
  }

  /**
   * Generate dynamic CSS based on configuration.
   * @returns {string}
   */
  function generateDynamicStyles() {
    return `
      /* Make masthead transparent */
      body.${CONFIG.CUSTOM_CLASS} #masthead > .ytd-masthead.style-scope {
          background-color: transparent !important;
      }
      /* Center ytd-browse on page */
      body.${CONFIG.CUSTOM_CLASS} ytd-browse.ytd-page-manager.style-scope {
          margin-left: auto !important;
          margin-right: auto !important;
          max-width: 1400px !important;
          width: 95% !important;
          display: block !important;
      }
      /* Override hiding rules */
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
   * Inject custom styles.
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
   * Remove injected styles.
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
   * Force a reflow to recalculate styles.
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
   * Replace the voice search button with a custom clear history button.
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

      // Handle hover effects
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
   * Set up a MutationObserver to watch for dynamic content changes.
   * @returns {MutationObserver}
   */
  function setupMutationObserver() {
    try {
      const observerConfig = { childList: true, subtree: true };
      const observer = new MutationObserver((mutations) => {
        if (observer.timeout) {
          clearTimeout(observer.timeout);
        }
        observer.timeout = setTimeout(() => {
          try {
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
   * Log errors to the console and send to the background script.
   * @param {string} context
   * @param {Error} error
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

  // Message listener for UI-related commands
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
        return true;
      }
    } catch (error) {
      logError('UI Message handling error', error);
    }
  });

  // Initialize UI enhancements when DOM is ready.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeEnhancer);
  } else {
    initializeEnhancer();
  }
})();

/* ===========================
   Module: Video Controller & Comment Enhancer
   - Handles video navigation, playback monitoring, chapter extraction,
     message communication for video controls, and comment subscriber count enhancements.
   =========================== */
(() => {
  // Global state for video monitoring
  let currentPosition = 0;
  let playerState = 'unstarted';
  let currentVideo = '';
  let chapterData = [];
  const DEBOUNCE_DELAY = 300;
  const ELEMENT_CHECK_INTERVAL = 1000;
  const VIDEO_PLAYER_SELECTOR = 'video.html5-main-video';
  const PLAYER_CONTAINER_SELECTOR = '#movie_player';
  const CHAPTER_CONTAINER_SELECTOR = 'div.ytp-chrome-bottom';

  /**
   * Initialize video controller functionalities.
   */
  function initializeVideoController() {
    console.log('YouTube Video Controller initialized');
    setupNavigationObserver();
    processCurrentPage();
    setupMessageListener();
    setupCommentEnhancer();
  }

  /**
   * Set up a MutationObserver to detect SPA navigation.
   */
  function setupNavigationObserver() {
    const videoObserver = new MutationObserver(debounce(() => {
      processCurrentPage();
    }, DEBOUNCE_DELAY));
    videoObserver.observe(document.body, { childList: true, subtree: true });
  }

  /**
   * Process the current page to detect a new video.
   */
  function processCurrentPage() {
    const url = window.location.href;
    if (url.includes('youtube.com/watch')) {
      const videoId = new URLSearchParams(window.location.search).get('v');
      if (videoId && videoId !== currentVideo) {
        currentVideo = videoId;
        console.log('New video detected:', videoId);
        setupVideoMonitoring();
        extractChapters();
      }
    }
  }

  /**
   * Monitor video playback events.
   */
  function setupVideoMonitoring() {
    const checkVideoElement = setInterval(() => {
      const videoElement = document.querySelector(VIDEO_PLAYER_SELECTOR);
      const playerContainer = document.querySelector(PLAYER_CONTAINER_SELECTOR);
      if (videoElement && playerContainer) {
        clearInterval(checkVideoElement);
        videoElement.addEventListener('timeupdate', handleTimeUpdate);
        videoElement.addEventListener('play', () => { playerState = 'playing'; });
        videoElement.addEventListener('pause', () => { playerState = 'paused'; });
        videoElement.addEventListener('ended', () => { playerState = 'ended'; });
        console.log('Video monitoring setup complete');
      }
    }, ELEMENT_CHECK_INTERVAL);
  }

  /**
   * Extract chapters from UI elements or the video description.
   */
  function extractChapters() {
    const checkChapterElements = setInterval(() => {
      const chapterContainer = document.querySelector(CHAPTER_CONTAINER_SELECTOR);
      if (chapterContainer) {
        try {
          // Placeholder: insert UI-based chapter extraction logic if available
          const extractedChapters = []; // Replace with actual extraction logic
          if (extractedChapters.length > 0) {
            chapterData = extractedChapters;
            console.log('Chapters extracted from UI:', chapterData);
            clearInterval(checkChapterElements);
            return;
          }
        } catch (error) {
          console.error('Error extracting chapters from UI:', error);
        }
      }
      // Fallback to description-based extraction
      const description = document.querySelector('#description-inline-expander');
      if (description) {
        try {
          chapterData = parseChaptersFromDescription(description.textContent);
          if (chapterData.length > 0) {
            console.log('Chapters extracted from description:', chapterData);
            clearInterval(checkChapterElements);
          }
        } catch (error) {
          console.error('Error extracting chapters from description:', error);
        }
      }
    }, ELEMENT_CHECK_INTERVAL);
  }

  /**
   * Parse chapters from description text using a regular expression.
   * @param {string} text
   * @returns {Array}
   */
  function parseChaptersFromDescription(text) {
    if (!text) return [];
    const lines = text.split('\n');
    const chapterRegex = /^((?:\d{1,2}:)?\d{1,2}:\d{2})\s+(.+)$/;
    const chapters = [];
    lines.forEach(line => {
      const match = line.match(chapterRegex);
      if (match) {
        const timeStr = match[1];
        const title = match[2].trim();
        const timeInSeconds = convertTimestampToSeconds(timeStr);
        chapters.push({ time: timeInSeconds, title: title });
      }
    });
    return chapters;
  }

  /**
   * Convert a timestamp (HH:MM:SS or MM:SS) to seconds.
   * @param {string} timestamp
   * @returns {number}
   */
  function convertTimestampToSeconds(timestamp) {
    const parts = timestamp.split(':').map(Number);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    return 0;
  }

  /**
   * Handle video time updates and check for chapter changes.
   * @param {Event} event
   */
  function handleTimeUpdate(event) {
    currentPosition = Math.floor(event.target.currentTime);
    if (chapterData.length > 0) {
      const currentChapter = chapterData.reduce((prev, curr) => {
        return (curr.time <= currentPosition && curr.time > prev.time) ? curr : prev;
      }, { time: -1, title: 'Introduction' });
      // Optionally update UI or notify background script of chapter changes
      // chrome.runtime.sendMessage({ type: 'chapterUpdate', chapter: currentChapter });
    }
  }

  /**
   * Set up message listener for video-related commands.
   */
  function setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.type) {
        case 'getVideoInfo':
          sendResponse({
            videoId: currentVideo,
            position: currentPosition,
            playerState: playerState,
            chapters: chapterData
          });
          break;
        case 'seekTo':
          if (message.time !== undefined) {
            const videoElement = document.querySelector(VIDEO_PLAYER_SELECTOR);
            if (videoElement) {
              videoElement.currentTime = message.time;
              sendResponse({ success: true });
            } else {
              sendResponse({ success: false, error: 'Video element not found' });
            }
          }
          break;
        case 'playPause':
          const video = document.querySelector(VIDEO_PLAYER_SELECTOR);
          if (video) {
            if (video.paused) {
              video.play();
            } else {
              video.pause();
            }
            sendResponse({ success: true, newState: video.paused ? 'paused' : 'playing' });
          } else {
            sendResponse({ success: false, error: 'Video element not found' });
          }
          break;
      }
      return true;
    });
  }

  /**
   * Enhance comments with subscriber count badges.
   */
  function setupCommentEnhancer() {
    const commentObserver = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1 && node.matches?.('ytd-comment-thread-renderer, ytd-comment-renderer')) {
            enhanceComment(node);
          }
        });
      });
    });
    commentObserver.observe(document.body, { childList: true, subtree: true });
  }

  /**
   * Fetch subscriber count for a given channel.
   * @param {string} channelId
   * @returns {Promise<string|null>}
   */
  const getSubscriberCount = async (channelId) => {
    try {
      const response = await fetch(`https://www.youtube.com/channel/${channelId}/about`);
      const text = await response.text();
      const match = text.match(/"subscriberCountText":\{"simpleText":"([^"]+)"\}/);
      return match ? match[1] : null;
    } catch (error) {
      console.error('Subscriber count fetch error:', error);
      return null;
    }
  };

  /**
   * Enhance a comment element by adding a subscriber count badge.
   * @param {Element} comment
   */
  async function enhanceComment(comment) {
    const authorLink = comment.querySelector('a#author-text');
    if (!authorLink) return;
    const channelId = new URL(authorLink.href).pathname.split('/').pop();
    const subCount = await getSubscriberCount(channelId);
    const existingBadge = comment.querySelector('.sub-count-badge');
    if (existingBadge) existingBadge.remove();
    if (subCount) {
      const badge = document.createElement('span');
      badge.className = 'sub-count-badge';
      badge.textContent = subCount;
      badge.style.cssText = `
        margin-left: 8px;
        padding: 2px 6px;
        background: rgba(0,0,0,0.1);
        border-radius: 4px;
        font-size: 0.9rem;
        color: #aaa;
      `;
      authorLink.parentNode.insertBefore(badge, authorLink.nextSibling);
    }
  }

  /**
   * Utility: Debounce function to limit the rate of function calls.
   * @param {Function} func
   * @param {number} delay
   * @returns {Function}
   */
  function debounce(func, delay) {
    let timeout;
    return function() {
      const context = this;
      const args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), delay);
    };
  }

  // Initialize video controller & comment enhancer when DOM is ready.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeVideoController);
  } else {
    initializeVideoController();
  }
})();

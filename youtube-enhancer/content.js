(function() {
  'use strict';

  const CONFIG = {
    CUSTOM_CLASS: 'youtube-enhancer-enabled'
  };

  let isExtensionEnabled = true;

  // Initialize the content script
  function initialize() {
    chrome.storage.sync.get(['extensionEnabled'], (result) => {
      isExtensionEnabled = result.extensionEnabled !== false;
      toggleExtensionFeatures(isExtensionEnabled);
    });

    // Listen for messages from the popup
    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === 'toggleExtension') {
        isExtensionEnabled = message.enabled;
        toggleExtensionFeatures(isExtensionEnabled);
      }
    });
  }

  // Toggle extension features based on the enabled state
  function toggleExtensionFeatures(enabled) {
    if (enabled) {
      document.body.classList.add(CONFIG.CUSTOM_CLASS);
      injectStyles();
      setupVideoMonitoring();
      new CommentSubscriberCount(); // Initialize subscriber count functionality
    } else {
      document.body.classList.remove(CONFIG.CUSTOM_CLASS);
      removeStyles();
    }
  }

  // Inject custom styles
  function injectStyles() {
    const styleElement = document.createElement('link');
    styleElement.rel = 'stylesheet';
    styleElement.href = chrome.runtime.getURL('vidplayer.css');
    document.head.appendChild(styleElement);

    const commentStyleElement = document.createElement('link');
    commentStyleElement.rel = 'stylesheet';
    commentStyleElement.href = chrome.runtime.getURL('subs-comment.css');
    document.head.appendChild(commentStyleElement);
  }

  // Remove injected styles
  function removeStyles() {
    // Logic to remove styles if needed
  }

  // Setup video monitoring
  function setupVideoMonitoring() {
    const videoElement = document.querySelector('video.html5-main-video');
    if (videoElement) {
      videoElement.addEventListener('play', () => {
        console.log('Video is playing');
      });
      // Additional event listeners can be added here
    }
  }

  // Initialize the content script when the DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();


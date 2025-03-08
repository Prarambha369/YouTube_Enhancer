// service-worker.js
    let youtubeTabIds = new Set();

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === "clearHistory") {
        chrome.tabs.create({ url: "https://www.youtube.com/feed/history", active: false }, (tab) => {
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['clear-history.js']
          });
        });
      }
      else if (request.action === "contentScriptReady" && sender.tab) {
        youtubeTabIds.add(sender.tab.id);
      }
    });

    // Track tab closures and removals
    chrome.tabs.onRemoved.addListener((tabId) => {
      youtubeTabIds.delete(tabId);
    });

    // Set default state on install
    chrome.runtime.onInstalled.addListener(() => {
      chrome.storage.local.set({
        extensionEnabled: true,
        learningProgress: {
          watch: 0,
          saved: 0,
          completed: 0
        }
      });
    });
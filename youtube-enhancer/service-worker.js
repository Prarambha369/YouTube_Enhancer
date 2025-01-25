// service-worker.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "clearHistory") {
    chrome.tabs.create({ url: "https://www.youtube.com/feed/history", active: false }, (tab) => {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['clear-history.js']
      });
    });
  }
});
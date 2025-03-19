// Function to toggle features based on the checkbox state
function toggleFeature(feature, isEnabled) {
    chrome.storage.sync.set({ [feature]: isEnabled }, () => {
        console.log(`${feature} is now ${isEnabled ? 'enabled' : 'disabled'}`);
        // Optionally, send a message to the content script to apply changes
        chrome.tabs.query({ url: '*://*.youtube.com/*' }, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, { action: 'toggleFeature', feature, enabled: isEnabled });
            });
        });
    });
}

// Add event listeners to feature toggles
document.querySelectorAll('.feature-toggle').forEach(toggle => {
    toggle.addEventListener('change', function() {
        const feature = this.getAttribute('data-feature');
        const isEnabled = this.checked;
        toggleFeature(feature, isEnabled);
    });
});
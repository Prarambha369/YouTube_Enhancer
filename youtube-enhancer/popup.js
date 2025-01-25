document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('toggleSwitch');
    const statusText = document.getElementById('statusText');

    // Load saved state
    chrome.storage.local.get(['extensionEnabled'], (result) => {
        const isEnabled = result.extensionEnabled ?? true;
        toggle.checked = isEnabled;
        statusText.textContent = isEnabled ? 'Extension is Active 🟢' : 'Extension is Inactive 🔴';
    });

    // Save state on toggle
    toggle.addEventListener('change', () => {
        const isEnabled = toggle.checked;
        chrome.storage.local.set({ extensionEnabled: isEnabled }, () => {
            statusText.textContent = isEnabled ? 'Extension is Active 🟢' : 'Extension is Inactive 🔴';

            // Send state to content script
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: "toggleExtension",
                    enabled: isEnabled
                });
            });
        });
    });
});
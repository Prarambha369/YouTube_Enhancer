// features/vidplayer.js
(function() {
    'use strict';

    function clearHistory() {
        const newTab = window.open('https://www.youtube.com/feed/history', '_blank');
        newTab.addEventListener('load', () => {
            setTimeout(() => {
                const clearButton = newTab.document.querySelector('button[aria-label="Clear all watch history"]');
                if (clearButton) {
                    clearButton.click();
                    setTimeout(() => {
                        const confirmButton = newTab.document.querySelector('yt-button-renderer.style-scope:nth-child(2) > a > tp-yt-paper-button');
                        if (confirmButton) {
                            confirmButton.click();
                            newTab.close();
                        }
                    }, 1000);
                } else {
                    console.error('Clear all watch history button not found');
                }
            }, 1000); // Increased delay for reliability
        });
    }

    function addButton() {
        if (document.querySelector('#vid-clear-history-btn')) return; // Prevent duplicates
        const button = document.createElement('button');
        button.id = 'vid-clear-history-btn';
        button.textContent = 'Clear History';
        button.style.cssText = 'margin-left: 10px; padding: 5px 10px; background-color: #ff0000; color: #ffffff; border: none; border-radius: 5px; cursor: pointer;';
        button.addEventListener('click', clearHistory);

        const searchContainer = document.querySelector('#masthead-container ytd-searchbox');
        if (searchContainer) {
            searchContainer.appendChild(button);
            console.log('Clear History button added by vid feature');
        } else {
            console.warn('Search container not found yet');
        }
    }

    function replaceVoiceSearch() {
        if (document.querySelector('#vid-clear-history-voice-btn')) return; // Prevent duplicates
        const button = document.createElement('button');
        button.id = 'vid-clear-history-voice-btn';
        const icon = document.createElement('img');
        icon.src = chrome.runtime.getURL('icons/trash.png'); // Use local icon
        icon.alt = 'Clear History';
        icon.style.cssText = 'width: 20px; height: 20px; margin: 0 5px;';
        button.appendChild(icon);
        button.style.cssText = 'display: flex; align-items: center; padding: 5px; background-color: transparent; border: none; cursor: pointer;';
        button.addEventListener('click', clearHistory);

        const voiceSearchButton = document.querySelector('yt-icon-button#voice-search-button');
        if (voiceSearchButton) {
            voiceSearchButton.parentNode.replaceChild(button, voiceSearchButton);
            console.log('Voice search replaced by vid feature');
        } else {
            console.warn('Voice search button not found yet');
        }
    }

    function init() {
        console.log('Initializing vid feature');
        const observer = new MutationObserver(() => {
            addButton();
            replaceVoiceSearch();
        });
        observer.observe(document.body, { childList: true, subtree: true });
        addButton(); // Initial attempt
        replaceVoiceSearch(); // Initial attempt
    }

    function cleanup() {
        const button = document.querySelector('#vid-clear-history-btn');
        if (button) button.remove();
        const voiceButton = document.querySelector('#vid-clear-history-voice-btn');
        if (voiceButton) voiceButton.remove();
        console.log('Cleaned up vid feature');
    }

    window.youtubeEnhancer = window.youtubeEnhancer || {};
    window.youtubeEnhancer.vid = { init, cleanup };
})();
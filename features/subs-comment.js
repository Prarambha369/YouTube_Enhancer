function init() {
    // Add robust extension context check
    const isValidContext = () => {
        try {
            return !!chrome.runtime?.id && !!chrome.runtime.sendMessage;
        } catch (e) {
            return false;
        }
    };

    if (!isValidContext()) {
        console.error('Extension context invalid - skipping initialization');
        return;
    }

    // Use proper error handling for chrome APIs
    try {
        chrome.runtime.sendMessage({ 
            action: 'getStorageData', 
            keys: ['extensionEnabled', 'commentEnhancementsEnabled'] 
        }, (result) => {
            // Add error checking for message response
            if (chrome.runtime.lastError) {
                console.log('Extension context lost during message:', chrome.runtime.lastError);
                return;
            }

            if (!result) return;

            if (result.extensionEnabled === false) return;

            if (result.commentEnhancementsEnabled !== false) {
                enhanceComments();
                addCommentCountDisplay();
            }

            enhanceSubscriptions();
            observeChanges();
        });
    } catch (error) {
        console.error('Chrome API error:', error);
    }
}

function observeChanges() {
    let observer;

    const safeDisconnect = () => {
        if (observer) {
            observer.disconnect();
            observer = null;
        }
    };

    const mutationCallback = (mutations) => {
        if (!isValidContext()) {
            safeDisconnect();
            return;
        }
        // ... rest of existing mutation handling ...
    };

    observer = new MutationObserver(mutationCallback);
    
    // Scope observation to comments section only
    const targetNode = document.querySelector(SELECTORS.COMMENTS_SECTION) || document.body;
    observer.observe(targetNode, {
        childList: true,
        subtree: true
    });

    // Cleanup on window unload
    window.addEventListener('unload', safeDisconnect);
} 
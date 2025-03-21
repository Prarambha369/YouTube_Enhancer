// features/shortsblock.js

(function() {
    'use strict';

    function init() {
        console.log('YouTube Enhancer: Initializing shortsblock feature');
        
        // Add delay to ensure page state is ready
        setTimeout(() => {
            if (window.location.pathname.startsWith('/shorts/')) {
                redirectToHomepage();
                return;
            }
            setupUrlChangeListener();
        }, 300); // 300ms delay to catch late redirects
        
        return cleanup;
    }

    function redirectToHomepage() {
        try {
            const currentUrl = new URL(window.location.href);
            if (!currentUrl.pathname.startsWith('/shorts/')) return;

            const videoId = currentUrl.pathname.split('/shorts/')[1]?.split('/')[0];
            if (!videoId) return;

            // Check if we've already redirected to avoid redirect loops
            const redirectKey = `ytEnhancerShortsBlocked_${videoId}`;
            if (sessionStorage.getItem(redirectKey)) return;
            sessionStorage.setItem(redirectKey, Date.now().toString());
            
            // Redirect to homepage
            const homeUrl = new URL('/', currentUrl.origin);
            
            // Use history.replaceState for smoother transition
            history.replaceState(null, '', homeUrl.toString());
            // Force reload to ensure proper page rendering
            window.location.reload();
        } catch (error) {
            console.error('YouTube Enhancer: Error in redirectToHomepage:', error);
        }
    }

    // Listen for URL changes to catch dynamic navigation to shorts
    function setupUrlChangeListener() {
        // Use the History API to detect URL changes
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;

        // Override pushState
        history.pushState = function() {
            originalPushState.apply(this, arguments);
            checkForShortsUrl();
        };

        // Override replaceState
        history.replaceState = function() {
            originalReplaceState.apply(this, arguments);
            checkForShortsUrl();
        };

        // Listen for popstate events (back/forward navigation)
        window.addEventListener('popstate', checkForShortsUrl);

        // Initial check
        checkForShortsUrl();
    }

    function checkForShortsUrl() {
        if (window.location.pathname.startsWith('/shorts/')) {
            redirectToHomepage();
        }
    }

    // Cleanup function for when feature is disabled
    function cleanup() {
        console.log('YouTube Enhancer: Cleaning up shortsblock feature');
        // Restore original History API methods if they were modified
        if (history.pushState.toString().includes('checkForShortsUrl')) {
            history.pushState = originalPushState;
        }
        if (history.replaceState.toString().includes('checkForShortsUrl')) {
            history.replaceState = originalReplaceState;
        }
        // Remove event listener
        window.removeEventListener('popstate', checkForShortsUrl);
    }

    // Store original methods for cleanup
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    // Register with YouTube Enhancer
    window.youtubeEnhancer = window.youtubeEnhancer || {};
    window.youtubeEnhancer.sblock = {
        init: init
    };
})();
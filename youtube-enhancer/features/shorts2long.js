// features/shorts2long.js

(function() {
    'use strict';

    function init() {
        const currentUrl = new URL(window.location.href);
        if (currentUrl.pathname.startsWith('/shorts/')) {
            const videoId = currentUrl.pathname.split('/shorts/')[1].split('/')[0];
            if (videoId) {
                const newUrl = new URL('/watch', currentUrl.origin);
                newUrl.searchParams.set('v', videoId);
                // Preserve other search parameters
                currentUrl.searchParams.forEach((value, key) => {
                    if (key !== 'v') {
                        newUrl.searchParams.set(key, value);
                    }
                });
                newUrl.hash = currentUrl.hash;
                window.location.replace(newUrl.toString());
            }
        }
        return null; // No cleanup needed
    }

    window.youtubeEnhancer = window.youtubeEnhancer || {};
    window.youtubeEnhancer.shorts2long = { init };
})();
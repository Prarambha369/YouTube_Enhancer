const clearHistory = () => {
    const observer = new MutationObserver((_, observer) => {
        const clearButton = document.querySelector('button[aria-label="Clear all watch history"]');
        if (clearButton) {
            observer.disconnect();
            clearButton.click();

            // Confirm button handler
            const confirmObserver = new MutationObserver((_, observer) => {
                const confirmButton = document.querySelector([
                    'tp-yt-paper-button[aria-label="Clear watch history"]',
                    'tp-yt-paper-button:has(yt-formatted-string:contains("CLEAR"))'
                ].join(','));

                if (confirmButton) {
                    confirmButton.click();
                    observer.disconnect();
                    setTimeout(() => window.close(), 1000);
                }
            });

            confirmObserver.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
};

// Start process
try {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', clearHistory);
    } else {
        clearHistory();
    }
} catch (error) {
    console.error('Clear history error:', error);
    window.close();
}
// clear-history.js
setTimeout(() => {
    const clearButton = document.querySelector('button[aria-label="Clear all watch history"]');
    if (clearButton) {
        clearButton.click();
        setTimeout(() => {
            document.querySelectorAll('tp-yt-paper-button').forEach(btn => {
                if (btn.innerText.includes('CLEAR')) btn.click();
            });
            window.close();
        }, 1000);
    }
}, 500);
// clear-history.js - Enhanced version based on Tampermonkey script
                 setTimeout(() => {
                     const clearButton = document.querySelector('button[aria-label="Clear all watch history"]');
                     if (clearButton) {
                         clearButton.click();
                         setTimeout(() => {
                             // Try multiple selector approaches for better reliability
                             const confirmButton = document.querySelector('yt-button-renderer.style-scope:nth-child(2) > a > tp-yt-paper-button');
                             const confirmButtons = Array.from(document.querySelectorAll('tp-yt-paper-button'));

                             if (confirmButton) {
                                 confirmButton.click();
                                 setTimeout(() => window.close(), 500);
                             } else {
                                 // Fallback to text-based search
                                 confirmButtons.forEach(btn => {
                                     if (btn.innerText.includes('CLEAR')) {
                                         btn.click();
                                         setTimeout(() => window.close(), 500);
                                     }
                                 });
                             }
                         }, 1000);
                     } else {
                         console.log("Clear button not found");
                         setTimeout(() => window.close(), 1500);
                     }
                 }, 1000);
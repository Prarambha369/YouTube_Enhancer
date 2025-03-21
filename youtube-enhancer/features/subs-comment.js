// YouTube Enhancer - Subscription & Comments Feature
        (function() {
            'use strict';

            // Configuration for subscription and comments features
            const SELECTORS = {
                COMMENTS_SECTION: 'ytd-comments#comments',
                SUBSCRIPTION_BUTTON: 'ytd-subscribe-button-renderer',
                COMMENTS_COUNT: 'ytd-comments-header-renderer #count',
                PINNED_COMMENT: 'ytd-comment-thread-renderer[is-pinned]',
                HEADER_AUTHOR: '#header-author',
                COMMENT_COUNT_DISPLAY: '#comment-count-display'
            };

            // Initialize the feature with proper error handling and context validation
            function init() {
                try {
                    // Validate browser environment
                    if (typeof window === 'undefined' || typeof document === 'undefined') {
                        throw new Error('Invalid browser environment');
                    }

                    // Validate Chrome API availability
                    if (typeof chrome === 'undefined' || !chrome?.runtime?.id) {
                        // Wait for Chrome APIs to be ready
                        setTimeout(init, 100);
                        return;
                    }

                    // Ensure we're in a valid extension context
                    if (!chrome.runtime?.getManifest()) {
                        throw new Error('Extension context invalid - unable to access manifest');
                    }

                    // Additional context validation
                    if (window.location.protocol !== 'chrome-extension:' && 
                        !window.location.href.startsWith('https://www.youtube.com')) {
                        throw new Error('Invalid context - extension must run on YouTube or in extension context');
                    }

                    // Initialize feature settings
                    chrome.runtime.sendMessage({ 
                        action: 'getStorageData', 
                        keys: ['extensionEnabled', 'commentEnhancementsEnabled'] 
                    }, (result) => {
                    // Add null check for result
                    if (result && result.extensionEnabled === false) return;

                    // Apply enhancements if enabled
                    if (result?.commentEnhancementsEnabled !== false) {
                        enhanceComments();
                        addCommentCountDisplay();
                    }

                    enhanceSubscriptions();
                    observeChanges();
                    });
                } catch (error) {
                    console.error('YouTube Enhancer initialization failed:', error.message);
                    return;
                }
            }

            // Add comment count display
            function addCommentCountDisplay() {
                const headerAuthor = document.querySelector(SELECTORS.HEADER_AUTHOR);
                if (!headerAuthor) return;

                // Check if comment count display already exists
                if (document.querySelector(SELECTORS.COMMENT_COUNT_DISPLAY)) return;

                // Get comment count
                const commentsCount = document.querySelector(SELECTORS.COMMENTS_COUNT);
                if (!commentsCount) return;

                // Create comment count display element
                const commentCountDisplay = document.createElement('div');
                commentCountDisplay.id = 'comment-count-display';
                commentCountDisplay.className = 'youtube-enhancer-comment-count';
                
                // Format the count
                const count = parseInt(commentsCount.textContent.replace(/[^0-9]/g, ''));
                const formattedCount = formatNumber(count);
                
                // Set the content
                commentCountDisplay.innerHTML = `
                    <span class="comment-count-icon">💬</span>
                    <span class="comment-count-text">${formattedCount} Comments</span>
                `;

                // Add to header author area
                headerAuthor.appendChild(commentCountDisplay);

    // Create subscriber count display element
    const subscriberCountDisplay = document.createElement('div');
    subscriberCountDisplay.className = 'youtube-enhancer-subscriber-count';
    // Get subscriber count from YouTube's DOM
    const subCountElement = document.querySelector('yt-formatted-string#subscriber-count');
    if (subCountElement) {
      const countText = subCountElement.textContent.replace(/[^0-9.]/g, '');
      const formattedSubs = formatNumber(parseFloat(countText));
      subscriberCountDisplay.innerHTML = `
        <span class="sub-icon">👥</span>
        <span class="sub-count">${formattedSubs} subs</span>
      `;
    } else {
      subscriberCountDisplay.textContent = 'Subscribers: N/A';
    }
    headerAuthor.appendChild(subscriberCountDisplay);
            }

            // Format number with K/M/B
            function formatNumber(num) {
                if (num >= 1000000000) {
                    return (num / 1000000000).toFixed(1) + 'B';
                }
                if (num >= 1000000) {
                    return (num / 1000000).toFixed(1) + 'M';
                }
                if (num >= 1000) {
                    return (num / 1000).toFixed(1) + 'K';
                }
                return num.toString();
            }

            // Enhance comments section
            function enhanceComments() {
                // Apply styling to comments section
                const commentsSection = document.querySelector(SELECTORS.COMMENTS_SECTION);
                if (commentsSection) {
                    commentsSection.classList.add('youtube-enhancer-comments');

                    // Highlight pinned comments
                    const pinnedComment = document.querySelector(SELECTORS.PINNED_COMMENT);
                    if (pinnedComment) {
                        pinnedComment.classList.add('youtube-enhancer-pinned-comment');
                    }
                }
            }

            // Enhance subscription button
            function enhanceSubscriptions() {
                const subButton = document.querySelector(SELECTORS.SUBSCRIPTION_BUTTON);
                if (subButton) {
                    subButton.classList.add('youtube-enhancer-subscription');
                }
            }

            // Observe DOM changes to apply enhancements to dynamically loaded content
            function observeChanges() {
                try {
                    const observer = new MutationObserver((mutations) => {
                        try {
                            // Check if comments section is added
                            const commentsSection = document.querySelector(SELECTORS.COMMENTS_SECTION);
                            if (commentsSection && !commentsSection.classList.contains('youtube-enhancer-comments')) {
                                enhanceComments();
                            }

                            // Check for subscription button changes
                            const subButton = document.querySelector(SELECTORS.SUBSCRIPTION_BUTTON);
                            if (subButton && !subButton.classList.contains('youtube-enhancer-subscription')) {
                                enhanceSubscriptions();
                            }

                            // Check for header author area and add comment count if needed
                            const headerAuthor = document.querySelector(SELECTORS.HEADER_AUTHOR);
                            if (headerAuthor && !document.querySelector(SELECTORS.COMMENT_COUNT_DISPLAY)) {
                                addCommentCountDisplay();
                            }
                        } catch (error) {
                            console.error('Error processing mutations:', error);
                            // Continue observing despite errors
                        }
                    });

                    // Start observing with error handling
                    observer.observe(document.body, {
                        childList: true,
                        subtree: true
                    });

                    // Cleanup function for observer
                    window.addEventListener('unload', () => {
                        try {
                            observer.disconnect();
                        } catch (error) {
                            console.error('Error disconnecting observer:', error);
                        }
                    });
                } catch (error) {
                    console.error('YouTube Enhancer initialization failed:', error.message);
                    return;
                }
            }

            // Initialize on page load
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', init);
            } else {
                init();
            }
        })();
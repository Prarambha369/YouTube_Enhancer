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

            // Initialize the feature
            function init() {
                // Check if extension is enabled through proper runtime connection
                if (!chrome.runtime?.id) {
                    console.error('Extension context invalid');
                    return;
                }

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
                const observer = new MutationObserver((mutations) => {
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
                });

                // Start observing
                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });
            }

            // Initialize on page load
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', init);
            } else {
                init();
            }
        })();
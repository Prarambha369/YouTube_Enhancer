// features/vidplayer.js
(function() {
    'use strict';

    // Configuration
    const config = {
        controlsTimeout: 2500,
        defaultVolume: 0.7,
        speedOptions: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],
        keyboardShortcuts: true,
        rememberSettings: true,
        enhancedUI: true,
        defaultGridSize: 6,  // Default number of videos per row
        minGridSize: 2,      // Minimum number of videos per row
        maxGridSize: 12      // Maximum number of videos per row
    };

    // State management
    let state = {
        initialized: false,
        player: null,
        controlsVisible: false,
        lastActivity: Date.now(),
        userPreferences: {},
        videoHistory: {},
        gridStyleAdded: false,
        currentGridSize: 6
    };

    // Initialize function that will be called when the feature is enabled
    function initialize() {
        if (state.initialized) return;
        
        console.log('VidPlayz: Initializing enhanced video player');
        
        // Hide distractions just once
        hideDistractions();
        
        // Load saved preferences
        loadUserPreferences();
        
        // Apply video grid layout
        initializeGridSystem();
        
        // Wait for YouTube player to be ready
        waitForYouTubePlayer()
            .then(setupEnhancedPlayer)
            .catch(err => console.error('VidPlayz: Error initializing', err));
        
        // Add global event listeners
        document.addEventListener('keydown', handleKeyboardShortcuts);
        document.addEventListener('mousemove', handleUserActivity);
        
        state.initialized = true;
        
        return cleanup; // Return cleanup function for content.js
    }

    // Initialize grid system as a separate function
    function initializeGridSystem() {
        // Load grid size preference
        const savedGridSize = state.userPreferences.gridSize || config.defaultGridSize;
        state.currentGridSize = savedGridSize;
        
        // Apply the grid layout with current size
        applyVideoGridLayout(state.currentGridSize);
        
        // Add grid control UI
        addGridControls();
    }

    // Add grid controls UI
    function addGridControls() {
        // Check if controls already exist
        if (document.querySelector('.vidplayz-grid-controls')) {
            return;
        }
        
        // Create grid controls container
        const gridControls = document.createElement('div');
        gridControls.className = 'vidplayz-grid-controls';
        gridControls.innerHTML = `
            <div class="vidplayz-grid-slider-container">
                <span class="vidplayz-grid-label">Videos per row: <span id="vidplayz-grid-value">${state.currentGridSize}</span></span>
                <input type="range" id="vidplayz-grid-slider" min="${config.minGridSize}" max="${config.maxGridSize}" value="${state.currentGridSize}" step="1">
            </div>
        `;
        
        // Style the grid controls
        const style = document.createElement('style');
        style.id = 'vidplayz-grid-controls-style';
        style.textContent = `
            .vidplayz-grid-controls {
                position: fixed;
                top: 60px;
                right: 20px;
                background-color: rgba(33, 33, 33, 0.8);
                padding: 10px 15px;
                border-radius: 8px;
                z-index: 9000;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
                transition: opacity 0.3s ease;
                display: flex;
                flex-direction: column;
            }
            
            .vidplayz-grid-slider-container {
                display: flex;
                flex-direction: column;
                width: 200px;
            }
            
            .vidplayz-grid-label {
                color: white;
                font-size: 14px;
                margin-bottom: 8px;
            }
            
            #vidplayz-grid-slider {
                width: 100%;
                height: 4px;
                -webkit-appearance: none;
                background: #555;
                outline: none;
                border-radius: 4px;
            }
            
            #vidplayz-grid-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                background: var(--vidplayZ-primary, #60f5ac);
                cursor: pointer;
            }
            
            .vidplayz-grid-controls:hover {
                opacity: 1;
            }
            
            @media (max-width: 768px) {
                .vidplayz-grid-controls {
                    top: 50px;
                    right: 10px;
                }
                
                .vidplayz-grid-slider-container {
                    width: 150px;
                }
            }
        `;
        
        // Add the controls and style to the page
        document.head.appendChild(style);
        document.body.appendChild(gridControls);
        
        // Add event listener for the slider
        const slider = document.getElementById('vidplayz-grid-slider');
        const valueDisplay = document.getElementById('vidplayz-grid-value');
        
        slider.addEventListener('input', function() {
            const newSize = parseInt(this.value);
            valueDisplay.textContent = newSize;
            state.currentGridSize = newSize;
            
            // Apply the new grid layout
            applyVideoGridLayout(newSize);
            
            // Save the preference
            state.userPreferences.gridSize = newSize;
            saveUserPreferences();
        });
        
        // Add auto-hide behavior
        let controlsTimeout;
        gridControls.style.opacity = '0.7';
        
        gridControls.addEventListener('mouseenter', () => {
            clearTimeout(controlsTimeout);
            gridControls.style.opacity = '1';
        });
        
        gridControls.addEventListener('mouseleave', () => {
            controlsTimeout = setTimeout(() => {
                gridControls.style.opacity = '0.7';
            }, 2000);
        });
        
        // Auto-hide after 5 seconds
        controlsTimeout = setTimeout(() => {
            gridControls.style.opacity = '0.7';
        }, 5000);
    }

    // Apply grid layout with specified number of videos per row
    function applyVideoGridLayout(gridSize) {
        // Remove any existing grid style
        const existingStyle = document.getElementById('vidplayz-grid-layout');
        if (existingStyle) {
            existingStyle.remove();
        }
        
        const gridStyle = document.createElement('style');
        gridStyle.id = 'vidplayz-grid-layout';
        gridStyle.textContent = `
            /* Preserve the page header avatar */
            .page-header-view-model-wiz__page-header-headline-image.yt-decorated-avatar-view-model-wiz {
                display: block !important;
                visibility: visible !important;
            }
            
            /* Set video grid to ${gridSize} per row */
            ytd-rich-grid-renderer #contents.ytd-rich-grid-renderer {
                display: grid !important;
                grid-template-columns: repeat(${gridSize}, 1fr) !important;
                grid-gap: 16px !important;
                padding: 16px !important;
            }
            
            /* Video item sizing adjustments */
            ytd-rich-item-renderer, 
            ytd-grid-video-renderer,
            ytd-compact-video-renderer {
                width: 100% !important;
                margin: 0 !important;
                display: flex !important;
                flex-direction: column !important;
                height: auto !important;
            }
            
            /* Force consistent thumbnail heights */
            ytd-thumbnail {
                width: 100% !important;
                aspect-ratio: 16/9 !important;
                margin-bottom: 8px !important;
            }
            
            /* Fix thumbnail images */
            ytd-thumbnail #thumbnail {
                width: 100% !important;
                height: 100% !important;
                object-fit: cover !important;
            }
            
            /* Fix the metadata section height */
            #meta, #details, #meta-contents {
                height: auto !important;
                flex: 1 !important;
            }
            
            /* Handle empty spaces left by hidden shorts */
            ytd-rich-grid-row:empty, 
            ytd-rich-item-renderer:empty {
                display: none !important;
            }
            
            /* Home page and search results grid */
            ytd-browse ytd-rich-grid-row,
            ytd-search ytd-item-section-renderer #contents {
                display: grid !important;
                grid-template-columns: repeat(${gridSize}, 1fr) !important;
                grid-gap: 16px !important;
                height: auto !important;
            }
            
            /* Responsive adjustments */
            @media (max-width: 1200px) {
                ytd-rich-grid-renderer #contents.ytd-rich-grid-renderer,
                ytd-browse ytd-rich-grid-row,
                ytd-search ytd-item-section-renderer #contents {
                    grid-template-columns: repeat(${Math.max(Math.floor(gridSize/1.5), config.minGridSize)}, 1fr) !important;
                }
            }
            
            @media (max-width: 768px) {
                ytd-rich-grid-renderer #contents.ytd-rich-grid-renderer,
                ytd-browse ytd-rich-grid-row,
                ytd-search ytd-item-section-renderer #contents {
                    grid-template-columns: repeat(${Math.max(Math.floor(gridSize/3), config.minGridSize)}, 1fr) !important;
                }
            }
        `;
        
        document.head.appendChild(gridStyle);
        state.gridStyleAdded = true;

        // Create mutation observer to apply grid layout to dynamically loaded content
        setupGridObserver();
    }

    // Setup observer for grid layout
    function setupGridObserver() {
        // Remove existing observer if any
        if (state.gridObserver) {
            state.gridObserver.disconnect();
        }
        
        // Create mutation observer to apply grid layout to dynamically loaded content
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList' && mutation.addedNodes.length) {
                    // Apply to grid containers
                    const gridContainers = document.querySelectorAll('ytd-rich-grid-renderer #contents, ytd-browse ytd-rich-grid-row, ytd-search ytd-item-section-renderer #contents');
                    gridContainers.forEach(grid => {
                        if (!grid.classList.contains('vidplayz-grid-modified')) {
                            grid.classList.add('vidplayz-grid-modified');
                        }
                    });
                    
                    // Fix any height inconsistencies that might occur
                    const thumbnails = document.querySelectorAll('ytd-thumbnail');
                    thumbnails.forEach(thumbnail => {
                        if (!thumbnail.hasAttribute('vidplayz-fixed')) {
                            thumbnail.setAttribute('vidplayz-fixed', 'true');
                        }
                    });
                }
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        // Store observer for cleanup
        state.gridObserver = observer;
    }

    // Hide distracting elements for a cleaner viewing experience
    function hideDistractions() {
        // Only add the style once
        if (document.getElementById('vidplayz-clean-view')) {
            return;
        }
        
        // Create a style element to hold our custom hiding rules
        const style = document.createElement('style');
        style.id = 'vidplayz-clean-view';
        style.textContent = `
            /* Hide guide/sidebar completely */
            #guide-content, 
            #guide, 
            #guide-inner-content,
            ytd-mini-guide-renderer,
            tp-yt-app-drawer {
                display: none !important;
            }
            
            /* Make the main content use full width */
            #content,
            #contentContainer,
            ytd-page-manager,
            ytd-browse,
            ytd-two-column-browse-results-renderer {
                margin-left: 0 !important;
                padding-left: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
            }
            
            /* Hide masthead ad banners */
            #masthead-ad {
                display: none !important;
            }
            
            /* Hide recommendations and comments when playing video */
            body.vidplayz-focus-mode ytd-watch-next-secondary-results-renderer {
                display: none !important;
            }
            
            /* Hide the mini guide */
            ytd-mini-guide-renderer {
                display: none !important;
            }
            
            /* Hide chips bar */
            ytd-feed-filter-chip-bar-renderer {
                display: none !important;
            }
            
            /* Other potential distractions */
            ytd-merch-shelf-renderer, 
            ytd-movie-offer-module-renderer,
            ytd-video-secondary-info-renderer yt-formatted-string.ytd-video-secondary-info-renderer:not(#description),
            .ytp-ce-element,
            .ytp-cards-button,
            #clarify-box,
            ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-structured-description"],
            ytd-info-panel-content-renderer
            {
                display: none !important;
            }
        `;
        
        document.head.appendChild(style);
    }

    // Add focus mode toggle button
    function addFocusModeButton() {
        const controlsRight = state.player.querySelector('.ytp-right-controls');
        if (!controlsRight) return;
        
        const focusModeButton = document.createElement('button');
        focusModeButton.className = 'ytp-button vidplayz-focus-button';
        focusModeButton.title = 'Focus Mode (Hide Recommendations)';
        focusModeButton.innerHTML = '<svg height="100%" viewBox="0 0 36 36"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-5v2h5v3h2v-5h-2v0zm-5-5h5V7h-2v3h-3v2z" fill="white"></path></svg>';
        
        let focusModeEnabled = false;
        
        focusModeButton.addEventListener('click', () => {
            focusModeEnabled = !focusModeEnabled;
            
            if (focusModeEnabled) {
                document.body.classList.add('vidplayz-focus-mode');
                focusModeButton.classList.add('active');
                showNotification('Focus mode enabled');
            } else {
                document.body.classList.remove('vidplayz-focus-mode');
                focusModeButton.classList.remove('active');
                showNotification('Focus mode disabled');
            }
        });
        
        controlsRight.insertBefore(focusModeButton, controlsRight.firstChild);
    }

    // Wait for YouTube player to be ready
    function waitForYouTubePlayer() {
        return new Promise((resolve) => {
            const checkForPlayer = () => {
                const player = document.querySelector('#movie_player');
                if (player) {
                    resolve(player);
                } else {
                    setTimeout(checkForPlayer, 200);
                }
            };
            checkForPlayer();
        });
    }

    // Setup enhanced player features
    function setupEnhancedPlayer(player) {
        state.player = player;
        
        // Apply custom styles
        applyCustomPlayerStyles();
        
        // Enhance player controls
        enhancePlayerControls();
        
        // Setup video event listeners
        setupVideoEventListeners();
        
        // Apply user preferences
        applyUserPreferences();
        
        // Add focus mode button
        addFocusModeButton();
        
        // Handle URL changes (for SPA navigation)
        setupNavigationObserver();
        
        console.log('VidPlayz: Enhanced player setup complete');
    }

    // Apply custom styles to player elements
    function applyCustomPlayerStyles() {
        // Add custom class to player
        state.player.classList.add('vidplayz-enhanced');
        
        // Make sure theater mode fills the screen properly
        document.documentElement.style.setProperty('--ytd-watch-flexy-theater-background', 'transparent');
        
        // Add video quality badge
        addQualityBadge();
    }

    // Enhance player controls with additional features
    function enhancePlayerControls() {
        // Add custom progress bar interaction
        enhanceProgressBar();
        
        // Add custom volume control
        enhanceVolumeControl();
        
        // Add screenshot button
        addScreenshotButton();
        
        // Add loop button
        addLoopButton();
        
        // Add custom speed control
        addSpeedControl();
    }

    // Setup video event listeners
    function setupVideoEventListeners() {
        // Get video element
        const video = state.player.querySelector('video');
        if (!video) return;
        
        // Save timestamp when video pauses
        video.addEventListener('pause', saveVideoTimestamp);
        
        // Save playback rate and volume
        video.addEventListener('ratechange', () => {
            state.userPreferences.playbackRate = video.playbackRate;
            saveUserPreferences();
        });
        
        video.addEventListener('volumechange', () => {
            state.userPreferences.volume = video.volume;
            state.userPreferences.muted = video.muted;
            saveUserPreferences();
        });
        
        // Handle video ended
        video.addEventListener('ended', handleVideoEnded);
    }

    // Setup navigation observer for SPA
    function setupNavigationObserver() {
        // YouTube is a single-page app, so we need to detect navigation
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // Check if URL has changed to a video page
                    if (window.location.pathname === '/watch') {
                        // Re-apply enhanced player
                        waitForYouTubePlayer()
                            .then(setupEnhancedPlayer)
                            .catch(err => console.error('VidPlayz: Error during navigation', err));
                    }
                }
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // Add quality badge to show current video resolution
    function addQualityBadge() {
        const qualityBadge = document.createElement('div');
        qualityBadge.className = 'vidplayz-quality-badge';
        qualityBadge.textContent = 'HD';
        
        // Insert badge into player
        const controls = state.player.querySelector('.ytp-chrome-bottom');
        if (controls) {
            controls.appendChild(qualityBadge);
        }
        
        // Update badge when quality changes
        updateQualityBadge();
    }

    // Update quality badge based on current video quality
    function updateQualityBadge() {
        // This requires accessing YouTube's internal APIs
        // We'll use MutationObserver to detect quality changes
        const qualityButton = state.player.querySelector('.ytp-settings-button');
        if (qualityButton) {
            const observer = new MutationObserver(() => {
                const qualityLabel = document.querySelector('.ytp-menuitem[role="menuitemradio"][aria-checked="true"] .ytp-menuitem-label');
                if (qualityLabel) {
                    const qualityText = qualityLabel.textContent;
                    const badge = document.querySelector('.vidplayz-quality-badge');
                    if (badge) {
                        badge.textContent = qualityText;
                    }
                }
            });
            
            observer.observe(qualityButton, { attributes: true });
        }
    }

    // Enhance progress bar for better seeking
    function enhanceProgressBar() {
        const progressBar = state.player.querySelector('.ytp-progress-bar');
        if (!progressBar) return;
        
        // Add preview thumbnail on hover
        const previewContainer = document.createElement('div');
        previewContainer.className = 'vidplayz-preview-container';
        
        const previewThumbnail = document.createElement('div');
        previewThumbnail.className = 'vidplayz-preview-thumbnail';
        
        const previewTimestamp = document.createElement('div');
        previewTimestamp.className = 'vidplayz-preview-timestamp';
        
        previewContainer.appendChild(previewThumbnail);
        previewContainer.appendChild(previewTimestamp);
        
        progressBar.parentNode.appendChild(previewContainer);
        
        // Show preview on hover
        progressBar.addEventListener('mousemove', (e) => {
            const rect = progressBar.getBoundingClientRect();
            const position = (e.clientX - rect.left) / rect.width;
            
            const video = state.player.querySelector('video');
            if (!video) return;
            
            const time = position * video.duration;
            previewTimestamp.textContent = formatTime(time);
            
            previewContainer.style.display = 'block';
            previewContainer.style.left = `${e.clientX - 40}px`;
        });
        
        progressBar.addEventListener('mouseleave', () => {
            previewContainer.style.display = 'none';
        });
    }

    // Enhance volume control
    function enhanceVolumeControl() {
        const volumePanel = state.player.querySelector('.ytp-volume-panel');
        if (!volumePanel) return;
        
        // Add volume percentage display
        const volumeDisplay = document.createElement('div');
        volumeDisplay.className = 'vidplayz-volume-display';
        
        volumePanel.appendChild(volumeDisplay);
        
        // Update volume display when volume changes
        const video = state.player.querySelector('video');
        if (video) {
            const updateVolumeDisplay = () => {
                const volumePercent = Math.round(video.volume * 100);
                volumeDisplay.textContent = video.muted ? 'Muted' : `${volumePercent}%`;
            };
            
            video.addEventListener('volumechange', updateVolumeDisplay);
            updateVolumeDisplay();
        }
    }

    // Add screenshot button
    function addScreenshotButton() {
        const controlsRight = state.player.querySelector('.ytp-right-controls');
        if (!controlsRight) return;
        
        const screenshotButton = document.createElement('button');
        screenshotButton.className = 'ytp-button vidplayz-screenshot-button';
        screenshotButton.title = 'Take Screenshot';
        screenshotButton.innerHTML = '<svg height="100%" viewBox="0 0 36 36"><path d="M18 8c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"></path><path d="M18 3C10.3 3 4 9.3 4 17s6.3 14 14 14 14-6.3 14-14S25.7 3 18 3zm0 22c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z"></path></svg>';
        
        screenshotButton.addEventListener('click', takeScreenshot);
        controlsRight.insertBefore(screenshotButton, controlsRight.firstChild);
    }

    // Take screenshot of current video frame
    function takeScreenshot() {
        const video = state.player.querySelector('video');
        if (!video) return;
        
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        try {
            // Try to download the screenshot
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = `youtube-screenshot-${Date.now()}.png`;
            link.click();
            
            // Show success message
            showNotification('Screenshot saved!');
        } catch (e) {
            console.error('Failed to take screenshot:', e);
            showNotification('Failed to take screenshot', true);
        }
    }

    // Add loop button
    function addLoopButton() {
        const controlsRight = state.player.querySelector('.ytp-right-controls');
        if (!controlsRight) return;
        
        const loopButton = document.createElement('button');
        loopButton.className = 'ytp-button vidplayz-loop-button';
        loopButton.title = 'Loop Video';
        loopButton.innerHTML = '<svg height="100%" viewBox="0 0 36 36"><path d="M 26 10 L 26 6 L 22 10 L 26 14 L 26 10 z M 26 18 C 26 22.4 22.4 26 18 26 C 13.6 26 10 22.4 10 18 C 10 13.6 13.6 10 18 10 L 22 10 L 22 14 L 30 7 L 22 0 L 22 4 L 18 4 C 10.3 4 4 10.3 4 18 C 4 25.7 10.3 32 18 32 C 25.7 32 32 25.7 32 18 L 26 18 z"></path></svg>';
        
        let loopEnabled = false;
        
        loopButton.addEventListener('click', () => {
            const video = state.player.querySelector('video');
            if (!video) return;
            
            loopEnabled = !loopEnabled;
            video.loop = loopEnabled;
            
            // Update button appearance
            if (loopEnabled) {
                loopButton.classList.add('active');
                showNotification('Loop enabled');
            } else {
                loopButton.classList.remove('active');
                showNotification('Loop disabled');
            }
        });
        
        controlsRight.insertBefore(loopButton, controlsRight.firstChild);
    }

    // Add custom speed control
    function addSpeedControl() {
        const controlsRight = state.player.querySelector('.ytp-right-controls');
        if (!controlsRight) return;
        
        const speedButton = document.createElement('button');
        speedButton.className = 'ytp-button vidplayz-speed-button';
        speedButton.title = 'Playback Speed';
        speedButton.innerHTML = '<span>1x</span>';
        
        // Create speed menu
        const speedMenu = document.createElement('div');
        speedMenu.className = 'vidplayz-speed-menu';
        
        // Add speed options
        config.speedOptions.forEach(speed => {
            const option = document.createElement('div');
            option.className = 'vidplayz-speed-option';
            option.textContent = `${speed}x`;
            option.dataset.speed = speed;
            
            option.addEventListener('click', () => {
                const video = state.player.querySelector('video');
                if (!video) return;
                
                video.playbackRate = speed;
                speedButton.querySelector('span').textContent = `${speed}x`;
                speedMenu.style.display = 'none';
            });
            
            speedMenu.appendChild(option);
        });
        
        // Toggle speed menu on click
        speedButton.addEventListener('click', (e) => {
            e.stopPropagation();
            
            if (speedMenu.style.display === 'block') {
                speedMenu.style.display = 'none';
            } else {
                speedMenu.style.display = 'block';
                
                // Position menu
                const rect = speedButton.getBoundingClientRect();
                speedMenu.style.top = `${rect.bottom}px`;
                speedMenu.style.left = `${rect.left}px`;
            }
        });
        
        // Hide menu when clicking elsewhere
        document.addEventListener('click', () => {
            speedMenu.style.display = 'none';
        });
        
        // Update speed button text when speed changes
        const video = state.player.querySelector('video');
        if (video) {
            video.addEventListener('ratechange', () => {
                speedButton.querySelector('span').textContent = `${video.playbackRate}x`;
            });
        }
        
        controlsRight.insertBefore(speedButton, controlsRight.firstChild);
        document.body.appendChild(speedMenu);
    }

    // Handle keyboard shortcuts
    function handleKeyboardShortcuts(e) {
        if (!config.keyboardShortcuts || !state.initialized) return;
        
        // Don't capture when user is typing in an input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
        
        const video = state.player?.querySelector('video');
        if (!video) return;
        
        switch (e.key) {
            case 'S':
                // Shift+S for screenshot
                if (e.shiftKey) {
                    e.preventDefault();
                    takeScreenshot();
                }
                break;
            case 'L':
                // Shift+L for loop toggle
                if (e.shiftKey) {
                    e.preventDefault();
                    video.loop = !video.loop;
                    showNotification(`Loop ${video.loop ? 'enabled' : 'disabled'}`);
                }
                break;
            case '[':
                // Decrease speed
                e.preventDefault();
                const slowIndex = config.speedOptions.indexOf(video.playbackRate) - 1;
                if (slowIndex >= 0) {
                    video.playbackRate = config.speedOptions[slowIndex];
                }
                break;
            case ']':
                // Increase speed
                e.preventDefault();
                const fastIndex = config.speedOptions.indexOf(video.playbackRate) + 1;
                if (fastIndex < config.speedOptions.length) {
                    video.playbackRate = config.speedOptions[fastIndex];
                }
                break;
            case 'F':
                // Shift+F for focus mode toggle
                if (e.shiftKey) {
                    e.preventDefault();
                    const focusButton = document.querySelector('.vidplayz-focus-button');
                    if (focusButton) {
                        focusButton.click();
                    }
                }
                break;
        }
    }

    // Show notification
    function showNotification(message, isError = false) {
        const notification = document.createElement('div');
        notification.className = `vidplayz-notification ${isError ? 'error' : ''}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.add('visible');
        }, 10);
        
        // Remove after delay
        setTimeout(() => {
            notification.classList.remove('visible');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    // Handle user activity for controls visibility
    function handleUserActivity() {
        state.lastActivity = Date.now();
        state.controlsVisible = true;
        
        // Show controls
        if (state.player) {
            state.player.classList.remove('vidplayz-controls-hidden');
        }
        
        // Hide controls after inactivity
        clearTimeout(state.controlsTimeout);
        state.controlsTimeout = setTimeout(() => {
            if (state.player && !state.player.paused) {
                state.player.classList.add('vidplayz-controls-hidden');
                state.controlsVisible = false;
            }
        }, config.controlsTimeout);
    }

    // Save video timestamp when paused
    function saveVideoTimestamp() {
        if (!config.rememberSettings) return;
        
        const video = state.player?.querySelector('video');
        if (!video) return;
        
        // Get video ID from URL
        const videoId = new URL(window.location.href).searchParams.get('v');
        if (!videoId) return;
        
        // Save current timestamp
        state.videoHistory[videoId] = {
            timestamp: video.currentTime,
            duration: video.duration,
            lastPlayed: Date.now()
        };
        
        // Save to storage
        chrome.storage.local.set({ 'vidplayz_history': state.videoHistory });
    }

    // Handle video ended
    function handleVideoEnded() {
        const video = state.player?.querySelector('video');
        if (!video) return;
        
        // If loop is enabled, we don't need to do anything
        if (video.loop) return;
        
        // Show end screen overlay with replay button
        const overlay = document.createElement('div');
        overlay.className = 'vidplayz-end-overlay';
        
        const replayButton = document.createElement('button');
        replayButton.className = 'vidplayz-replay-button';
        replayButton.textContent = 'Replay';
        replayButton.addEventListener('click', () => {
            video.currentTime = 0;
            video.play();
            overlay.remove();
        });
        
        overlay.appendChild(replayButton);
        state.player.appendChild(overlay);
    }

    // Load user preferences from storage
    function loadUserPreferences() {
        if (!config.rememberSettings) return;
        
        chrome.storage.sync.get('vidplayz_preferences', function(result) {
            if (result.vidplayz_preferences) {
                state.userPreferences = result.vidplayz_preferences;
                
                // Apply grid size if saved
                if (state.userPreferences.gridSize) {
                    state.currentGridSize = state.userPreferences.gridSize;
                }
            }
        });
        
        chrome.storage.local.get('vidplayz_videoHistory', function(result) {
            if (result.vidplayz_videoHistory) {
                state.videoHistory = result.vidplayz_videoHistory;
            }
        });
    }

    // Apply user preferences to player
    function applyUserPreferences() {
        if (!config.rememberSettings) return;
        
        const video = state.player?.querySelector('video');
        if (!video) return;
        
        // Apply saved playback rate
        if (state.userPreferences.playbackRate) {
            video.playbackRate = state.userPreferences.playbackRate;
        }
        
        // Apply saved volume
        if (state.userPreferences.volume !== undefined) {
            video.volume = state.userPreferences.volume;
        }
        
        if (state.userPreferences.muted !== undefined) {
            video.muted = state.userPreferences.muted;
        }
        
        // Resume from last position
        const videoId = new URL(window.location.href).searchParams.get('v');
        if (videoId && state.videoHistory[videoId]) {
            const savedTime = state.videoHistory[videoId].timestamp;
            if (savedTime && savedTime < video.duration - 10) {
                video.currentTime = savedTime;
            }
        }
    }

    // Save user preferences to storage
    function saveUserPreferences() {
        if (!config.rememberSettings) return;
        
        chrome.storage.sync.set({ 'vidplayz_preferences': state.userPreferences });
    }

    // Helper function to format time in MM:SS format
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    // Cleanup function (called when feature is disabled)
    function cleanup() {
        if (!state.initialized) return;
        
        console.log('VidPlayz: Cleaning up enhanced player');
        
        // Remove event listeners
        document.removeEventListener('keydown', handleKeyboardShortcuts);
        document.removeEventListener('mousemove', handleUserActivity);
        
        // Stop the grid observer
        if (state.gridObserver) {
            state.gridObserver.disconnect();
        }
        
        // Remove grid controls
        const gridControls = document.querySelector('.vidplayz-grid-controls');
        if (gridControls) {
            gridControls.remove();
        }
        
        const gridControlsStyle = document.getElementById('vidplayz-grid-controls-style');
        if (gridControlsStyle) {
            gridControlsStyle.remove();
        }
        
        // Remove custom UI elements
        document.querySelectorAll('.vidplayz-notification, .vidplayz-speed-menu, .vidplayz-end-overlay').forEach(el => el.remove());
        
        // Remove custom styles
        const cleanViewStyle = document.getElementById('vidplayz-clean-view');
        if (cleanViewStyle) {
            cleanViewStyle.remove();
        }
        
        const gridLayoutStyle = document.getElementById('vidplayz-grid-layout');
        if (gridLayoutStyle) {
            gridLayoutStyle.remove();
        }
        
        // Remove focus mode class if active
        document.body.classList.remove('vidplayz-focus-mode');
        
        // Remove custom classes
        if (state.player) {
            state.player.classList.remove('vidplayz-enhanced', 'vidplayz-controls-hidden');
        }
        
        // Remove custom buttons
        document.querySelectorAll('.vidplayz-screenshot-button, .vidplayz-loop-button, .vidplayz-speed-button, .vidplayz-focus-button, .vidplayz-quality-badge, .vidplayz-volume-display').forEach(el => el.remove());
        
        // Save current preferences before disabling
        saveVideoTimestamp();
        saveUserPreferences();
        
        state.initialized = false;
    }

    // Entry point - return initialize function
    return initialize();
})();
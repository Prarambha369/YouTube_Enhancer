function createStatusPanel() {
  const panel = document.createElement('div');
  panel.id = 'enhanced-status-panel';
  panel.innerHTML = `
    <div class="status-header">完成情况查询</div>
    <div class="status-item">
      <span>观看进度</span>
      <span id="watch-progress">0%</span>
    </div>
    <div class="status-item">
      <span>收藏内容</span>
      <span id="saved-items">0</span>
    </div>
    <div class="status-item">
      <span>学习目标</span>
      <span id="learning-goal">0/5</span>
    </div>
  `;

  // Add dynamic updates
  chrome.storage.local.get(['learningProgress'], (result) => {
    document.getElementById('watch-progress').textContent =
        `${result.learningProgress?.watch || 0}%`;
    document.getElementById('saved-items').textContent =
        result.learningProgress?.saved || 0;
    document.getElementById('learning-goal').textContent =
        `${result.learningProgress?.completed || 0}/5`;
  });

  document.body.appendChild(panel);
}

// Add to initialization
function initializeExtension() {
  addHistoryButton();
  injectCustomCSS();
  createStatusPanel();
  setupVideoTracking();
}

// Add video progress tracking
function setupVideoTracking() {
  const video = document.querySelector('video');
  if (video) {
    video.addEventListener('timeupdate', () => {
      const progress = (video.currentTime / video.duration * 100).toFixed(1);
      chrome.storage.local.set({
        learningProgress: {
          watch: progress,
          saved: Math.floor(Math.random() * 10), // Example data
          completed: Math.floor(progress / 20)
        }
      });
    });
  }
}
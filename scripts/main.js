(function () {
  'use strict';

  const App = {
    carouselItems: [],
    positions: ['pos-1', 'pos-2', 'pos-3', 'pos-4', 'pos-5'],
    videoPlayer: null,
    videoTitleElement: null,
    loadingStatus: null,
    loadingBar: null,
    loadingProgress: null,
    isLoading: false,
    stalledCount: 0,
    lastClickTime: 0,
    MAX_STALLED_RETRIES: 3,
    listenersSetup: false,
    TITLE_MAP: {
      'videos/video1.mp4': '入站必刷',
      'videos/video2.mp4': '扫地机器人测评',
      'videos/video3.mp4': '战神反击战1',
      'videos/video4.mp4': '厕所二战',
      'videos/video5.mp4': '战神反击战2'
    },

    rotateCarousel() {
      this.positions.unshift(this.positions.pop());
      if (!this.carouselItems || this.carouselItems.length === 0) return;
      this.carouselItems.forEach((item, index) => {
        // remove existing pos-* classes then add the new one
        this.positions.forEach(p => item.classList.remove(p));
        item.classList.add(this.positions[index]);
      });
    },

    loadAndPlayVideo(videoSrc, videoTitle) {
      const now = Date.now();
      if (now - this.lastClickTime < 500) return;
      this.lastClickTime = now;

      if (!this.videoPlayer) this.videoPlayer = document.getElementById('main-video');
      if (!this.videoTitleElement) this.videoTitleElement = document.getElementById('current-video-title');
      if (!this.loadingStatus) this.loadingStatus = document.getElementById('loading-status');
      if (!this.loadingBar) this.loadingBar = document.getElementById('loading-bar');
      if (!this.loadingProgress) this.loadingProgress = document.getElementById('loading-progress');

      if (!videoSrc || typeof videoSrc !== 'string') return;
      if (!this.videoPlayer) return;

      // ensure listeners are hooked once
      if (!this.listenersSetup) {
        this.setupVideoEventListeners();
        this.listenersSetup = true;
      }

      if (this.isLoading) return;
      this.isLoading = true;
      this.stalledCount = 0;

      const mappedTitle = this.TITLE_MAP[videoSrc];
      const titleToShow = videoTitle || mappedTitle || '未知视频';
      if (this.videoTitleElement) this.videoTitleElement.textContent = titleToShow;

      try { this.videoPlayer.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) { }

      try {
        this.videoPlayer.pause();

        const sourceEl = this.videoPlayer.querySelector('source');
        if (sourceEl) {
          sourceEl.setAttribute('src', videoSrc);
        } else {
          this.videoPlayer.src = videoSrc;
        }

        this.showLoadingStatus();

        this.videoPlayer.load();

        const playPromise = this.videoPlayer.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.warn('自动播放被阻止或中断:', error);
          });
        }

      } catch (error) {
        console.error('切换出错:', error);
        this.loadingStatus && (this.loadingStatus.textContent = '加载失败');
        this.isLoading = false;
      }
    },

    showLoadingStatus() {
      if (!this.loadingStatus || !this.loadingBar || !this.loadingProgress) return;
      this.loadingStatus.textContent = '正在加载...';
      this.loadingBar.style.display = 'block';
      this.loadingProgress.style.width = '0%';
    },

    hideLoadingStatus(force) {
      if (!this.loadingBar || !this.loadingProgress || !this.loadingStatus) return;
      // only hide when forced or when buffer indicates readiness
      if (force) {
        this.loadingProgress.style.width = '100%';
        this.loadingBar.style.display = 'none';
        requestAnimationFrame(() => { this.loadingStatus.textContent = '准备就绪'; });
      }
    },

    setupVideoEventListeners() {
      if (!this.videoPlayer) return;

      this.videoPlayer.addEventListener('progress', () => {
        try {
          if (this.videoPlayer.buffered.length > 0 && this.videoPlayer.duration > 0) {
            const bufferedEnd = this.videoPlayer.buffered.end(this.videoPlayer.buffered.length - 1);
            const percent = (bufferedEnd / this.videoPlayer.duration) * 100;
            if (this.loadingProgress) this.loadingProgress.style.width = Math.min(percent, 100) + '%';
          }
        } catch (e) { }
      });

      this.videoPlayer.addEventListener('waiting', () => { if (this.loadingBar && this.loadingBar.style.display !== 'none') this.loadingStatus.textContent = '缓冲中...'; });
      this.videoPlayer.addEventListener('canplay', () => { if (this.loadingBar && this.loadingBar.style.display !== 'none') this.loadingStatus.textContent = '可以播放'; });
      this.videoPlayer.addEventListener('playing', () => { this.hideLoadingStatus(true); this.stalledCount = 0; this.isLoading = false; });

      this.videoPlayer.addEventListener('loadedmetadata', () => {
        this.hideLoadingStatus(true);
        this.isLoading = false;
        try { this.videoPlayer.currentTime = 0; } catch (e) { }
      });

      this.videoPlayer.addEventListener('ended', () => {
        if (this.loadingStatus) this.loadingStatus.textContent = '播放完成';
        setTimeout(() => { if (this.loadingStatus) this.loadingStatus.textContent = '准备就绪'; }, 2000);
      });

      this.videoPlayer.addEventListener('error', () => {
        if (this.videoTitleElement) this.videoTitleElement.textContent = '视频加载失败';
        this.hideLoadingStatus(true); this.isLoading = false;
      });

      this.videoPlayer.addEventListener('stalled', () => {
        this.stalledCount++;
        if (this.stalledCount <= this.MAX_STALLED_RETRIES) {
          console.log('缓冲停滞，尝试恢复...');
          if (this.loadingStatus) this.loadingStatus.textContent = '缓冲停滞，尝试恢复...';
          try { this.videoPlayer.load(); this.videoPlayer.play().catch(() => { }); } catch (e) { }
        } else {
          if (this.loadingStatus) this.loadingStatus.textContent = '缓冲失败，请重试';
          this.isLoading = false;
        }
      });

      this.videoPlayer.addEventListener('canplaythrough', () => { this.hideLoadingStatus(true); this.isLoading = false; this.stalledCount = 0; });
    },

    init() {
      this.carouselItems = Array.from(document.querySelectorAll('.carousel-item'));
      this.videoPlayer = document.getElementById('main-video');
      this.videoTitleElement = document.getElementById('current-video-title');
      this.loadingStatus = document.getElementById('loading-status');
      this.loadingBar = document.getElementById('loading-bar');
      this.loadingProgress = document.getElementById('loading-progress');

      if (!this.videoPlayer) return;
      this.setupVideoEventListeners();
      this.listenersSetup = true;
      this.showLoadingStatus();
      this.videoPlayer.setAttribute('playsinline', 'true');

      setInterval(() => this.rotateCarousel(), 3000);

      const initialSource = this.videoPlayer.querySelector('source') ? this.videoPlayer.querySelector('source').getAttribute('src') : null;
      if (initialSource && this.TITLE_MAP[initialSource]) {
        this.videoTitleElement.textContent = this.TITLE_MAP[initialSource];
      }

      try {
        const items = document.querySelectorAll('.video-item');
        items.forEach(item => {
          const src = item.dataset.src;
          if (src && this.TITLE_MAP[src]) {
            const titleEl = item.querySelector('.video-item-title');
            if (titleEl) titleEl.textContent = this.TITLE_MAP[src];
          }

          // bind click and keyboard
          item.addEventListener('click', () => { const s = item.dataset.src; if (s) this.loadAndPlayVideo(s); });
          item.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); const s = item.dataset.src; if (s) this.loadAndPlayVideo(s); } });
        });
      } catch (e) { }

      console.log('视频网站初始化完成');
    }
  };

  document.addEventListener('DOMContentLoaded', () => App.init());

  // Expose a safe API for debugging or external calls
  window.App = {
    loadAndPlayVideo: (src, title) => App.loadAndPlayVideo(src, title)
  };

})();

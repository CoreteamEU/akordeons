/**
 * HTML5 MP3 Player
 * Handles multiple playlists with play, pause, stop, volume controls
 * Auto-advances to next track and stops other players when new one starts
 */

class MP3Player {
  /**
   * options.trackFilename: render only that one track (the shareable
   * single-song page, track.html) instead of the whole playlist.
   */
  constructor(containerId, playlistId, options = {}) {
    this.container = document.getElementById(containerId);
    this.playlistId = playlistId;
    this.trackFilename = options.trackFilename || null;
    this.playlist = null;
    this.currentTrackIndex = 0;
    this.audio = null;
    this.isPlaying = false;
    this.volume = 1.0;
    
    // Static reference to all players for cross-player control
    if (!MP3Player.instances) {
      MP3Player.instances = [];
    }
    MP3Player.instances.push(this);
    
    this.init();
  }

  /**
   * Initialize player
   */
  init() {
    // Playlists fetch in parallel but render strictly in creation (page)
    // order. On mobile the slots reserve no height, so a later playlist
    // rendering first would be pushed down when an earlier one fills in
    // (measured at CLS 0.37 on PageSpeed mobile).
    const loaded = this.loadPlaylist();
    MP3Player.renderQueue = (MP3Player.renderQueue || Promise.resolve())
      .then(() => loaded)
      .then(() => {
        this.createPlayerUI();
        this.setupAudio();
      })
      .catch(error => console.error('Error rendering player:', error));
  }

  /**
   * Load playlist JSON
   */
  async loadPlaylist() {
    try {
      // Add cache-busting version parameter
      const version = window.APP_VERSION || Date.now();
      const response = await fetch(`data/${this.playlistId}.json?v=${version}`);
      if (!response.ok) {
        throw new Error(`Failed to load playlist: ${this.playlistId}`);
      }
      this.playlist = await response.json();
      if (this.trackFilename) {
        this.playlist.tracks = this.playlist.tracks.filter(t => t.filename === this.trackFilename);
        if (this.playlist.tracks.length === 0) {
          this.playlist = null;
          this.container.innerHTML = `<p class="player-not-found" data-i18n="player.notFound">${this.t('notFound', 'Recording not found')}</p>`;
        }
      }
      this.container.dispatchEvent(new CustomEvent('playlistload', {
        detail: { playlist: this.playlist }
      }));
    } catch (error) {
      console.error('Error loading playlist:', error);
      this.container.innerHTML = '<p>Error loading playlist</p>';
    }
  }

  /**
   * Get a localized UI string from the site's content JSON (player.* keys),
   * falling back to the given default if the language content isn't loaded yet.
   */
  t(key, fallback) {
    if (typeof languageManager !== 'undefined' && languageManager && languageManager.content) {
      const value = languageManager.getContent(`player.${key}`);
      if (value) return value;
    }
    return fallback;
  }

  /**
   * Get a localized playlist field (title/description). Supports both the
   * current { lv, ru, en } object shape and plain strings for backward compatibility.
   */
  getLocalizedText(field) {
    const value = this.playlist && this.playlist[field];
    if (!value) return '';
    if (typeof value === 'string') return value;
    const lang = (typeof languageManager !== 'undefined' && languageManager && languageManager.currentLanguage) || 'lv';
    return value[lang] || value.lv || Object.values(value)[0] || '';
  }

  /**
   * Create player UI
   */
  createPlayerUI() {
    if (!this.playlist) return;

    const playerHTML = `
      <div class="mp3-player" data-playlist="${this.playlistId}">
        <div class="player-header">
          <h2 class="player-title">${this.getLocalizedText('title')}</h2>
          <p class="player-description">${this.getLocalizedText('description')}</p>
        </div>
        <div class="player-controls">
          <div class="player-buttons">
            <button class="player-btn play-btn" aria-label="${this.t('play', 'Play')}" title="${this.t('play', 'Play')}">
              <span>▶</span>
            </button>
            <button class="player-btn pause-btn" style="display:none;" aria-label="${this.t('pause', 'Pause')}" title="${this.t('pause', 'Pause')}">
              <span>⏸</span>
            </button>
            <button class="player-btn stop-btn" aria-label="${this.t('stop', 'Stop')}" title="${this.t('stop', 'Stop')}">
              <span>⏹</span>
            </button>
            <button type="button" class="player-btn share-btn" aria-label="${this.t('share', 'Share song')}" title="${this.t('share', 'Share song')}">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"></path></svg>
            </button>
          </div>
          <div class="volume-control">
            <input type="range" id="volume-${this.playlistId}" class="volume-slider"
                   min="0" max="100" value="100" aria-label="${this.t('volume', 'Volume')}">
          </div>
          <div class="player-info">
            <span class="current-track"></span>
            <span class="time-info">00:00 / 00:00</span>
          </div>
        </div>
        <div class="player-progress">
          <div class="progress-bar" role="slider" tabindex="0"
               aria-label="${this.t('seek', 'Seek')}"
               aria-valuemin="0" aria-valuemax="0" aria-valuenow="0" aria-valuetext="00:00">
            <div class="progress-fill"></div>
          </div>
        </div>
        <div class="playlist-tracks">
          <ul class="track-list"></ul>
        </div>
      </div>
    `;

    this.container.innerHTML = playerHTML;
    this.renderTrackList();
    this.setupEventListeners();
    if (this.trackFilename) this.updateCurrentTrackInfo();
  }

  /**
   * Re-apply localized text to already-rendered player chrome, without
   * tearing down/re-rendering the track list or interrupting playback.
   * Called when the site language changes.
   */
  applyLocalization() {
    if (!this.playlist || !this.container) return;

    const titleEl = this.container.querySelector('.player-title');
    const descEl = this.container.querySelector('.player-description');
    if (titleEl) titleEl.textContent = this.getLocalizedText('title');
    if (descEl) descEl.textContent = this.getLocalizedText('description');

    const playBtn = this.container.querySelector('.play-btn');
    const pauseBtn = this.container.querySelector('.pause-btn');
    const stopBtn = this.container.querySelector('.stop-btn');
    const volumeSlider = this.container.querySelector('.volume-slider');

    if (playBtn) {
      playBtn.setAttribute('aria-label', this.t('play', 'Play'));
      playBtn.setAttribute('title', this.t('play', 'Play'));
    }
    if (pauseBtn) {
      pauseBtn.setAttribute('aria-label', this.t('pause', 'Pause'));
      pauseBtn.setAttribute('title', this.t('pause', 'Pause'));
    }
    if (stopBtn) {
      stopBtn.setAttribute('aria-label', this.t('stop', 'Stop'));
      stopBtn.setAttribute('title', this.t('stop', 'Stop'));
    }
    const shareBtn = this.container.querySelector('.share-btn');
    if (shareBtn) {
      shareBtn.setAttribute('aria-label', this.t('share', 'Share song'));
      shareBtn.setAttribute('title', this.t('share', 'Share song'));
    }
    if (volumeSlider) {
      volumeSlider.setAttribute('aria-label', this.t('volume', 'Volume'));
    }
    const progressBar = this.container.querySelector('.progress-bar');
    if (progressBar) {
      progressBar.setAttribute('aria-label', this.t('seek', 'Seek'));
    }

    // If playback errored out, the error message should also relocalize.
    if (!this.isPlaying && this.audio && this.audio.error) {
      const currentTrackEl = this.container.querySelector('.current-track');
      if (currentTrackEl) currentTrackEl.textContent = this.t('error', 'Error loading audio');
    }
  }

  /**
   * Render track list
   */
  renderTrackList() {
    const trackList = this.container.querySelector('.track-list');
    if (!trackList || !this.playlist) return;

    trackList.innerHTML = this.playlist.tracks.map((track, index) => {
      const duration = `${track.duration.minutes}:${String(track.duration.seconds).padStart(2, '0')}`;
      return `
        <li class="track-item ${index === 0 ? 'active' : ''}" data-index="${index}">
          <span class="track-title">${track.title}</span>
          <span class="track-duration">${duration}</span>
        </li>
      `;
    }).join('');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    const playBtn = this.container.querySelector('.play-btn');
    const pauseBtn = this.container.querySelector('.pause-btn');
    const stopBtn = this.container.querySelector('.stop-btn');
    const volumeSlider = this.container.querySelector('.volume-slider');
    const trackItems = this.container.querySelectorAll('.track-item');

    if (playBtn) {
      playBtn.addEventListener('click', () => this.play());
    }
    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => this.pause());
    }
    if (stopBtn) {
      stopBtn.addEventListener('click', () => this.stop());
    }
    const shareBtn = this.container.querySelector('.share-btn');
    if (shareBtn) {
      shareBtn.addEventListener('click', () => this.share());
    }
    if (volumeSlider) {
      volumeSlider.addEventListener('input', (e) => {
        this.setVolume(e.target.value / 100);
      });
    }

    this.setupSeek();

    trackItems.forEach(item => {
      item.addEventListener('click', () => {
        const index = parseInt(item.getAttribute('data-index'));
        this.playTrack(index);
      });
    });
  }

  /**
   * Click/tap or drag on the progress bar jumps to that point in the track;
   * arrow/Home/End keys seek when it has focus.
   */
  setupSeek() {
    const bar = this.container.querySelector('.progress-bar');
    if (!bar) return;

    const ratioAt = (clientX) => {
      const rect = bar.getBoundingClientRect();
      return rect.width ? Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)) : 0;
    };

    bar.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      bar.setPointerCapture(e.pointerId);
      this.seekToRatio(ratioAt(e.clientX));
      const onMove = (ev) => this.seekToRatio(ratioAt(ev.clientX));
      const onUp = () => {
        bar.removeEventListener('pointermove', onMove);
        bar.removeEventListener('pointerup', onUp);
        bar.removeEventListener('pointercancel', onUp);
      };
      bar.addEventListener('pointermove', onMove);
      bar.addEventListener('pointerup', onUp);
      bar.addEventListener('pointercancel', onUp);
    });

    bar.addEventListener('keydown', (e) => {
      if (!this.audio || !this.audio.duration) return;
      const step = { ArrowRight: 5, ArrowUp: 5, ArrowLeft: -5, ArrowDown: -5 }[e.key];
      if (step !== undefined) {
        this.seekToTime(this.audio.currentTime + step);
      } else if (e.key === 'Home') {
        this.seekToTime(0);
      } else if (e.key === 'End') {
        this.seekToTime(this.audio.duration - 0.5);
      } else {
        return;
      }
      e.preventDefault();
    });
  }

  /**
   * Seek to a fraction (0..1) of the current track. If nothing is loaded yet,
   * the current track is loaded and started from that point once its
   * duration is known.
   */
  seekToRatio(ratio) {
    if (!this.playlist || !this.audio) return;
    if (!this.audio.src) {
      this.loadTrack(this.currentTrackIndex);
      this.audio.addEventListener('loadedmetadata', () => {
        this.seekToTime(ratio * this.audio.duration);
      }, { once: true });
      this.play();
      return;
    }
    if (this.audio.duration) {
      this.seekToTime(ratio * this.audio.duration);
    }
  }

  seekToTime(seconds) {
    if (!this.audio || !this.audio.duration) return;
    this.audio.currentTime = Math.min(this.audio.duration, Math.max(0, seconds));
    this.updateProgress();
    this.updateTimeInfo();
  }

  /**
   * Setup audio element
   */
  setupAudio() {
    if (!this.audio) {
      this.audio = new Audio();
      this.audio.addEventListener('ended', () => this.onTrackEnd());
      this.audio.addEventListener('timeupdate', () => {
        this.updateProgress();
        this.updateTimeInfo();
      });
      this.audio.addEventListener('loadedmetadata', () => this.updateTimeInfo());
      this.audio.addEventListener('error', () => this.onError());
    }
  }

  /**
   * Stop all other players
   */
  static stopAllPlayers(exceptPlayer) {
    MP3Player.instances.forEach(player => {
      if (player !== exceptPlayer && player.isPlaying) {
        // Stop without triggering stopAllPlayers again to avoid infinite loop
        if (player.audio) {
          player.audio.pause();
          player.audio.currentTime = 0;
          player.isPlaying = false;
          player.updatePlayPauseButtons();
          player.updateProgress();
        }
      }
    });
  }

  /**
   * Play current track
   */
  play() {
    if (!this.playlist || this.playlist.tracks.length === 0) return;

    // Stop all other players
    MP3Player.stopAllPlayers(this);

    if (!this.audio.src) {
      this.loadTrack(this.currentTrackIndex);
    }

    this.audio.play().then(() => {
      this.isPlaying = true;
      this.updatePlayPauseButtons();
    }).catch(error => {
      console.error('Error playing audio:', error);
      this.onError();
    });
  }

  /**
   * Play specific track
   */
  playTrack(index) {
    if (index < 0 || index >= this.playlist.tracks.length) return;
    
    this.currentTrackIndex = index;
    this.stop();
    this.loadTrack(index);
    this.play();
    this.updateActiveTrack();
  }

  /**
   * Load track
   */
  loadTrack(index) {
    if (!this.playlist || !this.playlist.tracks[index]) return;

    const track = this.playlist.tracks[index];
    const trackPath = `mp3/${this.playlistId}/${track.filename}`;
    
    this.setupAudio();
    this.audio.src = trackPath;
    this.audio.load();
    
    this.currentTrackIndex = index;
    this.updateCurrentTrackInfo();
    this.updateActiveTrack();
    this.trackPlayEvent(track);
  }

  /**
   * Send a GA4 event for track playback (play count per track). Placed in
   * loadTrack rather than play() so it fires exactly once per track
   * selection - not on every pause/resume, which reuses the loaded src
   * without calling loadTrack again. No-ops silently if analytics didn't
   * load (e.g. blocked by an ad/tracker blocker).
   */
  trackPlayEvent(track) {
    if (typeof gtag !== 'function') return;
    gtag('event', 'play_track', {
      track_title: track.title,
      track_filename: track.filename,
      playlist_id: this.playlistId
    });
  }

  /**
   * Relative URL of the single-song page for a track.
   */
  getShareUrl(track) {
    const params = new URLSearchParams({ playlist: this.playlistId, track: track.filename });
    return `track.html?${params}`;
  }

  /**
   * In a playlist, opens the current track's single-song page in a new tab.
   * On that page itself, hands its URL to the OS share sheet where
   * available, or copies it to the clipboard.
   */
  async share() {
    const track = this.playlist && this.playlist.tracks[this.currentTrackIndex];
    if (!track) return;

    if (!this.trackFilename) {
      window.open(this.getShareUrl(track), '_blank', 'noopener');
      this.trackShareEvent(track, 'open_page');
      return;
    }

    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: track.title, url });
        this.trackShareEvent(track, 'web_share');
      } catch (error) {
        // AbortError just means the user closed the share sheet.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      this.trackShareEvent(track, 'copy_link');
      this.flashStatus(this.t('shareCopied', 'Link copied'));
    } catch (error) {
      console.error('Error copying link:', error);
    }
  }

  trackShareEvent(track, method) {
    if (typeof gtag !== 'function') return;
    gtag('event', 'share', {
      method,
      content_type: 'audio',
      item_id: `${this.playlistId}/${track.filename}`
    });
  }

  /**
   * Briefly show a message in place of the current track name.
   */
  flashStatus(message) {
    const el = this.container.querySelector('.current-track');
    if (!el) return;
    el.textContent = message;
    clearTimeout(this.flashTimer);
    this.flashTimer = setTimeout(() => this.updateCurrentTrackInfo(), 2000);
  }

  /**
   * Pause playback
   */
  pause() {
    if (this.audio) {
      this.audio.pause();
      this.isPlaying = false;
      this.updatePlayPauseButtons();
    }
  }

  /**
   * Stop playback
   */
  stop() {
    // Stop all players (including this one) when any stop button is clicked
    MP3Player.stopAllPlayers(null);
    
    // Also ensure this player is stopped
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.isPlaying = false;
      this.updatePlayPauseButtons();
      this.updateProgress();
    }
  }

  /**
   * Set volume (0.0 to 1.0)
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.audio) {
      this.audio.volume = this.volume;
    }
    const slider = this.container.querySelector('.volume-slider');
    if (slider) {
      slider.value = this.volume * 100;
    }
  }

  /**
   * Handle track end - auto-advance to next
   */
  onTrackEnd() {
    this.isPlaying = false;
    this.updatePlayPauseButtons();
    
    // Auto-advance to next track
    if (this.currentTrackIndex < this.playlist.tracks.length - 1) {
      this.currentTrackIndex++;
      this.loadTrack(this.currentTrackIndex);
      this.play();
    } else {
      // End of playlist
      this.stop();
    }
  }

  /**
   * Update progress bar
   */
  updateProgress() {
    if (!this.audio) return;

    const progressFill = this.container.querySelector('.progress-fill');
    const duration = this.audio.duration || 0;
    const current = duration ? this.audio.currentTime : 0;
    if (progressFill) {
      progressFill.style.width = (duration ? (current / duration) * 100 : 0) + '%';
    }
    const bar = this.container.querySelector('.progress-bar');
    if (bar) {
      bar.setAttribute('aria-valuemax', String(Math.floor(duration)));
      bar.setAttribute('aria-valuenow', String(Math.floor(current)));
      bar.setAttribute('aria-valuetext', MP3Player.formatTime(current));
    }
  }

  /**
   * Update time info display
   */
  updateTimeInfo() {
    const timeInfo = this.container.querySelector('.time-info');
    if (!timeInfo || !this.audio) return;

    const current = MP3Player.formatTime(this.audio.currentTime);
    const duration = MP3Player.formatTime(this.audio.duration);
    timeInfo.textContent = `${current} / ${duration}`;
  }

  static formatTime(seconds) {
    if (!isFinite(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  /**
   * Update current track info
   */
  updateCurrentTrackInfo() {
    const currentTrackEl = this.container.querySelector('.current-track');
    if (currentTrackEl && this.playlist) {
      const track = this.playlist.tracks[this.currentTrackIndex];
      if (track) {
        currentTrackEl.textContent = track.title;
      }
    }
  }

  /**
   * Update active track in list
   */
  updateActiveTrack() {
    const trackItems = this.container.querySelectorAll('.track-item');
    trackItems.forEach((item, index) => {
      if (index === this.currentTrackIndex) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  /**
   * Update play/pause buttons
   */
  updatePlayPauseButtons() {
    const playBtn = this.container.querySelector('.play-btn');
    const pauseBtn = this.container.querySelector('.pause-btn');
    
    if (this.isPlaying) {
      if (playBtn) playBtn.style.display = 'none';
      if (pauseBtn) pauseBtn.style.display = 'inline-block';
    } else {
      if (playBtn) playBtn.style.display = 'inline-block';
      if (pauseBtn) pauseBtn.style.display = 'none';
    }
  }

  /**
   * Handle error
   */
  onError() {
    console.error('Audio error');
    this.isPlaying = false;
    this.updatePlayPauseButtons();
    
    const currentTrackEl = this.container.querySelector('.current-track');
    if (currentTrackEl) {
      currentTrackEl.textContent = this.t('error', 'Error loading audio');
    }
  }
}

// Relocalize all rendered players whenever the site language changes
// (dispatched by LanguageManager after it loads new content).
window.addEventListener('languagechange', () => {
  if (MP3Player.instances) {
    MP3Player.instances.forEach(player => player.applyLocalization());
  }
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MP3Player;
}



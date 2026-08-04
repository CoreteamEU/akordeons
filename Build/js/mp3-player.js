/**
 * HTML5 MP3 Player
 * Handles multiple playlists with play, pause, stop, volume controls
 * Auto-advances to next track and stops other players when new one starts
 */

class MP3Player {
  constructor(containerId, playlistId) {
    this.container = document.getElementById(containerId);
    this.playlistId = playlistId;
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
  async init() {
    await this.loadPlaylist();
    this.createPlayerUI();
    this.setupAudio();
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
          <h3 class="player-title">${this.getLocalizedText('title')}</h3>
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
          <div class="progress-bar">
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
    if (volumeSlider) {
      volumeSlider.setAttribute('aria-label', this.t('volume', 'Volume'));
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
          <span class="track-number">${index + 1}.</span>
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
    if (volumeSlider) {
      volumeSlider.addEventListener('input', (e) => {
        this.setVolume(e.target.value / 100);
      });
    }

    trackItems.forEach(item => {
      item.addEventListener('click', () => {
        const index = parseInt(item.getAttribute('data-index'));
        this.playTrack(index);
      });
    });
  }

  /**
   * Setup audio element
   */
  setupAudio() {
    if (!this.audio) {
      this.audio = new Audio();
      this.audio.addEventListener('ended', () => this.onTrackEnd());
      this.audio.addEventListener('timeupdate', () => this.updateProgress());
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
    if (progressFill && this.audio.duration) {
      const percent = (this.audio.currentTime / this.audio.duration) * 100;
      progressFill.style.width = percent + '%';
    }
  }

  /**
   * Update time info display
   */
  updateTimeInfo() {
    const timeInfo = this.container.querySelector('.time-info');
    if (!timeInfo || !this.audio) return;

    const formatTime = (seconds) => {
      if (!isFinite(seconds)) return '00:00';
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const current = formatTime(this.audio.currentTime);
    const duration = formatTime(this.audio.duration);
    timeInfo.textContent = `${current} / ${duration}`;
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



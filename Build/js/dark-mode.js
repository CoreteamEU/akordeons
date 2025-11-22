/**
 * Dark Mode Manager
 * Handles automatic and manual dark mode switching
 */

class DarkModeManager {
  constructor() {
    this.theme = this.getStoredTheme() || this.getSystemTheme();
    this.init();
  }

  /**
   * Initialize dark mode manager
   */
  init() {
    this.applyTheme(this.theme);
    this.setupToggle();
    this.setupSystemThemeListener();
  }

  /**
   * Get stored theme preference from localStorage
   */
  getStoredTheme() {
    try {
      return localStorage.getItem('theme');
    } catch (e) {
      return null;
    }
  }

  /**
   * Store theme preference in localStorage
   */
  storeTheme(theme) {
    try {
      localStorage.setItem('theme', theme);
    } catch (e) {
      console.warn('Could not store theme preference');
    }
  }

  /**
   * Get system theme preference
   */
  getSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  /**
   * Apply theme to document
   */
  applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
    this.theme = theme;
    this.storeTheme(theme);
    this.updateToggleButton();
  }

  /**
   * Toggle between light and dark mode
   */
  toggle() {
    const newTheme = this.theme === 'dark' ? 'light' : 'dark';
    this.applyTheme(newTheme);
  }

  /**
   * Setup toggle button
   */
  setupToggle() {
    const toggle = document.querySelector('.dark-mode-toggle');
    if (!toggle) return;

    toggle.addEventListener('click', () => {
      this.toggle();
    });

    this.updateToggleButton();
  }

  /**
   * Update toggle button appearance
   */
  updateToggleButton() {
    const toggle = document.querySelector('.dark-mode-toggle');
    if (!toggle) return;

    // Update aria-label for accessibility
    const label = this.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
    toggle.setAttribute('aria-label', label);
    toggle.setAttribute('title', label);

    // Update icon/text if needed
    const icon = toggle.querySelector('span, i');
    if (icon) {
      icon.textContent = this.theme === 'dark' ? '☀️' : '🌙';
    } else {
      toggle.textContent = this.theme === 'dark' ? '☀️' : '🌙';
    }
  }

  /**
   * Listen for system theme changes
   */
  setupSystemThemeListener() {
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      // Only apply system theme if user hasn't manually set a preference
      const handleChange = (e) => {
        const storedTheme = this.getStoredTheme();
        // If no stored preference, follow system
        if (!storedTheme) {
          this.applyTheme(e.matches ? 'dark' : 'light');
        }
      };

      // Modern browsers
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
      } else {
        // Fallback for older browsers
        mediaQuery.addListener(handleChange);
      }
    }
  }
}

// Initialize dark mode manager when DOM is ready
let darkModeManager;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    darkModeManager = new DarkModeManager();
  });
} else {
  darkModeManager = new DarkModeManager();
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DarkModeManager;
}


/**
 * Dark Mode Manager
 * Handles automatic and manual dark mode switching
 */

// Flat, single-color line icons (no skeuomorphic emoji) - inherit
// currentColor so they follow the toggle button's theme color.
const SUN_ICON_SVG = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"></circle><line x1="12" y1="2" x2="12" y2="4.5"></line><line x1="12" y1="19.5" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="6.64" y2="6.64"></line><line x1="17.36" y1="17.36" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="4.5" y2="12"></line><line x1="19.5" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="6.64" y2="17.36"></line><line x1="17.36" y1="6.64" x2="19.07" y2="4.93"></line></svg>';
const MOON_ICON_SVG = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"></path></svg>';

class DarkModeManager {
  constructor() {
    // Always start with system theme, user can override with toggle
    this.theme = this.getSystemTheme();
    this.manualOverride = false;
    this.init();
  }

  /**
   * Initialize dark mode manager
   */
  init() {
    // Check if user has a stored manual preference
    const storedTheme = this.getStoredTheme();
    if (storedTheme) {
      // User has manually set a preference, use it but mark as override
      this.manualOverride = true;
      this.theme = storedTheme;
    }
    
    this.applyTheme(this.theme, false);
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
  applyTheme(theme, isManual = false) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
    this.theme = theme;
    
    // Only store theme if manually set by user
    if (isManual) {
      this.manualOverride = true;
      this.storeTheme(theme);
    }
    
    this.updateToggleButton();
  }

  /**
   * Toggle between light and dark mode
   */
  toggle() {
    const newTheme = this.theme === 'dark' ? 'light' : 'dark';
    this.applyTheme(newTheme, true); // Mark as manual override
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

    // Update icon (flat sun/moon SVG, not emoji)
    const icon = toggle.querySelector('.dark-mode-icon') || toggle;
    icon.innerHTML = this.theme === 'dark' ? SUN_ICON_SVG : MOON_ICON_SVG;
  }

  /**
   * Listen for system theme changes
   */
  setupSystemThemeListener() {
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      // Always follow system theme changes unless user has manually overridden
      const handleChange = (e) => {
        // Only follow system if user hasn't manually set a preference
        if (!this.manualOverride) {
          const systemTheme = e.matches ? 'dark' : 'light';
          this.applyTheme(systemTheme, false);
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



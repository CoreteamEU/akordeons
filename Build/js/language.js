/**
 * Language Switcher
 * Handles multilingual content loading and language switching
 */

class LanguageManager {
  constructor() {
    this.currentLanguage = this.getStoredLanguage() || 'lv';
    this.content = null;
    this.init();
  }

  /**
   * Initialize language manager
   */
  init() {
    this.loadContent(this.currentLanguage);
    this.setupLanguageSwitcher();
  }

  /**
   * Get stored language preference from localStorage
   */
  getStoredLanguage() {
    try {
      return localStorage.getItem('language') || null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Store language preference in localStorage
   */
  storeLanguage(lang) {
    try {
      localStorage.setItem('language', lang);
    } catch (e) {
      console.warn('Could not store language preference');
    }
  }

  /**
   * Load content JSON for specified language
   */
  async loadContent(lang) {
    try {
      // Add cache-busting version parameter
      const version = window.APP_VERSION || Date.now();
      const response = await fetch(`data/content-${lang}.json?v=${version}`);
      if (!response.ok) {
        throw new Error(`Failed to load content for language: ${lang}`);
      }
      this.content = await response.json();
      this.currentLanguage = lang;
      this.storeLanguage(lang);
      this.updatePageContent();
      this.updateLanguageSwitcher();
      // Let other components (e.g. dynamically rendered MP3 players) know
      // the active language/content changed, so they can relocalize.
      window.dispatchEvent(new CustomEvent('languagechange', {
        detail: { lang: this.currentLanguage, content: this.content }
      }));
    } catch (error) {
      console.error('Error loading content:', error);
      // Fallback to Latvian if other language fails
      if (lang !== 'lv') {
        this.loadContent('lv');
      }
    }
  }

  /**
   * Update all page content with current language
   */
  updatePageContent() {
    if (!this.content) return;

    // Update elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const value = this.getNestedValue(this.content, key);
      if (value !== undefined) {
        if (element.tagName === 'INPUT' && element.type === 'text') {
          element.value = value;
        } else if (element.hasAttribute('data-i18n-html')) {
          element.innerHTML = value;
        } else {
          element.textContent = value;
        }
      }
    });

    // Update page title
    if (this.content.meta && this.content.meta.title) {
      document.title = this.content.meta.title;
    }

    // Update meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && this.content.meta && this.content.meta.description) {
      metaDesc.setAttribute('content', this.content.meta.description);
    }
  }

  /**
   * Get nested value from object using dot notation
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Setup language switcher buttons
   */
  setupLanguageSwitcher() {
    const switcher = document.querySelector('.language-switcher');
    if (!switcher) return;

    const buttons = switcher.querySelectorAll('button[data-lang]');
    buttons.forEach(button => {
      button.addEventListener('click', () => {
        const lang = button.getAttribute('data-lang');
        this.loadContent(lang);
      });
    });
  }

  /**
   * Update language switcher active state
   */
  updateLanguageSwitcher() {
    const buttons = document.querySelectorAll('.language-switcher button[data-lang]');
    buttons.forEach(button => {
      const lang = button.getAttribute('data-lang');
      if (lang === this.currentLanguage) {
        button.classList.add('active');
      } else {
        button.classList.remove('active');
      }
    });
  }

  /**
   * Get current content
   */
  getContent(key) {
    if (!this.content) return '';
    return this.getNestedValue(this.content, key) || '';
  }
}

// Initialize language manager when DOM is ready
let languageManager;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    languageManager = new LanguageManager();
  });
} else {
  languageManager = new LanguageManager();
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LanguageManager;
}



/**
 * Cookie consent (GDPR / ePrivacy)
 * Stores the visitor's choice for optional categories and shows the banner
 * and settings dialog. analytics.js and the videos page read the choice via
 * window.akordeonsConsent. Must load before analytics.js.
 */

(function() {
  'use strict';

  var STORAGE_KEY = 'akordeons_consent_v1';
  var CONSENT_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;
  var CATEGORIES = ['analytics', 'media'];

  function readStoredConsent() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      var age = Date.now() - new Date(data.date).getTime();
      // Expired choices are discarded so the banner asks again.
      if (!(age >= 0 && age < CONSENT_MAX_AGE_MS)) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return data;
    } catch (e) {
      return null;
    }
  }

  var consentState = readStoredConsent();
  var listeners = [];

  function hasConsent(category) {
    return !!(consentState && consentState[category] === true);
  }

  function saveConsent(choices) {
    consentState = { date: new Date().toISOString() };
    CATEGORIES.forEach(function(cat) {
      consentState[cat] = choices[cat] === true;
    });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(consentState));
    } catch (e) {
      // Storage unavailable: the choice then lasts for this page view only.
    }
    listeners.forEach(function(cb) {
      try { cb(); } catch (e) { console.error(e); }
    });
  }

  window.akordeonsConsent = {
    has: hasConsent,
    decided: function() { return !!consentState; },
    grant: function(category) {
      var choices = {};
      CATEGORIES.forEach(function(cat) { choices[cat] = hasConsent(cat); });
      choices[category] = true;
      saveConsent(choices);
      closeBanner();
    },
    onChange: function(cb) { listeners.push(cb); },
    openSettings: function() { openModal(); }
  };

  // UI. Text uses data-i18n keys (consent.*) so LanguageManager localizes it;
  // the Latvian strings below are only the pre-load fallback.

  function t(key, fallback) {
    if (typeof languageManager !== 'undefined' && languageManager && languageManager.content) {
      return languageManager.getContent('consent.' + key) || fallback;
    }
    return fallback;
  }

  function localizeNow() {
    if (typeof languageManager !== 'undefined' && languageManager && languageManager.content) {
      languageManager.updatePageContent();
    }
    applyAttributeLabels();
  }

  function applyAttributeLabels() {
    var banner = document.getElementById('cookie-banner');
    if (banner) banner.setAttribute('aria-label', t('bannerLabel', 'Sīkdatņu izmantošanas paziņojums'));
    var close = document.getElementById('cookie-modal-close');
    if (close) close.setAttribute('aria-label', t('close', 'Aizvērt'));
  }

  function categoryHTML(cat, name, nameFallback, desc, descFallback, badge) {
    return '' +
      '<div class="cookie-category">' +
        '<div class="cookie-cat-header">' +
          '<strong class="cookie-cat-name" id="cookie-cat-' + cat + '" data-i18n="consent.' + name + '">' + nameFallback + '</strong>' +
          '<span class="cookie-badge">' + badge + '</span>' +
          '<label class="cookie-switch">' +
            '<input type="checkbox" id="cookie-toggle-' + cat + '" aria-labelledby="cookie-cat-' + cat + '">' +
            '<span class="cookie-slider" aria-hidden="true"></span>' +
          '</label>' +
        '</div>' +
        '<p class="cookie-cat-desc" data-i18n="consent.' + desc + '" data-i18n-html>' + descFallback + '</p>' +
      '</div>';
  }

  function createModal() {
    if (document.getElementById('cookie-modal')) return;
    var modal = document.createElement('div');
    modal.id = 'cookie-modal';
    modal.className = 'cookie-modal-overlay';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'cookie-modal-title');
    modal.hidden = true;
    modal.innerHTML = '' +
      '<div class="cookie-modal-card">' +
        '<div class="cookie-modal-header">' +
          '<h2 id="cookie-modal-title" data-i18n="consent.settingsTitle">Sīkdatņu iestatījumi</h2>' +
          '<button type="button" class="cookie-modal-close" id="cookie-modal-close" aria-label="Aizvērt">&times;</button>' +
        '</div>' +
        '<div class="cookie-modal-body">' +
          '<p data-i18n="consent.settingsIntro" data-i18n-html>Jūs varat izvēlēties, kuras neobligātās kategorijas atļaut. Izvēli var mainīt vai atsaukt jebkurā brīdī, un tā tiek saglabāta 12 mēnešus. Sīkāk: <a href="privacy.html">Privātuma politika</a>.</p>' +
          '<div class="cookie-category">' +
            '<div class="cookie-cat-header">' +
              '<strong class="cookie-cat-name" data-i18n="consent.necessaryName">Nepieciešamās</strong>' +
              '<span class="cookie-badge" data-i18n="consent.alwaysOn">Vienmēr aktīvas</span>' +
            '</div>' +
            '<p class="cookie-cat-desc" data-i18n="consent.necessaryDesc">Jūsu sīkdatņu izvēle, valoda un gaišā/tumšā režīma izvēle tiek saglabāta tikai šī pārlūka lokālajā krātuvē. Tā netiek nosūtīta mums vai trešajām pusēm.</p>' +
          '</div>' +
          categoryHTML('analytics', 'analyticsName', 'Analītika', 'analyticsDesc',
            'Apkopo statistiku par apmeklējumiem, skatītajām lapām un audio ierakstu atskaņošanu, izmantojot Google Analytics sīkdatnes.', 'Google Analytics') +
          categoryHTML('media', 'mediaName', 'Ārējie video', 'mediaDesc',
            'Ļauj automātiski ielādēt YouTube video sadaļā “Video”. YouTube (Google) var saglabāt sīkdatnes.', 'YouTube') +
        '</div>' +
        '<div class="cookie-actions">' +
          '<button type="button" class="cookie-btn cookie-btn-primary" id="cookie-modal-accept" data-i18n="consent.allowAll">Atļaut visas</button>' +
          '<button type="button" class="cookie-btn cookie-btn-primary" id="cookie-modal-reject" data-i18n="consent.rejectAllShort">Noraidīt visas</button>' +
          '<button type="button" class="cookie-btn" id="cookie-modal-save" data-i18n="consent.save">Saglabāt izvēli</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);

    document.getElementById('cookie-modal-close').addEventListener('click', closeModal);
    modal.addEventListener('click', function(e) {
      if (e.target === modal) closeModal();
    });
    document.getElementById('cookie-modal-save').addEventListener('click', function() {
      decide({
        analytics: document.getElementById('cookie-toggle-analytics').checked,
        media: document.getElementById('cookie-toggle-media').checked
      });
    });
    document.getElementById('cookie-modal-accept').addEventListener('click', function() {
      decide({ analytics: true, media: true });
    });
    document.getElementById('cookie-modal-reject').addEventListener('click', function() {
      decide({ analytics: false, media: false });
    });
    modal.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closeModal();
      else if (e.key === 'Tab') trapFocus(e, modal);
    });
  }

  function createBanner() {
    if (consentState || document.getElementById('cookie-banner')) return;
    var banner = document.createElement('div');
    banner.id = 'cookie-banner';
    banner.className = 'cookie-banner';
    banner.setAttribute('role', 'region');
    banner.innerHTML = '' +
      '<div class="cookie-banner-content">' +
        '<div class="cookie-banner-text">' +
          '<h2 class="cookie-banner-title" data-i18n="consent.bannerTitle">Sīkdatņu izmantošana</h2>' +
          '<p data-i18n="consent.bannerText" data-i18n-html>Ar jūsu piekrišanu izmantosim Google Analytics apmeklējumu statistikai un ielādēsim YouTube video, kas var saglabāt sīkdatnes. Dati var tikt nosūtīti uz ASV. Izvēli var mainīt jebkurā brīdī. <a href="privacy.html">Privātuma politika</a></p>' +
        '</div>' +
        // Accept and reject get identical styling so neither is nudged.
        '<div class="cookie-actions">' +
          '<button type="button" class="cookie-btn cookie-btn-primary" id="cookie-banner-accept" data-i18n="consent.acceptAll">Piekrist visām</button>' +
          '<button type="button" class="cookie-btn cookie-btn-primary" id="cookie-banner-reject" data-i18n="consent.rejectAll">Noraidīt neobligātās</button>' +
          '<button type="button" class="cookie-btn" id="cookie-banner-settings" data-i18n="consent.customize">Pielāgot</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(banner);

    document.getElementById('cookie-banner-accept').addEventListener('click', function() {
      decide({ analytics: true, media: true });
    });
    document.getElementById('cookie-banner-reject').addEventListener('click', function() {
      decide({ analytics: false, media: false });
    });
    document.getElementById('cookie-banner-settings').addEventListener('click', openModal);
  }

  function decide(choices) {
    saveConsent(choices);
    closeModal();
    closeBanner();
  }

  function getFocusable(container) {
    return Array.prototype.filter.call(
      container.querySelectorAll('a[href], button:not([disabled]), input:not([disabled])'),
      function(el) { return el.offsetParent !== null; }
    );
  }

  function trapFocus(e, container) {
    var focusable = getFocusable(container);
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  var lastFocused = null;

  function openModal() {
    var modal = document.getElementById('cookie-modal');
    if (!modal) return;
    document.getElementById('cookie-toggle-analytics').checked = hasConsent('analytics');
    document.getElementById('cookie-toggle-media').checked = hasConsent('media');
    lastFocused = document.activeElement;
    modal.hidden = false;
    document.body.classList.add('cookie-modal-open');
    document.getElementById('cookie-modal-close').focus();
  }

  function closeModal() {
    var modal = document.getElementById('cookie-modal');
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    document.body.classList.remove('cookie-modal-open');
    // The opener may have been inside the banner, which a choice removes.
    var target = lastFocused;
    if (!target || !document.body.contains(target) || target.closest('#cookie-banner')) {
      target = document.querySelector('[data-cookie-settings]');
    }
    if (target && typeof target.focus === 'function') target.focus();
    lastFocused = null;
  }

  function closeBanner() {
    var banner = document.getElementById('cookie-banner');
    if (banner && banner.parentNode) banner.parentNode.removeChild(banner);
  }

  function createUI() {
    createModal();
    createBanner();
    localizeNow();

    // Delegated, because some triggers live inside data-i18n-html content
    // that LanguageManager replaces on every language switch.
    document.addEventListener('click', function(e) {
      var trigger = e.target.closest('[data-cookie-settings]');
      if (!trigger) return;
      e.preventDefault();
      openModal();
    });
  }

  window.addEventListener('languagechange', applyAttributeLabels);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createUI);
  } else {
    createUI();
  }
})();

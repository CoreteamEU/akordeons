/**
 * Analytics Tracking
 * Google Analytics (GA4), loaded only with the visitor's "analytics" consent
 * (see consent.js, which must load first).
 */

(function() {
  'use strict';

  // Google Analytics (GA4)
  // Property: "akordeons.lv - GA4" (property ID 385988040)
  // Measurement ID: G-PT9X9RX1C5
  // Replaces the old Universal Analytics snippet (UA-51814773-1), which
  // stopped collecting data when Google sunset UA on 2023-07-01.
  var GA_MEASUREMENT_ID = 'G-PT9X9RX1C5';

  var consent = window.akordeonsConsent;
  function hasAnalyticsConsent() {
    return !!(consent && consent.has('analytics'));
  }

  window.dataLayer = window.dataLayer || [];
  function pushToDataLayer() { window.dataLayer.push(arguments); }

  // Exposed globally so other scripts (e.g. mp3-player.js play/share
  // events) can call it at any time. Events without consent are dropped,
  // not queued, so they can never be sent retroactively after opting in.
  window.gtag = function() {
    if (arguments[0] === 'event' && !hasAnalyticsConsent()) return;
    pushToDataLayer.apply(null, arguments);
  };

  // Google Consent Mode v2: everything denied until the visitor opts in.
  pushToDataLayer('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied'
  });

  var gaStarted = false;

  // The gtag.js bundle (~150KB, entirely Google's own code) is fetched only
  // after the page has finished loading, so it can't compete with the
  // site's own CSS/JS/images during the initial render.
  function startAnalytics() {
    pushToDataLayer('consent', 'update', { analytics_storage: 'granted' });
    if (gaStarted) return;
    gaStarted = true;
    pushToDataLayer('js', new Date());
    pushToDataLayer('config', GA_MEASUREMENT_ID);

    function loadGtagScript() {
      var gtagScript = document.createElement('script');
      gtagScript.async = true;
      gtagScript.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_MEASUREMENT_ID;
      document.head.appendChild(gtagScript);
    }
    if (document.readyState === 'complete') {
      loadGtagScript();
    } else {
      window.addEventListener('load', loadGtagScript);
    }
  }

  function clearAnalyticsCookies() {
    var host = window.location.hostname || '';
    var domains = ['', host, '.' + host];
    var parts = host.split('.');
    if (parts.length > 2) domains.push('.' + parts.slice(-2).join('.'));

    document.cookie.split(';').forEach(function(c) {
      var name = c.split('=')[0].trim();
      if (/^_ga|^_gid|^_gat/.test(name)) {
        domains.forEach(function(domain) {
          document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/' + (domain ? '; domain=' + domain : '');
        });
      }
    });
  }

  function applyConsent() {
    if (hasAnalyticsConsent()) {
      startAnalytics();
    } else {
      // Already-loaded gtag.js can't be unloaded; denying storage stops it
      // writing cookies and clearing them removes the identifier.
      if (gaStarted) pushToDataLayer('consent', 'update', { analytics_storage: 'denied' });
      clearAnalyticsCookies();
    }
  }

  applyConsent();
  if (consent) consent.onChange(applyConsent);
})();

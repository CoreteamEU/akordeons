/**
 * Analytics Tracking
 * Google Analytics (GA4) and Facebook Pixel
 */

(function() {
  'use strict';

  // Google Analytics (GA4)
  // Property: "akordeons.lv - GA4" (property ID 385988040)
  // Measurement ID: G-PT9X9RX1C5
  // Replaces the old Universal Analytics snippet (UA-51814773-1), which
  // stopped collecting data when Google sunset UA on 2023-07-01.
  var GA_MEASUREMENT_ID = 'G-PT9X9RX1C5';

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  // Exposed globally (not just in this closure) so other scripts, e.g.
  // mp3-player.js tracking play counts, can send their own GA4 events.
  window.gtag = gtag;

  var gtagScript = document.createElement('script');
  gtagScript.async = true;
  gtagScript.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_MEASUREMENT_ID;
  document.head.appendChild(gtagScript);

  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID);

  // Facebook SDK (optional - only if needed for social features)
  // App ID: 608558572495774
  // Note: Only load if Facebook features are needed
  // Uncomment if needed:
  /*
  (function(d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) return;
    js = d.createElement(s); js.id = id;
    js.src = "//connect.facebook.net/lv_LV/sdk.js#xfbml=1&appId=608558572495774&version=v2.0";
    fjs.parentNode.insertBefore(js, fjs);
  })(document, 'script', 'facebook-jssdk');
  */
})();




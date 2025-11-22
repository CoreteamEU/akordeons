/**
 * Analytics Tracking
 * Google Analytics and Facebook Pixel
 */

(function() {
  'use strict';

  // Google Analytics (Universal Analytics)
  // Tracking ID: UA-51814773-1
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

  ga('create', 'UA-51814773-1', 'auto');
  ga('send', 'pageview');

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


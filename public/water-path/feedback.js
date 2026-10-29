/* The Water Path: one Feedback tab on every page (map, Journey, Light to Sugar, Sugar on the move, Turgor).
   FORM_URL: paste the Google Form link here and every page sends readers to it, in a new tab.
   While it is empty, the tab opens the site's own feedback page (index.html#/feedback). */
(function () {
  'use strict';
  var FORM_URL = '';
  if (document.getElementById('wp-fb-tab')) return;
  var me = document.currentScript && document.currentScript.src;
  var home = me ? new URL('index.html#/feedback', me).href : 'index.html#/feedback';

  function add() {
    if (document.getElementById('wp-fb-tab')) return;
    var a = document.createElement('a');
    a.id = 'wp-fb-tab';
    a.textContent = 'Feedback';
    a.setAttribute('aria-label', 'Send feedback on this site');
    if (FORM_URL) { a.href = FORM_URL; a.target = '_blank'; a.rel = 'noopener'; }
    else a.href = home;
    document.body.appendChild(a);
    var st = document.createElement('style');
    st.textContent =
      '#wp-fb-tab{position:fixed;right:0;top:50%;z-index:60;transform:translateY(-50%);writing-mode:vertical-rl;' +
      'font:600 13px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;letter-spacing:.06em;color:#fff;background:#1d4e89;' +
      'padding:14px 9px;border-radius:6px 0 0 6px;text-decoration:none;box-shadow:0 2px 8px rgba(0,0,0,.3);min-width:32px;min-height:44px;text-align:center}' +
      '#wp-fb-tab:hover{background:#163c6a}#wp-fb-tab:focus-visible{outline:3px solid #f2a900;outline-offset:2px}' +
      '@media (max-width:520px){#wp-fb-tab{font-size:12px;padding:12px 7px}}' +
      '@media print{#wp-fb-tab{display:none}}';
    document.head.appendChild(st);
  }
  if (document.body) add(); else document.addEventListener('DOMContentLoaded', add);
})();

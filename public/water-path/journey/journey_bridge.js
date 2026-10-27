/* journey_bridge.js (integrator). Loaded last on merged/journey/index.html only.
   Adds, without touching any builder's file:
   1. a "Go deeper" strip on each plate that opens the matching figure in the full Water Path (the original Water Path);
   2. a link back to the full Water Path in the header.
   The full Water Path is the main page one folder up; its routes are #/route#anchor. */
(function () {
  'use strict';
  var HOME = '../index.html';
  var DEEP = {
    1: [['5.1', 'The VPD calculator', 'demand', 'fig-demand-vpd'], ['5.2', 'ETo by Salinas station', 'demand', 'fig-demand-eto'],
        ['5.3', 'Denmead and Shaw 1962', 'demand', 'fig-demand-ds'], ['F.1', 'Run the season', 'field', 'fig-field-season'],
        ['F.2', 'The day inside the day', 'field', 'fig-field-day'], ['F.3', 'Same wet soil, different days', 'field', 'fig-field-ds']],
    2: [['5.4', 'Two plants, one day', 'demand', 'fig-demand-day'], ['4.2', 'What stops first as a plant dries', 'growth', 'fig-growth-ladder']],
    3: [['6.1', 'Vulnerability curves of a real grapevine', 'embolism', 'fig-embolism-curve'], ['6.2', 'The order of failure in a leaf', 'embolism', 'fig-embolism-seq'],
        ['6.3', 'The hydraulic safety margin', 'embolism', 'fig-embolism-hsm'], ['6.4', 'Why wide vessels matter most', 'embolism', 'fig-embolism-r4'],
        ['6.5', 'The pit membrane sets the breaking point', 'embolism', 'fig-embolism-seed'], ['E.1', 'Air seeding, live', 'fail', 'fig-fail-seeding'],
        ['E.2', 'Two ways to build a pit membrane', 'fail', 'fig-fail-pit'], ['E.3', 'The rare pit hypothesis', 'fail', 'fig-fail-rare'],
        ['E.4', 'Thirteen measured P50 values, by method', 'fail', 'fig-fail-curves'], ['E.5', 'One species, three methods', 'fail', 'fig-fail-method'],
        ['E.6', 'Embolism spreads in sectors', 'fail', 'fig-fail-sector']],
    4: [['L.1', 'Where does the water actually leave?', 'leaf', 'fig-leaf-anatomy'], ['L.2', 'Dry a grapevine leaf', 'leaf', 'fig-leaf-dry'],
        ['', 'Water potential and turgor through a Salinas day', 'turgor', ''], ['4.1', 'Lockhart, with one modelled day of turgor', 'growth', 'fig-growth-lockhart']],
    5: [['L.1', 'Where does the water actually leave?', 'leaf', 'fig-leaf-anatomy'], ['', 'Water potential and turgor through a Salinas day', 'turgor', '']],
    6: [['F.1', 'Run the season', 'field', 'fig-field-season'], ['F.2', 'The day inside the day', 'field', 'fig-field-day'],
        ['F.3', 'Same wet soil, different days', 'field', 'fig-field-ds'], ['5.4', 'Two plants, one day', 'demand', 'fig-demand-day']]
  };
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function href(it) { return HOME + '#/' + it[2] + (it[3] ? '#' + it[3] : ''); }
  function css() {
    var st = document.createElement('style');
    st.textContent =
      '.godeeper .ls-k{color:var(--accent)}' +
      '.godeeper a{border-style:solid}.godeeper a b{white-space:nowrap}' +
      '.wp-home{margin:6px 0 0;font-family:var(--ui);font-size:13px}' +
      '.wp-home a{color:var(--accent)}' +
      'html[data-class] .godeeper,html[data-class] .wp-home{display:none!important}';
    document.head.appendChild(st);
  }
  function strips() {
    Object.keys(DEEP).forEach(function (n) {
      var sec = document.getElementById('lv-sec-' + n);
      if (!sec || sec.querySelector('.godeeper')) return;
      var nav = document.createElement('nav');
      nav.className = 'libstrip godeeper';
      nav.setAttribute('aria-label', 'Go deeper in the full Water Path');
      nav.innerHTML = '<span class="ls-k">Go deeper in the full Water Path</span>' + DEEP[n].map(function (it) {
        return '<a href="' + esc(href(it)) + '">' + (it[0] ? '<b>Fig ' + esc(it[0]) + '</b> ' : '') + esc(it[1]) + '</a>';
      }).join('');
      var ls = sec.querySelector('.libstrip');
      if (ls) sec.insertBefore(nav, ls); else sec.appendChild(nav);
    });
  }
  function home() {
    var brand = document.querySelector('.wp-brand');
    if (!brand || brand.querySelector('.wp-home')) return;
    var p = document.createElement('p');
    p.className = 'wp-home';
    p.innerHTML = '<a href="' + HOME + '#/map">&#8592; The full Water Path: every figure, quiz and source</a';
    brand.insertBefore(p, brand.firstChild);
  }
  function run() { try { css(); strips(); home(); } catch (e) { if (window.console) console.warn('journey bridge', e); } }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
  setTimeout(run, 400);
})();

/* The Water Path v8: boot.js (shell owner)
   Mounts every level module once, wires updates to WP.on through the shell,
   fills gaps for level files that have not loaded, then starts routing. */
(function () {
  'use strict';
  var WP = window.WP;
  if (!WP || !WP.shell) { console.error('boot.js: shell.js did not load'); return; }
  var shell = WP.shell;
  var levels = (WP.levels || []).slice().sort(function (a, b) { return a.n - b.n; });
  var seen = {};
  levels.forEach(function (L) {
    if (!L || !L.n || seen[L.n]) { if (L) console.warn('boot.js: duplicate or invalid level', L.id, L.n); return; }
    seen[L.n] = true;
    var s = shell.addSection(L);
    try {
      if (typeof L.mount === 'function') L.mount(s.body);
      s.mounted = true;
      if (WP.ui && WP.ui.holdNow) WP.ui.holdNow(s.sec);
    } catch (e) {
      console.error('boot.js: level ' + L.id + ' failed to mount', e);
      s.body.innerHTML = '<p class="level-pending">This plate failed to load. The other plates still work.</p>';
      s.mounted = true; s.level.pending = true;
    }
  });
  for (var n = 1; n <= 6; n++) if (!seen[n]) shell.addPending(n);
  shell.renderFooter();
  shell.start();
  // first full update for the visible level, then the rail and strip
  WP.set({});
})();

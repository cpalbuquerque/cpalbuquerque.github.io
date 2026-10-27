/* The Water Path: cargo_flag.js (nutrient path, v17). ONE copy lives in light/ and one in phloem/; keep them identical.
   Reads the cargo the journey stored (localStorage 'wp-cargo', JSON {cargo, solute}) and, when it is 'nutrient',
   shows a small note under the page header linking back to the journey's nutrient path. No scene changes here.
   Syncs between tabs with the storage event. */
(function () {
  'use strict';
  var KEY = 'wp-cargo';
  var NAMES = { nitrate: 'nitrate', phosphate: 'phosphate', potassium: 'potassium', cadmium: 'cadmium', dye: 'a dye tracer' };
  function read(v) {
    if (v === undefined) { try { v = window.localStorage.getItem(KEY); } catch (e) { v = null; } }
    var o = null;
    try { o = JSON.parse(v); } catch (e) { o = null; }
    if (typeof o === 'string') o = { cargo: o };
    if (!o && (v === 'water' || v === 'nutrient')) o = { cargo: v };
    return o && typeof o === 'object' ? o : { cargo: 'water' };
  }
  var css = '.wp-cargo-flag{display:flex;flex-wrap:wrap;align-items:center;gap:6px 12px;margin:10px 0 0;padding:8px 12px;border:1px solid var(--rule,#8a7a62);border-left-width:4px;border-radius:3px;background:var(--card,#ebe2cb);color:var(--ink,#2a231c);font:14px var(--ui,system-ui,sans-serif)}' +
    '.wp-cargo-flag svg{width:15px;height:15px;flex:none}.wp-cargo-flag a{display:inline-flex;align-items:center;gap:6px;min-height:44px;color:var(--accent,#2b5fa4);font-weight:600}' +
    '.wp-cargo-flag[hidden]{display:none!important}@media print{.wp-cargo-flag{display:none}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  var flag = null;
  function paint(o) {
    if (!flag) {
      var head = document.querySelector('.wp-head'); if (!head) return;
      flag = document.createElement('p'); flag.className = 'wp-cargo-flag'; flag.setAttribute('role', 'status');
      head.parentNode.insertBefore(flag, head.nextSibling);
    }
    var on = o.cargo === 'nutrient';
    flag.hidden = !on;
    if (!on) return;
    flag.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5.6" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M5.4 8h5.2M8 5.4v5.2" stroke="currentColor" stroke-width="1.6"/></svg>' +
      '<span>The journey is set to follow a nutrient (' + (NAMES[o.solute] || 'nitrate') + '). This page has no nutrient view yet.</span>' +
      '<a href="../journey/index.html">Back to the nutrient path <span aria-hidden="true">&#8594;</span></a>';
  }
  function go() { paint(read()); }
  window.addEventListener('storage', function (e) { if (e.key === KEY) paint(read(e.newValue)); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();

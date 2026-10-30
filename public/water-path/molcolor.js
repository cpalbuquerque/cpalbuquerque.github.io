/* The Water Path v19: molcolor.js, the ONE identity colour per small molecule, site wide.
   Why: in CPK colours (O red, H white, C grey) H₂O, CO₂ and O₂ all read as red. v19 colours the ATOMS by the
   molecule they belong to, shapes unchanged (bent water, linear CO₂, the O₂ pair): colours show the molecule, not the
   atom. The same in 2D canvases (journey/mol.js, light LP.mol, leafoptics), SVG figures (journey/molsvg.js, CSS
   variables) and 3D scenes (three.js colours from WPMolColor.atom / int).
     water H₂O   blue      O light #1d4aa5  H light #8fb8ee    O dark #80dfff  H dark #b3e9ff
     CO₂         grey      C light #4f5359  O light #a7aaaf    C dark #8a9098  O dark #d9dce0
                           (identity grey light #77797d, dark #cfd3d8; achromatic, so no colour vision type loses it)
     O₂          crimson   O light #981b30                     O dark #dd3c3c
   Colour blind check (Machado et al. 2009 simulation at full severity, CIEDE2000): every pair among these three and the
   colours already in use (ATP orange, H⁺ yellow, sugar green, K⁺ violet, electron green) stays at least 11.8 apart
   under protanopia and deuteranopia and at least 9.4 under tritanopia (light and dark sets). Contrast on the page
   background: at least 3.5 : 1 light and 4.1 : 1 dark. Colour is never the only carrier: shapes and name tags stay.
   Other molecules keep their existing colours (ATP, NADPH, sugars, H⁺, K⁺, Ca²⁺, nitrate and so on).
   The subsites load this file from the site root (like feedback.js); nothing copies the values, so they stay identical.
   API: WPMolColor.get(kind, dark) -> '#rrggbb'   WPMolColor.int(kind, dark) -> 0xrrggbb   WPMolColor.kinds
        WPMolColor.atom(kind, 'O' | 'H' | 'C', dark) -> '#rrggbb'   WPMolColor.atomInt(...) -> 0xrrggbb
        WPMolColor.key(kinds, opts) -> HTML key "Colours show the molecule, not the atom: blue = water, grey = CO₂, crimson = O₂"
        CSS: --mol-h2o, --mol-co2, --mol-o2 on :root (light and dark), .wp-molkey for the key */
(function () {
  'use strict';
  if (window.WPMolColor) return;
  var C = {
    light: { h2o: '#1d4aa5', co2: '#77797d', o2: '#981b30' },
    dark: { h2o: '#80dfff', co2: '#cfd3d8', o2: '#dd3c3c' }
  };
  /* atom colours per molecule (v19 follow up): the identity colour on the main atom, a lighter tint on the others */
  var A = {
    light: { h2o: { O: '#1d4aa5', H: '#8fb8ee' }, co2: { C: '#4f5359', O: '#a7aaaf' }, o2: { O: '#981b30' } },
    dark: { h2o: { O: '#80dfff', H: '#b3e9ff' }, co2: { C: '#8a9098', O: '#d9dce0' }, o2: { O: '#dd3c3c' } }
  };
  var NAME = { h2o: ['blue', 'water'], co2: ['grey', 'CO₂'], o2: ['crimson', 'O₂'] };
  function isDark() {
    var t = document.documentElement.getAttribute('data-theme');
    if (t === 'dark') return true; if (t === 'light') return false;
    try { return matchMedia('(prefers-color-scheme: dark)').matches; } catch (e) { return false; }
  }
  function norm(k) { k = String(k || '').toLowerCase().replace(/[₂2]/g, '2'); return k === 'water' || k === 'w' || k === 'vap' ? 'h2o' : k; }
  function get(kind, dark) { var s = C[(dark == null ? isDark() : dark) ? 'dark' : 'light']; return s[norm(kind)] || null; }
  function int(kind, dark) { var h = get(kind, dark); return h ? parseInt(h.slice(1), 16) : 0x888888; }
  /* atom(kind, el, dark): the colour of one atom of that molecule, e.g. atom('h2o', 'H') */
  function atom(kind, el, dark) { var s = A[(dark == null ? isDark() : dark) ? 'dark' : 'light'][norm(kind)]; return s ? (s[el] || s.O || s.C) : null; }
  function atomInt(kind, el, dark) { var h = atom(kind, el, dark); return h ? parseInt(h.slice(1), 16) : 0x888888; }
  function dot(kind) {
    var k = norm(kind);
    var st = 'stroke:var(--mol-rim);stroke-width:.6';
    var sh = k === 'h2o' ? '<circle cx="3.4" cy="9.4" r="2.2" style="fill:var(--mol-h2o-h);' + st + '"/><circle cx="12.6" cy="9.4" r="2.2" style="fill:var(--mol-h2o-h);' + st + '"/><circle cx="8" cy="6.4" r="3.8" style="fill:var(--mol-h2o);' + st + '"/>' :
      k === 'co2' ? '<circle cx="3" cy="7" r="2.6" style="fill:var(--mol-co2-o);' + st + '"/><circle cx="13" cy="7" r="2.6" style="fill:var(--mol-co2-o);' + st + '"/><circle cx="8" cy="7" r="3.1" style="fill:var(--mol-co2-c);' + st + '"/>' :
      '<circle cx="5.2" cy="7" r="3.2" style="fill:var(--mol-o2);' + st + '"/><circle cx="10.8" cy="7" r="3.2" style="fill:var(--mol-o2);' + st + '"/>';
    return '<svg class="wp-molkey-i" viewBox="0 0 16 14" width="20" height="17" aria-hidden="true" focusable="false">' + sh + '</svg>';
  }
  /* a small key, e.g. WPMolColor.key(['h2o','co2','o2']) -> "blue = water · grey = CO₂ · crimson = O₂" */
  function key(kinds, o) {
    o = o || {};
    var items = (kinds || ['h2o', 'co2', 'o2']).map(function (k) {
      k = norm(k); var n = NAME[k]; if (!n) return '';
      return '<span class="wp-molkey-k">' + dot(k) + '<span><b>' + n[0] + '</b> = ' + n[1] + '</span></span>';
    }).join('');
    return '<p class="wp-molkey' + (o.cls ? ' ' + o.cls : '') + '" role="note" aria-label="Molecule colours: ' +
      (kinds || ['h2o', 'co2', 'o2']).map(function (k) { var n = NAME[norm(k)]; return n ? n[0] + ' is ' + (n[1] === 'CO₂' ? 'carbon dioxide' : n[1] === 'O₂' ? 'oxygen' : 'water') : ''; }).join(', ') + '">' +
      '<span class="wp-molkey-l">' + (o.lead || '<span class="wp-molkey-long">Colours show the molecule, not the atom:</span><span class="wp-molkey-short">Molecule colours:</span>') + '</span>' + items + '</p>';
  }
  function css() {
    if (document.getElementById('wp-molcolor-css')) return;
    var L = C.light, D = C.dark;
    var vars = function (s, a, rim) { return '--mol-h2o:' + s.h2o + ';--mol-co2:' + s.co2 + ';--mol-o2:' + s.o2 + ';--mol-h2o-h:' + a.h2o.H + ';--mol-co2-c:' + a.co2.C + ';--mol-co2-o:' + a.co2.O + ';--mol-rim:' + rim + ';'; };
    var st = document.createElement('style'); st.id = 'wp-molcolor-css';
    st.textContent = ':root{' + vars(L, A.light, "rgba(30,25,20,.45)") + '}' +
      '@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){' + vars(D, A.dark, "rgba(0,0,0,.55)") + '}}' +
      ':root[data-theme="dark"]{' + vars(D, A.dark, "rgba(0,0,0,.55)") + '}' +
      '.wp-molkey{display:flex;flex-wrap:wrap;align-items:center;gap:4px 12px;margin:4px 0;font:500 12.5px/1.35 var(--ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif);color:var(--ink2,var(--muted,inherit))}' +
      '.wp-molkey-k{display:inline-flex;align-items:center;gap:4px;white-space:nowrap}.wp-molkey-i{flex:none}.wp-molkey b{font-weight:700;color:var(--ink,inherit)}' +
      '.wp-molkey-l{font-weight:600;color:var(--ink,inherit)}.wp-molkey-short{display:none}' +
      '@media (max-width:520px){.wp-molkey-long{display:none}.wp-molkey-short{display:inline}}';
    (document.head || document.documentElement).appendChild(st);
  }
  css();
  window.WPMolColor = { light: C.light, dark: C.dark, atoms: A, atom: atom, atomInt: atomInt, get: get, int: int, key: key, kinds: ['h2o', 'co2', 'o2'], isDark: isDark };
})();

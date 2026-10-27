/* The Water Path v8: closing.js (shell owner)
   Closing stop 6, "Your Salinas afternoon". Romaine only.
   Tipburn content is published evidence only.
   Wind never causes tipburn here: blowing air onto developing leaves reduced tipburn in controlled studies (as reviewed in Hartz et al. 2007). */
(function () {
  'use strict';
  /* 13 Oct (slow and named): CSS drawn motion (dashed streams) follows the page speed through --wp-ps */
  (function () { function ps() { if (window.PlaySpeed) document.documentElement.style.setProperty('--wp-ps', String(window.PlaySpeed.get())); } ps(); if (window.PlaySpeed) window.PlaySpeed.on(ps); })();
  var WP = window.WP = window.WP || {};
  WP.levels = WP.levels || [];
  var ui, refs = {}, el, scen = 'warm', airIn = false, own = null;
  var OWN_KEYS = ['crop', 'soilPsi', 'T', 'RH', 'wind', 'ppfd', 'lightQ', 'hour'];

  /* evidence registry; DOIs only from SPEC.json */
  WP.evidence = WP.evidence || {};
  var EV6 = {
    'c6.enclose': { claim: 'Enclosing young lettuce leaves to cut their transpiration lowered their calcium and raised tipburn.',
      cite: 'Barta & Tibbitts 1986, Journal of the American Society for Horticultural Science 111: 413', doi: '10.21273/JASHS.111.3.413',
      measured: 'Buttercrunch lettuce in solution culture; developing leaves enclosed to reduce their transpiration; leaf calcium and tipburn scored.', fig: 'Results text', badge: 'MEASURED' },
    'c6.survey': { claim: 'In Salinas Valley romaine fields, tipburn was unrelated to soil or leaf calcium and was worst where fog cut transpiration in the final two weeks.',
      cite: 'Hartz, Johnstone, Smith & Cahn 2007, HortScience 42: 1681', doi: '10.21273/hortsci.42.7.1681',
      measured: 'Survey of commercial romaine fields in the Salinas Valley: soil and leaf calcium, weather and tipburn incidence.', fig: 'Results text', badge: 'MEASURED' },
    'c6.air': { claim: 'Blowing air onto developing leaves reduced tipburn in controlled studies.',
      cite: 'As reviewed in Hartz et al. 2007, HortScience 42: 1681 (which cites Goto & Takakura 1992 and Frantz et al. 2004)', doi: '10.21273/hortsci.42.7.1681',
      measured: 'Controlled environment studies summarised in the review; the original papers are not on this page.', fig: 'Introduction of Hartz et al. 2007', badge: 'MEASURED' },
    'c6.night': { claim: 'Enclosed cabbage plants that were not transpiring still moved calcium into their leaves, through root pressure flow; covered leaves on partly enclosed plants, with no guttation, got little.',
      cite: 'Palzkill & Tibbitts 1977, Plant Physiology 60: 854', doi: '10.1104/pp.60.6.854',
      measured: 'Young cabbage plants with 45Ca, enclosed in plastic bags to stop transpiration (controlled conditions).', fig: 'Abstract', badge: 'MEASURED' },
    'c6.fert': { claim: 'In three Salinas trials, calcium fertigation did not raise romaine leaf calcium.',
      cite: 'Hartz, Johnstone, Smith & Cahn 2007, HortScience 42: 1681', doi: '10.21273/hortsci.42.7.1681',
      measured: 'Field trials in commercial Salinas Valley romaine.', fig: 'Results as reported in the paper; HortScience is outside the core journal list, flagged.', badge: 'MEASURED' },
    'c6.ratio': { claim: 'Enclosed inner leaves transpire 0.15 times the outer leaf rate in still air, and 0.35 times with air moved into the head.',
      cite: 'Teaching constant; no published inner to outer ratio was found', doi: '',
      measured: 'Nothing measured. The ratio is chosen to show a direction.', fig: 'none', badge: 'ILLUSTRATIVE' },
  };
  Object.keys(EV6).forEach(function (k) { if (!WP.evidence[k]) WP.evidence[k] = EV6[k]; });
  function ev6(k) { return ui && ui.evButton ? ui.evButton(k) : ''; }

  // ILLUSTRATIVE: transpiration of enclosed inner leaves as a fraction of outer leaf E. No published value; chosen to show a direction.
  var RATIO_STILL = 0.15, RATIO_AIR = 0.35;
  var caT = null;

  var SCEN = {
    warm: { label: 'Warm, still, humid afternoon', set: { crop: 'romaine', T: 27, RH: 65, wind: 0.5, ppfd: 1700, hour: 14 },
      read: 'The outer leaves transpire freely, but the air inside the head stays still and humid, and on a warm day the inner leaves are expanding fast. New cell walls need calcium while the xylem stream into those leaves stays small. This is the case the published enclosure study speaks to.' },
    windy: { label: 'Windy, dry afternoon', set: { crop: 'romaine', T: 22, RH: 40, wind: 7, ppfd: 1700, hour: 15 },
      read: 'Dry air pulls hard on the outer leaves, so outer leaf E is high. Does the field wind reach the enclosed leaves inside a closed head? The model cannot say. Blowing air onto developing leaves reduced tipburn in controlled studies (as reviewed in Hartz et al. 2007); wind outside the head is a different thing.' },
    fog: { label: 'Daytime marine fog, final two weeks', set: { crop: 'romaine', T: 15, RH: 95, wind: 1.5, ppfd: 350, hour: 11 },
      read: 'Daytime marine fog cuts transpiration from every leaf, outer and inner. In a survey of commercial romaine fields in the Salinas Valley, tipburn was worst where daytime fog cut transpiration in the final two weeks before harvest, and it was unrelated to soil or leaf calcium (Hartz et al. 2007).' },
    night: { label: 'Humid night, before dawn', set: { crop: 'romaine', T: 11, RH: 95, wind: 0.5, ppfd: 0, hour: 5 },
      read: 'No light, very humid air: transpiration is close to zero, through the cuticle only. Could root pressure on humid nights push sap, and the calcium in it, into the inner leaves? Enclosed, non transpiring cabbage plants still moved calcium into their leaves through root pressure flow (Palzkill and Tibbitts 1977, controlled conditions). Does that happen in a romaine head in a Salinas field? It is a question, not a result.' },
    own: { label: 'Your own settings', set: null,
      read: 'The head now follows your own conditions strip settings, as they were before you picked an afternoon. Try to find settings that widen the gap between outer and inner leaf transpiration.' }
  };

  var CSS = '\
#lv-afternoon .c6-narrow{display:none}\
@media (max-width:560px){#lv-afternoon .c6-wide{display:none}#lv-afternoon .c6-narrow{display:inline}}\
#lv-afternoon .c6-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:16px}\
@media (min-width:1000px){#lv-afternoon .c6-grid{grid-template-columns:minmax(0,1.15fr) minmax(0,1fr)}}\
#lv-afternoon .c6-head svg{display:block;width:100%;height:auto;border:1px solid var(--rule);background:var(--paper)}\
#lv-afternoon svg text{fill:var(--ink);font-family:var(--text)}\
#lv-afternoon svg .t2{fill:var(--ink2)}#lv-afternoon svg .tui{font-family:var(--ui)}\
#lv-afternoon .c6-leafo{fill:url(#c6-hatch);stroke:var(--ink);stroke-width:1.2}\
#lv-afternoon .c6-leafi{fill:var(--leaf2);stroke:var(--ink);stroke-width:1.1}\
#lv-afternoon .c6-heart{fill:var(--wall);stroke:var(--ink);stroke-width:1}\
#lv-afternoon .c6-leafm{fill:var(--leaf);stroke:var(--ink);stroke-width:1.1}\
#lv-afternoon .c6-rib{fill:var(--rib);stroke:none}\
#lv-afternoon .c6-core{fill:var(--rib);stroke:var(--ink);stroke-width:1.2}\
#lv-afternoon .c6-hyp{fill:none;stroke:var(--b-pre);stroke-width:1.5;stroke-dasharray:4 3}\
#lv-afternoon .c6-x{fill:none;stroke-width:1.4;stroke-linecap:round}\
#lv-afternoon .c6-ca{fill:none;stroke:var(--b-ill);stroke-width:4;stroke-linecap:round;stroke-dasharray:0 16;animation:c6-ca calc(2s / var(--wp-ps,1)) linear infinite}\
#lv-afternoon .c6-m,#lv-afternoon .c6-cadep{pointer-events:none}\
#lv-afternoon .c6-vap{fill:none;stroke:var(--w3);stroke-width:2;stroke-linecap:round}\
#lv-afternoon .c6-air{fill:none;stroke:var(--ink2);stroke-width:1.4;stroke-dasharray:10 6;animation:c6-air calc(1.4s / var(--wp-ps,1)) linear infinite}\
@keyframes c6-ca{to{stroke-dashoffset:-28}}@keyframes c6-air{to{stroke-dashoffset:-32}}\
:root[data-motion="reduce"] #lv-afternoon .c6-ca,:root[data-motion="reduce"] #lv-afternoon .c6-air{animation:none}\
@media (prefers-reduced-motion:reduce){:root:not([data-motion="full"]) #lv-afternoon .c6-ca,:root:not([data-motion="full"]) #lv-afternoon .c6-air{animation:none}}\
#lv-afternoon .c6-bars{margin-top:10px}\
#lv-afternoon .c6-bar{display:grid;grid-template-columns:110px 1fr 120px;gap:8px;align-items:center;font-family:var(--ui);font-size:13px;margin:6px 0}\
#lv-afternoon .c6-bar .trk{height:14px;background:var(--rule2);border-radius:2px;overflow:hidden}\
#lv-afternoon .c6-bar .trk i{display:block;height:100%;background:var(--w2);transition:width .4s var(--ease)}\
#lv-afternoon .c6-bar .val{font-family:var(--mono);text-align:right;font-size:13px}\
@media (max-width:520px){#lv-afternoon .c6-bar{grid-template-columns:84px 1fr 92px;font-size:12px}}\
#lv-afternoon .c6-cols{display:grid;grid-template-columns:minmax(0,1fr);gap:12px;margin-top:14px}\
@media (min-width:760px){#lv-afternoon .c6-cols{grid-template-columns:1fr 1fr}}\
#lv-afternoon h3.c6-h{font-family:var(--disp);font-weight:400;font-size:22px;letter-spacing:.03em;margin:0 0 4px}\
#lv-afternoon h4{font-family:var(--disp);font-weight:400;font-size:19px;margin:0 0 4px;letter-spacing:.03em}\
#lv-afternoon .c6-q{font-size:20px;line-height:1.4;margin:6px 0 8px;font-style:italic}\
#lv-afternoon .c6-read{margin:10px 0 0;padding:8px 12px;border-left:3px solid var(--accent);background:var(--card)}\
#lv-afternoon ul.c6-list{margin:4px 0 0;padding-left:20px}\
#lv-afternoon ul.c6-list li{margin:3px 0}\
#lv-afternoon .c6-toggle{display:flex;align-items:center;gap:10px;margin-top:10px;font-family:var(--ui);font-size:14px;min-height:44px;padding:4px 10px;border:1px solid var(--rule);border-radius:3px;background:var(--card);cursor:pointer}\
#lv-afternoon .c6-toggle input{width:22px;height:22px;margin:0;flex:none;accent-color:var(--accent);cursor:pointer}\
#lv-afternoon .c6-local{font-family:var(--ui);font-size:12px;color:var(--ink2);margin:4px 0 0}\
#lv-afternoon .c6-myst{margin-top:22px;border-top:1px solid var(--rule);padding-top:12px}\
#lv-afternoon .c6-acc{border:1px solid var(--rule);background:var(--card);padding:12px 14px;margin-top:10px;max-width:46em}\
#lv-afternoon .acc-label{display:grid;gap:2px;border:1px solid var(--ink);outline:3px double var(--rule);outline-offset:3px;background:var(--wall);padding:8px 12px;font-family:var(--disp);letter-spacing:.03em;max-width:28em}\
#lv-afternoon .acc-no{font-size:20px}\
#lv-afternoon .acc-where,#lv-afternoon .acc-crop{font-family:var(--text);font-style:italic;font-size:15px;color:var(--ink2)}\
#lv-afternoon .acc-ro{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:6px;margin:10px 0 0}\
#lv-afternoon .acc-ro div{border:1px solid var(--rule2);background:var(--paper);padding:6px 8px}\
#lv-afternoon .acc-ro dt{font-family:var(--ui);font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--ink2)}\
#lv-afternoon .acc-ro dd{margin:0;font-size:17px}\
#lv-afternoon .acc-badge{margin:6px 0 0}\
';

  function r1(x) { return Math.round(x * 10) / 10; }
  function clamp(x, a, b) { return x < a ? a : (x > b ? b : x); }

  /* A romaine head cut lengthwise: a conical core with leaves inserted alternately up its sides, nested upright
     leaves cut through their midribs (white bands), pale crowded heart leaves. */
  var HEAD = { cx: 300, base: 384 };
  function leafSections() {
    // [side, insertion y, half width at the bulge, top y, kind]
    return [[-1, 380, 80, 76, 'o'], [1, 374, 76, 70, 'o'], [-1, 366, 66, 66, 'o'], [1, 356, 58, 64, 'm'], [-1, 346, 50, 66, 'm'], [1, 334, 42, 72, 'm'],
      [-1, 320, 32, 84, 'i'], [1, 308, 25, 100, 'i'], [-1, 296, 17, 124, 'h'], [1, 290, 11, 146, 'h']];
  }
  function secPath(L) {
    var sd = L[0], yi = L[1], hw = L[2], yt = L[3], cx = HEAD.cx, N = 22, C = [], i;
    var x0 = cx + sd * Math.max(3, 26 * (yi - 284) / (HEAD.base - 284));
    for (i = 0; i <= N; i++) {
      var t = i / N, y = yi - (yi - yt) * t;
      var f = Math.sin(Math.PI / 2 * Math.min(1, t / 0.42)) - 0.3 * Math.pow(Math.max(0, (t - 0.78) / 0.22), 2);
      var x = x0 + sd * (hw - 4) * f;
      C.push([x, y]);
    }
    function th(t) { return 3.2 + 10 * Math.pow(1 - t, 1.6); }
    function rib(t) { return Math.max(0, 8.5 * Math.pow(1 - t, 1.2) - 0.6); }
    var A = [], B = [], Ra = [], Rb = [];
    for (i = 0; i <= N; i++) {
      var p = C[i], q = C[Math.min(N, i + 1)], o = C[Math.max(0, i - 1)], dx = q[0] - o[0], dy = q[1] - o[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, t2 = i / N;
      A.push([p[0] + nx * th(t2) / 2, p[1] + ny * th(t2) / 2]); B.push([p[0] - nx * th(t2) / 2, p[1] - ny * th(t2) / 2]);
      var off = -sd * 0.5; // the rib sits on the inner face
      Ra.push([p[0] + nx * (rib(t2) / 2) + nx * off, p[1] + ny * rib(t2) / 2]); Rb.push([p[0] - nx * rib(t2) / 2 + nx * off, p[1] - ny * rib(t2) / 2]);
    }
    function D(P1, P2) { return 'M' + P1.concat(P2.slice().reverse()).map(function (p) { return r1(p[0]) + ',' + r1(p[1]); }).join(' L') + 'Z'; }
    return { blade: D(A, B), rib: D(Ra, Rb), center: 'M' + C.map(function (p) { return r1(p[0]) + ',' + r1(p[1]); }).join(' L'), tip: C[N], mid: C[Math.round(N * 0.45)], outer: C };
  }
  function headSVG() {
    var cx = HEAD.cx, Ls = leafSections().map(function (L) { return { L: L, g: secPath(L) }; });
    var blades = '', ribs = '', xo = '', xi = '', cao = '', cai = '';
    Ls.forEach(function (o) {
      var k = o.L[4];
      blades += '<path class="' + (k === 'o' ? 'c6-leafo' : (k === 'm' ? 'c6-leafm' : (k === 'i' ? 'c6-leafi' : 'c6-heart'))) + '" d="' + o.g.blade + '"/>';
      ribs += '<path class="c6-rib" d="' + o.g.rib + '"/>';
      if (k === 'o' || k === 'm') { xo += '<path class="c6-x" d="' + o.g.center + '"/>'; cao += '<path class="c6-ca" d="' + o.g.center + '"/>'; }
      else { xi += '<path class="c6-x" d="' + o.g.center + '"/>'; cai += '<path class="c6-ca" d="' + o.g.center + '"/>'; }
    });
    var core = '<path class="c6-core" d="M' + (cx - 26) + ',' + (HEAD.base + 2) + ' L' + (cx - 20) + ',360 C' + (cx - 14) + ',330 ' + (cx - 6) + ',300 ' + cx + ',284 C' + (cx + 6) + ',300 ' + (cx + 14) + ',330 ' + (cx + 20) + ',360 L' + (cx + 26) + ',' + (HEAD.base + 2) + 'Z"/>';
    var inner = Ls.filter(function (o) { return o.L[4] === 'h' || o.L[4] === 'i'; });
    var mk = inner.map(function (o) { return '<circle cx="' + r1(o.g.tip[0]) + '" cy="' + r1(o.g.tip[1] + 6) + '" r="9" class="c6-hyp"/>'; }).join('');
    window.__c6outer = Ls.filter(function (o) { return o.L[4] === 'o'; }).map(function (o) { return o.g.outer; });
    return '<svg viewBox="0 0 600 470" role="img" aria-labelledby="c6-t c6-d">' +
      '<title id="c6-t">A romaine head cut lengthwise</title><desc id="c6-d"></desc>' +
      '<defs><pattern id="c6-hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)"><rect width="5" height="5" fill="var(--leaf)"/><path d="M0,2.5 H5" stroke="var(--ink)" stroke-opacity=".3" stroke-width=".7"/></pattern>' +
      '<marker id="c6-ah" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="var(--w3)"/></marker>' +
      '<marker id="c6-ah2" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="var(--ink2)"/></marker></defs>' +
      '<path d="M0,384 C120,378 220,388 300,382 C400,376 500,388 600,382 L600,430 L0,430 Z" fill="var(--soil)" stroke="var(--ink)" stroke-width="1.2"/>' +
      '<path d="M300,386 C296,398 300,412 294,428 M300,388 C320,400 330,414 346,426 M298,390 C280,402 268,412 252,424" fill="none" stroke="var(--ink)" stroke-width="2"/>' +
      core + blades + ribs +
      '<g id="c6-xylem">' + xo + xi + '</g>' +
      '<g id="c6-caO">' + cao + '</g><g id="c6-caI">' + cai + '</g>' +
      '<g id="c6-vapO"></g><g id="c6-vapI"></g><g id="c6-airIn"></g>' +
      // the question sits at the margins of the young inner leaves
      mk +
      '<path d="M' + r1(inner[inner.length - 1].g.tip[0] + 8) + ',' + r1(inner[inner.length - 1].g.tip[1]) + ' L430,58" stroke="var(--ink2)" stroke-width=".9"/>' +
      '<text x="594" y="44" font-size="15" text-anchor="end">young inner leaf margins:</text><text x="594" y="62" font-size="15" font-style="italic" text-anchor="end">enough calcium for new walls?</text>' +
      // labels outside the head, with leaders
      '<path d="M' + r1(inner[1].g.mid[0]) + ',' + r1(inner[1].g.mid[1]) + ' L150,170" stroke="var(--ink2)" stroke-width=".9"/><text x="146" y="166" font-size="14" text-anchor="end" class="tui">inner leaves</text><text x="146" y="182" font-size="12.5" text-anchor="end" class="t2 tui c6-wide">wrapped, still humid air</text>' +
      '<path d="M' + (cx - 12) + ',340 L150,330" stroke="var(--ink2)" stroke-width=".9"/><text x="146" y="334" font-size="14" text-anchor="end" class="tui">core</text>' +
      '<path d="M' + r1(Ls[0].g.mid[0] - 4) + ',' + r1(Ls[0].g.mid[1]) + ' L150,250" stroke="var(--ink2)" stroke-width=".9"/><text x="146" y="246" font-size="14" text-anchor="end" class="tui">outer leaves</text><text x="146" y="262" font-size="12.5" text-anchor="end" class="t2 tui c6-wide">open to the air</text>' +
      '<path d="M' + r1(Ls[2].g.outer[3][0] + 2) + ',' + r1(Ls[2].g.outer[3][1]) + ' L150,300" stroke="var(--ink2)" stroke-width=".9"/><text x="146" y="298" font-size="12.5" text-anchor="end" class="t2 tui">the cut midrib</text><text x="146" y="313" font-size="12.5" text-anchor="end" class="t2 tui c6-wide">(the white band)</text>' +
      // inset: where tipburn appears, no damage drawn
      '<g transform="translate(446,236)"><rect x="0" y="0" width="146" height="132" fill="var(--card)" stroke="var(--rule)"/>' +
      '<path d="M73,118 C48,104 30,70 38,40 C44,20 60,12 73,10 C86,12 102,20 108,40 C116,70 98,104 73,118Z" class="c6-heart"/>' +
      '<path d="M38,40 C44,20 60,12 73,10 C86,12 102,20 108,40" fill="none" stroke="var(--b-pre)" stroke-width="2.2" stroke-dasharray="4 3"/>' +
      '<path d="M73,116 V18" class="c6-rib" style="stroke:var(--ink);stroke-width:.6"/>' +
      '<text x="73" y="-18" text-anchor="middle" font-size="12" class="tui c6-wide">where tipburn shows</text><text x="73" y="-4" text-anchor="middle" font-size="11.5" class="t2 tui c6-wide">young leaf margins</text><text x="140" y="-6" text-anchor="end" font-size="12" class="tui c6-narrow">tipburn shows here</text>' +
      '<g transform="translate(12,124)"><rect x="0" y="-2" width="122" height="0" /></g></g>' +
      '<g transform="translate(450,388)"><rect x="0" y="-13" width="112" height="18" rx="2" fill="none" stroke="var(--b-pre)"/><text x="56" y="0" text-anchor="middle" font-size="11" class="tui" style="fill:var(--b-pre);letter-spacing:.08em">OPEN QUESTION</text></g>' +
      '<g font-size="13" class="tui" transform="translate(0,44)"><circle cx="24" cy="410" r="5" fill="var(--b-ill)"/><text x="34" y="414" class="t2">Ca²⁺ in the xylem stream</text>' +
      '<path d="M230,410 h26" stroke="var(--w3)" stroke-width="2" marker-end="url(#c6-ah)"/><text x="262" y="414" class="t2">water vapour out</text></g>' +
      '<g transform="translate(456,446)"><rect x="0" y="0" width="100" height="5" fill="var(--ink)"/><text x="0" y="22" font-size="12" class="tui">0</text><text x="100" y="22" font-size="12" text-anchor="middle" class="tui">10 cm</text></g>' +
      '</svg>';
  }

  function arrows(cx, cy, dx, dy, n, L, cls) {
    var s = '';
    for (var i = 0; i < n; i++) {
      var ox = cx[i], oy = cy[i];
      s += '<path class="' + cls + '" marker-end="url(#c6-ah)" d="M' + ox + ',' + oy + ' l' + r1(dx[i] * L) + ',' + r1(dy[i] * L) + '"/>';
    }
    return s;
  }

  function drawHead(st, res, Eo, Ei) {
    var svg = refs.svg;
    var dark = ui.theme();
    Array.prototype.forEach.call(svg.querySelectorAll('#c6-xylem path'), function (p) { p.style.stroke = WP.waterColor(res.psi.leafX, dark); });
    // outer vapour: length and opacity follow outer E
    var Lo = 8 + 9 * clamp(Eo, 0, 8), Li = 4 + 9 * clamp(Ei, 0, 8);
    var OL = window.__c6outer || [];
    var vo = '';
    if (Eo >= 0.05) OL.forEach(function (C) {
      [0.35, 0.55, 0.75].forEach(function (f) {
        var i = Math.round(f * (C.length - 1)), p = C[i], q = C[Math.min(C.length - 1, i + 1)], sd = p[0] < 300 ? -1 : 1;
        var nx = sd * 1, ny = -0.35, L = Lo;
        vo += '<path class="c6-vap" marker-end="url(#c6-ah)" d="M' + r1(p[0] + sd * 6) + ',' + r1(p[1]) + ' q' + r1(nx * L * 0.5) + ',' + r1(-L * 0.35) + ' ' + r1(nx * L) + ',' + r1(ny * L) + '"/>';
      });
    });
    svg.querySelector('#c6-vapO').innerHTML = vo;
    svg.querySelector('#c6-vapI').innerHTML = '';
    svg.querySelector('#c6-vapO').setAttribute('opacity', clamp(0.25 + Eo / 4, 0, 1).toFixed(2));
    // calcium stream speed and density follow E; inner much thinner
    function ca(g, E) {
      var d = clamp(3 / Math.max(0.05, E), 0.6, 20);
      Array.prototype.forEach.call(g.children, function (p) { p.style.animationDuration = d.toFixed(2) + 's'; p.style.opacity = clamp(E / 2.5, 0.12, 1).toFixed(2); });
    }
    ca(svg.querySelector('#c6-caO'), Eo); ca(svg.querySelector('#c6-caI'), Ei);
    HP.Eo = Eo; HP.Ei = Ei; hpRun(); if (ui.reducedMotion()) hpPaint();
    svg.querySelector('#c6-airIn').innerHTML = airIn ?
      '<path class="c6-air" marker-end="url(#c6-ah2)" d="M236,24 C262,32 282,48 292,70"/><path class="c6-air" marker-end="url(#c6-ah2)" d="M364,24 C338,32 318,48 308,70"/>' +
      '<text x="300" y="18" font-size="13" text-anchor="middle" class="t2 tui">air moved into the head</text>' : '';
    svg.querySelector('#c6-d').textContent = 'Outer leaves transpire ' + WP.fmt.num(Eo, 2) + ' mmol per square metre per second in the model; enclosed inner leaves, by an illustrative ratio, ' + WP.fmt.num(Ei, 2) + '. Calcium travels with the xylem stream, so less reaches the inner leaves.';
  }

  /* r7 unifier: the head drawing in the mol.js template. Water molecules climb every midrib at a speed set by that
     leaf's model transpiration (outer leaves Eo, enclosed inner leaves Ei; 14 px s⁻¹ per mmol m⁻² s⁻¹, drawing scale
     ILLUSTRATIVE), every sixth particle is a Ca²⁺ ion (the same 1 to 6 drawing ratio as the theatre below). At the leaf end
     water leaves as vapour on the outer leaves, and calcium stays: it parks at the tip, so the outer tips fill with
     calcium and the inner tips stay nearly bare. Still frame under reduced motion; draws only while on screen. */
  var HP = { paths: [], parts: [], dep: [], vap: [], Eo: 0, Ei: 0, raf: 0, t0: 0, vis: false, io: null };
  /* 13 Oct (slow and named, water heroes builder): WP.svgNames(svg, layer), molecule names in the older SVG figures under
     the ANTI CLUTTER RULE. Identical copy in l1_field.js, l2_plant.js, l3_organ.js and closing.js (first loaded wins).
     Each frame: nm.frame([{k: kind, key: object, x, y, r, t: text, q}]) in viewBox units (r = drawn radius). Per kind:
     2 named at desktop width, 1 on phones (q overrides); stable (a named molecule keeps its name until it leaves the
     list); a second name sits well away from the first; a name is drawn only where it touches no text of the figure
     and no other name (it waits hidden instead of jumping). 10.5 px text (9.5 px on phones). MolNames off: none. */
  WP.svgNames = WP.svgNames || function (svg, layer) {
    var NS = 'http://www.w3.org/2000/svg', pool = [], prev = {}, miss = new Map(), blk = [], blkT = -1e9;
    function hit(a, b) { return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h; }
    function blockers() {
      var now = performance.now(); if (now - blkT < 400) return blk; blkT = now; blk = [];
      Array.prototype.forEach.call(svg.querySelectorAll('text'), function (t) { if (layer.contains(t)) return; var r = t.getBoundingClientRect(); if (r.width > 0) blk.push({ x: r.left - 2, y: r.top - 2, w: r.width + 4, h: r.height + 4 }); });
      return blk;
    }
    function pill(i) {
      var g = pool[i];
      if (!g) { g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'wpm-name'); g.setAttribute('pointer-events', 'none'); g.innerHTML = '<rect/><text text-anchor="middle" dominant-baseline="central"></text>'; pool[i] = g; }
      if (g.parentNode !== layer || layer.lastChild !== g) layer.appendChild(g);
      return g;
    }
    var nm = {
      frame: function (list) {
        var used = 0, on = !window.MolNames || window.MolNames.get(), ctm = on && list && list.length ? layer.getScreenCTM() : null;
        if (ctm) {
          var sr = svg.getBoundingClientRect(), narrow = sr.width < 560, fs = narrow ? 9.5 : 10.5, kk = Math.hypot(ctm.a, ctm.b) || 1;
          var placed = blockers().slice(), by = {}, kinds = [], next = {};
          list.forEach(function (it) {
            if (!by[it.k]) { by[it.k] = []; kinds.push(it.k); } by[it.k].push(it);
            var px = ctm.a * it.x + ctm.c * it.y + ctm.e, py = ctm.b * it.x + ctm.d * it.y + ctm.f, w = it.t.length * fs * 0.6 + fs;
            it.sx = px; it.sy = py; it.w = w; it.box = { x: px - w / 2 - 2, y: py + it.r * kk + 1, w: w + 4, h: fs * 1.5 + 4 };
          });
          kinds.forEach(function (k) {
            var L = by[k], q = L[0].q != null ? L[0].q : (narrow ? 1 : 2), chosen = [], old = prev[k] || [];
            function fits(it) { var b = it.box; if (b.x < sr.left + 2 || b.x + b.w > sr.right - 2 || b.y < sr.top + 2 || b.y + b.h > sr.bottom - 2) return false; for (var i = 0; i < placed.length; i++) if (hit(b, placed[i])) return false; return true; }
            L.forEach(function (it) { if (chosen.length < q && old.indexOf(it.key) >= 0 && (miss.get(it.key) || 0) < 60) chosen.push(it); });
            L.forEach(function (it) {
              if (chosen.length >= q || chosen.indexOf(it) >= 0) return;
              for (var i = 0; i < chosen.length; i++) if (Math.hypot(chosen[i].sx - it.sx, chosen[i].sy - it.sy) < (narrow ? 60 : 90)) return;
              if (fits(it)) chosen.push(it);
            });
            next[k] = chosen.map(function (it) { return it.key; });
            chosen.forEach(function (it) {
              if (!fits(it)) { miss.set(it.key, (miss.get(it.key) || 0) + 1); return; }
              miss.delete(it.key); placed.push(it.box);
              var g = pill(used++), rc = g.firstChild, tx = g.lastChild, f = fs / kk, w = it.w / kk, h = fs * 1.5 / kk, y = it.y + it.r + 2 / kk + h / 2;
              if (tx.textContent !== it.t) tx.textContent = it.t;
              tx.setAttribute('x', it.x.toFixed(1)); tx.setAttribute('y', (y + f * 0.05).toFixed(1));
              tx.setAttribute('style', 'font:700 ' + f.toFixed(2) + 'px system-ui,-apple-system,Segoe UI,sans-serif;fill:var(--wpm-tagink)');
              rc.setAttribute('x', (it.x - w / 2).toFixed(1)); rc.setAttribute('y', (y - h / 2).toFixed(1)); rc.setAttribute('width', w.toFixed(1)); rc.setAttribute('height', h.toFixed(1)); rc.setAttribute('rx', (h / 2).toFixed(1));
              rc.setAttribute('style', 'fill:var(--wpm-tagbg);stroke:var(--wpm-tagrule);stroke-width:' + (0.8 / kk).toFixed(2));
              g.style.display = '';
            });
          });
          prev = next;
          if (miss.size > 200) miss.clear();
        } else prev = {};
        for (var i = used; i < pool.length; i++) pool[i].style.display = 'none';
        nm.count = used;
      },
      dirty: function () { blkT = -1e9; }
    };
    return nm;
  };

  function hpBuild() {
    var MS = WP.molsvg, svg = refs.svg; if (!MS || !svg) return;
    var NSv = 'http://www.w3.org/2000/svg';
    var olds = svg.querySelectorAll('#c6-caO, #c6-caI'); Array.prototype.forEach.call(olds, function (g) { g.style.display = 'none'; });
    var layer = document.createElementNS(NSv, 'g'); layer.setAttribute('id', 'c6-mol');
    var anchor = svg.querySelector('#c6-vapO'); svg.insertBefore(layer, anchor);
    HP.paths = []; HP.parts = []; HP.dep = []; HP.vap = [];
    var src = svg.querySelectorAll('#c6-xylem path'), nOut = svg.querySelectorAll('#c6-caO path').length;
    Array.prototype.forEach.call(src, function (pth, i) {
      var len = 0; try { len = pth.getTotalLength(); } catch (e) { len = 0; }
      if (len < 10) return;
      var S = [], n = Math.ceil(len / 3);
      for (var k = 0; k <= n; k++) { var q = pth.getPointAtLength(len * k / n); S.push([q.x, q.y]); }
      var P = { S: S, len: len, outer: i < nOut, dep: 0 };
      HP.paths.push(P);
      var m = Math.max(2, Math.round(len / 20));
      for (var j = 0; j < m; j++) HP.parts.push({ p: HP.paths.length - 1, o: (j + 0.3) / m * len, ca: (j + i) % 6 === 0, r: (j * 97 + i * 31) % 360 });
    });
    HP.paths.forEach(function (P, pi) { var nd = P.outer ? 4 : 1; for (var d = 0; d < nd; d++) HP.dep.push({ p: pi, k: d }); P.dep = nd; });
    layer.innerHTML = '<g class="c6-dep">' + HP.dep.map(function () { return MS.use('ca', 'c6-cadep'); }).join('') + '</g>' +
      '<g class="c6-flow">' + HP.parts.map(function (q) { return MS.use(q.ca ? 'ca' : 'h2o', 'c6-m'); }).join('') + '</g><g class="c6-vm"></g>';
    // the legend: same glyphs as the drawing
    var lg = svg.querySelector('g[transform="translate(0,44)"] circle');
    if (lg) { var u = document.createElementNS(NSv, 'g'); u.innerHTML = MS.use('ca', ''); u.firstChild.setAttribute('transform', 'translate(24,410) scale(1.4)'); lg.parentNode.replaceChild(u.firstChild, lg); }
    if (!HP.io && 'IntersectionObserver' in window) HP.io = new IntersectionObserver(function (es) { HP.vis = es[0].isIntersecting; hpRun(); });
    if (HP.io) { HP.io.disconnect(); HP.io.observe(svg); } else HP.vis = true;
    hpPaint();
  }
  function hpAt(P, o) {
    var f = clamp(o / P.len, 0, 1) * (P.S.length - 1), k = Math.floor(f), t = f - k, a = P.S[k], b = P.S[Math.min(k + 1, P.S.length - 1)];
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  }
  function hpPaint() {
    var MS = WP.molsvg, svg = refs.svg, L = svg && svg.querySelector('#c6-mol'); if (!MS || !L) return;
    var fl = L.querySelector('.c6-flow').childNodes;
    for (var i = 0; i < HP.parts.length && i < fl.length; i++) {
      var q = HP.parts[i], P = HP.paths[q.p], xy = hpAt(P, q.o);
      MS.place(fl[i], xy[0], xy[1], q.ca ? 0 : q.r, q.ca ? 0.85 : 0.95);
      fl[i].setAttribute('opacity', clamp((P.outer ? HP.Eo : HP.Ei) / 1.2, 0.35, 1).toFixed(2));
    }
    // calcium left behind at each leaf end: four places on an outer tip, one on an inner tip; they fill with E
    var dp = L.querySelector('.c6-dep').childNodes;
    for (var j = 0; j < HP.dep.length && j < dp.length; j++) {
      var D = HP.dep[j], P2 = HP.paths[D.p], tip = P2.S[P2.S.length - 1], pre = P2.S[Math.max(0, P2.S.length - 4)];
      var ang = Math.atan2(tip[1] - pre[1], tip[0] - pre[0]) + Math.PI / 2, off = (D.k - (P2.dep - 1) / 2) * 5.5;
      MS.place(dp[j], tip[0] + Math.cos(ang) * off, tip[1] + Math.sin(ang) * off, 0, 0.9);
      var E = P2.outer ? HP.Eo : HP.Ei;
      dp[j].setAttribute('opacity', (P2.outer ? clamp(E / 1.5 - D.k * 0.18, 0.15, 1) : clamp(E / 0.6, 0.12, 0.9)).toFixed(2));
    }
    var vm = L.querySelector('.c6-vm');
    if (vm.childNodes.length !== HP.vap.length) vm.innerHTML = HP.vap.map(function () { return MS.use('vap', 'c6-m'); }).join('');
    var vc = vm.childNodes;
    for (var v = 0; v < HP.vap.length; v++) { var V = HP.vap[v]; MS.place(vc[v], V.x, V.y, V.r, 0.8); vc[v].setAttribute('opacity', clamp(1 - V.age / 1.6, 0, 1).toFixed(2)); }
    hpNames(svg, L);
  }
  /* 13 Oct (slow and named): names under the moving molecules of the head drawing (ANTI CLUTTER RULE through WP.svgNames):
     Ca²⁺ on one or two climbing ions, H₂O on one water molecule, "H₂O vapour" on one leaving molecule (1 each on phones) */
  function hpNames(svg, L) {
    if (!WP.svgNames) return;
    var lay = svg.querySelector('#c6-name');
    if (!lay) { lay = document.createElementNS('http://www.w3.org/2000/svg', 'g'); lay.setAttribute('id', 'c6-name'); lay.setAttribute('pointer-events', 'none'); L.parentNode.insertBefore(lay, L.nextSibling); }
    if (!HP.nm || HP.nmLay !== lay) { HP.nm = WP.svgNames(svg, lay); HP.nmLay = lay; }
    var out = [];
    HP.parts.forEach(function (q) {
      var P = HP.paths[q.p]; if (!P || q.o < P.len * 0.12 || q.o > P.len * 0.85) return;
      var xy = hpAt(P, q.o);
      out.push(q.ca ? { k: 'ca', key: q, x: xy[0], y: xy[1], r: 3 * 0.85, t: 'Ca²⁺' } : { k: 'w', key: q, x: xy[0], y: xy[1], r: 4.5 * 0.95, t: 'H₂O', q: 1 });
    });
    HP.vap.forEach(function (V) { if (V.age > 0.2 && V.age < 1.2) out.push({ k: 'v', key: V, x: V.x, y: V.y, r: 3.6, t: 'H₂O vapour', q: 1 }); });
    HP.nm.frame(out);
  }
  if (window.MolNames) window.MolNames.on(function () { if (HP.nm) { HP.nm.dirty(); hpPaint(); } });
  function hpFrame(t) {
    if (!HP.vis || ui.reducedMotion() || document.hidden) { HP.raf = 0; return; }
    var dt = HP.t0 ? Math.min(0.1, (t - HP.t0) / 1000) : 0; dt *= (window.PlaySpeed ? window.PlaySpeed.get() : 1); HP.t0 = t;
    HP.parts.forEach(function (q) {
      var P = HP.paths[q.p], v = clamp(14 * (P.outer ? HP.Eo : HP.Ei), 0, 90);
      q.o += v * dt; if (!q.ca) q.r = (q.r + v * dt * 4) % 360;
      if (q.o > P.len) {
        q.o -= P.len;
        if (!q.ca && P.outer && HP.vap.length < 40) {   // water leaves the outer leaf as vapour; calcium stays behind
          var tip = P.S[P.S.length - 1], sd = tip[0] < 300 ? -1 : 1;
          HP.vap.push({ x: tip[0], y: tip[1], vx: sd * (14 + 8 * Math.random()), vy: -8 - 6 * Math.random(), r: q.r, age: 0 });
        }
      }
    });
    HP.vap = HP.vap.filter(function (V) { V.age += dt; V.x += V.vx * dt; V.y += V.vy * dt; V.r += 60 * dt; return V.age < 1.6; });
    hpPaint();
    HP.raf = requestAnimationFrame(hpFrame);
  }
  function hpRun() { if (HP.raf || !HP.vis || ui.reducedMotion() || !HP.parts.length) return; HP.t0 = 0; HP.raf = requestAnimationFrame(hpFrame); }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) hpRun(); });

  function mount(root) {
    ui = WP.ui; el = root;
    var st = document.createElement('style'); st.textContent = CSS; root.appendChild(st);
    var w = document.createElement('div');
    w.innerHTML =
      '<div class="c6-hero" data-r="hero" style="min-height:440px"></div>' +
      '<p class="c6-q">A romaine field, three afternoons before harvest. Where does the water go inside one head, and what might the inner leaves be missing?</p>' +
      '<p class="wp-now" aria-live="polite"><b>What is happening.</b> <span data-r="now"></span></p>' +
      '<div class="chips c6-scen" role="group" aria-label="Choose an afternoon">' +
      Object.keys(SCEN).map(function (k) { return '<button type="button" class="chip" aria-pressed="false" data-s="' + k + '">' + SCEN[k].label + '</button>'; }).join('') +
      '</div>' +
      '<p class="c6-local c6-notice" data-r="notice" hidden></p>' +
      '<div class="c6-grid" style="margin-top:12px">' +
      '<figure class="fig c6-head" style="margin:0"><div data-r="head"></div>' +
      '<label class="c6-toggle"><input type="checkbox" data-r="air"> Move air into the head (reduced tipburn in controlled studies)</label>' +
      '<figcaption class="cap">Drawn for this exhibit. Water ink follows the model leaf xylem Ψ; vapour arrows and the calcium stream follow transpiration. Each red and white ball is a water molecule and each green ball a calcium ion: they climb every midrib at a speed set by that leaf\'s transpiration, water leaves the outer leaves as vapour, and calcium stays behind at the leaf end. <span class="tier-3">Drawing scale: 14 px s⁻¹ per mmol m⁻² s⁻¹, one Ca²⁺ per six water molecules, as in the theatre below (ILLUSTRATIVE).</span> ' + ev6('c6.air') + '</figcaption></figure>' +
      '<div><h3 class="c6-h">What the model can say ' + ev6('c6.ratio') + '</h3>' +
      '<div class="tiles" data-r="tiles"></div>' +
      '<div class="c6-bars" data-r="bars"></div>' +
      '<p class="cap" data-r="rnote"></p>' +
      '<div class="c6-read" data-r="read"></div>' +
      '<h3 class="c6-h" style="margin-top:14px">What it cannot say</h3>' +
      '<ul class="c6-list"><li>How much calcium reaches the expanding tips of the inner leaves.</li>' +
      '<li>How fast those leaves are growing, and so how much calcium their new walls need.</li>' +
      '<li>Where, or whether, tipburn starts. The model has no tipburn in it.</li></ul></div>' +
      '</div>' +
      '<section class="mol-sec" aria-labelledby="c6-molh"><h3 id="c6-molh">Follow the calcium, molecule by molecule</h3>' +
      '<p class="mol-try">Calcium rides in the xylem water. When the water evaporates from a leaf, the calcium stays behind and is built into new cell walls. <b>Try this:</b> pick the warm, still afternoon, then tick <i>Move air into the head</i> and watch the inner leaf.</p>' +
      '<div data-r="camol"></div>' +
      '<p class="cap tier-2">Drawing scales ' + (ui.badge ? ui.badge('DERIVED', 'Water molecules leave each leaf at 3 per second per mmol m⁻² s⁻¹ of E; one Ca²⁺ is drawn for every 6 water molecules (a fixed sap concentration).') : '') + ': speeds and counts follow the model E of each leaf. The inner leaf E is the outer E times an illustrative ratio, and the calcium each leaf needs for new walls is a guess ' + (ui.badge ? ui.badge('ILLUSTRATIVE', 'No published demand for inner romaine leaves was found; the guess only shows the logic of the hypothesis.') : '') + '. The brown rim marks a leaf whose supply falls short of that guess: a picture of the hypothesis, not a tipburn prediction.</p>' +
      '</section>' +
      '<div class="c6-cols">' +
      '<div class="card"><h4>What the published studies show</h4>' +
      '<p class="c6-q" style="font-size:19px">Calcium reaches a leaf in the xylem stream, so a leaf that transpires little receives little calcium.</p>' +
      '<ul class="c6-list"><li>Enclosing young lettuce leaves to cut their transpiration lowered their calcium and raised tipburn (Barta and Tibbitts 1986, Buttercrunch lettuce in solution culture). ' + ev6('c6.enclose') + '</li>' +
      '<li>Across commercial romaine fields in the Salinas Valley, tipburn was unrelated to soil or leaf calcium, and was worst where fog cut transpiration in the final two weeks (Hartz et al. 2007). ' + ev6('c6.survey') + '</li></ul>' +
      '<p style="margin:8px 0 0">Blowing air onto developing leaves reduced tipburn in controlled studies (as reviewed in Hartz et al. 2007). In three Salinas trials, calcium fertigation did not raise romaine leaf calcium (Hartz et al. 2007) ' + ev6('c6.fert') + '. Wind does not cause tipburn; on this page moving air matters only because it can raise transpiration from leaves that would otherwise sit in still, humid air.</p>' +
      '<div data-r="srcs" style="margin-top:8px;font-family:var(--ui);font-size:13px"></div></div>' +
      '</div>';
    root.appendChild(w);
    refs = {};
    Array.prototype.forEach.call(w.querySelectorAll('[data-r]'), function (n) { refs[n.getAttribute('data-r')] = n; });
    refs.head.innerHTML = headSVG();
    refs.svg = refs.head.querySelector('svg');
    hpBuild();
    ui.sources(refs.srcs, ['10.21273/JASHS.111.3.413', '10.21273/hortsci.42.7.1681', '10.1104/pp.60.6.854', '10.1038/nature01853', '10.1111/tpj.15235'], 'Sources');
    var chipsEl = w.querySelector('.c6-scen');
    if (ui.predict) {
      chipsEl.parentNode.insertBefore(ui.predict({ q: 'On a warm, still, humid afternoon, which leaves of a romaine head move the least water?', choices: ['The enclosed inner leaves', 'The outer leaves', 'All leaves the same'], correct: 0,
        answer: 'The enclosed inner leaves. Still, humid air inside the head holds their transpiration down, and calcium travels with the xylem stream; enclosing young leaves lowered their calcium in solution culture (Barta and Tibbitts 1986). Whether this explains tipburn in Salinas fields is the open question.',
        gate: Array.prototype.slice.call(chipsEl.querySelectorAll('.chip[data-s]')), lockText: 'The afternoons unlock once you predict.' }), chipsEl);
    }
    // listen on the scenario chips themselves (the predict box inserted above them has its own chips)
    chipsEl.addEventListener('click', function (e) {
      var b = e.target.closest('.chip[data-s]'); if (!b || !SCEN[b.dataset.s]) return;
      pick(b.dataset.s, true);
    });
    refs.notice.addEventListener('click', function (e) { if (e.target.closest('[data-back]') && own) { scen = 'own'; markChips(); applying = true; WP.set(own); applying = false; } });
    refs.air.addEventListener('change', function () { airIn = refs.air.checked; if (WP.state) update(WP.state, WP.result); });
    if (ui.molStage) caT = ui.molStage(refs.camol, 'calcium', { height: function (cw) { return cw < 560 ? 470 : 500; }, prewarm: 8, // 13 Oct: about 25 % taller
      label: 'Animated romaine leaves: water molecules and calcium ions rise in the veins of an outer and an inner leaf at rates set by their transpiration; water leaves as vapour and calcium stays at the leaf margin' });
    if (refs.camol && window.PlaySpeed) { var cpb = refs.camol.querySelector('.mol-pause'); if (cpb && !cpb.parentNode.querySelector('[data-ps="chip"]')) cpb.insertAdjacentElement('afterend', window.PlaySpeed.chip('ps-light')); }
    mystery(root);
    ui.stops(root, ['6']);
    ahInit(refs.hero);
    ui.onPrefs(function () { if (WP.state && WP.state.level === 6) update(WP.state, WP.result); if (AH.ctx && AH.ctx.retheme) AH.ctx.retheme(); });
    markChips();
  }

  /* ------------------------------------------------------------ mystery plants: one per depth
     Readouts are computed by the same model from a hidden preset; the diagnosis sits behind a commit. */
  var MYST = [
    { tier: 1, acc: 'W-01', where: 'a Salinas Valley romaine field, late morning',
      preset: { crop: 'romaine', soilPsi: -0.05, T: 15, RH: 95, wind: 1, ppfd: 350, lightQ: 'rb', hour: 11, pHcyt: 7.2, phos: 1, ca: 'low', ko: false, flood: false },
      show: ['psi', 'open', 'E', 'VPD'], q: 'What is the weather doing to this head?', choices: ['Foggy, still air', 'Dry soil', 'A hot, dry afternoon'], correct: 0,
      why: 'Foggy, still air: the air is almost saturated, so VPD is near zero and the head loses very little water even with its stomata partly open and its leaf near the soil value. Daytime fog in the final two weeks is when tipburn was worst in Salinas fields (Hartz et al. 2007).' },
    { tier: 2, acc: 'W-02', where: 'a grapevine row, soil saturated for three days',
      preset: { crop: 'grape', soilPsi: -0.02, T: 25, RH: 45, ppfd: 1600, lightQ: 'rb', hour: 13, pHcyt: 7.2, phos: 1, ca: 'low', ko: false, flood: true },
      show: ['psi', 'open', 'E', 'K'], q: 'Why is this vine under tension in saturated soil?', choices: ['Its roots ran short of oxygen and their aquaporins closed', 'The soil is too dry', 'The leaf veins are full of air'], correct: 0,
      why: 'Flooded roots. Without oxygen, root cells acidify and their aquaporins close (Tournaire-Roux et al. 2003, Arabidopsis), so root resistance rises: the leaf Ψ is far more negative than the saturated soil and the stomata close. In the model root resistance is multiplied by 4 (ILLUSTRATIVE size).' },
    { tier: 3, acc: 'W-03', where: 'a leaf in a growth chamber, red and blue light on, soil wet; xylem sap pH measured at 7.5',
      preset: { crop: 'grape', soilPsi: -0.1, T: 25, RH: 50, ppfd: 1200, lightQ: 'red', hour: 12, pHcyt: 7.2, phos: 1, ca: 'low', ko: false, flood: false },
      show: ['pOpen', 'Pf', 'K', 'psi', 'gs'], q: 'What was done to this leaf?', choices: ['Its sheath proton pump (AHA2) was lost', 'Its cytosol was acidified', 'The PIP2;1 gene was knocked out'], correct: 0,
      why: 'AHA2 loss. The gates themselves are open (p<sub>open</sub> normal), but with no pump the sap stays near pH 7.5 under blue light, so the blue light rise in bundle sheath P<sub>f</sub> and K<sub>leaf</sub> never happens (Grunwald et al. 2021). An acid cytosol would close the gates (low p<sub>open</sub>), and the grapevine knockout leaves K<sub>leaf</sub> vulnerability unchanged. In the model this leaf is run as if under red light alone.' }
  ];
  function mystery(rootEl) {
    var sec = document.createElement('section');
    sec.className = 'c6-myst';
    sec.setAttribute('aria-labelledby', 'c6-myst-h');
    sec.innerHTML = '<h3 class="c6-h" id="c6-myst-h">Mystery plant</h3><p class="c6-local">Read the label, read the instruments, commit to a diagnosis. The readouts come from the same model as every plate. One accession per depth.</p>';
    MYST.forEach(function (m) {
      var st = {}, k; for (k in WP.state) st[k] = WP.state[k]; for (k in m.preset) st[k] = m.preset[k];
      var r = WP.solve(st), f = WP.fmt;
      var RO = { psi: ['Leaf Ψ', f.psi(r.psi.leafOut)], open: ['Stomata open', Math.round(100 * r.gs / r.gsMax) + ' % of max'], E: ['Water loss E', f.num(r.E, 2) + ' mmol m⁻² s⁻¹'],
        gs: ['g<sub>s</sub>', f.num(r.gs, 3) + ' mol m⁻² s⁻¹'], VPD: ['VPD', f.num(r.VPD, 2) + ' kPa'], K: ['K<sub>leaf</sub>', f.num(r.K.leaf, 1) + ' mmol m⁻² s⁻¹ MPa⁻¹'],
        pOpen: ['Gates open, p<sub>open</sub>', f.num(r.pOpen, 2)], Pf: ['P<sub>f</sub>', f.num(r.Pf, 0) + ' µm s⁻¹'] };
      var card = document.createElement('div');
      card.className = 'c6-acc ' + (m.tier === 1 ? 'tier-1-only' : (m.tier === 2 ? 'tier-2-only' : 'tier-3-only'));
      card.innerHTML = '<div class="acc-label"><span class="acc-no">Accession ' + m.acc + '</span><span class="acc-where">Collected: ' + m.where + '</span><span class="acc-crop">Crop and treatment: withheld</span></div>' +
        '<dl class="acc-ro">' + m.show.map(function (x) { return '<div><dt>' + RO[x][0] + '</dt><dd class="num">' + RO[x][1] + '</dd></div>'; }).join('') + '</dl>' +
        '<p class="acc-badge">' + (ui.badge ? ui.badge('ILLUSTRATIVE', 'Model readouts from a hidden preset, not measurements.') : '') + '</p>';
      if (ui.predict) {
        var pr = ui.predict({ q: m.q, choices: m.choices, correct: m.correct, answer: m.why + ' <button type="button" class="btn small" data-load>Load this plant into the conditions</button>' });
        pr.addEventListener('click', function (e) { if (e.target.closest('[data-load]')) { var p = {}; for (var q in m.preset) if (q !== 'hour') p[q] = m.preset[q]; WP.set(p); } });
        card.appendChild(pr);
      }
      sec.appendChild(card);
    });
    rootEl.appendChild(sec);
  }

  function markChips() {
    if (!el) return;
    Array.prototype.forEach.call(el.querySelectorAll('.c6-scen .chip[data-s]'), function (c) { c.setAttribute('aria-pressed', c.dataset.s === scen ? 'true' : 'false'); });
    if (refs && refs.notice) {
      var changed = own && scen !== 'own' && SCEN[scen] && SCEN[scen].set;
      refs.notice.hidden = !changed;
      if (changed) refs.notice.innerHTML = 'This plate changed the shared conditions to <b>' + SCEN[scen].label.toLowerCase() + '</b>; every other plate now shows them too. <button type="button" class="btn small" data-back>Back to your conditions</button>';
    }
  }
  var applying = false;
  function snapshot() { var o = {}; OWN_KEYS.forEach(function (k) { o[k] = WP.state[k]; }); return o; }
  function pick(k, apply) {
    if (apply && SCEN[k].set && scen === 'own' && WP.state) own = snapshot(); // remember the user's own settings
    if (apply && SCEN[k].set && !own && WP.state) own = snapshot();
    scen = k; markChips();
    if (apply && SCEN[k].set) { applying = true; WP.set(SCEN[k].set); applying = false; }
    else if (apply && k === 'own' && own) { applying = true; WP.set(own); applying = false; if (WP.state.crop !== 'romaine') WP.set({ crop: 'romaine' }); }
    else if (apply && WP.state.crop !== 'romaine') WP.set({ crop: 'romaine' });
    else if (WP.state) update(WP.state, WP.result);
  }

  var entered = false;
  function show() {
    // first visit: start from the warm, still case; later visits keep what the user set
    if (!entered) { entered = true; own = snapshot(); scen = 'own'; pick('warm', true); }
    else if (WP.state.crop !== 'romaine') WP.set({ crop: 'romaine' });
  }

  function update(st, res) {
    if (!el || !refs.svg) return;
    // if the user moves the strip away from a preset, the scenario becomes "own"
    if (!applying && scen !== 'own' && SCEN[scen].set) {
      var p = SCEN[scen].set, same = true;
      for (var k in p) if (k !== 'hour' && Math.abs((+st[k] || 0) - (+p[k] || 0)) > 1e-6 && typeof p[k] === 'number') same = false;
      if (st.crop !== 'romaine') same = false;
      if (!same) { scen = 'own'; markChips(); }
    }
    var notRom = st.crop !== 'romaine';
    var Eo = res.E, ratio = airIn ? RATIO_AIR : RATIO_STILL, Ei = Eo * ratio;
    drawHead(st, res, Eo, Ei);
    if (caT) caT.set({ Eo: notRom ? 0 : Eo, Ei: notRom ? 0 : Ei, air: airIn });
    ahUpd(Eo, Ei, notRom, airIn);
    var I = ui.badge('ILLUSTRATIVE', 'Model output from illustrative constants.');
    refs.tiles.innerHTML =
      '<div class="tile"><div class="k">VPD ' + ui.badge('DERIVED') + '</div><div class="v">' + WP.fmt.num(res.VPD, 2) + ' <small>kPa</small></div></div>' +
      '<div class="tile"><div class="k">leaf Ψ ' + I + '</div><div class="v">' + WP.fmt.num(res.psi.leafOut, 2) + ' <small>MPa</small></div></div>' +
      '<div class="tile"><div class="k">g<sub>s</sub>, outer ' + I + '</div><div class="v">' + WP.fmt.num(res.gs, 3) + ' <small>mol m⁻² s⁻¹</small></div></div>';
    var max = Math.max(4, Eo);
    refs.bars.innerHTML =
      bar('outer leaves', Eo, max) + bar('inner leaves', Ei, max) +
      '<p class="c6-local" style="margin-top:2px">E in mmol m⁻² s⁻¹. Outer: model ' + ui.badge('ILLUSTRATIVE') + '. Inner: outer × ' + WP.fmt.num(ratio, 2) + ', an ' + ui.badge('ILLUSTRATIVE', 'No published inner to outer ratio was found; chosen to show a direction.') + ' ratio' + (airIn ? ' with air moved into the head.' : ' for still air inside the head.') + '</p>';
    function bar(lab, v, m) {
      return '<div class="c6-bar"><span>' + lab + '</span><span class="trk"><i style="width:' + r1(clamp(v / m, 0, 1) * 100) + '%"></i></span><span class="val">' + WP.fmt.num(v, 2) + '</span></div>';
    }
    refs.rnote.textContent = notRom ? 'The conditions strip is set to another crop. Pick an afternoon above to return to romaine.' :
      'Inner leaves transpire less in every scenario. The question is whether that matters when they are growing fastest.';
    refs.read.innerHTML = '<b>' + SCEN[scen].label + '.</b> ' + SCEN[scen].read;
    if (refs.now) refs.now.textContent = notRom ? 'The conditions strip is set to another crop, so this plate is waiting for romaine. Pick an afternoon above.' :
      (Eo < 0.05 ? 'Transpiration is very low right now, so the xylem stream to the leaves is small. Water can still move without it: on humid nights root pressure can push sap into leaves that are not transpiring. Does that reach the inner leaves of a head?' :
      'The outer leaves lose ' + WP.fmt.num(Eo, 2) + ' mmol m⁻² s⁻¹ and the enclosed inner leaves about ' + WP.fmt.num(Ei, 2) + ' mmol m⁻² s⁻¹' + (airIn ? ' with air moved into the head' : ' in still air') +
      ' (an illustrative ratio). Water carries calcium, so the open question is whether the inner leaves get enough while they grow fastest.');
  }


  /* ============================================================ FP14 (14 Oct 2026, field+plant builder): Afternoon macro hero
     Two leaves of one romaine head: a large outer leaf open to the field air and a pale, cupped inner leaf held in the
     still, humid air inside the head. Water molecules (red O, two white H) and calcium ions (green, Ca2+) climb each
     midrib at a speed set by that leaf's transpiration: outer = model E, inner = outer × the ILLUSTRATIVE ratio of this
     plate (0.15 still, 0.35 with air moved into the head). At the end of a vein the water leaves as vapour and the
     calcium stays behind in the leaf (glowing deposits). Drawing scale as in the theatre below: 3 molecules s-1 per
     mmol m-2 s-1 of E, one Ca2+ per six water molecules (DERIVED). A picture of the hypothesis, not a result.
     Three.js r128 through WP.macro (macro.js, tissue builder); helpers copied here, never edited there. */
  var ABASE = (document.currentScript && document.currentScript.src || '').replace(/[^\/]*$/, '');
  function ahEnsure(cb) {
    if (WP.macro) return cb();
    var s = document.querySelector('script[data-macro]') || document.querySelector('script[src$="macro.js"]');
    if (!s) { s = document.createElement('script'); s.src = ABASE + 'macro.js'; s.setAttribute('data-macro', '1'); document.body.appendChild(s); }
    s.addEventListener('load', function () { cb(); });
    s.addEventListener('error', function () { cb(); });
  }
  function ahLazy(host, fn) {
    var done = false;
    function go() { if (done) return; done = true; ahEnsure(function () { if (WP.macro) fn(); else host.style.minHeight = ''; }); }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); go(); } }, { rootMargin: '240px 0px' });
      io.observe(host);
    } else go();
  }
  var AH = WP._whA = { ctx: null, host: null, Eo: 2, Ei: 0.3, notRom: false, air: false, leaves: [] };
  var AH_RATE = 3, AH_CA_EVERY = 6, AH_V = 0.32;   // DERIVED drawing scales (see header)
  // leaf surface in local coordinates: u from base (0) to tip (1), x across in −1..1
  function ahSurf(L, u, x, out) {
    // FPP: romaine is obovate (widest above the middle) with a wavy margin and a blistered (bullate) blade
    var len = L.len, hw = L.w * 0.5 * (0.2 + 0.8 * Math.pow(Math.sin(Math.PI * Math.min(0.999, 0.05 + 0.92 * Math.pow(u, 1.25))), 0.75));
    hw *= 1 + 0.045 * Math.sin(31 * u + L.seed) * Math.abs(x);
    var y = (u - 0.5) * len, ax = Math.abs(x);
    var z = L.cup * x * x + L.bend * u * u + L.ruf * Math.pow(ax, 3) * Math.sin(9 * u + 3 * x + L.seed);
    var bl = Math.sin(17 * u + L.seed) * Math.sin(10 * x + 2 * L.seed);
    z += (L.bl || 0.12) * Math.pow(ax, 0.6) * Math.max(0, bl) * (1 - Math.exp(-ax * 6));   // blisters bulge between the veins, none on the midrib
    z += 0.1 * Math.pow(ax, 4) * Math.sin(40 * u + L.seed);                                   // ruffled margin
    out.set(x * hw, y, z);
    return out;
  }
  function ahLeafGeo(T, L) {
    var g = new T.PlaneGeometry(2, 1, 30, 44), p = g.attributes.position, v = new T.Vector3();
    for (var i = 0; i < p.count; i++) { var x = p.getX(i), u = p.getY(i) + 0.5; ahSurf(L, u, x, v); p.setXYZ(i, v.x, v.y, v.z); }
    g.computeVertexNormals();
    return g;
  }
  function ahBuild(ctx) {
    var T = ctx.THREE, M = WP.macro, mats = ctx.mats;
    var G = function (g) { ctx.disp.push(g); return g; };
    var defs = [
      { id: 'outer', w: 6.0, len: 9.4, cup: -0.7, bend: 1.3, ruf: 0.5, bl: 0.75, seed: 1, color: 0x4a9630, rib: 0xf2f8dc, pos: [-2.2, -0.2, 1.0], rot: [-0.2, 0.42, 0.16], open: true },
      { id: 'inner', w: 4.0, len: 7.0, cup: -1.5, bend: 0.4, ruf: 0.2, bl: 0.4, seed: 4, color: 0xdbe79a, rib: 0xfdffee, pos: [2.4, -0.4, -2.0], rot: [-0.06, -0.12, -0.06], open: false }
    ];
    mats.mol = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.3, emissive: 0x220a06 });
    mats.ca = new T.MeshStandardMaterial({ color: 0x46c25a, roughness: 0.25, emissive: 0x1d6a26, emissiveIntensity: 0.9 }); M.lin(mats.ca);
    var molG = G(M.waterGeo(T, 0.12, true)), caG = G(new T.SphereGeometry(0.16, 8, 6));
    AH.leaves = defs.map(function (L) {
      var grp = new T.Group(); grp.position.set(L.pos[0], L.pos[1], L.pos[2]); grp.rotation.set(L.rot[0], L.rot[1], L.rot[2]); ctx.root.add(grp);
      var mat = M.glass(T, L.color, { opacity: L.open ? 0.92 : 0.8, roughness: 0.14, ccr: 0.08, emissive: L.open ? 0x16380a : 0x3a4210, ei: 0.8, rimColor: L.open ? 0xb8f080 : 0xf8ffc0, rimK: 0.6, side: T.DoubleSide, depthWrite: true });
      mats['leaf_' + L.id] = mat;
      grp.add(new T.Mesh(G(ahLeafGeo(T, L)), mat));
      // midrib and two side veins as glassy tubes on the surface
      var v = new T.Vector3(), pts = [];
      for (var u = 0; u <= 0.94; u += 0.047) { ahSurf(L, u, 0, v); pts.push(new T.Vector3(v.x, v.y, v.z + 0.1)); }
      var curve = new T.CatmullRomCurve3(pts);
      var ribM = M.glass(T, L.rib, { opacity: 0.62, roughness: 0.1, emissive: 0x3a4018, ei: 0.5, rimColor: 0xffffff, rimK: 0.9, depthWrite: false });
      mats['rib_' + L.id] = ribM;
      var ribG = new T.TubeGeometry(curve, 30, L.open ? 0.46 : 0.32, 10, false), rp = ribG.attributes.position, cpt = new T.Vector3(), ov = new T.Vector3();
      for (var ri = 0; ri < rp.count; ri++) {   // taper toward the tip and flatten against the blade
        var ring = Math.floor(ri / 11), uu2 = ring / 30; curve.getPointAt(uu2, cpt);
        ov.fromBufferAttribute(rp, ri).sub(cpt).multiplyScalar(1 - 0.78 * uu2); ov.z *= 0.55;
        rp.setXYZ(ri, cpt.x + ov.x, cpt.y + ov.y, cpt.z + ov.z - 0.1);
      }
      ribG.computeVertexNormals();
      var rib = new T.Mesh(G(ribG), ribM); grp.add(rib);
      var sides = [], sv = [];
      [[0.3, 1], [0.48, -1], [0.62, 1], [0.76, -1], [0.38, -1], [0.55, 1]].forEach(function (s) {
        var a = [], u0 = s[0];
        for (var k = 0; k <= 6; k++) { var x = s[1] * k / 6 * 0.86, uu = u0 + k * 0.05; ahSurf(L, uu, x, v); a.push(new T.Vector3(v.x, v.y, v.z + 0.06)); }
        var c = new T.CatmullRomCurve3(a); c.uBase = u0 / 0.94; sv.push(c);
        sides.push(new T.Mesh(G(new T.TubeGeometry(c, 10, 0.08, 5, false)), ribM));
      });
      sides.forEach(function (m) { grp.add(m); });
      var NW = L.open ? 46 : 22, NC = L.open ? 14 : 8, ND = 40;
      var water = new T.InstancedMesh(molG, mats.mol, NW); water.frustumCulled = false; grp.add(water);
      var cas = new T.InstancedMesh(caG, mats.ca, NC); cas.frustumCulled = false; grp.add(cas);
      var caGlow = M.halos(T, NC, 0x9dff8c, 2.0); grp.add(caGlow.obj); ctx.disp.push(caGlow.geo, caGlow.mat);
      var dep = M.halos(T, ND, 0xe4ff7a, 2.2); grp.add(dep.obj); ctx.disp.push(dep.geo, dep.mat);
      var dpa = []; for (var di = 0; di < ND; di++) dpa.push([0, 1e4, 0]);
      var depB = M.balls(T, dpa, 0xb8f04a, 0.42); grp.add(depB); ctx.disp.push(depB.geometry, depB.material);
      var vap = M.halos(T, NW, 0xffffff, 2.2); vap.mat.opacity = 0.45; grp.add(vap.obj); ctx.disp.push(vap.geo, vap.mat);
      return { L: L, grp: grp, curve: curve, sides: sv, water: water, cas: cas, caGlow: caGlow, dep: dep, depB: depB, vap: vap, NW: NW, NC: NC, ND: ND,
        ws: [], cs: [], deps: [], acc: 0, n: 0, recent: [], total: 0 };
    });
    // still, humid air inside the head around the inner leaf: a faint bubble with slow drifting haze
    mats.bub = M.glass(T, 0xdfeef2, { opacity: 0.07, roughness: 0.1, emissive: 0x1a2a2c, ei: 0.4, rimColor: 0xeefcff, rimK: 0.5 });
    AH.bub = new T.Mesh(G(new T.SphereGeometry(1, 28, 18)), mats.bub); AH.bub.scale.set(3.1, 4.4, 2.3); AH.bub.position.set(2.4, -0.2, -1.8); ctx.root.add(AH.bub);
    AH.haze = M.halos(T, 26, 0xeaf6ff, 1.4); AH.haze.mat.opacity = 0.35; ctx.root.add(AH.haze.obj); ctx.disp.push(AH.haze.geo, AH.haze.mat);
    AH.hz = []; for (var h = 0; h < 26; h++) AH.hz.push({ a: Math.random() * 6.28, b: Math.random() * 6.28, r: 0.4 + Math.random() * 0.55, s: 0.5 + Math.random() });
    // a third, darker outer leaf behind the inner one (out of focus) closes the head
    var back = { w: 7.4, len: 10, cup: -1.6, bend: 1.6, ruf: 0.5, bl: 0.3, seed: 7 };
    var bm = M.glass(T, 0x3c7a28, { opacity: 0.88, roughness: 0.3, emissive: 0x0e2a08, ei: 0.7, rimColor: 0x9ad870, rimK: 0.5, side: T.DoubleSide, depthWrite: true });
    var bl = new T.Mesh(G(ahLeafGeo(T, back)), bm); bl.position.set(3.0, -0.4, -5.2); bl.rotation.set(-0.1, -0.4, -0.12); ctx.far.add(bl);
    var bl2 = new T.Mesh(G(ahLeafGeo(T, back)), bm); bl2.position.set(-2.0, -0.8, -6.0); bl2.rotation.set(-0.15, 0.5, 0.2); ctx.far.add(bl2);
    // FPP: an outer leaf in front (near layer, out of focus) curls over the right side of the inner leaf: the inner leaf is enclosed
    var front = { w: 6.6, len: 9.6, cup: -1.1, bend: 1.4, ruf: 0.5, bl: 0.3, seed: 9 };
    mats.front = M.glass(T, 0x3a7f26, { opacity: 0.9, roughness: 0.25, emissive: 0x123a0a, ei: 0.8, rimColor: 0x8cc060, rimK: 0.3, side: T.DoubleSide, depthWrite: true });
    AH.front = new T.Mesh(G(ahLeafGeo(T, front)), mats.front); AH.front.position.set(5.6, -0.9, 2.4); AH.front.rotation.set(-0.12, -0.72, -0.22); ctx.near.add(AH.front);
    // humid haze between the leaves (blurred, in the far layer behind the inner leaf)
    AH.haze2 = M.halos(T, 10, 0xf2fbff, 4.5); AH.haze2.mat.opacity = 0.22; for (var hz2 = 0; hz2 < 10; hz2++) AH.haze2.set(hz2, 1.7 + (Math.random() - 0.5) * 5, -2.5 + Math.random() * 5.5, -3.2 - Math.random() * 1.5); AH.haze2.commit(); ctx.far.add(AH.haze2.obj); ctx.disp.push(AH.haze2.geo, AH.haze2.mat);
    for (var w = 0; w < 300; w++) ahStep(0.05);   // prewarm: a still frame already shows streams and deposits
    ahLabels(ctx);
  }
  function ahEof(Lf) { if (AH.notRom) return 0; return Lf.L.open ? AH.Eo : AH.Ei; }
  function ahStep(dt) {
    AH.leaves.forEach(function (Lf) {
      var E = ahEof(Lf), v = Math.max(0.02, AH_V * E + 0.02);
      Lf.acc += AH_RATE * E * dt * 0.5;   // half the theatre rate: one leaf in the hero, not a whole head
      while (Lf.acc >= 1) {
        Lf.acc -= 1; Lf.n++;
        var side = Lf.sides[Math.floor(Math.random() * Lf.sides.length)];
        var item = { s: 0, side: side, end: 0.25 + Math.random() * 0.75, ph: Math.random() * 6.28, out: 0, age: 0 };
        if (Lf.n % AH_CA_EVERY === 0) { if (Lf.cs.length < Lf.NC) Lf.cs.push(item); }
        else if (Lf.ws.length < Lf.NW) Lf.ws.push(item);
      }
      // positions: s from 0 to 1 along the midrib (to the side vein start), then 1 to 2 along the side vein
      function adv(it) { it.age += dt; if (it.out) { it.out += dt; return; } it.s += v * dt / (it.s < 1 ? 5 : 2.2); if (it.s >= 1 + it.end) it.out = 1e-6; }
      Lf.ws.forEach(adv); Lf.cs.forEach(adv);
      Lf.ws = Lf.ws.filter(function (it) { return !(it.out && it.out > (Lf.L.open ? 2.4 : 4.5)); });
      Lf.cs = Lf.cs.filter(function (it) {
        if (it.out) { Lf.deps.push({ side: it.side, s: it.end, age: 0 }); Lf.recent.push(0); Lf.total++; return false; }
        return true;
      });
      Lf.deps.forEach(function (d) { d.age += dt; });
      if (Lf.deps.length > Lf.ND) Lf.deps.splice(0, Lf.deps.length - Lf.ND);
      Lf.recent = Lf.recent.map(function (a) { return a + dt; }).filter(function (a) { return a < 30; });
    });
  }
  function ahPos(Lf, it, out) {
    if (it.s < 1) out.copy(Lf.curve.getPoint(Math.min(1, it.s * (it.side.uBase || 0.5))));   // up the midrib to this side vein
    else out.copy(it.side.getPoint(Math.min(1, it.s - 1)));                                       // then out along the side vein
    return out;
  }
  function ahFrame(ctx, t, dt) {
    var T = ctx.THREE;
    if (dt > 0) ahStep(dt);
    var mtx = AH._m || (AH._m = new T.Matrix4()), q = AH._q || (AH._q = new T.Quaternion()), e = AH._e || (AH._e = new T.Euler()), p = AH._p || (AH._p = new T.Vector3()), sc = AH._s || (AH._s = new T.Vector3()), zero = new T.Matrix4().makeScale(0, 0, 0);
    /* 13 Oct (slow and named): names under the molecules (WP.heroNames, ANTI CLUTTER RULE): Ca²⁺ on climbing ions,
       H₂O on liquid water and "H₂O vapour" on water leaving the blade; 2 per kind at desktop width, 1 on phones */
    var HN = WP.heroNames ? (AH.hn || (AH.hn = WP.heroNames(ctx))) : null, wv = AH._wv || (AH._wv = new T.Vector3());
    function nameAt(Lf, kind, key, text, r, o) { if (!HN) return; wv.copy(p); Lf.grp.localToWorld(wv); ctx.root.worldToLocal(wv); HN.add(kind, key, text, wv.x, wv.y, wv.z, r, o); }
    if (HN) HN.begin();
    AH.leaves.forEach(function (Lf, li) {
      var i;
      // a slow sway in the field air (the outer leaf) and a fainter one inside the head (FPP)
      if (!ctx.reduced) { Lf.grp.rotation.z = Lf.L.rot[2] + (Lf.L.open ? 0.035 : 0.012) * Math.sin(t * 0.7 + li * 2); Lf.grp.rotation.x = Lf.L.rot[0] + (Lf.L.open ? 0.02 : 0.008) * Math.sin(t * 0.53 + li); }
      for (i = 0; i < Lf.NW; i++) {
        var w = Lf.ws[i];
        if (!w) { Lf.water.setMatrixAt(i, zero); Lf.vap.hide(i); continue; }
        ahPos(Lf, w, p);
        var f = 1;
        if (w.out) { // vapour leaves the blade: outer leaf into the field air, inner leaf lingers in the bubble
          var k = w.out, fly = Lf.L.open ? 1.1 : 0.25;
          p.z += 0.15 + fly * k; p.y += 0.35 * k * (Lf.L.open ? 1 : 0.4); p.x += Math.sin(w.ph + k) * 0.25 * k;
          f = Math.max(0, 1 - k / (Lf.L.open ? 2.4 : 4.5));
          Lf.vap.set(i, p.x, p.y, p.z);
        } else Lf.vap.hide(i);
        q.setFromEuler(e.set(w.ph + w.age, w.ph * 2 + w.age * 0.7, 0));
        mtx.compose(p, q, sc.setScalar(Math.max(0.001, f))); Lf.water.setMatrixAt(i, mtx);
        /* fix round (Q H2): one vapour name, and on the outer leaf liquid H₂O is named only on the midrib and Ca²⁺
           only out on the side veins (where it stays), so the three kinds of name sit apart (vapour above the blade) instead of stacking */
        if (Lf.L.open) { if (w.out) { if (f > 0.45 && w.out > 0.15) nameAt(Lf, 'vap', w, 'H₂O vapour', 0.12, { q: 1 }); } else if (w.s > 0.12 && w.s < 0.9) nameAt(Lf, 'w', w, 'H₂O', 0.12); }
      }
      for (i = 0; i < Lf.NC; i++) {
        var c = Lf.cs[i];
        if (!c) { Lf.cas.setMatrixAt(i, zero); Lf.caGlow.hide(i); continue; }
        ahPos(Lf, c, p); p.z += 0.03;
        mtx.compose(p, q.identity(), sc.setScalar(1)); Lf.cas.setMatrixAt(i, mtx); Lf.caGlow.set(i, p.x, p.y, p.z);
        if (Lf.L.open ? c.s > 1.05 : c.s > 0.12) nameAt(Lf, 'ca', c, 'Ca²⁺', 0.16);
      }
      for (i = 0; i < Lf.ND; i++) {
        var d = Lf.deps[i];
        var ba = Lf.depB.geometry.attributes.position;
        if (!d) { Lf.dep.hide(i); ba.setXYZ(i, 0, 1e4, 0); continue; }
        p.copy(d.side.getPoint(d.s)); Lf.dep.set(i, p.x, p.y, p.z + 0.05); ba.setXYZ(i, p.x + 0.04 * Math.sin(i * 7), p.y + 0.04 * Math.cos(i * 5), p.z + 0.08);
      }
      Lf.depB.geometry.attributes.position.needsUpdate = true;
      Lf.water.instanceMatrix.needsUpdate = true; Lf.cas.instanceMatrix.needsUpdate = true;
      Lf.vap.commit(); Lf.caGlow.commit(); Lf.dep.commit();
    });
    if (HN) HN.end();
    // haze inside the head: drifts slowly in still air, faster when air is moved in
    var sp = AH.air ? 0.9 : 0.18;
    AH.hz.forEach(function (h, i) {
      if (dt > 0) { h.a += dt * sp * h.s; h.b += dt * sp * 0.6 * h.s; }
      AH.haze.set(i, 2.4 + Math.cos(h.a) * 2.4 * h.r, -0.3 + Math.sin(h.b) * 3.4 * h.r, -1.2 + Math.sin(h.a * 1.3) * 1.6 * h.r);
    });
    AH.haze.commit();
    AH.haze.mat.opacity = AH.air ? 0.18 : 0.38;
    ctx.mats.bub.opacity = AH.air ? 0.035 : 0.08;
  }
  function ahLabels(ctx) {
    var T = ctx.THREE, o = AH.leaves[0], n = AH.leaves[1], v = new T.Vector3();
    function at(Lf, u, x, dz) { ahSurf(Lf.L, u, x, v); v.z += dz || 0.2; return Lf.grp.localToWorld(v.clone()); }
    ctx.setLabels([
      { id: 'o', text: 'outer leaf, open to the field air', tier: 1, pos: at(o, 0.82, -0.5) },
      { id: 'i', text: 'inner leaf, enclosed', tier: 1, side: 'right', pos: at(n, 0.7, 0.1) },
      { id: 'c', text: 'Ca²⁺ stays in the leaf', tier: 1, pos: at(o, 0.6, -0.62) },
      /* fix round (Q H2): the tier 2 tags "thick midrib: water and Ca²⁺ ride up its xylem" and "water leaves as vapour"
         are retired from the hero; the H₂O, Ca²⁺ and H₂O vapour names now say the same thing on the molecules, and the
         caption below the hero still states both */
      { id: 'h', text: 'still, humid air inside the head', tier: 2, pos: new T.Vector3(1.0, -3.0, -0.6), narrow: false }
    ]);
  }
  function ahFocusAt(k, u) {
    var Lf = AH.leaves[k], T = AH.ctx.THREE, v = new T.Vector3();
    if (!Lf) return [0, 0, 0];
    ahSurf(Lf.L, u, 0, v); v.z += 0.2; return Lf.grp.localToWorld(v);
  }
  function ahCamera(ctx, t) {
    var ph = ctx.reduced ? 0 : t, a = 0.03 + 0.1 * Math.sin(ph * 0.07), R = (ctx.narrow ? 26 : 19.5) - 2.2 * (0.5 - 0.5 * Math.cos(ph * 0.16)); // 13 Oct: closer, so the leaves and their molecules read larger
    ctx.camera.position.set(0.6 + Math.sin(a) * R, 2.0 + 0.5 * Math.sin(ph * 0.05), Math.cos(a) * R);
    ctx.camera.lookAt(ctx.narrow ? 1.3 : -0.2, ctx.narrow ? 0.4 : 1.3, -0.4);
    if (AH.front) AH.front.position.x = ctx.narrow ? 8.6 : 5.6;
  }
  function ahTheme(ctx) {
    var m = ctx.mats, d = ctx.dark;
    if (m.front) m.front.emissiveIntensity = d ? 0.3 : 0.8;
    if (m.leaf_outer) { m.leaf_outer.emissiveIntensity = d ? 1.3 : 0.8; m.leaf_inner.emissiveIntensity = d ? 1.9 : 0.8; m.ca.emissiveIntensity = d ? 1.4 : 0.9; }
  }
  function ahLive() {
    if (!AH.ctx) return;
    var nb = ' ', o = AH.leaves[0], n = AH.leaves[1];
    if (AH.notRom) { AH.ctx.setLive('Waiting for romaine: pick an afternoon below'); return; }
    var co = o ? o.total : 0, ci = n ? n.total : 0;
    AH.ctx.setLive('<span style="white-space:nowrap">outer E ' + WP.fmt.num(AH.Eo, 2) + '</span> · <span style="white-space:nowrap">inner E ' + WP.fmt.num(AH.Ei, 2) + nb + 'mmol' + nb + 'm⁻²' + nb + 's⁻¹</span> · <span style="white-space:nowrap">drawn Ca²⁺ left so far: outer ' + co + ', inner ' + ci + '</span> <span style="white-space:nowrap">(illustrative)</span>');
  }
  function ahInit(host) {
    AH.host = host;
    ahLazy(host, function () {
      if (AH.ctx) return;
      host.style.minHeight = '';
      AH.ctx = WP.macro.hero(host, {
        id: 'c6-hero', seed: 29, fov: 30, fogNear: 14, fogFar: 32, exposure: 1.0,
        label: 'Two leaves of one romaine head: a large outer leaf open to the field air and a pale, cupped inner leaf held in still, humid air inside the head. Water molecules and green calcium ions climb each midrib at a speed set by that leaf’s transpiration; water leaves as vapour, calcium stays behind in the leaf.',
        question: 'Why might the inner leaves of a romaine head run short of calcium?',
        answer: 'Calcium rides in the xylem water and stays behind when that water evaporates. The outer leaves transpire freely, so their stream is fast. The inner leaves sit in still, humid air inside the head, so their stream is slow, while they grow fastest. Enclosing young lettuce leaves lowered their calcium in solution culture (Barta and Tibbitts 1986). Does the same happen to inner leaves in a Salinas field? That is the open question this plate is about. The inner to outer ratio drawn here is illustrative.',
        credit: { text: 'Barta & Tibbitts · J. Amer. Soc. Hort. Sci. 1986', doi: '10.21273/JASHS.111.3.413' },
        capAlign: 'left', lift: function (ctx) { return ctx.narrow ? 60 : 0; },
        palette: { light: { top: '#3e5222', mid: '#7f9a46', bot: '#cdb26a', bokeh: ['#fff2c0', '#e9f2a8', '#ffd98a', '#c8e6a0'], fog: 0x7f9a46, fg: 'rgba(240,226,160,.5)' } },
        height: function (w) { return w < 600 ? 520 : Math.round(Math.min(680, Math.max(460, w * 0.66))); }, // 13 Oct (slow and named): larger
        fallbackNote: 'This 3D head needs WebGL, which this browser does not offer. The drawing and the calcium theatre below show the same streams.',
        build: ahBuild, frame: function (ctx, t, dt) { ahFrame(ctx, t, dt); if (dt > 0 && Math.floor(t * 2) !== AH._lt) { AH._lt = Math.floor(t * 2); ahLive(); } },
        camera: ahCamera, theme: ahTheme,
        /* LOOK CLOSER (14 Oct, controls engineer journey): zoom, pan and tilt from WP.macro.orbit; chips fly to the
           middle of each leaf (its midrib, where the water and Ca²⁺ climb), read at click time from the leaf surface */
        focus: [
          { id: 'inner', label: 'Inner leaf', dist: 11.5, theta: 0.25, phi: 1.4, target: function () { return ahFocusAt(1, 0.55); } },
          { id: 'outer', label: 'Outer leaf', dist: 10, theta: -0.15, phi: 1.35, target: function () { return ahFocusAt(0, 0.55); } }
        ]
      });
      ahLive();
    });
  }
  function ahUpd(Eo, Ei, notRom, air) {
    AH.Eo = Eo; AH.Ei = Ei; AH.notRom = notRom; AH.air = air;
    if (AH.ctx) { ahLive(); AH.ctx.invalidate(); }
  }

  WP.levels.push({ id: 'afternoon', n: 6, title: 'Your Salinas afternoon', subtitle: 'one romaine head, cut lengthwise', scale: '10 cm', focus: [50, 40], mount: mount, update: update, show: show });
})();

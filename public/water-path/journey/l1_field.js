/* The Water Path v8: l1_field.js (shell owner)
   Level I, Field (10 m). Stops 1a and 1b.
   Hand drawn Salinas scene per crop, sun arc tied to hour, VPD and Ψair with derivation,
   a sensor card separating reflected light (NDVI) from emitted heat (thermal),
   and evaporation cools the leaf. */
(function () {
  'use strict';
  /* 13 Oct (slow and named): CSS drawn motion (dashed streams) follows the page speed through --wp-ps */
  (function () { function ps() { if (window.PlaySpeed) document.documentElement.style.setProperty('--wp-ps', String(window.PlaySpeed.get())); } ps(); if (window.PlaySpeed) window.PlaySpeed.on(ps); })();
  var WP = window.WP = window.WP || {};
  WP.levels = WP.levels || [];
  var NS = 'http://www.w3.org/2000/svg';
  var ui, fmt, el, refs = {}, curveKey = '', lastCrop = '';

  function num(x, d) { return WP.fmt.num(x, d); }
  function clamp(x, a, b) { return x < a ? a : (x > b ? b : x); }
  function r1(x) { return Math.round(x * 10) / 10; }

  var CSS = '\
#lv-field .f1-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:16px}\
@media (min-width:1500px){#lv-field .f1-grid{grid-template-columns:minmax(0,1.55fr) minmax(0,1fr)}}\
@media (min-width:700px) and (max-width:1499px){#lv-field .f1-side{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.5fr);gap:14px;align-items:start}#lv-field .f1-side .fighead{grid-column:1/-1}}\
#lv-field .tile .k sub{text-transform:none}\
#lv-field .f1-scene{position:relative}\
#lv-field .f1-scene svg{display:block;width:100%;height:auto;border:1px solid var(--rule)}\
#lv-field .f1-sky{fill:var(--sky)}#lv-field .f1-sky2{fill:var(--sky2)}\
#lv-field .f1-hill{fill:var(--hill);stroke:var(--ink);stroke-width:1.1}\
#lv-field .f1-hill2{fill:var(--hill2);stroke:var(--ink);stroke-width:1}\
#lv-field .f1-ground{fill:var(--soil)}\
#lv-field .f1-bed{fill:var(--soil2);stroke:var(--ink);stroke-width:.5;stroke-opacity:.5}\
#lv-field .f1-ink{stroke:var(--ink);fill:none}\
#lv-field .f1-ink2{stroke:var(--ink2);fill:none}\
#lv-field .f1-rule{stroke:var(--rule);fill:none}\
#lv-field .f1-leaf{fill:var(--leaf);stroke:var(--ink);stroke-width:.9}\
#lv-field .f1-leaf2{fill:var(--leaf2);stroke:var(--ink);stroke-width:.8}\
#lv-field .f1-bark{fill:var(--bark);stroke:var(--ink);stroke-width:.8}\
#lv-field .f1-sun{fill:var(--sun);stroke:var(--ink);stroke-width:1.2}\
#lv-field .f1-fog{fill:var(--fog)}\
#lv-field .f1-furrow{fill:var(--ink);fill-opacity:.16}\
#lv-field .f1-cover{fill:var(--leaf);fill-opacity:.35}\
#lv-field .f1-hedge{fill:url(#f1-hatch);stroke:var(--ink);stroke-width:.35;stroke-opacity:.6}\
#lv-field .f1-hedgetop{fill:var(--leaf2);stroke:var(--ink);stroke-width:.3;stroke-opacity:.5}\
#lv-field .f1-trunk{stroke:var(--bark);fill:none;stroke-linecap:round}\
#lv-field .f1-post{stroke:var(--ink2);fill:none}\
#lv-field .f1-cordon{stroke:var(--ink);stroke-width:.8;fill:none;stroke-dasharray:6 3}\
#lv-field .f1-stream{fill:none;stroke:var(--ink2);stroke-width:1.3;stroke-linecap:round;stroke-dasharray:22 14;animation:f1-wind calc(1.6s / var(--wp-ps,1)) linear infinite}\
#lv-field .f1-capstrip{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:6px 16px;margin:6px 0 0;font-family:var(--ui);font-size:12.5px;color:var(--ink2)}\
#lv-field .f1-capstrip svg{width:150px;height:26px;border:0;display:inline-block;vertical-align:middle}\
:root[data-motion="reduce"] #lv-field .f1-stream{animation:none;opacity:.5}\
@media (prefers-reduced-motion:reduce){:root:not([data-motion="full"]) #lv-field .f1-stream{animation:none;opacity:.5}}\
#lv-field .f1-mol{pointer-events:none}\
#lv-field .f1-vap{stroke:var(--w2);fill:none;stroke-width:2.4;stroke-linecap:round;stroke-dasharray:3 9;animation:f1-rise calc(2.6s / var(--wp-ps,1)) linear infinite}\
#lv-field .f1-wind{stroke:var(--ink2);fill:none;stroke-width:1.2;stroke-dasharray:14 8;animation:f1-wind calc(1.6s / var(--wp-ps,1)) linear infinite}\
@keyframes f1-rise{to{stroke-dashoffset:24}}\
@keyframes f1-wind{to{stroke-dashoffset:-44}}\
:root[data-motion="reduce"] #lv-field .f1-vap,:root[data-motion="reduce"] #lv-field .f1-wind{animation:none}\
@media (prefers-reduced-motion:reduce){:root:not([data-motion="full"]) #lv-field .f1-vap,:root:not([data-motion="full"]) #lv-field .f1-wind{animation:none}}\
#lv-field svg text{fill:var(--ink);font-family:var(--text)}\
#lv-field svg .t2{fill:var(--ink2)}\
#lv-field svg .tui{font-family:var(--ui)}\
#lv-field svg .tm{font-family:var(--mono)}\
#lv-field .f1-cap{font-size:15px;color:var(--ink2);font-style:italic;margin:8px 0 0}\
#lv-field .f1-deriv{margin-top:10px}\
#lv-field .f1-deriv .row{display:grid;grid-template-columns:auto 1fr;gap:2px 10px;align-items:baseline;padding:5px 0;border-top:1px dotted var(--rule)}\
#lv-field .f1-deriv .row:first-child{border-top:0}\
#lv-field .f1-deriv .lab{font-family:var(--ui);font-size:12px;color:var(--ink2);white-space:nowrap}\
#lv-field .f1-deriv .eq{font-size:12.5px}\
#lv-field .f1-deriv .res{font-weight:600;color:var(--ink)}\
#lv-field .f1-sensors{display:grid;grid-template-columns:minmax(0,1fr);gap:12px;margin-top:6px}\
@media (min-width:760px){#lv-field .f1-sensors{grid-template-columns:1fr 1fr}}\
#lv-field .f1-sensor h4{font-family:var(--disp);font-weight:400;font-size:19px;margin:0 0 2px;letter-spacing:.03em}\
#lv-field .f1-sensor .what{font-family:var(--ui);font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--ink2);margin:0 0 6px}\
#lv-field .f1-sensor p{margin:6px 0 0;font-size:16px}\
#lv-field .f1-sensor .status{font-family:var(--ui);font-size:13px;color:var(--ink);margin-top:6px;padding:6px 8px;background:var(--paper);border:1px solid var(--rule2)}\
#lv-field .f1-btns{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 0}\
#lv-field .f1-two{display:grid;grid-template-columns:minmax(0,1fr);gap:16px;margin-top:16px}\
@media (min-width:860px){#lv-field .f1-two{grid-template-columns:1.2fr 1fr}}\
#lv-field .f1-chart text{font-family:var(--ui);font-size:11px;fill:var(--ink2)}\
@media (max-width:600px){#lv-field .f1-scene text{font-size:30px}#lv-field .f1-scene .f1-rngW{text-anchor:end}#lv-field .f1-scene .f1-wide{display:none}}\
@media (min-width:601px){#lv-field .f1-scene .f1-narrow{display:none}}\
#lv-field .f1-axis{stroke:var(--ink);stroke-width:1;fill:none}\
#lv-field .f1-grid-l{stroke:var(--rule2);stroke-width:1}\
#lv-field .f1-vpd{stroke:var(--warm);stroke-width:2.2;fill:none}\
#lv-field .f1-E{stroke:var(--w2);stroke-width:2.2;fill:none}\
#lv-field .f1-now{stroke:var(--ink);stroke-width:1;stroke-dasharray:3 3}\
#lv-field .f1-dot-v{fill:var(--warm);stroke:var(--paper);stroke-width:1.5}\
#lv-field .f1-dot-e{fill:var(--w2);stroke:var(--paper);stroke-width:1.5}\
#lv-field h3.f1-h{font-family:var(--disp);font-weight:400;font-size:22px;letter-spacing:.03em;margin:22px 0 2px}\
#lv-field .f1-q{color:var(--ink2);font-style:italic;margin:0 0 8px}\
#lv-field .f1-legend{display:flex;gap:14px;flex-wrap:wrap;font-family:var(--ui);font-size:12px;color:var(--ink2);margin:4px 0 0}\
#lv-field .f1-legend i{display:inline-block;width:18px;height:3px;vertical-align:3px;margin-right:5px}\
#lv-field .f1-crop-name{font-style:italic}\
#lv-field .f1-leafchips{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:-6px 0 14px}\
#lv-field .f1-chipl{font-family:var(--ui);font-size:13px;color:var(--ink2)}\
';

  /* ------------------------------------------------------------ scene geometry */
  var W = 1000, H = 560, HZ = 262, VPX = 520;   // horizon and vanishing point
  function persp(xb, t) { return { x: VPX + (xb - VPX) * t, y: HZ + (H - HZ) * t }; }

  function defs() {
    return '<defs>' +
      '<pattern id="f1-hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)"><rect width="5" height="5" class="f1-leaf" style="stroke:none"/><path d="M0,2.5 H5" stroke="var(--ink)" stroke-opacity=".35" stroke-width=".7"/></pattern>' +
      '<pattern id="f1-hatch2" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(40)"><rect width="4" height="4" class="f1-leaf2" style="stroke:none"/><path d="M0,2 H4" stroke="var(--ink)" stroke-opacity=".3" stroke-width=".6"/></pattern>' +
      '<pattern id="f1-hillh" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(70)"><rect width="7" height="7" class="f1-hill" style="stroke:none"/><path d="M0,3.5 H7" stroke="var(--ink)" stroke-opacity=".22" stroke-width=".8"/></pattern>' +
      '<pattern id="f1-soilh" width="14" height="10" patternUnits="userSpaceOnUse"><rect width="14" height="10" class="f1-ground"/><circle cx="3" cy="3" r=".9" fill="var(--ink2)"/><circle cx="10" cy="7" r=".7" fill="var(--ink2)"/><path d="M5,8 h3" stroke="var(--rule)" stroke-width=".6"/></pattern>' +
      '<filter id="f1-blur" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="9"/></filter>' +
      '<linearGradient id="f1-aerial" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--sky)" stop-opacity=".75"/><stop offset="1" stop-color="var(--sky)" stop-opacity="0"/></linearGradient>' +
      // young romaine rosette seen from the furrow edge: obovate leaves with white midribs
      '<g id="f1-romaine">' +
      '<path d="M0,0 C-20,-2 -30,-12 -26,-20 C-18,-22 -8,-12 0,-2Z M0,0 C20,-2 30,-12 26,-20 C18,-22 8,-12 0,-2Z" fill="url(#f1-hatch)" stroke="var(--ink)" stroke-width=".9"/>' +
      '<path d="M0,-1 C-10,-10 -14,-26 -8,-36 C-1,-34 3,-18 0,-1Z M0,-1 C10,-10 14,-26 8,-36 C1,-34 -3,-18 0,-1Z" class="f1-leaf2"/>' +
      '<path d="M0,-2 C-6,-12 -7,-24 -5,-33 M0,-2 C6,-12 7,-24 5,-33 M0,-1 C-10,-5 -18,-12 -23,-18 M0,-1 C10,-5 18,-12 23,-18" stroke="var(--rib)" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
      '<ellipse cx="0" cy="1" rx="24" ry="3" fill="var(--ink)" fill-opacity=".14"/>' +
      '</g>' +
      // vine clump (one panel of canopy)
      '<g id="f1-vine">' +
      '<path d="M-30,0 C-36,-16 -28,-40 -10,-46 C-2,-58 18,-56 24,-42 C38,-36 38,-12 30,0 Z" fill="url(#f1-hatch)" stroke="var(--ink)" stroke-width="1"/>' +
      '<path d="M-18,-10 C-14,-20 -16,-30 -8,-36 M8,-8 C12,-22 6,-34 14,-40" class="f1-ink" stroke-width=".7"/>' +
      '</g>' +
      // almond tree
      '<g id="f1-almond">' +
      '<path d="M-3,0 C-2,-14 -4,-24 -10,-34 M3,0 C2,-14 4,-22 12,-32 M0,-6 C1,-18 0,-28 1,-40" class="f1-bark" stroke-width="5" stroke-linecap="round" fill="none" style="stroke:var(--bark)"/>' +
      '<path d="M-3,0 C-2,-14 -4,-24 -10,-34 M3,0 C2,-14 4,-22 12,-32" class="f1-ink" stroke-width="1"/>' +
      '<path d="M-44,-40 C-52,-60 -36,-84 -14,-86 C-6,-100 22,-100 30,-84 C50,-80 54,-56 42,-42 C36,-30 -36,-28 -44,-40 Z" fill="url(#f1-hatch)" stroke="var(--ink)" stroke-width="1.1"/>' +
      '<path d="M-28,-50 C-20,-60 -10,-64 0,-62 M10,-74 C18,-70 26,-64 30,-56" class="f1-ink" stroke-width=".7"/>' +
      '<ellipse cx="6" cy="2" rx="40" ry="5" fill="var(--ink)" fill-opacity=".12"/>' +
      '</g>' +
      '</defs>';
  }

  function hills() {
    // Gabilan Range (east, left) and Santa Lucia Range (west, right). Engraved silhouettes.
    var gab = 'M0,' + (HZ - 4) + ' L0,176 C40,170 70,150 110,156 C150,162 170,138 210,142 C250,146 270,128 310,140 C350,152 380,170 430,190 C470,206 500,226 540,' + (HZ - 4) + ' Z';
    var luc = 'M430,' + (HZ - 4) + ' C500,232 560,214 610,200 C650,188 680,160 720,150 C760,140 790,120 830,126 C870,132 900,118 940,124 C970,128 990,140 1000,146 L1000,' + (HZ - 4) + ' Z';
    var far = 'M0,' + (HZ - 2) + ' C120,236 260,228 400,240 C540,250 700,232 860,238 C930,240 980,236 1000,238 L1000,' + HZ + ' L0,' + HZ + ' Z';
    return '<path d="' + gab + '" fill="url(#f1-hillh)" stroke="var(--ink)" stroke-width="1.1"/>' +
      '<path d="' + luc + '" fill="url(#f1-hillh)" stroke="var(--ink)" stroke-width="1.1"/>' +
      '<path d="' + far + '" class="f1-hill2"/>' +
      '<text x="60" y="214" font-size="15" font-style="italic">Gabilan Range, east</text>' +
      '<text x="800" y="200" font-size="15" font-style="italic" class="f1-rngW">Santa Lucia Range, west</text>';
  }

  function ground() {
    return '<rect x="0" y="' + HZ + '" width="' + W + '" height="' + (H - HZ) + '" fill="url(#f1-soilh)"/>' +
      '<path d="M0,' + HZ + ' H' + W + '" class="f1-ink" stroke-width="1.4"/>';
  }

  function rowsX(n, spacing) { var a = []; for (var i = -n; i <= n; i++) a.push(VPX + i * spacing); return a; }
  function depthTs(n, t0, k) { var a = [], t = t0; for (var i = 0; i < n; i++) { a.push(t); t = t * k; } return a.filter(function (x) { return x <= 1.08; }); }

  /* Romaine on raised beds about 1 m wide: furrow shadows, two seed lines per bed, young rosettes with white midribs */
  function romaineScene() {
    var s = '';
    var xs = rowsX(9, 150);
    for (var i = 0; i < xs.length - 1; i++) {
      var a0 = persp(xs[i] + 24, 0.02), a1 = persp(xs[i + 1] - 24, 0.02), b1 = persp(xs[i + 1] - 24, 1.1), b0 = persp(xs[i] + 24, 1.1);
      s += '<path d="M' + a0.x + ',' + a0.y + ' L' + a1.x + ',' + a1.y + ' L' + b1.x + ',' + b1.y + ' L' + b0.x + ',' + b0.y + ' Z" class="f1-bed"/>';
      // furrow shadow on the side of each bed away from the afternoon sun (west light, shadow on the east face)
      var f0 = persp(xs[i] + 24, 0.02), f1b = persp(xs[i] + 24, 1.1), g0 = persp(xs[i] + 38, 0.02), g1 = persp(xs[i] + 38, 1.1);
      s += '<path d="M' + f0.x + ',' + f0.y + ' L' + g0.x + ',' + g0.y + ' L' + g1.x + ',' + g1.y + ' L' + f1b.x + ',' + f1b.y + ' Z" class="f1-furrow"/>';
    }
    var ts = depthTs(40, 0.05, 1.095);
    var items = [];
    for (i = 0; i < xs.length - 1; i++) {
      var c = (xs[i] + xs[i + 1]) / 2;
      [c - 30, c + 30].forEach(function (xb, j) {
        var d0 = persp(xb, 0.02), d1 = persp(xb, 1.1);
        s += '<path d="M' + d0.x + ',' + d0.y + ' L' + d1.x + ',' + d1.y + '" class="f1-ink2" stroke-width=".5" stroke-dasharray="1 3"/>';
        ts.forEach(function (t, k) {
          var tt = t * (1 + (j ? 0.045 : 0));
          var p = persp(xb, tt);
          if (p.x < -40 || p.x > W + 40) return;
          items.push({ t: tt, svg: '<use href="#f1-romaine" transform="translate(' + r1(p.x) + ',' + r1(p.y) + ') scale(' + (tt * 0.9).toFixed(3) + ')"/>' });
        });
      });
    }
    items.sort(function (a, b) { return a.t - b.t; });
    return s + items.map(function (o) { return o.svg; }).join('');
  }

  /* Vineyard: flat topped VSP hedgerows, trunks under the canopy, posts, the cordon wire, cover crop in the alleys */
  function vineScene() {
    var s = '', xs = rowsX(6, 190), items = [];
    var PXM = 70;                           // px per metre at t = 1 (illustrative)
    var hC = 0.9, hT = 2.0, wC = 0.35;      // cordon height, canopy top, canopy half width (m)
    function P3(xb, t, h, dx) { var p = persp(xb + (dx || 0) * PXM, t); return [r1(p.x), r1(p.y - h * PXM * t)]; }
    var T0 = 0.03, T1 = 1.12;
    // cover crop alleys
    for (var i = 0; i < xs.length - 1; i++) {
      var q = [P3(xs[i], T0, 0, wC + 0.15), P3(xs[i + 1], T0, 0, -wC - 0.15), P3(xs[i + 1], T1, 0, -wC - 0.15), P3(xs[i], T1, 0, wC + 0.15)];
      s += '<path d="M' + q.map(function (p) { return p.join(','); }).join(' L') + 'Z" class="f1-cover"/>';
    }
    xs.forEach(function (xb) {
      var side = xb < VPX ? 1 : -1;        // which face of the hedge we see
      // trunks and posts at intervals, then the canopy band on top
      depthTs(40, 0.04, 1.09).forEach(function (t, k) {
        var g = P3(xb, t, 0), c = P3(xb, t, hC);
        if (g[0] < -60 || g[0] > W + 60) return;
        items.push({ t: t - 0.0002, svg: '<path d="M' + g[0] + ',' + g[1] + ' L' + c[0] + ',' + c[1] + '" class="f1-trunk" stroke-width="' + (3 * t + 0.4).toFixed(2) + '"/>' });
        if (k % 5 === 0) { var pt = P3(xb, t, hT + 0.25); items.push({ t: t + 0.0002, svg: '<path d="M' + g[0] + ',' + g[1] + ' L' + pt[0] + ',' + pt[1] + '" class="f1-post" stroke-width="' + (2.2 * t + 0.5).toFixed(2) + '"/>' }); }
      });
      var tsH = [T0].concat(depthTs(40, 0.045, 1.12)).concat([T1]);
      for (var j = 1; j < tsH.length; j++) {
        var ta = tsH[j - 1], tb = tsH[j];
        var A1 = P3(xb, ta, hT, side * wC), B1 = P3(xb, tb, hT, side * wC), B2 = P3(xb, tb, hC + 0.12, side * wC), A2 = P3(xb, ta, hC + 0.12, side * wC);
        var F1 = P3(xb, ta, hT + 0.06, side * wC * 0.1), F2 = P3(xb, tb, hT + 0.06, side * wC * 0.1);
        if (B1[0] < -80 && A1[0] < -80) continue;
        if (B1[0] > W + 80 && A1[0] > W + 80) continue;
        var C1 = P3(xb, ta, hC, 0), C2 = P3(xb, tb, hC, 0);
        items.push({ t: tb, svg: '<path d="M' + C1.join(',') + ' L' + C2.join(',') + '" class="f1-cordon"/>' +
          '<path d="M' + [F1, F2, B1, A1].map(function (p) { return p.join(','); }).join(' L') + 'Z" class="f1-hedgetop"/>' +
          '<path d="M' + [A1, B1, B2, A2].map(function (p) { return p.join(','); }).join(' L') + 'Z" class="f1-hedge"/>' });
      }
    });
    // draw by depth within each row, then the row hedges on top of their trunks
    items.sort(function (a, b) { return a.t - b.t; });
    return s + items.map(function (o) { return o.svg; }).join('');
  }

  function almondScene() {
    var xs = rowsX(5, 260), ts = depthTs(14, 0.07, 1.27), items = [];
    xs.forEach(function (xb, i) {
      ts.forEach(function (t, k) {
        var p = persp(xb + ((k % 2) ? 0 : 0), t);
        if (p.x < -80 || p.x > W + 80) return;
        items.push({ t: t, svg: '<use href="#f1-almond" transform="translate(' + r1(p.x) + ',' + r1(p.y) + ') scale(' + (t * 1.5).toFixed(3) + ')"/>' });
      });
    });
    items.sort(function (a, b) { return a.t - b.t; });
    return items.map(function (o) { return o.svg; }).join('');
  }

  var CROP_INFO = {
    romaine: { name: 'Romaine lettuce beds on the Salinas Valley floor', short: 'romaine', vap: [[200, 470], [380, 500], [600, 488], [800, 470]] },
    grape: { name: 'Vineyard rows on a bench above the valley', short: 'grapevine', vap: [[180, 420], [400, 440], [640, 430], [840, 420]] },
    almond: { name: 'Almond orchard (a Central Valley crop, shown here for contrast; its preset day is hotter and drier)', short: 'almond', vap: [[170, 360], [420, 380], [660, 372], [860, 360]] }
  };

  function sceneSVG(crop) {
    var body = crop === 'romaine' ? romaineScene() : (crop === 'almond' ? almondScene() : vineScene());
    var info = CROP_INFO[crop];
    var vap = info.vap.map(function (p, i) {
      var x = p[0], y = p[1];
      return '<path class="f1-vap" d="M' + x + ',' + y + ' c-8,-14 8,-24 0,-38 c-8,-14 8,-24 0,-38" style="animation-delay:-' + (i * 0.6) + 's"/>';
    }).join('');
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" class="f1-scene" role="img" aria-labelledby="f1-st f1-sd">' +
      '<title id="f1-st">Salinas Valley field scene</title><desc id="f1-sd"></desc>' + defs() +
      '<rect x="0" y="0" width="' + W + '" height="' + HZ + '" class="f1-sky"/>' +
      '<g id="f1-sunarc"></g>' +
      hills() +
      '<g id="f1-fog"></g>' +
      ground() +
      '<g id="f1-crop">' + body + '</g>' +
      // aerial perspective: distance pales toward the horizon
      '<rect x="0" y="' + HZ + '" width="' + W + '" height="' + Math.round((H - HZ) * 0.42) + '" fill="url(#f1-aerial)" pointer-events="none"/>' +
      '<g id="f1-vapour">' + vap + '</g>' +
      '<g id="f1-windg"></g>' +
      '<rect id="f1-night" x="0" y="0" width="' + W + '" height="' + H + '" fill="#0b1422" opacity="0" pointer-events="none"/>' +
      '</svg>';
  }

  function sunArc(st, res) {
    var g = refs.svg.querySelector('#f1-sunarc');
    var t0 = 6.2, t1 = 19.6, cx = 520, rx = 430, ry = 200;
    var t = (st.hour - t0) / (t1 - t0);
    var arc = 'M' + (cx - rx) + ',' + HZ + ' A' + rx + ',' + ry + ' 0 0 1 ' + (cx + rx) + ',' + HZ;
    var ticks = '';
    [9, 12, 15, 18].forEach(function (h) {
      var a = Math.PI * (1 - (h - t0) / (t1 - t0));
      var x = cx + rx * Math.cos(a), y = HZ - ry * Math.sin(a);
      ticks += '<circle cx="' + r1(x) + '" cy="' + r1(y) + '" r="2.2" fill="var(--ink2)"/><text x="' + r1(x) + '" y="' + r1(y - 8) + '" font-size="12" class="t2 tm" text-anchor="middle">' + (h < 10 ? '0' : '') + h + ':00</text>';
    });
    var sun = '';
    if (t > 0 && t < 1) {
      var a = Math.PI * (1 - t), sx = cx + rx * Math.cos(a), sy = HZ - ry * Math.sin(a);
      var rays = '';
      for (var i = 0; i < 12; i++) {
        var b = i * Math.PI / 6;
        rays += 'M' + r1(sx + 22 * Math.cos(b)) + ',' + r1(sy + 22 * Math.sin(b)) + ' L' + r1(sx + 31 * Math.cos(b)) + ',' + r1(sy + 31 * Math.sin(b)) + ' ';
      }
      sun = '<path d="' + rays + '" class="f1-ink" stroke-width="1.2"/><circle cx="' + r1(sx) + '" cy="' + r1(sy) + '" r="17" class="f1-sun"/>';
    }
    g.innerHTML = '<path d="' + arc + '" class="f1-ink2" stroke-width="1" stroke-dasharray="2 6"/>' + ticks + sun +
      '<text x="' + (cx - rx + 6) + '" y="' + (HZ - 10) + '" font-size="12" class="t2 tui">E</text><text x="' + (cx + rx - 14) + '" y="' + (HZ - 10) + '" font-size="12" class="t2 tui">W</text>';
    var alt = t > 0 && t < 1 ? Math.sin(Math.PI * t) : -0.2;
    var night = clamp((0.25 - alt) * 1.6, 0, 0.55);
    if (ui.isDark()) night *= 0.5;
    refs.svg.querySelector('#f1-night').setAttribute('opacity', night.toFixed(2));
  }

  /* marine layer: a band over the Santa Lucia side and the valley floor whose opacity follows RH */
  function fog(st) {
    var o = clamp((st.RH - 35) / 60, 0, 0.92);
    var g = refs.svg.querySelector('#f1-fog');
    if (o <= 0.02) { g.innerHTML = ''; return; }
    g.innerHTML = '<g filter="url(#f1-blur)" opacity="' + o.toFixed(2) + '">' +
      '<rect x="380" y="' + (HZ - 70) + '" width="680" height="54" rx="27" class="f1-fog"/><rect x="-60" y="' + (HZ - 26) + '" width="1120" height="40" rx="20" class="f1-fog"/></g>' +
      (o > 0.45 ? '<text x="980" y="' + (HZ - 96) + '" font-size="14" text-anchor="end" class="t2" font-style="italic">marine layer off the Pacific</text>' : '');
  }

  /* wind: three streamlines across the valley; speed follows the wind slider (a boundary layer note, not in E) */
  function wind(st) {
    var g = refs.svg.querySelector('#f1-windg');
    var dur = Math.max(0.35, 3.2 / Math.sqrt(st.wind)), amp = 4 + st.wind;
    var lines = '';
    [[72, 0], [116, 0.4], [HZ + 30, 0.8]].forEach(function (p, i) {
      var y = p[0];
      lines += '<path class="f1-stream" style="animation-duration:' + dur.toFixed(2) + 's;animation-delay:-' + p[1] + 's" d="M-20,' + y + ' C200,' + r1(y - amp) + ' 380,' + r1(y + amp) + ' 520,' + y + ' S860,' + r1(y - amp) + ' 1020,' + y + '"/>';
    });
    g.innerHTML = lines;
    var n = el.querySelector('[data-r="windnote"]');
    if (n) n.textContent = 'Wind ' + num(st.wind, 1) + ' m s⁻¹, drawn as streamlines: a boundary layer note, not in E.';
  }

  function vapour(res) {
    var g = refs.svg.querySelector('#f1-vapour');
    var E = res.E;
    g.setAttribute('opacity', clamp(E / 3, 0, 1).toFixed(2));
    var dur = clamp(5 / Math.max(0.3, E), 0.9, 8);
    Array.prototype.forEach.call(g.children, function (p) { p.style.animationDuration = dur.toFixed(2) + 's'; });
    fv.E = E; fv.wind = WP.state ? WP.state.wind : 2;
    fvBuild();
  }

  /* r7 unifier: the vapour off the crop in the mol.js template. Water molecules (red O, two white H) leave the canopy
     at a rate set by the model E (drawing scale: 4 molecules s⁻¹ per mmol m⁻² s⁻¹ over the whole scene, ILLUSTRATIVE),
     rise, drift downwind with the wind slider and fade as they mix into the air. A rounded tag reads E live.
     Draws only while the scene is on screen; reduced motion shows a still, settled frame. */
  var fv = { E: 0, wind: 2, mols: [], raf: 0, t0: 0, vis: false, acc: 0, svg: null, seed: 7, paused: null, rm: null, fz: null }; // v19: paused (click the view to freeze; reduced motion starts paused)
  var FV_RATE = 4;
  function fvRnd() { fv.seed = (fv.seed * 16807) % 2147483647; return (fv.seed - 1) / 2147483646; }
  function fvSpawn(age) {
    var src = CROP_INFO[lastCrop || 'romaine'].vap, p = src[Math.floor(fvRnd() * src.length)];
    var m = { x: p[0] + (fvRnd() - 0.5) * 150, y: p[1] + (fvRnd() - 0.5) * 30, r: fvRnd() * 360, s: 1.2 + fvRnd() * 0.9, age: 0, life: 4 + fvRnd() * 3, el: null };
    m.y0 = m.y;
    if (age) fvMove(m, age);
    return m;
  }
  function fvMove(m, dt) {
    m.age += dt; m.y -= (22 + 6 * m.s) * dt; m.x += (6 + 9 * fv.wind) * dt * (0.6 + 0.4 * Math.sin(m.age * 1.7 + m.s * 5)); m.r += 40 * dt;
  }
  function fvBuild() {
    var MS = WP.molsvg; if (!MS || !refs.svg) return;
    var g = refs.svg.querySelector('#f1-vmol');
    if (!g || fv.svg !== refs.svg) {
      fv.svg = refs.svg; fv.mols = [];
      var old = refs.svg.querySelector('#f1-vapour'); if (old) old.style.display = 'none';   // the dashed wisps give way to molecules
      g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); g.setAttribute('id', 'f1-vmol');
      var night = refs.svg.querySelector('#f1-night'); refs.svg.insertBefore(g, night);
      var tg = document.createElementNS('http://www.w3.org/2000/svg', 'g'); tg.setAttribute('id', 'f1-vtag');
      refs.svg.insertBefore(tg, night);
      var ng = document.createElementNS('http://www.w3.org/2000/svg', 'g'); ng.setAttribute('id', 'f1-vname'); refs.svg.insertBefore(ng, night);
      fv.nm = WP.svgNames(refs.svg, ng);
      if (!fv.io && 'IntersectionObserver' in window) {
        fv.io = new IntersectionObserver(function (es) { fv.vis = es[0].isIntersecting; fvRun(); });
      }
      if (fv.io) { fv.io.disconnect(); fv.io.observe(refs.svg); } else fv.vis = true;
    }
    // how many molecules are in flight at steady state: rate × mean life
    var want = Math.round(clamp(FV_RATE * fv.E * 5.5, 0, 90));
    if (fv.mols.length === 0 || (ui.reducedMotion() && fv.paused)) {
      fv.mols = []; for (var i = 0; i < want; i++) fv.mols.push(fvSpawn(fvRnd() * 5.5));
      fvPaint(true);
    }
    var t = refs.svg.querySelector('#f1-vtag');
    if (t) t.innerHTML = MS.tag(VPX, HZ + 26, 'vapour leaving: ' + num(fv.E, 2) + ' mmol m⁻² s⁻¹', { anchor: 'middle' });
    if (fv.paused == null) fv.rm = fv.paused = ui.reducedMotion();
    if (!fv.fz && window.WPFreeze && refs.scene) fv.fz = WPFreeze.attach(refs.scene, { paused: function () { return fv.paused; }, set: function (p) { fv.paused = !!p; if (!p) fvRun(); } });
    fvRun();
  }
  function fvPaint(rebuild) {
    var g = fv.svg && fv.svg.querySelector('#f1-vmol'), MS = WP.molsvg; if (!g || !MS) return;
    if (rebuild || g.childNodes.length !== fv.mols.length) {
      g.innerHTML = fv.mols.map(function () { return MS.use('vap', 'f1-mol'); }).join('');
    }
    var cs = g.childNodes;
    for (var i = 0; i < fv.mols.length; i++) {
      var m = fv.mols[i], a = clamp(Math.min(m.age / 0.6, 1) * (1 - m.age / m.life), 0, 1);
      MS.place(cs[i], m.x, m.y, m.r, m.s * (1 + 0.5 * m.age / m.life));
      cs[i].setAttribute('opacity', a.toFixed(2));
    }
    // 13 Oct (slow and named): one or two rising molecules carry the name "H₂O vapour" (a swarm: 2 at desktop width, 1 on phones)
    if (fv.nm) fv.nm.frame(fv.mols.filter(function (m) { return m.age > 0.8 && m.age < m.life - 1.2; }).map(function (m) { return { k: 'vap', key: m, x: m.x, y: m.y, r: 4.5 * m.s * (1 + 0.5 * m.age / m.life), t: 'H₂O vapour' }; }));
  }
  if (window.MolNames) window.MolNames.on(function () { if (fv.nm) { fv.nm.dirty(); fvPaint(false); } });
  function fvFrame(t) {
    if (!fv.vis || fv.paused || document.hidden) { fv.raf = 0; return; }
    var dt = fv.t0 ? Math.min(0.1, (t - fv.t0) / 1000) : 0; dt *= (window.PlaySpeed ? window.PlaySpeed.get() : 1); fv.t0 = t;
    fv.acc += FV_RATE * fv.E * dt;
    fv.mols = fv.mols.filter(function (m) { fvMove(m, dt); return m.age < m.life; });
    while (fv.acc >= 1 && fv.mols.length < 120) { fv.acc -= 1; fv.mols.push(fvSpawn(0)); }
    fvPaint(false);
    fv.raf = requestAnimationFrame(fvFrame);
  }
  function fvRun() {
    if (fv.raf || !fv.vis || fv.paused) return;
    fv.t0 = 0; fv.raf = requestAnimationFrame(fvFrame);
  }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) fvRun(); });

  /* ------------------------------------------------------------ diel chart */
  function dielData(st) {
    var out = [];
    for (var h = 5; h <= 20.001; h += 0.5) {
      var d = WP.diel(st.crop, h), s = {}, k;
      for (k in st) s[k] = st[k];
      s.hour = h; s.T = d.T; s.RH = d.RH; s.ppfd = d.ppfd;
      var r = WP.solve(s);
      out.push({ h: h, vpd: r.VPD, E: r.E });
    }
    return out;
  }
  function chart(st, res) {
    var key = [st.crop, st.soilPsi, st.lightQ, st.phos, st.pHcyt, st.ca, st.ko, WP.dielPreset].join('|');
    if (key !== curveKey) { refs.diel = dielData(st); curveKey = key; }
    var narrow = (refs.chart.clientWidth || 600) < 600;
    var d = refs.diel, w = narrow ? 360 : 560, h = narrow ? 236 : 250, L = narrow ? 30 : 46, R = narrow ? 30 : 46, T = 14, B = 34;
    var vmax = 4, emax = 4;
    d.forEach(function (p) { vmax = Math.max(vmax, Math.ceil(p.vpd)); emax = Math.max(emax, p.E); });
    vmax = Math.max(vmax, Math.ceil(res.VPD)); emax = Math.max(emax, res.E);
    // round ticks on both axes: VPD every 1 kPa, E every estep mmol on the same gridlines
    var estep = Math.max(1, Math.ceil(emax / vmax)); emax = estep * vmax;
    refs.chartNarrow = narrow;
    function X(hh) { return L + (hh - 5) / 15 * (w - L - R); }
    function YV(v) { return T + (1 - v / vmax) * (h - T - B); }
    function YE(v) { return T + (1 - v / emax) * (h - T - B); }
    var g = '';
    for (var i = 0; i <= vmax; i++) {
      var y = T + i / vmax * (h - T - B);
      g += '<path d="M' + L + ',' + y + ' H' + (w - R) + '" class="f1-grid-l"/>';
      g += '<text x="' + (L - 6) + '" y="' + (y + 4) + '" text-anchor="end">' + num(vmax - i, 0) + '</text>';
      g += '<text x="' + (w - R + 6) + '" y="' + (y + 4) + '">' + num(estep * (vmax - i), 0) + '</text>';
    }
    [5, 8, 11, 14, 17, 20].forEach(function (hh) { g += '<text x="' + X(hh) + '" y="' + (h - B + 16) + '" text-anchor="middle">' + (hh < 10 ? '0' : '') + hh + ':00</text>'; });
    var pv = d.map(function (p, j) { return (j ? 'L' : 'M') + r1(X(p.h)) + ',' + r1(YV(p.vpd)); }).join('');
    var pe = d.map(function (p, j) { return (j ? 'L' : 'M') + r1(X(p.h)) + ',' + r1(YE(p.E)); }).join('');
    var nx = X(st.hour);
    refs.chart.innerHTML = '<svg viewBox="0 0 ' + w + ' ' + h + '" class="f1-chart" role="img" aria-label="Vapour pressure deficit and transpiration across an illustrative Salinas day, with your current settings marked">' +
      g + '<path d="M' + L + ',' + T + ' V' + (h - B) + ' H' + (w - R) + ' V' + T + '" class="f1-axis"/>' +
      '<text x="2" y="' + (h - 4) + '">VPD, kPa (left)</text><text x="' + (w - 2) + '" y="' + (h - 4) + '" text-anchor="end">E, mmol m⁻² s⁻¹ (right)</text>' +
      '<path d="' + pv + '" class="f1-vpd"/><path d="' + pe + '" class="f1-E"/>' +
      '<path d="M' + r1(nx) + ',' + T + ' V' + (h - B) + '" class="f1-now"/>' +
      '<circle cx="' + r1(nx) + '" cy="' + r1(YV(res.VPD)) + '" r="5" class="f1-dot-v"/><circle cx="' + r1(nx) + '" cy="' + r1(YE(res.E)) + '" r="5" class="f1-dot-e"/>' +
      '</svg>';
  }

  /* ------------------------------------------------------------ derivation */
  function derivation(st, res) {
    var es = WP.model.es(st.T), ea = es * st.RH / 100, vpd = es - ea;
    var TK = st.T + 273.15, RT = 8.314 * TK / 18.05e-6 / 1e6;
    var lam = (WP.params && WP.params.phys && WP.params.phys.lambda) ? WP.params.phys.lambda.v : 44;
    var heat = res.E * lam;              // mmol m−2 s−1 × kJ mol−1 = W m−2
    var D = ui.badge('DERIVED');
    refs.deriv.innerHTML =
      row('Saturation', 'e<sub>s</sub>(T) = 0.6108 exp(17.27 T ÷ (T + 237.3)) = <span class="res">' + num(es, 2) + ' kPa</span> at ' + num(st.T, 1) + ' °C ' + D) +
      row('Actual', 'e<sub>a</sub> = e<sub>s</sub> × RH ÷ 100 = ' + num(es, 2) + ' × ' + num(st.RH / 100, 2) + ' = <span class="res">' + num(ea, 2) + ' kPa</span>') +
      row('Deficit', 'VPD = e<sub>s</sub> − e<sub>a</sub> = <span class="res">' + num(vpd, 2) + ' kPa</span> ' + D) +
      row('Air Ψ', 'Ψ<sub>air</sub> = (R T ÷ V̄<sub>w</sub>) ln(RH ÷ 100) = (8.314 × ' + num(TK, 1) + ' ÷ 18.05 × 10⁻⁶) × ln(' + num(st.RH / 100, 2) + ') = <span class="res">' + WP.fmt.psi(res.psiAir, 1) + '</span> ' + D) +
      row('Transpiration', 'E = (g<sub>s</sub> + g<sub>min</sub>) × VPD ÷ P<sub>atm</sub> = (' + num(res.gs, 3) + ' + ' + num(res.gmin, 3) + ') × ' + num(res.VPD, 2) + ' ÷ 101.3 × 1000 = <span class="res">' + num(res.E, 2) + ' mmol m⁻² s⁻¹</span> ' + ui.badge('ILLUSTRATIVE', 'gs comes from the model with illustrative constants.')) +
      row('Cooling', 'heat taken up by evaporation = λE = ' + num(lam, 0) + ' kJ mol⁻¹ × ' + num(res.E, 2) + ' mmol m⁻² s⁻¹ = <span class="res">' + num(heat, 0) + ' W m⁻²</span> ' + D) +
      '<p class="cap" style="margin-top:6px">Leaf temperature is taken equal to air temperature for VPD (a model assumption). The air step is ' +
      num(res.airRatio || (res.psiAir / (res.psi.leafOut - res.psi.soil)), 0) + ' times the whole drop from soil to leaf right now. Tetens coefficients as FAO 56 Eq. 11.</p>';
    function row(l, e) { return '<div class="row"><span class="lab">' + l + '</span><span class="eq">' + e + '</span></div>'; }
    refs.tiles.innerHTML =
      tile('VPD', num(res.VPD, 2) + ' <small>kPa</small>', 'DERIVED') +
      tile('Ψ<sub>air</sub>', num(res.psiAir, 1) + ' <small>MPa</small>', 'DERIVED') +
      tile('E, this crop', num(res.E, 2) + ' <small>mmol m⁻² s⁻¹</small>', 'ILLUSTRATIVE');
    function tile(k, v, b) { return '<div class="tile"><div class="k">' + k + ' ' + ui.badge(b) + '</div><div class="v">' + v + '</div></div>'; }
  }

  /* ------------------------------------------------------------ sensor card */
  function sensors(st, res) {
    // Qualitative only. The engine holds leaf temperature at air temperature, so this marker shows a direction, not a temperature.
    var cooling = clamp(res.E / 4, 0, 1);
    var heating = clamp(st.ppfd / 1500, 0, 1) * 0.6;
    var w = clamp(heating - cooling, -1, 1);             // −1 cooler than air, +1 warmer than air
    var pos = 50 + w * 42;
    var col = w < 0 ? 'var(--cool)' : 'var(--warm)';
    var txt = w < -0.25 ? 'Running cooler than the air: evaporation is taking heat out of the leaf.' :
      (w > 0.25 ? 'Running warmer than the air: stomata are closing, so evaporation is no longer cooling the leaf in the sun.' :
        'Close to air temperature: some evaporative cooling, or little sun.');
    refs.therm.innerHTML =
      '<svg viewBox="0 0 300 92" role="img" aria-label="Thermal reading, direction only: ' + txt + '" style="width:100%;height:auto;display:block">' +
      '<defs><linearGradient id="f1-tg" x1="0" x2="1"><stop offset="0" stop-color="var(--cool)"/><stop offset=".5" stop-color="var(--paper)"/><stop offset="1" stop-color="var(--warm)"/></linearGradient></defs>' +
      '<rect x="20" y="40" width="260" height="10" fill="url(#f1-tg)" stroke="var(--ink)" stroke-width=".8"/>' +
      '<path d="M150,36 V54" stroke="var(--ink)" stroke-width="1"/>' +
      '<text x="20" y="70" font-size="14" class="tui t2">cooler</text><text x="150" y="70" font-size="14" class="tui t2" text-anchor="middle">air</text><text x="280" y="70" font-size="14" class="tui t2" text-anchor="end">warmer</text>' +
      '<g transform="translate(' + r1(20 + pos / 100 * 260) + ',30)"><path d="M0,0 C-10,-6 -12,-20 0,-28 C12,-20 10,-6 0,0Z" fill="' + col + '" stroke="var(--ink)" stroke-width="1"/><path d="M0,0 V12" stroke="var(--ink)" stroke-width="1.2"/></g>' +
      '</svg>';
    refs.thermS.innerHTML = txt + ' ' + ui.badge('ILLUSTRATIVE', 'Direction only. The model holds leaf temperature at air temperature; this marker adds the evaporative cooling the camera would see.');
    refs.ndviS.innerHTML = 'Unchanged across this afternoon. Greenness and leaf area do not change between 9 am and 3 pm, even when the stomata do.';
  }

  /* ------------------------------------------------------------ predict then check */
  function ptc(id, q, opts, correct, answer) {
    return '<div class="ptc" id="' + id + '"><p class="q">' + q + '</p><div class="chips" role="radiogroup" aria-label="Your prediction">' +
      opts.map(function (o, i) { return '<button type="button" class="chip" role="radio" aria-checked="false" data-i="' + i + '">' + o + '</button>'; }).join('') +
      '</div><div class="qrow" style="margin-top:8px"><button type="button" class="btn small primary" disabled data-check>Check</button></div>' +
      '<div class="ans" hidden data-correct="' + correct + '"><p class="verdict" style="margin:0 0 4px;font-weight:600"></p><p style="margin:0">' + answer + '</p></div></div>';
  }
  function wirePtc(root) {
    root.addEventListener('click', function (e) {
      var chip = e.target.closest('.ptc .chip');
      if (chip) {
        var box = chip.closest('.ptc');
        Array.prototype.forEach.call(box.querySelectorAll('.chip'), function (c) { c.setAttribute('aria-checked', c === chip ? 'true' : 'false'); });
        box.querySelector('[data-check]').disabled = false;
        return;
      }
      var chk = e.target.closest('.ptc [data-check]');
      if (chk) {
        var b = chk.closest('.ptc'), sel = b.querySelector('.chip[aria-checked="true"]'), ans = b.querySelector('.ans');
        var ok = sel && sel.dataset.i === ans.dataset.correct;
        ans.querySelector('.verdict').textContent = ok ? 'Yes.' : 'Not quite. Here is the reasoning.';
        ans.hidden = false;
      }
    });
  }

  /* ------------------------------------------------------------ mount */
  var rzT = 0;
  window.addEventListener('resize', function () {
    clearTimeout(rzT);
    rzT = setTimeout(function () {
      if (!refs.chart || !WP.state) return;
      var n = (refs.chart.clientWidth || 600) < 600;
      if (n !== refs.chartNarrow) chart(WP.state, WP.result);
    }, 150);
  });
  /* evidence registry (CONTRACT addendum); DOIs only from SPEC.json */
  WP.howto = WP.howto || {};
  var HT1 = {
    'vpd': { title: 'VPD from air temperature and humidity', what: 'two sensors and one equation', steps: [
      'Shade a temperature and relative humidity sensor (a ventilated radiation shield) at canopy height and log both every few minutes.',
      'Saturation vapour pressure es = 0.6108 exp(17.27 T ÷ (T + 237.3)) kPa; actual ea = es × RH ÷ 100; VPD = es − ea. DERIVED (FAO 56 Eq. 11).',
      'For the leaf to air VPD that drives transpiration, use leaf temperature for es (an infrared thermometer or a thermocouple).'],
      watch: 'An unshaded sensor in sun reads hot and dry. Air VPD and leaf to air VPD differ whenever the leaf is warmer or cooler than the air.',
      dois: ['10.1175/1520-0450(1967)006<0203:otcosv>2.0.co;2'] },
    'eto': { title: 'reference evapotranspiration, ETo, from CIMIS', what: 'station data, then a crop coefficient', steps: [
      'Pick the nearest CIMIS station with similar exposure (Salinas North, Castroville, Gonzales or Soledad for the valley).',
      'Download daily ETo (FAO 56 Penman Monteith for a grass reference); long term monthly averages are tabulated in MWELO Appendix A.',
      'Crop water use ≈ ETo × Kc; for lettuce at full cover the basal coefficient was about 0.95 on a central California lysimeter (Bryla et al. 2010).'],
      watch: 'Station averages are not this week\'s weather; fog days and wind change ETo. The CIMIS web address is cited through MWELO until it is checked in a browser.',
      dois: ['10.21273/hortsci.45.11.1597'] }
  };
  Object.keys(HT1).forEach(function (k) { if (!WP.howto[k]) WP.howto[k] = HT1[k]; });
  WP.evidence = WP.evidence || {};
  var EV1 = {
    'l1.vpd': { claim: 'Vapour pressure deficit is the saturation vapour pressure at leaf temperature minus the actual vapour pressure of the air; it sets how hard the air pulls.',
      cite: 'Tetens form as given by Murray 1967, Journal of Applied Meteorology 6: 203; FAO 56 Eq. 11', doi: '10.1175/1520-0450(1967)006<0203:otcosv>2.0.co;2',
      measured: 'An empirical fit to saturation vapour pressure over water, used here as physics. Leaf temperature is set equal to air temperature (model assumption).', fig: 'Equation', badge: 'DERIVED' },
    'l1.psiair': { claim: 'Air at 25 °C and 40 % relative humidity sits near −126 MPa: Ψair = (R T ÷ Vw) ln(RH ÷ 100).',
      cite: 'Kelvin relation (physical chemistry); no paper needed', doi: '',
      measured: 'Calculated from air temperature and relative humidity in the conditions strip.', fig: 'Equation', badge: 'DERIVED' },
    'l1.diel': { claim: 'A warm Salinas afternoon: temperature, humidity and light by hour for each crop.',
      cite: 'Teaching preset, not a weather record', doi: '',
      measured: 'Nothing measured. The grapevine preset peaks at 25.5 °C, warmer than the NOAA 1991 to 2020 Salinas airport July normals (21.5 °C high, 12.8 °C low) used in the original Water Path; read it as a warm day, not an average one.', fig: 'none', badge: 'ILLUSTRATIVE' },
    'l1.normal': { claim: 'A July normal day in Salinas: 21.5 °C mean daily high and 12.8 °C mean daily low.',
      cite: 'NOAA 1991 to 2020 climate normals, Salinas airport, July (as used in the original Water Path)', doi: '',
      measured: 'The two temperature extremes are the published normals. The hour of each extreme, the humidity and the light through the day are teaching values. The almond preset stays the hotter Central Valley day.', fig: 'none', badge: 'ILLUSTRATIVE' },
    'l1.eto': { claim: 'Salinas North CIMIS station averages: about 4.4 mm per day in June and 3.7 mm per day in July.',
      cite: 'California Code of Regulations, Title 23, Model Water Efficient Landscape Ordinance, Appendix A (CIMIS station averages, inches per month), as used in the original Water Path', doi: '',
      measured: 'Monthly reference ET averages for a grass reference: June 5.2 and July 4.5 inches per month, converted to mm per day (DERIVED).', fig: 'Appendix A table', badge: 'MEASURED' },
    'l1.kcb': { claim: 'Lettuce basal crop coefficient about 0.95 at full cover.',
      cite: 'Bryla, Trout & Ayars 2010, HortScience 45: 1597 (central California weighing lysimeter)', doi: '10.21273/hortsci.45.11.1597',
      measured: 'Precision weighing lysimeter, 2002 to 2006; Kcb ≈ 0.95 in lettuce at midseason, when ground cover exceeded 70 to 90 %. Iceberg lettuce, not romaine; HortScience is outside the core journal list, so it is flagged.', fig: 'Abstract', badge: 'MEASURED' },
    'l1.ds': { claim: 'How dry the soil can get before a crop falls behind depends on the weather: in container grown corn, transpiration fell below the potential rate at 0.3 bar soil suction on 6 to 7 mm days, but only at 12 bar on 1.4 mm days.',
      cite: 'Denmead & Shaw 1962, Agronomy Journal 54: 385', doi: '10.2134/agronj1962.00021962005400050005x',
      measured: 'Corn in containers under field weather, soil suction and transpiration measured through the season.', fig: 'Synopsis (published abstract)', badge: 'MEASURED' },
    'l1.ritchie': { claim: 'A methods fight: in field corn on a weighing lysimeter, evaporation was practically independent of soil water status, with at least 80 % of extractable water freely available.',
      cite: 'Ritchie 1973, Agronomy Journal 65: 893', doi: '10.2134/agronj1973.00021962006500060014x',
      measured: 'Field corn, 1972, weighing lysimeter, 120 cm profile. Ritchie argues containers restrict roots and warns against using the Denmead and Shaw curves for field crops.', fig: 'Abstract', badge: 'MEASURED' },
    'l1.stempsi': { claim: 'Midday stem water potential, read on a bagged leaf in a pressure chamber, is a sensitive and less variable indicator of vine and tree water status.',
      cite: 'Choné et al. 2001, Annals of Botany 87: 477; Naor & Cohen 2003, HortScience 38: 547', doi: '10.1006/anbo.2000.1361', doi2: '10.21273/hortsci.38.4.547',
      measured: 'Grapevine (Choné); field grown apple with irrigation withheld (Naor and Cohen).', fig: 'Abstracts', badge: 'MEASURED' },
    'l1.thermal': { claim: 'Canopy temperature from a thermal camera tracks stomatal closure; reflectance indices such as NDVI track greenness and leaf area and respond later.',
      cite: 'Maes & Steppe 2012, Journal of Experimental Botany 63: 4671', doi: '10.1093/jxb/ers165',
      measured: 'A review of field and laboratory studies relating thermal measurements of canopy temperature to transpiration and stomatal conductance, and of spectral indices to plant water status.', fig: 'Review text', badge: 'MEASURED' }
  };
  Object.keys(EV1).forEach(function (k) { if (!WP.evidence[k]) WP.evidence[k] = EV1[k]; });
  function ev1(k) { return ui.evButton ? ui.evButton(k) : ''; }

  function mount(root) {
    ui = WP.ui; el = root;
    var st = document.createElement('style'); st.textContent = CSS; root.appendChild(st);
    var wrap = document.createElement('div');
    wrap.innerHTML =
      '<div class="f1-hero" data-r="hero" style="min-height:440px"></div>' +
      '<p class="f1-q" style="font-size:18px">Stand at the edge of a Salinas field at two in the afternoon. What pulls the water out of the plant, and how hard?</p>' +
      '<p class="wp-now" aria-live="polite"><b>What is happening.</b> <span data-r="now"></span></p>' +
      '<div class="f1-grid">' +
      '<figure class="fig f1-scene" style="margin:0"><div data-r="scene"></div>' +
      '<div class="f1-capstrip"><span><svg viewBox="0 0 170 26" role="img" aria-label="Scale bar, 10 m at the front row"><rect x="2" y="12" width="40" height="6" fill="var(--ink)"/><rect x="42" y="12" width="40" height="6" fill="var(--paper)" stroke="var(--ink)"/><rect x="82" y="12" width="40" height="6" fill="var(--ink)"/><rect x="122" y="12" width="40" height="6" fill="var(--paper)" stroke="var(--ink)"/><text x="2" y="9" font-size="10" fill="var(--ink)">0</text><text x="162" y="9" font-size="10" text-anchor="end" fill="var(--ink)">10 m</text></svg> at the front row</span><span data-r="windnote"></span><span>Drawn for this exhibit; not to scale in depth.</span></div>' +
      '<figcaption class="f1-cap"><b data-r="cropname"></b>. The sun moves with the time scrubber, the marine layer thickens as humidity rises, and the water molecules rising off the crop (coloured blue, as water is on every page: colours show the molecule, not the atom) leave at the model transpiration rate and drift with the wind. Drawn for this exhibit.<span class="tier-3"> Drawing scale: 4 molecules s⁻¹ per mmol m⁻² s⁻¹ over the whole scene (ILLUSTRATIVE).</span></figcaption></figure>' +
      '<div class="f1-side"><div class="fighead"><h3>The sky sets the pull</h3><p>VPD and air water potential, worked from the conditions strip ' + ev1('l1.vpd') + ev1('l1.psiair') + '</p></div>' +
      '<div class="tiles" data-r="tiles"></div>' +
      '<div class="card f1-deriv tier-3" data-r="deriv"></div></div>' +
      '</div>' +

      '<section class="mol-sec" aria-labelledby="f1-molh"><h3 id="f1-molh">Where the vapour goes, molecule by molecule</h3>' +
      '<p class="mol-try">Inside the leaf the air spaces are saturated. Outside, the air holds less. That difference in crowding is the VPD, and it is what pulls molecules out through the stomata. <b>Try this:</b> pick a Santa Ana wind day, then Salinas fog, and compare how crowded the air below the leaf is.</p>' +
      '<div class="chips" role="group" aria-label="California afternoons" data-r="vapchips">' +
      [['fog', 'Salinas fog', 15, 91, 1.5], ['sal', 'Salinas July afternoon', 21, 60, 3], ['inl', 'Inland Southern California valley', 34, 32, 2.5], ['sa', 'Santa Ana wind day', 33, 10, 8], ['fre', 'Fresno July afternoon', 37, 28, 2.5]].map(function (q) {
        return '<button type="button" class="chip" aria-pressed="false" data-vap="' + q[0] + '" data-t="' + q[2] + '" data-rh="' + q[3] + '" data-w="' + q[4] + '">' + q[1] + '</button>'; }).join('') + '</div>' +
      '<div data-r="vapmol"></div>' +
      '<p class="cap tier-2">The five afternoons set temperature, humidity and wind in the conditions strip ' + ui.badge('ILLUSTRATIVE', 'Physically consistent teaching values, the same five used in Light to sugar, Plate V: fog 15 °C, 91 %; Salinas July afternoon 21 °C, 60 %; inland valley (Riverside area) 34 °C, 32 %; Santa Ana 33 °C, 10 %, strong wind; Fresno 37 °C, 28 %. Not weather records.') + '. Drawing scales ' + ui.badge('DERIVED', 'One drawn vapour molecule per 0.09 kPa of vapour pressure in each box (saturation from the Tetens equation at leaf temperature = air temperature, the model assumption); escapes at 2.5 per second per mmol m⁻² s⁻¹ of E; boundary layer drawn thinner as 1 ÷ √wind.') + ': crowding inside and below the leaf is proportional to the vapour pressure, and the escape rate to the model E. The model itself assumes the leaf is perfectly coupled to the air, so wind changes the drawing, not E.</p>' +
      '</section>' +
      '<div class="f1-two">' +
      '<figure class="fig" style="margin:0"><div class="fighead"><h3>The pull peaks mid afternoon</h3><p>One illustrative Salinas day for this crop, at your soil and light settings</p></div>' +
      '<div class="f1-preset" role="radiogroup" aria-label="Day preset" style="display:flex;flex-wrap:wrap;gap:6px;margin:0 0 6px"><button type="button" class="btn small" role="radio" data-preset="normal">July normal day</button><button type="button" class="btn small" role="radio" data-preset="warm">A warm Salinas afternoon</button></div><div data-r="chart"></div>' +
      '<div class="f1-legend"><span><i style="background:var(--warm)"></i>VPD</span><span><i style="background:var(--w2)"></i>E, transpiration</span><span>dashed line and dots: your current settings</span></div>' +
      '<p class="cap">Lines use the ' + '<span data-r="b-ill"></span>' + ' preset <b data-r="pname">a July normal day</b> for T, RH and light ' + ev1('l1.diel') + ' ' + ev1('l1.normal') + '. <span data-r="track"></span></p></figure>' +
      '<div class="card"><h3 class="f1-h" style="margin-top:0">Wind, the boundary layer and this model</h3>' +
      '<p style="margin:4px 0 0">A thin layer of still air clings to every leaf. Wind thins it and couples the leaf more tightly to the air around it. This model assumes perfect coupling, so moving the wind slider changes the drawing and this note, not E.</p>' +
      '<p class="tier-2" style="margin:8px 0 0">Reference evapotranspiration (ETo, FAO 56 Penman Monteith) folds wind, sun, temperature and humidity into one daily rate for a reference grass. At the Salinas North CIMIS station it averages about 4.4 mm per day in June and 3.7 mm per day in July ' + ui.badge('MEASURED', 'CIMIS station averages, through MWELO Appendix A.') + ' ' + ev1('l1.eto') + '. A crop coefficient scales it to a crop: lettuce at full cover sits near 0.95 ' + ev1('l1.kcb') + '. Stop 1b rounds to 4 mm per day and a crop coefficient of 1.0, with 50 mm of plant available water ' + '<span data-r="b-ill2"></span>' + '.</p></div>' +
      '</div>' +

      '<h3 class="f1-h">Two cameras over the same bed</h3><p class="f1-q">A drone carries two sensors. One reads reflected light, the other emitted heat. Which one sees the stomata close?</p>' +
      ptc('f1-p1', 'Irrigation stopped on a romaine block a week ago. Which sensor changes first?', ['NDVI', 'Thermal', 'Both at the same time'], 1,
        'Thermal. As the soil dries over the days, leaf Ψ becomes more negative on high demand afternoons and the stomata partly close. Less water evaporates, so less latent heat is taken from the leaf and the canopy warms. NDVI reads reflected red and near infrared light. It moves only later, once leaves lose chlorophyll, wilt enough to change the canopy or stop expanding. Thermal sensing measures surface temperature, which rises as transpiration falls; NDVI is a reflectance index of canopy greenness (Maes and Steppe 2012).') +
      ptc('f1-p2', 'Stomata close at noon in full sun. Does the leaf get warmer or cooler?', ['Warmer', 'Cooler', 'No change'], 0,
        'Warmer. Evaporation absorbs heat, about 44 kJ for every mole of water, and carries it away as vapour. With the stomata closed, E falls, so that cooling stops while the sun keeps heating the leaf. Evaporation does not release energy; condensation does.') +
      '<div class="f1-sensors">' +
      '<div class="card f1-sensor"><h4>NDVI</h4><p class="what">reflected light</p>' +
      '<p class="eq tier-3" style="margin:0">NDVI = (NIR − red) ÷ (NIR + red)</p>' +
      '<p>Green leaves absorb red light for photosynthesis and scatter near infrared from their spongy mesophyll. NDVI is a ratio of the two reflected bands. It tracks greenness and leaf area, and it does not measure temperature or water status directly.</p>' +
      '<div class="status" data-r="ndviS"></div></div>' +
      '<div class="card f1-sensor"><h4>Thermal</h4><p class="what">emitted heat</p>' +
      '<p style="margin:0">A thermal camera reads the long wave infrared the leaf itself emits, which gives its surface temperature. Evaporation absorbs latent heat, so a transpiring leaf runs cooler than one that is not. ' + ev1('l1.thermal') + '</p>' +
      '<div data-r="therm"></div><div class="status" data-r="thermS"></div>' +
      '<div class="f1-btns"><button type="button" class="btn small" data-act="dry">Dry the soil to −1.6 MPa</button><button type="button" class="btn small" data-act="wet">Rewater to −0.10 MPa</button></div></div>' +
      '</div>' +
      '<div class="card tier-2" style="margin-top:14px"><h3 class="f1-h" style="margin-top:0">The grower\'s number: midday stem Ψ</h3><p style="margin:4px 0 0">Bag a shaded leaf near the trunk for an hour so it stops transpiring and matches the stem, then read it in a pressure chamber. Now, in the model: stem Ψ <b data-r="stemPsi"></b>, leaf Ψ <b data-r="leafPsi"></b>. <span data-r="stemNote"></span> ' + ev1('l1.stempsi') + '</p></div>' +
      '<div class="card tier-2" style="margin-top:14px"><h3 class="f1-h" style="margin-top:0">Mystery plant: which vine is short of water?</h3><p style="margin:4px 0 0">Two vines at 2 pm, both with leaves near the same water potential. One stands in dry soil on a mild day; the other in wet soil on a hot, dry afternoon. Read the pressure chamber and the porometer, and decide which is which before you look.</p><div data-r="myst"></div>' +
      '<button type="button" class="btn small" data-r="mystb" aria-expanded="false">Reveal</button><p class="ans" data-r="mysta" hidden></p></div>' +
      '<div class="card tier-3" style="margin-top:14px"><h3 class="f1-h" style="margin-top:0">How do we know? A methods fight over wet soil ' + ui.badge('OPEN QUESTION', 'Two classic studies disagree, for a reason in the method.') + '</h3>' +
      '<p style="margin:4px 0 0">Denmead and Shaw (1962) grew corn in containers: transpiration fell below the potential rate at only 0.3 bar of soil suction on 6 to 7 mm days, but held on until 12 bar on 1.4 mm days ' + ui.badge('MEASURED', 'Synopsis numbers.') + ' ' + ev1('l1.ds') + '. Ritchie (1973) put field corn on a weighing lysimeter and found evaporation practically independent of soil water, with at least 80 % of the extractable water freely available ' + ev1('l1.ritchie') + '. Both measured real corn. What in the container could have made wet soil fail early? The original Water Path plate 5.3 plots the 1962 numbers.</p></div>' +
      '<div class="tier-3" data-r="howto" style="margin-top:10px"></div>' +
      '<div class="card" style="margin-top:14px" data-r="srcs"></div>';
    root.appendChild(wrap);
    refs = {};
    Array.prototype.forEach.call(wrap.querySelectorAll('[data-r]'), function (n) { refs[n.getAttribute('data-r')] = n; });
    refs['b-ill'].outerHTML = ui.badge('ILLUSTRATIVE', 'Salinas diel preset per crop: teaching presets, not weather records.');
    refs['b-ill2'].outerHTML = ui.badge('ILLUSTRATIVE', 'ETo 4 mm per day, crop coefficient 1.0, 50 mm plant available water: teaching values.');
    ui.sources(refs.srcs, ['10.1175/1520-0450(1967)006<0203:otcosv>2.0.co;2', '10.1093/jxb/ers165', '10.21273/hortsci.45.11.1597', '10.2134/agronj1962.00021962005400050005x', '10.2134/agronj1973.00021962006500060014x', '10.1006/anbo.2000.1361', '10.21273/hortsci.38.4.547'], 'Sources for this plate');
    if (ui.howto) refs.howto.innerHTML = ['vpd', 'eto', 'pchamber'].map(ui.howto).join('');
    refs.mystb.addEventListener('click', function () { var o = refs.mystb.getAttribute('aria-expanded') === 'true'; refs.mysta.hidden = o; refs.mystb.setAttribute('aria-expanded', o ? 'false' : 'true'); refs.mystb.textContent = o ? 'Reveal' : 'Hide'; });
    wirePtc(wrap);
    function paintPreset() {
      var pr = WP.dielPreset === 'normal' && WP.state.crop !== 'almond' ? 'normal' : 'warm';
      Array.prototype.forEach.call(wrap.querySelectorAll('[data-preset]'), function (b) {
        var on = b.dataset.preset === pr; b.setAttribute('aria-checked', on ? 'true' : 'false'); b.classList.toggle('on', on);
        b.style.fontWeight = on ? '600' : ''; b.style.outline = on ? '2px solid currentColor' : '';
        if (b.dataset.preset === 'normal') b.disabled = WP.state.crop === 'almond';
      });
      if (refs.pname) refs.pname.textContent = pr === 'normal' ? 'a July normal day' : 'a warm Salinas afternoon';
    }
    refs.paintPreset = paintPreset;
    wrap.addEventListener('click', function (e) {
      var pb = e.target.closest('[data-preset]');
      if (pb) { WP.dielPreset = pb.dataset.preset; curveKey = ''; WP.applyHour(WP.state.hour); paintPreset(); return; }
      var b = e.target.closest('[data-act]'); if (!b) return;
      WP.set({ soilPsi: b.dataset.act === 'dry' ? -1.6 : -0.10 });
    });
    if (ui.molStage) refs.vapT = ui.molStage(refs.vapmol, 'vapour', { height: function (cw) { return cw < 560 ? 420 : 420; }, prewarm: 4, // 13 Oct (slow and named): about 25 % taller
      label: 'Animated leaf section: saturated vapour in the leaf air spaces, vapour molecules leaving through stomata into drier field air, slowed by the boundary layer and carried by the wind' });
    wpSpeedChip(refs.vapmol);
    refs.vapchips.addEventListener('click', function (e) {
      var b = e.target.closest('[data-vap]'); if (!b) return;
      Array.prototype.forEach.call(refs.vapchips.querySelectorAll('[data-vap]'), function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      WP.set({ T: +b.dataset.t, RH: +b.dataset.rh, wind: +b.dataset.w, ppfd: Math.max(WP.state.ppfd, b.dataset.vap === 'fog' ? 350 : 1500) });
    });
    ui.stops(root, ['1a', '1b']);
    fhInit(refs.hero);
    ui.onPrefs(function () { var rmv = ui.reducedMotion(); if (fv.paused != null && rmv !== fv.rm) { fv.rm = rmv; fv.paused = rmv; fvRun(); } if (WP.state) update(WP.state, WP.result); if (FH.ctx && FH.ctx.retheme) FH.ctx.retheme(); });
  }

  function update(st, res) {
    if (refs.paintPreset) refs.paintPreset();
    if (!el) return;
    fhUpd(st, res);
    if (st.crop !== lastCrop || !refs.svg) {
      refs.scene.innerHTML = sceneSVG(st.crop);
      refs.svg = refs.scene.querySelector('svg');
      lastCrop = st.crop;
      refs.cropname.textContent = CROP_INFO[st.crop].name;
    }
    sunArc(st, res); fog(st); wind(st); vapour(res);
    if (refs.vapT) refs.vapT.set({ T: st.T, RH: st.RH, E: res.E, wind: st.wind, open: clamp(res.gs / Math.max(1e-6, res.gsMax), 0, 1) });
    refs.svg.querySelector('#f1-sd').textContent = CROP_INFO[st.crop].name + ' at ' + WP.fmt.hour(st.hour) + ', ' + num(st.T, 1) + ' °C and ' + num(st.RH, 0) + ' % relative humidity. Vapour pressure deficit ' + num(res.VPD, 2) + ' kPa.';
    derivation(st, res); chart(st, res); sensors(st, res); extras(st, res);
    if (refs.now) refs.now.textContent = nowText(st, res);
  }
  // midday stem Ψ tile, conditional E tracking note, and the field mystery (S28, S31, S35)
  function extras(st, res) {
    if (refs.stemPsi) {
      refs.stemPsi.textContent = WP.fmt.psi(res.psi.stem);
      refs.leafPsi.textContent = WP.fmt.psi(res.psi.leafOut);
      refs.stemNote.innerHTML = 'The leaf sits ' + num(res.psi.stem - res.psi.leafOut, 2) + ' MPa more negative than the stem: that gap is E × R of the petiole and leaf path, so it shrinks when E falls. ' + ui.badge('ILLUSTRATIVE', 'Model values; bagged stem Ψ equals the model stem node.');
    }
    if (refs.track && refs.diel) {
      var d = refs.diel, pk = d[0], am = null;
      d.forEach(function (p) { if (p.vpd > pk.vpd) pk = p; if (am === null && p.h >= 9 && p.vpd > 0.05) am = p; });
      var ratio = (am && am.vpd > 0 && pk.vpd > 0) ? (pk.E / pk.vpd) / (am.E / am.vpd) : 1;
      refs.track.textContent = ratio < 0.8 ? 'Today E stops tracking VPD in the afternoon: at the VPD peak each kPa moves only ' + Math.round(100 * ratio) + ' % as much water as at 9 am, because leaf Ψ becomes more negative and the stomata partly close.' :
        'Today E still tracks VPD through the afternoon (each kPa at the peak moves ' + Math.round(100 * ratio) + ' % as much water as at 9 am): the soil and the plumbing keep up. Dry the soil and watch the curves part.';
    }
    if (refs.myst && !refs.mystDone) {
      refs.mystDone = true;
      var A = WP.solve({ crop: 'grape', soilPsi: -0.58, T: 22, RH: 60, ppfd: 1600, hour: 14 });
      var B = WP.solve({ crop: 'grape', soilPsi: -0.05, T: 36, RH: 18, ppfd: 1800, hour: 14 });
      function col(n, r) { return '<div class="tile"><div class="k">Vine ' + n + '</div><div class="v">' + num(r.psi.leafOut, 2) + ' <small>MPa leaf</small></div><div class="s">stem ' + WP.fmt.psi(r.psi.stem) + '; stomata ' + num(100 * r.gs / r.gsMax, 0) + ' % of maximum; E ' + num(r.E, 2) + ' mmol m⁻² s⁻¹</div></div>'; }
      refs.myst.innerHTML = '<div class="tiles">' + col('A', A) + col('B', B) + '</div>';
      refs.mysta.innerHTML = 'Vine A is in dry soil: its stem is more negative (' + WP.fmt.psi(A.psi.stem) + ') and the leaf sits only a little below it, because little water is moving. Vine B is in wet soil on a hot, dry afternoon: its stem stays near the soil (' + WP.fmt.psi(B.psi.stem) + ') while a large flow, ' + num(B.E, 2) + ' mmol m⁻² s⁻¹, opens a big gap between stem and leaf. Same leaf reading, different cause: that is why growers read the bagged stem. Model values ' + ui.badge('ILLUSTRATIVE', 'Computed by the model.') + '.';
    }
  }
  function nowText(st, res) {
    var name = ({ grape: 'Vine', romaine: 'Romaine', almond: 'Almond tree' })[st.crop] || 'Crop', v = res.VPD, cf = res.closedFrac;
    var pull = v < 0.5 ? 'barely pulling' : v < 1.5 ? 'pulling gently' : v < 3 ? 'pulling hard' : 'pulling very hard';
    var s1 = 'At ' + WP.fmt.hour(st.hour) + ' the air at ' + num(st.T, 1) + ' °C and ' + num(st.RH, 0) + ' % humidity is ' + pull + ' on the leaves (VPD ' + num(v, 2) + ' kPa).';
    var s2, sto = WP.ui.stomata(res);
    if (st.ppfd <= 0) s2 = ' It is dark, so the stomata are mostly shut and the ' + name.toLowerCase() + ' loses only a little water, through the cuticle and stomata that do not close fully (' + num(res.E, 2) + ' mmol per square metre each second).';
    else s2 = ' The ' + name.toLowerCase() + ' answers by losing ' + num(res.E, 2) + ' mmol of water per square metre of leaf each second, with its stomata ' +
      (sto.word === 'mostly open' ? 'mostly open.' : sto.word + (sto.cause ? ' ' + sto.cause : '') + '.');
    return s1 + s2;
  }


  /* ============================================================ FP14 (14 Oct 2026, field+plant builder): Water I macro hero
     The lower side of one leaf, turned up to face the camera, in warm afternoon light (Lead note 13 Oct, VISUAL
     UPGRADE ROUND). Glassy pavement cells, a raised vein, stomata whose two guard cells part with the model gs,
     and water vapour leaving each pore at a rate set by the model E. The front edge is cut open: epidermis on top,
     spongy mesophyll with air spaces, palisade underneath (the leaf is upside down). Grapevine or romaine leaf;
     the default follows the conditions strip crop (romaine on the Field default). Three.js r128 through WP.macro
     (macro.js, tissue builder); helpers that macro.js lacks are copied here. 1 drawing unit is about 10 µm. */
  /* 13 Oct (slow and named): the speed chip beside the Pause button of a molecular theatre (ui.molStage puts Pause in .mol-bar) */
  function wpSpeedChip(host) {
    if (!host || !window.PlaySpeed) return;
    var pb = host.querySelector('.mol-pause, [data-ps-after]'); if (!pb || pb.parentNode.querySelector('[data-ps="chip"]')) return;
    pb.insertAdjacentElement('afterend', window.PlaySpeed.chip('ps-light'));
  }
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
  var FBASE = (document.currentScript && document.currentScript.src || '').replace(/[^\/]*$/, '');
  function fhEnsure(cb) {
    if (WP.macro) return cb();
    var s = document.querySelector('script[data-macro]') || document.querySelector('script[src$="macro.js"]');
    if (!s) { s = document.createElement('script'); s.src = FBASE + 'macro.js'; s.setAttribute('data-macro', '1'); document.body.appendChild(s); }
    s.addEventListener('load', function () { cb(); });
    s.addEventListener('error', function () { cb(); });
  }
  function fhLazy(host, fn) {
    var done = false;
    function go() { if (done) return; done = true; fhEnsure(function () { if (WP.macro) fn(); else host.style.minHeight = ''; }); }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); go(); } }, { rootMargin: '240px 0px' });
      io.observe(host);
    } else go();
  }
  /* merge with a y rotation per part (macro.js merge has none); parts: {geo, color, pos, scale, rot} */
  function fhMerge(T, parts) {
    var pos = [], nor = [], col = [], idx = [], off = 0, m = new T.Matrix4(), n3 = new T.Matrix3(), v = new T.Vector3(), c = new T.Color(), q = new T.Quaternion(), e = new T.Euler();
    parts.forEach(function (pt) {
      var g = pt.geo, s = pt.scale == null ? [1, 1, 1] : (typeof pt.scale === 'number' ? [pt.scale, pt.scale, pt.scale] : pt.scale);
      q.setFromEuler(e.set(pt.rx || 0, pt.rot || 0, pt.rz || 0));
      m.compose(new T.Vector3(pt.pos[0], pt.pos[1], pt.pos[2]), q, new T.Vector3(s[0], s[1], s[2]));
      n3.getNormalMatrix(m); c.set(pt.color).convertSRGBToLinear();
      var P = g.attributes.position, N = g.attributes.normal;
      for (var i = 0; i < P.count; i++) {
        v.fromBufferAttribute(P, i).applyMatrix4(m); pos.push(v.x, v.y, v.z);
        v.fromBufferAttribute(N, i).applyMatrix3(n3).normalize(); nor.push(v.x, v.y, v.z);
        col.push(c.r, c.g, c.b);
      }
      if (g.index) for (var j = 0; j < g.index.count; j++) idx.push(g.index.getX(j) + off);
      else for (var k = 0; k < P.count; k++) idx.push(k + off);
      off += P.count;
    });
    var out = new T.BufferGeometry();
    out.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    out.setAttribute('normal', new T.Float32BufferAttribute(nor, 3));
    out.setAttribute('color', new T.Float32BufferAttribute(col, 3));
    out.setIndex(idx);
    return out;
  }
  function fhRand(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function fhShade(hex, k) { var r = (hex >> 16) & 255, g = (hex >> 8) & 255, b = hex & 255; r = Math.min(255, Math.round(r * k)); g = Math.min(255, Math.round(g * k)); b = Math.min(255, Math.round(b * k)); return (r << 16) | (g << 8) | b; }

  /* FPP (14 Oct 2026 polish, field+plant builder): scale 1 drawing unit = about 10 µm. Pavement cells are drawn as
     one continuous wet epidermis with sinuous (puzzle piece) anticlinal walls from a warped Voronoi height field, so
     they carry no chloroplasts and the guard cells stand out. Stomata are drawn at their real size against the cells
     (about 28 µm long), so only a few fit; one hero stoma sits in the sharp plane, the others in the blurred far layer.
     Two kidney shaped guard cells with chloroplasts and a dark slit pore that opens with the model gs ÷ gsMax. */
  var FLEAF = {
    grape: { label: 'Grapevine leaf', cell: 0x7fb64e, wall: 0xdaf2b0, vein: 0xcfe39a, guard: 0x4f9e2c, meso: 0x8cca5c, pal: 0x5fa83a, chl: 0x2f7d1c, sp: 3.3,
      q: 'How does a vine leaf lose water on a warm afternoon?',
      a: 'Through stomata on its <b>lower side</b>. Each pore sits between two kidney shaped guard cells, rich in chloroplasts; the wavy edged pavement cells around them are drawn clear. Inside the leaf the air spaces are saturated; outside, the afternoon air holds far less, and that gap (the VPD) pulls vapour out. Here the guard cells part with the model g<sub>s</sub>, a fit to grapevine leaves, and molecules leave at the model transpiration rate: dry the soil or the air and watch the pore narrow. Cells and stomata are drawn to one scale; the water molecules are drawn about 15,000 times larger than real ones.',
      credit: { text: 'Albuquerque et al. · Journal of Experimental Botany 2020', doi: '10.1093/jxb/eraa392' } },
    romaine: { label: 'Romaine leaf', cell: 0x86c056, wall: 0xe2f8b8, vein: 0xe2f0b8, guard: 0x58a832, meso: 0x9fd56e, pal: 0x74b84c, chl: 0x3c8f24, sp: 3.9,
      q: 'Where does a romaine leaf’s water go on a Salinas afternoon?',
      a: 'Out through the stomata, as vapour. This is the lower side of the leaf. Inside the leaf the air spaces are saturated; outside, the air holds less. That gap (the VPD) sets the pull, and the opening of each pore, set by its two guard cells, sets how much gets through. Molecules here leave at the model transpiration rate. On a foggy day the gap nearly closes, and so does the stream, which matters for the calcium carried with it (Water VI). The water molecules are drawn about 15,000 times larger than real ones; cells and stomata share one scale.',
      credit: { text: 'Hetherington & Woodward · Nature 2003', doi: '10.1038/nature01843' } }
  };
  // hero stoma first (sharp plane); the rest sit behind it in the blurred far layer
  var FSTOM = [[1.5, -0.4], [-5.0, -6.2], [6.0, -7.4], [-0.8, -10.5], [-8.4, -12.0], [8.8, -12.8], [3.0, -14.2]];
  var FZ0 = -13.5, FZ1 = 3.75, FX0 = -10, FX1 = 10, FSPLIT = -3.4, FRES = 32;
  var FH = WP._whF = { ctx: null, leaf: null, pick: null, st: null, res: null, open: 0.6, mols: [], N: 34, acc: 0, host: null, lbl: '' };
  function fhLeafOf(st) { return FH.pick || (st && st.crop === 'romaine' ? 'romaine' : 'grape'); }
  function fhVeinZ(x) { return -3.9 + 0.1 * x; }

  /* the epidermis height field and colour map (canvas), computed once per leaf */
  function fhSurface(L, r) {
    var W = Math.round((FX1 - FX0) * FRES), H = Math.round((FZ1 - FZ0) * FRES), sp = L.sp;
    var seeds = [], bx = Math.ceil((FX1 - FX0) / sp) + 4, bz = Math.ceil((FZ1 - FZ0) / sp) + 4, buck = [];
    for (var b = 0; b < bx * bz; b++) buck.push([]);
    function add(x, z, st) { var s = { x: x, z: z, st: st, k: 0.9 + r() * 0.2 }; seeds.push(s); var i = Math.floor((x - FX0) / sp) + 2, j = Math.floor((z - FZ0) / sp) + 2; if (i >= 0 && j >= 0 && i < bx && j < bz) buck[j * bx + i].push(s); }
    FSTOM.forEach(function (s) { add(s[0], s[1], true); });
    for (var gz = FZ0 - sp; gz < FZ1 + sp; gz += sp * 0.88) for (var gx = FX0 - sp; gx < FX1 + sp; gx += sp) {
      var x = gx + (r() - 0.5) * sp * 0.7, z = gz + (r() - 0.5) * sp * 0.6;
      if (FSTOM.some(function (s) { return Math.hypot(s[0] - x, s[1] - z) < 0.95 * sp; })) continue;
      add(x, z, false);
    }
    var h = new Float32Array(W * H), cv = document.createElement('canvas'), bm = document.createElement('canvas');
    cv.width = bm.width = W; cv.height = bm.height = H;
    var cx = cv.getContext('2d'), bxx = bm.getContext('2d'), img = cx.createImageData(W, H), bim = bxx.createImageData(W, H), D = img.data, B = bim.data;
    var a = 0.17 * sp, f1 = 2 * Math.PI / (0.62 * sp), f2 = 2 * Math.PI / (0.41 * sp);
    var cc = [(L.cell >> 16) & 255, (L.cell >> 8) & 255, L.cell & 255], wc = [(L.wall >> 16) & 255, (L.wall >> 8) & 255, L.wall & 255], vc = [(L.vein >> 16) & 255, (L.vein >> 8) & 255, L.vein & 255], gc = [(L.guard >> 16) & 255, (L.guard >> 8) & 255, L.guard & 255];
    for (var j = 0; j < H; j++) {
      var z = FZ0 + (j + 0.5) / FRES, vz;
      for (var i = 0; i < W; i++) {
        var x = FX0 + (i + 0.5) / FRES;
        vz = fhVeinZ(x);
        var wv = Math.exp(-Math.pow((z - vz) / 1.5, 2)), ax = 1 - 0.55 * wv;
        var qx = x + a * Math.sin(z * f1 + 1.3) + 0.45 * a * Math.sin((x + z) * f2), qz = z + a * Math.sin(x * f1 + 0.7) + 0.45 * a * Math.sin((x - z) * f2 + 2);
        var bi = Math.floor((qx - FX0) / sp) + 2, bj = Math.floor((qz - FZ0) / sp) + 2, d1 = 1e9, d2 = 1e9, s1 = null;
        for (var dj = -2; dj <= 2; dj++) for (var di = -2; di <= 2; di++) {
          var ii = bi + di, jj = bj + dj; if (ii < 0 || jj < 0 || ii >= bx || jj >= bz) continue;
          var bk = buck[jj * bx + ii];
          for (var k = 0; k < bk.length; k++) {
            var s = bk[k], ddx = (qx - s.x) * ax, ddz = qz - s.z, d = Math.sqrt(ddx * ddx + ddz * ddz) * (s.st ? 3.4 : s.k);
            if (d < d1) { d2 = d1; d1 = d; s1 = s; } else if (d < d2) d2 = d;
          }
        }
        var wall = d2 - d1, hh, o = (j * W + i) * 4, col;
        if (s1 && s1.st) { hh = 0.04 + 0.1 * Math.min(1, wall / (0.3 * sp)); col = cc.map(function (c) { return c * 0.9; }); }
        else {
          hh = 0.5 * Math.sqrt(1 - Math.exp(-wall / (0.14 * sp)));
          var tint = s1 ? s1.k : 1, edge = Math.exp(-wall / 0.09), inner = Math.min(1, wall / (0.5 * sp));
          col = [0, 1, 2].map(function (c) { var base = cc[c] * (0.94 + 0.12 * (tint - 1) * 3) * (1.02 - 0.08 * inner); base = base + (vc[c] - base) * wv * 0.7; return base + (wc[c] - base) * edge * 0.85; });
        }
        hh += 0.6 * wv;
        h[j * W + i] = hh;
        D[o] = Math.min(255, col[0]); D[o + 1] = Math.min(255, col[1]); D[o + 2] = Math.min(255, col[2]); D[o + 3] = 255;
        var g = Math.max(0, Math.min(255, 255 * hh / 1.1)); B[o] = B[o + 1] = B[o + 2] = g; B[o + 3] = 255;
      }
    }
    cx.putImageData(img, 0, 0); bxx.putImageData(bim, 0, 0);
    return { W: W, H: H, h: h, map: cv, bump: bm, at: function (x, z) {
      var fi = Math.max(0, Math.min(W - 1.001, (x - FX0) * FRES - 0.5)), fj = Math.max(0, Math.min(H - 1.001, (z - FZ0) * FRES - 0.5));
      var i0 = Math.floor(fi), j0 = Math.floor(fj), u = fi - i0, v = fj - j0, p = j0 * W + i0;
      return (h[p] * (1 - u) + h[p + 1] * u) * (1 - v) + (h[p + W] * (1 - u) + h[p + W + 1] * u) * v;
    } };
  }
  function fhPlane(T, S, z0, z1, sx, sz) {
    var g = new T.PlaneGeometry(FX1 - FX0, z1 - z0, sx, sz), P = g.attributes.position, U = g.attributes.uv;
    for (var i = 0; i < P.count; i++) {
      var x = P.getX(i), z = (z0 + z1) / 2 - P.getY(i);
      P.setXYZ(i, x, S.at(x, z), z);
      U.setXY(i, (x - FX0) / (FX1 - FX0), 1 - (z - FZ0) / (FZ1 - FZ0));
    }
    g.computeVertexNormals();
    return g;
  }
  /* a kidney shaped guard cell: an elongated pillow bent so its inner (pore) side is concave */
  function fhGuardGeo(T) {
    var g = new T.SphereGeometry(1, 18, 12), p = g.attributes.position, v = new T.Vector3();
    for (var i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      var zz = v.z, x = v.x * 0.44 * (1 - 0.18 * zz * zz), y = v.y * 0.36, z = zz * 1.4;
      x += 0.42 * zz * zz;                 // bend: the ends curl toward the pore (+x)
      p.setXYZ(i, x, Math.max(-0.1, y), z);
    }
    g.computeVertexNormals();
    return g;
  }

  function fhBuild(ctx) {
    var T = ctx.THREE, M = WP.macro, L = FLEAF[FH.leaf], r = fhRand(FH.leaf === 'grape' ? 31 : 57);
    var G = function (g) { ctx.disp.push(g); return g; };
    var mats = ctx.mats;
    var S = FH.surf = fhSurface(L, r);
    var tex = new T.CanvasTexture(S.map); tex.encoding = T.sRGBEncoding; tex.anisotropy = 4;
    var btex = new T.CanvasTexture(S.bump);
    ctx.disp.push(tex, btex);
    function epiMat() {
      var m = M.glass(T, 0xb4b4b4, { opacity: 0.95, roughness: 0.24, ccr: 0.04, emissive: 0xffffff, ei: 0.06, rimColor: 0xd8ff9a, rimK: 0.3, depthWrite: true, env: 0.28 });
      m.map = tex; m.emissiveMap = tex; m.bumpMap = btex; m.bumpScale = 0.09; m.clearcoat = 0.22; m.clearcoatRoughness = 0.22; // 13 Oct: less grazing sheen, deeper wet cells m.needsUpdate = true;
      return m;
    }
    mats.cell = epiMat(); mats.cellFar = epiMat();
    ctx.root.add(new T.Mesh(G(fhPlane(T, S, FSPLIT - 0.3, FZ1, 96, 36)), mats.cell));
    ctx.far.add(new T.Mesh(G(fhPlane(T, S, FZ0, FSPLIT, 44, 24)), mats.cellFar));

    // the cut face (front edge): epidermis cells in section, spongy mesophyll with air spaces, palisade tops below (the leaf is upside down)
    var cut = [], chl = [], cG = new T.SphereGeometry(1, 9, 7), eG = new T.SphereGeometry(1, 8, 5);
    function pillow(g, e) { var p = g.attributes.position, v = new T.Vector3(); for (var i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); var f = function (x) { return (x < 0 ? -1 : 1) * Math.pow(Math.abs(x), e); }; p.setXYZ(i, f(v.x), f(v.y), f(v.z)); } g.computeVertexNormals(); return g; }
    pillow(cG, 0.8); pillow(eG, 0.45);
    var cz = FZ1, hx = FSTOM[0][0];
    for (var a = FX0 + 0.2; a < FX1; a += L.sp * (0.8 + r() * 0.3)) {
      var w = L.sp * 0.42;
      cut.push({ geo: eG, color: fhShade(L.cell, 0.95), pos: [a + w, -0.45, cz - 0.55], rot: 0, scale: [w * 0.96, 0.5, 0.55] });
    }
    for (var row = 0; row < 2; row++) {
      for (var sx = FX0 + 0.6 + row * 0.9; sx < FX1; sx += 2.5 + r() * 0.9) {
        if (Math.abs(sx - hx) < 1.5) continue;                          // the substomatal cavity under the hero stoma
        var sy = -2.1 - r() * 0.6 - row * 0.4, sr = 0.95 + r() * 0.35, zc = cz - 0.75 - row * 1.5;
        cut.push({ geo: cG, color: fhShade(L.meso, (row ? 0.78 : 0.95) + r() * 0.1), pos: [sx, sy, zc], rot: r() * 3, scale: [sr, sr * 0.78, 0.7] });
        if (!row) for (var n = 0; n < 11; n++) { var an = r() * 6.28; chl.push([sx + Math.cos(an) * sr * 0.86, sy + Math.sin(an) * sr * 0.66, zc + 0.35 + r() * 0.2]); }
        if (r() < 0.6) { var ax2 = sx + 1.0, ay2 = sy - 0.9; cut.push({ geo: cG, color: fhShade(L.meso, 0.88), pos: [ax2, ay2, zc], rot: 0.7, scale: [0.55, 0.32, 0.5] }); }
      }
    }
    for (var bb = FX0 + 0.2; bb < FX1; bb += 0.95) {
      var px = bb + (r() - 0.5) * 0.1;
      cut.push({ geo: cG, color: fhShade(L.pal, 0.9 + r() * 0.15), pos: [px, -5.3, cz - 0.9], rot: 0, scale: [0.42, 1.3, 0.5] });
      for (var c2 = 0; c2 < 3; c2++) chl.push([px + (r() - 0.5) * 0.5, -4.6 - r() * 1.2, cz - 0.38]);
    }
    mats.cut = M.glass(T, 0xffffff, { opacity: 0.62, roughness: 0.14, ccr: 0.05, emissive: 0x1d3a10, ei: 0.8, rimColor: 0xd8ffb0, rimK: 0.85 });
    mats.cut.vertexColors = true; mats.cut.needsUpdate = true;
    ctx.root.add(new T.Mesh(G(fhMerge(T, cut)), mats.cut));
    cG.dispose(); eG.dispose();
    var chlP = M.balls(T, chl, L.chl, 0.42); ctx.root.add(chlP); ctx.disp.push(chlP.geometry, chlP.material);
    mats.back = new T.MeshStandardMaterial({ color: 0x14260d, roughness: 1, emissive: 0x06100a, envMapIntensity: 0.08 }); M.lin(mats.back);
    var bw = new T.Mesh(G(new T.PlaneGeometry(20, 6)), mats.back); bw.position.set(0, -3.4, cz - 3.4); ctx.root.add(bw);
    // moist air in the substomatal cavity under the hero stoma, glowing with E
    FH.cav = M.halos(T, 3, 0xf4fff0, 2.6); FH.cav.set(0, hx, -1.6, cz - 1.4); FH.cav.set(1, hx + 0.3, -2.6, cz - 1.0); FH.cav.set(2, hx - 0.2, -0.8, cz - 1.9); FH.cav.commit();
    ctx.root.add(FH.cav.obj); ctx.disp.push(FH.cav.geo, FH.cav.mat);

    // stomata: two kidney guard cells with chloroplasts, a dark slit pore and a dark throat
    var gGeo = G(fhGuardGeo(T));
    mats.guard = M.glass(T, L.guard, { opacity: 0.88, roughness: 0.08, ccr: 0.03, emissive: 0x1f5a0c, ei: 0.9, rimColor: 0xd8ff90, rimK: 0.75, depthWrite: true, env: 0.4 });
    mats.pore = new T.MeshBasicMaterial({ color: 0x050904 }); mats.poreIn = new T.MeshBasicMaterial({ color: 0x020402, side: T.BackSide });
    mats.gchl = new T.MeshStandardMaterial({ color: 0x2f8a1e, roughness: 0.4, emissive: 0x165a0c, emissiveIntensity: 0.7 }); M.lin(mats.gchl);
    var poreGeo = G(new T.CircleGeometry(1, 24)); poreGeo.rotateX(-Math.PI / 2);
    var throatGeo = G(new T.CylinderGeometry(1, 0.7, 0.6, 18, 1, true));
    var chG = G(new T.SphereGeometry(1, 8, 6)), q = new T.Quaternion(), m4 = new T.Matrix4();
    FH.stom = FSTOM.map(function (s, k) {
      var hero = k === 0, grp = new T.Group(); grp.position.set(s[0], S.at(s[0], s[1]) + 0.12, s[1]); grp.rotation.y = hero ? 0.32 : (k % 3 - 1) * 0.5 + 0.2;
      function cell(side) {
        var cg = new T.Group(); cg.rotation.y = side > 0 ? 0 : Math.PI;
        var mesh = new T.Mesh(gGeo, mats.guard); mesh.position.x = -0.5; cg.add(mesh);
        var ch = new T.InstancedMesh(chG, mats.gchl, 6);
        for (var c = 0; c < 6; c++) { var zz = (c / 5 - 0.5) * 1.9, xx = -0.5 + 0.42 * zz * zz / 1.96 + (c % 2 ? 0.1 : -0.12); m4.compose(new T.Vector3(xx, 0.12, zz), q.identity(), new T.Vector3(0.13, 0.07, 0.17)); ch.setMatrixAt(c, m4); }
        cg.add(ch); grp.add(cg);
        return cg;
      }
      var gl = cell(1), gr = cell(-1);
      var pore = new T.Mesh(poreGeo, mats.pore); pore.position.y = 0.05; grp.add(pore);
      var thr = new T.Mesh(throatGeo, mats.poreIn); thr.position.y = -0.3; grp.add(thr);
      (hero ? ctx.root : ctx.far).add(grp);
      return { grp: grp, gl: gl, gr: gr, pore: pore, thr: thr, x: s[0], z: s[1], y: grp.position.y, w: 1, hero: hero };
    });
    // vapour: instanced molecules plus two halo layers (core glow and a softer plume)
    mats.mol = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.25, metalness: 0, emissive: 0x000000 });
    FH.molMesh = new T.InstancedMesh(G(M.waterGeo(T, 0.16, true)), mats.mol, FH.N); FH.molMesh.frustumCulled = false; ctx.root.add(FH.molMesh);
    FH.glow = M.halos(T, FH.N, 0xffffff, 1.2); FH.plume = M.halos(T, FH.N * 2, 0xfff3dc, 2.8);
    FH.plume.mat.opacity = 0.3;
    FH.breath = M.halos(T, FH.stom.length * 3, 0xfff1d0, 3.6); FH.breath.mat.opacity = 0.0; ctx.root.add(FH.breath.obj); ctx.disp.push(FH.breath.geo, FH.breath.mat);
    FH.stom.forEach(function (s, k) { if (!s.hero) { FH.breath.hide(3 * k); FH.breath.hide(3 * k + 1); FH.breath.hide(3 * k + 2); return; } FH.breath.set(3 * k, s.x, s.y + 0.5, s.z); FH.breath.set(3 * k + 1, s.x + 0.15, s.y + 1.3, s.z); FH.breath.set(3 * k + 2, s.x + 0.35, s.y + 2.2, s.z); });
    FH.breath.commit();
    [FH.glow, FH.plume].forEach(function (h) { ctx.root.add(h.obj); ctx.disp.push(h.geo, h.mat); });
    // out of focus vapour drifting close to the lens (near layer), at a rate tied to E
    FH.nearN = 3; FH.nearMol = new T.InstancedMesh(G(M.waterGeo(T, 0.2, true)), mats.mol, FH.nearN); FH.nearMol.frustumCulled = false; ctx.near.add(FH.nearMol);
    FH.nearP = []; for (var nn = 0; nn < FH.nearN; nn++) FH.nearP.push({ x: (nn % 2 ? 1 : -1) * (4 + 2 * r()), y: 1 + 5 * r(), z: 5.5 + 2 * r(), ph: r() * 6.28 });
    // a low afternoon sun behind the leaf: warm glow in the far layer and a warm back rim light on cell edges
    FH.sun = M.halos(T, 2, 0xffd59a, 26); FH.sun.set(0, -9, 5.5, -18); FH.sun.set(1, -6, 4.2, -16); FH.sun.commit(); FH.sun.mat.opacity = 0.6; ctx.far.add(FH.sun.obj); ctx.disp.push(FH.sun.geo, FH.sun.mat);
    FH.back = new T.DirectionalLight(0xffb15c, 1.4); FH.back.position.set(-7, 2.2, -12); ctx.scene.add(FH.back);
    FH.backF = FH.back.clone(); ctx.farScene.add(FH.backF);
    FH.mols = []; FH.acc = 0;
    for (var wq = 0; wq < 140; wq++) fhStep(0.05, true);
    fhLabels(ctx, true);
  }
  function fhSpawn() {
    var s = FH.stom[Math.random() < 0.55 ? 0 : 1 + Math.floor(Math.random() * (FH.stom.length - 1))];
    return { x: s.x + (Math.random() - 0.5) * 0.25, y: s.y + 0.1, z: s.z + (Math.random() - 0.5) * 0.6, vy: 0.55 + Math.random() * 0.35, ph: Math.random() * 6.28, rx: Math.random() * 6.28, ry: Math.random() * 6.28, age: 0 };
  }
  function fhStep(dt) {
    var res = FH.res, st = FH.st;
    var E = res ? Math.max(0, res.E) : 2, wind = st ? st.wind : 2;
    FH.acc += 1.5 * E * dt;   // DERIVED drawing scale: 1.5 molecules s-1 per mmol m-2 s-1 over the scene
    while (FH.acc >= 1) { FH.acc -= 1; if (FH.mols.length < FH.N) FH.mols.push(fhSpawn()); }
    var drift = 0.08 + 0.07 * Math.min(8, wind);
    FH.mols = FH.mols.filter(function (m) {
      m.age += dt; m.y += m.vy * dt; m.x += drift * dt * Math.min(1, m.y / 1.2) + Math.sin(m.ph + m.age * 1.7) * 0.12 * dt; m.z += Math.cos(m.ph + m.age * 1.3) * 0.06 * dt;
      m.rx += dt * 0.9; m.ry += dt * 0.7;
      return m.y < 5.4;
    });
    if (FH.nearP) FH.nearP.forEach(function (p) { p.y += dt * (0.1 + 0.12 * E); p.x += dt * drift * 0.6; if (p.y > 6) { p.y = -1.5; p.x = -6 + 12 * Math.random(); } if (p.x > 7) p.x = -7; });
  }
  function fhFrame(ctx, t, dt) {
    var T = ctx.THREE, res = FH.res;
    var tgt = res ? Math.max(0, Math.min(1, res.gs / Math.max(1e-6, res.gsMax))) : 0.6;
    FH.open += (tgt - FH.open) * Math.min(1, dt * 1.8 + (dt === 0 ? 1 : 0));
    var o = FH.open;
    FH.stom.forEach(function (s) {
      var d = 0.02 + 0.13 * o;
      [s.gl, s.gr].forEach(function (c) { c.children[0].position.x = -0.5 - d; c.children[1].position.x = -d; });
      s.pore.scale.set(0.03 + 0.17 * o, 1, 0.95); s.thr.scale.set(0.025 + 0.15 * o, 1, 0.8);
    });
    if (dt > 0) fhStep(dt);
    var mtx = FH._m || (FH._m = new T.Matrix4()), q = FH._q || (FH._q = new T.Quaternion()), e = FH._e || (FH._e = new T.Euler()), p = FH._p || (FH._p = new T.Vector3()), sc = FH._s || (FH._s = new T.Vector3());
    for (var i = 0; i < FH.N; i++) {
      var m = FH.mols[i];
      if (!m) { mtx.makeScale(0, 0, 0); FH.molMesh.setMatrixAt(i, mtx); FH.glow.hide(i); FH.plume.hide(2 * i); FH.plume.hide(2 * i + 1); continue; }
      var fade = Math.min(1, m.age * 3) * Math.max(0, Math.min(1, (5.4 - m.y) / 1.6));
      q.setFromEuler(e.set(m.rx, m.ry, 0));
      mtx.compose(p.set(m.x, m.y, m.z), q, sc.setScalar(Math.max(0.001, fade))); FH.molMesh.setMatrixAt(i, mtx);
      if (fade > 0.1) { FH.glow.set(i, m.x, m.y, m.z); FH.plume.set(2 * i, m.x - 0.08, m.y - 0.35, m.z); FH.plume.set(2 * i + 1, m.x - 0.16, m.y - 0.75, m.z); }
      else { FH.glow.hide(i); FH.plume.hide(2 * i); FH.plume.hide(2 * i + 1); }
    }
    FH.molMesh.instanceMatrix.needsUpdate = true; FH.glow.commit(); FH.plume.commit();
    FH.nearP.forEach(function (np, k) { q.setFromEuler(e.set(np.ph + t * 0.3, np.ph * 2 + t * 0.2, 0)); mtx.compose(p.set(np.x, np.y, np.z), q, sc.setScalar(1)); FH.nearMol.setMatrixAt(k, mtx); });
    FH.nearMol.instanceMatrix.needsUpdate = true;
    var Eb = res ? Math.max(0, res.E) : 2;
    FH.breath.mat.opacity = Math.min(0.6, 0.11 * Eb * (0.3 + 0.7 * o)) * (0.85 + 0.15 * Math.sin(t * 1.3)) * (ctx.dark ? 1.2 : 1);
    FH.breath.obj.position.x = 0.15 * Math.sin(t * 0.4);
    FH.cav.mat.opacity = Math.min(0.7, 0.12 + 0.1 * Eb) * (ctx.dark ? 1.1 : 0.8);
    // the sun follows the hour of the conditions strip; warm and low in the afternoon, dim blue at night
    var st = FH.st, k = ctx.lights && ctx.lights.key;
    if (k && st) {
      var h = st.hour == null ? 14 : st.hour, el = Math.sin(Math.PI * Math.max(0, Math.min(1, (h - 6) / 14))), lit = Math.max(0, Math.min(1, (st.ppfd || 0) / 1800));
      k.position.set(-10 * Math.cos(Math.PI * (h - 6) / 14), 2 + 10 * el, 7);
      k.color.setHSL(0.09 + 0.03 * el, 0.75 * (lit > 0 ? 1 : 0.2), 0.62);
      k.intensity = lit > 0 ? 0.9 + 1.4 * lit : 0.35;
      ctx.lights.hemi.intensity = 0.25 + 0.2 * lit;
      var low = lit > 0 ? 0.6 + 0.8 * (1 - el) : 0;   // stronger back light when the sun is low
      FH.back.intensity = FH.backF.intensity = (0.5 + 1.2 * lit) * low;
      FH.back.color.setHSL(0.075, 0.9, 0.62); FH.backF.color.copy(FH.back.color);
      FH.sun.mat.opacity = lit > 0 ? (ctx.dark ? 0.35 : 0.55) * (0.5 + 0.5 * low) : 0.04;
    }
    fhNames(ctx);
    fhLabels(ctx, false);
  }
  /* 13 Oct (slow and named): water vapour molecules carry their name (ANTI CLUTTER RULE: a swarm, so 2 at desktop
     width and 1 on phones, stable, never over a label tag, the caption or a button; WP.heroNames from l4_tissue.js) */
  function fhNames(ctx) {
    if (!WP.heroNames || !ctx.camera) return;
    var HN = FH.hn || (FH.hn = WP.heroNames(ctx));
    HN.begin();
    var top = ctx.narrow ? 2.7 : 4.2; // phones frame the plume lower: name a molecule that stays in view for a while
    /* fix round (Q H3): the name must be readable, so a candidate is kept only when its name lands well inside the frame
       (not in the top band, not down by the question box), outside the bright glow column over the hero stoma, and at
       least 10 px clear of every label tag (the shared helper only keeps names off the tags themselves) */
    var root = ctx.root, cam = ctx.camera, W = ctx.w, H = ctx.h, v = FH._nv || (FH._nv = new ctx.THREE.Vector3());
    function scr(x, y, z) { v.set(x, y, z); root.localToWorld(v); v.project(cam); return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H]; }
    var s0 = FH.stom.filter(function (s) { return s.hero; })[0] || FH.stom[0], c0 = scr(s0.x, s0.y + 0.6, s0.z), c1 = scr(s0.x + 0.8, s0.y + 3.0, s0.z);
    var colW = ctx.narrow ? 58 : 72, now = performance.now();
    if (!FH._tagT || now - FH._tagT > 300) {
      FH._tagT = now; FH._tags = [];
      var stg = ctx.wrap && ctx.wrap.querySelector('.mh-stage'), wr = stg && stg.getBoundingClientRect();
      if (wr) Array.prototype.forEach.call(ctx.wrap.querySelectorAll('.mh-tag:not(.mh-hide)'), function (e) { var r = e.getBoundingClientRect(); if (r.width > 0) FH._tags.push([r.left - wr.left - 10, r.top - wr.top - 10, r.right - wr.left + 10, r.bottom - wr.top + 10]); });
    }
    var hw = ctx.narrow ? 40 : 46, hh = ctx.narrow ? 10 : 12, yMin = ctx.narrow ? 70 : 80, yMax = H * (ctx.narrow ? 0.6 : 0.64);
    function readable(m) {
      v.set(m.x, m.y, m.z); root.localToWorld(v);   // the name sits where the helper puts it: r + 0.62 of its height below
      var hu = (ctx.narrow ? 15.5 : 17) * 2 * cam.position.distanceTo(v) * Math.tan(cam.fov * Math.PI / 360) / H;
      var a = scr(m.x, m.y - 0.17 - hu * 0.62, m.z), x = a[0], y = a[1];
      if (y < yMin || y > yMax || x < hw + 8 || x > W - hw - 8) return false;
      var f = Math.max(0, Math.min(1, (y - c0[1]) / ((c1[1] - c0[1]) || -1))), cx = c0[0] + (c1[0] - c0[0]) * f;   // the column leans with the drift
      for (var i = 0; i < FH._tags.length; i++) { var t = FH._tags[i]; if (x + hw > t[0] && x - hw < t[2] && y + hh > t[1] && y - hh < t[3]) return false; }
      return (y < c0[1] + 30 && Math.abs(x - cx) < colW) ? 1 : 2;   // 1: inside the glow column, 2: clear of it
    }
    var cand = [], clear = false;
    FH.mols.forEach(function (m) { if (m.age > 0.3 && m.y > 0.6 && m.y < top) { var k = readable(m); if (k) { cand.push([m, k]); if (k === 2) clear = true; } } });
    // the glow column is avoided whenever a molecule outside it can carry the name (phones frame only the column: then one molecule in it is named)
    cand.forEach(function (c) { var m = c[0]; if (!clear || c[1] === 2) HN.add('vap', m, 'H₂O vapour', m.x, m.y, m.z, 0.17, { pri: -Math.abs(m.y - (ctx.narrow ? 1.5 : 2.2)), q: clear ? null : 1 }); });
    HN.end();
  }
  function fhLabels(ctx, force) {
    var T = ctx.THREE, o = FH.open, tag = o < 0.12 ? 'stoma, nearly shut' : (o < 0.5 ? 'stoma, partly open' : 'stoma, open');
    var key = tag + (FH.mols.length > 3 ? 'v' : '');
    if (!force && key === FH.lbl) return;
    FH.lbl = key;
    var s0 = FH.stom[0], vm = FH.mols.filter(function (m) { return m.y > 1.8 && m.y < 3.4 && Math.abs(m.z - s0.z) < 1.2; })[0];
    var gp = new T.Vector3(-0.85, 0.3, 0).applyAxisAngle(new T.Vector3(0, 1, 0), s0.grp.rotation.y).add(s0.grp.position);
    var list = [
      { id: 'st', text: tag, tier: 1, side: 'right', pos: new T.Vector3(s0.x + 0.9, s0.y + 0.25, s0.z - 0.3) },
      { id: 'gc', text: 'guard cell, with chloroplasts', tier: 1, pos: gp },
      { id: 'pc', text: 'pavement cell, wavy walls', tier: 2, pos: new T.Vector3(-3.6, FH.surf.at(-3.6, 1.6) + 0.1, 1.6) },
      { id: 'vn', text: 'vein, raised on this side', tier: 2, pos: new T.Vector3(5.4, 0.85, fhVeinZ(5.4)), narrow: false },
      { id: 'sp', text: 'spongy mesophyll, air spaces', tier: 2, pos: new T.Vector3(-4.5, -2.0, FZ1 - 0.2) },
      { id: 'cv', text: 'air space under the stoma', tier: 3, pos: new T.Vector3(s0.x, -1.6, FZ1 - 0.6), narrow: false },
      { id: 'pl', text: 'palisade (the upper side, facing down here)', tier: 3, pos: new T.Vector3(5.5, -4.6, FZ1 - 0.4), narrow: false }
    ];
    if (FH.mols.length > 3) list.push({ id: 'vp', text: 'water vapour leaving', tier: 1, pos: new T.Vector3(vm ? vm.x : s0.x + 0.6, vm ? vm.y : 2.6, vm ? vm.z : s0.z) });
    ctx.setLabels(list);
  }
  function fhCamera(ctx, t) {
    var a = ctx.reduced ? 0.05 : 0.05 + 0.13 * Math.sin(t * 0.08), R = ctx.narrow ? 12 : 9.6 + 0.8 * Math.sin(t * 0.055);
    var cx = ctx.narrow ? FSTOM[0][0] : 0.4, hz = FSTOM[0][1];
    ctx.camera.position.set(cx + Math.sin(a) * R, ctx.narrow ? 7.0 : 5.3, hz + 1.0 + Math.cos(a) * R * 0.9);
    ctx.camera.lookAt(cx, ctx.narrow ? 0.2 : 0.9, hz - (ctx.narrow ? 1.6 : 2.6));
    if (ctx.narrow && ctx.camera.fov !== 34) { ctx.camera.fov = 34; ctx.camera.updateProjectionMatrix(); }
    if (!ctx.narrow && ctx.camera.fov !== 30) { ctx.camera.fov = 30; ctx.camera.updateProjectionMatrix(); }
  }
  function fhTheme(ctx) {
    var m = ctx.mats, d = ctx.dark;
    if (m.cell) { m.cell.emissiveIntensity = m.cellFar.emissiveIntensity = d ? 0.26 : 0.07; m.cut.emissiveIntensity = d ? 1.4 : 0.8; m.guard.emissiveIntensity = d ? 1.3 : 0.75; }
    if (FH.plume) FH.plume.mat.opacity = d ? 0.42 : 0.3;
    ctx.renderer.toneMappingExposure = d ? 1.02 : 0.9;
  }
  function fhLive() {
    if (!FH.ctx || !FH.res) return;
    var res = FH.res, st = FH.st, nb = ' ';
    var note = FH.leaf === 'grape' && st && st.crop !== 'grape' ? ' · <span style="white-space:nowrap">a vine leaf in ' + (st.crop === 'romaine' ? 'romaine' : 'almond') + ' weather</span>' : (FH.leaf === 'romaine' && st && st.crop !== 'romaine' ? ' · <span style="white-space:nowrap">a romaine leaf in ' + st.crop + ' weather</span>' : '');
    FH.ctx.setLive('<span style="white-space:nowrap">VPD ' + num(res.VPD, 2) + nb + 'kPa</span> · <span style="white-space:nowrap">E ' + num(res.E, 2) + nb + 'mmol' + nb + 'm⁻²' + nb + 's⁻¹</span> · <span style="white-space:nowrap">stomata ' + Math.round(100 * res.gs / Math.max(1e-6, res.gsMax)) + nb + '% of maximum</span>' + note);
  }
  function fhMake() {
    if (!FH.host || !WP.macro) return;
    FH.host.style.minHeight = '';
    var L = FLEAF[FH.leaf];
    if (FH.ctx) { try { FH.ctx.dispose(); } catch (e) { /* none */ } if (FH.ctx.wrap && FH.ctx.wrap.parentNode) FH.ctx.wrap.parentNode.removeChild(FH.ctx.wrap); FH.ctx = null; }
    FH.mols = []; FH.lbl = ''; FH.hn = null;
    FH.ctx = WP.macro.hero(FH.host, {
      id: 'f1-hero', seed: FH.leaf === 'grape' ? 23 : 41, fov: 30, fogNear: 13, fogFar: 32, exposure: 0.98,
      label: L.label + ', lower side turned up to face you, in warm, low afternoon light: wavy edged pavement cells, a raised vein, and in focus one stoma made of two kidney shaped guard cells with chloroplasts around a dark pore, with water vapour molecules rising from it. The front edge is cut open to show the spongy mesophyll with an air space under the stoma and, underneath, the palisade.',
      question: L.q, answer: L.a, credit: L.credit,
      palette: { light: { top: '#4a5a22', mid: '#8f9a45', bot: '#d2ad62', bokeh: ['#fff0b8', '#f7c86a', '#e3efb0', '#fff7dc'], fog: 0x9a9a55, fg: 'rgba(255,226,160,.5)' } },
      height: function (w) { return w < 600 ? 520 : Math.round(Math.min(680, Math.max(460, w * 0.66))); }, // 13 Oct (slow and named): larger
      fallbackNote: 'This 3D leaf needs WebGL, which this browser does not offer. The field drawing and the vapour theatre below show the same stream.',
      capAlign: 'left', lift: function (ctx) { return ctx.narrow ? 96 : 86; },
      build: fhBuild, frame: fhFrame, camera: fhCamera, theme: fhTheme,
      /* FIX ROUND 1 (14 Oct): tilted to the limit (phi 0.1) the user looked straight down into a blurred close up of
         the upturned leaf, and tilted the other way the camera went under the leaf into pure bokeh. Keep the tilt
         between a high oblique view and just above the leaf plane, and never let the camera drop below it. */
      orbit: { minPolar: 0.7, maxPolar: 1.45, floorY: 1.0 },
      /* LOOK CLOSER (14 Oct, controls engineer journey): zoom, pan and tilt come from WP.macro.orbit; these chips fly
         the camera to the stoma (from above the turned up lower side, so the pore and both guard cells show) and to the
         vapour rising from it. Targets are read at click time, so they follow the leaf that is in the scene. */
      focus: [
        { id: 'stoma', label: 'Stoma', dist: 4.8, theta: 0.15, phi: 0.72, target: function () { var s = fhHeroStoma(); return { obj: FH.ctx.root, pos: new FH.ctx.THREE.Vector3(s.x, s.y + 0.1, s.z) }; } },
        { id: 'vapour', label: 'Vapour', dist: 5.2, theta: 0.35, phi: 1.2, target: function () { var s = fhHeroStoma(); return { obj: FH.ctx.root, pos: new FH.ctx.THREE.Vector3(s.x + 0.4, s.y + 1.9, s.z) }; } }
      ]
    });
    fhLive(); fhChips();
  }
  function fhHeroStoma() { return FH.stom.filter(function (s) { return s.hero; })[0] || FH.stom[0]; }
  function fhChips() {
    if (!FH.chips) return;
    Array.prototype.forEach.call(FH.chips.querySelectorAll('[data-leaf]'), function (b) { b.setAttribute('aria-pressed', b.dataset.leaf === FH.leaf ? 'true' : 'false'); });
  }
  function fhInit(host) {
    FH.host = host;
    var bar = document.createElement('div');
    bar.className = 'chips f1-leafchips'; bar.setAttribute('role', 'group'); bar.setAttribute('aria-label', 'Leaf in the macro scene');
    bar.innerHTML = '<span class="f1-chipl">Leaf in the scene:</span><button type="button" class="chip" data-leaf="romaine" aria-pressed="false">Romaine</button><button type="button" class="chip" data-leaf="grape" aria-pressed="false">Grapevine</button>';
    host.parentNode.insertBefore(bar, host.nextSibling);
    FH.chips = bar;
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('[data-leaf]'); if (!b) return;
      FH.pick = b.dataset.leaf;
      if (FH.pick !== FH.leaf) { FH.leaf = FH.pick; if (FH.ctx || FH.built) fhMake(); else fhChips(); }
    });
    FH.leaf = fhLeafOf(WP.state); fhChips();
    fhLazy(host, function () { FH.built = true; fhMake(); });
  }
  function fhUpd(st, res) {
    FH.st = st; FH.res = res;
    var lf = fhLeafOf(st);
    if (lf !== FH.leaf) { FH.leaf = lf; if (FH.ctx) fhMake(); else fhChips(); return; }
    if (FH.ctx) { fhLive(); FH.ctx.invalidate(); }
  }

  // 8 Oct decision: romaine is the default crop on the Field plate (grape elsewhere), and the Field day uses the NOAA July normals.
  // Applied once, on the first visit, so a crop or preset the visitor chose is never overridden.
  var fieldDefaulted = false;
  function show() {
    if (fieldDefaulted) return; fieldDefaulted = true;
    WP.dielPreset = 'normal';
    if (WP.state.crop === 'grape') WP.set({ crop: 'romaine' });
    WP.applyHour(WP.state.hour);
    if (refs && refs.paintPreset) refs.paintPreset();
  }
  WP.levels.push({ id: 'field', n: 1, title: 'The Field', subtitle: 'Salinas Valley, a crop in its field', scale: '10 m', focus: [52, 70], mount: mount, update: update, show: show });
})();

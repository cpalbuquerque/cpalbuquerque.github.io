/* The Water Path v8: n_chain.js (nutrient path, Plate I, panel 8: THE CHAIN)
   From a membrane to a drinking water well. Four linked data panels, clean 2D (inline SVG), and then the
   OPEN tier panels for the whole nutrient path. No recommendation anywhere: the chain ends at a well.

   Loaded by the Plate I module in nutrient mode with WP.nutrient.load('chain', cb). Then:
     var c = WP_NCHAIN.mount(host)      build the chain into host; returns {go(n), destroy()}
     var o = WP_NCHAIN.mountOpen(host)  build the OPEN panels into host; returns {destroy()}
     WP_NCHAIN.unmount(host)            destroy whatever this file built in host
   Needs nothing beyond the page tokens (styles.css); uses WS.badge from n_kit.js when present.

   One control moves every pane: the step strip (1 to 4, or Back and Next) moves the chain map, the panel shown
   and that panel's "What just happened" line. Each panel also has one local control that redraws its figure
   and rewrites the same line. Every number on screen carries a tag. Sources: see SRC below; all of them are
   rows 14 to 21 of NUTRIENT_SOURCES_verified_2026-10-26.md. */
(function () {
  'use strict';
  var WP = window.WP || {};
  var NS = 'http://www.w3.org/2000/svg';
  var uid = 0;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var TAGINFO = {
    MEASURED: 'A value measured on real plants, fields or wells and reported in the source named.',
    DERIVED: 'Calculated from other values by a stated step.',
    SECONDARY: 'Taken from a guideline, review or summary, not from the original measurement.',
    ILLUSTRATIVE: 'Invented to show a shape or a direction. Not data.',
    OPEN: 'An open question: not yet measured or still disputed.'
  };
  function badge(tag, title) {
    if (window.WS && WS.badge) return WS.badge(tag, title);
    var t = (title ? title + ' ' : '') + (TAGINFO[tag] || '');
    return '<span class="wsb wsb-' + tag.toLowerCase() + '" title="' + esc(t) + '" role="img" aria-label="' + esc(tag + ': ' + t) + '">' + tag + '</span>';
  }
  function a(href, text) { return '<a href="' + href + '" target="_blank" rel="noopener">' + text + '</a>'; }
  function doi(d) { return a('https://doi.org/' + d, 'doi ' + d); }
  function pct(x) { return Math.round(x) + ' %'; }

  /* ------------------------------------------------------------ sources (verified file rows 14 to 21) */
  var SRC = {
    cdfa: 'CDFA FREP and UC Davis, California Crop Fertilization Guidelines: Lettuce, Nitrogen Uptake and Partitioning. ' +
      a('https://www.cdfa.ca.gov/is/ffldrs/frep/FertilizationGuidelines/N_Lettuce.html', 'cdfa.ca.gov guideline page') +
      '. The page cites Bottoms TG, Smith RF, Cahn MD, Hartz TK (2012) HortScience 47: 1768, ' + doi('10.21273/HORTSCI.47.12.1768') + '.',
    frep: 'Smith R, Cahn M, Hartz TK. Evaluation of N uptake and water use of leafy greens grown in high density 80 inch bed plantings and demonstration of best management practices. CDFA FREP Final Report, Contract 12-0362-SA (undated report). ' +
      a('https://www.cdfa.ca.gov/is/ffldrs/frep/pdfs/completedprojects/12-0362-SA_Smith.pdf', 'cdfa.ca.gov report PDF') + ', Table 1.',
    heinrich: 'Heinrich A, Smith R, Cahn M (2014) Winter killed cereal rye cover crop influence on nitrate leaching in intensive vegetable production systems. HortTechnology 24: 502, ' + doi('10.21273/HORTTECH.24.5.502') + '.',
    wyland: 'Wyland LJ, Jackson LE, Chaney WE, Klonsky K, Koike ST, Kimple B (1996) Winter cover crops in a vegetable cropping system: impacts on nitrate leaching, soil water, crop yield, pests and management costs. Agric Ecosyst Environ 59: 1, ' + doi('10.1016/0167-8809(96)01048-1') +
      '. Values read from a secondary summary (' + a('https://conservationevidencejournal.com/individual-study/5944', 'Conservation Evidence, study 5944') + '); the primary abstract was not checked.',
    board: 'Central Coast Regional Water Quality Control Board (2014) Staff Report, Item 11, July 31 to August 1, 2014: CCAMP Groundwater Assessment and Protection (GAP) Update and Summary of Groundwater Basin Data with Respect to Nitrate. ' +
      a('https://www.waterboards.ca.gov/centralcoast/board_info/agendas/2014/july/item11/item11_stfrpt.pdf', 'waterboards.ca.gov staff report PDF') + '.',
    shang: 'Shang Y, Shi H, Liu M, Lan P, Li D, Liu X, Wang M, Zhang Z, Chen S (2025) Using synthetic biology to express nitrogenase biosynthesis pathway in rice and to overcome barriers of nitrogenase instability in plant cytosol. Trends Biotechnol 43: 946, ' + doi('10.1016/j.tibtech.2024.12.002') + '.',
    sub09: 'Subbarao GV, Nakahara K, Hurtado MP, et al. (2009) Evidence for biological nitrification inhibition in Brachiaria pastures. Proc Natl Acad Sci USA 106: 17302, ' + doi('10.1073/pnas.0903694106') + '.',
    sub21: 'Subbarao GV, Kishii M, Bozal-Leorri A, et al. (2021) Enlisting wild grass genes to combat nitrification in wheat farming: a nature based solution. Proc Natl Acad Sci USA 118: e2106595118, ' + doi('10.1073/pnas.2106595118') + '.',
    shen: 'Shen D, Wippel K, Remmel S, Zhang Y, Kuertoes N, Neumann U, Kopriva S, Andersen TG (2024) The Arabidopsis SGN3/GSO1 receptor kinase integrates soil nitrogen status into shoot development. EMBO J 43: 2486, ' + doi('10.1038/s44318-024-00107-3') + '.'
  };

  /* ------------------------------------------------------------ data (every value tagged where it is shown) */
  var CROPS = [   /* N applied / N uptake, commercial fields 2013 to 2015, FREP 12-0362 Table 1: MEASURED */
    { id: 'spinach', name: 'Spinach', r: 1.46 },
    { id: 'mizuna', name: 'Mizuna', r: 1.76 },
    { id: 'cilantro', name: 'Cilantro', r: 2.16 },
    { id: 'baby', name: 'Baby lettuce', r: 2.96 }
  ];
  var Y1 = { fallow: 94, partial: 107, full: 34 };   /* lb N/acre below 60 cm, year 1, Heinrich 2014: MEASURED */
  var WELLS = [   /* % of on farm domestic wells over 10 mg/L nitrate as N, 2014 staff report: MEASURED */
    { id: 'mont', name: 'Monterey County', sub: 'all on farm domestic wells sampled', p: 45 },
    { id: 'east', name: 'East Side Aquifer', sub: 'a subbasin of the Salinas Valley basin', p: 64 },
    { id: 'smv', name: 'Santa Maria Valley', sub: 'the Santa Maria Valley basin', p: 47 }
  ];

  /* ------------------------------------------------------------ svg helpers */
  function E(tag, at, kids) {
    var s = '<' + tag;
    for (var k in at) if (at[k] != null) s += ' ' + k + '="' + (typeof at[k] === 'number' ? +at[k].toFixed(2) : esc(at[k])) + '"';
    return s + (kids == null ? '/>' : '>' + kids + '</' + tag + '>');
  }
  function T(x, y, txt, cls, anchor, extra) {
    var at = { x: x, y: y, 'class': cls || 'nch-t', 'text-anchor': anchor || 'start' };
    if (extra) for (var k in extra) at[k] = extra[k];
    return E('text', at, esc(txt));
  }
  function patterns(p) {
    return '<defs>' +
      E('pattern', { id: p + 'hatch', width: 6, height: 6, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' },
        E('rect', { width: 6, height: 6, 'class': 'nch-hbg' }) + E('line', { x1: 0, y1: 0, x2: 0, y2: 6, 'class': 'nch-hln' })) +
      E('pattern', { id: p + 'dots', width: 5, height: 5, patternUnits: 'userSpaceOnUse' },
        E('rect', { width: 5, height: 5, 'class': 'nch-dbg' }) + E('circle', { cx: 2.5, cy: 2.5, r: 1.1, 'class': 'nch-dot' })) +
      '</defs>';
  }
  function svgOpen(W, H, label) { return '<svg xmlns="' + NS + '" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="' + esc(label) + '">'; }

  /* ------------------------------------------------------------ panel 1: demand is back-loaded */
  var HEAD = 0.6;   /* where heading sits on the unitless season axis: ILLUSTRATIVE */
  function curve(t) { return 100 * Math.pow(t, Math.log(0.25) / Math.log(HEAD)); }   /* passes 25 % at heading: ILLUSTRATIVE */
  function fig1(W, s, p) {
    var H = 262, L = 44, R = 14, Tp = 42, B = 44, x0 = L, x1 = W - R, y0 = H - B, y1 = Tp;
    function X(t) { return x0 + t * (x1 - x0); }
    function Y(v) { return y0 - v / 100 * (y0 - y1); }
    var o = svgOpen(W, H, 'Share of the season nitrogen a lettuce crop has taken up, from planting to harvest. Between heading and harvest it takes up 70 to 80 percent. The curve shape is illustrative.') + patterns(p);
    o += E('rect', { x: X(HEAD), y: y1, width: X(1) - X(HEAD), height: y0 - y1, 'class': 'nch-win' });
    o += T((X(HEAD) + X(1)) / 2, y1 - 22, 'heading to harvest', 'nch-t nch-b', 'middle');
    o += T((X(HEAD) + X(1)) / 2, y1 - 6, 'generally the last month', 'nch-t nch-s', 'middle');
    [0, 25, 50, 75, 100].forEach(function (v) {
      o += E('line', { x1: x0, x2: x1, y1: Y(v), y2: Y(v), 'class': 'nch-grid' });
      o += T(x0 - 6, Y(v) + 4, v + '', 'nch-tick', 'end');
    });
    o += E('line', { x1: x0, x2: x1, y1: y0, y2: y0, 'class': 'nch-ax' }) + E('line', { x1: x0, x2: x0, y1: y0, y2: y1, 'class': 'nch-ax' });
    [[0, 'planting', 'start'], [HEAD, 'heading', 'middle'], [1, 'harvest', 'end']].forEach(function (k) {
      o += E('line', { x1: X(k[0]), x2: X(k[0]), y1: y0, y2: y0 + 4, 'class': 'nch-ax' });
      o += T(X(k[0]), y0 + 17, k[1], 'nch-tick', k[2]);
    });
    o += T(x0, H - 6, 'season, not to scale', 'nch-t nch-s', 'start');
    o += T(-(y0 + y1) / 2, 12, 'N taken up, % of season total', 'nch-axt', 'middle', { transform: 'rotate(-90)' });
    if (s.steady) {
      o += E('line', { x1: X(0), y1: Y(0), x2: X(1), y2: Y(100), 'class': 'nch-steady' });
      o += T(X(0.3) + 6, Y(30) - 8, 'if uptake were steady', 'nch-t nch-s nch-lab', 'end', { transform: 'rotate(' + (-Math.atan2(Y(0) - Y(100), X(1) - X(0)) * 180 / Math.PI).toFixed(1) + ' ' + (X(0.3) + 6).toFixed(1) + ' ' + (Y(30) - 8).toFixed(1) + ')', 'data-ok-overlap': '1' });
    }
    var d = '';
    for (var i = 0; i <= 60; i++) { var t = i / 60; d += (i ? 'L' : 'M') + X(t).toFixed(1) + ' ' + Y(curve(t)).toFixed(1); }
    o += E('path', { d: d, 'class': 'nch-curve' });
    /* the sourced fact: 20 to 30 % before heading, 70 to 80 % after it */
    var bx = X(HEAD);
    o += E('rect', { x: bx - 5, y: Y(30), width: 10, height: Y(20) - Y(30), fill: 'url(#' + p + 'hatch)', 'class': 'nch-band' });
    var bk = X(1) - 12;
    o += E('path', { d: 'M' + (bk - 6) + ' ' + Y(25) + 'H' + bk + 'V' + Y(100) + 'H' + (bk - 6), 'class': 'nch-brk' });
    o += T(X(HEAD) - 10, Y(76), '70 to 80 %', 'nch-t nch-big', 'end');
    o += T(X(HEAD) - 10, Y(76) + 17, 'of season N, after heading', 'nch-t nch-s', 'end');
    o += T(bx - 9, Y(36), '20 to 30 %', 'nch-t nch-s', 'end');
    o += T(x0 + 6, y1 + 12, 'curve shape ILLUSTRATIVE', 'nch-t nch-s nch-ill', 'start');
    return o + '</svg>';
  }

  /* ------------------------------------------------------------ panel 2: the fertiliser misses it */
  function fig2(W, s, p) {
    var LW = W < 420 ? 94 : 108, R = 40, rowH = 38, Tp = 34, H = Tp + rowH * CROPS.length + 40;
    var x0 = LW, x1 = W - R, MAX = 3.2;
    function X(v) { return x0 + v / MAX * (x1 - x0); }
    var o = svgOpen(W, H, 'Nitrogen applied divided by nitrogen taken up, for four leafy greens in commercial fields: spinach 1.46, mizuna 1.76, cilantro 2.16, baby lettuce 2.96.') + patterns(p);
    [0, 1, 2, 3].forEach(function (v) {
      o += E('line', { x1: X(v), x2: X(v), y1: Tp - 6, y2: H - 34, 'class': v === 1 ? 'nch-ref' : 'nch-grid' });
      o += T(X(v), H - 20, v + '', 'nch-tick', 'middle');
    });
    o += T(X(1) + 4, Tp - 14, 'at 1, applied equals taken up', 'nch-t nch-s', 'start');
    o += T((x0 + x1) / 2, H - 4, 'N applied ÷ N taken up by the crop', 'nch-axt', 'middle');
    CROPS.forEach(function (c, i) {
      var y = Tp + i * rowH + 6, h = rowH - 14, on = c.id === s.crop;
      o += '<g class="nch-row' + (on ? ' on' : '') + '">';
      o += T(x0 - 8, y + h / 2 + 4, c.name, on ? 'nch-t nch-b' : 'nch-t', 'end');
      o += E('rect', { x: X(0), y: y, width: X(1) - X(0), height: h, 'class': 'nch-up' });
      o += E('rect', { x: X(1), y: y, width: X(c.r) - X(1), height: h, fill: 'url(#' + p + 'hatch)', 'class': 'nch-sur' });
      if (on) o += E('rect', { x: X(0) - 2, y: y - 2, width: X(c.r) - X(0) + 4, height: h + 4, 'class': 'nch-sel' });
      o += T(X(c.r) + 5, y + h / 2 + 4, c.r.toFixed(2), on ? 'nch-t nch-b' : 'nch-t', 'start');
      o += '</g>';
    });
    return o + '</svg>';
  }

  /* ------------------------------------------------------------ panel 3: where the surplus goes */
  function fig3(W, s, p) {
    if (s.view === 'year1') {
      var H = 270, L = 44, R = 10, Tp = 44, B = 52, x0 = L, x1 = W - R, y0 = H - B, y1 = Tp, MAX = 120;
      function Y(v) { return y0 - v / MAX * (y0 - y1); }
      var bars = [
        { k: 'fallow', l1: 'Bare', l2: 'fallow', v: Y1.fallow, cls: 'nch-fal', fill: 'url(#' + p + 'dots)' },
        { k: 'partial', l1: 'Cover crop,', l2: 'killed early', v: Y1.partial, cls: 'nch-par', fill: 'url(#' + p + 'hatch)' },
        { k: 'full', l1: 'Cover crop,', l2: 'full season', v: Y1.full, cls: 'nch-ful', fill: null }
      ];
      var bw = Math.min(70, (x1 - x0) / 3 * 0.56), gap = (x1 - x0) / 3;
      var o = svgOpen(W, H, 'Nitrate nitrogen leached below 60 centimetres in year 1: bare fallow 94, cover crop killed early 107, full season cover crop 34 pounds per acre.') + patterns(p);
      [0, 30, 60, 90, 120].forEach(function (v) {
        o += E('line', { x1: x0, x2: x1, y1: Y(v), y2: Y(v), 'class': 'nch-grid' });
        o += T(x0 - 6, Y(v) + 4, v + '', 'nch-tick', 'end');
      });
      o += E('line', { x1: x0, x2: x1, y1: y0, y2: y0, 'class': 'nch-ax' });
      o += T(-(y0 + y1) / 2, 12, 'N leached, lb/acre', 'nch-axt', 'middle', { transform: 'rotate(-90)' });
      var cx = [];
      bars.forEach(function (b, i) {
        var c = x0 + gap * (i + 0.5); cx.push(c);
        o += E('rect', { x: c - bw / 2, y: Y(b.v), width: bw, height: y0 - Y(b.v), 'class': 'nch-bar ' + b.cls, fill: b.fill });
        o += T(c, Y(b.v) - 6, String(b.v), 'nch-t nch-b', 'middle');
        o += T(c, y0 + 17, b.l1, 'nch-tick', 'middle');
        o += T(c, y0 + 31, b.l2, 'nch-tick', 'middle');
      });
      /* the bracket: fallow vs killed early */
      var by = Y(MAX) - 4;
      o += E('path', { d: 'M' + cx[0] + ' ' + (Y(Y1.fallow) - 22) + 'V' + by + 'H' + cx[1] + 'V' + (Y(Y1.partial) - 22), 'class': 'nch-brk' });
      o += T((cx[0] + cx[1]) / 2, by - 8, 'no better than bare fallow', 'nch-t nch-b', 'middle');
      return o + '</svg>';
    }
    /* view 'both': percent less nitrate leached than bare fallow, two studies */
    var rows = [
      { lab: 'Heinrich 2014, year 2, full season: 75 %', v: 75, k: 'dot' },
      { lab: 'Heinrich 2014, year 1, full season: 64 %', v: 64, k: 'dot' },
      { lab: 'Heinrich 2014, year 2, killed early: 52 %', v: 52, k: 'dot' },
      { lab: 'Heinrich 2014, year 1, killed early: no effect', v: 100 * (1 - Y1.partial / Y1.fallow), k: 'ring' },
      { sep: true },
      { lab: 'Wyland 1996, resin bags, estimates: 63 to 75 %', v: 63, v2: 75, k: 'range' },
      { lab: 'Wyland 1996, suction samplers: about 45 %', v: 45, k: 'sq' }
    ];
    var L2 = 14, R2 = 14, Tp2 = 8, rh = 36, n = 0;
    rows.forEach(function (r) { n += r.sep ? 0.5 : 1; });
    var H2 = Tp2 + n * rh + 44, xa = L2, xb = W - R2, LO = -20, HI = 100;
    function X2(v) { return xa + (v - LO) / (HI - LO) * (xb - xa); }
    var o2 = svgOpen(W, H2, 'Percent less nitrate leached than bare fallow. Heinrich 2014: full season cover crop 75 and 64 percent, killed early 52 percent in year 2 and no effect in year 1. Wyland 1996: about 63 to 75 percent with one method, about 45 percent with suction samplers.') + patterns(p);
    [-20, 0, 25, 50, 75, 100].forEach(function (v) {
      o2 += E('line', { x1: X2(v), x2: X2(v), y1: Tp2, y2: H2 - 38, 'class': v === 0 ? 'nch-ref' : 'nch-grid' });
      o2 += T(X2(v), H2 - 24, (v < 0 ? '\u2212' + (-v) : v) + '', 'nch-tick', 'middle');
    });
    o2 += T((xa + xb) / 2, H2 - 6, '% less nitrate leached than bare fallow', 'nch-axt', 'middle');
    var y = Tp2;
    rows.forEach(function (r) {
      if (r.sep) { o2 += E('line', { x1: xa, x2: xb, y1: y + rh * 0.25, y2: y + rh * 0.25, 'class': 'nch-sep' }); y += rh * 0.5; return; }
      o2 += T(xa, y + 12, r.lab, 'nch-t nch-s nch-lab', 'start');
      var my = y + 25;
      o2 += E('line', { x1: xa, x2: xb, y1: my, y2: my, 'class': 'nch-lane' });
      if (r.k === 'dot') o2 += E('circle', { cx: X2(r.v), cy: my, r: 6, 'class': 'nch-m1' });
      else if (r.k === 'ring') o2 += E('circle', { cx: X2(r.v), cy: my, r: 6, 'class': 'nch-m0' });
      else if (r.k === 'range') o2 += E('rect', { x: X2(r.v), y: my - 5, width: X2(r.v2) - X2(r.v), height: 10, 'class': 'nch-m2' });
      else o2 += E('rect', { x: X2(r.v) - 6, y: my - 6, width: 12, height: 12, 'class': 'nch-m2' });
      y += rh;
    });
    return o2 + '</svg>';
  }

  /* ------------------------------------------------------------ panel 4: whose well it is */
  function fig4(W, s, p) {
    var w = WELLS.filter(function (x) { return x.id === s.place; })[0] || WELLS[1];
    var narrow = W < 460, cell = narrow ? 12 : 15, gap = 3, side = 10 * cell + 9 * gap;
    var gx = 8, gy = 10, tx = gx + side + 16;
    var barTop = gy + side + 36, rh = 44, H = barTop + rh * WELLS.length + 8;
    var o = svgOpen(W, H, w.p + ' of every 100 on farm domestic wells sampled in ' + w.name + ' were over the nitrate standard of 10 milligrams per litre as nitrogen.') + patterns(p);
    for (var i = 0; i < 100; i++) {
      var r = Math.floor(i / 10), c = i % 10;
      o += E('rect', { x: gx + c * (cell + gap), y: gy + (9 - r) * (cell + gap), width: cell, height: cell, rx: 2, 'class': i < w.p ? 'nch-wo' : 'nch-wu' });
    }
    o += T(tx, gy + 30, w.p + ' of 100', 'nch-t nch-huge', 'start');
    o += T(tx, gy + 52, 'wells over the standard', 'nch-t', 'start');
    o += T(tx, gy + 74, w.name, 'nch-t nch-b', 'start');
    var subw = narrow ? w.sub.split(' ').reduce(function (acc, wd) { var l = acc[acc.length - 1]; if ((l + ' ' + wd).length > 22 && l) acc.push(wd); else acc[acc.length - 1] = l ? l + ' ' + wd : wd; return acc; }, ['']) : [w.sub];
    subw.forEach(function (ln, k) { o += T(tx, gy + 92 + k * 15, ln, 'nch-t nch-s', 'start'); });
    var ly = gy + side + 10;
    o += E('rect', { x: gx, y: ly, width: 12, height: 12, rx: 2, 'class': 'nch-wo' }) + T(gx + 18, ly + 10, 'over the standard', 'nch-t nch-s', 'start');
    o += E('rect', { x: gx + 150, y: ly, width: 12, height: 12, rx: 2, 'class': 'nch-wu' }) + T(gx + 168, ly + 10, 'not over', 'nch-t nch-s', 'start');
    var x0 = 8, x1 = W - 44;
    function X(v) { return x0 + v / 100 * (x1 - x0); }
    WELLS.forEach(function (q, k) {
      var y = barTop + k * rh, on = q.id === w.id;
      o += T(x0, y + 12, q.name, on ? 'nch-t nch-b' : 'nch-t', 'start');
      o += E('rect', { x: x0, y: y + 18, width: x1 - x0, height: 14, 'class': 'nch-lane2' });
      o += E('rect', { x: x0, y: y + 18, width: X(q.p) - x0, height: 14, 'class': on ? 'nch-wbar on' : 'nch-wbar' });
      o += T(X(100) + 6, y + 30, q.p + ' %', on ? 'nch-t nch-b' : 'nch-t', 'start');
    });
    return o + '</svg>';
  }

  /* ------------------------------------------------------------ the four panels: words */
  var M = badge('MEASURED'), D = badge('DERIVED'), S2 = badge('SECONDARY'), I = badge('ILLUSTRATIVE');
  var PANELS = [
    { n: 1, key: 'demand', short: 'The crop', title: 'Demand is back-loaded',
      icon: '<path d="M12 21V11M12 11C12 6 8 4 4 4c0 5 3 7 8 7Zm0 0c0-5 4-7 8-7 0 5-3 7-8 7Z"/>',
      lede: 'Every nitrate ion a lettuce keeps had to cross a root cell <b>membrane</b> (Plate V). But the crop does not take nitrogen up evenly. Most of it goes in near the end.',
      ctl: { key: 'steady', type: 'toggle', label: 'Compare with steady uptake' },
      fig: fig1,
      cap: function () { return '<b>Lettuce nitrogen uptake.</b> Between <b>heading</b> (when the head starts to form) and harvest, generally the last month, the crop takes up 70 to 80 % of its season nitrogen ' + S2 + '. So 20 to 30 % went in before heading ' + D + ' (100 minus 70 to 80). The curve shape, the position of heading and the dashed steady line are ' + I + ': only the shares are from the source.<br><span class="nch-src">' + SRC.cdfa + '</span>'; },
      now: function (s) { return s.steady ? 'The dashed line is a crop that took up the same amount every day. The real crop sits far below it until heading, then catches up fast: <b>70 to 80 % in the last stretch</b> ' + S2 + '.' : 'The crop takes up little nitrogen early, then <b>70 to 80 %</b> of the season total between heading and harvest ' + S2 + '. Nitrogen in the soil early in the season mostly waits.'; }
    },
    { n: 2, key: 'misses', short: 'Fertiliser', title: 'The fertiliser misses it',
      icon: '<path d="M7 7h10l2 13H5L7 7Zm2 0V5h6v2M9 12h6"/>',
      lede: 'Growers in these fields applied more nitrogen than the crop took up. The bar shows the <b>ratio</b>: nitrogen applied divided by nitrogen the crop took up. At 1, they match.',
      ctl: { key: 'crop', type: 'choice', label: 'Crop', options: CROPS.map(function (c) { return [c.id, c.name]; }) },
      fig: fig2,
      cap: function () { return '<b>Applied versus uptake, commercial fields, 2013 to 2015.</b> Ratios: spinach 1.46, mizuna 1.76, cilantro 2.16, baby lettuce 2.96 ' + M + '. Solid part: nitrogen that ended up in the crop. Hatched part: nitrogen applied beyond what the crop took up. The share not in the crop is 1 minus 1 ÷ ratio ' + D + '. Not in the crop does not mean leached: panel 3 measures what goes below the roots.<br><span class="nch-src">' + SRC.frep + '</span>'; },
      now: function (s) {
        var c = CROPS.filter(function (x) { return x.id === s.crop; })[0];
        var miss = 100 * (1 - 1 / c.r);
        return '<b>' + c.name + '</b>: for every 1 lb of nitrogen the crop took up, ' + c.r.toFixed(2) + ' lb were applied ' + M + '. So about <b>' + pct(miss) + '</b> of what was applied did not end up in the crop ' + D + '.';
      }
    },
    { n: 3, key: 'below', short: 'Below the roots', title: 'Where the surplus goes, and what stops it',
      icon: '<path d="M3 8h18M3 13h18M3 18h18M12 3v18" /><path d="M9 15l3 3 3-3"/>',
      lede: 'Nitrate is a negative ion. Soil particles do not hold it, so it moves down with water when winter rain soaks through a bare field. A <b>cover crop</b> is a crop grown over winter to hold the soil and take up nitrogen. In this field trial, one was left to grow all winter and one was killed early.',
      ctl: { key: 'view', type: 'choice', label: 'Show', options: [['year1', 'One field, year 1'], ['both', 'Two studies']] },
      fig: fig3,
      cap: function () { return '<b>Nitrate leached below 60 cm, Salinas, California.</b> Year 1: bare fallow 94, cover crop killed early 107, full season cover crop 34 lb N/acre ' + M + '. The paper reports the killed early cover crop as having no effect relative to fallow: 107 and 94 are not a significant difference. The full season cover crop cut leaching by 64 % in year 1 and 75 % in year 2; the killed early one by 52 % in year 2 ' + M + '. The year 1 killed early marker sits at 1 minus 107 ÷ 94 ' + D + '. Wyland 1996 found the same direction and a similar size, but the size depends on how leaching was measured: about 63 to 75 % with resin bags and estimates, about 45 % with suction samplers ' + S2 + ' ' + D + ', computed from values in a secondary summary; the primary abstract was not checked.<br><span class="nch-src">' + SRC.heinrich + '</span><br><span class="nch-src">' + SRC.wyland + '</span>'; },
      now: function (s) { return s.view === 'year1' ?
        'Same plant, same field. Grown all winter, the cover crop let <b>34</b> lb N/acre through; killed early, <b>107</b>, no better than bare fallow at <b>94</b> ' + M + '. In this trial, what mattered was how long the cover crop grew.' :
        'Two studies, two methods, one direction: a cover crop that grows through the winter cuts nitrate leaching by roughly half to three quarters ' + M + ' ' + S2 + '. How much depends on the method. Killed early, it did nothing measurable in year 1 ' + M + '.'; }
    },
    { n: 4, key: 'well', short: 'The well', title: 'Whose well it is',
      icon: '<path d="M5 9h14M7 9V6h10v3M8 9v12M16 9v12M8 15h8M12 3v3"/>',
      lede: 'Water that drains below the roots can reach the groundwater. Families on farms drink from <b>domestic wells</b>: their own wells, which tend to reach shallower groundwater than public supply wells. The drinking water standard for nitrate is 10 mg/L as nitrogen ' + S2 + '.',
      ctl: { key: 'place', type: 'choice', label: 'Place', options: WELLS.map(function (w) { return [w.id, w.name]; }) },
      fig: fig4,
      cap: function () { return '<b>On farm domestic wells over the nitrate standard, sampled April 2010 to April 2014.</b> Monterey County 45 %, the East Side Aquifer subbasin of the Salinas Valley basin 64 %, the Santa Maria Valley basin 47 % ' + M + '. The report states nitrate with respect to the federal drinking water standard of 10 mg/L as nitrogen. The highest value in it was 137.2 mg/L as nitrogen ' + M + ', about 14 times the standard ' + D + '. The grid redraws each share as wells out of 100 ' + D + '. The Board\u2019s own caveat, in its words: \u201cPublic water system well data are generally biased towards better groundwater quality conditions\u201d. Its reason: those wells are sited and screened to avoid pollution and are taken out of service once polluted. It also notes that domestic wells tend to reach shallower groundwater than public system wells.<br><span class="nch-src">' + SRC.board + '</span>'; },
      now: function (s) {
        var w = WELLS.filter(function (x) { return x.id === s.place; })[0];
        return '<b>' + w.name + '</b>: ' + w.p + ' % of the on farm domestic wells sampled were over the nitrate standard ' + M + '. The chain ends here, at a well.';
      }
    }
  ];

  var WHY = '<p>Each step hands its leftover to the next. <b>Uptake follows growth.</b> A plant takes up nitrogen as it builds new tissue. For lettuce the guideline page puts 70 to 80 % of the season uptake between heading and harvest ' + S2 + '. Nitrogen that is in the soil before then is not yet being used.</p>' +
    '<p><b>A mismatch in time becomes a surplus.</b> When more is applied than the crop takes up, the difference stays in the field: in the soil, in the roots and leaves left behind. Panel 2 measures that gap; it does not measure where it goes.</p>' +
    '<p><b>Nitrate moves with water.</b> Nitrate carries a negative charge, and soil clay and organic matter mostly carry negative charges too, so nitrate is not held. Whatever water drains below the roots carries it down. A cover crop that is alive and growing takes up nitrate and uses water while the rain falls. Killed early, it is no longer doing either during the rest of the winter, which is one way to read why it was no better than fallow in year 1 ' + M + '. The authors add that the killed residue releases nitrogen back into the soil, where it can leach.</p>' +
    '<p><b>Groundwater keeps the record.</b> Shallow wells sit closest to what drains from the fields above. That is why the Board reports on farm domestic wells separately, and why it warns that data from public system wells look better than the shallow water many families drink.</p>' +
    '<div class="tier-3"><p class="nch-k">Expert depth</p>' +
    '<p>Heinrich 2014 measured leaching with suction lysimeters at 60 cm. Year 1 (2010 to 2011, 35 % wetter than average ' + M + ') was at Hartnell East Campus, Salinas; year 2 (2011 to 2012, 47 % drier ' + M + ') about 6 miles (9.7 km) southeast of Salinas ' + M + '. The killed early treatment was a cereal rye cover crop killed with herbicide 56 to 63 days after emergence ' + D + ', converted from the span the paper states.</p>' +
    '<p>The FREP leafy green report ran at least 10 biomass and nitrogen uptake evaluations in commercial fields from 2013 to 2015 ' + M + '. The baby lettuce ratio is the mean of green and red types. The same report gives peak uptake rates of 6.5 (mizuna) and 6.7 (spinach) lb N/acre per day ' + M + '. No sourced daily rate for full sized lettuce is shown here: the guideline page gives none.</p>' +
    '<p>Wyland 1996 worked in an irrigated broccoli system in the Salinas Valley, 1992 to 1993, as the secondary summary describes it. The two methods disagree: resin bags or estimates gave 7 to 9 against 24 to 28 g NO\u2083\u207b-N/m\u00b2 for cover and bare soil, suction samplers 155 against 281 ' + S2 + '. That is about 63 to 75 % and about 45 % less ' + D + '. Read the agreement between the two studies as agreement in direction and rough size, not in an exact number.</p></div>';

  /* ------------------------------------------------------------ the chain */
  function mount(host) {
    if (!host) return null;
    unmount(host);
    var p = 'nch' + (++uid) + '_';
    var st = { step: 1, all: false, steady: false, crop: 'baby', view: 'year1', place: 'east' };
    var root = document.createElement('section');
    root.className = 'nch';
    root.setAttribute('aria-labelledby', p + 'h');
    root.innerHTML =
      '<p class="nch-k">\u2467 The chain</p>' +
      '<h3 class="nch-h" id="' + p + 'h">From a membrane to a drinking water well</h3>' +
      '<p class="nch-what"><b>What this is:</b> four panels built on published data that link one root membrane to one well. Each panel hands its leftover nitrogen to the next.</p>' +
      '<p class="nch-todo"><b>What to do:</b> press the four steps in order, or use Next. Inside each panel, one button changes the picture.</p>' +
      '<div class="nch-bar">' +
        '<ol class="nch-strip" aria-label="The four steps of the chain">' + PANELS.map(function (P, i) {
          return '<li><button type="button" class="nch-node" data-step="' + P.n + '" aria-controls="' + p + 'p' + P.n + '">' +
            '<svg viewBox="0 0 24 24" aria-hidden="true" class="nch-ico">' + P.icon + '</svg>' +
            '<span class="nch-nn">' + P.n + '</span><span class="nch-nl">' + P.short + '</span></button>' +
            (i < 3 ? '<span class="nch-arrow" aria-hidden="true">\u203a</span>' : '') + '</li>';
        }).join('') + '</ol>' +
        '<div class="nch-nav"><button type="button" class="nch-btn" data-go="-1">Back</button><button type="button" class="nch-btn" data-go="1">Next</button>' +
        '<button type="button" class="nch-btn nch-all" aria-pressed="false">Show all four</button></div>' +
      '</div>' +
      '<div class="nch-panels">' + PANELS.map(function (P) {
        var c = P.ctl, ctl = '';
        if (c.type === 'toggle') ctl = '<button type="button" class="nch-btn nch-tog" data-key="' + c.key + '" aria-pressed="false">' + c.label + '</button>';
        else ctl = '<div class="nch-seg" role="radiogroup" aria-label="' + c.label + '"><span class="nch-segl" aria-hidden="true">' + c.label + '</span>' + c.options.map(function (o) {
          return '<button type="button" role="radio" data-key="' + c.key + '" data-val="' + o[0] + '" aria-checked="false">' + o[1] + '</button>';
        }).join('') + '</div>';
        return '<figure class="nch-p" id="' + p + 'p' + P.n + '" data-step="' + P.n + '" tabindex="-1" aria-labelledby="' + p + 'p' + P.n + 't">' +
          '<div class="nch-ph"><span class="nch-pn" aria-hidden="true">' + P.n + '</span><h4 class="nch-pt" id="' + p + 'p' + P.n + 't"><span class="vh">Step ' + P.n + ': </span>' + P.title + '</h4></div>' +
          '<p class="nch-lede">' + P.lede + '</p>' +
          '<div class="nch-ctl">' + ctl + '</div>' +
          '<div class="nch-fig" data-fig="' + P.n + '"></div>' +
          '<p class="nch-now" aria-live="polite"></p>' +
          '<figcaption>' + P.cap() + '</figcaption>' +
          '</figure>';
      }).join('') + '</div>' +
      '<details class="nch-why"><summary>Why does this happen?</summary>' + WHY + '</details>';
    host.appendChild(root);

    var nodes = root.querySelectorAll('.nch-node'), panels = root.querySelectorAll('.nch-p');
    function width() { var w = root.querySelector('.nch-panels').clientWidth || root.clientWidth || 360; return Math.max(280, Math.min(760, Math.floor(w - 26))); }
    function drawPanel(i) {
      var P = PANELS[i], el = panels[i];
      el.querySelector('.nch-fig').innerHTML = P.fig(width(), st, p + i + '_');
      Array.prototype.forEach.call(el.querySelectorAll('[data-key]'), function (b) {
        var k = b.getAttribute('data-key');
        if (b.hasAttribute('data-val')) { var on = String(st[k]) === b.getAttribute('data-val'); b.setAttribute('aria-checked', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1; }
        else b.setAttribute('aria-pressed', st[k] ? 'true' : 'false');
      });
    }
    function say(i) { panels[i].querySelector('.nch-now').innerHTML = '<b class="nch-nowk">What just happened:</b> ' + PANELS[i].now(st); }
    function paint() {
      Array.prototype.forEach.call(nodes, function (b) {
        var n = +b.getAttribute('data-step'), on = n === st.step;
        b.setAttribute('aria-current', on ? 'step' : 'false');
        b.classList.toggle('done', n < st.step);
      });
      Array.prototype.forEach.call(panels, function (el, i) { el.hidden = !st.all && i + 1 !== st.step; el.classList.toggle('on', i + 1 === st.step); });
      root.querySelector('[data-go="-1"]').disabled = st.step === 1;
      root.querySelector('[data-go="1"]').disabled = st.step === 4;
      var al = root.querySelector('.nch-all'); al.setAttribute('aria-pressed', st.all ? 'true' : 'false');
      root.classList.toggle('nch-showall', st.all);
    }
    function drawAll() { for (var i = 0; i < 4; i++) drawPanel(i); }
    function go(n, focus) {
      n = Math.max(1, Math.min(4, n | 0));
      st.step = n; paint(); drawPanel(n - 1); say(n - 1);
      if (focus) {
        var el = panels[n - 1];
        if (st.all && el.scrollIntoView) el.scrollIntoView({ block: 'nearest', behavior: reduced() ? 'auto' : 'smooth' });
      }
    }
    root.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b || !root.contains(b)) return;
      if (b.classList.contains('nch-node')) { go(+b.getAttribute('data-step'), true); return; }
      if (b.hasAttribute('data-go')) { go(st.step + +b.getAttribute('data-go'), true); return; }
      if (b.classList.contains('nch-all')) { st.all = !st.all; paint(); drawAll(); for (var j = 0; j < 4; j++) say(j); return; }
      var k = b.getAttribute('data-key'); if (!k) return;
      var fig = b.closest('.nch-p'), i = +fig.getAttribute('data-step') - 1;
      if (b.hasAttribute('data-val')) st[k] = b.getAttribute('data-val'); else st[k] = !st[k];
      if (st.step !== i + 1) { st.step = i + 1; paint(); }
      drawPanel(i); say(i);
    });
    root.addEventListener('keydown', function (e) {
      var seg = e.target.closest('.nch-seg'), strip = e.target.closest('.nch-strip');
      var dir = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : (e.key === 'ArrowLeft' || e.key === 'ArrowUp') ? -1 : 0;
      if (!dir) return;
      if (seg) {
        var bs = Array.prototype.slice.call(seg.querySelectorAll('button')), k = bs.indexOf(e.target);
        var nb = bs[(k + dir + bs.length) % bs.length]; e.preventDefault(); nb.focus(); nb.click();
      } else if (strip) {
        var n = Math.max(1, Math.min(4, +e.target.closest('.nch-node').getAttribute('data-step') + dir));
        e.preventDefault(); go(n); nodes[n - 1].focus();
      }
    });
    var ro = null, lastW = 0;
    function onResize() { var w = width(); if (Math.abs(w - lastW) < 8) return; lastW = w; drawAll(); }
    if (window.ResizeObserver) { ro = new ResizeObserver(function () { onResize(); }); ro.observe(root); }
    else window.addEventListener('resize', onResize);

    paint(); lastW = width(); drawAll(); for (var j = 0; j < 4; j++) say(j);
    var api = {
      go: function (n) { go(n, true); },
      state: st,
      destroy: function () { if (ro) ro.disconnect(); else window.removeEventListener('resize', onResize); if (root.parentNode) root.parentNode.removeChild(root); }
    };
    root._nch = api; chains.push(api);
    return api;
  }
  var chains = [];
  function reduced() {
    var ui = WP.ui || {};
    if (ui.reducedMotion) return ui.reducedMotion();
    return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  /* ------------------------------------------------------------ OPEN tier panels */
  var O = badge('OPEN');
  function openCards() {
    return [
      { q: 'Could a cereal fix its own nitrogen?',
        art: '<svg viewBox="0 0 250 82" class="nch-oart" role="img" aria-label="Thirteen genes went in, eleven proteins were made, the NifDK part formed, the NifH part was broken down by plant proteases.">' +
          '<rect x="2" y="16" width="56" height="30" rx="3" class="nch-obox"/><text x="30" y="35" class="nch-t nch-s" text-anchor="middle">13 genes</text>' +
          '<path d="M60 31h14" class="nch-oar"/><rect x="76" y="16" width="62" height="30" rx="3" class="nch-obox"/><text x="107" y="35" class="nch-t nch-s" text-anchor="middle">11 proteins</text>' +
          '<path d="M140 31l10 -12M140 31l10 12" class="nch-oar"/>' +
          '<text x="153" y="20" class="nch-t nch-s">NifDK formed</text><text x="153" y="50" class="nch-t nch-s">NifH broken down</text></svg>',
        body: '<p>A cereal that makes its own fertiliser from the air does not exist yet. In rice, Shang and colleagues put in 13 <b>nif</b> genes, the genes bacteria use to build <b>nitrogenase</b>, the enzyme that fixes nitrogen gas ' + M + '. Eleven Nif proteins were made and a stable NifDK part formed ' + M + '. But NifH was broken down by the plant\u2019s own protein cutting enzymes, its proteases. The team then made NifH versions that resist them.</p>' +
          '<p class="nch-oq"><b>Open:</b> the paper reports parts, not a rice plant that fixes nitrogen. Whether all the parts can work together inside a plant cell is the question.</p>',
        src: SRC.shang },
      { q: 'Could a root keep nitrogen from turning into nitrate?', link: true,
        art: '<svg viewBox="0 0 250 82" class="nch-oart" role="img" aria-label="Soil microbes turn ammonium into nitrate; a root exudate slows that step.">' +
          '<text x="8" y="36" class="nch-t nch-b">NH\u2084\u207a</text><path d="M48 31h86" class="nch-oar"/><text x="142" y="36" class="nch-t nch-b">NO\u2083\u207b</text>' +
          '<text x="91" y="22" class="nch-t nch-s" text-anchor="middle">soil microbes</text>' +
          '<path d="M91 40v20" class="nch-oinh"/><path d="M81 40h20" class="nch-oinh"/><text x="91" y="72" class="nch-t nch-s" text-anchor="middle">root exudate slows it</text></svg>',
        body: '<p>Soil microbes turn <b>ammonium</b> into <b>nitrate</b>, the form that washes down to wells (panel 4). This step is <b>nitrification</b>. Some plants slow it from the root: <b>biological nitrification inhibition</b>. In the pasture grass <i>Brachiaria humidicola</i>, roots release <b>brachialactone</b>, which accounted for 60 to 90 % of the inhibitory activity ' + M + ' (Subbarao 2009). Moving the short arm of one chromosome from the wild grass <i>Leymus racemosus</i> into the wheat variety Chinese Spring doubled its inhibition capacity ' + M + ', and an elite line carrying it had higher biomass, grain yield and nitrogen uptake ' + M + ' (Subbarao 2021).</p>' +
          '<p class="nch-oq"><b>Open:</b> this is somebody trying to fix the well problem at the root. Neither paper measures wells. Whether a trait like this changes what reaches water like panel 4\u2019s is not yet known.</p>',
        src: SRC.sub09 + '<br>' + SRC.sub21 },
      { q: 'Is the endodermis a sensor, not just a seal?',
        art: '<svg viewBox="0 0 250 82" class="nch-oart" role="img" aria-label="The endodermis seal pathway in the root sends a signal that the shoot needs to respond to low soil nitrogen.">' +
          '<rect x="6" y="40" width="80" height="26" rx="3" class="nch-obox"/><text x="46" y="57" class="nch-t nch-s" text-anchor="middle">root seal</text>' +
          '<path d="M90 53h44" class="nch-oar" stroke-dasharray="4 3"/><text x="112" y="46" class="nch-t nch-s" text-anchor="middle">?</text>' +
          '<rect x="138" y="8" width="76" height="26" rx="3" class="nch-obox"/><text x="176" y="25" class="nch-t nch-s" text-anchor="middle">shoot</text><path d="M176 36v14h-42" class="nch-oar" fill="none"/></svg>',
        body: '<p>The <b>endodermis</b> is the root layer whose Casparian strip seals the walls (Plate III). The receptor kinase SGN3, also called GSO1, is part of the <b>Schengen pathway</b>, which works at the Casparian strip (Gao et al. 2023, Science 382: 464, ' + doi('10.1126/science.adi5032') + '). In <i>Arabidopsis</i> grown in soil, Shen and colleagues found the pathway is required for the shoot\u2019s response to low soil nitrogen. So the seal may also report on the soil.</p>' +
          '<p class="nch-oq"><b>Open:</b> how a pathway at the seal also carries news about nitrogen, and whether crops do the same.</p>',
        src: SRC.shen }
    ];
  }
  function mountOpen(host) {
    if (!host) return null;
    var old = host.querySelector(':scope > .nch-open'); if (old) old.parentNode.removeChild(old);
    var p = 'nco' + (++uid) + '_';
    var root = document.createElement('section');
    root.className = 'nch-open';
    root.setAttribute('aria-labelledby', p + 'h');
    root.innerHTML = '<div class="nch-oh">' + O + '<h3 class="nch-h" id="' + p + 'h">Open questions on the nutrient path</h3></div>' +
      '<p class="nch-what">These are not results. Each card starts from a published finding and ends where the evidence stops.</p>' +
      '<div class="nch-ogrid">' + openCards().map(function (c, i) {
        return '<article class="nch-ocard" aria-labelledby="' + p + 'q' + i + '"><p class="nch-ok">' + O + '</p><h4 class="nch-oqt" id="' + p + 'q' + i + '">' + c.q + '</h4>' + c.art + c.body +
          (c.link ? '<p><button type="button" class="nch-btn nch-towell">Back to the well, panel 4</button></p>' : '') +
          '<p class="nch-src">' + c.src + '</p></article>';
      }).join('') +
      '<article class="nch-ocard" aria-labelledby="' + p + 'q4"><p class="nch-ok">' + O + '</p><h4 class="nch-oqt" id="' + p + 'q4">Which route does each nutrient take across the root?</h4>' +
        '<p>Through the cell walls, from cell to cell, or across membranes: how a nutrient splits between these routes is an open question. It is built as a workstation on Plate III.</p>' +
        '<p><a class="nch-btn nch-lnk" href="#organ">Go to Plate III, Organ</a></p></article>' +
      '</div>';
    host.appendChild(root);
    root.addEventListener('click', function (e) {
      var b = e.target.closest('.nch-towell'); if (!b) return;
      var el = document.querySelector('.nch'), c = el && el._nch;
      if (c) {
        c.go(4);
        var pn = el.querySelector('.nch-p[data-step="4"]');
        if (pn) { if (pn.scrollIntoView) pn.scrollIntoView({ block: 'start', behavior: reduced() ? 'auto' : 'smooth' }); pn.focus({ preventScroll: true }); }
      }
    });
    var api = { destroy: function () { if (root.parentNode) root.parentNode.removeChild(root); } };
    root._nco = api;
    return api;
  }

  function unmount(host) {
    if (!host) return;
    Array.prototype.forEach.call(host.querySelectorAll('.nch'), function (el) {
      if (el._nch) { var i = chains.indexOf(el._nch); if (i >= 0) chains.splice(i, 1); el._nch.destroy(); }
      else if (el.parentNode) el.parentNode.removeChild(el);
    });
    Array.prototype.forEach.call(host.querySelectorAll('.nch-open'), function (el) { if (el._nco) el._nco.destroy(); else if (el.parentNode) el.parentNode.removeChild(el); });
  }

  /* ------------------------------------------------------------ styles (tokens from styles.css; AA in both themes) */
  var css = '\
.nch,.nch-open{font-family:var(--ui);font-size:14.5px;line-height:1.5;color:var(--ink);margin:18px 0;max-width:62em;min-width:0}\
.nch{--nch-up:var(--w2);--nch-sur:var(--warm)}\
.nch .vh{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}\
.nch-k{margin:0;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink2)}\
.nch-h{font-family:var(--disp);font-weight:400;font-size:24px;line-height:1.2;margin:2px 0 6px}\
.nch-what,.nch-todo{margin:3px 0}\
.nch-bar{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;margin:10px 0 8px}\
.nch-strip{display:flex;list-style:none;margin:0;padding:0;gap:0;flex:1 1 420px;min-width:0}\
.nch-strip li{display:flex;align-items:stretch;flex:1 1 0;min-width:0}\
.nch-node{display:flex;flex-direction:column;align-items:center;gap:1px;flex:1 1 auto;min-width:0;min-height:56px;padding:5px 4px;border:1px solid var(--rule);border-radius:3px;background:var(--card);color:var(--ink);font:500 12.5px var(--ui);cursor:pointer;text-align:center}\
.nch-node .nch-ico{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}\
.nch-nn{font:600 11px var(--mono)}\
.nch-nl{line-height:1.15}\
.nch-node.done{background:var(--wall)}\
.nch-node[aria-current="step"]{background:var(--plaque);color:var(--plaque-ink);font-weight:600;box-shadow:inset 0 -4px 0 var(--plaque-ink)}\
.nch-node:focus-visible,.nch-btn:focus-visible,.nch-seg button:focus-visible,.nch-p:focus-visible{outline:3px solid var(--accent);outline-offset:2px}\
.nch-arrow{flex:none;align-self:center;padding:0 3px;color:var(--ink2);font-size:18px}\
.nch-nav{display:flex;gap:6px;flex-wrap:wrap}\
.nch-btn{font:500 13px var(--ui);min-height:44px;min-width:44px;padding:6px 12px;border:1px solid var(--rule);border-radius:3px;background:var(--card);color:var(--ink);cursor:pointer;text-decoration:none;display:inline-flex;align-items:center}\
.nch-btn[aria-pressed="true"]{background:var(--plaque);color:var(--plaque-ink)}\
.nch-btn[aria-pressed="true"]::after{content:" \\2713"}\
.nch-btn:disabled{opacity:.45;cursor:default}\
.nch-panels{display:grid;gap:12px;min-width:0}\
.nch-showall .nch-panels{grid-template-columns:repeat(auto-fit,minmax(min(100%,430px),1fr))}\
.nch-p{margin:0;min-width:0;background:var(--wall);border:1px solid var(--rule2);border-radius:4px;padding:10px 12px}\
.nch-p[hidden]{display:none}\
.nch-showall .nch-p.on{border-color:var(--ink2);box-shadow:inset 4px 0 0 var(--ink2)}\
.nch-ph{display:flex;align-items:center;gap:8px}\
.nch-pn{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;background:var(--plaque);color:var(--plaque-ink);font:600 13px var(--mono);flex:none}\
.nch-pt{font-family:var(--disp);font-weight:400;font-size:20px;line-height:1.2;margin:0}\
.nch-lede{margin:6px 0}\
.nch-ctl{margin:4px 0 6px}\
.nch-seg{display:inline-flex;flex-wrap:wrap;align-items:center;border:1px solid var(--rule);border-radius:3px}\
.nch-segl{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink2);padding:0 8px}\
.nch-seg button{font:500 13px var(--ui);min-height:44px;min-width:44px;padding:6px 10px;border:0;border-left:1px solid var(--rule);background:transparent;color:var(--ink);cursor:pointer}\
.nch-seg button[aria-checked="true"]{background:var(--plaque);color:var(--plaque-ink);font-weight:600}\
.nch-fig{min-width:0;overflow:hidden}\
.nch-fig svg{display:block;max-width:100%;height:auto}\
.nch-now{margin:6px 0;padding:6px 8px;border-left:3px solid var(--accent);background:var(--card);min-height:2.6em}\
.nch-nowk{font-weight:600}\
.nch figcaption,.nch-open .nch-src{font-size:12.5px;color:var(--ink2);margin:6px 0 0}\
.nch figcaption b{color:var(--ink)}\
.nch-src{display:inline-block;margin-top:4px;font-size:12px;color:var(--ink2);overflow-wrap:anywhere}\
.nch a,.nch-open a:not(.nch-btn){color:var(--accent)}\
.nch-why{margin-top:12px;border-top:1px solid var(--rule2);padding-top:6px}\
.nch-why summary{cursor:pointer;font-weight:600;min-height:44px;display:flex;align-items:center}\
.nch-why p{margin:6px 0}\
.nch svg text,.nch-open svg text{font-family:var(--ui)!important}\
.nch .nch-lab{paint-order:stroke;stroke:var(--wall);stroke-width:4px;stroke-linejoin:round}\
.nch-t{font-size:12.5px;fill:var(--ink)}\
.nch-s{font-size:11.5px;fill:var(--ink2)}\
.nch-b{font-weight:600;fill:var(--ink)}\
.nch-big{font-size:17px;font-weight:600;fill:var(--ink)}\
.nch-huge{font-size:24px;font-weight:600;fill:var(--ink)}\
.nch-ill{fill:var(--b-ill);font-weight:600}\
.nch-tick{font-size:11px;fill:var(--ink2)}\
.nch-axt{font-size:11.5px;fill:var(--ink)}\
.nch-grid{stroke:var(--rule2);stroke-width:1}\
.nch-ax{stroke:var(--ink2);stroke-width:1}\
.nch-ref{stroke:var(--ink);stroke-width:1.5;stroke-dasharray:3 3}\
.nch-sep{stroke:var(--rule);stroke-width:1}\
.nch-lane{stroke:var(--rule2);stroke-width:1}\
.nch-win{fill:var(--card);opacity:.9}\
.nch-curve{fill:none;stroke:var(--nch-up);stroke-width:2.5}\
.nch-steady{stroke:var(--ink2);stroke-width:1.5;stroke-dasharray:6 4}\
.nch-band{stroke:var(--nch-sur);stroke-width:1.5}\
.nch-brk{fill:none;stroke:var(--ink);stroke-width:1}\
.nch-hbg{fill:var(--wall)}\
.nch-hln{stroke:var(--nch-sur);stroke-width:2.2}\
.nch-dbg{fill:var(--wall)}\
.nch-dot{fill:var(--ink2)}\
.nch-up{fill:var(--nch-up)}\
.nch-sur{stroke:var(--nch-sur);stroke-width:1}\
.nch-sel{fill:none;stroke:var(--ink);stroke-width:1}\
.nch-bar{stroke:var(--ink2);stroke-width:1}\
.nch-ful{fill:var(--leaf3)}\
.nch-par{stroke:var(--nch-sur)}\
.nch-m1{fill:var(--nch-up);stroke:var(--ink);stroke-width:1}\
.nch-m0{fill:var(--wall);stroke:var(--ink);stroke-width:2}\
.nch-m2{fill:var(--nch-sur);stroke:var(--ink);stroke-width:1}\
.nch-wo{fill:var(--nch-sur)}\
.nch-wu{fill:none;stroke:var(--ink2);stroke-width:1}\
.nch-lane2{fill:var(--card);stroke:var(--rule2);stroke-width:1}\
.nch-wbar{fill:var(--ink2)}\
.nch-wbar.on{fill:var(--nch-sur)}\
.nch-open{--nch-o:#6b1f99;--nch-obg:rgba(107,31,153,.06)}\
:root[data-theme="dark"] .nch-open{--nch-o:#dcb3ff;--nch-obg:rgba(220,179,255,.07)}\
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]) .nch-open{--nch-o:#dcb3ff;--nch-obg:rgba(220,179,255,.07)}}\
.nch-open{border:2px dashed var(--nch-o);border-radius:14px;padding:12px 14px;background:var(--nch-obg)}\
.nch-oh{display:flex;align-items:center;gap:10px;flex-wrap:wrap}\
.nch-oh .nch-h{color:var(--nch-o)}\
.nch-ogrid{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));margin-top:10px}\
.nch-ocard{background:var(--paper);border:1px dashed var(--nch-o);border-radius:10px;padding:10px 12px;min-width:0}\
.nch-ocard p{margin:6px 0}\
.nch-ok{margin:0!important}\
.nch-oqt{font-family:var(--disp);font-weight:400;font-size:19px;line-height:1.25;margin:4px 0 6px;color:var(--ink)}\
.nch-oq{border-left:3px dashed var(--nch-o);padding-left:8px}\
.nch-oart{display:block;width:100%;max-width:300px;height:auto;margin:4px 0}\
.nch-obox{fill:var(--wall);stroke:var(--nch-o);stroke-width:1.2}\
.nch-oar{stroke:var(--ink2);stroke-width:1.5;fill:none}\
.nch-oinh{stroke:var(--nch-o);stroke-width:2.5}\
.nch-open .nch-t{font-size:12.5px;fill:var(--ink)}.nch-open .nch-s{font-size:11.5px;fill:var(--ink2)}.nch-open .nch-b{font-weight:600}\
.nch-open .nch-btn:focus-visible{outline:3px solid var(--accent);outline-offset:2px}\
@media (max-width:560px){.nch-h{font-size:21px}.nch-node{font-size:11.5px;padding:4px 2px}.nch-arrow{padding:0 1px;font-size:15px}.nch-nav{width:100%}.nch-nav .nch-all{margin-left:auto}.nch-p{padding:8px}}\
@media (prefers-reduced-motion: reduce){.nch *{transition:none!important}}\
@media print{.nch-p[hidden]{display:block!important}.nch-bar{display:none}}';
  if (!document.getElementById('nch-css')) { var se = document.createElement('style'); se.id = 'nch-css'; se.textContent = css; document.head.appendChild(se); }

  window.WP_NCHAIN = { mount: mount, mountOpen: mountOpen, unmount: unmount, PANELS: PANELS };
})();

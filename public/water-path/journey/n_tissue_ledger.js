/* The Water Path v8: n_tissue_ledger.js (nutrient path, Plate IV Tissue, part b). Loaded by n_tissue.js.
   (7) The energy ledger: the Calvin cycle and nitrate assimilation drawing on one electron supply, 2D, two panels.
   Then GS/GOGAT drawn beside the Calvin cycle as one inline SVG: two cycles that rebuild their own acceptor.
   Numbers: the electron counts are DERIVED from oxidation states (N +5 to N minus 3 is 8 e; C +4 to C 0 is 4 e);
   the 200 electron budget and the slider range are ILLUSTRATIVE.
   Sources (records as in NUTRIENT_SOURCES_verified_2026-10-26.md):
     Beevers L, Hageman RH (1969) Nitrate reduction in higher plants. Annu Rev Plant Physiol 20 (volume and year only).
     Noctor G, Foyer CH (1998) J Exp Bot 49: 1895. doi:10.1093/jxb/49.329.1895
     Lea PJ, Miflin BJ (1974) Alternative route for nitrogen assimilation in higher plants. Nature 251: 614. doi:10.1038/251614a0
   Exposes WP.nTissueLedger.mount(host) -> {destroy}. */
(function () {
  'use strict';
  var WP = window.WP || (window.WP = {});
  var SVGNS = 'http://www.w3.org/2000/svg';
  var BUDGET = 200, E_N = 8, E_C = 4, NMAX = 20;
  var seq = 0;
  function B(t, s) { return window.WS ? WS.badge(t, s) : t; }
  function minus(s) { return String(s).replace(/-/g, '−'); }

  function mount(host) {
    var id = 'ntl' + (++seq);
    var root = document.createElement('section');
    root.className = 'ws ntl'; root.id = id; root.setAttribute('aria-labelledby', id + '-t');
    root.innerHTML =
      '<header class="ws-hd">' +
        '<h3 class="ws-title" id="' + id + '-t">⑦ The energy ledger ' + B('DERIVED', 'Electron counts follow from oxidation states.') + '</h3>' +
        '<p data-ws-part="what"><b>What this is.</b> A leaf in the light makes a limited stream of <b>electrons</b> (carried as NADPH and similar molecules). Two jobs draw on that stream: the <b>Calvin cycle</b>, which fixes CO₂ into sugar, and <b>nitrate assimilation</b>, which turns nitrate (NO₃⁻) into ammonium (NH₄⁺) that can be built into amino acids. Each dot is 4 electrons.</p>' +
        '<p data-ws-part="todo"><b>What to do.</b> Slide <b>Nitrate assimilated</b> up. Watch the dots leave the Calvin cycle panel and appear in the nitrate panel.</p>' +
      '</header>' +
      '<div class="ntl-stick">' +
        '<div class="ws-pane ntl-ctl" role="group" aria-label="Controls">' +
          '<div class="ws-c ws-range"><label for="' + id + '-n">Nitrate assimilated <output for="' + id + '-n"></output></label>' +
          '<input type="range" id="' + id + '-n" min="0" max="' + NMAX + '" step="1" value="10"><span class="ws-c-h">in the same stretch of time, mmol ' + B('ILLUSTRATIVE', 'The range is invented for the picture.') + '</span></div>' +
          '<svg class="ntl-bar" viewBox="0 0 360 46" role="img" aria-label="The electron supply split between the two jobs"></svg>' +
        '</div>' +
        '<div class="ws-pane ws-live ntl-live" data-ws-part="happened"><p class="ws-k">What just happened</p><p class="ws-live-t" aria-live="polite"></p></div>' +
      '</div>' +
      '<div class="ntl-grid" data-ws-part="thing">' +
        '<figure class="ws-pane ntl-p"><svg class="ntl-c" viewBox="0 0 340 300" role="img" aria-label="Calvin cycle panel"></svg><figcaption><b>Calvin cycle.</b> Fixing one CO₂ to sugar uses 2 NADPH, which is 4 electrons ' + B('DERIVED', 'Carbon goes from +4 in CO2 to 0 in sugar: 4 electrons per CO2.') + '.</figcaption></figure>' +
        '<figure class="ws-pane ntl-p"><svg class="ntl-n" viewBox="0 0 340 300" role="img" aria-label="Nitrate assimilation panel"></svg><figcaption><b>Nitrate assimilation.</b> Nitrate reductase adds 2 electrons in the cytosol; nitrite reductase adds 6 more in the plastid: 8 per nitrate ' + B('DERIVED', 'Nitrogen goes from +5 in nitrate to +3 in nitrite (2 electrons) and to minus 3 in ammonium (6 electrons).') + '. Where each step happens ' + B('SECONDARY', 'Compartments as given in textbooks and reviews; see the Why fold.') + '.</figcaption></figure>' +
        '<figure class="ws-pane ntl-plotp"><svg class="ntl-plot" viewBox="0 0 360 190" role="img" aria-label="CO2 fixed against nitrate assimilated"></svg><figcaption><b>The trade.</b> CO₂ the leaf can still fix from the same 200 electrons, against nitrate assimilated. ' + B('DERIVED', 'CO2 fixed = (200 minus 8 times nitrate) divided by 4.') + ' The 200 electron budget is invented ' + B('ILLUSTRATIVE', 'A fixed electron supply is a model assumption chosen to make the trade visible.') + '.</figcaption></figure>' +
      '</div>' +
      '<p class="ntl-say">Nitrogen is not a trace cost. In a leaf, six of its eight electrons come straight from the light reactions, the same supply the Calvin cycle uses; the first two come as NADH in the cytosol.</p>' +
      '<details class="ws-why" data-ws-part="why"><summary>Why does this happen?</summary><div class="ws-why-b">' + whyHtml() + '</div></details>' +
      gsHtml(id);
    host.appendChild(root);

    var q = function (s) { return root.querySelector(s); };
    var inp = q('#' + id + '-n'), out = q('output'), bar = q('.ntl-bar'), sC = q('.ntl-c'), sN = q('.ntl-n'), sP = q('.ntl-plot'), live = q('.ws-live-t');
    drawCalvinStatic(sC); drawNitrateStatic(sN);
    var dark = WS.isDark();

    function render() {
      var n = +inp.value, eN = E_N * n, eC = BUDGET - eN, co2 = eC / E_C;
      out.textContent = n + ' mmol';
      inp.setAttribute('aria-valuetext', n + ' mmol nitrate, ' + co2 + ' mmol CO2 fixed');
      drawBar(bar, eC, eN);
      fillDots(sC, eC / 4, 'c'); fillDots(sN, eN / 4, 'n');
      setTxt(sC, 'ntl-cv', co2 + ' mmol CO₂ fixed');
      setTxt(sC, 'ntl-ce', eC + ' mmol electrons');
      setTxt(sN, 'ntl-nv', n + ' mmol NO₃⁻ → NH₄⁺');
      setTxt(sN, 'ntl-ne', eN + ' mmol electrons');
      drawPlot(sP, n);
      var lost = 2 * n;
      live.innerHTML = n === 0 ?
        'No nitrate is being assimilated, so all <b>200</b> mmol of electrons go to the Calvin cycle: <b>50</b> mmol CO₂ fixed.' :
        'Turning <b>' + n + '</b> mmol nitrate into ammonium took <b>' + eN + '</b> mmol electrons (8 each). The Calvin cycle is left with <b>' + eC + '</b>, enough for <b>' + co2 + '</b> mmol CO₂ instead of 50: <b>' + lost + ' mmol less</b>. So ' + n + ' mmol nitrate costs the same reductant as fixing ' + lost + ' mmol CO₂.';
    }
    inp.addEventListener('input', render);

    /* GS/GOGAT highlight buttons */
    var seg = q('.ntl-gs-seg'), gsSvg = q('.ntl-gs svg'), gsSay = q('.ntl-gs-say');
    var ROLE = {
      acc: 'Both cycles start from an <b>acceptor</b> they rebuild themselves: RuBP in the Calvin cycle, glutamate in GS/GOGAT.',
      inp: 'What comes in: <b>CO₂</b> is fixed by Rubisco onto RuBP; <b>ammonium</b> is fixed by glutamine synthetase onto glutamate.',
      nrg: 'Both cycles are paid for by the light reactions: <b>ATP and electrons</b>. Calvin: ATP and NADPH. GS/GOGAT: ATP at glutamine synthetase and 2 electrons at glutamate synthase.',
      out: 'What leaves: only a small share. One triose phosphate out of every six leaves the Calvin cycle; one glutamate out of every two leaves GS/GOGAT. The rest rebuilds the acceptor.'
    };
    function pick(r) {
      Array.prototype.forEach.call(seg.querySelectorAll('button'), function (b) { var on = b.getAttribute('data-r') === r; b.setAttribute('aria-checked', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1; });
      gsSvg.setAttribute('data-hl', r);
      gsSay.innerHTML = ROLE[r];
    }
    seg.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) pick(b.getAttribute('data-r')); });
    seg.addEventListener('keydown', function (e) {
      var bs = Array.prototype.slice.call(seg.querySelectorAll('button')), i = bs.indexOf(document.activeElement), j = -1;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % bs.length; else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + bs.length) % bs.length;
      if (j < 0) return; e.preventDefault(); bs[j].focus(); pick(bs[j].getAttribute('data-r'));
    });
    pick('acc');

    var offP = null;
    if (WP.ui && WP.ui.onPrefs) offP = WP.ui.onPrefs(function () { render(); });
    render();
    return { el: root, destroy: function () { if (typeof offP === 'function') offP(); if (root.parentNode) root.parentNode.removeChild(root); } };
  }

  /* ------------------------------------------------------------ drawing helpers */
  function el(tag, a, p) { var e = document.createElementNS(SVGNS, tag); for (var k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; }
  function tx(p, x, y, s, cls, anchor) { var t = el('text', { x: x, y: y, 'class': cls || '', 'text-anchor': anchor || 'middle' }, p); t.textContent = s; return t; }
  function setTxt(svg, cls, s) { var t = svg.querySelector('.' + cls); if (t) t.textContent = s; }
  function plate(p, x, y, w, h, cls) { return el('rect', { x: x, y: y, width: w, height: h, rx: 3, 'class': cls || 'ntl-plate' }, p); }

  /* 50 slots, 10 x 5, each dot 4 electrons */
  function dotGrid(svg, kind) {
    var g = el('g', { 'class': 'ntl-dots ntl-dots-' + kind, 'aria-hidden': 'true' }, svg);
    for (var i = 0; i < 50; i++) {
      var cx = 40 + (i % 10) * 26, cy = 222 + Math.floor(i / 10) * 14;
      el('circle', { cx: cx, cy: cy, r: 5, 'class': 'ntl-dot' }, g);
    }
    return g;
  }
  function fillDots(svg, n, kind) {
    var ds = svg.querySelectorAll('.ntl-dot');
    for (var i = 0; i < ds.length; i++) ds[i].setAttribute('class', 'ntl-dot' + (i < Math.round(n) ? ' on ntl-' + kind : ''));
  }

  function drawCalvinStatic(svg) {
    tx(svg, 170, 22, 'Calvin cycle', 'ntl-h');
    tx(svg, 170, 40, 'in the chloroplast stroma', 'ntl-s');
    /* the cycle */
    el('circle', { cx: 170, cy: 118, r: 56, 'class': 'ntl-ring ntl-ring-c' }, svg);
    el('path', { d: 'M226 112 l6 10 l-12 0 z', 'class': 'ntl-head ntl-headc' }, svg);
    plate(svg, 128, 52, 84, 22, 'ntl-plate'); tx(svg, 170, 67, 'RuBP', 'ntl-t');
    plate(svg, 198, 156, 108, 22, 'ntl-plate'); tx(svg, 252, 171, '3-PGA to sugar', 'ntl-t');
    plate(svg, 22, 156, 90, 22, 'ntl-plate'); tx(svg, 67, 171, 'triose P', 'ntl-t');
    plate(svg, 18, 86, 54, 22, 'ntl-plate ntl-in'); tx(svg, 45, 101, 'CO₂', 'ntl-t');
    el('path', { d: 'M72 97 L114 104', 'class': 'ntl-arr' }, svg);
    tx(svg, 170, 122, '2 NADPH', 'ntl-t ntl-e');
    tx(svg, 170, 138, 'per CO₂', 'ntl-s');
    tx(svg, 170, 200, '', 'ntl-v ntl-cv');
    tx(svg, 170, 296, '', 'ntl-s ntl-ce');
    dotGrid(svg, 'c');
  }
  function drawNitrateStatic(svg) {
    tx(svg, 170, 22, 'Nitrate assimilation', 'ntl-h');
    el('rect', { x: 8, y: 34, width: 150, height: 136, rx: 6, 'class': 'ntl-cmp' }, svg);
    el('rect', { x: 182, y: 34, width: 150, height: 136, rx: 18, 'class': 'ntl-cmp ntl-cmp-p' }, svg);
    tx(svg, 83, 52, 'cytosol', 'ntl-s');
    tx(svg, 257, 52, 'plastid', 'ntl-s');
    plate(svg, 40, 66, 86, 24, 'ntl-plate ntl-in'); tx(svg, 83, 83, 'NO₃⁻', 'ntl-t');
    el('path', { d: 'M83 92 L83 118', 'class': 'ntl-arr' }, svg);
    tx(svg, 83, 136, 'nitrate reductase', 'ntl-s');
    tx(svg, 83, 154, '+2 e⁻', 'ntl-t ntl-e');
    plate(svg, 214, 66, 86, 24, 'ntl-plate'); tx(svg, 257, 83, 'NO₂⁻', 'ntl-t');
    el('path', { d: 'M126 78 C150 60, 190 60, 212 76', 'class': 'ntl-arr' }, svg);
    el('path', { d: 'M257 92 L257 118', 'class': 'ntl-arr' }, svg);
    tx(svg, 257, 136, 'nitrite reductase', 'ntl-s');
    tx(svg, 257, 154, '+6 e⁻', 'ntl-t ntl-e');
    tx(svg, 170, 192, '', 'ntl-v ntl-nv');
    tx(svg, 170, 296, '', 'ntl-s ntl-ne');
    dotGrid(svg, 'n');
  }
  function drawBar(svg, eC, eN) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var x0 = 6, W = 348, wc = W * eC / BUDGET;
    tx(svg, 6, 12, 'Electrons from the light reactions: 200 mmol', 'ntl-s', 'start');
    el('rect', { x: x0, y: 18, width: Math.max(0, wc), height: 14, 'class': 'ntl-c-f' }, svg);
    el('rect', { x: x0 + wc, y: 18, width: Math.max(0, W - wc), height: 14, 'class': 'ntl-n-f' }, svg);
    el('rect', { x: x0, y: 18, width: W, height: 14, 'class': 'ntl-frame' }, svg);
    tx(svg, 6, 44, 'Calvin ' + eC, 'ntl-s', 'start');
    tx(svg, 354, 44, 'nitrate ' + eN, 'ntl-s', 'end');
  }
  function drawPlot(svg, n) {
    if (!window.WS || !WS.axes) return;
    var ax = WS.axes(svg, { w: 360, h: 190, x: [0, NMAX], y: [0, 50], xlabel: 'nitrate assimilated, mmol', ylabel: 'CO₂ fixed, mmol', xticks: [0, 5, 10, 15, 20], yticks: [0, 10, 20, 30, 40, 50] });
    ax.path([[0, 50], [NMAX, 50 - 2 * NMAX]], 'ws-line');
    ax.vline(n, 'ws-cursor');
    ax.dot(n, 50 - 2 * n);
    var lx = n > 12 ? n - 0.6 : n + 0.6, an = n > 12 ? 'end' : 'start';
    ax.text(lx, 50 - 2 * n + (n > 12 ? -5.5 : 4), (50 - 2 * n) + ' mmol CO₂', an);
    ax.text(NMAX - 0.3, 46, 'slope: 2 CO₂ per nitrate', 'end', 'ws-lab ntl-small');
  }

  function whyHtml() {
    return '<p><b>Counting electrons.</b> In nitrate, nitrogen has the oxidation state +5; in nitrite, +3; in ammonium, −3. So nitrate to nitrite takes 2 electrons and nitrite to ammonium takes 6: 8 per nitrate. In CO₂, carbon is +4; at the level of sugar it is 0: 4 electrons, which is 2 NADPH, per CO₂ ' + B('DERIVED') + '. Hence 10 mmol nitrate (80 mmol electrons) costs the same reductant as fixing 20 mmol CO₂ (80 mmol electrons) ' + B('DERIVED') + '.</p>' +
      '<p><b>Where it happens.</b> Nitrate reductase works in the cytosol and nitrite reductase in the plastid, which in a leaf is the chloroplast ' + B('SECONDARY', 'Textbook placement; the 1969 review is cited for the reactions, not as the only source for the cytosol.') + '. The classic review of the two steps is Beevers and Hageman 1969 (Annu Rev Plant Physiol 20: 495 to 522, doi 10.1146/annurev.pp.20.060169.002431). Noctor and Foyer 1998 (J Exp Bot 49: 1895, <a href="https://doi.org/10.1093/jxb/49.329.1895" target="_blank" rel="noopener">doi 10.1093/jxb/49.329.1895</a>) count nitrate assimilation in the leaf\'s budget of ATP and NADPH during C₃ photosynthesis, and their title also raises the respiratory activity linked to it; so part of the reductant for the cytosolic step may not come straight from the chloroplast.</p>' +
      '<p><b>About the panel.</b> The fixed supply of 200 mmol electrons is a model assumption ' + B('ILLUSTRATIVE') + ', chosen so the trade shows as a straight line. It is not a measured limit for any leaf. The point that survives the simplification: every electron spent on nitrate is one the Calvin cycle cannot use at that moment.</p>' +
      '<p class="nt-refs">Not shown on purpose: how a rise in CO₂ in the air changes nitrate assimilation. No clean source was found for it, so it is left out.</p>';
  }

  /* ------------------------------------------------------------ GS/GOGAT beside the Calvin cycle */
  function cycle(ox, o) {
    /* one cycle, the same geometry twice: acceptor top, enzyme 1 right with the input, the intermediate bottom,
       step 2 left with the energy and the product leaving */
    var cx = ox + 170, cy = 170, r = 74;
    var s = '';
    s += '<g class="gs-cyc">';
    s += '<text x="' + cx + '" y="26" text-anchor="middle" class="ntl-h">' + o.title + '</text>';
    s += '<text x="' + cx + '" y="44" text-anchor="middle" class="ntl-s">' + o.where + '</text>';
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" class="ntl-ring gs-ring"/>';
    /* arrowheads, clockwise */
    s += '<path d="M' + (cx + r) + ' ' + (cy - 8) + ' l7 11 l-14 0 z" class="ntl-head"/>';
    s += '<path d="M' + (cx - r) + ' ' + (cy + 8) + ' l7 -11 l-14 0 z" class="ntl-head"/>';
    /* acceptor */
    s += '<g class="gs-acc"><rect x="' + (cx - 58) + '" y="' + (cy - r - 14) + '" width="116" height="28" rx="4" class="ntl-plate gs-pl"/><text x="' + cx + '" y="' + (cy - r + 5) + '" text-anchor="middle" class="ntl-t">' + o.acc + '</text></g>';
    /* input */
    s += '<g class="gs-inp"><rect x="' + (cx + 70) + '" y="' + (cy - r - 22) + '" width="86" height="26" rx="4" class="ntl-plate gs-pl"/><text x="' + (cx + 113) + '" y="' + (cy - r - 4) + '" text-anchor="middle" class="ntl-t">' + o.inp + '</text>' +
      '<path d="M' + (cx + 108) + ' ' + (cy - r + 6) + ' Q' + (cx + 96) + ' ' + (cy - 40) + ' ' + (cx + r + 4) + ' ' + (cy - 28) + '" class="ntl-arr"/></g>';
    /* enzyme 1 */
    s += '<g class="gs-enz"><rect x="' + (cx + r - 30) + '" y="' + (cy - 2) + '" width="' + o.e1w + '" height="24" rx="12" class="ntl-plate gs-enzp"/><text x="' + (cx + r - 30 + o.e1w / 2) + '" y="' + (cy + 15) + '" text-anchor="middle" class="ntl-t">' + o.e1 + '</text></g>';
    s += '<g class="gs-nrg"><rect x="' + (cx + r - 26) + '" y="' + (cy + 28) + '" width="' + (o.n1w) + '" height="22" rx="4" class="ntl-plate gs-pl"/><text x="' + (cx + r - 26 + o.n1w / 2) + '" y="' + (cy + 43) + '" text-anchor="middle" class="ntl-s">' + o.n1 + '</text></g>';
    /* intermediate */
    s += '<g><rect x="' + (cx - 62) + '" y="' + (cy + r - 14) + '" width="124" height="28" rx="4" class="ntl-plate"/><text x="' + cx + '" y="' + (cy + r + 5) + '" text-anchor="middle" class="ntl-t">' + o.mid + '</text></g>';
    /* step 2 */
    s += '<g class="gs-enz"><rect x="' + (cx - r - o.e2w + 30) + '" y="' + (cy - 22) + '" width="' + o.e2w + '" height="24" rx="12" class="ntl-plate gs-enzp"/><text x="' + (cx - r - o.e2w / 2 + 30) + '" y="' + (cy - 5) + '" text-anchor="middle" class="ntl-t">' + o.e2 + '</text></g>';
    s += '<g class="gs-nrg"><rect x="' + (cx - r - o.n2w + 26) + '" y="' + (cy - 52) + '" width="' + o.n2w + '" height="22" rx="4" class="ntl-plate gs-pl"/><text x="' + (cx - r - o.n2w / 2 + 26) + '" y="' + (cy - 37) + '" text-anchor="middle" class="ntl-s">' + o.n2 + '</text></g>';
    /* product out */
    s += '<g class="gs-out"><path d="M' + (cx - 50) + ' ' + (cy + 58) + ' Q' + (cx - 110) + ' ' + (cy + 90) + ' ' + (cx - 120) + ' ' + (cy + 112) + '" class="ntl-arr"/>' +
      '<rect x="' + (cx - 168) + '" y="' + (cy + 114) + '" width="' + o.outw + '" height="40" rx="4" class="ntl-plate gs-pl"/><text x="' + (cx - 168 + o.outw / 2) + '" y="' + (cy + 131) + '" text-anchor="middle" class="ntl-t">' + o.out1 + '</text><text x="' + (cx - 168 + o.outw / 2) + '" y="' + (cy + 147) + '" text-anchor="middle" class="ntl-s">' + o.out2 + '</text></g>';
    s += '<text x="' + cx + '" y="' + (cy - r + 32) + '" text-anchor="middle" class="ntl-s gs-mid">' + o.core + '</text>';
    s += '</g>';
    return s;
  }
  function gsHtml(id) {
    var svg = '<svg viewBox="0 0 680 350" role="img" aria-labelledby="' + id + '-gst"><title id="' + id + '-gst">The Calvin cycle and the GS/GOGAT cycle drawn with the same layout: each fixes something onto an acceptor, spends ATP and electrons, lets a small share out as product and rebuilds the acceptor.</title>' +
      '<defs><marker id="ntl-ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" class="ntl-ahp"/></marker></defs>' +
      cycle(0, { title: 'Calvin cycle (carbon)', where: 'chloroplast', acc: 'RuBP', inp: 'CO₂ in', e1: 'Rubisco', e1w: 76, n1: 'ATP + NADPH', n1w: 98, mid: '3-PGA to triose P', e2: 'rebuild RuBP', e2w: 104, n2: 'ATP', n2w: 44, out1: '1 in 6 triose P', out2: 'out as sugar', outw: 112, core: 'the acceptor' }) +
      '<line x1="340" y1="56" x2="340" y2="330" class="gs-div"/>' +
      cycle(340, { title: 'GS/GOGAT (nitrogen)', where: 'chloroplast in a leaf', acc: 'glutamate', inp: 'NH₄⁺ in', e1: 'GS', e1w: 44, n1: 'ATP', n1w: 44, mid: 'glutamine', e2: 'GOGAT', e2w: 70, n2: '+ 2-oxoglutarate, 2 e⁻', n2w: 146, out1: '1 in 2 glutamate', out2: 'out to amino acids', outw: 120, core: 'the acceptor' }) +
      '</svg>';
    return '<section class="ntl-gs" aria-labelledby="' + id + '-gsh">' +
      '<h3 class="ws-title" id="' + id + '-gsh">Then ammonium is fixed: the same design, twice</h3>' +
      '<p><b>What this is.</b> The ammonium made above is fixed onto an amino acid by two enzymes working as a cycle: <b>glutamine synthetase</b> (GS) and <b>glutamate synthase</b> (GOGAT). Drawn next to the Calvin cycle, the two look alike: each rebuilds its own acceptor. <b>What to do.</b> Press the buttons to light up the same part in both cycles.</p>' +
      '<div class="ws-c ws-choice"><span class="ws-c-l" id="' + id + '-gsl">Show in both cycles</span><div class="ws-seg ntl-gs-seg" role="radiogroup" aria-labelledby="' + id + '-gsl">' +
        '<button type="button" role="radio" data-r="acc" aria-checked="true">the acceptor</button>' +
        '<button type="button" role="radio" data-r="inp" aria-checked="false" tabindex="-1">what comes in</button>' +
        '<button type="button" role="radio" data-r="nrg" aria-checked="false" tabindex="-1">the energy</button>' +
        '<button type="button" role="radio" data-r="out" aria-checked="false" tabindex="-1">what leaves</button>' +
      '</div></div>' +
      '<figure class="ws-pane ntl-gsfig"><div class="ntl-gsw">' + svg + '</div><figcaption><b>Two cycles, one design.</b> An original drawing. The shares that leave follow from counting atoms ' + B('DERIVED', 'Calvin: 3 RuBP + 3 CO2 give 6 triose P; 5 of them (15 carbons) rebuild 3 RuBP (15 carbons), so 1 in 6 leaves. GS/GOGAT: glutamate + NH4+ gives glutamine; glutamine + 2-oxoglutarate gives 2 glutamate; 1 rebuilds the acceptor, so 1 in 2 leaves.') + '.</figcaption></figure>' +
      '<div class="ws-pane ws-live"><p class="ws-k">What just happened</p><p class="ws-live-t ntl-gs-say" aria-live="polite"></p></div>' +
      '<details class="ws-why"><summary>Why does this happen?</summary><div class="ws-why-b">' +
        '<p>Glutamine synthetase joins ammonium to glutamate, using one ATP, and makes glutamine. Glutamate synthase moves that new amino group onto 2-oxoglutarate, using 2 electrons, and makes two glutamate. One glutamate goes back to accept the next ammonium; the other is the net gain, from which other amino acids are made. Net: ammonium + 2-oxoglutarate + ATP + 2 electrons give one glutamate ' + B('DERIVED', 'Sum of the two reactions as written.') + '.</p>' +
        '<p>The Calvin cycle has the same logic: Rubisco fixes CO₂ onto RuBP, ATP and NADPH reduce the product to triose phosphate, and five of every six triose phosphates are spent rebuilding RuBP. A cycle that remakes its own acceptor can keep running for as long as energy and the input arrive.</p>' +
        '<p>This route for nitrogen assimilation in plants was proposed by Lea and Miflin 1974, Nature 251: 614, <a href="https://doi.org/10.1038/251614a0" target="_blank" rel="noopener">doi 10.1038/251614a0</a> ' + B('SECONDARY', 'Cited as the standard source for GS/GOGAT; its text was not read for this page.') + '.</p>' +
      '</div></details>' +
    '</section>';
  }

  /* ------------------------------------------------------------ styles */
  var css = '\
.ntl{margin-top:26px}\
.ntl .ws-live{grid-area:auto}\
.ntl-ctl .ws-c{min-width:0}\
.ntl-stick{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px;margin-bottom:12px}\
.ntl-bar{display:block;width:100%;height:auto;margin-top:6px}\
.ntl-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr) minmax(0,1fr);gap:12px}\
.ntl-p svg,.ntl-plotp svg{display:block;width:100%;height:auto}\
.ntl-p,.ntl-plotp{display:flex;flex-direction:column;gap:6px}\
.ws .ntl-h{font-size:16px;font-weight:600;fill:var(--ink)}\
.ws .ntl-s{font-size:12px;fill:var(--ink2)}\
.ws .ntl-t{font-size:14px;fill:var(--ink);font-weight:500}\
.ws .ntl-e{font-weight:700}\
.ws .ntl-v{font-size:15px;font-weight:700;fill:var(--ink)}\
.ws .ntl-small{font-size:10.5px;fill:var(--ink2)!important}\
.ntl-plate{fill:var(--wall);stroke:var(--rule);stroke-width:1}\
.ntl-in{stroke-width:2}\
.ntl-cmp{fill:none;stroke:var(--rule);stroke-dasharray:4 3}\
.ntl-cmp-p{stroke:var(--chl);stroke-dasharray:none;stroke-width:1.5}\
.ntl-ring{fill:none;stroke:var(--chl);stroke-width:5;opacity:.75}\
.ntl-head{fill:var(--chl)}\
.ntl-arr{fill:none;stroke:var(--ink2);stroke-width:1.6;marker-end:url(#ntl-ah)}\
.ntl-ahp{fill:var(--ink2)}\
.ntl-dot{fill:none;stroke:var(--rule2);stroke-width:1.2;transition:fill .35s,stroke .35s}\
.ntl-dot.on.ntl-c{fill:var(--chl);stroke:var(--chl)}\
.ntl-dot.on.ntl-n{fill:var(--b-pp);stroke:var(--b-pp)}\
.ntl-c-f{fill:var(--chl)}.ntl-n-f{fill:var(--b-pp)}\
.ntl-frame{fill:none;stroke:var(--ink2);stroke-width:1}\
.ntl-say{font-family:var(--disp);font-size:21px;line-height:1.35;margin:14px 0 4px;padding:10px 14px;border-left:4px solid var(--b-pp);background:var(--wall);max-width:44em}\
.ntl-gs{margin-top:26px}\
.ntl-gs > p{max-width:62em;margin:0 0 8px}\
.ntl-gsfig{margin:10px 0}\
.ntl-gsw{overflow-x:auto}\
.ntl-gsw svg{display:block;width:100%;min-width:560px;height:auto}\
.gs-div{stroke:var(--rule2);stroke-width:1}\
.gs-ring{stroke:var(--leaf3)}\
.gs-enzp{fill:var(--card)}\
.ntl-gs .gs-mid{font-style:italic}\
.ntl-gs svg[data-hl="acc"] .gs-acc rect,.ntl-gs svg[data-hl="inp"] .gs-inp rect,.ntl-gs svg[data-hl="nrg"] .gs-nrg rect,.ntl-gs svg[data-hl="out"] .gs-out rect{fill:var(--plaque);stroke:var(--plaque);stroke-width:3}\
.ntl-gs svg[data-hl="acc"] .gs-acc text,.ntl-gs svg[data-hl="inp"] .gs-inp text,.ntl-gs svg[data-hl="nrg"] .gs-nrg text,.ntl-gs svg[data-hl="out"] .gs-out text{fill:var(--plaque-ink)!important;font-weight:700}\
.ntl-gs svg[data-hl="inp"] .gs-inp path,.ntl-gs svg[data-hl="out"] .gs-out path{stroke:var(--ink);stroke-width:3}\
.ntl-gs .ws-live{margin:0 0 6px}\
@media (prefers-reduced-motion: reduce){.ntl-dot{transition:none}}\
:root[data-motion="reduce"] .ntl-dot{transition:none}\
@media (max-width:899px){.ntl-grid{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.ntl-plotp{grid-column:1 / -1}}\
@media (max-width:699px){\
.ntl-stick{grid-template-columns:minmax(0,1fr);gap:6px;position:sticky;top:var(--ws-top,0);z-index:5;background:var(--paper);padding:4px 0 6px;box-shadow:0 6px 8px -8px rgba(0,0,0,.4)}\
.ntl-stick .ws-pane{padding:6px 8px}\
.ntl-live .ws-live-t{font-size:13px;min-height:0}\
.ntl-grid{grid-template-columns:minmax(0,1fr);gap:8px}\
.ntl-p{padding:4px}\
.ntl-p figcaption{font-size:11.5px}\
.ntl-say{font-size:18px}\
}';
  if (!document.getElementById('ntl-css')) { var st = document.createElement('style'); st.id = 'ntl-css'; st.textContent = css; document.head.appendChild(st); }

  WP.nTissueLedger = { mount: mount };
})();

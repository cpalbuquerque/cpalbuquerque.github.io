/* The Water Path v8: n_field_ph.js (nutrient path, Plate I Field, interactive 4)
   AVAILABILITY IS NOT ABUNDANCE: one pH slider drives a magnified soil pore and three linked plots
   (iron, phosphorus, nitrogen). Clean 2D SVG on purpose: turning a camera would reveal nothing here.
   Loaded by n_field.js with WP.nutrient.load('field_ph'); exposes window.NF_PH.mount(host, state)
   -> {update(state), destroy()}.

   Evidence: the Fe(III) slope of 1000 fold per pH unit is DERIVED from Fe(OH)3 + 3 H+ = Fe3+ + 3 H2O
   (Lindsay 1979; Lindsay and Schwab 1982, no page checked). Every other curve shape and threshold is
   ILLUSTRATIVE (no P versus pH or nitrification versus pH numbers were verified). */
(function () {
  'use strict';
  if (window.NF_PH) return;
  var SVGNS = 'http://www.w3.org/2000/svg';
  var PH0 = 4, PH1 = 9;
  var MINUS = '−';

  function WSb(t, s) { return window.WS ? WS.badge(t, s) : t; }
  function tok(n) { return window.WS ? WS.token(n) : '#888'; }
  function el(tag, a, p) { var e = document.createElementNS(SVGNS, tag); for (var k in a) if (a[k] != null) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; }
  function txt(p, x, y, s, a) { var t = el('text', a || {}, p); t.setAttribute('x', x); t.setAttribute('y', y); t.textContent = s; return t; }
  function fmtPH(v) { return v.toFixed(1); }

  /* ---- the curves */
  function feLog(ph) { return -3 * (ph - PH0); }                                   // DERIVED slope, relative to pH 4
  var NEED = -9;                                                                   // ILLUSTRATIVE: placed by hand
  function aLow(ph) { return 1 / (1 + Math.exp(-(ph - 5.0) / 0.4)); }             // ILLUSTRATIVE: share not held by Fe and Al
  function aHigh(ph) { return 1 / (1 + Math.exp((ph - 8.0) / 0.4)); }             // ILLUSTRATIVE: share not held by Ca
  function pAvail(ph) { return aLow(ph) * aHigh(ph); }
  function nitrif(ph) { return 0.1 + 0.82 / (1 + Math.exp(-(ph - 5.5) / 0.45)); } // ILLUSTRATIVE

  /* ---- a seeded layout of the pore */
  var GRAINS = [[48, 40, 36, 25], [150, 100, 42, 30], [262, 36, 40, 24], [326, 112, 30, 30], [62, 122, 28, 18], [214, 150, 24, 14], [110, 18, 18, 10]];
  var CRYST = [[196, 72], [298, 158]];
  function inGrain(x, y, pad) { for (var i = 0; i < GRAINS.length; i++) { var g = GRAINS[i], dx = (x - g[0]) / (g[2] + pad), dy = (y - g[1]) / (g[3] + pad); if (dx * dx + dy * dy < 1) return true; } return false; }
  var SPOTS = (function () {
    var s = 23, out = [], tries = 0;
    function rnd() { s = (s * 16807) % 2147483647; return s / 2147483647; }
    while (out.length < 40 && tries < 4000) {
      tries++;
      var x = 10 + rnd() * 340, y = 10 + rnd() * 150, ok = !inGrain(x, y, 7);
      for (var i = 0; ok && i < out.length; i++) if (Math.hypot(out[i][0] - x, out[i][1] - y) < 17) ok = false;
      for (i = 0; ok && i < CRYST.length; i++) if (Math.hypot(CRYST[i][0] - x, CRYST[i][1] - y) < 22) ok = false;
      if (ok) out.push([x, y]);
    }
    return out;
  })();
  /* rim spots on the grains for phosphate held by Fe and Al coatings */
  var RIM = (function () {
    var out = [];
    [[0, 0.6], [0, 3.4], [1, 1.2], [1, 4.1], [2, 0.3], [2, 2.6], [3, 3.6], [3, 5.6], [4, 4.4], [1, 5.6]].forEach(function (p) {
      var g = GRAINS[p[0]]; out.push([g[0] + Math.cos(p[1]) * (g[2] + 1), g[1] + Math.sin(p[1]) * (g[3] + 1)]);
    });
    return out;
  })();
  var CSPOT = (function () { var out = []; CRYST.forEach(function (c) { for (var i = 0; i < 5; i++) { var t = i / 5 * Math.PI * 2; out.push([c[0] + Math.cos(t) * 10, c[1] + Math.sin(t) * 10]); } }); return out; })();

  function diamond(p, x, y, r, cls) { return el('path', { d: 'M' + x + ' ' + (y - r) + 'L' + (x + r) + ' ' + y + 'L' + x + ' ' + (y + r) + 'L' + (x - r) + ' ' + y + 'Z', 'class': cls }, p); }
  function tri(p, x, y, r, cls) { return el('path', { d: 'M' + x + ' ' + (y - r) + 'L' + (x + r * 0.95) + ' ' + (y + r * 0.7) + 'L' + (x - r * 0.95) + ' ' + (y + r * 0.7) + 'Z', 'class': cls }, p); }

  function mount(host, st0) {
    var root = document.createElement('section');
    root.className = 'ws nfp';
    root.setAttribute('aria-labelledby', 'nfp-t');
    var IL = function (s) { return WSb('ILLUSTRATIVE', s); };
    var DE = function (s) { return WSb('DERIVED', s); };
    root.innerHTML =
      '<header class="ws-hd">' +
        '<h3 class="ws-title" id="nfp-t">Availability is not abundance: soil pH ' + IL('Curve shapes and the pH thresholds are drawn by hand to show the pattern, not fitted to data. Only the iron slope is derived.') + '</h3>' +
        '<p data-ws-part="what"><b>What this is.</b> A magnified pore between soil grains, and three plots of how much <b>iron</b>, <b>phosphorus</b> and <b>nitrogen</b> is dissolved in the soil water, which is what a root can take up. <b>pH</b> measures how acid the soil is: low is acid, 7 is neutral, high is basic.</p>' +
        '<p data-ws-part="todo"><b>What to do.</b> Move the <b>Soil pH</b> slider from acid to basic. Watch the dissolved dots in the pore and the cursor on all three plots.</p>' +
      '</header>' +
      '<div class="nfp-grid">' +
        '<div class="nfp-stick">' +
          '<div class="ws-pane nfp-ctl" role="group" aria-label="Controls"><div class="ws-c ws-range"><label for="nfp-ph">Soil pH <output for="nfp-ph" id="nfp-out"></output></label>' +
            '<input type="range" id="nfp-ph" min="' + PH0 + '" max="' + PH1 + '" step="0.1"><span class="nfp-ends" aria-hidden="true"><span>acid</span><span class="nfp-mid">neutral, 7</span><span>basic</span></span></div></div>' +
          '<figure class="ws-pane nfp-pore" data-ws-part="thing"><svg viewBox="0 0 360 206" role="img" aria-labelledby="nfp-pore-l"><title id="nfp-pore-l">A magnified soil pore drawn for this page: grains with rust coloured iron coatings, water between them, and dissolved ions shown as shapes</title></svg>' +
            '<figcaption><b>The thing itself.</b> A soil pore drawn for this page, not an image. Grains have rust coloured <b>iron oxide</b> coatings. Shapes in the water are <b>dissolved</b>: circles iron, diamonds phosphate, triangles nitrate. Diamonds stuck on a coating or on a white <b>calcium phosphate</b> crystal are held, not dissolved. Dot counts ' + IL('Counts show direction only; the iron count follows a log scale.') + '</figcaption></figure>' +
          '<div class="ws-pane ws-live" data-ws-part="happened"><p class="ws-k">What just happened</p><p class="ws-live-t" aria-live="polite"></p></div>' +
        '</div>' +
        '<div class="nfp-plots">' +
          '<figure class="ws-pane nfp-fig" id="nfp-fe"><svg role="img" aria-label="Plot: dissolved iron three against pH, log scale"></svg><figcaption><b>Iron.</b> Dissolved Fe³⁺ falls 1000 fold for every pH unit up ' + DE('From Fe(OH)₃ + 3 H⁺ ⇌ Fe³⁺ + 3 H₂O: log Fe³⁺ = log K ' + MINUS + ' 3 pH.') + '. The dashed line is a rough level a root needs, placed by hand ' + IL() + '.</figcaption></figure>' +
          '<figure class="ws-pane nfp-fig" id="nfp-p"><svg role="img" aria-label="Plot: dissolved phosphate share against pH"></svg><figcaption><b>Phosphorus</b> pinches at both ends: held by iron and aluminium in acid soil, by calcium in basic soil ' + IL('Curve shape and the band edges near pH 5.5 and 7.5 are drawn by hand.') + '.</figcaption></figure>' +
          '<figure class="ws-pane nfp-fig" id="nfp-n"><svg role="img" aria-label="Plot: nitrate solubility and nitrification against pH"></svg><figcaption><b>Nitrogen.</b> Nitrate stays dissolved at any pH. What changes is how fast soil microbes make it from ammonium (<b>nitrification</b>): slower in acid soil, but not zero ' + IL('Curve shape drawn by hand, not fitted to data.') + '.</figcaption></figure>' +
        '</div>' +
      '</div>' +
      '<details class="ws-why" data-ws-part="why"><summary>Why does this happen?</summary><div class="ws-why-b">' + why() + '</div></details>';
    host.appendChild(root);

    var inp = root.querySelector('#nfp-ph'), out = root.querySelector('#nfp-out'), live = root.querySelector('.ws-live-t');
    var poreSvg = root.querySelector('.nfp-pore svg');
    var figs = { fe: root.querySelector('#nfp-fe svg'), p: root.querySelector('#nfp-p svg'), n: root.querySelector('#nfp-n svg') };
    var ph = 6.5, dead = false, sayT = 0;
    inp.value = ph;

    /* ---- pore, built once; render toggles what is shown */
    var pore = {};
    (function () {
      var s = poreSvg;
      el('rect', { x: 0, y: 0, width: 360, height: 170, 'class': 'nfp-water', opacity: 0.55 }, s);
      var gG = el('g', {}, s);
      GRAINS.forEach(function (g) { el('ellipse', { cx: g[0], cy: g[1], rx: g[2], ry: g[3], 'class': 'nfp-grain' }, gG); });
      pore.cryst = CRYST.map(function (c) {
        var gc = el('g', { 'class': 'nfp-cry' }, s);
        el('rect', { x: c[0] - 7, y: c[1] - 7, width: 14, height: 14, transform: 'rotate(15 ' + c[0] + ' ' + c[1] + ')', 'class': 'nfp-crystal' }, gc);
        return gc;
      });
      var i;
      pore.fe = []; for (i = 0; i < 14; i++) pore.fe.push(el('circle', { cx: SPOTS[i][0], cy: SPOTS[i][1], r: 4, 'class': 'nfp-fe' }, s));
      pore.pf = []; for (i = 0; i < 10; i++) pore.pf.push(diamond(s, SPOTS[14 + i][0], SPOTS[14 + i][1], 5, 'nfp-pd'));
      pore.pr = []; for (i = 0; i < 10; i++) pore.pr.push(diamond(s, RIM[i % RIM.length][0], RIM[i % RIM.length][1], 4.5, 'nfp-pd nfp-held'));
      pore.pc = []; for (i = 0; i < 10; i++) pore.pc.push(diamond(s, CSPOT[i][0], CSPOT[i][1], 4.5, 'nfp-pd nfp-held'));
      pore.no = []; for (i = 0; i < 10; i++) pore.no.push(tri(s, SPOTS[24 + i][0], SPOTS[24 + i][1], 5, 'nfp-no'));
      /* legend row under the pore */
      var lg = el('g', { 'class': 'nfp-leg' }, s), y = 190;
      el('circle', { cx: 10, cy: y - 4, r: 4, 'class': 'nfp-fe' }, lg); txt(lg, 18, y, 'iron');
      diamond(lg, 62, y - 4, 5, 'nfp-pd'); txt(lg, 70, y, 'phosphate');
      tri(lg, 140, y - 3, 5, 'nfp-no'); txt(lg, 148, y, 'nitrate');
      el('rect', { x: 200, y: y - 9, width: 10, height: 10, 'class': 'nfp-crystal' }, lg); txt(lg, 214, y, 'Ca phosphate');
      el('rect', { x: 292, y: y - 9, width: 10, height: 10, 'class': 'nfp-coat' }, lg); txt(lg, 306, y, 'Fe coat');
    })();

    function show(list, n) { list.forEach(function (e, i) { e.setAttribute('opacity', i < n ? '1' : '0'); }); }

    function axes(svg, yr, ylab, yticks) {
      var o = { w: 360, h: 168, x: [PH0, PH1], y: yr, xticks: [4, 5, 6, 7, 8, 9], yticks: yticks, xlabel: 'soil pH', ylabel: ylab, pad: { l: 50, r: 12, t: 10, b: 36 } };
      return window.WS.axes(svg, o);
    }
    function cursor(ax, x, y) {
      var B = ax.box;
      el('line', { x1: ax.x(x), x2: ax.x(x), y1: B.y0, y2: B.y1, 'class': 'ws-cursor', 'data-ok-overlap': '' }, ax.g);
      el('circle', { cx: ax.x(x), cy: ax.y(y), r: 4.5, 'class': 'ws-dot', 'data-ok-overlap': '' }, ax.g);
    }
    function curve(f, n) { var pts = []; for (var i = 0; i <= (n || 100); i++) { var x = PH0 + (PH1 - PH0) * i / (n || 100); pts.push([x, f(x)]); } return pts; }

    function render() {
      if (dead) return;
      out.textContent = fmtPH(ph) + (ph < 6.5 ? ' acid' : (ph <= 7.5 ? ' near neutral' : ' basic'));
      inp.setAttribute('aria-valuetext', 'pH ' + out.textContent);
      if (document.activeElement !== inp && +inp.value !== ph) inp.value = ph;

      /* pore */
      var L = feLog(ph), nFe = Math.max(0, Math.min(14, Math.round(14 * (1 + L / 9))));
      show(pore.fe, nFe);
      var free = pAvail(ph), held = 1 - free, heldCa = aLow(ph) * (1 - aHigh(ph)), heldFe = 1 - aLow(ph);
      var nf = Math.round(10 * free), nFeAl = Math.round(10 * heldFe), nCa = Math.max(0, 10 - nf - nFeAl);
      show(pore.pf, nf); show(pore.pr, nFeAl); show(pore.pc, nCa);
      pore.cryst.forEach(function (g) { g.setAttribute('opacity', heldCa > 0.12 ? '1' : '0'); });
      show(pore.no, 10);

      /* iron plot */
      var ax = axes(figs.fe, [-15, 0], 'dissolved Fe³⁺, relative', []);
      var axg = figs.fe.querySelector('.ws-ax'), B = ax.box;
      [[0, '1'], [-3, '10' + '⁻³'], [-6, '10⁻⁶'], [-9, '10⁻⁹'], [-12, '10⁻¹²'], [-15, '10⁻¹⁵']].forEach(function (t) {
        el('line', { x1: B.x0, x2: B.x1, y1: ax.y(t[0]), y2: ax.y(t[0]), 'class': 'ws-gridline' }, axg);
        txt(axg, B.x0 - 6, ax.y(t[0]) + 4, t[1], { 'text-anchor': 'end' });
      });
      var need = el('line', { x1: B.x0, x2: B.x1, y1: ax.y(NEED), y2: ax.y(NEED), 'class': 'nfp-need' }, ax.g);
      need.setAttribute('stroke-dasharray', '6 4');
      ax.text(4.08, NEED - 1.6, 'rough need of a root', 'start');
      ax.path(curve(feLog, 10), 'ws-line');
      cursor(ax, ph, L);

      /* phosphorus plot */
      ax = axes(figs.p, [0, 1.05], 'dissolved share', [0, 0.5, 1]);
      B = ax.box;
      el('rect', { x: B.x0, y: B.y1, width: ax.x(5.5) - B.x0, height: B.y0 - B.y1, 'class': 'nfp-band', opacity: 0.5 }, ax.g);
      el('rect', { x: ax.x(7.5), y: B.y1, width: B.x1 - ax.x(7.5), height: B.y0 - B.y1, 'class': 'nfp-band', opacity: 0.5 }, ax.g);
      ax.text(4.08, 0.95, 'held by Fe', 'start'); ax.text(4.08, 0.81, 'and Al', 'start');
      ax.text(8.94, 0.95, 'held by', 'end'); ax.text(8.94, 0.81, 'calcium', 'end');
      ax.path(curve(pAvail), 'ws-line');
      cursor(ax, ph, pAvail(ph));

      /* nitrogen plot */
      ax = axes(figs.n, [0, 1.2], 'relative', [0, 0.5, 1]);
      var nl = ax.path([[PH0, 0.95], [PH1, 0.95]], 'nfp-nitrate');
      ax.text(4.08, 1.04, 'nitrate in solution: dissolved at any pH', 'start');
      var np = ax.path(curve(nitrif), 'ws-line'); np.setAttribute('stroke-dasharray', '7 4');
      ax.text(6.3, 0.52, 'nitrification', 'start'); ax.text(6.3, 0.37, 'by microbes', 'start');
      cursor(ax, ph, nitrif(ph));

      say();
    }

    function say() {
      var fold = 3 * (ph - PH0), s = '<b>pH ' + fmtPH(ph) + '.</b> ';
      if (ph >= 7) s += '<b>Iron:</b> the soil is not short of iron, it is short of <b>soluble</b> iron. The rust coatings are all still there, but dissolved Fe³⁺ is 10<sup>' + MINUS + Math.round(fold) + '</sup> of its level at pH 4, below what a root can use. ';
      else if (ph >= 5.5) s += '<b>Iron:</b> dissolved Fe³⁺ is already 10<sup>' + MINUS + Math.round(fold) + '</sup> of its level at pH 4; above about pH 7 it is too little for a root. ';
      else s += '<b>Iron:</b> acid soil keeps some iron dissolved. ';
      if (ph < 5.5) s += '<b>Phosphate</b> is held on iron and aluminium coatings. ';
      else if (ph <= 7.5) s += '<b>Phosphate</b> is most available in this middle range. ';
      else s += '<b>Phosphate</b> is held as calcium phosphates. ';
      s += ph < 5.5 ? '<b>Nitrate</b> still dissolves, but microbes make it from ammonium more slowly here.' : '<b>Nitrate</b> dissolves at any pH.';
      if (sayT) clearTimeout(sayT);
      sayT = setTimeout(function () { sayT = 0; if (!dead) live.innerHTML = s; }, 120);
    }

    function stickTop() {
      var bar = document.querySelector('.wp-bar'), top = 0;
      if (bar) { var cs = getComputedStyle(bar); if (cs.position === 'sticky' || cs.position === 'fixed') top = bar.offsetHeight; }
      root.style.setProperty('--nfp-top', top + 'px');
    }
    stickTop(); window.addEventListener('resize', stickTop);
    inp.addEventListener('input', function () { ph = Math.max(PH0, Math.min(PH1, +inp.value)); render(); });
    var offPrefs = (window.WP && WP.ui && WP.ui.onPrefs) ? WP.ui.onPrefs(function () { render(); }) : null;
    render();
    return {
      update: function () { /* the pH scene does not depend on the global nutrient */ },
      destroy: function () { dead = true; if (sayT) clearTimeout(sayT); if (typeof offPrefs === 'function') offPrefs(); window.removeEventListener('resize', stickTop); if (root.parentNode) root.parentNode.removeChild(root); }
    };
  }

  function why() {
    var MI = MINUS;
    return '<p>Most soils hold plenty of iron, mostly as iron oxides and hydroxides: the rust colour of many soils. A root can only take up iron that is <b>dissolved</b>. Ferric hydroxide dissolves by using up acid: Fe(OH)₃ + 3 H⁺ ⇌ Fe³⁺ + 3 H₂O. So log Fe³⁺ = log K ' + MI + ' 3 pH, and every pH unit up cuts dissolved Fe³⁺ 1000 fold ' + WSb('DERIVED', 'From the stoichiometry: three H⁺ per Fe³⁺.') + ' (the standard treatment is Lindsay 1979, Chemical Equilibria in Soils, Wiley; and Lindsay and Schwab 1982, J Plant Nutr 5: 821, <a href="https://doi.org/10.1080/01904168209363012" target="_blank" rel="noopener">doi 10.1080/01904168209363012</a>). In a basic soil the iron is all still there, it just does not dissolve.</p>' +
      '<p>Plants answer this in two ways. Most plants pump out protons and reduce Fe(III) to Fe(II) at the root surface before taking it up (<b>Strategy I</b>); grasses release <b>phytosiderophores</b> that grab Fe(III) and take up the whole complex (<b>Strategy II</b>) (Römheld and Marschner 1986, Plant Physiol 80: 175, <a href="https://doi.org/10.1104/pp.80.1.175" target="_blank" rel="noopener">doi 10.1104/pp.80.1.175</a>).</p>' +
      '<p>Phosphate is different: it is held at <b>both</b> ends of the pH range. In acid soil it binds to iron and aluminium; in basic, calcium rich soil it forms calcium phosphates. So the common line that basic soils give low phosphorus is only half the story: acid soils hold it too, and the most is dissolved somewhere in the middle. The curve and the band edges near pH 5.5 and 7.5 are drawn by hand ' + WSb('ILLUSTRATIVE', 'No phosphorus against pH numbers were verified.') + '.</p>' +
      '<p>Nitrate salts dissolve at any pH, so pH does not lock nitrate away. pH acts on the microbes that turn ammonium into nitrate (<b>nitrification</b>), which tends to run slower in acid soil; the curve here is drawn by hand ' + WSb('ILLUSTRATIVE') + '. It does not stop: De Boer and Kowalchuk (2001, Soil Biol Biochem 33: 853, <a href="https://doi.org/10.1016/S0038-0717(00)00247-9" target="_blank" rel="noopener">doi 10.1016/S0038-0717(00)00247-9</a>) review how nitrification still proceeds in acid soils.</p>' +
      '<details class="nf-deep"><summary>Expert depth: what the iron line leaves out</summary>' +
      '<p>The iron plot is Fe³⁺ alone, relative to its value at pH 4, so it needs no value of K. Real soil solutions also hold Fe(III) bound to hydroxide ions and to organic molecules, so total dissolved iron falls less steeply than Fe³⁺ alone and levels off in basic soil. The dashed "need" line is placed by hand so it crosses near pH 7; it is not a measured requirement. Which iron oxide controls K differs between soils, so the absolute level shifts from soil to soil; the slope of 3 does not.</p>' +
      '<p>A band diagram of availability against pH, often drawn in textbooks, is a mnemonic of this same pattern, not a measurement. It is not drawn here.</p>' +
      '</details>';
  }

  var css = '\
.nfp{margin-top:22px}\
.nfp-grid{display:grid;gap:12px;grid-template-columns:minmax(0,1fr) minmax(0,1fr);align-items:start}\
.nfp-stick{display:flex;flex-direction:column;gap:10px;min-width:0}\
.nfp-plots{display:flex;flex-direction:column;gap:10px;min-width:0}\
.nfp-pore svg,.nfp-fig svg{display:block;width:100%;height:auto}\
.nfp-pore figcaption{margin-top:4px}\
.nfp-ends{position:relative;display:flex;justify-content:space-between;font-size:12px;color:var(--ink2)}\
.nfp-mid{position:absolute;left:60%;transform:translateX(-50%);white-space:nowrap}\
.nfp .nfp-water{fill:var(--w5)}\
.nfp .nfp-grain{fill:var(--soil);stroke:#9a5a2a;stroke-width:4}\
.nfp .nfp-coat{fill:#9a5a2a}\
.nfp .nfp-fe{fill:#b04a1c;stroke:var(--ink);stroke-width:1}\
.nfp .nfp-pd{fill:var(--accent);stroke:var(--ink);stroke-width:1}\
.nfp .nfp-held{fill:var(--wall)}\
.nfp .nfp-no{fill:var(--leaf3);stroke:var(--ink);stroke-width:1}\
.nfp .nfp-crystal{fill:#fbfbf6;stroke:var(--ink);stroke-width:1}\
.nfp .nfp-leg text{font-size:12px;fill:var(--ink)}\
.nfp .nfp-need{stroke:var(--ink);stroke-width:1.5}\
.nfp .nfp-band{fill:var(--card2)}\
.nfp .nfp-nitrate{stroke:var(--leaf3);stroke-width:3;fill:none}\
.nfp .nfp-pore circle,.nfp .nfp-pore path,.nfp .nfp-cry{transition:opacity .25s}\
:root[data-motion="reduce"] .nfp .nfp-pore *{transition:none!important}\
@media (prefers-reduced-motion:reduce){:root:not([data-motion="full"]) .nfp .nfp-pore *{transition:none!important}}\
:root[data-theme="dark"] .nfp .nfp-water{fill:#1b3147}\
:root[data-theme="dark"] .nfp .nfp-grain{stroke:#d07a42}\
:root[data-theme="dark"] .nfp .nfp-coat{fill:#d07a42}\
:root[data-theme="dark"] .nfp .nfp-fe{fill:#f08a5d}\
:root[data-theme="dark"] .nfp .nfp-band{fill:var(--card2)}\
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .nfp .nfp-water{fill:#1b3147}:root:not([data-theme="light"]) .nfp .nfp-grain{stroke:#d07a42}:root:not([data-theme="light"]) .nfp .nfp-coat{fill:#d07a42}:root:not([data-theme="light"]) .nfp .nfp-fe{fill:#f08a5d}:root:not([data-theme="light"]) .nfp .nfp-band{fill:var(--card2)}}\
@media (max-width:699px){\
.nfp-grid{display:flex;flex-direction:column}\
.nfp-stick{position:sticky;top:var(--nfp-top,0px);z-index:6;background:var(--paper);padding:4px 0 6px;gap:6px;box-shadow:0 6px 8px -8px rgba(0,0,0,.4)}\
.nfp-stick .ws-pane{padding:6px 8px}\
.nfp-pore figcaption{display:none}\
.nfp-pore svg{max-height:150px}\
.nfp-ctl .ws-c input[type=range]{min-height:36px}\
}';
  var sty = document.createElement('style'); sty.id = 'nfp-css'; sty.textContent = css; document.head.appendChild(sty);

  window.NF_PH = { mount: mount };
})();

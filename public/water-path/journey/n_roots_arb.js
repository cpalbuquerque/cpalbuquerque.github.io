/* The Water Path v8: n_roots_arb.js (team roots helper for Plate II nutrient, loaded by n_plant.js)
   A compact panel under "The reach": an arbuscule close up. One root cortex cell cut open; a fungal hypha
   grows through the cell wall and branches into an arbuscule, but stays OUTSIDE the cytoplasm, wrapped by the
   plant's own periarbuscular membrane. The plant phosphate transporter (MtPT4 in Medicago truncatula) sits on
   that membrane. Exchange: phosphate, zinc and copper to the plant; sugars and fatty acids to the fungus.
   Inline SVG drawn here (original geometry, not to scale). Parts are clickable (SVG and a button legend).
   window.NR_ARB.mount(host) -> {destroy}. */
(function () {
  'use strict';
  if (window.NR_ARB) return;
  var WP = window.WP || {}, ui = WP.ui || {};
  var SVGNS = 'http://www.w3.org/2000/svg';
  function badge(t, s) { return window.WS ? window.WS.badge(t, s) : '[' + t + ']'; }
  function reduced() { return ui.reducedMotion ? ui.reducedMotion() : !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); }
  function el(tag, a, p) { var e = document.createElementNS(SVGNS, tag); for (var k in a) if (a[k] != null) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; }

  /* ------------------------------------------------------------ sources (all checked; see the report) */
  var HAR = 'Harrison, Dewbre and Liu 2002, Plant Cell 14: 2413 to 2429.';
  var JAV = 'Javot, Penmetsa, Terzaghi, Cook and Harrison 2007, PNAS 104: 1720 to 1725.';
  var LIP = 'Jiang et al. 2017, Science 356: 1172; Luginbuehl et al. 2017, Science 356: 1175; Keymer et al. 2017, eLife 6: e29107.';
  var MD = 'Marschner and Dell 1994, Plant and Soil 159: 89 to 102, a review: hyphae of arbuscular mycorrhizas were shown to take up and deliver Zn and Cu.';
  function link(doi) { return '<a href="https://doi.org/' + doi + '" target="_blank" rel="noopener">doi ' + doi + '</a>'; }

  /* ------------------------------------------------------------ geometry (viewBox 640 x 380, not to scale) */
  var CELL = { x: 118, y: 34, w: 452, h: 312, wall: 12 };
  var ENTRY = [CELL.x + CELL.wall, 196];
  var SEGS = (function () {
    var out = [];
    function grow(p, a, l, d, parent) {
      var q = [p[0] + Math.cos(a) * l, p[1] + Math.sin(a) * l];
      out.push({ a: p, b: q, d: d, parent: parent });
      var me = out.length - 1;
      if (d >= 4) return;
      var sp = d === 0 ? 0.62 : 0.5 + 0.06 * d;
      grow(q, a - sp, l * 0.72, d + 1, me); grow(q, a + sp, l * 0.72, d + 1, me);
      if (d === 1) grow(q, a, l * 0.6, d + 1, me);
    }
    grow(ENTRY, 0, 92, 0, -1);
    return out;
  })();
  var WF = [7, 6, 5, 4, 3];                 // fungal branch width by depth
  function wSpace(d) { return WF[d] + 3.4; }
  function wPam(d) { return WF[d] + 6.4; }

  var PARTS = {
    wall: { name: 'Plant cell wall', txt: 'The wall around the plant cell. The hypha grows through it, so the fungus ends up inside the wall but still outside the living cell. Drawn in tan.' },
    pm: { name: 'Plant plasma membrane', txt: 'The plant cell’s own outer membrane, just inside the wall (green line). Where the fungus enters, this membrane folds inward and wraps every branch, so the fungus never touches the cytoplasm.' },
    pam: { name: 'Periarbuscular membrane', txt: 'The part of the plant’s membrane that wraps the arbuscule. The plant puts its own transporters here, such as MtPT4 in Medicago truncatula (a small lab plant related to clover), to take up the phosphate the fungus releases ' + '(Harrison et al. 2002).' },
    space: { name: 'Periarbuscular space', txt: 'The thin gap between the fungal branch and the plant membrane that wraps it (the thin band between blue and green). Whatever is traded crosses this gap: nutrients toward the plant, carbon toward the fungus.' },
    hypha: { name: 'Fungal hypha', txt: 'A thread of the arbuscular mycorrhizal fungus (blue). Outside the root it runs through the soil and between root cells, collecting phosphate far beyond the root’s own depletion shell.' },
    arb: { name: 'Arbuscule', txt: 'The “little tree” the hypha builds inside one root cortex cell by branching again and again. All those fine branches give a large surface where the plant and the fungus trade.' },
    pt4: { name: 'MtPT4, a plant phosphate transporter', txt: 'A phosphate transporter of Medicago truncatula (a small lab plant related to clover) that sits with the arbuscules, consistent with a place on the periarbuscular membrane (Harrison et al. 2002). Without it, phosphate from the fungus is not taken up and arbuscules die early (Javot et al. 2007).' },
    cyto: { name: 'Plant cytoplasm', txt: 'The living inside of the plant cell. Phosphate taken up through the wrapping membrane arrives here. Sugars and fatty acids made by the plant leave from here toward the fungus.' },
    vac: { name: 'Vacuole', txt: 'The plant cell’s large water store. It is drawn small here so the arbuscule fits; the drawing is not to scale.' }
  };
  var ORDER = ['hypha', 'wall', 'pm', 'pam', 'space', 'arb', 'pt4', 'cyto', 'vac'];
  var CARGO = {
    p: { name: 'phosphate', dir: 1, fill: 'var(--cut)', shape: 'c' },
    zc: { name: 'zinc and copper', dir: 1, fill: 'var(--ink2)', shape: 'd' },
    s: { name: 'sugars', dir: -1, fill: 'var(--chl)', shape: 's' },
    fa: { name: 'fatty acids', dir: -1, fill: 'var(--warm)', shape: 't' }
  };

  var CSS = '\
.nra{font-family:var(--ui);font-size:14px;line-height:1.45;color:var(--ink);margin:4px 0 20px;border:1px solid var(--rule2);border-radius:4px;background:var(--wall);padding:10px 12px}\
.nra h4{font-family:var(--disp);font-weight:400;font-size:21px;letter-spacing:.02em;margin:0 0 4px}\
.nra p{margin:0 0 4px;max-width:62em}\
.nra-grid{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(0,1fr);gap:10px;align-items:start;margin:6px 0}\
@media (max-width:699px){.nra-grid{grid-template-columns:1fr}.nra-svg .nra-lab{display:none}}\
.nra-svg{display:block;width:100%;height:auto;background:var(--card2);border-radius:3px}\
.nra-svg [data-part]{cursor:pointer}\
.nra-svg .nra-sel{filter:drop-shadow(0 0 3px var(--accent))}\
.nra-svg text{font-family:var(--ui)!important;font-size:13px;fill:var(--ink)}\
.nra-svg .nra-ll{stroke:var(--ink2);stroke-width:1}\
.nra-keys{display:flex;flex-wrap:wrap;gap:4px}\
.nra-keys .ws-btn{font-size:12.5px;padding:4px 8px;text-align:left}\
.nra-keys .ws-btn[aria-pressed="true"]{background:var(--plaque);color:var(--plaque-ink)}\
.nra-info{border-left:3px solid var(--accent);background:var(--card);padding:6px 9px;margin:6px 0;font-size:13.5px;min-height:5.5em}\
.nra-info b{display:block}\
.nra-ctl{display:flex;flex-wrap:wrap;gap:8px 16px;align-items:flex-end;margin:6px 0}\
.nra-ctl .nra-l{display:block;font-weight:600;font-size:13px}\
.nra-leg{display:flex;flex-wrap:wrap;gap:4px 14px;font-size:13px;margin:4px 0}\
.nra-leg span{display:inline-flex;align-items:center;gap:5px}\
.nra-leg svg{width:14px;height:14px}\
.nra-live{border-top:1px solid var(--rule2);padding-top:6px;min-height:3em}\
.nra a{color:var(--accent)}';

  function shapeSVG(k, sz) {
    var c = CARGO[k], h = sz / 2, f = c.fill, st = 'stroke="var(--ink)" stroke-width="0.8"';
    if (c.shape === 'c') return '<circle cx="' + h + '" cy="' + h + '" r="' + (h - 1.5) + '" fill="' + f + '" ' + st + '/>';
    if (c.shape === 's') return '<rect x="2" y="2" width="' + (sz - 4) + '" height="' + (sz - 4) + '" fill="' + f + '" ' + st + '/>';
    if (c.shape === 'd') return '<path d="M' + h + ' 1 L' + (sz - 1) + ' ' + h + ' L' + h + ' ' + (sz - 1) + ' L1 ' + h + 'Z" fill="' + f + '" ' + st + '/>';
    return '<path d="M' + h + ' 1.5 L' + (sz - 1.5) + ' ' + (sz - 2) + ' L1.5 ' + (sz - 2) + 'Z" fill="' + f + '" ' + st + '/>';
  }

  function mount(host) {
    if (!document.getElementById('nra-css')) { var sty = document.createElement('style'); sty.id = 'nra-css'; sty.textContent = CSS; document.head.appendChild(sty); }
    var root = document.createElement('section');
    root.className = 'nra'; root.setAttribute('aria-labelledby', 'nra-h');
    root.innerHTML =
      '<h4 id="nra-h">Inside one root cell: the arbuscule ' + badge('ILLUSTRATIVE', 'A schematic drawing, not to scale, not a microscope image. The layout is invented; the parts and what crosses where follow the papers in the Why fold.') + '</h4>' +
      '<p><b>What this is.</b> Many plant roots partner with a soil fungus (an arbuscular mycorrhizal fungus). This is one cell of the root cortex (the layer under the root skin), cut open. The fungus grows <b>through the cell wall</b> and branches into an <b>arbuscule</b>, a tiny tree. It does not break into the cell: the plant’s own membrane folds around every branch, so the fungus stays <b>outside the cytoplasm</b>. The trade happens across that wrapping membrane.</p>' +
      '<p><b>What to do.</b> Click a part of the drawing, or a name under it, to read what it is. Use <b>Follow</b> to pick one cargo. Then set <b>MtPT4</b> to <b>missing</b>.</p>' +
      '<div class="nra-grid"><div><svg class="nra-svg" viewBox="0 0 640 380" role="img" aria-labelledby="nra-svgt"><title id="nra-svgt">A root cortex cell with an arbuscule inside, wrapped by the plant membrane. Phosphate, zinc and copper move to the plant; sugars and fatty acids move to the fungus.</title></svg>' +
        '<div class="nra-leg" aria-label="Cargo key">' +
          ['p', 'zc', 's', 'fa'].map(function (k) { return '<span><svg viewBox="0 0 14 14" aria-hidden="true">' + shapeSVG(k, 14) + '</svg>' + CARGO[k].name + (CARGO[k].dir > 0 ? ' → plant' : ' → fungus') + '</span>'; }).join('') +
        '</div></div>' +
        '<div><p class="nra-l" style="font-weight:600;font-size:13px;margin:0 0 3px">Parts (click one)</p><div class="nra-keys"></div><div class="nra-info" aria-live="polite"></div></div></div>' +
      '<div class="nra-ctl">' +
        '<button type="button" class="ws-btn nra-play" aria-pressed="false">Play</button>' +
        seg('follow', 'Follow', [['all', 'all'], ['p', 'phosphate'], ['zc', 'zinc, copper'], ['s', 'sugars'], ['fa', 'fatty acids']]) +
        seg('pt4', 'MtPT4', [['on', 'working'], ['off', 'missing (mutant)']]) +
      '</div>' +
      '<p class="nra-live" aria-live="polite"></p>' +
      '<details class="ws-why"><summary>Why does this happen?</summary><div>' + whyHTML() + '</div></details>';
    host.appendChild(root);
    function seg(key, label, opts) {
      return '<div><span class="nra-l" id="nra-' + key + '-l">' + label + '</span><div class="ws-seg" role="radiogroup" aria-labelledby="nra-' + key + '-l" data-key="' + key + '">' +
        opts.map(function (o, i) { return '<button type="button" role="radio" data-v="' + o[0] + '" aria-checked="' + (i === 0) + '">' + o[1] + '</button>'; }).join('') + '</div></div>';
    }

    var svg = root.querySelector('svg.nra-svg'), info = root.querySelector('.nra-info'), live = root.querySelector('.nra-live'), keys = root.querySelector('.nra-keys');
    var S = { follow: 'all', pt4: 'on', part: null, playing: !reduced() }, raf = 0, last = 0, visible = true, offs = [], T = 0;

    /* ---- the drawing */
    var gAll = el('g', {}, svg);
    /* neighbouring cells, cut at the edges */
    el('rect', { x: -20, y: 34, width: 106, height: 312, rx: 14, fill: 'var(--cyto)', stroke: 'var(--apo)', 'stroke-width': 12, opacity: 0.55 }, gAll);
    el('rect', { x: 590, y: 34, width: 80, height: 312, rx: 14, fill: 'var(--cyto)', stroke: 'var(--apo)', 'stroke-width': 12, opacity: 0.55 }, gAll);
    var gWall = el('g', { 'data-part': 'wall' }, gAll);
    el('rect', { x: CELL.x - CELL.wall / 2, y: CELL.y - CELL.wall / 2, width: CELL.w + CELL.wall, height: CELL.h + CELL.wall, rx: 18, fill: 'none', stroke: 'var(--apo)', 'stroke-width': CELL.wall }, gWall);
    var gCyto = el('g', { 'data-part': 'cyto' }, gAll);
    el('rect', { x: CELL.x + CELL.wall / 2, y: CELL.y + CELL.wall / 2, width: CELL.w - CELL.wall, height: CELL.h - CELL.wall, rx: 12, fill: 'var(--cyto)' }, gCyto);
    var gVac = el('g', { 'data-part': 'vac' }, gAll);
    el('path', { d: 'M470 70 C520 62 552 80 552 120 C552 170 528 196 492 190 C456 184 440 150 446 116 C450 90 456 74 470 70Z', fill: 'var(--vac)', stroke: 'var(--ink2)', 'stroke-width': 1.2 }, gVac);
    var gPm = el('g', { 'data-part': 'pm' }, gAll);
    el('rect', { x: CELL.x + CELL.wall / 2 + 1.5, y: CELL.y + CELL.wall / 2 + 1.5, width: CELL.w - CELL.wall - 3, height: CELL.h - CELL.wall - 3, rx: 11, fill: 'none', stroke: 'var(--pm)', 'stroke-width': 2.6 }, gPm);
    /* hypha outside: from the left edge along the space between cells, then into the wall */
    var gHy = el('g', { 'data-part': 'hypha' }, gAll);
    /* it runs in the gaps between cells (below them, then up between the two walls), never through a neighbour */
    var hyD = 'M0 366 L84 366 Q99 366 99 351 L99 210 Q99 196 112 196 L' + (CELL.x + CELL.wall + 1) + ' 196';
    el('path', { d: hyD, fill: 'none', stroke: 'var(--cool)', 'stroke-width': 7, 'stroke-linecap': 'round' }, gHy);
    /* arbuscule: three passes so the plant membrane wraps every branch */
    function pass(part, wfn, col) {
      var g = el('g', { 'data-part': part }, gAll);
      SEGS.forEach(function (s) { el('line', { x1: s.a[0], y1: s.a[1], x2: s.b[0], y2: s.b[1], stroke: col, 'stroke-width': wfn(s.d), 'stroke-linecap': 'round' }, g); });
      return g;
    }
    var gPam = pass('pam', wPam, 'var(--pm)');
    var gSpace = pass('space', wSpace, 'var(--paper)');
    var gArb = pass('arb', function (d) { return WF[d]; }, 'var(--cool)');
    /* MtPT4 on the outer face of the wrapping membrane */
    var gPt = el('g', { 'data-part': 'pt4' }, gAll), PT = [];
    SEGS.forEach(function (s, i) {
      if (s.d < 1) return;
      var dx = s.b[0] - s.a[0], dy = s.b[1] - s.a[1], L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L, ang = Math.atan2(dy, dx) * 180 / Math.PI;
      [0.35, 0.75].forEach(function (f, j) {
        var side = (i + j) % 2 ? 1 : -1, r = wPam(s.d) / 2 - 0.6, x = s.a[0] + dx * f + nx * r * side, y = s.a[1] + dy * f + ny * r * side;
        PT.push(el('rect', { x: -3.4, y: -2.2, width: 6.8, height: 4.4, rx: 1.4, fill: 'var(--ink)', transform: 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') rotate(' + ang.toFixed(0) + ')' }, gPt));
      });
    });
    /* labels with leader lines (hidden on phones; the buttons carry the names there) */
    var gLab = el('g', { 'class': 'nra-lab', 'aria-hidden': 'true' }, svg);
    function lab(part, txt, x, y, tx, ty, anchor) {
      el('line', { x1: x, y1: y, x2: tx, y2: ty, 'class': 'nra-ll' }, gLab);
      var t = el('text', { x: tx + (anchor === 'end' ? -3 : 3), y: ty + 4, 'text-anchor': anchor || 'start', 'data-part': part }, gLab); t.textContent = txt;
      var bb = null; return t;
    }
    var deep = SEGS.filter(function (s) { return s.d === 4; });
    var top = deep.reduce(function (m, s) { return s.b[1] < m.b[1] ? s : m; }, deep[0]);
    lab('hypha', 'hypha, between cells', 99, 300, 140, 370, 'start');
    lab('wall', 'cell wall', CELL.x + 120, CELL.y - 6, CELL.x + 120, 14, 'start');
    lab('pm', 'plant membrane', CELL.x + 260, CELL.y + 8, CELL.x + 230, 14, 'start');
    lab('arb', 'arbuscule (fungus)', top.b[0], top.b[1] - 4, top.b[0] + 30, 62, 'start');
    var s2 = SEGS[1];
    lab('pam', 'wrapping membrane', (s2.a[0] + s2.b[0]) / 2, (s2.a[1] + s2.b[1]) / 2 - 6, 200, 86, 'end');
    lab('pt4', 'MtPT4', PT[4] ? +PT[4].getAttribute('transform').match(/translate\(([\d.]+)/)[1] : 300, PT[4] ? +PT[4].getAttribute('transform').match(/translate\([\d.]+ ([\d.]+)/)[1] : 200, 452, 300, 'start');
    lab('vac', 'vacuole', 520, 182, 548, 226, 'start');
    lab('cyto', 'cytoplasm', 150, 318, 150, 318, 'start');

    /* cargo particles */
    var gCar = el('g', { 'aria-hidden': 'true' }, svg), PARTS2 = [];
    (function () {
      var ks = ['p', 'zc', 's', 'fa'], s = 3;
      function r() { s = (s * 16807) % 2147483647; return s / 2147483647; }
      SEGS.forEach(function (sg, i) {
        if (sg.d < 1) return;
        for (var n = 0; n < 2; n++) {
          var k = ks[(i * 2 + n) % 4], c = CARGO[k], node;
          if (c.shape === 'c') node = el('circle', { r: 2.8, fill: c.fill, stroke: 'var(--ink)', 'stroke-width': 0.6 }, gCar);
          else if (c.shape === 's') node = el('rect', { x: -2.6, y: -2.6, width: 5.2, height: 5.2, fill: c.fill, stroke: 'var(--ink)', 'stroke-width': 0.6 }, gCar);
          else if (c.shape === 'd') node = el('path', { d: 'M0 -3.4 L3.4 0 L0 3.4 L-3.4 0Z', fill: c.fill, stroke: 'var(--ink)', 'stroke-width': 0.6 }, gCar);
          else node = el('path', { d: 'M0 -3.4 L3.2 2.6 L-3.2 2.6Z', fill: c.fill, stroke: 'var(--ink)', 'stroke-width': 0.6 }, gCar);
          PARTS2.push({ k: k, seg: sg, f: 0.2 + 0.6 * r(), side: r() < 0.5 ? -1 : 1, ph: r(), sp: 0.28 + 0.2 * r(), node: node });
        }
      });
    })();
    function placeCargo() {
      PARTS2.forEach(function (p) {
        var s = p.seg, dx = s.b[0] - s.a[0], dy = s.b[1] - s.a[1], L = Math.hypot(dx, dy), nx = -dy / L * p.side, ny = dx / L * p.side;
        var u = (p.ph + T * p.sp) % 1, inner = 0, outer = wPam(s.d) / 2 + 14, dist;
        var c = CARGO[p.k];
        if (c.dir > 0) {
          dist = inner + (outer - inner) * u;
          if (p.k === 'p' && S.pt4 === 'off') dist = Math.min(dist, wSpace(s.d) / 2 - 1.2);     // stuck in the gap
        } else dist = outer - (outer - inner) * u;
        var x = s.a[0] + dx * p.f + nx * dist, y = s.a[1] + dy * p.f + ny * dist;
        p.node.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')');
        var on = S.follow === 'all' || S.follow === p.k;
        p.node.setAttribute('opacity', on ? 1 : 0.12);
      });
    }

    /* ---- parts: legend buttons, clicks on the drawing */
    keys.innerHTML = ORDER.map(function (k) { return '<button type="button" class="ws-btn" data-k="' + k + '" aria-pressed="false">' + PARTS[k].name + '</button>'; }).join('');
    function choose(k) {
      S.part = S.part === k ? null : k;
      Array.prototype.forEach.call(keys.querySelectorAll('button'), function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-k') === S.part ? 'true' : 'false'); });
      Array.prototype.forEach.call(svg.querySelectorAll('g[data-part]'), function (g) { g.classList.toggle('nra-sel', g.getAttribute('data-part') === S.part); });
      info.innerHTML = S.part ? '<b>' + PARTS[S.part].name + '</b>' + PARTS[S.part].txt : '<b>Pick a part</b>Click the drawing or a name above. The fungus is blue, the plant membrane green, with a thin gap between them.';
      render();
    }
    keys.addEventListener('click', function (e) { var b = e.target.closest('button[data-k]'); if (b) choose(b.getAttribute('data-k')); });
    svg.addEventListener('click', function (e) { var g = e.target.closest('[data-part]'); if (g) choose(g.getAttribute('data-part')); });
    Array.prototype.forEach.call(root.querySelectorAll('.ws-seg'), function (sg) {
      var key = sg.getAttribute('data-key'), bs = sg.querySelectorAll('button');
      Array.prototype.forEach.call(bs, function (b, i) {
        b.addEventListener('click', function () {
          S[key] = b.getAttribute('data-v');
          Array.prototype.forEach.call(bs, function (x) { x.setAttribute('aria-checked', x === b ? 'true' : 'false'); });
          render();
        });
        b.addEventListener('keydown', function (e) {
          var d = e.key === 'ArrowRight' ? 1 : (e.key === 'ArrowLeft' ? -1 : 0); if (!d) return;
          var o = bs[(i + d + bs.length) % bs.length]; o.focus(); o.click(); e.preventDefault();
        });
      });
    });
    var btnPlay = root.querySelector('.nra-play');
    function syncPlay() { btnPlay.textContent = S.playing ? 'Pause' : 'Play'; btnPlay.setAttribute('aria-pressed', S.playing ? 'true' : 'false'); }
    btnPlay.addEventListener('click', function () { S.playing = !S.playing; syncPlay(); last = 0; if (S.playing && !raf) raf = requestAnimationFrame(loop); });
    /* v19: a still click on empty drawing freezes or plays (freeze.js); a click on a labelled part opens its note and
       freezes the motion, as on the WS workstations */
    var onPart = false;
    svg.addEventListener('pointerdown', function (e) { onPart = !!(e.target.closest && e.target.closest('[data-part]')); }, true);
    if (window.WPFreeze) WPFreeze.attach(svg, { paused: function () { return !S.playing; }, button: btnPlay, label: false,
      picked: function () { var p = onPart; onPart = false; if (p && S.playing) btnPlay.click(); return p; } });

    function sayHTML() {
      var off = S.pt4 === 'off', f = S.follow, s;
      if (f === 'p') s = off ? 'Phosphate leaves the fungus but piles up in the gap: with <b>MtPT4 missing</b> the plant cannot take it in.' : 'Follow <b>phosphate</b>: the fungus releases it into the gap, and the plant’s transporter <b>MtPT4</b>, on the wrapping membrane, takes it into the cytoplasm.';
      else if (f === 'zc') s = 'Follow <b>zinc and copper</b>: fungal hyphae also deliver these to the plant. The drawing puts them on the same route; which carriers move them here is not shown by the sources used.';
      else if (f === 's') s = 'Follow <b>sugars</b>: carbon from the plant’s photosynthesis crosses the wrapping membrane to the fungus. This is part of what the plant pays the fungus.';
      else if (f === 'fa') s = 'Follow <b>fatty acids</b>: the plant also pays in fats. The fungus cannot make its own fatty acids, so it depends on the plant for them.';
      else s = 'Two way trade across the plant’s wrapping membrane: <b>phosphate, zinc and copper</b> go to the plant; <b>sugars and fatty acids</b> go to the fungus. The fungus is inside the wall but never inside the cytoplasm.';
      if (off && f !== 'p') s += ' With <b>MtPT4 missing</b>, phosphate stalls in the gap and, in the mutant plants, arbuscules die early.';
      return '<b>What just happened.</b> ' + s;
    }
    function render() {
      placeCargo();
      var off = S.pt4 === 'off';
      gArb.setAttribute('opacity', off ? 0.5 : 1); gSpace.setAttribute('opacity', off ? 0.7 : 1);
      PT.forEach(function (p) { p.setAttribute('fill', off ? 'none' : 'var(--ink)'); p.setAttribute('stroke', off ? 'var(--ink2)' : 'none'); p.setAttribute('stroke-dasharray', off ? '1.5 1.5' : null); p.setAttribute('stroke-width', off ? 0.9 : null); });
      var s = sayHTML(); if (live.getAttribute('data-s') !== s) { live.setAttribute('data-s', s); live.innerHTML = s; }
    }
    function loop(ts) {
      raf = 0; if (!S.playing) return;
      var dt = last ? Math.min(0.1, (ts - last) / 1000) : 0; last = ts;
      if (visible && !document.hidden) { T += dt; placeCargo(); }
      raf = requestAnimationFrame(loop);
    }
    choose(null); syncPlay(); T = 0.37; render();
    if (S.playing) raf = requestAnimationFrame(loop);
    if ('IntersectionObserver' in window) { var io = new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }, { threshold: 0.01 }); io.observe(root); offs.push(function () { io.disconnect(); }); }
    if (ui.onPrefs) offs.push(ui.onPrefs(function () { if (reduced() && S.playing) { S.playing = false; syncPlay(); } render(); }));
    return { destroy: function () { S.playing = false; if (raf) cancelAnimationFrame(raf); offs.forEach(function (f) { try { f(); } catch (e) { } }); if (root.parentNode) root.parentNode.removeChild(root); } };
  }

  function whyHTML() {
    var WQ = 'Wang and Qiu 2006, Mycorrhiza 16: 299 to 363: a survey of published records for 3,617 species, all mycorrhiza types together.';
    var RG = 'Regvar et al. 2003, Journal of Plant Physiology 160: 615 to 626.';
    return '<p><b>Inside the wall, outside the cell.</b> The fungus grows through the plant cell wall, but the plant’s membrane folds in around each branch. So the arbuscule sits in a pocket of plant membrane, the <b>periarbuscular membrane</b>, and everything traded crosses that membrane. The plant controls its side: in <i>Medicago truncatula</i> (a small lab plant related to clover) the phosphate transporter <b>MtPT4</b> sits with the arbuscules, consistent with a place on that membrane ' + badge('MEASURED', HAR) + ' (Harrison, Dewbre and Liu 2002, Plant Cell 14: 2413, ' + link('10.1105/tpc.004861') + '). Plants lacking MtPT4 cannot take up the phosphate delivered by the fungus, and their arbuscules die early ' + badge('MEASURED', JAV) + ' (Javot et al. 2007, PNAS 104: 1720, ' + link('10.1073/pnas.0608136104') + ').</p>' +
      '<p><b>What each side gets.</b> The plant pays the fungus in <b>sugars and in fats (fatty acids)</b>; the fungus cannot make its own fatty acids ' + badge('MEASURED', LIP) + ' (Jiang et al. 2017, Science 356: 1172, ' + link('10.1126/science.aam9970') + '; Luginbuehl et al. 2017, Science 356: 1175, ' + link('10.1126/science.aan0081') + '; Keymer et al. 2017, eLife 6: e29107, ' + link('10.7554/eLife.29107') + '). The plant gets mainly <b>phosphorus</b>; hyphae have also been shown to deliver <b>zinc and copper</b> ' + badge('SECONDARY', MD) + ' (Marschner and Dell 1994, Plant and Soil 159: 89, ' + link('10.1007/BF00000098') + '). Getting most of its phosphate this way does not mean the plant grows bigger: see <b>The rent</b> in the panel above (Smith, Smith and Jakobsen 2003).</p>' +
      '<p><b>Who has these partners.</b> About <b>80 %</b> of the <b>3,617</b> land plant species surveyed form mycorrhizas of some kind, mostly the arbuscular type shown here ' + badge('SECONDARY', WQ) + ' (Wang and Qiu 2006, Mycorrhiza 16: 299, ' + link('10.1007/s00572-005-0033-6') + '). The cabbage family (Brassicaceae, which includes mustards and canola) is <b>characteristically non mycorrhizal</b>, not unable: some pennycress species carry sparse colonisation, though it is doubtful that a working exchange forms ' + badge('OPEN', RG + ' Whether such sparse colonisation is a real symbiosis is still unclear.') + ' (Regvar et al. 2003, J Plant Physiol 160: 615, ' + link('10.1078/0176-1617-00988') + ').</p>' +
      '<p><b>What the drawing is.</b> A schematic: one cell, one arbuscule, branch sizes, transporter spacing and the moving cargo are invented to show where things are and which way they go ' + badge('ILLUSTRATIVE', 'Not to scale; no rate is shown.') + '.</p>';
  }

  window.NR_ARB = { mount: mount };
})();

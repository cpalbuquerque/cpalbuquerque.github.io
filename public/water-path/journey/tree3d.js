/* The Water Path v8: tree3d.js (TREE BUILDER, round "gate and tree", 13 Oct 2026)
   One 3D almond tree, whole and cut open, with three cumulative layers chosen by the user:
     1 Water   xylem, Ψ colour gradient soil → root → stem → leaf → air from the journey engine (WP.solve, crop almond, MODEL)
     2 Sugars  phloem just inside the bark, sucrose and sorbitol from the leaves down to roots and fruit (pressure flow)
     3 Signals ABA made in leaves when leaf water status falls, carried to the guard cells, stomata closing;
               root to shoot signals only as an open question tag.
   Used in two places:
     WP.tree3d.mount(host, {context: 'plant'})   the Plant plate hero (journey/l2_plant.js)
     WP.tree3d.autoMap()                          the main page map: replaces the trip strip figure #tripStrip when
                                                  WebGL works; trip_strip.js stays as the fallback. Lazy loads vendor/three.min.js,
                                                  macro.js and engine.js from this file's folder only when the tree is mounted.
   Every number and caption comes from night/sheets/gate_tree.json (science lead, 13 Oct 2026) or the engine (MODEL).
   Drawn speeds are ILLUSTRATIVE: water beads move in proportion to the model transpiration E; sugar beads at a fixed
   drawn speed (phloem velocity measured by MRI, Windt et al. 2006, 0.25 to 0.40 mm s⁻¹, is quoted, not drawn to scale).
   Animation time is scaled by PlaySpeed through the macro hero; MolNames switches the name tags.
   Triangle budget about 25 to 30k. Reduced motion: a still frame with Play. No WebGL: not mounted (the caller keeps
   its 2D fallback). Plain ES2018, no modules.
   14 Oct 2026, round LOOK CLOSER AND PHLOEM (TREE BUILDER, Lead note B):
   - Bigger stage (desktop min(760, max(520, w × 0.72)), phones 580), closer camera.
   - Richer tree: bark texture (canvas, no image files), branching with a continuous taper and a root flare, almond
     leaves as glossy lanceolate blades in clusters on short spurs, a soft contact shadow, fine rootlets. About 50 to 58k
     triangles in all; the macro adaptive guard drops the pixel ratio if frames get slow.
   - Trunk cutaway rebuilt so its inside reads when zoomed: heartwood, glassy sapwood with xylem vessels as tubes (water
     beads rising inside; the vessels on the cut faces are sliced open), rays from xylem to phloem (Pfautsch et al. 2015),
     a cambium sheet, glassy phloem with sieve tubes, sieve plates and companion cells (Mullendore et al. 2010; Martens et
     al. 2006; Liu et al. 2022), sucrose and sorbitol beads moving down, and the bark. Layer widths and cell sizes are
     drawn far larger than real (the card says so).
   - Explore in 3D: the shared WP.macro.orbit controller (zoom, pan, tilt, Reset view) through the macro hero, with
     Look closer chips Trunk inside, Xylem, Phloem, Leaf, Root. A chip opens the cut view, picks the block and flies
     the camera to it; Phloem also turns on + Sugars. The tree's own drag to turn was removed (the orbit does it); a tap
     still opens a card (and freezes the motion, v19); Enter still cuts it open; a tap on empty space or Space freezes or plays. The tree stops drifting while the user drives the camera. */
(function () {
  'use strict';
  var BASE = (document.currentScript && document.currentScript.src || '').replace(/[^\/]*$/, '');
  var T3 = {};
  function W() { return (window.WP = window.WP || {}); }
  function publish() { W().tree3d = T3; }
  publish(); window.WPtree3d = T3;

  var MINUS = '−';
  function clamp(x, a, b) { return x < a ? a : (x > b ? b : x); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function num(x, d) { var s = Math.abs(x).toFixed(d == null ? 2 : d); return (x < 0 && +s !== 0 ? MINUS : '') + s; }
  function psiTxt(x) { return Math.abs(x) >= 20 ? num(Math.round(x), 0) + ' MPa' : num(x, 2) + ' MPa'; }
  function seeded(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

  /* ------------------------------------------------------------------ loading */
  var glOK = null;
  T3.supported = function () {
    if (glOK !== null) return glOK;
    try {
      var c = document.createElement('canvas'), g = c.getContext('webgl') || c.getContext('experimental-webgl');
      glOK = !!g && !!window.WebGLRenderingContext;
      if (g) { var x = g.getExtension('WEBGL_lose_context'); if (x) x.loseContext(); }
    } catch (e) { glOK = false; }
    return glOK;
  };
  function load(src, test, cb) {
    if (test()) return cb(true);
    var name = src.replace(/^.*\//, '');
    var s = document.querySelector('script[data-t3="' + name + '"]') || document.querySelector('script[src$="/' + name + '"]') || document.querySelector('script[src="' + name + '"]');
    if (!s) { s = document.createElement('script'); s.src = src; s.setAttribute('data-t3', name); document.body.appendChild(s); }
    var done = false;
    function fin() { if (done) return; done = true; cb(test()); }
    s.addEventListener('load', fin); s.addEventListener('error', fin);
    setTimeout(function () { if (test()) fin(); }, 50);
  }
  function ensure(withEngine, cb) {
    load(BASE + 'vendor/three.min.js', function () { return !!window.THREE; }, function (ok) {
      if (!ok) return cb(false);
      load(BASE + 'macro.js', function () { return !!(window.WP && window.WP.macro); }, function (ok2) {
        if (!ok2) return cb(false);
        if (!withEngine) return cb(true);
        load(BASE + 'engine.js', function () { return !!(window.WP && window.WP.solve); }, function () { cb(true); });
      });
    });
  }
  function whenNear(el, fn) {
    var done = false;
    function go() { if (done) return; done = true; fn(); }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); go(); } }, { rootMargin: '300px 0px' });
      io.observe(el);
    } else go();
  }

  /* ------------------------------------------------------------------ the model numbers (engine, almond) */
  // Snapshot of WP.solve(WP.defaults with crop 'almond'), journey/engine.js, 13 Oct 2026; used only if the engine is missing.
  var SNAP = { psi: { soil: -0.10, root: -0.43, stem: -0.71, leafOut: -1.11, air: -125.8 }, E: 3.80, closed: 0.34, snap: true };
  var SNAP_DRY = { psi: { soil: -1.50, root: -1.57, stem: -1.67, leafOut: -1.87, air: -125.8 }, E: 0.84, closed: 0.87, snap: true };
  var DRY_SOIL = -1.5;
  function solve(dry) {
    var WP = W();
    if (WP.solve && (WP.state || WP.defaults)) {
      try {
        var st = Object.assign({}, WP.state || WP.defaults, { crop: 'almond' });
        if (dry) st.soilPsi = Math.min(st.soilPsi, DRY_SOIL);
        var r = WP.solve(st);
        if (r && r.psi && isFinite(r.psi.leafOut) && isFinite(r.E)) return { psi: r.psi, E: r.E, closed: clamp(r.closedFrac || 0, 0, 1), snap: false };
      } catch (e) { /* fall through to the snapshot */ }
    }
    return dry ? SNAP_DRY : SNAP;
  }
  /* Ψ colour: deep blue near 0 MPa to pale at −3 MPa (log scale so the small soil to leaf steps show); air warm grey */
  var C_DEEP = [0.11, 0.36, 0.78], C_MID = [0.34, 0.65, 0.92], C_PALE = [0.86, 0.93, 0.99];
  function psiRGB(p) {
    if (p < -10) return [0.80, 0.72, 0.62];
    var t = clamp(Math.log(1 + Math.max(0, -p) * 10) / Math.log(31), 0, 1);
    var a = t < 0.5 ? C_DEEP : C_MID, b = t < 0.5 ? C_MID : C_PALE, k = t < 0.5 ? t * 2 : (t - 0.5) * 2;
    return [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
  }
  function rgbCss(c) { return 'rgb(' + Math.round(c[0] * 255) + ',' + Math.round(c[1] * 255) + ',' + Math.round(c[2] * 255) + ')'; }

  /* ------------------------------------------------------------------ text: hook questions, answers, credits, cards */
  var SRC = {
    alvarez: { t: 'Álvarez-Maldini et al. 2022, Frontiers in Plant Science', doi: '10.3389/fpls.2022.974050' },
    windt: { t: 'Windt et al. 2006, Plant, Cell and Environment', doi: '10.1111/j.1365-3040.2006.01544.x' },
    knob: { t: 'Knoblauch et al. 2016, eLife', doi: '10.7554/eLife.15341' },
    gao: { t: 'Gao et al. 2003, Plant Physiology', doi: '10.1104/pp.102.016725' },
    nad: { t: 'Nadwodnik and Lohaus 2008, Planta', doi: '10.1007/s00425-007-0682-0' },
    mcadam: { t: 'McAdam and Brodribb 2016, Plant Physiology', doi: '10.1104/pp.16.00380' },
    taka: { t: 'Takahashi et al. 2018, Nature', doi: '10.1038/s41586-018-0009-2' },
    // 14 Oct (LOOK CLOSER AND PHLOEM): rows of night/sheets/phloem.json, PubMed retrieved by the phloem science lead
    mull: { t: 'Mullendore et al. 2010, The Plant Cell', doi: '10.1105/tpc.109.070094' },
    jensen: { t: 'Jensen et al. 2012, Frontiers in Plant Science', doi: '10.3389/fpls.2012.00151' },
    martens: { t: 'Martens et al. 2006, Plant Physiology', doi: '10.1104/pp.106.085803' },
    liu: { t: 'Liu et al. 2022, PNAS', doi: '10.1073/pnas.2112755119' },
    pfau: { t: 'Pfautsch, Hölttä and Mencuccini 2015, Tree Physiology', doi: '10.1093/treephys/tpv058' }
  };
  var LAYER = [null, {
    q: 'How does an almond tree lift water four metres with no pump?',
    credit: { text: 'Álvarez-Maldini et al. · Frontiers in Plant Science 2022', doi: '10.3389/fpls.2022.974050' }
  }, {
    q: 'Water goes up. How does sugar get down?',
    credit: { text: 'Windt et al. · Plant, Cell and Environment 2006', doi: '10.1111/j.1365-3040.2006.01544.x' }
  }, {
    q: 'How does a thirsty leaf tell its stomata to close?',
    credit: { text: 'McAdam and Brodribb · Plant Physiology 2016', doi: '10.1104/pp.16.00380' }
  }];
  function answer(L, r) {
    if (L === 1) return '<b>It is pulled from the top.</b> Water evaporates inside the leaves and leaves as vapour through the stomata, mostly on their lower side. Water molecules cling to each other, so the column in the xylem follows from the roots, under tension. Water always moves toward a more negative Ψ: here from the soil at ' + psiTxt(r.psi.soil) + ' to the leaves at ' + psiTxt(r.psi.leafOut) + ' (model). Tap the trunk, or press <b>Cut it open</b>, to see inside.';
    if (L === 2) return '<b>It is pushed, in a different tissue.</b> The phloem is a thin living layer just inside the bark. Leaves load sugar into its sieve tubes, water follows by osmosis, and the pressure drives the sap toward the roots and the fruit: pressure flow. Almond, like other members of the rose family, moves sorbitol as well as sucrose. Measured by MRI in poplar, castor bean, tomato and tobacco, phloem sap moves about 0.25 to 0.40 mm s⁻¹, or 0.9 to 1.4 m h⁻¹ (Windt et al. 2006). It has not been measured in almond, and the speed drawn here is illustrative.';
    return '<b>With a hormone.</b> When leaf turgor falls, the leaf makes abscisic acid (ABA) within about 20 minutes in flowering plants, and ABA closes the stomata (McAdam and Brodribb 2016). Press <b>Dry the soil</b> and watch the leaf Ψ fall, ABA appear and the pores close; press it again to water the tree. Do roots also send a signal up? In Arabidopsis a root peptide, CLE25, travels to the leaves and raises ABA (Takahashi et al. 2018). Whether an almond tree does the same is an open question.';
  }
  function srcLine(keys) {
    return '<p class="t3-src">' + keys.map(function (k) { var s = SRC[k]; return esc(s.t) + ' · <a href="https://doi.org/' + encodeURI(s.doi) + '" target="_blank" rel="noopener">DOI ' + esc(s.doi) + '</a>'; }).join('<br>') + '</p>';
  }
  /* cards: t1 = Explore, t2 adds Explain, t3 adds Expert */
  function CARDS(r, open, cut) {
    var P = r.psi, pct = Math.round(open * 100);
    return {
      leaf: { h: 'Leaves: where the pull starts', plate: 'tissue', t1: 'Water evaporates from wet cell walls inside the leaf and leaves as vapour through the stomata, the pores, mostly on the lower side. Every molecule that leaves pulls on the column below it. Leaf Ψ now: ' + psiTxt(P.leafOut) + ' (model).', t2: 'In young potted almond trees, stomata were 90 % closed at −1.72 to −2.25 MPa, depending on cultivar (Álvarez-Maldini et al. 2022).', src: ['alvarez'] },
      xylem: { h: 'Trunk: the water pipe', plate: 'organ', t1: 'Inside the trunk, the xylem: dead, hollow conduits that carry water up from the roots under tension. Stem Ψ now: ' + psiTxt(P.stem) + ' (model). ' + (cut ? 'The block beside the tree shows its layers: tap one.' : 'Press Cut it open to see the layers.'), t2: 'How far can it be pushed? In young potted almond trees, stems lost half their conductivity (P<sub>50</sub>) at −2.97 to −3.80 MPa by cultivar, while the stomata had already closed by 90 % at −1.72 to −2.25 MPa, before the xylem failed (Álvarez-Maldini et al. 2022).', t3: 'Caveat: those P<sub>50</sub> values come from air injection, 3 plants per cultivar, young grafted trees in pots. Read them as a range, not a property of orchard trees.', src: ['alvarez'] },
      sapwood: { h: 'Sapwood xylem', plate: 'organ', t1: 'The outer, younger xylem: the part that still carries water, in vessels (the blue tubes). Blue beads are water rising under tension. Stem Ψ now: ' + psiTxt(P.stem) + ' (model). The layers in this block are drawn far thicker than real.', t2: 'In young potted almond trees, stems lost half their conductivity at −2.97 to −3.80 MPa by cultivar; stomata were 90 % closed already at −1.72 to −2.25 MPa (Álvarez-Maldini et al. 2022).', t3: 'Measured by air injection, 3 plants per cultivar, young grafted trees in pots.', src: ['alvarez'] },
      vessel: { h: 'Xylem vessels', plate: 'organ', t1: 'Dead, hollow cells joined end to end into long pipes. Water (blue beads) rises inside them, pulled from the leaves above under tension. The vessels on the cut faces are sliced open so you can see in. Drawn far wider than real. Stem Ψ now: ' + psiTxt(P.stem) + ' (model).', t2: 'How much tension can they take? In young potted almond trees, stems lost half their conductivity (P<sub>50</sub>) at −2.97 to −3.80 MPa by cultivar, while the stomata had closed by 90 % at −1.72 to −2.25 MPa (Álvarez-Maldini et al. 2022).', t3: 'Air injection, 3 plants per cultivar, young grafted trees in pots: read the values as a range.', src: ['alvarez'] },
      rays: { h: 'Rays', plate: null, t1: 'Ribbons of living cells that run outward, from the xylem across the cambium into the phloem. They move water and sugar sideways between the two.', t2: 'Through the rays, xylem and phloem work as one connected network, and the stem swells and shrinks a little each day (Pfautsch, Hölttä and Mencuccini 2015, a review).', src: ['pfau'] },
      sievetube: { h: 'Sieve tubes', plate: null, t1: 'Living cells joined end to end, just inside the bark. Sugar sap (gold beads: sucrose and sorbitol) flows down them from the leaves to the roots and fruit, pushed by pressure. The speed drawn is illustrative; drawn far wider than real.', t2: 'A mature sieve element has no nucleus, so it depends on the companion cell beside it (Liu et al. 2022). Measured by MRI in poplar, castor bean, tomato and tobacco, phloem sap moves about 0.25 to 0.40 mm s⁻¹ (Windt et al. 2006); not yet measured in almond.', t3: 'Pressure flow tested in morning glory: sieve tube turgor was 1.08 MPa at the source leaves and 0.59 MPa at the sink, and the sap moved about 123 µm s⁻¹ (Knoblauch et al. 2016).', src: ['liu', 'windt', 'knob'] },
      sieveplate: { h: 'Sieve plates', plate: null, t1: 'The end walls between two sieve elements, pierced by pores. The sap flows straight through them.', t2: 'Sieve plates were measured by electron microscopy in five species (Mullendore et al. 2010). A model built on the anatomy of 19 species says the plates add about half of a sieve tube\'s resistance to flow (Jensen et al. 2012, MODEL): they slow the flow, they do not stop it.', t3: 'After an injury, callose can plug the small plate pores within minutes (Mullendore et al. 2010). In morning glory grown with a longer path, the sieve tubes conducted 5 to 6 times better, mostly because the plate pores were wider (Knoblauch et al. 2016).', src: ['mull', 'jensen', 'knob'] },
      companion: { h: 'Companion cells', plate: null, t1: 'A narrow living cell beside each sieve element, with its own nucleus (the dark dot). It keeps the sieve element running and helps load sugar into it.', t2: 'The two are joined by branched channels, pore plasmodesma units; in tobacco their inner membranes run continuously through them (Martens et al. 2006). A mature sieve element has no nucleus of its own (Liu et al. 2022).', src: ['martens', 'liu'] },
      heartwood: { h: 'Heartwood', plate: 'organ', t1: 'Older xylem at the centre. It no longer carries water; it holds the tree up.' },
      cambium: { h: 'Cambium', plate: 'organ', t1: 'A thin sheet of dividing cells between the xylem and the phloem. Each year it adds new xylem on the inside and new phloem on the outside, so the trunk grows thicker.' },
      phloem: { h: 'Phloem: sugars down', plate: null, t1: 'Living sieve tubes just inside the bark. They carry sugar sap from the leaves, the sources, to the roots and fruit, the sinks, pushed by pressure.', t2: 'Almond belongs to the rose family, which moves sorbitol as well as sucrose (Gao et al. 2003); both were measured in peach phloem sap (Nadwodnik and Lohaus 2008). Measured by MRI in poplar, castor bean, tomato and tobacco, phloem sap moves about 0.25 to 0.40 mm s⁻¹, that is 0.9 to 1.4 m h⁻¹ (Windt et al. 2006). Not yet measured in almond.', t3: 'Pressure flow (Münch) was tested in morning glory: the longer the path from source to sink, the higher the sieve tube turgor and conductivity, as the hypothesis predicts (Knoblauch et al. 2016). Zoom into the cut trunk with Phloem to see sieve tubes, sieve plates and companion cells.', src: ['gao', 'nad', 'windt', 'knob'] },
      bark: { h: 'Bark', plate: null, t1: 'Dead cork cells on the outside protect the living phloem and cambium underneath. Cut a ring of bark all the way round and the sugar supply to the roots stops, while water still rises in the xylem.' },
      root: { h: 'Roots', plate: 'organ', t1: 'Water crosses the root into its xylem, pulled by the more negative Ψ above. Root Ψ now: ' + psiTxt(P.root) + '; soil: ' + psiTxt(P.soil) + ' (model).' },
      roothair: { h: 'Root hairs', plate: 'organ', t1: 'Single epidermal cells that grow out into the soil near the root tip and add absorbing surface. Water moves from the soil, through them, toward the xylem in the centre.' },
      soil: { h: 'Soil: where the path starts', plate: 'organ', t1: 'Soil Ψ now: ' + psiTxt(P.soil) + ' (model). Press Dry the soil to drop it to −1.50 MPa and watch every number above it follow.' },
      fruit: { h: 'Almond fruit: a sugar sink', plate: null, t1: 'The growing nut draws sugar from the phloem. Leaves are the sources, fruit and roots the sinks.', t2: 'In the rose family the transported sugars are sucrose and sorbitol (Gao et al. 2003).', src: ['gao'] },
      stoma: { h: 'Stomata, mostly on the lower side', plate: 'field', t1: 'Pairs of guard cells around a pore. Swollen guard cells hold it open; when they lose turgor it closes. Open now: ' + pct + ' % of the maximum (model).', t2: 'When leaf turgor falls, flowering plants make ABA within about 20 minutes, and ABA closes the pore (McAdam and Brodribb 2016).', src: ['mcadam'] },
      palisade: { h: 'Palisade mesophyll', plate: 'tissue', t1: 'Tall cells under the upper surface, packed with chloroplasts. They catch most of the light.' },
      spongy: { h: 'Spongy mesophyll', plate: 'tissue', t1: 'Loose cells with air spaces between them. Water evaporates from their wet walls into the air spaces, then diffuses out through the stomata.' },
      vein: { h: 'A vein', plate: 'tissue', t1: 'Xylem (blue) brings water into the leaf; phloem (gold) takes sugar out. A ring of bundle sheath cells wraps them.' },
      aba: { h: 'ABA, a stress hormone', plate: 'membrane', t1: 'Abscisic acid. Made in the leaf when its turgor falls, it reaches the guard cells and closes the stomata.', t2: 'In flowering plants this takes about 20 minutes from the drop in turgor (McAdam and Brodribb 2016).', t3: 'Does a signal also come from the roots? In Arabidopsis the root peptide CLE25 travels to the leaves and raises ABA (Takahashi et al. 2018). Not tested in almond: an open question.', src: ['mcadam', 'taka'] }
    };
  }

  /* ------------------------------------------------------------------ CSS */
  var CSS = '\
.t3-bar{background:#141c16;color:#f2efe4;padding:10px 12px 12px;border-top:1px solid rgba(214,232,190,.22);font:400 14px/1.4 var(--ui,system-ui,sans-serif)}\
.t3-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}\
.t3-row+.t3-row{margin-top:9px}\
.t3-dw{background:var(--mol-h2o,#4aa0ec)!important}.t3-dc{background:var(--mol-co2,#9aa0a6)!important}\
.t3-key{margin:0;color:#e9e4d6}.t3-key b{color:#f4f1e8}.t3-key .wp-molkey-i{background:#f4f1e8;border-radius:8px;padding:1px 2px}.t3-co2n{display:block;margin:0 0 4px;color:#e9e4d6}\
.t3-grp{display:inline-flex;flex-wrap:wrap;gap:6px;align-items:center}\
.t3-k{font:600 11.5px var(--ui,system-ui,sans-serif);letter-spacing:.06em;text-transform:uppercase;color:#cfe3b0;margin-right:2px}\
.t3-b{min-height:44px;min-width:44px;padding:6px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.35);background:rgba(255,255,255,.06);color:#f4f1e8;font:600 14px var(--ui,system-ui,sans-serif);cursor:pointer;display:inline-flex;align-items:center;gap:7px}\
.t3-b:hover{background:rgba(255,255,255,.13)}\
.t3-b:focus-visible,.t3-x:focus-visible,.t3-gl:focus-visible{outline:2px solid #ffd479;outline-offset:2px}\
.t3-b[aria-checked="true"],.t3-b[aria-pressed="true"]{background:#f4f1e8;color:#14201a;border-color:#f4f1e8}\
.t3-b .t3-dot{width:11px;height:11px;border-radius:50%;flex:none;box-shadow:0 0 0 1.5px rgba(255,255,255,.5)}\
.t3-b.t3-dry[aria-pressed="true"]{background:#ffd479;color:#2a1d00;border-color:#ffd479}\
.t3-psi{display:flex;flex-wrap:wrap;gap:4px 10px;align-items:center;font:500 13px/1.35 var(--mono,ui-monospace,monospace);color:#e8f0dc}\
.t3-psi .t3-pc{display:inline-flex;align-items:center;gap:5px;white-space:nowrap}\
.t3-psi i{display:inline-block;width:12px;height:12px;border-radius:3px;box-shadow:0 0 0 1px rgba(255,255,255,.4)}\
.t3-tb{font:600 10.5px var(--mono,ui-monospace,monospace);letter-spacing:.05em;border:1px solid currentColor;border-radius:4px;padding:0 4px;color:#cfe3b0}\
.t3-hint{margin:0;font-size:13px;color:#d9dccd}\
.t3-card{position:relative;margin:10px 12px 12px;max-width:60em;background:rgba(244,241,232,.97);color:#1d2a22;border-radius:12px;padding:12px 46px 12px 14px;box-shadow:0 8px 24px rgba(0,0,0,.35);font:400 14px/1.45 var(--ui,system-ui,sans-serif)}\
.t3-card[hidden]{display:none}\
.t3-card h4{margin:0 0 6px;font:700 15px/1.3 var(--ui,system-ui,sans-serif)}\
.t3-card p{margin:0 0 6px}\
.t3-card .t3-src{font-size:12px;color:#4a5048}\
.t3-card a{color:#1f4f8a}\
.t3-card .t3-go{display:inline-flex;align-items:center;min-height:44px;font-weight:600}\
.t3-x{position:absolute;right:4px;top:4px;width:44px;height:44px;border:0;background:transparent;color:#1d2a22;font:600 22px/1 var(--ui,system-ui,sans-serif);cursor:pointer;border-radius:50%}\
.t3-links{display:flex;flex-wrap:wrap;gap:6px;margin:0;padding:0;list-style:none}\
.t3-links a{display:inline-flex;align-items:center;min-height:36px;padding:2px 12px;border:1px solid rgba(255,255,255,.35);border-radius:999px;color:#f4f1e8;text-decoration:none;font-size:13px}\
.t3-links a:focus-visible{outline:2px solid #ffd479;outline-offset:2px}\
.t3-gl{touch-action:pan-y;cursor:grab}\
.t3-gl.t3-drag{cursor:grabbing}\
.t3-in[hidden]{display:none}\
/* T7 (fix round): on phones every bar row keeps a 58 px right column free for the page Speed dock */\
@media (max-width:600px){.t3-b{padding:6px 11px;font-size:13.5px}.t3-psi{font-size:12px}.t3-row{padding-right:58px}.t3-bar{padding:9px 10px 11px}}';
  function injectCSS() {
    if (document.getElementById('t3-css')) return;
    var s = document.createElement('style'); s.id = 't3-css'; s.textContent = CSS; document.head.appendChild(s);
  }

  /* ------------------------------------------------------------------ geometry helpers */
  function tube(T, curve, segs, rad, r0, r1, u0, u1, o) {
    // o (14 Oct): {rf(t) radius function, tex: {around, len}} for a continuous taper and bark texture coordinates
    o = o || {};
    var fr = curve.computeFrenetFrames(segs, false), pos = [], nor = [], uv = [], idx = [];
    for (var i = 0; i <= segs; i++) {
      var t = i / segs, p = curve.getPointAt(t), N = fr.normals[i], B = fr.binormals[i], r = o.rf ? o.rf(t) : lerp(r0, r1, t);
      for (var j = 0; j <= rad; j++) {
        var a = j / rad * Math.PI * 2, c = Math.cos(a), s = -Math.sin(a);
        var nx = c * N.x + s * B.x, ny = c * N.y + s * B.y, nz = c * N.z + s * B.z;
        pos.push(p.x + r * nx, p.y + r * ny, p.z + r * nz); nor.push(nx, ny, nz);
        if (o.tex) uv.push(j / rad * o.tex.around, t * o.tex.len); else uv.push(lerp(u0, u1, t), j / rad);
      }
    }
    for (var a2 = 0; a2 < segs; a2++) for (var b = 0; b < rad; b++) {
      var q0 = a2 * (rad + 1) + b, q1 = (a2 + 1) * (rad + 1) + b;
      idx.push(q0, q1, q0 + 1, q1, q1 + 1, q0 + 1);
    }
    return { pos: pos, nor: nor, uv: uv, idx: idx };
  }
  function geoFrom(T, parts) {
    var pos = [], nor = [], uv = [], idx = [], off = 0;
    parts.forEach(function (p) {
      Array.prototype.push.apply(pos, p.pos); Array.prototype.push.apply(nor, p.nor); Array.prototype.push.apply(uv, p.uv);
      for (var i = 0; i < p.idx.length; i++) idx.push(p.idx[i] + off);
      off += p.pos.length / 3;
    });
    var g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new T.Float32BufferAttribute(nor, 3));
    g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    g.setAttribute('color', new T.Float32BufferAttribute(new Array(pos.length).fill(1), 3));
    g.setIndex(idx);
    return g;
  }
  /* a lanceolate almond leaf (14 Oct rebuild): base at the origin, tip along +y, blade normal +z; a short petiole,
     acuminate tip, edges lifted a little from the midrib, the blade arching back toward the tip; uv for the vein texture.
     22 triangles. Length 0.2 (drawn about twice life size so the leaves read at this scale). */
  function leafGeo(T) {
    var L = 0.2, Wd = 0.034, P = [], U = [], I = [];
    var ys = [0, 0.1, 0.3, 0.55, 0.8, 1], ws = [0.12, 0.62, 0.98, 0.9, 0.45, 0];
    for (var i = 0; i < ys.length; i++) {
      var v = ys[i], y = v * L, w = ws[i] * Wd, arch = -0.32 * L * v * v, lift = 0.28 * w;
      P.push(-w, y, arch + lift, 0, y, arch, w, y, arch + lift);
      U.push(0.5 - ws[i] * 0.5, v, 0.5, v, 0.5 + ws[i] * 0.5, v);
    }
    for (var k = 0; k < ys.length - 1; k++) {
      var a = k * 3, b = (k + 1) * 3;
      I.push(a, a + 1, b, a + 1, b + 1, b); I.push(a + 1, a + 2, b + 1, a + 2, b + 2, b + 1);
    }
    var n0 = P.length / 3; // petiole
    P.push(-0.003, -0.035, 0, 0.003, -0.035, 0, 0.003, 0, 0, -0.003, 0, 0); U.push(0.48, 0, 0.52, 0, 0.52, 0, 0.48, 0);
    I.push(n0, n0 + 1, n0 + 2, n0, n0 + 2, n0 + 3);
    var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(U, 2)); g.setIndex(I); g.computeVertexNormals();
    return g;
  }
  /* canvas textures (no image files): bark, leaf veins, a soft contact shadow, sieve plate pores */
  function canvasTex(T, w, h, draw, rep) {
    var c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    var t = new T.CanvasTexture(c); if (rep) { t.wrapS = t.wrapT = T.RepeatWrapping; } t.encoding = T.sRGBEncoding; t.anisotropy = 4;
    return t;
  }
  function barkTex(T) {
    return canvasTex(T, 256, 256, function (g, w, h) {
      var r = seeded(9);
      g.fillStyle = '#5d4c3d'; g.fillRect(0, 0, w, h);
      // almond bark: dark grey brown, broken into small plates by fissures
      for (var i = 0; i < 700; i++) { var x = r() * w, y = r() * h; g.globalAlpha = 0.5; g.fillStyle = 'hsl(' + Math.round(22 + r() * 14) + ',' + Math.round(12 + r() * 12) + '%,' + Math.round(26 + r() * 22) + '%)'; g.fillRect(x, y, 5 + r() * 14, 8 + r() * 22); }
      g.globalAlpha = 1; g.strokeStyle = 'rgba(24,17,12,.9)';
      for (var k = 0; k < 34; k++) { var x0 = r() * w, y0 = 0; g.lineWidth = 1 + r() * 2.4; g.beginPath(); g.moveTo(x0, y0); while (y0 < h) { y0 += 8 + r() * 16; x0 += (r() - 0.5) * 9; g.lineTo(x0, y0); } g.stroke(); }
      g.lineWidth = 1; for (k = 0; k < 140; k++) { var xx = r() * w, yy = r() * h; g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx + 4 + r() * 10, yy + (r() - 0.5) * 3); g.stroke(); }
      g.fillStyle = 'rgba(190,175,150,.18)'; for (k = 0; k < 60; k++) g.fillRect(r() * w, r() * h, 2 + r() * 5, 1 + r() * 2); // lenticels
    }, true);
  }
  function leafTex(T) {
    return canvasTex(T, 64, 128, function (g, w, h) {
      var gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#c9d7b4'); gr.addColorStop(0.5, '#f4f8ea'); gr.addColorStop(1, '#c9d7b4');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(255,255,236,.95)'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(w / 2, h); g.lineTo(w / 2, 0); g.stroke();
      g.strokeStyle = 'rgba(150,170,120,.55)'; g.lineWidth = 1;
      for (var y = 10; y < h - 6; y += 9) { g.beginPath(); g.moveTo(w / 2, h - y); g.lineTo(4, h - y - 12); g.moveTo(w / 2, h - y); g.lineTo(w - 4, h - y - 12); g.stroke(); }
    }, false);
  }
  function shadowTex(T) {
    return canvasTex(T, 128, 128, function (g, w, h) {
      var gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      gr.addColorStop(0, 'rgba(0,0,0,.62)'); gr.addColorStop(0.1, 'rgba(0,0,0,.42)'); gr.addColorStop(0.45, 'rgba(0,0,0,.22)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    }, false);
  }
  function plateTex(T) {
    return canvasTex(T, 64, 64, function (g, w, h) {
      g.fillStyle = '#e7b54a'; g.beginPath(); g.arc(32, 32, 31, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(60,34,8,.85)';
      [[32, 32], [20, 24], [44, 24], [20, 40], [44, 40], [32, 14], [32, 50], [12, 32], [52, 32]].forEach(function (p) { g.beginPath(); g.arc(p[0], p[1], 4.2, 0, Math.PI * 2); g.fill(); });
    }, false);
  }
  /* sector solids for the trunk callout: bands of [r0, r1] over the arc [f0, f1], height [y0, y1], vertex coloured */
  function Sector() { this.p = []; this.n = []; this.c = []; }
  Sector.prototype.tri = function (a, b, c, n, col) {
    this.p.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
    for (var i = 0; i < 3; i++) { this.n.push(n[0], n[1], n[2]); this.c.push(col[0], col[1], col[2]); }
  };
  Sector.prototype.quad = function (a, b, c, d, n, col) { this.tri(a, b, c, n, col); this.tri(a, c, d, n, col); };
  function pt(r, f, y) { return [r * Math.cos(f), y, r * Math.sin(f)]; }
  Sector.prototype.cap = function (r0, r1, f0, f1, y, up, col, seg) {
    for (var i = 0; i < seg; i++) {
      var a = lerp(f0, f1, i / seg), b = lerp(f0, f1, (i + 1) / seg);
      this.quad(pt(r0, a, y), pt(r1, a, y), pt(r1, b, y), pt(r0, b, y), [0, up ? 1 : -1, 0], col);
    }
  };
  Sector.prototype.wall = function (r, f0, f1, y0, y1, col, seg) {
    for (var i = 0; i < seg; i++) {
      var a = lerp(f0, f1, i / seg), b = lerp(f0, f1, (i + 1) / seg), m = (a + b) / 2;
      this.quad(pt(r, a, y0), pt(r, b, y0), pt(r, b, y1), pt(r, a, y1), [Math.cos(m), 0, Math.sin(m)], col);
    }
  };
  Sector.prototype.face = function (r0, r1, f, y0, y1, col) {
    this.quad(pt(r0, f, y0), pt(r1, f, y0), pt(r1, f, y1), pt(r0, f, y1), [-Math.sin(f), 0, Math.cos(f)], col);
  };
  Sector.prototype.geo = function (T) {
    var g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new T.Float32BufferAttribute(this.n, 3));
    g.setAttribute('color', new T.Float32BufferAttribute(this.c, 3));
    return g;
  };
  /* beads: lit ball sprites with normal blending (they read on the light and the dark stage alike), plus a faint additive
     glow in the night theme. Same api as WP.macro.halos: set(i, x, y, z), hide(i), commit(); obj, mat, geo, glow */
  function beads(T, M, n, hex, size) {
    var g = new T.BufferGeometry(), arr = new Float32Array(n * 3);
    for (var i = 0; i < n; i++) arr[i * 3 + 1] = 1e4;
    var at = new T.BufferAttribute(arr, 3); g.setAttribute('position', at);
    var m = new T.PointsMaterial({ size: size, map: M.ballTexture(T, hex), transparent: true, alphaTest: 0.35, depthWrite: false, sizeAttenuation: true });
    var pts = new T.Points(g, m); pts.frustumCulled = false; pts.renderOrder = 12;
    var gm = new T.PointsMaterial({ color: hex, size: size * 2.6, map: M.glowTexture(T), transparent: true, depthWrite: false, blending: T.AdditiveBlending, sizeAttenuation: true, opacity: 0.0 });
    var glow = new T.Points(g, gm); glow.frustumCulled = false; glow.renderOrder = 11; pts.add(glow);
    return {
      obj: pts, mat: m, geo: g, glow: gm,
      set: function (i, x, y, z) { arr[i * 3] = x; arr[i * 3 + 1] = y; arr[i * 3 + 2] = z; },
      hide: function (i) { arr[i * 3 + 1] = 1e4; },
      commit: function () { at.needsUpdate = true; }
    };
  }
  function hexRGB(h) { return [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255].map(function (v) { return Math.pow(v, 2.2); }); }

  /* small molecule glyphs (not to scale): sucrose = a six ring fused to a five ring; sorbitol = an open chain of six carbons;
     ABA = a ring with a side chain */
  function glyphs(T, M) {
    var hex = new T.TorusGeometry(1, 0.22, 5, 6), pen = new T.TorusGeometry(0.86, 0.22, 5, 5), ball = new T.SphereGeometry(1, 8, 6), stick = new T.CylinderGeometry(0.16, 0.16, 1, 5);
    var suc = M.merge(T, [{ geo: hex, color: 0xffcc4d, pos: [-0.95, 0, 0], scale: 1 }, { geo: pen, color: 0xffa23a, pos: [0.95, 0, 0], scale: 1 }, { geo: ball, color: 0xd9402f, pos: [0, 0, 0], scale: 0.32 }]);
    var parts = [];
    for (var i = 0; i < 6; i++) parts.push({ geo: ball, color: i % 2 ? 0xfff1d0 : 0xffd27a, pos: [-1.5 + i * 0.6, (i % 2 ? 0.25 : -0.25), 0], scale: 0.34 });
    for (var j = 0; j < 6; j += 2) parts.push({ geo: ball, color: 0xd9402f, pos: [-1.5 + j * 0.6, -0.75, 0], scale: 0.24 });
    var sor = M.merge(T, parts);
    var aba = M.merge(T, [{ geo: hex, color: 0xb98cff, pos: [-0.7, 0, 0], scale: 1 }, { geo: ball, color: 0xd9a8ff, pos: [0.6, 0.35, 0], scale: 0.36 }, { geo: ball, color: 0xd9a8ff, pos: [1.2, -0.1, 0], scale: 0.36 }, { geo: ball, color: 0xd9402f, pos: [1.75, 0.3, 0], scale: 0.3 }, { geo: ball, color: 0xd9402f, pos: [-0.7, 1.25, 0], scale: 0.28 }]);
    hex.dispose(); pen.dispose(); ball.dispose(); stick.dispose();
    return { suc: suc, sor: sor, aba: aba };
  }

  /* WP.heroNames: identical logic to the copies in l4_tissue.js and l5_membrane.js (first loaded wins). The main page does
     not load those files, so this copy makes the names work there. ANTI CLUTTER RULE: 2 per kind at desktop width, 1 on
     phones, stable, never over a label tag, the caption, the credit or a button. */
  function ensureHeroNames() {
    var WP = W();
    if (WP.heroNames) return;
    WP.heroNames = function (ctx) {
      var T = ctx.THREE, MM = WP.macro, pools = {}, live = new Map(), prev = {}, miss = new Map(), items = [], blk = [], blkT = -1e9, v = new T.Vector3();
      function take(text) {
        var p = pools[text] = pools[text] || [], s = p.pop();
        if (!s) { s = MM.nameTag(T, text, { h: 0.3, depthTest: false }); s.material.fog = false; s.material.toneMapped = false; s.userData.asp = s.scale.x / s.scale.y; ctx.root.add(s); }
        s.userData.hideName = false; return s;
      }
      function give(s) { s.visible = false; s.userData.hideName = true; (pools[s.userData.molName] = pools[s.userData.molName] || []).push(s); }
      function blockers() {
        var now = performance.now(); if (now - blkT < 150) return blk; blkT = now; blk = [];
        var st = ctx.wrap.querySelector('.mh-stage'); if (!st) return blk; var wr = st.getBoundingClientRect();
        Array.prototype.forEach.call(ctx.wrap.querySelectorAll('.mh-tag:not(.mh-hide),.mh-cap,.mh-credit,.mh-lbtn,.mh-pause,.mh-spd,.mh-slow:not([hidden]),.t3-card:not([hidden])'), function (e) {
          var r = e.getBoundingClientRect(); if (r.width > 0 && getComputedStyle(e).visibility !== 'hidden' && getComputedStyle(e).display !== 'none') blk.push({ x: r.left - wr.left - 8, y: r.top - wr.top - 8, w: r.width + 16, h: r.height + 16 }); /* fix 1: wider margin, molecule tags kept clear of hero tags */
        });
        return blk;
      }
      function hit(a, b) { return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h; }
      return {
        items: function () { return items; },
        begin: function () { items = []; },
        add: function (kind, key, text, x, y, z, r, o) { items.push({ k: kind, key: key, t: text, x: x, y: y, z: z, r: r || 0.15, all: !!(o && o.all), q: o && o.q, pri: (o && o.pri) || 0 }); },
        end: function () {
          var cam = ctx.camera, on = MM.namesOn ? MM.namesOn() : true, used = new Set(), root = ctx.root, now = performance.now();
          if (cam && on && ctx.w && root) {
            root.updateMatrixWorld();
            var tv = Math.tan(cam.fov * Math.PI / 360), px = ctx.narrow ? 15.5 : 17, placed = blockers().slice(), kinds = [], by = {}, next = {};
            items.forEach(function (it) { if (!by[it.k]) { by[it.k] = []; kinds.push(it.k); } by[it.k].push(it); });
            kinds.forEach(function (k) {
              var L = by[k], q = L[0].q != null ? L[0].q : (L[0].all && L.length <= 6 ? 6 : (ctx.narrow ? 1 : 2)), chosen = [], old = prev[k] || [];
              if (q <= 0) return;
              L.sort(function (a, b) { return b.pri - a.pri; });
              L.forEach(function (it) {
                v.set(it.x, it.y, it.z); root.localToWorld(v);
                var d = cam.position.distanceTo(v), ppu = ctx.h / (2 * d * tv), hh = px / ppu;
                it.hh = hh; it.wy = it.y - it.r - hh * 0.62;
                v.set(it.x, it.wy, it.z); root.localToWorld(v); v.project(cam);
                var sx = (v.x + 1) / 2 * ctx.w, sy = (1 - v.y) / 2 * ctx.h, asp = (it.t.length * 27 + 36) / 66;
                it.front = v.z < 1; it.box = { x: sx - px * asp / 2 - 2, y: sy - px / 2 - 2, w: px * asp + 4, h: px + 4 }; it.sx = sx; it.sy = sy;
              });
              function fits(it) { var b = it.box; if (!it.front || b.x < 4 || b.y < 4 || b.x + b.w > ctx.w - 4 || b.y + b.h > ctx.h - 4) return false; for (var i = 0; i < placed.length; i++) if (hit(b, placed[i])) return false; return true; }
              L.forEach(function (it) { var m0 = miss.get(it.key); if (chosen.length < q && old.indexOf(it.key) >= 0 && (m0 == null || now - m0 < 1500)) chosen.push(it); });
              L.forEach(function (it) {
                if (chosen.length >= q || chosen.indexOf(it) >= 0) return;
                for (var i = 0; i < chosen.length; i++) if (Math.hypot(chosen[i].sx - it.sx, chosen[i].sy - it.sy) < (ctx.narrow ? 60 : 90)) return;
                if (fits(it)) chosen.push(it);
              });
              next[k] = chosen.map(function (it) { return it.key; });
              chosen.forEach(function (it) {
                if (!fits(it)) { if (!miss.has(it.key)) miss.set(it.key, now); return; }
                miss.delete(it.key); placed.push(it.box);
                var s = live.get(it.key);
                if (s && s.userData.molName !== it.t) { give(s); s = null; }
                if (!s) { s = take(it.t); live.set(it.key, s); }
                s.position.set(it.x, it.wy, it.z); s.scale.set(it.hh * s.userData.asp, it.hh, 1); s.visible = true; s.renderOrder = 30;
                used.add(it.key);
              });
            });
            prev = next;
          } else prev = {};
          live.forEach(function (s, key) { if (!used.has(key)) { give(s); live.delete(key); } });
          if (miss.size > 300) miss.clear();
        }
      };
    };
  }

  /* ------------------------------------------------------------------ mount */
  T3.mount = function (host, opts) {
    opts = opts || {};
    publish();
    if (!T3.supported()) return null;
    injectCSS();
    var context = opts.context === 'map' ? 'map' : 'plant';
    var S = { gas: 'water', layer: 1, cut: false, dry: false, cutK: 0, yaw: -0.35, drag: null, lastUser: -1e9, focus: 'trunk', card: null, res: solve(false), built: false, ctx: null, host: host };
    var ctl = {
      state: S,
      update: function () { S.res = solve(S.dry); refresh(); },
      retheme: function () { if (S.ctx && S.ctx.retheme) S.ctx.retheme(); },
      dispose: function () { if (S.ctx && S.ctx.dispose) S.ctx.dispose(); }
    };
    host.style.minHeight = host.style.minHeight || '440px';
    whenNear(host, function () {
      ensure(context === 'map', function (ok) {
        if (!ok || !window.WP || !window.WP.macro) { host.style.minHeight = ''; if (opts.onFail) opts.onFail(); return; }
        publish(); ensureHeroNames();
        if (context === 'map' && !window.WP.ui) shimUI();
        S.res = solve(S.dry);
        build(host, S, context, opts);
        ctl.ready = true;
        if (opts.onReady) opts.onReady(ctl);
      });
    });
    function refresh() { if (S.refresh) S.refresh(); }
    S.ctl = ctl;
    return ctl;
  };
  /* the main page has no journey shell: a small WP.ui with the same two readers macro.js uses */
  function shimUI() {
    var WP = W();
    WP.ui = {
      isDark: function () { var t = document.documentElement.getAttribute('data-theme'); if (t) return t === 'dark'; try { return matchMedia('(prefers-color-scheme: dark)').matches; } catch (e) { return false; } },
      reducedMotion: function () { var m = document.documentElement.getAttribute('data-motion'); if (m) return m === 'reduce'; try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
    };
  }

  function build(host, S, context, opts) {
    var M = window.WP.macro, map = context === 'map';
    var JB = BASE, LB = BASE + '../light/';
    function plateHref(p) { return map ? JB + 'index.html#' + p : '#' + p; }
    var heroHost = document.createElement('div');
    host.appendChild(heroHost);
    host.style.minHeight = '';
    var ctx = S.ctx = M.hero(heroHost, {
      id: map ? 't3-map' : 't3-plant', seed: 23, fov: 30, fogNear: 22, fogFar: 46, exposure: 1.05,
      label: 'An almond tree in 3D, standing in a glass block of soil with its roots visible. Drag to turn the view, wheel or pinch to zoom, tap a part to read about it, and cut it open to see inside the trunk, a leaf and a root. Layers add water in the xylem, sugars in the phloem, and the hormone ABA.',
      question: LAYER[1].q,
      answer: answer(1, S.res),
      credit: LAYER[1].credit,
      capAlign: 'left',
      lift: function (c) { return c.narrow ? 52 : 36; },
      palette: {
        light: { top: '#33536e', mid: '#7f8556', bot: '#4c3f28', bokeh: ['#ffe6a8', '#cfe3a0', '#f6d38a', '#9fc6e8'], fog: 0x6c7552, fg: 'rgba(235,215,160,.42)' },
        dark: { top: '#05090d', mid: '#0e1a1e', bot: '#17150e', bokeh: ['#2f6f63', '#1d4b5c', '#7a6a2c', '#3c5a7a'], fog: 0x0e1a1e, fg: 'rgba(60,110,100,.42)' }
      },
      // Lead note B (14 Oct): larger stage, desktop min(760, max(520, w × 0.72)), phones 560 or more
      height: function (w) { return w < 600 ? (map ? 560 : 580) : Math.round(Math.min(760, Math.max(520, w * 0.72))); },
      // EXPLORE IN 3D (Lead note A): the shared orbit controller; close zoom allowed so vessels and sieve plates read
      orbit: { minDist: 0.55, maxDist: 34, panLimit: 7, onReset: function () { S.zoom = null; if (S.setLabels) S.setLabels(); } },
      focus: focusList(S),
      fallbackNote: 'This 3D tree needs WebGL, which this browser does not offer. The drawings below show the same path.',
      build: function (c) { return buildScene(c, S); },
      frame: function (c, t, dt) { frame(c, S, t, dt); },
      camera: function (c, t) { camera(c, S, t); },
      theme: function (c) { theme(c, S); },
      resize: function () { setLabels(); },
      sleepAfter: 8000
    });
    ctx.t3 = S;
    var wrap = ctx.wrap, stage = wrap.querySelector('.mh-stage');
    S.ctxRef = ctx;

    /* the bar under the stage */
    var bar = document.createElement('div'); bar.className = 't3-bar';
    bar.innerHTML =
      '<div class="t3-row"><div class="t3-grp" role="radiogroup" aria-label="Layers"><span class="t3-k">Layers</span>' +
        '<button type="button" class="t3-b" role="radio" data-l="1" aria-checked="true"><span class="t3-dot" style="background:#4aa0ec"></span>Water</button>' +
        '<button type="button" class="t3-b" role="radio" data-l="2" aria-checked="false"><span class="t3-dot" style="background:#ffc44d"></span>+ Sugars</button>' +
        '<button type="button" class="t3-b" role="radio" data-l="3" aria-checked="false"><span class="t3-dot" style="background:#b98cff"></span>+ Signals</button></div>' +
        '<div class="t3-grp"><button type="button" class="t3-b t3-cut" aria-pressed="false">Cut it open</button>' +
        '<button type="button" class="t3-b t3-dry" aria-pressed="false" title="A what if for this scene only: soil at −1.50 MPa">Dry the soil</button></div></div>' +
      /* v19: which gas to show at the leaves, in the spirit of the chloroplast LIGHT / CARBON / BOTH */
      '<div class="t3-row"><div class="t3-grp t3-gas" role="radiogroup" aria-label="Gas at the leaves"><span class="t3-k">At the leaves</span>' +
        '<button type="button" class="t3-b" role="radio" data-gas="water" aria-checked="true"><span class="t3-dot t3-dw"></span>Water out</button>' +
        '<button type="button" class="t3-b" role="radio" data-gas="co2" aria-checked="false" tabindex="-1"><span class="t3-dot t3-dc"></span>CO₂ in</button>' +
        '<button type="button" class="t3-b" role="radio" data-gas="both" aria-checked="false" tabindex="-1">Both</button></div>' +
        (window.WPMolColor ? WPMolColor.key(['h2o', 'co2'], { cls: 't3-key' }) : '') + '</div>' +
      '<div class="t3-row t3-in" hidden><div class="t3-grp" role="group" aria-label="Look inside"><span class="t3-k">Look inside</span>' +
        '<button type="button" class="t3-b" data-f="trunk" aria-pressed="true">Trunk</button><button type="button" class="t3-b" data-f="leaf" aria-pressed="false">Leaf</button><button type="button" class="t3-b" data-f="root" aria-pressed="false">Root</button></div></div>' +
      '<div class="t3-row"><div class="t3-psi" aria-live="polite"></div></div>' +
      '<div class="t3-row"><p class="t3-hint t3-hint1">Tap any part to read about it. Look closer flies you inside.</p></div>' +
      (map ? '<div class="t3-row"><ul class="t3-links" aria-label="Open a plate"><li><a href="' + JB + 'index.html#organ">Soil and roots</a></li><li><a href="' + JB + 'index.html#plant">Stem and the whole plant</a></li><li><a href="' + JB + 'index.html#tissue">Inside the leaf</a></li><li><a href="' + JB + 'index.html#membrane">Through a membrane</a></li><li><a href="' + JB + 'index.html#field">Stoma and air</a></li><li><a href="' + LB + 'index.html#thylakoid">Split at PSII</a></li></ul></div>' : '') +
      '<div class="t3-card" role="region" aria-label="About this part" aria-live="polite" hidden></div>';
    stage.insertAdjacentElement('afterend', bar);
    // the Explore in 3D toolbar (Reset view, Look closer chips) sits right under the stage, above the layer bar
    var obar = ctx.orbit && ctx.orbit.bar;
    if (obar) {
      stage.insertAdjacentElement('afterend', obar);
      // a chip first opens the cut view and picks its block, then the orbit flies there (capture runs before the chip)
      obar.addEventListener('click', function (e) {
        var b = e.target.closest && e.target.closest('.mh-foc'); if (!b) return;
        var id = b.getAttribute('data-f');
        S.zoom = id; S.cut = true; S.lastUser = ctx.t;
        S.focus = id === 'leaf' ? 'leaf' : id === 'root' ? 'root' : 'trunk';
        if (id === 'phloem' && S.layer < 2) S.layer = 2;
        sync();
        showCard({ trunk: 'sapwood', xylem: 'vessel', phloem: 'sievetube', leaf: 'stoma', root: 'roothair' }[id] || 'sapwood');
      }, true);
    }
    var card = bar.querySelector('.t3-card');
    bar.appendChild(card); // under the stage at every width, so it never covers the tree or the cut open blocks
    var psiEl = bar.querySelector('.t3-psi'), cutB = bar.querySelector('.t3-cut'), dryB = bar.querySelector('.t3-dry'), inRow = bar.querySelector('.t3-in');
    var glDiv = wrap.querySelector('.mh-gl');
    glDiv.classList.add('t3-gl'); glDiv.setAttribute('tabindex', '0');
    glDiv.setAttribute('aria-label', 'Almond tree. Arrow keys turn it; Enter cuts it open or closes it; Space freezes or plays the motion.');
    S.wrap = wrap;

    function tier() {
      var r = document.getElementById('wp-root'); var t = r ? +(r.getAttribute('data-tier') || 0) : 0;
      if (!t && window.WP.ui && window.WP.ui.tier) t = window.WP.ui.tier();
      return t || 2;
    }
    function openFrac() { return clamp(1 - S.res.closed, 0, 1); }
    function abaK() { return clamp((-S.res.psi.leafOut - 1.25) / 0.5, 0, 1); }
    S.abaK = abaK; S.openFrac = openFrac;

    function showCard(key) {
      var C = CARDS(S.res, openFrac(), S.cut)[key]; if (!C) return;
      S.card = key;
      var tr = tier(), h = '<h4>' + C.h + '</h4><p>' + C.t1 + '</p>';
      if (tr >= 2 && C.t2) h += '<p>' + C.t2 + '</p>';
      if (tr >= 3 && C.t3) h += '<p>' + C.t3 + '</p>';
      if (tr >= 2 && C.src) h += srcLine(C.src);
      if (C.plate) h += '<a class="t3-go" href="' + plateHref(C.plate) + '">Open its plate →</a>';
      // 14 Oct fix 1 (Lead note D): the phloem cards point on to the new module
      if (key === 'phloem' || key === 'sievetube') h += '<a class="t3-go t3-pp" href="' + JB + '../phloem/index.html#sieve">Sugar on the move, Plate II, the sieve tube →</a>';
      card.innerHTML = '<button type="button" class="t3-x" aria-label="Close">×</button>' + h;
      card.hidden = false;
      if (S.userPick) { S.userPick = false; try { var cr = card.getBoundingClientRect(); if (cr.bottom > window.innerHeight || cr.top < 0) card.scrollIntoView({ block: 'nearest', behavior: ctx.reduced ? 'auto' : 'smooth' }); } catch (e) { /* none */ } }
      card.querySelector('.t3-x').addEventListener('click', function () { card.hidden = true; S.card = null; glDiv.focus({ preventScroll: true }); ctx.invalidate(); });
      ctx.invalidate();
    }
    S.showCard = showCard;
    function psiRow() {
      var P = S.res.psi, items = [['Soil', P.soil], ['Root', P.root], ['Stem', P.stem], ['Leaf', P.leafOut], ['Air', P.air]];
      psiEl.innerHTML = (S.gas !== 'water' ? '<span class="t3-pc t3-co2n">CO₂ beads follow how open the stomata are; no CO₂ rate is modelled on this plate: drawn, not to scale <span class="t3-tb">ILLUSTRATIVE</span></span> ' : '') + '<span class="t3-k">Ψ, almond</span>' + items.map(function (it) { return '<span class="t3-pc"><i style="background:' + rgbCss(psiRGB(it[1])) + '"></i>' + it[0] + ' ' + psiTxt(it[1]) + '</span>'; }).join('') +
        ' <span class="t3-tb" title="' + (S.res.snap ? 'Snapshot of the journey engine at its default afternoon, crop almond' : 'Journey engine, crop almond, at the conditions of this page') + '">MODEL</span>' + (S.dry ? ' <span class="t3-tb">WHAT IF</span>' : '') + (S.note ? '<span class="t3-hint" style="flex-basis:100%">' + S.note + '</span>' : '');
    }
    function cropNote() {
      var st = window.WP.state, nm = { grape: 'grapevine', romaine: 'romaine' }[st && st.crop];
      S.note = (!map && nm) ? 'This tree is always an almond, under the same weather as the Conditions above; the readouts at the side follow the crop chosen there (' + nm + ').' : '';
    }
    function live() {
      var r = S.res, open = Math.round(openFrac() * 100), nb = ' ';
      var parts = ['<span style="white-space:nowrap">almond, model</span>', '<span style="white-space:nowrap">E ' + num(r.E, 2) + nb + 'mmol' + nb + 'm⁻²' + nb + 's⁻¹</span>', '<span style="white-space:nowrap">stomata ' + open + nb + '% open</span>'];
      if (S.layer >= 3) parts.push('<span style="white-space:nowrap">ABA ' + (abaK() > 0.5 ? 'high' : abaK() > 0 ? 'rising' : 'low') + '</span>');
      if (S.gas !== 'water') parts.push('<span style="white-space:nowrap">CO₂ in: drawn, not to scale</span>');
      ctx.setLive(parts.join(' · '));
    }
    function caption() {
      var L = LAYER[S.layer];
      var q = wrap.querySelector('.mh-q'); if (q) q.textContent = L.q;
      var a = wrap.querySelector('.mh-a'); if (a) a.innerHTML = answer(S.layer, S.res);
      var cr = wrap.querySelector('.mh-credit');
      if (cr) cr.innerHTML = 'Didactic reconstruction · ' + esc(L.credit.text) + ' · <a href="https://doi.org/' + encodeURI(L.credit.doi) + '" target="_blank" rel="noopener">DOI ' + esc(L.credit.doi) + '</a>';
    }
    function setLabels() {
      if (!S.built) return;
      var T = ctx.THREE, V = function (x, y, z) { return new T.Vector3(x, y, z); }, L = [], G = S.g;
      if (!S.cut) {
        if (S.layer >= 3) { L.push({ id: 'ab', text: 'ABA made in the leaves', tier: 1, obj: G.tree, pos: G.leafAnchor.clone().add(V(0, -0.3, 0)) }); L.push({ id: 'oq', text: 'root to shoot signal? open question', tier: 2, obj: G.tree, pos: G.rootAnchor.clone(), side: 'right', narrow: false }); }
        else if (S.layer >= 2) { L.push({ id: 'ph', text: 'phloem: sugars down', tier: 1, obj: G.tree, pos: G.scafMid.clone() }); L.push({ id: 'fr', text: 'fruit: a sugar sink', tier: 2, obj: G.tree, pos: G.fruitAnchor.clone(), narrow: false }); }
        else {
          L.push({ id: 'lf', text: 'leaves: the pull starts here', tier: 1, obj: G.tree, pos: G.leafAnchor.clone() });
          L.push({ id: 'xy', text: 'xylem: water up', tier: 2, obj: G.tree, pos: G.trunkTop.clone(), side: 'right' });
          L.push({ id: 'rt', text: 'roots in soil', tier: 2, obj: G.tree, pos: G.rootAnchor.clone() });
        }
        if (S.gas !== 'water') L.push({ id: 'ci', text: S.gas === 'both' ? 'CO₂ in, water vapour out' : 'CO₂ in from the air', tier: 1, obj: G.tree, pos: G.leafAnchor.clone().add(V(0.9, -1.0, 0.6)), side: 'right' });
        // T4 (fix round): at + Signals the ABA label has the stage; the bar hint already says how to cut it open
        if (S.layer < 3) L.push({ id: 'tk', text: 'tap the trunk to cut it open', tier: 1, obj: G.tree, pos: V(0.18, 0.62, 0.1), side: 'right' });
      } else {
        var one = ctx.narrow || solo(ctx, S), showT = !one || S.focus === 'trunk', showL = !one || S.focus === 'leaf', showR = !one || S.focus === 'root';
        var tc = G.tc, lc = G.lc, rc = G.rc, fc = G.fc, sd = 'right';
        if (showT) {
          // 14 Oct: what is named follows the Look closer chip (Xylem names vessels and rays; Phloem names sieve tube,
          // sieve plate and companion cell); otherwise the layers, with the phloem cells at tier 2
          var zx = S.zoom === 'xylem', zp = S.zoom === 'phloem', py = G.plateY && G.plateY.length ? G.plateY[Math.floor(G.plateY.length / 2)] : 0;
          L.push({ id: 'sw', text: zx ? 'xylem vessels: water up' : 'xylem (sapwood)', tier: 1, obj: tc, pos: G.bandPt(0.41, zx ? 0.3 : 0.55), side: sd });
          L.push({ id: 'pl', text: zp ? 'sieve tube: sugar down' : 'phloem', tier: 1, obj: tc, pos: G.bandPt(0.556, zp ? 0.33 : 0.4), side: sd });
          // the cell names (sieve plate, companion cell, ray) only once the camera is close: in the overview they crowd
          var zt = S.zoom === 'trunk' && ctx.orbit && ctx.orbit.engaged;
          if (zp || zt) L.push({ id: 'sp', text: 'sieve plate', tier: zp ? 1 : 2, obj: tc, pos: G.bandPt(0.556, py), narrow: zp, side: sd });
          if (zp || zt) L.push({ id: 'cc', text: 'companion cell', tier: zp ? 1 : 2, obj: tc, pos: G.bandPt(0.6, py - 0.16), narrow: zp, side: sd });
          L.push({ id: 'cb', text: 'cambium', tier: zp ? 1 : 2, obj: tc, pos: G.bandPt(0.503, zp ? -0.3 : zx ? 0.22 : -0.2), narrow: zp, side: sd }); // fix 1: in the Xylem view it sat under the caption
          if (zx || zt) L.push({ id: 'ry', text: 'ray', tier: zx ? 1 : 2, obj: tc, pos: G.rayPt.clone(), narrow: zx, side: sd });
          if (!zx && !zp) L.push({ id: 'bk', text: 'bark', tier: 2, obj: tc, pos: G.bandPt(0.69, -0.42), side: sd });
          if (!zp) L.push({ id: 'hw', text: 'heartwood', tier: 2, obj: tc, pos: G.bandPt(0.11, zx ? -0.35 : 0.55), side: sd });
        }
        if (showL) {
          L.push({ id: 'st', text: 'stoma, lower side', tier: 1, obj: lc, pos: V(fc.st[0], -0.24, 0.28), side: sd });
          L.push({ id: 'vn', text: S.layer >= 2 ? 'vein: xylem and phloem' : 'vein', tier: 2, obj: lc, pos: V(0.02, -0.02, 0.3), side: sd });
          // T2 (fix round): two leaf labels only (stoma, vein), so the ABA and H₂O name tags have room; palisade and spongy stay tappable
        }
        if (showR) {
          L.push({ id: 'rh', text: 'root hairs', tier: 1, obj: rc, pos: V(0.25, 0.26, 0.05), side: sd });
          if (S.layer >= 3) L.push({ id: 'rq', text: 'signal to the shoot? open question', tier: 2, obj: rc, pos: V(-0.5, 0.2, 0.05), narrow: false, side: sd });
        }
      }
      ctx.setLabels(L);
    }
    S.setLabels = setLabels;
    function sync() {
      bar.querySelectorAll('[data-l]').forEach(function (b) { b.setAttribute('aria-checked', +b.getAttribute('data-l') === S.layer ? 'true' : 'false'); b.tabIndex = +b.getAttribute('data-l') === S.layer ? 0 : -1; });
      bar.querySelectorAll('[data-gas]').forEach(function (b) { var on = b.getAttribute('data-gas') === S.gas; b.setAttribute('aria-checked', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1; });
      cutB.setAttribute('aria-pressed', S.cut ? 'true' : 'false'); cutB.textContent = S.cut ? 'Close it up' : 'Cut it open';
      dryB.setAttribute('aria-pressed', S.dry ? 'true' : 'false'); dryB.textContent = S.dry ? 'Water it again' : 'Dry the soil';
      inRow.hidden = !S.cut;
      var h1 = bar.querySelector('.t3-hint1');
      if (h1) h1.textContent = S.layer >= 3 ? (S.cut ? 'Choose Leaf to watch ABA reach the guard cells. Dry the soil and the pores close.' : 'Press Dry the soil, then Cut it open and choose Leaf to watch the stomata close.') : S.cut ? 'Tap a vessel, a sieve tube, a leaf cell or a root hair to read about it. Xylem and Phloem above zoom in.' : 'Tap any part to read about it. Look closer flies you inside.';
      bar.querySelectorAll('[data-f]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-f') === S.focus ? 'true' : 'false'); });
      cropNote(); psiRow(); live(); caption(); setLabels();
      if (S.card) showCard(S.card);
      if (S.built) applyLayer(ctx, S);
      ctx.invalidate();
    }
    S.refresh = sync;
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      S.lastUser = ctx.t;
      if (b.hasAttribute('data-l')) { S.layer = +b.getAttribute('data-l'); }
      else if (b.hasAttribute('data-gas')) { S.gas = b.getAttribute('data-gas'); }
      else if (b === cutB) { S.cut = !S.cut; S.zoom = null; if (ctx.orbit && ctx.orbit.engaged) ctx.resetView(); }
      else if (b === dryB) { S.dry = !S.dry; S.res = solve(S.dry); }
      else if (b.hasAttribute('data-f')) {
        S.focus = b.getAttribute('data-f'); S.userPick = true; showCard(S.focus === 'leaf' ? 'stoma' : S.focus === 'root' ? 'roothair' : 'sapwood');
        // 14 Oct: if the user is driving the camera, fly to the block just chosen (on phones the others are hidden)
        if (ctx.orbit && ctx.orbit.engaged) { S.zoom = S.focus; ctx.orbit.focus(S.focus); }
      }
      else return;
      sync();
    });
    bar.querySelector('.t3-gas').addEventListener('keydown', function (e) {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].indexOf(e.key) < 0) return;
      var order = ['water', 'co2', 'both'], i = order.indexOf(S.gas);
      e.preventDefault(); S.gas = order[(i + (e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? 2 : 1)) % 3]; sync();
      var nb = bar.querySelector('[data-gas="' + S.gas + '"]'); if (nb) nb.focus();
    });
    bar.querySelector('[role="radiogroup"]').addEventListener('keydown', function (e) {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].indexOf(e.key) < 0) return;
      e.preventDefault(); S.layer = clamp(S.layer + (e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1), 1, 3); sync();
      var nb = bar.querySelector('[data-l="' + S.layer + '"]'); if (nb) nb.focus();
    });

    /* tap to pick (14 Oct: turning, panning and zoom now come from the shared orbit controller on the same element) */
    var ray = null, mv = null;
    glDiv.addEventListener('pointerdown', function (e) {
      S.drag = { x: e.clientX, y: e.clientY, moved: false, id: e.pointerId };
    });
    glDiv.addEventListener('pointermove', function (e) {
      var d = S.drag; if (!d || d.id !== e.pointerId) return;
      if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6) d.moved = true;
    });
    ctx.picked = function () { var p = S.pickedNow; S.pickedNow = false; return !!p; }; // v19: a tap that opened a card does not also toggle the freeze
    function endDrag(e) {
      var d = S.drag; S.drag = null; S.pickedNow = false;
      if (!d || d.moved || e.type === 'pointercancel' || (e.button != null && e.button > 0)) return;
      pick(e.clientX, e.clientY);
    }
    glDiv.addEventListener('pointerup', endDrag); glDiv.addEventListener('pointercancel', endDrag);
    glDiv.addEventListener('keydown', function (e) {
      /* v19: Enter cuts the tree open; Space is left to the click to freeze rule (freeze.js), as on every animated view */
      if (e.key === 'Enter') { e.preventDefault(); e.stopImmediatePropagation(); S.cut = !S.cut; S.zoom = null; if (ctx.orbit && ctx.orbit.engaged) ctx.resetView(); sync(); }
    }, true);
    function pick(cx, cy) {
      if (!S.built) return;
      var T = ctx.THREE; ray = ray || new T.Raycaster(); mv = mv || new T.Vector2();
      var r = glDiv.getBoundingClientRect();
      mv.set((cx - r.left) / r.width * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(mv, ctx.camera);
      var hits = ray.intersectObjects(S.g.pick.filter(function (o) { return o.visible && visibleUp(o); }), false);
      if (!hits.length) return;
      S.pickedNow = true; if (ctx.setPaused) ctx.setPaused(true); // v19: as on the WS workstations, opening a part's card freezes the motion
      var h = hits[0];
      if (h.object.userData.part === 'soil') { for (var i = 1; i < hits.length; i++) if (hits[i].object.userData.part !== 'soil' && hits[i].distance - h.distance < 2.5) { h = hits[i]; break; } }
      // 14 Oct: a tap on the glass sapwood, cambium or phloem picks the vessel, ray, sieve tube, plate or companion cell
      // just behind it when there is one within a short distance
      var CELLS = { vessel: 1, rays: 1, sievetube: 1, sieveplate: 1, companion: 1 }, GLASS = { sapwood: 1, cambium: 1, phloem: 1 };
      if (GLASS[h.object.userData.part]) { var lim = 0.12 * (S.g.tc.scale.x || 1); for (var j = 1; j < hits.length; j++) if (CELLS[hits[j].object.userData.part] && hits[j].distance - h.distance < lim) { h = hits[j]; break; } }
      var part = h.object.userData.part;
      S.userPick = true;
      if (part === 'trunk' && !S.cut) { S.cut = true; S.focus = 'trunk'; S.lastUser = ctx.t; sync(); showCard(S.layer >= 2 ? 'phloem' : 'xylem'); return; }
      if (part === 'trunk') part = 'xylem';
      if (part === 'wood') part = S.layer >= 2 ? 'phloem' : 'xylem';
      if (part === 'leaf' && S.layer >= 3 && abaK() > 0) part = 'aba';
      showCard(part);
    }
    function visibleUp(o) { for (var p = o; p; p = p.parent) if (!p.visible) return false; return true; }

    if (map) {
      var mo = new MutationObserver(function () { ctx.retheme(); });
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-motion'] });
      try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { ctx.retheme(); }); } catch (e) { /* old browsers */ }
    }
    var tr = document.getElementById('wp-root');
    if (tr && 'MutationObserver' in window) new MutationObserver(function () { if (S.card) showCard(S.card); }).observe(tr, { attributes: true, attributeFilter: ['data-tier'] });
    if (window.MolNames) window.MolNames.on(function () { ctx.invalidate(); });
    S.sync = sync;
    sync();
  }

  /* ------------------------------------------------------------------ the scene */
  function buildScene(ctx, S) {
    var T = ctx.THREE, M = window.WP.macro, mats = ctx.mats, rnd = seeded(41);
    var G = S.g = { pick: [] };
    var disp = function (g) { ctx.disp.push(g); return g; };
    var tree = G.tree = new T.Group(); ctx.root.add(tree);
    tree.rotation.y = S.yaw;

    /* skeleton (14 Oct rebuild): an open vase almond, trunk with a root flare, three scaffolds, secondaries,
       tertiaries and twigs; each child starts at its parent's radius there, so the taper is continuous */
    var V = function (x, y, z) { return new T.Vector3(x, y, z); };
    var curves = [], tips = [], scaf = [], sec = [], twigs = [];
    function RF(r0, r1) { return function (t) { return lerp(r0, r1, Math.pow(t, 0.85)); }; }
    var J = V(0.03, 1.02, 0.01);
    var trunkC = new T.CubicBezierCurve3(V(0, -0.1, 0), V(0.06, 0.32, 0.03), V(-0.03, 0.7, -0.01), J);
    curves.push({ c: trunkC, rf: function (t) { return 0.165 + 0.055 * (1 - t) + 0.12 * Math.exp(-t * 10); }, r0: 0.29, r1: 0.165, u0: 0.2, u1: 0.4, kind: 'trunk', seg: 14, rad: 18, around: 3 });
    for (var i = 0; i < 3; i++) {
      var az = i * Math.PI * 2 / 3 + 0.35 + (rnd() - 0.5) * 0.3;
      var e1 = J.clone().add(V(Math.cos(az) * 1.1, 1.25 + rnd() * 0.15, Math.sin(az) * 1.1));
      var c1 = new T.CubicBezierCurve3(J.clone(), J.clone().add(V(Math.cos(az) * 0.22, 0.45, Math.sin(az) * 0.22)), J.clone().add(V(Math.cos(az) * 0.7, 0.95, Math.sin(az) * 0.7)), e1);
      curves.push({ c: c1, rf: RF(0.135, 0.082), u0: 0.4, u1: 0.6, kind: 'wood', seg: 10, rad: 12, around: 2 }); scaf.push(c1);
      for (var k = 0; k < 2; k++) {
        var az2 = az + (k ? 0.52 : -0.52) + (rnd() - 0.5) * 0.2;
        var e2 = e1.clone().add(V(Math.cos(az2) * 0.74, 0.82 + rnd() * 0.15, Math.sin(az2) * 0.74));
        var c2 = new T.QuadraticBezierCurve3(e1.clone(), e1.clone().add(V(Math.cos(az2) * 0.3, 0.52, Math.sin(az2) * 0.3)), e2);
        curves.push({ c: c2, rf: RF(0.08, 0.048), u0: 0.6, u1: 0.8, kind: 'wood', seg: 8, rad: 10, around: 1.5 }); sec.push(c2);
        for (var m = 0; m < 2; m++) {
          var az3 = az2 + (m ? 0.45 : -0.45) + (rnd() - 0.5) * 0.25;
          var e3 = e2.clone().add(V(Math.cos(az3) * 0.72, 0.3 + rnd() * 0.2, Math.sin(az3) * 0.72));
          var c3 = new T.QuadraticBezierCurve3(e2.clone(), e2.clone().add(V(Math.cos(az3) * 0.3, 0.3, Math.sin(az3) * 0.3)), e3);
          curves.push({ c: c3, rf: RF(0.046, 0.016), u0: 0.8, u1: 1.0, kind: 'wood', seg: 7, rad: 8, around: 1 });
          tips.push({ c3: c3, c2: c2, c1: c1, end: e3 });
          // twigs off the tertiary: short, thin, bearing the leaf spurs
          [0.42, 0.7, 1].forEach(function (tt, q) {
            var p0 = c3.getPointAt(tt), tg = c3.getTangentAt(tt), side = (q % 2 ? 1 : -1), ang = az3 + side * (0.9 + rnd() * 0.5);
            var dir = V(Math.cos(ang) * 0.8 + tg.x * 0.4, 0.2 + rnd() * 0.35, Math.sin(ang) * 0.8 + tg.z * 0.4).normalize();
            var len = 0.22 + rnd() * 0.16, p1 = p0.clone().addScaledVector(dir, len);
            var cw = new T.QuadraticBezierCurve3(p0, p0.clone().addScaledVector(dir, len * 0.5).add(V(0, 0.04, 0)), p1);
            curves.push({ c: cw, rf: RF(0.018, 0.007), u0: 0.95, u1: 1.0, kind: 'twig', seg: 3, rad: 5, around: 1 }); twigs.push(cw);
          });
        }
      }
    }
    var roots = [], rootTips = [];
    for (var r = 0; r < 6; r++) {
      var ra = r * Math.PI / 3 + 0.2 + (rnd() - 0.5) * 0.25;
      var re = V(Math.cos(ra) * 1.25, -0.5 - rnd() * 0.3, Math.sin(ra) * 1.25);
      var rc1 = new T.QuadraticBezierCurve3(V(0, -0.05, 0), V(Math.cos(ra) * 0.5, -0.12, Math.sin(ra) * 0.5), re);
      curves.push({ c: rc1, rf: RF(0.11, 0.04), u0: 0.2, u1: 0.1, kind: 'root', seg: 7, rad: 8 }); roots.push(rc1);
      for (var q = 0; q < 2; q++) {
        var ra2 = ra + (q ? 0.45 : -0.45);
        var re2 = re.clone().add(V(Math.cos(ra2) * 0.55, -0.28 - rnd() * 0.15, Math.sin(ra2) * 0.55));
        var rc2 = new T.QuadraticBezierCurve3(re.clone(), re.clone().add(V(Math.cos(ra2) * 0.25, -0.05, Math.sin(ra2) * 0.25)), re2);
        curves.push({ c: rc2, rf: RF(0.038, 0.012), u0: 0.1, u1: 0.0, kind: 'root', seg: 6, rad: 6 });
        rootTips.push({ c1: rc1, c2: rc2, end: re2 });
        // fine rootlets (wood only, no xylem core drawn)
        for (var fr2 = 0; fr2 < 2; fr2++) {
          var b0 = rc2.getPointAt(0.35 + fr2 * 0.35), fa = ra2 + (fr2 ? 1 : -1) * (0.8 + rnd() * 0.6);
          var b1 = b0.clone().add(V(Math.cos(fa) * 0.28, -0.12 - rnd() * 0.15, Math.sin(fa) * 0.28));
          curves.push({ c: new T.QuadraticBezierCurve3(b0, b0.clone().lerp(b1, 0.5).add(V(0, 0.03, 0)), b1), rf: RF(0.011, 0.004), u0: 0, u1: 0, kind: 'rootlet', seg: 3, rad: 4 });
        }
      }
    }
    /* wood, root, xylem core and phloem sheath meshes */
    var woodParts = [], rootParts = [], coreParts = [], phlParts = [];
    curves.forEach(function (cv) {
      var seg = cv.seg || 7, rad = cv.rad || 7, rf = cv.rf || RF(cv.r0, cv.r1);
      var L = cv.c.getLength();
      (cv.kind === 'root' || cv.kind === 'rootlet' ? rootParts : woodParts).push(tube(T, cv.c, seg, rad, 0, 0, cv.u0, cv.u1, { rf: rf, tex: { around: cv.around || 1, len: L * 2.2 } }));
      if (cv.kind === 'twig' || cv.kind === 'rootlet') return;
      coreParts.push(tube(T, cv.c, seg, 5, 0, 0, cv.u0, cv.u1, { rf: function (t) { return rf(t) * 0.36; } }));
      if (cv.kind !== 'root' || rf(0) > 0.05) phlParts.push(tube(T, cv.c, seg, 5, 0, 0, cv.u0, cv.u1, { rf: function (t) { return rf(t) * 0.82; } }));
    });
    var bark = G.barkTex = barkTex(T); ctx.disp.push(bark);
    mats.wood = M.glass(T, 0xffffff, { opacity: 0.7, roughness: 0.78, clearcoat: 0.15, ccr: 0.6, emissive: 0x140a04, ei: 0.6, rimColor: 0xe8b070, rimK: 0.45, env: 0.25 });
    mats.wood.map = bark; mats.wood.bumpMap = bark; mats.wood.bumpScale = 0.012; mats.wood.needsUpdate = true;
    mats.root = M.glass(T, 0xc8a070, { opacity: 0.62, roughness: 0.4, emissive: 0x2a1a08, ei: 0.5, rimColor: 0xffe0b0, rimK: 0.6, env: 0.3 });
    // the xylem core and the phloem sheath draw AFTER the translucent bark, so the Ψ colours glow through it (x ray look)
    mats.core = new T.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.8, toneMapped: false, depthWrite: false });
    mats.phl = new T.MeshBasicMaterial({ color: 0xffc44d, transparent: true, opacity: 0.0, toneMapped: false, depthWrite: false });
    var woodG = disp(geoFrom(T, woodParts)), rootG = disp(geoFrom(T, rootParts)), coreG = G.coreG = disp(geoFrom(T, coreParts)), phlG = disp(geoFrom(T, phlParts));
    var wood = new T.Mesh(woodG, mats.wood); wood.renderOrder = 1; wood.userData.part = 'wood'; tree.add(wood); G.pick.push(wood);
    var core = new T.Mesh(coreG, mats.core); core.renderOrder = 2; tree.add(core);
    var phl = G.phl = new T.Mesh(phlG, mats.phl); phl.renderOrder = 3; tree.add(phl);
    var rootM = new T.Mesh(rootG, mats.root); rootM.renderOrder = 3; rootM.userData.part = 'root'; tree.add(rootM); G.pick.push(rootM);
    // an invisible fat trunk for easy tapping
    var tHit = new T.Mesh(disp(new T.CylinderGeometry(0.32, 0.36, 1.05, 8)), new T.MeshBasicMaterial({ visible: false }));
    tHit.position.set(0.02, 0.5, 0); tHit.userData.part = 'trunk'; tree.add(tHit); G.pick.push(tHit);
    G.trunkTop = V(0.2, 0.92, 0.06); G.trunkMid = V(0.02, 0.55, 0.2);

    /* soil: a glass block with the roots inside */
    mats.soil = M.glass(T, 0x4a3018, { opacity: 0.22, roughness: 0.6, emissive: 0x120a04, ei: 0.5, rimColor: 0xd8b080, rimK: 0.5, side: T.DoubleSide, env: 0.2 });
    var soil = G.soil = new T.Mesh(disp(new T.CylinderGeometry(2.1, 2.1, 1.4, 48, 1, true)), mats.soil); soil.position.y = -0.7; soil.renderOrder = 4; soil.userData.part = 'soil'; tree.add(soil); G.pick.push(soil);
    mats.soilTop = new T.MeshStandardMaterial({ color: 0x6a5430, transparent: true, opacity: 0.42, roughness: 0.9, depthWrite: false, side: T.DoubleSide });
    M.lin(mats.soilTop);
    var top = new T.Mesh(disp(new T.CircleGeometry(2.1, 48)), mats.soilTop); top.rotation.x = -Math.PI / 2; top.position.y = 0.002; top.renderOrder = 5; top.userData.part = 'soil'; tree.add(top); G.pick.push(top);
    var bot = new T.Mesh(disp(new T.CircleGeometry(2.1, 48)), mats.soilTop); bot.rotation.x = Math.PI / 2; bot.position.y = -1.4; tree.add(bot);
    // soft contact shadow of the canopy and trunk on the soil surface
    var shT = shadowTex(T); ctx.disp.push(shT);
    mats.shadow = new T.MeshBasicMaterial({ map: shT, transparent: true, depthWrite: false, opacity: 0.75, toneMapped: false });
    var sh = new T.Mesh(disp(new T.CircleGeometry(2.05, 40)), mats.shadow); sh.rotation.x = -Math.PI / 2; sh.position.y = 0.008; sh.renderOrder = 6; tree.add(sh);
    // soil crumbs (zero triangles)
    var crumbs = []; for (var cI = 0; cI < 90; cI++) { var ca = rnd() * Math.PI * 2, cr = Math.sqrt(rnd()) * 2.0; crumbs.push([Math.cos(ca) * cr, -0.05 - rnd() * 1.3, Math.sin(ca) * cr]); }
    var crumbP = M.balls(T, crumbs, 0x9a7a50, 0.07); tree.add(crumbP); ctx.disp.push(crumbP.geometry, crumbP.material);

    /* leaves: glossy lanceolate blades in clusters of 4 to 6 on short spurs (almond bears its leaves on spurs) */
    var LN = 1380, lg = disp(leafGeo(T)), lt = leafTex(T); ctx.disp.push(lt);
    mats.leaf = new T.MeshPhysicalMaterial({ color: 0xffffff, map: lt, roughness: 0.4, metalness: 0, clearcoat: 0.55, clearcoatRoughness: 0.32, side: T.DoubleSide, emissive: 0x0a1804 });
    M.lin(mats.leaf); M.rim(mats.leaf, 0xd8f59a, 2.2, 0.3);
    var leaves = G.leaves = new T.InstancedMesh(lg, mats.leaf, LN), m4 = new T.Matrix4(), qt = new T.Quaternion(), eu = new T.Euler(), sc = new T.Vector3(), col = new T.Color(), n = 0;
    var UP = V(0, 1, 0), bx = new T.Vector3(), by = new T.Vector3(), bz = new T.Vector3();
    G.leafPts = [];
    function spur(p, out, nl) {
      // spur axis: outward and up; leaves fan out around it at 40 to 70 degrees
      var ax = V(out.x * 0.8 + (rnd() - 0.5) * 0.5, 0.3 + rnd() * 0.35, out.z * 0.8 + (rnd() - 0.5) * 0.5).normalize();
      var t1 = V(0, 1, 0).cross(ax); if (t1.lengthSq() < 1e-4) t1.set(1, 0, 0); t1.normalize(); var t2 = ax.clone().cross(t1);
      var ph0 = rnd() * Math.PI * 2;
      for (var k = 0; k < nl && n < LN; k++) {
        var ph = ph0 + k * Math.PI * 2 / nl + (rnd() - 0.5) * 0.5, be = 0.8 + rnd() * 0.6;
        by.copy(ax).multiplyScalar(Math.cos(be)).addScaledVector(t1, Math.sin(be) * Math.cos(ph)).addScaledVector(t2, Math.sin(be) * Math.sin(ph)).normalize();
        bz.copy(UP).addScaledVector(by, -UP.dot(by)); if (bz.lengthSq() < 1e-4) bz.set(0, 0, 1); bz.normalize();
        bz.applyAxisAngle(by, (rnd() - 0.5) * 1.1);
        bx.crossVectors(by, bz).normalize();
        m4.makeBasis(bx, by, bz); var s = 1.0 + rnd() * 0.4; m4.scale(sc.set(s, s, s)); m4.setPosition(p.x, p.y, p.z);
        leaves.setMatrixAt(n, m4);
        col.setHSL(0.25 + rnd() * 0.045, 0.46 + rnd() * 0.16, 0.25 + rnd() * 0.1); leaves.setColorAt(n, col);
        G.leafPts.push([p.x + by.x * 0.1, p.y + by.y * 0.1, p.z + by.z * 0.1]); n++;
      }
    }
    tips.forEach(function (tp) {
      var out = tp.end.clone().setY(0).normalize();
      for (var k = 0; k < 8; k++) spur(tp.c3.getPointAt(0.12 + 0.88 * k / 7), out, 5 + Math.floor(rnd() * 3));
    });
    twigs.forEach(function (cw) { var out = cw.getPointAt(1).setY(0).normalize(); spur(cw.getPointAt(1), out, 6 + Math.floor(rnd() * 2)); spur(cw.getPointAt(0.55), out, 5); spur(cw.getPointAt(0.2), out, 4); });
    sec.forEach(function (c2) { var out = c2.getPointAt(1).setY(0).normalize(); for (var k = 0; k < 5; k++) spur(c2.getPointAt(0.3 + 0.7 * k / 4), out, 5); });
    scaf.forEach(function (c1) { var out = c1.getPointAt(1).setY(0).normalize(); for (var k = 0; k < 2; k++) spur(c1.getPointAt(0.75 + 0.2 * k), out, 4); });
    leaves.count = n; leaves.instanceMatrix.needsUpdate = true; if (leaves.instanceColor) leaves.instanceColor.needsUpdate = true;
    leaves.userData.part = 'leaf'; tree.add(leaves); G.pick.push(leaves);
    G.leafBase = []; for (var lb = 0; lb < n; lb++) { leaves.getColorAt(lb, col); G.leafBase.push([col.r, col.g, col.b]); }
    G.nLeaves = n;
    // the leaf cluster nearest the camera at the start carries the labels and the leaf callout leader
    var best = 0; tips.forEach(function (tp, i) { var w = tp.end.clone().applyAxisAngle(V(0, 1, 0), S.yaw); if (w.z + w.y * 0.2 > tips[best].end.clone().applyAxisAngle(V(0, 1, 0), S.yaw).z + tips[best].end.y * 0.2) best = i; });
    G.leafAnchor = tips[best].end.clone();
    G.abaAnchor = tips[(best + 5) % tips.length].end.clone();
    G.scafMid = scaf[0].getPointAt(0.55).add(V(0.12, 0, 0));

    /* fruit: young almonds, velvety green hulls */
    var FN = 14, fg = disp(M.superEllipsoid(0.045, 0.062, 0.042, 0.9, 8, 6));
    mats.fruit = new T.MeshStandardMaterial({ color: 0x9fbf62, roughness: 0.75, emissive: 0x141e06 }); M.lin(mats.fruit); M.rim(mats.fruit, 0xf0ffc0, 2, 0.4);
    var fruit = new T.InstancedMesh(fg, mats.fruit, FN); G.fruitPts = [];
    for (var f = 0; f < FN; f++) {
      var tp = tips[f % tips.length], p = tp.c3.getPointAt(0.35 + 0.3 * rnd()).add(V((rnd() - 0.5) * 0.08, -0.07, (rnd() - 0.5) * 0.08));
      m4.compose(p, qt.setFromEuler(eu.set(rnd() * 0.5, rnd() * 3, rnd() * 0.5)), sc.set(1, 1, 1)); fruit.setMatrixAt(f, m4); G.fruitPts.push({ p: p, tip: f % tips.length });
    }
    fruit.userData.part = 'fruit'; tree.add(fruit); G.pick.push(fruit);
    G.fruitAnchor = G.fruitPts[0].p.clone();

    /* routes: water up (soil → root tip → trunk → branch → leaf cluster); sugars down the same routes and to fruit */
    function sample(c, k, a, b) { var out = []; for (var i = 0; i <= k; i++) { var p = c.getPointAt(lerp(a, b, i / k)); out.push([p.x, p.y, p.z]); } return out; }
    G.routes = tips.map(function (tp, i) {
      var rt = rootTips[i % rootTips.length], soilPt = rt.end.clone().add(V((rnd() - 0.5) * 0.5, -0.1, (rnd() - 0.5) * 0.5));
      var pts = [[soilPt.x, soilPt.y, soilPt.z]]
        .concat(sample(rt.c2, 3, 1, 0)).concat(sample(rt.c1, 4, 1, 0).slice(1))
        .concat(sample(trunkC, 4, 0, 1).slice(1)).concat(sample(tp.c1, 4, 0, 1).slice(1)).concat(sample(tp.c2, 3, 0, 1).slice(1)).concat(sample(tp.c3, 3, 0, 1).slice(1));
      var poly = M.polyline(pts);
      // where the soil stops and the trunk starts along this route (for the Ψ colour of the beads)
      var sRoot = M.polyline(pts.slice(0, 9)).total;
      return { poly: poly, sRoot: sRoot, sTrunk: sRoot + M.polyline(pts.slice(8, 13)).total, tip: i };
    });
    G.rootAnchor = rootTips[1].c1.getPointAt(0.6);

    /* particles */
    G.water = beads(T, M, 150, 0x4aa8ff, 0.2); tree.add(G.water.obj); ctx.disp.push(G.water.geo, G.water.mat, G.water.glow);
    G.vap = beads(T, M, 60, M.idColor ? M.idColor('h2o') : 0xf2f8ff, 0.24); G.vap.mat.opacity = 0.55; tree.add(G.vap.obj); ctx.disp.push(G.vap.geo, G.vap.mat); // v19: water's identity colour
    G.co2 = beads(T, M, 60, M.idColor ? M.idColor('co2') : 0x9aa0a6, 0.36); G.co2.mat.opacity = 1; tree.add(G.co2.obj); ctx.disp.push(G.co2.geo, G.co2.mat); // v19: CO2 in from the air
    G.sug = beads(T, M, 90, 0xffbf3a, 0.19); tree.add(G.sug.obj); ctx.disp.push(G.sug.geo, G.sug.mat);
    G.aba = beads(T, M, 50, 0xb07cff, 0.22); tree.add(G.aba.obj); ctx.disp.push(G.aba.geo, G.aba.mat);
    G.wB = []; for (var w = 0; w < 150; w++) G.wB.push({ r: w % G.routes.length, s: rnd() * G.routes[w % G.routes.length].poly.total, k: 0.85 + rnd() * 0.3 });
    G.vB = []; for (var v = 0; v < 60; v++) G.vB.push({ l: Math.floor(rnd() * n), s: rnd(), dx: (rnd() - 0.5) * 0.4, dz: (rnd() - 0.5) * 0.4 });
    G.cB = []; for (var cq = 0; cq < 60; cq++) G.cB.push({ l: Math.floor(rnd() * n), s: rnd(), dx: (rnd() - 0.5) * 0.7, dz: (rnd() - 0.5) * 0.7 });
    G.sB = []; for (var s2 = 0; s2 < 90; s2++) { var toFruit = s2 % 3 === 0; G.sB.push({ r: s2 % G.routes.length, s: rnd(), fruit: toFruit, f: Math.floor(rnd() * FN) }); }
    G.aB = []; for (var a3 = 0; a3 < 50; a3++) G.aB.push({ l: Math.floor(rnd() * n), s: rnd(), ph: rnd() * 6 });

    /* named molecules riding the same paths (the ANTI CLUTTER RULE picks at most 2 per kind, 1 on phones) */
    var gl = G.gly = glyphs(T, M); disp(gl.suc); disp(gl.sor); disp(gl.aba);
    var wGeo = disp(M.waterGeo(T, 0.09));
    mats.mol = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.28, emissive: 0x101010 });
    G.named = [];
    function named(kind, geo, text, sc0, parent) { var o = new T.Mesh(geo, mats.mol); o.scale.setScalar(sc0); o.userData = { kind: kind, text: text }; parent.add(o); G.named.push(o); return o; }
    G.nW = [named('w', wGeo, 'H₂O', 1, tree), named('w', wGeo, 'H₂O', 1, tree)];
    G.nW[0].userData.route = 0; G.nW[0].userData.s = 0.1; G.nW[1].userData.route = 6; G.nW[1].userData.s = 0.55;
    // T1 (fix round, sheet rule "never sucrose alone"): sugars travel as PAIRS, a sucrose and a sorbitol side by side,
    // under ONE name tag "sucrose, sorbitol" (kind 'sug'), so the label placer can never show sucrose without sorbitol.
    G.nS = [named('sug', gl.suc, 'sucrose, sorbitol', 0.075, tree), named('sugp', gl.sor, '', 0.075, tree), named('sug', gl.suc, 'sucrose, sorbitol', 0.075, tree), named('sugp', gl.sor, '', 0.075, tree)];
    G.nS[0].userData.route = 3; G.nS[0].userData.s = 0.2; G.nS[2].userData.route = 9; G.nS[2].userData.s = 0.6;
    G.nS[1].userData.lead = G.nS[0]; G.nS[3].userData.lead = G.nS[2];
    G.nA = [named('aba', gl.aba, 'ABA', 0.08, tree)];

    var stages = [function () { buildCallouts(ctx, S); }, function () { buildFarNear(ctx, S); }, function () {
      S.built = true; G.xyCol = new Float32Array(G.coreG.attributes.color.array.length);
      applyLayer(ctx, S); colourCore(S); if (S.setLabels) S.setLabels(); if (S.sync) S.sync();
      frame(ctx, S, 0, 0);
    }];
    return stages;
  }

  function buildCallouts(ctx, S) {
    var T = ctx.THREE, M = window.WP.macro, mats = ctx.mats, G = S.g, rnd = seeded(77), disp = function (g) { ctx.disp.push(g); return g; };
    var V = function (x, y, z) { return new T.Vector3(x, y, z); };
    G.cal = new T.Group(); ctx.root.add(G.cal);

    /* A. trunk block with a quarter cut away (14 Oct rebuild, LOOK CLOSER): from the centre out, heartwood (opaque,
       rings), sapwood (glass, rings) with xylem vessels as tubes, cambium (a thin green glass sheet), phloem (glass) with
       sieve tubes, sieve plates and companion cells, and bark (textured). Rays run from the xylem into the phloem.
       The vessels and sieve tubes on the two cut faces are sliced open lengthwise, so the beads inside are in plain view.
       Widths and cell sizes are drawn far larger than real. */
    var tc = G.tc = new T.Group(); G.cal.add(tc);
    var RB = G.RB = { hw: [0, 0.22], sw: [0.22, 0.49], cb: [0.49, 0.515], ph: [0.515, 0.635], bk: [0.635, 0.74] };
    var fc = Math.PI / 2, f0 = fc + Math.PI / 4, f1 = fc - Math.PI / 4 + Math.PI * 2; // the solid arc runs f0 → f1; the cut quarter faces +z
    var H0 = -0.55, H1 = 0.55;
    G.tcF = { f0: f0, f1: f1, H0: H0, H1: H1 };
    // unit vectors pointing out of each cut face into the open quarter; the sliced pipes sit just proud of the face
    var NF = [[Math.sin(f0), -Math.cos(f0)], [-Math.sin(f1), Math.cos(f1)]];
    function onFace(r, face, lift) { var f = face ? f1 : f0; return [r * Math.cos(f) + NF[face][0] * lift, r * Math.sin(f) + NF[face][1] * lift]; }
    G.onFace = onFace;
    function ringBand(r0, r1, cA, cB, nR, opt) {
      var sx = new Sector(), A = hexRGB(cA), B = hexRGB(cB);
      for (var i = 0; i < nR; i++) {
        var a = lerp(r0, r1, i / nR), b = lerp(r0, r1, (i + 1) / nR), c = i % 2 ? B : A, sg = Math.max(6, Math.round(26 * b));
        sx.cap(a, b, f0, f1, H1, true, c, sg); sx.cap(a, b, f0, f1, H0, false, c, sg);
        sx.face(a, b, f0, H0, H1, c); sx.face(a, b, f1, H0, H1, c);
      }
      if (opt && opt.outer) sx.wall(r1, f0, f1, H0, H1, A, 30);
      if (opt && opt.inner) sx.wall(r0, f0, f1, H0, H1, A, 30);
      return disp(sx.geo(T));
    }
    mats.tcHw = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.62, side: T.DoubleSide, emissive: 0x0c0804 }); M.rim(mats.tcHw, 0xffe0b0, 2.4, 0.3);
    var hw = new T.Mesh(ringBand(RB.hw[0], RB.hw[1], 0x8a5a2b, 0x74461f, 6), mats.tcHw); hw.userData.part = 'heartwood'; tc.add(hw); G.pick.push(hw);
    mats.tcSw = M.glass(T, 0xffffff, { opacity: 0.3, roughness: 0.45, clearcoat: 0.3, ccr: 0.4, emissive: 0x1a1408, ei: 0.4, rimColor: 0xfff2d0, rimK: 0.5, side: T.DoubleSide, env: 0.15 });
    mats.tcSw.vertexColors = true;
    var sw = new T.Mesh(ringBand(RB.sw[0], RB.sw[1], 0xf3e6c4, 0xe4d0a2, 5), mats.tcSw); sw.renderOrder = 9; sw.userData.part = 'sapwood'; tc.add(sw); G.pick.push(sw);
    mats.tcCb = M.glass(T, 0x9be07a, { opacity: 0.72, roughness: 0.2, emissive: 0x2c6a14, ei: 0.8, rimColor: 0xd8ffb0, rimK: 0.8, side: T.DoubleSide });
    var cb = new T.Mesh(ringBand(RB.cb[0], RB.cb[1], 0x9be07a, 0x9be07a, 1, { outer: true }), mats.tcCb); cb.renderOrder = 10; cb.userData.part = 'cambium'; tc.add(cb); G.pick.push(cb);
    mats.tcPh = M.glass(T, 0xf7e4a8, { opacity: 0.24, roughness: 0.45, clearcoat: 0.3, ccr: 0.4, emissive: 0x2a1c04, ei: 0.4, rimColor: 0xfff0c0, rimK: 0.5, side: T.DoubleSide, env: 0.15 });
    var ph = new T.Mesh(ringBand(RB.ph[0], RB.ph[1], 0xf7e4a8, 0xf7e4a8, 1), mats.tcPh); ph.renderOrder = 11; ph.userData.part = 'phloem'; tc.add(ph); G.pick.push(ph);
    mats.tcBk = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, side: T.DoubleSide, emissive: 0x0a0604 }); M.rim(mats.tcBk, 0xffd8a8, 2.4, 0.3);
    var bk = new T.Mesh(ringBand(RB.bk[0], RB.bk[1], 0x5e3e22, 0x4e321b, 2, { inner: true }), mats.tcBk); bk.userData.part = 'bark'; tc.add(bk); G.pick.push(bk);
    // the outside of the bark, textured: CylinderGeometry theta = π/2 − f, so the solid arc is thetaStart −7π/4, length 3π/2
    mats.tcBkO = new T.MeshStandardMaterial({ map: G.barkTex, bumpMap: G.barkTex, bumpScale: 0.02, roughness: 0.9, color: 0xffffff, side: T.DoubleSide });
    M.lin(mats.tcBkO); M.rim(mats.tcBkO, 0xffd8a8, 2.4, 0.25);
    var bkO = new T.Mesh(disp(new T.CylinderGeometry(RB.bk[1], RB.bk[1], H1 - H0, 40, 1, true, -7 * Math.PI / 4, 3 * Math.PI / 2)), mats.tcBkO);
    bkO.userData.part = 'bark'; tc.add(bkO); G.pick.push(bkO);

    // xylem vessels: tubes through the glass sapwood; on the two cut faces, half tubes sliced open lengthwise
    var vR = 0.019, vH = H1 - H0 - 0.012;
    mats.ves = M.glass(T, 0x5aa6ee, { opacity: 0.66, roughness: 0.12, emissive: 0x0c3460, ei: 0.8, rimColor: 0xbfe2ff, rimK: 1.0, side: T.DoubleSide });
    var vIn = [], vFace = [];
    [0.265, 0.33, 0.395, 0.455].forEach(function (r, ri) {
      var step = 0.085 / r, fA = f0 + 0.07 + (ri % 2) * step * 0.5;
      for (var f = fA; f < f1 - 0.06; f += step) vIn.push({ r: r + (rnd() - 0.5) * 0.012, f: f + (rnd() - 0.5) * step * 0.3 });
    });
    [0.26, 0.31, 0.36, 0.41, 0.46].forEach(function (r) { vFace.push({ r: r, face: 0 }, { r: r, face: 1 }); });
    var vesG = disp(new T.CylinderGeometry(vR, vR, vH, 9, 1, true));
    var vesI = new T.InstancedMesh(vesG, mats.ves, vIn.length), mt = new T.Matrix4();
    vIn.forEach(function (v, i) { mt.makeTranslation(v.r * Math.cos(v.f), 0, v.r * Math.sin(v.f)); vesI.setMatrixAt(i, mt); });
    vesI.renderOrder = 6; vesI.userData.part = 'vessel'; tc.add(vesI); G.pick.push(vesI);
    // half tubes on the faces: the half inside the wood (face f0: directions f0 to f0 + π; face f1: f1 − π to f1)
    function halfCyl(rad, h, face, segs) { var fa = face ? f1 - Math.PI : f0; return disp(new T.CylinderGeometry(rad, rad, h, segs || 8, 1, true, -Math.PI / 2 - fa, Math.PI)); }
    function halfDisc(rad, face) { var fa = face ? f1 - Math.PI : f0, g = new T.CircleGeometry(rad, 8, -fa - Math.PI, Math.PI); g.rotateX(-Math.PI / 2); return disp(g); }
    var vHalf = [halfCyl(vR * 1.25, vH, 0, 10), halfCyl(vR * 1.25, vH, 1, 10)];
    G.vFace = vFace;
    mats.vesF = M.glass(T, 0x2f7fd0, { opacity: 0.85, roughness: 0.2, emissive: 0x0c3460, ei: 0.9, rimColor: 0x9fd0ff, rimK: 1.1, side: T.DoubleSide, env: 0.3, depthWrite: true });
    var vLift = vR * 1.1;
    vFace.forEach(function (v) { var o = new T.Mesh(vHalf[v.face], mats.vesF), q = onFace(v.r, v.face, vLift); o.position.set(q[0], 0, q[1]); o.renderOrder = 6; o.userData.part = 'vessel'; tc.add(o); G.pick.push(o); });
    // vessel openings on the top face (dark rims show the pipes in cross section)
    mats.vesTop = new T.MeshBasicMaterial({ color: 0x1d4f86, transparent: true, opacity: 0.85, side: T.DoubleSide, depthWrite: false });
    var ringG = disp(new T.RingGeometry(vR * 0.55, vR * 1.15, 8)); ringG.rotateX(-Math.PI / 2);
    var vTop = new T.InstancedMesh(ringG, mats.vesTop, vIn.length);
    vIn.forEach(function (v, i) { mt.makeTranslation(v.r * Math.cos(v.f), H1 + 0.003, v.r * Math.sin(v.f)); vTop.setMatrixAt(i, mt); });
    vTop.renderOrder = 10; tc.add(vTop);

    // rays: short radial ribbons of living cells from the xylem across the cambium into the phloem (Pfautsch et al. 2015)
    mats.ray = new T.MeshStandardMaterial({ color: 0xd99a5a, roughness: 0.8, emissive: 0x5a3010, emissiveIntensity: 0.6, envMapIntensity: 0.15 }); M.lin(mats.ray);
    var rayG = disp(new T.BoxGeometry(1, 1, 1)), nRay = 40, rays = new T.InstancedMesh(rayG, mats.ray, nRay), rq = new T.Quaternion(), rs = new T.Vector3(), rp = new T.Vector3();
    for (var ry = 0; ry < nRay; ry++) {
      var fRay = lerp(f0 + 0.05, f1 - 0.05, (ry + rnd() * 0.6) / nRay), r0r = 0.24, r1r = 0.6, yRay = ry % 5 === 0 ? H1 - 0.012 : lerp(H0 + 0.05, H1 - 0.05, rnd());
      rp.set((r0r + r1r) / 2 * Math.cos(fRay), yRay, (r0r + r1r) / 2 * Math.sin(fRay)); rq.setFromAxisAngle(V(0, 1, 0), -fRay); rs.set(r1r - r0r, 0.026, 0.011);
      mt.compose(rp, rq, rs); rays.setMatrixAt(ry, mt);
    }
    rays.renderOrder = 6; rays.userData.part = 'rays'; tc.add(rays); G.pick.push(rays);
    G.rayPt = V(0.42 * Math.cos(f0 + 0.05), H1 - 0.012, 0.42 * Math.sin(f0 + 0.05));

    // phloem: sieve tubes (gold glass) of sieve elements joined by sieve plates; a companion cell beside each element
    var sR = 0.017, sRad = 0.556, cRad = 0.597, elemH = 0.157, nEl = Math.round((H1 - H0) / elemH);
    mats.sieve = M.glass(T, 0xffcf5a, { opacity: 0.5, roughness: 0.15, emissive: 0x4a3008, ei: 0.7, rimColor: 0xfff0b8, rimK: 0.9, side: T.DoubleSide });
    var pT = plateTex(T); ctx.disp.push(pT);
    mats.plate = new T.MeshStandardMaterial({ map: pT, roughness: 0.4, side: T.DoubleSide, transparent: true, opacity: 0.95, emissive: 0x3a2404, emissiveIntensity: 0.6 }); M.lin(mats.plate);
    mats.cc = M.glass(T, 0x8fd06a, { opacity: 0.75, roughness: 0.2, emissive: 0x1f4a10, ei: 0.7, rimColor: 0xe0ffc0, rimK: 0.8, side: T.DoubleSide });
    var sIn = []; { var st = 0.13 / sRad; for (var sf = f0 + 0.1; sf < f1 - 0.08; sf += st) sIn.push(sf + (rnd() - 0.5) * st * 0.2); }
    G.sIn = sIn;
    var sieG = disp(new T.CylinderGeometry(sR, sR, H1 - H0 - 0.012, 9, 1, true)), sie = new T.InstancedMesh(sieG, mats.sieve, sIn.length);
    sIn.forEach(function (f, i) { mt.makeTranslation(sRad * Math.cos(f), 0, sRad * Math.sin(f)); sie.setMatrixAt(i, mt); });
    sie.renderOrder = 6; sie.userData.part = 'sievetube'; tc.add(sie); G.pick.push(sie);
    var plG = disp(new T.CircleGeometry(sR * 0.97, 10)); plG.rotateX(-Math.PI / 2);
    var plates = new T.InstancedMesh(plG, mats.plate, sIn.length * (nEl - 1)), np = 0;
    var ccG = disp(new T.CylinderGeometry(0.0085, 0.0085, elemH * 0.8, 6, 1, true)), ccI = new T.InstancedMesh(ccG, mats.cc, sIn.length * nEl), nc = 0, nuc = [];
    sIn.forEach(function (f) {
      for (var e = 0; e < nEl; e++) {
        var yC = H0 + (e + 0.5) * elemH;
        if (e > 0) { mt.makeTranslation(sRad * Math.cos(f), H0 + e * elemH, sRad * Math.sin(f)); plates.setMatrixAt(np++, mt); }
        var fcc = f + (e % 2 ? 0.012 : -0.012);
        mt.makeTranslation(cRad * Math.cos(fcc), yC, cRad * Math.sin(fcc)); ccI.setMatrixAt(nc++, mt);
        nuc.push([cRad * Math.cos(fcc), yC + 0.02, cRad * Math.sin(fcc)]);
      }
    });
    plates.count = np; plates.renderOrder = 7; plates.userData.part = 'sieveplate'; tc.add(plates); G.pick.push(plates);
    ccI.count = nc; ccI.renderOrder = 6; ccI.userData.part = 'companion'; tc.add(ccI); G.pick.push(ccI);
    // the two sieve tubes and their companion cells on the cut faces, sliced open
    mats.sieveF = M.glass(T, 0xf0b030, { opacity: 0.8, roughness: 0.15, emissive: 0x5a3a08, ei: 0.8, rimColor: 0xfff0b8, rimK: 1.0, side: T.DoubleSide, depthWrite: true });
    mats.ccF = M.glass(T, 0x7cc455, { opacity: 0.85, roughness: 0.2, emissive: 0x1f4a10, ei: 0.7, rimColor: 0xe0ffc0, rimK: 0.8, side: T.DoubleSide, depthWrite: true });
    var sHalf = [halfCyl(sR * 1.3, H1 - H0 - 0.012, 0, 10), halfCyl(sR * 1.3, H1 - H0 - 0.012, 1, 10)], pHalf = [halfDisc(sR * 1.27, 0), halfDisc(sR * 1.27, 1)];
    var ccHalf = [halfCyl(0.0095, elemH * 0.8, 0, 8), halfCyl(0.0095, elemH * 0.8, 1, 8)];
    G.plateY = [];
    [0, 1].forEach(function (face) {
      var f = face ? f1 : f0, qs = onFace(sRad, face, sR * 1.2), qc = onFace(cRad, face, 0.009), o = new T.Mesh(sHalf[face], mats.sieveF); o.position.set(qs[0], 0, qs[1]); o.renderOrder = 6; o.userData.part = 'sievetube'; tc.add(o); G.pick.push(o);
      for (var e = 0; e < nEl; e++) {
        if (e > 0) { var pl = new T.Mesh(pHalf[face], mats.plate); pl.position.set(qs[0], H0 + e * elemH, qs[1]); pl.renderOrder = 7; pl.userData.part = 'sieveplate'; tc.add(pl); G.pick.push(pl); if (!face) G.plateY.push(H0 + e * elemH); }
        var c = new T.Mesh(ccHalf[face], mats.ccF); c.position.set(qc[0], H0 + (e + 0.5) * elemH, qc[1]); c.renderOrder = 6; c.userData.part = 'companion'; tc.add(c); G.pick.push(c);
        nuc.push([qc[0] + NF[face][0] * 0.004, H0 + (e + 0.5) * elemH + 0.02, qc[1] + NF[face][1] * 0.004]);
      }
    });
    var nucP = M.balls(T, nuc, 0x3c2a6a, 0.022); nucP.renderOrder = 8; tc.add(nucP); ctx.disp.push(nucP.geometry, nucP.material);
    G.tcGeom = { vR: vR, sR: sR, sRad: sRad, cRad: cRad, elemH: elemH, nEl: nEl, vIn: vIn };
    G.bandPt = function (r, y, face) { var f = face ? f1 + 0.012 : f0 - 0.012; return V(r * Math.cos(f), y == null ? H1 : y, r * Math.sin(f)); };
    G.tcFaces = [{ f: f0, dir: -1 }, { f: f1, dir: 1 }]; // dir points from each cut face into the open quarter
    // beads: water up every vessel (4 per face vessel, 1 per inner vessel); sugar down every sieve tube
    var nWB = vFace.length * 4 + vIn.length, nSB = 2 * 5 + sIn.length;
    G.tcW = beads(T, M, nWB, 0x4aa8ff, 0.05); tc.add(G.tcW.obj); ctx.disp.push(G.tcW.geo, G.tcW.mat);
    G.tcS = beads(T, M, nSB, 0xffbf3a, 0.058); tc.add(G.tcS.obj); ctx.disp.push(G.tcS.geo, G.tcS.mat);
    G.tcWB = [];
    vFace.forEach(function (v) { var q = onFace(v.r, v.face, vR * 1.1); for (var k = 0; k < 4; k++) G.tcWB.push({ x: q[0], z: q[1], y: (k + rnd() * 0.5) / 4, k: 0.85 + rnd() * 0.3 }); });
    vIn.forEach(function (v) { G.tcWB.push({ x: v.r * Math.cos(v.f), z: v.r * Math.sin(v.f), y: rnd(), k: 0.85 + rnd() * 0.3 }); });
    G.tcSB = [];
    [0, 1].forEach(function (face) { var q = onFace(sRad, face, sR * 1.2); for (var k = 0; k < 5; k++) G.tcSB.push({ x: q[0], z: q[1], y: (k + rnd() * 0.4) / 5 }); });
    sIn.forEach(function (f) { G.tcSB.push({ x: sRad * Math.cos(f), z: sRad * Math.sin(f), y: rnd() }); });
    var wGeo = disp(M.waterGeo(T, 0.05));
    function named(kind, geo, text, sc0, parent) { var o = new T.Mesh(geo, mats.mol); o.scale.setScalar(sc0); o.userData = { kind: kind, text: text }; parent.add(o); G.named.push(o); return o; }
    G.tcN = [named('w', wGeo, 'H₂O', 0.3, tc), named('sug', G.gly.suc, 'sucrose, sorbitol', 0.0105, tc), named('sugp', G.gly.sor, '', 0.0105, tc)]; // T1: one pair, one tag

    /* B. leaf block: cut face toward the camera, stomata on the LOWER side */
    var lc = G.lc = new T.Group(); G.cal.add(lc);
    var cell = function (rx, ry, rz, ws, hs) { return disp(M.superEllipsoid(rx, ry, rz, 0.55, ws || 10, hs || 7)); };
    mats.epi = M.glass(T, 0xe9f2d8, { opacity: 0.4, roughness: 0.2, emissive: 0x141a10, ei: 0.5, rimColor: 0xf4ffe0, rimK: 0.8 });
    mats.pal = M.glass(T, 0x7fc35a, { opacity: 0.5, roughness: 0.25, emissive: 0x16300a, ei: 0.7, rimColor: 0xc8ff9a, rimK: 0.7 });
    mats.spo = M.glass(T, 0x9ccf74, { opacity: 0.42, roughness: 0.25, emissive: 0x14280a, ei: 0.6, rimColor: 0xd8ffb0, rimK: 0.7 });
    mats.guard = M.glass(T, 0x6fae4a, { opacity: 0.8, roughness: 0.2, emissive: 0x1c3a0c, ei: 0.8, rimColor: 0xe0ffb0, rimK: 0.8, depthWrite: true });
    mats.cut = M.glass(T, 0xfff0b8, { opacity: 0.55, roughness: 0.1, emissive: 0x2a2208, ei: 0.5, rimColor: 0xfff4d0, rimK: 0.6 });
    mats.xyl = new T.MeshBasicMaterial({ color: 0x4aa0ec, transparent: true, opacity: 0.85, toneMapped: false });
    mats.phlL = new T.MeshBasicMaterial({ color: 0xffc44d, transparent: true, opacity: 0.85, toneMapped: false });
    var epiG = cell(0.072, 0.036, 0.27, 8, 6);
    function place(geo, mat, x, y, z, part, sx0) { var o = new T.Mesh(geo, mat); o.position.set(x, y, z); if (sx0) o.scale.setScalar(sx0); o.userData.part = part; lc.add(o); G.pick.push(o); return o; }
    var cu = new T.Mesh(disp(new T.BoxGeometry(1.42, 0.014, 0.58)), mats.cut); cu.position.set(0, 0.228, 0); cu.userData.part = 'palisade'; lc.add(cu);
    for (var e = 0; e < 9; e++) place(epiG, mats.epi, -0.64 + e * 0.16, 0.185, 0, 'palisade');
    var palG = cell(0.062, 0.1, 0.25);
    for (var p = 0; p < 8; p++) place(palG, mats.pal, -0.56 + p * 0.16, 0.06, 0, 'palisade');
    var spoG = cell(0.1, 0.055, 0.24);
    [[-0.58, -0.07], [-0.36, -0.12], [0.31, -0.08], [0.55, -0.11], [-0.15, -0.1], [0.4, -0.02], [-0.52, -0.01]].forEach(function (s) { place(spoG, mats.spo, s[0], s[1], 0, 'spongy'); });
    // vein: bundle sheath ring, xylem (blue) above phloem (gold)
    var bsG = cell(0.032, 0.032, 0.25, 8, 5);
    for (var k = 0; k < 8; k++) { var aa = k / 8 * Math.PI * 2; place(bsG, mats.epi, 0.05 + Math.cos(aa) * 0.085, -0.04 + Math.sin(aa) * 0.075, 0, 'vein'); }
    var xg = disp(new T.CylinderGeometry(0.03, 0.03, 0.56, 10, 1)); xg.rotateX(Math.PI / 2);
    var pg = disp(new T.CylinderGeometry(0.024, 0.024, 0.56, 10, 1)); pg.rotateX(Math.PI / 2);
    place(xg, mats.xyl, 0.05, -0.02, 0, 'vein'); G.lPhl = place(pg, mats.phlL, 0.05, -0.08, 0, 'vein');
    // lower epidermis with two stomata (guard cell pairs)
    G.lcSt = [-0.34, 0.37]; G.fc = { st: G.lcSt };
    for (var le = 0; le < 9; le++) { var xx = -0.64 + le * 0.16; if (G.lcSt.some(function (s) { return Math.abs(s - xx) < 0.1; })) continue; place(epiG, mats.epi, xx, -0.185, 0, 'spongy'); }
    var gcG = cell(0.034, 0.03, 0.1, 10, 7);
    G.guards = [];
    G.lcSt.forEach(function (sx1) { [-1, 1].forEach(function (sg) { var g = place(gcG, mats.guard, sx1 + sg * 0.05, -0.19, 0.14, 'stoma'); g.userData.sx = sx1; g.userData.sg = sg; G.guards.push(g); }); });
    // chloroplasts (zero triangles)
    var chl = []; for (var c = 0; c < 70; c++) { var cx = -0.6 + rnd() * 1.2, cy = rnd() < 0.7 ? 0.0 + rnd() * 0.13 : -0.13 + rnd() * 0.1; chl.push([cx, cy, 0.18 + rnd() * 0.08]); }
    var chP = M.balls(T, chl, 0x2f8a2a, 0.035); lc.add(chP); ctx.disp.push(chP.geometry, chP.material);
    G.lcW = beads(T, M, 30, 0x4aa8ff, 0.09); lc.add(G.lcW.obj); ctx.disp.push(G.lcW.geo, G.lcW.mat);
    G.lcV = beads(T, M, 30, M.idColor ? M.idColor('h2o') : 0xf2f8ff, 0.1); G.lcV.mat.opacity = 0.6; lc.add(G.lcV.obj); ctx.disp.push(G.lcV.geo, G.lcV.mat);
    G.lcC = beads(T, M, 24, M.idColor ? M.idColor('co2') : 0x9aa0a6, 0.13); G.lcC.mat.opacity = 0.9; lc.add(G.lcC.obj); ctx.disp.push(G.lcC.geo, G.lcC.mat); // v19: CO2 in through the stomata
    G.lcCB = []; for (var lq = 0; lq < 24; lq++) G.lcCB.push({ st: lq % 2, s: rnd(), j: (rnd() - 0.5) * 0.08, dz: 0.1 + rnd() * 0.16 });
    G.lcA = beads(T, M, 20, 0xb07cff, 0.1); lc.add(G.lcA.obj); ctx.disp.push(G.lcA.geo, G.lcA.mat);
    G.lcS = beads(T, M, 12, 0xffbf3a, 0.08); lc.add(G.lcS.obj); ctx.disp.push(G.lcS.geo, G.lcS.mat);
    G.lcWB = []; for (var lw = 0; lw < 30; lw++) G.lcWB.push({ st: lw % 2, s: rnd(), dz: 0.12 + rnd() * 0.14, j: (rnd() - 0.5) * 0.06 });
    G.lcAB = []; for (var la = 0; la < 20; la++) G.lcAB.push({ st: la % 2, s: rnd(), x0: -0.55 + rnd() * 1.1, y0: -0.12 + rnd() * 0.22, z: 0.2 + rnd() * 0.08 });
    G.lcSB = []; for (var ls = 0; ls < 12; ls++) G.lcSB.push({ s: rnd(), x0: -0.5 + rnd() * 1.0, y0: 0.05 + rnd() * 0.06 });
    G.lcN = [named('w', wGeo, 'H₂O', 0.6, lc), named('aba', G.gly.aba, 'ABA', 0.032, lc), named('aba', G.gly.aba, 'ABA', 0.032, lc)];

    /* C. root with root hairs in soil */
    var rc = G.rc = new T.Group(); G.cal.add(rc);
    var rcv = new T.QuadraticBezierCurve3(V(-0.75, 0.05, 0), V(0, 0.0, 0), V(0.7, -0.08, 0));
    var rootT = disp(geoFrom(T, [tube(T, rcv, 10, 12, 0.12, 0.035, 0, 1)]));
    mats.rcR = M.glass(T, 0xe8d0a8, { opacity: 0.55, roughness: 0.3, emissive: 0x2a1a08, ei: 0.5, rimColor: 0xfff0d0, rimK: 0.8 });
    var rm = new T.Mesh(rootT, mats.rcR); rm.userData.part = 'root'; rc.add(rm); G.pick.push(rm);
    var stele = new T.Mesh(disp(geoFrom(T, [tube(T, rcv, 10, 6, 0.04, 0.012, 0, 1)])), mats.xyl); rc.add(stele);
    var cap = new T.Mesh(disp(M.superEllipsoid(0.05, 0.04, 0.04, 0.8, 8, 6)), mats.rcR); cap.position.copy(rcv.getPointAt(1)).add(V(0.03, 0, 0)); rc.add(cap);
    var hairG = disp(new T.CylinderGeometry(0.0075, 0.0075, 1, 4, 1)); hairG.translate(0, 0.5, 0);
    mats.hair = M.glass(T, 0xfff4e0, { opacity: 0.75, roughness: 0.2, emissive: 0x2a2418, ei: 0.5, rimColor: 0xffffff, rimK: 0.8 });
    G.hairs = [];
    for (var h = 0; h < 26; h++) {
      var t = 0.38 + 0.42 * (h / 26), base = rcv.getPointAt(t), ang = h * 2.4, len = 0.16 + rnd() * 0.16, rad = lerp(0.12, 0.035, t) * 0.95;
      var dir = V(0.25 * (rnd() - 0.3), Math.cos(ang), Math.sin(ang)).normalize();
      var o = new T.Mesh(hairG, mats.hair); o.position.copy(base).addScaledVector(dir, rad); o.quaternion.setFromUnitVectors(V(0, 1, 0), dir); o.scale.set(1, len, 1);
      o.userData.part = 'roothair'; rc.add(o); G.pick.push(o);
      G.hairs.push({ base: base.clone(), dir: dir, len: len, rad: rad, t: t });
    }
    var sp = []; for (var s3 = 0; s3 < 60; s3++) sp.push([-0.8 + rnd() * 1.6, (rnd() - 0.5) * 0.9, (rnd() - 0.5) * 0.7]);
    var spP = M.balls(T, sp, 0xa07a4a, 0.07); rc.add(spP); ctx.disp.push(spP.geometry, spP.material);
    G.rcW = beads(T, M, 30, 0x4aa8ff, 0.09); rc.add(G.rcW.obj); ctx.disp.push(G.rcW.geo, G.rcW.mat);
    G.rcWB = []; for (var rw = 0; rw < 30; rw++) G.rcWB.push({ h: rw % 26, s: rnd() });
    G.rcv = rcv;
    G.rcN = [named('w', wGeo, 'H₂O', 0.7, rc)];

    /* leader lines from each callout to its place on the tree */
    G.leads = [tc, lc, rc].map(function () {
      var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(new Float32Array(6), 3)); disp(g);
      var l = new T.Line(g, new T.LineDashedMaterial({ color: 0xfff4d0, dashSize: 0.08, gapSize: 0.06, transparent: true, opacity: 0.85 })); l.frustumCulled = false; ctx.root.add(l); return l;
    });
    G.dots = M.halos(T, 3, 0xfff4d0, 0.28); ctx.root.add(G.dots.obj); ctx.disp.push(G.dots.geo, G.dots.mat);
    G.cal.visible = false;
  }

  function buildFarNear(ctx, S) {
    var T = ctx.THREE, M = window.WP.macro, mats = ctx.mats, rnd = seeded(5), disp = function (g) { ctx.disp.push(g); return g; };
    // an orchard behind, out of focus
    mats.farLeaf = new T.MeshStandardMaterial({ color: 0x5f8a3a, roughness: 0.8, emissive: 0x0a1404 }); M.lin(mats.farLeaf);
    mats.farWood = new T.MeshStandardMaterial({ color: 0x5a4028, roughness: 0.9 }); M.lin(mats.farWood);
    mats.farGround = new T.MeshStandardMaterial({ color: 0x8a7a4c, roughness: 1 }); M.lin(mats.farGround);
    var ico = disp(new T.IcosahedronGeometry(1, 1)), trk = disp(new T.CylinderGeometry(0.12, 0.16, 1.2, 6));
    var gnd = new T.Mesh(disp(new T.PlaneGeometry(80, 40)), mats.farGround); gnd.rotation.x = -Math.PI / 2; gnd.position.set(0, -0.02, -16); ctx.far.add(gnd);
    [-15, -22].forEach(function (z, row) {
      for (var i = -3; i <= 3; i++) {
        var g = new T.Group(); g.position.set(i * 4.2 + row * 2.1 + (rnd() - 0.5), 0, z + (rnd() - 0.5));
        var t = new T.Mesh(trk, mats.farWood); t.position.y = 0.6; g.add(t);
        for (var k = 0; k < 3; k++) { var c = new T.Mesh(ico, mats.farLeaf); c.position.set((k - 1) * 0.9, 2.2 + rnd() * 0.6, (rnd() - 0.5) * 0.8); c.scale.set(1.1, 0.8, 1.1); g.add(c); }
        ctx.far.add(g);
      }
    });
    // two out of focus leaves near the lens
    var lg = disp(leafGeo(T));
    mats.nearLeaf = new T.MeshStandardMaterial({ color: 0x6f9a42, roughness: 0.5, side: T.DoubleSide, emissive: 0x0c1806 }); M.lin(mats.nearLeaf);
    [[-4.6, 4.3, 6.5, 0.4, 19], [4.9, -1.4, 6.2, 2.4, 16]].forEach(function (p) { var o = new T.Mesh(lg, mats.nearLeaf); o.position.set(p[0], p[1], p[2]); o.rotation.set(0.6, 0.3, p[3]); o.scale.setScalar(p[4]); ctx.near.add(o); });
  }

  function applyLayer(ctx, S) {
    var G = S.g, L = S.layer; if (!G || !G.water) return;
    ctx.mats.phl.opacity = L >= 2 ? 0.34 : 0;
    G.phl.visible = L >= 2;
    G.sug.obj.visible = L >= 2; G.aba.obj.visible = L >= 3;
    G.nS.forEach(function (o) { o.visible = L >= 2; }); G.nA.forEach(function (o) { o.visible = L >= 3; });
    if (G.tcS) { G.tcS.obj.visible = L >= 2; G.lcS.obj.visible = L >= 2; G.lcA.obj.visible = L >= 3; G.lPhl.visible = L >= 2; G.tcN[1].visible = G.tcN[2].visible = L >= 2; G.lcN[1].visible = G.lcN[2].visible = L >= 3; }
    colourCore(S);
    // leaves dull a little when the soil is dried (the what if)
    var dull = S.dry ? 0.28 : 0, col = new ctx.THREE.Color();
    G.leafBase.forEach(function (c, i) { col.setRGB(lerp(c[0], 0.36, dull), lerp(c[1], 0.36, dull), lerp(c[2], 0.22, dull)); G.leaves.setColorAt(i, col); });
    if (G.leaves.instanceColor) G.leaves.instanceColor.needsUpdate = true;
    var soilC = S.res.psi.soil < -1 ? 0x8a6a44 : 0x5a3e24;
    ctx.mats.soil.color.setHex(soilC).convertSRGBToLinear();
  }
  function psiAt(S, u) {
    var P = S.res.psi;
    if (u <= 0.2) return lerp(P.soil, P.root, u / 0.2);
    if (u <= 0.45) return lerp(P.root, P.stem, (u - 0.2) / 0.25);
    return lerp(P.stem, P.leafOut, (u - 0.45) / 0.55);
  }
  function colourCore(S) {
    var G = S.g; if (!G || !G.coreG) return;
    var uv = G.coreG.attributes.uv.array, ca = G.coreG.attributes.color.array;
    for (var i = 0, j = 0; i < uv.length; i += 2, j += 3) { var c = psiRGB(psiAt(S, uv[i])); ca[j] = Math.pow(c[0], 2.2); ca[j + 1] = Math.pow(c[1], 2.2); ca[j + 2] = Math.pow(c[2], 2.2); }
    G.coreG.attributes.color.needsUpdate = true;
  }

  /* where each magnified block sits when the tree is fully cut open: [x, y, z, scale] and its resting turn */
  var POSE_N = { trunk: [0.1, 1.9, 0.6, 3.3], leaf: [0.05, 2.0, 0.6, 3.9], root: [0.1, 1.9, 0.6, 3.4] };
  var POSE_W = { trunk: [1.15, 1.0, 0.5, 1.75], leaf: [1.55, 3.45, 0.4, 2.95], root: [1.3, -1.45, 0.5, 1.9] };
  var ROT = { trunk: [0.22, -0.55], leaf: [-0.12, -0.42], root: [0.15, -0.35] };
  /* FIX ROUND 1 (14 Oct): while a Look closer chip view is active (orbit engaged on a focus, cut open), the desktop
     shows only the chosen block, as phones already do: the tree, the other blocks and the leader lines leave the stage */
  function solo(ctx, S) { var o = ctx.orbit; return !!(S.cut && o && o.engaged && o.focusId); }
  function layout(ctx, S) {
    var G = S.g, k = S.cutK, e = k * k * (3 - 2 * k), n = ctx.narrow, so = solo(ctx, S);
    if (so !== !!S.solo) { S.solo = so; if (S.setLabels) S.setLabels(); }
    // cut open: the whole tree steps aside and shrinks; the three magnified blocks take the stage (one at a time on phones)
    // T2 (fix round): on phones the tree leaves the stage when it is cut open, so the chosen block fills it;
    // on desktop the leaf block is about 1.4× larger than before (2.1 → 2.95) so the guard cells and ABA read.
    G.tree.position.x = n ? lerp(0, -1.2, e) : lerp(0, -3.75, e);
    G.tree.position.y = n ? lerp(0, 1.2, e) : lerp(0, 0.75, e);
    G.tree.scale.setScalar(n ? Math.max(0.001, 1 - e) : lerp(1, 0.6, e));
    G.tree.visible = !(n && e > 0.97) && !(so && e > 0.5);
    G.cal.visible = k > 0.01;
    var pos = n ? POSE_N : POSE_W;
    [['trunk', G.tc], ['leaf', G.lc], ['root', G.rc]].forEach(function (p) {
      var on = (!n && !so) || S.focus === p[0], o = p[1], q = pos[p[0]];
      o.visible = on && k > 0.01;
      o.position.set(q[0], q[1], q[2]); o.scale.setScalar(q[3] * Math.max(0.001, e));
    });
  }
  /* LOOK CLOSER chips (14 Oct): targets in world space at the block's final, resting pose (so a chip pressed while the
     cut view is still opening flies to the right place). Local points: the open faces of the trunk block, the vein of
     the leaf block, the root hairs of the root block. Viewing angles look into the cut quarter. */
  var _pose = null;
  function blockWorld(S, name, local) {
    var T = window.THREE, ctx = S.ctxRef, q = (ctx && ctx.narrow ? POSE_N : POSE_W)[name], r = ROT[name];
    _pose = _pose || new T.Object3D();
    _pose.position.set(q[0], q[1], q[2]); _pose.rotation.set(r[0], r[1], 0); _pose.scale.setScalar(q[3]); _pose.updateMatrix();
    var v = new T.Vector3(local[0], local[1], local[2]).applyMatrix4(_pose.matrix);
    if (ctx && ctx.root) { ctx.root.updateMatrixWorld(); ctx.root.localToWorld(v); }
    return v;
  }
  function viewAngles(name, dir) {
    // a local viewing direction on a block turned into orbit theta and phi in world space
    var T = window.THREE, r = ROT[name], e = new T.Euler(r[0], r[1], 0), d = new T.Vector3(dir[0], dir[1], dir[2]).normalize().applyEuler(e);
    return { theta: Math.atan2(d.x, d.z), phi: Math.acos(clamp(d.y, -1, 1)) };
  }
  function focusList(S) {
    var f0 = Math.PI * 3 / 4, c = Math.cos(f0), s = Math.sin(f0);
    // looking square onto the f0 cut face from the open quarter: local direction (sin f0, ·, −cos f0), raised a little
    var face = viewAngles('trunk', [Math.sin(f0), 0.42, -Math.cos(f0)]), whole = viewAngles('trunk', [0.15, 0.55, 1]);
    function nar() { return S.ctxRef && S.ctxRef.narrow; }
    return [
      { id: 'trunk', label: 'Trunk inside', target: function () { return blockWorld(S, 'trunk', [0, 0, 0.1]); }, dist: 6.4, theta: whole.theta, phi: whole.phi },
      { id: 'xylem', label: 'Xylem', target: function () { return blockWorld(S, 'trunk', [0.36 * c, 0.12, 0.36 * s]); }, dist: 2.3, theta: face.theta, phi: face.phi },
      { id: 'phloem', label: 'Phloem', target: function () { return blockWorld(S, 'trunk', [0.575 * c, 0.02, 0.575 * s]); }, dist: 1.75, theta: face.theta, phi: face.phi },
      { id: 'leaf', label: 'Leaf', target: function () { return blockWorld(S, 'leaf', [0, -0.05, 0.2]); }, dist: 6.2 },
      { id: 'root', label: 'Root', target: function () { return blockWorld(S, 'root', [0, 0.05, 0]); }, dist: 5.2 }
    ].map(function (f) {
      // phones show one block at a time, drawn about twice as large on a narrow stage: wider camera distances there
      var d0 = f.dist, dn = { trunk: 14, xylem: 5.2, phloem: 3.6, leaf: 8, root: 8 }[f.id];
      Object.defineProperty(f, 'dist', { get: function () { return nar() ? dn : d0; }, enumerable: true });
      return f;
    });
  }
  var _v = null, _w = null;
  function frame(ctx, S, t, dt) {
    var G = S.g; if (!G || !G.routes) return;
    var T = ctx.THREE; _v = _v || new T.Vector3(); _w = _w || new T.Vector3();
    // turn: the user's drag, then a slow drift once left alone (none under reduced motion)
    // 14 Oct: no drift while the user drives the camera (orbit engaged); the cut blocks also settle (S.wob → 0)
    var driving = !!(ctx.orbit && ctx.orbit.engaged);
    if (dt > 0 && !driving && !ctx.reduced && ctx.t - S.lastUser > 5) S.yaw += dt * 0.1;
    var wobT = (driving || ctx.reduced) ? 0 : 1; S.wob = S.wob == null ? wobT : S.wob + (wobT - S.wob) * 0.08; if (Math.abs(wobT - S.wob) < 0.002) S.wob = wobT;
    G.tree.rotation.y = S.yaw;
    var target = S.cut ? 1 : 0;
    if (dt > 0) S.cutK += clamp(target - S.cutK, -dt * 1.4, dt * 1.4); else S.cutK = target;
    if (G.tc) layout(ctx, S);
    var res = S.res, E = Math.max(0, res.E), vW = 0.2 * E + 0.02, open = S.openFrac(), aK = S.abaK();
    // water up
    var A = G.water;
    G.wB.forEach(function (b, i) {
      var R = G.routes[b.r], L = R.poly.total;
      if (dt > 0) { b.s += vW * b.k * dt; if (b.s > L) b.s -= L; }
      R.poly.at(b.s, P3); A.set(i, P3[0], P3[1], P3[2]);
    });
    A.commit();
    // vapour out of the leaf undersides, more when E is high
    var nV = S.gas === 'co2' ? 0 : Math.round(60 * clamp(E / 4, 0.08, 1)), Vp = G.vap;
    G.vB.forEach(function (b, i) {
      if (i >= nV) { Vp.hide(i); return; }
      if (dt > 0) { b.s += dt * (0.25 + 0.1 * E); if (b.s > 1) { b.s -= 1; b.l = (b.l + 37) % G.leafPts.length; } }
      var lp = G.leafPts[b.l]; Vp.set(i, lp[0] + b.dx * b.s, lp[1] - 0.05 - 0.5 * b.s, lp[2] + b.dz * b.s);
    });
    Vp.commit();
    /* v19: CO2 from the air into the leaf undersides, while water leaves. No CO2 rate on this plate: the count follows
       how open the stomata are (model gs), drawn, not to scale (ILLUSTRATIVE) */
    var openK = S.openFrac ? S.openFrac() : 0.5, nC = S.gas === 'water' ? 0 : Math.round(60 * clamp(openK, 0.06, 1)), Cp = G.co2;
    G.cB.forEach(function (b, i) {
      if (i >= nC) { Cp.hide(i); return; }
      if (dt > 0) { b.s += dt * 0.32; if (b.s > 1) { b.s -= 1; b.l = (b.l + 41) % G.leafPts.length; } }
      var lp = G.leafPts[b.l], u = 1 - b.s, e = u * u; Cp.set(i, lp[0] + b.dx * e, lp[1] - 0.06 - 1.05 * u, lp[2] + b.dz * e);
    });
    Cp.commit();
    // sugars down, to the roots and to the fruit
    if (S.layer >= 2) {
      G.sB.forEach(function (b, i) {
        var R = G.routes[b.r], L = R.poly.total;
        if (dt > 0) { b.s += dt * 0.09; if (b.s > 1) b.s -= 1; }
        if (b.fruit) {
          var fp = G.fruitPts[b.f], lp = G.leafPts[(b.f * 31) % G.leafPts.length];
          G.sug.set(i, lerp(lp[0], fp.p.x, b.s), lerp(lp[1], fp.p.y, b.s), lerp(lp[2], fp.p.z, b.s));
        } else { R.poly.at(L * (1 - b.s), P3); G.sug.set(i, P3[0] + 0.012, P3[1], P3[2] + 0.012); }
      });
      G.sug.commit();
    }
    // ABA made in the leaves when leaf Ψ falls (drawn amount ILLUSTRATIVE)
    if (S.layer >= 3) {
      var nA = Math.round(50 * aK);
      G.aB.forEach(function (b, i) {
        if (i >= nA) { G.aba.hide(i); return; }
        if (dt > 0) b.ph += dt * 1.3;
        var lp = G.leafPts[b.l]; G.aba.set(i, lp[0] + 0.05 * Math.sin(b.ph), lp[1] + 0.04 * Math.cos(b.ph * 1.3), lp[2] + 0.05 * Math.cos(b.ph));
      });
      G.aba.commit();
    }
    // named molecules on the whole tree
    var HN = window.WP.heroNames ? (S.hn || (S.hn = window.WP.heroNames(ctx))) : null;
    if (HN) HN.begin();
    function nameIt(o, key, r) {
      if (!HN || !o.visible) return;
      o.updateMatrixWorld(); _v.setFromMatrixPosition(o.matrixWorld);
      HN.add(o.userData.kind, key, o.userData.text, _v.x, _v.y, _v.z, r || 0.08);
    }
    var showTree = !(S.cut && ctx.narrow && S.cutK > 0.5);
    G.nW.forEach(function (o, i) {
      var R = G.routes[o.userData.route], L = R.poly.total;
      if (dt > 0) { o.userData.s += vW * dt / L; if (o.userData.s > 0.95) o.userData.s = 0.04; }
      R.poly.at(L * o.userData.s, P3); o.position.set(P3[0], P3[1], P3[2]); o.rotation.y = t * 0.8 + i;
      o.visible = showTree && S.cutK < 0.5;
      nameIt(o, 'tw' + i);
    });
    if (S.layer >= 2) G.nS.forEach(function (o, i) {
      var ld = o.userData.lead, R = G.routes[(ld || o).userData.route], L = R.poly.total;
      if (!ld && dt > 0) { o.userData.s += dt * 0.09 * 0.8; if (o.userData.s > 0.92) o.userData.s = 0.25; }
      if (ld) { R.poly.at(L * (1 - ld.userData.s + 0.022), P3); o.position.set(P3[0] - 0.05, P3[1], P3[2] - 0.05); } // the sorbitol rides just behind its sucrose
      else { R.poly.at(L * (1 - o.userData.s), P3); o.position.set(P3[0] + 0.02, P3[1], P3[2] + 0.02); }
      o.rotation.set(0, t * 0.6 + i, 0.3);
      o.visible = showTree && S.cutK < 0.5;
      if (!ld) nameIt(o, 'ts' + i, 0.12);
    });
    if (S.layer >= 3) G.nA.forEach(function (o, i) {
      var lp = G.abaAnchor; o.position.set(lp.x + 0.08 * Math.sin(t * 0.9), lp.y + 0.12, lp.z + 0.08 * Math.cos(t * 0.9)); o.rotation.y = t;
      o.visible = showTree && aK > 0 && S.cutK < 0.5;
      nameIt(o, 'ta' + i);
    });
    if (G.tc && G.cal.visible) calloutFrame(ctx, S, t, dt, nameIt);
    if (HN) HN.end();
  }
  var P3 = [0, 0, 0];
  function calloutFrame(ctx, S, t, dt, nameIt) {
    var G = S.g, T = ctx.THREE, res = S.res, E = Math.max(0, res.E), open = S.openFrac(), aK = S.abaK();
    // the blocks turn a little so they read as solids; they settle while the user drives the camera
    var wob = S.wob;
    G.tc.rotation.set(ROT.trunk[0], ROT.trunk[1] + 0.2 * Math.sin(t * 0.25) * wob, 0);
    G.lc.rotation.set(ROT.leaf[0], ROT.leaf[1] + 0.16 * Math.sin(t * 0.21 + 1) * wob, 0);
    G.rc.rotation.set(ROT.root[0], ROT.root[1] + 0.2 * Math.sin(t * 0.23 + 2) * wob, 0);
    var vW = 0.05 * E + 0.01, F = G.tcF, Hh = F.H1 - F.H0 - 0.04;
    // trunk: water up every vessel (speed follows the model E; drawn speed ILLUSTRATIVE), sugar down every sieve tube
    G.tcWB.forEach(function (b, i) {
      if (dt > 0) { b.y += vW * b.k * dt; if (b.y > 1) b.y -= 1; }
      G.tcW.set(i, b.x, F.H0 + 0.02 + b.y * Hh, b.z);
    });
    G.tcW.commit();
    if (S.layer >= 2) { G.tcSB.forEach(function (b, i) { if (dt > 0) { b.y -= 0.05 * dt; if (b.y < 0) b.y += 1; } G.tcS.set(i, b.x, F.H0 + 0.02 + b.y * Hh, b.z); }); G.tcS.commit(); }
    var tn = G.tcN, cf0 = Math.cos(F.f0), sf0 = Math.sin(F.f0), cf1 = Math.cos(F.f1), sf1 = Math.sin(F.f1);
    var wy = ((t * vW * 0.9) % 0.9);
    var q0 = G.onFace(0.36, 0, 0.021), q1 = G.onFace(G.tcGeom.sRad, 1, 0.02);
    tn[0].position.set(q0[0], F.H0 + 0.05 + wy, q0[1]); tn[0].rotation.y = t;
    var sy = (t * 0.04) % 0.84, sR = G.tcGeom.sRad;
    tn[1].position.set(q1[0], F.H1 - 0.1 - sy, q1[1]); tn[1].rotation.set(0, Math.PI / 2 - F.f1, 0);
    tn[2].position.copy(tn[1].position).add(_w.set(0, 0.032, 0)); tn[2].rotation.set(0, Math.PI / 2 - F.f1, 0); // sorbitol just above its sucrose, same face
    if (G.tc.visible) { nameIt(tn[0], 'cw', 0.02); if (S.layer >= 2) nameIt(tn[1], 'cs', 0.02); }
    // leaf: guard cells open with the model gs; water from the vein to the stomata, vapour out below
    var gap = 0.006 + 0.032 * open;
    G.guards.forEach(function (g) { g.position.x = g.userData.sx + g.userData.sg * (0.034 + gap / 2); g.scale.set(1, 1, 0.92 + 0.08 * open); });
    G.lcWB.forEach(function (b, i) {
      if (dt > 0) { b.s += dt * (0.08 + 0.05 * E); if (b.s > 1) { b.s -= 1; } }
      var sx = G.lcSt[b.st], x, y;
      if (b.s < 0.6) { var u = b.s / 0.6; x = lerp(0.05, sx, u) + b.j; y = lerp(-0.03, -0.15, u) + 0.05 * Math.sin(u * Math.PI); G.lcW.set(i, x, y, b.dz); G.lcV.hide(i); }
      else { var u2 = (b.s - 0.6) / 0.4; G.lcW.hide(i); if (open < 0.08 || S.gas === 'co2') { G.lcV.hide(i); } else G.lcV.set(i, sx + b.j * 2 * u2, -0.2 - 0.32 * u2, 0.14 + b.j); }
    });
    G.lcW.commit(); G.lcV.commit();
    if (G.lcC) { // v19: CO2 up through the same pores into the air spaces, toward the chloroplasts (drawn, not to scale)
      G.lcCB.forEach(function (b, i) {
        if (S.gas === 'water' || open < 0.08) { G.lcC.hide(i); return; }
        if (dt > 0) { b.s += dt * (0.1 + 0.08 * open); if (b.s > 1) b.s -= 1; }
        var sx2 = G.lcSt[b.st], x2, y2;
        if (b.s < 0.45) { var a2 = b.s / 0.45; x2 = sx2 - 0.12 + b.j + 0.12 * a2; y2 = -0.55 + 0.35 * a2; }
        else { var a3 = (b.s - 0.45) / 0.55; x2 = sx2 + b.j * 3 * a3; y2 = -0.2 + 0.32 * a3; }
        G.lcC.set(i, x2, y2, b.dz);
      });
      G.lcC.commit();
    }
    if (S.layer >= 2) { G.lcSB.forEach(function (b, i) { if (dt > 0) { b.s += dt * 0.15; if (b.s > 1) b.s -= 1; } G.lcS.set(i, lerp(b.x0, 0.05, b.s), lerp(b.y0, -0.08, b.s), 0.24); }); G.lcS.commit(); }
    if (S.layer >= 3) {
      var nA = Math.round(20 * aK);
      G.lcAB.forEach(function (b, i) {
        if (i >= nA) { G.lcA.hide(i); return; }
        if (dt > 0) { b.s += dt * 0.16; if (b.s > 1) b.s -= 1; }
        var sx = G.lcSt[b.st]; G.lcA.set(i, lerp(b.x0, sx, b.s), lerp(b.y0, -0.17, b.s), b.z);
      });
      G.lcA.commit();
    }
    var ln = G.lcN, ws = (t * (0.08 + 0.05 * E)) % 0.6 / 0.6;
    ln[0].position.set(lerp(0.05, G.lcSt[1], ws), lerp(-0.03, -0.15, ws) + 0.05 * Math.sin(ws * Math.PI), 0.27); ln[0].rotation.y = t;
    var as = (t * 0.16) % 1;
    ln[1].position.set(lerp(-0.1, G.lcSt[0], as), lerp(0.02, -0.15, as), 0.28); ln[1].rotation.z = t * 0.5;
    ln[2].position.set(lerp(0.3, G.lcSt[1], (as + 0.5) % 1), lerp(0.04, -0.15, (as + 0.5) % 1), 0.28);
    if (G.lc.visible) { nameIt(ln[0], 'lw', 0.05); if (S.layer >= 3 && aK > 0) { ln[1].visible = ln[2].visible = true; nameIt(ln[1], 'la', 0.04); nameIt(ln[2], 'lb', 0.04); } else if (S.layer >= 3) { ln[1].visible = ln[2].visible = false; } }
    // root: water from the soil along the hairs into the stele, then toward the trunk
    G.rcWB.forEach(function (b, i) {
      if (dt > 0) { b.s += dt * (0.06 + 0.05 * E); if (b.s > 1) { b.s -= 1; b.h = (b.h + 7) % G.hairs.length; } }
      var hh = G.hairs[b.h], x, y, z;
      if (b.s < 0.45) { var u = b.s / 0.45, d = hh.rad + hh.len * (1.15 - u); x = hh.base.x + hh.dir.x * d; y = hh.base.y + hh.dir.y * d; z = hh.base.z + hh.dir.z * d; }
      else { var u2 = (b.s - 0.45) / 0.55; G.rcv.getPointAt(Math.max(0, hh.t * (1 - u2)), _w); x = _w.x; y = _w.y; z = _w.z; }
      G.rcW.set(i, x, y, z);
    });
    G.rcW.commit();
    var rn = G.rcN[0], rh = G.hairs[5], ru = (t * (0.06 + 0.05 * E) * 0.6) % 1;
    rn.position.copy(rh.base).addScaledVector(rh.dir, rh.rad + rh.len * (1.2 - ru)); rn.rotation.y = t;
    if (G.rc.visible) nameIt(rn, 'rw', 0.05);
    // leader lines
    // FIX ROUND 1: no leader lines once the camera is inside a block (a chip view, or the user zoomed in close)
    var oc = ctx.orbit, inside = !!(S.solo || (oc && oc.engaged && oc.state && oc.state().dist < 8));
    var anchors = [G.trunkMid, G.leafAnchor, G.rootAnchor], from = [G.tc, G.lc, G.rc], off = [[-0.78, 0, 0], [-0.74, 0, 0], [-0.82, 0, 0]];
    G.tree.updateMatrixWorld();
    anchors.forEach(function (a, i) {
      var l = G.leads[i], arr = l.geometry.attributes.position.array, on = from[i].visible && G.tree.visible && !ctx.narrow && !inside;
      l.visible = on;
      if (!on) { G.dots.hide(i); return; }
      _v.copy(a); G.tree.localToWorld(_v);
      from[i].updateMatrixWorld(); _w.set(off[i][0], off[i][1], off[i][2]); from[i].localToWorld(_w);
      arr[0] = _v.x; arr[1] = _v.y; arr[2] = _v.z; arr[3] = _w.x; arr[4] = _w.y; arr[5] = _w.z;
      l.geometry.attributes.position.needsUpdate = true; l.computeLineDistances();
      G.dots.set(i, _v.x, _v.y, _v.z);
    });
    G.dots.commit();
  }
  function camera(ctx, S, t) {
    var n = ctx.narrow, k = S.cutK || 0, sway = ctx.reduced ? 0 : 0.3 * Math.sin(t * 0.07);
    // 14 Oct: closer, so the tree fills the larger stage; it backs off a little when cut open to fit the three blocks
    var e = k * k * (3 - 2 * k), d = n ? lerp(19.2, 21.5, e) : lerp(14.6, 15.6, e);
    ctx.camera.position.set(sway, n ? lerp(2.9, 2.3, e) : lerp(2.9, 2.2, e), d);
    ctx.camera.lookAt(0, n ? lerp(1.55, 1.2, e) : lerp(1.55, 1.2, e), 0);
  }
  function theme(ctx, S) {
    var m = ctx.mats, d = ctx.dark;
    if (m.core) m.core.opacity = d ? 0.85 : 0.62;
    if (m.shadow) m.shadow.opacity = d ? 0.85 : 0.7;
    if (S.g && S.g.water) { S.g.vap.mat.opacity = d ? 0.75 : 0.6; }
    if (S.g && S.g.co2 && window.WP.macro.idColor) { // v19: identity colours follow the theme
      var M2 = window.WP.macro, T2 = ctx.THREE;
      [['vap', 'h2o'], ['lcV', 'h2o'], ['co2', 'co2'], ['lcC', 'co2']].forEach(function (p) { var bd = S.g[p[0]]; if (bd && bd.mat) { bd.mat.map = M2.ballTexture(T2, M2.idColor(p[1], d)); bd.mat.needsUpdate = true; } });
    }
    if (S.g) ['water', 'sug', 'aba', 'tcW', 'tcS', 'lcW', 'lcA', 'lcS', 'rcW', 'co2', 'lcC'].forEach(function (k) { if (S.g[k] && S.g[k].glow) S.g[k].glow.opacity = d ? (k === 'co2' || k === 'lcC' ? 0.6 : 0.45) : 0; }); // v19: CO2 beads glow in the dark theme
    if (m.wood) m.wood.emissiveIntensity = d ? 0.9 : 0.6;
    if (m.farGround) { m.farGround.color.setHex(d ? 0x1c2016 : 0x8a7a4c).convertSRGBToLinear(); m.farLeaf.color.setHex(d ? 0x1f3418 : 0x5f8a3a).convertSRGBToLinear(); m.farWood.color.setHex(d ? 0x221810 : 0x5a4028).convertSRGBToLinear(); }
  }

  /* ------------------------------------------------------------------ main page: the tree in place of the trip strip */
  T3.autoMap = function () {
    var strip = document.getElementById('tripStrip');
    if (!strip || strip.getAttribute('data-t3')) return;
    if (!T3.supported()) return; // keep the trip strip: it is the no WebGL fallback
    strip.setAttribute('data-t3', 'pending');
    var host = document.createElement('div');
    host.className = 't3-maphost'; host.style.margin = '1.2rem 0 1.4rem';
    strip.parentNode.insertBefore(host, strip);
    strip.hidden = true;
    T3.mount(host, {
      context: 'map',
      onReady: function () { strip.setAttribute('data-t3', 'tree'); },
      onFail: function () { strip.hidden = false; strip.setAttribute('data-t3', 'fallback'); host.style.display = 'none'; }
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { if (document.getElementById('tripStrip')) T3.autoMap(); });
  else if (document.getElementById('tripStrip')) T3.autoMap();
})();

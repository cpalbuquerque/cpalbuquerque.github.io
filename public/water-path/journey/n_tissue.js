/* The Water Path v8: n_tissue.js (nutrient path, Plate IV Tissue)
   Part (a), here: "Where each element ends up". A 3D block cut from a leaf (rounded cells, a vein with xylem and
   phloem) linked to a plant map (old leaf and young leaf) and a plot of how much each leaf holds over 30 days.
   Pick an element, set how fast the leaf transpires, stop the root supply and watch which leaf runs short first.
   The model is ILLUSTRATIVE (a shape, not data); the facts behind it are cited in the Why fold:
     White PJ, Broadley MR (2003) Calcium in plants. Ann Bot 92: 487-511. doi:10.1093/aob/mcg164 (PMC4243668)
     Maillard A et al. (2015) Leaf mineral nutrient remobilization during leaf senescence and modulation by nutrient
       deficiency. Front Plant Sci 6: 317. doi:10.3389/fpls.2015.00317
     Marschner P, ed. (2012) Marschner's Mineral Nutrition of Higher Plants, 3rd ed. Academic Press.
       doi:10.1016/C2009-0-63043-9 (record checked on Crossref; chapter text not read, so SECONDARY context only)
   Part (b), the energy ledger and the GS/GOGAT figure, lives in n_tissue_ledger.js, loaded from here.
   Registered with WP.nutrient.register('tissue', {mount, update, unmount}). */
(function () {
  'use strict';
  var WP = window.WP, N = WP && WP.nutrient;
  if (!N) return;

  /* ------------------------------------------------------------ elements (mobility weights are ILLUSTRATIVE) */
  var EL = {
    N: { name: 'nitrogen', sym: 'N', m: 0.9, kind: 'mobile', lc: '#2f7d32', dc: '#7fd683' },
    P: { name: 'phosphorus', sym: 'P', m: 0.75, kind: 'mobile', lc: '#7b3fa6', dc: '#c9a2f0' },
    K: { name: 'potassium', sym: 'K', m: 0.8, kind: 'mobile', lc: '#a35a12', dc: '#f0a868' },
    Mg: { name: 'magnesium', sym: 'Mg', m: 0.6, kind: 'mobile', lc: '#0f7178', dc: '#6fd6dc' },
    Ca: { name: 'calcium', sym: 'Ca', m: 0.04, kind: 'immobile', lc: '#b0263a', dc: '#ff8c9b' }
  };
  var ORDER = ['N', 'P', 'K', 'Mg', 'Ca'];
  var STOP_DAY = 10, DAYS = 30;
  function clamp(x, a, b) { return x < a ? a : (x > b ? b : x); }
  function pct(v) { return Math.round(100 * v) + ' %'; }
  function elCol(k) { var e = EL[k]; return WS.isDark() ? e.dc : e.lc; }

  /* ------------------------------------------------------------ the ILLUSTRATIVE two leaf model
     Co = old leaf, Cy = young leaf, both as a share of "enough" (1 = enough). Xylem delivery follows transpiration;
     the young leaf transpires less than the old one. A mobile element is also carried by the phloem, from the old
     leaf to the young one, and much faster once the root supply stops. Calcium (weight 0.04) hardly moves that way. */
  var cache = {};
  function simulate(el, tr, stopped) {
    var key = el + '|' + tr.toFixed(3) + '|' + (stopped ? 1 : 0);
    if (cache[key]) return cache[key];
    var m = EL[el].m, dt = 0.05, Co = 1, Cy = 1, g = 0.07, kr = 0.067, a = 0.0817, cO = 0.02, e = 1.15;
    var To = 0.35 + 0.65 * tr, Ty = 0.5 + 0.5 * tr;
    var pts = [], steps = Math.round(DAYS / dt);
    for (var i = 0; i <= steps; i++) {
      var t = i * dt, S = (stopped && t >= STOP_DAY) ? 0 : 1;
      var R = m * kr * Co * (S ? 0.2 : 1);
      if (i % 5 === 0) pts.push({ t: t, o: Co, y: Cy, R: R, S: S });
      Co += (S * (cO * To * (1 - m) + R) - R) * dt;
      Cy += ((1 - m) * S * a * Ty + m * S * g * 0.85 + R * e - g * Cy) * dt;
    }
    var out = { pts: pts, To: To, Ty: Ty };
    cache[key] = out;
    return out;
  }
  function at(sim, day) {
    var p = sim.pts, i = clamp(Math.round(day / 0.25), 0, p.length - 1);
    return p[i];
  }

  var ws = null, ledger = null, ledgerHost = null, dead = false;

  function build(host) {
    var WS = window.WS;
    var top = document.createElement('div'); host.appendChild(top);
    var intro = document.createElement('p');
    intro.className = 'nt-intro';
    intro.innerHTML = '<b>Nutrient IV, Tissue.</b> Two questions on one plate. First: once an element reaches a leaf, does it stay there, or can the plant move it again to the leaves that are still growing? Second: what does it cost the leaf to turn nitrate into something it can use?';
    top.appendChild(intro);

    ws = WS.create(top, {
      title: 'Where each element ends up',
      badge: 'ILLUSTRATIVE',
      what: 'A block cut out of a leaf, with its cells and one vein. The vein carries two pipes: the <b>xylem</b> (water and dissolved minerals coming up from the root) and the <b>phloem</b> (sugars and some minerals going out to the parts that are still growing). The model is invented to show a direction, not data.',
      todo: 'Pick an element. Then press <b>Root supply: stopped</b> and move <b>Day</b> past day 10. Watch which leaf runs short first. Try <b>Ca</b> and slide <b>Leaf transpiration</b> down.',
      thing: 'A model leaf block drawn for this page: upper skin cells, tall palisade cells, round spongy cells with air between them, the lower skin with one pore, and the vein. Coloured beads are the element you picked.',
      scanCaption: '<b>Plant map.</b> The same model as a whole shoot: an old leaf below, a young leaf above, and how much of the element each one holds. Blue arrows: the xylem, with the water. Purple arrow: the phloem. A model rendering, not an image. ' + WS.badge('ILLUSTRATIVE', 'The amounts come from the invented model.'),
      plotCaption: '<b>How much each leaf holds,</b> as a share of what it needs (1 = enough), over 30 days. Solid: old leaf. Dashed: young leaf. ' + WS.badge('ILLUSTRATIVE', 'The curves come from an invented model with made up rates. Only the directions are meant to be true.'),
      why: whyHtml(),
      state: { el: 'N', tr: 0.6, supply: 'on', day: 18, leaf: 'old' },
      camera: { dist: 5.6, theta: 0.62, phi: 1.12, target: [0, -0.05, 0], minDist: 2.4, maxDist: 11 }
    });
    var S = ws.state;
    ws.el.classList.add('nt-ws');

    /* ---- controls */
    ws.choice({ key: 'el', label: 'Element', options: ORDER.map(function (k) { return [k, k]; }) });
    ws.choice({ key: 'supply', label: 'Root supply', options: [['on', 'steady'], ['off', 'stopped on day 10']] });
    ws.range({ key: 'tr', label: 'Leaf transpiration', min: 0, max: 1, step: 0.05, fmt: function (v) { return v < 0.25 ? 'low' : (v < 0.7 ? 'medium' : 'high'); }, hint: 'how fast the leaves lose water' });
    ws.range({ key: 'day', label: 'Day', min: 0, max: DAYS, step: 0.5, fmt: function (v) { return 'day ' + Math.round(v); } });
    ws.choice({ key: 'leaf', label: 'Block in 3D', options: [['old', 'old leaf'], ['young', 'young leaf']] });

    /* ---- 3D */
    var g = ws.gl, scene3 = null;
    if (g) scene3 = build3D(g, ws);

    ws.fallback(drawFallback);
    ws.paintScan(drawMap);
    ws.paintPlot(drawPlot);

    /* playing moves the day on (1.6 days a second) and loops; paused, the Day slider or Step does it */
    ws.onFrame(function (t, dt, st) {
      var d = st.day + dt * 1.6;
      if (d > DAYS) d = 0;
      ws.set({ day: Math.round(d * 100) / 100 });
    });
    ws.on(function (st) { ws.say(sayText(st)); });
    ws.render();

    /* ---- part (b): the energy ledger, in its own file */
    ledgerHost = document.createElement('div'); ledgerHost.className = 'nt-ledger-host'; host.appendChild(ledgerHost);
    N.load('tissue_ledger', function (err) {
      if (dead) return;
      if (err || !WP.nTissueLedger) { ledgerHost.innerHTML = '<p class="wp-nut-wait">The energy ledger could not load.</p>'; return; }
      ledger = WP.nTissueLedger.mount(ledgerHost);
    });
  }

  /* ------------------------------------------------------------ the words */
  function sayText(st) {
    var e = EL[st.el], sim = simulate(st.el, st.tr, st.supply === 'off'), p = at(sim, st.day);
    var day = Math.round(st.day), short = function (v) { return v < 0.8; };
    var s = '<b>Day ' + day + ', ' + e.name + ' (' + e.sym + ').</b> ';
    var o = '<b>old leaf ' + pct(p.o) + '</b>', y = '<b>young leaf ' + pct(p.y) + '</b>';
    if (st.supply === 'off' && st.day >= STOP_DAY) {
      if (e.kind === 'mobile') s += 'The root stopped sending it on day 10. It is <b>mobile</b>, so the phloem is moving it out of the old leaf into the young one: ' + o + ' of enough, ' + y + '. ' + (short(p.o) && !short(p.y) ? 'The old leaf runs short first.' : (short(p.y) ? 'Now both are short, the old one more.' : 'Keep moving the day on.'));
      else s += 'The root stopped sending it on day 10. Calcium is <b>immobile</b>: the old leaf keeps what it got (' + o + ') while the young leaf, which can only get calcium from the water arriving now, falls behind (' + y + '). ' + (short(p.y) ? 'The young leaf runs short first.' : '');
    } else if (e.kind === 'immobile') {
      s += 'Calcium arrives with the water. The old leaf loses more water, so it collects more: ' + o + '. The young leaf loses less water: ' + y + '. ' + (short(p.y) ? 'At this low transpiration the young leaf is short of calcium even though the root supply is fine.' : 'Slide transpiration down to see the young leaf fall short.');
    } else {
      s += 'With the root supply steady, both leaves have enough: ' + o + ', ' + y + ' of what each needs. The phloem tops up the young leaf, so transpiration matters little for ' + e.name + '. ' + (st.supply === 'off' ? 'Move the day past 10.' : 'Now stop the root supply.');
    }
    s += ' <span class="nt-blk">The 3D block shows the <b>' + (st.leaf === 'old' ? 'old' : 'young') + ' leaf</b>: ' + Math.round(clamp((st.leaf === 'old' ? p.o : p.y) * 34, 0, 64)) + ' beads.</span>';
    return s;
  }

  function whyHtml() {
    var B = window.WS.badge;
    return '<p><b>Everything arrives with the water.</b> Minerals taken up by the root travel to the leaves in the xylem, carried by the transpiration stream, the same stream you followed on the water plates. What happens next depends on the element.</p>' +
      '<p><b>Mobile elements</b> can be loaded into the phloem and moved again to the parts that are still growing. In leaves of eight crop and tree species harvested through their life span, nitrogen was moved out of every species, from 40 % (maize) to 90 % (wheat) ' + B('MEASURED', 'Maillard et al. 2015, abstract.') + ', and potassium, phosphorus, sulfur and magnesium were moved out in most species (Maillard et al. 2015). So when the supply runs short, the plant strips its old leaves to feed the young ones, and the shortage shows first on <b>old leaves</b>.</p>' +
      '<p><b>Calcium</b> is the opposite case. It is delivered to the shoot in the xylem; within the leaf it follows the route of the transpiration stream through the cell walls; and it cannot be moved from older tissues and sent on through the phloem. Transpiration is low in young leaves, in enclosed tissues and in fruit, so these tissues depend on the calcium arriving in the xylem right now. That is why calcium shortages show in <b>young</b> expanding leaves, as in the <b>tipburn</b> of leafy vegetables (White and Broadley 2003). Calcium follows the water.</p>' +
      '<p><b>Not a fixed rule.</b> The same field study found that calcium and manganese, usually counted as having low phloem mobility, were moved out of leaves in wheat and barley, while in oilseed rape they behaved as non mobile (Maillard et al. 2015). Mobility is a tendency that differs between species.</p>' +
      '<p><b>About the model.</b> The rates in the plot and the mobility weights behind the beads (N 0.9, P 0.75, K 0.8, Mg 0.6, Ca 0.04) are invented ' + B('ILLUSTRATIVE') + '. They were chosen only so that the directions match the papers: mobile elements leave the old leaf first, calcium leaves the young leaf short, and only calcium depends strongly on transpiration.</p>' +
      '<p class="nt-refs">Sources: White PJ, Broadley MR (2003) Calcium in plants. Ann Bot 92: 487-511, <a href="https://doi.org/10.1093/aob/mcg164" target="_blank" rel="noopener">doi 10.1093/aob/mcg164</a>. Maillard A, Diquélou S, Billard V, Laîné P, Garnica M, Prudent M, Garcia-Mina JM, Yvin JC, Ourry A (2015) Front Plant Sci 6: 317, <a href="https://doi.org/10.3389/fpls.2015.00317" target="_blank" rel="noopener">doi 10.3389/fpls.2015.00317</a>. Background textbook: Marschner P, ed. (2012) Marschner\'s Mineral Nutrition of Higher Plants, 3rd ed., Academic Press ' + B('SECONDARY', 'Record checked; chapter pages not checked.') + '.</p>';
  }

  /* ------------------------------------------------------------ 3D leaf block */
  function rng(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
  var VEIN = { x: 0, y: -0.1, r: 0.36 };
  var XYL = [[-0.11, 0.02], [0.05, 0.07], [0.13, -0.03], [-0.03, -0.05]];
  var PHL = [[-0.12, -0.24], [0.0, -0.27], [0.12, -0.23], [-0.05, -0.17], [0.07, -0.16]];
  var STOMA = { x: 0.95, z: 0.1 };

  function layout() {
    var r = rng(11), cells = [];
    var i, j;
    for (i = 0; i < 9; i++) for (j = 0; j < 6; j++) {   // upper epidermis
      cells.push({ t: 'epi', x: -1.42 + i * 0.355, y: 0.53, z: -0.84 + j * 0.336, sx: 0.175, sy: 0.07, sz: 0.165 });
    }
    for (i = 0; i < 13; i++) for (j = 0; j < 7; j++) {  // palisade
      var x = -1.47 + i * 0.245, z = -0.87 + j * 0.29;
      if (Math.abs(x) < 0.36) continue;
      cells.push({ t: 'pal', x: x + (r() - 0.5) * 0.03, y: 0.27, z: z + (r() - 0.5) * 0.03, sx: 0.1, sy: 0.19, sz: 0.11 });
    }
    var tries = 0, sp = [];
    while (sp.length < 64 && tries++ < 4000) {             // spongy mesophyll: round cells with air between
      var c = { t: 'spo', x: -1.5 + r() * 3.0, y: -0.39 + r() * 0.4, z: -0.88 + r() * 1.76, s: 0.1 + r() * 0.035 };
      var dv = Math.hypot(c.x - VEIN.x, c.y - VEIN.y); if (dv < VEIN.r + c.s + 0.02) continue;
      var ok = true;
      for (var k = 0; k < sp.length && ok; k++) if (Math.hypot(c.x - sp[k].x, c.y - sp[k].y, c.z - sp[k].z) < (c.s + sp[k].s) * 1.08) ok = false;
      if (!ok) continue;
      c.sx = c.s; c.sy = c.s * 0.92; c.sz = c.s; sp.push(c);
    }
    cells = cells.concat(sp);
    for (i = 0; i < 9; i++) for (j = 0; j < 6; j++) {   // lower epidermis, leave room for the pore
      var lx = -1.42 + i * 0.355, lz = -0.84 + j * 0.336;
      if (Math.hypot(lx - STOMA.x, lz - STOMA.z) < 0.2) continue;
      cells.push({ t: 'lep', x: lx, y: -0.53, z: lz, sx: 0.175, sy: 0.065, sz: 0.165 });
    }
    for (i = 0; i < 12; i++) {                          // bundle sheath, long cells around the vein
      var a = i / 12 * Math.PI * 2;
      cells.push({ t: 'bs', x: VEIN.x + Math.cos(a) * (VEIN.r - 0.06), y: VEIN.y + Math.sin(a) * (VEIN.r - 0.06), z: 0, sx: 0.075, sy: 0.075, sz: 0.97 });
    }
    return cells;
  }
  var CELLS = layout();
  /* bead sites: a mobile element sits inside palisade and spongy cells; calcium sits on cell surfaces along the
     water path (walls next to air spaces, the skin and the bundle sheath), more of it toward the pore */
  var SITES = (function () {
    var r = rng(29), mob = [], ca = [];
    var inner = CELLS.filter(function (c) { return c.t === 'pal' || c.t === 'spo'; });
    for (var i = 0; i < 80; i++) {
      var c = inner[Math.floor(r() * inner.length)];
      mob.push([c.x + (r() - 0.5) * c.sx * 0.9, c.y + (r() - 0.5) * c.sy * 0.9, c.z + (r() - 0.5) * c.sz * 0.9]);
    }
    var wall = CELLS.filter(function (c) { return c.t !== 'pal' || r() < 0.4; });
    for (i = 0; i < 80; i++) {
      var w = wall[Math.floor(r() * wall.length)];
      if (w.t === 'spo' || w.t === 'lep') { if (Math.hypot(w.x - STOMA.x, w.z - STOMA.z) > 1.1 && r() < 0.5) w = wall[Math.floor(r() * wall.length)]; }
      var th = r() * Math.PI * 2, ph = Math.acos(2 * r() - 1);
      var zz = w.t === 'bs' ? (r() - 0.5) * 1.8 : w.z + Math.cos(ph) * w.sz * 1.04;
      ca.push([w.x + Math.sin(ph) * Math.cos(th) * w.sx * 1.04, w.y + Math.sin(ph) * Math.sin(th) * w.sy * 1.04, zz]);
    }
    return { mob: mob, ca: ca };
  })();

  function build3D(g, ws) {
    var T = g.THREE, root = new T.Group(); g.root.add(root);
    var unit = new T.SphereGeometry(1, 18, 12);
    var groups = {}, mats = {};
    ['epi', 'pal', 'spo', 'lep', 'bs'].forEach(function (t) {
      var list = CELLS.filter(function (c) { return c.t === t; });
      var m = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.78, metalness: 0, transparent: true, depthWrite: t === 'lep', opacity: { bs: 0.5, epi: 0.75, pal: 0.6, spo: 0.62, lep: 1 }[t] });   /* see through, so the beads inside the cells show */
      var im = new T.InstancedMesh(unit, m, list.length);
      var M = new T.Matrix4(), q = new T.Quaternion();
      list.forEach(function (c, i) { M.compose(new T.Vector3(c.x, c.y, c.z), q, new T.Vector3(c.sx, c.sy, c.sz)); im.setMatrixAt(i, M); });
      im.instanceMatrix.needsUpdate = true;
      root.add(im); groups[t] = { mesh: im, list: list }; mats[t] = m;
    });
    /* guard cells: two bean shaped cells round the pore */
    var gm = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 }); mats.guard = gm;
    [-1, 1].forEach(function (sd) {
      var tor = new T.Mesh(new T.TorusGeometry(0.09, 0.045, 10, 18, Math.PI), gm);
      tor.rotation.x = Math.PI / 2; tor.rotation.z = sd > 0 ? 0 : Math.PI;
      tor.position.set(STOMA.x, -0.54, STOMA.z); tor.scale.set(1, 1.5, 1);
      root.add(tor);
    });
    /* xylem vessels and phloem sieve tubes: open tubes along the vein */
    function tubes(list, rad, key) {
      var m = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, side: T.DoubleSide, transparent: true, opacity: 0.42, depthWrite: false }); mats[key] = m;
      list.forEach(function (p) {
        var cy = new T.Mesh(new T.CylinderGeometry(rad, rad, 2.0, 16, 1, true), m);
        cy.rotation.x = Math.PI / 2; cy.position.set(VEIN.x + p[0], VEIN.y + p[1], 0); root.add(cy);
      });
    }
    tubes(XYL, 0.052, 'xyl'); tubes(PHL, 0.034, 'phl');
    /* a faint box edge so the cut reads as a block */
    var boxE = new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(3.3, 1.22, 1.9)), new T.LineBasicMaterial({ color: 0x888888, transparent: true, opacity: 0.35 }));
    root.add(boxE);

    /* labels */
    function label(text) {
      var cv = document.createElement('canvas'); cv.width = 512; cv.height = 96;
      var tex = new T.CanvasTexture(cv); tex.minFilter = T.LinearFilter;
      var sp = new T.Sprite(new T.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
      sp.renderOrder = 10; sp.scale.set(1.25, 0.235, 1);
      sp.userData.draw = function () {
        var c = cv.getContext('2d'); c.clearRect(0, 0, 512, 96);
        var fs = 40; c.font = '600 40px ' + (WS.token('ui') || 'sans-serif');
        var mw = c.measureText(sp.userData.text).width;
        if (mw > 470) { fs = Math.floor(40 * 470 / mw); c.font = '600 ' + fs + 'px ' + (WS.token('ui') || 'sans-serif'); mw = c.measureText(sp.userData.text).width; }
        var w = Math.min(500, mw + 28);
        c.fillStyle = WS.token('wall'); c.globalAlpha = 0.88; c.fillRect((512 - w) / 2, 14, w, 64); c.globalAlpha = 1;
        c.strokeStyle = WS.token('rule'); c.lineWidth = 2; c.strokeRect((512 - w) / 2, 14, w, 64);
        c.fillStyle = WS.token('ink'); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(sp.userData.text, 256, 47);
        tex.needsUpdate = true;
      };
      sp.userData.text = text; sp.userData.draw();
      root.add(sp); return sp;
    }
    var lX = label('xylem'), lP = label('phloem'), lIn = label('from the stem'), lOut = label('phloem: out to young leaves'), lPore = label('pore');
    lX.position.set(-0.75, 0.0, 1.02); lP.position.set(-0.75, -0.3, 1.02);
    lIn.position.set(0, 0.86, -1.05); lOut.position.set(0, -0.86, -1.05); lOut.scale.set(1.9, 0.356, 1);
    lPore.position.set(STOMA.x, -0.8, STOMA.z + 0.3); lPore.scale.set(1.5, 0.28, 1);
    var leader = new T.LineBasicMaterial({ color: 0x888888 });
    function lead(a, b) { var ge = new T.BufferGeometry().setFromPoints([new T.Vector3().fromArray(a), new T.Vector3().fromArray(b)]); var l = new T.Line(ge, leader); root.add(l); }
    lead([-0.48, 0.0, 1.0], [VEIN.x - 0.11, VEIN.y + 0.02, 1.0]); lead([-0.48, -0.3, 1.0], [VEIN.x - 0.12, VEIN.y - 0.24, 1.0]);

    /* beads: residents (how much the leaf holds) and movers (in the xylem and phloem) */
    var NB = 64, NM = 40;
    var bm = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35, emissive: 0x000000 });
    var beads = new T.InstancedMesh(new T.SphereGeometry(0.042, 12, 8), bm, NB); root.add(beads);
    var mm = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35 });
    var movers = new T.InstancedMesh(new T.SphereGeometry(0.03, 10, 8), mm, NM); root.add(movers);
    var M = new T.Matrix4(), q = new T.Quaternion(), V = new T.Vector3(), ONE = new T.Vector3(1, 1, 1), ZERO = new T.Vector3(0, 0, 0);
    var tClock = 0;

    function cellTint() {
      var dark = WS.isDark();
      var base = { epi: WS.token('leaf2'), pal: WS.token('chl'), spo: WS.token('leaf'), lep: WS.token('leaf2'), bs: WS.token('leaf3') };
      Object.keys(groups).forEach(function (t) { mats[t].color.set(base[t]); mats[t].color.multiplyScalar(dark ? 0.85 : 1); });
      mats.guard.color.set(WS.token('leaf3'));
      mats.xyl.color.set(WS.token('w2')); mats.phl.color.set(WS.token('b-pp'));
      boxE.material.color.set(WS.token('ink2'));
      leader.color.set(WS.token('ink2'));
      [lX, lP, lIn, lOut, lPore].forEach(function (s) { s.userData.draw(); });
    }
    ws.onTheme(cellTint);

    function place(st) {
      var e = EL[st.el], sim = simulate(st.el, st.tr, st.supply === 'off'), p = at(sim, st.day);
      var C = st.leaf === 'old' ? p.o : p.y;
      var n = clamp(Math.round(C * 34), 0, NB), sites = e.kind === 'mobile' ? SITES.mob : SITES.ca;
      for (var i = 0; i < NB; i++) {
        if (i < n) { V.fromArray(sites[i % sites.length]); M.compose(V, q, ONE); } else M.compose(V.set(0, 0, 0), q, ZERO);
        beads.setMatrixAt(i, M);
      }
      beads.instanceMatrix.needsUpdate = true;
      var col = new T.Color(elCol(st.el)); bm.color.copy(col); mm.color.copy(col);
      bm.emissive.copy(col).multiplyScalar(WS.isDark() ? 0.25 : 0.08);
      /* movers: xylem beads in, at a rate set by this leaf's transpiration; phloem beads out of the old leaf, or into
         the young one, at a rate set by the phloem flow */
      var xr = p.S ? (st.leaf === 'old' ? sim.To : sim.Ty) * (e.kind === 'mobile' ? 0.55 : 1) : 0;
      var pr = p.R / 0.06;
      var nx = Math.round(clamp(xr, 0, 1) * 20), np = Math.round(clamp(pr, 0, 1) * 20);
      for (i = 0; i < NM; i++) {
        var on = false;
        if (i < 20 && i < nx) {
          var lane = XYL[i % XYL.length], u = ((tClock * 0.22 + st.day * 0.31 + i * 0.137) % 1);
          V.set(VEIN.x + lane[0], VEIN.y + lane[1], -0.98 + u * 1.96); on = true;
        } else if (i >= 20 && i - 20 < np) {
          var j = i - 20, ln = PHL[j % PHL.length], w = ((tClock * 0.16 + st.day * 0.23 + j * 0.173) % 1);
          var zz = st.leaf === 'old' ? 0.98 - w * 1.96 : -0.98 + w * 1.96;
          V.set(VEIN.x + ln[0], VEIN.y + ln[1], zz); on = true;
        }
        M.compose(on ? V : V.set(0, 0, 0), q, on ? ONE : ZERO); movers.setMatrixAt(i, M);
      }
      movers.instanceMatrix.needsUpdate = true;
      lOut.userData.text = st.leaf === 'old' ? 'phloem: out to young leaves' : 'phloem: in from old leaves';
      lOut.userData.draw();
      lPore.userData.text = 'pore: water out, ' + (st.tr < 0.25 ? 'low' : (st.tr < 0.7 ? 'medium' : 'high')); lPore.userData.draw();
      lIn.userData.text = st.supply === 'off' ? (st.day >= STOP_DAY ? 'xylem: nothing new from the root' : 'root supply stops on day 10') : 'from the stem';
      lIn.scale.set(st.supply === 'off' ? 1.9 : 1.25, st.supply === 'off' ? 0.356 : 0.235, 1); lIn.userData.draw();
      g.invalidate();
    }
    ws.on(place);
    ws.onFrame(function (t, dt) { tClock += dt; });
    return { root: root };
  }

  /* ------------------------------------------------------------ static drawing when there is no WebGL */
  function drawFallback(c, w, h, st) {
    var e = EL[st.el], sim = simulate(st.el, st.tr, st.supply === 'off'), p = at(sim, st.day);
    var C = st.leaf === 'old' ? p.o : p.y;
    if (w < 80 || h < 80) return;
    var sx = (w - 30) / 3.3, sy = (h - 110) / 1.3, k = Math.max(10, Math.min(sx, sy)), ox = w / 2, oy = 58 + (h - 110) / 2;
    function X(x) { return ox + x * k; } function Y(y) { return oy - y * k; }
    c.fillStyle = WS.token('airsp'); c.fillRect(X(-1.65), Y(0.61), 3.3 * k, 1.22 * k);
    var col = { epi: 'leaf2', pal: 'chl', spo: 'leaf', lep: 'leaf2', bs: 'leaf3' };
    CELLS.forEach(function (cl) {
      if (cl.t !== 'bs' && Math.abs(cl.z) > 0.2) return;
      c.beginPath(); c.ellipse(X(cl.x), Y(cl.y), Math.max(1, cl.sx * k), Math.max(1, cl.sy * k), 0, 0, Math.PI * 2);
      c.fillStyle = WS.token(col[cl.t]); c.fill(); c.strokeStyle = WS.token('ink2'); c.lineWidth = 0.6; c.stroke();
    });
    XYL.forEach(function (q) { c.beginPath(); c.arc(X(VEIN.x + q[0]), Y(VEIN.y + q[1]), 0.052 * k, 0, 7); c.fillStyle = WS.token('w2'); c.fill(); });
    PHL.forEach(function (q) { c.beginPath(); c.arc(X(VEIN.x + q[0]), Y(VEIN.y + q[1]), 0.034 * k, 0, 7); c.fillStyle = WS.token('b-pp'); c.fill(); });
    var n = clamp(Math.round(C * 34), 0, 64), sites = e.kind === 'mobile' ? SITES.mob : SITES.ca;
    c.fillStyle = elCol(st.el);
    for (var i = 0; i < n; i++) { var s = sites[i % sites.length]; c.beginPath(); c.arc(X(s[0]), Y(s[1]), 3.2, 0, 7); c.fill(); }
    c.fillStyle = WS.token('ink'); c.font = '12px ' + WS.token('ui');
    c.fillText('xylem (blue) and phloem (purple) in the vein', 8, 16);
    c.fillText((st.leaf === 'old' ? 'old' : 'young') + ' leaf: ' + n + ' beads of ' + e.sym, 8, 31);
    var xin = p.S ? (st.leaf === 'old' ? sim.To : sim.Ty) : 0;
    c.fillText('inflow in the xylem now: ' + (xin === 0 ? 'none, the root supply has stopped' : (xin < 0.55 ? 'low' : (xin < 0.8 ? 'medium' : 'high'))) + (st.supply === 'off' && p.S ? ' (stops on day 10)' : ''), 8, 46);
    if (xin > 0) { c.strokeStyle = WS.token('w2'); c.lineWidth = 1 + 5 * xin; c.beginPath(); c.moveTo(X(-0.35), Y(VEIN.y + 0.45)); c.lineTo(X(-0.12), Y(VEIN.y + 0.1)); c.stroke(); }
  }

  /* ------------------------------------------------------------ plant map (the linked scan) */
  function drawMap(c, w, h, st) {
    var e = EL[st.el], sim = simulate(st.el, st.tr, st.supply === 'off'), p = at(sim, st.day);
    var col = elCol(st.el), ink = WS.token('ink'), ink2 = WS.token('ink2');
    c.fillStyle = WS.token('card2'); c.fillRect(0, 0, w, h);
    var sx = Math.min(w * 0.42, 150), base = h - 16, topY = 22;
    /* soil and stem */
    c.fillStyle = WS.token('soil'); c.fillRect(0, base, w, h - base);
    c.strokeStyle = WS.token('leaf3'); c.lineWidth = 7; c.lineCap = 'round';
    c.beginPath(); c.moveTo(sx, base); c.lineTo(sx, topY + 18); c.stroke();
    var oldP = { x: sx - Math.min(80, w * 0.2), y: base - (base - topY) * 0.3 }, youngP = { x: sx + Math.min(70, w * 0.18), y: topY + 26 };
    function leaf(cx, cy, len, ang, C, lab, sel) {
      c.save(); c.translate(cx, cy); c.rotate(ang);
      c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(len * 0.5, -len * 0.32, len, 0); c.quadraticCurveTo(len * 0.5, len * 0.32, 0, 0);
      c.fillStyle = WS.token('leaf2'); c.fill();
      c.save(); c.clip(); c.globalAlpha = clamp(C / 1.3, 0.05, 1); c.fillStyle = col; c.fillRect(0, -len, len * clamp(C / 1.3, 0.04, 1), len * 2); c.restore();
      c.lineWidth = sel ? 2.5 : 1.2; c.strokeStyle = sel ? ink : ink2; c.stroke();
      c.restore();
      return lab;
    }
    var lenO = Math.min(96, w * 0.26), lenY = Math.min(62, w * 0.18);
    leaf(sx, oldP.y, lenO, Math.PI + 0.35, p.o, 'old', st.leaf === 'old');
    leaf(sx, youngP.y, lenY, -0.45, p.y, 'young', st.leaf === 'young');
    /* xylem arrows, widths follow transpiration (only while the root supplies) */
    function arrow(x0, y0, x1, y1, wd, colr, dash) {
      if (wd <= 0.2) return;
      c.save(); c.strokeStyle = colr; c.fillStyle = colr; c.lineWidth = wd; c.lineCap = 'butt'; if (dash) c.setLineDash(dash);
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.setLineDash([]);
      var a = Math.atan2(y1 - y0, x1 - x0), hl = 6 + wd;
      c.beginPath(); c.moveTo(x1 + Math.cos(a) * 2, y1 + Math.sin(a) * 2); c.lineTo(x1 - Math.cos(a - 0.5) * hl, y1 - Math.sin(a - 0.5) * hl); c.lineTo(x1 - Math.cos(a + 0.5) * hl, y1 - Math.sin(a + 0.5) * hl); c.closePath(); c.fill();
      c.restore();
    }
    var wx = WS.token('w2');
    if (p.S) {
      arrow(sx + 9, base - 6, sx + 9, oldP.y + 8, 1 + 4 * sim.To, wx);
      arrow(sx - 22, oldP.y + 2, sx - lenO * 0.62, oldP.y + lenO * 0.2, 1 + 4 * sim.To, wx);
      arrow(sx + 9, oldP.y - 6, sx + 9, youngP.y + 22, 1 + 4 * sim.Ty * 0.5, wx);
      arrow(sx + 14, youngP.y + 4, sx + lenY * 0.62, youngP.y - lenY * 0.24, 1 + 4 * sim.Ty * 0.5, wx);
    }
    /* phloem: old leaf to young leaf */
    var pw = clamp(p.R / 0.06, 0, 1) * 6;
    if (pw > 0.3) arrow(sx - 10, oldP.y - 12, sx - 10, youngP.y + 14, 1 + pw, WS.token('b-pp'), [5, 3]);
    /* words: never colour alone */
    c.font = '600 12px ' + WS.token('ui'); c.fillStyle = ink;
    var tx = Math.min(w - 150, Math.max(sx + 30, w * 0.56));
    function status(v) { return v >= 0.8 ? 'enough' : (v >= 0.5 ? 'short' : 'very short'); }
    c.fillText('young leaf: ' + pct(p.y), tx, Math.max(54, youngP.y + 44)); c.font = '12px ' + WS.token('ui'); c.fillText(status(p.y) + ' (' + e.sym + ')', tx, Math.max(54, youngP.y + 44) + 15);
    var oy = Math.min(base - 22, oldP.y + 22);
    c.font = '600 12px ' + WS.token('ui'); c.fillText('old leaf: ' + pct(p.o), 8, oy);
    c.font = '12px ' + WS.token('ui'); c.fillText(status(p.o) + ' (' + e.sym + ')', 8, oy + 15);
    c.fillStyle = ink2; c.font = '11px ' + WS.token('ui');
    c.fillText('model rendering, not an image', 8, 14);
    c.fillText(p.S ? (st.supply === 'off' ? 'root supply stops on day 10' : 'root supply on') : 'root supply stopped', Math.min(tx, w - 160), base - 6);
    if (pw > 0.3) { c.fillStyle = ink; c.fillText('phloem', sx - 56, (oldP.y + youngP.y) / 2); }
  }

  /* ------------------------------------------------------------ plot */
  function drawPlot(svg, st) {
    var sim = simulate(st.el, st.tr, st.supply === 'off'), p = at(sim, st.day);
    var ax = WS.axes(svg, { w: 360, h: 200, x: [0, DAYS], y: [0, 1.6], xlabel: 'day', ylabel: 'share of enough', pad: { l: 46, r: 48, t: 12, b: 38 }, yticks: [0, 0.5, 1, 1.5], xticks: [0, 10, 20, 30] });
    var en = ax.path([[0, 1], [DAYS, 1]], 'nt-enough');
    en.setAttribute('stroke-dasharray', '2 3');
    if (st.supply === 'off') {
      var v = ax.vline(STOP_DAY, 'nt-stop');
      ax.text(STOP_DAY + 0.6, 1.53, 'supply stops', 'start', 'ws-lab nt-small');
    }
    var o = sim.pts.map(function (q) { return [q.t, Math.min(1.6, q.o)]; }), y = sim.pts.map(function (q) { return [q.t, Math.min(1.6, q.y)]; });
    var po = ax.path(o, 'ws-line nt-old'); po.style.stroke = elCol(st.el);
    var py = ax.path(y, 'ws-line nt-young'); py.style.stroke = elCol(st.el); py.setAttribute('stroke-dasharray', '6 4');
    (st.leaf === 'old' ? po : py).setAttribute('class', 'ws-line nt-sel');
    ax.vline(st.day, 'ws-cursor');
    ax.dot(st.day, Math.min(1.6, p.o)); ax.dot(st.day, Math.min(1.6, p.y));
    /* end labels, placed apart */
    var eo = Math.min(1.55, o[o.length - 1][1]), ey = Math.min(1.55, y[y.length - 1][1]);
    if (Math.abs(eo - ey) < 0.24) { var mid = (eo + ey) / 2; if (eo >= ey) { eo = mid + 0.12; ey = mid - 0.12; } else { eo = mid - 0.12; ey = mid + 0.12; } }
    ax.text(DAYS + 0.8, clamp(eo, 0.1, 1.5) - 0.03, 'old', 'start');
    ax.text(DAYS + 0.8, clamp(ey, 0.1, 1.5) - 0.03, 'young', 'start');
      }

  /* ------------------------------------------------------------ styles */
  var css = '\
.nt-intro{font-family:var(--ui);font-size:15px;max-width:60em;margin:4px 0 10px}\
.nt-ws .ws-why-b p{margin:0 0 8px}\
.nt-refs{font-size:13px;color:var(--ink2)}\
.ws .nt-enough{stroke:var(--ink2);stroke-width:1.2;fill:none}\
.ws .nt-stop{stroke:var(--ink);stroke-width:1.5;stroke-dasharray:1 3}\
.ws .ws-lab.nt-small{font-size:10.5px;fill:var(--ink2)!important}\
.ws .nt-old,.ws .nt-young{stroke-width:2}.ws .nt-sel{stroke-width:4}';
  if (!document.getElementById('nt-css')) { var stl = document.createElement('style'); stl.id = 'nt-css'; stl.textContent = css; document.head.appendChild(stl); }

  N.register('tissue', {
    mount: function (host) {
      dead = false;
      if (!window.WS || !window.WS.create) { host.innerHTML = '<p class="wp-nut-wait">The leaf workstation needs the workstation kit, which did not load.</p>'; return; }
      build(host);
    },
    update: function () { if (ws) ws.kick(); },
    unmount: function () {
      dead = true;
      if (ledger && ledger.destroy) ledger.destroy();
      if (ws) ws.destroy();
      ws = null; ledger = null; ledgerHost = null;
    }
  });
})();

/* The Water Path v8: n_field.js (nutrient path, Plate I Field: the soil solution)
   Registered with WP.nutrient.register('field', {mount, update, unmount}); loaded lazily by nutrient.js.

   Two interactives:
     (2) THE DEPLETION ZONE, mass flow versus diffusion (this file): a linked workstation (WS kit).
         A root in a cut away soil block; the colour on every cut face and on the draggable slice is the
         solution concentration from a radial convection diffusion model; a top down map at the slice;
         a plot of concentration against distance from the root surface with the depletion shell marked.
     (4) AVAILABILITY IS NOT ABUNDANCE: pH and the speciation of iron, phosphorus and nitrogen
         (n_field_ph.js, loaded with WP.nutrient.load('field_ph')).
   At the end of the panel the chain module (n_chain.js, another team) is mounted into #n-chain-host
   if it exists; if it is missing nothing is shown.

   The model (DERIVED equations, ILLUSTRATIVE inputs):
     b dC/dt = (1/r) d/dr [ r Dl theta f dC/dr + r0 v0 C ]        C = solution concentration
     at r = r0:  Dl theta f dC/dr + v0 C = Imax C / (Km + C)      uptake at the root surface
     far away:   C = C0
   Solved implicitly (backward Euler, finite volumes on a log spaced radial grid, Thomas algorithm), so the
   whole 6 day history for all three nutrients costs well under a millisecond and is cached per
   transpiration setting; the animation only reads it. Axial diffusion is ignored: each depth is its own
   cylinder whose age is the time since the root tip passed that depth. */
(function () {
  'use strict';
  var WP = window.WP, N = WP && WP.nutrient;
  if (!N) return;

  /* ============================================================ the model */
  var TH = 0.3, FI = 0.3, R0 = 0.02, RMAX = 8, NR = 150, DAYS = 6, DT = 0.05, STEPS = Math.round(DAYS / DT);
  var VMAX = 4e-6;                     // water influx at the root surface at 100 % transpiration, cm/s
  var R0MM = R0 * 10;                  // root radius, mm
  var BLOCK = 10, DEPTH = 24;          // block half width and height, mm (1 world unit = 10 mm)
  var TIP0 = 2, GROW = 3.5;            // tip depth at day 0 (mm) and growth speed (mm per day)
  var TIPFIX = 22;                     // tip depth when growth is off
  var NUTS = {
    nitrate: { id: 'nitrate', name: 'Nitrate', f: 'NO₃⁻', Dl: 1.9e-5, b: 0.3, C0: 1, Imax: 4e-6, Km: 0.03 },
    potassium: { id: 'potassium', name: 'Potassium', f: 'K⁺', Dl: 2.0e-5, b: 2, C0: 0.3, Imax: 3e-6, Km: 0.02 },
    phosphate: { id: 'phosphate', name: 'Phosphate', f: 'H₂PO₄⁻', Dl: 0.89e-5, b: 10, C0: 0.005, Imax: 1e-6, Km: 0.005 }
  };
  /* v18: the buffer powers b of potassium (was 15) and phosphate (was 300) are TUNED, not measured, so the model's
     shells land on the scale a review gives: phosphate about 3 mm by day 6, nitrate about 2 cm, potassium between.
     The Dl values are internal constants only; they are never shown on the page (DO NOT USE list). */
  var ORDER = ['nitrate', 'potassium', 'phosphate'];
  /* how far each nutrient is drawn down around a root, from a review (York et al. 2016, Table 1): SECONDARY.
     Potassium has no row there, so it gets no marker. Distances from the root surface, mm. */
  var REVIEW = { phosphate: { mm: 3, txt: 'about 3 mm', el: 'phosphorus' }, nitrate: { mm: 20, txt: 'about 2 cm', el: 'nitrogen (mostly nitrate in soil)' } };
  var YORK = 'York, Carminati, Mooney, Ritz and Bennett 2016, J Exp Bot 67: 3629 to 3643, a review (Table 1). The table has no reference column.';
  var YORK_LINK = '(York et al. 2016, J Exp Bot 67: 3629, <a href="https://doi.org/10.1093/jxb/erw108" target="_blank" rel="noopener">doi 10.1093/jxb/erw108</a>)';
  var LNQ = Math.log(RMAX / R0) / NR;
  var FACE = new Float64Array(NR + 1), CEN = new Float64Array(NR), VOL = new Float64Array(NR);
  (function () {
    for (var k = 0; k <= NR; k++) FACE[k] = R0 * Math.exp(LNQ * k);
    for (var i = 0; i < NR; i++) { CEN[i] = Math.sqrt(FACE[i] * FACE[i + 1]); VOL[i] = Math.PI * (FACE[i + 1] * FACE[i + 1] - FACE[i] * FACE[i]); }
  })();

  function simulate(P, v0) {
    var D = P.Dl * TH * FI, b = P.b, C0 = P.C0, Q = 2 * Math.PI * R0 * v0, dt = DT * 86400;
    var C = new Float64Array(NR), hist = new Float32Array((STEPS + 1) * NR);
    var U = new Float32Array(STEPS + 1), CS = new Float32Array(STEPS + 1), W = new Float32Array(STEPS + 1);
    var a = new Float64Array(NR), bb = new Float64Array(NR), c = new Float64Array(NR), d = new Float64Array(NR);
    var i, k, s;
    for (i = 0; i < NR; i++) C[i] = C0;
    function rec(s) {
      for (var j = 0; j < NR; j++) hist[s * NR + j] = C[j] / C0;
      U[s] = P.Imax * C[0] / (P.Km + C[0]); CS[s] = C[0] / C0; W[s] = widthOf(hist, s * NR);
    }
    rec(0);
    for (s = 1; s <= STEPS; s++) {
      for (i = 0; i < NR; i++) { a[i] = 0; c[i] = 0; bb[i] = b * VOL[i] / dt; d[i] = bb[i] * C[i]; }
      /* inward flux through face k (between cells k-1 and k): G (C_k - C_k-1) + Q C_k (upwind, water flows in) */
      for (k = 1; k < NR; k++) {
        var G = 2 * Math.PI * FACE[k] * D / (CEN[k] - CEN[k - 1]);
        bb[k] += G + Q; a[k] -= G;
        bb[k - 1] += G; c[k - 1] -= G + Q;
      }
      var Go = 2 * Math.PI * FACE[NR] * D / (FACE[NR] - CEN[NR - 1]);
      bb[NR - 1] += Go; d[NR - 1] += (Go + Q) * C0;
      bb[0] += 2 * Math.PI * R0 * P.Imax / (P.Km + C[0]);       // Michaelis Menten uptake, linearised on the last step
      for (i = 1; i < NR; i++) { var m = a[i] / bb[i - 1]; bb[i] -= m * c[i - 1]; d[i] -= m * d[i - 1]; }
      C[NR - 1] = d[NR - 1] / bb[NR - 1];
      for (i = NR - 2; i >= 0; i--) C[i] = (d[i] - c[i] * C[i + 1]) / bb[i];
      rec(s);
    }
    return { P: P, v0: v0, hist: hist, U: U, CS: CS, W: W, Ufresh: P.Imax * C0 / (P.Km + C0) };
  }
  /* depletion shell width (mm from the root surface): where the dip has shrunk to a tenth of its value at the
     root. No shell when the dip at the root is under 2 %. */
  function widthOf(h, o) {
    var dep = 1 - h[o];
    if (dep < 0.02) return 0;
    var lim = 0.1 * dep;
    for (var i = 1; i < NR; i++) {
      var e1 = 1 - h[o + i];
      if (e1 <= lim) {
        var e0 = 1 - h[o + i - 1], f = (e0 - lim) / Math.max(1e-9, e0 - e1);
        return (CEN[i - 1] + f * (CEN[i] - CEN[i - 1]) - R0) * 10;
      }
    }
    return (RMAX - R0) * 10;
  }
  var cache = {};
  function sims(tr) {
    var key = String(Math.round(tr));
    if (!cache[key]) { var o = {}; ORDER.forEach(function (n) { o[n] = simulate(NUTS[n], VMAX * Math.round(tr) / 100); }); cache[key] = o; }
    return cache[key];
  }
  function lerpStep(arr, age) {
    var s = Math.max(0, Math.min(STEPS, age / DT)), i0 = Math.floor(s), i1 = Math.min(STEPS, i0 + 1), f = s - i0;
    return arr[i0] * (1 - f) + arr[i1] * f;
  }
  function profileInto(sim, age, buf) {
    var s = Math.max(0, Math.min(STEPS, age / DT)), i0 = Math.floor(s), i1 = Math.min(STEPS, i0 + 1), f = s - i0;
    var h = sim.hist, o0 = i0 * NR, o1 = i1 * NR;
    for (var k = 0; k < NR; k++) buf[k] = h[o0 + k] * (1 - f) + h[o1 + k] * f;
    return buf;
  }
  /* fractional cell index of a distance from the root axis (mm); -1 inside the root */
  function cellIndex(rmm) {
    if (rmm < R0MM) return -1;
    var x = Math.log(rmm / 10 / R0) / LNQ - 0.5;
    return x < 0 ? 0 : x;
  }
  function valAt(buf, fi) {
    if (fi >= NR - 1) return 1;
    var i = Math.floor(fi), f = fi - i;
    return buf[i] * (1 - f) + buf[i + 1] * f;
  }
  function tipDepth(st) { return st.grow ? Math.min(DEPTH, TIP0 + GROW * st.t) : TIPFIX; }
  /* age (days) of the root piece at depth d (mm); -1 where the root has not arrived */
  function ageAt(d, st) {
    var tip = tipDepth(st);
    if (d > tip) return -1;
    if (!st.grow) return st.t;
    return st.t - Math.max(0, (d - TIP0) / GROW);
  }
  /* the numbers at the slice depth, and uptake averaged over the whole root in the block */
  function here(st) {
    var S = sims(st.tr), sim = S[st.nut], d = depthOf(st.y), age = ageAt(d, st), o = { d: d, age: age, has: age >= 0, sim: sim };
    if (o.has) {
      o.w = lerpStep(sim.W, age); o.cs = lerpStep(sim.CS, age);
      var U = lerpStep(sim.U, age);
      o.up = U / sim.Ufresh;
      o.mf = sim.v0 * o.cs * sim.P.C0 / Math.max(1e-30, U);
    }
    var tip = tipDepth(st), n = 0, sum = 0, nt = 0, st2 = 0;
    for (var z = 0; z <= tip; z += 0.25) {
      var a = ageAt(z, st); if (a < 0) continue;
      var u = lerpStep(sim.U, a) / sim.Ufresh; sum += u; n++;
      if (z >= tip - 2) { st2 += u; nt++; }
    }
    o.upAvg = n ? sum / n : 1;
    o.upTip = nt ? st2 / nt : 1;
    o.tip = tip;
    return o;
  }
  function depthOf(y) { return Math.max(0, Math.min(DEPTH, (1.2 - y) * 10)); }

  /* ============================================================ colour */
  var LUTN = 512, VMAXC = 1.4, lut = new Uint8ClampedArray(LUTN * 3), rootRGB = [0, 0, 0], edgeRGB = [0, 0, 0];
  var STOPS = {
    light: [[0, '#fbf6ea'], [0.5, '#d3e5d4'], [0.85, '#7fb5a6'], [1.0, '#3c877d'], [1.4, '#0f3f4c']],
    dark: [[0, '#14181c'], [0.5, '#1f3a39'], [0.85, '#2e786d'], [1.0, '#4db09d'], [1.4, '#cbf3e5']]
  };
  function hexRGB(h) { return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; }
  function isDark() { return window.WS ? WS.isDark() : false; }
  function buildLut() {
    var st = STOPS[isDark() ? 'dark' : 'light'].map(function (s) { return [s[0], hexRGB(s[1])]; });
    for (var i = 0; i < LUTN; i++) {
      var v = i / (LUTN - 1) * VMAXC, j = 0;
      while (j < st.length - 2 && v > st[j + 1][0]) j++;
      var f = Math.max(0, Math.min(1, (v - st[j][0]) / (st[j + 1][0] - st[j][0])));
      for (var k = 0; k < 3; k++) lut[i * 3 + k] = st[j][1][k] + (st[j + 1][1][k] - st[j][1][k]) * f;
    }
    rootRGB = isDark() ? [222, 208, 176] : [246, 238, 214];
    edgeRGB = isDark() ? [245, 240, 230] : [30, 24, 18];
  }
  function lutCss(v) { var i = Math.round(Math.max(0, Math.min(1, v / VMAXC)) * (LUTN - 1)) * 3; return 'rgb(' + lut[i] + ',' + lut[i + 1] + ',' + lut[i + 2] + ')'; }

  /* ============================================================ texel layouts for the painted faces */
  function layout(w, h, fn) {
    var L = { w: w, h: h, r: new Float32Array(w * h), fi: new Float32Array(w * h), hole: new Uint8Array(w * h), depthRow: new Float32Array(h), px: 0 };
    var cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    L.canvas = cv; L.ctx = cv.getContext('2d'); L.img = L.ctx.createImageData(w, h);
    fn(L);
    for (var i = 0; i < w * h; i++) L.fi[i] = cellIndex(L.r[i]);
    return L;
  }
  var LAY = null;
  function makeLayouts() {
    LAY = {};
    /* the two cut faces through the root axis: r = distance along the face, rows = depth */
    LAY.cut = layout(200, 192, function (L) {
      L.px = BLOCK / L.w;
      for (var y = 0; y < L.h; y++) { L.depthRow[y] = (y + 0.5) / L.h * DEPTH; for (var x = 0; x < L.w; x++) L.r[y * L.w + x] = (x + 0.5) / L.w * BLOCK; }
    });
    /* the outer side faces, 10 mm from the axis */
    LAY.outer = layout(96, 192, function (L) {
      L.px = 2 * BLOCK / L.w;
      for (var y = 0; y < L.h; y++) { L.depthRow[y] = (y + 0.5) / L.h * DEPTH; for (var x = 0; x < L.w; x++) { var s = -1 + 2 * (x + 0.5) / L.w; L.r[y * L.w + x] = BLOCK * Math.sqrt(1 + s * s); } }
    });
    /* the soil surface, with the open quarter cut away */
    LAY.top = layout(220, 220, function (L) {
      L.px = 2 * BLOCK / L.w; L.flat = true;
      for (var y = 0; y < L.h; y++) for (var x = 0; x < L.w; x++) {
        var X = -1 + 2 * (x + 0.5) / L.w, Z = -1 + 2 * (y + 0.5) / L.h, i = y * L.w + x;
        L.r[i] = BLOCK * Math.sqrt(X * X + Z * Z); L.hole[i] = (X > 0 && Z > 0) ? 1 : 0;
      }
    });
    /* the slice, only in the open quarter */
    LAY.slice = layout(170, 170, function (L) {
      L.px = BLOCK / L.w; L.flat = true;
      for (var y = 0; y < L.h; y++) for (var x = 0; x < L.w; x++) { var X = (x + 0.5) / L.w, Z = (y + 0.5) / L.h; L.r[y * L.w + x] = BLOCK * Math.sqrt(X * X + Z * Z); }
    });
  }
  var rowBuf = new Float32Array(NR);
  /* paint one layout. depthFlat: the depth for a flat (horizontal) layout */
  function paint(L, st, depthFlat) {
    var sim = sims(st.tr)[st.nut], D = L.img.data, w = L.w, h = L.h, y, x, i, j;
    var age = -2, wmm = 0, lastAge = null;
    for (y = 0; y < h; y++) {
      var d = L.flat ? depthFlat : L.depthRow[y];
      var a = ageAt(d, st);
      if (a !== lastAge) {
        lastAge = a; age = a;
        if (a >= 0) { profileInto(sim, a, rowBuf); wmm = lerpStep(sim.W, a); } else wmm = 0;
      }
      var edgeR = R0MM + wmm, tol = L.px * 0.75;
      for (x = 0; x < w; x++) {
        i = y * w + x; j = i * 4;
        if (L.hole[i]) { D[j + 3] = 0; continue; }
        var r = L.r[i];
        if (age >= 0 && r < R0MM) { D[j] = rootRGB[0]; D[j + 1] = rootRGB[1]; D[j + 2] = rootRGB[2]; D[j + 3] = 255; continue; }
        if (age >= 0 && wmm > 0.02 && Math.abs(r - edgeR) < tol && (L.flat || ((y >> 2) & 1))) {
          D[j] = edgeRGB[0]; D[j + 1] = edgeRGB[1]; D[j + 2] = edgeRGB[2]; D[j + 3] = 255; continue;
        }
        var v = age >= 0 ? valAt(rowBuf, L.fi[i]) : 1;
        var k = Math.round(Math.max(0, Math.min(1, v / VMAXC)) * (LUTN - 1)) * 3;
        D[j] = lut[k]; D[j + 1] = lut[k + 1]; D[j + 2] = lut[k + 2]; D[j + 3] = 255;
      }
    }
    L.ctx.putImageData(L.img, 0, 0);
  }

  /* ============================================================ text helpers */
  function badge(t, s) { return window.WS ? WS.badge(t, s) : t; }
  function pct(v) { return Math.round(100 * v) + ' %'; }
  function mm(v) { return v < 1 ? v.toFixed(2).replace(/0$/, '') + ' mm' : (v < 10 ? v.toFixed(1) : String(Math.round(v))) + ' mm'; }
  function day(t) { return 'day ' + t.toFixed(1); }
  var IL = function (s) { return badge('ILLUSTRATIVE', s); };
  var DE = function (s) { return badge('DERIVED', s); };

  /* ============================================================ the depletion workstation */
  var dz = null;
  function buildDZ(host, st0) {
    var WS = window.WS;
    buildLut(); makeLayouts();
    var start = NUTS[st0.solute] ? st0.solute : 'nitrate';
    var ws = WS.create(host, {
      title: 'The depletion zone: mass flow versus diffusion',
      badge: 'ILLUSTRATIVE',
      what: 'A model root growing in a block of soil, with one quarter cut away so you can see inside. The colour is how much of a nutrient is <b>dissolved in the soil water</b>: strong colour means as much as at the start, faint colour means the root has taken it away. ' +
        'All soil and root numbers here are ' + IL('Diffusion coefficients, buffer powers, concentrations, uptake rates, water flow and root sizes are chosen to show the behaviour. No page level source was verified for them.') + '. The robust result is the order: <b>nitrate moves far, potassium less, phosphate barely</b>. ' +
        'For the real scale, a review puts the zone a root drains at <b>about 2 cm for nitrogen</b> and <b>about 3 mm for phosphorus</b> ' + badge('SECONDARY', YORK) + '. Read those against the ruler on the block.',
      todo: 'Press <b>Play</b> (or <b>Step</b>). Then change <b>Transpiration</b>: with nitrate, watch the faint zone around the root fill back in as the water carries nitrate to it. Switch to <b>phosphate</b>: a thin, almost empty shell opens and the root goes hungry. Turn <b>Root grows</b> on to let the root escape into fresh soil. Drag the flat slice (grab its round handle) or use <b>Slice depth</b>.',
      thing: 'A model root (cream) in a 20 mm wide soil block. Its root hairs are drawn for looks only: in this block they take up nothing. The panel below shows what hairs add. The two cut faces pass through the root; the flat slice shows the same field at one depth. A dark dashed line marks the edge of the <b>depletion shell</b>. Small blue dots are water moving toward the root; their speed is exaggerated, and they stop when transpiration is zero. The ruler on the soil surface starts at the root centre and runs out to 10 mm. A coloured tick marks the review distance for the nutrient chosen; that distance is measured from the root surface, not the centre. In this model a phosphate shell grows to a few millimetres: compare it with the ruler. Model rendering, not an image.',
      scanCaption: '<b>Top down map at the slice.</b> The dissolved nutrient around the root at the slice depth, seen from above. Same model, same colours. ' + IL('Model output from illustrative inputs.'),
      plotCaption: '<b>Concentration against distance from the root surface</b>, at the slice depth, on a stretched (log) distance scale so a shell of a few millimetres and one of 2 cm both fit. Bold: the nutrient chosen. Shaded: its depletion shell. ' + DE('Computed by the equations in the Why fold, from illustrative inputs.') + ' Dotted marks: how far a review says phosphorus (about 3 mm) and nitrogen (about 2 cm) are drawn down ' + badge('SECONDARY', YORK) + '.',
      why: whyHTML(),
      state: { nut: start, tr: 40, grow: false, t: 2, y: 0.2, zoom: 'wide' },
      camera: { dist: 5.0, theta: 0.78, phi: 1.08, target: [0.12, -0.05, 0.12], minDist: 1.2, maxDist: 12 }
    });
    var S = ws.state;
    dz = { ws: ws, lastSolute: st0.solute };

    /* ---- controls */
    ws.choice({ key: 'nut', label: 'Nutrient', options: [['nitrate', 'Nitrate NO₃⁻'], ['potassium', 'Potassium K⁺'], ['phosphate', 'Phosphate H₂PO₄⁻']] });
    ws.range({ key: 'tr', label: 'Transpiration', min: 0, max: 100, step: 5, fmt: function (v) { return Math.round(v) + ' %'; }, hint: 'how fast the leaves lose water, so how fast water flows into the root' });
    ws.toggle({ key: 'grow', label: 'Root grows' });
    ws.range({ key: 't', label: 'Time', min: 0, max: DAYS, step: 0.05, fmt: day, hint: 'Play runs the clock; drag to go back' });

    /* ---- 3D */
    var g = ws.gl, T = g && g.THREE, tex = {}, mats = {}, rootG = null, rootBody = null, tipM = null, hairs = null, hairN = 0, hairDepth = null, water = null, slicePlane = null;
    if (g) {
      var block = new T.Group(); g.root.add(block);
      function texOf(L) { var t = new T.CanvasTexture(L.canvas); t.minFilter = T.LinearFilter; t.magFilter = T.LinearFilter; t.generateMipmaps = false; return t; }
      tex.cut = texOf(LAY.cut); tex.outer = texOf(LAY.outer); tex.top = texOf(LAY.top); tex.slice = texOf(LAY.slice);
      function face(w, h, map, pos, rotY, rotX, uScale, shade) {
        var geo = new T.PlaneGeometry(w, h);
        if (uScale) { var uv = geo.attributes.uv; for (var i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * uScale); uv.needsUpdate = true; }
        var m = new T.MeshBasicMaterial({ map: map, side: T.DoubleSide, alphaTest: 0.5 });
        m.color.setScalar(shade || 1);
        var me = new T.Mesh(geo, m);
        me.position.set(pos[0], pos[1], pos[2]);
        if (rotY) me.rotation.y = rotY;
        if (rotX) me.rotation.x = rotX;
        block.add(me); return me;
      }
      var H = DEPTH / 10;
      /* a fixed shade per face direction, so the cut away corner reads as a corner */
      face(1, H, tex.cut, [0, 0, 0.5], -Math.PI / 2, 0, 0, 0.84);   // cut face in x = 0, z from 0 to 1
      face(1, H, tex.cut, [0.5, 0, 0], 0, 0, 0, 1);                 // cut face in z = 0, x from 0 to 1
      face(2, H, tex.outer, [-1, 0, 0], -Math.PI / 2, 0, 0, 0.84);  // outer faces
      face(2, H, tex.outer, [0, 0, -1], 0, 0, 0, 1);
      face(1, H, tex.outer, [1, 0, -0.5], -Math.PI / 2, 0, 0.5, 0.84);
      face(1, H, tex.outer, [-0.5, 0, 1], 0, 0, 0.5, 1);
      face(2, 2, tex.top, [0, H / 2, 0], 0, -Math.PI / 2, 0, 0.93);  // soil surface
      var shp = new T.Shape(); shp.moveTo(-1, -1); shp.lineTo(1, -1); shp.lineTo(1, 0); shp.lineTo(0, 0); shp.lineTo(0, 1); shp.lineTo(-1, 1); shp.closePath();
      mats.bottom = new T.MeshBasicMaterial({ color: 0x888888, side: T.DoubleSide });
      var bot = new T.Mesh(new T.ShapeGeometry(shp), mats.bottom);
      bot.rotation.x = Math.PI / 2; bot.position.y = -H / 2; block.add(bot);
      slicePlane = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: tex.slice, side: T.DoubleSide }));
      slicePlane.rotation.x = -Math.PI / 2; block.add(slicePlane);
      /* block outline, the L shaped prism */
      var Y1 = H / 2, Y0 = -H / 2, L = [[-1, -1], [1, -1], [1, 0], [0, 0], [0, 1], [-1, 1]], pts = [];
      for (var i = 0; i < L.length; i++) {
        var p = L[i], q2 = L[(i + 1) % L.length];
        pts.push(p[0], Y1, p[1], q2[0], Y1, q2[1], p[0], Y0, p[1], q2[0], Y0, q2[1], p[0], Y0, p[1], p[0], Y1, p[1]);
      }
      var eg = new T.BufferGeometry(); eg.setAttribute('position', new T.Float32BufferAttribute(pts, 3));
      mats.edge = new T.LineBasicMaterial({ color: 0x888888 });
      block.add(new T.LineSegments(eg, mats.edge));

      /* a ruler on the soil surface along the cut edge (z = 0), from the root centre out to 10 mm, with a tick for
         the review distance of the chosen nutrient (from the root surface, so at root radius + that distance) */
      var rulerG = new T.Group(); rulerG.position.set(0, H / 2 + 0.006, 0.004); block.add(rulerG);
      var rp = [0, 0, 0, 1, 0, 0];
      for (var mmk = 0; mmk <= 10; mmk++) { var tl = mmk % 5 === 0 ? 0.075 : 0.035; rp.push(mmk / 10, 0, 0, mmk / 10, tl, 0); }
      var rg = new T.BufferGeometry(); rg.setAttribute('position', new T.Float32BufferAttribute(rp, 3));
      mats.ruler = new T.LineBasicMaterial({ color: 0x222222, depthTest: false });
      var rulerL = new T.LineSegments(rg, mats.ruler); rulerL.renderOrder = 10; rulerG.add(rulerL);
      var revG = new T.BufferGeometry(); revG.setAttribute('position', new T.Float32BufferAttribute([0, -0.02, 0, 0, 0.25, 0], 3));
      mats.rev = new T.LineBasicMaterial({ color: 0x9a4320, depthTest: false });
      var revL = new T.Line(revG, mats.rev); revL.renderOrder = 11; rulerG.add(revL);
      var revM = new T.Mesh(new T.ConeGeometry(0.022, 0.05, 12), new T.MeshBasicMaterial({ color: 0x9a4320, depthTest: false }));
      revM.rotation.x = Math.PI; revM.position.y = 0.04; revM.renderOrder = 11; revL.add(revM); mats.revM = revM.material;
      var rk = 1;   /* label scale: larger on phones */
      function textSprite(txt, hWorld) {
        var cv = document.createElement('canvas'), cx = cv.getContext('2d'), fs = 40;
        cx.font = '600 ' + fs + 'px ' + WS.token('ui');
        cv.width = Math.ceil(cx.measureText(txt).width) + 16; cv.height = fs + 14;
        var tx = new T.CanvasTexture(cv); tx.minFilter = T.LinearFilter; tx.generateMipmaps = false;
        var sp = new T.Sprite(new T.SpriteMaterial({ map: tx, depthTest: false, transparent: true }));
        sp.renderOrder = 12; sp.scale.set(hWorld * rk * cv.width / cv.height, hWorld * rk, 1);
        sp.userData = { cv: cv, txt: txt, tex: tx, h: hWorld };
        sp.userData.draw = function (col, back) {
          var c2 = cv.getContext('2d'); c2.clearRect(0, 0, cv.width, cv.height);
          c2.fillStyle = back; c2.globalAlpha = 0.82; c2.fillRect(0, 0, cv.width, cv.height); c2.globalAlpha = 1;
          c2.font = '600 ' + fs + 'px ' + WS.token('ui'); c2.fillStyle = col; c2.textBaseline = 'middle'; c2.fillText(sp.userData.txt, 8, cv.height / 2 + 2);
          tx.needsUpdate = true;
        };
        sp.userData.setText = function (t2) {
          sp.userData.txt = t2; var c2 = cv.getContext('2d'); c2.font = '600 ' + fs + 'px ' + WS.token('ui');
          cv.width = Math.ceil(c2.measureText(t2).width) + 16; cv.height = fs + 14;
          sp.scale.set(hWorld * rk * cv.width / cv.height, hWorld * rk, 1);
          tx.dispose(); tx = new T.CanvasTexture(cv); tx.minFilter = T.LinearFilter; tx.generateMipmaps = false; sp.material.map = tx; sp.material.needsUpdate = true;
        };
        rulerG.add(sp); return sp;
      }
      var rLab = [textSprite('0', 0.1), textSprite('5 mm', 0.1), textSprite('10 mm', 0.1)];
      rLab[0].position.set(-0.06, 0.15, 0); rLab[1].position.set(0.5, 0.15, 0); rLab[2].position.set(1, 0.15, 0);
      var revLab = textSprite('review', 0.1);
      dz.ruler = {
        labs: rLab, revLab: revLab, revL: revL, cur: '',
        paint: function (dark) {
          var ink = WS.token('ink'), back = WS.token('wall');
          mats.ruler.color.set(ink); mats.rev.color.set(WS.token('warm')); mats.revM.color.set(WS.token('warm'));
          rLab.forEach(function (l) { l.userData.draw(ink, back); });
          revLab.userData.draw(WS.token('warm'), back);
        },
        fit: function (wpx) {
          var k = wpx && wpx < 560 ? 1.9 : 1;
          if (k === rk) return;
          rk = k;
          rLab[1].visible = k === 1;
          rLab.forEach(function (l, i) { var h0 = l.userData.h; l.scale.set(h0 * rk * l.userData.cv.width / l.userData.cv.height, h0 * rk, 1); l.position.y = 0.15 * rk; });
          rLab[0].position.x = -0.06 * rk;
          this.cur = ''; this.set(this.nut || 'nitrate');
        },
        set: function (nut) {
          this.nut = nut;
          var R = REVIEW[nut], key = nut, ph = rk > 1;
          if (key === this.cur) return; this.cur = key;
          if (!R) { revL.visible = false; revLab.visible = false; return; }
          revLab.visible = true;
          if (R.mm + R0MM <= 10) {
            var x = (R.mm + R0MM) / 10; revL.visible = true; revL.position.x = x;
            revLab.userData.setText(ph ? 'P: about 3 mm' : 'P review: about 3 mm'); revLab.position.set(x + (ph ? 0.3 : 0.05), ph ? -0.16 : 0.3, 0);
          } else {
            revL.visible = false;
            revLab.userData.setText(ph ? 'N: 2 cm, off ruler' : 'N review: about 2 cm, past this ruler'); revLab.position.set(ph ? 0.45 : 0.55, ph ? -0.16 : 0.3, 0);
          }
          revLab.userData.draw(WS.token('warm'), WS.token('wall'));
        }
      };
      dz.ruler.paint(isDark());

      /* the root: a body from above the soil to the tip, a tip cone, and hairs */
      rootG = new T.Group(); block.add(rootG);
      mats.root = new T.MeshStandardMaterial({ color: 0xf3ead2, roughness: 0.6, metalness: 0 });
      var rr = R0MM / 10;
      var bodyGeo = new T.CylinderGeometry(rr, rr, 1, 20, 1, true); bodyGeo.translate(0, -0.5, 0);
      rootBody = new T.Mesh(bodyGeo, mats.root); rootBody.position.y = H / 2; rootG.add(rootBody);
      tipM = new T.Mesh(new T.ConeGeometry(rr, rr * 3, 20), mats.root); tipM.rotation.x = Math.PI; rootG.add(tipM);
      /* hairs: sorted by depth, so a draw range shows only those behind the tip */
      var seed = 11; function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
      var hp = [], hd = [];
      for (var dmm = 0.4; dmm <= DEPTH; dmm += 0.1) {
        for (var k2 = 0; k2 < 3; k2++) {
          var ang = rnd() * Math.PI * 2, len = (0.3 + rnd() * 0.4) / 10, yy = H / 2 - dmm / 10, tilt = (rnd() - 0.5) * 0.02;
          hp.push(Math.cos(ang) * rr, yy, Math.sin(ang) * rr, Math.cos(ang) * (rr + len), yy + tilt + len * 0.25, Math.sin(ang) * (rr + len));
          hd.push(dmm);
        }
      }
      hairN = hd.length; hairDepth = hd;
      var hg = new T.BufferGeometry(); hg.setAttribute('position', new T.Float32BufferAttribute(hp, 3));
      mats.hair = new T.LineBasicMaterial({ color: 0xf3ead2 });
      hairs = new T.LineSegments(hg, mats.hair); rootG.add(hairs);

      /* water parcels in the open quarter, drifting toward the root */
      var NW = 260, wpos = new Float32Array(NW * 3), wr = new Float32Array(NW), wa = new Float32Array(NW), wy = new Float32Array(NW);
      function spawn(i, anyR) {
        wa[i] = 0.06 + rnd() * (Math.PI / 2 - 0.12);
        var lim = 1 / Math.max(Math.cos(wa[i]), Math.sin(wa[i]));
        wr[i] = anyR ? 0.05 + rnd() * (lim - 0.07) : lim - 0.02 - rnd() * 0.1;
        wy[i] = -H / 2 + rnd() * H;
      }
      for (i = 0; i < NW; i++) spawn(i, true);
      var wg = new T.BufferGeometry(); wg.setAttribute('position', new T.BufferAttribute(wpos, 3));
      mats.water = new T.PointsMaterial({ color: 0x5487c3, size: 3, sizeAttenuation: false, transparent: true, opacity: 0.9, depthWrite: false });
      water = new T.Points(wg, mats.water); water.frustumCulled = false; block.add(water);
      function placeWater(st) {
        var yTip = H / 2 - tipDepth(st) / 10;
        for (var i = 0; i < NW; i++) {
          var on = wy[i] > yTip;
          wpos[i * 3] = on ? wr[i] * Math.cos(wa[i]) : 0; wpos[i * 3 + 1] = on ? wy[i] : 99; wpos[i * 3 + 2] = on ? wr[i] * Math.sin(wa[i]) : 0;
        }
        wg.attributes.position.needsUpdate = true;
      }
      dz.water = { step: function (dtReal, st) {
        var sp = 0.035 * st.tr / 100;
        if (sp <= 0) return;
        for (var i = 0; i < NW; i++) {
          wr[i] -= dtReal * sp * (0.3 / Math.max(wr[i], 0.06));
          if (wr[i] < rr * 1.3) spawn(i, false);
        }
      }, place: placeWater };

      ws.onTheme(function (dark) {
        buildLut();
        mats.edge.color.set(WS.token('ink'));
        mats.bottom.color.set(WS.token('soil2'));
        mats.root.color.set(dark ? '#ded0b0' : '#f6eed6');
        mats.hair.color.set(dark ? '#ded0b0' : '#efe2c0');
        mats.water.color.set(WS.token(dark ? 'w2' : 'w2'));
        dz.ruler.paint(dark);
        ws.render();
      });
      ws.slice({ key: 'y', axis: 'y', min: -1.15, max: 1.15, size: [2.3, 2.3], label: 'Slice depth', fmt: function (v) { return Math.round(depthOf(v)) + ' mm deep'; } });
    } else {
      ws.slice({ key: 'y', axis: 'y', min: -1.15, max: 1.15, label: 'Slice depth', fmt: function (v) { return Math.round(depthOf(v)) + ' mm deep'; } });
      ws.onTheme(function () { buildLut(); ws.render(); });
    }
    ws.choice({ key: 'zoom', label: 'Map width', options: [['wide', '20 mm'], ['close', '4 mm']] });
    var stats = document.createElement('div');
    stats.className = 'ws-c nf-stats';
    ws.controls.appendChild(stats);

    /* ---- every pane follows the state */
    var lastKey = '', lastNut = S.nut;
    ws.on(function (st) {
      if (st.nut !== lastNut) { lastNut = st.nut; var z = 'wide'; if (st.zoom !== z) { ws.set({ zoom: z }); return; } }
      var key = [st.nut, st.tr, st.grow, st.t.toFixed(3), st.y.toFixed(4), isDark()].join('|');
      if (key !== lastKey) {
        lastKey = key;
        paint(LAY.cut, st); paint(LAY.outer, st); paint(LAY.top, st, 0); paint(LAY.slice, st, depthOf(st.y));
        if (g) {
          tex.cut.needsUpdate = tex.outer.needsUpdate = tex.top.needsUpdate = tex.slice.needsUpdate = true;
          var Hh = DEPTH / 10, tipD = tipDepth(st), yTip = Hh / 2 - tipD / 10;
          rootBody.scale.y = Math.max(0.001, Hh / 2 - yTip);
          tipM.position.y = yTip - R0MM / 10 * 1.5;
          var n = 0; while (n < hairN && hairDepth[n] < tipD - 1.5) n++;
          hairs.geometry.setDrawRange(0, n * 2);
          slicePlane.position.set(0.5, st.y + 0.003, 0.5);
          dz.water.place(st);
          dz.ruler.fit(g.renderer.domElement.clientWidth); dz.ruler.set(st.nut);
        }
      }
      var o = here(st);
      stats.innerHTML = statsHTML(st, o);
      ws.say(sayHTML(st, o));
    });
    if (g) ws.onFrame(function (t, dt, st) { frame(dt, st); dz.water.step(dt, st); });
    else ws.onFrame(function (t, dt, st) { frame(dt, st); });
    var hold = 0;
    function frame(dt, st) {
      if (dt <= 0) return;
      var nt = st.t + dt * 0.5;
      if (st.t >= DAYS - 1e-6) { hold += dt; if (hold > 1.6) { hold = 0; nt = 0; } else nt = DAYS; }
      ws.set({ t: Math.min(DAYS, nt) });
    }

    /* ---- the static drawing when 3D is missing: the cut face, mirrored, as a vertical section */
    ws.fallback(function (c, w, h, st) {
      c.fillStyle = WS.token('card2'); c.fillRect(0, 0, w, h);
      var top = 22, bot = h - 70, sc = Math.min((bot - top) / DEPTH, (w - 40) / (2 * BLOCK)), half = BLOCK * sc, cx = w / 2;
      c.imageSmoothingEnabled = true;
      c.drawImage(LAY.cut.canvas, cx, top, half, DEPTH * sc);
      c.save(); c.translate(cx, 0); c.scale(-1, 1); c.drawImage(LAY.cut.canvas, 0, top, half, DEPTH * sc); c.restore();
      c.strokeStyle = WS.token('ink2'); c.lineWidth = 1; c.strokeRect(cx - half, top, 2 * half, DEPTH * sc);
      var ys = top + depthOf(st.y) * sc;
      c.strokeStyle = WS.token('accent'); c.lineWidth = 3; c.setLineDash([6, 4]);
      c.beginPath(); c.moveTo(cx - half - 10, ys); c.lineTo(cx + half + 10, ys); c.stroke(); c.setLineDash([]);
      c.fillStyle = WS.token('ink'); c.font = '12px ' + WS.token('ui');
      c.fillText('soil surface', cx - half, top - 6);
      /* ruler along the soil surface, root centre to 10 mm, with the review distance for the chosen nutrient */
      c.strokeStyle = WS.token('ink'); c.lineWidth = 1; c.beginPath(); c.moveTo(cx, top - 1); c.lineTo(cx + half, top - 1);
      for (var mk = 0; mk <= 10; mk++) { var xx = cx + mk * sc, tl = mk % 5 ? 3 : 6; c.moveTo(xx, top - 1); c.lineTo(xx, top - 1 - tl); }
      c.stroke();
      c.font = '11px ' + WS.token('ui'); c.fillText('5 mm', cx + 5 * sc - 12, top - 9); c.fillText('10 mm', cx + half - 30, top - 9);
      var Rv = REVIEW[st.nut];
      if (Rv && Rv.mm + R0MM <= 10) {
        var xr = cx + (Rv.mm + R0MM) * sc; c.strokeStyle = WS.token('warm'); c.lineWidth = 2;
        c.beginPath(); c.moveTo(xr, top - 1); c.lineTo(xr, top + 14); c.stroke();
        c.fillStyle = WS.token('warm'); c.fillText('P review', xr + 3, top + 12); c.fillStyle = WS.token('ink');
      }
      c.font = '12px ' + WS.token('ui');
      c.fillText('slice', Math.min(w - 34, cx + half + 4), ys - 6);
      c.fillText('a vertical cut through the root, 20 mm wide', cx - half, bot + 16);
    });

    /* ---- the map */
    var mapCv = document.createElement('canvas'), mapCx = mapCv.getContext('2d'), mapBuf = new Float32Array(NR);
    var hairAng = []; (function () { var s = 5; for (var i = 0; i < 70; i++) { s = (s * 16807) % 2147483647; var a = s / 2147483647; s = (s * 16807) % 2147483647; hairAng.push([a * Math.PI * 2, 0.3 + 0.4 * s / 2147483647]); } })();
    ws.paintScan(function (c, w, h, st) {
      var o = here(st), sim = sims(st.tr)[st.nut], half = st.zoom === 'close' ? 2 : BLOCK;
      var dpr = Math.min(2, window.devicePixelRatio || 1), legendW = Math.min(118, w * 0.34);
      var side = Math.max(60, Math.min(h - 30, w - legendW - 18)), X0 = 8, Y0 = 20;
      var P = Math.max(16, Math.round(side * dpr));
      if (mapCv.width !== P) { mapCv.width = mapCv.height = P; }
      var img = mapCx.createImageData(P, P), D = img.data;
      if (o.has) profileInto(sim, o.age, mapBuf);
      var wmm = o.has ? o.w : 0;
      for (var y = 0; y < P; y++) for (var x = 0; x < P; x++) {
        var X = (x + 0.5) / P * 2 - 1, Y = (y + 0.5) / P * 2 - 1, r = Math.sqrt(X * X + Y * Y) * half, j = (y * P + x) * 4, v;
        if (o.has && r < R0MM) { D[j] = rootRGB[0]; D[j + 1] = rootRGB[1]; D[j + 2] = rootRGB[2]; D[j + 3] = 255; continue; }
        v = o.has ? valAt(mapBuf, cellIndex(r)) : 1;
        var k = Math.round(Math.max(0, Math.min(1, v / VMAXC)) * (LUTN - 1)) * 3;
        D[j] = lut[k]; D[j + 1] = lut[k + 1]; D[j + 2] = lut[k + 2]; D[j + 3] = 255;
      }
      mapCx.putImageData(img, 0, 0);
      c.fillStyle = WS.token('card2'); c.fillRect(0, 0, w, h);
      c.imageSmoothingEnabled = true;
      c.drawImage(mapCv, X0, Y0, side, side);
      var cx = X0 + side / 2, cy = Y0 + side / 2, k2 = side / 2 / half;
      c.save(); c.beginPath(); c.rect(X0, Y0, side, side); c.clip();
      if (o.has) {
        c.strokeStyle = WS.token('ink'); c.lineWidth = 1;
        if (o.age > 0.02 && o.d < o.tip - 1.5) {
          c.globalAlpha = 0.45; c.lineWidth = 0.8;
          hairAng.forEach(function (ha) { var a = ha[0], r1 = R0MM * k2, r2 = (R0MM + ha[1]) * k2; c.beginPath(); c.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); c.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2); c.stroke(); });
          c.globalAlpha = 1; c.lineWidth = 1;
        }
        c.beginPath(); c.arc(cx, cy, Math.max(1.5, R0MM * k2), 0, Math.PI * 2); c.fillStyle = 'rgb(' + rootRGB.join(',') + ')'; c.fill(); c.stroke();
        if (wmm > 0.02) {
          c.setLineDash([5, 4]); c.lineWidth = 2; c.strokeStyle = WS.token('ink');
          c.beginPath(); c.arc(cx, cy, (R0MM + wmm) * k2, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);
        }
      }
      c.restore();
      c.strokeStyle = WS.token('ink2'); c.lineWidth = 1; c.strokeRect(X0 + 0.5, Y0 + 0.5, side - 1, side - 1);
      /* scale bar */
      var bar = half > 5 ? 5 : 1, bpx = bar * k2;
      c.fillStyle = WS.token('wall'); c.globalAlpha = 0.85; c.fillRect(X0 + 4, Y0 + side - 22, bpx + 50, 18); c.globalAlpha = 1;
      c.strokeStyle = WS.token('ink'); c.lineWidth = 2; c.beginPath(); c.moveTo(X0 + 8, Y0 + side - 9); c.lineTo(X0 + 8 + bpx, Y0 + side - 9); c.stroke();
      c.fillStyle = WS.token('ink'); c.font = '11px ' + WS.token('ui'); c.fillText(bar + ' mm', X0 + 12 + bpx, Y0 + side - 5);
      c.fillStyle = WS.token('ink2'); c.fillText('model rendering, seen from above', X0, 13);
      /* legend */
      var lx = X0 + side + 12, ly = Y0 + 4, lh = Math.max(50, Math.min(110, side - 70));
      for (var i = 0; i <= lh; i++) { c.fillStyle = lutCss(VMAXC * (1 - i / lh)); c.fillRect(lx, ly + i, 12, 1); }
      c.strokeStyle = WS.token('ink2'); c.strokeRect(lx + 0.5, ly + 0.5, 11, lh);
      c.fillStyle = WS.token('ink'); c.font = '11px ' + WS.token('ui');
      function lab(v, s) { var yy = ly + lh * (1 - v / VMAXC); c.fillRect(lx + 12, yy, 4, 1); c.fillText(s, lx + 19, yy + 4); }
      lab(1.4, 'more than start'); lab(1, '100 % (start)'); lab(0.5, '50 %'); lab(0, '0 %');
      var ty = ly + lh + 18;
      c.fillStyle = WS.token('ink');
      wrapText(c, 'depth ' + Math.round(o.d) + ' mm', lx, ty, w - lx - 4); ty += 15;
      if (o.has) {
        wrapText(c, 'root age ' + o.age.toFixed(1) + ' d', lx, ty, w - lx - 4); ty += 15;
        if (wmm > 0.02 && ty < h - 4) {
          c.strokeStyle = WS.token('ink'); c.lineWidth = 2; c.setLineDash([5, 4]);
          c.beginPath(); c.moveTo(lx, ty - 4); c.lineTo(lx + 16, ty - 4); c.stroke(); c.setLineDash([]);
          wrapText(c, 'shell edge', lx + 20, ty, w - lx - 24);
        }
      } else wrapText(c, 'no root here yet', lx, ty, w - lx - 4);
    });
    function wrapText(c, s, x, y, maxw) { c.fillText(s, x, y, maxw); }

    /* ---- the plot */
    var plotBuf = new Float32Array(NR);
    var DASH = { nitrate: null, potassium: '6 4', phosphate: '2 3' };
    ws.paintPlot(function (svg, st) {
      var LX0 = Math.log(0.05) / Math.LN10, LX1 = Math.log(50) / Math.LN10;
      var ax = WS.axes(svg, { w: 360, h: 210, x: [LX0, LX1], y: [0, 140], xticks: [], yticks: [0, 50, 100], xlabel: 'distance from the root surface (log scale)', ylabel: 'dissolved, % of start' });
      var B = ax.box, el = WS.svg, d = depthOf(st.y), age = ageAt(d, st), S2 = sims(st.tr);
      [[0.1, '0.1 mm'], [1, '1 mm'], [10, '1 cm']].forEach(function (tk) {
        var X = ax.x(Math.log(tk[0]) / Math.LN10);
        el('line', { x1: X, x2: X, y1: B.y0, y2: B.y0 + 4, 'class': 'ws-tick' }, svg.querySelector('.ws-ax'));
        var t = el('text', { x: X, y: B.y0 + 16, 'text-anchor': 'middle' }, svg.querySelector('.ws-ax')); t.textContent = tk[1];
      });
      var sel = S2[st.nut];
      if (age >= 0) {
        var wmm = lerpStep(sel.W, age);
        if (wmm > 0.02) {
          var xr = ax.x(Math.max(LX0, Math.log(wmm) / Math.LN10));
          el('rect', { x: B.x0, y: ax.y(100), width: Math.max(0, xr - B.x0), height: ax.y(0) - ax.y(100), 'class': 'nf-shell', opacity: 0.9 }, ax.g);
          el('line', { x1: xr, x2: xr, y1: ax.y(0), y2: ax.y(100), 'class': 'ws-cursor' }, ax.g);
        }
      }
      /* review distances (SECONDARY), drawn under the curves */
      [['phosphate', 'P'], ['nitrate', 'N']].forEach(function (rv) {
        var R = REVIEW[rv[0]], X = ax.x(Math.log(R.mm) / Math.LN10), on = rv[0] === st.nut;
        el('line', { x1: X, x2: X, y1: ax.y(0), y2: ax.y(62), 'class': 'nf-rev' + (on ? ' nf-revon' : '') }, ax.g);
        var t = el('text', { x: X - 3, y: ax.y(4), 'text-anchor': 'end', 'class': 'ws-lab nf-revt' + (on ? ' nf-b' : '') }, ax.g);
        t.textContent = rv[1] + ' ' + R.txt;
      });
      ORDER.forEach(function (n) {
        var sim = S2[n], pts = [];
        if (age >= 0) profileInto(sim, age, plotBuf);
        for (var i = 0; i <= 90; i++) {
          var lx = LX0 + (LX1 - LX0) * i / 90, dist = Math.pow(10, lx), v = age >= 0 ? valAt(plotBuf, cellIndex(dist + R0MM)) : 1;
          pts.push([lx, Math.min(140, 100 * v)]);
        }
        if (n === st.nut) return;
        var p = ax.path(pts, 'nf-ghost'); if (DASH[n]) p.setAttribute('stroke-dasharray', DASH[n]);
      });
      (function () {
        var pts = [], i;
        if (age >= 0) profileInto(sel, age, plotBuf);
        for (i = 0; i <= 90; i++) { var lx = LX0 + (LX1 - LX0) * i / 90, v = age >= 0 ? valAt(plotBuf, cellIndex(Math.pow(10, lx) + R0MM)) : 1; pts.push([lx, Math.min(140, 100 * v)]); }
        var p = ax.path(pts, 'ws-line nf-sel'); if (DASH[st.nut]) p.setAttribute('stroke-dasharray', DASH[st.nut]);
      })();
      /* legend, top right, above every curve */
      var gx = ax.x(LX0 + (LX1 - LX0) * 0.5), gy = ax.y(136);
      var lg = el('g', { 'class': 'nf-leg' }, ax.g);
      ORDER.forEach(function (n, i) {
        var yy = gy + i * 14.5, on = n === st.nut;
        var ln = el('line', { x1: gx, x2: gx + 20, y1: yy - 3.5, y2: yy - 3.5, 'class': on ? 'ws-line nf-sel' : 'nf-ghost' }, lg);
        if (DASH[n]) ln.setAttribute('stroke-dasharray', DASH[n]);
        var t = el('text', { x: gx + 25, y: yy, 'class': 'ws-lab' + (on ? ' nf-b' : '') }, lg);
        t.textContent = NUTS[n].name.toLowerCase() + (on ? ' (chosen)' : '');
      });
    });

    function statsHTML(st, o) {
      if (!o.has) return '<p class="nf-st">No root at the slice depth yet. Move the slice up, or wait for the root to grow down.</p>';
      return '<p class="nf-st"><span><b>Depletion shell</b> ' + (o.w > 0.02 ? mm(o.w) + ' wide' : 'none') + ' ' + DE('Where the dip has shrunk to a tenth of its depth at the root. The one tenth rule is a chosen definition.') + '</span>' +
        '<span><b>At the root surface</b> ' + pct(o.cs) + ' of start ' + DE() + '</span>' +
        '<span><b>Brought by the water (mass flow)</b> ' + pct(Math.min(9.99, o.mf)) + ' of uptake ' + DE('Water influx times the concentration at the root surface, divided by uptake.') + '</span>' +
        reviewSpan(st, o) +
        '<span><b>Uptake</b>, as a share of a root in fresh soil: ' + pct(o.up) + ' at the slice; ' + pct(o.upTip) + ' in the newest 2 mm behind the tip; ' + pct(o.upAvg) + ' averaged over the whole root ' + DE() + '</span></p>';
    }
    function reviewSpan(st, o) {
      var R = REVIEW[st.nut];
      if (!R) return '<span><b>Review figure</b> none for potassium in the review used here, so no marker</span>';
      return '<span><b>Review figure</b> ' + R.el + ' drawn down to ' + R.txt + ' ' + badge('SECONDARY', YORK) + '; this model now ' + (o.w > 0.02 ? mm(o.w) : 'no shell') + ' ' + IL('Model output from illustrative inputs; not a measurement.') + '</span>';
    }
    function sayHTML(st, o) {
      var P = NUTS[st.nut], nm = P.name.toLowerCase(), head = '<b>' + day(st.t).replace('day', 'Day') + '.</b> ';
      if (!o.has) return head + 'The slice is below the root tip, so this soil is untouched: the ' + nm + ' is at its starting level.';
      var mf = o.mf, s;
      if (st.nut === 'nitrate') {
        if (mf >= 0.97) s = 'The water flowing into the root brings ' + pct(Math.min(mf, 9.99)) + ' of the nitrate the root takes up. This is <b>mass flow</b>: nitrate rides with the water, so no empty ring forms' + (o.cs > 1.01 ? ', and nitrate even piles up a little at the root.' : '.');
        else s = 'The water brings ' + pct(mf) + ' of the nitrate the root takes up (<b>mass flow</b>); the rest arrives by <b>diffusion</b>, spreading from where there is more to where there is less. Nitrate moves easily, so the dip reaches ' + mm(o.w) + ' out but stays shallow: at the root it is still ' + pct(o.cs) + ' of the start.' + (st.tr < 60 ? ' Raise transpiration to let the water carry more.' : '');
      } else if (st.nut === 'phosphate') {
        s = 'Water brings only ' + pct(mf) + ' of the phosphate taken up: phosphate sticks to soil, so little is dissolved. A <b>depletion shell</b> ' + mm(o.w) + ' wide is nearly empty (' + pct(o.cs) + ' left at the root), so here the root gets ' + pct(o.up) + ' of what it would in fresh soil, in a soil full of phosphorus.';
        s += st.grow ? ' Its newest 2 mm, in fresh soil, get ' + pct(o.upTip) + ': growing is how it escapes.' : ' Turn on <b>Root grows</b> to let it escape.';
        s += ' A review puts real phosphorus zones at about 3 mm; this model was tuned to show that scale. Root hairs: see the panel below.';
      } else {
        s = 'The water brings ' + pct(mf) + ' of the potassium the root takes up; diffusion brings the rest. Potassium sticks to soil a little, so its shell (' + mm(o.w) + ') is narrower than nitrate’s and wider than phosphate’s; at the root it is ' + pct(o.cs) + ' of the start.';
      }
      return head + s;
    }

    ws.render();
    return ws;
  }

  function whyHTML() {
    var P = NUTS;
    function row(name, b, C0, Imax, Km) { return '<tr><th scope="row">' + name + '</th><td>' + b + '</td><td>' + C0 + '</td><td>' + Imax + '</td><td>' + Km + '</td></tr>'; }
    function sci(x) { var e = Math.floor(Math.log(x) / Math.LN10), m = x / Math.pow(10, e); return (Math.round(m * 100) / 100) + ' × 10<sup>−' + (-e) + '</sup>'; }
    return '<p>A root can only take up what is <b>dissolved in the soil water</b>. Two things bring a dissolved nutrient to the root surface. <b>Mass flow</b>: the water itself flows toward the root because the leaves are losing water, and it carries whatever is dissolved in it. <b>Diffusion</b>: dissolved ions spread from where there are more to where there are fewer, and the root keeps the soil next to it low.</p>' +
      '<p>Nitrate barely sticks to most soils, and a lot of it is dissolved, so the water alone can bring much of what the root needs. Phosphate sticks tightly to soil particles. Very little is dissolved at any moment, so the water brings almost none, and diffusion is very slow because each ion keeps getting caught. The root empties a thin shell around itself and then has to wait. That is why roots that keep growing, <b>root hairs</b>, and fungal partners matter so much for phosphorus: they reach soil the root has not yet emptied. Hyphae of the mycorrhizal fungus <i>Acaulospora laevis</i> spread up to 11 cm from clover roots after 47 days ' + badge('MEASURED', 'Jakobsen, Abbott and Robson 1992, New Phytol 120: 371 to 380.') + ' (Jakobsen et al. 1992, New Phytol 120: 371, <a href="https://doi.org/10.1111/j.1469-8137.1992.tb01077.x" target="_blank" rel="noopener">doi 10.1111/j.1469-8137.1992.tb01077.x</a>).</p>' +
      '<p>The idea that nutrients reach a root by mass flow and by diffusion was set out by Barber (1962, Soil Sci 93: 39, <a href="https://doi.org/10.1097/00010694-196201000-00007" target="_blank" rel="noopener">doi 10.1097/00010694-196201000-00007</a>). This page does not quote his numbers: the share of each route for each nutrient was not checked against a page, so every share shown here comes from the model.</p>' +
      '<p><b>No one depletion zone.</b> How far a root drains the soil depends on the nutrient. A review table gives about <b>2 cm for nitrogen</b> and about <b>3 mm for phosphorus</b> ' + badge('SECONDARY', YORK) + ' ' + YORK_LINK + '. Nitrogen, mostly as nitrate, is dissolved and moves with the water; phosphate is held by the soil and only creeps. These are typical sizes from a review, not one experiment: real zones change with the soil, its water and the root. The model here keeps that order. Its inputs are invented ' + IL() + ', and two of them, how strongly the soil holds potassium and phosphate (their buffer power b), were <b>tuned</b> so that the model shows the scale the review gives: after 6 days the phosphate shell is about 3 mm wide and the nitrate dip reaches close to 2 cm, with potassium in between. So the model shows the sourced scale; it does not predict it. The hairs it draws take up nothing; how root hairs change the picture is in the next panel.</p>' +
      '<details class="nf-deep"><summary>Expert depth: the model, its equations and every input</summary>' +
      '<p>A radial convection diffusion model around a cylindrical root, the kind treated by Tinker and Nye (2000, Solute Movement in the Rhizosphere, Oxford University Press, <a href="https://doi.org/10.1093/oso/9780195124927.001.0001" target="_blank" rel="noopener">doi 10.1093/oso/9780195124927.001.0001</a>), Barber (1995, Soil Nutrient Bioavailability, 2nd ed., Wiley) and Jungk and Claassen (1997, Ion diffusion in the soil root system, Advances in Agronomy, pages 53 to 110, <a href="https://doi.org/10.1016/S0065-2113(08)60662-8" target="_blank" rel="noopener">doi 10.1016/S0065-2113(08)60662-8</a>). No number below was checked against a page or table of these works.</p>' +
      '<p class="nf-eq">b ∂C/∂t = (1/r) ∂/∂r [ r D<sub>l</sub> θ f ∂C/∂r + r<sub>0</sub> v<sub>0</sub> C ] ' + DE('The conservation equation for a nutrient around a cylinder, with water flowing in.') + '</p>' +
      '<p class="nf-eq">at r = r<sub>0</sub>: D<sub>l</sub> θ f ∂C/∂r + v<sub>0</sub> C = I<sub>max</sub> C / (K<sub>m</sub> + C); far away: C = C<sub>0</sub> ' + DE('Uptake by Michaelis and Menten kinetics at the root surface.') + '</p>' +
      '<p>C is the concentration in the soil water, r the distance from the root axis, r<sub>0</sub> the root radius, v<sub>0</sub> the water influx at the root surface, D<sub>l</sub> the diffusion coefficient in free water, θ the water content, f the impedance factor of the winding pore path, and b the <b>buffer power</b>: how much more of the nutrient sits on the soil, ready to come off, than in the water. The effective diffusion coefficient is D<sub>e</sub> = D<sub>l</sub> θ f / b ' + DE() + ', so a large b slows diffusion as well as shrinking the dissolved pool. The share brought by mass flow is v<sub>0</sub> C(r<sub>0</sub>) / uptake ' + DE() + '. The shell edge is where the dip has shrunk to one tenth of its depth at the root, a definition chosen for this page ' + IL() + '.</p>' +
      '<table class="nf-tab"><caption>Inputs, all ' + IL('No page level source verified.') + '</caption><thead><tr><th scope="col">nutrient</th><th scope="col">b</th><th scope="col">C<sub>0</sub>, mM</th><th scope="col">I<sub>max</sub>, µmol cm<sup>−2</sup> s<sup>−1</sup></th><th scope="col">K<sub>m</sub>, mM</th></tr></thead><tbody>' +
      ORDER.map(function (n) { var p = P[n]; return row(p.name, String(p.b), String(p.C0), sci(p.Imax), String(p.Km)); }).join('') + '</tbody></table>' +
      '<p>The buffer powers b of potassium and phosphate are tuned to the review scale, as said above. Diffusion coefficients are not listed: how fast each nutrient spreads is shown here by the depletion distances instead.</p>' +
      '<p>Also ' + IL() + ': root radius 0.2 mm; θ = 0.3; f = 0.3; v<sub>0</sub> from 0 to ' + sci(VMAX) + ' cm s<sup>−1</sup> as transpiration goes from 0 to 100 %; root hairs drawn shorter than 1 mm, and in this model they take up nothing; root growth 3.5 mm per day; a 6 day run; a 20 mm wide, 24 mm deep block. Solved on 150 rings spaced evenly in log r out to 8 cm, in steps of 0.05 day, implicitly, so it is stable and fast. Each depth is treated as its own cylinder of the age of that piece of root; diffusion along the root is ignored, and so are neighbouring roots, which in a real soil soon share the same water.</p>' +
      '<p>What is robust: the order of the shells (nitrate wide and shallow, potassium in between, phosphate narrow and deep) and the fact that mass flow can meet nitrate demand but not phosphate demand. The exact widths and percentages depend on the inputs above and should not be quoted as measurements.</p>' +
      '</details>';
  }

  /* ============================================================ the plate panel */
  var host0 = null, phMod = null, chainHost = null, chainOn = false, alive = false, hairMod = null;
  function mountPanel(host, st) {
    alive = true; host0 = host;
    var intro = document.createElement('div');
    intro.className = 'nf-intro';
    intro.innerHTML = '<p class="nf-k">Nutrient path · Plate I, Field</p><h3 class="nf-h">The soil solution</h3>' +
      '<p>A root can only take up what is <b>dissolved in the soil water</b>, the <b>soil solution</b>. That is a small part of everything the soil holds. Two experiments below: how a dissolved nutrient reaches the root, and how soil pH decides how much is dissolved at all.</p>' +
      '<p class="nf-note" hidden></p>';
    host.appendChild(intro);
    dz = null;
    var dzHost = document.createElement('div'); dzHost.className = 'nf-dz'; host.appendChild(dzHost);
    var hairHost = document.createElement('div'); hairHost.className = 'nf-hh'; host.appendChild(hairHost);
    var phHost = document.createElement('div'); phHost.className = 'nf-phh'; host.appendChild(phHost);
    chainHost = document.createElement('div'); chainHost.id = 'n-chain-host'; host.appendChild(chainHost);

    if (window.WS && window.WS.create) { try { buildDZ(dzHost, st); } catch (e) { console.error('field depletion zone failed', e); dzHost.innerHTML = '<p class="wp-nut-wait">The depletion zone scene could not start.</p>'; } }
    else dzHost.innerHTML = '<p class="wp-nut-wait">The depletion zone scene needs the workstation kit, which did not load.</p>';
    note(st);

    /* root hair turnover panel (team roots helper, n_roots_hairs.js) */
    N.load('roots_hairs', function (err) {
      if (!alive) return;
      if (err || !window.NR_HAIRS) { hairHost.innerHTML = '<p class="wp-nut-wait">The root hair panel could not load.</p>'; return; }
      try { hairMod = window.NR_HAIRS.mount(hairHost); } catch (e) { console.error('root hair panel failed', e); }
    });
    N.load('field_ph', function (err) {
      if (!alive) return;
      if (err || !window.NF_PH) { phHost.innerHTML = '<p class="wp-nut-wait">The pH scene could not load.</p>'; return; }
      try { phMod = window.NF_PH.mount(phHost, st); } catch (e) { console.error('field pH failed', e); }
    });
    N.load('chain', function (err) {
      if (!alive || err) return;
      if (window.WP_NCHAIN && typeof window.WP_NCHAIN.mount === 'function') {
        try { window.WP_NCHAIN.mount(chainHost); chainOn = true; } catch (e) { console.error('chain module failed to mount', e); }
      }
    });
  }
  function note(st) {
    if (!host0) return;
    var n = host0.querySelector('.nf-note'); if (!n) return;
    if (NUTS[st.solute]) { n.hidden = true; n.textContent = ''; return; }
    n.hidden = false;
    n.textContent = 'You are following ' + N.soluteName(st.solute) + '. The depletion scene below works with nitrate, potassium or phosphate, so it keeps the nutrient chosen in it.';
  }
  N.register('field', {
    mount: function (host, st) { mountPanel(host, st || WP.state); },
    update: function (st) {
      note(st);
      if (dz && dz.ws) {
        if (st.solute !== dz.lastSolute) {
          dz.lastSolute = st.solute;
          if (NUTS[st.solute] && dz.ws.state.nut !== st.solute) dz.ws.set({ nut: st.solute });
        }
        dz.ws.kick();
      }
      if (phMod && phMod.update) phMod.update(st);
    },
    unmount: function () {
      alive = false;
      if (dz && dz.ws) dz.ws.destroy();
      dz = null;
      if (phMod && phMod.destroy) phMod.destroy();
      phMod = null;
      if (hairMod && hairMod.destroy) hairMod.destroy();
      hairMod = null;
      if (chainOn && window.WP_NCHAIN && typeof window.WP_NCHAIN.unmount === 'function') { try { window.WP_NCHAIN.unmount(chainHost); } catch (e) { console.error(e); } }
      chainOn = false; chainHost = null; host0 = null;
    }
  });

  /* styles for this plate */
  var css = '\
.nf-intro{font-family:var(--ui);max-width:62em;margin:4px 0 10px}\
.nf-intro p{margin:0 0 6px;font-size:15px}\
.nf-k{font-size:12px!important;letter-spacing:.06em;text-transform:uppercase;color:var(--ink2)}\
.nf-h{font-family:var(--disp);font-weight:400;font-size:26px;margin:2px 0 6px}\
.nf-note{border-left:3px solid var(--accent);padding:4px 10px;background:var(--wall)}\
.nf-stats{flex:1 1 100%!important}\
.nf-st{margin:2px 0 0;display:flex;flex-wrap:wrap;gap:4px 16px;font-size:13px}\
.nf-st span{white-space:normal}\
.ws .nf-ghost{stroke:var(--ink2);stroke-width:1.4;fill:none}\
.ws .nf-sel{stroke-width:3}\
.ws .nf-shell{fill:var(--accent);fill-opacity:.16}\
.ws .nf-b{font-weight:600}\
.ws .nf-rev{stroke:var(--warm);stroke-width:1.3;stroke-dasharray:1.5 3;opacity:.75}\
.ws .nf-revon{stroke-width:2.2;opacity:1}\
.ws text.nf-revt{font-size:10.5px;fill:var(--warm)!important}\
.nf-hh:empty{display:none}\
.nf-deep{margin:8px 0;border-left:3px solid var(--rule2);padding:2px 10px}\
.nf-deep summary{cursor:pointer;font-weight:600;min-height:44px;display:flex;align-items:center}\
.nf-eq{font-family:var(--mono);font-size:13px;overflow-x:auto}\
.nf-tab{border-collapse:collapse;font-size:13px;margin:6px 0;display:block;overflow-x:auto;max-width:100%}\
.nf-tab caption{text-align:left;font-weight:600;padding:2px 0}\
.nf-tab th,.nf-tab td{border:1px solid var(--rule2);padding:3px 7px;text-align:left;white-space:nowrap}\
#n-chain-host:empty{display:none}';
  var sty = document.createElement('style'); sty.id = 'nf-css'; sty.textContent = css; document.head.appendChild(sty);
})();

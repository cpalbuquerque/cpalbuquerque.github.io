/* The Water Path v8: n_checkpoint_model.js (nutrient path, Plate III, the root checkpoint: the model).
   No Three.js here. Loaded by n_organ.js through WP.nutrient.load('checkpoint_model').

   window.WPCheckpoint = {
     R, H, theta: {A, B, S, W}, RINGS, cells, ringIndex(id), rowAt(ringIndex, y),
     build(route, mode, lat0, opt) -> track   one route through the tissue, in (r, lat) coordinates
                                           mode 'face': lat is the height y on the cut face A (3D)
                                           mode 'scan': lat is the angle at the cut height opt.y (2D scan)
     profile(route, opt) -> [[x, share]]   the step profile for the plot (x: 0 soil edge, 1 centre)
     flow(n) -> particle system on a track (shared by the 3D and the scan)
     paintScan(ctx, w, h, st, flows, colors)  the synthetic light microscope section
     paintFace(ctx, w, h, st, flows, colors)  the flat drawing used when WebGL is missing
   }
   Every share in this file is ILLUSTRATIVE: it shows a direction (passes, held back, stopped), not data. */
(function () {
  'use strict';
  if (window.WPCheckpoint) return;
  var PI = Math.PI, TAU = 2 * PI;

  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function clamp(x, a, b) { return x < a ? a : (x > b ? b : x); }

  /* ------------------------------------------------------------ geometry (model units) */
  var R = 1.3, H = 1.6, SOIL = R + 0.42;
  var W = PI / 2, AC = 0.87;              // the removed wedge faces the default camera
  var T0 = AC - W / 2, TA = T0 + W, TB = T0 + TAU;   // face A (route face) and face B (label face)
  var TS = TA + 2.2;                       // angle of the route traced on the scan
  var GAP = 0.011;                         // half the wall thickness, drawn as a gap between cells
  var Y_SUB = 0.55;                        // above this the endodermis may carry suberin (when shown)
  var Y_HAIR = -0.15;                      // root hairs below this height
  var RINGS = [
    { id: 'epi', t: 'epi', name: 'epidermis', r0: 1.17, r1: 1.30, tan: 0.11, len: 0.30 },
    { id: 'c1', t: 'cor', name: 'cortex', r0: 1.00, r1: 1.17, tan: 0.17, len: 0.42 },
    { id: 'c2', t: 'cor', name: 'cortex', r0: 0.855, r1: 1.00, tan: 0.16, len: 0.40 },
    { id: 'c3', t: 'cor', name: 'cortex', r0: 0.725, r1: 0.855, tan: 0.145, len: 0.38 },
    { id: 'c4', t: 'cor', name: 'cortex', r0: 0.62, r1: 0.725, tan: 0.125, len: 0.36 },
    { id: 'endo', t: 'endo', name: 'endodermis', r0: 0.535, r1: 0.62, tan: 0.12, len: 0.34 },
    { id: 'peri', t: 'peri', name: 'pericycle', r0: 0.455, r1: 0.535, tan: 0.085, len: 0.30 },
    { id: 'sa', t: 'ste', name: 'stele', r0: 0.30, r1: 0.455, tan: 0.085, len: 0.32 },
    { id: 'sb', t: 'ste', name: 'stele', r0: 0.14, r1: 0.30, tan: 0.11, len: 0.6 },
    { id: 'core', t: 'xyl', name: 'xylem', r0: 0.0, r1: 0.14, tan: 9, len: 0.9 }
  ];
  var IE = 5;                                         // index of the endodermis ring
  var R_MID = (RINGS[IE].r0 + RINGS[IE].r1) / 2, STRIP_W = 0.02;
  var ARMS = [0, 1, 2, 3].map(function (k) { return TA + k * PI / 2; });
  var PHL = [0, 1, 2, 3].map(function (k) { return TA + PI / 4 + k * PI / 2; });
  function adist(a, b) { var d = ((a - b) % TAU + TAU) % TAU; return d > PI ? TAU - d : d; }
  function near(a, list) { var m = 9; list.forEach(function (b) { m = Math.min(m, adist(a, b)); }); return m; }

  /* cells: every ring is cut into rows along the root (staggered), every row into cells round the circle.
     The circle is split into the removed wedge [T0, TA] and the kept arc [TA, TB]; both arc ends are cell
     boundaries, so the two cut faces are flat walls. Cell boundaries jitter from row to row. */
  var cells = [], rows = [];
  (function () {
    var rnd = rng(20261026);
    RINGS.forEach(function (rg, i) {
      var list = [], y = -H - rnd() * rg.len * 0.9, rc = (rg.r0 + rg.r1) / 2;
      while (y < H) {
        var y1 = y + rg.len * (0.82 + 0.36 * rnd());
        var row = { y0: Math.max(-H, y), y1: Math.min(H, y1), b: [], cells: [] };
        if (row.y1 - row.y0 > 0.06) {
          [[T0, TA, false], [TA, TB, true]].forEach(function (arc) {
            var span = arc[1] - arc[0], n = rg.id === 'core' ? 1 : Math.max(1, Math.round(span * rc / rg.tan)), st = span / n, bs = [arc[0]];
            for (var k = 1; k < n; k++) bs.push(arc[0] + k * st + (rnd() - 0.5) * 0.56 * st);
            bs.push(arc[1]);
            for (k = 0; k < n; k++) {
              var a0 = bs[k], a1 = bs[k + 1], am = (a0 + a1) / 2, kind = rg.t, w = (a1 - a0);
              if (rg.id === 'sa') kind = near(am, ARMS) < w * 0.55 ? 'xyl' : (near(am, PHL) < w * 1.6 ? 'phl' : 'par');
              else if (rg.id === 'sb') kind = near(am, ARMS) < w * 0.6 ? 'xyl' : 'par';
              var c = { ring: i, kind: kind, r0: rg.r0, r1: rg.r1, a0: a0, a1: a1, y0: row.y0, y1: row.y1, kept: arc[2], v: 0.9 + 0.2 * rnd(), e: rnd() };
              if (rg.id === 'epi' && (row.y0 + row.y1) / 2 < Y_HAIR && rnd() < 0.34) c.hair = { len: 0.32 + 0.5 * rnd(), bend: (rnd() - 0.5) * 0.5, droop: 0.1 + 0.25 * rnd() };
              cells.push(c); row.cells.push(c);
              if (k > 0) row.b.push(a0);
            }
          });
          list.push(row);
        }
        y = y1;
      }
      rows.push(list);
    });
  })();
  function rowAt(i, y) { var L = rows[i]; for (var j = 0; j < L.length; j++) if (y >= L[j].y0 && y < L[j].y1) return L[j]; return L[y < 0 ? 0 : L.length - 1]; }
  function ringIndex(id) { for (var i = 0; i < RINGS.length; i++) if (RINGS[i].id === id) return i; return -1; }

  /* ------------------------------------------------------------ cargo at a membrane (ILLUSTRATIVE shares) */
  var CARGO = {
    water: { entry: 0.95, later: 0.985, pause: 0.12, gate: 'aquaporin' },
    nitrate: { entry: 0.72, later: 0.93, pause: 0.85, gate: 'carrier' },
    cadmium: { entry: 0.12, later: 0.45, pause: 0.5, gate: 'held back' },
    dye: { entry: 0, later: 0, pause: 0.3, gate: 'no way in' }
  };
  var SUBERIN_F = 0.12;

  /* ------------------------------------------------------------ routes
     Lateral cells of ring i around lat: face mode, the cells on face A (rows, lat = y);
     scan mode, the cells of the row at height y round the circle (lat = angle). */
  function lateral(i, mode, y) {
    if (mode === 'face') {
      return rows[i].map(function (rw) { var c = rw.cells.filter(function (q) { return q.kept; })[0]; return { lo: rw.y0, hi: rw.y1, c: c }; });
    }
    return rowAt(i, y).cells.map(function (c) { return { lo: c.a0, hi: c.a1, c: c }; });
  }
  function cellAt(L, lat) { for (var k = 0; k < L.length; k++) if (lat >= L[k].lo && lat < L[k].hi) return L[k]; return L[lat < L[0].lo ? 0 : L.length - 1]; }
  function nearestWall(L, lat, mode) {
    var best = null, bd = 9;
    for (var k = 1; k < L.length; k++) { var w = L[k].lo; if (mode === 'face' && Math.abs(w) > H - 0.05) continue; var d = Math.abs(w - lat); if (d < bd) { bd = d; best = w; } }
    return best == null ? lat : best;
  }
  /* track: pts [[r, lat]], gates [{k: point index, kind, p, pause, r, label}] */
  function build(route, mode, lat0, opt) {
    opt = opt || {};
    var cg = CARGO[opt.cargo] || CARGO.water, ys = mode === 'face' ? null : opt.y;
    var pts = [], gates = [];
    var subZone = !!opt.suberin && (mode === 'face' ? lat0 : opt.y) > Y_SUB;
    var latScale = mode === 'face' ? 1 : 1 / R_MID;       // a lateral wobble the same size on screen in both modes
    function P(r, lat) { pts.push([r, lat]); return pts.length - 1; }
    function G(kind, p, pause, label) { var k = pts.length - 1; gates.push({ k: k, kind: kind, p: p, pause: pause, r: pts[k][0], label: label || kind }); }
    P(SOIL, lat0); P(R + 0.004, lat0);
    var cur = lat0, i;
    /* symplast style chain from ring i0 (already inside a cell of ring i0 at lat), membrane on or off at each wall */
    function chain(i0, lat, membranes, firstEndo) {
      var L = lateral(i0, mode, ys), cell = cellAt(L, lat), cl = (cell.lo + cell.hi) / 2;
      P((RINGS[i0].r0 + RINGS[i0].r1) / 2, cl); cur = cl;
      for (var j = i0 + 1; j < RINGS.length; j++) {
        var Lj = lateral(j, mode, ys), nc = cellAt(Lj, cur), rb = RINGS[j].r1;
        var lo = Math.max(cell.lo, nc.lo), hi = Math.min(cell.hi, nc.hi), m = 0.025 * latScale;
        var lp = hi - lo > 2 * m ? clamp(cur, lo + m, hi - m) : (lo + hi) / 2;
        var dead = nc.c && nc.c.kind === 'xyl';
        if (dead) {
          P(rb + 0.012, lp); G('load', 1, 0.25, 'into the xylem');
        } else if (membranes) {
          P(rb + 0.014, lp); G('mem', cg.later, cg.pause * 0.6, cg.gate);
          var pin = cg.later;
          if (j === IE && subZone) pin *= SUBERIN_F;
          P(rb - 0.014, lp); G(j === IE && subZone ? 'suberin' : 'mem', pin, cg.pause * 0.6, j === IE && subZone ? 'suberin' : cg.gate);
        } else {
          P(rb, lp); G('pd', 1, 0.08, 'plasmodesma');
        }
        var ncl = (nc.lo + nc.hi) / 2;
        if (dead) { P(Math.max(0.04, (RINGS[j].r0 + RINGS[j].r1) / 2), ncl); cur = ncl; return; }
        P((RINGS[j].r0 + RINGS[j].r1) / 2, ncl); cur = ncl; cell = nc;
      }
    }
    if (route === 'apo') {
      for (i = 0; i < IE; i++) {
        var w = nearestWall(lateral(i, mode, ys), cur, mode);
        P(RINGS[i].r1, w); P(RINGS[i].r0, w); cur = w;
      }
      var Le = lateral(IE, mode, ys), we = nearestWall(Le, cur, mode);
      P(RINGS[IE].r1, we);
      if (opt.strip) {
        P(R_MID + STRIP_W + 0.004, we); G('strip', 1, 0, 'Casparian strip');
        /* blocked in the wall: the only way on is across the endodermal cell membrane, on the cortex side of the strip */
        var ec = cellAt(Le, we + 0.0001), side = ec.lo >= we - 1e-6 ? 1 : -1;
        P(R_MID + STRIP_W + 0.004, we + side * 0.03 * latScale);
        G(subZone ? 'suberin' : 'mem', cg.entry * (subZone ? SUBERIN_F : 1), cg.pause, subZone ? 'suberin' : cg.gate);
        chain(IE, we + side * 0.03 * latScale + side * 1e-4, false);
      } else {
        P(RINGS[IE].r0, we); cur = we;
        for (i = IE + 1; i < RINGS.length - 1; i++) {
          var wi = nearestWall(lateral(i, mode, ys), cur, mode);
          P(RINGS[i].r1, wi); P(RINGS[i].r0, wi); cur = wi;
        }
        P(0.05, cur);
      }
    } else {
      G('mem', cg.entry, cg.pause, cg.gate);
      chain(0, lat0, route === 'tm');
    }
    /* cumulative length, measured in screen like units (the scan lat is an angle: scale it by the radius) */
    var cum = [0];
    for (i = 1; i < pts.length; i++) {
      var a = pts[i - 1], b = pts[i], dl = mode === 'face' ? b[1] - a[1] : (b[1] - a[1]) * (a[0] + b[0]) / 2;
      cum.push(cum[i - 1] + Math.hypot(b[0] - a[0], dl));
    }
    gates.forEach(function (g) { g.s = cum[g.k]; });
    var share = 1, blockedAt = null;
    gates.forEach(function (g) { share *= g.p; if (share < 1e-4 && !blockedAt) blockedAt = g; });
    return { route: route, mode: mode, pts: pts, cum: cum, L: cum[cum.length - 1], gates: gates, share: share, blockedAt: blockedAt, subZone: subZone };
  }
  function at(tr, s) {
    var c = tr.cum, n = c.length;
    if (s <= 0) return tr.pts[0].slice();
    if (s >= tr.L) return tr.pts[n - 1].slice();
    var lo = 0, hi = n - 1;
    while (hi - lo > 1) { var m = (lo + hi) >> 1; if (c[m] <= s) lo = m; else hi = m; }
    var f = (s - c[lo]) / Math.max(1e-9, c[hi] - c[lo]), a = tr.pts[lo], b = tr.pts[hi];
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
  }

  /* plot: x = 0 at the root surface, 1 at the centre; soil is x < 0 */
  function xOf(r) { return r > R ? -(r - R) / (SOIL - R) * 0.16 : (R - r) / R; }
  function profile(route, opt) {
    var tr = build(route, 'face', opt.y, opt), v = 1, out = [[-0.16, 1]];
    tr.gates.forEach(function (g) {
      if (g.p >= 0.9999) return;
      var x = xOf(g.r);
      out.push([x, v]); v *= g.p; out.push([x, v]);
    });
    out.push([1, v]);
    return { pts: out, share: v, track: tr };
  }
  var BANDS = [
    { id: 'epi', name: 'epidermis', short: 'epid.', x0: xOf(RINGS[0].r1), x1: xOf(RINGS[0].r0) },
    { id: 'cor', name: 'cortex', short: 'cortex', x0: xOf(RINGS[1].r1), x1: xOf(RINGS[4].r0) },
    { id: 'endo', name: 'endodermis', short: 'endo.', x0: xOf(RINGS[5].r1), x1: xOf(RINGS[5].r0) },
    { id: 'peri', name: 'pericycle', short: 'peri.', x0: xOf(RINGS[6].r1), x1: xOf(RINGS[6].r0) },
    { id: 'ste', name: 'stele', short: 'stele', x0: xOf(RINGS[7].r1), x1: 1 }
  ];

  /* ------------------------------------------------------------ particles on a track */
  function flow(n, seed) {
    var rnd = rng(seed || 99), ps = [], tr = null, spawnT = 0, gap = 0;
    function spawn(p) { p.s = 0; p.st = 'move'; p.t = 0; p.g = 0; p.j = (rnd() - 0.5); p.d = tr ? tr.gates.map(function (g) { return rnd() < g.p; }) : []; p.live = true; }
    for (var i = 0; i < n; i++) ps.push({ live: false, s: 0, st: 'off', t: 0, g: 0, j: 0, d: [] });
    var api = {
      ps: ps,
      set: function (track, pre) {
        tr = track; ps.forEach(function (p) { p.live = false; p.st = 'off'; });
        gap = tr ? Math.max(0.12, (tr.L / 0.62 + 2.2) / n) : 1;
        spawnT = 0;
        for (var t = 0; t < (pre || 0); t += 0.05) api.step(0.05);
      },
      track: function () { return tr; },
      step: function (dt) {
        if (!tr) return;
        spawnT -= dt;
        if (spawnT <= 0) { for (var i = 0; i < ps.length; i++) if (!ps[i].live) { spawn(ps[i]); break; } spawnT = gap * (0.7 + 0.6 * rnd()); }
        ps.forEach(function (p) {
          if (!p.live) return;
          p.t += dt;
          if (p.st === 'move') {
            var ns = p.s + dt * 0.62, g = tr.gates[p.g];
            while (g && g.s <= ns) {
              if (!p.d[p.g]) { p.s = g.s; p.st = 'stuck'; p.t = 0; return; }
              if (g.pause > 0.02) { p.s = g.s; p.st = 'wait'; p.t = 0; p.w = g.pause * (0.7 + 0.6 * rnd()); p.g++; return; }
              p.g++; g = tr.gates[p.g];
            }
            p.s = ns;
            if (p.s >= tr.L) { p.s = tr.L; p.st = 'done'; p.t = 0; }
          } else if (p.st === 'wait') {
            if (p.t >= p.w) { p.st = 'move'; p.t = 0; }
          } else if (p.st === 'stuck') {
            if (p.t > 2.6) p.live = false;
          } else if (p.st === 'done') {
            if (p.t > 1.1) p.live = false;
          }
        });
      },
      each: function (fn) {
        if (!tr) return;
        ps.forEach(function (p) {
          if (!p.live) return;
          var q = at(tr, p.s), a = 1, rise = 0;
          if (p.st === 'stuck') a = p.t < 2 ? 1 : Math.max(0, 1 - (p.t - 2) / 0.6);
          if (p.st === 'done') { a = Math.max(0, 1 - p.t / 1.1); rise = p.t; }
          fn(q, p, a, rise);
        });
      }
    };
    return api;
  }

  /* ------------------------------------------------------------ the synthetic section (a light microscope look) */
  var LM = {
    field: '#f4f0e4', edge: '#ddd3bd', wall: '#6f6a8e', xwall: '#2f6377', strip: '#4a0d1c', sub: '#b58500',
    fill: { epi: '#eeeccf', cor: '#f7f3e7', endo: '#f1e1c2', peri: '#ecefd6', par: '#f2f3df', phl: '#dfead0', xyl: '#fdfcf8', ste: '#f2f3df' }
  };
  function cellPath(c, rr, ox, oy, s, rot, gapPx) {
    /* a rounded cell outline: a superellipse in (radius, angle), shrunk by the wall gap */
    var g = gapPx / s, rc = (c.r0 + c.r1) / 2, hr = Math.max(0.004, (c.r1 - c.r0) / 2 - g);
    var am = (c.a0 + c.a1) / 2, ha = Math.max(0.002, (c.a1 - c.a0) / 2 - g / Math.max(0.05, rc));
    if (c.r0 === 0) { hr = c.r1 / 2 - g; }
    var e = c.kind === 'cor' ? 0.62 : (c.kind === 'xyl' ? 0.8 : 0.4), n = 28;
    rr.beginPath();
    for (var k = 0; k <= n; k++) {
      var u = k / n * TAU, cu = Math.cos(u), su = Math.sin(u);
      var lx = Math.sign(cu) * Math.pow(Math.abs(cu), e), lz = Math.sign(su) * Math.pow(Math.abs(su), e);
      var r = rc + lx * hr, a = am + lz * ha + rot;
      var x = ox + Math.cos(a) * r * s, y = oy + Math.sin(a) * r * s;
      if (k) rr.lineTo(x, y); else rr.moveTo(x, y);
    }
    rr.closePath();
  }
  function textW(ctx, t) { return ctx.measureText(t).width; }
  function paintScan(ctx, w, h, st, flows, C) {
    var y = st.cut, rot = PI - TS;
    var lab = w < 330 ? 0 : Math.min(150, w * 0.36);
    var Rp = Math.max(40, Math.min((h - 22) / 2 - 4, (w - lab) / 2 - 10)), cx = 8 + Rp + Math.max(0, ((w - lab) - 16 - 2 * Rp) / 2), cy = 20 + (h - 20) / 2;
    var F = R + 0.34, s = Rp / F;
    ctx.save();
    /* the field of view */
    ctx.beginPath(); ctx.arc(cx, cy, Rp, 0, TAU);
    var gr = ctx.createRadialGradient(cx, cy, Rp * 0.2, cx, cy, Rp);
    gr.addColorStop(0, LM.field); gr.addColorStop(0.85, LM.field); gr.addColorStop(1, LM.edge);
    ctx.fillStyle = gr; ctx.fill();
    ctx.save(); ctx.clip();
    /* root hairs in this row */
    rowAt(0, y).cells.forEach(function (c) {
      if (!c.hair) return;
      var am = (c.a0 + c.a1) / 2 + rot, r0 = R - 0.01, r1 = R + c.hair.len;
      ctx.strokeStyle = LM.wall; ctx.lineWidth = Math.max(2.2, 0.03 * s); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(am) * r0 * s, cy + Math.sin(am) * r0 * s);
      ctx.quadraticCurveTo(cx + Math.cos(am + c.hair.bend * 0.15) * (r0 + r1) / 2 * s, cy + Math.sin(am + c.hair.bend * 0.15) * (r0 + r1) / 2 * s, cx + Math.cos(am + c.hair.bend * 0.3) * r1 * s, cy + Math.sin(am + c.hair.bend * 0.3) * r1 * s);
      ctx.stroke();
      ctx.strokeStyle = LM.fill.epi; ctx.lineWidth = Math.max(0.8, 0.014 * s); ctx.stroke();
    });
    /* the wall matrix, then the cells cut out of it */
    ctx.beginPath(); ctx.arc(cx, cy, R * s, 0, TAU); ctx.fillStyle = LM.wall; ctx.fill();
    var gapPx = Math.max(0.6, GAP * s * 0.9);
    for (var i = 0; i < RINGS.length; i++) {
      rowAt(i, y).cells.forEach(function (c) {
        cellPath(c, ctx, cx, cy, s, rot, c.kind === 'xyl' ? gapPx * 2.2 : gapPx);
        ctx.fillStyle = LM.fill[c.kind] || LM.fill.par; ctx.fill();
        if (c.kind === 'xyl') { ctx.strokeStyle = LM.xwall; ctx.lineWidth = Math.max(1.2, gapPx * 1.4); ctx.stroke(); }
        if (c.kind === 'endo' && st.suberin === 'on' && y > Y_SUB) {
          cellPath(c, ctx, cx, cy, s, rot, gapPx * 2.2);
          ctx.strokeStyle = LM.sub; ctx.lineWidth = Math.max(1.2, gapPx * 1.5); ctx.stroke();
        }
      });
    }
    /* Casparian strip: in a cross section, a dark dot in every radial wall of the endodermis */
    if (st.strip === 'on') {
      ctx.fillStyle = LM.strip;
      rowAt(IE, y).cells.forEach(function (c) {
        var a = c.a0 + rot;
        ctx.beginPath(); ctx.arc(cx + Math.cos(a) * R_MID * s, cy + Math.sin(a) * R_MID * s, Math.max(1.6, STRIP_W * s * 1.15), 0, TAU); ctx.fill();
      });
    }
    /* the route traced on the section */
    var routes = st.route === 'all' ? ['apo', 'sym', 'tm'] : [st.route];
    routes.forEach(function (ro, k) {
      var tr = build(ro, 'scan', TS + (st.route === 'all' ? (k - 1) * 0.42 : 0), { y: y, strip: st.strip === 'on', suberin: st.suberin === 'on', cargo: st.cargo });
      drawTrack(ctx, tr, cx, cy, s, rot, C, st.route === 'all' ? 2 : 3);
    });
    if (flows) flows.forEach(function (f) { drawDots(ctx, f, cx, cy, s, rot, C); });
    ctx.restore();
    ctx.beginPath(); ctx.arc(cx, cy, Rp, 0, TAU); ctx.strokeStyle = C.ink2; ctx.lineWidth = 1; ctx.stroke();
    /* labels with leader lines, in a column on the right */
    if (lab) {
      var items = [['epidermis', 0, 'mid'], ['cortex', 2, 'mid'], ['endodermis', IE, 'mid']];
      if (st.strip === 'on') items.push(['strip (lignin)', IE, 'strip']);
      if (st.suberin === 'on' && y > Y_SUB) items.push(['suberin', IE, 'sub']);
      items.push(['pericycle', 6, 'mid'], ['phloem', 7, 'phl'], ['xylem', 9, 'mid']);
      if (y < Y_HAIR) items.splice(0, 0, ['root hair', 0, 'hair']);
      var tx = w - lab + 4, top = 16, step = Math.min(22, (h - top - 26) / Math.max(1, items.length - 1));
      ctx.font = '11.5px ' + C.ui; ctx.textBaseline = 'middle';
      items.forEach(function (it, k) {
        var ty = top + 6 + k * step, ang = -0.75 + 1.5 * k / Math.max(1, items.length - 1), r;
        var a = ang - rot, rgI = RINGS[it[1]];
        if (it[2] === 'mid') r = (rgI.r0 + rgI.r1) / 2;
        else if (it[2] === 'strip' || it[2] === 'sub') {
          var row = rowAt(IE, y), best = row.cells[0], bd = 9;
          row.cells.forEach(function (c) { var d = adist(c.a0, a); if (d < bd) { bd = d; best = c; } });
          a = it[2] === 'strip' ? best.a0 : (best.a0 + best.a1) / 2; r = it[2] === 'strip' ? R_MID : rgI.r1 - 0.02;
        } else if (it[2] === 'phl') {
          var pr = rowAt(7, y), pc = null, pd = 9;
          pr.cells.forEach(function (c) { if (c.kind !== 'phl') return; var d = adist((c.a0 + c.a1) / 2, a); if (d < pd) { pd = d; pc = c; } });
          if (pc) { a = (pc.a0 + pc.a1) / 2; r = (pc.r0 + pc.r1) / 2; } else r = 0.37;
        } else if (it[2] === 'hair') {
          var hc = null, hd = 9;
          rowAt(0, y).cells.forEach(function (c) { if (!c.hair) return; var d = adist((c.a0 + c.a1) / 2, a); if (d < hd) { hd = d; hc = c; } });
          if (hc) { a = (hc.a0 + hc.a1) / 2 + hc.hair.bend * 0.15; r = R + Math.min(hc.hair.len, F - R - 0.05) * 0.6; } else r = R + 0.1;
        }
        var ex = cx + Math.cos(a + rot) * r * s, ey = cy + Math.sin(a + rot) * r * s;
        ctx.strokeStyle = C.ink2; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(tx - 6, ty); ctx.stroke();
        ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(ex, ey, 1.8, 0, TAU); ctx.fill();
        var t = it[0]; while (textW(ctx, t) > lab - 8 && t.length > 4) t = t.slice(0, -2);
        ctx.fillText(t, tx, ty);
      });
    }
    ctx.textBaseline = 'alphabetic';
    ctx.font = '11px ' + C.ui; ctx.fillStyle = C.ink2;
    ctx.fillText('model rendering, not an image', 6, 12);
    ctx.restore();
    return { cx: cx, cy: cy, s: s, rot: rot, Rp: Rp };
  }
  function polar(cx, cy, s, rot, r, a) { return [cx + Math.cos(a + rot) * r * s, cy + Math.sin(a + rot) * r * s]; }
  function trackXY(tr, cx, cy, s, rot) { return tr.pts.map(function (p) { return polar(cx, cy, s, rot, p[0], p[1]); }); }
  function drawTrack(ctx, tr, cx, cy, s, rot, C, lw) {
    var xy = trackXY(tr, cx, cy, s, rot), col = C.route[tr.route], v = 1, k0 = 0;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    function seg(a, b, share) {
      if (b <= a) return;
      ctx.beginPath(); ctx.moveTo(xy[a][0], xy[a][1]);
      for (var k = a + 1; k <= b; k++) ctx.lineTo(xy[k][0], xy[k][1]);
      ctx.setLineDash(C.dash[tr.route]); ctx.lineWidth = lw + 2.5; ctx.strokeStyle = 'rgba(255,255,255,' + (0.75 * Math.max(0.3, share)) + ')'; ctx.stroke();
      ctx.lineWidth = Math.max(1, lw * Math.max(0.35, share)); ctx.strokeStyle = col; ctx.globalAlpha = 0.35 + 0.65 * share; ctx.stroke(); ctx.globalAlpha = 1;
      ctx.setLineDash([]);
    }
    var stop = null;
    tr.gates.forEach(function (g) {
      seg(k0, g.k, v);
      v *= g.p; k0 = g.k;
      if (v < 1e-4 && !stop) stop = g;
    });
    if (!stop) seg(k0, xy.length - 1, v);
    /* gate marks */
    tr.gates.forEach(function (g) {
      var p = xy[g.k];
      if (g.kind === 'pd') { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(p[0], p[1], 1.6, 0, TAU); ctx.fill(); return; }
      if (g.kind === 'strip' || g.kind === 'load') return;
      ctx.strokeStyle = C.mem; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(p[0], p[1], 3.2, 0, TAU); ctx.stroke();
    });
    if (stop) {
      var p = xy[stop.k], r = 5;
      ctx.strokeStyle = C.stop; ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.moveTo(p[0] - r, p[1] - r); ctx.lineTo(p[0] + r, p[1] + r); ctx.moveTo(p[0] + r, p[1] - r); ctx.lineTo(p[0] - r, p[1] + r); ctx.stroke();
    }
    if (!stop) { var e = xy[xy.length - 1]; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(e[0], e[1], 3.2, 0, TAU); ctx.fill(); }
  }
  function glyph(ctx, kind, x, y, r) {
    ctx.beginPath();
    if (kind === 'water') ctx.arc(x, y, r, 0, TAU);
    else if (kind === 'nitrate') { ctx.moveTo(x, y - r * 1.15); ctx.lineTo(x + r * 1.05, y + r * 0.75); ctx.lineTo(x - r * 1.05, y + r * 0.75); ctx.closePath(); }
    else if (kind === 'cadmium') ctx.rect(x - r * 0.85, y - r * 0.85, r * 1.7, r * 1.7);
    else { ctx.moveTo(x, y - r * 1.2); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r * 1.2); ctx.lineTo(x - r, y); ctx.closePath(); }
  }
  function drawDots(ctx, f, cx, cy, s, rot, C) {
    var tr = f.track(); if (!tr) return;
    f.each(function (q, p, a) {
      var xy = polar(cx, cy, s, rot, q[0], q[1] + p.j * 0.012 / Math.max(0.2, q[0]));
      ctx.globalAlpha = a;
      glyph(ctx, C.cargoKind, xy[0], xy[1], 3.1);
      ctx.fillStyle = p.st === 'stuck' ? C.stuck : C.cargo; ctx.fill();
      ctx.lineWidth = 1; ctx.strokeStyle = '#ffffff'; ctx.stroke();
      ctx.globalAlpha = 1;
    });
  }

  /* ------------------------------------------------------------ the flat fallback: the cut face seen square on */
  function paintFace(ctx, w, h, st, flows, C) {
    var padL = 10, padR = 10, top = 46, bot = h - (w < 520 ? 60 : 48);
    var x0 = padL, x1 = w - padR, sx = (x1 - x0) / SOIL, sy = (bot - top) / (2 * H);
    function X(r) { return x0 + (SOIL - r) * sx; }
    function Y(y) { return bot - (y + H) * sy; }
    ctx.fillStyle = C.soil; ctx.fillRect(X(SOIL), top, X(R) - X(SOIL), bot - top);
    ctx.fillStyle = '#6f5c3e'; ctx.fillRect(X(R), top, X(0) - X(R), bot - top);
    var fill = { epi: '#b9c48a', cor: '#e8dfc0', endo: '#d7a25a', peri: '#c6cf9c', par: '#dfe5bf', phl: '#93bf8a', xyl: '#7fa6c4', ste: '#dfe5bf' };
    for (var i = 0; i < RINGS.length; i++) rows[i].forEach(function (rw) {
      var c = rw.cells.filter(function (q) { return q.kept; })[0];
      var g = 1.4, xa = X(c.r1) + g, xb = X(c.r0) - g, ya = Y(rw.y1) + g, yb = Y(rw.y0) - g;
      ctx.fillStyle = fill[c.kind] || fill.par;
      if (c.kind === 'endo' && st.suberin === 'on' && (rw.y0 + rw.y1) / 2 > Y_SUB) ctx.fillStyle = '#e2b31f';
      ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(xa, ya, Math.max(1, xb - xa), Math.max(1, yb - ya), 3); else ctx.rect(xa, ya, xb - xa, yb - ya); ctx.fill();
      if (c.hair && c.kept) { ctx.strokeStyle = '#9aa66a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(X(R), (ya + yb) / 2); ctx.lineTo(X(R + Math.min(SOIL - R - 0.02, c.hair.len * 0.8)), (ya + yb) / 2 + c.hair.droop * sy); ctx.stroke(); }
    });
    if (st.strip === 'on') { ctx.fillStyle = '#7a1f2b'; ctx.fillRect(X(R_MID + STRIP_W), top, (2 * STRIP_W) * sx, bot - top); }
    /* the cut */
    ctx.strokeStyle = C.accent || '#2b5fa4'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
    ctx.beginPath(); ctx.moveTo(X(SOIL), Y(st.cut)); ctx.lineTo(X(0), Y(st.cut)); ctx.stroke(); ctx.setLineDash([]);
    var routes = st.route === 'all' ? ['apo', 'sym', 'tm'] : [st.route];
    routes.forEach(function (ro, k) {
      var yb0 = clamp(st.cut + (st.route === 'all' ? (k - 1) * 0.34 : 0), -H + 0.12, H - 0.12);
      var tr = build(ro, 'face', yb0, { strip: st.strip === 'on', suberin: st.suberin === 'on', cargo: st.cargo }), v = 1, stop = null;
      ctx.lineWidth = 3; ctx.strokeStyle = C.route[ro]; ctx.setLineDash(C.dash[ro]); ctx.lineJoin = 'round';
      ctx.beginPath();
      tr.pts.forEach(function (p, j) { if (stop) return; var xx = X(p[0]), yy = Y(p[1]); if (j) ctx.lineTo(xx, yy); else ctx.moveTo(xx, yy);
        tr.gates.forEach(function (g) { if (g.k === j) { v *= g.p; if (v < 1e-4 && !stop) stop = g; } }); });
      ctx.stroke(); ctx.setLineDash([]);
      if (stop) { var p = tr.pts[stop.k], xx = X(p[0]), yy = Y(p[1]); ctx.strokeStyle = C.stop; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(xx - 6, yy - 6); ctx.lineTo(xx + 6, yy + 6); ctx.moveTo(xx + 6, yy - 6); ctx.lineTo(xx - 6, yy + 6); ctx.stroke(); }
    });
    if (flows) flows.forEach(function (f) {
      f.each(function (q, p, a, rise) {
        ctx.globalAlpha = a; glyph(ctx, C.cargoKind, X(q[0]), Y(q[1] + p.j * 0.016 + rise * 0.42), 4);
        ctx.fillStyle = p.st === 'stuck' ? C.stuck : C.cargo; ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = '#ffffff'; ctx.stroke(); ctx.globalAlpha = 1;
      });
    });
    /* layer names in two rows above the face */
    ctx.font = '11.5px ' + C.ui; ctx.fillStyle = C.ink; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'center';
    var L = [['soil', (SOIL + R) / 2, 0], ['epidermis', (R + RINGS[0].r0) / 2, 1], ['cortex', (RINGS[1].r1 + RINGS[4].r0) / 2, 0],
      [st.strip === 'on' ? 'endodermis, strip' : 'endodermis', R_MID, 1], ['stele, xylem', RINGS[7].r1 / 2, 0]];
    L.forEach(function (l) {
      var xx = X(l[1]), yy = l[2] ? 36 : 18, tw = ctx.measureText(l[0]).width;
      xx = clamp(xx, x0 + tw / 2, x1 - tw / 2);
      ctx.fillText(l[0], xx, yy);
      ctx.strokeStyle = C.ink2; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(X(l[1]), yy + 3); ctx.lineTo(X(l[1]), top - 1); ctx.stroke();
    });
    ctx.textAlign = 'left';
  }

  window.WPCheckpoint = {
    R: R, H: H, SOIL: SOIL, GAP: GAP, R_MID: R_MID, STRIP_W: STRIP_W, Y_SUB: Y_SUB, Y_HAIR: Y_HAIR, IE: IE,
    theta: { A: TA, B: TB, S: TS, W: W, T0: T0 }, RINGS: RINGS, cells: cells, rows: rows, ARMS: ARMS, PHL: PHL,
    rowAt: rowAt, ringIndex: ringIndex, CARGO: CARGO, BANDS: BANDS, xOf: xOf,
    build: build, at: at, profile: profile, flow: flow, glyph: glyph,
    paintScan: paintScan, drawDots: drawDots, paintFace: paintFace, rng: rng
  };
})();

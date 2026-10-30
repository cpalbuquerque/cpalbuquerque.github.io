/* Light to Sugar: Plate V, Water for carbon (L2 owner, round 1, 11 Oct 2026).
   5.1 One stoma, two lanes: a leaf section (cuticle on top, stomata on the lower, abaxial surface) where CO2 diffuses in
       and water vapour diffuses out through the same pore. CO2 beads move at A, water beads at E (1 water bead = 100 water
       molecules per CO2 bead, stated), guard cell opening follows gs, and the number of CO2 and vapour molecules floating
       inside and outside follows Ci, Ca and the vapour pressures, so the two gradients are visible.
   5.2 What opening the stomata buys and costs: A and E against gs, with the current leaf.
   5.3 Same leaf, five California afternoons: water per CO2 at one stomatal opening.
   5.4 Back to The Water Path. Cases, Expert, questions, Test yourself.
   Model: engine.js (FvCB + stomata 'ratio' or 'fixed'); E = gs × VPD / Patm, leaf at air temperature, no boundary layer. */
(function () {
  'use strict';
  var LP = window.LP = window.LP || {};
  LP.panels = LP.panels || [];
  LP.evidence = LP.evidence || {};
  LP.howto = LP.howto || {};
  LP.sources = LP.sources || {};
  var TAU = Math.PI * 2;
  function clamp(x, a, b) { return x < a ? a : (x > b ? b : x); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function rnd() { return Math.random(); }
  var ui = null;
  function U() { return (ui = LP.ui); }
  function num(x, d) { return U().num(x, d); }
  function R() { return LP.result || {}; }
  function M() { return LP.mol; }
  function esat(T) { return 0.6108 * Math.exp(17.27 * T / (T + 237.3)); }   /* kPa, Tetens */

  /* ================================================================== evidence */
  var EV = LP.evidence;
  EV['tr.scale'] = { claim: 'In the stoma theatre a dark CO2 bead stands for 1/0.6 = 1.7 µmol of CO2 per m2 of leaf per second, and a water bead stands for 100 times as many molecules (167 µmol of water). So the ratio of water beads to CO2 beads on screen is the model ratio E/A divided by 100. The floating molecules are drawn in proportion to concentration: CO2 to Ci and Ca, vapour to the vapour pressure inside (saturated at leaf temperature) and outside.', cite: 'Drawing convention of this page; rates from the engine.', measured: 'none', value: '1 CO2 bead = 1.7 µmol m−2 s−1; 1 water bead = 100 × that', badge: 'DERIVED', note: 'Without the factor of 100 the screen would need a few hundred water beads for every CO2 bead.' };
  EV['tr.diff'] = { claim: 'Water vapour diffuses about 1.6 times faster than CO2 through the stomatal pore, so the conductance to CO2 is gs ÷ 1.6. With CO2 in at A = (gs / 1.6)(Ca − Ci) and water out at E = gs × VPD / P, the water cost of carbon depends only on Ci/Ca, Ca and VPD: A / E = Ca (1 − Ci/Ca) P / (1.6 VPD).', cite: 'Ratio of the molecular diffusivities of H2O and CO2 in air, reviewed by Massman WJ (1998) Atmos Environ 32:1111 to 1127; the flux equations for A, E, gs and Ci are those of von Caemmerer S, Farquhar GD (1981) Planta 153:376 to 387.', doi: '10.1016/S1352-2310(97)00391-9', doi2: '10.1007/BF00384257', measured: 'physics', value: '1.6', badge: 'DERIVED', note: 'Leaf temperature is set equal to air temperature and the boundary layer is ignored, as on the Field plate of The Water Path. The same 1.6 appears in the CO2 path workstation below (5.4).' };
  EV['tr.vpd'] = { claim: 'Afternoon presets: Salinas morning fog 15 °C and 0.15 kPa; a Salinas July afternoon 21 °C and 1.0 kPa; an inland Southern California valley afternoon (Riverside area) 34 °C and 3.6 kPa; a Santa Ana wind day 33 °C and 4.5 kPa; a Fresno July afternoon 37 °C and 4.5 kPa.', cite: 'Teaching values chosen to be physically consistent (each VPD is below the saturation vapour pressure at that temperature).', measured: 'none', value: '', badge: 'ILLUSTRATIVE', note: 'For real numbers use CIMIS station records or NOAA normals for the site and hour; the Field plate of The Water Path uses NOAA July normals for Salinas.' };
  EV['tr.speedy'] = { claim: 'Stomata respond to changes in light and VPD over minutes, much more slowly than photosynthesis. In fluctuating light that lag costs carbon when they open late and water when they close late, so the speed of stomata is a target for improving water use efficiency.', cite: 'Lawson T, Vialet-Chabrand S (2018) New Phytol 221:93 to 98.', doi: '10.1111/nph.15330', measured: 'review', value: 'qualitative', badge: 'VERIFIED', note: 'This plate shows steady states only; the lag is a reason real leaves sit off the curves.' };
  EV['tr.day'] = { claim: 'Water lost per m2 of leaf over a 10 hour day at the current rate = E × 18 g mol−1 × 36,000 s.', cite: 'Arithmetic (molar mass of water 18.02 g mol−1).', measured: 'calculation', value: '', badge: 'DERIVED', note: 'A real day has changing light, VPD and stomata; this is the current rate held for 10 hours.' };
  EV['tr.sperry'] = { claim: 'A family of stomatal models predicts the opening that maximises photosynthetic gain minus a hydraulic cost: the loss of xylem conductance (embolism risk) as transpiration pulls water potential down.', cite: 'Sperry JS et al. (2017) Plant Cell Environ 40, doi 10.1111/pce.12852 (retrieved by the PhD panel via Scite on 12 Oct 2026; abstract level).', doi: '10.1111/pce.12852', measured: 'model', value: 'qualitative', badge: 'VERIFIED', note: 'The older idea of a constant marginal water cost (Cowan and Farquhar 1977; Medlyn et al. 2011) was not retrieved this run, so it is named without a DOI.' };
  EV['tr.split'] = { claim: 'Of the water a leaf handles each second, the share split at PSII = water split ÷ (water transpired + water split). Water split = linear electron flow ÷ 2 (2 H2O give 4 e−), transpired = E. Both from this page’s engine at the current conditions.', cite: 'Calculation from the model; the Water Path map strip uses the same idea ("about 1 in 60 to 1 in 100").', measured: 'calculation', value: '', badge: 'DERIVED', note: 'Photorespiration raises the electrons per net CO2, so the share depends on temperature and CO2 as well as on VPD.' };
  LP.sources['10.1111/pce.12852'] = 'Sperry JS et al. (2017) Plant Cell Environ 40';
  LP.sources['10.1111/nph.15330'] = LP.sources['10.1111/nph.15330'] || 'Lawson T, Vialet-Chabrand S (2018) New Phytol 221:93 to 98';
  LP.howto['tr.gx'] = {
    title: 'A, gs, E and Ci with a gas exchange system', what: 'the water cost of carbon on a real leaf',
    steps: [
      'Clamp the leaf in a chamber with controlled light, CO₂, leaf temperature and humidity (for example an LI-6800). Record the VPD at the leaf, not just the room RH.',
      'Wait for steady state (stomata can take 10 to 30 min after a change). Log A, g<sub>sw</sub>, E and C<sub>i</sub>.',
      'Instantaneous WUE = A / E; intrinsic WUE = A / g<sub>sw</sub>, which removes the direct effect of VPD and lets you compare leaves measured on different days.',
      'Step VPD up (drier air) at constant light and CO₂: E jumps at once, then g<sub>s</sub> falls over minutes. Plot both against time to see the lag.',
      'For a season long integral, use carbon isotope discrimination in leaf dry matter, which records the average C<sub>i</sub>/C<sub>a</sub> while the leaf was built.'
    ],
    watch: 'Leaks and chamber humidity control limit accuracy at very low g<sub>s</sub>; cuticular water loss inflates g<sub>s</sub> when stomata are nearly shut (see the cuticle on the Membrane plate of The Water Path).',
    dois: ['10.1111/nph.15330']
  };

  /* ================================================================== the stoma theatre */
  var TS = { co2: [], h2o: [], sug: [], fx: [], amb: [], acc: {}, lay: null, fixed: 0 };
  var KC = 0.6, KW = 0.6 / 100;
  function layout(w, h) {
    var mob = w < 560, L = { w: w, h: h, mob: mob };
    L.cut = h * 0.10; L.ue = h * 0.15; L.pal = h * 0.43; L.le = h * 0.72; L.leB = h * 0.78;
    L.sx = w * (mob ? 0.42 : 0.40);           /* stoma position (lower epidermis) */
    L.vx = w * (mob ? 0.78 : 0.74); L.vy = (L.pal + L.le) / 2; L.vr = Math.min(h * 0.075, w * 0.07);
    /* palisade columns and spongy cells, deterministic */
    L.palc = []; var cw = mob ? 30 : 38, n = Math.floor(w / cw);
    for (var i = 0; i < n; i++) L.palc.push({ x: i * cw + 3, w: cw - 6 });
    L.spg = []; var seed = 7; function sr() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    var rr = mob ? 15 : 19;
    for (var y = L.pal + rr + 4; y < L.le - rr * 0.6; y += rr * 1.75) {
      for (var x = rr + (Math.round(y) % 2 ? rr : 0); x < w - rr; x += rr * 2.5) {
        var cx = x + (sr() - 0.5) * rr * 0.6, cy = y + (sr() - 0.5) * rr * 0.4;
        if (Math.hypot(cx - L.vx, cy - L.vy) < L.vr + rr) continue;
        if (Math.abs(cx - L.sx) < rr * 2.2 && cy > L.le - rr * 2.6) continue;   /* substomatal cavity */
        L.spg.push({ x: cx, y: cy, r: rr * (0.8 + sr() * 0.35) });
      }
    }
    return L;
  }
  function chloroTarget(L) {
    if (rnd() < 0.62) { var c = L.palc[Math.floor(rnd() * L.palc.length)]; return { x: c.x + c.w * (0.2 + 0.6 * rnd()), y: lerp(L.ue + 6, L.pal - 6, rnd()) }; }
    var s = L.spg[Math.floor(rnd() * L.spg.length)] || { x: L.sx, y: L.pal + 20, r: 10 }; var a = rnd() * TAU;
    return { x: s.x + Math.cos(a) * s.r * 0.6, y: s.y + Math.sin(a) * s.r * 0.6 };
  }
  function step(dt) {
    var L = TS.lay; if (!L) return;
    var r = R(), A = r.A || 0, E = r.E || 0;
    var pore = { x: L.sx, y: (L.le + L.leB) / 2 };
    /* molecules cross anywhere inside the open slit (same gap as the guard cells), so a wider pore looks wider, not busier */
    var gap = 2 + clamp((r.gs || 0) / 0.5, 0, 1) * (L.mob ? 9 : 12);
    function px() { return pore.x + (rnd() - 0.5) * 2 * Math.max(1.5, gap * 0.8); }
    /* CO2 in (net uptake) or out (respiration in the dark) */
    TS.acc.c = (TS.acc.c || 0) + Math.abs(A) * KC * dt;
    var n = 0;
    while (TS.acc.c >= 1 && n < 5) {
      TS.acc.c -= 1; n++;
      var tg = chloroTarget(L);
      if (A > 0) TS.co2.push({ pts: [[L.sx + (rnd() - 0.5) * L.w * 0.25, L.h + 8], [px(), pore.y], [pore.x + (rnd() - 0.5) * 40, L.le - 18], [tg.x, tg.y]], p: 0, dur: 2.2 + rnd() * 0.6, ang: rnd() * TAU, inn: true });
      else TS.co2.push({ pts: [[tg.x, tg.y], [pore.x + (rnd() - 0.5) * 30, L.le - 18], [pore.x, pore.y], [L.sx + (rnd() - 0.5) * L.w * 0.25, L.h + 8]], p: 0, dur: 2.4, ang: rnd() * TAU, inn: false });
    }
    if (TS.acc.c > 3) TS.acc.c = 3;
    /* water out: from the vein to a wet cell wall, evaporates, out of the pore */
    TS.acc.w = (TS.acc.w || 0) + E * 1000 * KW * dt;
    n = 0;
    while (TS.acc.w >= 1 && n < 6) {
      TS.acc.w -= 1; n++;
      var s = L.spg[Math.floor(rnd() * L.spg.length)] || { x: L.sx, y: L.pal + 30, r: 10 };
      TS.h2o.push({ pts: [[L.vx + (rnd() - 0.5) * L.vr, L.vy + (rnd() - 0.5) * L.vr], [s.x + s.r * 0.9, s.y], [pore.x + (rnd() - 0.5) * 40, L.le - 14], [px(), pore.y], [L.sx + (rnd() - 0.5) * L.w * 0.45, L.h + 10]], p: 0, dur: 2.6 + rnd() * 0.6, ang: rnd() * TAU });
    }
    if (TS.acc.w > 3) TS.acc.w = 3;
    function adv(q) { q.p += dt / q.dur; q.ang += dt * 1.3; return q.p < 1; }
    TS.co2 = TS.co2.filter(function (q) {
      if (adv(q)) return true;
      if (q.inn) { TS.fx.push({ x: q.pts[3][0], y: q.pts[3][1], t: 0, dur: 0.6 }); TS.fixed++; if (TS.fixed >= 6) { TS.fixed -= 6; TS.sug.push({ x0: q.pts[3][0], y0: q.pts[3][1], p: 0, dur: 2.0 }); } }
      return false;
    });
    TS.h2o = TS.h2o.filter(adv);
    TS.sug = TS.sug.filter(function (q) { q.p += dt / q.dur; return q.p < 1; });
    TS.fx = TS.fx.filter(function (f) { f.t += dt; return f.t < f.dur; });
    /* ambient molecules: counts follow Ci, Ca and vapour pressures */
    var T = r.T == null ? 25 : r.T, es = esat(T), ea = Math.max(0, es - (r.vpd || 0));
    var want = { ci: Math.round(clamp((r.Ci || 0) / 40, 0, 30)), ca: Math.round(clamp((r.Ca || 420) / 40, 0, 30)), vi: 20, vo: Math.round(20 * ea / es) };
    ['ci', 'ca', 'vi', 'vo'].forEach(function (k) {
      var have = TS.amb.filter(function (a) { return a.k === k && !a.dying; });
      while (have.length < want[k]) { var a = spawnAmb(L, k); TS.amb.push(a); have.push(a); }
      for (var i = want[k]; i < have.length; i++) have[i].dying = true;
    });
    TS.amb = TS.amb.filter(function (a) {
      a.al = a.dying ? a.al - dt * 1.5 : Math.min(1, a.al + dt);
      a.vx += (rnd() - 0.5) * 24 * dt; a.vy += (rnd() - 0.5) * 24 * dt; a.vx *= 0.97; a.vy *= 0.97; a.x += a.vx * dt; a.y += a.vy * dt; a.ang += dt;
      var b = a.box; if (a.x < b[0] || a.x > b[2]) a.vx *= -1; if (a.y < b[1] || a.y > b[3]) a.vy *= -1;
      a.x = clamp(a.x, b[0], b[2]); a.y = clamp(a.y, b[1], b[3]);
      return a.al > 0;
    });
  }
  function spawnAmb(L, k) {
    var inside = k === 'ci' || k === 'vi';
    var box = inside ? [8, L.pal + 6, L.w - 8, L.le - 8] : [8, L.leB + 10, L.w - 8, L.h - 8];
    var x = lerp(box[0], box[2], rnd()), y = lerp(box[1], box[3], rnd());
    if (inside) { for (var t = 0; t < 12; t++) { var hit = L.spg.some(function (s) { return Math.hypot(s.x - x, s.y - y) < s.r + 3; }); if (!hit) break; x = lerp(box[0], box[2], rnd()); y = lerp(box[1], box[3], rnd()); } }
    return { k: k, x: x, y: y, vx: (rnd() - 0.5) * 12, vy: (rnd() - 0.5) * 12, al: 0, ang: rnd() * TAU, box: box };
  }
  function prewarm(sec) { for (var i = 0, n = Math.round(sec / 0.05); i < n; i++) step(0.05); }
  function along(pts, p) {
    var segs = pts.length - 1, f = clamp(p, 0, 0.9999) * segs, i = Math.floor(f), t = f - i;
    return { x: lerp(pts[i][0], pts[i + 1][0], t), y: lerp(pts[i][1], pts[i + 1][1], t) };
  }

  var cache = null, cacheKey = '';
  function staticLayer(L, P, dpr, tier) {
    var key = [L.w, L.h, P.dark, dpr, tier].join('|');
    if (cache && cacheKey === key) return cache;
    var cv = cache || document.createElement('canvas'); cv.width = Math.round(L.w * dpr); cv.height = Math.round(L.h * dpr);
    var c = cv.getContext('2d'), m = M(); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, L.w, L.h);
    /* air above and below */
    c.fillStyle = P.dark ? '#0d1520' : '#eef3f6'; c.fillRect(0, 0, L.w, L.h);
    /* inside: air spaces */
    c.fillStyle = P.dark ? '#13241a' : '#f3f6e8'; c.fillRect(0, L.ue, L.w, L.leB - L.ue);
    /* cuticle (wax) and upper epidermis */
    c.fillStyle = P.dark ? '#c9a54a' : '#d9b860'; c.globalAlpha = 0.85; c.fillRect(0, L.cut, L.w, 4); c.globalAlpha = 1;
    c.fillStyle = P.dark ? '#2a3a32' : '#e8eadc'; c.fillRect(0, L.cut + 4, L.w, L.ue - L.cut - 4);
    c.strokeStyle = P.dark ? 'rgba(200,220,200,.25)' : 'rgba(80,90,70,.3)'; c.lineWidth = 1;
    for (var x = 0; x < L.w; x += 34) { c.beginPath(); c.moveTo(x, L.cut + 4); c.lineTo(x, L.ue); c.stroke(); }
    /* palisade */
    var chl = P.dark ? '#4fae6a' : '#3d8f5a';
    L.palc.forEach(function (p) {
      var g = c.createLinearGradient(p.x, 0, p.x + p.w, 0); g.addColorStop(0, P.dark ? '#1f4a2e' : '#cfe6c4'); g.addColorStop(0.5, P.dark ? '#2f6a42' : '#e2f1d8'); g.addColorStop(1, P.dark ? '#1f4a2e' : '#cfe6c4');
      c.fillStyle = g; m.rrect(c, p.x, L.ue + 2, p.w, L.pal - L.ue - 4, p.w * 0.35); c.fill();
      for (var k = 0; k < 6; k++) m.ball(c, p.x + (k % 2 ? p.w * 0.78 : p.w * 0.22), lerp(L.ue + 10, L.pal - 10, k / 5), Math.max(2.6, p.w * 0.12), chl, m.shade(chl, 0.5), m.shade(chl, -0.4), 0.9);
    });
    /* spongy cells */
    L.spg.forEach(function (s) {
      m.ball(c, s.x, s.y, s.r, P.dark ? '#2a5a3a' : '#d6ebcc', P.dark ? '#4c8a5e' : '#f1faea', P.dark ? '#163020' : '#a9cc9a', 1);
      for (var k = 0; k < 4; k++) { var a = k * TAU / 4 + s.x; m.ball(c, s.x + Math.cos(a) * s.r * 0.62, s.y + Math.sin(a) * s.r * 0.62, Math.max(2.2, s.r * 0.17), chl, m.shade(chl, 0.5), m.shade(chl, -0.4), 0.9); }
    });
    /* vein: bundle sheath ring with xylem */
    m.ball(c, L.vx, L.vy, L.vr * 1.25, P.dark ? '#3a4a3a' : '#e3e0c8', P.dark ? '#5a6a5a' : '#fbf8ea', P.dark ? '#202a20' : '#bdb898', 1);
    for (var j = 0; j < 5; j++) { var aa = j * TAU / 5; m.ball(c, L.vx + Math.cos(aa) * L.vr * 0.45, L.vy + Math.sin(aa) * L.vr * 0.45, L.vr * 0.28, P.dark ? '#3d7fd0' : '#4a86d0', '#cfe3ff', P.dark ? '#1d3f6e' : '#2f5a94', 1); }
    /* lower epidermis with the stoma */
    c.fillStyle = P.dark ? '#2a3a32' : '#e8eadc'; c.fillRect(0, L.le, L.w, L.leB - L.le);
    c.fillStyle = P.dark ? '#c9a54a' : '#d9b860'; c.globalAlpha = 0.85; c.fillRect(0, L.leB, L.w, 3); c.globalAlpha = 1;
    for (x = 17; x < L.w; x += 34) { if (Math.abs(x - L.sx) < 34) continue; c.beginPath(); c.moveTo(x, L.le); c.lineTo(x, L.leB); c.stroke(); }
    cache = cv; cacheKey = key;
    return cv;
  }
  function guard(c, P, L, open) {
    var m = M(), cy = (L.le + L.leB) / 2, gw = L.mob ? 18 : 24, gh = (L.leB - L.le) * 0.9 + 6, gap = 2 + open * (L.mob ? 9 : 12);
    [-1, 1].forEach(function (sd) {
      var gx = L.sx + sd * (gap + gw / 2);
      var g = c.createRadialGradient(gx - sd * 3, cy - 3, 2, gx, cy, gw * 0.7);
      g.addColorStop(0, P.dark ? '#7fd08a' : '#bfe6b0'); g.addColorStop(1, P.dark ? '#2f7a46' : '#5e9e52');
      c.fillStyle = g; c.beginPath(); c.ellipse(gx, cy, gw / 2, gh / 2, 0, 0, TAU); c.fill();
      c.strokeStyle = P.dark ? 'rgba(220,255,220,.35)' : 'rgba(40,80,40,.35)'; c.lineWidth = 1; c.stroke();
      m.ball(c, gx + sd * 3, cy - 3, 2.6, P.dark ? '#a7f0a0' : '#3d8f5a', '#eaffe0', '#1d5a30', 0.9);
    });
    /* substomatal cavity hint */
    c.strokeStyle = P.dark ? 'rgba(236,230,218,.25)' : 'rgba(42,35,28,.2)'; c.setLineDash([3, 4]); c.beginPath(); c.arc(L.sx, L.le, (L.mob ? 26 : 34), Math.PI, TAU); c.stroke(); c.setLineDash([]);
  }

  /* slow and named round (13 Oct 2026, light stroma and leaf builder): molecule names in a 2D theatre, after the ANTI
     CLUTTER RULE of the Lead note. Identical copy in l_leafoptics.js, l_sun.js and l_tradeoff.js (first one loaded wins).
     LP.names2d() makes one namer per theatre; call it each frame with the molecules that may carry a name:
     { k: kind, key: the molecule object, t: text, x, y, r (drawn radius), a (alpha), age (0 = just arrived) } and the
     rectangles of the label tags already drawn. Per kind: all are named while 6 or fewer are listed and o.all is set,
     else at most q (default 2 at 1200 px, 1 on phones). A named molecule keeps its name until it leaves; a second name
     of the same kind goes to a molecule well away from the first; a name is drawn only where it overlaps no other
     name or label tag and stays inside the canvas. Uses LP.mol.name (pill under the molecule; off with MolNames). */
  LP.names2d = LP.names2d || function () {
    var prev = {};
    function hit(a, b) { return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h; }
    return function (c, P, W, H, items, block, o) {
      o = o || {};
      var m = LP.mol;
      if (!m || !m.name || (m.namesOn && !m.namesOn())) { prev = {}; return; }
      var mob = W < 560, fs = o.size || (mob ? 9.5 : 10.5), placed = (block || []).slice(), by = {}, kinds = [], next = {};
      c.save(); c.font = '700 ' + fs + 'px system-ui,-apple-system,Segoe UI,sans-serif';
      items.forEach(function (d) { if (!by[d.k]) { by[d.k] = []; kinds.push(d.k); } by[d.k].push(d); });
      function box(d) { var w = c.measureText(d.t).width + 8, h = fs + 5; return { x: d.x - w / 2 - 2, y: d.y + d.r + 1, w: w + 4, h: h + 4 }; }
      function ok(d) { var b = box(d); if (b.x < 2 || b.x + b.w > W - 2 || b.y < 0 || b.y + b.h > H - 2 || !(d.a >= 0.4)) return false; for (var i = 0; i < placed.length; i++) if (hit(b, placed[i])) return false; return true; }
      kinds.forEach(function (k) {
        var L = by[k], cfg = (o.kinds && o.kinds[k]) || {}, q = cfg.q || (cfg.all && L.length <= 6 ? 6 : (mob ? 1 : 2));
        if (mob && cfg.qm) q = cfg.qm;
        var chosen = [], old = prev[k] || [];
        L.forEach(function (d) { if (old.indexOf(d.key) >= 0 && chosen.length < q) chosen.push(d); });
        L.slice().sort(function (a, b) { return (a.age || 0) - (b.age || 0); }).forEach(function (d) {
          if (chosen.length >= q || chosen.indexOf(d) >= 0 || (d.age || 0) > (cfg.maxAge == null ? 0.5 : cfg.maxAge)) return;
          for (var i = 0; i < chosen.length; i++) if (Math.hypot(chosen[i].x - d.x, chosen[i].y - d.y) < (mob ? 70 : 110)) return;
          if (ok(d)) chosen.push(d);
        });
        next[k] = chosen.map(function (d) { return d.key; });
        chosen.forEach(function (d) { if (!ok(d)) return; placed.push(box(d)); m.name(c, P, d.x, d.y, d.r, d.t, { size: fs, alpha: Math.min(1, d.a * 1.15) }); });
      });
      c.restore();
      prev = next;
    };
  };
  function draw(c, w, h, t, dt, info) {
    if (!TS.lay || TS.lay.w !== w || TS.lay.h !== h) { TS.lay = layout(w, h); TS.co2 = []; TS.h2o = []; TS.sug = []; TS.amb = []; TS.fx = []; prewarm(5); }
    if (dt > 0) step(dt);
    var L = TS.lay, m = M(), r = R(), tier = ui.tier(), mob = L.mob;
    var P = Object.assign({}, m.palette(info.dark), { sugar: info.dark ? '#5ccf6e' : '#3f9a4a', vap: info.dark ? '#7fb8ff' : '#3a78c8' });
    c.drawImage(staticLayer(L, P, info.dpr || 1, tier), 0, 0, w, h);
    guard(c, P, L, clamp((r.gs || 0) / 0.5, 0, 1));
    var mr = mob ? 3.7 : 4.6, nm = [];   /* slow and named: molecules 15 % larger */
    /* ambient: CO2 dark, vapour drawn as faint water */
    TS.amb.forEach(function (a) {
      if (a.k === 'ci' || a.k === 'ca') m.co2(c, P, a.x, a.y, mr * 0.85, a.ang, a.al * 0.55);
      else m.water(c, P, a.x, a.y, mr * 0.75, a.ang, a.al * 0.35);
    });
    /* names: water is picked as it nears the pore from inside (p 0.45 to 0.75 of its path), CO2 as it nears the pore
       from outside (first third of its path, or from the cell when it leaves in the dark); each keeps its name through the pore */
    TS.h2o.forEach(function (q) { var p = along(q.pts, q.p), al = q.p > 0.8 ? (1 - q.p) / 0.2 : 1; m.water(c, P, p.x, p.y, mr, q.ang, al); if (q.p > 0.3 && q.p < 0.93) nm.push({ k: 'H₂O', key: q, t: 'H₂O', x: p.x, y: p.y, r: mr * 1.5, a: al, age: q.p < 0.45 ? 1 : q.p - 0.45 }); });
    TS.co2.forEach(function (q) { var p = along(q.pts, q.p); m.co2(c, P, p.x, p.y, mr, q.ang, 1); if (q.p < 0.8) nm.push({ k: 'CO₂', key: q, t: 'CO₂', x: p.x, y: p.y, r: mr * 1.3, a: 1, age: q.inn ? q.p : Math.max(0, q.p - 0.3) }); });
    TS.fx.forEach(function (f) { var k = f.t / f.dur; c.strokeStyle = P.e; c.globalAlpha = 1 - k; c.lineWidth = 2; c.beginPath(); c.arc(f.x, f.y, 3 + 9 * k, 0, TAU); c.stroke(); c.globalAlpha = 1; });
    TS.sug.forEach(function (q) {
      var x = lerp(q.x0, L.vx, q.p), y = lerp(q.y0, L.vy, q.p), rr = mob ? 6 : 7.5;
      c.globalAlpha = q.p > 0.85 ? (1 - q.p) / 0.15 : 1; c.beginPath();
      for (var i = 0; i < 6; i++) { var a = i * TAU / 6 + Math.PI / 6; c[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
      c.closePath(); c.fillStyle = P.sugar; c.fill(); c.strokeStyle = m.shade(P.sugar, -0.4); c.stroke(); c.globalAlpha = 1;
    });
    /* labels */
    var blk = [], m0 = m; m = Object.assign({}, m0, { tag: function (cc, PP, x, y, tx, o) { var rr = m0.tag(cc, PP, x, y, tx, o); if (rr) blk.push({ x: rr.x - 2, y: rr.y - 2, w: rr.w + 4, h: rr.h + 4 }); return rr; } });
    var fs = mob ? 9.5 : 11, T = function (x, y, s, o) { return m.tag(c, P, x, y, s, Object.assign({ size: fs }, o || {})); };
    T(8, L.cut / 2 + 1, tier === 1 ? 'Top of the leaf: waxy cuticle, no pores' : 'Upper (adaxial) side: cuticle, no stomata');
    T(8, L.leB + 14, tier === 1 ? 'Underside: the stoma, a pore' : 'Lower (abaxial) epidermis with a stoma');
    T(L.vx, L.vy - L.vr * 1.25 - 12, tier === 1 ? 'Vein: water in, sugar out' : 'Vein: xylem water in, sugar out', { align: 'center' });
    if (tier > 1 && !mob) T(8, (L.ue + L.pal) / 2, 'Palisade', { alpha: 0.85 });
    if (tier > 1 && !mob) T(8, L.pal + 14, 'Spongy mesophyll and air spaces', { alpha: 0.85 });
    var ratio = r.A > 0.05 ? 1000 * r.E / r.A : null;
    var big = ratio ? Math.round(ratio) + ' water molecules out per CO₂ in' : (r.A <= 0 ? 'No net CO₂ in: the leaf only loses water' : '');
    m.tag(c, P, w - 8, L.h - 16, big, { size: mob ? 10.5 : 13, weight: 700, align: 'right' });
    if (tier > 1) {
      m.tag(c, P, w - 8, L.leB + (mob ? 36 : 14), 'outside: CO₂ ' + num(r.Ca, 0) + ' ppm, vapour ' + num(Math.max(0, esat(r.T) - r.vpd), 2) + ' kPa', { size: fs - 0.5, align: 'right', alpha: 0.9 });
      m.tag(c, P, w - 8, L.le - 14, 'inside: CO₂ ' + num(r.Ci, 0) + ' ppm, vapour ' + num(esat(r.T), 2) + ' kPa', { size: fs - 0.5, align: 'right', alpha: 0.9 });
    }
    (TS.namer = TS.namer || LP.names2d())(c, P, w, h, nm, blk, { kinds: { 'H₂O': { maxAge: 0.3 }, 'CO₂': { maxAge: 0.3 } } });
  }

  /* ================================================================== charts */
  function gsCurves() {
    var gsv = LP.range(0.005, 0.8, 50);
    return LP.curve('gs', gsv, { stomata: 'fixed' });
  }
  function lineSVG(pts, key, opt, res) {
    var dark = ui.isDark(), W = 320, H = 230, l = 44, rr = 10, t = 14, b = 40;
    var ink = dark ? '#b3aca0' : '#5e5141', grid = dark ? 'rgba(236,230,218,.14)' : 'rgba(42,35,28,.13)', col = opt.col[dark ? 1 : 0];
    var ymax = opt.ymax(pts);
    function X(v) { return l + (W - l - rr) * v / 0.8; }
    function Y(v) { return t + (H - t - b) * (1 - clamp(v, opt.ymin || 0, ymax) / ymax); }
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + opt.aria + '" style="width:100%;height:auto;display:block">';
    opt.ticks(ymax).forEach(function (v) { s += '<line x1="' + l + '" x2="' + (W - rr) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="' + grid + '"/><text x="' + (l - 5) + '" y="' + (Y(v) + 4) + '" text-anchor="end" font-size="11" fill="' + ink + '" font-family="system-ui,sans-serif">' + v + '</text>'; });
    [0, 0.2, 0.4, 0.6, 0.8].forEach(function (v) { s += '<text x="' + X(v) + '" y="' + (H - b + 15) + '" text-anchor="middle" font-size="11" fill="' + ink + '" font-family="system-ui,sans-serif">' + v.toFixed(1) + '</text>'; });
    s += '<text x="' + ((l + W) / 2) + '" y="' + (H - 6) + '" text-anchor="middle" font-size="11" fill="' + ink + '" font-family="system-ui,sans-serif">Stomatal conductance, gs (mol m⁻² s⁻¹)</text>';
    s += '<text x="' + (l + 4) + '" y="' + (t + 10) + '" font-size="11.5" font-weight="600" fill="' + col + '" font-family="system-ui,sans-serif">' + opt.title + '</text>';
    s += '<path d="' + pts.map(function (p, i) { return (i ? 'L' : 'M') + X(p.x).toFixed(1) + ' ' + Y(key(p.r)).toFixed(1); }).join('') + '" fill="none" stroke="' + col + '" stroke-width="2.6"/>';
    var gx = clamp(res.gs, 0, 0.8);
    s += '<line x1="' + X(gx) + '" x2="' + X(gx) + '" y1="' + t + '" y2="' + (H - b) + '" stroke="' + ink + '" stroke-dasharray="2 3"/>';
    s += '<circle cx="' + X(gx) + '" cy="' + Y(key(res)) + '" r="5.5" fill="' + col + '" stroke="' + (dark ? '#0b1015' : '#fff') + '" stroke-width="2"/>';
    return s + '</svg>';
  }
  var CLIMATES = [
    ['fog', 'Salinas morning fog', 15, 0.15], ['salinas', 'Salinas July afternoon', 21, 1.0], ['inland', 'Inland Southern California valley', 34, 3.6],
    ['santaana', 'Santa Ana wind day', 33, 4.5], ['fresno', 'Fresno July afternoon', 37, 4.5]
  ];
  function climateBars(res) {
    var dark = ui.isDark(), st = LP.state, gs = res.gs;
    var rows = CLIMATES.map(function (c) {
      var o = {}; Object.keys(st).forEach(function (k) { o[k] = st[k]; });
      o.T = c[2]; o.vpd = c[3]; o.stomata = 'fixed'; o.gs = gs;
      var r = LP.solve(o); return { c: c, r: r, w: r.A > 0.05 ? 1000 * r.E / r.A : null };
    });
    var mx = Math.max.apply(null, rows.map(function (q) { return q.w || 0; }).concat([100]));
    var col = dark ? '#7fb8ff' : '#2f6fb8';
    return '<div class="tr-bars">' + rows.map(function (q) {
      var on = Math.abs(st.vpd - q.c[3]) < 0.01 && Math.abs(st.T - q.c[2]) < 0.01;
      return '<button type="button" class="tr-bar' + (on ? ' on' : '') + '" data-clim="' + q.c[0] + '" aria-pressed="' + on + '"><span class="tr-bl">' + q.c[1] + ' <small>' + q.c[2] + ' °C, VPD ' + num(q.c[3], 2) + ' kPa</small></span>' +
        '<span class="tr-bt"><i style="width:' + (q.w ? (100 * q.w / mx).toFixed(1) : 0) + '%;background:' + col + '"></i></span><span class="tr-bv mono">' + (q.w ? Math.round(q.w) : 'n/a') + '</span></button>';
    }).join('') + '</div>';
  }

  /* ================================================================== markup */
  var CSS =
    '#lv-tradeoff .tr-theatre{min-height:300px}#lv-tradeoff .tr-play{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:8px 0 0}' +
    '#lv-tradeoff .tr-ctrls{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:0;margin:12px 0 0;border-top:1px solid var(--rule2)}' +
    '#lv-tradeoff .tr-sw{display:flex;flex-wrap:wrap;gap:6px;align-items:center}' +
    '#lv-tradeoff .tr-two{display:grid;grid-template-columns:1fr 1fr;gap:12px}' +
    '@media (max-width:640px){#lv-tradeoff .tr-two{grid-template-columns:1fr}}' +
    '#lv-tradeoff .tr-bars{display:grid;gap:6px}' +
    '#lv-tradeoff .tr-bar{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1.6fr) 3.2em;gap:10px;align-items:center;text-align:left;font:inherit;font-family:var(--ui);font-size:13.5px;color:var(--ink);background:var(--paper);border:1px solid var(--rule);border-radius:8px;padding:7px 10px;cursor:pointer}' +
    '#lv-tradeoff .tr-bar.on{border-color:var(--ink);box-shadow:0 0 0 1px var(--ink) inset}' +
    '#lv-tradeoff .tr-bar small{display:block;color:var(--ink2);font-size:11.5px}' +
    '#lv-tradeoff .tr-bt{height:14px;background:var(--rule2);border-radius:7px;overflow:hidden}#lv-tradeoff .tr-bt i{display:block;height:100%;border-radius:7px;transition:width .5s}' +
    '#lv-tradeoff .tr-bv{text-align:right;font-weight:600}' +
    '@media (max-width:520px){#lv-tradeoff .tr-bar{grid-template-columns:1fr 3em}#lv-tradeoff .tr-bt{grid-column:1/-1;grid-row:2}}' +
    '#lv-tradeoff .eq{font-family:var(--mono);font-size:13.5px;line-height:1.9;overflow-x:auto}' +
    '#lv-tradeoff .tr-links a{font-family:var(--ui);font-weight:600}' +
    '#lv-tradeoff .tile.tr-hot .v{color:var(--warm)}';
  function tile(id, k, unit, cls) { return '<div class="tile' + (cls ? ' ' + cls : '') + '" id="' + id + '"><div class="k">' + k + '</div><div class="v"><span class="n">0</span> <small>' + (unit || '') + '</small></div></div>'; }
  var A1 = null;

  function mount(el) {
    U();
    var E = ui.ev;
    el.innerHTML = '<style>' + CSS + '</style>' +
      ui.now('<b>What is happening:</b> <span id="tr-now"></span>', 'tr-nowp') +

      '<figure class="fig lx-fig" id="tr-live"><div class="fighead"><h3>5.1 One pore, two lanes</h3><p>CO₂ diffuses in and water vapour diffuses out through the same stoma. Open it for carbon, and water leaves too.</p></div>' +
      '<div class="lx-frame tr-theatre" id="tr-th"></div>' +
      '<p class="tr-play"><button type="button" class="btn small" id="tr-pause" aria-pressed="false">Pause</button></p>' +
      '<div class="tr-ctrls">' +
      '<div class="ctl"><span class="ctl-l">Who sets the stomata?</span><div class="tr-sw" role="group" aria-label="Who sets the stomata"><button type="button" class="chip" data-mode="ratio">The leaf (Ci/Ca 0.7)</button><button type="button" class="chip" data-mode="fixed">You, with the slider</button></div><div class="hint">' + E('eng.ci', 'Leaf rule') + '</div><div class="hint tier-3">In this model, when the leaf sets its stomata, g<sub>s</sub> simply follows A (g<sub>s</sub> = 1.6 A / (C<sub>a</sub> − C<sub>i</sub>)), so heat, darkness, DCMU or an uncoupler all close the pore. Real leaves often keep stomata open in heat to cool; switch to the slider to break that link.</div></div>' +
      '<div class="ctl"><label for="tr-gs">Stomatal opening, gs <output id="tr-gs-o"></output></label><input type="range" id="tr-gs" min="0" max="0.8" step="0.005"><div class="hint">moving it hands the stomata to you</div></div>' +
      '<div class="ctl"><label for="tr-vpd">Dryness of the air, VPD <output id="tr-vpd-o"></output></label><input type="range" id="tr-vpd" min="0.1" max="6" step="0.05"><div class="hint">vapour pressure deficit, leaf to air</div></div>' +
      '<div class="ctl tier-2"><label for="tr-Ca">CO₂ in the air <output id="tr-Ca-o"></output></label><input type="range" id="tr-Ca" min="200" max="1200" step="10"><div class="hint">today about 420 ppm</div></div>' +
      '</div>' +
      '<figcaption class="cap" id="tr-cap"></figcaption>' +
      '<p class="cap lx-row">Beads move at model rates: one CO₂ bead is 1.7 µmol m⁻² s⁻¹ and one water bead is 100 times that, or the water would hide the leaf. Floating molecules show concentrations inside and outside. ' + E('tr.scale', 'Drawing scale') + ' ' + E('tr.diff', 'Why 1.6') + '</p>' +
      '</figure>' +

      '<div class="tiles lx-tiles" id="tr-tiles">' +
      tile('tr-A', 'Carbon in, A', 'µmol m⁻² s⁻¹') +
      tile('tr-E', 'Water out, E', 'mmol m⁻² s⁻¹') +
      tile('tr-ratio', 'Water per CO₂', 'molecules') +
      tile('tr-wue', 'Water use efficiency, A/E', 'µmol CO₂ per mmol H₂O', 'tier-2') +
      tile('tr-iwue', 'Intrinsic WUE, A/gs', 'µmol mol⁻¹', 'tier-3') +
      tile('tr-gsv', 'Stomatal conductance, gs', 'mol m⁻² s⁻¹', 'tier-2') +
      tile('tr-cica', 'Ci / Ca', '', 'tier-2') +
      tile('tr-day', 'Water over a 10 h day at this rate', 'kg per m² of leaf') +
      '</div>' +
      '<p class="cap lx-row tier-2">' + E('tr.day', '10 h day') + ' Per gram of carbon fixed the leaf loses hundreds of grams of water. That is why the water side of this site comes first: every CO₂ the stroma fixes was paid for with water lifted from the soil.</p>' +

      '<figure class="fig lx-fig" id="tr-curves"><div class="fighead"><h3>5.2 What opening the stomata buys, and what it costs</h3><p>Same leaf, same light and air: only the stomata change.</p></div>' +
      '<div class="tr-two"><div class="lx-frame" id="tr-cA" style="padding:6px"></div><div class="lx-frame" id="tr-cE" style="padding:6px"></div></div>' +
      '<figcaption class="cap" id="tr-ccap"></figcaption>' +
      '<p class="cap lx-row tier-2">Carbon gain levels off because the CO₂ inside the leaf approaches the CO₂ outside and Rubisco or light becomes the limit (Plate IV). In this model water loss keeps climbing in a straight line, because the vapour gradient does not shrink as the pore opens. The last bit of opening buys the least carbon for the most water. ' + E('tr.diff') + ' ' + E('fvcb_model', 'FvCB') + '</p>' +
      '</figure>' +

      '<figure class="fig lx-fig" id="tr-clim"><div class="fighead"><h3>5.3 Same leaf, five California afternoons</h3><p>Water molecules lost per CO₂ fixed, with the stomata held at today’s opening. Tap one to send the leaf there.</p></div>' +
      '<div id="tr-climbox"></div>' +
      '<p class="cap lx-row">Dry air, not heat by itself, is what drives the water bill up. A Santa Ana day and a Fresno afternoon cost several times more water per CO₂ than a Salinas morning in fog. ' + E('tr.vpd', 'Afternoon values') + '</p>' +
      '</figure>' +

      '<section class="card tr-links" aria-label="Back to The Water Path"><h3 class="lx-h3">Back to The Water Path</h3>' +
      '<p class="tr-pass" id="tr-pass"></p>' +
      '<p>The E on this plate is the same flow that runs through roots, stems and leaves in The Water Path. When the soil dries, leaf water potential becomes more negative, stomata close, and the gs slider here moves left: you can see exactly what that closing costs in carbon.</p>' +
      '<p><a href="../journey/index.html#field">The Field: VPD and evaporative demand</a> · <a href="../journey/index.html#plant">The Plant: the water potential staircase</a> · <a href="../journey/index.html#membrane">The Membrane: aquaporins and the cuticle</a> · <a href="../journey/index.html#species">California and beyond: chaparral, oaks and crops on one chart</a> · <a href="../journey/index.html#afternoon">A Salinas afternoon</a></p></section>' +

      '<section class="lx-cases" aria-label="Real cases"><h3 class="lx-h3">Real cases to think with</h3><div class="lx-cardgrid">' +
      '<div class="card lx-case"><p class="lx-ck">Lettuce in fog, lettuce in a hot afternoon</p><p>The same romaine leaf with the same stomatal opening loses several times more water per CO₂ in the dry afternoon than in the morning fog. Growers time irrigation by evaporative demand for this reason. <a href="../journey/index.html#field">ETo on the Field plate</a>. ' + E('tr.vpd') + '</p><p><button type="button" class="btn small" data-clim="fog">Morning fog</button> <button type="button" class="btn small" data-clim="salinas">Afternoon</button></p></div>' +
      '<div class="card lx-case"><p class="lx-ck">A Santa Ana wind day on the chaparral</p><p>Hot, very dry air pours off the deserts toward the coast. A chamise or Ceanothus shrub that kept its stomata open would lose water many times faster than on a foggy day. Close them and the leaf saves water but fixes little CO₂. Which would you expect on a slope with dry soil? ' + E('tr.vpd') + '</p><p><button type="button" class="btn small" data-clim="santaana">Santa Ana day</button> <button type="button" class="btn small" data-tr="close">Close the stomata to 0.05</button></p></div>' +
      '<div class="card lx-case tier-2"><p class="lx-ck">More CO₂, less water</p><p>In open field FACE experiments, extra CO₂ lowered water use at leaf and canopy scale while carbon gain rose. Here, raise the CO₂ and let the leaf keep Ci/Ca at 0.7: stomata close a little and water per CO₂ falls. ' + E('str.face') + '</p><p><button type="button" class="btn small" data-tr="co2hi">700 ppm, the leaf decides</button></p></div>' +
      '<div class="card lx-case tier-2"><p class="lx-ck">Agave and cactus: open at night</p><p>CAM plants open their stomata at night, when the air is cool and VPD is low, store CO₂ as malic acid and fix it by day behind closed stomata. Agronomic CAM species can match the yields of water efficient C3 and C4 crops with about 20 % of the water. Try the night VPD of a desert: what happens to water per CO₂? ' + E('cam_water') + '</p><p><button type="button" class="btn small" data-tr="night">Desert night VPD, 0.8 kPa</button></p></div>' +
      '<div class="card lx-case tier-3"><p class="lx-ck">Speedy stomata</p><p>Stomata take minutes to follow a cloud; photosynthesis follows in seconds. When the sun comes back, slow opening wastes carbon; when it goes, slow closing wastes water. Faster stomata are a breeding target for water use efficiency. ' + E('tr.speedy') + '</p></div>' +
      '</div></section>' +

      '<section class="tier-3 lx-expert" aria-label="Expert"><h3 class="lx-h3">Equations and assumptions</h3>' +
      '<div class="card eq">A = g<sub>c</sub> (C<sub>a</sub> − C<sub>i</sub>),  g<sub>c</sub> = g<sub>s</sub> / 1.6    (supply)<br>' +
      'A = g<sub>m</sub> (C<sub>i</sub> − C<sub>c</sub>)    (mesophyll, 5.4)<br>' +
      'A = min(A<sub>c</sub>, A<sub>j</sub>) − R<sub>d</sub> at C<sub>c</sub>    (demand, Plate IV); fixed g<sub>s</sub>: C<sub>i</sub> and C<sub>c</sub> solved where all three agree<br>' +
      'E = g<sub>s</sub> × VPD / P<sub>atm</sub>    (leaf temperature = air temperature; no boundary layer)<br>' +
      'WUE = A / E = C<sub>a</sub> (1 − C<sub>i</sub>/C<sub>a</sub>) P<sub>atm</sub> / (1.6 VPD)    intrinsic WUE = A / g<sub>s</sub> = C<sub>a</sub> (1 − C<sub>i</sub>/C<sub>a</sub>) / 1.6<br>' +
      'water molecules per CO₂ = 1000 E / A</div>' +
      '<div class="card lx-open"><p class="lx-ck">' + ui.badge('OPEN QUESTION') + ' Is there a rule for how far stomata open?</p><p>This page lets either you or a fixed Ci/Ca ratio decide. Real stomata integrate light, CO₂, VPD, leaf water potential and ABA. One family of models proposes that stomata keep the extra water spent per extra carbon gained constant through the day (the constant marginal water cost idea); another maximises carbon gain minus a hydraulic cost, the risk of xylem embolism. Which cost does a grapevine on a hot afternoon weigh more heavily, and how would you test it with the water potential and stomatal data on the Organ plate of The Water Path? ' + E('tr.sperry', 'Gain minus hydraulic cost') + ' ' + E('tr.speedy') + '</p></div>' +
      '<div class="card lx-open"><p class="lx-ck">' + ui.badge('OPEN QUESTION') + ' How much water leaves when the stomata are shut?</p><p>Set g<sub>s</sub> to zero here and E becomes zero, which is not true: water still leaves through the cuticle (g<sub>min</sub>), and in heat that leak can matter for survival. The Membrane plate of The Water Path shows it. How large is g<sub>min</sub> for lettuce, and does it rise in a heat wave? <a href="../journey/index.html#membrane">The cuticle</a></p></div>' +
      ui.design({ title: 'dry air and lettuce stomata', question: 'Does romaine lettuce close its stomata enough in dry air to hold water use efficiency, or does it pay the full water bill?',
        treat: 'VPD 1.0 kPa and 3.0 kPa at the same leaf temperature (25 °C) and light (1,000 µmol m⁻² s⁻¹), set in the gas exchange chamber on the same leaf, low VPD first then high, 30 min at each.',
        measure: 'g<sub>s</sub>, A, E and Ci after steady state at each VPD; intrinsic WUE (A/g<sub>s</sub>) and WUE (A/E).',
        howto: ['tr.gx'], n: 'Plants are the replicates: 6 plants, one young fully expanded leaf each; repeat on a second day to separate leaf from day.',
        expect: 'With stomata held still, this page’s model predicts WUE falls by <span id="tr-de-wue"></span> times from 1.0 to 3.0 kPa ' + ui.badge('DERIVED') + '. Any smaller fall is the leaf closing its stomata; the size of that response is the answer.',
        confound: 'Leaf temperature: as E changes, the leaf cools or warms and the true leaf to air VPD moves. Control leaf temperature, not air temperature, and report leaf VPD.' }) +
      ui.howto('tr.gx') +
      '</section>' +

      '<section class="lx-qs" aria-label="Questions"><h3 class="lx-h3">Check yourself</h3>' +
      ui.reveal('Predict: you double gs from 0.2 to 0.4 mol m⁻² s⁻¹ in bright light. Does A double? Does E double? Then try it with the slider.',
        '<p>E roughly doubles, because water loss is proportional to gs at a fixed VPD. A rises much less, because Ci climbs toward Ca and Rubisco or light starts to limit. Water use efficiency falls.</p>', { choices: [
          ['E doubles, A rises much less', true, 'Water loss follows gs; carbon gain is held back by Rubisco and light.'],
          ['Both double', false, 'Only E is proportional to gs. A levels off as Ci approaches Ca.'],
          ['A doubles, E barely changes', false, 'The vapour gradient does not shrink as the pore opens, so E keeps climbing.']] }) +
      '<div class="tier-2">' + ui.reveal('Hold gs fixed and move from the Salinas afternoon (1.0 kPa) to the Fresno afternoon (4.5 kPa) at the same leaf temperature. What happens to A, to E and to WUE?',
        '<p>A hardly changes, because VPD does not enter the CO₂ supply or the biochemistry. E rises about 4.5 times, so WUE falls by the same factor. Real leaves partly close their stomata in dry air, which is how they fight this.</p>', { choices: [
          ['A about the same, E up about 4.5 times, WUE down', true, 'VPD drives water out but does not touch the CO₂ side.'],
          ['A falls, E and WUE stay the same', false, 'With gs held, VPD changes only the water side.'],
          ['All three rise', false, 'More water out per CO₂ means WUE falls.']] }) + '</div>' +
      '<div class="tier-3">' + ui.reveal('Intrinsic WUE (A/gs) depends only on Ca and Ci/Ca. Why do plant physiologists like it for comparing cultivars measured on different days?',
        '<p>A/gs = Ca (1 − Ci/Ca) / 1.6 removes VPD, which changes from day to day and hour to hour, so differences in A/gs reflect how the leaf balances stomata against photosynthetic capacity. It still depends on Ca and on mesophyll conductance, and it ignores leaf temperature effects on VPD, so report the conditions.</p>') + '</div>' +
      '</section>' + (ui.quiz ? ui.quiz('tradeoff') : '');

if (window.WPMolColor) { var mk1 = el.querySelector('#tr-th'); if (mk1) mk1.insertAdjacentHTML('afterend', WPMolColor.key(['h2o', 'co2'])); } // v19: the site wide molecule key
    A1 = ui.anim(el.querySelector('#tr-th'), {
      height: function (w) { return w < 560 ? 500 : 550; },
      label: 'Leaf cross section: CO2 molecules diffuse in through a stoma on the lower surface to the chloroplasts, water vapour diffuses out through the same pore; guard cells open with stomatal conductance',
      draw: draw,
      settle: function () { if (!TS.lay) return; TS.co2 = []; TS.h2o = []; TS.sug = []; prewarm(5); },
      resize: function () { TS.lay = null; cache = null; }
    });
    var pb = el.querySelector('#tr-pause');
    if (window.PlaySpeed) pb.parentNode.appendChild(window.PlaySpeed.chip('ps-light'));
    pb.addEventListener('click', function () { var p = !A1.paused(); A1.pause(p); pb.setAttribute('aria-pressed', p ? 'true' : 'false'); pb.textContent = p ? 'Play' : 'Pause'; });
    if (A1.freeze) A1.freeze.bind(pb); // v19: click the view to freeze, in step with Pause
    var gs = el.querySelector('#tr-gs'); gs.addEventListener('input', function () { LP.set({ stomata: 'fixed', gs: +gs.value }); });
    var vp = el.querySelector('#tr-vpd'); vp.addEventListener('input', function () { LP.set({ vpd: +vp.value }); });
    var ca = el.querySelector('#tr-Ca'); ca.addEventListener('input', function () { LP.set({ Ca: +ca.value }); });
    el.addEventListener('click', function (e) {
      var md = e.target.closest('[data-mode]');
      if (md) { if (md.dataset.mode === 'ratio') LP.set({ stomata: 'ratio' }); else LP.set({ stomata: 'fixed', gs: Math.round((R().gs || 0.2) * 200) / 200 }); return; }
      var cl = e.target.closest('[data-clim]');
      if (cl) { var c = CLIMATES.filter(function (x) { return x[0] === cl.dataset.clim; })[0]; if (c) LP.set({ T: c[2], vpd: c[3] }); return; }
      var b = e.target.closest('[data-tr]'); if (!b) return;
      var k = b.dataset.tr;
      if (k === 'close') LP.set({ stomata: 'fixed', gs: 0.05 });
      else if (k === 'co2hi') LP.set({ stomata: 'ratio', Ca: 700 });
      else if (k === 'night') LP.set({ vpd: 0.8, T: 18 });
      var th = document.getElementById('tr-live'); if (th && th.scrollIntoView) th.scrollIntoView({ behavior: ui.reducedMotion() ? 'auto' : 'smooth', block: 'start' });
    });
    ui.onPrefs(function () { cache = null; renderCharts(LP.result, true); });
    window.addEventListener('lp:tier', function () { cache = null; if (A1) A1.redraw(); update(LP.state, LP.result); });
  }

  var lastKey = '';
  function renderCharts(res, force) {
    var st = LP.state;
    var key = [st.T, st.Ca, st.O2, st.leaf, st.ppfd, JSON.stringify(st.spectrum), st.Vcmax25, st.Jmax25, st.dcmu, st.uncoupler, st.vpd, st.cyclicScale, ui.isDark()].join('|');
    var a = document.getElementById('tr-cA'), e = document.getElementById('tr-cE');
    if (a && (force || key !== lastKey)) {
      lastKey = key;
      var pts = gsCurves();
      TR_PTS = pts;
    }
    if (a && TR_PTS) {
      a.innerHTML = lineSVG(TR_PTS, function (r) { return r.A; }, { col: ['#2f7a3a', '#8fd19e'], title: 'Carbon in, A (µmol m⁻² s⁻¹)', aria: 'Net CO2 uptake against stomatal conductance', ymin: -2,
        ymax: function (p) { return Math.max(10, Math.ceil(Math.max.apply(null, p.map(function (q) { return q.r.A; })) / 5) * 5); }, ticks: function (m) { var o = []; for (var v = 0; v <= m; v += m > 30 ? 10 : 5) o.push(v); return o; } }, res);
      e.innerHTML = lineSVG(TR_PTS, function (r) { return r.E; }, { col: ['#2f6fb8', '#7fb8ff'], title: 'Water out, E (mmol m⁻² s⁻¹)', aria: 'Transpiration against stomatal conductance',
        ymax: function (p) { return Math.max(2, Math.ceil(Math.max.apply(null, p.map(function (q) { return q.r.E; })) / 2) * 2); }, ticks: function (m) { var o = [], s = m > 20 ? 10 : (m > 8 ? 4 : 2); for (var v = 0; v <= m; v += s) o.push(v); return o; } }, res);
    }
    var cb = document.getElementById('tr-climbox'); if (cb) cb.innerHTML = climateBars(res);
  }
  var TR_PTS = null;
  function setT(id, v, hot) { var e = document.querySelector('#' + id + ' .n'); if (e) e.textContent = v; var t = document.getElementById(id); if (t) t.classList.toggle('tr-hot', !!hot); }

  function update(st, res) {
    if (!ui) return;
    function sync(id, v, txt) { var e = document.getElementById(id); if (e && document.activeElement !== e && v != null) e.value = v; var o = document.getElementById(id + '-o'); if (o) o.textContent = txt; }
    sync('tr-gs', res.gs, num(res.gs, 3) + ' mol m⁻² s⁻¹'); sync('tr-vpd', st.vpd, num(st.vpd, 2) + ' kPa'); sync('tr-Ca', st.Ca, num(st.Ca, 0) + ' ppm');
    Array.prototype.forEach.call(document.querySelectorAll('#lv-tradeoff [data-mode]'), function (b) { b.setAttribute('aria-pressed', b.dataset.mode === (st.stomata === 'fixed' ? 'fixed' : 'ratio') ? 'true' : 'false'); });
    var ratio = res.A > 0.05 ? 1000 * res.E / res.A : null;
    setT('tr-A', num(res.A, 1)); setT('tr-E', num(res.E, 2)); setT('tr-ratio', ratio ? num(ratio, 0) : 'n/a', ratio > 600);
    /* show the unit step (undergraduate panel 10): mmol to µmol before dividing */
    var rs = document.querySelector('#tr-ratio small'); if (rs) rs.innerHTML = ratio ? 'molecules: ' + num(res.E, 2) + ' mmol = ' + num(1000 * res.E, 0) + ' µmol; ' + num(1000 * res.E, 0) + ' ÷ ' + num(res.A, 1) + ' = ' + num(ratio, 0) : 'molecules';
    var ws = document.querySelector('#tr-wue small'); if (ws) ws.innerHTML = 'µmol CO₂ per mmol H₂O' + (ratio ? ' = 1000 ÷ ' + num(ratio, 0) : '');
    var pass = document.getElementById('tr-pass');
    if (pass) {
      var spl = res.waterSplit > 0 && res.E > 0 ? (1000 * res.E + res.waterSplit) / res.waterSplit : null;
      pass.innerHTML = spl ? '<b>Where your molecule ends.</b> Of the water this leaf handles right now, about 1 molecule in ' + num(spl, 0) + ' never leaves: it is split at photosystem II, its electrons go to NADPH and its oxygen to the air as O₂ (the rest leave through the stomata). The rest of the site gives this as about 1 in 60 to 1 in 100: counting only the 2 waters per CO₂ fixed gives about 1 in 100; counting the extra electrons photorespiration uses gives this leaf’s number. ' + ui.ev('tr.split', 'How it is counted') + ' <a href="../journey/index.html#plant">Start of the trip: the soil and the plant</a> · <a href="../index.html#/map">The Water Path map strip</a · <a href="#thylakoid">Plate III: the split</a>' : '<b>Where your molecule ends.</b> With no light reactions running, no water is being split now: every molecule that moves leaves through the stomata or the cuticle.';
    }
    var dw = document.getElementById('tr-de-wue');
    if (dw && !dw.dataset.done) { var w1 = LP.solve(Object.assign({}, st, { stomata: 'fixed', gs: 0.3, vpd: 1.0, T: 25, ppfd: 1000, ciFixed: 0 })), w3 = LP.solve(Object.assign({}, st, { stomata: 'fixed', gs: 0.3, vpd: 3.0, T: 25, ppfd: 1000, ciFixed: 0 })); dw.textContent = num(w1.wue / w3.wue, 1); dw.dataset.done = 1; }
    setT('tr-wue', res.A > 0 ? num(res.wue, 2) : 'n/a'); setT('tr-iwue', res.A > 0 ? num(res.iwue, 0) : 'n/a'); setT('tr-gsv', num(res.gs, 3));
    setT('tr-cica', res.Ca > 0 ? num(res.Ci / res.Ca, 2) : 'n/a'); setT('tr-day', num(res.E * 18.02e-3 * 36000 / 1000, 2));
    var now = document.getElementById('tr-now'); if (now) now.innerHTML = nowText(st, res, ratio);
    var cap = document.getElementById('tr-cap'); if (cap) cap.innerHTML = capText(st, res);
    var cc = document.getElementById('tr-ccap'); if (cc) cc.innerHTML = 'The dots are this leaf: gs ' + num(res.gs, 3) + ' mol m⁻² s⁻¹, A ' + num(res.A, 1) + ' µmol m⁻² s⁻¹, E ' + num(res.E, 2) + ' mmol m⁻² s⁻¹, at VPD ' + num(st.vpd, 2) + ' kPa and ' + num(st.Ca, 0) + ' ppm CO₂.';
    renderCharts(res);
    if (A1 && (ui.reducedMotion() || A1.paused())) { if (ui.reducedMotion() && TS.lay) { TS.co2 = []; TS.h2o = []; TS.sug = []; prewarm(5); } A1.redraw(); }
  }
  function nowText(st, r, ratio) {
    if (!(r.A > 0)) return 'No net CO₂ is coming in (' + (r.limit === 'dark' ? 'dark' : (r.limit === 'blocked' ? 'the light reactions are blocked on Plate III' : 'stomata nearly shut')) + '), yet ' + num(r.E, 2) + ' mmol m⁻² s⁻¹ of water still leaves.';
    if (ui.tier() === 1) return 'For every CO₂ molecule the leaf takes in, about ' + num(ratio, 0) + ' water molecules leave through the same pores.';
    return 'For every CO₂ molecule the leaf takes in, ' + num(ratio, 0) + ' water molecules leave through the same pores (' + num(r.A, 1) + ' µmol CO₂ against ' + num(r.E, 2) + ' mmol water per m² per second).';
  }
  function capText(st, r) {
    if (ui.tier() === 1) return 'Dark molecules with red ends are CO₂, red and white ones are water. Watch the pore on the underside: wider open lets more CO₂ in, and much more water out.';
    return (st.stomata === 'fixed' ? 'You hold the stomata at ' + num(r.gs, 3) + ' mol m⁻² s⁻¹; Ci settles where supply meets demand, at ' + num(r.Ci, 0) + ' ppm.' : 'The leaf keeps Ci at 0.7 of the air, ' + num(r.Ci, 0) + ' ppm, and opens its stomata to ' + num(r.gs, 3) + ' mol m⁻² s⁻¹ to do it.') +
      ' Inside the leaf the air is saturated with vapour (' + num(esat(r.T), 2) + ' kPa at ' + num(r.T, 0) + ' °C); outside it holds ' + num(Math.max(0, esat(r.T) - r.vpd), 2) + ' kPa.';
  }

  /* ================================================================== Test yourself: Plate V (15 items) */
  LP.quiz = LP.quiz || {}; LP.quiz.items = LP.quiz.items || [];
  [
    { id: 'tr-k-pore', t: 1, plate: 'tradeoff', b: 'DERIVED', src: [],
      q: 'Why can a leaf not take in CO₂ without losing water?',
      o: [['CO₂ enters and water vapour leaves through the same open stomata', 'Right. The pore that lets CO₂ diffuse in lets vapour diffuse out from the wet leaf interior.'],
        ['Rubisco needs water to fix CO₂', 'The reaction uses very little water; the loss is through the pores.'],
        ['CO₂ pushes water out of the cells', 'Diffusion of each gas runs down its own gradient; CO₂ does not push water.']], a: 0 },
    { id: 'tr-k-where', t: 1, plate: 'tradeoff', b: 'DERIVED', src: [],
      q: 'In the leaf on this plate, where are the stomata?',
      o: [['In the lower (abaxial) epidermis', 'Right. The upper side is covered by cuticle and loses water only slowly through it.'],
        ['Only in the upper (adaxial) epidermis', 'In this leaf the upper side has no stomata; many leaves have most on the underside.'],
        ['Inside the vein', 'Veins carry water and sugar; stomata are pores in the epidermis.']], a: 0 },
    { id: 'tr-k-vpd', t: 1, plate: 'tradeoff', b: 'DERIVED', src: [],
      q: 'With the stomata held at the same opening, the air gets drier (higher VPD). What happens to water loss?',
      o: [['It rises in proportion to VPD', 'Right. E = gs × VPD / P: double the dryness, double the loss.'],
        ['It falls, because dry air holds less water', 'Dry air has a larger deficit, so it pulls more water out.'],
        ['It stays the same, because the stomata did not change', 'The pore is the same, but the gradient across it is steeper.']], a: 0 },
    { id: 'tr-k-ratio', t: 1, plate: 'tradeoff', b: 'DERIVED', src: [],
      q: 'On a typical bright afternoon, roughly how many water molecules does a C3 leaf lose for each CO₂ it fixes?',
      o: [['A few hundred', 'Right. With E about 2.2 mmol and A about 12 µmol per m² per second, the ratio is near 190, and it climbs in dry air.'],
        ['About one', 'Water diffuses out much faster and down a much steeper gradient than CO₂ comes in.'],
        ['About ten thousand', 'That would be an extremely dry day with nearly shut stomata; typical values are in the hundreds.']], a: 0 },
    { id: 'tr-k-close', t: 1, plate: 'tradeoff', b: 'DERIVED', src: [],
      q: 'Soil dries, leaf water potential becomes more negative and the stomata partly close. What is the cost?',
      o: [['Less CO₂ gets in, so photosynthesis falls, while water is saved', 'Right. Closing stomata trades carbon for water; that is the trade this plate is named after.'],
        ['No cost: photosynthesis is unaffected by stomata', 'CO₂ must come in through the stomata, so closing them lowers Ci and A.'],
        ['Water loss rises', 'Closing the pore lowers water loss.']], a: 0 },
    { id: 'tr-u-16', t: 2, plate: 'tradeoff', b: 'DERIVED', src: [],
      q: 'gs to water vapour is 0.3 mol m⁻² s⁻¹. What is the conductance to CO₂, and why is it different?',
      o: [['About 0.19, because CO₂ diffuses about 1.6 times more slowly than water vapour', 'Right. 0.3 ÷ 1.6 = 0.19. Heavier, larger molecules diffuse more slowly.'],
        ['0.48, because CO₂ is more concentrated', 'Conductance depends on diffusivity, not concentration, and CO₂ is the slower gas.'],
        ['The same, 0.3', 'The pore is the same but the gases diffuse at different speeds.']], a: 0 },
    { id: 'tr-u-supply', t: 2, plate: 'tradeoff', b: 'DERIVED', src: [],
      q: 'Ca = 420 ppm, Ci = 294 ppm, gs = 0.18 mol m⁻² s⁻¹. What CO₂ uptake does the supply equation give?',
      o: [['About 14 µmol m⁻² s⁻¹', 'Right. A = (0.18 / 1.6) × (420 − 294) = 0.1125 × 126 = 14.2.'],
        ['About 23 µmol m⁻² s⁻¹', 'That forgets to divide by 1.6.'],
        ['About 76 µmol m⁻² s⁻¹', 'That uses Ca alone instead of the difference Ca − Ci.']], a: 0 },
    { id: 'tr-u-E', t: 2, plate: 'tradeoff', b: 'DERIVED', src: [],
      q: 'gs = 0.2 mol m⁻² s⁻¹, VPD = 2 kPa, air pressure 101 kPa. What is E?',
      o: [['About 4 mmol m⁻² s⁻¹', 'Right. 0.2 × 2 / 101 = 0.004 mol = 4 mmol m⁻² s⁻¹.'],
        ['About 0.4 mmol m⁻² s⁻¹', 'Check the units: 0.004 mol is 4 mmol.'],
        ['About 40 mmol m⁻² s⁻¹', 'That is ten times too high; divide by the air pressure in kPa.']], a: 0 },
    { id: 'tr-u-saturate', t: 2, plate: 'tradeoff', b: 'DERIVED', src: ['10.1007/BF00386231'],
      q: 'Why does A level off as gs keeps rising, while E keeps climbing?',
      o: [['Ci approaches Ca and Rubisco or light limits, but the vapour gradient stays the same', 'Right. Opening further adds water loss at the same rate and carbon gain at a falling rate.'],
        ['Because CO₂ runs out in the air', 'The air keeps its 420 ppm; the limit is inside the leaf.'],
        ['Because water loss cools the leaf to zero', 'Cooling happens, but it is not why A levels off.']], a: 0 },
    { id: 'tr-u-co2', t: 2, plate: 'tradeoff', b: 'VERIFIED', src: ['10.1093/jxb/erp096'],
      q: 'Free Air CO₂ Enrichment experiments raised CO₂ over crop fields. Which result fits this plate?',
      o: [['Carbon gain rose and water use fell at leaf and canopy scale', 'Right. More CO₂ outside means more carbon per unit of stomatal opening, and leaves close slightly.'],
        ['Water use rose because plants grew bigger leaves', 'The review reports decreased water use at both scales.'],
        ['Nothing changed in C3 crops', 'C3 carbon gain did rise; yield rose less than expected.']], a: 0 },
    { id: 'tr-q-iwue', t: 3, plate: 'tradeoff', b: 'DERIVED', src: [],
      q: 'Two lettuce cultivars have the same A/gs but were measured at VPD 1 and 2.5 kPa. Their A/E differs by 2.5 times. Which reading is right?',
      o: [['Their leaf level balance of stomata and photosynthesis is the same; the A/E difference comes from the air', 'Right. A/gs removes VPD; A/E includes it. Compare cultivars on A/gs or measure them side by side.'],
        ['The cultivar with higher A/E is more water efficient', 'Only because it was measured on a more humid day.'],
        ['A/gs must be wrong', 'A/gs is designed for this comparison.']], a: 0 },
    { id: 'tr-q-gmin', t: 3, plate: 'tradeoff', b: 'DERIVED', src: [],
      q: 'With gs set to zero, this model says E = 0. Why is that wrong for a real leaf in a heat wave?',
      o: [['Water still escapes through the cuticle (gmin), and that leak can rise with temperature', 'Right. Residual conductance sets how long a leaf with shut stomata can hold its water; see the cuticle on the Membrane plate of The Water Path.'],
        ['Stomata can never fully close', 'Stomata can close nearly completely; the cuticle is the main leak then.'],
        ['Rubisco releases water', 'Rubisco does not release water vapour.']], a: 0 },
    { id: 'tr-q-speedy', t: 3, plate: 'tradeoff', b: 'VERIFIED', src: ['10.1111/nph.15330'],
      q: 'A breeder selects plants whose stomata open and close faster. In which conditions should water use efficiency improve most?',
      o: [['Under fluctuating light, with clouds and leaf shading, where slow stomata lag behind photosynthesis', 'Right. In steady light the lag does not matter; in flickering light it costs water and carbon.'],
        ['In constant light, because fast stomata open wider', 'Speed matters for transitions, not for the steady state.'],
        ['At night only', 'The main gain is during the day as light changes.']], a: 0 },
    { id: 'tr-q-cam', t: 3, plate: 'tradeoff', b: 'VERIFIED', src: ['10.1093/jxb/erp118'],
      q: 'Agronomic CAM species can match productive C3 and C4 crops with about 20 % of the water. Using the equations here, what is the main lever?',
      o: [['Opening stomata at night when VPD is low, so each mole of CO₂ costs far less water', 'Right. WUE scales as 1/VPD; night air in a desert is cooler and its VPD much lower than at noon.'],
        ['A different Rubisco that does not need CO₂', 'CAM uses the same Rubisco; it changes when CO₂ is taken up and stored.'],
        ['No stomata at all', 'CAM plants have stomata; they open them at night.']], a: 0 },
    { id: 'tr-q-santaana', t: 3, plate: 'tradeoff', b: 'ILLUSTRATIVE', src: [],
      q: 'On a Santa Ana day a chaparral shrub on dry soil shuts its stomata almost fully. What is the best supported trade in terms of this plate and The Water Path?',
      o: [['It gives up most carbon gain to protect leaf water potential and its xylem from embolism', 'Right. The carbon cost is visible here; the hydraulic benefit is on the Plant and Organ plates of The Water Path.'],
        ['It loses nothing, because CO₂ is still high outside', 'With the pore shut, outside CO₂ cannot get in.'],
        ['It gains water, because closed stomata pull water from the air', 'Closed stomata only slow loss; they do not take water in.']], a: 0 }
  ].forEach(function (it) { if (!LP.quiz.items.some(function (x) { return x.id === it.id; })) LP.quiz.items.push(it); });

  LP.showme = LP.showme || {};
  LP.showme.tradeoff = [
    { at: '#tr-live', fn: function () { LP.set({ stomata: 'ratio', T: 15, vpd: 0.15, Ca: 420, ppfd: 1500 }); }, say: 'Salinas morning fog: the pore is open, CO₂ comes in, and very little water leaves for each CO₂.', wait: 7000 },
    { at: '#tr-live', fn: function () { LP.set({ T: 21, vpd: 1.0 }); }, say: 'The same leaf on a July afternoon: same opening, several times the water per CO₂.', wait: 6500 },
    { at: '#tr-live', fn: function () { LP.set({ T: 33, vpd: 4.5 }); }, say: 'A Santa Ana day: dry air pulls water out many times faster.', wait: 6500 },
    { at: '#tr-live', fn: function () { LP.set({ stomata: 'fixed', gs: 0.05 }); }, say: 'Close the stomata: water saved, but carbon falls too. That is the trade.', wait: 7000 },
    { at: '#tr-live', fn: function () { LP.set({ stomata: 'ratio', T: 25, vpd: 1.5 }); }, say: 'Back to a mild day. Your turn: find the opening you would choose for a dry slope.', wait: 4500 }
  ];
  LP.panels.push({
    id: 'tradeoff', mount: mount, update: update,
    show: function () { if (A1) { A1.resize(); A1.kick(); } renderCharts(LP.result, true); },
    hide: function () {}
  });
})();

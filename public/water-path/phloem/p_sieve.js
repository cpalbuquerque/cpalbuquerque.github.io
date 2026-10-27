/* Sugar on the move: Plate II, The sieve tube (phloem builder A, 14 Oct 2026).
   Hero (3D, PP.macro): a sieve tube of six sieve elements joined by sieve plates, a companion cell beside each one with
   pore plasmodesma units, thin P-protein strands along the walls with the lumen open, and a xylem vessel behind. Sugar
   moves from the source end (leaf) to the sink end (root) at a pace set by the model speed U; water enters from the xylem at
   the source end and leaves at the sink end. The glass of each element is tinted by the local turgor (Münch: high at the
   source, low at the sink); the live line reads the Münch pressures. Callose closes the plates.
   2.1 Pressure pushes, plates resist: a 2D tube with the pressure profile and the same molecules (fallback and reduced motion).
   2.2 Check the model against plants: model next to measured values (Knoblauch 2016, Windt 2006, Liesche 2015, Jensen 2013).
   Engine: PP (engine.js). Sources only from night/sheets/phloem.json ('ph.*' keys). Drawn speeds ILLUSTRATIVE. */
(function () {
  'use strict';
  var PP = window.PP = window.PP || {};
  PP.panels = PP.panels || [];
  PP.evidence = PP.evidence || {};
  PP.howto = PP.howto || {};
  PP.showme = PP.showme || {};
  var ui = null, TAU = Math.PI * 2;
  function U() { return (ui = PP.ui); }
  function R() { return PP.result || {}; }
  function S() { return PP.state || {}; }
  function num(x, d) { return U().num(x, d); }
  function K() { return PP.kit; }

  var EV = PP.evidence;
  EV['pv.hp'] = { claim: 'Speed in one sieve tube, Hagen-Poiseuille in Darcy form: U = k ΔP / (η L). With k = 1 µm², a gradient of 0.21 MPa per metre and η = 1.7 mPa s this gives 124 µm s⁻¹, against 123 µm s⁻¹ measured in morning glory.', cite: 'Physics of laminar flow in a tube; check on the values of Knoblauch et al. (2016).', doi: '10.7554/eLife.15341', measured: 'calculation on measured inputs', value: '124 µm s⁻¹ (DERIVED) against 123 µm s⁻¹ (MEASURED)', badge: 'DERIVED', short: 'U = k ΔP / (η L)' };
  EV['pv.plates'] = { claim: 'In this model the sieve plates multiply the resistance of the open lumen by a plate factor, 2 by default, because plates and lumen contribute almost equally to sieve tube resistance across 19 species.', cite: 'Jensen et al. (2012) Front Plant Sci 3: 151 (model with anatomy).', doi: '10.3389/fpls.2012.00151', measured: 'model; 19 species', value: 'plate factor 2', badge: 'MODEL', short: 'Plate factor 2' };
  EV['pv.eta'] = { claim: 'Sap viscosity in this model: η = η_water(T) × (1.7 ÷ 0.89)^(c ÷ 18). It is anchored at pure water and at the 1.7 mPa s measured for sap of about 18 % sucrose; the curve between and beyond the anchors is a teaching shape.', cite: 'Anchors: Knoblauch et al. (2016) eLife (1.7 mPa s); water viscosity from a standard fit.', doi: '10.7554/eLife.15341', measured: 'anchors measured; shape chosen', value: '1.7 mPa s at 18 %, 25 °C', badge: 'ILLUSTRATIVE', short: 'Viscosity curve' };
  EV['pv.sink'] = { claim: 'Sink turgor is set to 0.59 MPa, measured in the root cortex of morning glory, and does not change with the other controls. Real sinks regulate it, and how is still argued.', cite: 'Knoblauch et al. (2016) eLife; open question on unloading (Dewar et al. 2022).', doi: '10.7554/eLife.15341', doi2: '10.1111/nph.17795', measured: 'Ipomoea nil root cortex', value: '0.59 MPa', badge: 'MEASURED', short: 'Sink 0.59 MPa' };
  EV['pv.callose'] = { claim: 'The callose switch multiplies the plate resistance 40 fold, enough to nearly stop flow, as when callose closes small sieve plate pores within minutes of injury.', cite: 'Mullendore et al. (2010) Plant Cell 22: 579 to 593 (callose after injury); the factor is a teaching value.', doi: '10.1105/tpc.109.070094', measured: 'factor chosen', value: '× 40', badge: 'ILLUSTRATIVE', short: 'Callose factor' };
  EV['pv.radius'] = { claim: 'An open tube with conductivity k has radius r = √(8 k): with the default lumen conductivity of 2 µm², r = 4 µm, a tube about 8 µm across.', cite: 'Hagen-Poiseuille: k = r² / 8 for a circular tube.', measured: 'calculation', value: 'r = √(8 k)', badge: 'DERIVED', short: 'Tube radius' };

  PP.howto['ph.picogauge'] = {
    title: 'turgor and speed in a living sieve tube', what: 'the direct Münch test: pressure at both ends, speed in between',
    steps: ['Find the transporting sieve tubes in an intact plant under the microscope, at the source (a leaf) and at the sink (the root).',
      'Insert a glass micro pressure gauge (a pico gauge) into a single sieve element, sealing as it enters; read the turgor at the source and again at the sink.',
      'Measure the speed of the sap: label CO₂ fed to a leaf with ¹¹C and time its arrival at detectors along the stem.',
      'Measure the viscosity of the sap in the tube and the anatomy of the tubes and sieve plates (electron microscopy) to compute the conductivity.',
      'Compare: is the measured pressure difference enough to drive the measured speed through the measured tubes?'],
    watch: 'Puncturing a sieve tube sets off sealing (callose, proteins) within seconds to minutes, so the reading must be quick and checked. Plant size matters: tall plants made higher source pressures and had wider plate pores.',
    dois: ['10.7554/eLife.15341']
  };
  PP.howto['ph.mri'] = {
    title: 'sap flow inside a stem, by MRI', what: 'xylem going up and phloem coming down, in one intact plant, day and night',
    steps: ['Place the stem of an intact potted plant inside the coil of an MRI magnet, with the plant still transpiring in light or dark.',
      'Use a flow sensitive MRI sequence: it maps how fast water moves in each pixel of the stem cross section, and in which direction.',
      'Pixels moving up are xylem; pixels moving down are phloem. Read the speed and the flow (speed × conducting area) for each.',
      'Repeat through the day and night: the phloem flow can then be compared with the xylem flow at the same moment.'],
    watch: 'Each pixel averages many cells, so the method gives a mean speed over the conducting area, not one sieve tube.',
    dois: ['10.1111/j.1365-3040.2006.01544.x']
  };
  PP.howto['ph.label'] = {
    title: 'how fast new sugar travels, with labelled carbon', what: '¹¹C or ¹³C pulse: the arrival time of a label front',
    steps: ['Give one leaf or branch a short pulse of labelled CO₂ (¹¹C, or ¹³C in large trees).',
      'With ¹¹C, follow the label with detectors placed along the stem; with ¹³C, sample the CO₂ breathed out by the trunk or roots below.',
      'Speed = distance between the labelled leaf and the sampling point ÷ the time the label takes to arrive.',
      'For trees, repeat in wet and dry seasons to see how drought changes it.'],
    watch: 'The first arrival is the fastest sugar, not the mean; residence time in the leaf adds to the delay. Tracer speeds and MRI speeds are not the same measurement.',
    dois: ['10.7554/eLife.15341', '10.1093/treephys/tpy122', '10.1093/treephys/tpv020']
  };

  /* ================================================================== 2.1 Pressure pushes, plates resist (2D) */
  var A2 = null, TH = { suc: [], wat: [], acc: 0, accW: 0 };
  function presColor(p, dark, a) {   // p in MPa, warm when high
    var f = Math.max(0, Math.min(1, p / 1.4));
    var r = Math.round(60 + 190 * f), g = Math.round(150 + 40 * (1 - Math.abs(f - 0.5) * 2)), b = Math.round(220 - 170 * f);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + (a == null ? 1 : a) + ')';
  }
  function draw2(c, w, h, t, dt, info) {
    if (!TH.warm && w > 0) { TH.warm = true; for (var wi = 0; wi < 120; wi++) draw2(c, w, h, t, 0.1, info); }
    var st = S(), r = R(), dark = info.dark, kit = K(), narrow = w < 600;
    c.clearRect(0, 0, w, h);
    var bg = c.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, dark ? '#0d1315' : '#f4f2e8'); bg.addColorStop(1, dark ? '#0a0f12' : '#e9e8da'); c.fillStyle = bg; c.fillRect(0, 0, w, h);
    var x0 = narrow ? 44 : 70, x1 = w - (narrow ? 44 : 70), tubeY = narrow ? 112 : 104, rad = narrow ? 22 : 28, xyY = tubeY + rad + (narrow ? 34 : 40);
    var fs = narrow ? 10 : 11.5, n = narrow ? 4 : 6, segW = (x1 - x0) / n;
    var Ps = r.Psrc || 0, Pk = r.Psink || 0, flowing = !r.stopped;
    /* xylem below */
    c.fillStyle = dark ? 'rgba(90,150,255,.18)' : 'rgba(90,150,255,.16)'; c.strokeStyle = dark ? '#6aa8ff' : '#3a78c8'; c.lineWidth = 1.5;
    c.beginPath(); c.rect(x0 - 20, xyY - 10, x1 - x0 + 40, 20); c.fill(); c.stroke();
    c.fillStyle = dark ? '#9cc8ff' : '#2a5c8f'; c.font = '600 ' + fs + 'px "IBM Plex Sans",system-ui,sans-serif'; c.textAlign = 'center';
    c.fillText('xylem vessel next door: water going up the plant', (x0 + x1) / 2, xyY + 4);
    /* the tube, sieve elements tinted by local pressure */
    for (var i = 0; i < n; i++) {
      var xa = x0 + i * segW, pmid = Ps + (Pk - Ps) * ((i + 0.5) / n);
      c.fillStyle = presColor(pmid, dark, dark ? 0.32 : 0.38); c.strokeStyle = dark ? '#e6c25a' : '#9a7410'; c.lineWidth = 2;
      c.beginPath(); if (c.roundRect) c.roundRect(xa + 2, tubeY - rad, segW - 4, rad * 2, 8); else c.rect(xa + 2, tubeY - rad, segW - 4, rad * 2); c.fill(); c.stroke();
      /* companion cell above */
      c.fillStyle = dark ? 'rgba(240,150,70,.35)' : 'rgba(240,150,70,.3)'; c.strokeStyle = dark ? '#e0a060' : '#b06a20'; c.lineWidth = 1.2;
      c.beginPath(); c.ellipse(xa + segW / 2, tubeY - rad - 11, segW * 0.36, 8, 0, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = dark ? '#ffcf9a' : '#8a4a10'; c.beginPath(); c.arc(xa + segW / 2 - segW * 0.18, tubeY - rad - 11, 3, 0, TAU); c.fill();
      c.strokeStyle = dark ? '#ffe7a0' : '#7a5b00'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(xa + segW / 2 + 6, tubeY - rad - 4); c.lineTo(xa + segW / 2 + 6, tubeY - rad + 2); c.stroke();
      if (i > 0) {  /* sieve plate */
        c.strokeStyle = st.callose ? (dark ? '#e8f6ff' : '#4a7a9a') : (dark ? '#f2d27a' : '#8a6a10'); c.lineWidth = st.callose ? 5 : 3;
        c.setLineDash(st.callose ? [] : [4, 3]); c.beginPath(); c.moveTo(xa, tubeY - rad + 3); c.lineTo(xa, tubeY + rad - 3); c.stroke(); c.setLineDash([]);
      }
    }
    c.fillStyle = dark ? '#e9e4d2' : '#25301f'; c.font = '700 ' + fs + 'px "IBM Plex Sans",system-ui,sans-serif';
    c.textAlign = 'center'; c.fillText(narrow ? 'Source' : 'Source: leaf', x0 - (narrow ? 22 : 36), tubeY - 4); c.fillText(narrow ? 'Sink' : 'Sink: root', x1 + (narrow ? 22 : 36), tubeY - 4);
    c.font = '500 ' + (fs - 0.5) + 'px "IBM Plex Mono",ui-monospace,monospace';
    c.fillText(num(Ps, 2), x0 - (narrow ? 22 : 36), tubeY + 12); c.fillText(num(Pk, 2), x1 + (narrow ? 22 : 36), tubeY + 12); c.fillText('MPa', x0 - (narrow ? 22 : 36), tubeY + 25); c.fillText('MPa', x1 + (narrow ? 22 : 36), tubeY + 25);
    c.textAlign = 'left'; c.font = '600 ' + fs + 'px "IBM Plex Sans",system-ui,sans-serif'; c.fillStyle = dark ? '#ffcf9a' : '#8a4a10';
    c.fillText(narrow ? 'companion cells' : 'companion cells, joined to each sieve element by pore plasmodesma units', x0, tubeY - rad - 26);
    /* pressure profile plot */
    var py0 = xyY + 32, py1 = h - (narrow ? 34 : 30), pmax = Math.max(1.4, Ps * 1.15, Pk * 1.15);
    var Y = function (p) { return py1 - (py1 - py0) * p / pmax; };
    c.strokeStyle = dark ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.25)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x0, py0); c.lineTo(x0, py1); c.lineTo(x1, py1); c.stroke();
    c.fillStyle = dark ? '#cfc8b4' : '#4a5340'; c.font = '500 ' + (fs - 1) + 'px "IBM Plex Sans",system-ui,sans-serif'; c.textAlign = 'right';
    [0, 0.5, 1].forEach(function (v) { if (v <= pmax) { c.fillText(num(v, 1), x0 - 5, Y(v) + 4); } });
    c.textAlign = 'left'; c.fillText(narrow ? 'turgor, MPa (model)' : 'turgor along the tube, MPa (model): the slope is what pushes', x0 + 6, py0 + 2);
    c.textAlign = 'right'; c.fillText(narrow ? 'distance ' + num(st.L, 1) + ' m' : 'distance along the path, ' + num(st.L, 1) + ' m in all', x1, py1 + 15);
    c.strokeStyle = flowing ? (dark ? '#ffb05a' : '#c0661a') : (dark ? '#aaa' : '#777'); c.lineWidth = 3;
    c.beginPath(); c.moveTo(x0, Y(Ps)); c.lineTo(x1, Y(Pk)); c.stroke();
    c.fillStyle = c.strokeStyle; c.beginPath(); c.arc(x0, Y(Ps), 4, 0, TAU); c.arc(x1, Y(Pk), 4, 0, TAU); c.fill();
    /* molecules: sugar rides the tube at a pace set by U (teaching scale); water enters at the source end, leaves at the sink end */
    var Un = Math.max(0, (r.U || 0) / 147), dens = Math.max(0.2, st.conc / 18);
    if (dt > 0) {
      TH.acc += dt * 2.2 * Math.min(3, Un) * dens;
      while (TH.acc >= 1 && TH.suc.length < 46) { TH.acc -= 1; TH.suc.push({ x: x0 + 4, y: tubeY + (Math.random() - 0.5) * rad * 1.3, sor: st.sugar === 'rosaceae' && Math.random() < st.sorb, k: Math.random() }); }
      if (TH.acc > 3) TH.acc = 0;
      TH.accW += dt * 1.0 * Math.min(3, Un);
      while (TH.accW >= 1 && TH.wat.length < 12) { TH.accW -= 1; TH.wat.push({ u: 0, inn: true, x: x0 + segW * (0.2 + Math.random() * 0.6) }); TH.wat.push({ u: 0, inn: false, x: x1 - segW * (0.2 + Math.random() * 0.6) }); }
    }
    var named = 0, quota = narrow ? 1 : 2;
    for (var m = TH.suc.length - 1; m >= 0; m--) {
      var o = TH.suc[m];
      if (o.x < x0 || o.x > x1) { TH.suc.splice(m, 1); continue; }
      if (dt > 0) o.x += dt * (12 + 70 * Math.min(2.5, Un)) * (Un > 0.002 ? 1 : 0);
      if (o.x > x1 - 4) { TH.suc.splice(m, 1); continue; }
      var rr = narrow ? 5.5 : 7;
      if (o.sor) kit.sorbitol(c, o.x, o.y, rr); else kit.sucrose(c, o.x, o.y, rr);
      if (window.MolNames && window.MolNames.get() && named < quota && o.k < 0.08) { named++; kit.pill(c, o.x, o.y + rr + 2, o.sor ? 'sorbitol' : 'sucrose', dark, narrow ? 9.5 : 10.5); }
    }
    for (var q = TH.wat.length - 1; q >= 0; q--) {
      var wq = TH.wat[q]; if (dt > 0) wq.u += dt * 0.6; if (wq.u >= 1) { TH.wat.splice(q, 1); continue; }
      var yy = wq.inn ? xyY - (xyY - tubeY) * wq.u : tubeY + (xyY - tubeY) * wq.u;
      kit.water(c, wq.x, yy, narrow ? 3 : 3.6);
    }
    c.textAlign = 'center'; c.font = '600 ' + (fs - 0.5) + 'px "IBM Plex Sans",system-ui,sans-serif'; c.fillStyle = dark ? '#9cc8ff' : '#2a5c8f';
    if (!narrow) { c.fillText('water in ↑', x0 + segW * 0.5, xyY - 16); c.fillText('↓ water out', x1 - segW * 0.5, xyY - 16); }
    if (!flowing) { c.fillStyle = dark ? 'rgba(14,20,16,.82)' : 'rgba(255,253,246,.92)'; c.fillRect(w / 2 - 150, tubeY - 14, 300, 28); c.fillStyle = dark ? '#ffd2a0' : '#8a3a00'; c.font = '700 ' + fs + 'px "IBM Plex Sans",system-ui,sans-serif'; c.fillText('No pressure difference: no flow', w / 2, tubeY + 4); }
  }
  function capText() {
    var st = S(), r = R();
    if (r.stopped) return 'The source is at ' + num(r.Psrc, 2) + ' MPa and the sink at ' + num(r.Psink, 2) + ' MPa: with no pressure difference, nothing pushes the sap. Load more sugar, wet the xylem, or lower the sink turgor.';
    return 'Turgor falls from ' + num(r.Psrc, 2) + ' MPa in the leaf to ' + num(r.Psink, 2) + ' MPa at the sink over ' + num(st.L, 1) + ' m, a gradient of ' + num(r.grad, 2) + ' MPa per metre. Through tubes with k = ' + num(r.kEff, 2) + ' µm² and sap of η = ' + num(r.eta, 2) + ' mPa s that drives ' + num(r.U, 0) + ' µm s⁻¹, about ' + num(r.Ucmh, 0) + ' cm per hour (model).';
  }
  function nowText() {
    var st = S(), r = R(), tier = U().tier();
    if (tier === 1) return r.stopped ? 'Nothing moves: the leaf end of the tube is not pushing harder than the root end.' : 'Sugar in the leaf draws water in from the xylem, so the leaf end of the tube is under higher pressure than the root end. The sap flows from high pressure to low, carrying the sugar with it, through sieve plates that slow it but do not stop it.';
    return (r.stopped ? 'Flow has stopped in the model: ' : 'Münch pressure flow: ') + 'source turgor ' + num(r.Psrc, 2) + ' MPa (Ψx ' + num(st.psiX, 2) + ' + Π ' + num(r.Pi, 2) + '), sink ' + num(r.Psink, 2) + ' MPa, ΔP ' + num(r.dP, 2) + ' MPa over ' + num(st.L, 1) + ' m. Plates multiply the lumen resistance by ' + num(r.fPlateEff, 1) + (st.callose ? ' (callose on)' : '') + '. Speed ' + num(r.U, 0) + ' µm s⁻¹; a sugar takes ' + (isFinite(r.transit) ? num(r.transit, 1) + ' h' : 'forever') + ' for the trip.';
  }

  /* ================================================================== hero: the sieve tube (Three.js r128 through PP.macro) */
  var H = { ctx: null }, NSE = 6, SEL = 2.5, X0 = -NSE * SEL / 2, RAD = 0.78;
  function seX(i) { return X0 + SEL * (i + 0.5); }
  function hBuild(ctx) {
    var T = ctx.THREE, MM = PP.macro, root = ctx.root, far = ctx.far, se = MM.superEllipsoid, Hs = H;
    Hs.T = T; Hs.rnd = (function (s) { return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; })(77);
    var r = Hs.rnd;
    /* sieve elements: glass cylinders, tinted each frame by the local turgor */
    var segG = new T.CylinderGeometry(RAD, RAD, SEL - 0.06, 28, 1, true); segG.rotateZ(Math.PI / 2);
    Hs.seM = []; Hs.seMesh = [];
    for (var i = 0; i < NSE; i++) {
      var m = MM.glass(T, 0xf2c84a, { opacity: 0.4, side: T.DoubleSide, emissive: 0x6a4a00, ei: 0.35 });
      var me = new T.Mesh(segG, m); me.position.set(seX(i), 0, 0); me.renderOrder = 3; root.add(me); Hs.seM.push(m); Hs.seMesh.push(me);
    }
    /* sieve plates with pores */
    var pc = document.createElement('canvas'); pc.width = pc.height = 128; var px = pc.getContext('2d');
    px.fillStyle = '#fff'; px.beginPath(); px.arc(64, 64, 63, 0, TAU); px.fill(); px.fillStyle = '#000';
    for (var py = 0; py < 6; py++) for (var pq = 0; pq < 6; pq++) { var cx = 14 + pq * 20 + (py % 2) * 10, cy = 14 + py * 20; if (Math.hypot(cx - 64, cy - 64) < 52) { px.beginPath(); px.arc(cx, cy, 6.5, 0, TAU); px.fill(); } }
    Hs.poreTex = new T.CanvasTexture(pc);
    Hs.plateM = MM.lin(new T.MeshStandardMaterial({ color: 0xf6dc8a, emissive: 0x7a5a10, emissiveIntensity: 0.45, alphaMap: Hs.poreTex, transparent: true, side: T.DoubleSide, roughness: 0.45, depthWrite: false }));
    var rimG = new T.TorusGeometry(RAD, 0.05, 6, 28), rimM = MM.lin(new T.MeshStandardMaterial({ color: 0xe8c060, roughness: 0.4 }));
    Hs.plates = [];
    for (var p = 1; p < NSE; p++) {
      var pl = new T.Mesh(new T.CircleGeometry(RAD * 0.98, 28), Hs.plateM); pl.rotation.y = Math.PI / 2; pl.position.set(X0 + SEL * p, 0, 0); pl.renderOrder = 4; root.add(pl); Hs.plates.push(pl);
      var rim = new T.Mesh(rimG, rimM); rim.rotation.y = Math.PI / 2; rim.position.copy(pl.position); root.add(rim);
    }
    /* companion cells, one beside each element, with a nucleus and pore plasmodesma units */
    var ccG = se(SEL * 0.38, 0.27, 0.27, 0.5, 16, 10), ccM = MM.glass(T, 0xf08a30, { opacity: 0.55, emissive: 0x5a2a00, ei: 0.35 }), nucG = new T.SphereGeometry(0.11, 10, 8), nucM = MM.lin(new T.MeshStandardMaterial({ color: 0x8a4a1a, emissive: 0x5a2a00, emissiveIntensity: 0.4 }));
    Hs.ppu = MM.halos(T, NSE * 2, 0xffe7a0, 0.5); root.add(Hs.ppu.obj);
    for (var c = 0; c < NSE; c++) {
      var cm = new T.Mesh(ccG, ccM); cm.position.set(seX(c) + 0.1, -RAD - 0.2, 0.38); cm.renderOrder = 2; root.add(cm);
      var nu = new T.Mesh(nucG, nucM); nu.position.set(seX(c) - 0.35, -RAD - 0.2, 0.5); root.add(nu);
      Hs.ppu.set(c * 2, seX(c) - 0.3, -RAD + 0.02, 0.22); Hs.ppu.set(c * 2 + 1, seX(c) + 0.45, -RAD + 0.02, 0.22);
    }
    Hs.ppu.commit();
    /* P-protein (SEOR) strands: thin parietal lines, the lumen left open (Froelich et al. 2011) */
    var lp = [];
    for (var s = 0; s < NSE; s++) for (var k = 0; k < 4; k++) {
      var a = k * TAU / 4 + 0.6, yy = Math.cos(a) * RAD * 0.9, zz = Math.sin(a) * RAD * 0.9, xa = seX(s) - SEL * 0.42, xb = seX(s) + SEL * 0.42;
      for (var q = 0; q < 6; q++) { var u0 = q / 6, u1 = (q + 1) / 6; lp.push(xa + (xb - xa) * u0, yy + 0.04 * Math.sin(q * 2.1 + k), zz, xa + (xb - xa) * u1, yy + 0.04 * Math.sin((q + 1) * 2.1 + k), zz); }
    }
    var lg = new T.BufferGeometry(); lg.setAttribute('position', new T.Float32BufferAttribute(lp, 3));
    Hs.ppM = new T.LineBasicMaterial({ color: 0xfff3c0, transparent: true, opacity: 0.35 }); root.add(new T.LineSegments(lg, Hs.ppM));
    /* xylem vessel behind, with pits */
    var xyG = new T.CylinderGeometry(0.72, 0.72, NSE * SEL + 2, 28, 1, true); xyG.rotateZ(Math.PI / 2);
    var xy = new T.Mesh(xyG, MM.glass(T, 0x5a9cff, { opacity: 0.32, side: T.DoubleSide })); xy.position.set(0, 0.35, -1.9); xy.renderOrder = 1; root.add(xy); Hs.xyM = xy.material; Hs.xyMesh = xy;
    var pits = []; for (var pi = 0; pi < 70; pi++) { var ang = r() * TAU; pits.push([-NSE * SEL / 2 - 0.8 + r() * (NSE * SEL + 1.6), 0.35 + Math.cos(ang) * 0.73, -1.9 + Math.sin(ang) * 0.73]); }
    root.add(MM.balls(T, pits, 0x9cc8ff, 0.12));
    /* FIX ROUND 1: secondary wall thickenings as rings just inside the vessel wall, so the vessel reads as a vessel */
    var xrG = new T.TorusGeometry(0.69, 0.028, 5, 28), xrM = MM.lin(new T.MeshStandardMaterial({ color: 0x9cc8ff, roughness: 0.45, transparent: true, opacity: 0.75 }));
    for (var xr = 0; xr < 16; xr++) { var rgx = new T.Mesh(xrG, xrM); rgx.rotation.y = Math.PI / 2; rgx.position.set(-NSE * SEL / 2 - 0.6 + xr * (NSE * SEL + 1.2) / 15, 0.35, -1.9); root.add(rgx); }
    /* the pit the Xylem next door view names: the one facing the viewer, a little right of the target */
    var pitNear = function (dx) { return pits.reduce(function (b, p) { var d = Math.hypot(p[0] - seX(1) - dx, p[1] - 0.6, p[2] + 1.2); return d < b.d ? { d: d, p: p } : b; }, { d: 9, p: [seX(1) + dx, 0.6, -1.2] }).p; };
    Hs.pitF = pitNear(0.8); Hs.pitN = pitNear(0.3); /* desktop, phone (narrower view) */
    /* ends: leaf cells at the source, root cortex at the sink (far layer, out of focus) */
    var lfG = se(0.9, 0.8, 0.9, 0.6, 10, 8), lfM = MM.glass(T, 0x5fbf5a, { opacity: 0.5 }), rtM = MM.glass(T, 0xe8dcc0, { opacity: 0.5 });
    for (var e = 0; e < 7; e++) {
      var l1 = new T.Mesh(lfG, lfM); l1.position.set(X0 - 1.6 - r() * 2.4, -1.4 + r() * 2.8, -1 + r() * 2); root.add(l1);
      var l2 = new T.Mesh(lfG, rtM); l2.position.set(-X0 + 1.6 + r() * 2.4, -1.4 + r() * 2.8, -1 + r() * 2); root.add(l2);
    }
    var fG = se(1.4, 1.2, 1.2, 0.6, 10, 8), fM = MM.glass(T, 0xbfa860, { opacity: 0.35 });
    for (var f = 0; f < 8; f++) { var fm = new T.Mesh(fG, fM); fm.position.set(-12 + r() * 24, -4 + r() * 8, -9 - r() * 5); far.add(fm); }
    /* molecules */
    var G = PP.kit.geos(T, MM), vmat = function () { return MM.lin(new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.3, emissive: 0x112211, emissiveIntensity: 0.25 })); };
    function im(geo, mat, n) { var x = new T.InstancedMesh(geo, mat, n); x.frustumCulled = false; x.renderOrder = 8; root.add(x); return x; }
    Hs.sucM = im(G.suc, vmat(), 70); Hs.sorM = im(G.sor, vmat(), 30); Hs.watM = im(G.wat, MM.lin(new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.3 })), 20);
    Hs.glow = MM.halos(T, 70, 0x7dff7a, 0.45); root.add(Hs.glow.obj);
    Hs.mol = []; Hs.wat = []; Hs.acc = 0; Hs.accW = 0; Hs.dummy = new T.Object3D();
    for (var w0 = 0; w0 < 40; w0++) Hs.mol.push(hNew(X0 + r() * NSE * SEL));
    Hs.hn = PP.heroNames(ctx);
    Hs.cols = { hi: new T.Color(0xff8a2a).convertSRGBToLinear(), lo: new T.Color(0x3aa8e0).convertSRGBToLinear(), tmp: new T.Color() };
    hTint(); hLabels();
    for (var pw = 0; pw < 60; pw++) hFrame(ctx, pw * 0.06, 0.06);
    hLive();
  }
  function hNew(x) {
    var r = H.rnd, st = S(), a = r() * TAU, rr = Math.sqrt(r()) * RAD * 0.7;
    return { x: x, y: Math.cos(a) * rr, z: Math.sin(a) * rr, sor: st.sugar === 'rosaceae' && r() < st.sorb, rx: r() * 6, ry: r() * 6, sp: 0.85 + r() * 0.3 };
  }
  function hTint() {
    var Hs = H, r = R(), st = S(); if (!Hs.T) return;
    var Ps = r.Psrc || 0, Pk = r.Psink || 0, pmax = Math.max(1.2, Ps);
    Hs.seM.forEach(function (m, i) {
      var p = Ps + (Pk - Ps) * (i / (NSE - 1)), f = Math.max(0, Math.min(1, p / pmax)); f = f * f * (3 - 2 * f);
      Hs.cols.tmp.copy(Hs.cols.lo).lerp(Hs.cols.hi, f); m.color.copy(Hs.cols.tmp); m.emissive.copy(Hs.cols.tmp).multiplyScalar(0.35);
      if (m.userData.shader) m.userData.shader.uniforms.rimColor.value.copy(Hs.cols.tmp);
    });
    Hs.plateM.color.set(st.callose ? 0xe8f6ff : 0xf6dc8a).convertSRGBToLinear(); Hs.plateM.emissive.set(st.callose ? 0x6a9ab8 : 0x7a5a10).convertSRGBToLinear();
    Hs.plateM.alphaMap = st.callose ? null : Hs.poreTex; Hs.plateM.opacity = st.callose ? 0.85 : 1; Hs.plateM.needsUpdate = true;
  }
  function hLabels() {
    var Hs = H, T = Hs.T, r = R(), st = S(); if (!T || !Hs.ctx) return;
    if (Hs.plI == null) { Hs.plI = 3; Hs.ccI = 2; }
    var V = function (x, y, z) { return new T.Vector3(x, y, z); };
    /* FIX ROUND 1: in the Xylem next door view, name the parts of that view first (tier 1, so the phone cap keeps them) */
    var L = Hs.fz === 'xy' ? [
      { id: 'f_pit', text: 'Pit: water crosses here', pos: (function (q) { return V(q[0], q[1], q[2]); })(Hs.ctx.narrow ? Hs.pitN : Hs.pitF), tier: 1 },
      { id: 'f_st', text: 'Sieve tube, beside it', pos: V(seX(1) + 0.45, RAD, 0), tier: 1 }] : [];
    if (Hs.xyM) Hs.xyM.opacity = Hs.fz === 'xy' ? 0.5 : 0.32;
    Hs.ctx.setLabels(L.concat([
      { id: 'src', text: 'Source (leaf): ' + num(r.Psrc, 2) + ' MPa', pos: V(X0 + 0.6, RAD + 0.25, 0), tier: 1 },
      { id: 'snk', text: 'Sink (root): ' + num(r.Psink, 2) + ' MPa', pos: V(-X0 - 0.6, RAD + 0.25, 0), tier: 1 },
      { id: 'pl', text: st.callose ? 'Sieve plate, closed by callose' : 'Sieve plate', pos: V(X0 + SEL * Hs.plI, RAD + 0.15, 0), tier: 1 },
      { id: 'cc', text: 'Companion cell', pos: V(seX(Hs.ccI) + 0.1, -RAD - 0.6, 0.35), tier: 1 },
      { id: 'se', text: 'Sieve element: no nucleus', pos: V(seX(4), -RAD - 0.08, 0.5), narrow: false },
      { id: 'xy', text: 'Xylem vessel', pos: V(seX(1), 1.1, -1.9), narrow: false }
    ]));
  }
  function hFrame(ctx, t, dt) {
    var Hs = H, T = Hs.T; if (!T) return;
    var st = S(), r = R(), rnd = Hs.rnd, i, Un = Math.max(0, (r.U || 0) / 147), dens = Math.max(0.2, st.conc / 18);
    var v = (r.U > 0 ? 0.25 + 1.5 * Math.min(2.5, Un) : 0);   // drawn speed, world units per second (ILLUSTRATIVE)
    if (dt > 0) {
      Hs.acc += dt * v * 4.5 * dens;
      while (Hs.acc >= 1) { Hs.acc -= 1; if (Hs.mol.length < 70) Hs.mol.push(hNew(X0 + 0.05)); }
      Hs.accW += dt * 1.1 * Math.min(3, Un);
      while (Hs.accW >= 1) { Hs.accW -= 1; if (Hs.wat.length < 18) { Hs.wat.push({ u: 0, inn: true, x: X0 + SEL * (0.2 + rnd() * 1.4), id: rnd() }); Hs.wat.push({ u: 0, inn: false, x: -X0 - SEL * (0.2 + rnd() * 1.4), id: rnd() }); } }
    }
    var plateX = []; for (i = 1; i < NSE; i++) plateX.push(X0 + SEL * i);
    for (i = Hs.mol.length - 1; i >= 0; i--) {
      var o = Hs.mol[i];
      if (dt > 0) {
        var near = 1; for (var k = 0; k < plateX.length; k++) { var dx = Math.abs(o.x - plateX[k]); if (dx < 0.25) near = 0.55 + 0.45 * dx / 0.25; }   // the plates slow the sap a little
        o.x += dt * v * o.sp * near; o.rx += dt * 0.7; o.ry += dt * 0.5;
      }
      if (o.x > -X0 - 0.05) Hs.mol.splice(i, 1);
    }
    for (i = Hs.wat.length - 1; i >= 0; i--) { var w = Hs.wat[i]; if (dt > 0) w.u += dt * 0.42; if (w.u >= 1) Hs.wat.splice(i, 1); }
    var D = Hs.dummy, nS = 0, nO = 0, nW = 0;
    Hs.mol.forEach(function (m, k2) {
      D.position.set(m.x, m.y, m.z); D.rotation.set(m.rx, m.ry, 0); D.scale.setScalar(0.17); D.updateMatrix();
      if (m.sor) { if (nO < 30) Hs.sorM.setMatrixAt(nO++, D.matrix); } else if (nS < 70) Hs.sucM.setMatrixAt(nS++, D.matrix);
      if (k2 < 70) Hs.glow.set(k2, m.x, m.y, m.z);
    });
    for (i = Hs.mol.length; i < 70; i++) Hs.glow.hide(i);
    Hs.glow.commit();
    var ease = function (u) { return u * u * (3 - 2 * u); };
    Hs.wat.forEach(function (w2) { var e = ease(w2.u), y = w2.inn ? 0.35 + (0 - 0.35) * e : 0 + 0.35 * e, z = w2.inn ? -1.9 + 1.9 * e : -1.9 * e; w2.p = [w2.x, y, z]; D.position.set(w2.x, y, z); D.rotation.set(0, t, 0); D.scale.setScalar(1.25); D.updateMatrix(); if (nW < 20) Hs.watM.setMatrixAt(nW++, D.matrix); });
    D.scale.setScalar(0); D.updateMatrix();
    for (i = nS; i < 70; i++) Hs.sucM.setMatrixAt(i, D.matrix);
    for (i = nO; i < 30; i++) Hs.sorM.setMatrixAt(i, D.matrix);
    for (i = nW; i < 20; i++) Hs.watM.setMatrixAt(i, D.matrix);
    [Hs.sucM, Hs.sorM, Hs.watM].forEach(function (x) { x.instanceMatrix.needsUpdate = true; });
    var hn = Hs.hn; hn.begin();
    for (i = Hs.mol.length - 1; i >= 0; i--) { var m3 = Hs.mol[i]; hn.add(m3.sor ? 'sor' : 'suc', m3, m3.sor ? 'sorbitol' : 'sucrose', m3.x, m3.y, m3.z, 0.12, { all: false }); }
    Hs.wat.forEach(function (w3) { if (w3.p && w3.u > 0.2 && w3.u < 0.8) hn.add('wat', w3, 'H₂O', w3.p[0], w3.p[1], w3.p[2], 0.14, { all: false, q: 1 }); });
    hn.end();
    if (dt > 0 && ((t * 3) | 0) !== Hs.lastLive) { Hs.lastLive = (t * 3) | 0; hLive();
      /* phones: the camera pans along the tube, so the plate and companion cell labels move to the ones in view */
      if (ctx.narrow && ctx.camera && ctx.camera.userData.look) { var lx = ctx.camera.userData.look.x, pI = Math.max(1, Math.min(NSE - 1, Math.round((lx - X0) / SEL))), cI = Math.max(0, Math.min(NSE - 1, Math.floor((lx - X0) / SEL)));
        if (pI !== Hs.plI || cI !== Hs.ccI) { Hs.plI = pI; Hs.ccI = cI; hLabels(); } }
    }
  }
  function hCamera(ctx, t) {
    var o = ctx.orbit, fz = o && o.engaged ? o.focusId || null : null;
    if (fz !== H.fz) { H.fz = fz; setTimeout(function () { hLabels(); if (ctx.invalidate) ctx.invalidate(); }, 0); }
    var cam = ctx.camera, asp = ctx.w / ctx.h, tv = Math.tan(cam.fov * Math.PI / 360);
    var halfW = ctx.narrow ? 3.8 : 8.2, halfH = ctx.narrow ? 3.4 : 3.0;
    var D = Math.max(halfW / (tv * asp), halfH / tv) + 1.5;
    var yaw = 0.18 * Math.sin(t * 0.06), pitch = 0.22 + 0.05 * Math.sin(t * 0.05 + 2);
    var tx = ctx.narrow ? 5.2 * Math.sin(t * 0.045) : 0, ty = -0.05;
    cam.position.set(tx + Math.sin(yaw) * Math.cos(pitch) * D, ty + Math.sin(pitch) * D, Math.cos(yaw) * Math.cos(pitch) * D);
    cam.lookAt(tx, ty, 0);
    ctx.scene.fog.near = D - 2; ctx.scene.fog.far = D + 14; ctx.farScene.fog.near = D; ctx.farScene.fog.far = D + 20;
  }
  function hLive() {
    if (!H.ctx || !H.ctx.setLive) return;
    var r = R();
    H.ctx.setLive(r.stopped ? 'Münch: source ' + num(r.Psrc, 2) + ' MPa, sink ' + num(r.Psink, 2) + ' MPa · no pressure difference, no flow · model'
      : 'Münch: turgor ' + num(r.Psrc, 2) + ' → ' + num(r.Psink, 2) + ' MPa · ' + num(r.grad, 2) + ' MPa m⁻¹ · ' + num(r.U, 0) + ' µm s⁻¹ · model');
  }
  function hInit(host) {
    if (!host || H.ctx || !PP.macro) return;
    H.ctx = PP.macro.hero(host, {
      id: 'pv-hero', seed: 61, fov: 30, exposure: 1.0,
      lift: function (ctx) { return ctx.narrow ? 64 : 46; },
      palette: { light: { top: '#2a2a16', mid: '#5a5630', bot: '#a39a62', bokeh: ['#fff1c0', '#d8c47a', '#f6e7b0', '#cfe6a0'], fog: 0x5a5630, fg: 'rgba(230,214,160,.5)' },
        dark: { top: '#06080a', mid: '#15160e', bot: '#24231a', bokeh: ['#6f5f2f', '#5b4f2c', '#7a6a2c', '#3c5a4a'], fog: 0x15160e, fg: 'rgba(130,110,60,.45)' } },
      label: 'Three dimensional view of one sieve tube running from a leaf on the left to a root on the right. It is made of six glassy sieve elements joined end to end by sieve plates full of pores. An orange companion cell with a nucleus lies along each element, joined to it by glowing pore plasmodesma units. Thin protein strands line the walls while the middle stays open. Green sucrose molecules, and violet sorbitol in the almond family, flow from left to right; the glass is warm orange where the pressure is high and turns cool toward the root. Behind runs a blue xylem vessel: water molecules move from it into the tube near the leaf and back out near the root.',
      question: 'What pushes sugar through a sieve tube?',
      answer: 'Water pressure. Near the leaf the sieve tube is full of sugar, so it pulls water in from the xylem next door and its turgor rises; near the root sugar is unloaded, water leaves, and the turgor is lower. Sap flows from high pressure to low and carries the sugar with it: <b>Münch pressure flow</b>. The sieve plates add resistance, about as much as the open tube, so they slow the flow without stopping it. Measured in morning glory: about 1.08 MPa at the source, 0.59 MPa at the sink, 123 µm s⁻¹. Change the sugar, the xylem or the path below and watch the pressure answer.',
      credit: { text: 'Knoblauch et al. · eLife 2016', doi: '10.7554/eLife.15341' },
      height: function (w) { return w < 600 ? 540 : Math.round(Math.min(640, Math.max(460, w * 0.56))); },
      fallbackNote: 'This 3D scene needs WebGL, which this browser does not offer. The drawing in 2.1 below shows the same tube, pressures and flow.',
      build: hBuild, frame: hFrame, camera: hCamera,
      focus: [
        { id: 'plate', label: 'Sieve plate', target: [X0 + SEL * 3, 0, 0], dist: 3.2, theta: 0.85, phi: 1.3 },
        { id: 'cc', label: 'Companion cell', target: [seX(2), -RAD - 0.2, 0.3], dist: 3.6, theta: 0.25, phi: 1.55 },
        { id: 'src', label: 'Source end', target: [X0 + 1.2, 0, 0], dist: 6.5, theta: -0.35, phi: 1.2 },
        { id: 'snk', label: 'Sink end', target: [-X0 - 1.2, 0, 0], dist: 6.5, theta: 0.35, phi: 1.2 },
        { id: 'xy', label: 'Xylem next door', tag: 'Xylem vessel', target: [seX(1), 0.2, -1.0], dist: 5.4, theta: 0.18, phi: 0.52 }
      ]
    });
    hLive();
    if (ui.railWatch && H.ctx.wrap) ui.railWatch(H.ctx.wrap);
    U().onPrefs(function () { if (H.ctx && H.ctx.retheme) H.ctx.retheme(); });
  }

  /* ================================================================== page */
  var CSS = '#lv-sieve .pv-ctrls{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:4px 18px;margin:12px 0 0;border-top:1px solid var(--rule2)}' +
    '#lv-sieve .pv-sw{display:flex;flex-wrap:wrap;gap:6px;align-items:center}' +
    '#lv-sieve .eq{font-family:var(--mono);font-size:13.5px;line-height:1.9;overflow-x:auto}' +
    '#lv-sieve .pv-cmp td.mono{white-space:nowrap}';
  function tile(id, k, unit, cls) { return '<div class="tile' + (cls ? ' ' + cls : '') + '" id="' + id + '"><div class="k">' + k + '</div><div class="v"><span class="n">0</span> <small>' + (unit || '') + '</small></div></div>'; }
  function setTile(id, v) { var e = document.querySelector('#' + id + ' .n'); if (e) e.textContent = v; }
  var SLD = [
    ['pv-psix', 'psiX', 'Xylem water potential at the leaf', -2.5, 0, 0.05, function (v) { return num(v, 2) + ' MPa'; }, 'drier xylem, less water for the sieve tube', ''],
    ['pv-conc', 'conc', 'Sugar in the sap', 2, 32, 0.5, function (v) { return num(v, 1) + ' %'; }, 'more sugar: more pressure, thicker sap', ''],
    ['pv-L', 'L', 'Path length', 0.2, 30, 0.1, function (v) { return num(v, 1) + ' m'; }, 'a vine, a shrub, a tall tree', ''],
    ['pv-fp', 'fPlate', 'Sieve plate factor', 1, 8, 0.1, function (v) { return num(v, 1) + ' ×'; }, '1 = plates add nothing; 2 = plates double the lumen resistance', 'tier-2'],
    ['pv-kl', 'kLumen', 'Open lumen conductivity, k', 0.2, 12, 0.1, function (v) { return num(v, 1) + ' µm²'; }, 'wider tubes conduct more (k = r² ÷ 8)', 'tier-3'],
    ['pv-ps', 'Psink', 'Turgor at the sink', 0, 1.2, 0.01, function (v) { return num(v, 2) + ' MPa'; }, 'measured 0.59 MPa in a morning glory root', 'tier-3'],
    ['pv-k', 'K', 'Extra potassium in the sap', 0, 0.5, 0.01, function (v) { return num(v, 2) + ' mol kg⁻¹'; }, 'an osmolyte that is not sugar (maize, Babst et al. 2022)', 'tier-3']
  ];
  function mount(el) {
    U();
    var E = ui.ev;
    el.innerHTML = '<style>' + CSS + '</style>' +
      '<div class="pv-hero" id="pv-hero"></div>' +
      ui.now('<b>What is happening:</b> <span id="pv-now"></span>', 'pv-nowp') +
      '<figure class="fig lx-fig" id="pv-live"><div class="fighead"><h3>2.1 Pressure pushes, plates resist</h3><p>One sieve tube from leaf to root. The colour of each sieve element is its turgor; the line below is the pressure along the path.</p></div>' +
      '<div class="lx-frame" id="pv-th"></div>' +
      '<div class="pv-ctrls">' + SLD.map(function (x) { return '<div class="ctl' + (x[8] ? ' ' + x[8] : '') + '"><label for="' + x[0] + '">' + x[2] + ' <output id="' + x[0] + '-o"></output></label><input type="range" id="' + x[0] + '" min="' + x[3] + '" max="' + x[4] + '" step="' + x[5] + '"><div class="hint">' + x[7] + '</div></div>'; }).join('') +
      '<div class="ctl tier-2"><span class="ctl-l">Wound the tube</span><div class="pv-sw"><button type="button" class="chip" id="pv-cal" aria-pressed="false">Callose closes the plates</button></div><div class="hint">what a sieve tube does within minutes of injury ' + E('ph.tube.geometry', 'Mullendore et al. 2010') + '</div></div>' +
      '<div class="ctl"><span class="ctl-l">Scene</span><div class="pv-sw"><button type="button" class="btn small" id="pv-pause" aria-pressed="false">Pause</button> <button type="button" class="btn small" id="pv-reset">Reset</button></div></div>' +
      '</div>' +
      '<figcaption class="cap" id="pv-cap"></figcaption>' +
      '<p class="cap lx-row">The model: P at the source = Ψx + Π; flow U = k ΔP ÷ (η L), with the plates as a resistance factor. Molecules move at teaching speeds that follow U. ' + E('ps.coupling') + ' ' + E('pv.hp') + ' ' + E('pv.plates') + ' ' + E('ps.drawn') + '</p>' +
      '<p><button type="button" class="btn small" data-pv="morning">A morning glory, as measured</button> <button type="button" class="btn small" data-pv="tall">A 17.5 m vine</button> <button type="button" class="btn small" data-pv="dry">Dry the xylem</button> <button type="button" class="btn small tier-2" data-pv="noplates">If plates added nothing</button> <button type="button" class="btn small tier-3" data-pv="maize">Little sugar, more potassium</button></p>' +
      '</figure>' +
      '<div class="tiles lx-tiles">' +
      tile('pv-t-psrc', 'Turgor at the source', 'MPa') + tile('pv-t-psink', 'Turgor at the sink', 'MPa') + tile('pv-t-grad', 'Pressure gradient', 'MPa m⁻¹') +
      tile('pv-t-u', 'Sap speed', 'µm s⁻¹') + tile('pv-t-ucm', 'Same speed', 'cm h⁻¹') + tile('pv-t-trip', 'Trip time', 'h') +
      tile('pv-t-pi', 'Osmotic pressure, Π', 'MPa', 'tier-2') + tile('pv-t-eta', 'Sap viscosity', 'mPa s', 'tier-2') + tile('pv-t-k', 'Tube conductivity with plates', 'µm²', 'tier-2') +
      tile('pv-t-need', 'Gradient needed for the measured speed', 'MPa m⁻¹', 'tier-3') + tile('pv-t-smt', 'Sugar carried per tube area', 'g cm⁻² h⁻¹', 'tier-3') + tile('pv-t-r', 'Lumen radius', 'µm', 'tier-3') +
      '</div>' +

      '<figure class="fig lx-fig tier-2" id="pv-check"><div class="fighead"><h3>2.2 Check the model against plants</h3><p>The model is only worth trusting where it meets measurements.</p></div>' +
      '<div class="lx-tw"><table class="lx-tab pv-cmp"><thead><tr><th>Quantity</th><th>This model now</th><th>Measured</th><th>Where</th></tr></thead><tbody id="pv-cmp"></tbody></table></div>' +
      '<p class="cap">Speeds differ between methods: MRI averages the flowing sap in a stem; a ¹¹C or ¹³C tracer front times the fastest new sugar; tree data pool many studies. Compare a model to the method that matches it. ' + E('ph.tube.velocity_trees', 'Liesche et al. 2015') + ' ' + E('ph.tube.velocity_MRI', 'Windt et al. 2006') + '</p>' +
      '</figure>' +

      '<section class="lx-cases" aria-label="Inside the tube"><h3 class="lx-h3">Inside the tube</h3><div class="lx-cardgrid">' +
      '<div class="card lx-case"><p class="lx-ck">A cell that gave up its nucleus</p><p>A mature sieve element has no nucleus, no machinery to make proteins and no Golgi, and keeps only a reduced endoplasmic reticulum. That leaves the lumen open for flow. ' + E('ph.tube.SE_structure', 'Liu et al. 2022') + '</p><p class="tier-2">Its companion cell keeps it alive. In tobacco their endoplasmic reticulum is continuous through pore plasmodesma units, the strongest coupling measured between any two cells, and companion cells line the whole path. ' + E('ph.tube.CC_link', 'Martens et al. 2006') + '</p></div>' +
      '<div class="card lx-case"><p class="lx-ck">Sieve plates slow the flow, they do not stop it</p><p>Across 19 species, plates and the open tube contribute about equally to the resistance. In morning glory vines 17.5 m long, sieve tube conductivity was 5 to 6 times higher than in small plants, mostly because the plate pores were wider, and source turgor reached more than 2.2 MPa in some vines. ' + E('ph.tube.plate_share', 'Jensen et al. 2012') + ' ' + E('ph.tube.munch_test', 'Knoblauch et al. 2016') + '</p><p class="tier-3">Historians of the theory warn that over simple readings of Münch have produced errors, one of which they call the “sieve plate fallacy”; read the paper for what they mean before you use the term. ' + E('ph.tube.sieve_plate_fallacy', 'Peters and Knoblauch 2022') + '</p><p><button type="button" class="btn small" data-pv="noplates">Take the plates out</button></p></div>' +
      '<div class="card lx-case"><p class="lx-ck">Question the picture</p><p>Old electron micrographs showed sieve tubes plugged with protein and with thick “nacreous” walls. Live imaging shows the SEOR protein meshwork lining the walls without markedly slowing flow, and the thick walls form within a minute when a tube is cut: they are artefacts. ' + E('ph.tube.SEOR', 'Froelich et al. 2011') + ' ' + E('ph.tube.nacreous', 'Knoblauch et al. 2020') + '</p></div>' +
      '<div class="card lx-case"><p class="lx-ck">Pressure needs osmolytes, not sugar as such</p><p>A maize mutant missing its sucrose transporter exported only about 4 % of the normal carbon, yet kept phloem pressure near normal by loading potassium, and its sap still moved at 50 to 75 % of the normal speed. ' + E('ph.recent.maize_K', 'Babst et al. 2022') + '</p><p class="tier-3"><button type="button" class="btn small" data-pv="maize">Try it: 6 % sugar plus potassium</button></p></div>' +
      '</div></section>' +

      '<section class="tier-3 lx-expert" aria-label="Expert"><h3 class="lx-h3">Equations, constants and what is still argued</h3>' +
      '<div class="card eq">Π = (m<sub>sugar</sub> + m<sub>K</sub>) R T<br>P<sub>source</sub> = Ψ<sub>x</sub> + Π    (Nikinmaa et al. 2013, MODEL) ' + E('ps.coupling') + '<br>' +
      'U = k<sub>eff</sub> (P<sub>source</sub> − P<sub>sink</sub>) / (η L) ' + E('pv.hp') + '<br>k<sub>eff</sub> = k<sub>lumen</sub> / f<sub>plate</sub> ' + E('pv.plates') + '<br>' +
      'k<sub>lumen</sub> = r² / 8 (open circular tube) ' + E('pv.radius') + '<br>η = η<sub>water</sub>(T) (1.7 / 0.89)<sup>c/18</sup> ' + E('pv.eta') + '<br>' +
      'U = 0 when P<sub>source</sub> ≤ P<sub>sink</sub> (no backflow in this model)</div>' +
      '<div class="lx-tw"><table class="lx-tab"><thead><tr><th>Constant</th><th>Value</th><th>Status and source</th></tr></thead><tbody id="pv-ktab"></tbody></table></div>' +
      '<div class="card lx-open"><p class="lx-ck">' + ui.badge('OPEN QUESTION') + ' Is there a best sugar concentration?</p><p>Thicker sap holds more sugar per litre but flows slower. A flow model predicts an optimum of 23.5 % when pressure does not depend on concentration; measured sap averaged 18.2 % over 41 species and 21.1 % in active loaders. On this page’s teaching viscosity curve the optimum at fixed pressure sits near 31 %, because the curve is gentler than real sucrose solutions. ' + E('ph.tube.sap_concentration', 'Jensen et al. 2013') + ' ' + E('pv.eta') + '</p></div>' +
      '<div class="card lx-open"><p class="lx-ck">' + ui.badge('OPEN QUESTION') + ' Has anyone reversed the flow across a sieve plate in a land plant?</p><p>A strict test of Münch flow is to push from the downstream end and watch the sap reverse. In bull kelp, pressurising the downstream element reversed flow across the plates; the authors state that no such evidence exists yet for land plants. ' + E('ph.tube.kelp_reversal', 'Knoblauch et al. 2016 Ann Bot') + '</p></div>' +
      '<div class="card lx-open"><p class="lx-ck">' + ui.badge('OPEN QUESTION') + ' What do P-proteins do in a living sieve tube?</p><p>There is no firm evidence that structural P-proteins stop translocation or defend against aphids in intact plants. ' + E('ph.tube.Pproteins_role', 'Knoblauch et al. 2014') + ' ' + E('ph.oq.Pprotein', 'Open question') + '</p></div>' +
      '<div class="card lx-open"><p>Does a sink need a high pressure manifold? That open question sits with the sinks: <a href="#sinks">Plate IV, Sinks</a>.</p></div>' +
      ui.design({ title: 'is the gradient enough in a tall plant?', question: 'In a plant several metres tall, is the measured turgor difference between source and sink enough to drive the measured speed through the measured tubes?',
        treat: 'Plants of one species grown to two path lengths (short and long), measured the same way.',
        measure: 'Turgor at source and sink with a pico gauge; speed with a ¹¹C pulse; sap viscosity; sieve tube and plate pore sizes by electron microscopy, to compute k.',
        howto: ['ph.picogauge', 'ph.label'], n: 'Plants are the replicates: several plants per length, several tubes per plant.',
        expect: 'If Münch holds: measured ΔP ÷ L ≈ U η ÷ k at both lengths ' + ui.badge('MODEL'),
        confound: 'Puncture triggers sealing; plant size changes the anatomy itself (wider plate pores in long plants), so measure k on the same plants.' }) +
      ui.howto('ph.picogauge') + ui.howto('ph.mri') + ui.howto('ph.label') +
      '<p class="hint">Methods links: no PrometheusWiki protocol page for phloem pressure, MRI flow or isotope labelling was confirmed in this session; the methods papers are cited instead.</p>' +
      '</section>' +

      '<section class="lx-qs" aria-label="Questions"><h3 class="lx-h3">Check yourself</h3>' +
      ui.reveal('Predict: you double the path length and change nothing else. What happens to the speed? Then drag the path slider from 2 to 4 m.',
        '<p>It halves. The pressure difference is the same, but it is spread over twice the length, so the gradient that pushes each metre of sap is half as steep. That is the problem a tall tree faces: either more pressure at the source, wider tubes, or slower sugar.</p>', { choices: [
          ['It halves', true, 'U = k ΔP ÷ (η L): L doubles, U halves.'],
          ['It stays the same', false, 'The same push now has to move sap through twice the tube.'],
          ['It drops to a quarter', false, 'Speed falls with L, not L squared, in this model.']] }) +
      '<div class="tier-2">' + ui.reveal('Count it: morning glory sieve tubes have k ≈ 1 µm² and sap of η = 1.7 mPa s; the measured gradient was 0.21 MPa per metre. What speed does Hagen-Poiseuille predict?',
        '<p>About 124 µm s⁻¹: 1 × 0.21 ÷ 1.7 × 1000. The measured speed was 123 µm s⁻¹, so the pressure gradient is enough to explain the flow. That match is the strongest direct support for the Münch model.</p>', { choices: [
          ['About 124 µm s⁻¹', true, 'k × gradient ÷ η, with the units worked out: µm s⁻¹ = µm² × MPa m⁻¹ ÷ mPa s × 1000.'],
          ['About 0.12 µm s⁻¹', false, 'Check the units: MPa is 10⁶ Pa and mPa s is 10⁻³ Pa s.'],
          ['About 1,240 µm s⁻¹', false, 'One factor of ten too many.']] }) + '</div>' +
      '</section>' +
      ui.quiz('sieve');
    A2 = ui.anim(el.querySelector('#pv-th'), { height: function (w) { return w < 600 ? 360 : 330; }, label: 'Drawing of one sieve tube from the leaf on the left to the root on the right, made of sieve elements tinted by their turgor and separated by sieve plates, with companion cells above and a xylem vessel below. Sugar molecules flow to the right, water enters from the xylem near the leaf and leaves near the root, and a line graph below shows turgor falling along the path.', draw: draw2 });
    var pb = el.querySelector('#pv-pause');
    pb.addEventListener('click', function () { var p = !A2.paused(); A2.pause(p); pb.setAttribute('aria-pressed', p ? 'true' : 'false'); pb.textContent = p ? 'Play' : 'Pause'; });
    if (window.PlaySpeed) pb.parentNode.insertBefore(window.PlaySpeed.chip('ps-light'), pb.nextSibling);
    el.querySelector('#pv-reset').addEventListener('click', function () { PP.reset(); });
    el.querySelector('#pv-cal').addEventListener('click', function () { PP.set({ callose: !S().callose }); });
    SLD.forEach(function (x) { var i = el.querySelector('#' + x[0]); i.addEventListener('input', function () { var o = {}; o[x[1]] = +i.value; PP.set(o); }); });
    el.addEventListener('click', function (e) {
      var b = e.target.closest('[data-pv]'); if (!b) return;
      var k = b.getAttribute('data-pv'), D = PP.defaults;
      if (k === 'morning') PP.set({ psiX: D.psiX, conc: 18, L: D.L, kLumen: 2, fPlate: 2, Psink: 0.59, K: 0, callose: false, sugar: 'sucrose' });
      else if (k === 'tall') PP.set({ L: 17.5, kLumen: 11, fPlate: 2, callose: false });
      else if (k === 'dry') PP.set({ psiX: -0.9 });
      else if (k === 'noplates') PP.set({ fPlate: 1, callose: false });
      else if (k === 'maize') PP.set({ conc: 6, K: 0.4, sugar: 'sucrose' });
      var f = document.getElementById('pv-live'); if (f && b.closest('.lx-case')) f.scrollIntoView({ behavior: ui.reducedMotion() ? 'auto' : 'smooth', block: 'start' });
    });
    var hostH = el.querySelector('#pv-hero');
    if ('IntersectionObserver' in window) { var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); hInit(hostH); } }, { rootMargin: '200px' }); io.observe(hostH); } else hInit(hostH);
  }
  function update(st, res) {
    if (!document.getElementById('pv-now')) return;
    U();
    document.getElementById('pv-now').textContent = nowText();
    var cap = document.getElementById('pv-cap'); if (cap) cap.textContent = capText();
    SLD.forEach(function (x) { var i = document.getElementById(x[0]); if (!i) return; if (document.activeElement !== i) i.value = st[x[1]]; var o = document.getElementById(x[0] + '-o'); if (o) o.textContent = x[6](st[x[1]]); });
    var cb = document.getElementById('pv-cal'); if (cb) cb.setAttribute('aria-pressed', st.callose ? 'true' : 'false');
    setTile('pv-t-psrc', num(res.Psrc, 2)); setTile('pv-t-psink', num(res.Psink, 2)); setTile('pv-t-grad', num(Math.max(0, res.grad), 2));
    setTile('pv-t-u', num(res.U, 0)); setTile('pv-t-ucm', num(res.Ucmh, 0)); setTile('pv-t-trip', isFinite(res.transit) ? num(res.transit, 1) : 'none');
    setTile('pv-t-pi', num(res.Pi, 2)); setTile('pv-t-eta', num(res.eta, 2)); setTile('pv-t-k', num(res.kEff, 2));
    setTile('pv-t-need', num(res.gradNeeded, 2)); setTile('pv-t-smt', num(res.smt, 1)); setTile('pv-t-r', num(res.rLumen, 1));
    var cm = document.getElementById('pv-cmp');
    if (cm) cm.innerHTML = [
      ['Turgor at the source', num(res.Psrc, 2) + ' MPa', '1.08 MPa', 'morning glory, pico gauge', 'ph.tube.munch_test'],
      ['Turgor at the sink', num(res.Psink, 2) + ' MPa', '0.59 MPa', 'morning glory root cortex', 'ph.tube.munch_test'],
      ['Gradient', num(Math.max(0, res.grad), 2) + ' MPa m⁻¹', '0.21 MPa m⁻¹ needed', 'morning glory', 'ph.tube.munch_test'],
      ['Sap speed', num(res.U, 0) + ' µm s⁻¹', '123 µm s⁻¹', 'morning glory, ¹¹C', 'ph.tube.munch_test'],
      ['Sap speed', num(res.Umm, 2) + ' mm s⁻¹', '0.25 to 0.40 mm s⁻¹', 'poplar, castor bean, tomato, tobacco, MRI', 'ph.tube.velocity_MRI'],
      ['Sap speed', num(res.Ucmh, 0) + ' cm h⁻¹', '56 (angiosperm) and 22 (gymnosperm) cm h⁻¹', 'trees, meta analysis', 'ph.tube.velocity_trees'],
      ['Sugar in the sap', num(st.conc, 1) + ' %', '18.2 % mean, 41 species', 'literature compilation', 'ph.tube.sap_concentration']
    ].map(function (x) { return '<tr><td>' + x[0] + '</td><td class="mono">' + x[1] + ' ' + ui.badge('MODEL') + '</td><td class="mono">' + x[2] + '</td><td>' + x[3] + ' ' + ui.ev(x[4]) + '</td></tr>'; }).join('');
    var kt = document.getElementById('pv-ktab');
    var KN = { kTube: 'Sieve tube conductivity, k', eta18: 'Sap viscosity at about 18 % sucrose', fPlate: 'Sieve plate factor', kLumen: 'Open lumen conductivity', Psink: 'Turgor at the sink', Psrc_meas: 'Turgor at the source, measured', U_meas: 'Sap speed, measured', grad_meas: 'Gradient needed for that speed', psiX: 'Xylem water potential, default', L: 'Path length, default', calloseF: 'Callose factor' };
    if (kt) kt.innerHTML = ['kTube', 'eta18', 'fPlate', 'kLumen', 'Psink', 'Psrc_meas', 'U_meas', 'grad_meas', 'psiX', 'L', 'calloseF'].map(function (k) {
      var p = PP.params[k]; return '<tr><td>' + KN[k] + '</td><td class="mono">' + (typeof p.v === 'number' ? num(p.v, p.v < 10 && p.v % 1 ? 2 : 0) : p.v) + ' ' + (p.units || '') + '</td><td>' + ui.badge(p.status) + ' ' + ui.esc(p.src) + '</td></tr>';
    }).join('');
    if (H.ctx) { hTint(); hLabels(); hLive(); H.ctx.invalidate(); }
    if (A2) A2.redraw();
  }

  PP.showme.sieve = [
    { at: '#pv-hero', say: 'One sieve tube from leaf to root. Warm glass is high pressure, cool glass is low; the sugar flows from warm to cool.', wait: 6500 },
    { at: '#pv-live', fn: function () { PP.set({ psiX: -0.9 }); }, say: 'Dry the xylem: the tube can pull less water in, the source pressure falls, the sugar slows.', wait: 7000 },
    { at: '#pv-live', fn: function () { PP.set({ psiX: -0.9, conc: 24 }); }, say: 'Load more sugar: more osmotic pressure wins the water back, and the flow returns.', wait: 7000 },
    { at: '#pv-live', fn: function () { PP.set({ psiX: -0.5, conc: 18, callose: true }); }, say: 'Wound the tube: callose closes the sieve plate pores and the flow nearly stops.', wait: 7000 },
    { at: '#pv-live', fn: function () { PP.set({ callose: false, L: 17.5, kLumen: 11 }); }, say: 'A 17.5 m vine: wider plate pores keep the sugar moving over a long path.', wait: 7000 },
    { at: '#pv-live', fn: function () { PP.reset(); }, say: 'Back to the measured morning glory. Your turn: find the shortest trip.', wait: 4500 }
  ];

  var Q = PP.quiz = PP.quiz || {}; Q.items = Q.items || [];
  [
    { id: 'sv-k-munch', t: 1, plate: 'sieve', b: 'MEASURED', src: ['10.7554/eLife.15341'], q: 'In the Münch model, what drives sap through the sieve tubes?',
      o: [['A difference in turgor between source and sink, made by loading and unloading osmolytes', 'Right. High pressure where sugar is loaded, lower where it is unloaded.'], ['Transpiration pulling the sap up, as in the xylem', 'The phloem is pushed, not pulled, and it often runs downward.'], ['Molecular motors in the sieve elements', 'Sieve elements have no such motors; flow is driven by pressure.']], a: 0 },
    { id: 'sv-k-nuc', t: 1, plate: 'sieve', b: 'MEASURED', src: ['10.1073/pnas.2112755119'], q: 'What does a mature sieve element lack?',
      o: [['A nucleus (and the machinery to make proteins, and Golgi)', 'Right. That keeps the lumen open; the companion cell supports it.'], ['A plasma membrane', 'It keeps its membrane; it must hold pressure and sugar.'], ['Cell walls', 'It has walls, and sieve plates between elements.']], a: 0 },
    { id: 'sv-k-cc', t: 1, plate: 'sieve', b: 'MEASURED', src: ['10.1104/pp.106.085803'], q: 'How is a companion cell connected to its sieve element?',
      o: [['By pore plasmodesma units, with their endoplasmic reticulum continuous between the two cells', 'Right. Measured in tobacco: the strongest coupling of any cell pair tested.'], ['Only through the cell wall space', 'They share a symplastic connection.'], ['They are not connected', 'They work as one complex.']], a: 0 },
    { id: 'sv-k-callose', t: 1, plate: 'sieve', b: 'MEASURED', src: ['10.1105/tpc.109.070094'], q: 'What can close small sieve plate pores within minutes after a sieve tube is injured?',
      o: [['Callose', 'Right. It is a wound response; it seals the damaged tube.'], ['Lignin', 'Lignin stiffens xylem walls; it is not the fast plug.'], ['Starch', 'Starch is a store, not a plug.']], a: 0 },
    { id: 'sv-k-mri', t: 1, plate: 'sieve', b: 'MEASURED', src: ['10.1111/j.1365-3040.2006.01544.x'], q: 'Flow MRI measured phloem sap speed in poplar, castor bean, tomato and tobacco. About how fast?',
      o: [['0.25 to 0.40 mm per second', 'Right. Day and night, across the four species.'], ['About 1 m per second', 'Far too fast for phloem.'], ['About 1 mm per day', 'Far too slow: that is about a million times slower.']], a: 0 },
    { id: 'sv-k-seor', t: 1, plate: 'sieve', b: 'MEASURED', src: ['10.1105/tpc.111.093179'], q: 'In living sieve tubes, the SEOR protein meshwork:',
      o: [['Lines the walls and does not markedly slow the flow', 'Right. Plugs seen in older micrographs were mostly preparation artefacts.'], ['Fills the lumen and stops flow', 'That is what fixed, damaged tubes looked like.'], ['Pumps sugar', 'It is a structural protein, not a pump.']], a: 0 },
    { id: 'sv-u-hp', t: 2, plate: 'sieve', b: 'DERIVED', src: ['10.7554/eLife.15341'], q: 'k = 1 µm², gradient 0.21 MPa m⁻¹, η = 1.7 mPa s. Speed by U = k × gradient ÷ η × 1000 (in µm s⁻¹)?',
      o: [['About 124 µm s⁻¹', 'Right. Measured: 123 µm s⁻¹. The pressure is enough.'], ['About 357 µm s⁻¹', 'That multiplies by η instead of dividing.'], ['About 0.21 µm s⁻¹', 'That leaves out the conductivity and the units.']], a: 0 },
    { id: 'sv-u-length', t: 2, plate: 'sieve', b: 'DERIVED', src: [], q: 'The same pressure difference must push sap over twice the distance. If nothing else changes, the speed:',
      o: [['Halves', 'Right. The gradient (ΔP ÷ L) halves, and speed follows the gradient.'], ['Doubles', 'More distance cannot speed it up.'], ['Is unchanged', 'Pressure difference is spread over more tube.']], a: 0 },
    { id: 'sv-u-plates', t: 2, plate: 'sieve', b: 'MODEL', src: ['10.3389/fpls.2012.00151'], q: 'Plates and the open tube each give about half of the resistance. If the plates added nothing, the speed at the same pressure would:',
      o: [['About double', 'Right. Half the resistance, twice the flow.'], ['Rise by 10 %', 'Plates are about half the resistance, not a tenth.'], ['Not change, plates do not resist', 'They do: about half of it.']], a: 0 },
    { id: 'sv-u-cmh', t: 2, plate: 'sieve', b: 'DERIVED', src: ['10.1093/treephys/tpv020'], q: 'Angiosperm trees move phloem sugar about 56 cm per hour on average. In µm per second that is about:',
      o: [['156 µm s⁻¹', 'Right. 560,000 µm ÷ 3,600 s.'], ['56 µm s⁻¹', 'That forgets to convert centimetres to micrometres and hours to seconds.'], ['15,600 µm s⁻¹', 'One hundred times too fast.']], a: 0 },
    { id: 'sv-u-beech', t: 2, plate: 'sieve', b: 'MEASURED', src: ['10.1093/treephys/tpy122'], q: 'In mature beech after three dry summers, phloem speed fell from 20.7 to 11.0 cm h⁻¹. By what share?',
      o: [['About 47 %', 'Right. (20.7 − 11.0) ÷ 20.7 = 0.47; it tracked predawn water potential.'], ['About 9.7 %', 'That is the difference in cm h⁻¹, not the share.'], ['About 88 %', 'It roughly halved, not stopped.']], a: 0 },
    { id: 'sv-u-range', t: 2, plate: 'sieve', b: 'DERIVED', src: ['10.7554/eLife.15341'], q: 'Morning glory: 0.49 MPa available between source and sink, and 0.21 MPa per metre needed for the measured speed. Over about how long a path could that pressure keep the measured speed?',
      o: [['About 2.3 m', 'Right. 0.49 ÷ 0.21. Longer plants made more pressure and had wider plate pores.'], ['About 0.1 m', 'That multiplies the two values.'], ['Any length', 'The gradient falls as the path grows.']], a: 0 },
    { id: 'sv-q-plates', t: 3, plate: 'sieve', b: 'MEASURED', src: ['10.7554/eLife.15341', '10.3389/fpls.2012.00151'], q: 'Someone argues: sieve plates are barriers, so pressure flow cannot work in tall plants. What do the measurements say?',
      o: [['Plates add about half the resistance but do not stop flow, and in 17.5 m vines the plate pores were wider, conductivity 5 to 6 times higher and source turgor more than 2.2 MPa in some vines', 'Right. Plants tune the path to its length.'], ['They are right, tall plants use another mechanism', 'The measured pressures and speeds fit pressure flow.'], ['Plates add no resistance at all', 'They add about half.']], a: 0 },
    { id: 'sv-q-nacre', t: 3, plate: 'sieve', b: 'MEASURED', src: ['10.1111/tpj.14665'], q: 'Thick “nacreous” walls appear in over 90 % of sieve elements in standard sections, but not in living, transporting tubes, and a puncture makes them in under a minute. What should you conclude?',
      o: [['They are preparation artefacts; images of cut tissue need checking against living tissue', 'Right. The method made the structure.'], ['They are a real feature that live imaging misses', 'Puncture creating them argues otherwise.'], ['Sieve tubes thicken their walls to resist pressure', 'Not supported by the live data.']], a: 0 },
    { id: 'sv-q-methods', t: 3, plate: 'sieve', b: 'MEASURED', src: ['10.1093/treephys/tpv020', '10.1111/j.1365-3040.2006.01544.x'], q: 'Trees average 56 cm h⁻¹ (about 0.16 mm s⁻¹); MRI in herbs and poplar gave 0.25 to 0.40 mm s⁻¹. Do trees move sugar more slowly than herbs?',
      o: [['Not from these numbers alone: tracer fronts and MRI measure different things, and the species differ', 'Right. Compare like with like before ranking.'], ['Yes, clearly', 'Different methods; the comparison is not clean.'], ['No, trees are faster', 'Nothing here shows that.']], a: 0 },
    { id: 'sv-q-kelp', t: 3, plate: 'sieve', b: 'OPEN QUESTION', src: ['10.1093/aob/mcw007'], q: 'A textbook says reversing the pressure reverses phloem flow, as Münch predicts. What is the evidence?',
      o: [['Shown in bull kelp; the authors state no such evidence exists yet for land plants', 'Right. A prediction that has been tested in kelp is still open for land plants.'], ['Shown in every plant tested', 'Only kelp, so far.'], ['Disproven', 'Kelp supports it; land plants are untested.']], a: 0 },
    { id: 'sv-q-cond', t: 3, plate: 'sieve', b: 'MEASURED', src: ['10.1105/tpc.109.070094'], q: 'Across five species, sieve tubes with higher conductivity did not carry faster sap (MRI). What does that tell you?',
      o: [['Speed depends on the pressure gradient as well; a plant with wider tubes may run a smaller gradient', 'Right. Conductivity alone does not predict speed.'], ['Hagen-Poiseuille is wrong', 'The equation needs the gradient too; the data do not contradict it.'], ['MRI cannot measure phloem', 'It can; the result is about the plants.']], a: 0 },
    { id: 'sv-q-opt', t: 3, plate: 'sieve', b: 'MODEL', src: ['10.1098/rsif.2013.0055'], q: 'A flow model predicts the best sap sugar is 23.5 %; measured sap averages 18.2 %, and 21.1 % in active loaders. Is phloem sap “optimal”?',
      o: [['Close to the model optimum, especially in active loaders, but a model that assumes pressure independent of concentration cannot prove it', 'Right. Agreement is support, not proof.'], ['Yes, exactly optimal', '18.2 is not 23.5.'], ['No, plants ignore viscosity', 'The closeness suggests viscosity matters.']], a: 0 }
  ].forEach(function (x) { if (!Q.items.some(function (y) { return y.id === x.id; })) Q.items.push(x); });

  PP.panels.push({
    id: 'sieve', mount: mount, update: update,
    show: function () { if (A2) { A2.resize(); A2.kick(); } if (H.ctx) { hLive(); H.ctx.invalidate(); } },
    hide: function () {}
  });
})();

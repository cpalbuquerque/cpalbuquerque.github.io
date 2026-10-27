/* The Water Path v8: n_membrane_nrt.js (nutrient path, Plate V): the transceptor NRT1.1 (CHL1).
   Loaded by n_membrane.js (WP.nutrient.load('membrane_nrt')). Defines WPNM.nrt(host, lib, wpState) -> {ws}.
   One carrier, two jobs: it carries nitrate in and it signals that nitrate is there. Threonine 101 (T101) is the switch:
   with a phosphate (put on by CIPK23 at low nitrate) it is a high affinity transporter and gives a low level primary
   nitrate response; without it, low affinity and a high level response (Ho, Lin, Hu & Tsay 2009, Cell 138: 1184).
   A mutant that cannot carry nitrate still signals. Controls: external nitrate on a log scale (1 µM to 50 mM), the plant
   (wild type or the transport dead mutant) and the T101 switch (set by the root, held on as T101D, held off as T101A).
   Every curve value is ILLUSTRATIVE: the switch point, both affinities and the signal levels are invented shapes. */
(function () {
  'use strict';
  var NM = window.WPNM = window.WPNM || {};

  var KH = 0.03, KL = 4, VH = 0.22, SWITCH = 0.5, LOWSIG = 0.35;   // ILLUSTRATIVE, mM and arbitrary units
  function conc(s) { return Math.pow(10, s.lc); }
  function phos(s) { if (s.sw === 'D') return 1; if (s.sw === 'A') return 0; var c = conc(s); return 1 / (1 + Math.pow(c / SWITCH, 2)); }
  function occ(s) { var c = conc(s), p = phos(s); return p * c / (KH + c) + (1 - p) * c / (KL + c); }
  function uptake(s) { if (s.plant === 'mut') return 0; var c = conc(s), p = phos(s); return p * VH * c / (KH + c) + (1 - p) * c / (KL + c); }
  function signal(s) { var c = conc(s), p = phos(s); return p * LOWSIG * c / (KH + c) + (1 - p) * c / (KL + c); }
  function fmtC(lc) {
    var c = Math.pow(10, lc);
    if (c < 0.00995) return (c * 1000).toPrecision(2).replace(/\.0$/, '') + ' µM';
    if (c < 1) return String(+c.toPrecision(2)) + ' mM';
    return (c < 10 ? c.toFixed(1) : String(Math.round(c))) + ' mM';
  }

  NM.nrt = function (host, L, wpState) {
    var WS = window.WS;
    var DOI = function (d) { return '<a href="https://doi.org/' + d + '" target="_blank" rel="noopener">doi ' + d + '</a>'; };
    var why =
      '<div class="nm-why">' +
      '<p><b>A transceptor</b> is a transporter that is also a receptor: a carrier that also senses. <b>NRT1.1</b>, first named <b>CHL1</b>, is the best known case for nitrate in plants.</p>' +
      '<p><b>The switch.</b> Earlier work showed that CHL1 with a phosphate on threonine 101 (<b>T101</b>) is a high affinity nitrate transporter, and without it a low affinity transporter. <b>High affinity</b> means it can grab nitrate when there is very little; <b>low affinity</b> means it needs a lot, but then carries a lot. Ho, Lin, Hu &amp; Tsay (2009, Cell 138: 1184, ' + DOI('10.1016/j.cell.2009.07.004') + ') then showed that at low nitrate the kinase <b>CIPK23</b> can put the phosphate on T101, which keeps the first, fast gene response to nitrate (the <b>primary nitrate response</b>) at a low level. Plants with T101D, which mimics the phosphate, gave a low level response; plants with T101A, which cannot take the phosphate, gave a high level response.</p>' +
      '<p><b>The key result.</b> In the same paper a mutant in which uptake and sensing are decoupled showed that CHL1 itself is a nitrate sensor: carrying nitrate and sensing nitrate are separate jobs of one protein. In the words of the abstract, CHL1 uses dual affinity binding and a phosphorylation switch to sense a wide range of nitrate concentrations in the soil. The mutation that separates the two jobs is reported as <b>P492L</b> (proline 492 changed to leucine) in a later paper, Ho &amp; Frommer (2014, eLife 3: e01917, ' + DOI('10.7554/eLife.01917') + ') ' + WS.badge('SECONDARY', 'P492L is not named in the 2009 abstract, and the 2009 full text was not checked for this page.') + '.</p>' +
      '<p><b>Two phases of uptake.</b> The idea that roots take up an ion by two mechanisms, one working at low and one at high concentration, goes back to work on potassium in barley roots (Epstein, Rains &amp; Elzam 1963, PNAS 49: 684, ' + DOI('10.1073/pnas.49.5.684') + '). The concentration ranges in that paper were not checked for this page, so none are shown. CHL1 covers both phases in one protein, by its switch.</p>' +
      '<p><b>Expert depth.</b> The plot and the meters are ' + WS.badge('ILLUSTRATIVE', 'Invented shapes.') + ': the switch point (0.5 mM), the two affinities (0.03 mM and 4 mM), the high affinity capacity and the signal levels are chosen to show the shapes, not measured. In the model the mutant keeps the same switch as the wild type; the papers above do not say this. The 3D carrier is schematic: two halves that rock to open to one side, then the other, not a traced structure.</p>' +
      '</div>';

    var ws = WS.create(host, {
      title: 'The transceptor: a carrier that measures',
      badge: 'ILLUSTRATIVE',
      what: 'One nitrate carrier, NRT1.1 (also called CHL1), in the membrane of a root cell. It carries nitrate in, and it also tells the cell how much nitrate is outside.',
      todo: 'Slide the <b>nitrate outside</b> from a trace to a lot. Watch the phosphate on <b>T101</b> come and go. Then pick the <b>mutant that cannot carry</b> and see what still works.',
      thing: 'A model membrane drawn for this page. The gold carrier is NRT1.1; the small clusters of one blue and three red beads are nitrate ions (NO₃⁻). The orange bead under it is the phosphate on T101; the purple cluster is the kinase CIPK23. Amber rings spreading into the cytosol are the signal.',
      scanCaption: '<b>One root cell.</b> A model drawing, not an image: nitrate outside on top, nitrate carried inside, and the nucleus glowing with the signal. The two bars compare carrying and sensing. ' + WS.badge('ILLUSTRATIVE', 'Counts and bar heights are invented, in percent of the model maximum.'),
      plotCaption: '<b>Carrying and sensing against nitrate outside</b>, on a log scale (each step is ten times more). ' + WS.badge('ILLUSTRATIVE', 'Shapes only. Direction from Ho et al. 2009: phosphorylated CHL1 is high affinity with a low level response; dephosphorylated is low affinity with a high level response.'),
      why: why,
      state: { lc: -1, plant: 'wt', sw: 'auto' },
      camera: { dist: 10, theta: 0.28, phi: 1.42, target: [0, 0.4, 0], minDist: 3.5, maxDist: 19 }
    });
    var S = ws.state;
    var hd = ws.el.querySelector('.ws-hd');
    var quote = document.createElement('p'); quote.className = 'nm-quote'; quote.textContent = 'The root does not just absorb. It measures.';
    hd.appendChild(quote);

    ws.range({ key: 'lc', label: 'Nitrate outside', min: -3, max: Math.log10(50), step: 0.05, fmt: fmtC, hint: 'log scale: from a trace (1 µM) to a lot (50 mM)' });
    ws.choice({ key: 'plant', label: 'Plant', options: [['wt', 'Wild type'], ['mut', 'Mutant that cannot carry']] });
    ws.choice({ key: 'sw', label: 'T101 switch', options: [['auto', 'Set by the root'], ['D', 'Held on (T101D)'], ['A', 'Held off (T101A)']] });

    /* ---- 3D */
    var g = ws.gl;
    if (g) (function () {
      var T = g.THREE, root = g.root, V = function (x, y, z) { return new T.Vector3(x, y, z); }, rr = L.rng(9);
      var XA = -3.2, XN = 0.8;
      root.add(L.bilayer(T, { d: 2.4, zc: -0.9, holes: [{ x: XA, r: 0.66 }, { x: XN, r: 0.82 }], seed: 8 }));
      var aqp = L.aquaporin(T); aqp.position.x = XA; root.add(aqp);
      var cytoM = new T.MeshBasicMaterial({ color: 0x9fc58a, transparent: true, opacity: 0.07, depthWrite: false, side: T.BackSide });
      var cyto = new T.Mesh(new T.BoxGeometry(9.2, 1.9, 3.4), cytoM); cyto.position.y = -0.75 - 0.95; cyto.renderOrder = -1; root.add(cyto);

      /* the carrier: two halves on pivots */
      var pivL = new T.Group(), pivR = new T.Group(); pivL.position.set(XN - 0.3, 0, 0); pivR.position.set(XN + 0.3, 0, 0); root.add(pivL); root.add(pivR);
      var lobeL = L.carrier(T, { r: 0.36, h: 1.8, color: 0xd2ae68 }), lobeR = L.carrier(T, { r: 0.36, h: 1.8, color: 0xd2ae68 });
      pivL.add(lobeL); pivR.add(lobeR);
      var t101 = new T.Mesh(new T.SphereGeometry(0.09, 12, 9), new T.MeshStandardMaterial({ color: 0xf2efe6, roughness: 0.4 }));
      t101.position.set(-0.1, -0.95, 0.28); pivL.add(t101);
      var phM = new T.MeshPhysicalMaterial({ color: 0xf0a020, roughness: 0.25, clearcoat: 1, emissive: 0x6a3a00, emissiveIntensity: 0.6 });
      var pho = new T.Mesh(new T.SphereGeometry(0.15, 16, 12), phM); pho.position.set(-0.2, -1.13, 0.38); pivL.add(pho);
      var kin = new T.Group(); var kM = new T.MeshStandardMaterial({ color: 0x8a5fc0, roughness: 0.45 });
      [[0, 0, 0, 0.26], [0.26, 0.1, 0.05, 0.2], [0.1, -0.2, 0.12, 0.18]].forEach(function (b) { var m = new T.Mesh(new T.SphereGeometry(b[3], 14, 10), kM); m.position.set(b[0], b[1], b[2]); kin.add(m); });
      kin.position.set(XN - 0.95, -1.4, 0.45); root.add(kin);

      /* tags */
      function tag(text, x, y, z, o) { var t = L.tag(T, text, o); t.position.set(x, y, z || 0); root.add(t); return t; }
      var tSoil = tag('outside: nitrate 0.1 mM', -1.6, 3.5, -1.4);
      tag('cytosol, inside the cell', -2.7, -2.35, 0.6);
      tag('aquaporin (water)', XA, -1.5, 0.4);
      tag('NRT1.1 (CHL1)', XN + 1.45, -1.3, 0.3);
      var tT = tag('T101 phosphorylated', XN + 0.5, -1.95, 0.45);
      var tK = tag('CIPK23 kinase', XN - 1.75, -1.55, 0.5);
      var tSig = tag('signal: nitrate is here', XN + 0.2, -2.75, 0.2, { edge: 'warm' });

      /* nitrate ions: N in the middle, three O around it, flat */
      var nG = new T.SphereGeometry(0.075, 10, 8), oG = new T.SphereGeometry(0.066, 10, 8);
      var nM = new T.MeshStandardMaterial({ color: 0x3a6fd8, roughness: 0.35 }), oM = new T.MeshStandardMaterial({ color: 0xd8452e, roughness: 0.35 });
      var ions = [];
      for (var i = 0; i < 28; i++) {
        var m = new T.Group(); m.add(new T.Mesh(nG, nM));
        for (var k = 0; k < 3; k++) { var o = new T.Mesh(oG, oM); o.position.set(Math.cos(k * 2.094) * 0.12, 0, Math.sin(k * 2.094) * 0.12); m.add(o); }
        m.rotation.set(rr() * 3, rr() * 3, 0);
        root.add(m);
        ions.push({ m: m, busy: false, v: V(0, 0, 0) });
      }
      function home(ion) { ion.m.position.set(-4 + rr() * 8, 1.0 + rr() * 2.1, -1.4 + rr() * 2.8); ion.m.scale.setScalar(1); }
      ions.forEach(home);

      /* signal rings */
      var rings = [];
      for (i = 0; i < 6; i++) {
        var rm = new T.MeshBasicMaterial({ color: 0xf0a020, transparent: true, opacity: 0, depthWrite: false });
        var ring = new T.Mesh(new T.TorusGeometry(1, 0.035, 8, 48), rm); ring.rotation.x = Math.PI / 2; ring.position.set(XN, -1.2, 0); ring.visible = false; root.add(ring);
        rings.push({ m: ring, mat: rm, t: -1, max: 1 });
      }
      function pulse(lev) { for (var j = 0; j < rings.length; j++) if (rings[j].t < 0) { rings[j].t = 0; rings[j].max = 0.6 + 1.9 * lev; rings[j].m.visible = true; return; } }

      var movers = [], rock = 1, rockT = 1, nActive = 0;
      function freeIon() { var c = ions.filter(function (x, j) { return j < nActive && !x.busy; }); return c.length ? c[Math.floor(rr() * c.length)] : null; }
      function carry() {
        var ion = freeIon(); if (!ion) return; ion.busy = true;
        var mv = new L.Mover(ion.m, [
          { to: V(XN, 1.1, 0), d: 1.2 },
          { to: V(XN, -1.0, 0), d: 1.0, lin: true, each: function () { rockT = -1; } },
          { to: V(XN + (rr() - 0.5) * 2.4, -2.0, (rr() - 0.5) * 1.6), d: 1.0, fn: function () { rockT = 1; } },
          { d: 0.8, each: function (o, u) { o.scale.setScalar(1 - u); }, fn: function () { home(ion); ion.busy = false; } }
        ]);
        movers.push(mv);
      }
      function bounce(lev) {
        var ion = freeIon(); if (!ion) { pulse(lev); return; } ion.busy = true;
        var back = V(-4 + rr() * 8, 1.2 + rr() * 1.8, -1.6 + rr() * 3.2);
        movers.push(new L.Mover(ion.m, [
          { to: V(XN, 1.0, 0), d: 1.2 },
          { d: 0.6, fn: function () { pulse(lev); } },
          { to: back, d: 1.4, fn: function () { ion.busy = false; } }
        ]));
      }
      var tC = 0, tP = 0, simT = 0;
      function sim(dt) {
        var s = ws.state, o = occ(s), lev = o > 0 ? signal(s) / o : 0, u = uptake(s);
        simT += dt; aqp.userData.water(simT);
        ions.forEach(function (ion, j) {
          ion.m.visible = j < nActive || ion.busy;
          if (ion.busy || j >= nActive) return;
          ion.v.x += (rr() - 0.5) * dt * 1.2; ion.v.y += (rr() - 0.5) * dt * 1.2; ion.v.z += (rr() - 0.5) * dt * 1.2; ion.v.multiplyScalar(0.96);
          var p = ion.m.position; p.addScaledVector(ion.v, dt);
          if (p.x < -4.3 || p.x > 4.3) ion.v.x *= -1; if (p.y < 0.95 || p.y > 3.2) ion.v.y *= -1; if (p.z < -1.5 || p.z > 1.5) ion.v.z *= -1;
          p.x = L.clamp(p.x, -4.3, 4.3); p.y = L.clamp(p.y, 0.95, 3.2); p.z = L.clamp(p.z, -1.5, 1.5);
          ion.m.rotation.y += dt * 0.8;
        });
        if (s.plant === 'wt') {
          tC += dt; var ic = 1 / (0.12 + 2.3 * u); while (tC > ic) { tC -= ic; carry(); }
          tP += dt; var ip = 1 / (0.2 + 1.5 * o); while (tP > ip) { tP -= ip; pulse(lev); }
        } else {
          tP += dt; var ib = 1 / (0.2 + 1.5 * o); while (tP > ib) { tP -= ib; bounce(lev); }
        }
        movers = movers.filter(function (mv) { return !mv.step(dt); });
        rings.forEach(function (r) {
          if (r.t < 0) return;
          r.t += dt; var f = r.t / 1.6;
          if (f >= 1) { r.t = -1; r.m.visible = false; return; }
          r.m.scale.setScalar(0.3 + (r.max - 0.3) * f); r.mat.opacity = 0.9 * (1 - f);
        });
        rock += (rockT - rock) * Math.min(1, dt * 5);
        pivL.rotation.z = 0.13 * rock; pivR.rotation.z = -0.13 * rock;
      }
      ws.onFrame(function (t, dt) { sim(dt); });
      ws.onTheme(function (dark) { L.theme(root, dark); cytoM.opacity = dark ? 0.1 : 0.07; });
      ws.on(function (s) {
        nActive = Math.round(3 + 25 * (s.lc + 3) / (Math.log10(50) + 3));
        var p = phos(s);
        pho.visible = p > 0.08; pho.scale.setScalar(Math.max(0.3, p));
        kin.visible = s.sw === 'auto' && p > 0.5; tK.visible = kin.visible;
        tT.userData.redraw(s.sw === 'D' ? 'T101D: phosphate mimic' : s.sw === 'A' ? 'T101A: no phosphate' : (p > 0.5 ? 'T101 phosphorylated' : 'T101, no phosphate'));
        tSoil.userData.redraw('outside: nitrate ' + fmtC(s.lc));
        tSig.userData.redraw(s.plant === 'mut' ? 'signal: still sent' : 'signal: nitrate is here');
        for (var k2 = 0; k2 < 20; k2++) sim(0.1);
      });
    })();

    /* ---- the readout */
    ws.on(function (s) {
      var c = fmtC(s.lc), p = phos(s), hi = p > 0.5, u = uptake(s), sg = signal(s), msg;
      var mode = hi ? '<b>high affinity</b> mode: it can grab nitrate even when there is very little' : '<b>low affinity</b> mode: it needs a lot of nitrate, but then carries a lot';
      if (s.sw === 'auto') msg = 'At <b>' + c + '</b> nitrate, ' + (hi ? 'the kinase CIPK23 puts a phosphate on T101, so the carrier is in ' : 'T101 has no phosphate, so the carrier is in ') + mode + '.';
      else msg = 'T101 is ' + (s.sw === 'D' ? 'held as if phosphorylated (T101D), so the carrier stays in ' : 'held without a phosphate (T101A), so the carrier stays in ') + mode + ', whatever the nitrate (' + c + ').';
      if (s.plant === 'mut') msg += ' This <b>mutant carries no nitrate</b>, yet the signal is still sent (' + Math.round(100 * sg) + ' % in the model): the root still knows nitrate is there.';
      else msg += ' Carried in: <b>' + Math.round(100 * u) + ' %</b>, signal: <b>' + Math.round(100 * sg) + ' %</b> ' + (sg > 0.5 ? '(a strong response)' : '(a weak response)') + ', in percent of the model maximum.';
      ws.say(msg);
    });

    /* ---- the scan: one root cell */
    var pts = (function () { var r = L.rng(31), a = []; for (var i = 0; i < 80; i++) a.push([r(), r()]); return a; })();
    ws.paintScan(function (c, w, h, s) {
      var u = uptake(s), sg = signal(s), p = phos(s), dark = WS.isDark();
      var mw = 112, cx0 = 8, cx1 = w - mw - 8, cy0 = 42, cy1 = h - 24;
      c.fillStyle = WS.token('card2'); c.fillRect(0, 0, w, h);
      c.fillStyle = WS.token('ink2'); c.font = '11px ' + WS.token('ui'); c.fillText('model rendering, not an image', 6, 12);
      /* nitrate outside, in a band above the cell */
      var nOut = Math.round(3 + 25 * (s.lc + 3) / (Math.log10(50) + 3)), i, q;
      function no3(x, y, r) { c.beginPath(); c.moveTo(x, y - r); c.lineTo(x + r * 0.87, y + r * 0.5); c.lineTo(x - r * 0.87, y + r * 0.5); c.closePath(); c.fillStyle = '#d8452e'; c.fill(); c.beginPath(); c.arc(x, y, r * 0.42, 0, 6.283); c.fillStyle = '#3a6fd8'; c.fill(); }
      for (i = 0; i < nOut; i++) { q = pts[i]; no3(cx0 + 6 + q[0] * (cx1 - cx0 - 12), 22 + q[1] * 14, 4.5); }
      /* the cell */
      L.rrect(c, cx0, cy0, cx1 - cx0, cy1 - cy0, 12); c.fillStyle = WS.token('cyto'); c.fill(); c.lineWidth = 3; c.strokeStyle = WS.token('leaf3'); c.stroke();
      [0.25, 0.5, 0.75].forEach(function (f) { var x = cx0 + f * (cx1 - cx0); L.rrect(c, x - 7, cy0 - 6, 14, 12, 3); c.fillStyle = '#d2ae68'; c.fill(); c.lineWidth = 1; c.strokeStyle = WS.token('ink'); c.stroke(); if (p > 0.08) { c.beginPath(); c.arc(x - 5, cy0 + 9, 3.2 * Math.max(0.5, p), 0, 6.283); c.fillStyle = '#f0a020'; c.fill(); } });
      /* nucleus with the signal glow */
      var nx = cx0 + (cx1 - cx0) * 0.68, ny = (cy0 + cy1) / 2 - 4, nr = Math.min(cx1 - cx0, cy1 - cy0) * 0.16;
      var gl = c.createRadialGradient(nx, ny, nr * 0.8, nx, ny, nr * (1.2 + 1.6 * sg));
      gl.addColorStop(0, 'rgba(240,160,32,' + (0.25 + 0.6 * sg).toFixed(2) + ')'); gl.addColorStop(1, 'rgba(240,160,32,0)');
      c.fillStyle = gl; c.beginPath(); c.arc(nx, ny, nr * (1.2 + 1.6 * sg), 0, 6.283); c.fill();
      c.beginPath(); c.arc(nx, ny, nr, 0, 6.283); c.fillStyle = dark ? '#3a3226' : '#efe4c8'; c.fill(); c.lineWidth = 1.5; c.strokeStyle = WS.token('ink'); c.stroke();
      c.fillStyle = WS.token('ink'); c.font = '11px ' + WS.token('ui'); c.textAlign = 'center'; c.fillText('nucleus', nx, ny + nr + 13); c.textAlign = 'left';
      /* nitrate carried inside, kept off the nucleus */
      var nIn = Math.round(24 * u), placed = 0;
      for (i = 0; placed < nIn && i < 80; i++) { q = pts[(i + 37) % 80]; var x = cx0 + 12 + q[0] * (cx1 - cx0 - 24), y = cy0 + 14 + q[1] * (cy1 - cy0 - 28); if (Math.hypot(x - nx, y - ny) < nr + 20) continue; no3(x, y, 4); placed++; }
      /* meters */
      var bx = w - mw + 6, bw = 26, by0 = cy0 + 12, by1 = cy1 - 16;
      [['carried', u, '#3a6fd8'], ['sensed', sg, '#f0a020']].forEach(function (m, k) {
        var x = bx + k * 52, hh = (by1 - by0) * m[1];
        c.fillStyle = WS.token('wall'); c.fillRect(x, by0, bw, by1 - by0);
        c.fillStyle = m[2]; c.fillRect(x, by1 - hh, bw, hh);
        c.lineWidth = 1; c.strokeStyle = WS.token('ink'); c.strokeRect(x, by0, bw, by1 - by0);
        c.fillStyle = WS.token('ink'); c.font = '600 12px ' + WS.token('ui'); c.textAlign = 'center';
        c.fillText(Math.round(100 * m[1]) + ' %', x + bw / 2, by0 - 4);
        c.font = '11px ' + WS.token('ui'); c.fillText(m[0], x + bw / 2, by1 + 13); c.textAlign = 'left';
      });
      c.fillStyle = WS.token('ink'); c.font = '600 12px ' + WS.token('ui');
      var st = (s.sw === 'D' ? 'T101D' : s.sw === 'A' ? 'T101A' : (p > 0.5 ? 'T101 phosphorylated' : 'T101 no phosphate')) + ' · ' + (p > 0.5 ? 'high' : 'low') + ' affinity' + (s.plant === 'mut' ? ' · mutant' : '');
      c.fillText(st, 6, h - 7);
    });

    /* ---- the plot */
    ws.paintPlot(function (svg, s) {
      var x0 = -3, x1 = Math.log10(50);
      var ax = WS.axes(svg, { w: 360, h: 214, pad: { l: 46, r: 12, t: 36, b: 38 }, x: [x0, x1], y: [0, 1], yticks: [0, 0.5, 1], xticks: [], xlabel: 'nitrate outside (log scale)', ylabel: 'model units' });
      var axg = svg.querySelector('.ws-ax');
      [[-3, '1 µM'], [-2, '10 µM'], [-1, '0.1 mM'], [0, '1 mM'], [1, '10 mM']].forEach(function (t) {
        WS.svg('line', { x1: ax.x(t[0]), x2: ax.x(t[0]), y1: ax.box.y0, y2: ax.box.y0 + 4, 'class': 'ws-tick' }, axg);
        WS.svg('text', { x: ax.x(t[0]), y: ax.box.y0 + 16, 'text-anchor': t[0] === -3 ? 'start' : 'middle' }, axg).textContent = t[1];
      });
      var U = [], G = [], W = [], k, st = {};
      for (k in s) st[k] = s[k];
      for (var i = 0; i <= 94; i++) {
        st.lc = x0 + (x1 - x0) * i / 94;
        U.push([st.lc, Math.max(0.006, uptake(st))]); G.push([st.lc, signal(st)]);
        if (s.plant === 'mut') { st.plant = 'wt'; W.push([st.lc, uptake(st)]); st.plant = 'mut'; }
      }
      if (W.length) ax.path(W, 'nm-l0');
      ax.path(G, 'nm-l2');
      ax.path(U, 'nm-l1');
      var ytop = ax.y(0.86);
      if (s.sw === 'auto') {
        var xs = Math.log10(SWITCH);
        WS.svg('line', { x1: ax.x(xs), x2: ax.x(xs), y1: ax.box.y0, y2: ytop, 'class': 'nm-l0' }, ax.g);
        ax.text(x0 + 0.08, 0.93, 'high affinity', 'start', 'ws-lab' + (phos(s) > 0.5 ? '' : ' nm-dim'));
        ax.text(xs + 0.12, 0.93, 'low affinity', 'start', 'ws-lab' + (phos(s) > 0.5 ? ' nm-dim' : ''));
      } else ax.text(x0 + 0.08, 0.93, s.sw === 'D' ? 'held in high affinity (T101D)' : 'held in low affinity (T101A)', 'start');
      WS.svg('line', { x1: ax.x(s.lc), x2: ax.x(s.lc), y1: ax.box.y0, y2: ytop, 'class': 'ws-cursor', 'aria-hidden': 'true' }, ax.g);
      ax.dot(s.lc, Math.max(0.006, uptake(s)));
      var d2 = ax.dot(s.lc, signal(s)); d2.setAttribute('r', 3.5);
      var lg = WS.svg('g', { 'class': 'nm-legend' }, svg);
      WS.svg('path', { d: 'M50 12h22', 'class': 'nm-l1' }, lg);
      WS.svg('text', { x: 76, y: 16, 'class': 'nm-leg' }, lg).textContent = s.plant === 'mut' ? 'carried in: none (mutant)' : 'nitrate carried in';
      WS.svg('path', { d: 'M236 12h22', 'class': 'nm-l2' }, lg);
      WS.svg('text', { x: 262, y: 16, 'class': 'nm-leg' }, lg).textContent = 'signal sent';
      if (s.plant === 'mut') { WS.svg('path', { d: 'M50 28h22', 'class': 'nm-l0' }, lg); WS.svg('text', { x: 76, y: 32, 'class': 'nm-leg' }, lg).textContent = 'wild type carried, for comparison'; }
      else WS.svg('text', { x: 50, y: 32, 'class': 'nm-leg' }, lg).textContent = 'cursor: your nitrate, ' + fmtC(s.lc);
    });

    /* ---- the flat drawing when WebGL is missing */
    ws.fallback(function (c, w, h, s) {
      var my = h * 0.5, p = phos(s), sg = signal(s), cx = w * 0.55, i;
      c.fillStyle = WS.token('w4'); c.fillRect(0, my - 13, w, 26);
      c.fillStyle = WS.token('ink'); c.font = '12px ' + WS.token('ui');
      c.fillText('outside: nitrate ' + fmtC(s.lc), 8, 18); c.fillText('cytosol, inside the cell', 8, h - 72);
      var r = L.rng(4), n = Math.round(3 + 25 * (s.lc + 3) / (Math.log10(50) + 3));
      for (i = 0; i < n; i++) { var x = 10 + r() * (w - 20), y = 30 + r() * (my - 60); c.beginPath(); c.arc(x, y, 4, 0, 6.283); c.fillStyle = '#3a6fd8'; c.fill(); }
      L.rrect(c, cx - 30, my - 34, 26, 68, 10); c.fillStyle = '#d2ae68'; c.fill(); c.strokeStyle = WS.token('ink'); c.lineWidth = 1; c.stroke();
      L.rrect(c, cx + 4, my - 34, 26, 68, 10); c.fill(); c.stroke();
      if (p > 0.08) { c.beginPath(); c.arc(cx - 20, my + 40, 6, 0, 6.283); c.fillStyle = '#f0a020'; c.fill(); c.stroke(); c.fillStyle = WS.token('ink'); c.fillText('phosphate on T101', cx - 130, my + 44); }
      c.strokeStyle = '#f0a020'; c.lineWidth = 2;
      for (i = 1; i <= 1 + Math.round(3 * sg); i++) { c.beginPath(); c.ellipse(cx, my + 50, 18 * i, 6 * i, 0, 0, Math.PI); c.stroke(); }
      c.fillStyle = WS.token('ink'); c.fillText('NRT1.1 (CHL1)', cx + 40, my - 20);
      c.fillText(s.plant === 'mut' ? 'mutant: carries none, signal still sent' : 'signal', cx + 40, my + 64);
    });

    return { ws: ws };
  };
})();

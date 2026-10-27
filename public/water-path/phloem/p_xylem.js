/* Sugar on the move: Plate III, Xylem meets phloem (phloem builder B, 14 Oct 2026).
   The heart of the module: the phloem borrows its water from the xylem next door, so the turgor that drives sugar
   is tied to the xylem water potential (P_source = Ψx + Π, Nikinmaa et al. 2013, MODEL; inner bark osmolality tracks
   xylem Ψ, Paljakka et al. 2017, MEASURED). Drier xylem, less push; more sugar wins the water back but thickens the sap.
   Hero (3D, PP.macro + orbit): a vascular bundle standing upright, xylem vessels on one side, sieve tubes with companion
   cells and sieve plates on the other, cambium between, rays across. Water rises in the xylem, sugar falls in the phloem,
   water crosses into the phloem near the leaf and back to the xylem near the root (Münch counterflow, Windt et al. 2006).
   The same bundle is reused by Plate V (PP.bundle3d), with its own captions.
   3.1 Two pipes, one water supply (2D theatre + turgor and speed against Ψx; also the no WebGL view).
   3.2 How much sugar is best? (speed against sugar at three xylem water potentials, MODEL).
   3.3 How much xylem water rides the phloem (measured night ratios, Windt et al. 2006).
   Sources only from night/sheets/phloem.json ('ph.*' keys) or labelled MODEL, DERIVED, ILLUSTRATIVE. */
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
  function clamp(x, a, b) { return x < a ? a : (x > b ? b : x); }

  var EV = PP.evidence;
  EV['px.stop'] = { claim: 'In this model the source turgor is Ψx + Π, so the push from source to sink vanishes when the xylem water potential reaches P_sink − Π. With 18 % sucrose (Π about 1.59 MPa) and a sink at 0.59 MPa that happens at about −1.00 MPa.', cite: 'Algebra of the coupling rule (Nikinmaa et al. 2013, model) with the measured sink turgor (Knoblauch et al. 2016).', doi: '10.1111/pce.12004', doi2: '10.7554/eLife.15341', measured: 'calculation on the model', value: 'Ψx stop = P_sink − Π', badge: 'DERIVED', short: 'Where flow stops' };
  EV['px.opt'] = { claim: 'At a fixed xylem water potential, more sugar raises the osmotic pressure and the push, and it also thickens the sap. In this model the push wins over the whole range of 2 to 32 %, so speed keeps rising, but each extra percent buys less than it would if the sap stayed as thin as water. Nikinmaa and colleagues argue that excessive loading raises viscosity enough to block transport; this page’s teaching viscosity curve is gentler than concentrated sucrose, so the model does not reach that point below 32 %.', cite: 'This page’s model (van ’t Hoff, Hagen-Poiseuille, teaching viscosity curve); Nikinmaa et al. (2013) Plant Cell Environ 36: 655 to 669.', doi: '10.1111/pce.12004', measured: 'model', value: '', badge: 'MODEL', short: 'More sugar (model)' };
  EV['px.need'] = { claim: 'The least sugar that gives any flow is the concentration at which Π equals P_sink − Ψx; the sugar that restores a given source turgor P is the concentration at which Π = P − Ψx. Both are solved on this page’s engine.', cite: 'Algebra of the coupling rule (Nikinmaa et al. 2013, model).', doi: '10.1111/pce.12004', measured: 'calculation on the model', value: '', badge: 'DERIVED', short: 'Sugar needed' };
  EV['px.day'] = { claim: 'The day buttons set the leaf xylem water potential to teaching values: night −0.20 MPa, morning −0.50 MPa, midday −0.80 MPa, midday in a drought −1.40 MPa. They show the direction of the daily swing, not a measured course for any species.', cite: 'Teaching values of this page.', measured: 'none', value: '−0.20, −0.50, −0.80, −1.40 MPa', badge: 'ILLUSTRATIVE', short: 'Day presets' };
  EV['px.xspeed'] = { claim: 'The water rising in the xylem of the 3D scene and the drawing moves at a fixed teaching pace: this module models the phloem only, not transpiration.', cite: 'Drawing convention of this page.', measured: 'none', value: '', badge: 'ILLUSTRATIVE', short: 'Xylem pace' };

  PP.howto['ph.dendro'] = {
    title: 'phloem turgor from the outside of a tree', what: 'paired dendrometers on bark and wood',
    steps: ['Fix two point dendrometers at the same height on the trunk: one touches the outer bark, the other is anchored in the wood under a small window cut through the bark.',
      'The wood sensor follows the xylem, which shrinks a little as tension rises in the day; the bark sensor follows the xylem plus the living inner bark.',
      'Subtract the two: what is left is the swelling and shrinking of the inner bark, which follows its turgor.',
      'Log every few minutes through days of sun, rain and drought, with xylem water potential and photosynthesis measured alongside.'],
    watch: 'Temperature changes the sensors and the radial water exchange itself (it followed water viscosity); the bark signal also includes storage, so pair it with a model.',
    dois: ['10.1111/nph.12224', '10.1093/jxb/erq018']
  };
  PP.howto['ph.barkosm'] = {
    title: 'osmolality of the inner bark and the xylem water potential', what: 'does the phloem side follow the xylem side?',
    steps: ['On the same branch or stem, measure the xylem water potential (a pressure chamber on a twig or a leaf that has stopped transpiring, or a psychrometer).',
      'Take a small sample of the living inner bark (the phloem), freeze it, thaw it and press out the sap.',
      'Read the sap osmolality with an osmometer and convert to osmotic pressure.',
      'Repeat through the day and the season and plot inner bark osmotic pressure against xylem water potential.'],
    watch: 'Inner bark sap mixes sieve tube sap with the sap of other living cells; gravity matters in tall stems.',
    dois: ['10.1111/pce.13017']
  };

  /* ================================================================== the bundle, a 3D hero factory (also used by Plate V) */
  var BY = 6, SE = 2;                         // half height of the bundle, sieve element length
  var VES = [{ x: -1.55, z: 0, r: 0.56 }, { x: -2.65, z: -0.55, r: 0.46 }, { x: -2.35, z: 0.85, r: 0.38 }];
  var TUB = [{ x: 0.45, z: 0, r: 0.44, off: 0 }, { x: 1.55, z: -0.5, r: 0.38, off: 1 }];
  var CAMB = -0.6, RAYZ = 1.3, RAYS = [2.7, -0.3, -3.3];
  function waterCol(T, psi) {   // deep blue near 0 MPa, paler as the xylem dries
    var f = clamp(-psi / 2.5, 0, 1); return new T.Color(0x2f6fe0).lerp(new T.Color(0xc9d8e6), f).convertSRGBToLinear();
  }
  PP.bundle3d = function (host, O) {
    var B = { ctx: null, O: O };
    function build(ctx) {
      var T = ctx.THREE, MM = PP.macro, root = ctx.root, far = ctx.far, se = MM.superEllipsoid;
      B.T = T;
      B.rnd = (function (s) { return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; })(O.seed || 91);
      var r = B.rnd;
      /* xylem vessels: blue glass with annular thickenings and pits */
      B.vM = [];
      VES.forEach(function (v, i) {
        var m = MM.glass(T, 0x3a7ae8, { opacity: 0.34, side: T.DoubleSide, emissive: 0x0a2a6a, ei: 0.3 });
        var g = new T.CylinderGeometry(v.r, v.r, BY * 2, 26, 1, true);
        var me = new T.Mesh(g, m); me.position.set(v.x, 0, v.z); me.renderOrder = 2; root.add(me); B.vM.push(m);
        var cap = new T.Mesh(new T.RingGeometry(v.r * 0.82, v.r, 26), MM.lin(new T.MeshStandardMaterial({ color: 0x9cc8ff, roughness: 0.5, side: T.DoubleSide })));
        cap.rotation.x = -Math.PI / 2; cap.position.set(v.x, BY + 0.01, v.z); root.add(cap);
        var rm = MM.lin(new T.MeshStandardMaterial({ color: 0x8ab8f0, roughness: 0.45, transparent: true, opacity: 0.55 }));
        /* annular thickenings sit on the inner face of the wall: outer edge just inside the vessel radius */
        var rg = new T.TorusGeometry(v.r - 0.05, 0.045, 6, 28); rg.rotateX(Math.PI / 2);
        for (var k = 0; k < 13; k++) { var ring = new T.Mesh(rg, rm); ring.position.set(v.x, -BY + 0.5 + k * (BY * 2 - 1) / 12, v.z); ring.renderOrder = 1; root.add(ring); }
      });
      var pits = []; for (var p = 0; p < 90; p++) { var vv = VES[p % 3], a = r() * TAU; pits.push([vv.x + Math.cos(a) * vv.r * 1.01, -BY + 0.3 + r() * (BY * 2 - 0.6), vv.z + Math.sin(a) * vv.r * 1.01]); }
      root.add(MM.balls(T, pits, 0x9cc8ff, 0.09));
      /* cambium: a thin green sheet between xylem and phloem */
      var cm = new T.Mesh(new T.BoxGeometry(0.1, BY * 2, 2.8), MM.glass(T, 0x6ad06a, { opacity: 0.28, emissive: 0x1a5a1a, ei: 0.35 }));
      cm.position.set(CAMB, 0, 0); cm.renderOrder = 1; root.add(cm);
      /* sieve tubes: sieve elements tinted each frame by local turgor, sieve plates with pores, companion cells */
      var pc = document.createElement('canvas'); pc.width = pc.height = 128; var px = pc.getContext('2d');
      px.fillStyle = '#fff'; px.beginPath(); px.arc(64, 64, 63, 0, TAU); px.fill(); px.fillStyle = '#000';
      for (var py = 0; py < 6; py++) for (var pq = 0; pq < 6; pq++) { var cx = 14 + pq * 20 + (py % 2) * 10, cy = 14 + py * 20; if (Math.hypot(cx - 64, cy - 64) < 52) { px.beginPath(); px.arc(cx, cy, 6.5, 0, TAU); px.fill(); } }
      B.poreTex = new T.CanvasTexture(pc);
      B.plateM = MM.lin(new T.MeshStandardMaterial({ color: 0xf6dc8a, emissive: 0x7a5a10, emissiveIntensity: 0.45, alphaMap: B.poreTex, transparent: true, side: T.DoubleSide, roughness: 0.45, depthWrite: false }));
      var rimM = MM.lin(new T.MeshStandardMaterial({ color: 0xe8c060, roughness: 0.4 }));
      var ccM = MM.glass(T, 0xf08a30, { opacity: 0.5, emissive: 0x5a2a00, ei: 0.35 }), nucM = MM.lin(new T.MeshStandardMaterial({ color: 0x8a4a1a, emissive: 0x5a2a00, emissiveIntensity: 0.4 })), nucG = new T.SphereGeometry(0.09, 10, 8);
      B.seM = [];
      TUB.forEach(function (tb) {
        var segG = new T.CylinderGeometry(tb.r, tb.r, SE - 0.05, 22, 1, true), rimG = new T.TorusGeometry(tb.r, 0.04, 5, 22), ccG = se(0.2, SE * 0.4, 0.2, 0.5, 12, 10);
        rimG.rotateX(Math.PI / 2);
        var y = BY - (tb.off ? 1 : 0), list = [];
        while (y - SE >= -BY - 0.01) {
          var yc = y - SE / 2, m = MM.glass(T, 0xf2c84a, { opacity: 0.42, side: T.DoubleSide, emissive: 0x6a4a00, ei: 0.35 });
          var me = new T.Mesh(segG, m); me.position.set(tb.x, yc, tb.z); me.renderOrder = 3; root.add(me); list.push({ m: m, y: yc });
          var cc = new T.Mesh(ccG, ccM); cc.position.set(tb.x + tb.r + 0.2, yc, tb.z + 0.28); cc.renderOrder = 2; root.add(cc);
          var nu = new T.Mesh(nucG, nucM); nu.position.set(tb.x + tb.r + 0.22, yc + 0.35, tb.z + 0.42); root.add(nu);
          if (y - SE > -BY + 0.05) {
            var pl = new T.Mesh(new T.CircleGeometry(tb.r * 0.98, 22), B.plateM); pl.rotation.x = -Math.PI / 2; pl.position.set(tb.x, y - SE, tb.z); pl.renderOrder = 4; root.add(pl);
            var rim = new T.Mesh(rimG, rimM); rim.position.copy(pl.position); root.add(rim);
          }
          y -= SE;
        }
        B.seM.push(list);
      });
      /* rays: rows of small cells running across the cambium, xylem to phloem */
      var rayG = se(0.2, 0.17, 0.2, 0.6, 10, 8), rayM = MM.glass(T, 0xe8d6a8, { opacity: 0.5, emissive: 0x3a2a10, ei: 0.25 });
      RAYS.forEach(function (ry) { for (var xx = -2.9; xx <= 2.2; xx += 0.42) { var rc = new T.Mesh(rayG, rayM); rc.position.set(xx, ry, RAYZ); root.add(rc); } });
      /* the source and sink ends, out of focus: leaf cells above, root cortex below */
      var lfG = se(0.9, 0.7, 0.9, 0.6, 10, 8), lfM = MM.glass(T, 0x5fbf5a, { opacity: 0.45 }), rtM = MM.glass(T, 0xe8dcc0, { opacity: 0.45 });
      for (var e = 0; e < 6; e++) {
        var l1 = new T.Mesh(lfG, lfM); l1.position.set(-2.4 + r() * 4.8, BY + 1.3 + r() * 1.4, -1 + r() * 2); root.add(l1);
        var l2 = new T.Mesh(lfG, rtM); l2.position.set(-2.4 + r() * 4.8, -BY - 1.3 - r() * 1.4, -1 + r() * 2); root.add(l2);
      }
      var fG = se(1.3, 1.6, 1.2, 0.6, 10, 8), fM = MM.glass(T, 0xbfa860, { opacity: 0.3 });
      for (var f = 0; f < 9; f++) { var fm = new T.Mesh(fG, fM); fm.position.set(-11 + r() * 22, -7 + r() * 14, -8 - r() * 5); far.add(fm); }
      /* molecules */
      var G = PP.kit.geos(T, MM), vmat = function () { return MM.lin(new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.3, emissive: 0x112211, emissiveIntensity: 0.25 })); };
      function im(geo, mat, n) { var x = new T.InstancedMesh(geo, mat, n); x.frustumCulled = false; x.renderOrder = 8; root.add(x); return x; }
      B.sucM = im(G.suc, vmat(), 60); B.sorM = im(G.sor, vmat(), 24); B.watM = im(G.wat, MM.lin(new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.3 })), 64);
      B.glow = MM.halos(T, 60, 0x7dff7a, 0.42); root.add(B.glow.obj);
      B.wglow = MM.halos(T, 20, 0x9cd0ff, 0.5); root.add(B.wglow.obj);
      B.mol = []; B.up = []; B.cross = []; B.acc = 0; B.accW = 0; B.accU = 0; B.dummy = new T.Object3D();
      for (var m0 = 0; m0 < 30; m0++) B.mol.push(newSugar(-BY + r() * BY * 2));
      for (var u0 = 0; u0 < 26; u0++) B.up.push(newUp(-BY + r() * BY * 2));
      B.hn = PP.heroNames(ctx);
      B.cols = { hi: new T.Color(0xff8a2a).convertSRGBToLinear(), lo: new T.Color(0x3aa8e0).convertSRGBToLinear(), dead: new T.Color(0x8a8a86).convertSRGBToLinear(), tmp: new T.Color() };
      tint(); labels();
      for (var pw = 0; pw < 60; pw++) frame(ctx, pw * 0.06, 0.06);
      live();
    }
    function newSugar(y) {
      var r = B.rnd, st = S(), tb = TUB[r() < 0.6 ? 0 : 1], a = r() * TAU, rr = Math.sqrt(r()) * tb.r * 0.6;
      return { tb: tb, x: tb.x + Math.cos(a) * rr, y: y, z: tb.z + Math.sin(a) * rr, sor: st.sugar === 'rosaceae' && r() < st.sorb, rx: r() * 6, ry: r() * 6, sp: 0.85 + r() * 0.3 };
    }
    function newUp(y) {
      var r = B.rnd, v = VES[r() < 0.5 ? 0 : (r() < 0.5 ? 1 : 2)], a = r() * TAU, rr = Math.sqrt(r()) * v.r * 0.6;
      return { x: v.x + Math.cos(a) * rr, y: y, z: v.z + Math.sin(a) * rr, sp: 0.8 + r() * 0.4, id: r() };
    }
    function tint() {
      var T = B.T, r = R(); if (!T) return;
      var Ps = r.Psrc || 0, Pk = r.Psink || 0, pmax = Math.max(1.2, Ps), wc = waterCol(T, S().psiX), lost = r.PsrcRaw <= 0 || r.stopped;
      B.vM.forEach(function (m) { m.color.copy(wc); m.emissive.copy(wc).multiplyScalar(0.25); if (m.userData.shader) m.userData.shader.uniforms.rimColor.value.copy(wc); });
      B.seM.forEach(function (list) {
        list.forEach(function (e) {
          var u = (BY - e.y) / (BY * 2), p = Ps + (Pk - Ps) * u, f = clamp(p / pmax, 0, 1); f = f * f * (3 - 2 * f);
          B.cols.tmp.copy(B.cols.lo).lerp(B.cols.hi, f); if (lost) B.cols.tmp.lerp(B.cols.dead, 0.6);
          e.m.color.copy(B.cols.tmp); e.m.emissive.copy(B.cols.tmp).multiplyScalar(0.35);
          if (e.m.userData.shader) e.m.userData.shader.uniforms.rimColor.value.copy(B.cols.tmp);
        });
      });
      var cal = S().callose;
      B.plateM.color.set(cal ? 0xe8f6ff : 0xf6dc8a).convertSRGBToLinear(); B.plateM.emissive.set(cal ? 0x6a9ab8 : 0x7a5a10).convertSRGBToLinear();
      B.plateM.alphaMap = cal ? null : B.poreTex; B.plateM.opacity = cal ? 0.85 : 1; B.plateM.needsUpdate = true;
    }
    function labels() {
      var T = B.T; if (!T || !B.ctx) return;
      var V = function (x, y, z) { return new T.Vector3(x, y, z); }, r = R(), st = S();
      var L = [
        { id: 'xy', text: 'Xylem: water up · Ψ ' + num(st.psiX, 2) + ' MPa', pos: V(VES[0].x, BY - 0.6, VES[0].z + 0.6), tier: 1 },
        { id: 'ph', text: r.stopped ? 'Phloem: sugar stalled' : 'Phloem: sugar down · ' + num(r.Psrc, 2) + ' MPa', pos: V(TUB[0].x, BY - 1.6, TUB[0].z + 0.5), tier: 1 },
        { id: 'in', text: 'Water joins the phloem', pos: V(-0.55, 3.9, 0.9), tier: 1, narrow: false },
        { id: 'out', text: 'Water returns to the xylem', pos: V(-0.55, -4.3, 0.9), tier: 1, narrow: false },
        { id: 'cb', text: 'Cambium', pos: V(CAMB, -1.6, 1.45), tier: 2, narrow: false },
        { id: 'ray', text: 'Ray', pos: V(1.9, RAYS[1] + 0.35, RAYZ), tier: 2, narrow: false },
        { id: 'cc', text: 'Companion cell', pos: V(TUB[0].x + TUB[0].r + 0.25, -1.0, TUB[0].z + 0.5), tier: 2, narrow: false },
        { id: 'sk', text: 'Sink end: ' + num(r.Psink, 2) + ' MPa', pos: V(TUB[0].x + 0.4, -BY + 0.4, TUB[0].z + 0.5), tier: 2 }
      ];
      if (O.extraLabels) L = L.concat(O.extraLabels(V));
      B.ctx.setLabels(L);
    }
    function frame(ctx, t, dt) {
      var T = B.T; if (!T) return;
      var st = S(), r = R(), rnd = B.rnd, i, Un = Math.max(0, (r.U || 0) / 147), dens = Math.max(0.2, st.conc / 18);
      var v = r.U > 0 ? 0.22 + 1.1 * Math.min(2.5, Un) : 0;          // sugar pace, world units per second (ILLUSTRATIVE)
      var vx = 0.9;                                                    // xylem water pace (ILLUSTRATIVE, not modelled)
      if (dt > 0) {
        B.acc += dt * v * 3.2 * dens; while (B.acc >= 1) { B.acc -= 1; if (B.mol.length < 60) B.mol.push(newSugar(BY - 0.05)); }
        B.accU += dt * vx * 2.4; while (B.accU >= 1) { B.accU -= 1; if (B.up.length < 40) B.up.push(newUp(-BY + 0.05)); }
        B.accW += dt * 1.3 * Math.min(2.5, Un);
        while (B.accW >= 1) { B.accW -= 1; if (B.cross.length < 20) { B.cross.push({ u: 0, inn: true, y: 3 + rnd() * 2.4, z: -0.3 + rnd() * 0.6, id: rnd() }); B.cross.push({ u: 0, inn: false, y: -3 - rnd() * 2.4, z: -0.3 + rnd() * 0.6, id: rnd() }); } }
      }
      for (i = B.mol.length - 1; i >= 0; i--) {
        var o = B.mol[i];
        if (dt > 0) {
          var near = 1, rel = ((BY - o.y) - o.tb.off) / SE, dp = Math.abs(rel - Math.round(rel)) * SE;
          if (dp < 0.22) near = 0.55 + 0.45 * dp / 0.22;          // the sieve plates slow the sap a little
          o.y -= dt * v * o.sp * near; o.rx += dt * 0.7; o.ry += dt * 0.5;
        }
        if (o.y < -BY + 0.05) B.mol.splice(i, 1);
      }
      for (i = B.up.length - 1; i >= 0; i--) { var w = B.up[i]; if (dt > 0) w.y += dt * vx * w.sp; if (w.y > BY - 0.05) B.up.splice(i, 1); }
      for (i = B.cross.length - 1; i >= 0; i--) { var c = B.cross[i]; if (dt > 0) c.u += dt * 0.38; if (c.u >= 1) B.cross.splice(i, 1); }
      var D = B.dummy, nS = 0, nO = 0, nW = 0;
      B.mol.forEach(function (m, k2) {
        D.position.set(m.x, m.y, m.z); D.rotation.set(m.rx, m.ry, 0); D.scale.setScalar(0.15); D.updateMatrix();
        if (m.sor) { if (nO < 24) B.sorM.setMatrixAt(nO++, D.matrix); } else if (nS < 60) B.sucM.setMatrixAt(nS++, D.matrix);
        if (k2 < 60) B.glow.set(k2, m.x, m.y, m.z);
      });
      for (i = B.mol.length; i < 60; i++) B.glow.hide(i);
      B.glow.commit();
      B.up.forEach(function (w2) { D.position.set(w2.x, w2.y, w2.z); D.rotation.set(0, t + w2.id * 6, 0); D.scale.setScalar(1.1); D.updateMatrix(); if (nW < 64) B.watM.setMatrixAt(nW++, D.matrix); });
      var x0 = VES[0].x + VES[0].r * 0.4, x1 = TUB[0].x - TUB[0].r * 0.4, ease = function (u) { return u * u * (3 - 2 * u); };
      B.cross.forEach(function (c2, k3) {
        var e = ease(c2.u), xx = c2.inn ? x0 + (x1 - x0) * e : x1 + (x0 - x1) * e, yy = c2.y + 0.25 * Math.sin(e * Math.PI);
        c2.p = [xx, yy, c2.z]; D.position.set(xx, yy, c2.z); D.rotation.set(0, t * 1.3, 0); D.scale.setScalar(1.35); D.updateMatrix();
        if (nW < 64) B.watM.setMatrixAt(nW++, D.matrix);
        if (k3 < 20) B.wglow.set(k3, xx, yy, c2.z);
      });
      for (i = B.cross.length; i < 20; i++) B.wglow.hide(i);
      B.wglow.commit();
      D.scale.setScalar(0); D.updateMatrix();
      for (i = nS; i < 60; i++) B.sucM.setMatrixAt(i, D.matrix);
      for (i = nO; i < 24; i++) B.sorM.setMatrixAt(i, D.matrix);
      for (i = nW; i < 64; i++) B.watM.setMatrixAt(i, D.matrix);
      [B.sucM, B.sorM, B.watM].forEach(function (x) { x.instanceMatrix.needsUpdate = true; });
      var hn = B.hn; hn.begin();
      for (i = B.mol.length - 1; i >= 0; i--) { var m3 = B.mol[i]; hn.add(m3.sor ? 'sor' : 'suc', m3, m3.sor ? 'sorbitol' : 'sucrose', m3.x, m3.y, m3.z, 0.12, { all: false }); }
      B.cross.forEach(function (w3) { if (w3.p && w3.u > 0.25 && w3.u < 0.75) hn.add('wat', w3, 'H₂O', w3.p[0], w3.p[1], w3.p[2], 0.14, { all: false, q: 1 }); });
      hn.end();
      if (dt > 0 && ((t * 3) | 0) !== B.lastLive) { B.lastLive = (t * 3) | 0; live(); }
    }
    function camera(ctx, t) {
      var cam = ctx.camera, asp = ctx.w / ctx.h, tv = Math.tan(cam.fov * Math.PI / 360);
      var halfW = ctx.narrow ? 3.4 : 4.6, halfH = ctx.narrow ? 4.4 : 4.9;
      var D = Math.max(halfW / (tv * asp), halfH / tv) + 2;
      var yaw = 0.42 + 0.16 * Math.sin(t * 0.05), pitch = 0.14 + 0.05 * Math.sin(t * 0.04 + 1);
      var ty = (ctx.narrow ? 2.4 : 1.6) * Math.sin(t * 0.04 + 1.2);   /* the camera drifts slowly between the leaf end and the root end */
      cam.position.set(Math.sin(yaw) * Math.cos(pitch) * D, ty + Math.sin(pitch) * D, Math.cos(yaw) * Math.cos(pitch) * D);
      cam.lookAt(-0.3, ty, 0);
      ctx.scene.fog.near = D - 3; ctx.scene.fog.far = D + 14; ctx.farScene.fog.near = D; ctx.farScene.fog.far = D + 20;
    }
    function live() {
      if (!B.ctx || !B.ctx.setLive) return;
      B.ctx.setLive(O.live ? O.live() : '');
    }
    B.init = function () {
      if (!host || B.ctx || !PP.macro) return;
      B.ctx = PP.macro.hero(host, {
        id: O.id, seed: O.seed || 91, fov: 30, exposure: 1.0,
        lift: function (ctx) { return ctx.narrow ? 64 : 46; },
        palette: O.palette,
        label: O.label, question: O.question, answer: O.answer, credit: O.credit,
        height: function (w) { return w < 600 ? 580 : Math.round(Math.min(700, Math.max(520, w * 0.6))); },
        fallbackNote: O.fallbackNote,
        build: build, frame: frame, camera: camera,
        orbit: { minDist: 1.6, maxDist: 40 },
        focus: O.focus
      });
      live();
      if (U().railWatch && B.ctx.wrap) ui.railWatch(B.ctx.wrap);
      ui.onPrefs(function () { if (B.ctx && B.ctx.retheme) B.ctx.retheme(); });
    };
    B.update = function () { if (B.ctx) { tint(); labels(); live(); B.ctx.invalidate(); } };
    return B;
  };
  PP.bundle3d.focus = function (extra) {
    var f = [
      { id: 'xy', label: 'Xylem vessel', target: [VES[0].x, 1.2, VES[0].z], dist: 4.2, theta: 0.55, phi: 1.45 },
      { id: 'sv', label: 'Sieve tube', target: [TUB[0].x, 0, TUB[0].z], dist: 3.6, theta: 0.35, phi: 1.5 },
      { id: 'in', label: 'Water joins', target: [-0.55, 4.2, 0], dist: 5.2, theta: 0.15, phi: 1.35 },
      { id: 'out', label: 'Water returns', target: [-0.55, -4.2, 0], dist: 5.2, theta: 0.15, phi: 1.75 },
      { id: 'ray', label: 'Ray and cambium', target: [-0.4, RAYS[1], RAYZ - 0.3], dist: 3.4, theta: 0.9, phi: 1.4 },
      { id: 'top', label: 'From above', tag: false, target: [-0.6, BY, 0], dist: 7, theta: 0.3, phi: 0.35 }
    ];
    return extra ? f.concat(extra) : f;
  };
  PP.bundle3d.palette = {
    light: { top: '#1e2a2a', mid: '#3e5a50', bot: '#8aa088', bokeh: ['#e8f4ff', '#cfe6c0', '#f6e7b0', '#b8d8f0'], fog: 0x3e5a50, fg: 'rgba(200,226,210,.45)' },
    dark: { top: '#05080a', mid: '#0d1614', bot: '#18241e', bokeh: ['#2f5f6f', '#3c5a3a', '#6a5a2c', '#2c4a6a'], fog: 0x0d1614, fg: 'rgba(110,140,120,.4)' }
  };

  /* ================================================================== 3.1 Two pipes, one water supply (2D) */
  var A1 = null, A2 = null, TH = { up: [], suc: [], cr: [], accU: 0, acc: 0, accC: 0 };
  function presColor(p, a) { var f = clamp(p / 1.4, 0, 1); return 'rgba(' + Math.round(60 + 190 * f) + ',' + Math.round(150 + 40 * (1 - Math.abs(f - 0.5) * 2)) + ',' + Math.round(220 - 170 * f) + ',' + (a == null ? 1 : a) + ')'; }
  function waterCss(psi, a) { var f = clamp(-psi / 2.5, 0, 1); return 'rgba(' + Math.round(47 + (201 - 47) * f) + ',' + Math.round(111 + (216 - 111) * f) + ',' + Math.round(224 + (230 - 224) * f) + ',' + a + ')'; }
  function sweepPsi(st) {   // source turgor and speed against xylem water potential, from the engine
    var out = []; for (var i = 0; i <= 50; i++) { var p = -2.5 + 2.5 * i / 50, s = Object.assign({}, st, { psiX: p }), r = PP.solve(s); out.push({ p: p, P: r.Psrc, U: r.U }); } return out;
  }
  function concFor(st, psi, P) {   // sugar (%) at which the source turgor reaches P at this xylem water potential; null if above 32 % (model)
    var f = function (c) { return PP.solve(Object.assign({}, st, { psiX: psi, conc: c })).PsrcRaw - P; };
    if (f(2) >= 0) return 2; if (f(32) < 0) return null;
    var a = 2, b = 32; for (var i = 0; i < 40; i++) { var m = (a + b) / 2; if (f(m) >= 0) b = m; else a = m; } return b;
  }
  function needConc(st, psi) { return concFor(st, psi, st.Psink); }
  var P_MORNING = 1.09;   /* the default source turgor of the morning glory set (model, matches the measured 1.08 MPa) */
  function pct(c) { return c == null ? 'over 32' : num(c, 1); }
  function stopPsi(r) { return r.Psink - r.Pi; }
  function draw1(c, w, h, t, dt, info) {
    if (!TH.warm && w > 0) { TH.warm = true; for (var wi = 0; wi < 100; wi++) draw1(c, w, h, t, 0.1, info); }
    var st = S(), r = R(), dark = info.dark, kit = K(), narrow = w < 640;
    c.clearRect(0, 0, w, h);
    var bg = c.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, dark ? '#0d1315' : '#f4f2e8'); bg.addColorStop(1, dark ? '#0a0f12' : '#e9e8da'); c.fillStyle = bg; c.fillRect(0, 0, w, h);
    var ink = dark ? '#e9e4d2' : '#25301f', sub = dark ? '#cfc8b4' : '#4a5340', fs = narrow ? 10.5 : 11.5;
    var sans = function (wt, s) { return wt + ' ' + s + 'px "IBM Plex Sans",system-ui,sans-serif'; };
    /* ---- stem: left (wide) or top (narrow) */
    var sw = narrow ? w : Math.round(w * 0.42), sh = narrow ? 300 : h;
    var cx = sw / 2, colW = narrow ? 52 : 60, gap = narrow ? 34 : 44, xL = cx - gap / 2 - colW, xR = cx + gap / 2, yT = 46, yB = sh - 40;
    c.textAlign = 'center'; c.font = sans(700, fs); c.fillStyle = ink;
    c.fillText('Leaf: the source', cx, 20); c.fillText('Root: the sink', cx, sh - 14);
    c.font = sans(600, fs - 0.5); c.fillStyle = dark ? '#9cc8ff' : '#2a5c8f'; c.fillText('xylem', xL + colW / 2, 36);
    c.fillStyle = dark ? '#ffcf7a' : '#8a6a10'; c.fillText('phloem', xR + colW / 2, 36);
    /* xylem column tinted by Ψx */
    c.fillStyle = waterCss(st.psiX, dark ? 0.32 : 0.3); c.strokeStyle = dark ? '#6aa8ff' : '#3a78c8'; c.lineWidth = 1.6;
    c.beginPath(); c.rect(xL, yT, colW, yB - yT); c.fill(); c.stroke();
    /* phloem column tinted by turgor, top to bottom */
    var n = 6, segH = (yB - yT) / n, Ps = r.Psrc || 0, Pk = r.Psink || 0, lost = r.stopped;
    for (var i = 0; i < n; i++) {
      var p = Ps + (Pk - Ps) * ((i + 0.5) / n);
      c.fillStyle = lost ? (dark ? 'rgba(140,140,130,.3)' : 'rgba(140,140,130,.3)') : presColor(p, dark ? 0.34 : 0.4);
      c.strokeStyle = dark ? '#e6c25a' : '#9a7410'; c.lineWidth = 1.6;
      c.beginPath(); c.rect(xR, yT + i * segH + 1, colW, segH - 2); c.fill(); c.stroke();
      if (i > 0) { c.strokeStyle = st.callose ? (dark ? '#e8f6ff' : '#4a7a9a') : (dark ? '#f2d27a' : '#8a6a10'); c.lineWidth = st.callose ? 4 : 2; c.setLineDash(st.callose ? [] : [4, 3]); c.beginPath(); c.moveTo(xR + 2, yT + i * segH); c.lineTo(xR + colW - 2, yT + i * segH); c.stroke(); c.setLineDash([]); }
    }
    /* cambium */
    c.strokeStyle = dark ? 'rgba(120,220,120,.6)' : 'rgba(40,140,40,.55)'; c.lineWidth = 3; c.beginPath(); c.moveTo(cx, yT); c.lineTo(cx, yB); c.stroke();
    /* side values */
    c.font = '500 ' + (fs - 0.5) + 'px "IBM Plex Mono",ui-monospace,monospace'; c.fillStyle = dark ? '#9cc8ff' : '#2a5c8f'; c.textAlign = 'right';
    c.fillText('Ψ ' + num(st.psiX, 2), xL - 6, yT + 14); c.fillText('MPa', xL - 6, yT + 28);
    c.textAlign = 'left'; c.fillStyle = dark ? '#ffcf9a' : '#8a4a10';
    c.fillText('P ' + num(Ps, 2), xR + colW + 6, yT + 14); c.fillText('P ' + num(Pk, 2), xR + colW + 6, yB - 6); c.fillText('MPa', xR + colW + 6, yT + 28);
    /* molecules: water up the xylem (teaching pace), sugar down the phloem (pace from U), water across near the leaf and back near the root */
    var Un = Math.max(0, (r.U || 0) / 147), dens = Math.max(0.2, st.conc / 18);
    if (dt > 0) {
      TH.accU += dt * 3.2; while (TH.accU >= 1 && TH.up.length < 26) { TH.accU -= 1; TH.up.push({ x: xL + 8 + Math.random() * (colW - 16), y: yB - 2 }); } if (TH.accU > 3) TH.accU = 0;
      TH.acc += dt * 2.6 * Math.min(2.5, Un) * dens; while (TH.acc >= 1 && TH.suc.length < 30) { TH.acc -= 1; TH.suc.push({ x: xR + 10 + Math.random() * (colW - 20), y: yT + 4, sor: st.sugar === 'rosaceae' && Math.random() < st.sorb, k: Math.random() }); } if (TH.acc > 3) TH.acc = 0;
      TH.accC += dt * 1.6 * Math.min(2.5, Un); while (TH.accC >= 1 && TH.cr.length < 10) { TH.accC -= 1; TH.cr.push({ u: 0, inn: true, y: yT + 12 + Math.random() * segH * 1.6 }); TH.cr.push({ u: 0, inn: false, y: yB - 12 - Math.random() * segH * 1.6 }); }
    }
    for (var a = TH.up.length - 1; a >= 0; a--) { var wu = TH.up[a]; if (dt > 0) wu.y -= dt * 46; if (wu.y < yT + 4) { TH.up.splice(a, 1); continue; } kit.water(c, wu.x, wu.y, narrow ? 3 : 3.4); }
    var named = 0;
    for (var b = TH.suc.length - 1; b >= 0; b--) {
      var o = TH.suc[b]; if (dt > 0) o.y += dt * (8 + 60 * Math.min(2.5, Un)) * (Un > 0.002 ? 1 : 0);
      if (o.y > yB - 4) { TH.suc.splice(b, 1); continue; }
      if (o.sor) kit.sorbitol(c, o.x, o.y, narrow ? 6 : 7); else kit.sucrose(c, o.x, o.y, narrow ? 6 : 7);
      if (window.MolNames && window.MolNames.get() && named < 1 && o.k < 0.1 && o.y > yT + segH && o.y < yB - segH) { named++; kit.pill(c, o.x, o.y + 9, o.sor ? 'sorbitol' : 'sucrose', dark, narrow ? 9.5 : 10.5); }
    }
    for (var q = TH.cr.length - 1; q >= 0; q--) {
      var cq = TH.cr[q]; if (dt > 0) cq.u += dt * 0.7; if (cq.u >= 1) { TH.cr.splice(q, 1); continue; }
      var xa = xL + colW - 6, xb = xR + 6, xx = cq.inn ? xa + (xb - xa) * cq.u : xb + (xa - xb) * cq.u;
      kit.water(c, xx, cq.y - 6 * Math.sin(cq.u * Math.PI), narrow ? 3.4 : 3.8);
    }
    c.font = sans(600, fs - 0.5); c.fillStyle = dark ? '#9cc8ff' : '#2a5c8f'; c.textAlign = 'center';
    if (!lost) { c.fillText('water in →', cx, yT + segH * 0.9 + 18); c.fillText('← water out', cx, yB - segH * 0.9 - 8); }
    if (lost) {
      c.fillStyle = dark ? 'rgba(14,20,16,.86)' : 'rgba(255,253,246,.94)'; c.fillRect(cx - 120, (yT + yB) / 2 - 16, 240, 32);
      c.fillStyle = dark ? '#ffd2a0' : '#8a3a00'; c.font = sans(700, fs); c.fillText('No push left: the sugar stalls', cx, (yT + yB) / 2 + 4);
    }
    /* ---- plots: right (wide) or below (narrow) */
    var px0 = narrow ? 50 : sw + 56, px1 = w - (narrow ? 16 : 22), top = narrow ? sh + 22 : 30, bot = h - 34, mid = (top + bot) / 2, gapP = 34;
    var plots = [{ y0: top, y1: mid - gapP / 2, key: 'P', lab: 'Source turgor, MPa (model)', max: Math.max(2, Ps * 1.1) }, { y0: mid + gapP / 2, y1: bot, key: 'U', lab: 'Sap speed, µm s⁻¹ (model)', max: 0 }];
    var sw2 = sweepPsi(st); sw2.forEach(function (d) { plots[1].max = Math.max(plots[1].max, d.U); }); plots[1].max = Math.max(50, plots[1].max * 1.1);
    var X = function (p) { return px0 + (px1 - px0) * (p + 2.5) / 2.5; }, xs = stopPsi(r);
    plots.forEach(function (P, k) {
      var Y = function (v) { return P.y1 - (P.y1 - P.y0) * clamp(v / P.max, 0, 1); };
      if (xs > -2.5) { c.fillStyle = dark ? 'rgba(160,160,150,.14)' : 'rgba(120,120,110,.14)'; c.fillRect(px0, P.y0, X(Math.min(0, xs)) - px0, P.y1 - P.y0); }
      c.strokeStyle = dark ? 'rgba(255,255,255,.28)' : 'rgba(0,0,0,.28)'; c.lineWidth = 1; c.beginPath(); c.moveTo(px0, P.y0); c.lineTo(px0, P.y1); c.lineTo(px1, P.y1); c.stroke();
      c.fillStyle = sub; c.font = sans(500, fs - 1); c.textAlign = 'left'; c.fillText(P.lab, px0 + 6, P.y0 + 2);
      c.textAlign = 'right'; c.fillText(num(0, 0), px0 - 5, P.y1 + 4); c.fillText(num(P.max, P.key === 'P' ? 1 : 0), px0 - 5, P.y0 + 8);
      if (k === 0) { c.strokeStyle = dark ? '#ffcf9a' : '#8a4a10'; c.setLineDash([5, 4]); c.beginPath(); c.moveTo(px0, Y(Pk)); c.lineTo(px1, Y(Pk)); c.stroke(); c.setLineDash([]); c.fillStyle = dark ? '#ffcf9a' : '#8a4a10'; c.textAlign = 'right'; c.fillText('sink ' + num(Pk, 2), px1, Y(Pk) - 4); }
      c.strokeStyle = k === 0 ? (dark ? '#ffb05a' : '#c0661a') : (dark ? '#7dff7a' : '#2a8a3a'); c.lineWidth = 2.6; c.beginPath();
      sw2.forEach(function (d, j) { var yy = Y(d[P.key]); if (j) c.lineTo(X(d.p), yy); else c.moveTo(X(d.p), yy); }); c.stroke();
      var cur = k === 0 ? r.Psrc : r.U; c.fillStyle = c.strokeStyle; c.beginPath(); c.arc(X(st.psiX), Y(cur), 5, 0, TAU); c.fill();
      c.strokeStyle = dark ? '#fff' : '#222'; c.lineWidth = 1.2; c.stroke();
    });
    c.fillStyle = sub; c.font = sans(500, fs - 1); c.textAlign = 'center';
    [-2.5, -2, -1.5, -1, -0.5, 0].forEach(function (v) { if (!narrow || v % 1 === 0 || v === -0.5) c.fillText(num(v, v % 1 ? 1 : 0), X(v), bot + 14); });
    c.fillText(narrow ? 'xylem water potential, MPa' : 'xylem water potential at the leaf, MPa (drier to the left)', (px0 + px1) / 2, bot + 28);
    if (xs > -2.5) { c.fillStyle = dark ? '#d8d2c0' : '#555'; c.textAlign = 'left'; c.font = sans(600, fs - 1); var lx = Math.max(px0 + 4, Math.min(X(xs) - (narrow ? 70 : 96), px1 - 150)); c.fillText('no flow left of ' + num(xs, 2), lx, mid + 4); }
  }
  /* 3.2: speed against sugar at three xylem water potentials; dashed: the same push if the sap stayed as thin as water */
  function draw2(c, w, h, t, dt, info) {
    var st = S(), dark = info.dark, narrow = w < 600, fs = narrow ? 10.5 : 11.5;
    var sans = function (wt, s) { return wt + ' ' + s + 'px "IBM Plex Sans",system-ui,sans-serif'; }, sub = dark ? '#cfc8b4' : '#4a5340';
    c.clearRect(0, 0, w, h);
    var bg = c.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, dark ? '#0d1315' : '#f4f2e8'); bg.addColorStop(1, dark ? '#0a0f12' : '#e9e8da'); c.fillStyle = bg; c.fillRect(0, 0, w, h);
    var x0 = narrow ? 46 : 64, x1 = w - (narrow ? 14 : 28), y0 = 30, y1 = h - 46;
    var psis = [{ p: -0.2, col: dark ? '#7ab8ff' : '#2a6ac8', lab: 'wet' }, { p: st.psiX, col: dark ? '#ffb05a' : '#c0661a', lab: 'now', bold: true }, { p: -1.4, col: dark ? '#c0a0ff' : '#7a4ab0', lab: 'dry' }];
    psis = psis.filter(function (d) { return d.bold || Math.abs(d.p - st.psiX) > 0.05; });
    var ew = PP.etaWater(st.T);
    var curves = psis.map(function (d) { var pts = [], thin = []; for (var cc = 2; cc <= 32; cc += 0.5) { var rr = PP.solve(Object.assign({}, st, { psiX: d.p, conc: cc })); pts.push([cc, rr.U]); thin.push([cc, rr.U * rr.eta / ew]); } return { d: d, pts: pts, thin: thin, need: needConc(st, d.p) }; });
    var ymax = 50; curves.forEach(function (cv) { cv.pts.forEach(function (q) { ymax = Math.max(ymax, q[1]); }); }); ymax *= 1.15;
    var X = function (cc) { return x0 + (x1 - x0) * (cc - 2) / 30; }, Y = function (u) { return y1 - (y1 - y0) * Math.min(u, ymax) / ymax; };
    c.strokeStyle = dark ? 'rgba(255,255,255,.28)' : 'rgba(0,0,0,.28)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0, y1); c.lineTo(x1, y1); c.stroke();
    c.fillStyle = sub; c.font = sans(500, fs - 1); c.textAlign = 'center';
    [2, 8, 14, 20, 26, 32].forEach(function (v) { c.fillText(v + ' %', X(v), y1 + 14); });
    c.fillText('sugar in the sap (by mass)', (x0 + x1) / 2, y1 + 30);
    c.textAlign = 'right'; c.fillText('0', x0 - 5, y1 + 4); c.fillText(num(ymax, 0), x0 - 5, y0 + 8);
    c.textAlign = 'left'; c.fillText(narrow ? 'speed, µm s⁻¹ (model)' : 'sap speed, µm s⁻¹ (model)', x0 + 6, y0 - 12);
    /* the cost of thickness, for the present curve: dashed = same push through water thin sap */
    var nowC = curves.filter(function (cv) { return cv.d.bold; })[0];
    c.save(); c.beginPath(); c.rect(x0, y0, x1 - x0, y1 - y0); c.clip();
    c.strokeStyle = nowC.d.col; c.globalAlpha = 0.55; c.lineWidth = 1.6; c.setLineDash([3, 4]); c.beginPath();
    nowC.thin.forEach(function (q, j) { if (j) c.lineTo(X(q[0]), Y(q[1])); else c.moveTo(X(q[0]), Y(q[1])); }); c.stroke(); c.setLineDash([]); c.globalAlpha = 1; c.restore();
    curves.forEach(function (cv, k) {
      c.strokeStyle = cv.d.col; c.lineWidth = cv.d.bold ? 3 : 1.8; c.beginPath();
      cv.pts.forEach(function (q, j) { if (j) c.lineTo(X(q[0]), Y(q[1])); else c.moveTo(X(q[0]), Y(q[1])); }); c.stroke();
      if (cv.need != null) { c.fillStyle = cv.d.col; c.beginPath(); c.moveTo(X(cv.need), y1 - 2); c.lineTo(X(cv.need) - 5, y1 - 11); c.lineTo(X(cv.need) + 5, y1 - 11); c.closePath(); c.fill(); }
      var lp = cv.pts[cv.pts.length - 1];
      c.font = sans(cv.d.bold ? 700 : 600, fs - 1); c.textAlign = 'right'; c.fillStyle = cv.d.col;
      c.fillText((narrow ? '' : cv.d.lab + ' xylem, ') + 'Ψx ' + num(cv.d.p, 2), X(lp[0]) - 4, Math.max(y0 + 10, Math.min(y1 - 18, Y(lp[1]) + 16)));
    });
    var cu = PP.solve(st);
    c.fillStyle = dark ? '#fff' : '#111'; c.beginPath(); c.arc(X(st.conc), Y(cu.U), 5.5, 0, TAU); c.fill();
    c.fillStyle = dark ? '#ffb05a' : '#c0661a'; c.beginPath(); c.arc(X(st.conc), Y(cu.U), 3.5, 0, TAU); c.fill();
    c.fillStyle = sub; c.font = sans(500, fs - 1); c.textAlign = 'left';
    c.fillText(narrow ? '▲ least sugar for flow · dashed: as thin as water' : '▲ least sugar for any flow · dashed: the same push if the sap stayed as thin as water', x0 + 8, y0 + 4);
  }

  function nowText() {
    var st = S(), r = R(), tier = U().tier(), xs = stopPsi(r);
    if (tier === 1) {
      if (r.stopped) return 'The xylem is pulling so hard on water that the leaf end of the sieve tube cannot build pressure. The sugar stalls until the xylem gets wetter or the leaf loads more sugar.';
      return 'The sieve tube takes its water from the xylem next door. Wet xylem gives the leaf end a strong push and the sugar runs down to the root; dry xylem takes that push away.';
    }
    return (r.stopped ? 'Flow has stopped in the model: ' : '') + 'xylem Ψ ' + num(st.psiX, 2) + ' MPa + sap Π ' + num(r.Pi, 2) + ' MPa = source turgor ' + num(r.Psrc, 2) + ' MPa against ' + num(r.Psink, 2) + ' MPa at the sink. ' +
      (r.stopped ? 'Wet the xylem above ' + num(xs, 2) + ' MPa or load more sugar.' : 'Speed ' + num(r.U, 0) + ' µm s⁻¹. With this sap, flow stops if the xylem falls to ' + num(xs, 2) + ' MPa.');
  }
  function capText() {
    var st = S(), n = needConc(st, st.psiX), m = concFor(st, st.psiX, P_MORNING);
    return 'Each 0.1 MPa drier in the xylem takes 0.1 MPa off the source turgor, one for one, because water potential must match across the wall (model). At this xylem water potential the sap needs ' + pct(n) + ' % sugar for any flow at all, and ' + pct(m) + ' % to get back the morning push of ' + num(P_MORNING, 2) + ' MPa; you have ' + num(st.conc, 1) + ' %.';
  }
  function liveLine() {
    var r = R(), st = S();
    return r.stopped ? 'Xylem Ψ ' + num(st.psiX, 2) + ' MPa · source turgor ' + num(r.Psrc, 2) + ' MPa · no push, no flow · model'
      : 'Xylem Ψ ' + num(st.psiX, 2) + ' + Π ' + num(r.Pi, 2) + ' = ' + num(r.Psrc, 2) + ' MPa · ' + num(r.U, 0) + ' µm s⁻¹ · model';
  }

  /* ================================================================== page */
  var CSS = '#lv-xylem .px-ctrls{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:4px 18px;margin:12px 0 0;border-top:1px solid var(--rule2)}' +
    '#lv-xylem .px-sw{display:flex;flex-wrap:wrap;gap:6px;align-items:center}' +
    '#lv-xylem .eq{font-family:var(--mono);font-size:13.5px;line-height:1.9;overflow-x:auto}' +
    '#lv-xylem .px-bars{display:grid;gap:8px;margin:10px 0}#lv-xylem .px-bar{display:grid;grid-template-columns:minmax(92px,150px) 1fr auto;gap:10px;align-items:center;font-size:15px}' +
    '#lv-xylem .px-bar .tr{height:16px;border-radius:8px;background:var(--rule2);overflow:hidden}#lv-xylem .px-bar .fl{height:100%;border-radius:8px;background:linear-gradient(90deg,#3a78c8,#d8a030)}' +
    '#lv-xylem .px-bar .v{font-family:var(--mono);font-size:14px;font-variant-numeric:tabular-nums}';
  function tile(id, k, unit, cls) { return '<div class="tile' + (cls ? ' ' + cls : '') + '" id="' + id + '"><div class="k">' + k + '</div><div class="v"><span class="n">0</span> <small>' + (unit || '') + '</small></div></div>'; }
  function setTile(id, v) { var e = document.querySelector('#' + id + ' .n'); if (e) e.textContent = v; }
  var SLD = [
    ['px-psix', 'psiX', 'Xylem water potential at the leaf', -2.5, 0, 0.05, function (v) { return num(v, 2) + ' MPa'; }, 'left is drier: the xylem pulls harder on water', ''],
    ['px-conc', 'conc', 'Sugar in the sap', 2, 32, 0.5, function (v) { return num(v, 1) + ' %'; }, 'more sugar pulls more water in, and thickens the sap', ''],
    ['px-ps', 'Psink', 'Turgor at the sink', 0, 1.2, 0.01, function (v) { return num(v, 2) + ' MPa'; }, 'measured 0.59 MPa in a morning glory root', 'tier-3'],
    ['px-k', 'K', 'Extra potassium in the sap', 0, 0.5, 0.01, function (v) { return num(v, 2) + ' mol kg⁻¹'; }, 'an osmolyte that does not thicken the sap like sugar (maize, Babst et al. 2022)', 'tier-3'],
    ['px-T', 'T', 'Temperature', 5, 40, 0.5, function (v) { return num(v, 1) + ' °C'; }, 'warm sap is thinner (water viscosity)', 'tier-3']
  ];
  var bundle = null;
  function mount(el) {
    U();
    var E = ui.ev;
    var ratios = [['Tobacco', 0.55], ['Castor bean', 0.37], ['Poplar', 0.19], ['Tomato', 0.04]];
    el.innerHTML = '<style>' + CSS + '</style>' +
      '<div class="px-hero" id="px-hero"></div>' +
      ui.now('<b>What is happening:</b> <span id="px-now"></span>', 'px-nowp') +
      '<figure class="fig lx-fig" id="px-live"><div class="fighead"><h3>3.1 Two pipes, one water supply</h3><p>Left, a stem: xylem carrying water up, phloem carrying sugar down. Right, what the model says the source turgor and the sap speed do as the xylem dries.</p></div>' +
      '<div class="lx-frame" id="px-th"></div>' +
      '<p class="px-sw" role="group" aria-label="Time of day"><span class="ctl-l">A day in the leaf</span> <button type="button" class="btn small" data-px="night">Night</button> <button type="button" class="btn small" data-px="morning">Morning</button> <button type="button" class="btn small" data-px="noon">Midday</button> <button type="button" class="btn small" data-px="drought">Midday in a drought</button> ' + E('px.day') + '</p>' +
      '<div class="px-ctrls">' + SLD.map(function (x) { return '<div class="ctl' + (x[8] ? ' ' + x[8] : '') + '"><label for="' + x[0] + '">' + x[2] + ' <output id="' + x[0] + '-o"></output></label><input type="range" id="' + x[0] + '" min="' + x[3] + '" max="' + x[4] + '" step="' + x[5] + '"><div class="hint">' + x[7] + '</div></div>'; }).join('') +
      '<div class="ctl tier-2"><span class="ctl-l">The leaf answers</span><div class="px-sw"><button type="button" class="btn small" data-px="load">Load more sugar</button> <button type="button" class="btn small" data-px="restore">Restore the morning push</button></div><div class="hint">osmotic adjustment of the sap, in the model</div></div>' +
      '<div class="ctl"><span class="ctl-l">Scene</span><div class="px-sw"><button type="button" class="btn small" id="px-pause" aria-pressed="false">Pause</button> <button type="button" class="btn small" id="px-reset">Reset</button></div></div>' +
      '</div>' +
      '<figcaption class="cap" id="px-cap"></figcaption>' +
      '<p class="cap lx-row">The model: P at the source = Ψx + Π; flow U = k ΔP ÷ (η L). The xylem pace is a fixed teaching pace; the sugar pace follows U. ' + E('ps.coupling') + ' ' + E('px.stop') + ' ' + E('px.xspeed') + ' ' + E('ps.drawn') + '</p>' +
      '</figure>' +
      '<div class="tiles lx-tiles">' +
      tile('px-t-psi', 'Xylem water potential', 'MPa') + tile('px-t-psrc', 'Turgor at the source', 'MPa') + tile('px-t-u', 'Sap speed', 'µm s⁻¹') +
      tile('px-t-pi', 'Osmotic pressure of the sap, Π', 'MPa', 'tier-2') + tile('px-t-stop', 'Flow stops when the xylem reaches', 'MPa', 'tier-2') + tile('px-t-best', 'Least sugar for any flow here', '%', 'tier-2') +
      tile('px-t-eta', 'Sap viscosity', 'mPa s', 'tier-3') + tile('px-t-dp', 'Push, source minus sink', 'MPa', 'tier-3') + tile('px-t-bu', 'Sugar for the morning push', '%', 'tier-3') +
      '</div>' +

      '<figure class="fig lx-fig tier-2" id="px-opt"><div class="fighead"><h3>3.2 What more sugar buys</h3><p>Sugar pulls water into the tube, and sugar also makes the sap thick. Speed against sugar, at three xylem water potentials.</p></div>' +
      '<div class="lx-frame" id="px-th2"></div>' +
      '<figcaption class="cap">Drier xylem shifts each curve to the right: the sap needs more sugar before anything flows (the triangles). Past that point more sugar keeps adding speed in this model, but the gap to the dashed line is what thickness costs, and it grows with every percent. ' + E('px.need') + ' ' + E('px.opt') + ' ' + E('pv.eta') + ' Measured sap averages 18.2 % over 41 species ' + E('ph.tube.sap_concentration', 'Jensen et al. 2013') + '.</figcaption>' +
      '</figure>' +

      '<figure class="fig lx-fig" id="px-ratio"><div class="fighead"><h3>3.3 How much xylem water rides the phloem?</h3><p>At night, flow MRI measured the water moving down in the phloem as a share of the water moving up in the xylem. The water that leaves at the sink goes back up in the xylem: the Münch counterflow.</p></div>' +
      '<div class="px-bars">' + ratios.map(function (x) { return '<div class="px-bar"><span>' + x[0] + '</span><span class="tr" aria-hidden="true"><span class="fl" style="display:block;width:' + Math.round(x[1] / 0.6 * 100) + '%"></span></span><span class="v">' + num(x[1], 2) + '</span></div>'; }).join('') + '</div>' +
      '<figcaption class="cap">Phloem flow ÷ xylem flow at night, four species, MRI ' + ui.badge('MEASURED') + ' ' + E('ph.xp.counterflow', 'Windt et al. 2006') + '. <span class="tier-2">In tomato only 4 % of the xylem water was used by the phloem at night; in tobacco more than half. By day the xylem carries far more water, so the same phloem flow would be a smaller share.</span></figcaption>' +
      '</figure>' +

      '<section class="lx-cases" aria-label="How the two pipes are tied"><h3 class="lx-h3">How the two pipes are tied</h3><div class="lx-cardgrid">' +
      '<div class="card lx-case"><p class="lx-ck">The bark follows the wood</p><p>In Scots pine and Norway spruce, the osmolality of needles and inner bark tracked the xylem water potential closely: the water status of the xylem sets the turgor gradient that drives the phloem. ' + E('ph.xp.bark_osmolality', 'Paljakka et al. 2017') + '</p><p class="tier-2">Bark and wood dendrometers on pine trunks separate a phloem turgor signal that follows photosynthesis each day and answers drought and rain. ' + E('ph.xp.bark_turgor_signal', 'Mencuccini et al. 2013') + '</p></div>' +
      '<div class="card lx-case"><p class="lx-ck">Rays tie the two pipes together</p><p>Rays are ribbons of living cells that run across the stem, from the inner bark through the cambium into the wood. They carry water and sugar sideways and make xylem and phloem one connected network. ' + E('ph.xp.rays', 'Pfautsch et al. 2015') + '</p><p><button type="button" class="btn small" data-pxf="ray">Look closer at a ray</button></p></div>' +
      '<div class="card lx-case"><p class="lx-ck">A small pipe beside a big one</p><p>In Norway spruce, a conifer, the phloem conducted about 2 % as well as the outer ring of xylem, and the tree made ten times more xylem than phloem each year. ' + E('ph.xp.conductivity_ratio', 'Jyske and Hölttä 2015') + '</p><p class="tier-2">So the phloem cannot take much water before it matters to the xylem, but a small change in the xylem matters a great deal to the phloem.</p></div>' +
      '<div class="card lx-case tier-2"><p class="lx-ck">Water along the way helps</p><p>In a model, water entering the sieve tube along its whole length dilutes the sap, lowers its viscosity and raises sugar transport by about 40 % in active loaders and about 20 % in passive loaders. ' + E('ph.xp.radial_exchange', 'Nakad et al. 2022') + '</p></div>' +
      '<div class="card lx-case tier-2"><p class="lx-ck">Stomata serve the phloem too</p><p>Transpiration lowers the xylem water potential, and that takes push away from the phloem. Models in which stomata open just enough to keep sugar moving reproduce observed gas exchange. ' + E('ph.xp.coupling_model', 'Nikinmaa et al. 2013') + ' ' + E('ph.xp.stomata_model', 'Hölttä et al. 2017') + '</p><p>The water side of the same leaf: <a href="../journey/index.html#membrane">Water V, the Membrane</a> and <a href="../journey/index.html#afternoon">Your Salinas afternoon</a>.</p></div>' +
      '<div class="card lx-case tier-2"><p class="lx-ck">Trees hold more sugar in their leaves</p><p>Across 45 species, trees and the few herbs that load passively had low whole plant hydraulic conductance, high leaf osmolality and high leaf sugar; herbs that load actively had high conductance and little leaf sugar. Loading and water use go together. ' + E('ph.load.trees_water', 'Fu et al. 2011') + '</p></div>' +
      '</div></section>' +

      '<section class="tier-3 lx-expert" aria-label="Expert"><h3 class="lx-h3">Equations, models and what is still argued</h3>' +
      '<div class="card eq">Ψ<sub>sieve tube</sub> = Ψ<sub>xylem</sub>  (water potential equal across the wall at the source)<br>P<sub>source</sub> = Ψ<sub>x</sub> + Π    ' + E('ps.coupling') + '<br>' +
      'ΔP = Ψ<sub>x</sub> + Π − P<sub>sink</sub>;  flow stops when Ψ<sub>x</sub> ≤ P<sub>sink</sub> − Π ' + E('px.stop') + '<br>' +
      'U(c) = k<sub>eff</sub> (Ψ<sub>x</sub> + Π(c) − P<sub>sink</sub>) / (η(c) L) ' + E('px.opt') + '<br>' +
      'least sugar for flow: Π(c) = P<sub>sink</sub> − Ψ<sub>x</sub>;  sugar for a target P: Π(c) = P − Ψ<sub>x</sub> ' + E('px.need') + '<br>' +
      'U peaks in c only if dη/dc · ΔP &gt; dΠ/dc · η; with this teaching η(c) that does not happen below 32 %</div>' +
      '<div class="lx-tw"><table class="lx-tab"><thead><tr><th>Ψx</th><th>Source turgor</th><th>Speed</th><th>Least sugar for flow</th><th>Sugar for 1.09 MPa</th></tr></thead><tbody id="px-tab"></tbody></table></div>' +
      '<p class="cap">Rows from the engine at the present sugar, path and sink; the last two columns solve for the sugar each row would need. ' + ui.badge('MODEL') + '</p>' +
      '<div class="card lx-case"><p class="lx-ck">Models that carry both flows</p><p>A whole tree model driven by stem diameter simulates phloem turgor and the Münch counterflow in oak and beech; its daily swings mostly follow transpiration. ' + E('ph.xp.SDV_model', 'De Schepper and Steppe 2010') + ' A coupled cohesion tension and Münch model in a 3D Scots pine crown reproduced the measured pressure and sugar gradients. ' + E('ph.xp.3D_tree_model', 'Nikinmaa et al. 2014') + ' Phloem volume and conductance concentrate toward branch tips in four Finnish tree species. ' + E('ph.xp.scaling', 'Hölttä et al. 2013') + ' Review of xylem and phloem together: ' + E('ph.xp.reviews', 'Savage et al. 2016') + '</p></div>' +
      '<div class="card lx-open"><p class="lx-ck">' + ui.badge('OPEN QUESTION') + ' How do trees that load passively build enough pressure to push sugar tens of metres?</p><p>Trees mostly load passively, with no pump to concentrate sugar. Sieve tube structure changes with height so resistance falls in tall trees; a synthetic passive loader reached about 1 MPa; the puzzle of phloem pressure is still argued. ' + E('ph.tube.tall_trees', 'Savage et al. 2017') + ' ' + E('ph.load.chip_passive', 'Comtet et al. 2017') + ' ' + E('ph.oq.tall_passive', 'Open question') + '</p></div>' +
      '<div class="card lx-open"><p class="lx-ck">' + ui.badge('OPEN QUESTION') + ' Is the coupling as tight in a real stem as in this model?</p><p>This model lets the sieve tube match the xylem water potential at once. Real walls have a finite radial conductance, which followed water viscosity with temperature in pine, and storage in the bark buffers the swing. How fast, and how far down the stem, does the phloem feel a midday drop in xylem water potential? ' + E('ph.xp.bark_turgor_signal', 'Mencuccini et al. 2013') + ' ' + E('ph.xp.SDV_model', 'De Schepper and Steppe 2010') + '</p></div>' +
      ui.design({ title: 'does drier xylem slow the phloem in a tree?', question: 'When the xylem water potential of a tree falls through a dry spell, does the inner bark lose turgor and does new sugar move more slowly?',
        treat: 'Trees with roof exclusion of rain against trees left open, same site and size.',
        measure: 'Xylem water potential at predawn and midday; inner bark osmolality; paired bark and wood dendrometers; a ¹³C pulse timed to the trunk base.',
        howto: ['ph.barkosm', 'ph.dendro', 'ph.label'], n: 'Trees are the replicates: several per treatment, measured on the same days.',
        expect: 'If the coupling holds, inner bark turgor falls with xylem Ψ and the label arrives later in dry trees ' + ui.badge('MODEL') + ' (beech under throughfall exclusion: speed fell 47 % ' + E('ph.stress.beech_drought', 'Hesse et al. 2019') + ')',
        confound: 'Dry trees also photosynthesise less, so less sugar is loaded: measure leaf sugar and assimilation too, or you cannot tell less push from less cargo.' }) +
      ui.howto('ph.barkosm') + ui.howto('ph.dendro') + ui.howto('ph.mri') +
      '<p class="hint">Methods links: no PrometheusWiki protocol page for bark osmolality or dendrometers was confirmed in this session; the methods papers are cited instead.</p>' +
      '</section>' +

      '<section class="lx-qs" aria-label="Questions"><h3 class="lx-h3">Check yourself</h3>' +
      ui.reveal('Predict: sap at 18 % sucrose (Π about 1.59 MPa), sink at 0.59 MPa. The xylem goes from −0.50 MPa in the morning to −1.00 MPa at midday. What happens to the flow? Then drag the xylem slider to −1.00 MPa.',
        '<p>It stops. Source turgor = −1.00 + 1.59 = 0.59 MPa, the same as the sink: no push is left. A real leaf answers by loading more sugar or other osmolytes, which is why phloem sap gets more concentrated as plants dry, until viscosity becomes the limit.</p>', { choices: [
          ['It stops: the source turgor falls to the sink turgor', true, '−1.00 + 1.59 = 0.59 MPa, equal to the sink.'],
          ['It slows a little', false, 'The push was only 0.50 MPa; losing 0.50 MPa takes all of it.'],
          ['It speeds up, because the xylem pulls harder', false, 'The xylem pulls water away from the sieve tube, not sugar along it.']] }) +
      '<div class="tier-2">' + ui.reveal('Explain: in 3.2, why is the solid curve always below the dashed one, and why does the gap widen as sugar rises?',
        '<p>Both curves get the same push from the same sugar. The dashed one pretends the sap stays as thin as water; the solid one pays for the real thickness of sugary sap, which climbs with every percent. In this model the push still wins up to 32 %, but a published model argues that very high loading raises viscosity enough to block transport.</p>') + '</div>' +
      '</section>' +
      ui.quiz('xylem');
    A1 = ui.anim(el.querySelector('#px-th'), { height: function (w) { return w < 640 ? 600 : 400; }, label: 'Drawing of a stem with a blue xylem column carrying water up on the left and a gold phloem column carrying sugar down on the right, the cambium between. Water crosses from the xylem into the phloem near the leaf and back near the root. Two graphs show the source turgor and the sap speed falling as the xylem water potential becomes more negative, with a grey band where flow stops.', draw: draw1 });
    A2 = ui.anim(el.querySelector('#px-th2'), { height: function (w) { return w < 600 ? 320 : 300; }, label: 'Graph of sap speed against sugar concentration for wet, present and dry xylem. Each curve rises to a peak and then falls; the peak shifts to higher sugar and lower speed as the xylem dries.', draw: draw2 });
    var pb = el.querySelector('#px-pause');
    pb.addEventListener('click', function () { var p = !A1.paused(); A1.pause(p); pb.setAttribute('aria-pressed', p ? 'true' : 'false'); pb.textContent = p ? 'Play' : 'Pause'; });
    if (window.PlaySpeed) pb.parentNode.insertBefore(window.PlaySpeed.chip('ps-light'), pb.nextSibling);
    el.querySelector('#px-reset').addEventListener('click', function () { PP.reset(); });
    SLD.forEach(function (x) { var i = el.querySelector('#' + x[0]); i.addEventListener('input', function () { var o = {}; o[x[1]] = +i.value; PP.set(o); }); });
    el.addEventListener('click', function (e) {
      var f = e.target.closest('[data-pxf]');
      if (f) { if (bundle && bundle.ctx && bundle.ctx.orbit) { var hh = document.getElementById('px-hero'); if (hh) hh.scrollIntoView({ behavior: ui.reducedMotion() ? 'auto' : 'smooth', block: 'start' }); bundle.ctx.orbit.focus(f.getAttribute('data-pxf')); } return; }
      var b = e.target.closest('[data-px]'); if (!b) return;
      var k = b.getAttribute('data-px');
      if (k === 'night') PP.set({ psiX: -0.2 });
      else if (k === 'morning') PP.set({ psiX: -0.5 });
      else if (k === 'noon') PP.set({ psiX: -0.8 });
      else if (k === 'drought') PP.set({ psiX: -1.4 });
      else if (k === 'load') PP.set({ conc: Math.min(32, S().conc + 4) });
      else if (k === 'restore') { var cr = concFor(S(), S().psiX, P_MORNING); PP.set({ conc: cr == null ? 32 : Math.round(cr * 2) / 2 }); }
    });
    var hostH = el.querySelector('#px-hero');
    bundle = PP.bundle3d(hostH, {
      id: 'px-hero', seed: 91, palette: PP.bundle3d.palette,
      label: 'Three dimensional view of a vascular bundle standing upright. On the left three blue glass xylem vessels with ring thickenings and pits carry water molecules upward. On the right two gold sieve tubes, divided by sieve plates and each with an orange companion cell, carry green sucrose molecules downward; the glass is warm where the pressure is high near the leaf at the top and cool near the root at the bottom. A thin green cambium sheet lies between, and rows of ray cells cross it. Near the top water molecules glow as they move from the xylem into the phloem; near the bottom they move back.',
      question: 'Where does the phloem get its water?',
      answer: 'From the xylem next door. Near the leaf the sieve tube is full of sugar, so water flows in from the xylem until the water potential on both sides is equal; the turgor that pushes sugar is then <b>xylem Ψ + Π of the sap</b>. Near the root the water leaves again and goes back up in the xylem. When the xylem dries at midday, that push shrinks. Drag the xylem slider below and watch the sieve tubes cool and the sugar slow.',
      credit: { text: 'Nikinmaa et al. · Plant Cell Environ 2013', doi: '10.1111/pce.12004' },
      fallbackNote: 'This 3D scene needs WebGL, which this browser does not offer. The drawing in 3.1 below shows the same two pipes and the water crossing between them.',
      live: liveLine,
      focus: PP.bundle3d.focus()
    });
    if ('IntersectionObserver' in window) { var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); bundle.init(); } }, { rootMargin: '200px' }); io.observe(hostH); } else bundle.init();
  }
  function update(st, res) {
    if (!document.getElementById('px-now')) return;
    U();
    document.getElementById('px-now').textContent = nowText();
    var cap = document.getElementById('px-cap'); if (cap) cap.textContent = capText();
    SLD.forEach(function (x) { var i = document.getElementById(x[0]); if (!i) return; if (document.activeElement !== i) i.value = st[x[1]]; var o = document.getElementById(x[0] + '-o'); if (o) o.textContent = x[6](st[x[1]]); });
    setTile('px-t-psi', num(st.psiX, 2)); setTile('px-t-psrc', num(res.Psrc, 2)); setTile('px-t-u', num(res.U, 0));
    setTile('px-t-pi', num(res.Pi, 2)); setTile('px-t-stop', num(stopPsi(res), 2)); setTile('px-t-best', pct(needConc(st, st.psiX)));
    setTile('px-t-eta', num(res.eta, 2)); setTile('px-t-dp', num(res.dP, 2)); setTile('px-t-bu', pct(concFor(st, st.psiX, P_MORNING)));
    var tb = document.getElementById('px-tab');
    if (tb && ui.tier() === 3) tb.innerHTML = [0, -0.25, -0.5, -0.75, -1, -1.5, -2].map(function (p) {
      var r = PP.solve(Object.assign({}, st, { psiX: p }));
      return '<tr><td class="mono">' + num(p, 2) + ' MPa</td><td class="mono">' + num(r.Psrc, 2) + ' MPa</td><td class="mono">' + num(r.U, 0) + ' µm s⁻¹</td><td class="mono">' + pct(needConc(st, p)) + ' %</td><td class="mono">' + pct(concFor(st, p, P_MORNING)) + ' %</td></tr>';
    }).join('');
    if (bundle) bundle.update();
    if (A1) A1.redraw(); if (A2) A2.redraw();
  }

  PP.showme.xylem = [
    { at: '#px-hero', say: 'Two pipes side by side: water rises in the blue xylem, sugar falls in the gold phloem. Watch the water cross over near the leaf.', wait: 6500 },
    { at: '#px-live', fn: function () { PP.set({ psiX: -0.2 }); }, say: 'Night: the xylem is nearly full, the leaf end of the sieve tube has a strong push.', wait: 6000 },
    { at: '#px-live', fn: function () { PP.set({ psiX: -0.8 }); }, say: 'Midday: transpiration pulls the xylem down and the push shrinks one for one.', wait: 6500 },
    { at: '#px-live', fn: function () { PP.set({ psiX: -1.4 }); }, say: 'Midday in a drought: no push is left and the sugar stalls.', wait: 6500 },
    { at: '#px-live', fn: function () { PP.set({ psiX: -1.4, conc: 26 }); }, say: 'The leaf loads more sugar: the osmotic pull wins water back and the flow returns, through thicker sap.', wait: 7000 },
    { at: '#px-opt', fn: function () { PP.reset(); }, say: 'More sugar buys speed, but thickness takes a growing share of it. Find the least sugar that keeps a drought leaf moving.', wait: 5000 }
  ];

  PP.panels.push({
    id: 'xylem', mount: mount, update: update,
    show: function () { if (A1) { A1.resize(); A1.kick(); } if (A2) { A2.resize(); A2.kick(); } if (bundle && bundle.ctx) { bundle.update(); } },
    hide: function () {}
  });
})();

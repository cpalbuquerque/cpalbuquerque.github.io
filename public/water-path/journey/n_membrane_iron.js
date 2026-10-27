/* The Water Path v8: n_membrane_iron.js (nutrient path, Plate V): the two iron strategies.
   Loaded by n_membrane.js (WP.nutrient.load('membrane_iron')). Defines WPNM.iron(host, lib, wpState) -> {ws, solute(s)}.
   A root epidermal cell membrane with the soil solution above it.
     Strategy I (dicot): AHA2 pumps H+ out, FRO2 reduces Fe(III) to Fe(II), IRT1 carries Fe(II) in. Cd2+ can slip in by IRT1.
     Strategy II (grass): phytosiderophores are released, chelate Fe(III), the whole Fe(III) phytosiderophore goes in by YS1.
   Controls: soil pH, plant type (dicot or grass), cadmium in the soil, and a button that sends one cadmium ion.
   Every uptake value is ILLUSTRATIVE (shape and direction only). The only numbers with a source are the 1000 fold
   per pH unit for free Fe3+ (DERIVED from Fe(OH)3 + 3H+ = Fe3+ + 3H2O) and the 100 to 1000 times faster uptake from
   Fe(III) phytosiderophores in barley (MEASURED, Römheld & Marschner 1986). */
(function () {
  'use strict';
  var NM = window.WPNM = window.WPNM || {};

  /* ILLUSTRATIVE uptake shapes against bulk soil pH. Strategy II is "less inhibited by high pH" (Römheld & Marschner 1986). */
  function U1(pH) { return 0.9 / (1 + Math.exp(2.0 * (pH - 6.9))); }
  function U2(pH) { return 0.9 / (1 + Math.exp(1.5 * (pH - 9.4))); }
  var ACID = 1.0;        // ILLUSTRATIVE: how much more acid the root surface is than the bulk soil in Strategy I (pH units)
  function surfPH(s) { return s.plant === 'dicot' ? s.pH - ACID : s.pH; }
  function level(u) { return u > 0.6 ? 'high' : (u > 0.25 ? 'medium' : 'low'); }
  function fmtPH(v) { return 'pH ' + (+v).toFixed(1); }

  /* soil solution tint by pH: acid warm, neutral sand, alkaline blue (colour is never the only cue: pH is written) */
  var PHC = [[4.5, [224, 122, 58]], [6.5, [207, 194, 122]], [8.5, [90, 138, 208]]];
  function phRGB(pH) {
    pH = Math.max(4.5, Math.min(8.5, pH));
    var a = PHC[0], b = PHC[1];
    if (pH > 6.5) { a = PHC[1]; b = PHC[2]; }
    var f = (pH - a[0]) / (b[0] - a[0]);
    return [0, 1, 2].map(function (k) { return a[1][k] + (b[1][k] - a[1][k]) * f; });
  }

  NM.iron = function (host, L, wpState) {
    var WS = window.WS;
    var DOI = function (d) { return '<a href="https://doi.org/' + d + '" target="_blank" rel="noopener">doi ' + d + '</a>'; };
    var why =
      '<div class="nm-why">' +
      '<p><b>Why iron is hard to get.</b> Most soil iron is <b>Fe(III)</b> in rusty oxides that hardly dissolve. For Fe(OH)₃ + 3H⁺ ⇌ Fe³⁺ + 3H₂O the free Fe³⁺ goes down about <b>1000 fold for each pH unit up</b> ' + WS.badge('DERIVED', 'From the reaction: three protons per Fe3+, so log Fe3+ = log K minus 3 pH.') + '. So a slightly alkaline soil holds very little free iron. Plants solve this in two ways, first named Strategy I and Strategy II by Römheld &amp; Marschner (1986, Plant Physiol 80: 175, ' + DOI('10.1104/pp.80.1.175') + ').</p>' +
      '<p><b>Strategy I</b> (most plants that are not grasses). When iron is short, root cells pump out more protons (H⁺), which makes the soil at the root surface more acid; in Arabidopsis this is mainly the pump <b>AHA2</b> (Santi &amp; Schmidt 2009, New Phytol 183: 1072, ' + DOI('10.1111/j.1469-8137.2009.02908.x') + '). A <b>reductase</b> in the membrane, <b>FRO2</b>, gives an electron to Fe(III) and so makes Fe(II) (Robinson et al. 1999, Nature 397: 694, ' + DOI('10.1038/17800') + '). <b>IRT1</b> carries the Fe(II) into the cell; it was first described as a probable Fe(II) transporter (Eide et al. 1996, PNAS 93: 5624, ' + DOI('10.1073/pnas.93.11.5624') + ').</p>' +
      '<p><b>Strategy II</b> (grasses). Roots release <b>phytosiderophores</b>, small molecules that grab Fe(III) (they <b>chelate</b> it, holding it like a claw). The whole Fe(III) phytosiderophore is then taken in, with no reduction. In maize the carrier is <b>YS1</b>, named after the yellow stripe mutant that cannot take it up (Curie et al. 2001, Nature 409: 346, ' + DOI('10.1038/35053080') + '). In barley, iron uptake from Fe(III) phytosiderophores was <b>100 to 1000 times faster</b> than from synthetic iron chelates ' + WS.badge('MEASURED', 'Römheld and Marschner 1986, barley roots.') + ', and Strategy II is less inhibited by high pH (Römheld &amp; Marschner 1986).</p>' +
      '<p><b>The sting.</b> IRT1 is not perfectly choosy. Arabidopsis plants that made more IRT1 protein accumulated more <b>cadmium</b> and zinc than normal plants, so IRT1 is responsible for taking up these metals (Connolly et al. 2002, Plant Cell 14: 1347, ' + DOI('10.1105/tpc.001263') + '). Rogers et al. (2000, PNAS 97: 12356, ' + DOI('10.1073/pnas.210214197') + ') also describe IRT1 as carrying other cations, including cadmium. Once inside, cadmium meets the root checkpoint: see <a href="#organ">Plate III, Organ</a>.</p>' +
      '<p><b>Expert depth.</b> Eide et al. 1996 showed only that cadmium inhibits Fe(II) uptake by IRT1 in yeast; the evidence that IRT1 carries cadmium in the plant is Connolly et al. 2002. The scene does not show how cadmium enters grass roots. The uptake curves, the acid zone of 1 pH unit and all particle counts are ' + WS.badge('ILLUSTRATIVE', 'Shapes and directions only.') + '; only their direction comes from the papers. The membrane and proteins are schematic, not traced structures.</p>' +
      '</div>';

    var ws = WS.create(host, {
      title: 'The two iron strategies',
      badge: 'ILLUSTRATIVE',
      what: 'A patch of the membrane of a root surface cell, with the soil solution above it. Plants use one of two tool kits to get iron out of rusty soil.',
      todo: 'Slide the <b>soil pH</b> and watch the iron. Switch between a <b>dicot</b> and a <b>grass</b>. Turn on <b>cadmium</b>, or press <b>Send one cadmium ion</b>, and follow it.',
      thing: 'A model membrane drawn for this page: the lipid layer in blue beads, the aquaporin from the water plate on the left, and the iron transporters. Rust coloured lumps are iron oxide in the soil. Small yellow beads are protons (H⁺).',
      scanCaption: '<b>Root surface chemistry.</b> A model strip from the root surface (left) into the soil (right), drawn from the same model, not an image. The colour and the line show pH; squares are iron oxide, filled circles Fe(II), open rings phytosiderophores, rings with a core Fe(III) phytosiderophores, diamonds cadmium. ' + WS.badge('ILLUSTRATIVE', 'Counts and the 1 pH unit acid zone are invented.') + ' The 1000 fold more free Fe³⁺ in a zone 1 pH unit more acid is ' + WS.badge('DERIVED', 'From the solubility reaction, applied to the illustrative acid zone.'),
      plotCaption: '<b>Iron uptake against soil pH</b>, for each strategy. The cursor is your soil. ' + WS.badge('ILLUSTRATIVE', 'Qualitative shapes; the units are arbitrary. Direction from Römheld and Marschner 1986: Strategy II is less inhibited by high pH.'),
      why: why,
      state: { pH: 6.5, plant: 'dicot', cd: wpState && wpState.solute === 'cadmium', cdN: 0, cdGo: 0 },
      camera: { dist: 10.2, theta: 0.28, phi: 1.4, target: [0, 0.6, 0], minDist: 3.5, maxDist: 20 }
    });
    var S = ws.state;

    /* ---- controls */
    ws.range({ key: 'pH', label: 'Soil pH', min: 4.5, max: 8.5, step: 0.1, fmt: fmtPH, hint: 'lower is more acid, higher is more alkaline (like a limestone soil)' });
    ws.choice({ key: 'plant', label: 'Plant', options: [['dicot', 'Dicot · Strategy I'], ['grass', 'Grass · Strategy II']] });
    ws.toggle({ key: 'cd', label: 'Cadmium in the soil' });
    var cdBox = document.createElement('div'); cdBox.className = 'nm-c';
    cdBox.innerHTML = '<span class="nm-c-l">One ion at a time</span><button type="button" class="nm-btn">Send one cadmium ion</button><span class="nm-c-h">works with motion paused too</span>';
    ws.controls.appendChild(cdBox);
    var cdBtn = cdBox.querySelector('button');

    var cdBusy = false;
    var cdMsg = null;   // a one off message after a cadmium event, shown until the next control change

    /* ---- 3D */
    var g = ws.gl, sim = function () {}, sendCd = function () {}, clearAll = function () {};
    if (g) (function () {
      var T = g.THREE, root = g.root, V = function (x, y, z) { return new T.Vector3(x, y, z); };
      var rr = L.rng(5);
      var X = { aqp: -3.5, aha: -1.7, fro: 0.1, irt: 1.8, rel: -1.2, ys1: 1.2 };
      var bilD = L.bilayer(T, { d: 2.4, zc: -0.9, holes: [{ x: X.aqp, r: 0.66 }, { x: X.aha, r: 0.62 }, { x: X.fro, r: 0.58 }, { x: X.irt, r: 0.55 }], seed: 3 });
      var bilG = L.bilayer(T, { d: 2.4, zc: -0.9, holes: [{ x: X.aqp, r: 0.66 }, { x: X.rel, r: 0.5 }, { x: X.ys1, r: 0.62 }], seed: 3 });
      root.add(bilD); root.add(bilG);
      var aqp = L.aquaporin(T); aqp.position.x = X.aqp; root.add(aqp);

      /* soil solution: a faint tinted box above the membrane */
      var tintM = new T.MeshBasicMaterial({ color: 0xcfc27a, transparent: true, opacity: 0.09, depthWrite: false, side: T.BackSide });
      var tint = new T.Mesh(new T.BoxGeometry(9.2, 2.6, 3.4), tintM); tint.position.y = 0.75 + 1.3; tint.renderOrder = -1; root.add(tint);
      var cytoM = new T.MeshBasicMaterial({ color: 0x9fc58a, transparent: true, opacity: 0.07, depthWrite: false, side: T.BackSide });
      var cyto = new T.Mesh(new T.BoxGeometry(9.2, 1.7, 3.4), cytoM); cyto.position.y = -0.75 - 0.85; cyto.renderOrder = -1; root.add(cyto);

      /* rust: iron oxide lumps in the soil */
      var rustM = new T.MeshStandardMaterial({ color: 0x8a3f1c, roughness: 0.95, flatShading: true });
      var rustG = new T.DodecahedronGeometry(1, 0), rusts = [];
      [[-2.6, 2.6, -1.1], [-0.6, 2.9, 0.9], [0.9, 2.4, -1.3], [2.8, 2.8, 0.6], [3.7, 2.2, -0.8], [-3.9, 2.3, 1.2], [1.9, 3.05, 1.2], [-1.5, 2.2, -1.3]].forEach(function (p, i) {
        var m = new T.Mesh(rustG, rustM); m.position.set(p[0], p[1], p[2]); m.scale.setScalar(0.2 + (i % 3) * 0.05); m.rotation.set(i, i * 2, i * 3); root.add(m); rusts.push(m);
      });

      /* Strategy I proteins */
      var grpD = new T.Group(), grpG = new T.Group(); root.add(grpD); root.add(grpG);
      var aha = L.carrier(T, { r: 0.5, color: 0x8f93d6 }); aha.position.x = X.aha; grpD.add(aha);
      var ahaHead = new T.Mesh(new T.SphereGeometry(0.42, 20, 14), aha.material); ahaHead.scale.set(1, 0.7, 1); ahaHead.position.set(X.aha, -1.12, 0); grpD.add(ahaHead);
      var fro = L.carrier(T, { r: 0.46, color: 0x6fa35a }); fro.position.x = X.fro; grpD.add(fro);
      var froHead = new T.Mesh(new T.SphereGeometry(0.3, 18, 12), fro.material); froHead.position.set(X.fro, -1.05, 0); grpD.add(froHead);
      var irt = L.carrier(T, { r: 0.42, color: 0xd08a3a }); irt.position.x = X.irt; grpD.add(irt);
      var chanM = new T.MeshBasicMaterial({ color: 0xffe0a0, transparent: true, opacity: 0.6, depthWrite: false });
      var chan = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 1.8, 8, 1, true), chanM); chan.position.x = X.irt; chan.renderOrder = 4; grpD.add(chan);
      var eM = new T.MeshBasicMaterial({ color: 0x40d8ff });
      var eDot = new T.Mesh(new T.SphereGeometry(0.07, 10, 8), eM); eDot.visible = false; grpD.add(eDot);
      /* Strategy II proteins */
      var rel = L.carrier(T, { r: 0.36, color: 0x9a9aa8 }); rel.position.x = X.rel; grpG.add(rel);
      var ys1 = L.carrier(T, { r: 0.5, color: 0x3f9a96 }); ys1.position.x = X.ys1; grpG.add(ys1);

      /* tags */
      var tags = new T.Group(); root.add(tags);
      function tag(text, x, y, z, o) { var t = L.tag(T, text, o); t.position.set(x, y, z || 0); tags.add(t); return t; }
      var tSoil = tag('outside: soil solution, pH 6.5', -2.2, 3.55, -1.4);
      tag('cytosol, inside the cell', -2.8, -2.25, 0.6);
      tag('aquaporin (water)', X.aqp, -1.5, 0.4);
      var tAha = tag('AHA2 H⁺ pump', X.aha, -1.78, 0.2), tFro = tag('FRO2 reductase', X.fro, -1.05, 0.4), tIrt = tag('IRT1 carrier', X.irt + 0.5, -1.78, 0.2);
      var tRel = tag('phytosiderophore release', X.rel, -1.5, 0.4), tYs = tag('YS1 carrier', X.ys1 + 0.2, -1.78, 0.2);
      var tRust = tag('iron oxide (rust)', 2.4, 3.3, 0.6);
      [tAha, tFro, tIrt].forEach(function (t) { t.userData.mode = 'dicot'; });
      [tRel, tYs].forEach(function (t) { t.userData.mode = 'grass'; });

      /* particles */
      var hG = new T.SphereGeometry(0.065, 8, 6), hM = new T.MeshStandardMaterial({ color: 0xffd23a, emissive: 0x6a5200, emissiveIntensity: 0.6, roughness: 0.3 });
      var feG = new T.SphereGeometry(0.11, 14, 10);
      var fe3M = new T.MeshStandardMaterial({ color: 0xb4501e, roughness: 0.45 });
      var fe2M = new T.MeshStandardMaterial({ color: 0xa8e090, emissive: 0x2a5a1a, emissiveIntensity: 0.5, roughness: 0.35 });
      var psG = new T.TorusGeometry(0.12, 0.04, 8, 18), psM = new T.MeshStandardMaterial({ color: 0x9a7fd0, roughness: 0.4 });
      var cdG = new T.OctahedronGeometry(0.15, 0), cdM = new T.MeshStandardMaterial({ color: 0xd04fc8, emissive: 0x5a0a58, emissiveIntensity: 0.8, roughness: 0.3 });
      var trailM = new T.LineBasicMaterial({ color: 0xd04fc8, transparent: true, opacity: 0.85 });
      var movers = [], parked = [];
      function add(obj, legs, kind) { root.add(obj); var m = new L.Mover(obj, legs); m.kind = kind; movers.push(m); return m; }
      function rnd(a, b) { return a + (b - a) * rr(); }

      function spawnH() {
        var m = new T.Mesh(hG, hM); m.position.set(X.aha + rnd(-0.12, 0.12), 0.9, rnd(-0.12, 0.12));
        add(m, [{ to: V(rnd(-3.6, 2.8), rnd(0.85, 1.4), rnd(-1.5, 1.5)), d: 2.4 }, { d: 3.0, each: function (o, u) { o.scale.setScalar(1 - u); } }], 'h');
      }
      function spawnFe() {
        var src = rusts[Math.floor(rr() * rusts.length)].position;
        var m = new T.Mesh(feG, fe3M); m.position.copy(src);
        add(m, [
          { to: V(X.fro + 0.05, 1.02, 0.28), d: 2.4, wig: 0.15 },
          { d: 0.5, fn: function (o) { o.material = fe2M; eDot.visible = false; }, each: function (o, u) { eDot.visible = true; eDot.position.set(X.fro, -0.8 + 1.7 * u, 0.2); } },
          { to: V(X.irt, 1.02, 0), d: 0.8 },
          { to: V(X.irt, -1.0, 0), d: 1.0, lin: true },
          { to: V(X.irt + rnd(-0.6, 0.6), -1.95, rnd(-0.8, 0.8)), d: 1.0 },
          { d: 0.8, each: function (o, u) { o.scale.setScalar(1 - u); } }
        ], 'fe');
      }
      function spawnPS() {
        var dst = rusts[Math.floor(rr() * rusts.length)].position, m = new T.Group();
        var claw = new T.Mesh(psG, psM); m.add(claw); m.position.set(X.rel, 0.95, 0);
        add(m, [
          { to: dst.clone().add(V(0, -0.25, 0)), d: 2.6, wig: 0.2, each: function (o, u) { o.rotation.y = u * 6; } },
          { d: 0.35, fn: function (o) { o.add(new T.Mesh(feG, fe3M)); } },
          { to: V(X.ys1, 1.05, 0), d: 2.2, wig: 0.15 },
          { to: V(X.ys1, -1.0, 0), d: 1.0, lin: true },
          { to: V(X.ys1 + rnd(-0.6, 0.6), -1.95, rnd(-0.8, 0.8)), d: 1.0 },
          { d: 0.8, each: function (o, u) { o.scale.setScalar(1 - u); } }
        ], 'ps');
      }
      /* cadmium: in the dicot it slips in through IRT1 and stays in the cytosol with its trail; in the grass it only wanders */
      function cdIon() { var m = new T.Mesh(cdG, cdM); var lab = L.tag(T, 'Cd²⁺', { h: 0.2, edge: 'warm' }); lab.position.set(0, 0.3, 0); m.add(lab); return m; }
      var cdWander = [];
      function wanderers(on) {
        while (cdWander.length < (on ? 2 : 0)) {
          var m = cdIon(); m.position.set(rnd(-3, 3.5), rnd(1.6, 3.0), rnd(-1.2, 1.2)); root.add(m); cdWander.push({ m: m, a: rr() * 6 });
        }
        while (cdWander.length > (on ? 2 : 0)) { var w = cdWander.pop(); root.remove(w.m); }
      }
      sendCd = function (instant) {
        var start = V(3.4, 2.7, 0.5), top = V(X.irt, 1.05, 0), bot = V(X.irt, -1.0, 0), end = V(X.irt + 1.2 + parked.length * 0.45, -1.2, 0.7);
        var m = cdIon(); m.position.copy(start);
        var tr = new T.Line(new T.BufferGeometry().setFromPoints([start, top, bot, end]), trailM); tr.visible = false; root.add(tr);
        var mv = add(m, [
          { to: top, d: 2.2, wig: 0.1 },
          { to: bot, d: 1.2, lin: true, fn: function () { tr.visible = true; } },
          { to: end, d: 1.0, fn: function (o) { parked.push({ m: o, tr: tr }); if (parked.length > 3) { var p = parked.shift(); root.remove(p.m); root.remove(p.tr); } cdEvent(); } }
        ], 'cd');
        cdBusy = true; ws.set({ cdGo: ws.state.cdGo + 1 }); cdBusy = false;
        if (!instant) ws.say('<b>A cadmium ion (Cd²⁺) is heading for IRT1.</b> Watch the pink diamond.');
        if (instant) { while (!mv.done) stepMover(mv, 0.1); }
        ws.invalidate();
      };
      function stepMover(mv, dt) { if (mv.step(dt)) { var i = movers.indexOf(mv); if (i >= 0) movers.splice(i, 1); if (mv.kind !== 'cd') root.remove(mv.obj); } }
      clearAll = function (kinds) {
        movers.slice().forEach(function (mv) { if (kinds.indexOf(mv.kind) >= 0) { movers.splice(movers.indexOf(mv), 1); root.remove(mv.obj); } });
      };

      var tH = 0, tFe = 0, tPS = 0, tCd = 4;
      sim = function (dt) {
        var s = ws.state, dic = s.plant === 'dicot';
        aqp.userData.water(simT += dt);
        if (dic) {
          tH += dt; while (tH > 0.32) { tH -= 0.32; if (movers.length < 70) spawnH(); }
          tFe += dt; var iv = 1.5 / Math.max(0.03, U1(s.pH)); while (tFe > iv) { tFe -= iv; spawnFe(); }
          if (s.cd) { tCd += dt; if (tCd > 9) { tCd = 0; sendCd(false); } }
        } else {
          tPS += dt; var iv2 = 1.6 / Math.max(0.03, U2(s.pH)); while (tPS > iv2) { tPS -= iv2; spawnPS(); }
        }
        cdWander.forEach(function (w) { w.a += dt * 0.6; w.m.position.x += Math.sin(w.a) * dt * 0.25; w.m.position.y += Math.cos(w.a * 1.3) * dt * 0.12; });
        movers.slice().forEach(function (mv) { stepMover(mv, dt); });
      };
      var simT = 0;
      function prewarm(sec) { for (var k = 0; k < sec * 10; k++) sim(0.1); }

      ws.onFrame(function (t, dt) { sim(dt); });
      ws.onTheme(function (dark) {
        L.theme(root, dark);
        rustM.color.set(dark ? 0xb0582a : 0x8a3f1c);
        cytoM.opacity = dark ? 0.1 : 0.07;
      });
      var lastMode = null;
      ws.on(function (s) {
        var dic = s.plant === 'dicot';
        grpD.visible = bilD.visible = dic; grpG.visible = bilG.visible = !dic;
        tags.children.forEach(function (t) { if (t.userData.mode) t.visible = t.userData.mode === s.plant; });
        var c = phRGB(s.pH); tintM.color.setRGB(c[0] / 255, c[1] / 255, c[2] / 255);
        tSoil.userData.redraw('outside: soil solution, ' + fmtPH(s.pH));
        wanderers(s.cd && !dic);
        if (!s.cd && parked.length) { parked.forEach(function (p) { root.remove(p.m); root.remove(p.tr); }); parked = []; clearAll(['cd']); }
        if (lastMode !== s.plant) {
          clearAll(dic ? ['ps'] : ['h', 'fe', 'cd']);
          if (!dic) { parked.forEach(function (p) { root.remove(p.m); root.remove(p.tr); }); parked = []; }
          lastMode = s.plant;
          prewarm(6);
        }
      });
      lastMode = S.plant; prewarm(8);
    })();

    function cdEvent() {
      cdBusy = true;
      ws.set({ cdN: ws.state.cdN + 1, cdGo: Math.max(0, ws.state.cdGo - 1) });
      cdBusy = false;
      cdMsg = '<b>A cadmium ion (Cd²⁺) just slipped in through IRT1.</b> The iron carrier is not perfectly choosy. Cadmium ions that got in so far: <b>' + ws.state.cdN + '</b>. Inside, cadmium heads for the root checkpoint on <a href="#organ">Plate III</a>.';
      ws.say(cdMsg);
    }
    cdBtn.addEventListener('click', function () {
      var s = ws.state;
      if (s.plant !== 'dicot') { cdMsg = null; ws.say('The cadmium step is shown for <b>IRT1</b>, the Strategy I iron carrier. Switch the plant to <b>Dicot</b> to send a cadmium ion. How cadmium enters grass roots is not shown on this plate.'); return; }
      if (!s.cd) ws.set({ cd: true });
      if (ws.gl) {
        var paused = ws.el.querySelector('.ws-pause').getAttribute('aria-pressed') === 'true';
        sendCd(paused);
      } else cdEvent();
    });

    ws.on(function (s) {
      var off = s.plant !== 'dicot';
      cdBtn.disabled = off; cdBtn.setAttribute('aria-disabled', off ? 'true' : 'false');
      cdBox.querySelector('.nm-c-h').textContent = off ? 'only for the dicot: IRT1 is a Strategy I carrier' : 'works with motion paused too';
    });

    /* ---- the readout */
    ws.on(function (s) {
      if (cdBusy) return;
      cdMsg = null;
      var dic = s.plant === 'dicot', u = dic ? U1(s.pH) : U2(s.pH), msg;
      if (dic) {
        msg = 'At <b>' + fmtPH(s.pH) + '</b> the dicot root pumps out protons, so its surface is more acid, about ' + fmtPH(surfPH(s)) + ' in this model. FRO2 turns Fe(III) into Fe(II), and IRT1 carries the Fe(II) in. Iron uptake: <b>' + level(u) + '</b> (model).';
        if (s.pH >= 7.6) msg += ' In alkaline soil even the acid zone frees little iron.';
        if (s.cd) msg += ' Cadmium is in the soil: IRT1 lets some in too.';
      } else {
        msg = 'At <b>' + fmtPH(s.pH) + '</b> the grass root releases phytosiderophores. They grab Fe(III), and YS1 takes the whole package in. No acid step is needed, so high pH slows it much less. Iron uptake: <b>' + level(u) + '</b> (model).';
        if (s.cd) msg += ' Cadmium is in the soil, but its way into grass roots is not shown here.';
      }
      ws.say(msg);
    });

    /* ---- the scan: root surface chemistry */
    var seeds = (function () { var r = L.rng(21), a = []; for (var i = 0; i < 60; i++) a.push([r(), r(), r()]); return a; })();
    ws.paintScan(function (c, w, h, s) {
      var dic = s.plant === 'dicot', dark = WS.isDark();
      var top = 40, bot = h - 22, band = 22, fieldW = w - band;
      var lam = 0.22;   // ILLUSTRATIVE width of the acid zone, as a fraction of the strip
      function pHat(f) { return s.pH - (dic ? ACID * Math.exp(-f / lam) : 0); }
      /* pH colour across the strip */
      var gr = c.createLinearGradient(band, 0, w, 0);
      for (var k = 0; k <= 8; k++) { var f = k / 8, col = phRGB(pHat(f)); if (dark) col = col.map(function (v) { return v * 0.45; }); gr.addColorStop(f, 'rgb(' + col.map(Math.round).join(',') + ')'); }
      c.fillStyle = WS.token('card2'); c.fillRect(0, 0, w, h);
      c.globalAlpha = dark ? 1 : 0.55; c.fillStyle = gr; c.fillRect(band, top, fieldW, bot - top); c.globalAlpha = 1;
      /* the root */
      c.fillStyle = WS.token('leaf3'); c.fillRect(0, top, band, bot - top);
      c.strokeStyle = WS.token('ink'); c.lineWidth = 1.5; c.beginPath(); c.moveTo(band, top); c.lineTo(band, bot); c.stroke();
      /* local pH line, in the upper third of the field */
      var py0 = top + 6, py1 = top + (bot - top) * 0.36;
      function Yp(p) { return py0 + (8.8 - p) / 4.6 * (py1 - py0); }
      c.strokeStyle = WS.token('ink'); c.lineWidth = 2; c.beginPath();
      for (k = 0; k <= 40; k++) { var ff = k / 40, xx = band + ff * fieldW, yy = Yp(pHat(ff)); if (k) c.lineTo(xx, yy); else c.moveTo(xx, yy); }
      c.stroke();
      /* particles in the lower part */
      var ly0 = py1 + 10, ly1 = bot - 6;
      function P(i, fx0, fx1) { var q = seeds[i % seeds.length]; return [band + 6 + (fx0 + q[0] * (fx1 - fx0)) * (fieldW - 12), ly0 + q[1] * (ly1 - ly0)]; }
      var i, p;
      c.lineWidth = 1.2; c.strokeStyle = WS.token('ink');
      for (i = 0; i < 7; i++) { p = P(i, 0.3, 1); c.fillStyle = dark ? '#b0582a' : '#8a3f1c'; c.fillRect(p[0] - 5, p[1] - 5, 10, 10); c.strokeRect(p[0] - 5, p[1] - 5, 10, 10); }
      if (dic) {
        var nFe = Math.round(10 * U1(s.pH));
        for (i = 0; i < nFe; i++) { p = P(i + 10, 0, 0.25); c.beginPath(); c.arc(p[0], p[1], 4.5, 0, 6.283); c.fillStyle = '#a8e090'; c.fill(); c.stroke(); }
        for (i = 0; i < 14; i++) { p = P(i + 25, 0, 0.3); c.beginPath(); c.arc(p[0], p[1], 2, 0, 6.283); c.fillStyle = '#e8b800'; c.fill(); }
      } else {
        for (i = 0; i < 12; i++) { p = P(i + 10, 0, 0.7); c.beginPath(); c.arc(p[0], p[1], 4.5, 0, 6.283); c.strokeStyle = dark ? '#c9b3f0' : '#6a4fa0'; c.lineWidth = 2; c.stroke(); }
        var nC = Math.round(8 * U2(s.pH));
        for (i = 0; i < nC; i++) { p = P(i + 30, 0, 0.3); c.beginPath(); c.arc(p[0], p[1], 5.5, 0, 6.283); c.strokeStyle = dark ? '#c9b3f0' : '#6a4fa0'; c.lineWidth = 2; c.stroke(); c.beginPath(); c.arc(p[0], p[1], 2.6, 0, 6.283); c.fillStyle = '#b4501e'; c.fill(); }
      }
      function diamond(x, y) { c.beginPath(); c.moveTo(x, y - 5.5); c.lineTo(x + 5, y); c.lineTo(x, y + 5.5); c.lineTo(x - 5, y); c.closePath(); c.fillStyle = '#d04fc8'; c.fill(); c.strokeStyle = WS.token('ink'); c.lineWidth = 1; c.stroke(); }
      if (s.cd) { for (i = 0; i < 4; i++) { p = P(i + 45, 0.15, 0.95); diamond(p[0], p[1]); } }
      if (dic) for (i = 0; i < Math.min(6, s.cdN); i++) diamond(band / 2, ly0 + 6 + i * 12);
      if (dic) for (i = 0; i < Math.min(3, s.cdGo); i++) diamond(band + 9, ly1 - 4 - i * 13);
      /* text rows: kept clear of the marks */
      c.fillStyle = WS.token('ink2'); c.font = '11px ' + WS.token('ui');
      c.fillText('model rendering, not an image', 6, 13);
      c.fillStyle = WS.token('ink'); c.font = '600 12px ' + WS.token('ui');
      c.fillText(dic ? 'surface ' + fmtPH(pHat(0)) + ' · bulk soil ' + fmtPH(s.pH) : 'surface and bulk soil ' + fmtPH(s.pH), 6, 31);
      c.font = '12px ' + WS.token('ui');
      c.fillText('root', 2, h - 6);
      c.textAlign = 'right';
      c.fillText(dic ? 'about 1000× more free Fe³⁺ at the surface' : 'phytosiderophores reach out to the rust', w - 6, h - 6);
      c.textAlign = 'left';
    });

    /* ---- the plot */
    ws.paintPlot(function (svg, s) {
      var ax = WS.axes(svg, { w: 360, h: 210, pad: { l: 46, r: 12, t: 34, b: 38 }, x: [4.5, 8.5], y: [0, 1], yticks: [0, 0.5, 1], xticks: [5, 6, 7, 8], xlabel: 'soil pH', ylabel: 'Fe uptake (model)' });
      var dic = s.plant === 'dicot', a = [], b = [];
      for (var i = 0; i <= 80; i++) { var p = 4.5 + i / 20; a.push([p, U1(p)]); b.push([p, U2(p)]); }
      ax.path(b, 'nm-l2' + (dic ? ' off' : ''));
      ax.path(a, 'nm-l1' + (dic ? '' : ' off'));
      var cur = WS.svg('line', { x1: ax.x(s.pH), x2: ax.x(s.pH), y1: ax.box.y0, y2: ax.y(1), 'class': 'ws-cursor' }, ax.g);
      ax.dot(s.pH, dic ? U1(s.pH) : U2(s.pH));
      /* legend above the plot area, out of the way of the curves and the cursor */
      var lg = WS.svg('g', { 'class': 'nm-legend' }, svg);
      WS.svg('path', { d: 'M50 12h22', 'class': 'nm-l1' + (dic ? '' : ' off') }, lg);
      WS.svg('text', { x: 76, y: 16, 'class': 'nm-leg' }, lg).textContent = 'Strategy I (dicot)';
      WS.svg('path', { d: 'M196 12h22', 'class': 'nm-l2' + (dic ? ' off' : '') }, lg);
      WS.svg('text', { x: 222, y: 16, 'class': 'nm-leg' }, lg).textContent = 'Strategy II (grass)';
      var note = s.cd ? (dic ? 'Cd²⁺ also enters by IRT1: ' + s.cdN + ' in' + (s.cdGo ? ', ' + s.cdGo + ' on its way' : ' so far') : 'Cd²⁺ in the soil; grass entry not shown') : 'thick line: your plant · dot: your soil';
      WS.svg('text', { x: 50, y: 30, 'class': 'nm-leg' }, lg).textContent = note;
      cur.setAttribute('aria-hidden', 'true');
    });

    /* ---- the flat drawing when WebGL is missing */
    ws.fallback(function (c, w, h, s) {
      var dic = s.plant === 'dicot', my = h * 0.55, th = 26;
      var col = phRGB(s.pH); c.fillStyle = 'rgba(' + col.map(Math.round).join(',') + ',0.35)'; c.fillRect(0, 0, w, my - th / 2);
      c.fillStyle = WS.token('w4'); c.fillRect(0, my - th / 2, w, th);
      c.fillStyle = WS.token('ink'); c.font = '12px ' + WS.token('ui');
      c.fillText('outside: soil solution, ' + fmtPH(s.pH), 8, 18);
      c.fillText('cytosol, inside the cell', 8, h - 72);
      var items = dic ? [['aquaporin', 0.12, '#6a9be3'], ['AHA2 H⁺ pump', 0.36, '#8f93d6'], ['FRO2', 0.6, '#6fa35a'], ['IRT1', 0.84, '#d08a3a']] : [['aquaporin', 0.12, '#6a9be3'], ['release', 0.42, '#9a9aa8'], ['YS1', 0.74, '#3f9a96']];
      items.forEach(function (it, k) {
        var x = it[1] * w;
        L.rrect(c, x - 16, my - 30, 32, 60, 10); c.fillStyle = it[2]; c.fill(); c.strokeStyle = WS.token('ink'); c.lineWidth = 1; c.stroke();
        c.fillStyle = WS.token('ink'); c.textAlign = 'center'; c.fillText(it[0], x, my + 48 + (k % 2) * 14); c.textAlign = 'left';
      });
      c.strokeStyle = WS.token('ink'); c.lineWidth = 2;
      function arrow(x0, y0, x1, y1) { c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); var a = Math.atan2(y1 - y0, x1 - x0); c.beginPath(); c.moveTo(x1, y1); c.lineTo(x1 - 7 * Math.cos(a - 0.5), y1 - 7 * Math.sin(a - 0.5)); c.moveTo(x1, y1); c.lineTo(x1 - 7 * Math.cos(a + 0.5), y1 - 7 * Math.sin(a + 0.5)); c.stroke(); }
      if (dic) {
        arrow(0.36 * w, my - 34, 0.36 * w, my - 64); c.fillText('H⁺ out', 0.36 * w + 6, my - 56);
        arrow(0.6 * w, my - 70, 0.6 * w, my - 34); c.fillText('Fe(III) → Fe(II)', 0.6 * w - 40, my - 76);
        arrow(0.84 * w, my - 50, 0.84 * w, my + 34); c.fillText('Fe(II) in', 0.84 * w - 60, my - 56);
        if (s.cd) { c.fillStyle = WS.token('ink'); c.fillText('Cd²⁺ in too' + (s.cdN ? ' (' + s.cdN + ' so far)' : ''), 0.84 * w - 40, my + 78); }
      } else {
        arrow(0.42 * w, my - 34, 0.42 * w, my - 64); c.fillText('phytosiderophores out', 0.42 * w - 50, my - 70);
        arrow(0.74 * w, my - 64, 0.74 * w, my + 34); c.fillText('Fe(III) phytosiderophore in', 0.74 * w - 100, my - 86);
        if (s.cd) c.fillText('Cd²⁺ in the soil: its way into grass roots is not shown', 8, 36);
      }
    });

    return {
      ws: ws,
      solute: function (sol) { if (sol === 'cadmium' && !ws.state.cd) ws.set({ cd: true }); }
    };
  };
})();

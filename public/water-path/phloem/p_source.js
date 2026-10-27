/* Sugar on the move: Plate I, The source leaf (phloem builder A, 14 Oct 2026).
   Hero (3D, PP.macro): a minor vein cut open in a leaf. Mesophyll, bundle sheath, phloem parenchyma, a companion cell,
   a sieve element with sieve plates and the xylem vessel beside it. Sucrose (and sorbitol in the almond, peach and apple
   family) walks from the mesophyll through plasmodesmata; in active loading it leaves the phloem parenchyma by SWEET into
   the cell wall space and comes back in by SUT with a proton; in passive loading it stays inside the cells; in the
   polymer trap it is built into raffinose in the intermediary cell. Water follows from the xylem into the sieve element.
   1.1 Three ways in: a 2D theatre of the same path (fallback for no WebGL and reduced motion), with sugar bars per cell.
   Only sources from night/sheets/phloem.json (PP.evidence keys 'ph.*', generated into engine.js). Drawn speeds are
   ILLUSTRATIVE; the ratios between cells are ILLUSTRATIVE values inside measured ranges (engine.js, PP.params.loadRatio). */
(function () {
  'use strict';
  var PP = window.PP = window.PP || {};
  PP.panels = PP.panels || [];
  PP.evidence = PP.evidence || {};
  PP.howto = PP.howto || {};
  PP.sources = PP.sources || {};
  PP.showme = PP.showme || {};
  var ui = null;
  function U() { return (ui = PP.ui); }
  function R() { return PP.result || {}; }
  function S() { return PP.state || {}; }
  function num(x, d) { return U().num(x, d); }
  var TAU = Math.PI * 2;

  /* ================================================================== shared kit (also used by p_sieve.js) */
  var KIT = PP.kit = PP.kit || {};
  KIT.COL = { suc: '#4fbf5f', suc2: '#a6e08a', sor: '#b48be0', raf: '#e06aa8', hp: '#ffd23f', wat: '#d9402f' };
  /* 2D glyphs */
  KIT.hexPath = function (c, x, y, r, n, rot) { c.beginPath(); for (var i = 0; i < n; i++) { var a = rot + i * TAU / n; if (i) c.lineTo(x + r * Math.cos(a), y + r * Math.sin(a)); else c.moveTo(x + r * Math.cos(a), y + r * Math.sin(a)); } c.closePath(); };
  KIT.sucrose = function (c, x, y, r, a) {
    c.save(); c.globalAlpha = a == null ? 1 : a; c.lineWidth = Math.max(1, r * 0.18); c.strokeStyle = 'rgba(20,60,25,.8)';
    KIT.hexPath(c, x - r * 0.62, y, r * 0.62, 6, 0); c.fillStyle = KIT.COL.suc; c.fill(); c.stroke();
    KIT.hexPath(c, x + r * 0.55, y + r * 0.08, r * 0.52, 5, -Math.PI / 2); c.fillStyle = KIT.COL.suc2; c.fill(); c.stroke();
    c.restore();
  };
  KIT.sorbitol = function (c, x, y, r, a) {
    c.save(); c.globalAlpha = a == null ? 1 : a; c.strokeStyle = 'rgba(70,40,110,.9)'; c.lineWidth = Math.max(1, r * 0.2);
    c.beginPath(); for (var i = 0; i < 6; i++) { var px = x - r + i * r * 0.4, py = y + (i % 2 ? r * 0.22 : -r * 0.22); if (i) c.lineTo(px, py); else c.moveTo(px, py); } c.stroke();
    c.fillStyle = KIT.COL.sor; for (i = 0; i < 6; i++) { c.beginPath(); c.arc(x - r + i * r * 0.4, y + (i % 2 ? r * 0.22 : -r * 0.22), r * 0.2, 0, TAU); c.fill(); }
    c.restore();
  };
  KIT.raffinose = function (c, x, y, r, a) {
    c.save(); c.globalAlpha = a == null ? 1 : a; c.lineWidth = Math.max(1, r * 0.16); c.strokeStyle = 'rgba(100,20,60,.8)';
    KIT.hexPath(c, x - r * 0.95, y, r * 0.5, 6, 0); c.fillStyle = KIT.COL.raf; c.fill(); c.stroke();
    KIT.hexPath(c, x, y, r * 0.5, 6, 0); c.fillStyle = KIT.COL.suc; c.fill(); c.stroke();
    KIT.hexPath(c, x + r * 0.9, y + r * 0.06, r * 0.42, 5, -Math.PI / 2); c.fillStyle = KIT.COL.suc2; c.fill(); c.stroke();
    c.restore();
  };
  KIT.proton = function (c, x, y, r) { c.fillStyle = KIT.COL.hp; c.strokeStyle = 'rgba(120,90,0,.8)'; c.lineWidth = 1; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.stroke(); };
  KIT.water = function (c, x, y, r) {
    c.fillStyle = '#f7f4ee'; c.beginPath(); c.arc(x - r * 0.8, y - r * 0.55, r * 0.55, 0, TAU); c.arc(x + r * 0.8, y - r * 0.55, r * 0.55, 0, TAU); c.fill();
    c.fillStyle = KIT.COL.wat; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  };
  KIT.pill = function (c, x, y, text, dark, size) {
    var fs = size || 11; c.save(); c.font = '600 ' + fs + 'px "IBM Plex Sans",system-ui,sans-serif';
    var w = c.measureText(text).width + 10, h = fs + 6;
    c.fillStyle = dark ? 'rgba(14,20,16,.85)' : 'rgba(255,253,246,.92)'; c.strokeStyle = dark ? 'rgba(255,255,255,.35)' : 'rgba(40,40,30,.35)';
    c.beginPath(); if (c.roundRect) c.roundRect(x - w / 2, y, w, h, h / 2); else c.rect(x - w / 2, y, w, h); c.fill(); c.stroke();
    c.fillStyle = dark ? '#f4f1e8' : '#1d2a22'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, x, y + h / 2 + 0.5); c.restore();
    return { x: x - w / 2, y: y, w: w, h: h };
  };
  /* 3D glyph geometries */
  KIT.geos = function (T, MM) {
    if (KIT._g && KIT._g.T === T) return KIT._g;
    var hex = new T.CylinderGeometry(1, 1, 0.42, 6), pen = new T.CylinderGeometry(1, 1, 0.42, 5), sph = new T.SphereGeometry(1, 8, 6), sphL = new T.SphereGeometry(1, 6, 4);
    var suc = MM.merge(T, [{ geo: hex, color: 0x4fbf5f, pos: [-0.62, 0, 0], scale: [0.6, 1, 0.6] }, { geo: pen, color: 0xa6e08a, pos: [0.55, 0, 0.05], scale: [0.5, 1, 0.5] }]);
    var sorParts = []; for (var i = 0; i < 6; i++) sorParts.push({ geo: sphL, color: i === 0 || i === 5 ? 0xd9c4f2 : 0xb48be0, pos: [-1 + i * 0.4, 0, i % 2 ? 0.2 : -0.2], scale: 0.2 });
    var sor = MM.merge(T, sorParts);
    var raf = MM.merge(T, [{ geo: hex, color: 0xe06aa8, pos: [-0.95, 0, 0], scale: [0.48, 1, 0.48] }, { geo: hex, color: 0x4fbf5f, pos: [0, 0, 0], scale: [0.48, 1, 0.48] }, { geo: pen, color: 0xa6e08a, pos: [0.88, 0, 0.05], scale: [0.4, 1, 0.4] }]);
    KIT._g = { T: T, suc: suc, sor: sor, raf: raf, sph: sph, wat: MM.waterGeo(T, 0.11, true) };
    return KIT._g;
  };
  /* molecule names in a hero, after the ANTI CLUTTER RULE (copy of LP.heroNames, light/l_stroma.js, namespace PP) */
  PP.heroNames = PP.heroNames || function (ctx) {
    var T = ctx.THREE, MM = PP.macro, pools = {}, live = new Map(), prev = {}, items = [], blk = [], blkT = -1e9, v = new T.Vector3();
    function take(text) {
      var p = pools[text] = pools[text] || [], s = p.pop();
      if (!s) { s = MM.nameTag(T, text, { h: 0.3, depthTest: false }); s.userData.asp = s.scale.x / s.scale.y; ctx.root.add(s); }
      s.userData.hideName = false; return s;
    }
    function give(s) { s.visible = false; s.userData.hideName = true; (pools[s.userData.molName] = pools[s.userData.molName] || []).push(s); }
    function blockers() {
      var now = performance.now(); if (now - blkT < 300) return blk; blkT = now; blk = [];
      var st = ctx.wrap.querySelector('.mh-stage'); if (!st) return blk; var wr = st.getBoundingClientRect();
      Array.prototype.forEach.call(ctx.wrap.querySelectorAll('.mh-tag:not(.mh-hide),.mh-cap,.mh-credit,.mh-lbtn,.mh-pause,.mh-spd,.mh-slow:not([hidden])'), function (e) {
        var r = e.getBoundingClientRect(); if (r.width > 0) blk.push({ x: r.left - wr.left - 3, y: r.top - wr.top - 3, w: r.width + 6, h: r.height + 6 });
      });
      return blk;
    }
    function hit(a, b) { return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h; }
    return {
      begin: function () { items = []; },
      add: function (kind, key, text, x, y, z, r, o) { items.push({ k: kind, key: key, t: text, x: x, y: y, z: z, r: r || 0.15, all: !(o && o.all === false), q: o && o.q, keep: !!(o && o.keepOnly) }); },
      end: function () {
        var cam = ctx.camera, on = MM.namesOn ? MM.namesOn() : true, used = new Set();
        if (cam && on && ctx.w) {
          var tv = Math.tan(cam.fov * Math.PI / 360), px = ctx.narrow ? 15.5 : 17, placed = blockers().slice(), kinds = [], by = {}, next = {};
          items.forEach(function (it) { if (!by[it.k]) { by[it.k] = []; kinds.push(it.k); } by[it.k].push(it); });
          kinds.forEach(function (k) {
            var L = by[k], q = L[0].q || (L[0].all && L.length <= 6 ? 6 : (ctx.narrow ? 1 : 2)), chosen = [], old = prev[k] || [];
            L.forEach(function (it) {
              var d = cam.position.distanceTo(v.set(it.x, it.y, it.z)), ppu = ctx.h / (2 * d * tv), hh = px / ppu;
              it.hh = hh; it.wy = it.y - it.r - hh * 0.62;
              v.set(it.x, it.wy, it.z).project(cam);
              var sx = (v.x + 1) / 2 * ctx.w, sy = (1 - v.y) / 2 * ctx.h, asp = (it.t.length * 27 + 36) / 66;
              it.front = v.z < 1; it.box = { x: sx - px * asp / 2 - 2, y: sy - px / 2 - 2, w: px * asp + 4, h: px + 4 }; it.sx = sx; it.sy = sy;
            });
            function fits(it) { var b = it.box; if (!it.front || b.x < 4 || b.y < 4 || b.x + b.w > ctx.w - 4 || b.y + b.h > ctx.h - 4) return false; for (var i = 0; i < placed.length; i++) if (hit(b, placed[i])) return false; return true; }
            L.forEach(function (it) { if (old.indexOf(it.key) >= 0 && chosen.length < q) chosen.push(it); });
            L.forEach(function (it) {
              if (chosen.length >= q || chosen.indexOf(it) >= 0 || it.keep) return;
              for (var i = 0; i < chosen.length; i++) if (Math.hypot(chosen[i].sx - it.sx, chosen[i].sy - it.sy) < (ctx.narrow ? 60 : 90)) return;
              if (fits(it)) chosen.push(it);
            });
            next[k] = chosen.map(function (it) { return it.key; });
            chosen.forEach(function (it) {
              if (!fits(it)) return;
              placed.push(it.box);
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
      }
    };
  };

  /* ================================================================== plate evidence (local keys; everything else is ph.* from the sheet) */
  var EV = PP.evidence;
  EV['ps.ratio'] = { claim: 'In the drawing and the tiles, the sugar in the sieve element is 10 times the sugar in the mesophyll cytosol for active and polymer trap loading, and 0.9 times (downhill) for passive loading.', cite: 'Teaching values of this page (engine.js, loadRatio).', measured: 'none', value: 'apoplastic 10; polymer trap 10 (total sugar); passive 0.9', badge: 'ILLUSTRATIVE', short: 'Teaching ratio', note: 'Measured: phloem sap 2 to 40 fold above the mesophyll cytosol across four species including peach (Nadwodnik and Lohaus 2008); leaf transport sugar differs more than 50 fold between loading types (Rennie and Turgeon 2009).' };
  EV['ps.vanthoff'] = { claim: 'Osmotic pressure of the sieve tube sap, ideal van ’t Hoff: Π = m R T, with m the moles of solute per kg of water. 18 % sucrose by mass at 25 °C gives about 1.59 MPa. A solution this strong is not ideal, so the real value is somewhat higher.', cite: 'Physical chemistry (van ’t Hoff); R = 8.314 J mol⁻¹ K⁻¹.', measured: 'calculation', value: '1.59 MPa at 18 % sucrose, 25 °C', badge: 'DERIVED', short: 'van ’t Hoff' };
  EV['ps.coupling'] = { claim: 'Water potential is equal across the thin walls between xylem and sieve tube, so the turgor at the source is the xylem water potential plus the osmotic pressure of the sap: P = Ψx + Π. With 18 % sucrose and Ψx = −0.50 MPa this model returns 1.09 MPa, close to the 1.08 MPa measured in morning glory source sieve tubes.', cite: 'Nikinmaa et al. (2013) Plant Cell Environ 36: 655 to 669 (model); Knoblauch et al. (2016) eLife (measured 1.08 MPa).', doi: '10.1111/pce.12004', doi2: '10.7554/eLife.15341', measured: 'model; the −0.50 MPa is a teaching choice', value: 'P = Ψx + Π', badge: 'MODEL', short: 'P = Ψx + Π' };
  EV['ps.atpase'] = { claim: 'A plasma membrane H⁺ ATPase pumps protons out of the companion cell, and that proton gradient powers the sucrose/H⁺ symporter (SUT).', cite: 'General textbook mechanism, named here only as the driver of the proton gradient. No paper on the pump itself was retrieved in this session.', measured: 'none retrieved', value: '', badge: 'UNVERIFIED', short: 'H⁺ ATPase', note: 'The proton coupling of SUT is from Chen et al. (2012) (key ph.load.sweet_sut).' };
  EV['ps.drawn'] = { claim: 'Every speed you see in the 3D scene and the drawing is a teaching speed: the number of sugars drawn follows the model sugar flux, and their pace follows the model sap speed, both slowed and scaled for the eye.', cite: 'Drawing convention of this page.', measured: 'none', value: '', badge: 'ILLUSTRATIVE', short: 'Drawn speed' };
  EV['ps.molar'] = { claim: 'Sorbitol (C₆H₁₄O₆, 182.17 g mol⁻¹) has about half the molar mass of sucrose (C₁₂H₂₂O₁₁, 342.30 g mol⁻¹), so the same mass of sugar in the sap makes about twice as many particles and, by van ’t Hoff, about twice the osmotic pressure.', cite: 'Molar masses from the formulas.', measured: 'calculation', value: '182.17 versus 342.30 g mol⁻¹', badge: 'DERIVED', short: 'Molar mass' };

  PP.howto['ph.c14'] = {
    title: 'which cells concentrate sugar, with labelled CO₂', what: 'is loading active or passive? (¹⁴C autoradiography of minor veins)',
    steps: ['Feed a leaf ¹⁴CO₂ in the light for a short pulse, so the label enters the sugar the leaf is making now.',
      'Freeze the leaf or a leaf disc, and expose it to film or an imaging plate. Where the label piles up, the cells hold more sugar.',
      'Active loaders light up their minor veins: the label in the veins is far above the mesophyll around them. Passive loaders show no vein accumulation.',
      'Pair it with plasmodesmata counts at the bundle sheath and phloem boundary by electron microscopy: passive loaders have many, active apoplastic loaders few.'],
    watch: 'A short pulse catches loading; a long one also shows export and storage. Count plasmodesmata on enough interfaces to compare species.',
    dois: ['10.1073/pnas.0902279106', '10.1104/pp.108.134791']
  };
  PP.howto['ph.stylet'] = {
    title: 'pure phloem sap, with an aphid', what: 'aphid stylectomy: what the sieve tube really carries',
    steps: ['Let an aphid settle and feed: its stylet finds a single sieve element on its own.',
      'Cut the stylet while the aphid feeds. The sieve tube’s own pressure pushes sap out of the stump.',
      'Collect the droplet under oil with a fine glass capillary and keep it from evaporating.',
      'Measure the sugars (sucrose, sorbitol, raffinose) and the osmolality of the droplet; compare with the mesophyll cytosol from nonaqueous fractionation of the same leaves.'],
    watch: 'Volumes are tiny, so evaporation and contamination matter. One aphid samples one tube.',
    dois: ['10.1007/s00425-007-0682-0', '10.1098/rsif.2013.0055']
  };
  PP.howto['ph.osmo'] = {
    title: 'osmolality of leaf and inner bark sap', what: 'the Π that sets phloem turgor',
    steps: ['Sample leaves or the inner bark (the living phloem) and freeze them at once.',
      'Thaw, press out the sap and read its osmolality in an osmometer.',
      'Convert to osmotic pressure with van ’t Hoff, Π = osmolality × R T.',
      'Measure the xylem water potential of the same organ with a pressure chamber at the same time; then turgor ≈ Ψx + Π.'],
    watch: 'Pressed sap mixes cell compartments and the cell wall water, so it dilutes the phloem value. Sample at the same time of day: both terms change through the day.',
    dois: ['10.1111/pce.13017', '10.1104/pp.111.184820']
  };

  /* ================================================================== 1.1 Three ways in: 2D theatre */
  var A1 = null, TH = { mol: [], acc: 0, hp: [], wat: [], accW: 0 };
  function cellsLayout(w, h) {
    var narrow = w < 600, top = narrow ? 70 : 64, bot = h - (narrow ? 70 : 60), gap = narrow ? 6 : 10, wall = narrow ? 18 : 26;
    var xyW = narrow ? 16 : 22, x0 = 10, x1 = w - 10 - xyW - gap, se = narrow ? 34 : 50, avail = x1 - x0 - se - wall - gap * 4;
    var cw = avail / 4;
    var cells = [], x = x0;
    ['meso', 'bs', 'pp'].forEach(function (k) { cells.push({ k: k, x: x, w: cw, y: top, h: bot - top }); x += cw + gap; });
    var wallX = x - gap; x += wall;
    cells.push({ k: 'cc', x: x, w: cw, y: top + (bot - top) * 0.08, h: (bot - top) * 0.84 }); x += cw + gap;
    cells.push({ k: 'se', x: x, w: se, y: 24, h: h - 30 });
    return { cells: cells, wallX: wallX, wallW: wall + gap, top: top, bot: bot, narrow: narrow, xyX: w - 10 - xyW, xyW: xyW };
  }
  var NAMES = { meso: 'Mesophyll', bs: 'Bundle sheath', pp: 'Phloem parenchyma', cc: 'Companion cell', se: 'Sieve element' };
  function rel(k, st, r) {
    var L = (r && r.load) || { ratio: 10 }, ld = st.load || 'apo';
    if (ld === 'sym') return { meso: 1, bs: 0.98, pp: 0.96, cc: 0.93, se: 0.9 }[k];
    if (ld === 'trap') return { meso: 1, bs: 0.97, pp: 0.95, cc: 0.9, se: 0.9 }[k];
    return { meso: 1, bs: 1, pp: 1, cc: L.ratio, se: L.ratio }[k];
  }
  function routeFor(lay, ld, h) {
    var c = lay.cells, mid = function (a) { return a.x + a.w / 2; }, cy = h / 2, pts = [];
    var pdY = [lay.top + (lay.bot - lay.top) * 0.3, lay.top + (lay.bot - lay.top) * 0.62];
    var yy = pdY[Math.random() < 0.5 ? 0 : 1];
    pts.push([c[0].x + c[0].w * (0.2 + Math.random() * 0.4), lay.top + 20 + Math.random() * (lay.bot - lay.top - 40)]);
    pts.push([c[0].x + c[0].w, yy]); pts.push([c[1].x, yy]);
    pts.push([mid(c[1]), cy + (Math.random() - 0.5) * 30]);
    var y2 = pdY[Math.random() < 0.5 ? 0 : 1];
    pts.push([c[1].x + c[1].w, y2]); pts.push([c[2].x, y2]);
    pts.push([mid(c[2]), cy]);
    if (ld === 'apo') {
      pts.push([c[2].x + c[2].w, cy - 18]); pts.push([lay.wallX + lay.wallW / 2, cy - 10 + Math.random() * 20]); pts.push([c[3].x, cy + 14]);
    } else { var y3 = cy + 22; pts.push([c[2].x + c[2].w, y3]); pts.push([c[3].x, y3]); }
    pts.push([mid(c[3]), cy]);
    pts.push([c[3].x + c[3].w, cy - 8]); pts.push([c[4].x, cy - 8]);
    pts.push([mid(c[4]), cy]);
    pts.push([mid(c[4]) + (Math.random() - 0.5) * 8, h + 20]);
    var len = [0]; for (var i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    return { p: pts, len: len, total: len[len.length - 1], seStart: len[len.length - 2] };
  }
  function at(rt, d) {
    var L = rt.len, P = rt.p; for (var i = 1; i < L.length; i++) if (d <= L[i]) { var f = (d - L[i - 1]) / Math.max(1e-6, L[i] - L[i - 1]); return [P[i - 1][0] + (P[i][0] - P[i - 1][0]) * f, P[i - 1][1] + (P[i][1] - P[i - 1][1]) * f]; }
    return P[P.length - 1];
  }
  function drawTheatre(c, w, h, t, dt, info) {
    if (!TH.warm && w > 0) { TH.warm = true; for (var wi = 0; wi < 160; wi++) drawTheatre(c, w, h, t, 0.1, info); }
    var st = S(), r = R(), dark = info.dark, lay = cellsLayout(w, h), cells = lay.cells, K = KIT;
    c.clearRect(0, 0, w, h);
    var g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, dark ? '#0d1712' : '#f3f6ea'); g.addColorStop(1, dark ? '#0a120e' : '#e7eedb'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    /* cell wall space (apoplast) */
    c.fillStyle = dark ? 'rgba(200,190,150,.16)' : 'rgba(170,150,100,.18)'; c.fillRect(lay.wallX, lay.top - 10, lay.wallW, lay.bot - lay.top + 20);
    var fs = lay.narrow ? 9.5 : 11;
    c.font = '500 ' + fs + 'px "IBM Plex Sans",system-ui,sans-serif'; c.textAlign = 'center'; c.fillStyle = dark ? '#cbbf96' : '#7a6a3c';
    c.save(); c.translate(lay.wallX + lay.wallW / 2, lay.bot + 12); c.fillText(lay.narrow ? 'wall' : 'cell wall', 0, 0); c.restore();
    var cols = { meso: dark ? ['#1f4a2a', '#5fae6c'] : ['#d9efcf', '#5b9e5e'], bs: dark ? ['#2c4430', '#86b07a'] : ['#e8f1d8', '#7aa266'], pp: dark ? ['#3b3f24', '#c8c27a'] : ['#f3f0d6', '#a59b4c'], cc: dark ? ['#4a3320', '#e0a060'] : ['#fbe6cf', '#c47d32'], se: dark ? ['#3d3214', '#e6c25a'] : ['#fff2c8', '#c79a1d'] };
    var maxRel = st.load === 'apo' ? (r.load ? r.load.ratio : 10) : 1;
    cells.forEach(function (cl) {
      var cc = cols[cl.k];
      c.fillStyle = cc[0]; c.strokeStyle = cc[1]; c.lineWidth = 2;
      c.beginPath(); if (c.roundRect) c.roundRect(cl.x, cl.y, cl.w, cl.h, cl.k === 'se' ? 10 : 14); else c.rect(cl.x, cl.y, cl.w, cl.h); c.fill(); c.stroke();
      if (cl.k === 'meso') { c.fillStyle = dark ? 'rgba(90,190,100,.55)' : 'rgba(60,150,70,.55)'; for (var i = 0; i < 7; i++) { c.beginPath(); c.ellipse(cl.x + 8 + (i % 2) * (cl.w - 16), cl.y + 18 + i * (cl.h - 30) / 7, 6, 3.5, 0.5, 0, TAU); c.fill(); } }
      if (cl.k === 'cc') { c.fillStyle = dark ? 'rgba(240,190,120,.5)' : 'rgba(180,110,40,.4)'; c.beginPath(); c.arc(cl.x + cl.w * 0.5, cl.y + cl.h * 0.22, Math.min(10, cl.w * 0.2), 0, TAU); c.fill(); }
      if (cl.k === 'se') { c.strokeStyle = cc[1]; c.lineWidth = 3; [0.25, 0.75].forEach(function (f) { var yy = cl.y + cl.h * f; c.beginPath(); c.moveTo(cl.x + 3, yy); c.lineTo(cl.x + cl.w - 3, yy); c.stroke(); c.fillStyle = cc[0]; for (var k = 0; k < 3; k++) { c.beginPath(); c.arc(cl.x + cl.w * (0.25 + k * 0.25), yy, 2.2, 0, TAU); c.fill(); } }); }
      /* sugar bar */
      var rv = rel(cl.k, st, r), bh = Math.max(3, (lay.top - 30) * Math.min(1, rv / maxRel)), bx = cl.k === 'se' ? cl.x - 2 : cl.x + cl.w * 0.3, bw = cl.k === 'se' ? cl.w + 4 : cl.w * 0.4;
      if (cl.k !== 'se') { c.fillStyle = st.load === 'trap' && cl.k === 'cc' ? K.COL.raf : K.COL.suc; c.globalAlpha = 0.85; c.fillRect(bx, lay.top - 8 - bh, bw, bh); c.globalAlpha = 1; }
      c.fillStyle = dark ? '#e9e4d2' : '#25301f'; c.font = '600 ' + fs + 'px "IBM Plex Sans",system-ui,sans-serif';
      if (cl.k !== 'se') { var nm = lay.narrow ? { meso: 'Meso', bs: 'Sheath', pp: 'Paren.', cc: 'Comp.' }[cl.k] : NAMES[cl.k]; c.fillText(nm, cl.x + cl.w / 2, lay.bot + 14 + (lay.narrow ? 12 : 14)); }
    });
    var se = cells[4];
    c.save(); c.translate(se.x + se.w / 2, h / 2); c.rotate(-Math.PI / 2); c.fillStyle = dark ? '#ffe39a' : '#6b4f00'; c.font = '700 ' + fs + 'px "IBM Plex Sans",system-ui,sans-serif'; c.fillText(lay.narrow ? 'Sieve element' : 'Sieve element: to the sink', 0, -se.w * 0.32 + 4); c.restore();
    c.fillStyle = dark ? '#d8d2bf' : '#4a5340'; c.font = '500 ' + fs + 'px "IBM Plex Sans",system-ui,sans-serif'; c.textAlign = 'left';
    c.fillText(lay.narrow ? 'sugar in each cell' : 'sugar in each cell (bar height, model)', 10, 14);
    /* plasmodesmata */
    var pdY = [lay.top + (lay.bot - lay.top) * 0.3, lay.top + (lay.bot - lay.top) * 0.62];
    function pd(x, y, on) { c.strokeStyle = on ? (dark ? '#ffe7a0' : '#7a5b00') : (dark ? 'rgba(255,231,160,.25)' : 'rgba(122,91,0,.25)'); c.lineWidth = 2; c.beginPath(); c.moveTo(x - 6, y - 3); c.lineTo(x + 6, y - 3); c.moveTo(x - 6, y + 3); c.lineTo(x + 6, y + 3); c.stroke(); }
    for (var j = 0; j < 2; j++) { pd(cells[0].x + cells[0].w + 5, pdY[j], true); pd(cells[1].x + cells[1].w + 5, pdY[j], true); }
    if (st.load !== 'apo') pd(cells[2].x + cells[2].w + lay.wallW / 2, h / 2 + 22, true);
    pd(cells[3].x + cells[3].w + 5, h / 2 - 8, true);
    /* transporters (active loading) */
    var cy = h / 2;
    if (st.load === 'apo') {
      var p1 = [cells[2].x + cells[2].w, cy - 18], p2 = [cells[3].x, cy + 14], p3 = [cells[3].x, cy + 46];
      c.fillStyle = '#8a5cc4'; c.beginPath(); c.ellipse(p1[0], p1[1], 5, 11, 0, 0, TAU); c.fill();
      c.fillStyle = '#1f9e93'; c.beginPath(); c.ellipse(p2[0], p2[1], 5, 11, 0, 0, TAU); c.fill();
      c.fillStyle = '#e8891a'; c.beginPath(); c.ellipse(p3[0], p3[1], 5, 10, 0, 0, TAU); c.fill();
      c.font = '700 ' + (fs - 0.5) + 'px "IBM Plex Sans",system-ui,sans-serif'; c.textAlign = 'center';
      c.fillStyle = dark ? '#d9c4f2' : '#5b3a8c'; c.fillText('SWEET', p1[0] - (lay.narrow ? 2 : 4), p1[1] - 16);
      c.fillStyle = dark ? '#8fe0d7' : '#0f6a62'; c.fillText('SUT', p2[0] + 8, p2[1] - 15);
      if (!lay.narrow) { c.fillStyle = dark ? '#ffc98a' : '#8a4a00'; c.fillText('H⁺ pump', p3[0] + 16, p3[1] + 22); }
    }
    if (st.load === 'trap') { c.fillStyle = dark ? '#f2a8cf' : '#8a1f58'; c.font = '600 ' + fs + 'px "IBM Plex Sans",system-ui,sans-serif'; c.textAlign = 'center'; c.fillText(lay.narrow ? 'raffinose made' : 'raffinose made here', cells[3].x + cells[3].w / 2, cells[3].y + cells[3].h - 8); }
    /* motion */
    var Jn = Math.max(0, (r.Jmass || 0) / 0.0282), spdSE = Math.max(0, (r.U || 0) / 147);
    if (dt > 0) {
      TH.acc += dt * 1.6 * Math.min(3, Jn);
      while (TH.acc >= 1 && TH.mol.length < 40) { TH.acc -= 1; var rt = routeFor(lay, st.load, h); TH.mol.push({ rt: rt, d: 0, sor: st.sugar === 'rosaceae' && Math.random() < (st.sorb == null ? 0.5 : st.sorb), raf: false, key: Math.random() }); }
      if (TH.acc > 3) TH.acc = 0;
      TH.accW += dt * 1.2 * Math.min(3, spdSE);
      while (TH.accW >= 1 && TH.wat.length < 8) { TH.accW -= 1; TH.wat.push({ y: lay.top + Math.random() * (lay.bot - lay.top), u: 0 }); }
    }
    var named = { suc: 0, sor: 0, raf: 0, hp: 0, wat: 0 }, quota = lay.narrow ? 1 : 2;
    for (var m = TH.mol.length - 1; m >= 0; m--) {
      var o = TH.mol[m];
      if (dt > 0) { var v = o.d > o.rt.seStart ? 46 * Math.max(0.05, spdSE) : 34; o.d += v * dt; }
      if (o.d >= o.rt.total || o.rt.p[0][0] > w) { TH.mol.splice(m, 1); continue; }
      var p = at(o.rt, o.d);
      if (st.load === 'trap' && !o.sor && p[0] > cells[3].x + cells[3].w * 0.5) o.raf = true;
      var rr = lay.narrow ? 6 : 8;
      if (o.raf) K.raffinose(c, p[0], p[1], rr * 1.05); else if (o.sor) K.sorbitol(c, p[0], p[1], rr * 1.05); else K.sucrose(c, p[0], p[1], rr);
      if (st.load === 'apo' && !o.sor && p[0] > lay.wallX && p[0] < cells[3].x + 4) K.proton(c, p[0] - 2, p[1] + rr + 4, 3.4);
      var kind = o.raf ? 'raf' : (o.sor ? 'sor' : 'suc');
      if (window.MolNames && window.MolNames.get() && named[kind] < quota && p[1] > lay.top + 10 && p[1] < lay.bot - 24 && (m % 7 === 0)) { named[kind]++; K.pill(c, p[0], p[1] + rr + 2, kind === 'raf' ? 'raffinose' : kind === 'sor' ? 'sorbitol' : 'sucrose', dark, lay.narrow ? 9.5 : 10.5); }
    }
    /* the xylem vessel beside the sieve element, and water moving from it into the sieve element */
    c.fillStyle = dark ? 'rgba(90,150,255,.22)' : 'rgba(90,150,255,.2)'; c.strokeStyle = dark ? '#6aa8ff' : '#3a78c8'; c.lineWidth = 1.5;
    c.beginPath(); if (c.roundRect) c.roundRect(lay.xyX, 24, lay.xyW, h - 30, 8); else c.rect(lay.xyX, 24, lay.xyW, h - 30); c.fill(); c.stroke();
    c.save(); c.translate(lay.xyX + lay.xyW / 2, h / 2); c.rotate(-Math.PI / 2); c.fillStyle = dark ? '#9cc8ff' : '#2a5c8f'; c.font = '700 ' + (fs - 0.5) + 'px "IBM Plex Sans",system-ui,sans-serif'; c.textAlign = 'center'; c.fillText(lay.narrow ? 'xylem' : 'xylem: water', 0, 4); c.restore();
    for (var q = TH.wat.length - 1; q >= 0; q--) {
      var wq = TH.wat[q]; if (dt > 0) wq.u += dt * 0.5; if (wq.u >= 1) { TH.wat.splice(q, 1); continue; }
      var xa = lay.xyX + lay.xyW / 2, xb = se.x + se.w * 0.5; K.water(c, xa + (xb - xa) * wq.u, wq.y, lay.narrow ? 3 : 3.6);
    }
  }
  function capText() {
    var st = S(), r = R(), L = r.load || {}, rs = st.sugar === 'rosaceae';
    var what = rs ? 'sucrose and sorbitol' : 'sucrose';
    var t = st.load === 'apo' ? 'Active loading: ' + what + ' moves cell to cell through plasmodesmata as far as the phloem parenchyma, is let out into the cell wall by SWEET, down its gradient, and is pulled into the companion cell by SUT together with a proton. That is how the sieve element ends up holding about ' + num(L.ratio, 0) + ' times more sugar than the mesophyll here.'
      : st.load === 'sym' ? 'Passive loading: ' + what + ' never leaves the cells. It diffuses through plasmodesmata all the way into the sieve element, always downhill, so the leaf itself must hold a lot of sugar.'
        : 'Polymer trap: sucrose diffuses in through plasmodesmata, and in the intermediary (companion) cell it is built into raffinose, which is too big to diffuse back. Sucrose stays downhill; total sugar in the sieve element ends up high.';
    return t;
  }
  function nowText() {
    var st = S(), r = R(), tier = U().tier();
    var ld = { apo: 'actively, through the cell wall', sym: 'passively, through plasmodesmata', trap: 'by a polymer trap' }[st.load];
    var s = 'This leaf loads ' + ld + (st.sugar === 'rosaceae' ? (st.load === 'trap' ? ', exporting sucrose and sorbitol' : ', exporting sucrose and sorbitol, as the almond, peach and apple family does') : ', exporting sucrose') + '. ';
    if (tier === 1) return s + (r.stopped ? 'Right now the sieve tube is not at higher pressure than the sink, so nothing flows.' : 'Sugar pulls water in from the xylem, and that water pressure pushes the sap out of the leaf toward the roots.');
    return s + 'Sap at ' + num(st.conc, 1) + ' % sugar holds Π = ' + num(r.Pi, 2) + ' MPa; with the xylem at ' + num(st.psiX, 2) + ' MPa the source turgor is ' + num(r.Psrc, 2) + ' MPa' + (r.stopped ? ', no higher than the sink (' + num(r.Psink, 2) + ' MPa): flow stops in the model.' : ', above the sink (' + num(r.Psink, 2) + ' MPa), so the sap moves.');
  }

  /* ================================================================== hero: the minor vein, cut open (Three.js r128 through PP.macro) */
  var H = { ctx: null };
  /* vascular cells drawn larger than life relative to the mesophyll, so the loading step reads when zoomed */
  var GEO = { se: [-0.55, -0.8, 0.6], cc: [0.68, -1.12, 0.42], pp: [0.9, 0.18, 0.5], xy: [-0.72, 0.7, 0.56] };
  var PDX = { sweet: [0.82, -0.33], wall: [0.79, -0.52], sut: [0.74, -0.71], pump: [1.04, -0.86], pd: [0.79, -0.47] };
  var ZF = 4.4;  // the cut face plane, where molecules travel
  function z0p() { return ZF - 9.6 + 9.6 / 2; } // the middle sieve plate (LEN 9.6 in hBuild)
  function hBuild(ctx) {
    var T = ctx.THREE, MM = PP.macro, root = ctx.root, far = ctx.far, se = MM.superEllipsoid, Hs = H;
    Hs.T = T; Hs.rnd = (function (s) { return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; })(41);
    var r = Hs.rnd, LEN = 9.6, z0 = ZF - LEN;
    function tube(x, y, rad, col, op, segs) {
      var g = new T.Group(), m = MM.glass(T, col, { opacity: op, side: T.DoubleSide });
      var n = segs || 1, l = LEN / n;
      for (var i = 0; i < n; i++) { var c = new T.Mesh(se(rad, rad, l / 2 - 0.04, 0.35, 20, 12), m); c.position.set(x, y, z0 + l * (i + 0.5)); c.renderOrder = 3; g.add(c); }
      root.add(g); return { g: g, m: m };
    }
    /* mesophyll: lobed glass cells with chloroplasts, around the vein */
    var mesoM = MM.glass(T, 0x6fbf6a, { opacity: 0.27 }), mesoG = se(0.82, 0.76, 1.35, 0.55, 12, 8), chl = [];
    Hs.meso = [];
    for (var a = 0; a < 11; a++) {
      var th = a / 11 * TAU + 0.15, rad = 3.75 + (a % 2) * 0.3;
      for (var zz = 0; zz < 3; zz++) {
        var mm = new T.Mesh(mesoG, mesoM), z = ZF - 1.4 - zz * 2.95;
        mm.position.set(Math.cos(th) * rad, Math.sin(th) * rad * 0.82, z); mm.rotation.z = th; mm.renderOrder = 1; root.add(mm);
        if (zz === 0) Hs.meso.push([mm.position.x, mm.position.y]);
        for (var k = 0; k < 7; k++) { var ca = r() * TAU; chl.push([mm.position.x + Math.cos(ca) * 0.66, mm.position.y + Math.sin(ca) * 0.6, z + (r() - 0.5) * 2.2]); }
      }
    }
    Hs.chlObj = MM.balls(T, chl, 0x2f9a3a, 0.3); root.add(Hs.chlObj);
    /* bundle sheath */
    var bsM = MM.glass(T, 0xcfe3a8, { opacity: 0.34 }), bsG = se(0.6, 0.6, 2.2, 0.45, 12, 8); Hs.bs = [];
    for (var b = 0; b < 9; b++) {
      var tb = b / 9 * TAU + 0.35;
      for (var zb = 0; zb < 2; zb++) { var bm = new T.Mesh(bsG, bsM); bm.position.set(Math.cos(tb) * 2.12, Math.sin(tb) * 1.98, ZF - 2.3 - zb * 4.7); bm.renderOrder = 2; root.add(bm); if (!zb) Hs.bs.push([bm.position.x, bm.position.y]); }
    }
    /* vascular cells */
    Hs.xy = tube(GEO.xy[0], GEO.xy[1], GEO.xy[2], 0x5a9cff, 0.45, 1);
    var ringG = new T.TorusGeometry(GEO.xy[2] * 0.96, 0.045, 5, 20), ringM = MM.lin(new T.MeshStandardMaterial({ color: 0x9cc8ff, roughness: 0.4, transparent: true, opacity: 0.8 }));
    for (var ri = 0; ri < 8; ri++) { var rg = new T.Mesh(ringG, ringM); rg.position.set(GEO.xy[0], GEO.xy[1], z0 + 0.6 + ri * 1.15); root.add(rg); }
    Hs.pp = tube(GEO.pp[0], GEO.pp[1], GEO.pp[2], 0xd8d070, 0.5, 2);
    Hs.cc = tube(GEO.cc[0], GEO.cc[1], GEO.cc[2], 0xf08a30, 0.58, 2); Hs.cc.m.emissive = new T.Color(0x5a2a00); Hs.cc.m.emissiveIntensity = 0.4;
    var nuc = new T.Mesh(new T.SphereGeometry(0.16, 12, 8), MM.lin(new T.MeshStandardMaterial({ color: 0x8a4a1a, emissive: 0x5a2a00, emissiveIntensity: 0.4 }))); nuc.position.set(GEO.cc[0], GEO.cc[1], ZF - 1.0); root.add(nuc);
    Hs.se = tube(GEO.se[0], GEO.se[1], GEO.se[2], 0xf2c030, 0.55, 4);
    /* FIX ROUND 1: the Sieve element view fades the cells around it so the tube and its plates read */
    Hs.fade = [mesoM, bsM, Hs.xy.m, Hs.pp.m, Hs.cc.m, ringM].map(function (m) { return { m: m, o: m.opacity }; });
    Hs.setFade = function (on, lvl) { Hs.fade.forEach(function (f) { f.m.opacity = on ? Math.min(f.o, lvl || 0.07) : f.o; }); Hs.chlObj.visible = !on; };
    Hs.se.m.emissive = new T.Color(0x6a4a00); Hs.se.m.emissiveIntensity = 0.35;
    /* sieve plates: pore discs between the sieve elements */
    var pc = document.createElement('canvas'); pc.width = pc.height = 128; var px = pc.getContext('2d');
    px.fillStyle = '#fff'; px.beginPath(); px.arc(64, 64, 63, 0, TAU); px.fill(); px.fillStyle = '#000';
    for (var py = 0; py < 5; py++) for (var pq = 0; pq < 5; pq++) { var cx = 20 + pq * 22, cy = 20 + py * 22; if (Math.hypot(cx - 64, cy - 64) < 50) { px.beginPath(); px.arc(cx, cy, 7, 0, TAU); px.fill(); } }
    var ptex = new T.CanvasTexture(pc);
    Hs.plateM = MM.lin(new T.MeshStandardMaterial({ color: 0xf6dc8a, emissive: 0x7a5a10, emissiveIntensity: 0.4, alphaMap: ptex, transparent: true, side: T.DoubleSide, roughness: 0.5, depthWrite: false }));
    for (var sp = 1; sp < 4; sp++) { var pl = new T.Mesh(new T.CircleGeometry(GEO.se[2] * 0.95, 24), Hs.plateM); pl.position.set(GEO.se[0], GEO.se[1], z0 + LEN / 4 * sp); root.add(pl); }
    /* cell wall space between phloem parenchyma and companion cell (the apoplast) */
    Hs.wallM = MM.lin(new T.MeshStandardMaterial({ color: 0xd8c890, emissive: 0x6a5a20, emissiveIntensity: 0.5, transparent: true, opacity: 0.4, side: T.DoubleSide, depthWrite: false }));
    var wall = new T.Mesh(new T.PlaneGeometry(0.62, LEN), Hs.wallM); wall.position.set(PDX.wall[0], PDX.wall[1], ZF - LEN / 2); wall.rotation.x = Math.PI / 2; wall.rotation.y = 0.16; root.add(wall);
    /* transporters on the cut face: SWEET (out of the parenchyma), SUT (into the companion cell), the H+ pump */
    function blob(col, x, y, s) { var m = new T.Mesh(se(0.11 * s, 0.15 * s, 0.11 * s, 0.6, 12, 8), MM.lin(new T.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.35, roughness: 0.35 }))); m.position.set(x, y, ZF + 0.05); root.add(m); return m; }
    Hs.sweet = blob(0x8a5cc4, PDX.sweet[0], PDX.sweet[1], 1.3); Hs.sut = blob(0x1f9e93, PDX.sut[0], PDX.sut[1], 1.3); Hs.atpase = blob(0xe8891a, PDX.pump[0], PDX.pump[1], 1.15);
    /* plasmodesmata: glowing bridges on the cut face */
    Hs.pdOn = MM.halos(T, 16, 0xffe7a0, 0.7); root.add(Hs.pdOn.obj);
    Hs.pdPP = MM.halos(T, 2, 0xffe7a0, 0.7); root.add(Hs.pdPP.obj);
    /* FIX ROUND 1: each glowing spot is also drawn as a plasmodesma: a strip of shared cell wall pierced by channels, each
       lined by the plasma membrane with a thin ER strand (desmotubule) down its middle. Sizes ILLUSTRATIVE (a real one is
       about 50 nm across). */
    var pdWallM = MM.lin(new T.MeshStandardMaterial({ color: 0xa88a4a, emissive: 0x3a2a08, emissiveIntensity: 0.3, roughness: 0.75, transparent: true, opacity: 0.8 }));
    var pdChM = MM.lin(new T.MeshStandardMaterial({ color: 0xffb81f, emissive: 0xd07a00, emissiveIntensity: 0.8, roughness: 0.3, side: T.DoubleSide }));
    var pdDtM = MM.lin(new T.MeshStandardMaterial({ color: 0x2f7a5a, emissive: 0x0f3a2a, emissiveIntensity: 0.5, roughness: 0.4 }));
    var pdWallG = new T.BoxGeometry(0.06, 0.46, 1.7), pdChG = new T.CylinderGeometry(0.055, 0.055, 0.3, 14, 1, true), pdDtG = new T.CylinderGeometry(0.016, 0.016, 0.34, 6);
    Hs.pdBridges = [];
    Hs.pdBridge = function (x, y, dx, dy) {
      var g = new T.Group(), a = Math.atan2(dy, dx), w = new T.Mesh(pdWallG, pdWallM);
      g.position.set(x, y, ZF - 0.8); w.rotation.z = a; g.add(w);
      for (var q = 0; q < 3; q++) {
        var c = new T.Mesh(pdChG, pdChM), d = new T.Mesh(pdDtG, pdDtM), zq = 0.72 - q * 0.62;
        c.rotation.z = a - Math.PI / 2; d.rotation.z = a - Math.PI / 2; c.position.z = zq; d.position.z = zq; g.add(c); g.add(d);
      }
      root.add(g); Hs.pdBridges.push({ g: g, x: x, y: y, dx: dx, dy: dy }); return g;
    };
    /* far layer: more leaf, out of focus */
    var farM = MM.glass(T, 0x5aa85a, { opacity: 0.45 }), farG = se(1.0, 0.9, 1.6, 0.6, 10, 8);
    for (var f = 0; f < 10; f++) { var fm = new T.Mesh(farG, farM); fm.position.set(-9 + r() * 18, -5 + r() * 10, -9 - r() * 6); far.add(fm); }
    /* routes, molecules */
    Hs.routes = hRoutes();
    Hs.routes.forEach(function (rt) {
      Hs.pdBridge(rt.mid1[0], rt.mid1[1], rt.b[0] - rt.m[0], rt.b[1] - rt.m[1]);
      Hs.pdBridge(rt.mid2[0], rt.mid2[1], GEO.pp[0] - rt.b[0], GEO.pp[1] - rt.b[1]);
    });
    Hs.pdBridge((GEO.cc[0] + GEO.se[0]) / 2, (GEO.cc[1] + GEO.se[1]) / 2 - 0.05, GEO.se[0] - GEO.cc[0], GEO.se[1] - GEO.cc[1]);
    var G = KIT.geos(T, MM), vmat = function () { return MM.lin(new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.3, emissive: 0x112211, emissiveIntensity: 0.25 })); };
    function im(geo, mat, n) { var x = new T.InstancedMesh(geo, mat, n); x.frustumCulled = false; x.renderOrder = 8; root.add(x); return x; }
    Hs.sucM = im(G.suc, vmat(), 44); Hs.sorM = im(G.sor, vmat(), 24); Hs.rafM = im(G.raf, vmat(), 16);
    Hs.hpM = im(G.sph, MM.lin(new T.MeshStandardMaterial({ color: 0xffd23f, emissive: 0xb08a00, emissiveIntensity: 0.6, roughness: 0.3 })), 24);
    Hs.watM = im(G.wat, MM.lin(new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.3 })), 14);
    Hs.glow = MM.halos(T, 44, 0x7dff7a, 0.5); root.add(Hs.glow.obj);
    Hs.mol = []; Hs.hp = []; Hs.wat = []; Hs.acc = 0; Hs.accH = 0; Hs.accW = 0; Hs.dummy = new T.Object3D();
    Hs.hn = PP.heroNames(ctx);
    var V = function (x, y, z) { return new T.Vector3(x, y, z); };
    Hs.labels = function () {
      var st = S(), fz = Hs.fz, pdb = Hs.pdTarget(), L = [];
      /* FIX ROUND 1: in a Look closer view the structures of that view are named first (tier 1, so the phone cap keeps them) */
      if (fz === 'tr' && st.load === 'apo') L = [
        { id: 'f_sw', text: 'SWEET: lets sucrose out', pos: V(PDX.sweet[0], PDX.sweet[1] + 0.12, ZF + 0.1), tier: 1 },
        { id: 'f_pump', text: 'H⁺ pump', pos: V(PDX.pump[0] + 0.05, PDX.pump[1] - 0.1, ZF + 0.1), tier: 1 }];
      else if (fz === 'pd') L = [
        { id: 'f_wall', text: 'Cell wall', pos: V(pdb.x - pdb.ny * 0.24, pdb.y + pdb.nx * 0.24, ZF - 1.0), tier: 1 },
        { id: 'f_dt', text: 'ER strand (desmotubule)', pos: V(pdb.x + pdb.nx * 0.16, pdb.y + pdb.ny * 0.16, ZF - 1.32), tier: 2 }];
      else if (fz === 'se') L = [
        { id: 'f_pl', text: 'Sieve plate: pores let the sap through', pos: V(GEO.se[0], GEO.se[1] + GEO.se[2] * 0.9, z0 + LEN / 2), tier: 1 },
        { id: 'f_se2', text: 'Next sieve element', pos: V(GEO.se[0], GEO.se[1] - GEO.se[2] - 0.05, z0 + LEN * 0.36), tier: 1 }];
      ctx.setLabels(L.concat([
        { id: 'meso', text: 'Mesophyll cell: sugar made here', pos: V(Hs.meso[1][0], Hs.meso[1][1] + 0.9, ZF - 0.2), tier: 1 },
        { id: 'bs', text: 'Bundle sheath', pos: V(Hs.bs[2][0], Hs.bs[2][1] + 0.4, ZF), narrow: false },
        { id: 'xy', text: 'Xylem vessel: water', pos: V(GEO.xy[0] - 0.2, GEO.xy[1] + 0.62, ZF), tier: 1 },
        { id: 'se', text: 'Sieve element', pos: V(GEO.se[0] - 0.25, GEO.se[1] - 0.66, ZF), tier: 1 },
        { id: 'cc', text: st.load === 'trap' ? 'Intermediary (companion) cell' : 'Companion cell', pos: V(GEO.cc[0] + 0.3, GEO.cc[1] - 0.48, ZF), tier: 1 },
        { id: 'pp', text: 'Phloem parenchyma', pos: V(GEO.pp[0] + 0.3, GEO.pp[1] + 0.52, ZF), narrow: false },
        { id: 'sw', text: st.load === 'apo' ? 'SWEET lets out, SUT takes in' : 'Plasmodesmata', pos: V(PDX.wall[0] + 0.1, PDX.wall[1], ZF + 0.2), narrow: false }
      ].filter(function (l) { return !fz || (l.id !== 'sw' && l.id !== (fz === 'se' ? 'se' : '')); })));
    };
    /* the plasmodesma the chip looks at: sheath to parenchyma on the first route */
    Hs.pdTarget = function () {
      var b = Hs.pdBridges && Hs.pdBridges[1]; if (!b) return { x: 1.9, y: 0.7, nx: 1, ny: 0 };
      var l = Math.hypot(b.dx, b.dy) || 1; return { x: b.x, y: b.y, nx: b.dx / l, ny: b.dy / l };
    };
    Hs.labels();
    hSync();
    for (var pw = 0; pw < 60; pw++) hFrame(ctx, pw * 0.06, 0.06);
    hLive();
  }
  function hRoutes() {
    /* points in the cut face plane (x, y); the last leg runs down the sieve element (−z) */
    var H2 = H, bsNear = function (x, y) { var b = null, bd = 9; H2.bs.forEach(function (p) { var d = Math.hypot(p[0] - x, p[1] - y); if (d < bd) { bd = d; b = p; } }); return b; };
    var starts = [0, 1, 10, 9].map(function (i) { return H2.meso[i]; });
    return starts.map(function (m) {
      var b = bsNear(m[0] * 0.55, m[1] * 0.55), mid1 = [(m[0] + b[0]) / 2, (m[1] + b[1]) / 2], mid2 = [(b[0] + GEO.pp[0]) / 2, (b[1] + GEO.pp[1]) / 2];
      return { m: m, b: b, mid1: mid1, mid2: mid2 };
    });
  }
  function hPath(rt, ld) {
    var P = [[rt.m[0], rt.m[1]], rt.mid1, [rt.b[0], rt.b[1]], rt.mid2, [GEO.pp[0], GEO.pp[1]]];
    if (ld === 'apo') P.push(PDX.sweet, PDX.wall, PDX.sut); else P.push(PDX.pd);
    P.push([GEO.cc[0], GEO.cc[1]], [(GEO.cc[0] + GEO.se[0]) / 2, (GEO.cc[1] + GEO.se[1]) / 2 - 0.05], [GEO.se[0], GEO.se[1]]);
    var L = [0]; for (var i = 1; i < P.length; i++) L.push(L[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
    return { P: P, L: L, T: L[L.length - 1] };
  }
  function hAt(p, d) { for (var i = 1; i < p.L.length; i++) if (d <= p.L[i]) { var f = (d - p.L[i - 1]) / Math.max(1e-6, p.L[i] - p.L[i - 1]); return [p.P[i - 1][0] + (p.P[i][0] - p.P[i - 1][0]) * f, p.P[i - 1][1] + (p.P[i][1] - p.P[i - 1][1]) * f, i]; } var q = p.P[p.P.length - 1]; return [q[0], q[1], p.P.length]; }
  function hSync() {
    var Hs = H, st = S(); if (!Hs.T) return;
    var apo = st.load === 'apo';
    Hs.sweet.visible = apo; Hs.sut.visible = apo; Hs.atpase.visible = apo;
    Hs.wallM.opacity = apo ? 0.45 : 0.15;
    /* plasmodesmata glows: mesophyll to sheath, sheath to parenchyma, companion cell to sieve element (pore plasmodesma units) */
    var n = 0, s = Hs.pdOn;
    Hs.routes.forEach(function (rt) { s.set(n++, rt.mid1[0], rt.mid1[1], ZF + 0.02); s.set(n++, rt.mid2[0], rt.mid2[1], ZF + 0.02); });
    for (var i = 0; i < 3; i++) s.set(n++, (GEO.cc[0] + GEO.se[0]) / 2, (GEO.cc[1] + GEO.se[1]) / 2 - 0.05, ZF - 0.6 - i * 1.4);
    for (; n < 16; n++) s.hide(n);
    s.commit();
    Hs.pdPP.set(0, PDX.pd[0], PDX.pd[1], ZF + 0.02); Hs.pdPP.set(1, PDX.pd[0], PDX.pd[1], ZF - 1.5); Hs.pdPP.commit(); Hs.pdPP.mat.opacity = apo ? 0.12 : 0.95;
    Hs.mol.forEach(function (o) { o.p = hPath(o.rt, st.load); });
    if (Hs.labels) Hs.labels();
  }
  function hFrame(ctx, t, dt) {
    var Hs = H, T = Hs.T; if (!T) return;
    var st = S(), r = R(), rnd = Hs.rnd, i;
    var Jn = Math.max(0, (r.Jmass || 0) / 0.0282), Un = Math.max(0, (r.U || 0) / 147);
    if (dt > 0) {
      Hs.acc += dt * 1.5 * Math.min(3, Jn);
      while (Hs.acc >= 1) {
        Hs.acc -= 1; if (Hs.mol.length >= 40) continue;
        var rt = Hs.routes[(rnd() * Hs.routes.length) | 0];
        Hs.mol.push({ rt: rt, p: hPath(rt, st.load), d: 0, z: ZF + 0.05, sor: st.sugar === 'rosaceae' && rnd() < st.sorb, raf: false, down: 0, rx: rnd() * 6, ry: rnd() * 6, id: rnd() });
      }
      Hs.accW += dt * 0.9 * Math.min(3, Un);
      while (Hs.accW >= 1) { Hs.accW -= 1; if (Hs.wat.length < 14) Hs.wat.push({ u: 0, z: ZF - 0.3 - rnd() * 3, id: rnd() }); }
      Hs.accH += dt * (st.load === 'apo' ? 0.8 * Math.min(3, Jn) : 0);
      while (Hs.accH >= 1) { Hs.accH -= 1; if (Hs.hp.length < 10) Hs.hp.push({ u: 0, pump: true, id: rnd() }); }
    }
    for (i = Hs.mol.length - 1; i >= 0; i--) {
      var o = Hs.mol[i];
      if (dt > 0) {
        if (o.d < o.p.T) o.d += dt * 0.42; else o.down += dt * (0.25 + 1.6 * Math.min(2.5, Un));
        o.rx += dt * 0.8; o.ry += dt * 0.6;
      }
      if (o.down > 9.2) { Hs.mol.splice(i, 1); continue; }
      var q = hAt(o.p, o.d); o.x = q[0]; o.y = q[1]; o.zz = o.z - o.down; o.seg = q[2];
      if (st.load === 'trap' && !o.sor && !o.raf && Math.hypot(o.x - GEO.cc[0], o.y - GEO.cc[1]) < 0.1) o.raf = true;
      o.withH = st.load === 'apo' && !o.sor && o.seg >= 6 && o.seg <= 8;
    }
    for (i = Hs.wat.length - 1; i >= 0; i--) { var wq = Hs.wat[i]; if (dt > 0) wq.u += dt * 0.35; if (wq.u >= 1) Hs.wat.splice(i, 1); }
    for (i = Hs.hp.length - 1; i >= 0; i--) { var hq = Hs.hp[i]; if (dt > 0) hq.u += dt * 0.45; if (hq.u >= 1) Hs.hp.splice(i, 1); }
    /* write */
    var D = Hs.dummy, nS = 0, nO = 0, nR = 0, nH = 0, s = 0.2, ease = function (u) { return u * u * (3 - 2 * u); };
    Hs.mol.forEach(function (m, k) {
      D.position.set(m.x, m.y, m.zz); D.rotation.set(m.rx, m.ry, 0); D.scale.setScalar(m.raf ? s * 0.9 : s); D.updateMatrix();
      if (m.raf) { if (nR < 16) Hs.rafM.setMatrixAt(nR++, D.matrix); } else if (m.sor) { if (nO < 24) Hs.sorM.setMatrixAt(nO++, D.matrix); } else if (nS < 44) Hs.sucM.setMatrixAt(nS++, D.matrix);
      if (k < 44) Hs.glow.set(k, m.x, m.y, m.zz);
      if (m.withH && nH < 24) { D.position.set(m.x + 0.08, m.y - 0.17, m.zz); D.scale.setScalar(0.065); D.updateMatrix(); Hs.hpM.setMatrixAt(nH++, D.matrix); }
    });
    for (i = Hs.mol.length; i < 44; i++) Hs.glow.hide(i);
    Hs.glow.commit(); Hs.glow.mat.opacity = 0.45;
    Hs.hp.forEach(function (h) { var e = ease(h.u); D.position.set(PDX.pump[0] + (PDX.wall[0] + 0.25 - PDX.pump[0]) * e, PDX.pump[1] + (PDX.wall[1] - PDX.pump[1]) * e, ZF + 0.14); D.scale.setScalar(0.065 * (1 - Math.max(0, h.u - 0.8) / 0.2)); D.updateMatrix(); if (nH < 24) Hs.hpM.setMatrixAt(nH++, D.matrix); });
    D.rotation.set(0, 0, 0);
    var nW = 0;
    Hs.wat.forEach(function (w) { var e = ease(w.u); D.position.set(GEO.xy[0] + (GEO.se[0] - GEO.xy[0]) * e, GEO.xy[1] + (GEO.se[1] - GEO.xy[1]) * e, w.z); D.rotation.set(0, t, 0); D.scale.setScalar(1.3); D.updateMatrix(); Hs.watM.setMatrixAt(nW++, D.matrix); });
    D.scale.setScalar(0); D.updateMatrix();
    for (i = nS; i < 44; i++) Hs.sucM.setMatrixAt(i, D.matrix);
    for (i = nO; i < 24; i++) Hs.sorM.setMatrixAt(i, D.matrix);
    for (i = nR; i < 16; i++) Hs.rafM.setMatrixAt(i, D.matrix);
    for (i = nH; i < 24; i++) Hs.hpM.setMatrixAt(i, D.matrix);
    for (i = nW; i < 14; i++) Hs.watM.setMatrixAt(i, D.matrix);
    [Hs.sucM, Hs.sorM, Hs.rafM, Hs.hpM, Hs.watM].forEach(function (x) { x.instanceMatrix.needsUpdate = true; });
    /* names */
    var hn = Hs.hn; hn.begin();
    for (i = Hs.mol.length - 1; i >= 0; i--) { var m2 = Hs.mol[i]; if (m2.down > 3) continue; hn.add(m2.raf ? 'raf' : m2.sor ? 'sor' : 'suc', m2, m2.raf ? 'raffinose' : m2.sor ? 'sorbitol' : 'sucrose', m2.x, m2.y, m2.zz, 0.12, { all: false }); }
    Hs.mol.forEach(function (m3) { if (m3.withH) hn.add('hp', m3.id + 'h', 'H⁺', m3.x + 0.08, m3.y - 0.17, m3.zz, 0.065, { all: false, q: 1 }); });
    Hs.wat.forEach(function (w) { if (w.u > 0.15 && w.u < 0.85) { var e = ease(w.u); hn.add('wat', w, 'H₂O', GEO.xy[0] + (GEO.se[0] - GEO.xy[0]) * e, GEO.xy[1] + (GEO.se[1] - GEO.xy[1]) * e, w.z, 0.12, { all: false, q: 1 }); } });
    hn.end();
    if (dt > 0 && ((t * 3) | 0) !== Hs.lastLive) { Hs.lastLive = (t * 3) | 0; hLive(); }
  }
  function hCamera(ctx, t) {
    /* FIX ROUND 1: follow the Look closer chip (names for that view; the SWEET and SUT chip shows active loading) */
    var o = ctx.orbit, fz = o && o.engaged ? o.focusId || null : null;
    if (fz !== H.fz) {
      H.fz = fz;
      if (H.pdOn) H.pdOn.mat.opacity = fz === 'pd' ? 0 : 0.9;
      if (H.setFade) H.setFade(fz === 'se' || fz === 'pd', fz === 'pd' ? 0.1 : 0.07);
      if (fz === 'tr' && S().load !== 'apo') setTimeout(function () { PP.set({ load: 'apo' }); }, 0);
      else if (H.labels) setTimeout(function () { H.labels(); if (ctx.invalidate) ctx.invalidate(); }, 0);
    }
    var cam = ctx.camera, asp = ctx.w / ctx.h, tv = Math.tan(cam.fov * Math.PI / 360);
    var halfW = ctx.narrow ? 2.5 : 3.6, halfH = ctx.narrow ? 3.2 : 2.9;
    var D = Math.max(halfW / (tv * asp), halfH / tv) + 1.5;
    var yaw = 0.3 + 0.12 * Math.sin(t * 0.07), pitch = 0.2 + 0.05 * Math.sin(t * 0.05 + 1);
    var tx = ctx.narrow ? 0.1 + 0.8 * Math.sin(t * 0.05) : 0.25, ty = -0.15, tz = ZF - 0.5;
    cam.position.set(tx + Math.sin(yaw) * Math.cos(pitch) * D, ty + Math.sin(pitch) * D, tz + Math.cos(yaw) * Math.cos(pitch) * D);
    cam.lookAt(tx, ty, tz);
    ctx.scene.fog.near = D - 1; ctx.scene.fog.far = D + 12; ctx.farScene.fog.near = D; ctx.farScene.fog.far = D + 18;
  }
  function hLive() {
    if (!H.ctx || !H.ctx.setLive) return;
    var st = S(), r = R(), L = r.load || {};
    var ld = { apo: 'active, through the cell wall', sym: 'passive, through plasmodesmata', trap: 'polymer trap' }[st.load];
    H.ctx.setLive('Loading: ' + ld + ' · sieve element ' + num(st.conc, 1) + ' % sugar, mesophyll ' + num(L.mesoPct, 1) + ' % · source turgor ' + num(r.Psrc, 2) + ' MPa · model');
  }
  function hInit(host) {
    if (!host || H.ctx || !PP.macro) return;
    H.ctx = PP.macro.hero(host, {
      id: 'ps-hero', seed: 23, fov: 30, exposure: 1.0, capAlign: 'left',
      lift: function (ctx) { return ctx.narrow ? 64 : 46; },
      palette: { light: { top: '#1f3a1c', mid: '#3f6a34', bot: '#86a95f', bokeh: ['#eaf6c8', '#a7c46c', '#f6e7b0', '#cfe6a0'], fog: 0x3f6a34, fg: 'rgba(200,226,160,.5)' },
        dark: { top: '#05090a', mid: '#0e1d16', bot: '#15291e', bokeh: ['#2f6f43', '#305b2c', '#7a6a2c', '#3c7a4a'], fog: 0x0e1d16, fg: 'rgba(70,130,80,.45)' } },
      label: 'Three dimensional view of a minor vein in a leaf, cut open. Green glassy mesophyll cells with chloroplasts surround a ring of bundle sheath cells. Inside the ring sit a blue xylem vessel with ring thickenings, a pale phloem parenchyma cell, an orange companion cell and a golden sieve element divided by sieve plates. Sugar molecules, sucrose and in the almond family sorbitol, walk from the mesophyll through glowing plasmodesmata. In active loading they leave the parenchyma through SWEET into the cell wall and come back into the companion cell through SUT with a yellow proton; in the polymer trap they become raffinose in the companion cell. They then enter the sieve element and travel down the vein, while water molecules move in from the xylem.',
      question: 'How does sugar get into a vein?',
      answer: 'Through one of three doors. <b>Active loading</b> (many herbs): sugar moves cell to cell to the phloem parenchyma, SWEET proteins let it out into the cell wall, down its gradient, and SUT pulls it into the companion cell with a proton, so the sieve element ends up far richer in sugar than the leaf around it. <b>Passive loading</b> (many trees): sugar diffuses through plasmodesmata all the way, always downhill, so the leaf must hold a lot of sugar. <b>Polymer trap</b>: sucrose diffuses in and is built into raffinose, too big to go back. Either way the sugar draws water in from the xylem next door, and that water pressure is what will push the sap to the roots. Switch the loading type and the sugar below.',
      credit: { text: 'Rennie & Turgeon · PNAS 2009', doi: '10.1073/pnas.0902279106' },
      height: function (w) { return w < 600 ? 540 : Math.round(Math.min(680, Math.max(470, w * 0.62))); },
      fallbackNote: 'This 3D scene needs WebGL, which this browser does not offer. The drawing in 1.1 below shows the same path, cell by cell.',
      build: hBuild, frame: hFrame, camera: hCamera,
      focus: [
        { id: 'vein', label: 'The vein', target: [0.1, -0.15, ZF - 0.3], dist: 6.2, theta: 0.35, phi: 1.3 },
        { id: 'pd', label: 'Plasmodesmata', tag: 'Plasmodesma: a channel through the wall', target: function () { var b = H.pdTarget(); return [b.x, b.y, ZF - 0.7]; }, dist: 2.1, theta: Math.PI - 0.45, phi: 1.2 },
        { id: 'tr', label: 'SWEET and SUT', tag: 'SUT: sucrose in, with H⁺', target: [PDX.sut[0], PDX.sut[1], ZF + 0.05], dist: 3.1, theta: 0.15, phi: 1.45 },
        { id: 'se', label: 'Sieve element', target: [GEO.se[0], GEO.se[1], z0p() + 1.1], dist: host.clientWidth < 600 ? 11 : 6.4, theta: -1.2, phi: 1.3 } /* phones: pull back so two elements and a plate fit */
      ]
    });
    hLive();
    if (ui.railWatch && H.ctx.wrap) ui.railWatch(H.ctx.wrap);
    U().onPrefs(function () { if (H.ctx && H.ctx.retheme) H.ctx.retheme(); });
  }

  /* ================================================================== page */
  var CSS = '#lv-source .ps-ctrls{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:4px 18px;margin:12px 0 0;border-top:1px solid var(--rule2)}' +
    '#lv-source .ps-sw{display:flex;flex-wrap:wrap;gap:6px;align-items:center}#lv-source .ps-sw .chip{min-height:36px;font-size:13.5px}' +
    '#lv-source .ps-legend{display:flex;flex-wrap:wrap;gap:4px 14px;font-family:var(--ui);font-size:12.5px;color:var(--ink2);margin:8px 0 0}' +
    '#lv-source .ps-legend i{display:inline-block;width:11px;height:11px;border-radius:50%;margin-right:5px;vertical-align:-1px}' +
    '#lv-source .eq{font-family:var(--mono);font-size:13.5px;line-height:1.9;overflow-x:auto}' +
    '#lv-source .ps-theatre{min-height:300px}';
  function tile(id, k, unit, cls) { return '<div class="tile' + (cls ? ' ' + cls : '') + '" id="' + id + '"><div class="k">' + k + '</div><div class="v"><span class="n">0</span> <small>' + (unit || '') + '</small></div></div>'; }
  function setTile(id, v) { var e = document.querySelector('#' + id + ' .n'); if (e) e.textContent = v; }
  function chipRow(attr, list, cur) { return list.map(function (o) { return '<button type="button" class="chip" ' + attr + '="' + o[0] + '" aria-pressed="' + (o[0] === cur ? 'true' : 'false') + '">' + o[1] + '</button>'; }).join(''); }

  function mount(el) {
    U();
    var E = ui.ev, st = S();
    var leg = function (col, tx) { return '<span><i style="background:' + col + '"></i>' + tx + '</span>'; };
    el.innerHTML = '<style>' + CSS + '</style>' +
      '<div class="ps-hero" id="ps-hero"></div>' +
      ui.now('<b>What is happening:</b> <span id="ps-now"></span>', 'ps-nowp') +

      '<figure class="fig lx-fig" id="ps-live"><div class="fighead"><h3>1.1 Three ways in</h3><p>From the cell that made the sugar to the sieve element that carries it away. Pick how the leaf loads.</p></div>' +
      '<div class="lx-frame ps-theatre" id="ps-th"></div>' +
      '<div class="ps-legend" aria-hidden="true">' + leg(KIT.COL.suc, 'sucrose') + leg(KIT.COL.sor, 'sorbitol') + leg(KIT.COL.raf, 'raffinose (polymer trap)') + leg(KIT.COL.hp, 'H⁺') + leg('#d9402f', 'H₂O') + leg('#8a5cc4', 'SWEET') + leg('#1f9e93', 'SUT') + '</div>' +
      '<div class="ps-ctrls">' +
      '<div class="ctl"><span class="ctl-l">How the leaf loads</span><div class="ps-sw" role="group" aria-label="Loading type">' + chipRow('data-load', [['apo', 'Active, through the wall'], ['sym', 'Passive, plasmodesmata'], ['trap', 'Polymer trap']], st.load) + '</div><div class="hint">most herbs load actively; many trees passively</div></div>' +
      '<div class="ctl"><span class="ctl-l">What the leaf exports</span><div class="ps-sw" role="group" aria-label="Sugar exported">' + chipRow('data-sugar', [['sucrose', 'Sucrose'], ['rosaceae', 'Sucrose and sorbitol']], st.sugar) + '</div><div class="hint">sorbitol: almond, peach, apple and their family</div></div>' +
      '<div class="ctl tier-2"><label for="ps-psix">Xylem water potential <output id="ps-psix-o"></output></label><input type="range" id="ps-psix" min="-2.5" max="0" step="0.05"><div class="hint">the sieve element must draw its water from here</div></div>' +
      '<div class="ctl tier-2"><label for="ps-conc">Sugar in the sieve element <output id="ps-conc-o"></output></label><input type="range" id="ps-conc" min="2" max="32" step="0.5"><div class="hint">measured near 18 %</div></div>' +
      '<div class="ctl tier-3"><label for="ps-sorb">Sorbitol share of the sugar <output id="ps-sorb-o"></output></label><input type="range" id="ps-sorb" min="0" max="1" step="0.05"><div class="hint">only with sucrose and sorbitol; ' + E('ps.molar') + '</div></div>' +
      '<div class="ctl"><span class="ctl-l">Scene</span><div class="ps-sw"><button type="button" class="btn small" id="ps-pause" aria-pressed="false">Pause</button></div></div>' +
      '</div>' +
      '<figcaption class="cap" id="ps-cap"></figcaption>' +
      '<p class="cap lx-row">Bars show the sugar in each cell relative to the mesophyll, from the model; molecules move at teaching speeds. ' + E('ps.ratio') + ' ' + E('ps.drawn') + ' ' + E('ph.load.three_types', 'Three loading types') + '</p>' +
      '</figure>' +

      '<div class="tiles lx-tiles" id="ps-tiles">' +
      tile('ps-t-meso', 'Sugar in the mesophyll', '%') + tile('ps-t-se', 'Sugar in the sieve element', '%') + tile('ps-t-ratio', 'Sieve element ÷ mesophyll', '×') +
      tile('ps-t-route', 'Route', '') + tile('ps-t-pi', 'Osmotic pressure of the sap, Π', 'MPa', 'tier-2') + tile('ps-t-p', 'Turgor at the source, P', 'MPa', 'tier-2') +
      '</div>' +

      '<section class="lx-cases" aria-label="What we know"><h3 class="lx-h3">What we know, and how</h3><div class="lx-cardgrid">' +
      '<div class="card lx-case"><p class="lx-ck">Two transporters, one wall</p><p>In Arabidopsis, SWEET11 and SWEET12 export sucrose from the phloem parenchyma into the cell wall space, and SUT, a sucrose and proton cotransporter, takes it into the companion cell and sieve element. Plants missing both SWEETs are defective in phloem loading. ' + E('ph.load.sweet_sut', 'Chen et al. 2012') + ' ' + E('ph.load.review_2018', 'Zhang and Turgeon 2018') + '</p><p class="tier-2">What pays for the uphill step is the proton gradient across the companion cell membrane, built by a proton pump. ' + E('ps.atpase') + '</p><p><button type="button" class="btn small" data-ps="apo">Show active loading</button></p></div>' +
      '<div class="card lx-case"><p class="lx-ck">Herbs push, trees let it flow</p><p>Across 45 dicot species, three loading types appeared, and leaf sugar differed more than 50 fold with the type. Active loading goes with the herbaceous habit; passive loading through plasmodesmata with trees. ' + E('ph.load.three_types', 'Rennie and Turgeon 2009') + ' ' + E('ph.load.growth_form', 'Davidson et al. 2011') + '</p><p class="tier-2">How do we know poplar loads passively? Poplar made to destroy any sucrose in its cell walls (a yeast invertase there) grew normally; alfalfa with the same construct could not load. ' + E('ph.load.poplar_passive', 'Zhang et al. 2014') + '</p><p><button type="button" class="btn small" data-ps="sym">Show passive loading</button></p></div>' +
      '<div class="card lx-case"><p class="lx-ck">Almond’s family exports sorbitol</p><p>In many Rosaceae, sorbitol is a primary product of photosynthesis and the main sugar exported, and the list names almond, apple, cherry, peach and pear. Peach phloem sap carries a lot of sorbitol along with sucrose. ' + E('ph.rosa.sorbitol_family', 'Gao et al. 2003') + ' ' + E('ph.rosa.peach_sap', 'Nadwodnik and Lohaus 2008') + '</p><p class="tier-2">Apple loads sorbitol and sucrose passively. Peach, measured alongside three herbs, had the smallest sap to leaf ratios, which the authors read as mixed loading. Nobody has measured almond yet. ' + E('ph.rosa.apple_passive', 'Reidel et al. 2009') + ' ' + E('ph.oq.almond_loading', 'Open question') + '</p><p><button type="button" class="btn small" data-ps="rosa">Load like an almond relative</button></p></div>' +
      '<div class="card lx-case tier-2"><p class="lx-ck">The polymer trap</p><p>Some plants (melon type loaders) let sucrose diffuse into an intermediary cell and build it into raffinose and stachyose there. The larger sugars cannot diffuse back through the plasmodesmata, so sugar piles up in the phloem without a transporter. ' + E('ph.load.three_types', 'Rennie and Turgeon 2009') + ' ' + E('ph.load.polymer_model', 'Comtet et al. 2017') + '</p><p><button type="button" class="btn small" data-ps="trap">Show the polymer trap</button></p></div>' +
      '</div></section>' +

      '<section class="tier-3 lx-expert" aria-label="Expert"><h3 class="lx-h3">Equations, constants and what is still argued</h3>' +
      '<div class="card eq">Π = (m<sub>sugar</sub> + m<sub>K</sub>) R T    van ’t Hoff, ideal; m in mol per kg water ' + E('ps.vanthoff') + '<br>' +
      'm<sub>sugar</sub> = (c / M) / (100 − c) × 1000    c in % w/w; M = 342.30 g mol⁻¹ sucrose, 182.17 g mol⁻¹ sorbitol ' + E('ps.molar') + '<br>' +
      'P<sub>source</sub> = Ψ<sub>x</sub> + Π    water potential equal across the wall between xylem and sieve tube ' + E('ps.coupling') + '</div>' +
      '<div class="lx-tw"><table class="lx-tab"><thead><tr><th>Quantity</th><th>Value now</th><th>Status</th></tr></thead><tbody id="ps-ktab"></tbody></table></div>' +
      '<div class="card lx-open"><p class="lx-ck">' + ui.badge('OPEN QUESTION') + ' How do passive loaders make enough pressure?</p><p>A tree that loads passively cannot hold more sugar in its sieve tubes than in its leaves, yet it pushes sap tens of metres. A synthetic “tree on a chip” loading passively reached about 1 MPa, a device value, not a plant one, and sieve tube structure changes along tall trees. Is that enough? ' + E('ph.load.chip_passive', 'Comtet et al. 2017') + ' ' + E('ph.oq.tall_passive', 'Open question') + '</p></div>' +
      '<div class="card lx-open"><p class="lx-ck">' + ui.badge('OPEN QUESTION') + ' Why export sorbitol at all?</p><p>Apple leaves hold a lot of sorbitol and sucrose. The authors suggest that moving sorbitol at high concentration lets the leaf avoid the feedback on photosynthesis that very high sucrose would cause. That is their hypothesis. Apple with sorbitol synthesis silenced cut the sorbitol to sucrose ratio by about 90 % in leaves, made more sucrose and starch instead, and fixed less carbon; in apple, sorbitol also switches on the genes that break it down. How would you test the feedback idea in almond? ' + E('ph.rosa.apple_passive', 'Reidel et al. 2009') + ' ' + E('ph.rosa.apple_silencing', 'Teo et al. 2006') + ' ' + E('ph.rosa.sorbitol_signal', 'Meng et al. 2023') + '</p></div>' +
      '<div class="card lx-open"><p class="lx-ck">Loading and water go together</p><p>Across 45 species, trees and the few passive loading herbs had low whole plant hydraulic conductance, high leaf osmolality and high transport sugar in their leaves; actively loading herbs had high conductance and little leaf sugar. ' + E('ph.load.trees_water', 'Fu et al. 2011') + ' Plate III takes this up: the sieve tube can only make pressure out of the water the xylem gives it.</p></div>' +
      ui.design({ title: 'does almond load like apple or like peach?', question: 'Do almond minor veins concentrate newly made sugar (active or mixed loading) or not (passive)?',
        treat: 'Mature leaves of potted almond trees, with apple (passive) and an actively loading herb as reference species, all labelled the same way in the same light.',
        measure: 'Minor vein accumulation of label after a short ¹⁴CO₂ pulse; plasmodesmata at the bundle sheath and phloem boundary; sorbitol and sucrose in phloem sap (aphid stylets) against the mesophyll.',
        howto: ['ph.c14', 'ph.stylet'], n: 'Trees are the replicates: at least 5 trees per species, leaves of the same age and position.',
        expect: 'If almond behaves like apple, no vein accumulation and many plasmodesmata ' + ui.badge('OPEN QUESTION'),
        confound: 'Sorbitol and sucrose may load differently in the same leaf, so measure both sugars separately; and leaf age changes loading.' }) +
      ui.howto('ph.c14') + ui.howto('ph.stylet') + ui.howto('ph.osmo') +
      '<p class="hint">Methods links: no PrometheusWiki protocol page for phloem loading, sap sampling or osmolality was confirmed in this session; the methods papers are cited instead.</p>' +
      '</section>' +

      '<section class="lx-qs" aria-label="Questions"><h3 class="lx-h3">Check yourself</h3>' +
      ui.reveal('Predict: the leaf loads passively. Can the sieve element hold more sugar than the mesophyll cells next to it? Then switch 1.1 to passive loading and watch the bars.',
        '<p>No. Passive loading is diffusion through plasmodesmata, and diffusion only runs downhill, so the mesophyll must hold at least as much sugar as the phloem. That is why passive loaders, often trees, keep a lot of sugar in their leaves.</p>', { choices: [
          ['No, diffusion only runs downhill', true, 'Without a pump or a trap, sugar cannot pile up against its gradient.'],
          ['Yes, plasmodesmata pump sugar', false, 'Plasmodesmata are channels, not pumps.'],
          ['Yes, if the leaf is big enough', false, 'Leaf size does not change the direction of diffusion.']] }) +
      '<div class="tier-2">' + ui.reveal('Count it: the sieve element sap is 18 % sucrose at 25 °C and the xylem next to it sits at −0.50 MPa. What is the turgor in the sieve element?',
        '<p>About 1.09 MPa. Π = m R T = 0.641 mol kg⁻¹ × 8.314 × 298.15 ≈ 1.59 MPa, and P = Ψx + Π = −0.50 + 1.59 ≈ 1.09 MPa, close to the 1.08 MPa measured in morning glory. Drop the xylem to −1.00 MPa and the turgor falls to about 0.59 MPa.</p>', { choices: [
          ['About 1.09 MPa', true, 'P = Ψx + Π = −0.50 + 1.59.'],
          ['About 1.59 MPa', false, 'That is Π alone. The xylem pulls on the same water.'],
          ['About −0.50 MPa', false, 'That is the xylem. The sugar draws water in and raises the pressure.']] }) + '</div>' +
      '</section>' +
      ui.quiz('source');
    A1 = ui.anim(el.querySelector('#ps-th'), { height: function (w) { return w < 600 ? 400 : 380; }, label: 'Drawing of five cells side by side, from a mesophyll cell to a sieve element, with sugar molecules moving between them through plasmodesmata or, in active loading, out through SWEET into the cell wall and back in through SUT with a proton; bars above each cell show how much sugar it holds.', draw: drawTheatre });
    var pb = el.querySelector('#ps-pause');
    pb.addEventListener('click', function () { var p = !A1.paused(); A1.pause(p); pb.setAttribute('aria-pressed', p ? 'true' : 'false'); pb.textContent = p ? 'Play' : 'Pause'; });
    if (window.PlaySpeed) pb.parentNode.insertBefore(window.PlaySpeed.chip('ps-light'), pb.nextSibling);
    el.addEventListener('click', function (e) {
      var b = e.target.closest('[data-load]'); if (b) { PP.set({ load: b.getAttribute('data-load') }); return; }
      b = e.target.closest('[data-sugar]'); if (b) { PP.set({ sugar: b.getAttribute('data-sugar') }); return; }
      b = e.target.closest('[data-ps]'); if (!b) return;
      var k = b.getAttribute('data-ps');
      if (k === 'rosa') PP.set({ sugar: 'rosaceae', load: 'sym' }); else PP.set({ load: k, sugar: 'sucrose' });
      var f = document.getElementById('ps-live'); if (f) f.scrollIntoView({ behavior: ui.reducedMotion() ? 'auto' : 'smooth', block: 'start' });
    });
    [['ps-psix', 'psiX'], ['ps-conc', 'conc'], ['ps-sorb', 'sorb']].forEach(function (p) { var i = el.querySelector('#' + p[0]); i.addEventListener('input', function () { var o = {}; o[p[1]] = +i.value; PP.set(o); }); });
    var hostH = el.querySelector('#ps-hero');
    if ('IntersectionObserver' in window) { var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); hInit(hostH); } }, { rootMargin: '200px' }); io.observe(hostH); } else hInit(hostH);
  }

  function update(st, res) {
    if (!document.getElementById('ps-now')) return;
    U();
    document.getElementById('ps-now').textContent = nowText();
    var cap = document.getElementById('ps-cap'); if (cap) cap.textContent = capText();
    Array.prototype.forEach.call(document.querySelectorAll('#lv-source [data-load]'), function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-load') === st.load ? 'true' : 'false'); });
    Array.prototype.forEach.call(document.querySelectorAll('#lv-source [data-sugar]'), function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-sugar') === st.sugar ? 'true' : 'false'); });
    [['ps-psix', 'psiX', function (v) { return num(v, 2) + ' MPa'; }], ['ps-conc', 'conc', function (v) { return num(v, 1) + ' %'; }], ['ps-sorb', 'sorb', function (v) { return Math.round(v * 100) + ' %'; }]].forEach(function (p) {
      var i = document.getElementById(p[0]); if (!i) return; if (document.activeElement !== i) i.value = st[p[1]]; var o = document.getElementById(p[0] + '-o'); if (o) o.textContent = p[2](st[p[1]]);
    });
    var L = res.load || {};
    setTile('ps-t-meso', num(L.mesoPct, 1)); setTile('ps-t-se', num(st.conc, 1)); setTile('ps-t-ratio', num(L.ratio, 1));
    setTile('ps-t-route', L.route === 'apoplast' ? 'via the wall' : (st.load === 'trap' ? 'trap' : 'cell to cell'));
    setTile('ps-t-pi', num(res.Pi, 2)); setTile('ps-t-p', num(res.Psrc, 2));
    var kt = document.getElementById('ps-ktab');
    if (kt) kt.innerHTML = [
      ['Sugar in the sap, c', num(st.conc, 1) + ' %', 'MEASURED', 'default 18 % (Knoblauch et al. 2016; mean 18.2 % over 41 species, Jensen et al. 2013)'],
      ['Solute in the sap, m', num(res.molal, 3) + ' mol kg⁻¹', 'DERIVED', ''],
      ['Osmotic pressure, Π', num(res.Pi, 2) + ' MPa', 'DERIVED', ''],
      ['Xylem water potential, Ψx', num(st.psiX, 2) + ' MPa', 'ILLUSTRATIVE', 'default −0.50 MPa, a teaching choice'],
      ['Turgor at the source, P', num(res.Psrc, 2) + ' MPa', 'MODEL', 'measured 1.08 MPa in morning glory'],
      ['Sieve element ÷ mesophyll sugar', num(L.ratio, 1) + ' ×', 'ILLUSTRATIVE', 'measured 2 to 40 fold (four species)']
    ].map(function (x) { return '<tr><td>' + x[0] + (x[3] ? '<br><small>' + x[3] + '</small>' : '') + '</td><td class="mono">' + x[1] + '</td><td>' + ui.badge(x[2]) + '</td></tr>'; }).join('');
    if (H.ctx) { hSync(); hLive(); H.ctx.invalidate(); }
    if (A1) A1.redraw();
  }

  PP.showme.source = [
    { at: '#ps-hero', say: 'A minor vein, cut open. Sugar made in the green mesophyll walks toward the golden sieve element.', wait: 6000 },
    { at: '#ps-live', fn: function () { PP.set({ load: 'apo', sugar: 'sucrose' }); }, say: 'Active loading: SWEET lets sucrose out into the cell wall, SUT pulls it into the companion cell with a proton. Watch the bars: the phloem holds ten times more.', wait: 7500 },
    { at: '#ps-live', fn: function () { PP.set({ load: 'sym' }); }, say: 'Passive loading: the sugar never leaves the cells. The bars flatten: the leaf must hold as much sugar as the phloem.', wait: 7000 },
    { at: '#ps-live', fn: function () { PP.set({ load: 'trap' }); }, say: 'Polymer trap: sucrose becomes raffinose in the companion cell and cannot diffuse back.', wait: 7000 },
    { at: '#ps-live', fn: function () { PP.set({ load: 'sym', sugar: 'rosaceae' }); }, say: 'The almond family exports sorbitol too. Same mass of sugar, about twice the particles, more pressure.', wait: 7000 },
    { at: '#ps-live', fn: function () { PP.set({ load: 'apo', sugar: 'sucrose' }); }, say: 'Your turn: dry the xylem in the conditions strip and watch the source turgor fall.', wait: 4500 }
  ];

  /* ================================================================== Test yourself, Plate I */
  var Q = PP.quiz = PP.quiz || {}; Q.items = Q.items || [];
  [
    { id: 'src-k-types', t: 1, plate: 'source', b: 'MEASURED', src: ['10.1073/pnas.0902279106'], q: 'Which of these is NOT one of the three ways leaves load sugar into the phloem?',
      o: [['Pumping sugar up from the roots in the xylem', 'Right. The three are active loading through the cell wall, passive loading through plasmodesmata, and the polymer trap.'], ['Passive loading through plasmodesmata', 'That is one of the three, common in trees.'], ['The polymer trap', 'That is one of the three: sucrose is built into raffinose and stachyose in intermediary cells.']], a: 0 },
    { id: 'src-k-sweet', t: 1, plate: 'source', b: 'MEASURED', src: ['10.1126/science.1213351'], q: 'In active (apoplastic) loading, which pair of proteins moves sucrose out of one cell and into the companion cell?',
      o: [['SWEET out into the cell wall, then SUT in with a proton', 'Right. Shown with sucrose sensors and mutants in Arabidopsis (Chen et al. 2012).'], ['Aquaporins out, then aquaporins in', 'Aquaporins carry water, not sucrose.'], ['Rubisco out, then SWEET in', 'Rubisco fixes CO₂ in the chloroplast; it does not move sugar.']], a: 0 },
    { id: 'src-k-trap', t: 1, plate: 'source', b: 'MEASURED', src: ['10.1073/pnas.0902279106'], q: 'In the polymer trap, what does the intermediary cell build sucrose into?',
      o: [['Raffinose and stachyose, which are too big to diffuse back', 'Right. That traps sugar in the phloem without a transporter.'], ['Starch, stored for the night', 'Starch is stored in chloroplasts, not built in the phloem to trap sugar.'], ['Sorbitol', 'Sorbitol is a separate transport sugar of Rosaceae, made in the leaf.']], a: 0 },
    { id: 'src-k-trees', t: 1, plate: 'source', b: 'MEASURED', src: ['10.1007/s00709-010-0240-7'], q: 'Which kind of plant most often loads passively, through plasmodesmata?',
      o: [['Trees', 'Right. Passive loading goes with the tree growth form; active loading with herbs.'], ['Herbs', 'Herbs are mostly active, apoplastic loaders.'], ['Neither, every plant loads actively', 'Passive loading is widespread, especially in trees.']], a: 0 },
    { id: 'src-k-sorb', t: 1, plate: 'source', b: 'MEASURED', src: ['10.1104/pp.102.016725'], q: 'Almond, peach and apple export a second sugar besides sucrose. Which?',
      o: [['Sorbitol', 'Right. In many Rosaceae sorbitol is a primary product of photosynthesis and the main transport sugar.'], ['Glucose', 'Glucose is not the main transport form in these trees.'], ['Raffinose', 'Raffinose is the sugar of polymer trap loaders such as melon type plants.']], a: 0 },
    { id: 'src-k-pd', t: 1, plate: 'source', b: 'MEASURED', src: ['10.1073/pnas.0902279106'], q: 'In passive loading, sugar reaches the sieve element by:',
      o: [['Diffusing through plasmodesmata, the channels that join neighbouring cells', 'Right. It stays inside the cells the whole way.'], ['Crossing the cell wall by SWEET', 'That is the active route.'], ['Riding in the xylem', 'The xylem carries water up; sugar enters the phloem.']], a: 0 },
    { id: 'src-u-uphill', t: 2, plate: 'source', b: 'ILLUSTRATIVE', src: ['10.1007/s00425-007-0682-0'], q: 'A leaf has 1.8 % sugar in its mesophyll cytosol and 18 % in its sieve elements. Which loading types could do that?',
      o: [['Active loading (or a trap for total sugar), not passive diffusion', 'Right. Ten fold uphill needs a transporter or a trap. Measured ratios run 2 to 40 fold across four species.'], ['Passive loading', 'Diffusion cannot run uphill.'], ['Any type, ratios do not depend on loading', 'The ratio is exactly what separates the types.']], a: 0 },
    { id: 'src-u-pi', t: 2, plate: 'source', b: 'DERIVED', src: ['10.1111/pce.12004'], q: 'Sap at 18 % sucrose has Π ≈ 1.59 MPa. The xylem beside it is at −0.50 MPa. What turgor does the model give the sieve element?',
      o: [['About 1.09 MPa', 'Right. P = Ψx + Π = −0.50 + 1.59. Morning glory measured 1.08 MPa.'], ['About 2.09 MPa', 'The xylem potential is negative; it lowers the turgor.'], ['About 0.50 MPa', 'That ignores the osmotic pressure of the sugar.']], a: 0 },
    { id: 'src-u-sorb', t: 2, plate: 'source', b: 'DERIVED', src: [], q: 'Sorbitol weighs 182 g mol⁻¹ and sucrose 342 g mol⁻¹. At the same grams of sugar per litre of sap, how does the osmotic pressure compare?',
      o: [['Sorbitol gives about 1.9 times more', 'Right. 342 ÷ 182 = 1.88: twice the particles for the same mass, and Π counts particles.'], ['The same, because the mass is the same', 'Osmotic pressure counts particles, not grams.'], ['Sucrose gives more, because it is bigger', 'Bigger molecules mean fewer particles per gram.']], a: 0 },
    { id: 'src-u-poplar', t: 2, plate: 'source', b: 'MEASURED', src: ['10.1104/pp.114.245845'], q: 'Poplar and alfalfa were given an enzyme that destroys sucrose in the cell walls. Poplar grew normally; alfalfa could not load. What follows?',
      o: [['Poplar loads through plasmodesmata; alfalfa needs the cell wall route', 'Right. If sugar never enters the wall, destroying it there does nothing.'], ['Poplar does not export sugar', 'It grew normally, so it exported.'], ['The enzyme did not work in poplar', 'The comparison with alfalfa is the control for that.']], a: 0 },
    { id: 'src-u-sweet', t: 2, plate: 'source', b: 'MEASURED', src: ['10.1126/science.1213351'], q: 'An Arabidopsis plant lacks both SWEET11 and SWEET12. Which step of active loading fails?',
      o: [['Release of sucrose from the phloem parenchyma into the cell wall', 'Right. SUT then has little sucrose to take up; the double mutant is defective in loading.'], ['Uptake into the companion cell by SUT', 'SUT is still there; its supply in the wall is what is missing.'], ['Sugar synthesis in the mesophyll', 'Photosynthesis is not what the SWEETs do.']], a: 0 },
    { id: 'src-u-dry', t: 2, plate: 'source', b: 'MODEL', src: ['10.1111/pce.12004', '10.7554/eLife.15341'], q: 'Same sap (Π 1.59 MPa), but the xylem dries from −0.50 to −1.00 MPa. Sink turgor is 0.59 MPa. What happens in the model?',
      o: [['Source turgor drops to about 0.59 MPa, equal to the sink, and flow stops', 'Right. Unless the leaf loads more osmolyte, a drier xylem takes the pressure away.'], ['Nothing, the phloem is separate from the xylem', 'The sieve tube gets its water from the xylem; that is the coupling.'], ['Flow speeds up because the xylem pulls harder', 'A stronger pull lowers phloem pressure; it does not push sap.']], a: 0 },
    { id: 'src-q-almond', t: 3, plate: 'source', b: 'OPEN QUESTION', src: ['10.1104/pp.108.134791', '10.1007/s00425-007-0682-0'], q: 'A grower’s handout says almond loads sorbitol passively, just like apple. How strong is that claim?',
      o: [['Untested: apple loads passively and peach looks mixed, but no almond loading study was found', 'Right. Relatives are a hint, not a measurement. Say what was measured, and in which species.'], ['Proven, all Rosaceae load the same way', 'Apple and peach already differ.'], ['Wrong, almond certainly loads actively', 'No study supports that either.']], a: 0 },
    { id: 'src-q-silence', t: 3, plate: 'source', b: 'MEASURED', src: ['10.1073/pnas.0605873103'], q: 'Silencing sorbitol synthesis in apple cut the leaf sorbitol to sucrose ratio by about 90 %, and the trees survived. Someone concludes sorbitol is unnecessary. Evaluate.',
      o: [['Weak: the leaves made more sucrose and starch, fixed less carbon, and the fruit sugar and acid balance changed', 'Right. Survival is not the same as no effect; the plant paid for the change.'], ['Correct, survival proves it', 'The measured costs say otherwise.'], ['Correct, because sucrose can do everything sorbitol does', 'Assimilation fell, so the swap was not free.']], a: 0 },
    { id: 'src-q-waste', t: 3, plate: 'source', b: 'MEASURED', src: ['10.1104/pp.111.184820', '10.1073/pnas.0902279106'], q: 'Trees that load passively keep much more sugar in their leaves than active loaders. Someone calls this a waste. What is the best reply?',
      o: [['High leaf sugar is what passive loading requires, and across 45 species it travelled with low hydraulic conductance and high leaf osmolality; a cross species correlation cannot show it is waste or a benefit', 'Right. Describe the pattern; test the purpose separately.'], ['It is waste, trees are less efficient', 'Efficient for what? The comparison does not measure fitness.'], ['It cannot be true, sugar is always low in leaves', 'Measured leaf transport sugars differed more than 50 fold between types.']], a: 0 },
    { id: 'src-q-chip', t: 3, plate: 'source', b: 'MODEL', src: ['10.1038/nplants.2017.32'], q: 'A microfluidic “tree on a chip” loading passively reached about 1 MPa. Does that show tall trees load passively and make enough pressure?',
      o: [['No: it shows the physics can work in a device; whether trees do it is still open', 'Right. A device value is a MODEL, not a plant measurement.'], ['Yes, a chip is a tree', 'It mimics a mechanism; it is not a tree.'], ['No, 1 MPa is too small for any plant', 'Morning glory sieve tubes ran at about 1.08 MPa.']], a: 0 },
    { id: 'src-q-maize', t: 3, plate: 'source', b: 'MEASURED', src: ['10.1038/s41477-022-01098-x'], q: 'A maize sut1 mutant exported only about 4 % of the normal leaf carbon, yet kept its phloem pressure near normal by loading more potassium. What does that tell you about pressure flow?',
      o: [['Pressure comes from any osmolyte; sugar is the cargo, not the only source of pressure', 'Right. Sap speed stayed at 50 to 75 % of wild type, with little sugar in it.'], ['Pressure flow is not real', 'The pressure was measured and stayed up.'], ['Potassium is the main sugar in maize', 'Potassium is an ion, not a sugar.']], a: 0 },
    { id: 'src-q-why', t: 3, plate: 'source', b: 'OPEN QUESTION', src: ['10.1104/pp.108.134791'], q: 'Reidel and colleagues suggested apple moves sorbitol at high concentration to avoid the feedback on photosynthesis that high sucrose would cause. How should you treat that?',
      o: [['As the authors’ hypothesis, to be tested, for example by changing leaf sucrose and measuring photosynthesis', 'Right. A suggested reason is not a result.'], ['As an established fact', 'The paper proposes it; it does not prove it.'], ['As wrong, sorbitol has no role', 'Nothing retrieved shows that either.']], a: 0 }
  ].forEach(function (x) { if (!Q.items.some(function (y) { return y.id === x.id; })) Q.items.push(x); });

  PP.panels.push({
    id: 'source', mount: mount, update: update,
    show: function () { if (A1) { A1.resize(); A1.kick(); } if (H.ctx) { hLive(); H.ctx.invalidate(); } },
    hide: function () {}
  });
})();

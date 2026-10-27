/* Sugar on the move: Plate V, Under stress (phloem builder B, 14 Oct 2026).
   Drought takes push from the phloem (the xylem pulls its water away); the leaf can load more sugar to win it back, at the cost of thicker sap. Two ways to fail (Sevanto 2014, MODEL): turgor collapse or a viscous jam. Measured: beech under
   three years of rain exclusion moved sugar 47 % slower (Hesse et al. 2019); pine seedlings took 13.8 h instead of 7.1 h
   to move new carbon after drought plus heat (Rehschuh et al. 2022).
   Hero (3D): the Plate III bundle (PP.bundle3d) with stress captions.
   5.1 The safe window: a map of model speed over xylem water potential and sugar, with the turgor collapse zone, the
       sugar needed for the morning speed and the twice as thick as water line; tap the map to set both. 5.2 Drought in real trees (measured bars).
   Sources only from night/sheets/phloem.json ('ph.*' keys) or labelled MODEL, DERIVED, ILLUSTRATIVE. */
(function () {
  'use strict';
  var PP = window.PP = window.PP || {};
  PP.panels = PP.panels || [];
  PP.evidence = PP.evidence || {};
  PP.showme = PP.showme || {};
  var ui = null, TAU = Math.PI * 2;
  function U() { return (ui = PP.ui); }
  function R() { return PP.result || {}; }
  function S() { return PP.state || {}; }
  function num(x, d) { return U().num(x, d); }
  function clamp(x, a, b) { return x < a ? a : (x > b ? b : x); }

  var EV = PP.evidence;
  EV['pt.map'] = { claim: 'The map solves this page’s model at every pair of xylem water potential and sap sugar, holding the other controls where they are. Grey: the source turgor is not above the sink, so there is no push (turgor collapse). The solid white line: the sugar needed at each xylem water potential to move sap as fast as the default morning (147 µm s⁻¹). The dotted line: sap twice as thick as water at this temperature. Theory names a second failure mode, sap too viscous to move; this page’s teaching viscosity curve is gentle, so in the model more sugar still speeds the flow below 32 % and the viscous jam never wins on this map.', cite: 'This page’s model; the two failure modes follow Sevanto (2014) J Exp Bot 65: 1751 to 1759 (theory).', doi: '10.1093/jxb/ert467', measured: 'model', value: '', badge: 'MODEL', short: 'Safe window map' };
  EV['pt.heat'] = { claim: 'In this model temperature acts only through physics: warm sap is thinner (water viscosity falls with temperature) and Π rises a little (van ’t Hoff). Heat damage to cells, membranes or loading is not in the model, so the model makes heat look helpful. Measured plants say otherwise: recovery after drought plus heat was slower.', cite: 'Physics on this page; contrast with Rehschuh et al. (2022) New Phytol.', doi: '10.1111/nph.17815', measured: 'model limits', value: '', badge: 'DERIVED', short: 'Heat in the model' };

  /* ================================================================== 5.1 The safe window (2D) */
  var A1 = null, U_REF = 147, MAP = { key: '', img: null, ridge: [] }, NX = 50, NY = 36, PSI0 = -2.5, PSI1 = 0, C0 = 2, C1 = 32;
  function mapKey(st) { return [st.T, st.K, st.L, st.fPlate, st.kLumen, st.callose, st.Psink, st.sugar, st.sorb].join('|'); }
  function uCol(f, dark) {   // sequential: deep teal at slow to warm amber at fast
    var a = [dark ? [18, 40, 46] : [226, 236, 226], [60, 150, 130], [190, 200, 80], [250, 170, 60]];
    var x = clamp(f, 0, 1) * 3, i = Math.min(2, Math.floor(x)), u = x - i, p = a[i], q = a[i + 1];
    return 'rgb(' + Math.round(p[0] + (q[0] - p[0]) * u) + ',' + Math.round(p[1] + (q[1] - p[1]) * u) + ',' + Math.round(p[2] + (q[2] - p[2]) * u) + ')';
  }
  function compute(st) {
    var k = mapKey(st); if (MAP.key === k) return; MAP.key = k;
    var g = [], umax = 1; MAP.ridge = [];
    for (var i = 0; i < NX; i++) {
      var p = PSI0 + (PSI1 - PSI0) * (i + 0.5) / NX, col = [];
      for (var j = 0; j < NY; j++) {
        var c = C0 + (C1 - C0) * (j + 0.5) / NY, r = PP.solve(Object.assign({}, st, { psiX: p, conc: c }));
        col.push({ U: r.U, lost: r.dP <= 0 }); if (r.U > umax) umax = r.U;
      }
      g.push(col); MAP.ridge.push({ p: p, c: concForU(st, p, U_REF) });
    }
    MAP.g = g; MAP.umax = umax;
  }
  function concForU(st, psi, u) {   // sugar (%) that gives speed u at this xylem water potential; null if not reached by 32 % (model)
    var f = function (c) { return PP.solve(Object.assign({}, st, { psiX: psi, conc: c })).U - u; };
    if (f(C1) < 0) return null; if (f(C0) >= 0) return C0;
    var a = C0, b = C1; for (var i = 0; i < 30; i++) { var m = (a + b) / 2; if (f(m) >= 0) b = m; else a = m; } return b;
  }
  function thickConc(T) { return 18 * Math.log(2 * PP.etaWater(T) / PP.etaWater(T)) / Math.log(PP.viscosity(18, 25) / PP.etaWater(25)); }   // η = 2 η_water
  var GEO = {};
  function draw1(c, w, h, t, dt, info) {
    var st = S(), r = R(), dark = info.dark, narrow = w < 600, fs = narrow ? 10.5 : 11.5;
    var sans = function (wt, s) { return wt + ' ' + s + 'px "IBM Plex Sans",system-ui,sans-serif'; }, ink = dark ? '#e9e4d2' : '#25301f', sub = dark ? '#cfc8b4' : '#4a5340';
    compute(st);
    c.clearRect(0, 0, w, h);
    var bg = c.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, dark ? '#0d1315' : '#f4f2e8'); bg.addColorStop(1, dark ? '#0a0f12' : '#e9e8da'); c.fillStyle = bg; c.fillRect(0, 0, w, h);
    var x0 = narrow ? 44 : 64, x1 = w - (narrow ? 12 : 120), y0 = 24, y1 = h - 46;
    GEO = { x0: x0, x1: x1, y0: y0, y1: y1 };
    var cw = (x1 - x0) / NX, ch = (y1 - y0) / NY;
    for (var i = 0; i < NX; i++) for (var j = 0; j < NY; j++) {
      var cell = MAP.g[i][j], X = x0 + i * cw, Y = y1 - (j + 1) * ch;
      c.fillStyle = cell.lost ? (dark ? '#3a3a38' : '#b8b6ae') : uCol(cell.U / MAP.umax, dark);
      c.fillRect(X, Y, cw + 0.6, ch + 0.6);
    }
    /* hatch the collapse zone */
    c.save(); c.beginPath(); for (i = 0; i < NX; i++) for (j = 0; j < NY; j++) if (MAP.g[i][j].lost) c.rect(x0 + i * cw, y1 - (j + 1) * ch, cw + 0.6, ch + 0.6); c.clip();
    c.strokeStyle = dark ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.12)'; c.lineWidth = 1; for (var hx = x0 - h; hx < x1; hx += 9) { c.beginPath(); c.moveTo(hx, y1); c.lineTo(hx + (y1 - y0), y0); c.stroke(); } c.restore();
    var PX = function (p) { return x0 + (x1 - x0) * (p - PSI0) / (PSI1 - PSI0); }, CY = function (cc) { return y1 - (y1 - y0) * (cc - C0) / (C1 - C0); };
    /* the morning speed line, and the twice as thick as water line */
    c.strokeStyle = dark ? '#ffffff' : '#1d2a22'; c.lineWidth = 2.4; c.beginPath(); var started = false, lastIn = null;
    MAP.ridge.forEach(function (d) { if (d.c == null) { started = false; return; } if (started) c.lineTo(PX(d.p), CY(d.c)); else { c.moveTo(PX(d.p), CY(d.c)); started = true; } lastIn = d; }); c.stroke();
    var tc = thickConc(st.T); c.strokeStyle = dark ? 'rgba(255,255,255,.7)' : 'rgba(30,30,30,.6)'; c.lineWidth = 1.4; c.setLineDash([2, 4]); c.beginPath(); c.moveTo(x0, CY(tc)); c.lineTo(x1, CY(tc)); c.stroke(); c.setLineDash([]);
    /* axes */
    c.strokeStyle = dark ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.35)'; c.lineWidth = 1; c.strokeRect(x0, y0, x1 - x0, y1 - y0);
    c.fillStyle = sub; c.font = sans(500, fs - 1); c.textAlign = 'center';
    [-2.5, -2, -1.5, -1, -0.5, 0].forEach(function (v) { if (!narrow || v % 1 === 0 || v === -0.5) c.fillText(num(v, v % 1 ? 1 : 0), PX(v), y1 + 14); });
    c.fillText(narrow ? 'xylem water potential, MPa' : 'xylem water potential at the leaf, MPa (drier to the left)', (x0 + x1) / 2, y1 + 30);
    c.textAlign = 'right'; [2, 10, 18, 26, 32].forEach(function (v) { c.fillText(v + ' %', x0 - 5, CY(v) + 4); });
    c.save(); c.translate(narrow ? 10 : 14, (y0 + y1) / 2); c.rotate(-Math.PI / 2); c.textAlign = 'center'; c.fillText('sugar in the sap', 0, 0); c.restore();
    /* region names */
    c.font = sans(700, fs); c.textAlign = 'left';
    var lab = function (txt, x, y, col) { var tw = c.measureText(txt).width + 10; c.fillStyle = dark ? 'rgba(10,15,14,.78)' : 'rgba(255,253,246,.85)'; c.fillRect(x - 5, y - fs, tw, fs + 6); c.fillStyle = col; c.fillText(txt, x, y); };
    lab(narrow ? 'turgor lost' : 'turgor lost: no push', x0 + 8, y1 - 10, dark ? '#e0dcd0' : '#3a3a36');
    lab(narrow ? 'sap 2 × as thick as water' : 'above: sap more than twice as thick as water', Math.max(x0 + 8, PX(-2.4)), CY(tc) - 6, dark ? '#ffe2b0' : '#6a3a00');
    if (lastIn && !narrow) lab('as fast as the morning: ' + U_REF + ' µm s⁻¹', Math.min(x1 - 230, PX(-0.9)), Math.min(y1 - 30, CY(lastIn.c) + fs + 12), dark ? '#fff' : '#1d2a22');
    else if (narrow && lastIn) lab('morning speed', Math.max(x0 + 8, PX(-1.0)), Math.min(y1 - 30, CY(lastIn.c) + fs + 12), dark ? '#fff' : '#1d2a22');
    /* current point, pulsing */
    var px = PX(st.psiX), py = CY(st.conc), pr = 6 + (info.reduce ? 0 : 2 * Math.sin(t * 3));
    c.strokeStyle = dark ? '#fff' : '#111'; c.lineWidth = 2.5; c.beginPath(); c.arc(px, py, pr + 3, 0, TAU); c.stroke();
    c.fillStyle = r.stopped ? '#888' : (dark ? '#ffb05a' : '#c0661a'); c.beginPath(); c.arc(px, py, 5, 0, TAU); c.fill();
    var tl = r.stopped ? 'no flow' : num(r.U, 0) + ' µm s⁻¹'; c.font = sans(700, fs); var tw = c.measureText(tl).width + 10, tx = clamp(px + 12, x0 + 2, x1 - tw - 2), ty = clamp(py - 10, y0 + fs + 2, y1 - 4);
    c.fillStyle = dark ? 'rgba(10,15,14,.85)' : 'rgba(255,253,246,.92)'; c.fillRect(tx - 4, ty - fs, tw, fs + 6); c.fillStyle = ink; c.textAlign = 'left'; c.fillText(tl, tx + 1, ty);
    /* legend */
    if (!narrow) {
      var lx = x1 + 22, ly0 = y0 + 18, ly1 = y1 - 40;
      for (var k = 0; k <= 40; k++) { c.fillStyle = uCol(k / 40, dark); c.fillRect(lx, ly1 - (ly1 - ly0) * k / 40 - (ly1 - ly0) / 40, 14, (ly1 - ly0) / 40 + 1); }
      c.fillStyle = sub; c.font = sans(500, fs - 1.5); c.textAlign = 'left'; c.fillText(num(MAP.umax, 0), lx + 18, ly0 + 8); c.fillText('0', lx + 18, ly1); c.fillText('µm s⁻¹', lx - 2, ly0 - 6);
      c.fillStyle = dark ? '#3a3a38' : '#b8b6ae'; c.fillRect(lx, ly1 + 12, 14, 12); c.fillStyle = sub; c.fillText('no push', lx + 18, ly1 + 22);
    }
  }
  function setFromMap(ev) {
    var cv = A1 && A1.canvas; if (!cv) return;
    var b = cv.getBoundingClientRect(), x = ev.clientX - b.left, y = ev.clientY - b.top, g = GEO;
    if (x < g.x0 || x > g.x1 || y < g.y0 || y > g.y1) return;
    var p = PSI0 + (PSI1 - PSI0) * (x - g.x0) / (g.x1 - g.x0), cc = C0 + (C1 - C0) * (g.y1 - y) / (g.y1 - g.y0);
    PP.set({ psiX: Math.round(p * 20) / 20, conc: Math.round(cc * 2) / 2 });
  }

  function regime(st, r) {
    if (r.dP <= 0) return 'lost';
    return r.eta > 2 * r.etaW ? 'thick' : 'push';
  }
  function nowText() {
    var st = S(), r = R(), tier = U().tier(), g = regime(st, r);
    if (tier === 1) {
      if (g === 'lost') return 'The xylem is so dry that the sieve tube cannot hold its pressure: the sugar stops. Loading more sugar can win water back.';
      if (g === 'thick') return 'The sap is very sweet now, more than twice as thick as water. The extra sugar still pushes, but the thickness eats a large part of the gain.';
      return 'The phloem is moving sugar. Drag the xylem drier and see how much sugar the leaf needs to keep it going.';
    }
    var lab = { lost: 'Turgor collapse: Ψx + Π ≤ P_sink, no push.', thick: 'Thick sap: the sap is more than twice as viscous as water; more sugar still adds push in this model, at a growing cost.', push: 'Pressure limited: more sugar or wetter xylem would speed the flow.' }[g];
    return lab + ' Ψx ' + num(st.psiX, 2) + ' MPa, sugar ' + num(st.conc, 1) + ' %, ' + num(st.T, 0) + ' °C: source ' + num(r.Psrc, 2) + ' MPa, η ' + num(r.eta, 2) + ' mPa s, speed ' + num(r.U, 0) + ' µm s⁻¹ (model).';
  }

  /* ================================================================== page */
  var CSS = '#lv-stress .pt-ctrls{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:4px 18px;margin:12px 0 0;border-top:1px solid var(--rule2)}' +
    '#lv-stress .pt-sw{display:flex;flex-wrap:wrap;gap:6px;align-items:center}' +
    '#lv-stress .eq{font-family:var(--mono);font-size:13.5px;line-height:1.9;overflow-x:auto}' +
    '#lv-stress #pt-th canvas{cursor:crosshair}' +
    '#lv-stress .pt-bars{display:grid;gap:14px;margin:10px 0}#lv-stress .pt-grp p{margin:2px 0 6px;font-size:15.5px}' +
    '#lv-stress .pt-bar{display:grid;grid-template-columns:minmax(80px,120px) 1fr auto;gap:10px;align-items:center;font-size:15px;margin:4px 0}' +
    '#lv-stress .pt-bar .tr{height:16px;border-radius:8px;background:var(--rule2);overflow:hidden}#lv-stress .pt-bar .fl{display:block;height:100%;border-radius:8px}' +
    '#lv-stress .pt-bar .v{font-family:var(--mono);font-size:14px;font-variant-numeric:tabular-nums;white-space:nowrap}';
  function tile(id, k, unit, cls) { return '<div class="tile' + (cls ? ' ' + cls : '') + '" id="' + id + '"><div class="k">' + k + '</div><div class="v"><span class="n">0</span> <small>' + (unit || '') + '</small></div></div>'; }
  function setTile(id, v) { var e = document.querySelector('#' + id + ' .n'); if (e) e.textContent = v; }
  var SLD = [
    ['pt-psix', 'psiX', 'Xylem water potential at the leaf', -2.5, 0, 0.05, function (v) { return num(v, 2) + ' MPa'; }, 'drought pulls it down', ''],
    ['pt-conc', 'conc', 'Sugar in the sap', 2, 32, 0.5, function (v) { return num(v, 1) + ' %'; }, 'the leaf can load more to win water back', ''],
    ['pt-T', 'T', 'Temperature', 5, 40, 0.5, function (v) { return num(v, 1) + ' °C'; }, 'in the model heat only thins the sap', 'tier-2'],
    ['pt-k', 'K', 'Extra potassium in the sap', 0, 0.5, 0.01, function (v) { return num(v, 2) + ' mol kg⁻¹'; }, 'push without thicker sap (Babst et al. 2022)', 'tier-3']
  ];
  function bar(name, v, max, txt, col) { return '<div class="pt-bar"><span>' + name + '</span><span class="tr" aria-hidden="true"><span class="fl" style="width:' + Math.round(v / max * 100) + '%;background:' + col + '"></span></span><span class="v">' + txt + '</span></div>'; }
  var bundle = null;
  function mount(el) {
    U();
    var E = ui.ev, cA = '#3a8a6a', cB = '#d8902a';
    el.innerHTML = '<style>' + CSS + '</style>' +
      '<div class="pt-hero" id="pt-hero"></div>' +
      ui.now('<b>What is happening:</b> <span id="pt-now"></span>', 'pt-nowp') +
      '<figure class="fig lx-fig" id="pt-live"><div class="fighead"><h3>5.1 The safe window</h3><p>Every point is one leaf: its xylem water potential across, its sap sugar up. Colour is the model speed. Tap or click the map to move your leaf; find where a drought leaves room to move sugar.</p></div>' +
      '<div class="lx-frame" id="pt-th"></div>' +
      '<div class="pt-ctrls">' + SLD.map(function (x) { return '<div class="ctl' + (x[8] ? ' ' + x[8] : '') + '"><label for="' + x[0] + '">' + x[2] + ' <output id="' + x[0] + '-o"></output></label><input type="range" id="' + x[0] + '" min="' + x[3] + '" max="' + x[4] + '" step="' + x[5] + '"><div class="hint">' + x[7] + '</div></div>'; }).join('') +
      '<div class="ctl tier-2"><span class="ctl-l">Wound response</span><div class="pt-sw"><button type="button" class="chip" id="pt-cal" aria-pressed="false">Callose closes the plates</button></div><div class="hint">plates sealed within minutes after injury ' + E('ph.tube.geometry', 'Mullendore et al. 2010') + '</div></div>' +
      '<div class="ctl"><span class="ctl-l">Reset</span><div class="pt-sw"><button type="button" class="btn small" id="pt-reset">Back to the morning glory</button></div></div>' +
      '</div>' +
      '<p class="pt-sw" role="group" aria-label="Situations"><button type="button" class="btn small" data-pt="wet">A wet morning</button> <button type="button" class="btn small" data-pt="dry">Drought, same sugar</button> <button type="button" class="btn small" data-pt="adjust">Drought, more sugar</button> <button type="button" class="btn small" data-pt="jam">Drought, 32 % sugar</button> <button type="button" class="btn small tier-2" data-pt="heat">A hot afternoon</button> <button type="button" class="btn small tier-3" data-pt="K">Drought, potassium instead</button></p>' +
      '<figcaption class="cap" id="pt-cap"></figcaption>' +
      '<p class="cap lx-row">The map is the same model as Plates II and III, solved at every point. ' + E('pt.map') + ' ' + E('ps.coupling') + ' ' + E('pv.eta') + ' ' + E('pt.heat') + '</p>' +
      '</figure>' +
      '<div class="tiles lx-tiles">' +
      tile('pt-t-u', 'Sap speed', 'µm s⁻¹') + tile('pt-t-psrc', 'Turgor at the source', 'MPa') + tile('pt-t-reg', 'What limits the flow', '') +
      tile('pt-t-eta', 'Sap viscosity', 'mPa s', 'tier-2') + tile('pt-t-best', 'Sugar for the morning speed here', '%', 'tier-2') + tile('pt-t-trip', 'Trip time over the path', 'h', 'tier-2') +
      tile('pt-t-pi', 'Π of the sap', 'MPa', 'tier-3') + tile('pt-t-pik', 'Π from potassium', 'MPa', 'tier-3') +
      '</div>' +

      '<figure class="fig lx-fig" id="pt-real"><div class="fighead"><h3>5.2 Drought in real trees</h3><p>Measured, not modelled.</p></div>' +
      '<div class="pt-bars">' +
      '<div class="pt-grp"><p><b>Mature beech, three summers without rain on the roots</b> (throughfall exclusion, field) ' + E('ph.stress.beech_drought', 'Hesse et al. 2019') + '</p>' +
      bar('Control', 20.7, 22, '20.7 cm h⁻¹', cA) + bar('Drought', 11.0, 22, '11.0 cm h⁻¹', cB) +
      '<p class="tier-2">Phloem speed fell 47 %. New sugar stayed in the leaves longer: 32.1 h against 46.9 h. Speed followed predawn water potential.</p>' +
      '<div class="tier-2">' + bar('Control', 32.1, 50, '32.1 h in leaf', cA) + bar('Drought', 46.9, 50, '46.9 h in leaf', cB) + '</div></div>' +
      '<div class="pt-grp"><p><b>Scots pine seedlings, after the stress</b>: time for new carbon to reach root respiration ' + E('ph.stress.heat_recovery', 'Rehschuh et al. 2022') + '</p>' +
      bar('Heat only', 7.1, 15, '7.1 h', cA) + bar('Drought plus heat', 13.8, 15, '13.8 h', cB) +
      '<p class="tier-2">Seedlings that had both stresses also stored more starch in their leaves: sugar was made but moved slowly.</p></div>' +
      '</div>' +
      '<figcaption class="cap">' + ui.badge('MEASURED') + ' Two species, two kinds of experiment; read each pair on its own.</figcaption>' +
      '</figure>' +

      '<section class="lx-cases" aria-label="Ways to fail"><h3 class="lx-h3">How the phloem fails, and how it holds on</h3><div class="lx-cardgrid">' +
      '<div class="card lx-case"><p class="lx-ck">Two ways to stop</p><p>Theory gives drought two ways to stop the phloem: the sieve tubes lose turgor because the xylem takes their water, or the sap at the source becomes too thick to move. Which comes first depends on how leaky the sieve tube walls are to water; the evidence favours turgor collapse, at least in plants that keep their leaf water potential steady. ' + E('ph.stress.failure_modes', 'Sevanto 2014') + '</p><p><button type="button" class="btn small" data-pt="dry">Show turgor collapse</button> <button type="button" class="btn small" data-pt="jam">Show very sweet sap</button></p><p class="tier-2">This page’s model can show turgor collapse. It cannot show a true viscous jam: its teaching viscosity curve is gentler than concentrated sucrose, so below 32 % more sugar still speeds the flow. ' + E('pt.map') + '</p></div>' +
      '<div class="card lx-case"><p class="lx-ck">Three ways for a tree to die</p><p>A model with traits of 170 species separates carbon starvation, hydraulic failure and phloem transport failure. Phloem failure appears when photosynthesis is not very sensitive to drought but growth is. ' + E('ph.stress.three_modes', 'Mencuccini et al. 2015') + '</p></div>' +
      '<div class="card lx-case"><p class="lx-ck">Potassium keeps the push</p><p>In field eucalypts, carbon moved down the trunk at 0.20 to 0.82 m per hour, about twice as fast with potassium; rain exclusion had little effect except in one tree at a midday leaf water potential of −2.2 MPa. ' + E('ph.stress.eucalypt_K', 'Epron et al. 2016') + '</p><p class="tier-2">A maize mutant that could hardly load sucrose kept its phloem pressure by loading potassium. ' + E('ph.recent.maize_K', 'Babst et al. 2022') + ' Potassium adds push without thickening the sap the way sugar does; try it at depth 3.</p></div>' +
      '<div class="card lx-case tier-2"><p class="lx-ck">Built for dry places</p><p>Piñon pine and one seed juniper: the species that tolerates drying needs more phloem transport capacity, and gets it through several anatomical routes. ' + E('ph.stress.anatomy_arid', 'Sevanto et al. 2018') + '</p><p>Across 188 woody angiosperms, sieve element diameter tracked water availability, while vessel size tracked temperature. ' + E('ph.recent.anatomy_188', 'Wang et al. 2025') + '</p></div>' +
      '<div class="card lx-case tier-2"><p class="lx-ck">Not every tree slows</p><p>A review of tree phloem under drought found responses ranging from none, to slowdown, to possible disruption that threatens survival, and data from too few species. ' + E('ph.stress.review_salmon', 'Salmon et al. 2019') + '</p></div>' +
      '<div class="card lx-case tier-2"><p class="lx-ck">Heat in the model, heat in the plant</p><p>Push the temperature to 38 °C and the model sap flows faster, because warm water is thinner. Real seedlings moved new carbon more slowly after drought plus heat. The model knows only physics; damage to living cells is not in it. ' + E('pt.heat') + '</p></div>' +
      '</div></section>' +

      '<section class="tier-3 lx-expert" aria-label="Expert"><h3 class="lx-h3">Equations and what is still argued</h3>' +
      '<div class="card eq">turgor collapse:  Ψ<sub>x</sub> + Π(c, K, T) ≤ P<sub>sink</sub>  ⇒  U = 0 ' + E('px.stop') + '<br>viscous limit:  ∂U/∂c &lt; 0  ⇔  dΠ/dc · η &lt; ΔP · dη/dc  (not reached below 32 % with this teaching η) ' + E('pt.map') + '<br>' +
      'η(c, T) = η<sub>water</sub>(T) (1.7 / 0.89)<sup>c/18</sup> ' + E('pv.eta') + '<br>Π = (m<sub>sugar</sub> + m<sub>K</sub>) R T ' + E('ps.vanthoff') + '</div>' +
      '<div class="card lx-open"><p class="lx-ck">' + ui.badge('OPEN QUESTION') + ' When drought stops the phloem, is it turgor collapse or a viscous jam?</p><p>Theory allows both; evidence leans to turgor collapse in plants that hold their leaf water potential steady. Does it differ in plants that let their leaf water potential fall far? ' + E('ph.oq.failure_mode', 'Open question') + '</p></div>' +
      '<div class="card lx-open"><p class="lx-ck">' + ui.badge('OPEN QUESTION') + ' How fast does the phloem recover after drought and heat, and does slow recovery limit regrowth?</p><p>Pine seedlings needed about twice as long to move new carbon after drought plus heat as after heat alone; tree data cover few species. ' + E('ph.oq.recovery', 'Open question') + ' ' + E('ph.stress.heat_recovery', 'Rehschuh et al. 2022') + '</p></div>' +
      ui.design({ title: 'turgor collapse or viscous jam?', question: 'As a plant dries, does its phloem stop because sieve tube turgor falls to the sink value, or because the sap at the source becomes too viscous?',
        treat: 'Plants dried slowly to a series of xylem water potentials, against well watered plants, measured the same day.',
        measure: 'Xylem water potential; sieve tube turgor at the source; sap sugar and viscosity; label speed.',
        howto: ['ph.picogauge', 'ph.barkosm', 'ph.label'], n: 'Plants are the replicates; several per water potential step.',
        expect: 'Collapse: turgor falls to the sink value with sugar moderate. Jam: turgor stays up while sugar and viscosity climb and speed falls ' + ui.badge('MODEL'),
        confound: 'Drought also lowers photosynthesis, so less sugar is loaded; measure leaf sugar and assimilation alongside.' }) +
      ui.howto('ph.label') + ui.howto('ph.dendro') +
      '<p class="hint">Methods links: no PrometheusWiki protocol page for phloem under drought was confirmed in this session; the methods papers are cited instead.</p>' +
      '</section>' +

      '<section class="lx-qs" aria-label="Questions"><h3 class="lx-h3">Check yourself</h3>' +
      ui.reveal('Predict: in a drought the leaf keeps loading more and more sugar into the sap. What happens to the flow? Then press Drought, more sugar, and Drought, 32 % sugar.',
        '<p>In this model, yes, over 2 to 32 %: more sugar wins water back from the xylem and restores the push, but the sap thickens with every percent, so each step buys less. Theory says that at high enough concentration viscosity wins and transport jams; this page’s gentle teaching viscosity curve does not reach that point. Potassium is another way to add push without thickening the sap as much.</p>', { choices: [
          ['Faster, but each extra percent buys less', true, 'The push grows, and so does the thickness.'],
          ['Faster, in proportion to the sugar', false, 'Viscosity takes a growing share of the gain.'],
          ['It never helps', false, 'In a drought, some extra sugar restores the push.']] }) +
      '</section>' +
      ui.quiz('stress');
    A1 = ui.anim(el.querySelector('#pt-th'), { height: function (w) { return w < 600 ? 380 : 400; }, label: 'Map of model sap speed with xylem water potential across and sap sugar up. A grey hatched zone at the dry, low sugar corner marks lost turgor; colours rise from teal to amber where flow is fast; a solid white line marks the sugar needed for the morning speed, rising toward the dry side, and a dotted line marks sap twice as thick as water. A ring marks the present leaf.', draw: draw1 });
    A1.canvas.addEventListener('click', setFromMap);
    el.querySelector('#pt-reset').addEventListener('click', function () { PP.reset(); });
    el.querySelector('#pt-cal').addEventListener('click', function () { PP.set({ callose: !S().callose }); });
    SLD.forEach(function (x) { var i = el.querySelector('#' + x[0]); i.addEventListener('input', function () { var o = {}; o[x[1]] = +i.value; PP.set(o); }); });
    el.addEventListener('click', function (e) {
      var b = e.target.closest('[data-pt]'); if (!b) return;
      var k = b.getAttribute('data-pt'), D = PP.defaults;
      if (k === 'wet') PP.set({ psiX: -0.3, conc: D.conc, K: 0, T: 25, callose: false });
      else if (k === 'dry') PP.set({ psiX: -1.4, conc: D.conc, K: 0, T: 25 });
      else if (k === 'adjust') PP.set({ psiX: -1.4, conc: 26, K: 0, T: 25 });
      else if (k === 'jam') PP.set({ psiX: -1.4, conc: 32, K: 0, T: 25 });
      else if (k === 'heat') PP.set({ psiX: -0.8, T: 38 });
      else if (k === 'K') PP.set({ psiX: -1.4, conc: D.conc, K: 0.35, T: 25 });
      var f = document.getElementById('pt-live'); if (f && b.closest('.lx-case')) f.scrollIntoView({ behavior: ui.reducedMotion() ? 'auto' : 'smooth', block: 'start' });
    });
    var hostH = el.querySelector('#pt-hero');
    bundle = PP.bundle3d(hostH, {
      id: 'pt-hero', seed: 97,
      palette: { light: { top: '#2a2216', mid: '#5a4a32', bot: '#a08a66', bokeh: ['#ffe7c0', '#e0c08a', '#f6d7b0', '#c8d8a0'], fog: 0x5a4a32, fg: 'rgba(230,206,160,.5)' },
        dark: { top: '#0a0706', mid: '#1a130e', bot: '#2a2018', bokeh: ['#7a4f2f', '#5b4f2c', '#6a3a2c', '#3c4a3a'], fog: 0x1a130e, fg: 'rgba(140,100,60,.45)' } },
      label: 'Three dimensional view of the same vascular bundle as Plate III, xylem vessels on the left and sieve tubes on the right. As the xylem dries its blue glass turns pale, the sieve tubes lose their warm colour and turn grey when their turgor is gone, and the sugar molecules slow and stop; with callose on, the sieve plates turn solid white.',
      question: 'What does a drought do to sugar transport?',
      answer: 'It takes away the push. A drier xylem pulls water out of the sieve tubes, so their turgor falls; the sugar slows and can stop. The leaf can load more sugar to win water back, but very sweet sap is thick. In mature beech after three dry summers, phloem speed fell 47 %. Drag the xylem slider below, or tap the map, and watch these tubes.',
      credit: { text: 'Sevanto · J Exp Bot 2014', doi: '10.1093/jxb/ert467' },
      fallbackNote: 'This 3D scene needs WebGL, which this browser does not offer. The map in 5.1 below shows the same model.',
      live: function () { var r = R(), st = S(), g = regime(st, r); return { lost: 'Turgor lost · Ψx ' + num(st.psiX, 2) + ' MPa · no flow · model', thick: 'Thick sap · η ' + num(r.eta, 2) + ' mPa s · ' + num(r.U, 0) + ' µm s⁻¹ · model', push: 'Ψx ' + num(st.psiX, 2) + ' MPa · turgor ' + num(r.Psrc, 2) + ' MPa · ' + num(r.U, 0) + ' µm s⁻¹ · model' }[g]; },
      focus: PP.bundle3d.focus()
    });
    if ('IntersectionObserver' in window) { var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); bundle.init(); } }, { rootMargin: '200px' }); io.observe(hostH); } else bundle.init();
  }
  function update(st, res) {
    if (!document.getElementById('pt-now')) return;
    U();
    document.getElementById('pt-now').textContent = nowText();
    var g = regime(st, res); compute(st);
    var need = concForU(st, st.psiX, U_REF);
    var cap = document.getElementById('pt-cap');
    if (cap) cap.textContent = (g === 'lost' ? 'Your leaf is in the grey zone: Ψx ' + num(st.psiX, 2) + ' + Π ' + num(res.Pi, 2) + ' MPa does not beat the sink at ' + num(res.Psink, 2) + ' MPa. Move up (more sugar) or right (wetter xylem).' :
      g === 'thick' ? 'Your leaf is above the dotted line: at ' + num(st.conc, 1) + ' % the sap is ' + num(res.eta, 2) + ' mPa s, more than twice as thick as water. It moves at ' + num(res.U, 0) + ' µm s⁻¹ (model).' :
      'Your leaf moves sap at ' + num(res.U, 0) + ' µm s⁻¹. ' + (need == null ? 'At this xylem water potential no sugar up to 32 % reaches the morning speed of ' + U_REF + ' µm s⁻¹ (model).' : 'At this xylem water potential, ' + num(need, 1) + ' % sugar would match the morning speed of ' + U_REF + ' µm s⁻¹ (model).'));
    SLD.forEach(function (x) { var i = document.getElementById(x[0]); if (!i) return; if (document.activeElement !== i) i.value = st[x[1]]; var o = document.getElementById(x[0] + '-o'); if (o) o.textContent = x[6](st[x[1]]); });
    var cb = document.getElementById('pt-cal'); if (cb) cb.setAttribute('aria-pressed', st.callose ? 'true' : 'false');
    setTile('pt-t-u', num(res.U, 0)); setTile('pt-t-psrc', num(res.Psrc, 2));
    var rt = document.querySelector('#pt-t-reg .n'); if (rt) rt.textContent = { lost: 'turgor lost', thick: 'thick sap', push: 'pressure' }[g];
    setTile('pt-t-eta', num(res.eta, 2)); setTile('pt-t-best', need == null ? 'over 32' : num(need, 1)); setTile('pt-t-trip', isFinite(res.transit) ? num(res.transit, 1) : 'none');
    setTile('pt-t-pi', num(res.Pi, 2)); setTile('pt-t-pik', num(res.PiK, 2));
    if (bundle) bundle.update();
    if (A1) A1.redraw();
  }

  PP.showme.stress = [
    { at: '#pt-hero', say: 'The same two pipes in a drought: watch the xylem turn pale and the sieve tubes cool as the push drains away.', wait: 6000 },
    { at: '#pt-live', fn: function () { PP.set({ psiX: -0.3, conc: 18, K: 0, T: 25 }); }, say: 'A wet morning: plenty of push, sugar moving.', wait: 5500 },
    { at: '#pt-live', fn: function () { PP.set({ psiX: -1.4, conc: 18 }); }, say: 'Drought with the same sugar: the leaf falls into the grey zone. Turgor collapse.', wait: 6500 },
    { at: '#pt-live', fn: function () { PP.set({ psiX: -1.4, conc: 26 }); }, say: 'The leaf loads more sugar and climbs out of the grey: the flow returns.', wait: 6500 },
    { at: '#pt-live', fn: function () { PP.set({ psiX: -1.4, conc: 32 }); }, say: 'Very sweet sap: above the dotted line it is more than twice as thick as water, and each extra percent buys less.', wait: 6500 },
    { at: '#pt-real', fn: function () { PP.reset(); }, say: 'Real beech after three dry summers: 47 % slower. Real pine after drought plus heat: twice as slow to recover.', wait: 6000 }
  ];

  PP.panels.push({
    id: 'stress', mount: mount, update: update,
    show: function () { if (A1) { A1.resize(); A1.kick(); } if (bundle && bundle.ctx) bundle.update(); },
    hide: function () {}
  });
})();

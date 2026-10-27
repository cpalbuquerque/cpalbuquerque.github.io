/* Sugar on the move: Plate IV, Sinks (phloem builder B, 14 Oct 2026).
   Where the sugar leaves the phloem. Hero (3D, PP.macro + orbit): a growing root tip cut open, two protophloem sieve element
   files arriving from above, phloem pole pericycle cells beside them joined by funnel plasmodesmata, the growing cells of
   the tip around. Sugar flows down the sieve elements and leaves through the funnels by mass flow plus diffusion; large
   proteins leave in pulses and stay in the pericycle (Ross-Elliott et al. 2017 eLife; Ostermeyer et al. 2022 Plant J).
   4.1 One source, three sinks: a branch model on the engine (the source turgor of PP; each sink its own turgor and path).
   4.2 Two ways out: symplastic unloading in a root tip, apoplastic unloading in apple fruit (Zhang et al. 2004).
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
  EV['pk.branch'] = { claim: 'In this model one source feeds three sinks through tubes of the same kind. Each branch carries U = k ΔP ÷ (η L), where ΔP is the source turgor minus that sink’s turgor and L its path length; the share each sink gets is its flow over the total. The source turgor is held at Ψx + Π whatever the sinks take, which a real plant cannot quite do.', cite: 'Hagen-Poiseuille on this page’s engine; source rule from Nikinmaa et al. (2013).', doi: '10.1111/pce.12004', measured: 'model', value: '', badge: 'MODEL', short: 'Three sink model' };
  EV['pk.paths'] = { claim: 'Path lengths in the three sink model are teaching values: young leaf 0.5 m, fruit 1 m, root 2 m from the source leaf. The sink turgor defaults are the 0.59 MPa measured in a morning glory root, used for all three as a fair start.', cite: 'Teaching values; 0.59 MPa from Knoblauch et al. (2016) eLife.', doi: '10.7554/eLife.15341', measured: 'lengths chosen', value: '0.5, 1, 2 m', badge: 'ILLUSTRATIVE', short: 'Paths and defaults' };
  EV['pk.leaf'] = { claim: 'A young, growing leaf imports sugar until it can export its own. No paper on unloading in growing leaves was retrieved for this page, so the young leaf here is a teaching sink with no measured values.', cite: 'Teaching example of this page.', measured: 'none', value: '', badge: 'ILLUSTRATIVE', short: 'Young leaf' };
  EV['pk.drawn'] = { claim: 'The root tip in the 3D scene is drawn far larger and simpler than a real one: two protophloem files, one ring of pericycle cells, a few funnel plasmodesmata, and molecule speeds chosen for the eye. The funnel shape follows the papers; its size and number are not to scale.', cite: 'Drawing convention of this page.', measured: 'none', value: '', badge: 'ILLUSTRATIVE', short: 'Drawn root tip' };

  PP.howto['ph.unload'] = {
    title: 'how sugar leaves the phloem in a root tip', what: 'live imaging of a fluorescent tracer and of tagged proteins',
    steps: ['Grow seedlings on agar so the root tip can be imaged under a confocal microscope without touching it.',
      'Load a small fluorescent tracer into a source leaf (or express a fluorescent protein in companion cells) and watch it arrive in the protophloem of the root.',
      'Follow where it goes next and how fast: into the phloem pole pericycle and on into the growing cells, or held back.',
      'Use electron microscopy and tomography on the same zone to see the shape of the plasmodesmata between protophloem and pericycle, then model flow and diffusion through them.'],
    watch: 'Small tracers and large proteins behave differently: solutes spread freely, large proteins leave in pulses and stay in the pericycle. Light can bleach the tracer, so keep exposures short.',
    dois: ['10.7554/eLife.24125', '10.1111/tpj.15697']
  };

  /* ================================================================== three sink model */
  var SK = { leaf: 0.59, fruit: 0.59, root: 0.59 };
  var SINKS = [
    { id: 'leaf', name: 'Young leaf', L: 0.5, col: '#5fbf5a', col2: '#2f7f2a' },
    { id: 'fruit', name: 'Fruit', L: 1.0, col: '#e88a6a', col2: '#a04a2a' },
    { id: 'root', name: 'Root tip', L: 2.0, col: '#d8c08a', col2: '#7a6430' }
  ];
  PP.sinkModel = function (st, sk) {
    var r = PP.solve(st), tot = 0, out = {};
    SINKS.forEach(function (s) {
      var dP = r.Psrc - sk[s.id], u = dP > 0 ? PP.velocity({ k: r.kEff, grad: dP / s.L, eta: r.eta }) : 0;
      out[s.id] = { U: u, dP: dP, P: sk[s.id], L: s.L }; tot += u;
    });
    SINKS.forEach(function (s) { out[s.id].share = tot > 0 ? out[s.id].U / tot : 0; });
    out.total = tot; out.Psrc = r.Psrc; return out;
  };

  /* ================================================================== 4.1 One source, three sinks (2D) */
  var A1 = null, A2 = null, TH = { dots: [], acc: {} }, TW = { suc: [], pro: [], fr: [], acc: 0, accP: 0, accF: 0, pulse: 0 };
  function geom(w, h) {
    var narrow = w < 600;
    return {
      narrow: narrow,
      src: { x: narrow ? w * 0.2 : w * 0.16, y: h * 0.42 },
      leaf: { x: narrow ? w * 0.62 : w * 0.5, y: h * 0.17 },
      fruit: { x: narrow ? w * 0.8 : w * 0.82, y: h * 0.46 },
      root: { x: narrow ? w * 0.5 : w * 0.5, y: h * 0.82 }
    };
  }
  function bez(a, b, u) {   // a gentle curve from the source to a sink
    var cx = (a.x + b.x) / 2, cy = Math.min(a.y, b.y) - 10 + (b.y > a.y ? 40 : 0), m = 1 - u;
    return { x: m * m * a.x + 2 * m * u * cx + u * u * b.x, y: m * m * a.y + 2 * m * u * cy + u * u * b.y };
  }
  function draw1(c, w, h, t, dt, info) {
    if (!TH.warm && w > 0) { TH.warm = true; for (var wi = 0; wi < 80; wi++) draw1(c, w, h, t, 0.1, info); }
    var st = S(), dark = info.dark, kit = K(), g = geom(w, h), m = PP.sinkModel(st, SK), fs = g.narrow ? 10.5 : 12;
    var sans = function (wt, s) { return wt + ' ' + s + 'px "IBM Plex Sans",system-ui,sans-serif'; }, ink = dark ? '#e9e4d2' : '#25301f';
    c.clearRect(0, 0, w, h);
    var bg = c.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, dark ? '#0d1315' : '#f4f2e8'); bg.addColorStop(1, dark ? '#0a0f12' : '#e9e8da'); c.fillStyle = bg; c.fillRect(0, 0, w, h);
    var umax = 0; SINKS.forEach(function (s) { umax = Math.max(umax, m[s.id].U); });
    /* tubes, width by share */
    SINKS.forEach(function (s) {
      var b = g[s.id], sh = m[s.id].share, wd = 3 + 16 * sh;
      c.strokeStyle = m[s.id].U > 0 ? (dark ? 'rgba(242,200,74,.55)' : 'rgba(180,140,30,.5)') : (dark ? 'rgba(160,160,150,.35)' : 'rgba(120,120,110,.35)');
      c.lineWidth = wd; c.lineCap = 'round'; c.beginPath();
      for (var i = 0; i <= 24; i++) { var p = bez(g.src, b, i / 24); if (i) c.lineTo(p.x, p.y); else c.moveTo(p.x, p.y); } c.stroke();
    });
    /* moving sugar, number and pace by each branch's flow */
    if (dt > 0) SINKS.forEach(function (s) {
      var f = m[s.id].U / 147; TH.acc[s.id] = (TH.acc[s.id] || 0) + dt * 2.4 * Math.min(3, f) * Math.max(0.3, st.conc / 18);
      while (TH.acc[s.id] >= 1) { TH.acc[s.id] -= 1; if (TH.dots.length < 60) TH.dots.push({ s: s.id, u: 0, j: (Math.random() - 0.5) * 6, sor: st.sugar === 'rosaceae' && Math.random() < st.sorb }); }
      if (TH.acc[s.id] > 3) TH.acc[s.id] = 0;
    });
    for (var k = TH.dots.length - 1; k >= 0; k--) {
      var d = TH.dots[k], ms = m[d.s], L = SINKS.filter(function (x) { return x.id === d.s; })[0].L;
      if (dt > 0) d.u += dt * (0.05 + 0.5 * Math.min(2.5, ms.U / 147)) / Math.sqrt(L) * (ms.U > 0 ? 1 : 0);
      if (d.u >= 1) { TH.dots.splice(k, 1); continue; }
      var p = bez(g.src, g[d.s], d.u);
      if (d.sor) kit.sorbitol(c, p.x, p.y + d.j, g.narrow ? 5 : 6); else kit.sucrose(c, p.x, p.y + d.j, g.narrow ? 5 : 6);
    }
    /* source leaf */
    c.fillStyle = dark ? 'rgba(95,191,90,.45)' : 'rgba(95,191,90,.55)'; c.strokeStyle = dark ? '#8ae08a' : '#2f7f2a'; c.lineWidth = 2;
    c.beginPath(); c.ellipse(g.src.x, g.src.y, g.narrow ? 34 : 50, g.narrow ? 18 : 24, -0.3, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = ink; c.font = sans(700, fs); c.textAlign = 'center'; c.fillText('Source leaf', g.src.x, g.src.y - (g.narrow ? 26 : 32));
    c.font = '500 ' + (fs - 1) + 'px "IBM Plex Mono",ui-monospace,monospace'; c.fillText(num(m.Psrc, 2) + ' MPa', g.src.x, g.src.y + (g.narrow ? 34 : 42));
    /* sinks */
    SINKS.forEach(function (s) {
      var b = g[s.id], ms = m[s.id], r0 = g.narrow ? 16 : 22;
      c.fillStyle = s.col; c.strokeStyle = s.col2; c.lineWidth = 2; c.beginPath();
      if (s.id === 'leaf') c.ellipse(b.x, b.y, r0 * 1.3, r0 * 0.7, 0.4, 0, TAU);
      else if (s.id === 'fruit') c.arc(b.x, b.y, r0, 0, TAU);
      else { c.moveTo(b.x - r0 * 0.6, b.y - r0); c.lineTo(b.x + r0 * 0.6, b.y - r0); c.lineTo(b.x, b.y + r0 * 1.2); c.closePath(); }
      c.fill(); c.stroke();
      var tx, ty, al;
      if (s.id === 'leaf') { if (g.narrow) { tx = b.x; ty = b.y + r0 + 10; al = 'center'; } else { tx = b.x + r0 * 1.5 + 6; ty = b.y - 2; al = 'left'; } }
      else if (s.id === 'fruit') { tx = b.x; ty = b.y + r0 + 16; al = 'center'; }
      else { tx = b.x + r0 + 8; ty = b.y - 6; al = 'left'; }
      var l1 = s.name + ': ' + num(ms.share * 100, 0) + ' %', l2 = 'P ' + num(ms.P, 2) + ' MPa · ' + num(ms.U, 0) + ' µm s⁻¹';
      c.font = '500 ' + (fs - 1.5) + 'px "IBM Plex Mono",ui-monospace,monospace'; var lw = c.measureText(l2).width;
      if (al === 'left') tx = Math.min(tx, w - 6 - lw); else tx = Math.min(Math.max(tx, lw / 2 + 6), w - 6 - lw / 2);
      c.textAlign = al; c.fillStyle = ink; c.font = sans(700, fs); c.fillText(l1, tx, ty);
      c.font = '500 ' + (fs - 1.5) + 'px "IBM Plex Mono",ui-monospace,monospace'; c.fillStyle = dark ? '#cfc8b4' : '#4a5340';
      c.fillText(l2, tx, ty + fs + 3);
    });
    if (m.total <= 0) {
      c.fillStyle = dark ? 'rgba(14,20,16,.86)' : 'rgba(255,253,246,.94)'; c.fillRect(w / 2 - 140, h * 0.42 - 16, 280, 32);
      c.fillStyle = dark ? '#ffd2a0' : '#8a3a00'; c.font = sans(700, fs); c.textAlign = 'center'; c.fillText('Every sink is at or above the source: no flow', w / 2, h * 0.42 + 4);
    }
  }

  /* ================================================================== 4.2 Two ways out (2D; also the view without WebGL) */
  function draw2(c, w, h, t, dt, info) {
    if (!TW.warm && w > 0) { TW.warm = true; for (var wi = 0; wi < 80; wi++) draw2(c, w, h, t, 0.1, info); }
    var st = S(), dark = info.dark, kit = K(), narrow = w < 600, fs = narrow ? 10 : 11.5, r = R();
    var sans = function (wt, s) { return wt + ' ' + s + 'px "IBM Plex Sans",system-ui,sans-serif'; }, ink = dark ? '#e9e4d2' : '#25301f', sub = dark ? '#cfc8b4' : '#4a5340';
    c.clearRect(0, 0, w, h);
    var bg = c.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, dark ? '#0d1315' : '#f4f2e8'); bg.addColorStop(1, dark ? '#0a0f12' : '#e9e8da'); c.fillStyle = bg; c.fillRect(0, 0, w, h);
    var half = narrow ? h / 2 : w / 2, Un = Math.max(0, (r.U || 0) / 147);
    var paneL = narrow ? { x: 0, y: 0, w: w, h: h / 2 } : { x: 0, y: 0, w: w / 2, h: h };
    var paneR = narrow ? { x: 0, y: h / 2, w: w, h: h / 2 } : { x: w / 2, y: 0, w: w / 2, h: h };
    c.strokeStyle = dark ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.12)'; c.lineWidth = 1; c.beginPath(); if (narrow) { c.moveTo(10, half); c.lineTo(w - 10, half); } else { c.moveTo(half, 10); c.lineTo(half, h - 10); } c.stroke();
    /* ---- left: root tip, symplastic, funnel plasmodesmata */
    var P = paneL, seX = P.x + P.w * 0.26, seW = P.w * 0.13, y0 = P.y + 62, y1 = P.y + P.h - 24, ppX = seX + seW + 14, ppW = P.w * 0.22, gX = ppX + ppW + 10, gW = P.x + P.w - 14 - gX;
    c.textAlign = 'left'; c.fillStyle = ink; c.font = sans(700, fs + 0.5); c.fillText(narrow ? 'Root tip: through plasmodesmata' : 'Root tip: out through plasmodesmata', P.x + 12, P.y + 20);
    c.fillStyle = dark ? 'rgba(242,200,74,.3)' : 'rgba(242,200,74,.35)'; c.strokeStyle = dark ? '#e6c25a' : '#9a7410'; c.lineWidth = 1.8; c.beginPath(); c.rect(seX, y0, seW, y1 - y0); c.fill(); c.stroke();
    var nPP = 4, ppH = (y1 - y0) / nPP;
    for (var i = 0; i < nPP; i++) { c.fillStyle = dark ? 'rgba(232,214,168,.22)' : 'rgba(200,170,110,.25)'; c.strokeStyle = dark ? '#d8c08a' : '#7a6430'; c.beginPath(); c.rect(ppX, y0 + i * ppH + 2, ppW, ppH - 4); c.fill(); c.stroke(); }
    for (i = 0; i < 5; i++) { c.fillStyle = dark ? 'rgba(160,200,140,.16)' : 'rgba(120,180,100,.18)'; c.strokeStyle = dark ? '#8ab878' : '#4a7a3a'; c.beginPath(); c.rect(gX, y0 + i * (y1 - y0) / 5 + 2, gW, (y1 - y0) / 5 - 4); c.fill(); c.stroke(); }
    /* funnel plasmodesmata */
    var funY = []; for (i = 0; i < nPP; i++) funY.push(y0 + i * ppH + ppH * 0.5);
    funY.forEach(function (fy) { c.fillStyle = dark ? '#ffe7a0' : '#b08a10'; c.beginPath(); c.moveTo(seX + seW, fy - 7); c.lineTo(ppX, fy - 2); c.lineTo(ppX, fy + 2); c.lineTo(seX + seW, fy + 7); c.closePath(); c.fill(); });
    c.font = sans(600, fs - 0.5); c.fillStyle = dark ? '#ffcf7a' : '#8a6a10'; c.textAlign = 'center';
    c.fillText('sieve', seX + seW / 2, y0 - 18); c.fillText('element', seX + seW / 2, y0 - 5);
    c.fillStyle = dark ? '#e8d6a8' : '#6a5420'; c.fillText('pericycle', ppX + ppW / 2, y0 - 5);
    c.fillStyle = dark ? '#a8d898' : '#3a6a2a'; c.fillText(narrow ? 'growing' : 'growing cells', gX + gW / 2, y0 - 5);
    if (!narrow) { c.fillStyle = sub; c.textAlign = 'left'; c.fillText('funnel plasmodesmata', P.x + 10, y1 + 14); }
    /* ---- right: fruit, apoplastic step */
    var Q = paneR, sX = Q.x + Q.w * 0.12, sW = Q.w * 0.13, ccX = sX + sW + 2, ccW = Q.w * 0.08, wX = ccX + ccW + 2, wW = Q.w * 0.12, fX = wX + wW + 2, fW = Q.x + Q.w - 12 - fX, qy0 = Q.y + 62, qy1 = Q.y + Q.h - 24;
    c.textAlign = 'left'; c.fillStyle = ink; c.font = sans(700, fs + 0.5); c.fillText(narrow ? 'Apple fruit: via the cell walls' : 'Apple fruit: out through the cell wall space', Q.x + 12, Q.y + 20);
    c.fillStyle = dark ? 'rgba(242,200,74,.3)' : 'rgba(242,200,74,.35)'; c.strokeStyle = dark ? '#e6c25a' : '#9a7410'; c.beginPath(); c.rect(sX, qy0, sW, qy1 - qy0); c.fill(); c.stroke();
    c.fillStyle = dark ? 'rgba(240,138,48,.3)' : 'rgba(240,138,48,.3)'; c.strokeStyle = dark ? '#e0a060' : '#b06a20'; c.beginPath(); c.rect(ccX, qy0, ccW, qy1 - qy0); c.fill(); c.stroke();
    c.fillStyle = dark ? 'rgba(150,170,190,.12)' : 'rgba(120,140,160,.14)'; c.fillRect(wX, qy0, wW, qy1 - qy0);
    c.strokeStyle = dark ? 'rgba(200,210,220,.5)' : 'rgba(80,90,100,.45)'; c.setLineDash([4, 4]); c.strokeRect(wX, qy0, wW, qy1 - qy0); c.setLineDash([]);
    for (i = 0; i < 3; i++) { c.fillStyle = dark ? 'rgba(232,138,106,.2)' : 'rgba(232,138,106,.22)'; c.strokeStyle = dark ? '#e88a6a' : '#a04a2a'; c.beginPath(); c.rect(fX, qy0 + i * (qy1 - qy0) / 3 + 2, fW, (qy1 - qy0) / 3 - 4); c.fill(); c.stroke(); }
    var trY = []; for (i = 0; i < 3; i++) trY.push(qy0 + (i + 0.5) * (qy1 - qy0) / 3);
    trY.forEach(function (ty) { c.fillStyle = dark ? '#ffb05a' : '#c0661a'; c.beginPath(); c.ellipse(fX, ty, 5, 9, 0, 0, TAU); c.fill(); });
    c.font = sans(600, fs - 0.5); c.textAlign = 'center';
    c.fillStyle = dark ? '#ffcf7a' : '#8a6a10'; c.fillText('sieve', sX + sW / 2, qy0 - 18); c.fillText('element', sX + sW / 2, qy0 - 5);
    c.fillStyle = dark ? '#ffcf9a' : '#8a4a10'; c.fillText(narrow ? 'cc' : 'comp.', ccX + ccW / 2, qy0 - 4);
    c.fillStyle = sub; c.fillText(narrow ? 'wall' : 'cell wall', wX + wW / 2, qy0 - 4);
    c.fillStyle = dark ? '#ffb89a' : '#a04a2a'; c.fillText(narrow ? 'flesh' : 'fruit flesh', fX + fW / 2, qy0 - 4);
    if (!narrow) { c.fillStyle = sub; c.textAlign = 'left'; c.fillText('no plasmodesmata out of the complex; transporters take sugar up', Q.x + 10, qy1 + 14); }
    /* molecules */
    if (dt > 0) {
      TW.acc += dt * 3 * Math.min(2.5, Un + 0.15);
      while (TW.acc >= 1) { TW.acc -= 1; if (TW.suc.length < 28) TW.suc.push({ ph: 0, u: 0, lane: (Math.random() * nPP) | 0, sor: st.sugar === 'rosaceae' && Math.random() < st.sorb }); if (TW.fr.length < 18) TW.fr.push({ ph: 0, u: 0, lane: (Math.random() * 3) | 0, sor: st.sugar === 'rosaceae' && Math.random() < st.sorb }); }
      TW.pulse += dt; if (TW.pulse > 4.5) { TW.pulse = 0; var ln = (Math.random() * nPP) | 0; for (var pp = 0; pp < 3; pp++) TW.pro.push({ u: -pp * 0.12, lane: ln, life: 0 }); }
    }
    var rr = narrow ? 4.5 : 5.5;
    for (var a = TW.suc.length - 1; a >= 0; a--) {
      var o = TW.suc[a], x, y, fy = funY[o.lane];
      if (dt > 0) o.u += dt * (o.ph === 0 ? 0.55 : 0.35);
      if (o.u >= 1) { o.ph++; o.u = 0; if (o.ph > 2) { TW.suc.splice(a, 1); continue; } }
      if (o.ph === 0) { x = seX + seW / 2; y = y0 + 6 + (fy - y0 - 6) * o.u; }
      else if (o.ph === 1) { x = seX + seW / 2 + (ppX + ppW / 2 - seX - seW / 2) * o.u; y = fy; }
      else { x = ppX + ppW / 2 + (gX + gW / 2 - ppX - ppW / 2) * o.u; y = fy + 8 * Math.sin(o.u * 3); }
      if (o.sor) kit.sorbitol(c, x, y, rr); else kit.sucrose(c, x, y, rr);
    }
    for (a = TW.pro.length - 1; a >= 0; a--) {
      var pr = TW.pro[a]; if (dt > 0) { pr.u += dt * 0.3; pr.life += dt; } if (pr.life > 9) { TW.pro.splice(a, 1); continue; }
      if (pr.u < 0) continue;
      var py = funY[pr.lane], ux = Math.min(1, pr.u), pxp = seX + seW / 2 + (ppX + ppW * 0.55 - seX - seW / 2) * ux;
      c.fillStyle = dark ? '#c09aff' : '#7a4ab0'; c.beginPath(); c.arc(pxp, py + 6 * Math.sin(pr.life * 2 + a), narrow ? 4 : 5, 0, TAU); c.fill();
      c.strokeStyle = dark ? '#e8d8ff' : '#4a2a80'; c.lineWidth = 1; c.stroke();
    }
    for (a = TW.fr.length - 1; a >= 0; a--) {
      var f = TW.fr[a], ty2 = trY[f.lane], fx, fy2;
      if (dt > 0) f.u += dt * (f.ph === 2 ? 0.3 : 0.5);
      if (f.u >= 1) { f.ph++; f.u = 0; if (f.ph > 2) { TW.fr.splice(a, 1); continue; } }
      if (f.ph === 0) { fx = sX + sW / 2; fy2 = qy0 + 6 + (ty2 - qy0 - 6) * f.u; }
      else if (f.ph === 1) { fx = sX + sW / 2 + (wX + wW / 2 - sX - sW / 2) * f.u; fy2 = ty2 + 10; }
      else { fx = wX + wW / 2 + (fX + fW / 2 - wX - wW / 2) * f.u; fy2 = ty2; }
      if (f.sor) kit.sorbitol(c, fx, fy2, rr); else kit.sucrose(c, fx, fy2, rr);
      if (f.ph === 2 && f.u < 0.4) kit.proton(c, fx - 10, fy2 - 9, narrow ? 3 : 3.5);
    }
    if (window.MolNames && window.MolNames.get() && !narrow) {
      kit.pill(c, ppX + ppW * 0.55, funY[1] + 14, 'protein, in pulses', dark, 10);
      kit.pill(c, fX - 2, trY[2] + 14, 'H⁺ coupled uptake', dark, 10);
    }
  }

  /* ================================================================== hero: the root tip (Three.js r128 through PP.macro) */
  var H = { ctx: null }, SEX = [-0.6, 0.6], SER = 0.28, SEL = 1.0, YT = 5.5, YE = -1.5;
  function hBuild(ctx) {
    var T = ctx.THREE, MM = PP.macro, root = ctx.root, far = ctx.far, se = MM.superEllipsoid, Hs = H;
    Hs.T = T; Hs.rnd = (function (s) { return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; })(133);
    var r = Hs.rnd;
    /* protophloem sieve element files */
    var segG = new T.CylinderGeometry(SER, SER, SEL - 0.04, 18, 1, true), seMat = MM.glass(T, 0xf2c84a, { opacity: 0.45, side: T.DoubleSide, emissive: 0x6a4a00, ei: 0.4 });
    var plM = MM.lin(new T.MeshStandardMaterial({ color: 0xf6dc8a, emissive: 0x7a5a10, emissiveIntensity: 0.4, transparent: true, opacity: 0.7, side: T.DoubleSide, depthWrite: false }));
    SEX.forEach(function (x) {
      for (var y = YT; y - SEL >= YE - 0.01; y -= SEL) {
        var me = new T.Mesh(segG, seMat); me.position.set(x, y - SEL / 2, 0); me.renderOrder = 3; root.add(me);
        var pl = new T.Mesh(new T.CircleGeometry(SER * 0.97, 18), plM); pl.rotation.x = -Math.PI / 2; pl.position.set(x, y - SEL, 0); root.add(pl);
      }
    });
    /* phloem pole pericycle cells beside each file, joined by funnel plasmodesmata */
    var ppG = se(0.32, 0.5, 0.34, 0.55, 14, 10), ppM = MM.glass(T, 0xe8d6a8, { opacity: 0.45, emissive: 0x3a2a10, ei: 0.3 });
    /* the funnel sits IN the shared wall between sieve element and pericycle cell (wall spans SER to SER + 0.1 from the file axis) */
    var wallG = new T.BoxGeometry(0.12, YT - YE, 0.62), wallM = MM.glass(T, 0xcbb47a, { opacity: 0.55, emissive: 0x3a3010, ei: 0.3 }), wallE = MM.lin(new T.LineBasicMaterial({ color: 0x8a6a2a, transparent: true, opacity: 0.7 }));
    var funG = new T.CylinderGeometry(0.12, 0.03, 0.14, 16, 1, true), funM = MM.lin(new T.MeshStandardMaterial({ color: 0xffb02a, emissive: 0xc06a00, emissiveIntensity: 0.9, side: T.DoubleSide, roughness: 0.4 }));
    Hs.funnels = []; Hs.ppc = [];
    SEX.forEach(function (x, si) {
      var dir = si === 0 ? -1 : 1;
      var wl = new T.Mesh(wallG, wallM); wl.position.set(x + dir * (SER + 0.05), (YT + YE) / 2, 0.02); wl.renderOrder = 2; root.add(wl);
      var we = new T.LineSegments(new T.EdgesGeometry(wallG), wallE); we.position.copy(wl.position); root.add(we);
      for (var y = YT - 0.55; y > YE + 0.3; y -= 1.05) {
        var cpos = [x + dir * 0.7, y, 0.05];
        var pc = new T.Mesh(ppG, ppM); pc.position.set(cpos[0], cpos[1], cpos[2]); pc.renderOrder = 2; root.add(pc); Hs.ppc.push(cpos);
        var fn = new T.Mesh(funG, funM); fn.rotation.z = dir * Math.PI / 2; fn.position.set(x + dir * (SER + 0.05), y, 0.02); fn.renderOrder = 4; root.add(fn);
        Hs.funnels.push({ x: x + dir * (SER + 0.05), y: y, dir: dir, cx: cpos[0] });
      }
    });
    /* growing cells of the tip around, cut open at the front; the root tip at the bottom */
    var gG = se(0.42, 0.36, 0.42, 0.6, 12, 8), gM = MM.glass(T, 0x8ac87a, { opacity: 0.3, emissive: 0x1a3a1a, ei: 0.25 });
    for (var ring = 0; ring < 9; ring++) {
      var yy = YT - 0.3 - ring * 0.95;
      for (var a = 0; a < 9; a++) {
        var ang = Math.PI * 0.9 + a * (Math.PI * 1.2) / 8, rad = 2.0 - Math.max(0, (YE + 1 - yy)) * 0.18;
        var gc = new T.Mesh(gG, gM); gc.position.set(Math.cos(ang) * rad, yy, Math.sin(ang) * rad * 0.8 - 0.2); gc.renderOrder = 1; root.add(gc);
      }
    }
    var tipG = new T.SphereGeometry(1.9, 22, 14, 0, TAU, Math.PI / 2, Math.PI / 2), tip = new T.Mesh(tipG, MM.glass(T, 0xd8c08a, { opacity: 0.22, side: T.DoubleSide }));
    tip.scale.set(1, 1.6, 0.9); tip.position.set(0, YE - 0.9, -0.1); root.add(tip);
    var fG = se(1.2, 1.2, 1.2, 0.6, 10, 8), fM = MM.glass(T, 0x9a8a60, { opacity: 0.3 });
    for (var f = 0; f < 10; f++) { var fm = new T.Mesh(fG, fM); fm.position.set(-11 + r() * 22, -6 + r() * 12, -8 - r() * 5); far.add(fm); }
    /* molecules */
    var G = PP.kit.geos(T, MM), vmat = function () { return MM.lin(new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.3, emissive: 0x112211, emissiveIntensity: 0.25 })); };
    function im(geo, mat, n) { var x = new T.InstancedMesh(geo, mat, n); x.frustumCulled = false; x.renderOrder = 8; root.add(x); return x; }
    Hs.sucM = im(G.suc, vmat(), 70); Hs.sorM = im(G.sor, vmat(), 30);
    Hs.proM = im(new T.SphereGeometry(1, 12, 8), MM.lin(new T.MeshStandardMaterial({ color: 0xa070e0, emissive: 0x4a2a80, emissiveIntensity: 0.5, roughness: 0.35 })), 12);
    Hs.glow = MM.halos(T, 70, 0x7dff7a, 0.4); root.add(Hs.glow.obj);
    Hs.mol = []; Hs.pro = []; Hs.acc = 0; Hs.pulse = 0; Hs.dummy = new T.Object3D();
    Hs.hn = PP.heroNames(ctx);
    hLabels();
    for (var pw = 0; pw < 70; pw++) hFrame(ctx, pw * 0.06, 0.06);
    hLive();
  }
  function hNew() {
    var r = H.rnd, st = S(), si = r() < 0.5 ? 0 : 1;
    var fl = H.funnels.filter(function (f) { return f.dir === (si === 0 ? -1 : 1); }), fn = fl[(r() * fl.length) | 0];
    return { si: si, fn: fn, ph: 0, x: SEX[si] + (r() - 0.5) * 0.25, y: YT, z: (r() - 0.5) * 0.25, sor: st.sugar === 'rosaceae' && r() < st.sorb, rx: r() * 6, ry: r() * 6, u: 0, ex: (r() - 0.5), ez: r() * 1.2 - 0.2, sp: 0.85 + r() * 0.3 };
  }
  function hLabels() {
    var Hs = H, T = Hs.T; if (!T || !Hs.ctx) return;
    var V = function (x, y, z) { return new T.Vector3(x, y, z); };
    Hs.ctx.setLabels([
      { id: 'se', text: 'Protophloem sieve element', pos: V(SEX[1], YT - 0.2, 0.3), tier: 1 },
      { id: 'fn', text: 'Funnel plasmodesmata', pos: V(SEX[1] + 0.5, 1.4, 0.35), tier: 1 },
      { id: 'pp', text: 'Phloem pole pericycle', pos: V(SEX[0] - 0.7, 2.5, 0.45), tier: 1, narrow: false },
      { id: 'gc', text: 'Growing cells: sugar spent here', pos: V(-1.6, -0.6, 0.6), tier: 2, narrow: false },
      { id: 'tip', text: 'Root tip', pos: V(0, YE - 1.6, 0.6), tier: 2 }
    ]);
  }
  function hFrame(ctx, t, dt) {
    var Hs = H, T = Hs.T; if (!T) return;
    var st = S(), r = R(), i, Un = Math.max(0, (r.U || 0) / 147);
    var v = r.U > 0 ? 0.35 + 1.0 * Math.min(2.5, Un) : 0.12;    // drawn pace (ILLUSTRATIVE); unloading continues slowly from what is already in the tube
    if (dt > 0) {
      Hs.acc += dt * v * 5 * Math.max(0.3, st.conc / 18); while (Hs.acc >= 1) { Hs.acc -= 1; if (Hs.mol.length < 70) Hs.mol.push(hNew()); }
      Hs.pulse += dt; if (Hs.pulse > 5) { Hs.pulse = 0; var fn = Hs.funnels[(Hs.rnd() * Hs.funnels.length) | 0]; for (var p = 0; p < 3; p++) if (Hs.pro.length < 12) Hs.pro.push({ fn: fn, u: -p * 0.15, life: 0, j: Hs.rnd() }); }
    }
    for (i = Hs.mol.length - 1; i >= 0; i--) {
      var o = Hs.mol[i];
      if (dt > 0) {
        o.rx += dt * 0.7; o.ry += dt * 0.5;
        if (o.ph === 0) { o.y -= dt * v * o.sp; if (o.y <= o.fn.y) { o.ph = 1; o.u = 0; } }
        else { o.u += dt * (o.ph === 1 ? 0.9 : 0.28); if (o.u >= 1) { if (o.ph === 1) { o.ph = 2; o.u = 0; } else { Hs.mol.splice(i, 1); continue; } } }
      }
      if (o.ph === 1) { o.x = SEX[o.si] + (o.fn.cx - SEX[o.si]) * o.u; o.y = o.fn.y; o.z = 0.03; }
      else if (o.ph === 2) { var out = o.fn.dir; o.x = o.fn.cx + out * o.u * 1.1 + o.ex * 0.4 * o.u; o.y = o.fn.y - o.u * 0.4; o.z = 0.05 + o.ez * o.u; }
    }
    for (i = Hs.pro.length - 1; i >= 0; i--) { var q = Hs.pro[i]; if (dt > 0) { q.u += dt * 0.35; q.life += dt; } if (q.life > 10) Hs.pro.splice(i, 1); }
    var D = Hs.dummy, nS = 0, nO = 0, nP = 0;
    Hs.mol.forEach(function (m, k2) {
      D.position.set(m.x, m.y, m.z); D.rotation.set(m.rx, m.ry, 0); D.scale.setScalar(0.13); D.updateMatrix();
      if (m.sor) { if (nO < 30) Hs.sorM.setMatrixAt(nO++, D.matrix); } else if (nS < 70) Hs.sucM.setMatrixAt(nS++, D.matrix);
      if (k2 < 70) Hs.glow.set(k2, m.x, m.y, m.z);
    });
    for (i = Hs.mol.length; i < 70; i++) Hs.glow.hide(i);
    Hs.glow.commit();
    Hs.pro.forEach(function (q2) {
      if (q2.u < 0 || nP >= 12) return; var u = Math.min(1, q2.u), fx = SEX[q2.fn.dir < 0 ? 0 : 1];
      var x = fx + (q2.fn.cx + q2.fn.dir * 0.08 - fx) * u, y = q2.fn.y + (u >= 1 ? 0.12 * Math.sin(q2.life * 1.5 + q2.j * 6) : 0);
      q2.p = [x, y, 0.08]; D.position.set(x, y, 0.08); D.rotation.set(0, 0, 0); D.scale.setScalar(0.09); D.updateMatrix(); Hs.proM.setMatrixAt(nP++, D.matrix);
    });
    D.scale.setScalar(0); D.updateMatrix();
    for (i = nS; i < 70; i++) Hs.sucM.setMatrixAt(i, D.matrix);
    for (i = nO; i < 30; i++) Hs.sorM.setMatrixAt(i, D.matrix);
    for (i = nP; i < 12; i++) Hs.proM.setMatrixAt(i, D.matrix);
    [Hs.sucM, Hs.sorM, Hs.proM].forEach(function (x) { x.instanceMatrix.needsUpdate = true; });
    var hn = Hs.hn; hn.begin();
    for (i = Hs.mol.length - 1; i >= 0; i--) { var m3 = Hs.mol[i]; hn.add(m3.sor ? 'sor' : 'suc', m3, m3.sor ? 'sorbitol' : 'sucrose', m3.x, m3.y, m3.z, 0.11, { all: false }); }
    Hs.pro.forEach(function (q3) { if (q3.p && q3.u > 0.5) hn.add('pro', q3, 'protein, in a pulse', q3.p[0], q3.p[1], q3.p[2], 0.1, { all: false, q: 1 }); });
    hn.end();
    if (dt > 0 && ((t * 3) | 0) !== Hs.lastLive) { Hs.lastLive = (t * 3) | 0; hLive(); }
  }
  function hCamera(ctx, t) {
    var cam = ctx.camera, asp = ctx.w / ctx.h, tv = Math.tan(cam.fov * Math.PI / 360);
    var halfW = ctx.narrow ? 2.6 : 3.6, halfH = ctx.narrow ? 4.0 : 5.0;
    var D = Math.max(halfW / (tv * asp), halfH / tv) + 2;
    var yaw = 0.3 * Math.sin(t * 0.05), pitch = 0.2 + 0.05 * Math.sin(t * 0.04 + 1), ty = 0.9 + (ctx.narrow ? 1.8 * Math.sin(t * 0.045) : 0);
    cam.position.set(Math.sin(yaw) * Math.cos(pitch) * D, ty + Math.sin(pitch) * D, Math.cos(yaw) * Math.cos(pitch) * D);
    cam.lookAt(0, ty, 0);
    ctx.scene.fog.near = D - 3; ctx.scene.fog.far = D + 14; ctx.farScene.fog.near = D; ctx.farScene.fog.far = D + 20;
  }
  function hLive() {
    if (!H.ctx || !H.ctx.setLive) return;
    var r = R();
    H.ctx.setLive(r.stopped ? 'No flow arriving from the source · the tip spends what is left · model' : 'Arriving at ' + num(r.U, 0) + ' µm s⁻¹ · unloaded by mass flow plus diffusion · drawn pace illustrative');
  }
  function hInit(host) {
    if (!host || H.ctx || !PP.macro) return;
    H.ctx = PP.macro.hero(host, {
      id: 'pk-hero', seed: 133, fov: 30, exposure: 1.0,
      lift: function (ctx) { return ctx.narrow ? 90 : 96; },
      palette: { light: { top: '#2a2416', mid: '#5a4e30', bot: '#a39062', bokeh: ['#fff1c0', '#d8c47a', '#e8d8b0', '#cfe6a0'], fog: 0x5a4e30, fg: 'rgba(230,214,160,.5)' },
        dark: { top: '#08070a', mid: '#16140e', bot: '#26221a', bokeh: ['#6f5f2f', '#5b4f2c', '#4a6a3a', '#3c4a5a'], fog: 0x16140e, fg: 'rgba(130,110,60,.45)' } },
      label: 'Three dimensional view of a growing root tip cut open at the front. Two gold protophloem sieve element files come down from above. Beside each lies a column of pale phloem pole pericycle cells, joined to the sieve elements by small glowing funnel shaped plasmodesmata. Green sucrose molecules flow down the sieve elements, pass through the funnels into the pericycle and spread out into the green growing cells around. Every few seconds a few violet protein beads pass through one funnel together and stay in the pericycle cell.',
      question: 'How does sugar get out of the phloem in a root tip?',
      answer: 'Through plasmodesmata, carried by the flow itself. In Arabidopsis root tips the protophloem unloads into the phloem pole pericycle through a special class of <b>funnel plasmodesmata</b>, by mass flow plus diffusion. Sugars leave freely and move on into the growing cells; large proteins leave in pulses and stay in the pericycle. Funnel shaped pores have far less resistance than straight ones, and they turn up in root tips across angiosperms.',
      credit: { text: 'Ross-Elliott et al. · eLife 2017', doi: '10.7554/eLife.24125' },
      height: function (w) { return w < 600 ? 560 : Math.round(Math.min(660, Math.max(480, w * 0.56))); },
      fallbackNote: 'This 3D scene needs WebGL, which this browser does not offer. The drawing in 4.2 below shows the same root tip and the apple fruit.',
      build: hBuild, frame: hFrame, camera: hCamera,
      orbit: { minDist: 1.2, maxDist: 34 },
      focus: [
        { id: 'fn', label: 'Funnel plasmodesmata', tag: 'funnel plasmodesma in the shared wall', target: [SEX[1] + SER + 0.05, 1.8, 0], dist: 2.2, theta: -0.5, phi: 1.45 },
        { id: 'se', label: 'Sieve element', target: [SEX[0], 3.5, 0], dist: 3.2, theta: -0.3, phi: 1.35 },
        { id: 'pp', label: 'Pericycle', tag: 'phloem pole pericycle cell', target: [SEX[0] - 0.7, 0.8, 0], dist: 3, theta: -0.7, phi: 1.4 },
        { id: 'tip', label: 'Root tip', target: [0, YE - 0.6, 0], dist: 6, theta: 0.2, phi: 1.2 },
        { id: 'top', label: 'From above', tag: false, target: [0, YT, 0], dist: 5.5, theta: 0.2, phi: 0.35 }
      ]
    });
    hLive();
    if (ui.railWatch && H.ctx.wrap) ui.railWatch(H.ctx.wrap);
    U().onPrefs(function () { if (H.ctx && H.ctx.retheme) H.ctx.retheme(); });
  }

  /* ================================================================== page */
  var CSS = '#lv-sinks .pk-ctrls{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:4px 18px;margin:12px 0 0;border-top:1px solid var(--rule2)}' +
    '#lv-sinks .pk-sw{display:flex;flex-wrap:wrap;gap:6px;align-items:center}' +
    '#lv-sinks .eq{font-family:var(--mono);font-size:13.5px;line-height:1.9;overflow-x:auto}';
  function tile(id, k, unit, cls) { return '<div class="tile' + (cls ? ' ' + cls : '') + '" id="' + id + '"><div class="k">' + k + '</div><div class="v"><span class="n">0</span> <small>' + (unit || '') + '</small></div></div>'; }
  function setTile(id, v) { var e = document.querySelector('#' + id + ' .n'); if (e) e.textContent = v; }
  var SLD = [
    ['pk-leaf', 'leaf', 'Turgor in the young leaf', ''],
    ['pk-fruit', 'fruit', 'Turgor at the fruit', ''],
    ['pk-root', 'root', 'Turgor at the root tip', 'tier-2']
  ];
  function setSink(p) { Object.keys(p).forEach(function (k) { SK[k] = clamp(p[k], 0, 1.4); }); update(S(), R()); }
  function mount(el) {
    U();
    var E = ui.ev;
    el.innerHTML = '<style>' + CSS + '</style>' +
      '<div class="pk-hero" id="pk-hero"></div>' +
      ui.now('<b>What is happening:</b> <span id="pk-now"></span>', 'pk-nowp') +
      '<figure class="fig lx-fig" id="pk-live"><div class="fighead"><h3>4.1 One source, three sinks</h3><p>One leaf feeds a young leaf, a fruit and a root tip. The tube widths and the sugar show how the flow splits. Lower a sink’s turgor (it unloads faster) and watch it pull more sugar.</p></div>' +
      '<div class="lx-frame" id="pk-th"></div>' +
      '<div class="pk-ctrls">' + SLD.map(function (x) { return '<div class="ctl' + (x[3] ? ' ' + x[3] : '') + '"><label for="' + x[0] + '">' + x[2] + ' <output id="' + x[0] + '-o"></output></label><input type="range" id="' + x[0] + '" min="0" max="1.4" step="0.01"><div class="hint">lower = unloads faster</div></div>'; }).join('') +
      '<div class="ctl"><span class="ctl-l">Scene</span><div class="pk-sw"><button type="button" class="btn small" id="pk-pause" aria-pressed="false">Pause</button> <button type="button" class="btn small" id="pk-reset">Reset</button></div></div>' +
      '</div>' +
      '<p class="pk-sw" role="group" aria-label="Situations"><button type="button" class="btn small" data-pk="fill">Fruit filling fast</button> <button type="button" class="btn small" data-pk="root">Roots growing fast</button> <button type="button" class="btn small" data-pk="full">Fruit full</button> <button type="button" class="btn small" data-pk="dry">Dry the xylem</button> <button type="button" class="btn small" data-pk="even">All three at 0.59 MPa</button></p>' +
      '<figcaption class="cap" id="pk-cap"></figcaption>' +
      '<p class="cap lx-row">The model: each branch U = k (P<sub>source</sub> − P<sub>sink</sub>) ÷ (η L); the source turgor comes from the xylem and the sap, as on Plates II and III. ' + E('pk.branch') + ' ' + E('pk.paths') + ' ' + E('pk.leaf') + ' ' + E('ps.drawn') + '</p>' +
      '</figure>' +
      '<div class="tiles lx-tiles">' +
      tile('pk-t-src', 'Turgor at the source', 'MPa') + tile('pk-t-sl', 'Young leaf share', '%') + tile('pk-t-sf', 'Fruit share', '%') + tile('pk-t-sr', 'Root share', '%') +
      tile('pk-t-ur', 'Speed to the root', 'µm s⁻¹', 'tier-2') + tile('pk-t-uf', 'Speed to the fruit', 'µm s⁻¹', 'tier-2') + tile('pk-t-tot', 'All three branches', 'µm s⁻¹', 'tier-3') +
      '</div>' +

      '<figure class="fig lx-fig" id="pk-out"><div class="fighead"><h3>4.2 Two ways out</h3><p>Left: in a root tip, sugar leaves the sieve element through funnel plasmodesmata into the pericycle and spreads to the growing cells, while large proteins leave in pulses. Right: in apple fruit flesh, the sieve element and companion cell are sealed off, so sugar goes out into the cell wall space and is taken up by transporters, a step that costs energy.</p></div>' +
      '<div class="lx-frame" id="pk-th2"></div>' +
      '<figcaption class="cap">Root tip: ' + E('ph.sink.root_unload', 'Ross-Elliott et al. 2017') + ' ' + E('ph.sink.funnel_PD', 'Ostermeyer et al. 2022') + ' · Apple fruit: ' + E('ph.rosa.apple_fruit_unload', 'Zhang et al. 2004') + ' · sorbitol transporters suggest an apoplastic step in cherry fruit too ' + E('ph.rosa.sorbitol_family', 'Gao et al. 2003') + ' · ' + E('pk.drawn') + '</figcaption>' +
      '</figure>' +

      '<section class="lx-cases" aria-label="Sinks"><h3 class="lx-h3">What makes a sink</h3><div class="lx-cardgrid">' +
      '<div class="card lx-case"><p class="lx-ck">A root tip unloads by flow</p><p>In Arabidopsis root tips, unloading through plasmodesmata is convective: mass flow plus diffusion. Solutes leave without restriction; large proteins are released in discrete pulses, “batch unloading”, and stay in the phloem pole pericycle. ' + E('ph.sink.root_unload', 'Ross-Elliott et al. 2017') + '</p><p><button type="button" class="btn small" data-pkf="fn">Look closer at a funnel</button></p></div>' +
      '<div class="card lx-case"><p class="lx-ck">A funnel conducts better than a pipe</p><p>Funnel shaped plasmodesmata sit between protophloem and pericycle in growing root tips of five eudicot and two monocot species. Model calculations show that a conical pore has far lower resistance to diffusion and to flow than a cylinder, even at small opening angles. ' + E('ph.sink.funnel_PD', 'Ostermeyer et al. 2022') + '</p></div>' +
      '<div class="card lx-case"><p class="lx-ck">Fruit can need an energy step</p><p>In apple fruit flesh the sieve element companion cell complex is symplasmically isolated, so unloading includes a step through the cell wall space that needs energy. ' + E('ph.rosa.apple_fruit_unload', 'Zhang et al. 2004') + '</p><p class="tier-2">In the almond family the sap carries sorbitol as well as sucrose; sour cherry sorbitol transporters are H⁺ coupled, and their expression suggests an apoplastic step in fruit too. ' + E('ph.rosa.sorbitol_family', 'Gao et al. 2003') + '</p></div>' +
      '<div class="card lx-case tier-2"><p class="lx-ck">Sorbitol is more than cargo</p><p>In apple, sorbitol switches on the genes for its own breakdown through SnRK1 and bZIP39: the sugar that arrives also tells the sink what to do. ' + E('ph.rosa.sorbitol_signal', 'Meng et al. 2023') + '</p><p>Silencing sorbitol synthesis in apple cut the sorbitol to sucrose ratio by about 90 % in leaves and 75 % in phloem exudate, and changed the sugar and acid balance of the fruit. ' + E('ph.rosa.apple_silencing', 'Teo et al. 2006') + '</p></div>' +
      '</div></section>' +

      '<section class="tier-3 lx-expert" aria-label="Expert"><h3 class="lx-h3">Equations and what is still argued</h3>' +
      '<div class="card eq">U<sub>i</sub> = k<sub>eff</sub> (P<sub>source</sub> − P<sub>i</sub>) / (η L<sub>i</sub>)  for each sink i ' + E('pk.branch') + '<br>share<sub>i</sub> = U<sub>i</sub> / Σ U<sub>j</sub><br>P<sub>source</sub> = Ψ<sub>x</sub> + Π, held fixed (an assumption: a real source would drop as the sinks pull harder)</div>' +
      '<div class="card lx-open"><p class="lx-ck">' + ui.badge('OPEN QUESTION') + ' Is unloading set by phloem turgor or by sugar concentration?</p><p>A model tested against girdling and drought data in saplings of four tree species fits best when unloading follows turgor, not sugar. If so, a sink “asks” for sugar by lowering the pressure at its end, as in the slider above. How much energy unloading needs is still open. ' + E('ph.sink.unload_regulation', 'Dewar et al. 2022') + ' ' + E('ph.oq.unloading', 'Open question') + '</p></div>' +
      '<div class="card lx-open"><p class="lx-ck">' + ui.badge('OPEN QUESTION') + ' Does a sink need a high pressure manifold?</p><p>Small morning glory plants made only enough pressure for flow, which argues against a phloem held at high pressure everywhere with sinks opening taps. Then either unloading plasmodesmata are very conductive, as funnels are, or unloading needs extra energy. ' + E('ph.sink.manifold', 'Knoblauch et al. 2016') + '</p></div>' +
      '<div class="card lx-open"><p class="lx-ck">' + ui.badge('OPEN QUESTION') + ' How does almond fruit unload?</p><p>No study of phloem unloading or loading in almond was retrieved. Apple fruit shows an apoplastic step; cherry transporters point the same way; almond is a close relative, not a measured case. ' + E('ph.oq.almond_loading', 'Open question') + '</p></div>' +
      ui.design({ title: 'turgor or sugar at the sink?', question: 'Does a growing root tip take more sugar when the turgor at the end of the phloem falls, even if the sugar concentration stays the same?',
        treat: 'Change the sink turgor (for example with a mild osmoticum around the root tip) against controls, with the source leaf kept the same.',
        measure: 'Arrival and spread of a fluorescent tracer in the root tip; pericycle and sieve element turgor where it can be read; sugar in the sap.',
        howto: ['ph.unload', 'ph.picogauge'], n: 'Seedlings are the replicates; several per treatment, imaged the same way.',
        expect: 'Turgor regulated unloading predicts faster unloading when sink turgor falls ' + ui.badge('MODEL') + ' ' + E('ph.sink.unload_regulation', 'Dewar et al. 2022'),
        confound: 'An osmoticum also changes the water supply to the tip and its growth; separate the two with a growth measurement.' }) +
      ui.howto('ph.unload') +
      '<p class="hint">Methods links: no PrometheusWiki protocol page for phloem unloading was confirmed in this session; the methods papers are cited instead.</p>' +
      '</section>' +

      '<section class="lx-qs" aria-label="Questions"><h3 class="lx-h3">Check yourself</h3>' +
      ui.reveal('Predict: the fruit drops its turgor from 0.59 to 0.20 MPa, and nothing else changes. What happens to the root’s share? Then press Fruit filling fast.',
        '<p>The root’s share falls. The fruit’s branch now has a much larger pressure difference, so it carries more; in this model the source is held fixed, so the root’s own flow is unchanged but its share of the total shrinks. In a real plant the source turgor would also drop a little, so the root would lose sugar outright.</p>', { choices: [
          ['It falls', true, 'The fruit takes a larger share of the total.'],
          ['It rises', false, 'Nothing changed at the root; the fruit pulls harder.'],
          ['It stays the same', false, 'Its own flow does, here, but its share does not.']] }) +
      '</section>' +
      ui.quiz('sinks');
    A1 = ui.anim(el.querySelector('#pk-th'), { height: function (w) { return w < 600 ? 380 : 380; }, label: 'Drawing of a source leaf on the left with three tubes running to a young leaf, a fruit and a root tip. Tube widths and the number of moving sugar molecules show how much each sink receives; each sink shows its turgor and share.', draw: draw1 });
    A2 = ui.anim(el.querySelector('#pk-th2'), { height: function (w) { return w < 600 ? 560 : 330; }, label: 'Two drawings side by side. Left, a root tip: sugar moves down a sieve element, through funnel plasmodesmata into pericycle cells and on into growing cells, while violet protein beads cross in pulses and stay in the pericycle. Right, apple fruit: sugar leaves the sieve element into the cell wall space and is taken into fruit flesh cells by transporters together with protons.', draw: draw2 });
    var pb = el.querySelector('#pk-pause');
    pb.addEventListener('click', function () { var p = !A1.paused(); A1.pause(p); A2.pause(p); pb.setAttribute('aria-pressed', p ? 'true' : 'false'); pb.textContent = p ? 'Play' : 'Pause'; });
    if (window.PlaySpeed) pb.parentNode.insertBefore(window.PlaySpeed.chip('ps-light'), pb.nextSibling);
    el.querySelector('#pk-reset').addEventListener('click', function () { SK.leaf = SK.fruit = SK.root = 0.59; PP.reset(); });
    SLD.forEach(function (x) { var i = el.querySelector('#' + x[0]); i.addEventListener('input', function () { var o = {}; o[x[1]] = +i.value; setSink(o); }); });
    el.addEventListener('click', function (e) {
      var f = e.target.closest('[data-pkf]');
      if (f) { if (H.ctx && H.ctx.orbit) { var hh = document.getElementById('pk-hero'); if (hh) hh.scrollIntoView({ behavior: ui.reducedMotion() ? 'auto' : 'smooth', block: 'start' }); H.ctx.orbit.focus(f.getAttribute('data-pkf')); } return; }
      var b = e.target.closest('[data-pk]'); if (!b) return;
      var k = b.getAttribute('data-pk');
      if (k === 'fill') setSink({ fruit: 0.2 });
      else if (k === 'root') setSink({ root: 0.2 });
      else if (k === 'full') setSink({ fruit: 1.1 });
      else if (k === 'even') { setSink({ leaf: 0.59, fruit: 0.59, root: 0.59 }); PP.set({ psiX: PP.defaults.psiX, conc: PP.defaults.conc }); }
      else if (k === 'dry') PP.set({ psiX: -0.9 });
    });
    var hostH = el.querySelector('#pk-hero');
    if ('IntersectionObserver' in window) { var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); hInit(hostH); } }, { rootMargin: '200px' }); io.observe(hostH); } else hInit(hostH);
  }
  function nowText(m) {
    var tier = U().tier(), big = SINKS.slice().sort(function (a, b) { return m[b.id].share - m[a.id].share; })[0];
    if (m.total <= 0) return 'No sink has lower turgor than the source, so nothing flows. Wet the xylem, or let a sink unload.';
    if (tier === 1) return 'Sugar flows to whichever sink keeps the pressure at its end lowest and sits closest. Right now the ' + big.name.toLowerCase() + ' gets the most.';
    return 'Source ' + num(m.Psrc, 2) + ' MPa. Shares: young leaf ' + num(m.leaf.share * 100, 0) + ' %, fruit ' + num(m.fruit.share * 100, 0) + ' %, root ' + num(m.root.share * 100, 0) + ' %. A sink gets more by lowering its turgor (unloading faster) or by being closer.';
  }
  function update(st, res) {
    if (!document.getElementById('pk-now')) return;
    U();
    var m = PP.sinkModel(st, SK);
    document.getElementById('pk-now').textContent = nowText(m);
    var cap = document.getElementById('pk-cap');
    if (cap) cap.textContent = 'Each sink’s pull is the pressure difference from the source over its path. With the source at ' + num(m.Psrc, 2) + ' MPa, the fruit at ' + num(SK.fruit, 2) + ' MPa gets ' + num(m.fruit.share * 100, 0) + ' % of the flow and the root at ' + num(SK.root, 2) + ' MPa gets ' + num(m.root.share * 100, 0) + ' % (model).';
    SLD.forEach(function (x) { var i = document.getElementById(x[0]); if (!i) return; if (document.activeElement !== i) i.value = SK[x[1]]; var o = document.getElementById(x[0] + '-o'); if (o) o.textContent = num(SK[x[1]], 2) + ' MPa'; });
    setTile('pk-t-src', num(m.Psrc, 2)); setTile('pk-t-sl', num(m.leaf.share * 100, 0)); setTile('pk-t-sf', num(m.fruit.share * 100, 0)); setTile('pk-t-sr', num(m.root.share * 100, 0));
    setTile('pk-t-ur', num(m.root.U, 0)); setTile('pk-t-uf', num(m.fruit.U, 0)); setTile('pk-t-tot', num(m.total, 0));
    if (H.ctx) { hLive(); H.ctx.invalidate(); }
    if (A1) A1.redraw(); if (A2) A2.redraw();
  }

  PP.showme.sinks = [
    { at: '#pk-hero', say: 'A root tip: sugar leaves the sieve element through funnel shaped plasmodesmata. Proteins leave in pulses and stay put.', wait: 7000 },
    { at: '#pk-live', fn: function () { setSink({ leaf: 0.59, fruit: 0.59, root: 0.59 }); }, say: 'Three sinks at the same turgor: the closest one, the young leaf, gets the most.', wait: 6500 },
    { at: '#pk-live', fn: function () { setSink({ fruit: 0.2 }); }, say: 'The fruit unloads fast and drops its turgor: it now pulls the largest share.', wait: 6500 },
    { at: '#pk-live', fn: function () { setSink({ fruit: 1.1 }); }, say: 'A full fruit holds high turgor: its branch nearly stops and the others take the sugar.', wait: 6500 },
    { at: '#pk-out', fn: function () { setSink({ leaf: 0.59, fruit: 0.59, root: 0.59 }); }, say: 'Two ways out: through plasmodesmata in a root tip, through the cell wall space with an energy step in apple fruit.', wait: 6000 }
  ];

  PP.panels.push({
    id: 'sinks', mount: mount, update: update,
    show: function () { if (A1) { A1.resize(); A1.kick(); } if (A2) { A2.resize(); A2.kick(); } if (H.ctx) { hLive(); H.ctx.invalidate(); } },
    hide: function () {}
  });
})();

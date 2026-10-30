/* Light to Sugar: Plate III, The Thylakoid (L2 owner).
   3.1 The membrane, live: a canvas theatre of the thylakoid membrane. Photons land on PSII and PSI, water is split,
       electrons (green beads) run PSII → plastoquinone → cytochrome b6f → plastocyanin → PSI → ferredoxin → FNR → NADPH,
       protons (yellow) are pumped into the lumen and leave through the ATP synthase, whose c ring turns 1/14 of a turn per
       proton and releases one ATP per 14/3 protons. Every rate comes from LP.result (engine.js); one drawing scale for
       electrons and protons, so the ratios on screen are the model ratios.
   3.2 The Z scheme: redox potentials, the two photon pushes, an electron riding it at the model rate.
   3.3 Where absorbed light goes: photochemistry, NPQ, fluorescence, heat, versus light.
   3.4 The budget per CO2: theory versus measured quantum yield.
   Cases, Expert (equations, constants, open questions, How to measure), questions.
   Drawing primitives are COPIED from journey/mol.js (W, 10 Oct) and exposed as LP.mol for the stroma plate. */
(function () {
  'use strict';
  var LP = window.LP = window.LP || {};
  LP.panels = LP.panels || [];
  LP.evidence = LP.evidence || {};
  LP.howto = LP.howto || {};
  var TAU = Math.PI * 2;
  function clamp(x, a, b) { return x < a ? a : (x > b ? b : x); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* ================================================================== drawing kit (copied from journey/mol.js, extended) */
  var M = LP.mol = LP.mol || {};
  M.palette = function (dark) {
    return dark ? {
      dark: true, ink: '#ece6da', ink2: '#b3aca0', stroma: '#0c1912', stroma2: '#0f2018', lumen: '#0b1420', lumenAcid: '#4a2a06',
      head: '#5d9be6', headHi: '#cfe3ff', headLo: '#1d3f6e', tail: 'rgba(200,210,225,.36)', core: 'rgba(30,45,65,.55)',
      psii: '#3fa58f', psi: '#4f86d6', b6f: '#9a78e0', fnr: '#d1ab55', syn: '#5f86c9', synA: '#9fc0f0', synB: '#4c6fb8', stator: '#7d8fb0', ant: '#5fae4c',
      O: '#ff5a4a', H: '#f4f4f4', C: '#8d95a0', Hp: '#ffd84a', HpInk: '#3a2a00', e: '#8cff6a', atp: '#ffad3a', nadph: '#5fd3c7', pq: '#e3c27a', pc: '#68b8ff', fd: '#d9775a',
      heat: '#ff8a3d', fluo: '#ff4d4d', tagBg: 'rgba(20,26,34,.86)', tagInk: '#ece6da', tagRule: 'rgba(201,165,106,.6)', glow: 12, block: '#ff5050'
    } : {
      dark: false, ink: '#2a231c', ink2: '#5e5141', stroma: '#eef1df', stroma2: '#e3ead0', lumen: '#eef0f3', lumenAcid: '#f7dc94',
      head: '#6f9fd8', headHi: '#e6f0ff', headLo: '#2f5a94', tail: 'rgba(90,80,70,.42)', core: 'rgba(214,205,186,.55)',
      psii: '#3d8f7c', psi: '#4a7cc4', b6f: '#8460c4', fnr: '#c49a3e', syn: '#6b8fc9', synA: '#a9c3ea', synB: '#4d6fae', stator: '#8a96ad', ant: '#5c9a46',
      O: '#d2392b', H: '#ffffff', C: '#4a4f57', Hp: '#f2c230', HpInk: '#3a2a00', e: '#3f9a2a', atp: '#e8891a', nadph: '#1f9e93', pq: '#b8913a', pc: '#2f7fd0', fd: '#b5523a',
      heat: '#d9661c', fluo: '#d2232b', tagBg: 'rgba(250,246,236,.94)', tagInk: '#2a231c', tagRule: 'rgba(138,122,98,.75)', glow: 0, block: '#c0262b'
    };
  };
  function rgbOf(col) {
    var s = String(col), m = s.match(/rgba?\(([^)]+)\)/);
    if (m) return m[1].split(',').slice(0, 3).map(function (v) { return Math.round(+v) || 0; });
    var h = s.replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&');
    return [0, 2, 4].map(function (i) { return parseInt(h.substr(i, 2), 16) || 0; });
  }
  M.rgbOf = rgbOf;
  function shade(hex, f) {
    var n = rgbOf(hex);
    n = n.map(function (v) { return Math.round(f > 0 ? v + (255 - v) * f : v * (1 + f)); });
    return 'rgb(' + n.join(',') + ')';
  }
  M.shade = shade;
  function rrect(c, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  M.rrect = rrect;
  M.ball = function (c, x, y, r, col, hi, lo, a) {
    if (r <= 0) return;
    var g = c.createRadialGradient(x - r * 0.38, y - r * 0.42, r * 0.12, x, y, r);
    g.addColorStop(0, hi || '#ffffff'); g.addColorStop(0.35, col); g.addColorStop(1, lo || col);
    c.globalAlpha = a == null ? 1 : a; c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.globalAlpha = 1;
  };
  /* v19 identity colours, from molcolor.js at the site root (the same values as journey/mol.js): atoms coloured by
     their molecule. Water blue (O) with lighter blue H, CO2 a dark grey C between lighter grey O, O2 two crimson O. */
  var IDA = { light: { h2o: { O: '#1d4aa5', H: '#8fb8ee' }, co2: { C: '#4f5359', O: '#a7aaaf' }, o2: { O: '#981b30' } },
    dark: { h2o: { O: '#80dfff', H: '#b3e9ff' }, co2: { C: '#8a9098', O: '#d9dce0' }, o2: { O: '#dd3c3c' } } };
  M.atomColor = function (kind, el, dark) { var W = window.WPMolColor; return (W && W.atom && W.atom(kind, el, dark)) || IDA[dark ? 'dark' : 'light'][kind][el]; };
  M.idColor = function (kind, dark) { var W = window.WPMolColor; return (W && W.get(kind, dark)) || M.atomColor(kind, kind === 'co2' ? 'C' : 'O', dark); };
  function atomBall(c, P, x, y, r, col, a) {
    M.ball(c, x, y, r, col, shade(col, 0.55), shade(col, -0.4), a);
    if (r >= 2.2) { c.globalAlpha = (a == null ? 1 : a) * (P.dark ? 0.5 : 0.45); c.strokeStyle = P.dark ? 'rgba(0,0,0,.6)' : 'rgba(30,25,20,.6)'; c.lineWidth = 0.7; c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke(); c.globalAlpha = 1; }
  }
  M.water = function (c, P, x, y, r, ang, a) {
    var hr = r * 0.62, d = r * 0.95, h1 = ang - 0.912, h2 = ang + 0.912, cH = M.atomColor('h2o', 'H', P.dark);
    atomBall(c, P, x + Math.cos(h1) * d, y + Math.sin(h1) * d, hr, cH, a);
    atomBall(c, P, x + Math.cos(h2) * d, y + Math.sin(h2) * d, hr, cH, a);
    atomBall(c, P, x, y, r, M.atomColor('h2o', 'O', P.dark), a);
  };
  M.o2 = function (c, P, x, y, r, ang, a) {
    var dx = Math.cos(ang) * r * 0.8, dy = Math.sin(ang) * r * 0.8, col = M.atomColor('o2', 'O', P.dark);
    atomBall(c, P, x - dx, y - dy, r, col, a); atomBall(c, P, x + dx, y + dy, r, col, a);
  };
  M.co2 = function (c, P, x, y, r, ang, a) {
    var dx = Math.cos(ang) * r * 1.55, dy = Math.sin(ang) * r * 1.55, cO = M.atomColor('co2', 'O', P.dark);
    atomBall(c, P, x - dx, y - dy, r * 0.85, cO, a); atomBall(c, P, x + dx, y + dy, r * 0.85, cO, a);
    atomBall(c, P, x, y, r, M.atomColor('co2', 'C', P.dark), a);
  };
  M.proton = function (c, P, x, y, r, a) {
    if (P.glow) { c.save(); c.shadowColor = P.Hp; c.shadowBlur = P.glow * 0.7; }
    M.ball(c, x, y, r, P.Hp, '#fff8d0', shade(P.Hp, -0.35), a);
    if (P.glow) c.restore();
    if (r >= 5.5) {
      c.globalAlpha = a == null ? 1 : a; c.fillStyle = P.HpInk; c.font = '700 ' + Math.round(r * 0.95) + 'px system-ui,sans-serif';
      c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('H⁺', x, y + 0.5); c.globalAlpha = 1;
    }
  };
  M.electron = function (c, P, x, y, r, a) {
    if (P.glow) { c.save(); c.shadowColor = P.e; c.shadowBlur = P.glow; }
    M.ball(c, x, y, r, P.e, '#eaffe0', shade(P.e, -0.4), a);
    if (P.glow) c.restore();
  };
  M.atp = function (c, P, x, y, r, ang, a, noText) {
    c.globalAlpha = a == null ? 1 : a;
    if (P.glow) { c.save(); c.shadowColor = P.atp; c.shadowBlur = P.glow; }
    c.beginPath();
    for (var i = 0; i < 16; i++) { var t = ang + i * TAU / 16, rr = i % 2 ? r * 0.55 : r; c[i ? 'lineTo' : 'moveTo'](x + Math.cos(t) * rr, y + Math.sin(t) * rr); }
    c.closePath(); c.fillStyle = P.atp; c.fill();
    if (P.glow) c.restore();
    c.strokeStyle = shade(P.atp, -0.4); c.lineWidth = 0.8; c.stroke();
    if (r >= 9 && !noText) { c.fillStyle = '#3a2000'; c.font = '700 ' + Math.round(r * 0.6) + 'px system-ui,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('ATP', x, y + 0.5); }
    c.globalAlpha = 1;
  };
  M.pill = function (c, P, x, y, text, col, a, fs) {
    fs = fs || 10;
    c.font = '700 ' + fs + 'px system-ui,sans-serif';
    var w = c.measureText(text).width + 10, h = fs + 7;
    c.globalAlpha = a == null ? 1 : a;
    if (P.glow) { c.save(); c.shadowColor = col; c.shadowBlur = P.glow * 0.8; }
    var g = c.createLinearGradient(x, y - h / 2, x, y + h / 2); g.addColorStop(0, shade(col, 0.35)); g.addColorStop(1, shade(col, -0.2));
    c.fillStyle = g; rrect(c, x - w / 2, y - h / 2, w, h, h / 2); c.fill();
    if (P.glow) c.restore();
    c.fillStyle = P.dark ? '#06231f' : '#ffffff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, x, y + 0.5);
    c.globalAlpha = 1;
    if (M._rec) M._rec.push({ x: x - w / 2, y: y - h / 2, w: w, h: h });
  };
  /* slow and named round (13 Oct): small glyphs for the carriers that arrive (ADP, Pᵢ, NADP⁺) and NADPH drawn as a
     molecule, so the name can sit UNDER it as on every other molecule. NADPH: two linked rings (nicotinamide and
     adenine halves) with the extra H as a white dot; NADP⁺ is the same molecule, paler, without it. */
  M.nadph = function (c, P, x, y, r, a, ox) {
    var col = ox ? shade(P.nadph, P.dark ? -0.25 : 0.35) : P.nadph, hi = shade(col, 0.6), lo = shade(col, -0.45);
    c.save(); c.globalAlpha = a == null ? 1 : a;
    if (P.glow && !ox) { c.shadowColor = P.nadph; c.shadowBlur = P.glow * 0.8; }
    c.strokeStyle = lo; c.lineWidth = Math.max(1.5, r * 0.32); c.beginPath(); c.moveTo(x - r * 0.75, y); c.lineTo(x + r * 0.75, y); c.stroke();
    M.ball(c, x - r * 0.8, y, r * 0.72, col, hi, lo, a); M.ball(c, x + r * 0.8, y, r * 0.62, col, hi, lo, a);
    c.restore();
    if (!ox) M.ball(c, x - r * 1.25, y - r * 0.55, r * 0.3, '#ffffff', '#ffffff', P.dark ? '#b8c4c0' : '#c9d6d2', a);
  };
  M.adp = function (c, P, x, y, r, ang, a) {
    var col = shade(P.atp, P.dark ? -0.2 : 0.35);
    c.globalAlpha = a == null ? 1 : a; c.beginPath();
    for (var i = 0; i < 12; i++) { var t = ang + i * TAU / 12, rr = i % 2 ? r * 0.6 : r; c[i ? 'lineTo' : 'moveTo'](x + Math.cos(t) * rr, y + Math.sin(t) * rr); }
    c.closePath(); c.fillStyle = col; c.fill(); c.strokeStyle = shade(P.atp, -0.35); c.lineWidth = 0.8; c.stroke(); c.globalAlpha = 1;
  };
  M.pi = function (c, P, x, y, r, a) { M.ball(c, x, y, r, P.dark ? '#b28be8' : '#8a5cc4', '#f1e6ff', '#3d2470', a); };
  /* name placer: collects the name tags of one frame and draws them with no overlap with each other or with any
     label tag or pill drawn this frame (M._rec), skipping a name rather than covering a label */
  M.namer = function (c, P, w, h, fs, occ) {
    var placed = (occ || []).slice(), q = [], gl = [];
    function hit(a, b, px, py) { return a.x < b.x + b.w + px && a.x + a.w + px > b.x && a.y < b.y + b.h + py && a.y + a.h + py > b.y; }
    return {
      occ: placed,
      /* fix round (Q T1): every drawn molecule glyph is recorded with its species, so a name never lands on a
         molecule of another species (a reader would take that as a mislabel) */
      glyph: function (x, y, hw, hh, kind, ref) { if (x == null) return; gl.push({ x: x - hw, y: y - hh, w: hw * 2, h: hh * 2, k: kind, ref: ref }); },
      add: function (x, y, r, text, alpha, prio, ref) { if (x == null || !(alpha > 0.05)) return; q.push({ x: x, y: y, r: r, t: text, a: alpha, p: prio || 0, ref: ref }); },
      flush: function () {
        if (!M.namesOn()) return 0;
        var n = 0;
        q.sort(function (a, b) { return a.p - b.p; });
        c.save(); c.font = '700 ' + fs + 'px system-ui,-apple-system,Segoe UI,sans-serif';
        q.forEach(function (o) {
          var tw = c.measureText(o.t).width + 8, th = fs + 5;
          /* try right under the molecule, then nudged down twice; keep the pill inside the frame side to side */
          for (var dy = 0; dy <= 12; dy += 6) {
            var ty = o.y + o.r + 3 + dy + th / 2, bx = clamp(o.x - tw / 2, 2, w - 2 - tw), box = { x: bx, y: ty - th / 2, w: tw, h: th }, ok = true;
            if (box.y < 1 || box.y + box.h > h - 1) break;
            for (var i = 0; i < placed.length && ok; i++) if (hit(box, placed[i], 2, 1)) ok = false;
            for (var j = 0; j < gl.length && ok; j++) { var g = gl[j]; if (g.k !== o.t && g.ref !== o.ref && hit(box, g, 0, 0)) ok = false; }
            if (ok) { placed.push(box); o.box = box; o.nx = bx + tw / 2; o.dy = dy; n++; return; }
          }
        });
        c.restore();
        q.forEach(function (o) { if (o.box) M.name(c, P, o.nx, o.y + o.dy, o.r, o.t, { size: fs, alpha: o.a }); });
        M._lastNM = { w: w, h: h, names: q.filter(function (o) { return o.box; }).map(function (o) { return { t: o.t, box: o.box, ref: o.ref }; }), gl: gl };   /* test hook (read only) */
        return n;
      }
    };
  };
  /* Lead 13 Oct: molecule name under a molecule (window.MolNames switch). (x, y) = molecule centre, r = its drawn
     radius. size = font px (default 10, 9 on phones is fine; never below 8.5). Draws nothing when names are off. */
  M.namesOn = function () { return !window.MolNames || window.MolNames.get(); };
  M.name = function (c, P, x, y, r, text, o) {
    if (!M.namesOn() || !text) return;
    o = o || {};
    var fs = o.size || 10, a = o.alpha == null ? 1 : o.alpha;
    c.save(); c.globalAlpha *= a;
    c.font = '700 ' + fs + 'px system-ui,-apple-system,Segoe UI,sans-serif';
    var w = c.measureText(text).width + 8, h = fs + 5, ty = y + r + 3 + h / 2;
    var dark = P && P.dark;
    c.fillStyle = o.bg || (dark ? 'rgba(10,14,12,0.78)' : 'rgba(255,253,246,0.88)');
    var x0 = x - w / 2, y0 = ty - h / 2, rr = h / 2;
    c.beginPath(); c.moveTo(x0 + rr, y0); c.lineTo(x0 + w - rr, y0); c.arc(x0 + w - rr, ty, rr, -Math.PI / 2, Math.PI / 2); c.lineTo(x0 + rr, y0 + h); c.arc(x0 + rr, ty, rr, Math.PI / 2, Math.PI * 1.5); c.closePath(); c.fill();
    c.fillStyle = o.ink || (dark ? '#f6f1e4' : '#1d2a22'); c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(text, x, ty + 0.5);
    c.restore();
  };
  M.tag = function (c, P, x, y, text, o) {
    o = o || {};
    var fs = o.size || 11.5;
    c.font = (o.weight || 600) + ' ' + fs + 'px system-ui,-apple-system,"Segoe UI",sans-serif';
    var w = c.measureText(text).width + 12, h = fs + 9;
    var ax = o.align === 'right' ? x - w : (o.align === 'center' ? x - w / 2 : x), ay = y - h / 2;
    c.globalAlpha = o.alpha == null ? 1 : o.alpha;
    c.fillStyle = o.bg || P.tagBg; c.strokeStyle = o.rule || P.tagRule; c.lineWidth = 1;
    rrect(c, ax, ay, w, h, h / 2); c.fill(); c.stroke();
    c.fillStyle = o.ink || P.tagInk; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText(text, ax + 6, y + 0.5);
    c.globalAlpha = 1;
    var box = { x: ax, y: ay, w: w, h: h };
    if (M._rec) M._rec.push(box);
    return box;
  };
  M.arrow = function (c, x0, y0, x1, y1, w, col, a) {
    var ang = Math.atan2(y1 - y0, x1 - x0), hl = Math.max(7, w * 2.4);
    c.globalAlpha = a == null ? 1 : a; c.strokeStyle = col; c.fillStyle = col; c.lineWidth = w; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1 - Math.cos(ang) * hl * 0.8, y1 - Math.sin(ang) * hl * 0.8); c.stroke();
    c.beginPath(); c.moveTo(x1, y1);
    c.lineTo(x1 - Math.cos(ang - 0.45) * hl, y1 - Math.sin(ang - 0.45) * hl);
    c.lineTo(x1 - Math.cos(ang + 0.45) * hl, y1 - Math.sin(ang + 0.45) * hl); c.closePath(); c.fill();
    c.globalAlpha = 1;
  };
  M.bilayer = function (c, P, xa, xb, yTop, yBot, skip) {
    var r = clamp((yBot - yTop) * 0.085, 3, 7), step = r * 2.05, mid = (yTop + yBot) / 2;
    c.fillStyle = P.core; c.fillRect(xa, yTop + r, xb - xa, yBot - yTop - 2 * r);
    function free(x) { for (var i = 0; i < skip.length; i++) if (x > skip[i][0] - r && x < skip[i][1] + r) return false; return true; }
    c.strokeStyle = P.tail; c.lineWidth = Math.max(1, r * 0.22); c.lineCap = 'round';
    var n = 0, x;
    for (x = xa + r; x < xb; x += step, n++) {
      if (!free(x)) continue;
      [[yTop + r, 1], [yBot - r, -1]].forEach(function (hh) {
        for (var k = -1; k <= 1; k += 2) {
          var x0 = x + k * r * 0.32, y0 = hh[0] + hh[1] * r * 0.8, len = (mid - hh[0]) * hh[1] - r * 1.15;
          c.beginPath(); c.moveTo(x0, y0);
          for (var s = 1; s <= 4; s++) c.lineTo(x0 + Math.sin(s * 1.7 + n + k) * r * 0.28, y0 + hh[1] * len * s / 4);
          c.stroke();
        }
      });
    }
    for (x = xa + r; x < xb; x += step) {
      if (!free(x)) continue;
      M.ball(c, x, yTop + r, r, P.head, P.headHi, P.headLo);
      M.ball(c, x, yBot - r, r, P.head, P.headHi, P.headLo);
    }
  };
  /* shaded multi lobed protein: x centre, y0..y1, width w */
  M.protein = function (c, P, x, y0, y1, w, col, o) {
    o = o || {};
    var lobes = o.lobes || 3, hi = shade(col, P.dark ? 0.45 : 0.6), lo = shade(col, -0.45);
    c.globalAlpha = o.alpha == null ? 1 : o.alpha;
    if (o.glow) { c.save(); c.shadowColor = o.glow; c.shadowBlur = o.glowBlur || 18; }
    var g = c.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    g.addColorStop(0, lo); g.addColorStop(0.28, col); g.addColorStop(0.45, hi); g.addColorStop(0.62, col); g.addColorStop(1, lo);
    c.fillStyle = g;
    var lw = w / lobes;
    for (var i = 0; i < lobes; i++) {
      var cx = x - w / 2 + lw * (i + 0.5), bulge = (i % 2 ? 0.06 : -0.04) * (y1 - y0);
      rrect(c, cx - lw * 0.62, y0 + bulge, lw * 1.24, (y1 - y0) - bulge * 2, lw * 0.6); c.fill();
    }
    if (o.glow) c.restore();
    c.strokeStyle = P.dark ? 'rgba(190,215,255,.30)' : 'rgba(255,255,255,.55)'; c.lineWidth = 1.2;
    rrect(c, x - w / 2 + 2, y0 + 2, w - 4, (y1 - y0) - 4, w * 0.22); c.stroke();
    c.globalAlpha = 1;
  };
  /* a photon as a short wave packet travelling along (x0,y0) → (x1,y1), progress p */
  M.photon = function (c, x0, y0, x1, y1, p, col, lam, a, lw) {
    var dx = x1 - x0, dy = y1 - y0, L = Math.sqrt(dx * dx + dy * dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
    var len = 34, amp = 3.2, k = TAU / Math.max(4, lam);
    var hx = x0 + dx * p, hy = y0 + dy * p;
    c.globalAlpha = a == null ? 1 : a; c.strokeStyle = col; c.lineWidth = lw || 1.8; c.lineCap = 'round';
    c.beginPath();
    for (var s = 0; s <= len; s += 1.5) {
      var env = Math.sin(Math.PI * s / len), off = Math.sin(k * s - p * 40) * amp * env;
      var px = hx - ux * s + nx * off, py = hy - uy * s + ny * off;
      if (s === 0) c.moveTo(px, py); else c.lineTo(px, py);
    }
    c.stroke(); c.globalAlpha = 1;
  };

  /* ================================================================== helpers */
  var ui = null;
  function U() { return (ui = LP.ui); }
  function esc(s) { return U().esc(s); }
  function num(x, d) { return U().num(x, d); }
  var MINUS = '−';

  /* ================================================================== evidence and How to measure (plate keys) */
  var EV = LP.evidence;
  EV['thy.scale'] = { claim: 'In the membrane theatre every green bead (electron) and every yellow bead (proton) stands for the same flux: 14 µmol m−2 s−1 of leaf. So 3 protons enter the lumen for each linear electron on screen, as in the model. Photons are drawn at a coarser scale (one per 40 µmol m−2 s−1 absorbed). Time is slowed enormously: a real electron crosses the chain in a few milliseconds.', cite: 'Drawing convention of this page; rates from the engine.', measured: 'none', value: '1 bead = 14 µmol m−2 s−1', badge: 'DERIVED', note: 'The pictured complexes are one of each; a real thylakoid holds many thousands per µm2.' };
  EV['thy.rotor'] = { claim: 'The c ring of the ATP synthase turns 1/14 of a turn for each proton that passes, and the head makes 3 ATP per full turn, so 14/3 = 4.67 protons per ATP. On screen the ring advances one subunit per proton and an ATP leaves the head every 4.67 protons.', cite: 'Turina, Petersen and Gräber (2016) state the structural ratio c/β = 14/3 for the chloroplast enzyme (abstract retrieved); Seelert et al. (2000) Nature 405:418 is the original c14 report (abstract not seen this run).', doi: '10.1016/j.bbabio.2016.02.019', doi2: '10.1038/35013148', measured: 'c ring stoichiometry (spinach)', value: '14 c subunits; 4.67 H+ per ATP', badge: 'VERIFIED', note: 'The thermodynamic ratio is 4.0 (same paper): see the open question. Rotor speed per enzyme uses an ILLUSTRATIVE enzyme density (0.5 µmol m−2). The rotor is locked in the dark by a redox switch in γ (Hahn et al. 2018).' };
  EV['thy.eStar'] = { claim: 'Absorbing a photon lifts the reaction centre by the photon energy: P680 (+1.21 V) to P680* about −0.61 V with a 680 nm photon (1.82 eV); P700 (about +0.46 V) to P700* about −1.31 V with a 700 nm photon (1.77 eV).', cite: 'E = hc/λ applied to the measured P680 potential (Kato et al. 2009) and a textbook P700 potential.', doi: '10.1073/pnas.0905388106', measured: 'calculation', value: 'P680* ≈ −0.61 V; P700* ≈ −1.31 V', badge: 'DERIVED', note: 'The excited state potential is an estimate; real values depend on the protein environment.' };
  EV['thy.fate'] = { claim: 'Shares of PSII excitation that go to photochemistry (ΦPSII), regulated heat (NPQ), fluorescence and other heat. ΦPSII comes from the model electron flow; the split of the rest is a teaching rule: qE follows the protonation of PsbS and the zeaxanthin switch, both half on near lumen pH 6.8 (Takizawa et al. 2007, key psbs_zea_pka).', cite: 'Shape of the split ILLUSTRATIVE; mechanism after Müller, Li and Niyogi (2001); pKa from Takizawa et al. (2007).', doi: '10.1104/pp.125.4.1558', measured: 'none', value: '', badge: 'ILLUSTRATIVE', note: 'In a real leaf fluorescence is 1 to 3 % of absorbed light at most; it is drawn larger here so you can see it change.' };
  EV['thy.lumenDraw'] = { claim: 'The number of protons drawn in the lumen grows tenfold for each pH unit the lumen is more acid than the stroma (capped at 48), so the picture follows concentration on a log scale.', cite: 'Drawing convention; pH from the engine (ILLUSTRATIVE).', measured: 'none', value: '', badge: 'ILLUSTRATIVE' };

  EV['thy.psbs'] = { claim: 'PsbS, a protein of photosystem II, is needed for the fast, pH triggered part of NPQ (qE). Arabidopsis npq4 mutants without PsbS cannot dissipate excess light as heat, yet harvest light and photosynthesise normally in steady light.', cite: 'Li XP, Björkman O, Shih C, Grossman AR, Rosenquist M, Jansson S, Niyogi KK (2000) Nature 403:391 to 395.', doi: '10.1038/35000131', measured: 'Arabidopsis mutants, chlorophyll fluorescence', value: 'qualitative', badge: 'VERIFIED', note: 'On this plate the NPQ switch scales qE by 0 (no PsbS), 1 or 1.5: the sizes are ILLUSTRATIVE.' };
  EV['thy.vpz'] = { claim: 'Tobacco engineered to relax NPQ faster after shade (more violaxanthin de epoxidase, zeaxanthin epoxidase and PsbS: VPZ lines) fixed more CO2 and made about 15 % more dry matter in fluctuating light.', cite: 'Kromdijk J, Głowacka K, Leonelli L, Gabilly ST, Iwai M, Niyogi KK, Long SP (2016) Science 354:857 to 861.', doi: '10.1126/science.aai8878', measured: 'Nicotiana tabacum, field and chamber, dry matter', value: 'about 15 %', badge: 'VERIFIED', note: 'The authors estimated that slow NPQ relaxation could cost field crops up to 20 % of potential yield (a calculation, not a measurement).' };
  EV['thy.cycForce'] = { claim: 'The cyclic flow slider multiplies the cyclic flow the Calvin Benson cycle needs. Below 100 % the leaf runs short of ATP: the cycle slows to what the ATP allows and NADPH piles up. Above 100 % the extra cyclic flow uses PSI photons that linear flow could have used, and the extra protons back up in the lumen.', cite: 'Teaching model; the need for cyclic flow follows from 3 H+ per linear electron and 14/3 H+ per ATP (Kramer and Evans 2011; Yamori and Shikanai 2016).', doi: '10.1146/annurev-arplant-043015-112002', doi2: '10.1104/pp.110.166652', measured: 'none', value: '0 to 200 %', badge: 'ILLUSTRATIVE', note: 'pgr5 mutants of Arabidopsis, which lack the main cyclic route, are the real world version of the 0 % end.' };
  /* r5: retrieved from PubMed on 12 Oct 2026 (abstract level) */
  EV['thy.sacksteder'] = { claim: 'In intact tobacco leaves the proton to electron ratio of linear flow stayed constant from low to saturating light. Taking 3 H+ per electron at low light, the Q cycle at cytochrome b6f is continuously engaged in steady state photosynthesis.', cite: 'Sacksteder CA, Kanazawa A, Jacoby ME, Kramer DM (2000) Proc Natl Acad Sci USA 97:14283 to 14288.', doi: '10.1073/pnas.97.26.14283', measured: 'Nicotiana tabacum, intact leaves; dark interval relaxation kinetics of ECS, cyt f and P700; chlorophyll fluorescence', value: '3 H+ per e− (constant with light)', badge: 'VERIFIED', note: 'PubMed PMID 11121034. The value 3 at low light is the generally accepted starting point the authors build on.' };
  EV['thy.turina'] = { claim: 'Chloroplast ATP synthase: the structural H+/ATP ratio is c/β = 14/3 = 4.7, but the thermodynamic ratio measured in proteoliposomes (shift of the ATP synthesis equilibrium with ΔpH) is 4.0 ± 0.1. The authors read the 0.7 extra protons as used for activation or lost to internal uncoupling, an efficiency of 0.85.', cite: 'Turina P, Petersen J, Gräber P (2016) Biochim Biophys Acta 1857:653 to 664 (meta analysis of all published data from this system).', doi: '10.1016/j.bbabio.2016.02.019', measured: 'spinach chloroplast CF0F1 in proteoliposomes, acid base transitions', value: 'structural 4.7; thermodynamic 4.0 ± 0.1', badge: 'VERIFIED', note: 'PubMed PMID 26940516. Which number sets the ATP made per proton in a working leaf is the open question on this plate.' };
  EV['thy.hahn'] = { claim: 'Cryo EM structure of the complete chloroplast ATP synthase (spinach, 26 subunits). Plant ATP synthase is autoinhibited by a β hairpin redox switch in subunit γ that blocks rotation in the dark.', cite: 'Hahn A, Vonck J, Mills DJ, Meier T, Kühlbrandt W (2018) Science 360:eaat4318.', doi: '10.1126/science.aat4318', measured: 'Spinacia oleracea; cryo electron microscopy', value: 'qualitative', badge: 'VERIFIED', note: 'PubMed PMID 29748256.' };
  EV['thy.hoge2012'] = { claim: 'Leaves acclimate their photosystem composition to the growth light spectrum, which changes the PSII : PSI excitation balance and the quantum yield for CO2 fixation at each wavelength; combining wavelengths can raise quantum yield substantially.', cite: 'Hogewoning SW, Wientjes E, Douwstra P, Trouwborst G, van Ieperen W, Croce R, Harbinson J (2012) Plant Cell 24:1921 to 1935.', doi: '10.1105/tpc.112.097972', measured: 'Cucumis sativus grown under sunlight, shade and blue spectra; PSI and PSII yields and α at 20 wavelengths', value: 'qualitative', badge: 'VERIFIED', note: 'PubMed PMID 22623496. The engine uses this idea: the PSII share of absorbed PAR adjusts so both photosystems keep up (bounds 0.40 to 0.55 ILLUSTRATIVE).' };
  EV['thy.etrConv'] = { claim: 'The 0.84 (leaf absorptance) and 0.5 (share of absorbed light reaching PSII) in ETR = PPFD × ΦPSII × 0.84 × 0.5 are conventions, not measurements of your leaf. Genty et al. (1989) gave ΦPSII = (Fm′ − Fs)/Fm′ and its linear relation to the quantum yield of CO2 fixation.', cite: 'Convention widely used after Genty et al. (1989); the PSII share changes with wavelength and growth spectrum (Hogewoning et al. 2012).', doi: '10.1016/S0304-4165(89)80016-9', doi2: '10.1105/tpc.112.097972', measured: 'none', value: '0.84; 0.5', badge: 'UNVERIFIED', note: 'Measure absorptance with an integrating sphere (Plate II) and calibrate ΦPSII against ΦCO2 at 2 % O2 on the same leaves before reading ETR as electrons.' };
  EV['thy.grana'] = { claim: 'In real thylakoids PSII and LHCII sit mostly in the stacked grana, PSI and ATP synthase in the unstacked stroma lamellae, with plastoquinone and plastocyanin diffusing between them. The membrane here is drawn in one line for clarity.', cite: 'Textbook arrangement; no paper retrieved this run.', measured: 'none', value: '', badge: 'UNVERIFIED' };
  EV['thy.farredCanopy'] = { claim: 'A single leaf absorbs little far red (0.30 in this model), so one far red photon is worth about a third of a PAR photon to it. A canopy of several leaf layers catches much more far red, which is how canopy studies can find far red photons about as useful as PAR photons.', cite: 'Leaf value ILLUSTRATIVE; canopy result Zhen and Bugbee (2020), key farred_equal_efficiency.', measured: 'none', value: 'about 0.36 PAR photon per far red photon (DERIVED from the model at 300 µmol red + blue + 75 far red)', badge: 'DERIVED' };
  LP.sources['10.1073/pnas.97.26.14283'] = 'Sacksteder CA, Kanazawa A, Jacoby ME, Kramer DM (2000) Proc Natl Acad Sci USA 97:14283 to 14288';
  LP.sources['10.1016/j.bbabio.2016.02.019'] = 'Turina P, Petersen J, Gräber P (2016) Biochim Biophys Acta 1857:653 to 664';
  LP.sources['10.1126/science.aat4318'] = 'Hahn A, Vonck J, Mills DJ, Meier T, Kühlbrandt W (2018) Science 360:eaat4318';
  LP.sources['10.1105/tpc.112.097972'] = 'Hogewoning SW et al. (2012) Plant Cell 24:1921 to 1935';
  LP.sources['10.1038/35000131'] = LP.sources['10.1038/35000131'] || 'Li XP, Björkman O, Shih C, Grossman AR, Rosenquist M, Jansson S, Niyogi KK (2000) Nature 403:391 to 395';
  LP.sources['10.1126/science.aai8878'] = LP.sources['10.1126/science.aai8878'] || 'Kromdijk J et al. (2016) Science 354:857 to 861';
  /* one label per DOI (the generated sheet joins two papers on some DOIs; Q-science r1 item 5) */
  LP.sources['10.1146/annurev-arplant-043015-112002'] = 'Yamori W, Shikanai T (2016) Annu Rev Plant Biol 67:81 to 106';
  LP.sources['10.1016/S0304-4165(89)80016-9'] = 'Genty B, Briantais JM, Baker NR (1989) Biochim Biophys Acta 990:87 to 92';
  LP.sources['10.1146/annurev.arplant.59.032607.092759'] = 'Baker NR (2008) Annu Rev Plant Biol 59:89 to 113';
  LP.sources['10.1098/rstb.2016.0381'] = 'Davis GA, Rutherford AW, Kramer DM (2017) Phil Trans R Soc B 372:20160381';
  LP.sources['10.7554/eLife.16921'] = 'Davis GA et al. (2016) eLife 5:e16921';
  LP.sources['10.1007/s11120-008-9351-9'] = 'Rose S et al. (2008) Photosynth Res 98:449 to 468';
  LP.sources['10.1002/pro.5560051012'] = 'Xiong J, Subramaniam S, Govindjee (1996) Protein Sci 5:2054';

  LP.howto['thy.pam'] = {
    title: 'electron transport with a PAM fluorometer', what: 'ΦPSII, ETR and NPQ from chlorophyll fluorescence',
    steps: [
      'Dark adapt the leaf 20 to 30 min. Give a weak measuring light for F<sub>o</sub>, then a saturating pulse (above 6,000 µmol m⁻² s⁻¹ for under a second) for F<sub>m</sub>. F<sub>v</sub>/F<sub>m</sub> = (F<sub>m</sub> − F<sub>o</sub>)/F<sub>m</sub>, about 0.8 in a healthy leaf.',
      'Switch on actinic light at the PPFD you want and wait for steady state F<sub>s</sub>. Fire a saturating pulse for F<sub>m</sub>′.',
      'ΦPSII = (F<sub>m</sub>′ − F<sub>s</sub>)/F<sub>m</sub>′ (Genty et al. 1989). ETR = PPFD × ΦPSII × a × f<sub>PSII</sub>, where a = 0.84 and f<sub>PSII</sub> = 0.5 are conventions: state the values you assumed.',
      'To make ETR usable as electrons, calibrate it: on the same leaves measure ΦCO₂ by gas exchange at 2 % O₂ (no photorespiration) across light levels and fit ΦCO₂ against ΦPSII (the Genty linearity), or measure absorptance with an integrating sphere (Plate II card).',
      'NPQ = (F<sub>m</sub> − F<sub>m</sub>′)/F<sub>m</sub>′: how much the leaf turned excitation into heat.',
      'For a herbicide check, add DCMU: F<sub>s</sub> rises toward F<sub>m</sub> and ΦPSII falls toward zero.'
    ],
    watch: 'ETR is an estimate of electron flow through PSII, not of CO₂ fixed; it includes photorespiration and other sinks, and the surface signal is weighted toward the cells nearest the probe.',
    dois: ['10.1016/S0304-4165(89)80016-9', '10.1146/annurev.arplant.59.032607.092759', '10.1104/pp.17.00820', '10.1105/tpc.112.097972']
  };
  LP.howto['thy.ecs'] = {
    title: 'the proton motive force from the electrochromic shift', what: 'pmf, ΔpH and Δψ in an intact leaf',
    steps: [
      'Measure absorbance changes near 520 nm (the electrochromic shift of carotenoids) with a kinetic spectrophotometer clamped on the leaf.',
      'Switch the actinic light off for a few hundred milliseconds. The fast decay of the signal is protons leaving through the ATP synthase; its size is the light driven pmf, its rate the proton conductance.',
      'The slower part of the relaxation separates ΔpH from Δψ (the membrane voltage).',
      'Repeat at several light levels and relate lumen acidity to NPQ.'
    ],
    watch: 'The ECS signal must be calibrated per leaf (for example with a single turnover flash), and scattering changes overlap the 520 nm band.',
    dois: ['10.1098/rstb.2016.0381', '10.7554/eLife.16921']
  };

  /* ================================================================== the membrane theatre */
  var TH = { e: [], h: [], ph: [], fx: [], atp: [], nadph: [], wat: [], o2: [], pool: [], sy: [], adp: [], nadp: [], nm: {}, acc: {}, rot: 0, rotT: 0, atpAcc: 0, nadAcc: 0, waterAcc: 0, atpSlot: 0, nadSlot: 0, follow: null, followReq: false, followH: null, followHReq: false, lay: null, cache: null, cacheKey: '' };
  var K_E = 1 / 14;          /* beads per s per µmol m−2 s−1 (electrons and protons) */
  var K_PH = 1 / 40;         /* photons drawn per s per µmol m−2 s−1 absorbed */
  var E_TIME = 3.4;          /* seconds for a linear electron to cross the chain on screen */
  var PROD_LIFE = 1.4;       /* seconds an ATP or NADPH stays on screen after it is made */
  function R() { return LP.result || {}; }
  function rnd() { return Math.random(); }

  function layout(w, h) {
    var mob = w < 560;
    /* slow and named: the theatre is taller; the extra height goes mostly to the stroma, where products and names live */
    var mt = h * (mob ? 0.44 : 0.43), mb = h * (mob ? 0.57 : 0.565), mid = (mt + mb) / 2, mh = mb - mt;
    var L = { w: w, h: h, mob: mob, mt: mt, mb: mb, mid: mid, mh: mh };
    L.ps2 = { x: w * (mob ? 0.15 : 0.16), w: w * (mob ? 0.17 : 0.13) };
    L.ant2 = { x: L.ps2.x - L.ps2.w * 0.78, w: L.ps2.w * 0.42 };
    L.b6f = { x: w * 0.415, w: w * (mob ? 0.10 : 0.085) };
    L.ps1 = { x: w * 0.60, w: w * (mob ? 0.15 : 0.12) };
    L.fd = { x: w * 0.685, y: mt - h * 0.055 };
    L.fnr = { x: w * 0.735, y: mt - h * 0.085, w: w * (mob ? 0.075 : 0.06) };
    L.syn = { x: w * (mob ? 0.86 : 0.885), w: w * (mob ? 0.11 : 0.085) };
    L.head = { x: L.syn.x, y: mt - h * 0.19, r: Math.min(w * (mob ? 0.07 : 0.05), h * 0.085) };
    L.atpOut = { x: mob ? Math.min(w * 0.77, L.syn.x - 35) : L.syn.x - w * 0.13, y: h * (mob ? 0.06 : 0.065) };
    L.nadOut = { x: mob ? w * 0.45 : L.fnr.x - w * 0.14, y: h * (mob ? 0.055 : 0.055) };
    /* slow and named: six end slots per product (3 columns, 2 rows), used in turn, so the products and their name tags
       spread out instead of piling on one point */
    L.atpSlot = function (k) { var col = k % 3, row = Math.floor(k / 3) % 2, sp = mob ? 32 : 40; return { x: L.atpOut.x + (col - 1) * sp + (row ? sp * 0.5 : 0), y: L.atpOut.y + row * h * 0.055 }; };
    L.nadSlot = function (k) { var col = k % 3, row = Math.floor(k / 3) % 2, sp = mob ? 48 : 58; return { x: L.nadOut.x + (col - 1) * sp + (row ? sp * 0.5 : 0), y: L.nadOut.y + row * h * 0.055 }; };
    L.oec = { x: L.ps2.x - L.ps2.w * 0.1, y: mb + h * 0.07 };
    var s = mh * 0.12;
    /* linear electron path */
    L.lin = [
      [L.ps2.x, mid + s], [L.ps2.x + L.ps2.w * 0.22, mid - s], [L.ps2.x + L.ps2.w * 0.42, mid],      /* P680 → Pheo/QA → QB */
      [lerp(L.ps2.x, L.b6f.x, 0.55), mid + s * 0.4], [L.b6f.x - L.b6f.w * 0.25, mid],               /* PQ pool → b6f (Qo) */
      [L.b6f.x, mb + h * 0.03], [lerp(L.b6f.x, L.ps1.x, 0.5), mb + h * 0.06], [L.ps1.x - L.ps1.w * 0.15, mb + h * 0.03], /* PC */
      [L.ps1.x, mid + s], [L.ps1.x + L.ps1.w * 0.1, mt - h * 0.02],                                   /* P700 → FX/FA/FB */
      [L.fd.x, L.fd.y], [L.fnr.x, L.fnr.y]                                                          /* Fd → FNR */
    ];
    L.linStage = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    /* cyclic: PSI → Fd → back to the PQ pool near b6f (PGR5 route) → b6f → PC → PSI */
    L.cyc = [
      [L.ps1.x, mid + s], [L.ps1.x + L.ps1.w * 0.1, mt - h * 0.02], [L.fd.x, L.fd.y],
      [lerp(L.b6f.x, L.ps1.x, 0.5), mt - h * 0.08], [L.b6f.x + L.b6f.w * 0.3, mt - h * 0.01], [L.b6f.x, mid],
      [L.b6f.x, mb + h * 0.03], [lerp(L.b6f.x, L.ps1.x, 0.5), mb + h * 0.06], [L.ps1.x - L.ps1.w * 0.15, mb + h * 0.03], [L.ps1.x, mid + s]
    ];
    [L.lin, L.cyc].forEach(function (p) {
      var acc = [0];
      for (var i = 1; i < p.length; i++) { var dx = p[i][0] - p[i - 1][0], dy = p[i][1] - p[i - 1][1]; acc.push(acc[i - 1] + Math.sqrt(dx * dx + dy * dy)); }
      p.acc = acc; p.len = acc[acc.length - 1];
    });
    L.skip = [[L.ps2.x - L.ps2.w / 2, L.ps2.x + L.ps2.w / 2], [L.ant2.x - L.ant2.w / 2, L.ant2.x + L.ant2.w / 2], [L.b6f.x - L.b6f.w / 2, L.b6f.x + L.b6f.w / 2],
      [L.ps1.x - L.ps1.w / 2, L.ps1.x + L.ps1.w / 2 + L.ps1.w * 0.25], [L.syn.x - L.syn.w / 2, L.syn.x + L.syn.w / 2]];
    return L;
  }
  function along(p, d) {
    if (d <= 0) return { x: p[0][0], y: p[0][1], seg: 0 };
    for (var i = 1; i < p.length; i++) {
      if (d <= p.acc[i]) { var f = (d - p.acc[i - 1]) / (p.acc[i] - p.acc[i - 1] || 1); return { x: lerp(p[i - 1][0], p[i][0], f), y: lerp(p[i - 1][1], p[i][1], f), seg: i - 1 }; }
    }
    var n = p.length - 1; return { x: p[n][0], y: p[n][1], seg: n };
  }

  /* static layer: backgrounds, bilayer, protein bodies (rebuilt on size, theme, tier or switch change) */
  function buildCache(L, P, dpr, res) {
    var key = [L.w, L.h, P.dark, dpr, ui.tier(), !!res.dcmu].join('|');
    if (TH.cache && TH.cacheKey === key) return TH.cache;
    var cv = TH.cache || document.createElement('canvas');
    cv.width = Math.round(L.w * dpr); cv.height = Math.round(L.h * dpr);
    var c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, L.w, L.h);
    var g = c.createLinearGradient(0, 0, 0, L.mt); g.addColorStop(0, P.stroma2); g.addColorStop(1, P.stroma);
    c.fillStyle = g; c.fillRect(0, 0, L.w, L.mt + 2);
    M.bilayer(c, P, 0, L.w, L.mt, L.mb, L.skip);
    /* LHCII antenna */
    M.protein(c, P, L.ant2.x, L.mt - L.h * 0.025, L.mb + L.h * 0.02, L.ant2.w, P.ant, { lobes: 2 });
    /* PSII with the oxygen evolving complex bulging into the lumen */
    M.protein(c, P, L.ps2.x, L.mt - L.h * 0.07, L.mb + L.h * 0.05, L.ps2.w, P.psii, { lobes: 3 });
    M.protein(c, P, L.oec.x, L.mb + L.h * 0.02, L.mb + L.h * 0.105, L.ps2.w * 0.55, shade(P.psii, -0.15), { lobes: 2 });
    /* Mn4CaO5 cluster: four violet Mn and one green Ca */
    var ox = L.oec.x, oy = L.oec.y - 2, rr = Math.max(2.4, L.ps2.w * 0.035);
    [[-1.2, -0.4], [0, -1], [1.2, -0.4], [0.6, 0.8]].forEach(function (q) { M.ball(c, ox + q[0] * rr * 1.5, oy + q[1] * rr * 1.5, rr, '#8a5cd6', '#e8dcff', '#3a1f6e'); });
    M.ball(c, ox - 0.7 * rr * 1.5, oy + 0.9 * rr * 1.5, rr * 1.05, '#4fae6a', '#dfffe8', '#1d5a30');
    /* cytochrome b6f dimer */
    M.protein(c, P, L.b6f.x, L.mt - L.h * 0.05, L.mb + L.h * 0.04, L.b6f.w, P.b6f, { lobes: 2 });
    /* PSI with LHCI on its flank */
    M.protein(c, P, L.ps1.x + L.ps1.w * 0.62, L.mt - L.h * 0.02, L.mb + L.h * 0.015, L.ps1.w * 0.3, P.ant, { lobes: 1 });
    M.protein(c, P, L.ps1.x, L.mt - L.h * 0.06, L.mb + L.h * 0.035, L.ps1.w, P.psi, { lobes: 3 });
    /* FNR on the stromal face */
    M.protein(c, P, L.fnr.x, L.fnr.y - L.h * 0.045, L.mt + 2, L.fnr.w, P.fnr, { lobes: 2 });
    /* ATP synthase stator arm */
    var sx = L.syn.x + L.syn.w * 0.62;
    c.fillStyle = P.stator; rrect(c, sx - 3, L.head.y - L.head.r * 0.4, 6, L.mb - (L.head.y - L.head.r * 0.4) - 4, 3); c.fill();
    TH.cache = cv; TH.cacheKey = key;
    return cv;
  }

  /* spawn helpers */
  function spawnElectron(kind) {
    var L = TH.lay; if (!L) return;
    var e = { kind: kind, d: 0, path: kind === 'lin' ? L.lin : L.cyc, v: (kind === 'lin' ? L.lin.len / E_TIME : L.cyc.len / (E_TIME * 0.85)), pb6f: false, seg: -1 };
    if (TH.followReq && kind === 'lin') { e.follow = true; TH.followReq = false; TH.follow = e; }
    TH.e.push(e);
  }
  function spawnProtonTransit(x0, y0, x1, y1, kind, delay) { TH.h.push({ x0: x0, y0: y0, x1: x1, y1: y1, p: -(delay || 0), kind: kind, dur: kind === 'syn' ? 0.75 : 1.0 }); }
  function bandPick(s, res) {
    var a = [['blue', s.blue * 0.84], ['green', s.green * 0.84 * 0.9], ['red', s.red * 0.84], ['farred', s.farred * 0.3]];
    var t = 0; a.forEach(function (x) { t += x[1]; }); var r = rnd() * t;
    for (var i = 0; i < a.length; i++) { r -= a[i][1]; if (r <= 0) return a[i][0]; }
    return 'red';
  }
  var BAND = { blue: [450, '#3a6bff', '#7aa2ff'], green: [530, '#2fa04a', '#6fe08a'], red: [660, '#e0312a', '#ff6a5e'], farred: [730, '#7a1030', '#d0507a'] };

  function step(dt) {
    var L = TH.lay; if (!L) return;
    var r = R(), acc = TH.acc;
    var jl = r.Jused || 0, cyc = r.cyclic || 0, hp = r.hPlus || 0, unc = !!r.uncoupler;
    /* DCMU just arrived: electrons not yet past QB and water on its way stop at once (the block is immediate) */
    if (r.dcmu && !TH.wasDcmu) { TH.e = TH.e.filter(function (e) { return e.kind !== 'lin' || e.seg >= 3; }); TH.wat = []; }
    TH.wasDcmu = !!r.dcmu;
    /* uncoupler: for the first seconds electrons race (res.Jtransient), then NADP+ is used up and flow falls to
       what O2 can take (res.Jused); the drawing follows that time course */
    if (unc) {
      TH.uncT = (TH.uncT == null || TH.uncT < 0) ? 0 : TH.uncT + dt;
      var kU = clamp((TH.uncT - 2) / 2.5, 0, 1); kU = kU * kU * (3 - 2 * kU);
      jl = lerp(r.Jtransient || jl, r.Jused || 0, kU); hp = 3 * jl; TH.uncK = kU;
    } else { TH.uncT = -1; TH.uncK = 0; }
    /* electrons */
    acc.e = (acc.e || 0) + jl * K_E * dt;
    while (acc.e >= 1) { acc.e -= 1; spawnElectron('lin'); }
    acc.c = (acc.c || 0) + cyc * K_E * dt;
    while (acc.c >= 1) { acc.c -= 1; spawnElectron('cyc'); }
    /* water: one molecule per 2 electrons, heading for the Mn cluster */
    acc.w = (acc.w || 0) + jl / 2 * K_E * dt;
    while (acc.w >= 1) { acc.w -= 1; var sx = L.oec.x - L.w * 0.12 - rnd() * L.w * 0.05; TH.wat.push({ x0: sx, y0: L.h - 8 - rnd() * L.h * 0.12, p: 0, ang: rnd() * TAU }); }
    /* protons out through the synthase, or leaking across the membrane with an uncoupler */
    acc.s = (acc.s || 0) + hp * K_E * dt;
    while (acc.s >= 1) {
      acc.s -= 1;
      if (unc) { var lx = L.w * (0.05 + 0.9 * rnd()); spawnProtonTransit(lx, L.mb + L.h * 0.05, lx + (rnd() - 0.5) * 10, L.mt - L.h * 0.05, 'leak'); }
      else {
        /* slow and named: a proton leaves the lumen crowd for the a subunit, binds one c subunit, rides the ring almost
           a full turn and is released to the stroma (the 2D twin of the hero's ring) */
        var sq = { st: 'in', p: 0, x0: L.syn.x - L.w * 0.05 + rnd() * (L.syn.w + L.w * 0.07), y0: L.mb + L.h * (0.09 + rnd() * 0.12), dy: 0 };
        if (TH.followHReq) { sq.follow = true; TH.followHReq = false; TH.followH = sq; setFollowH(0); }
        TH.sy.push(sq);
      }
    }
    /* ADP + Pᵢ arrive at the head as fast as ATP is made; NADP⁺ arrives at FNR as fast as NADPH is made */
    if (!unc) acc.adp = (acc.adp || 0) + hp / (r.hPerATP || 14 / 3) * K_E * dt;
    while (acc.adp >= 1) { acc.adp -= 1; if (TH.adp.length < (L.mob ? 2 : 4)) TH.adp.push({ p: 0, ang: rnd() * TAU, j: rnd() }); }
    if (!(unc && TH.uncK > 0.5) && !r.dcmu) acc.nadp = (acc.nadp || 0) + jl / 2 * K_E * dt;
    while (acc.nadp >= 1) { acc.nadp -= 1; if (TH.nadp.length < (L.mob ? 3 : 4)) TH.nadp.push({ p: 0, j: rnd() }); }
    TH.adp = TH.adp.filter(function (q) { q.p += dt / 1.5; q.ang += dt; return q.p < 1; });
    TH.nadp = TH.nadp.filter(function (q) { q.p += dt / 1.5; return q.p < 1; });
    /* the c ring: one step per bound proton, eased so the turn is smooth at every playback speed */
    var hA0 = r.hPerATP || 14 / 3, stepA = TAU / (3 * hA0), rw0 = L.syn.w * 0.5;
    TH.sy = TH.sy.filter(function (q) {
      if (q.st === 'in') {
        q.p += dt / 0.8;
        var k = clamp(q.p, 0, 1), e = k * k * (3 - 2 * k);
        q.x = lerp(q.x0, L.syn.x + rw0 * 0.95, e); q.y = lerp(q.y0, L.mid + L.mh * 0.18, e);
        if (q.p >= 1) {
          q.st = 'ride'; q.phi = -TH.rotT; q.dy = L.mh * 0.18; TH.rotT += stepA;
          TH.atpAcc += 1;
          if (TH.atpAcc >= hA0) { TH.atpAcc -= hA0; var as = L.atpSlot(TH.atpSlot++); TH.atp.push({ x0: L.head.x - L.head.r * 0.7, y0: L.head.y - L.head.r * 0.1, x1: as.x, y1: as.y, t: 0, ang: rnd() * TAU }); }
          if (q.follow) setFollowH(1);
        }
        return true;
      }
      if (q.st === 'ride') {
        var ang = TH.rot + q.phi; q.dy *= Math.exp(-dt * 5);
        q.ang = ang; q.x = L.syn.x + Math.cos(ang) * rw0 * 0.92; q.y = L.mid + q.dy - Math.sin(ang) * 1.5;
        if (q.follow && !q.half && ang > Math.PI) { q.half = true; setFollowH(2); }
        if (ang >= TAU - stepA * 0.5) { q.st = 'out'; q.p = 0; q.x0 = q.x; q.y0 = q.y; q.x1 = lerp(L.syn.x + rw0 * 0.9, L.w - 10, rnd()); q.y1 = L.mt - L.h * (0.04 + rnd() * 0.12); if (q.follow) setFollowH(3); }
        return true;
      }
      q.p += dt / 0.8;
      var k2 = clamp(q.p, 0, 1);
      q.x = lerp(q.x0, q.x1, k2); q.y = lerp(q.y0, q.y1, 1 - (1 - k2) * (1 - k2));
      if (q.p >= 1) { if (q.follow) { setFollowH(4); TH.followH = null; } return false; }
      return true;
    });
    TH.rot += (TH.rotT - TH.rot) * Math.min(1, dt * 9);
    if (TH.sy.length > 60) TH.sy.splice(0, TH.sy.length - 60);
    /* photons */
    var bal = r.balance || {}, E2 = bal.psii || 0, E1 = bal.psi || 0, s = r.spectrum || { red: 1 };
    acc.p = (acc.p || 0) + (E2 + E1) * K_PH * dt;
    var nP = 0;
    while (acc.p >= 1 && nP < 6) {
      acc.p -= 1; nP++;
      var band = bandPick(s, r);
      var toPSI = band === 'farred' ? true : rnd() * (E2 + E1 - (r.photons ? r.photons.absorbedFR : 0)) > E2;
      var tx = toPSI ? L.ps1.x + (rnd() - 0.3) * L.ps1.w * 0.8 : (rnd() < 0.55 ? L.ant2.x : L.ps2.x) + (rnd() - 0.5) * L.ps2.w * 0.5;
      var ty = (toPSI ? L.mt - L.h * 0.05 : L.mt - L.h * 0.05) + rnd() * 6;
      var ang = (-0.35 + rnd() * 0.5);
      TH.ph.push({ x0: tx - Math.sin(ang) * L.h * 0.45, y0: -12, x1: tx, y1: ty, p: 0, band: band, toPSI: toPSI, dur: 0.7 + rnd() * 0.15 });
    }
    if (acc.p > 3) acc.p = 3;
    /* advance photons */
    TH.ph = TH.ph.filter(function (q) {
      q.p += dt / q.dur;
      if (q.p < 1) return true;
      var f = r.fate || {}, u = rnd(), kind;
      if (q.toPSI) kind = (r.Jused > 0 || r.cyclic > 0) ? 'chem' : 'heat';
      else kind = u < f.photochem ? 'chem' : (u < f.photochem + f.npq ? 'npq' : (u < f.photochem + f.npq + f.fluor ? 'fluo' : 'heat'));
      TH.fx.push({ x: q.x1, y: q.y1, kind: kind, t: 0, dur: kind === 'fluo' ? 1.0 : 0.8, ang: -Math.PI / 2 + (rnd() - 0.5) * 1.2 });
      return false;
    });
    TH.fx = TH.fx.filter(function (f) { f.t += dt; return f.t < f.dur; });
    /* advance electrons */
    TH.e = TH.e.filter(function (e) {
      e.d += e.v * dt;
      var pos = along(e.path, e.d);
      if (pos.seg !== e.seg) {
        e.seg = pos.seg;
        /* crossing b6f (Qo site): 2 protons from the stroma into the lumen (Q cycle accounting) */
        var b6seg = e.kind === 'lin' ? 4 : 5;
        if (e.seg === b6seg && !e.pb6f) {
          e.pb6f = true;
          for (var k = 0; k < 2; k++) spawnProtonTransit(L.b6f.x - L.b6f.w * 0.5 + rnd() * L.b6f.w, L.mt - L.h * (0.09 + 0.05 * rnd()), L.b6f.x + (rnd() - 0.5) * L.b6f.w * 0.8, L.mb + L.h * (0.06 + 0.06 * rnd()), 'pump', k * 0.15);
        }
        if (e.follow) setFollowStage(e.kind, e.seg);
      }
      if (e.d >= e.path.len) {
        if (e.kind === 'lin' && unc && TH.uncK > 0.5) {
          /* NADP+ is gone: the electron reduces O2 at the acceptor side of PSI (Mehler reaction) */
          TH.fx.push({ x: L.fd.x + 6, y: L.fd.y - 10, kind: 'mehler', t: 0, dur: 1.1, ang: rnd() * TAU });
        } else if (e.kind === 'lin') {
          TH.nadAcc += 1;
          if (TH.nadAcc >= 2) { TH.nadAcc -= 2; var ns = L.nadSlot(TH.nadSlot++); TH.nadph.push({ x0: L.fnr.x - L.fnr.w * 0.2, y0: L.fnr.y - L.h * 0.07, x1: ns.x, y1: ns.y, t: 0 }); }
        }
        if (e.follow) { setFollowStage(e.kind, 99); TH.follow = null; }
        return false;
      }
      e.x = pos.x; e.y = pos.y;
      return true;
    });
    /* water arriving at the Mn cluster: 2 protons into the lumen, an O2 every second water */
    TH.wat = TH.wat.filter(function (q) {
      q.p += dt / 1.6;
      if (q.p < 1) return true;
      for (var k = 0; k < 2; k++) spawnProtonTransit(L.oec.x, L.oec.y + 4, L.oec.x + (rnd() - 0.2) * L.w * 0.12, L.mb + L.h * (0.12 + rnd() * 0.25), 'water', k * 0.2);
      TH.waterAcc += 1;
      if (TH.waterAcc >= 2) { TH.waterAcc -= 2; TH.o2.push({ x: L.oec.x - 6, y: L.oec.y + 8, t: 0, ang: rnd() * TAU }); }
      return false;
    });
    TH.o2 = TH.o2.filter(function (o) { o.t += dt; o.x -= 18 * dt; o.y += 22 * dt; o.ang += dt; return o.t < 2.4; });
    /* proton transits */
    TH.h = TH.h.filter(function (q) {
      q.p += dt / q.dur;
      if (q.p < 1) return true;
      return false;   /* synthase protons now live in TH.sy (3 ATP per full turn: 14 protons per turn at 4.67, 12 at 4.0) */
    });
    /* products leave along an export lane toward the stroma above (Plate IV), fade out, at most 6 of each on screen */
    function glide(q) { var k = clamp(q.t / PROD_LIFE, 0, 1), e = 1 - Math.pow(1 - k, 2.2); q.x = lerp(q.x0, q.x1, e); q.y = lerp(q.y0, q.y1, e); }
    TH.atp = TH.atp.filter(function (a) { a.t += dt; a.ang += dt * 1.5; glide(a); return a.t < PROD_LIFE; });
    TH.nadph = TH.nadph.filter(function (n) { n.t += dt; glide(n); return n.t < PROD_LIFE; });
    if (TH.atp.length > 6) TH.atp.splice(0, TH.atp.length - 6);
    if (TH.nadph.length > 6) TH.nadph.splice(0, TH.nadph.length - 6);
    /* lumen pool size follows ΔpH (log scale) */
    var target = Math.round(clamp(Math.pow(10, Math.max(0, r.dpH || 0)), (r.hPlus > 0 && !unc) ? 2 : 1, 48));
    while (TH.pool.length < target) TH.pool.push({ x: L.w * (0.03 + 0.94 * rnd()), y: L.mb + L.h * 0.04 + rnd() * (L.h - L.mb - L.h * 0.07), vx: (rnd() - 0.5) * 14, vy: (rnd() - 0.5) * 14, a: 0 });
    if (TH.pool.length > target) TH.pool.forEach(function (q, i) { if (i >= target) q.dying = true; });
    TH.pool = TH.pool.filter(function (q) {
      q.a = q.dying ? q.a - dt * 1.5 : Math.min(1, q.a + dt * 1.2);
      q.vx += (rnd() - 0.5) * 30 * dt; q.vy += (rnd() - 0.5) * 30 * dt; q.vx *= 0.98; q.vy *= 0.98;
      q.x += q.vx * dt; q.y += q.vy * dt;
      var ylo = L.mb + L.h * 0.045, yhi = L.h - 8;
      if (q.x < 8 || q.x > L.w - 8) q.vx *= -1; if (q.y < ylo || q.y > yhi) q.vy *= -1;
      q.x = clamp(q.x, 8, L.w - 8); q.y = clamp(q.y, ylo, yhi);
      return q.a > 0;
    });
    if (!unc && r.hPlus > 0) TH.rotDrift = 0;
    /* safety caps */
    if (TH.e.length > 80) TH.e.splice(0, TH.e.length - 80);
    if (TH.h.length > 160) TH.h.splice(0, TH.h.length - 160);
  }

  function draw(c, w, h, t, dt, info) {
    if (!TH.lay || TH.lay.w !== w || TH.lay.h !== h) { TH.lay = layout(w, h); TH.e = []; TH.h = []; TH.ph = []; TH.fx = []; TH.pool = []; TH.wat = []; TH.o2 = []; TH.atp = []; TH.nadph = []; TH.sy = []; TH.adp = []; TH.nadp = []; TH.nm = {}; TH.followH = null; prewarm(4); }
    if (dt > 0) step(dt);
    var L = TH.lay, P = M.palette(info.dark), r = R(), tier = ui.tier(), mob = L.mob;
    M._rec = [];
    var cache = buildCache(L, P, info.dpr || 1, r);
    /* lumen colour follows its pH */
    var acid = clamp(((r.stromaPH || 7.9) - (r.lumenPH || 7.9)) / 2, 0, 1);
    var lg = c.createLinearGradient(0, L.mb, 0, h);
    lg.addColorStop(0, mix(P.lumen, P.lumenAcid, acid * 0.8)); lg.addColorStop(1, mix(P.lumen, P.lumenAcid, acid));
    c.fillStyle = lg; c.fillRect(0, L.mb - 2, w, h - L.mb + 2);
    /* glow tied to proton density: a warm amber halo that gathers toward the ATP synthase exit when the lumen is acid,
       nothing when it is near the stroma pH (designer panel 13) */
    if (acid > 0.05) {
      var gx = L.syn.x, gy = L.mb + (h - L.mb) * 0.35, gr = Math.max(w * 0.6, 220);
      var hg = c.createRadialGradient(gx, gy, 4, gx, gy, gr);
      var gc = P.dark ? '255,170,60' : '240,170,40';
      hg.addColorStop(0, 'rgba(' + gc + ',' + (P.dark ? 0.55 : 0.30) * acid + ')'); hg.addColorStop(0.6, 'rgba(' + gc + ',' + (P.dark ? 0.22 : 0.10) * acid + ')'); hg.addColorStop(1, 'rgba(' + gc + ',0)');
      c.save(); c.beginPath(); c.rect(0, L.mb, w, h - L.mb); c.clip(); c.fillStyle = hg; c.fillRect(0, L.mb, w, h - L.mb); c.restore();
    }
    c.drawImage(cache, 0, 0, w, h);

    /* fluorescence and NPQ glow on PSII */
    var fl = r.fluor || 0;
    if (fl > 0.03) {
      var gg = c.createRadialGradient(L.ps2.x, L.mid, 2, L.ps2.x, L.mid, L.ps2.w * 1.1);
      gg.addColorStop(0, 'rgba(255,60,60,' + clamp(fl * 3, 0, 0.55) + ')'); gg.addColorStop(1, 'rgba(255,60,60,0)');
      c.fillStyle = gg; c.fillRect(L.ps2.x - L.ps2.w * 1.2, L.mid - L.ps2.w * 1.2, L.ps2.w * 2.4, L.ps2.w * 2.4);
    }
    /* ATP synthase: c ring (rotating stripes), central stalk, head */
    drawSynthase(c, P, L, r);
    /* DCMU wedge at QB */
    if (r.dcmu) {
      var qx = L.lin[2][0], qy = L.lin[2][1];
      /* the jam: electrons queue on QA behind the herbicide, each new photon finds PSII closed */
      for (var qi = 0; qi < 4; qi++) M.electron(c, P, L.lin[1][0] - qi * 7, L.lin[1][1] + qi * 4 + Math.sin(t * 6 + qi) * 1.2, 4.4, 1 - qi * 0.18);
      if (!DRAG.on) M.pill(c, P, qx + 4, qy - 1, 'DCMU', P.block, 1, mob ? 8.5 : 9.5);
      if (tier > 1) M.tag(c, P, L.ps2.x, L.mb + L.h * (mob ? 0.2 : 0.18), mob ? 'Jammed at QB' : 'Jammed at QB: no electrons leave PSII', { size: mob ? 9 : 10.5, align: 'center', ink: P.block });
    }
    drawTray(c, P, L, r, tier);
    /* water and O2 */
    var NM = M.namer(c, P, w, h, mob ? 9.5 : 10.5, null);
    var wr = mob ? 4.1 : 5, or2 = mob ? 3.8 : 4.5;
    TH.wat.forEach(function (q) { var e = q.p * q.p * (3 - 2 * q.p); q.x = lerp(q.x0, L.oec.x, e); q.y = lerp(q.y0, L.oec.y + 6, e); M.water(c, P, q.x, q.y, wr, q.ang + q.p * 2, 1); NM.glyph(q.x, q.y, wr * 1.4, wr * 1.2, 'H₂O', q); });
    TH.o2.forEach(function (o) { M.o2(c, P, o.x, o.y, or2, o.ang, 1 - o.t / 2.4); NM.glyph(o.x, o.y, or2 * 1.6, or2 * 1.2, 'O₂', o); });
    nameSome('w', TH.wat, 1, function (q) { return q.p > 0.12 && q.p < 0.8; }).forEach(function (q) { NM.add(q.x, q.y, wr * 1.5, 'H₂O', 1, 5, q); });
    nameSome('o2', TH.o2, mob ? 1 : 2, function (o) { return o.t < 1.2; }).forEach(function (o) { NM.add(o.x, o.y, or2 * 1.4, 'O₂', 1 - o.t / 2.4, 6, o); });
    /* lumen pool */
    var hr = mob ? 5.2 : 6.4;
    TH.pool.forEach(function (q) { M.proton(c, P, q.x, q.y, hr * 0.92, q.a * 0.9); });
    nameSome('hp', TH.pool, mob ? 1 : 2, function (q) { return !q.dying && q.a > 0.9 && q.x > L.w * 0.22 && q.x < L.w * 0.72 && q.y < L.h - 40; }).forEach(function (q) { NM.add(q.x, q.y, hr * 0.92, 'H⁺', q.a * 0.95, 7); });
    /* protons on their way through the ATP synthase (front half of the ring, the stroma exit) */
    TH.sy.forEach(function (q) {
      if (q.x == null || (q.st === 'ride' && Math.sin(q.ang) < 0)) return;
      var a = q.st === 'out' ? (q.p > 0.7 ? (1 - q.p) / 0.3 : 1) : 1;
      if (TH.followH && !q.follow) a *= 0.4;   /* while one proton is followed the others step back */
      if (q.follow) { c.strokeStyle = P.dark ? '#fff2a8' : '#8a6400'; c.lineWidth = 2; c.globalAlpha = 0.95 * a; c.beginPath(); c.arc(q.x, q.y, hr + 4, 0, TAU); c.stroke(); c.globalAlpha = 1; NM.add(q.x, q.y, hr + 4, 'H⁺', a, 3); }
      M.proton(c, P, q.x, q.y, hr, a);
    });
    /* proton transits */
    TH.h.forEach(function (q) {
      if (q.p < 0) return;
      var e = q.p, x = lerp(q.x0, q.x1, e) + (q.kind === 'syn' ? Math.sin(e * Math.PI) * Math.sin(e * 6 + q.x0) * L.syn.w * 0.35 : 0), y = lerp(q.y0, q.y1, e), a = q.kind === 'syn' ? (q.p > 0.85 ? (1 - q.p) / 0.15 : 1) : (q.p > 0.8 ? 1 - (q.p - 0.8) / 0.2 * 0.6 : 1);
      if (q.kind === 'leak') { c.globalAlpha = 0.35; c.strokeStyle = P.Hp; c.lineWidth = 1; c.setLineDash([2, 3]); c.beginPath(); c.moveTo(q.x0, q.y0); c.lineTo(q.x1, q.y1); c.stroke(); c.setLineDash([]); c.globalAlpha = 1; }
      M.proton(c, P, x, y, hr, a);
    });
    /* electrons */
    TH.e.forEach(function (e) {
      if (e.x == null) return;
      if (r.dcmu && e.kind === 'cyc' && e.seg === 2 && !mob) M.tag(c, P, e.x + 8, e.y - 12, 'cyclic', { size: 9, alpha: 0.85 });
      if (e.follow) { c.strokeStyle = P.e; c.lineWidth = 2; c.globalAlpha = 0.9; c.beginPath(); c.arc(e.x, e.y, 10, 0, TAU); c.stroke(); c.globalAlpha = 1; }
      var pqStage = e.kind === 'lin' ? (e.seg === 2 || e.seg === 3) : (e.seg === 3 || e.seg === 4);
      if (pqStage) { c.fillStyle = P.pq; c.globalAlpha = 0.85; rrect(c, e.x - 8, e.y - 4.5, 16, 9, 4.5); c.fill(); c.globalAlpha = 1; }
      var pcStage = e.kind === 'lin' ? (e.seg === 5 || e.seg === 6) : (e.seg === 6 || e.seg === 7);
      if (pcStage) M.ball(c, e.x, e.y, 7, P.pc, shade(P.pc, 0.6), shade(P.pc, -0.4), 0.9);
      var fdStage = e.kind === 'lin' ? e.seg === 9 : (e.seg === 1 || e.seg === 2);
      if (fdStage) M.ball(c, e.x, e.y, 6.5, P.fd, shade(P.fd, 0.6), shade(P.fd, -0.4), 0.9);
      M.electron(c, P, e.x, e.y, e.follow ? 5.2 : 4.1);
    });
    var eN = TH.follow && TH.follow.x != null ? [TH.follow] : nameSome('e', TH.e, 1, function (e) { return e.x != null && e.kind === 'lin' && e.d < e.path.len * 0.5; });
    eN.forEach(function (e) { if (e.x != null) NM.add(e.x, e.y, e.follow ? 10 : 7, 'e⁻', 1, 4); });
    /* photons and their fates */
    TH.ph.forEach(function (q) { var b = BAND[q.band]; M.photon(c, q.x0, q.y0, q.x1, q.y1, q.p, P.dark ? b[2] : b[1], b[0] / 26, 0.95); });
    TH.fx.forEach(function (f) {
      var k = f.t / f.dur;
      if (f.kind === 'chem') { c.strokeStyle = P.e; c.globalAlpha = 1 - k; c.lineWidth = 2; c.beginPath(); c.arc(f.x, f.y, 3 + 10 * k, 0, TAU); c.stroke(); c.globalAlpha = 1; }
      else if (f.kind === 'npq') {
        c.strokeStyle = P.heat; c.globalAlpha = 1 - k; c.lineWidth = 1.8; c.beginPath();
        for (var s = 0; s <= 18; s += 1.5) { var yy = f.y - 4 - s - 22 * k, xx = f.x + Math.sin(s * 0.7 + k * 8) * 3; if (s === 0) c.moveTo(xx, yy); else c.lineTo(xx, yy); }
        c.stroke(); c.globalAlpha = 1;
      } else if (f.kind === 'fluo') {
        var d = 70 * k; M.photon(c, f.x, f.y, f.x + Math.cos(f.ang) * 90, f.y + Math.sin(f.ang) * 90, Math.min(1, k * 1.1), P.fluo, 685 / 26, 1 - k * 0.6, 1.6);
        void d;
      } else if (f.kind === 'mehler') {
        M.o2(c, P, f.x + 10 * k, f.y - 14 * k, mob ? 3.2 : 3.8, f.ang, 1 - k);
        if (k < 0.5) M.electron(c, P, f.x - 6 + 12 * k, f.y + 4 - 10 * k, 3, 1 - 2 * k);
      } else { c.fillStyle = P.dark ? 'rgba(255,170,120,.35)' : 'rgba(160,90,40,.25)'; c.globalAlpha = 1 - k; c.beginPath(); c.arc(f.x, f.y, 3 + 4 * k, 0, TAU); c.fill(); c.globalAlpha = 1; }
    });
    /* products */
    function pa(q) { return q.t < 0.15 ? q.t / 0.15 : 1 - Math.max(0, q.t - PROD_LIFE * 0.6) / (PROD_LIFE * 0.4); }
    var on = M.namesOn(), ar = mob ? 8 : 10.5, nr = mob ? 6 : 7.5;
    /* fix round (Q T1): an ATP is named once it has cleared the F1 head (no stack of names on the head), at most 3
       on phones (stable choice), all of them on desktop (6 at most on screen) */
    var atpN = nameSome('atp', TH.atp, mob ? 3 : 6, function (a) { return a.x != null && a.t > PROD_LIFE * 0.22; });
    TH.atp.forEach(function (a) { if (a.x == null) return; M.atp(c, P, a.x, a.y, ar, a.ang, pa(a), on); NM.glyph(a.x, a.y, ar, ar, 'ATP', a); if (atpN.indexOf(a) >= 0) NM.add(a.x, a.y, ar, 'ATP', pa(a), 0, a); });
    TH.nadph.forEach(function (n) { if (n.x == null) return; if (on) { M.nadph(c, P, n.x, n.y, nr, pa(n)); NM.glyph(n.x - nr * 0.05, n.y, nr * 1.5, nr * 0.8, 'NADPH', n); NM.add(n.x, n.y, nr * 0.75, 'NADPH', pa(n), 1, n); } else M.pill(c, P, n.x, n.y, 'NADPH', P.nadph, pa(n), mob ? 8 : 9); });
    /* arriving: ADP + Pᵢ into the head, NADP⁺ into FNR */
    function sm(k) { return k * k * (3 - 2 * k); }
    function fa(p) { return p < 0.12 ? p / 0.12 : (p > 0.85 ? Math.max(0, (1 - p) / 0.15) : 1); }
    var hx = L.head.x, hy = L.head.y, hrr = L.head.r;
    TH.adp.forEach(function (q) {
      var e = sm(q.p), x0, y0, x1, y1, px0, py0;
      if (mob) { x0 = hx + hrr * 0.55; y0 = L.h * 0.035 + q.j * 10; x1 = hx + hrr * 0.5; y1 = hy - hrr * 0.75; px0 = x0; py0 = y0 - 32; }
      else { x0 = L.w - 30 - q.j * 10; y0 = hy - hrr * 0.2 + (q.j - 0.5) * 14; x1 = hx + hrr * 0.7; y1 = hy - hrr * 0.2; px0 = Math.min(x0 + 18, L.w - 12); py0 = y0 + 12; }   /* Pᵢ starts inside the frame (Q T1) */
      var x = lerp(x0, x1, e), y = lerp(y0, y1, e), pxx = lerp(px0, x1 + (mob ? 0 : 8), e), pyy = lerp(py0, y1 + (mob ? -8 : 6), e), a = fa(q.p);
      M.adp(c, P, x, y, mob ? 6 : 7.5, q.ang, a); M.pi(c, P, pxx, pyy, mob ? 3.4 : 4, a);
      NM.glyph(x, y, mob ? 6 : 7.5, mob ? 6 : 7.5, 'ADP', q); NM.glyph(pxx, pyy, mob ? 3.4 : 4, mob ? 3.4 : 4, 'Pᵢ', q);
      NM.add(x, y, mob ? 6 : 7.5, 'ADP', a, 2, q); NM.add(pxx, pyy, mob ? 3.4 : 4, 'Pᵢ', a, 2, q);
    });
    TH.nadp.forEach(function (q) {
      var e = sm(q.p), x0 = L.fnr.x + L.fnr.w * 0.3 + q.j * 8, y0 = L.h * 0.025, x1 = L.fnr.x + L.fnr.w * 0.25, y1 = L.fnr.y - L.h * 0.06;
      var x = lerp(x0, x1, e), y = lerp(y0, y1, e), a = fa(q.p);
      M.nadph(c, P, x, y, nr, a, true); NM.glyph(x - nr * 0.05, y, nr * 1.5, nr * 0.8, 'NADP⁺', q); NM.add(x, y, nr * 0.75, 'NADP⁺', a, 2, q);
    });
    /* NADPH that the cycle cannot use (too little cyclic flow): a growing pile beside FNR */
    var pile = r.uncoupler ? Math.round(6 * clamp((TH.uncK || 0) * 1.5, 0, 1)) : Math.min(6, Math.round((r.nadphExcess || 0) / 1.5));
    var pw = mob ? 36 : 46, py = L.h * (mob ? 0.17 : 0.15);
    for (var pi = 0; pi < pile; pi++) M.pill(c, P, L.fnr.x - pi * pw, py + (pi % 2) * 5, 'NADPH', P.nadph, 0.95, mob ? 7.5 : 8.5);
    if (pile > 0 && tier > 1) M.tag(c, P, L.fnr.x + pw * 0.5, py - (mob ? 17 : 20), mob ? 'NADPH piles up' : (r.uncoupler ? 'NADPH piles up: no ATP to spend it' : 'NADPH piles up: not enough ATP'), { size: mob ? 9 : 10.5, align: 'right', ink: P.block });
    /* labels, then the molecule names (never over a label) */
    drawLabels(c, P, L, r, tier);
    NM.occ.push.apply(NM.occ, M._rec); M._rec = null;
    NM.flush();
  }
  /* stable choice of the named members of a swarm: keep naming the same particle until it leaves the list */
  function nameSome(key, list, max, ok) {
    var cur = (TH.nm[key] || []).filter(function (x) { return list.indexOf(x) >= 0; });
    for (var i = 0; i < list.length && cur.length < max; i++) if (cur.indexOf(list[i]) < 0 && ok(list[i])) cur.push(list[i]);
    TH.nm[key] = cur; return cur;
  }
  function mix(a, b, k) {
    var x = rgbOf(a), y = rgbOf(b); return 'rgb(' + x.map(function (v, i) { return Math.round(lerp(v, y[i], k)); }).join(',') + ')';
  }
  function drawSynthase(c, P, L, r) {
    var x = L.syn.x, w = L.syn.w, mt = L.mt, mb = L.mb, rot = TH.rot;
    /* c ring seen side on: 14 subunits around a cylinder, the front half visible, drifting with rotation */
    var y0 = mt + 3, y1 = mb - 3, rw = w * 0.5;
    var g = c.createLinearGradient(x - rw, 0, x + rw, 0);
    g.addColorStop(0, shade(P.syn, -0.45)); g.addColorStop(0.45, shade(P.syn, 0.35)); g.addColorStop(1, shade(P.syn, -0.45));
    c.fillStyle = g; rrect(c, x - rw, y0, rw * 2, y1 - y0, rw * 0.35); c.fill();
    c.strokeStyle = P.dark ? 'rgba(10,20,40,.7)' : 'rgba(30,40,70,.45)'; c.lineWidth = 1.2;
    for (var i = 0; i < 14; i++) {
      var a = rot + i * TAU / 14, cs = Math.cos(a);
      if (Math.sin(a) < 0) continue;            /* back half hidden */
      var xx = x + cs * rw * 0.92;
      c.beginPath(); c.moveTo(xx, y0 + 3); c.lineTo(xx, y1 - 3); c.stroke();
    }
    /* one c subunit marked orange (as in the hero) so the turning of the ring can be seen at any speed */
    var am = rot, sm = Math.sin(am);
    if (sm > 0.05) { var mx0 = x + Math.cos(am) * rw * 0.92, mx1 = x + Math.cos(am + TAU / 14) * rw * 0.92; c.fillStyle = P.dark ? 'rgba(255,179,71,.75)' : 'rgba(232,137,26,.6)'; c.fillRect(Math.min(mx0, mx1), y0 + 3, Math.max(2, Math.abs(mx1 - mx0)), y1 - y0 - 6); }
    /* protons riding the back half of the ring show faintly through it */
    TH.sy.forEach(function (q) { if (q.st === 'ride' && Math.sin(q.ang) < 0) M.proton(c, P, q.x, q.y, L.mob ? 4 : 4.8, q.follow ? 0.8 : (TH.followH ? 0.15 : 0.3)); });
    var fq = TH.followH; if (fq && fq.st === 'ride' && Math.sin(fq.ang) < 0) { c.save(); c.setLineDash([3, 3]); c.strokeStyle = P.dark ? '#fff2a8' : '#8a6400'; c.lineWidth = 1.6; c.beginPath(); c.arc(fq.x, fq.y, 9, 0, TAU); c.stroke(); c.restore(); }
    /* proton channel at the a subunit */
    c.fillStyle = P.dark ? 'rgba(255,216,74,.18)' : 'rgba(242,194,48,.22)'; rrect(c, x - 4, mt - 2, 8, mb - mt + 4, 4); c.fill();
    /* central stalk (γ) */
    var hy = L.head.y, hrr = L.head.r;
    c.fillStyle = shade(P.syn, -0.25); rrect(c, x - 3.5, hy, 7, mt - hy + 4, 3); c.fill();
    /* head: α3β3 hexamer drawn as six balls around the stalk; the γ cam shows rotation */
    for (var k = 0; k < 6; k++) {
      var aa = k * TAU / 6 - Math.PI / 2, bx = x + Math.cos(aa) * hrr * 0.62, by = hy + Math.sin(aa) * hrr * 0.42;
      var col = k % 2 ? P.synA : P.synB;
      M.ball(c, bx, by, hrr * 0.42, col, shade(col, 0.6), shade(col, -0.4));
    }
    var cam = rot * 1;
    M.ball(c, x + Math.cos(cam) * hrr * 0.22, hy + Math.sin(cam) * hrr * 0.14, hrr * 0.16, shade(P.syn, -0.35), shade(P.syn, 0.3), shade(P.syn, -0.6));
  }
  function drawLabels(c, P, L, r, tier) {
    var mob = L.mob, fs = mob ? 9.5 : 11, T = function (x, y, s, o) { return M.tag(c, P, x, y, s, Object.assign({ size: fs, align: 'center' }, o || {})); };
    var ty = L.mt - L.h * (mob ? 0.13 : 0.12);
    if (tier === 1) {
      T(L.ps2.x, ty, mob ? 'Water splitter' : 'Photosystem II: splits water');
      T(L.b6f.x, L.mt - L.h * 0.25, 'Proton pump');
      T(L.ps1.x, ty - (mob ? 18 : 0), mob ? 'Photosystem I' : 'Photosystem I: second push');
      if (mob) T(L.w - 4, L.mb + L.h * 0.08, 'ATP maker', { align: 'right' }); else T(L.head.x, L.head.y - L.head.r - 12, 'ATP synthase, a motor');
    } else {
      T(L.ps2.x, ty, mob ? 'PSII' : 'Photosystem II');
      T(L.b6f.x, L.mt - L.h * 0.25, mob ? 'Cyt b₆f' : 'Cytochrome b₆f');
      T(L.ps1.x, ty - (mob ? 16 : 0), mob ? 'PSI' : 'Photosystem I');
      if (mob) T(L.w - 4, L.mb + L.h * 0.08, 'ATP synthase', { align: 'right' }); else T(L.head.x, L.head.y - L.head.r - 12, 'ATP synthase');
      M.tag(c, P, mob ? L.w * 0.5 : (L.atpOut.x + L.nadOut.x) / 2, 15, mob ? '↑ to Plate IV' : '↑ ATP and NADPH go to the Calvin Benson cycle (Plate IV)', { size: fs - 0.5, align: 'center', alpha: 0.92 });
      if (!mob || tier === 3) {
        T(L.fnr.x + L.fnr.w * 0.6 + 4, L.fnr.y - L.h * 0.02, 'FNR', { align: 'left' });
        T(lerp(L.ps2.x, L.b6f.x, 0.55), L.mid + L.mh * 0.95, 'PQ', { size: fs - 1 });
        T(lerp(L.b6f.x, L.ps1.x, 0.5), L.mb + L.h * 0.115, 'PC', { size: fs - 1 });
        T(L.fd.x - 2, L.fd.y - 16, 'Fd', { size: fs - 1 });
      }
      if (tier === 3 && !mob) {
        T(L.oec.x, L.oec.y + L.h * 0.07, 'Mn₄CaO₅', { size: fs - 1 });
        T(L.ant2.x, L.mt - L.h * 0.07, 'LHCII', { size: fs - 1 });
        T(L.syn.x - L.syn.w * 0.75, L.mid, 'c₁₄ ring', { size: fs - 1, align: 'right' });
      }
    }
    /* compartments */
    var hiH = (r.stromaPH || 7.9) - (r.lumenPH || 7.9) > 0.5;
    var lab = tier === 1 ? ['STROMA' + (hiH ? ': few H⁺' : ''), 'INSIDE (LUMEN)' + (hiH ? ': many H⁺' : '')] : ['STROMA  pH ' + num(r.stromaPH, 1) + (hiH && !mob ? '  LOW H⁺' : ''), 'LUMEN  pH ' + num(r.lumenPH, 1) + (hiH && !mob ? '  HIGH H⁺' : '')];
    M.tag(c, P, 6, 15, lab[0], { size: mob ? 9 : 10.5, weight: 700, align: 'left', ink: P.ink2, alpha: 0.95 });
    M.tag(c, P, 6, L.h - 15, lab[1], { size: mob ? 9 : 10.5, weight: 700, align: 'left', ink: P.ink2, alpha: 0.95 });
    if (r.uncoupler) {
      M.tag(c, P, L.w - 8, L.mb + L.h * 0.2, mob ? 'Uncoupler: leaks' : 'Uncoupler: protons leak back', { size: fs, align: 'right', ink: P.block });
      var early = (TH.uncK || 0) < 0.5;
      M.tag(c, P, L.w - 8, L.mb + L.h * 0.2 + (mob ? 22 : 26), early ? (mob ? 'First seconds: e⁻ race' : 'First seconds: electrons race, no back pressure') : (mob ? 'NADP⁺ gone: e⁻ to O₂' : 'NADP⁺ used up: electrons trickle to O₂'), { size: fs - 0.5, align: 'right', ink: P.ink });
    }
  }
  /* ================================================================== DCMU tray: drag (mouse, pen) or tap (touch) the herbicide onto QB */
  var DRAG = { on: false, x: 0, y: 0, fly: -1 };
  function trayPos(L) { return { x: L.mob ? L.w * 0.13 : L.w * 0.27, y: L.h * (L.mob ? 0.2 : 0.075) }; }
  function drawTray(c, P, L, r, tier) {
    var tp = trayPos(L), q = L.lin[2], mob = L.mob;
    if (DRAG.fly >= 0) {                         /* tap: the pill flies to (or from) the pocket */
      var k = clamp(DRAG.fly, 0, 1), e = k * k * (3 - 2 * k), toQ = DRAG.flyTo === 'q';
      var a = toQ ? tp : { x: q[0] + 4, y: q[1] }, b = toQ ? { x: q[0] + 4, y: q[1] } : tp;
      M.pill(c, P, lerp(a.x, b.x, e), lerp(a.y, b.y, e) - Math.sin(Math.PI * e) * 30, 'DCMU', P.block, 1, mob ? 8.5 : 9.5);
      return;
    }
    if (DRAG.on) {
      c.save(); c.strokeStyle = P.block; c.setLineDash([3, 3]); c.lineWidth = 1.5; c.beginPath(); c.arc(q[0] + 4, q[1], 14, 0, TAU); c.stroke(); c.restore();
      M.pill(c, P, DRAG.x, DRAG.y, 'DCMU', P.block, 1, mob ? 9 : 10.5);
      return;
    }
    if (r.dcmu) { if (tier > 1 && !mob) M.tag(c, P, q[0] + 30, q[1] - 22, 'drag it out to wash it off', { size: 9.5, align: 'left', alpha: 0.85 }); return; }
    M.pill(c, P, tp.x, tp.y, 'DCMU', P.block, 1, mob ? 9 : 10.5);
    M.tag(c, P, tp.x + (mob ? 26 : 30), tp.y, mob ? 'tap me' : 'drag onto PSII: glow up or down?', { size: mob ? 9 : 10, align: 'left', alpha: 0.92 });
  }
  function hookDrag(cv) {
    function pt(ev) { var b = cv.getBoundingClientRect(); return { x: ev.clientX - b.left, y: ev.clientY - b.top }; }
    function near(a, b, d) { return Math.abs(a.x - b.x) < d && Math.abs(a.y - b.y) < d * 0.7; }
    function fly(to) {
      DRAG.fly = 0; DRAG.flyTo = to;
      var t0 = performance.now(), dur = ui.reducedMotion() ? 1 : 650;
      (function tick(now) { DRAG.fly = (now - t0) / dur; A1.redraw(); if (DRAG.fly < 1) requestAnimationFrame(tick); else { DRAG.fly = -1; LP.set({ dcmu: to === 'q', uncoupler: false }); A1.kick(); } })(t0);
    }
    cv.addEventListener('pointerdown', function (ev) {
      if (VIEW !== 'mem' || !TH.lay) return;
      var L = TH.lay, p = pt(ev), tp = trayPos(L), q = { x: L.lin[2][0] + 4, y: L.lin[2][1] };
      var onPill = LP.state.dcmu ? near(p, q, 22) : near(p, tp, 34);
      if (!onPill) return;
      DRAG.tapped = true;
      if (ev.pointerType === 'touch') { fly(LP.state.dcmu ? 'tray' : 'q'); return; }
      DRAG.on = true; DRAG.x = p.x; DRAG.y = p.y; DRAG.from = LP.state.dcmu ? 'q' : 'tray';
      try { cv.setPointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
      ev.preventDefault(); A1.redraw();
    });
    cv.addEventListener('pointermove', function (ev) {
      if (!DRAG.on) { if (TH.lay && VIEW === 'mem') { var L = TH.lay, p0 = pt(ev), tp0 = trayPos(L), q0 = { x: L.lin[2][0] + 4, y: L.lin[2][1] }; cv.style.cursor = (LP.state.dcmu ? near(p0, q0, 22) : near(p0, tp0, 34)) ? 'grab' : ''; } return; }
      var p = pt(ev); DRAG.x = p.x; DRAG.y = p.y; cv.style.cursor = 'grabbing'; A1.redraw();
    });
    function end(ev) {
      if (!DRAG.on) return; DRAG.on = false; cv.style.cursor = '';
      var L = TH.lay, p = pt(ev), q = { x: L.lin[2][0] + 4, y: L.lin[2][1] }, inPocket = near(p, q, 40);
      LP.set({ dcmu: inPocket, uncoupler: inPocket ? false : LP.state.uncoupler }); A1.kick(); A1.redraw();
    }
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
  }

  function prewarm(sec) { for (var i = 0, n = Math.round(sec / 0.05); i < n; i++) step(0.05); }

  /* follow an electron: words for each stage */
  var STAGES = {
    lin: [
      ['A photon excites P680, the special chlorophyll pair of PSII. It gives an electron to pheophytin; the hole is filled from water at the Mn₄CaO₅ cluster.', 'P680* → Pheo → QA: the electron drops from about −0.6 V to −0.5 V, then QA near −0.1 V (UNVERIFIED).'],
      ['QA passes the electron to QB, a plastoquinone in its pocket on the D1 protein. This is the step DCMU blocks.', 'QA⁻ → QB: two electrons and two protons from the stroma make PQH₂.'],
      ['Plastoquinol (PQH₂) diffuses through the membrane to cytochrome b₆f.', 'PQH₂ in the lipid core, the mobile pool between PSII and b₆f.'],
      ['At b₆f the Q cycle pushes protons into the lumen: about two per electron.', 'Qo site: PQH₂ oxidised, protons released to the lumen; half the electrons recycle through cytochrome b (Q cycle).'],
      ['Through b₆f to the lumen side: cytochrome f hands the electron on.', 'cyt f, about +0.37 V (UNVERIFIED).'],
      ['Plastocyanin, a small copper protein, carries the electron through the lumen to PSI.', 'PC, Cu²⁺/Cu⁺, about +0.37 V (UNVERIFIED).'],
      ['Plastocyanin docks on PSI.', 'PC → P700⁺.'],
      ['A second photon excites P700, the special pair of PSI, and the electron is pushed uphill again.', 'P700 about +0.46 V; P700* about −1.3 V (DERIVED).'],
      ['Iron sulphur clusters inside PSI pass the electron to the stromal side.', 'A₀, A₁, FX, FA, FB.'],
      ['Ferredoxin, a small iron sulphur protein in the stroma, takes the electron.', 'Fd about −0.42 V (UNVERIFIED).'],
      ['FNR collects two electrons from two ferredoxins and makes one NADPH.', 'NADP⁺ + 2 e⁻ + H⁺ → NADPH, −0.32 V at pH 7 (UNVERIFIED).']
    ],
    cyc: [
      ['A cyclic electron: PSI pushes it out to ferredoxin.', 'P700* → Fd.'],
      ['Instead of FNR, ferredoxin hands it back to the plastoquinone pool.', 'PGR5 and PGRL1 route (the NDH route also pumps protons).'],
      ['Back through b₆f: more protons pumped, more ATP, no NADPH.', 'Cyclic flow balances ATP and NADPH.']
    ]
  };
  function setFollowStage(kind, seg) {
    var el = document.getElementById('thy-follow-t'); if (!el) return;
    var t3 = ui.tier() === 3;
    if (seg === 99) { el.innerHTML = kind === 'lin' ? 'Done: this electron, with a partner, made one NADPH at FNR. Press again to follow another.' : 'Back at PSI, ready for another lap.'; return; }
    var list = STAGES[kind]; var idx = kind === 'lin' ? Math.min(list.length - 1, seg) : Math.min(list.length - 1, seg <= 2 ? 0 : (seg <= 4 ? 1 : 2));
    var s = list[idx]; el.innerHTML = esc(s[0]) + (t3 ? ' <span class="mono thy-small">' + esc(s[1]) + '</span>' : '');
  }

  /* follow one proton through the c ring (slow and named round): words for each stage */
  function setFollowH(k) {
    var el = document.getElementById('thy-follow-t'); if (!el) return;
    var n = Math.round(3 * ((R().hPerATP) || 14 / 3));
    el.innerHTML = [
      'This proton leaves the crowd in the lumen for the ATP synthase, the main way back to the stroma (a few protons leak through the membrane or leave through the KEA3 K⁺/H⁺ antiporter instead).',
      'It enters a half channel in subunit a and binds to one c subunit of the ring. Every proton that binds lets the ring turn one step.',
      'It rides the ring inside the membrane (faint while it is behind), carried round as more protons bind after it.',
      'Almost a full turn later it is back at subunit a and leaves through a second half channel into the stroma.',
      n === 14 ? 'Done: 14 protons like this one turn the ring once (one per c subunit), and the head makes 3 ATP per turn. Press again to follow another.'
        : 'Done: at ' + num(n / 3, 1) + ' H⁺ per ATP (the thermodynamic estimate) ' + n + ' protons make 3 ATP, as if the ring had ' + n + ' subunits. The drawn ring keeps the 14 subunits of the structure, so here each proton moves it 1/' + n + ' of a turn. Press again to follow another.'
    ][k];
  }

  /* ================================================================== Z scheme canvas */
  var ZS = [
    /* key, label, Em (V), badge */
    ['P680', 'P680', 1.21, 'VERIFIED'], ['P680s', 'P680*', -0.61, 'DERIVED'], ['Pheo', 'Pheo', -0.505, 'VERIFIED'], ['QA', 'QA', -0.11, 'UNVERIFIED'],
    ['PQ', 'PQ', 0.095, 'UNVERIFIED'], ['cytf', 'cyt f', 0.37, 'UNVERIFIED'], ['PC', 'PC', 0.37, 'UNVERIFIED'], ['P700', 'P700', 0.46, 'UNVERIFIED'],
    ['P700s', 'P700*', -1.31, 'DERIVED'], ['Fd', 'Fd', -0.42, 'UNVERIFIED'], ['NADP', 'NADPH', -0.32, 'UNVERIFIED']
  ];
  var ZX = [0.08, 0.10, 0.20, 0.28, 0.38, 0.48, 0.55, 0.63, 0.65, 0.78, 0.92];
  var ZT = { t: 0, b: 0 }, ZT1 = { t: 0, b: 0 };
  function drawZ(c, w, h, t, dt, info, zt) {
    zt = zt || ZT;
    var P = M.palette(info.dark), r = R(), tier = ui.tier(), mob = w < 560, zocc = [];
    var padL = mob ? 34 : 54, padR = 12, top = 18, bot = h - 26;
    function Y(v) { return lerp(top, bot, (v + 1.45) / (1.45 + 1.35)); }
    function X(f) { return padL + f * (w - padL - padR); }
    c.clearRect(0, 0, w, h);
    /* axis */
    c.strokeStyle = P.dark ? 'rgba(236,230,218,.25)' : 'rgba(42,35,28,.25)'; c.lineWidth = 1; c.font = (mob ? 9.5 : 11) + 'px system-ui,sans-serif'; c.fillStyle = P.ink2; c.textAlign = 'right'; c.textBaseline = 'middle';
    for (var v = -1.4; v <= 1.21; v += 0.2) {
      var yy = Y(v); c.globalAlpha = 0.5; c.beginPath(); c.moveTo(padL, yy); c.lineTo(w - padR, yy); c.stroke(); c.globalAlpha = 1;
      if (tier > 1) c.fillText((v < -0.001 ? MINUS : (v > 0.001 ? '+' : '')) + Math.abs(v).toFixed(1), padL - 5, yy);
    }
    c.save(); c.translate(11, (top + bot) / 2); c.rotate(-Math.PI / 2); c.textAlign = 'center'; c.fillText(tier > 1 ? 'Em, V (more negative = higher energy electrons)' : 'electron energy ↑', 0, 0); c.restore();
    /* negative Em (more reducing, higher energy) at the top */
    var pts = ZS.map(function (z, i) { return [X(ZX[i]), Y(z[2])]; });
    /* photon pushes */
    function push(i0, i1, lam) {
      var x0 = pts[i0][0], y0 = pts[i0][1], y1 = pts[i1][1];
      c.globalAlpha = 0.95; M.arrow(c, x0 - 10, y0, x0 - 10, y1 + 4, 3, lam < 690 ? '#e0312a' : '#a3203a', 0.9);
      c.fillStyle = P.ink; c.textAlign = 'left'; c.font = '600 ' + (mob ? 9.5 : 11) + 'px system-ui,sans-serif';
      var ly = lerp(y0, y1, 0.35);
      if (tier > 1) { c.fillText(lam + ' nm photon', x0 - 4, ly); var pw0 = c.measureText(lam + ' nm photon').width; zocc.push({ x: x0 - 4, y: ly - 8, w: pw0, h: tier === 3 ? 30 : 16 }); }
      if (tier === 3) { c.fillStyle = P.ink2; c.fillText((lam === 680 ? '1.82' : '1.77') + ' eV', x0 - 4, ly + 13); }
    }
    /* the Z path */
    var dcmuCut = r.dcmu ? 3 : 99;
    c.lineWidth = 2.5; c.strokeStyle = P.dark ? 'rgba(140,255,106,.55)' : 'rgba(63,154,42,.6)';
    c.beginPath(); c.moveTo(pts[1][0], pts[1][1]); for (var i = 2; i <= 7; i++) c.lineTo(pts[i][0], pts[i][1]); c.stroke();
    c.beginPath(); c.moveTo(pts[8][0], pts[8][1]); c.lineTo(pts[9][0], pts[9][1]); c.lineTo(pts[10][0], pts[10][1]); c.stroke();
    push(0, 1, 680); push(7, 8, 700);
    if (r.cyclic > 0.5 && tier > 1) {
      c.setLineDash([5, 4]); c.strokeStyle = P.dark ? 'rgba(104,184,255,.7)' : 'rgba(47,127,208,.7)'; c.lineWidth = 1.8;
      c.beginPath(); c.moveTo(pts[9][0], pts[9][1]); c.bezierCurveTo(pts[9][0] - 40, pts[9][1] - 50, pts[4][0] + 60, pts[4][1] - 90, pts[4][0] + 6, pts[4][1] - 4); c.stroke(); c.setLineDash([]);
      c.fillStyle = P.dark ? '#68b8ff' : '#2f7fd0'; c.textAlign = 'center'; c.font = '600 ' + (mob ? 9 : 10.5) + 'px system-ui,sans-serif';
      c.fillText('cyclic flow', lerp(pts[9][0], pts[4][0], 0.5), Math.min(pts[9][1], pts[4][1]) - 44);
    }
    if (r.dcmu) { var bx = lerp(pts[3][0], pts[4][0], 0.5), by = lerp(pts[3][1], pts[4][1], 0.5); c.strokeStyle = P.block; c.lineWidth = 3; c.beginPath(); c.moveTo(bx - 8, by - 8); c.lineTo(bx + 8, by + 8); c.moveTo(bx + 8, by - 8); c.lineTo(bx - 8, by + 8); c.stroke(); M.tag(c, P, bx + 10, by + 18, 'DCMU block', { size: mob ? 9 : 10.5, ink: P.block }); }
    /* nodes */
    ZS.forEach(function (z, i) {
      var x = pts[i][0], y = pts[i][1];
      var col = z[3] === 'VERIFIED' ? '#2f6b3a' : (z[3] === 'DERIVED' ? '#2b5fa4' : '#9a3b20');
      if (info.dark) col = z[3] === 'VERIFIED' ? '#8fd19e' : (z[3] === 'DERIVED' ? '#8fb8ff' : '#f0957a');
      M.ball(c, x, y, mob ? 4.5 : 5.5, col, shade(col.length === 7 ? col : '#888888', 0.5), shade(col.length === 7 ? col : '#888888', -0.4));
      if (tier === 1 && ['P680', 'P700', 'NADP', 'PQ'].indexOf(z[0]) < 0) return;
      var lbl = tier === 1 ? ({ P680: 'PSII (takes e⁻ from water)', P700: 'PSI', NADP: 'NADPH', PQ: 'proton pump (b₆f)' })[z[0]] : z[1];
      c.fillStyle = P.ink; c.font = '600 ' + (mob ? 9.5 : 11.5) + 'px system-ui,sans-serif'; c.textAlign = 'left'; c.textBaseline = 'middle';
      var lx = x + 8, ly = y + (i === 2 || i === 9 ? -10 : (i === 6 ? 12 : (tier === 1 && i === 4 ? 16 : 0)));
      if (i === 10) { c.textAlign = 'right'; lx = x - 8; ly = mob ? y + 14 : y - 12; }   /* keep NADPH inside the right edge (below its node on phones, clear of Fd) */
      c.fillText(lbl, lx, ly);
      var lw0 = c.measureText(lbl).width, lfs = mob ? 9.5 : 11.5; zocc.push({ x: c.textAlign === 'right' ? lx - lw0 : lx, y: ly - lfs * 0.7, w: lw0, h: lfs * 1.4 + (tier === 3 ? 14 : 0) });
      if (tier === 3) { c.fillStyle = P.ink2; c.font = (mob ? 8.5 : 10) + 'px system-ui,sans-serif'; c.fillText((z[2] < 0 ? MINUS : '+') + Math.abs(z[2]).toFixed(2) + ' V', lx, ly + (mob ? 11 : 13)); }
    });
    /* electrons riding the Z: count per second ∝ Jused, same K as the theatre */
    if (dt > 0) {
      zt.acc = (zt.acc || 0) + (r.Jused || 0) * K_E * dt;
      zt.list = zt.list || [];
      while (zt.acc >= 1) { zt.acc -= 1; zt.list.push({ p: 0 }); }
      zt.list.forEach(function (q) { q.p += dt / 3.0; });
      zt.list = zt.list.filter(function (q) { return q.p < 1; }).slice(-30);
    }
    if (info.reduce && r.Jused > 0 && !(zt.list && zt.list.length)) zt.list = [{ p: 0.15 }, { p: 0.45 }, { p: 0.75 }];
    if (!(r.Jused > 0)) zt.list = [];
    var seq = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    var acc = [0]; for (var k = 1; k < seq.length; k++) { var a = pts[seq[k - 1]], b = pts[seq[k]]; acc.push(acc[k - 1] + Math.hypot(b[0] - a[0], b[1] - a[1])); }
    (zt.list || []).forEach(function (q) {
      var d = q.p * acc[acc.length - 1];
      for (var k2 = 1; k2 < acc.length; k2++) if (d <= acc[k2]) {
        var f = (d - acc[k2 - 1]) / (acc[k2] - acc[k2 - 1] || 1), a = pts[seq[k2 - 1]], b = pts[seq[k2]];
        q.x = lerp(a[0], b[0], f); q.y = lerp(a[1], b[1], f);
        M.electron(c, P, q.x, q.y, 4.5); break;
      }
    });
    if (r.dcmu) M.electron(c, P, pts[3][0], pts[3][1], 4.5);
    /* one electron named as it rides the ladder (slow and named); never over a node label */
    var NMz = M.namer(c, P, w, h, mob ? 9.5 : 10.5, zocc);
    nameSome(zt === ZT1 ? 'z1' : 'z2', zt.list || [], 1, function (q) { return q.p > 0.03 && q.p < 0.6; }).forEach(function (q) { if (q.x != null) NMz.add(q.x, q.y, 5, 'e⁻', 1, 0); });
    NMz.flush();
  }

  /* ================================================================== photon fate chart (SVG) */
  var FATE_COL = { photochem: ['#3f9a2a', '#8cff6a'], npq: ['#d9661c', '#ff9a4d'], fluor: ['#c0262b', '#ff5a5a'], heat: ['#766750', '#9a948a'] };
  function fateSVG(res, boxW) {
    boxW = boxW > 40 ? boxW : 800;
    var mob = boxW < 560, dark = ui.isDark(), W = mob ? 400 : 640, H = mob ? 290 : 230, l = mob ? 40 : 46, rr = 14, t = 14, b = 34, f = mob ? 12.5 : 11.5;
    /* start at 5 µmol m⁻² s⁻¹: in dim light ΦPSII is near its maximum, not zero (PPFD 0 has no excitation to share) */
    var xs = [5, 12, 20, 30, 45, 65, 90, 120].concat(LP.range(160, 2000, 47));
    var pts = LP.curve('ppfd', xs);
    function X(v) { return l + (W - l - rr) * v / 2000; }
    function Y(v) { return t + (H - t - b) * (1 - v); }
    function path(key) { return pts.map(function (p, i) { var f = p.r.fate || {}; return (i ? 'L' : 'M') + X(p.x).toFixed(1) + ' ' + Y(f[key] || 0).toFixed(1); }).join(''); }
    var ink = dark ? '#b3aca0' : '#5e5141', grid = dark ? 'rgba(236,230,218,.14)' : 'rgba(42,35,28,.14)';
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Share of PSII excitation used for photochemistry, NPQ and fluorescence versus light" style="width:100%;height:auto;display:block">';
    [0, 0.25, 0.5, 0.75, 1].forEach(function (v) { s += '<line x1="' + l + '" x2="' + (W - rr) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="' + grid + '"/><text x="' + (l - 6) + '" y="' + (Y(v) + 4) + '" text-anchor="end" font-size="' + f + '" fill="' + ink + '" font-family="system-ui,sans-serif">' + Math.round(v * 100) + ' %</text>'; });
    (mob ? [0, 1000, 2000] : [0, 500, 1000, 1500, 2000]).forEach(function (v, i, A) { s += '<text x="' + X(v) + '" y="' + (H - b + 16) + '" text-anchor="' + (i === A.length - 1 ? 'end' : 'middle') + '" font-size="' + f + '" fill="' + ink + '" font-family="system-ui,sans-serif">' + (v >= 1000 ? v.toLocaleString('en-US') : v) + '</text>'; });
    s += '<text x="' + ((l + W) / 2) + '" y="' + (H - 3) + '" text-anchor="middle" font-size="' + f + '" fill="' + ink + '" font-family="system-ui,sans-serif">PPFD, µmol m⁻² s⁻¹</text>';
    ['photochem', 'npq', 'fluor'].forEach(function (k) { s += '<path d="' + path(k) + '" fill="none" stroke="' + FATE_COL[k][dark ? 1 : 0] + '" stroke-width="2.4"' + (k === 'fluor' ? ' stroke-dasharray="5 4"' : '') + '/>'; });
    var cur = res.fate || {}, cx = X(clamp(LP.state.ppfd, 0, 2000));
    s += '<line x1="' + cx + '" x2="' + cx + '" y1="' + t + '" y2="' + (H - b) + '" stroke="' + ink + '" stroke-dasharray="2 3"/>';
    ['photochem', 'npq', 'fluor'].forEach(function (k) { s += '<circle cx="' + cx + '" cy="' + Y(cur[k] || 0) + '" r="5" fill="' + FATE_COL[k][dark ? 1 : 0] + '" stroke="' + (dark ? '#0b1015' : '#fff') + '" stroke-width="1.5"/>'; });
    /* direct labels at the right end */
    var last = pts[pts.length - 1].r.fate || {};
    /* end labels pushed apart so they never sit on each other (at least 15 px) */
    var labs = [['photochem', 'photochemistry (ΦPSII)'], ['npq', 'NPQ heat'], ['fluor', mob ? 'fluorescence' : 'fluorescence (drawn as share)']].map(function (q) { return { k: q[0], t: q[1], y: Y(last[q[0]] || 0) - 8 }; });
    labs.sort(function (a, b) { return a.y - b.y; });
    for (var li = 1; li < labs.length; li++) if (labs[li].y - labs[li - 1].y < 15) labs[li].y = labs[li - 1].y + 15;
    var over = labs[labs.length - 1].y - (H - b - 4); if (over > 0) labs.forEach(function (q) { q.y -= over; });
    labs.forEach(function (q) { s += '<text x="' + (W - rr - 4) + '" y="' + q.y.toFixed(1) + '" text-anchor="end" font-size="' + (f + 0.5) + '" font-weight="600" fill="' + FATE_COL[q.k][dark ? 1 : 0] + '" stroke="' + (dark ? '#121a22' : '#fbf8f1') + '" stroke-width="4" paint-order="stroke" font-family="system-ui,sans-serif">' + q.t + '</text>'; });
    return s + '</svg>';
  }
  /* final fixer r9 (Q-visual R8 MAJOR 2): label ink per segment, whichever of near black or white contrasts more with the fill */
  function fateInk(hex) {
    var c = hex.replace('#', ''), ch = [0, 2, 4].map(function (i) { var v = parseInt(c.substr(i, 2), 16) / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    var L = 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2], dk = 0.0123;   /* #10200f */
    return (L + 0.05) / (dk + 0.05) >= 1.05 / (L + 0.05) ? '#10200f' : '#fff';
  }
  function fateBar(res) {
    var f = res.fate || {}, segs = [['photochem', 'photochemistry'], ['npq', 'NPQ'], ['fluor', 'fluorescence'], ['heat', 'other heat']], dark = ui.isDark();
    var tot = 0; segs.forEach(function (s) { tot += f[s[0]] || 0; });
    if (!(tot > 0)) return '<p class="cap">No light reaches PSII.</p>';
    return '<div class="thy-bar" role="img" aria-label="' + segs.map(function (s) { return s[1] + ' ' + Math.round(100 * (f[s[0]] || 0)) + ' %'; }).join(', ') + '">' +
      segs.map(function (s) { var v = (f[s[0]] || 0) / tot; return v > 0.005 ? '<span style="width:' + (100 * v).toFixed(1) + '%;background:' + FATE_COL[s[0]][dark ? 1 : 0] + ';color:' + fateInk(FATE_COL[s[0]][dark ? 1 : 0]) + '" title="' + s[1] + '">' + (v > 0.09 ? Math.round(100 * v) + ' %' : '') + '</span>' : ''; }).join('') + '</div>' +
      '<p class="thy-key">' + segs.map(function (s) { return '<span><i style="background:' + FATE_COL[s[0]][dark ? 1 : 0] + '"></i>' + s[1] + '</span>'; }).join('') + '</p>';
  }


  /* ================================================================== U7L (unifier r7): 3.3 photon sorter theatre
     Photons reach the PSII antenna at a rate set by the model's PSII excitation (res.balance.psii) and leave by one of four
     exits, each drawn with the shares of res.fate: an electron bead to the chain, NPQ heat at PsbS and zeaxanthin,
     a re-emitted red fluorescence photon, other heat. Drawing scale 1 photon per 40 µmol m⁻² s⁻¹ of PSII excitation (ILLUSTRATIVE). */
  var SO = { ph: [], out: [], tally: [], acc: 0, lay: null };
  var SO_SCALE = 40;
  function soShares(r) {
    var f = (r && r.fate) || {}, s = [['photochem', f.photochem || 0], ['npq', f.npq || 0], ['fluor', f.fluor || 0], ['heat', f.heat || 0]], t = 0;
    s.forEach(function (x) { t += x[1]; });
    return t > 0 ? s.map(function (x) { return [x[0], x[1] / t]; }) : null;
  }
  function soPick(sh) { var u = Math.random(), a = 0; for (var i = 0; i < sh.length; i++) { a += sh[i][1]; if (u <= a) return sh[i][0]; } return sh[sh.length - 1][0]; }
  function soColour(P) {
    var s = LP.state.spectrum || {}, u = Math.random() * ((s.blue || 0) + (s.green || 0) + (s.red || 0) + 0.3 * (s.farred || 0));
    if (u < (s.blue || 0)) return [P.dark ? '#6f9cff' : '#2f5fd0', 9];
    u -= s.blue || 0; if (u < (s.green || 0)) return [P.dark ? '#7fe36a' : '#3f9a2a', 11];
    u -= s.green || 0; if (u < (s.red || 0)) return [P.dark ? '#ff6a5a' : '#d2392b', 13];
    return [P.dark ? '#b2475a' : '#7a1f2e', 15];
  }
  function soLayout(w, h) {
    var mob = w < 560, my = h * (mob ? 0.60 : 0.58), mh = mob ? 34 : 40;
    var ax = w * (mob ? 0.36 : 0.32), aw = Math.min(w * 0.26, 190);
    return { mob: mob, my: my, mt: my - mh / 2, mb: my + mh / 2, ax: ax, aw: aw, at: my - mh / 2 - (mob ? 46 : 58), ab: my + mh / 2 + 10,
      rc: [ax + aw * 0.22, my], eEnd: [w - (mob ? 14 : 24), my], fEnd: [w * 0.02, h * 0.16], nEnd: [ax + aw * 0.55, h * 0.03], hEnd: [ax - aw * 0.1, h * 0.99] };
  }
  function soSpawnOut(kind, L) {
    var o = { k: kind, p: 0, wob: Math.random() * TAU };
    if (kind === 'photochem') { o.x0 = L.rc[0]; o.y0 = L.rc[1]; o.x1 = L.eEnd[0]; o.y1 = L.eEnd[1]; o.v = 0.45; }
    else if (kind === 'fluor') { o.x0 = L.ax - L.aw * 0.2; o.y0 = L.at + 10; o.x1 = L.fEnd[0] + Math.random() * 30; o.y1 = L.fEnd[1] + (Math.random() - 0.5) * 30; o.v = 0.9; }
    else if (kind === 'npq') { o.x0 = L.ax + L.aw * 0.18 + (Math.random() - 0.5) * 16; o.y0 = L.at + 6; o.x1 = L.nEnd[0] + (Math.random() - 0.5) * 50; o.y1 = L.nEnd[1] + 16; o.v = 0.55; }
    else { o.x0 = L.ax + (Math.random() - 0.5) * L.aw * 0.5; o.y0 = L.ab - 4; o.x1 = L.hEnd[0] + (Math.random() - 0.5) * 60; o.y1 = L.hEnd[1]; o.v = 0.5; }
    SO.out.push(o);
  }
  function soStep(dt, L, w, h, P) {
    var r = LP.result || {}, E2 = (r.balance && r.balance.psii) || 0, sh = soShares(r);
    if (sh && E2 > 0) {
      SO.acc += dt * Math.min(40, E2 / SO_SCALE);
      while (SO.acc >= 1) { SO.acc -= 1; var c = soColour(P); SO.ph.push({ x0: w * (0.06 + Math.random() * 0.4), y0: -10, p: 0, col: c[0], lam: c[1] }); }
    }
    SO.ph = SO.ph.filter(function (q) {
      q.p += dt * 1.1;
      if (q.p >= 1) { if (sh) { var k = soPick(sh); soSpawnOut(k, L); SO.tally.push(k); if (SO.tally.length > 100) SO.tally.shift(); } return false; }
      return true;
    });
    SO.out = SO.out.filter(function (o) { o.p += dt * o.v; return o.p < 1; });
    if (SO.out.length > 160) SO.out.splice(0, SO.out.length - 160);
  }
  function soPrewarm(L, w, h, P) {
    var r = LP.result || {}, sh = soShares(r);
    SO.ph = []; SO.out = []; SO.tally = [];
    if (!sh) return;
    for (var i = 0; i < 100; i++) SO.tally.push(soPick(sh));
    var E2 = (r.balance && r.balance.psii) || 0, n = Math.min(14, Math.round(E2 / SO_SCALE * 0.9));
    for (var j = 0; j < n; j++) { var c = soColour(P); SO.ph.push({ x0: w * (0.06 + Math.random() * 0.4), y0: -10, p: Math.random() * 0.95, col: c[0], lam: c[1] }); }
    for (var m = 0; m < Math.min(30, n * 2); m++) { soSpawnOut(soPick(sh), L); SO.out[SO.out.length - 1].p = Math.random() * 0.9; }
  }
  function drawSorter(c, w, h, t, dt, info) {
    var P = M.palette(info.dark), L = SO.lay && SO.lay.w === w && SO.lay.h === h ? SO.lay : (SO.lay = Object.assign(soLayout(w, h), { w: w, h: h }));
    var r = LP.result || {}, f = r.fate || {}, tier = ui.tier(), fs = L.mob ? 10.5 : 11.5;
    if (dt > 0) soStep(dt, L, w, h, P); else if (!SO.tally.length || info.reduce) soPrewarm(L, w, h, P);
    M._rec = [];
    /* stroma above, lumen below; the lumen warms with its acidity */
    c.fillStyle = P.stroma; c.fillRect(0, 0, w, L.mt);
    var acid = clamp((7.6 - (r.lumenPH || 7.5)) / 2, 0, 1);
    c.fillStyle = P.lumen; c.fillRect(0, L.mb, w, h - L.mb);
    c.globalAlpha = 0.55 * acid; c.fillStyle = P.lumenAcid; c.fillRect(0, L.mb, w, h - L.mb); c.globalAlpha = 1;
    M.bilayer(c, P, 0, w, L.mt, L.mb, [[L.ax - L.aw / 2, L.ax + L.aw / 2]]);
    /* antenna with the qE site glowing in proportion to the NPQ share */
    M.protein(c, P, L.ax, L.at, L.ab, L.aw, P.ant, { lobes: 4, glow: f.npq > 0.05 ? P.heat : null, glowBlur: 6 + 26 * (f.npq || 0) });
    var cx = L.ax + L.aw * 0.18, cy = L.at + 14, rq = 5 + 6 * (f.npq || 0);
    M.ball(c, cx, cy, rq, P.heat, '#fff2d0', M.shade(P.heat, -0.4), 0.35 + 0.65 * clamp((f.npq || 0) * 1.6, 0, 1));
    for (var k = 0; k < 9; k++) M.ball(c, L.ax - L.aw * 0.38 + (k % 3) * L.aw * 0.2, L.at + 18 + Math.floor(k / 3) * 14, 3.2, P.dark ? '#7fe36a' : '#3f9a2a', '#eaffe0', '#245a18', 0.85);
    M.ball(c, L.rc[0], L.rc[1], 7, P.psii, '#e0fff6', M.shade(P.psii, -0.5));
    /* outgoing */
    SO.out.forEach(function (o) {
      var x = lerp(o.x0, o.x1, o.p), y = lerp(o.y0, o.y1, o.p), a = o.p > 0.8 ? (1 - o.p) / 0.2 : 1;
      if (o.k === 'photochem') { o.nx = x; o.ny = y + Math.sin(o.p * 18 + o.wob) * 2; o.na = a; M.electron(c, P, o.nx, o.ny, 4.5, a); }
      else if (o.k === 'fluor') M.photon(c, o.x0, o.y0, o.x1, o.y1, o.p, P.fluo, 13, a, 2);
      else {
        var col = o.k === 'npq' ? P.heat : (P.dark ? '#9a948a' : '#8a7a62');
        c.globalAlpha = a * (o.k === 'npq' ? 0.95 : 0.7); c.strokeStyle = col; c.lineWidth = 2; c.lineCap = 'round'; c.beginPath();
        for (var s = 0; s <= 14; s++) { var yy = y - s * 1.6 * (o.k === 'npq' ? 1 : -1), xx = x + Math.sin(s * 0.9 + o.wob + t * 8) * 3; if (s) c.lineTo(xx, yy); else c.moveTo(xx, yy); }
        c.stroke(); c.globalAlpha = 1;
      }
    });
    /* incoming photons */
    SO.ph.forEach(function (q) { M.photon(c, q.x0, q.y0, L.ax - L.aw * 0.1 + (q.x0 % 20), L.at + 16, q.p, q.col, q.lam, 1, 2); });
    /* tally tags: last 100 photons that reached PSII */
    var n = { photochem: 0, npq: 0, fluor: 0, heat: 0 }; SO.tally.forEach(function (k) { n[k]++; });
    var tot = SO.tally.length || 1, pc = function (k) { return Math.round(100 * n[k] / tot); };
    var o1 = { size: fs };
    if (!SO.tally.length) M.tag(c, P, w / 2, h / 2, r.dcmu ? 'No light reaches PSII' : 'Dark: no photons reach PSII', { size: fs, align: 'center' });
    else {
      M.tag(c, P, L.eEnd[0], L.my - (L.mob ? 30 : 34), (tier === 1 ? 'electrons for sugar: ' : 'electrons to the chain: ') + pc('photochem'), { size: fs, align: 'right', ink: P.dark ? '#a9ff8f' : '#2c6e1d' });
      M.tag(c, P, Math.max(4, L.fEnd[0]), L.fEnd[1] + 34, 'fluorescence: ' + pc('fluor'), { size: fs, ink: P.dark ? '#ff8a8a' : '#a3161c' });
      M.tag(c, P, Math.min(w - 6, L.nEnd[0] + L.aw * 0.4), L.nEnd[1] + 14, (tier === 1 ? 'safe heat: ' : 'heat, NPQ: ') + pc('npq'), { size: fs, align: L.mob ? 'right' : 'left', ink: P.dark ? '#ffb27a' : '#9a4310' });
      M.tag(c, P, L.mob ? w - 6 : L.ax + L.aw * 0.55, h - 14, 'other heat: ' + pc('heat'), { size: fs, align: L.mob ? 'right' : 'left' });
      M.tag(c, P, 6, L.mob ? h - 14 : 14, (L.mob ? 'last ' : 'of the last ') + SO.tally.length + ' photons at PSII', { size: fs - 0.5, alpha: 0.95 });
      if (tier >= 2 && !L.mob) M.tag(c, P, L.ax - L.aw / 2 - 6, L.mb + 18, 'PSII antenna', { size: fs - 0.5, align: 'right' });
    }
    /* one electron named on its way to the chain (slow and named) */
    var NMs = M.namer(c, P, w, h, L.mob ? 9.5 : 10.5, M._rec); M._rec = null;
    nameSome('so', SO.out, 1, function (o) { return o.k === 'photochem' && o.p > 0.08 && o.p < 0.5; }).forEach(function (o) { if (o.nx != null) NMs.add(o.nx, o.ny, 5, 'e⁻', o.na, 0); });
    NMs.flush();
  }

  /* ================================================================== plate markup */
  var CSS =
    '#lv-thylakoid .thy-theatre{min-height:300px}' +
    '#lv-thylakoid .thy-view{margin:0 0 8px}#lv-thylakoid .thy-vl,#lv-thylakoid .lbl-s{font-family:var(--ui);font-size:13px;font-weight:600;color:var(--ink2);margin-right:4px}' +
    '#lv-thylakoid .lbl-s{margin:0 0 5px}#lv-thylakoid .thy-ctrls .ctl{border-right:0}#lv-thylakoid .ctl .thy-sw .chip{font-size:12.5px}' +
    '#lv-thylakoid .thy-ctrls{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,1fr);gap:10px 16px;align-items:start;margin:12px 0 0}' +
    '@media (max-width:700px){#lv-thylakoid .thy-ctrls{grid-template-columns:1fr}}' +
    '#lv-thylakoid .thy-sw{display:flex;flex-wrap:wrap;gap:6px;align-items:center}' +
    /* fix round (Q T5): Pause and its speed chip wrap as one unit, so the chip always sits beside Pause */
    '#lv-thylakoid .thy-pp{display:inline-flex;align-items:center;gap:6px;white-space:nowrap;flex:0 0 auto}#lv-thylakoid .thy-pp .ps-light{margin-left:0!important}' +
    '#lv-thylakoid .thy-sw .chip[aria-pressed="true"].thy-bad{background:#9a2a22;border-color:#9a2a22;color:#fff}' +
    '#lv-thylakoid .thy-follow{margin:10px 0 0;padding:8px 12px;border-left:3px solid #3f9a2a;background:var(--card);font-size:16px;min-height:2.6em}' +
    '#lv-thylakoid .thy-small{font-size:12.5px;color:var(--ink2)}' +
    '#lv-thylakoid .thy-bar{display:flex;height:30px;border:1px solid var(--rule);border-radius:3px;overflow:hidden;font-family:var(--ui);font-size:12px;font-weight:600}' +
    '#lv-thylakoid .thy-bar span{display:flex;align-items:center;justify-content:center;color:#fff;white-space:nowrap;overflow:hidden;transition:width .5s var(--ease)}' +
    '#lv-thylakoid .thy-key{display:flex;flex-wrap:wrap;gap:4px 14px;font-family:var(--ui);font-size:12.5px;color:var(--ink2);margin:6px 0 0}' +
    '#lv-thylakoid .thy-key i{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:5px;vertical-align:-1px}' +
    '#lv-thylakoid .thy-zbox{min-height:260px}' +
    '#lv-thylakoid .tile.thy-hot .v{color:var(--warm)}' +
    '#lv-thylakoid .thy-budget td.mono,#lv-thylakoid .thy-budget th{white-space:nowrap}' +
    '#lv-thylakoid .eq{font-family:var(--mono);font-size:13.5px;line-height:1.9;overflow-x:auto}' +
    '#lv-thylakoid .thy-legend{display:flex;flex-wrap:wrap;gap:4px 14px;font-family:var(--ui);font-size:12.5px;color:var(--ink2);margin:8px 0 0}' +
    '#lv-thylakoid .thy-legend i{display:inline-block;width:11px;height:11px;border-radius:50%;margin-right:5px;vertical-align:-1px}' +
    'html[data-class] #lv-thylakoid .thy-follow{font-size:21px}';

  function tile(id, k, unit, cls) { return '<div class="tile' + (cls ? ' ' + cls : '') + '" id="' + id + '"><div class="k">' + k + '</div><div class="v"><span class="n">0</span> <small>' + (unit || '') + '</small></div></div>'; }
  function row(q, v, b, key) { return '<tr><td>' + q + '</td><td class="mono">' + v + '</td><td>' + ui.badge(b) + ' ' + (key ? ui.ev(key, 'Source') : '') + '</td></tr>'; }
  var A1 = null, A2 = null, A3 = null, frBase = null, VIEW = 'mem';
  var A1LABEL = 'Thylakoid membrane: photons reach photosystem II and I, electrons flow along the chain, protons are pumped into the lumen and leave through the turning ATP synthase';

  function mount(el) {
    U();
    var EVb = ui.ev;
    var leg = function (col, t) { return '<span><i style="background:' + col + '"></i>' + t + '</span>'; };
    el.innerHTML = '<style>' + CSS + '</style>' +
      '<div class="thy-hero" id="thy-hero"></div>' +
      ui.now('<b>What is happening:</b> <span id="thy-now"></span>', 'thy-nowp') +

      /* 3.1 */
      '<figure class="fig lx-fig" id="thy-live"><div class="fighead"><h3>3.1 The membrane, live</h3><p>Light pushes electrons; electrons pump protons; protons turn a motor that makes ATP.</p></div>' +
      '<div class="thy-sw thy-view" role="group" aria-label="View"><span class="thy-vl">View</span><button type="button" class="chip" data-view="mem" aria-pressed="true">Membrane</button><button type="button" class="chip" data-view="z" aria-pressed="false">Energy ladder (Z scheme)</button></div>' +
      '<div class="lx-frame thy-theatre" id="thy-th"></div>' +
      '<div class="thy-legend" aria-hidden="true">' + leg('#3f9a2a', 'electron') + leg('#f2c230', 'proton, H⁺') + leg('#1d4aa5', 'water (blue)') + leg('#981b30', 'O₂ (crimson)') + leg('#e8891a', 'ATP') + leg('#1f9e93', 'NADPH') + '<span class="tier-2">' + '<i style="background:#d9661c"></i>heat (NPQ)</span><span class="tier-2"><i style="background:#d2232b"></i>fluorescence</span></div>' +
      '<div class="thy-ctrls">' +
      '<div><div class="ctl"><label for="thy-ppfd">Light on the leaf <output id="thy-ppfd-o"></output></label><input type="range" id="thy-ppfd" min="0" max="2000" step="10"><div class="hint">PPFD, the same slider as Conditions</div></div>' +
      '<div class="ctl tier-2"><label for="thy-fr">Add far red <output id="thy-fr-o"></output></label><input type="range" id="thy-fr" min="0" max="45" step="1"><div class="hint">share of 400 to 750 nm photons; PAR stays the same. One leaf absorbs little far red; a canopy of several leaf layers catches much more ' + EVb('thy.farredCanopy', 'Leaf vs canopy') + '</div></div>' +
      '<div class="ctl tier-2"><label for="thy-cyc">Cyclic flow <output id="thy-cyc-o"></output></label><input type="range" id="thy-cyc" min="0" max="200" step="5"><div class="hint">% of what the Calvin Benson cycle needs; 100 % is the leaf’s own balance ' + EVb('thy.cycForce', 'Model') + '</div></div>' +
      '</div>' +
      '<div><div class="thy-sw" role="group" aria-label="Experiments">' +
      '<button type="button" class="chip thy-bad" id="thy-dcmu" aria-pressed="false">DCMU herbicide</button>' +
      '<button type="button" class="chip thy-bad tier-2" id="thy-unc" aria-pressed="false">Uncoupler</button>' +
      '<button type="button" class="chip" id="thy-reset">Reset</button></div>' +
      '<div class="thy-sw" style="margin-top:8px"><button type="button" class="btn small" id="thy-followb">Follow one electron</button> <button type="button" class="btn small" id="thy-followh">Follow one proton</button> <span class="thy-pp"><button type="button" class="btn small" id="thy-pause" aria-pressed="false">Pause</button></span></div>' +
      '<div class="ctl"><span class="ctl-l lbl-s">Colour of the light <output id="thy-col-o"></output></span><div class="thy-sw" role="group" aria-label="Colour of the light">' +
      '<button type="button" class="chip" data-col="sun">Sunlight</button><button type="button" class="chip" data-col="rb">Red + blue LEDs</button><button type="button" class="chip" data-col="red">Red</button><button type="button" class="chip" data-col="blue">Blue</button><button type="button" class="chip" data-col="green">Green</button><button type="button" class="chip tier-2" data-col="fr">Far red only</button></div>' +
      '<div class="hint">shared with Plate I: mix any recipe there and it lands here</div></div>' +
      '<div class="ctl tier-3"><span class="ctl-l lbl-s">Protons per ATP <output id="thy-h-o"></output></span><div class="thy-sw" role="group" aria-label="Protons per ATP">' +
      '<button type="button" class="chip" data-hatp="4.6667">14/3 = 4.67 (c₁₄ ring, structure)</button><button type="button" class="chip" data-hatp="4">4.0 (thermodynamic)</button></div><div class="hint">see the open question below ' + EVb('thy.turina', 'Turina 2016') + '</div></div>' +
      '<div class="ctl tier-3"><span class="ctl-l lbl-s">NPQ, the leaf’s sunscreen</span><div class="thy-sw" role="group" aria-label="NPQ">' +
      '<button type="button" class="chip" data-npq="0">No PsbS (npq4)</button><button type="button" class="chip" data-npq="1">Normal</button><button type="button" class="chip" data-npq="1.5">Extra PsbS</button></div><div class="hint">' + EVb('thy.psbs', 'PsbS') + ' ' + EVb('thy.vpz', 'Faster NPQ in tobacco') + '</div></div>' +
      '</div>' +
      '</div>' +
      '<p class="thy-follow" id="thy-follow-t" aria-live="polite">Press <b>Follow one electron</b> and the next electron to leave PSII gets a ring and a running commentary.</p>' +
      '<figcaption class="cap" id="thy-cap"></figcaption>' +
      '<p class="cap lx-row">Every bead moves at a rate set by the model, on one scale for electrons and protons, so three protons enter the lumen for each electron that runs the whole chain. ' + EVb('thy.scale', 'Drawing scale') + ' ' + EVb('thy.rotor', 'Rotor') + ' ' + EVb('thy.lumenDraw', 'Lumen protons') + '</p>' +
      '<p class="cap lx-row tier-3">Drawn in one line for clarity: in a real chloroplast PSII and LHCII sit mostly in the stacked grana, PSI and the ATP synthase in the unstacked lamellae, and plastoquinone and plastocyanin diffuse between them. In the dark the rotor reads zero for a second reason: a redox switch in the γ subunit locks it, so the leaf does not burn ATP running the motor backwards. ' + EVb('thy.grana', 'Layout') + ' ' + EVb('thy.hahn', 'Redox lock') + '</p>' +
      '<p class="cap lx-row tier-2">Water is split at the Mn₄CaO₅ cluster of PSII: 2 H₂O give O₂, 4 H⁺ and 4 e⁻, so four photons at PSII per O₂. The O₂ you breathe was water in a leaf. ' + EVb('water_oxidation_stoich') + ' ' + EVb('psii_structure', 'PSII structure') + '</p>' +
      '</figure>' +

      '<div class="tiles lx-tiles" id="thy-tiles">' +
      tile('tt-etr', 'Electron transport, ETR', 'µmol m⁻² s⁻¹') +
      tile('tt-phi', 'PSII efficiency, ΦPSII', '', 'tier-2') +
      tile('tt-nadph', 'NADPH made', 'µmol m⁻² s⁻¹') +
      tile('tt-atp', 'ATP made', 'µmol m⁻² s⁻¹') +
      tile('tt-ratio', 'ATP per NADPH', 'needed by the cycle', 'tier-2') +
      tile('tt-cyc', 'Cyclic electron flow', 'µmol m⁻² s⁻¹', 'tier-2') +
      tile('tt-ph', 'Lumen pH', 'stroma 7.9', '') +
      tile('tt-pmf', 'Proton motive force', 'mV', 'tier-3') +
      tile('tt-rot', 'ATP synthase speed', 'turns s⁻¹ each', 'tier-2') +
      tile('tt-o2', 'O₂ released', 'µmol m⁻² s⁻¹', 'tier-2') +
      '</div>' +
      '<p class="cap lx-row tier-2">Linear flow alone gives 3 H⁺ per electron and 2 electrons per NADPH: 6 H⁺ ÷ 4.67 H⁺ per ATP = 1.29 ATP per NADPH. The Calvin Benson cycle needs 1.5, more with photorespiration. Cyclic flow around PSI pumps protons without making NADPH and closes the gap. ' + EVb('atp_nadph_supply') + ' ' + EVb('atp_nadph_demand') + ' ' + EVb('cyclic_flow') + '</p>' +
      '<p class="cap lx-row tier-3">ETR in the tile is the PAM style estimate, PPFD × ΦPSII × 0.84 × 0.5. It differs from the model’s own linear flow (<span id="thy-etrtrue"></span>) whenever the leaf does not absorb 84 % or does not send half its light to PSII. The model leaf adjusts that share so both photosystems keep up: <span id="thy-split"></span> now. ' + EVb('thy.etrConv', '0.84 and 0.5') + ' ' + EVb('thy.hoge2012', 'Split acclimates') + ' ' + EVb('eng.balance', 'Light split') + ' ' + EVb('eng.pmf', 'pmf model') + ' ' + EVb('lumen_ph', 'Lumen pH') + '</p>' +

      /* 3.2 */
      '<figure class="fig lx-fig" id="thy-z"><div class="fighead"><h3>3.2 Two pushes uphill: the Z scheme</h3><p>Each electron needs two photons. Height is energy: up is more reducing.</p></div>' +
      '<div class="lx-frame thy-zbox" id="thy-zc"></div>' +
      '<figcaption class="cap" id="thy-zcap"></figcaption>' +
      '<p class="cap lx-row tier-2">Hill and Bendall proposed two light reactions in series in 1960. Pheophytin sits at −0.505 V and P680 near +1.21 V, the strongest oxidant in biology, strong enough to pull electrons from water. Older figures show pheophytin near −0.61 V; the newer measurement is about 0.1 V more positive. ' + EVb('z_scheme_origin') + ' ' + EVb('em_pheo') + ' ' + EVb('thy.eStar', 'Excited states') + '</p>' +
      '<p class="cap lx-row tier-3">Node colours: green VERIFIED, blue DERIVED, red UNVERIFIED (textbook values for QA, PQ, cyt f, PC, P700, Fd and NADP⁺ not yet matched to a retrieved paper). ' + EVb('em_zscheme_other') + '</p>' +
      '</figure>' +

      /* 3.3 */
      '<figure class="fig lx-fig" id="thy-fate"><div class="fighead"><h3>3.3 Where the absorbed light goes</h3><p>In full sun most absorbed photons cannot be used. The leaf turns them into heat on purpose.</p></div>' +
      '<div class="lx-frame" id="thy-sort"></div>' +
      '<div class="chips" role="group" aria-label="Light on the leaf" style="margin:8px 0 10px"><span class="lab">Try the light:</span><button type="button" class="chip" data-sortppfd="100">Shade, 100</button><button type="button" class="chip" data-sortppfd="400">Fog, 400</button><button type="button" class="chip" data-sortppfd="1500">Full sun, 1,500</button><span class="thy-pp"><button type="button" class="btn small" id="thy-sortpause">Pause</button></span></div>' +
      '<p class="cap lx-row" id="thy-sortcap"></p>' +
      '<div id="thy-fbar"></div>' +
      '<div class="lx-frame tier-2" id="thy-fchart" style="padding:8px;margin-top:10px"></div>' +
      '<figcaption class="cap" id="thy-fcap"></figcaption>' +
      ui.reveal('Move the light from full sun (1,500 µmol m⁻² s⁻¹) down to deep shade (100). Of every 100 photons that reach PSII, which exit gains the most?', '<p id="thy-sortans">The model answers live below.</p>', { choices: [['The electron exit: in dim light most photons can be used', true, 'In dim light the chain keeps up, the lumen stays near neutral, NPQ stays off, and about three in four photons drive electrons in this model.'], ['Heat (NPQ): fewer photons means more protection', false, 'NPQ is switched on by an acid lumen, which needs a lot of light. In the shade it relaxes.'], ['Fluorescence: weak light makes chlorophyll glow', false, 'Fluorescence takes a few percent at most in both cases; it is a small exit that tells us about the others.']] }) +
      '<p class="cap lx-row tier-2">NPQ switches on when the lumen turns acid: PsbS senses the protons and the xanthophyll cycle makes zeaxanthin, which dumps excitation as heat. So the same proton gradient that makes ATP also sets the leaf’s sunscreen. ' + EVb('npq') + ' ' + EVb('pmf_components', 'pmf, ΔpH and Δψ') + ' ' + EVb('thy.fate', 'Split rule') + '</p>' +
      '</figure>' +

      /* 3.4 */
      '<figure class="fig lx-fig tier-2" id="thy-budget"><div class="fighead"><h3>3.4 What one CO₂ costs</h3><p>From photons to the sugar backbone, at the conditions above.</p></div>' +
      '<div class="lx-tw"><table class="lx-tab thy-budget"><thead><tr><th>Per CO₂ fixed</th><th>Theory, no photorespiration</th><th>This leaf now</th><th>Status</th></tr></thead><tbody id="thy-btab"></tbody></table></div>' +
      '<p class="cap lx-row">Eight photons per CO₂ is the floor (two photosystems × four electrons for two NADPH), a quantum yield of 0.125. Real C3 leaves at 30 °C in normal air of the 1970s reach about 0.052, about 19 photons per CO₂: photorespiration, cyclic flow and losses take the rest. The last row compares like with like: the model leaf at 30 °C with Ci 230 µmol mol⁻¹ (0.7 of about 330 ppm air, ILLUSTRATIVE). ' + EVb('max_quantum_yield') + ' ' + EVb('quantum_yield_c3_c4') + '</p>' +
      '</figure>' +

      /* cases */
      '<section class="lx-cases" aria-label="Real cases"><h3 class="lx-h3">Real cases to think with</h3><div class="lx-cardgrid">' +
      '<div class="card lx-case"><p class="lx-ck">A herbicide on a field edge</p><p>Diuron, sold for weeds along ditches and orchard rows, is DCMU. It sits in the QB pocket of PSII, so electrons stop at QA. The leaf still absorbs light, so the energy comes back out as fluorescence and as damaging excited chlorophyll. ' + EVb('dcmu') + '</p><p><button type="button" class="btn small" data-thy="dcmu">Spray DCMU</button></p></div>' +
      '<div class="card lx-case"><p class="lx-ck">Noon on a Salinas lettuce bed</p><p>At 1,800 µmol m⁻² s⁻¹ on a clear afternoon, PSII can use only a small share of what it absorbs. Watch the bar in 3.3: most excitation leaves as NPQ heat, which protects PSII from damage. In the morning fog the same leaf uses most of its light. ' + EVb('npq') + '</p><p><button type="button" class="btn small" data-thy="noon">Clear noon</button> <button type="button" class="btn small" data-thy="fog">Morning fog</button></p></div>' +
      '<div class="card lx-case tier-2"><p class="lx-ck">Far red feeds photosystem I</p><p>Far red photons excite PSI but hardly PSII. PSI must power both linear and cyclic flow, so under red and blue LEDs the leaf sends more of its light to PSI to keep up (only about 47 % reaches PSII in this model). Add far red and PSI gets photons of its own, PSII can take a bigger share, and linear flow rises a few percent, then levels off: the Emerson enhancement, and one reason growers add far red. The jump is larger right after the light changes, before the leaf has rebalanced its photosystems. In lettuce under far red, most of the extra growth came from bigger leaves catching more light (shade avoidance), while photosynthesis per leaf area did not change. ' + EVb('emerson_enhancement') + ' ' + EVb('farred_equal_efficiency') + ' ' + EVb('farred_lettuce_vertical_farm', 'Lettuce: bigger leaves') + '</p><p><button type="button" class="btn small" data-thy="leds">Red and blue LEDs</button> <button type="button" class="btn small" data-thy="ledsfr">Add 20 % far red</button></p></div>' +
      '<div class="card lx-case tier-2"><p class="lx-ck">Mutants that teach</p><p>An Arabidopsis plant without PsbS (npq4) harvests light normally but cannot turn excess light into heat. A plant without PGR5 loses most of the main cyclic route; in this model that leaf runs short of ATP in strong light ' + ui.badge('UNVERIFIED') + ' (the pgr5 mutant paper was not retrieved this run). Try each and watch the tiles: what changes, and what stays the same? ' + EVb('thy.psbs', 'PsbS') + ' ' + EVb('cyclic_flow', 'Cyclic flow') + '</p><p><button type="button" class="btn small" data-thy="nopsbs">No PsbS in full sun</button> <button type="button" class="btn small" data-thy="pgr5">Almost no cyclic flow</button></p></div>' +
      '<div class="card lx-case tier-3"><p class="lx-ck">Two cyclic routes</p><p>The main cyclic route (PGR5 and PGRL1) moves protons only through the Q cycle. The NDH complex also pumps about 2 H⁺ per electron itself, so the same cyclic electron makes about twice the ATP. Which route a leaf uses changes with stress. ' + EVb('ndh_proton_pump') + ' ' + EVb('cyclic_flow') + '</p></div>' +
      '</div></section>' +

      /* expert */
      '<section class="tier-3 lx-expert" aria-label="Expert"><h3 class="lx-h3">Equations and constants</h3>' +
      '<div class="card eq">ETR = PPFD × ΦPSII × a × f<sub>PSII</sub>   with a = 0.84, f<sub>PSII</sub> = 0.5 by convention; ΦPSII from Genty et al. (1989)<br>' +
      'ΦPSII = (F<sub>m</sub>′ − F<sub>s</sub>) / F<sub>m</sub>′    NPQ = (F<sub>m</sub> − F<sub>m</sub>′) / F<sub>m</sub>′<br>' +
      'J: θ J² − (I<sub>2</sub> + J<sub>max</sub>) J + I<sub>2</sub> J<sub>max</sub> = 0,  θ = 0.8,  I<sub>2</sub> = min(Φ<sub>PSII,max</sub> E<sub>PSII</sub>, Φ<sub>PSI</sub> E<sub>PSI</sub> / (1 + c))<br>' +
      'E<sub>PSII</sub> = s a<sub>q</sub> PAR,  E<sub>PSI</sub> = (1 − s) a<sub>q</sub> PAR + a<sub>FR</sub> FR,  s = Φ<sub>PSI</sub> (a<sub>q</sub>PAR + a<sub>FR</sub>FR) / (a<sub>q</sub>PAR (Φ<sub>PSII,max</sub>(1 + c) + Φ<sub>PSI</sub>)), clamped 0.40 to 0.55<br>' +
      'c = cyclic e⁻ per linear e⁻ = (½ r − 3 / h) × h / 2,  r = (3 + 3.5 φ) / (2 + 2 φ),  φ = 2Γ* / C<sub>i</sub>,  h = H⁺ per ATP<br>' +
      'H⁺ into lumen = 3 J<sub>linear</sub> + 2 J<sub>cyclic</sub>   ATP = H⁺ / h   NADPH = J<sub>linear</sub> / 2   O₂ = J<sub>linear</sub> / 4<br>' +
      'rotor turns per enzyme = ATP / 3 / [ATP synthase]   ΔpH = 0.6 pmf / (2.303 RT/F)   E(P*) = E<sub>m</sub>(P) − hc/λ<br>' +
      'qE share = [1 + 10<sup>(pH<sub>lumen</sub> − 6.8)</sup>]⁻¹ × [1 + 10<sup>4 (pH<sub>lumen</sub> − 6.8)</sup>]⁻¹  (PsbS × zeaxanthin; pKa and Hill numbers from Takizawa et al. 2007)<br>' +
      'uncoupled: J at first up to 1.6 J<sub>max</sub>; then J = 0.15 J<sub>coupled</sub> to O₂, NADPH made = 0, ATP = 0  (ILLUSTRATIVE)</div>' +
      '<div class="lx-tw"><table class="lx-tab"><thead><tr><th>Quantity</th><th>Value</th><th>Status</th></tr></thead><tbody>' +
      row('Fv/Fm, ΦPSII,max', '0.80 (0.76 under red only)', 'VERIFIED', 'blue_dose_quantum_yield') +
      row('ΦPSII = (Fm′ − Fs)/Fm′ and its link to ΦCO₂', 'Genty et al. 1989', 'VERIFIED', 'etr_equation') +
      row('Absorptance 0.84 and PSII share 0.5 in the ETR equation', 'conventions', 'UNVERIFIED', 'thy.etrConv') +
      row('Absorptance in the engine', '0.84 PAR, 0.30 far red', 'ILLUSTRATIVE', 'eng.abs') +
      row('PSII share of absorbed PAR (acclimated)', 's = 0.40 to 0.55; sunlight about 0.50, red + blue about 0.47', 'ILLUSTRATIVE', 'thy.hoge2012') +
      row('PSI photochemical yield', '0.95', 'ILLUSTRATIVE', 'eng.balance') +
      row('H⁺ per linear electron (water + Q cycle), steady state', '3', 'VERIFIED', 'thy.sacksteder') +
      row('H⁺ per cyclic electron (PGR5 route)', '2 (NDH adds about 2)', 'VERIFIED', 'ndh_proton_pump') +
      row('c ring, structural H⁺ per ATP', '14, 14/3 = 4.67', 'VERIFIED', 'thy.turina') +
      row('Thermodynamic H⁺ per ATP (proteoliposomes)', '4.0 ± 0.1', 'VERIFIED', 'thy.turina') +
      row('ATP synthase per leaf area', '0.5 µmol m⁻²', 'ILLUSTRATIVE', 'eng.synthase') +
      row('pmf and its ΔpH share', 'saturating, 60 %', 'ILLUSTRATIVE', 'eng.pmf') +
      row('Lumen pH in vivo (Arabidopsis)', 'about 7.5 in weak light to about 5.7 at low CO₂ and strong light, ± 0.5', 'VERIFIED', 'lumen_ph') +
      row('qE switch: PsbS and zeaxanthin', 'pKa about 6.8; Hill about 1 and 4', 'VERIFIED', 'psbs_zea_pka') +
      row('Uncoupled leaf: electrons to O₂ and other sinks', '15 % of coupled flow', 'ILLUSTRATIVE', 'eng.unc') +
      row('Pheophytin Em; P680', '−0.505 V; about +1.21 V', 'VERIFIED', 'em_pheo') +
      row('QA, PQ, cyt f, PC, P700, Fd, NADP⁺', 'textbook values', 'UNVERIFIED', 'em_zscheme_other') +
      row('θ, curvature of J', '0.8', 'ILLUSTRATIVE', 'eng.theta') +
      '</tbody></table></div>' +
      '<div class="card lx-open"><p class="lx-ck">' + ui.badge('OPEN QUESTION') + ' How acid does the lumen get in a working leaf?</p><p>Isolated thylakoids can be driven far more acid, yet in intact Arabidopsis leaves the lumen ranged only from about 7.5 in weak light to about 5.7 at low CO₂ and strong light, within about 0.5 units, and the share of the proton motive force held as a voltage (Δψ) varied from 0.1 to 0.7. The qE switch (PsbS, pKa about 6.8) sits right inside that range. How the leaf sets that split with K⁺ and Cl⁻ channels decides how fast NPQ switches on and how much damage a passing cloud does. What would you measure to settle it in lettuce? ' + EVb('pmf_components') + ' ' + EVb('lumen_ph') + '</p></div>' +
      '<div class="card lx-open"><p class="lx-ck">' + ui.badge('OPEN QUESTION') + ' Is PAM ETR the electron flow that feeds Rubisco?</p><p>The ETR equation assumes 84 % absorptance and a 50:50 split, and it sees mostly the cells near the surface. In thick leaves fluorescence from the top cells can over or underestimate the whole leaf. ETR also counts electrons that go to photorespiration, nitrate and oxygen. When ETR / 4 is much larger than gross CO₂ fixation, where did the extra electrons go? ' + EVb('etr_gradient_caveat') + ' ' + EVb('etr_equation') + '</p></div>' +
      '<div class="card lx-open"><p class="lx-ck">' + ui.badge('OPEN QUESTION') + ' How many protons does one ATP cost?</p><p>The c ring of the chloroplast enzyme has 14 subunits and the head 3 catalytic sites, so structure says 14/3 = 4.67 H⁺ per ATP. Thermodynamic measurements on the same enzyme say 4.0 ± 0.1; the authors read the gap as protons used to activate the enzyme or slipping through it. The choice matters for the whole budget: at 4.67 linear flow gives 1.29 ATP per NADPH and the default leaf needs about <span id="thy-oq-c47"></span> µmol m⁻² s⁻¹ of cyclic flow; at 4.0 linear flow gives 1.50, exactly the Calvin Benson need without photorespiration, and the cyclic need falls to about <span id="thy-oq-c40"></span>. Flip the <b>Protons per ATP</b> chips above and watch the cyclic tile. Which number sets ATP per proton in a working leaf? ' + EVb('thy.turina') + ' ' + EVb('c_ring_14', 'c ring') + '</p></div>' +
      ui.design({ title: 'far red and electron flow in lettuce', question: 'Does far red added under red and blue LEDs raise linear electron flow in lettuce, and does PAM ETR see it?',
        treat: 'Red and blue LEDs (10 % blue) at 300 µmol m⁻² s⁻¹ PPFD, with and without about 50 µmol m⁻² s⁻¹ far red (700 to 750 nm). Same leaves measured in both lights, order randomised.',
        measure: 'ETR by PAM and gross CO₂ uptake (A + Rd) by gas exchange at 2 % O₂, so photorespiration does not hide the electrons; leaf absorptance over 400 to 750 nm.',
        howto: ['thy.pam', 'leaf.sphere', 'leaf.lrc'], n: 'Plants are the replicates: 6 plants, one young fully expanded leaf each, in 2 growth chambers (chamber as a block).',
        expect: 'The model predicts linear flow +<span id="thy-de-lin"></span> % with far red while PAM ETR changes by <span id="thy-de-etr"></span> % ' + ui.badge('DERIVED') + ' (this page’s engine; the leaf absorptance for far red is ILLUSTRATIVE).',
        confound: 'Far red changes absorptance and the PSII : PSI split, and the PPFD sensor cannot see it: measure absorbed photons over 400 to 750 nm, or the ETR difference will be an artefact of the equation.' }) +
      ui.howto('thy.pam') + ui.howto('thy.ecs') +
      '</section>' +

      /* questions */
      '<section class="lx-qs" aria-label="Questions"><h3 class="lx-h3">Check yourself</h3>' +
      ui.reveal('You spray DCMU on a leaf in bright light. Predict what happens to chlorophyll fluorescence, to O₂ release and to NADPH, then drag the <b>DCMU</b> pill onto PSII (or press <b>DCMU herbicide</b>).',
        '<p>Fluorescence rises, O₂ release and NADPH fall to zero. Electrons cannot leave QA, so PSII reaction centres stay closed; absorbed energy that cannot do chemistry leaves as fluorescence and heat. Without the acid lumen that linear flow makes, NPQ also weakens, so the leaf is less protected. A little cyclic flow around PSI can still make some ATP.</p>', { choices: [
          ['Fluorescence up, O₂ and NADPH to zero', true, 'Electrons cannot leave QA, so the absorbed energy comes back out as fluorescence and heat.'],
          ['Fluorescence down, O₂ and NADPH unchanged', false, 'DCMU does not stop light absorption; it stops electrons leaving PSII, so the leaf glows more, and nothing reaches NADP⁺.'],
          ['Everything stops, including absorption', false, 'Chlorophyll still absorbs. That is why the unused energy has to go somewhere: fluorescence and heat.']] }) +
      '<div class="tier-2">' + ui.reveal('An uncoupler lets protons leak across the thylakoid membrane. Does electron transport speed up or slow down, and what happens to ATP and to CO₂ fixation?',
        '<p>At first electron transport speeds up, because the back pressure of the proton gradient is gone (photosynthetic control is released). That is the classic result in isolated thylakoids given an artificial electron acceptor. ATP synthesis stops, because no gradient drives the motor, and without ATP the Calvin Benson cycle stops, so CO₂ fixation falls to zero. In a leaf the NADPH is then no longer used, NADP⁺ runs out within seconds, and electron flow falls back to the little that O₂ and other sinks can take. Try it with the <b>Uncoupler</b> button and watch the first seconds.</p>', { choices: [
          ['Electrons speed up for a moment, ATP stops', true, 'The gradient no longer pushes back, but nothing drives the motor. In a leaf the speed up lasts seconds.'],
          ['Electrons stop, ATP keeps going', false, 'The chain is not blocked; the protons leak back without passing the motor, so ATP stops.'],
          ['Both speed up', false, 'Pumping faster is useless when the protons leak back around the motor.']] }) + '</div>' +
      '<div class="tier-2">' + ui.reveal('Count it: how many protons must pass the ATP synthase to make the 9 ATP that one G3P needs, and how many turns of the c ring is that?',
        '<p>9 ATP × 14/3 H⁺ per ATP = 42 protons. One full turn of the c₁₄ ring passes 14 H⁺ and makes 3 ATP, so 9 ATP need 3 turns. With 3 H⁺ per linear electron, 42 protons need 14 electrons, but the 6 NADPH need only 12, which is why cyclic flow tops up the protons.</p>', { choices: [
          ['42 protons, 3 turns', true, '14 H⁺ per turn makes 3 ATP; 9 ATP is 3 turns.'],
          ['42 protons, 9 turns', false, 'One turn already makes 3 ATP, so 9 ATP need only 3 turns of 14 protons.'],
          ['27 protons, 9 turns', false, 'That uses 3 H⁺ per ATP. The c₁₄ ring needs 14 protons for 3 ATP, 4.67 each.']] }) + '</div>' +
      '<div class="tier-3">' + ui.reveal('With red and blue LEDs at 300 µmol m⁻² s⁻¹, you add far red that the PPFD sensor cannot see. The model says ETR (PAM) rises less than the true linear flow. Why would a PAM fluorometer underestimate the benefit of far red?',
        '<p>ETR = PPFD × ΦPSII × 0.84 × 0.5 uses PPFD, which stops at 700 nm, and assumes a fixed 50:50 split. Far red adds excitation to PSI that is not in PPFD, so the equation misses those photons and the change in the split. Measure absorbed light over 400 to 750 nm and the excitation balance, or use gas exchange, before trusting ETR under far red.</p>', { choices: [
          ['The fixed 0.5 split and a PPFD that stops at 700 nm', true, 'Far red excites PSI and is outside PPFD, so the equation misses both changes.'],
          ['Far red damages PSII', false, 'Nothing here needs damage; the error is in the arithmetic of the equation.'],
          ['Fluorescence is not emitted under far red', false, 'PSII still fluoresces; the problem is converting ΦPSII into electrons.']] }) + '</div>' +
      '</section>' + (ui.quiz ? ui.quiz('thylakoid') : '');

    /* theatre */
if (window.WPMolColor) { var mk2 = el.querySelector('#thy-th'); if (mk2) mk2.insertAdjacentHTML('afterend', WPMolColor.key(['h2o', 'o2'])); } // v19: the site wide molecule key
    A1 = ui.anim(el.querySelector('#thy-th'), {
      height: function (w) { return w < 560 ? 530 : 580; }, label: A1LABEL,
      draw: function (c, w, h, t, dt, info) {
        if (VIEW === 'z') { if (dt > 0 && TH.lay) step(dt); c.clearRect(0, 0, w, h); var P0 = M.palette(info.dark); c.fillStyle = P0.dark ? '#0d1218' : '#fbf8f1'; c.fillRect(0, 0, w, h); drawZ(c, w, h, t, dt, info, ZT1); return; }
        draw(c, w, h, t, dt, info);
      },
      settle: function () { if (!TH.lay) return; TH.e = []; TH.h = []; TH.ph = []; TH.sy = []; prewarm(5); },
      resize: function () { TH.lay = null; TH.cache = null; },
      picked: function () { var p = DRAG.tapped; DRAG.tapped = false; return !!p; } // v19: a press on the DCMU pill is a drag, never a freeze
    });
    hookDrag(A1.canvas);
    A3 = ui.anim(el.querySelector('#thy-sort'), { height: function (w) { return w < 560 ? 370 : 330; }, label: 'Photon sorter: photons arrive at the photosystem II antenna and leave as electrons to the chain, as heat (NPQ), as fluorescence or as other heat, in the shares of the model', draw: drawSorter, settle: function () { SO.tally = []; }, resize: function () { SO.lay = null; SO.tally = []; } });
    Array.prototype.forEach.call(el.querySelectorAll('[data-sortppfd]'), function (b) { b.addEventListener('click', function () { LP.set({ ppfd: +b.dataset.sortppfd }); }); });
    var sp = el.querySelector('#thy-sortpause'); if (sp) sp.addEventListener('click', function () { A3.pause(!A3.paused()); sp.textContent = A3.paused() ? 'Play' : 'Pause'; });
    if (sp && A3.freeze) A3.freeze.bind(sp); // v19: click the view to freeze, in step with Pause
    /* slow and named: a speed chip beside each Pause button (one tap steps 1× → ¾× → ½× → ¼× → ⅒×) */
    if (window.PlaySpeed) {
      [sp, el.querySelector('#thy-pause')].forEach(function (b) { if (b && b.parentNode) { var ch = window.PlaySpeed.chip('ps-light'); ch.style.marginLeft = '6px'; ch.style.verticalAlign = 'middle'; b.parentNode.insertBefore(ch, b.nextSibling); } });
    }
    A2 = ui.anim(el.querySelector('#thy-zc'), { height: function (w) { return w < 560 ? 360 : 400; }, label: 'Z scheme: redox potential of each carrier, two photon pushes, electrons moving along it', draw: drawZ });

    var pp = el.querySelector('#thy-ppfd');
    pp.addEventListener('input', function () { LP.set({ ppfd: +pp.value }); });
    var fr = el.querySelector('#thy-fr');
    fr.addEventListener('input', function () { setFarRed(+fr.value / 100); });
    el.querySelector('#thy-dcmu').addEventListener('click', function () { LP.set({ dcmu: !LP.state.dcmu }); });
    el.querySelector('#thy-unc').addEventListener('click', function () { LP.set({ uncoupler: !LP.state.uncoupler }); });
    el.querySelector('#thy-reset').addEventListener('click', function () { LP.set({ dcmu: false, uncoupler: false, cyclicScale: 1, npqScale: 1, hPerATP: 14 / 3 }); });
    var cy = el.querySelector('#thy-cyc');
    cy.addEventListener('input', function () { LP.set({ cyclicScale: +cy.value / 100 }); });
    el.querySelector('.thy-view').addEventListener('click', function (e) {
      var b = e.target.closest('[data-view]'); if (!b) return;
      VIEW = b.dataset.view;
      Array.prototype.forEach.call(el.querySelectorAll('[data-view]'), function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      A1.canvas.setAttribute('aria-label', VIEW === 'z' ? 'Energy ladder: redox potential of each carrier on a volt axis, two photon pushes, electrons riding it at the model rate' : A1LABEL);
      A1.redraw(); A1.kick();
    });
    el.querySelector('#thy-followb').addEventListener('click', function () {
      TH.followReq = true; TH.follow = null;
      var t = document.getElementById('thy-follow-t');
      if (!(LP.result.Jused > 0)) t.textContent = 'No electrons are leaving PSII right now. Turn the light up, or remove DCMU.';
      else if (ui.reducedMotion() || A1.paused()) t.textContent = 'Motion is paused or reduced. Press Play or turn off Reduce motion to follow an electron.';
      else t.textContent = 'Waiting for the next electron to leave PSII…';
    });
    el.querySelector('#thy-followh').addEventListener('click', function () {
      TH.followHReq = true; if (TH.followH) TH.followH.follow = false; TH.followH = null;
      var t = document.getElementById('thy-follow-t');
      if (!(LP.result.hPlus > 0) || LP.state.uncoupler) t.textContent = 'No protons are passing the ATP synthase right now. Turn the light up, or remove the uncoupler.';
      else if (ui.reducedMotion() || A1.paused()) t.textContent = 'Motion is paused or reduced. Press Play or turn off Reduce motion to follow a proton.';
      else t.textContent = 'Waiting for the next proton to leave the lumen for the ATP synthase. Slow the speed to ⅒× to watch it ride the ring.';
      if (VIEW !== 'mem') { var mb = el.querySelector('[data-view="mem"]'); if (mb) mb.click(); }
    });
    var pb = el.querySelector('#thy-pause');
    pb.addEventListener('click', function () { var p = !A1.paused(); A1.pause(p); A2.pause(p); pb.setAttribute('aria-pressed', p ? 'true' : 'false'); pb.textContent = p ? 'Play' : 'Pause'; });
    [A1, A2].forEach(function (A) { if (A && A.freeze) A.freeze.bind(pb); }); // v19: click either view to freeze both, in step with Pause
    el.addEventListener('click', function (e) {
      var cb = e.target.closest('[data-col]');
      if (cb) { LP.set({ spectrum: COLS[cb.dataset.col] }); return; }
      var nb = e.target.closest('[data-npq]');
      if (nb) { LP.set({ npqScale: +nb.dataset.npq }); return; }
      var hb = e.target.closest('[data-hatp]');
      if (hb) { LP.set({ hPerATP: +hb.dataset.hatp }); return; }
      var b = e.target.closest('[data-thy]'); if (!b) return;
      var k = b.dataset.thy;
      if (k === 'dcmu') LP.set({ dcmu: true, uncoupler: false });
      else if (k === 'noon') LP.set({ ppfd: 1800, T: 24, dcmu: false, uncoupler: false, spectrum: LP.P.sun });
      else if (k === 'fog') LP.set({ ppfd: 250, T: 15, dcmu: false, uncoupler: false, spectrum: LP.P.sun });
      else if (k === 'leds') LP.set({ ppfd: 300, dcmu: false, uncoupler: false, spectrum: { blue: 0.1, green: 0, red: 0.9, farred: 0 } });
      else if (k === 'nopsbs') LP.set({ ppfd: 1800, npqScale: 0, dcmu: false, uncoupler: false });
      else if (k === 'pgr5') LP.set({ ppfd: 1500, cyclicScale: 0, dcmu: false, uncoupler: false });
      else if (k === 'ledsfr') LP.set({ ppfd: 300, dcmu: false, uncoupler: false, spectrum: { blue: 0.08, green: 0, red: 0.72, farred: 0.2 } });
      var th = document.getElementById('thy-live'); if (th && th.scrollIntoView && k !== 'noon' && k !== 'fog') th.scrollIntoView({ behavior: ui.reducedMotion() ? 'auto' : 'smooth', block: 'start' });
    });
    ui.onPrefs(function () { TH.cache = null; renderFate(LP.result); });
    window.addEventListener('lp:tier', function () { TH.cache = null; if (A1) A1.redraw(); if (A2) A2.redraw(); update(LP.state, LP.result); });
    try { h3Init(el.querySelector('#thy-hero')); } catch (e) { console.error(e); }
  }
  var COLS = { sun: { blue: 0.239, green: 0.297, red: 0.313, farred: 0.151 }, rb: { blue: 0.1, green: 0, red: 0.9, farred: 0 }, red: { blue: 0, green: 0, red: 1, farred: 0 },
    blue: { blue: 1, green: 0, red: 0, farred: 0 }, green: { blue: 0, green: 1, red: 0, farred: 0 }, fr: { blue: 0, green: 0, red: 0, farred: 1 } };
  var COLNAME = { sun: 'Sunlight', rb: 'Red + blue LEDs', red: 'Red', blue: 'Blue', green: 'Green', fr: 'Far red only' };
  function colourOf(sp) {
    for (var k in COLS) { var c = COLS[k], d = 0; ['blue', 'green', 'red', 'farred'].forEach(function (b) { d += Math.abs((sp[b] || 0) - c[b]); }); if (d < 0.06) return k; }
    return null;
  }
  function setFarRed(f) {
    var s = LP.state.spectrum, par = s.blue + s.green + s.red;
    if (!(par > 0)) { s = LP.P.sun; par = s.blue + s.green + s.red; }
    f = clamp(f, 0, 0.6);
    LP.set({ spectrum: { blue: s.blue / par * (1 - f), green: s.green / par * (1 - f), red: s.red / par * (1 - f), farred: f } });
  }
  var lastFateKey = '';
  function renderFate(res) {
    var fb = document.getElementById('thy-fbar'); if (fb) fb.innerHTML = fateBar(res);
    var key = [LP.state.T, LP.state.Ca, LP.state.O2, LP.state.leaf, LP.state.dcmu, LP.state.uncoupler, JSON.stringify(LP.state.spectrum), ui.isDark(), LP.state.ppfd].join('|');
    if (key === lastFateKey) return; lastFateKey = key;
    var fc = document.getElementById('thy-fchart'); if (fc) fc.innerHTML = fateSVG(res, fc.clientWidth - 16);
  }
  function setT(id, v, hot) { var e = document.querySelector('#' + id + ' .n'); if (e) e.textContent = v; var t = document.getElementById(id); if (t) t.classList.toggle('thy-hot', !!hot); }

  function update(st, res) {
    if (!ui) return;
    if (H3.ctx) { h3Live(); H3.ctx.invalidate(); }
    var o = document.getElementById('thy-ppfd'); if (o && document.activeElement !== o) o.value = st.ppfd;
    var oo = document.getElementById('thy-ppfd-o'); if (oo) oo.textContent = num(st.ppfd, 0) + ' µmol m⁻² s⁻¹';
    var frs = res.photons ? res.photons.frShare : 0;
    var f = document.getElementById('thy-fr'); if (f && document.activeElement !== f) f.value = Math.round(100 * frs);
    var fo = document.getElementById('thy-fr-o'); if (fo) fo.textContent = num(100 * frs, 0) + ' %';
    var d = document.getElementById('thy-dcmu'); if (d) d.setAttribute('aria-pressed', st.dcmu ? 'true' : 'false');
    var ck = colourOf(st.spectrum || {});
    Array.prototype.forEach.call(document.querySelectorAll('#lv-thylakoid [data-col]'), function (b) { b.setAttribute('aria-pressed', b.dataset.col === ck ? 'true' : 'false'); });
    var co = document.getElementById('thy-col-o'); if (co) co.textContent = ck ? '' : '(your mix from Plate I)';
    var cyv = Math.round(100 * (res.cyclicScale == null ? 1 : res.cyclicScale));
    var cy = document.getElementById('thy-cyc'); if (cy && document.activeElement !== cy) cy.value = cyv;
    var cyo = document.getElementById('thy-cyc-o'); if (cyo) cyo.textContent = cyv + ' %' + (cyv === 100 ? ' (balanced)' : '');
    var hNow = res.hPerATP || 14 / 3;
    Array.prototype.forEach.call(document.querySelectorAll('#lv-thylakoid [data-hatp]'), function (b) { b.setAttribute('aria-pressed', Math.abs(+b.dataset.hatp - hNow) < 0.01 ? 'true' : 'false'); });
    var ho = document.getElementById('thy-h-o'); if (ho) ho.textContent = num(hNow, 2) + ' (' + num(3 * hNow, 0) + ' per turn)';
    Array.prototype.forEach.call(document.querySelectorAll('#lv-thylakoid [data-npq]'), function (b) { b.setAttribute('aria-pressed', Math.abs(+b.dataset.npq - (res.npqScale == null ? 1 : res.npqScale)) < 0.01 ? 'true' : 'false'); });
    var u = document.getElementById('thy-unc'); if (u) u.setAttribute('aria-pressed', st.uncoupler ? 'true' : 'false');
    setT('tt-etr', num(res.etr, 0)); setT('tt-phi', num(res.phiPSII, 2)); setT('tt-nadph', num(res.nadphRate, 1)); setT('tt-atp', num(res.atpRate, 1), st.uncoupler);
    setT('tt-ratio', res.nadphRate > 0 ? num(res.atpRate / res.nadphRate, 2) : 'n/a');
    var rs = document.querySelector('#tt-ratio small'); if (rs) rs.textContent = res.atpPerNadph ? 'needed ' + num(res.atpPerNadph, 2) + ', linear alone ' + num(6 / (res.hPerATP || 14 / 3), 2) : 'needed by the cycle';
    setT('tt-cyc', num(res.cyclic, 1)); setT('tt-ph', num(res.lumenPH, 2)); setT('tt-pmf', num(res.pmf, 0)); setT('tt-rot', num(res.rotorHz, 0)); setT('tt-o2', num(res.o2Rate, 1));
    fillDerived();
    var et = document.getElementById('thy-etrtrue'); if (et) et.textContent = num(res.Jused, 0) + ' µmol m⁻² s⁻¹ vs ETR ' + num(res.etr, 0);
    var spl = document.getElementById('thy-split'); if (spl) spl.textContent = num(100 * ((res.balance && res.balance.split) || 0.5), 0) + ' % of absorbed PAR to PSII';
    var ps = document.querySelector('#tt-ph small'); if (ps) ps.textContent = 'stroma ' + num(res.stromaPH, 1);
    var now = document.getElementById('thy-now'); if (now) now.innerHTML = nowText(st, res);
    var cap = document.getElementById('thy-cap'); if (cap) cap.innerHTML = capText(st, res);
    var zc = document.getElementById('thy-zcap'); if (zc) zc.innerHTML = zText(st, res);
    var fcap = document.getElementById('thy-fcap'); if (fcap) fcap.innerHTML = fateText(st, res);
    var sc = document.getElementById('thy-sortcap'); if (sc) sc.innerHTML = sortText(st, res);
    var sa = document.getElementById('thy-sortans'); if (sa) sa.innerHTML = sortAns(st);
    Array.prototype.forEach.call(document.querySelectorAll('#lv-thylakoid [data-sortppfd]'), function (b) { b.setAttribute('aria-pressed', +b.dataset.sortppfd === +st.ppfd ? 'true' : 'false'); });
    if (A3 && (ui.reducedMotion() || A3.paused())) { SO.tally = []; A3.redraw(); }
    renderFate(res);
    renderBudget(res);
    if (A1 && (ui.reducedMotion() || A1.paused())) { if (ui.reducedMotion() && TH.lay) { TH.e = []; TH.h = []; TH.ph = []; prewarm(5); } A1.redraw(); }
    if (A2 && (ui.reducedMotion() || A2.paused())) A2.redraw();
  }
  /* numbers in the open question and the Design it card, from the engine at fixed reference states */
  var derivedKey = '';
  function fillDerived() {
    var k = [LP.state.T, LP.state.Ca, LP.state.O2, LP.state.leaf].join('|'); if (k === derivedKey) return; derivedKey = k;
    var base = { ppfd: 1500, spectrum: LP.P.sun, dcmu: false, uncoupler: false, cyclicScale: 1, ciFixed: 0 };
    var c47 = LP.solve(Object.assign({}, LP.state, base, { hPerATP: 14 / 3 })).cyclic, c40 = LP.solve(Object.assign({}, LP.state, base, { hPerATP: 4 })).cyclic;
    var rb = { blue: 0.1, green: 0, red: 0.9, farred: 0 }, rbfr = { blue: 0.1 * 300 / 350, green: 0, red: 0.9 * 300 / 350, farred: 50 / 350 };
    var lo = LP.solve(Object.assign({}, LP.state, base, { ppfd: 300, spectrum: rb, O2: 2 })), hi = LP.solve(Object.assign({}, LP.state, base, { ppfd: 300, spectrum: rbfr, O2: 2 }));
    var set = function (id, v) { var e = document.getElementById(id); if (e) e.textContent = v; };
    set('thy-oq-c47', num(c47, 0)); set('thy-oq-c40', num(c40, 0));
    set('thy-de-lin', num(100 * (hi.Jused / lo.Jused - 1), 0)); set('thy-de-etr', (hi.etr >= lo.etr ? '+' : MINUS) + num(Math.abs(100 * (hi.etr / lo.etr - 1)), 0));
  }
  function nowText(st, r) {
    if (st.dcmu) return 'DCMU blocks QB. Light is still absorbed, but no electron leaves PSII: no O₂, no NADPH, fluorescence up.';
    if (st.uncoupler) return 'An uncoupler lets protons leak back, so no ATP is made and the Calvin Benson cycle stops. For a few seconds electrons race (about ' + num(r.Jtransient, 0) + ' µmol m⁻² s⁻¹); then NADP⁺ is used up and only about ' + num(r.Jused, 0) + ' trickle on to O₂.';
    if (r.limit === 'ATP') return 'Cyclic flow is held at ' + Math.round(100 * r.cyclicScale) + ' % of what the leaf needs. ATP runs short (' + num(r.atpRate, 0) + ' made), so the Calvin Benson cycle slows and NADPH piles up by ' + num(r.nadphExcess, 1) + ' µmol m⁻² s⁻¹.';
    if (ui.tier() === 1 && r.Jused > 0 && r.limit !== 'ATP') return 'Light pushes electrons from water to NADPH. Along the way protons pile up inside the membrane (the lumen is about ' + num(Math.pow(10, r.dpH || 0), 0) + ' times more acid than outside), and they flow back out through a spinning motor that makes ATP.';
    if (!(r.Jused > 0)) return st.ppfd > 0 ? 'Far red alone reaches PSI only; PSII is idle, so almost no electrons flow.' : 'Dark: no photons, no electrons, no pumping. The lumen relaxes to the pH of the stroma.';
    return num(r.Jused, 0) + ' electrons and ' + num(r.hPlus, 0) + ' protons per m² per second (µmol): ' + num(r.atpRate, 0) + ' ATP and ' + num(r.nadphRate, 0) + ' NADPH, lumen pH ' + num(r.lumenPH, 1) + '.';
  }
  function capText(st, r) {
    var t = ui.tier();
    var lim = r.limit === 'Rubisco' ? 'Rubisco, not light, limits this leaf now, so part of the light is turned into heat (NPQ) and the lumen gets more acid.' : (r.limit === 'RuBP regeneration' ? 'Light limits this leaf now: every extra photon would make more ATP and NADPH.' : '');
    if (r.npqScale === 0 && t > 1) lim += ' Without PsbS the leaf cannot switch on NPQ: excess excitation stays on PSII (' + Math.round(100 * r.pressure) + ' % of it), where it can make damaging singlet oxygen.';
    if (t === 1) return 'Green beads are electrons, yellow beads are protons. Watch the motor on the right: it turns only while protons flow through it. ' + (st.dcmu ? 'With the herbicide, nothing moves past PSII.' : '');
    return lim + ' ' + (r.photons && r.photons.frShare > 0.01 ? 'Far red is ' + num(100 * r.photons.frShare, 0) + ' % of the photons; the Emerson gain in linear drive is ×' + num(r.balance.emerson, 2) + '.' : '');
  }
  function zText(st, r) {
    if (st.dcmu) return 'The chain is cut between QA and PQ: electrons pile up on QA and the second half of the Z goes quiet.';
    if (!(r.Jused > 0)) return 'No electrons are moving.';
    if (ui.tier() === 1) return 'Higher on this ladder means the electron is more eager to leave (a more negative redox potential). Two photons per electron lift it twice: once at PSII, once at PSI. Between the lifts it runs downhill, and that fall pumps protons.';
    return 'Two photons per electron: one at P680 (PSII), one at P700 (PSI). Electrons run downhill between them, and that fall pumps protons at cytochrome b₆f. ' + (r.cyclic > 0.5 ? 'The dashed loop is cyclic flow, ' + num(r.cyclic, 0) + ' µmol m⁻² s⁻¹.' : '');
  }
  function fateText(st, r) {
    var f = r.fate || {};
    if (!(r.balance && r.balance.psii > 0)) return 'No light reaches PSII.';
    return 'Of every 100 photons that excite PSII now: ' + Math.round(100 * f.photochem) + ' drive electrons, ' + Math.round(100 * f.npq) + ' leave as regulated heat (NPQ), ' + Math.round(100 * f.fluor) + ' as fluorescence and ' + Math.round(100 * f.heat) + ' as other heat.' + (st.uncoupler ? ' Without a proton gradient, NPQ cannot switch on.' : '');
  }
  function sortText(st, r) {
    var e2 = (r.balance && r.balance.psii) || 0;
    if (!(e2 > 0)) return 'No light reaches PSII, so nothing moves. Turn the light up.';
    var s = 'Each wave is a photon reaching photosystem II; each one leaves by a single exit. Electrons go on down the chain to make NADPH and pump protons. The orange glow is the PsbS and zeaxanthin switch that turns spare light into heat; it brightens as the lumen turns acid. ';
    if (ui.tier() === 1) s = 'Each wave is a photon arriving at photosystem II. It can push an electron on toward sugar, leave as safe heat, or glow back out as red light. The tags count the last 100. ';
    s += 'Photons arrive here at a rate set by the light: ' + num(e2, 0) + ' µmol m⁻² s⁻¹ reach PSII now.';
    if (ui.tier() === 3) s += ' Drawing scale: one wave per ' + SO_SCALE + ' µmol m⁻² s⁻¹ of PSII excitation, capped at 40 per second; each exit is drawn at random with the shares of the model (' + ui.badge('ILLUSTRATIVE') + ' scale, shares from the split rule below).';
    return s;
  }
  function sortAns(st) {
    var base = Object.assign({}, st), lo = LP.solve(Object.assign({}, base, { ppfd: 100 })).fate || {}, hi = LP.solve(Object.assign({}, base, { ppfd: 1500 })).fate || {};
    var p = function (v) { return Math.round(100 * (v || 0)); };
    return '<b>The electron exit.</b> In this model leaf, at 1,500 µmol m⁻² s⁻¹ ' + p(hi.photochem) + ' of 100 photons drive electrons and ' + p(hi.npq) + ' leave as NPQ heat; at 100 µmol m⁻² s⁻¹ it is ' + p(lo.photochem) + ' and ' + p(lo.npq) + '. Fluorescence stays at a few percent (' + p(hi.fluor) + ' and ' + p(lo.fluor) + '). In shade the lumen is barely acid, so the heat switch is off and the leaf uses most of its photons; in full sun it could not, so it throws most of them away as heat, on purpose. Press the chips above and watch the tags.';
  }
  function renderBudget(r) {
    var tb = document.getElementById('thy-btab'); if (!tb) return;
    var phi = r.phi || 0, ok = r.vc > 0 && !r.dcmu && !r.uncoupler;
    function cell(v, d) { return ok ? num(v, d) : 'n/a'; }
    var photonsPerCO2 = r.alpha > 0 ? 1 / r.alpha : null;
    var a30 = LP.solve(Object.assign({}, LP.state, { T: 30, O2: 21, ciFixed: 230, ppfd: 50, dcmu: false, uncoupler: false })).alpha;
    tb.innerHTML =
      '<tr><td>NADPH</td><td class="mono">2</td><td class="mono">' + cell(2 + 2 * phi, 2) + '</td><td>' + ui.badge('DERIVED') + '</td></tr>' +
      '<tr><td>ATP</td><td class="mono">3</td><td class="mono">' + cell(3 + 3.5 * phi, 2) + '</td><td>' + ui.badge('DERIVED') + '</td></tr>' +
      '<tr><td>Electrons, linear</td><td class="mono">4</td><td class="mono">' + cell(4 + 4 * phi, 2) + '</td><td>' + ui.badge('DERIVED') + '</td></tr>' +
      '<tr><td>Oxygenations per carboxylation, φ</td><td class="mono">0</td><td class="mono">' + cell(phi, 2) + '</td><td>' + ui.badge('DERIVED') + ' ' + ui.ev('photorespiration_ratio', 'Source') + '</td></tr>' +
      '<tr><td>Absorbed photons per CO₂, low light, now</td><td class="mono">8</td><td class="mono">' + (photonsPerCO2 && ok ? num(photonsPerCO2, 1) : 'n/a') + '</td><td>' + ui.badge('ILLUSTRATIVE') + ' model at the conditions above</td></tr>' +
      '<tr><td>Same, 30 °C, Ci 230, 21 % O₂</td><td class="mono">8</td><td class="mono">' + (a30 > 0 ? num(1 / a30, 1) : 'n/a') + ' (α ' + num(a30, 4) + ')</td><td>' + ui.badge('ILLUSTRATIVE') + ' model; measured 19.1 (α 0.0524, Ehleringer and Björkman 1977) ' + ui.ev('quantum_yield_c3_c4', 'Source') + '</td></tr>';
  }

  /* ================================================================== Test yourself: Plate III (15 items, v7 format) */
  LP.quiz = LP.quiz || {}; LP.quiz.items = LP.quiz.items || [];
  [
    /* Know it */
    { id: 'thy-k-water', t: 1, plate: 'thylakoid', b: 'DERIVED', src: ['10.1038/nature09913'],
      q: 'Where does the O₂ released by a leaf come from?',
      o: [['From water split at the Mn₄CaO₅ cluster of photosystem II', 'Right. 2 H₂O give O₂, 4 H⁺ and 4 e⁻. The electrons refill P680.'],
        ['From CO₂ taken up through the stomata', 'The oxygen atoms of CO₂ end up in sugar and water, not in the O₂ gas.'],
        ['From the breakdown of glucose', 'That is respiration, which uses O₂ rather than releasing it.']], a: 0 },
    { id: 'thy-k-order', t: 1, plate: 'thylakoid', b: 'VERIFIED', src: ['10.1038/186136a0'],
      q: 'In linear electron flow, which order is right?',
      o: [['PSII → plastoquinone → cytochrome b₆f → plastocyanin → PSI → ferredoxin → FNR', 'Right. Two photosystems in series, joined by mobile carriers: the Z scheme of Hill and Bendall.'],
        ['PSI → plastocyanin → cytochrome b₆f → plastoquinone → PSII → NADPH', 'That runs the chain backwards. Electrons leave water at PSII and end on NADP⁺ after PSI.'],
        ['PSII → PSI directly, then ATP synthase', 'The carriers between the photosystems are where protons are pumped; ATP synthase does not carry electrons.']], a: 0 },
    { id: 'thy-k-atpase', t: 1, plate: 'thylakoid', b: 'VERIFIED', src: ['10.1038/35013148'],
      q: 'What turns the ATP synthase rotor?',
      o: [['Protons flowing from the lumen back to the stroma through the c ring', 'Right. Each proton moves the ring one subunit; three ATP are made per full turn.'],
        ['Electrons arriving from photosystem I', 'Electrons never pass through the synthase. Their job was to pump the protons.'],
        ['Light absorbed by the synthase itself', 'ATP synthase has no pigments. It is driven by the proton gradient.']], a: 0 },
    { id: 'thy-k-npq', t: 1, plate: 'thylakoid', b: 'VERIFIED', src: ['10.1104/pp.125.4.1558'],
      q: 'At noon in full sun, what happens to most of the light photosystem II absorbs but cannot use?',
      o: [['It is released as heat on purpose (NPQ)', 'Right. The acid lumen switches on PsbS and zeaxanthin, a built in sunscreen.'],
        ['It is stored as extra ATP', 'ATP is made only as fast as protons flow, and the Calvin Benson cycle limits that.'],
        ['It is all re-emitted as red fluorescence', 'Fluorescence is a few percent at most. Heat takes the bulk.']], a: 0 },
    { id: 'thy-k-dcmu', t: 1, plate: 'thylakoid', b: 'VERIFIED', src: ['10.1007/s11120-008-9351-9'],
      q: 'The herbicide DCMU (diuron) sits in the QB pocket of photosystem II. What stops first?',
      o: [['Electron flow from PSII to plastoquinone, so O₂ and NADPH stop', 'Right. Electrons pile up on QA and the leaf glows with fluorescence.'],
        ['Light absorption by chlorophyll', 'The leaf still absorbs light; it just cannot use it.'],
        ['The ATP synthase motor only', 'The motor slows because pumping stops, but the block is upstream at QB.']], a: 0 },
    /* Use it */
    { id: 'thy-u-ratio', t: 2, plate: 'thylakoid', b: 'DERIVED', src: ['10.1104/pp.110.166652', '10.1038/35013148'],
      q: 'Linear flow moves 3 H⁺ per electron, 2 electrons make 1 NADPH, and the c14 ring needs 14/3 H⁺ per ATP. How many ATP come with each NADPH?',
      o: [['About 1.29', 'Right. 2 e⁻ × 3 H⁺ = 6 H⁺; 6 ÷ 4.67 = 1.29 ATP per NADPH.'],
        ['Exactly 1.5', '1.5 is what the Calvin Benson cycle needs, not what linear flow supplies. The gap is the point.'],
        ['3', 'That would need 14 H⁺ per NADPH, more than linear flow pumps.']], a: 0 },
    { id: 'thy-u-gap', t: 2, plate: 'thylakoid', b: 'DERIVED', src: ['10.1146/annurev-arplant-043015-112002'],
      q: 'The cycle needs 1.5 ATP per NADPH and linear flow gives about 1.29. What closes the gap with no extra NADPH?',
      o: [['Cyclic electron flow around PSI, which pumps protons through b₆f', 'Right. Electrons go from ferredoxin back to plastoquinone, so protons are pumped but no NADP⁺ is reduced.'],
        ['Photorespiration', 'Photorespiration raises the ATP demand; it does not supply ATP.'],
        ['Faster water splitting', 'More water splitting means more linear flow, which makes NADPH and ATP in the same 1.29 ratio.']], a: 0 },
    { id: 'thy-u-etr', t: 2, plate: 'thylakoid', b: 'VERIFIED', src: ['10.1016/S0304-4165(89)80016-9'],
      q: 'A PAM fluorometer reads ΦPSII = 0.25 at 1,000 µmol m⁻² s⁻¹. With the usual assumptions (absorptance 0.84, half to PSII), what is ETR?',
      o: [['105 µmol m⁻² s⁻¹', 'Right. 1,000 × 0.25 × 0.84 × 0.5 = 105.'],
        ['250 µmol m⁻² s⁻¹', 'That skips absorptance and the PSII share.'],
        ['210 µmol m⁻² s⁻¹', 'That counts all absorbed light as going to PSII. The equation splits it 50:50.']], a: 0 },
    { id: 'thy-u-unc', t: 2, plate: 'thylakoid', b: 'ILLUSTRATIVE', src: [],
      q: 'An uncoupler makes the thylakoid membrane leaky to protons. What happens in the first seconds to electron flow and to ATP?',
      o: [['Electron flow speeds up and ATP synthesis stops', 'Right. The gradient no longer pushes back on the chain, but nothing drives the motor. In a leaf the speed up is brief: with no ATP the Calvin Benson cycle stops, NADP⁺ runs out and flow falls to what O₂ can take.'],
        ['Both stop', 'Electrons are not blocked; only the proton gradient is gone.'],
        ['Both speed up', 'Faster pumping is useless if the protons leak back without passing the motor.']], a: 0 },
    { id: 'thy-u-farred', t: 2, plate: 'thylakoid', b: 'VERIFIED', src: ['10.1073/pnas.43.1.133'],
      q: 'Under red and blue LEDs you add far red at equal PAR. Electron flow rises. Why?',
      o: [['Far red excites PSI, which was short of light for linear plus cyclic flow', 'Right. That is the Emerson enhancement. Alone, far red does almost nothing because PSII is idle.'],
        ['Far red photons carry more energy than red ones', 'Far red photons carry less energy. They help because of where they are absorbed.'],
        ['Far red opens the stomata', 'This is a fast effect inside the thylakoid, not a stomatal one.']], a: 0 },
    /* Question it */
    { id: 'thy-q-pgr5', t: 3, plate: 'thylakoid', b: 'ILLUSTRATIVE', src: ['10.1146/annurev-arplant-043015-112002'],
      q: 'Set cyclic flow to 0 % in full sun. The model says CO₂ fixation falls and NADPH piles up. What in a real leaf would have to take those extra electrons?',
      o: [['Other sinks such as O₂ reduction at PSI (the water water cycle) or export of reducing power, or PSI gets damaged', 'Right. A real leaf cannot store NADPH without limit, so electrons back up at PSI. Whether that harms PSI in a crop in a Salinas afternoon is a question worth testing.'],
        ['Nothing: NADPH just accumulates without consequence', 'The NADP⁺ pool is small. Once it is full, PSI has no acceptor and electrons go to O₂.'],
        ['Rubisco, which can use NADPH directly', 'Rubisco fixes CO₂; NADPH is spent later, on reducing 1,3 bisphosphoglycerate.']], a: 0 },
    { id: 'thy-q-npq4', t: 3, plate: 'thylakoid', b: 'VERIFIED', src: ['10.1038/35000131'],
      q: 'npq4 plants lack PsbS. In steady light they photosynthesise normally. Why keep PsbS at all?',
      o: [['Because in excess or changing light, energy that is not dissipated as heat makes damaging reactive oxygen', 'Right. NPQ costs little in steady light and protects PSII when the light exceeds what the cycle can use.'],
        ['Because PsbS is needed to split water', 'Water splitting happens at the Mn₄CaO₅ cluster; PsbS is not part of it.'],
        ['Because PsbS makes ATP', 'PsbS senses lumen pH; it does not make ATP.']], a: 0 },
    { id: 'thy-q-vpz', t: 3, plate: 'thylakoid', b: 'VERIFIED', src: ['10.1126/science.aai8878'],
      q: 'Tobacco engineered to relax NPQ faster after shade grew about 15 % more in fluctuating light. If NPQ protects the leaf, how can switching it off faster help?',
      o: [['When a cloud passes, slow relaxation keeps wasting light as heat for minutes after it is no longer in excess', 'Right. The cost is in the transitions, not in full sun. Fields are full of transitions.'],
        ['Because NPQ is harmful and should be removed', 'The engineered plants still have NPQ. What changed is how fast it turns off.'],
        ['Because less NPQ means more fluorescence, which feeds photosynthesis', 'Fluorescence is lost light; it feeds nothing.']], a: 0 },
    { id: 'thy-q-lumen', t: 3, plate: 'thylakoid', b: 'VERIFIED', src: ['10.1098/rstb.2016.0381'],
      q: 'The proton motive force has two parts, ΔpH and a membrane voltage Δψ. Why might a leaf keep part of it as voltage instead of pushing the lumen very acid?',
      o: [['A very acid lumen would trigger strong NPQ and can harm lumen proteins such as the water splitting complex, while voltage still drives the motor', 'Right. Ion channels set the split, and so tune protection against ATP production. How it is set in crops is open.'],
        ['Voltage makes more ATP per proton', 'Both parts drive the same protons through the same 14 subunit ring.'],
        ['The membrane cannot hold any pH difference', 'It does hold one: the lumen is moderately acid in the light.']], a: 0 },
    { id: 'thy-q-etrfr', t: 3, plate: 'thylakoid', b: 'VERIFIED', src: ['10.1016/S0304-4165(89)80016-9', '10.1104/pp.17.00820'],
      q: 'ETR from a PAM fluorometer rises less than gas exchange suggests when far red is added. Which assumption is most likely to fail?',
      o: [['That absorbed light is split 50:50 between the photosystems and that PPFD (400 to 700 nm) counts all useful photons', 'Right. Far red excites PSI and is invisible to the PPFD term, so the equation misses both changes.'],
        ['That chlorophyll fluoresces', 'It does; the issue is how the signal is converted to electrons.'],
        ['That the leaf is alive', 'A fair check, but the systematic error comes from the fixed split and the PPFD term.']], a: 0 }
  ].forEach(function (it) { if (!LP.quiz.items.some(function (x) { return x.id === it.id; })) LP.quiz.items.push(it); });

  /* Show me (designer panel 14): dim → bright → DCMU → wash off → uncoupler → reset, about 45 s */
  LP.showme = LP.showme || {};
  LP.showme.thylakoid = [
    { at: '#thy-live', fn: function () { LP.set({ ppfd: 100, spectrum: LP.P.sun, dcmu: false, uncoupler: false, cyclicScale: 1, npqScale: 1 }); }, say: 'Dim light, 100 µmol. Almost every photon PSII catches drives an electron. The lumen is barely acid.', wait: 7000 },
    { at: '#thy-live', fn: function () { LP.set({ ppfd: 1800 }); }, say: 'Full sun, 1,800 µmol. Electrons and protons race, the lumen turns acid, the motor spins, and most excess light leaves as heat.', wait: 8000 },
    { at: '#thy-live', fn: function () { LP.set({ dcmu: true }); }, say: 'DCMU, the herbicide diuron, plugs QB. Electrons jam on QA, no water is split, no NADPH, and PSII glows red.', wait: 8000 },
    { at: '#thy-live', fn: function () { LP.set({ dcmu: false }); }, say: 'Wash the herbicide off: the chain restarts within seconds.', wait: 5000 },
    { at: '#thy-live', fn: function () { LP.set({ uncoupler: true }); }, say: 'An uncoupler: protons leak straight back. Electrons race for a moment, the motor stops, then NADP⁺ runs out.', wait: 9000 },
    { at: '#thy-live', fn: function () { LP.set({ uncoupler: false, ppfd: 1500 }); }, say: 'Back to a working leaf. Your turn: drag the DCMU pill onto PSII yourself.', wait: 4500 }
  ];


  /* ================================================================== LB14 (14 Oct): Light III macro hero, the thylakoid membrane
     Three.js r128 through LP.macro (lmacro.js, a copy of journey/macro.js). A patch of thylakoid membrane (head groups as lit
     ball sprites in two leaflets, wavy tails), glassy PSII dimer with its water splitting cluster, cytochrome b6f, PSI with its
     antenna belt, ferredoxin and FNR on the stroma side, and an ATP synthase whose c ring of 14 subunits and central stalk
     turn. Photons (coloured by the live spectrum) land on the antennas; electrons (green glow) run the linear and the cyclic
     path; protons (yellow) are pumped into the lumen and leave through the rotor; ATP (orange) and NADPH (teal) leave into
     the stroma. ONE drawing scale for every flux (K3 per µmol m⁻² s⁻¹), so the on screen ratios are the model ratios.
     The 2D theatre below (3.1) stays the full interactive and the reduced motion / no WebGL version. */
  var H3 = { ctx: null, K: 0.025 };
  LP._h3 = H3; LP._th = TH;   /* test hooks (read only) */
  function h3R() { return LP.result || {}; }
  function h3Build(ctx) {
    var T = ctx.THREE, MM = LP.macro, root = ctx.root, far = ctx.far, S = H3;
    S.T = T; S.acc = { e: 0, c: 0, ph: 0, w: 0, hin: 0, hout: 0, leak: 0, atp: 0, nad: 0 };
    var rnd = (function (s) { return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; })(314);
    S.rnd = rnd;
    /* ---- bilayer */
    var holes = [[-5, 0, 2.15], [-5, 1.25, 0.6], [-5, -1.25, 0.6], [-1.5, 0, 1.25], [1.6, 0, 1.45], [1.6, -1.2, 0.8], [5.2, 0, 0.85]];
    /* polish 14 Oct (Q-visual): head groups jittered about 10 % in position, height and size (three size classes,
       staggered rows) so the lattice no longer reads as synthetic; the front rows nearest the lens go to the blurred
       near layer, so only the protein row is sharp (depth of field). */
    var heads = { sharp: [[], [], []], near: [[], [], []] }, tv = [], tvN = [], SZ = [0.44, 0.5, 0.56], NEARZ = 2.35;
    var row = 0;
    for (var z = -3.3; z <= 3.3; z += 0.3, row++) {
      for (var x = -7.8 + (row % 2) * 0.17; x <= 7.8; x += 0.34) {
        var jx = x + (rnd() - 0.5) * 0.07, jz = z + (rnd() - 0.5) * 0.07, skip = false;
        for (var h = 0; h < holes.length; h++) { var dx = jx - holes[h][0], dz = jz - holes[h][1]; if (dx * dx + dz * dz < holes[h][2] * holes[h][2]) { skip = true; break; } }
        if (skip) continue;
        var zone = jz > NEARZ ? 'near' : 'sharp', bend = 0.05 * Math.sin(jx * 0.42 + jz * 0.3);
        heads[zone][(rnd() * 3) | 0].push([jx, 0.56 + bend + (rnd() - 0.5) * 0.05, jz]);
        heads[zone][(rnd() * 3) | 0].push([jx, -0.56 + bend + (rnd() - 0.5) * 0.05, jz]);
        var tl = zone === 'near' ? tvN : tv;
        [-1, 1].forEach(function (sgn) {
          [0.46, -0.46].forEach(function (y0) {
            var dir = y0 > 0 ? -1 : 1, px = jx + sgn * 0.055, py = y0 + bend, ph = rnd() * 6;
            for (var k = 0; k < 3; k++) {
              var ny = py + dir * 0.13, nx = jx + sgn * 0.055 + Math.sin(ph + k * 1.7) * 0.035;
              tl.push(px, py, jz, nx, ny, jz); px = nx; py = ny;
            }
          });
        });
      }
    }
    S.heads = [];
    [0, 1, 2].forEach(function (k) {
      if (heads.sharp[k].length) { var b = MM.balls(T, heads.sharp[k], 0x7fb0ea, SZ[k]); root.add(b); S.heads.push(b); }
      if (ctx.near && heads.near[k].length) { var bn = MM.balls(T, heads.near[k], 0x7fb0ea, SZ[k]); ctx.near.add(bn); S.heads.push(bn); }
    });
    var tg = new T.BufferGeometry(); tg.setAttribute('position', new T.Float32BufferAttribute(tv, 3));
    S.tailMat = new T.LineBasicMaterial({ color: 0xd8c9a8, transparent: true, opacity: 0.38 });
    root.add(new T.LineSegments(tg, S.tailMat));
    if (ctx.near && tvN.length) { var tgN = new T.BufferGeometry(); tgN.setAttribute('position', new T.Float32BufferAttribute(tvN, 3)); ctx.near.add(new T.LineSegments(tgN, S.tailMat)); }
    /* the other side of the same thylakoid (polish 14 Oct, Q-visual): the lumen is a closed compartment, so the opposite
       membrane is drawn below it, out of focus (far layer), lumen side heads facing up; protons are visibly trapped
       between the two membranes. A few blurred complexes sit in it. */
    var LY = -3.25, lowH = [[], []], tvL = [];
    for (var z2 = -3.3, r2 = 0; z2 <= 3.3; z2 += 0.46, r2++) {
      for (var x2 = -8.6 + (r2 % 2) * 0.25; x2 <= 8.6; x2 += 0.5) {
        var qx = x2 + (rnd() - 0.5) * 0.08, qz = z2 + (rnd() - 0.5) * 0.08;
        if ((qx + 3.2) * (qx + 3.2) + qz * qz < 1.3 || (qx - 3.4) * (qx - 3.4) + (qz + 0.4) * (qz + 0.4) < 1.1) continue;
        lowH[(rnd() * 2) | 0].push([qx, LY + 0.56 + (rnd() - 0.5) * 0.05, qz]);
        lowH[(rnd() * 2) | 0].push([qx, LY - 0.56 + (rnd() - 0.5) * 0.05, qz]);
        tvL.push(qx, LY + 0.46, qz, qx + 0.03, LY + 0.05, qz, qx - 0.03, LY - 0.05, qz, qx, LY - 0.46, qz);
      }
    }
    lowH.forEach(function (pts, k) { if (pts.length) far.add(MM.balls(T, pts, 0x4f7fc0, k ? 0.66 : 0.56)); });
    var tgL = new T.BufferGeometry(); tgL.setAttribute('position', new T.Float32BufferAttribute(tvL, 3));
    far.add(new T.LineSegments(tgL, new T.LineBasicMaterial({ color: 0xb8a77e, transparent: true, opacity: 0.5 })));
    [[-3.2, 0, 1.15, 0x3fa58f], [3.4, -0.4, 1.0, 0x4f86d6]].forEach(function (p) {
      var m = new T.Mesh(MM.superEllipsoid(p[2], 0.85, p[2] * 0.9, 0.55, 12, 8), MM.glass(T, p[3], { opacity: 0.55 })); m.position.set(p[0], LY, p[1]); far.add(m);
    });
    /* ---- proteins */
    function glassMesh(geo, col, o, pos, par) { var m = new T.Mesh(geo, MM.glass(T, col, o || {})); m.position.set(pos[0], pos[1], pos[2]); m.renderOrder = 2; (par || root).add(m); return m; }
    function glowBall(r, col, pos, par) { var m = new T.Mesh(new T.SphereGeometry(r, 10, 8), MM.lin(new T.MeshBasicMaterial({ color: col }))); m.position.set(pos[0], pos[1], pos[2]); (par || root).add(m); return m; }
    var se = MM.superEllipsoid;
    // PSII dimer + water splitting cluster on the lumen side + LHCII antennas
    glassMesh(se(0.82, 0.98, 0.95, 0.55, 14, 10), 0x3fa58f, { opacity: 0.5 }, [-5.78, 0.02, 0]);
    glassMesh(se(0.82, 0.98, 0.95, 0.55, 14, 10), 0x3fa58f, { opacity: 0.5 }, [-4.22, 0.02, 0]);
    glassMesh(se(0.62, 0.34, 0.62, 0.7, 14, 10), 0x6fc3a8, { opacity: 0.55 }, [-5, -1.12, 0.35]);
    S.p680 = [glowBall(0.1, 0xb8ff9a, [-5.5, 0.1, 0.2]), glowBall(0.1, 0xb8ff9a, [-4.5, 0.1, 0.2])];
    var mn = [[0, 0, 0], [0.13, 0.05, 0.02], [-0.11, 0.07, 0.04], [0.03, -0.1, 0.08], [0.02, 0.12, -0.09]];
    mn.forEach(function (p, i) { glowBall(i === 4 ? 0.06 : 0.07, i === 4 ? 0xfff2c0 : 0xd58cff, [-5 + p[0], -1.1 + p[1], 0.35 + p[2]]); });
    [[-5, 1.3], [-5, -1.3]].forEach(function (p) { glassMesh(se(0.62, 0.62, 0.42, 0.6, 14, 10), 0x5fae4c, { opacity: 0.55 }, [p[0] - 0.35, 0, p[1]]); glassMesh(se(0.5, 0.6, 0.4, 0.6, 12, 10), 0x5fae4c, { opacity: 0.55 }, [p[0] + 0.55, 0, p[1]]); });
    // cytochrome b6f dimer with hemes
    glassMesh(se(0.55, 1.0, 0.68, 0.55, 14, 12), 0x9a78e0, { opacity: 0.5 }, [-1.98, 0, 0]);
    glassMesh(se(0.55, 1.0, 0.68, 0.55, 14, 12), 0x9a78e0, { opacity: 0.5 }, [-1.02, 0, 0]);
    [[-1.95, 0.3], [-1.95, -0.3], [-1.05, 0.3], [-1.05, -0.3]].forEach(function (p) { glowBall(0.075, 0xff7a4a, [p[0], p[1], 0.25]); });
    // PSI + LHCI belt
    glassMesh(se(1.08, 0.86, 0.98, 0.55, 14, 10), 0x4f86d6, { opacity: 0.5 }, [1.6, 0, 0]);
    S.p700 = glowBall(0.11, 0xbfe0ff, [1.6, -0.15, 0.25]);
    for (var a = 0; a < 4; a++) { var an = Math.PI * (1.15 + a * 0.24); glassMesh(se(0.38, 0.55, 0.32, 0.6, 12, 10), 0x5fae4c, { opacity: 0.55 }, [1.6 + Math.cos(an) * 1.32, 0, -Math.sin(an) * 1.32 * -1]); }
    // ferredoxin and FNR (stroma side)
    glassMesh(new T.SphereGeometry(0.27, 14, 10), 0xd9775a, { opacity: 0.7 }, [1.9, 1.12, 0.25]);
    glassMesh(se(0.58, 0.42, 0.52, 0.65, 14, 10), 0xd1ab55, { opacity: 0.6 }, [3.1, 1.28, 0.25]);
    // plastoquinone (in the membrane) and plastocyanin (lumen), both shuttle
    S.pq = glassMesh(se(0.28, 0.12, 0.12, 0.8, 12, 8), 0xe3c27a, { opacity: 0.85, rim: true }, [-3.3, 0, 0.75]);
    S.pc = glassMesh(new T.SphereGeometry(0.24, 14, 10), 0x68b8ff, { opacity: 0.75 }, [0, -1.35, 0.5]);
    // ATP synthase: rotor group (c ring of 14 + central stalk), F1 head (3 alpha + 3 beta), peripheral stator
    var X = 5.2, rotor = new T.Group(); rotor.position.set(X, 0, 0); root.add(rotor); S.rotor = rotor;
    var cg = new T.CylinderGeometry(0.1, 0.1, 1.15, 10);
    for (var c = 0; c < 14; c++) {
      var ca = c / 14 * Math.PI * 2;
      var cm = new T.Mesh(cg, MM.glass(T, c === 0 ? 0xffb347 : 0x8fb0e6, { opacity: c === 0 ? 0.95 : 0.7, ei: 1, emissive: c === 0 ? 0x5a2f00 : 0x000000 }));
      cm.position.set(Math.cos(ca) * 0.56, 0, Math.sin(ca) * 0.56); rotor.add(cm);
    }
    var gam = new T.Mesh(new T.CylinderGeometry(0.11, 0.13, 1.9, 10), MM.glass(T, 0xe5d27a, { opacity: 0.85 })); gam.position.set(0.05, 1.25, 0); gam.rotation.z = 0.08; rotor.add(gam);
    var eps = new T.Mesh(se(0.26, 0.16, 0.22, 0.7, 10, 8), MM.glass(T, 0xe5d27a, { opacity: 0.8 })); eps.position.set(0.22, 0.66, 0); rotor.add(eps);
    for (var f = 0; f < 6; f++) {
      var fa = f / 6 * Math.PI * 2;
      glassMesh(new T.SphereGeometry(0.44, 12, 9), f % 2 ? 0x4d6fae : 0xa9c3ea, { opacity: 0.55 }, [X + Math.cos(fa) * 0.5, 2.25, Math.sin(fa) * 0.5]);
    }
    glassMesh(se(0.3, 0.2, 0.3, 0.7, 12, 8), 0x8a96ad, { opacity: 0.7 }, [X, 2.85, 0]);
    var stalk = new T.Mesh(new T.CylinderGeometry(0.075, 0.075, 2.7, 8), MM.glass(T, 0x8a96ad, { opacity: 0.8 })); stalk.position.set(X + 1.05, 1.15, -0.2); root.add(stalk);
    var arm = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, 0.8, 8), MM.glass(T, 0x8a96ad, { opacity: 0.8 })); arm.position.set(X + 0.75, 2.62, -0.15); arm.rotation.z = Math.PI / 2.6; root.add(arm);
    var sub = new T.Mesh(se(0.28, 0.6, 0.3, 0.6, 10, 8), MM.glass(T, 0x8a96ad, { opacity: 0.6 })); sub.position.set(X + 0.95, -0.05, -0.2); root.add(sub);
    // the lumen: a faint volume that turns amber as it acidifies (live, from the model lumen pH)
    /* polish: the lumen tint is a soft haze of large glow sprites (normal blending, so it reads on the light theme), not a
       box whose faces looked like grey slabs */
    var hzP = [];
    for (var hz = 0; hz < 46; hz++) hzP.push(-7.6 + rnd() * 15.2, -1.0 - rnd() * 1.5, -3 + rnd() * 6);
    var hzG = new T.BufferGeometry(); hzG.setAttribute('position', new T.Float32BufferAttribute(hzP, 3));
    S.lumenMat = new T.PointsMaterial({ color: 0x9fc4e8, size: 2.6, map: MM.glowTexture(T), transparent: true, opacity: 0.18, depthWrite: false });
    var lumen = new T.Points(hzG, S.lumenMat); lumen.frustumCulled = false; lumen.renderOrder = 1; root.add(lumen);
    S.lumenA = new T.Color(0x9fc4e8); S.lumenB = new T.Color(0xf2b640);
    /* ---- far layer: neighbouring thylakoid discs (grana) out of focus */
    var discG = se(2.6, 0.28, 2.6, 0.35, 18, 8), discM = MM.glass(T, 0x4f8a4f, { opacity: 0.55 });
    [[-7, 3.6, -10], [-7, 4.25, -10], [-7, 4.9, -10], [-7, 5.55, -10], [7.5, -3.4, -11], [7.5, -2.75, -11], [7.5, -2.1, -11], [2, 6.2, -14], [2, 6.85, -14]].forEach(function (p) { var m = new T.Mesh(discG, discM); m.position.set(p[0], p[1], p[2]); far.add(m); });
    var lam = new T.Mesh(new T.BoxGeometry(14, 0.22, 1.6), discM); lam.position.set(0, 1.0, -12); lam.rotation.z = -0.5; far.add(lam);
    /* ---- particles */
    var sphG = new T.SphereGeometry(1, 8, 6), sphLo = new T.SphereGeometry(1, 7, 5);
    function inst(n, col, emi) {
      var m = new T.InstancedMesh(sphLo, MM.lin(new T.MeshStandardMaterial({ color: col, emissive: emi || 0x000000, emissiveIntensity: 0.7, roughness: 0.35 })), n);
      m.frustumCulled = false; var o = new T.Object3D(); o.scale.set(0, 0, 0); o.updateMatrix(); for (var i = 0; i < n; i++) m.setMatrixAt(i, o.matrix);
      root.add(m); return m;
    }
    S.dummy = new T.Object3D();
    S.eCore = new T.InstancedMesh(sphLo, MM.lin(new T.MeshBasicMaterial({ color: 0x7dff4f, depthTest: false, transparent: true })), 40); S.eCore.frustumCulled = false; S.eCore.renderOrder = 12; root.add(S.eCore);
    S.eGlow = MM.halos(T, 40, 0x5dff2a, 2.0); S.eGlow.mat.depthTest = false; S.eGlow.obj.renderOrder = 11; root.add(S.eGlow.obj);
    S.hMesh = inst(110, 0xf2c230, 0xffd84a); S.hGlow = MM.halos(T, 110, 0xffd84a, 0.6); root.add(S.hGlow.obj);
    var starG = new T.OctahedronGeometry(1, 0);
    S.atpMesh = new T.InstancedMesh(starG, MM.lin(new T.MeshStandardMaterial({ color: 0xffad3a, emissive: 0xe8891a, emissiveIntensity: 0.8, roughness: 0.3 })), 24); S.atpMesh.frustumCulled = false; root.add(S.atpMesh);
    S.atpGlow = MM.halos(T, 24, 0xffad3a, 0.9); root.add(S.atpGlow.obj);
    S.nadMesh = inst(16, 0x5fd3c7, 0x1f9e93);
    S.wMesh = new T.InstancedMesh(MM.waterGeo(T, 0.13), MM.lin(new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.3 })), 12); S.wMesh.frustumCulled = false; root.add(S.wMesh);
    S.o2Mesh = new T.InstancedMesh(MM.merge(T, [{ geo: sphG, color: MM.atomColor ? MM.atomColor('o2', 'O') : 0xd9402f, pos: [-0.09, 0, 0], scale: 0.12 }, { geo: sphG, color: MM.atomColor ? MM.atomColor('o2', 'O') : 0xd9402f, pos: [0.09, 0, 0], scale: 0.12 }]), // v19: crimson O2
      MM.lin(new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.3 })), 8); S.o2Mesh.frustumCulled = false; root.add(S.o2Mesh);
    // photons: coloured glow points
    var phG = new T.BufferGeometry(), phP = new Float32Array(30 * 3), phC = new Float32Array(30 * 3);
    for (var q = 0; q < 30; q++) phP[q * 3 + 1] = 1e4;
    phG.setAttribute('position', new T.BufferAttribute(phP, 3)); phG.setAttribute('color', new T.BufferAttribute(phC, 3));
    S.phPts = new T.Points(phG, new T.PointsMaterial({ size: 1.5, map: MM.glowTexture(T), vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
    S.phPts.frustumCulled = false; S.phPts.material.depthTest = false; S.phPts.renderOrder = 11; root.add(S.phPts); S.phP = phP; S.phC = phC;
    /* polish 14 Oct: comet trails for electrons (along their path) and photons (along their fall), as in the Light II hero,
       so the current of electrons reads as a flow; additive line segments, zero triangles */
    S.TRN = (40 + 30) * 5; S.trP = new Float32Array(S.TRN * 6); S.trC = new Float32Array(S.TRN * 6);
    var trg = new T.BufferGeometry(); trg.setAttribute('position', new T.BufferAttribute(S.trP, 3)); trg.setAttribute('color', new T.BufferAttribute(S.trC, 3));
    S.trail = new T.LineSegments(trg, new T.LineBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, depthTest: false, blending: T.AdditiveBlending }));
    S.trail.frustumCulled = false; S.trail.renderOrder = 11; root.add(S.trail);
    S.block = MM.halos(T, 1, 0xff5050, 1.6); root.add(S.block.obj);
    /* slow and named (13 Oct): the followed proton gets a pale halo; name sprites ride under ATP and NADPH as they
       leave, under the followed H⁺ and under one H₂O. The c ring now turns one step per proton that binds. */
    S.fol = MM.halos(T, 1, 0xfff2a8, 1.5); S.fol.mat.depthTest = false; S.fol.obj.renderOrder = 13; root.add(S.fol.obj);
    S.rotT = 0; S.aE = -0.21; S.folH = null; S.keep = []; S.keepN = 0;
    function tag(text) { var sp = MM.nameTag(T, text, { depthTest: false }); sp.renderOrder = 21; sp.visible = false; sp.userData.hideName = true; root.add(sp); return sp; }
    S.tagA = []; S.tagN = [];
    for (var ti = 0; ti < 6; ti++) { S.tagA.push(tag('ATP')); S.tagN.push(tag('NADPH')); }
    S.tagH = tag('H⁺'); S.tagW = tag('H₂O');
    S.flash = MM.halos(T, 8, 0xfff2b0, 1.4); root.add(S.flash.obj);
    S.flashes = [];
    /* paths */
    S.linPath = MM.polyline([[-5, 0.12, 0.2], [-4.3, 0.02, 0.75], [-2.3, 0.02, 0.75], [-1.5, -0.45, 0.35], [-1.5, -1.35, 0.5], [1.15, -1.35, 0.5], [1.6, -0.45, 0.3], [1.7, 0.55, 0.25], [1.9, 1.12, 0.25], [3.1, 1.28, 0.25]]);
    S.cycPath = MM.polyline([[1.7, 0.55, 0.25], [1.9, 1.12, 0.25], [0.6, 0.75, 0.7], [-1.2, 0.2, 0.75], [-1.5, -0.45, 0.35], [-1.5, -1.35, 0.5], [1.15, -1.35, 0.5], [1.6, -0.45, 0.3]]);
    S.e = []; S.h = []; S.ph = []; S.atp = []; S.nad = []; S.w = []; S.o2 = []; S.rot = 0;
    for (var p0 = 0; p0 < 30; p0++) S.h.push(h3Pool(true));
    for (var s0 = 0; s0 < 5; s0++) S.h.push({ st: 'stroma', x: -7 + rnd() * 14, y: 1.0 + rnd() * 1.8, z: -2.5 + rnd() * 5, a: 1 });
    /* labels */
    var V = function (x, y, z) { return new T.Vector3(x, y, z); };
    /* tier 1 shows three tags (Q-visual M4): the motor, the crowded lumen and where the electrons start; the rest at tier 2 and 3 or with Labels */
    ctx.setLabels([
      { id: 'syn', text: 'ATP synthase', pos: V(5.2, 3.15, 0), tier: 1 },
      { id: 'lum', text: 'lumen: protons pile up', pos: V(-2.6, -2.35, 1.6), tier: 1 },
      { id: 'psii', text: 'Photosystem II', pos: V(-5, 1.2, 0), tier: 1 },
      { id: 'wat', text: 'water split, O₂ out', pos: V(-5, -1.6, 0.6), narrow: false },
      { id: 'pq', text: 'plastoquinone', pos: V(-3.3, 0.35, 0.9), narrow: false },
      { id: 'b6f', text: 'cytochrome b₆f', pos: V(-1.5, 1.2, 0) },
      { id: 'pc', text: 'plastocyanin', pos: V(-0.1, -1.7, 0.6), narrow: false },
      { id: 'psi', text: 'Photosystem I', pos: V(1.4, 0.95, -0.9) },
      { id: 'fnr', text: 'FNR → NADPH', pos: V(3.1, 1.8, 0.25) },
      { id: 'str', text: 'stroma', pos: V(-6.6, 2.5, 0), narrow: false },
      { id: 'opp', text: 'the same thylakoid, other side', pos: V(6.2, -3.0, 0.5), narrow: false }
    ]);
    /* DCMU mark at QB: a solid red cross that reads on the light theme too (additive glow alone vanished on pale backgrounds) */
    var xg = new T.Group(), xm = MM.lin(new T.MeshBasicMaterial({ color: 0xd42a1e, depthTest: false, transparent: true, opacity: 0.95 }));
    [0.785, -0.785].forEach(function (a) { var bar = new T.Mesh(new T.BoxGeometry(0.62, 0.11, 0.02), xm); bar.rotation.z = a; bar.renderOrder = 14; xg.add(bar); });
    var ring = new T.Mesh(new T.RingGeometry(0.36, 0.44, 28), xm); ring.renderOrder = 14; xg.add(ring);
    xg.position.set(-4.45, 0.08, 0.78); xg.visible = false; root.add(xg); S.xMark = xg;
    for (var pw = 0; pw < 80; pw++) h3Frame(ctx, pw * 0.05, 0.05);
    h3Live();
  }
  function h3Pool(init) {
    var r = H3.rnd;
    return { st: 'pool', x: -7 + r() * 14, y: -0.95 - r() * 1.6, z: -2.6 + r() * 5.2, vx: (r() - 0.5) * 0.4, vy: (r() - 0.5) * 0.3, vz: (r() - 0.5) * 0.4, a: init ? 1 : 0 };
  }
  function h3Target(res) {
    var d = Math.max(0, (res.stromaPH || 7.9) - (res.lumenPH || 7.2));
    return Math.round(3 + 70 * Math.min(1, d / 2.2));
  }
  function h3Frame(ctx, t, dt) {
    var S = H3, T = S.T, res = h3R(), K = S.K, r = S.rnd, st = LP.state || {};
    if (!T) return;
    var sp = st.spectrum || {}, A = S.acc;
    if (dt > 0) {
      var Jlin = +res.Jused || 0, cyc = +res.cyclic || 0, ws = +res.waterSplit || 0, hp = +res.hPlus || 0;
      var hOut = (+res.atpRate || 0) * (+res.hPerATP || 14 / 3), leak = st.uncoupler ? hp : 0;
      A.e += Jlin * K * dt; A.c += cyc * K * dt; A.w += ws * K * dt; A.hin += Math.max(0, hp - 2 * ws) * K * dt;
      A.hout += hOut * K * dt; A.leak += leak * K * dt; A.atp += (+res.atpRate || 0) * K * dt; A.nad += (+res.nadphRate || 0) * K * dt;
      A.ph += Math.min(8, (+res.absorbed || 0) * 0.004) * dt;
      while (A.e >= 1) { A.e--; if (S.e.length < 40) S.e.push({ p: S.linPath, s: 0 }); }
      while (A.c >= 1) { A.c--; if (S.e.length < 40) S.e.push({ p: S.cycPath, s: 0, cyc: true }); }
      while (A.w >= 1) { A.w--; if (S.w.length < 12) S.w.push({ x: -5 + (r() < 0.5 ? -1 : 1) * (1.2 + r() * 2), y: -1.9 - r() * 0.4, z: 0.35 + (r() - 0.5) * 2, u: 0 }); }
      while (A.hin >= 1) { A.hin--; S.h.push({ st: 'in', x: -1.5 + (r() - 0.5) * 0.5, y: 1.7, z: 0.1 + (r() - 0.5) * 0.6, a: 1 }); }
      while (A.hout >= 1) {
        A.hout--; var pi = -1, bx = -99;
        for (var i = 0; i < S.h.length; i++) if (S.h[i].st === 'pool' && S.h[i].a > 0.9 && S.h[i].x > bx && S.h[i] !== S.folH) { pi = i; bx = S.h[i].x; }
        if (pi >= 0) { S.h[pi].st = 'go'; S.h[pi].u = 0; if (!S.folH || S.folH.st === 'pool') S.folH = S.h[pi]; }
      }
      while (A.leak >= 1) { A.leak--; for (i = 0; i < S.h.length; i++) if (S.h[i].st === 'pool' && S.h[i].a > 0.9) { S.h[i].st = 'leak'; break; } }
      while (A.atp >= 1) { A.atp--; if (S.atp.length < 24) { var aa = r() * 6.28; S.atp.push({ x: 5.2 + Math.cos(aa) * 0.9, y: 2.25, z: Math.sin(aa) * 0.9, vx: Math.cos(aa) * 0.5, vz: Math.sin(aa) * 0.5, u: 0 }); } }
      while (A.nad >= 1) { A.nad--; if (S.nad.length < 16) S.nad.push({ x: 3.1, y: 1.6, z: 0.25, vx: 0.2 + r() * 0.3, vz: (r() - 0.5) * 0.4, u: 0 }); }
      while (A.ph >= 1) {
        A.ph--; if (S.ph.length >= 30) continue;
        var tot = (sp.blue || 0) + (sp.green || 0) + (sp.red || 0) + (sp.farred || 0) || 1, pk = r() * tot, col, fr = false;
        if ((pk -= sp.blue || 0) < 0) col = [0.35, 0.6, 1]; else if ((pk -= sp.green || 0) < 0) col = [0.4, 0.95, 0.4]; else if ((pk -= sp.red || 0) < 0) col = [1, 0.3, 0.22]; else { col = [0.75, 0.12, 0.2]; fr = true; }
        var tgt = fr || r() < 0.45 ? [1.6 + (r() - 0.5) * 2.2, 0.6, (r() - 0.5) * 2] : [-5 + (r() - 0.5) * 3, 0.6, (r() - 0.5) * 2.4];
        S.ph.push({ x: tgt[0] - 1.2, y: 6, z: tgt[2] + 0.6, tx: tgt[0], ty: tgt[1], tz: tgt[2], col: col, u: 0 });
      }
      // move electrons
      var spd = 2.4;
      for (i = S.e.length - 1; i >= 0; i--) { var e = S.e[i]; e.s += spd * dt; if (e.s >= e.p.total) S.e.splice(i, 1); }
      // photons fall on the antennas
      for (i = S.ph.length - 1; i >= 0; i--) {
        var p = S.ph[i]; p.u += dt * 0.9;
        if (p.u >= 1) { S.ph.splice(i, 1); if (S.flashes.length < 8) S.flashes.push({ x: p.tx, y: p.ty - 0.4, z: p.tz, u: 0 }); }
      }
      for (i = S.flashes.length - 1; i >= 0; i--) { S.flashes[i].u += dt * 3; if (S.flashes[i].u >= 1) S.flashes.splice(i, 1); }
      // water walks to the cluster, splits: 2 protons into the lumen, half an O2
      for (i = S.w.length - 1; i >= 0; i--) {
        var w = S.w[i]; w.u += dt * 0.55;
        if (w.u >= 1) {
          S.w.splice(i, 1);
          for (var k2 = 0; k2 < 2; k2++) S.h.push({ st: 'pool', x: -5 + (r() - 0.5) * 0.6, y: -1.3, z: 0.35 + (r() - 0.5) * 0.6, vx: (r() - 0.5) * 0.8, vy: -0.2, vz: (r() - 0.5) * 0.6, a: 1 });
          S.o2half = (S.o2half || 0) + 0.5; if (S.o2half >= 1) { S.o2half -= 1; if (S.o2.length < 8) S.o2.push({ x: -5, y: -1.4, z: 0.4, vx: (r() - 0.5) * 0.6, u: 0 }); }
          if (S.flashes.length < 8) S.flashes.push({ x: -5, y: -1.1, z: 0.4, u: 0.3 });
        }
      }
      for (i = S.o2.length - 1; i >= 0; i--) { var o = S.o2[i]; o.u += dt * 0.35; o.x += o.vx * dt; o.y -= 0.35 * dt; if (o.u >= 1) S.o2.splice(i, 1); }
      // protons
      var stepA = Math.PI * 2 / (3 * (+res.hPerATP || 14 / 3));
      var target = h3Target(res), pool = 0;
      for (i = 0; i < S.h.length; i++) if (S.h[i].st === 'pool') pool++;
      if (pool < target && r() < dt * 6) S.h.push(h3Pool(false));
      for (i = S.h.length - 1; i >= 0; i--) {
        var hh = S.h[i];
        if (hh.st === 'pool') {
          hh.vx += (r() - 0.5) * dt * 1.2; hh.vy += (r() - 0.5) * dt * 1.2; hh.vz += (r() - 0.5) * dt * 1.2;
          hh.vx *= 0.98; hh.vy *= 0.98; hh.vz *= 0.98;
          hh.x += hh.vx * dt; hh.y += hh.vy * dt; hh.z += hh.vz * dt;
          if (hh.x < -7.5 || hh.x > 7.5) hh.vx *= -1; if (hh.y > -0.9 || hh.y < -2.6) hh.vy *= -1; if (hh.z < -3 || hh.z > 3) hh.vz *= -1;
          hh.x = Math.max(-7.5, Math.min(7.5, hh.x)); hh.y = Math.max(-2.6, Math.min(-0.9, hh.y)); hh.z = Math.max(-3, Math.min(3, hh.z));
          if (hh.a < 1) hh.a = Math.min(1, hh.a + dt * 1.5);
          if (pool > target + 2 && hh.a >= 1 && r() < dt * 2) { hh.st = 'fade'; pool--; }
        } else if (hh.st === 'fade') { hh.a -= dt * 1.5; if (hh.a <= 0) S.h.splice(i, 1); }
        else if (hh.st === 'in') { hh.y -= 1.6 * dt; if (hh.y < -1.0) { hh.st = 'pool'; hh.vx = (r() - 0.5) * 0.6; hh.vy = -0.3; hh.vz = (r() - 0.5) * 0.6; } }
        else if (hh.st === 'go') {
          // to the lumen half channel of subunit a (beside the stator), then onto one c subunit
          hh.u += dt * 0.6;
          var f6 = Math.min(1, dt * 2.6), exx = 5.2 + Math.cos(S.aE) * 0.72, ezz = Math.sin(S.aE) * 0.72;
          hh.x += (exx - hh.x) * f6; hh.y += (-0.8 - hh.y) * f6; hh.z += (ezz - hh.z) * f6;
          if (hh.u >= 1) { hh.st = 'ride'; hh.phi = S.aE - S.rotT; S.rotT += stepA; hh.dy = hh.y; }
        } else if (hh.st === 'ride') {
          // bound to a c subunit: carried almost a full turn inside the membrane by the ring
          var ang = hh.phi + S.rot; hh.dy += (0 - hh.dy) * Math.min(1, dt * 3);
          hh.x = 5.2 + Math.cos(ang) * 0.68; hh.z = Math.sin(ang) * 0.68; hh.y = hh.dy;
          if (ang - S.aE >= Math.PI * 2 - stepA * 0.5) hh.st = 'up';
        } else if (hh.st === 'up') {
          // released through the stroma half channel of subunit a
          hh.y += 1.1 * dt; hh.x += (5.2 + Math.cos(S.aE) * 0.95 - hh.x) * Math.min(1, dt * 3); hh.z += (Math.sin(S.aE) * 0.95 - hh.z) * Math.min(1, dt * 3);
          if (hh.y > 0.95) { hh.st = 'stroma'; hh.vx = 0.3 + r() * 0.4; hh.vz = (r() - 0.5) * 0.5; hh.life = 0.9; }
        } else if (hh.st === 'leak') { hh.y += 1.2 * dt; if (hh.y > 1.0) { hh.st = 'stroma'; hh.vx = (r() - 0.5) * 0.5; hh.vz = (r() - 0.5) * 0.5; hh.life = 1.5; } }
        else if (hh.st === 'stroma') {
          if (hh.life != null) { hh.life -= dt; hh.x += hh.vx * dt; hh.z += hh.vz * dt; hh.y += 0.25 * dt; hh.a = Math.max(0, Math.min(1, hh.life)); if (hh.life <= 0) S.h.splice(i, 1); }
          else { hh.x += Math.sin(t * 0.4 + i) * 0.1 * dt; hh.y += Math.cos(t * 0.3 + i) * 0.08 * dt; }
        }
      }
      if (S.h.length > 110) { var drop = S.h.length - 110, cut = []; for (i = 0; i < S.h.length && cut.length < drop; i++) if (S.h[i].st === 'pool' || S.h[i].st === 'stroma') cut.push(i); for (i = cut.length - 1; i >= 0; i--) S.h.splice(cut[i], 1); }
      for (i = S.atp.length - 1; i >= 0; i--) { var at = S.atp[i]; at.u += dt * 0.5; at.x += at.vx * dt; at.z += at.vz * dt; at.y += 0.45 * dt; if (at.u >= 1) S.atp.splice(i, 1); }
      for (i = S.nad.length - 1; i >= 0; i--) { var nd = S.nad[i]; nd.u += dt * 0.5; nd.x += nd.vx * dt; nd.z += nd.vz * dt; nd.y += 0.5 * dt; if (nd.u >= 1) S.nad.splice(i, 1); }
      // rotor: one step (1/14 turn at 14/3 H⁺ per ATP) for every drawn proton that binds, eased so it turns smoothly
      S.rot += (S.rotT - S.rot) * Math.min(1, dt * 6);
      if (S.pq) { var pqu = (Math.sin(t * Math.max(0.15, Jlin * K * 1.2)) + 1) / 2; S.pq.position.x = -4.1 + pqu * 1.9; }
      if (S.pc) { var pcu = (Math.sin(t * Math.max(0.15, (Jlin + cyc) * K * 1.0) + 1.3) + 1) / 2; S.pc.position.x = -1.2 + pcu * 2.4; }
    }
    S.rotor.rotation.y = -S.rot;
    var acid = Math.min(1, Math.max(0, ((+res.stromaPH || 7.9) - (+res.lumenPH || 7.2)) / 2.2));
    S.lumenMat.color.copy(S.lumenA).lerp(S.lumenB, acid); S.lumenMat.opacity = 0.1 + 0.3 * acid;
    /* write instances */
    var D = S.dummy, n = 0, i2;
    var tmp = [0, 0, 0];
    for (i2 = 0; i2 < 40; i2++) {
      if (i2 < S.e.length) { S.e[i2].p.at(S.e[i2].s, tmp); D.position.set(tmp[0], tmp[1], tmp[2]); D.scale.setScalar(0.11); S.eGlow.set(i2, tmp[0], tmp[1], tmp[2]); }
      else { D.scale.setScalar(0); S.eGlow.hide(i2); }
      D.updateMatrix(); S.eCore.setMatrixAt(i2, D.matrix);
    }
    S.eCore.instanceMatrix.needsUpdate = true; S.eGlow.commit();
    for (i2 = 0; i2 < 110; i2++) {
      var hq = S.h[i2];
      if (hq && hq.a > 0.02) { D.position.set(hq.x, hq.y, hq.z); D.scale.setScalar((hq === S.folH ? 0.17 : 0.125) * hq.a); if (hq.st !== 'fade') S.hGlow.set(i2, hq.x, hq.y, hq.z); else S.hGlow.hide(i2); }
      else { D.scale.setScalar(0); S.hGlow.hide(i2); }
      D.updateMatrix(); S.hMesh.setMatrixAt(i2, D.matrix);
    }
    S.hMesh.instanceMatrix.needsUpdate = true; S.hGlow.commit();
    for (i2 = 0; i2 < 24; i2++) {
      var aq = S.atp[i2];
      if (aq) { var sc = 0.15 * (1 - Math.max(0, aq.u - 0.7) / 0.3); D.position.set(aq.x, aq.y, aq.z); D.rotation.set(t * 2, t * 1.3, 0); D.scale.setScalar(sc); S.atpGlow.set(i2, aq.x, aq.y, aq.z); }
      else { D.scale.setScalar(0); S.atpGlow.hide(i2); }
      D.updateMatrix(); S.atpMesh.setMatrixAt(i2, D.matrix);
    }
    D.rotation.set(0, 0, 0);
    S.atpMesh.instanceMatrix.needsUpdate = true; S.atpGlow.commit();
    for (i2 = 0; i2 < 16; i2++) {
      var nq = S.nad[i2];
      D.position.set(nq ? nq.x : 0, nq ? nq.y : 0, nq ? nq.z : 0); D.scale.setScalar(nq ? 0.13 * (1 - Math.max(0, nq.u - 0.7) / 0.3) : 0);
      D.updateMatrix(); S.nadMesh.setMatrixAt(i2, D.matrix);
    }
    S.nadMesh.instanceMatrix.needsUpdate = true;
    for (i2 = 0; i2 < 12; i2++) {
      var wq = S.w[i2];
      if (wq) { var ex = -5, ey = -1.25, ez = 0.35, uu = Math.min(1, wq.u); D.position.set(wq.x + (ex - wq.x) * uu, wq.y + (ey - wq.y) * uu, wq.z + (ez - wq.z) * uu); D.rotation.set(t + i2, t * 0.7, 0); D.scale.setScalar(1); }
      else D.scale.setScalar(0);
      D.updateMatrix(); S.wMesh.setMatrixAt(i2, D.matrix);
    }
    S.wMesh.instanceMatrix.needsUpdate = true;
    for (i2 = 0; i2 < 8; i2++) {
      var oq = S.o2[i2];
      if (oq) { D.position.set(oq.x, oq.y, oq.z); D.rotation.set(0, t + i2, 0.4); D.scale.setScalar(1 - Math.max(0, oq.u - 0.7) / 0.3); } else D.scale.setScalar(0);
      D.updateMatrix(); S.o2Mesh.setMatrixAt(i2, D.matrix);
    }
    D.rotation.set(0, 0, 0);
    S.o2Mesh.instanceMatrix.needsUpdate = true;
    for (i2 = 0; i2 < 30; i2++) {
      var pp = S.ph[i2];
      if (pp) { var u2 = pp.u; S.phP[i2 * 3] = pp.x + (pp.tx - pp.x) * u2; S.phP[i2 * 3 + 1] = pp.y + (pp.ty - pp.y) * u2; S.phP[i2 * 3 + 2] = pp.z + (pp.tz - pp.z) * u2; S.phC[i2 * 3] = pp.col[0]; S.phC[i2 * 3 + 1] = pp.col[1]; S.phC[i2 * 3 + 2] = pp.col[2]; }
      else S.phP[i2 * 3 + 1] = 1e4;
    }
    S.phPts.geometry.attributes.position.needsUpdate = true; S.phPts.geometry.attributes.color.needsUpdate = true;
    if (S.trail) {
      var si = 0, ta = [0, 0, 0], tb = [0, 0, 0], ecol = [0.35, 1, 0.2];
      var seg = function (a, b, c, f0, f1) {
        var o = (si++) * 6;
        S.trP[o] = a[0]; S.trP[o + 1] = a[1]; S.trP[o + 2] = a[2]; S.trP[o + 3] = b[0]; S.trP[o + 4] = b[1]; S.trP[o + 5] = b[2];
        S.trC[o] = c[0] * f0; S.trC[o + 1] = c[1] * f0; S.trC[o + 2] = c[2] * f0; S.trC[o + 3] = c[0] * f1; S.trC[o + 4] = c[1] * f1; S.trC[o + 5] = c[2] * f1;
      };
      var none = function () { var o = (si++) * 6; S.trP[o + 1] = S.trP[o + 4] = 1e4; for (var z = 0; z < 6; z++) S.trC[o + z] = 0; };
      for (i2 = 0; i2 < 40; i2++) {
        var ee = S.e[i2];
        for (var k3 = 0; k3 < 5; k3++) {
          if (ee && ee.s - (k3 + 1) * 0.11 > 0) { ee.p.at(ee.s - k3 * 0.11, ta); ee.p.at(ee.s - (k3 + 1) * 0.11, tb); seg(ta.slice(), tb.slice(), ee.cyc ? [0.2, 0.9, 0.55] : ecol, 1 - k3 / 5, 1 - (k3 + 1) / 5); }
          else none();
        }
      }
      for (i2 = 0; i2 < 30; i2++) {
        var pq2 = S.ph[i2];
        for (k3 = 0; k3 < 5; k3++) {
          var u0 = pq2 ? pq2.u - k3 * 0.035 : -1, u1 = u0 - 0.035;
          if (pq2 && u1 > 0) {
            seg([pq2.x + (pq2.tx - pq2.x) * u0, pq2.y + (pq2.ty - pq2.y) * u0, pq2.z + (pq2.tz - pq2.z) * u0], [pq2.x + (pq2.tx - pq2.x) * u1, pq2.y + (pq2.ty - pq2.y) * u1, pq2.z + (pq2.tz - pq2.z) * u1], pq2.col, 0.9 - k3 * 0.18, 0.9 - (k3 + 1) * 0.18);
          } else none();
        }
      }
      S.trail.geometry.attributes.position.needsUpdate = true; S.trail.geometry.attributes.color.needsUpdate = true;
    }
    for (i2 = 0; i2 < 8; i2++) { var fq = S.flashes[i2]; if (fq) S.flash.set(i2, fq.x, fq.y, fq.z); else S.flash.hide(i2); }
    S.flash.mat.opacity = 0.75; S.flash.commit();
    if (st.dcmu) S.block.set(0, -4.45, 0.08, 0.78); else S.block.hide(0);
    if (S.xMark) { S.xMark.visible = !!st.dcmu; if (st.dcmu) { S.xMark.quaternion.copy(ctx.camera.quaternion); S.xMark.scale.setScalar(1 + 0.08 * Math.sin(t * 4)); } }
    S.block.mat.opacity = 0.55 + 0.35 * Math.sin(t * 4); S.block.commit();
    var glow = Math.min(1, (+res.Jused || 0) / 90);
    S.p680.forEach(function (m) { m.scale.setScalar(0.6 + 0.6 * glow * (0.8 + 0.2 * Math.sin(t * 5))); });
    S.p700.scale.setScalar(0.6 + 0.6 * Math.min(1, ((+res.Jused || 0) + (+res.cyclic || 0)) / 110) * (0.8 + 0.2 * Math.sin(t * 5 + 1)));
    if (dt > 0 && ((t * 4) | 0) !== S.lastLive) { S.lastLive = (t * 4) | 0; h3Live(); }
    h3Names(ctx);
  }
  /* name sprites: stable assignment (a molecule keeps its tag until it leaves), constant size on screen, hidden for
     a frame rather than drawn over a label tag, the caption, the live line or a button */
  function h3Names(ctx) {
    var S = H3, T = S.T, cam = ctx.camera; if (!T || !cam || !S.tagA) return;
    if (S.h.indexOf(S.folH) < 0 || (S.folH && S.folH.st === 'fade')) S.folH = null;
    if (!S.folH) { for (var i = 0; i < S.h.length; i++) { var c0 = S.h[i]; if (c0.st === 'pool' && c0.a >= 1 && c0.x > -2.5 && c0.x < 3) { S.folH = c0; break; } } }
    var f = S.folH; if (f && f.a > 0.05) S.fol.set(0, f.x, f.y, f.z); else S.fol.hide(0); S.fol.mat.opacity = 0.7; S.fol.commit();
    var on = LP.macro.namesOn(), stage = ctx.wrap && ctx.wrap.querySelector('.mh-stage');
    if ((S.keepN++ % 12) === 0 && stage) {
      var sr = stage.getBoundingClientRect(); S.keep = [];
      Array.prototype.forEach.call(ctx.wrap.querySelectorAll('.mh-tag:not(.mh-hide),.mh-cap,.mh-lbtn,.mh-pause,.mh-spd,.mh-credit,.mh-live2'), function (e) {
        var b = e.getBoundingClientRect(); if (b.width > 0 && b.height > 0) S.keep.push({ x: b.left - sr.left - 3, y: b.top - sr.top - 3, w: b.width + 6, h: b.height + 6 });
      });
    }
    var placed = S.keep.slice(), v = S.v || (S.v = new T.Vector3()), tv = Math.tan(cam.fov * Math.PI / 360), px = ctx.narrow ? 15.5 : 17;
    function put(sp, x, y, z, rad, alpha) {
      if (!sp) return;
      var show = on && alpha > 0.05;
      if (show) {
        v.set(x, y, z); var d = Math.max(1, cam.position.distanceTo(v)), pxu = ctx.h / (2 * d * tv), hw = px / pxu, asp = sp.material.map.userData.aspect || 2.5;
        sp.scale.set(hw * asp, hw, 1); sp.position.set(x, y - (rad + hw * 0.62), z); sp.material.opacity = Math.min(1, alpha);
        v.copy(sp.position).project(cam);
        var sx = (v.x + 1) / 2 * ctx.w, sy = (1 - v.y) / 2 * ctx.h, bw = hw * asp * pxu, bh = px, box = { x: sx - bw / 2, y: sy - bh / 2, w: bw, h: bh };
        if (v.z > 1 || box.x < 4 || box.y < 4 || box.x + box.w > ctx.w - 4 || box.y + box.h > ctx.h - 4) show = false;
        for (var k = 0; show && k < placed.length; k++) { var b = placed[k]; if (box.x < b.x + b.w && box.x + box.w > b.x && box.y < b.y + b.h && box.y + box.h > b.y) show = false; }
        if (show) placed.push(box);
      }
      sp.visible = show; sp.userData.hideName = !show;
    }
    function assign(list, tags, key) {
      tags.forEach(function (sp) { if (sp.userData.item && list.indexOf(sp.userData.item) < 0) sp.userData.item = null; });
      list.forEach(function (it) { if (tags.some(function (sp) { return sp.userData.item === it; })) return; for (var k = 0; k < tags.length; k++) if (!tags[k].userData.item) { tags[k].userData.item = it; break; } });
    }
    assign(S.atp, S.tagA); assign(S.nad, S.tagN);
    S.tagA.forEach(function (sp) { var a = sp.userData.item; if (a) put(sp, a.x, a.y, a.z, 0.16, 1 - Math.max(0, a.u - 0.7) / 0.3); else put(sp, 0, 0, 0, 0, 0); });
    S.tagN.forEach(function (sp) { var n = sp.userData.item; if (n) put(sp, n.x, n.y, n.z, 0.14, 1 - Math.max(0, n.u - 0.7) / 0.3); else put(sp, 0, 0, 0, 0, 0); });
    if (f) put(S.tagH, f.x, f.y, f.z, 0.18, f.st === 'stroma' && f.life != null ? Math.min(1, f.life) : f.a); else put(S.tagH, 0, 0, 0, 0, 0);
    if (S.w.indexOf(S.wN) < 0) S.wN = null;
    if (!S.wN) for (var j = 0; j < S.w.length; j++) if (S.w[j].u < 0.5 && S.w[j].x > -5) { S.wN = S.w[j]; break; }   /* from the right: its path stays clear of the water split tag */
    var wq = S.wN;
    if (wq) { var uu = Math.min(1, wq.u); put(S.tagW, wq.x + (-5 - wq.x) * uu, wq.y + (-1.25 - wq.y) * uu, wq.z + (0.35 - wq.z) * uu, 0.2, uu > 0.85 ? (1 - uu) / 0.15 : 1); } else put(S.tagW, 0, 0, 0, 0, 0);
  }
  function h3Camera(ctx, t) {
    var cam = ctx.camera, asp = ctx.w / ctx.h, tv = Math.tan(cam.fov * Math.PI / 360);
    /* polish 14 Oct: framed so the stroma, the sharp membrane and the lumen fill the upper two thirds and the blurred
       opposite membrane sits under the caption (lower third), like the reference; slow dolly in and out */
    var halfW = ctx.narrow ? 4.4 : 7.0, halfH = ctx.narrow ? 4.7 : 4.0;
    var D = (Math.max(halfW / (tv * asp), halfH / tv) + 2) * (1 - 0.04 * Math.sin(t * 0.09));
    var yaw = 0.22 * Math.sin(t * 0.07), pitch = 0.17 + 0.04 * Math.sin(t * 0.05 + 1);
    var tx = ctx.narrow ? 3.6 * Math.sin(t * 0.1 - 1.2) : 0   /* phones pan along the membrane (period about 63 s at 1×, slower when slowed) */, ty = ctx.narrow ? -0.5 : -0.65;
    cam.position.set(tx + Math.sin(yaw) * Math.cos(pitch) * D, ty + Math.sin(pitch) * D, Math.cos(yaw) * Math.cos(pitch) * D);
    cam.lookAt(tx, ty, 0);
    ctx.scene.fog.near = D - 2; ctx.scene.fog.far = D + 16; ctx.farScene.fog.near = D; ctx.farScene.fog.far = D + 20;
  }
  function h3Live() {
    if (!H3.ctx || !H3.ctx.setLive) return;
    var r = h3R(), st = LP.state || {}, n0 = function (x) { return num(+x || 0, 0); };
    var s = 'ATP ' + n0(r.atpRate) + ' µmol m⁻² s⁻¹ · lumen pH ' + num(+r.lumenPH || 7, 1) + ' · ' + n0(r.rotorHz) + ' turns s⁻¹';
    if (st.dcmu || st.uncoupler) s = 'e⁻ ' + n0(r.Jused) + ' · ' + s;
    if (st.dcmu) s = 'DCMU: PSII is blocked · ' + s;
    else if (st.uncoupler) s = 'Uncoupler: protons leak back, the rotor stops · ' + s;
    else if (!(+st.ppfd > 0)) s = 'Dark: no photons, nothing moves';
    H3.ctx.setLive(s);
  }
  function h3Init(host) {
    if (!host || H3.ctx || !LP.macro) return;
    H3.ctx = LP.macro.hero(host, {
      id: 'thy-hero', seed: 41, fov: 30, exposure: 1.0, capAlign: 'left',
      palette: { light: { top: '#17301f', mid: '#2f5232', bot: '#5c7d45', bokeh: ['#d9f0b0', '#8fc46c', '#f6e7b0', '#b5dc8a'], fog: 0x2f5232, fg: 'rgba(180,220,140,.5)' },
        dark: { top: '#03080a', mid: '#0a1a14', bot: '#10261c', bokeh: ['#2f6f43', '#1d4b3c', '#7a6a2c', '#3c7a4a'], fog: 0x0a1a14, fg: 'rgba(60,130,90,.45)' } },
      label: 'Three dimensional patch of thylakoid membrane: lipid head groups in two rows with tails between; glassy photosystem II with its water splitting cluster, cytochrome b6f, photosystem I with its antenna, ferredoxin and FNR on the stroma side, and an ATP synthase whose ring of 14 c subunits turns. Coloured photons land on the antennas, green electrons run from water to NADPH, yellow protons pile up in the lumen below, closed off by the out of focus membrane of the other side of the same thylakoid, and leave through the turning ring, orange ATP and teal NADPH leave into the stroma above.',
      question: 'How does light turn a motor?',
      answer: 'Light excites an electron at photosystem II and again at photosystem I. Between them it passes plastoquinone, cytochrome b<sub>6</sub>f and plastocyanin; after photosystem I, ferredoxin and FNR use it to make NADPH. On the way, cytochrome b<sub>6</sub>f moves protons into the lumen, and splitting water adds more. The lumen is a closed sac (the blurred membrane below is the other side of the same thylakoid), so for the crowded protons the main way back to the stroma is ATP synthase (a few leak through the membrane or leave through the KEA3 K⁺/H⁺ antiporter). Each one turns its ring of 14 c subunits one step, and every full turn makes 3 ATP. The drawn ring is slowed: at the default light the real ring turns about 47 times a second (illustrative enzyme density; the live line gives the number). <b>Every flux in the scene is drawn at one scale from the model</b>, so dimming the light slows electrons, protons and the rotor together. Try DCMU or the uncoupler below.',
      credit: { text: 'Hahn et al. · Science 2018', doi: '10.1126/science.aat4318' },
      height: function (w) { return w < 600 ? 520 : Math.round(Math.min(680, Math.max(460, w * 0.66))); },
      fallbackNote: 'This 3D membrane needs WebGL, which this browser does not offer. The drawing in 3.1 below shows the same chain at the same rates.',
      build: h3Build, frame: h3Frame, camera: h3Camera,
      /* LOOK CLOSER (controls engineer, 14 Oct 2026): chips under the stage fly the camera to a named part */
      focus: [
        { id: 'syn', label: 'ATP synthase', target: [5.2, 1.45, 0], dist: 8.5, theta: 0.35, phi: 1.3 },
        { id: 'psii', label: 'Photosystem II', target: [-4.8, 0.1, 0], dist: 7, theta: -0.25, phi: 1.3 },
        { id: 'b6f', label: 'Cytochrome b₆f', target: [-1.5, 0.2, 0], dist: 6, theta: 0.1, phi: 1.25 },
        { id: 'psi', label: 'Photosystem I', target: [1.6, 0.4, -0.4], dist: 6.5, theta: 0.2, phi: 1.2 },
        { id: 'lum', label: 'The lumen', target: [-1.5, -1.75, 0.8], dist: 7.5, theta: -0.15, phi: 1.42 }
      ]
    });
    h3Live();
    U().onPrefs(function () { if (H3.ctx && H3.ctx.retheme) H3.ctx.retheme(); });
  }

  LP.panels.push({
    id: 'thylakoid', mount: mount, update: update,
    show: function () { if (A1) { A1.resize(); A1.kick(); } if (A2) { A2.resize(); A2.kick(); } renderFate(LP.result); if (H3.ctx) { h3Live(); H3.ctx.invalidate(); } },
    hide: function () {}
  });
})();

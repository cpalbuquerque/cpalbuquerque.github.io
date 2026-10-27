/* The Water Path v8: mol.js, the molecular theatre (W owner, night of 10 Oct 2026)
   A reusable 2D canvas stage for molecules that move at model rates.
   - MOL.Theatre(host, scene, opts): canvas sized by devicePixelRatio (cap 2), redraws only while visible,
     pause button support, reduce motion (one still frame), light "museum plate" and dark "night glow" palettes.
   - MOL.draw: lipid bilayer (head groups and paired tails), protein blobs with an inner channel, water,
     CO2, H+, K+, Ca2+, sugar, ATP, electron, phosphate, rounded label tags, flux arrows.
   - MOL.scenes.aquaporin(): single file water through PIP aquaporins, gates closing with pH, Ca2+ and
     dephosphorylation, a blue light H+ ATPase acidifying the sap.
   - MOL.scenes.cuticle(): a stoma and the cuticle, water vapour leaving at rates set by gs and gmin.
   No dependency on WP: copy this file to reuse it elsewhere (the light module copies, it does not link).
   Plain ES2018, no modules. Every rate is passed in by the caller from a model; the theatre invents none. */
(function () {
  'use strict';
  var MOL = {};
  var TAU = Math.PI * 2;
  function clamp(x, a, b) { return x < a ? a : (x > b ? b : x); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  // small deterministic random so the still frame is the same each time
  function rng(seed) { var s = seed >>> 0 || 1; return function () { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return (s % 100000) / 100000; }; }
  MOL.rng = rng;

  /* ------------------------------------------------------------ palettes */
  MOL.palette = function (dark) {
    return dark ? {
      dark: true, bgTop: '#0b1622', bgBot: '#0d1a14', bgMid: '#0a0d10', ink: '#ece6da', ink2: '#b3aca0',
      head: '#5d9be6', headHi: '#cfe3ff', headLo: '#1d3f6e', tail: 'rgba(200,210,225,.38)', core: 'rgba(30,45,65,.55)',
      prot: '#5f86c9', protHi: '#bcd2ff', protLo: '#1f3460', prot2: '#c9a95c', prot2Hi: '#ffe6a6', prot2Lo: '#5d4718',
      pore: 'rgba(4,10,20,.92)', loop: '#e07a4f', his: '#ff9a5a', hisP: '#ffd35a',
      O: '#ff5a4a', H: '#f4f4f4', C: '#7d8590', Hp: '#ffd84a', HpInk: '#3a2a00', K: '#b28cff', Ca: '#7fe0a8', sugar: '#7fc49a', atp: '#ffad3a', e: '#8cff6a', P: '#ffb347',
      tagBg: 'rgba(20,26,34,.86)', tagInk: '#ece6da', tagRule: 'rgba(201,165,106,.6)', arrow: 'rgba(113,160,244,.55)', glow: 12,
      cut: '#d8b860', cutHi: '#fff0b8', epi: '#2b3d2c', epiHi: '#4d6a4b', guard: '#5f9a58', guardHi: '#b8e6a0', air: '#0d1722', cav: '#0c1410'
    } : {
      dark: false, bgTop: '#efe7d3', bgBot: '#e6e8d2', bgMid: '#f4eddc', ink: '#2a231c', ink2: '#5e5141',
      head: '#6f9fd8', headHi: '#e6f0ff', headLo: '#2f5a94', tail: 'rgba(90,80,70,.42)', core: 'rgba(214,205,186,.55)',
      prot: '#6b8fc9', protHi: '#dfe9fb', protLo: '#2e4a80', prot2: '#c7a24e', prot2Hi: '#fbeec4', prot2Lo: '#7a5a1a',
      pore: 'rgba(30,26,22,.78)', loop: '#a8461f', his: '#c8581f', hisP: '#e0a200',
      O: '#d2392b', H: '#ffffff', C: '#4a4f57', Hp: '#f2c230', HpInk: '#3a2a00', K: '#8a5cd6', Ca: '#2f8a57', sugar: '#4f9a6a', atp: '#e8891a', e: '#3f9a2a', P: '#e08a1a',
      tagBg: 'rgba(250,246,236,.94)', tagInk: '#2a231c', tagRule: 'rgba(138,122,98,.75)', arrow: 'rgba(43,95,164,.35)', glow: 0,
      cut: '#c9a845', cutHi: '#f6e6a8', epi: '#dfe6c6', epiHi: '#f5f8e6', guard: '#8fb27a', guardHi: '#e2f0cf', air: '#f3efe2', cav: '#eef1dc'
    };
  };

  /* ------------------------------------------------------------ drawing primitives */
  var D = MOL.draw = {};
  D.ball = function (c, x, y, r, col, hi, lo, a) {
    var g = c.createRadialGradient(x - r * 0.38, y - r * 0.42, r * 0.12, x, y, r);
    g.addColorStop(0, hi || '#ffffff'); g.addColorStop(0.35, col); g.addColorStop(1, lo || col);
    c.globalAlpha = a == null ? 1 : a;
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    c.globalAlpha = 1;
  };
  function shade(hex, f) { // f > 0 lighter, < 0 darker
    var h = hex.replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&');
    var n = [0, 2, 4].map(function (i) { return parseInt(h.substr(i, 2), 16); });
    n = n.map(function (v) { return Math.round(f > 0 ? v + (255 - v) * f : v * (1 + f)); });
    return 'rgb(' + n.join(',') + ')';
  }
  MOL.shade = shade;
  // water: red O with two white H at 104.5 degrees
  D.water = function (c, P, x, y, r, ang, a) {
    var hr = r * 0.62, d = r * 0.95, h1 = ang - 0.912, h2 = ang + 0.912;
    D.ball(c, x + Math.cos(h1) * d, y + Math.sin(h1) * d, hr, P.H, '#ffffff', P.dark ? '#9aa3ad' : '#b8afa2', a);
    D.ball(c, x + Math.cos(h2) * d, y + Math.sin(h2) * d, hr, P.H, '#ffffff', P.dark ? '#9aa3ad' : '#b8afa2', a);
    if (!P.dark && r >= 2.5) { // light theme: a thin rim so the white H atoms read on cream paper
      c.globalAlpha = (a == null ? 1 : a) * 0.6; c.strokeStyle = 'rgba(40,30,20,.55)'; c.lineWidth = 0.8;
      c.beginPath(); c.arc(x + Math.cos(h1) * d, y + Math.sin(h1) * d, hr, 0, TAU); c.stroke();
      c.beginPath(); c.arc(x + Math.cos(h2) * d, y + Math.sin(h2) * d, hr, 0, TAU); c.stroke();
      c.globalAlpha = 1;
    }
    D.ball(c, x, y, r, P.O, shade(P.O, 0.55), shade(P.O, -0.45), a);
  };
  D.co2 = function (c, P, x, y, r, ang, a) {
    var dx = Math.cos(ang) * r * 1.55, dy = Math.sin(ang) * r * 1.55;
    D.ball(c, x - dx, y - dy, r * 0.85, P.O, shade(P.O, 0.55), shade(P.O, -0.45), a);
    D.ball(c, x + dx, y + dy, r * 0.85, P.O, shade(P.O, 0.55), shade(P.O, -0.45), a);
    D.ball(c, x, y, r, P.C, shade(P.C, 0.6), shade(P.C, -0.5), a);
  };
  D.ion = function (c, P, x, y, r, col, label, a) {
    D.ball(c, x, y, r, col, shade(col, 0.6), shade(col, -0.45), a);
    if (label && r >= 5) {
      c.globalAlpha = a == null ? 1 : a;
      c.fillStyle = P.dark ? '#1b150c' : '#ffffff'; c.font = '600 ' + Math.round(r * 1.05) + 'px system-ui,sans-serif';
      c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(label, x, y + 0.5);
      c.globalAlpha = 1;
    }
  };
  D.proton = function (c, P, x, y, r, a) {
    if (P.glow) { c.save(); c.shadowColor = P.Hp; c.shadowBlur = P.glow * 0.8; }
    D.ball(c, x, y, r, P.Hp, '#fff8d0', shade(P.Hp, -0.35), a);
    if (P.glow) c.restore();
    if (r >= 5) {
      c.globalAlpha = a == null ? 1 : a; c.fillStyle = P.HpInk; c.font = '700 ' + Math.round(r * 0.95) + 'px system-ui,sans-serif';
      c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('H⁺', x, y + 0.5); c.globalAlpha = 1;
    }
  };
  D.electron = function (c, P, x, y, r, a) {
    if (P.glow) { c.save(); c.shadowColor = P.e; c.shadowBlur = P.glow; }
    D.ball(c, x, y, r, P.e, '#eaffe0', shade(P.e, -0.4), a);
    if (P.glow) c.restore();
  };
  D.sugar = function (c, P, x, y, r, ang, a) {
    c.globalAlpha = a == null ? 1 : a;
    c.beginPath();
    for (var i = 0; i < 6; i++) { var t = ang + i * TAU / 6; c[i ? 'lineTo' : 'moveTo'](x + Math.cos(t) * r, y + Math.sin(t) * r); }
    c.closePath();
    var g = c.createLinearGradient(x - r, y - r, x + r, y + r); g.addColorStop(0, shade(P.sugar, 0.45)); g.addColorStop(1, shade(P.sugar, -0.25));
    c.fillStyle = g; c.fill(); c.strokeStyle = shade(P.sugar, -0.4); c.lineWidth = 1; c.stroke();
    c.globalAlpha = 1;
  };
  D.atp = function (c, P, x, y, r, ang, a) {
    c.globalAlpha = a == null ? 1 : a;
    if (P.glow) { c.save(); c.shadowColor = P.atp; c.shadowBlur = P.glow; }
    c.beginPath();
    for (var i = 0; i < 16; i++) { var t = ang + i * TAU / 16, rr = i % 2 ? r * 0.55 : r; c[i ? 'lineTo' : 'moveTo'](x + Math.cos(t) * rr, y + Math.sin(t) * rr); }
    c.closePath(); c.fillStyle = P.atp; c.fill();
    if (P.glow) c.restore();
    c.strokeStyle = shade(P.atp, -0.4); c.lineWidth = 0.8; c.stroke();
    if (r >= 8) { c.fillStyle = '#3a2000'; c.font = '700 ' + Math.round(r * 0.62) + 'px system-ui,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('ATP', x, y + 0.5); }
    c.globalAlpha = 1;
  };
  D.phosphate = function (c, P, x, y, r, a) { D.ion(c, P, x, y, r, P.P, 'P', a); };
  // 13 Oct (slow and named): ADP, the spent carrier, as a paler star with one point fewer pair; Pᵢ as a small phosphate
  D.adp = function (c, P, x, y, r, ang, a) {
    c.globalAlpha = a == null ? 1 : a;
    c.beginPath();
    for (var i = 0; i < 12; i++) { var t = ang + i * TAU / 12, rr = i % 2 ? r * 0.6 : r; c[i ? 'lineTo' : 'moveTo'](x + Math.cos(t) * rr, y + Math.sin(t) * rr); }
    c.closePath(); c.fillStyle = shade(P.atp, P.dark ? -0.25 : 0.45); c.fill();
    c.strokeStyle = shade(P.atp, -0.45); c.lineWidth = 0.8; c.stroke();
    c.globalAlpha = 1;
  };
  // sucrose: a glucose hexagon joined to a fructose pentagon (sugar, D.sugar, stays the single ring)
  D.sucrose = function (c, P, x, y, r, ang, a) {
    var dx = Math.cos(ang) * r * 0.95, dy = Math.sin(ang) * r * 0.95;
    D.sugar(c, P, x - dx, y - dy, r * 0.78, ang, a);
    c.globalAlpha = a == null ? 1 : a;
    var cx = x + dx * 1.05, cy = y + dy * 1.05, rp = r * 0.68;
    c.beginPath();
    for (var i = 0; i < 5; i++) { var t = ang + Math.PI + i * TAU / 5; c[i ? 'lineTo' : 'moveTo'](cx + Math.cos(t) * rp, cy + Math.sin(t) * rp); }
    c.closePath();
    var g = c.createLinearGradient(cx - rp, cy - rp, cx + rp, cy + rp); g.addColorStop(0, shade(P.sugar, 0.6)); g.addColorStop(1, shade(P.sugar, -0.1));
    c.fillStyle = g; c.fill(); c.strokeStyle = shade(P.sugar, -0.4); c.lineWidth = 1; c.stroke();
    c.globalAlpha = 1;
  };
  // rounded label tag
  /* Lead 13 Oct: molecule name under a molecule (window.MolNames switch). (x, y) = molecule centre, r = its drawn
     radius. size = font px (default 10, 9 on phones is fine; never below 8.5). Draws nothing when names are off. */
  D.namesOn = function () { return !window.MolNames || window.MolNames.get(); };
  D.name = function (c, P, x, y, r, text, o) {
    if (!D.namesOn() || !text) return;
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
  /* W molecular builder, 13 Oct (slow and named): the ANTI CLUTTER RULE for 2D theatres, one namer per theatre (T.names).
     A scene calls T.names.add(kind, key, x, y, r, text, o) for each molecule that could carry a name, in its draw;
     the theatre draws the chosen names LAST, after every label tag, so a name never covers a tag (every D.tag box is
     recorded while the scene draws) nor another name. Per kind: o.all (products and carriers: ATP, ADP, Pᵢ, sucrose)
     names every one while 6 or fewer are listed, else 2 at desktop width and 1 on phones (swarms: H₂O, H⁺, K⁺, Ca²⁺,
     CO₂, vapour); o.q overrides the count. Stable: a named molecule (key = its own object) keeps its name until it
     leaves the scene; if it is briefly blocked its name waits hidden instead of jumping to another molecule.
     A second name of a kind goes to a molecule well away from the first. Fonts 10.5 px (9.5 px under 560 px).
     T.names.block(x, y, w, h) reserves scene text drawn without D.tag (share bars, legends). */
  var REC = null;
  MOL.Namer = function () {
    var N = { items: [], boxes: [], prev: {}, miss: new Map() };
    N.begin = function (w, h) { N.items = []; N.boxes = []; N.w = w; N.h = h; REC = N.boxes; };
    N.block = function (x, y, w, h) { N.boxes.push({ x: x, y: y, w: w, h: h }); };
    N.add = function (kind, key, x, y, r, text, o) {
      if (!key || !isFinite(x) || !isFinite(y)) return;
      N.items.push({ k: kind, key: key, x: x, y: y, r: r || 4, t: text || kind, all: !!(o && o.all), q: o && o.q, pri: (o && o.pri) || 0 });
    };
    function hit(a, b) { return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h; }
    N.end = function (c, P) {
      REC = null;
      if (!D.namesOn() || !N.w) { N.prev = {}; return; }
      var narrow = N.w < 560, fs = narrow ? 9.5 : 10.5, placed = N.boxes.slice(), by = {}, kinds = [], next = {}, now = performance.now(); // fix round: a blocked name waits at most 0.75 s of wall time, not a frame count
      c.save(); c.font = '700 ' + fs + 'px system-ui,-apple-system,Segoe UI,sans-serif';
      N.items.forEach(function (it) {
        if (!by[it.k]) { by[it.k] = []; kinds.push(it.k); }
        by[it.k].push(it);
        var w = c.measureText(it.t).width + 8, h = fs + 5;
        it.box = { x: it.x - w / 2 - 1, y: it.y + it.r + 2, w: w + 2, h: h + 2 };
      });
      c.restore();
      function fits(it) {
        var b = it.box; if (b.x < 2 || b.y < 2 || b.x + b.w > N.w - 2 || b.y + b.h > N.h - 2) return false;
        for (var i = 0; i < placed.length; i++) if (hit(b, placed[i])) return false;
        return true;
      }
      kinds.forEach(function (k) {
        var L = by[k], q = L[0].q != null ? L[0].q : (L[0].all && L.length <= 6 ? 6 : (narrow ? 1 : 2)), chosen = [], old = N.prev[k] || [];
        if (q <= 0) return;
        L.sort(function (a, b) { return b.pri - a.pri; });
        L.forEach(function (it) { var m0 = N.miss.get(it.key); if (chosen.length < q && old.indexOf(it.key) >= 0 && (m0 == null || now - m0 < 750)) chosen.push(it); });
        L.forEach(function (it) {
          if (chosen.length >= q || chosen.indexOf(it) >= 0) return;
          for (var i = 0; i < chosen.length; i++) if (!L[0].all && Math.hypot(chosen[i].x - it.x, chosen[i].y - it.y) < (narrow ? 60 : 90)) return;
          if (fits(it)) chosen.push(it);
        });
        next[k] = chosen.map(function (it) { return it.key; });
        chosen.forEach(function (it) {
          if (!fits(it)) { if (!N.miss.has(it.key)) N.miss.set(it.key, now); return; }
          N.miss.delete(it.key); placed.push(it.box);
          D.name(c, P, it.x, it.y, it.r, it.t, { size: fs });
        });
      });
      N.prev = next;
      if (N.miss.size > 200) N.miss.clear();
    };
    return N;
  };
  D.tag = function (c, P, x, y, text, o) {
    o = o || {};
    var fs = o.size || 11.5;
    c.font = (o.weight || 600) + ' ' + fs + 'px system-ui,-apple-system,"Segoe UI",sans-serif';
    var w = c.measureText(text).width + 12, h = fs + 9;
    var ax = o.align === 'right' ? x - w : (o.align === 'center' ? x - w / 2 : x);
    var ay = y - h / 2;
    if (REC && (o.alpha == null || o.alpha > 0.3)) REC.push({ x: ax - 2, y: ay - 2, w: w + 4, h: h + 4 });
    c.globalAlpha = o.alpha == null ? 1 : o.alpha;
    c.fillStyle = o.bg || P.tagBg; c.strokeStyle = o.rule || P.tagRule; c.lineWidth = 1;
    rrect(c, ax, ay, w, h, h / 2); c.fill(); c.stroke();
    c.fillStyle = o.ink || P.tagInk; c.textAlign = 'left'; c.textBaseline = 'middle';
    c.fillText(text, ax + 6, y + 0.5);
    c.globalAlpha = 1;
    return { x: ax, y: ay, w: w, h: h };
  };
  function rrect(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  D.rrect = rrect;
  D.arrow = function (c, x0, y0, x1, y1, w, col, a) {
    var ang = Math.atan2(y1 - y0, x1 - x0), hl = Math.max(8, w * 2.2);
    c.globalAlpha = a == null ? 1 : a; c.strokeStyle = col; c.fillStyle = col; c.lineWidth = w; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1 - Math.cos(ang) * hl * 0.8, y1 - Math.sin(ang) * hl * 0.8); c.stroke();
    c.beginPath(); c.moveTo(x1, y1);
    c.lineTo(x1 - Math.cos(ang - 0.45) * hl, y1 - Math.sin(ang - 0.45) * hl);
    c.lineTo(x1 - Math.cos(ang + 0.45) * hl, y1 - Math.sin(ang + 0.45) * hl); c.closePath(); c.fill();
    c.globalAlpha = 1;
  };
  /* r5 (W, designer panel items 2 and 7): shared devices that make direction and route readable in a still frame.
     Route colours are Okabe Ito (colourblind safe): walls orange, membranes bluish green, vapour sky blue. */
  MOL.ROUTE = { apo: '#E69F00', tm: '#009E73', vap: '#56B4E9' };
  D.halo = function (c, x, y, r, col, a) {
    c.globalAlpha = a == null ? 0.55 : a; c.strokeStyle = col; c.lineWidth = Math.max(1.6, r * 0.42);
    c.beginPath(); c.arc(x, y, r * 1.75, 0, TAU); c.stroke(); c.globalAlpha = 1;
  };
  // a wide translucent arrow behind the scene: its width follows the model net flux
  D.flux = function (c, P, x0, y0, x1, y1, wd, a) {
    var ang = Math.atan2(y1 - y0, x1 - x0), L = Math.hypot(x1 - x0, y1 - y0), hw = wd / 2, hl = Math.min(L * 0.35, Math.max(14, wd * 1.1));
    c.save(); c.translate(x0, y0); c.rotate(ang);
    var g = c.createLinearGradient(0, 0, L, 0);
    var col = P.dark ? '120,170,255' : '43,95,164';
    g.addColorStop(0, 'rgba(' + col + ',0)'); g.addColorStop(0.25, 'rgba(' + col + ',' + (a == null ? 0.16 : a) + ')'); g.addColorStop(1, 'rgba(' + col + ',' + ((a == null ? 0.16 : a) * 1.5) + ')');
    c.fillStyle = g; c.beginPath();
    c.moveTo(0, -hw); c.lineTo(L - hl, -hw); c.lineTo(L - hl, -hw * 1.8); c.lineTo(L, 0); c.lineTo(L - hl, hw * 1.8); c.lineTo(L - hl, hw); c.lineTo(0, hw); c.closePath(); c.fill();
    c.restore();
  };
  /* r5 (W, designer panel item 1): one water molecule is "yours" in every journey theatre. It wears a gold halo and a short
     trail; when it leaves the scene the next molecule to enter becomes yours. MOL.pick(list) marks one; D.tracer draws it. */
  MOL.pick = function (list) {
    for (var i = 0; i < list.length; i++) if (list[i].tr) return list[i];
    if (!list.length) return null;
    list[list.length - 1].tr = true; list[list.length - 1].trail = []; return list[list.length - 1];
  };
  D.tracer = function (c, P, x, y, r, m, label) {
    var tr = m.trail || (m.trail = []);
    var last = tr[tr.length - 1];
    if (!last || Math.hypot(last[0] - x, last[1] - y) > r * 0.9) { if (last && Math.hypot(last[0] - x, last[1] - y) > r * 12) tr.length = 0; tr.push([x, y]); if (tr.length > 16) tr.shift(); }
    for (var i = 0; i < tr.length; i++) { c.globalAlpha = 0.08 + 0.4 * i / tr.length; c.fillStyle = P.dark ? '#ffd84a' : '#d9a400'; c.beginPath(); c.arc(tr[i][0], tr[i][1], r * (0.35 + 0.4 * i / tr.length), 0, TAU); c.fill(); }
    c.globalAlpha = 1;
    var g = c.createRadialGradient(x, y, r * 0.6, x, y, r * 3.2);
    g.addColorStop(0, P.dark ? 'rgba(255,216,74,.55)' : 'rgba(242,190,30,.5)'); g.addColorStop(1, 'rgba(242,190,30,0)');
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r * 3.2, 0, TAU); c.fill();
    c.strokeStyle = P.dark ? '#ffd84a' : '#b58900'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, r * 1.9, 0, TAU); c.stroke();
    D.water(c, P, x, y, r * 1.1, m.a || 0);
    if (label !== false) D.tag(c, P, x + r * 2.4, y - r * 2.6, 'your molecule', { size: 10, alpha: 0.95 });
  };
  // rolling window counter: add(t, kind); n(t, kind) = events in the last `win` seconds
  MOL.Counter = function (win) {
    var ev = [];
    return { add: function (t, k) { ev.push([t, k]); if (ev.length > 2000) ev.splice(0, ev.length - 2000); },
      n: function (t, k) { while (ev.length && ev[0][0] < t - win) ev.shift(); var m = 0; for (var i = 0; i < ev.length; i++) if (!k || ev[i][1] === k) m++; return m; },
      clear: function () { ev = []; } };
  };
  // lipid bilayer between yTop and yBot, skipping [x0,x1] ranges occupied by proteins.
  // r5: `depth` rows of head groups recede behind the front row, so the slab shows a top face (designer panel item 3)
  D.bilayer = function (c, P, xa, xb, yTop, yBot, skip, phase, depth) {
    var r = clamp((yBot - yTop) * 0.085, 3.5, 7), step = r * 2.05, mid = (yTop + yBot) / 2;
    depth = depth == null ? 0 : depth;
    for (var kk = depth; kk >= 1; kk--) {
      var sc = Math.pow(0.86, kk), al = Math.pow(0.78, kk) * 0.9, yy = yTop + r - kk * r * 1.15, off = kk * r * 0.55, rr = r * sc;
      c.globalAlpha = al * 0.55; c.fillStyle = P.core; c.fillRect(xa, yy - rr * 0.2, xb - xa, r * 1.15);
      c.globalAlpha = al; c.fillStyle = P.head;
      for (var xq = xa + r + off - step; xq < xb; xq += step * sc) {
        if (xq < xa - rr) continue;
        c.beginPath(); c.arc(xq, yy, rr, 0, TAU); c.fill();
      }
      c.globalAlpha = al * 0.6; c.fillStyle = P.headHi || '#fff';
      for (xq = xa + r + off - step; xq < xb; xq += step * sc) { if (xq < xa - rr) continue; c.beginPath(); c.arc(xq - rr * 0.3, yy - rr * 0.35, rr * 0.35, 0, TAU); c.fill(); }
      c.globalAlpha = 1;
    }
    c.fillStyle = P.core; c.fillRect(xa, yTop + r, xb - xa, yBot - yTop - 2 * r);
    function free(x) { for (var i = 0; i < skip.length; i++) if (x > skip[i][0] - r && x < skip[i][1] + r) return false; return true; }
    c.strokeStyle = P.tail; c.lineWidth = Math.max(1, r * 0.22); c.lineCap = 'round';
    var n = 0;
    for (var x = xa + r; x < xb; x += step, n++) {
      if (!free(x)) continue;
      var wob = Math.sin(phase * 1.3 + n * 0.9) * r * 0.18;
      [[yTop + r, 1], [yBot - r, -1]].forEach(function (h) {
        for (var k = -1; k <= 1; k += 2) {
          var x0 = x + k * r * 0.32, y0 = h[0] + h[1] * r * 0.8, len = (mid - h[0]) * h[1] - r * 1.15;
          c.beginPath(); c.moveTo(x0, y0);
          for (var s = 1; s <= 4; s++) c.lineTo(x0 + Math.sin(s * 1.7 + n + k + wob) * r * 0.28, y0 + h[1] * len * s / 4);
          c.stroke();
        }
      });
    }
    n = 0;
    for (x = xa + r; x < xb; x += step, n++) {
      if (!free(x)) continue;
      var j = Math.sin(phase + n * 1.7) * r * 0.08;
      D.ball(c, x, yTop + r + j, r, P.head, P.headHi, P.headLo);
      D.ball(c, x, yBot - r - j, r, P.head, P.headHi, P.headLo);
    }
  };
  // rounded multi lobed protein blob with soft 3D shading; returns nothing
  D.protein = function (c, P, x, y0, y1, w, o) {
    o = o || {};
    var col = o.col || P.prot, hi = o.hi || P.protHi, lo = o.lo || P.protLo, lobes = o.lobes || 3, a = o.alpha == null ? 1 : o.alpha;
    c.globalAlpha = a;
    var g = c.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    g.addColorStop(0, lo); g.addColorStop(0.28, col); g.addColorStop(0.45, hi); g.addColorStop(0.62, col); g.addColorStop(1, lo);
    c.fillStyle = g;
    var lw = w / lobes;
    for (var i = 0; i < lobes; i++) {
      var cx = x - w / 2 + lw * (i + 0.5), bulge = (i % 2 ? 0.06 : -0.04) * (y1 - y0);
      rrect(c, cx - lw * 0.62, y0 + bulge, lw * 1.24, (y1 - y0) - bulge * 2, lw * 0.6); c.fill();
    }
    // rim light
    c.strokeStyle = P.dark ? 'rgba(190,215,255,.35)' : 'rgba(255,255,255,.55)'; c.lineWidth = 1.2;
    rrect(c, x - w / 2 + 2, y0 + 2, w - 4, (y1 - y0) - 4, w * 0.22); c.stroke();
    c.globalAlpha = 1;
  };
  // hourglass pore through a protein; returns the pore polyline centre x
  D.pore = function (c, P, x, y0, y1, wide, narrow, a) {
    var m = (y0 + y1) / 2;
    c.globalAlpha = a == null ? 1 : a;
    c.fillStyle = P.pore;
    c.beginPath();
    c.moveTo(x - wide, y0); c.quadraticCurveTo(x - narrow, m - (y1 - y0) * 0.1, x - narrow, m); c.quadraticCurveTo(x - narrow, m + (y1 - y0) * 0.1, x - wide, y1);
    c.lineTo(x + wide, y1); c.quadraticCurveTo(x + narrow, m + (y1 - y0) * 0.1, x + narrow, m); c.quadraticCurveTo(x + narrow, m - (y1 - y0) * 0.1, x + wide, y0);
    c.closePath(); c.fill();
    c.globalAlpha = 1;
  };

  /* ------------------------------------------------------------ the theatre (canvas host, loop, visibility) */
  MOL.live = [];
  MOL.Theatre = function (host, scene, opts) {
    opts = opts || {};
    var T = { scene: scene, paused: false, visible: true, raf: 0, last: 0, t: 0, dark: !!opts.dark, reduce: !!opts.reduce };
    var cv = document.createElement('canvas');
    cv.className = 'mol-canvas';
    cv.setAttribute('role', 'img');
    cv.setAttribute('aria-label', opts.label || 'Animated molecular scene');
    cv.style.display = 'block'; cv.style.width = '100%'; cv.style.borderRadius = '6px';
    host.appendChild(cv);
    var ctx = cv.getContext('2d');
    T.canvas = cv; T.names = MOL.Namer(); MOL.live.push(T); // MOL.live: every theatre on the page (tests read T.t, the drawn clock)
    function heightFor(w) { return typeof opts.height === 'function' ? opts.height(w) : (opts.height || 300); }
    function size() {
      var w = Math.max(240, host.clientWidth || 600), h = heightFor(w), dpr = Math.min(2, window.devicePixelRatio || 1);
      if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
        cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); cv.style.height = h + 'px';
      }
      T.w = w; T.h = h; T.dpr = dpr;
      if (scene.layout) scene.layout(w, h);
    }
    function draw(dt) {
      var P = MOL.palette(T.dark);
      ctx.setTransform(T.dpr, 0, 0, T.dpr, 0, 0);
      ctx.clearRect(0, 0, T.w, T.h);
      if (dt > 0 && scene.step) scene.step(dt, T.t);
      T.names.begin(T.w, T.h);
      try { scene.draw(ctx, P, T.w, T.h, T.t, T); } finally { T.names.end(ctx, P); }
    }
    function loop(ts) {
      T.raf = 0;
      if (!T.visible || document.hidden || T.paused || T.reduce) return;
      var dt = T.last ? Math.min(0.05, (ts - T.last) / 1000) : 0.016; dt *= (window.PlaySpeed ? window.PlaySpeed.get() : 1); T.last = ts; T.t += dt;
      draw(dt);
      T.raf = requestAnimationFrame(loop);
    }
    T.kick = function () {
      if (T.reduce || T.paused) { size(); draw(0); return; } // one still frame
      if (!T.raf && T.visible && !document.hidden) { T.last = 0; T.raf = requestAnimationFrame(loop); }
    };
    T.redraw = function () { size(); draw(0); };
    if (window.MolNames) window.MolNames.on(function () { if (T.canvas && T.canvas.isConnected) T.redraw(); });
    T.set = function (p) { if (scene.set) scene.set(p); if (T.reduce) T.still(); if (T.reduce || T.paused || !T.raf) T.redraw(); T.kick(); };
    T.setTheme = function (dark) { T.dark = !!dark; T.redraw(); };
    T.still = function () { if (scene.settle) scene.settle(); T.prewarm(6); };
    T.setReduce = function (r) { var was = T.reduce; T.reduce = !!r; if (T.reduce && !was) T.still(); T.kick(); };
    T.pause = function (p) { T.paused = p == null ? !T.paused : !!p; if (!T.paused) T.kick(); else T.redraw(); return T.paused; };
    T.destroy = function () { if (T.raf) cancelAnimationFrame(T.raf); if (T.io) T.io.disconnect(); if (T.ro) T.ro.disconnect(); cv.remove(); };
    if ('IntersectionObserver' in window) {
      T.io = new IntersectionObserver(function (es) { T.visible = !!(es[0] && es[0].isIntersecting); if (T.visible) T.kick(); });
      T.io.observe(cv);
    }
    if ('ResizeObserver' in window) { T.ro = new ResizeObserver(function () { T.redraw(); }); T.ro.observe(host); }
    document.addEventListener('visibilitychange', function () { if (!document.hidden) T.kick(); });
    size();
    T.prewarm = function (sec) { if (!scene.step) return; for (var i = 0, n = Math.round((sec || 4) / 0.05); i < n; i++) scene.step(0.05, 0); };
    T.prewarm(opts.prewarm || 4);
    draw(0); T.kick();
    return T;
  };
  /* ------------------------------------------------------------ path helpers for flow scenes */
  function pathPrep(pts) {
    var L = [0];
    for (var i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
    return { pts: pts, L: L, len: L[L.length - 1] };
  }
  function pathAt(P, d) {
    var pts = P.pts, L = P.L;
    if (d <= 0) return { x: pts[0].x, y: pts[0].y, i: 0 };
    if (d >= P.len) { var e = pts[pts.length - 1]; return { x: e.x, y: e.y, i: pts.length - 1 }; }
    var i = 1; while (L[i] < d) i++;
    var t = (d - L[i - 1]) / Math.max(1e-9, L[i] - L[i - 1]);
    return { x: lerp(pts[i - 1].x, pts[i].x, t), y: lerp(pts[i - 1].y, pts[i].y, t), i: i };
  }
  MOL.path = { prep: pathPrep, at: pathAt };
  // a small aquaporin drawn on a membrane: a rounded blue blob with a dark pore line, angle = membrane normal
  D.aqp = function (c, P, x, y, s, ang, a, open) {
    c.save(); c.translate(x, y); c.rotate(ang || 0); c.globalAlpha = a == null ? 1 : a;
    var g = c.createLinearGradient(-s, 0, s, 0); g.addColorStop(0, P.protLo); g.addColorStop(0.45, P.protHi); g.addColorStop(1, P.prot);
    c.fillStyle = g; rrect(c, -s * 0.7, -s, s * 1.4, s * 2, s * 0.55); c.fill();
    c.strokeStyle = P.pore; c.lineWidth = Math.max(1, s * 0.22);
    c.beginPath(); c.moveTo(0, -s * 0.9); c.lineTo(0, s * 0.9); c.stroke();
    if (open === false) { c.strokeStyle = P.loop; c.lineWidth = Math.max(1.4, s * 0.3); c.beginPath(); c.moveTo(-s * 0.6, s * 0.95); c.lineTo(s * 0.6, s * 0.95); c.stroke(); }
    c.restore();
  };
  // soil grain: a rounded irregular stone
  D.grain = function (c, P, x, y, r, seed, wet) {
    var R = rng(seed), n = 9, pts = [];
    for (var i = 0; i < n; i++) { var t = i * TAU / n, rr = r * (0.78 + 0.3 * R()); pts.push([x + Math.cos(t) * rr, y + Math.sin(t) * rr * 0.86]); }
    if (wet > 0.02) { // water film
      c.fillStyle = P.dark ? 'rgba(90,150,255,' + (0.28 * wet).toFixed(3) + ')' : 'rgba(43,95,164,' + (0.22 * wet).toFixed(3) + ')';
      c.beginPath(); c.ellipse(x, y, r * 1.28, r * 1.16, 0, 0, TAU); c.fill();
    }
    var g = c.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r * 1.1);
    g.addColorStop(0, P.dark ? '#a08a66' : '#efe1c2'); g.addColorStop(1, P.dark ? '#4f4130' : '#b49f78');
    c.fillStyle = g; c.beginPath();
    pts.forEach(function (p, i) { var q = pts[(i + 1) % n]; var mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2; if (!i) c.moveTo(mx, my); else c.quadraticCurveTo(p[0], p[1], mx, my); });
    c.quadraticCurveTo(pts[0][0], pts[0][1], (pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2);
    c.closePath(); c.fill();
  };

  /* ============================================================ scene: aquaporins in a bundle sheath membrane
     set({ caps:[0..1 x4] (1 = loop D capped), phos:[bool x4], prot: 0..1 protonated share, ca: bool, ko: bool,
           pfLipid, pfChannel (µm s−1, the model's two terms; pfChannel already includes expression), pump: 0..1 blue light pump drive,
           mode: 'pull' (same driving force: crossings ∝ Pf, the swelling test) | 'steady' (crossings ∝ E), E,
           expr: relative PIP abundance (0.2 to 1.6) sets how many tetramers sit in the membrane: 1 to 4 (drawn count),
           aba: bool (xylem ABA: pump shown inhibited) })
     Visual rate scale: 'pull' 0.08 crossings s−1 per µm s−1 of Pf; 'steady' 3.4 crossings s−1 per mmol m−2 s−1 of E.
     Channels leaving the membrane are drawn inside an endocytic vesicle sinking into the cytosol; new ones arrive the same way. */
  MOL.scenes = {};
  MOL.scenes.aquaporin = function () {
    var S = { p: { caps: [0, 0, 0, 0], phos: [true, true, true, true], prot: 0, ca: false, ko: false, pfLipid: 20, pfChannel: 135, pump: 1, mode: 'pull', E: 3, expr: 1, aba: false },
      caps: [0, 0, 0, 0], vis: [0, 1, 1, 0], free: [], cross: [], lip: [], hp: [], pumpQ: [], spent: [], atpK: 1, atpKey: {}, caKey: [{}, {}, {}, {}, {}, {}, {}, {}], acc: [0, 0, 0, 0, 0, 0, 0, 0], accL: 0, accP: 0, g: null, R: rng(7), counts: { ch: 0, lip: 0 }, rate: { ch: 0, lip: 0 }, clock: 0, cnt: MOL.Counter(5) };
    var R = S.R, ORDER = [1, 2, 0, 3];
    function nTarget() { return clamp(Math.round(S.p.expr * 2.5 - 0.5), 1, 4); }
    function slotOn(j) { return ORDER.indexOf(j) < nTarget(); }
    var KO = ORDER[0];
    S.nTarget = nTarget;
    S.set = function (p) { for (var k in p) S.p[k] = p[k]; };
    S.settle = function () { S.caps = S.p.caps.slice(); for (var j = 0; j < 4; j++) S.vis[j] = slotOn(j) ? 1 : 0; S.cross = []; S.lip = []; S.acc = [0, 0, 0, 0, 0, 0, 0, 0]; };
    S.layout = function (w, h) {
      var narrow = w < 560;
      var yT = Math.round(h * 0.40), yB = Math.round(h * 0.64);
      var tw = narrow ? Math.max(48, w * 0.15) : Math.min(150, w * 0.15);
      var xs = narrow ? [0.11, 0.30, 0.49, 0.68] : [0.12, 0.31, 0.50, 0.69];
      var G = { w: w, h: h, yT: yT, yB: yB, narrow: narrow, r: clamp(w / 152, 5.1, 8), // 13 Oct: molecules about 12 % larger
        slots: xs.map(function (f) { return { x: w * f, w: tw }; }),
        pump: { x: w * (narrow ? 0.875 : 0.87), w: narrow ? Math.max(40, w * 0.11) : Math.min(100, w * 0.1) } };
      G.pores = [];
      G.slots.forEach(function (t) { G.pores.push(t.x - t.w * 0.24, t.x + t.w * 0.24); });
      var first = !S.g; S.g = G;
      if (first || S.free.length === 0) seedFree();
    };
    function seedFree() {
      var G = S.g; S.free = [];
      var nW = G.narrow ? 16 : 28;
      for (var i = 0; i < nW; i++) {
        var top = R() < 0.62; // the side water comes from is drawn more crowded: crowding stands in for higher Ψ
        S.free.push({ k: 'w', x: R() * G.w, y: top ? 16 + R() * (G.yT - 30) : G.yB + 14 + R() * (G.h - G.yB - 22), a: R() * TAU, top: top });
      }
      for (i = 0; i < (G.narrow ? 3 : 5); i++) S.free.push({ k: 'K', x: R() * G.w, y: G.yB + 20 + R() * (G.h - G.yB - 30), a: 0, top: false });
      for (i = 0; i < (G.narrow ? 2 : 3); i++) S.free.push({ k: 's', x: R() * G.w, y: G.yB + 22 + R() * (G.h - G.yB - 34), a: R() * TAU, top: false });
      S.hp = [];
      var nH = Math.round((G.narrow ? 5 : 8) * (0.35 + 0.65 * S.p.pump));
      for (i = 0; i < nH; i++) S.hp.push({ x: R() * G.w, y: 14 + R() * (G.yT - 28), a: 1 });
    }
    function inserted(j) { return S.vis[j] > 0.92; }
    function poreOpen(i) { var j = i >> 1; if (!inserted(j) || (S.p.ko && j === KO)) return 0; return 1 - S.caps[i % 4]; }
    S.step = function (dt) {
      var G = S.g, p = S.p; if (!G) return;
      S.clock += dt;
      for (var i = 0; i < 4; i++) S.caps[i] += (p.caps[i] - S.caps[i]) * Math.min(1, dt * 4);
      for (var j = 0; j < 4; j++) { var tv = slotOn(j) ? 1 : 0; S.vis[j] += clamp(tv - S.vis[j], -dt * 0.55, dt * 0.55); }
      var openSum = 0; for (i = 0; i < 8; i++) openSum += poreOpen(i);
      var chRate, lipRate;
      if (p.mode === 'steady') {
        var tot = 3.4 * Math.max(0, p.E), pf = p.pfLipid + p.pfChannel;
        chRate = tot * (pf > 0 ? p.pfChannel / pf : 0); lipRate = tot - chRate;
      } else { chRate = 0.08 * p.pfChannel; lipRate = 0.08 * p.pfLipid; }
      S.rate.ch = chRate; S.rate.lip = lipRate;
      for (i = 0; i < 8; i++) {
        var share = openSum > 0 ? poreOpen(i) / openSum : 0;
        S.acc[i] += chRate * share * dt;
        var lastT = 1; S.cross.forEach(function (m) { if (m.pore === i && m.t < lastT) lastT = m.t; });
        while (S.acc[i] >= 1 && lastT > 0.16) { S.acc[i] -= 1; S.cross.push({ pore: i, t: 0, a: R() * TAU, jx: (R() - 0.5) * 18 }); lastT = 0; }
        if (S.acc[i] > 3) S.acc[i] = 3;
      }
      S.accL += lipRate * dt;
      while (S.accL >= 1) {
        S.accL -= 1;
        var x, tries = 0;
        do { x = 10 + R() * (G.w - 20); tries++; } while (tries < 20 && G.slots.some(function (s, jj) { return S.vis[jj] > 0.5 && x > s.x - s.w / 2 - 8 && x < s.x + s.w / 2 + 8; }) || Math.abs(x - G.pump.x) < G.pump.w / 2 + 8);
        S.lip.push({ x: x, t: 0, a: R() * TAU });
      }
      S.cross.forEach(function (m) { m.t += dt * (m.t > 0.25 && m.t < 0.75 ? 0.55 : 0.85); m.a += dt * 3; });
      S.cross = S.cross.filter(function (m) { if (m.t >= 1) { S.counts.ch++; S.cnt.add(S.clock, 'ch'); return false; } return true; });
      S.lip.forEach(function (m) { m.t += dt * 0.32; m.a += dt; });
      S.lip = S.lip.filter(function (m) { if (m.t >= 1) { S.counts.lip++; S.cnt.add(S.clock, 'lip'); return false; } return true; });
      S.free.forEach(function (m) {
        m.x += (R() - 0.5) * 22 * dt + (m.k === 'w' ? Math.sin(m.a) * 3 * dt : 0); m.y += (R() - 0.5) * 22 * dt; m.a += (R() - 0.5) * dt * 2;
        if (m.x < 0) m.x += G.w; if (m.x > G.w) m.x -= G.w;
        if (m.top) m.y = clamp(m.y, 12, G.yT - 14); else m.y = clamp(m.y, G.yB + 14, G.h - 10);
      });
      S.accP += (2.2 * p.pump) * dt;
      while (S.accP >= 1) { S.accP -= 1; S.pumpQ.push({ t: 0 }); if (S.atpK > 0.35) { S.spent.push({ t: 0, x: G.pump.x - G.pump.w * 0.3, y: G.yB + 38, a: R() * TAU, vx: -(14 + R() * 10), px: 10 + R() * 10 }); S.atpK = 0; } }
      S.atpK = Math.min(1, S.atpK + dt * 3.5); // the next ATP arrives from the cytosol
      S.spent.forEach(function (q) { q.t += dt; q.a += dt; });
      S.spent = S.spent.filter(function (q) { return q.t < 1.6; });
      S.pumpQ.forEach(function (q) { q.t += dt * 0.7; });
      S.pumpQ = S.pumpQ.filter(function (q) {
        if (q.t >= 1) { S.hp.push({ x: G.pump.x + (R() - 0.5) * 30, y: G.yT - 16, a: 1 }); return false; } return true;
      });
      var target = Math.round((G.narrow ? 5 : 8) * (0.35 + 0.65 * p.pump)) + 2;
      while (S.hp.length > target) S.hp.shift();
      S.hp.forEach(function (hh) { hh.x += (R() - 0.5) * 30 * dt; hh.y += (R() - 0.5) * 30 * dt; hh.y = clamp(hh.y, 12, G.yT - 12); if (hh.x < 0) hh.x += G.w; if (hh.x > G.w) hh.x -= G.w; });
    };
    function crossPos(m) {
      var G = S.g, x = G.pores[m.pore], t = m.t;
      var y = lerp(G.yT - 34, G.yB + 34, t);
      var off = t < 0.2 ? m.jx * (1 - t / 0.2) : (t > 0.8 ? m.jx * ((t - 0.8) / 0.2) : 0);
      return { x: x + off, y: y };
    }
    function vesicle(c, P, x, y, r, a) {
      c.globalAlpha = a; c.fillStyle = P.core; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.globalAlpha = 1;
      var hr = clamp(r * 0.13, 2.4, 4.4), n = Math.max(10, Math.round(TAU * r / (hr * 2.1)));
      for (var i = 0; i < n; i++) { var t = i * TAU / n; D.ball(c, x + Math.cos(t) * r, y + Math.sin(t) * r, hr, P.head, P.headHi, P.headLo, a); }
    }
    S.draw = function (c, P, w, h, t, T) {
      var G = S.g, p = S.p; if (!G) return;
      var NM = T && T.names;
      var bg = c.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, P.bgTop); bg.addColorStop(0.5, P.bgMid); bg.addColorStop(1, P.bgBot);
      c.fillStyle = bg; c.fillRect(0, 0, w, h);
      c.fillStyle = P.dark ? 'rgba(255,216,74,' + (0.05 * p.pump).toFixed(3) + ')' : 'rgba(242,194,48,' + (0.09 * p.pump).toFixed(3) + ')';
      c.fillRect(0, 0, w, G.yT);
      c.save(); c.globalAlpha = 0.28; if (c.filter !== undefined) c.filter = 'blur(1.6px)';
      S.free.forEach(function (m, i) { if (i % 3 === 0 && m.k === 'w') D.water(c, P, (m.x * 1.7) % w, m.y * 0.96 + 4, G.r * 0.6, m.a); });
      c.restore(); if (c.filter !== undefined) c.filter = 'none';
      var skip = [];
      G.slots.forEach(function (s, j) { if (S.vis[j] > 0.5) skip.push([s.x - s.w / 2, s.x + s.w / 2]); });
      skip.push([G.pump.x - G.pump.w / 2, G.pump.x + G.pump.w / 2]);
      // net flux, behind everything: width follows the model crossing rate (molecules s−1 on this drawing's scale)
      var fluxN = S.rate.ch + S.rate.lip, fmid = (G.slots[0].x + G.slots[3].x) / 2;
      if (fluxN > 0.05) D.flux(c, P, fmid, 6, fmid, h - 6, clamp(10 + fluxN * 4.2, 10, G.narrow ? 120 : 220), P.dark ? 0.2 : 0.14);
      D.bilayer(c, P, 0, w, G.yT, G.yB, skip, t * 1.4, G.narrow ? 2 : 3);
      // tetramers in the membrane, or travelling in a vesicle
      G.slots.forEach(function (T, j) {
        var v = S.vis[j]; if (v < 0.02) return;
        var ko = p.ko && j === KO;
        if (v > 0.92) {
          D.protein(c, P, T.x, G.yT - 16, G.yB + 16, T.w, { lobes: 4, alpha: ko ? 0.22 : 1 });
          [0, 1].forEach(function (k) { D.pore(c, P, G.pores[j * 2 + k], G.yT - 16, G.yB + 16, T.w * 0.085, 3.2, ko ? 0.25 : 1); });
        } else {
          var depth = (G.h - G.yB) * 0.62, cy = (G.yT + G.yB) / 2 + (1 - v) * depth, rv = T.w * 0.5;
          vesicle(c, P, T.x, cy, rv, 0.25 + 0.75 * v);
          D.protein(c, P, T.x, cy - rv * 0.55, cy + rv * 0.55, T.w * 0.6, { lobes: 4, alpha: 0.3 + 0.7 * v });
        }
      });
      var Pm = G.pump;
      D.protein(c, P, Pm.x, G.yT - 20, G.yB + 24, Pm.w, { lobes: 3, col: P.prot2, hi: P.prot2Hi, lo: P.prot2Lo, alpha: p.aba ? 0.55 : 1 });
      S.pumpQ.forEach(function (q) { D.proton(c, P, Pm.x + Math.sin(q.t * 9) * 3, lerp(G.yB + 30, G.yT - 16, q.t), G.r, 0.95); });
      // ATP docks at the pump on the cytosol side; each H⁺ pumped out spends one ATP: ADP and Pᵢ drift back into the cytosol
      S.spent.forEach(function (q) {
        var f = q.t / 1.6, al = 0.95 * Math.min(1, (1 - f) * 2.5);
        D.adp(c, P, q.x + q.vx * q.t, q.y + 26 * q.t, G.r * 1.55, q.a, al);
        D.phosphate(c, P, q.x + q.px * q.t + 12, q.y + 18 + 30 * q.t, G.r * 0.95, al);
        if (NM && f < 0.75) { NM.add('ADP', q, q.x + q.vx * q.t, q.y + 26 * q.t, G.r * 1.55, 'ADP', { all: true }); NM.add('Pi', q, q.x + q.px * q.t + 12, q.y + 18 + 30 * q.t, G.r * 0.95, 'Pᵢ', { all: true }); }
      });
      if (p.pump > 0.02) {
        var ax = Pm.x - Pm.w * 0.3, ay = G.yB + 38 + Math.sin(t * 3) * 2 + (1 - S.atpK) * 22;
        D.atp(c, P, ax, ay, G.r * 1.9, t * 0.8, 0.3 + 0.65 * S.atpK);
        if (NM && S.atpK > 0.3) NM.add('ATP', S.atpKey, ax, ay, G.r * 1.9, 'ATP', { all: true, pri: 2 });
      }
      S.free.forEach(function (m) {
        if (m.k === 'w') { D.water(c, P, m.x, m.y, G.r, m.a); if (NM && !G.narrow) NM.add('w', m, m.x, m.y, G.r, 'H₂O', { q: 1 }); }
        else if (m.k === 'K') { D.ion(c, P, m.x, m.y, G.r * 1.3, P.K, 'K⁺'); if (NM && !G.narrow) NM.add('K', m, m.x, m.y, G.r * 1.3, 'K⁺'); }
        else { D.sucrose(c, P, m.x, m.y, G.r * 1.5, m.a, 0.92); if (NM && !G.narrow) NM.add('suc', m, m.x, m.y, G.r * 1.2, 'sucrose', { q: 1 }); }
      });
      S.hp.forEach(function (hh) { D.proton(c, P, hh.x, hh.y, G.r * 1.1); if (NM) NM.add('H', hh, hh.x, hh.y, G.r * 1.1, 'H⁺'); });
      S.lip.forEach(function (m) { var y = lerp(G.yT - 20, G.yB + 20, m.t); D.water(c, P, m.x, y, G.r * 0.85, m.a, m.t > 0.15 && m.t < 0.85 ? 0.55 : 0.9); });
      S.cross.forEach(function (m) { if (m.tr) return; var q = crossPos(m); D.water(c, P, q.x, q.y, G.r * 0.9, m.t > 0.25 && m.t < 0.75 ? Math.PI / 2 : m.a); if (NM && m.t > 0.08 && m.t < 0.9) NM.add('pore', m, q.x, q.y, G.r * 0.9, 'H₂O', { q: 1 }); });
      var tq = MOL.pick(S.cross); if (tq) { var qq = crossPos(tq); D.tracer(c, P, qq.x, qq.y, G.r * 0.9, tq, !G.narrow); }
      // gates on inserted tetramers
      for (var i = 0; i < 8; i++) {
        var j = i >> 1, ko = p.ko && j === KO, x = G.pores[i], yb = G.yB + 16, tw = G.slots[j].w;
        if (ko || S.vis[j] <= 0.92) continue;
        var cap = S.caps[i % 4], side = i % 2 ? 1 : -1;
        var ang = lerp(side * 1.25, 0, cap), len = tw * 0.2;
        c.save(); c.translate(x - side * len * 0.15, yb + 2); c.rotate(ang);
        c.strokeStyle = P.loop; c.lineWidth = G.narrow ? 4 : 5; c.lineCap = 'round';
        c.beginPath(); c.moveTo(-len * 0.55, 0); c.quadraticCurveTo(0, 12 * (0.4 + 0.6 * cap), len * 0.55, 0); c.stroke();
        var protOn = p.prot > 0.5 ? cap > 0.3 : (p.prot > 0.2 && cap > 0.6);
        D.ball(c, 0, 9 * (0.4 + 0.6 * cap), 3.4, protOn ? P.hisP : P.his, '#ffffff', shade(P.his, -0.4));
        c.restore();
        if (protOn && !G.narrow) D.proton(c, P, x + side * 10, yb + 24, G.r * 0.95);
        if (p.phos[i % 4]) D.phosphate(c, P, x + side * tw * 0.22, G.yB + 26, G.r * 1.0);
        if (p.ca && cap > 0.4) { D.ion(c, P, x - side * 12, yb + 28, G.r, P.Ca, 'Ca'); if (NM) NM.add('Ca', S.caKey[i], x - side * 12, yb + 28, G.r, 'Ca²⁺'); }
      }
      var fs = G.narrow ? 10.5 : 11.5, nIn = 0;
      // live counters: what actually crossed in the last 5 s of this drawing
      var nCh = S.cnt.n(S.clock, 'ch'), nLp = S.cnt.n(S.clock, 'lip');
      D.tag(c, P, w - 8, h - 14, (G.narrow ? 'last 5 s: ' : 'crossed in the last 5 s: ') + nCh + ' by channel, ' + nLp + ' through lipid', { size: fs - 0.5, align: 'right' });
      if (!G.narrow) { D.tag(c, P, w - 8, 14, 'water comes from here (higher Ψ)', { size: fs - 1, align: 'right', alpha: 0.92 }); D.tag(c, P, w - 8, h - 40, 'lower Ψ inside the cell', { size: fs - 1, align: 'right', alpha: 0.92 }); }
      for (var jj = 0; jj < 4; jj++) if (S.vis[jj] > 0.92) nIn++;
      D.tag(c, P, 8, 14, G.narrow ? 'Apoplast (sap)' : 'Apoplast: sap arriving from the vein', { size: fs });
      D.tag(c, P, 8, h - 14, G.narrow ? 'Cytosol' : 'Cytosol of a bundle sheath cell', { size: fs });
      var mid = (G.slots[0].x + G.slots[3].x) / 2;
      D.tag(c, P, mid, G.yT - 36, (p.ko ? 'PIP2;1 absent, other PIPs: ' : 'PIP aquaporins: ') + nIn, { size: fs - 0.5, align: 'center' });
      D.tag(c, P, Pm.x, G.yB + 58 > h - 30 ? G.yT - 58 : G.yT - 58, G.narrow ? 'H⁺ pump' : (p.aba ? 'AHA2 H⁺ pump, ABA slows it' : 'AHA2 H⁺ pump'), { size: fs - 0.5, align: 'center' });
      var moving = -1;
      for (jj = 0; jj < 4; jj++) if (S.vis[jj] > 0.05 && S.vis[jj] < 0.92) moving = jj;
      if (moving >= 0) D.tag(c, P, G.slots[moving].x, Math.min(h - 34, (G.yT + G.yB) / 2 + (1 - S.vis[moving]) * (G.h - G.yB) * 0.62 + G.slots[moving].w * 0.5 + 12), slotOn(moving) ? 'arriving in a vesicle' : 'taken back in', { size: fs - 1, align: 'center' });
    };
    S.stats = function () { return { chRate: S.rate.ch, lipRate: S.rate.lip, inPore: S.cross.length, n: nTarget() }; };
    return S;
  };

  /* ============================================================ scene: a leaf in section, vapour leaving by two routes
     Stomata on the LOWER (abaxial) epidermis; the upper (adaxial) epidermis has a cuticle and no stoma.
     set({ open: 0..1 stomatal aperture (gs ÷ gsMax), Es, Emin (mmol m−2 s−1), VPD (kPa) })
     Rate scale: 5 vapour molecules s−1 per mmol m−2 s−1, one scale for both routes so the ratio is true.
     Cuticular loss is drawn through both surfaces (60 % upper, 40 % lower: a drawing choice). */
  MOL.scenes.cuticle = function () {
    var S = { p: { open: 0.5, Es: 3, Emin: 0.1, VPD: 2 }, open: 0.5, out: [], acc: 0, accC: 0, R: rng(11), cav: [], g: null };
    var R = S.R, K = 5;
    S.set = function (p) { for (var k in p) S.p[k] = p[k]; };
    S.settle = function () { S.open = S.p.open; S.out = []; S.acc = 0; S.accC = 0; };
    S.layout = function (w, h) {
      var narrow = w < 560;
      var G = { w: w, h: h, narrow: narrow, cut: Math.max(7, Math.round(h * 0.03)) };
      G.yU = Math.round(h * 0.15);               // top of upper cuticle
      G.yUe = Math.round(h * 0.26);              // bottom of upper epidermis
      G.yLe = Math.round(h * 0.57);              // top of lower epidermis
      G.yL = Math.round(h * 0.69);               // bottom of lower epidermis (lower cuticle below); air below the leaf under it
      G.sx = w * (narrow ? 0.56 : 0.55);
      S.g = G;
      if (!S.cav.length) for (var i = 0; i < (narrow ? 10 : 16); i++) S.cav.push({ x: R(), y: R(), a: R() * TAU });
    };
    S.step = function (dt) {
      var G = S.g, p = S.p; if (!G) return;
      S.open += (p.open - S.open) * Math.min(1, dt * 3);
      S.acc += K * Math.max(0, p.Es) * dt;
      while (S.acc >= 1) { S.acc -= 1; S.out.push({ via: 's', x: G.sx + (R() - 0.5) * 6, y: G.yLe - 6, vx: 0, vy: 70 + R() * 40, a: R() * TAU, life: 0 }); }
      S.accC += K * Math.max(0, p.Emin) * dt;
      while (S.accC >= 1) {
        S.accC -= 1;
        var up = R() < 0.6, x; do { x = 12 + R() * (G.w - 24); } while (!up && Math.abs(x - G.sx) < 50);
        if (up) S.out.push({ via: 'cu', x: x, y: G.yU + G.cut + 2, vy: -10, vx: 0, a: R() * TAU, life: 0, slow: true });
        else S.out.push({ via: 'cl', x: x, y: G.yL - 2, vy: 10, vx: 0, a: R() * TAU, life: 0, slow: true });
      }
      S.out.forEach(function (m) {
        m.life += dt; m.a += dt * 2;
        if (m.via === 'cu' && m.slow && m.y > G.yU - 4) { m.y -= 7 * dt; m.x += (R() - 0.5) * 6 * dt; return; }
        if (m.via === 'cl' && m.slow && m.y < G.yL + G.cut + 4) { m.y += 7 * dt; m.x += (R() - 0.5) * 6 * dt; return; }
        m.slow = false;
        var dir = m.via === 'cu' ? -1 : 1;
        var free = m.via === 'cu' ? m.y < G.yU - 6 : m.y > G.yL + 8;
        if (free && !m.fan) { m.fan = 1; m.vx = (R() - 0.5) * (m.via === 's' ? 120 : 30); m.vy = dir * Math.max(16, Math.abs(m.vy)); }
        m.x += m.vx * dt + (R() - 0.5) * 30 * dt; m.y += m.vy * dt;
        m.vx *= (1 - 0.5 * dt); m.vy *= (1 - 0.5 * dt); if (Math.abs(m.vy) < 16) m.vy = dir * 16;
      });
      S.out = S.out.filter(function (m) { return m.y > -10 && m.y < G.h + 10 && m.life < 14; });
      if (S.out.length > 260) S.out.splice(0, S.out.length - 260);
      S.cav.forEach(function (m) { m.x += (R() - 0.5) * 0.4 * dt; m.y += (R() - 0.5) * 0.4 * dt; m.x = clamp(m.x, 0.02, 0.98); m.y = clamp(m.y, 0.05, 0.95); m.a += dt; });
    };
    function epiRow(c, P, G, y0, y1, gapX, gapW) {
      var cellW = G.narrow ? 62 : 84;
      for (var x = -14; x < G.w; x += cellW) {
        if (gapX != null && x + cellW > gapX - gapW && x < gapX + gapW) continue;
        var g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, P.epiHi); g.addColorStop(1, P.epi);
        c.fillStyle = g; rrect(c, x + 2, y0, cellW - 4, y1 - y0, 9); c.fill();
        c.strokeStyle = P.dark ? 'rgba(160,200,150,.35)' : 'rgba(90,110,70,.45)'; c.lineWidth = 1.2; c.stroke();
      }
    }
    S.draw = function (c, P, w, h, t, T) {
      var G = S.g, p = S.p; if (!G) return;
      var NM = T && T.names;
      var airTop = P.dark ? '#0a121b' : '#f6f2e6', airBot = P.dark ? '#101b26' : '#ece6d4';
      var haze = clamp(1 - p.VPD / 3, 0, 1);
      // air above and below
      var g1 = c.createLinearGradient(0, 0, 0, G.yU); g1.addColorStop(0, airTop); g1.addColorStop(1, airBot);
      c.fillStyle = g1; c.fillRect(0, 0, w, G.yU);
      var g2 = c.createLinearGradient(0, G.yL, 0, h); g2.addColorStop(0, airBot); g2.addColorStop(1, airTop);
      c.fillStyle = g2; c.fillRect(0, G.yL, w, h - G.yL);
      c.fillStyle = P.dark ? 'rgba(140,170,200,' + (0.10 * haze).toFixed(3) + ')' : 'rgba(255,255,255,' + (0.35 * haze).toFixed(3) + ')';
      c.fillRect(0, 0, w, G.yU); c.fillRect(0, G.yL, w, h - G.yL);
      // mesophyll band
      c.fillStyle = P.cav; c.fillRect(0, G.yU, w, G.yL - G.yU);
      var mx0 = G.yUe + 4, mx1 = G.yLe - 4, nP = G.narrow ? 6 : 10;
      for (var i = 0; i < nP; i++) { // palisade: tall cells under the upper epidermis
        var px = (i + 0.5) * w / nP; if (Math.abs(px - G.sx) < 10) { /* keep */ }
        c.fillStyle = P.dark ? 'rgba(127,176,90,.22)' : 'rgba(95,138,60,.20)';
        rrect(c, px - w / nP * 0.36, mx0, w / nP * 0.72, (mx1 - mx0) * 0.46, 12); c.fill();
      }
      var nS = G.narrow ? 4 : 7;
      for (i = 0; i < nS; i++) { // spongy: round cells, with the cavity above the stoma left open
        var sx = (i + 0.5) * w / nS; if (Math.abs(sx - G.sx) < (G.narrow ? 46 : 60)) continue;
        c.fillStyle = P.dark ? 'rgba(127,176,90,.18)' : 'rgba(95,138,60,.16)';
        c.beginPath(); c.ellipse(sx, mx0 + (mx1 - mx0) * 0.74, w / nS * 0.32, (mx1 - mx0) * 0.2, 0, 0, TAU); c.fill();
      }
      S.cav.forEach(function (m) { D.water(c, P, G.sx - 60 + m.x * 120, mx0 + (mx1 - mx0) * (0.55 + 0.4 * m.y), 4, m.a, 0.5); });
      // upper epidermis + cuticle (no stoma)
      epiRow(c, P, G, G.yU + G.cut - 1, G.yUe, null, 0);
      var cg = c.createLinearGradient(0, G.yU, 0, G.yU + G.cut); cg.addColorStop(0, P.cutHi); cg.addColorStop(1, P.cut);
      c.fillStyle = cg; c.fillRect(0, G.yU, w, G.cut);
      c.fillStyle = P.dark ? 'rgba(255,240,184,.55)' : 'rgba(255,255,255,.75)';
      for (var x = 6; x < w; x += 13) c.fillRect(x, G.yU - 3 - (x * 7 % 3), 6, 3);
      // lower epidermis with the stoma
      var gap = 4 + 14 * S.open;
      epiRow(c, P, G, G.yLe, G.yL - Math.round(G.cut * 0.5), G.sx, 46);
      var poreL = G.sx - gap / 2 - 36, poreR = G.sx + gap / 2 + 36;
      var cg2 = c.createLinearGradient(0, G.yL - G.cut * 0.5, 0, G.yL + G.cut * 0.5); cg2.addColorStop(0, P.cut); cg2.addColorStop(1, P.cutHi);
      c.fillStyle = cg2; c.fillRect(0, G.yL - G.cut * 0.5, poreL, G.cut * 0.7); c.fillRect(poreR, G.yL - G.cut * 0.5, w - poreR, G.cut * 0.7);
      [-1, 1].forEach(function (s) {
        var cx = G.sx + s * (gap / 2 + 18), cy = (G.yLe + G.yL) / 2, ry = (G.yL - G.yLe) * 0.44;
        var gg = c.createRadialGradient(cx - s * 4, cy - ry * 0.4, 3, cx, cy, 28);
        gg.addColorStop(0, P.guardHi); gg.addColorStop(1, P.guard);
        c.fillStyle = gg; c.beginPath(); c.ellipse(cx, cy, 18, ry, 0, 0, TAU); c.fill();
        c.strokeStyle = P.dark ? 'rgba(200,240,180,.4)' : 'rgba(60,90,50,.5)'; c.lineWidth = 1.2; c.stroke();
        for (var k = 0; k < 3; k++) D.ball(c, cx + s * (k - 1) * 4, cy - ry * 0.5 + k * ry * 0.5, 2.4, P.dark ? '#7fb05a' : '#5f8a3c', '#d8f0c0', '#2c4a1a');
      });
      S.out.forEach(function (m) {
        D.water(c, P, m.x, m.y, m.via === 's' ? 5.2 : 4.8, m.a, m.via === 's' ? 0.85 : 0.95);
        // one vapour molecule named on its way out of the stoma, one through the cuticle (desktop only)
        if (NM && (m.via === 's' ? m.y > G.yL + 4 : !G.narrow)) NM.add(m.via === 's' ? 'vs' : 'vc', m, m.x, m.y, 5, 'H₂O', { q: 1 });
      });
      var fs = G.narrow ? 10.5 : 11.5;
      D.tag(c, P, 8, 13, G.narrow ? 'Air above (upper side)' : 'Air above the leaf: upper (adaxial) side', { size: fs });
      D.tag(c, P, w - 8, G.yU + G.cut + 12, G.narrow ? 'cuticle, no stomata' : 'cuticle on the upper epidermis: no stomata here', { size: fs - 0.5, align: 'right' });
      D.tag(c, P, 8, (G.yUe + G.yLe) / 2, 'mesophyll', { size: fs - 0.5, alpha: 0.92 });
      D.tag(c, P, G.sx, G.yLe - 14, 'substomatal cavity', { size: fs - 1, align: 'center', alpha: 0.92 });
      D.tag(c, P, G.sx, h - 13, S.open < 0.03 ? 'stoma, shut' : (S.open < 0.15 ? 'stoma, nearly shut' : 'stoma on the lower side'), { size: fs - 0.5, align: 'center' });
      if (!G.narrow) D.tag(c, P, 8, h - 13, 'Air below the leaf: lower (abaxial) side', { size: fs });
    };
    return S;
  };

  /* ============================================================ scene: the root radial path
     Soil on the left, then epidermis, cortex, endodermis with the Casparian strip, pericycle and a xylem vessel.
     set({ flux: inward water molecules s−1 (the caller scales it from a model rate), aqp: 0..1 open aquaporins,
           shrink: 0..0.4 radial shrinkage of the root (Agave deserti: 0.24 after 7 d, 0.34 after 14 d), soilWet: 0..1,
           casparian: bool, leak: outward attempts s−1 (soil drier than the root), ions: bool, mode: 'crop' | 'agave' })
     Interface rule (drawing): inflow × 1 ÷ (1 + 4 × shrink ÷ 0.34), so a 34 % shrink cuts it 5 fold, as North and Nobel 1997 report
     for the root to soil interface. Water that tries to leave the root stops at an open air gap: a one way valve. */
  MOL.scenes.root = function () {
    var S = { p: { flux: 6, aqp: 1, shrink: 0, soilWet: 1, casparian: true, leak: 0, ions: true, mode: 'crop' },
      sh: 0, wet: 1, mol: [], ions: [], soilW: [], xyl: [], bounce: [], acc: 0, accL: 0, accI: 0, R: rng(5), g: null, counts: { in: 0, blocked: 0, ionStop: 0, ionLeak: 0 }, clock: 0, cnt: MOL.Counter(5) };
    var R = S.R;
    S.set = function (p) { for (var k in p) S.p[k] = p[k]; };
    S.settle = function () { S.sh = S.p.shrink; S.wet = S.p.soilWet; S.mol = []; S.ions = []; S.bounce = []; geom(); };
    S.layout = function (w, h) {
      var narrow = w < 560, G = { w: w, h: h, narrow: narrow }, old = S.g;
      if (old && (Math.abs(old.w - w) > 1 || Math.abs(old.h - h) > 1)) { // resized: carry molecules in flight onto the new geometry
        var kx = w / old.w, ky = h / old.h;
        S.mol.forEach(function (m) { var f = m.d / Math.max(1e-6, m.P.len); m.P = pathPrep(m.P.pts.map(function (q) { var o = {}; for (var k in q) o[k] = q[k]; o.x = q.x * kx; o.y = q.y * ky; return o; })); m.d = f * m.P.len; });
        S.ions.forEach(function (o) { o.x *= kx; o.y *= ky; }); S.bounce.forEach(function (b) { b.x *= kx; b.y *= ky; });
        S.soilW.forEach(function (m) { m.x *= kx; m.y *= ky; });
      }
      G.yTop = Math.round(h * 0.16); G.yBot = Math.round(h * 0.86); G.rows = 3; G.rh = (G.yBot - G.yTop) / 3;
      G.xS = Math.round(w * (narrow ? 0.2 : 0.18));
      G.wt = narrow ? 3 : 4;
      G.r = clamp(w / 180, 3.6, 6);
      G.grains = [];
      var R2 = rng(19), n = narrow ? 9 : 14;
      for (var i = 0; i < n; i++) G.grains.push({ x: 8 + R2() * (G.xS - 18), y: G.yTop - 10 + R2() * (G.yBot - G.yTop + 20), r: (narrow ? 9 : 12) + R2() * (narrow ? 7 : 10), seed: 30 + i });
      S.g = G; geom();
      if (!S.soilW.length) for (i = 0; i < (narrow ? 10 : 16); i++) S.soilW.push({ x: R() * G.xS, y: G.yTop + R() * (G.yBot - G.yTop), a: R() * TAU });
      if (!S.xyl.length) for (i = 0; i < (narrow ? 6 : 10); i++) S.xyl.push({ u: R(), y: R(), a: R() * TAU });
    };
    // column geometry: built from the xylem (fixed, right) leftwards; epidermis and cortex shrink
    function geom() {
      var G = S.g; if (!G) return;
      var Wr = G.w - G.xS, f = S.p.mode === 'agave' ? [0.11, 0.2, 0.2, 0.1, 0.07, 0.32] : [0.12, 0.17, 0.17, 0.12, 0.08, 0.34];
      var shrinkF = 1 - 1.55 * S.sh; // epidermis and cortex absorb the radial shrink
      var widths = [f[0] * Wr * shrinkF, f[1] * Wr * shrinkF, f[2] * Wr * shrinkF, f[3] * Wr, f[4] * Wr, f[5] * Wr];
      var x = G.w, xs = [];
      for (var i = widths.length - 1; i >= 0; i--) { x -= widths[i]; xs[i] = x; }
      G.col = xs.map(function (x0, i) { return { x0: x0, x1: x0 + widths[i] }; });
      G.xR0 = G.col[0].x0; G.gap = G.xR0 - G.xS;
      G.xEn0 = G.col[3].x0; G.xEn1 = G.col[3].x1; G.xPe1 = G.col[4].x1; G.xX = G.col[5].x0;
      G.wallY = [1, 2].map(function (k) { return G.yTop + k * G.rh; });
      G.rowY = [0, 1, 2].map(function (k) { return G.yTop + (k + 0.5) * G.rh; });
    }
    function inflowPath(kind, row) {
      var G = S.g, y0 = G.yTop + R() * (G.yBot - G.yTop), pts = [];
      pts.push({ x: 4 + R() * (G.xS * 0.5), y: y0 });
      if (kind === 'apo') {
        var yw = G.wallY[row];
        pts.push({ x: G.xS - 2, y: yw + (R() - 0.5) * 6 }, { x: G.xR0, y: yw });
        if (S.p.casparian) {
          var sgn = R() < 0.5 ? -1 : 1;
          // the band stops the wall route: the molecule must turn into the endodermal cell (crossing its membrane) and out again
          pts.push({ x: G.xEn0 - 3, y: yw }, { x: G.xEn0 + G.wt + 1, y: yw + sgn * G.rh * 0.36, m: 1, en: 1 }, { x: (G.xEn0 + G.xEn1) / 2, y: yw + sgn * G.rh * 0.4, en: 1 },
            { x: G.xEn1 - G.wt - 1, y: yw + sgn * G.rh * 0.36, m: 1, en: 1 }, { x: G.xEn1 + 2, y: yw });
        }
        pts.push({ x: G.xX - 2, y: yw }, { x: G.xX + 10, y: yw + (R() - 0.5) * 10 });
      } else {
        var yc = G.rowY[row] + (R() - 0.5) * G.rh * 0.3;
        pts.push({ x: G.xS - 2, y: yc }, { x: G.xR0 + G.wt + 1, y: yc, m: 1 });
        for (var i = 0; i < 5; i++) {
          var c = G.col[i];
          pts.push({ x: (c.x0 + c.x1) / 2, y: yc + (R() - 0.5) * G.rh * 0.2 });
          if (i < 4) pts.push({ x: c.x1 - G.wt - 1, y: yc, m: 1 }, { x: c.x1 + G.wt + 1, y: yc, m: 1 });
        }
        pts.push({ x: G.xX - G.wt - 1, y: yc, m: 1 }, { x: G.xX + 10, y: yc });
      }
      return pts;
    }
    function spawn() {
      var kind = R() < (0.35 + 0.25 * S.p.aqp) ? 'tm' : 'apo';
      var row = kind === 'apo' ? (R() < 0.5 ? 0 : 1) : Math.floor(R() * 3);
      var P0 = pathPrep(inflowPath(kind, row));
      S.mol.push({ P: P0, d: 0, a: R() * TAU, kind: kind });
    }
    S.step = function (dt) {
      var G = S.g, p = S.p; if (!G) return;
      S.clock += dt;
      var oldSh = S.sh;
      S.sh += clamp(p.shrink - S.sh, -dt * 0.08, dt * 0.08);
      S.wet += (p.soilWet - S.wet) * Math.min(1, dt * 1.5);
      if (Math.abs(oldSh - S.sh) > 1e-6) geom();
      var iface = 1 / (1 + 4 * S.sh / 0.34);
      S.acc += Math.max(0, p.flux) * iface * dt;
      while (S.acc >= 1) { S.acc -= 1; spawn(); }
      S.accL += Math.max(0, p.leak) * dt;
      while (S.accL >= 1) {
        S.accL -= 1;
        var y = G.rowY[Math.floor(R() * 3)] + (R() - 0.5) * G.rh * 0.4;
        S.bounce.push({ x: G.col[1].x0 + R() * (G.col[2].x1 - G.col[1].x0), y: y, vx: -(40 + R() * 20), a: R() * TAU, life: 0, stop: false });
      }
      if (p.ions) {
        S.accI += 0.6 * dt;
        while (S.accI >= 1) { S.accI -= 1; var row = R() < 0.5 ? 0 : 1; S.ions.push({ x: 4 + R() * G.xS * 0.4, y: G.wallY[row] + (R() - 0.5) * 30, row: row, st: 0, life: 0, vx: 40 }); }
      }
      // inflow molecules: slower across membranes when aquaporins are shut
      var memSp = 0.25 + 0.75 * p.aqp;
      S.mol.forEach(function (m) {
        var at = pathAt(m.P, m.d), nx = m.P.pts[Math.min(m.P.pts.length - 1, at.i)];
        var sp = (nx && nx.m ? 38 * memSp : 62) * (m.kind === 'apo' ? 1.05 : 0.9);
        if (at.x > G.xS - 4 && at.x < G.xR0 + 2 && G.gap > 4) sp *= 0.35; // crossing the gap only at contact points
        m.d += sp * dt; m.a += dt * 2;
      });
      S.mol = S.mol.filter(function (m) { if (m.d >= m.P.len) { S.counts.in++; S.cnt.add(S.clock, m.kind === 'apo' && p.casparian ? 'forced' : m.kind); S.xyl.push({ u: 0.5, y: 1, a: m.a, fresh: 1 }); return false; } return true; });
      if (S.xyl.length > (G.narrow ? 14 : 22)) S.xyl.splice(0, S.xyl.length - (G.narrow ? 14 : 22));
      S.xyl.forEach(function (q) { q.y -= dt * (0.05 + 0.03 * p.flux); if (q.y < 0) q.y += 1; q.a += dt; q.u = clamp(q.u + (R() - 0.5) * dt * 0.3, 0.1, 0.9); });
      // outward leak: stops at an open gap (valve), else escapes into the soil
      S.bounce.forEach(function (b) {
        b.life += dt; b.a += dt * 2;
        if (b.stop) { b.x += (R() - 0.5) * 8 * dt; return; }
        b.x += b.vx * dt; b.y += (R() - 0.5) * 12 * dt;
        if (b.x <= G.xR0 + 6) {
          if (G.gap > 4) { b.stop = true; b.x = G.xR0 + 6; S.counts.blocked++; }
          else if (b.x < G.xS - 30) b.life = 99;
        }
      });
      S.bounce = S.bounce.filter(function (b) { return b.life < (b.stop ? 3.2 : 6); });
      // ions: along the wall until the Casparian strip
      S.ions.forEach(function (o) {
        o.life += dt;
        var y = G.wallY[o.row];
        if (o.st === 0) { o.x += 45 * dt; o.y += (y - o.y) * Math.min(1, dt * 2); if (o.x >= G.xEn0 - 4) { if (p.casparian) { o.st = 1; S.counts.ionStop++; S.cnt.add(S.clock, 'ion'); } else { o.st = 2; S.counts.ionLeak++; } } }
        else if (o.st === 1) { o.x = G.xEn0 - 6 - Math.abs(Math.sin(o.life * 3)) * 10; o.y = y + Math.sin(o.life * 2) * 3; }
        else { o.x += 45 * dt; }
      });
      S.ions = S.ions.filter(function (o) { return o.life < 9 && o.x < G.w; });
      S.soilW.forEach(function (m) { m.x += (R() - 0.5) * 14 * dt; m.y += (R() - 0.5) * 14 * dt; m.a += dt; m.x = clamp(m.x, 2, G.xS - 4); m.y = clamp(m.y, G.yTop - 8, G.yBot + 8); });
    };
    S.draw = function (c, P, w, h, t, T) {
      var G = S.g, p = S.p; if (!G) return;
      var NM = T && T.names;
      // soil background, darker when wet
      var sg = c.createLinearGradient(0, 0, G.xS, 0);
      var wetA = S.wet;
      sg.addColorStop(0, P.dark ? 'rgb(' + Math.round(48 - 14 * wetA) + ',' + Math.round(40 - 10 * wetA) + ',30)' : 'rgb(' + Math.round(226 - 40 * wetA) + ',' + Math.round(208 - 38 * wetA) + ',' + Math.round(170 - 30 * wetA) + ')');
      sg.addColorStop(1, P.dark ? '#2a241c' : '#d9c9a4');
      c.fillStyle = sg; c.fillRect(0, 0, G.xS, h);
      G.grains.forEach(function (gr) { D.grain(c, P, gr.x, gr.y, gr.r, gr.seed, wetA); });
      S.soilW.forEach(function (m, i) { if (i / S.soilW.length < wetA) D.water(c, P, m.x, m.y, G.r * 0.85, m.a, 0.85); });
      // air gap
      if (G.gap > 1) {
        c.fillStyle = P.dark ? '#05080b' : '#fbf8f0'; c.fillRect(G.xS, 0, G.gap, h);
        c.strokeStyle = P.dark ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.12)'; c.setLineDash([3, 4]); c.beginPath(); c.moveTo(G.xS, 0); c.lineTo(G.xS, h); c.stroke(); c.setLineDash([]);
      }
      // root tissue background (apoplast colour = walls)
      c.fillStyle = P.dark ? '#5d4f2e' : '#d8c48a'; c.fillRect(G.xR0, G.yTop - G.rh * 0.5, G.xX - G.xR0, G.yBot - G.yTop + G.rh);
      // cells
      var names = ['epidermis', 'cortex', 'cortex', 'endodermis', 'pericycle'];
      for (var i = 0; i < 5; i++) {
        var col = G.col[i];
        for (var r = -1; r <= 3; r++) {
          var y0 = G.yTop + r * G.rh + G.wt, y1 = y0 + G.rh - 2 * G.wt;
          var cg = c.createLinearGradient(col.x0, y0, col.x1, y1);
          var base = i === 3 ? (P.dark ? '#2f4a33' : '#cfe0b8') : (P.dark ? '#26332a' : '#e4e8cf');
          cg.addColorStop(0, shade(base, P.dark ? 0.12 : 0.25)); cg.addColorStop(1, shade(base, P.dark ? -0.15 : -0.06));
          c.fillStyle = cg; rrect(c, col.x0 + G.wt, y0, col.x1 - col.x0 - 2 * G.wt, y1 - y0, Math.min(10, (col.x1 - col.x0) * 0.25)); c.fill();
          c.strokeStyle = P.dark ? 'rgba(127,224,168,.55)' : 'rgba(22,74,48,.55)'; c.lineWidth = 1.2; c.stroke();
          if (i > 0 && i < 3) { // vacuole
            c.fillStyle = P.dark ? 'rgba(20,32,41,.7)' : 'rgba(238,244,246,.85)';
            rrect(c, col.x0 + G.wt + 5, y0 + 5, Math.max(4, col.x1 - col.x0 - 2 * G.wt - 10), y1 - y0 - 10, 8); c.fill();
          }
        }
      }
      // net inflow, soil to xylem: width follows the model flux into the root
      var iface0 = 1 / (1 + 4 * S.sh / 0.34);
      if (p.flux > 0.05) D.flux(c, P, G.xS * 0.4, (G.yTop + G.yBot) / 2, G.xX + 18, (G.yTop + G.yBot) / 2, clamp(8 + p.flux * iface0 * 5, 8, (G.yBot - G.yTop) * 0.8), P.dark ? 0.22 : 0.16);
      // Casparian strip: a dark band in the endodermal walls
      var cs = p.casparian;
      G.wallY.concat([G.yTop, G.yBot]).forEach(function (yw) {
        if (!cs) return;
        c.fillStyle = P.dark ? '#c99a4a' : '#6b3f12';
        c.fillRect(G.xEn0 + (G.xEn1 - G.xEn0) * 0.25, yw - G.wt - 1, (G.xEn1 - G.xEn0) * 0.5, 2 * G.wt + 2);
      });
      // aquaporins on membranes along the transcellular path
      var nOpen = p.aqp;
      for (i = 0; i <= 5; i++) {
        var bx = i === 0 ? G.xR0 + G.wt : G.col[i].x0 + G.wt * (i === 5 ? -1 : 1);
        if (i === 5) bx = G.xX - G.wt;
        G.rowY.forEach(function (yc, k) {
          var open = ((k + i) % 3) / 3 < nOpen + 0.01;
          D.aqp(c, P, bx + (i === 5 ? -2 : 2), yc + (k - 1) * 4, G.narrow ? 4 : 5, 0, open ? 1 : 0.55, open);
          if (i > 0 && i < 5) D.aqp(c, P, G.col[i].x0 - G.wt - 2, yc - (k - 1) * 4, G.narrow ? 4 : 5, 0, open ? 1 : 0.55, open);
        });
      }
      // xylem vessel
      var xg = c.createLinearGradient(G.xX, 0, w, 0);
      xg.addColorStop(0, P.dark ? '#14304f' : '#c8daee'); xg.addColorStop(1, P.dark ? '#1d3f6e' : '#8fb2da');
      c.fillStyle = xg; c.fillRect(G.xX, 0, w - G.xX, h);
      c.strokeStyle = P.dark ? '#c4a85e' : '#a8914f'; c.lineWidth = 3;
      for (var yy = 6; yy < h; yy += 14) { c.beginPath(); c.arc(G.xX + 3, yy, 4, -1.2, 1.2); c.stroke(); } // annular wall thickenings
      S.xyl.forEach(function (q) { D.water(c, P, G.xX + 10 + q.u * (w - G.xX - 20), q.y * h, G.r * 0.95, q.a, 0.95); });
      // ions
      S.ions.forEach(function (o) { D.ion(c, P, o.x, o.y, G.r * 1.15, P.K, G.narrow ? '' : 'K⁺', o.st === 2 ? 0.95 : 0.9); if (NM) NM.add('K', o, o.x, o.y, G.r * 1.15, 'K⁺', { q: 1 }); });
      // moving water
      // route halos: orange along the walls, green across membranes; at the strip a wall molecule turns green (forced through a membrane)
      S.mol.forEach(function (m) {
        var q = pathAt(m.P, m.d), forced = m.kind === 'apo' && cs && q.x > G.xEn0 - 2 && q.x < G.xEn1 + 2;
        var col = m.kind === 'tm' || (m.kind === 'apo' && cs && q.x > G.xEn0 - 2) ? MOL.ROUTE.tm : MOL.ROUTE.apo;
        D.halo(c, q.x, q.y, G.r, col, forced ? 0.95 : 0.5);
        if (!m.tr) { D.water(c, P, q.x, q.y, G.r, m.a); if (NM && q.x > G.xR0) NM.add('w', m, q.x, q.y, G.r, 'H₂O'); }
      });
      var tm0 = MOL.pick(S.mol); if (tm0) { var tq0 = pathAt(tm0.P, tm0.d); D.tracer(c, P, tq0.x, tq0.y, G.r, tm0, !G.narrow); }
      S.bounce.forEach(function (b) { D.water(c, P, b.x, b.y, G.r, b.a, b.stop ? Math.max(0, 1 - b.life / 3.2) : 0.9); if (b.stop && b.life < 0.5) { c.strokeStyle = P.loop; c.lineWidth = 1.5; c.beginPath(); c.arc(b.x - 6, b.y, 6, 2.2, 4.1); c.stroke(); } });
      // labels
      var fs = G.narrow ? 10 : 11.5;
      D.tag(c, P, 6, 12, p.mode === 'agave' ? 'Desert soil' : 'Soil', { size: fs });
      if (G.gap > 6) D.tag(c, P, G.xS + G.gap / 2, h - 12, 'air gap', { size: fs - 0.5, align: 'center' });
      var lab = G.narrow ? ['epi', 'cortex', '', 'endo', ''] : ['epidermis', 'cortex', '', 'endodermis', 'pericycle'];
      for (i = 0; i < 5; i++) if (lab[i]) D.tag(c, P, i === 1 ? (G.col[1].x0 + G.col[2].x1) / 2 : (G.col[i].x0 + G.col[i].x1) / 2, G.yTop - G.rh * 0.5 - 2 > 24 ? 12 : 12, lab[i], { size: fs - 1, align: 'center' });
      D.tag(c, P, (G.xX + w) / 2, 12, G.narrow ? 'xylem' : 'xylem vessel', { size: fs - 0.5, align: 'center' });
      if (cs) D.tag(c, P, (G.xEn0 + G.xEn1) / 2, h - 12, G.narrow ? 'Casparian strip' : 'Casparian strip: walls sealed', { size: fs - 1, align: 'center' });
      else D.tag(c, P, (G.xEn0 + G.xEn1) / 2, h - 12, 'no strip: walls open', { size: fs - 1, align: 'center', ink: P.dark ? '#ffb38a' : '#8a2a10' });
      // counters and halo key
      var nIn = S.cnt.n(S.clock), nF = S.cnt.n(S.clock, 'forced');
      D.tag(c, P, (G.xR0 + G.xX) / 2, G.yBot + G.rh * 0.5 - 6 > h - 40 ? h - 34 : G.yBot + G.rh * 0.5 - 6, (G.narrow ? '5 s: ' : 'last 5 s: ') + nIn + ' reached the xylem' + (cs ? ', ' + nF + (G.narrow ? ' forced' : ' forced through a membrane at the strip') : ''), { size: fs - 1, align: 'center' });
      if (!G.narrow) { D.halo(c, 16, h - 52, G.r, MOL.ROUTE.apo, 0.9); D.tag(c, P, 28, h - 52, 'in the walls', { size: fs - 2 }); D.halo(c, 16, h - 32, G.r, MOL.ROUTE.tm, 0.9); D.tag(c, P, 28, h - 32, 'through cells', { size: fs - 2 }); }
      if (p.mode === 'agave' && S.sh > 0.01) D.tag(c, P, (G.xR0 + G.xEn0) / 2, G.yBot + G.rh * 0.55 > h - 30 ? h - 32 : G.yBot + G.rh * 0.55, 'root shrank ' + Math.round(S.sh * 100) + ' %', { size: fs - 0.5, align: 'center' });
    };
    S.stats = function () { return { gap: S.g ? S.g.gap : 0, iface: 1 / (1 + 4 * S.sh / 0.34), counts: S.counts }; };
    return S;
  };

  /* ============================================================ scene: outside the xylem, the routes of Buckley 2015
     Vein (xylem and bundle sheath) on the left, mesophyll in the middle, the stoma on the LOWER epidermis at the right.
     set({ E (mmol m−2 s−1), share: {apo, tm, vap} (fractions, from WP.buckley), expr: relative PIP abundance in the sheath,
           pm: membrane permeability Pm (µm s−1, 10 to 70), dT: vertical temperature gradient (K), aba: bool, open: stomatal aperture 0..1 })
     Every water molecule crosses a bundle sheath membrane first (the sheath's aquaporins), then takes one of three routes.
     Rate scale: 3 molecules s−1 per mmol m−2 s−1, split by the model shares. */
  MOL.scenes.routes = function () {
    var S = { p: { E: 3, share: { apo: 0.8, tm: 0.09, vap: 0.11 }, expr: 1, pm: 40, dT: 0, aba: false, open: 0.6 }, mol: [], vap: [], acc: 0, R: rng(23), g: null, counts: { apo: 0, tm: 0, vap: 0 }, clock: 0, cnt: MOL.Counter(5), only: null };
    var R = S.R;
    S.set = function (p) { for (var k in p) S.p[k] = p[k]; };
    S.settle = function () { S.mol = []; S.acc = 0; };
    S.layout = function (w, h) {
      var narrow = w < 560, G = { w: w, h: h, narrow: narrow }, old = S.g;
      if (old && (Math.abs(old.w - w) > 1 || Math.abs(old.h - h) > 1)) { // canvas resized: carry molecules already in flight onto the new geometry
        var kx = w / old.w, ky = h / old.h;
        S.mol.forEach(function (m) { var f = m.d / Math.max(1e-6, m.P.len); m.P = pathPrep(m.P.pts.map(function (q) { var o = {}; for (var k in q) o[k] = q[k]; o.x = q.x * kx; o.y = q.y * ky; return o; })); m.d = f * m.P.len; });
      }
      G.yEpU = Math.round(h * 0.10); G.yEpL = Math.round(h * 0.73); G.yEpB = Math.round(h * 0.84);
      G.vx = w * (narrow ? 0.16 : 0.14); G.vy = h * 0.43; G.vr = Math.min(h * 0.09, w * 0.06); G.bsR = G.vr * 2.05;
      G.sx = w * 0.8;
      G.bs = [];
      var nb = 8;
      for (var i = 0; i < nb; i++) { var a = i * TAU / nb + 0.2; G.bs.push({ x: G.vx + Math.cos(a) * G.bsR * 0.78, y: G.vy + Math.sin(a) * G.bsR * 0.78, a: a, r: G.bsR * 0.36 }); }
      G.cells = [];
      var cols = narrow ? 3 : 4, x0 = G.vx + G.bsR + 14, x1 = G.sx - (narrow ? 26 : 40), cw = (x1 - x0) / cols;
      for (i = 0; i < cols; i++) for (var k = 0; k < 2; k++) {
        G.cells.push({ x: x0 + cw * (i + 0.5) + (k ? cw * 0.18 : -cw * 0.1), y: k ? h * 0.585 : h * 0.29, rx: cw * 0.4, ry: Math.min(h * (k ? 0.105 : 0.14), cw * (k ? 0.42 : 0.55)) });
      }
      G.r = clamp(w / 190, 3.4, 5.2);
      S.g = G;
    };
    function route(kind) {
      var G = S.g, b = G.bs[Math.floor(R() * G.bs.length)], pts = [];
      pts.push({ x: G.vx + (R() - 0.5) * G.vr, y: G.vy + (R() - 0.5) * G.vr });
      var ang = Math.atan2(b.y - G.vy, b.x - G.vx);
      pts.push({ x: G.vx + Math.cos(ang) * (G.bsR * 0.42), y: G.vy + Math.sin(ang) * (G.bsR * 0.42), m: 1 }); // into the sheath cell
      pts.push({ x: b.x, y: b.y });
      pts.push({ x: G.vx + Math.cos(ang) * (G.bsR * 1.12), y: G.vy + Math.sin(ang) * (G.bsR * 1.12), m: 1 }); // out of it
      var cav = { x: G.sx + (R() - 0.5) * 20, y: G.yEpL - 22 };
      var cells = G.cells.slice().sort(function (a, c2) { return a.x - c2.x; });
      if (kind === 'vap') {
        pts.push({ x: pts[pts.length - 1].x + 10, y: G.vy + (R() - 0.5) * 30, ev: 1 });
        var n = 4; for (var i = 1; i <= n; i++) pts.push({ x: lerp(pts[4].x, cav.x, i / (n + 1)) + (R() - 0.5) * 20, y: lerp(G.vy, cav.y, i / (n + 1)) + (R() - 0.5) * 50, vap: 1 });
        pts.push(cav);
      } else if (kind === 'apo') {
        // along cell walls: follow the edge of the cells, then evaporate near the cavity
        var row = R() < 0.5 ? 0 : 1, cs = cells.filter(function (c2, j) { return (j % 2) === row; });
        cs.forEach(function (c2) { // around the wall of each cell, over the top or under the bottom
          var sg = R() < 0.5 ? -1 : 1, rx = c2.rx + 3, ry = c2.ry + 3;
          for (var q = 0; q <= 4; q++) { var th = Math.PI - q * Math.PI / 4; pts.push({ x: c2.x + Math.cos(th) * rx, y: c2.y - sg * Math.sin(th) * ry }); }
        });
        pts.push({ x: cav.x - 26, y: cav.y - 34, ev: 1 }, cav);
      } else {
        var row2 = R() < 0.5 ? 0 : 1, cs2 = cells.filter(function (c2, j) { return (j % 2) === row2; });
        cs2.forEach(function (c2) { pts.push({ x: c2.x - c2.rx, y: c2.y, m: 1 }, { x: c2.x, y: c2.y + (R() - 0.5) * c2.ry * 0.4 }, { x: c2.x + c2.rx, y: c2.y, m: 1 }); });
        pts.push({ x: cav.x - 22, y: cav.y - 30, ev: 1 }, cav);
      }
      pts.push({ x: G.sx + (R() - 0.5) * 6, y: G.yEpL + 4 }, { x: G.sx + (R() - 0.5) * 8, y: G.yEpB + 2 }, { x: G.sx + (R() - 0.5) * 90, y: G.h + 12 });
      return pathPrep(pts);
    }
    S.step = function (dt) {
      var G = S.g, p = S.p; if (!G) return;
      S.clock += dt;
      S.acc += 3 * Math.max(0, p.E) * dt;
      while (S.acc >= 1) {
        S.acc -= 1;
        var u = R(), sh = p.share, kind = u < sh.apo ? 'apo' : (u < sh.apo + sh.tm ? 'tm' : 'vap');
        S.mol.push({ P: route(kind), d: 0, a: R() * TAU, kind: kind });
      }
      var bsSp = clamp(0.3 + 0.7 * Math.min(1.4, p.expr) * (p.aba ? 0.6 : 1), 0.15, 1.3), mSp = clamp(p.pm / 40, 0.25, 1.75);
      S.mol.forEach(function (m) {
        var at = pathAt(m.P, m.d), nx = m.P.pts[Math.min(m.P.pts.length - 1, at.i)];
        var sp = 55;
        if (at.i <= 3) sp = nx && nx.m ? 30 * bsSp : 45;
        else if (nx && nx.m) sp = 28 * mSp;
        else if (nx && nx.vap) sp = 95 * (1 + p.dT * 3);
        else if (at.y > G.yEpL - 30) sp = 80;
        m.d += sp * dt; m.a += dt * (nx && nx.vap ? 5 : 2);
        m.vapour = at.i >= m.P.pts.findIndex(function (q) { return q.ev; });
      });
      S.mol = S.mol.filter(function (m) { if (m.d >= m.P.len) { S.counts[m.kind]++; S.cnt.add(S.clock, m.kind); return false; } return true; });
      if (S.mol.length > 220) S.mol.splice(0, S.mol.length - 220);
    };
    S.draw = function (c, P, w, h, t, T) {
      var G = S.g, p = S.p; if (!G) return;
      var NM = T && T.names;
      c.fillStyle = P.dark ? '#0b1210' : '#f3f0dc'; c.fillRect(0, 0, w, h); // air spaces
      // warm vein side when there is a vertical temperature gradient
      if (p.dT > 0.005) {
        var tg = c.createRadialGradient(G.vx, G.vy, G.vr, G.vx, G.vy, G.bsR * 3.2);
        tg.addColorStop(0, 'rgba(240,138,93,' + clamp(p.dT * 1.6, 0, 0.45).toFixed(3) + ')'); tg.addColorStop(1, 'rgba(240,138,93,0)');
        c.fillStyle = tg; c.fillRect(0, 0, w, h);
      }
      // epidermes: upper with cuticle, lower with the stoma
      c.fillStyle = P.dark ? '#2b3d2c' : '#dfe6c6'; c.fillRect(0, 0, w, G.yEpU); c.fillRect(0, G.yEpL, w, G.yEpB - G.yEpL);
      c.fillStyle = P.cut; c.fillRect(0, 0, w, 4);
      c.fillStyle = P.dark ? '#0b1210' : '#f3f0dc'; c.fillRect(G.sx - 9 - 6 * p.open, G.yEpL, 18 + 12 * p.open, G.yEpB - G.yEpL);
      [-1, 1].forEach(function (s) { D.ball(c, G.sx + s * (15 + 9 * p.open), (G.yEpL + G.yEpB) / 2, (G.yEpB - G.yEpL) * 0.44, P.guard, P.guardHi, shade(P.guard, -0.35)); });
      // mesophyll cells: wall (tan) then membrane (green) then cytoplasm
      G.cells.forEach(function (cl) {
        c.fillStyle = P.dark ? '#5d4f2e' : '#d8c48a'; c.beginPath(); c.ellipse(cl.x, cl.y, cl.rx + 4, cl.ry + 4, 0, 0, TAU); c.fill();
        var g = c.createRadialGradient(cl.x - cl.rx * 0.3, cl.y - cl.ry * 0.3, 2, cl.x, cl.y, cl.rx);
        g.addColorStop(0, P.dark ? '#33503a' : '#eef3d9'); g.addColorStop(1, P.dark ? '#22362a' : '#d3e0b4');
        c.fillStyle = g; c.beginPath(); c.ellipse(cl.x, cl.y, cl.rx, cl.ry, 0, 0, TAU); c.fill();
        c.strokeStyle = P.dark ? 'rgba(127,224,168,.6)' : 'rgba(22,74,48,.6)'; c.lineWidth = 1.2; c.stroke();
        for (var k = 0; k < 5; k++) { var a = k * 1.3 + 0.4; D.ball(c, cl.x + Math.cos(a) * cl.rx * 0.7, cl.y + Math.sin(a) * cl.ry * 0.7, 2.6, P.dark ? '#7fb05a' : '#5f8a3c', '#d8f0c0', '#2c4a1a'); }
        var nA = Math.max(1, Math.round(3 * p.pm / 40));
        for (k = 0; k < nA; k++) { var b2 = k / nA * TAU + 0.3; D.aqp(c, P, cl.x + Math.cos(b2) * cl.rx, cl.y + Math.sin(b2) * cl.ry, 3.6, b2, 0.95, true); }
      });
      // vein: bundle sheath ring around the xylem
      G.bs.forEach(function (b) {
        c.fillStyle = P.dark ? '#5d4f2e' : '#d8c48a'; c.beginPath(); c.arc(b.x, b.y, b.r + 3, 0, TAU); c.fill();
        var g = c.createRadialGradient(b.x - b.r * 0.3, b.y - b.r * 0.3, 2, b.x, b.y, b.r);
        g.addColorStop(0, P.dark ? '#3b5a3f' : '#f2f6df'); g.addColorStop(1, P.dark ? '#26402c' : '#cfdcae');
        c.fillStyle = g; c.beginPath(); c.arc(b.x, b.y, b.r, 0, TAU); c.fill();
        c.strokeStyle = P.dark ? 'rgba(127,224,168,.7)' : 'rgba(22,74,48,.7)'; c.lineWidth = 1.3; c.stroke();
      });
      var xg = c.createRadialGradient(G.vx - G.vr * 0.3, G.vy - G.vr * 0.3, 2, G.vx, G.vy, G.vr);
      xg.addColorStop(0, P.dark ? '#4a82f2' : '#c8daee'); xg.addColorStop(1, P.dark ? '#14304f' : '#5487c3');
      c.fillStyle = xg; c.beginPath(); c.arc(G.vx, G.vy, G.vr, 0, TAU); c.fill();
      // sheath aquaporins: count follows expression; dimmed by xylem ABA
      var nBS = clamp(Math.round(10 * p.expr), 1, 16);
      for (var i = 0; i < nBS; i++) { var a2 = i / nBS * TAU + 0.15; D.aqp(c, P, G.vx + Math.cos(a2) * G.bsR * 0.42, G.vy + Math.sin(a2) * G.bsR * 0.42, 4, a2, p.aba ? 0.5 : 1, !p.aba); }
      // molecules
      S.mol.forEach(function (m) {
        var q = pathAt(m.P, m.d);
        if (m.vapour) { c.save(); c.globalAlpha = 0.35; c.fillStyle = P.dark ? '#9dbef6' : '#8fb2da'; c.beginPath(); c.arc(q.x, q.y, G.r * 2, 0, TAU); c.fill(); c.restore(); }
        // every molecule wears its route colour at all times (designer panel item 7)
        var dim = p.only && p.only !== m.kind;
        D.halo(c, q.x, q.y, G.r, MOL.ROUTE[m.kind], dim ? 0.12 : 0.75);
        if (!m.tr) D.water(c, P, q.x, q.y, G.r, m.a, dim ? 0.3 : (m.kind === 'vap' ? 0.95 : 1));
        // names: one liquid molecule on the walls and one crossing membranes (one on phones), one vapour molecule
        if (NM && !m.tr && !dim && q.y < G.yEpL - 4) { if (m.vapour) { if (!G.narrow) NM.add('vap', m, q.x, q.y, G.r * 1.6, 'H₂O vapour', { q: 1 }); } else if (m.d > 20 && m.kind !== 'vap') NM.add(G.narrow ? 'liq' : 'liq' + m.kind, m, q.x, q.y, G.r, 'H₂O', { q: 1, pri: m.kind === 'tm' ? 1 : 0 }); }
      });
      var tr1 = MOL.pick(S.mol); if (tr1) { var tq1 = pathAt(tr1.P, tr1.d); D.tracer(c, P, tq1.x, tq1.y, G.r, tr1, !G.narrow); }
      var fs = G.narrow ? 10 : 11.5;
      D.tag(c, P, 6, G.yEpU + 12, G.narrow ? 'upper epidermis' : 'upper epidermis and cuticle', { size: fs - 0.5 });
      D.tag(c, P, G.vx, G.vy + G.bsR + 14, G.narrow ? 'vein' : 'xylem + bundle sheath', { size: fs - 0.5, align: 'center' });
      D.tag(c, P, (G.cells[0].x + G.cells[G.cells.length - 1].x) / 2, G.yEpU + 12, 'mesophyll', { size: fs - 0.5, align: 'center' });
      D.tag(c, P, G.sx, G.yEpL - 12, G.narrow ? 'cavity' : 'substomatal cavity', { size: fs - 1, align: 'center' });
      D.tag(c, P, Math.min(w - 8, G.sx + 40), h - 11, G.narrow ? 'stoma (lower side)' : 'stoma on the lower epidermis', { size: fs - 1, align: 'right' });
      D.tag(c, P, 8, h - 11, G.narrow ? 'air below the leaf' : 'air below the leaf: vapour leaves here', { size: fs - 1.5, alpha: 0.92 });
      if (p.dT > 0.005 && !G.narrow) D.tag(c, P, G.vx + G.bsR + 8, G.vy - G.bsR - 4, 'vein side warmer by ' + p.dT.toFixed(2) + ' K', { size: fs - 1 });
      // live share bar (the model partition) and what actually arrived in the last 5 s
      var sh = p.share, tot = S.cnt.n(S.clock) || 0;
      var line = function (k, lab) { return lab + ' ' + Math.round(100 * (sh[k] || 0)) + ' %' + (G.narrow ? '' : ' (' + S.cnt.n(S.clock, k) + ')'); };
      var l1 = line('apo', 'walls') + '   ' + line('tm', 'membranes') + '   ' + line('vap', 'vapour'), l2 = G.narrow ? '' : 'model shares; (n) arrived in the last 5 s, of ' + tot;
      c.font = (fs - 1.5) + 'px ' + (P.font || 'system-ui, sans-serif');
      var bw = Math.max(G.narrow ? 120 : 200, c.measureText(l1).width, l2 ? c.measureText(l2).width : 0), bh = 10;
      var bx = G.narrow ? 8 : w - bw - 14, by = G.yEpU + 26, x = bx;
      c.fillStyle = P.dark ? 'rgba(10,16,14,.8)' : 'rgba(255,253,245,.9)'; rrect(c, bx - 6, by - 6, bw + 12, l2 ? 64 : 44, 6); c.fill();
      if (NM) NM.block(bx - 8, by - 8, bw + 16, (l2 ? 64 : 44) + 4);
      [['apo'], ['tm'], ['vap']].forEach(function (k) { var ww = bw * (sh[k[0]] || 0); c.fillStyle = MOL.ROUTE[k[0]]; c.fillRect(x, by, ww, bh); x += ww; });
      c.fillStyle = P.ink || (P.dark ? '#e8eef5' : '#222'); c.textBaseline = 'top';
      c.fillText(l1, bx, by + bh + 5);
      if (l2) c.fillText(l2, bx, by + bh + 23);
      c.textBaseline = 'alphabetic';
    };
    S.stats = function () { return S.counts; };
    return S;
  };

  /* ============================================================ scene: a cell that adjusts osmotically
     set({ solutes: 0..1 extra solutes in the vacuole (osmotic adjustment), psi: tissue water potential (MPa),
           tlp: turgor loss point (MPa), pio: osmotic potential at full turgor (MPa), rwc: relative water content 0..1 })
     The vacuole volume follows rwc; turgor is drawn as the wall pushed outward; water molecules cross the membrane in or out
     at a rate ∝ the change in volume the caller computes (from its PV curve). */
  /* ============================================================ scene: one leaf cell, turgor and osmotic adjustment
     set({ solutes: 0..1 (days of drought ÷ 39), psi: test Ψ (MPa), tlp, pio: osmotic potential at full turgor (MPa),
           rwc: relative water content at psi, turgor: Ψp at psi (MPa), eps: bulk modulus (MPa) })
     Drawing scales: one drawn solute = 0.025 MPa of osmotic potential at full turgor (count = |πo| ÷ 0.025);
     vacuole volume change drawn 3 × larger than the RWC change so it can be seen; water crossing rate follows the
     volume still to change (net) plus a constant two way exchange (as at equilibrium, diffusion never stops). */
  MOL.scenes.cell = function () {
    var S = { p: { solutes: 0, psi: -0.4, tlp: -1.37, pio: -1.1, rwc: 0.95, turgor: 0.6, eps: 15 }, vol: 0.95, mol: [], sol: [], acc: 0, zoom: [], zacc: 0, R: rng(41), g: null, born: 0 };
    var R = S.R;
    S.set = function (p) { for (var k in p) S.p[k] = p[k]; if (!S.inited && p.rwc != null) { S.vol = p.rwc; S.inited = true; } };
    S.settle = function () { S.vol = S.p.rwc; S.mol = []; S.zoom = []; S.sol.forEach(function (q) { q.b = 1; }); };
    S.layout = function (w, h) {
      var nar = w < 560, G = { w: w, h: h, narrow: nar, r: clamp(w / 150, 3.6, 5.6) };
      if (nar) { var mr = Math.min(w * 0.36, h * 0.16); G.cell = { x: w * 0.07, y: 56, w: w * 0.86, h: h * 0.42 }; G.mag = { x: w * 0.5, y: h - mr - 34, r: mr }; }
      else { G.cell = { x: w * 0.04, y: 40, w: w * 0.56, h: h - 96 }; G.mag = { x: w * 0.81, y: h * 0.47, r: Math.min(w * 0.165, h * 0.37) }; }
      // aquaporin sites around the plasma membrane (fractions along the perimeter)
      G.sites = [0.07, 0.19, 0.33, 0.46, 0.57, 0.70, 0.83, 0.94];
      G.src = 2; // the site that the magnifier looks at
      S.g = G;
    };
    function perim(C, u, inset) { // point on a rounded rectangle perimeter, u in 0..1, with outward normal
      var x0 = C.x + inset, y0 = C.y + inset, ww = C.w - 2 * inset, hh = C.h - 2 * inset, L = 2 * (ww + hh), d = ((u % 1) + 1) % 1 * L;
      if (d < ww) return { x: x0 + d, y: y0, nx: 0, ny: -1 }; d -= ww;
      if (d < hh) return { x: x0 + ww, y: y0 + d, nx: 1, ny: 0 }; d -= hh;
      if (d < ww) return { x: x0 + ww - d, y: y0 + hh, nx: 0, ny: 1 }; d -= ww;
      return { x: x0, y: y0 + hh - d, nx: -1, ny: 0 };
    }
    S.step = function (dt) {
      var G = S.g, p = S.p; if (!G) return;
      var dv = p.rwc - S.vol; S.vol += dv * Math.min(1, dt * 1.2);
      // solutes: count from the osmotic potential at full turgor; new ones fade in and glow
      var nS = Math.round(Math.abs(p.pio) / 0.025);
      while (S.sol.length < nS) S.sol.push({ u: R() * 1.8 - 0.9, v: R() * 1.8 - 0.9, a: R() * TAU, k: S.sol.length % 3 === 1, b: S.sol.length < 38 ? 1 : 0, vx: 0, vy: 0 });
      while (S.sol.length > nS) S.sol.pop();
      S.sol.forEach(function (q) { q.vx += (R() - 0.5) * dt * 1.2; q.vy += (R() - 0.5) * dt * 1.2; q.vx *= 0.96; q.vy *= 0.96; q.u = clamp(q.u + q.vx * dt, -0.92, 0.92); q.v = clamp(q.v + q.vy * dt, -0.9, 0.9); if (Math.abs(q.u) > 0.91) q.vx *= -1; if (Math.abs(q.v) > 0.89) q.vy *= -1; q.a += dt * 0.6; q.b = Math.min(1, q.b + dt * 0.5); });
      // water crossing the plasma membrane through the aquaporins
      var net = clamp(Math.abs(dv) * 260, 0, 9), rate = 1.6 + net;
      S.acc += rate * dt;
      while (S.acc >= 1) {
        S.acc -= 1;
        var inward = Math.abs(dv) > 0.002 ? (R() < 0.5 + 0.45 * Math.sign(dv)) : R() < 0.5;
        S.mol.push({ s: G.sites[Math.floor(R() * G.sites.length)], t: 0, inward: inward, sp: 0.55 + R() * 0.3, rot: R() * TAU, j: (R() - 0.5) * 0.3 });
      }
      S.mol.forEach(function (m) { m.t += dt * m.sp; m.rot += dt * 1.5; });
      S.mol = S.mol.filter(function (m) { return m.t < 1; });
      // magnifier: single file through one pore, at the same two way rule
      S.zacc += (0.8 + net * 0.25) * dt;
      while (S.zacc >= 1) { S.zacc -= 1; S.zoom.push({ t: 0, inward: Math.abs(dv) > 0.002 ? (R() < 0.5 + 0.45 * Math.sign(dv)) : R() < 0.5, rot: R() * TAU }); }
      S.zoom.forEach(function (m) { m.t += dt * 0.4; m.rot += dt; });
      S.zoom = S.zoom.filter(function (m) { return m.t < 1; });
      S.dv = dv;
    };
    function pressArrows(c, P, C, n, len, a) {
      c.save(); c.globalAlpha = a;
      for (var i = 0; i < n; i++) { var q = perim(C, (i + 0.5) / n, 16); D.arrow(c, q.x - q.nx * len, q.y - q.ny * len, q.x, q.y, 1.6, P.dark ? 'rgba(157,190,246,.85)' : 'rgba(43,95,164,.7)', 1); }
      c.restore();
    }
    S.draw = function (c, P, w, h, t, T) {
      var G = S.g, p = S.p; if (!G) return;
      var NM = T && T.names;
      var bg = c.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, P.dark ? '#0d1612' : '#f5f1df'); bg.addColorStop(1, P.dark ? '#0a100e' : '#ece9d2');
      c.fillStyle = bg; c.fillRect(0, 0, w, h);
      var C = G.cell, tg = clamp(p.turgor / 0.9, 0, 1), soft = clamp(8 / Math.max(3, p.eps || 12), 0.3, 2.4);
      // wall: bows out with turgor (more for a softer wall), sags slightly at zero turgor
      var bow = tg * 5 * soft, sag = tg < 0.02 ? 3 : 0;
      function wallPath(ins, bw) {
        var x0 = C.x + ins, y0 = C.y + ins, x1 = C.x + C.w - ins, y1 = C.y + C.h - ins, r = 18;
        c.beginPath(); c.moveTo(x0 + r, y0);
        c.quadraticCurveTo((x0 + x1) / 2, y0 - bw, x1 - r, y0); c.quadraticCurveTo(x1, y0, x1, y0 + r);
        c.quadraticCurveTo(x1 + bw, (y0 + y1) / 2, x1, y1 - r); c.quadraticCurveTo(x1, y1, x1 - r, y1);
        c.quadraticCurveTo((x0 + x1) / 2, y1 + bw, x0 + r, y1); c.quadraticCurveTo(x0, y1, x0, y1 - r);
        c.quadraticCurveTo(x0 - bw, (y0 + y1) / 2, x0, y0 + r); c.quadraticCurveTo(x0, y0, x0 + r, y0); c.closePath();
      }
      // apoplast water film outside the wall
      c.fillStyle = P.dark ? 'rgba(70,120,200,.18)' : 'rgba(120,160,220,.18)'; wallPath(-12, bow); c.fill();
      var wg = c.createLinearGradient(C.x, C.y, C.x + C.w, C.y + C.h); wg.addColorStop(0, P.dark ? '#6d5c36' : '#e2cf95'); wg.addColorStop(1, P.dark ? '#4a3e24' : '#c7ae6c');
      c.fillStyle = wg; wallPath(0, bow - sag * 2); c.fill();
      // protoplast: cytoplasm presses on the wall when turgid, pulls a hair away at the corners when flaccid
      var gap = tg < 0.02 ? 3.5 : 0;
      c.fillStyle = P.dark ? '#22302a' : '#e3e9cf'; wallPath(10 + gap, bow - sag * 2); c.fill();
      c.strokeStyle = P.dark ? 'rgba(127,224,168,.85)' : 'rgba(22,90,52,.8)'; c.lineWidth = 2; c.stroke();
      // vacuole volume follows RWC (drawn 3 × the real change)
      var vf = clamp(1 - (1 - S.vol) * 3 / 0.3, 0.25, 1), ins = 26 + (1 - vf) * Math.min(C.w, C.h) * 0.22;
      var vg = c.createRadialGradient(C.x + C.w * 0.45, C.y + C.h * 0.4, 10, C.x + C.w / 2, C.y + C.h / 2, C.w * 0.6);
      vg.addColorStop(0, P.dark ? 'rgba(60,110,170,.75)' : 'rgba(214,230,246,.95)'); vg.addColorStop(1, P.dark ? 'rgba(30,60,100,.8)' : 'rgba(178,204,234,.95)');
      c.fillStyle = vg; wallPath(ins, (bow - sag * 2) * 0.6); c.fill();
      c.strokeStyle = P.dark ? 'rgba(157,190,246,.8)' : 'rgba(43,95,164,.65)'; c.lineWidth = 1.4; c.stroke();
      var V = { x: C.x + ins, y: C.y + ins, w: C.w - 2 * ins, h: C.h - 2 * ins };
      // chloroplasts and the nucleus in the thin cytoplasm
      for (var i = 0; i < 12; i++) {
        var q = perim(C, (i + 0.3) / 12, 17 + gap); c.save(); c.translate(q.x, q.y); c.rotate(Math.atan2(q.ny, q.nx) + Math.PI / 2);
        var cg = c.createLinearGradient(-8, 0, 8, 0); cg.addColorStop(0, P.dark ? '#3f6a2a' : '#4f7a2e'); cg.addColorStop(0.5, P.dark ? '#8cc46a' : '#8fbf5a'); cg.addColorStop(1, P.dark ? '#3f6a2a' : '#4f7a2e');
        c.fillStyle = cg; c.beginPath(); c.ellipse(0, 0, 8, 3.6, 0, 0, TAU); c.fill();
        c.strokeStyle = 'rgba(20,50,10,.35)'; c.lineWidth = 0.7; for (var k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(-5, k * 1.4); c.lineTo(5, k * 1.4); c.stroke(); }
        c.restore();
      }
      D.ball(c, C.x + C.w - 30 - gap, C.y + C.h - 30 - gap, 9, P.dark ? '#a98ac9' : '#9b7cc0', '#efe4ff', '#4c3470');
      // water held in the vacuole (faint, density from RWC) and the solutes
      var nW = Math.round(14 * vf);
      for (i = 0; i < nW; i++) { var sx = V.x + V.w * (0.1 + 0.8 * ((i * 0.618) % 1)), sy = V.y + V.h * (0.15 + 0.7 * ((i * 0.383 + 0.2) % 1)); D.water(c, P, sx + Math.sin(t * 0.7 + i) * 3, sy + Math.cos(t * 0.5 + i) * 3, G.r * 0.8, t * 0.4 + i, 0.35); }
      S.sol.forEach(function (q, j) {
        var x = V.x + V.w / 2 + q.u * V.w * 0.46, y = V.y + V.h / 2 + q.v * V.h * 0.44, a = 0.25 + 0.75 * q.b;
        if (q.b < 1 && P.dark) { c.save(); c.shadowColor = '#ffe9a0'; c.shadowBlur = 10 * (1 - q.b); }
        if (q.k) D.ion(c, P, x, y, G.r * 1.25, P.K, G.r >= 4.5 ? 'K⁺' : '', a); else D.sugar(c, P, x, y, G.r * 1.45, q.a, a);
        if (NM && q.b > 0.6) NM.add(q.k ? 'K' : 'sug', q, x, y, G.r * 1.3, q.k ? 'K⁺' : 'sugar', { q: q.k ? undefined : 1 });
        if (q.b < 1 && P.dark) c.restore();
        if (q.b < 1 && !P.dark) { c.strokeStyle = 'rgba(232,137,26,' + (0.9 * (1 - q.b)).toFixed(2) + ')'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, G.r * 2.2, 0, TAU); c.stroke(); }
      });
      // turgor pushes on the wall
      if (tg > 0.02) pressArrows(c, P, C, G.narrow ? 10 : 14, 6 + 10 * tg, 0.35 + 0.5 * tg);
      // aquaporins in the plasma membrane and the water crossing them
      G.sites.forEach(function (u, k2) { var q2 = perim(C, u, 10 + gap); D.aqp(c, P, q2.x, q2.y, 4.6, Math.atan2(q2.ny, q2.nx) + Math.PI / 2, 1, true); });
      S.mol.forEach(function (m) {
        var o = perim(C, m.s, -10), q3 = perim(C, m.s, 30 + m.j * 20), f = m.inward ? m.t : 1 - m.t;
        var x = lerp(o.x, q3.x, f), y = lerp(o.y, q3.y, f), a = m.t < 0.12 ? m.t / 0.12 : (m.t > 0.88 ? (1 - m.t) / 0.12 : 1);
        D.water(c, P, x, y, G.r, m.rot, a);
        if (NM && a > 0.6) NM.add('w', m, x, y, G.r, 'H₂O', { q: 1 });
      });
      // magnifier: one aquaporin in the plasma membrane, water in single file, solutes turned back
      var M = G.mag, src = perim(C, G.sites[G.src], 10 + gap);
      c.strokeStyle = P.dark ? 'rgba(201,165,106,.7)' : 'rgba(110,90,60,.6)'; c.lineWidth = 1.2; c.setLineDash([4, 4]);
      c.beginPath(); c.moveTo(src.x, src.y); c.lineTo(M.x + (src.x - M.x) * M.r / Math.hypot(src.x - M.x, src.y - M.y), M.y + (src.y - M.y) * M.r / Math.hypot(src.x - M.x, src.y - M.y)); c.stroke(); c.setLineDash([]);
      c.beginPath(); c.arc(src.x, src.y, 8, 0, TAU); c.stroke();
      c.save(); c.beginPath(); c.arc(M.x, M.y, M.r, 0, TAU); c.clip();
      var mg = c.createLinearGradient(0, M.y - M.r, 0, M.y + M.r); mg.addColorStop(0, P.dark ? '#14243a' : '#dfe9f4'); mg.addColorStop(0.5, P.dark ? '#1a2330' : '#efeadb'); mg.addColorStop(1, P.dark ? '#1c2a22' : '#e4ebd3');
      c.fillStyle = mg; c.fillRect(M.x - M.r, M.y - M.r, 2 * M.r, 2 * M.r);
      var yT = M.y - M.r * 0.22, yB = M.y + M.r * 0.22, pw = M.r * 0.42;
      D.bilayer(c, P, M.x - M.r, M.x + M.r, yT, yB, [[M.x - pw / 2, M.x + pw / 2]], t, 2);
      D.protein(c, P, M.x, yT - M.r * 0.08, yB + M.r * 0.08, pw, { lobes: 2 });
      D.pore(c, P, M.x, yT - M.r * 0.08, yB + M.r * 0.08, pw * 0.2, pw * 0.07);
      var rz = clamp(M.r / 15, 3.2, 6);
      S.zoom.forEach(function (m) {
        var f = m.inward ? m.t : 1 - m.t, y = lerp(M.y - M.r * 0.85, M.y + M.r * 0.85, f), x = M.x + (Math.abs(y - M.y) < M.r * 0.3 ? 0 : Math.sin(m.rot * 2) * M.r * 0.12);
        D.water(c, P, x, y, rz, Math.abs(y - M.y) < M.r * 0.3 ? -Math.PI / 2 : m.rot, 1);
        if (NM && Math.abs(y - M.y) < M.r * 0.55) NM.add('pore', m, x, y, rz, 'H₂O', { q: 1 });
      });
      // a K+ and a sugar bounce off the membrane on the cell side
      var bz = Math.abs(Math.sin(t * 1.3));
      D.ion(c, P, M.x - M.r * 0.48, yB + M.r * 0.1 + bz * M.r * 0.28, rz * 1.3, P.K, rz >= 4 ? 'K⁺' : '');
      D.sugar(c, P, M.x + M.r * 0.5, yB + M.r * 0.12 + (1 - bz) * M.r * 0.3, rz * 1.5, t * 0.5);
      c.restore();
      c.strokeStyle = P.dark ? 'rgba(201,165,106,.9)' : 'rgba(110,90,60,.8)'; c.lineWidth = 2.5; c.beginPath(); c.arc(M.x, M.y, M.r, 0, TAU); c.stroke();
      var fs = G.narrow ? 10 : 11.5;
      D.tag(c, P, M.x, M.y - M.r - 12, 'one aquaporin, magnified', { size: fs - 0.5, align: 'center' });
      D.tag(c, P, M.x + M.r * 0.9, M.y - M.r * 0.58, 'wall side', { size: fs - 1.5, alpha: 0.9, align: 'right' });
      D.tag(c, P, M.x + M.r * 0.9, M.y + M.r * 0.66, 'inside the cell', { size: fs - 1.5, alpha: 0.9, align: 'right' });
      D.tag(c, P, M.x, M.y + M.r + 14, 'water passes; K⁺ and sugars cannot', { size: fs - 1, align: 'center' });
      // readouts: the water potential balance of this cell
      // negative terms go in brackets after a plus sign, so "+ (−1.20)" never reads as "minus 1.20"
      var mm = function (v) { return (v < -0.004 ? '−' : '') + Math.abs(v).toFixed(2); };
      var br = function (v) { return v < -0.004 ? '(' + mm(v) + ')' : mm(v); };
      var psiS = p.psi - p.turgor;
      D.tag(c, P, C.x, 16, 'Ψ = Ψs + Ψp:  ' + mm(p.psi) + ' = ' + br(psiS) + ' + ' + br(p.turgor) + ' MPa', { size: fs });
      D.tag(c, P, C.x + C.w / 2, C.y + C.h + (G.narrow ? 16 : 22), p.turgor > 0.005 ? 'turgid: the cell presses on its wall' : 'turgor lost: the wall no longer pushed', { size: fs - 0.5, align: 'center', ink: p.turgor > 0.005 ? undefined : (P.dark ? '#ffb48a' : '#9a3a12') });
      var dvs = S.dv || 0, net = Math.abs(dvs) > 0.002 ? (dvs > 0 ? 'water moving in' : 'water moving out') : 'in balance: water crosses both ways';
      if (G.narrow) D.tag(c, P, C.x, 38, net, { size: fs - 0.5 }); else D.tag(c, P, C.x + C.w, 16, net, { size: fs - 0.5, align: 'right' });
      // legend
      var ly = h - 14, lx = G.narrow ? 10 : M.x - M.r;
      if (!G.narrow) {
        var lt = function (txt, x) { c.fillStyle = P.ink2; c.font = '11.5px system-ui,sans-serif'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText(txt, x, ly); };
        D.water(c, P, lx + 6, ly, 4.2, 0.4); lt('water', lx + 15);
        D.ion(c, P, lx + 72, ly, 5.6, P.K, 'K⁺'); lt('potassium', lx + 82);
        D.sugar(c, P, lx + 160, ly, 6, 0.3); lt('sugar', lx + 170);
        if (NM) NM.block(lx - 2, ly - 9, 210, 18);
      }
    };
    return S;
  };

  /* ============================================================ scene: calcium rides the transpiration stream (Afternoon plate)
     set({ Eo, Ei (mmol m−2 s−1), air: bool (air moved into the head), night: bool })
     Drawing scales: water molecules leave each leaf at 3 per second per mmol m−2 s−1 of E; the sap carries a fixed calcium
     concentration, drawn as one Ca2+ for every 6 water molecules. Calcium is left behind when the water evaporates.
     "Needed by new walls" is an ILLUSTRATIVE guess (0.25 Ca2+ per second for the outer leaf, 0.7 for the fast growing inner leaf). */
  MOL.scenes.calcium = function () {
    var S = { p: { Eo: 3, Ei: 0.45, air: false, night: false }, R: rng(61), w: [], vap: [], acc: [0, 0], cnt: [0, 0], dep: [0, 0], g: null, rate: [0, 0] };
    var R = S.R, NEED = [0.25, 0.7], KW = 3, CA_EVERY = 6;
    S.set = function (p) { for (var k in p) S.p[k] = p[k]; };
    S.settle = function () { S.w = []; S.vap = []; S.dep = [0, 0]; };
    S.layout = function (w, h) {
      var nar = w < 560, G = { w: w, h: h, narrow: nar, r: clamp(w / 170, 3.2, 5.2) };
      // two leaves on one stem base; fractions so a resize keeps every molecule in place
      G.L = [{ x: nar ? 0.27 : 0.25, top: 0.14, half: nar ? 0.2 : 0.17, name: 'outer leaf' }, { x: nar ? 0.73 : 0.66, top: 0.30, half: nar ? 0.15 : 0.12, name: 'inner leaf' }];
      G.base = 0.9;
      S.g = G;
    };
    function veinPt(i, f) { // along the midvein, f 0 (base) to 1 (margin)
      var G = S.g, L = G.L[i], xs = 0.5 + (L.x - 0.5) * Math.min(1, f * 3);
      return { x: xs * G.w, y: (G.base - (G.base - L.top) * f) * G.h };
    }
    S.step = function (dt) {
      var G = S.g, p = S.p; if (!G) return;
      [p.Eo, p.Ei].forEach(function (E, i) {
        S.acc[i] += Math.max(0, E) * KW * dt;
        while (S.acc[i] >= 1) { S.acc[i] -= 1; S.cnt[i]++; S.w.push({ i: i, f: 0, ca: S.cnt[i] % CA_EVERY === 0, side: R() < 0.5 ? -1 : 1, off: (R() - 0.5) * 0.6, rot: R() * TAU, sp: 0.22 + 0.04 * R() }); }
      });
      S.w.forEach(function (m) { m.f += m.sp * dt * (0.6 + 0.4 * Math.min(2, (m.i ? p.Ei : p.Eo))); m.rot += dt * 2; });
      S.w = S.w.filter(function (m) {
        if (m.f < 1) return true;
        var L = G.L[m.i], tip = veinPt(m.i, 1);
        if (m.ca) S.dep[m.i] = Math.min(60, S.dep[m.i] + 1);
        else S.vap.push({ i: m.i, x: (tip.x + m.side * L.half * G.w * (0.5 + 0.45 * Math.abs(m.off))) / G.w, y: (tip.y + (0.12 + 0.3 * Math.abs(m.off)) * G.h) / G.h, vx: m.side * (m.i ? 0.01 : 0.05) + (m.i ? 0 : (p.air ? 0 : 0.03)), vy: -0.02 - R() * 0.02, life: 0, rot: m.rot });
        return false;
      });
      S.vap.forEach(function (v) { v.life += dt; v.x += v.vx * dt * (v.i === 0 ? 1.6 : (p.air ? 1.2 : 0.35)); v.y += v.vy * dt; v.rot += dt; });
      S.vap = S.vap.filter(function (v) { return v.life < (v.i ? (p.air ? 2.5 : 5) : 2.2); });
      // new walls use calcium (illustrative demand); the deposit shows supply minus use
      S.dep[0] = Math.max(0, S.dep[0] - NEED[0] * dt); S.dep[1] = Math.max(0, S.dep[1] - NEED[1] * dt);
      S.rate = [p.Eo * KW / CA_EVERY, p.Ei * KW / CA_EVERY];
    };
    function leafShape(c, G, i, inflate) {
      var L = G.L[i], cx = L.x * G.w, top = L.top * G.h, bot = (G.base - 0.08) * G.h, hw = L.half * G.w * inflate;
      c.beginPath(); c.moveTo(cx, bot);
      c.bezierCurveTo(cx - hw * 1.1, bot - (bot - top) * 0.25, cx - hw * 1.05, top + (bot - top) * 0.05, cx, top);
      c.bezierCurveTo(cx + hw * 1.05, top + (bot - top) * 0.05, cx + hw * 1.1, bot - (bot - top) * 0.25, cx, bot);
      c.closePath();
    }
    S.draw = function (c, P, w, h, t, T) {
      var G = S.g, p = S.p; if (!G) return;
      var NM = T && T.names;
      var bg = c.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, P.dark ? '#0d1820' : '#eef2e6'); bg.addColorStop(1, P.dark ? '#101a12' : '#e9e5cf'); c.fillStyle = bg; c.fillRect(0, 0, w, h);
      // the inside of the head: still humid air around the inner leaf
      var L1 = G.L[1], hx = L1.x * w, hy = (L1.top + G.base) / 2 * h;
      var hz = c.createRadialGradient(hx, hy, 10, hx, hy, L1.half * w * 2.6); hz.addColorStop(0, P.dark ? 'rgba(120,170,220,.20)' : 'rgba(120,160,210,.20)'); hz.addColorStop(1, 'rgba(120,160,210,0)');
      c.fillStyle = hz; c.beginPath(); c.ellipse(hx, hy, L1.half * w * 2.4, (G.base - L1.top) * h * 0.75, 0, 0, TAU); c.fill();
      c.setLineDash([5, 5]); c.strokeStyle = P.dark ? 'rgba(157,190,246,.45)' : 'rgba(43,95,164,.35)'; c.lineWidth = 1.2; c.stroke(); c.setLineDash([]);
      // breeze past the outer leaf (and into the head when air is moved)
      c.strokeStyle = P.dark ? 'rgba(200,215,230,.35)' : 'rgba(90,100,110,.35)'; c.lineWidth = 1.4;
      for (var k = 0; k < 4; k++) { var by = (0.18 + k * 0.13) * h, bx = ((t * 60 + k * 90) % (w * 0.5)) - 40; c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(bx + 30, by - 6, bx + 60, by); c.stroke(); }
      if (p.air) for (k = 0; k < 3; k++) { var ay = (0.35 + k * 0.12) * h, ax = hx - L1.half * w * 2.2 + ((t * 40 + k * 50) % (L1.half * w * 1.6)); D.arrow(c, ax, ay, ax + 26, ay, 1.5, P.dark ? 'rgba(200,215,230,.6)' : 'rgba(80,90,100,.55)', 1); }
      // stem base with xylem
      c.fillStyle = P.dark ? '#36502e' : '#cfe0b0'; D.rrect(c, w * 0.12, (G.base - 0.02) * h, w * 0.76, 0.1 * h, 8); c.fill();
      // leaves with their midveins
      [0, 1].forEach(function (i) {
        var Lg = c.createLinearGradient(0, G.L[i].top * h, 0, G.base * h);
        Lg.addColorStop(0, i ? (P.dark ? '#7fa65a' : '#cfe3a2') : (P.dark ? '#4f7a36' : '#9cc46a')); Lg.addColorStop(1, i ? (P.dark ? '#5d7c3e' : '#e6efc8') : (P.dark ? '#3a5a28' : '#b8d68a'));
        c.fillStyle = Lg; leafShape(c, G, i, 1); c.fill();
        c.strokeStyle = P.dark ? 'rgba(200,230,170,.5)' : 'rgba(60,90,30,.45)'; c.lineWidth = 1.2; c.stroke();
        c.strokeStyle = P.dark ? 'rgba(110,160,255,.65)' : 'rgba(43,95,164,.55)'; c.lineWidth = 5; c.lineCap = 'round';
        c.beginPath(); for (var f = 0; f <= 1.001; f += 0.05) { var q = veinPt(i, f); if (!f) c.moveTo(q.x, q.y); else c.lineTo(q.x, q.y); } c.stroke();
        // side veins toward the margin
        c.lineWidth = 1.6; c.strokeStyle = P.dark ? 'rgba(110,160,255,.4)' : 'rgba(43,95,164,.35)';
        [0.48, 0.62, 0.76, 0.88].forEach(function (f2) { var q2 = veinPt(i, f2), hw2 = G.L[i].half * G.w * (0.55 + 0.3 * (1 - f2)); [-1, 1].forEach(function (sd) { c.beginPath(); c.moveTo(q2.x, q2.y); c.quadraticCurveTo(q2.x + sd * hw2 * 0.5, q2.y - 6, q2.x + sd * hw2 * 0.85, q2.y - 22); c.stroke(); }); });
        // calcium already built into the margin (supply minus use)
        var tip = veinPt(i, 1), nD = Math.round(S.dep[i]);
        var Lw = G.L[i].half * G.w;
        for (var d = 0; d < Math.min(nD, 24); d++) { var sd2 = d % 2 ? 1 : -1, fx = 0.18 + Math.floor(d / 2) * 0.065; D.ion(c, P, tip.x + sd2 * Lw * fx, tip.y + 10 + Math.pow(fx, 1.6) * Lw * 0.55, G.r * 0.8, P.Ca, '', 0.9); }
        // a margin that runs short gets a brown rim: a question, not a model result
        var short = clamp(1 - S.rate[i] / NEED[i], 0, 1);
        if (short > 0.05) { c.save(); c.globalAlpha = 0.18 + 0.5 * short; c.strokeStyle = P.dark ? '#d08a4a' : '#9a5a1e'; c.lineWidth = 4; c.setLineDash([3, 4]); leafShape(c, G, i, 1); c.stroke(); c.restore(); }
      });
      // molecules in the veins
      S.w.forEach(function (m) {
        var q = veinPt(m.i, m.f), sx = m.off * 6;
        if (m.ca) D.ion(c, P, q.x + sx, q.y, G.r * 1.25, P.Ca, G.r >= 4 ? 'Ca' : ''); else D.water(c, P, q.x + sx, q.y, G.r, m.rot);
        if (NM && m.f > 0.08 && m.f < 0.92) NM.add(m.ca ? 'Ca' : 'w', m, q.x + sx, q.y, G.r * (m.ca ? 1.25 : 1), m.ca ? 'Ca²⁺' : 'H₂O', { q: G.narrow ? 1 : (m.ca ? 2 : 1) });
      });
      S.vap.forEach(function (v) { var a = clamp(1 - v.life / (v.i ? (p.air ? 2.5 : 5) : 2.2), 0, 1); D.water(c, P, v.x * w, v.y * h, G.r * 0.9, v.rot, a * 0.85); });
      var fs = G.narrow ? 10 : 11.5;
      [0, 1].forEach(function (i) {
        var L = G.L[i], x = L.x * w, need = NEED[i], sup = S.rate[i];
        D.tag(c, P, x, (L.top * h) - 14, L.name + ', E ' + (i ? p.Ei : p.Eo).toFixed(2), { size: fs, align: 'center' });
        // supply vs need bars at the base of each leaf
        var bw = G.narrow ? 70 : 96, bx = x - bw / 2, by = (G.base + 0.035) * h, mx = Math.max(need, sup, 0.8);
        c.fillStyle = P.dark ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.08)'; c.fillRect(bx, by, bw, 6); c.fillRect(bx, by + 9, bw, 6);
        c.fillStyle = P.Ca; c.fillRect(bx, by, bw * clamp(sup / mx, 0, 1), 6);
        c.fillStyle = P.dark ? '#d08a4a' : '#9a5a1e'; c.fillRect(bx, by + 9, bw * clamp(need / mx, 0, 1), 6);
      });
      D.tag(c, P, 8, h - 12, G.narrow ? 'bars: Ca arriving / needed (guess)' : 'bars at each base: Ca arriving (green) and a guessed need of new walls (brown)', { size: fs - 1.5, alpha: 0.92 });
      if (p.Eo < 0.05) D.tag(c, P, w / 2, h * 0.08, 'almost no transpiration: the stream has nearly stopped', { size: fs, align: 'center' });
      else D.tag(c, P, w - 8, 14, 'water leaves, Ca²⁺ stays behind', { size: fs - 1, align: 'right' });
    };
    return S;
  };

  /* ============================================================ scene: air seeding through one pit membrane pore (Tissue plate)
     set({ tension: MPa (positive number, = −Ψ of the water), poreD: nm (largest pore diameter) })
     Physics (DERIVED, Young Laplace, contact angle 0): the meniscus in a pore of diameter D holds a pressure difference
     ΔP = 4γ ÷ D with γ = 0.072 N m−1 (pure water, 25 °C). Air seeds when ΔP = P(gas) − P(water) = 0.1 MPa + tension reaches it.
     Real pit membranes are 3D meshes of fibrils and carry surfactants, so measured thresholds need not follow this one pore rule. */
  MOL.scenes.airseed = function () {
    var S = { p: { tension: 1.0, poreD: 150 }, R: rng(71), gas: [], wat: [], state: 'hold', prog: 0, bub: 0, g: null };
    var R = S.R;
    S.thr = function () { return 4 * 0.072 / (S.p.poreD * 1e-9) / 1e6; };
    S.set = function (p) { for (var k in p) S.p[k] = p[k]; };
    S.reset = function () { S.state = 'hold'; S.prog = 0; S.bub = 0; seedWater(); };
    S.settle = function () { if (S.state === 'seeding') { S.state = 'embolised'; S.prog = 1; } };
    function seedWater() {
      S.wat = []; var R2 = rng(3);
      for (var i = 0; i < 70; i++) S.wat.push({ u: 0.02 + R2() * 0.96, v: 0.04 + R2() * 0.92, a: R2() * TAU, ph: R2() * TAU });
    }
    S.layout = function (w, h) {
      var G = { w: w, h: h, narrow: w < 560, r: clamp(w / 160, 3.6, 5.6) };
      G.aX0 = 8; G.aX1 = w * 0.42; G.bX0 = w * 0.58; G.bX1 = w - 8; G.y0 = 34; G.y1 = h - 44; G.mx = w / 2; G.my = (G.y0 + G.y1) / 2;
      S.g = G;
      if (!S.gas.length) for (var i = 0; i < (G.narrow ? 12 : 18); i++) S.gas.push({ u: R(), v: R(), vu: (R() - 0.5) * 0.6, vv: (R() - 0.5) * 0.6, a: R() * TAU, o2: i % 5 === 0 });
      if (!S.wat.length) seedWater();
    };
    S.step = function (dt) {
      var G = S.g, p = S.p; if (!G) return;
      S.gas.forEach(function (m) { m.u += m.vu * dt; m.v += m.vv * dt; if (m.u < 0.03 || m.u > 0.97) m.vu *= -1; if (m.v < 0.03 || m.v > 0.97) m.vv *= -1; m.u = clamp(m.u, 0.03, 0.97); m.v = clamp(m.v, 0.03, 0.97); m.a += dt * 3; });
      var dP = 0.1 + p.tension, thr = S.thr();
      if (S.state === 'hold' && dP >= thr) { S.state = 'seeding'; S.prog = 0; }
      if (S.state === 'seeding') { S.prog += dt * 0.45; S.bub = S.prog; if (S.prog >= 1) { S.state = 'embolised'; S.prog = 1; } }
      if (S.state === 'hold') S.bub = 0;
      S.wat.forEach(function (m) { m.ph += dt * 1.4; m.a += dt * 0.5; });
    };
    S.draw = function (c, P, w, h, t, T) {
      var G = S.g, p = S.p; if (!G) return;
      var NM = T && T.names;
      var dP = 0.1 + p.tension, thr = S.thr(), k = clamp(dP / thr, 0, 1);
      c.fillStyle = P.dark ? '#0d1218' : '#f2eee0'; c.fillRect(0, 0, w, h);
      // conduit A: gas filled, near atmospheric pressure
      var gA = c.createLinearGradient(G.aX0, 0, G.aX1, 0); gA.addColorStop(0, P.dark ? '#1b2026' : '#d9d6cf'); gA.addColorStop(1, P.dark ? '#23282f' : '#e6e3dc');
      c.fillStyle = gA; c.fillRect(G.aX0, G.y0, G.aX1 - G.aX0, G.y1 - G.y0);
      // conduit B: water under tension, or gas once seeded
      var emb = S.state === 'embolised' ? 1 : (S.state === 'seeding' ? S.prog : 0);
      var gB = c.createLinearGradient(G.bX0, 0, G.bX1, 0); gB.addColorStop(0, P.dark ? '#1d4f8f' : '#a9c6ea'); gB.addColorStop(1, P.dark ? '#163a6a' : '#c6daf2');
      c.fillStyle = gB; c.fillRect(G.bX0, G.y0, G.bX1 - G.bX0, G.y1 - G.y0);
      // walls with the pit pair
      var wc = P.dark ? '#6d5c36' : '#c9b073';
      c.fillStyle = wc; c.fillRect(G.aX1, G.y0, G.bX0 - G.aX1, G.y1 - G.y0);
      c.fillRect(0, G.y0 - 10, w, 10); c.fillRect(0, G.y1, w, 10);
      var ch = (G.y1 - G.y0) * 0.36;
      c.fillStyle = P.dark ? '#121820' : '#ece7da'; c.beginPath(); c.moveTo(G.aX1, G.my - ch * 0.35); c.lineTo(G.mx - 4, G.my - ch); c.lineTo(G.mx + 4, G.my - ch); c.lineTo(G.bX0, G.my - ch * 0.35); c.lineTo(G.bX0, G.my + ch * 0.35); c.lineTo(G.mx + 4, G.my + ch); c.lineTo(G.mx - 4, G.my + ch); c.lineTo(G.aX1, G.my + ch * 0.35); c.closePath(); c.fill();
      // pit chamber: left half gas, right half water (until seeded)
      c.save(); c.clip();
      c.fillStyle = P.dark ? '#1b2026' : '#dedbd3'; c.fillRect(G.aX1, G.y0, G.mx - G.aX1, G.y1 - G.y0);
      c.fillStyle = P.dark ? '#1d4f8f' : '#a9c6ea'; c.fillRect(G.mx, G.y0, G.bX0 - G.mx, G.y1 - G.y0);
      c.restore();
      // pit membrane: a mesh of fibrils with gaps; the largest pore at the centre
      var pr = 9; // drawn half width of the largest pore
      c.strokeStyle = P.dark ? '#d6c08a' : '#7a5f2a'; c.lineWidth = 1.3;
      for (var i = 0; i < 14; i++) {
        var yy = G.my - ch + 4 + i * (2 * ch - 8) / 13; if (Math.abs(yy - G.my) < pr + 2) continue;
        c.beginPath(); c.moveTo(G.mx - 5, yy); c.quadraticCurveTo(G.mx, yy + Math.sin(i * 1.7) * 3, G.mx + 5, yy + Math.sin(i) * 1.5); c.stroke();
      }
      c.lineWidth = 2; c.beginPath(); c.moveTo(G.mx - 3, G.my - ch); c.lineTo(G.mx - 3, G.my - pr - 2); c.moveTo(G.mx - 3, G.my + pr + 2); c.lineTo(G.mx - 3, G.my + ch); c.moveTo(G.mx + 3, G.my - ch); c.lineTo(G.mx + 3, G.my - pr - 2); c.moveTo(G.mx + 3, G.my + pr + 2); c.lineTo(G.mx + 3, G.my + ch); c.stroke();
      // gas molecules in A (N2 grey pairs, O2 red pairs)
      S.gas.forEach(function (m) {
        var x = G.aX0 + 10 + m.u * (G.aX1 - G.aX0 - 20), y = G.y0 + 10 + m.v * (G.y1 - G.y0 - 20), dx = Math.cos(m.a) * G.r * 0.75, dy = Math.sin(m.a) * G.r * 0.75;
        var col = m.o2 ? P.O : (P.dark ? '#8fa3b8' : '#7d8ea0');
        D.ball(c, x - dx, y - dy, G.r * 0.85, col, shade(col, 0.5), shade(col, -0.4)); D.ball(c, x + dx, y + dy, G.r * 0.85, col, shade(col, 0.5), shade(col, -0.4));
        if (NM) NM.add(m.o2 ? 'O2' : 'N2', m, x, y, G.r * 1.2, m.o2 ? 'O₂' : 'N₂', { q: 1 });
      });
      // water in B, cohesive: hydrogen bond dashes stretch with tension; molecules leave as the bubble grows
      var cut = emb, keep = S.wat.filter(function (m) { return m.u > cut * 1.02; });
      c.strokeStyle = P.dark ? 'rgba(220,235,255,.28)' : 'rgba(40,70,120,.28)'; c.lineWidth = 1; c.setLineDash([2, 3]);
      keep.forEach(function (m, j) { if (j % 2) return; var n = keep[(j + 7) % keep.length], x = G.bX0 + m.u * (G.bX1 - G.bX0), y = G.y0 + m.v * (G.y1 - G.y0), nx = G.bX0 + n.u * (G.bX1 - G.bX0), ny = G.y0 + n.v * (G.y1 - G.y0); if (Math.hypot(nx - x, ny - y) < 70) { c.beginPath(); c.moveTo(x, y); c.lineTo(nx, ny); c.stroke(); } });
      c.setLineDash([]);
      keep.forEach(function (m) { var j = 1.5 + 2.5 * (1 - k), wx = G.bX0 + m.u * (G.bX1 - G.bX0) + Math.sin(m.ph) * j, wy = G.y0 + m.v * (G.y1 - G.y0) + Math.cos(m.ph * 1.3) * j; D.water(c, P, wx, wy, G.r, m.a); if (NM) NM.add('w', m, wx, wy, G.r, 'H₂O', { q: 1 }); });
      // the meniscus in the largest pore: bulges toward B as the pressure difference nears the threshold
      if (S.state === 'hold') {
        var sag = pr * k * 0.98;
        c.fillStyle = P.dark ? '#1b2026' : '#dedbd3'; c.strokeStyle = P.dark ? '#cfe3ff' : '#2b5fa4'; c.lineWidth = 2;
        c.beginPath(); c.moveTo(G.mx, G.my - pr); c.quadraticCurveTo(G.mx + sag * 2, G.my, G.mx, G.my + pr); c.closePath(); c.fill(); c.stroke();
      } else {
        // a bubble pulled through, then expanding to fill B
        var br = lerp(pr, Math.max(G.bX1 - G.bX0, G.y1 - G.y0) * 1.1, Math.pow(S.prog, 1.6)), bx = G.mx + lerp(pr, (G.bX1 - G.bX0) * 0.5, S.prog);
        c.save(); c.beginPath(); c.rect(G.mx, G.y0, G.bX1 - G.mx, G.y1 - G.y0); c.clip();
        c.fillStyle = P.dark ? '#1b2026' : '#dedbd3'; c.beginPath(); c.arc(bx, G.my, br, 0, TAU); c.fill();
        c.strokeStyle = P.dark ? '#cfe3ff' : '#2b5fa4'; c.lineWidth = 2; c.stroke(); c.restore();
      }
      // labels
      var fs = G.narrow ? 10 : 11.5, mm = function (v) { return '−' + v.toFixed(2); };
      D.tag(c, P, G.aX0 + 4, 16, G.narrow ? 'A: gas' : 'A: gas filled, near atmospheric pressure', { size: fs });
      D.tag(c, P, G.bX1 - 4, 16, S.state === 'hold' ? (G.narrow ? 'B: water ' + mm(p.tension) + ' MPa' : 'B: water under tension, Ψ ' + mm(p.tension) + ' MPa') : 'B: now gas filled', { size: fs, align: 'right' });
      D.tag(c, P, G.mx, G.y1 + 26, 'largest pore ' + Math.round(p.poreD) + ' nm: holds until ' + thr.toFixed(2) + ' MPa of pressure difference', { size: fs - 1, align: 'center' });
      if (S.state === 'hold') D.tag(c, P, G.mx, G.my - ch - 16, 'meniscus at ' + Math.round(k * 100) + ' % of its limit', { size: fs - 1, align: 'center' });
      else D.tag(c, P, G.mx, G.my - ch - 16, 'air seeded: B is embolised', { size: fs, align: 'center', ink: P.dark ? '#ffb48a' : '#9a3a12' });
    };
    return S;
  };

  /* ============================================================ scene: vapour leaving a leaf into the field air (Field plate)
     set({ T (°C, leaf = air in the model), RH (%), E (mmol m−2 s−1), wind (m s−1), open (0..1) })
     Drawing scales (DERIVED): one drawn vapour molecule per 0.09 kPa of vapour pressure in each box, so the crowding inside
     the leaf (saturated at leaf temperature) against the crowding in the air (RH × saturation) is the VPD you see;
     molecules leave through the stomata at 2.5 per second per mmol m−2 s−1 of E; the boundary layer thins as wind rises. */
  MOL.scenes.vapour = function () {
    var S = { p: { T: 22, RH: 60, E: 2, wind: 2, open: 0.6 }, R: rng(81), ins: [], out: [], esc: [], acc: 0, g: null };
    var R = S.R;
    function es(T) { return 0.6108 * Math.exp(17.27 * T / (T + 237.3)); }
    S.set = function (p) { for (var k in p) S.p[k] = p[k]; };
    S.settle = function () { S.esc = []; };
    S.layout = function (w, h) {
      var nar = w < 560, G = { w: w, h: h, narrow: nar, r: clamp(w / 170, 3.2, 5) };
      G.yC = 0.06 * h; G.yE0 = 0.10 * h; G.yM1 = 0.42 * h; G.yE1 = 0.50 * h; // cuticle, upper epidermis, mesophyll air space, lower epidermis
      G.st = nar ? [0.25, 0.7] : [0.18, 0.47, 0.76];
      S.g = G;
    };
    function fill(list, n, box) { while (list.length < n) list.push({ u: R(), v: R(), vu: (R() - 0.5) * 0.4, vv: (R() - 0.5) * 0.4, a: R() * TAU, box: box }); while (list.length > n) list.pop(); }
    S.step = function (dt) {
      var G = S.g, p = S.p; if (!G) return;
      var ei = es(p.T), ea = ei * clamp(p.RH, 0, 100) / 100;
      fill(S.ins, Math.round(ei / 0.09 * (G.narrow ? 0.6 : 1)), 0); fill(S.out, Math.round(ea / 0.09 * (G.narrow ? 0.6 : 1)), 1);
      var wind = Math.max(0.2, p.wind);
      [S.ins, S.out].forEach(function (L, b) { L.forEach(function (m) { m.u += m.vu * dt + (b ? wind * 0.02 * dt * m.v : 0); m.v += m.vv * dt; if (m.u > 1) m.u -= 1; if (m.u < 0) m.u += 1; if (m.v < 0.02 || m.v > 0.98) m.vv *= -1; m.v = clamp(m.v, 0.02, 0.98); m.a += dt; }); });
      S.acc += Math.max(0, p.E) * 2.5 * dt;
      while (S.acc >= 1) { S.acc -= 1; var si = Math.floor(R() * G.st.length); S.esc.push({ s: si, t: 0, dx: (R() - 0.5) * 0.04, a: R() * TAU }); }
      var bl = 0.10 / Math.sqrt(wind); // boundary layer thickness as a fraction of the height
      S.esc.forEach(function (m) { m.t += dt * (m.t < 0.35 ? 0.9 : 0.6); m.a += dt * 2; if (m.t > 0.35) m.dx += wind * 0.03 * dt; });
      S.esc = S.esc.filter(function (m) { return m.t < 1.2; });
      S.bl = bl;
    };
    S.draw = function (c, P, w, h, t, T) {
      var G = S.g, p = S.p; if (!G) return;
      var NM = T && T.names;
      var air = c.createLinearGradient(0, G.yE1, 0, h); air.addColorStop(0, P.dark ? '#13202c' : '#e7eef4'); air.addColorStop(1, P.dark ? '#0d151d' : '#f3f5f2');
      c.fillStyle = air; c.fillRect(0, 0, w, h);
      // leaf: cuticle, upper epidermis, mesophyll with air spaces, lower epidermis with stomata
      c.fillStyle = P.cut; c.fillRect(0, G.yC, w, G.yE0 - G.yC);
      c.fillStyle = P.epi; c.fillRect(0, G.yE0, w, (G.yM1 - G.yE0) * 0.22);
      c.fillStyle = P.dark ? '#16261a' : '#eef3e0'; c.fillRect(0, G.yE0 + (G.yM1 - G.yE0) * 0.22, w, G.yM1 - G.yE0 - (G.yM1 - G.yE0) * 0.22);
      for (var i = 0; i < (G.narrow ? 5 : 9); i++) { var cx = (i + 0.5) / (G.narrow ? 5 : 9) * w; c.fillStyle = P.dark ? 'rgba(80,130,60,.6)' : 'rgba(150,190,110,.55)'; c.beginPath(); c.ellipse(cx, (G.yE0 + G.yM1) / 2 + 6, w / (G.narrow ? 12 : 22), (G.yM1 - G.yE0) * 0.26, 0, 0, TAU); c.fill(); }
      c.fillStyle = P.epi; c.fillRect(0, G.yM1, w, G.yE1 - G.yM1);
      var op = clamp(p.open, 0, 1);
      G.st.forEach(function (f) {
        var x = f * w, gw = 4 + 9 * op;
        c.fillStyle = P.dark ? '#16261a' : '#eef3e0'; c.fillRect(x - gw, G.yM1, 2 * gw, G.yE1 - G.yM1);
        [-1, 1].forEach(function (sd) { D.ball(c, x + sd * (gw + 7), (G.yM1 + G.yE1) / 2, (G.yE1 - G.yM1) * 0.48, P.guard, P.guardHi, shade(P.guard, -0.35)); });
      });
      // boundary layer band below the leaf
      var blh = clamp(S.bl || 0.07, 0.03, 0.22) * h;
      c.fillStyle = P.dark ? 'rgba(120,170,220,.10)' : 'rgba(60,110,170,.08)'; c.fillRect(0, G.yE1, w, blh);
      c.setLineDash([4, 5]); c.strokeStyle = P.dark ? 'rgba(157,190,246,.45)' : 'rgba(43,95,164,.4)'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, G.yE1 + blh); c.lineTo(w, G.yE1 + blh); c.stroke(); c.setLineDash([]);
      // wind arrows in the free air
      var wind = Math.max(0.2, p.wind);
      for (var k = 0; k < 3; k++) { var wy = G.yE1 + blh + (0.2 + k * 0.25) * (h - G.yE1 - blh), wx = ((t * 18 * wind + k * 140) % (w + 80)) - 60; D.arrow(c, wx, wy, wx + 20 + 6 * wind, wy, 1.4, P.dark ? 'rgba(200,215,230,.45)' : 'rgba(80,90,100,.4)', 1); }
      // vapour inside the leaf air spaces (saturated) and in the air below
      var inBox = { x: 0, y: G.yE0 + (G.yM1 - G.yE0) * 0.3, w: w, h: (G.yM1 - G.yE0) * 0.65 }, outBox = { x: 0, y: G.yE1 + 6, w: w, h: h - G.yE1 - 30 };
      S.ins.forEach(function (m) { D.water(c, P, inBox.x + m.u * inBox.w, inBox.y + m.v * inBox.h, G.r * 0.85, m.a, 0.9); if (NM && !G.narrow) NM.add('vin', m, inBox.x + m.u * inBox.w, inBox.y + m.v * inBox.h, G.r * 0.85, 'H₂O vapour', { q: 1 }); });
      S.out.forEach(function (m) { D.water(c, P, outBox.x + m.u * outBox.w, outBox.y + m.v * outBox.h, G.r * 0.85, m.a, 0.8); });
      // molecules escaping through the stomata, slowed in the boundary layer, then carried by the wind
      S.esc.forEach(function (m) {
        var x0 = G.st[m.s % G.st.length] * w, y, x;
        if (m.t < 0.35) { y = lerp(G.yM1 - 6, G.yE1 + blh, m.t / 0.35); x = x0 + m.dx * w * (m.t / 0.35); }
        else { y = G.yE1 + blh + (m.t - 0.35) * (h - G.yE1 - blh) * 0.9; x = x0 + m.dx * w; }
        if (m.tr) { if (m.t <= 1.15) D.tracer(c, P, x, y, G.r, m, !G.narrow); } else { D.water(c, P, x, y, G.r, m.a, m.t > 1 ? clamp((1.2 - m.t) / 0.2, 0, 1) : 1); if (NM && m.t > 0.1 && m.t < 0.95) NM.add('vout', m, x, y, G.r, 'H₂O', { q: 1 }); }
      });
      if (!S.esc.some(function (m) { return m.tr; })) { var cand = S.esc.filter(function (m) { return m.t < 0.1; }); if (cand.length) { cand[0].tr = true; cand[0].trail = []; } }
      var fs = G.narrow ? 10 : 11.5, ei = es(p.T), ea = ei * p.RH / 100;
      D.tag(c, P, 8, (G.yE0 + G.yM1) / 2 - 8, G.narrow ? 'inside: saturated, ' + ei.toFixed(2) + ' kPa' : 'air spaces inside the leaf: saturated, ' + ei.toFixed(2) + ' kPa', { size: fs });
      D.tag(c, P, 8, h - 14, (G.narrow ? 'air: ' : 'field air below the leaf: ') + ea.toFixed(2) + ' kPa, VPD ' + (ei - ea).toFixed(2) + ' kPa', { size: fs });
      D.tag(c, P, w - 8, G.yE1 + blh + 12, G.narrow ? 'boundary layer' : 'boundary layer: thinner when windy', { size: fs - 1, align: 'right', alpha: 0.92 });
      D.tag(c, P, G.st[0] * w, G.yE1 + 12, 'stoma', { size: fs - 1.5, align: 'center', alpha: 0.9 });
    };
    return S;
  };

  /* ============================================================ scene: a column of water pulled up a vessel (Plant plate)
     set({ E, psi: {soil, root, stem, petiole, leafOut}, hgt (m) })
     Molecules rise at 14 px s−1 per mmol m−2 s−1 of E (drawn speed; real sap moves mm to cm per second); the dashes between
     neighbours are hydrogen bonds, drawn more stretched as the tension grows. Pit pairs on the side walls let water step
     into the next vessel. */
  MOL.scenes.cohesion = function () {
    var S = { p: { E: 2, psi: { soil: -0.1, root: -0.2, stem: -0.3, petiole: -0.35, leafOut: -0.6 }, hgt: 1.5 }, R: rng(91), col: [], vap: [], off: 0, acc: 0, g: null };
    var R = S.R;
    S.set = function (p) { for (var k in p) S.p[k] = p[k]; };
    S.settle = function () { S.vap = []; };
    S.layout = function (w, h) {
      var nar = w < 560, G = { w: w, h: h, narrow: nar, r: clamp(w / 150, 3.6, 5.6) };
      G.vx0 = w * (nar ? 0.28 : 0.36); G.vx1 = w * (nar ? 0.56 : 0.52); G.top = 0.16 * h; G.bot = 0.86 * h;
      S.g = G;
      if (!S.col.length) for (var i = 0; i < 60; i++) S.col.push({ v: i / 60, u: 0.2 + R() * 0.6, a: R() * TAU });
    };
    S.step = function (dt) {
      var G = S.g, p = S.p; if (!G) return;
      var sp = Math.max(0, p.E) * 14 / (G.bot - G.top);
      S.col.forEach(function (m) { m.v += sp * dt; m.a += dt * 0.8; if (m.v > 1) { m.v -= 1; m.u = 0.2 + R() * 0.6; if (p.E > 0.02) S.vap.push({ x: 0, y: 0, t: 0, a: m.a, dx: R() }); } });
      S.vap.forEach(function (v) { v.t += dt * 0.7; v.a += dt * 2; });
      S.vap = S.vap.filter(function (v) { return v.t < 1; });
    };
    S.draw = function (c, P, w, h, t, T) {
      var G = S.g, p = S.p; if (!G) return;
      var NM = T && T.names;
      c.fillStyle = P.dark ? '#0d1410' : '#f2efdf'; c.fillRect(0, 0, w, h);
      // soil at the bottom, leaf at the top
      var sg = c.createLinearGradient(0, G.bot, 0, h); sg.addColorStop(0, P.dark ? '#3b2f22' : '#c9b48c'); sg.addColorStop(1, P.dark ? '#2a2118' : '#b29a70');
      c.fillStyle = sg; c.fillRect(0, G.bot, w, h - G.bot);
      for (var i = 0; i < 8; i++) D.grain(c, P, (i + 0.5) / 8 * w, G.bot + (h - G.bot) * 0.55, 10 + (i % 3) * 3, 200 + i, 0.8);
      c.fillStyle = P.dark ? '#2f4a2a' : '#b8d68a'; c.fillRect(0, 0, w, G.top);
      c.fillStyle = P.dark ? '#16261a' : '#e6efd2'; for (i = 0; i < 6; i++) { c.beginPath(); c.ellipse((i + 0.5) / 6 * w, G.top * 0.5, w / 16, G.top * 0.28, 0, 0, TAU); c.fill(); }
      // vessel: lignified wall with rings, and pits on the side walls
      var wc = P.dark ? '#6d5c36' : '#c9b073';
      c.fillStyle = P.dark ? 'rgba(40,90,170,.45)' : 'rgba(150,190,235,.55)'; c.fillRect(G.vx0, G.top, G.vx1 - G.vx0, G.bot - G.top);
      c.fillStyle = wc; c.fillRect(G.vx0 - 7, G.top, 7, G.bot - G.top); c.fillRect(G.vx1, G.top, 7, G.bot - G.top);
      c.strokeStyle = wc; c.lineWidth = 3; for (var y = G.top + 10; y < G.bot; y += 26) { c.beginPath(); c.moveTo(G.vx0, y); c.quadraticCurveTo((G.vx0 + G.vx1) / 2, y + 7, G.vx1, y); c.stroke(); }
      c.fillStyle = P.dark ? '#121a14' : '#f2efdf'; for (y = G.top + 30; y < G.bot - 10; y += 56) { c.beginPath(); c.ellipse(G.vx0 - 3.5, y, 2.5, 6, 0, 0, TAU); c.ellipse(G.vx1 + 3.5, y + 20, 2.5, 6, 0, 0, TAU); c.fill(); }
      // tension: hydrogen bonds stretch as Ψ falls
      var ten = clamp(-p.psi.leafOut / 2, 0, 1);
      var pts = S.col.map(function (m) { return { x: G.vx0 + m.u * (G.vx1 - G.vx0), y: G.bot - m.v * (G.bot - G.top), a: m.a }; });
      c.strokeStyle = P.dark ? 'rgba(220,235,255,' + (0.25 + 0.3 * ten).toFixed(2) + ')' : 'rgba(40,70,120,' + (0.25 + 0.3 * ten).toFixed(2) + ')'; c.lineWidth = 1; c.setLineDash([2, 2 + 3 * ten]);
      pts.forEach(function (q, j) { [1, 2].forEach(function (d) { var n = pts[(j + d) % pts.length]; if (Math.abs(n.y - q.y) < 40) { c.beginPath(); c.moveTo(q.x, q.y); c.lineTo(n.x, n.y); c.stroke(); } }); });
      c.setLineDash([]);
      pts.forEach(function (q, j) { if (j !== 0) { D.water(c, P, q.x, q.y, G.r, q.a); if (NM && S.col[j].v > 0.08 && S.col[j].v < 0.9) NM.add('w', S.col[j], q.x, q.y, G.r, 'H₂O', { q: 1 }); } });
      if (pts[0]) { var cm0 = S.col[0]; cm0.a = pts[0].a; D.tracer(c, P, pts[0].x, pts[0].y, G.r, cm0, !G.narrow); }
      // vapour leaving the leaf at the top
      S.vap.forEach(function (v) { D.water(c, P, (G.vx0 + G.vx1) / 2 + (v.dx - 0.5) * w * 0.5 * v.t, G.top - v.t * G.top * 0.9, G.r * 0.9, v.a, 1 - v.t); });
      // Ψ gauge beside the vessel, from the model
      var gx = G.narrow ? w * 0.6 : w * 0.66, nodes = [['leaf', p.psi.leafOut, 0.02], ['petiole', p.psi.petiole, 0.25], ['stem', p.psi.stem, 0.5], ['root', p.psi.root, 0.8], ['soil', p.psi.soil, 1.02]];
      var fs = G.narrow ? 10 : 11.5;
      c.strokeStyle = P.ink2; c.lineWidth = 1; c.beginPath(); c.moveTo(gx, G.top); c.lineTo(gx, G.bot); c.stroke();
      nodes.forEach(function (n) {
        var yy = G.top + n[2] * (G.bot - G.top);
        D.ball(c, gx, clamp(yy, G.top + 2, h - 10), 5, WPcol(n[1], P), '#ffffff', shade(WPcol(n[1], P), -0.4));
        D.tag(c, P, gx + 12, clamp(yy, G.top + 10, h - 12), n[0] + ' ' + (n[1] < 0 ? '−' : '') + Math.abs(n[1]).toFixed(2) + ' MPa', { size: fs - 0.5 });
      });
      D.tag(c, P, 8, G.top * 0.5, p.E > 0.02 ? (G.narrow ? 'leaves lose ' + p.E.toFixed(2) + ' mmol m⁻² s⁻¹' : 'pulled from above: the leaves lose ' + p.E.toFixed(2) + ' mmol m⁻² s⁻¹') : 'no transpiration: the column hangs still', { size: fs });
      D.tag(c, P, G.vx0 - 4, G.bot - 16, 'xylem vessel', { size: fs - 1, align: 'right' });
    };
    function hx(n) { n = Math.round(clamp(n, 0, 255)); return (n < 16 ? '0' : '') + n.toString(16); }
    function WPcol(psi, P) { var f = clamp(-psi / 2.5, 0, 1); return P.dark ? '#' + hx(70 + 140 * f) + hx(140 + 60 * f) + hx(255 - 40 * f) : '#' + hx(30 + 150 * f) + hx(80 + 110 * f) + hx(170 + 50 * f); }
    return S;
  };

  /* ============================================================ scene: starve or thirst (journey builder, 13 Oct)
     One stoma on the lower surface. CO2 drifts in from the air below, up through the pore, to the chloroplasts; water
     vapour leaves through the same pore. set({ open: 0..1 pore width, co2: drawn CO2 molecules s−1, h2o: drawn water
     molecules s−1, ratio: text for the tag }). The caller sets both drawn rates from model rates with fixed scale factors
     and states them; the theatre invents none. Every sixth CO2 fixed pops a sugar hexagon at a chloroplast. */
  MOL.scenes.stomagas = function () {
    var S = { p: { open: 0.5, co2: 3, h2o: 6, ratio: '' }, open: 0.5, c: [], w: [], s: [], aC: 0, aW: 0, fixed: 0, R: rng(29), g: null, cnt: MOL.Counter(5), t: 0 };
    var R = S.R;
    S.set = function (p) { for (var k in p) S.p[k] = p[k]; };
    S.settle = function () { S.open = S.p.open; S.c = []; S.w = []; S.s = []; S.aC = 0; S.aW = 0; };
    S.layout = function (w, h) {
      var G = { w: w, h: h, narrow: w < 560 };
      G.yLe = Math.round(h * 0.52); G.yL = Math.round(h * 0.66); G.sx = w * 0.5;
      G.chl = []; var n = G.narrow ? 4 : 6;
      for (var i = 0; i < n; i++) { var x = (i + 0.5) * w / n; if (Math.abs(x - G.sx) < 40) x += (x < G.sx ? -30 : 30); G.chl.push({ x: x, y: h * (0.16 + 0.12 * (i % 2)) }); }
      S.g = G;
    };
    S.step = function (dt) {
      var G = S.g, p = S.p; if (!G) return; S.t += dt;
      S.open += (p.open - S.open) * Math.min(1, dt * 3);
      var gap = 3 + 22 * S.open;
      S.aC += Math.max(0, p.co2) * dt;
      while (S.aC >= 1) { S.aC -= 1; S.c.push({ x: R() * G.w, y: G.h + 8, ph: 0, a: R() * TAU, tgt: G.chl[Math.floor(R() * G.chl.length)] }); }
      S.aW += Math.max(0, p.h2o) * dt;
      while (S.aW >= 1) { S.aW -= 1; S.w.push({ x: G.sx + (R() - 0.5) * 30, y: G.yLe - 20 - R() * 30, ph: 0, a: R() * TAU, vx: 0, vy: 0, life: 0 }); }
      var slow = 0.35 + 0.65 * S.open;
      S.c.forEach(function (m) {
        m.a += dt * 1.5;
        if (m.ph === 0) { // drift toward the pore mouth
          var dx = G.sx - m.x, dy = (G.yL + 10) - m.y, d = Math.hypot(dx, dy) || 1;
          m.x += dx / d * 55 * dt + (R() - 0.5) * 20 * dt; m.y += dy / d * 55 * dt;
          if (d < 12) m.ph = S.open > 0.04 ? 1 : 3;
        } else if (m.ph === 1) { // through the pore
          m.x += (G.sx - m.x) * dt * 4; m.y -= 90 * slow * dt; if (m.y < G.yLe - 8) m.ph = 2;
        } else if (m.ph === 2) { // to a chloroplast
          var ex = m.tgt.x - m.x, ey = m.tgt.y - m.y, e = Math.hypot(ex, ey) || 1;
          m.x += ex / e * 70 * dt; m.y += ey / e * 70 * dt;
          if (e < 10) { m.dead = true; S.fixed++; S.cnt.add(S.t, 'c'); if (S.fixed % 6 === 0) S.s.push({ x: m.tgt.x, y: m.tgt.y, life: 0, a: R() * TAU }); }
        } else { m.y += 30 * dt; m.x += (R() - 0.5) * 40 * dt; if (m.y > G.h + 10) m.dead = true; } // pore shut: wander off
      });
      S.w.forEach(function (m) {
        m.life += dt; m.a += dt * 2;
        if (m.y < G.yL + 4) { m.x += (G.sx - m.x) * dt * 3; m.y += (S.open > 0.04 ? 70 * slow : 4) * dt; if (m.y >= G.yL + 4) S.cnt.add(S.t, 'w'); }
        else { if (!m.fan) { m.fan = 1; m.vx = (R() - 0.5) * 130; m.vy = 40 + R() * 40; } m.x += m.vx * dt; m.y += m.vy * dt; m.vx *= (1 - 0.6 * dt); }
        if (m.y > G.h + 10 || m.life > 12) m.dead = true;
      });
      S.s.forEach(function (m) { m.life += dt; m.y -= 12 * dt; m.a += dt; if (m.life > 3) m.dead = true; });
      S.c = S.c.filter(function (m) { return !m.dead; }); S.w = S.w.filter(function (m) { return !m.dead; }); S.s = S.s.filter(function (m) { return !m.dead; });
      if (S.w.length > 220) S.w.splice(0, S.w.length - 220); if (S.c.length > 160) S.c.splice(0, S.c.length - 160);
      if (S.w.length > 40 && S.open < 0.04) S.w.splice(0, S.w.length - 40);
    };
    S.draw = function (c, P, w, h, t, T) {
      var G = S.g; if (!G) return;
      var NM = T && T.names;
      var gap = 3 + 22 * S.open, fs = G.narrow ? 10.5 : 11.5;
      // mesophyll
      var gm = c.createLinearGradient(0, 0, 0, G.yLe); gm.addColorStop(0, P.dark ? '#14201a' : '#e9edd6'); gm.addColorStop(1, P.cav);
      c.fillStyle = gm; c.fillRect(0, 0, w, G.yLe);
      G.chl.forEach(function (q) {
        var g = c.createRadialGradient(q.x - 6, q.y - 5, 2, q.x, q.y, 26);
        g.addColorStop(0, P.dark ? '#b8e6a0' : '#d6efc4'); g.addColorStop(1, P.dark ? '#3f6a32' : '#6f9a52');
        c.fillStyle = g; c.beginPath(); c.ellipse(q.x, q.y, 26, 14, 0.2, 0, TAU); c.fill();
        c.strokeStyle = P.dark ? 'rgba(200,240,180,.35)' : 'rgba(60,90,50,.45)'; c.lineWidth = 1; c.stroke();
      });
      // lower epidermis with the stoma
      var cellW = G.narrow ? 62 : 84;
      for (var x = -14; x < w; x += cellW) {
        if (x + cellW > G.sx - 40 - gap / 2 && x < G.sx + 40 + gap / 2) continue;
        var ge = c.createLinearGradient(0, G.yLe, 0, G.yL); ge.addColorStop(0, P.epiHi); ge.addColorStop(1, P.epi);
        c.fillStyle = ge; rrect(c, x + 2, G.yLe, cellW - 4, G.yL - G.yLe, 9); c.fill();
        c.strokeStyle = P.dark ? 'rgba(160,200,150,.35)' : 'rgba(90,110,70,.45)'; c.lineWidth = 1.2; c.stroke();
      }
      c.fillStyle = P.cut; c.fillRect(0, G.yL - 3, G.sx - gap / 2 - 36, 5); c.fillRect(G.sx + gap / 2 + 36, G.yL - 3, w, 5);
      [-1, 1].forEach(function (sg) {
        var cx = G.sx + sg * (gap / 2 + 18), cy = (G.yLe + G.yL) / 2, ry = (G.yL - G.yLe) * 0.46;
        var gg = c.createRadialGradient(cx - sg * 4, cy - ry * 0.4, 3, cx, cy, 28); gg.addColorStop(0, P.guardHi); gg.addColorStop(1, P.guard);
        c.fillStyle = gg; c.beginPath(); c.ellipse(cx, cy, 18, ry, 0, 0, TAU); c.fill();
        c.strokeStyle = P.dark ? 'rgba(200,240,180,.4)' : 'rgba(60,90,50,.5)'; c.lineWidth = 1.2; c.stroke();
      });
      // air below
      var ga = c.createLinearGradient(0, G.yL, 0, h); ga.addColorStop(0, P.air); ga.addColorStop(1, P.dark ? '#0a121b' : '#f6f2e6');
      c.fillStyle = ga; c.fillRect(0, G.yL + 2, w, h - G.yL - 2);
      // flux arrows, width set by the drawn rates
      D.flux(c, P, G.sx - 70, h - 10, G.sx - 14, G.yL + 6, 6 + 3 * Math.min(6, S.p.co2), 0.14);
      D.flux(c, P, G.sx + 14, G.yLe + 4, G.sx + 70, h - 8, 6 + 1.5 * Math.min(12, S.p.h2o), 0.14);
      S.s.forEach(function (m) { D.sugar(c, P, m.x, m.y, 7, m.a, Math.max(0, 1 - m.life / 3)); if (NM && m.life < 2.2) NM.add('sug', m, m.x, m.y, 7, 'sugar', { all: true }); });
      S.w.forEach(function (m) { D.water(c, P, m.x, m.y, 4.6, m.a, 0.9); if (NM && m.fan) NM.add('w', m, m.x, m.y, 4.6, 'H₂O'); });
      S.c.forEach(function (m) { D.co2(c, P, m.x, m.y, 4.4, m.a, 0.95); if (NM) NM.add('co2', m, m.x, m.y, 5.5, 'CO₂'); });
      D.tag(c, P, 8, 13, G.narrow ? 'Mesophyll: chloroplasts fix CO₂' : 'Mesophyll: chloroplasts fix CO₂ into sugar', { size: fs });
      D.tag(c, P, 8, h - 13, G.narrow ? 'CO₂ in' : 'Air below the leaf: CO₂ in', { size: fs });
      D.tag(c, P, w - 8, h - 13, 'water vapour out', { size: fs, align: 'right' });
      D.tag(c, P, G.sx, G.yLe - 12, S.open < 0.04 ? 'stoma shut' : 'one pore, two jobs', { size: fs - 0.5, align: 'center' });
      if (S.p.ratio) D.tag(c, P, w - 8, 13, S.p.ratio, { size: fs, align: 'right' });
    };
    return S;
  };

  window.MOL = MOL;
  if (window.WP) window.WP.mol = MOL;
  if (typeof module !== 'undefined') module.exports = MOL;
})();

/* trip_strip.js, L1 round 5 (12 Oct 2026). The live strip at the top of the Water Path map:
   one molecule of water from the soil to the sky, in miniature, clickable into the matching plate.
   Water potentials are a SNAPSHOT of the journey engine at its default afternoon (journey/engine.js, WP.solve(WP.defaults),
   12 Oct 2026): soil −0.10, root −0.24, stem −0.36, leaf −0.57 MPa, air about −126 MPa. MODEL values (DERIVED), not measurements.
   "About 1 in 60 to 1 in 100 is split at PSII" (one site wording, 13 Oct) is DERIVED from the light module's default leaf: 2 H2O split per CO2 fixed (4 electrons)
   against about 188 transpired per CO2 (Plate V), i.e. about 1 %; counting the electrons photorespiration uses gives about 1 in 60 (Light V live number). Drawing and timing are not to scale.
   Respects prefers-reduced-motion, the site theme, a Pause button, and only draws while visible. */
(function () {
  'use strict';
  var host = document.getElementById('tripStrip'); if (!host) return;
  var cv = host.querySelector('canvas'), ctx = cv && cv.getContext('2d'); if (!ctx) return;
  var pauseBtn = host.querySelector('[data-trip-pause]');
  var reduce = false; try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var paused = reduce, visible = true, W = 0, H = 0, dpr = 1, raf = 0, last = 0;
  var SEG = [
    { id: 'soil', a: 0.00, b: 0.14, label: 'Soil', psi: '−0.10', href: 'journey/index.html#organ', name: 'Soil and roots, Plate III' },
    { id: 'root', a: 0.14, b: 0.27, label: 'Root', psi: '−0.24', href: 'journey/index.html#organ', name: 'Roots, Plate III' },
    { id: 'stem', a: 0.27, b: 0.58, label: 'Stem xylem', psi: '−0.36', href: 'journey/index.html#plant', name: 'The whole plant, Plate II' },
    { id: 'leaf', a: 0.58, b: 0.80, label: 'Leaf', psi: '−0.57', href: 'journey/index.html#tissue', name: 'Leaf tissue, Plate IV' },
    { id: 'air', a: 0.80, b: 1.00, label: 'Stoma and air', psi: '−126', href: 'journey/index.html#field', name: 'The field and the air, Plate I' }
  ];
  function dark() {
    var t = document.documentElement.getAttribute('data-theme');
    if (t) return t === 'dark';
    try { return matchMedia('(prefers-color-scheme: dark)').matches; } catch (e) { return false; }
  }
  /* the path, in fractions of width and height */
  function P(u) {
    /* piecewise: soil (low, wandering) → root (rises) → stem (level tube) → leaf (enters, drops to lower surface) → stoma → air (drifts up and right) */
    var x, y;
    if (u < 0.14) { var k = u / 0.14; x = 0.02 + 0.12 * k; y = 0.80 + 0.05 * Math.sin(k * 9); }
    else if (u < 0.27) { var k2 = (u - 0.14) / 0.13; x = 0.14 + 0.13 * k2; y = 0.80 - 0.28 * k2; }
    else if (u < 0.58) { var k3 = (u - 0.27) / 0.31; x = 0.27 + 0.31 * k3; y = 0.52; }
    else if (u < 0.80) { var k4 = (u - 0.58) / 0.22; x = 0.58 + 0.22 * k4; y = 0.52 + 0.14 * Math.sin(k4 * Math.PI * 0.5); }
    else { var k5 = (u - 0.80) / 0.20; x = 0.80 + 0.19 * k5; y = 0.66 + 0.10 * k5 - 0.62 * k5 * k5; }
    return [x * W, y * H];
  }
  var mols = [], tracer = null, splits = [], acc = 0, nSplit = 0;
  var nid = 0;
  function spawn(u0) { return { id: ++nid, u: u0 || 0, j: (Math.random() - 0.5) * 8, v: 0.055 + Math.random() * 0.02, s: Math.random() < 0.01 }; }
  function seed() { named = []; mols = []; for (var i = 0; i < 42; i++) mols.push(spawn(i / 42)); tracer = spawn(0.03); tracer.v = 0.06; tracer.tr = true; }
  function size() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(280, cv.clientWidth || host.clientWidth || 280); H = W < 520 ? 224 : 206; /* slow and named, 13 Oct: about 20 % taller (was 190 / 170) */
    cv.style.height = H + 'px'; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function tag(t, x, y, al, D, strong) {
    ctx.font = (strong ? '600 ' : '') + (W < 520 ? '11px' : '12px') + ' system-ui, sans-serif';
    var w = ctx.measureText(t).width + 12, h = 18, x0 = al === 'right' ? x - w : al === 'center' ? x - w / 2 : x;
    x0 = Math.max(2, Math.min(W - w - 2, x0));
    BOX.push({ x: x0 - 2, y: y - 15, w: w + 4, h: h + 4 });
    ctx.fillStyle = D ? 'rgba(20,26,34,.88)' : 'rgba(255,252,244,.92)'; rr(x0, y - 13, w, h, 9); ctx.fill();
    ctx.strokeStyle = D ? 'rgba(160,190,220,.45)' : 'rgba(80,70,55,.35)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = D ? '#e8eef4' : '#2b2620'; ctx.textBaseline = 'alphabetic'; ctx.fillText(t, x0 + 6, y);
  }
  /* slow and named (13 Oct): H₂O names under at most 2 molecules (1 on phones), ANTI CLUTTER RULE. Stable choice: a named
     molecule keeps its name until it wraps back to the soil; a name that would touch a label tag, another name or the edge
     waits hidden (up to about 45 frames) instead of jumping to another molecule. Follows the page's MolNames switch. */
  var BOX = [], named = [], miss = {};
  function namesOn() { return !window.MolNames || window.MolNames.get(); }
  function hit(a, b) { return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h; }
  function nameBox(p, r, fs) { ctx.font = '700 ' + fs + 'px system-ui, sans-serif'; var w = ctx.measureText('H₂O').width + 8, h = fs + 5; return { x: p[0] - w / 2 - 1, y: p[1] + r + 2, w: w + 2, h: h + 2, tw: w, th: h }; }
  function free(b) { if (b.x < 2 || b.y < 2 || b.x + b.w > W - 2 || b.y + b.h > H - 2) return false; for (var i = 0; i < BOX.length; i++) if (hit(b, BOX[i])) return false; return true; }
  function pill(b, cx, D, fs) {
    var x0 = b.x + 1, y0 = b.y + 1, w = b.tw, h = b.th;
    ctx.fillStyle = D ? 'rgba(10,14,12,0.78)' : 'rgba(255,253,246,0.9)'; rr(x0, y0, w, h, h / 2); ctx.fill();
    ctx.fillStyle = D ? '#f6f1e4' : '#1d2a22'; ctx.font = '700 ' + fs + 'px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('H₂O', cx, y0 + h / 2 + 0.5); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  }
  function mj(m) { return m.u < 0.58 && m.u > 0.27 ? m.j * 0.6 : m.j; }
  function drawNames(D, r) {
    if (!namesOn()) { named = []; return; }
    var phone = W < 520, q = phone ? 1 : 2, fs = phone ? 9.5 : 10.5;
    function ok(m) { return m.u > 0.03 && m.u < 0.82; } // soil, root, stem or leaf; not fading into the air
    named = named.filter(function (m) { return ok(m) && (miss[m.id] || 0) < 45; });
    if (named.length < q) {
      var cand = mols.filter(function (m) { return ok(m) && m.u < 0.74 && named.indexOf(m) < 0; }).sort(function (a, b) { return a.u - b.u; });
      for (var i = 0; i < cand.length && named.length < q; i++) {
        var m = cand[i], p = P(m.u), far = named.every(function (n) { var pn = P(n.u); return Math.hypot(pn[0] - p[0], pn[1] - p[1]) > (phone ? 60 : 90); });
        if (far && free(nameBox([p[0], p[1] + mj(m)], r, fs))) { named.push(m); miss[m.id] = 0; }
      }
    }
    named.forEach(function (m) {
      var p = P(m.u); p = [p[0], p[1] + mj(m)]; var b = nameBox(p, r, fs);
      if (!free(b)) { miss[m.id] = (miss[m.id] || 0) + 1; return; }
      miss[m.id] = 0; BOX.push(b); pill(b, p[0], D, fs);
    });
  }
  function water(x, y, r, D, glow) {
    if (glow) { ctx.fillStyle = D ? 'rgba(120,200,255,.28)' : 'rgba(40,120,200,.22)'; ctx.beginPath(); ctx.arc(x, y, r * 3.2, 0, 6.29); ctx.fill(); }
    ctx.fillStyle = '#f4f4f4'; ctx.strokeStyle = D ? 'rgba(0,0,0,0)' : 'rgba(90,90,90,.6)'; ctx.lineWidth = 0.6;
    ctx.beginPath(); ctx.arc(x - r * 0.95, y - r * 0.55, r * 0.55, 0, 6.29); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + r * 0.95, y - r * 0.55, r * 0.55, 0, 6.29); ctx.fill(); ctx.stroke();
    var g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0.5, x, y, r); g.addColorStop(0, '#ff8a7a'); g.addColorStop(1, '#c62b1e');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.29); ctx.fill();
  }
  function scene(D) {
    var bg = ctx.createLinearGradient(0, 0, 0, H);
    if (D) { bg.addColorStop(0, '#141922'); bg.addColorStop(1, '#11161b'); } else { bg.addColorStop(0, '#e9f1f6'); bg.addColorStop(1, '#f6f1e6'); }
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    /* soil */
    ctx.fillStyle = D ? '#3a2b1f' : '#9c7b58'; ctx.fillRect(0, H * 0.70, W * 0.24, H * 0.30);
    for (var i = 0; i < 26; i++) { var gx = (i * 37.3) % (W * 0.24), gy = H * 0.72 + (i * 23.7) % (H * 0.26); ctx.fillStyle = D ? 'rgba(160,130,95,.55)' : 'rgba(110,80,50,.55)'; ctx.beginPath(); ctx.arc(gx, gy, 3 + (i % 3), 0, 6.29); ctx.fill(); }
    /* root: a tan cylinder rising */
    ctx.strokeStyle = D ? '#b89a6a' : '#c9a774'; ctx.lineWidth = Math.max(14, H * 0.11); ctx.lineCap = 'round';
    ctx.beginPath(); var a = P(0.15), b = P(0.27); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    ctx.strokeStyle = D ? '#7a5b32' : '#8a6a3c'; ctx.lineWidth = 2; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); ctx.setLineDash([]);
    /* stem vessel with lignin rings */
    var s0 = P(0.27), s1 = P(0.58), th = Math.max(16, H * 0.12);
    ctx.fillStyle = D ? 'rgba(90,140,200,.18)' : 'rgba(80,140,200,.16)'; rr(s0[0] - 4, s0[1] - th / 2, s1[0] - s0[0] + 8, th, th / 2); ctx.fill();
    ctx.strokeStyle = D ? 'rgba(200,170,110,.55)' : 'rgba(120,90,40,.45)'; ctx.lineWidth = 1.4;
    for (var x = s0[0] + 6; x < s1[0]; x += 11) { ctx.beginPath(); ctx.moveTo(x, s0[1] - th / 2); ctx.lineTo(x, s0[1] + th / 2); ctx.stroke(); }
    /* leaf: a lens, upper and lower epidermis, stoma on the LOWER surface */
    var lx0 = W * 0.57, lx1 = W * 0.84, ly = H * 0.56, lh = H * 0.26;
    var lg = ctx.createLinearGradient(0, ly - lh / 2, 0, ly + lh / 2); lg.addColorStop(0, D ? '#3f7d3a' : '#7fbf5f'); lg.addColorStop(1, D ? '#2c5a29' : '#5f9f45');
    ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(lx0, ly); ctx.quadraticCurveTo((lx0 + lx1) / 2, ly - lh, lx1, ly); ctx.quadraticCurveTo((lx0 + lx1) / 2, ly + lh, lx0, ly); ctx.fill();
    var st = P(0.80); ctx.fillStyle = D ? '#141922' : '#e9f1f6'; ctx.beginPath(); ctx.ellipse(st[0], st[1] + 2, 6, 3, 0, 0, 6.29); ctx.fill();
    ctx.fillStyle = D ? '#9fd36a' : '#3f7a2a'; ctx.beginPath(); ctx.ellipse(st[0] - 7, st[1] + 1, 5, 3.5, 0, 0, 6.29); ctx.fill(); ctx.beginPath(); ctx.ellipse(st[0] + 7, st[1] + 1, 5, 3.5, 0, 0, 6.29); ctx.fill();
    /* chloroplast with PSII, a branch upward */
    var cx = W * 0.70, cy = H * 0.47; ctx.fillStyle = D ? '#5aa04a' : '#2f7d32'; ctx.beginPath(); ctx.ellipse(cx, cy, 11, 6, -0.3, 0, 6.29); ctx.fill();
  }
  function frame(t) {
    raf = 0; if (!visible) return;
    var dt = last ? Math.min(0.05, (t - last) / 1000) : 0; last = t; dt *= (window.PlaySpeed ? window.PlaySpeed.get() : 1); if (paused) dt = 0;
    var D = dark(); scene(D); BOX = [];
    var r = W < 520 ? 3.2 : 3.6;
    mols.forEach(function (m) {
      if (dt) { m.u += m.v * dt; if (m.s && m.u > 0.70 && !m.done) { m.done = true; splits.push({ x: W * 0.70, y: H * 0.47, t: 0 }); nSplit++; m.u = 0; m.s = Math.random() < 0.01; } if (m.u >= 1) { m.u = 0; m.s = Math.random() < 0.01; m.done = false; } }
      var p = P(m.u); var jy = mj(m);
      ctx.globalAlpha = m.u > 0.85 ? Math.max(0.15, 1 - (m.u - 0.85) * 5) : 1; water(p[0], p[1] + jy, r * 0.85, D, false); ctx.globalAlpha = 1;
    });
    if (dt) { tracer.u += tracer.v * dt; if (tracer.u >= 1) tracer.u = 0; }
    var tp = P(tracer.u); water(tp[0], tp[1], r * 1.25, D, true);
    splits.forEach(function (s) { if (dt) s.t += dt; var k = s.t / 1.2; ctx.globalAlpha = Math.max(0, 1 - k); ctx.strokeStyle = '#f2c94c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(s.x, s.y, 4 + 16 * k, 0, 6.29); ctx.stroke(); ctx.globalAlpha = 1; });
    splits = splits.filter(function (s) { return s.t < 1.2; });
    /* labels */
    var phone = W < 520;
    SEG.forEach(function (s, i) {
      var mid = P((s.a + s.b) / 2), y = phone ? (i % 2 ? 34 : 16) : 18;
      tag(phone ? s.label.replace('Stoma and air', 'Air') : s.label + '  Ψ ' + s.psi + (s.id === 'air' ? ' MPa' : ''), mid[0], y, 'center', D);
    });
    tag('your molecule', tp[0] + 8, Math.min(H - 6, tp[1] + 22), 'left', D, true);
    tag(phone ? '1 in 60 to 1 in 100: split at PSII' : 'about 1 in 60 to 1 in 100 is split at PSII: Light to sugar', W * 0.70, H * 0.38, 'center', D);
    BOX.push({ x: tp[0] - r * 3.5, y: tp[1] - r * 3.5, w: r * 7, h: r * 7 }); // keep names off the glowing tracer
    drawNames(D, r * 0.85);
    if (!paused) raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf && visible) raf = requestAnimationFrame(frame); }
  size(); seed();
  if (reduce) { /* a still, complete frame */ last = 0; visible = true; frame(0); }
  else kick();
  var lastW = W;
  function onResize() { var w = cv.clientWidth || host.clientWidth; if (!w || Math.abs(w - lastW) < 1) return; lastW = w; size(); seed(); last = 0; if (raf) { cancelAnimationFrame(raf); raf = 0; } var v = visible; visible = true; frame(0); visible = v; }
  window.addEventListener('resize', onResize);
  if ('ResizeObserver' in window) new ResizeObserver(onResize).observe(host);
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) { last = 0; if (paused) frame(0); else kick(); } }, { threshold: 0.05 }).observe(cv);
  try { new MutationObserver(function () { if (paused) frame(0); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] }); } catch (e) {}
  if (pauseBtn && window.PlaySpeed && !reduce) { var li = document.createElement('li'); li.appendChild(window.PlaySpeed.chip('ps-light')); var pli = pauseBtn.closest('li'); if (pli && pli.parentNode) pli.parentNode.insertBefore(li, pli.nextSibling); }
  if (window.MolNames) window.MolNames.on(function () { if (paused) { var v = visible; visible = true; frame(0); visible = v; } });
  if (pauseBtn) { pauseBtn.textContent = paused ? 'Play' : 'Pause'; pauseBtn.setAttribute('aria-pressed', paused ? 'true' : 'false');
    pauseBtn.addEventListener('click', function () { paused = !paused; pauseBtn.textContent = paused ? 'Play' : 'Pause'; pauseBtn.setAttribute('aria-pressed', paused ? 'true' : 'false'); last = 0; if (paused) frame(0); else kick(); }); }
  /* click on the strip: go to the plate under the pointer (the links below the canvas do the same for keyboards) */
  cv.addEventListener('click', function (e) {
    var r = cv.getBoundingClientRect(), fx = (e.clientX - r.left) / r.width, fy = (e.clientY - r.top) / r.height;
    if (fx > 0.62 && fx < 0.80 && fy < 0.5) { location.href = 'light/index.html#thylakoid'; return; }
    for (var i = 0; i < SEG.length; i++) if (fx >= SEG[i].a && fx <= SEG[i].b + 1e-9) { location.href = SEG[i].href; return; }
  });
})();

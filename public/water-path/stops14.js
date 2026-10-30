/* The Water Path · stops 1 to 5 in the molecular style (unifier round 7, 12 Oct 2026)
   Carries the journey's molecular theatre (journey/mol.js: moving water molecules, membranes, aquaporins, rounded tags,
   rates set by a model) into the original stops: Read a section, Water potential and turgor, Growth (Fig 4.1, 4.2) and
   Demand (Fig 5.1 to 5.4), and gives each of those stops its own Test yourself in the v7 format.
   - Needs journey/mol.js (window.MOL) and stops14_quiz.js; loaded BEFORE app.js, runs from window.WP_INIT after WP.boot
     has built the v7 figures, so it can read each figure's own state (WP.FIGS) instead of re-implementing it.
   - Nothing in app.js or the figures is changed: each theatre listens to its figure's inputs, or wraps that figure
     instance's draw(), and redraws from the same numbers. Every theatre states its drawing scale.
   - Southern California chips (inland valley, Santa Ana) are added to Fig 5.1 and Fig 5.4 as ILLUSTRATIVE teaching values,
     the same five afternoons used on the journey Field plate and Light to sugar Plate V. */
(function () {
  'use strict';
  var INIT = window.WP_INIT = window.WP_INIT || [];
  var MINUS = '−';
  var TH = []; // theatres, for theme changes
  function clamp(x, a, b) { return x < a ? a : (x > b ? b : x); }
  function sg(v, d) { return (v < -0.0005 ? MINUS : (v > 0.0005 ? '+' : '')) + Math.abs(v).toFixed(d == null ? 2 : d); }
  function mn(v, d) { return (v < -0.0005 ? MINUS : '') + Math.abs(v).toFixed(d == null ? 2 : d); }
  function isDark() { var t = document.documentElement.getAttribute('data-theme'); if (t) return t === 'dark'; try { return matchMedia('(prefers-color-scheme: dark)').matches; } catch (e) { return false; } }
  function reduced() { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
  function es(T) { return 0.6108 * Math.exp(17.27 * T / (T + 237.3)); }
  function el(html) { var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }
  function badge(b, cls) { return '<span class="badge' + (cls ? ' ' + cls : '') + '">' + b + '</span>'; }
  function store() { return (window.WP && window.WP.store) || { get: function (k, d) { return d; }, set: function () {} }; }

  /* ---------------------------------------------------------------- CSS (scoped to .u7) */
  var CSS = [
    '.u7.molfig{border:1px solid var(--line-strong);border-radius:var(--r-2);background:var(--surface);padding:.9rem 1rem 1rem;margin:1.2rem 0 1.6rem}',
    '.u7 .u7head{display:flex;gap:.6rem;align-items:flex-start;justify-content:space-between;flex-wrap:wrap}',
    '.u7 .u7head h3{margin:.1rem 0 .2rem;font-size:var(--fs-h3);font-family:var(--font-display)}',
    '.u7 .u7kick{font-family:var(--font-mono);font-size:.75rem;letter-spacing:.05em;text-transform:uppercase;color:var(--ink-2)}',
    '.u7 .u7try{margin:.4rem 0 .7rem;font-size:.97rem;max-width:46rem}',
    '.u7 .u7stage{margin:.4rem 0;min-height:120px}',
    '.u7 .u7stage canvas{border:1px solid var(--line)}',
    '.u7 .u7two{display:grid;gap:.8rem}',
    '@media (min-width:1100px){.u7 .u7two.side{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}}',
    '.u7 .u7lab{font-family:var(--font-mono);font-size:.8rem;color:var(--ink-2);margin:.2rem 0}',
    '.u7 .u7ctl{display:flex;flex-wrap:wrap;gap:.5rem .9rem;align-items:center;margin:.6rem 0}',
    '.u7 .u7ctl .ctl{flex:1 1 16rem;min-width:0}',
    '.u7 .u7ctl input[type=range]{width:100%}',
    '.u7 .u7cap{font-size:.92rem;color:var(--ink-2);margin:.5rem 0 .2rem;max-width:46rem}',
    '.u7 .u7now{font-size:.97rem;margin:.5rem 0;min-height:1.5em}',
    '.u7 .u7pv{width:100%;max-width:520px;display:block}',
    '.u7 .tiles{margin:.6rem 0}',
    '.u7 details.depth{margin-top:.6rem}',
    '.u7q{margin:2rem 0 1rem}',
    '.u7q .u7qhead h2{margin:.1rem 0 .3rem}',
    '.u7q .tiers{margin:.8rem 0}',
    '.u7q .qround[hidden]{display:none}',
    '.u7q .ptc.qz .q{font-family:var(--font-body);font-size:1.05rem;font-weight:600;line-height:1.45;margin:0 0 .6rem}',
    '.u7q .ptc.qz .q:focus{outline:none}',
    '.u7 .chip input:disabled+span{opacity:.75}'
  ].join('\n');

  /* ---------------------------------------------------------------- a theatre card */
  function card(o) {
    var h = '<section class="u7 molfig" id="' + o.id + '" aria-label="' + o.title.replace(/"/g, '&quot;') + '">' +
      '<div class="u7head"><div><span class="u7kick">' + o.kick + '</span><h3>' + o.title + '</h3></div>' +
      '<div class="figtools"><button class="btn" type="button" data-u7="pause" aria-pressed="false">Pause</button></div></div>' +
      '<p class="u7try">' + o.tryText + '</p>' +
      (o.predict ? '<div data-u7pred></div>' : '') +
      (o.controls ? '<div class="u7ctl">' + o.controls + '</div>' : '') +
      '<div class="u7stage" data-u7stage></div>' + (o.extra || '') +
      '<p class="u7now" data-u7now role="status" aria-live="polite"></p>' +
      '<details class="depth check"><summary><span class="dl">Check it</span><span class="ds">what the animation shows, at what scale, and the sources</span><span class="dbadges">' + (o.badges || '') + '</span></summary>' +
      '<div class="depth-body"><p class="prov">' + o.scale + '</p></div></details></section>';
    return el(h);
  }
  function mount(host, scene, height, label, prewarm) {
    var M = window.MOL; if (!M || !M.scenes) return null;
    /* slow and named (13 Oct): theatres about 25 % taller at desktop, 18 % on phones (cap 600 px) */
    var hBig = function (cw) { var h0 = typeof height === 'function' ? height(cw) : (height || 300); return Math.min(600, Math.round(h0 * (cw < 560 ? 1.18 : 1.25))); };
    var T = M.Theatre(host, scene, { height: hBig, dark: isDark(), reduce: reduced(), label: label, prewarm: prewarm || 6 });
    TH.push(T); return T;
  }
  function wirePause(box, Ts) {
    var b = box.querySelector('[data-u7="pause"]'); if (!b) return;
    if (window.PlaySpeed && !box.querySelector('[data-ps="chip"]')) b.parentNode.insertBefore(window.PlaySpeed.chip('ps-light'), b.nextSibling); // speed chip beside Pause
    b.addEventListener('click', function () { var p; Ts.forEach(function (T) { if (T) p = T.pause(); }); b.setAttribute('aria-pressed', p ? 'true' : 'false'); b.textContent = p ? 'Play' : 'Pause'; });
    /* v19: reduced motion starts on a still frame and Play runs it; a still click on the view freezes or plays */
    var T0 = Ts.filter(function (T) { return T; })[0];
    if (window.WPFreeze && T0) Ts.forEach(function (T) { if (T) WPFreeze.attach(T.canvas, { paused: function () { return T0.paused; }, button: b }); });
  }
  /* predict then check, same markup and feel as the v7 .ptc boxes; prediction kept in this browser only */
  function predict(host, key, q, opts, answer, revealHTML) {
    if (!host) return;
    var name = 'u7p-' + key;
    var box = el('<div class="ptc"><p class="q">' + q + '</p><fieldset class="chips"><legend class="sr">Your prediction</legend>' +
      opts.map(function (o) { return '<label class="chip"><input type="radio" name="' + name + '" value="' + o[0] + '"><span>' + o[1] + '</span></label>'; }).join('') +
      '</fieldset><div class="row"><button class="btn primary" type="button" data-a="check" disabled>Check</button><button class="btn" type="button" data-a="again" hidden>Try again</button></div>' +
      '<div class="ans" hidden><h3 tabindex="-1"></h3>' + revealHTML + '</div></div>');
    host.appendChild(box);
    var radios = [].slice.call(box.querySelectorAll('input')), chk = box.querySelector('[data-a=check]'), again = box.querySelector('[data-a=again]'), ans = box.querySelector('.ans');
    function lock(v) {
      radios.forEach(function (r) { r.disabled = true; if (r.value === v) r.checked = true; });
      var lab = opts.filter(function (o) { return o[0] === v; })[0], right = opts.filter(function (o) { return o[0] === answer; })[0];
      ans.querySelector('h3').textContent = (v === answer ? 'Right: ' : 'You said ' + (lab ? lab[1].replace(/<[^>]+>/g, '') : v) + '. The answer: ') + right[1].replace(/<[^>]+>/g, '') + '.';
      ans.hidden = false; chk.hidden = true; again.hidden = false;
    }
    radios.forEach(function (r) { r.addEventListener('change', function () { chk.disabled = false; }); });
    chk.addEventListener('click', function () { var v = radios.filter(function (r) { return r.checked; })[0]; if (!v) return; lock(v.value); var s = store().get('u7ptc', {}) || {}; s[key] = v.value; store().set('u7ptc', s); ans.querySelector('h3').focus(); });
    again.addEventListener('click', function () { radios.forEach(function (r) { r.disabled = false; r.checked = false; }); ans.hidden = true; chk.hidden = false; chk.disabled = true; again.hidden = true; var s = store().get('u7ptc', {}) || {}; delete s[key]; store().set('u7ptc', s); });
    var prev = (store().get('u7ptc', {}) || {})[key]; if (prev) lock(prev);
  }
  /* slow and named (13 Oct): offer a molecule to the theatre's namer (journey/mol.js MOL.Namer, ANTI CLUTTER RULE) */
  function nameIt(T, kind, key, x, y, r, text, o) { if (T && T.names && key) T.names.add(kind, key, x, y, r, text, o); }
  function figOf(id) { var F = (window.WP && window.WP.FIGS) || []; for (var i = 0; i < F.length; i++) if (F[i].el && F[i].el.id === id) return F[i]; return null; }
  function after(fig, fn) { // run fn after every draw of that figure instance
    if (!fig) return; var orig = fig.draw; fig.draw = function () { var r = orig.apply(this, arguments); try { fn(this); } catch (e) { console.error(e); } return r; };
  }
  function insertAfter(ref, node) { ref.parentNode.insertBefore(node, ref.nextSibling); }
  function sec(r) { return document.querySelector('section.route[data-route="' + r + '"]'); }
  function chipRow(name, list, on) {
    return '<fieldset class="chips"><legend class="sr">' + name + '</legend>' + list.map(function (c) {
      return '<label class="chip"><input type="radio" name="' + name + '" value="' + c[0] + '"' + (c[0] === on ? ' checked' : '') + '><span>' + c[1] + '</span></label>'; }).join('') + '</fieldset>';
  }
  function onChip(box, name, fn) { [].slice.call(box.querySelectorAll('input[name="' + name + '"]')).forEach(function (r) { r.addEventListener('change', function () { if (r.checked) fn(r.value); }); }); }

  /* ================================================================ custom scene: a growing wall (Fig 4.1)
     set({ psip (MPa), Y (MPa), phi (relative), night: bool })
     Drawing scale (ILLUSTRATIVE): the cell lengthens at 60 px per second per MPa of turgor above Y (φ drawn as 1);
     a new cellulose hoop is laid every 14 px of new length; water enters through the aquaporins at 1 molecule per
     2 px of growth, because the new volume is water. Below Y the wall is pressed but does not yield. */
  function growScene() {
    var M = window.MOL, D = M.draw, R = M.rng(7);
    var S = { p: { psip: 0.8, Y: 0.7, phi: 1, night: true }, L: 0, mol: [], hoops: 0, acc: 0, g: null, laid: [] };
    S.set = function (p) { for (var k in p) S.p[k] = p[k]; };
    S.settle = function () { S.mol = []; };
    S.layout = function (w, h) { S.g = { w: w, h: h, narrow: w < 560, x0: w * 0.06, y0: h * 0.24, y1: h * 0.70, Lmin: w * (w < 560 ? 0.42 : 0.38), Lmax: w * 0.86, r: clamp(w / 140, 3.9, 5.9) }; };
    S.rate = function () { return Math.max(0, S.p.psip - S.p.Y) * S.p.phi; };
    S.step = function (dt) {
      var G = S.g; if (!G) return;
      var gr = S.rate() * 60, dL = gr * dt;
      S.L += dL; S.acc += dL / 2;
      if (S.L > G.Lmax - G.Lmin) { S.L = 0; S.laid = []; }
      while (S.acc >= 1) { S.acc -= 1; S.mol.push({ t: 0, y: G.y0 + 10 + R() * (G.y1 - G.y0 - 20), a: R() * 6.28, top: R() < 0.5 }); }
      S.mol.forEach(function (m) { m.t += dt * 0.8; m.a += dt * 2; });
      S.mol = S.mol.filter(function (m) { return m.t < 1; });
      var sp = 14; while (S.laid.length < Math.floor(S.L / sp)) S.laid.push({ t: 0 });
      S.laid.forEach(function (q) { q.t = Math.min(1, q.t + dt * 0.8); });
    };
    S.draw = function (c, P, w, h, t, T) {
      var G = S.g; if (!G) return;
      var bg = c.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, P.dark ? '#0d1612' : '#f5f1df'); bg.addColorStop(1, P.dark ? '#0a100e' : '#ece9d2');
      c.fillStyle = bg; c.fillRect(0, 0, w, h);
      var x1 = G.x0 + G.Lmin + S.L, ym = (G.y0 + G.y1) / 2, wt = 9, grow = S.rate() > 0.0005, fs = G.narrow ? 10 : 11.5;
      // apoplast film
      c.fillStyle = P.dark ? 'rgba(70,120,200,.16)' : 'rgba(120,160,220,.16)'; D.rrect(c, G.x0 - 10, G.y0 - 12, x1 - G.x0 + 22, G.y1 - G.y0 + 24, 22); c.fill();
      // wall
      var wg = c.createLinearGradient(0, G.y0, 0, G.y1); wg.addColorStop(0, P.dark ? '#6d5c36' : '#e2cf95'); wg.addColorStop(1, P.dark ? '#4a3e24' : '#c7ae6c');
      c.fillStyle = wg; D.rrect(c, G.x0, G.y0, x1 - G.x0, G.y1 - G.y0, 18); c.fill();
      // protoplast and vacuole
      c.fillStyle = P.dark ? '#22302a' : '#e3e9cf'; D.rrect(c, G.x0 + wt, G.y0 + wt, x1 - G.x0 - 2 * wt, G.y1 - G.y0 - 2 * wt, 13); c.fill();
      c.strokeStyle = P.dark ? 'rgba(127,224,168,.85)' : 'rgba(22,90,52,.8)'; c.lineWidth = 1.8; c.stroke();
      var vg = c.createLinearGradient(0, G.y0, 0, G.y1); vg.addColorStop(0, P.dark ? 'rgba(60,110,170,.75)' : 'rgba(214,230,246,.95)'); vg.addColorStop(1, P.dark ? 'rgba(30,60,100,.8)' : 'rgba(178,204,234,.95)');
      c.fillStyle = vg; D.rrect(c, G.x0 + wt + 14, G.y0 + wt + 12, x1 - G.x0 - 2 * wt - 28, G.y1 - G.y0 - 2 * wt - 24, 10); c.fill();
      // cellulose hoops: the old ones evenly spread, the new ones laid in the growing zone and glowing as they arrive
      var nOld = Math.max(6, Math.round(G.Lmin / 18));
      c.lineWidth = 2;
      for (var i = 0; i < nOld; i++) { var hx = G.x0 + 14 + i * (G.Lmin - 20) / nOld; c.strokeStyle = P.dark ? 'rgba(240,220,170,.55)' : 'rgba(120,90,40,.5)'; c.beginPath(); c.moveTo(hx, G.y0 + 1); c.lineTo(hx + 4, G.y0 + wt - 1); c.moveTo(hx, G.y1 - 1); c.lineTo(hx + 4, G.y1 - wt + 1); c.stroke(); }
      S.laid.forEach(function (q, k) { var hx = G.x0 + G.Lmin - 6 + k * 14; c.strokeStyle = 'rgba(232,137,26,' + (0.35 + 0.6 * (1 - q.t)).toFixed(2) + ')'; c.lineWidth = 2.6 - q.t; c.beginPath(); c.moveTo(hx, G.y0 + 1); c.lineTo(hx + 4, G.y0 + wt - 1); c.moveTo(hx, G.y1 - 1); c.lineTo(hx + 4, G.y1 - wt + 1); c.stroke(); });
      // turgor arrows press outward on the wall
      var tg = clamp(S.p.psip / 1.2, 0, 1);
      if (tg > 0.01) for (i = 0; i < (G.narrow ? 5 : 8); i++) {
        var ax = G.x0 + 30 + i * (x1 - G.x0 - 60) / ((G.narrow ? 5 : 8) - 1), al = 6 + 12 * tg, col = P.dark ? 'rgba(157,190,246,.85)' : 'rgba(43,95,164,.7)';
        D.arrow(c, ax, ym - 10, ax, G.y0 + wt + 4 - (al - 6) * 0.1, 1.6, col, 0.4 + 0.5 * tg); D.arrow(c, ax, ym + 10, ax, G.y1 - wt - 4, 1.6, col, 0.4 + 0.5 * tg);
      }
      D.arrow(c, x1 - 40, ym, x1 - wt - 2, ym, 2.2, P.dark ? 'rgba(157,190,246,.9)' : 'rgba(43,95,164,.8)', 0.4 + 0.5 * tg);
      // wall loosening proteins at the growing end: active only when turgor exceeds Y
      for (i = 0; i < 3; i++) {
        var px = x1 - 2, py = G.y0 + (i + 0.5) * (G.y1 - G.y0) / 3, wob = grow ? Math.sin(t * 5 + i) * 2 : 0;
        D.ball(c, px + wob, py, 6, grow ? P.prot2 : (P.dark ? '#5a5a5a' : '#b8b2a6'), grow ? P.prot2Hi : '#eeeeee', grow ? P.prot2Lo : '#6b665e', grow ? 1 : 0.7);
      }
      // aquaporins on the long walls and water entering while the cell grows
      for (i = 0; i < 4; i++) { var qx = G.x0 + 30 + i * (x1 - G.x0 - 60) / 3; D.aqp(c, P, qx, G.y0 + wt + 1, 4.4, 0, 1, true); D.aqp(c, P, qx, G.y1 - wt - 1, 4.4, Math.PI, 1, true); }
      S.mol.forEach(function (m, k) {
        var qx = G.x0 + 30 + (k % 4) * (x1 - G.x0 - 60) / 3, y = m.top ? G.y0 - 14 + m.t * 44 : G.y1 + 14 - m.t * 44, a = m.t < 0.15 ? m.t / 0.15 : (m.t > 0.85 ? (1 - m.t) / 0.15 : 1);
        D.water(c, P, qx, y, G.r, m.a, a); if (a > 0.6) nameIt(T, 'H₂O', m, qx, y, G.r, 'H₂O');
      });
      // tags
      D.tag(c, P, G.x0, 16, 'turgor ' + S.p.psip.toFixed(2) + ' MPa · yield threshold Y ' + S.p.Y.toFixed(2) + ' MPa', { size: fs });
      D.tag(c, P, G.x0, h - 16, grow ? 'growing: the wall yields, new wall is laid in, water moves in' : 'pressing, not yielding: turgor is below Y, so no growth', { size: fs, ink: grow ? undefined : (P.dark ? '#ffb48a' : '#9a3a12') });
      if (!G.narrow) D.tag(c, P, Math.min(w - 8, x1 + 8), G.y0 - 4, grow ? 'wall loosening at the growing end' : 'wall locked', { size: fs - 1, align: x1 + 200 > w ? 'right' : 'left' });
      D.tag(c, P, w - 8, 16, S.p.night ? 'night (predawn turgor)' : 'midday turgor', { size: fs - 0.5, align: 'right' });
    };
    return S;
  }

  /* ================================================================ custom scene: what stops first (Fig 4.2)
     set({ psi: leaf water potential (MPa) })
     Two lanes, each with its activity drawn as molecule traffic. Growth: water molecules entering an expanding cell;
     photosynthesis: CO2 entering a chloroplast and sugars leaving. The activity shapes are ILLUSTRATIVE, anchored on the
     measured thresholds: leaf enlargement strongly inhibited by −0.4 MPa (corn, soybean, sunflower) and soybean
     photosynthesis holding to about −1.1 MPa (Boyer 1970). Rate: 6 molecules per second at full activity. */
  function actGrow(psi) { return clamp(1 + psi / 0.45, 0, 1); }
  function actPs(psi) { return psi > -0.9 ? 1 : clamp(1 - (-0.9 - psi) / 0.5, 0, 1); }
  function laneScene() {
    var M = window.MOL, D = M.draw, R = M.rng(13);
    var S = { p: { psi: -0.2 }, a: [], b: [], acc: [0, 0], g: null, cell: 0 };
    S.set = function (p) { for (var k in p) S.p[k] = p[k]; };
    S.settle = function () { S.a = []; S.b = []; };
    S.layout = function (w, h) { S.g = { w: w, h: h, narrow: w < 560, r: clamp(w / 149, 3.6, 5.7) }; };
    S.step = function (dt) {
      var g1 = actGrow(S.p.psi), g2 = actPs(S.p.psi);
      S.acc[0] += 6 * g1 * dt; S.acc[1] += 6 * g2 * dt;
      while (S.acc[0] >= 1) { S.acc[0] -= 1; S.a.push({ t: 0, y: R(), a: R() * 6.28 }); }
      while (S.acc[1] >= 1) { S.acc[1] -= 1; S.b.push({ t: 0, y: R(), a: R() * 6.28 }); }
      S.a.forEach(function (m) { m.t += dt * 0.45; m.a += dt; }); S.b.forEach(function (m) { m.t += dt * 0.45; m.a += dt; });
      S.a = S.a.filter(function (m) { return m.t < 1; }); S.b = S.b.filter(function (m) { return m.t < 1; });
      S.cell += (g1 - 0.02) * dt * 0.08; if (S.cell > 1) S.cell = 0; if (S.cell < 0) S.cell = 0;
    };
    S.draw = function (c, P, w, h, t, T) {
      var G = S.g; if (!G) return;
      c.fillStyle = P.dark ? '#0d1410' : '#f5f1df'; c.fillRect(0, 0, w, h);
      var fs = G.narrow ? 10 : 11.5, lh = (h - 40) / 2, g1 = actGrow(S.p.psi), g2 = actPs(S.p.psi);
      [0, 1].forEach(function (k) {
        var y0 = 30 + k * lh, y1 = y0 + lh - 8, tx = w * (G.narrow ? 0.62 : 0.66), act = k ? g2 : g1;
        c.fillStyle = P.dark ? 'rgba(255,255,255,.03)' : 'rgba(80,60,30,.04)'; c.fillRect(6, y0, w - 12, y1 - y0);
        if (k === 0) { // an expanding leaf cell: its length cycles while it grows
          var L = (w - tx - 24) * (0.55 + 0.35 * S.cell), cy = (y0 + y1) / 2, ch = (y1 - y0) * 0.56;
          c.fillStyle = P.dark ? '#6d5c36' : '#e2cf95'; D.rrect(c, tx, cy - ch / 2, L, ch, 12); c.fill();
          c.fillStyle = P.dark ? 'rgba(60,110,170,.7)' : 'rgba(200,220,244,.95)'; D.rrect(c, tx + 7, cy - ch / 2 + 7, L - 14, ch - 14, 8); c.fill();
          S.a.forEach(function (m) { var x = 14 + m.t * (tx + 10 - 14), y = y0 + 10 + m.y * (y1 - y0 - 20); D.water(c, P, x, y, G.r, m.a, m.t > 0.9 ? (1 - m.t) * 10 : 1); if (m.t > 0.08 && m.t < 0.85) nameIt(T, 'H₂O', m, x, y, G.r, 'H₂O'); });
          D.tag(c, P, 10, y0 + 12, 'leaf growth: ' + Math.round(g1 * 100) + ' % of the wet rate', { size: fs });
        } else { // a chloroplast taking CO2 in and sending sugars out
          var cx = tx + (w - tx) * 0.4, cy2 = (y0 + y1) / 2, rx = Math.min((w - tx) * 0.36, 70), ry = (y1 - y0) * 0.3;
          var cg = c.createLinearGradient(cx - rx, 0, cx + rx, 0); cg.addColorStop(0, P.dark ? '#3f6a2a' : '#4f7a2e'); cg.addColorStop(0.5, P.dark ? '#8cc46a' : '#8fbf5a'); cg.addColorStop(1, P.dark ? '#3f6a2a' : '#4f7a2e');
          c.fillStyle = cg; c.beginPath(); c.ellipse(cx, cy2, rx, ry, 0, 0, 6.283); c.fill();
          c.strokeStyle = 'rgba(20,50,10,.35)'; c.lineWidth = 1; for (var j = -2; j <= 2; j++) { c.beginPath(); c.moveTo(cx - rx * 0.6, cy2 + j * ry * 0.3); c.lineTo(cx + rx * 0.6, cy2 + j * ry * 0.3); c.stroke(); }
          S.b.forEach(function (m) { var x = 14 + m.t * (cx - 14), y = y0 + 10 + m.y * (y1 - y0 - 20); if (m.t < 0.92) { D.co2(c, P, x, y, G.r * 0.8, m.a); if (m.t > 0.08) nameIt(T, 'CO₂', m, x, y, G.r * 0.8, 'CO₂'); } else { D.sugar(c, P, cx + (m.t - 0.92) * 600, cy2, G.r * 1.3, m.a); nameIt(T, 'sugar', m, cx + (m.t - 0.92) * 600, cy2, G.r * 1.3, 'sugar', { all: true }); } });
          D.tag(c, P, 10, y0 + 12, 'photosynthesis: ' + Math.round(g2 * 100) + ' % of the wet rate', { size: fs });
        }
        if (act < 0.02) D.tag(c, P, w / 2, (y0 + y1) / 2 + 10, 'stopped', { size: fs + 1, align: 'center', ink: P.dark ? '#ffb48a' : '#9a3a12' });
      });
      D.tag(c, P, w - 8, 14, 'leaf Ψ ' + mn(S.p.psi) + ' MPa', { size: fs, align: 'right' });
    };
    return S;
  }

  /* ================================================================ custom scene: the towel on the line (Fig 5.2)
     set({ a: inches per month at the chosen station, b: at Fresno State, days, nameA, nameB, month })
     Drawing scale (DERIVED): one water molecule leaves the reference grass per 0.04 inch per day of ETo, i.e. molecules
     per second = 25 × inches per day. */
  function towelScene() {
    var M = window.MOL, D = M.draw, R = M.rng(29);
    var S = { p: { a: 4.5, b: 8.7, days: 31, nameA: 'Salinas North', nameB: 'Fresno State', month: 'July' }, m: [[], []], acc: [0, 0], g: null };
    S.set = function (p) { for (var k in p) S.p[k] = p[k]; };
    S.settle = function () { S.m = [[], []]; };
    S.layout = function (w, h) { S.g = { w: w, h: h, narrow: w < 560, r: clamp(w / 158, 3.4, 5.5) }; };
    S.step = function (dt) {
      var p = S.p, r = [p.a / p.days * 25, p.b / p.days * 25];
      [0, 1].forEach(function (k) { S.acc[k] += r[k] * dt; while (S.acc[k] >= 1) { S.acc[k] -= 1; S.m[k].push({ x: R(), t: 0, a: R() * 6.28, dx: (R() - 0.5) * 0.1 }); } S.m[k].forEach(function (q) { q.t += dt * 0.42; q.a += dt; }); S.m[k] = S.m[k].filter(function (q) { return q.t < 1; }); });
    };
    S.draw = function (c, P, w, h, t, T) {
      var G = S.g; if (!G) return;
      var sky = c.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, P.dark ? '#101b26' : '#e8eef3'); sky.addColorStop(1, P.dark ? '#0d140f' : '#f2f0e4');
      c.fillStyle = sky; c.fillRect(0, 0, w, h);
      var half = w / 2, gy = h - 40, fs = G.narrow ? 10 : 11.5, p = S.p;
      [0, 1].forEach(function (k) {
        var x0 = k * half + 8, x1 = (k + 1) * half - 8;
        c.fillStyle = P.dark ? '#24361d' : '#a9c77f'; c.fillRect(x0, gy, x1 - x0, 10);
        c.strokeStyle = P.dark ? '#5e8a44' : '#6f9a4a'; c.lineWidth = 1.4;
        for (var x = x0 + 3; x < x1; x += 5) { var hh = 8 + ((x * 7) % 9); c.beginPath(); c.moveTo(x, gy + 2); c.quadraticCurveTo(x + 2, gy - hh / 2, x + Math.sin(t + x) * 1.5, gy - hh); c.stroke(); }
        S.m[k].forEach(function (q) { var x = x0 + (q.x + q.dx * q.t) * (x1 - x0), y = gy - 14 - q.t * (gy - 50); D.water(c, P, x, y, G.r, q.a, q.t > 0.85 ? (1 - q.t) / 0.15 : 1); if (q.t > 0.1 && q.t < 0.8) nameIt(T, 'vap' + k, q, x, y, G.r, 'H₂O vapour', { q: 1 }); });
        var v = k ? p.b : p.a, nm = k ? p.nameB : p.nameA;
        D.tag(c, P, (x0 + x1) / 2, h - 14, nm + ': ' + v.toFixed(1) + ' in, ' + (v * 25.4 / p.days).toFixed(1) + ' mm per day', { size: fs - (G.narrow ? 1 : 0), align: 'center' });
      });
      c.strokeStyle = P.dark ? 'rgba(255,255,255,.15)' : 'rgba(0,0,0,.12)'; c.setLineDash([3, 5]); c.beginPath(); c.moveTo(half, 10); c.lineTo(half, h - 30); c.stroke(); c.setLineDash([]);
      D.tag(c, P, w / 2, 14, p.month + ': water leaving a well watered reference grass', { size: fs, align: 'center' });
    };
    return S;
  }

  /* ================================================================ mounts */
  function mountAnatomy() {
    var s = sec('anatomy'); if (!s || !window.MOL) return;
    var box = card({ id: 'u7-anat', kick: 'Fig 1.M · molecules', title: 'Follow water across a young root',
      tryText: 'A young root in cross section, with the water moving. Molecules come in from the soil along the cortex walls (orange halo) or through the cells (green halo). At the endodermis the Casparian strip seals the walls, so every molecule has to cross a membrane there. <b>Try this:</b> switch the strip off, then shut most aquaporins, and watch where the traffic jams.',
      predict: true,
      controls: '<div>' + chipRow('u7an-cs', [['on', 'Casparian strip sealed'], ['off', 'Imagine no strip']], 'on') + '</div>' +
        '<div>' + chipRow('u7an-aq', [['open', 'Aquaporins open'], ['shut', 'Most aquaporins shut']], 'open') + '</div>' +
        '<div>' + chipRow('u7an-soil', [['wet', 'Wet soil'], ['dry', 'Drying soil']], 'wet') + '</div>',
      badges: badge('ILLUSTRATIVE', 'i') + badge('SECONDARY'),
      scale: 'Tissue order from the outside in: epidermis (dermal system), cortex and endodermis (ground system), pericycle and xylem (vascular system). Inflow is drawn at 6 molecules per second in wet soil and 2.5 in drying soil, with a 15 % root shrink that opens an air gap; shutting most aquaporins slows each membrane crossing to a third. These rates are <span class="badge i">ILLUSTRATIVE</span>, chosen to show the route, not measured. The strip as a wall seal that forces a membrane crossing: Geldner 2013, <i>Annual Review of Plant Biology</i> 64: 531, doi <a href="https://doi.org/10.1146/annurev-arplant-050312-120050" target="_blank" rel="noopener">10.1146/annurev-arplant-050312-120050</a> <span class="badge">SECONDARY</span>. The same theatre runs on the journey Organ plate.' });
    var embed = s.querySelector('iframe.embed') || s.querySelector('.co'); if (!embed) return;
    embed.parentNode.insertBefore(box, embed);
    var T = mount(box.querySelector('[data-u7stage]'), window.MOL.scenes.root(), function (cw) { return cw < 560 ? 250 : 290; }, 'Animated root cross section: water molecules move from the soil through epidermis and cortex, cross membranes at the endodermis where the Casparian strip seals the walls, and enter a xylem vessel', 16);
    if (!T) return;
    var st = { cs: 'on', aq: 'open', soil: 'wet' }, now = box.querySelector('[data-u7now]');
    function upd() {
      var wet = st.soil === 'wet';
      T.set({ flux: wet ? 6 : 2.5, aqp: st.aq === 'open' ? 1 : 0.33, shrink: wet ? 0 : 0.15, soilWet: wet ? 1 : 0.35, casparian: st.cs === 'on', leak: 0, ions: true, mode: 'crop' });
      now.innerHTML = st.cs === 'on' ? (st.aq === 'open' ? 'The strip forces every molecule through an endodermal membrane, and open aquaporins let them through quickly.' : 'Strip sealed and aquaporins mostly shut: molecules queue at the endodermis. This is the step a root can regulate.') :
        'Without the strip, water and ions could slip past the endodermis in the walls. Ions are no longer checked at a membrane: that is the job the strip does.';
    }
    onChip(box, 'u7an-cs', function (v) { st.cs = v; upd(); }); onChip(box, 'u7an-aq', function (v) { st.aq = v; upd(); }); onChip(box, 'u7an-soil', function (v) { st.soil = v; upd(); });
    upd(); wirePause(box, [T]);
    predict(box.querySelector('[data-u7pred]'), 'anat-cs', 'Before you press anything: with the strip sealed, where does every water molecule have to cross a membrane on its way to the xylem?',
      [['epi', 'At the epidermis'], ['endo', 'At the endodermis'], ['xyl', 'At the xylem wall']], 'endo',
      '<p>The strip seals the walls of the endodermis, so the wall route ends there and the molecule must enter an endodermal cell. Molecules can cross membranes earlier too, but the endodermis is the one place none can avoid. Watch the counter: with the strip on, the wall travellers are tallied as "forced through a membrane".</p>');
  }

  function pvSVG(po, eps, psi) { // Höfler style diagram: Ψs, Ψp, Ψw against RWC, with the current point
    var W = 520, H = 210, x0 = 44, x1 = W - 14, y0 = 14, y1 = H - 34, Rmin = 0.7;
    var sx = function (R) { return x0 + (1 - R) / (1 - Rmin) * (x1 - x0); }, sy = function (v) { return y0 + (1.6 - v) / 4.4 * (y1 - y0); };
    var P = window.WP.P, ps = [], pp = [], pw = [];
    for (var R = 1; R >= Rmin - 1e-9; R -= 0.005) {
      var s = po / R, Rt = 1 + po / eps, p = R > Rt ? -po * (R - Rt) / (1 - Rt) : 0; // linear turgor: −πo at full turgor, 0 at the turgor loss point
      ps.push([sx(R), sy(s)]); pp.push([sx(R), sy(p)]); pw.push([sx(R), sy(s + p)]);
    }
    var c = P.cell(psi, po, eps);
    function pl(a, col, w, d) { return '<polyline fill="none" stroke="' + col + '" stroke-width="' + w + '"' + (d ? ' stroke-dasharray="' + d + '"' : '') + ' points="' + a.map(function (q) { return q[0].toFixed(1) + ',' + q[1].toFixed(1); }).join(' ') + '"/>'; }
    var g = '';
    [1.5, 1, 0.5, 0, -0.5, -1, -1.5, -2, -2.5].forEach(function (v) { g += '<line x1="' + x0 + '" x2="' + x1 + '" y1="' + sy(v).toFixed(1) + '" y2="' + sy(v).toFixed(1) + '" stroke="var(--line)" stroke-width="' + (v === 0 ? 1.5 : 1) + '"/><text x="' + (x0 - 6) + '" y="' + (sy(v) + 4).toFixed(1) + '" text-anchor="end" font-size="11" fill="var(--ink-2)">' + (v < 0 ? MINUS : '') + Math.abs(v) + '</text>'; });
    [1, 0.9, 0.8, 0.7].forEach(function (r) { g += '<text x="' + sx(r).toFixed(1) + '" y="' + (y1 + 16) + '" text-anchor="middle" font-size="11" fill="var(--ink-2)">' + r.toFixed(1) + '</text>'; });
    g += '<text x="' + ((x0 + x1) / 2) + '" y="' + (H - 4) + '" text-anchor="middle" font-size="11" fill="var(--ink-2)">relative water content of the cells (drier to the right)</text>';
    g += '<line x1="' + sx(c.Rtlp).toFixed(1) + '" x2="' + sx(c.Rtlp).toFixed(1) + '" y1="' + y0 + '" y2="' + y1 + '" stroke="var(--ink-3)" stroke-dasharray="3 4"/><text x="' + (sx(c.Rtlp) + 4).toFixed(1) + '" y="' + (y0 + 10) + '" font-size="11" fill="var(--ink-2)">turgor lost</text>';
    g += pl(ps, 'var(--psi-s)', 2.2) + pl(pp, 'var(--psi-p)', 2.6) + pl(pw, 'var(--psi-w)', 2.6, '6 3');
    var X = sx(Math.max(Rmin, c.R)).toFixed(1);
    g += '<circle cx="' + X + '" cy="' + sy(c.psip).toFixed(1) + '" r="5" fill="var(--psi-p)"/><circle cx="' + X + '" cy="' + sy(c.psis).toFixed(1) + '" r="5" fill="var(--psi-s)"/><circle cx="' + X + '" cy="' + sy(psi).toFixed(1) + '" r="5.5" fill="var(--surface)" stroke="var(--psi-w)" stroke-width="2.5"/>';
    g += '<text x="' + (x1 - 4) + '" y="' + (sy(1.4)) + '" text-anchor="end" font-size="12" fill="var(--psi-p)" font-weight="600">Ψp turgor</text><text x="' + (x1 - 4) + '" y="' + (sy(-2.3)) + '" text-anchor="end" font-size="12" fill="var(--psi-s)" font-weight="600">Ψs</text><text x="' + (x0 + 40) + '" y="' + (sy(0.3)) + '" font-size="12" fill="var(--psi-w)" font-weight="600">Ψw = Ψs + Ψp</text>';
    return '<svg class="u7pv" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Pressure volume diagram: turgor, osmotic and total water potential against relative water content, with the current cell marked at ' + mn(psi) + ' megapascals">' + g + '</svg>';
  }

  function mountTurgor() {
    var s = sec('turgor'); if (!s || !window.MOL || !window.WP || !window.WP.P) return;
    var box = card({ id: 'u7-turgor', kick: 'Fig 3.M · molecules', title: 'One cell, one squeeze',
      tryText: 'A leaf cell with its wall, its thin cytoplasm and a big vacuole full of potassium and sugars. Drag the leaf water potential down: water leaves through the aquaporins, the vacuole shrinks, and the push on the wall fades until the turgor loss point. Then give the cell the season’s extra solutes and do it again. <b>Try this:</b> stop at ' + MINUS + '1.30 MPa and switch between the two cells.',
      predict: true,
      controls: '<div class="ctl"><label for="u7tpsi">Leaf water potential <span class="val" data-u7o="psi"></span></label><input id="u7tpsi" type="range" min="-2.0" max="0" step="0.01" value="-0.40"><div class="ticks"><span>' + MINUS + '2.0</span><span>' + MINUS + '1.0</span><span>0 MPa</span></div></div>' +
        '<div>' + chipRow('u7t-cell', [['crop', 'Crop cell, π<sub>o</sub>&nbsp;' + MINUS + '0.95'], ['adj', 'After the season, π<sub>o</sub>&nbsp;' + MINUS + '1.22']], 'crop') + '</div>',
      extra: '<div class="tiles" data-u7tiles></div><div data-u7pv></div>',
      badges: badge('DERIVED') + badge('ILLUSTRATIVE', 'i'),
      scale: 'Turgor, Ψ<sub>s</sub> and relative water content come from the linear symplastic pressure volume equations used everywhere on this site (Bartlett, Scoffoni &amp; Sack 2012), with the crop mean π<sub>o</sub> ' + MINUS + '0.95 MPa and ε 5 MPa; the adjusted cell shifts the turgor loss point by the global mean of Bartlett et al. 2014, −0.44 MPa across 283 wild and crop species (abstract), from −1.17 to −1.61 MPa; at ε 5 MPa that is π<sub>o</sub> −1.22 MPa (Bartlett et al. 2012 Eq. 1) <span class="badge">DERIVED</span>. One drawn solute stands for 0.025 MPa of π<sub>o</sub>; the vacuole volume change is drawn three times larger than the computed change in relative water content so it can be seen; water crosses both ways all the time and the net direction follows the change <span class="badge i">ILLUSTRATIVE</span>. No pressure volume curve for lettuce has been published in a major journal that we could find, so the crop cell is a stand in. <a href="#/sources#bartlett2012">Sources</a>' });
    var embed = s.querySelector('iframe.embed') || s.querySelector('.co'); if (!embed) return;
    embed.parentNode.insertBefore(box, embed);
    var T = mount(box.querySelector('[data-u7stage]'), window.MOL.scenes.cell(), function (cw) { return cw < 560 ? 520 : 340; }, 'Animated leaf cell: water molecules cross the plasma membrane through aquaporins as the vacuole swells or shrinks; solutes in the vacuole; arrows show turgor pressing on the wall', 6);
    if (!T) return;
    var st = { psi: -0.40, po: -0.95 }, now = box.querySelector('[data-u7now]'), tiles = box.querySelector('[data-u7tiles]'), pv = box.querySelector('[data-u7pv]'), P = window.WP.P;
    function upd() {
      var c = P.cell(st.psi, st.po, 5);
      T.set({ psi: st.psi, pio: st.po, turgor: c.psip, rwc: c.R, tlp: c.ptlp, eps: 5 });
      box.querySelector('[data-u7o="psi"]').textContent = mn(st.psi) + ' MPa';
      tiles.innerHTML = [['Ψ<sub>s</sub>', mn(c.psis), 'var(--psi-s)'], ['Turgor Ψ<sub>p</sub>', sg(c.psip), 'var(--psi-p)'], ['Relative water content', (c.R * 100).toFixed(0) + ' %', ''], ['Turgor lost at', mn(c.ptlp), '']].map(function (q) {
        return '<div class="tile"><div class="k">' + q[0] + '</div><div class="v"' + (q[2] ? ' style="color:' + q[2] + '"' : '') + '>' + q[1] + (q[0].indexOf('content') > 0 ? '' : ' <small>MPa</small>') + '</div>' + badge('DERIVED') + '</div>'; }).join('');
      pv.innerHTML = pvSVG(st.po, 5, st.psi);
      now.innerHTML = c.psip > 0.005 ? 'At ' + mn(st.psi) + ' MPa this cell still presses on its wall with ' + c.psip.toFixed(2) + ' MPa. It loses its turgor at ' + mn(c.ptlp) + ' MPa.' :
        'Past ' + mn(c.ptlp) + ' MPa the protoplast no longer pushes: turgor is zero and the leaf droops. Only more solutes, or more water, bring it back.';
    }
    box.querySelector('#u7tpsi').addEventListener('input', function (e) { st.psi = +e.target.value; upd(); });
    onChip(box, 'u7t-cell', function (v) { st.po = v === 'adj' ? -1.22 : -0.95; upd(); });
    upd(); wirePause(box, [T]);
    predict(box.querySelector('[data-u7pred]'), 'turgor-130', 'At a leaf water potential of ' + MINUS + '1.30 MPa, which cell still pushes on its wall?',
      [['crop', 'Only the crop cell'], ['adj', 'Only the adjusted cell'], ['both', 'Both'], ['none', 'Neither']], 'adj',
      '<p>The crop cell lost its turgor at ' + MINUS + '1.17 MPa. The adjusted cell, with 0.27 MPa more solute at full turgor, still has about 0.22 MPa of turgor at ' + MINUS + '1.30 and holds out to about ' + MINUS + '1.61. Same water potential, same pressure chamber reading: the solutes made the difference. Set the slider to ' + MINUS + '1.30 and switch cells to see it.</p>');
  }

  function mountLockhart() {
    var fig = figOf('fig-growth-lockhart'); if (!fig || !window.MOL || !window.WP.P) return;
    var box = card({ id: 'u7-lockhart', kick: 'Fig 4.1 · molecules', title: 'Inside the growing wall',
      tryText: 'The same cell as Fig 4.1, zoomed in on its wall. Turgor (blue arrows) always presses outward, but the wall only yields when the push is above the threshold Y: then loosening proteins at the growing end let the cellulose hoops slide apart, new hoops are laid in (orange), and water flows in to fill the new volume. <b>Try this:</b> leave Y where Fig 4.1 has it and switch between night and midday.',
      predict: true,
      controls: '<div>' + chipRow('u7g-time', [['night', 'Night: predawn turgor'], ['mid', 'Midday turgor']], 'night') + '</div><p class="u7lab">Y and the leaf come from the Fig 4.1 controls above.</p>',
      badges: badge('DERIVED') + badge('ILLUSTRATIVE', 'i'),
      scale: 'Turgor is Fig 4.1’s own value: the pressure volume equations at the predawn (' + MINUS + '0.06 MPa) and midday (' + MINUS + '0.50 MPa) leaf water potentials <span class="badge">DERIVED</span>. Growth rate is Lockhart’s φ (Ψ<sub>p</sub> ' + MINUS + ' Y) with φ drawn as 1: the cell lengthens at 60 px per second per MPa above Y, one new hoop every 14 px, one water molecule enters per 2 px of new length, because the new volume is water <span class="badge i">ILLUSTRATIVE</span>. Wall loosening and new wall deposition: Cosgrove 2005, <i>Nature Reviews Molecular Cell Biology</i> 6: 850, doi <a href="https://doi.org/10.1038/nrm1746" target="_blank" rel="noopener">10.1038/nrm1746</a>. Lockhart 1965. Y and φ <span class="badge i">ILLUSTRATIVE</span>.' });
    insertAfter(fig.el, box);
    var S = growScene(), T = mount(box.querySelector('[data-u7stage]'), S, function (cw) { return cw < 560 ? 230 : 250; }, 'Animated growing cell wall: turgor arrows press on the wall; when turgor is above the yield threshold the wall loosens, new cellulose hoops are laid in and water molecules enter through aquaporins', 4);
    if (!T) return;
    var night = true, now = box.querySelector('[data-u7now]'), P = window.WP.P;
    function upd() {
      var st = fig.st, po = st.plant === 'adj' ? -1.22 : -0.95, tp = P.cell(night ? -0.06 : -0.50, po, 5).psip;
      T.set({ psip: tp, Y: st.Y, phi: 1, night: night });
      var ex = tp - st.Y;
      now.innerHTML = (night ? 'Night' : 'Midday') + ': turgor ' + tp.toFixed(2) + ' MPa against Y ' + st.Y.toFixed(2) + ' MPa. ' + (ex > 0 ? 'The excess, ' + ex.toFixed(2) + ' MPa, is what grows the cell.' : 'Short by ' + (-ex).toFixed(2) + ' MPa: the wall holds, nothing grows, and nothing looks wilted either.');
    }
    onChip(box, 'u7g-time', function (v) { night = v === 'night'; upd(); });
    after(fig, upd); upd(); wirePause(box, [T]);
    predict(box.querySelector('[data-u7pred]'), 'grow-mid', 'With the crop leaf and Y at 0.70 MPa, does the cell grow at midday?',
      [['yes', 'Yes, more slowly'], ['no', 'No: the wall stops yielding'], ['shrink', 'It shrinks']], 'no',
      '<p>Midday turgor in the crop leaf is about 0.54 MPa, below Y = 0.70, so the wall is pressed but does not yield. At night turgor is about 0.90 MPa and the excess grows the cell. The cell does not shrink: losing growth is not the same as losing volume. Switch the leaf to the adjusted one in Fig 4.1 and the midday turgor clears Y.</p>');
  }

  function mountLadder() {
    var fig = figOf('fig-growth-ladder'); if (!fig || !window.MOL) return;
    var box = card({ id: 'u7-ladder', kick: 'Fig 4.2 · molecules', title: 'Dry the leaf and watch what stops',
      tryText: 'Two jobs in one leaf. Top: a cell taking in water to expand. Bottom: a chloroplast taking in CO<sub>2</sub> and sending sugars out. Slide the leaf drier. <b>Try this:</b> find the water potential where growth has stopped but the chloroplast is still working at full speed.',
      predict: true,
      controls: '<div class="ctl"><label for="u7lpsi">Leaf water potential <span class="val" data-u7o="lpsi"></span></label><input id="u7lpsi" type="range" min="-1.6" max="0" step="0.02" value="-0.10"><div class="ticks"><span>' + MINUS + '1.6</span><span>' + MINUS + '0.8</span><span>0 MPa</span></div></div>',
      badges: badge('MEASURED', 'm') + badge('ILLUSTRATIVE', 'i'),
      scale: 'The two anchors are measured: leaf enlargement strongly inhibited by ' + MINUS + '0.4 MPa in corn, soybean and sunflower, and soybean photosynthesis holding to about ' + MINUS + '1.1 MPa (Boyer 1970, read from the abstract) <span class="badge m">MEASURED</span>. The shapes between them are <span class="badge i">ILLUSTRATIVE</span>: growth falls linearly to zero at ' + MINUS + '0.45 MPa; photosynthesis stays full to ' + MINUS + '0.9 MPa, is half at ' + MINUS + '1.15 and stops at ' + MINUS + '1.4 MPa. At full activity each lane carries 6 molecules per second. This is a leaf axis only; the grower’s soil trigger in Fig 4.2 sits on a different axis. <a href="#/sources#boyer1970">Sources</a>' });
    insertAfter(fig.el, box);
    var T = mount(box.querySelector('[data-u7stage]'), laneScene(), function (cw) { return cw < 560 ? 250 : 240; }, 'Two animated lanes: water entering an expanding leaf cell, and CO2 entering a chloroplast with sugars leaving, each slowing as the leaf dries', 4);
    if (!T) return;
    var now = box.querySelector('[data-u7now]');
    function upd(v) {
      T.set({ psi: v }); box.querySelector('[data-u7o="lpsi"]').textContent = mn(v) + ' MPa';
      var g = actGrow(v), p = actPs(v);
      now.innerHTML = g > 0.6 ? 'Both jobs are running: this is a well watered leaf.' : (g > 0.02 ? 'Growth is slowing hard while photosynthesis has not noticed yet.' : (p > 0.98 ? 'Growth has stopped; the chloroplast is still at full speed. The leaf looks fine.' : (p > 0.02 ? 'Now photosynthesis is falling too.' : 'Both have stopped.')));
    }
    box.querySelector('#u7lpsi').addEventListener('input', function (e) { upd(+e.target.value); });
    upd(-0.1); wirePause(box, [T]);
    predict(box.querySelector('[data-u7pred]'), 'ladder-first', 'Predict: as the leaf dries from 0 to ' + MINUS + '1.6 MPa, which job stops first?',
      [['g', 'Growth'], ['p', 'Photosynthesis'], ['same', 'Both at once']], 'g',
      '<p>Growth. It needs turgor above a threshold and loses it first: by ' + MINUS + '0.4 MPa leaf enlargement was already strongly inhibited, while soybean photosynthesis held to about ' + MINUS + '1.1 MPa. That gap is why growth is the most sensitive readout of water status a plant has.</p>');
  }

  function mountVPD() {
    var fig = figOf('fig-demand-vpd'); if (!fig || !window.MOL || !window.MOL.scenes.vapour) return;
    // Southern California chips inside the figure's own preset fieldset (ILLUSTRATIVE, same values as the journey Field plate)
    var SOCAL = { inland: [34, 32, 2.5, 'Inland valley (Riverside area)'], santaana: [33, 10, 8, 'Santa Ana wind day'] }, wind = 2;
    var fs = fig.el.querySelector('fieldset[data-in="preset"]');
    if (fs && !fs.querySelector('input[value="inland"]')) {
      var cust = fs.querySelector('input[value="custom"]'); var anchor = cust ? cust.parentNode : null;
      Object.keys(SOCAL).forEach(function (k) {
        var lab = el('<label class="chip"><input name="vp" type="radio" value="' + k + '"><span>' + SOCAL[k][3] + '</span></label>');
        if (anchor) fs.insertBefore(lab, anchor); else fs.appendChild(lab);
        lab.querySelector('input').addEventListener('change', function (e) { if (!e.target.checked) return; fig.st.T = SOCAL[k][0]; fig.st.RH = SOCAL[k][1]; fig.st.preset = k; wind = SOCAL[k][2]; fig.sync(); fig.draw(); });
      });
    }
    var box = card({ id: 'u7-vpd', kick: 'Fig 5.1 · molecules', title: 'The pull, molecule by molecule',
      tryText: 'Inside the leaf the air spaces are saturated at leaf temperature; outside, the air holds only what the humidity allows. That difference in crowding is the VPD, and it is what pulls molecules out through the stomata on the lower side of the leaf. This scene follows the temperature and humidity of Fig 5.1. <b>Try this:</b> press the Santa Ana chip, then Marine layer morning.',
      predict: true,
      badges: badge('PHYSICS', 'm') + badge('ILLUSTRATIVE', 'i'),
      scale: 'Crowding inside and outside the leaf: one drawn molecule per 0.09 kPa of vapour pressure, at saturation inside and at e<sub>a</sub> outside, so the gap you see is the VPD (FAO-56 Eq. 11) <span class="badge m">PHYSICS</span>. Escape rate: transpiration E = g<sub>s</sub> × VPD ÷ P with a fixed stomatal conductance of 0.25 mol m<sup>' + MINUS + '2</sup> s<sup>' + MINUS + '1</sup> and P = 101.3 kPa, drawn at 2.5 molecules per second per mmol m<sup>' + MINUS + '2</sup> s<sup>' + MINUS + '1</sup>; a real leaf would close its stomata as VPD climbs, so the high VPD escape rates here are an upper bound <span class="badge i">ILLUSTRATIVE</span>. The Southern California chips are teaching values, not station normals: inland valley (Riverside area) 34 °C and 32 %, Santa Ana wind day 33 °C and 10 % with strong wind, the same set used on the journey Field plate <span class="badge i">ILLUSTRATIVE</span>. Leaf temperature is taken equal to the air in this scene. <a href="#/sources#fao56">Sources</a>' });
    // place after the existing predict box that follows the figure, so the question still comes first
    var nx = fig.el.nextElementSibling; insertAfter(nx && nx.classList.contains('ptc') ? nx : fig.el, box);
    var T = mount(box.querySelector('[data-u7stage]'), window.MOL.scenes.vapour(), function (cw) { return cw < 560 ? 300 : 300; }, 'Animated leaf section with the stomata on the lower surface: water vapour crowded in the saturated air spaces escapes into drier air below at a rate set by the vapour pressure deficit', 8);
    if (!T) return;
    var now = box.querySelector('[data-u7now]');
    function upd() {
      var st = fig.st, e = es(st.T), vpd = Math.max(0, e - e * st.RH / 100), E = 0.25 * vpd / 101.3 * 1000;
      if (st.preset !== 'inland' && st.preset !== 'santaana') wind = st.preset === 'fog' ? 1.5 : 2;
      T.set({ T: st.T, RH: st.RH, E: E, wind: wind, open: 0.7 });
      now.innerHTML = 'VPD ' + vpd.toFixed(2) + ' kPa: with the stomata held at the same opening, about ' + E.toFixed(1) + ' mmol of water per square metre per second would leave. ' + (vpd < 0.3 ? 'Almost no pull: the air is nearly as crowded as the leaf.' : (vpd > 3 ? 'A hard pull. A real leaf would start closing its stomata.' : ''));
    }
    after(fig, upd); upd(); wirePause(box, [T]);
    predict(box.querySelector('[data-u7pred]'), 'vpd-warm', 'Hold the humidity at 50 % and warm the air from 20 to 35 °C. What happens to the escape rate?',
      [['same', 'Stays the same: humidity did not change'], ['double', 'More than doubles'], ['less', 'Falls: warm air holds more water']], 'double',
      '<p>It more than doubles. Saturation vapour pressure climbs from 2.34 to 5.62 kPa, so at 50 % the VPD goes from 1.2 to 2.8 kPa. Warm air does hold more water, but it can hold even more than it does, so the deficit grows.</p>');
  }

  var ETO = { 'Castroville': [1.4, 1.7, 3.0, 4.2, 4.6, 4.8, 4.0, 3.8, 3.0, 2.6, 1.6, 1.4], 'Salinas North': [1.2, 1.5, 2.9, 4.1, 4.6, 5.2, 4.5, 4.3, 3.2, 2.8, 1.5, 1.2], 'Gonzales': [1.3, 1.7, 3.4, 4.7, 5.4, 6.3, 6.3, 5.9, 4.4, 3.4, 1.9, 1.3], 'Soledad': [1.7, 2.0, 3.4, 4.4, 5.5, 5.4, 6.5, 6.2, 5.2, 3.7, 2.2, 1.5], 'Fresno State': [0.9, 1.6, 3.2, 5.2, 7.0, 8.0, 8.7, 7.6, 5.4, 3.6, 1.7, 0.9] };
  var MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'], DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  function mountETo() {
    var fig = figOf('fig-demand-eto'); if (!fig || !window.MOL) return;
    var box = card({ id: 'u7-eto', kick: 'Fig 5.2 · molecules', title: 'Two towels on the line',
      tryText: 'The same well watered grass in two places, losing water at the rate the CIMIS station averages say. The station on the left follows the chips in Fig 5.2. <b>Try this:</b> run the months from January to December and watch when Salinas North peaks.',
      predict: true,
      controls: '<div class="ctl"><label for="u7em">Month <span class="val" data-u7o="mon"></span></label><input id="u7em" type="range" min="0" max="11" step="1" value="6"><div class="ticks"><span>Jan</span><span>Jun</span><span>Dec</span></div></div>',
      badges: badge('MEASURED', 'm') + badge('DERIVED'),
      scale: 'Monthly ETo in inches: CIMIS station averages, California Code of Regulations Title 23, Model Water Efficient Landscape Ordinance, Appendix A, the same table as Fig 5.2 <span class="badge m">MEASURED</span>. Drawn at one molecule per second for every 0.04 inch per day (inches per month ÷ days in the month × 25) <span class="badge">DERIVED</span>. <a href="#/sources#mwelo">Sources</a>' });
    insertAfter(fig.el, box);
    var T = mount(box.querySelector('[data-u7stage]'), towelScene(), function (cw) { return cw < 560 ? 230 : 230; }, 'Two animated strips of grass losing water molecules to the air at the reference evapotranspiration rate of two California stations', 6);
    if (!T) return;
    var m = 6, now = box.querySelector('[data-u7now]');
    function upd() {
      var a = (ETO[fig.st.sites] || ETO['Salinas North'])[m], b = ETO['Fresno State'][m];
      T.set({ a: a, b: b, days: DAYS[m], nameA: fig.st.sites, nameB: 'Fresno State', month: MON[m] });
      box.querySelector('[data-u7o="mon"]').textContent = MON[m];
      now.innerHTML = MON[m] + ': Fresno State loses ' + (b / a).toFixed(1) + ' times as much water as ' + fig.st.sites + '.';
    }
    box.querySelector('#u7em').addEventListener('input', function (e) { m = +e.target.value; upd(); });
    after(fig, upd); upd(); wirePause(box, [T]);
    predict(box.querySelector('[data-u7pred]'), 'eto-peak', 'Which month has the highest ETo at Salinas North?',
      [['jun', 'June'], ['jul', 'July'], ['sep', 'September']], 'jun',
      '<p>June, 5.2 inches. In July and August the marine layer cuts the sunlight and the demand, so Salinas North drops to 4.5 and 4.3 while Fresno State keeps climbing to 8.7 in July.</p>');
  }

  // Denmead and Shaw break points (soil Ψ, MPa) by potential transpiration (mm per day), interpolated in log space
  var DSP = [[1.4, -1.2], [3.3, -0.2], [6.4, -0.03]];
  function dsThr(Tp) { var a = DSP[0], b = DSP[1]; if (Tp > DSP[1][0]) { a = DSP[1]; b = DSP[2]; } var f = clamp((Tp - a[0]) / (b[0] - a[0]), 0, 1); return -Math.pow(10, Math.log10(-a[1]) + f * (Math.log10(-b[1]) - Math.log10(-a[1]))); }
  function mountDS() {
    var fig = figOf('fig-demand-ds'); if (!fig || !window.MOL || !window.MOL.scenes.root) return;
    var box = card({ id: 'u7-ds', kick: 'Fig 5.3 · molecules', title: 'Can the soil keep up with the sky?',
      tryText: 'A root in drying soil. The sky asks for a certain flow; the soil can deliver it only while its own conductance holds up, and that falls steeply as the soil dries. Pick a kind of day, then dry the soil. <b>Try this:</b> on a clear, dry day, see how wet the soil still is when the root starts falling short.',
      predict: true,
      controls: '<div>' + chipRow('u7ds-day', [['1.4', 'Overcast, 1.4 mm/day'], ['3.3', 'Moderate, 3.3 mm/day'], ['6.4', 'Clear and dry, 6.4 mm/day']], '6.4') + '</div>' +
        '<div class="ctl"><label for="u7dsp">Soil water potential <span class="val" data-u7o="soil"></span></label><input id="u7dsp" type="range" min="0" max="100" step="1" value="10"><div class="ticks"><span>' + MINUS + '0.01 wet</span><span>' + MINUS + '0.1</span><span>' + MINUS + '1.5 MPa dry</span></div></div>',
      extra: '<div class="tiles" data-u7tiles></div>',
      badges: badge('MEASURED', 'm') + badge('ILLUSTRATIVE', 'i'),
      scale: 'The three break points are Denmead &amp; Shaw 1962 (<i>Agron J</i> 54: 385): 12 bar on overcast days (1.4 mm per day), 2 bar at 3.3 mm per day and 0.3 bar on clear, dry days (6.4 mm per day) <span class="badge m">MEASURED</span>; between them the break point is interpolated on a log scale <span class="badge">DERIVED</span>. Past the break point, actual transpiration is drawn falling over one decade of soil water potential to 15 % of the demand, and molecules enter the root at 1.2 per second per mm per day <span class="badge i">ILLUSTRATIVE</span>. The corn grew in 24 inch containers; Ritchie (1973) found field corn used at least 80 % of its extractable water first, so teach the mechanism, not the thresholds. <a href="#/sources#denmead1962">Sources</a>' });
    insertAfter(fig.el, box);
    var T = mount(box.querySelector('[data-u7stage]'), window.MOL.scenes.root(), function (cw) { return cw < 560 ? 250 : 280; }, 'Animated root in soil: water molecules enter at the rate the soil can supply, which falls as the soil dries, against the demand of the day', 12);
    if (!T) return;
    var Tp = 6.4, x = 10, now = box.querySelector('[data-u7now]'), tiles = box.querySelector('[data-u7tiles]');
    function psiOfX(v) { return -Math.pow(10, -2 + v / 100 * (Math.log10(1.5) + 2)); }
    function upd() {
      var psi = psiOfX(x), thr = dsThr(Tp), over = Math.log10(psi / thr), E = over <= 0 ? Tp : Tp * clamp(1 - over * 0.85, 0.15, 1);
      var wet = clamp(1 - (Math.log10(-psi) + 2) / 2.3, 0.1, 1);
      T.set({ flux: E * 1.2, aqp: 1, shrink: 0, soilWet: wet, casparian: true, leak: 0, ions: false, mode: 'crop' });
      box.querySelector('[data-u7o="soil"]').textContent = mn(psi, psi > -0.1 ? 3 : 2) + ' MPa';
      tiles.innerHTML = '<div class="tile"><div class="k">The sky asks for</div><div class="v">' + Tp.toFixed(1) + ' <small>mm/day</small></div>' + badge('MEASURED', 'm') + '</div>' +
        '<div class="tile"><div class="k">This day’s break point</div><div class="v">' + mn(thr, thr > -0.1 ? 3 : 2) + ' <small>MPa</small></div>' + badge(Tp === 3.3 || Tp === 1.4 || Tp === 6.4 ? 'MEASURED' : 'DERIVED', 'm') + '</div>' +
        '<div class="tile"><div class="k">The root delivers</div><div class="v">' + E.toFixed(1) + ' <small>mm/day</small></div>' + badge('ILLUSTRATIVE', 'i') + '</div>' +
        '<div class="tile"><div class="k">Keeping up?</div><div class="v">' + (over <= 0 ? 'yes' : 'no') + '</div>' + badge('MEASURED', 'm') + '</div>';
      now.innerHTML = over <= 0 ? 'The soil at ' + mn(psi, psi > -0.1 ? 3 : 2) + ' MPa is still wetter than this day’s break point, so the root keeps up with the sky.' :
        'The soil is drier than this day’s break point (' + mn(thr, thr > -0.1 ? 3 : 2) + ' MPa): the gradient around the root steepens, leaf water potential becomes more negative, stomata close, and transpiration drops below what the sky asks for.';
    }
    onChip(box, 'u7ds-day', function (v) { Tp = +v; upd(); });
    box.querySelector('#u7dsp').addEventListener('input', function (e) { x = +e.target.value; upd(); });
    upd(); wirePause(box, [T]);
    predict(box.querySelector('[data-u7pred]'), 'ds-01', 'The soil is at ' + MINUS + '0.1 MPa. On which kinds of day does the corn keep up with the sky?',
      [['all', 'All three'], ['two', 'Overcast and moderate, not clear'], ['one', 'Only overcast']], 'two',
      '<p>Overcast and moderate. Their break points are ' + MINUS + '1.2 and ' + MINUS + '0.2 MPa, both drier than ' + MINUS + '0.1. On a clear, dry day the corn fell behind at ' + MINUS + '0.03 MPa, so at ' + MINUS + '0.1 it is already short. Same soil, same crop: the sky decides.</p>');
  }

  function mountDay() {
    var fig = figOf('fig-demand-day'); if (!fig || !window.MOL || !window.WP.P) return;
    // a Southern California air chip: loads the figure's own "your own air" sliders (ILLUSTRATIVE)
    var SOC = { tmax: 34, tmin: 17, rhmax: 75, rhmin: 32 };
    var fs = fig.el.querySelector('fieldset[data-in="site"]');
    if (fs && !fs.querySelector('input[value="u7inland"]')) {
      var own = fs.querySelector('input[value="own"]'), anchor = own ? own.parentNode : null;
      var lab = el('<label class="chip"><input name="dsite" type="radio" value="u7inland"><span>Inland Southern California valley</span></label>');
      if (anchor) fs.insertBefore(lab, anchor); else fs.appendChild(lab);
      lab.querySelector('input').addEventListener('change', function (e) { if (!e.target.checked) return; var st = fig.st; st.site = 'own'; st.tmax = SOC.tmax; st.tmin = SOC.tmin; st.rhmax = SOC.rhmax; st.rhmin = SOC.rhmin; fig.sync(); fig.draw(); e.target.checked = true; });
      var note = el('<p class="prov" data-u7socal>Inland Southern California valley loads 34 / 17 °C and 75 / 32 % humidity into the sliders below: a teaching day for the Riverside area, not station normals <span class="badge i">ILLUSTRATIVE</span>.</p>');
      fs.parentNode.insertBefore(note, fs.nextSibling);
    }
    var box = card({ id: 'u7-day', kick: 'Fig 5.4 · molecules', title: 'Two cells, one day',
      tryText: 'One leaf cell from plant A and one from plant B, at the same leaf water potential and the hour of Fig 5.4. B carries the season’s extra solutes. Press Run day above, or drag the hour, and watch water leave both cells through the afternoon and come back in the evening. <b>Try this:</b> Fresno, soil at ' + MINUS + '0.5 MPa, 15:00.',
      predict: true,
      extra: '',
      badges: badge('MODEL OUTPUT · NOT DATA') + badge('ILLUSTRATIVE', 'i'),
      scale: 'Each cell shows Fig 5.4’s own model at the chosen hour: leaf water potential from the diel run, turgor and relative water content from the pressure volume equations with ε 5 MPa, π<sub>o</sub> ' + MINUS + '1.00 MPa for A and the season’s value for B <span class="badge">MODEL OUTPUT · NOT DATA</span>. Drawing scales as in Fig 3.M: one solute per 0.025 MPa of π<sub>o</sub>, vacuole change drawn three times larger <span class="badge i">ILLUSTRATIVE</span>.' });
    var stage = box.querySelector('[data-u7stage]');
    stage.innerHTML = '<div class="u7two"><div><p class="u7lab">Plant A · no adjustment</p><div data-u7a></div></div><div><p class="u7lab" data-u7bl>Plant B · adjusted</p><div data-u7b></div></div></div>';
    var nx = fig.el.nextElementSibling; while (nx && (nx.tagName === 'P' && nx.classList.contains('prose'))) nx = nx.nextElementSibling;
    insertAfter(nx && nx.classList.contains('ptc') ? nx : fig.el, box);
    var hgt = function (cw) { return cw < 560 ? 470 : 300; };
    var TA = mount(stage.querySelector('[data-u7a]'), window.MOL.scenes.cell(), hgt, 'Animated leaf cell of plant A, without osmotic adjustment, at the chosen hour', 4);
    var TB = mount(stage.querySelector('[data-u7b]'), window.MOL.scenes.cell(), hgt, 'Animated leaf cell of plant B, with osmotic adjustment, at the chosen hour', 4);
    if (!TA || !TB) return;
    var now = box.querySelector('[data-u7now]'), P = window.WP.P;
    function upd(f) {
      f = f || fig; var R = f._res; if (!R) return;
      var i = clamp(Math.round(f.st.hour / 0.25), 0, R.t.length - 1), poB = -1.0 - Math.min(0.40, 0.0045 * f.st.wk * 7);
      var psi = R.plants[0].psiLeaf[i], a = P.cell(psi, -1.0, 5), b = P.cell(psi, poB, 5);
      TA.set({ psi: psi, pio: -1.0, turgor: a.psip, rwc: a.R, tlp: a.ptlp, eps: 5 });
      TB.set({ psi: psi, pio: poB, turgor: b.psip, rwc: b.R, tlp: b.ptlp, eps: 5 });
      box.querySelector('[data-u7bl]').textContent = 'Plant B · adjusted, π' + 'o ' + mn(poB);
      var hh = Math.floor(f.st.hour), mm = Math.round((f.st.hour - hh) * 60);
      now.innerHTML = (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm + ', leaf ' + mn(psi) + ' MPa. ' + (a.psip <= 0.001 && b.psip > 0.001 ? 'A has lost its turgor; B, at the same water potential, still pushes with ' + b.psip.toFixed(2) + ' MPa.' : (a.psip <= 0.001 ? 'Both cells have lost turgor.' : 'Both cells still push on their walls: A ' + a.psip.toFixed(2) + ', B ' + b.psip.toFixed(2) + ' MPa.'));
    }
    after(fig, upd); upd(); wirePause(box, [TA, TB]);
    predict(box.querySelector('[data-u7pred]'), 'day-evening', 'After a hot afternoon, how fast does turgor come back in the evening?',
      [['instant', 'Instantly, as soon as the sun sets'], ['hours', 'Over hours'], ['never', 'Not until the next irrigation']], 'hours',
      '<p>Over hours. The plant has to refill its own tissues through the same resistances, so leaf water potential becomes less negative again, slowly, and the cells swell as water crosses back in. In the model this evening recovery is when most of the growth happens.</p>');
  }

  /* ================================================================ Test yourself inside each stop (v7 format) */
  var STOPQ = { anatomy: 'Read a section', turgor: 'Water potential and turgor', growth: 'Growth', demand: 'Demand: the sky pulls' };
  function quizPanel(route) {
    var s = sec(route), Q = window.WP_QUIZ; if (!s || !Q) return;
    var pager = s.querySelector('nav.pager'); if (!pager || s.querySelector('.u7q')) return;
    var id = 'u7q-' + route, PASS = 4, N = 5;
    var box = el('<section class="u7q" id="' + id + '" aria-labelledby="' + id + '-h"><div class="u7qhead"><p class="eyebrow">Test yourself · this stop</p><h2 id="' + id + '-h">Can you use it, or only say it?</h2>' +
      '<p class="dek" style="font-size:1rem">Five questions a round, three tiers, the same as the site’s <a href="#/quiz">Test yourself</a>. Clear a tier with 4 of 5 to open the next. Scores stay in this browser.</p></div>' +
      '<fieldset class="chips" data-scope><legend>Which questions?</legend><label class="chip"><input type="radio" name="' + id + '-sc" value="stop" checked><span>This stop</span></label><label class="chip"><input type="radio" name="' + id + '-sc" value="mid"><span>Stops 1 to 5</span</label></fieldset>' +
      '<ol class="tiers" data-tiers></ol><div class="qround" data-round hidden></div></section>');
    s.insertBefore(box, pager);
    var MID = { anatomy: 1, turgor: 1, growth: 1, demand: 1, embolism: 1 };
    function D() { var d = store().get('quizstop', null); if (!d || typeof d !== 'object') d = {}; d[route] = d[route] || { best: {}, cleared: {}, last: {}, scope: 'stop' }; return d; }
    function save(d) { store().set('quizstop', d); }
    function pool(t, scope) { return Q.items.filter(function (i) { return i.t === t && !i.module && (scope === 'stop' ? i.stop === route : MID[i.stop]); }); }
    function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
    function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    var SRC = {}; (window.WP_SOURCES || []).forEach(function (q) { SRC[q[0]] = q[1]; });
    function cite(k) { var t = (SRC[k] || k).replace(/<[^>]+>/g, ''), m = t.match(/^(.*?)\((\d{4})\)/), lab = k;
      if (m) { var names = m[1].split(/,\s*/).filter(function (x) { return x && !/^et al/.test(x); }), sur = function (x) { return x.trim().split(/\s+/)[0]; }; lab = (/et al/.test(m[1]) || names.length > 2) ? sur(names[0]) + ' et al. ' + m[2] : (names.length === 2 ? sur(names[0]) + ' & ' + sur(names[1]) + ' ' + m[2] : sur(names[0]) + ' ' + m[2]); }
      else { var y = t.match(/\b(1[89]\d\d|20\d\d)\b/), who = t.split(/[.,(:]/)[0].trim(); lab = who.length > 28 ? (/FAO/.test(t) ? 'FAO-56' : k) : who + (y ? ' ' + y[1] : ''); }
      return '<a class="cite" href="#/sources#' + k + '">' + esc(lab) + '</a>'; }
    function bdg(b) { return '<span class="badge ' + (b === 'MEASURED' || b === 'VERIFIED' ? 'm' : b === 'ILLUSTRATIVE' ? 'i' : '') + '">' + b + '</span>'; }
    var tiersEl = box.querySelector('[data-tiers]'), roundEl = box.querySelector('[data-round]'), scopeEl = box.querySelector('[data-scope]'), st = null;
    function isOpen(t, d) { return t === 1 || d.cleared[t - 1] || d.cleared['force' + t]; }
    function ladder() {
      var all = D(), d = all[route];
      [].slice.call(scopeEl.querySelectorAll('input')).forEach(function (r) { r.checked = r.value === d.scope; });
      tiersEl.innerHTML = Q.tiers.map(function (T) {
        var o = isOpen(T.n, d), b = d.best[T.n + ':' + d.scope], c = d.cleared[T.n], n = pool(T.n, d.scope).length;
        var status = c ? '<span class="qs ok">Cleared · best ' + b + ' of ' + N + '</span>' : (b != null ? '<span class="qs">Best so far ' + b + ' of ' + N + '</span>' : (o ? '<span class="qs">Open</span>' : '<span class="qs lock">Clear ' + Q.tiers[T.n - 2].name + ' with ' + PASS + ' of ' + N + ' to open</span>'));
        return '<li class="tier' + (o ? '' : ' locked') + (c ? ' done' : '') + '"><div class="tn">' + T.n + '</div><div class="tb"><h3>' + T.name + '</h3><p class="tv">' + T.verb + '</p><p>' + T.d + '</p>' + status +
          '<div class="row">' + (o ? '<button class="btn primary" type="button" data-start="' + T.n + '">' + (b != null ? 'Another ' + N : 'Start: ' + N + ' questions') + '</button>' : '<button class="btn quiet" type="button" data-force="' + T.n + '">Open it anyway</button>') + '<span class="qn">' + n + ' in the pool</span></div></div></li>';
      }).join('');
      [].slice.call(tiersEl.querySelectorAll('[data-start]')).forEach(function (b) { b.addEventListener('click', function () { start(+b.getAttribute('data-start')); }); });
      [].slice.call(tiersEl.querySelectorAll('[data-force]')).forEach(function (b) { b.addEventListener('click', function () { var all = D(); all[route].cleared['force' + b.getAttribute('data-force')] = 1; save(all); ladder(); }); });
    }
    [].slice.call(scopeEl.querySelectorAll('input')).forEach(function (r) { r.addEventListener('change', function () { var all = D(); all[route].scope = r.value; save(all); ladder(); }); });
    function start(t) {
      var all = D(), d = all[route], p = pool(t, d.scope), last = d.last[t] || [];
      var pick = shuffle(p.filter(function (i) { return last.indexOf(i.id) < 0; })).concat(shuffle(p.filter(function (i) { return last.indexOf(i.id) >= 0; }))).slice(0, Math.min(N, p.length));
      d.last[t] = pick.map(function (i) { return i.id; }); save(all);
      st = { t: t, items: pick.map(function (i) { return { it: i, order: shuffle(i.o.map(function (_, k) { return k; })), pick: null }; }), k: 0 };
      tiersEl.hidden = true; scopeEl.hidden = true; roundEl.hidden = false; show();
    }
    function show() {
      var R = st.items[st.k], it = R.it, T = Q.tiers[st.t - 1], nm = id + '-o';
      roundEl.innerHTML = '<p class="qhead"><span>' + T.name + ' · ' + (st.k + 1) + ' of ' + st.items.length + '</span><a href="#/' + it.stop + '">' + esc(STOPQ[it.stop] || it.stop) + '</a></p>' +
        '<div class="ptc qz"><h3 class="q" tabindex="-1">' + it.q + '</h3><fieldset class="chips stack"><legend class="sr">Your answer</legend>' +
        R.order.map(function (k) { return '<label class="chip"><input type="radio" name="' + nm + '" value="' + k + '"><span>' + it.o[k][0] + '</span></label>'; }).join('') +
        '</fieldset><div class="row"><button class="btn primary" type="button" data-q="check" disabled>Check</button></div><div class="ans" data-q="ans" hidden role="status"></div></div>' +
        '<div class="row qfoot"><button class="btn quiet" type="button" data-q="quit">Leave this round</button></div>';
      var radios = [].slice.call(roundEl.querySelectorAll('input[name="' + nm + '"]')), chk = roundEl.querySelector('[data-q=check]');
      radios.forEach(function (r) { r.addEventListener('change', function () { chk.disabled = false; }); });
      chk.addEventListener('click', function () { var v = radios.filter(function (r) { return r.checked; })[0]; if (v) reveal(+v.value, radios); });
      roundEl.querySelector('[data-q=quit]').addEventListener('click', home);
      var q = roundEl.querySelector('.q'); if (q) q.focus({ preventScroll: true });
    }
    function reveal(k, radios) {
      var R = st.items[st.k], it = R.it, ok = k === it.a; R.pick = k;
      radios.forEach(function (r) { r.disabled = true; var v = +r.value; if (v === it.a) r.parentNode.classList.add('right'); else if (v === k) r.parentNode.classList.add('wrong'); });
      var why = function (i) { return it.o[i][1].replace(/^Right\.\s*/, ''); };
      var h = '<h3>' + (ok ? 'Right.' : 'Not this one.') + '</h3><p><b>' + (ok ? 'Why' : 'Your answer') + ':</b> ' + (ok ? why(k) : it.o[k][0] + '. ' + why(k)) + '</p>';
      if (!ok) h += '<p><b>The answer:</b> ' + it.o[it.a][0] + '. ' + why(it.a) + '</p>';
      h += '<p class="prov">' + bdg(it.b) + ' ' + it.src.map(cite).join(' · ') + '</p><div class="row"><button class="btn primary" type="button" data-q="next">' + (st.k < st.items.length - 1 ? 'Next question' : 'See how you did') + '</button></div>';
      var a = roundEl.querySelector('[data-q=ans]'); a.innerHTML = h; a.hidden = false; roundEl.querySelector('[data-q=check]').hidden = true;
      roundEl.querySelector('[data-q=next]').addEventListener('click', function () { if (st.k < st.items.length - 1) { st.k++; show(); } else finish(); });
    }
    function finish() {
      var all = D(), d = all[route], score = st.items.filter(function (R) { return R.pick === R.it.a; }).length, t = st.t, key = t + ':' + d.scope;
      if (d.best[key] == null || score > d.best[key]) d.best[key] = score;
      var cleared = score >= PASS && st.items.length >= N; if (cleared) d.cleared[t] = 1; save(all);
      var nxt = Q.tiers[t];
      var h = '<div class="qend" role="status"><h3 tabindex="-1">' + score + ' of ' + st.items.length + '</h3><p>' + (cleared ? (nxt ? Q.tiers[t - 1].name + ' is cleared. ' + nxt.name + ' is open.' : 'All three tiers are cleared for this stop. Try the whole site in Test yourself.') :
        'Clearing this tier takes ' + PASS + ' of ' + N + '. Read the ones you missed, then try another five.') + '</p></div>' +
        '<ol class="review">' + st.items.map(function (R) { var ok = R.pick === R.it.a; return '<li class="' + (ok ? 'ok' : 'no') + '"><span class="mk">' + (ok ? 'Right' : 'Missed') + '</span> ' + R.it.q + (ok ? '' : '<span class="why">The answer: ' + R.it.o[R.it.a][0] + '.</span>') + '</li>'; }).join('') + '</ol>' +
        '<div class="row"><button class="btn primary" type="button" data-q="again">Another ' + N + ' from ' + Q.tiers[t - 1].name + '</button>' + (cleared && nxt ? '<button class="btn" type="button" data-q="up">Go to ' + nxt.name + '</button>' : '') + '<button class="btn quiet" type="button" data-q="home">All tiers</button></div>';
      roundEl.innerHTML = h; roundEl.querySelector('.qend h3').focus({ preventScroll: true });
      roundEl.querySelector('[data-q=again]').addEventListener('click', function () { start(t); });
      var up = roundEl.querySelector('[data-q=up]'); if (up) up.addEventListener('click', function () { start(t + 1); });
      roundEl.querySelector('[data-q=home]').addEventListener('click', home);
    }
    function home() { st = null; roundEl.hidden = true; roundEl.innerHTML = ''; tiersEl.hidden = false; scopeEl.hidden = false; ladder(); }
    ladder();
  }

  /* ================================================================ boot */
  INIT.push(function () {
    if (!document.getElementById('u7-css')) { var stl = document.createElement('style'); stl.id = 'u7-css'; stl.textContent = CSS; document.head.appendChild(stl); }
    var steps = [mountAnatomy, mountTurgor, mountLockhart, mountLadder, mountVPD, mountETo, mountDS, mountDay];
    steps.forEach(function (f) { try { f(); } catch (e) { console.error('stops14', f.name, e); } });
    ['anatomy', 'turgor', 'growth', 'demand'].forEach(function (r) { try { quizPanel(r); } catch (e) { console.error('stops14 quiz', r, e); } });
    var mo = new MutationObserver(function () { var d = isDark(); TH.forEach(function (T) { T.setTheme(d); }); });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { var d = isDark(); TH.forEach(function (T) { T.setTheme(d); }); }); } catch (e) {}
  });
})();

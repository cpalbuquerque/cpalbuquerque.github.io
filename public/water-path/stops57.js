/* The Water Path · stops 6 to 8 and the enrichment page in the molecular style (unifier round 7, part "stops 5 to 7 and
   enrichment", 12 Oct 2026). Same template as journey/mol.js and stops14.js: moving water molecules, gas molecules,
   walls and pit membranes, rounded tags, rates set by each figure's own numbers, a predict then check per theatre,
   Pause, a still frame under reduced motion, dark theme glow.
   - Needs journey/mol.js (window.MOL) and stops57_quiz.js. Loaded BEFORE app.js; runs from window.WP_INIT after WP.boot
     has built the v7 figures, so it reads each figure's own state (WP.FIGS) and wraps that instance's draw() to follow it.
     Nothing in app.js changes how a figure computes.
   - Embolism: Fig 6.1 (two organs, lanes of conduits), 6.2 (one leaf drying, Albuquerque et al. 2020 fits), 6.3 (the
     stem on the driest afternoon), 6.4 (flow ∝ D⁴), 6.5 (air seeding through one pore).
   - How a conduit fails: E.1 (air seeding at the figure's pore), E.2 (sieve against valve), E.3 (the largest of N pores).
     E.4 and E.5 are data plots and stay plots; E.6 and E.7 already animate the spread vessel by vessel.
   - Where does the water leave: L.1 (Buckley 2015 routes, MOL.scenes.routes), L.2 (the same leaf as Fig 6.2).
   - A season in one field: F.1 (soil store, conduits and vapour, day by day, with a Southern California inland chip),
     F.2 (one leaf cell through the chosen day). F.3 has the same Denmead and Shaw root theatre on the Demand stop (5.3).
   - Each of the four stops ends with its own Test yourself (Know it / Use it / Question it, 5 a round, unlock at 4 of 5),
     the same ladder as stops14.js, items from stops57_quiz.js; the items also join the site wide #/quiz. */
(function () {
  'use strict';
  var INIT = window.WP_INIT = window.WP_INIT || [];
  var MINUS = '−', TAU = Math.PI * 2;
  var TH = [];
  function clamp(x, a, b) { return x < a ? a : (x > b ? b : x); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function mn(v, d) { return (v < -0.0005 ? MINUS : '') + Math.abs(v).toFixed(d == null ? 2 : d); }
  function sg(v, d) { return (v < -0.0005 ? MINUS : (v > 0.0005 ? '+' : '')) + Math.abs(v).toFixed(d == null ? 2 : d); }
  function isDark() { var t = document.documentElement.getAttribute('data-theme'); if (t) return t === 'dark'; try { return matchMedia('(prefers-color-scheme: dark)').matches; } catch (e) { return false; } }
  function reduced() { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
  function el(html) { var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }
  function badge(b, cls) { return '<span class="badge' + (cls ? ' ' + cls : '') + '">' + b + '</span>'; }
  function store() { return (window.WP && window.WP.store) || { get: function (k, d) { return d; }, set: function () {} }; }
  function plc(psi, p50, s) { return 100 / (1 + Math.exp((s / 25) * (psi - p50))); }
  function cite(k, lab) { return '<a class="cite" href="#/sources#' + k + '">' + lab + '</a>'; }

  /* ---------------------------------------------------------------- CSS: the stops14 card look (.u7), injected only if stops14 did not */
  var CSS = [
    '.u7.molfig{border:1px solid var(--line-strong);border-radius:var(--r-2);background:var(--surface);padding:.9rem 1rem 1rem;margin:1.2rem 0 1.6rem}',
    '.u7 .u7head{display:flex;gap:.6rem;align-items:flex-start;justify-content:space-between;flex-wrap:wrap}',
    '.u7 .u7head h3{margin:.1rem 0 .2rem;font-size:var(--fs-h3);font-family:var(--font-display)}',
    '.u7 .u7kick{font-family:var(--font-mono);font-size:.75rem;letter-spacing:.05em;text-transform:uppercase;color:var(--ink-2)}',
    '.u7 .u7try{margin:.4rem 0 .7rem;font-size:.97rem;max-width:46rem}',
    '.u7 .u7stage{margin:.4rem 0;min-height:120px}',
    '.u7 .u7stage canvas{border:1px solid var(--line)}',
    '.u7 .u7ctl{display:flex;flex-wrap:wrap;gap:.5rem .9rem;align-items:center;margin:.6rem 0}',
    '.u7 .u7ctl .ctl{flex:1 1 16rem;min-width:0}',
    '.u7 .u7ctl input[type=range]{width:100%}',
    '.u7 .u7now{font-size:.97rem;margin:.5rem 0;min-height:1.5em}',
    '.u7 details.depth{margin-top:.6rem}',
    '.u7q{margin:2rem 0 1rem}',
    '.u7q .u7qhead h2{margin:.1rem 0 .3rem}',
    '.u7q .tiers{margin:.8rem 0}',
    '.u7q .qround[hidden]{display:none}',
    '.u7q .ptc.qz .q{font-family:var(--font-body);font-size:1.05rem;font-weight:600;line-height:1.45;margin:0 0 .6rem}',
    '.u7q .ptc.qz .q:focus{outline:none}'
  ].join('\n');

  /* ---------------------------------------------------------------- card, mount, pause, predict (the stops14 pattern) */
  function card(o) {
    var h = '<section class="u7 molfig" id="' + o.id + '" aria-label="' + o.title.replace(/"/g, '&quot;') + '">' +
      '<div class="u7head"><div><span class="u7kick">' + o.kick + '</span><h3>' + o.title + '</h3></div>' +
      '<div class="figtools">' + (o.tools || '') + '<button class="btn" type="button" data-u7="pause" aria-pressed="false">Pause</button></div></div>' +
      '<p class="u7try">' + o.tryText + '</p>' +
      (o.predict ? '<div data-u7pred></div>' : '') +
      (o.controls ? '<div class="u7ctl">' + o.controls + '</div>' : '') +
      '<div class="u7stage" data-u7stage></div>' +
      '<p class="u7now" data-u7now role="status" aria-live="polite"></p>' +
      '<details class="depth check"><summary><span class="dl">Check it</span><span class="ds">what the animation shows, at what scale, and the sources</span><span class="dbadges">' + (o.badges || '') + '</span></summary>' +
      '<div class="depth-body"><p class="prov">' + o.scale + '</p></div></details></section>';
    return el(h);
  }
  function mount(host, scene, height, label, prewarm) {
    var M = window.MOL; if (!M || !M.Theatre) return null;
    /* slow and named (13 Oct): theatres about 25 % taller at desktop, 18 % on phones (cap 600 px) */
    var hBig = function (cw) { var h0 = typeof height === 'function' ? height(cw) : (height || 300); return Math.min(600, Math.round(h0 * (cw < 560 ? 1.18 : 1.25))); };
    var T = M.Theatre(host, scene, { height: hBig, dark: isDark(), reduce: reduced(), label: label, prewarm: prewarm || 6 });
    TH.push(T); return T;
  }
  function wirePause(box, Ts) {
    var b = box.querySelector('[data-u7="pause"]'); if (!b) return;
    if (reduced()) { b.textContent = 'Still frame'; b.disabled = true; return; }
    if (window.PlaySpeed && !box.querySelector('[data-ps="chip"]')) b.parentNode.insertBefore(window.PlaySpeed.chip('ps-light'), b.nextSibling); // speed chip beside Pause
    b.addEventListener('click', function () { var p; Ts.forEach(function (T) { if (T) p = T.pause(); }); b.setAttribute('aria-pressed', p ? 'true' : 'false'); b.textContent = p ? 'Play' : 'Pause'; });
  }
  function predict(host, key, q, opts, answer, revealHTML) {
    if (!host) return;
    var name = 'u57p-' + key;
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
    chk.addEventListener('click', function () { var v = radios.filter(function (r) { return r.checked; })[0]; if (!v) return; lock(v.value); var s = store().get('u57ptc', {}) || {}; s[key] = v.value; store().set('u57ptc', s); ans.querySelector('h3').focus(); });
    again.addEventListener('click', function () { radios.forEach(function (r) { r.disabled = false; r.checked = false; }); ans.hidden = true; chk.hidden = false; chk.disabled = true; again.hidden = true; var s = store().get('u57ptc', {}) || {}; delete s[key]; store().set('u57ptc', s); });
    var prev = (store().get('u57ptc', {}) || {})[key]; if (prev) lock(prev);
  }
  function figOf(id) { var F = (window.WP && window.WP.FIGS) || []; for (var i = 0; i < F.length; i++) if (F[i].el && F[i].el.id === id) return F[i]; return null; }
  function after(fig, fn) { if (!fig) return; var orig = fig.draw; fig.draw = function () { var r = orig.apply(this, arguments); try { fn(this); } catch (e) { console.error(e); } return r; }; }
  /* slow and named (13 Oct): a stepping timer that follows the page speed; clearInterval() stops it. Model steps unchanged. */
  function spdInterval(fn, ms) { var acc = 0; return setInterval(function () { acc += (window.PlaySpeed ? window.PlaySpeed.get() : 1); if (acc < 0.999) return; acc -= 1; fn(); }, ms); }
  /* slow and named (13 Oct): offer a molecule to the theatre's namer (journey/mol.js MOL.Namer, ANTI CLUTTER RULE) */
  function nameIt(T, kind, key, x, y, r, text, o) { if (T && T.names && key) T.names.add(kind, key, x, y, r, text, o); }
  function warm(T, sec) { if (T && !T.reduce && T.prewarm) { T.prewarm(sec); T.redraw(); } }
  function insertAfter(ref, node) { ref.parentNode.insertBefore(node, ref.nextSibling); }
  function sec(r) { return document.querySelector('section.route[data-route="' + r + '"]'); }
  function chipRow(name, list, on) {
    return '<fieldset class="chips"><legend class="sr">' + name + '</legend>' + list.map(function (c) {
      return '<label class="chip"><input type="radio" name="' + name + '" value="' + c[0] + '"' + (c[0] === on ? ' checked' : '') + '><span>' + c[1] + '</span></label>'; }).join('') + '</fieldset>';
  }
  function onChip(box, name, fn) { [].slice.call(box.querySelectorAll('input[name="' + name + '"]')).forEach(function (r) { r.addEventListener('change', function () { if (r.checked) fn(r.value); }); }); }
  // a gas molecule: N2 (grey pair) or O2 (red pair)
  function gasMol(c, P, x, y, r, a, o2, al) {
    var D = window.MOL.draw, sh = window.MOL.shade, col = o2 ? P.O : (P.dark ? '#8fa3b8' : '#7d8ea0'), dx = Math.cos(a) * r * 0.75, dy = Math.sin(a) * r * 0.75;
    D.ball(c, x - dx, y - dy, r * 0.85, col, sh(col, 0.5), sh(col, -0.4), al); D.ball(c, x + dx, y + dy, r * 0.85, col, sh(col, 0.5), sh(col, -0.4), al);
  }
  function colWater(P) { return P.dark ? 'rgba(40,96,180,.55)' : 'rgba(118,166,228,.55)'; }
  function colGas(P) { return P.dark ? '#22272f' : '#d6d1c7'; }
  function colWall(P) { return P.dark ? '#6d5c36' : '#c9b073'; }
  function bg(c, P, w, h) { var g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, P.dark ? '#0d1218' : '#f4efe1'); g.addColorStop(1, P.dark ? '#0b1410' : '#ece9d6'); c.fillStyle = g; c.fillRect(0, 0, w, h); }
  // seeded shuffle
  function order(n, seed) { var R = window.MOL.rng(seed), a = []; for (var i = 0; i < n; i++) a.push(i); for (i = n - 1; i > 0; i--) { var j = Math.floor(R() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  /* ================================================================ scene: lanes of conduits (Fig 6.1, 6.3)
     set({ groups: [{ label, n, frac (0..1 loss of conductivity), seed }] })
     Each group is a bundle of n equal conduits seen lengthwise; round(frac × n) of them hold gas. Because the lanes are
     drawn equal, the share of lanes with gas equals PLC (Fig 6.4 shows why real, unequal conduits weigh differently).
     Water molecules move along working lanes at 60 px s−1, 1.4 a second per lane, so the flow you see falls with PLC.
     A lane that turns to gas does it the way air seeding does, from a pit at its middle, over about a second.
     Dragging back toward zero clears the drawing at once: a real conduit does not refill while the xylem is under tension. */
  function lanesScene() {
    var M = window.MOL, D = M.draw;
    var S = { p: { groups: [] }, G: [], g: null, inited: false, R: M.rng(5), back: false };
    S.set = function (p) {
      for (var k in p) S.p[k] = p[k];
      S.p.groups.forEach(function (gp, i) {
        var st = S.G[i]; if (!st || st.n !== gp.n) st = S.G[i] = { n: gp.n, ord: order(gp.n, gp.seed || (11 + i)), lanes: [] };
        while (st.lanes.length < gp.n) st.lanes.push({ emb: 0, prog: 0, mol: [], acc: S.R(), gas: [] });
        var k = Math.round(clamp(gp.frac, 0, 1) * gp.n), on = {};
        st.ord.slice(0, k).forEach(function (j) { on[j] = 1; });
        st.lanes.forEach(function (L, j) {
          if (on[j] && !L.emb) { L.emb = 1; L.prog = S.inited ? 0.02 : 1; }
          else if (!on[j] && L.emb) { L.emb = 0; L.prog = 0; S.back = true; }
        });
        st.k = k;
      });
      S.inited = true;
    };
    S.settle = function () { S.G.forEach(function (st) { st.lanes.forEach(function (L) { if (L.emb) L.prog = 1; }); }); };
    S.layout = function (w, h) {
      var nG = Math.max(1, S.p.groups.length), top = 30, gap = 34, gh = (h - top - 14 - gap * (nG - 1)) / nG;
      S.g = { w: w, h: h, narrow: w < 560, x0: 14, x1: w - 14, top: top, gh: gh, gap: gap, r: clamp(w / 167, 3.4, 5.2) };
    };
    S.step = function (dt) {
      var G = S.g; if (!G) return;
      var L0 = G.x1 - G.x0;
      S.G.forEach(function (st, gi) {
        var laneH = G.gh / st.n;
        st.lanes.forEach(function (L) {
          if (L.emb && L.prog < 1) L.prog = Math.min(1, L.prog + dt * 0.9);
          if (!L.gas.length) for (var q = 0; q < Math.max(3, Math.round(L0 / 70)); q++) L.gas.push({ u: S.R(), v: S.R(), a: S.R() * TAU, o2: q % 5 === 0, ph: S.R() * TAU });
          L.gas.forEach(function (m) { m.ph += dt * 2; m.a += dt * 2.2; });
          if (!(L.emb && L.prog >= 1)) { L.acc += dt * 1.4; while (L.acc >= 1) { L.acc -= 1; L.mol.push({ x: 0, a: S.R() * TAU, v: S.R() }); } }
          L.mol.forEach(function (m) { m.x += dt * 60; m.a += dt; });
          var gx0 = (L0 / 2) * (1 - L.prog), gx1 = L0 - gx0;
          L.mol = L.mol.filter(function (m) { return m.x < L0 && !(L.emb && m.x > gx0 && m.x < gx1); });
        });
        st.laneH = laneH;
      });
    };
    S.draw = function (c, P, w, h, t, T) {
      var G = S.g; if (!G) return;
      bg(c, P, w, h);
      var L0 = G.x1 - G.x0, fs = G.narrow ? 10 : 11.5;
      S.G.forEach(function (st, gi) {
        var gp = S.p.groups[gi]; if (!gp) return;
        var y0 = G.top + gi * (G.gh + G.gap), lh = G.gh / st.n, wt = Math.max(1.5, Math.min(4, lh * 0.18));
        st.lanes.forEach(function (L, j) {
          var ly = y0 + j * lh, cy = ly + lh / 2, gx0 = G.x0 + (L0 / 2) * (1 - (L.emb ? L.prog : 0)), gx1 = G.x1 - (gx0 - G.x0);
          c.fillStyle = colWater(P); c.fillRect(G.x0, ly + wt / 2, L0, lh - wt);
          if (L.emb) {
            c.fillStyle = colGas(P); c.fillRect(gx0, ly + wt / 2, gx1 - gx0, lh - wt);
            L.gas.forEach(function (m) { var x = G.x0 + m.u * L0, y = ly + wt + 2 + m.v * Math.max(1, lh - 2 * wt - 4); if (x > gx0 + 4 && x < gx1 - 4) gasMol(c, P, x + Math.sin(m.ph) * 2, y, Math.min(G.r * 0.8, lh * 0.22), m.a, m.o2); });
            if (L.prog < 1) { c.strokeStyle = P.dark ? '#cfe3ff' : '#2b5fa4'; c.lineWidth = 1.6; [gx0, gx1].forEach(function (x, s) { c.beginPath(); c.moveTo(x, ly + wt); c.quadraticCurveTo(x + (s ? 6 : -6), cy, x, ly + lh - wt); c.stroke(); }); }
          }
          var r = Math.min(G.r, (lh - 2 * wt) * 0.36);
          L.mol.forEach(function (m) { var my = ly + wt + r + m.v * Math.max(0, lh - 2 * wt - 2 * r); D.water(c, P, G.x0 + m.x, my, r, m.a); if (m.x > 20 && m.x < L0 - 60) nameIt(T, 'H₂O', m, G.x0 + m.x, my, r, 'H₂O'); });
          // wall between lanes, with a pit pair at the middle
          c.fillStyle = colWall(P); c.fillRect(G.x0, ly - wt / 2, L0, wt);
          c.fillStyle = P.dark ? '#d6c08a' : '#8a6a2a'; c.fillRect(G.x0 + L0 / 2 - 2, ly - wt / 2, 4, wt);
        });
        c.fillStyle = colWall(P); c.fillRect(G.x0, y0 + G.gh - wt / 2, L0, wt);
        var lost = Math.round(gp.frac * 100);
        D.tag(c, P, G.x0, y0 - 13, gp.label + (G.narrow ? ': ' : ' · ') + st.k + ' of ' + st.n + ' lanes hold air' + (G.narrow ? '' : ' · conductivity lost ' + lost + ' %'), { size: fs });
        if (G.narrow) D.tag(c, P, G.x1, y0 - 13, lost + ' % lost', { size: fs, align: 'right' });
      });
      if (!G.narrow) D.tag(c, P, G.x1, 14, 'water pulled toward the leaves →', { size: fs - 1, align: 'right', alpha: 0.92 });
    };
    return S;
  }

  /* ================================================================ scene: flow ∝ D⁴ (Fig 6.4)
     set({ D: [µm], emb: [indices] })
     Lanes drawn with height ∝ D. Hagen-Poiseuille: mean speed ∝ D² and flow ∝ D⁴, so molecules enter each lane at
     24 s−1 × D⁴ ÷ ΣD⁴ and move at 110 px s−1 × (D ÷ 110 µm)². Embolised lanes carry nothing. */
  function d4Scene() {
    var M = window.MOL, D = M.draw;
    var S = { p: { D: [], emb: [] }, lanes: [], g: null, R: M.rng(9) };
    S.set = function (p) { for (var k in p) S.p[k] = p[k]; while (S.lanes.length < S.p.D.length) S.lanes.push({ mol: [], acc: S.R(), gas: [] }); };
    S.settle = function () {};
    S.layout = function (w, h) { S.g = { w: w, h: h, narrow: w < 560, x0: 12, x1: w - 12, y0: 30, y1: h - 30 }; };
    S.step = function (dt) {
      var G = S.g, p = S.p; if (!G || !p.D.length) return;
      var t4 = p.D.reduce(function (a, d) { return a + Math.pow(d, 4); }, 0), L0 = G.x1 - G.x0;
      S.lanes.forEach(function (L, i) {
        var d = p.D[i], off = p.emb.indexOf(i) >= 0;
        if (!L.gas.length) for (var q = 0; q < 5; q++) L.gas.push({ u: S.R(), v: S.R(), a: S.R() * TAU, o2: q === 2, ph: S.R() * TAU });
        L.gas.forEach(function (m) { m.ph += dt * 2; m.a += dt * 2; });
        if (off) { L.mol = []; return; }
        L.acc += dt * 24 * Math.pow(d, 4) / t4; while (L.acc >= 1) { L.acc -= 1; L.mol.push({ x: 0, v: S.R(), a: S.R() * TAU }); }
        var sp = 110 * Math.pow(d / 110, 2);
        L.mol.forEach(function (m) { m.x += dt * sp; m.a += dt; });
        L.mol = L.mol.filter(function (m) { return m.x < L0; });
      });
    };
    S.draw = function (c, P, w, h, t, T) {
      var G = S.g, p = S.p; if (!G || !p.D.length) return;
      bg(c, P, w, h);
      var tot = p.D.reduce(function (a, d) { return a + d; }, 0), gap = 3, H = G.y1 - G.y0 - gap * (p.D.length - 1), sc = H / tot, y = G.y0, L0 = G.x1 - G.x0, fs = G.narrow ? 10 : 11.5;
      var t4 = 0, a4 = 0;
      p.D.forEach(function (d, i) {
        var lh = d * sc, off = p.emb.indexOf(i) >= 0, L = S.lanes[i];
        t4 += Math.pow(d, 4); if (!off) a4 += Math.pow(d, 4);
        c.fillStyle = off ? colGas(P) : colWater(P); c.fillRect(G.x0, y, L0, lh);
        c.fillStyle = colWall(P); c.fillRect(G.x0, y - gap, L0, gap);
        var r = Math.max(1.2, Math.min(4.4, lh * 0.38));
        if (off) L.gas.forEach(function (m) { gasMol(c, P, G.x0 + m.u * L0 + Math.sin(m.ph) * 2, y + lh / 2, Math.min(3.6, lh * 0.3), m.a, m.o2); });
        else L.mol.forEach(function (m) { var my = y + r + m.v * Math.max(0, lh - 2 * r); D.water(c, P, G.x0 + m.x, my, r, m.a); if (r >= 2.5 && m.x > 20 && m.x < L0 - 70) nameIt(T, 'H₂O', m, G.x0 + m.x, my, r, 'H₂O'); });
        if (lh > 13 && !G.narrow) D.tag(c, P, G.x1 - 4, y + lh / 2, d + ' µm', { size: 9.5, align: 'right', alpha: 0.85 });
        y += lh + gap;
      });
      var left = 100 * a4 / t4;
      D.tag(c, P, G.x0, 14, (G.narrow ? 'flow still moving: ' : 'water still flowing: ') + Math.round(left) + ' % · lanes with air: ' + p.emb.length + ' of ' + p.D.length, { size: fs });
      D.tag(c, P, G.x0, h - 13, G.narrow ? 'wide lanes: fast and crowded' : 'each lane’s height is its diameter; wide lanes run faster and carry far more', { size: fs - 1, alpha: 0.92 });
    };
    return S;
  }

  /* ================================================================ scene: one leaf drying (Fig 6.2 and Fig L.2)
     set({ kLeft, gLeft (% of maximum still there), turgor (bool), shrink (0..0.16), mid (embolised midrib conduits),
           psi (MPa), tlp (MPa), cv (name) })
     The leaf: cuticle and upper epidermis, palisade, spongy mesophyll with air spaces, a vein (xylem conduits inside a ring
     of bundle sheath cells), and the stomata on the LOWER epidermis. Liquid water leaves the working xylem conduits at
     8 molecules s−1 × K left ÷ 100 and crosses the bundle sheath to the mesophyll walls; there it becomes vapour, which
     crosses the air spaces to a stoma and leaves when the pore lets it (chance per try = g<sub>s</sub> left ÷ 100), else
     it waits in the air space. The two streams follow each conductance on its own; they are not a water balance. */
  function leafScene() {
    var M = window.MOL, D = M.draw, ROUTE = M.ROUTE;
    var S = { p: { kLeft: 100, gLeft: 100, turgor: true, shrink: 0, mid: 0, psi: 0, tlp: -1.37, cv: 'Cabernet Sauvignon' }, liq: [], vap: [], acc: 0, g: null, R: M.rng(31), out: 0 };
    var R = S.R;
    S.set = function (p) { for (var k in p) S.p[k] = p[k]; };
    S.settle = function () { S.liq = []; };
    S.layout = function (w, h) {
      var nar = w < 560, G = { w: w, h: h, narrow: nar, r: clamp(w / 167, 3.4, 5) };
      G.yCut = 0.06 * h; G.yEpU = 0.10 * h; G.yPal = 0.17 * h; G.ySp = 0.40 * h; G.yEpL = 0.76 * h; G.yAir = 0.83 * h;
      G.vx = w * (nar ? 0.2 : 0.2); G.vy = (G.ySp + G.yEpL) / 2 - 0.01 * h; G.bsR = Math.min(0.17 * h, 0.13 * w);
      G.st = nar ? [0.6, 0.86] : [0.5, 0.7, 0.88];
      // xylem conduits in the upper half of the vein
      G.cond = []; var nC = nar ? 15 : 20, rC = G.bsR * (nar ? 0.15 : 0.13);
      for (var i = 0; i < nC; i++) { var row = Math.floor(i / 5), col = i % 5; G.cond.push({ x: G.vx + (col - 2) * rC * 2.15 + (row % 2) * rC * 0.5, y: G.vy - G.bsR * 0.55 + row * rC * 2.05, r: rC * (0.75 + 0.3 * ((i * 7) % 5) / 4) }); }
      // spongy cells avoiding the vein and the stomata
      G.sp = []; var R2 = M.rng(77);
      for (var tries = 0; tries < 400 && G.sp.length < (nar ? 9 : 16); tries++) {
        var x = w * (0.04 + 0.92 * R2()), y = G.ySp + 12 + (G.yEpL - G.ySp - 24) * R2(), rr = Math.min(h * 0.06, w * 0.04) * (0.8 + 0.4 * R2());
        if (Math.hypot(x - G.vx, y - G.vy) < G.bsR + rr + 8) continue;
        if (G.sp.some(function (q) { return Math.hypot(q.x - x, q.y - y) < q.r + rr + 6; })) continue;
        G.sp.push({ x: x, y: y, r: rr });
      }
      S.g = G; S.ord = order(G.cond.length, 3);
    };
    function condOK(i) { // which conduits are embolised: the first `mid` in a fixed order (drawn number ILLUSTRATIVE scale, see caption)
      return S.ord.indexOf(i) >= Math.round(Math.min(S.p.mid, S.g.cond.length));
    }
    S.ord = order(20, 3); // replaced in layout by the drawn count
    S.step = function (dt) {
      var G = S.g, p = S.p; if (!G) return;
      S.acc += dt * 8 * clamp(p.kLeft, 0, 100) / 100;
      var ok = []; G.cond.forEach(function (q, i) { if (condOK(i)) ok.push(q); });
      while (S.acc >= 1 && ok.length) {
        S.acc -= 1; var q = ok[Math.floor(R() * ok.length)], ang = -Math.PI * 0.1 + (R() - 0.5) * Math.PI * 1.2, tgt = G.sp.length ? G.sp[Math.floor(R() * G.sp.length)] : { x: G.w * 0.6, y: G.vy, r: 10 };
        if (R() < 0.35) tgt = { x: G.vx + (R() - 0.5) * G.w * 0.5 + G.w * 0.25, y: G.yPal + (G.ySp - G.yPal) * 0.85, r: 4 };
        S.liq.push({ x0: q.x, y0: q.y, x1: G.vx + Math.cos(ang) * (G.bsR + 4), y1: G.vy + Math.sin(ang) * (G.bsR + 4) * 0.9, x2: tgt.x + (R() - 0.5) * tgt.r, y2: tgt.y - tgt.r * 0.8, t: 0, a: R() * TAU });
      }
      if (S.acc > 1) S.acc = 1;
      S.liq.forEach(function (m) { m.t += dt * 0.42; m.a += dt; });
      S.liq = S.liq.filter(function (m) {
        if (m.t < 1) return true;
        if (S.vap.length < 70) S.vap.push({ x: m.x2, y: m.y2 + 6, a: m.a, s: Math.floor(R() * G.st.length), wait: 0 });
        return false;
      });
      var op = clamp(p.gLeft, 0, 100) / 100;
      S.vap.forEach(function (v) {
        var sx = G.st[v.s] * G.w, sy = G.yEpL + 2, dx = sx - v.x, dy = sy - v.y, d = Math.hypot(dx, dy);
        if (v.leaving) { v.y += dt * 70; v.x += Math.sin(v.y * 0.05) * dt * 8; return; }
        if (d < 6) { if (R() < op) v.leaving = true; else { v.x = G.w * (0.36 + 0.6 * R()); v.y = G.ySp + 10 + (G.yEpL - G.ySp - 20) * R(); v.s = Math.floor(R() * G.st.length); v.wait++; } return; }
        var sp = 55; v.x += dx / d * sp * dt + Math.sin(v.a * 3) * dt * 12; v.y += dy / d * sp * dt; v.a += dt * 2;
      });
      S.vap = S.vap.filter(function (v) { return v.y < G.h + 8; });
    };
    S.draw = function (c, P, w, h, t, T) {
      var G = S.g, p = S.p; if (!G) return;
      var air = c.createLinearGradient(0, G.yAir, 0, h); air.addColorStop(0, P.dark ? '#13202c' : '#e7eef4'); air.addColorStop(1, P.dark ? '#0d151d' : '#f3f5f2');
      c.fillStyle = air; c.fillRect(0, 0, w, h);
      // cuticle and upper epidermis (no stomata on the upper side)
      c.fillStyle = P.cut; c.fillRect(0, G.yCut, w, G.yEpU - G.yCut);
      c.fillStyle = P.epi; c.fillRect(0, G.yEpU, w, G.yPal - G.yEpU);
      // mesophyll air space
      c.fillStyle = P.dark ? '#16261a' : '#eef3e0'; c.fillRect(0, G.yPal, w, G.yEpL - G.yPal);
      var shr = 1 - clamp(p.shrink, 0, 0.3), limp = !p.turgor, cellC = P.dark ? 'rgba(80,140,64,.75)' : 'rgba(140,186,100,.8)', cellE = P.dark ? 'rgba(150,220,120,.6)' : 'rgba(60,110,40,.55)';
      function cellPath(x, y, rw, rh, seed) { // limp cells get a wrinkled outline
        c.beginPath();
        for (var k = 0; k <= 28; k++) { var a = k / 28 * TAU, wob = limp ? 1 + 0.07 * Math.sin(a * 5 + seed) : 1; var px = x + Math.cos(a) * rw * wob, py = y + Math.sin(a) * rh * wob; if (k) c.lineTo(px, py); else c.moveTo(px, py); }
        c.closePath();
      }
      // palisade: columnar cells
      var nPal = G.narrow ? 9 : 16, pw = w / nPal, ph = (G.ySp - G.yPal) * 0.46;
      for (var i = 0; i < nPal; i++) { cellPath((i + 0.5) * pw, (G.yPal + G.ySp) / 2, pw * 0.4 * shr, ph * shr, i); c.fillStyle = cellC; c.fill(); c.strokeStyle = cellE; c.lineWidth = 1.2; c.stroke(); }
      G.sp.forEach(function (q, k) { cellPath(q.x, q.y, q.r * shr, q.r * 0.82 * shr, k + 3); c.fillStyle = cellC; c.fill(); c.strokeStyle = cellE; c.lineWidth = 1.2; c.stroke(); });
      // the vein: bundle sheath ring, xylem conduits, phloem below
      c.fillStyle = P.dark ? '#22302a' : '#e3e9cf'; c.beginPath(); c.arc(G.vx, G.vy, G.bsR, 0, TAU); c.fill();
      var nBS = G.narrow ? 12 : 16;
      for (i = 0; i < nBS; i++) { var a = i / nBS * TAU; D.ball(c, G.vx + Math.cos(a) * G.bsR, G.vy + Math.sin(a) * G.bsR, G.bsR * (G.narrow ? 0.24 : 0.2), P.dark ? '#5f9a58' : '#a9c98a', P.dark ? '#b8e6a0' : '#eef7e2', P.dark ? '#2a4a26' : '#5f8a4a', 0.95); }
      for (i = 0; i < 4; i++) { var aa = -Math.PI / 2 + (i - 1.5) * 0.55; D.aqp(c, P, G.vx + Math.cos(aa) * G.bsR * 0.98, G.vy + Math.sin(aa) * G.bsR * 0.98, G.narrow ? 3.4 : 4.2, aa + Math.PI / 2, 0.95, true); }
      G.cond.forEach(function (q, k) {
        var ok = condOK(k);
        c.fillStyle = ok ? colWater(P) : colGas(P); c.strokeStyle = colWall(P); c.lineWidth = 2.2; c.beginPath(); c.arc(q.x, q.y, q.r, 0, TAU); c.fill(); c.stroke();
        if (!ok) { gasMol(c, P, q.x, q.y, Math.max(1.6, q.r * 0.32), t * 2 + k, k % 4 === 0); c.strokeStyle = P.dark ? 'rgba(255,180,138,.85)' : 'rgba(154,58,18,.75)'; c.lineWidth = 1.4; c.beginPath(); c.arc(q.x, q.y, q.r + 2.2, 0, TAU); c.stroke(); }
      });
      for (i = 0; i < 6; i++) { var pa = Math.PI * (0.25 + 0.1 * i); D.ball(c, G.vx + Math.cos(pa) * G.bsR * 0.5, G.vy + Math.sin(pa) * G.bsR * 0.5, G.bsR * 0.09, P.dark ? '#7a5d9a' : '#c9b2e0', '#ffffff', P.dark ? '#3a2a50' : '#7a5d9a', 0.85); }
      // lower epidermis with the stomata
      c.fillStyle = P.epi; c.fillRect(0, G.yEpL, w, G.yAir - G.yEpL);
      var op = clamp(p.gLeft, 0, 100) / 100;
      G.st.forEach(function (f) {
        var x = f * w, gw = 1.5 + 8 * op;
        c.fillStyle = P.dark ? '#16261a' : '#eef3e0'; c.fillRect(x - gw, G.yEpL, 2 * gw, G.yAir - G.yEpL);
        [-1, 1].forEach(function (sd) { D.ball(c, x + sd * (gw + 6), (G.yEpL + G.yAir) / 2, (G.yAir - G.yEpL) * 0.5, P.guard, P.guardHi, M.shade(P.guard, -0.35)); });
      });
      // molecules: liquid (orange halo, walls and cells) then vapour (sky blue halo)
      S.liq.forEach(function (m) {
        var x, y; if (m.t < 0.35) { var u = m.t / 0.35; x = lerp(m.x0, m.x1, u); y = lerp(m.y0, m.y1, u); } else { var v = (m.t - 0.35) / 0.65; x = lerp(m.x1, m.x2, v); y = lerp(m.y1, m.y2, v) - Math.sin(v * Math.PI) * 10; }
        D.halo(c, x, y, G.r, ROUTE.apo, 0.45); D.water(c, P, x, y, G.r, m.a); if (m.t > 0.2 && m.t < 0.9) nameIt(T, 'H₂O', m, x, y, G.r, 'H₂O');
      });
      S.vap.forEach(function (v) { D.halo(c, v.x, v.y, G.r * 0.9, ROUTE.vap, v.leaving ? 0.25 : 0.55); D.water(c, P, v.x, v.y, G.r * 0.9, v.a, v.leaving ? clamp(1 - (v.y - G.yAir) / (h - G.yAir), 0.15, 1) : 0.9); if (!v.leaving || v.y < G.yAir + (h - G.yAir) * 0.5) nameIt(T, 'vap', v, v.x, v.y, G.r * 0.9, 'H₂O vapour', { q: 1 }); });
      // tags
      var fs = G.narrow ? 10 : 11.5, warm = P.dark ? '#ffb48a' : '#9a3a12';
      D.tag(c, P, 6, 12, (G.narrow ? 'K outside xylem: ' : 'conductance outside the xylem: ') + Math.round(p.kLeft) + ' % left', { size: fs });
      D.tag(c, P, w - 6, 12, 'Ψ ' + mn(p.psi) + ' MPa', { size: fs, align: 'right' });
      D.tag(c, P, w - 6, G.yPal + 12, p.turgor ? (G.narrow ? 'cells turgid' : 'cells still turgid') : (G.narrow ? 'turgor lost' : 'turgor lost: below ' + mn(p.tlp) + ' MPa'), { size: fs - 0.5, align: 'right', ink: p.turgor ? undefined : warm });
      var nm = Math.round(p.mid);
      D.tag(c, P, G.vx, Math.max(G.yPal + 12, G.vy - G.bsR - 14), nm > 0 ? nm + (G.narrow ? ' with air' : ' midrib conduits with air') : (G.narrow ? 'xylem full' : 'midrib xylem: still full'), { size: fs - 0.5, align: 'center', ink: nm > 0 ? warm : undefined });
      D.tag(c, P, w - 6, h - 12, (G.narrow ? 'g' : 'stomata on the lower side: g') + 's ' + Math.round(p.gLeft) + ' % left', { size: fs - 0.5, align: 'right' });
    };
    return S;
  }

  /* ================================================================ scene: one pit, sieve or valve (Fig E.2)
     set({ arch: 'ang' | 'con', dp (MPa) })
     Same thresholds as Fig E.2, both ILLUSTRATIVE teaching numbers: the conifer torus seats at 1 MPa; the angiosperm
     membrane's largest pore lets air through at 2.5 MPa. Gas molecules in the embolised conduit (left) strike the pit at
     a steady rate; the pit membrane bows with ΔP; once the threshold is passed the torus is drawn seated (conifer) or a
     bubble is pulled through and fills the neighbour over about two seconds (angiosperm). */
  function pitScene() {
    var M = window.MOL, D = M.draw;
    var S = { p: { arch: 'ang', dp: 0.4 }, gas: [], wat: [], seed: 0, g: null, R: M.rng(57), was: 'ang' };
    var R = S.R;
    S.set = function (p) { for (var k in p) S.p[k] = p[k]; if (S.p.arch !== S.was || S.p.dp < 2.5) { S.seed = 0; } S.was = S.p.arch; };
    S.settle = function () { if (S.p.arch === 'ang' && S.p.dp >= 2.5) S.seed = 1; };
    S.layout = function (w, h) {
      var G = { w: w, h: h, narrow: w < 560, r: clamp(w / 149, 3.6, 5.7) };
      G.y0 = 30; G.y1 = h - 40; G.mx = w / 2; G.my = (G.y0 + G.y1) / 2; G.wt = Math.min(70, w * 0.12); G.aX1 = G.mx - G.wt; G.bX0 = G.mx + G.wt;
      S.g = G;
      if (!S.gas.length) for (var i = 0; i < 16; i++) S.gas.push({ u: R(), v: R(), vu: (R() - 0.5) * 0.5, vv: (R() - 0.5) * 0.5, a: R() * TAU, o2: i % 5 === 0 });
      if (!S.wat.length) for (i = 0; i < 46; i++) S.wat.push({ u: R(), v: R(), a: R() * TAU, ph: R() * TAU });
    };
    S.step = function (dt) {
      var p = S.p;
      S.gas.forEach(function (m) { m.u += m.vu * dt; m.v += m.vv * dt; if (m.u < 0.03 || m.u > 0.97) m.vu *= -1; if (m.v < 0.03 || m.v > 0.97) m.vv *= -1; m.u = clamp(m.u, 0.03, 0.97); m.v = clamp(m.v, 0.03, 0.97); m.a += dt * 3; });
      S.wat.forEach(function (m) { m.ph += dt * 1.5; m.a += dt * 0.5; });
      if (p.arch === 'ang' && p.dp >= 2.5 && S.seed < 1) S.seed = Math.min(1, S.seed + dt * 0.5);
    };
    S.draw = function (c, P, w, h, t, T) {
      var G = S.g, p = S.p; if (!G) return;
      bg(c, P, w, h);
      var con = p.arch === 'con', fs = G.narrow ? 10 : 11.5, k = clamp(p.dp / (con ? 1 : 2.5), 0, 1), seated = con && p.dp >= 1;
      // lumens
      c.fillStyle = colGas(P); c.fillRect(8, G.y0, G.aX1 - 8, G.y1 - G.y0);
      c.fillStyle = colWater(P); c.fillRect(G.bX0, G.y0, w - 8 - G.bX0, G.y1 - G.y0);
      // wall and pit chamber
      c.fillStyle = colWall(P); c.fillRect(G.aX1, G.y0, G.bX0 - G.aX1, G.y1 - G.y0); c.fillRect(0, G.y0 - 8, w, 8); c.fillRect(0, G.y1, w, 8);
      var ch = (G.y1 - G.y0) * 0.36, ap = con ? ch * 0.22 : ch * 0.5;
      c.fillStyle = P.dark ? '#121820' : '#ece7da';
      c.beginPath(); c.moveTo(G.aX1, G.my - ap); c.lineTo(G.mx - 4, G.my - ch); c.lineTo(G.mx + 4, G.my - ch); c.lineTo(G.bX0, G.my - ap); c.lineTo(G.bX0, G.my + ap); c.lineTo(G.mx + 4, G.my + ch); c.lineTo(G.mx - 4, G.my + ch); c.lineTo(G.aX1, G.my + ap); c.closePath(); c.fill();
      c.save(); c.clip(); c.fillStyle = colGas(P); c.fillRect(G.aX1, G.y0, G.mx - G.aX1, G.y1 - G.y0); c.fillStyle = colWater(P); c.fillRect(G.mx, G.y0, G.bX0 - G.mx, G.y1 - G.y0); c.restore();
      var fib = P.dark ? '#d6c08a' : '#7a5f2a';
      if (!con) {
        // homogeneous membrane: a mesh that bows toward the water side with ΔP
        var dx = Math.min(G.wt * 0.4, 7 * p.dp); c.strokeStyle = fib; c.lineWidth = 1.4;
        for (var i = 0; i < 3; i++) { c.beginPath(); for (var s = -1; s <= 1.0001; s += 0.1) { var yy = G.my + s * ch, xx = G.mx - 3 + i * 3 + dx * (1 - s * s); if (s === -1) c.moveTo(xx, yy); else c.lineTo(xx, yy); } c.stroke(); }
        for (i = 0; i < 12; i++) { var yq = G.my - ch + 6 + i * (2 * ch - 12) / 11, xq = G.mx + dx * (1 - Math.pow((yq - G.my) / ch, 2)); c.beginPath(); c.moveTo(xq - 5, yq); c.lineTo(xq + 5, yq + 3); c.stroke(); }
        // the meniscus in the largest pore, then the bubble
        if (S.seed <= 0) { var sag = 8 * k; c.strokeStyle = P.dark ? '#cfe3ff' : '#2b5fa4'; c.lineWidth = 2; c.beginPath(); c.moveTo(G.mx + dx - 1, G.my - 7); c.quadraticCurveTo(G.mx + dx + sag * 2, G.my, G.mx + dx - 1, G.my + 7); c.stroke(); }
        else { var br = lerp(6, Math.max(w - G.bX0, G.y1 - G.y0) * 1.1, Math.pow(S.seed, 1.5)), bx = lerp(G.mx + dx, (G.bX0 + w) / 2, S.seed);
          c.save(); c.beginPath(); c.rect(G.mx, G.y0, w - G.mx, G.y1 - G.y0); c.clip(); c.fillStyle = colGas(P); c.beginPath(); c.arc(bx, G.my, br, 0, TAU); c.fill(); c.strokeStyle = P.dark ? '#cfe3ff' : '#2b5fa4'; c.lineWidth = 2; c.stroke(); c.restore(); }
      } else {
        // torus margo: strands from the pit border to a solid disc that slides toward the aperture with ΔP
        var tx = G.mx + (G.wt - 12) * k, rx = 7, ry = ch * 0.42;
        c.strokeStyle = fib; c.lineWidth = 1.1;
        for (i = 0; i < 9; i++) { var yb = G.my - ch + 4 + i * (2 * ch - 8) / 8; c.beginPath(); c.moveTo(G.mx, yb); c.quadraticCurveTo((G.mx + tx) / 2, (yb + G.my) / 2, tx, G.my + (yb - G.my) * 0.35); c.stroke(); }
        var tg = c.createLinearGradient(tx - rx, 0, tx + rx, 0); tg.addColorStop(0, P.dark ? '#8a7440' : '#b8964a'); tg.addColorStop(0.5, P.dark ? '#e6cf8a' : '#f2dc9a'); tg.addColorStop(1, P.dark ? '#5d4718' : '#8a6a2a');
        c.fillStyle = tg; c.beginPath(); c.ellipse(tx, G.my, rx, ry, 0, 0, TAU); c.fill();
        if (seated) { c.strokeStyle = P.dark ? 'rgba(255,216,74,.9)' : 'rgba(181,137,0,.9)'; c.lineWidth = 2.4; c.beginPath(); c.ellipse(tx, G.my, rx + 3, ry + 3, 0, 0, TAU); c.stroke(); }
      }
      // gas molecules in the embolised conduit, some knocking on the pit
      S.gas.forEach(function (m, j) {
        var x = 16 + m.u * (G.aX1 - 26), y = G.y0 + 10 + m.v * (G.y1 - G.y0 - 20);
        if (j < 3) { var ph = (t * 0.6 + j / 3) % 1; x = lerp(G.aX1 - 30, G.mx - 8, Math.sin(ph * Math.PI)); y = G.my + (j - 1) * 10; }
        gasMol(c, P, x, y, G.r * 0.85, m.a, m.o2); if (j >= 3) nameIt(T, m.o2 ? 'O₂' : 'N₂', m, x, y, G.r * 0.85, m.o2 ? 'O₂' : 'N₂', { q: 1 });
      });
      // water in the neighbour (cleared where the bubble has come in)
      var cut = !con && S.seed > 0 ? S.seed : 0;
      S.wat.forEach(function (m) { if (m.u < cut * 1.05) return; var x = G.bX0 + 8 + m.u * (w - G.bX0 - 24), y = G.y0 + 10 + m.v * (G.y1 - G.y0 - 20); D.water(c, P, x + Math.sin(m.ph) * 1.6, y + Math.cos(m.ph * 1.2) * 1.6, G.r, m.a); nameIt(T, 'H₂O', m, x, y + 2, G.r, 'H₂O', { q: 1 }); });
      if (cut >= 1) S.gas.slice(0, 8).forEach(function (m) { gasMol(c, P, G.bX0 + 10 + m.v * (w - G.bX0 - 26), G.y0 + 12 + m.u * (G.y1 - G.y0 - 24), G.r * 0.85, m.a + 1, m.o2); });
      // tags
      D.tag(c, P, 10, 14, G.narrow ? 'gas filled' : 'gas filled conduit', { size: fs });
      D.tag(c, P, w - 10, 14, cut >= 1 ? 'neighbour now gas filled' : (G.narrow ? 'water filled' : 'water filled neighbour'), { size: fs, align: 'right', ink: cut >= 1 ? (P.dark ? '#ffb48a' : '#9a3a12') : undefined });
      var msg = con ? (seated ? 'torus seated: pit sealed, the neighbour keeps its water' : 'torus moving toward the aperture: ' + Math.round(k * 100) + ' % of the way') :
        (S.seed > 0 ? 'past the largest pore: air pulled through, no valve' : 'membrane stretching: meniscus at ' + Math.round(k * 100) + ' % of its limit');
      D.tag(c, P, w / 2, h - 16, 'ΔP ' + p.dp.toFixed(2) + ' MPa · ' + (G.narrow ? msg.split(':')[0] : msg), { size: fs - 0.5, align: 'center' });
    };
    return S;
  }

  /* ================================================================ scene: the largest of N pores (Fig E.3)
     set({ area (mm²), tension (MPa) })
     The same mechanism and constants as Fig E.3 (ILLUSTRATIVE): pore diameters lognormal, median 0.040 µm, log sd 0.45,
     200 pores per mm². The decisive pore is the median largest of N draws, D<sub>max</sub> = 0.040 exp(0.45 z) with
     z = Φ⁻¹(0.5^(1/N)), the same expression the figure uses; it fails at ΔP = 0.2912 ÷ D<sub>max</sub>. Up to 220 pores are
     drawn; the rest are counted, not drawn. */
  function qnorm(p) { // Acklam's inverse normal
    var a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239],
      b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572],
      cc = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783],
      d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416], q, r;
    p = clamp(p, 1e-12, 1 - 1e-12);
    if (p < 0.02425) { q = Math.sqrt(-2 * Math.log(p)); return (((((cc[0] * q + cc[1]) * q + cc[2]) * q + cc[3]) * q + cc[4]) * q + cc[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    if (p > 1 - 0.02425) { q = Math.sqrt(-2 * Math.log(1 - p)); return -(((((cc[0] * q + cc[1]) * q + cc[2]) * q + cc[3]) * q + cc[4]) * q + cc[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    q = p - 0.5; r = q * q; return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  }
  var RP = { med: 0.040, sig: 0.45, dens: 200, fourT: 0.2912 };
  function dmaxOf(area) { var N = Math.max(2, Math.round(RP.dens * area)); return { N: N, D: RP.med * Math.exp(RP.sig * qnorm(Math.pow(0.5, 1 / N))) }; }
  function rareScene() {
    var M = window.MOL, D = M.draw;
    var S = { p: { area: 2, tension: 1.6 }, pores: [], g: null, R: M.rng(101), gas: [], wat: [], seed: 0, key: '' };
    var R = S.R;
    S.set = function (p) { for (var k in p) S.p[k] = p[k]; };
    S.settle = function () { S.seed = fails() ? 1 : 0; };
    function fails() { var d = dmaxOf(S.p.area); return S.p.tension >= RP.fourT / d.D; }
    function build() {
      var G = S.g, d = dmaxOf(S.p.area), n = Math.min(220, d.N), R2 = M.rng(202), key = n + '|' + Math.round(G.w) + '|' + Math.round(G.h);
      if (key === S.key) return; S.key = key; S.pores = [];
      for (var i = 0; i < n * 6 && S.pores.length < n; i++) {
        var u1 = Math.max(1e-9, R2()), u2 = R2(), z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(TAU * u2), Dd = Math.min(RP.med * Math.exp(RP.sig * z), d.D * 0.97);
        var x = G.mx0 + 6 + R2() * (G.mx1 - G.mx0 - 12), y = G.my0 + 6 + R2() * (G.my1 - G.my0 - 12);
        if (Math.hypot(x - G.bigX, y - G.bigY) < 16) continue;
        S.pores.push({ x: x, y: y, D: Dd });
      }
    }
    S.layout = function (w, h) {
      var G = { w: w, h: h, narrow: w < 560, r: clamp(w / 158, 3.4, 5.2) };
      G.gas0 = 26; G.gas1 = h * 0.26; G.my0 = h * 0.30; G.my1 = h * 0.66; G.mx0 = 14; G.mx1 = w - 14; G.w0 = h * 0.70; G.w1 = h - 30;
      G.bigX = w * 0.62; G.bigY = (G.my0 + G.my1) / 2; S.g = G; S.key = '';
      if (!S.gas.length) for (var i = 0; i < 16; i++) S.gas.push({ u: R(), v: R(), vu: (R() - 0.5) * 0.5, vv: (R() - 0.5) * 0.4, a: R() * TAU, o2: i % 5 === 0 });
      if (!S.wat.length) for (i = 0; i < 40; i++) S.wat.push({ u: R(), v: R(), a: R() * TAU, ph: R() * TAU });
    };
    S.step = function (dt) {
      S.gas.forEach(function (m) { m.u += m.vu * dt; m.v += m.vv * dt; if (m.u < 0.02 || m.u > 0.98) m.vu *= -1; if (m.v < 0.05 || m.v > 0.95) m.vv *= -1; m.u = clamp(m.u, 0.02, 0.98); m.v = clamp(m.v, 0.05, 0.95); m.a += dt * 3; });
      S.wat.forEach(function (m) { m.ph += dt * 1.4; m.a += dt * 0.5; });
      if (fails()) S.seed = Math.min(1, S.seed + dt * 0.45); else S.seed = 0;
    };
    S.draw = function (c, P, w, h, t, T) {
      var G = S.g, p = S.p; if (!G) return; build();
      bg(c, P, w, h);
      var d = dmaxOf(p.area), thr = RP.fourT / d.D, fs = G.narrow ? 10 : 11.5, sc = 90; // px per µm of pore diameter (drawing scale)
      c.fillStyle = colGas(P); c.fillRect(8, G.gas0, w - 16, G.gas1 - G.gas0);
      c.fillStyle = colWater(P); c.fillRect(8, G.w0, w - 16, G.w1 - G.w0);
      // the membrane, face on: a mat of fibrils with holes
      var mg = c.createLinearGradient(0, G.my0, 0, G.my1); mg.addColorStop(0, P.dark ? '#4a3e24' : '#e9dcae'); mg.addColorStop(1, P.dark ? '#3a301c' : '#dccb92');
      c.fillStyle = mg; D.rrect(c, G.mx0, G.my0, G.mx1 - G.mx0, G.my1 - G.my0, 14); c.fill();
      c.strokeStyle = P.dark ? 'rgba(230,207,138,.18)' : 'rgba(122,95,42,.2)'; c.lineWidth = 1;
      for (var i = 0; i < 26; i++) { var yy = G.my0 + 4 + i * (G.my1 - G.my0 - 8) / 25; c.beginPath(); c.moveTo(G.mx0 + 4, yy); c.bezierCurveTo(w * 0.3, yy + Math.sin(i) * 5, w * 0.7, yy - Math.cos(i * 1.3) * 5, G.mx1 - 4, yy); c.stroke(); }
      c.fillStyle = P.dark ? '#0c1218' : '#5c4a28';
      S.pores.forEach(function (q) { var r = Math.max(0.7, q.D * sc / 2); c.beginPath(); c.arc(q.x, q.y, r, 0, TAU); c.fill(); });
      // the largest pore, glowing
      var rb = d.D * sc / 2, glow = c.createRadialGradient(G.bigX, G.bigY, rb, G.bigX, G.bigY, rb * 4.2); glow.addColorStop(0, P.dark ? 'rgba(255,216,74,.5)' : 'rgba(242,190,30,.45)'); glow.addColorStop(1, 'rgba(242,190,30,0)');
      c.fillStyle = glow; c.beginPath(); c.arc(G.bigX, G.bigY, rb * 4.2, 0, TAU); c.fill();
      c.fillStyle = P.dark ? '#0c1218' : '#3a2e18'; c.beginPath(); c.arc(G.bigX, G.bigY, rb, 0, TAU); c.fill();
      c.strokeStyle = P.dark ? '#ffd84a' : '#b58900'; c.lineWidth = 2; c.beginPath(); c.arc(G.bigX, G.bigY, rb + 3, 0, TAU); c.stroke();
      // gas above; a bubble pushed through the largest pore when the tension beats it
      S.gas.forEach(function (m) { var gx = 14 + m.u * (w - 28), gy = G.gas0 + 6 + m.v * (G.gas1 - G.gas0 - 12); gasMol(c, P, gx, gy, G.r * 0.85, m.a, m.o2); nameIt(T, m.o2 ? 'O₂' : 'N₂', m, gx, gy, G.r * 0.85, m.o2 ? 'O₂' : 'N₂', { q: 1 }); });
      var cut = S.seed;
      S.wat.forEach(function (m) { var x = 14 + m.u * (w - 28), y = G.w0 + 6 + m.v * (G.w1 - G.w0 - 12); if (cut > 0 && Math.hypot(x - G.bigX, y - G.w0) < cut * (w * 0.7)) return; D.water(c, P, x + Math.sin(m.ph) * 1.4, y + Math.cos(m.ph) * 1.4, G.r, m.a); nameIt(T, 'H₂O', m, x, y + 1.4, G.r, 'H₂O'); });
      var k = clamp(p.tension / thr, 0, 1);
      c.strokeStyle = P.dark ? '#cfe3ff' : '#2b5fa4'; c.lineWidth = 2;
      if (cut <= 0) { c.globalAlpha = 0.35 + 0.65 * k; c.beginPath(); c.arc(G.bigX, G.bigY, rb * (1 - 0.5 * k), 0, TAU); c.stroke(); c.globalAlpha = 1; D.arrow(c, G.bigX, G.gas1 - 4, G.bigX, G.my0 + 2, 1.8, P.dark ? 'rgba(207,227,255,.7)' : 'rgba(43,95,164,.6)', 0.4 + 0.5 * k); }
      else { c.save(); c.beginPath(); c.rect(8, G.w0, w - 16, G.w1 - G.w0); c.clip(); c.fillStyle = colGas(P); c.beginPath(); c.arc(G.bigX, G.w0, cut * w * 0.7, 0, TAU); c.fill(); c.stroke(); c.restore(); }
      // tags
      var shown = S.pores.length + 1;
      D.tag(c, P, 10, 13, (G.narrow ? 'gas side' : 'gas filled conduit above'), { size: fs });
      D.tag(c, P, w - 10, 13, (G.narrow ? '' : 'pit area ') + p.area.toFixed(1) + ' mm² → ' + d.N + ' pores' + (d.N > shown && !G.narrow ? ' (' + shown + ' drawn)' : ''), { size: fs, align: 'right' });
      D.tag(c, P, Math.min(w - 10, G.bigX + rb + 10), G.bigY - (G.narrow ? 22 : 0), (G.narrow ? 'largest ' : 'largest of ' + d.N + ': ') + Math.round(d.D * 1000) + ' nm, fails at ' + MINUS + thr.toFixed(2) + ' MPa', { size: fs - 0.5, align: G.bigX + 260 > w ? 'right' : 'left' });
      D.tag(c, P, 10, h - 14, cut > 0 ? 'tension ' + p.tension.toFixed(2) + ' MPa beats the worst pore: air is in' : 'tension ' + p.tension.toFixed(2) + ' MPa: every pore holds, the worst at ' + Math.round(k * 100) + ' % of its limit', { size: fs - 0.5, ink: cut > 0 ? (P.dark ? '#ffb48a' : '#9a3a12') : undefined });
    };
    return S;
  }

  /* ================================================================ scene: a season in one field (Fig F.1)
     set({ day, nd, store (0..1 of plant available water left), psiSoil, psiLeaf (midday), plc, Emm (mm that day), irr (bool),
           wx, n (conduits drawn), root (m) })
     Drawing scales (ILLUSTRATIVE): one water molecule in the soil per 1/60 of the store (so the soil empties as the store
     does); vapour leaves the canopy at 2 molecules s−1 per mm day−1; molecules rise in the working conduits at
     20 px s−1 per mm day−1; round(PLC × n) conduits hold gas, and they stay gas filled, as in the model. */
  function seasonScene() {
    var M = window.MOL, D = M.draw;
    var S = { p: { day: 1, nd: 28, store: 1, psiSoil: -0.03, psiLeaf: -0.6, plc: 0, Emm: 3, irr: false, wx: 'clear', n: 10, root: 0.6 }, soil: [], rise: [], vap: [], rain: [], acc: 0, g: null, R: M.rng(303) };
    var R = S.R;
    S.set = function (p) { var d0 = S.p.day; for (var k in p) S.p[k] = p[k]; if (S.p.irr && S.p.day !== d0) { for (var i = 0; i < 18; i++) S.rain.push({ u: R(), t: -R() * 0.6, a: R() * TAU }); } };
    S.settle = function () { S.vap = []; S.rain = []; };
    S.layout = function (w, h) {
      var G = { w: w, h: h, narrow: w < 560, r: clamp(w / 167, 3.4, 5.2) };
      G.sky1 = 0.16 * h; G.can0 = 0.17 * h; G.can1 = 0.31 * h; G.soil0 = 0.56 * h; G.tx0 = w * (G.narrow ? 0.62 : 0.66); G.tx1 = w * (G.narrow ? 0.82 : 0.78);
      S.g = G;
      if (!S.soil.length) for (var i = 0; i < 60; i++) S.soil.push({ u: R(), v: R(), a: R() * TAU, ph: R() * TAU });
    };
    S.step = function (dt) {
      var G = S.g, p = S.p; if (!G) return;
      S.soil.forEach(function (m) { m.ph += dt; m.a += dt * 0.4; });
      var n = Math.max(1, p.n), k = Math.round(clamp(p.plc, 0, 100) / 100 * n), sp = 20 * Math.max(0.1, p.Emm);
      S.acc += dt * Math.max(0, p.Emm) * 2;
      while (S.acc >= 1) { S.acc -= 1; S.vap.push({ u: R(), t: 0, a: R() * TAU, dx: (R() - 0.5) * 0.3 }); var lane = k + Math.floor(R() * (n - k)); if (lane < n) S.rise.push({ lane: lane, y: 0, a: R() * TAU }); }
      S.rise.forEach(function (m) { m.y += dt * sp; m.a += dt; });
      S.rise = S.rise.filter(function (m) { return m.y < G.soil0 - G.can1 && m.lane >= k; });
      S.vap.forEach(function (v) { v.t += dt * 0.5; v.a += dt * 2; });
      S.vap = S.vap.filter(function (v) { return v.t < 1; });
      S.rain.forEach(function (d) { d.t += dt * 0.7; d.a += dt; });
      S.rain = S.rain.filter(function (d) { return d.t < 1; });
    };
    S.draw = function (c, P, w, h, t, T) {
      var G = S.g, p = S.p; if (!G) return;
      var fog = p.wx === 'fog', hot = p.wx === 'hot' || p.wx === 'custom' && p.Emm > 4;
      var sky = c.createLinearGradient(0, 0, 0, G.soil0);
      sky.addColorStop(0, fog ? (P.dark ? '#1c2228' : '#d9dde0') : hot ? (P.dark ? '#2a1f12' : '#f6dfb8') : (P.dark ? '#0f1a26' : '#dbe9f5'));
      sky.addColorStop(1, P.dark ? '#0d1410' : '#f2efe1'); c.fillStyle = sky; c.fillRect(0, 0, w, G.soil0);
      // soil, grains, and the store as molecules
      var sg = c.createLinearGradient(0, G.soil0, 0, h); sg.addColorStop(0, P.dark ? '#3b2f22' : '#c9b48c'); sg.addColorStop(1, P.dark ? '#2a2118' : '#b29a70');
      c.fillStyle = sg; c.fillRect(0, G.soil0, w, h - G.soil0);
      for (var i = 0; i < (G.narrow ? 10 : 16); i++) D.grain(c, P, ((i * 0.618) % 1) * w, G.soil0 + 14 + ((i * 0.37) % 1) * (h - G.soil0 - 26), 9 + (i % 3) * 3, 400 + i, p.store > 0.3 ? 0.8 : 0.3);
      var nw = Math.round(clamp(p.store, 0, 1) * S.soil.length);
      for (i = 0; i < nw; i++) { var m = S.soil[i], sx = 8 + m.u * (w - 16) + Math.sin(m.ph) * 2, sy = G.soil0 + 8 + m.v * (h - G.soil0 - 16); D.water(c, P, sx, sy, G.r * 0.9, m.a, 0.95); if (sx < G.tx0 - 40) nameIt(T, 'soil', m, sx, sy, G.r * 0.9, 'H₂O', { q: 1 }); }
      // roots
      var rd = clamp(p.root / 1.5, 0.2, 1) * (h - G.soil0 - 8), rx = (G.tx0 + G.tx1) / 2;
      c.strokeStyle = P.dark ? '#c9b48c' : '#6b5232'; c.lineWidth = 2.2; c.lineCap = 'round';
      [[-0.32, 1], [-0.14, 0.92], [0, 1], [0.14, 0.9], [0.3, 0.95]].forEach(function (q) { c.beginPath(); c.moveTo(rx, G.soil0); c.quadraticCurveTo(rx + q[0] * w * 0.3, G.soil0 + rd * 0.5, rx + q[0] * w * 0.6, G.soil0 + rd * q[1]); c.stroke(); });
      // stem with its conduits
      var n = Math.max(1, p.n), k = Math.round(clamp(p.plc, 0, 100) / 100 * n), lw = (G.tx1 - G.tx0) / n;
      for (i = 0; i < n; i++) { var x0 = G.tx0 + i * lw, gasL = i < k; c.fillStyle = gasL ? colGas(P) : colWater(P); c.fillRect(x0 + 1, G.can1, lw - 2, G.soil0 - G.can1); c.fillStyle = colWall(P); c.fillRect(x0, G.can1, 1.5, G.soil0 - G.can1);
        if (gasL) for (var j = 0; j < 3; j++) gasMol(c, P, x0 + lw / 2, G.can1 + (j + 0.5) * (G.soil0 - G.can1) / 3 + Math.sin(t * 2 + i + j) * 2, Math.min(G.r * 0.8, lw * 0.22), t + i + j, (i + j) % 4 === 0); }
      c.fillStyle = colWall(P); c.fillRect(G.tx1 - 1.5, G.can1, 1.5, G.soil0 - G.can1);
      S.rise.forEach(function (m) { var rr2 = Math.min(G.r, lw * 0.32); D.water(c, P, G.tx0 + (m.lane + 0.5) * lw, G.soil0 - m.y, rr2, m.a); });
      // canopy
      for (i = 0; i < (G.narrow ? 5 : 8); i++) { var cx = G.tx0 - w * 0.16 + i * (G.tx1 - G.tx0 + w * 0.32) / ((G.narrow ? 5 : 8) - 1); c.fillStyle = P.dark ? '#2f4a2a' : '#8fb27a'; c.beginPath(); c.ellipse(cx, (G.can0 + G.can1) / 2 + Math.sin(i) * 4, w * 0.05, (G.can1 - G.can0) * 0.5, Math.sin(i) * 0.4, 0, TAU); c.fill(); }
      S.vap.forEach(function (v) { var x = G.tx0 - w * 0.14 + v.u * (G.tx1 - G.tx0 + w * 0.28) + v.dx * w * v.t, y = G.can0 - v.t * (G.can0 - 6); D.water(c, P, x, y, G.r * 0.85, v.a, 1 - v.t); if (v.t > 0.1 && v.t < 0.6) nameIt(T, 'vap', v, x, y, G.r * 0.85, 'H₂O vapour', { q: 1 }); });
      S.rain.forEach(function (d) { if (d.t < 0) return; var x = 10 + d.u * (w - 20), y = lerp(4, G.soil0 + 20, d.t); D.water(c, P, x, y, G.r, d.a, 1 - Math.max(0, d.t - 0.85) / 0.15); });
      // tags
      var fs = G.narrow ? 10 : 11.5;
      D.tag(c, P, 8, 13, 'day ' + p.day + ' of ' + p.nd + (p.irr ? ' · irrigated' : ''), { size: fs });
      D.tag(c, P, 8, G.soil0 + 13, (G.narrow ? 'store ' : 'soil store left ') + Math.round(p.store * 100) + ' % · soil Ψ ' + mn(p.psiSoil) + ' MPa', { size: fs });
      D.tag(c, P, w - 8, 13, (G.narrow ? 'leaf Ψ ' : 'leaf Ψ at midday ') + mn(p.psiLeaf) + ' MPa', { size: fs, align: 'right' });
      D.tag(c, P, G.tx0 - 6, (G.can1 + G.soil0) / 2, k + ' of ' + n + (G.narrow ? ' gas' : ' conduits hold air') + ' · PLC ' + Math.round(p.plc) + ' %', { size: fs - 0.5, align: 'right', ink: k ? (P.dark ? '#ffb48a' : '#9a3a12') : undefined });
      D.tag(c, P, 8, G.can1 + 4, (G.narrow ? 'used ' : 'water used today ') + p.Emm.toFixed(1) + ' mm', { size: fs - 0.5 });
    };
    return S;
  }

  /* ================================================================================== mounts */
  var CH = { stem: { p50: -1.73, s: 98.4 }, pet: { p50: -0.98, s: 69.3 } };
  /* ---------- Fig 6.1 */
  function mountVC() {
    var fig = figOf('fig-embolism-curve'); if (!fig) return;
    var p14 = plc(-1.4, -1.73, 98.4), p14p = plc(-1.4, -0.98, 69.3);
    var box = card({ id: 'u57-vc', kick: 'Fig 6.1 · molecules', title: 'Two organs, one tension',
      tryText: 'Each line is one conduit seen lengthwise: a petiole bundle on top, a stem bundle below, both at the xylem water potential of Fig 6.1. Water molecules stream toward the leaves; a conduit that takes air stops carrying anything. <b>Try this:</b> drag Fig 6.1 slowly from 0 to ' + MINUS + '2 MPa and watch which bundle goes quiet first.',
      predict: true, badges: badge('MEASURED CURVE', 'm') + badge('ILLUSTRATIVE', 'i'),
      scale: 'How many lanes hold air: round(PLC × lanes), with PLC from the same two curves as Fig 6.1, Charrier et al. 2016 Table I, petiole P<sub>50</sub> ' + MINUS + '0.98 MPa and 69.3 % per MPa, stem ' + MINUS + '1.73 MPa and 98.4 % per MPa, in vivo microCT ' + badge('MEASURED', 'm') + ' (' + cite('charrier2016', 'Charrier et al. 2016') + '). Lanes are drawn equal, 8 in the petiole and 10 in the stem, so the share of lanes with air is PLC; real conduits are not equal (Fig 6.4). Which lane goes first is drawn at random. Molecules: 1.4 a second per working lane at a drawn speed of 60 px s<sup>−1</sup>; real sap moves millimetres to centimetres a second. A lane fills with gas from its middle, as if air arrived through a pit ' + badge('ILLUSTRATIVE', 'i') + '. Dragging back toward zero clears the drawing at once because each slider position is a point on a curve; a real conduit does not refill while the xylem is under tension.' });
    insertAfter(fig.el, box);
    predict(box.querySelector('[data-u7pred]'), 'vc', 'Predict, then drag Fig 6.1 to ' + MINUS + '1.40 MPa, where growers’ “severe” class begins. How many of the stem’s 10 lanes will hold air?',
      [['a', 'About 2, a fifth'], ['b', 'About 5, half'], ['c', 'About 9, nearly all']], 'a',
      '<p>At ' + MINUS + '1.40 MPa the stem curve gives ' + Math.round(p14) + ' % loss, about ' + Math.round(p14 / 100 * 10) + ' of 10 lanes. The petiole is already at ' + Math.round(p14p) + ' %, about ' + Math.round(p14p / 100 * 8) + ' of its 8. The cheaper organ goes first.</p>');
    var T = mount(box.querySelector('[data-u7stage]'), lanesScene(), function (cw) { return cw < 560 ? 340 : 320; }, 'Two bundles of xylem conduits seen lengthwise, petiole above and stem below; water molecules flow along the working conduits and conduits that hold air carry nothing', 14);
    if (!T) return; wirePause(box, [T]);
    var now = box.querySelector('[data-u7now]');
    function upd(f) {
      var s = f.st, pp = plc(s.psi, -0.98, 69.3), ps = plc(s.psi, -1.73, 98.4);
      T.set({ groups: [{ label: 'petiole', n: 8, frac: pp / 100, seed: 21 }, { label: 'stem', n: 10, frac: ps / 100, seed: 22 }] });
      now.innerHTML = 'At ' + mn(s.psi) + ' MPa: petiole ' + Math.round(pp) + ' % of its conductivity lost, stem ' + Math.round(ps) + ' %. ' + (pp - ps > 20 ? 'The petiole is going quiet first.' : (pp < 5 ? 'Both bundles still carry nearly everything.' : 'Both bundles are losing lanes.'));
    }
    after(fig, upd); upd(fig); warm(T, 14);
  }
  /* ---------- Fig 6.2 and L.2: one leaf drying */
  function leafParams(cv, psi) {
    var LD = window.WP_LEAFDRY; if (!LD) return null; var S = LD.state(cv, psi), c = S.c;
    return { kLeft: S.kLeft, gLeft: S.gLeft, turgor: S.turgor, shrink: 0.16 * clamp(-psi / Math.abs(c.tlp), 0, 1), mid: S.mid, psi: psi, tlp: c.tlp, cv: c.name };
  }
  function leafNow(q) {
    return 'At ' + mn(q.psi) + ' MPa (' + q.cv + '): ' + Math.round(q.kLeft) + ' % of leaf conductance and ' + Math.round(q.gLeft) + ' % of stomatal conductance left; ' +
      (q.turgor ? 'cells still turgid; ' : 'turgor lost; ') + (q.mid > 0.5 ? 'about ' + Math.round(q.mid) + ' midrib conduits hold air.' : 'the midrib is still full of water.');
  }
  var LEAFSCALE = function (fig) { return 'Every state comes from the same numbers as ' + fig + ': K<sub>leaf</sub> and g<sub>s</sub> P<sub>50</sub> and P<sub>80</sub> and the turgor loss point of Albuquerque et al. 2020 Table 2 (Cabernet Sauvignon K<sub>leaf</sub> ' + MINUS + '0.30 and ' + MINUS + '0.71 MPa, g<sub>s</sub> ' + MINUS + '0.60 and ' + MINUS + '1.21 MPa, TLP ' + MINUS + '1.37 MPa; Chardonnay ' + MINUS + '0.29, ' + MINUS + '0.67, ' + MINUS + '0.53, ' + MINUS + '1.17, ' + MINUS + '1.49) ' + badge('MEASURED', 'm') + ', drawn through a two point Weibull from 0 MPa ' + badge('DERIVED') + ', and the counts of embolised midrib conduits read from the paper (onset near ' + MINUS + '1.25 MPa, 5 at ' + MINUS + '1.35 and 20 at ' + MINUS + '2.0 MPa in Cabernet Sauvignon) ' + badge('MEASURED', 'm') + ' (' + cite('albuquerque2020', 'Albuquerque et al. 2020') + '). The drawing: 20 conduits on wide screens, 15 on phones, so past 15 every drawn conduit holds air; cells shrink by up to 16 % and wrinkle past the turgor loss point ' + badge('ILLUSTRATIVE', 'i') + '. Molecules: liquid water (orange halo) leaves the working conduits at 8 a second × the K<sub>leaf</sub> share left and crosses the bundle sheath; at the mesophyll walls it becomes vapour (blue halo), which leaves through a stoma on the lower side with a chance per try equal to the g<sub>s</sub> share left, otherwise it waits in the air space. The two streams follow their own conductance; they are not a water balance. Why K<sub>leaf</sub> falls is still argued: the aquaporins drawn in the sheath stay open on purpose.'; };
  function mountSeq() {
    var fig = figOf('fig-embolism-seq'); if (!fig || !window.WP_LEAFDRY) return;
    var q9 = leafParams('cs', -0.9);
    var box = card({ id: 'u57-seq', kick: 'Fig 6.2 · molecules', title: 'One leaf, drying',
      tryText: 'A grapevine leaf in cross section, with its stomata on the lower side. It follows the leaf water potential of Fig 6.2. Orange haloed molecules move as liquid from the vein to the cells; blue haloed ones are vapour on their way out. <b>Try this:</b> drag Fig 6.2 to ' + MINUS + '0.5, then ' + MINUS + '1.0, then ' + MINUS + '1.5 MPa and name what changed each time.',
      predict: true, controls: chipRow('u57-seq-cv', [['cs', 'Cabernet Sauvignon'], ['ch', 'Chardonnay']], 'cs'),
      badges: badge('MEASURED', 'm') + badge('ILLUSTRATIVE', 'i'), scale: LEAFSCALE('Fig 6.2 and Fig L.2') });
    insertAfter(fig.el, box);
    predict(box.querySelector('[data-u7pred]'), 'seq', 'At ' + MINUS + '0.90 MPa, where Fig 6.2 opens, what will the leaf below show?',
      [['a', 'Fewer molecules crossing the living tissue, narrower pores, and a midrib still full of water'], ['b', 'Midrib conduits full of air'], ['c', 'Nothing yet: the same as at 0 MPa']], 'a',
      '<p>At ' + MINUS + '0.90 MPa in Cabernet Sauvignon about ' + Math.round(q9.kLeft) + ' % of leaf conductance and ' + Math.round(q9.gLeft) + ' % of stomatal conductance are left, and the midrib takes its first air only near ' + MINUS + '1.25 MPa. The pipes are the last to go.</p>');
    var S = leafScene(), T = mount(box.querySelector('[data-u7stage]'), S, function (cw) { return cw < 560 ? 340 : 330; }, 'Animated grapevine leaf cross section: liquid water leaves the vein through the bundle sheath, turns to vapour in the mesophyll and leaves through stomata on the lower surface, all slowing as the leaf dries; midrib conduits fill with air at very negative water potentials', 6);
    if (!T) return; wirePause(box, [T]);
    var now = box.querySelector('[data-u7now]'), cv = 'cs';
    function upd(f) { var q = leafParams(cv, f.st.psi); T.set(q); now.textContent = leafNow(q); }
    onChip(box, 'u57-seq-cv', function (v) { cv = v; upd(fig); });
    after(fig, upd); upd(fig); warm(T, 14);
  }
  function mountDryLeaf() {
    var fig = figOf('fig-leaf-dry'); if (!fig || !window.WP_LEAFDRY) return;
    var box = card({ id: 'u57-dryleaf', kick: 'Fig L.2 · molecules', title: 'The same leaf, from the inside',
      tryText: 'The leaf of Fig L.2 in cross section, at the same water potential and cultivar. Press <b>Play</b> on Fig L.2 and watch the order: the stream through the living tissue thins first, then the pores narrow, the cells go limp near the turgor loss point, and only then does the midrib take air.',
      predict: true, badges: badge('MEASURED', 'm') + badge('ILLUSTRATIVE', 'i'), scale: LEAFSCALE('Fig L.2 and Fig 6.2') });
    insertAfter(fig.el, box);
    predict(box.querySelector('[data-u7pred]'), 'dryleaf', 'Before you press Play: which stream halves first?',
      [['k', 'Liquid crossing the living tissue (leaf conductance)'], ['g', 'Vapour leaving through the stomata'], ['m', 'Water in the midrib conduits']], 'k',
      '<p>Leaf hydraulic conductance halves near ' + MINUS + '0.30 MPa, stomatal conductance near ' + MINUS + '0.60 MPa (Cabernet Sauvignon), and the midrib only starts near ' + MINUS + '1.25 MPa (' + cite('albuquerque2020', 'Albuquerque et al. 2020') + ').</p>');
    var T = mount(box.querySelector('[data-u7stage]'), leafScene(), function (cw) { return cw < 560 ? 340 : 330; }, 'Animated grapevine leaf cross section following Fig L.2: water through the bundle sheath and mesophyll, vapour out through stomata on the lower surface, midrib conduits filling with air late', 6);
    if (!T) return; wirePause(box, [T]);
    var now = box.querySelector('[data-u7now]');
    function upd(f) { var q = leafParams(f.st.cv || 'cs', f.st.psi); T.set(q); now.textContent = leafNow(q); }
    after(fig, upd); upd(fig); warm(T, 14);
  }
  /* ---------- Fig 6.3 */
  function mountHSM() {
    var fig = figOf('fig-embolism-hsm'); if (!fig) return;
    var VINE = { ch: -1.73, lo: -1.8, hi: -3.4 }, NAME = { ch: 'potted Cabernet Sauvignon stem', lo: 'most vulnerable variety', hi: 'most resistant variety' }, SHORT = { ch: 'Cab. Sauv. stem', lo: 'vulnerable variety', hi: 'resistant variety' };
    var p20 = plc(-2.0, -1.73, 98.4);
    var box = card({ id: 'u57-hsm', kick: 'Fig 6.3 · molecules', title: 'The stem on its driest afternoon',
      tryText: 'Ten stem conduits at the seasonal minimum of Fig 6.3. A thin margin looks like a quiet bundle that is one push from losing lanes. <b>Try this:</b> pick the most resistant variety and push the minimum to ' + MINUS + '2.5 MPa; then switch back to the potted Cabernet Sauvignon.',
      predict: true, badges: badge('MEASURED', 'm') + badge('DERIVED'),
      scale: 'Lanes holding air = round(PLC at Ψ<sub>min</sub> × 10), with the curve Fig 6.3 draws: P<sub>50</sub> from the chip (' + MINUS + '1.73 MPa, Charrier et al. 2016; ' + MINUS + '1.8 and ' + MINUS + '3.4 MPa, the ends of the 30 variety range of Lamarque et al. 2023) with the Charrier stem slope of 98.4 % per MPa ' + badge('DERIVED') + '. Lanes drawn equal and the first lane chosen at random ' + badge('ILLUSTRATIVE', 'i') + '. Molecule rate as in Fig 6.1’s theatre.' });
    insertAfter(fig.el, box);
    predict(box.querySelector('[data-u7pred]'), 'hsm', 'Potted Cabernet Sauvignon, seasonal minimum pushed from ' + MINUS + '1.40 to ' + MINUS + '2.00 MPa. How many of the 10 lanes hold air?',
      [['a', 'About 2'], ['b', 'About 7'], ['c', 'All 10']], 'b',
      '<p>At ' + MINUS + '2.00 MPa the curve gives ' + Math.round(p20) + ' % loss, about ' + Math.round(p20 / 100 * 10) + ' lanes, and the margin to P<sub>50</sub> is ' + MINUS + '0.27 MPa: past half. A 0.6 MPa drier afternoon moved this vine from a thin margin to a negative one.</p>');
    var T = mount(box.querySelector('[data-u7stage]'), lanesScene(), function (cw) { return cw < 560 ? 230 : 210; }, 'A bundle of ten stem conduits at the seasonal minimum water potential; conduits that hold air carry no water molecules', 14);
    if (!T) return; wirePause(box, [T]);
    var now = box.querySelector('[data-u7now]');
    function upd(f) { var s = f.st, p50 = VINE[s.vine] || -1.73, l = plc(s.min, p50, 98.4), m = s.min - p50;
      T.set({ groups: [{ label: (T.canvas && T.canvas.clientWidth < 560 ? SHORT[s.vine] : NAME[s.vine]) || 'stem', n: 10, frac: l / 100, seed: 33 }] });
      now.innerHTML = 'Seasonal minimum ' + mn(s.min) + ' MPa against P<sub>50</sub> ' + mn(p50) + ' MPa: margin ' + sg(m) + ' MPa, ' + Math.round(l) + ' % of the conductivity gone. ' + (m < 0 ? 'Past half: most lanes are quiet.' : m < 1 ? 'Under 1 MPa, like 70 per cent of forest species.' : 'A wide margin: almost every lane still flows.');
    }
    after(fig, upd); upd(fig); warm(T, 14);
  }
  /* ---------- Fig 6.4 */
  function mountR4() {
    var fig = figOf('fig-embolism-r4'); if (!fig) return;
    var DIAM = [110, 95, 90, 80, 70, 65, 60, 55, 50, 45, 40, 35, 30, 28, 25, 22];
    var box = card({ id: 'u57-r4', kick: 'Fig 6.4 · molecules', title: 'Sixteen lanes, very unequal',
      tryText: 'The sixteen vessels of Fig 6.4, laid side by side, each lane as tall as its diameter. Tap vessels in the figure above, or use its two buttons, and watch what stops. <b>Try this:</b> embolise the eight narrowest first, then the three widest.',
      predict: true, badges: badge('PHYSICS', 'm') + badge('ILLUSTRATIVE', 'i'),
      scale: 'Hagen-Poiseuille: mean speed in a tube scales with D² and flow with D⁴. Molecules enter each lane at 24 s<sup>−1</sup> × D⁴ ÷ ΣD⁴ and move at 110 px s<sup>−1</sup> × (D ÷ 110 µm)², so the 22 µm lane gets one molecule about every 75 s ' + badge('PHYSICS', 'm') + '. Diameters as in Fig 6.4, 22 to 110 µm ' + badge('ILLUSTRATIVE', 'i') + '. The microCT approach to PLC from vessel diameters: Brodersen et al. 2013 (' + cite('brodersen2013', 'Brodersen et al. 2013') + ').' });
    insertAfter(fig.el, box);
    var t4 = DIAM.reduce(function (a, d) { return a + Math.pow(d, 4); }, 0), n8 = DIAM.slice(8).reduce(function (a, d) { return a + Math.pow(d, 4); }, 0);
    predict(box.querySelector('[data-u7pred]'), 'r4', 'Embolise the eight narrowest vessels, half of them by count. How much of the flowing water stops?',
      [['a', 'About half'], ['b', 'About 4 %'], ['c', 'About 16 %']], 'b',
      '<p>Their D⁴ adds to ' + (100 * n8 / t4).toFixed(1) + ' % of the total. Half the vessels, a few per cent of the flow; 16 % is their share of area, what an image of the cross section measures.</p>');
    var T = mount(box.querySelector('[data-u7stage]'), d4Scene(), function (cw) { return cw < 560 ? 300 : 280; }, 'Sixteen vessels drawn as lanes as tall as their diameters; water molecules stream fast and densely through the wide lanes and barely move in the narrow ones; embolised lanes hold gas', 12);
    if (!T) return; wirePause(box, [T]);
    var now = box.querySelector('[data-u7now]');
    function upd(f) { var e = f.st.e ? String(f.st.e).split(',').map(Number) : [], a4 = 0; DIAM.forEach(function (d, i) { if (e.indexOf(i) < 0) a4 += Math.pow(d, 4); });
      T.set({ D: DIAM, emb: e }); now.textContent = e.length ? e.length + ' of 16 vessels hold air; ' + Math.round(100 * a4 / t4) + ' % of the water still flows.' : 'All sixteen vessels carry water. The three widest carry about 70 % of it.'; }
    after(fig, upd); upd(fig); warm(T, 14);
  }
  /* ---------- Fig 6.5 and E.1: one pore */
  function seedCard(o) {
    var fig = figOf(o.figId); if (!fig || !window.MOL || !window.MOL.scenes.airseed) return;
    var box = card({ id: o.id, kick: o.kick, title: o.title, tryText: o.tryText, predict: !!o.pred,
      controls: '<div class="ctl"><label for="' + o.id + '-t">Tension in the water filled conduit <span class="val" data-u57t></span></label><input id="' + o.id + '-t" type="range" min="0" max="4" step="0.05" value="' + o.t0 + '"></div><button class="btn" type="button" data-u57="refill">Refill and try again</button>',
      badges: badge('PHYSICS', 'm') + badge('ILLUSTRATIVE', 'i'), scale: o.scale });
    insertAfter(fig.el, box);
    if (o.pred) predict(box.querySelector('[data-u7pred]'), o.pred[0], o.pred[1], o.pred[2], o.pred[3], o.pred[4]);
    var S = window.MOL.scenes.airseed(), T = mount(box.querySelector('[data-u7stage]'), S, function (cw) { return cw < 560 ? 280 : 270; }, 'Two conduits and the pit between them: gas molecules on one side, water under tension on the other; a meniscus in the largest pore bulges as the tension rises and, past its limit, a bubble is pulled through and the water filled conduit embolises', 4);
    if (!T) return; wirePause(box, [T]);
    var tin = box.querySelector('#' + o.id + '-t'), tv = box.querySelector('[data-u57t]'), now = box.querySelector('[data-u7now]'), ten = o.t0;
    function upd(f) { var d = o.pore(f.st), thr = 4 * 0.072 / (d * 1e-9) / 1e6;
      T.set({ tension: ten, poreD: d }); tv.textContent = MINUS + ten.toFixed(2) + ' MPa';
      var st = S.state; now.textContent = 'Pore ' + Math.round(d) + ' nm, about ' + Math.round(d / 0.31) + ' water molecules across: it holds until a pressure difference of ' + thr.toFixed(2) + ' MPa. ' +
        (st === 'hold' ? 'The water at ' + MINUS + ten.toFixed(2) + ' MPa is holding.' : 'Air has been pulled through; the conduit stays gas filled even if you ease the tension, until you refill it.');
    }
    tin.addEventListener('input', function () { ten = +tin.value; upd(fig); });
    box.querySelector('[data-u57="refill"]').addEventListener('click', function () { S.reset(); T.redraw(); upd(fig); });
    after(fig, upd); upd(fig); warm(T, 14);
    setInterval(function () { if (box.offsetParent && S.state !== 'hold') upd(fig); }, 1500);
  }
  var SEEDSCALE = 'The theatre is journey/mol.js’s air seeding scene. Its threshold is ΔP = 4T ÷ D with T = 0.072 N m<sup>−1</sup> and a contact angle of zero (' + cite('sperry1988', 'Sperry & Tyree 1988') + ') ' + badge('PHYSICS', 'm') + '; the gas side is drawn near atmospheric pressure, +0.1 MPa, so the pressure difference is 0.1 MPa more than the tension. Water molecules across the pore: D ÷ 0.31 nm, the spacing of molecules in liquid water from its density, (18.0 g mol<sup>−1</sup> ÷ 0.997 g cm<sup>−3</sup> ÷ 6.022 × 10²³)^⅓ = 0.31 nm ' + badge('DERIVED') + '. Molecule sizes and the pore are not to scale; a real pore of 100 nm is about 300 molecules across ' + badge('ILLUSTRATIVE', 'i') + '. Once seeded, the conduit stays embolised while you ease the tension, because this theatre never refills a conduit under tension; the button refills it by hand.';
  function mountSeed() {
    seedCard({ figId: 'fig-embolism-seed', id: 'u57-seed', kick: 'Fig 6.5 · molecules', title: 'One pore, one bubble', t0: 0.5,
      tryText: 'The pore of Fig 6.5, between a gas filled conduit and a water filled one. The tension slider below pulls on the water. <b>Try this:</b> set the pore in Fig 6.5 to about 200 nm, then pull until the bubble comes through. Refill, halve the pore, and pull again.',
      pore: function (st) { return Math.pow(10, -2 + 2 * st.d / 100) * 1000; },
      pred: ['seed', 'Halve the pore. How much more tension can the column take before air gets in?', [['a', 'Twice as much'], ['b', 'Half as much'], ['c', 'Four times as much']], 'a', '<p>ΔP = 4T ÷ D: halve D and the pressure difference the meniscus can hold doubles. That is the whole design brief of a pit membrane.</p>'],
      scale: SEEDSCALE });
  }
  function mountFailSeed() {
    seedCard({ figId: 'fig-fail-seeding', id: 'u57-failseed', kick: 'Fig E.1 · molecules', title: 'Air seeding, molecule by molecule', t0: 0.3,
      tryText: 'The pore of Fig E.1, live. Drag Fig E.1 to 168 nm, the pore that would explain the grapevine stem P<sub>50</sub>, then pull the water past ' + MINUS + '1.6 MPa here. <b>Then:</b> refill, and try the 400 nm maple pore.',
      pore: function (st) { var e0 = Math.log10(0.03), e1 = 0; return Math.pow(10, e0 + (e1 - e0) * st.d / 100) * 1000; },
      scale: SEEDSCALE + ' Fig E.1 itself uses T = 0.0728 N m<sup>−1</sup>; the 1 % difference changes no conclusion.' });
  }
  /* ---------- Fig E.2 */
  function mountPit() {
    var fig = figOf('fig-fail-pit'); if (!fig) return;
    var box = card({ id: 'u57-pit', kick: 'Fig E.2 · molecules', title: 'A sieve and a valve, under load',
      tryText: 'The pit of Fig E.2 at molecule scale: gas on the left, water on the right, the pit membrane between. Gas molecules keep knocking at the pit. Press <b>Run</b> on Fig E.2, once with each architecture.',
      predict: true, badges: badge('SECONDARY') + badge('ILLUSTRATIVE', 'i'),
      scale: 'Thresholds as Fig E.2 draws them: the torus seats at 1 MPa and the angiosperm membrane’s largest pore lets air through at 2.5 MPa, both round teaching numbers, not measured constants for any species ' + badge('ILLUSTRATIVE', 'i') + '. The membrane bows by up to 0.4 of the wall width as ΔP rises; the bubble fills the neighbour over about two seconds. Architecture: Pittermann et al. 2005 (' + cite('pittermann2005', 'Pittermann et al. 2005') + ') ' + badge('SECONDARY') + '.' });
    insertAfter(fig.el, box);
    predict(box.querySelector('[data-u7pred]'), 'pit', 'Set the angiosperm pit to 1.4 MPa, the pressure at which the conifer had already sealed. What does it do?',
      [['a', 'Air comes straight through'], ['b', 'It holds, only because 1.4 MPa is below its largest pore’s limit'], ['c', 'It seals like the conifer']], 'b',
      '<p>The sieve holds until its worst pore gives way, at 2.5 MPa in this drawing, and then it has nothing left: no valve, so the neighbour embolises. The conifer seals early and keeps its neighbour.</p>');
    var T = mount(box.querySelector('[data-u7stage]'), pitScene(), function (cw) { return cw < 560 ? 250 : 250; }, 'A pit between a gas filled conduit and a water filled one: an angiosperm membrane bows and finally lets a bubble through, or a conifer torus slides onto the aperture and seals it', 4);
    if (!T) return; wirePause(box, [T]);
    var now = box.querySelector('[data-u7now]');
    function upd(f) { var s = f.st, con = s.arch === 'con'; T.set({ arch: s.arch, dp: s.dp });
      now.textContent = 'ΔP ' + s.dp.toFixed(2) + ' MPa, ' + (con ? (s.dp >= 1 ? 'conifer: sealed, the neighbour keeps its water.' : 'conifer: the torus is moving but the pit is still open.') : (s.dp >= 2.5 ? 'angiosperm: air through, the neighbour is embolising.' : 'angiosperm: holding, by pore size alone.')); }
    after(fig, upd); upd(fig); warm(T, 14);
  }
  /* ---------- Fig E.3 */
  function mountRare() {
    var fig = figOf('fig-fail-rare'); if (!fig) return;
    var a2 = dmaxOf(2), a30 = dmaxOf(30);
    var box = card({ id: 'u57-rare', kick: 'Fig E.3 · molecules', title: 'Buy more tickets, draw a bigger pore',
      tryText: 'A pit membrane seen face on, gas above it and water under tension below. Every hole is a pore drawn from the same distribution; the glowing one is the largest. Drag the pit area in Fig E.3 and watch only one thing grow.',
      predict: true, controls: '<div class="ctl"><label for="u57-rare-t">Tension in the water below <span class="val" data-u57t></span></label><input id="u57-rare-t" type="range" min="0.5" max="3" step="0.05" value="1.6"></div>',
      badges: badge('ILLUSTRATIVE', 'i') + badge('SECONDARY'),
      scale: 'Constants of Fig E.3, invented to put the output in a plausible range ' + badge('ILLUSTRATIVE', 'i') + ': pore diameters lognormal with median 0.040 µm and log standard deviation 0.45, 200 pores per mm². The glowing pore is the median largest of N, 0.040 exp(0.45 z) with z = Φ<sup>−1</sup>(0.5<sup>1/N</sup>), the expression the figure uses; it fails at ΔP = 0.2912 ÷ D<sub>max</sub>. At most 220 pores are drawn; the tag says how many exist. Holes drawn at 90 px per µm of diameter; the blue ring in the largest pore is its meniscus, drawn bolder as the tension nears its limit. Hypothesis: Wheeler et al. 2005; Christman et al. 2009 (' + cite('wheeler2005', 'Wheeler et al. 2005') + ') ' + badge('SECONDARY') + '.' });
    insertAfter(fig.el, box);
    predict(box.querySelector('[data-u7pred]'), 'rare', 'Hold the tension at 1.6 MPa and drag the pit area from 2 to 30 mm². What happens?',
      [['a', 'Nothing: the pores are the same'], ['b', 'Air gets in once the area is large enough'], ['c', 'Air stops getting in']], 'b',
      '<p>At 2 mm² the largest of ' + a2.N + ' pores is about ' + Math.round(a2.D * 1000) + ' nm and holds to ' + (0.2912 / a2.D).toFixed(2) + ' MPa. At 30 mm² the largest of ' + a30.N + ' is about ' + Math.round(a30.D * 1000) + ' nm and gives way at ' + (0.2912 / a30.D).toFixed(2) + ' MPa. Same distribution; more draws.</p>');
    var S = rareScene(), T = mount(box.querySelector('[data-u7stage]'), S, function (cw) { return cw < 560 ? 300 : 280; }, 'A pit membrane seen face on with many pores of different sizes; the largest glows, and when the tension beats it a bubble is pulled through from the gas side into the water', 4);
    if (!T) return; wirePause(box, [T]);
    var tin = box.querySelector('#u57-rare-t'), tv = box.querySelector('[data-u57t]'), now = box.querySelector('[data-u7now]'), ten = 1.6;
    function upd(f) { var d = dmaxOf(f.st.area), thr = 0.2912 / d.D; T.set({ area: f.st.area, tension: ten }); tv.textContent = MINUS + ten.toFixed(2) + ' MPa';
      now.textContent = f.st.area.toFixed(1) + ' mm² of pit membrane, ' + d.N + ' pores. The largest, about ' + Math.round(d.D * 1000) + ' nm, gives way at ' + thr.toFixed(2) + ' MPa: ' + (ten >= thr ? 'the water at ' + MINUS + ten.toFixed(2) + ' MPa has lost.' : 'the water at ' + MINUS + ten.toFixed(2) + ' MPa still holds.'); }
    tin.addEventListener('input', function () { ten = +tin.value; upd(fig); });
    after(fig, upd); upd(fig); warm(T, 14);
  }
  /* ---------- Fig L.1 */
  function mountLeafRoutes() {
    var fig = figOf('fig-leaf-anatomy'); if (!fig || !window.MOL || !window.MOL.scenes.routes) return;
    var box = card({ id: 'u57-routes', kick: 'Fig L.1 · molecules', title: 'Follow the molecules, not the picture',
      tryText: 'The same two readings as Fig L.1, now with molecules: every one leaves the vein through the bundle sheath, then goes through the walls (orange), across cells (green) or as vapour through the air space (blue), to stomata on the lower side. <b>Try this:</b> switch Fig L.1 to “What the models say” and raise the temperature difference to 0.2 °C.',
      predict: true, badges: badge('DERIVED · model') + badge('ILLUSTRATIVE', 'i'),
      scale: 'Route shares from Fig L.1’s own model numbers, Buckley, John, Scoffoni &amp; Sack 2015 (' + cite('buckley2015pp', 'Buckley et al. 2015') + '): walls 68 %, membranes 19 %, vapour 16 % rising to 65 % as the leaf centre warms by 0.2 °C, drawn as a straight line between those two ends ' + badge('DERIVED · model') + '. The three are contributions in a parallel network and do not sum to 100, so the theatre divides each by their sum to decide the route of the next molecule ' + badge('DERIVED') + '. In “The textbook picture” every molecule is drawn as liquid to the pore. Rate: 3 molecules s<sup>−1</sup> per mmol m<sup>−2</sup> s<sup>−1</sup>, E fixed at 3 ' + badge('ILLUSTRATIVE', 'i') + '. Scene: journey/mol.js, the same one as Water IV, Tissue.' });
    insertAfter(fig.el, box);
    predict(box.querySelector('[data-u7pred]'), 'routes', 'In “What the models say”, raise the temperature difference from 0 to 0.2 °C. Which route gains the most molecules?',
      [['vap', 'Vapour through the air space'], ['apo', 'The cell walls'], ['tm', 'Across the membranes']], 'vap',
      '<p>The vapour share of conductance outside the xylem goes from 16 to 65 %, so more of the evaporation moves back toward the bundle sheath. Two tenths of a degree does this.</p>');
    var RS = window.MOL.scenes.routes(), textbook = true, rDraw = RS.draw;
    RS.draw = function (c, P, w, h, t, T) { // in the textbook reading, cover the scene's "model shares" bar with what is being drawn instead
      rDraw.apply(RS, arguments); if (!textbook || !RS.g) return;
      var G = RS.g, x0 = G.narrow ? 4 : w * 0.5, y0 = G.yEpU + 18, D = window.MOL.draw;
      if (T && T.names) T.names.block(x0, y0, w - 6 - x0, 70); // no molecule name over the textbook note
      c.fillStyle = P.dark ? '#0b1210' : '#fffdf5'; D.rrect(c, x0, y0, w - 6 - x0, G.narrow ? 70 : 70, 6); c.fill();
      D.tag(c, P, x0 + 8, y0 + 15, G.narrow ? 'textbook: liquid to the pore' : 'textbook reading: every molecule liquid to the pore', { size: G.narrow ? 10 : 11 });
      D.tag(c, P, x0 + 8, y0 + (G.narrow ? 34 : 38), G.narrow ? 'not what the models give' : 'this is not what the models give: switch Fig L.1', { size: G.narrow ? 9.5 : 10.5, ink: P.dark ? '#ffb48a' : '#9a3a12' });
    };
    var T = mount(box.querySelector('[data-u7stage]'), RS, function (cw) { return cw < 560 ? 330 : 300; }, 'Animated leaf section: water molecules leave the vein through the bundle sheath and reach the stoma on the lower surface through the cell walls, across cells or as vapour, in the shares Fig L.1 sets', 8);
    if (!T) return; wirePause(box, [T]);
    var now = box.querySelector('[data-u7now]');
    function upd(f) { var s = f.st, b = s.mode === 'b'; textbook = !b; var gas = 16 + 49 * clamp(s.dt / 0.2, 0, 1), tot = 68 + 19 + gas;
      T.set({ E: 3, dT: b ? s.dt : 0, open: 0.6, share: b ? { apo: 68 / tot, tm: 19 / tot, vap: gas / tot } : { apo: 1, tm: 0, vap: 0 } });
      now.textContent = b ? 'Model reading, ΔT ' + s.dt.toFixed(2) + ' °C: about ' + Math.round(100 * gas / tot) + ' % of the molecules take the vapour route.' : 'Textbook reading: every molecule stays liquid until the pore. The models do not draw it this way.'; }
    after(fig, upd); upd(fig); warm(T, 14);
  }
  /* ---------- Fig F.1 and F.2 */
  var FCACHE = { k: '', r: null };
  function seasonRun(s) {
    var F = window.WP_FIELD; if (!F) return null;
    var n = Math.round(s.days), key = [s.sp, s.wx, s.tmax, s.tmin, s.rhmax, s.rhmin, s.light, s.soil, s.root, s.oa, s.irr, n].join('|');
    if (key === FCACHE.k) return FCACHE.r;
    var wx = s.wx === 'custom' ? { Tmax: s.tmax, Tmin: s.tmin, RHmax: s.rhmax, RHmin: s.rhmin, lightScale: s.light / 100 } : s.wx, irr = [], every = Math.round(s.irr || 0);
    if (every >= 1) for (var k = every - 1; k < n; k += every) irr.push(k);
    FCACHE.k = key; FCACHE.r = F.run({ species: s.sp, soil: s.soil, weather: wx, days: n, oa: s.oa, rootDepth: s.root, irrigate: irr, keepHourly: true });
    return FCACHE.r;
  }
  function storeOf(R, d) { var so = R.meta.soil; return clamp((d.theta - so.thetaWP) / (so.thetaFC - so.thetaWP), 0, 1); }
  function mountField() {
    var fig = figOf('fig-field-season'); if (!fig || !window.WP_FIELD) return;
    // a Southern California chip in the figure's own weather fieldset (ILLUSTRATIVE, the same day as Fig 5.4's chip)
    var SOC = { tmax: 34, tmin: 17, rhmax: 75, rhmin: 32, light: 100 };
    var fs = fig.el.querySelector('fieldset[data-in="wx"]');
    if (fs && !fs.querySelector('input[value="u57inland"]')) {
      var own = fs.querySelector('input[value="custom"]'), anchor = own ? own.parentNode : null, nm = (fs.querySelector('input') || {}).name || 'fwx';
      var lab = el('<label class="chip"><input name="' + nm + '" type="radio" value="u57inland"><span>Inland Southern California valley</span></label>');
      if (anchor) fs.insertBefore(lab, anchor); else fs.appendChild(lab);
      lab.querySelector('input').addEventListener('change', function (e) { if (!e.target.checked) return; var st = fig.st; st.wx = 'custom'; for (var k in SOC) st[k] = SOC[k]; fig.sync(); fig.draw(); e.target.checked = true; });
      fs.parentNode.insertBefore(el('<p class="prov" data-u57socal>Inland Southern California valley loads 34 / 17 °C, humidity 75 % at dawn and 32 % in the afternoon, and full sun into “Your own day”: a teaching day for the Riverside area, the same one as Fig 5.4, not station normals <span class="badge i">ILLUSTRATIVE</span>.</p>'), fs.nextSibling);
    }
    var box = card({ id: 'u57-field', kick: 'Fig F.1 · molecules', title: 'The store, the pipes and the sky, day by day',
      tryText: 'The run of Fig F.1 as one plant in its field. Molecules in the soil are the store that is left; they rise in the stem’s working conduits and leave the canopy as vapour at that day’s rate. <b>Press Play season</b>, or drag the day. <b>Try this:</b> the hot, dry day, then the same with the roots at 1.5 m.',
      tools: '<button class="btn primary" type="button" data-u57="play" aria-pressed="false">Play season</button>',
      predict: true, controls: '<div class="ctl"><label for="u57-fd">Day of the run <span class="val" data-u57d></span></label><input id="u57-fd" type="range" min="1" max="28" step="1" value="28"></div>',
      badges: badge('MODEL OUTPUT · NOT DATA') + badge('ILLUSTRATIVE', 'i'),
      scale: 'Every number is Fig F.1’s own season model, run with the figure’s settings ' + badge('MODEL OUTPUT · NOT DATA') + ': soil water content, soil Ψ, midday leaf Ψ, percent loss of conductivity and millimetres of transpiration for each day. Store left = (θ ' + MINUS + ' θ<sub>−1.5 MPa</sub>) ÷ (θ<sub>field capacity</sub> ' + MINUS + ' θ<sub>−1.5 MPa</sub>), with the retention parameters in the figure’s table (' + cite('carsel1988', 'Carsel &amp; Parrish 1988') + ') ' + badge('DERIVED') + '. Drawing scales ' + badge('ILLUSTRATIVE', 'i') + ': 60 soil molecules for a full store; 2 vapour molecules s<sup>−1</sup> per mm day<sup>−1</sup>; molecules rise at 20 px s<sup>−1</sup> per mm day<sup>−1</sup>; round(PLC × 10) of the 10 stem conduits hold gas and stay gas filled, as in the model, which refills nothing under tension. Roots drawn to the figure’s root depth. The sky colour only names the day type.' });
    insertAfter(fig.el, box);
    var T = mount(box.querySelector('[data-u7stage]'), seasonScene(), function (cw) { return cw < 560 ? 360 : 330; }, 'A plant in its field through the season: water molecules in the soil drain away as the store empties, rise in the working stem conduits and leave the canopy as vapour; conduits that hold air stay gas filled', 4);
    if (!T) return; wirePause(box, [T]);
    var din = box.querySelector('#u57-fd'), dv = box.querySelector('[data-u57d]'), now = box.querySelector('[data-u7now]'), day = 28, play = null, pb = box.querySelector('[data-u57="play"]');
    function show(f) {
      var R = seasonRun(f.st); if (!R) return; var nd = R.days.length; din.max = nd; day = clamp(day, 1, nd); din.value = day; dv.textContent = day + ' of ' + nd;
      var d = R.days[day - 1], stv = storeOf(R, d);
      T.set({ day: day, nd: nd, store: stv, psiSoil: d.psiSoil, psiLeaf: d.psiLeafMin, plc: d.plc, Emm: d.Emm, irr: !!d.irrigated, wx: f.st.wx, n: 10, root: f.st.root });
      now.innerHTML = 'Day ' + day + ': ' + Math.round(stv * 100) + ' % of the store left, soil at ' + mn(d.psiSoil) + ' MPa, leaf at ' + mn(d.psiLeafMin) + ' MPa at midday, ' + d.Emm.toFixed(1) + ' mm used, ' + Math.round(d.plc) + ' % of the stem’s conductivity lost' + (d.plc > 1 ? ', and it stays lost.' : '.');
    }
    din.addEventListener('input', function () { day = +din.value; stop(); show(fig); });
    function stop() { if (play) { clearInterval(play); play = null; } pb.textContent = 'Play season'; pb.setAttribute('aria-pressed', 'false'); }
    pb.addEventListener('click', function () {
      if (play) { stop(); return; }
      var R = seasonRun(fig.st); if (!R) return; if (day >= R.days.length) day = 0;
      pb.textContent = 'Pause season'; pb.setAttribute('aria-pressed', 'true');
      play = spdInterval(function () { var R2 = seasonRun(fig.st); day++; if (!R2 || day > R2.days.length || !box.offsetParent) { day = Math.min(day, R2 ? R2.days.length : day); stop(); } show(fig); }, reduced() ? 900 : 450);
    });
    // predict: does deepening the roots delay embolism? computed from the model itself
    var shallow = null, deep = null;
    try {
      var r1 = window.WP_FIELD.run({ species: 'grape', soil: 'loam', weather: 'hot', days: 45, oa: 0, rootDepth: 0.6, irrigate: [] }), r2 = window.WP_FIELD.run({ species: 'grape', soil: 'loam', weather: 'hot', days: 45, oa: 0, rootDepth: 1.5, irrigate: [] });
      var firstOver = function (R, x) { for (var i = 0; i < R.days.length; i++) if (R.days[i].plc >= x) return i + 1; return null; };
      shallow = firstOver(r1, 12); deep = firstOver(r2, 12);
    } catch (e) {}
    var later = shallow != null && (deep == null || deep > shallow);
    predict(box.querySelector('[data-u7pred]'), 'field', 'Grapevine on loam, every day hot and dry, no irrigation. Deepen the roots from 0.6 to 1.5 m. Do the stem conduits take air sooner, later, or on the same day?',
      [['later', 'Later'], ['sooner', 'Sooner'], ['same', 'The same day: nothing about the plant changed']], later ? 'later' : 'same',
      '<p>In this model 12 % of the stem’s conductivity is lost on day ' + (shallow != null ? shallow : 'none') + ' with roots to 0.6 m and on ' + (deep != null ? 'day ' + deep : 'no day of the 45') + ' with roots to 1.5 m. The plant is the same; the store is two and a half times larger, so the soil, and then the leaf, take longer to dry. Set Fig F.1 to hot, dry and 45 days to watch it.</p>');
    after(fig, function (f) { show(f); }); show(fig); warm(T, 10);
  }
  function mountFieldDay() {
    var fig = figOf('fig-field-day'); if (!fig || !window.WP_FIELD || !window.MOL || !window.WP.P) return;
    var ffig = figOf('fig-field-season');
    var box = card({ id: 'u57-fday', kick: 'Fig F.2 · molecules', title: 'One leaf cell through the chosen day',
      tryText: 'A leaf cell from the day picked in Fig F.2, hour by hour: water molecules leave through the aquaporins as the leaf water potential becomes more negative in the afternoon and come back in the evening. <b>Press Run day</b>, or drag the hour.',
      tools: '<button class="btn primary" type="button" data-u57="run" aria-pressed="false">Run day</button>',
      predict: true, controls: '<div class="ctl"><label for="u57-fh">Hour <span class="val" data-u57h></span></label><input id="u57-fh" type="range" min="0" max="23.75" step="0.25" value="14"></div>',
      badges: badge('MODEL OUTPUT · NOT DATA') + badge('ILLUSTRATIVE', 'i'),
      scale: 'Leaf water potential at each hour from Fig F.1’s season model for the day chosen in Fig F.2 ' + badge('MODEL OUTPUT · NOT DATA') + '; turgor and relative water content from the linear pressure volume equations with that crop’s π<sub>o</sub> (after any osmotic adjustment) and ε, Bartlett et al. 2012 (' + cite('bartlett2012', 'Bartlett et al. 2012') + ') ' + badge('DERIVED') + '. Drawing scales as in the turgor stop’s cell: one solute per 0.025 MPa of π<sub>o</sub>, vacuole change drawn three times larger than the change in relative water content ' + badge('ILLUSTRATIVE', 'i') + '.' });
    insertAfter(fig.el, box);
    var T = mount(box.querySelector('[data-u7stage]'), window.MOL.scenes.cell(), function (cw) { return cw < 560 ? 520 : 340; }, 'Animated leaf cell through one day of the season: its vacuole shrinks and water molecules leave through aquaporins in the afternoon, and refill in the evening', 4);
    if (!T) return; wirePause(box, [T]);
    var hin = box.querySelector('#u57-fh'), hv = box.querySelector('[data-u57h]'), now = box.querySelector('[data-u7now]'), hour = 14, run = null, rb = box.querySelector('[data-u57="run"]');
    function rec() { var R = seasonRun(ffig ? ffig.st : fig.st); if (!R) return null; var dy = clamp(Math.round(fig.st.day), 1, R.days.length); return { R: R, d: R.days[dy - 1], dy: dy }; }
    function show() {
      var q = rec(); if (!q || !q.d.hourly) return; var H = q.d.hourly, i = 0, best = 1e9;
      H.t.forEach(function (tt, j) { var dd = Math.abs(tt - hour); if (dd < best) { best = dd; i = j; } });
      var sp = q.R.meta.sp, po = q.d.poNow != null ? q.d.poNow : sp.po, c = window.WP.P.cell(H.psi[i], po, sp.eps);
      T.set({ psi: H.psi[i], pio: po, turgor: c.psip, rwc: c.R, tlp: c.ptlp, eps: sp.eps, solutes: 0 });
      var hh = Math.floor(hour), mm = Math.round((hour - hh) * 60); hv.textContent = (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm;
      now.innerHTML = 'Day ' + q.dy + ', ' + hv.textContent + ': leaf at ' + mn(H.psi[i]) + ' MPa, turgor ' + c.psip.toFixed(2) + ' MPa, relative water content ' + Math.round(c.R * 100) + ' %. ' + (c.psip <= 0.005 ? 'Past the turgor loss point (' + mn(c.ptlp) + ' MPa): the cell has stopped pushing.' : '');
    }
    hin.addEventListener('input', function () { hour = +hin.value; stopR(); show(); });
    function stopR() { if (run) { clearInterval(run); run = null; } rb.textContent = 'Run day'; rb.setAttribute('aria-pressed', 'false'); }
    rb.addEventListener('click', function () { if (run) { stopR(); return; } rb.textContent = 'Pause day'; rb.setAttribute('aria-pressed', 'true'); hour = 0;
      run = spdInterval(function () { hour += 0.5; if (hour > 23.75 || !box.offsetParent) { hour = Math.min(hour, 23.75); stopR(); } hin.value = hour; show(); }, reduced() ? 600 : 160); });
    // predict, answered from the model on the opening day
    var q0 = rec(), hMin = 14;
    if (q0 && q0.d.hourly) { var H0 = q0.d.hourly, lo = 1e9; H0.t.forEach(function (tt, j) { if (H0.psi[j] < lo) { lo = H0.psi[j]; hMin = tt; } }); }
    predict(box.querySelector('[data-u7pred]'), 'fday', 'When in the day is this cell’s vacuole smallest?',
      [['dawn', 'Around dawn'], ['aft', 'In the early to mid afternoon'], ['mid', 'Around midnight']], (hMin >= 11 && hMin <= 17) ? 'aft' : (hMin < 9 ? 'dawn' : 'mid'),
      '<p>On the day Fig F.2 opens on, the model’s leaf water potential is most negative near ' + Math.floor(hMin) + ':' + (Math.round((hMin % 1) * 60) < 10 ? '0' : '') + Math.round((hMin % 1) * 60) + ', after the hottest, driest air and before the soil can catch up. The cell refills through the evening and night; dawn is when it is fullest.</p>');
    after(fig, function () { show(); }); if (ffig) after(ffig, function () { show(); }); show();
  }

  /* ================================================================ Test yourself, one per stop (the stops14 ladder) */
  var STOPQ = { embolism: 'Embolism', fail: 'How a conduit fails', leaf: 'Where does the water actually leave?', field: 'A season in one field' };
  var MID = { anatomy: 1, turgor: 1, growth: 1, demand: 1, embolism: 1 };
  function quizPanel(route) {
    var s = sec(route), Q = window.WP_QUIZ; if (!s || !Q) return;
    var pager = s.querySelector('nav.pager'); if (!pager || s.querySelector('.u7q')) return;
    var id = 'u57q-' + route, PASS = 4, N = 5, wide = route === 'embolism' ? ['mid', 'Stops 1 to 5'] : ['water', 'All water path stops'];
    var box = el('<section class="u7q" id="' + id + '" aria-labelledby="' + id + '-h"><div class="u7qhead"><p class="eyebrow">Test yourself · this stop</p><h2 id="' + id + '-h">Can you use it, or only say it?</h2>' +
      '<p class="dek" style="font-size:1rem">Five questions a round, three tiers, the same as the site’s <a href="#/quiz">Test yourself</a>. Clear a tier with 4 of 5 to open the next. Scores stay in this browser.</p></div>' +
      '<fieldset class="chips" data-scope><legend>Which questions?</legend><label class="chip"><input type="radio" name="' + id + '-sc" value="stop" checked><span>This stop</span></label><label class="chip"><input type="radio" name="' + id + '-sc" value="' + wide[0] + '"><span>' + wide[1] + '</span></label></fieldset>' +
      '<ol class="tiers" data-tiers></ol><div class="qround" data-round hidden></div></section>');
    s.insertBefore(box, pager);
    function D() { var d = store().get('quizstop', null); if (!d || typeof d !== 'object') d = {}; d[route] = d[route] || { best: {}, cleared: {}, last: {}, scope: 'stop' }; if (d[route].scope !== 'stop' && d[route].scope !== wide[0]) d[route].scope = 'stop'; return d; }
    function save(d) { store().set('quizstop', d); }
    function pool(t, scope) { return Q.items.filter(function (i) { return i.t === t && !i.module && (scope === 'stop' ? i.stop === route : scope === 'mid' ? MID[i.stop] : true); }); }
    function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
    function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    var SRC = {}; (window.WP_SOURCES || []).forEach(function (q) { SRC[q[0]] = q[1]; });
    function citeK(k) { var t = (SRC[k] || k).replace(/<[^>]+>/g, ''), m = t.match(/^(.*?)\((\d{4})\)/), lab = k;
      if (m) { var names = m[1].split(/,\s*/).filter(function (x) { return x && !/^et al/.test(x); }), sur = function (x) { return x.trim().split(/\s+/)[0]; }; lab = (/et al/.test(m[1]) || names.length > 2) ? sur(names[0]) + ' et al. ' + m[2] : (names.length === 2 ? sur(names[0]) + ' & ' + sur(names[1]) + ' ' + m[2] : sur(names[0]) + ' ' + m[2]); }
      else { var y = t.match(/\b(1[89]\d\d|20\d\d)\b/), who = t.split(/[.,(:]/)[0].trim(); lab = who.length > 28 ? k : who + (y ? ' ' + y[1] : ''); }
      return '<a class="cite" href="#/sources#' + k + '">' + esc(lab) + '</a>'; }
    function bdg(b) { return '<span class="badge ' + (b === 'MEASURED' || b === 'VERIFIED' ? 'm' : b === 'ILLUSTRATIVE' || b === 'PREPRINT' ? 'i' : '') + '">' + b + '</span>'; }
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
      var STN = {}; ((window.WP && window.WP.STOPS) || []).forEach(function (x) { STN[x.r] = x.t; });
      roundEl.innerHTML = '<p class="qhead"><span>' + T.name + ' · ' + (st.k + 1) + ' of ' + st.items.length + '</span><a href="#/' + it.stop + '">' + esc(STOPQ[it.stop] || STN[it.stop] || it.stop) + '</a></p>' +
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
      h += '<p class="prov">' + bdg(it.b) + ' ' + it.src.map(citeK).join(' · ') + '</p><div class="row"><button class="btn primary" type="button" data-q="next">' + (st.k < st.items.length - 1 ? 'Next question' : 'See how you did') + '</button></div>';
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
    if (window.MOL && window.MOL.draw) {
      [mountVC, mountSeq, mountHSM, mountR4, mountSeed, mountFailSeed, mountPit, mountRare, mountLeafRoutes, mountDryLeaf, mountField, mountFieldDay]
        .forEach(function (f) { try { f(); } catch (e) { console.error('stops57', f.name, e); } });
    }
    ['embolism', 'fail', 'leaf', 'field'].forEach(function (r) { try { quizPanel(r); } catch (e) { console.error('stops57 quiz', r, e); } });
    var mo = new MutationObserver(function () { var d = isDark(); TH.forEach(function (T) { T.setTheme(d); }); });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { var d = isDark(); TH.forEach(function (T) { T.setTheme(d); }); }); } catch (e) {}
  });
})();

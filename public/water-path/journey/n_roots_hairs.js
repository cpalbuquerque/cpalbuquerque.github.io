/* The Water Path v8: n_roots_hairs.js (team roots helper for Plate I nutrient, loaded by n_field.js)
   A compact 2D panel under the depletion zone workstation: root hairs grow, drain a small neighbourhood,
   die and are replaced further along as the root grows. A side view of a growing root in phosphate soil.
   Three runs of the same small model share one clock:
     A  hairs that die and are replaced (shown in the upper half),
     K  a what if: hairs that never die (switch "Old hairs"),
     B  the same root with no hairs (shown in the lower half).
   The model is ILLUSTRATIVE: explicit 2D diffusion on a grid with local uptake at the root surface and along
   living hairs. No time unit is shown on purpose (no root hair lifespan number is used anywhere).
   window.NR_HAIRS.mount(host) -> {destroy}. Uses the WS kit for badges and tokens when present. */
(function () {
  'use strict';
  if (window.NR_HAIRS) return;
  var WP = window.WP || {}, ui = WP.ui || {};

  function WSk() { return window.WS || null; }
  function badge(t, s) { var W = WSk(); return W ? W.badge(t, s) : '[' + t + ']'; }
  function token(n, d) { var W = WSk(); if (W) return W.token(n); var v = getComputedStyle(document.documentElement).getPropertyValue('--' + n).trim(); return v || d || '#888'; }
  function isDark() { return ui.isDark ? ui.isDark() : !!(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches); }
  function reduced() { return ui.reducedMotion ? ui.reducedMotion() : !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); }
  function clamp(x, a, b) { return x < a ? a : (x > b ? b : x); }

  /* ------------------------------------------------------------ the model (ILLUSTRATIVE; mm and model time) */
  var DX = 0.04, YH = 1.2, R0 = 0.2, TEND = 10, DT = 0.04, D = 0.004, K = 3, KH = 0.6;
  var ZONE = 0.6, GROWT = 1.0, LIFE = 3.0, GONE = 1.2, SPACING = 0.1;
  function rng(seed) { var s = seed; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

  function Model(LX) {
    var NX = Math.round(LX / DX), NY = Math.round(YH / DX), j0 = Math.ceil(R0 / DX);   // rows below j0 are root
    var tip0 = 0.5, v = (LX - 1.2 - tip0) / TEND;
    var r = rng(77), hairs = [];
    for (var x = 0.15; x < LX - 0.3; x += SPACING) {
      var hx = x + (r() - 0.5) * 0.04, Lm = 0.4 + 0.5 * r(), tilt = 0.15 + 0.25 * r();
      var tb = (hx + ZONE - tip0) / v;
      /* cells covered by the full hair, with their distance along it */
      var cells = [];
      for (var s = 0; s <= Lm; s += DX * 0.5) {
        var cx = hx + s * tilt, cy = R0 + s;
        var i = Math.round(cx / DX - 0.5), jj = Math.round(cy / DX - 0.5);
        if (i < 0 || i >= NX || jj < j0 || jj >= NY) continue;
        var id = jj * NX + i;
        if (!cells.length || cells[cells.length - 1][0] !== id) cells.push([id, s]);
      }
      hairs.push({ x: hx, L: Lm, tilt: tilt, tb: tb, cells: cells });
    }
    var m = { LX: LX, NX: NX, NY: NY, j0: j0, hairs: hairs, v: v, tip0: tip0 };
    function run() {
      return { C: new Float32Array(NX * NY).fill(1), N: new Float32Array(NX * NY), taken: 0 };
    }
    m.tip = function (t) { return tip0 + v * t; };
    /* hair state at time t: length (0 before birth), alive flag, dead age */
    m.hair = function (h, t, keep) {
      var a = t - h.tb;
      if (a < 0) return { len: 0, alive: false, dead: -1 };
      var len = h.L * Math.min(1, a / GROWT);
      if (keep || a < LIFE) return { len: len, alive: true, dead: -1 };
      return { len: h.L, alive: false, dead: a - LIFE };
    };
    function step(R, t, mode) {
      var C = R.C, Nn = R.N, i, j, id;
      /* diffusion, zero flux at the sides and at the root, fresh soil at the far edge */
      var f = D * DT / (DX * DX);
      for (j = j0; j < NY; j++) for (i = 0; i < NX; i++) {
        id = j * NX + i; var c = C[id];
        var l = i > 0 ? C[id - 1] : c, rr = i < NX - 1 ? C[id + 1] : c, dn = j > j0 ? C[id - NX] : c, up = j < NY - 1 ? C[id + NX] : 1;
        Nn[id] = c + f * (l + rr + dn + up - 4 * c);
      }
      var tmp = R.C; R.C = Nn; R.N = tmp; C = R.C;
      var tip = m.tip(t), q = 1 - Math.exp(-K * DT), took = 0;
      /* root surface row, behind the tip */
      for (i = 0; i < NX; i++) {
        if ((i + 0.5) * DX > tip) break;
        id = j0 * NX + i; took += C[id] * q; C[id] *= 1 - q;
      }
      if (mode !== 'none') {
        q = 1 - Math.exp(-KH * DT);
        for (var k = 0; k < hairs.length; k++) {
          var h = hairs[k], st = m.hair(h, t, mode === 'keep');
          if (!st.alive) continue;
          for (var c2 = 0; c2 < h.cells.length; c2++) {
            if (h.cells[c2][1] > st.len) break;
            id = h.cells[c2][0]; took += C[id] * q; C[id] *= 1 - q;
          }
        }
      }
      R.taken += took * DX * DX;
    }
    m.reset = function () { m.t = 0; m.A = run(); m.K = run(); m.B = run(); m.hist = [[0, 0, 0, 0]]; };
    m.advance = function (tTo) {
      tTo = clamp(tTo, 0, TEND);
      if (tTo < m.t - 1e-9) m.reset();
      while (m.t + DT <= tTo + 1e-9) {
        step(m.A, m.t, 'die'); step(m.K, m.t, 'keep'); step(m.B, m.t, 'none');
        m.t += DT;
      }
      return m;
    };
    /* uptake right now by each living hair (for its colour): mean C over its cells */
    m.hairC = function (R, h, len) {
      var s = 0, n = 0;
      for (var c = 0; c < h.cells.length; c++) { if (h.cells[c][1] > len) break; s += R.C[h.cells[c][0]]; n++; }
      return n ? s / n : 1;
    };
    m.reset();
    return m;
  }

  /* ------------------------------------------------------------ the panel */
  var CSS = '\
.nr{font-family:var(--ui);font-size:14px;line-height:1.45;color:var(--ink);margin:4px 0 20px;border:1px solid var(--rule2);border-radius:4px;background:var(--wall);padding:10px 12px}\
.nr h4{font-family:var(--disp);font-weight:400;font-size:21px;letter-spacing:.02em;margin:0 0 4px}\
.nr p{margin:0 0 4px;max-width:62em}\
.nr-fig{position:relative;margin:6px 0;background:var(--card2);border-radius:3px;overflow:hidden}\
.nr-fig canvas{display:block;width:100%}\
.nr-ctl{display:flex;flex-wrap:wrap;align-items:center;gap:8px 14px;margin:6px 0}\
.nr-ctl .nr-t{flex:1 1 200px;min-width:0}\
.nr-ctl label{display:flex;justify-content:space-between;font-weight:600;font-size:13px}\
.nr-ctl input[type=range]{width:100%;min-height:44px;accent-color:var(--accent);margin:0}\
.nr-ctl input[type=range]:focus-visible{outline:3px solid var(--accent);outline-offset:2px}\
.nr-ctl .nr-l{font-weight:600;font-size:13px;display:block}\
.nr-bars{display:grid;grid-template-columns:auto 1fr;gap:3px 8px;align-items:center;font-size:13px;margin:4px 0 6px;max-width:40em}\
.nr-bar{height:12px;background:var(--card);border:1px solid var(--rule2);border-radius:2px;position:relative}\
.nr-bar i{position:absolute;left:0;top:0;bottom:0;border-radius:1px}\
.nr-live{border-top:1px solid var(--rule2);padding-top:6px;min-height:3em}\
.nr-why-b p{margin:0 0 6px}\
.nr a{color:var(--accent)}';

  function mount(host) {
    if (!document.getElementById('nr-css')) { var sty = document.createElement('style'); sty.id = 'nr-css'; sty.textContent = CSS; document.head.appendChild(sty); }
    var ILL = 'An invented drawing: hair spacing, lengths, life span, uptake and diffusion are chosen to show the pattern. Not data; no time unit is given on purpose.';
    var hairLen = 'A rough size only; no measurement source was checked for this page.';
    var root = document.createElement('section');
    root.className = 'nr'; root.setAttribute('aria-labelledby', 'nr-h-hairs');
    root.innerHTML =
      '<h4 id="nr-h-hairs">Root hairs: grow, drain, die, replace ' + badge('ILLUSTRATIVE', ILL) + '</h4>' +
      '<p><b>What this is.</b> A side view of a root tip growing to the right through soil that holds phosphate. The colour is the phosphate dissolved in the soil water: strong colour is fresh soil, faint colour is drained. Upper half: the root with <b>root hairs</b>, single skin cells that grow out sideways. Lower half: the same root with no hairs, for comparison.</p>' +
      '<p><b>What to do.</b> Press <b>Play</b> or drag <b>Time</b>. Watch where the colour fades. Then switch <b>Old hairs</b> to <b>never die</b> and compare the bars.</p>' +
      '<div class="nr-fig"><canvas role="img" aria-label="A root growing to the right. Behind the tip, root hairs grow out, drain the soil around them and later die, while new hairs form near the tip."></canvas></div>' +
      '<div class="nr-ctl">' +
        '<button type="button" class="ws-btn nr-play" aria-pressed="false">Play</button>' +
        '<button type="button" class="ws-btn nr-step">Step</button>' +
        '<button type="button" class="ws-btn nr-reset">Reset</button>' +
        '<div class="nr-t"><label for="nr-time">Time <output for="nr-time"></output></label><input id="nr-time" type="range" min="0" max="' + TEND + '" step="0.04" value="0"></div>' +
        '<div><span class="nr-l" id="nr-mode-l">Old hairs</span><div class="ws-seg" role="radiogroup" aria-labelledby="nr-mode-l">' +
          '<button type="button" role="radio" data-v="die" aria-checked="true">die, new ones form</button>' +
          '<button type="button" role="radio" data-v="keep" aria-checked="false">never die (what if)</button></div></div>' +
      '</div>' +
      '<p style="font-size:13px;margin:2px 0 0"><b>Phosphate taken up so far</b> ' + badge('ILLUSTRATIVE', 'Totals from the invented drawing; compare the bar lengths, not numbers.') + '</p>' +
      '<div class="nr-bars"></div>' +
      '<p class="nr-live" aria-live="polite"></p>' +
      '<details class="ws-why"><summary>Why does this happen?</summary><div class="nr-why-b">' + whyHTML(hairLen) + '</div></details>';
    host.appendChild(root);

    var cv = root.querySelector('canvas'), ctx = cv.getContext('2d'), fig = root.querySelector('.nr-fig');
    var btnPlay = root.querySelector('.nr-play'), btnStep = root.querySelector('.nr-step'), btnReset = root.querySelector('.nr-reset');
    var rng0 = root.querySelector('#nr-time'), out = root.querySelector('output'), bars = root.querySelector('.nr-bars'), live = root.querySelector('.nr-live');
    var modeBtns = root.querySelectorAll('.ws-seg button');
    var S = { t: 0, mode: 'die', playing: !reduced() }, model = null, W = 0, H = 0, LX = 10, raf = 0, visible = true, last = 0, offs = [];
    var lutA = null;

    function colours() {
      var dk = isDark();
      lutA = dk ? [[20, 24, 28], [77, 176, 157]] : [[251, 246, 234], [60, 135, 125]];
    }
    function size() {
      var w = Math.max(240, fig.clientWidth || 600);
      var lx = w < 520 ? 6 : 10;
      if (lx !== LX || !model) { LX = lx; model = Model(LX); model.advance(S.t); }
      var sx = (w - 16) / LX, h = Math.round(2 * YH * sx + 44);
      if (w !== W || h !== H) {
        W = w; H = h;
        var dpr = Math.min(2, window.devicePixelRatio || 1);
        cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.height = H + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    }
    var off = document.createElement('canvas'), offx = off.getContext('2d');
    function fieldImage(R, flip) {
      var NX = model.NX, NY = model.NY;
      if (off.width !== NX || off.height !== NY) { off.width = NX; off.height = NY; }
      var img = offx.createImageData(NX, NY), d = img.data, a = lutA[0], b = lutA[1];
      for (var j = 0; j < NY; j++) for (var i = 0; i < NX; i++) {
        var c = j < model.j0 ? -1 : clamp(R.C[j * NX + i], 0, 1), row = flip ? j : NY - 1 - j, k = (row * NX + i) * 4;
        if (c < 0) { d[k + 3] = 0; continue; }
        d[k] = a[0] + (b[0] - a[0]) * c; d[k + 1] = a[1] + (b[1] - a[1]) * c; d[k + 2] = a[2] + (b[2] - a[2]) * c; d[k + 3] = 255;
      }
      offx.putImageData(img, 0, 0);
      return off;
    }
    function draw() {
      size();
      var m = model, sx = (W - 16) / LX, X0 = 8, gap = 6, hH = YH * sx, axisA = 22 + hH, axisB = axisA + gap;
      var ink = token('ink'), ink2 = token('ink2'), warm = token('warm'), wall = token('wall'), rootC = isDark() ? '#ded0b0' : '#f3ead2';
      ctx.fillStyle = token('card2'); ctx.fillRect(0, 0, W, H);
      ctx.imageSmoothingEnabled = true;
      var RA = S.mode === 'keep' ? m.K : m.A;
      ctx.drawImage(fieldImage(RA, false), X0, axisA - hH, LX * sx, hH);
      ctx.drawImage(fieldImage(m.B, true), X0, axisB, LX * sx, hH);
      var tip = m.tip(S.t), rpx = R0 * sx;
      /* the root: two halves */
      ctx.fillStyle = rootC; ctx.strokeStyle = ink2; ctx.lineWidth = 1;
      [[axisA, -1], [axisB, 1]].forEach(function (ax) {
        ctx.beginPath(); ctx.moveTo(X0, ax[0]); ctx.lineTo(X0 + (tip - R0) * sx, ax[0]);
        ctx.lineTo(X0 + tip * sx, ax[0]); ctx.quadraticCurveTo(X0 + (tip - R0 * 0.2) * sx, ax[0] + ax[1] * rpx, X0 + (tip - R0) * sx, ax[0] + ax[1] * rpx);
        ctx.lineTo(X0, ax[0] + ax[1] * rpx); ctx.closePath(); ctx.fill(); ctx.stroke();
      });
      /* hairs, upper half */
      var keep = S.mode === 'keep';
      m.hairs.forEach(function (h) {
        var st = m.hair(h, S.t, keep);
        if (st.len <= 0) return;
        if (!st.alive && st.dead > GONE) return;
        var x0 = X0 + h.x * sx, y0 = axisA - rpx, L = st.alive ? st.len : st.len * (1 - 0.6 * st.dead / GONE);
        var x1 = x0 + L * h.tilt * sx, y1 = y0 - L * sx;
        if (st.alive) {
          var c = m.hairC(RA, h, st.len);
          ctx.setLineDash([]); ctx.strokeStyle = c > 0.45 ? warm : ink2; ctx.globalAlpha = 0.55 + 0.45 * c; ctx.lineWidth = c > 0.45 ? 2 : 1.3;
        } else { ctx.setLineDash([2, 3]); ctx.strokeStyle = ink2; ctx.globalAlpha = 0.7 * (1 - st.dead / GONE) + 0.15; ctx.lineWidth = 1; }
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      });
      ctx.globalAlpha = 1; ctx.setLineDash([]);
      /* labels */
      ctx.font = '12px ' + token('ui'); ctx.textBaseline = 'alphabetic';
      function tag(s, x, y, col, align) {
        var w = ctx.measureText(s).width + 8; x = align === 'right' ? x - w : x; x = clamp(x, 2, W - w - 2);
        ctx.fillStyle = wall; ctx.globalAlpha = 0.86; ctx.fillRect(x, y - 12, w, 16); ctx.globalAlpha = 1;
        ctx.fillStyle = col || ink; ctx.fillText(s, x + 4, y);
      }
      tag('with root hairs', X0 + 2, 15, ink);
      tag('no root hairs', X0 + 2, H - 6, ink);
      var tx = X0 + tip * sx;
      ctx.strokeStyle = ink; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(tx + 3, axisA + gap / 2); ctx.lineTo(tx + 16, axisA + gap / 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(tx + 16, axisA + gap / 2); ctx.lineTo(tx + 11, axisA + gap / 2 - 4); ctx.moveTo(tx + 16, axisA + gap / 2); ctx.lineTo(tx + 11, axisA + gap / 2 + 4); ctx.stroke();
      tag('tip grows this way', tx + 20, axisA + gap / 2 + 4, ink);
      if (W >= 520) {
        var newest = null, oldest = null;
        m.hairs.forEach(function (h) { var st = m.hair(h, S.t, keep); if (st.alive && st.len > 0) { if (!newest || h.x > newest.x) newest = h; } else if (!st.alive && st.dead >= 0 && st.dead < GONE) { if (!oldest || h.x > oldest.x) oldest = h; } });
        if (newest) tag('new hairs, fresh soil', X0 + newest.x * sx - 6, 34, warm, 'right');
        if (oldest && !keep) tag('old hairs dying', X0 + oldest.x * sx - 4, 34, ink2, 'right');
      }
      /* scale bar, lower right */
      var bx = W - 8 - sx - 46, by = H - 9;
      ctx.fillStyle = wall; ctx.globalAlpha = 0.86; ctx.fillRect(bx - 4, by - 13, sx + 50, 17); ctx.globalAlpha = 1;
      ctx.strokeStyle = ink; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bx, by - 4); ctx.lineTo(bx + sx, by - 4); ctx.moveTo(bx, by - 8); ctx.lineTo(bx, by); ctx.moveTo(bx + sx, by - 8); ctx.lineTo(bx + sx, by); ctx.stroke();
      ctx.fillStyle = ink; ctx.fillText('1 mm', bx + sx + 6, by);
    }
    function barsHTML() {
      var m = model, a = m.A.taken, k = m.K.taken, b = m.B.taken, mx = Math.max(1e-9, a, k, b);
      function row(lbl, v, col, on) { return '<span' + (on ? ' style="font-weight:600"' : '') + '>' + lbl + '</span><span class="nr-bar"><i style="width:' + (100 * v / mx).toFixed(1) + '%;background:' + col + '"></i></span>'; }
      return row('hairs, replaced', a, 'var(--warm)', S.mode === 'die') + row('hairs never die', k, 'var(--ink2)', S.mode === 'keep') + row('no hairs', b, 'var(--cool)', false);
    }
    function say() {
      var m = model, f = S.t / TEND, gainK = m.A.taken > 0 ? m.K.taken / m.A.taken - 1 : 0, ratio = m.B.taken > 0 ? m.A.taken / m.B.taken : 1, anyDead = false;
      m.hairs.forEach(function (h) { if (S.t - h.tb > LIFE) anyDead = true; });
      if (S.t < 0.05) return 'The root has just started. Press <b>Play</b> or drag <b>Time</b>.';
      if (S.t < GROWT + 0.6) return 'The first hairs grow out just behind the tip, into fresh soil. The root alone drains only a thin film around itself.';
      if (!anyDead) return 'Each hair drains the soil around it, so the faded zone is as wide as the hairs are long. Bright hairs still sit in fresh soil; dim ones have mostly drained their patch. The root without hairs drains a much thinner film.';
      if (S.mode === 'keep') return 'In this what if, old hairs live on, but their patch of soil is already drained, so they take up ' + (gainK < 0.25 ? 'only a little more' : 'somewhat more, since their patches are not quite empty yet,') + ' than when they die. The young hairs in fresh soil still do most of the work.';
      return 'The oldest hairs have died. Their patch was already mostly drained, so little is lost. New hairs form behind the tip as it grows, so the zone of working hairs moves forward into fresh soil. In this drawing the hairy root has taken up ' + (ratio > 1.5 ? 'clearly more' : 'more') + ' than the bare one.';
    }
    function render() {
      out.textContent = Math.round(100 * S.t / TEND) + ' %';
      rng0.value = S.t;
      draw();
      bars.innerHTML = barsHTML();
      var s = say();
      if (live.getAttribute('data-s') !== s) { live.setAttribute('data-s', s); live.innerHTML = '<b>What just happened.</b> ' + s; }
    }
    function setT(t) { S.t = clamp(t, 0, TEND); model.advance(S.t); render(); }
    function syncPlay() { btnPlay.textContent = S.playing ? 'Pause' : 'Play'; btnPlay.setAttribute('aria-pressed', S.playing ? 'true' : 'false'); }
    function loop(ts) {
      raf = 0;
      if (!S.playing) return;
      var dt = last ? Math.min(0.1, (ts - last) / 1000) : 0; last = ts;
      if (visible && !document.hidden) {
        var nt = S.t + dt * 0.7;
        if (nt >= TEND) { nt = TEND; S.playing = false; syncPlay(); }
        setT(nt);
      }
      if (S.playing) raf = requestAnimationFrame(loop);
    }
    function play(on) { S.playing = on; syncPlay(); last = 0; if (on && !raf) { if (S.t >= TEND - 1e-6) setT(0); raf = requestAnimationFrame(loop); } }
    btnPlay.addEventListener('click', function () { play(!S.playing); });
    btnStep.addEventListener('click', function () { play(false); setT(S.t + TEND / 25); });
    btnReset.addEventListener('click', function () { play(false); model.reset(); setT(0); });
    rng0.addEventListener('input', function () { play(false); setT(+rng0.value); });
    Array.prototype.forEach.call(modeBtns, function (b) {
      b.addEventListener('click', function () {
        S.mode = b.getAttribute('data-v');
        Array.prototype.forEach.call(modeBtns, function (x) { x.setAttribute('aria-checked', x === b ? 'true' : 'false'); });
        render();
      });
      b.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        var o = b === modeBtns[0] ? modeBtns[1] : modeBtns[0]; o.focus(); o.click(); e.preventDefault();
      });
    });
    colours(); size(); model.advance(0); syncPlay(); render();
    if (S.playing) { if (S.t < 1e-6) setT(TEND * 0.02); raf = requestAnimationFrame(loop); }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }, { threshold: 0.01 });
      io.observe(root); offs.push(function () { io.disconnect(); });
    }
    if ('ResizeObserver' in window) {
      var pw = 0, ro = new ResizeObserver(function () { var w = fig.clientWidth; if (w && w !== pw) { pw = w; render(); } });
      ro.observe(fig); offs.push(function () { ro.disconnect(); });
    }
    if (ui.onPrefs) offs.push(ui.onPrefs(function () { colours(); if (reduced() && S.playing) play(false); render(); }));
    return { destroy: function () { S.playing = false; if (raf) cancelAnimationFrame(raf); offs.forEach(function (f) { try { f(); } catch (e) { } }); if (root.parentNode) root.parentNode.removeChild(root); } };
  }

  function whyHTML(hairLen) {
    var DN = 'Drew and Nye 1970, Plant and Soil 33: 545 to 563, rye-grass in soil; abstract read.';
    var GJ = 'Gill and Jackson 2000, New Phytologist 147: 13 to 31: a database of 190 published studies, so a compiled value, not one measurement.';
    var GU = 'Guo et al. 2008, New Phytologist 177: 443 to 456, who analyse this previously reported gap; they did not measure it themselves.';
    return '<p><b>Why hairs help with phosphate.</b> Phosphate is held by the soil and creeps only a short way, so a root drains a thin shell around itself and then waits. A hair reaches out past that shell into soil the root has not touched. Root hairs here are drawn up to 1 mm long, as a rough size only ' + badge('ILLUSTRATIVE', hairLen) + '. In rye-grass growing in soil, phosphate uptake could only be explained if the root hairs were taking part, and the hairs raised the uptake efficiency of the root about <b>2.3 times</b> ' + badge('MEASURED', DN) + ' (Drew and Nye 1970, Plant and Soil 33: 545, <a href="https://doi.org/10.1007/BF01378245" target="_blank" rel="noopener">doi 10.1007/BF01378245</a>). Put simply: hairs roughly doubled what the root could get.</p>' +
      '<p><b>Why hairs die and new ones form.</b> Each hair drains its own small patch. Once that patch is drained, the hair has done most of its work. The root keeps growing. New hairs form behind the tip as it grows, so the zone of working hairs moves forward into fresh soil, where the phosphate still is. The drawing above shows the pattern only ' + badge('ILLUSTRATIVE', 'No root hair life span number is used or implied; the time slider has no unit on purpose.') + '.</p>' +
      '<p><b>Whole fine roots turn over too.</b> Not only hairs are replaced. A compilation of 190 published studies found yearly turnover of about <b>0.53 per year</b> for grassland fine roots and <b>0.56 per year</b> for forest fine roots, roughly half of the standing fine roots replaced each year, but only <b>0.10 per year</b> for whole tree root systems ' + badge('SECONDARY', GJ) + ' (Gill and Jackson 2000, New Phytologist 147: 13, <a href="https://doi.org/10.1046/j.1469-8137.2000.00681.x" target="_blank" rel="noopener">doi 10.1046/j.1469-8137.2000.00681.x</a>). The studies in that compilation used different field methods.</p>' +
      '<p><b>Contested: the method changes the answer.</b> Root turnover estimated by watching roots through buried clear tubes (minirhizotrons) and estimated from carbon isotopes have differed by about <b>fivefold</b> ' + badge('SECONDARY', GU) + ' (as analysed by Guo, Li, Mitchell, Han, Hendricks, Fahey and Hendrick 2008, New Phytologist 177: 443, <a href="https://doi.org/10.1111/j.1469-8137.2007.02242.x" target="_blank" rel="noopener">doi 10.1111/j.1469-8137.2007.02242.x</a>). So every turnover number should be read together with the method behind it ' + badge('OPEN', 'Which method is closer to the truth is still debated.') + '.</p>' +
      '<p><b>What the drawing is.</b> A flat grid of soil 40 µm per cell; phosphate diffuses slowly between cells; the root surface and every living hair take up a fixed fraction of what is next to them at each step. Hair spacing, lengths (all under 1 mm), growth, life span, uptake and diffusion are all invented ' + badge('ILLUSTRATIVE', ILLs()) + '. The comparison is the point, not the totals.</p>';
  }
  function ILLs() { return 'Invented values chosen to show the pattern.'; }

  window.NR_HAIRS = { mount: mount, _Model: Model };
})();

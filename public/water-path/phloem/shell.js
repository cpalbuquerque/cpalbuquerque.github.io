/* Sugar on the move: page shell (phloem builder A, 14 Oct 2026). Adapted from light/shell.js (L1) with the namespace PP.
   Tabs (#source #sieve #xylem #sinks #stress), depth tiers, theme, reduce motion, presentation mode, conditions strip,
   live readout rail, evidence drawers, How to measure cards, per plate sources and the footer.

   API for plate files (L1 and L2 code against this):
     PP.panels.push({ id:'source'|'sieve'|'xylem'|'sinks'|'stress', mount(el), update(state, res), show(), hide() })
       mount runs once, the first time the plate is opened; update runs after every PP solve while mounted.
     PP.ui.ev(key)            -> HTML for an evidence chip; PP.evidence[key] = {claim, cite, doi, doi2, measured, value, badge, note}
     PP.ui.badge(kind)        -> HTML badge: VERIFIED | DERIVED | ILLUSTRATIVE | UNVERIFIED | PREPRINT | OPEN QUESTION
     PP.ui.howto(key)         -> HTML How to measure card; PP.howto[key] = {title, what, steps:[...], watch, dois:[...]}
     PP.ui.sources(dois, h)   -> HTML source list; PP.sources[doi] = label
     PP.ui.reveal(q, answerHTML, opts) -> HTML question with a predict box and a reveal button
     PP.ui.now(text)          -> HTML "What is happening" caption (give it an id to update it)
     PP.ui.anim(host, opts)   -> canvas theatre: {height, label, draw(ctx, w, h, t, dt, info), settle?} returns {canvas, redraw(), pause(bool), paused(), resize()}
                                 dpr capped at 2, draws only when visible and the tab is visible, reduce motion gives a still frame.
     PP.ui.isDark(), PP.ui.reducedMotion(), PP.ui.onPrefs(fn), PP.ui.tier(), PP.ui.esc(s), PP.ui.num(x, d), PP.ui.go(id)
   Engine (L2, engine.js) owns PP.state, PP.set, PP.on, PP.solve, PP.result. If engine.js has not loaded, a stub
   keeps the page alive and says so in the console. */
(function () {
  'use strict';
  var PP = window.PP = window.PP || {};
  var MINUS = '−';
  PP.panels = PP.panels || [];
  PP.evidence = PP.evidence || {};
  PP.sources = PP.sources || {};
  PP.howto = PP.howto || {};

  /* ------------------------------------------------------------ engine stub (only if engine.js is absent) */
  if (typeof PP.set !== 'function' || typeof PP.on !== 'function') {
    console.warn('Sugar on the move: engine.js (PP) not loaded; using a display stub.');
    var subs = [];
    PP.state = PP.state || { psiX: -0.5, conc: 18 };
    PP.solve = PP.solve || function () { return { warnings: ['engine not loaded'] }; };
    PP.result = PP.solve(PP.state);
    PP.set = function (patch) {
      Object.keys(patch || {}).forEach(function (k) { PP.state[k] = patch[k]; });
      PP.result = PP.solve(PP.state);
      subs.slice().forEach(function (fn) { try { fn(PP.state, PP.result); } catch (e) { console.error(e); } });
    };
    PP.on = function (fn) { subs.push(fn); return function () { var i = subs.indexOf(fn); if (i >= 0) subs.splice(i, 1); }; };
    PP.stub = true;
  }

  /* ------------------------------------------------------------ helpers */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function num(x, d) {
    if (x == null || !isFinite(x)) return 'n/a';
    var s = Math.abs(x).toFixed(d == null ? 2 : d);
    if (Math.abs(x) >= 10000) s = Number(s).toLocaleString('en-US', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
    return (x < 0 && Number(s.replace(/,/g, '')) !== 0 ? MINUS : '') + s;
  }
  function lsGet(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { if (v == null) window.localStorage.removeItem(k); else window.localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } }
  var ui = PP.ui = PP.ui || {};
  ui.esc = esc; ui.num = num; ui.MINUS = MINUS;

  /* ------------------------------------------------------------ preferences (shared keys with the journey) */
  var root = document.documentElement;
  var mqDark = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  var mqReduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var prefListeners = [];
  var storedTheme = lsGet('wp8-theme');
  if (storedTheme === 'light' || storedTheme === 'dark') root.setAttribute('data-theme', storedTheme);
  var storedMotion = lsGet('wp8-motion');
  if (storedMotion === 'reduce' || storedMotion === 'full') root.setAttribute('data-motion', storedMotion);
  ui.isDark = function () {
    var t = root.getAttribute('data-theme');
    if (t === 'dark') return true;
    if (t === 'light') return false;
    return !!(mqDark && mqDark.matches);
  };
  ui.theme = function () { return ui.isDark() ? 'dark' : 'light'; };
  ui.reducedMotion = function () {
    var m = root.getAttribute('data-motion');
    if (m === 'reduce') return true;
    if (m === 'full') return false;
    return !!(mqReduce && mqReduce.matches);
  };
  ui.onPrefs = function (fn) {
    prefListeners.push(fn);
    return function () { var i = prefListeners.indexOf(fn); if (i >= 0) prefListeners.splice(i, 1); };
  };
  function firePrefs() {
    var p = { dark: ui.isDark(), theme: ui.theme(), reduceMotion: ui.reducedMotion() };
    prefListeners.slice().forEach(function (fn) { try { fn(p); } catch (e) { console.error(e); } });
  }
  if (mqDark && mqDark.addEventListener) mqDark.addEventListener('change', function () { syncPrefButtons(); firePrefs(); });
  if (mqReduce && mqReduce.addEventListener) mqReduce.addEventListener('change', function () { syncPrefButtons(); firePrefs(); });
  ui.setTheme = function (t) {
    if (t === 'light' || t === 'dark') root.setAttribute('data-theme', t); else root.removeAttribute('data-theme');
    lsSet('wp8-theme', t === 'light' || t === 'dark' ? t : null);
    syncPrefButtons(); firePrefs();
  };
  ui.setReducedMotion = function (on) {
    root.setAttribute('data-motion', on ? 'reduce' : 'full');
    lsSet('wp8-motion', on ? 'reduce' : 'full');
    syncPrefButtons(); firePrefs();
  };
  function syncPrefButtons() {
    var tb = document.getElementById('wp-theme'), mb = document.getElementById('wp-motion');
    if (tb) { var d = ui.isDark(); tb.setAttribute('aria-pressed', d ? 'true' : 'false'); tb.title = 'Night theme: dark background. Press to turn it ' + (d ? 'off' : 'on') + '.'; }
    if (mb) mb.setAttribute('aria-pressed', ui.reducedMotion() ? 'true' : 'false');
  }

  /* ------------------------------------------------------------ tiers */
  var tier = +lsGet('wp8-tier'); if (!(tier === 1 || tier === 3)) tier = 2;
  ui.tier = function () { return tier; };
  function syncTier() {
    var r = document.getElementById('wp-root'); if (r) r.setAttribute('data-tier', String(tier));
    var g = document.getElementById('wp-tier');
    if (g) Array.prototype.forEach.call(g.querySelectorAll('[data-tier]'), function (b) {
      var on = +b.dataset.tier === tier; b.setAttribute('aria-checked', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1;
    });
  }
  ui.setTier = function (t) {
    t = Math.round(+t); if (!(t >= 1 && t <= 3)) t = 2;
    tier = t; lsSet('wp8-tier', String(t)); syncTier();
    if (PP.state) PP.state.tier = t;
    try { window.dispatchEvent(new CustomEvent('pp:tier', { detail: { tier: t } })); } catch (e) { /* old browser */ }
    if (CM.on) setTimeout(cmRebuild, 30);
  };
  function buildTier() {
    var g = document.getElementById('wp-tier'); if (!g) return;
    g.addEventListener('click', function (e) { var b = e.target.closest('[data-tier]'); if (b) ui.setTier(+b.dataset.tier); });
    g.addEventListener('keydown', function (e) {
      var d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]; if (!d) return;
      e.preventDefault(); var t = ((tier - 1 + d + 3) % 3) + 1; ui.setTier(t);
      var b = g.querySelector('[data-tier="' + t + '"]'); if (b) b.focus();
    });
    syncTier();
  }

  /* ------------------------------------------------------------ badges, evidence, sources */
  var BADGE_INFO = {
    MEASURED: 'A published measurement, retrieved and checked this session; paper and DOI in the source list.',
    MODEL: 'What a published model assumes or predicts. Not a measurement.',
    DERIVED: 'Calculated from physical constants or other values by a stated equation.',
    ILLUSTRATIVE: 'Chosen to show a shape or a direction. Not data. Every drawn speed on this page is illustrative.',
    UNVERIFIED: 'From a published source that was found, but this number has not yet been matched in the text.',
    'OPEN QUESTION': 'Still under study. Treat it as a question, not a result.'
  };
  ui.BADGE_INFO = BADGE_INFO;
  ui.badge = function (kind, title) {
    var k = String(kind || 'ILLUSTRATIVE').toUpperCase();
    var cls = { VERIFIED: 'verified', MEASURED: 'verified', MODEL: 'derived', DERIVED: 'derived', ILLUSTRATIVE: 'illustrative', PREPRINT: 'preprint', UNVERIFIED: 'unverified', 'OPEN QUESTION': 'open' }[k] || 'illustrative';
    var t = (title ? title + ' ' : '') + (BADGE_INFO[k] || '');
    return '<span class="badge b-' + cls + '" title="' + esc(t) + '" role="img" aria-label="' + esc(k + ': ' + t) + '">' + esc(k) + '</span>';
  };
  var usedDois = {};
  var panelDois = {};
  var curPanel = null;
  ui.cite = function (doi) { if (!doi) return; usedDois[doi] = true; if (curPanel) (panelDois[curPanel] = panelDois[curPanel] || {})[doi] = true; };
  function srcLabel(doi) { return PP.sources[doi] || ''; }
  ui.source = function (doi) {
    ui.cite(doi);
    var l = srcLabel(doi);
    return (l ? esc(l) + '. ' : '') + '<a href="https://doi.org/' + encodeURI(doi) + '" target="_blank" rel="noopener">doi ' + esc(doi) + '</a>';
  };
  ui.sources = function (dois, heading) {
    var list = (dois || []).filter(function (d, i, a) { return d && a.indexOf(d) === i; });
    if (!list.length) return '';
    return (heading === false ? '' : '<p class="sc lx-srch">' + esc(heading || 'Sources') + '</p>') +
      '<ul class="srclist">' + list.map(function (d) { return '<li>' + ui.source(d) + '</li>'; }).join('') + '</ul>';
  };
  ui.ev = function (key, label) {
    var e = PP.evidence[key];
    if (!e) { console.warn('PP.ui.ev: no evidence entry', key); return ''; }
    if (e.doi) ui.cite(e.doi); if (e.doi2) ui.cite(e.doi2);
    var b = String(e.badge || 'ILLUSTRATIVE').toUpperCase();
    var nm = label || e.short || evName(e);
    return '<button type="button" class="evc" data-ev="' + esc(key) + '" data-b="' + esc(b) + '" aria-expanded="false" aria-label="' + esc('Evidence, ' + b.toLowerCase() + ': ' + nm + '. ' + String(e.claim || '').slice(0, 90)) + '" title="' + esc(b + ': show the evidence behind this claim') + '">' + esc(nm) + '</button>';
  };
  /* a short visible name for a chip without a label: first author and year from the cite, else the badge kind */
  function evName(e) {
    var m = /^\s*([A-Z][A-Za-z\u00C0-\u017F'\-]+)\s+[A-Z]{1,3}[,\s(].*?\((\d{4})/.exec(String(e.cite || ''));
    if (m) return m[1] + (/et al\./.test(e.cite.slice(0, 80)) ? ' et al.' : '') + ' ' + m[2];
    var bb = String(e.badge || '').toUpperCase();
    return bb === 'DERIVED' ? 'Derived' : bb === 'ILLUSTRATIVE' ? 'Teaching value' : 'Evidence';
  };
  function evHTML(key) {
    var e = PP.evidence[key];
    if (!e) return '<p>No evidence entry.</p>';
    var d = [];
    if (e.doi) d.push(ui.source(e.doi)); if (e.doi2) d.push(ui.source(e.doi2));
    return '<div>' + ui.badge(e.badge) + ' <b>' + esc(e.claim) + '</b></div><dl>' +
      (e.value && e.value !== 'qualitative' && e.value !== 'concept' && e.value !== 'mechanism' && e.value !== 'method' ? '<dt>Value</dt><dd class="mono">' + esc(e.value) + '</dd>' : '') +
      '<dt>Paper or basis</dt><dd>' + esc(e.cite || 'none') + '</dd>' +
      '<dt>What was measured</dt><dd>' + esc(e.measured || '') + '</dd>' +
      (e.fig ? '<dt>Figure or table</dt><dd>' + esc(e.fig) + '</dd>' : '') +
      (e.note ? '<dt>Note</dt><dd>' + esc(e.note) + '</dd>' : '') +
      '<dt>DOI</dt><dd>' + (d.length ? d.join('<br>') : 'none (physics, definition or teaching constant)') + '</dd></dl>';
  }
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest && ev.target.closest('button.evc[data-ev]');
    if (!b) return;
    var open = b.getAttribute('aria-expanded') === 'true';
    var id = b.getAttribute('aria-controls'), d = id ? document.getElementById(id) : null;
    if (!d) {
      d = document.createElement('div');
      d.className = 'wpev-drawer'; d.id = 'ppev-' + Math.random().toString(36).slice(2, 9);
      d.setAttribute('role', 'region'); d.setAttribute('aria-label', 'Evidence');
      b.setAttribute('aria-controls', d.id);
      var blk = b.closest('p, li, .card, .tile, figcaption, .ev-host, .lx-row') || b.parentNode;
      blk.parentNode.insertBefore(d, blk.nextSibling);
    }
    d.innerHTML = evHTML(b.getAttribute('data-ev'));
    d.hidden = open;
    b.setAttribute('aria-expanded', open ? 'false' : 'true');
  });

  /* How to measure cards */
  ui.howto = function (key) {
    var h = PP.howto[key]; if (!h) return '';
    (h.dois || []).forEach(ui.cite);
    return '<details class="howto"><summary>How to measure: ' + esc(h.title) + (h.what ? ' <small>' + esc(h.what) + '</small>' : '') + '</summary>' +
      '<ol>' + h.steps.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ol>' +
      (h.watch ? '<p class="hw-k">Watch for</p><p>' + h.watch + '</p>' : '') +
      (h.dois && h.dois.length ? '<p class="hw-k">Methods papers</p><ul class="srclist">' + h.dois.map(function (d) { return '<li>' + ui.source(d) + '</li>'; }).join('') + '</ul>' : '') +
      '</details>';
  };

  /* L1 r5: "Design it" card (PhD panel item 3): from the plate's open question to a defensible experiment.
     o = {title, question, treat, measure (HTML, may hold ui.ev chips), howto: [keys], n, expect (HTML, with badge), confound} */
  ui.design = function (o) {
    var hw = (o.howto || []).filter(function (k) { return PP.howto && PP.howto[k]; }).map(function (k) { return esc(PP.howto[k].title); });
    var row = function (k, v) { return v ? '<p class="hw-k">' + k + '</p><p>' + v + '</p>' : ''; };
    return '<details class="howto lx-design"><summary>Design it: ' + esc(o.title) + ' <small>from this plate to an experiment</small></summary>' +
      row('Question', o.question) + row('Treatment and control', o.treat) +
      row('What to measure', o.measure + (hw.length ? ' See the How to measure card' + (hw.length > 1 ? 's' : '') + ': ' + hw.join('; ') + '.' : '')) +
      row('Replication', o.n) + row('Expected effect', o.expect) + row('The confound to block', o.confound) + '</details>';
  };

  /* L1 r5: "Download this plate's numbers" (PhD panel idea 13): CSV of every evidence row cited on the plate */
  ui.csvButton = function (plateId) { return '<p class="lx-csv tier-3"><button type="button" class="btn small" data-csv="' + esc(plateId) + '">Download this plate’s numbers (CSV)</button> <span class="hint">every value cited on this plate, with units, method, source, DOI and status</span></p>'; };
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-csv]'); if (!b) return;
    var root = b.closest('[role="tabpanel"]') || document.body;
    var keys = []; Array.prototype.forEach.call(root.querySelectorAll('[data-ev]'), function (x) { var k = x.getAttribute('data-ev'); if (k && keys.indexOf(k) < 0) keys.push(k); });
    var q = function (v) { v = String(v == null ? '' : v).replace(/\s+/g, ' ').trim(); return '"' + v.replace(/"/g, '""') + '"'; };
    var lines = [['key', 'claim', 'value', 'measured on / method', 'source', 'doi', 'doi2', 'status', 'note'].join(',')];
    keys.forEach(function (k) { var E = PP.evidence[k]; if (!E) return; lines.push([k, E.claim, E.value, E.measured, E.cite, E.doi, E.doi2, E.badge, E.note].map(q).join(',')); });
    var blob = new Blob(['\ufeff' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'sugar_on_the_move_' + b.getAttribute('data-csv') + '_numbers.csv';
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    b.textContent = 'Downloaded ' + (lines.length - 1) + ' rows';
  });

  /* predict, then reveal */
  ui.reveal = function (q, ans, o) {
    o = o || {};
    var id = 'ppq-' + Math.random().toString(36).slice(2, 8);
    return '<div class="ptc lx-q' + (o.cls ? ' ' + o.cls : '') + '"><p class="ptc-k">' + esc(o.kicker || 'Predict, then check') + '</p><p class="q">' + q + '</p>' +
      (o.choices && o.choices.length ? '<div class="chips lx-pick" role="group" aria-label="Pick your prediction" data-pick="' + id + '">' +
        o.choices.map(function (c, i) { return '<button type="button" class="chip" data-ci="' + i + '" data-ok="' + (c[1] ? 1 : 0) + '" aria-pressed="false">' + c[0] + '</button>'; }).join('') + '</div>' +
        '<div class="lx-pickfb" id="' + id + '-fb" role="status" hidden>' + o.choices.map(function (c, i) { return '<p data-fb="' + i + '" hidden><b>' + (c[1] ? 'Right.' : 'Not quite.') + '</b> ' + (c[2] || '') + '</p>'; }).join('') + '</div>' : '') +
      '<label class="vh" for="' + id + '-t">Your prediction</label><textarea id="' + id + '-t" rows="2" placeholder="' + (o.choices && o.choices.length ? 'Optional: say why in one sentence.' : 'Write one sentence before you look.') + '"></textarea>' +
      '<div class="qrow"><button type="button" class="btn small" data-reveal="' + id + '" aria-expanded="false" aria-controls="' + id + '">Show the answer</button></div>' +
      '<div class="ans" id="' + id + '" hidden>' + ans + '</div></div>';
  };
  /* L1 r5: choice chips commit a prediction (undergraduate panel item 15); picking one shows its reason and opens the answer */
  document.addEventListener('click', function (e) {
    var c = e.target.closest && e.target.closest('.lx-pick [data-ci]'); if (!c) return;
    var g = c.parentNode, id = g.getAttribute('data-pick'), fb = document.getElementById(id + '-fb');
    Array.prototype.forEach.call(g.querySelectorAll('[data-ci]'), function (x) { x.setAttribute('aria-pressed', x === c ? 'true' : 'false'); x.classList.remove('ok', 'no'); if (x === c) x.classList.add(x.dataset.ok === '1' ? 'ok' : 'no'); });
    if (fb) { fb.hidden = false; Array.prototype.forEach.call(fb.querySelectorAll('[data-fb]'), function (p) { p.hidden = p.getAttribute('data-fb') !== c.dataset.ci; }); }
    var a = document.getElementById(id), b = document.querySelector('[data-reveal="' + id + '"]');
    if (a && a.hidden && b) b.click();
  });
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-reveal]'); if (!b) return;
    var a = document.getElementById(b.getAttribute('data-reveal')); if (!a) return;
    var open = !a.hidden; a.hidden = open; b.setAttribute('aria-expanded', open ? 'false' : 'true');
    b.textContent = open ? 'Show the answer' : 'Hide the answer';
    if (!open && !ui.reducedMotion() && a.animate) a.animate([{ opacity: 0, transform: 'translateY(-6px)' }, { opacity: 1, transform: 'none' }], { duration: 400, easing: 'ease-out' });
  });
  ui.now = function (text, id) { return '<p class="wp-now"' + (id ? ' id="' + esc(id) + '"' : '') + ' aria-live="polite">' + text + '</p>'; };

  /* ------------------------------------------------------------ canvas theatre helper */
  /* phones: the sticky readout rail stops sticking while a canvas theatre is in view, so it never covers the animation */
  var railSeen = [], railIO = null;
  function railWatch(cv) {
    if (!('IntersectionObserver' in window)) return;
    if (!railIO) railIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) { var i = railSeen.indexOf(e.target); if (e.intersectionRatio > 0.2) { if (i < 0) railSeen.push(e.target); } else if (i >= 0) railSeen.splice(i, 1); });
      var r = document.querySelector('.wp-rail'); if (r) r.classList.toggle('tuck', railSeen.length > 0);
    }, { threshold: [0, 0.2, 0.5] });
    railIO.observe(cv);
  }
  ui.railWatch = railWatch;  /* phloem: heroes tuck the phone rail too */
  ui.anim = function (host, o) {
    o = o || {};
    var cv = document.createElement('canvas');
    cv.className = 'lx-cv';
    cv.setAttribute('role', 'img');
    cv.setAttribute('aria-label', o.label || 'Animation');
    host.appendChild(cv);
    var ctx = cv.getContext('2d');
    var W = 0, H = 0, dpr = 1, raf = 0, last = 0, t = 0, visible = true, paused = !!o.paused, alive = true;
    function resize() {
      var r = host.getBoundingClientRect();
      var w = Math.max(200, Math.round(r.width));
      var h = typeof o.height === 'function' ? o.height(w) : (o.height || 300);
      dpr = Math.min(2, window.devicePixelRatio || 1);
      if (w === W && h === H && cv.width === Math.round(w * dpr)) return;
      W = w; H = h;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      cv.style.width = W + 'px'; cv.style.height = H + 'px';
      if (o.resize) o.resize(W, H);
      drawOnce(0);
    }
    function info() { return { dark: ui.isDark(), reduce: ui.reducedMotion(), paused: paused, dpr: dpr }; }
    function drawOnce(dt) {
      if (!W) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      try { o.draw(ctx, W, H, t, dt, info()); } catch (e) { console.error(e); }
    }
    function running() { return alive && visible && !paused && !ui.reducedMotion() && document.visibilityState !== 'hidden' && host.offsetParent !== null; }
    function loop(ts) {
      raf = 0;
      if (!running()) { last = 0; return; }
      var dt = last ? Math.min(0.05, (ts - last) / 1000) : 0; dt *= (window.PlaySpeed ? window.PlaySpeed.get() : 1); last = ts; t += dt;
      drawOnce(dt);
      raf = requestAnimationFrame(loop);
    }
    function kick() {
      if (ui.reducedMotion()) { if (o.settle) o.settle(); drawOnce(0); return; }
      if (!raf && running()) raf = requestAnimationFrame(loop);
      else if (!running()) drawOnce(0);
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; kick(); }, { rootMargin: '80px' }).observe(cv);
    }
    if ('ResizeObserver' in window) new ResizeObserver(function () { resize(); }).observe(host);
    else window.addEventListener('resize', resize);
    railWatch(cv);
    document.addEventListener('visibilitychange', kick);
    ui.onPrefs(function () { drawOnce(0); kick(); });
    if (window.MolNames) window.MolNames.on(function () { if (cv.isConnected) drawOnce(0); });
    resize(); kick();
    return {
      canvas: cv,
      redraw: function () { drawOnce(0); },
      pause: function (p) { paused = !!p; last = 0; kick(); },
      paused: function () { return paused; },
      kick: kick,
      resize: resize,
      size: function () { return { w: W, h: H }; }
    };
  };

  /* ------------------------------------------------------------ plates */
  var META = [
    { id: 'source', rn: 'I', name: 'The source leaf', short: 'Source', sub: 'loading sugar into the phloem' },
    { id: 'sieve', rn: 'II', name: 'The sieve tube', short: 'Sieve tube', sub: 'pressure flow from source to sink' },
    { id: 'xylem', rn: 'III', name: 'Xylem meets phloem', short: 'Xylem', sub: 'two pipes, one water supply' },
    { id: 'sinks', rn: 'IV', name: 'Sinks', short: 'Sinks', sub: 'roots, fruit and growing leaves' },
    { id: 'stress', rn: 'V', name: 'Under stress', short: 'Stress', sub: 'drought, heat and recovery' }
  ];
  ui.META = META;
  var sections = {}, current = null;
  function panelOf(id) { for (var i = 0; i < PP.panels.length; i++) if (PP.panels[i].id === id) return PP.panels[i]; return null; }
  function buildTabs() {
    var tabs = document.getElementById('wp-tabs'), stage = document.getElementById('wp-stage');
    META.forEach(function (m) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'wp-tab'; b.id = 'tab-' + m.id; b.setAttribute('role', 'tab');
      b.setAttribute('aria-controls', 'lv-' + m.id); b.setAttribute('aria-selected', 'false'); b.tabIndex = -1;
      b.innerHTML = '<span class="rn">' + m.rn + '</span><span class="tl">' + esc(m.name) + '</span><span class="ts">' + esc(m.short) + '</span>';
      b.addEventListener('click', function () { go(m.id, true); });
      tabs.appendChild(b);
      var s = document.createElement('section');
      s.className = 'level'; s.id = 'lv-' + m.id; s.hidden = true;
      s.setAttribute('role', 'tabpanel'); s.setAttribute('aria-labelledby', 'tab-' + m.id);
      s.innerHTML = '<div class="level-hd"><h2 class="level-no">Sugar ' + m.rn + ' · ' + esc(m.name) + '</h2><span class="level-sp">' + esc(m.sub) + '</span></div><div class="level-body"></div><div class="lx-srcs"></div><div class="wp-next"></div>';
      stage.appendChild(s);
      sections[m.id] = { sec: s, body: s.querySelector('.level-body'), mounted: false };
    });
    tabs.addEventListener('keydown', function (e) {
      var d = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (!d) return;
      e.preventDefault();
      var i = META.findIndex(function (m) { return m.id === current; });
      var n = META[(i + d + META.length) % META.length];
      go(n.id, true); document.getElementById('tab-' + n.id).focus();
    });
  }
  function mountPanel(id) {
    var s = sections[id]; if (!s || s.mounted) return;
    var p = panelOf(id);
    if (!p) { s.body.innerHTML = '<p class="level-pending">This plate is being built now. Plates I and II, the source leaf and the sieve tube, are ready.</p>'; return; }
    s.mounted = true;
    curPanel = id;
    try { p.mount(s.body); if (p.update) p.update(PP.state, PP.result); } catch (e) { console.error('plate ' + id + ' failed to mount', e); s.body.innerHTML = '<p class="level-pending">This plate could not start. Please reload.</p>'; }
    curPanel = null;
    try { quizInit(s.body); } catch (e) { console.error(e); }
    /* every phloem plate names its water and light side, so the site reads as one story */
    try {
      var WL = {
        source: 'Where this sugar was made: G3P leaves the chloroplast and becomes sucrose in the cytosol. <a href="../light/index.html#stroma">Light to sugar, Light IV, the Stroma</a>. The water side: the bundle sheath around this vein is the same sheath water crosses on its way out. <a href="../journey/index.html#tissue">Water journey, Water IV, Tissue</a>',
        sieve: 'See sieve tubes inside a whole tree: open the almond tree on <a href="../journey/index.html#plant">Water journey, Water II, the Plant</a> and press the Phloem chip.',
        xylem: 'The xylem half of this story, from soil to air: <a href="../journey/index.html#plant">Water journey, Water II, the Plant</a> · <a href="../journey/index.html#organ">Water III, the Organ</a>',
        sinks: 'Roots are where the water journey started: <a href="../journey/index.html#organ">Water journey, Water III, the Organ</a>',
        stress: 'The water side of drought: <a href="../journey/index.html#organ">Water journey, Water III, the Organ</a> · <a href="../journey/index.html#afternoon">Your Salinas afternoon</a>'
      };
      var nw = s.body.querySelector('.wp-now');
      if (WL[id] && nw && !s.body.querySelector('.lx-water')) { var wl = document.createElement('p'); wl.className = 'lx-water'; wl.innerHTML = WL[id]; nw.parentNode.insertBefore(wl, nw.nextSibling); }
    } catch (e) { console.error(e); }
    try { var cv = document.createElement('div'); cv.innerHTML = ui.csvButton(id); s.sec.insertBefore(cv.firstChild, s.sec.querySelector('.lx-srcs')); } catch (e) { console.error(e); }
    if (PP.showme[id]) try { var hd = s.sec.querySelector('.level-hd'), sb = document.createElement('button'); sb.type = 'button'; sb.className = 'btn small lx-showme'; sb.setAttribute('data-showme', id); sb.setAttribute('aria-pressed', 'false'); sb.title = 'A 40 second guided run of this plate; touch anything to stop'; sb.textContent = 'Show me'; hd.appendChild(sb); } catch (e) { console.error(e); }
    renderPlateSources(id);
  }
  function renderPlateSources(id) {
    var s = sections[id], dois = Object.keys(panelDois[id] || {});
    var box = s.sec.querySelector('.lx-srcs');
    box.innerHTML = dois.length ? '<details class="card lx-plsrc"><summary>Sources for this plate (' + dois.length + ')</summary>' + ui.sources(dois, false) + '</details>' : '';
    var i = META.findIndex(function (m) { return m.id === id; });
    var nx = META[i + 1], pv = META[i - 1];
    /* U7L (unifier r7): one order for the whole site. Water journey (Field to Afternoon) comes first, then Light to sugar I to V, then back to the Water Path map. */
    s.sec.querySelector('.wp-next').innerHTML =
      (pv ? '<a class="prev" href="#' + pv.id + '">&#8592; Sugar ' + pv.rn + ', ' + esc(pv.name) + '</a>' : '<a class="prev" href="../light/index.html#stroma">&#8592; Before this: Light to sugar, Light IV, the Stroma, where the sugar is made</a>') +
      (nx ? '<a href="#' + nx.id + '">Next: Sugar ' + nx.rn + ', ' + esc(nx.name) + ' &#8594;</a>' : '<a href="../index.html#/map">Back to the Water Path map &#8594;</a><a class="prev" href="../journey/index.html#plant">See both pipes in one tree: Water II, the Plant</a>');
  }
  ui.platesources = renderPlateSources;

  /* ------------------------------------------------------------ Test yourself: the Water Path v7 format (three tiers, five a round,
     unlock at 4 of 5, scope toggle, scores only in this browser). Items: PP.quiz.items.push({id, t: 1|2|3, plate, b: badge,
     src: [doi], q, o: [[answer, why], ...], a: index of the right answer}). Every plate gets its own set; ui.quiz(plate) returns the
     section; it renders itself when the plate mounts. */
  PP.quiz = PP.quiz || {};
  PP.quiz.items = PP.quiz.items || [];
  PP.quiz.tiers = [
    { n: 1, name: 'Know it', verb: 'Recall and recognise', d: 'The words and the definitions. If these slip, nothing else holds.' },
    { n: 2, name: 'Use it', verb: 'Apply and predict', d: 'Numbers given. Work out what happens before you look.' },
    { n: 3, name: 'Question it', verb: 'Evaluate and critique', d: 'Two claims, one dataset, or a conclusion somebody drew. Is it right, and how would you know?' }
  ];
  window.WP_QUIZ_PHLOEM = PP.quiz;
  var QZ_PASS = 4, QZ_N = 5, QZ_KEY = 'pp-quiz';
  function qzS() { var d = null; try { d = JSON.parse(lsGet(QZ_KEY) || 'null'); } catch (e) { d = null; } if (!d || typeof d !== 'object') d = {}; d.best = d.best || {}; d.cleared = d.cleared || {}; d.last = d.last || {}; d.scope = d.scope || {}; return d; }
  function qzSave(d) { lsSet(QZ_KEY, JSON.stringify(d)); }
  function qzShuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  function qzScope(d, plate) { return d.scope[plate] || 'plate'; }
  function qzPool(t, plate, scope) { return PP.quiz.items.filter(function (i) { return i.t === t && (scope === 'all' || i.plate === plate); }); }
  function qzKey(plate, scope) { return scope === 'all' ? 'all' : plate; }
  function qzOpen(t, d, k) { return t === 1 || d.cleared[k + ':' + (t - 1)] || d.cleared[k + ':force' + t]; }
  function plateName(id) { var m = META.filter(function (x) { return x.id === id; })[0]; return m ? 'Sugar ' + m.rn + ', ' + m.name : id; }
  function shortSrc(doi) { var s = String(srcLabel(doi) || doi).replace(/<[^>]+>/g, ''); var m = s.match(/^(.*?)\((\d{4})\)/); if (!m) return s.slice(0, 40); var au = m[1].trim().split(/,\s*/); var first = au[0].split(/\s+/)[0]; return first + (au.length > 2 || /et al/.test(m[1]) ? ' et al. ' : (au.length === 2 ? ' and ' + au[1].split(/\s+/)[0] + ' ' : ' ')) + m[2]; }
  ui.quiz = function (plate) {
    return '<section class="lx-quiz card" data-quiz="' + esc(plate) + '" aria-label="Test yourself"><p class="lx-ck">Test yourself</p>' +
      '<h3 class="lx-h3 qz-h">Can you use it, or only say it?</h3>' +
      '<p class="qz-dek">Five questions a round, three tiers. Know it is the words. Use it is the numbers, given to you. Question it is what plant physiologists actually do: decide whether a claim holds, and say so when the data cannot tell. Clear a tier with 4 of 5 and the next one opens. Your scores stay in this browser; nobody else sees them.</p>' +
      '<fieldset class="chips qz-scope"><legend class="vh">Which questions?</legend>' +
      '<label class="chip"><input type="radio" name="qzs-' + esc(plate) + '" value="plate"><span>This plate</span></label>' +
      '<label class="chip"><input type="radio" name="qzs-' + esc(plate) + '" value="all"><span>The whole Sugar on the move module</span></label></fieldset>' +
      '<ol class="qz-tiers"></ol><div class="qz-round" hidden></div>' +
      '<p class="qz-prov">Every section of the site, water, light and sugar, in one place: <a href="../index.html#/quiz">the site wide Test yourself</a>. If you think an answer is wrong, you may be right: tell the site author through the feedback form. <button type="button" class="linkbtn qz-reset">Clear my scores</button></p></section>';
  };
  function qzRender(box) {
    var plate = box.dataset.quiz, d = qzS(), scope = qzScope(d, plate), k = qzKey(plate, scope);
    Array.prototype.forEach.call(box.querySelectorAll('.qz-scope input'), function (r) { r.checked = r.value === scope; });
    var T = PP.quiz.tiers;
    box.querySelector('.qz-tiers').innerHTML = T.map(function (t) {
      var o = qzOpen(t.n, d, k), b = d.best[k + ':' + t.n], c = d.cleared[k + ':' + t.n], n = qzPool(t.n, plate, scope).length;
      var status = c ? '<span class="qs ok">Cleared · best ' + b + ' of ' + QZ_N + '</span>' : (b != null ? '<span class="qs">Best so far ' + b + ' of ' + QZ_N + '</span>' : (o ? '<span class="qs">Open</span>' : '<span class="qs lock">Clear ' + T[t.n - 2].name + ' with ' + QZ_PASS + ' of ' + QZ_N + ' to open</span>'));
      return '<li class="qz-tier' + (o ? '' : ' locked') + (c ? ' done' : '') + '"><div class="tn">' + t.n + '</div><div class="tb"><h4>' + t.name + '</h4><p class="tv">' + t.verb + '</p><p>' + t.d + '</p>' + status +
        '<div class="row">' + (n === 0 ? '<span class="qn">Questions for this tier are being written.</span>' : (o ? '<button class="btn primary small" type="button" data-qz-start="' + t.n + '">' + (b != null ? 'Another ' + QZ_N : 'Start: ' + QZ_N + ' questions') + '</button>' :
          '<button class="btn small" type="button" data-qz-force="' + t.n + '">Open it anyway</button>') + '<span class="qn">' + n + ' in the pool</span>') + '</div></div></li>';
    }).join('');
  }
  function qzStart(box, t) {
    var plate = box.dataset.quiz, d = qzS(), scope = qzScope(d, plate), k = qzKey(plate, scope), p = qzPool(t, plate, scope), last = d.last[k + ':' + t] || [];
    var pick = qzShuffle(p.filter(function (i) { return last.indexOf(i.id) < 0; })).concat(qzShuffle(p.filter(function (i) { return last.indexOf(i.id) >= 0; }))).slice(0, Math.min(QZ_N, p.length));
    d.last[k + ':' + t] = pick.map(function (i) { return i.id; }); qzSave(d);
    box._qz = { t: t, k: k, items: pick.map(function (i) { return { it: i, order: qzShuffle(i.o.map(function (_, j) { return j; })), pick: null }; }), i: 0 };
    box.querySelector('.qz-tiers').hidden = true; box.querySelector('.qz-scope').hidden = true; box.querySelector('.qz-round').hidden = false;
    qzItem(box);
  }
  function qzItem(box) {
    var R = box._qz, X = R.items[R.i], it = X.it, T = PP.quiz.tiers[R.t - 1], nm = 'qz-' + box.dataset.quiz;
    var h = '<p class="qhead"><span>' + T.name + ' · ' + (R.i + 1) + ' of ' + R.items.length + '</span><a href="#' + esc(it.plate) + '">' + esc(plateName(it.plate)) + '</a></p>' +
      '<div class="ptc qz"><p class="q" tabindex="-1">' + it.q + '</p><fieldset class="chips stack"><legend class="vh">Your answer</legend>' +
      X.order.map(function (j) { return '<label class="chip"><input type="radio" name="' + nm + '" value="' + j + '"><span>' + it.o[j][0] + '</span></label>'; }).join('') +
      '</fieldset><div class="row"><button class="btn primary small" type="button" data-qz-check disabled>Check</button></div><div class="ans" hidden role="status"></div></div>' +
      '<div class="row"><button class="btn small" type="button" data-qz-quit>Leave this round</button></div>';
    var rd = box.querySelector('.qz-round'); rd.innerHTML = h;
    var q = rd.querySelector('.q'); if (q) try { q.focus({ preventScroll: true }); } catch (e) { /* ok */ }
  }
  function qzReveal(box) {
    var R = box._qz, X = R.items[R.i], it = X.it, rd = box.querySelector('.qz-round');
    var v = rd.querySelector('input[type=radio]:checked'); if (!v) return;
    var k = +v.value, ok = k === it.a; X.pick = k;
    Array.prototype.forEach.call(rd.querySelectorAll('input[type=radio]'), function (r) { r.disabled = true; var lab = r.parentNode, j = +r.value; if (j === it.a) lab.classList.add('right'); else if (j === k) lab.classList.add('wrong'); });
    var why = function (i) { return it.o[i][1].replace(/^Right\.\s*/, ''); };
    var h = '<h4>' + (ok ? 'Right.' : 'Not this one.') + '</h4><p><b>' + (ok ? 'Why' : 'Your answer') + ':</b> ' + (ok ? why(k) : it.o[k][0] + '. ' + why(k)) + '</p>';
    if (!ok) h += '<p><b>The answer:</b> ' + it.o[it.a][0] + '. ' + why(it.a) + '</p>';
    h += '<p class="prov">' + ui.badge(it.b || 'MEASURED') + ' ' + (it.src || []).map(function (doi) { ui.cite(doi); return '<a class="cite" href="https://doi.org/' + esc(doi) + '" target="_blank" rel="noopener">' + esc(shortSrc(doi)) + '</a>'; }).join(' · ') + '</p>';
    h += '<div class="row"><button class="btn primary small" type="button" data-qz-next>' + (R.i < R.items.length - 1 ? 'Next question' : 'See how you did') + '</button></div>';
    var a = rd.querySelector('.ans'); a.innerHTML = h; a.hidden = false; rd.querySelector('[data-qz-check]').hidden = true;
  }
  function qzFinish(box) {
    var R = box._qz, d = qzS(), score = R.items.filter(function (X) { return X.pick === X.it.a; }).length, key = R.k + ':' + R.t;
    if (d.best[key] == null || score > d.best[key]) d.best[key] = score;
    var cleared = score >= QZ_PASS && R.items.length >= QZ_N; if (cleared) d.cleared[key] = 1; qzSave(d);
    var T = PP.quiz.tiers, nxt = T[R.t];
    var h = '<div class="qend" role="status"><h4 tabindex="-1">' + score + ' of ' + R.items.length + '</h4><p>' +
      (cleared ? (nxt ? T[R.t - 1].name + ' is cleared. ' + nxt.name + ' is open.' : 'All three tiers are cleared. The next thing to question is this site: tell the site author where it is wrong, through the feedback form.') :
        'Clearing this tier takes ' + QZ_PASS + ' of ' + QZ_N + '. Read the ones you missed, then try another five. The next round draws different questions where the pool allows.') + '</p></div>' +
      '<ol class="review">' + R.items.map(function (X) { var ok = X.pick === X.it.a; return '<li class="' + (ok ? 'ok' : 'no') + '"><span class="mk">' + (ok ? 'Right' : 'Missed') + '</span> ' + X.it.q + (ok ? '' : '<span class="why">The answer: ' + X.it.o[X.it.a][0] + '.</span>') + '</li>'; }).join('') + '</ol>' +
      '<div class="row"><button class="btn primary small" type="button" data-qz-again>Another ' + QZ_N + ' from ' + T[R.t - 1].name + '</button>' + (cleared && nxt ? '<button class="btn small" type="button" data-qz-up>Go to ' + nxt.name + '</button>' : '') + '<button class="btn small" type="button" data-qz-quit>All tiers</button></div>';
    box.querySelector('.qz-round').innerHTML = h;
  }
  function qzHome(box) { box._qz = null; var rd = box.querySelector('.qz-round'); rd.hidden = true; rd.innerHTML = ''; box.querySelector('.qz-tiers').hidden = false; box.querySelector('.qz-scope').hidden = false; qzRender(box); }
  function quizInit(root) { Array.prototype.forEach.call(root.querySelectorAll('.lx-quiz[data-quiz]'), function (b) { if (!b._qzInit) { b._qzInit = true; qzRender(b); } }); }
  ui.quizInit = quizInit;
  document.addEventListener('change', function (e) {
    var r = e.target; if (!r || !r.closest) return;
    var box = r.closest('.lx-quiz'); if (!box) return;
    if (r.closest('.qz-scope')) { var d = qzS(); d.scope[box.dataset.quiz] = r.value; qzSave(d); qzRender(box); }
    else if (r.type === 'radio') { var c = box.querySelector('[data-qz-check]'); if (c) c.disabled = false; }
  });
  document.addEventListener('click', function (e) {
    var t = e.target; if (!t || !t.closest) return;
    var box = t.closest('.lx-quiz'); if (!box) return;
    var b;
    if ((b = t.closest('[data-qz-start]'))) qzStart(box, +b.dataset.qzStart);
    else if ((b = t.closest('[data-qz-force]'))) { var d = qzS(), k = qzKey(box.dataset.quiz, qzScope(d, box.dataset.quiz)); d.cleared[k + ':force' + b.dataset.qzForce] = 1; qzSave(d); qzRender(box); }
    else if (t.closest('[data-qz-check]')) qzReveal(box);
    else if (t.closest('[data-qz-next]')) { if (box._qz.i < box._qz.items.length - 1) { box._qz.i++; qzItem(box); } else qzFinish(box); }
    else if (t.closest('[data-qz-again]')) qzStart(box, box._qz.t);
    else if (t.closest('[data-qz-up]')) qzStart(box, box._qz.t + 1);
    else if (t.closest('[data-qz-quit]')) qzHome(box);
    else if (t.closest('.qz-reset')) { lsSet(QZ_KEY, null); qzHome(box); }
  });
  function go(id, push) {
    if (typeof SM !== 'undefined' && SM && SM.run && SM.id !== id) smStop();
    if (!sections[id]) id = META[0].id;
    if (current === id) { mountPanel(id); return; }
    var prev = current; current = id;
    META.forEach(function (m) {
      var on = m.id === id, t = document.getElementById('tab-' + m.id);
      t.setAttribute('aria-selected', on ? 'true' : 'false'); t.tabIndex = on ? 0 : -1;
      sections[m.id].sec.hidden = !on;
    });
    if (prev) { var pp = panelOf(prev); if (pp && pp.hide && sections[prev].mounted) try { pp.hide(); } catch (e) { console.error(e); } }
    mountPanel(id);
    var p = panelOf(id); if (p && p.show) try { p.show(); } catch (e) { console.error(e); }
    if (push && location.hash !== '#' + id) { try { history.pushState(null, '', '#' + id); } catch (e) { location.hash = id; } }
    if (prev && push) { var st = document.getElementById('wp-stage'); var y = st.getBoundingClientRect().top + window.pageYOffset - 70; if (window.pageYOffset > y) window.scrollTo(0, Math.max(0, y)); }
    if (prev && !ui.reducedMotion() && sections[id].sec.animate) sections[id].sec.animate([{ opacity: 0, transform: 'scale(.985)', filter: 'blur(3px)' }, { opacity: 1, transform: 'none', filter: 'none' }], { duration: 420, easing: 'cubic-bezier(.2,.7,.2,1)' });
    if (CM.on) setTimeout(cmRebuild, 30);
  }
  ui.go = function (id) { go(id, true); };
  function route() { var h = (location.hash || '').replace('#', ''); go(sections[h] ? h : META[0].id, false); }
  window.addEventListener('hashchange', route);
  window.addEventListener('popstate', route);

  /* ------------------------------------------------------------ conditions strip (the plant and its sieve tube) */
  var CONTROLS = [
    { k: 'psiX', l: 'Xylem water potential at the leaf, Ψx', min: -2.5, max: 0, step: 0.05, f: function (v) { return num(v, 2) + ' MPa'; }, hint: 'more negative = a drier plant; the sieve tube pulls its water from here' },
    { k: 'conc', l: 'Sugar in the sieve tube sap', min: 2, max: 32, step: 0.5, f: function (v) { return num(v, 1) + ' %'; }, hint: 'mass of sugar per mass of sap; measured near 18 %' },
    { k: 'Psink', l: 'Turgor at the sink', min: 0, max: 1.2, step: 0.01, f: function (v) { return num(v, 2) + ' MPa'; }, hint: '0.59 MPa measured in a morning glory root' },
    { k: 'L', l: 'Path length, source to sink', min: 0.2, max: 30, step: 0.1, f: function (v) { return num(v, 1) + ' m'; }, hint: 'a vine, a shrub, a tall tree' },
    { k: 'sugar', l: 'What the leaf exports', opts: [['sucrose', 'Sucrose'], ['rosaceae', 'Sucrose and sorbitol (almond, peach, apple family)']] },
    { k: 'load', l: 'How the leaf loads', opts: [['apo', 'Active, through the cell wall'], ['sym', 'Passive, through plasmodesmata'], ['trap', 'Polymer trap']] }
  ];
  function buildConditions() {
    var g = document.getElementById('wp-cond-grid'); if (!g || !PP.state) return;
    CONTROLS.forEach(function (c) {
      if (!(c.k in PP.state)) return;
      var d = document.createElement('div'); d.className = 'ctl';
      var id = 'ppc-' + c.k;
      if (c.opts) {
        d.innerHTML = '<label for="' + id + '">' + esc(c.l) + '</label><select id="' + id + '">' + c.opts.map(function (o) { return '<option value="' + o[0] + '">' + esc(o[1]) + '</option>'; }).join('') + '</select>' + (c.hint ? '<div class="hint">' + esc(c.hint) + '</div>' : '');
        d.querySelector('select').addEventListener('change', function (e) { var p = {}; p[c.k] = e.target.value; PP.set(p); });
      } else {
        d.innerHTML = '<label for="' + id + '">' + esc(c.l) + ' <output id="' + id + '-o"></output></label><input type="range" id="' + id + '" min="' + c.min + '" max="' + c.max + '" step="' + c.step + '">' + (c.hint ? '<div class="hint">' + esc(c.hint) + '</div>' : '');
        d.querySelector('input').addEventListener('input', function (e) { var p = {}; p[c.k] = +e.target.value; PP.set(p); });
      }
      g.appendChild(d);
    });
    syncConditions(PP.state);
  }
  function syncConditions(st) {
    if (!st) return;
    var sum = [];
    CONTROLS.forEach(function (c) {
      if (!(c.k in st)) return;
      var el = document.getElementById('ppc-' + c.k); if (!el) return;
      if (c.opts) { if (document.activeElement !== el) el.value = st[c.k]; sum.push(c.opts.filter(function (o) { return o[0] === st[c.k]; }).map(function (o) { return o[1]; })[0] || st[c.k]); }
      else { if (document.activeElement !== el) el.value = st[c.k]; var o = document.getElementById('ppc-' + c.k + '-o'); if (o) o.textContent = c.f(+st[c.k]); sum.push(c.f(+st[c.k])); }
    });
    var s = document.getElementById('wp-cond-sum'); if (s) s.textContent = sum.join(' · ');
  }

  /* ------------------------------------------------------------ live readout rail */
  var RAIL = [
    { k: 'psrc', l: 'Turgor at the source', u: 'MPa', d: 2, get: function (st, r) { return r && r.Psrc; }, def: 'pressure in the sieve tube in the leaf' },
    { k: 'psink', l: 'Turgor at the sink', u: 'MPa', d: 2, get: function (st, r) { return r && r.Psink; }, def: 'pressure where sugar is unloaded' },
    { k: 'grad', l: 'Pressure gradient', u: 'MPa m⁻¹', d: 2, get: function (st, r) { return r && Math.max(0, r.grad); }, def: 'what pushes the sap along each metre' },
    { k: 'u', l: 'Sap speed', u: 'µm s⁻¹', d: 0, get: function (st, r) { return r && r.U; }, def: 'model speed in one sieve tube' },
    { k: 'ucm', l: 'Same speed', u: 'cm h⁻¹', d: 0, get: function (st, r) { return r && r.Ucmh; }, def: 'the unit tree studies use' },
    { k: 'trip', l: 'Trip time', u: 'h', d: 1, get: function (st, r) { return r && isFinite(r.transit) ? r.transit : null; }, def: 'source to sink, the whole path' }
  ];
  function buildRail() {
    var r = document.getElementById('wp-rail'); if (!r) return;
    r.innerHTML = '<h2>Right now</h2><p class="rail-sub">the same sieve tube on every plate · model</p>' + RAIL.map(function (x) {
      return '<div class="ro" id="ro-' + x.k + '"><span class="k">' + esc(x.l) + '</span><span class="v"><span class="n">n/a</span> <small>' + esc(x.u) + '</small></span><span class="def">' + esc(x.def) + '</span></div>';
    }).join('') + '<p class="note tier-1-only" id="ro-hint"></p><p class="note" id="ro-note"></p>';
  }
  function syncRail(st, res) {
    RAIL.forEach(function (x) {
      var el = document.querySelector('#ro-' + x.k + ' .n'); if (!el) return;
      var v = x.get(st, res);
      el.textContent = x.txt ? (v == null ? 'n/a' : String(v)) : ((v == null || !isFinite(v)) ? 'n/a' : num(v, x.d));
    });
    /* tier 1 hint in plain words */
    var hn = document.getElementById('ro-hint');
    if (hn) hn.textContent = res && res.U > 0 ? 'In this model sugar moves about ' + Math.round(res.Ucmh) + ' cm every hour, so sugar made now reaches the sink in about ' + num(res.transit, 1) + ' hours.' : 'Right now nothing pushes the sap: the source is not at a higher pressure than the sink.';
    var n = document.getElementById('ro-note');
    if (n) n.textContent = PP.stub ? 'The phloem model is still loading on this build; readouts appear when it is ready.' : ((res && res.warnings && res.warnings.length) ? res.warnings.join(' ') : '');
  }

  /* ------------------------------------------------------------ footer */
  function buildFoot() {
    var f = document.getElementById('wp-foot'); if (!f) return;
    var dois = Object.keys(usedDois).sort(function (a, b) { return (srcLabel(a) || a).localeCompare(srcLabel(b) || b); });
    f.innerHTML = '<h2>How to read the badges</h2><ul class="legend">' + Object.keys(BADGE_INFO).map(function (k) { return '<li>' + ui.badge(k) + ' ' + esc(BADGE_INFO[k]) + '</li>'; }).join('') + '</ul>' +
      '<details><summary>Every source opened so far on this page (' + dois.length + ')</summary>' + ui.sources(dois, false) + '<p>Physical constants: the gas constant R = 8.314 J mol⁻¹ K⁻¹ (CODATA 2018) and a standard fit for the viscosity of water; quantities computed from them carry the DERIVED badge.</p></details>' +
      '<p class="lx-credit">© 2026 Dr Caetano Albuquerque · Albuquerque Lab. An independent teaching resource, not an official university publication.</p>';
  }
  ui.refreshFoot = buildFoot;

  /* ------------------------------------------------------------ presentation mode */
  var CM = { on: false, steps: [], i: 0 };
  function cmSteps() {
    var s = sections[current]; if (!s) return [];
    var out = [];
    Array.prototype.forEach.call(s.body.children, function (k) {
      k.classList.remove('cm-off', 'cm-on');
      if (k.tagName === 'STYLE' || k.offsetHeight < 30) return;
      out.push(k);
    });
    return out;
  }
  function cmShow(i, animate) {
    if (!CM.steps.length) return;
    CM.i = Math.max(0, Math.min(CM.steps.length - 1, i));
    CM.steps.forEach(function (x, j) { x.classList.toggle('cm-off', j !== CM.i); x.classList.toggle('cm-on', j === CM.i); });
    var cur = CM.steps[CM.i];
    if (animate && !ui.reducedMotion() && cur.animate) cur.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, easing: 'ease-out' });
    var c = document.getElementById('wp-cm-count'); if (c) c.textContent = (CM.i + 1) + ' of ' + CM.steps.length;
    try { window.scrollTo(0, Math.max(0, cur.getBoundingClientRect().top + window.pageYOffset - 120)); } catch (e) { /* ok */ }
    window.dispatchEvent(new Event('resize'));
  }
  function cmRebuild() {
    if (!CM.on) return;
    Array.prototype.forEach.call(document.querySelectorAll('.cm-off,.cm-on'), function (x) { x.classList.remove('cm-off', 'cm-on'); });
    CM.steps = cmSteps(); cmShow(0, false);
    var m = META.filter(function (x) { return x.id === current; })[0], big = document.getElementById('wp-cm-plate');
    if (big && m) big.textContent = 'Sugar ' + m.rn;
  }
  ui.setClass = function (on) {
    CM.on = !!on;
    if (CM.on) root.setAttribute('data-class', ''); else root.removeAttribute('data-class');
    var b = document.getElementById('wp-class'); if (b) b.setAttribute('aria-pressed', CM.on ? 'true' : 'false');
    var bar = document.getElementById('wp-cm-bar');
    if (CM.on) {
      var cond = document.getElementById('wp-cond'); if (cond) cond.open = false;
      if (!bar) {
        bar = document.createElement('div'); bar.id = 'wp-cm-bar'; bar.className = 'wp-cm-bar';
        bar.innerHTML = '<span class="cm-plate" id="wp-cm-plate"></span><span class="cm-count" id="wp-cm-count"></span>' +
          '<button type="button" class="btn small" data-cm="prev" aria-label="Previous step">&#8592;</button><button type="button" class="btn small" data-cm="next" aria-label="Next step">&#8594;</button>' +
          '<button type="button" class="btn small" data-showme-cur>Show me</button><button type="button" class="btn small primary" data-cm="exit">Exit presentation mode</button>';
        bar.addEventListener('click', function (e) { var t = e.target.closest('[data-cm]'); if (!t) return; var a = t.dataset.cm; if (a === 'exit') ui.setClass(false); else cmShow(CM.i + (a === 'next' ? 1 : -1), true); });
        document.body.appendChild(bar);
      }
      bar.hidden = false;
      setTimeout(cmRebuild, 30);
    } else {
      if (bar) bar.hidden = true;
      Array.prototype.forEach.call(document.querySelectorAll('.cm-off,.cm-on'), function (x) { x.classList.remove('cm-off', 'cm-on'); });
      window.dispatchEvent(new Event('resize'));
    }
  };
  ui.classMode = function () { return CM.on; };

  /* L1 r5: "Show me" autopilot (designer panel 14). A plate registers PP.showme[id] = [{ at: 'css selector to bring into view',
     click: 'css selector to press' (optional), say: 'one line caption', wait: ms }]. Any touch, click, key or wheel stops it. */
  PP.showme = PP.showme || {};
  var SM = { run: false, timer: 0, i: 0, id: null };
  function smToast(t) {
    var b = document.getElementById('wp-sm'); if (!b) { b = document.createElement('div'); b.id = 'wp-sm'; b.className = 'wp-sm'; b.setAttribute('role', 'status'); b.setAttribute('aria-live', 'polite'); document.body.appendChild(b); }
    b.hidden = !t; b.innerHTML = t ? '<span class="sm-k">Show me</span> ' + esc(t) + ' <button type="button" class="btn small" data-sm="stop">Stop</button>' : '';
  }
  function smStop() { if (!SM.run) return; SM.run = false; clearTimeout(SM.timer); smToast(''); Array.prototype.forEach.call(document.querySelectorAll('[data-showme]'), function (b) { b.setAttribute('aria-pressed', 'false'); b.textContent = 'Show me'; }); }
  function smStep() {
    var steps = PP.showme[SM.id] || []; if (!SM.run) return;
    if (SM.i >= steps.length) { smToast('Done. Now try it yourself.'); SM.timer = setTimeout(smStop, 3500); return; }
    var st = steps[SM.i++], sec = sections[SM.id] && sections[SM.id].sec;
    var el = st.at && sec ? sec.querySelector(st.at) : null;
    if (el) { var y = el.getBoundingClientRect().top + window.pageYOffset - 90; window.scrollTo({ top: Math.max(0, y), behavior: ui.reducedMotion() ? 'auto' : 'smooth' }); }
    if (st.click && sec) { var c = sec.querySelector(st.click); if (c) { SM.self = true; c.click(); SM.self = false; } }
    if (st.fn) try { st.fn(); } catch (e) { console.error(e); }
    smToast(st.say || '');
    SM.timer = setTimeout(smStep, st.wait || 6000);
  }
  ui.showme = function (id) { id = id || current; if (!PP.showme[id]) return; smStop(); SM.run = true; SM.i = 0; SM.id = id;
    Array.prototype.forEach.call(document.querySelectorAll('[data-showme="' + id + '"]'), function (b) { b.setAttribute('aria-pressed', 'true'); b.textContent = 'Showing…'; });
    setTimeout(smStep, 50); };
  ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(function (ev) { window.addEventListener(ev, function (e) {
    if (!SM.run || SM.self) return; if (e.target && e.target.closest && e.target.closest('[data-showme]')) return; smStop(); }, { passive: true, capture: true }); });
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-showme]'); if (b) { if (SM.run) smStop(); else ui.showme(b.getAttribute('data-showme')); return; }
    if (e.target.closest && e.target.closest('[data-showme-cur]')) { if (!PP.showme[current]) { smToast('No guided run on this plate yet.'); setTimeout(function () { smToast(''); }, 2500); return; } ui.setClass(false); ui.showme(current); return; }
    if (e.target.closest && e.target.closest('[data-sm="stop"]')) smStop(); });
  document.addEventListener('keydown', function (e) {
    var t = e.target, typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
    if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'c' || e.key === 'C') { ui.setClass(!CM.on); e.preventDefault(); return; }
    if (!CM.on) return;
    if (e.key === 'Escape') { ui.setClass(false); return; }
    if (t && t.closest && t.closest('[role="tablist"],[role="radiogroup"]')) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); cmShow(CM.i + 1, true); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); cmShow(CM.i - 1, true); }
  });

  /* ------------------------------------------------------------ boot */
  function update(st, res) {
    syncConditions(st); syncRail(st, res);
    Object.keys(sections).forEach(function (id) {
      if (!sections[id].mounted) return;
      var p = panelOf(id); if (p && p.update) try { p.update(st, res); } catch (e) { console.error('plate ' + id + ' update', e); }
    });
  }
  function build() {
    buildTabs(); buildTier(); buildConditions(); buildRail(); syncPrefButtons();
    document.getElementById('wp-theme').addEventListener('click', function () { ui.setTheme(ui.isDark() ? 'light' : 'dark'); });
    document.getElementById('wp-motion').addEventListener('click', function () { ui.setReducedMotion(!ui.reducedMotion()); });
    document.getElementById('wp-class').addEventListener('click', function () { ui.setClass(!CM.on); });
    if (PP.state) PP.state.tier = tier;
    PP.on(update);
    if (!PP.result && PP.solve) PP.result = PP.solve(PP.state);
    route();
    update(PP.state, PP.result);
    buildFoot();
    var ft = 0;
    document.addEventListener('click', function () { clearTimeout(ft); ft = setTimeout(buildFoot, 200); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else setTimeout(build, 0);
})();

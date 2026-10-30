/* Curious things: the small page shell (team curious, v20). Plain ES5, no libraries.
   Shares preferences with the other sub-sites (localStorage keys wp8-theme, wp8-motion, wp8-tier), so the night theme,
   reduce motion and depth follow the reader from Light to sugar or the journey.
   CQ.isDark(), CQ.reducedMotion(), CQ.onPrefs(fn), CQ.tier()
   CQ.badge(tag)                 a tag chip: MEASURED, DERIVED, SECONDARY, OPEN, ILLUSTRATIVE
   CQ.ev(key, label)             an evidence chip (button) that opens the claim, value, source, DOI and note
   CQ.sources(host)              fills an <ol class="srcs"> with every reference used by the evidence chips on the page
   CQ.glOK()                     true when three.js and WebGL work and ?ws=2d is not set
   CQ.orbit(el, camera, o)       drag to turn, shift drag or two fingers to pan, ctrl wheel or pinch to zoom, arrow keys
   CQ.canvas(cv, h)              sizes a 2D canvas for the device pixel ratio; returns {g, w, h}
   CQ.num(x, d)                  a number with the U+2212 minus sign
   The page header and nav are built from <body data-page="home|resurrection|aerenchyma">. */
(function () {
  'use strict';
  var CQ = window.CQ = window.CQ || {};
  CQ.evidence = CQ.evidence || {}; CQ.refs = CQ.refs || {};
  var MINUS = '−';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function num(x, d) {
    if (x == null || !isFinite(x)) return 'n/a';
    var s = Math.abs(x).toFixed(d || 0);
    if (+s === 0) return s;
    return (x < 0 ? MINUS : '') + s;
  }
  CQ.esc = esc; CQ.num = num; CQ.MINUS = MINUS;
  function lsGet(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { if (v == null) window.localStorage.removeItem(k); else window.localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } }

  /* ---------------------------------------------------------------- preferences */
  var root = document.documentElement;
  var mqDark = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  var mqReduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var subs = [];
  var t0 = lsGet('wp8-theme'); if (t0 === 'light' || t0 === 'dark') root.setAttribute('data-theme', t0);
  var m0 = lsGet('wp8-motion'); if (m0 === 'reduce' || m0 === 'full') root.setAttribute('data-motion', m0);
  var tier = +lsGet('wp8-tier'); if (!(tier === 1 || tier === 3)) tier = 2;
  CQ.isDark = function () { var t = root.getAttribute('data-theme'); if (t === 'dark') return true; if (t === 'light') return false; return !!(mqDark && mqDark.matches); };
  CQ.reducedMotion = function () { var m = root.getAttribute('data-motion'); if (m === 'reduce') return true; if (m === 'full') return false; return !!(mqReduce && mqReduce.matches); };
  CQ.onPrefs = function (fn) { subs.push(fn); };
  CQ.tier = function () { return tier; };
  function fire() { syncButtons(); subs.slice().forEach(function (f) { try { f(); } catch (e) { console.error(e); } }); }
  if (mqDark && mqDark.addEventListener) mqDark.addEventListener('change', fire);
  if (mqReduce && mqReduce.addEventListener) mqReduce.addEventListener('change', fire);
  function setTheme(t) { root.setAttribute('data-theme', t); lsSet('wp8-theme', t); fire(); }
  function setMotion(on) { root.setAttribute('data-motion', on ? 'reduce' : 'full'); lsSet('wp8-motion', on ? 'reduce' : 'full'); fire(); }
  function setTier(n) { tier = n; lsSet('wp8-tier', String(n)); var w = document.getElementById('cq'); if (w) w.setAttribute('data-tier', String(n)); fire(); }
  function syncButtons() {
    var tb = document.getElementById('cq-theme'), mb = document.getElementById('cq-motion');
    if (tb) tb.setAttribute('aria-pressed', CQ.isDark() ? 'true' : 'false');
    if (mb) mb.setAttribute('aria-pressed', CQ.reducedMotion() ? 'true' : 'false');
    Array.prototype.forEach.call(document.querySelectorAll('.cq-tier [data-tier]'), function (b) {
      var on = +b.getAttribute('data-tier') === tier; b.setAttribute('aria-checked', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1;
    });
  }

  /* ---------------------------------------------------------------- tags and evidence */
  var TAGINFO = {
    MEASURED: 'Measured: read from data in the paper named.',
    DERIVED: 'Derived: worked out from measured numbers or from geometry; the working is in the evidence note.',
    SECONDARY: 'Secondary: taken from a review that reports other studies.',
    OPEN: 'Open: scientists disagree or the idea rests on one group; both sides are shown.',
    ILLUSTRATIVE: 'Illustrative: a teaching sketch, not a measurement.'
  };
  CQ.badge = function (tag) {
    var k = String(tag || 'ILLUSTRATIVE').toUpperCase();
    return '<span class="badge b-' + k.toLowerCase() + '" title="' + esc(TAGINFO[k] || '') + '" role="img" aria-label="' + esc(k + '. ' + (TAGINFO[k] || '')) + '">' + esc(k) + '</span>';
  };
  var used = {};
  CQ.ev = function (key, label) {
    var e = CQ.evidence[key];
    if (!e) { console.warn('CQ.ev: no evidence entry', key); return ''; }
    (e.refs || []).forEach(function (r) { used[r] = true; });
    var nm = label || (e.refs && e.refs.length ? (CQ.refs[e.refs[0]] || {}).short || 'Source' : 'Teaching model');
    return '<button type="button" class="evc" data-ev="' + esc(key) + '" aria-expanded="false" aria-label="' + esc('Evidence, ' + e.tag.toLowerCase() + ': ' + nm) + '">' + esc(nm) + '</button>';
  };
  /* tag plus chip, the usual pair after a number */
  CQ.tag = function (key, label) { var e = CQ.evidence[key]; return e ? CQ.badge(e.tag) + ' ' + CQ.ev(key, label) : ''; };
  var pop = null, popBtn = null;
  function closePop() { if (pop && pop.parentNode) pop.parentNode.removeChild(pop); if (popBtn) popBtn.setAttribute('aria-expanded', 'false'); pop = null; popBtn = null; }
  function openPop(btn) {
    var key = btn.getAttribute('data-ev'), e = CQ.evidence[key]; if (!e) return;
    if (popBtn === btn) { closePop(); return; }
    closePop();
    var refs = (e.refs || []).map(function (r) {
      var R = CQ.refs[r]; if (!R) return '';
      var m = /doi:\s*(\S+)$/.exec(R.text), doi = m ? m[1] : '';
      return '<p><span class="k">Source</span>' + esc(R.text.replace(/\s*doi:\s*\S+$/, '')) + (doi ? ' <a href="https://doi.org/' + esc(doi) + '" target="_blank" rel="noopener">doi: ' + esc(doi) + '</a>' : '') + '</p>';
    }).join('');
    pop = document.createElement('div'); pop.className = 'cq-pop'; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', 'Evidence');
    pop.innerHTML = '<button type="button" class="x" aria-label="Close">×</button><h5>' + CQ.badge(e.tag) + ' ' + esc(btn.textContent) + '</h5>' +
      '<p>' + esc(e.claim) + '</p>' + (e.value ? '<p><span class="k">Values</span>' + esc(e.value) + '</p>' : '') + refs +
      (e.note ? '<p><span class="k">Note</span>' + esc(e.note) + '</p>' : '');
    document.body.appendChild(pop);
    var r = btn.getBoundingClientRect(), pw = pop.offsetWidth, x = Math.max(8, Math.min(window.innerWidth - pw - 8, r.left + window.pageXOffset - 20));
    pop.style.left = x + 'px'; pop.style.top = (r.bottom + window.pageYOffset + 6) + 'px';
    popBtn = btn; btn.setAttribute('aria-expanded', 'true');
    pop.querySelector('.x').addEventListener('click', function () { var b = popBtn; closePop(); if (b) b.focus(); });
    pop.querySelector('.x').focus({ preventScroll: true });
  }
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest && ev.target.closest('.evc');
    if (b) { ev.preventDefault(); ev.stopPropagation(); openPop(b); return; }
    if (pop && !pop.contains(ev.target)) closePop();
  }, true);
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && pop) { var b = popBtn; closePop(); if (b) b.focus(); } });
  CQ.sources = function (host) {
    if (!host) return;
    var ids = Object.keys(used).filter(function (k) { return CQ.refs[k]; });
    ids.sort(function (a, b) { return CQ.refs[a].text.localeCompare(CQ.refs[b].text); });
    host.innerHTML = ids.map(function (k) { return '<li id="src-' + esc(k) + '">' + esc(CQ.refs[k].text) + '</li>'; }).join('');
  };

  /* ---------------------------------------------------------------- WebGL */
  CQ.glOK = function () {
    if (/[?&]ws=2d\b/.test(location.search)) return false;
    if (!window.THREE) return false;
    try { var c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); } catch (e) { return false; }
  };

  /* ---------------------------------------------------------------- 2D canvas helper */
  CQ.canvas = function (cv, h) {
    var w = cv.clientWidth || cv.parentNode.clientWidth || 300, dpr = Math.min(2, window.devicePixelRatio || 1);
    if (h) cv.style.height = h + 'px';
    var H = h || cv.clientHeight || 220;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(H * dpr); }
    var g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { g: g, w: w, h: H };
  };
  /* colours for 2D figures that follow the page theme */
  CQ.css = function (name, fb) { var v = getComputedStyle(document.documentElement).getPropertyValue(name); return (v && v.trim()) || fb; };

  /* ---------------------------------------------------------------- orbit controls */
  CQ.orbit = function (el, cam, o) {
    o = o || {};
    var T = window.THREE, target = (o.target || new T.Vector3()).clone();
    var home = { th: o.theta != null ? o.theta : 0.5, ph: o.phi != null ? o.phi : 1.2, d: o.dist || 10, t: target.clone() };
    var S = { th: home.th, ph: home.ph, d: home.d, t: home.t.clone() }, want = { th: S.th, ph: S.ph, d: S.d, t: S.t.clone() };
    var minD = o.minDist || 2, maxD = o.maxDist || 40, minP = o.minPhi || 0.15, maxP = o.maxPhi || Math.PI - 0.15;
    var ptrs = {}, last = null, pinch0 = 0, moving = false, inv = o.invalidate || function () {};
    function clampAll() { want.ph = Math.max(minP, Math.min(maxP, want.ph)); want.d = Math.max(minD, Math.min(maxD, want.d)); }
    function n() { var k = 0; for (var i in ptrs) k++; return k; }
    function mid() { var x = 0, y = 0, k = 0; for (var i in ptrs) { x += ptrs[i].x; y += ptrs[i].y; k++; } return { x: x / k, y: y / k }; }
    function spread() { var a = []; for (var i in ptrs) a.push(ptrs[i]); return a.length < 2 ? 0 : Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y); }
    var right = new T.Vector3(), up = new T.Vector3();
    function pan(dx, dy) {
      var h = el.clientHeight || 400, s = want.d * 0.9 / h;
      cam.updateMatrixWorld(); right.setFromMatrixColumn(cam.matrixWorld, 0); up.setFromMatrixColumn(cam.matrixWorld, 1);
      want.t.addScaledVector(right, -dx * s).addScaledVector(up, dy * s);
      if (o.panLimit) { want.t.x = Math.max(-o.panLimit, Math.min(o.panLimit, want.t.x)); want.t.y = Math.max(-o.panLimit, Math.min(o.panLimit, want.t.y)); want.t.z = Math.max(-o.panLimit, Math.min(o.panLimit, want.t.z)); }
    }
    el.addEventListener('pointerdown', function (e) {
      if (e.target.closest && e.target.closest('button,a,input,select,.w-panel')) return;
      ptrs[e.pointerId] = { x: e.clientX, y: e.clientY, b: e.button, sh: e.shiftKey };
      last = mid(); pinch0 = spread();
      try { el.setPointerCapture(e.pointerId); } catch (er) { /* old browsers */ }
    });
    el.addEventListener('pointermove', function (e) {
      if (!ptrs[e.pointerId]) return;
      ptrs[e.pointerId].x = e.clientX; ptrs[e.pointerId].y = e.clientY;
      var m = mid(), dx = m.x - last.x, dy = m.y - last.y; last = m;
      if (n() >= 2) { var sp = spread(); if (pinch0 > 0 && sp > 0) want.d *= pinch0 / sp; pinch0 = sp; pan(dx, dy); }
      else if (ptrs[e.pointerId].b === 2 || ptrs[e.pointerId].sh || e.shiftKey) pan(dx, dy);
      else { want.th -= dx * 0.008; want.ph -= dy * 0.008; }
      clampAll(); moving = true; inv();
    });
    function up1(e) { delete ptrs[e.pointerId]; last = n() ? mid() : null; pinch0 = spread(); }
    el.addEventListener('pointerup', up1); el.addEventListener('pointercancel', up1);
    el.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    el.addEventListener('wheel', function (e) {
      if (!e.ctrlKey && !e.metaKey) return; /* plain wheel scrolls the page; ctrl wheel and trackpad pinch zoom */
      e.preventDefault(); want.d *= Math.exp(e.deltaY * 0.004); clampAll(); moving = true; inv();
    }, { passive: false });
    el.addEventListener('keydown', function (e) {
      if (e.target !== el) return;
      var k = e.key, hit = true;
      if (k === 'ArrowLeft') want.th += 0.12; else if (k === 'ArrowRight') want.th -= 0.12;
      else if (k === 'ArrowUp') want.ph -= 0.1; else if (k === 'ArrowDown') want.ph += 0.1;
      else if (k === '+' || k === '=') want.d *= 0.88; else if (k === '-' || k === '_') want.d *= 1.14; else hit = false;
      if (hit) { e.preventDefault(); clampAll(); moving = true; inv(); }
    });
    var V = new T.Vector3();
    function apply() {
      var k = 0.25, done = true;
      ['th', 'ph', 'd'].forEach(function (p) { var d = want[p] - S[p]; if (Math.abs(d) > 1e-4) { S[p] += d * k; done = false; } else S[p] = want[p]; });
      if (S.t.distanceToSquared(want.t) > 1e-8) { S.t.lerp(want.t, k); done = false; } else S.t.copy(want.t);
      V.set(Math.sin(S.ph) * Math.sin(S.th), Math.cos(S.ph), Math.sin(S.ph) * Math.cos(S.th)).multiplyScalar(S.d).add(S.t);
      cam.position.copy(V); cam.lookAt(S.t);
      moving = !done;
      return !done;
    }
    return {
      apply: apply, moving: function () { return moving || n() > 0; },
      reset: function () { want.th = home.th; want.ph = home.ph; want.d = home.d; want.t.copy(home.t); moving = true; inv(); },
      zoom: function (f) { want.d *= f; clampAll(); moving = true; inv(); },
      setHome: function (h) { if (h.dist) home.d = h.dist; if (h.theta != null) home.th = h.theta; if (h.phi != null) home.ph = h.phi; if (h.target) home.t.copy(h.target); },
      jump: function () { S.th = want.th; S.ph = want.ph; S.d = want.d; S.t.copy(want.t); }
    };
  };

  /* ---------------------------------------------------------------- three.js helpers: merged glyphs with vertex colours */
  function merge(T, parts) {
    var pos = [], nor = [], col = [], v = new T.Vector3();
    parts.forEach(function (p) {
      var g = p.g.index ? p.g.toNonIndexed() : p.g, pa = g.attributes.position, na = g.attributes.normal, nm = new T.Matrix3().getNormalMatrix(p.m);
      for (var i = 0; i < pa.count; i++) {
        v.fromBufferAttribute(pa, i).applyMatrix4(p.m); pos.push(v.x, v.y, v.z);
        v.fromBufferAttribute(na, i).applyMatrix3(nm).normalize(); nor.push(v.x, v.y, v.z);
        col.push(p.c.r, p.c.g, p.c.b);
      }
    });
    var o = new T.BufferGeometry();
    o.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); o.setAttribute('normal', new T.Float32BufferAttribute(nor, 3)); o.setAttribute('color', new T.Float32BufferAttribute(col, 3));
    return o;
  }
  CQ.mergeGeo = merge;
  CQ.waterGeo = function (T, r) {
    var O = new T.Color(WPMolColor.atom('h2o', 'O', true)), H = new T.Color(WPMolColor.atom('h2o', 'H', true));
    var so = new T.SphereGeometry(r, 12, 8), sh = new T.SphereGeometry(r * 0.62, 10, 6), a = 104.5 / 2 * Math.PI / 180, d = r * 1.05;
    return merge(T, [{ g: so, m: new T.Matrix4(), c: O },
      { g: sh, m: new T.Matrix4().makeTranslation(Math.sin(a) * d, -Math.cos(a) * d, 0), c: H },
      { g: sh, m: new T.Matrix4().makeTranslation(-Math.sin(a) * d, -Math.cos(a) * d, 0), c: H }]);
  };


  /* ---------------------------------------------------------------- page chrome */
  var PAGES = [
    { id: 'home', href: 'index.html', n: '', name: 'All curious things' },
    { id: 'resurrection', href: 'resurrection.html', n: 'I', name: 'Back from the dead' },
    { id: 'aerenchyma', href: 'aerenchyma.html', n: 'II', name: 'Breathing underwater' }
  ];
  CQ.pages = PAGES;
  function chrome() {
    var page = document.body.getAttribute('data-page') || 'home';
    var head = document.getElementById('cq-head'); if (!head) return;
    head.innerHTML =
      '<div class="cq-head"><div><p class="cq-kicker">A plant physiology learning tool · The Water Path</p>' +
      '<p class="cq-title"><a href="index.html">Curious things</a></p>' +
      '<p class="cq-sub">Plants that seem to break the rules, and the physiology that explains them.</p></div>' +
      '<div class="cq-prefs" role="group" aria-label="Display preferences">' +
      '<button type="button" class="cq-btn" id="cq-theme" aria-pressed="false"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5a6.5 6.5 0 1 0 0 13a6.5 6.5 0 0 0 0-13Zm0 1.5v10a5 5 0 0 1 0-10Z" fill="currentColor"/></svg>Night theme</button>' +
      '<button type="button" class="cq-btn" id="cq-motion" aria-pressed="false"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 8h3l2-5 2 10 2-5h3" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>Reduce motion</button>' +
      '<a class="cq-btn" href="../index.html#/map">Water Path map</a></div></div>' +
      '<nav class="cq-nav" aria-label="Curious things"><div class="cq-tabs">' +
      PAGES.map(function (p) { return '<a href="' + p.href + '"' + (p.id === page ? ' aria-current="page"' : '') + '>' + (p.n ? '<b>' + p.n + '</b>' : '') + esc(p.name) + '</a>'; }).join('') +
      '</div><div class="cq-tier" role="radiogroup" aria-label="Depth"><span aria-hidden="true">Depth</span>' +
      '<button type="button" role="radio" data-tier="1" title="Plain words only"><b>1</b> Explore</button>' +
      '<button type="button" role="radio" data-tier="2" title="Core ideas"><b>2</b> Explain</button>' +
      '<button type="button" role="radio" data-tier="3" title="Every detail and source"><b>3</b> Expert</button></div></nav>';
    var w = document.getElementById('cq'); if (w) w.setAttribute('data-tier', String(tier));
    document.getElementById('cq-theme').addEventListener('click', function () { setTheme(CQ.isDark() ? 'light' : 'dark'); });
    document.getElementById('cq-motion').addEventListener('click', function () { setMotion(!CQ.reducedMotion()); });
    var tg = head.querySelector('.cq-tier');
    tg.addEventListener('click', function (e) { var b = e.target.closest('[data-tier]'); if (b) setTier(+b.getAttribute('data-tier')); });
    tg.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault(); var n2 = Math.max(1, Math.min(3, tier + (e.key === 'ArrowRight' ? 1 : -1))); setTier(n2); var b = tg.querySelector('[data-tier="' + n2 + '"]'); if (b) b.focus();
    });
    var f = document.getElementById('cq-foot');
    if (f) f.innerHTML = '<p>Curious things is part of The Water Path, a plant physiology learning tool. Every number carries a tag and a source; drawings are original teaching sketches, not micrographs. ' +
      '<a href="../index.html#/map">Water Path map</a><a href="../journey/index.html#field">The water journey</a><a href="../light/index.html#sun">Light to sugar</a><a href="../phloem/index.html#source">Sugar on the move</a></p>';
    syncButtons();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', chrome); else chrome();
  CQ.ready = function (fn) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); };
})();

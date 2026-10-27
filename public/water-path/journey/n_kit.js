/* The Water Path v8: n_kit.js (nutrient path, linked workstation kit)
   Loaded lazily by nutrient.js before the first nutrient module. Three.js r128 (vendor copy) only.

   One workstation = one control changes every pane: a 3D model, a linked 2D "scan" (a synthetic cross
   section or map, always a model rendering), a linked plot, the controls and a "What just happened" line.
   Desktop: 3D large on the left, scan and plot stacked on the right, controls and readout below.
   Phone (< 700 px): stacked; the 3D and the readout stay stuck at the top while the controls scroll under them.

   var ws = WS.create(host, {
     title, what, todo, why,            text or HTML for the five parts (the 3D pane is "the thing itself")
     thing, scanCaption, plotCaption,   pane captions (HTML)
     badge: 'ILLUSTRATIVE',             tag shown beside the title (see WS.badge)
     state: {...},                      initial shared state
     camera: {dist, theta, phi, target:[x,y,z], minDist, maxDist}, plot: {w, h}
   })
   ws.state                         the shared state object (read only; change it with ws.set)
   ws.set(patch)                    merge, then re-render every pane and call every subscriber
   ws.on(fn(state, ws)) -> off      subscribe (called on every set and on theme change)
   ws.paintScan(fn(ctx, w, h, state))   2D canvas painter for the scan pane (CSS pixel units)
   ws.paintPlot(fn(svg, state, ws))     SVG painter for the plot pane (use WS.axes)
   ws.fallback(fn(ctx, w, h, state))    static 2D drawing used in place of the 3D when WebGL is missing
   ws.onFrame(fn(t, dt, state))         animation step (seconds); runs only while playing, visible and active
   ws.onTheme(fn(dark))                 recolour 3D materials when the theme changes
   ws.gl                            null without WebGL, else {THREE, renderer, scene, camera, root, invalidate}
   ws.slice({key, axis, min, max, size:[a,b], label, step, fmt, control}) -> {mesh, set(v)}
                                    a draggable plane in 3D; its position is ws.state[key]; adds a range control
   ws.range({key, label, min, max, step, fmt, hint}) / ws.choice({key, label, options:[[v, text]]}) /
   ws.toggle({key, label})          controls bound to ws.state
   ws.say(html)                     the "What just happened" line (aria-live polite)
   ws.reset()  ws.pause(bool)  ws.step()  ws.kick()  ws.render()  ws.destroy()
   WS.badge(tag, title) -> HTML     tags MEASURED, DERIVED, SECONDARY, ILLUSTRATIVE, OPEN
   WS.token(name) -> '#rrggbb'      a CSS custom property of the current theme (name without --)
   WS.ramp([token names]) -> f(t)   colour ramp from tokens; f(t) 'rgb()', f.rgb(t) [r,g,b], f.css() gradient
   WS.axes(svg, {x:[a,b], y:[a,b], xlabel, ylabel, w, h, pad, xticks, yticks}) -> {x(v), y(v), g, path(pts, cls), vline(v, cls), text(...)}
   WS.card(host, {rn, name, title, lines, note}) -> element  a placeholder card for a plate */
(function () {
  'use strict';
  var WP = window.WP || (window.WP = {});
  var ui = WP.ui || {};
  if (window.WS && window.WS.create) return;
  var WS = window.WS = WP.WS = {};
  var SVGNS = 'http://www.w3.org/2000/svg';

  function esc(s) { return ui.esc ? ui.esc(s) : String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function isDark() { return ui.isDark ? ui.isDark() : !!(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches); }
  function reduced() { return ui.reducedMotion ? ui.reducedMotion() : !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); }
  function clamp(x, a, b) { return x < a ? a : (x > b ? b : x); }
  WS.isDark = isDark; WS.reduced = reduced; WS.esc = esc;

  /* ------------------------------------------------------------ colours from CSS tokens */
  WS.token = function (name) {
    var v = getComputedStyle(document.documentElement).getPropertyValue('--' + name).trim();
    return v || '#888888';
  };
  function parseColor(c) {
    c = String(c || '').trim();
    var m = /^#([0-9a-f]{3})$/i.exec(c);
    if (m) return [0, 1, 2].map(function (i) { return parseInt(m[1][i] + m[1][i], 16); });
    m = /^#([0-9a-f]{6})/i.exec(c);
    if (m) return [0, 2, 4].map(function (i) { return parseInt(m[1].substr(i, 2), 16); });
    m = /rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)/i.exec(c);
    if (m) return [+m[1], +m[2], +m[3]];
    return [136, 136, 136];
  }
  WS.parseColor = parseColor;
  WS.hex = function (rgb) { return '#' + rgb.map(function (v) { var s = Math.round(clamp(v, 0, 255)).toString(16); return s.length < 2 ? '0' + s : s; }).join(''); };
  var ramps = [];
  WS.ramp = function (names) {
    var stops = [];
    function refresh() { stops = names.map(function (n) { return parseColor(n.charAt(0) === '#' ? n : WS.token(n)); }); }
    function rgb(t) {
      t = clamp(+t || 0, 0, 1) * (stops.length - 1);
      var i = Math.min(stops.length - 2, Math.floor(t)), f = t - i;
      if (stops.length === 1) return stops[0].slice();
      return [0, 1, 2].map(function (k) { return stops[i][k] + (stops[i + 1][k] - stops[i][k]) * f; });
    }
    function f(t) { var c = rgb(t); return 'rgb(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ')'; }
    f.rgb = rgb; f.refresh = refresh;
    f.css = function (dir) { return 'linear-gradient(' + (dir || 'to right') + ',' + stops.map(function (s, i) { return WS.hex(s) + ' ' + Math.round(100 * i / Math.max(1, stops.length - 1)) + '%'; }).join(',') + ')'; };
    refresh(); ramps.push(f);
    return f;
  };
  function refreshRamps() { ramps.forEach(function (r) { r.refresh(); }); }

  /* ------------------------------------------------------------ evidence tags */
  var TAGS = {
    MEASURED: { cls: 'measured', info: 'A value measured on real plants and reported in the paper named.' },
    DERIVED: { cls: 'derived', info: 'Calculated from other values by a stated equation.' },
    SECONDARY: { cls: 'secondary', info: 'Taken from a review or textbook summary, not from the original measurement.' },
    ILLUSTRATIVE: { cls: 'illustrative', info: 'Invented to show a shape or a direction. Not data.' },
    OPEN: { cls: 'open', info: 'An open question: not yet measured or still disputed. Read it as a question, not a result.' }
  };
  WS.TAGS = TAGS;
  var OPEN_GLYPH = '<svg class="wsb-g" viewBox="0 0 14 14" aria-hidden="true"><circle cx="7" cy="7" r="5.6" fill="none" stroke="currentColor" stroke-width="1.4" stroke-dasharray="2.2 1.6"/><path d="M5.3 5.6a1.8 1.8 0 1 1 2.5 1.6c-.6.3-.8.6-.8 1.2" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><circle cx="7" cy="10.3" r=".8" fill="currentColor"/></svg>';
  WS.badge = function (tag, title) {
    var k = String(tag || 'ILLUSTRATIVE').toUpperCase(); if (!TAGS[k]) k = 'ILLUSTRATIVE';
    var t = (title ? title + ' ' : '') + TAGS[k].info;
    return '<span class="wsb wsb-' + TAGS[k].cls + '" title="' + esc(t) + '" role="img" aria-label="' + esc(k + ': ' + t) + '">' + (k === 'OPEN' ? OPEN_GLYPH : '') + esc(k) + '</span>';
  };

  /* ------------------------------------------------------------ SVG axes */
  function el(tag, attrs, parent) {
    var e = document.createElementNS(SVGNS, tag);
    for (var k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  WS.svg = el;
  function ticks(a, b, n) {
    var span = b - a, step = Math.pow(10, Math.floor(Math.log(span / n) / Math.LN10)), err = n / span * step;
    if (err <= 0.15) step *= 10; else if (err <= 0.35) step *= 5; else if (err <= 0.75) step *= 2;
    var out = [], v = Math.ceil(a / step) * step;
    for (; v <= b + step * 1e-6; v += step) out.push(Math.round(v / step) * step);
    return out;
  }
  function fmtTick(v) { var s = Math.abs(v) < 1e-9 ? '0' : String(+v.toPrecision(4)); return s.replace('-', '−'); }
  WS.axes = function (svg, o) {
    o = o || {};
    var W = o.w || 360, H = o.h || 210, P = o.pad || { l: 46, r: 12, t: 12, b: 38 };
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var x0 = P.l, x1 = W - P.r, y0 = H - P.b, y1 = P.t;
    var X = o.x || [0, 1], Y = o.y || [0, 1];
    function x(v) { return x0 + (v - X[0]) / (X[1] - X[0]) * (x1 - x0); }
    function y(v) { return y0 - (v - Y[0]) / (Y[1] - Y[0]) * (y0 - y1); }
    var ax = el('g', { 'class': 'ws-ax' }, svg);
    (o.yticks || ticks(Y[0], Y[1], 4)).forEach(function (v) {
      el('line', { x1: x0, x2: x1, y1: y(v), y2: y(v), 'class': 'ws-gridline' }, ax);
      el('text', { x: x0 - 6, y: y(v) + 4, 'text-anchor': 'end' }, ax).textContent = fmtTick(v);
    });
    (o.xticks || ticks(X[0], X[1], 5)).forEach(function (v) {
      el('line', { x1: x(v), x2: x(v), y1: y0, y2: y0 + 4, 'class': 'ws-tick' }, ax);
      el('text', { x: x(v), y: y0 + 16, 'text-anchor': 'middle' }, ax).textContent = fmtTick(v);
    });
    el('line', { x1: x0, x2: x1, y1: y0, y2: y0, 'class': 'ws-axl' }, ax);
    el('line', { x1: x0, x2: x0, y1: y0, y2: y1, 'class': 'ws-axl' }, ax);
    if (o.xlabel) el('text', { x: (x0 + x1) / 2, y: H - 4, 'text-anchor': 'middle', 'class': 'ws-axt' }, ax).textContent = o.xlabel;
    if (o.ylabel) el('text', { x: -(y0 + y1) / 2, y: 12, transform: 'rotate(-90)', 'text-anchor': 'middle', 'class': 'ws-axt' }, ax).textContent = o.ylabel;
    var g = el('g', { 'class': 'ws-marks' }, svg);
    return {
      x: x, y: y, g: g, box: { x0: x0, x1: x1, y0: y0, y1: y1 },
      path: function (pts, cls) { return el('path', { d: pts.map(function (p, i) { return (i ? 'L' : 'M') + x(p[0]).toFixed(1) + ' ' + y(p[1]).toFixed(1); }).join(''), 'class': cls || 'ws-line', fill: 'none' }, g); },
      vline: function (v, cls) { return el('line', { x1: x(v), x2: x(v), y1: y0, y2: y1, 'class': cls || 'ws-cursor' }, g); },
      dot: function (vx, vy, cls) { return el('circle', { cx: x(vx), cy: y(vy), r: 4, 'class': cls || 'ws-dot' }, g); },
      text: function (vx, vy, s, anchor, cls) { var t = el('text', { x: x(vx), y: y(vy), 'text-anchor': anchor || 'start', 'class': cls || 'ws-lab' }, g); t.textContent = s; return t; }
    };
  };

  /* ------------------------------------------------------------ WebGL availability */
  var glOK = null;
  WS.glOK = function () {
    if (/[?&]ws=2d\b/.test(location.search)) return false;     // testing switch: force the static fallback
    if (WP.macro && typeof WP.macro.ok === 'function') return WP.macro.ok();
    if (glOK !== null) return glOK;
    glOK = false;
    if (!window.THREE) return glOK;
    try { var c = document.createElement('canvas'); glOK = !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); } catch (e) { glOK = false; }
    return glOK;
  };

  /* ------------------------------------------------------------ placeholder card */
  WS.card = function (host, o) {
    var d = document.createElement('div');
    d.className = 'ws-card';
    d.innerHTML = '<p class="ws-card-k">' + esc('Nutrient path · Plate ' + o.rn + ', ' + o.name) + ' ' + WS.badge('ILLUSTRATIVE', 'Placeholder text, no data yet.') + '</p>' +
      '<h3 class="ws-card-t">' + esc(o.title) + '</h3>' +
      '<p class="ws-card-ph"><b>Placeholder.</b> This plate does not have its nutrient scene yet. This is what will appear here:</p>' +
      '<ul>' + (o.lines || []).map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') + '</ul>' +
      '<p class="ws-card-now" aria-live="off"></p>' +
      (o.note ? '<p class="ws-card-note">' + esc(o.note) + '</p>' : '') +
      '<p class="ws-card-back">To see the water plate again, switch <b>Follow</b> back to <b>Water</b> in the bar above.</p>';
    host.appendChild(d);
    d.setSolute = function (name) { d.querySelector('.ws-card-now').innerHTML = 'You are following <b>' + esc(name) + '</b>. Change it under Conditions.'; };
    return d;
  };

  /* ------------------------------------------------------------ the workstation */
  var seq = 0;
  WS.all = [];      // live workstations (for debugging and tests)
  WS.create = function (host, o) {
    o = o || {};
    var id = 'ws' + (++seq);
    var root = document.createElement('section');
    root.className = 'ws'; root.id = id;
    root.setAttribute('aria-labelledby', id + '-t');
    root.innerHTML =
      '<header class="ws-hd">' +
        '<h3 class="ws-title" id="' + id + '-t">' + esc(o.title || 'Workstation') + (o.badge ? ' ' + WS.badge(o.badge) : '') + '</h3>' +
        '<p class="ws-what" data-ws-part="what"><b>What this is.</b> ' + (o.what || '') + '</p>' +
        '<p class="ws-todo" data-ws-part="todo"><b>What to do.</b> ' + (o.todo || '') + '</p>' +
      '</header>' +
      '<div class="ws-grid">' +
        '<div class="ws-stick">' +
          '<figure class="ws-pane ws-3d" data-ws-part="thing">' +
            '<div class="ws-gl" tabindex="0" role="application" aria-roledescription="3D model" aria-describedby="' + id + '-keys" aria-label="' + esc((o.title || 'Model') + ', 3D view') + '"></div>' +
            '<p class="vh" id="' + id + '-keys">Arrow keys turn the model. Shift and arrow keys move it. Plus and minus zoom. Page up and page down move the cut. Zero resets the view.</p>' +
            '<div class="ws-tools">' +
              '<button type="button" class="ws-btn ws-reset" title="Put the camera back where it started">Reset view</button>' +
              '<button type="button" class="ws-btn ws-pause" aria-pressed="false">Pause</button>' +
              '<button type="button" class="ws-btn ws-step" hidden title="Move the animation one step">Step</button>' +
              '<span class="ws-hint">Drag to turn · scroll or pinch to zoom · right drag or two fingers to move</span>' +
            '</div>' +
            '<figcaption><b>The thing itself.</b> ' + (o.thing || '') + '</figcaption>' +
          '</figure>' +
          '<div class="ws-pane ws-live" data-ws-part="happened"><p class="ws-k">What just happened</p><p class="ws-live-t" aria-live="polite"></p></div>' +
        '</div>' +
        '<div class="ws-pane ws-ctl" role="group" aria-label="Controls"><p class="ws-k">Controls</p><div class="ws-ctl-b"></div></div>' +
        '<figure class="ws-pane ws-scan"><div class="ws-scan-c"><canvas role="img" aria-label="' + esc('Linked scan: ' + String(o.scanCaption || 'a model cross section').replace(/<[^>]+>/g, '')) + '"></canvas></div><figcaption>' + (o.scanCaption || '') + '</figcaption></figure>' +
        '<figure class="ws-pane ws-plot"><svg role="img" aria-label="' + esc('Linked plot: ' + String(o.plotCaption || '').replace(/<[^>]+>/g, '')) + '"></svg><figcaption>' + (o.plotCaption || '') + '</figcaption></figure>' +
      '</div>' +
      '<details class="ws-why" data-ws-part="why"><summary>Why does this happen?</summary><div class="ws-why-b">' + (o.why || '') + '</div></details>';
    host.appendChild(root);

    var q = function (s) { return root.querySelector(s); };
    var glHost = q('.ws-gl'), ctlB = q('.ws-ctl-b'), liveT = q('.ws-live-t');
    var scanC = q('.ws-scan canvas'), scanCtx = scanC.getContext('2d'), plotSvg = q('.ws-plot svg');
    var subs = [], frames = [], themes = [], scanP = null, plotP = null, fallP = null, binds = [], offs = [];
    var state = {}, k;
    for (k in (o.state || {})) state[k] = o.state[k];
    var playing = !reduced(), dead = false;
    var visible = true, raf = 0, need = true, tClock = 0, tPrev = 0;

    var ws = { id: id, el: root, state: state, gl: null, controls: ctlB };
    WS.all.push(ws);
    ws.invalidate = function () { need = true; ws.kick(); };
    ws.kick = function () { if (!raf && !dead && active()) raf = requestAnimationFrame(tick); };

    /* ---- state */
    ws.set = function (patch) {
      if (dead) return;
      for (var key in (patch || {})) state[key] = patch[key];
      ws.render();
    };
    ws.on = function (fn) { subs.push(fn); return function () { var i = subs.indexOf(fn); if (i >= 0) subs.splice(i, 1); }; };
    ws.paintScan = function (fn) { scanP = fn; ws.render(); };
    ws.paintPlot = function (fn) { plotP = fn; ws.render(); };
    ws.fallback = function (fn) { fallP = fn; ws.render(); };
    ws.onFrame = function (fn) { frames.push(fn); syncPlay(); ws.kick(); };
    ws.onTheme = function (fn) { themes.push(fn); try { fn(isDark()); } catch (e) { console.error(e); } };

    var sayT = 0, sayV = null;
    ws.say = function (html) {
      sayV = html;
      if (sayT) return;
      sayT = setTimeout(function () { sayT = 0; if (!dead && liveT.innerHTML !== sayV) liveT.innerHTML = sayV; }, 120);
    };

    /* ---- sizes */
    var scanW = 0, scanH = 0, fallCanvas = null, fallCtx = null;
    function sizeScan() {
      var r = scanC.parentNode.getBoundingClientRect();
      var w = Math.max(10, Math.round(r.width)), h = Math.max(10, Math.round(r.height));
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      if (w !== scanW || h !== scanH) {
        scanW = w; scanH = h;
        scanC.width = Math.round(w * dpr); scanC.height = Math.round(h * dpr);
        scanC.style.width = w + 'px'; scanC.style.height = h + 'px';
        scanCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        return true;
      }
      return false;
    }
    function glSize() {
      var r = glHost.getBoundingClientRect();
      return { w: Math.max(10, Math.round(r.width)), h: Math.max(10, Math.round(r.height)) };
    }

    /* ---- render every pane */
    ws.render = function () {
      if (dead) return;
      sizeScan();
      if (scanP) { scanCtx.clearRect(0, 0, scanW, scanH); try { scanP(scanCtx, scanW, scanH, state); } catch (e) { console.error(e); } }
      if (plotP) { try { plotP(plotSvg, state, ws); } catch (e) { console.error(e); } }
      subs.slice().forEach(function (fn) { try { fn(state, ws); } catch (e) { console.error(e); } });
      binds.forEach(function (b) { b(); });
      if (!ws.gl && fallP && fallCtx) {
        var s = glSize(), dpr = Math.min(2, window.devicePixelRatio || 1);
        if (fallCanvas.width !== Math.round(s.w * dpr) || fallCanvas.height !== Math.round(s.h * dpr)) { fallCanvas.width = Math.round(s.w * dpr); fallCanvas.height = Math.round(s.h * dpr); }
        fallCanvas.style.width = s.w + 'px'; fallCanvas.style.height = s.h + 'px';
        fallCtx.setTransform(dpr, 0, 0, dpr, 0, 0); fallCtx.clearRect(0, 0, s.w, s.h);
        try { fallP(fallCtx, s.w, s.h, state); } catch (e) { console.error(e); }
      }
      ws.invalidate();
    };

    /* ---- 3D, or the static fallback */
    var T = window.THREE, renderer = null, scene, camera, gRoot, orbit = null, sliceObjs = [];
    if (WS.glOK()) {
      try {
        renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power', preserveDrawingBuffer: false });
      } catch (e) { renderer = null; }
    }
    if (renderer) {
      renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
      renderer.setClearColor(0x000000, 0);
      glHost.appendChild(renderer.domElement);
      renderer.domElement.className = 'ws-glc';
      scene = new T.Scene();
      camera = new T.PerspectiveCamera(40, 1.5, 0.05, 200);
      gRoot = new T.Group(); scene.add(gRoot);
      var hemi = new T.HemisphereLight(0xffffff, 0x8a7a62, 0.75); scene.add(hemi);
      var key = new T.DirectionalLight(0xffffff, 0.75); key.position.set(3, 5, 4); scene.add(key);
      ws.gl = { THREE: T, renderer: renderer, scene: scene, camera: camera, root: gRoot, invalidate: function () { ws.invalidate(); } };
      orbit = makeOrbit();
    } else {
      root.classList.add('ws-nogl');
      fallCanvas = document.createElement('canvas'); fallCanvas.className = 'ws-glc';
      fallCanvas.setAttribute('role', 'img'); fallCanvas.setAttribute('aria-label', 'A flat drawing of the model');
      glHost.appendChild(fallCanvas); fallCtx = fallCanvas.getContext('2d');
      glHost.setAttribute('role', 'group'); glHost.removeAttribute('aria-roledescription');
      var nm = document.createElement('p'); nm.className = 'ws-nogl-n';
      nm.textContent = 'This browser cannot draw 3D, so a flat drawing of the same model is shown. Every control still works.';
      glHost.appendChild(nm);
      q('.ws-hint').textContent = 'Flat drawing: use the controls';
      q('.ws-reset').hidden = true;
    }

    /* ---- orbit: mouse, touch and keyboard */
    function makeOrbit() {
      var c = o.camera || {};
      var home = { dist: c.dist || 6, theta: c.theta != null ? c.theta : 0.7, phi: c.phi != null ? c.phi : 1.15, target: c.target || [0, 0, 0] };
      var S = { dist: home.dist, theta: home.theta, phi: home.phi, target: new T.Vector3().fromArray(home.target) };
      var minD = c.minDist || home.dist * 0.35, maxD = c.maxDist || home.dist * 2.6;
      function apply() {
        S.phi = clamp(S.phi, 0.08, Math.PI - 0.08); S.dist = clamp(S.dist, minD, maxD);
        var sp = Math.sin(S.phi);
        camera.position.set(S.target.x + S.dist * sp * Math.sin(S.theta), S.target.y + S.dist * Math.cos(S.phi), S.target.z + S.dist * sp * Math.cos(S.theta));
        camera.lookAt(S.target);
        ws.invalidate();
      }
      function pan(dx, dy) {
        var s = S.dist * 0.0018;
        var right = new T.Vector3(), up = new T.Vector3();
        camera.updateMatrixWorld();
        right.setFromMatrixColumn(camera.matrixWorld, 0); up.setFromMatrixColumn(camera.matrixWorld, 1);
        S.target.addScaledVector(right, -dx * s).addScaledVector(up, dy * s);
        var lim = home.dist; S.target.clampLength(0, lim);
        apply();
      }
      var surf = renderer.domElement, ptrs = {}, mode = null, last = null, pinch0 = 0, mid0 = null, slicing = null;
      surf.style.touchAction = 'none';
      function pt(e) { var r = surf.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height }; }
      function count() { return Object.keys(ptrs).length; }
      function mid() { var a = [], kk; for (kk in ptrs) a.push(ptrs[kk]); return { x: (a[0].x + a[1].x) / 2, y: (a[0].y + a[1].y) / 2, d: Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) }; }
      surf.addEventListener('pointerdown', function (e) {
        var p = pt(e);
        ptrs[e.pointerId] = p;
        try { surf.setPointerCapture(e.pointerId); } catch (x) { /* old browser */ }
        if (count() === 1) {
          slicing = null;
          for (var i = 0; i < sliceObjs.length && !slicing; i++) if (sliceObjs[i].hit(p)) slicing = sliceObjs[i];
          if (slicing) { mode = 'slice'; slicing.start(p); root.classList.add('ws-dragging'); }
          else mode = (e.button === 2 || e.shiftKey || e.ctrlKey || e.metaKey) ? 'pan' : 'rot';
          last = p;
        } else if (count() === 2) {
          if (slicing) { slicing.end(); slicing = null; }
          mode = 'pinch'; var m = mid(); pinch0 = m.d; mid0 = m;
        }
        glHost.focus({ preventScroll: true });
        e.preventDefault();
      });
      surf.addEventListener('pointermove', function (e) {
        var p = pt(e);
        if (!ptrs[e.pointerId]) {
          var over = false; for (var i = 0; i < sliceObjs.length; i++) if (sliceObjs[i].hit(p)) over = true;
          surf.style.cursor = over ? 'ns-resize' : 'grab';
          return;
        }
        ptrs[e.pointerId] = p;
        if (mode === 'slice' && slicing) { slicing.move(p); return; }
        if (mode === 'pinch' && count() === 2) {
          var m = mid();
          if (pinch0 > 0 && m.d > 0) { S.dist *= pinch0 / m.d; pinch0 = m.d; }
          pan(m.x - mid0.x, m.y - mid0.y); mid0 = m; return;
        }
        if (!last) return;
        var dx = p.x - last.x, dy = p.y - last.y; last = p;
        if (mode === 'pan') pan(dx, dy);
        else if (mode === 'rot') { S.theta -= dx * 0.0085; S.phi -= dy * 0.0085; apply(); }
      });
      function up(e) {
        delete ptrs[e.pointerId];
        if (mode === 'slice' && slicing) { slicing.end(); slicing = null; root.classList.remove('ws-dragging'); }
        if (count() === 0) { mode = null; last = null; }
        else if (count() === 1) { var kk; for (kk in ptrs) last = ptrs[kk]; mode = 'rot'; }
      }
      surf.addEventListener('pointerup', up); surf.addEventListener('pointercancel', up);
      surf.addEventListener('contextmenu', function (e) { e.preventDefault(); });
      surf.addEventListener('wheel', function (e) {
        e.preventDefault();
        S.dist *= Math.exp(clamp(e.deltaY, -120, 120) * 0.0016); apply();
      }, { passive: false });
      glHost.addEventListener('keydown', function (e) {
        var used = true, st = 0.12;
        if (e.key === 'ArrowLeft') { if (e.shiftKey) pan(30, 0); else { S.theta += st; apply(); } }
        else if (e.key === 'ArrowRight') { if (e.shiftKey) pan(-30, 0); else { S.theta -= st; apply(); } }
        else if (e.key === 'ArrowUp') { if (e.shiftKey) pan(0, 30); else { S.phi -= st; apply(); } }
        else if (e.key === 'ArrowDown') { if (e.shiftKey) pan(0, -30); else { S.phi += st; apply(); } }
        else if (e.key === '+' || e.key === '=') { S.dist *= 0.88; apply(); }
        else if (e.key === '-' || e.key === '_') { S.dist /= 0.88; apply(); }
        else if (e.key === '0' || e.key === 'Home') reset();
        else if ((e.key === 'PageUp' || e.key === 'PageDown') && sliceObjs.length) sliceObjs[0].nudge(e.key === 'PageUp' ? 1 : -1);
        else used = false;
        if (used) e.preventDefault();
      });
      function reset() { S.dist = home.dist; S.theta = home.theta; S.phi = home.phi; S.target.fromArray(home.target); apply(); }
      apply();
      return { S: S, apply: apply, reset: reset };
    }

    /* ---- the slice plane */
    ws.slice = function (so) {
      so = so || {};
      var key = so.key || 'slice', axis = so.axis || 'y', mn = so.min != null ? so.min : -1, mx = so.max != null ? so.max : 1;
      if (state[key] == null) state[key] = (mn + mx) / 2;
      var api = { key: key };
      if (so.control !== false) ws.range({ key: key, label: so.label || 'Cut position', min: mn, max: mx, step: so.step || (mx - mn) / 200, fmt: so.fmt, hint: so.hint });
      if (!ws.gl) { api.set = function (v) { var p = {}; p[key] = clamp(v, mn, mx); ws.set(p); }; return api; }
      var sz = so.size || [3, 3];
      var g = new T.Group();
      var mat = new T.MeshBasicMaterial({ color: 0x2b5fa4, transparent: true, opacity: 0.18, side: T.DoubleSide, depthWrite: false });
      var plane = new T.Mesh(new T.PlaneGeometry(sz[0], sz[1]), mat);
      var edge = new T.LineSegments(new T.EdgesGeometry(plane.geometry), new T.LineBasicMaterial({ color: 0x2b5fa4 }));
      var handle = new T.Mesh(new T.SphereGeometry(Math.min(sz[0], sz[1]) * 0.06, 20, 14), new T.MeshStandardMaterial({ color: 0x2b5fa4, roughness: 0.4 }));
      handle.position.set(sz[0] / 2, sz[1] / 2, 0);
      g.add(plane); g.add(edge); g.add(handle);
      if (axis === 'y') g.rotation.x = -Math.PI / 2; else if (axis === 'x') g.rotation.y = Math.PI / 2;
      gRoot.add(g);
      var A = new T.Vector3(axis === 'x' ? 1 : 0, axis === 'y' ? 1 : 0, axis === 'z' ? 1 : 0);
      var ray = new T.Raycaster(), ndc = new T.Vector2(), dragPlane = new T.Plane(), hitP = new T.Vector3(), v0 = 0, p0 = new T.Vector3();
      function cast(p) { ndc.set(p.x / p.w * 2 - 1, -(p.y / p.h) * 2 + 1); ray.setFromCamera(ndc, camera); }
      function place() { g.position.copy(A).multiplyScalar(state[key]); }
      function recolour() {
        var c = new T.Color(WS.token('accent'));
        mat.color.copy(c); edge.material.color.copy(c); handle.material.color.copy(c);
        mat.opacity = isDark() ? 0.24 : 0.18;
      }
      ws.onTheme(recolour);
      ws.on(place); place();
      var obj = {
        hit: function (p) { cast(p); return ray.intersectObjects([plane, handle], false).length > 0; },
        start: function (p) {
          cast(p);
          var h = ray.intersectObjects([plane, handle], false)[0]; p0.copy(h ? h.point : g.position);
          var view = new T.Vector3(); camera.getWorldDirection(view);
          var n = view.clone().sub(A.clone().multiplyScalar(view.dot(A)));
          if (n.lengthSq() < 1e-6) n.set(A.y, A.z, A.x); n.normalize();
          dragPlane.setFromNormalAndCoplanarPoint(n, p0); v0 = state[key];
        },
        move: function (p) {
          cast(p);
          if (!ray.ray.intersectPlane(dragPlane, hitP)) return;
          var v = clamp(v0 + hitP.clone().sub(p0).dot(A), mn, mx);
          var patch = {}; patch[key] = v; ws.set(patch);
        },
        end: function () { if (so.onEnd) so.onEnd(state[key]); },
        nudge: function (d) { var patch = {}; patch[key] = clamp(state[key] + d * (mx - mn) / 40, mn, mx); ws.set(patch); }
      };
      sliceObjs.push(obj);
      api.mesh = g; api.set = function (v) { var patch = {}; patch[key] = clamp(v, mn, mx); ws.set(patch); };
      return api;
    };

    /* ---- controls bound to state */
    var cseq = 0;
    ws.range = function (c) {
      var cid = id + '-c' + (++cseq);
      var d = document.createElement('div'); d.className = 'ws-c ws-range';
      d.innerHTML = '<label for="' + cid + '">' + esc(c.label) + ' <output for="' + cid + '"></output></label>' +
        '<input type="range" id="' + cid + '" min="' + c.min + '" max="' + c.max + '" step="' + (c.step || 'any') + '">' + (c.hint ? '<span class="ws-c-h">' + esc(c.hint) + '</span>' : '');
      ctlB.appendChild(d);
      var inp = d.querySelector('input'), out = d.querySelector('output');
      if (state[c.key] == null) state[c.key] = (c.min + c.max) / 2;
      inp.addEventListener('input', function () { var p = {}; p[c.key] = +inp.value; ws.set(p); });
      binds.push(function () {
        if (document.activeElement !== inp && +inp.value !== +state[c.key]) inp.value = state[c.key];
        var t = c.fmt ? c.fmt(state[c.key]) : String(+(+state[c.key]).toFixed(2));
        out.textContent = t; inp.setAttribute('aria-valuetext', t);
      });
      inp.value = state[c.key];
      return inp;
    };
    ws.choice = function (c) {
      var d = document.createElement('div'); d.className = 'ws-c ws-choice';
      var lid = id + '-c' + (++cseq);
      d.innerHTML = '<span class="ws-c-l" id="' + lid + '">' + esc(c.label) + '</span><div class="ws-seg" role="radiogroup" aria-labelledby="' + lid + '">' +
        c.options.map(function (op) { return '<button type="button" role="radio" data-v="' + esc(op[0]) + '" aria-checked="false">' + esc(op[1]) + '</button>'; }).join('') + '</div>';
      ctlB.appendChild(d);
      if (state[c.key] == null) state[c.key] = c.options[0][0];
      var seg = d.querySelector('.ws-seg'), bs = Array.prototype.slice.call(seg.querySelectorAll('button'));
      function pick(v) { var p = {}; p[c.key] = v; ws.set(p); }
      seg.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) pick(b.getAttribute('data-v')); });
      seg.addEventListener('keydown', function (e) {
        var i = bs.map(function (b) { return b.getAttribute('data-v'); }).indexOf(String(state[c.key])), j = -1;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % bs.length;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + bs.length) % bs.length;
        if (j < 0) return; e.preventDefault(); pick(bs[j].getAttribute('data-v')); bs[j].focus();
      });
      binds.push(function () { bs.forEach(function (b) { var on = b.getAttribute('data-v') === String(state[c.key]); b.setAttribute('aria-checked', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1; }); });
      return seg;
    };
    ws.toggle = function (c) {
      var d = document.createElement('div'); d.className = 'ws-c ws-toggle';
      d.innerHTML = '<button type="button" class="ws-btn" aria-pressed="false">' + esc(c.label) + '</button>';
      ctlB.appendChild(d);
      var b = d.querySelector('button');
      b.addEventListener('click', function () { var p = {}; p[c.key] = !state[c.key]; ws.set(p); });
      binds.push(function () { b.setAttribute('aria-pressed', state[c.key] ? 'true' : 'false'); });
      return b;
    };

    /* ---- play, pause, step: render only while visible and the plate is active */
    var pauseB = q('.ws-pause'), stepB = q('.ws-step');
    function active() {
      if (dead || !visible || document.hidden) return false;
      if (!root.offsetParent && getComputedStyle(root).position !== 'fixed') return false;
      var sec = root.closest('section.level');
      return !(sec && sec.hidden);
    }
    function syncPlay() {
      var has = frames.length > 0;
      pauseB.hidden = !has; stepB.hidden = !has || playing;
      pauseB.setAttribute('aria-pressed', playing ? 'false' : 'true');
      pauseB.textContent = playing ? 'Pause' : 'Play';
      pauseB.title = playing ? 'Stop the motion' : (reduced() ? 'Reduce motion is on: press to animate anyway, or use Step' : 'Start the motion');
    }
    ws.pause = function (on) { playing = on === undefined ? !playing : !on; tPrev = 0; syncPlay(); ws.kick(); return !playing; };
    ws.step = function () { runFrames(0.25); ws.invalidate(); };
    pauseB.addEventListener('click', function () { ws.pause(playing); });
    stepB.addEventListener('click', function () { ws.step(); });
    q('.ws-reset').addEventListener('click', function () { ws.reset(); });
    ws.reset = function () { if (orbit) orbit.reset(); };
    function runFrames(dt) {
      tClock += dt;
      frames.forEach(function (fn) { try { fn(tClock, dt, state); } catch (e) { console.error(e); } });
    }
    function tick(now) {
      raf = 0;
      if (!active()) { tPrev = 0; return; }
      var anim = playing && frames.length > 0;
      if (anim) {
        var dt = tPrev ? Math.min(0.1, (now - tPrev) / 1000) : 0; tPrev = now;
        runFrames(dt * (window.PlaySpeed ? window.PlaySpeed.get() : 1));
        need = true;
      } else tPrev = 0;
      if (need && renderer) {
        var s = glSize();
        var cur = renderer.getSize(new T.Vector2());
        if (Math.round(cur.x) !== s.w || Math.round(cur.y) !== s.h) { renderer.setSize(s.w, s.h, false); renderer.domElement.style.width = s.w + 'px'; renderer.domElement.style.height = s.h + 'px'; camera.aspect = s.w / s.h; camera.updateProjectionMatrix(); }
        renderer.render(scene, camera);
        need = false;
      }
      if (anim) raf = requestAnimationFrame(tick);
    }

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) { need = true; ws.kick(); } }, { threshold: 0.01 });
      io.observe(root); offs.push(function () { io.disconnect(); });
    }
    if ('ResizeObserver' in window) {
      var ro = new ResizeObserver(function () { stickTop(); if (sizeScan() || !ws.gl) ws.render(); else ws.invalidate(); });
      ro.observe(root); ro.observe(q('.ws-stick')); offs.push(function () { ro.disconnect(); });
    }
    function onVis() { if (!document.hidden) ws.invalidate(); }
    document.addEventListener('visibilitychange', onVis); offs.push(function () { document.removeEventListener('visibilitychange', onVis); });
    if (WP.on) offs.push(WP.on(function () { ws.invalidate(); }));
    if (ui.onPrefs) offs.push(ui.onPrefs(function () {
      refreshRamps();
      themes.forEach(function (fn) { try { fn(isDark()); } catch (e) { console.error(e); } });
      if (reduced() && playing) { playing = false; }
      syncPlay(); ws.render();
    }));
    /* sticky offset on phones: below the journey bar when that bar is sticky */
    function stickTop() {
      var bar = document.querySelector('.wp-bar'), top = 0;
      if (bar) { var cs = getComputedStyle(bar); if (cs.position === 'sticky' || cs.position === 'fixed') top = bar.offsetHeight; }
      root.style.setProperty('--ws-top', top + 'px');
      var stk = root.querySelector('.ws-stick'), sh = stk && getComputedStyle(stk).position === 'sticky' ? stk.offsetHeight : 0;
      root.style.setProperty('--ws-stick-h', sh + 'px');
    }
    stickTop(); window.addEventListener('resize', stickTop); offs.push(function () { window.removeEventListener('resize', stickTop); });

    ws.destroy = function () {
      if (dead) return;
      dead = true;
      var wi = WS.all.indexOf(ws); if (wi >= 0) WS.all.splice(wi, 1);
      if (raf) cancelAnimationFrame(raf); raf = 0;
      offs.forEach(function (f) { try { if (typeof f === 'function') f(); } catch (e) { /* gone */ } });
      if (renderer) {
        scene.traverse(function (ob) {
          if (ob.geometry) ob.geometry.dispose();
          if (ob.material) [].concat(ob.material).forEach(function (m) { if (m.map) m.map.dispose(); m.dispose(); });
        });
        renderer.dispose();
        try { renderer.forceContextLoss(); } catch (e) { /* already lost */ }
      }
      if (root.parentNode) root.parentNode.removeChild(root);
    };

    syncPlay();
    if (o.say) liveT.innerHTML = o.say;
    ws.render();
    return ws;
  };

  /* ------------------------------------------------------------ styles */
  var css = '\
.ws{--ws-gap:12px;--ws-h:min(50vh,460px);font-family:var(--ui);font-size:14px;line-height:1.45;color:var(--ink);margin:6px 0 18px}\
.ws .vh{position:absolute!important;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}\
.ws-hd{margin:0 0 8px}\
.ws-title{font-family:var(--disp);font-weight:400;font-size:22px;letter-spacing:.02em;margin:0 0 4px}\
.ws-hd p{margin:0 0 3px;max-width:62em}\
.ws-grid{display:grid;gap:var(--ws-gap);grid-template-columns:minmax(0,1.55fr) minmax(0,1fr);grid-template-areas:"g3d scan" "g3d plot" "ctl live";min-width:0}\
.ws-stick{display:contents}\
.ws-pane{margin:0;min-width:0;background:var(--wall);border:1px solid var(--rule2);border-radius:4px;padding:8px}\
.ws-3d{grid-area:g3d;display:flex;flex-direction:column;gap:6px}\
.ws-scan{grid-area:scan;display:flex;flex-direction:column;gap:4px}\
.ws-plot{grid-area:plot;display:flex;flex-direction:column;gap:4px}\
.ws-ctl{grid-area:ctl}.ws-live{grid-area:live}\
.ws-gl{position:relative;height:var(--ws-h);min-height:220px;border-radius:3px;background:radial-gradient(ellipse at 50% 40%,var(--card) 0,var(--card2) 100%);overflow:hidden;outline-offset:2px}\
.ws-gl:focus-visible{outline:3px solid var(--accent)}\
.ws-glc{display:block;width:100%;height:100%;cursor:grab}\
.ws-dragging .ws-glc{cursor:ns-resize}\
.ws-nogl .ws-glc{cursor:default}\
.ws-nogl-n{position:absolute;left:8px;bottom:6px;right:8px;margin:0;font-size:12px;color:var(--ink2);background:var(--wall);padding:3px 6px;border-radius:3px}\
.ws-3d{position:relative}\
.ws-ctl,.ws-scan,.ws-plot{scroll-margin-top:calc(var(--ws-top,0px) + var(--ws-stick-h,0px) + 8px)}\
.ws-scan-c{position:relative;height:calc((var(--ws-h) - 60px) / 2);min-height:150px}\
.ws-scan-c canvas{display:block}\
.ws-plot svg{display:block;width:100%;height:calc((var(--ws-h) - 60px) / 2);min-height:150px}\
.ws figcaption{font-size:12.5px;color:var(--ink2);margin:0}\
.ws figcaption b{color:var(--ink)}\
.ws-tools{display:flex;flex-wrap:wrap;align-items:center;gap:6px}\
.ws-hint{font-size:12px;color:var(--ink2);margin-left:auto}\
.ws-btn{font:500 13px var(--ui);min-height:44px;min-width:44px;padding:6px 12px;border:1px solid var(--rule);border-radius:3px;background:var(--card);color:var(--ink);cursor:pointer}\
.ws-btn[aria-pressed="true"]{background:var(--plaque);color:var(--plaque-ink)}\
.ws-btn:focus-visible,.ws-seg button:focus-visible,.ws-c input:focus-visible{outline:3px solid var(--accent);outline-offset:2px}\
.ws-k{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink2);margin:0 0 4px}\
.ws-live-t{margin:0;font-size:14.5px;min-height:3em}\
.ws-ctl-b{display:flex;flex-wrap:wrap;gap:8px 18px}\
.ws-c{flex:1 1 220px;min-width:0}\
.ws-c label,.ws-c-l{display:flex;justify-content:space-between;gap:8px;font-weight:600;font-size:13px}\
.ws-c output{font-family:var(--mono);font-weight:500}\
.ws-c input[type=range]{width:100%;min-height:44px;accent-color:var(--accent);margin:0}\
.ws-c-h{display:block;font-size:12px;color:var(--ink2)}\
.ws-seg{display:inline-flex;flex-wrap:wrap;border:1px solid var(--rule);border-radius:3px;margin-top:3px}\
.ws-seg button{font:500 13px var(--ui);min-height:44px;min-width:44px;padding:6px 10px;border:0;border-left:1px solid var(--rule);background:transparent;color:var(--ink);cursor:pointer}\
.ws-seg button:first-child{border-left:0}\
.ws-seg button[aria-checked="true"]{background:var(--plaque);color:var(--plaque-ink);font-weight:600}\
.ws-seg button[aria-checked="true"]::before{content:"\\2713\\00a0"}\
.ws-why{margin-top:10px;border-top:1px solid var(--rule2);padding-top:6px}\
.ws-why summary{cursor:pointer;font-weight:600;min-height:44px;display:flex;align-items:center}\
.ws-why-b{max-width:62em}\
.ws svg text{font-family:var(--ui)!important}\
.ws .ws-ax text{font-size:11px;fill:var(--ink2)!important}\
.ws .ws-ax .ws-axt{font-size:11.5px;fill:var(--ink)!important}\
.ws-ax .ws-gridline{stroke:var(--rule2);stroke-width:1}\
.ws-ax .ws-axl,.ws-ax .ws-tick{stroke:var(--ink2);stroke-width:1}\
.ws-line{stroke:var(--accent);stroke-width:2}\
.ws-cursor{stroke:var(--warm);stroke-width:2;stroke-dasharray:4 3}\
.ws-dot{fill:var(--warm)}\
.ws .ws-lab{font-size:11.5px;fill:var(--ink)!important}\
.wsb{display:inline-flex;align-items:center;gap:3px;font:600 11px var(--ui);letter-spacing:.08em;padding:1px 6px;border:1px solid currentColor;border-radius:2px;line-height:1.5;vertical-align:2px;white-space:nowrap;cursor:help}\
.wsb-measured{color:var(--b-ver)}.wsb-measured::before{content:"\\2713"}\
.wsb-derived{color:var(--b-der)}.wsb-derived::before{content:"="}\
.wsb-secondary{color:var(--ink2)}.wsb-secondary::before{content:"\\25d0"}\
.wsb-illustrative{color:var(--b-ill)}.wsb-illustrative::before{content:"\\25cb"}\
.wsb-open{--ws-open:#6b1f99;color:var(--ws-open);border:2px dashed var(--ws-open);background:rgba(107,31,153,.08);border-radius:10px;padding:0 7px 0 4px}\
.wsb-g{width:13px;height:13px}\
:root[data-theme="dark"] .wsb-open{--ws-open:#dcb3ff;background:rgba(220,179,255,.1)}\
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]) .wsb-open{--ws-open:#dcb3ff;background:rgba(220,179,255,.1)}}\
.ws-card{border:1px solid var(--rule2);background:var(--wall);border-radius:4px;padding:12px 14px;margin:6px 0 16px;font-family:var(--ui);font-size:15px;max-width:60em}\
.ws-card-k{margin:0;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--ink2)}\
.ws-card-t{font-family:var(--disp);font-weight:400;font-size:24px;margin:4px 0 6px}\
.ws-card-ph{margin:0 0 4px}.ws-card ul{margin:4px 0 8px;padding-left:20px}.ws-card li{margin:2px 0}\
.ws-card-now,.ws-card-note,.ws-card-back{margin:4px 0 0;font-size:14px;color:var(--ink2)}\
.ws-card-now b{color:var(--ink)}\
@media (max-width:699px){\
.ws{--ws-h:30vh}\
.ws-grid{display:flex;flex-direction:column;gap:10px}\
.ws-stick{display:flex;flex-direction:column;gap:6px;position:sticky;top:var(--ws-top,0);z-index:6;background:var(--paper);padding:4px 0 6px;box-shadow:0 6px 8px -8px rgba(0,0,0,.4)}\
.ws-3d{padding:6px;gap:4px}\
.ws-gl{min-height:180px}\
.ws-3d figcaption,.ws-hint{display:none}\
.ws-tools{justify-content:flex-end;gap:6px}\
.ws-tools .ws-btn{min-height:44px;padding:4px 10px}\
.ws-live{padding:6px 8px}\
.ws-live .ws-k{margin:0 0 1px;font-size:10.5px}\
.ws-live-t{min-height:2.9em;font-size:13.5px}\
.ws-scan-c,.ws-plot svg{height:220px}\
}\
@media print{.ws-stick{position:static}}';
  var st = document.createElement('style'); st.id = 'ws-kit-css'; st.textContent = css; document.head.appendChild(st);
})();

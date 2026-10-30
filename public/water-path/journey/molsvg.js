/* The Water Path v8: molsvg.js, the molecular template for the older SVG figures (unifier round 7, 12 Oct 2026).
   The canvas theatres (mol.js) draw water as a blue O with two light blue H (v19 identity colours), Ca2+ as a green ball, gas as a dark bubble,
   labels as small rounded tags. This file gives the SVG figures of the Field, Plant, Organ and Afternoon plates the
   same glyphs, so one molecule looks the same on every plate:
     WP.molsvg.ensure()                 injects one hidden <svg> of gradients and symbols (idempotent)
     WP.molsvg.use(kind, cls)           '<use href="#wpm-h2o" .../>' markup; kind 'h2o' | 'ca' | 'gas' | 'vap' | 'co2' | 'o2' (v19)
     WP.molsvg.place(el, x, y, rot, s)  moves a glyph (transform), rot in degrees, s = scale (1 = 9 px wide)
     WP.molsvg.tag(x, y, text, o)       a rounded label tag (rect + text) as markup; o {anchor:'start'|'middle'|'end', cls}
   Colours come from CSS custom properties that follow the page theme (museum plate by day, glow at night).
   Every speed is set by the calling plate from the model; this file invents no rate. */
(function () {
  'use strict';
  var WP = window.WP = window.WP || {};
  var NS = 'http://www.w3.org/2000/svg';
  var M = WP.molsvg = {};
  var CSS = '\
:root{--wpm-O:#d2392b;--wpm-Ohi:#f3a79f;--wpm-Olo:#7a1d15;--wpm-H:#ffffff;--wpm-Hlo:#b8afa2;--wpm-Hrim:rgba(40,30,20,.5);\
--wpm-Ca:#2f8a57;--wpm-Cahi:#bfe8cf;--wpm-Calo:#17492d;--wpm-gas:#3a3a3a;--wpm-gashi:#9a9a9a;--wpm-C:#4a4f57;\
--wpm-tagbg:rgba(250,246,236,.94);--wpm-tagink:#2a231c;--wpm-tagrule:rgba(138,122,98,.75)}\
:root[data-theme="dark"]{--wpm-O:#ff5a4a;--wpm-Ohi:#ffc2ba;--wpm-Olo:#8c2219;--wpm-H:#f4f4f4;--wpm-Hlo:#9aa3ad;--wpm-Hrim:rgba(0,0,0,0);\
--wpm-Ca:#7fe0a8;--wpm-Cahi:#e4fff0;--wpm-Calo:#2c6b48;--wpm-gas:#0b0f14;--wpm-gashi:#56606b;--wpm-C:#8d95a0;\
--wpm-tagbg:rgba(20,26,34,.88);--wpm-tagink:#ece6da;--wpm-tagrule:rgba(201,165,106,.6)}\
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--wpm-O:#ff5a4a;--wpm-Ohi:#ffc2ba;--wpm-Olo:#8c2219;--wpm-H:#f4f4f4;--wpm-Hlo:#9aa3ad;--wpm-Hrim:rgba(0,0,0,0);\
--wpm-Ca:#7fe0a8;--wpm-Cahi:#e4fff0;--wpm-Calo:#2c6b48;--wpm-gas:#0b0f14;--wpm-gashi:#56606b;--wpm-C:#8d95a0;\
--wpm-tagbg:rgba(20,26,34,.88);--wpm-tagink:#ece6da;--wpm-tagrule:rgba(201,165,106,.6)}}\
.wpm-defs{position:absolute;width:0;height:0;overflow:hidden;pointer-events:none}\
.wpm-tag rect{fill:var(--wpm-tagbg);stroke:var(--wpm-tagrule);stroke-width:.8}\
.wpm-tag text{fill:var(--wpm-tagink);font:500 11px "IBM Plex Sans",system-ui,sans-serif;dominant-baseline:central}\
:root[data-theme="dark"] .wpm-glow{filter:drop-shadow(0 0 2.5px rgba(128,223,255,.7))}\
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .wpm-glow{filter:drop-shadow(0 0 2.5px rgba(128,223,255,.7))}}\
:root[data-theme="dark"] .wpm-glow-ca{filter:drop-shadow(0 0 3px rgba(127,224,168,.85))}\
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .wpm-glow-ca{filter:drop-shadow(0 0 3px rgba(127,224,168,.85))}}';

  function grad(id, hi, mid, lo) {
    return '<radialGradient id="' + id + '" cx="38%" cy="34%" r="70%">' +
      '<stop offset="0" style="stop-color:var(' + hi + ')"/><stop offset=".4" style="stop-color:var(' + mid + ')"/>' +
      '<stop offset="1" style="stop-color:var(' + lo + ')"/></radialGradient>';
  }
  M.ensure = function () {
    if (document.getElementById('wpm-defs')) return;
    var st = document.createElement('style'); st.id = 'wpm-css'; st.textContent = CSS; document.head.appendChild(st);
    var s = document.createElementNS(NS, 'svg');
    s.setAttribute('id', 'wpm-defs'); s.setAttribute('class', 'wpm-defs'); s.setAttribute('aria-hidden', 'true'); s.setAttribute('focusable', 'false');
    // water: O r 2.6 at the origin, two H r 1.6 at 104.5 degrees, pointing up; about 9 px wide at scale 1
    var hx = 2.45 * Math.sin(0.912), hy = -2.45 * Math.cos(0.912);
    s.innerHTML = '<defs>' + grad('wpmO', '--wpm-Ohi', '--wpm-O', '--wpm-Olo') + grad('wpmH', '--wpm-H', '--wpm-H', '--wpm-Hlo') +
      grad('wpmCa', '--wpm-Cahi', '--wpm-Ca', '--wpm-Calo') + grad('wpmGas', '--wpm-gashi', '--wpm-gas', '--wpm-gas') + '</defs>' +
      /* v19 identity colours (molcolor.js, --mol-* on :root): atoms coloured by their molecule, water blue, CO2 grey,
         O2 crimson, with a faint rim for contrast; colours show the molecule, not the atom */
      '<symbol id="wpm-h2o" viewBox="-5 -5 10 10" overflow="visible">' +
      '<circle cx="' + (-hx).toFixed(2) + '" cy="' + hy.toFixed(2) + '" r="1.6" style="fill:var(--mol-h2o-h,#8fb8ee);stroke:var(--mol-rim,rgba(30,25,20,.45))" stroke-width=".4"/>' +
      '<circle cx="' + hx.toFixed(2) + '" cy="' + hy.toFixed(2) + '" r="1.6" style="fill:var(--mol-h2o-h,#8fb8ee);stroke:var(--mol-rim,rgba(30,25,20,.45))" stroke-width=".4"/>' +
      '<circle r="2.6" style="fill:var(--mol-h2o,#1d4aa5);stroke:var(--mol-rim,rgba(30,25,20,.45))" stroke-width=".4"/></symbol>' +
      '<symbol id="wpm-ca" viewBox="-5 -5 10 10" overflow="visible"><circle r="3" fill="url(#wpmCa)"/></symbol>' +
      '<symbol id="wpm-gas" viewBox="-5 -5 10 10" overflow="visible"><circle r="2.8" fill="url(#wpmGas)" opacity=".9"/></symbol>' +
      '<symbol id="wpm-co2" viewBox="-5 -5 10 10" overflow="visible"><circle cx="-3.5" r="2.05" style="fill:var(--mol-co2-o,#a7aaaf);stroke:var(--mol-rim,rgba(30,25,20,.45))" stroke-width=".4"/>' +
      '<circle cx="3.5" r="2.05" style="fill:var(--mol-co2-o,#a7aaaf);stroke:var(--mol-rim,rgba(30,25,20,.45))" stroke-width=".4"/><circle r="2.35" style="fill:var(--mol-co2-c,#4f5359);stroke:var(--mol-rim,rgba(30,25,20,.45))" stroke-width=".4"/></symbol>' +
      '<symbol id="wpm-o2" viewBox="-5 -5 10 10" overflow="visible"><circle cx="-1.75" r="2.2" style="fill:var(--mol-o2,#981b30);stroke:var(--mol-rim,rgba(30,25,20,.45))" stroke-width=".4"/>' +
      '<circle cx="1.75" r="2.2" style="fill:var(--mol-o2,#981b30);stroke:var(--mol-rim,rgba(30,25,20,.45))" stroke-width=".4"/></symbol>';
    (document.body || document.documentElement).appendChild(s);
  };
  var HREF = { h2o: '#wpm-h2o', vap: '#wpm-h2o', ca: '#wpm-ca', gas: '#wpm-gas', co2: '#wpm-co2', o2: '#wpm-o2' };
  M.use = function (kind, cls) {
    return '<use href="' + (HREF[kind] || HREF.h2o) + '" x="-5" y="-5" width="10" height="10" class="wpm ' +
      (kind === 'ca' ? 'wpm-glow-ca ' : (kind === 'gas' ? '' : 'wpm-glow ')) + (cls || '') + '"/>';
  };
  M.place = function (el, x, y, rot, s) {
    el.setAttribute('transform', 'translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ')' +
      (rot ? ' rotate(' + rot.toFixed(0) + ')' : '') + (s && s !== 1 ? ' scale(' + s.toFixed(2) + ')' : ''));
  };
  function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  M.tag = function (x, y, text, o) {
    o = o || {};
    var w = Math.round(String(text).replace(/<[^>]+>/g, '').length * 6.1 + 12), h = 18;
    var x0 = o.anchor === 'end' ? x - w : (o.anchor === 'middle' ? x - w / 2 : x);
    return '<g class="wpm-tag ' + (o.cls || '') + '"><rect x="' + x0.toFixed(1) + '" y="' + (y - h / 2).toFixed(1) + '" width="' + w + '" height="' + h + '" rx="9"/>' +
      '<text x="' + (x0 + w / 2).toFixed(1) + '" y="' + y.toFixed(1) + '" text-anchor="middle" style="font:500 11px \'IBM Plex Sans\',system-ui,sans-serif">' + (o.raw ? text : esc(text)) + '</text></g>';
  };
  /* M.flow(svg, layer, reduce): water molecules that follow drawn SVG paths. ctl.set([{el, v, gap, halo, kind}])
     el = a path element already in the svg, v = speed in viewBox units per second (from the model), gap = spacing,
     halo = an optional route colour (Okabe Ito, as in the routes theatre). One rAF per figure, only while on screen;
     reduce() true starts on a still frame; a still click on the figure freezes or plays (v19). */
  M.flow = function (svg, layer, reduce) {
    var ctl = { routes: [], raf: 0, t0: 0, vis: !('IntersectionObserver' in window) };
    /* v19: click the figure to freeze (freeze.js); reduced motion starts paused and a click plays */
    ctl.rm = !!(reduce && reduce()); ctl.paused = ctl.rm;
    if (window.WPFreeze) WPFreeze.attach(svg, { paused: function () { return ctl.paused; }, set: function (p) { ctl.paused = !!p; if (!p) run(); } });
    var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) { ctl.vis = es[0].isIntersecting; run(); }) : null;
    if (io) io.observe(svg);
    function at(R, o) {
      var S = R.S, f = Math.max(0, Math.min(1, o / R.len)) * (S.length - 1), k = Math.floor(f), t = f - k, a = S[k], b = S[Math.min(k + 1, S.length - 1)];
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    }
    function paint() {
      ctl.routes.forEach(function (R) {
        for (var i = 0; i < R.m.length; i++) { var q = R.m[i], xy = at(R, q.o); q.x = xy[0]; q.y = xy[1]; M.place(R.els[i], xy[0], xy[1], q.r, R.s); }
      });
      names();
    }
    /* 13 Oct (slow and named): one molecule per figure carries its name (H₂O, or Ca²⁺ for a calcium route), under it,
       in a pill sized for 10.5 px text (9.5 px on phones). Stable: the same molecule keeps the name until it wraps
       back to the start of its route; the name hides where it would touch any text of the figure. MolNames off: none. */
    var NM = { g: null, R: -1, i: -1, lastO: 0, chk: 0, ok: false, blk: [] };
    function names() {
      var on = !window.MolNames || window.MolNames.get();
      if (!NM.g) {
        NM.g = document.createElementNS(NS, 'g'); NM.g.setAttribute('class', 'wpm-name'); NM.g.setAttribute('pointer-events', 'none');
        NM.g.innerHTML = '<rect rx="1" ry="1"/><text text-anchor="middle" dominant-baseline="central"></text>';
        layer.appendChild(NM.g);
      } else if (NM.g.parentNode !== layer || layer.lastChild !== NM.g) layer.appendChild(NM.g);
      var R = ctl.routes[NM.R], q = R && R.m[NM.i];
      if (q && q.o < NM.lastO - 1) { NM.R = -1; q = null; } // wrapped: it left; choose again
      var now = performance.now();
      if (!on || !ctl.routes.length) { NM.g.style.display = 'none'; return; }
      if (now - NM.chk > 400 || !q) {
        NM.chk = now;
        var ctm = layer.getScreenCTM(); if (!ctm) { NM.g.style.display = 'none'; return; }
        NM.k = Math.abs(ctm.a) || 1;
        NM.blk = [];
        Array.prototype.forEach.call(svg.querySelectorAll('text'), function (t) { if (NM.g.contains(t)) return; var r = t.getBoundingClientRect(); if (r.width > 0) NM.blk.push(r); });
        var narrow = (svg.getBoundingClientRect().width || 600) < 560;
        NM.fs = (narrow ? 9.5 : 10.5) / NM.k;
        if (!q) { // choose a molecule a third of the way or more along its route, whose name lands clear of every text
          for (var a = 0; a < ctl.routes.length && !q; a++) for (var b = 0; b < ctl.routes[a].m.length; b++) {
            var c = ctl.routes[a].m[b]; if (c.o < ctl.routes[a].len * 0.15 || c.o > ctl.routes[a].len * 0.7) continue;
            if (clear(ctl.routes[a], c, ctm)) { NM.R = a; NM.i = b; q = c; R = ctl.routes[a]; break; }
          }
        }
        NM.ok = !!q && clear(R, q, ctm);
      }
      if (!q || !NM.ok) { NM.g.style.display = 'none'; if (q) NM.lastO = q.o; return; }
      NM.lastO = q.o;
      var txt = R.kind === 'ca' ? 'Ca²⁺' : (R.kind === 'vap' ? 'H₂O vapour' : 'H₂O');
      var t = NM.g.lastChild, rc = NM.g.firstChild, fs = NM.fs, w = (txt.length * 0.62 + 0.9) * fs, h = fs * 1.5, y = q.y + 5 * (R.s || 1.2) + 2 / NM.k + h / 2;
      if (t.textContent !== txt) t.textContent = txt;
      t.setAttribute('x', q.x.toFixed(1)); t.setAttribute('y', (y + fs * 0.05).toFixed(1)); t.setAttribute('style', 'font:700 ' + fs.toFixed(2) + 'px system-ui,-apple-system,Segoe UI,sans-serif;fill:var(--wpm-tagink)');
      rc.setAttribute('x', (q.x - w / 2).toFixed(1)); rc.setAttribute('y', (y - h / 2).toFixed(1)); rc.setAttribute('width', w.toFixed(1)); rc.setAttribute('height', h.toFixed(1));
      rc.setAttribute('rx', (h / 2).toFixed(1)); rc.setAttribute('style', 'fill:var(--wpm-tagbg);stroke:var(--wpm-tagrule);stroke-width:' + (0.8 / NM.k).toFixed(2));
      NM.g.style.display = '';
    }
    function clear(R, q, ctm) {
      var px = ctm.a * q.x + ctm.c * q.y + ctm.e, py = ctm.b * q.x + ctm.d * q.y + ctm.f, k = NM.k, fs = NM.fs * k;
      var txt = R.kind === 'ca' ? 'Ca²⁺' : (R.kind === 'vap' ? 'H₂O vapour' : 'H₂O');
      var w = (txt.length * 0.62 + 0.9) * fs + 4, top = py + 5 * (R.s || 1.2) * k, box = { left: px - w / 2, right: px + w / 2, top: top, bottom: top + fs * 1.5 + 4 };
      var sr = svg.getBoundingClientRect(); if (box.left < sr.left + 2 || box.right > sr.right - 2 || box.bottom > sr.bottom - 2) return false;
      for (var i = 0; i < NM.blk.length; i++) { var r = NM.blk[i]; if (box.left < r.right && r.left < box.right && box.top < r.bottom && r.top < box.bottom) return false; }
      return true;
    }
    if (window.MolNames) window.MolNames.on(function () { NM.chk = 0; names(); });
    function frame(t) {
      if (!ctl.vis || ctl.paused || document.hidden) { ctl.raf = 0; return; }
      var dt = ctl.t0 ? Math.min(0.1, (t - ctl.t0) / 1000) : 0; dt *= (window.PlaySpeed ? window.PlaySpeed.get() : 1); ctl.t0 = t;
      ctl.routes.forEach(function (R) { R.m.forEach(function (q) { q.o = (q.o + R.v * dt) % R.len; q.r = (q.r + R.v * dt * 3) % 360; }); });
      paint(); ctl.raf = requestAnimationFrame(frame);
    }
    function run() { var rmv = !!(reduce && reduce()); if (rmv !== ctl.rm) { ctl.rm = rmv; ctl.paused = rmv; } if (ctl.raf || !ctl.vis || ctl.paused) return; ctl.t0 = 0; ctl.raf = requestAnimationFrame(frame); }
    ctl.set = function (list) {
      layer.innerHTML = ''; ctl.routes = []; NM.g = null; NM.R = -1;
      (list || []).forEach(function (r) {
        if (!r.el) return;
        var len = 0; try { len = r.el.getTotalLength(); } catch (e) { len = 0; }
        if (len < 4) return;
        var S = [], n = Math.ceil(len / 3);
        for (var k = 0; k <= n; k++) { var q = r.el.getPointAtLength(len * k / n); S.push([q.x, q.y]); }
        var gap = r.gap || 22, cnt = Math.max(1, Math.round(len / gap)), g = document.createElementNS(NS, 'g');
        if (r.halo) g.setAttribute('style', 'filter:drop-shadow(0 0 2px ' + r.halo + ') drop-shadow(0 0 1px ' + r.halo + ')');
        var h = ''; for (var j = 0; j < cnt; j++) h += M.use(r.kind || 'h2o', 'wpm-flow');
        g.innerHTML = h; layer.appendChild(g);
        var R = { S: S, len: len, v: r.v || 0, s: r.s || 1.2, els: g.childNodes, m: [], kind: r.kind || 'h2o' };
        for (var i = 0; i < cnt; i++) R.m.push({ o: (i + 0.5) / cnt * len, r: (i * 113) % 360 });
        ctl.routes.push(R);
      });
      paint(); run();
    };
    document.addEventListener('visibilitychange', function () { if (!document.hidden) run(); });
    ctl.run = run;
    return ctl;
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', M.ensure); else M.ensure();
})();

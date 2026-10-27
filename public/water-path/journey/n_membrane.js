/* The Water Path v8: n_membrane.js (nutrient path, Plate V Membrane)
   Opening: the aquaporin is joined by a transporter. Then two linked workstations, each in its own file:
     n_membrane_iron.js   the two iron strategies (Strategy I and II, and the cadmium sting through IRT1)
     n_membrane_nrt.js    the transceptor NRT1.1 (CHL1): uptake and sensing, the T101 switch
   This file holds the opening text and figure, the shared 3D helpers (WPNM.lib: a lipid bilayer, the aquaporin
   hourglass copied in spirit from l5_membrane.js, carrier shapes, label sprites, a path animator) and loads
   the two workstation files with WP.nutrient.load. Registered with WP.nutrient.register('membrane', ...). */
(function () {
  'use strict';
  var WP = window.WP, N = WP && WP.nutrient;
  if (!N) return;
  var NM = window.WPNM = window.WPNM || {};

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function clamp(x, a, b) { return x < a ? a : (x > b ? b : x); }

  /* ============================================================ shared 3D helpers */
  var L = NM.lib = {};
  L.esc = esc; L.clamp = clamp;
  L.ease = function (u) { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
  L.rng = function (seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };
  L.HEAD_Y = 0.62;   // lipid head groups at y = +/- HEAD_Y; the membrane is drawn about 4 nm thick (schematic)

  /* a patch of lipid bilayer, with round holes where proteins sit */
  L.bilayer = function (T, o) {
    o = o || {};
    var w = o.w || 9, d = o.d || 4.4, zc = o.zc || 0, holes = o.holes || [], y = L.HEAD_Y, step = 0.3, rr = L.rng(o.seed || 11);
    var g = new T.Group(), heads = [], tails = [];
    for (var iz = 0; iz * step * 0.87 <= d; iz++) {
      var z = zc - d / 2 + iz * step * 0.87;
      for (var ix = 0; ix * step <= w; ix++) {
        var x = -w / 2 + ix * step + (iz % 2 ? step / 2 : 0);
        if (x > w / 2) continue;
        var skip = false;
        for (var h = 0; h < holes.length; h++) if (Math.hypot(x - holes[h].x, z - (holes[h].z || 0)) < holes[h].r) skip = true;
        if (skip) continue;
        [1, -1].forEach(function (sd) {
          var yy = sd * (y + (rr() - 0.5) * 0.04);
          heads.push([x + (rr() - 0.5) * 0.04, yy, z + (rr() - 0.5) * 0.04]);
          [-0.05, 0.05].forEach(function (dx) {
            var px = x + dx, py = yy - sd * 0.1;
            for (var k = 0; k < 3; k++) { var ny = py - sd * 0.16, nx = x + dx + Math.sin((k + 1) * 1.9 + ix * 0.7) * 0.03; tails.push(px, py, z, nx, ny, z); px = nx; py = ny; }
          });
        });
      }
    }
    var headM = new T.MeshStandardMaterial({ color: 0x7fb2e6, roughness: 0.45, metalness: 0 });
    var im = new T.InstancedMesh(new T.SphereGeometry(0.115, 10, 7), headM, heads.length);
    var m4 = new T.Matrix4();
    heads.forEach(function (p, i) { m4.makeTranslation(p[0], p[1], p[2]); im.setMatrixAt(i, m4); });
    im.instanceMatrix.needsUpdate = true;
    g.add(im);
    var tg = new T.BufferGeometry(); tg.setAttribute('position', new T.Float32BufferAttribute(tails, 3));
    var tailM = new T.LineBasicMaterial({ color: 0xb9b09a, transparent: true, opacity: 0.6 });
    g.add(new T.LineSegments(tg, tailM));
    g.userData.theme = function (dark) { headM.color.set(dark ? 0x6f9fd6 : 0x7fb2e6); tailM.color.set(dark ? 0x8e8a80 : 0xb9b09a); };
    return g;
  };

  /* the aquaporin: the same hourglass profile as the water plate (l5_membrane.js PROF_OUT and PROF_IN), scaled */
  var PROF_OUT = [[0.78, 3.05], [1.3, 3.22], [1.72, 3.02], [1.9, 2.4], [1.95, 1.2], [1.9, 0], [1.95, -1.2], [1.9, -2.4], [1.72, -3.02], [1.3, -3.22], [0.78, -3.05]];
  var PROF_IN = [[0.6, -2.6], [0.42, -1.6], [0.3, -0.6], [0.27, 0], [0.31, 0.5], [0.26, 1.3], [0.42, 2.1], [0.6, 2.6]];
  L.aquaporin = function (T) {
    var s = 0.3, g = new T.Group();
    var pts = PROF_OUT.concat(PROF_IN).concat([PROF_OUT[0]]).map(function (p) { return new T.Vector2(p[0] * s, p[1] * s); });
    var shellM = new T.MeshPhysicalMaterial({ color: 0x6a9be3, roughness: 0.15, metalness: 0, clearcoat: 1, transparent: true, opacity: 0.42, side: T.DoubleSide, depthWrite: false, emissive: 0x12306a, emissiveIntensity: 0.35 });
    var shell = new T.Mesh(new T.LatheGeometry(pts, 40), shellM); shell.renderOrder = 3; g.add(shell);
    var poreM = new T.MeshBasicMaterial({ color: 0x7fe4ff, transparent: true, opacity: 0.45, depthWrite: false });
    g.add(new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 2.0, 8, 1, true), poreM));
    /* water in single file: red O, two white H */
    var oG = new T.SphereGeometry(0.075, 10, 7), hG = new T.SphereGeometry(0.042, 8, 6);
    var oM = new T.MeshStandardMaterial({ color: 0xd8452e, roughness: 0.3 }), hM = new T.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.3 });
    var ws = [];
    for (var i = 0; i < 5; i++) {
      var w = new T.Group(); w.add(new T.Mesh(oG, oM));
      var h1 = new T.Mesh(hG, hM); h1.position.set(0.07, 0.05, 0); w.add(h1);
      var h2 = new T.Mesh(hG, hM); h2.position.set(-0.07, 0.05, 0); w.add(h2);
      g.add(w); ws.push(w);
    }
    g.userData.water = function (t) { ws.forEach(function (w, i) { var u = ((t * 0.18 + i / 5) % 1); w.position.set(0, 1.25 - u * 2.5, 0); w.rotation.y = u * 6 + i; w.visible = Math.abs(w.position.y) < 1.2; }); };
    g.userData.water(0);
    g.userData.theme = function (dark) { shellM.opacity = dark ? 0.5 : 0.42; };
    return g;
  };

  /* a transporter body: a rounded lathe with a slight waist, standing across the membrane */
  L.carrier = function (T, o) {
    o = o || {};
    var r = o.r || 0.45, h = o.h || 1.75, n = 14, pts = [];
    for (var i = 0; i <= n; i++) {
      var u = i / n, y = -h / 2 + u * h, a = Math.sin(Math.PI * u);
      var rad = r * (Math.pow(a, 0.35) * (1 - 0.12 * Math.exp(-Math.pow((u - 0.5) / 0.2, 2))));
      pts.push(new T.Vector2(Math.max(0.001, rad), y));
    }
    var m = new T.MeshPhysicalMaterial({ color: o.color || 0xd2ae68, roughness: 0.32, metalness: 0, clearcoat: 0.7, transparent: true, opacity: o.opacity || 0.9, emissive: o.emissive || 0x000000, emissiveIntensity: 0.25 });
    var mesh = new T.Mesh(new T.LatheGeometry(pts, 32), m);
    mesh.renderOrder = 2;
    return mesh;
  };

  /* a name tag that always faces the camera; redrawn when the theme changes */
  L.tag = function (T, text, o) {
    o = o || {};
    var cv = document.createElement('canvas'), cx = cv.getContext('2d');
    var tex = new T.CanvasTexture(cv);
    tex.minFilter = T.LinearFilter;
    var mat = new T.SpriteMaterial({ map: tex, depthTest: false, depthWrite: false, transparent: true });
    var sp = new T.Sprite(mat); sp.renderOrder = 20;
    var hgt = (o.h || 0.3) * (window.innerWidth < 700 ? 1.35 : 1);
    function draw(txt) {
      if (txt != null) text = txt;
      var WS = window.WS, fs = 44, font = '600 ' + fs + 'px ' + (WS ? WS.token('ui') : 'sans-serif');
      cx.font = font;
      var tw = Math.ceil(cx.measureText(text).width), pw = tw + 28, ph = fs + 22;
      cv.width = pw; cv.height = ph;
      cx.font = font;
      var bg = WS ? WS.token('wall') : '#faf6ec', ink = WS ? WS.token(o.ink || 'ink') : '#2a231c', rule = WS ? WS.token(o.edge || 'rule') : '#8a7a62';
      cx.globalAlpha = 0.92; cx.fillStyle = bg;
      var rad = 10; cx.beginPath(); cx.moveTo(rad, 1); cx.lineTo(pw - rad, 1); cx.quadraticCurveTo(pw - 1, 1, pw - 1, rad); cx.lineTo(pw - 1, ph - rad); cx.quadraticCurveTo(pw - 1, ph - 1, pw - rad, ph - 1); cx.lineTo(rad, ph - 1); cx.quadraticCurveTo(1, ph - 1, 1, ph - rad); cx.lineTo(1, rad); cx.quadraticCurveTo(1, 1, rad, 1); cx.closePath(); cx.fill();
      cx.globalAlpha = 1; cx.lineWidth = 3; cx.strokeStyle = rule; cx.stroke();
      cx.fillStyle = ink; cx.textBaseline = 'middle'; cx.fillText(text, 14, ph / 2 + 2);
      tex.needsUpdate = true;
      sp.scale.set(hgt * pw / ph, hgt, 1);
    }
    draw();
    sp.userData.redraw = draw;
    sp.userData.theme = function () { draw(); };
    return sp;
  };

  /* call userData.theme on every object below root */
  L.theme = function (root, dark) { root.traverse(function (ob) { if (ob.userData && typeof ob.userData.theme === 'function') ob.userData.theme(dark); }); };

  /* small path animator: an object moves through waypoints, each leg with its own duration and an optional callback */
  L.Mover = function (obj, legs) {
    this.obj = obj; this.legs = legs; this.i = 0; this.t = 0; this.done = false;
    this.p0 = obj.position.clone();
  };
  L.Mover.prototype.step = function (dt) {
    while (!this.done && dt > 0) {
      var lg = this.legs[this.i], need = lg.d - this.t, use = Math.min(dt, need);
      this.t += use; dt -= use;
      var u = lg.d > 0 ? this.t / lg.d : 1, e = lg.lin ? u : L.ease(u);
      if (lg.to) this.obj.position.lerpVectors(this.p0, lg.to, e);
      if (lg.wig) { this.obj.position.x += Math.sin(this.t * 7 + this.i) * lg.wig * (1 - Math.abs(2 * u - 1)); }
      if (lg.each) lg.each(this.obj, u);
      if (this.t >= lg.d - 1e-9) {
        if (lg.to) this.p0.copy(lg.to);
        if (lg.fn) lg.fn(this.obj);
        this.i++; this.t = 0;
        if (this.i >= this.legs.length) this.done = true;
      }
    }
    return this.done;
  };

  /* draw a small rounded rectangle on a 2D context */
  L.rrect = function (c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r); c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h); c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r); c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath(); };

  /* ============================================================ the opening: a pore next to a carrier */
  function poreCarrierSVG() {
    /* original schematic: one aquaporin pore with water in single file, beside one carrier shown in its two shapes */
    var heads = '', i;
    for (i = 0; i < 27; i++) {
      var x = 8 + i * 15.5;
      if ((x > 52 && x < 112) || (x > 214 && x < 286) || (x > 318 && x < 390)) continue;
      heads += '<circle cx="' + x + '" cy="84" r="5.4" class="nm-o-head"/><circle cx="' + x + '" cy="128" r="5.4" class="nm-o-head"/>' +
        '<path d="M' + (x - 2) + ' 90v14M' + (x + 2) + ' 90v14M' + (x - 2) + ' 122v-14M' + (x + 2) + ' 122v-14" class="nm-o-tail"/>';
    }
    var water = '';
    for (i = 0; i < 5; i++) { var wy = 66 + i * 20; water += '<g transform="translate(82 ' + wy + ')"><circle r="4.4" class="nm-o-ox"/><circle cx="4.2" cy="-2.6" r="2.3" class="nm-o-hy"/><circle cx="-4.2" cy="-2.6" r="2.3" class="nm-o-hy"/></g>'; }
    return '<svg class="nm-open-fig" viewBox="0 0 420 232" role="img" aria-labelledby="nm-of-t nm-of-d">' +
      '<title id="nm-of-t">A pore next to a carrier</title>' +
      '<desc id="nm-of-d">A strip of membrane. On the left an aquaporin, an hourglass shaped pore, with water molecules passing in single file. On the right one carrier drawn twice: first open to the outside with an ion bound in its middle, then changed in shape and open to the inside, letting the ion go.</desc>' +
      '<text x="6" y="14" class="nm-o-side">outside</text><text x="6" y="226" class="nm-o-side">inside the cell</text>' +
      heads +
      /* aquaporin hourglass */
      '<path d="M54 60 C62 60 70 70 76 104 C70 140 62 150 54 150 L110 150 C102 150 94 140 88 104 C94 70 102 60 110 60 Z" class="nm-o-aqp"/>' +
      water +
      '<text x="82" y="176" text-anchor="middle" class="nm-o-lab">aquaporin</text><text x="82" y="194" text-anchor="middle" class="nm-o-sub">a pore: water streams through</text>' +
      /* carrier, open outside */
      '<path d="M216 56 L246 56 L248 104 L240 152 L216 152 Z M284 56 L254 56 L252 104 L260 152 L284 152 Z" class="nm-o-car"/>' +
      '<circle cx="250" cy="96" r="7" class="nm-o-ion"/>' +
      /* arrow */
      '<path d="M292 104 h20" class="nm-o-arr"/><path d="M308 99 l6 5 l-6 5" class="nm-o-arr"/>' +
      /* carrier, open inside */
      '<path d="M320 56 L344 56 L352 104 L350 152 L320 152 Z M388 56 L364 56 L356 104 L358 152 L388 152 Z" class="nm-o-car"/>' +
      '<circle cx="354" cy="146" r="7" class="nm-o-ion"/>' +
      '<text x="302" y="176" text-anchor="middle" class="nm-o-lab">transporter</text><text x="302" y="194" text-anchor="middle" class="nm-o-sub">a carrier: binds one ion, changes shape</text>' +
      '</svg>';
  }

  var CSS = '\
.nm-open{font-family:var(--ui);color:var(--ink);margin:4px 0 16px;display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:14px 22px;align-items:center}\
.nm-k{margin:0;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--ink2)}\
.nm-h{font-family:var(--disp);font-weight:400;font-size:26px;margin:4px 0 8px}\
.nm-lead{font-family:var(--text);font-size:21px;line-height:1.35;margin:0 0 10px}\
.nm-open p{max-width:40em}\
.nm-body{font-size:15px;line-height:1.5;margin:0 0 8px}\
.nm-note{font-size:14px;color:var(--ink2);margin:6px 0 0}\
.nm-note b{color:var(--ink)}\
.nm-open-fig{width:100%;height:auto;display:block;background:var(--wall);border:1px solid var(--rule2);border-radius:4px}\
.nm-open-fig text{font-family:var(--ui)}\
.nm-o-side{font-size:11px;fill:var(--ink2);letter-spacing:.04em}\
.nm-o-lab{font-size:13px;font-weight:600;fill:var(--ink)}\
.nm-o-sub{font-size:11px;fill:var(--ink2)}\
.nm-o-head{fill:var(--w4);stroke:var(--w2);stroke-width:1}\
.nm-o-tail{stroke:var(--rule);stroke-width:1;fill:none}\
.nm-o-aqp{fill:var(--w5);stroke:var(--w2);stroke-width:1.6;opacity:.95}\
.nm-o-ox{fill:#d8452e}.nm-o-hy{fill:#ffffff;stroke:#9a9a9a;stroke-width:.6}\
.nm-o-car{fill:var(--sun);stroke:var(--warm);stroke-width:1.6}\
.nm-o-ion{fill:var(--leaf3);stroke:var(--ink);stroke-width:1.2}\
.nm-o-arr{stroke:var(--ink);stroke-width:1.6;fill:none}\
.nm-ws-slot{min-height:40px}\
.nm-quote{font-family:var(--text);font-size:20px;line-height:1.3;margin:8px 0 6px;padding:2px 0 2px 12px;border-left:4px solid var(--accent);max-width:36em}\
.nm-btn{font:500 13px var(--ui);min-height:44px;min-width:44px;padding:6px 12px;border:1px solid var(--rule);border-radius:3px;background:var(--card);color:var(--ink);cursor:pointer}\
.nm-btn[disabled]{opacity:.55;cursor:not-allowed}\
.nm-btn:focus-visible{outline:3px solid var(--accent);outline-offset:2px}\
.nm-c{flex:1 1 220px;min-width:0;display:flex;flex-direction:column;gap:3px}\
.nm-c-l{font-weight:600;font-size:13px}\
.nm-c-h{font-size:12px;color:var(--ink2)}\
.ws .nm-why p{margin:0 0 8px}\
.ws .nm-why a{color:var(--accent)}\
.ws .ws-lab.nm-dim{fill:var(--ink2)!important}\
.ws .nm-l1{stroke:var(--accent);stroke-width:2.6;fill:none}\
.ws .nm-l1.off{stroke-width:1.6;opacity:.75;stroke-dasharray:6 4}\
.ws .nm-l2{stroke:var(--warm);stroke-width:2.6;fill:none;stroke-dasharray:2 3}\
.ws .nm-l2.off{stroke-width:1.6;opacity:.75}\
.ws .nm-l0{stroke:var(--rule);stroke-width:1;fill:none;stroke-dasharray:3 3}\
.ws .nm-leg{font-size:11.5px;fill:var(--ink)}\
@media (max-width:699px){.nm-open{grid-template-columns:1fr}.nm-lead{font-size:19px}.nm-h{font-size:23px}.nm-quote{font-size:18px}}';

  /* ============================================================ mount */
  var S = { host: null, token: 0, iron: null, nrt: null, intro: null, note: null };

  function soluteNote(sol) {
    var nm = N.soluteName(sol);
    if (sol === 'nitrate') return 'You are following <b>nitrate</b>. The second workstation below is about nitrate itself: the carrier that also senses it.';
    if (sol === 'cadmium') return 'You are following <b>cadmium</b>. In the first workstation cadmium is switched on: watch it slip in through IRT1, the iron carrier.';
    if (sol === 'potassium') return 'You are following <b>potassium</b>. This plate follows iron and nitrate, but the idea of two uptake systems, one for low and one for high concentration, was first resolved for potassium in barley roots (see the second workstation).';
    return 'You are following <b>' + esc(nm) + '</b>. This plate follows iron and nitrate, two nutrients whose transporters show what a carrier can do. Change the nutrient under Conditions.';
  }

  function mount(host, st) {
    S.host = host; var tok = ++S.token;
    if (!document.getElementById('nm-css')) { var s = document.createElement('style'); s.id = 'nm-css'; s.textContent = CSS; document.head.appendChild(s); }
    var intro = document.createElement('div');
    intro.className = 'nm-open';
    intro.innerHTML = '<div><p class="nm-k">Nutrient path · Plate V, Membrane</p>' +
      '<h3 class="nm-h">A pore next to a carrier</h3>' +
      '<p class="nm-lead">The aquaporin is joined by a transporter. A pore that cannot choose, next to a carrier that must.</p>' +
      '<p class="nm-body">On the water plate, water crosses the membrane through the <b>aquaporin</b>, an open pore. Mineral nutrients reach the root as <b>ions</b>, small charged particles, and most need a <b>transporter</b>: a protein that grabs one kind of ion, changes shape and lets it go on the other side. Below, two transporters show what that means: two ways to get iron, and a nitrate carrier that is also a sensor.</p>' +
      '<p class="nm-note" aria-live="polite"></p></div>' +
      '<div>' + poreCarrierSVG() + '</div>';
    host.appendChild(intro);
    S.intro = intro; S.note = intro.querySelector('.nm-note');
    S.note.innerHTML = soluteNote(st.solute);
    var slotA = document.createElement('div'); slotA.className = 'nm-ws-slot'; host.appendChild(slotA);
    var slotB = document.createElement('div'); slotB.className = 'nm-ws-slot'; host.appendChild(slotB);
    if (!window.WS || !window.WS.create) { slotA.innerHTML = '<p class="wp-nut-wait">The workstations could not start in this browser.</p>'; return; }
    N.load('membrane_iron', function (err) {
      if (tok !== S.token) return;
      if (err || !NM.iron) { slotA.innerHTML = '<p class="wp-nut-wait">The iron workstation could not load.</p>'; return; }
      try { S.iron = NM.iron(slotA, L, WP.state); } catch (e) { console.error('n_membrane iron', e); slotA.innerHTML = '<p class="wp-nut-wait">The iron workstation failed to start.</p>'; }
    });
    N.load('membrane_nrt', function (err2) {
      if (tok !== S.token) return;
      if (err2 || !NM.nrt) { slotB.innerHTML = '<p class="wp-nut-wait">The nitrate workstation could not load.</p>'; return; }
      try { S.nrt = NM.nrt(slotB, L, WP.state); } catch (e) { console.error('n_membrane nrt', e); slotB.innerHTML = '<p class="wp-nut-wait">The nitrate workstation failed to start.</p>'; }
    });
  }

  N.register('membrane', {
    mount: mount,
    update: function (st) {
      if (S.note) S.note.innerHTML = soluteNote(st.solute);
      if (S.iron && S.iron.solute) S.iron.solute(st.solute);
      if (S.iron && S.iron.ws) S.iron.ws.kick();
      if (S.nrt && S.nrt.ws) S.nrt.ws.kick();
    },
    unmount: function () {
      S.token++;
      if (S.iron && S.iron.ws) S.iron.ws.destroy();
      if (S.nrt && S.nrt.ws) S.nrt.ws.destroy();
      S.iron = S.nrt = S.intro = S.note = S.host = null;
    }
  });
})();

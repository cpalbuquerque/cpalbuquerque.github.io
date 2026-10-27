/* The Water Path v8: n_plant.js (nutrient path, Plate II Plant)
   1. A short opener card: mass flow and diffusion, two ways a nutrient reaches a root (links to Plate I).
   2. Workstation "The reach": a root with root hairs beside an arbuscular mycorrhizal hyphal network
      over the same soil block. One set of controls drives the 3D, the cross section and the plot.
      Soil within reach of a cylinder around the root = pi x reach^2 x 1 cm (DERIVED, exact).
      The reach inputs and the cost and growth model are ILLUSTRATIVE.
   Registered with WP.nutrient.register('plant', {mount, update, unmount}); loaded lazily by nutrient.js. */
(function () {
  'use strict';
  var WP = window.WP, N = WP && WP.nutrient;
  if (!N) return;

  /* ------------------------------------------------------------ the model (pure; numbers tagged in the text) */
  var A_CM = 0.01;          /* root radius 0.1 mm, ILLUSTRATIVE (used only when "count the root's own width" is on) */
  var KH = 0.1, KF = 5;     /* soil volume (cm3) at which each route reaches half of its phosphate supply, ILLUSTRATIVE */
  var DIRECT = 0.25;        /* share of its own uptake the root keeps when colonised, ILLUSTRATIVE */
  var KG = 0.3, CU = 0.06;  /* growth curve and growth lost per carbon unit, ILLUSTRATIVE */
  var M = {
    vol: function (Lcm, w) { return w ? Math.PI * ((A_CM + Lcm) * (A_CM + Lcm) - A_CM * A_CM) : Math.PI * Lcm * Lcm; },
    grow: function (p) { return (1 + KG) * p / (p + KG); },
    run: function (s) {
      var vh = M.vol(s.hair / 10, s.width), vf = M.vol(s.hyph, s.width);
      var sh = vh / (vh + KH), sf = vf / (vf + KF);
      var pNo = sh, pDir = DIRECT * sh, pAM = (1 - pDir) * sf, pWith = pDir + pAM;
      var gNo = M.grow(pNo), gWith0 = M.grow(pWith), gWith = gWith0 - CU * s.cost;
      return { vh: vh, vf: vf, ratio: vf / vh, pNo: pNo, pWith: pWith, share: pAM / pWith, gNo: gNo, gWith0: gWith0, gWith: gWith,
        resp: (gWith - gNo) / gNo, cZero: (gWith0 - gNo) / CU };
    }
  };

  /* ------------------------------------------------------------ small helpers */
  function sig(v, n) {
    if (!isFinite(v)) return '?';
    if (v >= 1000) return Math.round(v).toLocaleString('en-US');
    if (v >= 100) return String(Math.round(v));
    var s = (+v.toPrecision(n || 3)).toString();
    if (/e/.test(s)) s = v.toFixed(6).replace(/0+$/, '');
    return s;
  }
  function ratioTxt(r) { var p = Math.pow(10, Math.floor(Math.log(r) / Math.LN10) - 2); return Math.round(Math.round(r / p) * p).toLocaleString('en-US'); }
  function pct(v) { var r = Math.round(v * 100); return (r > 0 ? '+' : (r < 0 ? '−' : '')) + Math.abs(r) + ' %'; }
  function rng(seed) { var s = seed % 2147483647; if (s <= 0) s += 2147483646; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  function clamp(x, a, b) { return x < a ? a : (x > b ? b : x); }

  /* ------------------------------------------------------------ geometry shared by 3D, scan and fallback */
  /* views: the soil block shown, as a half width in cm (radial and along the root) */
  var VIEWS = { net: { half: 13, name: 'whole network', across: '26 cm' }, hair: { half: 0.325, name: 'root hairs', across: '6.5 mm' } };
  var HALF = 4;             /* the block is a cube of half width 4 world units */
  function wpc(view) { return HALF / VIEWS[view].half; }
  function rootVis(view) { return Math.max(A_CM * wpc(view), 0.035); }

  /* the hyphal network, built once in "reach units" (1 = the hyphal reach) relative to each entry point */
  var NET = (function () {
    var r = rng(4242), E = 60, segs = [], entries = [];
    function norm(v) { var l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
    for (var e = 0; e < E; e++) {
      var th = r() * Math.PI * 2;
      entries.push({ x: -13 + 26 * (e + r()) / E, cy: Math.cos(th), sz: Math.sin(th) });
      var stack = [{ p: [0, 0, 0], d: norm([(r() - 0.5) * 0.6, Math.cos(th), Math.sin(th)]), depth: 0, parent: -1, lim: 0.82 + r() * 0.18 }];
      var guard = 0;
      while (stack.length && guard++ < 400) {
        var h = stack.pop(), p = h.p, d = h.d, par = h.parent, steps = 0;
        while (steps++ < 40) {
          var rad = Math.hypot(p[1], p[2]);
          if (rad >= h.lim) break;
          var out = rad > 1e-6 ? [0, p[1] / rad, p[2] / rad] : [0, d[1], d[2]];
          d = norm([d[0] + (r() - 0.5) * 0.5, d[1] + (r() - 0.5) * 0.5, d[2] + (r() - 0.5) * 0.5]);
          var dot = d[1] * out[1] + d[2] * out[2];
          if (dot < 0.25) d = norm([d[0], d[1] + out[1] * (0.4 - dot), d[2] + out[2] * (0.4 - dot)]);
          var st = h.depth ? 0.045 : 0.06;
          var q = [p[0] + d[0] * st, p[1] + d[1] * st, p[2] + d[2] * st];
          segs.push({ e: e, a: p, b: q, depth: h.depth, parent: par, kids: 0 });
          if (par >= 0) segs[par].kids++;
          par = segs.length - 1; p = q;
          if (h.depth < 3 && r() < (h.depth ? 0.12 : 0.2)) {
            var side = norm([r() - 0.5, r() - 0.5, r() - 0.5]);
            stack.push({ p: q, d: norm([d[0] + side[0] * 1.1, d[1] + side[1] * 1.1, d[2] + side[2] * 1.1]), depth: h.depth + 1, parent: par, lim: Math.min(h.lim, rad + 0.15 + r() * 0.5) });
          }
        }
      }
    }
    var tips = [];
    segs.forEach(function (s, i) { if (!s.kids) tips.push(i); });
    /* chains from the root (index 0) to a tip, for the moving particles */
    var chains = tips.filter(function (i) { return Math.hypot(segs[i].b[1], segs[i].b[2]) > 0.35; }).map(function (i) {
      var pts = [segs[i].b.slice()], j = i;
      while (j >= 0) { pts.push(segs[j].a.slice()); j = segs[j].parent; }
      pts.reverse();
      var len = [0];
      for (var k = 1; k < pts.length; k++) len.push(len[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1], pts[k][2] - pts[k - 1][2]));
      return { e: segs[i].e, pts: pts, len: len, total: len[len.length - 1] };
    });
    var spores = tips.filter(function (i, k) { return k % 37 === 5 && segs[i].depth > 0; }).slice(0, 8);
    return { segs: segs, entries: entries, chains: chains, spores: spores };
  })();
  var HAIRS = (function () {
    var r = rng(99), out = [];
    for (var i = 0; i < 520; i++) { var th = r() * Math.PI * 2; out.push({ u: r() * 2 - 1, cy: Math.cos(th), sz: Math.sin(th), tilt: (r() - 0.5) * 0.5, f: 0.75 + r() * 0.25 }); }
    return out;
  })();
  /* a reach-unit point of the network to world units, for the current state */
  function toWorld(p, en, s, out) {
    var k = wpc(s.view), rv = rootVis(s.view);
    out[0] = k * (en.x + s.hyph * p[0]);
    out[1] = en.cy * rv + k * s.hyph * p[1];
    out[2] = en.sz * rv + k * s.hyph * p[2];
    return out;
  }
  function chainAt(ch, t, s, out) {
    var L = t * ch.total, i = 1;
    while (i < ch.len.length - 1 && ch.len[i] < L) i++;
    var a = ch.pts[i - 1], b = ch.pts[i], seg = ch.len[i] - ch.len[i - 1] || 1, f = clamp((L - ch.len[i - 1]) / seg, 0, 1);
    var p = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
    return toWorld(p, NET.entries[ch.e], s, out);
  }

  /* ------------------------------------------------------------ module styles */
  var CSS = '\
.np-card{border:1px solid var(--rule2);background:var(--wall);border-radius:4px;padding:12px 14px;margin:6px 0 16px;font-family:var(--ui);font-size:15px;line-height:1.45;color:var(--ink)}\
.np-card h3{font-family:var(--disp);font-weight:400;font-size:22px;margin:0 0 6px}\
.np-card .np-k{margin:0;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--ink2)}\
.np-two{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:6px 0}\
.np-two>div{display:flex;gap:10px;align-items:flex-start;min-width:0}\
.np-two svg{flex:0 0 84px;width:84px;height:84px}\
.np-two p{margin:0}\
.np-card .np-foot{margin:6px 0 0;font-size:13.5px;color:var(--ink2)}\
.np-card .np-foot b{color:var(--ink)}\
.np-card a{color:var(--accent)}\
.np-solute{margin:4px 0 0;font-size:14px}\
@media (max-width:699px){.np-two{grid-template-columns:1fr}}\
.np-read{flex:1 1 100%;border-top:1px solid var(--rule2);padding-top:6px;margin-top:2px;font-size:13.5px}\
.np-read p{margin:0 0 4px}\
.np-read .np-big{font-family:var(--mono);font-weight:600}\
.np-read .np-note{font-size:12.5px;color:var(--ink2)}\
.np-leg{position:absolute;left:8px;top:8px;margin:0;padding:4px 7px;font:12px/1.35 var(--ui);color:var(--ink);background:color-mix(in srgb,var(--wall) 82%,transparent);border-radius:3px;pointer-events:none;max-width:62%}\
.np-leg span{display:inline-flex;align-items:center;gap:4px;margin-right:8px;white-space:nowrap}\
.np-leg i{display:inline-block;width:12px;height:3px;border-radius:1px}\
.np-leg .np-dot{width:7px;height:7px;border-radius:50%}\
.np-leg .np-sq{width:7px;height:7px;border-radius:0}\
@media (max-width:699px){.np-leg{font-size:11px;max-width:70%}.np-leg .np-xtra{display:none}}\
.ws .np-hairc{fill:var(--warm)!important}.ws .np-hyphc{fill:var(--cool)!important}\
.ws .np-hairb{fill:var(--warm);opacity:.12}.ws .np-hyphb{fill:var(--cool);opacity:.12}\
.ws .np-curve{stroke:var(--ink);stroke-width:1.6;fill:none}\
.ws .np-with{stroke:var(--cool);stroke-width:2.2;fill:none}\
.ws .np-without{stroke:var(--ink2);stroke-width:1.8;stroke-dasharray:5 3;fill:none}\
.ws .np-brk{stroke:var(--ink);stroke-width:1.2;fill:none}\
.ws .np-edge{stroke:var(--ink2);stroke-width:1;stroke-dasharray:2 3}\
.ws .np-zero{fill:var(--paper);stroke:var(--ink);stroke-width:1.5}\
.ws text.np-sm{font-size:10.5px;fill:var(--ink2)!important}\
.ws text.np-b{font-size:11.5px;font-weight:600;fill:var(--ink)!important}';
  function addCss() {
    if (document.getElementById('np-css')) return;
    var st = document.createElement('style'); st.id = 'np-css'; st.textContent = CSS; document.head.appendChild(st);
  }

  /* ------------------------------------------------------------ the opener card */
  function opener(host) {
    var d = document.createElement('div');
    d.className = 'np-card';
    d.innerHTML =
      '<p class="np-k">Nutrient path · Plate II, Plant</p>' +
      '<h3>Two ways to deliver a nutrient</h3>' +
      '<div class="np-two">' +
        '<div><svg viewBox="0 0 84 84" aria-hidden="true">' +
          '<rect x="0" y="0" width="84" height="84" rx="4" fill="var(--soil)" opacity=".45"/>' +
          '<rect x="36" y="0" width="12" height="84" rx="6" fill="var(--apo)" stroke="var(--apo2)"/>' +
          '<g stroke="var(--w2)" stroke-width="2" fill="none" stroke-linecap="round">' +
            '<path d="M4 20 H30 M26 16 L30 20 L26 24"/><path d="M4 42 H30 M26 38 L30 42 L26 46"/><path d="M4 64 H30 M26 60 L30 64 L26 68"/>' +
            '<path d="M80 20 H54 M58 16 L54 20 L58 24"/><path d="M80 42 H54 M58 38 L54 42 L58 46"/><path d="M80 64 H54 M58 60 L54 64 L58 68"/></g>' +
          '<g fill="var(--warm)"><circle cx="12" cy="20" r="2.4"/><circle cx="20" cy="42" r="2.4"/><circle cx="10" cy="64" r="2.4"/><circle cx="70" cy="20" r="2.4"/><circle cx="64" cy="42" r="2.4"/><circle cx="74" cy="64" r="2.4"/></g>' +
        '</svg><p><b>Mass flow.</b> As the leaves lose water, soil water flows toward the root and carries dissolved ions with it. <b>Nitrate</b> stays dissolved in the soil water, so much of it simply arrives with the water.</p></div>' +
        '<div><svg viewBox="0 0 84 84" aria-hidden="true">' +
          '<rect x="0" y="0" width="84" height="84" rx="4" fill="var(--soil)" opacity=".45"/>' +
          '<rect x="36" y="0" width="12" height="84" rx="6" fill="var(--apo)" stroke="var(--apo2)"/>' +
          '<g fill="var(--cut)" stroke="var(--apo2)" stroke-width=".6">' +
            '<circle cx="6" cy="10" r="2.4"/><circle cx="14" cy="30" r="2.4"/><circle cx="5" cy="50" r="2.4"/><circle cx="12" cy="72" r="2.4"/><circle cx="24" cy="58" r="2.4"/>' +
            '<circle cx="78" cy="14" r="2.4"/><circle cx="70" cy="36" r="2.4"/><circle cx="79" cy="56" r="2.4"/><circle cx="68" cy="76" r="2.4"/><circle cx="62" cy="22" r="2.4"/></g>' +
          '<g stroke="var(--ink2)" stroke-width="1.4" fill="none" stroke-linecap="round"><path d="M22 36 H31 M28 33 L31 36 L28 39"/><path d="M62 50 H53 M56 47 L53 50 L56 53"/></g>' +
          '<path d="M30 0 V84 M54 0 V84" stroke="var(--ink2)" stroke-width="1" stroke-dasharray="2 3"/>' +
        '</svg><p><b>Diffusion.</b> <b>Phosphate</b> clings to soil particles, so very little is dissolved and it barely moves. It only creeps toward the root, from where there is more to where there is less. The root has to meet it halfway: grow toward it, or reach further.</p></div>' +
      '</div>' +
      '<p class="np-foot">Mass flow brings what is dissolved from far away; diffusion only works over a short distance. The thin zone a root empties around itself, the <b>depletion zone</b>, is simulated on <a href="#field">Plate I, Field</a>. The two delivery routes as a concept: Barber 1962, Soil Science 93: 39 (<a href="https://doi.org/10.1097/00010694-196201000-00007" target="_blank" rel="noopener">doi 10.1097/00010694-196201000-00007</a>).</p>' +
      '<p class="np-solute" aria-live="off"></p>';
    host.appendChild(d);
    d.setSolute = function (sol) {
      var t = sol === 'nitrate' ? 'You are following <b>nitrate</b>: it mostly arrives by mass flow, so reach matters less for it.' :
        sol === 'phosphate' ? 'You are following <b>phosphate</b>: it arrives by diffusion over short distances, so reach is everything. Below is how plants extend it.' :
          'You are following <b>' + WS.esc(N.soluteName(sol)) + '</b>. This plate compares nitrate and phosphate; change the nutrient under Conditions.';
      d.querySelector('.np-solute').innerHTML = t;
    };
    return d;
  }

  /* ------------------------------------------------------------ the workstation */
  var card = null, ws = null, WS = null;
  var B = function (t, tip) { return WS.badge(t, tip); };

  function build(host) {
    WS = window.WS;
    addCss();
    card = opener(host);
    var illR = 'Reach values are orders of magnitude chosen to show the scale, not measurements.';
    var derV = 'Soil within reach of a cylinder around 1 cm of root: pi times reach squared times 1 cm.';
    var illM = 'An invented model: the cost, the phosphate routes and the growth curve show a direction, not data.';

    ws = WS.create(host, {
      title: 'The reach: why a plant rents a fungus',
      badge: 'ILLUSTRATIVE',
      what: 'A piece of root in a block of soil, cut open. <b>Root hairs</b> are long outgrowths of single cells in the root skin. <b>Hyphae</b> are the fine threads of an <b>arbuscular mycorrhizal fungus</b>, which grows inside the root and out into the soil. Both collect phosphate. The question: how much soil can each one reach?',
      todo: 'Slide <b>Root hair reach</b> and <b>Hyphal reach</b> and watch the numbers under the controls. Then raise <b>Carbon paid to the fungus</b>. Switch the 3D zoom to see the hairs up close.',
      thing: 'A model root (pale tube) with root hairs (orange fuzz) and fungal hyphae (blue threads) in a soil block with one corner cut away. Round dots moving in are phosphate; square dots moving out are carbon paid to the fungus. Root, hairs and hyphae are drawn thicker than life so you can see them; the reach distances are to scale.',
      scanCaption: '<b>Cross section across the root.</b> Drawn from the same model, to scale; the inset magnifies the root and its hairs. A model rendering, not a microscope image. ' + B('ILLUSTRATIVE', illR),
      plotCaption: '<b>Left:</b> soil within reach against reach, both on log scales ' + B('DERIVED', derV) + ' <b>Right:</b> plant growth against the carbon it pays, with and without the fungus ' + B('ILLUSTRATIVE', illM),
      why: whyHtml(),
      state: { hair: 1, hyph: 10, cost: 2, view: 'net', width: false },
      camera: { dist: 15.5, theta: 0.62, phi: 1.12, target: [0, -0.3, 0], minDist: 5, maxDist: 34 }
    });
    var S = ws.state;
    ws.range({ key: 'hair', label: 'Root hair reach', min: 0.1, max: 2, step: 0.05, fmt: function (v) { return (+v).toFixed(2) + ' mm'; }, hint: 'Illustrative, an order of magnitude' });
    ws.range({ key: 'hyph', label: 'Hyphal reach', min: 0.5, max: 12, step: 0.1, fmt: function (v) { return (+v).toFixed(1) + ' cm'; }, hint: 'Illustrative, an order of magnitude' });
    ws.range({ key: 'cost', label: 'Carbon paid to the fungus', min: 0, max: 10, step: 0.5, fmt: function (v) { return (+v).toFixed(1) + ' units'; }, hint: 'Illustrative units of carbon from photosynthesis' });
    ws.choice({ key: 'view', label: '3D zoom', options: [['net', 'Whole network (cm)'], ['hair', 'Root hairs (mm)']] });
    ws.toggle({ key: 'width', label: 'Count the root’s own width' });

    /* the live readout, in the controls pane */
    var rd = document.createElement('div');
    rd.className = 'np-read';
    rd.innerHTML =
      '<p><b>Soil within reach</b>, per cm of root ' + B('DERIVED', derV) + ': hairs <span class="np-big" data-r="vh"></span> · hyphae <span class="np-big" data-r="vf"></span> · the hyphae reach <span class="np-big" data-r="ratio"></span> as much soil.</p>' +
      '<p><b>In this model</b> ' + B('ILLUSTRATIVE', illM) + ': the fungus delivers <span class="np-big" data-r="share"></span> of the plant’s phosphate; growth with the fungus compared with no fungus: <span class="np-big" data-r="resp"></span>.</p>' +
      '<p class="np-note">The reach values are orders of magnitude, not measurements ' + B('ILLUSTRATIVE', illR) + '. The volume arithmetic, π × reach² × 1 cm, is exact ' + B('DERIVED', derV) + '.</p>';
    ws.controls.appendChild(rd);
    function R(k) { return rd.querySelector('[data-r="' + k + '"]'); }

    /* the 3D legend */
    var glHost = ws.el.querySelector('.ws-gl');
    var leg = document.createElement('p'); leg.className = 'np-leg'; leg.setAttribute('aria-hidden', 'true');
    glHost.appendChild(leg);

    var last = null;
    ws.on(function (s) {
      var m = M.run(s);
      R('vh').textContent = sig(m.vh) + ' cm³';
      R('vf').textContent = sig(m.vf) + ' cm³';
      R('ratio').textContent = ratioTxt(m.ratio) + ' times';
      R('share').textContent = Math.round(m.share * 100) + ' %';
      R('resp').textContent = pct(m.resp);
      leg.innerHTML = '<span><i style="background:var(--warm)"></i>root hairs</span><span><i style="background:var(--cool)"></i>hyphae</span>' +
        '<span class="np-xtra"><i class="np-dot" style="background:var(--cut)"></i>phosphate</span><span class="np-xtra"><i class="np-sq" style="background:var(--chl)"></i>carbon</span><br>' +
        'Block ' + VIEWS[s.view].across + ' across' + (s.view === 'hair' ? '; the hyphae run far beyond it' : '');
      ws.say(sayFor(s, m, last));
      last = { hair: s.hair, hyph: s.hyph, cost: s.cost, view: s.view, width: s.width };
    });

    build3D(S);
    ws.fallback(drawFallback);
    ws.paintScan(drawScan);
    ws.paintPlot(drawPlot);
    ws.render();
  }

  function sayFor(s, m, prev) {
    var vs = 'The hyphae now reach <b>' + ratioTxt(m.ratio) + ' times</b> as much soil as the hairs (' + sig(m.vf) + ' against ' + sig(m.vh) + ' cm³ per cm of root).';
    if (!prev) return 'Hairs reach <b>' + s.hair.toFixed(2) + ' mm</b>, hyphae <b>' + s.hyph.toFixed(1) + ' cm</b>. ' + vs + ' Reach went up 100 times; soil within reach went up 10,000 times, because the soil around a root is a cylinder: its volume grows with the reach squared.';
    if (prev.hair !== s.hair || prev.hyph !== s.hyph) {
      return (prev.hair !== s.hair ? 'You set the root hairs to <b>' + s.hair.toFixed(2) + ' mm</b>. ' : 'You set the hyphae to <b>' + s.hyph.toFixed(1) + ' cm</b>. ') + vs + ' Double a reach and the soil within it grows four times.';
    }
    if (prev.cost !== s.cost) {
      var sh = Math.round(m.share * 100);
      if (Math.abs(m.resp) < 0.03) return 'The plant pays <b>' + s.cost.toFixed(1) + ' units</b> of carbon. It now grows <b>no better</b> than a plant without the fungus, yet the fungus still delivers <b>' + sh + ' %</b> of its phosphate. A growth response near zero does not mean the fungus does nothing.';
      if (m.resp < 0) return 'The plant pays <b>' + s.cost.toFixed(1) + ' units</b> of carbon and in this model now grows <b>' + pct(m.resp) + '</b> compared with no fungus, while the fungus still delivers <b>' + sh + ' %</b> of its phosphate. A drop below zero is this model’s arithmetic; the papers cited below show the case where growth is no better.';
      return 'The plant pays <b>' + s.cost.toFixed(1) + ' units</b> of carbon. The growth gain is now <b>' + pct(m.resp) + '</b>, but the fungus still delivers <b>' + sh + ' %</b> of the phosphate: the cost changes growth, not the fungus’s share.';
    }
    if (prev.view !== s.view) return s.view === 'hair' ? 'Zoomed in to a block <b>6.5 mm</b> across. Now the hairs are visible, and the hyphal zone is far larger than this whole block.' : 'Zoomed out to a block <b>26 cm</b> across. The hairs shrink to a thin fuzz on the root, while the hyphae fill the soil.';
    if (prev.width !== s.width) return s.width ? 'Now the root’s own width (0.1 mm radius) counts: the root itself is not soil, so it is taken out. The hairs lose the most: the ratio is now <b>' + ratioTxt(m.ratio) + ' times</b>.' : 'Back to the simple rule: reach measured from the root’s centre line, volume = π × reach² × 1 cm. The ratio is <b>' + ratioTxt(m.ratio) + ' times</b>.';
    return vs;
  }

  function whyHtml() {
    var W = window.WS;
    return '<p><b>Why reach squared.</b> The soil a root can draw from is a cylinder around it. A cylinder of soil 1 cm long with radius r has a volume of π × r² × 1 cm. Make the radius 100 times larger, 1 mm to 10 cm, and the volume grows 100 × 100 = 10,000 times ' + W.badge('DERIVED', 'From the cylinder volume formula.') + '. Counting the root’s own width (a radius of 0.1 mm, an illustrative value ' + W.badge('ILLUSTRATIVE', 'A typical order of magnitude for a fine root, not a measurement.') + ') the gain for the same two reaches is about 8,350 times ' + W.badge('DERIVED', '(10.01² − 0.01²) / (0.11² − 0.01²), in mm squared.') + ': still close to four orders of magnitude.</p>' +
      '<p><b>Within reach is not the same as taken up.</b> Hyphae are thin and spread out, so they do not empty all the soil in that cylinder. The volume is the soil they can draw from, an upper limit. Phosphate moves so little that a root alone can only empty a thin shell around itself; hyphae carry the uptake out to where the phosphate is.</p>' +
      '<p><b>How far hyphae reach.</b> In one experiment, hyphae of the fungus <i>Acaulospora laevis</i> growing from subterranean clover roots kept a constant density up to 11 cm from the roots after 47 days ' + W.badge('MEASURED', 'Jakobsen, Abbott and Robson 1992.') + ' (Jakobsen, Abbott and Robson 1992, New Phytologist 120: 371, <a href="https://doi.org/10.1111/j.1469-8137.1992.tb01077.x" target="_blank" rel="noopener">doi 10.1111/j.1469-8137.1992.tb01077.x</a>). Root hair lengths in the slider are an order of magnitude only ' + W.badge('ILLUSTRATIVE', 'No source checked for root hair length.') + '.</p>' +
      '<p><b>The rent.</b> The plant pays the fungus with carbon from photosynthesis. If the rent is high, the plant can grow no better than one without the fungus. The surprise is what happens to phosphate: the fungus can be the main route of phosphate into the plant even when growth, or total phosphate uptake, does not differ from plants without the fungus (Smith, Smith and Jakobsen 2003, Plant Physiology 133: 16, <a href="https://doi.org/10.1104/pp.103.024380" target="_blank" rel="noopener">doi 10.1104/pp.103.024380</a>). A later review by the same group concludes that the fungal route may dominate phosphate uptake even in plants that do not grow better (Smith, Jakobsen, Grønlund and Smith 2011, Plant Physiology 156: 1050, <a href="https://doi.org/10.1104/pp.111.174581" target="_blank" rel="noopener">doi 10.1104/pp.111.174581</a>). So a growth response is not a measure of the fungus’s contribution.</p>' +
      '<p><b>Why the total can stay the same.</b> In a colonised root, the plant’s own uptake through its skin and hairs can be turned down, so the fungal route replaces it rather than adding to it (reviewed in Smith et al. 2011). The model here keeps 25 % of the root’s own uptake when the fungus is present ' + W.badge('ILLUSTRATIVE', 'An invented share.') + '.</p>' +
      '<p><b>What the model is.</b> Each route collects phosphate that rises with its soil volume and levels off (half supply at 0.1 cm³ for the root, 5 cm³ for the fungus); growth rises with phosphate and levels off; each carbon unit costs a fixed slice of growth. All of these are invented to show the direction ' + W.badge('ILLUSTRATIVE', 'Not fitted to data.') + '. When the growth difference falls below zero, that is the model’s arithmetic, not a result from the papers cited here. Only the volumes come from exact arithmetic.</p>';
  }

  /* ------------------------------------------------------------ 3D */
  function build3D(S) {
    var g = ws.gl;
    if (!g) return;
    var T = g.THREE;
    g.renderer.localClippingEnabled = true;
    var H = HALF;
    var clip = [new T.Plane(new T.Vector3(1, 0, 0), H), new T.Plane(new T.Vector3(-1, 0, 0), H), new T.Plane(new T.Vector3(0, 1, 0), H),
      new T.Plane(new T.Vector3(0, -1, 0), H), new T.Plane(new T.Vector3(0, 0, 1), H), new T.Plane(new T.Vector3(0, 0, -1), H)];
    var world = new T.Group(); g.root.add(world);

    /* soil: the block minus its top front quarter (y > 0, z > 0) */
    var soilM = new T.MeshStandardMaterial({ color: 0x998866, roughness: 1, transparent: true, opacity: 0.2, depthWrite: false, side: T.DoubleSide });
    var b1 = new T.Mesh(new T.BoxGeometry(2 * H, H, 2 * H), soilM); b1.position.set(0, -H / 2, 0); b1.renderOrder = 5;
    var b2 = new T.Mesh(new T.BoxGeometry(2 * H, H, H), soilM); b2.position.set(0, H / 2, -H / 2); b2.renderOrder = 5;
    world.add(b1); world.add(b2);
    var edgeM = new T.LineBasicMaterial({ color: 0x776655, transparent: true, opacity: 0.6 });
    [b1, b2].forEach(function (b) { var e = new T.LineSegments(new T.EdgesGeometry(b.geometry), edgeM); e.position.copy(b.position); world.add(e); });
    /* soil grains on the two cut faces */
    var gr = rng(7), gp = [];
    for (var i = 0; i < 900; i++) {
      var u = (gr() * 2 - 1) * H, v = gr() * H;
      if (i % 2) gp.push(u, 0.002, v); else gp.push(u, v, 0.002);
    }
    var grainG = new T.BufferGeometry(); grainG.setAttribute('position', new T.Float32BufferAttribute(gp, 3));
    var grainM = new T.PointsMaterial({ color: 0x6b5a44, size: 0.06, sizeAttenuation: true, transparent: true, opacity: 0.55, depthWrite: false });
    world.add(new T.Points(grainG, grainM));

    /* the root */
    var rootM = new T.MeshStandardMaterial({ color: 0xd8c48a, roughness: 0.6 });
    var root = new T.Mesh(new T.CylinderGeometry(1, 1, 2 * H, 28, 1, true), rootM);
    root.rotation.z = Math.PI / 2; world.add(root);

    /* tubes: hyphae, hairs */
    var unit = new T.CylinderGeometry(1, 1, 1, 6, 1, false);
    var hyphM = new T.MeshStandardMaterial({ color: 0x5487c3, roughness: 0.45, clippingPlanes: clip });
    var hyph = new T.InstancedMesh(unit, hyphM, NET.segs.length); world.add(hyph);
    var hairM = new T.MeshStandardMaterial({ color: 0x9a4320, roughness: 0.6, clippingPlanes: clip });
    var hairs = new T.InstancedMesh(unit, hairM, HAIRS.length); world.add(hairs);
    var sporeM = new T.MeshStandardMaterial({ color: 0xc9a845, roughness: 0.5, clippingPlanes: clip });
    var spores = new T.InstancedMesh(new T.SphereGeometry(1, 14, 10), sporeM, NET.spores.length); world.add(spores);

    /* zones: translucent cylinders of soil within reach */
    function zone(col, op) {
      var m = new T.MeshBasicMaterial({ color: col, transparent: true, opacity: op, side: T.DoubleSide, depthWrite: false, clippingPlanes: clip });
      var z = new T.Mesh(new T.CylinderGeometry(1, 1, 2 * H, 64, 1, true), m); z.rotation.z = Math.PI / 2; z.renderOrder = 6; world.add(z);
      return z;
    }
    var zF = zone(0x5487c3, 0.09), zH = zone(0x9a4320, 0.22);
    /* rings at the block faces mark the edges of each zone */
    function rings(col) {
      var pts = [];
      for (var k = 0; k <= 96; k++) { var a = k / 96 * Math.PI * 2; pts.push(new T.Vector3(0, Math.cos(a), Math.sin(a))); }
      var geo = new T.BufferGeometry().setFromPoints(pts), m = new T.LineBasicMaterial({ color: col, clippingPlanes: clip });
      var grp = new T.Group();
      [-H + 0.01, H - 0.01].forEach(function (x) { var l = new T.Line(geo, m); l.position.x = x; grp.add(l); });
      world.add(grp); return grp;
    }
    var rF = rings(0x5487c3), rH = rings(0x9a4320);

    /* moving particles: phosphate in (round), carbon out (square) */
    var dotTex = (function () {
      var c = document.createElement('canvas'); c.width = c.height = 32; var x = c.getContext('2d');
      x.beginPath(); x.arc(16, 16, 13, 0, Math.PI * 2); x.fillStyle = '#fff'; x.fill();
      var t = new T.CanvasTexture(c); return t;
    })();
    var NP = 70, NC = 60, pr = rng(31);
    function parts(n, mat) {
      var arr = [], pos = new Float32Array(n * 3);
      for (var k = 0; k < n; k++) arr.push({ ch: NET.chains[Math.floor(pr() * NET.chains.length)], t: pr(), v: 0.08 + pr() * 0.06 });
      var geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3));
      var pts = new T.Points(geo, mat); pts.renderOrder = 8; world.add(pts);
      return { arr: arr, pos: pos, geo: geo, pts: pts };
    }
    var pM = new T.PointsMaterial({ color: 0xc9a845, size: 0.16, map: dotTex, alphaTest: 0.5, sizeAttenuation: true, clippingPlanes: clip });
    var cM = new T.PointsMaterial({ color: 0x5f8a3c, size: 0.12, sizeAttenuation: true, clippingPlanes: clip });
    var P = parts(NP, pM), C = parts(NC, cM);

    var mtx = new T.Matrix4(), q = new T.Quaternion(), up = new T.Vector3(0, 1, 0), va = new T.Vector3(), vb = new T.Vector3(), dir = new T.Vector3(), mid = new T.Vector3(), scl = new T.Vector3();
    var wa = [0, 0, 0], wb = [0, 0, 0];
    function tube(mesh, i, a, b, r) {
      va.fromArray(a); vb.fromArray(b); dir.subVectors(vb, va); var L = dir.length();
      if (L < 1e-6) { mtx.makeScale(0, 0, 0); mesh.setMatrixAt(i, mtx); return; }
      dir.divideScalar(L); q.setFromUnitVectors(up, dir); mid.addVectors(va, vb).multiplyScalar(0.5); scl.set(r, L, r);
      mtx.compose(mid, q, scl); mesh.setMatrixAt(i, mtx);
    }
    var lastGeo = '';
    function rebuild(s) {
      var key = [s.hair, s.hyph, s.view, s.width].join('|');
      if (key === lastGeo) return; lastGeo = key;
      var k = wpc(s.view), rv = rootVis(s.view), close = s.view === 'hair';
      root.scale.set(rv, 1, rv);
      var rT = close ? 0.03 : 0.016;
      NET.segs.forEach(function (sg, i) {
        var en = NET.entries[sg.e];
        toWorld(sg.a, en, s, wa); toWorld(sg.b, en, s, wb);
        tube(hyph, i, wa, wb, sg.depth ? rT * 0.7 : rT);
      });
      hyph.instanceMatrix.needsUpdate = true;
      var hl = s.hair / 10 * k, hr = close ? 0.012 : 0.006;
      HAIRS.forEach(function (h, i) {
        var x = h.u * H, a = [x, h.cy * rv, h.sz * rv];
        var d = [h.tilt, h.cy, h.sz], l = Math.hypot(d[0], d[1], d[2]), L = hl * h.f;
        tube(hairs, i, a, [a[0] + d[0] / l * L, a[1] + d[1] / l * L, a[2] + d[2] / l * L], hr);
      });
      hairs.instanceMatrix.needsUpdate = true;
      NET.spores.forEach(function (si, i) {
        var sg = NET.segs[si]; toWorld(sg.b, NET.entries[sg.e], s, wa);
        mtx.compose(va.fromArray(wa), q.set(0, 0, 0, 1), scl.setScalar(close ? 0.25 : 0.05)); spores.setMatrixAt(i, mtx);
      });
      spores.instanceMatrix.needsUpdate = true;
      var rf = s.hyph * k, rh = rv + hl;
      zF.scale.set(rf, 1, rf); rF.scale.set(1, rf, rf);
      zF.visible = rF.visible = rf < H * 1.8;
      zH.scale.set(rh, 1, rh); rH.scale.set(1, rh, rh);
      pM.size = close ? 0.3 : 0.16; cM.size = close ? 0.24 : 0.12;
    }
    function placeParts(s) {
      var nc = Math.round(s.cost * 6);
      [P, C].forEach(function (G, gi) {
        G.arr.forEach(function (p, k) {
          var on = gi === 0 || k < nc;
          if (!on) { G.pos[k * 3] = 1e4; G.pos[k * 3 + 1] = 1e4; G.pos[k * 3 + 2] = 1e4; return; }
          chainAt(p.ch, p.t, s, wa);
          G.pos[k * 3] = wa[0]; G.pos[k * 3 + 1] = wa[1]; G.pos[k * 3 + 2] = wa[2];
        });
        G.geo.attributes.position.needsUpdate = true;
        G.geo.computeBoundingSphere();
      });
    }
    ws.on(function (s) {
      rebuild(s);
      rootM.color.set(WS.token(s.width ? 'ink2' : 'apo'));
      placeParts(s);
    });
    ws.onFrame(function (t, dt, s) {
      P.arr.forEach(function (p) { p.t -= dt * p.v; if (p.t < 0) p.t += 1; });
      C.arr.forEach(function (p) { p.t += dt * p.v * (0.6 + s.cost * 0.08); if (p.t > 1) p.t -= 1; });
      placeParts(s);
    });
    ws.onTheme(function (dark) {
      var c = function (n) { return new T.Color(WS.token(n)); };
      hyphM.color.copy(c('cool')); hairM.color.copy(c('warm')); sporeM.color.copy(c('cut'));
      zF.material.color.copy(c('cool')); zH.material.color.copy(c('warm'));
      rF.children[0].material.color.copy(c('cool')); rH.children[0].material.color.copy(c('warm'));
      soilM.color.copy(c(dark ? 'soil' : 'soil2')); soilM.opacity = dark ? 0.28 : 0.22;
      edgeM.color.copy(c('rule')); grainM.color.copy(c(dark ? 'soil2' : 'bark'));
      pM.color.copy(c('cut')); cM.color.copy(c('chl'));
      rootM.color.copy(c(ws.state.width ? 'ink2' : 'apo'));
      zF.material.opacity = dark ? 0.12 : 0.09;
    });
    rebuild(S); placeParts(S);
  }

  /* ------------------------------------------------------------ 2D fallback: a side view of the same model */
  function drawFallback(c, w, h, s) {
    var k = wpc(s.view), rv = rootVis(s.view);
    var top = 52, bot = 76, sc = Math.min(w - 20, h - top - bot) / (2 * HALF), cx = w / 2, cy = top + (h - top - bot) / 2;
    function X(x) { return cx + x * sc; } function Y(y) { return cy - y * sc; }
    c.fillStyle = WS.token('soil'); c.globalAlpha = 0.35; c.fillRect(X(-HALF), Y(HALF), 2 * HALF * sc, 2 * HALF * sc); c.globalAlpha = 1;
    c.strokeStyle = WS.token('rule'); c.strokeRect(X(-HALF), Y(HALF), 2 * HALF * sc, 2 * HALF * sc);
    c.save(); c.beginPath(); c.rect(X(-HALF), Y(HALF), 2 * HALF * sc, 2 * HALF * sc); c.clip();
    var rf = s.hyph * k, rh = rv + s.hair / 10 * k;
    c.fillStyle = WS.token('cool'); c.globalAlpha = 0.12; c.fillRect(X(-HALF), Y(rf), 2 * HALF * sc, 2 * rf * sc); c.globalAlpha = 1;
    c.strokeStyle = WS.token('cool'); c.lineWidth = 1;
    var a = [0, 0, 0], b = [0, 0, 0];
    NET.segs.forEach(function (sg) { toWorld(sg.a, NET.entries[sg.e], s, a); toWorld(sg.b, NET.entries[sg.e], s, b); c.beginPath(); c.moveTo(X(a[0]), Y(a[1])); c.lineTo(X(b[0]), Y(b[1])); c.stroke(); });
    c.fillStyle = WS.token('warm'); c.globalAlpha = 0.5; c.fillRect(X(-HALF), Y(rh), 2 * HALF * sc, 2 * rh * sc); c.globalAlpha = 1;
    c.fillStyle = WS.token(s.width ? 'ink2' : 'apo'); c.fillRect(X(-HALF), Y(rv), 2 * HALF * sc, Math.max(2, 2 * rv * sc));
    var cw = s.cost > 0 ? 1 + s.cost * 0.45 : 0, ar = Math.min(rf, HALF * 0.9) * sc;
    [-0.55, 0.05, 0.6].forEach(function (f, i) {
      var x = X(f * HALF), dirn = i % 2 ? 1 : -1;
      if (cw) arrow(c, x, cy + dirn * 4, x, cy + dirn * Math.max(14, ar * 0.6), WS.token('chl'), cw);
      arrow(c, x + 14, cy - dirn * Math.max(18, ar * 0.85), x + 14, cy - dirn * 6, WS.token('cut'), 2);
    });
    c.restore();
    c.font = '12px ' + WS.token('ui'); c.fillStyle = WS.token('ink');
    c.fillText('Side view. In: phosphate. Out: carbon, ' + s.cost.toFixed(1) + ' units', 10, h - bot + 18);
  }

  /* ------------------------------------------------------------ the linked scan: a cross section to scale */
  var DOTS = (function () { var r = rng(17), o = []; for (var i = 0; i < 260; i++) o.push({ a: r() * Math.PI * 2, f: Math.pow(r(), 0.6) }); return o; })();
  function drawScan(c, w, h, s) {
    var ui = WS.token('ui');
    c.fillStyle = WS.token('card2'); c.fillRect(0, 0, w, h);
    var top = 30, R = Math.max(30, Math.min((h - top) / 2 - 6, w * 0.3)), cx = R + 14, cy = top + (h - top) / 2;
    var pxcm = R / s.hyph;
    /* hyphal zone */
    c.fillStyle = WS.token('soil'); c.globalAlpha = 0.45; c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
    c.strokeStyle = WS.token('cool'); c.lineWidth = 1.5; c.setLineDash([4, 3]); c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);
    c.fillStyle = WS.token('cool');
    DOTS.forEach(function (d) { c.beginPath(); c.arc(cx + Math.cos(d.a) * d.f * R, cy + Math.sin(d.a) * d.f * R, 1.3, 0, Math.PI * 2); c.fill(); });
    /* the 3D block outline, if it fits */
    var bh = VIEWS[s.view].half * pxcm;
    var showBox = bh <= R * 0.98 && bh > 3;
    if (showBox) { c.strokeStyle = WS.token('ink2'); c.lineWidth = 1; c.setLineDash([2, 3]); c.strokeRect(cx - bh, cy - bh, 2 * bh, 2 * bh); c.setLineDash([]); }
    /* carbon out, phosphate in */
    var cw = s.cost > 0 ? 1 + s.cost * 0.45 : 0;
    [0.5, 2.6, 4.7].forEach(function (a0) {
      var ca = Math.cos(a0), sa = Math.sin(a0);
      if (cw) { arrow(c, cx + ca * R * 0.15, cy + sa * R * 0.15, cx + ca * R * 0.6, cy + sa * R * 0.6, WS.token('chl'), cw); }
      var b0 = a0 + 0.5, cb = Math.cos(b0), sb = Math.sin(b0);
      arrow(c, cx + cb * R * 0.85, cy + sb * R * 0.85, cx + cb * R * 0.25, cy + sb * R * 0.25, WS.token('cut'), 2);
    });
    /* centre: root and hairs, true size (usually under a pixel) */
    var rh = (A_CM + s.hair / 10) * pxcm;
    c.fillStyle = WS.token('warm'); c.beginPath(); c.arc(cx, cy, Math.max(1.6, rh), 0, Math.PI * 2); c.fill();
    /* inset */
    var ix0 = cx + R + 16, room = w - ix0 - 8;
    var ri = Math.max(18, Math.min((h - top) / 2 - 18, room / 2));
    var ix = ix0 + ri + Math.max(0, (room - 2 * ri) * 0.25), iy = cy - 4;
    var Mcm = 0.82 * ri / (A_CM + s.hair / 10), mag = Mcm / pxcm;
    c.strokeStyle = WS.token('ink2'); c.lineWidth = 1;
    c.beginPath(); c.moveTo(cx, cy - 3); c.lineTo(ix - ri * 0.7, iy - ri * 0.7); c.moveTo(cx, cy + 3); c.lineTo(ix - ri * 0.7, iy + ri * 0.7); c.stroke();
    c.save(); c.beginPath(); c.arc(ix, iy, ri, 0, Math.PI * 2); c.clip();
    c.fillStyle = WS.token('soil'); c.globalAlpha = 0.45; c.fillRect(ix - ri, iy - ri, 2 * ri, 2 * ri); c.globalAlpha = 1;
    var ra = A_CM * Mcm, rz = (A_CM + s.hair / 10) * Mcm;
    c.fillStyle = WS.token('warm'); c.globalAlpha = 0.22; c.beginPath(); c.arc(ix, iy, rz, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
    c.strokeStyle = WS.token('warm'); c.lineWidth = 1.2;
    for (var i = 0; i < 44; i++) { var an = i / 44 * Math.PI * 2 + 0.05 * Math.sin(i * 7), lf = 0.75 + 0.25 * ((i * 37) % 11) / 10;
      c.beginPath(); c.moveTo(ix + Math.cos(an) * ra, iy + Math.sin(an) * ra); c.lineTo(ix + Math.cos(an) * (ra + (rz - ra) * lf), iy + Math.sin(an) * (ra + (rz - ra) * lf)); c.stroke(); }
    c.fillStyle = WS.token(s.width ? 'ink2' : 'apo'); c.beginPath(); c.arc(ix, iy, Math.max(1.5, ra), 0, Math.PI * 2); c.fill();
    if (s.width) { c.strokeStyle = WS.token('paper'); c.lineWidth = 1; for (var hx = -ra; hx < ra; hx += 3) { c.beginPath(); c.moveTo(ix + hx, iy - ra); c.lineTo(ix + hx + ra, iy + ra); c.stroke(); } }
    var ibh = VIEWS.hair.half * Mcm;
    if (s.view === 'hair' && ibh < ri * 1.5) { c.strokeStyle = WS.token('ink2'); c.setLineDash([2, 3]); c.strokeRect(ix - ibh, iy - ibh, 2 * ibh, 2 * ibh); c.setLineDash([]); }
    c.restore();
    c.strokeStyle = WS.token('ink2'); c.lineWidth = 1; c.beginPath(); c.arc(ix, iy, ri, 0, Math.PI * 2); c.stroke();
    /* labels */
    c.font = '11px ' + ui; c.fillStyle = WS.token('ink2');
    c.fillText('model rendering, to scale', 8, 13);
    c.font = '12px ' + ui; c.fillStyle = WS.token('ink');
    c.textAlign = 'center';
    c.fillText('inset ×' + ratioTxt(mag), ix, Math.max(40, iy - ri - 5));
    c.fillText('root + hairs', ix, Math.min(h - 4, iy + ri + 14));
    c.textAlign = 'left';
    var hl = 'hyphae ' + s.hyph.toFixed(1) + ' cm', hw = c.measureText(hl).width;
    c.fillStyle = WS.token('card2'); c.globalAlpha = 0.85; c.fillRect(5, h - 19, hw + 6, 17); c.globalAlpha = 1;
    c.fillStyle = WS.token('ink'); c.fillText(hl, 8, h - 6);
    c.font = '11px ' + ui; c.fillStyle = WS.token('ink2');
    c.fillText((s.cost > 0 ? 'carbon out ' + s.cost.toFixed(1) + ' units' : 'no carbon paid') + ((showBox || s.view === 'hair') ? ' · dashed square: 3D block' : ''), 8, 26);
  }
  function arrow(c, x0, y0, x1, y1, col, lw) {
    var a = Math.atan2(y1 - y0, x1 - x0), hs = 4 + lw;
    c.strokeStyle = col; c.fillStyle = col; c.lineWidth = lw;
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1 - Math.cos(a) * hs * 0.8, y1 - Math.sin(a) * hs * 0.8); c.stroke();
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x1 - Math.cos(a - 0.45) * hs, y1 - Math.sin(a - 0.45) * hs); c.lineTo(x1 - Math.cos(a + 0.45) * hs, y1 - Math.sin(a + 0.45) * hs); c.closePath(); c.fill();
  }

  /* ------------------------------------------------------------ the linked plot */
  var SUP = { '-4': '10⁻⁴', '-3': '10⁻³', '-2': '0.01', '-1': '0.1', '0': '1', '1': '10', '2': '100', '3': '10³' };
  function relabel(sub) {
    Array.prototype.forEach.call(sub.querySelectorAll('.ws-ax text:not(.ws-axt)'), function (t) {
      var v = String(Math.round(+t.textContent.replace('−', '-')));
      if (SUP[v]) t.textContent = SUP[v];
    });
  }
  function drawPlot(svg, s) {
    var E = WS.svg, Wd = 384, Ht = 210, WL = 216;
    svg.setAttribute('viewBox', '0 0 ' + Wd + ' ' + Ht);
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var m = M.run(s);
    /* left: volume against reach, log log */
    var L = E('svg', { x: 0, y: 0, width: WL, height: Ht }, svg);
    var ax = WS.axes(L, { w: WL, h: Ht, x: [-1, 2.3], y: [-4, 3], xticks: [-1, 0, 1, 2], yticks: [-3, -1, 1, 3], xlabel: 'reach, mm (log)', ylabel: 'soil within reach, cm³', pad: { l: 44, r: 8, t: 16, b: 36 } });
    relabel(L);
    var lg = Math.log(10) , l10 = function (v) { return Math.log(v) / lg; };
    E('rect', { x: ax.x(-1), y: ax.box.y1, width: ax.x(l10(2)) - ax.x(-1), height: ax.box.y0 - ax.box.y1, 'class': 'np-hairb' }, ax.g);
    E('rect', { x: ax.x(l10(5)), y: ax.box.y1, width: ax.x(l10(120)) - ax.x(l10(5)), height: ax.box.y0 - ax.box.y1, 'class': 'np-hyphb' }, ax.g);
    ax.text(l10(0.42), 2.55, 'hairs', 'middle', 'np-sm');
    ax.text(l10(25), 2.55, 'hyphae', 'middle', 'np-sm');
    var pts = [];
    for (var lx = -1; lx <= 2.3001; lx += 0.05) pts.push([lx, l10(M.vol(Math.pow(10, lx) / 10, s.width))]);
    ax.path(pts, 'np-curve');
    var hx = l10(s.hair), hy = l10(m.vh), fx = l10(s.hyph * 10), fy = l10(m.vf);
    E('path', { d: 'M' + ax.x(hx) + ' ' + ax.y(hy) + 'H' + ax.x(fx) + 'V' + (ax.y(fy) + 6), 'class': 'np-brk', 'stroke-dasharray': '3 2' }, ax.g);
    var ex = l10(VIEWS[s.view].half * 10);
    if (ex <= 2.3) { ax.vline(ex, 'np-edge'); }
    E('circle', { cx: ax.x(hx), cy: ax.y(hy), r: 4.5, 'class': 'np-hairc' }, ax.g);
    E('rect', { x: ax.x(fx) - 4.5, y: ax.y(fy) - 4.5, width: 9, height: 9, 'class': 'np-hyphc' }, ax.g);
    var mx = ax.y(hy) - 6, tx = ax.x(fx) - 6, anc = 'end';
    var t = E('text', { x: tx, y: mx, 'text-anchor': anc, 'class': 'np-b' }, ax.g); t.textContent = '×' + ratioTxt(m.ratio);
    /* right: growth against carbon paid */
    var Rg = E('svg', { x: WL, y: 0, width: Wd - WL, height: Ht }, svg);
    var bx = WS.axes(Rg, { w: Wd - WL, h: Ht, x: [0, 10], y: [0, 1.2], xticks: [0, 5, 10], yticks: [0, 0.5, 1], xlabel: 'carbon paid, units', ylabel: 'growth, model units', pad: { l: 44, r: 8, t: 40, b: 36 } });
    var wp = [], np = [];
    for (var cc = 0; cc <= 10.001; cc += 0.5) { wp.push([cc, clamp(m.gWith0 - CU * cc, 0, 1.2)]); np.push([cc, m.gNo]); }
    bx.path(np, 'np-without');
    bx.path(wp, 'np-with');
    bx.vline(s.cost, 'ws-cursor');
    if (m.cZero >= 0 && m.cZero <= 10) E('circle', { cx: bx.x(m.cZero), cy: bx.y(m.gNo), r: 4, 'class': 'np-zero' }, bx.g);
    bx.dot(s.cost, clamp(m.gWith, 0, 1.2));
    var x0 = bx.box.x0;
    E('text', { x: x0, y: 11, 'class': 'np-b' }, Rg).textContent = 'fungal P share ' + Math.round(m.share * 100) + ' %';
    E('line', { x1: x0, x2: x0 + 16, y1: 24, y2: 24, 'class': 'np-with' }, Rg);
    E('text', { x: x0 + 19, y: 27.5, 'class': 'np-sm' }, Rg).textContent = 'with';
    E('line', { x1: x0 + 48, x2: x0 + 64, y1: 24, y2: 24, 'class': 'np-without' }, Rg);
    E('text', { x: x0 + 67, y: 27.5, 'class': 'np-sm' }, Rg).textContent = 'without';
  }

  /* ------------------------------------------------------------ registration */
  N.register('plant', {
    mount: function (host, st) {
      if (!window.WS || !window.WS.create) { host.innerHTML = '<p class="wp-nut-wait">The nutrient scene for this plate needs the workstation kit, which did not load.</p>'; return; }
      build(host);
      if (st && card) card.setSolute(st.solute);
    },
    update: function (st) {
      if (card && card.setSolute) card.setSolute(st.solute);
      if (ws) ws.kick();
    },
    unmount: function () { if (ws) ws.destroy(); ws = null; card = null; }
  });
  /* exposed for tests only */
  N._plantModel = M;
})();

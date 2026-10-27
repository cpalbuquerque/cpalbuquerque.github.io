/* The Water Path v8: n_organ.js (nutrient path, Plate III Organ): ① THE CHECKPOINT.
   A young root segment, cut open, as volumetric tissue. Three routes inward (walls, plasmodesmata,
   across membranes), the Casparian strip present or removed, four cargos. One control moves every pane:
   the 3D tissue with moving particles, a synthetic light microscope section at a draggable cut, and a
   profile of how much cargo gets how far, one line per route. After some play an OPEN panel appears.
   The model (cells, routes, particles, the scan painter) lives in n_checkpoint_model.js.
   Every share shown is ILLUSTRATIVE. Sources: see the Why fold and the OPEN panel. */
(function () {
  'use strict';
  var WP = window.WP, N = WP && WP.nutrient;
  if (!N) return;

  var ws = null, M = null, built = null, lastSol = null, dead = false;
  var MAP = { nitrate: 'nitrate', cadmium: 'cadmium', dye: 'dye' };
  var CARGO_NAME = { water: 'water', nitrate: 'nitrate', cadmium: 'cadmium', dye: 'the dye' };
  var ROUTE_NAME = { apo: 'through the walls', sym: 'through plasmodesmata', tm: 'across membranes' };

  function dark() { return window.WS && WS.isDark ? WS.isDark() : false; }
  function colors() {
    var d = dark();
    return {
      ink: WS.token('ink'), ink2: WS.token('ink2'), ui: WS.token('ui') || 'sans-serif', soil: WS.token('soil'),
      route: d ? { apo: '#e2b65c', sym: '#5fd0d6', tm: '#c9cfda' } : { apo: '#8a6416', sym: '#0b6e74', tm: '#3f4a5a' },
      dash: { apo: [], sym: [7, 4], tm: [2, 3] },
      cargoAll: d ? { water: '#7cb8ff', nitrate: '#6fd39a', cadmium: '#ff8a7a', dye: '#ff7ac8' } : { water: '#1f63c4', nitrate: '#1d7d43', cadmium: '#b3261e', dye: '#c2187a' },
      mem: d ? '#7fe0a8' : '#164a30', stop: d ? '#ff6b5b' : '#b3261e', stuck: d ? '#9a948a' : '#6b5d49',
      strip: d ? '#d0455c' : '#7a1f2b', sub: '#e2b31f'
    };
  }
  /* the scan sits on a bright field in both themes, so its own route and dot colours are the light ones */
  function scanColors(st) {
    var C = colors(), L = { apo: '#7a560f', sym: '#0b6e74', tm: '#3f4a5a' };
    var cg = { water: '#1f63c4', nitrate: '#1d7d43', cadmium: '#b3261e', dye: '#c2187a' };
    return { ink: C.ink, ink2: C.ink2, ui: C.ui, route: L, dash: C.dash, mem: '#164a30', stop: '#b3261e', stuck: '#6b5d49', cargo: cg[st.cargo], cargoKind: st.cargo };
  }

  /* ------------------------------------------------------------ words for "What just happened" */
  function verdict(st, tr) {
    var c = st.cargo, sub = tr && tr.subZone;
    var subT = sub ? ' This cut is in the older zone, where <b>suberin</b> coats the endodermis: the crossing there is slower still.' : '';
    if (st.route === 'apo') {
      if (st.strip === 'off') return 'With the strip removed, the walls lead straight into the middle. ' + (c === 'dye' ? 'Even <b>the dye</b> reaches the xylem' : 'The ' + c + ' reaches the xylem') + ' without crossing a single membrane, so nothing is checked.';
      var head = 'Through the <b>walls</b> (the <b>apoplast</b>), ' + CARGO_NAME[c] + ' runs inward until the <b>Casparian strip</b> blocks the wall at the endodermis. To go on, it must cross a cell <b>membrane</b>. ';
      var tail = {
        water: 'Water does, through <b>aquaporins</b> (water channels).',
        nitrate: 'A <b>carrier</b> protein checks the nitrate, then lets it in.',
        cadmium: 'Most cadmium is held back at the membrane. Only a little gets in.',
        dye: 'The dye cannot cross a membrane, so it stays out of the stele.'
      }[c];
      return head + tail + subT;
    }
    if (st.route === 'sym') {
      var ent = {
        water: 'Water gets in through aquaporins.',
        nitrate: 'A carrier checks the nitrate and lets it in.',
        cadmium: 'Most cadmium is kept out.',
        dye: 'The dye cannot get in at all, so it stops at the surface.'
      }[c];
      return 'Through <b>plasmodesmata</b> (tiny channels that link one cell to the next), the cargo first crosses one membrane, into a cell at the edge of the root. ' + ent + (c === 'dye' ? '' : ' After that it moves inside, cell to cell, so the strip makes no difference here' + (st.strip === 'off' ? ': removing it changed nothing.' : '.'));
    }
    if (st.route === 'tm') {
      var each = {
        water: 'Water passes each one through aquaporins.',
        nitrate: 'Nitrate is checked at each one, and fewer get through.',
        cadmium: 'Cadmium is stopped within the first few cells.',
        dye: 'The dye cannot cross even the first membrane.'
      }[c];
      return '<b>Across membranes</b>, the cargo leaves and enters every cell on the way: a membrane check at every wall. ' + each + (st.strip === 'off' ? ' Removing the strip changes nothing here: this route never used the walls.' : '') + subT;
    }
    /* all three */
    var a = st.strip === 'off' ? 'straight in, unchecked' : ({ water: 'stopped at the strip, then in through aquaporins', nitrate: 'stopped at the strip, then checked by a carrier', cadmium: 'stopped at the strip, mostly held back', dye: 'stopped at the strip, kept out' }[c]);
    var s = { water: 'in through one membrane', nitrate: 'checked once at the edge', cadmium: 'mostly kept out at the edge', dye: 'kept out at the surface' }[c];
    var t = { water: 'through every membrane', nitrate: 'checked at every wall', cadmium: 'stopped early', dye: 'kept out at the surface' }[c];
    return 'All three routes for ' + CARGO_NAME[c] + '. <b>Walls</b>: ' + a + '. <b>Plasmodesmata</b>: ' + s + '. <b>Membranes</b>: ' + t + '.' + subT;
  }
  var PAYOFF = 'The strip does not stop water. It stops one route. That compulsory membrane crossing is the only reason a root can choose.';

  /* ------------------------------------------------------------ the workstation */
  function build(host, gst) {
    var WSk = window.WS;
    var cargo0 = MAP[gst.solute] || 'water';
    lastSol = gst.solute;
    var B = WSk.badge;
    var cite = {
      naseer: '<a href="https://doi.org/10.1073/pnas.1205726109" target="_blank" rel="noopener">Naseer et al. 2012, PNAS 109: 10101</a>',
      gao: '<a href="https://doi.org/10.1126/science.adi5032" target="_blank" rel="noopener">Gao et al. 2023, Science 382: 464</a>',
      barb: '<a href="https://doi.org/10.1016/j.cell.2015.12.021" target="_blank" rel="noopener">Barberon et al. 2016, Cell 164: 447</a>',
      ho: '<a href="https://doi.org/10.1016/j.cell.2009.07.004" target="_blank" rel="noopener">Ho et al. 2009, Cell 138: 1184</a>',
      conn: '<a href="https://doi.org/10.1105/tpc.001263" target="_blank" rel="noopener">Connolly et al. 2002, Plant Cell 14: 1347</a>',
      steu: '<a href="https://doi.org/10.1093/jxb/49.322.775" target="_blank" rel="noopener">Steudle and Peterson 1998, J Exp Bot 49: 775</a>',
      buck: '<a href="https://doi.org/10.1104/pp.15.00731" target="_blank" rel="noopener">Buckley et al. 2015, Plant Physiol 168: 1616</a>'
    };
    ws = WSk.create(host, {
      title: '① The checkpoint',
      badge: 'ILLUSTRATIVE',
      what: 'A model of a young root, cut open so you can see inside. Water and minerals move from the soil (outside) to the <b>xylem</b>, the pipes in the middle, by three routes. One ring of cells, the <b>endodermis</b>, is the checkpoint.',
      todo: 'Pick a <b>Route</b> and a <b>Cargo</b>. Then switch the <b>Casparian strip</b> off and on, and watch where the moving dots stop. Drag the blue cut plane, or the <b>Cut</b> slider, to move the section.',
      thing: 'A model root drawn for this page, with a quarter cut away. Cells are drawn with gaps between them: the gaps are the <b>cell walls</b>. The dark red band in the endodermis walls is the <b>Casparian strip</b>. Particles are the cargo: circle water, triangle nitrate, square cadmium, diamond dye. A cross marks where a route is stopped.',
      scanCaption: '<b>Section at the cut.</b> A synthetic cross section made from the same model, styled like a stained slide under a light microscope: <b>model rendering, not an image</b>. The traced line is the active route, from the soil on the left to the middle; small rings are membrane crossings. ' + B('ILLUSTRATIVE', 'Cell sizes and shapes are invented.'),
      plotCaption: '<b>How far the cargo gets.</b> Share of the cargo that gets this far, from the soil (left) to the middle of the root (right), one line per route. A drop is a membrane that holds some back. ' + B('ILLUSTRATIVE', 'The shares are invented to show passes, held back and stopped. They are not data.'),
      why: whyHTML(cite),
      state: { route: 'apo', cargo: cargo0, strip: 'on', suberin: 'off', cut: -0.35 },
      camera: { dist: 6.6, theta: 1.0, phi: 1.12, target: [0, 0.05, 0], minDist: 2.2, maxDist: 15 }
    });
    var S = ws.state;
    ws.el.classList.add('ck');

    /* ---- controls */
    ws.choice({ key: 'route', label: 'Route', options: [['apo', 'Walls (apoplast)'], ['sym', 'Cell to cell (symplast)'], ['tm', 'Across membranes'], ['all', 'All three']] });
    ws.choice({ key: 'cargo', label: 'Cargo', options: [['water', 'Water'], ['nitrate', 'Nitrate'], ['cadmium', 'Cadmium'], ['dye', 'Dye tracer']] });
    ws.choice({ key: 'strip', label: 'Casparian strip', options: [['on', 'Present'], ['off', 'Removed']] });
    ws.choice({ key: 'suberin', label: 'Later suberin zone (upper part)', options: [['off', 'Hide'], ['on', 'Show']] });
    function zoneWords(v) { return v > M.Y_SUB ? 'upper part, older' + (S.suberin === 'on' ? ', suberin zone' : '') : (v < M.Y_HAIR ? 'lower part, root hair zone' : 'middle part'); }

    /* ---- 3D */
    var g = ws.gl, three = null;
    if (g) three = build3D(g, S);
    ws.three3 = three;
    ws.slice({ key: 'cut', axis: 'y', min: -M.H + 0.12, max: M.H - 0.12, size: [3.4, 3.4], label: 'Cut', fmt: zoneWords, hint: 'moves the section, the routes and the plot' });
    var key = document.createElement('div'); key.className = 'ck-key';
    ws.controls.appendChild(key);

    /* ---- the static fallback (no WebGL): the cut face square on */
    var flowsF = g ? null : [M.flow(18, 31), M.flow(18, 32), M.flow(18, 33)];
    ws.fallback(function (c, w, h, s) { var C = colors(), sc = scanColors(s); C.cargo = C.cargoAll[s.cargo]; C.cargoKind = s.cargo; C.stuck = sc.stuck; C.accent = WS.token('accent'); M.paintFace(c, w, h, s, flowsF, C); });

    /* ---- the scan, with an overlay for the moving dots */
    var scanBox = ws.el.querySelector('.ws-scan-c'), ov = document.createElement('canvas'), ovx = ov.getContext('2d'), scanGeo = null;
    ov.className = 'ck-scan-ov'; ov.setAttribute('aria-hidden', 'true'); scanBox.appendChild(ov);
    var flows2 = [M.flow(26, 11), M.flow(26, 12), M.flow(26, 13)];
    ws.paintScan(function (c, w, h, s) { scanGeo = M.paintScan(c, w, h, s, null, scanColors(s)); drawOverlay(); });
    function drawOverlay() {
      if (!scanGeo) return;
      var r = scanBox.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
      var W = Math.max(10, Math.round(r.width)), Hh = Math.max(10, Math.round(r.height));
      if (ov.width !== Math.round(W * dpr) || ov.height !== Math.round(Hh * dpr)) { ov.width = Math.round(W * dpr); ov.height = Math.round(Hh * dpr); ov.style.width = W + 'px'; ov.style.height = Hh + 'px'; }
      ovx.setTransform(dpr, 0, 0, dpr, 0, 0); ovx.clearRect(0, 0, W, Hh);
      ovx.save(); ovx.beginPath(); ovx.arc(scanGeo.cx, scanGeo.cy, scanGeo.Rp - 1, 0, Math.PI * 2); ovx.clip();
      var C = scanColors(S);
      flows2.forEach(function (f) { M.drawDots(ovx, f, scanGeo.cx, scanGeo.cy, scanGeo.s, scanGeo.rot, C); });
      ovx.restore();
    }

    /* ---- the plot */
    ws.paintPlot(function (svg, s) { paintPlot(svg, s); });

    /* ---- one change, every pane: rebuild the tracks when the route state changes */
    var sig = '';
    ws.on(function (s) {
      var k = [s.route, s.cargo, s.strip, s.suberin, s.cut.toFixed(3)].join('|');
      if (k !== sig) {
        sig = k;
        var list = s.route === 'all' ? ['apo', 'sym', 'tm'] : [s.route];
        flows2.forEach(function (f, i) {
          if (i >= list.length) { f.set(null); return; }
          f.set(M.build(list[i], 'scan', M.theta.S + (s.route === 'all' ? (i - 1) * 0.42 : 0), { y: s.cut, strip: s.strip === 'on', suberin: s.suberin === 'on', cargo: s.cargo }), 5);
        });
        if (three) three.update(s);
        if (flowsF) flowsF.forEach(function (f, i) {
          if (i >= list.length) { f.set(null); return; }
          var y = Math.max(-M.H + 0.12, Math.min(M.H - 0.12, s.cut + (s.route === 'all' ? (i - 1) * 0.34 : 0)));
          f.set(M.build(list[i], 'face', y, { strip: s.strip === 'on', suberin: s.suberin === 'on', cargo: s.cargo }), 6);
        });
        if (flowsF) setTimeout(function () { if (ws && !dead) ws.render(); }, 0);
        drawOverlay();
      }
      var tr = M.build(s.route === 'all' ? 'apo' : s.route, 'face', s.cut, { strip: s.strip === 'on', suberin: s.suberin === 'on', cargo: s.cargo });
      ws.say(verdict(s, tr));
      paintKey(key, s);
      played(s);
    });
    ws.onFrame(function (t, dt) {
      flows2.forEach(function (f) { f.step(dt); });
      drawOverlay();
      if (three) three.frame(dt);
    });
    ws.onTheme(function () { if (three) three.theme(); });

    /* ---- payoff line and the OPEN panel */
    var why = ws.el.querySelector('.ws-why');
    var pay = document.createElement('p'); pay.className = 'ck-pay'; pay.textContent = PAYOFF;
    ws.el.insertBefore(pay, why);
    var hint = document.createElement('p'); hint.className = 'ck-hint';
    hint.innerHTML = 'An open question is waiting. To see it, switch the strip off or on and try a second route.';
    ws.el.insertBefore(hint, why);
    var openP = document.createElement('aside'); openP.className = 'ck-open'; openP.hidden = true;
    openP.setAttribute('aria-labelledby', ws.id + '-open-t');
    openP.innerHTML = openHTML(cite, ws.id + '-open-t');
    ws.el.insertBefore(openP, why);
    var seen = { routes: {}, strip: false, s0: S.strip, open: false };
    function played(s) {
      seen.routes[s.route] = true;
      if (s.strip !== seen.s0) seen.strip = true;
      if (!seen.open && seen.strip && Object.keys(seen.routes).length >= 2) {
        seen.open = true; openP.hidden = false; hint.hidden = true;
        setTimeout(function () { if (!dead) ws.say(verdict(s, null) + ' <b>A new panel opened below the payoff line: an open question.</b>'); }, 160);
      }
    }
    ws.revealOpen = function () { seen.strip = true; seen.routes.apo = seen.routes.sym = true; played(S); };

    /* ---- the global solute: follow it where it maps; water is local */
    ws.on(function (s) {
      if (MAP[s.cargo] && WP.state.solute !== s.cargo && WP.state.cargo === 'nutrient') { lastSol = s.cargo; N.setSolute(s.cargo, false); }
    });
    ws.render();
  }

  function paintKey(el, s) {
    var C = colors(), d = { apo: '', sym: '7 4', tm: '2 3' }, out = '';
    var list = s.route === 'all' ? ['apo', 'sym', 'tm'] : [s.route];
    list.forEach(function (r) { out += '<span><svg viewBox="0 0 28 10" aria-hidden="true"><line x1="1" y1="5" x2="27" y2="5" stroke="' + C.route[r] + '" stroke-width="3" stroke-dasharray="' + d[r] + '"/></svg>' + ROUTE_NAME[r] + '</span>'; });
    var shp = { water: '<circle cx="6" cy="6" r="4.2"/>', nitrate: '<path d="M6 1.4 10.6 9.8H1.4Z"/>', cadmium: '<rect x="2" y="2" width="8" height="8"/>', dye: '<path d="M6 .8 10.6 6 6 11.2 1.4 6Z"/>' }[s.cargo];
    out += '<span><svg viewBox="0 0 12 12" aria-hidden="true"><g fill="' + C.cargoAll[s.cargo] + '" stroke="#fff" stroke-width="1">' + shp + '</g></svg>' + (s.cargo === 'dye' ? 'dye' : s.cargo) + '</span>';
    out += '<span><svg viewBox="0 0 12 12" aria-hidden="true"><circle cx="6" cy="6" r="4" fill="none" stroke="' + C.mem + '" stroke-width="1.6"/></svg>membrane crossing</span>';
    out += '<span><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 2 10 10M10 2 2 10" stroke="' + C.stop + '" stroke-width="2.2"/></svg>stopped</span>';
    el.innerHTML = '<span class="ck-key-k">Key</span>' + out;
  }

  /* ------------------------------------------------------------ the plot */
  function paintPlot(svg, s) {
    var C = colors(), P = { l: 40, r: 98, t: 50, b: 30 }, Wd = 360, Hd = 228;
    var ax = WS.axes(svg, { w: Wd, h: Hd, pad: P, x: [-0.16, 1], y: [0, 1.08], xticks: [], yticks: [0, 0.5, 1], xlabel: 'from the soil to the middle of the root', ylabel: 'share getting this far' });
    var bx = ax.box, el = WS.svg, bands = el('g', { 'class': 'ck-bands' });
    ax.g.parentNode.insertBefore(bands, ax.g);
    el('rect', { x: ax.x(-0.16), y: bx.y1, width: ax.x(0) - ax.x(-0.16), height: bx.y0 - bx.y1, 'class': 'ck-b-soil', 'data-ok-overlap': '1' }, bands);
    M.BANDS.forEach(function (b, i) {
      el('rect', { x: ax.x(b.x0), y: bx.y1, width: Math.max(0.5, ax.x(b.x1) - ax.x(b.x0)), height: bx.y0 - bx.y1, 'class': 'ck-b ck-b-' + b.id + (i % 2 ? ' ck-b-alt' : ''), 'data-ok-overlap': '1' }, bands);
    });
    /* band names above the plot, in two rows so the narrow ones do not collide */
    var names = [['soil', -0.08, 0], ['epid.', (M.BANDS[0].x0 + M.BANDS[0].x1) / 2, 1], ['cortex', (M.BANDS[1].x0 + M.BANDS[1].x1) / 2, 0], ['endodermis', (M.BANDS[2].x0 + M.BANDS[2].x1) / 2, 1], ['peri.', (M.BANDS[3].x0 + M.BANDS[3].x1) / 2 + 0.02, 0], ['stele', (M.BANDS[4].x0 + 1) / 2 + 0.04, 0]];
    names.forEach(function (n) { var t = el('text', { x: ax.x(n[1]), y: n[2] ? bx.y1 - 6 : bx.y1 - 20, 'text-anchor': 'middle', 'class': 'ck-bn' + (n[0] === 'endodermis' ? ' ck-bn-endo' : '') }, svg); t.textContent = n[0]; });
    var zt = el('text', { x: 4, y: 11, 'class': 'ck-zone' }, svg);
    zt.textContent = 'At the cut: ' + (s.cut > M.Y_SUB ? 'upper part' + (s.suberin === 'on' ? ', suberin zone' : '') : (s.cut < M.Y_HAIR ? 'lower part, root hair zone' : 'middle part')) + (s.strip === 'on' ? ', strip present' : ', strip removed');
    /* the endodermis and the strip */
    var xs = ax.x(M.xOf(M.R_MID));
    el('line', { x1: xs, x2: xs, y1: bx.y1, y2: bx.y0, 'class': 'ck-stripline' + (s.strip === 'on' ? '' : ' off'), stroke: C.strip, 'data-ok-overlap': '1' }, bands);
    /* one line per route: the active one bold */
    var routes = ['apo', 'sym', 'tm'], off = { apo: 0.014, sym: 0, tm: -0.014 }, ends = [];
    routes.forEach(function (r) {
      var pr = M.profile(r, { y: s.cut, strip: s.strip === 'on', suberin: s.suberin === 'on', cargo: s.cargo });
      var on = s.route === 'all' || s.route === r;
      var pts = pr.pts.map(function (p) { return [p[0], Math.max(0, p[1] + off[r])]; });
      var pa = ax.path(pts, 'ck-pl');
      pa.setAttribute('stroke', C.route[r]); pa.setAttribute('stroke-width', on ? 3 : 1.6);
      pa.setAttribute('stroke-dasharray', C.dash[r].join(' ')); pa.setAttribute('opacity', on ? 1 : 0.55);
      pa.setAttribute('stroke-linejoin', 'round');
      ends.push({ r: r, y: ax.y(pts[pts.length - 1][1]), on: on });
    });
    /* direct labels in the right margin, spread so they never overlap */
    ends.sort(function (a, b) { return a.y - b.y; });
    for (var i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 14) ends[i].y = ends[i - 1].y + 14;
    var over = ends[ends.length - 1].y - (bx.y0 + 4); if (over > 0) ends.forEach(function (e) { e.y -= over; });
    var lab = { apo: 'walls', sym: 'plasmodesmata', tm: 'membranes' };
    ends.forEach(function (e) {
      var t = el('text', { x: bx.x1 + 6, y: e.y + 4, 'class': 'ck-rl' + (e.on ? ' on' : ''), fill: C.route[e.r] }, svg); t.textContent = lab[e.r];
    });
  }

  /* ------------------------------------------------------------ the 3D tissue */
  function build3D(g, S) {
    var T = g.THREE, root = g.root, TH = M.theta;
    g.renderer.localClippingEnabled = false;
    var fill = new T.DirectionalLight(0xfff4e0, 0.32); fill.position.set(-4, 2, -3); g.scene.add(fill);
    var TIS = { epi: [0xb9, 0xc4, 0x8a], cor: [0xe8, 0xdf, 0xc0], endo: [0xd7, 0xa2, 0x5a], peri: [0xc6, 0xcf, 0x9c], par: [0xdf, 0xe5, 0xbf], phl: [0x93, 0xbf, 0x8a], xyl: [0x7f, 0xa6, 0xc4], ste: [0xdf, 0xe5, 0xbf] };
    var EXP = { epi: [0.3, 0.35], cor: [0.45, 0.62], endo: [0.28, 0.32], peri: [0.35, 0.4], par: [0.4, 0.45], phl: [0.4, 0.45], xyl: [0.18, 0.75], ste: [0.4, 0.45] };
    function sp(x, e) { return (x < 0 ? -1 : 1) * Math.pow(Math.abs(x), e); }
    var NU = 10, NV = 6;
    function addCell(B, c, grow, rgb) {
      var rc = (c.r0 + c.r1) / 2, hr = (c.r1 - c.r0) / 2 - M.GAP + grow, ha = (c.a1 - c.a0) / 2 - (M.GAP - grow) / Math.max(0.06, rc), hy = (c.y1 - c.y0) / 2 - M.GAP + grow;
      if (c.r0 === 0) { rc = c.r1 * 0.52; hr = c.r1 * 0.48 - M.GAP + grow; }
      var yc = (c.y0 + c.y1) / 2, am = (c.a0 + c.a1) / 2, ex = EXP[c.kind] || EXP.par, base = B.p.length / 3;
      var wob = (c.e - 0.5) * 0.08;
      for (var j = 0; j <= NV; j++) {
        var v = -Math.PI / 2 + Math.PI * j / NV, cv = Math.cos(v), sv = Math.sin(v);
        for (var i = 0; i <= NU; i++) {
          var u = 2 * Math.PI * i / NU, cu = Math.cos(u), su = Math.sin(u);
          var lx = sp(cv, ex[0]) * sp(cu, ex[1]), lz = sp(cv, ex[0]) * sp(su, ex[1]), ly = sp(sv, ex[0]);
          var r = rc + lx * hr * (1 + wob * ly), a = am + lz * ha, y = yc + ly * hy;
          B.p.push(r * Math.cos(a), y, r * Math.sin(a));
          var k = c.v * (0.96 + 0.08 * (lx * 0.5 + 0.5));
          B.c.push(rgb[0] / 255 * k, rgb[1] / 255 * k, rgb[2] / 255 * k);
        }
      }
      for (j = 0; j < NV; j++) for (i = 0; i < NU; i++) {
        var a0 = base + j * (NU + 1) + i, a1 = a0 + 1, b0 = a0 + NU + 1, b1 = b0 + 1;
        B.i.push(a0, b0, a1, a1, b0, b1);
      }
    }
    function geo(B, flip) {
      var G = new T.BufferGeometry();
      if (flip) for (var k = 0; k < B.i.length; k += 3) { var t = B.i[k + 1]; B.i[k + 1] = B.i[k + 2]; B.i[k + 2] = t; }
      G.setAttribute('position', new T.Float32BufferAttribute(B.p, 3));
      if (B.c) G.setAttribute('color', new T.Float32BufferAttribute(B.c, 3));
      G.setIndex(B.i); G.computeVertexNormals();
      return G;
    }
    /* winding check on one cell, so normals point out */
    var test = { p: [], c: [], i: [] }; addCell(test, M.cells.filter(function (c) { return c.kept && c.kind === 'cor'; })[0], 0, TIS.cor);
    var FLIP = (function () {
      var p = test.p, i = test.i, a = i[6 * (NU + 2)], b = i[6 * (NU + 2) + 1], c = i[6 * (NU + 2) + 2];
      var A = new T.Vector3(p[3 * a], p[3 * a + 1], p[3 * a + 2]), Bv = new T.Vector3(p[3 * b], p[3 * b + 1], p[3 * b + 2]), Cv = new T.Vector3(p[3 * c], p[3 * c + 1], p[3 * c + 2]);
      var n = new T.Vector3().crossVectors(Bv.clone().sub(A), Cv.clone().sub(A)), ctr = new T.Vector3();
      for (var k = 0; k < p.length; k += 3) ctr.add(new T.Vector3(p[k], p[k + 1], p[k + 2]));
      ctr.multiplyScalar(3 / p.length);
      return n.dot(A.clone().sub(ctr)) < 0;
    })();

    var cellsB = { p: [], c: [], i: [] }, subB = { p: [], c: [], i: [] };
    M.cells.forEach(function (c) {
      if (!c.kept) return;
      addCell(cellsB, c, 0, TIS[c.kind] || TIS.par);
      if (c.kind === 'endo' && (c.y0 + c.y1) / 2 > M.Y_SUB) addCell(subB, c, 0.0065, [0xe2, 0xb3, 0x1f]);
    });
    var cellMat = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.72, metalness: 0 });
    var cellMesh = new T.Mesh(geo(cellsB, FLIP), cellMat); root.add(cellMesh);
    var subMat = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.42, metalness: 0, emissive: 0x2a1c00 });
    var subMesh = new T.Mesh(geo(subB, FLIP), subMat); root.add(subMesh);

    /* the wall matrix behind the cells: the kept sector, set back a little, seen through the gaps */
    var wallMat = new T.MeshStandardMaterial({ color: 0x6f5c3e, roughness: 0.92, side: T.DoubleSide });
    root.add(new T.Mesh(sectorGeo(T, 0, M.R - 0.042, -M.H + 0.042, M.H - 0.042, 0.042), wallMat));

    /* the Casparian strip: a band in every radial and transverse wall of the endodermis, half way through it */
    var stripG = [], SW = M.STRIP_W, rm = M.R_MID, dA = M.GAP * 0.95 / rm;
    M.rows[M.IE].forEach(function (rw, j) {
      var kept = rw.cells.filter(function (c) { return c.kept; });
      kept.forEach(function (c) {
        var a = c.a0, a0 = a - dA, a1 = a + dA;
        if (Math.abs(a - TH.A) < 1e-6) { a0 = a; a1 = a + 2 * dA; }
        stripG.push(polarBox(T, rm - SW, rm + SW, a0, a1, rw.y0 - M.GAP, rw.y1 + M.GAP, 1));
      });
      var last = kept[kept.length - 1];
      stripG.push(polarBox(T, rm - SW, rm + SW, last.a1 - 2 * dA, last.a1, rw.y0 - M.GAP, rw.y1 + M.GAP, 1));
      if (j > 0) stripG.push(polarBox(T, rm - SW, rm + SW, TH.A, TH.B, rw.y0 - M.GAP * 0.9, rw.y0 + M.GAP * 0.9, 64));
    });
    var stripMat = new T.MeshStandardMaterial({ color: 0x7a1f2b, roughness: 0.5, emissive: 0x2a0408 });
    var stripMesh = new T.Mesh(merge(T, stripG), stripMat); root.add(stripMesh);

    /* root hairs */
    var hairs = [], hairTip = null, hb = 9;
    M.cells.forEach(function (c) {
      if (!c.kept || !c.hair) return;
      var am = (c.a0 + c.a1) / 2, yc = (c.y0 + c.y1) / 2, L = c.hair.len, pts = [];
      for (var k = 0; k <= 4; k++) {
        var f = k / 4, r = M.R - 0.01 + L * f, a = am + c.hair.bend * 0.3 * f * f, y = yc - c.hair.droop * f * f;
        pts.push(new T.Vector3(r * Math.cos(a), y, r * Math.sin(a)));
      }
      hairs.push(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 8, 0.017, 5, false));
      var d = Math.abs(am - (TH.A + 0.55));
      if (d < hb && yc < -0.6) { hb = d; hairTip = { p: pts[3], n: new T.Vector3(Math.cos(am), 0, Math.sin(am)) }; }
    });
    var hairMat = new T.MeshStandardMaterial({ color: 0xcfd6a6, roughness: 0.6 });
    if (hairs.length) root.add(new T.Mesh(merge(T, hairs), hairMat));

    /* face helpers: (r, y) on face A or B to world, pushed out of the face by off */
    var outA = new T.Vector3(Math.sin(TH.A), 0, -Math.cos(TH.A)), outB = new T.Vector3(-Math.sin(TH.B), 0, Math.cos(TH.B));
    function FA(r, y, off) { return new T.Vector3(r * Math.cos(TH.A), y, r * Math.sin(TH.A)).addScaledVector(outA, off == null ? 0.016 : off); }
    function FB(r, y, off) { return new T.Vector3(r * Math.cos(TH.B), y, r * Math.sin(TH.B)).addScaledVector(outB, off == null ? 0.016 : off); }

    /* ---- routes: a thin tube along each track, gate marks, and the particles */
    var routeG = new T.Group(); root.add(routeG);
    var C = colors();
    var memMat = new T.MeshBasicMaterial({ color: new T.Color(C.mem) });
    var stopMat = new T.MeshBasicMaterial({ color: new T.Color(C.stop) });
    var flows3 = [M.flow(34, 21), M.flow(34, 22), M.flow(34, 23)], tracks3 = [null, null, null];
    var MAXP = 34 * 3;
    var pg = new T.BufferGeometry();
    var pPos = new Float32Array(MAXP * 3), pCol = new Float32Array(MAXP * 3), pA = new Float32Array(MAXP);
    pg.setAttribute('position', new T.BufferAttribute(pPos, 3));
    pg.setAttribute('color', new T.BufferAttribute(pCol, 3));
    pg.setAttribute('alpha', new T.BufferAttribute(pA, 1));
    var texs = {};
    function glyphTex(kind) {
      if (texs[kind]) return texs[kind];
      var cv = document.createElement('canvas'); cv.width = cv.height = 64;
      var x = cv.getContext('2d');
      M.glyph(x, kind, 32, 32, 21); x.fillStyle = '#ffffff'; x.fill(); x.lineWidth = 6; x.strokeStyle = '#000000'; x.stroke();
      var t = new T.CanvasTexture(cv); texs[kind] = t; return t;
    }
    var pMat = new T.ShaderMaterial({
      uniforms: { map: { value: glyphTex('water') }, scale: { value: 400 }, size: { value: 0.095 } },
      vertexShader: 'attribute vec3 color; attribute float alpha; varying vec3 vC; varying float vA; uniform float scale; uniform float size;' +
        'void main(){ vC = color; vA = alpha; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = size * scale / -mv.z; gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform sampler2D map; varying vec3 vC; varying float vA;' +
        'void main(){ vec4 t = texture2D(map, gl_PointCoord); if (t.a * vA < 0.05) discard; gl_FragColor = vec4(vC * t.r + vec3(0.04) * (1.0 - t.r), t.a * vA); }',
      transparent: true, depthWrite: false
    });
    var points = new T.Points(pg, pMat); points.frustumCulled = false; points.renderOrder = 5; root.add(points);

    function trackCurve(tr, yoff) {
      var c = new T.Curve();
      c.getPoint = function (t, out) { var q = M.at(tr, t * tr.L); return (out || new T.Vector3()).copy(FA(q[0], q[1] + yoff, 0.012)); };
      return c;
    }
    function clearGroup(gp) { while (gp.children.length) { var o = gp.children.pop(); if (o.geometry) o.geometry.dispose(); if (o.material && o.material !== memMat && o.material !== stopMat) o.material.dispose(); } }
    var routeLabels = [];
    function update(s) {
      clearGroup(routeG); routeLabels = [];
      var C = colors(), list = s.route === 'all' ? ['apo', 'sym', 'tm'] : [s.route];
      flows3.forEach(function (f, i) {
        if (i >= list.length) { f.set(null); tracks3[i] = null; return; }
        var y = Math.max(-M.H + 0.12, Math.min(M.H - 0.12, s.cut + (s.route === 'all' ? (i - 1) * 0.34 : 0)));
        var tr = M.build(list[i], 'face', y, { strip: s.strip === 'on', suberin: s.suberin === 'on', cargo: s.cargo });
        tracks3[i] = tr; f.set(tr, 7);
        var tube = new T.Mesh(new T.TubeGeometry(trackCurve(tr, 0), Math.max(40, tr.pts.length * 8), 0.018, 6, false),
          new T.MeshBasicMaterial({ color: new T.Color(C.route[list[i]]), transparent: true, opacity: 0.9 }));
        routeG.add(tube);
        var v = 1, stopped = false;
        tr.gates.forEach(function (gt) {
          if (stopped) return;
          var p = tr.pts[gt.k], pos = FA(p[0], p[1], 0.016);
          if (gt.kind === 'mem' || gt.kind === 'suberin') {
            var ring = new T.Mesh(new T.TorusGeometry(0.03, 0.0065, 6, 18), memMat);
            ring.position.copy(pos); ring.lookAt(pos.clone().add(outA)); routeG.add(ring);
          } else if (gt.kind === 'pd') {
            var b = new T.Mesh(new T.SphereGeometry(0.012, 8, 6), new T.MeshBasicMaterial({ color: new T.Color(C.route[list[i]]) }));
            b.position.copy(pos); routeG.add(b);
          }
          v *= gt.p;
          if (v < 1e-4) {
            stopped = true;
            [1, -1].forEach(function (sg) {
              var bar = new T.Mesh(new T.BoxGeometry(0.17, 0.03, 0.014), stopMat);
              bar.position.copy(FA(p[0], p[1], 0.03)); bar.lookAt(bar.position.clone().add(outA)); bar.rotateZ(sg * Math.PI / 4);
              routeG.add(bar);
            });
          }
        });
        if (s.route === 'all') routeLabels.push({ text: { apo: 'walls', sym: 'plasmodesmata', tm: 'membranes' }[list[i]], p: FA(M.SOIL - 0.06, tr.pts[0][1] + 0.07, 0.02), n: outA, cls: 'ck-rt' });
      });
      pMat.uniforms.map.value = glyphTex(s.cargo);
      stripMesh.visible = s.strip === 'on';
      subMesh.visible = s.suberin === 'on';
      writePoints();
    }
    function writePoints() {
      var C = colors(), cc = new T.Color(C.cargoAll[S.cargo]), cs = new T.Color(C.stuck), n = 0;
      flows3.forEach(function (f) {
        f.each(function (q, p, a, rise) {
          if (n >= MAXP) return;
          var v = FA(q[0], q[1] + p.j * 0.016 + rise * 0.42, 0.024);
          pPos[3 * n] = v.x; pPos[3 * n + 1] = v.y; pPos[3 * n + 2] = v.z;
          var col = p.st === 'stuck' ? cs : cc;
          pCol[3 * n] = col.r; pCol[3 * n + 1] = col.g; pCol[3 * n + 2] = col.b; pA[n] = a; n++;
        });
      });
      for (var k = n; k < MAXP; k++) { pA[k] = 0; pPos[3 * k] = pPos[3 * k + 1] = pPos[3 * k + 2] = 0; }
      pg.attributes.position.needsUpdate = true; pg.attributes.color.needsUpdate = true; pg.attributes.alpha.needsUpdate = true;
      pg.setDrawRange(0, Math.max(1, n));
    }
    function frame(dt) { flows3.forEach(function (f) { f.step(dt); }); writePoints(); }
    function theme() {
      var C = colors();
      stripMat.color.set(C.strip); memMat.color.set(C.mem); stopMat.color.set(C.stop);
      if (S) update(S);
    }

    /* ---- labels on the 3D view (HTML, placed by projection, hidden when their face turns away) */
    var labHost = document.createElement('div'); labHost.className = 'ck-lab'; labHost.setAttribute('aria-hidden', 'true');
    labHost.innerHTML = '<svg></svg><p class="ck-age">top: older · bottom: younger, nearer the tip</p>';
    var glHost = ws.el.querySelector('.ws-gl'); glHost.appendChild(labHost);
    var lsvg = labHost.querySelector('svg');
    var up = new T.Vector3(0, 1, 0);
    var phl = M.cells.filter(function (c) { return c.kept && c.kind === 'phl' && c.y1 > M.H - 0.01; })[0];
    var ANCH = [
      { text: 'Casparian strip (lignin)', p: FA(M.R_MID, 1.08, 0.02), n: outA, cls: 'ck-l-strip', when: function (s) { return s.strip === 'on'; }, pri: 0 },
      { text: 'endodermis', p: FB(0.578, 0.95), n: outB, pri: 1 },
      { text: 'xylem', p: new T.Vector3(0.02, M.H, 0.02), n: up, pri: 2 },
      { text: 'cortex', p: FB(0.92, 1.18), n: outB, pri: 3 },
      { text: 'epidermis', p: FB(1.235, 1.38), n: outB, pri: 4, wide: true },
      { text: 'pericycle', p: FB(0.495, 0.62), n: outB, pri: 5, wide: true },
      { text: 'phloem', p: phl ? new T.Vector3(0.375 * Math.cos((phl.a0 + phl.a1) / 2), M.H, 0.375 * Math.sin((phl.a0 + phl.a1) / 2)) : new T.Vector3(0, M.H, 0), n: up, pri: 6, wide: true },
      { text: 'root hair', p: hairTip ? hairTip.p : FA(M.R + 0.2, -1), n: hairTip ? hairTip.n : outA, pri: 7, wide: true },
      { text: 'suberin lamellae (later)', p: FA(0.6, 1.34, 0.01), n: outA, cls: 'ck-l-sub', when: function (s) { return s.suberin === 'on'; }, pri: 8 },
      { text: 'soil', p: FA(M.SOIL - 0.1, -1.42, 0.02), n: null, pri: 9, wide: true }
    ];
    var spans = ANCH.map(function (a) { var e = document.createElement('span'); e.textContent = a.text; if (a.cls) e.className = a.cls; labHost.appendChild(e); return e; });
    var rtSpans = [];
    var v3 = new T.Vector3(), camP = new T.Vector3();
    function placeLabels() {
      var r = glHost.getBoundingClientRect(), Wd = r.width, Hd = r.height, narrow = Wd < 520;
      var cam = g.camera; cam.getWorldPosition(camP);
      var placed = [], lines = '';
      function tryPlace(e, sx, sy) {
        var w = e.offsetWidth || 60, h = e.offsetHeight || 18;
        var cands = [[12, -h - 4], [12, 4], [-w - 12, -h - 4], [-w - 12, 4], [12, -h - 22], [12, 22], [-w - 12, -h - 22], [-w - 12, 22]];
        for (var k = 0; k < cands.length; k++) {
          var x = sx + cands[k][0], y = sy + cands[k][1];
          if (x < 2 || y < 2 || x + w > Wd - 2 || y + h > Hd - 50) continue;
          var hit = false;
          for (var q = 0; q < placed.length && !hit; q++) { var P = placed[q]; hit = x < P.x + P.w + 3 && x + w + 3 > P.x && y < P.y + P.h + 2 && y + h + 2 > P.y; }
          if (!hit) { placed.push({ x: x, y: y, w: w, h: h }); return [x, y, w, h]; }
        }
        return null;
      }
      function one(a, e) {
        if ((a.when && !a.when(ws.state)) || (narrow && a.wide)) { e.style.display = 'none'; return; }
        if (a.n && a.n.dot(camP.clone().sub(a.p)) <= 0) { e.style.display = 'none'; return; }
        v3.copy(a.p).project(cam);
        if (v3.z > 1 || Math.abs(v3.x) > 1.05 || Math.abs(v3.y) > 1.05) { e.style.display = 'none'; return; }
        var sx = (v3.x + 1) / 2 * Wd, sy = (1 - v3.y) / 2 * Hd;
        e.style.display = ''; e.style.left = '0px'; e.style.top = '0px';
        var pl = tryPlace(e, sx, sy);
        if (!pl) { e.style.display = 'none'; return; }
        e.style.transform = 'translate(' + pl[0].toFixed(1) + 'px,' + pl[1].toFixed(1) + 'px)';
        var lx = pl[0] > sx ? pl[0] : pl[0] + pl[2], ly = pl[1] + pl[3] / 2;
        lines += '<line x1="' + sx.toFixed(1) + '" y1="' + sy.toFixed(1) + '" x2="' + lx.toFixed(1) + '" y2="' + ly.toFixed(1) + '"/><circle cx="' + sx.toFixed(1) + '" cy="' + sy.toFixed(1) + '" r="2.4"/>';
      }
      ANCH.forEach(function (a, i) { one(a, spans[i]); });
      while (rtSpans.length < routeLabels.length) { var e = document.createElement('span'); e.className = 'ck-rt'; labHost.appendChild(e); rtSpans.push(e); }
      rtSpans.forEach(function (e, i) { if (i >= routeLabels.length) { e.style.display = 'none'; return; } e.textContent = routeLabels[i].text; one(routeLabels[i], e); });
      lsvg.innerHTML = lines;
    }
    /* the kit renders on demand; place the labels after every render */
    var rr = g.renderer.render.bind(g.renderer);
    g.renderer.render = function (sc, cam) {
      var sz = g.renderer.getSize(new T.Vector2());
      pMat.uniforms.scale.value = sz.y / (2 * Math.tan(cam.fov * Math.PI / 360));
      rr(sc, cam);
      try { placeLabels(); } catch (e) { /* layout not ready */ }
    };
    return { update: update, frame: frame, theme: theme, dispose: function () { for (var k in texs) texs[k].dispose(); } };
  }

  /* a closed box in polar coordinates: r0..r1, a0..a1 (subdivided na times), y0..y1 */
  function polarBox(T, r0, r1, a0, a1, y0, y1, na) {
    var p = [];
    function P(r, a, y) { return [r * Math.cos(a), y, r * Math.sin(a)]; }
    function quad(A, B, C, D) { p.push.apply(p, A.concat(B, C, A, C, D)); }
    for (var k = 0; k < na; k++) {
      var aa = a0 + (a1 - a0) * k / na, ab = a0 + (a1 - a0) * (k + 1) / na;
      quad(P(r1, aa, y0), P(r1, ab, y0), P(r1, ab, y1), P(r1, aa, y1));
      quad(P(r0, ab, y0), P(r0, aa, y0), P(r0, aa, y1), P(r0, ab, y1));
      quad(P(r0, aa, y1), P(r1, aa, y1), P(r1, ab, y1), P(r0, ab, y1));
      quad(P(r1, aa, y0), P(r0, aa, y0), P(r0, ab, y0), P(r1, ab, y0));
    }
    quad(P(r0, a0, y0), P(r1, a0, y0), P(r1, a0, y1), P(r0, a0, y1));
    quad(P(r1, a1, y0), P(r0, a1, y0), P(r0, a1, y1), P(r1, a1, y1));
    var G = new T.BufferGeometry(); G.setAttribute('position', new T.Float32BufferAttribute(p, 3)); G.computeVertexNormals();
    return G;
  }
  /* the kept sector (a 270 degree slice of a cylinder) with its flat faces set back by off */
  function sectorGeo(T, r0, r1, y0, y1, off) {
    var TH = M.theta, p = [], nA = [-Math.sin(TH.A), Math.cos(TH.A)], nB = [Math.sin(TH.B), -Math.cos(TH.B)];
    function fa(r) { return [r * Math.cos(TH.A) + off * nA[0], r * Math.sin(TH.A) + off * nA[1]]; }
    function fb(r) { return [r * Math.cos(TH.B) + off * nB[0], r * Math.sin(TH.B) + off * nB[1]]; }
    var A1 = fa(r1), B1 = fb(r1), aS = Math.atan2(A1[1], A1[0]), aE = Math.atan2(B1[1], B1[0]);
    while (aS < TH.A - 0.5) aS += 2 * Math.PI; while (aE < aS) aE += 2 * Math.PI;
    var outline = [fa(0)], n = 72, k;
    for (k = 0; k <= n; k++) { var a = aS + (aE - aS) * k / n; outline.push([r1 * Math.cos(a), r1 * Math.sin(a)]); }
    outline.push(fb(0));
    function tri(a, b, c) { p.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); }
    var q = [0.35 * Math.cos(TH.A + 3 * Math.PI / 4 + Math.PI / 4), 0.35 * Math.sin(TH.A + 3 * Math.PI / 4 + Math.PI / 4)];
    [y0, y1].forEach(function (y) {
      for (var i = 0; i < outline.length; i++) {
        var a = outline[i], b = outline[(i + 1) % outline.length];
        tri([q[0], y, q[1]], [a[0], y, a[1]], [b[0], y, b[1]]);
      }
    });
    for (k = 1; k < outline.length - 2; k++) {
      var a2 = outline[k], b2 = outline[k + 1];
      tri([a2[0], y0, a2[1]], [b2[0], y0, b2[1]], [b2[0], y1, b2[1]]); tri([a2[0], y0, a2[1]], [b2[0], y1, b2[1]], [a2[0], y1, a2[1]]);
    }
    [[outline[0], outline[1]], [outline[outline.length - 2], outline[outline.length - 1]]].forEach(function (s) {
      var a = s[0], b = s[1];
      tri([a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]]); tri([a[0], y0, a[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]);
    });
    var G = new T.BufferGeometry(); G.setAttribute('position', new T.Float32BufferAttribute(p, 3)); G.computeVertexNormals();
    return G;
  }
  function merge(T, list) {
    var pos = [], nor = [];
    list.forEach(function (g) {
      var G = g.index ? g.toNonIndexed() : g;
      if (!G.attributes.normal) G.computeVertexNormals();
      pos.push(G.attributes.position.array); nor.push(G.attributes.normal.array);
      if (G !== g) G.dispose(); g.dispose();
    });
    function cat(arrs) { var n = 0; arrs.forEach(function (a) { n += a.length; }); var o = new Float32Array(n), k = 0; arrs.forEach(function (a) { o.set(a, k); k += a.length; }); return o; }
    var M2 = new T.BufferGeometry();
    M2.setAttribute('position', new T.BufferAttribute(cat(pos), 3)); M2.setAttribute('normal', new T.BufferAttribute(cat(nor), 3));
    return M2;
  }

  /* ------------------------------------------------------------ text */
  function whyHTML(c) {
    var B = WS.badge;
    return '<p><b>Three routes.</b> Through the <b>walls</b> (the <b>apoplast</b>): water and what it carries soak through the cell walls and the spaces between cells, outside every membrane. <b>Cell to cell</b> (the <b>symplast</b>): the cargo crosses one membrane into a cell, then moves inside from cell to cell through <b>plasmodesmata</b>, tiny channels through the walls. <b>Across membranes</b>: the cargo leaves and enters each cell on the way, crossing two membranes at every wall.</p>' +
      '<p><b>The strip.</b> The <b>Casparian strip</b> is a band in the radial and transverse walls of the endodermis. In Arabidopsis it is made of <b>lignin</b>, without suberin (' + c.naseer + '). Dirigent proteins directly mediate the lignin polymerisation that builds it (' + c.gao + '). Because the strip fills the wall, the wall route closes at the endodermis. From there inward, everything must cross a plasma membrane, and the transport proteins in that membrane decide what goes on.</p>' +
      '<p><b>The four cargos.</b> Water crosses membranes through <b>aquaporins</b>, water channels. Nitrate is taken in by <b>carrier</b> proteins; one of them, CHL1, works as a nitrate transporter (' + c.ho + '). Cadmium is not a nutrient: it gets into root cells through carriers for essential metals, such as the iron transporter IRT1 (' + c.conn + '). In this model most cadmium is held back at the membrane; that share is invented for the picture. The <b>dye tracer</b> stands for a dye that cannot cross membranes, so it can only use the walls.</p>' +
      '<p><b>Strip removed.</b> A thought experiment, like a mutant plant that cannot build the strip; changing lignin synthesis stops the strip forming (' + c.naseer + '). Then the walls lead straight into the stele and everything, the dye included, gets in unchecked.</p>' +
      '<p><b>Suberin is later, and separate.</b> Further from the tip, the endodermal cells become coated with <b>suberin lamellae</b>. Suberin is produced much too late to take part in Casparian strip formation (' + c.naseer + '). The coat is thought to switch the endodermis from an absorbing layer to a protective one (' + c.barb + '). In this model the coat only slows the crossing of the endodermal membrane and leaves the plasmodesmata open; that split is a simplification. ' + B('ILLUSTRATIVE', 'The suberin effect in this model is invented.') + '</p>' +
      '<p><b>Numbers.</b> Every share in the plot and every pass or stop of a particle is ' + B('ILLUSTRATIVE', 'Invented to show passes, held back and stopped.') + ' Cell sizes and the number of xylem poles (four here) are drawn for clarity; real roots differ between species.</p>' +
      '<details class="ck-exp"><summary>Expert depth</summary><p>In the composite transport model of the root, the three paths run in parallel and water exchanges rapidly between them (' + c.steu + '). The strip turns the wall path into a series element: past the endodermis, the wall path no longer offers a way round the membranes. So the selectivity of the whole root, for solutes, rests on the membrane transporters of the endodermis and the cells outside it. For water, the routes still work in parallel, and how the flow splits between them is open (see the panel above, once it appears).</p></details>';
  }
  function openHTML(c, tid) {
    var B = WS.badge, D = function (t) { return B('DERIVED', 'A model output of ' + t + ', not a measurement.'); };
    return '<p class="ck-open-k">' + B('OPEN') + ' <span>An open question</span></p>' +
      '<h4 id="' + tid + '">No measurement we found shows how radial water flow splits between the three routes.</h4>' +
      '<p>You just watched the routes one at a time. In a real plant, we found no measurement of how much of the water takes each one.</p>' +
      '<ul>' +
      '<li><b>The best numbers come from a model, and from leaves, not roots.</b> In a model of water flow outside the xylem in leaves of 14 species (' + c.buck + '), flow through the walls makes up 68 % of the conductance on average ' + D('Buckley et al. 2015') + ', and the path across membranes 19 % ' + D('Buckley et al. 2015') + ', or 6 % if the wall thickness seen in the light microscope is used ' + D('Buckley et al. 2015') + '. The model assumes that flow through plasmodesmata is negligible, so it gives the cell to cell route no share at all.</li>' +
      '<li><b>The answer hangs on a value that could not be estimated.</b> The model was far more sensitive to the size of the tiny water paths in the cell wall than to the membranes. Raising that pore radius from 3 to 10 nm raised the conductance by 668 % ' + D('Buckley et al. 2015') + '; lowering it from 3 to 0 nm cut it by 71 % ' + D('Buckley et al. 2015') + '. A fourfold rise in membrane water permeability, which aquaporins raise, added only 52 % ' + D('Buckley et al. 2015') + '. The authors list that pore radius among the values they could not estimate with confidence.</li>' +
      '<li><b>These are model outputs, not measurements.</b></li>' +
      '<li><b>We found no measurement of the symplastic share</b>, the part that goes through plasmodesmata, in any organ.</li>' +
      '<li><b>For roots,</b> the composite transport model treats the three paths as parallel, with a rapid exchange of water between them, and does not give a percentage split (' + c.steu + ').</li>' +
      '</ul>' +
      '<p class="ck-open-n">The three routes are textbook; the share of water on each is not known. Either way, in this model every solute that reaches the stele has crossed a membrane first, because the strip closes the walls.</p>';
  }

  /* ------------------------------------------------------------ styles */
  var css = '\
.ck .ck-lab{position:absolute;inset:0;pointer-events:none;overflow:hidden}\
.ck .ck-lab svg{position:absolute;inset:0;width:100%;height:100%}\
.ck .ck-lab line{stroke:var(--ink);stroke-width:1;opacity:.75}\
.ck .ck-lab circle{fill:var(--ink)}\
.ck .ck-lab span{position:absolute;left:0;top:0;font:500 12px/1.3 var(--ui);color:var(--ink);background:var(--wall);padding:1px 6px;border-radius:3px;white-space:nowrap;box-shadow:0 0 0 1px var(--rule2),0 1px 3px rgba(0,0,0,.18)}\
.ck .ck-lab span.ck-l-strip{font-weight:700;box-shadow:0 0 0 1.5px #7a1f2b,0 1px 3px rgba(0,0,0,.18)}\
.ck .ck-lab span.ck-l-sub{box-shadow:0 0 0 1.5px #b58500,0 1px 3px rgba(0,0,0,.18)}\
.ck .ck-lab span.ck-rt{font-style:italic}\
.ck .ck-age{position:absolute;left:8px;top:6px;margin:0;font:12px var(--ui);color:var(--ink2);background:var(--wall);padding:1px 6px;border-radius:3px;opacity:.92}\
.ck .ck-scan-ov{position:absolute;left:0;top:0;pointer-events:none}\
.ck .ck-key{flex:1 1 100%;display:flex;flex-wrap:wrap;align-items:center;gap:4px 14px;font-size:12.5px;color:var(--ink2);border-top:1px solid var(--rule2);padding-top:6px}\
.ck .ck-key span{display:inline-flex;align-items:center;gap:5px}\
.ck .ck-key svg{width:28px;height:12px}.ck .ck-key span svg[viewBox="0 0 12 12"]{width:13px;height:13px}\
.ck .ck-key-k{font-size:11px;letter-spacing:.08em;text-transform:uppercase}\
.ck .ck-bn{font-size:10.5px;fill:var(--ink2)}.ck .ck-bn-endo{font-weight:700;fill:var(--ink)}\
.ck .ck-b-soil{fill:var(--soil);opacity:.35}.ck .ck-b{fill:var(--card2);opacity:.6}.ck .ck-b-alt{fill:var(--card);opacity:.9}\
.ck .ck-b-endo{fill:#d7a25a;opacity:.35}\
.ck .ck-stripline{stroke-width:3}.ck .ck-stripline.off{stroke-dasharray:3 3;opacity:.6}\
.ck .ck-rl{font-size:11px}.ck .ck-zone{font-size:11px;fill:var(--ink)}.ck .ck-rl.on{font-weight:700}\
.ck .ck-pay{font-family:var(--disp);font-size:19px;line-height:1.35;margin:12px 0 4px;padding:10px 14px;border-left:5px solid #7a1f2b;background:var(--card);max-width:46em}\
.ck .ck-hint{font-size:13px;color:var(--ink2);margin:6px 0}\
.ck .ck-open{--ck-open:#6b1f99;border:2px dashed var(--ck-open);background:rgba(107,31,153,.06);border-radius:14px;padding:12px 18px 10px;margin:14px 0 6px;max-width:60em}\
.ck .ck-open[hidden]{display:none}\
.ck .ck-open-k{margin:0;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--ck-open);display:flex;align-items:center;gap:8px}\
.ck .ck-open h4{font-family:var(--disp);font-weight:400;font-size:22px;margin:6px 0 6px;color:var(--ink)}\
.ck .ck-open ul{margin:6px 0;padding-left:20px}.ck .ck-open li{margin:5px 0}\
.ck .ck-open-n{font-size:13.5px;color:var(--ink2);margin:6px 0 2px}\
:root[data-theme="dark"] .ck .ck-open{--ck-open:#dcb3ff;background:rgba(220,179,255,.07)}\
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]) .ck .ck-open{--ck-open:#dcb3ff;background:rgba(220,179,255,.07)}}\
:root[data-theme="dark"] .ck .ck-pay{border-left-color:#d0455c}\
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]) .ck .ck-pay{border-left-color:#d0455c}}\
.ck .ck-exp{margin-top:6px}.ck .ck-exp summary{cursor:pointer;font-weight:600;min-height:44px;display:flex;align-items:center}\
@media (max-width:699px){.ck .ck-lab span{font-size:11px;padding:0 4px}.ck .ck-age{display:none}.ck .ck-pay{font-size:17px}}';

  function addCss() { if (document.getElementById('ck-css')) return; var st = document.createElement('style'); st.id = 'ck-css'; st.textContent = css; document.head.appendChild(st); }

  N.register('organ', {
    mount: function (host, st) {
      dead = false;
      if (!window.WS || !window.WS.create) { host.innerHTML = '<p class="wp-nut-wait">The root checkpoint needs the workstation kit, which did not load.</p>'; return; }
      addCss();
      host.innerHTML = '<p class="wp-nut-wait">Loading the root checkpoint…</p>';
      N.load('checkpoint_model', function (err) {
        if (dead) return;
        M = window.WPCheckpoint;
        if (err || !M) { host.innerHTML = '<p class="wp-nut-wait">The root checkpoint could not load. The water plate still works: switch back to Water.</p>'; return; }
        host.innerHTML = '';
        try { build(host, st || WP.state); built = true; } catch (e) { console.error('checkpoint failed to build', e); host.innerHTML = '<p class="wp-nut-wait">The root checkpoint failed to start.</p>'; }
      });
    },
    update: function (st) {
      if (!ws) return;
      if (st.solute !== lastSol) { lastSol = st.solute; if (MAP[st.solute] && ws.state.cargo !== MAP[st.solute]) ws.set({ cargo: MAP[st.solute] }); }
      ws.kick();
    },
    unmount: function () { dead = true; if (ws && ws.three3) ws.three3.dispose(); if (ws) ws.destroy(); ws = null; built = null; }
  });
})();

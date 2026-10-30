/* Curious things II: "Breathing underwater: aerenchyma" (team curious, v20).
   One three.js r128 scene: a length of root cut open (a wedge removed), base at the top, tip at the bottom. Switch the
   soil between well aerated and waterlogged (stagnant) and watch cortex cells die and leave air channels (rice: LYSIGENOUS,
   present all the time and more under low oxygen, Yamauchi 2015). Crimson O₂ (molcolor.js) diffuses down the channels to
   the tip; living cells use some; where the root wall is not sealed it leaks out. The barrier to radial oxygen loss
   (mostly suberin, Shiono 2014) is a golden layer on the older part of the root that you can switch on and off.
   Linked panes: a live cross section at the slice you drag (2D), the O₂ profile from base to tip (with the other seal
   setting dashed), measured porosity bars, readout tiles, one "what just happened" line. A second small 2D view shows
   pressurised air flow in a water lily and a reed. Speed: PlaySpeed; click to freeze: ../freeze.js; reduced motion
   starts paused; no WebGL or ?ws=2d: the cross section fills the stage. Debug handle: window.AEW.
   The oxygen model is ILLUSTRATIVE (evidence 'ae.model'); measured porosities carry their own sources. */
(function () {
  'use strict';
  var CQ = window.CQ;
  var TAU = Math.PI * 2;
  function clamp(x, a, b) { return x < a ? a : (x > b ? b : x); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function sm(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function hash(i) { var x = Math.sin(i * 12.9898 + 4.1) * 43758.5453; return x - Math.floor(x); }
  var esc = CQ.esc, T_ = CQ.tag, B_ = CQ.badge, E_ = CQ.ev;

  /* ---------------------------------------------------------------- geometry of the model root */
  var YB = 4.4, YT = -4.0, YC = -3.3, YBAR = -1.5;   /* base, tip, end of the cortex cells, lower end of the seal */
  var NR = 6, R0 = 0.39, DR = 0.095, CW = 0.1, DY = 0.4, SPOKES = 10, BASE_GAS = 0.04;
  var WED = [0.5 - 0.8, 0.5 + 0.8];                   /* the cut away wedge, facing the default camera */
  function inWedge(a) { var d = Math.atan2(Math.sin(a - 0.5), Math.cos(a - 0.5)); return Math.abs(d) < 0.8; }
  var CELLS = [], RANK = [];
  (function () {
    var y, j, i;
    for (y = YB - 0.15; y > YC; y -= DY) {
      for (j = 0; j < NR; j++) {
        var r = R0 + j * DR, n = Math.round(TAU * r / CW);
        for (i = 0; i < n; i++) {
          var a = i / n * TAU + j * 0.13, sp = a / TAU * SPOKES, bridge = Math.abs(sp - Math.round(sp)) * TAU * r / SPOKES < CW * 0.55;
          var cand = j >= 1 && j <= 4 && !bridge;
          CELLS.push({ y: y, j: j, a: a, r: r, cand: cand, order: cand ? (Math.abs(j - 2.5) * 0.18 + hash(i * 7 + j * 31) * 0.8) / 1.08 : 9, L: 1, cut: inWedge(a) });
        }
      }
    }
  })();
  var PER = 0; CELLS.forEach(function (c) { if (c.cand && Math.abs(c.y - CELLS[0].y) < 1e-6) PER++; });
  var CELL_A = DR * CW / (Math.PI * 1.0);                /* one cell as a share of the cross section */
  function ageF(y) { return sm(YC + 0.2, YC + 3.6, y); } /* little aerenchyma near the tip */

  /* ---------------------------------------------------------------- species, conditions, drawn porosity */
  var POR = { rice: { aer: 0.23, stag: 0.35 }, wheat: { aer: 0.04, stag: 0.16 } };
  var S = { sp: 'rice', wet: false, seal: false, sealAuto: true, frozen: false, names: true, F: 0, Ft: 0, Bp: 0, clock: 0, slice: 0.3, said: '', newRoot: 0 };
  function targetP() { return POR[S.sp][S.wet ? 'stag' : 'aer']; }
  function killShare(p) { return clamp((p - BASE_GAS) / (CELL_A * PER), 0, 1); }   /* share of candidate cells that die at maturity */
  function cellDead(c) { if (!c.cand) return false; var k = S.F * killShare(targetP()) * (0.35 + 0.65 * ageF(c.y)); return c.order < k; }
  /* porosity of the drawing at height y (gas share of the cross section) */
  function porAt(y) { var k = S.F * killShare(targetP()) * (0.35 + 0.65 * ageF(y)); return BASE_GAS + CELL_A * PER * clamp(k, 0, 1); }
  function porNow() { return porAt(1.5); }
  function yOfSlice() { return lerp(YB - 0.3, YC + 0.1, S.slice); }

  /* ---------------------------------------------------------------- the oxygen model (ILLUSTRATIVE) */
  var A_RESP = 0.0222, LAMBDA = 0.1017;
  function sealAt(y) { return y > YBAR ? S.Bp : 0; }
  function leakAt(y, seal) { return S.wet ? LAMBDA * (1 - (seal == null ? sealAt(y) : (y > YBAR ? seal : 0))) : 0; }
  function profile(seal) {
    var N = 120, C = 1, out = [], leak = 0, resp = 0, ds = (YB - YT) / N;
    for (var i = 0; i <= N; i++) {
      var y = YB - i * ds, p = Math.max(0.03, porAt(y)), mr = A_RESP * (1 - p) / p, ml = leakAt(y, seal);
      out.push([y, C]);
      if (i < N) { var d = C * (1 - Math.exp(-(mr + ml) * ds)); resp += d * mr / (mr + ml || 1); leak += d * ml / (mr + ml || 1); C -= d; }
    }
    return { pts: out, tip: C, leak: leak, resp: resp };
  }

  /* ---------------------------------------------------------------- parts (about 40 words each) */
  function partText(id) {
    switch (id) {
      case 'epi': return ['Epidermis', 'The root’s outer skin', 'The single layer of cells on the outside of the root; root hairs grow from it. In waterlogged soil it is surrounded by water, and gases move about ten thousand times more slowly through water than through air.', 'ae.slow'];
      case 'outer': return ['Outer cell layers', 'Just inside the skin', 'A few tightly packed cell layers under the epidermis. In rice in stagnant water their walls fill with suberin and become a seal against oxygen loss. Without the seal, oxygen leaks out into the wet soil.', 'ae.suberin'];
      case 'barrier': return ['Barrier to radial oxygen loss', 'Outer layers of the older root', 'A seal, mostly suberin, a waxy wall material, that stops oxygen leaking sideways out of the root. In long rice roots it was well formed within 24 h of stagnant water. The tip is left unsealed.', 'ae.barrier'];
      case 'cortex': return ['Cortex cell', 'Between the skin and the centre', 'A living cell that stores food and passes water inward, and uses oxygen to respire. In rice some cortex cells die on purpose and break down, leaving air channels; the cells left form spokes that hold the root together.', 'ae.rice'];
      case 'lacuna': return ['Air channel (aerenchyma)', 'In the cortex, along the root', 'A long gas filled space left where cortex cells died. The channels run from the shoot to near the tip, so oxygen moves down through air, not water. In rice in stagnant water, gas was 29 to 41 % of the root volume.', 'ae.ricepor'];
      case 'stele': return ['Stele', 'The centre of the root', 'The central cylinder that holds the xylem, which carries water up, and the phloem, which brings sugar down, wrapped in the endodermis, an inner skin of cells. Its living cells need oxygen too, and get it from the air channels around them.', null];
      case 'tip': return ['Root tip', 'The growing end', 'Where new cells are made and the root pushes on. It is farthest from the shoot. In rice, aerenchyma is barely formed near the tip and there is no seal, so this is where the root loses the most oxygen.', 'ae.cortex'];
      case 'o2': return ['Oxygen, O₂', 'Moving down the air channels', 'Oxygen from the shoot, drawn crimson. It spreads down the air channels by diffusion. Living cells along the way use some, and some leaks out where the root wall is not sealed. The rest reaches the tip.', 'ae.model'];
      case 'soil': return S.wet ? ['Waterlogged soil', 'All around the root', 'Water fills the spaces between the grains. Gases move about ten thousand times more slowly through water than through air, so little oxygen reaches the root from outside, and oxygen that leaks out is lost.', 'ae.slow'] :
        ['Drained soil', 'All around the root', 'Air fills the spaces between the grains, so the root can also take oxygen straight from the soil. The air channels matter most when the soil floods.', 'ae.slow'];
    }
    return null;
  }

  /* ---------------------------------------------------------------- markup */
  function markup() {
    return '<section class="ws3" id="ae-ws" aria-label="Aerenchyma: air channels in a flooded root">' +
      '<p class="w-what">This is a piece of a <b>root</b>, cut open so you can see inside. Its outer part, the <b>cortex</b>, is made of living cells that need oxygen. In the middle is the <b>stele</b>, which holds the water pipes. <b>Oxygen</b> (crimson) comes down from the leaves and stem above.</p>' +
      '<p class="w-todo"><b>What to do:</b> pick <b>Rice</b> or <b>Wheat</b>. Switch the soil from <b>Well aerated</b> to <b>Waterlogged</b> and watch air channels open in the cortex. In flooded rice the seal turns on by itself. Then turn the <b>seal</b> off and on: does the oxygen leak out, or reach the tip? Drag the <b>slice</b> to cut the root at another height. Click the view to pause or play; a click on a part tells you what it is.</p>' +
      '<div class="w-grid">' +
      '<div class="w-3d"><div class="w-stage aq" id="ae-stage"><div class="w-gl" role="img" aria-label="A root cut open, with air channels, the seal and oxygen moving to the tip"></div><div class="w-tags" aria-hidden="true"></div>' +
      '<p class="w-key" aria-hidden="true"><i style="background:#c7cf9a"></i>living cortex cell <i style="background:#8a6a3a"></i>dying cell <i style="background:#e0b44c"></i>seal (suberin) <i style="background:#e8d9a8"></i>stele</p>' +
      '<div class="w-panel" role="region" aria-live="polite" hidden></div></div>' +
      '<div class="w-bar"><button type="button" class="w-b" data-a="pause" aria-pressed="false">Pause</button><button type="button" class="w-b" data-a="step" hidden>Step</button>' +
      '<button type="button" class="w-b" data-a="names" aria-pressed="true">Names</button><button type="button" class="w-b" data-a="zin" aria-label="Zoom in">+</button><button type="button" class="w-b" data-a="zout" aria-label="Zoom out">−</button><button type="button" class="w-b" data-a="home">Reset view</button></div>' +
      (window.WPMolColor ? WPMolColor.key(['o2']) : '') + '</div>' +
      '<div class="w-side">' +
      '<div class="w-modes" role="group" aria-label="Plant"><button type="button" data-sp="rice" aria-pressed="true">RICE<i>a wetland crop</i></button><button type="button" data-sp="wheat" aria-pressed="false">WHEAT<i>a dryland crop</i></button></div>' +
      '<div class="w-modes" role="group" aria-label="Soil"><button type="button" data-wet="0" aria-pressed="true">WELL AERATED<i>air in the soil</i></button><button type="button" data-wet="1" aria-pressed="false">WATERLOGGED<i>stagnant water</i></button></div>' +
      '<div class="w-c"><label class="w-sw"><input type="checkbox" id="ae-seal"> Seal the outer root (barrier to oxygen loss)</label><div class="h">A golden layer of suberin on the older part of the root. The tip stays open ' + E_('ae.barrier', 'Shiono 2011') + '</div></div>' +
      '<div class="w-c"><label for="ae-slice">Slice <output id="ae-slice-o"></output></label><input type="range" id="ae-slice" min="0" max="1000" value="300"><div class="h">Cuts the root across, in 3D and in the cross section below, from near the base to near the tip.</div></div>' +
      '<p class="w-now" aria-live="polite"><b>What just happened:</b> <span id="ae-now">A rice root in drained soil. Even here rice has some air channels: it makes them all the time.</span></p>' +
      '<div class="w-cnt">' +
      '<div class="w-t"><span>Air space, drawn ' + B_('ILLUSTRATIVE') + '</span><b id="ae-r-por">23 %</b><small id="ae-r-por2"></small></div>' +
      '<div class="w-t"><span>Measured</span><b id="ae-r-mea">20 to 26 %</b><small id="ae-r-mea2"></small></div>' +
      '<div class="w-t"><span>O₂ reaching the tip ' + B_('ILLUSTRATIVE') + '</span><b id="ae-r-tip"></b><small>of the O₂ that enters at the top</small></div>' +
      '<div class="w-t"><span>O₂ leaking out ' + B_('ILLUSTRATIVE') + '</span><b id="ae-r-leak"></b><small id="ae-r-leak2"></small></div>' +
      '</div>' +
      '<div class="w-c"><label for="ae-part">Name a part</label><select id="ae-part"><option value="">Pick a part to read about it</option><option value="epi">Epidermis</option><option value="outer">Outer cell layers</option><option value="barrier">Barrier to oxygen loss</option><option value="cortex">Cortex cell</option><option value="lacuna">Air channel</option><option value="stele">Stele</option><option value="tip">Root tip</option><option value="o2">Oxygen</option><option value="soil">Soil</option></select></div>' +
      '</div></div>' +
      '<div class="w-row2">' +
      '<div><canvas class="w-cv" id="ae-scan" role="img" aria-label="Live cross section of the root at the slice"></canvas>' +
      '<p class="cap">The cross section at the slice, drawn live from the 3D model. Empty spaces are air channels; the golden ring is the seal. Model rendering, not a micrograph ' + B_('ILLUSTRATIVE') + '</p></div>' +
      '<div><canvas class="w-cv" id="ae-plot" role="img" aria-label="Oxygen along the root from base to tip"></canvas>' +
      '<p class="cap">Oxygen in the air channels from the base of the root to the tip, as a share of what enters at the top. Solid: now. Dashed: the other seal setting. A teaching model, not a measurement ' + E_('ae.model', 'Model') + '</p></div>' +
      '</div>' + porosityFig() + whyFold() + '</section>' + boxes();
  }
  function porosityFig() {
    return '<figure class="cq-box" id="ae-por" style="margin-top:12px"><h3>How much of a root is air?</h3><p class="sub">Measured root porosity, the share of the root volume that is gas. The bar for the plant and soil you chose is outlined; the diamond marks the value used in the 3D drawing.</p><svg class="cq-fig" id="ae-por-svg" viewBox="0 0 640 250" role="img" aria-label="Bars of measured root porosity for rice, wheat, sea barley, sponge gourd and wetland species"></svg>' +
      '<figcaption class="cap">Rice ' + T_('ae.ricepor') + ' Wheat and sea barley ' + T_('ae.wheat') + ' Sponge gourd ' + T_('ae.luffa') + ' Wetland species ' + T_('ae.55') + '</figcaption></figure>';
  }
  var BARS = [
    { id: 'rice-aer', t: 'Rice, aerated', a: 20, b: 26 }, { id: 'rice-stag', t: 'Rice, stagnant', a: 29, b: 41 },
    { id: 'wheat-aer', t: 'Wheat, aerated', a: null, b: null, note: 'not in our sources; drawn low' }, { id: 'wheat-stag', t: 'Wheat, stagnant', a: 16, b: 16 },
    { id: 'hm', t: 'Sea barley, stagnant', a: 19, b: 25 }, { id: 'luffa', t: 'Sponge gourd, flooded', a: 11, b: 45 }, { id: 'wet', t: 'Many wetland species', a: 0, b: 55, upto: true }
  ];
  function drawPor() {
    var svg = document.getElementById('ae-por-svg'); if (!svg) return;
    var L = 170, Wd = 440, x = function (v) { return L + v / 60 * Wd; }, cur = S.sp + '-' + (S.wet ? 'stag' : 'aer'), g = '';
    [0, 10, 20, 30, 40, 50, 60].forEach(function (v) { g += '<line x1="' + x(v) + '" x2="' + x(v) + '" y1="8" y2="222" stroke="currentColor" opacity=".15"/><text x="' + x(v) + '" y="240" font-size="12" text-anchor="middle" fill="currentColor">' + v + ' %</text>'; });
    BARS.forEach(function (b, i) {
      var y = 14 + i * 30, on = b.id === cur;
      g += '<text x="' + (L - 8) + '" y="' + (y + 13) + '" font-size="13" text-anchor="end" fill="currentColor" font-weight="' + (on ? 700 : 400) + '">' + b.t + '</text>';
      if (b.a == null) g += '<text x="' + (L + 6) + '" y="' + (y + 13) + '" font-size="12" font-style="italic" fill="currentColor" opacity=".8">' + b.note + '</text>';
      else if (b.a === b.b) g += '<rect x="' + (x(b.a) - 3) + '" y="' + (y + 2) + '" width="6" height="14" fill="var(--accent)"/>';
      else g += '<rect x="' + x(b.a) + '" y="' + (y + 2) + '" width="' + (x(b.b) - x(b.a)) + '" height="14" rx="3" fill="var(--accent)" opacity="' + (b.upto ? 0.35 : 0.75) + '"/>' + (b.upto ? '<text x="' + (x(b.b) + 6) + '" y="' + (y + 13) + '" font-size="12" fill="currentColor">up to 55 %</text>' : '');
      if (on) g += '<rect x="' + (L - 160) + '" y="' + (y - 3) + '" width="' + (Wd + 165) + '" height="24" rx="5" fill="none" stroke="currentColor" stroke-width="1.6"/>';
      if (on) { var p = porNow() * 100; g += '<path d="M' + x(p) + ' ' + (y + 1) + 'l7 8l-7 8l-7 -8z" fill="var(--b-ill)" stroke="var(--wall)"/>'; }
    });
    svg.innerHTML = '<g style="color:var(--ink)">' + g + '</g>';
  }
  function whyFold() {
    return '<details class="why" id="ae-why"><summary>Why does this happen?</summary><ul>' +
      '<li><b>Roots drown without air.</b> Root cells need oxygen to respire, like we do. Gases move about 10,000 times more slowly through water than through air ' + T_('ae.slow') + ', so when water fills the soil, little oxygen reaches the root from outside.</li>' +
      '<li><b>Build a pipe.</b> <b>Aerenchyma</b> is plant tissue with large air spaces. In rice, cortex cells die on purpose and break down (<b>lysigenous</b> aerenchyma, from Greek for dissolving). Rice does this all the time, and more when oxygen runs short ' + T_('ae.rice') + '. In 12 rice types, gas was 20 to 26 % of the root in aerated solution and 29 to 41 % in stagnant solution ' + T_('ae.ricepor') + '. In many wetland species it can reach 55 % ' + T_('ae.55') + '.</li>' +
      '<li><b>Seal the pipe.</b> Oxygen moving down a root can leak sideways into the wet soil. Rice builds a <b>barrier to radial oxygen loss</b> in the outer layers of the older root; in long roots it was well formed within 24 h ' + T_('ae.barrier') + '. It is made mostly of suberin, a waxy wall material ' + T_('ae.suberin') + '. The tip stays open, and that is where rice loses the most oxygen ' + T_('ae.cortex') + '.</li>' +
      '<li><b>Why wheat struggles.</b> In stagnant solution wheat roots held 16 % gas and made only a weak seal; wheat shoots grew to only 40 % of their aerated size ' + T_('ae.wheat') + '.</li>' +
      '<li class="tier-2"><b>A death on purpose.</b> Short of oxygen, the root makes the gas ethylene, which tells chosen cortex cells to die in a set pattern, a programmed cell death ' + T_('ae.ethylene') + '. A burst of reactive oxygen, made on purpose by an enzyme in the cell membrane, is part of the signal ' + T_('ae.ros') + '. The seal and the channels answer to different signals ' + T_('ae.signals') + '.</li>' +
      '<li class="tier-2"><b>A cheaper root.</b> Fewer living cells means less oxygen and energy spent to keep the root alive ' + T_('ae.cheap') + '. Maize starved of nitrogen or phosphorus makes air channels even in well aerated solution ' + T_('ae.nutr') + '.</li>' +
      '</ul></details>' +
      '<details class="why tier-3" id="ae-expert"><summary>Expert: the details behind the drawing</summary><ul>' +
      '<li><b>Rice types.</b> The 12 types were 7 upland, 3 paddy and 2 deep water rices grown 30 days; a tight barrier formed in the basal zone in 10 of the 12 ' + T_('ae.ricepor') + '. In short rice roots the barrier took longer than 48 h ' + T_('ae.barrier') + '.</li>' +
      '<li><b>Seedlings in 7 days.</b> Rice, wheat and maize seedlings all raised the aerenchyma share of the cortex in stagnant conditions; rice has a wider cortex, so more room for gas spaces ' + T_('ae.cortex') + '.</li>' +
      '<li><b>Packing alone.</b> Even with no channels, how cells are stacked sets how much gas a root holds: about 9 % for tightly packed round cells in a geometry model, and more for looser stacking. Real cells are not perfect spheres: they press together with flat faces, which can leave less gas space, and in flooded soil almost all non wetland species tested stayed below 5.5 % ' + T_('ae.packing') + '.</li>' +
      '<li><b>Maize.</b> One study set hypoxia (low oxygen) at 4 % oxygen ' + T_('ae.ethylene') + '. Starved maize roots responded to ethylene at 0.05 µL per litre of air ' + T_('ae.nutr') + '.</li>' +
      '<li><b>Stems have air pipes too.</b> In the wetland plant Meionectes brownii, gas was 17.7 % of the stem cross section between nodes and 8.2 % at nodes ' + T_('ae.nodes') + '.</li>' +
      '<li><b>The model here.</b> ' + esc(CQ.evidence['ae.model'].claim) + ' Oxygen use per unit length is set by the living tissue, a × (1 − p) ÷ p, where p is the porosity at that height, and leak by λ where the wall is unsealed; both are teaching constants ' + T_('ae.model') + '.</li>' +
      '</ul></details>';
  }
  function boxes() {
    return '<section class="cq-box" id="ae-types" aria-labelledby="ae-types-h"><h3 id="ae-types-h">More than one way to make an air space</h3>' +
      '<p class="sub">Two main types are described ' + T_('ae.types') + ', and some plants use other ways.</p>' + typesFig() +
      '<p>Cells can pull apart along their walls (<b>schizogeny</b>) or die and leave a gap (<b>lysigeny</b>, as in rice ' + T_('ae.rice') + '). Sponge gourd, <i>Luffa cylindrica</i>, stretches its cortex cells outward instead; its discoverers call this <b>expansigeny</b> ' + T_('ae.luffa') + '. In pickerelweed, <i>Pontederia cordata</i>, air spaces form as cells grow unevenly along the walls that line them, called <b>differential expansion</b> ' + T_('ae.ponte') + '.</p></section>' +
      '<section class="cq-box" id="ae-wind" aria-labelledby="ae-wind-h"><h3 id="ae-wind-h">Wind in the pipes: water lilies and reeds</h3>' +
      '<p class="sub">Some wetland plants do not wait for diffusion. They push air through themselves.</p>' +
      '<div class="cq-two"><div class="cq-mini"><canvas id="ae-flow" role="img" aria-label="Air flowing through a water lily or a reed"></canvas><div class="w-bar"><button type="button" class="w-b" data-f="pause" aria-pressed="false">Pause</button><button type="button" class="w-b" data-f="lily" aria-pressed="true">Water lily</button><button type="button" class="w-b" data-f="reed" aria-pressed="false">Common reed</button></div></div>' +
      '<div id="ae-flow-t"></div></div>' +
      '<p style="font:400 13.5px/1.45 var(--ui);color:var(--ink2)">Pressurised flow through some emergent and floating leaved plants can raise oxygen in the underground stem close to that of air ' + T_('ae.through') + '. The drawing is a sketch; arrow speeds are not to scale ' + B_('ILLUSTRATIVE') + '</p></section>';
  }
  var FLOWTXT = {
    lily: function () { return '<div class="cq-side on"><h4>Yellow water lily (<i>Nuphar luteum</i> in the paper)</h4>Young leaves at the surface warm up, and warmth and humidity push air into them: several litres a day. The air flows down their stalks to the stem buried in the mud at up to 50 cm per minute, then up the stalks of old leaves and out, now rich in CO₂ ' + T_('ae.lily') + '.</div>'; },
    reed: function () { return '<div class="cq-side on"><h4>Common reed (<i>Phragmites australis</i>)</h4>Wind blowing across tall dead stems pulls air out of them, and fresh air is sucked in through stems broken off near the ground (Venturi flow). Humidity adds a second push. In the lab this raised oxygen in the underground stem to 90 % of the oxygen in air, with flows of about 20 to 40 mm per minute ' + T_('ae.reed') + '.</div>'; }
  };
  function typesFig() {
    function cellsSVG(ox, kind) {
      var g = '', i, j;
      for (j = 0; j < 3; j++) for (i = 0; i < 4; i++) {
        var cx = ox + 22 + i * 28, cy = 30 + j * 28, r = 13, skip = false, sx = 1, sy = 1;
        if (kind === 'lys' && ((i === 1 || i === 2) && j === 1)) skip = true;
        if (kind === 'sch') { cx += (i - 1.5) * 4; cy += (j - 1) * 4; r = 12; }
        if (kind === 'exp') { var a = Math.atan2(cy - 58, cx - (ox + 64)); sx = 1 + 0.35 * Math.abs(Math.cos(a)); sy = 1 + 0.35 * Math.abs(Math.sin(a)); r = 11; cx = ox + 64 + (cx - ox - 64) * 1.18; cy = 58 + (cy - 58) * 1.18; }
        if (kind === 'dif') { r = 11 + ((i + j) % 2) * 3; }
        if (skip) { g += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="#9a6a3a" stroke-dasharray="3 3" opacity=".7"/>'; continue; }
        g += '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + (r * sx) + '" ry="' + (r * sy) + '" fill="#c7cf9a" stroke="#55704a" stroke-width="1.5"/>';
      }
      return g;
    }
    var P = [['sch', 'Cells pull apart', 'schizogeny'], ['lys', 'Cells die', 'lysigeny (rice)'], ['exp', 'Cells stretch', 'expansigeny (Luffa)'], ['dif', 'Cells grow unevenly', 'differential expansion']];
    var g = '';
    P.forEach(function (p, k) { var ox = k * 150; g += '<rect x="' + (ox + 2) + '" y="6" width="142" height="108" rx="8" fill="#2a4630" opacity=".12"/>' + cellsSVG(ox + 6, p[0]) + '<text x="' + (ox + 73) + '" y="134" font-size="13" font-weight="600" text-anchor="middle" fill="currentColor">' + p[1] + '</text><text x="' + (ox + 73) + '" y="150" font-size="12" text-anchor="middle" fill="currentColor" font-style="italic">' + p[2] + '</text>'; });
    return '<svg class="cq-fig" viewBox="0 0 600 160" role="img" aria-label="Four ways to make air space between cells" style="max-width:640px;color:var(--ink)">' + g + '</svg>';
  }

  /* ---------------------------------------------------------------- 3D */
  function build3D(stage) {
    var T = window.THREE, host = stage.querySelector('.w-gl'), tagHost = stage.querySelector('.w-tags');
    var renderer;
    try { renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' }); } catch (e) { return null; }
    if (!renderer || !renderer.getContext()) return null;
    renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1)); renderer.outputEncoding = T.sRGBEncoding; renderer.localClippingEnabled = true;
    host.appendChild(renderer.domElement);
    var clip = new T.Plane(new T.Vector3(0, -1, 0), 0);
    var W = 0, H = 0, scene = new T.Scene(), cam = new T.PerspectiveCamera(34, 1.5, 0.1, 100);
    scene.add(new T.HemisphereLight(0xf2f0e6, 0x22302c, 0.8));
    var dl = new T.DirectionalLight(0xfff2dc, 0.9); dl.position.set(5, 6, 7); scene.add(dl);
    var dl2 = new T.DirectionalLight(0x9fc4ff, 0.3); dl2.position.set(-6, -3, -4); scene.add(dl2);
    var root = new T.Group(); scene.add(root);
    var tl = WED[1], tlen = TAU - 1.6;   /* the open part of every cylinder: from the end of the wedge round to its start */
    var epi = new T.Mesh(new T.CylinderGeometry(1, 1, YB - YC, 72, 1, true, tl, tlen), new T.MeshStandardMaterial({ color: 0xc9b98f, roughness: 0.8, side: T.DoubleSide, transparent: true, opacity: 0.4, depthWrite: false }));
    epi.position.y = (YB + YC) / 2; epi.userData.part = 'epi'; root.add(epi);
    var outer = new T.Mesh(new T.CylinderGeometry(0.93, 0.93, YB - YC, 72, 1, true, tl, tlen), new T.MeshStandardMaterial({ color: 0xa8b07c, roughness: 0.8, side: T.DoubleSide }));
    outer.position.y = epi.position.y; outer.userData.part = 'outer'; root.add(outer);
    var bar = new T.Mesh(new T.CylinderGeometry(1.012, 1.012, YB - YBAR, 72, 1, true, tl, tlen), new T.MeshStandardMaterial({ color: 0xd99a2b, emissive: 0x6a3a00, emissiveIntensity: 0.35, roughness: 0.4, side: T.DoubleSide, transparent: true, opacity: 0, depthWrite: false }));
    bar.position.y = (YB + YBAR) / 2; bar.userData.part = 'barrier'; bar.renderOrder = 3; root.add(bar);
    var stele = new T.Mesh(new T.CylinderGeometry(0.31, 0.31, YB - YC + 0.4, 32), new T.MeshStandardMaterial({ color: 0xe8d9a8, roughness: 0.6 }));
    stele.position.y = (YB + YC) / 2 - 0.2; stele.userData.part = 'stele'; root.add(stele);
    var endo = new T.Mesh(new T.CylinderGeometry(0.335, 0.335, YB - YC, 40, 1, true), new T.MeshStandardMaterial({ color: 0x8a6a3a, roughness: 0.7, side: T.DoubleSide }));
    endo.position.y = epi.position.y; endo.userData.part = 'stele'; root.add(endo);
    var vessels = [], caps = [], G_caps = null;
    for (var xv = 0; xv < 5; xv++) { var a5 = xv / 5 * TAU; var v = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, YB - YC + 0.4, 10), new T.MeshStandardMaterial({ color: 0x8b2f3c, roughness: 0.5 })); v.position.set(Math.sin(a5) * 0.17, stele.position.y, Math.cos(a5) * 0.17); v.userData.part = 'stele'; root.add(v); vessels.push(v); }
    var tipG = new T.SphereGeometry(1, 48, 24, 0, TAU, Math.PI / 2, Math.PI / 2); tipG.scale(1, (YC - YT) / 1, 1);
    var tip = new T.Mesh(tipG, new T.MeshStandardMaterial({ color: 0xd9c890, roughness: 0.7 })); tip.position.y = YC; tip.userData.part = 'tip'; root.add(tip);
    var top = new T.Mesh(new T.RingGeometry(0.34, 1, 72, 1, tl - Math.PI / 2, tlen), new T.MeshStandardMaterial({ color: 0xb9c48a, roughness: 0.8, side: T.DoubleSide, transparent: true, opacity: 0.5 }));
    top.rotation.x = -Math.PI / 2; top.position.y = YB; root.add(top);
    /* cortex cells */
    var cg = new T.CylinderGeometry(0.047, 0.047, DY * 0.94, 6, 1);
    var cells = new T.InstancedMesh(cg, new T.MeshStandardMaterial({ roughness: 0.65 }), CELLS.length);
    cells.userData.part = 'cortex'; root.add(cells);
    var dummy = new T.Object3D(), col = new T.Color(), LIVE = new T.Color(0xc7cf9a), DYING = new T.Color(0x8a6a3a);
    var cellsInit = false;
    function placeCells(dt) {
      var any = false;
      CELLS.forEach(function (c, i) {
        var dead = cellDead(c), tgt = dead ? 0 : 1, ch = !cellsInit;
        if (S.newRoot > 0 && !dead && c.L !== 1) { c.L = 1; ch = true; }
        if (c.L !== tgt) { c.L = tgt > c.L ? Math.min(1, c.L + dt * 1.2) : Math.max(0, c.L - dt * 0.7); ch = true; }
        if (!ch) return;
        any = true;
        var s = c.cut ? 0.0001 : (c.L < 0.5 ? c.L * 2 : 1);
        dummy.position.set(Math.sin(c.a) * c.r, c.y, Math.cos(c.a) * c.r); dummy.scale.set(s, c.cut ? 0.0001 : (0.4 + 0.6 * clamp(c.L * 2, 0, 1)), s); dummy.rotation.set(0, c.a, 0); dummy.updateMatrix();
        cells.setMatrixAt(i, dummy.matrix);
        col.copy(DYING).lerp(LIVE, sm(0.5, 1, c.L)); cells.setColorAt(i, col);
      });
      cellsInit = true;
      if (any) { cells.instanceMatrix.needsUpdate = true; if (cells.instanceColor) cells.instanceColor.needsUpdate = true; }
      return any;
    }
    /* soil grains around the root */
    var NG = 110, grains = new T.InstancedMesh(new T.IcosahedronGeometry(0.1, 0), new T.MeshStandardMaterial({ roughness: 0.9, transparent: true, opacity: 0.45 }), NG);
    grains.userData.part = 'soil'; root.add(grains);
    for (var gi = 0; gi < NG; gi++) { var ga = hash(gi * 3) * TAU; if (inWedge(ga)) ga += 1.6; var gr = 1.5 + hash(gi * 5) * 1.9; dummy.position.set(Math.sin(ga) * gr, lerp(YT - 0.3, YB, hash(gi * 7)), Math.cos(ga) * gr); dummy.rotation.set(gi, gi * 2, 0); dummy.scale.setScalar(0.6 + hash(gi) * 0.9); dummy.updateMatrix(); grains.setMatrixAt(gi, dummy.matrix); }
    function soilColor() { var c1 = new T.Color(S.wet ? 0x4f6e82 : 0x8a7454); for (var i = 0; i < NG; i++) { col.copy(c1).multiplyScalar(0.8 + 0.3 * hash(i * 11)); grains.setColorAt(i, col); } grains.instanceColor.needsUpdate = true; }
    /* slice plane */
    var slice = new T.Mesh(new T.RingGeometry(0.02, 1.15, 64), new T.MeshBasicMaterial({ color: 0xffd479, transparent: true, opacity: 0.12, side: T.DoubleSide, depthWrite: false }));
    slice.rotation.x = -Math.PI / 2; slice.renderOrder = 5; root.add(slice);
    var sliceRim = new T.Mesh(new T.TorusGeometry(1.15, 0.015, 6, 80), new T.MeshBasicMaterial({ color: 0xffd479 })); sliceRim.rotation.x = Math.PI / 2; root.add(sliceRim);
    /* O2 beads */
    var o2c = new T.Color(WPMolColor.atom('o2', 'O', true));
    var so = new T.SphereGeometry(0.065, 10, 8), o2g = CQ.mergeGeo(T, [{ g: so, m: new T.Matrix4().makeTranslation(-0.05, 0, 0), c: o2c }, { g: so, m: new T.Matrix4().makeTranslation(0.05, 0, 0), c: o2c }]);
    var NO = 220, o2 = new T.InstancedMesh(o2g, new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.35, emissive: 0x3a0606, emissiveIntensity: 0.6 }), NO);
    o2.userData.part = 'o2'; root.add(o2);
    var P = []; for (var pi = 0; pi < NO; pi++) P.push({ on: false });
    var acc = 0, accS = 0;
    function lacunaAngle(y) {
      /* pick an angle that is open at this height, else any cortex angle */
      for (var k = 0; k < 6; k++) { var s = Math.floor(Math.random() * SPOKES), a = (s + 0.5) / SPOKES * TAU + (Math.random() - 0.5) * 0.25; if (!inWedge(a) || Math.random() < 0.25) return a; }
      return Math.random() * TAU;
    }
    function spawn() {
      var p = null; for (var i = 0; i < NO; i++) if (!P[i].on) { p = P[i]; break; } if (!p) return;
      p.on = true; p.mode = 'ch'; p.y = YB - 0.05; p.a = lacunaAngle(p.y); p.r = 0.5 + Math.random() * 0.22; p.s = 1; p.v = 0; p.rot = Math.random() * TAU;
    }
    function spawnSoil() {
      var p = null; for (var i = 0; i < NO; i++) if (!P[i].on) { p = P[i]; break; } if (!p) return;
      p.on = true; p.mode = 'in'; p.y = lerp(YT + 0.6, YB - 0.3, Math.random()); p.a = Math.random() * TAU; if (inWedge(p.a)) p.a += 1.6; p.r = 2.6 + Math.random() * 0.6; p.s = 1; p.rot = Math.random() * TAU;
    }
    function stepO2(dt) {
      var por = porNow(), rate = 5 + 26 * por;
      acc += dt * rate; while (acc >= 1) { acc -= 1; spawn(); }
      if (!S.wet) { accS += dt * 6; while (accS >= 1) { accS -= 1; spawnSoil(); } }
      var v = 0.5 + 5 * por;
      for (var i = 0; i < NO; i++) {
        var p = P[i]; if (!p.on) continue;
        if (p.mode === 'ch') {
          var pl = Math.max(0.03, porAt(p.y)), ds = v * dt;
          p.y -= ds; p.a += (Math.random() - 0.5) * dt * 0.4;
          if (Math.random() < A_RESP * (1 - pl) / pl * ds * 3) { p.mode = 'use'; p.k = 0; continue; }
          if (Math.random() < leakAt(p.y) * ds * 3) { p.mode = 'leak'; p.k = 0; continue; }
          if (p.y <= YC) { p.mode = 'tip'; p.k = 0; p.r = 0.4; }
        } else if (p.mode === 'leak') { p.k += dt; p.r += dt * 0.9; p.s = Math.max(0, 1 - Math.max(0, p.r - 1.4) * 1.2); if (p.s <= 0) p.on = false; }
        else if (p.mode === 'use') { p.k += dt; p.s = Math.max(0, 1 - p.k * 1.6); if (p.s <= 0) p.on = false; }
        else if (p.mode === 'tip') { p.k += dt; p.y = Math.max(YT + 0.25, p.y - dt * 0.6); p.s = Math.max(0, 1 - p.k * 0.7); if (p.s <= 0) p.on = false; }
        else if (p.mode === 'in') { p.r -= dt * 0.7; if (p.r < 1.0) { p.s -= dt * 2; if (p.s <= 0) p.on = false; } }
      }
    }
    function placeO2() {
      for (var i = 0; i < NO; i++) {
        var p = P[i];
        if (!p.on) { dummy.position.set(0, -40, 0); dummy.scale.setScalar(0.0001); }
        else { dummy.position.set(Math.sin(p.a) * p.r, p.y, Math.cos(p.a) * p.r); dummy.scale.setScalar(Math.max(0.0001, p.s)); dummy.rotation.set(p.rot, p.rot * 1.3 + p.y, 0); }
        dummy.updateMatrix(); o2.setMatrixAt(i, dummy.matrix);
      }
      o2.instanceMatrix.needsUpdate = true;
    }
    var ctl = CQ.orbit(host, cam, { target: new T.Vector3(0, 0.5, 0), dist: 10.5, theta: 0.5, phi: 0.58, minDist: 3, maxDist: 30, panLimit: 5, invalidate: function () { kick(); } });
    function homeDist() { var asp = W / Math.max(1, H); return 10.5 * Math.max(1, 1.05 / asp); }
    /* labels */
    var TAGS = [
      { id: 'epi', text: 'epidermis', p: function (v) { return v.set(Math.sin(2.6) * 1.0, 2.6, Math.cos(2.6) * 1.0); } },
      { id: 'cor', text: 'cortex', p: function (v) { var a = 0.5 + Math.PI - 1.2; return v.set(Math.sin(a) * 0.86, yOfSlice(), Math.cos(a) * 0.86); } },
      { id: 'lac', text: 'air channel', p: function (v) { var a = 0.5 + Math.PI + 0.95; return v.set(Math.sin(a) * 0.62, yOfSlice(), Math.cos(a) * 0.62); }, need: function () { return porNow() > 0.12; } },
      { id: 'ste', text: 'stele', p: function (v) { return v.set(0, yOfSlice() - 1.6, 0).add(new THREE.Vector3(Math.sin(0.5) * 0.3, 0, Math.cos(0.5) * 0.3)); } },
      { id: 'bar', text: 'seal (suberin)', p: function (v) { return v.set(Math.sin(-1.2) * 0.97, 0.2, Math.cos(-1.2) * 0.97); }, need: function () { return S.Bp > 0.4; }, big: 1 },
      { id: 'tip', text: 'tip, no seal', p: function (v) { return v.set(0.5, YT + 0.4, 0.55); } },
      { id: 'o2', text: 'O₂ from the shoot', p: function (v) { return v.set(0.6, YB + 0.35, 0.3); } }
    ];
    var tagEls = {};
    TAGS.forEach(function (g) { var e = document.createElement('span'); e.className = 'w-tag'; e.textContent = g.text; e.hidden = true; tagHost.appendChild(e); tagEls[g.id] = e; });
    var V = new T.Vector3();
    function drawTags() {
      var boxes = [];
      TAGS.forEach(function (g) {
        var e = tagEls[g.id];
        if ((!S.names && !g.big) || (g.need && !g.need())) { e.hidden = true; return; }
        g.p(V); V.project(cam); var x = (V.x + 1) / 2 * W, y = (1 - V.y) / 2 * H;
        if (V.z > 1 || x < 8 || x > W - 8 || y < 18 || y > H - 6) { e.hidden = true; return; }
        e.hidden = false; e.classList.toggle('pk', !!g.big);
        var w = e.offsetWidth || 70, bx = { x: clamp(x, w / 2 + 2, W - w / 2 - 2) - w / 2, y: y - 26, w: w, h: 22 };
        if (boxes.some(function (o) { return bx.x < o.x + o.w && bx.x + bx.w > o.x && bx.y < o.y + o.h && bx.y + bx.h > o.y; })) { e.hidden = true; return; }
        boxes.push(bx); e.style.left = (bx.x + w / 2).toFixed(1) + 'px'; e.style.top = y.toFixed(1) + 'px';
      });
    }
    var ray = new T.Raycaster(), ndc = new T.Vector2();
    function pickAt(cx, cy) {
      var r = host.getBoundingClientRect(); ndc.set((cx - r.left) / r.width * 2 - 1, -((cy - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, cam);
      var objs = [o2, cellCaps, capAir, cells, stele, endo, tip, outer, epi, grains]; if (S.Bp > 0.3) objs.unshift(bar);
      var h = ray.intersectObjects(objs, false);
      for (var i = 0; i < h.length; i++) {
        var o = h[i].object;
        if (o === cells && CELLS[h[i].instanceId] && (CELLS[h[i].instanceId].cut || CELLS[h[i].instanceId].L < 0.3)) continue;
        if (o === o2 && !P[h[i].instanceId].on) continue;
        return o.userData.part;
      }
      return null;
    }
    var running = false, visible = true, lastT = 0, dirty = true, soilWas = null;
    function resize() { var w = host.clientWidth || 600, h = host.clientHeight || 400; if (w === W && h === H) return; W = w; H = h; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); ctl.setHome({ dist: homeDist() }); if (!resize.done) { ctl.reset(); ctl.jump(); resize.done = 1; } dirty = true; }
    function kick() { dirty = true; if (!running && visible && !document.hidden) { running = true; lastT = 0; requestAnimationFrame(loop); } }
    function loop(ts) {
      if (!visible || document.hidden) { running = false; return; }
      var dt = lastT ? Math.min(0.05, (ts - lastT) / 1000) : 0; lastT = ts; resize();
      var anim = false;
      if (!S.frozen) { var d2 = dt * (window.PlaySpeed ? PlaySpeed.get() : 1); tick(d2); stepO2(d2); anim = placeCells(d2); }
      var mv = ctl.apply();
      if (!S.frozen || mv || dirty) { render(); dirty = false; }
      if (!S.frozen || mv || ctl.moving()) requestAnimationFrame(loop); else running = false;
    }
    function capAir0(ys) { if (G_caps) G_caps(ys); }
    function render() {
      if (soilWas !== S.wet) { soilColor(); soilWas = S.wet; }
      if (S.frozen) placeCells(0);
      bar.material.opacity = 0.85 * S.Bp; bar.visible = S.Bp > 0.01;
      var ys = yOfSlice(); slice.position.y = ys + 0.01; sliceRim.position.y = ys; clip.constant = ys + 0.002; caps.forEach(function (c) { c.position.y = ys; }); capAir0(ys);
      placeO2(); renderer.render(scene, cam); drawTags(); after();
    }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) kick(); }, { rootMargin: '80px' }).observe(stage);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) kick(); });
    [epi, outer, bar, stele, endo, cells, o2].concat(vessels).forEach(function (m) { if (!/noclip/.test(location.search)) { m.material.clippingPlanes = [clip]; m.material.needsUpdate = true; } });
    top.visible = false;
    var cap = new T.Mesh(new T.CircleGeometry(0.31, 32), new T.MeshStandardMaterial({ color: 0xe8d9a8, roughness: 0.6, side: T.DoubleSide })); cap.rotation.x = -Math.PI / 2; cap.userData.part = 'stele'; root.add(cap);
    var capE = new T.Mesh(new T.RingGeometry(0.31, 0.335, 40), new T.MeshStandardMaterial({ color: 0x8a6a3a, side: T.DoubleSide })); capE.rotation.x = -Math.PI / 2; root.add(capE);
    var capV = []; for (var cv5 = 0; cv5 < 5; cv5++) { var a6 = cv5 / 5 * TAU, mv5 = new T.Mesh(new T.CircleGeometry(0.05, 12), new T.MeshStandardMaterial({ color: 0x8b2f3c, side: T.DoubleSide })); mv5.rotation.x = -Math.PI / 2; mv5.position.set(Math.sin(a6) * 0.17, 0, Math.cos(a6) * 0.17); root.add(mv5); capV.push(mv5); }
    var capO = new T.Mesh(new T.RingGeometry(0.88, 1, 72, 1, tl - Math.PI / 2, tlen), new T.MeshStandardMaterial({ color: 0xa8b07c, side: T.DoubleSide })); capO.rotation.x = -Math.PI / 2; capO.userData.part = 'outer'; root.add(capO);
    var capAir = new T.Mesh(new T.RingGeometry(0.335, 0.885, 72, 1, tl - Math.PI / 2, tlen), new T.MeshBasicMaterial({ color: 0x1b2a33, side: T.DoubleSide })); capAir.rotation.x = -Math.PI / 2; capAir.userData.part = 'lacuna'; root.add(capAir);
    caps = [cap, capE, capO, capAir].concat(capV);
    var NCAP = 0; (function () { var y0 = CELLS[0].y; CELLS.forEach(function (c) { if (c.y === y0) NCAP++; }); })();
    var cellCaps = new T.InstancedMesh(new T.CircleGeometry(0.05, 6), new T.MeshStandardMaterial({ color: 0xd6dca8, roughness: 0.6, side: T.DoubleSide, emissive: 0x2a3010, emissiveIntensity: 0.4 }), NCAP);
    cellCaps.userData.part = 'cortex'; root.add(cellCaps);
    function placeCaps(ys) {
      var n = 0, best = null, bd = 1e9;
      CELLS.forEach(function (c) { var d = Math.abs(c.y - ys); if (d < bd) { bd = d; best = c.y; } });
      CELLS.forEach(function (c) {
        if (c.y !== best || n >= NCAP) return;
        var s2 = c.cut ? 0.0001 : clamp(c.L * 1.6, 0.0001, 1);
        dummy.position.set(Math.sin(c.a) * c.r, ys + 0.004, Math.cos(c.a) * c.r); dummy.rotation.set(-Math.PI / 2, 0, c.a); dummy.scale.set(s2, s2, s2); dummy.updateMatrix();
        cellCaps.setMatrixAt(n, dummy.matrix); n++;
      });
      for (; n < NCAP; n++) { dummy.scale.setScalar(0.0001); dummy.updateMatrix(); cellCaps.setMatrixAt(n, dummy.matrix); }
      cellCaps.instanceMatrix.needsUpdate = true;
    }
    G_caps = placeCaps;
    placeCells(0); resize();
    return { kick: kick, pickAt: pickAt, ctl: ctl, surface: host, render: function () { dirty = true; kick(); }, place: placeCells };
  }

  /* ---------------------------------------------------------------- 2D cross section (scan pane, and the stage without WebGL) */
  function drawSection(g, cx, cy, R, dark, hits, big) {
    var y = yOfSlice(), por = porAt(y), sealed = sealAt(y), prof = profile(), C = 1;
    for (var q = 0; q < prof.pts.length; q++) if (prof.pts[q][0] <= y) { C = prof.pts[q][1]; break; }
    var ink = dark ? '#f4f1e8' : CQ.css('--ink', '#2a231c');
    /* soil */
    g.fillStyle = S.wet ? (dark ? '#1d3542' : '#c9dbe6') : (dark ? '#3a2f22' : '#e6d6b6'); g.beginPath(); g.arc(cx, cy, R * 1.45, 0, TAU); g.fill();
    for (var i = 0; i < 40; i++) { var a = hash(i * 3) * TAU, rr = R * (1.12 + hash(i * 5) * 0.3); g.fillStyle = S.wet ? (dark ? '#2f5266' : '#9fbacb') : (dark ? '#5a4630' : '#bfa57a'); g.beginPath(); g.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, R * 0.05, 0, TAU); g.fill(); }
    hits.push({ part: 'soil', test: function (x, yy) { var d = Math.hypot(x - cx, yy - cy); return d > R && d < R * 1.45; } });
    /* epidermis and outer layers */
    g.fillStyle = dark ? '#a8b07c' : '#b9c18a'; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.fill();
    g.fillStyle = S.wet ? (dark ? '#29404a' : '#dbe8ee') : (dark ? '#2b3a2e' : '#eef0e0'); g.beginPath(); g.arc(cx, cy, R * 0.9, 0, TAU); g.fill(); /* gas in between cells */
    hits.push({ part: 'epi', test: function (x, yy) { var d = Math.hypot(x - cx, yy - cy); return d > R * 0.95 && d <= R; } });
    hits.push({ part: sealed > 0.3 ? 'barrier' : 'outer', test: function (x, yy) { var d = Math.hypot(x - cx, yy - cy); return d > R * 0.88 && d <= R * 0.95; } });
    if (sealed > 0.02) { g.strokeStyle = 'rgba(224,180,76,' + (0.25 + 0.75 * sealed) + ')'; g.lineWidth = R * 0.05; g.beginPath(); g.arc(cx, cy, R * 0.94, 0, TAU); g.stroke(); }
    /* cortex: the cells of the ring nearest this height */
    var lac = [];
    CELLS.forEach(function (c) {
      if (Math.abs(c.y - y) > DY / 2) return;
      var x = cx + Math.sin(c.a) * c.r * R, yy = cy - Math.cos(c.a) * c.r * R, rr = R * 0.047;
      if (c.L < 0.05) { lac.push([x, yy]); return; }
      g.fillStyle = c.L < 0.9 ? '#8a6a3a' : (dark ? '#c7cf9a' : '#a9b878'); g.strokeStyle = dark ? 'rgba(0,0,0,.35)' : '#55704a'; g.lineWidth = 0.8;
      g.beginPath(); g.arc(x, yy, rr * (c.L < 0.5 ? c.L * 2 : 1), 0, TAU); g.fill(); g.stroke();
    });
    hits.push({ part: 'cortex', test: function (x, yy) { var d = Math.hypot(x - cx, yy - cy); return d > R * 0.36 && d <= R * 0.88; } });
    lac.forEach(function (p) { hits.unshift({ part: 'lacuna', test: function (x, yy) { return Math.hypot(x - p[0], yy - p[1]) < R * 0.06; } }); });
    /* stele */
    g.fillStyle = '#8a6a3a'; g.beginPath(); g.arc(cx, cy, R * 0.335, 0, TAU); g.fill();
    g.fillStyle = '#e8d9a8'; g.beginPath(); g.arc(cx, cy, R * 0.31, 0, TAU); g.fill();
    for (i = 0; i < 5; i++) { var a5 = i / 5 * TAU; g.fillStyle = '#8b2f3c'; g.beginPath(); g.arc(cx + Math.sin(a5) * R * 0.17, cy - Math.cos(a5) * R * 0.17, R * 0.05, 0, TAU); g.fill(); }
    hits.push({ part: 'stele', test: function (x, yy) { return Math.hypot(x - cx, yy - cy) < R * 0.34; } });
    /* O2 in the channels, as many as the profile says */
    var nO = Math.round(lac.length * C * 0.8), o2col = WPMolColor.get('o2', dark);
    for (i = 0; i < nO; i++) { var p = lac[i % lac.length], jx = Math.sin(S.clock * 3 + i) * R * 0.015; g.fillStyle = o2col; g.beginPath(); g.arc(p[0] - R * 0.016 + jx, p[1], R * 0.017, 0, TAU); g.arc(p[0] + R * 0.016 + jx, p[1], R * 0.017, 0, TAU); g.fill(); }
    /* leak arrows */
    var lk = leakAt(y);
    if (lk > 0.01 && por > 0.06) {
      g.strokeStyle = o2col; g.fillStyle = o2col; g.lineWidth = 2;
      var n = Math.round(8 * lk / LAMBDA);
      for (i = 0; i < n; i++) { var aa = (i + 0.5) / n * TAU + S.clock * 0.2, r1 = R * 0.9, r2 = R * (1.08 + 0.12 * ((S.clock * 0.6 + i * 0.37) % 1)); g.beginPath(); g.moveTo(cx + Math.cos(aa) * r1, cy + Math.sin(aa) * r1); g.lineTo(cx + Math.cos(aa) * r2, cy + Math.sin(aa) * r2); g.stroke(); g.beginPath(); g.arc(cx + Math.cos(aa) * r2, cy + Math.sin(aa) * r2, 2.5, 0, TAU); g.fill(); }
    }
    g.fillStyle = ink; g.font = '600 12px ' + CQ.css('--ui', 'sans-serif'); g.textAlign = 'left';
    var ty = big ? 22 : 16;
    g.fillText((S.sp === 'rice' ? 'Rice' : 'Wheat') + ', ' + (S.wet ? 'waterlogged' : 'well aerated') + ': slice ' + Math.round(S.slice * 100) + ' % of the way to the tip', 8, ty);
    g.font = '500 12px ' + CQ.css('--mono', 'monospace');
    g.fillText('air ' + Math.round(por * 100) + ' %' + (sealed > 0.5 ? '  sealed' : y <= YBAR ? '  no seal here' : ''), 8, ty + 16);
  }

  var EL = null, G = null, SC = { hits: [] }, FB = { hits: [] };
  function drawScan() { var c = CQ.canvas(EL.scan, 270); c.g.clearRect(0, 0, c.w, c.h); SC.hits = []; drawSection(c.g, c.w / 2, c.h / 2 + 14, Math.min(c.w, c.h) * 0.33, CQ.isDark(), SC.hits); }
  function drawPlot() {
    var c = CQ.canvas(EL.plot, 270), g = c.g, L = 44, R = 12, Tp = 22, Bt = 38, w = c.w - L - R, h = c.h - Tp - Bt;
    var ink = CQ.css('--ink', '#2a231c'), ink2 = CQ.css('--ink2', '#5e5141'), rule = CQ.css('--rule2', '#c4b597'), ui = CQ.css('--ui', 'sans-serif'), o2col = WPMolColor.get('o2');
    g.clearRect(0, 0, c.w, c.h);
    function X(y) { return L + (YB - y) / (YB - YT) * w; } function Y(v) { return Tp + (1 - v) * h; }
    g.fillStyle = CQ.css('--card', '#ebe2cb'); g.fillRect(X(YBAR), Tp, X(YT) - X(YBAR), h);
    g.fillStyle = ink2; g.font = '11px ' + ui; g.textAlign = 'center'; g.fillText('no seal near the tip', (X(YBAR) + X(YT)) / 2, Tp + 12);
    g.strokeStyle = rule; g.lineWidth = 1; g.textAlign = 'right';
    [0, 0.5, 1].forEach(function (v) { g.beginPath(); g.moveTo(L, Y(v)); g.lineTo(L + w, Y(v)); g.stroke(); g.fillText(Math.round(v * 100) + ' %', L - 4, Y(v) + 4); });
    g.textAlign = 'left'; g.fillStyle = ink; g.font = '600 11.5px ' + ui; g.fillText('base, near the shoot', L, c.h - 8); g.textAlign = 'right'; g.fillText('root tip', L + w, c.h - 8);
    var cur = profile(), alt = profile(S.seal ? 0 : 1);
    function line(pr, dash, lw) { g.setLineDash(dash); g.strokeStyle = o2col; g.lineWidth = lw; g.beginPath(); pr.pts.forEach(function (p, i) { if (i) g.lineTo(X(p[0]), Y(p[1])); else g.moveTo(X(p[0]), Y(p[1])); }); g.stroke(); g.setLineDash([]); }
    if (S.wet) line(alt, [5, 4], 1.5);
    line(cur, [], 2.6);
    var ys = yOfSlice(); g.strokeStyle = '#c99a1e'; g.lineWidth = 2; g.beginPath(); g.moveTo(X(ys), Tp); g.lineTo(X(ys), Tp + h); g.stroke();
    g.font = '600 11px ' + ui; g.textAlign = 'left'; g.fillStyle = ink;
    g.fillText('O₂ left in the channels', L + 4, Tp - 8);
    if (S.wet) { g.fillStyle = ink2; g.textAlign = 'right'; g.fillText('dashed: seal ' + (S.seal ? 'off' : 'on'), L + w, Tp - 8); }
    else { g.fillStyle = ink2; g.textAlign = 'right'; g.font = '11px ' + ui; g.fillText('drained soil also supplies O₂', L + w, Tp - 8); }
  }
  function drawFallback() { var cv = FB.cv; if (!cv) return; var c = CQ.canvas(cv); c.g.clearRect(0, 0, c.w, c.h); FB.hits = []; drawSection(c.g, c.w / 2, c.h / 2 + 10, Math.min(c.w, c.h) * 0.36, true, FB.hits, true); c.g.fillStyle = '#dfe8d3'; c.g.font = '12px ' + CQ.css('--ui', 'sans-serif'); c.g.textAlign = 'left'; c.g.fillText('Flat drawing (3D is not available here): the root cut across at the slice.', 10, c.h - 10); }
  function after() { if (!after.t || performance.now() - after.t > 120) { after.t = performance.now(); drawScan(); drawPlot(); } }

  /* ---------------------------------------------------------------- readouts, messages */
  var MEAS = { 'rice-aer': ['20 to 26 %', 'rice roots, aerated solution', 'ae.ricepor'], 'rice-stag': ['29 to 41 %', 'rice roots, stagnant solution', 'ae.ricepor'], 'wheat-aer': ['not given', 'drawn low; not in our sources', 'ae.wheat'], 'wheat-stag': ['16 %', 'wheat roots, stagnant solution', 'ae.wheat'] };
  function syncUI() {
    var pr = profile(), m = MEAS[S.sp + '-' + (S.wet ? 'stag' : 'aer')];
    EL.por.textContent = Math.round(porNow() * 100) + ' %'; EL.por2.textContent = S.F < 0.98 && killShare(targetP()) > 0 ? 'channels forming' : 'in the older root';
    EL.mea.textContent = m[0]; EL.mea2.innerHTML = esc(m[1]) + ' ' + B_(CQ.evidence[m[2]].tag);
    EL.tip.textContent = Math.round(pr.tip * 100) + ' %';
    EL.leak.textContent = S.wet ? Math.round(pr.leak * 100) + ' %' : 'none';
    EL.leak2.textContent = S.wet ? (S.Bp > 0.5 ? 'only near the tip' : 'all along the root') : 'the soil has air too';
    EL.sliceO.textContent = Math.round(S.slice * 100) + ' % to the tip';
    EL.sealBox.checked = S.seal;
  }
  function say(m) { if (m === S.said) return; S.said = m; EL.now.textContent = m; }
  function tick(dt) {
    S.clock += dt;
    if (S.newRoot > 0) S.newRoot = Math.max(0, S.newRoot - dt);
    if (S.F < S.Ft) { var was = S.F; S.F = Math.min(S.Ft, S.F + dt / 9); if (was < 0.5 && S.F >= 0.5) say('Cortex cells are dying on purpose and breaking down. Air channels are opening between spokes of living cells.'); if (S.F >= S.Ft && was < S.Ft) say(S.sp === 'rice' ? 'The channels are built: rice roots in stagnant water held 29 to 41 % gas. Oxygen now flows down more easily.' : 'The channels are built, but wheat holds less air: about 16 % in stagnant water.'); }
    var bt = S.seal ? 1 : 0;
    if (S.Bp !== bt) { var b0 = S.Bp; S.Bp = bt > S.Bp ? Math.min(1, S.Bp + dt / 3) : Math.max(0, S.Bp - dt / 1.5); if (b0 < 1 && S.Bp >= 1 && S.wet) say('The seal is done. Oxygen hardly leaks from the older root now; more reaches the tip. In long rice roots this took less than a day.'); }
    syncUI();
  }
  function kickAll() { if (G) G.kick(); else if (FB.kick) FB.kick(); }
  function setFrozen(on) { S.frozen = !!on; var b = EL.bar.querySelector('[data-a="pause"]'); b.textContent = S.frozen ? 'Play' : 'Pause'; b.setAttribute('aria-pressed', S.frozen ? 'true' : 'false'); EL.bar.querySelector('[data-a="step"]').hidden = !S.frozen; if (window.WPFreeze) WPFreeze.syncAll(); kickAll(); }
  function setCond(sp, wet) {
    var spChanged = sp !== S.sp, wasWet = S.wet;
    S.sp = sp; S.wet = wet;
    if (spChanged || (!wet && wasWet)) { S.F = 1; S.Ft = 1; S.newRoot = 0.6; CELLS.forEach(function (c) { c.L = cellDead(c) ? 0 : 1; }); }
    else if (wet && !wasWet) { /* the drained level of channels is already there; the extra forms now */
      var k0 = killShare(POR[sp].aer), k1 = killShare(POR[sp].stag); S.F = k1 > 0 ? k0 / k1 : 1; S.Ft = 1;
    }
    if (S.sealAuto || spChanged || wet !== wasWet) { S.seal = wet && sp === 'rice'; }
    if (!wet) S.Bp = S.seal ? S.Bp : 0;
    EL.root.querySelectorAll('[data-sp]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-sp') === sp ? 'true' : 'false'); });
    EL.root.querySelectorAll('[data-wet]').forEach(function (b) { b.setAttribute('aria-pressed', (b.getAttribute('data-wet') === '1') === wet ? 'true' : 'false'); });
    if (wet && !wasWet) say(sp === 'rice' ? 'Flooded: the water is stagnant and oxygen in the soil runs out. Rice starts to seal its older root and to build more air channels.' : 'Flooded: the water is stagnant. Wheat builds some air channels but makes only a weak seal, so the seal switch starts off here.');
    else if (!wet && wasWet) say('A new root grown in drained soil. Cells that died in a real root do not come back; this is a fresh root for comparison.');
    else if (spChanged) say(sp === 'rice' ? 'Rice: a wetland crop with a wide cortex. It keeps air channels even in drained soil.' : 'Wheat: in drained soil it has hardly any air channels.');
    if (G) G.place(0);
    syncUI(); drawPor(); after.t = 0; kickAll();
  }
  function openPart(id) {
    var p = partText(id); if (!p) return;
    EL.panel.innerHTML = '<button type="button" class="x" aria-label="Close">×</button><h4>' + esc(p[0]) + '</h4><p class="wh">' + esc(p[1]) + '</p><p class="tx">' + esc(p[2]) + (p[3] ? ' ' + T_(p[3]) : '') + '</p>';
    EL.panel.hidden = false; EL.panel.querySelector('.x').addEventListener('click', function () { EL.panel.hidden = true; });
    EL.part.value = id;
  }

  /* ---------------------------------------------------------------- the small flow view (2D) */
  var FL = { kind: 'lily', frozen: false, t: 0 };
  function flowPath(kind, w, h) {
    var wl = h * 0.32, mud = h * 0.74;
    if (kind === 'lily') return { wl: wl, mud: mud, pts: [[w * 0.2, wl - 4], [w * 0.22, wl + 30], [w * 0.26, mud - 10], [w * 0.3, mud + 12], [w * 0.55, mud + 18], [w * 0.74, mud + 10], [w * 0.77, mud - 10], [w * 0.78, wl + 30], [w * 0.8, wl - 4]] };
    return { wl: wl, mud: mud, pts: [[w * 0.2, mud - 30], [w * 0.21, mud - 5], [w * 0.24, mud + 14], [w * 0.5, mud + 20], [w * 0.7, mud + 12], [w * 0.72, mud - 10], [w * 0.73, h * 0.3], [w * 0.74, 22]] };
  }
  function along(pts, u) {
    var L = 0, seg = [], i; for (i = 1; i < pts.length; i++) { var d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); L += d; }
    var s = u * L; for (i = 0; i < seg.length; i++) { if (s <= seg[i]) { var f = s / seg[i]; return [lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f)]; } s -= seg[i]; }
    return pts[pts.length - 1];
  }
  function drawFlow() {
    var cv = document.getElementById('ae-flow'); if (!cv) return;
    var c = CQ.canvas(cv), g = c.g, w = c.w, h = c.h, dark = CQ.isDark(), F = flowPath(FL.kind, w, h), ui = CQ.css('--ui', 'sans-serif'), ink = CQ.css('--ink', '#2a231c');
    g.clearRect(0, 0, w, h);
    g.fillStyle = dark ? '#16222a' : '#eef3f6'; g.fillRect(0, 0, w, F.wl);
    g.fillStyle = dark ? '#1d3a4c' : '#bcd6e6'; g.fillRect(0, F.wl, w, F.mud - F.wl);
    g.fillStyle = dark ? '#3a2f22' : '#8f7a5a'; g.fillRect(0, F.mud, w, h - F.mud);
    g.strokeStyle = dark ? '#7fb05a' : '#4f7a35'; g.lineWidth = 6; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); F.pts.forEach(function (p, i) { if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }); g.stroke();
    g.fillStyle = dark ? '#7fb05a' : '#4f7a35';
    if (FL.kind === 'lily') {
      g.beginPath(); g.ellipse(w * 0.2, F.wl - 3, w * 0.09, 5, 0, 0, TAU); g.fill();
      g.fillStyle = dark ? '#a49a5a' : '#8f8a4a'; g.beginPath(); g.ellipse(w * 0.8, F.wl - 3, w * 0.1, 5, 0, 0, TAU); g.fill();
      g.fillStyle = ink; g.font = '600 11.5px ' + ui; g.textAlign = 'center';
      g.fillText('young leaf: air in', w * 0.2, F.wl - 16); g.fillText('old leaf: air out', w * 0.8, F.wl - 16);
      g.fillText('buried stem', w * 0.52, F.mud + 40 > h - 4 ? h - 6 : F.mud + 40);
    } else {
      g.fillStyle = ink; g.font = '600 11.5px ' + ui; g.textAlign = 'center';
      g.fillText('broken stem: air in', w * 0.24, F.mud - 40); g.fillText('tall dead stem: air out', w * 0.6, 16);
      g.fillText('underground stem', w * 0.48, h - 8);
      g.strokeStyle = dark ? '#cfd3d8' : '#77797d'; g.lineWidth = 2;
      for (var k = 0; k < 3; k++) { var yy = 30 + k * 12, xs = ((FL.t * 60 + k * 40) % (w * 0.5)); g.beginPath(); g.moveTo(w * 0.42 + xs, yy); g.lineTo(w * 0.42 + xs + 26, yy); g.stroke(); }
      g.fillStyle = ink; g.textAlign = 'left'; g.fillText('wind', w * 0.86, 44);
    }
    var o2 = WPMolColor.get('o2', dark), co2 = WPMolColor.get('co2', dark);
    for (var i = 0; i < 16; i++) { var u = (FL.t * 0.12 + i / 16) % 1, p = along(F.pts, u); g.fillStyle = FL.kind === 'lily' && u > 0.62 ? co2 : o2; g.beginPath(); g.arc(p[0] - 2.5, p[1], 2.6, 0, TAU); g.arc(p[0] + 2.5, p[1], 2.6, 0, TAU); g.fill(); }
    g.fillStyle = ink; g.textAlign = 'left'; g.font = '11px ' + ui; g.fillText('water', 6, F.wl + 14); g.fillText('mud', 6, F.mud + 14);
  }
  function startFlow() {
    var cv = document.getElementById('ae-flow'), bar = cv.parentNode.querySelector('.w-bar'), pb = bar.querySelector('[data-f="pause"]'), last = 0, vis = true, raf = 0;
    function f(ts) { raf = 0; if (!vis) return; var dt = last ? Math.min(0.05, (ts - last) / 1000) : 0; last = ts; if (!FL.frozen) FL.t += dt * (window.PlaySpeed ? PlaySpeed.get() : 1); drawFlow(); if (!FL.frozen) raf = requestAnimationFrame(f); else last = 0; }
    function kick() { if (!raf) raf = requestAnimationFrame(f); }
    function setK(k) { FL.kind = k; bar.querySelectorAll('[data-f="lily"],[data-f="reed"]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-f') === k ? 'true' : 'false'); }); document.getElementById('ae-flow-t').innerHTML = FLOWTXT[k](); drawFlow(); kick(); }
    bar.addEventListener('click', function (e) { var b = e.target.closest('[data-f]'); if (!b) return; var a = b.getAttribute('data-f'); if (a === 'pause') { FL.frozen = !FL.frozen; pb.textContent = FL.frozen ? 'Play' : 'Pause'; pb.setAttribute('aria-pressed', FL.frozen ? 'true' : 'false'); kick(); } else setK(a); });
    if (window.WPFreeze) WPFreeze.attach(cv, { paused: function () { return FL.frozen; }, button: pb });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { vis = es[0].isIntersecting; if (vis) kick(); }, { rootMargin: '60px' }).observe(cv);
    if ('ResizeObserver' in window) new ResizeObserver(function () { drawFlow(); }).observe(cv);
    if (CQ.reducedMotion()) { FL.frozen = true; pb.textContent = 'Play'; pb.setAttribute('aria-pressed', 'true'); }
    CQ.onPrefs(function () { if (CQ.reducedMotion() && !FL.frozen) { FL.frozen = true; pb.textContent = 'Play'; pb.setAttribute('aria-pressed', 'true'); } drawFlow(); });
    setK('lily');
  }

  /* ---------------------------------------------------------------- mount */
  function mount(host) {
    host.innerHTML = markup();
    var root = host.querySelector('#ae-ws'), stage = root.querySelector('.w-stage');
    EL = { root: root, stage: stage, panel: root.querySelector('.w-panel'), bar: root.querySelector('.w-bar'), now: root.querySelector('#ae-now'), scan: root.querySelector('#ae-scan'), plot: root.querySelector('#ae-plot'), part: root.querySelector('#ae-part'),
      por: root.querySelector('#ae-r-por'), por2: root.querySelector('#ae-r-por2'), mea: root.querySelector('#ae-r-mea'), mea2: root.querySelector('#ae-r-mea2'), tip: root.querySelector('#ae-r-tip'), leak: root.querySelector('#ae-r-leak'), leak2: root.querySelector('#ae-r-leak2'),
      slice: root.querySelector('#ae-slice'), sliceO: root.querySelector('#ae-slice-o'), sealBox: root.querySelector('#ae-seal') };
    S.F = 1; S.Ft = 1; CELLS.forEach(function (c) { c.L = cellDead(c) ? 0 : 1; });
    var glh = stage.querySelector('.w-gl');
    if (CQ.glOK()) { try { G = build3D(stage); } catch (e) { console.error('aerenchyma 3D failed, using the flat drawing', e); G = null; } }
    var surf;
    if (!G) {
      glh.innerHTML = ''; var cv = document.createElement('canvas'); cv.style.cssText = 'display:block;width:100%;height:100%'; glh.appendChild(cv); FB.cv = cv; stage.querySelector('.w-key').hidden = true; surf = glh;
      var last = 0, visible = true, raf = 0;
      FB.kick = function () { if (!raf) raf = requestAnimationFrame(f2); };
      function f2(ts) { raf = 0; if (!visible) return; var dt = last ? Math.min(0.05, (ts - last) / 1000) : 0; last = ts; if (!S.frozen) { var d = dt * (window.PlaySpeed ? PlaySpeed.get() : 1); tick(d); CELLS.forEach(function (c) { var t = cellDead(c) ? 0 : 1; if (c.L !== t) c.L = t > c.L ? Math.min(1, c.L + d * 1.2) : Math.max(0, c.L - d * 0.7); }); } drawFallback(); after(); if (!S.frozen) FB.kick(); else last = 0; }
      if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) FB.kick(); }, { rootMargin: '80px' }).observe(stage);
    } else surf = G.surface;
    var down = null;
    surf.addEventListener('pointerdown', function (e) { down = { x: e.clientX, y: e.clientY, t: e.timeStamp }; });
    surf.addEventListener('pointerup', function (e) {
      if (!down) return; var d = Math.hypot(e.clientX - down.x, e.clientY - down.y), dt = e.timeStamp - down.t; down = null;
      if (d > 6 || dt >= 450 || e.button > 0) return;
      var part = null;
      if (G) part = G.pickAt(e.clientX, e.clientY);
      else { var r = FB.cv.getBoundingClientRect(), X = e.clientX - r.left, Y = e.clientY - r.top; for (var i = 0; i < FB.hits.length; i++) if (FB.hits[i].test(X, Y)) { part = FB.hits[i].part; break; } }
      if (part) openPart(part);
    });
    if (window.WPFreeze) WPFreeze.attach(surf, { paused: function () { return S.frozen; }, button: EL.bar.querySelector('[data-a="pause"]'), chipHost: stage });
    EL.bar.addEventListener('click', function (e) {
      var b = e.target.closest('[data-a]'); if (!b) return; var a = b.getAttribute('data-a');
      if (a === 'pause') setFrozen(!S.frozen);
      else if (a === 'step') { tick(1.2); if (G) { G.place(1.2); G.render(); } else drawFallback(); after.t = 0; after(); }
      else if (a === 'names') { S.names = !S.names; b.setAttribute('aria-pressed', S.names ? 'true' : 'false'); if (G) G.render(); }
      else if (a === 'zin' && G) G.ctl.zoom(0.85); else if (a === 'zout' && G) G.ctl.zoom(1.18); else if (a === 'home' && G) G.ctl.reset();
    });
    root.querySelectorAll('[data-sp]').forEach(function (b) { b.addEventListener('click', function () { setCond(b.getAttribute('data-sp'), S.wet); }); });
    root.querySelectorAll('[data-wet]').forEach(function (b) { b.addEventListener('click', function () { setCond(S.sp, b.getAttribute('data-wet') === '1'); }); });
    EL.sealBox.addEventListener('change', function () {
      S.seal = EL.sealBox.checked; S.sealAuto = false;
      say(S.seal ? (S.wet ? 'Sealing the older root. Watch the leak stop there; the tip stays open.' : 'A seal in drained soil changes little: the soil has air, so oxygen is not lost to it.') : (S.wet ? 'No seal: oxygen leaks out all along the root, and less reaches the tip.' : 'No seal. In drained soil that matters little.'));
      syncUI(); after.t = 0; kickAll();
    });
    EL.slice.addEventListener('input', function () { S.slice = +EL.slice.value / 1000; syncUI(); if (G) G.render(); else drawFallback(); after.t = 0; after(); });
    EL.part.addEventListener('change', function () { if (EL.part.value) openPart(EL.part.value); });
    EL.scan.addEventListener('click', function (e) { var r = EL.scan.getBoundingClientRect(), X = e.clientX - r.left, Y = e.clientY - r.top; for (var i = 0; i < SC.hits.length; i++) if (SC.hits[i].test(X, Y)) { openPart(SC.hits[i].part); return; } });
    EL.plot.addEventListener('click', function (e) { var r = EL.plot.getBoundingClientRect(), x = (e.clientX - r.left - 44) / (r.width - 56); if (x >= 0 && x <= 1) { var y = lerp(YB, YT, x); S.slice = clamp((YB - 0.3 - y) / (YB - 0.3 - YC - 0.1), 0, 1); EL.slice.value = Math.round(S.slice * 1000); syncUI(); if (G) G.render(); else drawFallback(); after.t = 0; after(); } });
    CQ.onPrefs(function () { if (CQ.reducedMotion() && !S.frozen) setFrozen(true); drawPor(); after.t = 0; after(); kickAll(); });
    if ('ResizeObserver' in window) new ResizeObserver(function () { after.t = 0; after(); kickAll(); }).observe(root);
    if (window.PlaySpeed) PlaySpeed.on(function () { kickAll(); });
    if (CQ.reducedMotion()) setFrozen(true);
    syncUI(); drawPor(); startFlow(); kickAll(); after.t = 0; after();
    window.AEW = { S: S, profile: profile, porNow: porNow, setCond: setCond, G: G, finish: function () { S.F = S.Ft; S.Bp = S.seal ? 1 : 0; CELLS.forEach(function (c) { c.L = cellDead(c) ? 0 : 1; }); if (G) { G.place(0); G.render(); } syncUI(); after.t = 0; after(); } };
  }
  CQ.ready(function () { var h = document.getElementById('ae-host'); if (h) { mount(h); CQ.sources(document.getElementById('cq-srclist')); } });
})();

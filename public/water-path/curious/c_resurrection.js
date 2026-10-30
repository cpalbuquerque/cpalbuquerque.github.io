/* Curious things I: "Back from the dead: resurrection plants" (team curious, v20).
   One three.js r128 scene (one renderer): two small blocks of leaf cells, Xerophyta viscosa (takes its chloroplasts apart)
   and Haberlea rhodopensis (keeps its chlorophyll), side by side or one at a time. One timeline (drying, then water
   returns) moves every pane: cells shrink and their walls fold, the central vacuole empties (in Xerophyta it splits into
   small vacuoles), sugars fill in and stop jiggling as they set into a glass, chloroplasts are dismantled and rebuilt or
   kept and guarded, the upper skin of Xerophyta turns purple with anthocyanin, water molecules leave and come back.
   Linked panes: a live cut through one cell of each plant (2D, drawn from the same state), a plot of water left along the
   timeline with measured thresholds marked, readout tiles, one "what just happened" line.
   Speed: window.PlaySpeed and the site speed dock. Click to freeze: ../freeze.js. Reduced motion starts paused.
   No WebGL (or ?ws=2d): a 2D drawing of the same cells, same controls. Debug handle: window.RSW.
   Every number: curious/evidence.js (tag and source). The timeline between the marked points is ILLUSTRATIVE. */
(function () {
  'use strict';
  var CQ = window.CQ;
  var TAU = Math.PI * 2, DRY = 0.7;
  function clamp(x, a, b) { return x < a ? a : (x > b ? b : x); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function sm(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function hash(i) { var x = Math.sin(i * 12.9898 + 4.1) * 43758.5453; return x - Math.floor(x); }
  var esc = CQ.esc, T_ = CQ.tag, B_ = CQ.badge, E_ = CQ.ev;

  /* ---------------------------------------------------------------- the model (per species, from the timeline t in 0..1) */
  /* t < DRY: drying, td = t / DRY. t >= DRY: water returns, tr in 0..1 (Xerophyta: days 0 to 3). */
  var SP = {
    x: { name: 'Xerophyta viscosa', short: 'Xerophyta', end: 4, seed: 1.3 },
    h: { name: 'Haberlea rhodopensis', short: 'Haberlea', end: 6.5, seed: 4.1 }
  };
  function rwcOf(k, t) {
    var e = SP[k].end;
    if (t < DRY) { var td = t / DRY; return 100 - (100 - e) * (1 - Math.pow(1 - td, 1.7)); }
    var tr = (t - DRY) / (1 - DRY);
    if (k === 'x') { var d = tr * 3; return d <= 1 ? lerp(e, 50, 1 - Math.pow(1 - d, 1.6)) : lerp(50, 100, sm(1, 3, d)); } /* 50 % at 24 h, full turgor at 3 days (Farrant 2015) */
    return lerp(e, 100, sm(0, 1, tr));
  }
  function state(k, t) {
    var r = rwcOf(k, t), wet = t >= DRY, tr = wet ? (t - DRY) / (1 - DRY) : 0, day = wet ? tr * 3 : (t / DRY) * 15;
    var s = { k: k, rwc: r, wet: wet, day: day, tr: tr };
    if (k === 'x') {
      if (!wet) {
        s.ps = sm(55, 75, r);                     /* off by 55 % RWC */
        s.chl = lerp(0.06, 1, sm(20, 55, r));     /* dismantled below 55 %, pace sketched */
        s.sugar = 1 - sm(10, 55, r);              /* late drying */
        s.split = 1 - sm(38, 52, r);
        s.antho = 1 - sm(20, 60, r);
        s.resp = r >= 10;
      } else {
        var reb = sm(1, 3, day);                  /* rebuilding from 24 h, rebuilt by 3 days */
        s.chl = lerp(0.06, 1, reb); s.ps = reb;
        s.sugar = 1 - sm(0.4, 3, day);
        s.split = 1 - sm(1.4, 2.8, day);
        s.antho = 1 - sm(1, 3, day);
        s.resp = r >= 10;
      }
      s.zeax = 0;
    } else {
      s.chl = 1; s.antho = 0; s.split = 0;
      if (!wet) { s.ps = sm(25, 80, r); s.zeax = 1 - sm(8, 45, r); s.sugar = 1 - sm(10, 60, r); s.leak = r < 8; }
      else { s.ps = sm(0.25, 1, tr); s.zeax = 1 - sm(0.2, 0.9, tr); s.sugar = 1 - sm(0.2, 1, tr); s.leak = r < 30; }
      s.resp = true;
    }
    s.shrink = 0.6 + 0.4 * (r / 100);
    s.fold = 0.22 * Math.pow(1 - r / 100, 1.4);
    s.vac = 0.12 + 0.88 * Math.pow(r / 100, 1.1);
    s.jig = 0.004 + 0.05 * Math.pow(r / 100, 1.5); /* sugars stop moving when dry: a glass */
    return s;
  }
  function foldR(th, ph, seed, A) {
    var f = Math.sin(6 * th + seed) * Math.sin(3 * ph + seed * 0.7) * 0.65 + Math.sin(11 * th + 2 * seed) * Math.sin(5 * ph + 1) * 0.35;
    return 1 - A * (0.55 + 0.45 * f);
  }

  /* ---------------------------------------------------------------- parts (about 40 words each) */
  function partText(id) {
    switch (id) {
      case 'wall': return ['Cell wall', 'Around every cell', 'A firm but bendable wall of cellulose around each cell. When a cell loses most of its water it shrinks, and the wall has to fold, as drawn here. Drying leaves of the grass Sporobolus switch on genes for enzymes that remodel their cell walls.', 'rs.wall'];
      case 'vac': return ['Central vacuole', 'Filling most of the cell', 'A big sac of watery sap that fills most of a leaf cell and keeps it firm. It holds most of the cell’s water, so it shrinks first as the leaf dries. In Xerophyta it splits into many small vacuoles.', 'rs.x.vac'];
      case 'svac': return ['Small vacuoles', 'In drying Xerophyta cells', 'As Xerophyta dries, its one large vacuole splits into many small ones filled with compatible solutes: dissolved substances, such as sugars, that do not harm the cell. The timing drawn here is a sketch; the splitting is reported.', 'rs.x.vac'];
      case 'chlx': return ['Chloroplast, taken apart', 'Xerophyta, along the cell edge', 'Xerophyta switches photosynthesis off by 55 % water left, then takes its chlorophyll and thylakoid membranes (the inner membranes that catch light) apart, so light cannot harm a leaf that cannot use it. After rain it rebuilds them in about 3 days.', 'rs.x.ps'];
      case 'chlh': return ['Chloroplast, kept', 'Haberlea, along the cell edge', 'Haberlea keeps its chlorophyll even when dried to 6.5 % water left. It guards it instead: a yellow protective pigment, zeaxanthin, builds up. Craterostigma also keeps its chlorophyll while dry.', 'rs.h.dry'];
      case 'sugar': return ['Sugars', 'In the cytoplasm and small vacuoles', 'Late in drying, Xerophyta raises sucrose 30 to 50 fold and raffinose and stachyose 25 fold. Sugars take the place of water around membranes and proteins and set into a glass, a solid that is not a crystal.', 'rs.x.sugar'];
      case 'water': return ['Water', 'Leaving, or coming back', 'Water leaves the cells as the leaf dries and comes back after rain. Xerophyta can lose 95 % of its cell water and live. A cactus keeps its water; a resurrection plant lets it go.', 'rs.x.loss'];
      case 'epix': return ['Upper skin, with sunscreen', 'Top of the Xerophyta leaf', 'The epidermis, the leaf’s skin. As Xerophyta dries, its exposed surfaces turn red to purple with anthocyanin, a pigment that works as a sunscreen while the chloroplasts are taken apart.', 'rs.x.antho'];
      case 'epih': return ['Upper skin', 'Top of the Haberlea leaf', 'The epidermis, the leaf’s skin. Haberlea keeps its chlorophyll, so it must protect it from light while dry; zeaxanthin inside the chloroplasts does part of that job. In the study used here it was dried in very low light.', 'rs.h.dry'];
    }
    return null;
  }
  CQ.evidence['rs.wall'] = { tag: 'MEASURED', refs: ['yobi2017'], claim: 'As the resurrection grass Sporobolus stapfianus dries, it switches on genes for LEA proteins (protective proteins also made by drying seeds), antioxidant enzymes, ELIPs (proteins that protect against excess light) and enzymes that modify the cell wall. The folding of the walls drawn here is a sketch.', value: '', note: 'Abstract read.' };
  CQ.refs.yobi2017 = { text: 'Yobi A, Schlauch KA, Tillett RL, et al. (2017) Sporobolus stapfianus: insights into desiccation tolerance in the resurrection grasses from linking transcriptomics to metabolomics. BMC Plant Biology 17: 67. doi: 10.1186/s12870-017-1013-7', short: 'Yobi et al. 2017' };

  /* ---------------------------------------------------------------- state */
  var S = { sp: 'both', t: 0, auto: true, frozen: false, names: true, clock: 0, lastSaid: '', prevR: { x: 100, h: 100 }, prevT: 0 };
  function vis(k) { return S.sp === 'both' || S.sp === k; }

  /* ---------------------------------------------------------------- markup */
  function markup() {
    return '' +
      '<section class="ws3" id="rs-ws" aria-label="Resurrection plants: drying and coming back">' +
      '<p class="w-what">These are <b>leaf cells</b> of two <b>resurrection plants</b>: plants that can dry out almost completely, look dead, and turn green again after rain. On the left is <i>Xerophyta viscosa</i>, on the right <i>Haberlea rhodopensis</i>. Each cell has a <b>wall</b> around it, a big water sac called the <b>vacuole</b>, and green <b>chloroplasts</b>, where light is turned into sugar.</p>' +
      '<p class="w-todo"><b>What to do:</b> watch the leaves dry, then drink again, or drag the <b>time</b> slider yourself. Compare the two plants: one takes its chloroplasts apart, the other keeps them. Click the view to pause or play; a click on a part also tells you what it is. Drag to turn the cells.</p>' +
      '<div class="w-grid">' +
      '<div class="w-3d"><div class="w-stage" id="rs-stage"><div class="w-gl" role="img" aria-label="Two small blocks of leaf cells that dry and refill"></div><div class="w-tags" aria-hidden="true"></div>' +
      '<p class="w-key" aria-hidden="true"><i style="background:#4fae45"></i>chloroplast <i style="background:#bfa77c"></i>taken apart <i style="background:#c8cf45"></i>with zeaxanthin <i style="background:#7be08a;border-radius:2px"></i>sugar <i style="background:#9a3d84"></i>sunscreen pigment</p>' +
      '<div class="w-panel" role="region" aria-live="polite" hidden></div></div>' +
      '<div class="w-bar"><button type="button" class="w-b" data-a="pause" aria-pressed="false">Pause</button><button type="button" class="w-b" data-a="step" hidden>Step</button>' +
      '<button type="button" class="w-b" data-a="auto" aria-pressed="true">Run the cycle</button><button type="button" class="w-b" data-a="names" aria-pressed="true">Names</button>' +
      '<button type="button" class="w-b" data-a="zin" aria-label="Zoom in">+</button><button type="button" class="w-b" data-a="zout" aria-label="Zoom out">−</button><button type="button" class="w-b" data-a="home">Reset view</button></div>' +
      (window.WPMolColor ? WPMolColor.key(['h2o']) : '') + '</div>' +
      '<div class="w-side">' +
      '<div class="w-modes" role="group" aria-label="Which plant"><button type="button" data-m="x" aria-pressed="false">XEROPHYTA<i>takes it apart</i></button><button type="button" data-m="both" aria-pressed="true">BOTH<i>side by side</i></button><button type="button" data-m="h" aria-pressed="false">HABERLEA<i>keeps it</i></button></div>' +
      '<div class="w-c"><label for="rs-t">Time <output id="rs-t-o"></output></label><input type="range" id="rs-t" min="0" max="1000" step="1" value="0"><div class="h">Left part: the leaf dries. Right part: water returns. The pace between the marked points is a sketch ' + E_('rs.model', 'Model') + '</div></div>' +
      '<p class="w-now" aria-live="polite"><b>What just happened:</b> <span id="rs-now">The leaves are full of water. The cells are round and firm and the chloroplasts are making sugar.</span></p>' +
      '<div class="w-cnt">' +
      '<div class="w-t"><span>Water left (RWC)</span><b id="rs-r-rwc">100 %</b><small id="rs-r-rwc2"></small></div>' +
      '<div class="w-t"><span>Photosynthesis</span><b id="rs-r-ps">on</b><small id="rs-r-ps2"></small></div>' +
      '<div class="w-t"><span>Chlorophyll</span><b id="rs-r-chl">kept</b><small id="rs-r-chl2"></small></div>' +
      '<div class="w-t"><span>Sugars</span><b id="rs-r-sug">normal</b><small id="rs-r-sug2"></small></div>' +
      '</div>' +
      '<div class="w-c"><label for="rs-part">Name a part</label><select id="rs-part"><option value="">Pick a part to read about it</option>' +
      '<option value="wall">Cell wall</option><option value="vac">Central vacuole</option><option value="svac">Small vacuoles</option><option value="chlx">Chloroplast, taken apart</option><option value="chlh">Chloroplast, kept</option><option value="sugar">Sugars</option><option value="water">Water</option><option value="epix">Upper skin, with sunscreen</option></select></div>' +
      '</div></div>' +
      '<div class="w-row2">' +
      '<div><canvas class="w-cv" id="rs-scan" role="img" aria-label="Live cut through one cell of each plant"></canvas>' +
      '<p class="cap">A cut through one cell of each plant, drawn live from the 3D model: the wall folds, the vacuole empties, sugars fill in. Model rendering, not a micrograph ' + B_('ILLUSTRATIVE') + '</p></div>' +
      '<div><canvas class="w-cv" id="rs-plot" role="img" aria-label="Water left in the leaf along the drying and rewatering cycle"></canvas>' +
      '<p class="cap">Water left in the leaf along the cycle. Dots mark reported thresholds ' + E_('rs.x.ps', 'Farrant 2015') + ' ' + E_('rs.h.leak', 'Mihailova 2018') + '; the line between them is a sketch ' + B_('ILLUSTRATIVE') + '.</p></div>' +
      '</div>' +
      whyFold() +
      '</section>' + boxes();
  }

  function whyFold() {
    return '<details class="why" id="rs-why"><summary>Why does this happen?</summary><ul>' +
      '<li><b>Water left, in per cent.</b> Relative water content (RWC) is the water a leaf holds now, as a share of the water it holds when it is full. 100 % is a full leaf. Xerophyta dries to 5 % or less ' + T_('rs.x.resp') + ', Haberlea to 6.5 % ' + T_('rs.h.dry') + '.</li>' +
      '<li><b>Letting go, not holding on.</b> A cactus survives drought by keeping its water. A resurrection plant lets almost all of it go ' + T_('rs.cactus') + '. Xerophyta loses 95 % of its cell water and is fully working again within 3 days of rewatering ' + T_('rs.x.loss') + '.</li>' +
      '<li><b>Where is the line?</b> Scientists call a plant <b>desiccation tolerant</b> (able to survive drying right out) when it can dry to less than 0.1 g of water per gram of dry matter and still live ' + T_('rs.line') + '. That is a water potential of about −100 MPa, about as dry as a leaf left in air at 50 % humidity ' + T_('rs.mpa') + '.' + ladder() + '</li>' +
      '<li><b>Sugar instead of water.</b> As water leaves, sugars take its place around membranes and proteins and set into a <b>glass</b>, a solid that is not a crystal ' + T_('rs.glass') + '. Late in drying, Xerophyta raises sucrose 30 to 50 fold and raffinose and stachyose 25 fold ' + T_('rs.x.sugar') + '. In the drawing the sugar beads stop jiggling when the leaf is dry: the glass holds them still.</li>' +
      '<li><b>Two ways to save the green machinery.</b> Take it apart, or guard it ' + T_('rs.two') + '. Xerophyta switches photosynthesis off by 55 % RWC and takes its chloroplasts apart ' + T_('rs.x.ps') + '; after rewatering its chlorophyll starts to come back after 24 h and the chloroplasts are rebuilt after 3 days ' + T_('rs.x.rebuild') + '. Haberlea keeps its chlorophyll down to 6.5 % RWC and piles up zeaxanthin, a yellow pigment that protects it from light ' + T_('rs.h.dry') + '. Craterostigma keeps its chlorophyll too ' + T_('rs.crat') + '.</li>' +
      '<li><b>Slow is safe.</b> A third plant, not drawn here: the resurrection grass <i>Sporobolus stapfianus</i> survives only if it dries slowly, over 7 days or more. Its protection switches on when the leaf falls to 60 % RWC; leaves cut off before that point do not survive drying ' + T_('rs.spor') + '.</li>' +
      '<li class="tier-2"><b>Borrowed from seeds.</b> Most seeds survive drying. Drying Xerophyta leaves switch on genes typical of drying seeds, including relatives of ABI3 and ABI5, which steer seed ripening ' + T_('rs.seed') + '. Craterostigma switches on many <b>LEA</b> genes (late embryogenesis abundant, named after the late stage of a seed embryo), the same family that builds up in drying seeds ' + T_('rs.crat') + '.</li>' +
      '<li class="tier-2"><b>Small and slow.</b> Plants that survive full drying tend to be small or slow growing; physical limits may keep it to plants shorter than about 3 m ' + T_('rs.small') + '.</li>' +
      '</ul></details>' +
      '<details class="why tier-3" id="rs-expert"><summary>Expert: the details behind the drawing</summary><ul>' +
      '<li><b>Xerophyta viscosa, the drying run.</b> Under 16 h of light at 350 µmol m⁻² s⁻¹ (25 °C) and 8 h of dark (20 °C), roots reached air dry in about 9 days and leaves in about 15 days; leaves regained full turgor (cells firm with water again) 3 days after rewatering ' + T_('rs.x.time') + '. Below 10 % RWC respiration stops ' + T_('rs.x.resp') + '. Verbascose also rises tenfold ' + T_('rs.x.sugar') + '. The day ticks on the plot use these end points; the curve between them is drawn ' + B_('ILLUSTRATIVE') + '.</li>' +
      '<li><b>Two names for two strategies.</b> Plants that keep chlorophyll are called <b>homoiochlorophyllous</b>; plants that take it apart are <b>poikilochlorophyllous</b>. Genes for ELIPs (early light induced proteins, which protect against excess light) are enriched in the plants that keep it ' + T_('rs.two') + '; the genome of Boea hygrometrica carries extra ELIP copies, and about 20 % of its genes respond to drying ' + T_('rs.boea') + '.</li>' +
      '<li><b>Haberlea rhodopensis in detail.</b> At 6.5 % RWC the chlorophyll a to b ratio of the thylakoids was almost unchanged, zeaxanthin rose strongly and part of the light harvesting antenna moved from photosystem II to photosystem I; the plants were dried in very low light ' + T_('rs.h.dry') + '. Ion leakage rose sharply at 8 % RWC and was close to control 1 day after rehydration ' + T_('rs.h.leak') + '. More than 15,000 genes changed activity from about 20 % RWC ' + T_('rs.h.genes') + '.</li>' +
      '<li><b>Craterostigma plantagineum.</b> Hydrated leaves hold the eight carbon sugar octulose and turn it into sucrose as they dry, and back on rewatering ' + T_('rs.crat') + '.</li>' +
      '<li><b>Other ways to survive drying.</b> The spike moss Selaginella lepidophylla keeps its protective sugars on hand all the time ' + T_('rs.sela') + '. Mosses such as Tortula ruralis are always protected and repair damage after water returns ' + T_('rs.moss') + '.</li>' +
      '<li><b>How dry were the leaves in the field?</b> Field dry leaves of southern African resurrection plants matched air at 30 to 40 % relative humidity ' + T_('rs.gaff') + ', which works out to a water potential of about −124 to −163 MPa at 20 °C (more negative means drier) ' + T_('rs.kelvin') + '.</li>' +
      '<li><b>How long can they wait?</b> It differs between species and between reports, so no single number is given ' + T_('rs.survive') + '.</li>' +
      '<li><b>What the drawing leaves out.</b> ' + esc(CQ.evidence['rs.model'].claim) + ' ' + T_('rs.model') + '</li>' +
      '</ul></details>';
  }
  /* a small water potential ladder (static SVG, original) */
  function ladder() {
    var W = 560, x = function (v) { return 24 + (-v) / 200 * (W - 48); };
    var marks = [[-5, '−5 MPa: dehydration tolerance begins', 0], [-94, '−94: air at 50 % humidity, 20 °C', 1], [-100, '−100: the desiccation tolerance line', 2], [-143, '−124 to −163: field dry leaves', 3]];
    var g = '<rect x="24" y="22" width="' + (W - 48) + '" height="12" rx="6" fill="url(#rsLg)"/>';
    [0, -50, -100, -150, -200].forEach(function (v) { g += '<line x1="' + x(v) + '" x2="' + x(v) + '" y1="34" y2="40" stroke="currentColor"/><text x="' + x(v) + '" y="16" font-size="11" text-anchor="middle" fill="currentColor">' + (v ? '−' + (-v) : '0') + '</text>'; });
    g += '<rect x="' + x(-124) + '" y="20" width="' + (x(-163) - x(-124)) + '" height="16" fill="none" stroke="currentColor" stroke-width="1.5"/>';
    marks.forEach(function (m) {
      var X = x(m[0]), y = 56 + m[2] * 17, anchor = X > W * 0.62 ? 'end' : 'start';
      g += '<line x1="' + X + '" x2="' + X + '" y1="36" y2="' + (y - 4) + '" stroke="currentColor" stroke-width="1" opacity=".6"/><circle cx="' + X + '" cy="28" r="3" fill="currentColor"/>' +
        '<text x="' + (anchor === 'end' ? X - 4 : X + 4) + '" y="' + y + '" font-size="12" text-anchor="' + anchor + '" fill="currentColor">' + m[1] + '</text>';
    });
    return '<svg class="cq-fig" viewBox="0 0 ' + W + ' 128" role="img" aria-label="Water potential scale from 0 to minus 200 megapascals, with the desiccation tolerance line at minus 100" style="max-width:620px;margin:6px 0 2px;color:var(--ink)">' +
      '<defs><linearGradient id="rsLg" x1="0" x2="1"><stop offset="0" stop-color="#5487c3"/><stop offset=".5" stop-color="#c9b48a"/><stop offset="1" stop-color="#9a4320"/></linearGradient></defs>' + g +
      '<text x="' + (W - 24) + '" y="124" font-size="11" text-anchor="end" fill="currentColor">water potential, MPa</text></svg>' +
      '<span style="font:400 13px/1.4 var(--ui);color:var(--ink2)">Scale ' + E_('rs.mpa', 'Marks et al. 2025') + ' ' + B_('DERIVED') + ' ' + E_('rs.kelvin', 'air humidity to MPa') + '</span>';
  }
  function boxes() {
    return '<section class="cq-box" id="rs-myro" aria-labelledby="rs-myro-h"><h3 id="rs-myro-h">The woody one: how does a dry shrub refill its pipes?</h3>' +
      '<p class="sub">' + B_('OPEN') + ' Two research groups disagree. This site shows both and does not pick a side.</p>' +
      '<p><i>Myrothamnus flabellifolia</i> is the only woody resurrection plant, a shrub 0.5 to 1.5 m tall ' + T_('rs.myro') + '. When it dries, its <b>xylem</b> (the water pipes of the wood) fills with air. When rain returns, the pipes must fill with water again, from the bottom up. What pushes or pulls the water back in?</p>' +
      '<div class="cq-two"><div><svg class="cq-fig" id="rs-myro-fig" viewBox="0 0 300 220" style="max-width:300px;margin:0 auto" role="img" aria-label="A xylem vessel refilling, with the force each side proposes"></svg>' +
      '<div class="w-modes" role="group" aria-label="Which side" style="margin:6px auto 0;max-width:340px"><button type="button" data-side="a" aria-pressed="true">SIDE A<i>capillary pull</i></button><button type="button" data-side="b" aria-pressed="false">SIDE B<i>root pressure</i></button></div></div>' +
      '<div style="display:flex;flex-direction:column;gap:8px">' +
      '<div class="cq-side on" data-sidebox="a"><h4>Side A: capillary pull (Sherwin et al. 1998)</h4>The vessels are narrow, 14 µm across on average, and root pressure (the push of water up from the roots) on rewatering was low, 2.4 kPa. Water creeping up narrow tubes, as it does up a thin straw, was judged enough to refill them ' + T_('rs.sherwin') + '.</div>' +
      '<div class="cq-side" data-sidebox="b"><h4>Side B: root pressure (Schneider et al. 2000)</h4>The dry pipe walls are lined with a fatty layer 20 to 80 nm thick, so water does not wet them well and capillary rise stays weak. Gentle pushing from the roots does most of the refilling in rooted plants ' + T_('rs.schneider') + '.</div>' +
      '<p style="margin:0;font:400 13.5px/1.45 var(--ui);color:var(--ink2)">Their vessel sizes differ too: 14 µm across against a radius of about 18 µm. Different plants, methods and definitions may explain this.</p></div></div></section>' +
      '<section class="cq-box" id="rs-crop" aria-labelledby="rs-crop-h"><h3 id="rs-crop-h">Could crops learn this?</h3>' +
      '<p>Researchers hope these plants will help breed or engineer crops that cope better with drought. So far, attempts to move these abilities into crops have had only limited success ' + T_('rs.crop') + '. Surviving drying and growing fast may be hard to do at the same time ' + T_('rs.small') + '.</p></section>';
  }
  function myroFig(side) {
    var a = side === 'a', g = '';
    var wall = a ? '#8a7a62' : '#c9902f';
    g += '<rect x="0" y="0" width="300" height="220" fill="none"/>';
    g += '<rect x="122" y="14" width="56" height="186" rx="6" fill="none" stroke="' + wall + '" stroke-width="' + (a ? 3 : 5) + '"/>';
    if (!a) g += '<text x="186" y="40" font-size="11.5" fill="currentColor">fatty lining</text><text x="186" y="54" font-size="11.5" fill="currentColor">20 to 80 nm</text>';
    g += '<path d="M125 196 L125 120 Q150 ' + (a ? 104 : 128) + ' 175 120 L175 196 Z" fill="#5487c3" opacity=".75"/>';
    g += '<text x="150" y="78" font-size="12" text-anchor="middle" fill="currentColor">air</text>';
    if (a) {
      g += '<path d="M118 160 L118 112" stroke="#2b5fa4" stroke-width="3" marker-end="url(#rsAr)"/><path d="M182 160 L182 112" stroke="#2b5fa4" stroke-width="3" marker-end="url(#rsAr)"/>';
      g += '<text x="112" y="140" font-size="12" text-anchor="end" fill="currentColor">capillary</text><text x="112" y="154" font-size="12" text-anchor="end" fill="currentColor">pull</text>';
      g += '<text x="150" y="214" font-size="11" text-anchor="middle" fill="currentColor">root pressure low, 2.4 kPa</text>';
    } else {
      g += '<path d="M150 214 L150 150" stroke="#9a4320" stroke-width="5" marker-end="url(#rsAr2)"/>';
      g += '<text x="112" y="140" font-size="12" text-anchor="end" fill="currentColor">walls wet</text><text x="112" y="154" font-size="12" text-anchor="end" fill="currentColor">poorly</text>';
      g += '<text x="186" y="196" font-size="12" fill="currentColor">push from</text><text x="186" y="210" font-size="12" fill="currentColor">the roots</text>';
    }
    return '<defs><marker id="rsAr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" fill="#2b5fa4"/></marker><marker id="rsAr2" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0L10 5L0 10z" fill="#9a4320"/></marker></defs>' +
      '<g style="color:var(--ink)">' + g + '</g>';
  }

  /* ---------------------------------------------------------------- geometry helpers */
  var CELLS = [[-1.1, -0.62], [0, -0.62], [1.1, -0.62], [-1.1, 0.62], [0, 0.62], [1.1, 0.62]], RX = 0.56, RY = 0.95, RZ = 0.62, NCH = 8, NSU = 14, NSV = 6;
  var merge = function (T, parts) { return CQ.mergeGeo(T, parts); };

  /* ---------------------------------------------------------------- 3D */
  function build3D(stage) {
    var T = window.THREE, host = stage.querySelector('.w-gl'), tagHost = stage.querySelector('.w-tags');
    var renderer;
    try { renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' }); } catch (e) { return null; }
    if (!renderer || !renderer.getContext()) return null;
    renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
    renderer.outputEncoding = T.sRGBEncoding;
    host.appendChild(renderer.domElement);
    var W = 0, H = 0;
    var scene = new T.Scene(), cam = new T.PerspectiveCamera(34, 1.5, 0.1, 100);
    scene.add(new T.HemisphereLight(0xeef6e6, 0x1c2a1e, 0.75));
    var dl = new T.DirectionalLight(0xfff3dd, 0.95); dl.position.set(4, 8, 6); scene.add(dl);
    var dl2 = new T.DirectionalLight(0x9fc4ff, 0.35); dl2.position.set(-6, -2, -4); scene.add(dl2);
    var blocks = {};
    var chGeo = new T.SphereGeometry(1, 14, 10), suGeo = new T.TorusGeometry(0.05, 0.02, 5, 6), svGeo = new T.SphereGeometry(1, 14, 10), epGeo = new T.SphereGeometry(1, 16, 8);
    var wGeo = CQ.waterGeo(T, 0.05);
    var dummy = new T.Object3D(), col = new T.Color(), cA = new T.Color(), cB = new T.Color();
    ['x', 'h'].forEach(function (k, bi) {
      var grp = new T.Group(); scene.add(grp);
      var cells = CELLS.map(function (c, i) {
        var g = new T.SphereGeometry(1, 40, 28), base = g.attributes.position.array.slice();
        var m = new T.MeshStandardMaterial({ color: 0xe4eed2, roughness: 0.55, metalness: 0, transparent: true, opacity: 0.26, side: T.DoubleSide, depthWrite: false });
        var mesh = new T.Mesh(g, m); mesh.position.set(c[0], 0, c[1]); mesh.renderOrder = 3; mesh.userData = { part: 'wall', k: k };
        var rim = new T.Mesh(g, new T.MeshBasicMaterial({ color: 0xcfe0b8, wireframe: true, transparent: true, opacity: 0.07, depthWrite: false }));
        rim.renderOrder = 4; mesh.add(rim);
        grp.add(mesh);
        var vm = new T.Mesh(new T.SphereGeometry(1, 28, 18), new T.MeshStandardMaterial({ color: new T.Color(WPMolColor.get('h2o', true)), roughness: 0.25, transparent: true, opacity: 0.42, depthWrite: false }));
        vm.position.copy(mesh.position); vm.renderOrder = 2; vm.userData = { part: 'vac', k: k }; grp.add(vm);
        return { mesh: mesh, base: base, vac: vm, seed: SP[k].seed + i * 1.7, c: c, cc: c.slice(), A: -1, s: -1 };
      });
      var chl = new T.InstancedMesh(chGeo, new T.MeshStandardMaterial({ roughness: 0.5, metalness: 0 }), CELLS.length * NCH);
      chl.userData = { part: k === 'x' ? 'chlx' : 'chlh', k: k }; grp.add(chl);
      var sug = new T.InstancedMesh(suGeo, new T.MeshStandardMaterial({ color: 0x7be08a, roughness: 0.4, emissive: 0x1d5a26, emissiveIntensity: 0.4 }), CELLS.length * NSU);
      sug.userData = { part: 'sugar', k: k }; grp.add(sug);
      var sv = new T.InstancedMesh(svGeo, new T.MeshStandardMaterial({ color: 0x9fe3d0, roughness: 0.3, transparent: true, opacity: 0.6, depthWrite: false }), CELLS.length * NSV);
      sv.userData = { part: 'svac', k: k }; sv.renderOrder = 2; grp.add(sv);
      var NE = 36, epi = new T.InstancedMesh(epGeo, new T.MeshStandardMaterial({ roughness: 0.75 }), NE);
      epi.userData = { part: k === 'x' ? 'epix' : 'epih', k: k }; grp.add(epi);
      var sugBase = [], svBase = [];
      for (var i = 0; i < CELLS.length * NSU; i++) { var u = hash(i * 3 + bi * 97), v = hash(i * 7 + 11 + bi * 31), w = hash(i * 13 + 5 + bi); sugBase.push([TAU * u, Math.acos(2 * v - 1), 0.5 + 0.3 * w]); }
      for (i = 0; i < CELLS.length * NSV; i++) { svBase.push([TAU * hash(i * 5 + 3 + bi), Math.acos(2 * hash(i * 11 + 1 + bi) - 1), 0.25 + 0.3 * hash(i * 17 + bi)]); }
      blocks[k] = { grp: grp, cells: cells, chl: chl, sug: sug, sv: sv, epi: epi, NE: NE, sugBase: sugBase, svBase: svBase, st: null };
    });
    /* water molecules: one pool */
    var NW = 110, water = new T.InstancedMesh(wGeo, new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.35 }), NW);
    water.userData = { part: 'water' }; scene.add(water);
    var WP = []; for (var wi = 0; wi < NW; wi++) WP.push({ on: false, t: 0, d: 1, a: new T.Vector3(), b: new T.Vector3(), c: new T.Vector3(), r: 0 });
    var acc = { x: 0, h: 0 };
    function spawn(k, dir) {
      var p = null; for (var i = 0; i < NW; i++) if (!WP[i].on) { p = WP[i]; break; } if (!p) return;
      var B = blocks[k], cell = B.cells[Math.floor(Math.random() * B.cells.length)], th = Math.random() * TAU, ph = 0.4 + Math.random() * 2.3, s = B.st ? B.st.shrink : 1;
      var inC = new T.Vector3(Math.sin(ph) * Math.cos(th) * RX * s * 0.8, Math.cos(ph) * RY * s * 0.8, Math.sin(ph) * Math.sin(th) * RZ * s * 0.8).add(cell.mesh.position).add(B.grp.position);
      var out = new T.Vector3(B.grp.position.x + (Math.random() - 0.5) * 3.4, 1.9 + Math.random() * 1.4, (Math.random() - 0.5) * 2.4);
      if (dir < 0) { p.a.copy(inC); p.b.copy(out); } else { out.y = -1.9 - Math.random() * 1.2; p.a.copy(out); p.b.copy(inC); }
      p.c.copy(p.a).add(p.b).multiplyScalar(0.5); p.c.x += (Math.random() - 0.5) * 1.2; p.c.z += (Math.random() - 0.5) * 1.2;
      p.on = true; p.t = 0; p.d = 1.6 + Math.random() * 1.2; p.r = Math.random() * TAU;
    }
    function stepWater(dt) {
      ['x', 'h'].forEach(function (k) {
        if (!vis(k)) return;
        var r = rwcOf(k, S.t), d = r - S.prevR[k]; S.prevR[k] = r;
        acc[k] += Math.min(6, Math.abs(d) * 0.9);
        while (acc[k] >= 1) { acc[k] -= 1; spawn(k, d < 0 ? -1 : 1); }
      });
      for (var i = 0; i < NW; i++) { var p = WP[i]; if (!p.on) continue; p.t += dt / p.d; if (p.t >= 1) p.on = false; }
    }
    var tv = new T.Vector3();
    function placeWater() {
      for (var i = 0; i < NW; i++) {
        var p = WP[i];
        if (!p.on) { dummy.position.set(0, -50, 0); dummy.scale.setScalar(0.0001); }
        else {
          var u = p.t, a = (1 - u) * (1 - u), b = 2 * u * (1 - u), c = u * u;
          dummy.position.set(a * p.a.x + b * p.c.x + c * p.b.x, a * p.a.y + b * p.c.y + c * p.b.y, a * p.a.z + b * p.c.z + c * p.b.z);
          dummy.scale.setScalar(Math.sin(Math.PI * clamp(u, 0, 1)) * 1.15 + 0.05); dummy.rotation.set(p.r + u * 3, p.r * 2 + u * 2, 0);
        }
        dummy.updateMatrix(); water.setMatrixAt(i, dummy.matrix);
      }
      water.instanceMatrix.needsUpdate = true;
    }
    /* cell shapes from the state */
    function shapeCell(cell, st) {
      var A = st.fold, s = st.shrink;
      if (Math.abs(A - cell.A) < 1e-4 && Math.abs(s - cell.s) < 1e-4) return;
      cell.A = A; cell.s = s;
      var g = cell.mesh.geometry, P = g.attributes.position.array, b = cell.base;
      for (var i = 0; i < P.length; i += 3) {
        var x = b[i], y = b[i + 1], z = b[i + 2], ph = Math.acos(clamp(y, -1, 1)), th = Math.atan2(z, x), f = foldR(th, ph, cell.seed, A) * s;
        P[i] = x * RX * f; P[i + 1] = y * RY * f; P[i + 2] = z * RZ * f;
      }
      g.attributes.position.needsUpdate = true; g.computeVertexNormals(); g.computeBoundingSphere();
    }
    var GREEN = new T.Color(0x4fae45), TAN = new T.Color(0xbfa77c), ZEA = new T.Color(0xc8cf45), EPI = new T.Color(0x6f8a5c), ANT = new T.Color(0x9a3d84);
    function layoutBlock(k, st) {
      var B = blocks[k], i, j, n = 0;
      B.st = st;
      B.cells.forEach(function (cell, ci) {
        shapeCell(cell, st);
        /* a packed tissue: centres move in with the shrink, so neighbours keep touching */
        cell.cc[0] = cell.c[0] * st.shrink; cell.cc[1] = cell.c[1] * st.shrink;
        cell.mesh.position.set(cell.cc[0], 0, cell.cc[1]); cell.vac.position.copy(cell.mesh.position);
        var s = st.shrink, vs = st.vac * (1 - 0.92 * st.split);
        cell.vac.scale.set(RX * s * 0.72 * Math.max(0.05, vs), RY * s * 0.72 * Math.max(0.05, vs), RZ * s * 0.72 * Math.max(0.05, vs));
        cell.vac.visible = vs > 0.06;
        for (j = 0; j < NCH; j++) {
          var th = j / NCH * TAU + cell.seed + S.clock * 0.05 * (st.rwc / 100), ph = 0.55 + (j % 4) * 0.68, rr = 0.82 * foldR(th, ph, cell.seed, st.fold) * s;
          dummy.position.set(cell.cc[0] + Math.sin(ph) * Math.cos(th) * RX * rr, Math.cos(ph) * RY * rr, cell.cc[1] + Math.sin(ph) * Math.sin(th) * RZ * rr);
          var sz = k === 'x' ? lerp(0.62, 1, st.chl) : 1;
          dummy.scale.set(0.17 * sz, 0.085 * sz, 0.13 * sz); dummy.lookAt(cell.cc[0], 0, cell.cc[1]); dummy.updateMatrix();
          B.chl.setMatrixAt(ci * NCH + j, dummy.matrix);
          if (k === 'x') col.copy(TAN).lerp(GREEN, st.chl); else col.copy(GREEN).lerp(ZEA, st.zeax * 0.75);
          B.chl.setColorAt(ci * NCH + j, col);
        }
        var nS = Math.round(st.sugar * NSU);
        for (j = 0; j < NSU; j++) {
          var q = B.sugBase[ci * NSU + j], jg = st.jig, tt = S.clock * 2.2 + j * 1.7 + ci;
          var r2 = q[2] * s * foldR(q[0], q[1], cell.seed, st.fold);
          dummy.position.set(cell.cc[0] + Math.sin(q[1]) * Math.cos(q[0]) * RX * r2 + Math.sin(tt) * jg, Math.cos(q[1]) * RY * r2 + Math.cos(tt * 1.3) * jg, cell.cc[1] + Math.sin(q[1]) * Math.sin(q[0]) * RZ * r2 + Math.sin(tt * 0.7) * jg);
          dummy.rotation.set(tt * 0.3 * (jg > 0.01 ? 1 : 0) + j, j * 0.7, 0);
          dummy.scale.setScalar(j < nS ? 1 : 0.0001); dummy.updateMatrix(); B.sug.setMatrixAt(ci * NSU + j, dummy.matrix);
        }
        for (j = 0; j < NSV; j++) {
          var w = B.svBase[ci * NSV + j], r3 = w[2] * s, sc = st.split * 0.17 * s * (0.8 + 0.4 * hash(j + ci));
          dummy.position.set(cell.cc[0] + Math.sin(w[1]) * Math.cos(w[0]) * RX * r3, Math.cos(w[1]) * RY * r3, cell.cc[1] + Math.sin(w[1]) * Math.sin(w[0]) * RZ * r3);
          dummy.rotation.set(0, 0, 0); dummy.scale.setScalar(Math.max(0.0001, sc)); dummy.updateMatrix(); B.sv.setMatrixAt(ci * NSV + j, dummy.matrix);
        }
      });
      /* upper and lower epidermis: one continuous layer of flattened cells lying on the block; the sunscreen tints the upper one */
      var sh = st.shrink, top = RY * sh * (1 - st.fold * 0.5) + 0.05, bot = -top, px = 3.32 * sh / 6, pz = 2.48 * sh / 3;
      for (i = 0; i < B.NE; i++) {
        var up = i < B.NE / 2, q2 = i % (B.NE / 2), ix = q2 % 6, iz = Math.floor(q2 / 6);
        dummy.position.set(-1.66 * sh + px * (ix + 0.5), up ? top : bot, -1.24 * sh + pz * (iz + 0.5)); dummy.rotation.set(0, 0, 0);
        dummy.scale.set(px * 0.56, 0.085, pz * 0.56); dummy.updateMatrix(); B.epi.setMatrixAt(i, dummy.matrix);
        col.copy(EPI).lerp(ANT, up ? st.antho * (0.8 + 0.2 * hash(i)) : 0).multiplyScalar(0.92 + 0.08 * hash(i * 3)); B.epi.setColorAt(i, col);
      }
      [B.chl, B.sug, B.sv, B.epi].forEach(function (m) { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; });
      n++;
    }
    /* layout of the two blocks */
    function applyMode() {
      blocks.x.grp.visible = vis('x'); blocks.h.grp.visible = vis('h');
      blocks.x.grp.position.x = S.sp === 'both' ? -2.3 : 0; blocks.h.grp.position.x = S.sp === 'both' ? 2.3 : 0;
      if (ctl) { ctl.setHome({ dist: homeDist() }); ctl.reset(); }
      dirty = true;
    }
    function homeDist() { var asp = W / Math.max(1, H); return (S.sp === 'both' ? 10 : 6.6) * Math.max(1, (S.sp === 'both' ? 1.6 : 1.1) / asp); }
    var ctl = CQ.orbit(host, cam, { target: new T.Vector3(0, 0.15, 0), dist: 12, theta: 0.42, phi: 1.12, minDist: 3, maxDist: 30, panLimit: 5, invalidate: function () { kick(); } });
    /* labels */
    var TAGS = [
      { id: 'nx', text: 'Xerophyta viscosa', k: 'x', p: function (v) { return v.set(0, RY * (blocks.x.st ? blocks.x.st.shrink : 1) + 0.55, -0.6).add(blocks.x.grp.position); }, big: 1 },
      { id: 'nh', text: 'Haberlea rhodopensis', k: 'h', p: function (v) { return v.set(0, RY * (blocks.h.st ? blocks.h.st.shrink : 1) + 0.55, -0.6).add(blocks.h.grp.position); }, big: 1 },
      { id: 'vac', text: 'vacuole', part: 'vac', p: function (v, k) { var c = blocks[k].cells[2]; return v.copy(c.vac.position).add(blocks[k].grp.position); } },
      { id: 'chl', text: 'chloroplast', part: 'chl', p: function (v, k) { var m = new T.Matrix4(); blocks[k].chl.getMatrixAt(5 * NCH + 1, m); return v.setFromMatrixPosition(m).add(blocks[k].grp.position); } },
      { id: 'wall', text: 'cell wall', part: 'wall', p: function (v, k) { var c = blocks[k].cells[3], s = blocks[k].st ? blocks[k].st.shrink : 1; return v.set(c.cc[0] - RX * s * 0.95, -RY * s * 0.35, c.cc[1]).add(blocks[k].grp.position); } },
      { id: 'sug', text: 'sugars', part: 'sugar', p: function (v, k) { var m = new T.Matrix4(); blocks[k].sug.getMatrixAt(4 * NSU + 0, m); return v.setFromMatrixPosition(m).add(blocks[k].grp.position); }, need: function (k) { return blocks[k].st && blocks[k].st.sugar > 0.35; } },
      { id: 'epi', text: 'sunscreen', part: 'epix', p: function (v, k) { return v.set(0.8 * blocks.x.st.shrink, RY * blocks.x.st.shrink + 0.2, 0.62 * blocks.x.st.shrink).add(blocks.x.grp.position); }, only: 'x', need: function () { return blocks.x.st && blocks.x.st.antho > 0.4; } }
    ];
    var tagEls = {};
    TAGS.forEach(function (g) { var e = document.createElement('span'); e.className = 'w-tag'; e.textContent = g.text; e.hidden = true; tagHost.appendChild(e); tagEls[g.id] = e; });
    var V = new T.Vector3();
    function drawTags() {
      var boxes = [];
      TAGS.forEach(function (g) {
        var e = tagEls[g.id], k = g.k || (S.sp === 'h' ? 'h' : g.only || 'x');
        if (g.only && !vis(g.only)) k = null;
        if (!k || !vis(k) || (!g.big && !S.names) || (g.need && !g.need(k))) { e.hidden = true; return; }
        g.p(V, k); V.project(cam);
        var x = (V.x + 1) / 2 * W, y = (1 - V.y) / 2 * H;
        if (V.z > 1 || x < 8 || x > W - 8 || y < 18 || y > H - 6) { e.hidden = true; return; }
        e.hidden = false; e.classList.toggle('pk', !!g.big);
        var w = e.offsetWidth || 70, bx = { x: clamp(x, w / 2 + 2, W - w / 2 - 2) - w / 2, y: y - 26, w: w, h: 22 };
        if (boxes.some(function (o) { return bx.x < o.x + o.w && bx.x + bx.w > o.x && bx.y < o.y + o.h && bx.y + bx.h > o.y; })) { e.hidden = true; return; }
        boxes.push(bx); e.style.left = (bx.x + w / 2).toFixed(1) + 'px'; e.style.top = y.toFixed(1) + 'px';
      });
    }
    /* picking */
    var ray = new T.Raycaster(), ndc = new T.Vector2();
    function pickAt(cx, cy) {
      var r = host.getBoundingClientRect(); ndc.set((cx - r.left) / r.width * 2 - 1, -((cy - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, cam);
      var inner = [], walls = [];
      ['x', 'h'].forEach(function (k) { if (!vis(k)) return; var B = blocks[k]; inner.push(B.chl, B.sug, B.sv, B.epi); B.cells.forEach(function (c) { if (c.vac.visible) inner.push(c.vac); walls.push(c.mesh); }); });
      inner.push(water);
      var h = ray.intersectObjects(inner, false); if (h.length) return h[0].object.userData.part;
      h = ray.intersectObjects(walls, false); if (h.length) return 'wall';
      return null;
    }
    /* loop */
    var running = false, visible = true, lastT = 0, dirty = true;
    function resize() {
      var w = host.clientWidth || 600, h = host.clientHeight || 400; if (w === W && h === H) return;
      W = w; H = h; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); ctl.setHome({ dist: homeDist() }); if (!resize.done) { ctl.reset(); ctl.jump(); resize.done = 1; } dirty = true;
    }
    function kick() { dirty = true; if (!running && visible && !document.hidden) { running = true; lastT = 0; requestAnimationFrame(loop); } }
    function loop(ts) {
      if (!visible || document.hidden) { running = false; return; }
      var dt = lastT ? Math.min(0.05, (ts - lastT) / 1000) : 0; lastT = ts;
      resize();
      if (!S.frozen) tick(dt * (window.PlaySpeed ? window.PlaySpeed.get() : 1));
      var mv = ctl.apply();
      if (!S.frozen || mv || dirty) { render(); dirty = false; }
      if (!S.frozen || mv || ctl.moving()) requestAnimationFrame(loop); else running = false;
    }
    function render() {
      ['x', 'h'].forEach(function (k) { if (vis(k)) layoutBlock(k, state(k, S.t)); });
      placeWater();
      renderer.render(scene, cam);
      drawTags();
      after();
    }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) kick(); }, { rootMargin: '80px' }).observe(stage);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) kick(); });
    applyMode(); resize();
    return { kick: kick, applyMode: applyMode, pickAt: pickAt, stepWater: stepWater, ctl: ctl, surface: host, render: function () { dirty = true; kick(); } };
  }

  /* ---------------------------------------------------------------- 2D drawing of one cell (scan pane and the no WebGL stage) */
  function cellPath(g, cx, cy, rx, ry, st, seed) {
    var N = 96, pts = [];
    for (var i = 0; i < N; i++) {
      var a = i / N * TAU, f = foldR(a, Math.PI / 2 + 0.35 * Math.sin(a * 2 + seed), seed, st.fold * 1.15) * st.shrink;
      pts.push([cx + Math.cos(a) * rx * f, cy + Math.sin(a) * ry * f]);
    }
    g.beginPath(); pts.forEach(function (p, i) { if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }); g.closePath();
    return pts;
  }
  function drawCell(g, cx, cy, rx, ry, k, st, pal, hits, seed) {
    seed = seed == null ? SP[k].seed : seed;
    cellPath(g, cx, cy, rx, ry, st, seed);
    g.fillStyle = pal.cyto; g.fill(); g.lineWidth = Math.max(2, rx * 0.06); g.strokeStyle = pal.wall; g.stroke();
    hits.push({ part: 'wall', test: function (x, y) { var dx = (x - cx) / (rx * st.shrink), dy = (y - cy) / (ry * st.shrink); return dx * dx + dy * dy < 1.15; } });
    var vs = st.vac * (1 - 0.92 * st.split);
    if (vs > 0.06) {
      g.beginPath(); g.ellipse(cx, cy, rx * 0.7 * st.shrink * vs, ry * 0.7 * st.shrink * vs, 0, 0, TAU); g.fillStyle = pal.vac; g.fill(); g.strokeStyle = pal.vacR; g.lineWidth = 1; g.stroke();
      hits.push({ part: 'vac', test: function (x, y) { var dx = (x - cx) / (rx * 0.7 * st.shrink * vs), dy = (y - cy) / (ry * 0.7 * st.shrink * vs); return dx * dx + dy * dy < 1; } });
    }
    var i;
    if (st.split > 0.05) for (i = 0; i < 7; i++) {
      var a = i / 7 * TAU + seed, rr = (0.3 + 0.18 * hash(i + seed)) * st.shrink, sx = cx + Math.cos(a) * rx * rr, sy = cy + Math.sin(a) * ry * rr, r0 = Math.min(rx, ry) * 0.16 * st.split * st.shrink;
      g.beginPath(); g.arc(sx, sy, Math.max(0.5, r0), 0, TAU); g.fillStyle = pal.svac; g.fill(); g.strokeStyle = pal.vacR; g.stroke();
      (function (sx, sy, r0) { hits.push({ part: 'svac', test: function (x, y) { return Math.hypot(x - sx, y - sy) < r0 + 3; } }); })(sx, sy, r0);
    }
    for (i = 0; i < 9; i++) {
      var b = i / 9 * TAU + seed * 0.5, f = foldR(b, Math.PI / 2, seed, st.fold * 1.15) * st.shrink * 0.8, px = cx + Math.cos(b) * rx * f, py = cy + Math.sin(b) * ry * f;
      var sz = k === 'x' ? lerp(0.62, 1, st.chl) : 1, c = k === 'x' ? mix(pal.tan, pal.green, st.chl) : mix(pal.green, pal.zea, st.zeax * 0.75);
      g.save(); g.translate(px, py); g.rotate(b + Math.PI / 2); g.beginPath(); g.ellipse(0, 0, rx * 0.17 * sz, rx * 0.08 * sz, 0, 0, TAU); g.fillStyle = c; g.fill();
      if (k === 'h' || st.chl > 0.5) { g.strokeStyle = 'rgba(20,50,20,.55)'; g.lineWidth = 0.8; for (var q = -1; q <= 1; q++) { g.beginPath(); g.moveTo(-rx * 0.1 * sz, q * rx * 0.025 * sz); g.lineTo(rx * 0.1 * sz, q * rx * 0.025 * sz); g.stroke(); } }
      g.restore();
      (function (px, py) { hits.push({ part: k === 'x' ? 'chlx' : 'chlh', test: function (x, y) { return Math.hypot(x - px, y - py) < rx * 0.17 + 3; } }); })(px, py);
    }
    var nS = Math.round(st.sugar * 16);
    g.strokeStyle = pal.sugar; g.lineWidth = 1.6;
    for (i = 0; i < nS; i++) {
      var aa = hash(i * 3 + seed) * TAU, r4 = (0.45 + 0.3 * hash(i * 7 + seed)) * st.shrink, jx = Math.sin(S.clock * 2 + i) * st.jig * rx * 0.6, hx = cx + Math.cos(aa) * rx * r4 + jx, hy = cy + Math.sin(aa) * ry * r4, hr = Math.max(2.2, rx * 0.045);
      g.beginPath(); for (var e = 0; e < 6; e++) { var an = e / 6 * TAU; g[e ? 'lineTo' : 'moveTo'](hx + Math.cos(an) * hr, hy + Math.sin(an) * hr); } g.closePath(); g.stroke();
      (function (hx, hy) { hits.push({ part: 'sugar', test: function (x, y) { return Math.hypot(x - hx, y - hy) < 6; } }); })(hx, hy);
    }
  }
  function mix(a, b, t) {
    var A = hex(a), B = hex(b); return 'rgb(' + Math.round(lerp(A[0], B[0], t)) + ',' + Math.round(lerp(A[1], B[1], t)) + ',' + Math.round(lerp(A[2], B[2], t)) + ')';
  }
  function hex(h) { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
  function palette(darkStage) {
    var d = darkStage || CQ.isDark();
    return { cyto: d ? '#24372a' : '#e7eedb', wall: d ? '#d6e6c0' : '#55704a', vac: d ? 'rgba(128,223,255,.38)' : 'rgba(29,74,165,.22)', vacR: d ? 'rgba(160,230,255,.6)' : 'rgba(29,74,165,.5)', svac: d ? 'rgba(159,227,208,.55)' : 'rgba(40,140,120,.3)',
      green: d ? '#4fae45' : '#3c8a33', tan: d ? '#bfa77c' : '#a68d5e', zea: d ? '#c8cf45' : '#a6ab22', sugar: d ? '#7be08a' : '#2f8a45', ink: d ? '#ece6da' : '#2a231c', ink2: d ? '#b3aca0' : '#5e5141', anth: '#9a3d84' };
  }

  /* ---------------------------------------------------------------- linked panes */
  var EL = null, G = null, SC = { hits: [] }, FB = { hits: [] };
  function drawScan() {
    var cv = EL.scan, narrow = cv.clientWidth < 420, c = CQ.canvas(cv, narrow ? 230 : 250), g = c.g, pal = palette(false), ks = ['x', 'h'].filter(vis);
    g.clearRect(0, 0, c.w, c.h); SC.hits = [];
    var cw = c.w / ks.length;
    ks.forEach(function (k, i) {
      var st = state(k, S.t), cx = cw * (i + 0.5), cy = c.h * 0.52, rx = Math.min(cw * 0.36, c.h * 0.34), ry = Math.min(c.h * 0.36, rx * 1.15);
      var hits = [];
      drawCell(g, cx, cy, rx, ry, k, st, pal, hits);
      hits.reverse().forEach(function (h) { SC.hits.push(h); });
      g.fillStyle = pal.ink; g.font = 'italic 600 13px ' + CQ.css('--ui', 'sans-serif'); g.textAlign = 'center';
      g.fillText(SP[k].name, cx, 18);
      g.font = '500 12px ' + CQ.css('--mono', 'monospace'); g.fillStyle = pal.ink2;
      g.fillText('water left ' + Math.round(st.rwc) + ' %', cx, c.h - 10);
    });
  }
  function drawPlot() {
    var cv = EL.plot, c = CQ.canvas(cv, 250), g = c.g, L = 40, R = 12, Tp = 18, Bt = 40, w = c.w - L - R, h = c.h - Tp - Bt;
    var ink = CQ.css('--ink', '#2a231c'), ink2 = CQ.css('--ink2', '#5e5141'), rule = CQ.css('--rule2', '#c4b597'), card = CQ.css('--card', '#ebe2cb');
    var colX = CQ.isDark() ? '#f08a5d' : '#9a4320', colH = CQ.isDark() ? '#8fb8ff' : '#2b5fa4', ui = CQ.css('--ui', 'sans-serif');
    g.clearRect(0, 0, c.w, c.h);
    function X(t) { return L + t * w; } function Y(r) { return Tp + (1 - r / 100) * h; }
    g.fillStyle = card; g.fillRect(X(DRY), Tp, w * (1 - DRY), h);
    g.strokeStyle = rule; g.lineWidth = 1; g.font = '11px ' + ui; g.fillStyle = ink2; g.textAlign = 'right';
    [0, 50, 100].forEach(function (r) { g.beginPath(); g.moveTo(L, Y(r)); g.lineTo(L + w, Y(r)); g.stroke(); g.fillText(r + ' %', L - 4, Y(r) + 4); });
    g.textAlign = 'center'; g.fillStyle = ink;
    g.font = '600 11.5px ' + ui; g.fillText('drying', X(DRY / 2), c.h - 6); g.fillText('water returns', X((1 + DRY) / 2), c.h - 6);
    if (vis('x')) {
      g.font = '10.5px ' + ui; g.fillStyle = ink2;
      [0, 5, 10, 15].forEach(function (d) { var x = X(d / 15 * DRY); g.fillText(d === 0 ? '0' : 'day ' + d, x, Tp + h + 13); });
      [1, 2, 3].forEach(function (d) { g.fillText('day ' + d, X(DRY + d / 3 * (1 - DRY)), Tp + h + 13); });
    }
    var boxes = [], narrow = c.w < 460;
    /* labels: staggered rows with leader lines, never on top of another label or a dot */
    function placeLabels(list) {
      g.font = (narrow ? '10px ' : '10.5px ') + ui;
      list.forEach(function (m) { boxes.push({ x: m.x - 6, y: m.y - 6, w: 12, h: 12 }); });
      var rows = [-20, 10, -36, 26, -52, 42, -68, 58, -84, 74, -100, 90, -116];
      list.forEach(function (m) {
        var tw = g.measureText(m.t).width + 8, hit = null;
        for (var r = 0; r < rows.length && !hit; r++) for (var sd = 0; sd < 2 && !hit; sd++) {
          var bx = { x: sd ? m.x - tw - 4 : m.x + 4, y: m.y + rows[r] - 7, w: tw, h: 14 };
          bx.x = clamp(bx.x, L + 2, L + w - tw - 2);
          if (bx.y < Tp + 1 || bx.y + bx.h > Tp + h - 1) continue;
          if (boxes.some(function (o) { return bx.x < o.x + o.w && bx.x + bx.w > o.x && bx.y < o.y + o.h && bx.y + bx.h > o.y; })) continue;
          hit = bx;
        }
        if (!hit) return;
        boxes.push(hit);
        var ly = hit.y + hit.h / 2, lx = clamp(m.x, hit.x, hit.x + hit.w);
        g.strokeStyle = m.c; g.lineWidth = 1; g.beginPath(); g.moveTo(m.x, m.y); g.lineTo(lx, ly < m.y ? hit.y + hit.h : hit.y); g.stroke();
        g.fillStyle = CQ.css('--wall', '#faf6ec'); g.fillRect(hit.x, hit.y, hit.w, hit.h); g.strokeStyle = m.c; g.strokeRect(hit.x + 0.5, hit.y + 0.5, hit.w - 1, hit.h - 1);
        g.fillStyle = m.c; g.textAlign = 'left'; g.fillText(m.t, hit.x + 4, hit.y + 10.5);
      });
    }
    function crossT(k, thr, wet) { for (var i = 0; i <= 400; i++) { var t = wet ? DRY + i / 400 * (1 - DRY) : i / 400 * DRY, r = rwcOf(k, t); if (wet ? r >= thr : r <= thr) return t; } return null; }
    var ks = ['x', 'h'].filter(vis);
    ks.forEach(function (k) {
      var cc = k === 'x' ? colX : colH;
      g.strokeStyle = cc; g.lineWidth = 2.2; g.setLineDash(k === 'h' ? [6, 4] : []);
      g.beginPath(); for (var i = 0; i <= 200; i++) { var t = i / 200, y = Y(rwcOf(k, t)); if (i) g.lineTo(X(t), y); else g.moveTo(X(t), y); } g.stroke(); g.setLineDash([]);
    });
    var marks = [];
    if (vis('x')) marks.push(['x', 55, false, narrow ? 'sugar making off, 55 %' : 'photosynthesis off, 55 %'], ['x', 10, false, narrow ? 'breathing stops, 10 %' : 'breathing stops below 10 %'], ['x', 50, true, narrow ? 'day 1: 50 %' : 'day 1: 50 %, rebuilding']);
    if (vis('h')) marks.push(['h', 20, false, narrow ? 'genes switch, 20 %' : 'genes switch, about 20 %'], ['h', 8, false, narrow ? 'leaky, 8 %' : 'membranes leak, 8 %']);
    if (vis('h') && !vis('x')) marks.push(['h', 6.5, false, 'dry at 6.5 %']);
    var L2 = [];
    marks.forEach(function (m) {
      var t = crossT(m[0], m[1], m[2]); if (t == null) return;
      var x = X(t), y = Y(m[1]), cc = m[0] === 'x' ? colX : colH;
      g.beginPath(); g.arc(x, y, 4, 0, TAU); g.fillStyle = cc; g.fill(); g.strokeStyle = CQ.css('--wall', '#fff'); g.lineWidth = 1.5; g.stroke();
      L2.push({ x: x, y: y, t: m[3], c: cc });
    });
    g.strokeStyle = ink; g.lineWidth = 1.5; g.beginPath(); g.moveTo(X(S.t), Tp); g.lineTo(X(S.t), Tp + h); g.stroke();
    ks.forEach(function (k) { g.beginPath(); g.arc(X(S.t), Y(rwcOf(k, S.t)), 5, 0, TAU); g.fillStyle = k === 'x' ? colX : colH; g.fill(); g.strokeStyle = CQ.css('--wall', '#fff'); g.lineWidth = 2; g.stroke(); });
    boxes.push({ x: X(S.t) - 7, y: Tp, w: 14, h: h }); placeLabels(L2);
    g.font = '600 11px ' + ui; g.textAlign = 'left';
    var lx = L + 4; ks.forEach(function (k) { var cc = k === 'x' ? colX : colH; g.fillStyle = cc; g.fillRect(lx, 4, 14, 3); g.fillText(SP[k].short, lx + 18, 10); lx += g.measureText(SP[k].short).width + 34; });
    g.fillStyle = ink2; g.textAlign = 'right'; g.font = '11px ' + ui; g.fillText('water left (RWC)', L + w, 10);
  }
  function drawFallback() {
    var cv = FB.cv; if (!cv) return;
    var c = CQ.canvas(cv), g = c.g, pal = palette(true), ks = ['x', 'h'].filter(vis);
    g.clearRect(0, 0, c.w, c.h); FB.hits = [];
    var bw = c.w / ks.length;
    ks.forEach(function (k, bi) {
      var st = state(k, S.t), n = 3, rx = Math.min(bw / (n * 2.3), c.h * 0.17), ry = rx * 1.7, cy = c.h * 0.55;
      var hits = [];
      for (var i = 0; i < n; i++) drawCell(g, bw * bi + bw / 2 + (i - 1) * rx * 2.2, cy, rx, ry, k, st, pal, hits, SP[k].seed + i * 1.7);
      var top = cy - ry * st.shrink - 10;
      g.fillStyle = mix('#cfdcb8', pal.anth, st.antho); g.fillRect(bw * bi + bw / 2 - rx * 3.3, top - 10, rx * 6.6, 9);
      hits.push({ part: k === 'x' ? 'epix' : 'epih', test: function (x, y) { return y > top - 12 && y < top + 1 && Math.abs(x - (bw * bi + bw / 2)) < rx * 3.3; } });
      hits.reverse().forEach(function (h) { FB.hits.push(h); });
      g.fillStyle = '#f4f1e8'; g.font = 'italic 600 13px ' + CQ.css('--ui', 'sans-serif'); g.textAlign = 'center'; g.fillText(SP[k].name, bw * bi + bw / 2, 22);
    });
    g.fillStyle = '#dfe8d3'; g.font = '12px ' + CQ.css('--ui', 'sans-serif'); g.textAlign = 'left';
    g.fillText('Flat drawing (3D is not available here). Same cells, same timeline.', 10, c.h - 10);
  }

  /* ---------------------------------------------------------------- readouts and messages */
  function word(st) {
    return {
      ps: st.k === 'x' ? (st.ps > 0.95 ? 'on' : st.ps > 0.05 ? (st.wet ? 'restarting' : 'slowing') : 'off') : (st.ps > 0.95 ? 'on' : st.ps > 0.05 ? (st.wet ? 'restarting' : 'slowing') : 'paused'),
      chl: st.k === 'x' ? (st.chl > 0.95 ? 'whole' : st.wet && st.day >= 1 ? 'rebuilding' : st.chl < 0.12 ? 'taken apart' : 'coming apart') : (st.zeax > 0.3 ? 'kept, guarded' : 'kept'),
      sug: st.sugar < 0.05 ? 'normal' : st.sugar > 0.9 ? (st.k === 'x' ? 'sucrose ×30 to 50' : 'high') : (st.wet ? 'falling' : 'rising')
    };
  }
  function syncUI() {
    var ks = ['x', 'h'].filter(vis), sts = ks.map(function (k) { return state(k, S.t); });
    var s0 = sts[0], wet = S.t >= DRY;
    EL.tO.textContent = (wet ? 'water returns' : 'drying') + (vis('x') ? ', day ' + (state('x', S.t).day < 1 && wet ? state('x', S.t).day.toFixed(1) : Math.round(state('x', S.t).day)) : '');
    EL.t.value = Math.round(S.t * 1000);
    EL.t.setAttribute('aria-valuetext', EL.tO.textContent + ', water left ' + sts.map(function (s) { return SP[s.k].short + ' ' + Math.round(s.rwc) + ' %'; }).join(', '));
    function put(id, f, f2) {
      var b = document.getElementById(id), sm2 = document.getElementById(id + '2');
      if (sts.length === 1) { b.textContent = f(s0); sm2.textContent = f2 ? f2(s0) : ''; }
      else { b.textContent = sts.map(function (s) { return f(s); }).join(' · '); sm2.textContent = 'Xerophyta · Haberlea'; }
    }
    put('rs-r-rwc', function (s) { return Math.round(s.rwc) + ' %'; }, function (s) { return SP[s.k].short + (s.k === 'x' ? ', air dry at 5 % or less' : ', dried to 6.5 %'); });
    put('rs-r-ps', function (s) { return word(s).ps; }, function (s) { return s.k === 'x' ? 'off by 55 % water left' : 'no threshold in our sources'; });
    put('rs-r-chl', function (s) { return word(s).chl; }, function (s) { return s.k === 'x' ? 'rebuilt 3 days after rain' : 'zeaxanthin protects it'; });
    put('rs-r-sug', function (s) { return word(s).sug; }, function (s) { return s.k === 'x' ? 'late in drying' : 'turns stored sugar into sucrose'; });
    events();
  }
  /* "what just happened": thresholds crossed since the last update */
  var EV_LIST = [
    { k: 'x', r: 55, dry: true, msg: 'Xerophyta has switched photosynthesis off. Now it starts taking its chlorophyll apart.' },
    { k: 'x', r: 45, dry: true, msg: 'Inside Xerophyta cells the big vacuole is splitting into many small ones, filled with sugars and other solutes.' },
    { k: 'h', r: 20, dry: true, msg: 'Haberlea is down to about 20 % water. From here, more than 15,000 of its genes change activity.' },
    { k: 'x', r: 10, dry: true, msg: 'Below 10 % water Xerophyta stops breathing: respiration stops. The sugars have set into a glass.' },
    { k: 'h', r: 8, dry: true, msg: 'At 8 % water Haberlea membranes start to leak. They recover after water returns.' },
    { k: 'x', r: 50, dry: false, msg: 'One day after rain Xerophyta is back to 50 % water, and chlorophyll and thylakoid proteins start to reappear.' },
    { k: 'h', r: 60, dry: false, msg: 'Haberlea refills. Its chlorophyll was never lost, and in one study its membranes were close to normal 1 day after rewatering.' },
    { k: 'x', r: 99, dry: false, msg: 'Day 3: Xerophyta is full of water, green and working again.' }
  ];
  function events() {
    var t0 = S.prevT, t1 = S.t; S.prevT = t1;
    if (t0 === t1) return;
    if (t1 < t0 && !(t0 > 0.97 && t1 < 0.03)) return; /* moving backwards: stay quiet */
    if (t0 > 0.97 && t1 < 0.03) { say('A new cycle: the leaves are full of water again and start to dry.'); return; }
    if (t0 < DRY && t1 >= DRY) { say('Rain. Water flows back into the cells, the walls unfold and the vacuoles fill.'); return; }
    if (t0 < DRY * 0.985 && t1 >= DRY * 0.985 && t1 < DRY) { say('Air dry: Xerophyta at 5 % water or less, Haberlea at 6.5 %. They can wait like this until it rains.'); return; }
    EV_LIST.forEach(function (e) {
      var k = e.k === 'g' ? (vis('x') ? 'x' : 'h') : e.k; if (!vis(k)) return;
      var a = rwcOf(k, t0), b = rwcOf(k, t1);
      if (e.dry && t1 < DRY && a > e.r && b <= e.r) say(e.msg);
      if (!e.dry && t0 >= DRY && a < e.r && b >= e.r) say(e.msg);
    });
  }
  function say(m) { if (m === S.lastSaid) return; S.lastSaid = m; EL.now.textContent = m; }

  /* ---------------------------------------------------------------- panel */
  function openPart(id) {
    if (id === 'epix' && S.sp === 'h') id = 'epih';
    if (id === 'chlx' && S.sp === 'h') id = 'chlh';
    var p = partText(id); if (!p) return;
    EL.panel.innerHTML = '<button type="button" class="x" aria-label="Close">×</button><h4>' + esc(p[0]) + '</h4><p class="wh">' + esc(p[1]) + '</p><p class="tx">' + esc(p[2]) + ' ' + T_(p[3]) + '</p>';
    EL.panel.hidden = false;
    EL.panel.querySelector('.x').addEventListener('click', function () { EL.panel.hidden = true; });
    EL.part.value = id === 'epih' ? 'epix' : id;
  }

  /* ---------------------------------------------------------------- time */
  function tick(dt) {
    S.clock += dt;
    if (S.auto) { S.t += dt / 46; if (S.t >= 1) S.t -= 1; }
    if (G) G.stepWater(dt);
    syncUI();
  }
  function after() { if (!after.t || performance.now() - after.t > 50) { after.t = performance.now(); drawScan(); drawPlot(); } }
  function kickAll() { if (G) G.kick(); else if (FB.kick) FB.kick(); }
  function setFrozen(on) {
    S.frozen = !!on;
    var b = EL.bar.querySelector('[data-a="pause"]'); b.textContent = S.frozen ? 'Play' : 'Pause'; b.setAttribute('aria-pressed', S.frozen ? 'true' : 'false');
    EL.bar.querySelector('[data-a="step"]').hidden = !S.frozen;
    if (window.WPFreeze) WPFreeze.syncAll();
    kickAll();
  }
  function setAuto(on) { S.auto = !!on; EL.bar.querySelector('[data-a="auto"]').setAttribute('aria-pressed', S.auto ? 'true' : 'false'); }
  function setMode(m) {
    S.sp = m;
    EL.root.querySelectorAll('.w-modes [data-m]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-m') === m ? 'true' : 'false'); });
    S.prevR = { x: rwcOf('x', S.t), h: rwcOf('h', S.t) };
    if (G) G.applyMode();
    EL.panel.hidden = true;
    say(m === 'x' ? 'Only Xerophyta now: the plant that takes its chloroplasts apart.' : m === 'h' ? 'Only Haberlea now: the plant that keeps its chlorophyll.' : 'Both plants side by side, on the same timeline.');
    syncUI(); kickAll(); after.t = 0;
  }

  /* ---------------------------------------------------------------- mount */
  function mount(host) {
    host.innerHTML = markup();
    var root = host.querySelector('#rs-ws'), stage = root.querySelector('.w-stage');
    EL = { root: root, stage: stage, panel: root.querySelector('.w-panel'), bar: root.querySelector('.w-bar'), now: root.querySelector('#rs-now'), t: root.querySelector('#rs-t'), tO: root.querySelector('#rs-t-o'), scan: root.querySelector('#rs-scan'), plot: root.querySelector('#rs-plot'), part: root.querySelector('#rs-part') };
    var glh = stage.querySelector('.w-gl');
    if (CQ.glOK()) { try { G = build3D(stage); } catch (e) { console.error('resurrection 3D failed, using the flat drawing', e); G = null; } }
    var surf;
    if (!G) {
      glh.innerHTML = ''; var cv = document.createElement('canvas'); cv.style.cssText = 'display:block;width:100%;height:100%'; cv.setAttribute('aria-label', 'Flat drawing of the two blocks of leaf cells'); glh.appendChild(cv); FB.cv = cv;
      stage.querySelector('.w-key').hidden = true;
      surf = glh;
      var last = 0, visible = true, raf = 0;
      FB.kick = function () { if (!raf) raf = requestAnimationFrame(f2); };
      function f2(ts) { raf = 0; if (!visible) return; var dt = last ? Math.min(0.05, (ts - last) / 1000) : 0; last = ts; if (!S.frozen) tick(dt * (window.PlaySpeed ? PlaySpeed.get() : 1)); drawFallback(); after(); if (!S.frozen) FB.kick(); else last = 0; }
      if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) FB.kick(); }, { rootMargin: '80px' }).observe(stage);
    } else surf = G.surface;
    /* a still click on the view: the shared freeze rule toggles; a click on a part also opens its note */
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
    if (window.WPFreeze) WPFreeze.attach(surf, { paused: function () { return S.frozen; }, button: EL.bar.querySelector('[data-a="pause"]'), chipHost: stage, chip: 'tr', ignore: function (e) { return !!(e.target.closest && e.target.closest('.w-panel')); } });
    EL.bar.addEventListener('click', function (e) {
      var b = e.target.closest('[data-a]'); if (!b) return; var a = b.getAttribute('data-a');
      if (a === 'pause') setFrozen(!S.frozen);
      else if (a === 'step') { var sa = S.auto; S.auto = true; tick(0.9); S.auto = sa; if (!sa) { S.t = Math.min(0.999, S.t + 0.02); syncUI(); } if (G) G.render(); else drawFallback(); after.t = 0; after(); }
      else if (a === 'auto') { setAuto(!S.auto); if (S.auto && S.frozen) setFrozen(false); kickAll(); }
      else if (a === 'names') { S.names = !S.names; b.setAttribute('aria-pressed', S.names ? 'true' : 'false'); if (G) G.render(); }
      else if (a === 'zin' && G) G.ctl.zoom(0.85); else if (a === 'zout' && G) G.ctl.zoom(1.18); else if (a === 'home' && G) G.ctl.reset();
    });
    EL.t.addEventListener('input', function () { setAuto(false); S.t = +EL.t.value / 1000; syncUI(); if (G) G.render(); else { drawFallback(); } after.t = 0; after(); });
    root.querySelectorAll('.w-modes [data-m]').forEach(function (b) { b.addEventListener('click', function () { setMode(b.getAttribute('data-m')); }); });
    EL.part.addEventListener('change', function () { if (EL.part.value) openPart(EL.part.value); });
    EL.scan.addEventListener('click', function (e) { var r = EL.scan.getBoundingClientRect(), X = e.clientX - r.left, Y = e.clientY - r.top; for (var i = 0; i < SC.hits.length; i++) if (SC.hits[i].test(X, Y)) { openPart(SC.hits[i].part); return; } });
    EL.plot.addEventListener('click', function (e) { var r = EL.plot.getBoundingClientRect(), x = (e.clientX - r.left - 40) / (r.width - 52); if (x >= 0 && x <= 1) { setAuto(false); S.t = Math.min(0.999, x); syncUI(); if (G) G.render(); else drawFallback(); after.t = 0; after(); } });
    /* the Myrothamnus figure */
    var mf = document.getElementById('rs-myro-fig');
    function side(sd) { mf.innerHTML = myroFig(sd); document.querySelectorAll('#rs-myro [data-side]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-side') === sd ? 'true' : 'false'); }); document.querySelectorAll('#rs-myro [data-sidebox]').forEach(function (d) { d.classList.toggle('on', d.getAttribute('data-sidebox') === sd); }); }
    document.querySelectorAll('#rs-myro [data-side]').forEach(function (b) { b.addEventListener('click', function () { side(b.getAttribute('data-side')); }); });
    side('a');
    CQ.onPrefs(function () { if (CQ.reducedMotion() && !S.frozen) { setFrozen(true); setAuto(false); } after.t = 0; after(); kickAll(); });
    if ('ResizeObserver' in window) new ResizeObserver(function () { after.t = 0; kickAll(); after(); }).observe(root);
    if (window.PlaySpeed) PlaySpeed.on(function () { kickAll(); });
    if (CQ.reducedMotion()) { setFrozen(true); setAuto(false); }
    syncUI(); kickAll(); after.t = 0; after();
    window.RSW = { S: S, state: state, rwcOf: rwcOf, G: G, setMode: setMode, setT: function (t) { setAuto(false); S.t = t; syncUI(); if (G) G.render(); else drawFallback(); after.t = 0; after(); } };
  }
  CQ.ready(function () { var h = document.getElementById('rs-host'); if (h) { mount(h); CQ.sources(document.getElementById('cq-srclist')); } });
})();

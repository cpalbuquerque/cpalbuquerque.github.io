/* Light to Sugar: Plate VI, "Three ways to fix carbon" (team c3c4cam, v20).
   One three.js r128 workstation, one scene, three leaf builds with a smooth switch (the old leaf sinks, the new one grows):
     C3   a broadleaf block: cuticle, upper epidermis, palisade, spongy mesophyll with air spaces, a stoma on the lower
          side, two veins with a pale bundle sheath (few chloroplasts) and about 7 mesophyll cells between them.
     C4   Kranz (wreath) anatomy of a grass leaf: veins close together, a ring of large chloroplast rich bundle sheath cells
          around each, a ring of mesophyll cells outside; 2 mesophyll cells between neighbouring sheaths.
     CAM  the outer part of a prickly pear pad: thick cuticle, a stoma on the outer surface, three layers of large round
          tightly packed green cells, each mostly vacuole, over pale water storage cells and a small cortical vein.
   The front face is cut (a clipping plane), so the front cells show their chloroplasts, vacuoles and enzymes.
   Layers (toggle chips): CO2 route, PEP carboxylase, Rubisco, malate and malic acid, the PEP / oxaloacetate / pyruvate
   shuttle, CO2 release (decarboxylation) and sugar out. CAM runs on a 24 h clock: stomata open at night, malic acid fills
   the vacuoles, then empties by day behind shut stomata. Speed follows window.PlaySpeed; click the view to freeze
   (freeze.js); reduced motion starts paused with Step; ?ws=2d or no WebGL gives a flat SVG of the same layout.
   Linked panes: a comparison readout for the chosen type, a route map that follows the layers and the clock, and a
   numbers figure (compensation points, bundle sheath CO2, the CAM acid gauge and light depth).
   New molecule identity colours (malate, malic acid, PEP, oxaloacetate, pyruvate) live HERE, in window.WPMolColorC4,
   an additive companion to ../molcolor.js (which is not edited). Colour blind check: Machado et al. 2009 simulation at
   full severity, CIEDE2000, against water, CO2, O2, ATP, NADPH, sugar, H+ and K+ and each other: minimum 9.7 (dark set)
   and 8.2 (light set) across protan, deutan and tritan; contrast on the page background at least 3.9 : 1. Shapes and
   name tags carry identity too (4 bead chain = four carbon acid, 3 beads = three carbon, hexagon = sugar).
   Sources: V20_SOURCES_C3C4CAM.md only. Debug handle: window.C3C4. */
(function () {
  'use strict';
  var LP = window.LP = window.LP || {};
  LP.panels = LP.panels || [];
  LP.evidence = LP.evidence || {};
  LP.sources = LP.sources || {};
  var MINUS = '−', TAU = Math.PI * 2, PID = 'c3c4cam';
  function clamp(x, a, b) { return x < a ? a : (x > b ? b : x); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function U() { return LP.ui || {}; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fmt(x, d) {
    if (x == null || !isFinite(x)) return 'n/a';
    var s = Number(Math.abs(x).toFixed(d || 0)).toLocaleString('en-US', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
    return (x < 0 && +s.replace(/,/g, '') !== 0 ? MINUS : '') + s;
  }
  function rng(seed) { var s = (seed >>> 0) || 1; return function () { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
  var BTITLE = { SECONDARY: 'A review or summary of other work, checked against its abstract or text.', MEASURED: 'Measured directly in the cited study.', OPEN: 'Contested or still under study.' };
  function badge(k) {
    var u = U(); if (!u.badge) return '<span class="badge">' + esc(k) + '</span>';
    if (k === 'OPEN') return u.badge('OPEN QUESTION');
    if (k === 'SECONDARY') return u.badge('SECONDARY', BTITLE.SECONDARY);
    return u.badge(k, BTITLE[k]);
  }
  function ev(k, l) { return U().ev ? U().ev(k, l) : ''; }
  function dark() { return U().isDark ? U().isDark() : false; }
  function reduced() { return U().reducedMotion ? U().reducedMotion() : false; }

  /* ------------------------------------------------------------ new identity colours (additive; molcolor.js untouched) */
  var NC = {
    light: { malate: '#8e2b6b', malic: '#ed0487', pep: '#1e704d', oaa: '#c24500', pyr: '#00839c', sugar: '#3f9a4a' },
    dark: { malate: '#e558a2', malic: '#cf8694', pep: '#579c65', oaa: '#ff600e', pyr: '#07afbc', sugar: '#5ccf6e' }
  };
  var NNAME = { co2: 'CO₂', malate: 'malate', malic: 'malic acid', pep: 'PEP', oaa: 'oxaloacetate', pyr: 'pyruvate', sugar: 'sugar' };
  function molHex(kind, dk) {
    if (kind === 'co2') return window.WPMolColor ? WPMolColor.get('co2', dk) : (dk ? '#cfd3d8' : '#77797d');
    return NC[dk ? 'dark' : 'light'][kind] || '#888888';
  }
  function glyphSVG(kind, w) {
    w = w || 22;
    var st = 'stroke:rgba(0,0,0,.45);stroke-width:.6', f = function (k) { return 'fill:var(--c4-' + k + ');' + st; };
    var g = '';
    if (kind === 'co2') g = '<circle cx="4" cy="7" r="2.6" style="fill:var(--mol-co2-o);' + st + '"/><circle cx="14" cy="7" r="2.6" style="fill:var(--mol-co2-o);' + st + '"/><circle cx="9" cy="7" r="3.1" style="fill:var(--mol-co2-c);' + st + '"/>';
    else if (kind === 'malate' || kind === 'malic' || kind === 'oaa') {
      g = [[3, 9], [8, 5], [13, 9], [18, 5]].map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="2.7" style="' + f(kind) + '"/>'; }).join('');
      if (kind === 'malic') g += '<circle cx="1.2" cy="4" r="1.4" style="fill:#ffd84a;' + st + '"/><circle cx="20.6" cy="10" r="1.4" style="fill:#ffd84a;' + st + '"/>';
      if (kind === 'oaa') g += '<circle cx="13" cy="2.4" r="1.6" style="' + f(kind) + '"/>';
    } else if (kind === 'pep') g = [[3, 8], [8, 5], [13, 8]].map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="2.7" style="' + f('pep') + '"/>'; }).join('') + '<circle cx="18.5" cy="6" r="3" style="fill:#c9c2e8;' + st + '"/>';
    else if (kind === 'pyr') g = [[4, 9], [9, 5], [14, 9]].map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="2.7" style="' + f('pyr') + '"/>'; }).join('');
    else if (kind === 'sugar') { for (var i = 0; i < 6; i++) { var a = i * TAU / 6; g += '<circle cx="' + (11 + 5 * Math.cos(a)).toFixed(1) + '" cy="' + (7 + 5 * Math.sin(a)).toFixed(1) + '" r="1.9" style="' + f('sugar') + '"/>'; } }
    return '<svg class="c4-gi" viewBox="0 0 22 14" width="' + w + '" height="' + Math.round(w * 14 / 22) + '" aria-hidden="true" focusable="false">' + g + '</svg>';
  }
  function molKey(kinds, lead) {
    return '<p class="c4-molkey" role="note" aria-label="Molecule colours and shapes: ' + kinds.map(function (k) { return NNAME[k]; }).join(', ') + '"><span class="l">' + (lead || 'Molecules:') + '</span>' +
      kinds.map(function (k) { return '<span class="k" data-k="' + k + '">' + glyphSVG(k) + '<span>' + NNAME[k] + '</span></span>'; }).join('') + '</p>';
  }
  window.WPMolColorC4 = {
    light: NC.light, dark: NC.dark, kinds: ['malate', 'malic', 'pep', 'oaa', 'pyr'],
    get: function (k, dk) { return molHex(k, dk == null ? dark() : dk); },
    int: function (k, dk) { return parseInt(molHex(k, dk == null ? dark() : dk).slice(1), 16); },
    glyph: glyphSVG, key: molKey,
    note: 'Additive companion to molcolor.js for the carbon fixing routes (Light VI). Minimum CIEDE2000 under Machado 2009 protan, deutan and tritan simulation: 9.7 dark, 8.2 light, against water, CO2, O2, ATP, NADPH, sugar, H+, K+ and each other.'
  };

  /* ------------------------------------------------------------ evidence (V20_SOURCES_C3C4CAM.md) */
  var EV = {
    'c4.hatch': { claim: 'In sugarcane leaf segments given labelled CO₂, after about 1 s more than 93 % of the fixed label was in malate, aspartate and oxaloacetate, four carbon acids; the label then moved to 3 phosphoglycerate, hexose phosphates and sucrose. This 1966 finding named the C4 pathway.', cite: 'Hatch MD, Slack CR (1966) Biochem J 101:103 to 111', doi: '10.1042/bj1010103', measured: 'sugarcane leaf segments in 14CO2 (abstract read)', value: 'more than 93 % in four carbon acids after about 1 s', badge: 'MEASURED', note: '' },
    'c4.pump10': { claim: 'The C4 pump concentrates CO₂ up to about 10 times the level in air in the cells where Rubisco sits, the bundle sheath. C4 plants are often sorted by the acid made in the mesophyll (malate or aspartate) and by the enzyme that releases the CO₂, but these types are not rigid.', cite: 'Furbank RT (2011) J Exp Bot 62:3103 to 3108', doi: '10.1093/jxb/err080', measured: 'review (abstract read)', value: 'up to about 10 fold atmospheric', badge: 'SECONDARY', note: 'The measured pool in Furbank and Hatch 1987 is 160 to 990 µM of CO₂ plus bicarbonate, which is not directly a times air number; the 10 times figure is the review statement.' },
    'c4.pool': { claim: 'Bundle sheath cells of C4 leaves hold a large pool of inorganic carbon, 15 to 97 nmol per mg chlorophyll in six species of the three C4 types; a model puts the bundle sheath concentration at 160 to 990 µM, mostly as CO₂.', cite: 'Furbank RT, Hatch MD (1987) Plant Physiol 85:958 to 964', doi: '10.1104/pp.85.4.958', measured: 'six C4 species (abstract read)', value: 'pool 15 to 97 nmol per mg Chl (MEASURED); 160 to 990 µM (DERIVED)', badge: 'MEASURED', note: '' },
    'c4.leak': { claim: 'Isolated bundle sheath cells let CO₂ through one to two orders of magnitude more slowly than C3 leaf cells: about 20 µmol per min per mg chlorophyll per mM for five C4 species, against at least 500 for the C3 plant Xanthium strumarium.', cite: 'Furbank RT, Jenkins CL, Hatch MD (1989) Plant Physiol 91:1364 to 1371', doi: '10.1104/pp.91.4.1364', measured: 'isolated bundle sheath cells (abstract read)', value: 'about 20 versus at least 500', badge: 'MEASURED', note: '' },
    'c4.suberin': { claim: 'A waxy suberin layer in the bundle sheath wall keeps pumped CO₂ in: a Setaria viridis mutant with disrupted suberin lamellae had more than twofold higher bundle sheath CO₂ conductance, less CO₂ in the bundle sheath and impaired photosynthesis.', cite: 'Danila FR et al. (2021) Commun Biol 4:254', doi: '10.1038/s42003-021-01772-4', measured: 'Setaria viridis ABCG transporter mutant (abstract read)', value: 'more than twofold leakier', badge: 'MEASURED', note: '' },
    'c4.ca': { claim: 'Carbonic anhydrase turns CO₂ into bicarbonate, the form PEP carboxylase uses; a Setaria viridis mutant with 80 % less transcript and 30 % less protein had a higher CO₂ compensation point and grew normally only at high CO₂.', cite: 'Chatterjee J et al. (2021) J Exp Bot 72:3122 to 3136', doi: '10.1093/jxb/erab039', measured: 'Setaria viridis beta CA mutant (abstract read)', value: '80 % lower transcript, 30 % lower protein', badge: 'MEASURED', note: '' },
    'c4.gamma': { claim: 'Across several hundred flowering plant species, the CO₂ compensation point (the CO₂ level at which a leaf just stops gaining carbon) fell into two groups: 40 µL per L or more (C3 type) and 10 µL per L or less (C4 type). Exceptions in between: Moricandia arvensis about 26 and Panicum milioides 12 to 20.', cite: 'Krenzer EG, Moss DN, Crookston RK (1975) Plant Physiol 56:194 to 206', doi: '10.1104/pp.56.2.194', measured: 'gas exchange survey (abstract read)', value: 'C3 ≥ 40; C4 ≤ 10 µL L⁻¹ (= ppm)', badge: 'MEASURED', note: 'µL per L of air is the same as parts per million.' },
    'c4.inter': { claim: 'Plants with CO₂ compensation points between 10 and 40 ppm are often considered C3 to C4 intermediates; such intermediate metabolism evolved up to five times in the cabbage family (Brassicaceae), which has no C4 species, mainly in Moricandia.', cite: 'Schlüter U et al. (2023) J Exp Bot 74:6631 to 6649; Schlüter U et al. (2017) J Exp Bot 68:191 to 206', doi: '10.1093/jxb/erad250', doi2: '10.1093/jxb/erw391', measured: 'Brassicaceae gas exchange and anatomy (abstracts read)', value: '10 to 40 ppm', badge: 'MEASURED', note: '' },
    'c4.ms7': { claim: 'Rice has about 7 mesophyll cells between veins; among 25 C3 and C4 grass species, every C4 leaf had at most 2 to 3 mesophyll cells between bundle sheaths. C4 leaves do not always have larger bundle sheath cells or shorter vein spacing, so the count, not a fixed spacing, is the rule.', cite: 'Ermakova M, Danila FR, Furbank RT, von Caemmerer S (2020) Plant J 101:940 to 950 (online 2019)', doi: '10.1111/tpj.14562', measured: 'review with original data on 25 grass species (full text read)', value: 'rice about 7; C4 at most 2 to 3', badge: 'SECONDARY', note: '' },
    'c4.vein': { claim: 'In cleared leaves of 15 C3 and 26 C4 grasses, C4 leaves packed about 2.1 times the total vein length into the same leaf area, through denser small longitudinal and transverse veins.', cite: 'Ueno O, Kawano Y, Wakayama M, Takeda T (2006) Ann Bot 97:611 to 621', doi: '10.1093/aob/mcl010', measured: 'cleared grass leaves (abstract read)', value: 'vein length per area 2.1 times C3', badge: 'MEASURED', note: 'Absolute distances in µm are in the body of the paper and are not used here.' },
    'c4.enablers': { claim: 'Across 157 grass species, lines whose bundle sheath tissue already exceeded about 15 % of the leaf (short distance between sheaths plus large sheath cells) were much more likely to become C4; C4 evolved 22 to 24 times in grasses.', cite: 'Christin PA et al. (2013) PNAS 110:1381 to 1386', doi: '10.1073/pnas.1216777110', measured: 'anatomy and phylogeny of 157 grasses (abstract read)', value: '15 % bundle sheath; 22 to 24 origins in grasses', badge: 'MEASURED', note: '' },
    'c4.types': { claim: 'In 1696 A/Ci curves from C4 species, the classic biochemical subtypes differed little in photosynthetic capacity; growing conditions mattered more. Maize, sorghum and Setaria viridis are the common C4 model species.', cite: 'Fan Y et al. (2025) New Phytol 248:1205 to 1224', doi: '10.1111/nph.70525', measured: 'meta analysis (abstract read)', value: '1696 curves', badge: 'DERIVED', note: '' },
    'c4.origins': { claim: 'C4 photosynthesis evolved independently more than 60 times. Counts differ by method and year: 62 lineages (Sage et al. 2011), 61 lineages with possible extra origins in 12 (Sage 2016), at least 66 origins (Sage et al. 2012).', cite: 'Sage RF, Christin PA, Edwards EJ (2011) J Exp Bot 62:3155 to 3169; Ermakova et al. (2020) Plant J 101:940', doi: '10.1093/jxb/err048', doi2: '10.1111/tpj.14562', measured: 'phylogenetic counts (abstracts read)', value: 'more than 60', badge: 'DERIVED', note: 'The exact number is contested, so this page says only more than 60.' },
    'c4.species': { claim: 'About 8,100 C4 species are known: 5,044 grasses, 1,322 sedges and 1,777 eudicots; the oldest C4 lineage is near 30 million years old and most are younger than 15 million years.', cite: 'Sage RF (2016) J Exp Bot 67:4039 to 4056', doi: '10.1093/jxb/erw156', measured: 'species count (abstract read)', value: 'about 8,100', badge: 'DERIVED', note: '' },
    'c4.gpp': { claim: 'A global model and map put C4 plants at about 23 % of all the carbon land plants capture (35.3 of about 150 Pg C per year), on about 18.8 million km², against 87.4 million km² of C3 vegetation.', cite: 'Still CJ, Berry JA, Collatz GJ, DeFries RS (2003) Global Biogeochem Cycles 17(1)', doi: '10.1029/2001GB001807', measured: 'model and land cover map (Crossref abstract)', value: 'about 23 % of global gross primary production', badge: 'DERIVED', note: 'A model estimate, not a measurement.' },
    'cam.path': { claim: 'At night a CAM plant uses PEP carboxylase to fix CO₂ into oxaloacetate and then malate, and stores it as malic acid in the vacuole; by day the stomata stay shut and the stored acid gives up CO₂ for Rubisco.', cite: 'Silvera K, Winter K, Rodriguez BL, Albion RL, Cushman JC (2014) J Exp Bot 65:3623 to 3636', doi: '10.1093/jxb/eru234', measured: 'pathway statement in a study of 11 orchid species (abstract read)', value: 'qualitative', badge: 'SECONDARY', note: '' },
    'cam.clusia': { claim: 'Clusia rosea trees in the field (US Virgin Islands, March 1989) were all in CAM. Leaf cell sap reached pH 2.85 at the end of the night. Early morning net CO₂ uptake (phase II) lasted until about 11:00 to 12:00 and gave about one third of total uptake; malic and citric acid were stored at a molar ratio of about 1.6.', cite: 'Ball E et al. (1991) New Phytol 117:483 to 491', doi: '10.1111/j.1469-8137.1991.tb00012.x', measured: 'field gas exchange and leaf sap (abstract read)', value: 'pH 2.85 at dawn; phase II until about 11:00 to 12:00', badge: 'MEASURED', note: 'One species, one site, one season: an example, not a rule for all CAM plants.' },
    'cam.phase4': { claim: 'Phase IV of CAM is net CO₂ uptake in the late afternoon, when stomata open again and Rubisco can take CO₂ from the air. Young daughter pads of prickly pear behave like C3 plants at first, with daytime stomatal opening.', cite: 'Pimienta Barrios E et al. (2005) Ann Bot 95:363 to 369', doi: '10.1093/aob/mci034', measured: 'Opuntia ficus-indica gas exchange (abstract read)', value: 'qualitative', badge: 'MEASURED', note: '' },
    'cam.clock': { claim: 'The clock times in this workstation (night from 19:00 to 06:00, early morning uptake to 10:00, stomata shut to 15:00, late afternoon uptake to 19:00) and the speed at which the vacuole fills and empties are teaching values.', cite: 'Drawing convention of this page', measured: 'none', value: 'clock times', badge: 'ILLUSTRATIVE', note: 'Real timing changes with species, water and temperature. The middle of the day is described here only qualitatively: a published definition of that phase was not checked for this page.' },
    'cam.share': { claim: 'CAM is directly documented in 370 genera of 38 families; CAM capable species are estimated at nearly 7 % of vascular plants; CAM evolved at least 66 times, possibly dozens more.', cite: 'Gilman IS et al. (2023) Ann Bot 132:627 to 654', doi: '10.1093/aob/mcad135', measured: 'survey and estimate (abstract read)', value: 'about 7 %; 38 families; at least 66 origins', badge: 'DERIVED', note: 'The 7 % rests on assumptions about the cactus and stonecrop families.' },
    'cam.cells': { claim: 'CAM plants tend to leaf or stem succulence, with large cells with big vacuoles and often, but not always, special water storage tissues. In the pineapple family (163 species) the green cells of CAM species average 22 times the volume of those of C3 species.', cite: 'Lüttge U (2004) Ann Bot 93:629 to 652; Males J (2018) Funct Plant Biol 45:681 to 695', doi: '10.1093/aob/mch087', doi2: '10.1071/FP17071', measured: 'review; bromeliad anatomy (abstracts read)', value: '22 times cell volume (bromeliads)', badge: 'MEASURED', note: 'No source checked for this page gives the share of a CAM cell taken by the vacuole, so no percentage is shown.' },
    'cam.pack': { claim: 'Across eight CAM species, less intercellular air space and less mesophyll surface exposed to it went with stronger CAM; cell size and succulence were not closely tied to how much CAM a plant does.', cite: 'Nelson EA, Sage RF (2008) J Exp Bot 59:1841 to 1850', doi: '10.1093/jxb/erm346', measured: 'eight CAM species (abstract read)', value: 'qualitative', badge: 'MEASURED', note: '' },
    'cam.opuntia': { claim: 'The green layer (chlorenchyma) of a mature prickly pear pad is about 4 mm thick. Blue and red light are 99 % absorbed in the outer 2 mm, yet night acid gain and CO₂ uptake at 2 to 3 mm depth were only 22 to 47 % lower than near the surface; Rubisco and PEP carboxylase were similar in the outer three 1 mm layers.', cite: 'Nobel PS, Cui M, Israel AA (1994) New Phytol 128:315 to 322', doi: '10.1111/j.1469-8137.1994.tb04015.x', measured: 'Opuntia ficus-indica chlorenchyma by depth (abstract read)', value: 'about 4 mm; 99 % of blue and red light gone in 2 mm', badge: 'MEASURED', note: '' },
    'cam.light': { claim: 'The light shading drawn in the CAM pad and in the depth bar assumes light falls off exponentially with depth, tuned so 1 % is left at half the green layer, to match Nobel et al. 1994.', cite: 'Shape assumed for drawing; end point from Nobel et al. (1994)', doi: '10.1111/j.1469-8137.1994.tb04015.x', measured: 'none', value: 'I(depth) = exp(−k × depth), 1 % at 2 mm', badge: 'ILLUSTRATIVE', note: '' },
    'cam_water': null,
    'c4.scene': { claim: 'The three leaves are drawn to the published cell counts and to the shape of each tissue, not to µm. Molecules move at teaching speeds, the same for every route, so the scene shows where things go, not how fast each route runs.', cite: 'Drawing convention of this page', measured: 'none', value: 'C3: 7 mesophyll cells between sheaths; C4: 2; C4 vein spacing 1/2.1 of C3', badge: 'ILLUSTRATIVE', note: 'The broadleaf C3 block borrows the rice count of about 7 cells between veins (Ermakova et al. 2020), measured in grasses. Proteins are drawn hundreds of times larger than real.' },
    'rice.project': { claim: 'The C4 rice project began in 2008 and was first conceived by John Sheehy at IRRI. Stacking five genes by crossing took almost 6 years; one construct cut that to 6 months. More bundle sheath chloroplasts were obtained with GLK genes (about five fold), but rice still has about 7 mesophyll cells between veins, the connections (plasmodesmata) between mesophyll and sheath would need at least a five fold increase, the genes for vein spacing are not yet known, and C4 needs at least two more ATP per CO₂ than C3.', cite: 'Ermakova M, Danila FR, Furbank RT, von Caemmerer S (2020) Plant J 101:940 to 950', doi: '10.1111/tpj.14562', measured: 'review with original data (full text read)', value: 'begun 2008; 6 years to 6 months; at least five fold more plasmodesmata needed', badge: 'SECONDARY', note: '' },
    'rice.five': { claim: 'Five maize genes (carbonic anhydrase, PEP carboxylase, NADP malate dehydrogenase, PPDK and NADP malic enzyme) on one construct in rice cv. Kitaake: enzyme activities rose up to 3, 13, 15 and 7 fold over wild type (PEPC, MDH, NADP ME, PPDK), equal to up to 2 %, 47 %, 2 % and 10 % of maize. Labelled carbon flowed into malate about 10 times faster than in wild type, about 2 % of the maize flow. Malate to pyruvate flux stayed low and the CO₂ compensation point did not change.', cite: 'Ermakova M et al. (2021) Plant Biotechnol J 19:575 to 588 (online 2020)', doi: '10.1111/pbi.13487', measured: '13C labelling and enzyme assays in transgenic rice (full text read)', value: 'flux into malate about 10 times wild type, about 2 % of maize', badge: 'MEASURED', note: 'The CO₂ is not yet being released in the bundle sheath, so the C4 cycle is not complete.' },
    'rice.pepc': { claim: 'Maize PEP carboxylase alone in rice: activity in the test tube 25 times wild type (about 20 % of maize), about 6 % of carboxylation by PEPC, and no change in net CO₂ assimilation. In a 2026 study the maize enzyme worked in the leaf at less than 2.1 % of its test tube activity.', cite: 'Giuliani R et al. (2019) Photosynth Res 142:153 to 167; Om K et al. (2026) Plant Physiol 202(2)', doi: '10.1007/s11120-019-00655-4', doi2: '10.1093/plphys/kiag387', measured: 'transgenic rice gas exchange and enzyme assays (abstracts read)', value: '25 times in vitro; no change in assimilation; in planta less than 2.1 % of in vitro', badge: 'MEASURED', note: '' },
    'rice.glk': { claim: 'Maize GOLDEN2 like genes in rice moved 4 to 6 % of leaf chloroplast area and 21 % of mitochondria area into the vascular sheath, a 2.5 to 3 fold increase (proto Kranz species have 4 to 9 % and 18 to 32 %). Photosynthesis curves were not different from wild type and there was no consistent yield difference in field trials at IRRI.', cite: 'Wang P et al. (2017) Curr Biol 27:3278 to 3287', doi: '10.1016/j.cub.2017.09.040', measured: 'transgenic rice anatomy, gas exchange and field trials (full text read)', value: '2.5 to 3 fold more sheath organelles; no change in photosynthesis', badge: 'MEASURED', note: '' },
    'rice.why': { claim: 'About 90 % of rice is grown and eaten in Asia; one hectare fed 27 people and must feed at least 43 by 2050, so yields would need to rise at least 50 % in 40 years. C4 raised photosynthetic efficiency by about 50 % in evolution. The authors called C4 rice ambitious and asked for proof of concept before major investment.', cite: 'Hibberd JM, Sheehy JE, Langdale JA (2008) Curr Opin Plant Biol 11:228 to 231; von Caemmerer S, Quick WP, Furbank RT (2012) Science 336:1671 to 1672', doi: '10.1016/j.pbi.2007.11.002', doi2: '10.1126/science.1220177', measured: 'review (abstracts read)', value: '27 to 43 people per hectare; at least 50 % more yield needed', badge: 'SECONDARY', note: 'Any figure of up to 50 % more yield from C4 rice is a prediction, never a result.' },
    'fac.ice': { claim: 'Common ice plants given 400 mM NaCl or saline drought got 11 to 24 % of their carbon by net CO₂ uptake at night (CAM); well watered plants without salt completed their whole life cycle as C3 plants with no net night uptake. CAM here is switched on by the environment, not a fixed stage of development.', cite: 'Winter K, Holtum JAM (2007) Plant Physiol 143:98 to 107 (online 2006)', doi: '10.1104/pp.106.088922', measured: 'whole shoot CO₂ exchange from seedling to seed (abstract read)', value: '11 to 24 % of carbon at night', badge: 'MEASURED', note: '' },
    'fac.def': { claim: 'Facultative CAM is the optional, fully reversible use of CAM, usually under drought, by plants that otherwise use C3 or C4. Examples: Clusia pratensis, Calandrinia polyandra, Mesembryanthemum crystallinum, Portulaca oleracea, Talinum triangulare and the aquatic Isoetes howellii.', cite: 'Winter K, Holtum JAM (2014) J Exp Bot 65:3425 to 3441', doi: '10.1093/jxb/eru063', measured: 'review (abstract read)', value: 'qualitative', badge: 'SECONDARY', note: '' },
    'fac.purs': { claim: 'Well watered purslane under 16 h days showed no CAM. Under 8 h days, day to night acid swings were 102 (leaves) and 90 (stems) µeq per g fresh weight; the largest, 128, came in water stressed then rewatered short day plants. Most of the night acid came from refixing respired CO₂.', cite: 'Koch KE, Kennedy RA (1980) Plant Physiol 65:193 to 197', doi: '10.1104/pp.65.2.193', measured: 'titratable acidity (abstract read)', value: '102, 90 and 128 µeq g⁻¹ FW', badge: 'MEASURED', note: '' },
    'fac.drought': { claim: 'After 21 to 23 days without water, purslane switched to a CAM like pattern of CO₂ exchange and night acid, with net uptake at night and not by day; its PEP carboxylase changed its behaviour (higher PEP affinity, more sensitive to malate).', cite: 'Lara MV et al. (2003) Photosynth Res 77:241 to 254; Lara MV, Drincovich MF, Andreo CS (2004) Plant Cell Physiol 45:618 to 626', doi: '10.1023/A:1025834120499', doi2: '10.1093/pcp/pch073', measured: 'drought induction (abstracts read)', value: '21 to 23 days', badge: 'MEASURED', note: '' },
    'fac.same': { claim: 'In purslane, C4 and CAM run in the same leaf under mild drought (Ferrari et al. 2020), and spatial gene expression in Portulaca shows them fully integrated in the same cells, with CAM products likely fed into the C4 cycle (Moreno Villena et al. 2022).', cite: 'Ferrari RC et al. (2020) New Phytol 225:1699 to 1714; Moreno Villena JJ et al. (2022) Sci Adv 8:eabn2349', doi: '10.1111/nph.16265', doi2: '10.1126/sciadv.abn2349', measured: 'RNA seq and spatial expression (abstracts read)', value: 'qualitative', badge: 'MEASURED', note: 'Every purslane subspecies tested switched CAM on in drought and off after watering (Ferrari et al. 2020, Sci Rep 10:14237).' },
    'fac.weak': { claim: 'Portulaca relatives may run a weak CAM cycle all the time and boost it in drought; C4 and CAM mostly use separate genes for the first fixation step.', cite: 'Gilman IS et al. (2022) Plant Physiol 189:735 to 753', doi: '10.1093/plphys/kiac116', measured: 'gene co expression (abstract read)', value: 'qualitative', badge: 'OPEN', note: 'The authors suggest this; it is not settled.' },
    'fac.talinum': { claim: 'Talinum triangulare shifts reversibly from C3 to a weakly expressed CAM under drought, and the drought hormone ABA alone can switch CAM on, raising PEP carboxylase, malic enzymes and night malate.', cite: 'Brilhaus D et al. (2016) Plant Physiol 170:102 to 122; Maleckova E et al. (2019) J Exp Bot 70:6581 to 6596', doi: '10.1104/pp.15.01076', doi2: '10.1093/jxb/erz189', measured: 'transcripts and metabolites (abstracts read)', value: 'qualitative', badge: 'MEASURED', note: '' },
    'fac.clusia': { claim: 'Clusia is the only genus with true trees doing CAM. Clusia minor can show C3, CAM, CAM cycling and CAM idling, and C3 and CAM have been seen at the same time in two opposite leaves on one node.', cite: 'Lüttge U (2006) New Phytol 171:7 to 25; Lüttge U (2008) J Exp Bot 59:1503 to 1514', doi: '10.1111/j.1469-8137.2006.01755.x', doi2: '10.1093/jxb/ern006', measured: 'reviews (abstracts read)', value: 'qualitative', badge: 'SECONDARY', note: '' },
    'int.c2': { claim: 'C2 plants, a halfway stage found in 14 C4 lineages, shuttle glycine from photorespiration into the bundle sheath, where its CO₂ is released and refixed by Rubisco. Moving mitochondria into the sheath is an early step toward C4.', cite: 'Sage RF, Khoshravesh R, Sage TL (2014) J Exp Bot 65:3341 to 3356; Sage RF, Sage TL, Kocacinar F (2012) Annu Rev Plant Biol 63:19 to 47', doi: '10.1093/jxb/eru180', doi2: '10.1146/annurev-arplant-042811-105511', measured: 'reviews (abstracts read)', value: 'qualitative', badge: 'SECONDARY', note: '' },
    'int.flav': { claim: 'In 16 Flaveria species (C3, C3 to C4, C4 like and C4), higher vein density came first, and full Kranz anatomy was in place in C4 like species before complete C4 biochemistry.', cite: 'McKown AD, Dengler NG (2007) Am J Bot 94:382 to 399', doi: '10.3732/ajb.94.3.382', measured: 'leaf anatomy across 16 species (abstract read)', value: '16 species', badge: 'MEASURED', note: '' },
    'int.single': { claim: 'Two Central Asian goosefoot relatives do C4 inside single cells, without Kranz anatomy: Borszczowia aralocaspica places two kinds of chloroplasts at opposite ends of each cell; in Bienertia cycloptera PEP carboxylase works at the cell edge and Rubisco in a central ball of chloroplasts, with C4 type gas exchange and no night fixation.', cite: 'Voznesenskaya EV et al. (2001) Nature 414:543 to 546; Voznesenskaya EV et al. (2002) Plant J 31:649 to 662', doi: '10.1038/35107073', doi2: '10.1046/j.1365-313X.2002.01385.x', measured: 'anatomy, immunolocalisation and gas exchange (abstracts read)', value: 'qualitative', badge: 'MEASURED', note: 'Names as published in the papers.' },
    'cac.rect': { claim: 'In Agave deserti and the barrel cactus Ferocactus acanthodes over 21 days of soil drying, hydraulic conductance fell sharply at the root to stem junction, less in roots and not in stems, from embolism in the connecting conduits; the embolism reversed on rewetting, so the junctions act as rectifiers.', cite: 'Ewers FW, North GB, Nobel PS (1992) New Phytol 121:377 to 385', doi: '10.1111/j.1469-8137.1992.tb02937.x', measured: 'hydraulic conductance by organ (abstract read)', value: '21 days of drying', badge: 'MEASURED', note: '' },
    'cac.shrink': { claim: 'Agave deserti roots shrank 24 % and 34 % after 7 and 14 days of drought; the air gaps between root and soil would cut the conductivity of that interface by a factor of about 5. Vibrating the pots closed the gaps, and the roots then lost more water.', cite: 'North GB, Nobel PS (1997) New Phytol 135:21 to 29', doi: '10.1046/j.1469-8137.1997.00620.x', measured: 'root diameter in drying soil (MEASURED); interface conductivity from a calculation (DERIVED)', value: '24 % and 34 % shrinkage; about 5 times lower', badge: 'MEASURED', note: '' },
    'cac.aqp': { claim: 'For the cholla Opuntia acanthocarpa, 45 days of soil drying cut root hydraulic conductance by about 67 %; 8 days after rewetting it was back to 60 % of the start. Aquaporin changes explained about 38 % of the drop and 61 % of the recovery in distal roots.', cite: 'Martre P, North GB, Nobel PS (2001) Plant Physiol 126:352 to 362', doi: '10.1104/pp.126.1.352', measured: 'root hydraulic conductance with mercury inhibition (abstract read)', value: '67 % drop; 60 % back after 8 days', badge: 'MEASURED', note: '' },
    'cac.contr': { claim: 'Contractile roots, which pull the plant down into the soil, were found in 55 % of 73 succulent monocot species: 64 % of agaves, 85 % of yuccas and none of the aloes; contraction was stronger in species from drier homelands.', cite: 'North GB, Brinton EK, Garrett TY (2008) Plant Cell Environ 31:1179 to 1189', doi: '10.1111/j.1365-3040.2008.01832.x', measured: 'survey of 73 species (abstract read)', value: '55 % of 73 species', badge: 'MEASURED', note: '' },
    'cac.ario': { claim: 'Contractile roots pulled the living rock cactus Ariocarpus fissuratus into the soil by 6 to 30 mm per year, keeping it flush with the ground; plants in rocky soil survived an extreme heat episode.', cite: 'Garrett TY, Huynh CV, North GB (2010) Am J Bot 97:1951 to 1960', doi: '10.3732/ajb.1000286', measured: 'field and greenhouse (abstract read)', value: '6 to 30 mm per year', badge: 'MEASURED', note: '' },
    'cac.sv': { claim: 'For a flat pad or leaf, surface to volume S/V = 2/T, where T is thickness, so a thicker pad has less surface per unit of stored water. About 8 to 15 ribs, each about as tall as the inner stem radius, give large storage with only a moderate rise in S/V.', cite: 'Mauseth JD (2000) Am J Bot 87:1107 to 1115', doi: '', measured: 'geometry (abstract read; PMID 10947995)', value: 'S/V = 2/T; 8 to 15 ribs', badge: 'DERIVED', note: '' },
    'cac.shoot': { claim: 'All cacti have foliage leaves, often microscopic on vegetative shoots; spines are modified bud scales; many cacti have cortical bundles that supply a broad green cortex; ribs and tubercles let the shoot swell without tearing.', cite: 'Mauseth JD (2006) Ann Bot 98:901 to 926', doi: '10.1093/aob/mcl133', measured: 'review (abstract read)', value: 'qualitative', badge: 'SECONDARY', note: '' },
    'cac.wbt': { claim: 'Wide band tracheids are present in seedlings of most cacti; small round (globose) species never switch to fibrous wood.', cite: 'Mauseth JD (2004) J Plant Res 117:69 to 76', doi: '10.1007/s10265-003-0131-5', measured: 'wood anatomy survey (abstract read)', value: 'qualitative', badge: 'MEASURED', note: 'That these tracheids let the stem shrink without collapse is the wider reading of the literature; this abstract states their occurrence.' },
    'cac.heat': { claim: 'Prickly pear pads tolerated up to 65 °C but were damaged by freezing below about −6 °C; a cholla grown at 35/25 °C tolerated 1 h at 70 °C (stems) and 61 °C (roots), and its roots sat on average only 9 cm deep.', cite: 'Nobel PS, De la Barrera E (2003) New Phytol 157:271 to 279; Nobel PS, Bobich EG (2002) Oecologia 130:165 to 172', doi: '10.1046/j.1469-8137.2003.00675.x', doi2: '10.1007/s004420100793', measured: 'tissue tolerance and root depth (abstracts read)', value: '65 °C pads; 9 cm mean root depth', badge: 'MEASURED', note: '' },
    'cac.cav': { claim: 'Roots of Agave deserti and Opuntia ficus-indica embolise easily: mean cavitation pressure −0.93 and −0.70 MPa; after 3 months of drought they had lost 69 % and 62 % of conductance, which also limits water draining back into dry soil.', cite: 'Linton MJ, Nobel PS (1999) Am J Bot 86:1538 to 1543 (PMID 10562245)', doi: '', measured: 'root xylem vulnerability (abstract read)', value: '−0.93 and −0.70 MPa; 69 % and 62 %', badge: 'MEASURED', note: '' },
    'crop.pine': { claim: 'Pineapple (Ananas comosus) is the most economically valuable crop with CAM; its CAM genes run on a day and night rhythm, made by changing the regulation of genes all plants have.', cite: 'Ming R et al. (2015) Nat Genet 47:1435 to 1442', doi: '10.1038/ng.3435', measured: 'genome and expression (abstract read)', value: 'qualitative', badge: 'MEASURED', note: '' },
    'crop.kal': { claim: 'Kalanchoë fedtschenkoi is an obligate CAM species (always CAM); its genome is about 260 Mb.', cite: 'Yang X et al. (2017) Nat Commun 8:1899', doi: '10.1038/s41467-017-01491-7', measured: 'genome (abstract read)', value: 'qualitative', badge: 'MEASURED', note: '' },
    'crop.orch': { claim: 'Of 1,103 orchid species from Panama and Costa Rica, about 10 % showed strong CAM by leaf carbon isotopes; C3 is the ancestral state. Isotopes miss weak CAM: night acid tests found it in 42 of 128 species that looked C3.', cite: 'Silvera K et al. (2009) Plant Physiol 149:1838 to 1847; Silvera K, Santiago LS, Winter K (2005) Funct Plant Biol 32:397 to 407', doi: '10.1104/pp.108.132555', doi2: '10.1071/FP04179', measured: 'carbon isotopes and titratable acidity (abstracts read)', value: 'about 10 % strong CAM; 42 of 128 weak CAM', badge: 'MEASURED', note: 'Do not read this as orchids are CAM: most are C3.' },
    'crop.agave': { claim: 'Agave and prickly pear (Opuntia) are the main CAM crops studied for dry farmland; Agave deserti is a CAM leaf succulent and the Sonoran Desert bunchgrass Pleuraphis rigida (big galleta) is C4.', cite: 'Yang X et al. (2015) New Phytol 207:491 to 504; Martre P, North GB, Bobich EG, Nobel PS (2002) Am J Bot 89:1933 to 1939', doi: '10.1111/nph.13393', doi2: '10.3732/ajb.89.12.1933', measured: 'review; field study naming the pathways (abstracts read)', value: 'qualitative', badge: 'SECONDARY', note: '' },
    'crop.grape': { claim: 'Field grown grapevines are treated as C3 plants in this drought study.', cite: 'Medrano H, Escalona JM, Bota J, Gulías J, Flexas J (2002) Ann Bot 89:895 to 905', doi: '10.1093/aob/mcf079', measured: 'gas exchange (abstract and title read)', value: 'qualitative', badge: 'SECONDARY', note: '' },
    'crop.rice': { claim: 'Rice is a C3 plant; the whole C4 rice project starts from that.', cite: 'Om K et al. (2026) Plant Physiol 202(2); Ermakova et al. (2020) Plant J 101:940', doi: '10.1093/plphys/kiag387', doi2: '10.1111/tpj.14562', measured: 'named in the text', value: 'qualitative', badge: 'SECONDARY', note: '' }
  };
  Object.keys(EV).forEach(function (k) { if (EV[k] && !LP.evidence[k]) LP.evidence[k] = EV[k]; });
  [['10.1042/bj1010103', 'Hatch and Slack 1966, Biochem J 101:103'], ['10.1093/jxb/err080', 'Furbank 2011, J Exp Bot 62:3103'], ['10.1104/pp.85.4.958', 'Furbank and Hatch 1987, Plant Physiol 85:958'],
   ['10.1104/pp.91.4.1364', 'Furbank, Jenkins and Hatch 1989, Plant Physiol 91:1364'], ['10.1038/s42003-021-01772-4', 'Danila et al. 2021, Commun Biol 4:254'], ['10.1093/jxb/erab039', 'Chatterjee et al. 2021, J Exp Bot 72:3122'],
   ['10.1104/pp.56.2.194', 'Krenzer, Moss and Crookston 1975, Plant Physiol 56:194'], ['10.1093/jxb/erad250', 'Schlüter et al. 2023, J Exp Bot 74:6631'], ['10.1093/jxb/erw391', 'Schlüter et al. 2017, J Exp Bot 68:191'],
   ['10.1111/tpj.14562', 'Ermakova, Danila, Furbank and von Caemmerer 2020, Plant J 101:940'], ['10.1093/aob/mcl010', 'Ueno et al. 2006, Ann Bot 97:611'], ['10.1073/pnas.1216777110', 'Christin et al. 2013, PNAS 110:1381'],
   ['10.1111/nph.70525', 'Fan et al. 2025, New Phytol 248:1205'], ['10.1093/jxb/err048', 'Sage, Christin and Edwards 2011, J Exp Bot 62:3155'], ['10.1093/jxb/erw156', 'Sage 2016, J Exp Bot 67:4039'],
   ['10.1029/2001GB001807', 'Still et al. 2003, Global Biogeochem Cycles 17(1)'], ['10.1093/jxb/eru234', 'Silvera et al. 2014, J Exp Bot 65:3623'], ['10.1111/j.1469-8137.1991.tb00012.x', 'Ball et al. 1991, New Phytol 117:483'],
   ['10.1093/aob/mci034', 'Pimienta Barrios et al. 2005, Ann Bot 95:363'], ['10.1093/aob/mcad135', 'Gilman et al. 2023, Ann Bot 132:627'], ['10.1093/aob/mch087', 'Lüttge 2004, Ann Bot 93:629'],
   ['10.1071/FP17071', 'Males 2018, Funct Plant Biol 45:681'], ['10.1093/jxb/erm346', 'Nelson and Sage 2008, J Exp Bot 59:1841'], ['10.1111/j.1469-8137.1994.tb04015.x', 'Nobel, Cui and Israel 1994, New Phytol 128:315'],
   ['10.1111/pbi.13487', 'Ermakova et al. 2021, Plant Biotechnol J 19:575'], ['10.1007/s11120-019-00655-4', 'Giuliani et al. 2019, Photosynth Res 142:153'], ['10.1093/plphys/kiag387', 'Om et al. 2026, Plant Physiol 202(2)'],
   ['10.1016/j.cub.2017.09.040', 'Wang et al. 2017, Curr Biol 27:3278'], ['10.1016/j.pbi.2007.11.002', 'Hibberd, Sheehy and Langdale 2008, Curr Opin Plant Biol 11:228'], ['10.1126/science.1220177', 'von Caemmerer, Quick and Furbank 2012, Science 336:1671'],
   ['10.1104/pp.106.088922', 'Winter and Holtum 2007, Plant Physiol 143:98'], ['10.1093/jxb/eru063', 'Winter and Holtum 2014, J Exp Bot 65:3425'], ['10.1104/pp.65.2.193', 'Koch and Kennedy 1980, Plant Physiol 65:193'],
   ['10.1023/A:1025834120499', 'Lara et al. 2003, Photosynth Res 77:241'], ['10.1093/pcp/pch073', 'Lara, Drincovich and Andreo 2004, Plant Cell Physiol 45:618'], ['10.1111/nph.16265', 'Ferrari et al. 2020, New Phytol 225:1699'],
   ['10.1126/sciadv.abn2349', 'Moreno Villena et al. 2022, Sci Adv 8:eabn2349'], ['10.1093/plphys/kiac116', 'Gilman et al. 2022, Plant Physiol 189:735'], ['10.1104/pp.15.01076', 'Brilhaus et al. 2016, Plant Physiol 170:102'],
   ['10.1093/jxb/erz189', 'Maleckova et al. 2019, J Exp Bot 70:6581'], ['10.1111/j.1469-8137.2006.01755.x', 'Lüttge 2006, New Phytol 171:7'], ['10.1093/jxb/ern006', 'Lüttge 2008, J Exp Bot 59:1503'],
   ['10.1093/jxb/eru180', 'Sage, Khoshravesh and Sage 2014, J Exp Bot 65:3341'], ['10.1146/annurev-arplant-042811-105511', 'Sage, Sage and Kocacinar 2012, Annu Rev Plant Biol 63:19'], ['10.3732/ajb.94.3.382', 'McKown and Dengler 2007, Am J Bot 94:382'],
   ['10.1038/35107073', 'Voznesenskaya et al. 2001, Nature 414:543'], ['10.1046/j.1365-313X.2002.01385.x', 'Voznesenskaya et al. 2002, Plant J 31:649'], ['10.1111/j.1469-8137.1992.tb02937.x', 'Ewers, North and Nobel 1992, New Phytol 121:377'],
   ['10.1046/j.1469-8137.1997.00620.x', 'North and Nobel 1997, New Phytol 135:21'], ['10.1104/pp.126.1.352', 'Martre, North and Nobel 2001, Plant Physiol 126:352'], ['10.1111/j.1365-3040.2008.01832.x', 'North, Brinton and Garrett 2008, Plant Cell Environ 31:1179'],
   ['10.3732/ajb.1000286', 'Garrett, Huynh and North 2010, Am J Bot 97:1951'], ['10.1093/aob/mcl133', 'Mauseth 2006, Ann Bot 98:901'], ['10.1007/s10265-003-0131-5', 'Mauseth 2004, J Plant Res 117:69'],
   ['10.1046/j.1469-8137.2003.00675.x', 'Nobel and De la Barrera 2003, New Phytol 157:271'], ['10.1007/s004420100793', 'Nobel and Bobich 2002, Oecologia 130:165'], ['10.1038/ng.3435', 'Ming et al. 2015, Nat Genet 47:1435'],
   ['10.1038/s41467-017-01491-7', 'Yang et al. 2017, Nat Commun 8:1899'], ['10.1104/pp.108.132555', 'Silvera et al. 2009, Plant Physiol 149:1838'], ['10.1071/FP04179', 'Silvera, Santiago and Winter 2005, Funct Plant Biol 32:397'],
   ['10.1111/nph.13393', 'Yang et al. 2015, New Phytol 207:491'], ['10.3732/ajb.89.12.1933', 'Martre et al. 2002, Am J Bot 89:1933'], ['10.1093/aob/mcf079', 'Medrano et al. 2002, Ann Bot 89:895']
  ].forEach(function (s) { if (!LP.sources[s[0]]) LP.sources[s[0]] = s[1]; });

  /* ------------------------------------------------------------ the parts (about 40 words each; some differ by type) */
  var PARTS = {
    stoma: { all: ['Stoma', 'A pore in the leaf skin', 'A pore between two guard cells. CO₂ comes in and water vapour goes out through the same opening. C3 and C4 leaves open their stomata by day, when light can drive photosynthesis, and close them in the dark.'],
      cam: ['Stoma', 'A pore in the skin of the pad', 'A pore between two guard cells. A CAM plant opens it mostly at night, when the air is cooler and dries the plant less, and keeps it shut through the middle of the day. Open it at noon and the pad would lose far more water.'] },
    epidermis: { all: ['Epidermis and cuticle', 'The skin of the leaf', 'One layer of clear cells under a waxy cuticle. Light passes through it, water is held in, and gases go in and out mainly through the stomata.'],
      cam: ['Epidermis and cuticle', 'The skin of the pad', 'One layer of clear cells under a thick waxy cuticle. It holds the stored water in. Gases pass mainly through the stomata, which in a CAM plant open mostly at night.'] },
    air: { all: ['Air space', 'Between the mesophyll cells', 'Air spaces between the cells. CO₂ that came in through a stoma spreads through them to the wet cell walls, dissolves, and moves into the cells. Water vapour takes the same path out.'],
      cam: ['Air space', 'Between the green cells', 'CAM tissue has very little air between its cells. Tight packing goes with stronger CAM, perhaps because it keeps the CO₂ released by day inside the cells.'] },
    palisade: { all: ['Palisade mesophyll', 'Just under the upper skin', 'Column shaped cells packed with chloroplasts, where light is strongest. In a C3 leaf every one of these cells fixes CO₂ with its own Rubisco, straight from the air in the leaf.'] },
    spongy: { all: ['Spongy mesophyll', 'Above the lower skin', 'Rounded cells with wide air spaces between them, so CO₂ from the stomata below can reach every cell. In a C3 leaf these cells also fix CO₂ directly with Rubisco.'] },
    mesophyll: { c4: ['Mesophyll cell (C4)', 'The outer ring of the wreath', 'These cells sit in a ring around the bundle sheath, so each one touches it or is one cell away. Their PEP carboxylase grabs the carbon first and makes four carbon acids such as malate. They hold little or no Rubisco.'],
      cam: ['Green CAM cell', 'The thick green layer of the pad', 'A large, round, tightly packed cell, most of it a big vacuole with a thin green layer of cytoplasm and chloroplasts around it. The same cell fixes carbon twice: with PEP carboxylase at night and with Rubisco by day.'],
      all: ['Mesophyll cell', 'Inside the leaf', 'A green cell between the leaf skins. In a C3 leaf it fixes CO₂ with Rubisco in its chloroplasts.'] },
    bs: { all: ['Bundle sheath (C3)', 'A ring of cells around each vein', 'A ring of pale cells around the vein. In a C3 leaf they hold few chloroplasts; most CO₂ is fixed in the mesophyll. The sheath passes water out of the vein and sugar into it.'],
      c4: ['Bundle sheath (C4)', 'The inner ring of the Kranz wreath', 'Large cells packed with chloroplasts that hold the leaf\'s Rubisco. Malate arrives from the mesophyll and gives up its CO₂ here. Their walls leak CO₂ slowly, so it builds up to as much as about 10 times the level in air.'] },
    vein: { all: ['Vein', 'Running along the leaf', 'A bundle of pipes. Xylem (wide tubes with thick walls) brings water from the roots; phloem (small cells) carries sugar out of the leaf to the rest of the plant.'],
      cam: ['Vein (cortical bundle)', 'At the inner edge of the green layer', 'A small bundle of xylem and phloem. Many cacti have such cortical bundles running through their wide green cortex, so water and sugar reach cells far from the central wood.'] },
    storage: { cam: ['Water storage tissue', 'Deeper inside the pad', 'Big pale cells with few chloroplasts. They hold water the green layer can draw on in drought. Many, but not all, CAM plants have such a tissue.'] },
    chloroplast: { all: ['Chloroplast', 'In the green cells', 'Where light becomes chemical energy and where Rubisco and the Calvin cycle fix CO₂ into sugar. In a C3 leaf the mesophyll chloroplasts do all of it.'],
      c4: ['Chloroplast (C4)', 'In both rings of cells', 'A C4 leaf has two kinds. Bundle sheath chloroplasts hold Rubisco and run the Calvin cycle on the CO₂ that malate brings. Mesophyll chloroplasts help remake PEP and malate and do not fix much CO₂ with Rubisco.'],
      cam: ['Chloroplast (CAM)', 'In the thin green layer of each cell', 'By day it runs the Calvin cycle on CO₂ released from the stored acid, behind closed stomata. Light is used up within the outer part of the green layer, yet deeper cells still fix carbon at night.'] },
    pepc: { all: ['PEP carboxylase (PEPC)', 'In the cytosol of the mesophyll', 'An enzyme that joins carbon to PEP, a three carbon molecule, making oxaloacetate, a four carbon acid. It works on bicarbonate, which carbonic anhydrase makes from CO₂. In C4 and CAM leaves it is the first enzyme to catch the carbon.'],
      c3: ['PEP carboxylase in a C3 leaf', 'In the cytosol', 'C3 leaves carry PEP carboxylase too, for other jobs, but it does not do the first fixation of CO₂ here. In C3 leaves Rubisco catches CO₂ first.'] },
    rubisco: { all: ['Rubisco (C3)', 'In the mesophyll chloroplasts', 'The Calvin cycle enzyme that joins CO₂ to RuBP. In a C3 leaf it works at the CO₂ level that diffuses in, so it often grabs O₂ instead (photorespiration, Light IV).'],
      c4: ['Rubisco (C4)', 'In the bundle sheath chloroplasts', 'Here Rubisco sits mainly in the bundle sheath, where the C4 pump keeps CO₂ high, up to about 10 times air. With so much CO₂ around it, Rubisco rarely grabs O₂.'],
      cam: ['Rubisco (CAM)', 'In the chloroplasts of the green cells', 'By day, behind closed stomata, Rubisco fixes the CO₂ released from the stored acid, in the same cell that caught it at night. In the early morning and late afternoon it can also take CO₂ straight from the air.'] },
    vacuole: { cam: ['Vacuole', 'The big sac in the middle of each green cell', 'A large sac of cell sap. At night malic acid piles up in it, so the sap becomes very acidic: in the CAM tree Clusia rosea it reached pH 2.85 by the end of the night. By day the acid leaves and gives up its CO₂.'],
      all: ['Vacuole', 'In each cell', 'A sac of cell sap that fills much of a mature plant cell.'] },
    co2: { all: ['CO₂', 'Moving molecules, grey', 'Carbon dioxide from the air. It diffuses in through the stoma and the air spaces. Watch where it is caught first: by Rubisco (C3) or by PEP carboxylase (C4 and CAM, as bicarbonate).'] },
    malate: { all: ['Malate', 'A four carbon acid', 'Malate carries the caught carbon. In a C4 leaf it moves from the mesophyll into the bundle sheath. In a CAM cell it is made at night and moved into the vacuole, where it is stored as malic acid.'] },
    malic: { all: ['Malic acid', 'Stored in the vacuole', 'Malate with protons on it: the acid form, stored in the vacuole of a CAM cell overnight. The more is stored, the more acidic the sap. By day it leaves the vacuole and is broken to release CO₂.'] },
    oaa: { all: ['Oxaloacetate', 'A four carbon acid', 'The first product of PEP carboxylase: PEP plus carbon from bicarbonate. It is quickly turned into malate (or, in some C4 plants, into aspartate).'] },
    pep: { all: ['PEP', 'Phosphoenolpyruvate, three carbons', 'The molecule PEP carboxylase adds carbon to. In a C4 leaf it is remade in the mesophyll from pyruvate that comes back from the bundle sheath, which costs extra ATP.'] },
    pyr: { all: ['Pyruvate', 'A three carbon molecule', 'What is left of malate after its CO₂ is released. In a C4 leaf it goes back to the mesophyll to be turned into PEP again, closing the loop.'] },
    sugar: { all: ['Sugar', 'Made by the Calvin cycle', 'The Calvin cycle turns fixed CO₂ into sugar. Some is stored as starch in the chloroplasts, and sucrose leaves through the phloem to feed the rest of the plant.'] },
    release: { all: ['CO₂ release (decarboxylation)', 'Next to Rubisco', 'An enzyme breaks malate into CO₂ and pyruvate. The CO₂ is set free right beside Rubisco: in the bundle sheath of a C4 leaf, or in the same CAM cell by day.'] }
  };
  var PART_EV = { bs: ['c4.ms7', 'c4.leak'], mesophyll: ['c4.ms7'], vacuole: ['cam.clusia', 'cam.cells'], rubisco: ['c4.pump10'], pepc: ['c4.ca'], stoma: [], air: ['cam.pack'], vein: ['c4.vein'], storage: ['cam.cells'], chloroplast: ['cam.opuntia'], oaa: ['c4.hatch'] };
  function partText(id, ty) { var P = PARTS[id]; if (!P) return null; return P[ty] || P.all || P.c4 || P.cam; }

  /* ------------------------------------------------------------ layouts (world units; front face cut at z = 0) */
  var W = 9, DZ = 3;
  function cellFront(c) { return c.z > -0.2; }
  function chlOn(L, c, n, R, sc, zMax) {
    /* chloroplasts round the cut edge of a front cell, between wall and centre */
    for (var i = 0; i < n; i++) {
      var a = (i + R() * 0.6) / n * TAU, f = sc || 0.8, rx = c.rx * f, ry = c.ry * f, q = c.rot || 0;
      var lx = rx * Math.cos(a), ly = ry * Math.sin(a);
      L.chl.push({ x: c.x + lx * Math.cos(q) - ly * Math.sin(q), y: c.y + lx * Math.sin(q) + ly * Math.cos(q), z: -0.03 - R() * (zMax || 0.12), a: a + q, cell: c });
    }
  }
  function vein(L, x, y, o) {
    var v = { x: x, y: y, core: o.core, xy: [], ph: [] };
    var nx = o.nx || 3;
    for (var i = 0; i < nx; i++) { var a = Math.PI * (0.25 + 0.5 * i / Math.max(1, nx - 1)); v.xy.push({ x: x + Math.cos(a) * o.core * 0.5, y: y + Math.sin(a) * o.core * 0.45, r: o.xr * (i === 1 ? 1.15 : 1) }); }
    for (var j = 0; j < 5; j++) { var b = Math.PI * (1.2 + 0.6 * j / 4); v.ph.push({ x: x + Math.cos(b) * o.core * 0.55, y: y + Math.sin(b) * o.core * 0.5, r: o.pr }); }
    L.veins.push(v); return v;
  }
  function epidermis(L, y0, h, skip) {
    for (var zi = 0; zi < 5; zi++) for (var x = -W / 2 + 0.3; x < W / 2; x += 0.6) {
      var z = -0.3 - zi * 0.6;
      if (skip && zi === 0 && Math.abs(x - skip) < 0.42) continue;
      L.cells.push({ k: 'epi', x: x, y: y0 + h / 2, z: z, rx: 0.28, ry: h / 2, rz: 0.28, box: true });
    }
  }
  function buildC3() {
    var R = rng(31), L = { id: 'c3', top: 3.38, cells: [], chl: [], veins: [], pepc: [], rub: [], vac: [], store: [], spots: {} };
    var VX = [-2.35, 2.35], VY = 1.45, VR = 0.64, xs = 0;
    epidermis(L, 0, 0.26, xs); epidermis(L, 3.05, 0.26);
    L.cuticle = { y: 3.31, h: 0.07 }; L.cuticleLow = { y: -0.05, h: 0.05 };
    function nearVein(x, y, r) { return VX.some(function (vx) { return Math.hypot(x - vx, y - VY) < VR + r * 0.9; }); }
    /* palisade: tall columns */
    for (var zi = 0; zi < 7; zi++) for (var x = -W / 2 + 0.25; x < W / 2 - 0.1; x += 0.46) {
      var z = -0.05 - zi * 0.46, px = x + (R() - 0.5) * 0.05;
      var c = { k: 'pal', x: px, y: 2.45, z: z, rx: 0.2, ry: 0.56, rz: 0.2 };
      if (nearVein(px, 1.95, 0.2)) { c.y = 2.6; c.ry = 0.42; }
      L.cells.push(c);
    }
    /* spongy: loose, with air spaces and a cavity over the stoma */
    for (zi = 0; zi < 5; zi++) for (x = -W / 2 + 0.3; x < W / 2; x += 0.62) for (var yi = 0; yi < 2; yi++) {
      var y = 0.62 + yi * 0.52 + (R() - 0.5) * 0.1, sx = x + (yi ? 0.31 : 0) + (R() - 0.5) * 0.12, r = 0.24 + R() * 0.05;
      z = -0.08 - zi * 0.7 + (R() - 0.5) * 0.1;
      if (sx > W / 2 - 0.2) continue;
      if (nearVein(sx, y, r)) continue;
      if (zi === 0 && Math.abs(sx - xs) < 0.62 && y < 1.0) continue;
      if (R() < 0.22 && !(zi === 0 && Math.abs(sx - xs) < 1.4)) continue;
      L.cells.push({ k: 'spg', x: sx, y: y, z: z, rx: r, ry: r * 0.86, rz: r });
    }
    VX.forEach(function (vx) {
      vein(L, vx, VY, { core: 0.28, xr: 0.085, pr: 0.045 });
      for (var zj = 0; zj < 5; zj++) for (var i = 0; i < 8; i++) {
        var a = i / 8 * TAU + 0.2; L.cells.push({ k: 'bs', x: vx + Math.cos(a) * 0.44, y: VY + Math.sin(a) * 0.44, z: -0.05 - zj * 0.66, rx: 0.17, ry: 0.17, rz: 0.32, rot: a });
      }
    });
    L.cells.forEach(function (c) {
      if (!cellFront(c)) return;
      if (c.k === 'pal') chlOn(L, c, 7, R, 0.78); else if (c.k === 'spg') chlOn(L, c, 4, R, 0.74); else if (c.k === 'bs') chlOn(L, c, 1, R, 0.6);
    });
    L.stoma = { x: xs, y: 0.13, z: -0.22, top: false, open: 1 };
    L.stoma2 = { x: 3.6, y: 0.13, z: -1.6, top: false, open: 1 };
    L.out = { x: xs, y: -0.75 }; L.cav = { x: xs, y: 0.62 };
    return L;
  }
  function buildC4() {
    var R = rng(47), L = { id: 'c4', top: 2.66, cells: [], chl: [], veins: [], pepc: [], rub: [], vac: [], store: [], spots: {} };
    var P = 4.7 / 2.1, VX = [-1.5 * P, -0.5 * P, 0.5 * P, 1.5 * P], VY = 1.3, xs = 0;
    epidermis(L, 0, 0.26, xs); epidermis(L, 2.34, 0.26);
    L.cuticle = { y: 2.6, h: 0.06 }; L.cuticleLow = { y: -0.05, h: 0.05 };
    VX.forEach(function (vx, vi) {
      vein(L, vx, VY, { core: 0.22, xr: 0.07, pr: 0.04, nx: 3 });
      for (var zj = 0; zj < 5; zj++) {
        var z = -0.05 - zj * 0.66;
        for (var i = 0; i < 9; i++) { var a = i / 9 * TAU + 0.1; L.cells.push({ k: 'bs', x: vx + Math.cos(a) * 0.41, y: VY + Math.sin(a) * 0.41, z: z, rx: 0.2, ry: 0.19, rz: 0.31, rot: a, v: vi }); }
        for (i = 0; i < 12; i++) {
          a = i / 12 * TAU + 0.26;
          var mx = vx + Math.cos(a) * 0.83, my = VY + Math.sin(a) * 0.83;
          if (my < 0.42 || my > 2.2) { my = clamp(my, 0.45, 2.17); }
          if (zj === 0 && Math.abs(mx - xs) < 0.36 && my < 0.75) continue;
          L.cells.push({ k: 'ms', x: mx, y: my, z: z + (R() - 0.5) * 0.06, rx: 0.21, ry: 0.165, rz: 0.3, rot: a, v: vi });
        }
      }
    });
    L.cells.forEach(function (c) {
      if (!cellFront(c)) return;
      if (c.k === 'bs') chlOn(L, c, 8, R, 0.7); else if (c.k === 'ms') chlOn(L, c, 3, R, 0.62);
    });
    L.stoma = { x: xs, y: 0.13, z: -0.22, top: false, open: 1 };
    L.stoma2 = { x: -2.3, y: 0.13, z: -1.6, top: false, open: 1 };
    L.out = { x: xs, y: -0.75 }; L.cav = { x: xs, y: 0.5 };
    L.vx = VX; L.vy = VY;
    return L;
  }
  function buildCAM() {
    var R = rng(83), L = { id: 'cam', top: 4.74, cells: [], chl: [], veins: [], pepc: [], rub: [], vac: [], store: [], spots: {} };
    var xs = 0.37;
    epidermis(L, 4.36, 0.26, xs);
    L.cuticle = { y: 4.62, h: 0.13 }; L.cuticleLow = null;
    var Ly = [3.88, 3.08, 2.28];
    for (var zi = 0; zi < 4; zi++) Ly.forEach(function (y, li) {
      for (var x = -W / 2 + 0.38 + (li % 2) * 0.37; x < W / 2 - 0.2; x += 0.74) {
        var z = -0.05 - zi * 0.76, cx = x + (R() - 0.5) * 0.05;
        if (zi === 0 && li === 0 && Math.abs(cx - xs) < 0.4) continue;
        L.cells.push({ k: 'cg', x: cx, y: y + (R() - 0.5) * 0.06, z: z, rx: 0.37, ry: 0.41, rz: 0.37, layer: li });
      }
    });
    var Sy = [1.42, 0.52], VXc = [-2.6, 2.6];
    for (zi = 0; zi < 3; zi++) Sy.forEach(function (y, li) {
      for (var x = -W / 2 + 0.5 + (li % 2) * 0.48; x < W / 2 - 0.3; x += 0.96) {
        var z = -0.05 - zi * 1.0;
        if (li === 0 && VXc.some(function (v) { return Math.abs(x - v) < 0.7; })) continue;
        L.cells.push({ k: 'sto', x: x + (R() - 0.5) * 0.06, y: y, z: z, rx: 0.47, ry: 0.44, rz: 0.47 });
      }
    });
    VXc.forEach(function (vx) { vein(L, vx, 1.62, { core: 0.26, xr: 0.07, pr: 0.042 }); });
    L.cells.forEach(function (c) {
      if (!cellFront(c)) return;
      if (c.k === 'cg') { chlOn(L, c, 9, R, 0.88, 0.08); L.vac.push({ x: c.x, y: c.y, z: c.z, r: Math.min(c.rx, c.ry) * 0.74, cell: c }); }
      else if (c.k === 'sto') { chlOn(L, c, 1, R, 0.86, 0.06); L.vac.push({ x: c.x, y: c.y, z: c.z, r: Math.min(c.rx, c.ry) * 0.8, cell: c, pale: true }); }
    });
    /* places where stored malic acid shows: inside the vacuoles of the front green cells */
    L.vac.forEach(function (v, i) {
      if (v.pale) return;
      for (var j = 0; j < 4; j++) { var a = j / 4 * TAU + R(), rr = v.r * (0.25 + R() * 0.45); L.store.push({ x: v.x + Math.cos(a) * rr, y: v.y + Math.sin(a) * rr, z: -0.04 - R() * 0.1, rk: R() }); }
    });
    L.store.sort(function (a, b) { return a.rk - b.rk; });
    L.stoma = { x: xs, y: 4.49, z: -0.22, top: true, open: 1 };
    L.stoma2 = { x: -3.1, y: 4.49, z: -1.7, top: true, open: 1 };
    L.out = { x: xs, y: 5.5 }; L.cav = { x: xs, y: 3.95 };
    return L;
  }

  /* ------------------------------------------------------------ routes: where each molecule goes (segments of points) */
  var ZR = -0.07;
  function P3(x, y, z) { return [x, y, z == null ? ZR : z]; }
  function toward(c, px, py, f) { var dx = px - c.x, dy = py - c.y, d = Math.hypot(dx, dy) || 1; return P3(c.x + dx / d * c.rx * f, c.y + dy / d * c.ry * f); }
  function nearest(list, x, y, filt) { var b = null, bd = 1e9; list.forEach(function (c) { if (filt && !filt(c)) return; var d = Math.hypot(c.x - x, c.y - y); if (d < bd) { bd = d; b = c; } }); return b; }
  function chlOf(L, cell, x, y) { return nearest(L.chl, x, y, function (q) { return q.cell === cell; }); }
  function routesC3(L) {
    var front = L.cells.filter(function (c) { return cellFront(c) && (c.k === 'spg' || c.k === 'pal'); });
    var tg = front.filter(function (c) { return Math.abs(c.x - L.stoma.x) < 1.25; }).sort(function (a, b) { return Math.abs(a.x - L.stoma.x) - Math.abs(b.x - L.stoma.x); }).slice(0, 4);
    var out = [];
    tg.forEach(function (c) {
      var ent = toward(c, L.cav.x, L.cav.y - 0.1, 1.2), ch = chlOf(L, c, ent[0], ent[1]);
      var cp = P3(ch.x, ch.y, -0.035); L.rub.push({ x: ch.x, y: ch.y, z: -0.02 });
      var vv = nearest(L.veins, c.x, c.y), bsc = nearest(L.cells, c.x, c.y, function (q) { return q.k === 'bs' && cellFront(q) && Math.hypot(q.x - vv.x, q.y - vv.y) < 0.6; });
      out.push({ co2: [P3(L.out.x, L.out.y), P3(L.stoma.x, 0.13), P3(L.cav.x, L.cav.y), ent, cp],
        sugar: [cp, P3(c.x, c.y), P3(bsc.x, bsc.y), P3(vv.x, vv.y - 0.12, -0.05), P3(vv.x, vv.y - 0.12, -2.9)] });
    });
    L.spots.rubisco = L.rub[0]; return out;
  }
  function routesC4(L) {
    var out = [];
    [1, 2].forEach(function (vi) {
      var ms = L.cells.filter(function (c) { return c.k === 'ms' && c.v === vi && cellFront(c); });
      var tg = ms.slice().sort(function (a, b) { return Math.hypot(a.x - L.cav.x, a.y - L.cav.y) - Math.hypot(b.x - L.cav.x, b.y - L.cav.y); }).slice(0, 2);
      tg.forEach(function (m) {
        var pe = toward(m, L.cav.x, L.cav.y, 0.55); L.pepc.push({ x: pe[0], y: pe[1], z: -0.03 });
        var bsc = nearest(L.cells, m.x, m.y, function (q) { return q.k === 'bs' && q.v === vi && cellFront(q); });
        var pd = P3((m.x + bsc.x) / 2, (m.y + bsc.y) / 2);   /* plasmodesmata at the shared wall */
        var vx = L.vx[vi], dc = toward(bsc, vx, L.vy, 0.25);
        var ch = chlOf(L, bsc, vx, L.vy) || chlOf(L, bsc, bsc.x, bsc.y); L.rub.push({ x: ch.x, y: ch.y, z: -0.02 });
        var mch = chlOf(L, m, m.x, m.y);
        var oa = P3(lerp(pe[0], m.x, 0.35), lerp(pe[1], m.y, 0.35));
        out.push({ co2: [P3(L.out.x, L.out.y), P3(L.stoma.x, 0.13), P3(L.cav.x, L.cav.y), toward(m, L.cav.x, L.cav.y, 1.2), pe],
          oaa: [pe, oa], malate: [oa, P3(m.x, m.y), pd, P3(bsc.x, bsc.y), dc], rel: dc,
          co2b: [dc, P3(ch.x, ch.y, -0.035)], sugar: [P3(ch.x, ch.y, -0.035), P3(vx, L.vy - 0.1, -0.05), P3(vx, L.vy - 0.1, -2.9)],
          pyr: [dc, P3(bsc.x, bsc.y), pd, P3(m.x, m.y), P3(mch.x, mch.y, -0.035)], pep: [P3(mch.x, mch.y, -0.035), pe] });
      });
    });
    L.spots.pepc = L.pepc[0]; L.spots.rubisco = L.rub[0]; return out;
  }
  function routesCAM(L) {
    var out = [];
    var tg = L.cells.filter(function (c) { return c.k === 'cg' && cellFront(c) && c.layer <= 1 && Math.abs(c.x - L.stoma.x) < 1.6; });
    tg.sort(function (a, b) { return Math.hypot(a.x - L.cav.x, a.y - L.cav.y) - Math.hypot(b.x - L.cav.x, b.y - L.cav.y); });
    tg.slice(0, 4).forEach(function (c) {
      var vac = nearest(L.vac, c.x, c.y, function (v) { return v.cell === c; });
      var ent = toward(c, L.cav.x, L.cav.y, 1.15), pe = toward(c, L.cav.x, L.cav.y, 0.82);
      L.pepc.push({ x: pe[0], y: pe[1], z: -0.03 });
      var ton = toward(c, L.cav.x, L.cav.y, 0.66), inV = P3(c.x + (pe[0] - c.x) * 0.25, c.y + (pe[1] - c.y) * 0.25, -0.05);
      var far = P3(2 * c.x - pe[0] * 0.9 - c.x * 0.1, 2 * c.y - pe[1] * 0.9 - c.y * 0.1);
      var ch = chlOf(L, c, far[0], far[1]); L.rub.push({ x: ch.x, y: ch.y, z: -0.02 });
      var dc = toward(c, ch.x, ch.y, 0.7), ton2 = toward(c, ch.x, ch.y, 0.6);
      var vv = nearest(L.veins, c.x, c.y);
      out.push({ night: { co2: [P3(L.out.x, L.out.y), P3(L.stoma.x, 4.45), P3(L.cav.x, L.cav.y), ent, pe], oaa: [pe, toward(c, L.cav.x, L.cav.y, 0.74)], malate: [toward(c, L.cav.x, L.cav.y, 0.74), ton, inV] },
        day: { malic: [P3(c.x, c.y, -0.05), ton2], malate: [ton2, dc], rel: dc, co2: [dc, P3(ch.x, ch.y, -0.035)], sugar: [P3(ch.x, ch.y, -0.035), P3(c.x, c.y - c.ry * 0.9), P3(vv.x, vv.y - 0.1, -0.05), P3(vv.x, vv.y - 0.1, -2.6)] },
        direct: { co2: [P3(L.out.x, L.out.y), P3(L.stoma.x, 4.45), P3(L.cav.x, L.cav.y), ent, P3(ch.x, ch.y, -0.035)] }, cell: c, vac: vac });
    });
    L.spots.pepc = L.pepc[0]; L.spots.rubisco = L.rub[0]; return out;
  }
  var LAY = null;
  function layouts() {
    if (LAY) return LAY;
    LAY = { c3: buildC3(), c4: buildC4(), cam: buildCAM() };
    LAY.c3.routes = routesC3(LAY.c3); LAY.c4.routes = routesC4(LAY.c4); LAY.cam.routes = routesCAM(LAY.cam);
    return LAY;
  }

  /* ------------------------------------------------------------ state, CAM clock */
  var S = {
    type: 'c4', frozen: false, names: true, hl: null, picked: false,
    layers: { route: true, pepc: true, rubisco: true, malate: true, shuttle: true, release: true, sugar: true },
    hour: 1.0, clockRun: true, acid: 0.55, tm: 0, dirty: true
  };
  var LAYER_OF = { co2: 'route', co2b: 'route', malate: 'malate', malic: 'malate', oaa: 'shuttle', pep: 'shuttle', pyr: 'shuttle', sugar: 'sugar' };
  var LAYERS = [['route', 'CO₂ route'], ['pepc', 'PEP carboxylase'], ['rubisco', 'Rubisco'], ['malate', 'Malate and malic acid'], ['shuttle', 'PEP, oxaloacetate, pyruvate'], ['release', 'CO₂ release'], ['sugar', 'Sugar out']];
  function phase(h) {
    h = ((h % 24) + 24) % 24;
    if (h >= 19 || h < 6) return { id: 'I', name: 'Phase I, night', open: 1, pepc: true, rel: false, sun: 0 };
    if (h < 10) return { id: 'II', name: 'Phase II, early morning', open: 0.55, pepc: false, rel: true, direct: true, sun: 1 };
    if (h < 15) return { id: 'mid', name: 'Middle of the day', open: 0, pepc: false, rel: true, sun: 1 };
    return { id: 'IV', name: 'Phase IV, late afternoon', open: 0.6, pepc: false, rel: false, direct: true, sun: 1 };
  }
  function sunAt(h) { h = ((h % 24) + 24) % 24; return clamp(Math.min((h - 5.5) / 1.5, (19 - h) / 1.5), 0, 1); }
  function aperture(h) { /* smooth stomatal opening over the CAM day */
    var k = 0, n = 16;
    for (var i = 0; i < n; i++) k += phase(h - 0.5 + i / n).open; return k / n;
  }
  function hh(h) { h = ((h % 24) + 24) % 24; var H = Math.floor(h), M = Math.floor((h - H) * 60 / 15) * 15; return (H < 10 ? '0' : '') + H + ':' + (M < 10 ? '0' : '') + M; }

  /* ------------------------------------------------------------ CSS */
  function cssVars(s) { return '--c4-malate:' + s.malate + ';--c4-malic:' + s.malic + ';--c4-pep:' + s.pep + ';--c4-oaa:' + s.oaa + ';--c4-pyr:' + s.pyr + ';--c4-sugar:' + s.sugar + ';'; }
  var CSS = ':root{' + cssVars(NC.light) + '}@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){' + cssVars(NC.dark) + '}}:root[data-theme="dark"]{' + cssVars(NC.dark) + '}' +
'.c4{margin:0 0 22px}' +
'.c4 .c4-what{margin:0 0 6px;max-width:60em}' +
'.c4 .c4-todo{font-family:var(--ui);font-size:14.5px;line-height:1.45;margin:0 0 10px;padding:7px 11px;background:var(--card);border-left:4px solid var(--accent);max-width:60em}' +
'.c4-grid{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(0,1fr);gap:12px;align-items:start}' +
'.c4-3d{min-width:0;border-radius:12px;overflow:hidden;background:#0d1610;' + cssVars(NC.dark) + '--mol-co2:#cfd3d8;--mol-co2-c:#8a9098;--mol-co2-o:#d9dce0}' +
'.c4-stage{position:relative;height:460px;overflow:hidden;background:radial-gradient(120% 95% at 50% 30%,#2a4a33 0%,#14241b 55%,#0b130e 100%);transition:background .6s}' +
'.c4-stage.night{background:radial-gradient(120% 95% at 50% 25%,#1b2748 0%,#0f1628 58%,#070a14 100%)}' +
'.c4-gl{position:absolute;inset:0;z-index:2}.c4-gl canvas{display:block;width:100%!important;height:100%!important}' +
'.c4-svg{position:absolute;inset:0;width:100%;height:100%;z-index:2}.c4-svg [data-part]{cursor:pointer}.c4-svg [data-part]:hover{filter:brightness(1.2)}' +
'.c4-tags{position:absolute;inset:0;pointer-events:none;z-index:5}' +
'.c4-tag{position:absolute;transform:translate(-50%,-100%);margin-top:-6px;font:500 11.5px/1.2 var(--ui);color:#f4f1e8;background:rgba(12,18,14,.8);border:1px solid rgba(255,255,255,.24);border-radius:999px;padding:2px 8px;white-space:nowrap}' +
'.c4-tag.m{font-size:10.5px;padding:1px 6px;border-color:rgba(255,255,255,.4)}.c4-tag[hidden]{display:none}' +
'.c4-badge3{position:absolute;z-index:6;left:10px;top:10px;font:600 12px/1.2 var(--ui);color:#f4f1e8;background:rgba(12,18,14,.72);border:1px solid rgba(255,255,255,.28);border-radius:8px;padding:5px 9px;max-width:calc(100% - 210px)}' +
'.c4-badge3 small{display:block;font-weight:400;opacity:.85;margin-top:2px}' +
'.c4-panel{position:absolute;z-index:8;left:8px;right:8px;bottom:8px;max-height:42%;overflow:auto;background:#faf6ec;color:#2a231c;border:1px solid #c4b597;border-radius:10px;padding:10px 12px 11px;font:400 12.5px/1.4 var(--ui);box-shadow:0 10px 30px -12px rgba(0,0,0,.6)}' +
'.c4-panel h4{display:inline;margin:0 8px 0 0;font:600 14.5px/1.25 var(--ui)}.c4-panel .wh{display:inline;margin:0;font-size:12px;color:#5e5141;font-style:italic}' +
'.c4-panel p{margin:0}.c4-panel p.tx{margin:3px 28px 0 0}.c4-panel .evc{margin-left:4px}' +
'.c4-panel .x{position:absolute;right:6px;top:6px;width:30px;height:30px;border:0;background:none;font:400 20px/1 var(--ui);color:#2a231c;cursor:pointer;border-radius:6px}' +
'.c4-panel .x:focus-visible{outline:2px solid #2b5fa4}' +
'.c4-bar{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:7px 10px;background:#141c16;border-top:1px solid rgba(214,232,190,.18)}' +
'.c4-bar .mh-ctl{padding:0;border:0;background:none;flex:1 1 100%}' +
'.c4-b{font:500 12.5px/1.2 var(--ui);color:#f4f1e8;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.34);border-radius:999px;padding:5px 12px;min-height:32px;cursor:pointer}' +
'.c4-b:hover{background:rgba(255,255,255,.14)}.c4-b[aria-pressed="true"]{background:#f4f1e8;color:#14201a;border-color:#f4f1e8}.c4-b:focus-visible{outline:2px solid #ffd479;outline-offset:2px}.c4-b[hidden]{display:none}' +
'.c4-3d .c4-molkey{margin:0;padding:4px 12px 10px;color:#dfe8d3}.c4-3d .c4-molkey .l{color:#f4f1e8}' +
'.c4-molkey{display:flex;flex-wrap:wrap;align-items:center;gap:4px 12px;margin:4px 0;font:500 12.5px/1.35 var(--ui);color:var(--ink2)}.c4-molkey .l{font-weight:600;color:var(--ink)}.c4-molkey .k{display:inline-flex;align-items:center;gap:4px;white-space:nowrap}.c4-molkey .k[hidden]{display:none}.c4-gi{flex:none}' +
'.c4-side{display:flex;flex-direction:column;gap:8px;min-width:0;font-family:var(--ui)}' +
'.c4-types{display:flex;border:1px solid var(--rule);border-radius:999px;overflow:hidden}' +
'.c4-types button{flex:1;font:600 14px/1 var(--ui);letter-spacing:.06em;min-height:42px;border:0;background:var(--paper);color:var(--ink);cursor:pointer}' +
'.c4-types button+button{border-left:1px solid var(--rule)}.c4-types button[aria-pressed="true"]{background:var(--plaque);color:var(--plaque-ink)}.c4-types button:focus-visible{outline:2px solid var(--accent);outline-offset:-3px}' +
'.c4-types small{display:block;font:400 11px/1.2 var(--ui);letter-spacing:0;margin-top:3px;opacity:.85}' +
'.c4-c{background:var(--card);border:1px solid var(--rule2);border-radius:6px;padding:6px 10px 8px}' +
'.c4-c .lbl{display:flex;justify-content:space-between;gap:8px;font-size:12px;letter-spacing:.04em;text-transform:uppercase;color:var(--ink2)}' +
'.c4-c output{font:500 13px var(--mono);text-transform:none;letter-spacing:0;color:var(--ink);white-space:nowrap}' +
'.c4-c input[type=range]{width:100%;margin:6px 0 0}.c4-c .h{font-size:11.5px;color:var(--ink3);margin-top:2px;line-height:1.3}' +
'.c4-c select{width:100%;margin-top:5px;min-height:38px;font:14px var(--ui);background:var(--paper);color:var(--ink);border:1px solid var(--rule);border-radius:4px}' +
'.c4-chips{display:flex;flex-wrap:wrap;gap:5px;margin-top:6px}' +
'.c4-chip{font:500 12.5px/1.2 var(--ui);min-height:32px;padding:4px 10px 4px 8px;border-radius:999px;border:1px solid var(--rule);background:var(--paper);color:var(--ink);cursor:pointer;display:inline-flex;align-items:center;gap:5px}' +
'.c4-chip::before{content:"";width:9px;height:9px;border-radius:2px;border:1.5px solid currentColor;box-sizing:border-box}' +
'.c4-chip[aria-pressed="true"]{background:var(--plaque);color:var(--plaque-ink);border-color:var(--plaque)}.c4-chip[aria-pressed="true"]::before{background:currentColor}' +
'.c4-chip.dim{opacity:.55}.c4-chip:focus-visible{outline:2px solid var(--accent);outline-offset:2px}' +
'.c4-clock{display:none}.c4-clock.on{display:block}.c4-clock .row{display:flex;gap:6px;margin-top:6px;flex-wrap:wrap}' +
'.c4-clock .row button{font:500 12.5px var(--ui);min-height:32px;border:1px solid var(--rule);background:var(--paper);color:var(--ink);border-radius:999px;padding:3px 11px;cursor:pointer}.c4-clock .row button[aria-pressed="true"]{background:var(--plaque);color:var(--plaque-ink)}' +
'.c4-now{margin:0;font-size:14px;line-height:1.45;padding:7px 10px;background:var(--card);border:1px solid var(--rule);border-left:4px solid var(--accent);border-radius:4px}' +
'.c4-ro{width:100%;border-collapse:collapse;font-size:12.5px;line-height:1.35}.c4-ro th,.c4-ro td{border-top:1px solid var(--rule2);padding:4px 5px;vertical-align:top;text-align:left}' +
'.c4-ro th{font-weight:600;color:var(--ink2);width:34%}.c4-ro td{color:var(--ink)}.c4-ro .evc{margin-left:2px}' +
'.c4-ro caption{text-align:left;font:600 12px var(--ui);letter-spacing:.06em;text-transform:uppercase;color:var(--ink2);padding:0 0 4px}' +
'.c4-live{font:500 13px var(--ui);display:flex;flex-wrap:wrap;gap:4px 12px;margin:2px 0 0;color:var(--ink)}.c4-live b{font:600 13px var(--mono)}' +
'.c4-row2{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(0,1fr);gap:12px;margin-top:12px;align-items:start}' +
'.c4-fig{display:block;width:100%;height:auto;border:1px solid var(--rule);border-radius:6px;background:var(--wall)}' +
'.c4-fig text{font-family:var(--ui);fill:var(--ink)}.c4-fig .mut{fill:var(--ink2)}.c4-fig [data-part]{cursor:pointer}.c4-fig [data-part]:hover rect{stroke-width:2.4}' +
'.c4-row2 .cap{font-size:14px;margin-top:5px}' +
'.c4-why{margin-top:12px;border:1px solid var(--rule);border-radius:6px;background:var(--card);padding:0 12px}.c4-why summary{cursor:pointer;font:600 15px/1.3 var(--ui);padding:10px 0;min-height:24px}.c4-why ul{margin:0 0 10px;padding-left:1.2em}.c4-why li{margin:0 0 7px}' +
'.c4-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.c4-cards .card h4{margin:0 0 4px;font:600 17px/1.25 var(--ui)}.c4-cards .card p{margin:6px 0}' +
'.c4-tbl{width:100%;border-collapse:collapse;font-size:15px}.c4-tbl th,.c4-tbl td{border-top:1px solid var(--rule2);padding:6px 6px;text-align:left;vertical-align:top}.c4-tbl th{font:600 13px var(--ui);color:var(--ink2);letter-spacing:.04em}' +
'.c4-two{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px}.c4-two .card h4{margin:0 0 6px;font:600 16px/1.25 var(--ui)}.c4-two ul{margin:4px 0;padding-left:1.15em}.c4-two li{margin:0 0 6px}' +
'@media (max-width:760px){.c4-grid,.c4-row2,.c4-cards,.c4-two{grid-template-columns:minmax(0,1fr)}.c4-stage{height:340px}.c4-panel{max-height:52%;padding:7px 10px}.c4-tag{font-size:10.5px;padding:2px 6px}.c4-badge3{font-size:11px;max-width:calc(100% - 20px);top:auto;bottom:8px}.c4-badge3 small{display:none}' +
'.c4 .c4-what,.c4 .c4-todo,.c4-now,.c4-row2 .cap,.c4-why{padding-right:58px}.c4-tbl{font-size:14px}.c4-tbl th,.c4-tbl td{padding:5px 3px}}';

  /* ------------------------------------------------------------ markup: the workstation */
  var TYPES = {
    c3: { name: 'C3', sub: 'Rubisco first', ex: 'A broadleaf C3 leaf, such as grapevine', tag: 'C3 leaf · Rubisco takes CO₂ straight from the air in the leaf' },
    c4: { name: 'C4', sub: 'a pump in space', ex: 'A C4 grass leaf, such as maize', tag: 'C4 leaf · Kranz anatomy, a CO₂ pump into the bundle sheath' },
    cam: { name: 'CAM', sub: 'a pump in time', ex: 'The outer layers of a prickly pear pad', tag: 'CAM pad · catch CO₂ at night, use it by day' }
  };
  function workstation() {
    var parts = ['stoma', 'epidermis', 'air', 'palisade', 'spongy', 'mesophyll', 'bs', 'vein', 'chloroplast', 'pepc', 'rubisco', 'vacuole', 'storage', 'release'];
    return '<section class="fig lx-fig c4" id="c4-ws" aria-label="Three leaves, three routes">' +
      '<div class="fighead"><h3>6.1 Three leaves, three routes for CO₂</h3><p>Same job, catching CO₂ for sugar. Three different leaf plans.</p></div>' +
      '<p class="c4-what">This is a small block cut out of a leaf, with its front face sliced open so you can see inside the cells. Every green plant fixes CO₂ (builds it into sugar) with the enzyme <b>Rubisco</b>. A <b>C3</b> leaf hands CO₂ straight to Rubisco. A <b>C4</b> leaf first catches it with another enzyme, <b>PEP carboxylase</b>, and pumps it to Rubisco in a ring of cells around each vein, the bundle sheath. This wreath of cells is called Kranz anatomy (Kranz is German for wreath). A <b>CAM</b> plant (crassulacean acid metabolism, named after the stonecrop family) catches it at night, stores it as an acid, and uses it the next day.</p>' +
      '<p class="c4-todo"><b>What to do:</b> press <b>C3</b>, <b>C4</b> or <b>CAM</b>. Drag to turn the leaf. Use the chips to show or hide each part of the route. In CAM, run the clock from night to day and watch the stomata and the vacuoles. Click the view to freeze it and click again to play; a click on a part also opens a note on what it is. The Name a part list works while frozen.</p>' +
      '<div class="c4-grid">' +
      '<div class="c4-3d"><div class="c4-stage" id="c4-stage"><div class="c4-gl mh-gl" role="img" aria-label="A leaf block cut open: cells, veins, a stoma and molecules moving along the route of the chosen type"></div><div class="c4-tags" aria-hidden="true"></div>' +
      '<p class="c4-badge3" aria-live="polite"><span id="c4-b3"></span><small id="c4-b3s"></small></p>' +
      '<div class="c4-panel" role="region" aria-live="polite" hidden></div></div>' +
      '<div class="c4-bar"><button type="button" class="c4-b" data-a="freeze" aria-pressed="false">Pause</button><button type="button" class="c4-b" data-a="step" hidden>Step</button>' +
      '<button type="button" class="c4-b" data-a="names" aria-pressed="true">Names</button></div>' +
      molKey(['co2', 'malate', 'malic', 'oaa', 'pep', 'pyr', 'sugar'], 'Molecule colours:') + '</div>' +
      '<div class="c4-side">' +
      '<div class="c4-types" role="group" aria-label="Choose the leaf type">' + ['c3', 'c4', 'cam'].map(function (t) { return '<button type="button" data-t="' + t + '" aria-pressed="false">' + TYPES[t].name + '<small>' + TYPES[t].sub + '</small></button>'; }).join('') + '</div>' +
      '<div class="c4-c"><span class="lbl">Show or hide</span><div class="c4-chips" role="group" aria-label="Layers">' + LAYERS.map(function (l) { return '<button type="button" class="c4-chip" data-l="' + l[0] + '" aria-pressed="true">' + l[1] + '</button>'; }).join('') + '</div></div>' +
      '<div class="c4-c c4-clock" id="c4-clock"><label class="lbl" for="c4-hour">CAM clock <output id="c4-hour-o"></output></label><input type="range" id="c4-hour" min="0" max="23.75" step="0.25" value="1">' +
      '<div class="row"><button type="button" data-h="0">Night</button><button type="button" data-h="7.5">Early morning</button><button type="button" data-h="12">Noon</button><button type="button" data-h="17">Late afternoon</button><button type="button" data-a="run" aria-pressed="true">Run the clock</button></div>' +
      '<div class="h">24 hours pass in about a minute at normal speed. Times are teaching values ' + ev('cam.clock', 'Clock') + '</div></div>' +
      '<p class="c4-now" aria-live="polite"><b>What just happened:</b> <span id="c4-now"></span></p>' +
      '<div class="c4-c" id="c4-ro"></div>' +
      '<div class="c4-c"><label class="lbl" for="c4-part">Name a part</label><select id="c4-part"><option value="">Pick a part to read about it</option>' + parts.map(function (k) { var p = partText(k, 'all') || partText(k, 'c4') || partText(k, 'cam'); return '<option value="' + k + '">' + esc(p[0].replace(/ \((C3|C4|CAM)\)$/, '')) + '</option>'; }).join('') + '</select></div>' +
      '</div></div>' +
      '<div class="c4-row2">' +
      '<div><div id="c4-map"></div><p class="cap">The route as a map, for the leaf you chose. It follows the chips and, in CAM, the clock. Click a box to read about it.</p></div>' +
      '<div><div id="c4-num"></div><p class="cap" id="c4-numcap"></p></div>' +
      '</div>' +
      '<details class="c4-why"><summary>Why does this happen?</summary><ul>' +
      '<li><b>Rubisco is slow and easily distracted.</b> It joins CO₂ to RuBP, a five carbon sugar, but it can also grab O₂, and every O₂ it grabs costs the leaf energy to repair (photorespiration, <a href="#stroma">Light IV</a>). The more CO₂ around Rubisco, the less often that happens.</li>' +
      '<li><b>C4: a pump in space.</b> PEP carboxylase in the mesophyll catches the carbon (as bicarbonate) and makes four carbon acids. Malate carries it into the bundle sheath, where it is broken to release CO₂ beside Rubisco. The sheath walls leak CO₂ slowly, so it builds up to as much as about 10 times the level in air ' + badge('SECONDARY') + ' ' + ev('c4.pump10', 'Furbank 2011') + ' ' + ev('c4.leak', 'Furbank 1989') + '. Pumping costs extra ATP to remake PEP.</li>' +
      '<li><b>CAM: a pump in time.</b> At night the stomata open, PEP carboxylase catches CO₂ and the cell stores it as malic acid in its vacuole. By day the stomata close to save water, the acid comes back out and releases CO₂ inside the closed leaf for Rubisco ' + ev('cam.path', 'Silvera 2014') + '.</li>' +
      '<li class="tier-2"><b>Why the anatomy matters.</b> A pump only helps if each mesophyll cell is next to a bundle sheath cell. C4 grass leaves have at most 2 to 3 mesophyll cells between bundle sheaths, against about 7 in rice ' + badge('SECONDARY') + ' ' + ev('c4.ms7', 'Ermakova 2020') + ', and about 2.1 times as much vein length per leaf area as C3 grasses ' + badge('MEASURED') + ' ' + ev('c4.vein', 'Ueno 2006') + '. CAM cells are large and packed tightly with little air between them ' + ev('cam.pack', 'Nelson 2008') + '.</li>' +
      '<li class="tier-2"><b>Not to scale.</b> The leaves are drawn to the cell counts above, not to µm, and the molecules move at teaching speeds ' + badge('ILLUSTRATIVE') + ' ' + ev('c4.scene', 'Drawing') + '. The C4 leaf shows the malate route of maize; some C4 plants move aspartate instead, and many mix routes ' + ev('c4.pump10', 'Types') + '.</li>' +
      '</ul></details>' +
      '</section>';
  }

  /* ------------------------------------------------------------ 3D */
  var G = null;
  var CELLCOL = { epi: 0xdfe6cf, pal: 0x6aab48, spg: 0x82bb62, bs3: 0xd8dcb6, bs4: 0x2f7a26, ms: 0xa8d68a, cg: 0x64a447, sto: 0xc9c39c, guard: 0x5a9a3e };
  var PART_OF = { epi: 'epidermis', pal: 'palisade', spg: 'spongy', bs: 'bs', ms: 'mesophyll', cg: 'mesophyll', sto: 'storage', guard: 'stoma', chl: 'chloroplast', vac: 'vacuole', vein: 'vein', cut: 'epidermis', pepc: 'pepc', rub: 'rubisco', store: 'malic', burst: 'release' };
  function build3D(stage, bar) {
    var T = window.THREE, MM = LP.macro, glh = stage.querySelector('.c4-gl');
    var renderer;
    try { renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' }); } catch (e) { return null; }
    if (!renderer || !renderer.getContext()) return null;
    renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
    renderer.localClippingEnabled = true;
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.92;
    renderer.setClearColor(0x000000, 0);
    glh.appendChild(renderer.domElement);
    var scene = new T.Scene(), cam = new T.PerspectiveCamera(30, 1, 0.1, 120);
    var hemi = new T.HemisphereLight(0xeaf6ff, 0x1a2a18, 0.6); scene.add(hemi);
    var key = new T.DirectionalLight(0xfff2dc, 0.95); key.position.set(3, 9, 7); scene.add(key);
    var rim = new T.DirectionalLight(0x9fd0ff, 0.4); rim.position.set(-6, 2, -5); scene.add(rim);
    var clip = [new T.Plane(new T.Vector3(0, 0, -1), 0.002)];
    function lin(c) { return new T.Color(c).convertSRGBToLinear(); }
    function mat(col, o) {
      o = o || {};
      var m = new T.MeshStandardMaterial({ color: lin(col), roughness: o.r != null ? o.r : 0.6, metalness: 0, side: o.side != null ? o.side : T.DoubleSide, clippingPlanes: o.noclip ? null : clip,
        transparent: !!o.op, opacity: o.op || 1, depthWrite: o.dw !== false, emissive: lin(o.em || 0x000000), emissiveIntensity: o.ei || 1, vertexColors: !!o.vc });
      m.userData.em = m.emissive.clone(); m.userData.ei = m.emissiveIntensity; return m;
    }
    var gSph = new T.SphereGeometry(1, 18, 13), gBox = new T.BoxGeometry(2, 2, 2), gChl = new T.SphereGeometry(1, 10, 7);
    var gCyl = new T.CylinderGeometry(1, 1, DZ, 18, 1, false); gCyl.rotateX(Math.PI / 2); gCyl.translate(0, 0, -DZ / 2);
    var gTube = new T.CylinderGeometry(1, 1, DZ, 18, 1, true); gTube.rotateX(Math.PI / 2); gTube.translate(0, 0, -DZ / 2);
    var M4 = new T.Matrix4(), Qn = new T.Quaternion(), E = new T.Euler(), V = new T.Vector3(), Vs = new T.Vector3(), V2 = new T.Vector3();
    function inst(geo, m, list, f, part) {
      var im = new T.InstancedMesh(geo, m, Math.max(1, list.length));
      list.forEach(function (c, i) { f(c, V, E, Vs); Qn.setFromEuler(E); M4.compose(V, Qn, Vs); im.setMatrixAt(i, M4); });
      im.count = list.length; im.instanceMatrix.needsUpdate = true; im.userData.part = part; im.frustumCulled = false; return im;
    }
    function mergeGeo(parts) { return MM && MM.merge ? MM.merge(T, parts) : gSph; }
    /* molecule and enzyme shapes (vertex coloured; the 3D stage always uses the dark set) */
    var DK = true, b1 = new T.SphereGeometry(1, 10, 8);
    function chainGeo(kind, n, extra) {
      var col = molHex(kind, DK), P = [], r = 0.062;
      for (var i = 0; i < n; i++) P.push({ geo: b1, color: col, pos: [(i - (n - 1) / 2) * r * 1.6, (i % 2 ? 0.5 : -0.5) * r * 1.1, 0], scale: r });
      if (extra) extra(P, r);
      return mergeGeo(P);
    }
    var MG = {
      co2: mergeGeo([{ geo: b1, color: window.WPMolColor ? WPMolColor.atom('co2', 'C', true) : '#8a9098', pos: [0, 0, 0], scale: 0.068 }, { geo: b1, color: window.WPMolColor ? WPMolColor.atom('co2', 'O', true) : '#d9dce0', pos: [0.115, 0, 0], scale: 0.06 }, { geo: b1, color: window.WPMolColor ? WPMolColor.atom('co2', 'O', true) : '#d9dce0', pos: [-0.115, 0, 0], scale: 0.06 }]),
      malate: chainGeo('malate', 4),
      malic: chainGeo('malic', 4, function (P, r) { P.push({ geo: b1, color: '#ffd84a', pos: [-2.9 * r, 0.9 * r, 0], scale: r * 0.5 }); P.push({ geo: b1, color: '#ffd84a', pos: [2.9 * r, -0.9 * r, 0], scale: r * 0.5 }); }),
      oaa: chainGeo('oaa', 4, function (P, r) { P.push({ geo: b1, color: molHex('oaa', DK), pos: [0.8 * r, 1.7 * r, 0], scale: r * 0.6 }); }),
      pep: chainGeo('pep', 3, function (P, r) { P.push({ geo: b1, color: '#c9c2e8', pos: [2.6 * r, 0.2 * r, 0], scale: r * 1.15 }); }),
      pyr: chainGeo('pyr', 3),
      sugar: (function () { var P = []; for (var i = 0; i < 6; i++) { var a = i * TAU / 6; P.push({ geo: b1, color: molHex('sugar', DK), pos: [Math.cos(a) * 0.1, Math.sin(a) * 0.1, 0], scale: 0.046 }); } return mergeGeo(P); })()
    };
    var gPepc = mergeGeo([[0, 0, 0], [0.05, 0.03, 0.01], [-0.045, 0.035, -0.01], [0.01, -0.05, 0.02]].map(function (p) { return { geo: b1, color: '#b9a7ff', pos: p, scale: 0.042 }; }));
    var gRub = mergeGeo([[-1, -1, -1], [1, -1, -1], [-1, 1, -1], [1, 1, -1], [-1, -1, 1], [1, -1, 1], [-1, 1, 1], [1, 1, 1]].map(function (p) { return { geo: b1, color: '#e8b04a', pos: [p[0] * 0.028, p[1] * 0.028, p[2] * 0.028], scale: 0.03 }; }));
    var mMol = mat(0xffffff, { vc: true, r: 0.4, noclip: true, em: 0x222222 });
    var molMesh = {};
    Object.keys(MG).forEach(function (k) { var im = new T.InstancedMesh(MG[k], mMol, 90); im.count = 0; im.frustumCulled = false; im.userData.part = k; im.renderOrder = 5; scene.add(im); molMesh[k] = im; });
    /* bursts: CO2 set free (decarboxylation) */
    var burstG = new T.TorusGeometry(0.11, 0.014, 6, 28), bursts = [];
    for (var bi = 0; bi < 8; bi++) { var bm = new T.Mesh(burstG, new T.MeshBasicMaterial({ color: 0xffe9a8, transparent: true, opacity: 0, depthWrite: false })); bm.visible = false; bm.userData = { part: 'release', life: 0 }; scene.add(bm); bursts.push(bm); }
    function burst(p) { for (var i = 0; i < bursts.length; i++) if (bursts[i].userData.life <= 0) { bursts[i].position.set(p[0], p[1], 0.01); bursts[i].userData.life = 1; bursts[i].visible = S.layers.release; return; } }

    /* ---- one leaf build ---- */
    var B = {};
    function makeType(id) {
      var L = layouts()[id], grp = new T.Group(), mats = {}, pick = [];
      grp.userData.id = id;
      function add(o) { grp.add(o); if (o.userData && o.userData.part) pick.push(o); return o; }
      var kinds = {};
      L.cells.forEach(function (c) { (kinds[c.k] = kinds[c.k] || []).push(c); });
      Object.keys(kinds).forEach(function (k) {
        var col = k === 'bs' ? (id === 'c4' ? CELLCOL.bs4 : CELLCOL.bs3) : CELLCOL[k];
        var m = mats[k] = mat(col, { r: k === 'epi' ? 0.45 : 0.62, em: k === 'bs' && id === 'c4' ? 0x0c2208 : 0 });
        add(inst(kinds[k][0].box ? gBox : gSph, m, kinds[k], function (c, v, e, s) { v.set(c.x, c.y, c.z); e.set(0, 0, c.rot || 0); s.set(c.rx * (c.box ? 0.96 : 1), c.ry * (c.box ? 0.94 : 1), c.rz * (c.box ? 0.96 : 1)); }, PART_OF[k]));
      });
      mats.chl = mat(0x1f6a1c, { r: 0.5, em: 0x0a2408 });
      add(inst(gChl, mats.chl, L.chl, function (q, v, e, s) { v.set(q.x, q.y, q.z); e.set(0, 0, q.a + Math.PI / 2); var big = q.cell.k === 'bs' && id === 'c4'; s.set(big ? 0.072 : 0.075, big ? 0.05 : 0.038, 0.06); }, 'chloroplast'));
      if (L.vac.length) {
        mats.vac = mat(0xcfd8f0, { op: 0.42, dw: false, r: 0.2 });
        var vm = add(inst(gSph, mats.vac, L.vac, function (q, v, e, s) { v.set(q.x, q.y, q.z); e.set(0, 0, 0); s.set(q.r, q.r, q.r * 0.95); }, 'vacuole')); vm.renderOrder = 2;
        mats.store = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.4, clippingPlanes: clip, emissive: lin(0x220812) });
        var sm = add(inst(MG.malic, mats.store, L.store, function (q, v, e, s) { v.set(q.x, q.y, q.z); e.set(q.rk * 3, q.rk * 5, q.rk * 7); s.set(1, 1, 1); }, 'malic'));
        sm.renderOrder = 3; B[id + 'store'] = sm;
      }
      /* veins */
      var cores = [], xy = [], ph = [];
      L.veins.forEach(function (v) { cores.push({ x: v.x, y: v.y, r: v.core * 1.22 }); v.xy.forEach(function (q) { xy.push(q); }); v.ph.forEach(function (q) { ph.push(q); }); });
      mats.core = mat(0xe0dabc, { r: 0.7 }); mats.xy = mat(0x8a5a2e, { r: 0.5 }); mats.ph = mat(0xbfd3a0, { r: 0.6 });
      add(inst(gCyl, mats.core, cores, function (q, v, e, s) { v.set(q.x, q.y, 0); e.set(0, 0, 0); s.set(q.r, q.r, 1); }, 'vein'));
      add(inst(gTube, mats.xy, xy, function (q, v, e, s) { v.set(q.x, q.y, 0.001); e.set(0, 0, 0); s.set(q.r, q.r, 1); }, 'vein'));
      add(inst(gCyl, mats.ph, ph, function (q, v, e, s) { v.set(q.x, q.y, 0.001); e.set(0, 0, 0); s.set(q.r, q.r, 1); }, 'vein'));
      /* cuticle */
      mats.cut = mat(0xe3cf7c, { r: 0.3, em: 0x1a1404 });
      [L.cuticle, L.cuticleLow].forEach(function (c) { if (!c) return; var m = add(new T.Mesh(gBox, mats.cut)); m.scale.set(W / 2, c.h / 2, DZ / 2); m.position.set(0, c.y + c.h / 2, -DZ / 2); m.userData.part = 'epidermis'; });
      /* stomata: two guard cells each; the front one is cut through */
      mats.guard = mat(CELLCOL.guard, { r: 0.5 });
      var guards = [];
      [L.stoma, L.stoma2].forEach(function (st) {
        [-1, 1].forEach(function (sd) { var g = add(new T.Mesh(gSph, mats.guard)); g.scale.set(0.13, 0.11, 0.3); g.userData = { part: 'stoma', st: st, sd: sd }; guards.push(g); });
      });
      function setStoma(open) {
        guards.forEach(function (g) { var st = g.userData.st, gap = 0.02 + 0.1 * open; g.position.set(st.x + g.userData.sd * (0.13 + gap / 2), st.y, st.z); });
      }
      setStoma(1);
      /* enzymes */
      mats.pepc = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.45, clippingPlanes: clip, emissive: lin(0x1a1030) });
      mats.rub = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.45, clippingPlanes: clip, emissive: lin(0x2a1a00) });
      [mats.pepc, mats.rub].forEach(function (m) { m.userData.em = m.emissive.clone(); m.userData.ei = 1; });
      var pe = L.pepc.length ? add(inst(gPepc, mats.pepc, L.pepc, function (q, v, e, s) { v.set(q.x, q.y, q.z); e.set(0.3, 0.6, 0); s.set(1.2, 1.2, 1.2); }, 'pepc')) : null;
      var ru = add(inst(gRub, mats.rub, L.rub, function (q, v, e, s) { v.set(q.x, q.y, q.z); e.set(0.5, 0.4, 0.2); s.set(1, 1, 1); }, 'rubisco'));
      if (pe) pe.renderOrder = 4; ru.renderOrder = 4;
      /* arrows along the first route of each segment kind */
      var arrows = [];
      function arrow(pts, kind, phaseTag) {
        if (!pts || pts.length < 2) return;
        var vs = pts.map(function (p) { return new T.Vector3(p[0], p[1], Math.max(p[2], -0.05) + 0.02); });
        var cv = vs.length > 2 ? new T.CatmullRomCurve3(vs, false, 'centripetal') : new T.LineCurve3(vs[0], vs[1]);
        var mm = new T.MeshBasicMaterial({ color: lin(kind === 'co2b' ? molHex('co2', true) : molHex(kind, true)), transparent: true, opacity: 0.42, depthWrite: false });
        var tube = new T.Mesh(new T.TubeGeometry(cv, Math.max(8, vs.length * 10), 0.014, 6, false), mm);
        var tip = new T.Mesh(new T.ConeGeometry(0.04, 0.11, 10), mm);
        var p1 = cv.getPointAt(1), t1 = cv.getTangentAt(1); tip.position.copy(p1); tip.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), t1.normalize());
        var g = new T.Group(); g.add(tube); g.add(tip); g.userData = { layer: LAYER_OF[kind], ph: phaseTag || null }; g.renderOrder = 6; grp.add(g); arrows.push(g);
      }
      var r0 = L.routes[0];
      if (id === 'c3') { arrow(r0.co2, 'co2'); arrow(r0.sugar, 'sugar'); }
      if (id === 'c4') { arrow(r0.co2, 'co2'); arrow(r0.oaa, 'oaa'); arrow(r0.malate, 'malate'); arrow(r0.co2b, 'co2b'); arrow(r0.sugar, 'sugar'); arrow(r0.pyr, 'pyr'); arrow(r0.pep, 'pep'); }
      if (id === 'cam') { arrow(r0.night.co2, 'co2', 'n'); arrow(r0.night.oaa, 'oaa', 'n'); arrow(r0.night.malate, 'malate', 'n'); arrow(r0.day.malic, 'malic', 'd'); arrow(r0.day.malate, 'malate', 'd'); arrow(r0.day.co2, 'co2b', 'd'); arrow(r0.day.sugar, 'sugar', 'd'); arrow(L.routes[1] ? L.routes[1].direct.co2 : r0.direct.co2, 'co2', 'x'); }
      /* CAM: light from above, fading with depth (1 % left at half the green layer, Nobel 1994) */
      var beams = [];
      if (id === 'cam') {
        var cvs = document.createElement('canvas'); cvs.width = 8; cvs.height = 256; var cx2 = cvs.getContext('2d');
        var yTop = 5.9, ySurf = 4.62, yGreen0 = 4.36, yGreen1 = 1.86, half = (yGreen0 - yGreen1) / 2, kk = Math.log(100) / half;
        for (var py = 0; py < 256; py++) { var y = yTop - (py / 255) * (yTop - yGreen1), a = y >= yGreen0 ? 0.5 : 0.62 * Math.exp(-kk * (yGreen0 - y)); cx2.clearRect(0, py, 8, 1); cx2.fillStyle = 'rgba(255,236,150,' + a.toFixed(3) + ')'; cx2.fillRect(0, py, 8, 1); }
        var tex = new T.CanvasTexture(cvs); tex.encoding = T.sRGBEncoding;
        [-2.9, 1.4, 3.4].forEach(function (bx) {
          var bmM = new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false, side: T.DoubleSide, toneMapped: false });
          var pl = new T.Mesh(new T.PlaneGeometry(0.42, yTop - yGreen1), bmM); pl.position.set(bx, (yTop + yGreen1) / 2, 0.03); pl.renderOrder = 9; pl.userData.noPick = true; grp.add(pl); beams.push(pl);
        });
        L.ySurf = ySurf;
      }
      grp.visible = false; scene.add(grp);
      B[id] = { L: L, grp: grp, mats: mats, pick: pick, arrows: arrows, setStoma: setStoma, pepc: pe, rub: ru, beams: beams, store: B[id + 'store'] || null, toks: [], acc: {} };
      return B[id];
    }

    /* ---- tokens: molecules that travel a list of segments ---- */
    function seg(kind, pts, o) {
      o = o || {};
      var vs = pts.map(function (p) { return new T.Vector3(p[0], p[1], p[2]); }), len = [0];
      for (var i = 1; i < vs.length; i++) len.push(len[i - 1] + vs[i].distanceTo(vs[i - 1]));
      var tot = len[len.length - 1] || 0.01;
      return { k: kind, v: vs, len: len, tot: tot, dur: o.dur || Math.max(0.45, tot / 0.85), burst: o.burst || null, end: o.end || null };
    }
    function spawn(b, segs) { if (b.toks.length > 70) return; b.toks.push({ s: segs, i: 0, t: 0, w: Math.random() * TAU, age: 0 }); }
    function posOf(tk, out) {
      var sg = tk.s[tk.i], d = ease(tk.t) * sg.tot, j = 1;
      while (j < sg.len.length - 1 && sg.len[j] < d) j++;
      var a = sg.len[j - 1], bb = sg.len[j], f = bb > a ? (d - a) / (bb - a) : 0;
      out.copy(sg.v[j - 1]).lerp(sg.v[j], f);
      var wob = Math.sin(tk.age * 5 + tk.w) * 0.02; out.x += wob; out.y += Math.cos(tk.age * 4 + tk.w) * 0.02;
      return out;
    }
    function pickR(L) { return L.routes[Math.floor(Math.random() * L.routes.length)]; }
    function spawnFor(b, dt) {
      var L = b.L, A = b.acc, r;
      function every(k, per, n) { A[k] = (A[k] || 0) + dt / per * (n == null ? 1 : n); var c = 0; while (A[k] >= 1) { A[k] -= 1; c++; } return c; }
      if (b === B.c3) {
        for (var i = every('c', 0.6); i > 0; i--) { r = pickR(L); var s3 = [seg('co2', r.co2)]; if (Math.random() < 0.34) s3.push(seg('sugar', r.sugar, { dur: 2.6 })); spawn(b, s3); }
      } else if (b === B.c4) {
        for (i = every('c', 0.5); i > 0; i--) {
          r = pickR(L);
          var s4 = [seg('co2', r.co2), seg('oaa', r.oaa, { dur: 0.5 }), seg('malate', r.malate, { end: (function (rr) { return function () { spawn(b, [seg('pyr', rr.pyr), seg('pep', rr.pep, { dur: 0.9 })]); }; })(r) }), seg('co2b', r.co2b, { dur: 0.7, burst: r.rel })];
          if (Math.random() < 0.34) s4.push(seg('sugar', r.sugar, { dur: 2.4 }));
          spawn(b, s4);
        }
      } else {
        var ph = phase(S.hour), ap = aperture(S.hour);
        if (ph.pepc) for (i = every('n', 0.5, ap); i > 0; i--) { r = pickR(L); spawn(b, [seg('co2', r.night.co2), seg('oaa', r.night.oaa, { dur: 0.5 }), seg('malate', r.night.malate)]); }
        if (ph.rel && S.acid > 0.04) for (i = every('d', 0.55); i > 0; i--) { r = pickR(L); var sd = [seg('malic', r.day.malic, { dur: 0.8 }), seg('malate', r.day.malate, { dur: 0.6 }), seg('co2b', r.day.co2, { dur: 0.7, burst: r.day.rel })]; if (Math.random() < 0.34) sd.push(seg('sugar', r.day.sugar, { dur: 2.8 })); spawn(b, sd); }
        if (ph.direct) for (i = every('x', 0.8, ap); i > 0; i--) { r = pickR(L); spawn(b, [seg('co2', r.direct.co2)]); }
      }
    }
    function stepToks(b, dt) {
      for (var i = b.toks.length - 1; i >= 0; i--) {
        var tk = b.toks[i]; tk.age += dt;
        var sg = tk.s[tk.i];
        if (tk.t === 0 && sg.burst && !tk.fired) { burst(sg.burst); tk.fired = true; }
        tk.t += dt / sg.dur;
        if (tk.t >= 1) { if (sg.end) sg.end(); tk.i++; tk.t = 0; tk.fired = false; if (tk.i >= tk.s.length) b.toks.splice(i, 1); }
      }
    }
    var lead = {};
    function drawToks(b) {
      var cnt = {}; Object.keys(molMesh).forEach(function (k) { cnt[k] = 0; lead[k] = null; });
      if (b && !S.trans) b.toks.forEach(function (tk) {
        var sg = tk.s[tk.i], k = sg.k === 'co2b' ? 'co2' : sg.k, lay = LAYER_OF[sg.k];
        if (!S.layers[lay]) return;
        var im = molMesh[k]; if (!im || cnt[k] >= 90) return;
        posOf(tk, V); E.set(tk.age * 1.3 + tk.w, tk.age * 0.9, tk.w); Qn.setFromEuler(E); Vs.set(1, 1, 1);
        M4.compose(V, Qn, Vs); im.setMatrixAt(cnt[k]++, M4);
        if (!lead[k] || tk.age > lead[k].age) lead[k] = { age: tk.age, p: V.clone() };
      });
      Object.keys(molMesh).forEach(function (k) { molMesh[k].count = cnt[k]; molMesh[k].instanceMatrix.needsUpdate = true; });
    }

    /* ---- names ---- */
    var tagHost = stage.querySelector('.c4-tags');
    var TAGS = {};
    function tagList(id) {
      var L = layouts()[id], st = L.stoma, out = [];
      function fc(k, f) { return nearest(L.cells, f[0], f[1], function (c) { return c.k === k && cellFront(c); }); }
      function at(x, y, z) { return [x, y, z == null ? 0 : z]; }
      out.push({ id: 'stoma', t: 'stoma', p: at(st.x, st.y + (st.top ? 0.2 : -0.12), 0.02), pr: 1 });
      out.push({ id: 'epidermis', t: id === 'cam' ? 'thick cuticle' : 'epidermis', p: at(-W / 2 + 1.2, L.cuticle.y + 0.1, -0.2), pr: 3 });
      var v0 = L.veins[id === 'c4' ? 2 : L.veins.length - 1];
      out.push({ id: 'vein', t: id === 'cam' ? 'small vein' : 'vein (xylem, phloem)', p: at(v0.x, v0.y, 0.02), pr: 2 });
      if (id === 'c3') {
        var pc = fc('pal', [-1.2, 2.4]); out.push({ id: 'palisade', t: 'palisade', p: at(pc.x, pc.y + 0.3, 0), pr: 2 });
        var sc = fc('spg', [-1.4, 0.9]); out.push({ id: 'spongy', t: 'spongy mesophyll', p: at(sc.x, sc.y, 0), pr: 2 });
        var bc = fc('bs', [2.35, 1.9]); out.push({ id: 'bs', t: 'bundle sheath, few chloroplasts', p: at(bc.x, bc.y + 0.1, 0), pr: 2 });
        out.push({ id: 'air', t: 'air space', p: at(L.cav.x + 0.05, L.cav.y - 0.05, -0.1), pr: 3 });
      } else if (id === 'c4') {
        var mc = fc('ms', [-1.12, 2.15]); out.push({ id: 'mesophyll', t: 'mesophyll ring', p: at(mc.x, mc.y + 0.12, 0), pr: 2 });
        var b4 = fc('bs', [1.12 - 0.35, 1.3]); out.push({ id: 'bs', t: 'bundle sheath', p: at(b4.x, b4.y + 0.12, 0), pr: 1 });
        out.push({ id: 'air', t: 'air space', p: at(L.cav.x, L.cav.y + 0.02, -0.1), pr: 3 });
      } else {
        var gc = fc('cg', [-1.6, 3.9]); out.push({ id: 'mesophyll', t: 'green CAM cell', p: at(gc.x, gc.y + 0.35, 0), pr: 2 });
        var vc = L.vac.filter(function (q) { return !q.pale; }); var vq = nearest(vc, -2.3, 3.1); out.push({ id: 'vacuole', t: 'vacuole', p: at(vq.x, vq.y, 0), pr: 1 });
        var so = fc('sto', [0.5, 0.6]); out.push({ id: 'storage', t: 'water storage', p: at(so.x, so.y, 0), pr: 2 });
      }
      if (L.spots.pepc) out.push({ id: 'pepc', t: 'PEPC', p: at(L.spots.pepc.x, L.spots.pepc.y + 0.06, 0.02), pr: 1, lay: 'pepc' });
      if (L.spots.rubisco) out.push({ id: 'rubisco', t: 'Rubisco', p: at(L.spots.rubisco.x, L.spots.rubisco.y + 0.06, 0.02), pr: 1, lay: 'rubisco' });
      out.forEach(function (g) { g.v = new T.Vector3(g.p[0], g.p[1], g.p[2]); g.el = document.createElement('span'); g.el.className = 'c4-tag'; g.el.textContent = g.t; g.el.hidden = true; tagHost.appendChild(g.el); });
      return out;
    }
    var molTags = {};
    Object.keys(MG).forEach(function (k) { var e = document.createElement('span'); e.className = 'c4-tag m'; e.textContent = NNAME[k]; e.hidden = true; tagHost.appendChild(e); molTags[k] = e; });
    var Wd = 1, Hd = 1, narrow = false;
    function drawTags() {
      var list = TAGS[S.type] || [], boxes = [], on = S.names && !S.trans;
      Object.keys(TAGS).forEach(function (id) { if (id !== S.type) TAGS[id].forEach(function (g) { g.el.hidden = true; }); });
      list.slice().sort(function (a, b) { return a.pr - b.pr; }).forEach(function (g) {
        var show = on && (!g.lay || S.layers[g.lay]) && (!narrow || g.pr <= 1 || g.id === 'vein');
        if (!show) { g.el.hidden = true; return; }
        V.copy(g.v).project(cam);
        var x = (V.x + 1) / 2 * Wd, y = (1 - V.y) / 2 * Hd;
        if (V.z > 1 || x < 4 || x > Wd - 4 || y < 20 || y > Hd - 4) { g.el.hidden = true; return; }
        g.el.hidden = false;
        var w = g.el.offsetWidth || 60, h = 20, bx = { x: clamp(x, w / 2 + 2, Wd - w / 2 - 2) - w / 2, y: y - h - 6, w: w, h: h };
        if (boxes.some(function (o) { return bx.x < o.x + o.w && bx.x + bx.w > o.x && bx.y < o.y + o.h && bx.y + bx.h > o.y; })) { g.el.hidden = true; return; }
        boxes.push(bx); g.el.style.left = (bx.x + w / 2).toFixed(1) + 'px'; g.el.style.top = y.toFixed(1) + 'px';
      });
      var mn = on && window.MolNames && window.MolNames.get() && !narrow;
      Object.keys(molTags).forEach(function (k) {
        var e = molTags[k], ld = lead[k];
        if (!mn || !ld || !molMesh[k].count) { e.hidden = true; return; }
        V.copy(ld.p); V.y -= 0.09; V.project(cam);
        var x = (V.x + 1) / 2 * Wd, y = (1 - V.y) / 2 * Hd + 22;
        if (V.z > 1 || x < 30 || x > Wd - 30 || y < 30 || y > Hd - 6) { e.hidden = true; return; }
        var w = e.offsetWidth || 50, bx = { x: x - w / 2, y: y - 20, w: w, h: 18 };
        if (boxes.some(function (o) { return bx.x < o.x + o.w && bx.x + bx.w > o.x && bx.y < o.y + o.h && bx.y + bx.h > o.y; })) { e.hidden = true; return; }
        boxes.push(bx); e.hidden = false; e.style.left = x.toFixed(1) + 'px'; e.style.top = y.toFixed(1) + 'px';
      });
    }

    /* ---- camera and orbit ---- */
    var target = new T.Vector3(0, 1.6, -0.9), tgtY = { c3: 1.55, c4: 1.25, cam: 2.6 };
    function autoCam() {
      var aspect = Wd / Hd, d = 12.2 * Math.max(1, 1.35 / aspect) * (S.type === 'cam' ? 1.12 : 1);
      cam.position.set(target.x + 0.24 * d, target.y + 0.22 * d, target.z + 0.95 * d); cam.lookAt(target);
    }
    var ctl = null;
    if (MM && MM.orbit) ctl = MM.orbit({ camera: cam, wrap: stage, w: Wd, h: Hd, invalidate: function () { kick(); } }, { surface: glh, shell: stage, bar: bar, camera: cam, reduced: reduced, minDist: 4, maxDist: 34, invalidate: function () { kick(); }, tagHost: stage });
    function resize() {
      var w = glh.clientWidth || 600, h = glh.clientHeight || 400;
      if (w === Wd && h === Hd) return;
      Wd = w; Hd = h; narrow = w < 560; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
      if (ctl && ctl.narrow) ctl.narrow(narrow); S.dirty = true;
    }

    /* ---- picking ---- */
    var ray = new T.Raycaster(), ndc = new T.Vector2();
    function pickAt(cx, cy) {
      var b = B[S.type]; if (!b || S.trans) return null;
      var r = glh.getBoundingClientRect();
      ndc.set((cx - r.left) / r.width * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, cam);
      var objs = b.pick.filter(function (o) { return o.visible !== false; }).concat(Object.keys(molMesh).map(function (k) { return molMesh[k]; }).filter(function (m) { return m.count > 0; }));
      var hits = ray.intersectObjects(objs, true);
      for (var i = 0; i < hits.length; i++) {
        var h = hits[i], o = h.object;
        while (o && !(o.userData && o.userData.part) && o.parent) o = o.parent;
        if (h.point.z > 0.012) continue;
        var part = o && o.userData ? o.userData.part : null;
        if (part === 'pepc' && !S.layers.pepc) continue;
        if (part === 'rubisco' && !S.layers.rubisco) continue;
        if (part === 'malic' && !S.layers.malate) continue;
        if (part) return { part: part };
      }
      return null;
    }

    /* ---- show the chosen build, layers, highlight ---- */
    function ensure(id) { return B[id] || makeType(id); }
    function setType(id, instant) {
      var from = S.shown && S.shown !== id ? S.shown : null, b = ensure(id);
      if (TAGS[id] == null) TAGS[id] = tagList(id);
      b.grp.visible = true;
      if (!from || instant || reduced()) {
        Object.keys(B).forEach(function (k) { if (B[k] && B[k].grp && k !== id) B[k].grp.visible = false; });
        b.grp.scale.y = 1; S.trans = null; target.y = tgtY[id];
      } else {
        B[from].toks.length = 0;
        S.trans = { from: from, to: id, t0: performance.now(), y0: target.y };
        b.grp.scale.y = 0.001;
      }
      S.shown = id; applyLayers(); highlight(S.hl); kick();
    }
    function applyLayers() {
      var b = B[S.type]; if (!b) return;
      var ph = phase(S.hour);
      b.arrows.forEach(function (a) {
        var on = !!S.layers[a.userData.layer];
        if (S.type === 'cam' && a.userData.ph) on = on && (a.userData.ph === 'n' ? ph.pepc : a.userData.ph === 'd' ? ph.rel : !!ph.direct);
        a.visible = on;
      });
      if (b.pepc) b.pepc.visible = S.layers.pepc;
      if (b.rub) b.rub.visible = S.layers.rubisco;
      if (b.store) b.store.visible = S.layers.malate;
      bursts.forEach(function (m) { if (!S.layers.release) m.visible = false; });
      S.dirty = true;
    }
    var hlOld = [];
    function highlight(id) {
      hlOld.forEach(function (m) { m.emissive.copy(m.userData.em); m.emissiveIntensity = m.userData.ei; }); hlOld = [];
      var b = B[S.type]; if (!b || !id) { S.dirty = true; return; }
      var map = { stoma: ['guard'], epidermis: ['epi', 'cut'], palisade: ['pal'], spongy: ['spg'], mesophyll: ['ms', 'cg'], bs: ['bs'], vein: ['core', 'xy', 'ph'], storage: ['sto'], chloroplast: ['chl'], vacuole: ['vac'], pepc: ['pepc'], rubisco: ['rub'], malic: ['store'] };
      (map[id] || []).forEach(function (k) { var m = b.mats[k]; if (!m) return; hlOld.push(m); m.emissive.set(0xffc457).convertSRGBToLinear(); m.emissiveIntensity = 0.45; });
      S.dirty = true;
    }

    /* ---- loop ---- */
    var running = false, raf = 0, visible = true, lastT = 0;
    function kick() { S.dirty = true; if (!running && visible && !document.hidden) { running = true; lastT = 0; raf = requestAnimationFrame(loop); } }
    function loop(ts) {
      raf = 0;
      if (!visible || document.hidden) { running = false; return; }
      var dt = lastT ? Math.min(0.05, (ts - lastT) / 1000) : 0; lastT = ts;
      resize();
      var moving = ctl && ctl.moving && ctl.moving();
      if (!S.frozen) advance(dt * (window.PlaySpeed ? window.PlaySpeed.get() : 1));
      var tr = !!S.trans;
      if (tr) transition();
      if (!S.frozen || moving || S.dirty || tr) { render(); S.dirty = false; }
      if (!S.frozen || moving || tr) raf = requestAnimationFrame(loop); else running = false;
    }
    function transition() {
      var k = (performance.now() - S.trans.t0) / 850, e = ease(k), a = B[S.trans.from], b = B[S.trans.to];
      if (a) a.grp.scale.y = Math.max(0.001, 1 - ease(k * 1.6));
      b.grp.scale.y = Math.max(0.001, ease((k - 0.25) / 0.75));
      target.y = lerp(S.trans.y0, tgtY[S.trans.to], e);
      if (k >= 1) { if (a) a.grp.visible = false; b.grp.scale.y = 1; S.trans = null; S.dirty = true; if (S.afterTrans) S.afterTrans(); }
    }
    function advance(dtm) {
      if (!(dtm > 0)) return;
      S.tm += dtm;
      if (S.type === 'cam' && S.clockRun) { S.hour = (S.hour + dtm * 0.4) % 24; camTick(dtm * 0.4); }
      var b = B[S.type]; if (!b || S.trans) return;
      spawnFor(b, dtm); stepToks(b, dtm);
      bursts.forEach(function (m) { var u = m.userData; if (u.life > 0) { u.life -= dtm / 0.8; var s = 1 + (1 - u.life) * 1.6; m.scale.set(s, s, s); m.material.opacity = Math.max(0, u.life) * 0.9; m.visible = S.layers.release && u.life > 0; } });
    }
    var lastPh = null;
    function render() {
      autoCam(); if (ctl) ctl.apply();
      var b = B[S.type];
      if (S.type === 'cam' && b) {
        var sun = sunAt(S.hour), ap = aperture(S.hour);
        b.setStoma(ap);
        key.intensity = 0.25 + 0.75 * sun; hemi.intensity = 0.38 + 0.25 * sun;
        hemi.color.setRGB(lerp(0.55, 0.92, sun), lerp(0.62, 0.96, sun), 1);
        b.beams.forEach(function (p) { p.visible = sun > 0.02; p.material.opacity = sun; });
        if (b.store) b.store.count = Math.round(clamp(S.acid, 0, 1) * b.L.store.length);
        if (b.mats.vac) b.mats.vac.color.copy(lin(0xcfd8f0)).lerp(lin(0xf2a6cf), clamp(S.acid, 0, 1) * 0.7);
        stage.classList.toggle('night', sun < 0.5);
        var ph = phase(S.hour).id; if (ph !== lastPh) { lastPh = ph; applyLayers(); }
      } else {
        key.intensity = 0.95; hemi.intensity = 0.6; hemi.color.setRGB(0.92, 0.96, 1); stage.classList.remove('night');
        if (b) b.setStoma(1);
      }
      drawToks(S.trans ? null : b);
      renderer.render(scene, cam);
      drawTags();
      if (S.after) S.after();
    }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) kick(); }, { rootMargin: '60px' }).observe(stage);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) kick(); });
    resize();
    function partXY(id) { var g = (TAGS[S.type] || []).filter(function (t) { return t.id === id; })[0]; if (!g) return null; V.copy(g.v).project(cam); return { x: (V.x + 1) / 2 * Wd, y: (1 - V.y) / 2 * Hd, w: Wd, h: Hd }; }
    function prewarm(sec) { var b = B[S.type]; if (!b) return; for (var t = 0; t < sec; t += 0.05) { spawnFor(b, 0.05); stepToks(b, 0.05); } }
    return { kick: kick, setType: setType, applyLayers: applyLayers, highlight: highlight, pickAt: pickAt, advance: advance, render: render, surface: glh, renderer: renderer, partXY: partXY, prewarm: prewarm, ctl: ctl,
      count: function () { var b = B[S.type]; return { toks: b ? b.toks.length : 0, mol: Object.keys(molMesh).reduce(function (o, k) { o[k] = molMesh[k].count; return o; }, {}) }; } };
  }

  function camTick(dh) {
    var ph = phase(S.hour);
    if (ph.pepc) S.acid = Math.min(1, S.acid + dh / 11 * aperture(S.hour));
    else if (ph.rel) S.acid = Math.max(0, S.acid - dh / 8);
  }

  /* ------------------------------------------------------------ static 2D fallback: the same front face, as SVG */
  function svgLeaf(id) {
    var L = layouts()[id], dk = true, sc = 62, x0 = -W / 2 - 0.25, yT = (id === 'cam' ? 5.75 : L.top + 0.45), yB = id === 'cam' ? -0.1 : -0.95;
    var vw = (W + 0.5) * sc, vh = (yT - yB) * sc;
    function X(x) { return ((x - x0) * sc).toFixed(1); } function Y(y) { return ((yT - y) * sc).toFixed(1); }
    var o = ['<svg class="c4-svg" viewBox="0 0 ' + vw.toFixed(0) + ' ' + vh.toFixed(0) + '" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Flat drawing of the ' + TYPES[id].name + ' leaf front face">'];
    function hex(n) { return '#' + ('000000' + n.toString(16)).slice(-6); }
    function ell(c, fill, part, sw) { return '<ellipse data-part="' + part + '" cx="' + X(c.x) + '" cy="' + Y(c.y) + '" rx="' + (c.rx * sc).toFixed(1) + '" ry="' + (c.ry * sc).toFixed(1) + '" transform="rotate(' + (-(c.rot || 0) * 180 / Math.PI).toFixed(1) + ' ' + X(c.x) + ' ' + Y(c.y) + ')" fill="' + fill + '" stroke="#0d1610" stroke-width="' + (sw || 1.2) + '"/>'; }
    if (L.cuticle) o.push('<rect data-part="epidermis" x="' + X(-W / 2) + '" y="' + Y(L.cuticle.y + L.cuticle.h) + '" width="' + (W * sc).toFixed(1) + '" height="' + Math.max(3, L.cuticle.h * sc).toFixed(1) + '" fill="#e3cf7c"/>');
    L.cells.filter(cellFront).forEach(function (c) {
      var col = c.k === 'bs' ? (id === 'c4' ? CELLCOL.bs4 : CELLCOL.bs3) : CELLCOL[c.k];
      if (c.box) o.push('<rect data-part="epidermis" x="' + X(c.x - c.rx * 0.96) + '" y="' + Y(c.y + c.ry * 0.94) + '" width="' + (c.rx * 1.92 * sc).toFixed(1) + '" height="' + (c.ry * 1.88 * sc).toFixed(1) + '" rx="4" fill="' + hex(col) + '" stroke="#0d1610" stroke-width="1"/>');
      else o.push(ell(c, hex(col), PART_OF[c.k]));
    });
    L.vac.forEach(function (v) { var a = clamp(S.acid, 0, 1) * (v.pale ? 0 : 0.7); o.push('<circle data-part="vacuole" cx="' + X(v.x) + '" cy="' + Y(v.y) + '" r="' + (v.r * sc).toFixed(1) + '" fill="' + (a > 0.05 ? 'rgb(' + Math.round(lerp(207, 242, a)) + ',' + Math.round(lerp(216, 166, a)) + ',' + Math.round(lerp(240, 207, a)) + ')' : '#cfd8f0') + '" fill-opacity=".8"/>'); });
    if (id === 'cam' && S.layers.malate) L.store.slice(0, Math.round(clamp(S.acid, 0, 1) * L.store.length)).forEach(function (q) { o.push('<g data-part="malic" transform="translate(' + X(q.x) + ' ' + Y(q.y) + ')">' + glyphInline('malic', dk) + '</g>'); });
    L.chl.forEach(function (q) { o.push('<ellipse data-part="chloroplast" cx="' + X(q.x) + '" cy="' + Y(q.y) + '" rx="4.6" ry="2.4" transform="rotate(' + (-(q.a + Math.PI / 2) * 180 / Math.PI).toFixed(1) + ' ' + X(q.x) + ' ' + Y(q.y) + ')" fill="#2c7a27"/>'); });
    L.veins.forEach(function (v) {
      o.push('<circle data-part="vein" cx="' + X(v.x) + '" cy="' + Y(v.y) + '" r="' + (v.core * 1.22 * sc).toFixed(1) + '" fill="#e0dabc" stroke="#0d1610"/>');
      v.xy.forEach(function (q) { o.push('<circle data-part="vein" cx="' + X(q.x) + '" cy="' + Y(q.y) + '" r="' + (q.r * sc).toFixed(1) + '" fill="#2a2018" stroke="#8a5a2e" stroke-width="2.4"/>'); });
      v.ph.forEach(function (q) { o.push('<circle data-part="vein" cx="' + X(q.x) + '" cy="' + Y(q.y) + '" r="' + (q.r * sc).toFixed(1) + '" fill="#bfd3a0"/>'); });
    });
    var st = L.stoma, ap = id === 'cam' ? aperture(S.hour) : 1, gap = 0.02 + 0.1 * ap;
    [-1, 1].forEach(function (sd) { o.push(ell({ x: st.x + sd * (0.13 + gap / 2), y: st.y, rx: 0.13, ry: 0.11 }, '#6aa84c', 'stoma')); });
    function route(pts, kind) {
      if (!pts || !S.layers[LAYER_OF[kind]]) return;
      var col = kind === 'co2b' ? molHex('co2', dk) : molHex(kind, dk);
      o.push('<polyline points="' + pts.map(function (p) { return X(p[0]) + ',' + Y(p[1]); }).join(' ') + '" fill="none" stroke="' + col + '" stroke-width="2.6" stroke-opacity=".8" stroke-linejoin="round" marker-end="url(#c4ah-' + kind + ')"/>');
      var m = pts[Math.floor(pts.length / 2)], k2 = kind === 'co2b' ? 'co2' : kind;
      o.push('<g data-part="' + k2 + '" transform="translate(' + X(m[0]) + ' ' + Y(m[1]) + ')">' + glyphInline(k2, dk) + '</g>');
    }
    var defs = '<defs>' + ['co2', 'co2b', 'malate', 'malic', 'oaa', 'pep', 'pyr', 'sugar'].map(function (k) { return '<marker id="c4ah-' + k + '" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" fill="' + (k === 'co2b' ? molHex('co2', dk) : molHex(k, dk)) + '"/></marker>'; }).join('') + '</defs>';
    o.splice(1, 0, defs);
    var r0 = L.routes[0];
    if (id === 'c3') { route(r0.co2, 'co2'); route(r0.sugar, 'sugar'); }
    else if (id === 'c4') { route(r0.co2, 'co2'); route(r0.oaa, 'oaa'); route(r0.malate, 'malate'); route(r0.co2b, 'co2b'); route(r0.sugar, 'sugar'); route(r0.pyr, 'pyr'); route(r0.pep, 'pep'); }
    else { var ph = phase(S.hour); if (ph.pepc) { route(r0.night.co2, 'co2'); route(r0.night.oaa, 'oaa'); route(r0.night.malate, 'malate'); } if (ph.rel) { route(r0.day.malic, 'malic'); route(r0.day.malate, 'malate'); route(r0.day.co2, 'co2b'); route(r0.day.sugar, 'sugar'); } if (ph.direct) route(r0.direct.co2, 'co2'); }
    if (S.layers.pepc) L.pepc.forEach(function (q) { o.push('<circle data-part="pepc" cx="' + X(q.x) + '" cy="' + Y(q.y) + '" r="6" fill="#b9a7ff" stroke="#1b1630"/>'); });
    if (S.layers.rubisco) L.rub.forEach(function (q) { o.push('<rect data-part="rubisco" x="' + (+X(q.x) - 5) + '" y="' + (+Y(q.y) - 5) + '" width="10" height="10" rx="2" fill="#e8b04a" stroke="#2a1a00"/>'); });
    if (S.layers.release) { var rl = id === 'c4' ? r0.rel : (id === 'cam' && phase(S.hour).rel ? r0.day.rel : null); if (rl) o.push('<circle data-part="release" cx="' + X(rl[0]) + '" cy="' + Y(rl[1]) + '" r="9" fill="none" stroke="#ffe9a8" stroke-width="2"/>'); }
    o.push('</svg>');
    return o.join('');
  }
  function glyphInline(kind, dk) {
    var c = function (k) { return molHex(k, dk); }, s = 'stroke="#0d1610" stroke-width=".6"';
    if (kind === 'co2') return '<circle cx="-5" r="2.8" fill="#d9dce0" ' + s + '/><circle cx="5" r="2.8" fill="#d9dce0" ' + s + '/><circle r="3.3" fill="#8a9098" ' + s + '/>';
    if (kind === 'sugar') { var g = ''; for (var i = 0; i < 6; i++) { var a = i * TAU / 6; g += '<circle cx="' + (5 * Math.cos(a)).toFixed(1) + '" cy="' + (5 * Math.sin(a)).toFixed(1) + '" r="2" fill="' + c('sugar') + '" ' + s + '/>'; } return g; }
    var n = kind === 'pep' || kind === 'pyr' ? 3 : 4, h = '';
    for (var j = 0; j < n; j++) h += '<circle cx="' + ((j - (n - 1) / 2) * 5).toFixed(1) + '" cy="' + (j % 2 ? 1.6 : -1.6) + '" r="2.7" fill="' + c(kind) + '" ' + s + '/>';
    if (kind === 'malic') h += '<circle cx="-9" cy="-3" r="1.5" fill="#ffd84a"/><circle cx="9" cy="3" r="1.5" fill="#ffd84a"/>';
    if (kind === 'pep') h += '<circle cx="9" cy="0" r="3" fill="#c9c2e8" ' + s + '/>';
    return h;
  }

  /* ------------------------------------------------------------ linked panes: readout, route map, numbers */
  function readout() {
    var t = S.type, rows;
    if (t === 'c3') rows = [
      ['First catches the carbon', 'Rubisco, in the mesophyll chloroplasts'],
      ['First product', 'a three carbon acid (3 phosphoglycerate)'],
      ['What raises CO₂ at Rubisco', 'nothing: CO₂ arrives by diffusion only'],
      ['Stomata open', 'by day'],
      ['CO₂ compensation point', '40 µL per L (ppm) or more ' + badge('MEASURED') + ' ' + ev('c4.gamma', 'Krenzer 1975')],
      ['Mesophyll cells between veins', 'about 7 in rice, a C3 grass ' + ev('c4.ms7', 'Ermakova 2020')],
      ['Examples', 'rice, grapevine']];
    else if (t === 'c4') rows = [
      ['First catches the carbon', 'PEP carboxylase, in the mesophyll cytosol, as bicarbonate ' + ev('c4.ca', 'CA')],
      ['First product', 'four carbon acids: in sugarcane more than 93 % of the label after about 1 s ' + badge('MEASURED') + ' ' + ev('c4.hatch', 'Hatch 1966')],
      ['What raises CO₂ at Rubisco', 'malate carries carbon into the bundle sheath: CO₂ up to about 10 times air ' + badge('SECONDARY') + ' ' + ev('c4.pump10', 'Furbank 2011')],
      ['Stomata open', 'by day'],
      ['CO₂ compensation point', '10 µL per L (ppm) or less ' + badge('MEASURED') + ' ' + ev('c4.gamma', 'Krenzer 1975')],
      ['Mesophyll cells between sheaths', 'at most 2 to 3 ' + ev('c4.ms7', 'Ermakova 2020') + '; vein length per area about 2.1 times C3 grasses ' + badge('MEASURED') + ' ' + ev('c4.vein', 'Ueno 2006')],
      ['Examples', 'maize, sugarcane, sorghum, millets']];
    else rows = [
      ['First catches the carbon', 'PEP carboxylase, at night, in the same green cells'],
      ['Stored as', 'malic acid in the vacuole ' + ev('cam.path', 'Silvera 2014')],
      ['What raises CO₂ at Rubisco', 'by day the acid releases CO₂ inside the closed leaf'],
      ['Stomata open', 'mostly at night; also early morning (phase II) and late afternoon (phase IV) ' + ev('cam.phase4', 'Phase IV')],
      ['Green layer', 'about 4 mm in prickly pear; 99 % of blue and red light gone in the outer 2 mm ' + badge('MEASURED') + ' ' + ev('cam.opuntia', 'Nobel 1994')],
      ['Examples', 'pineapple, agave, prickly pear']];
    var live = t === 'cam' ? '<p class="c4-live" id="c4-live"></p>' : '';
    return '<table class="c4-ro"><caption>' + TYPES[t].name + ' at a glance</caption>' + rows.map(function (r) { return '<tr><th scope="row">' + r[0] + '</th><td>' + r[1] + '</td></tr>'; }).join('') + '</table>' + live;
  }
  function syncLive() {
    var e = EL && EL.root.querySelector('#c4-live'); if (!e) return;
    var ph = phase(S.hour), ap = aperture(S.hour), k = hh(S.hour) + '|' + Math.round(ap * 10) + '|' + Math.round(S.acid * 20);
    if (e._k === k) return; e._k = k;
    e.innerHTML = '<span>Clock <b>' + hh(S.hour) + '</b></span><span>' + ph.name + '</span><span>Stomata <b>' + (ap > 0.7 ? 'open' : ap > 0.15 ? 'partly open' : 'shut') + '</b></span><span>Acid stored <b>' + Math.round(S.acid * 100) + ' %</b> of tonight\'s fill ' + badge('ILLUSTRATIVE') + '</span>';
  }
  function mapSVG() {
    var t = S.type, dk = dark(), ink = dk ? '#ece6da' : '#2a231c', box = dk ? '#1d2329' : '#faf6ec', rule = dk ? '#3b4855' : '#8a7a62';
    var N = [], Ed = [], ph = phase(S.hour);
    function n(id, x, y, w, t1, t2, part, lane) { N.push({ id: id, x: x, y: y, w: w, t1: t1, t2: t2, part: part, lane: lane }); }
    function e(a, b, kind, lane, bend) { Ed.push({ a: a, b: b, k: kind, lane: lane, bend: bend || 0 }); }
    if (t === 'c3') {
      n('air', 6, 30, 96, 'Air', 'outside the leaf', 'air'); n('st', 132, 30, 100, 'Stoma', 'open by day', 'stoma'); n('as', 262, 30, 104, 'Air space', 'inside the leaf', 'air');
      n('ch', 400, 30, 140, 'Chloroplast', 'Rubisco fixes CO₂', 'rubisco'); n('vn', 400, 150, 140, 'Vein', 'sugar leaves', 'vein');
      e('air', 'st', 'co2'); e('st', 'as', 'co2'); e('as', 'ch', 'co2'); e('ch', 'vn', 'sugar');
    } else if (t === 'c4') {
      n('air', 6, 20, 80, 'Air', 'outside', 'air'); n('st', 116, 20, 88, 'Stoma', 'open by day', 'stoma'); n('ms', 234, 20, 120, 'Mesophyll', 'PEPC catches it', 'pepc');
      n('bs', 404, 20, 150, 'Bundle sheath', 'CO₂ set free, Rubisco', 'bs'); n('vn', 404, 150, 150, 'Vein', 'sugar leaves', 'vein'); n('mc', 234, 150, 120, 'Mesophyll', 'PEP remade', 'chloroplast');
      e('air', 'st', 'co2'); e('st', 'ms', 'co2'); e('ms', 'bs', 'malate'); e('bs', 'vn', 'sugar'); e('bs', 'mc', 'pyr'); e('mc', 'ms', 'pep');
    } else {
      n('air', 6, 20, 80, 'Air', 'night', 'air', 'n'); n('st', 114, 20, 92, 'Stoma', ph.open > 0.15 ? 'open' : 'shut', 'stoma', 'n'); n('pc', 236, 20, 112, 'PEPC', 'catches CO₂', 'pepc', 'n'); n('va', 404, 20, 150, 'Vacuole', 'malic acid stored', 'vacuole');
      n('rl', 236, 150, 112, 'CO₂ set free', 'by day', 'release', 'd'); n('ru', 404, 150, 150, 'Rubisco', 'Calvin cycle', 'rubisco', 'd'); n('vn', 6, 150, 96, 'Vein', 'sugar leaves', 'vein', 'd');
      e('air', 'st', 'co2', 'n'); e('st', 'pc', 'co2', 'n'); e('pc', 'va', 'malate', 'n'); e('va', 'rl', 'malic', 'd'); e('rl', 'ru', 'co2b', 'd'); e('ru', 'vn', 'sugar', 'd', 1);
      if (ph.direct) e('st', 'ru', 'co2', 'x', 1);
    }
    var lit = function (lane) { if (t !== 'cam' || !lane) return true; return lane === 'n' ? ph.pepc : lane === 'd' ? ph.rel : !!ph.direct; };
    var byId = {}; N.forEach(function (q) { byId[q.id] = q; });
    var h = 54, out = ['<svg class="c4-fig" viewBox="0 0 560 220" role="img" aria-label="Route map for the ' + TYPES[t].name + ' leaf">'];
    out.push('<defs>' + ['co2', 'co2b', 'malate', 'malic', 'oaa', 'pep', 'pyr', 'sugar'].map(function (k) { return '<marker id="c4mh-' + k + '" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="' + (k === 'co2b' ? molHex('co2', dk) : molHex(k, dk)) + '"/></marker>'; }).join('') + '</defs>');
    if (t === 'cam') { out.push('<text x="552" y="14" text-anchor="end" class="mut" font-size="11">' + (ph.pepc ? 'now: night lane' : ph.rel ? 'now: day lane' : 'now: stomata open by day') + '</text>'); }
    Ed.forEach(function (q) {
      var a = byId[q.a], b = byId[q.b], on = S.layers[LAYER_OF[q.k]] && lit(q.lane), col = q.k === 'co2b' ? molHex('co2', dk) : molHex(q.k, dk);
      var ax = a.x + a.w / 2, ay = a.y + h / 2, bx = b.x + b.w / 2, by = b.y + h / 2, x1, y1, x2, y2;
      if (Math.abs(ay - by) < 5) { x1 = ax < bx ? a.x + a.w : a.x; x2 = ax < bx ? b.x : b.x + b.w; y1 = y2 = ay; }
      else if (Math.abs(ax - bx) < 5) { x1 = x2 = ax; y1 = ay < by ? a.y + h : a.y; y2 = ay < by ? b.y : b.y + h; }
      else { x1 = ax < bx ? a.x + a.w : a.x; y1 = ay; x2 = bx; y2 = ay < by ? b.y : b.y + h; }
      var d = q.bend ? 'M' + x1 + ' ' + y1 + ' C ' + (x1 + (x2 - x1) * 0.2) + ' ' + (y1 + (y2 - y1) * 0.9) + ' ' + (x2 - (x2 - x1) * 0.2) + ' ' + y2 + ' ' + x2 + ' ' + y2 : 'M' + x1 + ' ' + y1 + ' L ' + x2 + ' ' + y2;
      out.push('<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="' + (on ? 3.2 : 1.6) + '" ' + (on ? '' : 'stroke-dasharray="4 4" stroke-opacity=".45" ') + 'marker-end="url(#c4mh-' + q.k + ')"/>');
      var mx = (x1 + x2) / 2, my = (y1 + y2) / 2 + (q.bend ? 18 : 0), nm = NNAME[q.k === 'co2b' ? 'co2' : q.k];
      out.push('<text x="' + mx + '" y="' + (my - 6) + '" text-anchor="middle" font-size="11.5" ' + (on ? 'font-weight="600"' : 'class="mut" opacity=".6"') + '>' + nm + '</text>');
    });
    N.forEach(function (q) {
      var on = lit(q.lane), hl = S.hl && S.hl === q.part;
      out.push('<g data-part="' + q.part + '" tabindex="0" role="button" aria-label="' + esc(q.t1 + ', ' + q.t2) + '"' + (on ? '' : ' opacity=".5"') + '><rect x="' + q.x + '" y="' + q.y + '" width="' + q.w + '" height="' + h + '" rx="8" fill="' + box + '" stroke="' + (hl ? '#d49a1c' : rule) + '" stroke-width="' + (hl ? 2.6 : 1.3) + '"/>' +
        '<text x="' + (q.x + q.w / 2) + '" y="' + (q.y + 22) + '" text-anchor="middle" font-size="14" font-weight="600" fill="' + ink + '">' + esc(q.t1) + '</text><text x="' + (q.x + q.w / 2) + '" y="' + (q.y + 40) + '" text-anchor="middle" font-size="11.5" class="mut">' + esc(q.t2) + '</text></g>');
    });
    out.push('</svg>');
    return out.join('');
  }
  function numSVG() {
    var t = S.type, dk = dark(), acc = dk ? '#c9a56a' : '#2b5fa4', mut = dk ? '#3b4855' : '#c4b597', ink = dk ? '#ece6da' : '#2a231c';
    var o = ['<svg class="c4-fig" viewBox="0 0 360 250" role="img" aria-label="Numbers for the ' + TYPES[t].name + ' leaf">'];
    var x0 = 20, x1 = 340, X = function (v) { return x0 + v / 60 * (x1 - x0); };
    o.push('<text x="20" y="18" font-size="12.5" font-weight="600">CO₂ compensation point, ppm</text>');
    [[0, 10, 'C4', 'c4'], [10, 40, 'in between', 'mid'], [40, 60, 'C3, 40 or more', 'c3']].forEach(function (b) {
      var on = b[3] === t; o.push('<rect x="' + X(b[0]) + '" y="28" width="' + (X(b[1]) - X(b[0]) - 1) + '" height="22" fill="' + (on ? acc : mut) + '" opacity="' + (on ? 1 : 0.55) + '"/>');
      o.push('<text x="' + ((X(b[0]) + X(b[1])) / 2) + '" y="43" text-anchor="middle" font-size="11" fill="' + (on ? (dk ? '#1b150c' : '#fff') : ink) + '">' + b[2] + '</text>');
    });
    [0, 10, 20, 30, 40, 50, 60].forEach(function (v) { o.push('<text x="' + X(v) + '" y="64" text-anchor="middle" font-size="10" class="mut">' + v + '</text>'); });
    o.push('<path d="M' + X(26) + ' 24 v30" stroke="' + ink + '" stroke-width="1.5"/><text x="' + X(26) + '" y="78" text-anchor="middle" font-size="10.5" class="mut">Moricandia about 26</text>');
    o.push('<text x="20" y="96" font-size="10.5" class="mut">' + (t === 'cam' ? 'CAM is not part of this survey.' : 'Krenzer 1975; intermediates 10 to 40, Schlüter 2023') + '</text>');
    if (t === 'c4') {
      o.push('<text x="20" y="124" font-size="12.5" font-weight="600">CO₂ around Rubisco, times air</text>');
      var Y = function (v) { return 230 - v * 9; };
      o.push('<rect x="70" y="' + Y(1) + '" width="60" height="' + (230 - Y(1)) + '" fill="' + mut + '"/><text x="100" y="246" text-anchor="middle" font-size="11">air, 1</text>');
      o.push('<rect x="200" y="' + Y(10) + '" width="60" height="' + (230 - Y(10)) + '" fill="' + acc + '" opacity=".85"/><text x="230" y="246" text-anchor="middle" font-size="11">bundle sheath</text><text x="270" y="' + (Y(10) + 12) + '" font-size="11">up to</text><text x="270" y="' + (Y(10) + 26) + '" font-size="11">about 10</text>');
    } else if (t === 'c3') {
      o.push('<text x="20" y="124" font-size="12.5" font-weight="600">Mesophyll cells between veins</text>');
      [['rice (C3)', 7, 150], ['C4 grasses, at most', 3, 205]].forEach(function (r) {
        o.push('<text x="20" y="' + (r[2] + 4) + '" font-size="11">' + r[0] + '</text>');
        for (var i = 0; i < r[1]; i++) o.push('<circle cx="' + (150 + i * 26) + '" cy="' + r[2] + '" r="11" fill="' + (r[1] === 7 ? acc : mut) + '" opacity="' + (i >= 2 && r[1] === 3 ? 0.45 : 0.9) + '"/>');
      });
      o.push('<text x="150" y="234" font-size="10.5" class="mut">2 to 3 in C4 leaves (Ermakova 2020)</text>');
    } else {
      o.push('<text x="20" y="124" font-size="12.5" font-weight="600">Acid stored in the vacuoles</text>');
      o.push('<rect x="20" y="134" width="150" height="16" rx="3" fill="none" stroke="' + mut + '"/><rect id="c4-acidbar" x="21" y="135" width="' + (148 * clamp(S.acid, 0, 1)).toFixed(1) + '" height="14" rx="2" fill="' + molHex('malic', dk) + '"/>');
      o.push('<text x="20" y="166" font-size="10.5" class="mut">more acid, lower pH; Clusia rosea</text><text x="20" y="179" font-size="10.5" class="mut">reached pH 2.85 at dawn</text>');
      o.push('<text x="205" y="124" font-size="12.5" font-weight="600">Light left</text>');
      var k = Math.log(100) / 2;
      for (var d = 0; d < 40; d++) { var dep = d / 10, a = Math.exp(-k * dep); o.push('<rect x="205" y="' + (134 + d * 2.5) + '" width="40" height="2.6" fill="rgb(255,' + Math.round(200 + 44 * a) + ',' + Math.round(80 + 120 * a) + ')" opacity="' + (0.12 + 0.88 * a).toFixed(2) + '"/>'); }
      o.push('<rect x="205" y="134" width="40" height="100" fill="none" stroke="' + mut + '"/>');
      [[0, 'surface'], [2, '2 mm: 1 % left'], [4, 'about 4 mm']].forEach(function (q) { var y = 134 + q[0] * 25; o.push('<path d="M245 ' + y + ' h6" stroke="' + ink + '"/><text x="254" y="' + (y + 4) + '" font-size="10.5">' + q[1] + '</text>'); });
    }
    o.push('</svg>');
    return o.join('');
  }
  function numCap() {
    if (S.type === 'c4') return 'Top: the C4 band is below 10 ppm, so a C4 leaf keeps fixing at CO₂ levels where a C3 leaf stops ' + ev('c4.gamma', 'Krenzer 1975') + ' ' + ev('c4.inter', 'Schlüter 2023') + '. Bottom: the pump ' + badge('SECONDARY') + ' ' + ev('c4.pump10', 'Furbank 2011') + ' ' + ev('c4.pool', 'Measured pool');
    if (S.type === 'c3') return 'Top: C3 leaves stop gaining carbon below about 40 ppm ' + ev('c4.gamma', 'Krenzer 1975') + '. Bottom: rice versus C4 grasses ' + badge('SECONDARY') + ' ' + ev('c4.ms7', 'Ermakova 2020');
    return 'Left: the acid level follows the clock ' + badge('ILLUSTRATIVE') + '; the pH is one measured example ' + badge('MEASURED') + ' ' + ev('cam.clusia', 'Ball 1991') + '. Right: light in a prickly pear pad ' + ev('cam.opuntia', 'Nobel 1994') + '; the fading curve is drawn ' + ev('cam.light', 'Shape');
  }

  /* ------------------------------------------------------------ the plate text (simple first; depth in folds and Expert) */
  function sections() {
    var b = badge;
    return '' +
      '<section class="fig lx-fig" id="c4-routes" aria-label="What each route is"><div class="fighead"><h3>6.2 Three routes in plain words</h3><p>One enzyme does the fixing in all three. The difference is how CO₂ is brought to it.</p></div>' +
      '<div class="c4-cards">' +
      '<div class="card"><p class="lx-ck">C3</p><h4>Straight to Rubisco</h4><p>CO₂ drifts in through the stomata and Rubisco grabs it in every green cell. The first thing made has <b>three carbons</b>, so the route is called C3. It is simple and cheap, but Rubisco also grabs O₂, and the leaf pays to repair that (<a href="#stroma">Light IV</a>).</p><p>Most plants on Earth work this way, including rice and grapevine.</p></div>' +
      '<div class="card"><p class="lx-ck">C4</p><h4>A pump in space</h4><p>An outer ring of cells catches the carbon with <b>PEP carboxylase</b> and makes an acid with <b>four carbons</b>. The acid carries it into an inner ring around the vein, where CO₂ is set free right beside Rubisco. Rubisco then rarely grabs O₂. The pump costs extra energy.</p><p>Maize, sugarcane, sorghum and millets are C4.</p></div>' +
      '<div class="card"><p class="lx-ck">CAM</p><h4>A pump in time</h4><p>The stomata open at <b>night</b>. PEP carboxylase catches the carbon and the cell stores it as <b>malic acid</b> in its vacuole. By day the stomata stay shut to save water, and the acid gives its CO₂ back to Rubisco inside the closed leaf.</p><p>Cacti, agaves and pineapple are CAM plants.</p></div>' +
      '</div>' +
      '<details class="c4-why"><summary>Why does this happen? The history and the numbers</summary><ul>' +
      '<li><b>How C4 was found.</b> In 1966 sugarcane leaves were given labelled CO₂ (made with radioactive carbon, so it can be traced) for about one second; more than 93 % of the label was already in four carbon acids (malate, aspartate, oxaloacetate), not in the three carbon acid of C3 plants ' + b('MEASURED') + ' ' + ev('c4.hatch', 'Hatch and Slack 1966') + '.</li>' +
      '<li><b>The price of the pump.</b> Remaking PEP costs ATP: C4 needs at least two more ATP per CO₂ than C3 ' + b('SECONDARY') + ' ' + ev('rice.project', 'Ermakova 2020') + '. The pump only pays if the CO₂ stays in, and the bundle sheath lets CO₂ out 10 to 100 times more slowly than ordinary C3 cells ' + b('MEASURED') + ' ' + ev('c4.leak', 'Furbank 1989') + '. A waxy suberin layer helps: break it and C4 photosynthesis drops ' + ev('c4.suberin', 'Danila 2021') + '.</li>' +
      '<li><b>Bicarbonate first.</b> PEP carboxylase does not take CO₂ itself but bicarbonate, made from CO₂ by carbonic anhydrase; too little of that enzyme slows C4 photosynthesis ' + b('MEASURED') + ' ' + ev('c4.ca', 'Chatterjee 2021') + '.</li>' +
      '<li><b>Many inventions, not one.</b> C4 evolved independently more than 60 times ' + b('DERIVED') + ' ' + ev('c4.origins', 'Sage 2011') + ' and today counts about 8,100 species, most of them grasses and sedges ' + b('DERIVED') + ' ' + ev('c4.species', 'Sage 2016') + '. C4 plants cover less land than C3 plants but, in one global model, make about 23 % of all the carbon land plants capture ' + b('DERIVED') + ' ' + ev('c4.gpp', 'Still 2003') + '. CAM is estimated in about 7 % of vascular plant species, in 38 families, and evolved at least 66 times ' + b('DERIVED') + ' ' + ev('cam.share', 'Gilman 2023') + '.</li>' +
      '<li class="tier-2"><b>Water.</b> Opening stomata in the cool of the night loses less water for each CO₂ than opening them at noon (<a href="#tradeoff">Light V</a>). Some farmed CAM species grow about as much as water efficient C3 or C4 crops with about a fifth of the water ' + b('SECONDARY') + ' ' + ev('cam_water', 'Borland 2009') + '. No source checked for this page compares the water use of all three routes in one study, so no three way number is shown.</li>' +
      '</ul></details></section>' +

      '<section class="fig lx-fig" id="c4-plants" aria-label="Plants and crops"><div class="fighead"><h3>6.3 Plants and crops you know</h3><p>Only plants whose route a checked source names are listed.</p></div>' +
      '<div class="card" style="overflow-x:auto"><table class="c4-tbl"><thead><tr><th scope="col">Route</th><th scope="col">Plant</th><th scope="col">Note</th></tr></thead><tbody>' +
      '<tr><td>C3</td><td>Rice</td><td>The crop the C4 rice project starts from ' + ev('crop.rice', 'Source') + '</td></tr>' +
      '<tr><td>C3</td><td>Grapevine</td><td>' + ev('crop.grape', 'Medrano 2002') + '</td></tr>' +
      '<tr><td>C4</td><td>Maize</td><td>Malate route (NADP malic enzyme); the donor of every gene in C4 rice ' + ev('rice.five', 'Ermakova 2021') + ' ' + ev('c4.types', 'Fan 2025') + '</td></tr>' +
      '<tr><td>C4</td><td>Sugarcane</td><td>The plant in which C4 was discovered ' + ev('c4.hatch', 'Hatch 1966') + '</td></tr>' +
      '<tr><td>C4</td><td>Sorghum</td><td>' + ev('c4.types', 'Fan 2025') + '</td></tr>' +
      '<tr><td>C4</td><td>Proso millet</td><td>Releases CO₂ with NAD malic enzyme, a second C4 route ' + ev('c4.leak', 'Furbank 1989') + '</td></tr>' +
      '<tr><td>C4</td><td>Foxtail millet and green foxtail (Setaria)</td><td>Green foxtail is the model C4 grass ' + ev('c4.suberin', 'Danila 2021') + ' ' + ev('c4.ca', 'Chatterjee 2021') + '</td></tr>' +
      '<tr><td>C4</td><td>Big galleta grass</td><td>A Sonoran Desert bunchgrass ' + ev('crop.agave', 'Martre 2002') + '</td></tr>' +
      '<tr><td>CAM</td><td>Pineapple</td><td>The most valuable CAM crop; its CAM genes run on a day and night rhythm ' + ev('crop.pine', 'Ming 2015') + '</td></tr>' +
      '<tr><td>CAM</td><td>Agaves (Agave deserti) and prickly pear (Opuntia ficus-indica)</td><td>The main CAM crops studied for dry farmland; young prickly pear pads start out C3 like ' + ev('crop.agave', 'Yang 2015') + ' ' + ev('cam.phase4', 'Pimienta Barrios 2005') + '</td></tr>' +
      '<tr><td>CAM</td><td>Cholla (Opuntia acanthocarpa)</td><td>A desert cactus with very shallow roots ' + ev('cac.heat', 'Nobel and Bobich 2002') + '</td></tr>' +
      '<tr><td>CAM</td><td>Kalanchoë</td><td>CAM at all times (obligate) ' + ev('crop.kal', 'Yang 2017') + '</td></tr>' +
      '<tr><td>Mostly C3</td><td>Orchids</td><td>About 10 % of 1,103 tropical orchids showed strong CAM; weak CAM is common and easy to miss ' + b('MEASURED') + ' ' + ev('crop.orch', 'Silvera 2009') + '</td></tr>' +
      '<tr><td>Switchers</td><td>Ice plant, purslane, Talinum, Clusia</td><td>See 6.5</td></tr>' +
      '</tbody></table>' +
      '<p class="cap" style="margin:8px 0 0">Wheat, soybean, lettuce and almond are usually described as C3, and pearl and finger millet as C4, but no source checked for this page states it, so they are inferred here, not confirmed.</p></div></section>' +

      '<section class="fig lx-fig" id="c4-rice" aria-label="C4 rice"><div class="fighead"><h3>6.4 Can rice learn C4?</h3><p>A long project with real progress, and no C4 rice yet.</p></div>' +
      '<p>Rice feeds a very large share of people, and it is a C3 plant. If rice could run the C4 pump, the hope is that it would make more grain from the same light. Since 2008 an international team, the C4 Rice Consortium, first conceived by John Sheehy at IRRI, the International Rice Research Institute, has been trying ' + ev('rice.project', 'Ermakova 2020') + ' ' + ev('rice.why', 'Hibberd 2008') + '.</p>' +
      '<div class="c4-two">' +
      '<div class="card"><h4>Done so far</h4><ul>' +
      '<li>All five core C4 enzymes from maize now work in rice, put in on one piece of DNA. Carbon flowed into malate about 10 times faster than in normal rice, but that is only about 2 % of the flow in maize ' + b('MEASURED') + ' ' + ev('rice.five', 'Ermakova 2021') + '.</li>' +
      '<li>Rice making lots of maize PEP carboxylase did not photosynthesise faster; inside the leaf the enzyme ran at less than 2.1 % of its test tube speed ' + b('MEASURED') + ' ' + ev('rice.pepc', 'Giuliani 2019; Om 2026') + '.</li>' +
      '<li>Maize genes that build chloroplasts raised the chloroplasts and mitochondria around the veins 2.5 to 3 fold, an early "proto Kranz" look (a first step toward the C4 wreath), with no change in photosynthesis and no consistent change in yield ' + b('MEASURED') + ' ' + ev('rice.glk', 'Wang 2017') + '.</li></ul></div>' +
      '<div class="card"><h4>Not yet</h4><ul>' +
      '<li>The CO₂ is not yet being released in the bundle sheath, so the C4 cycle is not complete ' + ev('rice.five', 'Ermakova 2021') + '.</li>' +
      '<li>Leaf anatomy: rice still has about 7 mesophyll cells between veins, against 2 to 3 in C4 grasses, and the genes that set vein spacing are not yet known. The links between mesophyll and sheath cells would need to rise at least five fold ' + b('SECONDARY') + ' ' + ev('rice.project', 'Ermakova 2020') + '.</li>' +
      '<li>No gain in photosynthesis or yield has been shown.</li>' +
      '<li>Claims of up to 50 % more yield from C4 rice are predictions, not results ' + b('OPEN') + ' ' + ev('rice.why', 'Hibberd 2008') + '.</li></ul></div></div>' +
      '<details class="c4-why tier-2"><summary>Why is it so hard?</summary><ul><li>C4 is not one gene but a whole plan: enzymes in the right cells, a sheath that holds CO₂ in, veins close together and many connections between the two cell types. In Flaveria, the anatomy changed first and the chemistry later ' + ev('int.flav', 'McKown 2007') + '. Grass lines that already had veins close together and large sheath cells were the ones that became C4 ' + ev('c4.enablers', 'Christin 2013') + '.</li>' +
      '<li>Stacking genes used to be slow: five genes by crossing took almost 6 years; one construct cut that to 6 months ' + ev('rice.project', 'Ermakova 2020') + '.</li></ul></details></section>' +

      '<section class="fig lx-fig" id="c4-switch" aria-label="Plants that switch"><div class="fighead"><h3>6.5 Plants that switch, and plants in between</h3><p>The routes are not fixed boxes. Some plants change route with the weather.</p></div>' +
      '<div class="lx-cardgrid">' +
      '<div class="card lx-case"><p class="lx-ck">Common ice plant</p><p>A C3 plant that switches on CAM only under salt or drought. Then it gets 11 to 24 % of its carbon at night. With plenty of water and no salt it can live its whole life as a C3 plant ' + b('MEASURED') + ' ' + ev('fac.ice', 'Winter and Holtum 2007') + '. Plants that use CAM only when needed, and switch back, are called <b>facultative CAM</b> plants ' + ev('fac.def', 'Winter and Holtum 2014') + '.</p></div>' +
      '<div class="card lx-case"><p class="lx-ck">Purslane</p><p>A C4 plant that also stores acid at night like a CAM plant when days are short or water is short. Night to day acid swings reached 102 µeq (microequivalents, a measure of acid) per g fresh weight in leaves ' + b('MEASURED') + ' ' + ev('fac.purs', 'Koch and Kennedy 1980') + '; after 21 to 23 days without water it took up CO₂ only at night ' + ev('fac.drought', 'Lara 2003, 2004') + '. In purslane, C4 and CAM run in the same leaf, and in the same cells ' + ev('fac.same', 'Ferrari 2020; Moreno Villena 2022') + '.</p></div>' +
      '<div class="card lx-case"><p class="lx-ck">Talinum</p><p>A leafy C3 plant that turns on a weak CAM during drought; the drought hormone ABA alone can switch it on ' + ev('fac.talinum', 'Brilhaus 2016; Maleckova 2019') + '.</p></div>' +
      '<div class="card lx-case"><p class="lx-ck">Clusia, the CAM tree</p><p>The only group of true trees known to use CAM. One Clusia plant can run C3 in one leaf and CAM in the leaf opposite it ' + ev('fac.clusia', 'Lüttge 2006, 2008') + '. By dawn the sap of a Clusia rosea leaf reached pH 2.85 from the acid stored overnight ' + b('MEASURED') + ' ' + ev('cam.clusia', 'Ball 1991') + '.</p></div>' +
      '<div class="card lx-case"><p class="lx-ck">In between C3 and C4</p><p>Some plants have a partial pump. Their CO₂ compensation points (the CO₂ level at which a leaf just stops gaining carbon) sit between the C3 and C4 values, about 10 to 40 ppm ' + b('MEASURED') + ' ' + ev('c4.inter', 'Schlüter 2023') + '; Moricandia arvensis, a cabbage family plant, is about 26 ' + ev('c4.gamma', 'Krenzer 1975') + '. A halfway stage called <b>C2</b> moves glycine from photorespiration into the bundle sheath, where its CO₂ is refixed ' + ev('int.c2', 'Sage 2014') + '.</p></div>' +
      '<div class="card lx-case"><p class="lx-ck">C4 inside one cell</p><p>Two Central Asian goosefoot relatives, Bienertia cycloptera and Borszczowia aralocaspica, run C4 without the wreath: each cell keeps PEP carboxylase at one end or edge and Rubisco in another part of the same cell ' + b('MEASURED') + ' ' + ev('int.single', 'Voznesenskaya 2001, 2002') + '.</p></div>' +
      '</div>' +
      '<p class="cap tier-3">' + b('OPEN') + ' Purslane relatives may run a weak CAM cycle all the time and turn it up in drought; this is a suggestion from gene expression, not a settled result ' + ev('fac.weak', 'Gilman 2022') + '.</p></section>' +

      '<section class="fig lx-fig" id="c4-cacti" aria-label="Cacti and agaves"><div class="fighead"><h3>6.6 Cacti and agaves: built to hold water</h3><p>CAM is one part. Shape, skin and roots do the rest.</p></div>' +
      '<div class="c4-two">' +
      '<div class="card"><h4>The body</h4><ul>' +
      '<li><b>Thick is good.</b> For a flat pad, surface divided by volume is 2 ÷ thickness, so a thicker pad has less skin to lose water through for each drop it stores. About 8 to 15 ribs give a cactus a good balance between storage and surface ' + b('DERIVED') + ' ' + ev('cac.sv', 'Mauseth 2000') + '.</li>' +
      '<li><b>An accordion stem.</b> Ribs fold so the stem can swell after rain without tearing. A cactus stem is mostly green, water filled cortex fed by its own small veins; spines are changed bud scales ' + b('SECONDARY') + ' ' + ev('cac.shoot', 'Mauseth 2006') + '.</li>' +
      '<li><b>Light runs out fast.</b> In a prickly pear pad the green layer is about 4 mm deep, but 99 % of the blue and red light is gone 2 mm in; deeper cells still fix CO₂ at night ' + b('MEASURED') + ' ' + ev('cam.opuntia', 'Nobel 1994') + '.</li>' +
      '<li><b>Heat.</b> Prickly pear pads survived up to 65 °C but are hurt by frost a few degrees below zero ' + b('MEASURED') + ' ' + ev('cac.heat', 'Nobel and De la Barrera 2003') + '. Small round cacti build wood from wide band tracheids, water conducting cells with deep ring or spiral bands in their walls ' + ev('cac.wbt', 'Mauseth 2004') + '.</li></ul></div>' +
      '<div class="card"><h4>The roots</h4><ul>' +
      '<li><b>A one way valve.</b> In Agave deserti and a barrel cactus, the link where root meets stem shuts down in drought and reopens after rain, so stored water does not drain back into dry soil ' + b('MEASURED') + ' ' + ev('cac.rect', 'Ewers, North and Nobel 1992') + '.</li>' +
      '<li><b>Shrinking roots.</b> Agave roots shrank 24 % and 34 % after 7 and 14 days of drought. The air gap they leave would cut water flow across the root surface by a factor of about 5 ' + b('DERIVED') + ' ' + ev('cac.shrink', 'North and Nobel 1997') + '.</li>' +
      '<li><b>Closing water channels.</b> In a cholla, 45 days of drying cut root water conductance by about 67 %; 8 days after rain it was back to 60 % of the start, partly through changes in aquaporins, the water channel proteins of cell membranes ' + b('MEASURED') + ' ' + ev('cac.aqp', 'Martre, North and Nobel 2001') + '. Its roots sit only about 9 cm deep, ready for light rain ' + ev('cac.heat', 'Nobel and Bobich 2002') + '.</li>' +
      '<li><b>Roots that pull.</b> Contractile roots, which pull the plant down into the soil, were found in 55 % of 73 succulent monocot species, more so in drier homelands ' + b('MEASURED') + ' ' + ev('cac.contr', 'North 2008') + '; the living rock cactus is pulled down 6 to 30 mm a year, which keeps it flush with the ground ' + ev('cac.ario', 'Garrett 2010') + '.</li>' +
      '<li class="tier-2"><b>Easy to embolise.</b> Embolism means air bubbles fill the water pipes and block them. Agave and prickly pear root xylem embolises at a mean of about −0.93 and −0.70 MPa (water pressures; more negative means a stronger pull); after 3 months of drought 69 % and 62 % of conductance was lost, which also limits water leaking back out into dry soil ' + ev('cac.cav', 'Linton and Nobel 1999') + '.</li></ul></div></div>' +
      '<p class="cap lx-row">The water side: these roots are the start of the same path you followed in <a href="../journey/index.html#plant">Water II, the Plant</a> and <a href="../journey/index.html#membrane">Water V, the Membrane</a>.</p></section>' +

      '<section class="tier-3 lx-expert" aria-label="Expert"><h3 class="lx-h3">Expert: what the numbers rest on</h3>' +
      '<div class="card eq">C3: CO₂ + RuBP → 2 × 3 phosphoglycerate (Rubisco)<br>C4 and CAM: HCO₃⁻ + PEP → oxaloacetate (PEP carboxylase) → malate; malate → CO₂ + pyruvate (malic enzyme) next to Rubisco<br>C4 cost: at least 2 more ATP per CO₂ than C3, to remake PEP</div>' +
      '<div class="card lx-open"><p class="lx-ck">' + b('OPEN') + ' Three C4 subtypes, or a mix?</p><p>Textbooks sort C4 plants by the enzyme that releases the CO₂ (NADP malic enzyme as in maize, NAD malic enzyme as in proso millet, or PEP carboxykinase). The types may not be rigid and can shift with development and environment ' + ev('c4.pump10', 'Furbank 2011') + ', and across 1,696 response curves the subtypes differed little in capacity ' + ev('c4.types', 'Fan 2025') + '. The measured inorganic carbon pool in the bundle sheath is 15 to 97 nmol per mg chlorophyll; the "up to 10 times air" figure is a review statement built on such data ' + ev('c4.pool', 'Furbank and Hatch 1987') + '.</p></div>' +
      '<div class="card lx-open"><p class="lx-ck">' + b('OPEN') + ' How many times did C4 evolve?</p><p>Counts move with method and year: 62 lineages, 61 with possible extra origins in 12, or at least 66 origins. This page says only "more than 60" ' + ev('c4.origins', 'Sage 2011') + '. In grasses alone, 22 to 24 times ' + ev('c4.enablers', 'Christin 2013') + '.</p></div>' +
      '<div class="card lx-open"><p class="lx-ck">The CAM day</p><p>Phase I is the night uptake into stored acid; phase II the early morning uptake, which in Clusia rosea lasted until about 11:00 to 12:00 and gave about a third of the total ' + ev('cam.clusia', 'Ball 1991') + '; phase IV the late afternoon uptake, when Rubisco takes CO₂ from the air ' + ev('cam.phase4', 'Pimienta Barrios 2005') + '. The middle of the day, stomata shut while the acid is used, is shown here only in words: its formal definition was not checked for this page. In the pineapple family, CAM green cells average 22 times the volume of C3 ones ' + ev('cam.cells', 'Males 2018') + '.</p></div>' +
      '<div class="card"><p class="lx-ck">Not shown yet</p><p>A measured water use comparison of all three routes in one study; the share of a CAM cell taken by its vacuole; vein spacing in µm. Each needs a source not yet checked, so the page does not guess.</p></div>' +
      '</section>' +

      '<section class="lx-qs" aria-label="Questions"><h3 class="lx-h3">Check yourself</h3>' +
      U().reveal('In the C4 leaf, use the <b>Show or hide</b> buttons to turn off every layer except <b>CO₂ route</b> and <b>Rubisco</b>. Where does the CO₂ that reaches Rubisco come from: straight from the air spaces, or from somewhere else?',
        '<p>From malate. The grey CO₂ from the stoma stops at PEP carboxylase in the mesophyll. The CO₂ that reaches Rubisco is set free from malate inside the bundle sheath. Turn the buttons <b>Malate and malic acid</b> and <b>CO₂ release</b> back on to see the link.</p>', { choices: [
          ['From malate, set free in the bundle sheath', true, 'The bundle sheath has almost no direct supply from the air spaces; the pump delivers it.'],
          ['Straight from the air spaces', false, 'That is the C3 route. In C4 the first catch is in the mesophyll.']] }) +
      '<div class="tier-2">' + U().reveal('Run the CAM clock to noon. The stomata are shut. Why does the vacuole acid level fall even though no CO₂ is coming in?',
        '<p>The stored malic acid leaves the vacuole and is broken to release CO₂ for Rubisco inside the closed leaf. The carbon was taken in the night before.</p>') + '</div>' +
      '<div class="tier-3">' + U().reveal('C4 rice lines now carry all five core maize enzymes, but the leaves do not yet work like C4 leaves (their CO₂ compensation point did not change). Name two parts of the C4 plan that are still missing.',
        '<p>Release of CO₂ in the bundle sheath (malate to pyruvate flux stayed low) and C4 leaf anatomy: rice has about 7 mesophyll cells between veins instead of 2 to 3, and far fewer links between the two cell types. A sheath that holds CO₂ in is also part of the plan.</p>') + '</div>' +
      '</section>' + (U().quiz ? U().quiz(PID) : '');
  }

  /* ------------------------------------------------------------ Test yourself items (three tiers, five or more each) */
  LP.quiz = LP.quiz || {}; LP.quiz.items = LP.quiz.items || [];
  [
    { id: 'c4-k-name', t: 1, plate: PID, b: 'VERIFIED', src: ['10.1042/bj1010103'], q: 'Why is the C4 route called C4?',
      o: [['Its first products are acids with four carbons', 'Right. In sugarcane more than 93 % of the label was in four carbon acids after about a second.'], ['It needs four enzymes', 'It needs several, but the name comes from the first product.'], ['It evolved four times', 'It evolved more than 60 times; the name is about carbon atoms.']], a: 0 },
    { id: 'c4-k-pepc', t: 1, plate: PID, b: 'VERIFIED', src: ['10.1093/jxb/err080'], q: 'In a C4 leaf, which enzyme catches the carbon first?',
      o: [['PEP carboxylase, in the mesophyll', 'Right. Rubisco works later, in the bundle sheath.'], ['Rubisco, in the mesophyll', 'That is the C3 route.'], ['Carbonic anhydrase, in the vein', 'Carbonic anhydrase makes bicarbonate for PEP carboxylase; it does not fix carbon into an acid.']], a: 0 },
    { id: 'c4-k-cam', t: 1, plate: PID, b: 'VERIFIED', src: ['10.1093/jxb/eru234'], q: 'Where does a CAM cell keep the carbon it caught at night?',
      o: [['As malic acid in its vacuole', 'Right. That is why the sap turns acidic overnight.'], ['As CO₂ gas in the air spaces', 'CAM tissue has little air space, and gas would leak; it stores an acid.'], ['As starch in the vein', 'Starch is made by day; the night store is acid.']], a: 0 },
    { id: 'c4-k-kranz', t: 1, plate: PID, b: 'VERIFIED', src: ['10.1111/tpj.14562'], q: 'What does Kranz anatomy look like?',
      o: [['A ring of chloroplast rich bundle sheath cells around each vein, with mesophyll cells around that', 'Right. Kranz is German for wreath.'], ['Tall palisade cells over spongy cells', 'That is a typical C3 broadleaf.'], ['Large round cells that are mostly vacuole', 'That is CAM tissue.']], a: 0 },
    { id: 'c4-k-ice', t: 1, plate: PID, b: 'VERIFIED', src: ['10.1104/pp.106.088922'], q: 'The common ice plant is watered well and never salted. Which route does it use?',
      o: [['C3, for its whole life', 'Right. Salt or drought switches on CAM; without them it stays C3.'], ['CAM, always', 'It is a facultative CAM plant: CAM only when stressed.'], ['C4', 'The ice plant is not a C4 plant.']], a: 0 },
    { id: 'c4-u-gamma', t: 2, plate: PID, b: 'VERIFIED', src: ['10.1104/pp.56.2.194'], q: 'A leaf in a sealed chamber stops gaining carbon when CO₂ falls to 5 ppm. Which route does it most likely use?',
      o: [['C4: C4 compensation points are 10 ppm or less', 'Right. C3 leaves stop near 40 ppm or more.'], ['C3', 'C3 leaves stop at about 40 ppm or more.'], ['A C3 to C4 intermediate', 'Intermediates sit between about 10 and 40 ppm.']], a: 0 },
    { id: 'c4-u-cells', t: 2, plate: PID, b: 'VERIFIED', src: ['10.1111/tpj.14562'], q: 'A grass leaf section shows 6 mesophyll cells between neighbouring bundle sheaths. What does that suggest?',
      o: [['It is likely C3: C4 grasses have at most 2 to 3', 'Right. Rice, a C3 grass, has about 7.'], ['It is likely C4', 'C4 grass leaves have at most 2 to 3 cells between sheaths.'], ['Nothing: cell counts do not differ', 'They do, among 25 grass species checked.']], a: 0 },
    { id: 'c4-u-noon', t: 2, plate: PID, b: 'VERIFIED', src: ['10.1093/jxb/eru234'], q: 'At noon a CAM plant has its stomata shut. Which enzyme is fixing CO₂ into sugar, and where does that CO₂ come from?',
      o: [['Rubisco, using CO₂ released from the stored malic acid', 'Right. The carbon was caught the night before.'], ['PEP carboxylase, using CO₂ from the air', 'With stomata shut, little CO₂ enters, and PEP carboxylase works mainly at night.'], ['None: CAM plants do not photosynthesise by day', 'They do; light drives the Calvin cycle on the stored carbon.']], a: 0 },
    { id: 'c4-u-light', t: 2, plate: PID, b: 'VERIFIED', src: ['10.1111/j.1469-8137.1994.tb04015.x'], q: 'In a prickly pear pad, 99 % of blue and red light is gone 2 mm in, but the green layer is about 4 mm. Do the deeper cells do anything?',
      o: [['Yes: at 2 to 3 mm, night acid gain and CO₂ uptake were only 22 to 47 % lower than near the surface', 'Right. Deep cells still catch CO₂ at night.'], ['No: without light they are useless', 'They still take up CO₂ at night with PEP carboxylase.'], ['They are water storage only', 'The storage tissue is deeper; these cells are green.']], a: 0 },
    { id: 'c4-u-rice', t: 2, plate: PID, b: 'VERIFIED', src: ['10.1111/pbi.13487'], q: 'Rice with five maize C4 enzymes moved carbon into malate about 10 times faster than normal rice. Compared with maize, that flow was:',
      o: [['About 2 % of maize', 'Right. A real start, far from a working pump.'], ['About the same as maize', 'It was far lower.'], ['About ten times maize', 'Ten times normal rice, not maize.']], a: 0 },
    { id: 'c4-q-50', t: 3, plate: PID, b: 'OPEN QUESTION', src: ['10.1016/j.pbi.2007.11.002', '10.1016/j.cub.2017.09.040'], q: 'A news story says "C4 rice gives 50 % more grain". What does the evidence on this plate support?',
      o: [['No: 50 % is a prediction; no gain in photosynthesis or yield has been shown yet', 'Right. Field trials of proto Kranz rice showed no consistent yield change.'], ['Yes: field trials at IRRI showed it', 'Those trials showed no consistent yield difference.'], ['Yes, but only in maize', 'Maize is already C4; the claim is about rice.']], a: 0 },
    { id: 'c4-q-orchid', t: 3, plate: PID, b: 'VERIFIED', src: ['10.1104/pp.108.132555', '10.1071/FP04179'], q: 'A survey of orchids by carbon isotopes finds 10 % CAM. Is "10 % of orchids use CAM" the whole story?',
      o: [['No: isotopes miss weak CAM; night acid tests found it in about a third of orchids that looked C3', 'Right. The method sets what you can find.'], ['Yes: isotopes measure CAM exactly', 'Isotopes catch strong CAM well but miss weak CAM.'], ['No: orchids are all CAM', 'Most orchids are C3.']], a: 0 },
    { id: 'c4-q-types', t: 3, plate: PID, b: 'VERIFIED', src: ['10.1093/jxb/err080', '10.1111/nph.70525'], q: 'Textbooks list three C4 subtypes. What is the best supported view?',
      o: [['Useful labels, but many species mix routes, and subtypes differ little in capacity compared with growing conditions', 'Right. Treat them as main routes, not fixed boxes.'], ['Three rigid kinds that never mix', 'Reviews argue the types are flexible.'], ['Subtypes are the main reason C4 crops differ in yield', 'A large analysis found environment mattered more.']], a: 0 },
    { id: 'c4-q-roots', t: 3, plate: PID, b: 'VERIFIED', src: ['10.1046/j.1469-8137.1997.00620.x', '10.1111/j.1469-8137.1992.tb02937.x'], q: 'Agave roots shrink and pull away from drying soil, and the root to stem link shuts in drought. Is that a failure or a strategy?',
      o: [['Mostly a strategy: both stop stored water from draining into dry soil, and both reverse after rain', 'Right. They act like a valve that opens in wet soil.'], ['A failure: the plant loses all its roots', 'The changes reverse after rewetting.'], ['Neither: roots of desert plants never change', 'They shrink by a quarter or a third in two weeks of drought.']], a: 0 },
    { id: 'c4-q-purs', t: 3, plate: PID, b: 'VERIFIED', src: ['10.1126/sciadv.abn2349', '10.1111/nph.16265'], q: 'Purslane runs C4 by day and stores acid at night in drought. Where do the two run?',
      o: [['In the same leaf and, in Portulaca, in the same cells', 'Right. The two pathways are integrated, not separated into different cells.'], ['In different plants of the same species only', 'One plant can do both.'], ['C4 in leaves only, CAM in roots only', 'Both run in green tissue.']], a: 0 }
  ].forEach(function (x) { if (!LP.quiz.items.some(function (y) { return y.id === x.id; })) LP.quiz.items.push(x); });

  /* ------------------------------------------------------------ mount */
  var EL = null;
  function say(t) { if (EL && EL.now) EL.now.innerHTML = t; }
  function mount(host) {
    var u = U();
    host.innerHTML = '<style>' + CSS + '</style>' +
      (u.now ? u.now('<b>What is happening:</b> <span id="c4-top">Three leaf plans for one job. Pick C3, C4 or CAM and watch where the carbon goes.</span>', 'c4-nowp') : '') +
      workstation() + sections();
    var root = host.querySelector('#c4-ws'), stage = root.querySelector('.c4-stage'), bar = root.querySelector('.c4-bar');
    EL = { root: root, stage: stage, bar: bar, panel: root.querySelector('.c4-panel'), now: root.querySelector('#c4-now'), ro: root.querySelector('#c4-ro'), map: root.querySelector('#c4-map'), num: root.querySelector('#c4-num'), numcap: root.querySelector('#c4-numcap'),
      clock: root.querySelector('#c4-clock'), hour: root.querySelector('#c4-hour'), hourO: root.querySelector('#c4-hour-o'), part: root.querySelector('#c4-part'), b3: root.querySelector('#c4-b3'), b3s: root.querySelector('#c4-b3s') };
    var force2d = /[?&]ws=2d\b/.test(location.search);
    var glOK = !force2d && window.THREE && (LP.macro && LP.macro.ok ? LP.macro.ok() : true);
    if (glOK) { try { G = build3D(stage, bar); } catch (e) { console.error('C3 C4 CAM 3D failed, using the flat drawing', e); G = null; } }
    if (!G) {
      var gl = stage.querySelector('.c4-gl canvas'); if (gl && gl.parentNode) gl.parentNode.removeChild(gl);
      stage.querySelector('.c4-gl').setAttribute('aria-label', 'Flat drawing of the leaf front face');
      bar.querySelector('[data-a="freeze"]').hidden = true;
      var nt = document.createElement('span'); nt.style.cssText = 'font:12px var(--ui);color:#dfe8d3'; nt.textContent = 'Flat drawing: 3D is not available here, so this is a still view of the same leaf face.'; bar.appendChild(nt);
      stage.addEventListener('click', function (e) { var t = e.target.closest && e.target.closest('[data-part]'); if (t) openPart(t.getAttribute('data-part')); });
    } else {
      var down = null, surf = G.surface;
      surf.addEventListener('pointerdown', function (e) { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
      surf.addEventListener('pointerup', function (e) {
        if (!down) return; var d = Math.hypot(e.clientX - down.x, e.clientY - down.y), dt = performance.now() - down.t; down = null;
        if (d > 6 || dt >= 450 || (e.button != null && e.button > 0) || e.isPrimary === false) return;
        var h = G.pickAt(e.clientX, e.clientY);
        /* the site rule (freeze.js): every still click freezes or plays; a click on a part also opens its note */
        if (h && h.part && PARTS[h.part]) openPart(h.part);
        S.picked = false;
      });
      surf.addEventListener('pointercancel', function () { down = null; });
      if (window.WPFreeze) WPFreeze.attach(surf, { paused: function () { return S.frozen; }, button: bar.querySelector('[data-a="freeze"]'), chipHost: stage, picked: function () { var p = S.picked; S.picked = false; return p; } });
      if (window.PlaySpeed) { var ch = window.PlaySpeed.chip(); bar.insertBefore(ch, bar.querySelector('[data-a="names"]')); }
      S.after = function () { var n = performance.now(); if (S.type === 'cam' && (!S._l2 || n - S._l2 > 250)) { S._l2 = n; syncClock(); } };
    }
    /* controls */
    root.querySelectorAll('.c4-types button').forEach(function (b) { b.addEventListener('click', function () { setType(b.getAttribute('data-t')); }); });
    root.querySelectorAll('.c4-chip').forEach(function (b) { b.addEventListener('click', function () { toggleLayer(b.getAttribute('data-l')); }); });
    EL.hour.addEventListener('input', function () { S.hour = +EL.hour.value; S.acid = acidAt(S.hour); afterClock(true); });
    EL.clock.querySelectorAll('[data-h]').forEach(function (b) { b.addEventListener('click', function () { S.hour = +b.getAttribute('data-h'); S.acid = acidAt(S.hour); afterClock(true); }); });
    EL.clock.querySelector('[data-a="run"]').addEventListener('click', function (e) { S.clockRun = !S.clockRun; e.currentTarget.setAttribute('aria-pressed', S.clockRun ? 'true' : 'false'); say(S.clockRun ? 'The clock runs again: 24 hours in about a minute at normal speed.' : 'Clock held at ' + hh(S.hour) + '. Move the slider or press a time of day.'); if (G) G.kick(); });
    EL.part.addEventListener('change', function () { if (EL.part.value) openPart(EL.part.value); });
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('[data-a]'); if (!b) return; var a = b.getAttribute('data-a');
      if (a === 'freeze') setFrozen(!S.frozen);
      else if (a === 'step') step();
      else if (a === 'names') { S.names = !S.names; b.setAttribute('aria-pressed', S.names ? 'true' : 'false'); kickAll(); }
    });
    EL.map.addEventListener('click', function (e) { var t = e.target.closest('[data-part]'); if (t) openPart(t.getAttribute('data-part')); });
    EL.map.addEventListener('keydown', function (e) { if (e.key !== 'Enter' && e.key !== ' ') return; var t = e.target.closest('[data-part]'); if (t) { e.preventDefault(); openPart(t.getAttribute('data-part')); } });
    if (window.PlaySpeed) window.PlaySpeed.on(function () { kickAll(); });
    if (window.MolNames) window.MolNames.on(function () { kickAll(); });
    if (u.onPrefs) u.onPrefs(function () { if (reduced() && !S.frozen) setFrozen(true, true); renderPanes(); kickAll(); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { var rl = document.querySelector('.wp-rail'); if (rl) rl.classList.toggle('tuck', es[0].intersectionRatio > 0.2); }, { threshold: [0, 0.2, 0.5] }).observe(stage.parentNode);
    if (reduced()) setFrozen(true, true);
    setType(S.type, true);
    if (G) G.prewarm(4);
    say('A C4 leaf. Grey CO₂ comes in through the stoma and is caught by PEP carboxylase in the outer ring; malate carries it into the bundle sheath, where it is set free next to Rubisco.');
  }
  function acidAt(h) { /* the stored acid level the clock would reach at this hour, from an empty pad at dusk */
    h = ((h % 24) + 24) % 24; var a = 0, t = 19;
    for (var i = 0; i < 96; i++) { var hr = (t + i * 0.25) % 24; if (Math.abs(((hr - h + 24) % 24)) < 0.01) break; var ph = phase(hr); if (ph.pepc) a = Math.min(1, a + 0.25 / 11 * aperture(hr)); else if (ph.rel) a = Math.max(0, a - 0.25 / 8); }
    return a;
  }
  function afterClock(user) {
    syncClock(true);
    if (G) { G.applyLayers(); G.kick(); } else draw2D();
    if (user) { var ph = phase(S.hour); say(hh(S.hour) + ', ' + ph.name.charAt(0).toLowerCase() + ph.name.slice(1) + ': ' + (ph.pepc ? 'stomata open, PEP carboxylase catches CO₂ and the vacuoles fill with malic acid.' : ph.id === 'mid' ? 'stomata shut. The stored acid leaves the vacuoles and gives up CO₂ to Rubisco inside the closed pad.' : ph.id === 'II' ? 'stomata still partly open; Rubisco takes some CO₂ straight from the air while the stored acid starts to be used.' : 'stomata open again and Rubisco takes CO₂ straight from the air; the vacuoles are nearly empty.')); }
  }
  var lastMapKey = '';
  function syncClock(force) {
    if (!EL) return;
    if (EL.hour.value !== String(S.hour)) EL.hour.value = String(Math.round(S.hour * 4) / 4);
    EL.hourO.textContent = hh(S.hour) + ' · ' + phase(S.hour).name;
    EL.clock.querySelectorAll('[data-h]').forEach(function (b) { var h0 = +b.getAttribute('data-h'); b.setAttribute('aria-pressed', phase(h0).id === phase(S.hour).id ? 'true' : 'false'); });
    syncLive();
    var bar = EL.num.querySelector('#c4-acidbar'); if (bar) bar.setAttribute('width', (148 * clamp(S.acid, 0, 1)).toFixed(1));
    var k = phase(S.hour).id + '|' + (aperture(S.hour) > 0.15);
    if (force || k !== lastMapKey) { lastMapKey = k; EL.map.innerHTML = mapSVG(); }
    badge3();
  }
  function badge3() {
    if (!EL) return; var t = TYPES[S.type];
    EL.b3.textContent = t.tag; EL.b3s.textContent = t.ex + (S.type === 'cam' ? ' · ' + hh(S.hour) + ', ' + (sunAt(S.hour) > 0.5 ? 'day' : 'night') : '');
  }
  function setType(t, instant) {
    if (!TYPES[t]) return;
    S.type = t; closePart(true);
    EL.root.querySelectorAll('.c4-types button').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-t') === t ? 'true' : 'false'); });
    EL.clock.classList.toggle('on', t === 'cam');
    if (t === 'cam' && instant !== true) { S.hour = 1; S.acid = acidAt(1); }
    renderPanes();
    if (G) G.setType(t, instant); else draw2D();
    if (instant !== true) say(t === 'c3' ? 'A C3 leaf. Grey CO₂ comes in through the stoma, spreads through the air spaces and is caught by Rubisco in the chloroplasts of every mesophyll cell. Sugar leaves through the veins.' :
      t === 'c4' ? 'A C4 leaf. Veins are close together, each in a wreath of two rings. PEP carboxylase in the outer ring catches the carbon; malate carries it into the bundle sheath, where CO₂ is set free beside Rubisco. Pyruvate goes back to be remade into PEP.' :
      'A CAM pad at 01:00. The stomata are open in the dark; PEP carboxylase catches CO₂ and the vacuoles fill with malic acid. Run the clock to see the day.');
  }
  function toggleLayer(l) {
    S.layers[l] = !S.layers[l];
    EL.root.querySelectorAll('.c4-chip').forEach(function (b) { b.setAttribute('aria-pressed', S.layers[b.getAttribute('data-l')] ? 'true' : 'false'); });
    if (G) G.applyLayers(); else draw2D();
    EL.map.innerHTML = mapSVG();
    var nm = LAYERS.filter(function (x) { return x[0] === l; })[0][1];
    var note = '';
    if (S.type === 'c3' && (l === 'pepc' || l === 'malate' || l === 'shuttle' || l === 'release')) note = ' A C3 leaf has no such step in its route, so nothing changes here.';
    say((S.layers[l] ? 'Showing ' : 'Hiding ') + nm.toLowerCase().replace('co₂', 'CO₂').replace('pep carboxylase', 'PEP carboxylase').replace('rubisco', 'Rubisco').replace('pep,', 'PEP,') + '.' + note);
    kickAll();
  }
  function renderPanes() {
    if (!EL) return;
    EL.ro.innerHTML = readout(); EL.map.innerHTML = mapSVG(); EL.num.innerHTML = numSVG(); EL.numcap.innerHTML = numCap();
    EL.root.querySelectorAll('.c4-molkey .k').forEach(function (k) { var kk = k.getAttribute('data-k'); k.hidden = S.type === 'c3' ? ['co2', 'sugar'].indexOf(kk) < 0 : (S.type === 'c4' ? kk === 'malic' : ['pyr'].indexOf(kk) >= 0); });
    if (U().quizInit) try { U().quizInit(EL.root.parentNode); } catch (e) { /* ok */ }
    syncClock(true);
  }
  function draw2D() {
    if (G || !EL) return;
    var old = EL.stage.querySelector('.c4-svg'); if (old) old.parentNode.removeChild(old);
    EL.stage.querySelector('.c4-gl').insertAdjacentHTML('afterend', svgLeaf(S.type));
  }
  function kickAll() { S.dirty = true; if (G) G.kick(); else draw2D(); }
  function step() { if (!G) return; for (var i = 0; i < 10; i++) G.advance(0.05); G.kick(); say('One step: half a second of scene time.'); }
  function setFrozen(on, quiet) {
    S.frozen = !!on;
    var b = EL.bar.querySelector('[data-a="freeze"]'); b.setAttribute('aria-pressed', S.frozen ? 'true' : 'false'); b.textContent = S.frozen ? 'Play' : 'Pause';
    EL.bar.querySelector('[data-a="step"]').hidden = !S.frozen || !G;
    if (window.WPFreeze) WPFreeze.syncAll();
    if (!quiet) say(S.frozen ? 'Frozen. You can still turn the leaf and click parts to read about them.' : 'Running again.');
    kickAll();
  }
  function openPart(id) {
    var P = partText(id, S.type); if (!P) return;
    S.hl = id; if (G) G.highlight(id);
    var evs = (PART_EV[id] || []).filter(function (k) { return LP.evidence[k]; }).map(function (k) { return ev(k); }).join(' ');
    EL.panel.innerHTML = '<button type="button" class="x" aria-label="Close">×</button><h4>' + esc(P[0]) + '</h4><p class="wh">' + esc(P[1]) + '</p><p class="tx">' + P[2] + (evs ? ' ' + evs : '') + '</p>';
    EL.panel.hidden = false;
    var xy = G && G.partXY ? G.partXY(id) : null;
    EL.panel.style.top = ''; EL.panel.style.bottom = '';
    if (xy && xy.y > xy.h * 0.55) { EL.panel.style.top = '8px'; EL.panel.style.bottom = 'auto'; }
    EL.panel.querySelector('.x').addEventListener('click', function () { closePart(); });
    if (EL.part.value !== id) EL.part.value = PARTS[id] && EL.part.querySelector('option[value="' + id + '"]') ? id : '';
    EL.map.innerHTML = mapSVG();
    kickAll();
  }
  function closePart(quiet) { if (!EL) return; EL.panel.hidden = true; S.hl = null; if (G) G.highlight(null); EL.part.value = ''; if (!quiet) { EL.map.innerHTML = mapSVG(); kickAll(); } }

  LP.panels.push({ id: PID, mount: mount, update: function () { /* this plate does not use the leaf engine */ },
    show: function () { if (G) G.kick(); }, hide: function () {} });

  window.C3C4 = {
    debug: function () { return { type: S.type, frozen: S.frozen, hour: S.hour, acid: +S.acid.toFixed(3), layers: S.layers, gl: !!G, trans: !!S.trans, panel: EL && !EL.panel.hidden ? EL.panel.querySelector('h4').textContent : null, count: G ? G.count() : null }; },
    type: function (t) { setType(t); }, hour: function (h) { S.hour = h; S.acid = acidAt(h); afterClock(true); }, layer: toggleLayer, open: openPart, freeze: setFrozen, run: function (on) { S.clockRun = !!on; },
    prewarm: function (s) { if (G) G.prewarm(s || 3); kickAll(); }, layouts: layouts
  };
})();

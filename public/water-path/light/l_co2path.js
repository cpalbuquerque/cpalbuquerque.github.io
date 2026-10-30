/* Light to Sugar: "The CO2 path: from the air to Rubisco" (team gm, v19). Plate V, after 5.3.
   One linked workstation, 2D on purpose: the path is a line (air, stoma, air space, wall, membrane, cytosol, envelope,
   stroma), so turning a camera would show nothing new. Panes, all driven by the same two controls:
     1. a cut through the leaf along the CO2 path (canvas, animated, click to freeze through freeze.js via LP.ui.anim)
        with the CO2 staircase under it: Ca, the drop at the stoma, Ci, the drop across the mesophyll, Cc
     2. a small plot of carbon in (A) against water out (E): the gs curve and the gm line through the current leaf
     3. the limitation split (stomatal, mesophyll, biochemical), live from the model (DERIVED), beside the measured
        ranges of Tomás et al. 2013 (MEASURED)
     4. what sets gm: wall thickness and chloroplast surface, herbs against woody species, with the model drawdown
        Ci − Cc marked on the measured ranges; aquaporins and carbonic anhydrase as open questions
   Controls: gs (LP.set stomata 'fixed', gs) and gm (LP.set gm, holding gs where it is), presets, Expert switch gmInf.
   Model: engine.js r6 (A = gs/1.6 (Ca − Ci) = gm (Ci − Cc) = FvCB(Cc)). Sources: V19_SOURCES_gs_gm.md only.
   Mounts itself after 5.3 by wrapping the 'tradeoff' panel (no change to that panel's markup). Debug: window.CO2P. */
(function () {
  'use strict';
  var LP = window.LP = window.LP || {};
  LP.evidence = LP.evidence || {}; LP.sources = LP.sources || {};
  var MINUS = '−', TAU = Math.PI * 2;
  function clamp(x, a, b) { return x < a ? a : (x > b ? b : x); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function rnd() { return Math.random(); }
  function U() { return LP.ui || {}; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fmt(x, d) {
    if (x == null || !isFinite(x)) return 'n/a';
    var s = Number(Math.abs(x).toFixed(d || 0)).toLocaleString('en-US', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
    return (x < 0 && +s.replace(/,/g, '') !== 0 ? MINUS : '') + s;
  }
  function badge(k) { return U().badge ? U().badge(k) : '<span class="badge">' + esc(k) + '</span>'; }
  function ev(k, l) { return U().ev ? U().ev(k, l) : ''; }
  function dark() { return U().isDark ? U().isDark() : false; }
  function tier() { return U().tier ? U().tier() : 2; }
  function reduced() { return U().reducedMotion ? U().reducedMotion() : false; }
  function R() { return LP.result || {}; }
  function molc(k, d) { return window.WPMolColor ? WPMolColor.get(k, d) : (k === 'co2' ? (d ? '#cfd3d8' : '#77797d') : (d ? '#80dfff' : '#1d4aa5')); }

  /* ------------------------------------------------------------ evidence (V19_SOURCES_gs_gm.md, 29 Oct 2026) */
  var EV = {
    'gm.def': { claim: 'After CO2 passes the stomata it still has to cross the air spaces, the cell wall, membranes and the watery inside of the cell to reach Rubisco. That second path is the mesophyll conductance, gm, and it lowers the CO2 at Rubisco (Cc) below the CO2 in the air spaces (Ci).', cite: 'Flexas J, Ribas Carbó M, Diaz Espejo A, Galmés J, Medrano H (2008) Plant Cell Environ 31:602 to 621', doi: '10.1111/j.1365-3040.2007.01757.x', measured: 'review (abstract read)', value: 'qualitative', badge: 'SECONDARY', note: 'The review also says gm can change within seconds to minutes; that claim is contested (see the open question on fast changes).' },
    'gm.knauer': { claim: 'Across 563 studies and 617 species (unstressed leaves, gm standardised to 25 °C), the median crop gm was 0.26 mol m−2 s−1, which holds photosynthesis 20.9 % below its value with no mesophyll resistance (95 % CI 17.6 to 24.2 %). Rice 0.23, bean 0.24. The mesophyll limitation is 10 to 30 % in most herbaceous annuals and 25 to 50 % in woody evergreens; it falls below 10 % only when gm exceeds about 0.5. Raising crop gm from the median to the 75th percentile (0.26 to 0.42) could raise photosynthesis by about 8 %.', cite: 'Knauer J, Cuntz M, Evans JR, Niinemets Ü, Tosens T, Veromann Jürgenson LL, Werner C, Zaehle S (2022) New Phytol 236:357 to 368 (full text read)', doi: '10.1111/nph.18363', measured: 'data compilation of published gm, unstressed leaves', value: '0.26 mol m−2 s−1; 20.9 %; 10 to 30 % herbs; 25 to 50 % woody evergreens', badge: 'MEASURED', note: 'Compiled values. The isotope method tended to give higher gm than fluorescence or curve fitting. The 8 % gain is a model estimate in the paper and does not address water.' },
    'gm.tomas': { claim: 'In 15 species (5 annual herbs, 10 broadleaved trees) mesophyll cell walls were 113.6 to 543.7 nm thick, thinnest in herbs and thickest in evergreens. Chloroplast surface facing the air spaces was 6 to 19.7 m2 per m2 of leaf. The CO2 drop from air spaces to chloroplasts (Ci − Cc) was 40 to 67 µmol mol−1 in herbs and 112 to 240 in woody species. Limitations: stomatal 19 to 65 %, mesophyll 13 to 64 %, biochemical 6 to 33 %.', cite: 'Tomás M, Flexas J, Copolovici L, Galmés J, Hallik L, Medrano H, Ribas Carbó M, Tosens T, Vislap V, Niinemets Ü (2013) J Exp Bot 64:2269 to 2281 (full text read)', doi: '10.1093/jxb/ert086', measured: 'growth room plants, measured at 25 °C, 1500 µmol m−2 s−1 light, Ca 385 µmol mol−1; gm by gas exchange plus chlorophyll fluorescence', value: 'wall 113.6 to 543.7 nm; Sc/S 6 to 19.7 m2 m−2; Ci − Cc 40 to 67 (herbs), 112 to 240 (woody) µmol mol−1', badge: 'MEASURED', note: 'Measured gm varied 24 fold among the species. Which species gave which value is not given here.' },
    'gm.parts': { claim: 'How the mesophyll resistance splits between air spaces, cell wall, membranes and the watery interior is model dependent, because wall porosity and membrane CO2 permeability are poorly measured. One anatomy model gave air spaces 4 to 22 %, cell wall 4 to 70 %, membranes at most 8 % (with an assumed permeability) and stroma up to about 43 % in thin leaves; with a lower membrane permeability, membranes alone would exceed 40 %.', cite: 'Tomás M et al. (2013) J Exp Bot 64:2269 to 2281; Evans JR, Kaldenhoff R, Genty B, Terashima I (2009) J Exp Bot 60:2235 to 2248; Evans JR (2021) New Phytol 229:1864 to 1876', doi: '10.1093/jxb/ert086', doi2: '10.1111/nph.16968', measured: 'anatomy models with assumed wall porosity and membrane permeability', value: 'model shares', badge: 'OPEN QUESTION', note: 'Evans 2021: effective wall porosity has never been measured, and measured membrane CO2 permeabilities are too low to explain observed photosynthesis. This workstation therefore draws the mesophyll drop as one ramp from wall to stroma, without splitting it.' },
    'gm.evans': { claim: 'gm rises with the chloroplast surface exposed to the air spaces per leaf area, and falls with thicker walls; it also depends on effective wall porosity and membrane CO2 permeability. Apparent gm can change with CO2 and light while the cellular conductance stays the same.', cite: 'Evans JR (2021) New Phytol 229:1864 to 1876', doi: '10.1111/nph.16968', measured: 'review (abstract read)', value: 'qualitative', badge: 'SECONDARY', note: 'Knauer et al. 2022: wall thickness and chloroplast surface explained about half of gm variation across all data, but little in annual herbs, where leaf N and K related better.' },
    'gm.flexas2013': { claim: 'From Fick’s law, intrinsic water use efficiency (A/gs) should follow the ratio gm/gs, not gm alone. This is often, but not always, seen in data, because Rubisco capacity also matters. Simultaneous gains in photosynthesis and water use efficiency have rarely been achieved by selection, and not yet in plants engineered for higher gm or lower gs.', cite: 'Flexas J, Niinemets Ü, Gallé A, et al. (2013) Photosynth Res 117:45 to 59', doi: '10.1007/s11120-013-9844-z', measured: 'review (abstract read)', value: 'qualitative', badge: 'SECONDARY', note: 'The practical gain is still open. In tobacco with altered Rubisco, gm changed while gs did not, so gm/gs shifted (Galmés et al. 2013).' },
    'gm.aqp': { claim: 'Aquaporins and gm, both sides. For: in tobacco, less of the aquaporin NtAQP1 lowered gm by about 30 % and light saturated photosynthesis by 13 %; more raised gm by about 20 % and photosynthesis by 20 % (Flexas et al. 2006); NtAQP1 sits in the plasma membrane and inner chloroplast envelope, and less of it cut leaf internal CO2 conductance by about a fifth (Uehlein et al. 2008). Against: in Arabidopsis, knocking out pip1;2, pip1;3 or pip2;6 did not change gm measured four ways (Kromdijk et al. 2020). Plants carry 7 to 28 PIP aquaporin genes; only a few have been shown to carry CO2 (Groszmann et al. 2017).', cite: 'Flexas J et al. (2006) Plant J 48:427 to 439; Uehlein N et al. (2008) Plant Cell 20:648 to 657; Kromdijk J, Głowacka K, Long SP (2020) J Exp Bot 71:318 to 329; Groszmann M, Osborn HL, Evans JR (2017) Plant Cell Environ 40:938 to 961', doi: '10.1111/j.1365-313X.2006.02879.x', doi2: '10.1093/jxb/erz442', measured: 'transgenic tobacco and Arabidopsis knock outs; gm by fluorescence, 13C discrimination and other methods', value: 'tobacco gm −30 % and +20 %; Arabidopsis no change', badge: 'OPEN QUESTION', note: 'Changing one aquaporin changed gm in tobacco but not in Arabidopsis knock outs, so how much aquaporins set gm is still open.' },
    'gm.ca': { claim: 'Carbonic anhydrase (CA), the enzyme that turns CO2 and bicarbonate into each other, both sides. Tobacco with chloroplast CA cut to about 8 % of normal had the same A, E, gs and Ci; CO2 at Rubisco was calculated only 13 to 22 µmol mol−1 lower (Williams et al. 1996). A later review argues that CA does lower the resistance inside mesophyll cells (Momayyezi et al. 2020).', cite: 'Williams TG, Flanagan LB, Coleman JR (1996) Plant Physiol 112:319 to 326; Momayyezi M, McKown AD, Bell SCS, Guy RD (2020) Plant J 101:831 to 844', doi: '10.1104/pp.112.1.319', doi2: '10.1111/tpj.14638', measured: 'antisense tobacco, gas exchange and isotope discrimination (Williams); review (Momayyezi)', value: 'CA about 8 % of wild type; Cc 13 to 22 µmol mol−1 lower', badge: 'OPEN QUESTION', note: 'Tomás et al. 2013 left CA out of their anatomy model, citing little evidence.' },
    'gm.aba': { claim: 'In Nicotiana plumbaginifolia, drought lowered gm as leaf ABA rose in the wild type, but neither ABA nor gm changed in the ABA deficient mutant aba1; sprayed ABA lowered gm in both (Mizokami et al. 2015). In another study applied ABA closed stomata without changing gm (Vrábl et al. 2009).', cite: 'Mizokami Y, Noguchi K, Kojima M, Sakakibara H, Terashima I (2015) Plant Cell Environ 38:388 to 398; Vrábl D, Vasková M, Hronková M, Flexas J, Šantrůček J (2009) J Exp Bot 60:2315 to 2323', doi: '10.1111/pce.12394', doi2: '10.1093/jxb/erp115', measured: 'drought and applied ABA, single species studies', value: 'qualitative', badge: 'OPEN QUESTION', note: 'Both are single species studies; they disagree.' },
    'gm.grassi': { claim: 'In ash and oak trees in a forest plantation, mild to moderate drought (gsw above 100 mmol m−2 s−1) cut light saturated photosynthesis about two thirds through the stomata; under severe stress (gsw below 60) the non stomatal part nearly equalled the stomatal part, and within it gm dominated except at the most severe stress.', cite: 'Grassi G, Magnani F (2005) Plant Cell Environ 28:834 to 849 (abstract)', doi: '10.1111/j.1365-3040.2005.01333.x', measured: 'Fraxinus and Quercus, field, 2001 to 2003', value: 'about two thirds stomatal at mild stress', badge: 'MEASURED', note: 'This paper set out the split of limitation into stomatal, mesophyll and biochemical parts used here.' },
    'gm.lim': { claim: 'The live split asks: if photosynthesis is held back, how much of that is the stomata, how much the mesophyll, and how much the biochemistry? With gsc = gs/1.6, 1/gtot = 1/gsc + 1/gm and d = dA/dCc at the current leaf: stomatal = (gtot/gsc) d/(gtot + d); mesophyll = (gtot/gm) d/(gtot + d); biochemical = gtot/(gtot + d). The three add to 100 %.', cite: 'Quantitative limitation analysis in the form of Grassi G, Magnani F (2005) Plant Cell Environ 28:834 to 849, as applied by Tomás M et al. (2013) J Exp Bot 64:2269 to 2281; computed from this page’s model leaf', doi: '10.1111/j.1365-3040.2005.01333.x', doi2: '10.1093/jxb/ert086', measured: 'calculation from the engine', value: 'live', badge: 'DERIVED', note: 'The model leaf has teaching values for Rubisco and electron transport (Plate IV), so the split is a model answer, not a measurement. d is taken one sided below the switch between Rubisco and light limitation.' },
    'gm.rel': { claim: 'Relative mesophyll limitation = 1 − A / A*, where A* is photosynthesis at the same Ci if Cc were equal to Ci (no mesophyll resistance). This is the measure Knauer et al. 2022 report (20.9 % at the median crop gm).', cite: 'Definition after Farquhar GD, Sharkey TD (1982) Annu Rev Plant Physiol 33:317 to 345, as applied to gm by Knauer J et al. (2022) New Phytol 236:357 to 368', doi: '10.1146/annurev.pp.33.060182.001533', doi2: '10.1111/nph.18363', measured: 'calculation from the engine', value: 'live', badge: 'DERIVED', note: 'The model leaf gives a smaller number than the compilation at the same gm, because its Rubisco capacity and leaf are teaching values.' },
    'gm.method': { claim: 'Nobody measures gm directly. It is calculated from gas exchange plus either chlorophyll fluorescence or carbon isotope discrimination (or from curve fitting alone, the least preferred), and each route can be biased, so good studies use two independent methods.', cite: 'Pons TL, Flexas J, von Caemmerer S, Evans JR, Genty B, Ribas Carbó M, Brugnoli E (2009) J Exp Bot 60:2217 to 2234', doi: '10.1093/jxb/erp081', measured: 'methods review (abstract read)', value: 'method', badge: 'SECONDARY', note: 'The variable J method of Harley et al. (1992) is one standard route.' },
    'gm.fast': { claim: 'Measured gm often appears to change with CO2 and light within minutes, but part or all of this may come from how gm is calculated. For: gm varied five to ninefold over Ci 50 to 1500 µmol mol−1 in six species (Flexas et al. 2007); with the isotope method it fell 26 to 40 % from 200 to 1000 ppm CO2, but only at 2 % O2 (Tazoe et al. 2011). Against: biased inputs give such responses even with a constant true gm (Gu and Sun 2014), and CO2 released by mitochondria makes gm look CO2 sensitive (Tholen et al. 2012).', cite: 'Flexas J et al. (2007) Plant Cell Environ 30:1284 to 1298; Tazoe Y et al. (2011) Plant Cell Environ 34:580 to 591; Gu L, Sun Y (2014) Plant Cell Environ 37:1231 to 1249; Tholen D et al. (2012) Plant Cell Environ 35:2087 to 2103', doi: '10.1111/j.1365-3040.2007.01700.x', doi2: '10.1111/pce.12232', measured: 'gas exchange with fluorescence or isotopes', value: 'five to ninefold; 26 to 40 %', badge: 'OPEN QUESTION', note: 'This model keeps gm constant with CO2 and light.' },
    'gm.temp': { claim: 'Warming from 15 to 40 °C raised gm two to threefold in tobacco, cotton, soybean and Eucalyptus pauciflora, but hardly changed it in wheat and Lophostemon confertus. gs and gm responded to temperature independently.', cite: 'von Caemmerer S, Evans JR (2015) Plant Cell Environ 38:629 to 637', doi: '10.1111/pce.12449', measured: 'isotope method, nine species', value: 'two to threefold, 15 to 40 °C, in some species', badge: 'MEASURED', note: 'This model keeps gm the same at every temperature.' },
    'gm.tough': { claim: 'Across 81 non stressed species gm fell as leaf dry mass per area rose, and the CO2 drop inside the leaf (Ci − Cc = A/gm) was larger in tougher leaves. In 35 ferns low gm was the main cause of low photosynthesis, with thick walls and few chloroplasts facing the air spaces; in most of 11 conifers studied the mesophyll, not the stomata, was the main brake.', cite: 'Niinemets Ü et al. (2009) J Exp Bot 60:2249 to 2270; Tosens T et al. (2016) New Phytol 209:1576 to 1590; Veromann Jürgenson LL et al. (2017) J Exp Bot 68:1639 to 1653', doi: '10.1093/jxb/erp036', doi2: '10.1111/nph.13719', measured: 'compilation (81 species); ferns; gymnosperms', value: 'qualitative', badge: 'MEASURED', note: 'Across land plants, mosses are held back mainly by the mesophyll, while flowering plants share the limitation among stomata, mesophyll and biochemistry (Gago et al. 2019, a review).' },
    'gm.drought': { claim: 'In field grapevines under slow drought, stomata closed first (gs, Ci, Cc and A fell while electron transport held); only at severe drought did gm also fall strongly, and much of what looked like damaged biochemistry was really the CO2 path inside the leaf closing. Across C3 plants, mild to rather severe drought and salinity mainly limit photosynthesis through gs and gm, not biochemical capacity.', cite: 'Flexas J, Bota J, Escalona JM, Sampol B, Medrano H (2002) Funct Plant Biol 29:461 to 471; Flexas J, Bota J, Loreto F, Cornic G, Sharkey TD (2004) Plant Biol 6:269 to 279', doi: '10.1071/PP01119', doi2: '10.1055/s-2004-820867', measured: 'field Vitis vinifera (qualitative); review', value: 'qualitative', badge: 'MEASURED', note: 'No single typical gm for grapevine is given here.' },
    'gm.psbs': { claim: 'In field grown tobacco engineered with more PsbS, stomata opened less in the light and the plants lost 25 % less water for each CO2 assimilated.', cite: 'Głowacka K, Kromdijk J, Kucera K, et al. (2018) Nat Commun 9:868', doi: '10.1038/s41467-018-03231-x', measured: 'field grown Nicotiana tabacum, PsbS up to 3.7 times wild type', value: '25 % less water per CO2', badge: 'MEASURED', note: 'A stomatal route to water use efficiency, the other door.' },
    'gm.roddy': { claim: 'Land plants typically lose a few hundred water molecules by transpiration for every CO2 they fix (roughly 200 to 400).', cite: 'Roddy AB (2023) J Biosci 48, article 21 (abstract; it cites a textbook for the range)', measured: 'review statement', value: 'about 200 to 400 water per CO2', badge: 'SECONDARY', note: 'This page computes its own number from the model leaf (DERIVED).' },
    'gm.serial': { claim: 'CO2 crosses the two doors one after the other, so their resistances add: 1/gtot = 1.6/gs + 1/gm. Each door costs its own drop: Ca − Ci = 1.6 A/gs and Ci − Cc = A/gm. Water vapour evaporates from the wet cell walls into the air spaces, so it leaves through the stomata only.', cite: 'Fick’s law for gases in series; the 1.6 is the ratio of diffusivities of water vapour and CO2 in air (Massman 1998); serial sum as used in the limitation analysis of Tomás et al. 2013', doi: '10.1016/S1352-2310(97)00391-9', doi2: '10.1093/jxb/ert086', measured: 'physics', value: '1.6', badge: 'DERIVED', note: 'Concentrations in the liquid part of the path are given as the gas phase mole fraction that would be in equilibrium with them, the usual convention for Cc.' }
  };
  Object.keys(EV).forEach(function (k) { if (!LP.evidence[k]) LP.evidence[k] = EV[k]; });
  [['10.1111/nph.18363', 'Knauer et al. 2022, New Phytol 236:357'], ['10.1111/j.1365-3040.2007.01757.x', 'Flexas et al. 2008, Plant Cell Environ 31:602'],
   ['10.1093/jxb/ert086', 'Tomás et al. 2013, J Exp Bot 64:2269'], ['10.1111/nph.16968', 'Evans 2021, New Phytol 229:1864'],
   ['10.1007/s11120-013-9844-z', 'Flexas et al. 2013, Photosynth Res 117:45'], ['10.1111/j.1365-313X.2006.02879.x', 'Flexas et al. 2006, Plant J 48:427'],
   ['10.1093/jxb/erz442', 'Kromdijk, Głowacka and Long 2020, J Exp Bot 71:318'], ['10.1104/pp.112.1.319', 'Williams, Flanagan and Coleman 1996, Plant Physiol 112:319'],
   ['10.1111/tpj.14638', 'Momayyezi et al. 2020, Plant J 101:831'], ['10.1111/pce.12394', 'Mizokami et al. 2015, Plant Cell Environ 38:388'],
   ['10.1093/jxb/erp115', 'Vrábl et al. 2009, J Exp Bot 60:2315'], ['10.1111/j.1365-3040.2005.01333.x', 'Grassi and Magnani 2005, Plant Cell Environ 28:834'],
   ['10.1146/annurev.pp.33.060182.001533', 'Farquhar and Sharkey 1982, Annu Rev Plant Physiol 33:317'], ['10.1093/jxb/erp081', 'Pons et al. 2009, J Exp Bot 60:2217'],
   ['10.1111/j.1365-3040.2007.01700.x', 'Flexas et al. 2007, Plant Cell Environ 30:1284'], ['10.1111/pce.12232', 'Gu and Sun 2014, Plant Cell Environ 37:1231'],
   ['10.1111/pce.12449', 'von Caemmerer and Evans 2015, Plant Cell Environ 38:629'], ['10.1093/jxb/erp036', 'Niinemets et al. 2009, J Exp Bot 60:2249'],
   ['10.1111/nph.13719', 'Tosens et al. 2016, New Phytol 209:1576'], ['10.1071/PP01119', 'Flexas et al. 2002, Funct Plant Biol 29:461'],
   ['10.1055/s-2004-820867', 'Flexas et al. 2004, Plant Biol 6:269'], ['10.1038/s41467-018-03231-x', 'Głowacka et al. 2018, Nat Commun 9:868'],
   ['10.1016/S1352-2310(97)00391-9', 'Massman 1998, Atmos Environ 32:1111'], ['10.1007/BF00384257', 'von Caemmerer and Farquhar 1981, Planta 153:376']].forEach(function (s) { if (!LP.sources[s[0]]) LP.sources[s[0]] = s[1]; });

  /* ------------------------------------------------------------ geometry of the path */
  var ZN = [
    { k: 'air', n: 'outside air', s: 'air' }, { k: 'stoma', n: 'stoma', s: 'stoma' }, { k: 'airsp', n: 'air space', s: 'air space' },
    { k: 'wall', n: 'cell wall', s: 'wall' }, { k: 'pm', n: 'membrane', s: 'membrane' }, { k: 'cyto', n: 'cytosol', s: 'cytosol' },
    { k: 'env', n: 'envelope', s: 'envelope' }, { k: 'stroma', n: 'stroma, Rubisco', s: 'stroma' }
  ];
  var FR = { d: [0, 0.15, 0.22, 0.42, 0.47, 0.49, 0.60, 0.63, 1], m: [0, 0.14, 0.22, 0.38, 0.44, 0.47, 0.58, 0.62, 1] };
  function layout(w, h) {
    var mob = w < 560, f = mob ? FR.m : FR.d, L = { w: w, h: h, mob: mob, z: {} };
    L.top = mob ? 24 : 26; L.sh = mob ? 138 : 150; L.sb = L.top + L.sh;
    L.n1 = L.sb + (mob ? 12 : 14); L.n2 = L.sb + (mob ? 25 : 28);
    L.p0 = L.sb + (mob ? 46 : 52); L.p1 = h - 14;
    ZN.forEach(function (z, i) { L.z[z.k] = { x0: f[i] * w, x1: f[i + 1] * w, i: i }; });
    var st = L.z.stroma; L.rub = [];
    var seed = 11; function sr() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    for (var i = 0; i < (mob ? 4 : 6); i++) L.rub.push({ x: lerp(st.x0 + 22, st.x1 - 16, (i + 0.5) / (mob ? 4 : 6)) + (sr() - 0.5) * 10, y: lerp(L.top + 24, L.sb - 26, sr()) });
    return L;
  }
  /* CO2 (µmol mol−1) at a position along the path: Ca outside, a drop across the pore, Ci in the air space, one ramp
     from wall to stroma (the split among wall, membranes and cytosol is model dependent, so it is not drawn), Cc */
  function cAt(L, r, x) {
    var z = L.z, Ca = r.Ca || 0, Ci = r.Ci || 0, Cc = r.Cc != null ? r.Cc : Ci;
    if (x <= z.stoma.x0) return Ca;
    if (x <= z.stoma.x1) return lerp(Ca, Ci, (x - z.stoma.x0) / (z.stoma.x1 - z.stoma.x0));
    if (x <= z.wall.x0) return Ci;
    if (x <= z.stroma.x0) return lerp(Ci, Cc, (x - z.wall.x0) / (z.stroma.x0 - z.wall.x0));
    return Cc;
  }

  /* ------------------------------------------------------------ the animated path */
  var TS = { lay: null, amb: [], co2: [], h2o: [], fx: [], acc: { c: 0, w: 0 }, namer: null };
  var KC = 0.6, KW = 0.6 / 100;   /* the same bead scale as the stoma theatre (5.1, key tr.scale) */
  var BOX = ['air', 'airsp', 'cyto', 'stroma'];
  function gapOf(L, gs) { return (L.mob ? 4 : 5) + clamp((gs || 0) / 0.8, 0, 1) * L.sh * 0.5; }
  function box(L, k) { var z = L.z[k]; return [z.x0 + 6, L.top + 8, z.x1 - 6, L.sb - 8]; }
  function step(dt) {
    var L = TS.lay; if (!L) return;
    var r = R(), A = r.A || 0, E = r.E || 0, z = L.z, mid = (L.top + L.sb) / 2, gap = gapOf(L, r.gs);
    function porey() { return mid + (rnd() - 0.5) * gap * 0.7; }
    /* CO2 beads in (net uptake), out in the dark */
    TS.acc.c += Math.abs(A) * KC * dt;
    var n = 0;
    while (TS.acc.c >= 1 && n < 4) {
      TS.acc.c -= 1; n++;
      var tg = L.rub[Math.floor(rnd() * L.rub.length)];
      var pts = [[-6, lerp(L.top + 10, L.sb - 10, rnd())], [(z.stoma.x0 + z.stoma.x1) / 2, porey()], [lerp(z.airsp.x0, z.airsp.x1, 0.5 + (rnd() - 0.5) * 0.6), lerp(L.top + 14, L.sb - 14, rnd())],
        [z.wall.x0, lerp(L.top + 16, L.sb - 16, rnd())], [lerp(z.cyto.x0, z.cyto.x1, 0.5), lerp(L.top + 16, L.sb - 16, rnd())], [tg.x, tg.y]];
      if (A < 0) pts.reverse();
      TS.co2.push({ pts: pts, p: 0, dur: 3.4 + rnd() * 0.6, ang: rnd() * TAU, inn: A > 0 });
    }
    if (TS.acc.c > 3) TS.acc.c = 3;
    /* water beads: evaporate from the wet wall face into the air space and leave by the pore; they never pass door 2 */
    TS.acc.w += E * 1000 * KW * dt;
    n = 0;
    while (TS.acc.w >= 1 && n < 5) {
      TS.acc.w -= 1; n++;
      TS.h2o.push({ pts: [[z.wall.x0 - 2, lerp(L.top + 12, L.sb - 12, rnd())], [lerp(z.airsp.x0, z.airsp.x1, 0.5 + (rnd() - 0.5) * 0.6), lerp(L.top + 14, L.sb - 14, rnd())], [(z.stoma.x0 + z.stoma.x1) / 2, porey()], [-8, lerp(L.top + 10, L.sb - 10, rnd())]], p: 0, dur: 2.6 + rnd() * 0.5, ang: rnd() * TAU });
    }
    if (TS.acc.w > 3) TS.acc.w = 3;
    function adv(q) { q.p += dt / q.dur; q.ang += dt * 1.2; return q.p < 1; }
    TS.co2 = TS.co2.filter(function (q) { if (adv(q)) return true; if (q.inn) TS.fx.push({ x: q.pts[q.pts.length - 1][0], y: q.pts[q.pts.length - 1][1], t: 0, dur: 0.6 }); return false; });
    TS.h2o = TS.h2o.filter(adv);
    TS.fx = TS.fx.filter(function (f) { f.t += dt; return f.t < f.dur; });
    /* ambient CO2: number per box in proportion to the local concentration (the staircase below, in molecules) */
    BOX.forEach(function (k) {
      var b = box(L, k), c = cAt(L, r, (b[0] + b[2]) / 2), want = Math.round(clamp(c / 420 * (b[2] - b[0]) * (b[3] - b[1]) / (L.mob ? 950 : 1150), 0, 40));
      var have = TS.amb.filter(function (a) { return a.k === k && !a.dying; });
      while (have.length < want) { var a = { k: k, x: lerp(b[0], b[2], rnd()), y: lerp(b[1], b[3], rnd()), vx: (rnd() - 0.5) * 10, vy: (rnd() - 0.5) * 10, al: 0, ang: rnd() * TAU, b: b }; TS.amb.push(a); have.push(a); }
      for (var i = want; i < have.length; i++) have[i].dying = true;
    });
    TS.amb = TS.amb.filter(function (a) {
      a.al = a.dying ? a.al - dt * 1.5 : Math.min(1, a.al + dt);
      a.vx += (rnd() - 0.5) * 22 * dt; a.vy += (rnd() - 0.5) * 22 * dt; a.vx *= 0.97; a.vy *= 0.97; a.x += a.vx * dt; a.y += a.vy * dt; a.ang += dt;
      var b = a.b; if (a.x < b[0] || a.x > b[2]) a.vx *= -1; if (a.y < b[1] || a.y > b[3]) a.vy *= -1;
      a.x = clamp(a.x, b[0], b[2]); a.y = clamp(a.y, b[1], b[3]);
      return a.al > 0;
    });
  }
  function prewarm(sec) { for (var i = 0, n = Math.round(sec / 0.05); i < n; i++) step(0.05); }
  function along(pts, p) { var s = pts.length - 1, f = clamp(p, 0, 0.9999) * s, i = Math.floor(f), t = f - i; return { x: lerp(pts[i][0], pts[i + 1][0], t), y: lerp(pts[i][1], pts[i + 1][1], t) }; }

  var COL = {
    light: { air: '#eef3f6', airsp: '#f3f6e8', epi: '#e8eadc', wall: '#e3d3a4', hatch: 'rgba(120,96,40,.45)', mem: '#6f9fd8', cyto: '#e2efe9', stroma: '#e3ead0', thy: 'rgba(61,143,90,.35)', rub: '#6f8f2f', rubHi: '#e6f2c9', rubLo: '#3d5418', guard: '#7fb46f', guardLo: '#4f8a4a', ink: '#2a231c', ink2: '#5e5141', grid: 'rgba(42,35,28,.13)', d1: '#2b5fa4', d2: '#2f7a3a' },
    dark: { air: '#0d1520', airsp: '#13241a', epi: '#2a3a32', wall: '#4a4128', hatch: 'rgba(230,205,140,.35)', mem: '#5d9be6', cyto: '#10242a', stroma: '#0f2018', thy: 'rgba(95,190,120,.32)', rub: '#9ccc5a', rubHi: '#e8ffd0', rubLo: '#3e5a1c', guard: '#4f9a5a', guardLo: '#2f6a3a', ink: '#ece6da', ink2: '#b3aca0', grid: 'rgba(236,230,218,.14)', d1: '#7cb8ff', d2: '#8fd19e' }
  };
  function draw(c, w, h, t, dt, info) {
    if (!TS.lay || TS.lay.w !== w || TS.lay.h !== h) { TS.lay = layout(w, h); TS.amb = []; TS.co2 = []; TS.h2o = []; TS.fx = []; prewarm(6); }
    if (dt > 0) step(dt);
    var L = TS.lay, z = L.z, r = R(), m = LP.mol, dk = info.dark, K = COL[dk ? 'dark' : 'light'], mob = L.mob, tr = tier();
    var P = Object.assign({}, m.palette(dk));
    c.clearRect(0, 0, w, h);
    c.fillStyle = dk ? '#0b1015' : '#faf6ec'; c.fillRect(0, 0, w, h);
    /* zones */
    function zr(k, col) { c.fillStyle = col; c.fillRect(z[k].x0, L.top, z[k].x1 - z[k].x0, L.sh); }
    zr('air', K.air); zr('airsp', K.airsp); zr('cyto', K.cyto); zr('stroma', K.stroma); zr('pm', K.cyto); zr('env', K.stroma);
    /* stroma: faint thylakoid stacks */
    c.fillStyle = K.thy;
    for (var s = 0; s < (mob ? 2 : 3); s++) { var gx = lerp(z.stroma.x0 + 30, z.stroma.x1 - 30, (s + 0.5) / (mob ? 2 : 3)); for (var j = 0; j < 5; j++) m.rrect(c, gx - 14, L.sb - 30 - j * 5, 28, 3.2, 1.6), c.fill(); }
    /* the epidermis with the pore */
    var mid = (L.top + L.sb) / 2, gap = gapOf(L, r.gs), ex0 = z.stoma.x0 + 3, ex1 = z.stoma.x1 - 3;
    c.fillStyle = K.air; c.fillRect(z.stoma.x0, L.top, z.stoma.x1 - z.stoma.x0, L.sh);
    c.fillStyle = K.epi; c.fillRect(ex0, L.top, ex1 - ex0, mid - gap / 2 - L.top); c.fillRect(ex0, mid + gap / 2, ex1 - ex0, L.sb - mid - gap / 2);
    var gw = (ex1 - ex0) * 0.62, gh = Math.min(30, L.sh * 0.2);
    [-1, 1].forEach(function (sd) {
      var gy = mid + sd * (gap / 2 + gh / 2 - 2), g = c.createRadialGradient((ex0 + ex1) / 2 - 2, gy - 2, 1, (ex0 + ex1) / 2, gy, gw);
      g.addColorStop(0, dk ? '#7fd08a' : '#bfe6b0'); g.addColorStop(1, K.guardLo);
      c.fillStyle = g; c.beginPath(); c.ellipse((ex0 + ex1) / 2, gy, gw / 2 + 2, gh / 2, 0, 0, TAU); c.fill();
    });
    /* cell wall: hatched */
    c.fillStyle = K.wall; c.fillRect(z.wall.x0, L.top, z.wall.x1 - z.wall.x0, L.sh);
    c.save(); c.beginPath(); c.rect(z.wall.x0, L.top, z.wall.x1 - z.wall.x0, L.sh); c.clip(); c.strokeStyle = K.hatch; c.lineWidth = 1;
    for (var y = L.top - 20; y < L.sb + 20; y += 7) { c.beginPath(); c.moveTo(z.wall.x0 - 4, y); c.lineTo(z.wall.x1 + 4, y + 10); c.stroke(); }
    c.restore();
    /* membranes: plasma membrane one bilayer, envelope two */
    function bil(x) { c.strokeStyle = K.mem; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x - 1.6, L.top); c.lineTo(x - 1.6, L.sb); c.moveTo(x + 1.6, L.top); c.lineTo(x + 1.6, L.sb); c.stroke(); }
    bil((z.pm.x0 + z.pm.x1) / 2); bil(z.env.x0 + 3); bil(z.env.x1 - 3);
    /* Rubisco */
    L.rub.forEach(function (q, i) { for (var k = 0; k < 4; k++) m.ball(c, q.x + (k % 2 ? 4 : -4), q.y + (k < 2 ? -4 : 4), mob ? 5 : 6, K.rub, K.rubHi, K.rubLo, 0.95); });
    /* door brackets on top */
    var fs = mob ? 10 : 11.5, blk = [];
    var m0 = m, mt = function (x, y, tx, o) { var rr = m0.tag(c, P, x, y, tx, Object.assign({ size: fs }, o || {})); if (rr) blk.push({ x: rr.x - 2, y: rr.y - 2, w: rr.w + 4, h: rr.h + 4 }); return rr; };
    c.strokeStyle = K.d1; c.lineWidth = 2; c.beginPath(); c.moveTo(z.stoma.x0, L.top - 3); c.lineTo(z.stoma.x0, L.top - 7); c.lineTo(z.stoma.x1, L.top - 7); c.lineTo(z.stoma.x1, L.top - 3); c.stroke();
    c.strokeStyle = K.d2; c.beginPath(); c.moveTo(z.wall.x0, L.top - 3); c.lineTo(z.wall.x0, L.top - 7); c.lineTo(z.stroma.x0, L.top - 7); c.lineTo(z.stroma.x0, L.top - 3); c.stroke();
    mt(Math.max(4, (z.stoma.x0 + z.stoma.x1) / 2 - (mob ? 20 : 34)), L.top - 15, mob ? 'Door 1' : 'Door 1: stomata', { ink: K.d1 });
    mt((z.wall.x0 + z.stroma.x0) / 2, L.top - 15, mob ? 'Door 2' : 'Door 2: the wet inside', { ink: K.d2, align: 'center' });
    /* zone names, two staggered rows so neighbours never touch */
    c.font = '600 ' + (mob ? 9.5 : 11) + 'px system-ui,-apple-system,Segoe UI,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    ZN.forEach(function (q, i) {
      var zz = z[q.k], cx = (zz.x0 + zz.x1) / 2, yy = i % 2 ? L.n2 : L.n1, tx = mob ? q.s : q.n;
      var tw = c.measureText(tx).width; cx = clamp(cx, tw / 2 + 3, w - tw / 2 - 3);
      c.strokeStyle = K.grid; c.lineWidth = 1; c.beginPath(); c.moveTo((zz.x0 + zz.x1) / 2, L.sb); c.lineTo((zz.x0 + zz.x1) / 2, yy - 6); c.stroke();
      c.fillStyle = K.ink2; c.fillText(tx, cx, yy);
    });
    /* molecules */
    var mr = mob ? 3.3 : 4.1, nm = [];
    TS.amb.forEach(function (a) { m.co2(c, P, a.x, a.y, mr * 0.8, a.ang, a.al * 0.5); });
    TS.h2o.forEach(function (q) { var p = along(q.pts, q.p), al = q.p > 0.85 ? (1 - q.p) / 0.15 : Math.min(1, q.p * 6); m.water(c, P, p.x, p.y, mr, q.ang, al); if (q.p > 0.15 && q.p < 0.8) nm.push({ k: 'H₂O', key: q, t: 'H₂O', x: p.x, y: p.y, r: mr * 1.5, a: al, age: q.p - 0.15 }); });
    TS.co2.forEach(function (q) { var p = along(q.pts, q.p), al = q.p < 0.05 ? q.p / 0.05 : 1; m.co2(c, P, p.x, p.y, mr, q.ang, al); if (q.p < 0.85) nm.push({ k: 'CO₂', key: q, t: 'CO₂', x: p.x, y: p.y, r: mr * 1.3, a: al, age: q.p }); });
    TS.fx.forEach(function (f) { var k = f.t / f.dur; c.strokeStyle = K.rub; c.globalAlpha = 1 - k; c.lineWidth = 2; c.beginPath(); c.arc(f.x, f.y, 4 + 9 * k, 0, TAU); c.stroke(); c.globalAlpha = 1; });
    if (tr > 1 && !mob) mt(z.stroma.x1 - 8, L.top + 12, 'Rubisco fixes CO₂ here', { align: 'right', alpha: 0.92 });
    if (!mob) mt(z.wall.x0 - 6, L.sb - 12, 'water evaporates from the wet wall', { align: 'right', alpha: 0.92, ink: molc('h2o', dk) });
    /* the staircase */
    var Ca = r.Ca || 420, Ci = r.Ci || 0, Cc = r.Cc != null ? r.Cc : Ci, ymax = Math.max(200, Ca * 1.22);
    function Y(v) { return L.p1 - (L.p1 - L.p0) * clamp(v, 0, ymax) / ymax; }
    var step0 = ymax > 900 ? 400 : (ymax > 500 ? 200 : 100);
    c.font = '500 ' + (mob ? 9.5 : 10.5) + 'px system-ui,sans-serif'; c.textAlign = 'left'; c.textBaseline = 'middle';
    for (var v = 0; v <= ymax; v += step0) { c.strokeStyle = K.grid; c.lineWidth = 1; c.beginPath(); c.moveTo(0, Y(v)); c.lineTo(w, Y(v)); c.stroke(); if (v > 0 && Y(v) > L.p0 + 18 && Math.abs(Y(v) - Y(Ca)) > 14) { c.fillStyle = K.ink2; c.fillText(String(v), 3, Y(v) - 6); } }
    c.fillStyle = K.ink2; c.font = '600 ' + (mob ? 9.5 : 11) + 'px system-ui,sans-serif'; c.fillText(mob ? 'CO₂ at each stop, µmol mol⁻¹' : 'CO₂ at each stop on the way, µmol mol⁻¹', 3, L.p0 + 5);
    var xs = [0, z.stoma.x0, z.stoma.x1, z.wall.x0, z.stroma.x0, w], ys = [Ca, Ca, Ci, Ci, Cc, Cc], col = molc('co2', dk);
    c.beginPath(); c.moveTo(0, Y(0)); xs.forEach(function (x, i) { c.lineTo(x, Y(ys[i])); }); c.lineTo(w, Y(0)); c.closePath();
    c.globalAlpha = dk ? 0.22 : 0.16; c.fillStyle = col; c.fill(); c.globalAlpha = 1;
    c.beginPath(); xs.forEach(function (x, i) { c[i ? 'lineTo' : 'moveTo'](x, Y(ys[i])); }); c.strokeStyle = col; c.lineWidth = 3; c.lineJoin = 'round'; c.stroke();
    /* drops */
    function dropArrow(x, a, b, cl) { if (Math.abs(Y(a) - Y(b)) < 8) return; m.arrow(c, x, Y(a) + 2, x, Y(b) - 2, 1.6, cl, 0.95); }
    dropArrow(z.stoma.x1 + 5, Ca, Ci, K.d1); dropArrow(z.stroma.x0 + 6, Ci, Cc, K.d2);
    var t1 = tr === 1, lab = function (k, v) { return (t1 ? k[0] : k[1]) + ' ' + fmt(v, 0); };
    var yb = function (v) { return Math.min(L.p1 - 10, Y(v) + 13); };
    mt(clamp((z.air.x0 + z.air.x1) / 2, 4, w), yb(Ca), lab(['outside', 'Ca'], Ca), { align: 'center' });
    mt((z.airsp.x0 + z.airsp.x1) / 2, yb(Ci), lab(['air space', 'Ci'], Ci), { align: 'center' });
    mt(Math.min(w - 6, (z.stroma.x0 + z.stroma.x1) / 2 + (mob ? 10 : 0)), yb(Cc), lab(['at Rubisco', 'Cc'], Cc), { align: 'center' });
    mt(Math.min(z.stoma.x1 + 10, w - 60), Math.max(L.p0 + 16, Y(Ca) - 13), (mob ? '' : 'drop at door 1: ') + MINUS + fmt(Ca - Ci, 0), { ink: K.d1, size: fs - 0.5 });
    mt(Math.min(z.stroma.x0 + 12, w - 60), Math.max(L.p0 + 16, Y(Ci) - 13), (mob ? '' : 'drop at door 2: ') + MINUS + fmt(Ci - Cc, 0), { ink: K.d2, size: fs - 0.5 });
    (TS.namer = TS.namer || (LP.names2d ? LP.names2d() : null)) && TS.namer(c, P, w, L.sb, nm.filter(function (d) { return d.y < L.sb - 6 && d.y > L.top; }), blk, { kinds: { 'H₂O': { maxAge: 0.3 }, 'CO₂': { maxAge: 0.3 } } });
  }

  /* ------------------------------------------------------------ the A against E plot */
  var CUR = { key: '', gsc: null, gmc: null };
  function curves() {
    var st = LP.state, r = R();
    var key = [st.T, st.Ca, st.O2, st.leaf, st.ppfd, JSON.stringify(st.spectrum), st.Vcmax25, st.Jmax25, st.dcmu, st.uncoupler, st.vpd, st.cyclicScale, st.npqScale, st.hPerATP, st.gm, st.gmInf, Math.round((r.gs || 0) * 1000)].join('|');
    if (key === CUR.key) return CUR;
    CUR.key = key;
    var base = {}; Object.keys(st).forEach(function (k) { base[k] = st[k]; }); delete base.ciFixed; base.stomata = 'fixed';
    CUR.gsc = LP.range(0.01, 0.8, 34).map(function (g) { var o = Object.assign({}, base, { gs: g }); return { g: g, r: LP.solve(o) }; });
    var gsNow = r.gs || 0.15;
    CUR.gmc = [0.02, 0.04, 0.06, 0.09, 0.12, 0.16, 0.2, 0.26, 0.33, 0.42, 0.52, 0.65, 0.8, 1.0].map(function (g) { var o = Object.assign({}, base, { gs: gsNow, gm: g, gmInf: false }); return { g: g, r: LP.solve(o) }; });
    CUR.inf = LP.solve(Object.assign({}, base, { gs: gsNow, gmInf: true }));
    return CUR;
  }
  function plotSVG() {
    var dk = dark(), r = R(), K = COL[dk ? 'dark' : 'light'], cv = curves(), mob = (document.documentElement.clientWidth || 800) < 560;
    var W = 340, H = 250, l = 42, rr = 12, t = 26, b = 40, f = 11;
    var Emax = Math.max(1, Math.ceil(Math.max.apply(null, cv.gsc.map(function (q) { return q.r.E; })) / 2) * 2);
    var Amax = Math.max(5, Math.ceil(Math.max(cv.inf.A, Math.max.apply(null, cv.gsc.map(function (q) { return q.r.A; }))) / 5) * 5);
    function X(v) { return l + (W - l - rr) * clamp(v, 0, Emax) / Emax; }
    function Yv(v) { return t + (H - t - b) * (1 - clamp(v, 0, Amax) / Amax); }
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Carbon in against water out: opening the stomata moves the leaf up and to the right along a curve; opening the mesophyll moves it straight up" style="width:100%;height:auto;display:block;font-family:system-ui,sans-serif">';
    var ink = K.ink2, grid = K.grid;
    var as = Amax > 20 ? 10 : 5; for (var a = 0; a <= Amax; a += as) s += '<line x1="' + l + '" x2="' + (W - rr) + '" y1="' + Yv(a) + '" y2="' + Yv(a) + '" stroke="' + grid + '"/><text x="' + (l - 5) + '" y="' + (Yv(a) + 4) + '" text-anchor="end" font-size="' + f + '" fill="' + ink + '">' + a + '</text>';
    var es = Emax > 8 ? 4 : (Emax > 4 ? 2 : 1); for (var e = 0; e <= Emax; e += es) s += '<text x="' + X(e) + '" y="' + (H - b + 15) + '" text-anchor="middle" font-size="' + f + '" fill="' + ink + '">' + e + '</text>';
    s += '<text x="' + ((l + W) / 2) + '" y="' + (H - 6) + '" text-anchor="middle" font-size="' + f + '" fill="' + ink + '">Water out, E (mmol m⁻² s⁻¹)</text>';
    s += '<text x="' + l + '" y="13" font-size="' + (f + 0.5) + '" font-weight="600" fill="' + K.ink + '">Carbon in, A (µmol m⁻² s⁻¹)</text>';
    var p1 = cv.gsc.map(function (q, i) { return (i ? 'L' : 'M') + X(q.r.E).toFixed(1) + ' ' + Yv(q.r.A).toFixed(1); }).join('');
    s += '<path d="' + p1 + '" fill="none" stroke="' + K.d1 + '" stroke-width="2.6"/>';
    var p2 = cv.gmc.map(function (q, i) { return (i ? 'L' : 'M') + X(q.r.E).toFixed(1) + ' ' + Yv(q.r.A).toFixed(1); }).join('');
    s += '<path d="' + p2 + '" fill="none" stroke="' + K.d2 + '" stroke-width="4" stroke-linecap="round"/>';
    if (tier() > 2) s += '<circle cx="' + X(cv.inf.E) + '" cy="' + Yv(cv.inf.A) + '" r="4" fill="none" stroke="' + K.d2 + '" stroke-width="1.6" stroke-dasharray="2 2"/><text x="' + (X(cv.inf.E) + 7) + '" y="' + (Yv(cv.inf.A) + 4) + '" font-size="' + (f - 1) + '" fill="' + K.d2 + '">gm infinite</text>';
    /* labels at the curve ends, kept off the dot */
    var gEnd = cv.gsc[cv.gsc.length - 1].r, mEnd = cv.gmc[cv.gmc.length - 1].r, mBeg = cv.gmc[0].r;
    s += '<text x="' + (X(gEnd.E) - 2) + '" y="' + (Yv(gEnd.A) + 16) + '" text-anchor="end" font-size="' + f + '" font-weight="600" fill="' + K.d1 + '">open the stomata →</text>';
    var mx = X(mEnd.E), right = mx < W * 0.62, ym = (Yv(mBeg.A) + Yv(r.A)) / 2;
    s += '<text x="' + (mx + (right ? 8 : -8)) + '" y="' + (ym - 6) + '" text-anchor="' + (right ? 'start' : 'end') + '" font-size="' + f + '" font-weight="600" fill="' + K.d2 + '">↑ open door 2</text>';
    s += '<text x="' + (mx + (right ? 8 : -8)) + '" y="' + (ym + 8) + '" text-anchor="' + (right ? 'start' : 'end') + '" font-size="' + (f - 1) + '" fill="' + K.d2 + '">same water</text>';
    s += '<circle cx="' + X(r.E) + '" cy="' + Yv(r.A) + '" r="6.5" fill="' + K.ink + '" stroke="' + (dk ? '#0b1015' : '#fff') + '" stroke-width="2"/>';
    return s + '</svg>';
  }

  /* ------------------------------------------------------------ limitation split */
  var TOMAS = { s: [19, 65], m: [13, 64], b: [6, 33] };
  function limSVG() {
    var dk = dark(), r = R(), K = COL[dk ? 'dark' : 'light'], L3 = r.lim3, W = 340, H = 196, l = 104, rr = 34, f = 11;
    function X(v) { return l + (W - l - rr) * clamp(v, 0, 100) / 100; }
    var rows = [['s', 'stomata', K.d1], ['m', 'mesophyll', K.d2], ['b', 'biochemistry', dk ? '#e0b96a' : '#8a5a12']];
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="How much each part holds photosynthesis back: model values as dots, the measured ranges in 15 species as bands" style="width:100%;height:auto;display:block;font-family:system-ui,sans-serif">';
    [0, 25, 50, 75, 100].forEach(function (v) { s += '<line x1="' + X(v) + '" x2="' + X(v) + '" y1="22" y2="' + (H - 34) + '" stroke="' + K.grid + '"/><text x="' + X(v) + '" y="' + (H - 20) + '" text-anchor="middle" font-size="' + f + '" fill="' + K.ink2 + '">' + v + ' %</text>'; });
    s += '<text x="' + l + '" y="13" font-size="' + (f + 0.5) + '" font-weight="600" fill="' + K.ink + '">Share of the brake on photosynthesis</text>';
    rows.forEach(function (q, i) {
      var y = 44 + i * 44, rg = TOMAS[q[0]], v = L3 ? 100 * L3[q[0]] : null;
      s += '<text x="' + (l - 8) + '" y="' + (y + 4) + '" text-anchor="end" font-size="' + (f + 0.5) + '" font-weight="600" fill="' + q[2] + '">' + q[1] + '</text>';
      s += '<rect x="' + X(rg[0]) + '" y="' + (y - 7) + '" width="' + (X(rg[1]) - X(rg[0])) + '" height="14" rx="7" fill="' + q[2] + '" fill-opacity="' + (dk ? 0.28 : 0.2) + '" stroke="' + q[2] + '" stroke-opacity=".6"/>';
      s += '<text x="' + X(rg[0]) + '" y="' + (y + 20) + '" font-size="' + (f - 1.5) + '" fill="' + K.ink2 + '">' + rg[0] + ' to ' + rg[1] + ' % measured</text>';
      if (v != null) {
        s += '<circle cx="' + X(v) + '" cy="' + y + '" r="6.5" fill="' + q[2] + '" stroke="' + (dk ? '#0b1015' : '#fff') + '" stroke-width="2"/>';
        s += '<text x="' + Math.min(W - 2, X(v) + 10) + '" y="' + (y - 9) + '" text-anchor="' + (X(v) > W - 40 ? 'end' : 'start') + '" font-size="' + f + '" font-weight="700" fill="' + K.ink + '">' + fmt(v, 0) + ' %</text>';
      }
    });
    s += '<text x="' + l + '" y="' + (H - 4) + '" font-size="' + (f - 1) + '" fill="' + K.ink2 + '">dot: this model leaf · band: 15 species, measured</text>';
    return s + '</svg>';
  }

  /* ------------------------------------------------------------ what sets gm: two cell walls, drawdown ranges */
  function anatSVG() {
    var dk = dark(), r = R(), K = COL[dk ? 'dark' : 'light'], W = 340, H = 264, f = 11;
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Two mesophyll cells side by side: a thin walled herb cell with many chloroplasts pressed against the wall facing the air space, and a thick walled evergreen cell with fewer. Below, the measured CO2 drop from air spaces to chloroplasts in herbs and woody species, with this model leaf marked" style="width:100%;height:auto;display:block;font-family:system-ui,sans-serif">';
    function cell(x0, wall, nChl, title, sub) {
      var cw = 150, top = 30, hh = 92, sc = 0.05;   /* wall drawn at 0.05 px per nm: 114 nm → 5.7 px, 544 nm → 27 px */
      var wt = wall * sc;
      s += '<text x="' + (x0 + cw / 2) + '" y="14" text-anchor="middle" font-size="' + (f + 0.5) + '" font-weight="700" fill="' + K.ink + '">' + title + '</text>';
      s += '<rect x="' + x0 + '" y="' + top + '" width="' + cw + '" height="16" fill="' + K.airsp + '" stroke="' + K.grid + '"/><text x="' + (x0 + 4) + '" y="' + (top + 11.5) + '" font-size="' + (f - 1.5) + '" fill="' + K.ink2 + '">air space</text>';
      s += '<rect x="' + x0 + '" y="' + (top + 16) + '" width="' + cw + '" height="' + wt + '" fill="' + K.wall + '" stroke="' + K.hatch + '"/>';
      s += '<rect x="' + x0 + '" y="' + (top + 16 + wt) + '" width="' + cw + '" height="' + (hh - wt) + '" fill="' + K.cyto + '"/>';
      s += '<line x1="' + x0 + '" x2="' + (x0 + cw) + '" y1="' + (top + 16 + wt + 1) + '" y2="' + (top + 16 + wt + 1) + '" stroke="' + K.mem + '" stroke-width="1.6"/>';
      for (var i = 0; i < nChl; i++) {
        var cx = x0 + 10 + (cw - 20) * (i + 0.5) / nChl, cy = top + 16 + wt + 10;
        s += '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + Math.min(13, (cw - 20) / nChl / 2 - 1) + '" ry="6" fill="' + (dk ? '#2f7a46' : '#5fa36a') + '" stroke="' + (dk ? '#8fd19e' : '#2f6a3a') + '"/>';
      }
      if (nChl < 4) for (var j = 0; j < 2; j++) s += '<ellipse cx="' + (x0 + 40 + j * 70) + '" cy="' + (top + 16 + wt + 46) + '" rx="12" ry="6" fill="' + (dk ? '#2f7a46' : '#5fa36a') + '" fill-opacity=".55" stroke="' + (dk ? '#8fd19e' : '#2f6a3a') + '" stroke-opacity=".6"/>';
      s += '<text x="' + (x0 + cw / 2) + '" y="' + (top + hh + 30) + '" text-anchor="middle" font-size="' + (f - 0.5) + '" fill="' + K.ink2 + '">' + sub + '</text>';
    }
    cell(8, 114, 6, 'thin leaved herb', 'wall about 0.11 µm');
    cell(182, 544, 3, 'thick evergreen leaf', 'wall up to about 0.54 µm');
    /* drawdown ranges */
    var y0 = 214, l = 8, rr = 10, mx = 260;
    function X(v) { return l + (W - l - rr) * clamp(v, 0, mx) / mx; }
    s += '<text x="' + l + '" y="' + (y0 - 40) + '" font-size="' + f + '" font-weight="600" fill="' + K.ink + '">CO₂ drop at door 2, Ci ' + MINUS + ' Cc (µmol mol⁻¹)</text>';
    s += '<line x1="' + X(0) + '" x2="' + X(mx) + '" y1="' + y0 + '" y2="' + y0 + '" stroke="' + K.grid + '" stroke-width="10" stroke-linecap="round"/>';
    s += '<rect x="' + X(40) + '" y="' + (y0 - 6) + '" width="' + (X(67) - X(40)) + '" height="12" rx="6" fill="' + K.d2 + '" fill-opacity=".45"/>';
    s += '<rect x="' + X(112) + '" y="' + (y0 - 6) + '" width="' + (X(240) - X(112)) + '" height="12" rx="6" fill="' + (dk ? '#e0b96a' : '#8a5a12') + '" fill-opacity=".45"/>';
    s += '<text x="' + ((X(40) + X(67)) / 2) + '" y="' + (y0 + 22) + '" text-anchor="middle" font-size="' + (f - 1) + '" fill="' + K.ink2 + '">herbs 40 to 67</text>';
    s += '<text x="' + ((X(112) + X(240)) / 2) + '" y="' + (y0 + 22) + '" text-anchor="middle" font-size="' + (f - 1) + '" fill="' + K.ink2 + '">woody 112 to 240</text>';
    [100, 200].forEach(function (v) { s += '<text x="' + X(v) + '" y="' + (y0 + 38) + '" text-anchor="middle" font-size="' + (f - 1.5) + '" fill="' + K.ink2 + '">' + v + '</text>'; });
    var d = r.dropMeso;
    if (d != null && isFinite(d) && !r.gmInf) {
      var xd = X(d);
      s += '<path d="M' + xd + ' ' + (y0 - 7) + 'l-6 -9h12z" fill="' + K.ink + '"/>';
      s += '<text x="' + clamp(xd, 40, W - 40) + '" y="' + (y0 - 19) + '" text-anchor="middle" font-size="' + f + '" font-weight="700" fill="' + K.ink + '">this leaf ' + fmt(d, 0) + (d > mx ? ' (off scale)' : '') + '</text>';
    }
    return s + '</svg>';
  }

  /* ------------------------------------------------------------ markup */
  var CSS = '' +
    '.co2p{margin-top:18px}.co2p .co2p-what,.co2p .co2p-todo{margin:4px 0 8px;font-size:16px;line-height:1.5}' +
    '.co2p-ctrls{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:0;margin:8px 0 0;border-top:1px solid var(--rule2)}' +
    '.co2p .ctl .d1{color:var(--cool)}.co2p .ctl .d2{color:#2f7a3a}:root[data-theme="dark"] .co2p .ctl .d2{color:#8fd19e}@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .co2p .ctl .d2{color:#8fd19e}}' +
    '.co2p-pre{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:8px 0}' +
    '.co2p-now{margin:8px 0;font-family:var(--ui);font-size:14.5px;line-height:1.45;padding:7px 10px;background:var(--card);border:1px solid var(--rule);border-left:4px solid var(--accent);border-radius:4px}' +
    '.co2p-tiles{margin-top:8px}.co2p-tiles .tile .v{font-size:20px}' +
    '.co2p-two{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px;margin-top:12px;align-items:start}' +
    '@media (max-width:720px){.co2p-two{grid-template-columns:minmax(0,1fr)}}' +
    '.co2p-two .lx-frame{padding:8px}.co2p .cap{font-size:14px}' +
    '.co2p-why{margin-top:12px;border:1px solid var(--rule);border-radius:6px;background:var(--card);padding:0 12px}' +
    '.co2p-why>summary{cursor:pointer;font:600 15px/1.3 var(--ui);padding:10px 0;min-height:24px}' +
    '.co2p-why ul{margin:0 0 10px;padding-left:1.2em}.co2p-why li{margin:0 0 8px}' +
    '.co2p .lx-cardgrid{margin-top:10px}.co2p-links a,.co2p-links button.linkish{font-family:var(--ui);font-weight:600}' +
    '.co2p button.linkish{background:none;border:0;padding:0;color:var(--accent);text-decoration:underline;text-underline-offset:2px;cursor:pointer;font-size:inherit}' +
    '.co2p .eq{font-family:var(--mono);font-size:13.5px;line-height:1.9;overflow-x:auto}' +
    '.co2p .co2p-sw{display:flex;align-items:center;gap:8px;font-family:var(--ui);font-size:14px;margin:6px 0}' +
    '.co2p .co2p-sw input{width:20px;height:20px}';
  function tile(id, k, unit, cls) { return '<div class="tile' + (cls ? ' ' + cls : '') + '" id="' + id + '"><div class="k">' + k + '</div><div class="v"><span class="n">0</span> <small>' + (unit || '') + '</small></div></div>'; }
  function markup() {
    return '<style>' + CSS + '</style>' +
      '<section class="fig lx-fig co2p" id="co2p-ws" aria-label="The CO2 path: from the air to Rubisco">' +
      '<div class="fighead"><h3>5.4 The CO₂ path: from the air to Rubisco</h3><p>CO₂ has to squeeze through two doors: the stomata, then the wet inside of the leaf.</p></div>' +
      '<p class="co2p-what"><b>What this is:</b> one CO₂ molecule’s trip, from the <b>outside air</b>, through a <b>stoma</b> (a tiny pore in the leaf skin), across an <b>air space</b> (the air between the cells inside the leaf), then through the <b>cell wall</b>, the <b>membrane</b> (the cell’s own skin), the <b>cytosol</b> (the watery inside of the cell) and the <b>envelope</b> (the two membranes around the chloroplast) to the <b>stroma</b>, where the enzyme <b>Rubisco</b> fixes it. The first door is the stomata. The second door is the wet inside of the leaf, called the <b>mesophyll</b>. How easily a gas gets through a door is its <b>conductance</b>: bigger means easier.</p>' +
      '<p class="co2p-todo"><b>What to do:</b> open or close each door with its slider. Watch the CO₂ fall at each door in the staircase, and watch how much water leaves. Then try the three buttons. Click the picture to freeze it; click again to play.</p>' +
      '<div class="co2p-ctrls">' +
      '<div class="ctl"><label for="co2p-gs"><span class="d1">Door 1: stomata, g<sub>s</sub></span> <output id="co2p-gs-o"></output></label><input type="range" id="co2p-gs" min="0.02" max="0.8" step="0.005"><div class="hint">stomatal conductance to water vapour, mol m⁻² s⁻¹; the same slider as the stoma theatre in 5.1</div></div>' +
      '<div class="ctl"><label for="co2p-gm"><span class="d2">Door 2: mesophyll, g<sub>m</sub></span> <output id="co2p-gm-o"></output></label><input type="range" id="co2p-gm" min="0.02" max="1" step="0.01"><div class="hint">mesophyll conductance to CO₂, mol m⁻² s⁻¹; a typical crop leaf is about 0.26 ' + badge('MEASURED') + ' ' + ev('gm.knauer', 'Knauer et al. 2022') + '; moving it holds the stomata where they are</div></div>' +
      '</div>' +
      '<div class="co2p-pre" role="group" aria-label="Try these"><button type="button" class="btn small" data-co2p="gslow">Door 1 nearly shut</button><button type="button" class="btn small" data-co2p="gmlow">Door 2 narrow</button><button type="button" class="btn small" data-co2p="high">Both wide open</button><button type="button" class="btn small" data-co2p="reset">Start again</button>' +
      '<button type="button" class="btn small" id="co2p-pause" aria-pressed="false">Pause</button></div>' +
      '<div class="tier-3 co2p-sw"><input type="checkbox" id="co2p-inf"><label for="co2p-inf">Expert: make door 2 infinitely wide (g<sub>m</sub> infinite, C<sub>c</sub> = C<sub>i</sub>, the older form of this model) ' + ev('eng.gm', 'Engine') + '</label></div>' +
      '<div class="lx-frame" id="co2p-th"></div>' +
      (window.WPMolColor ? WPMolColor.key(['h2o', 'co2'], { lead: 'Molecule colours, the same on every page:' }) : '') +
      '<p class="co2p-now" aria-live="polite"><b>What just happened:</b> <span id="co2p-now"></span></p>' +
      '<p class="cap lx-row">Top: a cut along the path, not to scale. Dark CO₂ beads come in at the model rate and are fixed by Rubisco; faint ones show how much CO₂ sits at each stop. Water beads leave from the wet cell wall: water uses only door 1. Bottom: the staircase of CO₂, outside (C<sub>a</sub>), in the air spaces (C<sub>i</sub>) and at Rubisco (C<sub>c</sub>). The drop inside the leaf is drawn as one ramp, because how it splits between wall, membranes and cytosol is not settled ' + ev('gm.parts', 'Open question') + ' ' + ev('tr.scale', 'Bead scale') + ' ' + ev('gm.serial', 'Two doors in a row') + '</p>' +
      '<p class="cap lx-row" style="margin:6px 0 0">Model leaf, live ' + badge('ILLUSTRATIVE') + ' ' + ev('eng.gm', 'gm in the model') + '</p>' +
      '<div class="tiles co2p-tiles">' +
      tile('co2p-A', 'Carbon in, A', 'µmol m⁻² s⁻¹') + tile('co2p-E', 'Water out, E', 'mmol m⁻² s⁻¹') + tile('co2p-r', 'Water per CO₂', 'molecules') +
      tile('co2p-iw', 'Carbon per opening, A/g<sub>s</sub>', 'µmol mol⁻¹', 'tier-2') + tile('co2p-gg', 'g<sub>m</sub> / g<sub>s</sub>', '', 'tier-3') + tile('co2p-lr', 'Mesophyll holds A back by', '%', 'tier-3') +
      '</div>' +
      '<div class="co2p-two">' +
      '<div><div class="lx-frame" id="co2p-plot"></div><p class="cap">Blue: opening the stomata buys carbon, but water out climbs faster and faster. Green: opening door 2 moves the leaf straight up, more carbon for the same water, because water does not pass door 2. Dot: this leaf. ' + badge('DERIVED') + ' ' + ev('gm.flexas2013', 'Flexas et al. 2013') + '</p></div>' +
      '<div class="tier-2"><div class="lx-frame" id="co2p-lim"></div><p class="cap" id="co2p-limcap"></p></div>' +
      '</div>' +
      '<div class="co2p-two">' +
      '<div><div class="lx-frame" id="co2p-anat"></div><p class="cap" id="co2p-anatcap"></p></div>' +
      '<div class="lx-cardgrid" style="margin-top:0">' +
      '<div class="card lx-case"><p class="lx-ck">What sets door 2?</p><p>Two things you can see under a microscope. A thinner <b>cell wall</b> lets CO₂ through more easily, and more <b>chloroplast surface pressed against the air spaces</b> gives CO₂ more ways in. In 15 species walls ranged from about 0.11 to 0.54 µm (114 to 544 nm), and chloroplast surface facing the air spaces from 6 to 19.7 m² per m² of leaf ' + badge('MEASURED') + ' ' + ev('gm.tomas', 'Tomás et al. 2013') + ' ' + ev('gm.evans', 'Evans 2021') + '</p></div>' +
      '<div class="card lx-case"><p class="lx-ck">' + badge('OPEN QUESTION') + ' Do aquaporins carry CO₂?</p><p>In tobacco, less of one aquaporin (a membrane channel best known for water) lowered g<sub>m</sub> by about 30 % and more raised it by about 20 % ' + badge('MEASURED') + '. In Arabidopsis, knocking out single aquaporin genes left g<sub>m</sub> unchanged, measured four ways ' + badge('MEASURED') + '. So how much aquaporins set door 2 is still open. ' + ev('gm.aqp', 'Both sides') + '</p></div>' +
      '<div class="card lx-case tier-2"><p class="lx-ck">' + badge('OPEN QUESTION') + ' Does carbonic anhydrase help?</p><p>Carbonic anhydrase is an enzyme that turns CO₂ and bicarbonate into each other quickly. Tobacco with chloroplast carbonic anhydrase cut to about 8 % of normal photosynthesised the same, and the CO₂ at Rubisco was only 13 to 22 µmol mol⁻¹ lower ' + badge('MEASURED') + '. A review argues it still helps CO₂ move inside the cell ' + badge('SECONDARY') + '. ' + ev('gm.ca', 'Both sides') + '</p></div>' +
      '</div></div>' +
      '<details class="co2p-why"><summary>Why does this happen?</summary><ul>' +
      '<li><b>Two doors in a row.</b> CO₂ has to pass both doors, one after the other. Each door costs its own drop in CO₂: the narrower the door, the bigger the drop for the same flow. The drop at door 1 is 1.6 A / g<sub>s</sub>; the drop at door 2 is A / g<sub>m</sub> ' + badge('DERIVED') + ' ' + ev('gm.serial', 'Fick’s law') + ' ' + ev('tr.diff', 'Why 1.6') + '.</li>' +
      '<li><b>Why door 2 is free in water.</b> Water evaporates from the wet cell walls straight into the air spaces, so it leaves through door 1 only. Widening door 2 lets more CO₂ reach Rubisco while the water bill stays the same, so more carbon is won per water lost. Widening door 1 also raises carbon, but water out rises in step with g<sub>s</sub> while carbon levels off. In theory water use efficiency follows the ratio g<sub>m</sub> / g<sub>s</sub>; in practice plants engineered for a higher g<sub>m</sub> have not yet shown it ' + badge('SECONDARY') + ' ' + ev('gm.flexas2013', 'Flexas et al. 2013') + '.</li>' +
      '<li><b>How big is door 2?</b> A typical crop leaf has a g<sub>m</sub> near 0.26 mol m⁻² s⁻¹, and that alone holds its photosynthesis about a fifth (20.9 %) below what it would be with no mesophyll resistance. In most herbaceous annuals the loss is 10 to 30 %; in woody evergreens 25 to 50 % ' + badge('MEASURED') + ' ' + ev('gm.knauer', 'Knauer et al. 2022') + '. In this model leaf the same g<sub>m</sub> costs <span id="co2p-lr2"></span> ' + badge('DERIVED') + ' ' + ev('gm.rel', 'How it is counted') + '.</li>' +
      '<li><b>Herbs and trees.</b> Thin leaved herbs lose only 40 to 67 µmol mol⁻¹ of CO₂ between the air spaces and the chloroplasts; woody species lose 112 to 240 ' + badge('MEASURED') + ' ' + ev('gm.tomas', 'Tomás et al. 2013') + '. Tough, dense leaves have a lower g<sub>m</sub>; in ferns and in most conifers studied, door 2 is the main brake ' + badge('MEASURED') + ' ' + ev('gm.tough', 'Niinemets 2009; Tosens 2016; Veromann Jürgenson 2017') + '.</li>' +
      '<li class="tier-2"><b>Who holds photosynthesis back?</b> The split asks how much of the brake is the stomata, how much the mesophyll and how much Rubisco and light. In 15 species it ranged widely: stomata 19 to 65 %, mesophyll 13 to 64 %, biochemistry 6 to 33 % ' + badge('MEASURED') + ' ' + ev('gm.tomas', 'Tomás et al. 2013') + '. The dots are this model leaf ' + badge('DERIVED') + ' ' + ev('gm.lim', 'How it is computed') + '. In ash and oak trees, mild drought acted mostly through the stomata (about two thirds); in severe drought the mesophyll became almost as important ' + badge('MEASURED') + ' ' + ev('gm.grassi', 'Grassi and Magnani 2005') + '.</li>' +
      '<li class="tier-2"><b>Drought closes door 1 first.</b> In field grapevines the stomata closed first; only in severe drought did g<sub>m</sub> also fall strongly, and much of what looked like damaged biochemistry was the CO₂ path inside the leaf closing ' + badge('MEASURED') + ' ' + ev('gm.drought', 'Flexas et al. 2002; 2004') + '. Narrowing door 1 can save water: tobacco engineered to open its stomata less in light lost a quarter less water per CO₂ fixed ' + badge('MEASURED') + ' ' + ev('gm.psbs', 'Głowacka et al. 2018') + '.</li>' +
      '<li class="tier-3"><b>How g<sub>m</sub> is measured.</b> It is never measured directly: it is calculated from gas exchange plus chlorophyll fluorescence or carbon isotopes, and each route can be biased, so good studies use two ' + badge('SECONDARY') + ' ' + ev('gm.method', 'Pons et al. 2009') + '. Reported fast changes of g<sub>m</sub> with CO₂ or light may partly come from the calculation ' + badge('OPEN QUESTION') + ' ' + ev('gm.fast', 'Both sides') + '. Warming from 15 to 40 °C raised g<sub>m</sub> two to threefold in tobacco and soybean but hardly changed it in wheat; this model keeps g<sub>m</sub> the same at every temperature ' + badge('MEASURED') + ' ' + ev('gm.temp', 'von Caemmerer and Evans 2015') + '.</li>' +
      '</ul></details>' +
      '<section class="tier-3 lx-expert" aria-label="Expert: the CO2 path"><h3 class="lx-h3">The three equations, solved together</h3>' +
      '<div class="card eq">A = (g<sub>s</sub> / 1.6)(C<sub>a</sub> − C<sub>i</sub>)    door 1, the stomata<br>A = g<sub>m</sub> (C<sub>i</sub> − C<sub>c</sub>)    door 2, the mesophyll<br>A = min(A<sub>c</sub>, A<sub>j</sub>) − R<sub>d</sub> at C<sub>c</sub>    Rubisco and light (Plate IV)<br>1 / g<sub>tot</sub> = 1.6 / g<sub>s</sub> + 1 / g<sub>m</sub>    E = g<sub>s</sub> VPD / P    A / g<sub>s</sub> = g<sub>tot</sub> (C<sub>a</sub> − C<sub>c</sub>) / g<sub>s</sub><br>l<sub>s</sub> = (g<sub>tot</sub>/g<sub>sc</sub>) d/(g<sub>tot</sub> + d),  l<sub>m</sub> = (g<sub>tot</sub>/g<sub>m</sub>) d/(g<sub>tot</sub> + d),  l<sub>b</sub> = g<sub>tot</sub>/(g<sub>tot</sub> + d),  d = dA/dC<sub>c</sub></div>' +
      '<p class="cap lx-row">For each C<sub>i</sub> the engine finds C<sub>c</sub> where door 2 and Rubisco agree; with the stomata held, it then finds C<sub>i</sub> where door 1 agrees too. In the dark A is negative, so respired CO₂ flows outward and C<sub>c</sub> sits above C<sub>i</sub>. Concentrations in the liquid are given as the gas phase value in equilibrium with them, the usual convention. g<sub>m</sub> is one fixed number here: it does not change with CO₂, light or temperature. ' + ev('gm.lim', 'Limitation split') + ' ' + ev('gm.rel', 'Relative limitation') + ' ' + ev('gm.def', 'Definition') + '</p>' +
      '</section>' +
      '<section class="card co2p-links" aria-label="Where this connects"><h3 class="lx-h3">Where this connects</h3>' +
      '<p>Door 1 is the pore in the <button type="button" class="linkish" data-co2p-go="tr-live">stoma theatre at the top of this plate (5.1)</button>. What Rubisco does with the CO₂ that gets through is on <a href="#stroma">Plate IV, the stroma</a>, and the chloroplast it works in is at the top of <a href="#thylakoid">Plate III</a>.</p>' +
      '<p><b>Coming later on this site: plant hormones.</b> One hint of what is ahead: in a wild tobacco relative, drought lowered g<sub>m</sub> only in plants able to make the hormone ABA, and sprayed ABA lowered it in both; yet another study found applied ABA closed stomata without changing g<sub>m</sub> ' + badge('OPEN QUESTION') + ' ' + ev('gm.aba', 'Mizokami et al. 2015; Vrábl et al. 2009') + '.</p>' +
      '</section>' +
      '</section>';
  }

  /* ------------------------------------------------------------ mount, update */
  var EL = null, A1 = null, PREV = null, LAST = null;
  function mount(host) {
    host.innerHTML = markup();
    EL = { root: host, gs: host.querySelector('#co2p-gs'), gm: host.querySelector('#co2p-gm'), inf: host.querySelector('#co2p-inf'), now: host.querySelector('#co2p-now') };
    A1 = U().anim(host.querySelector('#co2p-th'), {
      height: function (w) { return w < 560 ? 420 : 410; },
      label: 'A cut along the CO2 path through a leaf, from the outside air through a stoma, an air space, the cell wall, membrane, cytosol and chloroplast envelope to Rubisco in the stroma, with the CO2 concentration at each stop drawn as a staircase underneath',
      draw: draw,
      settle: function () { if (!TS.lay) return; TS.co2 = []; TS.h2o = []; prewarm(6); },
      resize: function () { TS.lay = null; }
    });
    var pb = host.querySelector('#co2p-pause');
    pb.addEventListener('click', function () { var p = !A1.paused(); A1.pause(p); pb.setAttribute('aria-pressed', p ? 'true' : 'false'); pb.textContent = p ? 'Play' : 'Pause'; });
    if (A1.paused()) { pb.setAttribute('aria-pressed', 'true'); pb.textContent = 'Play'; }
    if (A1.freeze) A1.freeze.bind(pb);
    EL.gs.addEventListener('input', function () { LAST = 'gs'; LP.set({ stomata: 'fixed', gs: +EL.gs.value }); });
    EL.gm.addEventListener('input', function () { LAST = 'gm'; var g = R().gs; LP.set({ stomata: 'fixed', gs: g || 0.15, gm: +EL.gm.value, gmInf: false }); });
    EL.inf.addEventListener('change', function () { LAST = 'inf'; var g = R().gs; LP.set({ stomata: 'fixed', gs: g || 0.15, gmInf: EL.inf.checked }); });
    host.addEventListener('click', function (e) {
      var go = e.target.closest('[data-co2p-go]');
      if (go) { var t = document.getElementById(go.getAttribute('data-co2p-go')); if (t && t.scrollIntoView) t.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' }); return; }
      var b = e.target.closest('[data-co2p]'); if (!b) return;
      var k = b.getAttribute('data-co2p'); LAST = k;
      if (k === 'gslow') LP.set({ stomata: 'fixed', gs: 0.05 });
      else if (k === 'gmlow') LP.set({ stomata: 'fixed', gs: R().gs || 0.15, gm: 0.06, gmInf: false });
      else if (k === 'high') LP.set({ stomata: 'fixed', gs: 0.5, gm: 0.6, gmInf: false });
      else if (k === 'reset') LP.set({ stomata: 'ratio', gm: 0.26, gmInf: false });
    });
    U().onPrefs && U().onPrefs(function () { CUR.key = ''; render(true); });
    window.addEventListener('lp:tier', function () { CUR.key = ''; render(true); if (A1) A1.redraw(); });
    PREV = snap(R());
    render(true);
  }
  function snap(r) { return { gs: r.gs, gm: r.gm, inf: r.gmInf, A: r.A, E: r.E, Ci: r.Ci, Cc: r.Cc, ratio: r.A > 0.05 ? 1000 * r.E / r.A : null, iw: r.iwue }; }
  function pct(a, b) { return b ? 100 * (a - b) / Math.abs(b) : 0; }
  function nowText(r, p) {
    var ratio = r.A > 0.05 ? 1000 * r.E / r.A : null;
    if (!(r.A > 0)) return 'No net CO₂ is coming in right now (' + (r.limit === 'dark' ? 'it is dark' : 'the light reactions are blocked or the stomata are shut') + '), so neither door matters for carbon; water still leaves at ' + fmt(r.E, 2) + ' mmol m⁻² s⁻¹.';
    var base = 'CO₂ falls from ' + fmt(r.Ca, 0) + ' outside to ' + fmt(r.Ci, 0) + ' in the air spaces and ' + fmt(r.Cc, 0) + ' at Rubisco. ';
    if (!p || p.A == null) return base + 'About ' + fmt(ratio, 0) + ' water molecules leave for every CO₂ fixed.';
    var dg = Math.abs((r.gs || 0) - (p.gs || 0)) > 2e-3, dm = (r.gm || 0) !== (p.gm || 0) || r.gmInf !== p.inf;
    var dA = pct(r.A, p.A), dE = pct(r.E, p.E);
    if (dg && !dm) {
      return 'You ' + (r.gs > p.gs ? 'opened' : 'closed') + ' door 1 (g<sub>s</sub> ' + fmt(p.gs, 3) + ' → ' + fmt(r.gs, 3) + '). Carbon in went ' + (dA >= 0 ? 'up ' : 'down ') + fmt(Math.abs(dA), 0) + ' %, but water out went ' + (dE >= 0 ? 'up ' : 'down ') + fmt(Math.abs(dE), 0) + ' %' + (Math.abs(dE) > Math.abs(dA) + 1 ? ', more than carbon' : '') + '. Water per CO₂: ' + fmt(p.ratio, 0) + ' → ' + fmt(ratio, 0) + '. ' + base;
    }
    if (dm && !dg) {
      var gmT = function (q) { return q.inf ? 'infinite' : fmt(q.gm, 2); };
      return 'You ' + ((r.gmInf || (r.gm || 0) > (p.gm || 0)) && !p.inf ? 'opened' : 'narrowed') + ' door 2 (g<sub>m</sub> ' + gmT(p) + ' → ' + gmT({ gm: r.gm, inf: r.gmInf }) + '). Carbon in went ' + (dA >= 0 ? 'up ' : 'down ') + fmt(Math.abs(dA), 0) + ' % while water out stayed at ' + fmt(r.E, 2) + ' mmol m⁻² s⁻¹, so water per CO₂ went ' + fmt(p.ratio, 0) + ' → ' + fmt(ratio, 0) + '. ' + base;
    }
    if (dg && dm) return 'Both doors changed. Carbon in ' + (dA >= 0 ? 'up ' : 'down ') + fmt(Math.abs(dA), 0) + ' %, water out ' + (dE >= 0 ? 'up ' : 'down ') + fmt(Math.abs(dE), 0) + ' %; water per CO₂ ' + fmt(p.ratio, 0) + ' → ' + fmt(ratio, 0) + '. ' + base;
    return base + 'About ' + fmt(ratio, 0) + ' water molecules leave for every CO₂ fixed.';
  }
  function setT(id, v) { var e = document.querySelector('#' + id + ' .n'); if (e) e.textContent = v; }
  function render(force) {
    if (!EL) return;
    var r = R(), st = LP.state, tr = tier();
    function sync(el, v, txt) { if (el && document.activeElement !== el && v != null) el.value = v; var o = document.getElementById(el.id + '-o'); if (o) o.innerHTML = txt; }
    sync(EL.gs, r.gs, fmt(r.gs, 3));
    sync(EL.gm, r.gmInf ? 1 : r.gm, r.gmInf ? 'infinite' : fmt(r.gm, 2));
    EL.gm.disabled = !!r.gmInf; EL.inf.checked = !!r.gmInf;
    var ratio = r.A > 0.05 ? 1000 * r.E / r.A : null;
    setT('co2p-A', fmt(r.A, 1)); setT('co2p-E', fmt(r.E, 2)); setT('co2p-r', ratio ? fmt(ratio, 0) : 'n/a');
    setT('co2p-iw', r.A > 0 ? fmt(r.iwue, 0) : 'n/a'); setT('co2p-gg', r.gmInf ? 'infinite' : (r.gs > 0 ? fmt(r.gm / r.gs, 2) : 'n/a')); setT('co2p-lr', r.gmInf ? '0' : fmt(100 * (r.lmRel || 0), 0));
    var lr2 = document.getElementById('co2p-lr2'); if (lr2) lr2.textContent = r.gmInf ? 'nothing, because door 2 is set infinitely wide' : 'about ' + fmt(100 * (r.lmRel || 0), 0) + ' % at gm ' + fmt(r.gm, 2) + ' right now';
    var pl = document.getElementById('co2p-plot'); if (pl) pl.innerHTML = plotSVG();
    var lm = document.getElementById('co2p-lim'); if (lm) lm.innerHTML = limSVG();
    var lc = document.getElementById('co2p-limcap');
    if (lc) {
      var L3 = r.lim3, big = null;
      if (L3) { big = [['the stomata', L3.s], ['the mesophyll', L3.m], ['Rubisco and light (the biochemistry)', L3.b]].sort(function (a, b) { return b[1] - a[1]; })[0][0]; }
      lc.innerHTML = (L3 ? 'Right now the biggest brake on this leaf is ' + big + '. ' : 'No split while the leaf takes in no CO₂. ') + 'Dots: this model leaf ' + badge('DERIVED') + ' ' + ev('gm.lim', 'Grassi and Magnani 2005') + '. Bands: 15 species ' + badge('MEASURED') + ' ' + ev('gm.tomas', 'Tomás et al. 2013') + '. A dot can sit outside its band: the model leaf has teaching values for Rubisco and light, it is not a measured species.';
    }
    var an = document.getElementById('co2p-anat'); if (an) an.innerHTML = anatSVG();
    var ac = document.getElementById('co2p-anatcap');
    if (ac) ac.innerHTML = 'Not to scale except the two walls, drawn to the measured thinnest and thickest of 15 species ' + badge('MEASURED') + ' ' + ev('gm.tomas', 'Tomás et al. 2013') + '. The triangle is this model leaf: a drop of ' + (r.gmInf ? 'zero, because door 2 is set infinitely wide' : fmt(r.dropMeso, 0) + ' µmol mol⁻¹ at door 2') + ' ' + badge('DERIVED') + '.';
    if (EL.now) EL.now.innerHTML = nowText(r, PREV);
    PREV = snap(r);
    if (A1 && (reduced() || A1.paused())) { if (reduced() && TS.lay) { TS.co2 = []; TS.h2o = []; prewarm(6); } A1.redraw(); }
  }

  /* ------------------------------------------------------------ hook into Plate V after 5.3 */
  function hook() {
    var ps = LP.panels || [], tp = null;
    ps.forEach(function (p) { if (p.id === 'tradeoff') tp = p; });
    if (!tp || tp._co2p) return;
    tp._co2p = true;
    var m0 = tp.mount, u0 = tp.update, s0 = tp.show;
    tp.mount = function (el) {
      m0.apply(this, arguments);
      try {
        var h = document.createElement('div'); h.className = 'co2p-host';
        var after = el.querySelector('#tr-clim');
        if (after && after.parentNode) after.parentNode.insertBefore(h, after.nextSibling); else el.appendChild(h);
        mount(h);
      } catch (e) { console.error('CO2 path workstation failed to mount', e); }
    };
    tp.update = function () { var r = u0 ? u0.apply(this, arguments) : undefined; try { render(); } catch (e) { console.error(e); } return r; };
    tp.show = function () { var r = s0 ? s0.apply(this, arguments) : undefined; try { if (A1) { A1.resize(); A1.kick(); } render(true); } catch (e) { console.error(e); } return r; };
  }
  hook();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hook);

  window.CO2P = {
    debug: function () { var r = R(); return { gs: r.gs, gm: r.gm, gmInf: r.gmInf, Ca: r.Ca, Ci: r.Ci, Cc: r.Cc, A: r.A, E: r.E, lim3: r.lim3, lmRel: r.lmRel, mounted: !!EL, paused: A1 ? A1.paused() : null, beads: { co2: TS.co2.length, h2o: TS.h2o.length, amb: TS.amb.length } }; },
    set: function (gs, gm) { LP.set({ stomata: 'fixed', gs: gs, gm: gm, gmInf: false }); }
  };
})();

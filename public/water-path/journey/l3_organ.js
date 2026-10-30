/* The Water Path v8: l3_organ.js (Plant and Organ builder)
   Level III, Organ (1 cm). Stops 3a, 3b, 3c.
   3a  root cross section: endodermis and Casparian strip (lignin, Naseer et al. 2012), wall route vs cell route,
       the root endodermis and leaf bundle sheath parallel, fine root cortical lacunae as a variable resistor (Cuneo et al. 2016).
   3b  stomatal closure and organ vulnerability on one Ψ axis, driven by the same live solve, with published points;
       vessel clusters that turn charcoal as PLC rises; air seeding through a pit membrane pore.
   3c  segmentation as an OPEN QUESTION (Hochberg et al. 2016 vs Peters & Choat 2025). */
(function () {
  'use strict';
  var OBASE = (document.currentScript && document.currentScript.src || '').replace(/[^\/]*$/, ''); // LOOK CLOSER: where macro.js lives
  /* 13 Oct (slow and named): CSS drawn motion (dashed streams) follows the page speed through --wp-ps */
  (function () { function ps() { if (window.PlaySpeed) document.documentElement.style.setProperty('--wp-ps', String(window.PlaySpeed.get())); } ps(); if (window.PlaySpeed) window.PlaySpeed.on(ps); })();
  var WP = window.WP = window.WP || {};
  WP.levels = WP.levels || [];
  var MINUS = '−';
  /* How to measure: vulnerability curves (request 4). Protocol links only where the PrometheusWiki page was verified to load. */
  WP.howto = WP.howto || {};
  var HT = {
    'vc-microct': { title: 'vulnerability curve by X ray microCT', what: 'intact plants, imaged', steps: [
      'Dry an intact potted plant slowly; measure stem Ψ on bagged leaves (pressure chamber) at each step.',
      'Scan the same stem segment at each step; count air filled (dark) and water filled vessels.',
      'At the end, cut the stem in the scanner to fill every vessel with air and scan again: that sets 100 %.',
      'Convert vessel diameters to theoretical conductivity (each vessel ∝ D⁴) and plot percent lost against Ψ; fit a sigmoid for P50.'],
      watch: 'The metric is theoretical, not measured flow; image resolution limits the narrowest conduits counted. Same vine, different method, different number: compare with the MRI and HRCT values above.',
      dois: ['10.1104/pp.15.00732', '10.1104/pp.112.212712', '10.1104/pp.16.01079'] },
    'vc-mri': { title: 'vulnerability curve by MRI', what: 'intact plants, water imaged', steps: [
      'Hold an intact plant in the magnet and image proton density in a stem or petiole cross section.',
      'Score vessels as water filled (bright) or gas filled (dark) while the plant dries; track xylem Ψ alongside.',
      'Report percent of conductive xylem area that is gas filled against Ψ.'],
      watch: 'Coarser resolution than microCT, so small vessels can be missed; the metric is area, not conductivity.',
      dois: ['10.1104/pp.126.1.27', '10.1111/pce.12688'] },
    'vc-optical': { title: 'vulnerability curve by the optical method', what: 'leaves and stems, light transmission', steps: [
      'Fix a leaf (or a stem with the bark removed) on a scanner or under a camera on an intact drying plant.',
      'Image every few minutes; embolism events show as sudden changes in light transmission in the veins.',
      'Sum the embolised area over time and pair it with Ψ from a psychrometer or pressure chamber.'],
      watch: 'Counts embolism events, not conductivity loss; methods can disagree on the same species (Pratt et al. 2020 found microCT > optical > hydraulic in one oak).',
      dois: ['10.1111/nph.13846', '10.1093/treephys/tpz092'] },
    'vc-cavitron': { title: 'vulnerability curve by Cavitron (flow centrifuge)', what: 'cut stems, spun', steps: [
      'Cut a stem segment longer than most vessels if you can, and mount it in a rotor that spins while water flows through it.',
      'Raise the spin speed step by step; each speed sets a known negative pressure at the segment centre: Ψ = −¼ ρ ω² R² for a segment of length R centred on the axis (ρ water density, ω angular speed). This form is the one given by Alder et al. 1997, a paper not retrieved in this build, so treat it as UNVERIFIED.',
      'Measure conductance at each step; percent loss against pressure gives the curve.'],
      watch: 'Open vessel artefact in long vessel species: exponential curves can mean vessels cut open at both ends (Cochard et al. 2013). Grapevine vessels are long.',
      dois: ['10.1093/jxb/ert193'],
      proto: { url: 'https://prometheusprotocols.net/function/water-relations/xylem-vulnerability-curves/establishing-vulnerability-curves-with-the-flow-through-centrifuge-method-cavitron/', label: 'Establishing vulnerability curves with the flow through centrifuge method (Cavitron)' } },
    'vc-bench': { title: 'vulnerability curve by bench dehydration', what: 'whole branches dried, then cut', steps: [
      'Cut long branches and let them dry on the bench; measure Ψ on bagged leaves at intervals.',
      'Relax the tension before cutting (rehydrate briefly or wait), then cut segments under water.',
      'Measure native conductance, flush to remove air, measure maximum conductance; percent loss against Ψ.'],
      watch: 'Cutting xylem under tension can create embolism and mimic refilling (Wheeler et al. 2013). Excised grapevine stems can refill within an hour (Knipfer et al. 2016).',
      dois: ['10.1093/jxb/ert193', '10.1111/pce.12139', '10.1104/pp.16.00136'],
      proto: { url: 'https://prometheusprotocols.net/function/water-relations/xylem-vulnerability-curves/quantification-of-vulnerability-to-xylem-embolism-bench-dehydration/', label: 'Quantification of vulnerability to xylem embolism: bench dehydration' } },
    'vc-air': { title: 'vulnerability curve by air injection', what: 'pressure sleeve on cut stems', steps: [
      'Fit a pressure sleeve around a cut stem segment and raise air pressure in steps.',
      'After each step, measure conductance; percent loss against injection pressure (read as −Ψ).'],
      watch: 'In grapevine, short segment air injection showed more than 90 % loss at −0.5 MPa, an artefact of long vessels; NMR and long segments agreed on far less (Choat et al. 2010).',
      dois: ['10.1111/j.1365-3040.2010.02160.x', '10.1093/jxb/ert193'] }
  };
  Object.keys(HT).forEach(function (k) { if (!WP.howto[k]) WP.howto[k] = HT[k]; });
  var ui, root, refs = {}, opts = { wall: true, cell: true, aqpClosed: false, lacunae: false, D: 0.20 }, lastCrop = '';

  function num(x, d) { return WP.fmt.num(x, d); }
  function psi(x, d) { return WP.fmt.psi(x, d); }
  function clamp(x, a, b) { return x < a ? a : (x > b ? b : x); }
  function esc(s) { return ui.esc(s); }
  function f1(x) { return x.toFixed(1); }

  /* ------------------------------------------------------------ evidence registry */
  WP.evidence = WP.evidence || {};
  var EV = {
    'l3.casparian': { claim: 'The Casparian strip is a band of lignin in the radial walls of the endodermis. It blocks the wall route, so water and solutes must cross a membrane. Suberin lamellae come later, as a separate layer.',
      cite: 'Naseer et al. 2012, PNAS 109: 10101', doi: '10.1073/pnas.1205726109',
      measured: 'Arabidopsis roots: suberin appeared too late to form the strip; plants with no detectable suberin still made functional strips; blocking lignin synthesis abolished them; lignin specific chemistry found lignin in the strip. Other species may add suberin later.',
      fig: 'Abstract (retrieved)', badge: 'MEASURED' },
    'l3.bs': { claim: 'The bundle sheath may do in the leaf what the endodermis does in the root.',
      cite: 'Albuquerque, Scoffoni, Brodersen, Buckley, Sack & McElrone 2020, Journal of Experimental Botany 71: 7286', doi: '10.1093/jxb/eraa392',
      measured: 'Grapevine leaves: modelling of outside xylem conductance pointed to a Casparian like band in the bundle sheath. It was suggested by the model, not imaged.',
      fig: 'Abstract', badge: 'OPEN QUESTION' },
    'l3.cuneo': { claim: 'In drying soil, fine root cortical cells collapse into air gaps (lacunae). Root conductance drops before root xylem embolism, and the damage does not recover.',
      cite: 'Cuneo, Knipfer, Brodersen et al. 2016, Plant Physiology 172: 1669', doi: '10.1104/pp.16.00923',
      measured: 'Grapevine fine roots imaged in vivo by X ray microCT, with root hydraulic conductivity measured in parallel. Lacunae began under mild drought stress, before root shrinkage or root xylem embolism; conductivity did not recover after rewatering.',
      fig: 'Abstract', badge: 'MEASURED' },
    'l3.p50grape': { claim: 'Grapevine petiole P50 is −1.54 MPa and stem P50 is −1.90 MPa.',
      cite: 'Hochberg, Albuquerque, Rachmilevitch et al. 2016, Plant, Cell and Environment 39: 1886', doi: '10.1111/pce.12688',
      measured: 'One year old Syrah vines (Vitis vinifera) grafted on SO4 rootstock, dehydrated while petioles and stems were scanned by MRI: the xylem pressure at which 50 % of the conductive xylem area was gas filled. A separate microCT run on own rooted Syrah in their first season confirmed it (about half the petiole vessels gas filled near ' + '\u2212' + '1.6 MPa).',
      fig: 'Abstract', badge: 'MEASURED' },
    'l3.microct': { claim: 'About half the petiole vessels were embolised at −1.6 MPa, while few stem vessels were.',
      cite: 'Hochberg, Albuquerque et al. 2016, Plant, Cell and Environment 39: 1886', doi: '10.1111/pce.12688',
      measured: 'Synchrotron microCT of grapevine petioles and stems during dehydration; a second, independent method in the same paper.',
      fig: 'Abstract', badge: 'MEASURED' },
    'l3.charrier': { claim: 'In intact Cabernet Sauvignon imaged by microCT, petiole P50 was −0.98 MPa, leaf −1.08 MPa and stem −1.73 MPa. When the stem reached its air-entry pressure, which the authors calculated from the fitted curve, petioles had already lost 66 %. Refilling was not seen while bulk xylem pressure stayed negative.',
      cite: 'Charrier et al. 2016, Plant Physiology 172: 1657', doi: '10.1104/pp.16.01079',
      measured: 'Intact plants, X ray microCT; metric is theoretical conductivity from imaged vessels. A different cultivar and a different method from Hochberg et al. 2016 (MRI, conductive area).',
      fig: 'Abstract (stem −1.7 and petiole −1.0 MPa, matched). The two decimal values, the leaf value, the 66 % and the slopes used in the model are from Table I as read by the panel this week; not re-matched by the builder.', badge: 'MEASURED' },
    'l3.brodersen': { claim: 'In grapevine stems, embolism began in the vessels next to the pith and spread outward within sectors; only 16 of 629 vessel connections carried it sideways into a neighbouring sector.',
      cite: 'Brodersen et al. 2013, Plant Physiology 161: 1820', doi: '10.1104/pp.112.212712',
      measured: 'Vitis vinifera, in vivo high resolution X ray CT time lapse during drought. First embolism near −1.2 MPa stem Ψ. Stem P50 −2.2 MPa from a Weibull fit to the imaged loss (theoretical conductivity).',
      fig: 'Abstract for the pattern and the 16 of 629; the −2.2 MPa P50 as read by the panel. Data plotted as numbers, no figure reused.', badge: 'MEASURED' },
    'l3.cuneoP50': { claim: 'Grapevine fine roots reached root xylem P50 at −1.8 MPa, coarse roots at −3.5 MPa; cortical lacunae began near −0.6 MPa and cut root conductance first.',
      cite: 'Cuneo, Knipfer, Brodersen & McElrone 2016, Plant Physiology 172: 1669', doi: '10.1104/pp.16.00923',
      measured: 'In vivo microCT of grapevine roots with root hydraulic conductivity measured in parallel.',
      fig: 'Abstract. The model applies the fine root P50 to the root xylem half of root resistance (ILLUSTRATIVE split).', badge: 'MEASURED' },
    'l3.hsm': { claim: 'Across 226 forest species, 70 % operate within 1 MPa of their stem P50 (a narrow hydraulic safety margin).',
      cite: 'Choat et al. 2012, Nature 491: 752', doi: '10.1038/nature11688',
      measured: 'Global compilation of stem vulnerability and minimum water potential in the field.', fig: 'Abstract.', badge: 'MEASURED' },
    'l3.refill': { claim: 'Can grapevine refill embolised vessels while the xylem is under tension? The evidence conflicts.',
      cite: 'Holbrook et al. 2001, Plant Physiology 126: 27; Brodersen et al. 2010, Plant Physiology 154: 1088; Charrier et al. 2016, Plant Physiology 172: 1657; Knipfer et al. 2016, Plant Physiology 171: 1024', doi: '10.1104/pp.126.1.27', doi2: '10.1104/pp.16.00136',
      measured: 'MRI of an intact vine (refilling in darkness, Holbrook 2001); HRCT of droplets growing in vessels despite bulk tension (Brodersen 2010, doi 10.1104/pp.110.162396); microCT of intact vines with no refilling while bulk xylem pressure was negative, only with root pressure (Charrier 2016, doi 10.1104/pp.16.01079); excised stems refilling within an hour once given water (Knipfer 2016), a warning for cut sample methods.',
      fig: 'Abstracts. No refilling percentages are shown on this page.', badge: 'OPEN QUESTION' },
    'l3.refill.h': { claim: 'Can grapevine refill embolised vessels while the xylem is under tension? The evidence conflicts.',
      cite: 'Holbrook, Ahrens, Burns & Zwieniecki 2001, Plant Physiology 126: 27', doi: '10.1104/pp.126.1.27',
      measured: 'MRI of an intact, transpiring grapevine stem over about 40 h: about 10 vessels cavitated as leaf Ψ fell from −1.25 to −2.1 MPa, and most refilled within 2 to 3 h of darkness after watering.',
      fig: 'Abstract. One of the four papers behind the refilling open question.', badge: 'OPEN QUESTION' },
    'l3.refill.b': { claim: 'Can grapevine refill embolised vessels while the xylem is under tension? The evidence conflicts.',
      cite: 'Brodersen, McElrone, Choat, Matthews & Shackel 2010, Plant Physiology 154: 1088', doi: '10.1104/pp.110.162396',
      measured: 'High resolution X ray CT of intact grapevine: droplets grew inside embolised vessels and refilled them despite tension in the bulk xylem.',
      fig: 'Abstract. One of the four papers behind the refilling open question.', badge: 'OPEN QUESTION' },
    'l3.refill.c': { claim: 'Can grapevine refill embolised vessels while the xylem is under tension? The evidence conflicts.',
      cite: 'Charrier et al. 2016, Plant Physiology 172: 1657', doi: '10.1104/pp.16.01079',
      measured: 'MicroCT of intact Vitis vinifera and V. riparia: no refilling while bulk xylem pressure stayed negative; recovery only where xylem pressure was positive, at the base of the plant.',
      fig: 'Abstract. One of the four papers behind the refilling open question.', badge: 'OPEN QUESTION' },
    'l3.refill.k': { claim: 'Can grapevine refill embolised vessels while the xylem is under tension? The evidence conflicts.',
      cite: 'Knipfer, Cuneo, Brodersen & McElrone 2016, Plant Physiology 171: 1024', doi: '10.1104/pp.16.00136',
      measured: 'MicroCT of excised grapevine stems: vessels refilled in under 1 h once the cut stem was given water, without root pressure; slower with PEG added.',
      fig: 'Abstract. One of the four papers behind the refilling open question.', badge: 'OPEN QUESTION' },
    'l3.pitcave': { claim: 'D in ΔP = 4T ÷ D is an equivalent pore size: real pit membranes are 3D, with constrictions set by membrane thickness, and sap surfactants lower surface tension in the pores.',
      cite: 'Kaack et al. 2021, New Phytologist 230: 1829; Schenk et al. 2017, Plant Physiology 173: 1177; Sperry & Tyree 1988, Plant Physiology 88: 581', doi: '10.1111/nph.17282', doi2: '10.1104/pp.16.01039',
      measured: 'Kaack: modelled multilayer pit membranes plus measured thickness and embolism resistance in 31 species. Schenk: lipid surfactants in xylem sap and pit membrane pores. Sperry & Tyree 1988 (doi 10.1104/pp.88.3.581): the founding air seeding experiment in sugar maple.',
      fig: 'Abstracts.', badge: 'DERIVED' },
    'l3.almondcav': { claim: 'Air injection on short excised segments can overstate vulnerability in long vessel species.',
      cite: 'Choat et al. 2010, Plant Cell and Environment 33: 1502; Cochard et al. 2013, Journal of Experimental Botany 64: 4779', doi: '10.1111/j.1365-3040.2010.02160.x', doi2: '10.1093/jxb/ert193',
      measured: 'Grapevine: short segment air injection reached more than 90 % loss by −0.5 MPa and flushed centrifuge stems by −1.5 MPa, while NMR showed most vessels still full at water potentials less negative than −1.5 MPa. Review of more than 1200 curves.',
      fig: 'Abstracts. The almond P50 values stay MEASURED, but read them with this caveat.', badge: 'MEASURED' },
    'l3.gs80': { claim: 'In grapevine, stomatal conductance was down 80 % by a leaf Ψ near −1.2 MPa, and midrib embolism began near −1.25 MPa.',
      cite: 'Albuquerque, Scoffoni, Brodersen, Buckley, Sack & McElrone 2020, Journal of Experimental Botany 71: 7286', doi: '10.1093/jxb/eraa392',
      measured: 'Cabernet Sauvignon and Chardonnay: gas exchange and leaf hydraulic conductance against leaf Ψ, with microCT of leaves. Half closure at −0.60 MPa and 80 % closure at −1.21 MPa for Cabernet Sauvignon are in Table 2 (checked against the PDF).',
      fig: 'Abstract', badge: 'MEASURED' },
    'l3.order': { claim: 'In dehydrating grapevine, complete stomatal closure came several days before embolism appeared in leaves or stem.',
      cite: 'Hochberg et al. 2017, Plant Physiology 174: 764', doi: '10.1104/pp.16.01816',
      measured: 'Grapevine dry down with gas exchange and embolism imaging over time.', fig: 'Abstract', badge: 'MEASURED' },
    'l3.almond': { claim: 'Almond stem P50 lies between −2.97 and −3.80 MPa, and stomata are 90 % closed between −1.72 and −2.25 MPa, by cultivar.',
      cite: 'Álvarez-Maldini et al. 2022, Frontiers in Plant Science 13: 974050', doi: '10.3389/fpls.2022.974050',
      measured: 'Three cultivars (Avijor, Isabelona, Soleta). P50 by air injection on excised stems with a Weibull fit; Ψgs90 from gs against midday Ψ in a pot dry down. Air injection is a different method from the grapevine MRI.',
      fig: 'Table 2 and results text', badge: 'MEASURED' },
    'l3.plcshape': { claim: 'The S shaped vulnerability curve.', cite: 'Pammenter & Vander Willigen 1998, Tree Physiology 18: 589', doi: '10.1093/treephys/18.8-9.589',
      measured: 'The logistic form is published. Grapevine stem and petiole slopes (98.4 and 69.3 % per MPa) are DERIVED as 50 ÷ (Ψe − P50) from Charrier et al. 2016 Table I (microCT, Cabernet Sauvignon) and applied to the Hochberg P50 values: a hybrid of two studies. Almond and root use 50 % per MPa, ILLUSTRATIVE. P50 positions are measured.',
      fig: 'Model equation', badge: 'ILLUSTRATIVE' },
    'l3.airseed': { claim: 'Drought embolism spreads by air seeding: air is pulled from a gas filled conduit through the largest pore of a pit membrane once the pressure difference beats the capillary threshold, ΔP = 4T ÷ D.',
      cite: 'Choat & Pittermann 2009, New Phytologist 182: 557; Tixier et al. 2014, Annals of Botany 114: 325', doi: '10.1111/j.1469-8137.2009.02847.x', doi2: '10.1093/aob/mcu109',
      measured: 'Pit membrane structure sets the threshold. The equation is capillary physics with T = 0.0728 N m⁻¹ at 20 °C and a contact angle of 0; the pore sizes on the slider are illustrative. Not boiling, and not a bubble trapped in a wall defect.',
      fig: 'Review text', badge: 'DERIVED' },
    'l3.segment': { claim: 'Do distal organs reach P50 before the stem? Grapevine petioles did; twelve Australian tree species did not.',
      cite: 'Hochberg, Albuquerque et al. 2016, Plant, Cell and Environment 39: 1886; Peters & Choat 2025, Plant, Cell and Environment 48: 2162', doi: '10.1111/pce.12688', doi2: '10.1111/pce.15249',
      measured: 'Grapevine: petiole and stem of the same vines by MRI. Trees: segmentation was absent or negative in all 12 species. For how each organ was measured in the tree study, see the paper.',
      fig: 'Abstracts', badge: 'OPEN QUESTION' },
    'l3.romaine': { claim: 'No lettuce xylem P50 was found.', cite: 'Literature search for Lactuca sativa xylem vulnerability, no result', doi: '',
      measured: 'Nothing. The model leaves lettuce xylem fully conducting rather than invent a curve.', fig: 'none', badge: 'ILLUSTRATIVE' }
  };
  Object.keys(EV).forEach(function (k) { if (!WP.evidence[k]) WP.evidence[k] = EV[k]; });
  var BADGE_CLS = { MEASURED: 'verified', VERIFIED: 'verified', DERIVED: 'derived', ILLUSTRATIVE: 'illustrative', PREPRINT: 'preprint', 'OPEN QUESTION': 'preliminary', PRELIMINARY: 'preliminary' };
  function evBadge(b) { return '<span class="badge b-' + (BADGE_CLS[b] || 'illustrative') + '">' + esc(b) + '</span>'; }
  function ev(key) {
    if (ui && typeof ui.evidence === 'function') {
      try { var h = ui.evidence(key); if (typeof h === 'string' && h) return h; } catch (e) { /* fall back */ }
    }
    return '<button type="button" class="ev" data-ev="' + esc(key) + '" aria-expanded="false" title="Show the evidence behind this claim">Evidence</button>';
  }
  function evDrawer(key) {
    var e = WP.evidence[key];
    if (!e) return '<p>No evidence entry.</p>';
    var src = [];
    if (e.doi) src.push(ui.source(e.doi));
    if (e.doi2) src.push(ui.source(e.doi2));
    return '<div class="ev-hd">' + evBadge(e.badge) + ' <b>' + esc(e.claim) + '</b></div>' +
      '<dl><dt>Paper</dt><dd>' + esc(e.cite) + '</dd><dt>What was measured</dt><dd>' + esc(e.measured) + '</dd>' +
      '<dt>Figure or table</dt><dd>' + esc(e.fig) + '</dd>' +
      '<dt>DOI</dt><dd>' + (src.length ? src.join('<br>') : 'none') + '</dd></dl>';
  }
  function wireEvidence(host) {
    host.addEventListener('click', function (e) {
      var b = e.target.closest('button.ev[data-ev]');
      if (!b || !host.contains(b)) return;
      var open = b.getAttribute('aria-expanded') === 'true';
      var id = b.getAttribute('aria-controls');
      var d = id ? document.getElementById(id) : null;
      if (!d) {
        d = document.createElement('div');
        d.className = 'ev-drawer';
        d.id = 'ev-' + Math.random().toString(36).slice(2, 9);
        d.setAttribute('role', 'region');
        d.setAttribute('aria-label', 'Evidence');
        b.setAttribute('aria-controls', d.id);
        var blk = b.closest('p, li, .card, .tile, figcaption, .ev-host') || b.parentNode;
        blk.parentNode.insertBefore(d, blk.nextSibling);
      }
      d.innerHTML = evDrawer(b.getAttribute('data-ev'));
      d.hidden = open;
      b.setAttribute('aria-expanded', open ? 'false' : 'true');
    });
  }

  /* ------------------------------------------------------------ CSS */
  var CSS = '\
[data-tier="1"] #lv-organ .tier-2,[data-tier="1"] #lv-organ .tier-3,[data-tier="2"] #lv-organ .tier-3{display:none}\
[data-tier="2"] #lv-organ .tier-1-only,[data-tier="3"] #lv-organ .tier-1-only{display:none}\
#lv-organ .o3-ct{margin:18px 0 6px;padding:12px 14px;border:1px solid var(--rule2);border-radius:8px;background:var(--card)}\
#lv-organ .o3-cth{margin:0 0 4px;font-family:var(--ui);font-size:17px}\
#lv-organ .o3-ctp{margin:0 0 8px;font-family:var(--ui);font-size:13.5px;color:var(--ink2)}\
#lv-organ .o3-ctgrid{display:grid;grid-template-columns:minmax(0,1fr);gap:12px}\
@media (min-width:760px){#lv-organ .o3-ctgrid{grid-template-columns:minmax(0,1.25fr) minmax(0,1fr)}}\
#lv-organ .o3-ctimg{background:#000;border-radius:6px;overflow:hidden;aspect-ratio:1/1;display:flex;align-items:center;justify-content:center}\
#lv-organ .o3-ctimg img{width:100%;height:100%;object-fit:contain;display:block}\
#lv-organ .o3-ctl{display:flex;justify-content:space-between;font-family:var(--ui);font-size:13px}\
#lv-organ #o3-cts{width:100%}\
#lv-organ .o3-cttk{display:flex;justify-content:space-between;font-family:var(--mono,monospace);font-size:11.5px;color:var(--ink2);margin:-2px 0 8px}\
#lv-organ .o3-ctsee,#lv-organ .o3-ctnote{font-family:var(--ui);font-size:13.5px;margin:8px 0 0}\
#lv-organ .o3-ct3 h5{margin:12px 0 2px;font-family:var(--ui);font-size:15px}\
#lv-organ .o3-ct3g{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px}\
#lv-organ .o3-ct3g figure{margin:0}#lv-organ .o3-ct3g img{width:100%;height:auto;display:block;border-radius:5px;background:#000}\
#lv-organ .o3-ct3g figcaption{font-family:var(--ui);font-size:12px;color:var(--ink2);margin-top:3px}\
#lv-organ .o3-now{font-size:19px;line-height:1.45;margin:4px 0 14px;padding:10px 14px;border-left:4px solid var(--w2);background:var(--card)}\
#lv-organ .o3-now .k{display:block;font-family:var(--ui);font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink2);margin-bottom:2px}\
#lv-organ h3.o3-sec{font-family:var(--disp);font-weight:400;font-size:clamp(22px,2.6vw,27px);letter-spacing:.03em;margin:26px 0 2px;display:flex;gap:10px;align-items:baseline;flex-wrap:wrap}\
#lv-organ h3.o3-sec .no{font-family:var(--ui);font-size:12px;letter-spacing:.1em;border:1px solid var(--ink);border-radius:50%;width:30px;height:30px;display:inline-grid;place-items:center;flex:none}\
#lv-organ .o3-q{color:var(--ink2);font-style:italic;margin:0 0 10px}\
#lv-organ .o3-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:16px}\
@media (min-width:980px){#lv-organ .o3-grid{grid-template-columns:minmax(0,1.25fr) minmax(0,1fr)}}\
#lv-organ figure{margin:0}\
#lv-organ svg.o3-svg{display:block;width:100%;height:auto;border:1px solid var(--rule);background:var(--wall);--halo:var(--wall)}\
:root[data-theme="dark"] #lv-organ svg.o3-svg{background:var(--card);--halo:var(--card)}\
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) #lv-organ svg.o3-svg{background:var(--card);--halo:var(--card)}}\
#lv-organ svg text{fill:var(--ink);font-family:var(--text)}\
#lv-organ svg .t2{fill:var(--ink2)}\
#lv-organ svg .tui{font-family:var(--ui)}\
#lv-organ svg .tm{font-family:var(--mono)}\
#lv-organ svg .sc{font-variant-caps:all-small-caps;letter-spacing:.06em}\
#lv-organ svg .halo{paint-order:stroke;stroke:var(--halo);stroke-width:4px;stroke-linejoin:round}\
#lv-organ .cw{fill:var(--leaf2);stroke:var(--ink);stroke-width:.9}\
#lv-organ .cw2{fill:var(--leaf);stroke:var(--ink);stroke-width:.9}\
#lv-organ .ep{fill:var(--leaf3);stroke:var(--ink);stroke-width:.9;fill-opacity:.55}\
#lv-organ .en{fill:var(--card2);stroke:var(--ink);stroke-width:1.1}\
#lv-organ .pc{fill:var(--card);stroke:var(--ink);stroke-width:.8}\
#lv-organ .ph{fill:var(--leaf2);stroke:var(--ink);stroke-width:.6}\
#lv-organ .xv{stroke:var(--ink);stroke-width:1.4}\
#lv-organ .strip{fill:var(--ink)}\
#lv-organ .soilp{fill:var(--soil2);stroke:var(--ink);stroke-width:.6;stroke-opacity:.6;stroke-linejoin:round}\
#lv-organ .hair{fill:none;stroke:var(--ink2);stroke-width:2;stroke-linecap:round}\
#lv-organ .menisc{fill:none;stroke:var(--w2);stroke-width:2.4;stroke-linecap:round;opacity:.85}\
#lv-organ .exo{fill:var(--leaf3);fill-opacity:.35;stroke:var(--ink);stroke-width:1}\
#lv-organ .rt-cell.grey{stroke:var(--air)!important;opacity:.9}\
#lv-organ .xw-ray{fill:var(--card2);stroke:var(--ink);stroke-width:.5;stroke-opacity:.5}\
#lv-organ .xw-fib{fill:url(#o3-fib);stroke:var(--ink);stroke-width:1}\
#lv-organ .xw-ring{fill:none;stroke:var(--ink);stroke-width:1.4;stroke-dasharray:5 3}\
#lv-organ .pet-col{fill:none;stroke:var(--leaf3);stroke-width:12;stroke-opacity:.55}\
#lv-organ .pet-gp{fill:var(--card2);stroke:var(--ink);stroke-width:1.2}\
#lv-organ .pet-ph{fill:var(--leaf2);stroke:var(--ink);stroke-width:.6}\
#lv-organ .lac{fill:var(--air);stroke:var(--ink);stroke-width:.8}\
#lv-organ .rt-wall{fill:none;stroke:var(--warm);stroke-width:3;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:7 5;animation:o3-flow calc(1.6s / var(--wp-ps,1)) linear infinite}\
#lv-organ .rt-cell{fill:none;stroke:var(--w1);stroke-width:3.4;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:2 8;animation:o3-flow calc(1.6s / var(--wp-ps,1)) linear infinite}\
#lv-organ .rt-cell.slow{stroke-width:1.6;animation-duration:7s;opacity:.65}\
#lv-organ .rt-under{fill:none;stroke:var(--w4);stroke-width:6;stroke-linecap:round;stroke-linejoin:round;opacity:.65}\
#lv-organ .mem{stroke:var(--ink);stroke-width:1.6}\
#lv-organ .stop{stroke:var(--warm);stroke-width:3;stroke-linecap:round}\
#lv-organ .bneck{fill:none;stroke:var(--warm);stroke-width:2.2;stroke-dasharray:5 3}\
@keyframes o3-flow{to{stroke-dashoffset:-40}}\
:root[data-motion="reduce"] #lv-organ .rt-wall,:root[data-motion="reduce"] #lv-organ .rt-cell{animation:none}\
@media (prefers-reduced-motion:reduce){:root:not([data-motion="full"]) #lv-organ .rt-wall,:root:not([data-motion="full"]) #lv-organ .rt-cell{animation:none}}\
#lv-organ .lead{stroke:var(--ink2);stroke-width:.8;fill:none}\
#lv-organ .chips{margin:10px 0 0}\
#lv-organ .chip{min-height:40px}\
#lv-organ .o3-cap{font-size:15px;color:var(--ink2);font-style:italic;margin:8px 0 0}\
#lv-organ .o3-cap b{font-style:normal;color:var(--ink)}\
#lv-organ .card h4{font-family:var(--disp);font-weight:400;font-size:19px;letter-spacing:.03em;margin:0}\
#lv-organ .card p{margin:6px 0 0}\
#lv-organ .card+.card{margin-top:12px}\
#lv-organ .axis{stroke:var(--ink);stroke-width:1.2;fill:none}\
#lv-organ .grid{stroke:var(--rule2);stroke-width:.8}\
#lv-organ .c-gs{fill:none;stroke:var(--warm);stroke-width:3}\
#lv-organ .c-pet{fill:none;stroke:var(--w2);stroke-width:2.6;stroke-dasharray:9 5}\
#lv-organ .c-stem{fill:none;stroke:var(--ink);stroke-width:2.6}\
#lv-organ .band{fill:var(--w5);opacity:.55}\
:root[data-theme="dark"] #lv-organ .band{fill:var(--w0);opacity:.25}\
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) #lv-organ .band{fill:var(--w0);opacity:.25}}\
#lv-organ .now{stroke:var(--ink);stroke-width:1.2;stroke-dasharray:4 3}\
#lv-organ .pt-m{stroke:var(--paper);stroke-width:1.5}\
#lv-organ .pt-h{fill:var(--paper);stroke-width:2}\
#lv-organ .o3-tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin-top:10px}\
#lv-organ .o3-tiles .tile .v{font-size:20px}\
#lv-organ .o3-tiles .tile .s{font-family:var(--ui);font-size:12px;color:var(--ink2)}\
#lv-organ .o3-legend{display:flex;flex-wrap:wrap;gap:6px 16px;font-family:var(--ui);font-size:12.5px;color:var(--ink2);margin:6px 0 0;align-items:center}\
#lv-organ .o3-legend svg{width:30px;height:12px;vertical-align:-1px;margin-right:4px;border:0;background:none}\
#lv-organ .vc-emb{fill:var(--emb);stroke:var(--ink);stroke-width:1.3}\
#lv-organ .vc-wall{fill:none;stroke:var(--ink);stroke-width:1.3}\
#lv-organ .vc-tis{fill:var(--card2);stroke:var(--rule);stroke-width:.8}\
#lv-organ .pitm{fill:var(--card2);stroke:var(--ink);stroke-width:1}\
#lv-organ .gas{fill:var(--emb)}\
#lv-organ .o3-slider{display:grid;grid-template-columns:auto 1fr auto;gap:4px 10px;align-items:center;font-family:var(--ui);font-size:13px;margin-top:8px}\
#lv-organ .o3-slider output{font-family:var(--mono);font-size:13px;white-space:nowrap}\
#lv-organ .o3-two{display:grid;grid-template-columns:minmax(0,1fr);gap:14px}\
@media (min-width:820px){#lv-organ .o3-two{grid-template-columns:1fr 1fr}}\
#lv-organ .oq{border:1px solid var(--rule);background:var(--card);padding:14px 16px;margin-top:10px;position:relative}\
#lv-organ .oq .tag{display:inline-block;font-family:var(--ui);font-size:11px;letter-spacing:.12em;text-transform:uppercase;border:1px solid var(--b-pre);color:var(--b-pre);padding:2px 8px;border-radius:2px}\
#lv-organ .oq h4{font-family:var(--disp);font-weight:400;font-size:21px;margin:6px 0 0}\
#lv-organ .oq .side{border-top:1px solid var(--rule2);padding-top:8px}\
#lv-organ .oq .side h5{font-family:var(--ui);font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink2);margin:0}\
#lv-organ .oq .side p{margin:4px 0 0}\
#lv-organ table.o3-t{border-collapse:collapse;width:100%;font-family:var(--ui);font-size:13px;margin-top:8px}\
#lv-organ table.o3-t th,#lv-organ table.o3-t td{padding:5px 8px;border-bottom:1px solid var(--rule2);text-align:left;vertical-align:top}\
#lv-organ .o3-tw{overflow-x:auto}\
#lv-organ .ans[hidden]{display:none}\
#lv-organ .lp-blade{fill:url(#o3-lh);stroke:var(--ink);stroke-width:1.4;stroke-linejoin:round}\
#lv-organ .lp-blade.rom{fill:var(--leaf)}\
#lv-organ .lp-rib{fill:var(--rib);stroke:var(--ink);stroke-width:.8}\
#lv-organ .lp-v1{fill:none;stroke:var(--w1);stroke-width:3;stroke-linecap:round}\
#lv-organ .lp-v2{fill:none;stroke:var(--w2);stroke-width:1.5;stroke-linecap:round}\
#lv-organ .lp-v3{fill:none;stroke:var(--w3);stroke-width:.9}\
#lv-organ .lp-v4{fill:none;stroke:var(--w3);stroke-width:.45;stroke-opacity:.8}\
#lv-organ .lp-pet{fill:none;stroke:var(--ink);stroke-width:9;stroke-linecap:round}\
#lv-organ .lp-emb{fill:none;stroke:var(--emb);stroke-width:2.6;stroke-linecap:round}\
#lv-organ .lp-ox{fill:none;stroke:var(--warm);stroke-width:.9;stroke-dasharray:2 2.5}\
#lv-organ .lp-sto{fill:var(--leaf2);stroke:var(--ink);stroke-width:.5;stroke-opacity:.8}\
#lv-organ .lp-vap{fill:none;stroke:var(--air);stroke-width:1.2;stroke-linecap:round}\
#lv-organ .lp-dot{fill:var(--paper);stroke:var(--w0);stroke-width:1}\
#lv-organ .lp-dot.ox{fill:var(--warm);stroke:none}\
#lv-organ .lp-dot.emb{fill:var(--emb);stroke:none}\
#lv-organ use.lp-dot{fill:none;stroke:none}#lv-organ use.lp-dot.ox{filter:drop-shadow(0 0 1.5px rgba(214,140,40,.95))}\
:root[data-theme="dark"] #lv-organ .lp-dot{fill:#eaf3ff;stroke:none;filter:drop-shadow(0 0 2px rgba(120,180,255,.9))}\
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) #lv-organ .lp-dot{fill:#eaf3ff;stroke:none;filter:drop-shadow(0 0 2px rgba(120,180,255,.9))}}\
:root[data-theme="dark"] #lv-organ .lp-blade{stroke:var(--leaf3)}\
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) #lv-organ .lp-blade{stroke:var(--leaf3)}}\
#lv-organ .ev-drawer{font-family:var(--ui);font-size:13px;line-height:1.45;border:1px solid var(--rule);border-left:4px solid var(--accent);background:var(--paper);padding:8px 12px;margin:6px 0 10px}\
#lv-organ .ev-drawer dl{display:grid;grid-template-columns:minmax(0,9em) minmax(0,1fr);gap:3px 10px;margin:6px 0 0}\
#lv-organ .ev-drawer dt{color:var(--ink2)}\
#lv-organ .ev-drawer dd{margin:0;overflow-wrap:anywhere}\
@media (max-width:520px){#lv-organ .ev-drawer dl{grid-template-columns:minmax(0,1fr)}#lv-organ .ev-drawer dd{margin-bottom:4px}}\
';

  /* ------------------------------------------------------------ deterministic noise */
  function rng(seed) { var s = seed; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; }
  function pol(cx, cy, r, a) { return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }
  function deg(d) { return d * Math.PI / 180; }

  /* ------------------------------------------------------------ 3a root cross section (viewBox 0 0 560 560) */
  var RC = [270, 280];
  function arcCell(cx, cy, r0, r1, a0, a1, cls) {
    var p0 = pol(cx, cy, r0, a0), p1 = pol(cx, cy, r1, a0), p2 = pol(cx, cy, r1, a1), p3 = pol(cx, cy, r0, a1);
    return '<path class="' + cls + '" d="M' + f1(p0[0]) + ',' + f1(p0[1]) + ' L' + f1(p1[0]) + ',' + f1(p1[1]) +
      ' A' + r1 + ',' + r1 + ' 0 0 1 ' + f1(p2[0]) + ',' + f1(p2[1]) + ' L' + f1(p3[0]) + ',' + f1(p3[1]) +
      ' A' + r0 + ',' + r0 + ' 0 0 0 ' + f1(p0[0]) + ',' + f1(p0[1]) + 'Z"/>';
  }
  var ROUTE_A = deg(-24), CELL_A = deg(14);
  function rootStatic() {
    var cx = RC[0], cy = RC[1], s = '', R = rng(11), i, n, a;
    // soil: angular mineral grains, with root hairs threading between them and water menisci at the contacts
    var grains = [];
    for (i = 0; i < 80; i++) {
      a = R() * Math.PI * 2; var rr = 266 + R() * 60;
      var p = pol(cx, cy, rr, a);
      if (p[0] < 8 || p[0] > 552 || p[1] < 8 || p[1] > 552) continue;
      var sz = 7 + R() * 9, nv = 5 + Math.floor(R() * 3), poly = [];
      for (var v = 0; v < nv; v++) { var b = v / nv * Math.PI * 2 + R() * 0.5; poly.push(pol(p[0], p[1], sz * (0.65 + R() * 0.5), b)); }
      grains.push({ p: p, sz: sz });
      s += '<path class="soilp" d="M' + poly.map(function (q) { return f1(q[0]) + ',' + f1(q[1]); }).join(' L') + 'Z"/>';
    }
    // epidermis
    n = 44;
    for (i = 0; i < n; i++) s += arcCell(cx, cy, 226, 246, i * 2 * Math.PI / n + 0.004, (i + 1) * 2 * Math.PI / n - 0.004, 'ep');
    // 14 root hairs between the grains; a meniscus where a hair meets a grain
    for (i = 0; i < 14; i++) {
      var ha = (i + 0.5) / 14 * Math.PI * 2 + (R() - 0.5) * 0.12;
      if (i === 3) ha = CELL_A;
      var h0 = pol(cx, cy, 246, ha), L = 48 + R() * 26, h1 = pol(cx, cy, 246 + L, ha + (R() - 0.5) * 0.12), hm = pol(cx, cy, 246 + L * 0.5, ha + 0.03);
      s += '<path class="hair" d="M' + f1(h0[0]) + ',' + f1(h0[1]) + ' Q' + f1(hm[0]) + ',' + f1(hm[1]) + ' ' + f1(h1[0]) + ',' + f1(h1[1]) + '"/>';
      var best = null, bd = 1e9;
      grains.forEach(function (g) { var dd = Math.hypot(g.p[0] - h1[0], g.p[1] - h1[1]); if (dd < bd) { bd = dd; best = g; } });
      if (best && bd < 40) {
        var mx = (best.p[0] + h1[0]) / 2, my = (best.p[1] + h1[1]) / 2;
        s += '<path class="menisc" d="M' + f1(h1[0]) + ',' + f1(h1[1]) + ' Q' + f1(mx + 4) + ',' + f1(my + 4) + ' ' + f1(best.p[0]) + ',' + f1(best.p[1]) + '"/>';
      }
    }
    // exodermis: a suberised outer layer of the cortex in many roots
    n = 40;
    for (i = 0; i < n; i++) s += arcCell(cx, cy, 212, 225, i * 2 * Math.PI / n + 0.006, (i + 1) * 2 * Math.PI / n - 0.006, 'exo');
    // cortex: three rings of round cells
    [[198, 32], [173, 29], [150, 25]].forEach(function (ring, k) {
      var r = ring[0], m = ring[1], rad = Math.PI * r / m * 0.94;
      for (var j = 0; j < m; j++) {
        var aa = (j + (k % 2 ? 0.5 : 0)) * 2 * Math.PI / m, c = pol(cx, cy, r, aa);
        s += '<circle class="' + (k === 1 ? 'cw2' : 'cw') + '" cx="' + f1(c[0]) + '" cy="' + f1(c[1]) + '" r="' + f1(Math.min(rad, 11.8)) + '"/>';
      }
    });
    // endodermis with the Casparian strip in every radial wall
    n = 26;
    for (i = 0; i < n; i++) s += arcCell(cx, cy, 124, 141, i * 2 * Math.PI / n + 0.006, (i + 1) * 2 * Math.PI / n - 0.006, 'en');
    for (i = 0; i < n; i++) {
      a = i * 2 * Math.PI / n;
      var q0 = pol(cx, cy, 129, a), q1 = pol(cx, cy, 136, a);
      s += '<path d="M' + f1(q0[0]) + ',' + f1(q0[1]) + ' L' + f1(q1[0]) + ',' + f1(q1[1]) + '" stroke="var(--ink)" stroke-width="4.2" stroke-linecap="butt"/>';
    }
    // pericycle
    n = 22;
    for (i = 0; i < n; i++) s += arcCell(cx, cy, 110, 123, i * 2 * Math.PI / n + 0.01, (i + 1) * 2 * Math.PI / n - 0.01, 'pc');
    // stele background
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="109" class="pc" style="fill:var(--paper)"/>';
    // phloem patches between xylem arms
    [45, 135, 225, 315].forEach(function (d) {
      for (var j = 0; j < 7; j++) {
        var c = pol(cx, cy, 70 + (j % 3) * 11, deg(d) + (j - 3) * 0.09);
        s += '<circle class="ph" cx="' + f1(c[0]) + '" cy="' + f1(c[1]) + '" r="' + (5 + (j % 2)) + '"/>';
      }
    });
    return s;
  }
  function xylemArms(fill) {
    var cx = RC[0], cy = RC[1], s = '';
    s += '<circle class="xv" cx="' + cx + '" cy="' + cy + '" r="19" fill="' + fill + '"/>';
    [0, 90, 180, 270].forEach(function (d) {
      [[42, 13], [66, 9.5], [86, 6.5], [100, 4.5]].forEach(function (v) {
        var c = pol(cx, cy, v[0], deg(d));
        s += '<circle class="xv" cx="' + f1(c[0]) + '" cy="' + f1(c[1]) + '" r="' + v[1] + '" fill="' + fill + '"/>';
      });
    });
    return s;
  }
  /* r7 unifier: water molecules (mol.js template) ride the two drawn routes of the root section. Speed follows the
     model E (12 viewBox units s⁻¹ per mmol m⁻² s⁻¹, drawing scale ILLUSTRATIVE); with the aquaporins closed the
     membrane crossings run at a sixth of that speed. Orange halo = wall route, blue halo = through the cells. */
  var RF = null;
  function rootFlow(st, res) {
    var MS = WP.molsvg, svg = refs.rd && refs.rd.ownerSVGElement; if (!MS || !MS.flow || !svg) return;
    if (!RF) {
      var g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); g.setAttribute('id', 'o3-rmol'); g.setAttribute('pointer-events', 'none');
      svg.appendChild(g); RF = MS.flow(svg, g, ui.reducedMotion);
      ui.onPrefs(function () { RF.run(); });
    }
    var v = clamp(12 * res.E, 3, 60), slow = opts.aqpClosed ? 1 / 6 : 1, list = [];
    Array.prototype.forEach.call(refs.rd.querySelectorAll('path.rt-wall'), function (p) { list.push({ el: p, v: v * 1.4, gap: 26, halo: '#E69F00', s: 1.25 }); });
    Array.prototype.forEach.call(refs.rd.querySelectorAll('path.rt-cell'), function (p) { list.push({ el: p, v: v * slow, gap: 30, halo: '#0072B2', s: 1.25 }); });
    RF.set(list);
  }
  function rootDynamic(st, res) {
    var cx = RC[0], cy = RC[1], s = '';
    s += xylemArms(ui.water(res.psi.root));
    // lacunae (Cuneo et al. 2016), qualitative
    if (opts.lacunae) {
      var R = rng(5);
      for (var i = 0; i < 9; i++) {
        var a = deg(i * 40 + 12), r = 170 + R() * 30, c = pol(cx, cy, r, a);
        var w = 16 + R() * 12, h = 9 + R() * 6;
        s += '<path class="lac" d="M' + f1(c[0] - w / 2) + ',' + f1(c[1]) + ' q' + f1(w * 0.25) + ',' + f1(-h) + ' ' + f1(w * 0.5) + ',' + f1(-h * 0.4) + ' q' + f1(w * 0.3) + ',' + f1(-h * 0.5) + ' ' + f1(w * 0.5) + ',' + f1(h * 0.4) + ' q' + f1(-w * 0.2) + ',' + f1(h * 1.1) + ' ' + f1(-w * 0.55) + ',' + f1(h * 0.7) + ' q' + f1(-w * 0.3) + ',' + f1(h * 0.2) + ' ' + f1(-w * 0.45) + ',' + f1(-h * 0.7) + 'Z" transform="rotate(' + Math.round(i * 40 + 102) + ' ' + f1(c[0]) + ' ' + f1(c[1]) + ')"/>';
      }
    }
    // wall route: zigzag between cortical cells, stopped at the strip, then forced across a membrane
    if (opts.wall) {
      var A = ROUTE_A, zz = [], rr = [262, 246, 232, 220, 206, 194, 181, 168, 155, 145, 136];
      rr.forEach(function (r, k) { zz.push(pol(cx, cy, r, A + (k % 2 ? 0.07 : -0.02))); });
      var stripA = Math.round(A / (2 * Math.PI / 26)) * (2 * Math.PI / 26);
      var sp = pol(cx, cy, 136, stripA);
      zz.push(sp);
      s += '<path class="rt-wall" marker-end="url(#o3-mw)" d="M' + zz.map(function (p) { return f1(p[0]) + ',' + f1(p[1]); }).join(' L') + '"/>';
      // the block
      var b0 = pol(cx, cy, 133, stripA - 0.05), b1 = pol(cx, cy, 133, stripA + 0.05);
      s += '<path class="stop" d="M' + f1(b0[0] - 5) + ',' + f1(b0[1] - 5) + ' L' + f1(b1[0] + 5) + ',' + f1(b1[1] + 5) + ' M' + f1(b0[0] - 5) + ',' + f1(b1[1] + 5) + ' L' + f1(b1[0] + 5) + ',' + f1(b0[1] - 5) + '"/>';
      // forced into the endodermal cell: membrane crossing, then on to the xylem
      var ec = pol(cx, cy, 132, stripA + Math.PI / 26), m0 = pol(cx, cy, 138, stripA + 0.06);
      var x1 = pol(cx, cy, 104, deg(-6)), x2 = pol(cx, cy, 88, deg(-3));
      s += '<path class="rt-cell' + (opts.aqpClosed ? ' slow grey' : '') + '" marker-end="url(' + (opts.aqpClosed ? '#o3-mg' : '#o3-mc') + ')" d="M' + f1(m0[0]) + ',' + f1(m0[1]) + ' Q' + f1(ec[0] + 4) + ',' + f1(ec[1]) + ' ' + f1(ec[0]) + ',' + f1(ec[1]) + ' L' + f1(x1[0]) + ',' + f1(x1[1]) + ' L' + f1(x2[0]) + ',' + f1(x2[1]) + '"/>';
    }
    // cell route: root hair, then cell to cell across membranes
    if (opts.cell) {
      var C = CELL_A, pts = [pol(cx, cy, 292, C + 0.045), pol(cx, cy, 236, C), pol(cx, cy, 208, C + 0.02), pol(cx, cy, 181, C - 0.02), pol(cx, cy, 155, C + 0.01), pol(cx, cy, 132, C - 0.01), pol(cx, cy, 116, C - 0.05), pol(cx, cy, 100, deg(4)), pol(cx, cy, 86, deg(2))];
      var d = 'M' + pts.map(function (p) { return f1(p[0]) + ',' + f1(p[1]); }).join(' L');
      s += '<path class="rt-under" d="' + d + '"/>';
      s += '<path class="rt-cell' + (opts.aqpClosed ? ' slow' : '') + '" marker-end="url(#o3-mc)" d="' + d + '"/>';
      if (opts.aqpClosed) { var e0 = pol(cx, cy, 141, C), e1 = pol(cx, cy, 118, C - 0.04); s += '<path class="rt-cell slow grey" d="M' + f1(e0[0]) + ',' + f1(e0[1]) + ' L' + f1(e1[0]) + ',' + f1(e1[1]) + '"/>'; }
      // membrane crossings: a short bar across the path between cells
      [222, 194, 168, 143, 124].forEach(function (r) {
        var p = pol(cx, cy, r, C), t = C + Math.PI / 2;
        s += '<path class="mem" d="M' + f1(p[0] + 7 * Math.cos(t)) + ',' + f1(p[1] + 7 * Math.sin(t)) + ' L' + f1(p[0] - 7 * Math.cos(t)) + ',' + f1(p[1] - 7 * Math.sin(t)) + '"/>';
      });
    }
    // bottleneck ring when aquaporins close
    if (opts.aqpClosed) {
      s += '<circle class="bneck" cx="' + cx + '" cy="' + cy + '" r="132.5"/>';
      var bl = pol(cx, cy, 146, deg(200));
      s += '<text x="12" y="104" text-anchor="start" font-size="14" class="halo" style="fill:var(--warm)">the bottleneck: every path</text>' +
        '<text x="12" y="122" text-anchor="start" font-size="14" class="halo" style="fill:var(--warm)">must cross a membrane here</text>';
    }
    // labels
    function lab(r, a, tx, ty, txt, anchor) {
      var p = pol(cx, cy, r, deg(a));
      return '<path class="lead" d="M' + f1(p[0]) + ',' + f1(p[1]) + ' L' + tx + ',' + ty + '"/><text x="' + tx + '" y="' + (ty + (ty < p[1] ? -4 : 12)) + '" text-anchor="' + (anchor || 'start') + '" font-size="17" class="halo">' + txt + '</text>';
    }
    s += lab(236, 228, 30, 40, 'epidermis');
    s += lab(218, 248, 150, 18, 'exodermis');
    s += '<text x="548" y="24" text-anchor="end" font-size="14" class="halo">root hairs between soil grains;</text><text x="548" y="42" text-anchor="end" font-size="14" class="halo" style="fill:var(--w1)">water films at each contact</text>';
    s += lab(181, 200, 18, 190, 'cortex');
    s += lab(133, 160, 30, 452, 'endodermis');
    s += lab(117, 120, 120, 500, 'pericycle');
    s += lab(20, 250, 300, 30, 'xylem', 'start');
    var cs = pol(cx, cy, 133, 0 + 2 * Math.PI / 26 * 5);
    s += '<path class="lead" d="M' + f1(cs[0]) + ',' + f1(cs[1]) + ' L470,520"/><text x="548" y="514" text-anchor="end" font-size="14" class="halo" font-weight="600">Casparian strip</text><text x="548" y="532" text-anchor="end" font-size="13" class="halo t2">lignin, in the radial walls</text>';
    if (opts.wall) { var wl = pol(cx, cy, 262, ROUTE_A); s += '<text x="' + f1(wl[0] - 4) + '" y="' + f1(wl[1] - 22) + '" text-anchor="middle" font-size="14" class="halo" style="fill:var(--warm)">wall route</text>'; }
    if (opts.cell) { var cl = pol(cx, cy, 296, CELL_A + 0.06); s += '<text x="' + f1(cl[0] - 60) + '" y="' + f1(cl[1] + 24) + '" font-size="14" class="halo" style="fill:var(--w1)">cell route</text>'; }
    s += '<text x="20" y="548" font-size="12" class="t2" font-style="italic">A young root in cross section, drawn for this exhibit. Not to scale.</text>';
    return s;
  }

  function parallelSVG() {
    // left: root endodermis ring; right: a leaf minor vein with its bundle sheath
    var s = '<svg class="o3-svg" viewBox="0 0 440 190" role="img" aria-label="The root endodermis and the leaf bundle sheath both wrap the water conducting tissue"><g>';
    var cx = 100, cy = 92, i, n = 14;
    for (i = 0; i < n; i++) s += arcCell(cx, cy, 44, 60, i * 2 * Math.PI / n + 0.01, (i + 1) * 2 * Math.PI / n - 0.01, 'en');
    for (i = 0; i < n; i++) { var q0 = pol(cx, cy, 49, i * 2 * Math.PI / n), q1 = pol(cx, cy, 55, i * 2 * Math.PI / n); s += '<path d="M' + f1(q0[0]) + ',' + f1(q0[1]) + ' L' + f1(q1[0]) + ',' + f1(q1[1]) + '" stroke="var(--ink)" stroke-width="3.4"/>'; }
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="43" class="pc" style="fill:var(--paper)"/><circle cx="' + cx + '" cy="' + cy + '" r="12" class="xv" fill="var(--w2)"/>';
    s += '<text x="' + cx + '" y="176" text-anchor="middle" font-size="14">root endodermis</text>';
    var vx = 330, vy = 92; n = 10;
    for (i = 0; i < n; i++) { var c = pol(vx, vy, 40, i * 2 * Math.PI / n); s += '<circle cx="' + f1(c[0]) + '" cy="' + f1(c[1]) + '" r="13.5" class="en"/>'; }
    for (i = 0; i < n; i++) { var q = pol(vx, vy, 40, (i + 0.5) * 2 * Math.PI / n); s += '<circle cx="' + f1(q[0]) + '" cy="' + f1(q[1]) + '" r="2.6" fill="none" stroke="var(--ink)" stroke-width="1.2" stroke-dasharray="2 2"/>'; }
    s += '<circle cx="' + vx + '" cy="' + vy + '" r="26" class="pc" style="fill:var(--paper)"/><circle cx="' + (vx - 7) + '" cy="' + (vy - 3) + '" r="7" class="xv" fill="var(--w2)"/><circle cx="' + (vx + 8) + '" cy="' + (vy + 4) + '" r="5.5" class="xv" fill="var(--w2)"/><circle cx="' + (vx + 2) + '" cy="' + (vy + 14) + '" r="5" class="ph"/>';
    s += '<text x="' + vx + '" y="176" text-anchor="middle" font-size="14">leaf bundle sheath</text>';
    s += '<path d="M178,92 H252" stroke="var(--ink2)" stroke-width="1" marker-end="url(#o3-ar)" marker-start="url(#o3-ar)"/><text x="215" y="82" text-anchor="middle" font-size="13" class="t2" font-style="italic">same job?</text>';
    s += '<defs><marker id="o3-ar" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L8,4 L0,8z" fill="var(--ink2)"/></marker></defs>';
    return s + '</g></svg>';
  }

  /* ------------------------------------------------------------ 3b chart (viewBox 0 0 760 430) */
  var CH = { x0: 74, x1: 736, y0: 36, y1: 340 };
  function vbW() { return root && root.clientWidth && root.clientWidth < 620 ? 480 : 760; }
  var XMIN = { grape: -3, almond: -5, romaine: -3 };
  function chartSVG(st, res) {
    var crop = st.crop, M = WP.model, xmin = XMIN[crop], W = vbW();
    CH = { x0: W < 600 ? 60 : 74, x1: W - 22, y0: 36, y1: 340 };
    function X(p) { return CH.x0 + (CH.x1 - CH.x0) * (p / xmin); }
    function Y(v) { return CH.y1 - (CH.y1 - CH.y0) * v / 100; }
    var s = '';
    // safety gap band
    if (crop === 'grape') {
      s += '<rect class="band" x="' + f1(X(-0.60)) + '" y="' + CH.y0 + '" width="' + f1(X(-1.54) - X(-0.60)) + '" height="' + (CH.y1 - CH.y0) + '"/>';
      s += '<text x="' + f1((X(-0.60) + X(-1.54)) / 2) + '" y="' + (CH.y0 + 16) + '" text-anchor="middle" font-size="13" class="t2 halo" font-style="italic">the gap: stomata closing,</text><text x="' + f1((X(-0.60) + X(-1.54)) / 2) + '" y="' + (CH.y0 + 32) + '" text-anchor="middle" font-size="13" class="t2 halo" font-style="italic">pipes still mostly full</text>';
    } else if (crop === 'almond') {
      s += '<rect class="band" x="' + f1(X(-2.25)) + '" y="' + CH.y0 + '" width="' + f1(X(-2.97) - X(-2.25)) + '" height="' + (CH.y1 - CH.y0) + '"/>';
      s += '<text x="' + f1((X(-2.25) + X(-2.97)) / 2) + '" y="' + (CH.y0 + 16) + '" text-anchor="middle" font-size="13" class="t2 halo" font-style="italic">the gap</text>';
    }
    // grid and axes
    var step = xmin <= -4 ? 1 : 0.5;
    for (var p = 0; p >= xmin - 1e-9; p -= step) {
      s += '<path class="grid" d="M' + f1(X(p)) + ',' + CH.y0 + ' V' + CH.y1 + '"/>';
      s += '<text x="' + f1(X(p)) + '" y="' + (CH.y1 + 20) + '" text-anchor="middle" font-size="13" class="tm t2">' + num(p, step < 1 ? 1 : 0) + '</text>';
    }
    for (var v = 0; v <= 100; v += 25) {
      s += '<path class="grid" d="M' + CH.x0 + ',' + f1(Y(v)) + ' H' + CH.x1 + '"/>';
      s += '<text x="' + (CH.x0 - 8) + '" y="' + f1(Y(v) + 4) + '" text-anchor="end" font-size="13" class="tm t2">' + v + '</text>';
    }
    s += '<path class="axis" d="M' + CH.x0 + ',' + CH.y0 + ' V' + CH.y1 + ' H' + CH.x1 + '"/>';
    s += '<text x="' + ((CH.x0 + CH.x1) / 2) + '" y="' + (CH.y1 + 44) + '" text-anchor="middle" font-size="14">water potential, MPa (more negative to the right: drier)</text>';
    s += '<text transform="translate(18,' + ((CH.y0 + CH.y1) / 2) + ') rotate(-90)" text-anchor="middle" font-size="12.5">% stomata closed, or % xylem lost (area or theoretical conductivity, by study)</text>';
    // curves
    function curve(fn, cls) {
      var d = '', n = 140;
      for (var i = 0; i <= n; i++) { var x = xmin * i / n, y = fn(x); if (y === null) return ''; d += (i ? ' L' : 'M') + f1(X(x)) + ',' + f1(Y(clamp(y, 0, 100))); }
      return '<path class="' + cls + '" d="' + d + '"/>';
    }
    var P50s = M.P50(crop, 'stem'), P50p = M.P50(crop, 'petiole');
    s += curve(function (x) { return 100 * (1 - M.fPsi(x, crop, st.ko)); }, 'c-gs');
    var sS = M.slope(crop, 'stem'), sP = M.slope(crop, 'petiole'), P50r = M.P50(crop, 'root');
    if (P50s !== null) s += curve(function (x) { return M.plc(x, P50s, sS); }, 'c-stem');
    if (crop === 'grape') s += curve(function (x) { return M.plc(x, P50p, sP); }, 'c-pet');
    if (P50r !== null && P50r !== undefined) s += '<g class="tier-3">' + curve(function (x) { return M.plc(x, P50r); }, 'c-stem" stroke-dasharray="2 5') + '</g>';
    // direct curve labels
    function labAt(x, fn, txt, col, dy) {
      var y = Y(fn(x));
      return '<text x="' + f1(X(x) + 6) + '" y="' + f1(y + (dy || 0)) + '" font-size="14" font-weight="600" class="halo" style="fill:' + col + '">' + txt + '</text>';
    }
    var gsLabX = crop === 'grape' ? -0.25 : (crop === 'almond' ? -0.6 : -0.6);
    s += labAt(gsLabX, function (x) { return 100 * (1 - M.fPsi(x, crop, st.ko)); }, 'stomata closed', 'var(--warm)', -10);
    if (crop === 'grape') {
      s += labAt(-2.45, function (x) { return M.plc(x, P50p, sP); }, 'petiole', 'var(--w2)', -12);
      s += labAt(-2.6, function (x) { return M.plc(x, P50s, sS); }, 'stem', 'var(--ink)', 26);
    } else if (crop === 'almond') {
      s += labAt(-4.05, function (x) { return M.plc(x, P50s, sS); }, 'stem', 'var(--ink)', 22);
    } else {
      s += '<text x="' + f1(X(-1.9)) + '" y="' + f1(Y(14)) + '" font-size="15" class="halo">xylem P50: not found for lettuce</text>';
      s += '<text x="' + f1(X(-1.9)) + '" y="' + f1(Y(14) + 18) + '" font-size="13" class="t2 halo" font-style="italic">no curve is drawn rather than invent one</text>';
    }
    // published points
    function sq(x, y, col, lbl, la, hollow) {
      var px = X(x), py = Y(y);
      return '<rect x="' + f1(px - 6) + '" y="' + f1(py - 6) + '" width="12" height="12" class="' + (hollow ? 'pt-h' : 'pt-m') + '" style="' + (hollow ? 'stroke:' + col : 'fill:' + col) + '"/>' + (lbl ? '<text x="' + f1(px + (la === 'end' ? -10 : 10)) + '" y="' + f1(py + (la === 'end' ? -10 : 18)) + '" text-anchor="' + (la || 'start') + '" font-size="12.5" class="halo">' + lbl + '</text>' : '');
    }
    function dia(x, y, col, lbl, anchor, dy, hollow) {
      var px = X(x), py = Y(y);
      return '<path d="M' + f1(px) + ',' + f1(py - 8) + ' L' + f1(px + 8) + ',' + f1(py) + ' L' + f1(px) + ',' + f1(py + 8) + ' L' + f1(px - 8) + ',' + f1(py) + 'Z" class="' + (hollow ? 'pt-h' : 'pt-m') + '" style="' + (hollow ? 'stroke:' + col : 'fill:' + col) + '"/>' + (lbl ? '<text x="' + f1(px + (anchor === 'end' ? -12 : 12)) + '" y="' + f1(py + (dy || 4)) + '" text-anchor="' + (anchor || 'start') + '" font-size="12.5" class="halo">' + lbl + '</text>' : '');
    }
    function circ(x, y, col, lbl, anchor, dy) {
      var px = X(x), py = Y(y);
      return '<circle cx="' + f1(px) + '" cy="' + f1(py) + '" r="6.5" class="pt-m" style="fill:' + col + '"/>' + (lbl ? '<text x="' + f1(px + (anchor === 'end' ? -10 : 10)) + '" y="' + f1(py + (dy || 4)) + '" text-anchor="' + (anchor || 'start') + '" font-size="12.5" class="halo">' + lbl + '</text>' : '');
    }
    var pts = '';
    if (crop === 'grape') {
      pts += sq(-1.54, 50, 'var(--w2)', '', 'end') + '<text x="' + f1(X(-1.54) - 12) + '" y="' + f1(Y(50) + 24) + '" text-anchor="end" font-size="12.5" class="halo">petiole P50 −1.54, MRI</text>';
      pts += sq(-1.90, 50, 'var(--ink)', 'stem P50 −1.90, MRI');
      pts += dia(-1.6, 50, 'var(--w2)', '', 'start', 4, true);
      pts += '<text x="' + f1(X(-1.6) + 2) + '" y="' + f1(Y(50) - 26) + '" font-size="12" class="halo t2">◇ about half the petiole</text><text x="' + f1(X(-1.6) + 2) + '" y="' + f1(Y(50) - 12) + '" font-size="12" class="halo t2">vessels at −1.6, microCT</text>';
      pts += circ(-1.2, 80, 'var(--warm)', 'gs down 80 % by −1.2', 'start', 18);
      // Charrier 2016 (microCT, theoretical conductivity) and Brodersen 2013 (HRCT, Weibull): MEASURED, beside Hochberg; never merged with stomatal ψ50
      function tip(t) { return '<title>' + t + '</title>'; }
      pts += '<g>' + tip('Charrier et al. 2016, petiole P50 −0.98 MPa, microCT, theoretical conductivity, Cabernet Sauvignon') + dia(-0.98, 50, 'var(--w2)', '', 'end', -10, true) + '</g>';
      pts += '<g>' + tip('Charrier et al. 2016, leaf P50 −1.08 MPa, microCT, theoretical conductivity') + '<circle cx="' + f1(X(-1.08)) + '" cy="' + f1(Y(50)) + '" r="6" class="pt-h" style="stroke:var(--w2)"/></g>';
      pts += '<g>' + tip('Charrier et al. 2016, stem P50 −1.73 MPa, microCT, theoretical conductivity') + dia(-1.73, 50, 'var(--ink)', '', 'end', -10, true) + '</g>';
      pts += '<text x="' + f1(X(-1.03)) + '" y="' + f1(Y(50) - 16) + '" text-anchor="middle" font-size="12" class="halo t2">Charrier 2016, microCT</text>';
      pts += '<g class="tier-3">' + tip('Brodersen et al. 2013, stem P50 −2.2 MPa, HRCT, Weibull fit, theoretical conductivity') + sq(-2.2, 50, 'var(--ink)', '', 'start', true) + '<text x="' + f1(X(-2.2)) + '" y="' + f1(Y(50) - 14) + '" text-anchor="middle" font-size="12" class="halo t2">Brodersen 2013</text></g>';
      pts += '<g class="tier-3">' + tip('Cuneo et al. 2016, fine root xylem P50 −1.8 MPa, microCT') + circ(-1.8, 50, 'var(--ink3)', '', 'start') + '<text x="' + f1(X(-1.8)) + '" y="' + f1(Y(50) + 40) + '" text-anchor="middle" font-size="12" class="halo t2">fine root −1.8; coarse root −3.5 off axis</text></g>';
    } else if (crop === 'almond') {
      [[-2.97, 'Avijor'], [-3.80, 'Isabelona'], [-3.73, 'Soleta']].forEach(function (c, i) { pts += sq(c[0], 50, 'var(--ink)', i === 0 ? 'stem P50 by cultivar, air injection' : '', 'end'); });
      [[-1.72, 'Avijor'], [-2.25, 'Isabelona'], [-2.14, 'Soleta']].forEach(function (c, i) { pts += circ(c[0], 90, 'var(--warm)', i === 1 ? '90 % closed, by cultivar' : '', 'start', 20); });
    }
    s += '<g aria-label="Published data points">' + pts + '</g>';
    // live markers, each organ at its own Ψ
    var lo = res.psi.leafOut;
    s += '<path class="now" d="M' + f1(X(clamp(lo, xmin, 0))) + ',' + CH.y0 + ' V' + CH.y1 + '"/>';
    s += '<text x="' + f1(X(clamp(lo, xmin, 0)) + 5) + '" y="' + (CH.y1 - 8) + '" font-size="13" font-weight="600" class="halo">leaf Ψ now ' + num(lo, 2) + '</text>';
    function mark(x, y, col) { return '<circle cx="' + f1(X(clamp(x, xmin, 0))) + '" cy="' + f1(Y(y)) + '" r="8" fill="none" stroke="' + col + '" stroke-width="3"/><circle cx="' + f1(X(clamp(x, xmin, 0))) + '" cy="' + f1(Y(y)) + '" r="3" fill="' + col + '"/>'; }
    s += mark(lo, 100 * (1 - res.fPsi), 'var(--warm)');
    if (res.PLC.stem !== null) s += mark(res.psi.stem, res.PLC.stem, 'var(--ink)');
    if (crop === 'grape' && res.PLC.petiole !== null) s += mark(res.psi.petiole, res.PLC.petiole, 'var(--w2)');
    if (res.PLC.root !== null && res.PLC.root !== undefined) s += '<g class="tier-3">' + mark(res.psi.root, res.PLC.root, 'var(--ink3)') + '</g>';
    return s;
  }

  /* tier 1 ruler: the order of events on one line */
  function rulerSVG(st, res) {
    var crop = st.crop, xmin = XMIN[crop], x0 = 30, x1 = vbW() - 30, y = 96;
    function X(p) { return x0 + (x1 - x0) * (p / xmin); }
    var s = '<path class="axis" d="M' + x0 + ',' + y + ' H' + x1 + '" marker-end="url(#o3-ar2)"/>';
    for (var p = 0; p >= xmin; p -= 1) s += '<path class="axis" d="M' + f1(X(p)) + ',' + (y - 5) + ' v10"/><text x="' + f1(X(p)) + '" y="' + (y - 12) + '" text-anchor="middle" font-size="14" class="tm t2">' + num(p, 0) + '</text>';
    s += '<text x="' + x1 + '" y="' + (y + 24) + '" text-anchor="end" font-size="14" class="t2" font-style="italic">drier, MPa</text>';
    function flag(px, lbl, col, row, sub) {
      var X1 = X(px), yy = y + 40 + row * 44;
      return '<path d="M' + f1(X1) + ',' + y + ' V' + (yy - 15) + '" stroke="' + col + '" stroke-width="2.5"/><circle cx="' + f1(X1) + '" cy="' + y + '" r="6" fill="' + col + '"/>' +
        '<text x="' + f1(X1) + '" y="' + yy + '" text-anchor="middle" font-size="15" font-weight="600" class="halo" style="fill:' + col + '">' + lbl + '</text>' + (sub ? '<text x="' + f1(X1) + '" y="' + (yy + 16) + '" text-anchor="middle" font-size="13" class="halo t2">' + sub + '</text>' : '');
    }
    if (crop === 'grape') {
      s += flag(-0.60, 'stomata half closed', 'var(--warm)', 0, '−0.60 MPa, leaf');
      s += flag(-1.54, 'half the petiole flow lost', 'var(--w2)', 1, '−1.54 MPa, xylem');
      s += flag(-1.90, 'half the stem flow lost', 'var(--ink)', 0, '−1.90 MPa, xylem');
    } else if (crop === 'almond') {
      s += flag(-2.0, 'stomata 90 % closed', 'var(--warm)', 0, '−1.72 to −2.25 MPa');
      s += flag(-3.4, 'half the stem flow lost', 'var(--ink)', 1, '−2.97 to −3.80 MPa');
    } else {
      s += flag(-1.1, 'stomata half closed', 'var(--warm)', 0, 'teaching value');
      s += '<text x="' + f1(X(-2.2)) + '" y="' + (y + 40) + '" text-anchor="middle" font-size="15" class="halo">lettuce pipes: no measurement found</text>';
    }
    var lo = clamp(res.psi.leafOut, xmin, 0);
    s += '<path d="M' + f1(X(lo)) + ',' + (y - 8) + ' l-8,-14 h16z" fill="var(--ink)"/><text x="' + f1(X(lo)) + '" y="' + (y - 30) + '" text-anchor="middle" font-size="14" class="halo" font-weight="600">your leaf now</text>';
    return s;
  }

  /* ------------------------------------------------------------ vessel clusters (viewBox 0 0 760 300) */
  function cluster(cx, cy, rings, sp, seed) {
    var R = rng(seed), cells = [], q, r;
    for (q = -rings; q <= rings; q++) for (r = -rings; r <= rings; r++) {
      var s3 = -q - r; if (Math.max(Math.abs(q), Math.abs(r), Math.abs(s3)) > rings) continue;
      var x = cx + sp * (q + r / 2) + (R() - 0.5) * 5, y = cy + sp * 0.866 * r + (R() - 0.5) * 5;
      cells.push({ x: x, y: y, r: sp * (0.3 + R() * 0.17), ring: Math.max(Math.abs(q), Math.abs(r), Math.abs(s3)) });
    }
    // embolism order (Brodersen et al. 2013, grapevine HRCT): first in vessels next to the pith (centre of the
    // cluster), then radially outward within sectors; lateral spread between sectors is rare (16 of 629 connections).
    // Each of six sectors gets its own delay, so the dark patch grows as radial groups, not at random.
    var delay = [0, 1.6, 0.6, 2.4, 1.1, 3.0].map(function (d) { return d + R() * 0.4; });
    cells.forEach(function (c) {
      var a = Math.atan2(c.y - cy, c.x - cx), sec = Math.floor(((a + Math.PI) / (2 * Math.PI)) * 6) % 6;
      c.sec = sec; c.key = (c.ring === 0 ? -1 : c.ring + delay[sec]) - c.r / sp * 0.05;
    });
    var order = cells.map(function (c, i) { return i; }).sort(function (a, b) { return cells[a].key - cells[b].key; });
    return { cells: cells, order: order };
  }
  /* grape (or almond) stem: a wedge of secondary xylem from the pith out, with rays, one growth ring, wide early
     vessels and narrow late ones among fibres. Embolism seeds beside the pith and spreads sector by sector. */
  var WEDGE = null;
  function buildWedge() {
    var cx = 150, cy = 292, a0 = deg(-128), a1 = deg(-52), R = rng(29), rays = [], ves = [], k;
    var nS = 6;
    for (k = 0; k <= nS; k++) rays.push(a0 + (a1 - a0) * k / nS);
    for (k = 0; k < nS; k++) {
      var sa = rays[k] + 0.035, sb = rays[k + 1] - 0.035;
      for (var r = 34; r < 246; r += 0) {
        var inEarly = (r < 70) || (r > 150 && r < 190);
        var vr = inEarly ? 6 + R() * 4.5 : 2.4 + R() * 2;
        var ang = sa + (sb - sa) * (0.2 + R() * 0.6);
        if (r + vr > 246) break;
        ves.push({ x: cx + (r + vr) * Math.cos(ang), y: cy + (r + vr) * Math.sin(ang), r: vr, sec: k, rad: r });
        if (inEarly && r > 60 && R() < 0.3) { var ang2 = sa + (sb - sa) * (R() < 0.5 ? 0.15 : 0.85); var vr2 = vr * 0.7; ves.push({ x: cx + (r + vr) * Math.cos(ang2), y: cy + (r + vr) * Math.sin(ang2), r: vr2, sec: k, rad: r }); }
        r += 2 * vr + 6 + R() * 8;
      }
    }
    // embolism order: seed in sector 2 beside the pith, fill that sector outward, then its neighbours
    var secOrder = [2, 3, 1, 4, 0, 5];
    var order = ves.map(function (v, i) { return i; }).sort(function (i, j) { var A = ves[i], B = ves[j]; var sa2 = secOrder.indexOf(A.sec), sb2 = secOrder.indexOf(B.sec); return sa2 !== sb2 ? sa2 - sb2 : A.rad - B.rad; });
    WEDGE = { cx: cx, cy: cy, a0: a0, a1: a1, rays: rays, ves: ves, order: order };
  }
  function wedgeSVG(plc, wpsi) {
    if (!WEDGE) buildWedge();
    var W = WEDGE, o = '';
    o += '<path class="xw-fib" d="' + annulus(W.cx, W.cy, 30, 250, W.a0, W.a1) + '"/>';
    W.rays.forEach(function (ra, i) { if (i === 0 || i === W.rays.length - 1) return; o += '<path class="xw-ray" d="' + annulus(W.cx, W.cy, 30, 250, ra - 0.03, ra + 0.03) + '"/>'; });
    o += '<path class="xw-ring" d="' + arcD(W.cx, W.cy, 150, W.a0, W.a1) + '"/>';
    o += '<path d="' + annulus(W.cx, W.cy, 0, 30, W.a0, W.a1) + '" class="pc"/>';
    var n = W.ves.length, k = plc === null ? 0 : Math.round(clamp(plc, 0, 100) / 100 * n), emb = {};
    for (var i = 0; i < k; i++) emb[W.order[i]] = 1;
    W.ves.forEach(function (v, i) {
      o += emb[i] ? '<circle cx="' + f1(v.x) + '" cy="' + f1(v.y) + '" r="' + f1(v.r) + '" class="vc-emb"/>' : '<circle cx="' + f1(v.x) + '" cy="' + f1(v.y) + '" r="' + f1(v.r) + '" style="fill:' + ui.water(wpsi) + '" class="vc-wall"/>';
    });
    var lab = function (x, y, tx, ty, t, anc) { return '<path class="lead" d="M' + x + ',' + y + ' L' + tx + ',' + ty + '"/><text x="' + tx + '" y="' + (ty - 3) + '" font-size="12.5" class="halo t2" text-anchor="' + (anc || 'start') + '">' + t + '</text>'; };
    o += lab(150, 276, 18, 286, 'pith', 'start') + lab(Math.round(W.cx + 150 * Math.cos(deg(-62))), Math.round(W.cy + 150 * Math.sin(deg(-62))), 282, 116, 'growth ring', 'end') +
      lab(Math.round(W.cx + 120 * Math.cos(W.rays[1])), Math.round(W.cy + 120 * Math.sin(W.rays[1])), 10, 120, 'ray', 'start') + lab(Math.round(W.cx + 225 * Math.cos(deg(-100))), Math.round(W.cy + 225 * Math.sin(deg(-100))), 70, 30, 'fibres', 'start');
    return o;
  }
  function annulus(cx, cy, r1, r2, a0, a1) {
    var p0 = pol(cx, cy, r2, a0), p1 = pol(cx, cy, r2, a1), p2 = pol(cx, cy, r1, a1), p3 = pol(cx, cy, r1, a0), lg = (a1 - a0) > Math.PI ? 1 : 0;
    return 'M' + f1(p0[0]) + ',' + f1(p0[1]) + ' A' + r2 + ',' + r2 + ' 0 ' + lg + ' 1 ' + f1(p1[0]) + ',' + f1(p1[1]) + ' L' + f1(p2[0]) + ',' + f1(p2[1]) + (r1 > 0 ? ' A' + r1 + ',' + r1 + ' 0 ' + lg + ' 0 ' + f1(p3[0]) + ',' + f1(p3[1]) : ' L' + f1(p3[0]) + ',' + f1(p3[1])) + 'Z';
  }
  function arcD(cx, cy, r, a0, a1) { var p0 = pol(cx, cy, r, a0), p1 = pol(cx, cy, r, a1); return 'M' + f1(p0[0]) + ',' + f1(p0[1]) + ' A' + r + ',' + r + ' 0 0 1 ' + f1(p1[0]) + ',' + f1(p1[1]); }
  /* petiole: a ring of ten bundles inside a band of collenchyma; air spreads bundle by bundle */
  var PETR = null;
  function petioleSVG(plc, wpsi) {
    var cx = 420, cy = 150, R = rng(43), o = '';
    if (!PETR) {
      var v = [];
      for (var b = 0; b < 10; b++) {
        var a = b / 10 * Math.PI * 2 - Math.PI / 2;
        for (var j = 0; j < 4; j++) { var rr = 48 + j * 9 + (R() - 0.5) * 3, aa = a + (R() - 0.5) * 0.14; v.push({ x: cx + rr * Math.cos(aa), y: cy + rr * Math.sin(aa), r: 2.8 + j * 0.9 + R() * 0.8, b: b }); }
      }
      var bo = [3, 4, 2, 5, 1, 6, 0, 7, 9, 8];
      PETR = { v: v, order: v.map(function (q, i) { return i; }).sort(function (i, j) { return bo.indexOf(v[i].b) - bo.indexOf(v[j].b) || v[j].r - v[i].r; }) };
    }
    o += '<circle cx="' + cx + '" cy="' + cy + '" r="112" class="pet-gp"/><circle cx="' + cx + '" cy="' + cy + '" r="104" class="pet-col"/>';
    for (var b2 = 0; b2 < 10; b2++) {
      var a2 = b2 / 10 * Math.PI * 2 - Math.PI / 2, ph = pol(cx, cy, 88, a2);
      o += '<ellipse cx="' + f1(ph[0]) + '" cy="' + f1(ph[1]) + '" rx="11" ry="7" transform="rotate(' + Math.round(a2 * 180 / Math.PI + 90) + ' ' + f1(ph[0]) + ' ' + f1(ph[1]) + ')" class="pet-ph"/>';
    }
    var n = PETR.v.length, k = plc === null ? 0 : Math.round(clamp(plc, 0, 100) / 100 * n), emb = {};
    for (var i = 0; i < k; i++) emb[PETR.order[i]] = 1;
    PETR.v.forEach(function (q, i) { o += emb[i] ? '<circle cx="' + f1(q.x) + '" cy="' + f1(q.y) + '" r="' + f1(q.r) + '" class="vc-emb"/>' : '<circle cx="' + f1(q.x) + '" cy="' + f1(q.y) + '" r="' + f1(q.r) + '" style="fill:' + ui.water(wpsi) + '" class="vc-wall"/>'; });
    o += '<path class="lead" d="M' + (cx + 74) + ',' + (cy - 74) + ' L' + (cx + 120) + ',' + (cy - 118) + '"/><text x="' + (cx + 122) + '" y="' + (cy - 120) + '" font-size="12.5" class="halo t2">collenchyma</text>';
    o += '<path class="lead" d="M' + (cx - 62) + ',' + (cy - 32) + ' L' + (cx - 126) + ',' + (cy - 118) + '"/><text x="' + (cx - 128) + '" y="' + (cy - 122) + '" font-size="12.5" class="halo t2" text-anchor="middle">bundle: phloem out, xylem in</text>';
    return o;
  }
  var CL = null;
  function vesselsSVG(st, res) {
    if (!CL) CL = { stem: cluster(150, 150, 3, 33, 21), pet: cluster(420, 150, 2, 33, 33) };
    var s = '<defs><pattern id="o3-fib" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" style="fill:var(--card)"/><circle cx="2" cy="2" r="1.2" style="fill:none;stroke:var(--ink);stroke-opacity:.35;stroke-width:.6"/></pattern></defs>';
    function draw(cl, plc, wpsi, name, cx) {
      var o = '';
      if (name === 'stem' && st.crop !== 'romaine') o += wedgeSVG(plc, wpsi);
      else if (name === 'pet') o += petioleSVG(plc, wpsi);
      else {
        o += '<circle cx="' + cx + '" cy="150" r="128" class="vc-tis"/>';
        cl.cells.forEach(function (c) { o += '<circle cx="' + f1(c.x) + '" cy="' + f1(c.y) + '" r="' + f1(c.r) + '" style="fill:' + ui.water(wpsi) + '" class="vc-wall"/>'; });
      }
      var lbl = name === 'stem' ? (st.crop === 'romaine' ? 'core xylem' : 'stem xylem') : (st.crop === 'romaine' ? 'midrib base' : 'petiole xylem');
      o += '<text x="' + cx + '" y="' + (name === 'stem' ? 316 : 292) + '" text-anchor="middle" font-size="18" class="halo">' + lbl + ', ' + (plc === null ? 'no curve' : num(plc, 0) + ' % lost') + '</text>';
      return o;
    }
    var petPLC = st.crop === 'grape' ? res.PLC.petiole : (st.crop === 'almond' ? res.PLC.petiole : null);
    s += draw(CL.stem, res.PLC.stem, res.psi.stem, 'stem', 150);
    s += draw(CL.pet, petPLC, res.psi.petiole, 'pet', 420);
    // pit membrane inset: gas filled conduit, membrane, water filled conduit under tension
    var nar = vbW() < 600;
    s += '<g' + (nar ? ' transform="translate(-651,330) scale(1.45)"' : '') + '>';
    var x0 = 560, y0 = 34, D = opts.D, thr = 4 * 0.0728 / (D * 1e-6) / 1e6;
    var pull = -(st.crop === 'grape' ? res.psi.petiole : res.psi.stem);
    var seeds = pull > thr;
    s += '<rect x="' + x0 + '" y="' + y0 + '" width="72" height="222" class="gas" rx="4"/>';
    s += '<rect x="' + (x0 + 92) + '" y="' + y0 + '" width="72" height="222" fill="' + ui.water(-pull) + '" stroke="var(--ink)" stroke-width="1.2" rx="4"/>';
    s += '<rect x="' + (x0 + 72) + '" y="' + y0 + '" width="20" height="222" class="pitm"/>';
    for (var j = 0; j < 9; j++) { var py = y0 + 18 + j * 23; s += '<rect x="' + (x0 + 72) + '" y="' + py + '" width="20" height="' + (j === 4 ? clamp(D * 64, 4, 30) : 2.5) + '" fill="var(--paper)" stroke="var(--ink)" stroke-width=".5"/>'; }
    var gy = y0 + 18 + 4 * 23 + clamp(D * 64, 4, 30) / 2;
    s += '<path d="M' + (x0 + 72) + ',' + f1(gy - clamp(D * 64, 4, 30) / 2) + ' q' + (seeds ? 34 : 12) + ',' + f1(clamp(D * 64, 4, 30) / 2) + ' 0,' + f1(clamp(D * 64, 4, 30)) + '" fill="var(--emb)" stroke="var(--ink)" stroke-width="1"/>';
    if (seeds) s += '<circle cx="' + (x0 + 128) + '" cy="' + f1(gy) + '" r="12" class="vc-emb"/>';
    s += '<text x="' + (x0 + 36) + '" y="' + (y0 - 10) + '" text-anchor="middle" font-size="13">air filled</text><text x="' + (x0 + 128) + '" y="' + (y0 - 10) + '" text-anchor="middle" font-size="13">sap, ' + num(-pull, 2) + ' MPa</text>';
    s += '<text x="' + (x0 + 82) + '" y="' + (y0 + 240) + '" text-anchor="middle" font-size="13" class="t2">pit membrane, largest pore</text>';
    s += '<text x="' + (x0 + 82) + '" y="' + (y0 + 258) + '" text-anchor="middle" font-size="14" font-weight="600" class="halo" style="fill:' + (seeds ? 'var(--warm)' : 'var(--ink)') + '">' + (seeds ? 'air seeds through' : 'the meniscus holds') + '</text>';
    s += '</g>';
    return { svg: s, thr: thr, pull: pull, seeds: seeds };
  }

  /* ------------------------------------------------------------ 3·0 the leaf plate (viewBox 0 0 760 470)
     A real outline per crop with every vein order drawn, and water moving through petiole, midrib or primaries,
     secondaries and the minor vein mesh, then in dashes through the bundle sheath and spongy mesophyll to the
     stomata on the lower surface. Dot speed ∝ local flux ÷ drawn width; dots park in an embolised petiole. */
  var LP = { crop: '', paths: [], dots: [], raf: 0, on: false, t0: 0, sig: '', paused: null, rm: null }; // v19: paused (click the leaf to freeze)
  var LMS = WP.molsvg || null;
  function sampleLine(pts) {
    var S = [], L = 0, i;
    for (i = 1; i < pts.length; i++) {
      var a = pts[i - 1], b = pts[i], d = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(d / 2));
      for (var k = (i === 1 ? 0 : 1); k <= n; k++) S.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]);
      L += d;
    }
    return { S: S, len: L };
  }
  function quadPts(a, c, b, n) { var o = []; for (var i = 0; i <= n; i++) { var t = i / n, u = 1 - t; o.push([u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]); } return o; }
  function PL(pts) { return 'M' + pts.map(function (p) { return f1(p[0]) + ',' + f1(p[1]); }).join(' L'); }
  function buildLeafPlate(crop) {
    var ART = WP.art, s = '', flow = [], T, outline, rnd = rng(17), leafPts, labels = [];
    function add(pts, share, w, kind, extra) { flow.push({ pts: pts, share: share, w: w, kind: kind, i: extra }); }
    if (crop === 'grape') {
      var J = [384, 300], Rr = 178, g = ART.grapeLeaf(Rr, 7);
      T = function (p) { return [J[0] + p[0], J[1] + p[1]]; };
      leafPts = g.pts.map(T);
      var pet = quadPts([368, 468], [380, 380], J, 16);
      s += '<path d="' + PL(leafPts) + 'Z" class="lp-blade"/>';
      outline = leafPts;
      // primaries: top lobe gets the most
      var shares = [0.3, 0.2, 0.2, 0.15, 0.15];
      g.tips.forEach(function (t, i) {
        var tip = T(t), ctrl = T([t[0] * 0.5 + (i === 0 ? 0 : t[1] * 0.04), t[1] * 0.5]);
        var pp = quadPts(J, ctrl, tip, 14);
        add(pp, shares[i], 3.2, 'v1');
        [0.35, 0.65].forEach(function (f) {
          var b = pp[Math.round(f * 14)], ang = Math.atan2(t[1], t[0]);
          [-1, 1].forEach(function (sg) {
            var a2 = ang + sg * 0.75, L = Rr * (0.32 - f * 0.18), e = [b[0] + Math.cos(a2) * L, b[1] + Math.sin(a2) * L];
            add([b, [(b[0] + e[0]) / 2 + sg * 2, (b[1] + e[1]) / 2], e], 0.03, 1.5, 'v2');
          });
        });
      });
      add(pet, 1, 6, 'pet');
      labels = [['petiole', pet[5], [240, 452]], ['primary vein (one of five)', T([g.tips[1][0] * 0.72, g.tips[1][1] * 0.72]), [730, 40]], ['petiolar sinus', T([18, 40]), [560, 456]]];
    } else if (crop === 'romaine') {
      var B = [92, 236], Lr = 600, Wr = 116, r = ART.romaineLeaf(Lr, Wr, 21, { rib: 0.24 });
      T = function (p) { return [B[0] - p[1], B[1] + p[0]]; };
      leafPts = r.pts.map(T); outline = leafPts;
      s += '<path d="' + PL(leafPts) + 'Z" class="lp-blade rom"/>';
      var rib = [[-Wr * 0.24, 0], [-Wr * 0.18, -Lr * 0.35], [-Wr * 0.05, -Lr * 0.75], [0, -Lr * 0.97], [Wr * 0.05, -Lr * 0.75], [Wr * 0.18, -Lr * 0.35], [Wr * 0.24, 0]].map(T);
      s += '<path d="M30,' + (B[1] - 24) + ' L' + B[0] + ',' + (B[1] - 28) + ' L' + B[0] + ',' + (B[1] + 28) + ' L30,' + (B[1] + 24) + 'Z" class="lp-rib"/><ellipse cx="30" cy="' + B[1] + '" rx="5" ry="24" class="lp-rib"/>';
      s += '<path d="' + PL(rib) + 'Z" class="lp-rib"/>';
      var mid = [[0, 0], [0, -Lr * 0.5], [0, -Lr * 0.95]].map(T);
      add([[30, B[1]]].concat(mid), 1, 14, 'pet');
      for (var i2 = 1; i2 <= 8; i2++) {
        var tt = 0.05 + i2 * 0.098, y = -Lr * tt, te = Math.min(tt + 0.07, 0.96), ww = Wr * 0.8 * Math.pow(Math.sin(Math.PI * Math.pow(te, 1.45)), 0.55);
        [-1, 1].forEach(function (sg) { add(quadPts(T([sg * Wr * 0.1, y]), T([sg * ww * 0.6, y - Lr * 0.012]), T([sg * ww, y - Lr * 0.07]), 10), 0.05, 1.8, 'v2'); });
      }
      labels = [['midrib base, cut from the core', [44, B[1] - 15], [40, 70]], ['thick white midrib', T([0, -Lr * 0.3]), [200, 450]], ['savoyed blade', T([Wr * 0.75, -Lr * 0.55]), [430, 450]]];
    } else {
      var B2 = [120, 236], La = 560, Wa = 76, al = ART.almondLeaf(La, Wa, 11);
      T = function (p) { return [B2[0] - p[1], B2[1] + p[0]]; };
      leafPts = al.pts.map(T); outline = leafPts;
      s += '<path d="' + PL(leafPts) + 'Z" class="lp-blade"/>';
      var pet2 = [[48, 252], [86, 242], B2];
      add(pet2.concat([[0, -La * 0.5], [0, -La * 0.96]].map(T)), 1, 5, 'pet');
      for (var i3 = 1; i3 <= 6; i3++) {
        var t3 = 0.08 + i3 * 0.11, y3 = -La * t3, w3 = Wa * 0.82 * Math.sin(Math.PI * Math.pow(t3, 0.72));
        [-1, 1].forEach(function (sg) { add(quadPts(T([0, y3]), T([sg * w3 * 0.5, y3 - La * 0.03]), T([sg * w3, y3 - La * 0.07]), 10), 0.05, 1.5, 'v2'); });
      }
      labels = [['petiole', [70, 246], [40, 340]], ['midrib', T([0, -La * 0.3]), [200, 450]], ['fine serration', T([Wa * 0.95, -La * 0.5]), [430, 450]]];
    }
    // vein drawing (from the flow list), then the minor mesh, clipped to the blade
    var bx = outline.reduce(function (a, p) { return [Math.min(a[0], p[0]), Math.min(a[1], p[1]), Math.max(a[2], p[0]), Math.max(a[3], p[1])]; }, [1e9, 1e9, -1e9, -1e9]);
    var mesh = WP.art.mesh(bx[0], bx[1], bx[2] - bx[0], bx[3] - bx[1], Math.round((bx[2] - bx[0]) / (crop === 'romaine' ? 22 : 17)), 5);
    var ter = WP.art.mesh(bx[0], bx[1], bx[2] - bx[0], bx[3] - bx[1], Math.round((bx[2] - bx[0]) / 46), 8);
    s += '<clipPath id="o3-lclip"><path d="' + PL(outline) + 'Z"/></clipPath>';
    s += '<g clip-path="url(#o3-lclip)"><path d="' + mesh.d + '" class="lp-v4"/><path d="' + ter.d + '" class="lp-v3"/></g>';
    flow.forEach(function (f) { if (f.kind === 'v2') s += '<path d="' + PL(f.pts) + '" class="lp-v2"/>'; });
    flow.forEach(function (f) { if (f.kind === 'v1') s += '<path d="' + PL(f.pts) + '" class="lp-v1"/>'; });
    var petF = flow.filter(function (f) { return f.kind === 'pet'; })[0];
    if (crop === 'grape') s += '<path d="' + PL(petF.pts) + '" class="lp-pet"/>';
    else if (crop === 'almond') s += '<path d="' + PL(petF.pts.slice(2)) + '" class="lp-v1" style="stroke-width:4"/><path d="' + PL(petF.pts.slice(0, 3)) + '" class="lp-pet" style="stroke-width:7"/>';
    else s += '<path d="' + PL(petF.pts.slice(0, 2)) + '" class="lp-v1" style="opacity:.0"/>';
    // minor vein edges inside the blade carry water; pick a spread subset
    var inside = mesh.edges.filter(function (e) { var mx = (e[0][0] + e[1][0]) / 2, my = (e[0][1] + e[1][1]) / 2; return WP.art.inPoly(mx, my, outline) && WP.art.inPoly(e[0][0], e[0][1], outline) && WP.art.inPoly(e[1][0], e[1][1], outline); });
    var minorPick = inside.filter(function (e, i) { return i % 5 === 0; }).slice(0, 70);
    minorPick.forEach(function (e) { add([e[0], e[1]], 0.008, 0.8, 'v4'); });
    // stomata on the lower surface (drawn faint, seen through the blade) and the outside xylem dashes to them
    var sto = '', ox = '', puffs = [];
    minorPick.filter(function (e, i) { return i % 2 === 0; }).forEach(function (e, i) {
      var a = rnd() * Math.PI * 2, d = 9 + rnd() * 6, p = [e[1][0] + Math.cos(a) * d, e[1][1] + Math.sin(a) * d];
      if (!WP.art.inPoly(p[0], p[1], outline)) return;
      var ang = Math.round(rnd() * 180);
      sto += '<g transform="translate(' + f1(p[0]) + ',' + f1(p[1]) + ') rotate(' + ang + ')"><path d="M0,-3.6 C-3.4,-3 -3.4,3 0,3.6 C-1.2,1.6 -1.2,-1.6 0,-3.6Z M0,-3.6 C3.4,-3 3.4,3 0,3.6 C1.2,1.6 1.2,-1.6 0,-3.6Z" class="lp-sto"/></g>';
      var pts = [e[1], [(e[1][0] + p[0]) / 2 + 2, (e[1][1] + p[1]) / 2 - 2], p];
      ox += '<path d="' + PL(pts) + '" class="lp-ox"/>';
      add(pts, 0.004, 0.6, 'ox');
      puffs.push(p);
    });
    s += ox + sto + '<g id="o3-lpuff"></g><g id="o3-lptc"></g>';
    // labels with leaders
    var POS = { grape: { mi: [740, 250], se: [40, 110], st: [740, 380] }, romaine: { mi: [600, 40], se: [300, 40], st: [730, 450] }, almond: { mi: [600, 40], se: [300, 40], st: [730, 450] } }[crop];
    var miE = inside.slice().sort(function (a, b) { return (b[0][0] - Math.abs(b[0][1] - POS.mi[1]) * 1.5) - (a[0][0] - Math.abs(a[0][1] - POS.mi[1]) * 1.5); })[0];
    if (crop !== 'grape') miE = inside.slice().sort(function (a, b) { return (Math.abs(a[0][0] - POS.mi[0]) + a[0][1]) - (Math.abs(b[0][0] - POS.mi[0]) + b[0][1]); })[0];
    labels.push(['minor veins (areoles)', miE ? miE[0] : [380, 240], POS.mi]);
    var v2s = flow.filter(function (f) { return f.kind === 'v2'; }), v2 = crop === 'grape' ? v2s[9] : v2s[4];
    labels.push(['secondary vein', v2.pts[Math.floor(v2.pts.length / 2)], POS.se]);
    if (puffs.length) { var pb = puffs.slice().sort(function (a, b) { return crop === 'grape' ? b[0] - a[0] : b[0] + b[1] - a[0] - a[1]; })[0]; labels.push(['stomata, lower surface', pb, POS.st]); }
    labels.forEach(function (l) {
      var anchor = l[2][0] > 650 ? 'end' : (l[2][0] < 120 ? 'start' : 'middle');
      s += '<path d="M' + f1(l[1][0]) + ',' + f1(l[1][1]) + ' L' + l[2][0] + ',' + (l[2][1] - 4) + '" class="lead"/><text x="' + l[2][0] + '" y="' + (l[2][1] + (l[2][1] > l[1][1] ? 10 : -8)) + '" text-anchor="' + anchor + '" font-size="15" class="halo">' + l[0] + '</text>';
    });
    var paths = flow.map(function (f) { var q = sampleLine(f.pts); return { S: q.S, len: q.len, share: f.share, w: f.w, kind: f.kind }; });
    return { svg: s, paths: paths, puffs: puffs, outline: outline };
  }
  function lpState(res) {
    var E = res.E, red = ui.reducedMotion();
    var pPLC = res.PLC && res.PLC.petiole != null ? res.PLC.petiole : (res.PLC && res.PLC.stem != null ? res.PLC.stem : 0);
    var nEmb = Math.round(clamp(pPLC, 0, 100) / 100 * 3);
    var sig = [], vmin = 3 * Math.min(1, E / 2);
    LP.paths.forEach(function (p) {
      p.v = clamp(96 * E * p.share / p.w, vmin, 60);
      var sp = red ? clamp(40 / Math.max(0.05, Math.sqrt(p.v / 5)), 6, 120) : (p.kind === 'pet' ? 16 : 22);
      p.n = Math.max(1, Math.round(p.len / sp));
      if (p.kind === 'pet') p.n = Math.max(3, p.n);
      sig.push(p.n);
    });
    sig.push(nEmb);
    var g = root.querySelector('#o3-lptc');
    if (!g) return;
    var s = sig.join(',');
    if (s !== LP.sig) {
      LP.sig = s; LP.dots = [];
      var h = '';
      LP.paths.forEach(function (p, pi) {
        for (var k = 0; k < p.n; k++) {
          var lane = p.kind === 'pet' ? (k % 3) : -1, emb = lane >= 0 && lane < nEmb;
          LP.dots.push({ p: pi, o: (k + 0.37) / p.n * p.len, lane: lane, emb: emb });
          // r7: water molecules in the mol.js template (gas bubbles in embolised petiole lanes)
          LP.dots[LP.dots.length - 1].s = p.kind === 'pet' ? 0.95 : (p.kind === 'v1' ? 0.8 : 0.6);
          LP.dots[LP.dots.length - 1].r = (k * 137 + pi * 59) % 360;
          h += LMS ? LMS.use(emb ? 'gas' : 'h2o', 'lp-dot' + (emb ? ' emb' : '') + (p.kind === 'ox' ? ' ox' : '')) : '<circle r="' + (p.kind === 'pet' ? 2.6 : (p.kind === 'v1' ? 2.2 : 1.6)) + '" class="lp-dot' + (emb ? ' emb' : '') + (p.kind === 'ox' ? ' ox' : '') + '"/>';
        }
      });
      g.innerHTML = h;
      // embolised petiole lanes drawn in charcoal
      var ep = root.querySelector('#o3-lemb');
      if (ep) ep.setAttribute('opacity', nEmb ? '1' : '0');
    }
    // vapour at the pores follows gs; cuticle wisps stay
    var open = clamp(res.gs / res.gsMax, 0, 1), pf = root.querySelector('#o3-lpuff');
    if (pf) pf.innerHTML = LP.puffs.slice(0, 14).map(function (p, i) { return '<path class="lp-vap" opacity="' + (0.15 + 0.75 * open).toFixed(2) + '" d="M' + f1(p[0] + 3) + ',' + f1(p[1] - 4) + ' c3,-3 -3,-5 0,-8"/>'; }).join('');
    lpPlace(0);
  }
  function lpPlace(dt) {
    var g = root.querySelector('#o3-lptc'); if (!g) return;
    var cs = g.querySelectorAll('.lp-dot');
    for (var j = 0; j < LP.dots.length && j < cs.length; j++) {
      var d = LP.dots[j], p = LP.paths[d.p];
      if (dt && !d.emb) { d.o = (d.o + p.v * dt) % p.len; d.r = ((d.r || 0) + p.v * dt * 4) % 360; }
      var f = d.o / p.len * (p.S.length - 1), k = Math.floor(f), t = f - k, a = p.S[k], b = p.S[Math.min(k + 1, p.S.length - 1)];
      var x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t;
      if (d.lane >= 0) { var nx = -(b[1] - a[1]), ny = b[0] - a[0], nl = Math.hypot(nx, ny) || 1; x += nx / nl * (d.lane - 1) * 2.6; y += ny / nl * (d.lane - 1) * 2.6; }
      if (cs[j].tagName === 'use' && LMS) LMS.place(cs[j], x, y, d.emb ? 0 : d.r, d.s);
      else { cs[j].setAttribute('cx', x.toFixed(1)); cs[j].setAttribute('cy', y.toFixed(1)); }
      d.x = x; d.y = y;
    }
    lpNames(g);
  }
  /* 13 Oct (slow and named): H₂O under one or two moving molecules (1 on phones) and "air" under one gas bubble of an
     embolised petiole lane, kept clear of every label of the figure (WP.svgNames) */
  function lpNames(g) {
    if (!WP.svgNames) return;
    var lay = g.parentNode.querySelector('#o3-lpname');
    if (!lay) { lay = document.createElementNS('http://www.w3.org/2000/svg', 'g'); lay.setAttribute('id', 'o3-lpname'); lay.setAttribute('pointer-events', 'none'); g.parentNode.insertBefore(lay, g.nextSibling); }
    if (!LP.nm || LP.nmLay !== lay) { if (!lay.ownerSVGElement) return; LP.nm = WP.svgNames(lay.ownerSVGElement, lay); LP.nmLay = lay; }
    var L = [];
    LP.dots.forEach(function (d) {
      var p = LP.paths[d.p]; if (d.x == null || !p) return;
      if (d.emb) L.push({ k: 'gas', key: d, x: d.x, y: d.y, r: 4.5 * d.s, t: 'air', q: 1 });
      else if (p.kind !== 'ox' && d.o > p.len * 0.1 && d.o < p.len * 0.88) L.push({ k: 'w', key: d, x: d.x, y: d.y, r: 4.5 * d.s, t: 'H₂O' });
    });
    LP.nm.frame(L);
  }
  if (window.MolNames) window.MolNames.on(function () { if (LP.nm) { LP.nm.dirty(); lpPlace(0); } });
  /* 13 Oct (slow and named, water heroes builder): WP.svgNames(svg, layer), molecule names in the older SVG figures under
     the ANTI CLUTTER RULE. Identical copy in l1_field.js, l2_plant.js, l3_organ.js and closing.js (first loaded wins).
     Each frame: nm.frame([{k: kind, key: object, x, y, r, t: text, q}]) in viewBox units (r = drawn radius). Per kind:
     2 named at desktop width, 1 on phones (q overrides); stable (a named molecule keeps its name until it leaves the
     list); a second name sits well away from the first; a name is drawn only where it touches no text of the figure
     and no other name (it waits hidden instead of jumping). 10.5 px text (9.5 px on phones). MolNames off: none. */
  WP.svgNames = WP.svgNames || function (svg, layer) {
    var NS = 'http://www.w3.org/2000/svg', pool = [], prev = {}, miss = new Map(), blk = [], blkT = -1e9;
    function hit(a, b) { return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h; }
    function blockers() {
      var now = performance.now(); if (now - blkT < 400) return blk; blkT = now; blk = [];
      Array.prototype.forEach.call(svg.querySelectorAll('text'), function (t) { if (layer.contains(t)) return; var r = t.getBoundingClientRect(); if (r.width > 0) blk.push({ x: r.left - 2, y: r.top - 2, w: r.width + 4, h: r.height + 4 }); });
      return blk;
    }
    function pill(i) {
      var g = pool[i];
      if (!g) { g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'wpm-name'); g.setAttribute('pointer-events', 'none'); g.innerHTML = '<rect/><text text-anchor="middle" dominant-baseline="central"></text>'; pool[i] = g; }
      if (g.parentNode !== layer || layer.lastChild !== g) layer.appendChild(g);
      return g;
    }
    var nm = {
      frame: function (list) {
        var used = 0, on = !window.MolNames || window.MolNames.get(), ctm = on && list && list.length ? layer.getScreenCTM() : null;
        if (ctm) {
          var sr = svg.getBoundingClientRect(), narrow = sr.width < 560, fs = narrow ? 9.5 : 10.5, kk = Math.hypot(ctm.a, ctm.b) || 1;
          var placed = blockers().slice(), by = {}, kinds = [], next = {};
          list.forEach(function (it) {
            if (!by[it.k]) { by[it.k] = []; kinds.push(it.k); } by[it.k].push(it);
            var px = ctm.a * it.x + ctm.c * it.y + ctm.e, py = ctm.b * it.x + ctm.d * it.y + ctm.f, w = it.t.length * fs * 0.6 + fs;
            it.sx = px; it.sy = py; it.w = w; it.box = { x: px - w / 2 - 2, y: py + it.r * kk + 1, w: w + 4, h: fs * 1.5 + 4 };
          });
          kinds.forEach(function (k) {
            var L = by[k], q = L[0].q != null ? L[0].q : (narrow ? 1 : 2), chosen = [], old = prev[k] || [];
            function fits(it) { var b = it.box; if (b.x < sr.left + 2 || b.x + b.w > sr.right - 2 || b.y < sr.top + 2 || b.y + b.h > sr.bottom - 2) return false; for (var i = 0; i < placed.length; i++) if (hit(b, placed[i])) return false; return true; }
            L.forEach(function (it) { if (chosen.length < q && old.indexOf(it.key) >= 0 && (miss.get(it.key) || 0) < 60) chosen.push(it); });
            L.forEach(function (it) {
              if (chosen.length >= q || chosen.indexOf(it) >= 0) return;
              for (var i = 0; i < chosen.length; i++) if (Math.hypot(chosen[i].sx - it.sx, chosen[i].sy - it.sy) < (narrow ? 60 : 90)) return;
              if (fits(it)) chosen.push(it);
            });
            next[k] = chosen.map(function (it) { return it.key; });
            chosen.forEach(function (it) {
              if (!fits(it)) { miss.set(it.key, (miss.get(it.key) || 0) + 1); return; }
              miss.delete(it.key); placed.push(it.box);
              var g = pill(used++), rc = g.firstChild, tx = g.lastChild, f = fs / kk, w = it.w / kk, h = fs * 1.5 / kk, y = it.y + it.r + 2 / kk + h / 2;
              if (tx.textContent !== it.t) tx.textContent = it.t;
              tx.setAttribute('x', it.x.toFixed(1)); tx.setAttribute('y', (y + f * 0.05).toFixed(1));
              tx.setAttribute('style', 'font:700 ' + f.toFixed(2) + 'px system-ui,-apple-system,Segoe UI,sans-serif;fill:var(--wpm-tagink)');
              rc.setAttribute('x', (it.x - w / 2).toFixed(1)); rc.setAttribute('y', (y - h / 2).toFixed(1)); rc.setAttribute('width', w.toFixed(1)); rc.setAttribute('height', h.toFixed(1)); rc.setAttribute('rx', (h / 2).toFixed(1));
              rc.setAttribute('style', 'fill:var(--wpm-tagbg);stroke:var(--wpm-tagrule);stroke-width:' + (0.8 / kk).toFixed(2));
              g.style.display = '';
            });
          });
          prev = next;
          if (miss.size > 200) miss.clear();
        } else prev = {};
        for (var i = used; i < pool.length; i++) pool[i].style.display = 'none';
        nm.count = used;
      },
      dirty: function () { blkT = -1e9; }
    };
    return nm;
  };
  function lpFrame(t) { if (!LP.on || LP.paused) return; var dt = LP.t0 ? Math.min(0.1, (t - LP.t0) / 1000) : 0; dt *= (window.PlaySpeed ? window.PlaySpeed.get() : 1); LP.t0 = t; lpPlace(dt); LP.raf = requestAnimationFrame(lpFrame); }
  function lpFreeze() {
    if (LP.paused != null) return;
    LP.rm = LP.paused = ui.reducedMotion(); // v19: reduced motion starts paused; a click on the leaf plays it
    var sv = root && root.querySelector('#o3-leafsvg');
    if (sv && window.WPFreeze) WPFreeze.attach(sv, { paused: function () { return LP.paused; }, set: function (p) { LP.paused = !!p; if (!p && LP.on) lpStart(); } });
  }
  function lpStart() { lpFreeze(); LP.on = true; cancelAnimationFrame(LP.raf); LP.t0 = 0; if (LP.paused) { lpPlace(0); return; } LP.raf = requestAnimationFrame(lpFrame); }
  function lpStop() { LP.on = false; cancelAnimationFrame(LP.raf); LP.raf = 0; }
  function leafUpdate(st, res) {
    var el = root.querySelector('#o3-leaf'); if (!el) return;
    if (LP.crop !== st.crop) {
      var B = buildLeafPlate(st.crop);
      LP.crop = st.crop; LP.paths = B.paths; LP.puffs = B.puffs; LP.sig = '';
      var petP = B.paths.filter(function (p) { return p.kind === 'pet'; })[0];
      var embD = petP ? 'M' + petP.S.map(function (q) { return f1(q[0]) + ',' + f1(q[1]); }).join(' L') : '';
      el.innerHTML = '<g id="o3-lstatic">' + B.svg.replace('<g id="o3-lpuff"></g>', '<path id="o3-lemb" class="lp-emb" opacity="0" d="' + embD + '"/><g id="o3-lpuff"></g>') + '</g>';
      var nm = { grape: 'Grapevine leaf: five lobed, serrate margin, open U petiolar sinus, palmate venation', romaine: 'Romaine leaf: oblong obovate and savoyed, a thick white midrib, pinnate secondaries', almond: 'Almond leaf: lanceolate, finely serrate, pinnate venation on a short petiole' }[st.crop];
      root.querySelector('#o3-leaf-t').textContent = nm;
      root.querySelector('#o3-leafname').textContent = nm + '.';
    }
    lpState(res);
    if (LP.on && !LP.paused && !LP.raf) lpStart();
  }

  /* ------------------------------------------------------------ captions */
  function nowText(st, res) {
    // one frame only: "% open" everywhere (the undergraduate panel read "48 % closed" next to "46 % of maximum" as light closing them more)
    var c = st.crop, sto = ui.stomata(res), openPsi = Math.max(0, 100 - Math.round(sto.psiClosed)), openNow = Math.round(sto.pct);
    var both = 'Leaf Ψ alone would leave the stomata ' + openPsi + ' % open; with this light they are ' + openNow + ' % open.';
    if (c === 'romaine') return 'The lettuce leaf is at ' + psi(res.psi.leafOut) + '. ' + both + ' Nobody has measured when lettuce pipes fill with air, so the pipes here stay full.';
    var stemL = res.PLC.stem === null ? 0 : res.PLC.stem, petL = res.PLC.petiole === null ? stemL : res.PLC.petiole;
    var organ = c === 'grape' ? 'petiole' : 'stem', lost = c === 'grape' ? petL : stemL;
    var lostTxt = lost < 0.5 ? 'have lost almost none of their flow' : 'have lost ' + (lost < 50 ? 'only ' : '') + Math.round(lost) + ' % of their flow';
    var t = 'The leaf is at ' + psi(res.psi.leafOut) + '. ' + both + ' Meanwhile the ' + organ + ' pipes ' + lostTxt + '. ';
    t += lost < 20 ? 'So far the stomata have done the adjusting; the pipes are still mostly full.' : (lost < 50 ? 'Air is now spreading through some pipes. Dry the soil further and watch the vessels darken.' : 'More than half the ' + organ + ' flow is lost: the pipes are failing.');
    return t;
  }

  /* ------------------------------------------------------------ mount */
  function chip(k, label, pressed) { return '<button type="button" class="chip" data-opt="' + k + '" aria-pressed="' + (pressed ? 'true' : 'false') + '">' + label + '</button>'; }

  function mount(el) {
    ui = WP.ui;
    root = el;
    var st0 = document.createElement('style'); st0.textContent = CSS; el.appendChild(st0);
    var w = document.createElement('div');
    w.innerHTML =
      '<p class="o3-now" aria-live="polite"><span class="k">What is happening</span><span id="o3-now"></span></p>' +

      '<h3 class="o3-sec"><span class="no">3·0</span>The leaf</h3>' +
      '<p class="o3-q">Where does the water go once it reaches the leaf?</p>' +
      '<figure><svg class="o3-svg" id="o3-leafsvg" viewBox="0 0 760 470" role="img" aria-labelledby="o3-leaf-t"><title id="o3-leaf-t">The leaf</title>' +
        '<defs><pattern id="o3-lh" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)"><rect width="5" height="5" style="fill:var(--leaf)"/><path d="M0,2.5 H5" stroke="var(--ink)" stroke-opacity=".18" stroke-width=".7"/></pattern></defs><g id="o3-leaf"></g></svg>' +
        '<figcaption class="o3-cap"><b id="o3-leafname"></b> Water enters through the petiole, spreads through the major veins into the minor vein mesh, then leaves the veins and crosses the bundle sheath and the spongy mesophyll (orange dashes) to the stomata on the lower surface. The water molecules (blue, as water is on every page; an amber halo once they leave the veins) slow as the stomata close. A charcoal lane in the petiole is a vessel filled with air, and holds only still gas bubbles. Drawn for this exhibit; vein density is not to scale.</figcaption></figure>' +
      '<h3 class="o3-sec"><span class="no">3a</span>The root’s gate</h3>' +
      '<p class="o3-q">Where does every drop of water have to pass through a living membrane?</p>' +
      '<div class="o3-grid">' +
        '<figure><svg class="o3-svg" id="o3-root" viewBox="0 0 560 560" role="img" aria-labelledby="o3-root-t"><title id="o3-root-t">Root cross section: root hairs among soil grains, exodermis, cortex, the endodermis with its Casparian strip, and two water routes</title><defs><marker id="o3-mw" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L8,4 L0,8z" fill="var(--warm)"/></marker><marker id="o3-mc" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L8,4 L0,8z" fill="var(--w1)"/></marker><marker id="o3-mg" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L8,4 L0,8z" fill="var(--air)"/></marker></defs><g id="o3-rs"></g><g id="o3-rd"></g></svg>' +
          '<div class="chips" role="group" aria-label="Root routes">' + chip('wall', 'Wall route', true) + chip('cell', 'Cell route', true) + chip('aqpClosed', 'Close the aquaporins', false) + '<span class="tier-3">' + chip('lacunae', 'Dry soil: cortical lacunae', false) + '</span></div>' +
          '<figcaption class="o3-cap ev-host" id="o3-rootcap"></figcaption></figure>' +
        '<div>' +
          '<div class="card ev-host"><h4>The strip is lignin, and it does not stop water</h4><p>The Casparian strip is a band of <b>lignin</b> in the radial walls of the endodermis. It closes the wall route, so water must cross a plasma membrane to reach the xylem. Suberin lamellae are laid down later, as a separate layer. ' + ev('l3.casparian') + '</p></div>' +
          '<div class="card ev-host tier-2"><h4>Root and leaf, one design?</h4>' + parallelSVG() + '<p>The endodermis wraps the root’s xylem; the bundle sheath wraps every leaf vein. The Casparian strip blocks the wall route in the root endodermis. The bundle sheath may do the same in the leaf, which grapevine modelling suggests but has not imaged. ' + ev('l3.bs') + ' Plate IV follows water through that sheath.</p></div>' +
          '<div class="card ev-host tier-2"><h4>The root path, outside in</h4><p>Root hairs and the epidermis, then the cortex (wall route and cell route in parallel), then the endodermis, where the Casparian strip forces every route across a membrane, then the stele and the root xylem. Aquaporins in the cortex and endodermis membranes set how easily water crosses; closing them, as flooding does, cuts root conductance even in wet soil. In the model the root carries 0.35 of the plant resistance, half of it in root xylem that can embolise in drying soil (fine root P50 ' + MINUS + '1.8 MPa) ' + ev('l3.cuneoP50') + '.</p><p class="num" id="o3-rootnow"></p></div>' +
          '<div class="card ev-host tier-3"><h4>Fine roots as a variable resistor</h4><p>In drying soil, grapevine fine root cortex cells collapse into air gaps (lacunae). They start forming near ' + MINUS + '0.6 MPa stem Ψ, cut root hydraulic conductivity before root shrinkage or root xylem embolism, and do not recover after rewatering. Read it as a variable resistor, not an on and off switch: conductance falls, it does not drop to zero. Cuneo and colleagues use the word fuse for the cortex in their abstract; this page keeps variable resistor. Press <i>Dry soil</i> to draw the gaps (positions are a sketch; the lacunae resistance is not in the model yet). ' + ev('l3.cuneo') + '</p></div>' +
        '</div>' +
      '</div>' +

      // ---------- W round 1: the root path as molecules (mol.js root scene)
      '<div class="o3-mol card" role="group" aria-labelledby="o3-molh"><h4 id="o3-molh">Watch the molecules cross the root</h4>' +
      '<p class="o3-cap" style="margin:0 0 6px">Water slides along the walls of the cortex until the Casparian strip stops it at the endodermis; there every molecule must pass through a membrane, mostly through aquaporins. Potassium ions in the walls are held back at the strip. Dry the soil with the soil slider in the conditions strip and watch the root pull away from it.</p>' +
      '<div class="chips" role="group" aria-label="Root controls"><button type="button" class="chip" data-rm="aqp" aria-pressed="false">Close the aquaporins (flooding)</button><button type="button" class="chip tier-2" data-rm="cs" aria-pressed="false">What if there were no Casparian strip?</button><button type="button" class="chip" data-rm="dry" aria-pressed="false">Dry soil (−1.5 MPa)</button><button type="button" class="btn small" data-rm="pause" aria-pressed="false">Pause</button></div>' +
      '<div data-r="rootmol" style="margin-top:8px"></div>' +
      '<p class="o3-cap" aria-live="polite" data-r="rootmoltxt"></p>' +
      '<p class="o3-cap tier-2">Root shrinkage and air gaps were measured in desert agaves (24 % shrinkage after 7 days, 34 % after 14, interface conductance cut about 5 fold) ' + ev('sp:sp.agav_dese.rootshrink') + '; in grapevine fine roots the cortex collapses into lacunae instead ' + ev('l3.cuneo') + '. How much gap a crop root opens, and at what soil Ψ, is drawn here as ' + ui.badge('ILLUSTRATIVE') + '. Root aquaporins respond to drought too: cortex cell permeability doubled in droughted Chardonnay roots but not in Grenache ' + ev('sp:aqp.vandeleur2008') + '.</p></div>' +

      '<h3 class="o3-sec"><span class="no">3b</span>Stomata close before the pipes break</h3>' +
      '<p class="o3-q">On one water potential axis: when do the stomata close, and when do the pipes fill with air?</p>' +
      '<figure class="tier-1-only"><svg class="o3-svg" id="o3-ruler" viewBox="0 0 760 210" role="img" aria-label="The order of events as the plant dries"><defs><marker id="o3-ar2" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto"><path d="M0,0 L8,4 L0,8z" fill="var(--ink)"/></marker></defs><g id="o3-rl"></g></svg></figure>' +
      '<figure class="tier-2"><svg class="o3-svg" id="o3-chart" viewBox="0 0 760 400" role="img" aria-labelledby="o3-chart-t"><title id="o3-chart-t">Stomatal closure and xylem vulnerability on one water potential axis</title><g id="o3-ch"></g></svg>' +
        '<div class="o3-legend" id="o3-leg"></div>' +
        '<figcaption class="o3-cap ev-host" id="o3-chcap"></figcaption></figure>' +
      '<p class="o3-rom tier-2" id="o3-rom" hidden><button type="button" class="btn small" data-see="grape">See it in grapevine</button> <span>No published lettuce xylem P50 was found, so romaine has no vulnerability curve here. Grapevine has measured petiole and stem P50 values.</span></p>' +
      '<div class="o3-slider" style="max-width:520px"><label for="o3-soil">Dry the soil</label><input type="range" id="o3-soil" min="-2" max="-0.02" step="0.02"><output id="o3-soil-o"></output></div>' +
      '<div class="o3-tiles" id="o3-tiles"></div>' +
      '<figure style="margin-top:14px"><svg class="o3-svg" id="o3-ves" viewBox="0 0 760 326" role="img" aria-labelledby="o3-ves-t"><title id="o3-ves-t">Vessel clusters in stem and petiole, with a pit membrane between an air filled and a sap filled conduit</title><g id="o3-vs"></g></svg>' +
        '<figcaption class="o3-cap ev-host" id="o3-vescap"></figcaption></figure>' +
      '<div class="o3-two">' +
        '<div class="card tier-2 ev-host"><h4>How air gets in</h4><p>Not boiling, and not a bubble trapped in a wall. Air is pulled from an air filled conduit through the <b>largest pore</b> of a pit membrane once the sap tension beats the pore’s capillary threshold, ΔP = 4T ÷ D. ' + ev('l3.airseed') + '</p>' +
          '<div class="o3-slider"><label for="o3-D">Largest pore D</label><input type="range" id="o3-D" min="0.05" max="0.5" step="0.01"><output id="o3-D-o"></output></div>' +
          '<p class="num" id="o3-thr"></p></div>' +
        '<div class="card tier-2"><h4>Predict, then check</h4><p>Halve the largest pore. What happens to the pressure difference needed to seed air?</p>' +
          '<button type="button" class="btn small" id="o3-pq" aria-expanded="false" aria-controls="o3-pa">Check</button><p class="ans" id="o3-pa" hidden>It doubles, because ΔP = 4T ÷ D. A membrane whose largest pore is half as wide holds air out until the sap is twice as tense: try it with the slider.</p></div>' +
      '</div>' +

      '<div class="card tier-2 ev-host" style="margin-top:12px"><h4>Predict: how does air spread through a stem?</h4><p>Embolism has started in a grapevine stem. Will the air filled vessels be scattered at random, or form radial groups growing out from the pith?</p>' +
        '<button type="button" class="btn small" id="o3-e6q" aria-expanded="false" aria-controls="o3-e6a">Check</button><p class="ans" id="o3-e6a" hidden>Radial groups from the pith. In living vines imaged by X ray CT, the first air filled vessels sat next to the pith; air then spread outward within sectors of connected vessels and only rarely sideways, 16 of 629 connections (Brodersen et al. 2013). Watch the clusters above as you dry the soil. ' + ev('l3.brodersen') + '</p></div>' +
      '<div class="tier-3">' +
        '<div class="o3-two" style="margin-top:12px">' +
          '<div class="card ev-host"><h4>What D really means</h4><p>ΔP = 4T ÷ D treats the pit membrane as a sheet with round holes. Real pit membranes are 3D meshes whose narrowest constrictions depend on membrane thickness (Kaack et al. 2021), and sap surfactants lower surface tension inside the pores (Schenk et al. 2017). So D is an equivalent pore size, not a hole you could measure with a ruler. The idea itself was first tested by forcing air across maple pit membranes (Sperry and Tyree 1988). ' + ev('l3.pitcave') + '</p></div>' +
          '<div class="card ev-host"><h4>Can a vine refill? ' + ui.badge('OPEN QUESTION') + '</h4><p>MRI of an intact vine showed vessels refilling in darkness (Holbrook et al. 2001). X ray CT showed droplets growing inside vessels despite bulk tension (Brodersen et al. 2010). MicroCT of intact vines found no refilling while the bulk xylem stayed negative, only with root pressure (Charrier et al. 2016). Excised stems refilled within an hour once given water (Knipfer et al. 2016), a warning for every method that cuts stems. What would you need to measure, in the same plant, to settle it? ' + ev('l3.refill') + '</p></div>' +
        '</div>' +
        '<div class="o3-two" style="margin-top:12px">' +
          '<div class="card ev-host"><h4>Hydraulic safety margin</h4><p>Safety margin = minimum water potential seen in the field minus stem P50. Across 226 forest species, 70 % operate within 1 MPa (Choat et al. 2012) ' + ev('l3.hsm') + '. Where does grapevine sit? Take a midday stem Ψ you would expect late in a dry season and subtract the stem P50 above; then ask which stem P50 you used, and by which method.</p></div>' +
          '<div class="card ev-host"><h4>Reading the almond numbers</h4><p>The almond P50 values come from air injection on excised stems. In long vessel species, air injection on short segments can overstate vulnerability: in grapevine, short segment air injection reached more than 90 % loss by ' + MINUS + '0.5 MPa, and flushed centrifuge stems by ' + MINUS + '1.5 MPa, while NMR showed most vessels still full at water potentials less negative than ' + MINUS + '1.5 MPa (Choat et al. 2010; Cochard et al. 2013). The almond values stay MEASURED; read them with this caveat. ' + ev('l3.almondcav') + '</p></div>' +
        '</div>' +
        '<h4 class="o3-sub" style="margin:16px 0 4px">Same vine, different numbers</h4>' +
        '<div class="o3-tiles">' +
          '<div class="tile"><div class="k">microCT, intact plant</div><div class="v">' + MINUS + '1.73 <small>MPa</small></div><div class="s">stem P50, Charrier et al. 2016</div></div>' +
          '<div class="tile"><div class="k">MRI, conductive area</div><div class="v">' + MINUS + '1.90 <small>MPa</small></div><div class="s">stem P50, Hochberg et al. 2016</div></div>' +
          '<div class="tile"><div class="k">HRCT, Weibull fit</div><div class="v">' + MINUS + '2.2 <small>MPa</small></div><div class="s">stem P50, Brodersen et al. 2013</div></div>' +
        '</div>' +
        '<p class="o3-cap">Three imaging studies of Vitis vinifera stems, three numbers. Each is MEASURED; they differ in cultivar, plant age, metric and fit. A P50 belongs to its method.</p>' +
        '<div id="o3-howto"></div>' +
      '</div>' +
      '<section class="o3-ct" id="o3-ct" aria-labelledby="o3-cth"></section>' +
      '<h3 class="o3-sec tier-2"><span class="no">3c</span>Do leaves break first?</h3>' +
      '<div class="oq tier-2" id="o3-oq"></div>';
    el.appendChild(w);
    mountHero(el, w); // 14 Oct: macro hero at the top of the plate
    ['now', 'rs', 'rd', 'rootcap', 'rl', 'ch', 'leg', 'chcap', 'tiles', 'vs', 'vescap', 'thr', 'oq'].forEach(function (k) { refs[k] = el.querySelector('#o3-' + k); });
    refs.chart = el.querySelector('#o3-chart');
    refs.rs.innerHTML = rootStatic();

    el.querySelector('.chips').addEventListener('click', function (e) {
      var b = e.target.closest('[data-opt]'); if (!b) return;
      var k = b.getAttribute('data-opt'); opts[k] = !opts[k];
      b.setAttribute('aria-pressed', opts[k] ? 'true' : 'false');
      update(WP.state, WP.result);
    });
    var soil = el.querySelector('#o3-soil');
    soil.addEventListener('input', function () { WP.set({ soilPsi: +soil.value }); });
    var Ds = el.querySelector('#o3-D');
    Ds.value = opts.D;
    Ds.addEventListener('input', function () { opts.D = +Ds.value; update(WP.state, WP.result); });
    el.querySelector('#o3-rom button').addEventListener('click', function () { WP.set({ crop: 'grape' }); if (WP.applyHour) WP.applyHour(WP.state.hour); });
    var pq = el.querySelector('#o3-pq'), pa = el.querySelector('#o3-pa');
    pq.addEventListener('click', function () { var o = pq.getAttribute('aria-expanded') === 'true'; pa.hidden = o; pq.setAttribute('aria-expanded', o ? 'false' : 'true'); pq.textContent = o ? 'Check' : 'Hide'; });

    // open question card (static text, crop independent)
    refs.oq.innerHTML = '<span class="tag">Open question</span><h4>Is vulnerability segmentation a rule, or a feature of a few species?</h4>' +
      '<p class="ev-host">Segmentation means distal organs reach P50 at a less negative Ψ than the stem. Two studies point in different directions. ' + ev('l3.segment') + '</p>' +
      '<div class="o3-two" style="margin-top:10px">' +
        '<div class="side"><h5>Grapevine, Hochberg et al. 2016</h5><p>Petiole P50 −1.54 MPa, stem P50 −1.90 MPa, petiole and stem of the same vines imaged by MRI. Segmentation present. The authors add that air entry through the petiole into the stem is unlikely.</p></div>' +
        '<div class="side"><h5>Twelve trees, Peters &amp; Choat 2025</h5><p>Twelve Australian tree species. Segmentation was absent or negative in all twelve: the leaves were not more vulnerable than the stems.</p></div>' +
      '</div>' +
      '<p style="margin-top:10px">A second grapevine study agrees with the first: in intact Cabernet Sauvignon imaged by microCT, petioles reached P50 at ' + MINUS + '0.98 MPa and stems at ' + MINUS + '1.73 MPa, and petioles had lost 66 % when the stem reached its air-entry pressure, calculated from the fitted curve (Charrier et al. 2016) ' + ev('l3.charrier') + '. In grapevine roots, fine roots (P50 ' + MINUS + '1.8 MPa) failed before coarse roots (' + MINUS + '3.5 MPa) (Cuneo et al. 2016) ' + ev('l3.cuneoP50') + '. So: two grapevine imaging studies find segmentation; twelve Australian trees do not. Is grapevine typical?</p>' +
      '<p style="margin-top:10px"><b>What would make them comparable?</b> Measure both organs, on the same plants, with the same method. And keep two claims apart: segmentation describes the <i>order</i> of P50 values; it does not by itself say what that order does for the plant. In grapevine the stomata have closed well before the petiole loses much flow.</p>' +
      '<div class="tier-3 o3-tw"><table class="o3-t"><thead><tr><th>Study</th><th>Plants</th><th>Organs</th><th>Method</th><th>Result</th></tr></thead><tbody>' +
        '<tr><td>Hochberg et al. 2016</td><td>grapevine, Vitis vinifera</td><td>petiole, stem</td><td>MRI; synchrotron microCT</td><td>P50 difference −1.54 − (−1.90) = 0.36 MPa ' + ui.badge('DERIVED', 'Difference of two measured P50 values.') + '</td></tr>' +
        '<tr><td>Charrier et al. 2016</td><td>grapevine, Cabernet Sauvignon, intact</td><td>petiole, leaf, stem</td><td>microCT, theoretical conductivity</td><td>petiole −0.98, leaf −1.08, stem −1.73 MPa; segmentation present</td></tr>' +
        '<tr><td>Cuneo et al. 2016</td><td>grapevine roots</td><td>fine, coarse roots</td><td>microCT</td><td>fine root −1.8, coarse root −3.5 MPa</td></tr>' +
        '<tr><td>Peters &amp; Choat 2025</td><td>12 tree species</td><td>leaf, stem</td><td>see paper</td><td>segmentation absent or negative in all 12</td></tr>' +
      '</tbody></table></div>' +
      '<p class="o3-cap">Inside the leaf the same question changes shape: section 3d below puts three species on one leaf water potential axis.</p>';

    var e6q = el.querySelector('#o3-e6q'), e6a = el.querySelector('#o3-e6a');
    e6q.addEventListener('click', function () { var o = e6q.getAttribute('aria-expanded') === 'true'; e6a.hidden = o; e6q.setAttribute('aria-expanded', o ? 'false' : 'true'); e6q.textContent = o ? 'Check' : 'Hide'; });
    var ht = el.querySelector('#o3-howto');
    if (ht && ui.howto) ht.innerHTML = ['vc-microct', 'vc-mri', 'vc-optical', 'vc-cavitron', 'vc-bench', 'vc-air'].map(ui.howto).join('');
    // r5: Design it (PhD panel item 3): the root question this plate animates
    if (ht && ui.design) ht.insertAdjacentHTML('beforeend', ui.design({
      q: 'When grapevine roots run short of oxygen, does the drop in root conductance come from aquaporins closing, as in flooded Arabidopsis roots (Tournaire-Roux et al. 2003)?',
      treat: 'Pots flooded for 0, 6 and 24 hours against aerated controls; a second set aerated but given an aquaporin blocker at the root, to see how much of the drop the channels alone explain.',
      measure: 'Whole root system conductance with a pressure chamber or flowmeter on detopped roots; root cortex cell Lp with a pressure probe if available; midday leaf Ψ and gs on the same plants before harvest.',
      n: 'At least 6 vines per treatment and time, rooted cuttings of one clone. A common choice, not taken from a paper.',
      expect: function () {
        var a = WP.solve(Object.assign({}, WP.state, { crop: 'grape', flood: false })), b = WP.solve(Object.assign({}, WP.state, { crop: 'grape', flood: true }));
        return 'In this model, flooding multiplies root resistance by 4: at the current weather, leaf Ψ goes from ' + WP.fmt.psi(a.psi.leafOut) + ' to ' + WP.fmt.psi(b.psi.leafOut) + ' and stomata from ' + WP.fmt.num(100 * a.gs / a.gsMax, 0) + ' to ' + WP.fmt.num(100 * b.gs / b.gsMax, 0) + ' % open. The factor of 4 is a teaching number.';
      },
      confound: 'Time. Hours of anoxia also stop root growth and kill fine roots, so a lower conductance after a day may be lost roots, not closed channels. Measure early (hours) and normalise by root length or surface area.'
    }));
    var stops = document.createElement('div'); stops.className = 'o3-stops'; el.appendChild(stops);
    if (ui.stops) ui.stops(stops, ['3a', '3b', '3c']);
    var src = document.createElement('div'); src.className = 'tier-2 card'; src.style.marginTop = '18px'; el.appendChild(src);
    ui.sources(src, ['10.1073/pnas.1205726109', '10.1093/jxb/eraa392', '10.1104/pp.16.00923', '10.1111/pce.12688', '10.1104/pp.16.01079', '10.1104/pp.16.01816', '10.3389/fpls.2022.974050', '10.1093/treephys/18.8-9.589', '10.1111/j.1469-8137.2009.02847.x', '10.1093/aob/mcu109', '10.1111/pce.15249',
      '10.1104/pp.112.212712', '10.1038/nature11688', '10.1104/pp.126.1.27', '10.1104/pp.110.162396', '10.1104/pp.16.00136', '10.1111/nph.17282', '10.1104/pp.16.01039', '10.1104/pp.88.3.581', '10.1111/j.1365-3040.2010.02160.x', '10.1093/jxb/ert193',
      '10.1093/jxb/err270', '10.1093/jxb/erx252', '10.1073/pnas.1522569113', '10.1111/nph.13846', '10.1111/nph.16845', '10.1104/pp.16.01643'], 'Sources for this plate');
    wireEvidence(el);
    mountRootMol(el);
    mountCT(el.querySelector('#o3-ct'));
    mountVC(el); // 13 Oct: leaf vulnerability chooser and the optical method
    mountDay(el); // 14 Oct: One leaf's day (3e)
    ui.onPrefs(function () { var rmv = ui.reducedMotion(); if (LP.paused != null && rmv !== LP.rm) { LP.rm = rmv; LP.paused = rmv; } if (WP.state) { LP.sig = ''; update(WP.state, WP.result); if (LP.on) lpStart(); } dayDraw(); });
    var lastW = vbW(), tmr = 0;
    window.addEventListener('resize', function () { clearTimeout(tmr); tmr = setTimeout(function () { var w2 = vbW(); if (w2 !== lastW && root.offsetParent) { lastW = w2; update(WP.state, WP.result); } else lastW = w2; }, 150); });
  }

  /* ------------------------------------------------------------ W round 3: real grapevine midribs in microCT (Albuquerque Lab) */
  var CT = [
    { lab: 'well watered control', f: 'microCT_CHD_C2_midrib_20150823_223534_slice0012.jpg', who: 'Chardonnay', see: 'Every conduit in the midrib is grey: full of water. The black specks in the lamina are the air spaces of the mesophyll, which are always gas.' },
    { lab: 'after the first midrib embolism', f: 'microCT_CS_D7_midrib_20150823_062653_slice0126_scalebar.jpg', who: 'Cabernet Sauvignon', see: 'The first black conduits in the midrib: gas filled vessels. Most conduits are still grey.' },
    { lab: 'severe drought', f: 'microCT_CS_D1_midrib_20150822_160157_slice0160.jpg', who: 'Cabernet Sauvignon', see: 'Many midrib vessels are black, in clusters inside the vascular bundles. Minor veins in the thin lamina still show little or none.' }
  ];
  var CTi = 0;
  function mountCT(host) {
    if (!host) return;
    var cred = 'Image: Albuquerque Lab (data of Albuquerque et al. 2020, J Exp Bot 71: 7286, doi 10.1093/jxb/eraa392)';
    host.innerHTML = '<h4 id="o3-cth" class="o3-cth">Inside real grapevine midribs</h4>' +
      '<p class="o3-ctp">X-ray microCT looks inside a living leaf without cutting it. <b>Read it like this: black is gas, grey is water or tissue.</b> Slide from a well watered leaf to a very dry one and watch where the black appears.</p>' +
      '<div class="o3-ctgrid"><div class="o3-ctimg"><img data-r="ctimg" alt="" width="1005" height="1005" loading="lazy"></div>' +
      '<div class="o3-ctside"><label for="o3-cts" class="o3-ctl">Leaf water potential <output data-r="cto"></output></label>' +
      '<input type="range" id="o3-cts" min="0" max="2" step="1" value="0" list="o3-ctl">' +
      '<div class="o3-cttk" aria-hidden="true"><span>well watered</span><span>first embolism</span><span>severe</span></div>' +
      '<button type="button" class="btn small" data-r="ctme">Closest to my vine now</button>' +
      '<p class="o3-ctsee" data-r="ctsee" aria-live="polite"></p>' +
      '<p class="o3-ctnote tier-2">By the time the first midrib conduits fill with gas (from about −1.25 MPa), stomatal conductance has already lost about 80 % (−1.21 MPa, Table 2) and K<sub>leaf</sub> even more. The stomata close long before the pipes break. ' + (ui.badge ? ui.badge('MEASURED', 'Albuquerque et al. 2020: midrib embolism from about −1.25 MPa; P80 gs −1.21 MPa (Cabernet Sauvignon)') : '') + '</p></div></div>' +
      '<p class="o3-cap">' + cred + '. Synchrotron microCT of intact plants, August 2015, 1.27 µm per voxel. Three different leaves, not one leaf over time, each standing for a stage of drying; the scanned plants spanned about −0.3 to −2 MPa of stem water potential (Methods).</p>' +
      '<div class="o3-ct3"><h5>The same story in 3D</h5><p class="o3-ctp">Gas filled conduits rendered red inside the leaf, seen from above (paradermal view).</p><div class="o3-ct3g">' +
      [['3D_CS_D7_paradermal_embolism_render.jpg', 'After the first midrib embolism: the first embolised conduits, in the midrib only.'], ['3D_CS_D1_paradermal_embolism_render.jpg', 'Severe drought: more of the midrib embolised.'], ['3D_CS_D8_paradermal_embolism_render.jpg', 'Another leaf: embolism spreading from the midrib into secondary veins.']].map(function (q) {
        return '<figure><img src="img/lab/' + q[0] + '" alt="' + esc('3D rendering of a grapevine leaf, embolised conduits in red. ' + q[1]) + '" loading="lazy"><figcaption>' + esc(q[1]) + '</figcaption></figure>'; }).join('') +
      '</div><p class="o3-cap">' + cred + '. 3D renderings of the August 2015 microCT scans. Minor veins rarely embolised, even at very negative Ψ.</p></div>';
    var img = host.querySelector('[data-r="ctimg"]'), sl = host.querySelector('#o3-cts');
    function show(i) {
      CTi = i; var c = CT[i]; sl.value = i;
      img.src = 'img/lab/' + c.f; img.alt = 'MicroCT cross section of a grapevine leaf midrib, ' + c.who + ', ' + c.lab + '. ' + c.see;
      host.querySelector('[data-r="cto"]').textContent = c.lab;
      host.querySelector('[data-r="ctsee"]').innerHTML = '<b>' + esc(c.who) + ', ' + esc(c.lab) + '.</b> ' + esc(c.see);
    }
    sl.addEventListener('input', function () { show(+sl.value); });
    host.querySelector('[data-r="ctme"]').addEventListener('click', function () {
      var p = WP.result ? WP.result.psi.leafOut : -0.45, best = p > -1.25 ? 0 : (p > -1.9 ? 1 : 2); // published onset about −1.25 MPa (Albuquerque et al. 2020)
      show(best);
      host.querySelector('[data-r="ctsee"]').innerHTML += ' <i>Your model ' + (WP.state && WP.state.crop === 'grape' ? 'vine' : 'leaf') + ' is at ' + WP.fmt.psi(p) + ' now.</i>';
    });
    show(0);
  }

  /* ------------------------------------------------------------ W round 1: root molecular theatre */
  var RM = { T: null, noCS: false, host: null };
  function mountRootMol(host) {
    var M = window.MOL || WP.mol; if (!M || !M.scenes.root) return;
    RM.host = host;
    RM.T = M.Theatre(host.querySelector('[data-r="rootmol"]'), M.scenes.root(), { height: function (cw) { return cw < 560 ? 310 : 360; }, dark: ui.isDark(), reduce: ui.reducedMotion(), prewarm: 16, // 13 Oct: about 24 % taller
      label: 'Animated root radial path: water molecules move from soil along cortex walls and through cells, cross membranes at the endodermis where the Casparian strip seals the walls, and enter a xylem vessel' });
    var rpb = host.querySelector('[data-rm="pause"]'); if (rpb && window.PlaySpeed) rpb.insertAdjacentElement('afterend', window.PlaySpeed.chip('ps-light'));
    if (window.WPFreeze) WPFreeze.attach(RM.T.canvas, { paused: function () { return RM.T.paused; }, button: rpb }); // v19: click the view to freeze
    host.addEventListener('click', function (e) {
      var b = e.target.closest('[data-rm]'); if (!b) return;
      var k = b.dataset.rm;
      if (k === 'aqp') WP.set({ flood: !WP.state.flood });
      else if (k === 'cs') { RM.noCS = !RM.noCS; updRootMol(WP.state, WP.result); }
      else if (k === 'dry') WP.set({ soilPsi: WP.state.soilPsi < -1 ? -0.1 : -1.5 });
      else if (k === 'pause') { var pz = RM.T.pause(); b.setAttribute('aria-pressed', pz ? 'true' : 'false'); b.textContent = pz ? 'Play' : 'Pause'; }
    });
  }
  function updRootMol(st, res) {
    if (!RM.T) return;
    RM.T.setTheme(ui.isDark()); RM.T.setReduce(ui.reducedMotion());
    var dry = clamp((-st.soilPsi - 0.3) / 1.5, 0, 1); // ILLUSTRATIVE: gaps open as the soil passes about −0.3 MPa
    var shrink = 0.22 * dry, flood = !!st.flood;
    RM.T.set({ mode: 'crop', flux: 2.2 * res.E, aqp: flood ? 0.15 : 1, shrink: shrink, soilWet: 1 - 0.85 * dry, casparian: !RM.noCS, leak: dry > 0.4 ? 1.2 * dry : 0, ions: true });
    var bs = RM.host.querySelectorAll('[data-rm]');
    Array.prototype.forEach.call(bs, function (b) {
      if (b.dataset.rm === 'aqp') b.setAttribute('aria-pressed', flood ? 'true' : 'false');
      if (b.dataset.rm === 'cs') b.setAttribute('aria-pressed', RM.noCS ? 'true' : 'false');
      if (b.dataset.rm === 'dry') { b.setAttribute('aria-pressed', st.soilPsi < -1 ? 'true' : 'false'); b.textContent = st.soilPsi < -1 ? 'Rewet the soil' : 'Dry soil (−1.5 MPa)'; }
    });
    var t = RM.host.querySelector('[data-r="rootmoltxt"]');
    if (t) t.innerHTML = 'Inflow drawn at 2.2 molecules per second per mmol m⁻² s⁻¹ of transpiration (now ' + num(res.E, 2) + '). ' +
      (flood ? 'Aquaporins closed: molecules queue at every membrane, and the root resistance in the model rises 4 fold. ' : '') +
      (RM.noCS ? 'Without the strip, ions in the walls slip straight into the xylem: the root could no longer choose what it takes up. ' : 'Ions in the walls stop at the strip. ') +
      (dry > 0.05 ? 'The soil is at ' + WP.fmt.psi(st.soilPsi) + ': the root has shrunk and an air gap is opening, so less water crosses from soil to root, and water that tries to leak back out stops at the gap.' : '');
  }

  /* ------------------------------------------------------------ update */
  function update(st, res) {
    if (!refs.rd) return;
    var crop = st.crop, lbl = WP.params.crops[crop].label;
    refs.now.textContent = nowText(st, res);
    leafUpdate(st, res);
    refs.rd.innerHTML = rootDynamic(st, res);
    updRootMol(st, res);
    rootFlow(st, res);
    var rc = '<b>Two routes.</b> Along the walls (orange) water moves freely through the cortex until the Casparian strip stops it; there it must enter an endodermal cell. Through the cells (blue) it crosses a membrane at every wall, each bar on the path. ';
    rc += 'The molecules ride each route at a speed set by the model transpiration; close the aquaporins and the membrane crossings slow to a crawl. <span class="tier-3">Drawing scale: 12 units s⁻¹ per mmol m⁻² s⁻¹, membrane crossings at one sixth with aquaporins closed (ILLUSTRATIVE).</span> ';
    rc += opts.aqpClosed ? '<b>Aquaporins closed:</b> membranes pass water only at the slow lipid rate. The open wall route still bypasses the cortex, but not the endodermis, which is in series with it. That is the bottleneck.' : 'Close the aquaporins to find the bottleneck.';
    refs.rootcap.innerHTML = rc;
    var rn = root.querySelector('#o3-rootnow');
    if (rn) rn.innerHTML = 'Root Ψ now ' + psi(res.psi.root) + '; root resistance ' + num(res.R.root * 1000, 0) + ' MPa m² s mol⁻¹' + (res.PLC.root === null || res.PLC.root === undefined ? ' (no root P50 for this crop: not inflated)' : ', root xylem ' + num(res.PLC.root, 1) + ' % lost') + ' ' + ui.badge('ILLUSTRATIVE', 'Model value.');

    var W = vbW();
    root.querySelector('#o3-ruler').setAttribute('viewBox', '0 0 ' + W + ' 210');
    refs.chart.setAttribute('viewBox', '0 0 ' + W + ' 400');
    refs.rl.innerHTML = rulerSVG(st, res);
    refs.ch.innerHTML = chartSVG(st, res);
    var legItem = function (cls, txt, dash) { return '<span><svg viewBox="0 0 30 12" aria-hidden="true"><path d="M1,6 H29" class="' + cls + '"' + (dash ? '' : '') + '/></svg>' + txt + '</span>'; };
    var mk = '<span><svg viewBox="0 0 30 12" aria-hidden="true"><rect x="9" y="0" width="12" height="12" style="fill:var(--ink)"/></svg>published point, MEASURED</span>';
    refs.leg.innerHTML = legItem('c-gs', 'stomata closed (closure curve)') + (crop !== 'romaine' ? legItem('c-stem', 'stem xylem lost') : '') + (crop === 'grape' ? legItem('c-pet', 'petiole xylem lost') : '') + (crop !== 'romaine' ? mk : '') +
      '<span><svg viewBox="0 0 30 12" aria-hidden="true"><circle cx="15" cy="6" r="4.5" fill="none" stroke="var(--ink)" stroke-width="2"/></svg>each organ now, at its own Ψ</span>';
    var cc = '';
    if (crop === 'grape') cc = '<b>Same axis, different quantities.</b> The orange curve is the share of stomatal conductance lost, plotted against leaf Ψ; half closure at −0.60 MPa ' + ev('l3.gs80') + '. The blue and black curves are the share of xylem conductivity lost in petiole and stem, plotted against xylem pressure; the squares are the MRI P50 values ' + ev('l3.p50grape') + ' and the open diamond the microCT check ' + ev('l3.microct') + '. They come from different studies, cultivars and methods, so the gap is a comparison across studies, not one experiment. In a grapevine dry down, complete stomatal closure came days before embolism ' + ev('l3.order') + '. <span class="tier-3">The open diamond near −1.0 MPa is Charrier et al. 2016 with microCT on another cultivar ' + ev('l3.charrier') + '.</span> Curve shapes are ILLUSTRATIVE; P50 positions are measured ' + ev('l3.plcshape') + '.';
    else if (crop === 'almond') cc = '<b>Same axis, different quantities.</b> Circles: the Ψ at which stomata were 90 % closed, three cultivars. Squares: stem P50 by air injection, the same three cultivars ' + ev('l3.almond') + '. The model’s closure and stem curves are ILLUSTRATIVE shapes placed between those points ' + ev('l3.plcshape') + '. There is no almond petiole value, so no petiole curve is drawn.';
    else cc = '<b>Only one curve.</b> The romaine closure curve is a teaching shape with no published value behind it, and no lettuce xylem P50 was found ' + ev('l3.romaine') + '. That gap is worth a research project.';
    root.querySelector('#o3-rom').hidden = crop !== 'romaine';
    refs.chcap.innerHTML = ui.prose ? cc.replace(/ILLUSTRATIVE/g, ui.badge('ILLUSTRATIVE')) : cc;
    refs.chart.querySelector('title').textContent = lbl + ': closure curve at ' + Math.round(100 * (1 - res.fPsi)) + ' % closed at leaf ' + psi(res.psi.leafOut) + '; stem PLC ' + (res.PLC.stem === null ? 'not found' : num(res.PLC.stem, 0) + ' %') + '; petiole PLC ' + (res.PLC.petiole === null ? 'not found' : num(res.PLC.petiole, 0) + ' %') + '.';

    var soil = root.querySelector('#o3-soil'); soil.value = st.soilPsi; root.querySelector('#o3-soil-o').textContent = psi(st.soilPsi);
    function tile(k, v, sub) { return '<div class="tile"><div class="k">' + k + '</div><div class="v">' + v + '</div><div class="s">' + sub + '</div></div>'; }
    refs.tiles.innerHTML = tile('Leaf, outside xylem', num(res.psi.leafOut, 2) + ' <small>MPa</small>', ui.stomata(res).text) +
      tile('Petiole xylem', num(res.psi.petiole, 2) + ' <small>MPa</small>', res.PLC.petiole === null ? 'P50 not found' : num(res.PLC.petiole, 1) + ' % conductivity lost' + (crop === 'almond' ? ' (stem curve)' : '')) +
      tile('Stem xylem', num(res.psi.stem, 2) + ' <small>MPa</small>', res.PLC.stem === null ? 'P50 not found' : num(res.PLC.stem, 1) + ' % conductivity lost');

    var V = vesselsSVG(st, res);
    refs.vs.innerHTML = V.svg;
    root.querySelector('#o3-ves').setAttribute('viewBox', W < 600 ? '0 0 560 800' : '0 0 760 326');
    refs.vescap.innerHTML = '<span class="tier-1-only">Black circles are pipes full of air. A watered vine should have almost none. </span><b class="tier-2">Vessels darken as the percent loss of conductivity (PLC) rises.</b> Charcoal is an air filled vessel. In grapevine stems embolism starts in the vessels next to the pith and spreads outward in radial groups within sectors, rarely sideways (Brodersen et al. 2013) ' + ev('l3.brodersen') + '. The share of dark vessels follows the PLC for the eye only; real PLC weights wide vessels far more than narrow ones. ' + (crop === 'romaine' ? 'Lettuce stays blue because no P50 was found.' : '') + ' The tall panel is a pit membrane between an air filled vessel and a sap filled one, at the ' + (crop === 'grape' ? 'petiole' : 'stem') + ' sap pressure now.';
    var Ds = root.querySelector('#o3-D'); Ds.value = opts.D; root.querySelector('#o3-D-o').textContent = num(opts.D, 2) + ' µm';
    heroUpdate(st, res);
    refs.thr.innerHTML = 'ΔP = 4 × 0.0728 N m⁻¹ ÷ ' + num(opts.D, 2) + ' µm = <b>' + num(V.thr, 2) + ' MPa</b> ' + ui.badge('DERIVED', 'Capillary equation, contact angle 0, T at 20 °C.') + '<br>Sap tension now: ' + num(V.pull, 2) + ' MPa. ' + (V.seeds ? 'The tension beats the threshold: air seeds through this pore.' : 'Below the threshold: the meniscus holds.');
  }

  /* ------------------------------------------------------------ 13 Oct (journey builder): leaf vulnerability chooser and the optical method
     Curves: Lantana camara and coast live oak are Weibull curves drawn through the published P50 and P80 (Scoffoni et al. 2012,
     Table 2): DERIVED shape, MEASURED points. Grapevine is the published Cabernet Sauvignon fit (Albuquerque et al. 2020). */
  var M = MINUS;
  var VC = { on: { lan: true, oak: true, gr: true }, psi: -1.0, cav: -4.3 };
  var VSP = {
    lan: { name: 'Lantana', full: 'Lantana camara, a tropical shrub', col: '#E69F00', p50: -0.80, p80: -1.41, tlp: -1.37, ev: 'lh.lantana' },
    oak: { name: 'coast live oak', full: 'Quercus agrifolia, coast live oak', col: '#009E73', p50: -2.40, p80: -3.83, tlp: -3.00, ev: 'lh.oak' },
    gr: { name: 'grapevine', full: 'Vitis vinifera, Cabernet Sauvignon', col: '#CC79A7', p50: -0.30, p80: -0.71, tlp: -1.37, ev: 'lh.grape' }
  };
  function vcFn(k) { return k === 'gr' ? WP.lh.grapeLost : WP.lh.weibull(VSP[k].p50, VSP[k].p80); }
  function mountVC(el) {
    var LH = WP.lh; if (!LH) return;
    LH.css();
    var sec = document.createElement('section'); sec.className = 'lh-sec'; sec.setAttribute('aria-labelledby', 'o3-vc-h');
    sec.innerHTML = '<h3 id="o3-vc-h"><span class="no">3d</span>Whose leaves lose water flow first?</h3>' +
      '<p class="lh-q">Three leaves, one method. Choose who to compare, then dry them all with one slider.</p>' +
      '<div class="lh-two">' +
        '<div><div class="chips lh-chips" role="group" aria-label="Species to show">' +
          Object.keys(VSP).map(function (k) { return '<button type="button" class="chip" data-vc="' + k + '" aria-pressed="true"><span aria-hidden="true" style="display:inline-block;width:10px;height:10px;border-radius:50%;background:' + VSP[k].col + ';margin-right:6px"></span>' + VSP[k].name + '</button>'; }).join('') + '</div>' +
          '<div data-r="vcch"></div>' +
          '<div class="lh-sl"><label for="o3-vc-psi">Dry the leaves</label><input type="range" id="o3-vc-psi" min="-4" max="0" step="0.05" value="-1"><output id="o3-vc-psio"></output></div></div>' +
        '<div><p class="lh-read" data-r="vcread" aria-live="polite" style="margin-top:0"></p>' +
          '<p class="lh-cap tier-2">P50 is the leaf water potential at which K<sub>leaf</sub>, the ease of water flow through the whole leaf, has fallen by half. Dots on each curve mark the species’ turgor loss point, where the leaf cells go limp. ' + LH.ev('lh.lantana', 'Evidence: Lantana') + ' ' + LH.ev('lh.oak', 'Evidence: oak') + ' ' + LH.ev('lh.grape', 'Evidence: grapevine') + '</p>' +
          '<p class="lh-cap tier-2">The shaded band is the average loss at turgor loss across flowering plants, 57 to 80 % depending on the method; gymnosperms run 30 to 81 % (Scoffoni & Sack 2017). So “more than half is gone by wilting” is a fair rule for flowering plants, not for every plant. ' + LH.ev('lh.meta') + '</p>' +
          '<p class="lh-cap tier-3">Curve shapes: Lantana and oak are Weibull curves drawn through the published P50 and P80, with no loss at 0 MPa ' + LH.badge('DERIVED', 'K ÷ Kmax = exp(−(Ψ ÷ b)^c), with b and c set by P50 and P80; the points are MEASURED, the shape between and beyond them is not.') + '; grapevine is the published Cabernet Sauvignon fit ' + LH.badge('MEASURED') + '. All three were measured with the evaporative flux method (How to measure, Water VI). Same method, so the comparison is fair; a different method can move a P50.</p>' +
        '</div></div>' +
      LH.check('At ' + M + '1.0 MPa, which of these leaves has already lost more than half its water flow?',
        'Lantana and grapevine. Lantana halves at ' + M + '0.80 MPa and grapevine (Cabernet Sauvignon) at ' + M + '0.30 MPa, so both are past P50 at ' + M + '1.0 MPa. Coast live oak only halves at ' + M + '2.40 MPa. Set the slider to ' + M + '1.0 and read the tiles.', 'tier-2') +
      '<div class="card ev-host" style="margin-top:14px"><h4 style="margin:0 0 6px">Watch the veins fail: the optical method</h4>' +
        '<div class="lh-two even"><div><svg class="lh-svg" data-r="veins" viewBox="0 0 420 260" role="img" aria-label="A leaf with its midrib, second order veins and minor veins; veins turn dark as they fill with air"></svg>' +
          '<div class="lh-sl"><label for="o3-cav">Leaf Ψ</label><input type="range" id="o3-cav" min="-5.5" max="-3" step="0.05" value="-4.3"><output id="o3-cavo"></output></div>' +
          '<div class="lh-key"><span><svg viewBox="0 0 28 10"><path d="M1,5 H27" stroke="var(--w2)" stroke-width="4"/></svg>water filled</span><span><svg viewBox="0 0 28 10"><path d="M1,5 H27" stroke="var(--emb)" stroke-width="4"/></svg>filled with air</span></div></div>' +
        '<div><p style="margin:0">Shine light through a drying leaf and photograph it every few minutes: a vein that fills with air changes how it transmits light, so each embolism shows up as a sudden flicker in the images. With this optical method, the first embolism always appeared in the <b>largest</b> vein, the midrib, and the minor veins failed last ' + LH.ev('lh.optical') + '.</p>' +
          '<p style="margin:8px 0 0">The drawing uses the thresholds measured in six Caragana shrubs: midrib embolism from ' + M + '4.0 to ' + M + '4.6 MPa and second order veins from ' + M + '4.5 to ' + M + '5.2 MPa, far below their turgor loss point ' + LH.ev('lh.caraganaopt') + ' ' + LH.badge('MEASURED', 'Threshold ranges across species; how fast each vein darkens within its range is drawn, not measured.') + '.</p>' +
          '<p class="tier-2" style="margin:8px 0 0">Grapevine follows the same order: in the microCT slices above, the first gas filled conduits sit in the midrib from about ' + M + '1.25 MPa, while embolism in the minor veins stays rare ' + ev('l3.gs80') + '.</p></div></div>' +
        '<p class="lh-cap tier-3" style="margin-top:10px"><b>Two lines of evidence, two stages.</b> In four flowering plants, optical embolism tracked the fall in K<sub>leaf</sub> and came after the stomata had closed, under severe stress ' + LH.ev('lh.optical2') + '. With the evaporative flux method and microCT, most of the early K<sub>leaf</sub> loss happened outside the xylem while the veins were still full (Water IV) ' + LH.ev('lh.ox8') + '. Which methods see which stage of drying? ' + LH.badge('OPEN QUESTION') + '</p>' +
        '<p class="lh-cap tier-3">How the optical method works, step by step: see the How to measure cards above.</p>' +
      '</div>';
    var stops = el.querySelector('.o3-stops');
    if (stops) el.insertBefore(sec, stops); else el.appendChild(sec);
    LH.toggle(sec);
    sec.querySelector('.lh-chips').addEventListener('click', function (e) {
      var b = e.target.closest('[data-vc]'); if (!b) return;
      var k = b.getAttribute('data-vc'), n = Object.keys(VC.on).filter(function (q) { return VC.on[q]; }).length;
      if (VC.on[k] && n === 1) return; // keep one curve
      VC.on[k] = !VC.on[k]; b.setAttribute('aria-pressed', VC.on[k] ? 'true' : 'false'); vcDraw(sec);
    });
    var ps = sec.querySelector('#o3-vc-psi'); ps.addEventListener('input', function () { VC.psi = +ps.value; vcDraw(sec); });
    var cv = sec.querySelector('#o3-cav'); cv.addEventListener('input', function () { VC.cav = +cv.value; veinsDraw(sec); });
    vcDraw(sec); veinsDraw(sec);
    var tmr = 0; window.addEventListener('resize', function () { clearTimeout(tmr); tmr = setTimeout(function () { vcDraw(sec); }, 160); });
  }
  function vcDraw(sec) {
    var LH = WP.lh, keys = Object.keys(VSP).filter(function (k) { return VC.on[k]; });
    var host = sec.querySelector('[data-r="vcch"]'), nar = LH.narrow(host);
    var series = [], pts = [];
    keys.forEach(function (k) {
      var f = vcFn(k), v = VSP[k];
      series.push({ fn: f, col: v.col, lab: nar ? '' : v.name, labPsi: k === 'oak' ? -2.9 : (k === 'lan' ? -1.15 : -1.75), dy: k === 'gr' ? -10 : (k === 'oak' ? 22 : 22) });
      pts.push({ x: v.tlp, y: f(v.tlp), col: v.col, hollow: true });
    });
    host.innerHTML = LH.chart({ W: nar ? 440 : 600, H: nar ? 300 : 320, xmin: -4, series: series, pts: pts, cursor: VC.psi,
      band: { y0: 57, y1: 80, lab: 'flowering plants at turgor loss' }, aria: 'Percent of leaf hydraulic conductance lost against leaf water potential for the chosen species' });
    sec.querySelector('#o3-vc-psio').textContent = LH.psi(VC.psi);
    sec.querySelector('[data-r="vcread"]').innerHTML = 'At <b>' + LH.psi(VC.psi) + '</b>:<br>' + keys.map(function (k) {
      var v = VSP[k], lost = vcFn(k)(VC.psi), atT = vcFn(k)(v.tlp);
      return '<span style="color:' + v.col + ';font-weight:700">●</span> ' + v.full + ', has lost <b>' + LH.num(Math.max(0, lost), 0) + ' %</b> of its K<sub>leaf</sub>' + (VC.psi <= v.tlp ? ', and its cells have lost turgor' : '') +
        '<span class="tier-2"> (P50 ' + LH.psi(v.p50) + '; about ' + LH.num(atT, 0) + ' % lost at its turgor loss point, ' + LH.psi(v.tlp) + ')</span>';
    }).join('<br>');
  }
  var VEIN = null;
  function veinsBuild() {
    var mid = [[40, 130], [380, 130]], sec2 = [], minor = [];
    for (var i = 0; i < 6; i++) {
      var x0 = 80 + i * 50;
      [-1, 1].forEach(function (s) { sec2.push({ d: 'M' + x0 + ',130 Q' + (x0 + 30) + ',' + (130 + s * 40) + ' ' + (x0 + 55) + ',' + (130 + s * (78 - Math.abs(i - 2.5) * 8)), k: (i * 2 + (s > 0 ? 1 : 0)) / 12 }); });
    }
    for (var x = 70; x < 370; x += 22) for (var y = 70; y < 200; y += 22) { if (Math.abs(y - 130) < 8) continue; var dx = (x * 7 % 9) - 4, dy = (y * 5 % 7) - 3; minor.push('M' + x + ',' + y + ' L' + (x + 18 + dx) + ',' + (y + 6 + dy)); }
    VEIN = { mid: mid, sec2: sec2, minor: minor };
  }
  function veinsDraw(sec) {
    var LH = WP.lh; if (!VEIN) veinsBuild();
    var p = VC.cav, fm = Math.max(0, Math.min(1, (-4.0 - p) / 0.6)), f2 = Math.max(0, Math.min(1, (-4.5 - p) / 0.7));
    var s = '<path d="M30,130 C90,40 320,30 395,130 C320,230 90,220 30,130 Z" fill="var(--leaf2)" stroke="var(--leaf3)" stroke-width="1.5"/>';
    s += VEIN.minor.map(function (d) { return '<path d="' + d + '" stroke="var(--w3)" stroke-width="1.2" opacity=".75"/>'; }).join('');
    s += VEIN.sec2.map(function (v) { return '<path d="' + v.d + '" fill="none" stroke="' + (v.k < f2 ? 'var(--emb)' : 'var(--w2)') + '" stroke-width="3"/>'; }).join('');
    var xm = 40 + 340 * fm;
    s += '<path d="M14,130 L40,130" stroke="' + (fm > 0 ? 'var(--emb)' : 'var(--w1)') + '" stroke-width="7"/>';
    s += '<path d="M40,130 L380,130" stroke="var(--w1)" stroke-width="6.5"/>' + (fm > 0 ? '<path d="M40,130 L' + xm.toFixed(1) + ',130" stroke="var(--emb)" stroke-width="6.5"/>' : '');
    s += '<text class="sm halo" x="210" y="20" text-anchor="middle">' + (p > -4.0 ? 'all veins still full of water' : (f2 === 0 ? 'the midrib fails first' : (f2 < 1 ? 'now the second order veins' : 'minor veins still full: they fail last'))) + '</text>';
    s += '<text class="sm halo" x="205" y="250" text-anchor="middle">midrib · second order veins · minor veins</text>';
    sec.querySelector('[data-r="veins"]').innerHTML = s;
    sec.querySelector('#o3-cavo').textContent = LH.psi(p);
  }


  /* ============================================================ 14 Oct (organ builder): VISUAL UPGRADE ROUND
     A. Macro hero at the top of the plate: a grapevine petiole vessel beside an air filled neighbour, the pit membrane
        between them, water molecules moving at the model rate (parabolic profile), and air seeding through the widest
        pore once the sap tension beats ΔP = 4T ÷ D (the same D as the 3b slider). Three.js r128 (vendor/three.min.js);
        a 2D canvas version is the fallback and the reduced motion view. Didactic reconstruction; papers credited only.
     B. "One leaf's day" (3e): one Cabernet Sauvignon leaf on one leaf water potential line, thresholds from
        Albuquerque et al. 2020 (doi 10.1093/jxb/eraa392) and, as a separate quantity in another cultivar,
        Hochberg et al. 2016 (doi 10.1111/pce.12688, Syrah, MRI). Lab microCT midribs at 1.27 µm per voxel. */
  var T_SURF = 0.0728; // N m⁻¹ at 20 °C, as in 3b
  function seedThr() { return 4 * T_SURF / opts.D; } // MPa, D in µm
  var HERO = WP._whO = { psi: -0.8, follow: true, shown: true, E: 3, state: 'full', t: 0, seedT: 0, front: 0, visible: false, paused: false, gl: null, c2: null, raf: 0, last: 0, host: null, built: false,
    minDt: 30, dprCap: 1.5, nf: 0, cost: null, glFails: 0, glPending: false, canGL: null,
    lanes: [[0, 0], [0.42, 0.35], [0.42, 1.9], [0.42, -1.5], [0.42, 3.4], [0.72, 0.95], [0.72, -0.7], [0.72, 3.65], [0.72, 4.5]] }; // streamlines: [radius as a share of R, angle]
  var HCSS = '\
#lv-organ .o3h-stage{cursor:grab;touch-action:pan-y pinch-zoom;-webkit-user-select:none;user-select:none;outline:none}\
#lv-organ .o3h.mh-drag .o3h-stage{cursor:grabbing}\
#lv-organ .o3h.mh-explore .o3h-stage{touch-action:none}\
#lv-organ .o3h-stage:focus-visible{outline:2px solid #ffd479;outline-offset:-4px}\
#lv-organ .o3h.mh-explore::after{box-shadow:inset 0 0 0 2px #ffd479,inset 0 0 90px rgba(0,0,0,.35)}\
#lv-organ .o3h-q{transition:opacity .25s}#lv-organ .o3h.mh-drag .o3h-q{opacity:.3}\
#lv-organ .o3h-ctlhost .mh-ctl{border-radius:0 0 14px 14px;margin:-12px 0 8px;padding-top:12px}\
#lv-organ .o3h{position:relative;margin:4px 0 8px;border-radius:16px;overflow:hidden;aspect-ratio:100/66;min-height:460px;max-height:680px;isolation:isolate;box-shadow:0 18px 40px -26px rgba(0,0,0,.6)}\
@media (max-width:620px){#lv-organ .o3h{aspect-ratio:auto;height:clamp(480px,138vw,560px);min-height:0;border-radius:12px}}\
#lv-organ .o3h-nm{position:absolute;transform:translate(-50%,0);background:rgba(8,16,12,.8);color:#fbf7ec;font:700 10.5px/1 system-ui,-apple-system,Segoe UI,sans-serif;padding:3px 7px 3px;border-radius:999px;white-space:nowrap;border:1px solid rgba(255,255,255,.5);pointer-events:none}\
#lv-organ .o3h-nm[hidden]{display:none}\
@media (max-width:620px){#lv-organ .o3h-nm{font-size:9.5px}}\
#lv-organ .o3h-btns .ps-chip{min-height:32px}\
#lv-organ .o3h canvas{position:absolute;inset:0;width:100%;height:100%;display:block}\
#lv-organ .o3h .o3h-bg{filter:blur(9px) saturate(1.05);transform:scale(1.08)}\
#lv-organ .o3h .o3h-fg{filter:blur(12px);pointer-events:none;opacity:.85}\
#lv-organ .o3h::after{content:"";position:absolute;inset:0;pointer-events:none;box-shadow:inset 0 0 90px rgba(0,0,0,.35);border-radius:inherit}\
#lv-organ .o3h .o3h-scrim{position:absolute;left:0;right:0;bottom:0;height:46%;background:linear-gradient(to top,rgba(4,10,8,.78),rgba(4,10,8,0));pointer-events:none}\
#lv-organ .o3h-q{position:absolute;left:50%;transform:translateX(-50%);bottom:40px;width:min(86%,620px);box-sizing:border-box;background:rgba(10,22,14,.84);border:1px solid rgba(214,232,196,.38);border-radius:16px;padding:10px 16px 11px;color:#f6f3e8;text-align:center;font-family:var(--ui);backdrop-filter:blur(3px)}\
#lv-organ .o3h-q b{display:block;font-size:clamp(16px,2.1vw,21px);line-height:1.25;font-weight:650}\
#lv-organ .o3h-q span{display:block;font-size:13.5px;line-height:1.4;color:#dfe8d6;margin-top:4px}\
@media (max-width:620px){#lv-organ .o3h-q{bottom:50px;padding:8px 12px}#lv-organ .o3h-q span{display:none}#lv-organ .o3h-cr{font-size:10.5px;bottom:7px}}\
#lv-organ .o3h-ansm{display:none;margin:6px 0 0;padding:8px 12px;border-radius:10px;background:var(--card);border:1px solid var(--rule2);font-family:var(--ui);font-size:14px;line-height:1.4;color:var(--ink)}\
@media (max-width:620px){#lv-organ .o3h-ansm{display:block}}\
#lv-organ .o3h-cr{position:absolute;left:0;right:0;bottom:9px;text-align:center;font-family:var(--ui);font-size:11.5px;color:rgba(255,255,255,.92);letter-spacing:.01em;padding:0 10px}\
#lv-organ .o3h-cr a{color:inherit;text-decoration:underline;text-underline-offset:2px}\
#lv-organ .o3h-tags{position:absolute;inset:0;pointer-events:none}\
#lv-organ .o3h-tag{position:absolute;transform:translate(-50%,-100%);background:rgba(8,16,12,.76);color:#fff;font-family:var(--ui);font-size:12px;line-height:1.2;padding:3px 9px;border-radius:999px;white-space:nowrap;border:1px solid rgba(255,255,255,.22)}\
#lv-organ .o3h-tag::after{content:"";position:absolute;left:50%;top:100%;width:1px;height:12px;background:rgba(255,255,255,.7)}\
#lv-organ .o3h-tag.below{transform:translate(-50%,12px)}#lv-organ .o3h-tag.below::after{top:auto;bottom:100%}\
#lv-organ .o3h-tag[hidden]{display:none}\
#lv-organ .o3h-ui{display:grid;grid-template-columns:minmax(0,1fr);gap:8px 16px;align-items:center;margin:8px 0 4px;font-family:var(--ui);font-size:14px}\
@media (min-width:760px){#lv-organ .o3h-ui{grid-template-columns:minmax(0,1.2fr) minmax(0,1fr)}}\
#lv-organ .o3h-sl label{display:block;font-weight:600;margin-bottom:2px}\
#lv-organ .o3h-sl input{width:100%}\
#lv-organ .o3h-btns{display:flex;flex-wrap:wrap;gap:8px}\
#lv-organ .o3h-read{margin:2px 0 0;font-family:var(--ui);font-size:13.5px;color:var(--ink2)}\
#lv-organ .o3h-read b{color:var(--ink)}\
#lv-organ .o3d{margin-top:8px}\
#lv-organ .o3d-q{position:relative;margin:2px 0 12px;background:#0f1d14;color:#f6f3e8;border-radius:14px;padding:10px 16px;font-family:var(--ui);font-size:clamp(15px,1.9vw,19px);font-weight:650;border:1px solid rgba(214,232,196,.3)}\
#lv-organ .o3d-q small{display:block;font-weight:400;font-size:12px;color:#d6dfcc;margin-top:3px}\
#lv-organ .o3d-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:12px}\
@media (min-width:760px){#lv-organ .o3d-grid{grid-template-columns:minmax(0,1.35fr) minmax(0,1fr);align-items:start}}\
#lv-organ .o3d-leaf{background:var(--card);border:1px solid var(--rule2);border-radius:12px;overflow:hidden}\
#lv-organ .o3d-leaf svg{display:block;width:100%;height:auto}\
#lv-organ .o3d-ct{margin:0;background:#000;border-radius:12px;overflow:hidden;position:relative}\
#lv-organ .o3d-ct img{display:block;width:100%;height:auto;aspect-ratio:1/1;object-fit:cover}\
#lv-organ .o3d-ct figcaption{position:absolute;left:0;right:0;bottom:0;padding:18px 10px 7px;background:linear-gradient(to top,rgba(0,0,0,.85),rgba(0,0,0,0));color:#fff;font-family:var(--ui);font-size:12px;line-height:1.35}\
#lv-organ .o3d-ct .o3d-cttag{position:absolute;left:8px;top:8px;background:rgba(0,0,0,.7);color:#fff;font-family:var(--ui);font-size:11.5px;padding:2px 8px;border-radius:999px}\
#lv-organ .o3d-tiles{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:10px}\
#lv-organ .o3d-tile{border:1px solid var(--rule2);border-radius:10px;padding:7px 10px;background:var(--card);font-family:var(--ui)}\
#lv-organ .o3d-tile .k{font-size:11.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--ink2)}\
#lv-organ .o3d-tile .v{font-size:20px;font-weight:650;color:var(--ink)}\
#lv-organ .o3d-tile .s{font-size:12px;color:var(--ink2)}\
#lv-organ .o3d-ctl{display:grid;grid-template-columns:minmax(0,1fr);gap:8px;margin:12px 0 4px;font-family:var(--ui);font-size:14px}\
#lv-organ .o3d-ctl label{font-weight:600}\
#lv-organ .o3d-ctl input{width:100%}\
#lv-organ .o3d-ends{display:flex;justify-content:space-between;font-size:12px;color:var(--ink2);margin-top:-4px}\
#lv-organ .o3d-axis svg{display:block;width:100%;height:auto}\
#lv-organ ol.o3d-list{list-style:none;margin:8px 0 0;padding:0;display:grid;grid-template-columns:minmax(0,1fr);gap:6px;font-family:var(--ui);font-size:13.5px}\
@media (min-width:760px){#lv-organ ol.o3d-list{grid-template-columns:repeat(2,minmax(0,1fr))}}\
#lv-organ ol.o3d-list li{display:grid;grid-template-columns:28px minmax(0,1fr);gap:8px;align-items:start;padding:7px 9px;border-radius:10px;border:1px solid var(--rule2);background:var(--card);opacity:.62;transition:opacity .3s,border-color .3s}\
#lv-organ ol.o3d-list li.on{opacity:1;border-color:var(--ink)}\
#lv-organ ol.o3d-list li.xy{border-style:dashed}\
#lv-organ ol.o3d-list .n{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;font-weight:700;font-size:12.5px;color:#fff}\
#lv-organ ol.o3d-list .v{font-weight:700}\
#lv-organ ol.o3d-list .c{display:block;font-size:12px;color:var(--ink2)}\
#lv-organ .o3d-msg{margin-top:12px;border-left:4px solid var(--warm);padding:8px 12px;background:var(--card);border-radius:0 10px 10px 0;font-family:var(--ui);font-size:14.5px}\
#lv-organ .o3d-cr{font-family:var(--ui);font-size:12px;color:var(--ink2);margin:8px 0 0}\
#lv-organ .o3d-svgt{font-family:var(--ui);font-size:13px;fill:var(--ink)}\
#lv-organ .o3d-svgs{font-family:var(--ui);font-size:11.5px;fill:var(--ink2)}\
';

  /* ---------- evidence for the new pieces (all from sheets/lead_verified_from_pdfs.json, VERIFIED from the PDFs) */
  var EV2 = {
    'l3.day.gs': { claim: 'Cabernet Sauvignon stomatal conductance falls by half at a leaf water potential of −0.60 MPa and by 80 % at −1.21 MPa (curves from Ψ = 0). Fit: gs = −0.061 + 0.334 e^(0.884 Ψ).',
      cite: 'Albuquerque, Scoffoni, Brodersen, Buckley, Sack & McElrone 2020, Journal of Experimental Botany 71: 7286', doi: '10.1093/jxb/eraa392',
      measured: 'Potted vines dried on the bench and naturally; gas exchange against leaf Ψ (pressure chamber), n = 102 for the Cabernet Sauvignon fit. Chardonnay: −0.53 and −1.17 MPa.', fig: 'Table 2; Fig. 6 legend (fit redrawn from the equation)', badge: 'MEASURED' },
    'l3.day.tlp': { claim: 'Cabernet Sauvignon turgor loss point −1.37 ± 0.05 MPa (n = 5); Chardonnay −1.49 ± 0.06 MPa.',
      cite: 'Albuquerque et al. 2020, Journal of Experimental Botany 71: 7286', doi: '10.1093/jxb/eraa392',
      measured: 'Pressure volume curves on leaves of the same vines. It equals the Lantana value of Scoffoni et al. 2012 by coincidence; both were checked against their tables.', fig: 'Table 2', badge: 'MEASURED' },
    'l3.day.midrib': { claim: 'Midrib embolism began near −1.25 MPa; embolism in the minor veins stayed rare even at very negative Ψ; Kleaf and gs had both lost about 80 % before embolism began.',
      cite: 'Albuquerque et al. 2020, Journal of Experimental Botany 71: 7286', doi: '10.1093/jxb/eraa392',
      measured: 'Synchrotron microCT of intact leaves (1.27 µm per voxel), with sigmoid fits to the imaged embolism.', fig: 'Abstract, Results, Fig. 5', badge: 'MEASURED' },
    'l3.day.hoch': { claim: 'Syrah petiole P50 −1.54 MPa and stem P50 −1.9 MPa: xylem pressures at which half the conductive xylem area was gas filled.',
      cite: 'Hochberg, Albuquerque, Rachmilevitch et al. 2016, Plant, Cell and Environment 39: 1886', doi: '10.1111/pce.12688',
      measured: 'One year old Syrah vines grafted on SO4 rootstock, in vivo MRI of petioles and stems; a separate microCT run on own rooted Syrah confirmed it. A different cultivar, organ, method and quantity from the Cabernet Sauvignon leaf values on the same line.', fig: 'Abstract and Results', badge: 'MEASURED' },
    'l3.day.margin': { claim: 'Gap between 80 % stomatal closure in Cabernet Sauvignon leaves (−1.21 MPa) and stem P50 in Syrah (−1.9 MPa): about 0.7 MPa.',
      cite: 'Albuquerque et al. 2020 (doi 10.1093/jxb/eraa392); Hochberg et al. 2016 (doi 10.1111/pce.12688)', doi: '10.1093/jxb/eraa392', doi2: '10.1111/pce.12688',
      measured: 'A difference between two measured values from two studies, two cultivars and two organs, so it is a teaching estimate of a stomatal safety margin, not a measured margin of one vine.', fig: 'Arithmetic', badge: 'DERIVED' },
    'l3.hero': { claim: 'Air seeding: a gas filled vessel next to a water filled one; once the sap tension beats the capillary seal of the widest pit membrane pore (ΔP = 4T ÷ D), air is pulled through and the second vessel embolises.',
      cite: 'Choat & Pittermann 2009, New Phytologist 182: 557; Brodersen et al. 2013, Plant Physiology 161: 1820', doi: '10.1111/j.1469-8137.2009.02847.x', doi2: '10.1104/pp.112.212712',
      measured: 'Commentary on pit structure and air seeding (Choat & Pittermann 2009); in vivo X ray CT of grapevine stems (Brodersen et al. 2013, the grapevine study the scene is drawn after) showing embolism spreading between connected vessels. The scene is a didactic reconstruction: pits and pores are enlarged, molecule numbers and speeds are drawn to a stated scale.', fig: 'Commentary text; abstract', badge: 'DERIVED' }
  };
  Object.keys(EV2).forEach(function (k) { if (!WP.evidence[k]) WP.evidence[k] = EV2[k]; });

  /* ---------- hero: DOM */
  function mountHero(el, before) {
    var st = document.createElement('style'); st.textContent = HCSS; el.appendChild(st);
    var wrap = document.createElement('div'); wrap.className = 'o3h-wrap';
    wrap.innerHTML =
      '<div class="o3h" role="img" aria-label="Didactic reconstruction: a water filled grapevine vessel beside an air filled neighbour, joined by bordered pits. Water molecules flow along the vessel; as the sap tension rises past the seal of the widest pit membrane pore, a bubble of air is pulled through the membrane and the vessel fills with gas.">' +
        '<canvas class="o3h-bg" aria-hidden="true"></canvas>' +
        '<div class="o3h-stage" aria-hidden="true" style="position:absolute;inset:0"></div>' +
        '<canvas class="o3h-fg" aria-hidden="true"></canvas>' +
        '<div class="o3h-tags" aria-hidden="true">' +
          '<span class="o3h-tag" data-t="a">water filled vessel</span><span class="o3h-tag" data-t="b">air filled neighbour</span>' +
          '<span class="o3h-tag" data-t="pit">pit membrane</span><span class="o3h-tag tier-2" data-t="bp">bordered pits</span>' +
          '<span class="o3h-tag tier-3" data-t="rim">end of one vessel element</span></div>' +
        '<div class="o3h-scrim"></div>' +
        '<div class="o3h-q"><b>How does air get into a sealed pipe?</b><span data-r="hans" aria-live="polite"></span></div>' +
        '<div class="o3h-cr">Didactic reconstruction · Brodersen et al. · Plant Physiology 2013 · DOI <a href="https://doi.org/10.1104/pp.112.212712" target="_blank" rel="noopener">10.1104/pp.112.212712</a></div>' +
      '</div>' +
      '<div class="o3h-ctlhost"></div>' +
      '<p class="o3h-ansm" data-r="hansm" aria-hidden="true"></p>' +
      '<div class="o3h-ui">' +
        '<div class="o3h-sl"><label for="o3h-psi">Sap pressure in the water filled vessel <output data-r="hpo"></output></label>' +
          '<input type="range" id="o3h-psi" min="-3" max="-0.1" step="0.02" value="-0.8"></div>' +
        '<div class="o3h-btns"><button type="button" class="chip" data-h="follow" aria-pressed="true">Follow my vine</button>' +
          '<button type="button" class="btn small" data-h="reset">Start again</button>' +
          '<button type="button" class="btn small" data-h="pause" aria-pressed="false">Pause</button><span data-r="hspd"></span></div>' +
      '</div>' +
      '<p class="o3h-read ev-host" data-r="hread"></p>' +
      '<p class="o3h-read tier-3">Scene scale: pits and pores enlarged about a hundred fold; molecules move at 0.35 drawing units per second per mmol m⁻² s⁻¹ of transpiration, faster at the centre of the vessel than at the wall (the parabolic profile of flow in a tube) ' + (ui.badge ? ui.badge('ILLUSTRATIVE', 'Drawing scale, not a measured velocity.') : '') + '. Grapevine vessels have simple perforation plates and pitted walls; the rim marks where two vessel elements meet.</p>';
    el.insertBefore(wrap, before);
    HERO.host = wrap;
    var hsp = wrap.querySelector('[data-r="hspd"]'); if (hsp && window.PlaySpeed) hsp.parentNode.replaceChild(window.PlaySpeed.chip('ps-light'), hsp); else if (hsp) hsp.remove();
    var sl = wrap.querySelector('#o3h-psi');
    sl.addEventListener('input', function () { HERO.psi = +sl.value; setFollow(false); heroState(); });
    wrap.addEventListener('click', function (e) {
      var b = e.target.closest('[data-h]'); if (!b) return;
      var k = b.getAttribute('data-h');
      if (k === 'follow') { setFollow(!HERO.follow); if (HERO.follow && WP.result) HERO.psi = WP.result.psi.petiole; heroState(); }
      else if (k === 'reset') { HERO.state = 'full'; HERO.front = 0; HERO.seedT = 0; if (HERO.follow) { /* keep */ } else if (-HERO.psi > seedThr()) { HERO.psi = Math.max(-0.4, -seedThr() + 0.4); } heroState(); }
      else if (k === 'pause') { HERO.paused = !HERO.paused; b.setAttribute('aria-pressed', HERO.paused ? 'true' : 'false'); b.textContent = HERO.paused ? 'Play' : 'Pause'; if (!HERO.paused) heroKick(); }
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { HERO.visible = en[0].isIntersecting; if (HERO.visible) { heroBuild(); heroKick(); } }, { threshold: 0.05 }).observe(wrap.querySelector('.o3h'));
    } else { HERO.visible = true; }
    window.addEventListener('resize', function () { if (HERO.built) { heroSize(); heroBg(); heroDraw(0); } });
    document.addEventListener('visibilitychange', function () { if (!document.hidden) heroKick(); });
    window.addEventListener('wp:tier', function () { if (HERO.built) heroDraw(0); });
    if (window.MolNames) window.MolNames.on(function () { if (HERO.built) heroDraw(0); });
  }
  function setFollow(on) { HERO.follow = on; var b = HERO.host && HERO.host.querySelector('[data-h="follow"]'); if (b) b.setAttribute('aria-pressed', on ? 'true' : 'false'); }
  function heroUpdate(st, res) {
    if (!HERO.host) return;
    HERO.E = res && res.E ? res.E : 3;
    if (HERO.follow && res && res.psi) HERO.psi = res.psi.petiole;
    heroState();
  }
  function heroState() {
    var h = HERO.host; if (!h) return;
    var thr = seedThr(), pull = -HERO.psi;
    if (HERO.state === 'full' && pull > thr) { HERO.state = 'seeding'; HERO.seedT = 0; HERO.front = 0; }
    if (!heroAnimated() && HERO.state === 'seeding') { HERO.state = 'emb'; HERO.front = 12; }
    var sl = h.querySelector('#o3h-psi'); sl.value = HERO.psi.toFixed(2);
    h.querySelector('[data-r="hpo"]').textContent = psi(HERO.psi);
    var ans = h.querySelector('[data-r="hans"]');
    ans.textContent = HERO.state === 'full'
      ? (pull > 0.8 * thr ? 'The sap is pulled hard; only the pit membrane, with pores far narrower than a micrometre, holds the air back.' : 'The neighbour is full of air. Between the two vessels, a pit membrane with tiny pores keeps it out. Raise the tension.')
      : (HERO.state === 'seeding' ? 'The tension beat the seal of the widest pore: air is pulled through the membrane.' : 'Air seeded: this vessel is now full of gas and carries no water. Its neighbours are next.');
    h.querySelector('[data-r="hansm"]').textContent = ans.textContent; // phones: the answer sits under the scene, the box keeps only the question
    h.querySelector('[data-r="hread"]').innerHTML = 'Widest pore D = <b>' + num(opts.D, 2) + ' µm</b> (set it in 3b below), so air enters once the tension passes 4T ÷ D = <b>' + num(thr, 2) + ' MPa</b> ' + (ui.badge ? ui.badge('DERIVED', 'Capillary equation, T = 0.0728 N m⁻¹ at 20 °C, contact angle 0.') : '') +
      '. Sap pressure now <b>' + psi(HERO.psi) + '</b>' + (HERO.follow ? ' (the petiole of the model vine)' : '') + '; flow drawn from transpiration ' + num(HERO.E, 2) + ' mmol m⁻² s⁻¹. ' +
      (HERO.state === 'full' ? 'The meniscus holds.' : 'Embolised. In an intact vine, refilling under tension was not seen by microCT (Charrier et al. 2016); press Start again to replay.') + ' ' + ev('l3.hero');
    if (!heroAnimated()) heroDraw(0);
    heroKick();
  }
  function heroAnimated() { return !HERO.paused; } // v19: reduced motion sets HERO.paused at the start; Play or a click on the view runs it
  function heroKick() {
    if (!HERO.built || !HERO.visible || !HERO.shown || document.hidden) return;
    if (!HERO.gl && !HERO.glPending) glStart(); // lazy build, and rebuild after a plate hide or a lost context
    if (HERO.raf) return;
    if (!heroAnimated()) { heroDraw(0); return; }
    HERO.last = 0;
    HERO.raf = requestAnimationFrame(heroFrame);
  }
  function heroFrame(t) {
    HERO.raf = 0;
    if (!HERO.visible || !HERO.shown || document.hidden || !heroAnimated()) { heroDraw(0); return; }
    var dt = HERO.last ? Math.min(0.08, (t - HERO.last) / 1000) : 0; dt *= (window.PlaySpeed ? window.PlaySpeed.get() : 1);
    if (HERO.last && t - HERO.last < HERO.minDt) { if (!HERO.raf) HERO.raf = requestAnimationFrame(heroFrame); return; } // about 30 fps is enough
    HERO.last = t;
    var t0 = performance.now();
    heroDraw(dt);
    heroGuard(performance.now() - t0);
    if (!HERO.raf) HERO.raf = requestAnimationFrame(heroFrame);
  }
  /* adaptive guard: a slow device first loses pixels, then frames; the scene never stops on its own (Pause does that) */
  function heroGuard(ms) {
    if (!HERO.gl || !HERO.gl.ready) return;
    HERO.cost = HERO.cost == null ? ms : HERO.cost * 0.9 + ms * 0.1;
    if (++HERO.nf < 30) return;
    HERO.nf = 0;
    if (HERO.cost > 40 && HERO.dprCap > 1) { HERO.dprCap = 1; heroSize(); }
    else if (HERO.cost > 90 && HERO.dprCap > 0.75) { HERO.dprCap = 0.75; HERO.minDt = 95; heroSize(); }
    HERO.host.setAttribute('data-cost', HERO.cost.toFixed(0) + ' ms, dpr ' + HERO.dprCap);
  }
  function heroStep(dt) {
    HERO.t += dt;
    if (HERO.state === 'seeding') { HERO.seedT += dt; if (HERO.seedT > 2.6) { HERO.state = 'emb'; HERO.front = 0.6; heroState(); } }
    else if (HERO.state === 'emb' && HERO.front < 12) HERO.front += dt * (1.2 + HERO.front * 0.6);
    var v0 = 0.35 * HERO.E, slow = HERO.state === 'emb' ? 0.15 : 1;
    HERO.flow = v0 * slow; // centre line speed, drawing units s⁻¹
    HERO.mol.forEach(function (m) { m.x += v0 * 2 * (1 - m.r * m.r) * slow * dt; if (m.x > 9) m.x -= 18; });
    HERO.vap.forEach(function (w) { w.x += w.s * dt; if (w.x > 9) w.x -= 18; });
  }
  function heroDraw(dt) {
    if (!HERO.built) return;
    if (!heroAnimated()) { // still frame: show the end state of any seeding
      if (HERO.state === 'seeding') { HERO.state = 'emb'; HERO.front = 12; }
      if (HERO.state === 'emb') HERO.front = 12;
    } else heroStep(dt);
    var gl = HERO.gl && HERO.gl.ready && !HERO.gl.dead ? HERO.gl : null;
    if (gl) { HERO.c2.style.display = 'none'; gl.renderer.domElement.style.display = ''; glDraw(); }
    else { if (HERO.gl) HERO.gl.renderer.domElement.style.display = 'none'; HERO.c2.style.display = ''; c2Draw(); if (HERO.nm) Object.keys(HERO.nm.pool).forEach(function (id) { HERO.nm.pool[id].hidden = true; }); }
    fgDraw();
  }

  /* ---------- hero: build */
  function heroBuild() {
    if (HERO.built || !HERO.host) return;
    HERO.built = true;
    var box = HERO.host.querySelector('.o3h'), stage = HERO.host.querySelector('.o3h-stage'); HERO.stage = stage;
    HERO.rm = HERO.paused = ui.reducedMotion() || HERO.paused; // v19: click the view to freeze; reduced motion starts paused
    if (window.WPFreeze) WPFreeze.attach(box, { paused: function () { return !!HERO.paused; }, button: HERO.host.querySelector('[data-h="pause"]'), keyEl: stage, chip: 'tc',
      ignore: function (e) { return !!(e.target.closest && e.target.closest('.o3h-q,.o3h-cr')); } });
    var c2 = document.createElement('canvas'); c2.style.cssText = 'position:absolute;inset:0;width:100%;height:100%'; stage.appendChild(c2); HERO.c2 = c2;
    HERO.bg = box.querySelector('.o3h-bg'); HERO.fg = box.querySelector('.o3h-fg');
    HERO.tags = {}; Array.prototype.forEach.call(box.querySelectorAll('.o3h-tag'), function (t) { HERO.tags[t.getAttribute('data-t')] = t; });
    /* water molecules ride nine streamlines (lanes) at the speed of their radius in a parabolic profile */
    HERO.mol = []; var R = rng(4242);
    HERO.lanes.forEach(function (ln, li) {
      for (var i = 0; i < 12; i++) HERO.mol.push({ x: -9 + 1.5 * i + 0.35 * (R() - 0.5) + 0.37 * li, r: ln[0], a: ln[1], lane: li, q: [R(), R(), R()], spin: 0.3 + 0.6 * R() });
    });
    HERO.vap = []; for (var j = 0; j < 22; j++) HERO.vap.push({ x: -9 + 18 * R(), r: Math.sqrt(R()) * 0.8, a: R() * Math.PI * 2, s: 0.05 + 0.1 * R() });
    HERO.bok = []; for (var k = 0; k < 9; k++) HERO.bok.push({ x: R(), y: R(), r: 0.05 + 0.09 * R(), h: R() });
    heroSize(); heroBg();
    ui.onPrefs(function () { var rmv = ui.reducedMotion(); if (rmv !== HERO.rm) { HERO.rm = rmv; HERO.paused = rmv; } heroBg(); if (HERO.gl) glTheme(); heroPauseBtn(); heroKick(); if (!heroAnimated()) heroDraw(0); });
    heroPauseBtn();
    heroDraw(0); // the 2D drawing shows at once; the 3D scene is built in idle time and replaces it when ready
    glStart();
  }
  function heroPauseBtn() { var b = HERO.host && HERO.host.querySelector('[data-h="pause"]'); if (b) { b.hidden = false; b.textContent = HERO.paused ? 'Play' : 'Pause'; b.setAttribute('aria-pressed', HERO.paused ? 'true' : 'false'); } }
  function idle3(f) { if (window.requestIdleCallback) requestIdleCallback(f, { timeout: 500 }); else setTimeout(f, 40); }
  function glStart() {
    if (HERO.gl || HERO.glPending || HERO.glFails > 2 || !HERO.stage || !threeOK3()) return;
    HERO.glPending = true;
    idle3(function () {
      var o = null;
      if (!HERO.shown) { HERO.glPending = false; return; }
      try { o = glBuild(HERO.stage); } catch (e) { o = null; HERO.host.setAttribute('data-glerr', String(e && e.message || e).slice(0, 200)); }
      if (!o) { HERO.glPending = false; HERO.glFails++; HERO.host.setAttribute('data-glfails', String(HERO.glFails)); return; }
      HERO.gl = o; o.renderer.domElement.style.display = 'none'; heroSize(); glTheme();
      idle3(function () { // compile the shaders in their own idle slot, then swap the 2D drawing for the 3D scene
        if (o.dead) { HERO.glPending = false; return; }
        try { o.renderer.compile(o.scene, o.camera); } catch (e) { /* first render compiles instead */ }
        o.ready = true; HERO.glPending = false;
        organOrbit();
        heroDraw(0); heroKick();
      });
    });
  }
  /* LOOK CLOSER (14 Oct, controls engineer journey): zoom, pan and tilt through the shared WP.macro.orbit (macro.js,
     loaded here if no other hero has loaded it). One controller for the life of the plate: the stage under the tags
     takes the pointer, wheel and keys; the toolbar sits under the scene. A rebuilt GL scene hands it its new camera.
     Chips: the hero pit (seen face on from the water filled side) and the air filled neighbour. */
  function organMacro(cb) {
    if (WP.macro && WP.macro.orbit) return cb();
    var s = document.querySelector('script[data-macro]') || document.querySelector('script[src$="macro.js"]');
    if (!s) { s = document.createElement('script'); s.src = OBASE + 'macro.js'; s.setAttribute('data-macro', '1'); document.body.appendChild(s); }
    s.addEventListener('load', function () { if (WP.macro && WP.macro.orbit) cb(); });
  }
  function organKick() {
    if (HERO.raf || HERO.oraf) return;
    HERO.oraf = requestAnimationFrame(function step() {
      // HERO.oraf stays set while drawing, so the organKick inside glDraw cannot start a second chain
      if (!HERO.gl || !HERO.gl.ready || HERO.raf) { HERO.oraf = 0; return; } // the animation loop draws on its own
      heroDraw(0);
      if ((HERO.ctl && HERO.ctl.moving()) || (HERO.hpK != null && Math.abs(HERO.hpK - (HERO.ctl && HERO.ctl.engaged ? 0 : 0.75)) > 0.002)) HERO.oraf = requestAnimationFrame(step);
      else HERO.oraf = 0;
    });
  }
  function organOrbit() {
    var o = HERO.gl; if (!o) return;
    if (HERO.octx) { HERO.octx.camera = o.camera; return; }
    organMacro(function () {
      if (HERO.octx || !HERO.gl) return;
      var box = HERO.host.querySelector('.o3h'), stage = HERO.stage, d = heroDims();
      stage.removeAttribute('aria-hidden'); stage.setAttribute('role', 'group');
      stage.setAttribute('aria-label', '3D view of the two vessels and the pit: drag to turn, wheel to zoom');
      var V = function (x, y, z) { return new HERO.gl.THREE.Vector3(x, y, z); };
      HERO.octx = { camera: HERO.gl.camera, wrap: box, w: d.w, h: d.h, narrow: d.w < 560, invalidate: organKick };
      HERO.ctl = WP.macro.orbit(HERO.octx, {
        surface: stage, shell: box, bar: HERO.host.querySelector('.o3h-ctlhost'),
        reduced: function () { return ui.reducedMotion(); }, minDist: 1.6, maxDist: 24,
        focus: [
          { id: 'pit', label: 'The pit', dist: 3.8, theta: 0.15, phi: 1.95, target: function () { return HERO.gl ? { obj: HERO.gl.hp, pos: V(0, 0, 0) } : [0, 0, 0]; } },
          { id: 'air', label: 'The air filled vessel', dist: 7.5, phi: 1.05, target: function () { var g = HERO.gl; return g ? { obj: g.root, pos: V(1.2, g.YB, g.ZB) } : [0, 0, 0]; } }
        ]
      });
      HERO.ctl.narrow(HERO.octx.narrow);
      organKick();
    });
  }
  /* release the WebGL context when the plate is hidden or the context is lost; rebuild lazily on the next view */
  function glDispose() {
    var o = HERO.gl; if (!o) return;
    o.dead = true; HERO.gl = null;
    if (HERO.octx) { HERO.octx.camera = null; if (HERO.ctl) HERO.ctl.reset(); }
    try {
      o.scene.traverse(function (ob) { if (ob.geometry) ob.geometry.dispose(); var mm = ob.material; if (mm) (Array.isArray(mm) ? mm : [mm]).forEach(function (m) { m.dispose(); }); });
      o.tex.forEach(function (t) { t.dispose(); }); if (o.env) o.env.dispose();
      o.renderer.dispose(); if (o.renderer.forceContextLoss) o.renderer.forceContextLoss();
    } catch (e) { /* already gone */ }
    var cv = o.renderer.domElement; if (cv.parentNode) cv.parentNode.removeChild(cv);
    if (HERO.c2) { HERO.c2.style.display = ''; }
  }
  function threeOK3() {
    if (!window.THREE || typeof window.THREE.WebGLRenderer !== 'function') return false;
    if (HERO.canGL != null) return HERO.canGL;
    try { // probe once and give the throwaway context back at once
      var c = document.createElement('canvas'), g = window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'));
      HERO.canGL = !!g;
      if (g) { var lx = g.getExtension('WEBGL_lose_context'); if (lx) lx.loseContext(); }
    } catch (e) { HERO.canGL = false; }
    return HERO.canGL;
  }
  function heroDims() { var b = HERO.host.querySelector('.o3h'); return { w: Math.max(200, b.clientWidth), h: Math.max(200, b.clientHeight) }; }
  function heroSize() {
    var d = heroDims(), dpr = Math.min(HERO.dprCap, window.devicePixelRatio || 1);
    [HERO.c2, HERO.fg].forEach(function (c) { c.width = Math.round(d.w * dpr); c.height = Math.round(d.h * dpr); });
    var bw = Math.round(d.w * 0.5), bh = Math.round(d.h * 0.5);
    if (HERO.bg.width !== bw || HERO.bg.height !== bh) { HERO.bg.width = bw; HERO.bg.height = bh; HERO.bgDirty = true; }
    HERO.dpr = dpr; HERO.portrait = d.h > d.w * 0.9;
    if (HERO.gl) { HERO.gl.renderer.setPixelRatio(dpr); HERO.gl.renderer.setSize(d.w, d.h, false); HERO.gl.camera.aspect = d.w / d.h; HERO.gl.camera.updateProjectionMatrix(); HERO.gl.root.rotation.z = HERO.portrait ? Math.PI / 2 : 0.05; HERO.gl.root.rotation.y = HERO.portrait ? -0.25 : -0.32; }
    if (HERO.bgDirty) { HERO.bgDirty = false; heroBg(); }
    if (HERO.octx) { HERO.octx.w = d.w; HERO.octx.h = d.h; HERO.octx.narrow = d.w < 560; if (HERO.ctl) HERO.ctl.narrow(HERO.octx.narrow); }
  }
  /* out of focus background: glassy parenchyma cells behind the vessels, blurred by CSS */
  function heroBg() {
    var c = HERO.bg; if (!c) return; var x = c.getContext('2d'), w = c.width, h = c.height, dark = ui.isDark();
    var g = x.createLinearGradient(0, 0, 0, h);
    if (dark) { g.addColorStop(0, '#06120f'); g.addColorStop(0.55, '#0d241c'); g.addColorStop(1, '#050b09'); }
    else { g.addColorStop(0, '#4f6a32'); g.addColorStop(0.5, '#86a04f'); g.addColorStop(1, '#3a5426'); }
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    var R = rng(77);
    for (var i = 0; i < 22; i++) {
      var cx = R() * w, cy = R() * h, rx = (0.08 + 0.1 * R()) * w, ry = rx * (0.6 + 0.3 * R());
      var gg = x.createRadialGradient(cx - rx * 0.3, cy - ry * 0.3, rx * 0.1, cx, cy, rx);
      gg.addColorStop(0, dark ? 'rgba(120,200,150,.20)' : 'rgba(230,240,170,.50)'); gg.addColorStop(0.8, dark ? 'rgba(40,90,60,.18)' : 'rgba(120,150,60,.32)'); gg.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = gg; x.beginPath(); x.ellipse(cx, cy, rx, ry, R() * 3, 0, Math.PI * 2); x.fill();
      for (var k = 0; k < 4; k++) { x.fillStyle = dark ? 'rgba(110,190,90,.30)' : 'rgba(70,120,30,.45)'; x.beginPath(); x.ellipse(cx + (R() - 0.5) * rx, cy + (R() - 0.5) * ry, rx * 0.12, rx * 0.07, R() * 3, 0, Math.PI * 2); x.fill(); }
    }
    var warm = x.createRadialGradient(w * 0.8, h * 0.08, 0, w * 0.8, h * 0.08, w * 0.6);
    warm.addColorStop(0, dark ? 'rgba(255,190,110,.18)' : 'rgba(255,224,160,.50)'); warm.addColorStop(1, 'rgba(255,224,160,0)');
    x.fillStyle = warm; x.fillRect(0, 0, w, h);
  }
  /* out of focus foreground: a few bokeh blobs and the blurred edge of a near cell wall, which drift with the camera */
  function fgDraw() {
    var c = HERO.fg, x = c.getContext('2d'), w = c.width, h = c.height, dark = ui.isDark(), t = HERO.t;
    x.clearRect(0, 0, w, h);
    HERO.bok.forEach(function (b, i) {
      var px = ((b.x + 0.012 * Math.sin(t * 0.07 + i)) % 1) * w, py = (b.y > 0.5 ? 0.82 + 0.16 * b.y : 0.02 + 0.12 * b.y) * h, r = b.r * Math.min(w, h);
      var g = x.createRadialGradient(px, py, 0, px, py, r);
      g.addColorStop(0, dark ? 'rgba(140,220,170,.22)' : 'rgba(225,240,190,.42)'); g.addColorStop(1, 'rgba(225,240,190,0)');
      x.fillStyle = g; x.beginPath(); x.arc(px, py, r, 0, Math.PI * 2); x.fill();
    });
    /* near wall: a soft glassy arc across one corner, so the sharp plane sits between two blurred layers */
    var sx = 0.012 * Math.sin(t * 0.05) * w, por = HERO.portrait;
    var gx = x.createRadialGradient(por ? w * 1.02 : -w * 0.06 + sx, por ? h * 0.02 : h * 1.08, 0, por ? w * 1.02 : -w * 0.06 + sx, por ? h * 0.02 : h * 1.08, Math.min(w, h) * 0.55);
    gx.addColorStop(0, 'rgba(0,0,0,0)'); gx.addColorStop(0.72, dark ? 'rgba(120,170,140,.10)' : 'rgba(240,236,200,.20)'); gx.addColorStop(0.86, dark ? 'rgba(170,220,190,.22)' : 'rgba(255,250,225,.42)'); gx.addColorStop(1, 'rgba(255,250,225,0)');
    x.fillStyle = gx; x.fillRect(0, 0, w, h);
  }

  /* ---------- hero: Three.js scene (r128)
     Composition: vessel A (water, blue) is cut open toward the camera, so we look at the inside of its back wall: the
     wall it shares with vessel B (air, dry and bright). The hero bordered pit sits on that wall, face on, sharp; the
     fibrous pit membrane is backlit by the gas behind it. Water moves on streamlines at the model rate. */
  function envMap3(renderer, THREE) { // copied from journey/macro.js (WP.macro.envMap, warm), so this file needs no other script
    try {
      var s = new THREE.Scene(), geo = new THREE.SphereGeometry(10, 24, 12), cols = [], P = geo.attributes.position, c = new THREE.Color();
      var top = new THREE.Color(0xfff1d6), mid = new THREE.Color(0x6f8f52), bot = new THREE.Color(0x22301a);
      for (var i = 0; i < P.count; i++) { var y = P.getY(i) / 10; if (y > 0) c.copy(mid).lerp(top, Math.pow(y, 0.8)); else c.copy(mid).lerp(bot, Math.pow(-y, 0.7)); cols.push(c.r, c.g, c.b); }
      geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
      s.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
      var pm = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
      var p1 = new THREE.Mesh(new THREE.PlaneGeometry(6, 3), pm); p1.position.set(-4, 6, 5); p1.lookAt(0, 0, 0); s.add(p1);
      var p2 = new THREE.Mesh(new THREE.PlaneGeometry(3, 5), new THREE.MeshBasicMaterial({ color: 0xbfe0ff, side: THREE.DoubleSide })); p2.position.set(7, 1, -5); p2.lookAt(0, 0, 0); s.add(p2);
      var pg = new THREE.PMREMGenerator(renderer), rt = pg.fromScene(s, 0.04);
      pg.dispose(); geo.dispose(); pm.dispose();
      return rt.texture;
    } catch (e) { return null; }
  }
  function glBuild(stage) {
    var THREE = window.THREE, renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' }); } catch (e) { return null; }
    if (!renderer || !renderer.getContext()) return null;
    renderer.setClearColor(0x000000, 0);
    if ('outputEncoding' in renderer) renderer.outputEncoding = THREE.sRGBEncoding;
    if (THREE.ACESFilmicToneMapping) { renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.95; }
    renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
    stage.appendChild(renderer.domElement);
    var scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x2f4a2a, 10.5, 21);
    var camera = new THREE.PerspectiveCamera(30, 16 / 8.4, 0.1, 60);
    var o = { renderer: renderer, scene: scene, camera: camera, THREE: THREE, tex: [] };
    /* M1: a lost context falls back to the 2D drawing (never a blank stage with floating tags), then rebuilds */
    renderer.domElement.addEventListener('webglcontextlost', function (e) {
      e.preventDefault(); if (o.dead) return;
      HERO.lostN = (HERO.lostN || 0) + 1; HERO.host.setAttribute('data-lost', String(HERO.lostN));
      glDispose(); heroDraw(0);
      if (HERO.lostN < 4) setTimeout(heroKick, 1200);
    }, false);
    o.env = envMap3(renderer, THREE); scene.environment = o.env;
    var key = new THREE.DirectionalLight(0xffd6a0, 1.35); key.position.set(4, 6, 7); scene.add(key);
    var rim = new THREE.DirectionalLight(0x8fbcff, 1.1); rim.position.set(-6, 3, -7); scene.add(rim);
    var hemi = new THREE.HemisphereLight(0xfff1dc, 0x1e3020, 0.45); scene.add(hemi);
    var gasL = new THREE.PointLight(0xdcecff, 1.1, 6); scene.add(gasL); o.gasL = gasL; // light inside the air filled vessel backlights the pit
    o.lights = { key: key, rim: rim, hemi: hemi };
    var root = new THREE.Group(); scene.add(root); o.root = root;
    /* B sits up and behind A along direction (0, sin β, −cos β); the shared wall faces the camera through A's cut */
    var R = 1, BETA = 0.55, DB = 2 * R + 0.14, YB = DB * Math.sin(BETA), ZB = -DB * Math.cos(BETA), aS = Math.PI - BETA; o.R = R; o.YB = YB; o.ZB = ZB; o.aS = aS;
    function canvasTex(n, paint, m) { var c = document.createElement('canvas'); c.width = n; c.height = m || n; paint(c.getContext('2d'), n, m || n); var t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; o.tex.push(t); return t; }
    /* bump: an uneven cellulose surface, so walls catch the light like wet glass */
    var bump = canvasTex(128, function (x, n) { var r2 = rng(9); x.fillStyle = '#808080'; x.fillRect(0, 0, n, n); for (var i = 0; i < 220; i++) { x.fillStyle = 'rgba(' + (r2() > 0.5 ? '255,255,255' : '0,0,0') + ',.10)'; x.beginPath(); x.ellipse(r2() * n, r2() * n, 3 + 6 * r2(), 2 + 3 * r2(), r2() * 3, 0, 7); x.fill(); } });
    bump.repeat.set(6, 2);
    /* pit membrane: a mesh of cellulose microfibrils with a few pores, one of them the widest */
    var fib = canvasTex(256, function (x, n) { var r2 = rng(31); var gg = x.createRadialGradient(n * 0.45, n * 0.4, 0, n / 2, n / 2, n / 2); gg.addColorStop(0, 'rgba(255,246,214,.97)'); gg.addColorStop(0.8, 'rgba(232,206,150,.95)'); gg.addColorStop(1, 'rgba(186,146,84,.95)'); x.fillStyle = gg; x.beginPath(); x.arc(n / 2, n / 2, n / 2 - 1, 0, 7); x.fill(); x.lineWidth = 1.6;
      for (var i = 0; i < 160; i++) { var a = r2() * 7, b = a + 1.2 + r2() * 2; x.strokeStyle = 'rgba(' + (110 + 50 * r2() | 0) + ',' + (80 + 30 * r2() | 0) + ',40,.55)'; x.beginPath(); x.moveTo(n / 2 + Math.cos(a) * n * 0.47, n / 2 + Math.sin(a) * n * 0.47); x.quadraticCurveTo(n * (0.3 + 0.4 * r2()), n * (0.3 + 0.4 * r2()), n / 2 + Math.cos(b) * n * 0.47, n / 2 + Math.sin(b) * n * 0.47); x.stroke(); }
      x.globalCompositeOperation = 'destination-out'; for (var j = 0; j < 40; j++) { x.beginPath(); x.arc(n * (0.2 + 0.6 * r2()), n * (0.2 + 0.6 * r2()), 1.2 + 2.6 * r2(), 0, 7); x.fill(); }
      x.beginPath(); x.arc(n * 0.62, n * 0.42, 9, 0, 7); x.fill(); }); // the widest pore (drawn enlarged)
    /* caustics: bright wavy filaments that slide along the water filled vessel at the flow speed */
    var cau = canvasTex(256, function (x, n, m) { var r2 = rng(5); x.fillStyle = '#000'; x.fillRect(0, 0, n, m); x.lineCap = 'round';
      for (var i = 0; i < 70; i++) { var y0 = r2() * m, x0 = r2() * n; x.strokeStyle = 'rgba(200,235,255,' + (0.18 + 0.4 * r2()).toFixed(2) + ')'; x.lineWidth = 1 + 2.5 * r2(); x.beginPath(); x.moveTo(x0, y0); x.bezierCurveTo(x0 + 30 * (r2() - 0.5), y0 + 20, x0 + 30 * (r2() - 0.5), y0 + 40, x0 + 20 * (r2() - 0.5), y0 + 60); x.stroke(); } }, 256);
    cau.repeat.set(2, 3);
    o.cau = cau;
    /* streamline dashes */
    var dash = canvasTex(8, function (x, n, m) { var g = x.createLinearGradient(0, 0, 0, m); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.75, 'rgba(255,255,255,.9)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, n, m); }, 64);
    var glowT = canvasTex(64, function (x, n) { var g = x.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2); g.addColorStop(0, 'rgba(255,240,200,1)'); g.addColorStop(0.4, 'rgba(255,220,160,.45)'); g.addColorStop(1, 'rgba(255,220,160,0)'); x.fillStyle = g; x.fillRect(0, 0, n, n); });
    function rimGlow(m, col, k) { // Fresnel rim: walls turn bright at grazing angles, so each tube reads as glass
      m.onBeforeCompile = function (sh) { sh.fragmentShader = sh.fragmentShader.replace('#include <output_fragment>', '#include <output_fragment>\n float frs = pow(1.0 - abs(dot(normalize(vViewPosition), normal)), 2.2);\n gl_FragColor.a = clamp(gl_FragColor.a + frs * ' + k.toFixed(2) + ', 0.0, 1.0);\n gl_FragColor.rgb += frs * vec3(' + col.join(',') + ');'); };
      m.customProgramCacheKey = function () { return 'o3rim' + col.join('') + k; };
      return m;
    }
    var wallM = rimGlow(new THREE.MeshPhysicalMaterial({ color: 0xeadfbd, roughness: 0.26, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.1, transparent: true, opacity: 0.32, side: THREE.DoubleSide, depthWrite: false, bumpMap: bump, bumpScale: 0.02, emissive: 0x3a2e14, emissiveIntensity: 0.18, envMapIntensity: 0.55 }), ['0.24', '0.21', '0.13'], 0.5);
    /* the air filled vessel: dry, pale grey walls with bright inner reflections */
    var wallBM = rimGlow(new THREE.MeshPhysicalMaterial({ color: 0xd4d8d6, roughness: 0.12, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.04, transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthWrite: false, bumpMap: bump, bumpScale: 0.012, envMapIntensity: 1.0 }), ['0.36', '0.40', '0.46'], 0.6);
    var pitM = new THREE.MeshPhysicalMaterial({ color: 0x8a5a26, roughness: 0.35, clearcoat: 0.8, clearcoatRoughness: 0.2, emissive: 0x2a1606, emissiveIntensity: 0.3 });
    var rimM = new THREE.MeshPhysicalMaterial({ color: 0xe6dcc2, roughness: 0.4, clearcoat: 0.6, emissive: 0x2c2618, emissiveIntensity: 0.2 });
    var sapM = new THREE.MeshPhysicalMaterial({ color: 0x1c6cd0, roughness: 0.08, clearcoat: 1, transparent: true, opacity: 0.6, depthWrite: false, side: THREE.BackSide, emissive: 0x4fa8ff, emissiveMap: cau, emissiveIntensity: 0.7, envMapIntensity: 0.6 });
    var gasM = new THREE.MeshPhysicalMaterial({ color: 0xf4f8ff, roughness: 0.03, clearcoat: 1, clearcoatRoughness: 0.02, transparent: true, opacity: 0.42, depthWrite: false, emissive: 0xd8e6f4, emissiveIntensity: 0.4, envMapIntensity: 1.8 });
    var airM = new THREE.MeshPhysicalMaterial({ color: 0xeef2f6, roughness: 0.02, clearcoat: 1, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.BackSide, envMapIntensity: 1.4, emissive: 0xc8d6e6, emissiveIntensity: 0.12 });
    var memM = new THREE.MeshPhysicalMaterial({ map: fib, transparent: true, alphaTest: 0.05, side: THREE.DoubleSide, roughness: 0.5, clearcoat: 0.6, emissive: 0xffe2a8, emissiveMap: fib, emissiveIntensity: 0.55 });
    var menM = new THREE.MeshPhysicalMaterial({ color: 0xd8f2ff, roughness: 0.02, clearcoat: 1, transparent: true, opacity: 0.85, emissive: 0x7fd0ff, emissiveIntensity: 0.6, envMapIntensity: 2 });
    var oM = new THREE.MeshPhysicalMaterial({ color: 0xc01e16, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.1 });
    var hM = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.3, clearcoat: 1, emissive: 0xffffff, emissiveIntensity: 0.25 });
    var vapM = new THREE.MeshBasicMaterial({ color: 0xdff0ff, transparent: true, opacity: 0.5, depthWrite: false });
    var streakM = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.38, depthWrite: false, blending: THREE.AdditiveBlending });
    o.mats = { wall: wallM, wallB: wallBM, pit: pitM, rim: rimM, sap: sapM, gas: gasM, air: airM, mem: memM, men: menM, o: oM, h: hM, vap: vapM, streak: streakM };
    function xCyl(r, len, seg, open, t0, tl) { var g = new THREE.CylinderGeometry(r, r, len, seg, 1, open, t0, tl); g.rotateZ(Math.PI / 2); return g; }
    var L = 22;
    /* vessel A (front, water filled): cut open toward the camera */
    root.add(new THREE.Mesh(xCyl(R, L, 48, true, 1.0, Math.PI * 2 - 2.0), wallM));
    var aSap = new THREE.Mesh(xCyl(R * 0.97, L, 36, true, 0.9, Math.PI * 2 - 1.8), sapM); root.add(aSap); o.aSap = aSap;
    /* the cut edges of the wall, a thin bright lip so the section reads as a cut */
    [1.0, -1.0].forEach(function (a) { var lip = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, L, 6, 1, true), rimM); lip.rotation.z = Math.PI / 2; lip.position.set(0, R * Math.sin(a), R * Math.cos(a)); root.add(lip); });
    /* vessel B (behind, air filled): closed tube with inner reflections */
    var bWall = new THREE.Mesh(xCyl(R, L, 44, true), wallBM); bWall.position.set(0, YB, ZB); root.add(bWall);
    var bAir = new THREE.Mesh(xCyl(R * 0.95, L, 30, true), airM); bAir.position.set(0, YB, ZB); root.add(bAir);
    [[0.62, 0.55], [0.35, -0.9]].forEach(function (q) { var sk = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, L * 0.8, 5, 1, true), streakM); sk.rotation.z = Math.PI / 2; sk.position.set(0, YB + q[0] * R * Math.sin(q[1] + 1.2), ZB + q[0] * R * Math.cos(q[1] + 1.2)); root.add(sk); });
    /* a third vessel far behind, softened by fog */
    var cWall = new THREE.Mesh(xCyl(R * 1.3, L, 28, true), wallM); cWall.position.set(0, -2.1, -5.2); root.add(cWall);
    /* simple perforation plate rims where two vessel elements meet (wall coloured, not pit coloured) */
    var rimG = new THREE.TorusGeometry(R * 0.97, 0.09, 8, 44, Math.PI * 2 - 2.0); rimG.rotateY(Math.PI / 2); rimG.rotateX(-Math.PI + 1.0);
    var rimA = new THREE.Mesh(rimG, rimM); rimA.position.x = 3.9; root.add(rimA); o.rimA = rimA;
    var rimB = new THREE.Mesh(new THREE.TorusGeometry(R * 0.96, 0.08, 8, 40).rotateY(Math.PI / 2), rimM); rimB.position.set(-3.2, YB, ZB); root.add(rimB);
    /* bordered pits: slit like apertures in rows on the shared wall, scattered elsewhere (instanced) */
    var pitG = new THREE.TorusGeometry(0.11, 0.026, 3, 10); pitG.scale(1.7, 0.75, 1);
    var pits = [], rp = rng(55);
    for (var i = 0; i < 84; i++) {
      var px = -8 + (i % 14) * 1.15 + (rp() - 0.5) * 0.15, row = Math.floor(i / 14) - 2.5;
      if (Math.abs(px) < 1.15 && Math.abs(row) < 1.6) continue;
      var a = aS + row * 0.2; pits.push([px, R * Math.sin(a), R * Math.cos(a), a]);
    }
    for (var j = 0; j < 40; j++) { var a2 = 1.1 + rp() * (Math.PI * 2 - 2.2); if (Math.abs(a2 - aS) < 0.6) continue; pits.push([-8 + 16 * rp(), R * Math.sin(a2), R * Math.cos(a2), a2]); }
    for (var k = 0; k < 44; k++) { var a3 = rp() * Math.PI * 2; pits.push([-8 + 16 * rp(), YB + R * Math.sin(a3), ZB + R * Math.cos(a3), a3]); }
    var pitIM = new THREE.InstancedMesh(pitG, pitM, pits.length), m4 = new THREE.Matrix4(), s1 = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3();
    pits.forEach(function (pp, n) { var qq = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -pp[3]); m4.compose(p.set(pp[0], pp[1], pp[2]), qq, s1); pitIM.setMatrixAt(n, m4); });
    root.add(pitIM);
    /* the hero pit pair, face on: two pit borders (overarching secondary wall) and the membrane between them; local +z points into B */
    var rMid = R * 0.9; // drawn just inside A's back wall, in front of the sap surface, so nothing tints it
    var hp = new THREE.Group(); hp.position.set(0, rMid * Math.sin(aS), rMid * Math.cos(aS)); hp.rotation.x = -aS; root.add(hp); o.hp = hp;
    var bordG = new THREE.TorusGeometry(0.7, 0.1, 12, 40); bordG.scale(1, 1, 0.55);
    var border = new THREE.Mesh(bordG, pitM); border.position.z = 0.09; hp.add(border);
    var border2 = new THREE.Mesh(bordG, pitM); border2.position.z = -0.09; hp.add(border2);
    var mem = new THREE.Mesh(new THREE.CircleGeometry(0.75, 40), memM); hp.add(mem); o.mem = mem;
    border.renderOrder = border2.renderOrder = mem.renderOrder = 4;
    var glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowT, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.5 })); glow.scale.set(2.8, 2.8, 1); glow.position.z = 0.12; hp.add(glow); o.glow = glow;
    /* the widest pore (fib texture at 0.62, 0.42 → local x 0.144, y 0.096) holds a meniscus that bows toward A as tension rises */
    var PX = 0.18, PY = 0.12; o.PX = PX; o.PY = PY;
    var poreRing = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.012, 6, 20), new THREE.MeshBasicMaterial({ color: 0xbfe9ff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })); poreRing.position.set(PX, PY, -0.012); hp.add(poreRing); o.poreRing = poreRing;
    var men = new THREE.Mesh(new THREE.SphereGeometry(0.043, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), menM); men.rotation.x = -Math.PI / 2; men.position.set(PX, PY, 0); hp.add(men); o.men = men;
    /* air: a bubble pulled through the pore, then a gas slug with menisci that grows along A */
    var bubM = rimGlow(new THREE.MeshPhysicalMaterial({ color: 0xeaf6ff, roughness: 0.02, clearcoat: 1, transparent: true, opacity: 0.55, depthWrite: false, emissive: 0xbfe4ff, emissiveIntensity: 0.45, envMapIntensity: 2.2 }), ['0.55', '0.65', '0.75'], 0.6);
    var bub = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), bubM); bub.visible = false; bub.renderOrder = 6; hp.add(bub); o.bub = bub; o.mats.bub = bubM;
    var slug = new THREE.Group(); slug.visible = false; root.add(slug); o.slug = slug;
    var slugC = new THREE.Mesh(xCyl(R * 0.93, 1, 30, true), gasM); slug.add(slugC); o.slugC = slugC;
    var capG = new THREE.SphereGeometry(R * 0.93, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    var capR = new THREE.Mesh(capG, menM); capR.rotation.z = -Math.PI / 2; slug.add(capR); o.capR = capR;
    var capL = new THREE.Mesh(capG, menM); capL.rotation.z = Math.PI / 2; slug.add(capL); o.capL = capL;
    /* streamlines: thin threads with dashes that slide at each lane's speed */
    o.lanes = HERO.lanes.map(function (ln) {
      var t = dash.clone(); t.needsUpdate = true; t.repeat.set(1, 7); o.tex.push(t);
      var m = new THREE.MeshBasicMaterial({ color: 0x9fe0ff, map: t, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending });
      var th = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 18, 5, 1, true), m); th.rotation.z = -Math.PI / 2;
      th.position.set(0, ln[0] * R * 0.9 * Math.sin(ln[1]), ln[0] * R * 0.9 * Math.cos(ln[1])); root.add(th);
      return { mesh: th, tex: t, v: 2 * (1 - ln[0] * ln[0]) };
    });
    /* water molecules: red O with two white H (instanced) */
    var N = HERO.mol.length;
    var oIM = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.08, 1), oM, N);
    var hIM = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.05, 0), hM, N * 2);
    oIM.instanceMatrix.setUsage(THREE.DynamicDrawUsage); hIM.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    root.add(oIM); root.add(hIM); o.oIM = oIM; o.hIM = hIM;
    /* v19: atoms in water's identity colours (molcolor.js): blue O, lighter blue H, following the theme */
    o.oM = oM; o.hM = hM; o.idCol = function () { if (!window.WPMolColor || !WPMolColor.atomInt) return; o.oM.color.setHex(WPMolColor.atomInt('h2o', 'O')); o.hM.color.setHex(WPMolColor.atomInt('h2o', 'H')); o.hM.emissive.setHex(WPMolColor.atomInt('h2o', 'H')); o.hM.emissiveIntensity = 0.12; };
    o.idCol();
    var vIM = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.03, 0), vapM, HERO.vap.length); vIM.instanceMatrix.setUsage(THREE.DynamicDrawUsage); root.add(vIM); o.vIM = vIM;
    o.tmp = { m: new THREE.Matrix4(), q: new THREE.Quaternion(), e: new THREE.Euler(), s: new THREE.Vector3(), p: new THREE.Vector3(), v: new THREE.Vector3(), h1: new THREE.Vector3(0.075, 0.058, 0), h2: new THREE.Vector3(-0.075, 0.058, 0) };
    var tri = 0; root.traverse(function (ob) { if (ob.isMesh && ob.geometry) { var g = ob.geometry, n2 = g.index ? g.index.count / 3 : g.attributes.position.count / 3; tri += n2 * (ob.isInstancedMesh ? ob.count : 1); } });
    o.triangles = Math.round(tri); HERO.host.setAttribute('data-tris', String(o.triangles));
    return o;
  }
  function glTheme() {
    var o = HERO.gl; if (!o) return; var dark = ui.isDark();
    o.scene.fog.color.setHex(dark ? 0x0b1d16 : 0x6f8a45);
    o.lights.key.intensity = dark ? 1.05 : 1.2; o.lights.rim.intensity = dark ? 1.45 : 0.95;
    o.mats.wall.opacity = dark ? 0.26 : 0.28; o.mats.gas.emissiveIntensity = dark ? 0.5 : 0.4; o.mats.sap.emissiveIntensity = dark ? 0.85 : 0.6;
    o.renderer.toneMappingExposure = dark ? 1.1 : 0.88;
  }
  function glDraw() {
    var o = HERO.gl, T = o.tmp, t = HERO.t, R = o.R;
    var cam = o.camera, por = HERO.portrait;
    /* slow orbit and dolly toward the hero pit */
    var ang = 0.13 * Math.sin(t * 0.05), dist = (por ? 13.4 : 13.2) - 0.7 * (0.5 + 0.5 * Math.sin(t * 0.037));
    cam.position.set(Math.sin(ang) * dist + (por ? -0.4 : 0.1), (por ? 0.1 : 1.05) + 0.12 * Math.sin(t * 0.043), Math.cos(ang) * dist);
    cam.lookAt(por ? -0.55 : 0.6, por ? -1.5 : 0.15, -0.7);
    /* LOOK CLOSER (14 Oct, controls engineer journey): the user's zoom, pan and tilt replace the slow orbit above
       while engaged (WP.macro.orbit); the fog moves with the user's distance so a close look stays clear */
    var ctl = HERO.ctl, eng = ctl ? ctl.apply() : false, fs = ctl && eng ? (ctl.fogShift || 0) : 0;
    o.scene.fog.near = Math.max(0.5, 10.5 + fs); o.scene.fog.far = Math.max(4, 21 + fs);
    T.v.set(0, o.YB, o.ZB); o.gasL.position.copy(o.root.localToWorld(T.v));
    /* air state */
    var st = HERO.state, front = st === 'emb' ? HERO.front : 0;
    var seedK = st === 'seeding' ? Math.min(1, HERO.seedT / 2.6) : (st === 'emb' ? 1 : 0);
    var pull = -HERO.psi, thr = seedThr(), k = Math.min(1, pull / thr);
    /* the hero pit turns most of the way toward the camera (a didactic cheat of about 20°) so the membrane reads face on */
    if (!o.hpQ) { o.hpQ = o.hp.quaternion.clone(); o.hpT = new o.THREE.Object3D(); o.hp.parent.add(o.hpT); o.hpT.position.copy(o.hp.position); }
    T.v.copy(cam.position); o.root.worldToLocal(T.v); o.hpT.lookAt(o.root.localToWorld(T.v.clone())); o.hpT.rotateY(Math.PI);
    /* while the user explores, the pit eases back to its true angle (the face on cheat would follow their camera) */
    var hpK = ctl && ctl.engaged ? 0 : 0.75; HERO.hpK = HERO.hpK == null || ui.reducedMotion() ? hpK : HERO.hpK + (hpK - HERO.hpK) * 0.12;
    if (Math.abs(HERO.hpK - hpK) > 0.002 && ctl) organKick();
    o.hp.quaternion.copy(o.hpQ).slerp(o.hpT.quaternion, HERO.hpK);
    o.mem.position.z = -0.07 * k; // the membrane bows toward the tense sap (A)
    o.men.visible = st === 'full';
    o.men.scale.set(1, 1, 0.15 + 1.1 * k); // meniscus deepens into the pore as the tension approaches the seal
    o.men.position.z = -0.07 * k;
    o.poreRing.material.opacity = st === 'full' ? 0.45 + 0.5 * k * (0.75 + 0.25 * Math.sin(t * 5)) : 0.9;
    o.glow.material.opacity = 0.35 + 0.35 * k;
    o.bub.visible = st === 'seeding';
    if (st === 'seeding') { var br = 0.05 + 0.85 * seedK; o.bub.scale.set(br, br, br); o.bub.position.set(o.PX, o.PY * (1 - seedK), -0.05 - br * 0.9); }
    o.slug.visible = st === 'emb';
    if (st === 'emb') { var f = Math.max(0.01, front); o.slugC.scale.x = 2 * f; o.capR.position.x = f; o.capL.position.x = -f; }
    /* caustics and streamline dashes slide at the flow speed (one unit of texture per drawing unit) */
    var fl = HERO.flow == null ? 0.35 * HERO.E : HERO.flow;
    o.cau.offset.y = ((t * fl * 3 / 22) % 1);
    o.lanes.forEach(function (ln) { ln.tex.offset.y = -((t * fl * ln.v * 7 / 18) % 1); ln.mesh.material.opacity = st === 'emb' ? 0.12 : 0.5; });
    /* molecules: on their streamlines, hidden inside the gas */
    var N = HERO.mol.length;
    for (var i = 0; i < N; i++) {
      var m = HERO.mol[i];
      var inGas = st === 'emb' && Math.abs(m.x) < front + 0.05;
      var y = m.r * R * 0.9 * Math.sin(m.a), z = m.r * R * 0.9 * Math.cos(m.a);
      T.e.set(m.q[0] * 6 + t * m.spin, m.q[1] * 6 + t * 0.6 * m.spin, m.q[2] * 6); T.q.setFromEuler(T.e);
      T.s.setScalar(inGas ? 0.0001 : 1);
      T.p.set(m.x, y, z); T.m.compose(T.p, T.q, T.s); o.oIM.setMatrixAt(i, T.m);
      T.v.copy(T.h1).applyQuaternion(T.q).add(T.p); T.m.compose(T.v, T.q, T.s); o.hIM.setMatrixAt(2 * i, T.m);
      T.v.copy(T.h2).applyQuaternion(T.q).add(T.p); T.m.compose(T.v, T.q, T.s); o.hIM.setMatrixAt(2 * i + 1, T.m);
    }
    o.oIM.instanceMatrix.needsUpdate = true; o.hIM.instanceMatrix.needsUpdate = true;
    if (o.idCol) o.idCol();
    for (var j = 0; j < HERO.vap.length; j++) { var w = HERO.vap[j]; T.q.identity(); T.s.setScalar(1); T.p.set(w.x, o.YB + w.r * 0.85 * Math.sin(w.a + t * 0.1), o.ZB + w.r * 0.85 * Math.cos(w.a + t * 0.1)); T.m.compose(T.p, T.q, T.s); o.vIM.setMatrixAt(j, T.m); }
    o.vIM.instanceMatrix.needsUpdate = true;
    o.renderer.render(o.scene, cam);
    /* tags follow projected anchors; at most 3 at 1200 and 2 on a phone at tier 1 (Q-visual M4) */
    var d = heroDims(), narrow = d.w < 560, t1 = ui.tier && ui.tier() < 2;
    function tag(k2, x, y, z, hide) {
      var el = HERO.tags[k2]; if (!el) return;
      T.v.set(x, y, z); o.root.localToWorld(T.v); T.v.project(cam);
      var sx = (T.v.x * 0.5 + 0.5) * d.w, sy = (-T.v.y * 0.5 + 0.5) * d.h;
      el.hidden = !!hide || T.v.z > 1 || sx < 50 || sx > d.w - 50 || sy < 24 || sy > d.h * (por ? 0.6 : 0.7);
      el.style.left = sx.toFixed(0) + 'px'; el.style.top = sy.toFixed(0) + 'px';
    }
    tag('a', por ? -1.5 : -2.3, -R * 0.55, R * 0.62);
    tag('b', por ? 2.6 : 3.4, o.YB + R * 0.98, o.ZB + 0.1, narrow && t1);
    var pm = R * 0.9, ps = Math.sin(o.aS), pc = Math.cos(o.aS);
    tag('pit', 0.2, pm * ps + 0.82, pm * pc + 0.3);
    tag('bp', -4.6, R * Math.sin(o.aS + 0.2), R * Math.cos(o.aS + 0.2), narrow);
    tag('rim', 3.9, R * 0.62, R * 0.7, narrow);
    HERO.tags.a.textContent = st === 'emb' ? 'now air filled' : 'water filled vessel';
    heroNames(o, cam, d, st, front);
  }
  /* 13 Oct (slow and named): molecule names in the hero as small pills under the molecule (ANTI CLUTTER RULE): H₂O on
     2 flowing molecules (1 on phones), "air" under the seeding bubble or on the gas slug (the faint vapour specks in the
     air filled neighbour stay unnamed: they sit behind the pit and a name there read as a label of the membrane). Stable choice; a name shows only where it overlaps no label tag,
     the question box, the credit or another name (it waits hidden rather than jump). MolNames off: none. */
  function heroNames(o, cam, d, st, front) {
    var lay = HERO.host.querySelector('.o3h-tags'); if (!lay) return;
    var NMx = HERO.nm || (HERO.nm = { pool: {}, prev: {}, miss: new Map(), blk: [], blkT: -1e9 });
    var on = !window.MolNames || window.MolNames.get(), narrow = d.w < 560, fs = narrow ? 9.5 : 10.5, T = o.tmp, R = o.R;
    var used = {};
    if (on) {
      var now = performance.now(), box = HERO.host.querySelector('.o3h').getBoundingClientRect();
      if (now - NMx.blkT > 300) {
        NMx.blkT = now; NMx.blk = [];
        Array.prototype.forEach.call(HERO.host.querySelectorAll('.o3h-tag:not([hidden]),.o3h-q,.o3h-cr'), function (e) { var r = e.getBoundingClientRect(); if (r.width > 0 && getComputedStyle(e).display !== 'none') NMx.blk.push({ x: r.left - box.left - 3, y: r.top - box.top - 3, w: r.width + 6, h: r.height + 6 }); });
      }
      var placed = NMx.blk.slice(), tv = Math.tan(cam.fov * Math.PI / 360);
      var proj = function (x, y, z, r) {
        T.v.set(x, y, z); o.root.localToWorld(T.v); var dist = cam.position.distanceTo(T.v); T.v.project(cam);
        return { x: (T.v.x * 0.5 + 0.5) * d.w, y: (-T.v.y * 0.5 + 0.5) * d.h, rp: r * d.h / (2 * dist * tv), front: T.v.z < 1 };
      };
      var hit = function (a, b) { return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h; };
      var by = { w: [], air: [] };
      HERO.mol.forEach(function (m) {
        if (m.x < -6.5 || m.x > 6.5 || (st === 'emb' && Math.abs(m.x) < front + 0.3)) return;
        var p = proj(m.x, m.r * R * 0.9 * Math.sin(m.a), m.r * R * 0.9 * Math.cos(m.a), 0.1); p.key = m; p.t = 'H₂O';
        if (p.x < 24 || p.x > d.w - 24 || p.y < 24 || p.y > d.h - 24) return; // only molecules in view (a name that left the frame is released)
        p.pri = HERO.portrait ? p.y : -p.x; // prefer molecules upstream, so a name stays on screen for a while
        by.w.push(p);
      });
      if (st === 'seeding' && o.bub.visible) { T.v.set(0, 0, 0); o.bub.localToWorld(T.v); o.root.worldToLocal(T.v); var pb = proj(T.v.x, T.v.y, T.v.z, Math.max(0.05, o.bub.scale.x)); pb.key = 'bub'; pb.t = 'air'; by.air.push(pb); }
      if (st === 'emb') { var pg = proj(Math.min(2.5, front * 0.5), -R * 0.45, R * 0.35, 0.05); pg.key = 'slug'; pg.t = 'air'; by.air.push(pg); }
      var next = {};
      ['air', 'w'].forEach(function (k) {
        var L = by[k], q = k === 'w' ? (narrow ? 1 : 2) : 1, chosen = [], old = NMx.prev[k] || [];
        L.sort(function (a, b) { return (b.pri || 0) - (a.pri || 0); });
        L.forEach(function (p) { var wv = p.t.length * fs * 0.6 + 14; p.box = { x: p.x - wv / 2 - 2, y: p.y + p.rp + 2, w: wv + 4, h: fs + 10 }; });
        var fits = function (p) { var b = p.box; if (!p.front || b.x < 6 || b.y < 6 || b.x + b.w > d.w - 6 || b.y + b.h > d.h - 6) return false; for (var i = 0; i < placed.length; i++) if (hit(b, placed[i])) return false; return true; };
        L.forEach(function (p) { if (chosen.length < q && old.indexOf(p.key) >= 0 && (NMx.miss.get(p.key) || 0) < 60) chosen.push(p); });
        L.forEach(function (p) {
          if (chosen.length >= q || chosen.indexOf(p) >= 0) return;
          for (var i = 0; i < chosen.length; i++) if (Math.hypot(chosen[i].x - p.x, chosen[i].y - p.y) < (narrow ? 60 : 90)) return;
          if (fits(p)) chosen.push(p);
        });
        next[k] = chosen.map(function (p) { return p.key; });
        chosen.forEach(function (p, i) {
          if (!fits(p)) { NMx.miss.set(p.key, (NMx.miss.get(p.key) || 0) + 1); return; }
          NMx.miss.delete(p.key); placed.push(p.box);
          var id = k + i, el = NMx.pool[id];
          if (!el) { el = NMx.pool[id] = document.createElement('span'); el.className = 'o3h-nm'; lay.appendChild(el); }
          if (el.textContent !== p.t) el.textContent = p.t;
          el.style.left = p.x.toFixed(0) + 'px'; el.style.top = (p.y + p.rp + 2).toFixed(0) + 'px'; el.hidden = false; used[id] = 1;
        });
      });
      NMx.prev = next;
      if (NMx.miss.size > 200) NMx.miss.clear();
    } else NMx.prev = {};
    Object.keys(NMx.pool).forEach(function (id) { if (!used[id]) NMx.pool[id].hidden = true; });
  }

  /* ---------- hero: 2D canvas (fallback and reduced motion) */
  function c2Draw() {
    var c = HERO.c2, x = c.getContext('2d'), w = c.width, h = c.height, dpr = HERO.dpr || 1, dark = ui.isDark(), t = HERO.t;
    x.clearRect(0, 0, w, h);
    var por = HERO.portrait;
    x.save();
    if (por) { x.translate(w, 0); x.rotate(Math.PI / 2); var tmp = w; w = h; h = tmp; }
    var cy = h * 0.40, R = Math.min(h * 0.17, w * 0.12), yB = cy - 2.1 * R, x0 = -10, x1 = w + 10;
    function tube(yc, fill, op) {
      var g = x.createLinearGradient(0, yc - R, 0, yc + R);
      g.addColorStop(0, 'rgba(250,240,210,' + (0.55 * op) + ')'); g.addColorStop(0.18, fill); g.addColorStop(0.82, fill); g.addColorStop(1, 'rgba(120,96,50,' + (0.6 * op) + ')');
      x.fillStyle = g; x.fillRect(x0, yc - R, x1 - x0, 2 * R);
      x.strokeStyle = 'rgba(200,170,110,.9)'; x.lineWidth = 2.2 * dpr; x.beginPath(); x.moveTo(x0, yc - R); x.lineTo(x1, yc - R); x.moveTo(x0, yc + R); x.lineTo(x1, yc + R); x.stroke();
      x.strokeStyle = 'rgba(255,255,255,.55)'; x.lineWidth = 1.2 * dpr; x.beginPath(); x.moveTo(x0, yc - R * 0.78); x.lineTo(x1, yc - R * 0.78); x.stroke();
    }
    tube(yB, dark ? 'rgba(170,205,235,.30)' : 'rgba(225,238,250,.55)', 1);
    var st = HERO.state, front = st === 'emb' ? HERO.front : (st === 'seeding' ? 0 : 0);
    tube(cy, dark ? 'rgba(60,120,200,.35)' : 'rgba(70,140,215,.40)', 1);
    /* pits on the shared wall */
    var yW = cy - R - 0.05 * R;
    for (var i = 0; i < 18; i++) { var px = (i + 0.5) / 18 * w; if (Math.abs(px - w / 2) < R * 0.6) continue; x.strokeStyle = 'rgba(176,132,62,.9)'; x.lineWidth = 2 * dpr; x.beginPath(); x.ellipse(px, yW, R * 0.14, R * 0.05, 0, 0, Math.PI * 2); x.stroke(); x.strokeStyle = 'rgba(255,240,200,.6)'; x.lineWidth = 0.8 * dpr; x.beginPath(); x.ellipse(px, yW - 1.5 * dpr, R * 0.14, R * 0.05, 0, Math.PI, Math.PI * 2); x.stroke(); }
    var gl2 = x.createRadialGradient(w / 2, yW, 0, w / 2, yW, R * 1.1); gl2.addColorStop(0, 'rgba(255,230,170,.55)'); gl2.addColorStop(1, 'rgba(255,230,170,0)'); x.fillStyle = gl2; x.fillRect(w / 2 - R * 1.2, yW - R * 1.2, R * 2.4, R * 2.4);
    /* hero pit with membrane */
    var hx = w / 2;
    x.fillStyle = 'rgba(236,224,190,.95)'; x.beginPath(); x.ellipse(hx, yW, R * 0.36, R * 0.11, 0, 0, Math.PI * 2); x.fill();
    x.strokeStyle = 'rgba(150,110,50,1)'; x.lineWidth = 2.4 * dpr; x.stroke();
    /* gas in A */
    var unit = w / 18;
    if (st === 'seeding' || (st === 'emb')) {
      x.fillStyle = dark ? 'rgba(200,225,250,.55)' : 'rgba(240,248,255,.85)';
      if (st === 'seeding') { var br = R * (0.1 + 0.7 * Math.min(1, HERO.seedT / 2.6)); x.beginPath(); x.arc(hx, yW + br, br, 0, Math.PI * 2); x.fill(); }
      else { var fx = Math.min(w, front * unit); x.beginPath(); x.ellipse(hx, cy, Math.max(R * 0.9, fx), R * 0.92, 0, 0, Math.PI * 2); x.fill(); }
    }
    /* molecules */
    HERO.mol.forEach(function (m, mi) {
      if (mi % 3 === 2) return;
      var xx = ((m.x + 9) % 18 + 18) % 18 * unit;
      var yy = cy + m.r * R * 0.85 * Math.sin(m.a);
      if (st === 'emb' && Math.abs(xx - hx) < front * unit) return;
      var s = R * 0.055;
      x.fillStyle = '#d8342a'; x.beginPath(); x.arc(xx, yy, s, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#ffffff'; x.beginPath(); x.arc(xx + s * 0.9, yy - s * 0.7, s * 0.6, 0, Math.PI * 2); x.arc(xx - s * 0.9, yy - s * 0.7, s * 0.6, 0, Math.PI * 2); x.fill();
    });
    x.restore();
    /* tags at fixed spots in the 2D view */
    var d = heroDims();
    function put(k, fx, fy, hide) { var el = HERO.tags[k]; if (!el) return; el.hidden = !!hide; el.style.left = (fx * d.w).toFixed(0) + 'px'; el.style.top = (fy * d.h).toFixed(0) + 'px'; }
    var t1 = ui.tier && ui.tier() < 2;
    if (por) { put('a', 1 - cy / h, 0.30); put('b', 1 - yB / h, 0.70, t1); put('pit', 1 - (yW - R * 0.2) / h, 0.47); put('bp', 0, 0, true); put('rim', 0, 0, true); }
    else { put('a', 0.2, 0.40 + 0.17 * 0.6); put('b', 0.78, 0.40 - 2.1 * 0.17); put('pit', 0.5, 0.40 - 0.17 * 0.6); put('bp', 0.3, 0.40 - 0.17 * 1.1, d.w < 560); put('rim', 0, 0, true); }
    HERO.tags.a.textContent = st === 'emb' ? 'now air filled' : 'water filled vessel';
  }

  /* ---------- B. One leaf's day (3e) */
  var DAY = { psi: -0.05, playing: false, raf: 0, hold: 0, host: null, last: 0 };
  var DTH = [
    { k: 'k50', v: -0.30, col: '#0072B2', short: 'Kleaf halved', lab: 'Leaf hydraulic conductance has lost half', c: 'Kleaf P50, Cabernet Sauvignon', ev: 'lh.grape', t: 1 },
    { k: 'g50', v: -0.60, col: '#D55E00', short: 'stomata half closed', lab: 'Stomata half closed', c: 'gs P50, Cabernet Sauvignon', ev: 'l3.day.gs', t: 1 },
    { k: 'k80', v: -0.71, col: '#0072B2', short: 'Kleaf −80 %', lab: 'Leaf hydraulic conductance down 80 %', c: 'Kleaf P80, Cabernet Sauvignon', ev: 'lh.grape', t: 2 },
    { k: 'g80', v: -1.21, col: '#D55E00', short: 'stomata 80 % closed', lab: 'Stomata 80 % closed', c: 'gs P80, Cabernet Sauvignon', ev: 'l3.day.gs', t: 2 },
    { k: 'mid', v: -1.25, col: '#3d3a36', short: 'first midrib embolism', lab: 'First gas filled conduits in the midrib (about)', c: 'microCT, Cabernet Sauvignon', ev: 'l3.day.midrib', t: 1 },
    { k: 'tlp', v: -1.37, col: '#009E73', short: 'turgor lost', lab: 'Turgor loss point: the leaf wilts', c: 'pressure volume curves, Cabernet Sauvignon', ev: 'l3.day.tlp', t: 1 },
    { k: 'pet', v: -1.54, col: '#CC79A7', short: 'petiole P50', lab: 'Petiole xylem P50, another cultivar', c: 'Syrah, MRI, xylem pressure', ev: 'l3.day.hoch', t: 1, xy: true },
    { k: 'stm', v: -1.90, col: '#CC79A7', short: 'stem P50', lab: 'Stem xylem P50, another cultivar', c: 'Syrah, MRI, xylem pressure', ev: 'l3.day.hoch', t: 1, xy: true }
  ];
  var DMIN = -2.2;
  function gsRel(p) { var g0 = -0.061 + 0.334; return Math.max(0, (-0.061 + 0.334 * Math.exp(0.884 * p)) / g0); }
  function kRel(p) { return (0.071 + 14.453 * Math.exp(2.302 * p)) / 14.524; }
  function mountDay(el) {
    var sec = document.createElement('section'); sec.className = 'o3d'; sec.setAttribute('aria-labelledby', 'o3d-h');
    var cred = 'Midrib images: Albuquerque Lab, synchrotron microCT of intact leaves, August 2015, 1.27 µm per voxel (data of Albuquerque et al. 2020, J Exp Bot 71: 7286, doi 10.1093/jxb/eraa392)';
    sec.innerHTML = '<h3 class="o3-sec" id="o3d-h"><span class="no">3e</span>One leaf’s day</h3>' +
      '<div class="o3d-q">When does a grapevine leaf shut down, and when do its pipes break?<small>One Cabernet Sauvignon leaf, one water potential line, from dawn into drought.</small></div>' +
      LH_check('Before you slide: which comes first as this leaf dries, stomata half closed or the first air filled pipe in its midrib?',
        'The stomata, by far. They are half closed at ' + MINUS + '0.60 MPa and 80 % closed at ' + MINUS + '1.21 MPa; the first midrib conduits fill with gas only near ' + MINUS + '1.25 MPa. Leaf hydraulic conductance has already halved at ' + MINUS + '0.30 MPa while the veins are still full of water; the 2020 study concluded that this early loss lies outside the xylem (Water IV).') +
      '<div class="o3d-grid">' +
        '<div class="o3d-leaf"><svg data-r="dleaf" viewBox="0 0 560 400" role="img" aria-label="A grapevine leaf on its petiole, with an inset of three stomata on the lower surface"></svg></div>' +
        '<div><figure class="o3d-ct"><img data-r="dimg" alt="" width="1005" height="1005" loading="lazy"><span class="o3d-cttag">midrib, microCT</span><figcaption data-r="dcap"></figcaption></figure>' +
          '<div class="o3d-tiles" data-r="dtiles"></div></div>' +
      '</div>' +
      '<div class="o3d-ctl"><label for="o3d-psi">Leaf water potential <output data-r="dpo"></output></label>' +
        '<input type="range" id="o3d-psi" min="' + DMIN + '" max="-0.05" step="0.01" value="-0.05">' +
        '<div class="o3d-ends" aria-hidden="true"><span>dawn, well watered</span><span>deep drought</span></div>' +
        '<div class="o3h-btns"><button type="button" class="btn small" data-d="play" aria-pressed="false">Play the day</button><span data-r="dspd"></span><button type="button" class="btn small" data-d="next">Next threshold</button><button type="button" class="btn small" data-d="dawn">Back to dawn</button></div></div>' +
      '<div class="o3d-axis"><svg data-r="daxis" viewBox="0 0 760 120" role="img" aria-label="Leaf water potential line from 0 to minus 2.2 MPa with numbered thresholds"></svg></div>' +
      '<ol class="o3d-list ev-host" data-r="dlist"></ol>' +
      '<div class="o3d-msg ev-host" data-r="dmsg"></div>' +
      '<p class="o3-cap tier-2">Leaf hydraulic conductance and stomatal conductance follow the published Cabernet Sauvignon fits, K<sub>leaf</sub> = 0.071 + 14.453 e<sup>2.302 Ψ</sup> and g<sub>s</sub> = ' + MINUS + '0.061 + 0.334 e<sup>0.884 Ψ</sup> ' + (ui.badge ? ui.badge('MEASURED') : '') + ', shown as a share of their value at 0 MPa. The wilting, the stomatal drawing and the colour of the leaf are drawn for this exhibit. Thresholds 7 and 8 are xylem pressures in Syrah petioles and stems measured by MRI, a different cultivar, organ and method: they sit on the same number line only for comparison, and in a living vine the stem stays wetter than the leaf, so it reaches them later than the leaf would. ' + ev('l3.day.hoch') + '</p>' +
      '<div class="tier-3"><p class="o3-cap">Timing nuance: midrib embolism began at about ' + MINUS + '1.25 to ' + MINUS + '1.3 MPa (five embolised midrib conduits at ' + MINUS + '1.35 MPa in Cabernet Sauvignon), close to the turgor loss point (' + MINUS + '1.37 MPa); the Results describe it as occurring after turgor loss. The microCT plants were read as stem water potential (a bagged leaf, pressure chamber; Fig. 2 legend and Methods), while the K<sub>leaf</sub> and g<sub>s</sub> curves use the water potential of the measured leaf. ' + ev('l3.day.midrib') + '</p><div class="o3-tw"><table class="o3-t"><thead><tr><th>#</th><th>Threshold</th><th>Ψ (MPa)</th><th>Quantity</th><th>Source</th></tr></thead><tbody>' +
        DTH.map(function (d, i) { return '<tr><td>' + (i + 1) + '</td><td>' + esc(d.lab) + '</td><td>' + psiS(d.v) + '</td><td>' + esc(d.c) + '</td><td>' + (d.xy ? 'Hochberg et al. 2016, Plant Cell Environ 39: 1886, doi 10.1111/pce.12688' : 'Albuquerque et al. 2020, J Exp Bot 71: 7286, doi 10.1093/jxb/eraa392') + '</td></tr>'; }).join('') +
      '</tbody></table></div><p class="o3-cap">Stomatal safety margin, as a teaching estimate: 80 % closure (' + MINUS + '1.21 MPa) minus stem P50 (' + MINUS + '1.9 MPa) = 0.69 MPa ' + (ui.badge ? ui.badge('DERIVED', 'Difference of two measured values from two studies and two cultivars.') : '') + ' ' + ev('l3.day.margin') + '. Measuring it properly needs both curves on the same vines, with the same Ψ (leaf or stem) on both axes. Which would you choose, and why?</p></div>' +
      '<p class="o3d-cr">' + cred + '. Three different leaves, not one leaf over time; each image stands for a stage of drying, not an exact water potential. The well watered image is a Chardonnay control.</p>';
    var stops = el.querySelector('.o3-stops');
    if (stops) el.insertBefore(sec, stops); else el.appendChild(sec);
    DAY.host = sec;
    var dsp = sec.querySelector('[data-r="dspd"]'); if (dsp && window.PlaySpeed) dsp.parentNode.replaceChild(window.PlaySpeed.chip('ps-light'), dsp); else if (dsp) dsp.remove(); // 13 Oct: speed of the played day
    if (WP.lh && WP.lh.toggle) WP.lh.toggle(sec);
    var sl = sec.querySelector('#o3d-psi');
    sl.addEventListener('input', function () { dayStop(); DAY.psi = +sl.value; dayDraw(); });
    sec.addEventListener('click', function (e) {
      var b = e.target.closest('[data-d]'); if (!b) return;
      var k = b.getAttribute('data-d');
      if (k === 'play') { if (DAY.playing) dayStop(); else dayPlay(); }
      else if (k === 'next') { dayStop(); var nx = DTH.filter(function (d) { return d.v < DAY.psi - 0.005; })[0]; DAY.psi = nx ? nx.v : -0.05; dayDraw(); }
      else if (k === 'dawn') { dayStop(); DAY.psi = -0.05; dayDraw(); }
    });
    var tm = 0; window.addEventListener('resize', function () { clearTimeout(tm); tm = setTimeout(dayDraw, 160); });
    dayDraw();
  }
  function psiS(v) { return v < 0 ? MINUS + Math.abs(v).toFixed(2) : v.toFixed(2); }
  function LH_check(q, a) { return (WP.lh && WP.lh.check) ? WP.lh.check(q, a, '') : ''; }
  function dayPlay() {
    if (ui.reducedMotion()) { var nx = DTH.filter(function (d) { return d.v < DAY.psi - 0.005; })[0]; DAY.psi = nx ? nx.v : -0.05; dayDraw(); return; }
    if (DAY.psi <= DMIN + 0.01) DAY.psi = -0.05;
    DAY.playing = true; DAY.last = 0; DAY.hold = 0; dayBtn();
    DAY.raf = requestAnimationFrame(dayFrame);
  }
  function dayStop() { DAY.playing = false; cancelAnimationFrame(DAY.raf); DAY.raf = 0; dayBtn(); }
  function dayBtn() { var b = DAY.host && DAY.host.querySelector('[data-d="play"]'); if (b) { b.setAttribute('aria-pressed', DAY.playing ? 'true' : 'false'); b.textContent = DAY.playing ? 'Pause' : 'Play the day'; } }
  function dayFrame(t) {
    if (!DAY.playing) return;
    var dt = DAY.last ? Math.min(0.1, (t - DAY.last) / 1000) : 0; dt *= (window.PlaySpeed ? window.PlaySpeed.get() : 1); DAY.last = t;
    if (DAY.hold > 0) DAY.hold -= dt;
    else {
      var p0 = DAY.psi; DAY.psi = Math.max(DMIN, DAY.psi - 0.14 * dt);
      DTH.forEach(function (d) { if (p0 > d.v && DAY.psi <= d.v) { DAY.psi = d.v; DAY.hold = 1.3; } });
      dayDraw();
      if (DAY.psi <= DMIN) { dayStop(); return; }
    }
    DAY.raf = requestAnimationFrame(dayFrame);
  }
  function dayDraw() {
    var s = DAY.host; if (!s) return;
    var p = DAY.psi, dark = ui.isDark();
    s.querySelector('#o3d-psi').value = p.toFixed(2);
    s.querySelector('[data-r="dpo"]').textContent = psi(p);
    var g = gsRel(p), k = kRel(p), wilt = clamp((-1.2 - p) / 0.5, 0, 1), stress = clamp((-0.3 - p) / 1.6, 0, 1);
    /* leaf drawing: a five lobed grape leaf hanging from its petiole; droops and curls past the turgor loss point */
    var leaf = s.querySelector('[data-r="dleaf"]');
    var col = mixHex(dark ? '#5f8f4c' : '#5b8c3a', dark ? '#7d7a45' : '#9a9a52', stress), col2 = mixHex(dark ? '#3f6a33' : '#3f6a2a', dark ? '#5f5a32' : '#77763c', stress);
    var o = '<defs><radialGradient id="o3d-lg" cx="45%" cy="40%" r="70%"><stop offset="0" stop-color="' + mixHex(col, '#ffffff', 0.18) + '"/><stop offset="0.7" stop-color="' + col + '"/><stop offset="1" stop-color="' + col2 + '"/></radialGradient></defs>';
    o += '<rect width="560" height="400" fill="' + (dark ? '#0f1a14' : '#efe8d4') + '"/>';
    o += '<path d="M40,52 C160,40 230,46 300,60" stroke="' + (dark ? '#8a775d' : '#7a6448') + '" stroke-width="9" fill="none" stroke-linecap="round"/>';
    var ang = 8 + 40 * wilt, curl = 1 - 0.32 * wilt;
    o += '<g transform="translate(300,50) rotate(' + ang.toFixed(1) + ')">';
    o += '<path d="M0,0 C6,30 4,56 0,78" stroke="' + col2 + '" stroke-width="5" fill="none" stroke-linecap="round"/>';
    o += '<g transform="translate(0,78) scale(' + (1 - 0.12 * wilt).toFixed(3) + ',' + curl.toFixed(3) + ')">' + grapeLeafPath() + '</g></g>';
    /* stomata inset */
    var ix = 482, iy = 306, ir = 64;
    o += '<circle cx="' + ix + '" cy="' + iy + '" r="' + ir + '" fill="' + (dark ? '#1c2a20' : '#e3e8cf') + '" stroke="var(--ink)" stroke-width="1.5"/>';
    o += '<text class="o3d-svgs" x="' + (ix + ir) + '" y="' + (iy - ir - 8) + '" text-anchor="end">stomata, lower side</text>';
    [[-30, -22], [26, -10], [-6, 30]].forEach(function (q) {
      var cx = ix + q[0], cy = iy + q[1], ap = 1.5 + 6.5 * g;
      o += '<ellipse cx="' + (cx - 6 - ap / 2) + '" cy="' + cy + '" rx="7" ry="15" fill="' + (dark ? '#6aa35a' : '#6f9a45') + '" stroke="' + col2 + '"/><ellipse cx="' + (cx + 6 + ap / 2) + '" cy="' + cy + '" rx="7" ry="15" fill="' + (dark ? '#6aa35a' : '#6f9a45') + '" stroke="' + col2 + '"/>';
      o += '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + (ap / 2).toFixed(1) + '" ry="' + (4 + 7 * g).toFixed(1) + '" fill="' + (dark ? '#0a0f0c' : '#2a231c') + '"/>';
      if (g > 0.08) for (var v = 0; v < 2; v++) o += '<circle cx="' + (cx + (v ? 5 : -4)) + '" cy="' + (cy + 20 + v * 6) + '" r="' + (1.5 + 2.5 * g).toFixed(1) + '" fill="#9dc3e6" opacity="' + (0.25 + 0.6 * g).toFixed(2) + '"/>';
    });
    o += '<text class="o3d-svgt" x="20" y="384">' + (p > -1.37 ? (g > 0.5 ? 'Stomata open: water vapour out, CO₂ in.' : 'Stomata closing: less water lost, less CO₂ in.') : 'Past turgor loss: the leaf wilts, stomata nearly shut.') + '</text>';
    leaf.innerHTML = o;
    leaf.setAttribute('aria-label', 'Grapevine leaf at ' + psi(p) + ': stomata ' + Math.round(100 * (1 - g)) + ' % closed; ' + (p <= -1.37 ? 'wilted, past its turgor loss point.' : 'still turgid.'));
    /* microCT midrib */
    var img = s.querySelector('[data-r="dimg"]'), cap = s.querySelector('[data-r="dcap"]');
    var ct = p > -1.25 ? CT[0] : (p > -1.9 ? CT[1] : CT[2]);
    var src = 'img/lab/' + ct.f; if (img.getAttribute('src') !== src) img.setAttribute('src', src);
    img.alt = 'MicroCT cross section of a grapevine leaf midrib, ' + ct.who + ', ' + ct.lab + '. ' + ct.see;
    cap.innerHTML = (p > -1.25 ? '<b>All conduits grey: full of water.</b> ' : (p > -1.9 ? '<b>The first black conduits: gas filled.</b> ' : '<b>Clusters of black conduits in the midrib.</b> ')) + esc(ct.who) + ', ' + esc(ct.lab) + '. 1.27 µm per voxel.';
    /* tiles */
    function tile(kk, v, sub) { return '<div class="o3d-tile"><div class="k">' + kk + '</div><div class="v">' + v + '</div><div class="s">' + sub + '</div></div>'; }
    s.querySelector('[data-r="dtiles"]').innerHTML =
      tile('Leaf hydraulics', Math.round(100 * k) + ' %', 'of maximum K<sub>leaf</sub>') +
      tile('Stomata', Math.round(100 * g) + ' %', 'of full opening') +
      tile('Turgor', p > -1.37 ? 'kept' : 'lost', p > -1.37 ? 'cells firm' : 'leaf wilts') +
      tile('Midrib', p > -1.25 ? 'full' : 'embolising', p > -1.25 ? 'no gas filled conduits' : 'gas filled conduits');
    /* axis with numbered markers */
    var ax = s.querySelector('[data-r="daxis"]'), nar = ax.clientWidth && ax.clientWidth < 560;
    var W = nar ? 400 : 760, H = 126, L = 16, Rr = 16;
    ax.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    function X(v) { return L + (W - L - Rr) * (v / DMIN); }
    var a = '<line x1="' + L + '" x2="' + (W - Rr) + '" y1="54" y2="54" stroke="var(--ink)" stroke-width="2"/>';
    a += '<rect x="' + L + '" y="49" width="' + (X(p) - L).toFixed(1) + '" height="10" rx="5" fill="var(--warm)" opacity=".75"/>';
    [[0, '0'], [-0.5, MINUS + '0.5'], [-1, MINUS + '1'], [-1.5, MINUS + '1.5'], [-2, MINUS + '2']].forEach(function (v) { a += '<line x1="' + X(v[0]) + '" x2="' + X(v[0]) + '" y1="54" y2="62" stroke="var(--ink)"/><text class="o3d-svgs" x="' + X(v[0]) + '" y="78" text-anchor="middle">' + v[1] + '</text>'; });
    a += '<text class="o3d-svgs" x="' + L + '" y="100">leaf water potential, MPa</text>';
    /* safety margin bracket: 80 % closure to stem P50 */
    a += '<path d="M' + X(-1.21) + ',' + (H - 10) + ' V' + (H - 4) + ' H' + X(-1.9) + ' V' + (H - 10) + '" fill="none" stroke="var(--warm)" stroke-width="2"/>';
    a += '<text class="o3d-svgs" x="' + ((X(-1.21) + X(-1.9)) / 2).toFixed(0) + '" y="' + (H - 14) + '" text-anchor="middle" style="fill:var(--ink);font-weight:600">safety margin</text>';
    var lastX = -99, row = 0;
    DTH.forEach(function (d, i) {
      var xx = X(d.v), on = p <= d.v + 0.0001;
      row = (xx - lastX < 22 && row === 0) ? 1 : 0; lastX = xx;
      var yy = row ? 13 : 32;
      a += '<line x1="' + xx.toFixed(1) + '" x2="' + xx.toFixed(1) + '" y1="' + (yy + 9) + '" y2="54" stroke="' + d.col + '" stroke-width="1.5"' + (d.xy ? ' stroke-dasharray="3 2"' : '') + '/>';
      a += '<circle cx="' + xx.toFixed(1) + '" cy="' + yy + '" r="9.5" fill="' + (on ? d.col : 'var(--card)') + '" stroke="' + d.col + '" stroke-width="2"/>';
      a += '<text x="' + xx.toFixed(1) + '" y="' + (yy + 4) + '" text-anchor="middle" style="font-family:var(--ui);font-size:11px;font-weight:700;fill:' + (on ? '#fff' : 'var(--ink)') + '">' + (i + 1) + '</text>';
    });
    a += '<circle cx="' + X(p).toFixed(1) + '" cy="54" r="7" fill="var(--paper)" stroke="var(--ink)" stroke-width="2.5"/>';
    ax.innerHTML = a;
    /* list: lights up past each threshold */
    var lst = s.querySelector('[data-r="dlist"]');
    if (!lst.firstChild) lst.innerHTML = DTH.map(function (d, i) {
      return '<li data-k="' + d.k + '" class="' + (d.xy ? 'xy ' : '') + (d.t > 1 ? 'tier-2' : '') + '"><span class="n" style="background:' + d.col + '">' + (i + 1) + '</span><span><span class="v">' + psiS(d.v) + ' MPa</span> ' + esc(d.lab) + ' <span class="c">' + esc(d.c) + (d.xy ? ' · Hochberg et al. 2016, Plant, Cell and Environment' : ' · Albuquerque et al. 2020, Journal of Experimental Botany') + ' ' + ev(d.ev) + '</span></span></li>';
    }).join('');
    Array.prototype.forEach.call(lst.children, function (li) { var d = DTH.filter(function (q) { return q.k === li.getAttribute('data-k'); })[0]; var on = p <= d.v + 0.0001; li.classList.toggle('on', on); li.setAttribute('aria-current', on ? 'true' : 'false'); });
    var msg = s.querySelector('[data-r="dmsg"]');
    msg.innerHTML = p > -0.6 ? '<b>Morning.</b> The stomata are wide open and every vein conduit is still full of water, yet leaf hydraulic conductance is already falling. <span class="tier-2">The 2020 study concluded that this early loss lies outside the xylem.</span> Keep drying.' :
      (p > -1.25 ? '<b>The leaf is shutting down.</b> Stomata close and K<sub>leaf</sub> falls, yet every midrib conduit is still full of water.' :
      (p > -1.9 ? '<b>Only now do the pipes start to break.</b> The first gas filled conduits appear in the midrib, after the stomata are 80 % closed and close to turgor loss.' :
      '<b>Deep drought.</b> Clusters of embolised conduits fill the midrib; stems of another cultivar reach P50 near here.')) +
      ' <span class="tier-1-only">The leaf shuts down long before its xylem breaks; that gap is the safety margin.</span><span class="tier-2">The leaf shuts down long before its xylem breaks. That gap, from stomatal closure to xylem failure, is the <b>safety margin</b>: about 0.7 MPa between 80 % closure in these leaves and stem P50 in Syrah ' + (ui.badge ? ui.badge('DERIVED', 'Two studies, two cultivars.') : '') + ' ' + ev('l3.day.margin') + '.</span>';
  }
  var LEAFP = null;
  function grapeLeafPath() {
    if (!LEAFP) {
      /* palmate outline: five lobes with teeth, petiole sinus at the top (0,0); drawn once */
      var pts = [], n = 260, R0 = 125;
      for (var i = 0; i <= n; i++) {
        var th = -Math.PI / 2 + 0.32 + (Math.PI * 2 - 0.64) * i / n; // leave the sinus open at the top
        var lob = 0.62 + 0.38 * Math.pow(Math.abs(Math.sin(2.5 * (th + Math.PI / 2))), 0.7);
        var tooth = 1 + 0.035 * Math.sin(i * 1.9) * (i % 2 ? 1 : 0.6);
        var r = R0 * lob * tooth * (1 + 0.12 * Math.sin(th));
        pts.push([r * Math.cos(th), 95 + r * Math.sin(th) * 0.92]);
      }
      var d = 'M0,0 L' + pts.map(function (q) { return q[0].toFixed(1) + ',' + q[1].toFixed(1); }).join(' L') + ' Z';
      var veins = '';
      [-54, 18, 90, 162, 234].forEach(function (deg2) { var t = deg2 * Math.PI / 180, L2 = 112 * (1 + 0.12 * Math.sin(t)), ex = Math.cos(t) * L2, ey = 95 + Math.sin(t) * L2 * 0.92; veins += '<path d="M0,8 Q' + (ex * 0.35).toFixed(1) + ',' + (40 + (ey - 40) * 0.3).toFixed(1) + ' ' + ex.toFixed(1) + ',' + ey.toFixed(1) + '" fill="none" stroke="rgba(240,236,200,.75)" stroke-width="' + (deg2 === 90 ? 3.2 : 2.2) + '"/>'; });
      LEAFP = '<path d="' + d + '" fill="url(#o3d-lg)" stroke="rgba(30,50,20,.7)" stroke-width="1.6"/>' + veins;
    }
    return LEAFP;
  }
  function mixHex(a, b, t) { function h(s, i) { return parseInt(s.slice(1 + 2 * i, 3 + 2 * i), 16); } var r = [0, 1, 2].map(function (i) { return Math.round(h(a, i) + (h(b, i) - h(a, i)) * t); }); return '#' + r.map(function (v) { return ('0' + v.toString(16)).slice(-2); }).join(''); }

  WP.levels.push({ id: 'organ', n: 3, title: 'The Organ', subtitle: 'root, stem, petiole and veins', scale: '1 cm', focus: [50, 40], mount: mount, update: update,
    show: function () { lpStart(); HERO.shown = true; heroKick(); }, hide: function () { lpStop(); HERO.shown = false; dayStop(); glDispose(); } });
})();

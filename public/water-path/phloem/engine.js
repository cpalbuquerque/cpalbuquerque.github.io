/* Sugar on the move: engine.js, window.PP (phloem builder A, 14 Oct 2026).
   A simple, documented Münch pressure flow model for one sieve tube path, source leaf to sink.
   Every constant carries its status from night/sheets/phloem.json (MEASURED, MODEL, DERIVED) or ILLUSTRATIVE.

   MODEL (say these on screen as the model):
   1. Osmotic pressure of the sieve tube sap at the source, van 't Hoff (dilute, ideal):            DERIVED
        Π = (m_sugar + m_K) · R · T_K           m in mol per kg water, R 8.314 J mol⁻¹ K⁻¹, Π in MPa
        m_sugar from the sugar mass fraction c (% w/w) and the molar mass of the sugar mix
        (sucrose 342.30 g mol⁻¹; sorbitol 182.17 g mol⁻¹): m = (c/M) / (100 − c) · 1000
   2. Coupling to the xylem (Nikinmaa et al. 2013, MODEL): the sieve tube at the source takes up water from the xylem
      next to it until its water potential matches, so source turgor  P_src = Ψ_xylem + Π
      (water potential Ψ = P − Π equal on both sides; gravity ignored).
   3. Sink turgor P_sink: default 0.59 MPa, measured in morning glory root cortex (Knoblauch et al. 2016, MEASURED).
   4. Flow along the tube, Hagen-Poiseuille / Darcy form:  U = k_eff · ΔP / (η · L)
        ΔP = P_src − P_sink (MPa), L path length (m), η sap viscosity (mPa s),
        k_eff = k_lumen / f_plate: the open lumen conductivity divided by the sieve plate factor.
        k_eff default 1 µm² (Knoblauch et al. 2016, MEASURED); plates and lumen share the resistance about
        equally (Jensen et al. 2012, MODEL), so f_plate = 2 and k_lumen = 2 µm² (DERIVED from the two).
        Units: U [µm s⁻¹] = k [µm²] · (ΔP/L) [MPa m⁻¹] / η [mPa s] · 1000.
        Anchor (node test): k 1 µm², 0.21 MPa m⁻¹, η 1.7 mPa s gives 124 µm s⁻¹; measured 123 µm s⁻¹ (DERIVED check).
   5. Viscosity of the sap: η = η_water(T) · (1.7 / η_water(25 °C))^(c/18). Anchored at pure water and at the measured 1.7 mPa s
      for about 18 % sucrose (Knoblauch et al. 2016); the exponential shape between and beyond is ILLUSTRATIVE.
      η_water(T) = 0.02939 · exp(507.88 / (T_K − 149.3)) mPa s (Vogel fit for water, DERIVED; 0.890 at 25 °C).
   6. No flow runs backwards: when ΔP ≤ 0 the model reports U = 0 (whether flow can reverse across sieve plates in a
      land plant is an OPEN QUESTION; Knoblauch et al. 2016 Ann Bot did it in kelp).
   7. Loading (Plate I), ILLUSTRATIVE ratios inside measured ranges: the sugar in the sieve element relative to the
      mesophyll cytosol, apoplastic (active) 10 fold, polymer trap 10 fold in total sugar but sucrose itself runs downhill,
      passive symplastic 0.9 (downhill). Measured: sap 2 to 40 fold above mesophyll cytosol across four species including
      peach (Nadwodnik and Lohaus 2008); leaf transport sugar differs more than 50 fold between loading types
      (Rennie and Turgeon 2009).
   State: { tier, load 'apo'|'sym'|'trap', sugar 'sucrose'|'rosaceae', sorb (sorbitol mass share 0 to 1, rosaceae only),
            conc (% w/w sugar in the sap, 2 to 32), K (extra osmolyte, mol kg⁻¹, 0 to 0.5), psiX (MPa, −2.5 to 0),
            Psink (MPa, 0 to 1.2), L (m, 0.2 to 30), kLumen (µm², 0.2 to 12), fPlate (1 to 8), callose (bool), T (°C, 5 to 40) }
   API: PP.state, PP.set(patch), PP.on(fn) → unsubscribe, PP.solve(stateLike) pure, PP.result, PP.params, PP.fmt,
        PP.velocity({k, grad, eta}) µm s⁻¹, PP.osmotic(conc, sorb, K, T) MPa, PP.viscosity(conc, T) mPa s. */
(function (G) {
  'use strict';
  var PP = G.PP = G.PP || {};
  var R = 8.314, MW_SUC = 342.30, MW_SOR = 182.17, ETA_W25 = 0.890, ETA_18 = 1.7;
  var MINUS = '−';

  PP.params = {
    Psrc_meas: { v: 1.08, units: 'MPa', src: 'Knoblauch et al. 2016 eLife, morning glory source sieve tube turgor (pico gauge)', doi: '10.7554/eLife.15341', status: 'MEASURED' },
    Psink: { v: 0.59, units: 'MPa', src: 'Knoblauch et al. 2016 eLife, sink (root cortex) turgor', doi: '10.7554/eLife.15341', status: 'MEASURED' },
    U_meas: { v: 123, units: 'µm s⁻¹', src: 'Knoblauch et al. 2016 eLife, ¹¹C velocity', doi: '10.7554/eLife.15341', status: 'MEASURED' },
    grad_meas: { v: 0.21, units: 'MPa m⁻¹', src: 'Knoblauch et al. 2016 eLife, gradient needed for the measured speed', doi: '10.7554/eLife.15341', status: 'MEASURED' },
    kTube: { v: 1.0, units: 'µm²', src: 'Knoblauch et al. 2016 eLife, sieve tube conductivity from anatomy', doi: '10.7554/eLife.15341', status: 'MEASURED' },
    eta18: { v: ETA_18, units: 'mPa s', src: 'Knoblauch et al. 2016 eLife, sap viscosity in vivo (FLIM), about 18 % sucrose', doi: '10.7554/eLife.15341', status: 'MEASURED' },
    conc: { v: 18, units: '% w/w', src: 'Knoblauch et al. 2016 (about 18 %); Jensen, Savage and Holbrook 2013 (mean 18.2 % over 41 species)', doi: '10.1098/rsif.2013.0055', status: 'MEASURED' },
    fPlate: { v: 2, units: 'total ÷ lumen resistance', src: 'Jensen et al. 2012 Front Plant Sci: plates and lumen contribute almost equally', doi: '10.3389/fpls.2012.00151', status: 'MODEL' },
    kLumen: { v: 2, units: 'µm²', src: 'k 1 µm² (MEASURED) × plate factor 2 (MODEL)', doi: '', status: 'DERIVED' },
    psiX: { v: -0.5, units: 'MPa', src: 'teaching choice: with 18 % sucrose it returns the measured 1.08 MPa source turgor', doi: '', status: 'ILLUSTRATIVE' },
    L: { v: 2, units: 'm', src: 'teaching choice: a vine a couple of metres long', doi: '', status: 'ILLUSTRATIVE' },
    coupling: { v: 'P = Ψx + Π', units: '', src: 'Nikinmaa et al. 2013 Plant Cell Environ', doi: '10.1111/pce.12004', status: 'MODEL' },
    vantHoff: { v: 'Π = m R T', units: 'MPa', src: 'van ’t Hoff, ideal dilute solution', doi: '', status: 'DERIVED' },
    etaShape: { v: 'η_w (1.7/0.89)^(c/18)', units: 'mPa s', src: 'anchored at water and at 1.7 mPa s for 18 %; shape between is a teaching choice', doi: '', status: 'ILLUSTRATIVE' },
    calloseF: { v: 40, units: '× plate resistance', src: 'callose closes sieve plate pores within minutes after injury (Mullendore et al. 2010); the factor is a teaching choice', doi: '10.1105/tpc.109.070094', status: 'ILLUSTRATIVE' },
    loadRatio: { v: { apo: 10, trap: 10, sym: 0.9 }, units: 'sieve element ÷ mesophyll sugar', src: 'teaching values inside the measured 2 to 40 fold (Nadwodnik and Lohaus 2008)', doi: '10.1007/s00425-007-0682-0', status: 'ILLUSTRATIVE' }
  };

  var DEF = { tier: 2, load: 'apo', sugar: 'sucrose', sorb: 0.5, conc: 18, K: 0, psiX: -0.5, Psink: 0.59, L: 2, kLumen: 2, fPlate: 2, callose: false, T: 25 };
  PP.defaults = Object.assign({}, DEF);
  PP.state = Object.assign({}, DEF);
  var LIM = { conc: [2, 32], K: [0, 0.5], psiX: [-2.5, 0], Psink: [0, 1.2], L: [0.2, 30], kLumen: [0.2, 12], fPlate: [1, 8], T: [5, 40], sorb: [0, 1] };
  PP.limits = LIM;

  function clamp(x, a, b) { return x < a ? a : (x > b ? b : x); }
  function fin(x, d) { return (typeof x === 'number' && isFinite(x)) ? x : d; }

  PP.etaWater = function (T) { return 0.02939 * Math.exp(507.88 / ((T + 273.15) - 149.3)); };
  PP.viscosity = function (conc, T) { return PP.etaWater(T == null ? 25 : T) * Math.pow(ETA_18 / PP.etaWater(25), conc / 18); };
  PP.molal = function (conc, sorb) {
    var M = 1 / ((1 - sorb) / MW_SUC + sorb / MW_SOR);            // mass weighted mean molar mass of the mix
    return (conc / M) / (100 - conc) * 1000;                        // mol per kg water
  };
  PP.osmotic = function (conc, sorb, K, T) { return (PP.molal(conc, sorb || 0) + (K || 0)) * R * ((T == null ? 25 : T) + 273.15) / 1000; };
  PP.velocity = function (o) { return Math.max(0, o.k * o.grad / o.eta * 1000); };

  function norm(s) {
    var o = Object.assign({}, DEF, s || {});
    Object.keys(LIM).forEach(function (k) { o[k] = clamp(fin(+o[k], DEF[k]), LIM[k][0], LIM[k][1]); });
    if (['apo', 'sym', 'trap'].indexOf(o.load) < 0) o.load = 'apo';
    if (o.sugar !== 'rosaceae') o.sugar = 'sucrose';
    o.callose = !!o.callose;
    return o;
  }

  PP.solve = function (s) {
    var st = norm(s), w = [];
    var sorb = st.sugar === 'rosaceae' ? st.sorb : 0;
    var molal = PP.molal(st.conc, sorb);
    var Pi = (molal + st.K) * R * (st.T + 273.15) / 1000;
    var PiSugar = molal * R * (st.T + 273.15) / 1000;
    var PsrcRaw = st.psiX + Pi, Psrc = Math.max(0, PsrcRaw);
    if (PsrcRaw <= 0) w.push('The source sieve tube has lost its turgor: the xylem pulls harder than the sugar can hold water.');
    var Psink = st.Psink, dP = Psrc - Psink;
    var fPl = st.fPlate * (st.callose ? PP.params.calloseF.v : 1);
    var kEff = st.kLumen / fPl, eta = PP.viscosity(st.conc, st.T);
    var grad = dP / st.L;
    var U = dP > 0 ? PP.velocity({ k: kEff, grad: grad, eta: eta }) : 0;   // µm s⁻¹
    if (dP <= 0) w.push('No pressure difference from source to sink: in this model the flow stops.');
    var dens = 1 + 0.0038 * st.conc;                                         // relative density, approximation
    var cMass = st.conc / 100 * 1000 * dens;                                 // kg sugar per m³ sap
    var cMol = molal * (1000 - cMass) / 1000 * dens;                         // rough mol per litre, for display only
    var Jmass = U * 1e-6 * cMass;                                            // kg m⁻² s⁻¹ through the open tube
    var smt = Jmass * 1000 * 3600 / 1e4;                                     // g cm⁻² h⁻¹ of sieve tube area
    var transit = U > 0 ? st.L / (U * 1e-6) / 3600 : Infinity;               // h
    var gradNeeded = PP.params.U_meas.v * eta / kEff / 1000;                 // MPa m⁻¹ for the measured speed with these tubes
    var ratio = PP.params.loadRatio.v[st.load];
    var meso = st.conc / ratio;
    var rLumen = Math.sqrt(8 * st.kLumen);                                    // µm, open tube with k = r²/8
    var res = {
      Pi: Pi, PiSugar: PiSugar, PiK: Pi - PiSugar, molal: molal, Psrc: Psrc, PsrcRaw: PsrcRaw, Psink: Psink, dP: dP, grad: grad,
      gradNeeded: gradNeeded, kEff: kEff, fPlateEff: fPl, eta: eta, etaW: PP.etaWater(st.T),
      U: U, Umm: U / 1000, Ucmh: U * 1e-4 * 3600, transit: transit, cMass: cMass, cMol: cMol, Jmass: Jmass, smt: smt,
      load: { type: st.load, ratio: ratio, mesoPct: meso, phloemPct: st.conc, uphill: ratio > 1, route: st.load === 'apo' ? 'apoplast' : 'plasmodesmata', energy: st.load === 'apo' ? 'active' : (st.load === 'trap' ? 'enzymes' : 'none') },
      rLumen: rLumen, stopped: U <= 0, warnings: w, state: st
    };
    return res;
  };

  var subs = [];
  PP.set = function (patch) {
    Object.keys(patch || {}).forEach(function (k) { PP.state[k] = patch[k]; });
    PP.state = Object.assign(PP.state, norm(PP.state));
    PP.result = PP.solve(PP.state);
    subs.slice().forEach(function (fn) { try { fn(PP.state, PP.result); } catch (e) { if (typeof console !== 'undefined') console.error(e); } });
    return PP.result;
  };
  PP.on = function (fn) { subs.push(fn); return function () { var i = subs.indexOf(fn); if (i >= 0) subs.splice(i, 1); }; };
  PP.reset = function () { var t = PP.state.tier; PP.state = Object.assign({}, DEF, { tier: t }); return PP.set({}); };

  PP.fmt = {
    num: function (x, d) {
      if (x == null || !isFinite(x)) return 'n/a';
      var s = Math.abs(x).toFixed(d == null ? 2 : d);
      return (x < 0 && Number(s) !== 0 ? MINUS : '') + s;
    },
    mpa: function (x, d) { return PP.fmt.num(x, d == null ? 2 : d) + ' MPa'; }
  };
  PP.result = PP.solve(PP.state);

  /* SHEET BEGIN: generated by night/tools/phloemA/gen_evidence.py from night/sheets/phloem.json; do not edit by hand */
  PP.evidence = PP.evidence || {}; PP.sources = PP.sources || {};
  (function (E, S) {
    var ev = {
"ph.load.three_types": {
"claim": "Three phloem loading strategies exist for sucrose and sugar alcohols: apoplastic (active, via the cell wall space), symplastic passive (diffusion through plasmodesmata), and polymer trap (sucrose diffuses in, is built into raffinose and stachyose in intermediary cells, and is too big to diffuse back). Identified across 45 dicot species; leaf concentrations of transport sugars differed more than 50 fold and tracked the loading type. Passive loading is more widespread than thought, especially in trees.",
"cite": "Rennie & Turgeon 2009 PNAS 106: 14162 to 14167",
"doi": "10.1073/pnas.0902279106",
"measured": "45 dicotyledonous species; 14C autoradiography of minor veins, leaf solute analysis, plasmodesmata counts",
"value": "species tested 45; concentration range fold >50",
"badge": "MEASURED",
"note": "PubMed PMID 19666555, retrieved 14 Oct 2026 (phloem evidence sheet).",
"short": "Rennie and Turgeon 2009",
"pmid": "19666555"
},
"ph.load.review_2018": {
"claim": "Review: apoplastic loading starts with sucrose release by SWEET transporters into the cell wall space, then uptake into the companion cell and sieve element; polymer trapping and passive diffusion use plasmodesmata. Models show these mechanisms can supply even the tallest trees.",
"cite": "Zhang & Turgeon 2018 Curr Opin Plant Biol 43: 71 to 75",
"doi": "10.1016/j.pbi.2018.01.009",
"measured": "general; review",
"value": "",
"badge": "MEASURED",
"note": "PubMed PMID 29448176, retrieved 14 Oct 2026 (phloem evidence sheet).",
"short": "Zhang and Turgeon 2018",
"pmid": "29448176"
},
"ph.load.sweet_sut": {
"claim": "Two step apoplastic loading: SWEET11 and SWEET12 export sucrose from phloem parenchyma into the apoplast; SUT sucrose/H+ cotransporters then import it into the sieve element companion cell complex. sweet11 sweet12 double mutants are defective in phloem loading.",
"cite": "Chen et al. 2012 Science 335: 207 to 211",
"doi": "10.1126/science.1213351",
"measured": "Arabidopsis thaliana; optical sucrose sensors, mutants",
"value": "",
"badge": "MEASURED",
"note": "PubMed PMID 22157085, retrieved 14 Oct 2026 (phloem evidence sheet).",
"short": "Chen et al. 2012",
"pmid": "22157085"
},
"ph.load.growth_form": {
"claim": "Apoplastic loading is strongly associated with the herbaceous habit; passive symplastic loading with the tree growth form. Links to climate are weak and probably indirect.",
"cite": "Davidson, Keller & Turgeon 2011 Protoplasma 248: 153 to 163",
"doi": "10.1007/s00709-010-0240-7",
"measured": "angiosperm families and species (floristic analysis); comparative phylogenetic analysis of minor vein types",
"value": "",
"badge": "MEASURED",
"note": "PubMed PMID 21125302, retrieved 14 Oct 2026 (phloem evidence sheet).",
"short": "Davidson, Keller and Turgeon 2011",
"pmid": "21125302"
},
"ph.load.trees_water": {
"claim": "Trees and the few passive loading herbs have low whole plant hydraulic conductance, high leaf osmolality and high transport sugar levels; active sucrose loading herbs have high conductance and low leaf sugar. Ions contribute a baseline leaf osmolality of about 300 (mmol per kg, as stated in the abstract 'approximately 300 mm').",
"cite": "Fu et al. 2011 Plant Physiol 157: 1518 to 1527",
"doi": "10.1104/pp.111.184820",
"measured": "45 dicotyledonous species; whole plant hydraulic conductance, osmolality, metabolites at midafternoon",
"value": "300 mmol kg−1 (ion baseline, read from abstract)",
"badge": "MEASURED",
"note": "PubMed PMID 21873572, retrieved 14 Oct 2026 (phloem evidence sheet).",
"short": "Fu et al. 2011",
"pmid": "21873572"
},
"ph.load.poplar_passive": {
"claim": "Experimental test of passive loading: poplar expressing yeast invertase in the cell walls (which destroys apoplastic sucrose) grew normally, while alfalfa with the same construct showed loading inhibition. Sucrose enters poplar phloem through plasmodesmata.",
"cite": "Zhang et al. 2014 Plant Physiol 166: 306 to 313",
"doi": "10.1104/pp.114.245845",
"measured": "Populus tremula × alba; Medicago sativa; transgenic cell wall invertase",
"value": "",
"badge": "MEASURED",
"note": "PubMed PMID 25056922, retrieved 14 Oct 2026 (phloem evidence sheet).",
"short": "Zhang et al. 2014",
"pmid": "25056922"
},
"ph.load.polymer_model": {
"claim": "Model: polymerising sucrose into raffinose and stachyose in the phloem lowers the leaf sugar needed for a given export rate and speeds export, relative to passive loading.",
"cite": "Comtet, Turgeon & Stroock 2017 Plant Physiol 175: 904 to 915",
"doi": "10.1104/pp.16.01041",
"measured": "model (parameters from melon type loaders); biophysical model of plasmodesmal transport and polymerisation",
"value": "",
"badge": "MODEL",
"note": "PubMed PMID 28794259, retrieved 14 Oct 2026 (phloem evidence sheet).",
"short": "Comtet, Turgeon and Stroock 2017",
"pmid": "28794259"
},
"ph.load.chip_passive": {
"claim": "Synthetic 'tree on a chip' passive loader generated hydrostatic pressures up to about 10 bar (1 MPa); passive loading is sufficient to drive long distance transport in large plants with high transport resistance.",
"cite": "Comtet et al. 2017 Nat Plants 3: 17032",
"doi": "10.1038/nplants.2017.32",
"measured": "synthetic microfluidic device; microfluidic osmotic model",
"value": "1 MPa (10 bar, device)",
"badge": "MODEL",
"note": "PubMed PMID 28319082, retrieved 14 Oct 2026 (phloem evidence sheet).",
"short": "Comtet et al. 2017",
"pmid": "28319082"
},
"ph.rosa.sorbitol_family": {
"claim": "Sorbitol is a primary photosynthetic product and the principal transport sugar in many Rosaceae, explicitly listing almond (Prunus dulcis), apple, cherry, peach and pear. Sour cherry sorbitol transporters PcSOT1 and PcSOT2 are H+ coupled with Km 0.81 and 0.64 mM; their expression suggests an apoplastic step in fruit unloading.",
"cite": "Gao et al. 2003 Plant Physiol 131: 1566 to 1575",
"doi": "10.1104/pp.102.016725",
"measured": "Prunus cerasus (transporters); family statement includes Prunus dulcis; cloning, yeast expression",
"value": "Km PcSOT1 0.81; Km PcSOT2 0.64",
"badge": "MEASURED",
"note": "PubMed PMID 12692316, retrieved 14 Oct 2026 (phloem evidence sheet).",
"short": "Gao et al. 2003",
"pmid": "12692316"
},
"ph.rosa.peach_sap": {
"claim": "Peach phloem sap carries substantial sorbitol along with sucrose. Phloem sap concentrations were 2 to 40 fold above mesophyll cytosol; apoplast to phloem ratios were 20 to 100 fold for sugar alcohols and 200 to 2000 fold for sucrose. Peach, the woody species, had the smallest ratios, suggesting mixed apoplastic and symplastic loading.",
"cite": "Nadwodnik & Lohaus 2008 Planta 227: 1079 to 1089",
"doi": "10.1007/s00425-007-0682-0",
"measured": "Prunus persica; Plantago major; P. maritima; Apium graveolens; nonaqueous fractionation, aphid stylet and apoplast sampling",
"value": "sap over cytosol 2 to 40; apoplast to phloem polyol 20 to 100; apoplast to phloem sucrose 200 to 2000",
"badge": "MEASURED",
"note": "PubMed PMID 18188589, retrieved 14 Oct 2026 (phloem evidence sheet).",
"short": "Nadwodnik and Lohaus 2008",
"pmid": "18188589"
},
"ph.rosa.apple_passive": {
"claim": "Apple loads sorbitol and sucrose symplastically and passively (abundant plasmodesmata, no minor vein accumulation of 14C label); apple leaves hold high sorbitol and sucrose. Proposed reason: moving sorbitol at high concentration avoids the photosynthetic feedback that very high sucrose would cause.",
"cite": "Reidel et al. 2009 Plant Physiol 149: 1601 to 1608",
"doi": "10.1104/pp.108.134791",
"measured": "Malus domestica (also Plantago major, Asarina scandens); plasmodesmata counts, 14C autoradiography",
"value": "",
"badge": "MEASURED",
"note": "PubMed PMID 19129415, retrieved 14 Oct 2026 (phloem evidence sheet).",
"short": "Reidel et al. 2009",
"pmid": "19129415"
},
"ph.rosa.apple_silencing": {
"claim": "Silencing sorbitol synthesis in apple cut the sorbitol to sucrose ratio by about 90 % in leaves and about 75 % in phloem exudate; leaves compensated with sucrose and starch, assimilation fell, and fruit sugar and acid balance changed.",
"cite": "Teo et al. 2006 PNAS 103: 18842 to 18847",
"doi": "10.1073/pnas.0605873103",
"measured": "Malus domestica 'Greensleeves'; antisense S6PDH transgenics",
"value": "leaf ratio drop % 90; exudate ratio drop % 75",
"badge": "MEASURED",
"note": "PubMed PMID 17132742, retrieved 14 Oct 2026 (phloem evidence sheet).",
"short": "Teo et al. 2006",
"pmid": "17132742"
},
"ph.rosa.apple_fruit_unload": {
"claim": "Apple fruit: the sieve element companion cell complex in the fruit flesh bundles is symplasmically isolated, so unloading includes an apoplastic, energy driven step.",
"cite": "Zhang et al. 2004 Plant Physiol 135: 574 to 586",
"doi": "10.1104/pp.103.036632",
"measured": "Malus domestica 'Golden Delicious'; ultrastructure, carboxyfluorescein, 14C sorbitol",
"value": "",
"badge": "MEASURED",
"note": "PubMed PMID 15122035, retrieved 14 Oct 2026 (phloem evidence sheet).",
"short": "Zhang et al. 2004",
"pmid": "15122035"
},
"ph.rosa.sorbitol_signal": {
"claim": "Apple: sorbitol stimulates its own breakdown genes (SDH1, A6PR) through SnRK1 phosphorylation of bZIP39; sorbitol acts as a signal.",
"cite": "Meng et al. 2023 Plant Physiol 192: 2123 to 2142",
"doi": "10.1093/plphys/kiad226",
"measured": "Malus domestica; transgenics, kinase assays",
"value": "",
"badge": "MEASURED",
"note": "PubMed PMID 37067900, retrieved 14 Oct 2026 (phloem evidence sheet).",
"short": "Meng et al. 2023",
"pmid": "37067900"
},
"ph.tube.munch_test": {
"claim": "Münch test in morning glory: source sieve tube turgor 1.08 ± 0.13 MPa, sink (root cortex) turgor 0.59 ± 0.11 MPa, so 0.49 MPa available; 0.21 MPa per m was needed for the measured velocity 123 ± 13 µm s−1 through tubes of conductivity about 1 µm², sap viscosity 1.7 mPa s (about 18 % sucrose). In 17.5 m plants source turgor rose from 0.75 to more than 2.2 MPa and sieve tube conductivity rose 5 to 6 fold, mostly from larger sieve plate pores.",
"cite": "Knoblauch et al. 2016 eLife 5: e15341",
"doi": "10.7554/eLife.15341",
"measured": "Ipomoea nil (morning glory); pico gauge turgor, 11C velocity, FLIM viscosity (2-NBDG), SEM sieve plate anatomy",
"value": "P source MPa 1.08; P sink MPa 0.59; ΔP MPa 0.49; gradient needed MPa m⁻¹ 0.21; velocity µm s⁻¹ 123; k µm² 1.0; viscosity mPa s 1.7; sucrose % 18; P source long plant MPa >2.2; k increase fold 5 to 6; velocity long µm s⁻¹ 256; k 13 m foliated µm² 2.8",
"badge": "MEASURED",
"note": "PubMed PMID 27253062, retrieved 14 Oct 2026 (phloem evidence sheet).",
"short": "Knoblauch et al. 2016",
"pmid": "27253062"
},
"ph.tube.hp_check": {
"claim": "Hagen-Poiseuille consistency: with k = 1 µm², η = 1.7 mPa s and 0.21 MPa m−1 the velocity is 124 µm s−1, matching the measured 123 µm s−1.",
"cite": "Knoblauch et al. 2016 eLife",
"doi": "10.7554/eLife.15341",
"measured": "Ipomoea nil; arithmetic on Knoblauch 2016 values",
"value": "124 µm s−1",
"badge": "DERIVED",
"note": "PubMed PMID 27253062, retrieved 14 Oct 2026 (phloem evidence sheet).",
"short": "Knoblauch et al. 2016",
"pmid": "27253062"
},
"ph.tube.geometry": {
"claim": "Sieve tube and sieve plate geometry measured by SEM in five species (green bean, bamboo, squash, castor bean, tomato). Higher sieve tube conductivity was not accompanied by higher sap velocity (MRI). Callose can occlude small sieve plate pores within minutes after injury.",
"cite": "Mullendore et al. 2010 Plant Cell 22: 579 to 593",
"doi": "10.1105/tpc.109.070094",
"measured": "Phaseolus vulgaris; Phyllostachys nuda; Cucurbita maxima; Ricinus communis; Solanum lycopersicum; SEM of cleared walls, MRI velocimetry",
"value": "",
"badge": "MEASURED",
"note": "PubMed PMID 20354199, retrieved 14 Oct 2026 (phloem evidence sheet).",
"short": "Mullendore et al. 2010",
"pmid": "20354199"
},
"ph.tube.plate_share": {
"claim": "Model plus anatomy of 19 species: sieve plate resistance correlates with lumen resistance, and plates and lumen contribute almost equally to total sieve tube resistance.",
"cite": "Jensen et al. 2012 Front Plant Sci 3: 151",
"doi": "10.3389/fpls.2012.00151",
"measured": "19 species; hydrodynamic model with anatomical data",
"value": "0.5 fraction of resistance from plates (about half)",
"badge": "MODEL",
"note": "PubMed PMID 22811681, retrieved 14 Oct 2026 (phloem evidence sheet).",
"short": "Jensen et al. 2012",
"pmid": "22811681"
},
"ph.tube.sieve_plate_fallacy": {
"claim": "Historical analysis: Münch and Pfeffer did not require pressure gradients along the path; overly simple readings of Münch lead to errors such as the 'sieve plate fallacy'. Descriptions should follow the theory's earliest formulations.",
"cite": "Peters & Knoblauch 2022 J Plant Physiol 272: 153672; Knoblauch & Peters 2017 J Integr Plant Biol 59: 292 to 310",
"doi": "10.1016/j.jplph.2022.153672",
"measured": "general; history of science",
"value": "",
"badge": "MEASURED",
"note": "PubMed PMID 35366573; 28276639, retrieved 14 Oct 2026 (phloem evidence sheet).",
"short": "Peters and Knoblauch 2022",
"pmid": "35366573; 28276639",
"doi2": "10.1111/jipb.12532"
},
"ph.tube.SE_structure": {
"claim": "Mature sieve elements lack nuclei, translation machinery and Golgi, and keep a reduced, differentiated endoplasmic reticulum; proteomics of isolated sieve tubes found sieve element specific proteins.",
"cite": "Liu et al. 2022 PNAS 119: e2112755119",
"doi": "10.1073/pnas.2112755119",
"measured": "species name lost in the PubMed title (check PDF before naming); sieve element isolation, proteomics, YFP tags",
"value": "",
"badge": "MEASURED",
"note": "PubMed PMID 34983847, retrieved 14 Oct 2026 (phloem evidence sheet).",
"short": "Liu et al. 2022",
"pmid": "34983847"
},
"ph.tube.CC_link": {
"claim": "Companion cell and sieve element ER is continuous through pore plasmodesma units, the strongest ER coupling of any cell pair measured; SUC2 promoter GFP marks companion cells along the whole transport path, consistent with sucrose retrieval along the way.",
"cite": "Martens et al. 2006 Plant Physiol 142: 471 to 480",
"doi": "10.1104/pp.106.085803",
"measured": "Nicotiana tabacum; FRAP of ER dye, SUC2 promoter GFP",
"value": "",
"badge": "MEASURED",
"note": "PubMed PMID 16905664, retrieved 14 Oct 2026 (phloem evidence sheet).",
"short": "Martens et al. 2006",
"pmid": "16905664"
},
"ph.tube.SEOR": {
"claim": "SEOR1 protein meshworks line living sieve tubes and form clots, yet live imaging showed they do not markedly affect flow; obstructions seen in older EM images were mostly preparation artefacts.",
"cite": "Froelich et al. 2011 Plant Cell 23: 4428 to 4445",
"doi": "10.1105/tpc.111.093179",
"measured": "Arabidopsis thaliana (also Populus, Nicotiana); SEOR1-YFP lines, flow velocity in single tubes, improved TEM",
"value": "",
"badge": "MEASURED",
"note": "PubMed PMID 22198148, retrieved 14 Oct 2026 (phloem evidence sheet).",
"short": "Froelich et al. 2011",
"pmid": "22198148"
},
"ph.tube.nacreous": {
"claim": "'Nacreous' thick sieve element walls, long used as a diagnostic feature, are artefacts: over 90 % of sieve elements in standard sections show them, transporting tubes in live plants do not, and puncture creates them in under 1 min.",
"cite": "Knoblauch et al. 2020 Plant J 102: 797 to 808",
"doi": "10.1111/tpj.14665",
"measured": "Gerrardanthus macrorhizus; in situ confocal, EM, micropipette puncture",
"value": "artefact % >90; formation time min <1",
"badge": "MEASURED",
"note": "PubMed PMID 31883138, retrieved 14 Oct 2026 (phloem evidence sheet).",
"short": "Knoblauch et al. 2020",
"pmid": "31883138"
},
"ph.tube.Pproteins_role": {
"claim": "Review: the roles of structural P-proteins remain elusive; there is no firm evidence that they stop translocation or defend against aphids in intact plants.",
"cite": "Knoblauch et al. 2014 J Exp Bot 65: 1879 to 1893",
"doi": "10.1093/jxb/eru071",
"measured": "general; review",
"value": "",
"badge": "OPEN QUESTION",
"note": "PubMed PMID 24591057, retrieved 14 Oct 2026 (phloem evidence sheet).",
"short": "Knoblauch et al. 2014",
"pmid": "24591057"
},
"ph.tube.velocity_MRI": {
"claim": "Phloem velocity by MRI was 0.25 to 0.40 mm s−1 across poplar, castor bean, tomato and tobacco, day and night.",
"cite": "Windt et al. 2006 Plant Cell Environ 29: 1715 to 1729",
"doi": "10.1111/j.1365-3040.2006.01544.x",
"measured": "Populus; Ricinus communis; Solanum lycopersicum; Nicotiana tabacum; flow MRI",
"value": "0.25 to 0.4 mm s−1",
"badge": "MEASURED",
"note": "PubMed PMID 16913861, retrieved 14 Oct 2026 (phloem evidence sheet).",
"short": "Windt et al. 2006",
"pmid": "16913861"
},
"ph.tube.velocity_trees": {
"claim": "Meta-analysis of tree phloem transport speed: angiosperm trees 56 cm h−1 on average, gymnosperm trees 22 cm h−1; slower gymnosperm transport is explained by higher sieve element resistance.",
"cite": "Liesche et al. 2015 Tree Physiol 35: 376 to 386",
"doi": "10.1093/treephys/tpv020",
"measured": "18 tree species (anatomy); literature speeds; meta-analysis plus resistance model and TEM",
"value": "angiosperm cm h⁻¹ 56; gymnosperm cm h⁻¹ 22",
"badge": "MEASURED",
"note": "PubMed PMID 25787331, retrieved 14 Oct 2026 (phloem evidence sheet).",
"short": "Liesche et al. 2015",
"pmid": "25787331"
},
"ph.tube.sap_concentration": {
"claim": "Phloem sap sugar concentration averaged 18.2 % across more than 50 experiments in 41 species, 21.1 % in active loaders; flow theory predicts an optimum of 23.5 % if pressure is independent of concentration.",
"cite": "Jensen, Savage & Holbrook 2013 J R Soc Interface 10: 20130055",
"doi": "10.1098/rsif.2013.0055",
"measured": "41 species (literature compilation); compilation plus optimisation model",
"value": "mean all % 18.2; mean active % 21.1; optimum constant P % 23.5; optimum P prop c % 34.5",
"badge": "MEASURED",
"note": "PubMed PMID 23516065, retrieved 14 Oct 2026 (phloem evidence sheet).",
"short": "Jensen, Savage and Holbrook 2013",
"pmid": "23516065"
},
"ph.tube.tall_trees": {
"claim": "Across nine deciduous tree species, phloem hydraulic resistance scales inversely with height because sieve element structure changes along the tree; measured leaf turgor in a mature red oak is enough to drive flow only together with these structural changes.",
"cite": "Savage et al. 2017 Nat Plants 3: 965 to 972",
"doi": "10.1038/s41477-017-0064-y",
"measured": "9 deciduous species; Quercus rubra (turgor); sieve tube anatomy along trees, in situ leaf phloem turgor",
"value": "",
"badge": "MEASURED",
"note": "PubMed PMID 29209083, retrieved 14 Oct 2026 (phloem evidence sheet).",
"short": "Savage et al. 2017",
"pmid": "29209083"
},
"ph.tube.kelp_reversal": {
"claim": "In kelp, pressurising the downstream sieve element reversed flow across sieve plates, satisfying a key Münch requirement; the authors state that no such evidence exists for land plants.",
"cite": "Knoblauch et al. 2016 Ann Bot 117: 599 to 606",
"doi": "10.1093/aob/mcw007",
"measured": "Nereocystis luetkeana (bull kelp); microinjection, dye pulses",
"value": "",
"badge": "OPEN QUESTION",
"note": "PubMed PMID 26929203, retrieved 14 Oct 2026 (phloem evidence sheet).",
"short": "Knoblauch et al. 2016",
"pmid": "26929203"
},
"ph.xp.counterflow": {
"claim": "Münch counterflow: the phloem to xylem flux ratio at night was 0.19 in poplar, 0.37 in castor bean, 0.55 in tobacco and 0.04 in tomato; this fraction of xylem water is used for phloem transport.",
"cite": "Windt et al. 2006 Plant Cell Environ 29: 1715 to 1729",
"doi": "10.1111/j.1365-3040.2006.01544.x",
"measured": "Populus; Ricinus communis; Nicotiana tabacum; Solanum lycopersicum; flow MRI",
"value": "poplar 0.19; castor bean 0.37; tobacco 0.55; tomato 0.04",
"badge": "MEASURED",
"note": "PubMed PMID 16913861, retrieved 14 Oct 2026 (phloem evidence sheet).",
"short": "Windt et al. 2006",
"pmid": "16913861"
},
"ph.xp.coupling_model": {
"claim": "Assimilate transport requires the osmotic pressure at phloem loading sites to exceed the drop in hydrostatic pressure caused by transpiration, so phloem transport competes with transpiration for water; excessive loading raises viscosity and can block transport. A stomatal opening that maximises phloem transport reproduces observed gas exchange.",
"cite": "Nikinmaa et al. 2013 Plant Cell Environ 36: 655 to 669",
"doi": "10.1111/pce.12004",
"measured": "model (Scots pine type parameters); coupled xylem phloem stomata model",
"value": "",
"badge": "MODEL",
"note": "PubMed PMID 22934921, retrieved 14 Oct 2026 (phloem evidence sheet).",
"short": "Nikinmaa et al. 2013",
"pmid": "22934921"
},
"ph.xp.stomata_model": {
"claim": "Model: stomatal behaviour can be understood as maximising photosynthesis, phloem transport and sink use together under the transpiration driven pressure limit.",
"cite": "Hölttä et al. 2017 Tree Physiol 37: 851 to 868",
"doi": "10.1093/treephys/tpx011",
"measured": "model; steady state numerical model",
"value": "",
"badge": "MODEL",
"note": "PubMed PMID 28338800, retrieved 14 Oct 2026 (phloem evidence sheet).",
"short": "Hölttä et al. 2017",
"pmid": "28338800"
},
"ph.xp.bark_osmolality": {
"claim": "Needle and inner bark osmolality tracked xylem water potential closely in Scots pine and Norway spruce; xylem water potential considerably affects the turgor gradient that drives phloem transport, and gravity matters in tall stems.",
"cite": "Paljakka et al. 2017 Plant Cell Environ 40: 2160 to 2173",
"doi": "10.1111/pce.13017",
"measured": "Pinus sylvestris; Picea abies; osmolality of inner bark and needles, xylem water potential",
"value": "",
"badge": "MEASURED",
"note": "PubMed PMID 28671720, retrieved 14 Oct 2026 (phloem evidence sheet).",
"short": "Paljakka et al. 2017",
"pmid": "28671720"
},
"ph.xp.bark_turgor_signal": {
"claim": "Simultaneous bark and xylem diameter records separate a phloem turgor signal that follows photosynthesis daily and responds to drought and rain; the radial phloem to xylem conductance followed water viscosity with temperature.",
"cite": "Mencuccini et al. 2013 New Phytol 198: 1143 to 1154",
"doi": "10.1111/nph.12224",
"measured": "Pinus sylvestris (3 mature trees, Finland); dendrometers on bark and xylem plus model",
"value": "",
"badge": "MEASURED",
"note": "PubMed PMID 23517018, retrieved 14 Oct 2026 (phloem evidence sheet).",
"short": "Mencuccini et al. 2013",
"pmid": "23517018"
},
"ph.xp.rays": {
"claim": "Review: rays (radial parenchyma) connect inner bark and xylem, carry water and carbohydrate radially and give stems a capacitive daily 'pulse'; xylem and phloem act as one interconnected network.",
"cite": "Pfautsch, Hölttä & Mencuccini 2015 Tree Physiol 35: 706 to 722",
"doi": "10.1093/treephys/tpv058",
"measured": "trees (review); review",
"value": "",
"badge": "MEASURED",
"note": "PubMed PMID 26163488, retrieved 14 Oct 2026 (phloem evidence sheet).",
"short": "Pfautsch, Hölttä and Mencuccini 2015",
"pmid": "26163488"
},
"ph.xp.conductivity_ratio": {
"claim": "Norway spruce: phloem conductivity was about 2 % of xylem (outer ring) conductivity; ten times more xylem than phloem is produced each year.",
"cite": "Jyske & Hölttä 2015 New Phytol 205: 102 to 115",
"doi": "10.1111/nph.12973",
"measured": "Picea abies; anatomy scaling along stems",
"value": "phloem over xylem conductivity % 2; xylem to phloem production 10",
"badge": "MEASURED",
"note": "PubMed PMID 25124270, retrieved 14 Oct 2026 (phloem evidence sheet).",
"short": "Jyske and Hölttä 2015",
"pmid": "25124270"
},
"ph.xp.scaling": {
"claim": "Phloem volume, nitrogen and conductance concentrate toward branch and stem tips; modelling indicates Münch flow can supply even the tallest trees.",
"cite": "Hölttä et al. 2013 Front Plant Sci 4: 496",
"doi": "10.3389/fpls.2013.00496",
"measured": "4 species, southern Finland; measurements plus scaling model",
"value": "",
"badge": "MODEL",
"note": "PubMed PMID 24367373, retrieved 14 Oct 2026 (phloem evidence sheet).",
"short": "Hölttä et al. 2013",
"pmid": "24367373"
},
"ph.xp.3D_tree_model": {
"claim": "Coupled cohesion tension and Münch model in a realistic 3D Scots pine crown reproduced observed pressure and sugar gradients.",
"cite": "Nikinmaa, Sievänen & Hölttä 2014 Ann Bot 114: 653 to 666",
"doi": "10.1093/aob/mcu068",
"measured": "Pinus sylvestris (8 year old, model); 3D xylem phloem model",
"value": "",
"badge": "MODEL",
"note": "PubMed PMID 24854169, retrieved 14 Oct 2026 (phloem evidence sheet).",
"short": "Nikinmaa, Sievänen and Hölttä 2014",
"pmid": "24854169"
},
"ph.xp.radial_exchange": {
"claim": "Model: radial water exchange lowers sap viscosity along the tube and raises sugar transport by about 40 % in active loaders and about 20 % in passive loaders, making phloem more resilient under drought.",
"cite": "Nakad et al. 2022 Plant Physiol 189: 2061 to 2071",
"doi": "10.1093/plphys/kiac231",
"measured": "model; 2D transient flow simulations",
"value": "active % 40; passive % 20",
"badge": "MODEL",
"note": "PubMed PMID 35588257, retrieved 14 Oct 2026 (phloem evidence sheet).",
"short": "Nakad et al. 2022",
"pmid": "35588257"
},
"ph.xp.SDV_model": {
"claim": "Whole tree model driven by stem diameter variation simulates phloem turgor, osmotic pressure and Münch counterflow; daily dynamics mostly follow transpiration.",
"cite": "De Schepper & Steppe 2010 J Exp Bot 61: 2083 to 2099",
"doi": "10.1093/jxb/erq018",
"measured": "Quercus robur; Fagus sylvatica; model verified on stem diameter and sap flow",
"value": "",
"badge": "MODEL",
"note": "PubMed PMID 20176887, retrieved 14 Oct 2026 (phloem evidence sheet).",
"short": "De Schepper and Steppe 2010",
"pmid": "20176887"
},
"ph.xp.reviews": {
"claim": "Reviews of xylem phloem interaction and ecology: drought tolerance, reproduction, carbon allocation and biotic interactions all involve phloem physiology.",
"cite": "Savage et al. 2016 Plant Cell Environ 39: 709 to 725",
"doi": "10.1111/pce.12602",
"measured": "general; review",
"value": "",
"badge": "MEASURED",
"note": "PubMed PMID 26147312, retrieved 14 Oct 2026 (phloem evidence sheet).",
"short": "Savage et al. 2016",
"pmid": "26147312"
},
"ph.sink.root_unload": {
"claim": "Phloem unloading in Arabidopsis root tips is convective (mass flow plus diffusion) through plasmodesmata into the phloem pole pericycle via 'funnel plasmodesmata'; solutes leave freely, large proteins leave in pulses ('batch unloading').",
"cite": "Ross-Elliott et al. 2017 eLife 6: e24125",
"doi": "10.7554/eLife.24125",
"measured": "Arabidopsis thaliana; live imaging, 3D EM, modelling",
"value": "",
"badge": "MEASURED",
"note": "PubMed PMID 28230527, retrieved 14 Oct 2026 (phloem evidence sheet).",
"short": "Ross-Elliott et al. 2017",
"pmid": "28230527"
},
"ph.sink.funnel_PD": {
"claim": "Funnel shaped plasmodesmata are found across angiosperm root unloading zones; their geometry sets their resistance to diffusion and flow.",
"cite": "Ostermeyer et al. 2022 Plant J 110: 707 to 719",
"doi": "10.1111/tpj.15697",
"measured": "angiosperms (several); EM, modelling",
"value": "",
"badge": "MEASURED",
"note": "PubMed PMID 35124855, retrieved 14 Oct 2026 (phloem evidence sheet).",
"short": "Ostermeyer et al. 2022",
"pmid": "35124855"
},
"ph.sink.unload_regulation": {
"claim": "Model plus girdling and drought data in four tree species are most consistent with turgor regulated (not sugar regulated) phloem unloading.",
"cite": "Dewar et al. 2022 New Phytol 233: 639 to 654",
"doi": "10.1111/nph.17795",
"measured": "Pinus sylvestris; Betula pendula; Populus tremula; Picea abies (saplings); analytical optimal stomata model compared with experiments",
"value": "",
"badge": "MODEL",
"note": "PubMed PMID 34637543, retrieved 14 Oct 2026 (phloem evidence sheet).",
"short": "Dewar et al. 2022",
"pmid": "34637543"
},
"ph.sink.manifold": {
"claim": "Morning glory data argue against the 'high pressure manifold' model of unloading: small plants make only enough pressure for flow, so either unloading plasmodesmata are very conductive or unloading needs extra energy.",
"cite": "Knoblauch et al. 2016 eLife 5: e15341",
"doi": "10.7554/eLife.15341",
"measured": "Ipomoea nil; as tube.munch_test",
"value": "",
"badge": "OPEN QUESTION",
"note": "PubMed PMID 27253062, retrieved 14 Oct 2026 (phloem evidence sheet).",
"short": "Knoblauch et al. 2016",
"pmid": "27253062"
},
"ph.stress.failure_modes": {
"claim": "Theory review: under drought, phloem could fail by viscosity build up at the source or by loss of phloem turgor; which dominates depends on sieve tube wall permeability. Evidence favours turgor collapse, at least in relatively isohydric plants.",
"cite": "Sevanto 2014 J Exp Bot 65: 1751 to 1759",
"doi": "10.1093/jxb/ert467",
"measured": "general; review of models and evidence",
"value": "",
"badge": "MODEL",
"note": "PubMed PMID 24431155, retrieved 14 Oct 2026 (phloem evidence sheet).",
"short": "Sevanto 2014",
"pmid": "24431155"
},
"ph.stress.three_modes": {
"claim": "Model plus 170 species compilation: carbon starvation, hydraulic failure and phloem transport failure are three possible failure modes; phloem failure arises with low photosynthesis sensitivity and high growth sensitivity to water status.",
"cite": "Mencuccini et al. 2015 New Phytol 208: 396 to 409",
"doi": "10.1111/nph.13461",
"measured": "170 species (trait compilations); steady state xylem phloem model, Bayesian analysis",
"value": "",
"badge": "MODEL",
"note": "PubMed PMID 25988920, retrieved 14 Oct 2026 (phloem evidence sheet).",
"short": "Mencuccini et al. 2015",
"pmid": "25988920"
},
"ph.stress.beech_drought": {
"claim": "Mature beech under three years of throughfall exclusion: phloem transport velocity fell 47 % (20.7 ± 5.8 to 11.0 ± 2.9 cm h−1) and leaf residence time of new sugars rose 46 % (32.1 to 46.9 h); velocity correlated with predawn water potential.",
"cite": "Hesse et al. 2019 Tree Physiol 39: 192 to 200",
"doi": "10.1093/treephys/tpy122",
"measured": "Fagus sylvatica (mature, field); 13CO2 branch labelling, δ13C of stem CO2 efflux",
"value": "V control cm h⁻¹ 20.7; V drought cm h⁻¹ 11.0; V drop % 47; MRT control h 32.1; MRT drought h 46.9",
"badge": "MEASURED",
"note": "PubMed PMID 30388272, retrieved 14 Oct 2026 (phloem evidence sheet).",
"short": "Hesse et al. 2019",
"pmid": "30388272"
},
"ph.stress.eucalypt_K": {
"claim": "Field eucalypts: carbon transfer velocity in the trunk 0.20 to 0.82 m h−1, about twice as high with potassium; throughfall exclusion had little effect except in one tree at midday leaf water potential −2.2 MPa.",
"cite": "Epron et al. 2016 Tree Physiol 36: 6 to 21",
"doi": "10.1093/treephys/tpv090",
"measured": "Eucalyptus grandis (2 year old, field); 13CO2 pulse labelling, trunk CO2 efflux",
"value": "velocity m h⁻¹ 0.2 to 0.82",
"badge": "MEASURED",
"note": "PubMed PMID 26423335, retrieved 14 Oct 2026 (phloem evidence sheet).",
"short": "Epron et al. 2016",
"pmid": "26423335"
},
"ph.stress.heat_recovery": {
"claim": "After heat and hot drought, Scots pine seedlings that had only heat moved new carbon to root respiration in 7.1 h; drought plus heat seedlings took 13.8 h and stored more starch in leaves. Recovery depends on phloem translocation capacity.",
"cite": "Rehschuh et al. 2022 New Phytol 233: 687 to 704",
"doi": "10.1111/nph.17815",
"measured": "Pinus sylvestris (seedlings); 13CO2 canopy pulse labelling, 15N",
"value": "heat h 7.1; drought heat h 13.8",
"badge": "MEASURED",
"note": "PubMed PMID 34668198, retrieved 14 Oct 2026 (phloem evidence sheet).",
"short": "Rehschuh et al. 2022",
"pmid": "34668198"
},
"ph.stress.review_salmon": {
"claim": "Review: phloem responses to drought range from no response to slowdown to possible disruption that threatens survival; data cover too few species.",
"cite": "Salmon et al. 2019 Tree Physiol 39: 173 to 191",
"doi": "10.1093/treephys/tpy153",
"measured": "trees; review",
"value": "",
"badge": "MEASURED",
"note": "PubMed PMID 30726983, retrieved 14 Oct 2026 (phloem evidence sheet).",
"short": "Salmon et al. 2019",
"pmid": "30726983"
},
"ph.stress.anatomy_arid": {
"claim": "Piñon pine and one seed juniper: the desiccation tolerant species needs higher phloem transport capacity, gained through several anatomical routes.",
"cite": "Sevanto et al. 2018 Plant Cell Environ 41: 1551 to 1564",
"doi": "10.1111/pce.13198",
"measured": "Juniperus monosperma; Pinus edulis; synchrotron microCT and light microscopy",
"value": "",
"badge": "MEASURED",
"note": "PubMed PMID 29569276, retrieved 14 Oct 2026 (phloem evidence sheet).",
"short": "Sevanto et al. 2018",
"pmid": "29569276"
},
"ph.recent.maize_K": {
"claim": "2022: a maize sut1 mutant exported only about 4 % of wild type leaf carbon, yet kept phloem pressure near 100 % and sap speed at 50 to 75 % of wild type; extra potassium loading made up the osmotic pressure.",
"cite": "Babst et al. 2022 Nat Plants 8: 171 to 180",
"doi": "10.1038/s41477-022-01098-x",
"measured": "Zea mays; 11C tracer, pressure probes, element mapping, modelling",
"value": "export % of wild type 4; pressure % of wild type 100; speed % of wild type 50 to 75",
"badge": "MEASURED",
"note": "PubMed PMID 35194203, retrieved 14 Oct 2026 (phloem evidence sheet).",
"short": "Babst et al. 2022",
"pmid": "35194203"
},
"ph.recent.anatomy_188": {
"claim": "2025: across 188 woody angiosperms, distance to the stem tip mainly sets sieve element and vessel size; sieve element diameter tracks water availability while vessel size tracks temperature.",
"cite": "Wang et al. 2025 New Phytol 248: 2316 to 2330",
"doi": "10.1111/nph.70578",
"measured": "188 woody angiosperms; anatomy plus phylogenetic SEM",
"value": "species 188",
"badge": "MEASURED",
"note": "PubMed PMID 40955073, retrieved 14 Oct 2026 (phloem evidence sheet).",
"short": "Wang et al. 2025",
"pmid": "40955073"
},
"ph.recent.nacreous_2020": {
"claim": "2020: thick 'nacreous' sieve element walls are wound artefacts (see tube.nacreous).",
"cite": "Knoblauch et al. 2020 Plant J 102: 797 to 808",
"doi": "10.1111/tpj.14665",
"measured": "Gerrardanthus macrorhizus; see tube.nacreous",
"value": "",
"badge": "MEASURED",
"note": "PubMed PMID 31883138, retrieved 14 Oct 2026 (phloem evidence sheet).",
"short": "Knoblauch et al. 2020",
"pmid": "31883138"
},
"ph.recent.beech_2019": {
"claim": "2019: repeated summer drought halved phloem velocity in mature beech (see stress.beech_drought).",
"cite": "Hesse et al. 2019 Tree Physiol 39: 192 to 200",
"doi": "10.1093/treephys/tpy122",
"measured": "Fagus sylvatica; see stress.beech_drought",
"value": "",
"badge": "MEASURED",
"note": "PubMed PMID 30388272, retrieved 14 Oct 2026 (phloem evidence sheet).",
"short": "Hesse et al. 2019",
"pmid": "30388272"
},
"ph.oq.tall_passive": {
"claim": "How do trees that load passively build enough pressure to push sugar tens of meters? (structure changes with height, Savage 2017; passive loading can reach about 1 MPa in a device, Comtet 2017; Turgeon 2010 'The puzzle of phloem pressure').",
"cite": "Savage et al. 2017 Nat Plants; Comtet et al. 2017 Nat Plants; Turgeon 2010 Plant Physiol 154: 578 to 581",
"doi": "10.1038/s41477-017-0064-y",
"measured": "trees; synthesis",
"value": "",
"badge": "OPEN QUESTION",
"note": "Also: doi 10.1104/pp.110.161679. PubMed PMID 29209083; 28319082; 20921188, retrieved 14 Oct 2026 (phloem evidence sheet).",
"short": "Savage et al. 2017",
"pmid": "29209083; 28319082; 20921188",
"doi2": "10.1038/nplants.2017.32"
},
"ph.oq.failure_mode": {
"claim": "When drought stops the phloem, is it turgor collapse or a viscous jam at the source, and does it differ between isohydric and anisohydric plants?",
"cite": "Sevanto 2014 J Exp Bot; Mencuccini et al. 2015 New Phytol",
"doi": "10.1093/jxb/ert467",
"measured": "general; synthesis",
"value": "",
"badge": "OPEN QUESTION",
"note": "PubMed PMID 24431155; 25988920, retrieved 14 Oct 2026 (phloem evidence sheet).",
"short": "Sevanto 2014",
"pmid": "24431155; 25988920",
"doi2": "10.1111/nph.13461"
},
"ph.oq.recovery": {
"claim": "How fast does phloem transport recover after drought and heat, and does slow recovery limit regrowth?",
"cite": "Rehschuh et al. 2022 New Phytol; Salmon et al. 2019 Tree Physiol",
"doi": "10.1111/nph.17815",
"measured": "Pinus sylvestris; trees; synthesis",
"value": "",
"badge": "OPEN QUESTION",
"note": "PubMed PMID 34668198; 30726983, retrieved 14 Oct 2026 (phloem evidence sheet).",
"short": "Rehschuh et al. 2022",
"pmid": "34668198; 30726983",
"doi2": "10.1093/treephys/tpy153"
},
"ph.oq.almond_loading": {
"claim": "Does almond load sorbitol passively like apple, or mixed like peach? No almond phloem loading study was retrieved.",
"cite": "Reidel et al. 2009 Plant Physiol; Nadwodnik & Lohaus 2008 Planta",
"doi": "10.1104/pp.108.134791",
"measured": "Prunus dulcis; none retrieved",
"value": "",
"badge": "OPEN QUESTION",
"note": "PubMed PMID 19129415; 18188589, retrieved 14 Oct 2026 (phloem evidence sheet).",
"short": "Reidel et al. 2009",
"pmid": "19129415; 18188589",
"doi2": "10.1007/s00425-007-0682-0"
},
"ph.oq.unloading": {
"claim": "Is unloading into sinks set by phloem turgor or by sugar concentration, and how much energy does it need?",
"cite": "Dewar et al. 2022 New Phytol; Knoblauch et al. 2016 eLife",
"doi": "10.1111/nph.17795",
"measured": "general; synthesis",
"value": "",
"badge": "OPEN QUESTION",
"note": "PubMed PMID 34637543; 27253062, retrieved 14 Oct 2026 (phloem evidence sheet).",
"short": "Dewar et al. 2022",
"pmid": "34637543; 27253062",
"doi2": "10.7554/eLife.15341"
},
"ph.oq.Pprotein": {
"claim": "What do P-proteins do in an intact, transporting sieve tube?",
"cite": "Knoblauch et al. 2014 J Exp Bot 65: 1879 to 1893",
"doi": "10.1093/jxb/eru071",
"measured": "general; review",
"value": "",
"badge": "OPEN QUESTION",
"note": "PubMed PMID 24591057, retrieved 14 Oct 2026 (phloem evidence sheet).",
"short": "Knoblauch et al. 2014",
"pmid": "24591057"
}
};
    var src = {
"10.1073/pnas.0902279106": "Rennie & Turgeon (2009) PNAS 106: 14162 to 14167",
"10.1016/j.pbi.2018.01.009": "Zhang & Turgeon (2018) Curr Opin Plant Biol 43: 71 to 75",
"10.1126/science.1213351": "Chen et al. (2012) Science 335: 207 to 211",
"10.1007/s00709-010-0240-7": "Davidson, Keller & Turgeon (2011) Protoplasma 248: 153 to 163",
"10.1104/pp.111.184820": "Fu et al. (2011) Plant Physiol 157: 1518 to 1527",
"10.1104/pp.114.245845": "Zhang et al. (2014) Plant Physiol 166: 306 to 313",
"10.1104/pp.16.01041": "Comtet, Turgeon & Stroock (2017) Plant Physiol 175: 904 to 915",
"10.1038/nplants.2017.32": "Comtet et al. (2017) Nat Plants 3: 17032",
"10.1104/pp.102.016725": "Gao et al. (2003) Plant Physiol 131: 1566 to 1575",
"10.1007/s00425-007-0682-0": "Nadwodnik & Lohaus (2008) Planta 227: 1079 to 1089",
"10.1104/pp.108.134791": "Reidel et al. (2009) Plant Physiol 149: 1601 to 1608",
"10.1073/pnas.0605873103": "Teo et al. (2006) PNAS 103: 18842 to 18847",
"10.1104/pp.103.036632": "Zhang et al. (2004) Plant Physiol 135: 574 to 586",
"10.1093/plphys/kiad226": "Meng et al. (2023) Plant Physiol 192: 2123 to 2142",
"10.7554/eLife.15341": "Knoblauch et al. (2016) eLife 5: e15341",
"10.1105/tpc.109.070094": "Mullendore et al. (2010) Plant Cell 22: 579 to 593",
"10.3389/fpls.2012.00151": "Jensen et al. (2012) Front Plant Sci 3: 151",
"10.1016/j.jplph.2022.153672": "Peters & Knoblauch (2022) J Plant Physiol 272: 153672",
"10.1111/jipb.12532": "Knoblauch & Peters (2017) J Integr Plant Biol 59: 292 to 310",
"10.1073/pnas.2112755119": "Liu et al. (2022) PNAS 119: e2112755119",
"10.1104/pp.106.085803": "Martens et al. (2006) Plant Physiol 142: 471 to 480",
"10.1105/tpc.111.093179": "Froelich et al. (2011) Plant Cell 23: 4428 to 4445",
"10.1111/tpj.14665": "Knoblauch et al. (2020) Plant J 102: 797 to 808",
"10.1093/jxb/eru071": "Knoblauch et al. (2014) J Exp Bot 65: 1879 to 1893",
"10.1111/j.1365-3040.2006.01544.x": "Windt et al. (2006) Plant Cell Environ 29: 1715 to 1729",
"10.1093/treephys/tpv020": "Liesche et al. (2015) Tree Physiol 35: 376 to 386",
"10.1098/rsif.2013.0055": "Jensen, Savage & Holbrook (2013) J R Soc Interface 10: 20130055",
"10.1038/s41477-017-0064-y": "Savage et al. (2017) Nat Plants 3: 965 to 972",
"10.1093/aob/mcw007": "Knoblauch et al. (2016) Ann Bot 117: 599 to 606",
"10.1111/pce.12004": "Nikinmaa et al. (2013) Plant Cell Environ 36: 655 to 669",
"10.1093/treephys/tpx011": "Hölttä et al. (2017) Tree Physiol 37: 851 to 868",
"10.1111/pce.13017": "Paljakka et al. (2017) Plant Cell Environ 40: 2160 to 2173",
"10.1111/nph.12224": "Mencuccini et al. (2013) New Phytol 198: 1143 to 1154",
"10.1093/treephys/tpv058": "Pfautsch, Hölttä & Mencuccini (2015) Tree Physiol 35: 706 to 722",
"10.1111/nph.12973": "Jyske & Hölttä (2015) New Phytol 205: 102 to 115",
"10.3389/fpls.2013.00496": "Hölttä et al. (2013) Front Plant Sci 4: 496",
"10.1093/aob/mcu068": "Nikinmaa, Sievänen & Hölttä (2014) Ann Bot 114: 653 to 666",
"10.1093/plphys/kiac231": "Nakad et al. (2022) Plant Physiol 189: 2061 to 2071",
"10.1093/jxb/erq018": "De Schepper & Steppe (2010) J Exp Bot 61: 2083 to 2099",
"10.1111/pce.12602": "Savage et al. (2016) Plant Cell Environ 39: 709 to 725",
"10.7554/eLife.24125": "Ross-Elliott et al. (2017) eLife 6: e24125",
"10.1111/tpj.15697": "Ostermeyer et al. (2022) Plant J 110: 707 to 719",
"10.1111/nph.17795": "Dewar et al. (2022) New Phytol 233: 639 to 654",
"10.1093/jxb/ert467": "Sevanto (2014) J Exp Bot 65: 1751 to 1759",
"10.1111/nph.13461": "Mencuccini et al. (2015) New Phytol 208: 396 to 409",
"10.1093/treephys/tpy122": "Hesse et al. (2019) Tree Physiol 39: 192 to 200",
"10.1093/treephys/tpv090": "Epron et al. (2016) Tree Physiol 36: 6 to 21",
"10.1111/nph.17815": "Rehschuh et al. (2022) New Phytol 233: 687 to 704",
"10.1093/treephys/tpy153": "Salmon et al. (2019) Tree Physiol 39: 173 to 191",
"10.1111/pce.13198": "Sevanto et al. (2018) Plant Cell Environ 41: 1551 to 1564",
"10.1038/s41477-022-01098-x": "Babst et al. (2022) Nat Plants 8: 171 to 180",
"10.1111/nph.70578": "Wang et al. (2025) New Phytol 248: 2316 to 2330",
"10.1104/pp.110.161679": "Turgeon (2010) Plant Physiol 154: 578 to 581"
};
    Object.keys(ev).forEach(function (k) { if (!E[k]) E[k] = ev[k]; });
    Object.keys(src).forEach(function (k) { if (!S[k]) S[k] = src[k]; });
  })(PP.evidence, PP.sources);
  /* SHEET END */
  if (typeof module !== 'undefined' && module.exports) module.exports = PP;
})(typeof window !== 'undefined' ? window : globalThis);

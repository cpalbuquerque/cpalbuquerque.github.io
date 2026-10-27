/* The Water Path v8: engine.js
   One shared state, one soil to air solver. No DOM access at load.
   Every constant is a param {v, units, src, doi, status, badge, note}.
   `status` is copied from SPEC.json sci.rows; `badge` is the on screen label. */
(function () {
  'use strict';
  var G = (typeof window !== 'undefined') ? window : (typeof globalThis !== 'undefined' ? globalThis : this);
  var WP = G.WP || {};
  G.WP = WP;

  var MINUS = '−';

  // ---------------------------------------------------------------- params
  function P(v, units, src, doi, status, badge, note) {
    return { v: v, units: units, src: src, doi: doi || 'none', status: status, badge: badge, note: note || '' };
  }
  var DOI = {
    alb2020: '10.1093/jxb/eraa392',
    alvarez2022: '10.3389/fpls.2022.974050',
    hochberg2016: '10.1111/pce.12688',
    scoffoni2023: '10.1111/nph.19069',
    pammenter1998: '10.1093/treephys/18.8-9.589',
    murray1967: '10.1175/1520-0450(1967)006<0203:otcosv>2.0.co;2',
    buckley2015: '10.1111/pce.12372',
    tornroth2006: '10.1038/nature04316',
    grunwald2021: '10.1111/tpj.15235',
    grunwald2022: '10.1093/plcell/koac089',
    preprint2026: '10.64898/2026.01.29.702672',
    honert1948: '10.1039/df9480300146',
    corso2020: '10.1111/pce.13722',
    charrier2016: '10.1104/pp.16.01079',
    cuneo2016: '10.1104/pp.16.00923',
    duursma2019: '10.1111/nph.15395',
    sackHolbrook2006: '10.1146/annurev.arplant.56.032604.144141',
    brodersen2013: '10.1104/pp.112.212712',
    scoffoni2017: '10.1104/pp.16.01643',
    buckley2015pp: '10.1104/pp.15.00731',
    sack2002: '10.1093/jxb/erf069',
    shatil2011: '10.1111/j.1365-313x.2011.04576.x',
    sade2014: '10.1104/pp.114.248633',
    torne2024: '10.1093/plphys/kiae226'
  };
  var SRC = {
    alb2020: 'Albuquerque, Scoffoni, Brodersen, Buckley, Sack & McElrone 2020 J Exp Bot 71:7286',
    alvarez2022: 'Álvarez-Maldini et al. 2022 Front Plant Sci 13:974050',
    hochberg2016: 'Hochberg, Albuquerque et al. 2016 Plant Cell Environ 39:1886 (MRI, Vitis vinifera cv. Syrah)',
    charrier2016: 'Charrier et al. 2016 Plant Physiol 172:1657 (microCT, intact Cabernet Sauvignon)',
    cuneo2016: 'Cuneo, Knipfer, Brodersen & McElrone 2016 Plant Physiol 172:2075 (grapevine roots, microCT)',
    scoffoni2023: 'Scoffoni, Albuquerque, Buckley & Sack 2023 New Phytol 239:2099',
    preprint2026: 'Albuquerque, Momayyezi, Agüero et al. 2026 bioRxiv (Chardonnay, CRISPR), PREPRINT, not peer reviewed'
  };

  var params = {
    phys: {
      R: P(8.314, 'J mol⁻¹ K⁻¹', 'Physical constant', 'none (physical constant)', 'unverified', 'DERIVED'),
      Vw: P(18.05e-6, 'm³ mol⁻¹', 'Partial molal volume of water near 20 °C', 'none (physical constant)', 'unverified', 'DERIVED'),
      rhoG: P(0.0098, 'MPa m⁻¹', 'ρ = 1000 kg m⁻³, g = 9.8 m s⁻²', 'none (physical constant)', 'unverified', 'DERIVED',
        'To hold water at height h the pressure term must be ρgh more negative.'),
      Patm: P(101.3, 'kPa', 'Sea level; perfect coupling, no boundary layer', 'none', 'illustrative', 'ILLUSTRATIVE',
        'E assumes perfect coupling to the air. Wind does not enter E in this model.'),
      tetens: P([0.6108, 17.27, 237.3], 'kPa; dimensionless; °C', 'Tetens form, Murray 1967 J Appl Meteorol 6:203; FAO 56 Eq. 11', DOI.murray1967, 'unverified', 'DERIVED',
        'Leaf temperature is taken equal to air temperature (model assumption).'),
      lambda: P(44, 'kJ mol⁻¹', 'Latent heat of vaporisation near 25 °C', 'none (physical constant)', 'unverified', 'DERIVED',
        'Evaporation absorbs this heat and cools the leaf.')
    },
    crops: {
      grape: {
        label: 'Grapevine',
        psi50: P(-0.60, 'MPa', SRC.alb2020 + ', Table 2 (P50gs, Cabernet Sauvignon, curve from Ψ = 0)', DOI.alb2020, 'verified', 'VERIFIED',
          'Stomatal half closure, Table 2: −0.60 MPa (Cabernet Sauvignon), −0.53 MPa (Chardonnay); P80gs −1.21 and −1.17 MPa. The paper fits an exponential (Fig. 6); the Weibull here is an approximation through its P50 and P80. A different quantity from petiole and stem P50.'),
        form: 'weibull',
        wb: P(0.81, 'MPa', 'Weibull scale b in fPsi = exp(−(−Ψ ÷ b)^c), fitted so fPsi = 0.50 at −0.60 MPa and 0.20 at −1.2 MPa', DOI.alb2020, 'illustrative', 'DERIVED',
          'Logistic approximation of the measured exponential fit (Albuquerque et al. 2020 Fig. 6, Cabernet Sauvignon), anchored to its Table 2 values: half closure at −0.60 MPa and 80 % closure at −1.21 MPa (both MEASURED). fPsi = 1 at 0 MPa, so a fully hydrated vine is not partly closed.'),
        wc: P(1.22, 'dimensionless', 'Weibull shape c (same fit)', DOI.alb2020, 'illustrative', 'DERIVED'),
        k: P(2.3, 'MPa⁻¹', 'Not used for grapevine since the Weibull form replaced the logistic', DOI.alb2020, 'illustrative', 'ILLUSTRATIVE'),
        gsMax: P(0.36, 'mol m⁻² s⁻¹', 'Teaching constant', 'none', 'illustrative', 'ILLUSTRATIVE'),
        Kplant: P(8, 'mmol m⁻² s⁻¹ MPa⁻¹', 'Teaching constant, about 8 (raised from 5) so a well watered vine reads as unstressed near −0.45 MPa at midday; to be sanity checked against field vines', 'none', 'illustrative', 'ILLUSTRATIVE',
          'Leaf share of 1/Kplant kept at 0.35 (leaf xylem 0.10, bundle sheath 0.15, mesophyll 0.10). Sack & Holbrook 2006: leaves are ≥ 30 % of whole plant resistance.'),
        height: P(1.5, 'm', 'Leaf height for the gravity term', 'none', 'illustrative', 'ILLUSTRATIVE'),
        P50stem: P(-1.90, 'MPa', SRC.hochberg2016, DOI.hochberg2016, 'verified', 'VERIFIED', 'Stem P50 (MRI). Never merged with stomatal ψ50.'),
        P50petiole: P(-1.54, 'MPa', SRC.hochberg2016, DOI.hochberg2016, 'verified', 'VERIFIED', 'Petiole P50 (MRI, conductive xylem area).'),
        sStem: P(87, '% MPa⁻¹', SRC.hochberg2016 + ': slope at the inflexion, stem (in vivo MRI, Syrah)', DOI.hochberg2016, 'verified', 'VERIFIED',
          'Measured slope from the same study as the P50, so the curve is one study (replaces the earlier hybrid with Charrier et al. 2016). a = s ÷ 25 = 3.48 MPa⁻¹.'),
        sPetiole: P(159, '% MPa⁻¹', SRC.hochberg2016 + ': slope at the inflexion, petiole (in vivo MRI, Syrah)', DOI.hochberg2016, 'verified', 'VERIFIED',
          'a = s ÷ 25 = 6.36 MPa⁻¹. The petiole curve is steeper and earlier than the stem curve; Hochberg et al. 2016 do not read this as a hydraulic fuse.'),
        P50root: P(-1.8, 'MPa', SRC.cuneo2016 + ': fine root xylem P50 −1.8 MPa; coarse roots −3.5 MPa', DOI.cuneo2016, 'verified', 'MEASURED',
          'Applied to the root xylem half of the root resistance at the root Ψ. Cortical lacunae (from about −0.6 MPa) are not modelled.'),
        koxP50: P(-0.50, 'MPa', 'Logistic anchored so outside xylem conductance is 80 % lost at −0.71 MPa (P80 Kleaf, Cabernet Sauvignon, Table 2) in ' + SRC.alb2020, DOI.alb2020, 'illustrative', 'ILLUSTRATIVE',
          'Anchor from Albuquerque et al. 2020 Table 2: P80 Kleaf −0.71 MPa (Cabernet Sauvignon), −0.67 MPa (Chardonnay), before leaf xylem embolism. Evaluated at the vein Ψ, so the model loses 80 % only near −1.2 MPa of leaf Ψ, later than measured. Curve shape illustrative.'),
        koxA: P(6.93, 'MPa⁻¹', 'Slope chosen so 80 % is lost at −0.71 MPa of vein Ψ', DOI.alb2020, 'illustrative', 'ILLUSTRATIVE')
      },
      almond: {
        label: 'Almond',
        psi50: P(-1.4, 'MPa', 'Chosen so the model reaches 90 % closure near −2.0 MPa, inside the ' + SRC.alvarez2022 + ' Ψgs90 range (−1.72 to −2.25 MPa)', DOI.alvarez2022, 'illustrative', 'ILLUSTRATIVE',
          'No published almond ψ50 was found. Anchored to Ψgs90 by cultivar: Avijor −1.72, Isabelona −2.25, Soleta −2.14 MPa.'),
        k: P(3.7, 'MPa⁻¹', '90 % closed near −2.0 MPa, inside the Ψgs90 range', DOI.alvarez2022, 'illustrative', 'ILLUSTRATIVE'),
        gsMax: P(0.30, 'mol m⁻² s⁻¹', 'Downhill Water (teaching constant)', 'none', 'illustrative', 'ILLUSTRATIVE'),
        Kplant: P(4, 'mmol m⁻² s⁻¹ MPa⁻¹', 'Downhill Water crop table (teaching constant)', 'none', 'illustrative', 'ILLUSTRATIVE'),
        height: P(4, 'm', 'Leaf height for the gravity term', 'none', 'illustrative', 'ILLUSTRATIVE'),
        P50stem: P(-3.4, 'MPa', SRC.alvarez2022 + ': Avijor −2.97, Isabelona −3.80, Soleta −3.73 MPa (air injection)', DOI.alvarez2022, 'verified', 'VERIFIED',
          'Model uses −3.4 MPa, between cultivars. Air injection on excised stems, a different method from the grapevine MRI.'),
        P50petiole: P(null, 'MPa', 'Not built: no almond petiole value on the sheet', 'none', 'unverified', 'ILLUSTRATIVE',
          'Petiole uses the stem value −3.4 MPa in the model (ILLUSTRATIVE assumption).'),
        sStem: P(50, '% MPa⁻¹', 'Teaching slope', 'none', 'illustrative', 'ILLUSTRATIVE'),
        sPetiole: P(50, '% MPa⁻¹', 'Teaching slope', 'none', 'illustrative', 'ILLUSTRATIVE'),
        P50root: P(null, 'MPa', 'not built', 'none', 'unverified', 'ILLUSTRATIVE', 'No almond root P50 on the sheet: root resistance is not inflated.'),
        koxP50: P(-1.5, 'MPa', 'Teaching constant; no almond K-leaf vulnerability value on the sheet', 'none', 'illustrative', 'ILLUSTRATIVE'),
        koxA: P(4, 'MPa⁻¹', 'Teaching constant', 'none', 'illustrative', 'ILLUSTRATIVE')
      },
      romaine: {
        label: 'Romaine lettuce',
        psi50: P(-1.1, 'MPa', 'Downhill Water; no published value found for Lactuca sativa', 'none', 'illustrative', 'ILLUSTRATIVE', 'Not found in the literature: print “not found” next to the curve.'),
        k: P(6, 'MPa⁻¹', 'Downhill Water', 'none', 'illustrative', 'ILLUSTRATIVE'),
        gsMax: P(0.45, 'mol m⁻² s⁻¹', 'Downhill Water (teaching constant)', 'none', 'illustrative', 'ILLUSTRATIVE'),
        Kplant: P(8, 'mmol m⁻² s⁻¹ MPa⁻¹', 'Downhill Water crop table (teaching constant)', 'none', 'illustrative', 'ILLUSTRATIVE'),
        height: P(0.25, 'm', 'Leaf height for the gravity term', 'none', 'illustrative', 'ILLUSTRATIVE'),
        P50stem: P(null, 'MPa', 'not found', 'none', 'unverified', 'ILLUSTRATIVE', 'Lettuce xylem P50 not found. PLC is null and resistance is not inflated.'),
        P50petiole: P(null, 'MPa', 'not found', 'none', 'unverified', 'ILLUSTRATIVE', 'Lettuce xylem P50 not found. PLC is null and resistance is not inflated.'),
        sStem: P(50, '% MPa⁻¹', 'unused (no P50)', 'none', 'illustrative', 'ILLUSTRATIVE'),
        sPetiole: P(50, '% MPa⁻¹', 'unused (no P50)', 'none', 'illustrative', 'ILLUSTRATIVE'),
        P50root: P(null, 'MPa', 'not found', 'none', 'unverified', 'ILLUSTRATIVE'),
        koxP50: P(-0.8, 'MPa', 'Teaching constant; no lettuce K-leaf vulnerability value found', 'none', 'illustrative', 'ILLUSTRATIVE'),
        koxA: P(6, 'MPa⁻¹', 'Teaching constant', 'none', 'illustrative', 'ILLUSTRATIVE')
      }
    },
    // split of 1/Kplant at the reference state (PLC 0, Pf = Pf_ref)
    split: {
      root: P(0.35, 'fraction of 1/Kplant', 'Teaching split', 'none', 'illustrative', 'ILLUSTRATIVE'),
      stem: P(0.25, 'fraction of 1/Kplant', 'Teaching split', 'none', 'illustrative', 'ILLUSTRATIVE'),
      petiole: P(0.05, 'fraction of 1/Kplant', 'Teaching split', 'none', 'illustrative', 'ILLUSTRATIVE'),
      leafX: P(0.10, 'fraction of 1/Kplant', 'Teaching split', 'none', 'illustrative', 'ILLUSTRATIVE'),
      bs: P(0.15, 'fraction of 1/Kplant', 'Teaching split; outside xylem 0.25 = bundle sheath 0.15 + mesophyll 0.10', 'none', 'illustrative', 'ILLUSTRATIVE',
        'Chosen so the Pf effect is visible; Buckley et al. 2015 (Plant Physiol) put the sheath share of outside xylem resistance lower, a minority. Leaf share of plant resistance: ≥ 30 % (Sack & Holbrook 2006); wheat 26 to 33 % (Corso et al. 2020).'),
      mes: P(0.10, 'fraction of 1/Kplant', 'Teaching split. At tier 3 it is split into spongy mesophyll (in series) and palisade (a side branch that buffers)', 'none', 'illustrative', 'ILLUSTRATIVE'),
      rootXylem: P(0.5, 'fraction of root R', 'Share of root resistance that sits in root xylem and can embolise; the rest is the radial path', 'none', 'illustrative', 'ILLUSTRATIVE'),
      palisade: P(2.0, '× R_spongy', 'Side branch resistance into the palisade, which carries no net flow at steady state (a buffer)', DOI.buckley2015pp, 'illustrative', 'ILLUSTRATIVE',
        'Yaaran et al. 2023: spongy mesophyll Pf fell with ABA while palisade Pf stayed low; the palisade acts as a hydraulic buffer.')
    },
    stomata: {
      fLightHalf: P(200, 'µmol m⁻² s⁻¹', 'fLight = PPFD ÷ (PPFD + 200)', 'none', 'illustrative', 'ILLUSTRATIVE'),
      form: P('weibull (grapevine) or logistic (almond, romaine)', 'none', 'grapevine fPsi = exp(−(−Ψ ÷ b)^c); others fPsi = 1 ÷ (1 + exp(−k (Ψ − ψ50))); gs = gsMax ÷ 2 × fLight at Ψleaf = ψ50. In this model gs responds to leaf Ψ only, a hydraulic shortcut.', 'none', 'illustrative', 'ILLUSTRATIVE'),
      gmin: P(0.005, 'mol m⁻² s⁻¹', 'Minimum leaf conductance: cuticle plus stomata that do not close fully. Kept apart from gs; E = (gs + gmin) VPD ÷ Patm', DOI.duursma2019, 'illustrative', 'ILLUSTRATIVE',
        'Value is a teaching constant: no crop value and no compiled median was retrieved. Duursma et al. 2019: gmin is highly variable and responds to growing conditions.')
    },
    kox: {
      form: P('fKox = 1 ÷ (1 + exp(a (ψ50,Kox − Ψ)))', 'none', 'Outside xylem conductance falls as the leaf dries: R_ox = (R_bs + R_mes) ÷ max(0.05, fKox(Ψ)), Ψ taken in the leaf veins', 'none', 'illustrative', 'ILLUSTRATIVE',
        'Ψ is read in the leaf veins, which keeps the model stable. A pressure chamber leaf Ψ (the end of the outside xylem path) sits about 0.14 MPa below the vein Ψ at the default midday (0.20 MPa below the stem). Model shape ILLUSTRATIVE: its 80 % loss of K-leaf falls near −1.05 MPa of leaf Ψ, later than the measured −0.7 MPa. Re-anchoring at leaf Ψ ran away to the floor in testing (see tier 3). The knockout does not change this curve (K-leaf vulnerability was similar across lines in the preprint).'),
      floor: P(0.05, 'fraction', 'Floor on fKox', 'none', 'illustrative', 'ILLUSTRATIVE'),
      leafP50: P(-0.48, 'MPa', 'Re-anchor at leaf Ψ (tier 3 what if): 80 % lost near −0.66 MPa of leaf Ψ', DOI.alb2020, 'illustrative', 'ILLUSTRATIVE'),
      leafA: P(7.8, 'MPa⁻¹', 'Slope of the leaf Ψ re-anchor', DOI.alb2020, 'illustrative', 'ILLUSTRATIVE',
        'In testing, with the curve read at leaf Ψ, the solver converges but a well watered midday vine runs down to the floor (Kleaf about 7 % of max, gs about 21 %). A steady state model cannot hold a curve this steep at the leaf; bench dehydration curves are not steady states.'),
      at: P('vein', 'none', 'Where fKox reads Ψ: vein (stable, default) or leaf (faithful to the anchor; runs away in testing)', 'none', 'illustrative', 'ILLUSTRATIVE')
    },
    plc: {
      s: P(50, '% MPa⁻¹', 'Default slope at P50 where no organ slope exists (almond, root); grapevine stem and petiole use the measured slopes of Hochberg et al. 2016 (87 and 159 % MPa⁻¹)', DOI.hochberg2016, 'illustrative', 'ILLUSTRATIVE'),
      form: P('PLC = 100 ÷ (1 + exp(a (Ψ − P50))), a = s ÷ 25', '%', 'Pammenter & Vander Willigen 1998 Tree Physiol 18:589', DOI.pammenter1998, 'verified', 'VERIFIED'),
      floor: P(0.02, 'fraction', 'R = R0 ÷ max(0.02, 1 − PLC ÷ 100)', 'none', 'illustrative', 'ILLUSTRATIVE')
    },
    gate: {
      PF_LIPID: P(20, 'µm s⁻¹', 'Gates for Water engine', 'none', 'illustrative', 'ILLUSTRATIVE'),
      PF_CH: P(180, 'µm s⁻¹', 'Gates for Water engine', 'none', 'illustrative', 'ILLUSTRATIVE'),
      PF_REF: P(189.3, 'µm s⁻¹', 'Pf of the default gate state (phosphorylated, pH 7.2, low Ca²⁺, red + blue light at full sun), so K-max is the default leaf near 0 MPa', 'none', 'illustrative', 'ILLUSTRATIVE'),
      blueHalf: P(200, 'µmol m⁻² s⁻¹', 'fBlue = fRedOnly + (1 − fRedOnly) × PPFD ÷ (PPFD + 200) under red + blue; fRedOnly under red alone or in darkness', 'none', 'illustrative', 'ILLUSTRATIVE',
        'Form illustrative; the direction (more blue photons, more sheath acidification, higher Pf) is from Grunwald et al. 2021, 2022 (Arabidopsis). No light, no blue signal.'),
      phosFloor: P(0.25, 'dimensionless', 'fPhos = 0.25 + 0.75 phos', 'none', 'illustrative', 'ILLUSTRATIVE'),
      pKa: P(6.6, 'pH', 'fpH = 1 ÷ (1 + 10^(2 (6.6 − pH))); loop D His193 (SoPIP2;1 numbering) closes the pore at low cytosolic pH', DOI.tornroth2006, 'illustrative', 'ILLUSTRATIVE',
        'Direction verified (Törnroth-Horsefield et al. 2006); midpoint and steepness illustrative.'),
      floodRoot: P(4, '× R_root', 'Flooded roots: anoxia acidifies the cytosol and closes root aquaporins, so root resistance rises (here ×4)', '10.1038/nature01853', 'illustrative', 'ILLUSTRATIVE',
        'Direction from Tournaire-Roux et al. 2003 (Arabidopsis roots under anoxia); the size is invented.'),
      fCaHigh: P(0.45, 'dimensionless', 'High cytosolic Ca²⁺ at the gate lowers open probability (in vitro: purified membranes and vesicles)', 'none', 'illustrative', 'ILLUSTRATIVE',
        'In vitro direction (Verdoucq et al. 2008; Alleva et al. 2006). In the Arabidopsis bundle sheath, the blue light rise in Kleaf required raised cytosolic Ca²⁺ (Torne-Srivastava et al. 2024): which wins in a leaf is an open question.'),
      fABA: P(0.6, '× channel term', 'Xylem fed ABA lowers bundle sheath Pf (and Kleaf) and blocks the blue light activation of the sheath H⁺ pump', DOI.shatil2011, 'illustrative', 'ILLUSTRATIVE',
        'Direction from Shatil-Cohen, Attia & Moshelion 2011 (Arabidopsis: ABA in the xylem lowered Kleaf and bundle sheath protoplast Pf; ABA on the blade closed stomata without lowering Kleaf) and Torne-Srivastava et al. 2024 (ABA inhibits the blue light activated pump). Size invented.'),
      fABAgs: P(0.4, '× gsMax', 'ABA on the leaf blade closes the stomata; in this model it acts on the guard cells only', DOI.shatil2011, 'illustrative', 'ILLUSTRATIVE',
        'Direction from Shatil-Cohen et al. 2011; size invented. In a real leaf, ABA arriving in the xylem also reaches the guard cells; the model keeps the two sites apart so each effect can be seen alone.'),
      expr: P(1, 'relative PIP abundance', 'How many PIP channels the bundle sheath plasma membrane carries, relative to the default leaf (gene expression, trafficking and turnover together). Multiplies the channel term of Pf', DOI.sade2014, 'illustrative', 'ILLUSTRATIVE',
        'Direction from Sade et al. 2014 (silencing PIP1 genes only in the bundle sheath lowered Kleaf and cell Pf, Arabidopsis). Treating Pf as proportional to channel number is a teaching simplification.'),
      fRedOnly: P(0.45, 'dimensionless', 'Red alone: less bundle sheath sap acidification. Direction from Grunwald et al. 2021, 2022 (Arabidopsis); size illustrative', DOI.grunwald2022, 'illustrative', 'ILLUSTRATIVE',
        'For scale: without blue light, walnut Kleaf was about 60 % lower (Ben Baaziz et al. 2012, Tree Physiology 32: 423). The model is not fitted to that number.')
    },
    ko: {
      crops: ['grape'],
      shift: P(-0.25, 'MPa', 'PIP2;1 knockout (grapevine only) shifts stomatal ψ50 more negative: stomata close later', DOI.preprint2026, 'illustrative', 'ILLUSTRATIVE',
        'Direction from ' + SRC.preprint2026 + ': mutants kept higher gs and photosynthesis; Kleaf vulnerability similar across lines. The size of the shift is illustrative. The knockout does not change Pf or the Kleaf vulnerability curve in this model.'),
      source: P('Kleaf vulnerability unchanged; stomata close later', 'qualitative', SRC.preprint2026, DOI.preprint2026, 'verified', 'PREPRINT')
    },
    partition: {
      apo: P(0.80, 'relative conductance at nominal parameters', 'Buckley 2015 Plant Cell Environ 38: 7: apoplastic 72 to 88 % of conductance outside the bundle sheath (ΔT = 0, wall 0.3 µm); 14.0 to 99.8 % across parameter values', DOI.buckley2015, 'verified', 'VERIFIED',
        'Model output, not a measurement. The value 0.80 is the middle of the verified nominal range.'),
      tm: P(0.09, 'relative conductance at Pm = 40 µm s⁻¹', 'Buckley 2015: symplastic (transmembrane) 5.9 to 11.6 %. Scales with membrane permeability Pm (nominal 40, range 10 to 70 × 10⁻⁶ m s⁻¹, Table 2)', DOI.buckley2015, 'verified', 'VERIFIED',
        'Linear scaling with Pm is a teaching simplification of the full model (ILLUSTRATIVE); the nominal share and the Pm range are VERIFIED.'),
      vap: P(0.11, 'relative conductance at ΔT = 0', 'Buckley 2015: gas phase 7.3 to 16.2 % when isothermal; up to 44 % with a 0.2 K vertical temperature gradient', DOI.buckley2015, 'verified', 'VERIFIED',
        'The temperature boost here, gas conductance × (1 + 26.8 ΔT), is fitted so the share reaches 44 % at 0.2 K (DERIVED from the verified endpoints; the shape between them is ILLUSTRATIVE).'),
      dTk: P(26.8, 'K⁻¹', 'Gas phase boost per kelvin of vertical leaf temperature gradient, fitted to 44 % at 0.2 K', DOI.buckley2015, 'illustrative', 'DERIVED'),
      Pm0: P(40, 'µm s⁻¹', 'Nominal membrane water permeability in Buckley 2015, Table 2 (range 10 to 70)', DOI.buckley2015, 'verified', 'VERIFIED')
    },
    series: {
      fig2: P('E 5 mmol m⁻² s⁻¹; Ψsoil 0 MPa; R 100, 100, 50, 50 MPa m² s mol⁻¹', 'MPa', SRC.scoffoni2023 + ', Fig 2', DOI.scoffoni2023, 'verified', 'VERIFIED',
        'At a given E, a resistance change moves Ψ only downstream of itself.'),
      law: P('Ψdownstream = Ψupstream − E × R', 'MPa', 'van den Honert 1948 Discuss Faraday Soc 3:146 (catenary idea)', DOI.honert1948, 'unverified', 'DERIVED')
    },
    diel: {
      preset: P('A warm Salinas afternoon, per crop', 'T °C, RH %, PPFD', 'Teaching presets, not weather records: warmer than the NOAA 1991 to 2020 Salinas airport July normals (21.5 °C high, 12.8 °C low) used in the original Water Path', 'none', 'illustrative', 'ILLUSTRATIVE')
    }
  };
  WP.params = params;

  // ---------------------------------------------------------------- ranges
  var RANGES = {
    soilPsi: [-2.0, -0.02], T: [5, 42], RH: [10, 98], wind: [0.2, 8], ppfd: [0, 2000],
    hour: [5, 20], phos: [0, 1], pHcyt: [6.0, 7.6], level: [1, 7],
    expr: [0.2, 1.6], bkPm: [10, 70], bkDT: [0, 0.3]
  };
  var ENUMS = { crop: ['grape', 'romaine', 'almond'], lightQ: ['rb', 'red'], ca: ['low', 'high'], aba: ['none', 'xylem', 'blade'],
    /* nutrient path (v17): what the journey follows, and which solute when it follows a nutrient */
    cargo: ['water', 'nutrient'], solute: ['nitrate', 'phosphate', 'potassium', 'cadmium', 'dye'] };
  WP.ranges = RANGES;

  var DEFAULTS = {
    crop: 'grape', soilPsi: -0.10, T: 25, RH: 40, wind: 2, ppfd: 1500, lightQ: 'rb', hour: 14,
    phos: 1, pHcyt: 7.2, ca: 'low', ko: false, level: 2, koxLeaf: false, flood: false,
    expr: 1, aba: 'none', bkPm: 40, bkDT: 0,
    cargo: 'water', solute: 'nitrate'
  };
  WP.defaults = DEFAULTS;
  // K-max is the default leaf near 0 MPa: PF_REF = Pf of the default gate state.
  params.gate.PF_REF.v = Math.round(gate(DEFAULTS).Pf * 10) / 10;
  params.gate.PF_REF.src = 'Pf of the default gate state (phosphorylated, pH 7.2, low Ca²⁺, red + blue at 1500 µmol m⁻² s⁻¹) = ' + params.gate.PF_REF.v + ' µm s⁻¹';

  function clamp(x, lo, hi) { return x < lo ? lo : (x > hi ? hi : x); }
  function normalize(s) {
    var o = {}, k;
    for (k in DEFAULTS) o[k] = DEFAULTS[k];
    if (s) for (k in s) if (Object.prototype.hasOwnProperty.call(s, k)) o[k] = s[k];
    for (k in RANGES) {
      var v = Number(o[k]);
      if (!isFinite(v)) v = DEFAULTS[k];
      o[k] = clamp(v, RANGES[k][0], RANGES[k][1]);
    }
    for (k in ENUMS) if (ENUMS[k].indexOf(o[k]) < 0) o[k] = DEFAULTS[k];
    o.ko = !!o.ko;
    o.koxLeaf = !!o.koxLeaf;
    o.flood = !!o.flood;
    o.level = Math.round(o.level * 2) / 2; // half steps allowed (5.5 = the species plate)
    return o;
  }

  // ---------------------------------------------------------------- model pieces
  function es(T) { var c = params.phys.tetens.v; return c[0] * Math.exp(c[1] * T / (T + c[2])); }
  function vpd(T, RH) { return es(T) * (1 - RH / 100); }
  function psiAir(T, RH) { return params.phys.R.v * (T + 273.15) / params.phys.Vw.v * Math.log(RH / 100) / 1e6; }
  function fLight(ppfd) { return ppfd <= 0 ? 0 : ppfd / (ppfd + params.stomata.fLightHalf.v); }
  function koOn(crop, ko) { return !!ko && params.ko.crops.indexOf(crop) >= 0; }
  function psi50Of(crop, ko) { return params.crops[crop].psi50.v + (koOn(crop, ko) ? params.ko.shift.v : 0); }
  // Grapevine: Weibull (1 at 0 MPa, 0.50 at −0.60, 0.20 at −1.2). Almond, romaine: logistic.
  // The knockout moves the whole curve by the shift (half closure later).
  function fPsi(psi, crop, ko) {
    var c = params.crops[crop];
    var x = psi - (koOn(crop, ko) ? params.ko.shift.v : 0);
    if (c.form === 'weibull') { if (x >= 0) return 1; return Math.exp(-Math.pow(-x / c.wb.v, c.wc.v)); }
    return 1 / (1 + Math.exp(-c.k.v * (x - c.psi50.v)));
  }
  // gs is stomatal only; gmin (cuticle plus leaky stomata) is separate and adds to E.
  function gsOf(st, psiLeaf) { return params.crops[st.crop].gsMax.v * (st.aba === 'blade' ? params.gate.fABAgs.v : 1) * fLight(st.ppfd) * fPsi(psiLeaf, st.crop, st.ko); }
  function gtotOf(st, psiLeaf) { return gsOf(st, psiLeaf) + params.stomata.gmin.v; }
  // leafMode: the tier 3 'faithful anchor' what if, read at leaf Ψ with P50 −0.48 MPa and a 7.8 (grapevine only).
  function fKox(psi, crop, leafMode) {
    var c = params.crops[crop];
    var p50 = c.koxP50.v, a = c.koxA.v;
    if (leafMode && crop === 'grape') { p50 = params.kox.leafP50.v; a = params.kox.leafA.v; }
    return Math.max(params.kox.floor.v, 1 / (1 + Math.exp(a * (p50 - psi))));
  }
  function Eof(gs, VPD) { return gs * VPD / params.phys.Patm.v * 1000; }
  function plcA(s) { return (s === undefined ? params.plc.s.v : s) / 25; }
  function plc(psi, P50, s) {
    if (P50 === null || P50 === undefined) return null;
    return 100 / (1 + Math.exp(plcA(s) * (psi - P50)));
  }
  function slopeOf(crop, organ) {
    var c = params.crops[crop];
    if (organ === 'stem') return c.sStem.v;
    if (organ === 'petiole') return c.sPetiole.v;
    return params.plc.s.v;
  }
  function P50of(crop, organ) {
    var c = params.crops[crop];
    if (organ === 'stem') return c.P50stem.v;
    if (organ === 'root') return c.P50root.v;
    if (c.P50petiole.v !== null) return c.P50petiole.v;
    return c.P50stem.v; // almond petiole falls back to stem (illustrative); romaine stays null
  }
  function gate(st) {
    var g = params.gate;
    var fPhos = g.phosFloor.v + (1 - g.phosFloor.v) * st.phos;
    var fpH = 1 / (1 + Math.pow(10, 2 * (g.pKa.v - st.pHcyt)));
    var fCa = st.ca === 'high' ? g.fCaHigh.v : 1;
    var pOpen = fPhos * fpH * fCa;
    // Blue term follows photon flux: no light, no blue signal.
    var fR = g.fRedOnly.v, I = Math.max(0, st.ppfd);
    var xa = st.aba === 'xylem';
    var fBlue = st.lightQ === 'rb' && !xa ? fR + (1 - fR) * I / (I + g.blueHalf.v) : fR;
    var expr = st.expr === undefined ? 1 : st.expr, fAba = xa ? g.fABA.v : 1;
    var Pf = g.PF_LIPID.v + g.PF_CH.v * pOpen * fBlue * expr * fAba;
    return { phos: fPhos, pH: fpH, ca: fCa, pOpen: pOpen, fBlue: fBlue, expr: expr, fAba: fAba, Pf: Pf };
  }
  // Buckley 2015 partition outside the bundle sheath, teaching form: three parallel conductances.
  // apo fixed; transmembrane ∝ Pm; gas phase boosted by a vertical temperature gradient. Shares at nominal = the verified middle values.
  function buckley(Pm, dT) {
    var pt = params.partition;
    Pm = Pm === undefined ? pt.Pm0.v : Pm; dT = dT || 0;
    var a = pt.apo.v, t = pt.tm.v * Pm / pt.Pm0.v, v = pt.vap.v * (1 + pt.dTk.v * dT), s = a + t + v;
    return { apo: a / s, tm: t / s, vap: v / s, rel: s / (pt.apo.v + pt.tm.v + pt.vap.v) };
  }
  WP.buckley = buckley;
  // K-max: the default gate state near 0 MPa (no Kox loss): Kleaf = 1 ÷ (R_leafX + R_bs + R_mes) at reference.
  function Kmax(crop) { var r = baseR(crop); return 1 / (r.leafX + r.bs + r.mes); }
  function baseR(crop) {
    var K = params.crops[crop].Kplant.v, s = params.split;
    return { root: s.root.v / K, stem: s.stem.v / K, petiole: s.petiole.v / K, leafX: s.leafX.v / K, bs: s.bs.v / K, mes: s.mes.v / K };
  }

  // Node drop across an organ whose R depends on its own downstream node Ψ.
  // Solves x = x0 − E R0 ÷ max(floor, 1 − PLC(x)/100) for the largest root (stable branch).
  // xs: share of R0 that is xylem and can embolise (1 for stem and petiole; root uses the split).
  function organNode(x0, E, R0, P50, stats, s, xs) {
    xs = xs === undefined ? 1 : xs;
    if (P50 === null || P50 === undefined || E <= 0) return { psi: x0 - E * R0, R: R0, plc: (P50 === null || P50 === undefined) ? null : plc(x0, P50, s) };
    var floor = params.plc.floor.v;
    function Rat(x) { return R0 * ((1 - xs) + xs / Math.max(floor, 1 - plc(x, P50, s) / 100)); }
    // monotone fixed point on the drop d (never overshoots the smallest d)
    var d = 0, i, dn;
    for (i = 0; i < 40; i++) {
      dn = E * Rat(x0 - d);
      stats.inner++;
      if (Math.abs(dn - d) < 1e-10) { d = dn; return { psi: x0 - d, R: Rat(x0 - d), plc: plc(x0 - d, P50, s) }; }
      d = dn;
    }
    // slow near a tangency: bracket by scanning, then bisect phi(d) = E R(x0 − d) − d
    var lo = d, hi = d, step = 0.02;
    while (E * Rat(x0 - hi) - hi > 0) { lo = hi; hi += step; step *= 1.5; stats.inner++; }
    for (i = 0; i < 60 && hi - lo > 1e-10; i++) {
      var m = 0.5 * (lo + hi);
      if (E * Rat(x0 - m) - m > 0) lo = m; else hi = m;
      stats.inner++;
    }
    d = 0.5 * (lo + hi);
    return { psi: x0 - d, R: Rat(x0 - d), plc: plc(x0 - d, P50, s) };
  }

  // Walk soil → leafOut at a fixed E. Every downstream Ψ is upstream − E R.
  // over: optional resistance overrides {root, stem, petiole, leafX, bs, mes} (MPa m² s mmol⁻¹), used by the series demonstration.
  function chain(st, E, over, stats) {
    stats = stats || { inner: 0 };
    over = over || {};
    var R0 = baseR(st.crop), gt = gate(st), c = params.crops[st.crop];
    var grav = params.phys.rhoG.v * c.height.v;
    var RleafX = over.leafX !== undefined ? over.leafX : R0.leafX;
    var psi = { soil: st.soilPsi };
    var sS = slopeOf(st.crop, 'stem'), sP = slopeOf(st.crop, 'petiole');
    var R0root = R0.root * (st.flood ? params.gate.floodRoot.v : 1);
    var rN = over.root !== undefined ? { psi: psi.soil - E * over.root, R: over.root, plc: plc(psi.soil - E * over.root, P50of(st.crop, 'root')) }
      : organNode(psi.soil, E, R0root, P50of(st.crop, 'root'), stats, params.plc.s.v, params.split.rootXylem.v);
    psi.root = rN.psi;
    var Rroot = rN.R;
    var sN = over.stem !== undefined ? { psi: psi.root - grav - E * over.stem, R: over.stem, plc: plc(psi.root - grav - E * over.stem, P50of(st.crop, 'stem'), sS) }
      : organNode(psi.root - grav, E, R0.stem, P50of(st.crop, 'stem'), stats, sS);
    psi.stem = sN.psi;
    var pN = over.petiole !== undefined ? { psi: psi.stem - E * over.petiole, R: over.petiole, plc: plc(psi.stem - E * over.petiole, P50of(st.crop, 'petiole'), sP) }
      : organNode(psi.stem, E, R0.petiole, P50of(st.crop, 'petiole'), stats, sP);
    psi.petiole = pN.psi;
    psi.leafX = psi.petiole - E * RleafX;
    // Outside xylem vulnerability, evaluated at the vein (leaf xylem) Ψ: stable, no runaway feedback.
    var fk = over.noKox ? 1 : (over.koxAt !== undefined ? fKox(over.koxAt, st.crop, true) : fKox(psi.leafX, st.crop));
    var Rbs = over.bs !== undefined ? over.bs : R0.bs * params.gate.PF_REF.v / gt.Pf / fk;
    var Rmes = over.mes !== undefined ? over.mes : R0.mes / fk;
    psi.leafOut = psi.leafX - E * (Rbs + Rmes);
    var R = { root: Rroot, stem: sN.R, petiole: pN.R, leafX: RleafX, bs: Rbs, mes: Rmes, ox: Rbs + Rmes,
      spongy: Rmes, palisade: Rmes * params.split.palisade.v };
    R.total = R.root + R.stem + R.petiole + R.leafX + R.ox;
    return { psi: psi, R: R, PLC: { stem: sN.plc, petiole: pN.plc, root: rN.plc }, grav: grav, gate: gt, fKox: fk };
  }

  function solve(stateLike) {
    var st = normalize(stateLike);
    var stats = { inner: 0 };
    var VPD = vpd(st.T, st.RH), pAir = psiAir(st.T, st.RH);
    var c = params.crops[st.crop];
    var grav = params.phys.rhoG.v * c.height.v;
    var warnings = [];
    function Eat(x) { return Eof(gtotOf(st, x), VPD); }
    var KOX_AT_LEAF = !!st.koxLeaf || (params.kox.at && params.kox.at.v === 'leaf');
    function F(x) { return x - chain(st, Eat(x), KOX_AT_LEAF ? { koxAt: x } : null, stats).psi.leafOut; }
    // F is strictly increasing in x (E rises with x; chain Ψ falls with E), so bisection is safe.
    var hi = st.soilPsi - grav, lo = -12, it = 0, x;
    var Fhi = F(hi);
    if (Fhi <= 1e-12) { x = hi; }
    else {
      var Flo = F(lo);
      if (Flo > 0) { warnings.push('Bracket failed at −12 MPa'); }
      while (hi - lo > 1e-6 && it < 200) {
        x = 0.5 * (lo + hi); it++;
        if (F(x) > 0) hi = x; else lo = x;
      }
      x = 0.5 * (lo + hi);
    }
    var gs = gsOf(st, x), gmin = params.stomata.gmin.v, gtot = gs + gmin, E = Eof(gtot, VPD);
    var ch = chain(st, E, KOX_AT_LEAF ? { koxAt: x } : null, stats);
    var resid = Math.abs(ch.psi.leafOut - x);
    var converged = (hi - lo <= 1e-6 || Fhi <= 1e-12) && it < 200;
    if (resid > 1e-3) warnings.push('Runaway: the solution sits on a jump in the vulnerability curve');
    if (st.ppfd <= 0) warnings.push('Dark: stomata mostly shut; water still leaves through the cuticle and stomata that do not close fully (gmin).');
    if (ch.PLC.stem !== null && ch.PLC.stem > 50) warnings.push('Stem PLC above 50 %');
    if (ch.PLC.petiole !== null && ch.PLC.petiole > 50) warnings.push('Petiole PLC above 50 %');
    var gsMax = c.gsMax.v;
    var Kleaf = 1 / (ch.R.leafX + ch.R.ox);
    var bk = buckley(st.bkPm, st.bkDT);
    ch.psi.air = pAir;
    return {
      psi: ch.psi,
      E: E, gs: gs, gmin: gmin, gtot: gtot, gsMax: gsMax, VPD: VPD, Tleaf: st.T, psiAir: pAir,
      Emin: Eof(gmin, VPD),
      R: ch.R,
      K: { leaf: Kleaf, ox: 1 / ch.R.ox, plant: 1 / ch.R.total },
      PLC: ch.PLC,
      Pf: ch.gate.Pf, pOpen: ch.gate.pOpen, gate: { phos: ch.gate.phos, pH: ch.gate.pH, ca: ch.gate.ca },
      fBlue: ch.gate.fBlue, fLight: fLight(st.ppfd), fPsi: fPsi(x, st.crop, st.ko), psi50: psi50Of(st.crop, st.ko),
      fKox: ch.fKox, koActive: koOn(st.crop, st.ko),
      Kmax: Kmax(st.crop), KleafPct: Math.min(100, 100 * Kleaf / Kmax(st.crop)),
      partition: { apo: bk.apo, tm: bk.tm, vap: bk.vap, rel: bk.rel },
      expr: ch.gate.expr, fAba: ch.gate.fAba,
      closedFrac: 1 - gs / gsMax,
      grav: grav,
      airRatio: (ch.psi.leafOut - pAir) / Math.max(1e-9, ch.psi.soil - ch.psi.leafOut),
      converged: converged, iters: it, innerIters: stats.inner, residual: resid,
      warnings: warnings,
      state: st
    };
  }

  // ---------------------------------------------------------------- series demonstration (Scoffoni et al. 2023 Fig 2)
  function series(psiSoil, E, Rs) {
    var out = [psiSoil], p = psiSoil;
    for (var i = 0; i < Rs.length; i++) { p = p - E * Rs[i]; out.push(p); }
    return out;
  }
  WP.series = series;
  // E 5 mmol m⁻² s⁻¹, Ψsoil 0; R in MPa m² s mmol⁻¹ (50 MPa m² s mol⁻¹ = 0.05)
  WP.seriesDemo = function () {
    var E = 5, base = [0.1, 0.1, 0.05, 0.05];
    var names = ['soil', 'stem', 'petioleBase', 'leafX', 'outside'];
    function run(Rs) { var v = series(0, E, Rs), o = {}; for (var i = 0; i < names.length; i++) o[names[i]] = Math.round(v[i] * 1e9) / 1e9; return o; }
    return {
      E: E, units: { E: 'mmol m⁻² s⁻¹', R: 'MPa m² s mmol⁻¹', psi: 'MPa' },
      nodes: names,
      A: run(base),                       // reference: −0.50, −1.00, −1.25, −1.50
      B: run([0.1, 0.1, 0.10, 0.05]),     // leaf xylem R doubled: leafX −1.50, outside −1.75
      C: run([0.1, 0.1, 0.05, 0.10]),     // outside xylem R doubled: leafX −1.25, outside −1.75
      src: params.series.fig2
    };
  };

  // ---------------------------------------------------------------- diel presets (ILLUSTRATIVE, not weather records)
  // anchors: [hour, T °C, RH %, PPFD]
  var DIEL = {
    romaine: [[5, 11, 92, 0], [6, 11, 92, 0], [7, 12, 91, 120], [9, 15, 90, 600], [12, 20, 62, 1500], [14, 23, 48, 1600], [15, 24, 45, 1350], [17, 20, 58, 600], [19, 15, 80, 60], [20, 13, 86, 0]],
    grape:   [[5, 11, 90, 0], [6, 11, 90, 0], [7, 12, 86, 150], [9, 16, 72, 800], [12, 22, 50, 1650], [13, 24, 44, 1650], [14, 25, 40, 1500], [15, 25.5, 39, 1250], [17, 22, 50, 600], [19, 17, 70, 80], [20, 15, 78, 0]],
    almond:  [[5, 20, 60, 0], [6, 20, 60, 0], [7, 22, 55, 200], [9, 27, 42, 900], [12, 33, 28, 1900], [14, 35.5, 25, 1850], [15, 36, 24, 1650], [17, 34, 26, 900], [19, 29, 35, 100], [20, 26, 42, 0]]
  };
  params.diel.anchors = DIEL;
  // NOAA 1991 to 2020 Salinas airport July normals: 21.5 °C mean daily high, 12.8 °C mean daily low.
  // Only the two temperature extremes are from the normals; the hour of each extreme, the humidity and the light are ILLUSTRATIVE.
  var DIEL_NORMAL = {
    romaine: [[5, 12.8, 92, 0], [6, 12.8, 92, 0], [7, 13.2, 91, 110], [9, 15.2, 86, 550], [12, 19.2, 70, 1400], [14, 21.0, 63, 1500], [15, 21.5, 61, 1250], [17, 19.8, 68, 550], [19, 16, 82, 50], [20, 14.6, 87, 0]],
    grape:   [[5, 12.8, 90, 0], [6, 12.8, 90, 0], [7, 13.4, 88, 140], [9, 15.6, 80, 750], [12, 19.4, 66, 1550], [13, 20.4, 62, 1550], [14, 21.1, 60, 1450], [15, 21.5, 59, 1200], [17, 19.9, 66, 560], [19, 16.2, 80, 70], [20, 14.8, 85, 0]]
  };
  params.diel.normalAnchors = DIEL_NORMAL;
  params.diel.normal = P('Salinas July normal day', 'T °C, RH %, PPFD', 'NOAA 1991 to 2020 Salinas airport July normals: 21.5 °C high, 12.8 °C low. Hours of the extremes, humidity and light are ILLUSTRATIVE', 'none', 'illustrative', 'ILLUSTRATIVE');
  WP.dielPreset = 'warm'; // 'warm' (a warm Salinas afternoon, default) | 'normal' (July normals; romaine and grape only)
  function diel(crop, h, preset) {
    var pr = preset || WP.dielPreset;
    var a = (pr === 'normal' && DIEL_NORMAL[crop]) || DIEL[crop] || DIEL.grape;
    h = clamp(h, a[0][0], a[a.length - 1][0]);
    for (var i = 0; i < a.length - 1; i++) {
      if (h <= a[i + 1][0]) {
        var t = (h - a[i][0]) / (a[i + 1][0] - a[i][0]);
        var w = 0.5 - 0.5 * Math.cos(Math.PI * t); // smooth within each interval
        return { T: a[i][1] + w * (a[i + 1][1] - a[i][1]), RH: a[i][2] + w * (a[i + 1][2] - a[i][2]), ppfd: a[i][3] + w * (a[i + 1][3] - a[i][3]) };
      }
    }
    var l = a[a.length - 1]; return { T: l[1], RH: l[2], ppfd: l[3] };
  }
  WP.diel = diel;

  // ---------------------------------------------------------------- colour
  var LIGHT_STOPS = [[0, [14, 58, 138]], [-0.5, [27, 86, 166]], [-1, [52, 116, 186]], [-1.5, [92, 148, 204]], [-2, [134, 179, 220]], [-3, [214, 230, 243]]];
  var DARK_STOPS = [[0, [112, 196, 255]], [-0.5, [96, 176, 240]], [-1, [82, 152, 214]], [-1.5, [74, 128, 182]], [-2, [70, 108, 150]], [-3, [64, 80, 102]]];
  WP.colors = { air: '#a39787', airDark: '#8a8073', embolism: '#3b3b3d', embolismDark: '#6b6b70' };
  WP.waterColor = function (psi, theme) {
    var S = theme === 'dark' ? DARK_STOPS : LIGHT_STOPS;
    if (!isFinite(psi)) return WP.colors.embolism;
    var p = clamp(psi, -3, 0), i;
    for (i = 0; i < S.length - 1; i++) {
      if (p >= S[i + 1][0]) {
        var t = (S[i][0] - p) / (S[i][0] - S[i + 1][0]), a = S[i][1], b = S[i + 1][1];
        return 'rgb(' + Math.round(a[0] + t * (b[0] - a[0])) + ',' + Math.round(a[1] + t * (b[1] - a[1])) + ',' + Math.round(a[2] + t * (b[2] - a[2])) + ')';
      }
    }
    var l = S[S.length - 1][1]; return 'rgb(' + l[0] + ',' + l[1] + ',' + l[2] + ')';
  };

  // ---------------------------------------------------------------- formatting
  function num(x, d) {
    if (x === null || x === undefined || !isFinite(x)) return 'n/a';
    d = d === undefined ? 2 : d;
    var s = Math.abs(x).toFixed(d);
    var zero = Number(s) === 0;
    return (x < 0 && !zero ? MINUS : '') + s;
  }
  WP.fmt = {
    num: num,
    psi: function (x, d) { return num(x, d === undefined ? 2 : d) + ' MPa'; },
    u: function (x, d, unit) { return num(x, d) + (unit ? ' ' + unit : ''); },
    pct: function (x, d) { return num(x, d === undefined ? 0 : d) + ' %'; },
    T: function (x, d) { return num(x, d === undefined ? 0 : d) + ' °C'; },
    gs: function (x) { return num(x, 3) + ' mol m⁻² s⁻¹'; },
    E: function (x) { return num(x, 2) + ' mmol m⁻² s⁻¹'; },
    K: function (x) { return num(x, 2) + ' mmol m⁻² s⁻¹ MPa⁻¹'; },
    Pf: function (x) { return num(x, 0) + ' µm s⁻¹'; },
    vpd: function (x) { return num(x, 2) + ' kPa'; },
    ppfd: function (x) { return num(x, 0) + ' µmol m⁻² s⁻¹'; },
    hour: function (h) { var hh = Math.floor(h), mm = Math.round((h - hh) * 60); if (mm === 60) { hh++; mm = 0; } return (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm; },
    range: function (a, b, d, unit) { return num(a, d) + ' to ' + num(b, d) + (unit ? ' ' + unit : ''); }
  };

  // ---------------------------------------------------------------- state, events
  var listeners = [];
  WP.state = normalize(DEFAULTS);
  WP.solve = solve;
  WP.result = solve(WP.state);
  WP.levels = WP.levels || [];
  WP.on = function (fn) {
    listeners.push(fn);
    return function () { var i = listeners.indexOf(fn); if (i >= 0) listeners.splice(i, 1); };
  };
  function notify() {
    var ls = listeners.slice();
    for (var i = 0; i < ls.length; i++) {
      try { ls[i](WP.state, WP.result); } catch (e) { if (typeof console !== 'undefined') console.error(e); }
    }
  }
  WP.set = function (patch) {
    var s = {}, k;
    for (k in WP.state) s[k] = WP.state[k];
    if (patch) for (k in patch) s[k] = patch[k];
    var n = normalize(s);
    for (k in n) WP.state[k] = n[k];
    WP.result = solve(WP.state);
    notify();
    return WP.result;
  };
  WP.applyHour = function (h) {
    var hh = clamp(Number(h), RANGES.hour[0], RANGES.hour[1]);
    var d = diel(WP.state.crop, hh);
    return WP.set({ hour: hh, T: Math.round(d.T * 10) / 10, RH: Math.round(d.RH), ppfd: Math.round(d.ppfd / 10) * 10 });
  };

  // exposed model pieces (for sweeps, ghosts, curves)
  WP.model = {
    es: es, vpd: vpd, psiAir: psiAir, fLight: fLight, fPsi: fPsi, psi50: psi50Of, fKox: fKox,
    gs: function (stateLike, psiLeaf) { return gsOf(normalize(stateLike), psiLeaf); },
    E: Eof, plc: plc, P50: P50of, plcA: plcA, slope: slopeOf, koOn: koOn, Kmax: Kmax,
    gtot: function (stateLike, psiLeaf) { return gtotOf(normalize(stateLike), psiLeaf); },
    gate: function (stateLike) { return gate(normalize(stateLike)); },
    baseR: baseR,
    chain: function (stateLike, E, over) { return chain(normalize(stateLike), E, over); },
    normalize: normalize
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = WP;
})();

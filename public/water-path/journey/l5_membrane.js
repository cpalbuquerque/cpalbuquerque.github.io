/* The Water Path v8: l5_membrane.js (Level 5, The Membrane; stops 5a, 5b, 5c, 5d)
   GATE AND TREE round (13 Oct 2026 evening, Lead note A): the plate is built around ONE aquaporin channel.
   Hero (macro.js, Three.js r128): one PIP monomer cut open, water in single file, loop D swinging open and shut.
   Drawing (SVG, always shown): the same channel from the side, with a record of its gate over time.
   Controls "What opens the gate?": only what the science lead marked BUILD (night/sheets/gate_tree.json), each with
   its badge, species and papers, wired to the engine (phos, pHcyt, ca, ppfd, lightQ, aba). The tetramer is a tier 3
   note and an optional "Show the real tetramer" toggle. Every number on the readouts comes from WP.result. */
(function () {
  'use strict';
  var WP = window.WP = window.WP || {};
  WP.levels = WP.levels || [];
  var MINUS = '−';
  var ui = null, el = null, refs = {}, lastSt = null, lastRes = null, prev = null;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function num(x, d) { return WP.fmt ? WP.fmt.num(x, d) : String(x); }
  function clamp(x, a, b) { return x < a ? a : (x > b ? b : x); }
  function badge(k, t) {
    k = String(k || '').toUpperCase();
    if (k === 'OPEN QUESTION') return '<span class="badge m5-boq" role="img" title="' + esc('Under study; no settled answer. ' + (t || '')) + '" aria-label="' + esc('OPEN QUESTION. ' + (t || '')) + '">OPEN QUESTION</span>';
    if (k === 'MEASURED') return '<span class="badge b-verified" role="img" title="' + esc('Published data. ' + (t || '')) + '" aria-label="' + esc('MEASURED. ' + (t || '')) + '">MEASURED</span>';
    return ui.badge(k, t);
  }
  function reduced() { return ui && ui.reducedMotion ? ui.reducedMotion() : false; }
  function isDark() { return ui && ui.isDark ? ui.isDark() : false; }

  /* ------------------------------------------------------------ evidence registry (DOIs only from SPEC.json) */
  WP.evidence = WP.evidence || {};
  var EV = {
    'l5-structure': {
      claim: 'A plant PIP aquaporin is a tetramer: four monomers, each with its own water pore. In the closed state loop D folds over the pore from the cytosolic side; to open, it moves away by up to 16 Å.',
      cite: 'Törnroth-Horsefield et al. 2006, Nature 439: 688',
      doi: '10.1038/nature04316',
      measured: 'X-ray crystal structures of spinach SoPIP2;1 in a closed (2.1 Å) and an open (3.9 Å) conformation.',
      fig: 'Residue numbers on this plate are SoPIP2;1 (spinach): Ser115 on loop B and Ser274 on the C terminus (phosphorylation), His193 on loop D (pH), and the divalent cation site at the N terminus ligated by Glu31: Cd2+ was seen there in the crystal, and Ca2+ is proposed to sit there in the cell; it anchors loop D through Arg118 to Arg190 and Asp191 (Törnroth-Horsefield et al. 2006, read in full text; Nyblom et al. 2009, doi 10.1016/j.jmb.2009.01.065). Loop D moves by up to 16 Å; Leu197 forms the hydrophobic gate. Expert depth: the S115E and S274E phosphomimic mutants still crystallised closed, so neither substitution fully mimics phosphorylation (Nyblom et al. 2009). The 3D model is schematic (six membrane spanning helices and two half helices per monomer), not a traced structure. The central opening of the tetramer is not the water path; each monomer has its own pore.',
      badge: 'MEASURED'
    },
    'l5-ph': {
      claim: 'A low cytosolic pH protonates a conserved histidine on loop D and holds the channel shut. This is one reason flooded, oxygen starved roots take up less water.',
      cite: 'Törnroth-Horsefield et al. 2006, Nature 439: 688; Frick et al. 2013, FEBS Letters 587: 989; Tournaire-Roux et al. 2003, Nature 425: 393',
      doi: ['10.1038/nature04316', '10.1016/j.febslet.2013.02.038', '10.1038/nature01853'],
      measured: 'Crystal structures of SoPIP2;1 (including a low pH structure, Frick 2013); root water transport under anoxia in Arabidopsis (Tournaire-Roux 2003).',
      fig: 'His193 is SoPIP2;1 numbering. In AtPIP2;1 the proton sensing histidine is His199 (Verdoucq et al. 2008, doi 10.1042/bj20080275). The model midpoint, pH 6.6, and its steepness are ILLUSTRATIVE; only the direction is from the papers.',
      badge: 'MEASURED'
    },
    'l5-ca': {
      claim: 'In purified membranes, divalent cations at the N terminus, Ca2+ among them, favour the closed state (in vitro).',
      cite: 'Verdoucq et al. 2008, Biochemical Journal 415: 409; Alleva et al. 2006, Journal of Experimental Botany 57: 609; Nyblom et al. 2009, Journal of Molecular Biology 387: 653',
      doi: ['10.1042/bj20080275', '10.1093/jxb/erj046', '10.1016/j.jmb.2009.01.065'],
      measured: 'AtPIP2;1 (Arabidopsis) mutants: Glu31 and, less, Asp28 for Ca2+ and H+ gating; an Arg124 mutant lost Ca2+ sensitivity but kept H+ sensitivity.',
      fig: 'Those numbers are AtPIP2;1 only. Do not convert them to SoPIP2;1 by a fixed offset; the SoPIP2;1 site includes Glu31 (Nyblom 2009). Alleva et al. 2006 found two ranges of Ca2+ sensitivity in beet plasma membrane vesicles (pCa 8 and pCa 4). The model factor for raised Ca2+ (× 0.45) is ILLUSTRATIVE.',
      badge: 'MEASURED'
    },
    'l5-blue': {
      claim: 'Blue light, sensed by phototropins in the bundle sheath, activates the AHA2 H+ ATPase there; the xylem sap acidifies, bundle sheath Pf rises and Kleaf rises.',
      cite: 'Grunwald et al. 2021, Plant Journal 106: 301; Grunwald et al. 2022, Plant Cell 34: 2328',
      doi: ['10.1111/tpj.15235', '10.1093/plcell/koac089'],
      measured: 'Arabidopsis. Kleaf, xylem sap pH and the Pf of isolated bundle sheath protoplasts; buffering the sap at pH 7.5 lowered Kleaf and protoplast Pf (2021). Phototropins and AHA2 in the bundle sheath carry the blue light effect, and the bundle sheath cytosolic pH rose under blue light (2022).',
      fig: 'Buffering the sap at pH 7.5 lowered Kleaf and the Pf of bundle sheath protoplasts (2021). The blue light rise needed more cytosolic Ca2+ in the sheath (2024). The model factor for red alone (channel term × 0.45) is ILLUSTRATIVE.',
      badge: 'MEASURED'
    },
    'l5-dark': {
      claim: 'Light does not always raise leaf hydraulic conductance. In Arabidopsis rosettes conductance was higher in darkness, and diphosphorylation of AtPIP2;1 at Ser280 and Ser283 was needed for that dark enhancement.',
      cite: 'Prado et al. 2013, Plant Cell 25: 1029',
      doi: '10.1105/tpc.112.108456',
      measured: 'Arabidopsis rosette hydraulic conductivity, phosphoproteomics and phosphorylation site mutants.',
      fig: 'Ser280 and Ser283 are AtPIP2;1 numbering. Never read this plate as "light phosphorylates the gate open".',
      badge: 'MEASURED'
    },
    'l5-solutes': {
      claim: 'Water moves fastest and protons are blocked, but depending on isoform plant aquaporins also carry some small neutral molecules and gases, such as CO2, H2O2 and boric acid.',
      cite: 'Maurel et al. 2015, Physiological Reviews 95: 1321; Rodrigues et al. 2017, PNAS 114: 9200',
      doi: ['10.1152/physrev.00008.2015', '10.1073/pnas.1704754114'],
      measured: 'Review of transport studies (Maurel 2015). AtPIP2;1 is needed for H2O2 entry into Arabidopsis guard cells and for ABA driven stomatal closure (Rodrigues 2017).',
      fig: 'A common idea: aquaporins carry only water. In fact selectivity depends on the isoform; H2O2 transport by AtPIP2;1 was shown by Rodrigues et al. 2017.',
      badge: 'MEASURED'
    },
    'l5-ko': {
      claim: 'In grapevine, a CRISPR knockout of the PIP2;1 gene left the Kleaf vulnerability curve like the wild type; the knockouts kept higher gs and photosynthesis under moderate drought.',
      cite: 'Albuquerque, Momayyezi, Agüero et al. 2026, bioRxiv (not peer reviewed)',
      doi: '10.64898/2026.01.29.702672',
      measured: 'Chardonnay, two CRISPR knockout lines and the wild type, during a dry down.',
      fig: 'The model shifts stomatal half closure 0.25 MPa more negative in the knockout and leaves Pf and the Kleaf vulnerability curve unchanged. Because the stomata stay open longer, the leaf reaches a more negative Ψ, so the Kleaf reading is lower at the same moment: that step is a model prediction. The direction is from the preprint; the size of the shift is ILLUSTRATIVE. Enabled for grapevine only.',
      badge: 'PREPRINT'
    },
    'l5-amp': {
      claim: 'Does a falling Kleaf push the stomata shut? In wheat, the decline in Kleaf explained at most 9.1 % of stomatal closure.',
      cite: 'Corso et al. 2020, Plant, Cell and Environment 43: 854',
      doi: '10.1111/pce.13722',
      measured: 'Wheat dry downs: Kleaf, gs and leaf water potential.',
      fig: 'The chain on this plate (Pf, then Rox, then Kleaf, then leaf Ψ, then gs) is the hypothesis, not a measured law. Amplification needs the stomata to sense Ψ downstream of the xylem, which is an open question.',
      badge: 'OPEN QUESTION'
    },
    'l5-circ': {
      claim: 'Expert depth: Arabidopsis rosette conductance follows a circadian rhythm with a midday peak; phosphorylation of AtPIP2;1 at Ser280 and Ser283 is necessary but not sufficient, and 14-3-3 proteins are involved.',
      cite: 'Prado et al. 2019, Plant Cell 31: 417',
      doi: '10.1105/tpc.18.00804',
      measured: 'Arabidopsis rosette hydraulic conductivity over the day, phosphorylation site mutants, 14-3-3 interactions.',
      fig: 'Abstract. A separate finding from the 2013 darkness result.',
      badge: 'MEASURED'
    },
    'l5-species': {
      claim: 'Species decide how light moves Kleaf: from a 400 % rise in walnut to higher conductance in darkness in the Arabidopsis rosette.',
      cite: 'Scoffoni et al. 2008, Plant, Cell and Environment 31: 1803; Cochard et al. 2007, Plant Physiology 143: 122; Grunwald et al. 2022, Plant Cell 34: 2328; Prado et al. 2013, Plant Cell 25: 1029',
      doi: ['10.1111/j.1365-3040.2008.01884.x', '10.1104/pp.106.090092', '10.1093/plcell/koac089', '10.1105/tpc.112.108456'],
      measured: 'Kleaf by rehydration kinetics and evaporative flux (Scoffoni 2008, six evergreen species); walnut Kleaf and aquaporin transcripts (Cochard 2007); Arabidopsis Kleaf under red and blue light (Grunwald 2022); Arabidopsis rosette conductance (Prado 2013).',
      fig: 'Abstracts. The model on this plate is one direction only: more blue photons, higher Pf.',
      badge: 'MEASURED'
    },
    'l5-cawhich': {
      claim: 'Which wins in a leaf: raised Ca2+ closing PIPs, or Ca2+ needed for the blue light rise in Kleaf?',
      cite: 'Verdoucq et al. 2008; Alleva et al. 2006; Torne-Srivastava et al. 2024, Plant Physiology 195: 2635',
      doi: ['10.1042/bj20080275', '10.1093/jxb/erj046', '10.1093/plphys/kiae226'],
      measured: 'In vitro: purified membranes and vesicles (Verdoucq, Alleva). In the Arabidopsis bundle sheath: blue light enhanced Kleaf only with elevated cytosolic Ca2+ (Torne-Srivastava).',
      fig: 'Abstracts. The model keeps only the in vitro direction.',
      badge: 'OPEN QUESTION'
    },
    'l5-aba': {
      claim: 'The ABA valve: ABA fed through the xylem lowered Kleaf and bundle sheath Pf, while ABA put on the leaf blade closed the stomata without lowering Kleaf. ABA also inhibits the blue light activated AHA2 pump and alkalinises the sap.',
      cite: 'Shatil-Cohen, Attia & Moshelion 2011, Plant Journal 67: 72; Torne-Srivastava et al. 2024, Plant Physiology 195: 2635',
      doi: ['10.1111/j.1365-313x.2011.04576.x', '10.1093/plphys/kiae226'],
      measured: 'Arabidopsis detached leaves and bundle sheath protoplasts; xylem sap pH and membrane potential probes.',
      fig: 'Abstracts.',
      badge: 'MEASURED'
    },
    'l5-pfscale': {
      claim: 'A published scale point for membrane Pf: plasma membrane vesicles from beet storage root reached 542 µm s⁻¹, shut by acidification of the cytoplasmic face.',
      cite: 'Alleva et al. 2006, Journal of Experimental Botany 57: 609',
      doi: '10.1093/jxb/erj046',
      measured: 'Beta vulgaris storage root plasma membrane vesicles, stopped flow light scattering.',
      fig: 'Abstract. The 20 to 200 µm s⁻¹ range on this plate is a teaching scale.',
      badge: 'MEASURED'
    },
    'l5-filter': {
      claim: 'Why water passes and protons do not: the pore narrows to about 3 Å over one residue, so water moves in single file and protons are excluded.',
      cite: 'Murata et al. 2000, Nature 407: 599',
      doi: '10.1038/35036519',
      measured: 'Human red cell AQP1, electron crystallography at 3.8 Å. The same family architecture as plant PIPs.',
      fig: 'Abstract.',
      badge: 'MEASURED'
    },
    'l5-pf': {
      claim: 'Silencing PIP1 aquaporins only in the bundle sheath lowered Kleaf and the Pf of bundle sheath and mesophyll cells.',
      cite: 'Sade et al. 2014, Plant Physiology 166: 1609',
      doi: '10.1104/pp.114.248633',
      measured: 'Arabidopsis, bundle sheath specific silencing; protoplast Pf and Kleaf.',
      fig: 'Supports the Pf to Kleaf link in Arabidopsis. The grapevine PIP2;1 knockout (preprint) did not show it; both can be true for different genes and species.',
      badge: 'MEASURED'
    }
  };
  EV['l5-expr'] = {
    claim: 'How many channels a membrane carries matters as much as whether they are open. Silencing the PIP1 genes only in the bundle sheath lowered the Pf of bundle sheath cells and leaf hydraulic conductance; silencing them everywhere also cut CO2 conductance and photosynthesis.',
    cite: 'Sade et al. 2014, Plant Physiology 166: 1609',
    doi: ['10.1104/pp.114.248633'],
    measured: 'Arabidopsis artificial microRNA lines: constitutive versus bundle sheath specific (SCARECROW promoter) silencing; protoplast Pf, Kleaf, gas exchange, biomass.',
    fig: 'Abstracts. The slider multiplies the channel term of Pf (ILLUSTRATIVE: Pf proportional to channel number is a teaching simplification).',
    badge: 'MEASURED'
  };
  EV['l5-abax'] = {
    claim: 'Where ABA arrives decides what it does. ABA fed through the xylem lowered Kleaf and bundle sheath cell Pf; ABA smeared on the leaf blade closed the stomata but did not lower Kleaf within 2 to 3 h. Mesophyll Pf did not respond.',
    cite: 'Shatil-Cohen, Attia & Moshelion 2011, Plant Journal 67: 72; Torne-Srivastava et al. 2024, Plant Physiology 195: 2635',
    doi: ['10.1111/j.1365-313x.2011.04576.x', '10.1093/plphys/kiae226'],
    measured: 'Arabidopsis detached leaves (Kleaf) and GFP labelled bundle sheath protoplasts (swelling, Pf); the effect reversed with HgCl2. ABA inhibits the blue light activated bundle sheath H+ pump and the sap alkalinises (2024).',
    fig: 'Model: xylem ABA multiplies the channel term by 0.6 and switches off the blue light term; blade ABA multiplies gs,max by 0.4. Both sizes ILLUSTRATIVE; the directions are from the papers. In a real leaf, xylem ABA also reaches the guard cells; the model keeps the two sites apart so each can be seen alone.',
    badge: 'MEASURED'
  };
  EV['l5-pfreal'] = {
    claim: 'Real cell Pf values for scale: barley leaf epidermal cells about 65 µm s⁻¹ in the growth zone and 50 in mature tissue; mesophyll protoplasts 13 and 8 µm s⁻¹; putative bundle sheath protoplasts about 3 fold higher. A leaf model uses 40 µm s⁻¹ as its nominal membrane permeability (range 10 to 70).',
    cite: 'Volkov et al. 2006, Journal of Experimental Botany 58: 377; Buckley 2015, Plant, Cell and Environment 38: 7, Table 2',
    doi: ['10.1093/jxb/erl203', '10.1111/pce.12372'],
    measured: 'Barley: cell pressure probe (epidermis) and protoplast swelling (mesophyll). Buckley 2015: a parameter of the model, not a measurement.',
    fig: 'The model Pf on this plate (20 to about 270 µm s⁻¹) is a teaching scale, larger than these cell values.',
    badge: 'MEASURED'
  };
  EV['l5-bsq'] = {
    claim: 'Is the bundle sheath the valve of the leaf, or a minor resistance? A spatially explicit model of 14 species found the sheath a minority of outside xylem resistance, with vapour able to carry up to two thirds of Kox; experiments in Arabidopsis show that changing bundle sheath Pf (aquaporins, the AHA2 pump, phototropins, ABA) changes whole leaf Kleaf.',
    cite: 'Buckley, John, Scoffoni & Sack 2015, Plant Physiology 168: 1616; Buckley 2015, Plant, Cell and Environment 38: 7; Moshelion et al. 2015, Plant, Cell and Environment 38: 1785; Grunwald et al. 2022, Plant Cell 34: 2328',
    doi: ['10.1104/pp.15.00731', '10.1111/pce.12372', '10.1111/pce.12410', '10.1093/plcell/koac089'],
    measured: 'Buckley: models fed with measured anatomy. Moshelion lab: protoplast Pf, Kleaf, sap pH in mutants and tissue specific lines.',
    fig: 'Both can hold if the sheath membrane is the switch even when it is not the largest resistance: a small resistance that can change ten fold still moves the total. That is a hypothesis, not a result.',
    badge: 'OPEN QUESTION'
  };
  /* GATE AND TREE (13 Oct evening): evidence for the "What opens the gate?" controls. Source sheet:
     night/sheets/gate_tree.json (every paper retrieved by the science lead with the PubMed tools). */
  EV['l5-phos'] = {
    claim: 'Phosphorylation of two conserved serines favours the open gate; losing the phosphates favours the closed state.',
    cite: 'Törnroth-Horsefield et al. 2006, Nature 439: 688; Prado et al. 2013, Plant Cell 25: 1029',
    doi: ['10.1038/nature04316', '10.1105/tpc.112.108456'],
    measured: 'Crystal structures of spinach SoPIP2;1 (Ser115 on loop B, Ser274 at the C terminus). In Arabidopsis leaf veins, phosphomimetic and phosphodeficient forms of AtPIP2;1 (Ser280, Ser283) in a pip2;1 mutant.',
    fig: 'Residue numbers belong to an isoform: Ser115 and Ser274 are SoPIP2;1 (spinach); Ser280 and Ser283 are AtPIP2;1 (Arabidopsis). The model form (0.25 + 0.75 × phosphorylated share) is ILLUSTRATIVE.',
    badge: 'MEASURED'
  };
  EV['l5-light'] = {
    claim: 'Light raises leaf hydraulic conductance in many species, not all. Not yet tested in almond.',
    cite: 'Cochard et al. 2007, Plant Physiology 143: 122; Voicu et al. 2008, Tree Physiology 28: 1007; Tyree et al. 2005, Journal of Experimental Botany 56: 737; Lopez et al. 2013, Plant and Cell Physiology 54: 1963',
    doi: ['10.1104/pp.106.090092', '10.1093/treephys/28.7.1007', '10.1093/jxb/eri045', '10.1093/pcp/pct135'],
    measured: 'Walnut: Kleaf rose 400 % from dark to light, tracking PIP2 transcripts. Bur oak: the rise came within 1 h, saturated near 150 µmol m⁻² s⁻¹ and was blocked by HgCl2. Of 11 woody species, 6 responded to light. Poplar: Kleaf rose in the first hour of the light period, with PIP genes induced.',
    fig: 'High pressure flowmeter and evaporative flux methods. Four labs, at least eight woody species; 5 of the 11 species in Tyree et al. 2005 did not respond. The model channel term under darkness (× 0.45) is ILLUSTRATIVE.',
    badge: 'MEASURED'
  };
  EV['l5-bluek'] = {
    claim: 'Blue light in particular: walnut Kleaf was about 60 % lower without blue light; birch leaf blades conducted most under blue and least under red.',
    cite: 'Ben Baaziz et al. 2012, Tree Physiology 32: 423; Sellin et al. 2011, Plant, Cell and Environment 34: 1079; Grunwald et al. 2022, Plant Cell 34: 2328',
    doi: ['10.1093/treephys/tps022', '10.1111/j.1365-3040.2011.02306.x', '10.1093/plcell/koac089'],
    measured: 'Kleaf under different light colours in walnut and birch (sun leaves of birch: 3.63 under blue against 2.83 × 10⁻⁴ kg m⁻² MPa⁻¹ s⁻¹ under red). In Arabidopsis, mutants without phototropins or without the AHA2 pump lose the blue light rise in Kleaf.',
    fig: 'Counter evidence: three ornamental species grown for weeks under red or blue LEDs showed no change in Kleaf (Zheng and Van Labeke 2017, PubMed 28611818), a long term test rather than a short one. The model factor for red alone (× 0.45) is ILLUSTRATIVE and is not fitted to the walnut 60 %.',
    badge: 'MEASURED'
  };
  EV['l5-stress'] = {
    claim: 'Water stress and ABA in the xylem lower bundle sheath Pf and Kleaf.',
    cite: 'Shatil-Cohen, Attia & Moshelion 2011, Plant Journal 67: 72; Sade et al. 2014, Plant Physiology 166: 1609; Pou et al. 2013, Plant, Cell and Environment 36: 828',
    doi: ['10.1111/j.1365-313x.2011.04576.x', '10.1104/pp.114.248633', '10.1111/pce.12019'],
    measured: 'Arabidopsis: bundle sheath protoplast swelling, detached leaf Kleaf, bundle sheath specific silencing of PIP1. Grapevine (Chardonnay, a vine): Kleaf about 30 % lower under water stress, with VvPIP2;1 expression tracking Kleaf.',
    fig: 'The grapevine link to aquaporins is a correlation, not a test. In the model, ABA in the xylem multiplies the channel term by 0.6 and stops the blue light term (ILLUSTRATIVE sizes; directions from the papers).',
    badge: 'MEASURED'
  };
  EV['l5-blue'].claim = 'A proposed chain, shown only in Arabidopsis by one lab: blue light, phototropins in the bundle sheath, the AHA2 H+ ATPase, acid xylem sap, then higher bundle sheath Pf and Kleaf. Which aquaporin, and which residue, senses the sap pH is not known.';
  EV['l5-blue'].cite = 'Grunwald et al. 2021, Plant Journal 106: 301; Grunwald et al. 2022, Plant Cell 34: 2328; Torne-Srivastava et al. 2024, Plant Physiology 195: 2635';
  EV['l5-blue'].doi = ['10.1111/tpj.15235', '10.1093/plcell/koac089', '10.1093/plphys/kiae226'];
  EV['l5-species'] = {
    claim: 'Species decide how light moves Kleaf: from a 400 % rise in walnut to higher conductance in darkness in the Arabidopsis rosette.',
    cite: 'Cochard et al. 2007; Voicu et al. 2008; Tyree et al. 2005; Lopez et al. 2013; Scoffoni et al. 2008, Plant, Cell and Environment 31: 1803; Prado et al. 2013, Plant Cell 25: 1029',
    doi: ['10.1104/pp.106.090092', '10.1093/treephys/28.7.1007', '10.1093/jxb/eri045', '10.1093/pcp/pct135', '10.1111/j.1365-3040.2008.01884.x', '10.1105/tpc.112.108456'],
    measured: 'Kleaf in light and dark or low and high light, by species (see the table).',
    fig: 'Abstracts. No test in almond was found. The model on this plate is one direction only: more light, higher channel term.',
    badge: 'MEASURED'
  };
  EV['l5-oq'] = {
    claim: 'Acid sap raises Kleaf, yet an acid cytosol closes PIPs. How can both hold?',
    cite: 'Grunwald et al. 2021; Grunwald et al. 2022; Torne-Srivastava et al. 2024; Tournaire-Roux et al. 2003, Nature 425: 393',
    doi: ['10.1111/tpj.15235', '10.1093/plcell/koac089', '10.1093/plphys/kiae226', '10.1038/nature01853'],
    measured: 'Arabidopsis: sap pH imaging, bundle sheath cytosolic pH, protoplast Pf; Arabidopsis roots under anoxia.',
    fig: 'Part of an answer: AHA2 pumps protons out of the cell, and under blue light the bundle sheath cytosol became less acid. Still unexplained: raising only the outside pH to 7.5 lowered Pf, and ABA makes the sheath cytosol more alkaline yet lowers Kleaf.',
    badge: 'OPEN QUESTION'
  };

  /* new sources for this round (all in night/sheets/gate_tree.json); added to the registry only if missing */
  (function () {
    var S = WP.SPEC && WP.SPEC.sources; if (!S) return;
    [['10.1093/treephys/28.7.1007', 'Voicu, Zwiazek & Tyree 2008, Tree Physiology 28: 1007 to 1015'],
     ['10.1093/jxb/eri045', 'Tyree, Nardini, Salleo, Sack & El Omari 2005, Journal of Experimental Botany 56: 737 to 744'],
     ['10.1093/pcp/pct135', 'Lopez et al. 2013, Plant and Cell Physiology 54: 1963 to 1975'],
     ['10.1093/treephys/tps022', 'Ben Baaziz et al. 2012, Tree Physiology 32: 423 to 434'],
     ['10.1111/j.1365-3040.2011.02306.x', 'Sellin, Sack, Õunapuu & Karusion 2011, Plant, Cell and Environment 34: 1079 to 1087'],
     ['10.1111/pce.12019', 'Pou et al. 2013, Plant, Cell and Environment 36: 828 to 843'],
     ['10.1104/pp.106.090092', 'Cochard et al. 2007, Plant Physiology 143: 122 to 133'],
     ['10.1105/tpc.18.00804', 'Prado et al. 2019, Plant Cell 31: 417 to 429'],
     ['10.1093/plphys/kiae226', 'Torne-Srivastava et al. 2024, Plant Physiology 195: 2635 to 2651'],
     ['10.1111/nph.19497', 'Grunwald, Yaaran & Moshelion 2024, New Phytologist 241: 1404 to 1414'],
     ['10.1104/pp.114.248633', 'Sade et al. 2014, Plant Physiology 166: 1609 to 1620']
    ].forEach(function (r) { if (!S[r[0]]) S[r[0]] = { label: r[1], status: 'VERIFIED' }; });
    /* Stops 5a and 5c: the plate shows one channel, and the Arabidopsis figure from Scoffoni 2023 Table 2 was not found
       in the retrieved paper (science lead, 13 Oct). FIX ROUND: shell.js now carries these edits, so the guarded
       patch below is a no op kept only as a safety net for an older shell.js. */
    var ST = WP.SPEC.stops || {}, a = ST['5a'], c = ST['5c'];
    if (a && /as a tetramer of four pores/.test(a.objective)) {
      a.objective = 'Describe one PIP aquaporin pore and its gate, loop D, and predict how phosphorylation, cytosolic pH and Ca2+ change how much of the time the gate is open, and so the membrane water permeability (Pf). Expert depth: a PIP is a tetramer of four such pores.';
      a.answer = a.answer.replace('Loop D then caps each of the four pores from the cytosolic side', 'Loop D then caps the pore from the cytosolic side (each of the four monomers of a PIP has its own pore and its own loop D)');
    }
    if (c && /70 % lower under red light alone/.test(c.answer)) {
      c.title = 'Light and the valve: what is shown, what is open';
      c.objective = 'State what is shown about light and K-leaf (a rise in many species, not all; not yet tested in almond), then put the proposed Arabidopsis chain in order (phototropins, bundle sheath H+ ATPase, sap acidification, higher bundle sheath Pf, higher K-leaf) and name its open last step.';
      c.answer = c.answer.replace(/ In Arabidopsis, K-leaf was about 70 % lower[^]*$/, ' Without blue light, walnut K-leaf was about 60 % lower (Ben Baaziz et al. 2012, Tree Physiology 32: 423, doi 10.1093/treephys/tps022).');
      c.dois = c.dois.filter(function (d) { return d !== '10.1111/nph.19069'; }).concat(['10.1093/treephys/tps022']);
    }
  })();
  Object.keys(EV).forEach(function (k) { if (!WP.evidence[k]) WP.evidence[k] = EV[k]; });

  /* ------------------------------------------------------------ CSS (scoped) */
  var CSS = '\
#lv-membrane svg text.m5-glyph{fill:#1b150c!important}\
#lv-membrane{--m5-helix:#d8c7a0;--m5-helix2:#c4ae80;--m5-half:#6f86a3;--m5-loopd:#8c3a24;--m5-loopb:#5e5141;--m5-phos:#a8730f;--m5-his:#6b6152;--m5-hisH:#c0471c;--m5-ca:#2f6b3a;--m5-head:#d9ccb0;--m5-headS:#8a7a62;--m5-core:#efe6cf;--m5-bg:#f7f1e3;--m5-ghost:#b9ad96}\
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]) #lv-membrane{--m5-helix:#a88d5c;--m5-helix2:#7d6a47;--m5-half:#8fb8ff;--m5-loopd:#f08a5d;--m5-loopb:#b3aca0;--m5-phos:#e2bd6b;--m5-his:#9c958a;--m5-hisH:#ff9a6b;--m5-ca:#8fd19e;--m5-head:#33404c;--m5-headS:#5b6c7c;--m5-core:#131a21;--m5-bg:#0d1217;--m5-ghost:#3b4855}}\
:root[data-theme="dark"] #lv-membrane{--m5-helix:#a88d5c;--m5-helix2:#7d6a47;--m5-half:#8fb8ff;--m5-loopd:#f08a5d;--m5-loopb:#b3aca0;--m5-phos:#e2bd6b;--m5-his:#9c958a;--m5-hisH:#ff9a6b;--m5-ca:#8fd19e;--m5-head:#33404c;--m5-headS:#5b6c7c;--m5-core:#131a21;--m5-bg:#0d1217;--m5-ghost:#3b4855}\
[data-tier="1"] #lv-membrane .tier-2,[data-tier="1"] #lv-membrane .tier-3,[data-tier="2"] #lv-membrane .tier-3{display:none!important}\
#lv-membrane .tier-1-only{display:none}[data-tier="1"] #lv-membrane .tier-1-only{display:block}\
#lv-membrane .m5-lead{font-size:19px;font-style:italic;color:var(--ink2);margin:0 0 6px;max-width:46em}\
#lv-membrane .m5-now{font-family:var(--ui);font-size:15px;line-height:1.45;background:var(--card);border:1px solid var(--rule);border-left:4px solid var(--accent);padding:8px 12px;margin:0 0 16px;max-width:60em}\
#lv-membrane h3.m5-h{font-family:var(--disp);font-weight:400;font-size:24px;letter-spacing:.03em;margin:30px 0 2px}\
#lv-membrane .m5-sub{margin:0 0 10px;color:var(--ink2);font-style:italic}\
#lv-membrane .m5-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:16px;align-items:start}\
@media (min-width:980px){#lv-membrane .m5-grid{grid-template-columns:minmax(0,1.45fr) minmax(0,1fr)}}\
#lv-membrane figure{margin:0}\
#lv-membrane .m5-stage{position:relative;border:1px solid var(--rule);background:var(--m5-bg);overflow:hidden}\
#lv-membrane .m5-three{position:relative;width:100%;aspect-ratio:4/3.1;touch-action:none;cursor:grab}\
#lv-membrane .m5-three:active{cursor:grabbing}\
#lv-membrane .m5-three canvas{display:block;width:100%!important;height:100%!important}\
#lv-membrane .m5-lbls{position:absolute;inset:0;pointer-events:none}\
#lv-membrane .m5-lbl{position:absolute;transform:translate(10px,-50%);font-family:var(--ui);font-size:11.5px;line-height:1.2;color:var(--ink);background:color-mix(in srgb,var(--m5-bg) 82%,transparent);padding:1px 5px;border-left:2px solid var(--ink2);white-space:nowrap;transition:opacity .2s}\
#lv-membrane .m5-lbl.col{transform:translate(-100%,-50%);white-space:nowrap;border-left:0;border-right:2px solid var(--ink2);border-radius:3px;background:color-mix(in srgb,var(--m5-bg) 90%,transparent)}\
#lv-membrane .m5-leaders{position:absolute;left:0;top:0;pointer-events:none;overflow:visible}\
#lv-membrane .m5-leaders path{stroke:var(--ink2);stroke-width:1;fill:none;opacity:.8}\
#lv-membrane .m5-leaders circle{fill:var(--ink);stroke:var(--m5-bg);stroke-width:1}\
#lv-membrane .m5-lbl.side{border-left:0;background:none;font-style:italic;color:var(--ink2);font-family:var(--text);font-size:13px;transform:translate(-50%,-50%)}\
#lv-membrane .m5-lbl i{font-style:normal;color:var(--ink2)}\
#lv-membrane .m5-dot{position:absolute;width:6px;height:6px;margin:-3px 0 0 -3px;border-radius:50%;background:var(--ink)}\
#lv-membrane .m5-svgs{display:grid;grid-template-columns:minmax(0,1fr);gap:4px;padding:6px}\
@media (min-width:640px) and (max-width:979px){#lv-membrane .m5-svgs{grid-template-columns:minmax(0,1fr) minmax(0,.9fr)}}\
#lv-membrane .m5-tiles .tile .k,#lv-membrane .m5-node .k{text-transform:none;letter-spacing:.02em;font-size:12px}\
#lv-membrane .m5-svgs svg{display:block;width:100%;height:auto}\
#lv-membrane svg text{font-family:var(--ui);fill:var(--ink)}\
#lv-membrane svg .m5-t2{fill:var(--ink2)}\
#lv-membrane svg .m5-it{font-family:var(--text);font-style:italic;fill:var(--ink2)}\
#lv-membrane .m5-bar{display:flex;flex-wrap:wrap;gap:6px;align-items:center;justify-content:space-between;padding:6px 8px;border-top:1px solid var(--rule);background:var(--card)}\
#lv-membrane .m5-bar .chips{gap:4px}\
#lv-membrane .m5-bar .btn.small{min-width:40px;justify-content:center}\
#lv-membrane .m5-note{font-family:var(--ui);font-size:12.5px;color:var(--ink2);margin:0;line-height:1.4}\
#lv-membrane .m5-ctl h4,#lv-membrane .m5-k{font-family:var(--ui);font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink2);margin:0 0 6px;font-weight:500}\
#lv-membrane .m5-rng{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:2px 10px;align-items:center;padding:8px 0;border-top:1px dotted var(--rule)}\
#lv-membrane .m5-rng:first-of-type{border-top:0}\
#lv-membrane .m5-rng label{font-family:var(--ui);font-size:14px;line-height:1.3}\
#lv-membrane .m5-rng label small{display:block;color:var(--ink2);font-size:12px}\
#lv-membrane .m5-rng output{font-family:var(--mono);font-variant-numeric:tabular-nums;font-size:14px;text-align:right}\
#lv-membrane .m5-rng input[type=range]{grid-column:1/-1;width:100%;min-height:34px;accent-color:var(--accent)}\
#lv-membrane .m5-sw{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 0;border-top:1px dotted var(--rule)}\
#lv-membrane .m5-sw p{margin:0;font-family:var(--ui);font-size:14px;line-height:1.3}\
#lv-membrane .m5-sw p small{display:block;color:var(--ink2);font-size:12px}\
#lv-membrane .m5-sw .chips{flex:none}\
#lv-membrane .m5-sw .chip{min-height:40px}\
#lv-membrane .m5-tiles{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin-top:10px}\
#lv-membrane .m5-tiles .tile .v{font-size:19px}\
#lv-membrane .m5-tiles .tile .s{font-family:var(--ui);font-size:11.5px;color:var(--ink2);margin-top:2px}\
#lv-membrane .m5-chain{display:flex;flex-wrap:wrap;align-items:stretch;gap:0;margin:8px 0 0}\
#lv-membrane .m5-node{flex:1 1 120px;min-width:0;background:var(--card);border:1px solid var(--rule);padding:8px 10px;border-radius:2px;position:relative}\
#lv-membrane .m5-node .k{font-family:var(--ui);font-size:12px;letter-spacing:.02em;color:var(--ink2)}\
#lv-membrane .m5-node .v{font-family:var(--mono);font-variant-numeric:tabular-nums;font-size:17px;line-height:1.25;overflow-wrap:anywhere}\
#lv-membrane .m5-node .v small{display:block;font-size:11px;color:var(--ink2)}\
#lv-membrane .m5-node .w{font-family:var(--ui);font-size:12.5px;color:var(--ink2);margin-top:2px}\
#lv-membrane .m5-node .d{font-family:var(--ui);font-size:12px;font-weight:600;margin-left:4px}\
#lv-membrane .m5-node.ko{border-style:dashed;border-color:var(--b-pp)}\
#lv-membrane .m5-ar{flex:0 0 22px;display:grid;place-items:center;color:var(--ink2);font-family:var(--ui);font-size:18px}\
#lv-membrane .m5-ar.pulse{animation:m5pulse .9s var(--ease) 1}\
@keyframes m5pulse{0%{color:var(--accent);transform:scale(1)}35%{color:var(--accent);transform:scale(1.6)}100%{color:var(--ink2);transform:scale(1)}}\
[data-motion="reduce"] #lv-membrane .m5-ar.pulse{animation:none;color:var(--accent)}\
@media (prefers-reduced-motion: reduce){#lv-membrane .m5-ar.pulse{animation:none;color:var(--accent)}}\
@media (max-width:560px){#lv-membrane .m5-chain{flex-direction:column}#lv-membrane .m5-node{flex:0 0 auto}#lv-membrane .m5-ar{flex-basis:20px;transform:rotate(90deg)}#lv-membrane .m5-ar.pulse{animation:none;color:var(--accent)}}\
#lv-membrane .m5-two{display:grid;grid-template-columns:minmax(0,1fr);gap:14px;align-items:start;margin-top:12px}\
@media (min-width:760px){#lv-membrane .m5-two{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}}\
#lv-membrane .m5-frame{border:1px solid var(--rule);background:var(--wall);padding:6px}\
#lv-membrane .m5-frame svg{display:block;width:100%;height:auto}\
#lv-membrane .m5-blue{display:flex;flex-wrap:wrap;gap:0;align-items:stretch;margin-top:6px}\
#lv-membrane .m5-bstep{flex:1 1 110px;min-width:0;border:1px solid var(--rule);background:var(--paper);padding:6px 8px;font-family:var(--ui);font-size:13px;line-height:1.3;transition:opacity .3s}\
#lv-membrane .m5-bstep b{display:block;font-weight:600}\
#lv-membrane .m5-bstep small{color:var(--ink2);font-size:11.5px}\
#lv-membrane .m5-bstep.on{border-color:var(--accent);box-shadow:inset 0 3px 0 var(--accent)}\
#lv-membrane .m5-bstep.off{opacity:.45}\
#lv-membrane .m5-bar2{flex:0 0 16px;display:grid;place-items:center;color:var(--ink2);font-family:var(--ui)}\
@media (max-width:560px){#lv-membrane .m5-blue{flex-direction:column}#lv-membrane .m5-bstep{flex:0 0 auto}#lv-membrane .m5-bar2{transform:rotate(90deg)}}\
#lv-membrane .m5-caution{border:1px solid var(--b-pre);border-left:4px solid var(--b-pre);background:var(--card);padding:10px 12px;font-family:var(--ui);font-size:13.5px;line-height:1.45}\
#lv-membrane .m5-caution h4{margin:0 0 4px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--b-pre);font-weight:600}\
#lv-membrane .m5-caution table{border-collapse:collapse;width:100%;margin:6px 0;font-size:13px}\
#lv-membrane .m5-caution th,#lv-membrane .m5-caution td{border-top:1px dotted var(--rule);padding:4px 6px 4px 0;text-align:left;vertical-align:top}\
#lv-membrane .m5-caution th{font-weight:600;color:var(--ink2);font-size:11.5px;letter-spacing:.05em;text-transform:uppercase}\
#lv-membrane .m5-small{font-family:var(--ui);font-size:12.5px;color:var(--ink2);margin:6px 0 0;line-height:1.45}\
#lv-membrane .m5-evrow{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:8px}\
#lv-membrane .m5-evd{flex:1 1 100%;border:1px solid var(--rule);background:var(--wall);padding:8px 12px;font-family:var(--ui);font-size:13px;line-height:1.45}\
#lv-membrane .m5-evd p{margin:0 0 6px}\
#lv-membrane .m5-evd dl{display:grid;grid-template-columns:auto minmax(0,1fr);gap:3px 10px;margin:0}\
#lv-membrane .m5-evd dt{color:var(--ink2);font-size:11.5px;letter-spacing:.05em;text-transform:uppercase;padding-top:2px}\
#lv-membrane .m5-evd dd{margin:0}\
#lv-membrane .m5-boq{color:var(--warm)}\
#lv-membrane .m5-boq::before{content:"?\\00a0"}\
#lv-membrane .m5-ko{border:1px dashed var(--b-pp);padding:10px 12px;background:var(--card);font-family:var(--ui);font-size:13.5px;line-height:1.45}\
#lv-membrane .m5-ko h4{margin:0 0 4px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--b-pp);font-weight:600}\
#lv-membrane .m5-meth{display:grid;grid-template-columns:minmax(0,1fr);gap:10px}\
@media (min-width:760px){#lv-membrane .m5-meth{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}}\
#lv-membrane .m5-meth .card h4{margin:0 0 4px;font-family:var(--ui);font-size:13.5px;font-weight:600}\
#lv-membrane .m5-meth .card p,#lv-membrane .m5-meth .card ol{margin:4px 0 0;font-family:var(--ui);font-size:13px;line-height:1.45}\
#lv-membrane .m5-meth .card ol{padding-left:18px}\
#lv-membrane .m5-oq{margin:6px 0 0;padding-left:20px;font-size:16.5px}\
#lv-membrane .m5-oq li{margin:0 0 6px}\
#lv-membrane .m5-key{margin:0;padding:6px 10px 6px 30px;font-family:var(--ui);font-size:12.5px;line-height:1.45;color:var(--ink2);border-top:1px dotted var(--rule)}\
#lv-membrane .m5-key b{color:var(--ink);font-weight:600}\
#lv-membrane .m5-sp{width:100%;border-collapse:collapse;font-family:var(--ui);font-size:13px;line-height:1.4;display:block;overflow-x:auto}\
#lv-membrane .m5-sp th,#lv-membrane .m5-sp td{text-align:left;padding:5px 8px;border-bottom:1px solid var(--rule2);vertical-align:top}\
#lv-membrane .m5-sp th{font-weight:600;color:var(--ink2)}\
#lv-membrane .m5-mol{margin:22px 0 6px}\
#lv-membrane .m5-expr{border:1px solid var(--rule2);border-left:3px solid var(--accent);background:var(--card);padding:10px 12px;margin:10px 0;border-radius:4px}\
#lv-membrane .m5-expr h4{margin:0 0 6px;font-family:var(--ui);font-size:14px}\
#lv-membrane .m5-oq{border:1px dashed var(--b-pre);background:var(--card);padding:10px 12px;margin:14px 0;border-radius:4px;font-family:var(--ui);font-size:14px;line-height:1.5}\
#lv-membrane .m5-oq h4{margin:0 0 6px;font-size:14.5px}\
#lv-membrane .m5-molbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between;margin:6px 0 8px}\
#lv-membrane .m5-molstage{border:1px solid var(--rule2);border-radius:8px;overflow:hidden;background:var(--wall);box-shadow:var(--shadow)}\
#lv-membrane .m5-molnow{font-family:var(--ui);font-size:14px;margin:8px 0 4px;color:var(--ink)}\
#lv-membrane .m5-molkey{font-family:var(--ui);font-size:13px;color:var(--ink2);margin:4px 0}\
#lv-membrane .m5-molkey ul{margin:6px 0 0;padding-left:18px}\
#lv-membrane .m5-fb{font-family:var(--ui);font-size:12.5px;color:var(--ink2);padding:6px 10px;border-top:1px dotted var(--rule)}\
#lv-membrane .m5-sw{flex-wrap:wrap}\
#lv-membrane .m5-grp{border-top:1px solid var(--rule);padding-top:8px;margin-top:10px}\
#lv-membrane .m5-grp h5{font-family:var(--ui);font-size:12px;letter-spacing:.07em;text-transform:uppercase;color:var(--accent);margin:0 0 2px;font-weight:600}\
#lv-membrane .m5-ev{display:flex;flex-wrap:wrap;gap:3px 8px;align-items:center;font-family:var(--ui);font-size:12px;line-height:1.4;color:var(--ink2);margin:0 0 6px}\
#lv-membrane .m5-ev a{color:var(--accent);text-underline-offset:2px}\
#lv-membrane .m5-chip2{display:inline-block;border:1px dashed var(--b-pre);border-radius:999px;padding:0 8px;font-size:11.5px;color:var(--ink)}\
#lv-membrane .m5-gate{font-family:var(--ui);font-size:13.5px;line-height:1.45;margin:0 0 4px;padding:6px 10px;background:var(--wall);border-left:3px solid var(--accent)}\
#lv-membrane .m5-herobar{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center;margin:-6px 0 14px}\
#lv-membrane .m5-herobar .m5-small{flex:1 1 280px}\
#lv-membrane .m5-bstep.oq{border-style:dashed;border-color:var(--b-pre)}\
#lv-membrane .m5-rf{border:1px dashed var(--b-pre);background:var(--card);padding:6px 14px 10px;margin:16px 0;border-radius:4px}\
#lv-membrane .m5-rfl{margin:4px 0 0;padding-left:20px;font-family:var(--ui);font-size:13.5px;line-height:1.5}\
#lv-membrane .m5-rfl li{margin:0 0 7px}\
#lv-membrane .m5-rfl a{color:var(--accent)}\
#lv-membrane .m5-bar .m5-note{flex:1 1 240px}\
#lv-membrane .m5-svgs > div[data-r="svgOne"] svg{max-width:560px;margin:0 auto}\
#lv-membrane .m5-gov{position:absolute;inset:0;pointer-events:none;z-index:4}\
#lv-membrane .m5-gld{position:absolute;left:0;top:0;width:100%;height:100%;overflow:visible}\
#lv-membrane .m5-gld path{stroke:#f4f1e8;stroke-width:1.4;opacity:.9}\
#lv-membrane .m5-gld circle{fill:#f4f1e8;stroke:rgba(14,20,16,.7);stroke-width:1.5}\
#lv-membrane .mh-tag.m5-gtag{transform:none;border-color:rgba(255,170,120,.75);box-shadow:inset 3px 0 0 #e8743f}\
#lv-membrane .mh-tag.m5-ptag{border-color:rgba(255,255,255,.18);box-shadow:inset 3px 0 0 #f0a020}\
#lv-membrane .mh-tag.m5-gtag::after,#lv-membrane .mh-tag.m5-gword::after{display:none}\
#lv-membrane .mh-tag.m5-gword{transform:translate(-50%,0);font:600 17px/1 var(--ui,system-ui,sans-serif);letter-spacing:.16em;padding:6px 12px 6px 14px;color:#a8e6ff;border:1.5px solid rgba(140,215,255,.8);background:rgba(10,24,36,.78);transition:color .25s,border-color .25s}\
#lv-membrane .mh-tag.m5-gword.m5-shut{color:#ffb070;border-color:rgba(255,150,90,.9);background:rgba(40,16,8,.78)}\
@media (max-width:600px){#lv-membrane .mh-tag.m5-gword{font-size:15px;padding:5px 10px 5px 12px}}\
#lv-membrane .m5-try{display:flex;flex-wrap:wrap;gap:6px 12px;align-items:center;font-family:var(--ui);font-size:14px;line-height:1.4;margin:-4px 0 12px;padding:6px 10px;background:var(--card);border:1px dashed var(--rule)}\
#lv-membrane .m5-try > span{flex:1 1 240px}\
#lv-membrane .m5-ctl{scroll-margin-top:120px}\
';

  /* ------------------------------------------------------------ gate targets from the result (molecular theatre and tetramer view)
     caps: monomers close from index 3 downward as pOpen falls (partial cap allowed).
     phos: monomers are phosphorylated from index 0 upward. */
  function targets(st, res) {
    var q = 4 * (1 - clamp(res.pOpen, 0, 1));
    var caps = [0, 1, 2, 3].map(function (i) { return clamp(q - (3 - i), 0, 1); });
    var nP = Math.round(4 * clamp(st.phos, 0, 1));
    var phos = [0, 1, 2, 3].map(function (i) { return i < nP; });
    var prot = 1 - clamp(res.gate.pH, 0, 1); // fraction of loop D histidines protonated (model)
    return { caps: caps, phos: phos, nP: nP, prot: prot, ca: st.ca === 'high', blue: res.fBlue, ko: !!res.koActive, open: 4 - q, act: activity(res), phos1: st.phos >= 0.5 };
  }

  /* ============================================================ GATE AND TREE (13 Oct evening): one channel, one gate
     A single channel is either open or shut. The model sets how much of the time the gate (loop D) stays open:
     act = pOpen × light term × xylem ABA term, the same product that scales the channel share of Pf in the engine.
     The lid swings between its two poses with an eased motion (0.9 s of drawn time). Gate 0 is the channel drawn on
     the plate and in the hero; gates 0 to 3 are the four monomers of the optional tetramer view. The clock is
     scaled by PlaySpeed and shared by every view, so the hero and the drawing show the same gate. */
  var GS = { g: [], a: 1, last: 0, trace: [], tAcc: 0, seed: 7, q: [], armed: false };
  function rnd() { GS.seed = (GS.seed * 1664525 + 1013904223) >>> 0; return GS.seed / 4294967296; }
  for (var gi0 = 0; gi0 < 4; gi0++) GS.g.push({ open: true, x: 0, from: 0, to: 0, u: 1, left: 1.2 + gi0 * 0.9 });
  function ease(u) { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); }
  function activity(res) { return res ? clamp(res.pOpen * res.fBlue * (res.fAba == null ? 1 : res.fAba), 0, 1) : 1; }
  function dwell(open, a) { var m = 5 * (open ? a : 1 - a); return Math.max(0.7, m * (0.55 + 0.9 * rnd())); }
  function setOpen(g, open, now) {
    var to = open ? 0 : 1;
    if (now) { g.open = open; g.to = g.from = g.x = to; g.u = 1; g.left = dwell(open, GS.a); return; }
    if (g.open === open && g.to === to) return;
    g.open = open; g.from = g.x; g.to = to; g.u = 0; g.left = dwell(open, GS.a);
  }
  /* FIX ROUND (Q M2): at default conditions the gate is open most of the time, so a user who only watches
     would rarely see it shut. When the scene first plays, gate 0 runs one scripted cycle (about 1 s open, 2 s shut,
     2 s open, all in drawn time, so PlaySpeed stretches it) and then hands over to the model clock. Model numbers are
     not touched; the record and the readouts keep the model share. Skipped under reduced motion. */
  function armIntro() {
    if (GS.armed) return; GS.armed = true;
    if (reduced() || GS.a < 0.5) return; // only needed when the gate is open most of the time
    var g = GS.g[0]; GS.q = [{ open: false, d: 2 }, { open: true, d: 2 }];
    g.scr = true; g.left = Math.min(g.left, g.open ? 1.0 : 0.01);
  }
  function gsSet(a) {
    var ch = Math.abs(a - GS.a) > 0.02; GS.a = a;
    GS.g.forEach(function (g) {
      if (reduced()) { GS.q = []; g.scr = false; setOpen(g, a >= 0.5, true); return; }
      if (g.scr) return;
      if (a >= 0.96) setOpen(g, true); else if (a <= 0.04) setOpen(g, false);
      else if (ch) g.left = Math.min(g.left, dwell(g.open, a));
    });
  }
  function gsTick() {
    var now = performance.now(), dt = GS.last ? Math.min(0.05, (now - GS.last) / 1000) : 0; GS.last = now;
    dt *= (window.PlaySpeed ? window.PlaySpeed.get() : 1);
    if (dt <= 0 || reduced()) return 0;
    var a = GS.a;
    GS.g.forEach(function (g) {
      g.left -= dt;
      if (g.left <= 0 && g.scr && GS.q.length && g === GS.g[0]) { var nx = GS.q.shift(); setOpen(g, nx.open); g.left = nx.d; }
      else if (g.left <= 0) { g.scr = false; if (a >= 0.96) setOpen(g, true); else if (a <= 0.04) setOpen(g, false); else setOpen(g, !g.open); if (g.left <= 0) g.left = dwell(g.open, a); }
      if (g.u < 1) { g.u = Math.min(1, g.u + dt / 0.9); g.x = g.from + (g.to - g.from) * ease(g.u); }
    });
    GS.tAcc += dt;
    while (GS.tAcc >= 0.1) { GS.tAcc -= 0.1; GS.trace.push(GS.g[0].x < 0.5 ? 1 : 0); if (GS.trace.length > 200) GS.trace.shift(); }
    return dt;
  }
  /* single file stream along a path of length L; [s0, s1] is the pore; the gate sits at s1 (cytosol mouth).
     Molecules keep a gap inside and before the pore and cannot pass a shut gate; once out they drift on. */
  function Stream(n, L, s0, s1, gap, v) {
    var p = [], order = [];
    for (var i = 0; i < n; i++) { p.push(L * (1 - (i + 0.5) / n)); order.push(i); }
    return { p: p, L: L, s0: s0, s1: s1, gap: gap, v: v, wraps: p.map(function () { return 0; }),
      step: function (dt, blocked) {
        var self = this, ahead = Infinity;
        order.sort(function (a, b) { return p[b] - p[a]; });
        order.forEach(function (i) {
          var q0 = p[i], nq = q0 + self.v * dt;
          if (q0 < self.s1) { nq = Math.min(nq, ahead - self.gap); if (blocked) nq = Math.min(nq, self.s1 - 0.04 * self.gap); nq = Math.max(q0, nq); }
          p[i] = nq; ahead = nq;
        });
        for (var k = 0; k < n; k++) if (p[k] >= L) { p[k] -= L; this.wraps[k]++; }
      } };
  }

  /* ------------------------------------------------------------ colours */
  function cssVar(name) {
    var v = ''; try { v = getComputedStyle(el).getPropertyValue(name).trim(); } catch (e) { /* none */ }
    return v || '#888888';
  }
  function mixHex(a, b, t) {
    function p(h) { h = h.replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&'); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
    try { var x = p(a), y = p(b); return 'rgb(' + x.map(function (c, i) { return Math.round(c + t * (y[i] - c)); }).join(',') + ')'; } catch (e) { return b; }
  }
  function q(sel, root) { return (root || el).querySelector(sel); }

  /* ============================================================ SVG: the real tetramer, seen from the cytosol (shown by the toggle) */
  var SV = { top: null, side: null };
  // top view (from the cytosol), 520 x 520; monomer k is rotate(k × 90°) of the template; pore at (−58, −58)
  function topSVG() {
    var mono = '<path d="M-10,-14 C-12,-60 -34,-106 -72,-112 C-102,-114 -116,-98 -112,-68 C-106,-28 -62,-8 -16,-10 Z" fill="url(#m5-h)" stroke="var(--ink)" stroke-width="1.6" stroke-linejoin="round"/>' +
      '<g fill="var(--m5-helix)" stroke="var(--ink)" stroke-width="1.1"><circle cx="-58" cy="-90" r="11"/><circle cx="-86" cy="-72" r="11"/><circle cx="-88" cy="-42" r="10"/><circle cx="-60" cy="-26" r="10"/><circle cx="-30" cy="-40" r="10"/><circle cx="-30" cy="-72" r="10"/></g>' +
      '<g fill="var(--m5-half)" stroke="var(--ink)" stroke-width=".8"><circle cx="-46" cy="-58" r="4.5"/><circle cx="-70" cy="-58" r="4.5"/></g>';
    var g = '';
    for (var k = 0; k < 4; k++) {
      g += '<g transform="rotate(' + (k * 90) + ')" data-m="' + k + '">' + mono +
        '<circle cx="-58" cy="-58" r="12" stroke="var(--ink)" stroke-width="1.3" data-r="pore"/>' +
        '<circle cx="-58" cy="-58" r="3.4" data-r="wdot"/>' +
        // loop D cap, drawn over the pore; opacity = cap fraction
        '<path data-r="cap" d="M-80,-36 C-88,-64 -64,-84 -38,-74 C-26,-56 -36,-32 -58,-28 C-68,-28 -76,-30 -80,-36Z" fill="url(#m5-xh)" stroke="var(--m5-loopd)" stroke-width="2.2"/>' +
        '<circle data-r="his" cx="-46" cy="-50" r="5" stroke="var(--ink)" stroke-width="1"/>' +
        '<text data-r="hisH" x="-46" y="-62" font-size="12" text-anchor="middle" transform="rotate(' + (-k * 90) + ' -46 -65)">H⁺</text>' +
        // loop B Ser115 and C terminus Ser274, phosphate beads
        '<path d="M-96,-22 C-104,-8 -96,4 -86,0" fill="none" stroke="var(--m5-loopb)" stroke-width="2"/>' +
        '<circle cx="-86" cy="0" r="4" fill="var(--paper)" stroke="var(--ink)"/>' +
        '<g data-r="p1"><circle cx="-80" cy="10" r="8.5" fill="var(--m5-phos)" stroke="var(--ink)" stroke-width=".8"/><text x="-80" y="14" font-size="11" class="m5-glyph" text-anchor="middle" font-weight="600" transform="rotate(' + (-k * 90) + ' -80 10)">P</text></g>' +
        '<path d="M-14,-108 C0,-124 16,-128 30,-122" fill="none" stroke="var(--m5-loopb)" stroke-width="2"/>' +
        '<circle cx="30" cy="-122" r="4" fill="var(--paper)" stroke="var(--ink)"/>' +
        '<g data-r="p2"><circle cx="40" cy="-114" r="8.5" fill="var(--m5-phos)" stroke="var(--ink)" stroke-width=".8"/><text x="40" y="-110" font-size="11" class="m5-glyph" text-anchor="middle" font-weight="600" transform="rotate(' + (-k * 90) + ' 40 -114)">P</text></g>' +
        // N terminus with Ca2+
        '<path d="M-104,-60 C-112,-48 -108,-34 -98,-28" fill="none" stroke="var(--m5-loopb)" stroke-width="2"/>' +
        '<g data-r="ca"><path d="M-96,-28 L-82,-36" stroke="var(--m5-ca)" stroke-width="3" stroke-linecap="round"/><circle cx="-98" cy="-26" r="6.5" fill="var(--m5-ca)" stroke="var(--ink)" stroke-width=".8"/></g>' +
        '</g>';
    }
    return '<svg viewBox="0 0 520 540" role="img" aria-labelledby="m5-tt m5-td"><title id="m5-tt">Top view of the aquaporin tetramer seen from the cytosol</title><desc id="m5-td" data-r="tdesc"></desc>' +
      '<defs><pattern id="m5-lip" width="12" height="10.4" patternUnits="userSpaceOnUse"><rect width="12" height="10.4" fill="var(--m5-core)"/><circle cx="3" cy="2.6" r="2.7" fill="var(--m5-head)" stroke="var(--m5-headS)" stroke-width=".55"/><circle cx="9" cy="7.8" r="2.7" fill="var(--m5-head)" stroke="var(--m5-headS)" stroke-width=".55"/><circle cx="-3" cy="7.8" r="2.7" fill="var(--m5-head)" stroke="var(--m5-headS)" stroke-width=".55"/><circle cx="15" cy="2.6" r="2.7" fill="var(--m5-head)" stroke="var(--m5-headS)" stroke-width=".55"/></pattern>' +
      '<pattern id="m5-h" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="4" height="4" fill="var(--m5-helix2)"/><path d="M0,2 H4" stroke="var(--ink)" stroke-width=".5" opacity=".6"/></pattern>' +
      '<pattern id="m5-xh" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="4" height="4" fill="var(--wall)"/><path d="M0,2 H4 M2,0 V4" stroke="var(--m5-loopd)" stroke-width=".9"/></pattern></defs>' +
      '<text x="16" y="24" font-size="14" class="sc">Fig. a  the tetramer, seen from the cytosol</text>' +
      '<text x="16" y="42" font-size="12.5" class="m5-it" data-r="tsub"></text>' +
      '<ellipse cx="260" cy="268" rx="240" ry="206" fill="url(#m5-lip)" stroke="var(--rule)" stroke-dasharray="1 3"/>' +
      '<g data-r="tetra" transform="translate(260,262)">' + g + '<circle r="6" fill="var(--paper)" stroke="var(--ink)"/></g>' +
            '<g data-r="kolbl"><rect x="150" y="248" width="220" height="30" rx="3" fill="var(--paper)" stroke="var(--b-pp)" stroke-dasharray="4 3"/><text x="260" y="268" font-size="13" text-anchor="middle">PIP2;1 knocked out</text></g>' +
      '<g aria-label="scale bar, ten nanometres"><rect x="120" y="500" width="56" height="6" fill="var(--ink)"/><rect x="176" y="500" width="56" height="6" fill="var(--paper)" stroke="var(--ink)"/><rect x="232" y="500" width="56" height="6" fill="var(--ink)"/><rect x="288" y="500" width="56" height="6" fill="var(--paper)" stroke="var(--ink)"/><rect x="344" y="500" width="56" height="6" fill="var(--ink)"/>' +
      '<text x="120" y="524" font-size="12" text-anchor="middle">0</text><text x="260" y="524" font-size="12" text-anchor="middle">5</text><text x="400" y="524" font-size="12" text-anchor="middle">10 nm</text></g>' +
      '<text x="16" y="536" font-size="10.5" class="m5-t2">schematic; scale approximate</text>' +
      '</svg>';
  }
  /* ============================================================ SVG: one channel, cut open (side view), the default drawing
     viewBox 460 × 580. The pore runs from y 140 (apoplast mouth) to y 360 (cytosol mouth, where loop D shuts it). */
  var ONE = { cx: 230, top: 140, bot: 360, L: 430, s0: 100, s1: 320, piv: [306, 364] };
  var PORE = [[140, 30], [168, 22], [200, 12], [224, 14], [250, 10], [276, 14], [320, 20], [360, 30]];
  var OUTR = [[140, 62], [143, 84], [152, 97], [166, 102], [334, 102], [348, 97], [357, 84], [360, 62]];
  function wallPath(side) {
    var cx = ONE.cx, d = '';
    OUTR.forEach(function (p, i) { d += (i ? ' L' : 'M') + (cx + side * p[1]) + ',' + p[0]; });
    PORE.slice().reverse().forEach(function (p) { d += ' L' + (cx + side * p[1]) + ',' + p[0]; });
    return d + 'Z';
  }
  function oneSVG() {
    var cx = ONE.cx, P = ONE.piv;
    var s = '<svg viewBox="0 0 460 580" role="img" aria-labelledby="m5-ot m5-od"><title id="m5-ot">One aquaporin pore cut open, seen from the side, with its gate</title><desc id="m5-od" data-r="odesc"></desc>' +
      '<defs><pattern id="m5-bil1" width="14" height="150" patternUnits="userSpaceOnUse"><rect width="14" height="150" fill="var(--m5-core)"/><circle cx="7" cy="8" r="5.5" fill="var(--m5-head)" stroke="var(--m5-headS)" stroke-width=".8"/><path d="M5,14 V68 M9,14 V66 M5,82 V136 M9,84 V136" stroke="var(--m5-headS)" stroke-width=".6"/><circle cx="7" cy="142" r="5.5" fill="var(--m5-head)" stroke="var(--m5-headS)" stroke-width=".8"/></pattern>' +
      '<pattern id="m5-h1" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="var(--m5-helix2)"/><path d="M0,2.5 H5" stroke="var(--ink)" stroke-width=".5" opacity=".5"/></pattern>' +
      '<g id="m5-w"><circle cx="5" cy="-4" r="3.3" style="fill:var(--mol-h2o-h,#8fb8ee);stroke:var(--mol-rim,#3a3a3a)" stroke-width=".5"/><circle cx="-5" cy="-4" r="3.3" style="fill:var(--mol-h2o-h,#8fb8ee);stroke:var(--mol-rim,#3a3a3a)" stroke-width=".5"/><circle r="6.2" style="fill:var(--mol-h2o,#1d4aa5);stroke:var(--mol-rim,#3a3a3a)" stroke-width=".7"/></g>' +
      '<g id="m5-hp"><circle r="5.4" fill="#ffd23a" stroke="#7a5a00" stroke-width=".7"/><path d="M-2.6,0 H2.6 M0,-2.6 V2.6" stroke="#5a4000" stroke-width="1.3"/></g>' +
      '<clipPath id="m5-oc"><rect x="0" y="30" width="460" height="452"/></clipPath></defs>' +
      '<text x="16" y="22" font-size="14" class="sc">Fig. a  one water pore, cut open</text>' +
      '<text x="444" y="54" font-size="12.5" text-anchor="end" class="m5-it">apoplast, cell wall side</text>' +
      '<text x="444" y="474" font-size="12.5" text-anchor="end" class="m5-it">cytosol</text>' +
      '<rect x="8" y="170" width="444" height="160" fill="url(#m5-bil1)"/>' +
      '<text x="12" y="346" font-size="10.5" class="m5-t2">lipid bilayer (4 nm)</text>' +
      '<g data-r="lip"></g>' +
      // the protein, sliced through the pore: two cut faces with helix hatching, the pore between them
      '<path d="M' + (cx - 102) + ',150 Q' + cx + ',122 ' + (cx + 102) + ',150 L' + (cx + 102) + ',350 Q' + cx + ',378 ' + (cx - 102) + ',350Z" fill="var(--m5-helix)" opacity=".28"/>' +
      '<path d="' + wallPath(-1) + '" fill="url(#m5-h1)" stroke="var(--ink)" stroke-width="1.5" stroke-linejoin="round"/>' +
      '<path d="' + wallPath(1) + '" fill="url(#m5-h1)" stroke="var(--ink)" stroke-width="1.5" stroke-linejoin="round"/>' +
      '<path d="M' + PORE.map(function (p) { return (cx - p[1]) + ',' + p[0]; }).join(' L') + ' L' + PORE.slice().reverse().map(function (p) { return (cx + p[1]) + ',' + p[0]; }).join(' L') + 'Z" fill="var(--wall)" opacity=".9" data-r="pore"/>' +
      // half helices meeting mid membrane (NPA motifs)
      '<path d="M' + (cx - 74) + ',176 L' + (cx - 16) + ',246 M' + (cx - 74) + ',326 L' + (cx - 16) + ',254" stroke="var(--m5-half)" stroke-width="6" stroke-linecap="round"/>' +
      '<g class="tier-2"><text x="' + (cx - 96) + '" y="254" font-size="10.5" text-anchor="end" class="m5-t2">NPA</text><path d="M' + (cx - 94) + ',251 H' + (cx - 46) + '" stroke="var(--ink2)" stroke-width=".7"/></g>' +
      '<g clip-path="url(#m5-oc)"><g data-r="wfile"></g></g>' +
      // loop B with Ser115 (left), C terminus with Ser274
      '<path d="M' + (cx - 66) + ',358 C' + (cx - 80) + ',380 ' + (cx - 92) + ',392 ' + (cx - 80) + ',406" fill="none" stroke="var(--m5-loopb)" stroke-width="2.4"/>' +
      '<circle cx="' + (cx - 80) + '" cy="406" r="4.6" fill="var(--paper)" stroke="var(--ink)"/>' +
      '<g data-r="p1"><circle cx="' + (cx - 92) + '" cy="418" r="9" fill="var(--m5-phos)" stroke="var(--ink)" stroke-width=".8"/><text x="' + (cx - 92) + '" y="422" font-size="11" class="m5-glyph" text-anchor="middle" font-weight="600">P</text></g>' +
      '<path d="M' + (cx - 40) + ',362 C' + (cx - 34) + ',396 ' + (cx - 58) + ',420 ' + (cx - 46) + ',446" fill="none" stroke="var(--m5-loopb)" stroke-width="2.4"/>' +
      '<circle cx="' + (cx - 46) + '" cy="446" r="4.6" fill="var(--paper)" stroke="var(--ink)"/>' +
      '<g data-r="p2"><circle cx="' + (cx - 32) + '" cy="456" r="9" fill="var(--m5-phos)" stroke="var(--ink)" stroke-width=".8"/><text x="' + (cx - 32) + '" y="460" font-size="11" class="m5-glyph" text-anchor="middle" font-weight="600">P</text></g>' +
      '<g class="tier-2" font-size="10.5"><text x="' + (cx - 108) + '" y="402" text-anchor="end" class="m5-t2">Ser115, loop B</text><text x="' + (cx - 60) + '" y="474" text-anchor="end" class="m5-t2">Ser274, C terminus</text></g>' +
      // N terminus with the Ca2+ site, and its bridge to loop D (closed pose)
      '<path d="M' + (cx + 70) + ',356 C' + (cx + 86) + ',366 ' + (cx + 94) + ',378 ' + (cx + 92) + ',388" fill="none" stroke="var(--m5-loopb)" stroke-width="2.4"/>' +
      '<g data-r="ca"><path data-r="cab" d="M' + (cx + 88) + ',390 L' + (cx + 56) + ',386" stroke="var(--m5-ca)" stroke-width="3.2" stroke-linecap="round"/><circle cx="' + (cx + 94) + '" cy="392" r="7.5" fill="var(--m5-ca)" stroke="var(--ink)" stroke-width=".8"/></g>' +
      // loop D, the gate: pivots at its base; closed pose puts the lid under the cytosol mouth
      '<g data-r="ld"><path d="M' + P[0] + ',' + P[1] + ' C' + (P[0] - 4) + ',394 ' + (cx + 34) + ',396 ' + (cx + 16) + ',386 C' + (cx + 6) + ',380 ' + cx + ',378 ' + (cx - 6) + ',376" fill="none" stroke="var(--m5-loopd)" stroke-width="5.5" stroke-linecap="round"/>' +
      '<ellipse cx="' + (cx - 2) + '" cy="372" rx="36" ry="8.5" fill="var(--m5-loopd)" stroke="var(--ink)" stroke-width="1" opacity=".92"/>' +
      '<circle data-r="his" cx="' + (cx + 22) + '" cy="388" r="6.5" stroke="var(--ink)" stroke-width="1"/>' +
      '<g data-r="hb" transform="translate(' + (cx + 32) + ',400) scale(.8)"><use href="#m5-hp"/></g></g>' +
      '<g font-size="11"><text x="' + (cx + 108) + '" y="372" class="tier-1-only">loop D, the gate</text><text x="' + (cx + 108) + '" y="372" class="tier-2">loop D (His193)</text>' +
      '<text x="452" y="420" text-anchor="end" class="tier-2 m5-t2">Ca²⁺ site (N terminus)</text></g>' +
      '<text x="16" y="40" font-size="11" class="tier-2 m5-t2">residue numbers: spinach SoPIP2;1</text>' +
      '<g data-r="hps"></g><g data-r="names"></g>' +
      // the state of this gate and its record over time
      '<text x="16" y="506" font-size="14" font-weight="600" data-r="gst"></text>' +
      '<text x="16" y="522" font-size="11.5" class="m5-t2" data-r="gsub"></text>' +
      '<g transform="translate(0,532)"><text x="16" y="12" font-size="10.5" class="m5-t2">open</text><text x="16" y="34" font-size="10.5" class="m5-t2">shut</text>' +
      '<path d="M52,8 H440 M52,30 H440" stroke="var(--rule2)" stroke-width="1"/><polyline data-r="trace" fill="none" stroke="var(--accent)" stroke-width="2"/>' +
      '<text x="440" y="46" font-size="10" text-anchor="end" class="m5-t2">this gate, the last 20 s of drawn time</text></g>' +
      '</svg>';
    return s;
  }
  var ONEST = Stream(16, 430, 100, 320, 22, 34);
  var LIPW = [{ x: 44, p: 0 }, { x: 418, p: 0.55 }];
  var NAME1 = { k: -1, hold: 0 };
  function onePos(s, i, wr) {
    var d = Math.max(0, ONE.s0 - s, s - ONE.s1), a = i * 2.399 + wr * 1.3;
    return [ONE.cx + Math.sin(a) * d * 0.55 + (d ? 0 : Math.sin(s * 0.09 + i) * 1.4), 40 + s];
  }
  function drawOne(tg, dt) {
    var svg = refs.svgOne; if (!svg || !tg) return;
    var g0 = GS.g[0], x = g0.x, blocked = x > 0.5;
    if (dt > 0) {
      ONEST.step(dt, blocked);
      var lr = (WP.params.gate.PF_LIPID.v / WP.params.gate.PF_CH.v) * 0.06;
      LIPW.forEach(function (w) { w.p = (w.p + dt * lr) % 1; });
    }
    q('[data-r="ld"]', svg).setAttribute('transform', 'rotate(' + (-72 * (1 - x)).toFixed(1) + ' ' + ONE.piv[0] + ' ' + ONE.piv[1] + ')');
    var his0 = cssVar('--m5-his'), hisH = cssVar('--m5-hisH');
    q('[data-r="his"]', svg).setAttribute('fill', mixHex(his0.charAt(0) === '#' ? his0 : '#6b6152', hisH.charAt(0) === '#' ? hisH : '#c0471c', tg.prot));
    q('[data-r="hb"]', svg).setAttribute('opacity', tg.prot > 0.5 ? '1' : '0');
    q('[data-r="p1"]', svg).setAttribute('opacity', tg.phos1 ? '1' : '0');
    q('[data-r="p2"]', svg).setAttribute('opacity', tg.phos1 ? '1' : '0');
    q('[data-r="ca"]', svg).setAttribute('opacity', tg.ca ? '1' : '0');
    q('[data-r="cab"]', svg).setAttribute('opacity', tg.ca && x > 0.75 ? '1' : '0');
    // single file water
    var h = '', pos = [];
    ONEST.p.forEach(function (s, i) {
      var xy = onePos(s, i, ONEST.wraps[i]), f = Math.min(1, s / 40, (ONEST.L - s) / 40);
      pos.push(xy);
      if (f <= 0.02) return;
      h += '<use href="#m5-w" transform="translate(' + xy[0].toFixed(1) + ' ' + xy[1].toFixed(1) + ') rotate(' + ((s * 2.2 + i * 50) % 360).toFixed(0) + ') scale(' + f.toFixed(2) + ')"/>';
    });
    LIPW.forEach(function (w) { h += '<use href="#m5-w" opacity=".7" transform="translate(' + w.x + ' ' + (150 + w.p * 200).toFixed(1) + ') scale(.8)"/>'; });
    q('[data-r="wfile"]', svg).innerHTML = h;
    // free protons in the cytosol, as many as the protonated share of the gates (an acid cytosol)
    var nH = Math.round(6 * clamp(tg.prot, 0, 1)), hp = '', tt = GS.last / 1000;
    for (var k = 0; k < nH; k++) hp += '<use href="#m5-hp" transform="translate(' + (110 + ((k * 61) % 240) + Math.sin(tt * 0.6 + k) * 6).toFixed(1) + ' ' + (424 + (k % 3) * 14 + Math.cos(tt * 0.5 + k) * 4).toFixed(1) + ')"/>';
    q('[data-r="hps"]', svg).innerHTML = hp;
    // one name (anti clutter rule): an H₂O in the pore; it keeps its name until it leaves the pore
    var nm = '';
    if (!window.MolNames || window.MolNames.get()) {
      var s0 = ONEST.p[NAME1.k];
      if (NAME1.k < 0 || s0 == null || s0 < ONE.s0 + 10 || s0 > ONE.s1 - 10) {
        NAME1.k = -1;
        ONEST.p.forEach(function (s, i) { if (NAME1.k < 0 && s > ONE.s0 + 40 && s < ONE.s1 - 60) NAME1.k = i; });
      }
      if (NAME1.k >= 0) {
        var xy = pos[NAME1.k];
        nm += '<g transform="translate(' + (xy[0] + 30).toFixed(1) + ' ' + xy[1].toFixed(1) + ')"><path d="M-22,0 H-10" stroke="var(--ink2)" stroke-width=".8"/><rect x="-10" y="-8.5" width="34" height="17" rx="8.5" fill="rgba(14,20,16,.82)"/><text x="7" y="4" font-size="10.5" text-anchor="middle" style="fill:#fbf7ec">H₂O</text></g>';
      }
      if (tg.prot > 0.5) nm += '<g transform="translate(' + (ONE.cx + 66) + ' 446)"><rect x="-15" y="-8.5" width="30" height="17" rx="8.5" fill="rgba(14,20,16,.82)"/><text x="0" y="4" font-size="10.5" text-anchor="middle" style="fill:#fbf7ec">H⁺</text></g>';
    }
    q('[data-r="names"]', svg).innerHTML = nm;
    // state line and record
    var pct = Math.round(100 * GS.a);
    q('[data-r="gst"]', svg).textContent = tg.ko ? 'PIP2;1 knocked out: other PIPs carry the flow (model)' : (x < 0.5 ? 'Gate open: water passes in single file' : 'Gate shut: loop D caps the pore');
    q('[data-r="gsub"]', svg).textContent = 'In the model this gate is open about ' + pct + ' % of the time.';
    var tr = GS.trace, n = tr.length, pts = '';
    for (var j = 0; j < n; j++) pts += (52 + (388 * (j + 200 - n) / 199)).toFixed(1) + ',' + (tr[j] ? 8 : 30) + ' ';
    q('[data-r="trace"]', svg).setAttribute('points', pts.trim());
    q('[data-r="odesc"]', svg).textContent = 'The gate, loop D, is ' + (x < 0.5 ? 'open' : 'shut') + '. In the model it is open about ' + pct + ' % of the time. ' + (tg.phos1 ? 'Both serines carry a phosphate. ' : 'The serines carry no phosphate. ') + (tg.prot > 0.5 ? 'His193 is protonated. ' : '') + (tg.ca ? 'Ca²⁺ is raised. ' : '');
  }
  function updTop(tg) {
    var top = refs.svgTop; if (!top || !refs.tetraWrap || refs.tetraWrap.hidden) return;
    var his0 = cssVar('--m5-his'), hisH = cssVar('--m5-hisH');
    var hisC = mixHex(his0.charAt(0) === '#' ? his0 : '#6b6152', hisH.charAt(0) === '#' ? hisH : '#c0471c', tg.prot);
    var nOpen = 0;
    for (var k = 0; k < 4; k++) {
      var g = q('[data-m="' + k + '"]', top), c = GS.g[k].x;
      if (c < 0.5) nOpen++;
      q('[data-r="pore"]', g).setAttribute('fill', '#2b5fa4');
      q('[data-r="wdot"]', g).setAttribute('fill', 'var(--paper)');
      var cap = q('[data-r="cap"]', g);
      cap.setAttribute('opacity', (0.12 + 0.88 * c).toFixed(2));
      cap.setAttribute('stroke-dasharray', c < 0.5 ? '3 3' : 'none');
      q('[data-r="his"]', g).setAttribute('fill', hisC);
      q('[data-r="hisH"]', g).setAttribute('opacity', tg.prot > 0.5 ? '1' : '0');
      q('[data-r="p1"]', g).setAttribute('opacity', tg.phos[k] ? '1' : '0');
      q('[data-r="p2"]', g).setAttribute('opacity', tg.phos[k] ? '1' : '0');
      q('[data-r="ca"]', g).setAttribute('opacity', tg.ca ? '1' : '0');
    }
    q('[data-r="kolbl"]', top).setAttribute('opacity', '0');
    q('[data-r="tsub"]', top).textContent = nOpen + ' of 4 gates open right now; each flicks open and shut on its own';
    q('[data-r="tdesc"]', top).textContent = 'Four monomers around a central axis, each with its own pore and its own loop D gate. ' + nOpen + ' of 4 gates open now. ' + tg.nP + ' of 4 monomers phosphorylated.';
  }

  /* ============================================================ animation loop for the drawing (only while visible) */
  var anim = { raf: 0, t: 0, paused: false, rm: null }; // v19: reduced motion starts paused (set at mount); Play or a click on the drawing runs it
  function plateVisible() {
    if (!el || document.hidden) return false;
    if (!el.offsetParent && el.getClientRects().length === 0) return false;
    return refs.inView !== false;
  }
  function kick() { if (!anim.raf) { anim.t = 0; anim.raf = requestAnimationFrame(frame); } }
  function frame(ts) {
    anim.raf = 0;
    if (!plateVisible() || !lastRes) return;
    var dt = anim.t ? Math.min(0.05, (ts - anim.t) / 1000) : 0; anim.t = ts;
    dt *= (window.PlaySpeed ? window.PlaySpeed.get() : 1);
    if (anim.paused) dt = 0; else { if (dt > 0 && (!HM.ctx || HM.ctx.fallback)) armIntro(); gsTick(); }
    var tg = targets(lastSt, lastRes);
    drawOne(tg, dt); updTop(tg);
    if (!anim.paused) anim.raf = requestAnimationFrame(frame);
  }

  /* ============================================================ readouts */
  function chainNodes(st, res) {
    var R = res.R;
    return [
      { k: 'p<sub>open</sub>', id: 'po', v: num(res.pOpen, 2), x: res.pOpen, w: 'gate open probability', ww: res.pOpen > 0.6 ? 'gates mostly open' : (res.pOpen > 0.3 ? 'gates half shut' : 'gates mostly shut') },
      { k: 'P<sub>f</sub>', id: 'pf', v: num(res.Pf, 0) + ' <small>µm s⁻¹</small>', x: res.Pf, w: 'membrane water permeability', ww: 'water crossing the membrane' },
      { k: 'R<sub>bs</sub> and R<sub>ox</sub>', id: 'rox', v: '<span style="font-size:13px">bs</span> ' + num(R.bs * 1000, 1) + '<br><span style="font-size:13px">ox</span> ' + num(R.ox * 1000, 1) + ' <small>MPa m² s mol⁻¹</small>', x: R.ox, w: 'sheath and outside xylem resistance', ww: 'resistance outside the veins', inv: true },
      { k: 'K<sub>leaf</sub>', id: 'kl', v: num(res.K.leaf, 2) + ' <small>mmol m⁻² s⁻¹ MPa⁻¹</small>', x: res.K.leaf, w: '1 ÷ (R<sub>leaf xylem</sub> + R<sub>ox</sub>)', ww: 'how easily the leaf passes water' },
      { k: 'leaf Ψ', id: 'psi', v: WP.fmt.psi(res.psi.leafOut), x: res.psi.leafOut, w: 'end of the outside xylem path', ww: 'water status the stomata sense' },
      { k: 'g<sub>s</sub>', id: 'gs', v: num(res.gs, 3) + ' <small>mol m⁻² s⁻¹</small>', x: res.gs, w: num(100 * res.gs / res.gsMax, 0) + ' % of g<sub>s,max</sub>; ψ<sub>50</sub> ' + WP.fmt.psi(res.psi50), ww: num(100 * res.gs / res.gsMax, 0) + ' % open' }
    ];
  }
  function drawChain(st, res) {
    var nodes = chainNodes(st, res), host = refs.chain;
    if (!host.firstChild) {
      host.innerHTML = nodes.map(function (n, i) {
        return (i ? '<span class="m5-ar" aria-hidden="true" data-a="' + n.id + '">→</span>' : '') +
          '<div class="m5-node" data-n="' + n.id + '"><div class="k">' + n.k + '</div><div class="v"></div><div class="w tier-2"></div><div class="w tier-1-only" data-p="1"></div></div>';
      }).join('');
    }
    nodes.forEach(function (n) {
      var d = host.querySelector('[data-n="' + n.id + '"]');
      var arrow = '';
      if (prev && prev[n.id] !== undefined) {
        var dv = n.x - prev[n.id], tol = Math.max(1e-4, Math.abs(prev[n.id]) * 0.002);
        if (Math.abs(dv) > tol) {
          arrow = dv > 0 ? '▲' : '▼';
          var a = host.querySelector('[data-a="' + n.id + '"]');
          if (a) { a.classList.remove('pulse'); void a.offsetWidth; a.classList.add('pulse'); }
        }
      }
      d.querySelector('.v').innerHTML = n.v + (arrow ? '<span class="d" aria-label="' + (arrow === '▲' ? 'rose' : 'fell') + '">' + arrow + '</span>' : '');
      d.querySelector('.w.tier-2').innerHTML = n.w;
      d.querySelector('[data-p]').innerHTML = n.ww;
      d.classList.toggle('ko', !!res.koActive && n.id === 'gs');
    });
    var p = {}; nodes.forEach(function (n) { p[n.id] = n.x; }); prev = p;
  }
  // tier 1 plain chain
  function plainChain(st, res, ref) {
    function dir(a, b, up, dn, same) { return Math.abs(a - b) < Math.max(1e-3, Math.abs(b) * 0.01) ? same : (a > b ? up : dn); }
    if (st.phos === 1 && st.pHcyt >= 7.6 && st.ca === 'low' && st.lightQ === 'rb' && st.ppfd > 0 && st.aba === 'none' && !st.ko) return 'This is the all open state: every channel phosphorylated, cytosol at pH 7.6, Ca²⁺ low, red and blue light, no water stress. Try the acid cytosol.';
    function d2(a, b, up, dn) { return Math.abs(a - b) < 0.005 ? 'barely changes' : (a > b ? up : dn); }
    return 'Compared with every gate open (phosphorylated, pH 7.6, low Ca²⁺, red and blue light, no water stress, same afternoon): the membrane passes water ' + dir(res.Pf, ref.Pf, 'faster', 'more slowly', 'just as fast') +
      ', the leaf conducts water ' + dir(res.K.leaf, ref.K.leaf, 'better', 'less well', 'the same') +
      ', leaf water potential ' + d2(res.psi.leafOut, ref.psi.leafOut, 'is less negative', 'is more negative') +
      ', and the stomata ' + d2(res.gs / res.gsMax, ref.gs / ref.gsMax, 'are more open', 'are more closed') + '.';
  }
  function refState(st) { var s = {}; for (var k in st) s[k] = st[k]; s.phos = 1; s.pHcyt = 7.6; s.ca = 'low'; s.lightQ = 'rb'; s.ko = false; s.expr = 1; s.aba = 'none'; return s; }

  // mini staircase, an echo of Plate II
  var NODES = [['soil', 'soil'], ['root', 'root'], ['stem', 'stem'], ['petiole', 'petiole'], ['leafX', 'leaf xylem'], ['leafOut', 'outside xylem']];
  function staircase(st, res, ref) {
    var W = 460, H = 236, x0 = 46, x1 = W - 12, y0 = 44, y1 = H - 40;
    var lo = Math.min(res.psi.leafOut, ref.psi.leafOut), mn = Math.min(-0.5, Math.floor((lo - 0.1) * 2) / 2);
    function Y(p) { return y1 - (0 - p) / (0 - mn) * (y1 - y0); }   // more negative upward: soil low, leaf high
    var n = NODES.length, dx = (x1 - x0) / n;
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-labelledby="m5-sct"><title id="m5-sct">Water potential staircase from soil to the end of the outside xylem path. Solid: now. Dashed: every gate open, same afternoon.</title>';
    for (var g = 0; g >= mn - 1e-9; g -= 0.5) {
      s += '<line x1="' + x0 + '" x2="' + x1 + '" y1="' + Y(g).toFixed(1) + '" y2="' + Y(g).toFixed(1) + '" stroke="var(--rule2)" stroke-width="1"/>' +
        '<text x="' + (x0 - 6) + '" y="' + (Y(g) + 4).toFixed(1) + '" font-size="10.5" text-anchor="end" class="m5-t2">' + num(g, 1) + '</text>';
    }
    s += '<text x="6" y="14" font-size="10.5" class="m5-t2">Ψ, MPa (drier, more negative ↑)</text>';
    s += '<path d="M' + (x0 - 34) + ',' + (y1 - 6) + ' V' + (y0 + 20) + '" stroke="var(--ink2)" stroke-width="1" fill="none"/><path d="M' + (x0 - 38) + ',' + (y0 + 26) + ' l4,-8 l4,8z" fill="var(--ink2)"/>';
    function path(r, dash, col, w) {
      var d = '';
      NODES.forEach(function (nd, i) { var y = Y(r.psi[nd[0]]); d += (i ? ' V' + y.toFixed(1) : 'M' + (x0 + 2) + ',' + y.toFixed(1)) + ' H' + (x0 + (i + 1) * dx - 2).toFixed(1); });
      return '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="' + w + '"' + (dash ? ' stroke-dasharray="5 4"' : '') + '/>';
    }
    // highlight the outside xylem tread
    s += '<rect x="' + (x0 + 5 * dx).toFixed(1) + '" y="' + y0 + '" width="' + dx.toFixed(1) + '" height="' + (y1 - y0) + '" fill="var(--accent)" opacity=".08"/>';
    s += path(ref, true, 'var(--ink2)', 1.4) + path(res, false, ui.water(res.psi.leafOut), 3.2);
    NODES.forEach(function (nd, i) {
      s += '<text x="' + (x0 + (i + 0.5) * dx).toFixed(1) + '" y="' + (H - 22) + '" font-size="10.5" text-anchor="middle"' + (i === 5 ? ' font-weight="600"' : ' class="m5-t2"') + '>' + nd[1] + '</text>';
    });
    s += '<text x="' + x1 + '" y="28" font-size="10.5" text-anchor="end" class="m5-t2">air Ψ ' + WP.fmt.psi(res.psiAir, 0) + ', far above this scale ↑</text>';
    s += '<text x="' + (x0 + 5.5 * dx).toFixed(1) + '" y="' + (Y(res.psi.leafOut) - 6).toFixed(1) + '" font-size="11" text-anchor="middle" font-weight="600">' + WP.fmt.psi(res.psi.leafOut) + '</text>';
    s += '</svg>';
    return s;
  }

  function blueChain(st, res) {
    var on = st.ppfd > 0 && st.lightQ === 'rb' && st.aba !== 'xylem';
    var steps = [['Blue light', 'with red, at the leaf'], ['Phototropins', 'phot1, phot2, bundle sheath'], ['AHA2 H⁺ ATPase', 'bundle sheath plasma membrane'], ['Sap acidifies', 'protons pumped out to the xylem sap'], ['Which aquaporin senses it?', 'not known: an open question', 'oq'], ['K<sub>leaf</sub> up', 'Arabidopsis']];
    return steps.map(function (s, i) {
      return (i ? '<span class="m5-bar2" aria-hidden="true">' + (i === 4 || i === 5 ? '⇢' : '→') + '</span>' : '') + '<div class="m5-bstep ' + (on ? 'on' : 'off') + (s[2] ? ' oq' : '') + '"><b>' + s[0] + '</b><small>' + s[1] + '</small></div>';
    }).join('');
  }

  function nowText(st, res, tg) {
    var s = [], pct = num(100 * tg.act, 0);
    if (res.koActive) s.push('PIP2;1 is knocked out. In the model the membrane still passes water at <b>' + WP.fmt.Pf(res.Pf) + '</b>, because the grapevine preprint found K<sub>leaf</sub> vulnerability unchanged; the drawn channel stands for the other PIPs, and what changes is the stomata, which close later.');
    else s.push('This channel\'s gate is open about <b>' + pct + ' %</b> of the time, and the membrane passes water at <b>' + WP.fmt.Pf(res.Pf) + '</b> (model).');
    if (tg.prot > 0.5) s.push('The cytosol is acidic (pH ' + num(st.pHcyt, 2) + '): His193 on loop D picks up a proton and the gate stays shut more of the time, as in a flooded root.');
    if (st.phos < 0.5) s.push('Most channels have lost their phosphates, which favours the shut gate.');
    if (tg.ca) s.push('Raised Ca²⁺ favours the shut gate (shown in purified membranes).');
    if (st.expr != null && st.expr < 0.9) s.push('The sheath membrane carries fewer channels than the default leaf, so even open gates pass less water.');
    if (st.expr != null && st.expr > 1.1) s.push('The sheath membrane carries more channels than the default leaf.');
    if (st.aba === 'xylem') s.push('Water stress: ABA arrives in the xylem, the sheath pump slows and P<sub>f</sub> falls.');
    if (st.aba === 'blade') s.push('ABA is on the leaf surface: the stomata close, but the sheath channels are untouched.');
    if (st.ppfd <= 0) s.push('It is dark: in many species K<sub>leaf</sub> is lower in the dark, and in the model the channel term drops to its dark level.');
    else if (st.lightQ === 'red') s.push('Under red light alone the blue light effect is missing, so the channel term is lower in the model.');
    s.push('The leaf ends its water path at <b>' + WP.fmt.psi(res.psi.leafOut) + '</b>, with ' + ui.stomata(res).text + '.');
    return s.join(' ');
  }

  /* ============================================================ evidence */
  function evMarker(key, label) {
    if (ui.evidence && typeof ui.evidence === 'function') {
      try {
        var r = ui.evidence(key, label);
        if (typeof r === 'string' && r) return r;
        if (r && r.nodeType) { var tmp = document.createElement('div'); tmp.appendChild(r); return tmp.innerHTML; }
      } catch (e) { /* fall back */ }
    }
    return '<button type="button" class="m5-evb" aria-expanded="false" data-ev="' + key + '">' + esc(label || 'Evidence') + '</button>';
  }
  function evDrawer(key) {
    var e = WP.evidence[key] || EV[key]; if (!e) return '';
    var dois = Array.isArray(e.doi) ? e.doi : (e.doi ? [e.doi] : []);
    dois.forEach(function (d) { if (ui.cite) ui.cite(d); });
    return '<p><b>' + esc(e.claim) + '</b></p><dl>' +
      '<dt>Paper</dt><dd>' + esc(e.cite) + '</dd>' +
      '<dt>What was measured</dt><dd>' + esc(e.measured) + '</dd>' +
      '<dt>Figure, note</dt><dd>' + ui.prose(e.fig) + '</dd>' +
      '<dt>DOI</dt><dd>' + dois.map(function (x) { return '<a href="https://doi.org/' + encodeURI(x) + '" target="_blank" rel="noopener">doi ' + esc(x) + '</a>'; }).join('; ') + '</dd>' +
      '<dt>Status</dt><dd>' + badge(e.badge) + '</dd></dl>';
  }
  function wireEvidence(root) {
    root.addEventListener('click', function (ev) {
      var b = ev.target.closest('.m5-evb'); if (!b || !root.contains(b)) return;
      var row = b.parentNode, key = b.getAttribute('data-ev');
      var dr = row.querySelector('.m5-evd[data-for="' + key + '"]');
      if (!dr) { dr = document.createElement('div'); dr.className = 'm5-evd'; dr.setAttribute('data-for', key); dr.id = 'm5-ev-' + key; dr.innerHTML = evDrawer(key); row.appendChild(dr); b.setAttribute('aria-controls', dr.id); dr.hidden = true; }
      var open = b.getAttribute('aria-expanded') === 'true';
      dr.hidden = open; b.setAttribute('aria-expanded', open ? 'false' : 'true');
    });
  }

  /* ============================================================ mount */
  /* ============================================================ mount */
  function rng(id, label, sub, min, max, step, cls) {
    return '<div class="m5-rng ' + (cls || '') + '"><label for="m5-' + id + '">' + label + (sub ? '<small>' + sub + '</small>' : '') + '</label><output data-o="' + id + '" for="m5-' + id + '"></output>' +
      '<input type="range" id="m5-' + id + '" min="' + min + '" max="' + max + '" step="' + step + '"></div>';
  }
  /* ------------------------------------------------------------ molecular theatre (mol.js) */
  var MT = { A: null, B: null, mode: 'pull' };
  function mountMol(w) {
    var M = window.MOL || WP.mol; if (!M) return;
    var hA = w.querySelector('[data-r="molA"]'), hB = w.querySelector('[data-r="molB"]');
    MT.A = M.Theatre(hA, M.scenes.aquaporin(), { height: function (cw) { return cw < 560 ? 370 : 430; }, dark: isDark(), reduce: reduced(),
      label: 'Animated membrane: water molecules crossing a lipid bilayer through aquaporin pores in single file, with gates, phosphates and a proton pump' });
    MT.B = M.Theatre(hB, M.scenes.cuticle(), { height: function (cw) { return cw < 560 ? 370 : 400; }, dark: isDark(), reduce: reduced(),
      label: 'Animated leaf surface: water vapour leaving through a stoma and, slowly, through the cuticle', prewarm: 8 });
    var mpb = w.querySelector('[data-mol="pause"]');
    if (window.WPFreeze && mpb) [MT.A, MT.B].forEach(function (T) { WPFreeze.attach(T.canvas, { paused: function () { return MT.A.paused; }, button: mpb }); }); // v19: click the view to freeze
    if (mpb && window.PlaySpeed) { var ch = window.PlaySpeed.chip('ps-light'); ch.style.marginLeft = '6px'; ch.style.verticalAlign = 'middle'; mpb.parentNode.insertBefore(ch, mpb.nextSibling); }
    w.addEventListener('click', function (e) {
      var b = e.target.closest('[data-mm]');
      if (b) { MT.mode = b.dataset.mm; Array.prototype.forEach.call(w.querySelectorAll('[data-mm]'), function (x) { x.setAttribute('aria-checked', x === b ? 'true' : 'false'); }); refresh(); return; }
      b = e.target.closest('[data-mol="pause"]');
      if (b) { var pz = MT.A.pause(); MT.B.pause(pz); b.setAttribute('aria-pressed', pz ? 'true' : 'false'); b.textContent = pz ? 'Play' : 'Pause'; return; }
      b = e.target.closest('[data-cut]');
      if (b) { WP.set({ soilPsi: b.dataset.cut === 'dry' ? -1.8 : -0.10 }); return; }
      b = e.target.closest('[data-ex]');
      if (b) {
        var P0 = { def: { expr: 1, aba: 'none' }, sade: { expr: 0.35, aba: 'none' }, abax: { expr: 1, aba: 'xylem' }, abab: { expr: 1, aba: 'blade' }, more: { expr: 1.5, aba: 'none' } }[b.dataset.ex];
        if (P0) WP.set(P0);
      }
    });
    var exIn = w.querySelector('#m5-expr');
    if (exIn) exIn.addEventListener('input', function (e) { WP.set({ expr: +e.target.value }); });
  }
  function updMol(st, res, tg) {
    if (!MT.A) return;
    var gp = WP.params.gate, fr = gp.fRedOnly.v;
    var blueNorm = clamp((res.fBlue - fr) / Math.max(1e-6, 1 - fr), 0, 1);
    var pfCh = Math.max(0, res.Pf - gp.PF_LIPID.v);
    MT.A.setTheme(isDark()); MT.A.setReduce(reduced()); MT.B.setTheme(isDark()); MT.B.setReduce(reduced());
    MT.A.set({ caps: tg.caps.slice(), phos: tg.phos.slice(), prot: tg.prot, ca: tg.ca, ko: tg.ko, pfLipid: gp.PF_LIPID.v, pfChannel: pfCh,
      pump: st.ppfd <= 0 ? 0.08 : 0.15 + 0.85 * blueNorm, mode: MT.mode, E: res.E, expr: st.expr == null ? 1 : st.expr, aba: st.aba === 'xylem' });
    var ex = st.expr == null ? 1 : st.expr, exIn = q('#m5-expr');
    if (exIn && document.activeElement !== exIn) exIn.value = ex;
    var exO = q('[data-o="expr"]'); if (exO) exO.textContent = '× ' + num(ex, 2);
    var preset = st.aba === 'xylem' ? 'abax' : (st.aba === 'blade' ? 'abab' : (Math.abs(ex - 0.35) < 0.01 ? 'sade' : (Math.abs(ex - 1.5) < 0.01 ? 'more' : (Math.abs(ex - 1) < 0.01 ? 'def' : ''))));
    Array.prototype.forEach.call(el.querySelectorAll('[data-ex]'), function (b) { b.setAttribute('aria-pressed', b.dataset.ex === preset ? 'true' : 'false'); });
    var nT = MT.A.scene && MT.A.scene.nTarget ? MT.A.scene.nTarget() : 2;
    var exN = q('[data-r="exnote"]');
    if (exN) exN.innerHTML = 'Drawn: <b>' + nT + (nT === 1 ? ' aquaporin' : ' aquaporins') + '</b> in the membrane. Model channel term × ' + num(ex * (res.fAba || 1), 2) +
      (st.aba === 'xylem' ? ' (ABA in the xylem: fewer open channels and the blue light pump held back)' : '') +
      (st.aba === 'blade' ? '. ABA on the blade acts on the guard cells only: P<sub>f</sub> stays, stomata close' : '') +
      '. P<sub>f</sub> ' + WP.fmt.Pf(res.Pf) + ', K<sub>leaf</sub> ' + num(res.K.leaf, 2) + ' mmol m⁻² s⁻¹ MPa⁻¹, ' + ui.stomata(res).text + '.';
    var nOpen = tg.caps.filter(function (c) { return c < 0.5; }).length, sh = res.Pf > 0 ? 100 * pfCh / res.Pf : 0;
    var dPsi = res.E * res.R.bs;
    var tA = q('[data-r="molAtxt"]');
    if (tA) tA.innerHTML = (MT.mode === 'pull'
      ? 'Same pull on every setting, as in a protoplast swelling test: crossings scale with P<sub>f</sub> = ' + WP.fmt.Pf(res.Pf) + '. '
      : 'The leaf right now: at steady state the membrane must pass the whole transpiration stream, E = ' + num(res.E, 2) + ' mmol m⁻² s⁻¹, whatever the gates do. Closing gates does not cut the flow here; it steepens the drop across the sheath, now ' + WP.fmt.psi(-dPsi).replace(MINUS, '') + '. ') +
      nOpen + ' of 4 pores open' + (tg.ko ? ' (PIP2;1 absent: in the model the other PIPs carry the same P<sub>f</sub>)' : '') + '; ' + num(sh, 0) + ' % of the water goes through channels, the rest through the lipid.';
    var eq = q('[data-r="molAeq"]');
    if (eq) eq.innerHTML = 'Drawn rates. Same pull: crossings per second = 0.08 × P<sub>f</sub> (µm s⁻¹), split between channel and lipid terms. The leaf right now: crossings per second = 3.4 × E (mmol m⁻² s⁻¹), split in the same proportion; the drop across the sheath is ΔΨ = E × R<sub>bs</sub> = ' + num(res.E, 2) + ' × ' + num(res.R.bs, 4) + ' = ' + num(dPsi, 3) + ' MPa. H⁺ pump drive = 0.15 + 0.85 × blue signal ' + badge('ILLUSTRATIVE', 'Direction from Grunwald et al. 2022; the size is a teaching choice.') + '. Single file spacing and Brownian motion are drawn, not modelled.';
    var Es = res.gs * res.VPD / 101.325 * 1000, Em = res.gmin * res.VPD / 101.325 * 1000;
    MT.B.set({ open: clamp(res.gs / Math.max(1e-6, res.gsMax), 0, 1), Es: Es, Emin: Em, VPD: res.VPD });
    var tB = q('[data-r="molBtxt"]');
    if (tB) tB.innerHTML = 'Stomata ' + num(100 * clamp(res.gs / Math.max(1e-6, res.gsMax), 0, 1), 0) + ' % open: ' + num(Es, 2) + ' mmol m⁻² s⁻¹ through the pores and ' + num(Em, 2) + ' through the cuticle (g<sub>min</sub> ' + num(res.gmin, 3) + ' mol m⁻² s⁻¹ ' + badge('ILLUSTRATIVE') + ', VPD ' + num(res.VPD, 2) + ' kPa). ' +
      (Es < Em * 3 ? 'With the stomata nearly shut, the cuticle is now a large share of what the leaf still loses.' : 'With the stomata open, the cuticle is a small share, about ' + num(100 * Em / Math.max(1e-9, Es + Em), 0) + ' %.');
  }

  /* links to the papers behind a control, from the evidence registry */
  function paperLinks(pairs) {
    return pairs.map(function (p) { if (ui.cite) ui.cite(p[1]); return '<a href="https://doi.org/' + encodeURI(p[1]) + '" target="_blank" rel="noopener">' + esc(p[0]) + '</a>'; }).join(', ');
  }
  function evLine(b, where, pairs, extra) {
    return '<p class="m5-ev">' + badge(b) + '<span>' + where + '</span><span>' + paperLinks(pairs) + '</span>' + (extra || '') + '</p>';
  }
  var lastPpfd = 1500;

  function mount(root) {
    ui = WP.ui; el = root;
    var stl = document.createElement('style'); stl.textContent = CSS; root.appendChild(stl);
    var w = document.createElement('div');
    w.innerHTML =
      '<div class="m5-hero" data-r="hero"></div>' +
      '<p class="m5-try"><span data-r="try"></span><button type="button" class="btn small" data-act="toctl">Go to the gate controls</button></p>' +
      '<div class="m5-herobar tier-2"><button type="button" class="btn small" data-act="tetra" aria-pressed="false">Show the real tetramer</button>' +
      '<span class="tier-3 m5-small" style="margin:0">A PIP aquaporin is a tetramer: four monomers, each with its own pore and its own loop D gate. The central opening is not a water path (Törnroth-Horsefield et al. 2006). This plate draws one monomer so the gate can be seen.</span></div>' +
      '<p class="m5-lead">Ten nanometres across: one water channel in the bundle sheath membrane, and the lid that opens and shuts it. This is the part of the water path a leaf can turn up or down in minutes.</p>' +
      '<p class="m5-now" aria-live="polite"><b>What is happening.</b> <span data-r="now"></span></p>' +

      '<div class="m5-grid">' +
      '<figure>' +
      '<div class="m5-stage">' +
      '<div data-r="svgWrap" class="m5-svgs"><div data-r="svgOne"></div><div data-r="tetraWrap" hidden><div data-r="svgTop"></div></div></div>' +
      '<ol class="m5-key" data-r="svgKey"><li><b>Loop D</b> (rust), the gate: it swings under the cytosol mouth of the pore and the single file of water stops. A real channel flicks between open and shut; the record at the bottom shows this one.</li><li><b>Ser115, loop B</b> and <b>Ser274, C terminus</b>: orange phosphate beads P when phosphorylated (SoPIP2;1 numbering)</li><li><b>His193, loop D</b>: the dot on loop D; it turns orange red and carries an H⁺ when protonated</li><li class="tier-2"><b>Ca²⁺ site, N terminus</b> (Glu31 in SoPIP2;1; Cd²⁺ was seen in the crystal, Ca²⁺ is proposed in the cell): green ion, and a bridge to loop D when the gate is shut</li><li class="tier-2"><b>NPA</b>: two half helices that meet mid membrane; the pore narrows to about 3 Å, so water passes in single file and protons are blocked</li></ol>' +
      '<div class="m5-bar"><span class="m5-note">Schematic after Törnroth-Horsefield et al. 2006. Drawn entering the cell; water crosses either way, down its Ψ gradient.</span>' +
      '<span><button type="button" class="btn small" data-act="pause" aria-pressed="false">Pause</button></span></div>' +
      '</div>' +
      '<figcaption class="cap">One PIP aquaporin monomer, cut open along its pore. Residue numbers are spinach SoPIP2;1; in Arabidopsis AtPIP2;1 the same sites carry other numbers (see the table below). In the structure loop D moves by up to 16 Å between the closed and the open state. Molecule speed and the timing of the gate are drawn, not measured.</figcaption>' +
      '<div class="m5-evrow">' + evMarker('l5-structure', 'Evidence: the structure') + '<span class="tier-2" style="display:contents">' + evMarker('l5-solutes', 'Evidence: not only water') + evMarker('l5-filter', 'Evidence: the 3 Å filter') + '</span></div>' +
      '</figure>' +

      '<div class="card m5-ctl">' +
      '<h4>What opens the gate?</h4>' +
      '<p class="m5-gate" aria-live="polite" data-r="gateline"></p>' +
      '<div class="m5-grp"><h5>Molecular switches</h5>' +
      rng('phos', 'Phosphorylation', 'share of channels with phosphates on Ser115 and Ser274 (SoPIP2;1); Ser280 and Ser283 in AtPIP2;1', 0, 1, 0.05) +
      evLine('MEASURED', 'structure in spinach; leaf veins in Arabidopsis', [['Törnroth-Horsefield 2006', '10.1038/nature04316'], ['Prado 2013', '10.1105/tpc.112.108456']]) +
      rng('ph', 'Cytosolic pH', 'a low pH protonates His193 on loop D (SoPIP2;1); His199 in AtPIP2;1', 6.0, 7.6, 0.05) +
      evLine('MEASURED', 'shown in Arabidopsis roots under flooding', [['Tournaire-Roux 2003', '10.1038/nature01853'], ['Verdoucq 2008', '10.1042/bj20080275']]) +
      '<div class="tier-2"><div class="m5-sw"><p>Ca²⁺ at the gate<small>N terminal site: Glu31 (SoPIP2;1); Glu31 and Asp28 in AtPIP2;1</small></p><div class="chips" role="radiogroup" aria-label="Cytosolic calcium"><button type="button" class="chip" role="radio" data-ca="low">Low</button><button type="button" class="chip" role="radio" data-ca="high">Raised</button></div></div>' +
      evLine('MEASURED', 'AtPIP2;1 and beet root membranes', [['Verdoucq 2008', '10.1042/bj20080275'], ['Alleva 2006', '10.1093/jxb/erj046']], '<span class="m5-chip2">shown in purified membranes</span>') + '</div>' +
      '</div>' +
      '<div class="m5-grp"><h5>Whole leaf conditions</h5>' +
      '<div class="m5-sw"><p>Light<small data-r="lqnote">also in the conditions strip</small></p><div class="chips" role="radiogroup" aria-label="Light on the leaf"><button type="button" class="chip" role="radio" data-lt="dark">Dark</button><button type="button" class="chip" role="radio" data-lt="red">Red only</button><button type="button" class="chip" role="radio" data-lt="rb">Red + blue</button></div></div>' +
      evLine('MEASURED', 'light raises K<sub>leaf</sub> in many species, not all: walnut, bur oak, poplar, 6 of 11 woody species; not yet tested in almond', [['Cochard 2007', '10.1104/pp.106.090092'], ['Voicu 2008', '10.1093/treephys/28.7.1007'], ['Tyree 2005', '10.1093/jxb/eri045'], ['Lopez 2013', '10.1093/pcp/pct135']]) +
      '<div class="tier-2">' + evLine('MEASURED', 'blue light in particular: walnut K<sub>leaf</sub> about 60 % lower without blue; birch; Arabidopsis genetics', [['Ben Baaziz 2012', '10.1093/treephys/tps022'], ['Sellin 2011', '10.1111/j.1365-3040.2011.02306.x'], ['Grunwald 2022', '10.1093/plcell/koac089']]) + '</div>' +
      '<div class="m5-sw"><p>Water<small data-r="wsnote">drought brings ABA to the leaf in the xylem</small></p><div class="chips" role="radiogroup" aria-label="Water supply"><button type="button" class="chip" role="radio" data-ws="none">Well watered</button><button type="button" class="chip" role="radio" data-ws="xylem">Water stress (ABA)</button></div></div>' +
      evLine('MEASURED', 'shown in Arabidopsis; in grapevine, a vine, K<sub>leaf</sub> about 30 % lower under stress, with the aquaporin link a correlation', [['Shatil-Cohen 2011', '10.1111/j.1365-313x.2011.04576.x'], ['Sade 2014', '10.1104/pp.114.248633'], ['Pou 2013', '10.1111/pce.12019']]) +
      '<p class="m5-small tier-3" data-r="condmodel"></p>' +
      '</div>' +
      '<div class="m5-grp"><div class="m5-sw tier-2"><p>Grapevine PIP2;1 knockout (CRISPR) ' + badge('PREPRINT') + '<small data-r="konote">stomata change; the K<sub>leaf</sub> curve does not</small></p><button type="button" class="btn small" data-act="ko" aria-pressed="false">Knockout: off</button></div>' +
      '<div class="m5-sw"><p>Try<small>two quick settings</small></p><div class="chips"><button type="button" class="chip" data-pre="acid">Acid cytosol</button><button type="button" class="chip" data-pre="open">All gates open</button></div></div></div>' +
      '<div class="m5-evrow">' + evMarker('l5-phos', 'Evidence: phosphates') + evMarker('l5-ph', 'Evidence: the pH gate') + '<span class="tier-2" style="display:contents">' + evMarker('l5-ca', 'Evidence: Ca²⁺') + '</span>' + evMarker('l5-light', 'Evidence: light') + '<span class="tier-2" style="display:contents">' + evMarker('l5-bluek', 'Evidence: blue light') + '</span>' + evMarker('l5-stress', 'Evidence: water stress') + '</div>' +
      '<div class="m5-tiles tier-2" data-r="tiles"></div>' +
      '<p class="tier-1-only m5-small" data-r="plain"></p>' +
      '</div>' +
      '</div>' +

      // ---------- recent findings and open questions (evidence rule: anything single lab, single species or contradictory lives here)
      '<section class="m5-rf tier-2" aria-labelledby="m5-rf-h"><h3 class="m5-h" id="m5-rf-h" style="margin-top:6px">Recent findings and open questions</h3>' +
      '<p class="m5-sub">Results that are new, shown by one lab or in one species, or that disagree with each other. Read them as questions, not as controls.</p>' +
      '<div class="m5-two" style="margin-top:4px"><div><h4 class="m5-k">Recent findings</h4><ul class="m5-rfl">' +
      '<li><b>2019.</b> Phosphorylation of AtPIP2;1 at Ser280 and Ser283 follows the circadian clock and is needed but not enough for rosette conductance; 14-3-3 proteins bind the phosphorylated channel and activate it. Arabidopsis. <a href="https://doi.org/10.1105/tpc.18.00804" target="_blank" rel="noopener">Prado et al., Plant Cell</a></li>' +
      '<li><b>2022.</b> Phototropins in the leaf bundle sheath, not only in guard cells, carry the blue light rise in K<sub>leaf</sub>. Arabidopsis. <a href="https://doi.org/10.1093/plcell/koac089" target="_blank" rel="noopener">Grunwald et al., Plant Cell</a></li>' +
      '<li><b>2024.</b> Blue light and ABA act on two proton pumps of the bundle sheath, AHA2 and the vacuolar H⁺ ATPase, both Ca²⁺ dependent. Arabidopsis. <a href="https://doi.org/10.1093/plphys/kiae226" target="_blank" rel="noopener">Torne-Srivastava et al., Plant Physiology</a></li>' +
      '<li><b>2024, a review.</b> Do sunlit upper leaves, which get more blue light, keep a higher K<sub>leaf</sub> than shaded inner leaves? Proposed, not tested in orchards. Does the sunlit side of an almond tree run a higher K<sub>leaf</sub>? ' + badge('OPEN QUESTION') + ' <a href="https://doi.org/10.1111/nph.19497" target="_blank" rel="noopener">Grunwald, Yaaran and Moshelion, New Phytologist</a></li></ul></div>' +
      '<div><h4 class="m5-k">Open questions ' + badge('OPEN QUESTION') + '</h4><ol class="m5-rfl">' +
      '<li>Acid sap raises K<sub>leaf</sub>, yet an acid cytosol closes PIPs. How can both hold? Part of an answer: AHA2 pumps protons out of the cell, and under blue light the bundle sheath cytosol became less acid. Still unexplained: raising only the outside pH to 7.5 lowered P<sub>f</sub>, and ABA makes the sheath cytosol more alkaline yet lowers K<sub>leaf</sub>. ' + evMarker('l5-oq', 'Evidence') + '</li>' +
      '<li>Arabidopsis rosettes conducted more water in the dark (Prado et al. 2013), while blue light raises K<sub>leaf</sub> in detached Arabidopsis leaves (Grunwald et al. 2022). Is the difference the method or the biology? ' + evMarker('l5-dark', 'Evidence') + '</li>' +
      '<li>Ca²⁺ closes purified channels, but the blue light rise in the sheath needs more cytosolic Ca²⁺. Which wins in a living leaf? ' + evMarker('l5-cawhich', 'Evidence') + '</li>' +
      '<li class="tier-3">Does a falling K<sub>leaf</sub> push the stomata shut? In wheat it explained at most 9.1 % of closure (Corso et al. 2020). ' + evMarker('l5-amp', 'Evidence') + '</li>' +
      '<li class="tier-3">Why did the grapevine PIP2;1 knockout change the stomata but not K<sub>leaf</sub>: spare capacity, or a direct role in guard cells as in Arabidopsis?</li></ol></div></div>' +
      '</section>' +

      // ---------- molecular theatre (mol.js)
      '<section class="m5-mol" aria-labelledby="m5-mol-h">' +
      '<h3 class="m5-h" id="m5-mol-h">Watch the molecules</h3>' +
      '<p class="m5-sub">Many channels in one membrane, drawn as molecules. Every water molecule that crosses is counted from the model: change the gate controls above and the traffic changes. ' + badge('ILLUSTRATIVE', 'Molecule counts are a visual scale, not a real number of molecules.') + '</p>' +
      '<div class="m5-molbar"><div class="chips tier-2" role="radiogroup" aria-label="What sets the traffic">' +
      '<button type="button" class="chip" role="radio" data-mm="pull" aria-checked="true">Same pull (swelling test)</button>' +
      '<button type="button" class="chip" role="radio" data-mm="steady" aria-checked="false">The leaf right now</button></div>' +
      '<button type="button" class="btn small" data-mol="pause" aria-pressed="false">Pause</button></div>' +
      '<div class="m5-expr" role="group" aria-labelledby="m5-expr-h"><h4 id="m5-expr-h">How many channels? Expression, trafficking and ABA</h4>' +
      '<p class="m5-small" style="margin:0 0 6px">Gates open and close a channel in seconds. Over minutes to hours a cell also changes how many channels sit in the membrane: genes are turned up or down, and channels are delivered or taken back in by small vesicles. Try a preset and watch the membrane.</p>' +
      '<div class="chips" role="group" aria-label="Expression presets">' +
      '<button type="button" class="chip" data-ex="def" aria-pressed="true">Default leaf</button>' +
      '<button type="button" class="chip" data-ex="sade" aria-pressed="false">Sheath PIP1 silenced</button>' +
      '<button type="button" class="chip" data-ex="abax" aria-pressed="false">ABA in the xylem</button>' +
      '<button type="button" class="chip" data-ex="abab" aria-pressed="false">ABA on the blade</button>' +
      '<button type="button" class="chip tier-2" data-ex="more" aria-pressed="false">More channels</button></div>' +
      '<div class="tier-2">' + rng('expr', 'PIP channels in the sheath membrane', 'relative to the default leaf', 0.2, 1.6, 0.05) + '</div>' +
      '<p class="m5-molnow" aria-live="polite" data-r="exnote"></p>' +
      '<div class="m5-evrow">' + evMarker('l5-expr', 'Evidence: channel number') + evMarker('l5-abax', 'Evidence: where ABA acts') + '<span class="tier-3">' + evMarker('l5-pfreal', 'Evidence: real cell Pf') + '</span></div></div>' +
      '<div class="m5-molstage" data-r="molA"></div>' +
      '<p class="m5-molnow" aria-live="polite" data-r="molAtxt"></p>' +
      '<details class="m5-molkey"><summary>Key to the drawing</summary><ul>' +
      '<li><b>Water</b>: one oxygen and two hydrogens, coloured blue as water is on every page (colours show the molecule, not the atom). In the pore they line up in single file, because the pore narrows to about 3 Å.</li>' +
      '<li><b>Loop D</b> (rust): swings across the cytosolic mouth to cap a pore. Its histidine tip turns gold when protonated at low cytosolic pH.</li>' +
      '<li><b>P</b> (orange bead): a phosphorylated serine. Fewer beads, more capped pores.</li>' +
      '<li class="tier-2"><b>Ca²⁺</b> (green): bridges the N terminus to loop D when raised (direction from purified membranes).</li>' +
      '<li><b>H⁺</b> (gold spheres): pumped out into the sap by the AHA2 H⁺ ATPase, faster under blue light, so the sap acidifies.</li>' +
      '<li><b>K⁺</b> (violet) and <b>sugars</b> (green hexagons) sit in the cytosol for scale; they are not part of this flow.</li></ul></details>' +
      '<div class="tier-3 m5-small" data-r="molAeq"></div>' +

      '<h3 class="m5-h" style="margin-top:20px">With the stomata shut: the cuticle</h3>' +
      '<p class="m5-sub">Water vapour leaving the leaf, at one scale for both routes, so the ratio you see is the model ratio.</p>' +
      '<div class="m5-molbar"><div class="chips" role="group" aria-label="Soil water">' +
      '<button type="button" class="chip" data-cut="dry">Dry the soil (−1.80 MPa)</button><button type="button" class="chip" data-cut="wet">Rewater (−0.10 MPa)</button></div></div>' +
      '<div class="m5-molstage" data-r="molB"></div>' +
      '<p class="m5-molnow" aria-live="polite" data-r="molBtxt"></p>' +
      '<p class="tier-2 m5-small ev-host">Minimum conductance, g<sub>min</sub>, is water lost with the stomata shut: through the cuticle and through stomata that do not close fully. The drawing sends all of it through the cuticle for clarity. ' + evMarker('l2.gmin', 'Evidence: gmin') + '</p>' +
      '<p class="tier-3 m5-small ev-host">Expert depth: as leaves heat up, the share of g<sub>min</sub> through the cuticle rises (Garen and Michaletz 2024). The model holds g<sub>min</sub> at one teaching value at every temperature. ' + evMarker('l2.gminT', 'Evidence: gmin and temperature') + '</p>' +
      '</section>' +

      // ---------- open question: the bundle sheath as valve
      '<div class="m5-oq tier-2"><h4>' + badge('OPEN QUESTION') + ' Is the bundle sheath the valve?</h4>' +
      '<p style="margin:0 0 6px">A leaf model built from measured anatomy (Buckley and colleagues) finds the bundle sheath is only a small part of the resistance outside the xylem, and water vapour can carry up to two thirds of it. Experiments from the Moshelion lab show that changing the sheath, its aquaporins, its proton pump, its blue light receptors or the ABA reaching it, changes the conductance of the whole leaf.</p>' +
      '<p style="margin:0 0 6px">Can both be right? A small resistance that can change ten fold could still act as the switch. Which would you test first: the sheath of a grapevine leaf, or the mesophyll beyond it?</p>' +
      '<div class="m5-evrow">' + evMarker('l5-bsq', 'Evidence: both views') + '</div></div>' +

      // ---------- causal chain
      '<h3 class="m5-h">From the gate to the stomata</h3>' +
      '<p class="m5-sub">Every box is the live model value. Arrows flash when the box after them changes.</p>' +
      '<div class="m5-chain" data-r="chain" aria-live="polite"></div>' +
      '<div class="m5-evrow">' + evMarker('l5-pf', 'Evidence: Pf to Kleaf') + evMarker('l5-amp', 'Evidence: does Kleaf move gs?') + evMarker('l5-ko', 'Evidence: the knockout') + '</div>' +
      '<div class="m5-two">' +
      '<figure class="tier-2"><div class="m5-frame" data-r="stair"></div><figcaption class="cap">Echo of Plate II. Only the last tread, outside the xylem, moves when the gate moves at a given E; upstream treads shift only because the stomata change E. (Series argument, Scoffoni et al. 2023 Fig. 2.)</figcaption></figure>' +
      '<div class="m5-ko tier-2" data-r="kobox"><h4>The knockout surprise ' + badge('PREPRINT') + '</h4>' +
      '<p style="margin:0">Naive chain: no PIP2;1, lower P<sub>f</sub>, higher R<sub>ox</sub>, lower K<sub>leaf</sub>, earlier stomatal closure. In Chardonnay knockout lines: the same K<sub>leaf</sub> vulnerability curve as the wild type (preprint). Because the stomata stay open longer, the leaf reaches a more negative Ψ, so the K<sub>leaf</sub> reading is lower at the same moment; that last step is a model prediction. The model holds P<sub>f</sub> and the curve fixed and moves stomatal half closure 0.25 MPa more negative ' + badge('ILLUSTRATIVE', 'Direction from the preprint; the size of the shift is not.') + '. Explanations that fit both results: the remaining capacity is enough, or PIP2;1 acts on the stomata directly.<span class="tier-3"> A third: PIP1 and PIP2 proteins assemble into mixed tetramers (Fetter et al. 2004, maize), so did losing PIP2;1 change how the other PIPs work?</span> Which one? That is open. Not tested in almond or romaine, so the switch works for grapevine only.</p>' +
      '<p class="m5-small" data-r="kolive"></p></div>' +
      '</div>' +

      // ---------- the ABA valve (water stress control) and the light chain (tier 3 explainer)
      '<div class="m5-ko tier-2" style="margin-top:14px"><h4>The ABA valve</h4><p style="margin:0">ABA fed into the xylem through the petiole lowered K<sub>leaf</sub> and the P<sub>f</sub> of bundle sheath cells. ABA put on the leaf blade closed the stomata but did not lower K<sub>leaf</sub> within 2 to 3 h (Arabidopsis, Shatil-Cohen et al. 2011). So the sheath can be closed from the vein side, separately from the stomata.<span class="tier-3"> ABA also inhibits the blue light activated AHA2 pump in the sheath and alkalinises the sap (Torne-Srivastava et al. 2024): the hormone works against the light signal.</span></p><div class="m5-evrow">' + evMarker('l5-aba', 'Evidence: the ABA valve') + '</div></div>' +
      '<div class="tier-3">' +
      '<h3 class="m5-h">How might blue light reach the gate?</h3>' +
      '<p class="m5-sub">A proposed chain, shown only in Arabidopsis and by one lab. The dashed step is not known. Switch the light above and watch the chain idle.</p>' +
      '<div class="m5-blue" data-r="blue"></div>' +
      '<p class="m5-small" data-r="bluenote"></p>' +
      '<div class="m5-evrow">' + evMarker('l5-blue', 'Evidence: the proposed chain') + evMarker('l5-dark', 'Evidence: darkness can raise K') + '</div>' +
      '<div style="margin-top:12px"><h4 style="margin:0 0 6px;font-family:var(--ui);font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink2)">Species decide ' + badge('MEASURED') + '</h4>' +
      '<table class="m5-sp"><thead><tr><th scope="col">Species</th><th scope="col">Light and K<sub>leaf</sub></th><th scope="col">Source</th></tr></thead><tbody>' +
      '<tr><td>Walnut</td><td>400 % rise from dark to light, tracking PIP2 transcripts</td><td>Cochard et al. 2007</td></tr>' +
      '<tr><td>Bur oak</td><td>rise within 1 h, saturating near 150 µmol m⁻² s⁻¹, blocked by HgCl₂</td><td>Voicu et al. 2008</td></tr>' +
      '<tr><td>11 woody species</td><td>6 responded to light, 5 did not</td><td>Tyree et al. 2005</td></tr>' +
      '<tr><td>Poplar</td><td>rise in the first hour of light, with PIP genes induced</td><td>Lopez et al. 2013</td></tr>' +
      '<tr><td>3 of 6 evergreen species</td><td>60 to 100 % rise from low to high light</td><td>Scoffoni et al. 2008</td></tr>' +
      '<tr><td>Arabidopsis rosette</td><td>higher in darkness</td><td>Prado et al. 2013</td></tr>' +
      '<tr><td>Almond</td><td>not yet tested</td><td>no paper found</td></tr></tbody></table>' +
      '<div class="m5-evrow">' + evMarker('l5-species', 'Evidence: species decide') + evMarker('l5-circ', 'Evidence: the circadian rosette') + '</div></div>' +
      '</div>' +

      // ---------- isoform caution
      '<div class="m5-caution tier-2" style="margin-top:18px"><h4>Read the isoform before the number</h4>' +
      '<p style="margin:0">Residue numbers differ between isoforms. Never convert them by a fixed offset.</p>' +
      '<table><thead><tr><th>Site</th><th>SoPIP2;1, spinach (this plate)</th><th>AtPIP2;1, Arabidopsis</th></tr></thead><tbody>' +
      '<tr><td>pH sensing histidine, loop D</td><td>His193</td><td>His199 (Verdoucq 2008)</td></tr>' +
      '<tr><td>Phosphorylation</td><td>Ser115 loop B; Ser274 C terminus</td><td>Ser280, Ser283 C terminus (Prado 2013); Ser121 (Rodrigues 2017)</td></tr>' +
      '<tr><td>Divalent cation site, N terminus</td><td>Glu31, N terminus: Cd²⁺ seen in the crystal, Ca²⁺ proposed in the cell (Törnroth-Horsefield 2006)</td><td>Glu31 and, less, Asp28 (Verdoucq 2008)</td></tr>' +
      '</tbody></table>' +
      '<p style="margin:0">Prado et al. 2013 found Arabidopsis rosette conductance <i>higher in darkness</i>, with Ser280 and Ser283 phosphorylation needed for it. So this plate never says that light phosphorylates the gate open. And aquaporins are not water only: depending on isoform they also carry some small neutral solutes and gases (Maurel et al. 2015, doi 10.1152/physrev.00008.2015).</p></div>' +

      // ---------- tier 3: model and methods
      '<div class="tier-3">' +
      '<h3 class="m5-h">The model on this plate</h3>' +
      '<div class="card"><div class="eq" data-r="eqs"></div></div>' +
      '<h3 class="m5-h">How would you measure it?</h3>' +
      '<p class="m5-sub">Methods behind each link of the chain, for anyone who wants to run the experiment.</p>' +
      '<div class="m5-meth">' +
      '<div class="card"><h4>Membrane P<sub>f</sub>: protoplast swelling ' + badge('DERIVED') + '</h4><ol>' +
      '<li>Isolate bundle sheath protoplasts (Grunwald et al. 2021 did this in Arabidopsis).</li><li>Move them from an isotonic to a hypotonic bath and film the swelling.</li>' +
      '<li>Fit the initial rate of relative volume change, then P<sub>f</sub> = V<sub>0</sub> · d(V/V<sub>0</sub>)/dt ÷ (S<sub>0</sub> · V<sub>w</sub> · ΔC), with S<sub>0</sub> the starting surface area and ΔC the osmolarity step.</li>' +
      '<li>Repeat with the bath at pH 7.5 to test the sap pH effect.</li></ol></div>' +
      '<div class="card"><h4>K<sub>leaf</sub>: evaporative flux method ' + badge('DERIVED') + '</h4><ol>' +
      '<li>Cut a leaf under water and connect the petiole to a flowmeter on a reservoir.</li><li>Let the leaf transpire under bright light until the flow E is steady.</li>' +
      '<li>Measure leaf Ψ in a pressure chamber; K<sub>leaf</sub> = E ÷ (0 − Ψ<sub>leaf</sub>), per leaf area.</li>' +
      '<li>Compare red with red plus blue, or wild type with knockout. Albuquerque et al. 2020 (doi 10.1093/jxb/eraa392) measured grapevine K<sub>leaf</sub> this way.</li></ol></div>' +
      '<div class="card"><h4>Gate structure: X ray crystallography</h4><p>SoPIP2;1 was crystallised in a closed (2.1 Å) and an open (3.9 Å) form, which showed loop D capping the pore and the serines and histidine that move it (doi 10.1038/nature04316).</p></div>' +
      '<div class="card"><h4>Function in the plant: knockouts and tissue specific silencing</h4><p>CRISPR knockout lines compared with the wild type through a dry down (grapevine preprint, doi 10.64898/2026.01.29.702672); PIP1 silenced only in the bundle sheath (Arabidopsis, doi 10.1104/pp.114.248633). Measure K<sub>leaf</sub>, g<sub>s</sub> and leaf Ψ on the same leaves.</p></div>' +
      '</div>' +
      '</div>' +

      '<div class="tier-3" data-r="m5meth" style="margin-top:16px"></div>' +
      '<div data-r="stops" style="margin-top:22px"></div>' +
      '<div class="tier-2" data-r="srcs" style="margin-top:16px"></div>';
    root.appendChild(w);
    mountMol(w);
    // r5: How to measure Pf and a Design it card for the plate's open question (PhD panel item 3)
    WP.howto = WP.howto || {};
    if (!WP.howto.pf) WP.howto.pf = { title: 'membrane water permeability Pf by protoplast swelling', what: 'single protoplasts, a hypotonic shock and a camera', steps: [
      'Isolate protoplasts from the tissue of interest. To pick bundle sheath cells, use a line that marks them with a fluorescent protein, as the Moshelion lab did.',
      'Hold one protoplast in an isotonic bath, then switch to a hypotonic bath and film its swelling for about a minute.',
      'Fit the initial rate of relative volume change: Pf = (V0 ÷ S) × d(V ÷ V0)/dt ÷ (Vw × Δosm), with V0 and S the starting volume and surface area, Vw the molar volume of water and Δosm the osmotic step.',
      'Repeat with an aquaporin blocker or a treatment (ABA in the bath, a buffered pH) on cells from the same leaves.'],
      watch: 'Protoplasts have no wall and no neighbours, so Pf here is a property of the membrane, not of the leaf. Mercury blocks many aquaporins but also harms cells; report recovery with a reducing agent.',
      dois: ['10.1111/j.1365-313X.2011.04576.x', '10.1093/jxb/erl203'] };
    var mm5 = w.querySelector('[data-r="m5meth"]');
    if (mm5 && ui.howto) mm5.innerHTML = ['pf', 'efm'].map(ui.howto).join('') + (ui.design ? ui.design({
      q: 'Is the bundle sheath the valve? Does lowering aquaporin abundance only in the sheath lower Kleaf as much as lowering it everywhere?',
      treat: 'Three lines grown side by side: wild type; PIP1 silenced in the bundle sheath only; PIP1 silenced everywhere (the Sade et al. 2014 design). Same leaf age and light history.',
      measure: 'Bundle sheath and mesophyll protoplast Pf (swelling assay); Kleaf by the evaporative flux method; gs and leaf Ψ at midday on the same leaves.',
      n: '6 to 8 plants per line, 8 to 10 protoplasts per plant for Pf (plant is the replicate, protoplast the subsample). A common choice, not taken from a paper.',
      expect: function () {
        var a = WP.solve(Object.assign({}, WP.state, { expr: 1, aba: 'none' })), b = WP.solve(Object.assign({}, WP.state, { expr: 0.35, aba: 'none' }));
        var d = 100 * (1 - b.K.leaf / a.K.leaf);
        return 'In this model, sheath channels at 35 % of normal lower Kleaf from ' + WP.fmt.num(a.K.leaf, 1) + ' to ' + WP.fmt.num(b.K.leaf, 1) + ' mmol m⁻² s⁻¹ MPa⁻¹ (' + WP.fmt.num(d, 0) + ' % lower) at the current conditions, and leaf Ψ from ' + WP.fmt.psi(a.psi.leafOut) + ' to ' + WP.fmt.psi(b.psi.leafOut) + '. If Buckley is right the measured drop should be much smaller than the drop in sheath Pf; if Moshelion is right, close to it.';
      },
      confound: 'Silencing can change leaf size, vein density or stomatal density. Measure all three, and report Kleaf per leaf area with vein length per area beside it.'
    }) : '');
    ['now', 'svgKey', 'svgWrap', 'svgOne', 'tetraWrap', 'svgTop', 'tiles', 'plain', 'chain', 'stair', 'kolive', 'blue', 'bluenote', 'eqs', 'stops', 'srcs', 'hero', 'gateline'].forEach(function (k) { refs[k] = w.querySelector('[data-r="' + k + '"]'); });
    refs.tryl = w.querySelector('[data-r="try"]');
    mheroInit(refs.hero);
    refs.svgOne.innerHTML = oneSVG(); refs.svgOne = refs.svgOne.firstChild;
    refs.svgTop.innerHTML = topSVG(); refs.svgTop = refs.svgTop.firstChild;
    refs.in = { phos: w.querySelector('#m5-phos'), ph: w.querySelector('#m5-ph') };
    var pb = w.querySelector('[data-act="pause"]');
    anim.rm = reduced(); if (anim.rm) anim.paused = true;
    if (pb && window.WPFreeze) [refs.svgOne, refs.svgTop].forEach(function (sv) { if (sv) WPFreeze.attach(sv, { paused: function () { return anim.paused; }, button: pb }); }); // v19: click the drawing to freeze
    if (pb && window.PlaySpeed) { var ch = window.PlaySpeed.chip('ps-light'); ch.style.marginLeft = '6px'; ch.style.verticalAlign = 'middle'; pb.parentNode.insertBefore(ch, pb.nextSibling); }
    if (ui.predict) {
      var acid = w.querySelector('[data-pre="acid"]'), kob = w.querySelector('[data-act="ko"]');
      if (acid) { var sw1 = acid.closest('.m5-sw'); sw1.parentNode.insertBefore(ui.predict({ q: 'The cytosol turns acidic, as in a flooded root short of oxygen. What does the gate of this channel do?', choices: ['Stays shut more of the time', 'Opens wider', 'Nothing'], correct: 0,
        answer: 'It stays shut more of the time. A histidine on loop D (His193 in spinach SoPIP2;1) picks up a proton at low pH and the loop caps the pore (Törnroth-Horsefield et al. 2006, Nature). In Arabidopsis roots short of oxygen this lowered water uptake (Tournaire-Roux et al. 2003).', gate: [acid], lockText: 'Acid cytosol unlocks once you predict.' }), sw1); }
      if (kob) { var sw2 = kob.closest('.m5-sw'); sw2.parentNode.insertBefore(ui.predict({ q: 'Knock out the PIP2;1 gene in grapevine. In the preprint, what changed?', choices: ['Stomata stayed more open as the leaf dried', 'Leaf hydraulic conductance halved', 'Nothing measurable'], correct: 0,
        answer: 'In the Chardonnay knockout the stomata stayed more open as the leaf dried, and the K<sub>leaf</sub> curve did not move. This is a preprint, not yet peer reviewed (Albuquerque et al. 2026, bioRxiv).', gate: [kob], cls: 'tier-2', lockText: 'The knockout switch unlocks once you predict.' }), sw2); }
    }
    if (ui.stops) ui.stops(refs.stops, ['5a', '5b', '5c', '5d']);
    ui.sources(refs.srcs, ['10.1038/nature04316', '10.1016/j.febslet.2013.02.038', '10.1038/nature01853', '10.1042/bj20080275', '10.1105/tpc.112.108456', '10.1105/tpc.18.00804',
      '10.1111/tpj.15235', '10.1093/plcell/koac089', '10.1104/pp.114.248633', '10.1152/physrev.00008.2015', '10.1073/pnas.1704754114',
      '10.1111/pce.13722', '10.64898/2026.01.29.702672', '10.1093/jxb/eraa392', '10.1016/j.jmb.2009.01.065', '10.1093/jxb/erj046', '10.1038/35036519', '10.1105/tpc.017194',
      '10.1111/j.1365-313x.2011.04576.x', '10.1093/plphys/kiae226', '10.1111/j.1365-3040.2008.01884.x', '10.1104/pp.106.090092',
      '10.1093/treephys/28.7.1007', '10.1093/jxb/eri045', '10.1093/pcp/pct135', '10.1093/treephys/tps022', '10.1111/j.1365-3040.2011.02306.x', '10.1111/pce.12019', '10.1111/nph.19497'], 'Sources for this plate');
    wireEvidence(w);

    refs.in.phos.addEventListener('input', function (e) { WP.set({ phos: +e.target.value }); });
    refs.in.ph.addEventListener('input', function (e) { WP.set({ pHcyt: +e.target.value }); });
    w.addEventListener('click', function (e) {
      var t = e.target.closest('[data-ca],[data-lt],[data-ws],[data-act],[data-pre]'); if (!t || t.disabled) return;
      var st = WP.state;
      if (t.dataset.ca) WP.set({ ca: t.dataset.ca });
      else if (t.dataset.lt) {
        if (st.ppfd > 0) lastPpfd = st.ppfd;
        if (t.dataset.lt === 'dark') WP.set({ ppfd: 0 });
        else WP.set({ lightQ: t.dataset.lt, ppfd: st.ppfd > 0 ? st.ppfd : lastPpfd });
      }
      else if (t.dataset.ws) WP.set({ aba: t.dataset.ws });
      else if (t.dataset.act === 'ko') WP.set({ ko: !st.ko });
      else if (t.dataset.act === 'tetra') { setTetra(!HM.tetra); }
      else if (t.dataset.act === 'toctl') { var cc = w.querySelector('.m5-ctl'); if (cc) { cc.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' }); var h4 = cc.querySelector('h4'); if (h4) { h4.tabIndex = -1; h4.focus({ preventScroll: true }); } } }
      else if (t.dataset.act === 'pause') { anim.paused = !anim.paused; t.setAttribute('aria-pressed', anim.paused ? 'true' : 'false'); t.textContent = anim.paused ? 'Play' : 'Pause'; kick(); }
      else if (t.dataset.pre === 'acid') WP.set({ pHcyt: 6.2 });
      else if (t.dataset.pre === 'open') WP.set({ phos: 1, pHcyt: 7.2, ca: 'low', lightQ: 'rb', ppfd: st.ppfd > 0 ? st.ppfd : lastPpfd, aba: 'none', ko: false });
    });
    // radio keyboard: arrows move between chips
    w.addEventListener('keydown', function (e) {
      var t = e.target; if (!t.matches || !t.matches('[role="radio"]')) return;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].indexOf(e.key) < 0) return;
      var sib = Array.prototype.slice.call(t.parentNode.querySelectorAll('[role="radio"]'));
      var i = sib.indexOf(t) + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1);
      var n = sib[(i + sib.length) % sib.length]; n.focus(); n.click(); e.preventDefault();
    });
    if (ui.onPrefs) ui.onPrefs(function () {
      var rmv = reduced(); if (rmv !== anim.rm) { anim.rm = rmv; anim.paused = rmv; kick(); }
      if (lastRes) gsSet(activity(lastRes));
      refresh();
      if (HM.ctx && HM.ctx.retheme) HM.ctx.retheme();
    });
    document.addEventListener('visibilitychange', function () { if (!document.hidden) kick(); });
    if ('IntersectionObserver' in window) {
      var fio = new IntersectionObserver(function (es) { refs.inView = !!(es[0] && es[0].isIntersecting); if (refs.inView) kick(); });
      fio.observe(refs.svgWrap); refs.figIO = fio;
      var io = new IntersectionObserver(function (es) { if (es[0] && es[0].isIntersecting) kick(); });
      io.observe(w); refs.plateIO = io;
    }
  }
  function setTetra(on) {
    HM.tetra = !!on;
    var b = q('[data-act="tetra"]'); if (b) { b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.textContent = on ? 'Show one channel' : 'Show the real tetramer'; }
    if (refs.tetraWrap) refs.tetraWrap.hidden = !on;
    if (HM.ctx && HM.ctx.built) heroMode(HM.ctx);
    refresh();
  }

  function unmount() {
    if (anim.raf) cancelAnimationFrame(anim.raf); anim.raf = 0;
    if (HM.ctx && HM.ctx.dispose) { HM.ctx.dispose(); HM.ctx = null; }
    if (refs.plateIO) try { refs.plateIO.disconnect(); } catch (e) { /* none */ }
    if (refs.figIO) try { refs.figIO.disconnect(); } catch (e) { /* none */ }
  }

  function refresh() { if (lastSt && lastRes) update(lastSt, lastRes); }

  /* ============================================================ update */
  function update(st, res) {
    if (!el || !res) return;
    lastSt = st; lastRes = res;
    var tg = targets(st, res);
    gsSet(tg.act);
    // controls
    if (document.activeElement !== refs.in.phos) refs.in.phos.value = st.phos;
    if (document.activeElement !== refs.in.ph) refs.in.ph.value = st.pHcyt;
    q('[data-o="phos"]').textContent = num(100 * st.phos, 0) + ' %';
    q('[data-o="ph"]').textContent = 'pH ' + num(st.pHcyt, 2);
    function radio(sel, key, val) { Array.prototype.forEach.call(el.querySelectorAll(sel), function (b) { var on = b.dataset[key] === val; b.setAttribute('aria-checked', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1; }); }
    radio('[data-ca]', 'ca', st.ca);
    radio('[data-lt]', 'lt', st.ppfd <= 0 ? 'dark' : st.lightQ);
    radio('[data-ws]', 'ws', st.aba);
    if (!el.querySelector('[data-ws][aria-checked="true"]')) { var w0 = el.querySelector('[data-ws="none"]'); if (w0) w0.tabIndex = 0; }
    var wsn = q('[data-r="wsnote"]'); if (wsn) wsn.textContent = st.aba === 'blade' ? 'ABA is on the leaf blade (set in the molecules section below)' : 'drought brings ABA to the leaf in the xylem';
    var lqn = q('[data-r="lqnote"]'); if (lqn) lqn.textContent = st.ppfd <= 0 ? 'dark: no light signal; stomata close too' : 'PPFD ' + num(st.ppfd, 0) + ' µmol m⁻² s⁻¹, also in the conditions strip';
    var kb = q('[data-act="ko"]'), koOK = st.crop === 'grape';
    kb.disabled = !koOK; kb.setAttribute('aria-pressed', st.ko && koOK ? 'true' : 'false'); kb.textContent = !koOK ? 'Not tested in this crop' : (st.ko ? 'Knockout: on' : 'Knockout: off');
    var kn = q('[data-r="konote"]'); if (kn) kn.innerHTML = koOK ? 'stomata change; the K<sub>leaf</sub> curve does not' : 'grapevine only: not tested in ' + (st.crop === 'almond' ? 'almond' : 'romaine');
    var gp = WP.params.gate;
    var cm = q('[data-r="condmodel"]'); if (cm) cm.innerHTML = 'In the model, darkness or red light alone multiply the channel term of P<sub>f</sub> by ' + num(gp.fRedOnly.v, 2) + ', and ABA in the xylem by ' + num(gp.fABA.v, 2) + ' (and it stops the blue light term) ' + badge('ILLUSTRATIVE', 'Directions from the papers; sizes are teaching choices.') + '. How light and ABA reach the gate is not settled: the drawing shows their net effect on how long the gate stays open, not a known molecular route.';
    var tryEl = refs.tryl;
    if (tryEl) tryEl.innerHTML = tg.act < 0.5 ? 'The gate is shut most of the time now. Try <b>All gates open</b> in the controls to compare.' :
      '<span class="tier-1-only">Try: pick <b>Dark</b>, or lower the cytosolic pH, to see the gate shut more.</span><span class="tier-2">Try: raise <b>Ca²⁺</b> or pick <b>Dark</b> to see it shut more.</span>';
    refs.gateline.innerHTML = (res.koActive ? 'Knockout: the drawn channel stands for the other PIPs. ' : '') + 'This channel is open about <b>' + num(100 * tg.act, 0) + ' %</b> of the time · P<sub>f</sub> <b>' + WP.fmt.Pf(res.Pf) + '</b> · K<sub>leaf</sub> <b>' + num(res.K.leaf, 2) + '</b> mmol m⁻² s⁻¹ MPa⁻¹';
    // gate tiles
    var G = res.gate;
    refs.tiles.innerHTML =
      tile('f<sub>phos</sub>', num(G.phos, 2), '0.25 + 0.75 × phos') + tile('f<sub>pH</sub>', num(G.pH, 2), 'His193 open share') +
      tile('f<sub>Ca</sub>', num(G.ca, 2), st.ca === 'high' ? 'Ca²⁺ raised' : 'Ca²⁺ low') + tile('p<sub>open</sub>', num(res.pOpen, 2), 'product of the three', true) +
      tile('light and ABA', num(res.fBlue * (res.fAba || 1), 2), st.ppfd <= 0 ? 'dark: no light signal' : (st.lightQ === 'rb' ? 'red + blue, follows PPFD' : 'red alone') + (st.aba === 'xylem' ? ', ABA in the xylem' : '')) + tile('P<sub>f</sub>', num(res.Pf, 0) + ' <small>µm s⁻¹</small>', '20 + 180 × p<sub>open</sub> × light × channels' + (st.aba === 'xylem' ? ' × ABA' : ''), true);
    var ref = WP.solve(refState(st));
    refs.plain.innerHTML = plainChain(st, res, ref);
    refs.now.innerHTML = nowText(st, res, tg);
    drawChain(st, res);
    refs.stair.innerHTML = staircase(st, res, ref);
    refs.kolive.innerHTML = 'Now: stomatal half closure at ' + WP.fmt.psi(res.psi50) + (res.koActive ? ' (knockout)' : ' (wild type)') + ', g<sub>s</sub> ' + WP.fmt.gs(res.gs) + ', P<sub>f</sub> ' + WP.fmt.Pf(res.Pf) + '.' +
      (st.crop !== 'grape' ? ' The knockout was not tested in ' + (st.crop === 'almond' ? 'almond' : 'romaine') + ', so it is switched off for this crop.' : '');
    refs.blue.innerHTML = blueChain(st, res);
    refs.bluenote.innerHTML = (st.ppfd > 0 && st.lightQ === 'rb' && st.aba !== 'xylem' ? 'Red + blue: the chain runs. ' : 'The chain idles' + (st.aba === 'xylem' ? ' (ABA in the xylem holds the pump back)' : '') + '. In the model the channel share of P<sub>f</sub> is multiplied by ' + num(gp.fRedOnly.v, 2) + ' ' + badge('ILLUSTRATIVE', 'Direction from the papers; size invented.') + '. ') +
      'Without blue light, walnut K<sub>leaf</sub> was about 60 % lower (Ben Baaziz et al. 2012); the model is not fitted to that number. How the sap signal reaches the gate is an open question; the bundle sheath cytosol actually became less acid under blue light.';
    refs.eqs.innerHTML =
      '<div>f<sub>phos</sub> = ' + num(gp.phosFloor.v, 2) + ' + ' + num(1 - gp.phosFloor.v, 2) + ' × phos = <span class="r">' + num(G.phos, 3) + '</span> ' + badge('ILLUSTRATIVE') + '</div>' +
      '<div>f<sub>pH</sub> = 1 ÷ (1 + 10^(2 (' + num(gp.pKa.v, 1) + ' − pH))) = <span class="r">' + num(G.pH, 3) + '</span> ' + badge('ILLUSTRATIVE', 'Direction verified; midpoint and steepness invented.') + '</div>' +
      '<div>f<sub>Ca</sub> = ' + (st.ca === 'high' ? num(gp.fCaHigh.v, 2) + ' (raised)' : '1 (low)') + ' ' + badge('ILLUSTRATIVE') + '</div>' +
      '<div>p<sub>open</sub> = f<sub>phos</sub> × f<sub>pH</sub> × f<sub>Ca</sub> = <span class="r">' + num(res.pOpen, 3) + '</span></div>' +
      '<div>f<sub>light</sub> = ' + (st.lightQ === 'rb' && st.aba !== 'xylem' ? num(gp.fRedOnly.v, 2) + ' + ' + num(1 - gp.fRedOnly.v, 2) + ' × PPFD ÷ (PPFD + ' + num(gp.blueHalf.v, 0) + ')' : num(gp.fRedOnly.v, 2) + (st.aba === 'xylem' ? ' (ABA in the xylem)' : ' (red alone)')) + ' = <span class="r">' + num(res.fBlue, 3) + '</span> ' + badge('ILLUSTRATIVE', 'Form invented; direction from the light papers. No light, no light term.') + '</div>' +
      '<div>Drawn gate: open share of time = p<sub>open</sub> × f<sub>light</sub> × f<sub>ABA</sub> = <span class="r">' + num(tg.act, 3) + '</span>; open and shut spells about 5 s × share each, eased over 0.9 s ' + badge('ILLUSTRATIVE', 'A drawing of single channel gating; the timing is not measured.') + '</div>' +
      '<div>P<sub>f</sub> = ' + num(gp.PF_LIPID.v, 0) + ' + ' + num(gp.PF_CH.v, 0) + ' × p<sub>open</sub> × f<sub>light</sub> × channels × f<sub>ABA</sub> = <span class="r">' + WP.fmt.Pf(res.Pf) + '</span> ' + badge('ILLUSTRATIVE', 'Lipid and channel Pf are teaching constants; 20 to 200 µm s⁻¹ is a teaching scale.') + ' Published scale point: plasma membrane vesicles of beet root, P<sub>f</sub> 542 µm s⁻¹ ' + badge('MEASURED', 'Alleva et al. 2006.') + ' ' + evMarker('l5-pfscale', 'Evidence') + '</div>' +
      '<div>R<sub>bs</sub> = R<sub>bs,0</sub> × ' + num(gp.PF_REF.v, 0) + ' ÷ P<sub>f</sub> ÷ f<sub>Kox</sub> = <span class="r">' + num(res.R.bs * 1000, 1) + '</span> MPa m² s mol⁻¹; R<sub>mes</sub> = R<sub>mes,0</sub> ÷ f<sub>Kox</sub> = ' + num(res.R.mes * 1000, 1) + ' (f<sub>Kox</sub> ' + num(res.fKox, 2) + ', outside xylem loss as the leaf dries ' + ui.badge('ILLUSTRATIVE', 'Logistic in vein Ψ; grapevine anchored to Albuquerque et al. 2020.') + ')</div>' +
      '<div>K<sub>leaf</sub> = 1 ÷ (R<sub>leaf xylem</sub> + R<sub>bs</sub> + R<sub>mes</sub>) = <span class="r">' + WP.fmt.K(res.K.leaf) + '</span> ' + badge('DERIVED') + '</div>' +
      '<div>g<sub>s</sub> = g<sub>s,max</sub> × f<sub>light</sub>(PPFD) × f<sub>Ψ</sub>(Ψ<sub>leaf</sub>), ' + (st.crop === 'grape' ? 'f<sub>Ψ</sub> = exp(−(−Ψ ÷ 0.81)<sup>1.22</sup>) ' + badge('DERIVED', 'Weibull fitted to half closure at −0.60 MPa (Albuquerque et al. 2020, Table 2, read in the PDF) and 80 % closure by −1.2 MPa (abstract).') : 'f<sub>Ψ</sub> = 1 ÷ (1 + exp(−k (Ψ − ψ<sub>50</sub>)))') + ', half closure at ' + WP.fmt.psi(res.psi50) + (res.koActive ? ' (knockout shift ' + WP.fmt.psi(WP.params.ko.shift.v) + ' ' + badge('PREPRINT') + ')' : '') + '. In this model g<sub>s</sub> responds to leaf Ψ only, a hydraulic shortcut.</div>' +
      '<div>E = (g<sub>s</sub> + g<sub>min</sub>) × VPD ÷ P<sub>atm</sub> = (' + num(res.gs, 3) + ' + ' + num(res.gmin, 3) + ') × ' + num(res.VPD, 2) + ' ÷ 101.3 = <span class="r">' + num(res.E, 2) + '</span> mmol m⁻² s⁻¹</div>' +
      '<div style="margin-top:6px;font-family:var(--ui);font-size:12.5px;color:var(--ink2)">The lipid term means a membrane with every gate shut still passes water slowly; it is never watertight. Molecule speeds and gate timing in the pictures are drawn, not molecules per second.</div>';
    // pictures
    drawOne(tg, 0); updTop(tg);
    updMol(st, res, tg);
    mheroUpd(st, res, tg);
    kick();
  }
  function tile(k, v, s, hi) { return '<div class="tile' + (hi ? ' hi' : '') + '"><div class="k">' + k + '</div><div class="v">' + v + '</div><div class="s">' + s + '</div></div>'; }

  /* ============================================================ hero (macro.js) */
  var BASE = (document.currentScript && document.currentScript.src || '').replace(/[^\/]*$/, '');
  function ensureMacro(cb) {
    if (WP.macro) return cb();
    var s = document.querySelector('script[data-macro]');
    if (!s) { s = document.createElement('script'); s.src = BASE + 'macro.js'; s.setAttribute('data-macro', '1'); document.body.appendChild(s); }
    s.addEventListener('load', function () { if (WP.macro) cb(); });
  }
  /* 13 Oct (slow and named): WP.heroNames(ctx), molecule names in a macro hero under the ANTI CLUTTER RULE. Identical
     copy in l4_tissue.js and l5_membrane.js (first loaded wins). Each frame: begin(), add(kind, key, text, x, y, z, r, o)
     for every candidate (coordinates in ctx.root space, r = the molecule's radius), end(). Per kind: all named while 6 or
     fewer (o.all), else 2 at desktop width and 1 on phones (o.q overrides); stable (a named molecule keeps its name until
     it leaves; a blocked name waits hidden for at most about 1.5 s of wall time, then another molecule may take the name); a second name of a kind sits well away from the first; a
     name is shown only where it overlaps no other name, label tag, the hook caption, credit, live line or a button.
     Tags are WP.macro.nameTag sprites (hidden when MolNames is off) with a constant on screen font (about 11 px at
     desktop width, 10 px on phones), drawn UNDER the molecule. */
  WP.heroNames = WP.heroNames || function (ctx) {
    var T = ctx.THREE, MM = WP.macro, pools = {}, live = new Map(), prev = {}, miss = new Map(), items = [], blk = [], blkT = -1e9, v = new T.Vector3();
    function take(text) {
      var p = pools[text] = pools[text] || [], s = p.pop();
      if (!s) { s = MM.nameTag(T, text, { h: 0.3, depthTest: false }); s.material.fog = false; s.material.toneMapped = false; s.userData.asp = s.scale.x / s.scale.y; ctx.root.add(s); }
      s.userData.hideName = false; return s;
    }
    function give(s) { s.visible = false; s.userData.hideName = true; (pools[s.userData.molName] = pools[s.userData.molName] || []).push(s); }
    function blockers() {
      var now = performance.now(); if (now - blkT < 300) return blk; blkT = now; blk = [];
      var st = ctx.wrap.querySelector('.mh-stage'); if (!st) return blk; var wr = st.getBoundingClientRect();
      Array.prototype.forEach.call(ctx.wrap.querySelectorAll('.mh-tag:not(.mh-hide),.mh-cap,.mh-credit,.mh-lbtn,.mh-pause,.mh-spd,.mh-slow:not([hidden])'), function (e) {
        var r = e.getBoundingClientRect(); if (r.width > 0 && getComputedStyle(e).visibility !== 'hidden' && getComputedStyle(e).display !== 'none') blk.push({ x: r.left - wr.left - 3, y: r.top - wr.top - 3, w: r.width + 6, h: r.height + 6 });
      });
      return blk;
    }
    function hit(a, b) { return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h; }
    return {
      items: function () { return items; },
      begin: function () { items = []; },
      add: function (kind, key, text, x, y, z, r, o) { items.push({ k: kind, key: key, t: text, x: x, y: y, z: z, r: r || 0.15, all: !!(o && o.all), q: o && o.q, pri: (o && o.pri) || 0 }); },
      end: function () {
        var cam = ctx.camera, on = MM.namesOn ? MM.namesOn() : true, used = new Set(), root = ctx.root, now = performance.now();
        if (cam && on && ctx.w && root) {
          root.updateMatrixWorld();
          var tv = Math.tan(cam.fov * Math.PI / 360), px = ctx.narrow ? 15.5 : 17, placed = blockers().slice(), kinds = [], by = {}, next = {};
          items.forEach(function (it) { if (!by[it.k]) { by[it.k] = []; kinds.push(it.k); } by[it.k].push(it); });
          kinds.forEach(function (k) {
            var L = by[k], q = L[0].q != null ? L[0].q : (L[0].all && L.length <= 6 ? 6 : (ctx.narrow ? 1 : 2)), chosen = [], old = prev[k] || [];
            if (q <= 0) return;
            L.sort(function (a, b) { return b.pri - a.pri; });
            L.forEach(function (it) {
              v.set(it.x, it.y, it.z); root.localToWorld(v);
              var d = cam.position.distanceTo(v), ppu = ctx.h / (2 * d * tv), hh = px / ppu;
              it.hh = hh; it.wy = it.y - it.r - hh * 0.62;
              v.set(it.x, it.wy, it.z); root.localToWorld(v); v.project(cam);
              var sx = (v.x + 1) / 2 * ctx.w, sy = (1 - v.y) / 2 * ctx.h, asp = (it.t.length * 27 + 36) / 66;
              it.front = v.z < 1; it.box = { x: sx - px * asp / 2 - 2, y: sy - px / 2 - 2, w: px * asp + 4, h: px + 4 }; it.sx = sx; it.sy = sy;
            });
            function fits(it) { var b = it.box; if (!it.front || b.x < 4 || b.y < 4 || b.x + b.w > ctx.w - 4 || b.y + b.h > ctx.h - 4) return false; for (var i = 0; i < placed.length; i++) if (hit(b, placed[i])) return false; return true; }
            L.forEach(function (it) { var m0 = miss.get(it.key); if (chosen.length < q && old.indexOf(it.key) >= 0 && (m0 == null || now - m0 < 1500)) chosen.push(it); });
            L.forEach(function (it) {
              if (chosen.length >= q || chosen.indexOf(it) >= 0) return;
              for (var i = 0; i < chosen.length; i++) if (Math.hypot(chosen[i].sx - it.sx, chosen[i].sy - it.sy) < (ctx.narrow ? 60 : 90)) return;
              if (fits(it)) chosen.push(it);
            });
            next[k] = chosen.map(function (it) { return it.key; });
            chosen.forEach(function (it) {
              if (!fits(it)) { if (!miss.has(it.key)) miss.set(it.key, now); return; }
              miss.delete(it.key); placed.push(it.box);
              var s = live.get(it.key);
              if (s && s.userData.molName !== it.t) { give(s); s = null; }
              if (!s) { s = take(it.t); live.set(it.key, s); }
              s.position.set(it.x, it.wy, it.z); s.scale.set(it.hh * s.userData.asp, it.hh, 1); s.visible = true; s.renderOrder = 30;
              used.add(it.key);
            });
          });
          prev = next;
        } else prev = {};
        live.forEach(function (s, key) { if (!used.has(key)) { give(s); live.delete(key); } });
        if (miss.size > 300) miss.clear();
      }
    };
  };
  /* ============================================================ GATE AND TREE (13 Oct evening): Water V macro hero, ONE channel
     One PIP monomer, big and cut open along its pore (glass shell, amber cut faces with the helices inside), water in
     single file, and its gate: loop D swings under the cytosol mouth and back with an eased motion. How long it stays
     open is the model's open share (GS above), so the controls change what the gate does. His193 turns orange red and
     carries an H⁺ when the cytosol acidifies; phosphate beads on Ser115 and Ser274 and the Ca²⁺ ion follow the controls.
     An optional view shows the real tetramer (four monomers, four gates). After Törnroth-Horsefield et al. 2006;
     schematic, not traced. Units: 1 ≈ 1 nm (membrane about 4 nm). */
  var HM = { ctx: null, tg: null, res: null, tetra: false, lblKey: '' };
  var PHI_C = 0.42, CUT = 2.0;
  var PROF_OUT = [[0.78, 3.05], [1.3, 3.22], [1.72, 3.02], [1.9, 2.4], [1.95, 1.2], [1.9, 0], [1.95, -1.2], [1.9, -2.4], [1.72, -3.02], [1.3, -3.22], [0.78, -3.05]];
  var PROF_IN = [[0.6, -2.6], [0.42, -1.6], [0.3, -0.6], [0.27, 0], [0.31, 0.5], [0.26, 1.3], [0.42, 2.1], [0.6, 2.6]];
  var WL = 12.8, WS0 = 3.15, WS1 = 9.25;
  function polar(phi, r, y) { return [Math.sin(phi) * r, y, Math.cos(phi) * r]; }
  function angDist(a, b) { var d = Math.abs(a - b) % (Math.PI * 2); return d > Math.PI ? Math.PI * 2 - d : d; }
  function heroBilayer(ctx, hole, wedge) {
    var T = ctx.THREE, M = WP.macro, set = { root: new T.Group(), far: new T.Group(), near: new T.Group() };
    ctx.root.add(set.root); ctx.far.add(set.far); if (ctx.near) ctx.near.add(set.near);
    var near = [[], [], []], farH = [[], [], []], lens = [[], [], []], tails = [], tailsF = [], tailsN = [];
    var rr = (function (s0) { var s1 = s0 >>> 0; return function () { s1 = (s1 * 1664525 + 1013904223) >>> 0; return s1 / 4294967296; }; })(77);
    for (var ix = -12; ix <= 12; ix++) for (var iz = -9; iz <= 7; iz++) {
      var x = ix * 0.82 + (iz % 2 ? 0.41 : 0) + (rr() - 0.5) * 0.16, z = iz * 0.72 + (rr() - 0.5) * 0.14, d = Math.hypot(x, z);
      if (d < hole) continue;
      if (z > 0 && angDist(Math.atan2(x, z), PHI_C) < wedge && d < 6.5) continue; // cut a wedge toward the camera
      var j = ((ix * 31 + iz * 17) % 7) * 0.02;
      var zone = z < -2.2 ? 'far' : (z > 3.6 ? 'lens' : 'mid');
      if (zone === 'lens' && !ctx.near) zone = 'mid';
      [1, -1].forEach(function (sd) {
        var y = sd * (2.05 + j + (rr() - 0.5) * 0.08), cls = Math.floor(rr() * 3);
        (zone === 'far' ? farH : zone === 'lens' ? lens : near)[cls].push([x, y, z]);
        var tl = zone === 'far' ? tailsF : (zone === 'lens' ? tailsN : tails);
        [-0.16, 0.16].forEach(function (dx) {
          var py = y - sd * 0.25, px = x + dx;
          for (var k = 0; k < 5; k++) { var ny = py - sd * 0.33, nx = x + dx + Math.sin((k + 1) * 1.7 + ix) * 0.08; tl.push(px, py, z, nx, ny, z); px = nx; py = ny; }
        });
      });
    }
    [2.12, 2.35, 2.58].forEach(function (sz, k) {
      if (near[k].length) set.root.add(M.balls(T, near[k], 0x7fb2e6, sz));
      if (farH[k].length) set.far.add(M.balls(T, farH[k], 0x7fb2e6, sz));
      if (lens[k].length) set.near.add(M.balls(T, lens[k], 0x86b8ea, sz));
    });
    function lines(arr, op, parent) {
      if (!arr.length) return;
      var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(arr, 3));
      parent.add(new T.LineSegments(g, M.lin(new T.LineBasicMaterial({ color: 0xc9c2b0, transparent: true, opacity: op }))));
    }
    lines(tails, 0.55, set.root); lines(tailsF, 0.5, set.far); lines(tailsN, 0.5, set.near);
    set.show = function (on) { set.root.visible = set.far.visible = set.near.visible = on; };
    return set;
  }
  function heroMono(ctx, parent, ox, oz, gi, nW) {
    var T = ctx.THREE, mats = ctx.mats, geo = HM.geo;
    var g = new T.Group(); g.position.set(ox, 0, oz); parent.add(g);
    var shell = new T.Mesh(geo.lathe, mats.shell); shell.renderOrder = 3; g.add(shell);
    [HM.phiS, HM.phiS + HM.phiL].forEach(function (pe) { var c = new T.Mesh(geo.cut, mats.cut); c.rotation.y = pe - Math.PI / 2; c.renderOrder = 2; g.add(c); });
    function rod(a, b, r, mat) {
      var A = new T.Vector3(a[0], a[1], a[2]), B = new T.Vector3(b[0], b[1], b[2]), m = new T.Mesh(geo.rod, mat);
      m.position.copy(A).add(B).multiplyScalar(0.5); m.scale.set(r, A.distanceTo(B), r);
      m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), B.clone().sub(A).normalize()); return m;
    }
    // six helices around the pore; the ones in the cut wedge are left out so the pore shows
    for (var h = 0; h < 6; h++) {
      var a = PHI_C + Math.PI / 6 + h * Math.PI / 3;
      if (angDist(a, PHI_C) < 1.15) continue;
      var tp = polar(a + 0.12, 1.22, 2.55), bt = polar(a - 0.12, 1.22, -2.55);
      g.add(rod(tp, bt, 0.25, mats.hel));
      [tp, bt].forEach(function (p) { var c = new T.Mesh(geo.cap, mats.hel); c.position.set(p[0], p[1], p[2]); g.add(c); });
    }
    // two half helices meeting mid membrane at the back of the pore (NPA)
    var pb = PHI_C + Math.PI;
    g.add(rod(polar(pb, 0.95, 2.45), polar(pb, 0.5, 0.12), 0.21, mats.half));
    g.add(rod(polar(pb, 0.95, -2.45), polar(pb, 0.5, -0.12), 0.21, mats.half));
    var npa = new T.Mesh(geo.bead, mats.npa); npa.scale.setScalar(0.13); var np = polar(pb, 0.5, 0); npa.position.set(np[0], 0, np[2]); g.add(npa);
    var poreM = mats.pore.clone(); ctx.disp.push(poreM);
    var pore = new T.Mesh(geo.pore, poreM); pore.renderOrder = 5; g.add(pore);
    // loop D: a pivot at the cytosolic rim; shut, its lid sits under the cytosol mouth; open, it swings aside and dips
    var php = PHI_C + 2.4, pp = polar(php, 1.3, -3.2);
    var pivY = new T.Group(); pivY.position.set(pp[0], pp[1], pp[2]); pivY.rotation.y = Math.atan2(Math.cos(php), -Math.sin(php)); g.add(pivY);
    var pivS = new T.Group(); pivY.add(pivS); var pivZ = new T.Group(); pivS.add(pivZ);
    pivZ.add(new T.Mesh(geo.loop, mats.loopd));
    var lid = new T.Mesh(geo.bead, mats.loopd); lid.scale.set(0.98, 0.25, 0.98); lid.position.set(1.3, -0.16, 0); pivZ.add(lid); // FIX ROUND: about 1.5× larger
    var hisM = mats.his.clone(); ctx.disp.push(hisM);
    var his = new T.Mesh(geo.bead, hisM); his.scale.setScalar(0.25); his.position.set(0.82, -0.68, 0.18); pivZ.add(his);
    var hb = new T.Mesh(geo.bead, mats.hp); hb.scale.setScalar(0.14); hb.position.set(0.82, -1.02, 0.24); pivZ.add(hb);
    // N terminus and the Ca2+ site at the base of loop D; the bridge shows when Ca2+ is raised and the gate is shut
    pivY.add(rod([-0.1, 0.12, 0.6], [0.12, -0.5, 0.55], 0.07, mats.loopb));
    var ca = new T.Mesh(geo.bead, mats.ca); ca.scale.setScalar(0.24); ca.position.set(0.14, -0.62, 0.55); pivY.add(ca);
    var bridge = rod([0.14, -0.62, 0.55], [0.8, -0.56, 0.12], 0.06, mats.ca); pivY.add(bridge);
    // loop B with Ser115, and the C terminus with Ser274; phosphates appear when the control phosphorylates them
    var ps = PHI_C - 2.25, pt = PHI_C + Math.PI + 0.45;
    var lb = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([polar(ps, 1.35, -3.05), polar(ps, 1.62, -3.55), polar(ps + 0.15, 1.92, -3.8)].map(function (p) { return new T.Vector3(p[0], p[1], p[2]); })), 16, 0.08, 6, false), mats.loopb);
    ctx.disp.push(lb.geometry); g.add(lb);
    var ct = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([polar(pt, 1.0, -3.15), polar(pt, 1.25, -3.9), polar(pt - 0.2, 1.0, -4.45)].map(function (p) { return new T.Vector3(p[0], p[1], p[2]); })), 16, 0.08, 6, false), mats.loopb);
    ctx.disp.push(ct.geometry); g.add(ct);
    var s1 = new T.Mesh(geo.bead, mats.ser); s1.scale.setScalar(0.14); var q1 = polar(ps + 0.15, 1.92, -3.8); s1.position.set(q1[0], q1[1], q1[2]); g.add(s1);
    var s2 = new T.Mesh(geo.bead, mats.ser); s2.scale.setScalar(0.14); var q2 = polar(pt - 0.2, 1.0, -4.45); s2.position.set(q2[0], q2[1], q2[2]); g.add(s2);
    var p1 = new T.Mesh(geo.bead, mats.phos); p1.scale.setScalar(0.31); var r1 = polar(ps + 0.22, 2.12, -4.08); p1.position.set(r1[0], r1[1], r1[2]); g.add(p1);
    var p2 = new T.Mesh(geo.bead, mats.phos); p2.scale.setScalar(0.31); var r2 = polar(pt - 0.32, 1.08, -4.85); p2.position.set(r2[0], r2[1], r2[2]); g.add(p2);
    var st = Stream(nW, WL, WS0, WS1, 0.62, 1.05);
    return { g: g, ox: ox, oz: oz, gi: gi, pivS: pivS, pivZ: pivZ, lid: lid, his: his, hisM: hisM, hb: hb, ca: ca, bridge: bridge, ph: [p1, p2], poreM: poreM, st: st, keys: st.p.map(function () { return {}; }) };
  }
  function mheroBuild(ctx) {
    var T = ctx.THREE, M = WP.macro, root = ctx.root;
    var G = function (g) { ctx.disp.push(g); return g; };
    var mats = ctx.mats;
    mats.shell = M.glass(T, 0x6a9be3, { opacity: 0.26, roughness: 0.12, emissive: 0x12306a, ei: 0.7, rimColor: 0xbfe0ff, rimK: 0.95, rimPow: 2.2, side: T.DoubleSide });
    mats.cut = M.glass(T, 0xe6c07a, { opacity: 0.55, roughness: 0.32, emissive: 0x3a2608, ei: 0.5, rimK: 0.15, side: T.DoubleSide });
    mats.hel = M.glass(T, 0xd2ae68, { opacity: 0.55, roughness: 0.3, emissive: 0x2a1c06, ei: 0.45, rimColor: 0xffe6b0, rimK: 0.45 });
    mats.half = M.glass(T, 0x8aa8d8, { opacity: 0.85, roughness: 0.3, emissive: 0x13234a, ei: 0.7, rimK: 0.4, depthWrite: true });
    mats.npa = M.lin(new T.MeshBasicMaterial({ color: 0xcfe6ff }));
    mats.loopd = M.lin(new T.MeshPhysicalMaterial({ color: 0xc8582a, roughness: 0.28, clearcoat: 0.9, emissive: 0x4a1406, emissiveIntensity: 0.7 }));
    mats.loopb = M.lin(new T.MeshStandardMaterial({ color: 0x9a8a72, roughness: 0.5, emissive: 0x1a140c, emissiveIntensity: 0.6 }));
    mats.ser = M.lin(new T.MeshStandardMaterial({ color: 0xe8e2d4, roughness: 0.4 }));
    mats.his = M.lin(new T.MeshStandardMaterial({ color: 0xb5532a, roughness: 0.3, emissive: 0x3a1004, emissiveIntensity: 0.6 }));
    mats.phos = M.lin(new T.MeshPhysicalMaterial({ color: 0xf0a020, roughness: 0.25, clearcoat: 1, emissive: 0x6a3a00, emissiveIntensity: 0.7 }));
    mats.ca = M.lin(new T.MeshPhysicalMaterial({ color: 0x3fbf6a, roughness: 0.2, clearcoat: 1, emissive: 0x0a4a20, emissiveIntensity: 0.8 }));
    mats.pore = M.lin(new T.MeshBasicMaterial({ color: 0x7fe4ff, transparent: true, opacity: 0.35, depthWrite: false, blending: T.AdditiveBlending }));
    mats.mol = new T.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.06, emissive: 0x1a0604, emissiveIntensity: 0.5 });
    mats.hp = M.lin(new T.MeshPhysicalMaterial({ color: 0xffd23a, roughness: 0.2, clearcoat: 1, emissive: 0x8a6400, emissiveIntensity: 0.9 }));
    var pts = PROF_OUT.concat(PROF_IN).concat([PROF_OUT[0]]).map(function (p) { return new T.Vector2(p[0], p[1]); });
    HM.phiS = PHI_C + CUT / 2; HM.phiL = Math.PI * 2 - CUT;
    var loop = new T.CatmullRomCurve3([new T.Vector3(0, 0, 0), new T.Vector3(0.3, -0.5, 0.18), new T.Vector3(0.8, -0.56, 0.12), new T.Vector3(1.15, -0.34, 0.02), new T.Vector3(1.3, -0.18, 0)]);
    HM.geo = {
      lathe: G(new T.LatheGeometry(pts, 30, HM.phiS, HM.phiL)),
      cut: G(new T.ShapeGeometry(new T.Shape(pts.slice(0, -1)))),
      rod: G(new T.CylinderGeometry(1, 1, 1, 10, 1)), cap: G(new T.SphereGeometry(0.25, 8, 5)),
      bead: G(new T.SphereGeometry(1, 12, 8)), pore: G(new T.CylinderGeometry(0.15, 0.15, 6.0, 10, 1, true)),
      loop: G(new T.TubeGeometry(loop, 22, 0.25, 8, false))
    };
    HM.molMesh = new T.InstancedMesh(G(M.waterGeo(T, 0.25)), mats.mol, 64); HM.molMesh.frustumCulled = false; root.add(HM.molMesh);
    HM.glow = M.halos(T, 40, 0xbff0ff, 3.0); root.add(HM.glow.obj); ctx.disp.push(HM.glow.geo, HM.glow.mat);
    HM.bil1 = heroBilayer(ctx, 2.15, 0.5); HM.bil4 = heroBilayer(ctx, 2.7, 0.55);
    HM.one = heroMono(ctx, root, 0, 0, 0, 16);
    HM.g4 = new T.Group(); root.add(HM.g4); HM.g4.scale.setScalar(0.56);
    HM.four = [[1, 1], [-1, 1], [-1, -1], [1, -1]].map(function (c, i) { return heroMono(ctx, HM.g4, c[0] * 2.08, c[1] * 2.08, i, 9); });
    // free protons in the cytosol, as many as the protonated share of the gates
    HM.hp = []; HM.hpGlow = M.halos(T, 8, 0xffd84a, 2.4); root.add(HM.hpGlow.obj); ctx.disp.push(HM.hpGlow.geo, HM.hpGlow.mat);
    var hpG = G(new T.SphereGeometry(0.17, 12, 9));
    for (var hq = 0; hq < 8; hq++) { var hm2 = new T.Mesh(hpG, mats.hp); hm2.visible = false; root.add(hm2); HM.hp.push({ m: hm2, x: -4.2 + ((hq * 37) % 9) * 0.95, y: -4.3 - (hq % 3) * 0.5, z: -1.5 + ((hq * 53) % 7) * 0.5, a: hq * 1.7, on: 0 }); }
    // bulk water drifting on both sides, and two molecules taking the slow way through the lipid
    HM.bulk = []; var rb = (function (s) { return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; })(91);
    for (var b = 0; b < 18; b++) {
      var bx = (rb() - 0.5) * 13, bz = -3 + rb() * 6;
      if (Math.abs(bx) < 1.6 && Math.abs(bz) < 1.6) bx += bx < 0 ? -2 : 2;
      HM.bulk.push({ x: bx, y: (b % 2 ? 1 : -1) * (3.9 + rb() * 2.2), z: bz, a: rb() * 6.3, s: 0.2 + rb() * 0.3 });
    }
    HM.lip = [{ x: 4.6, z: 1.2, p: 0 }, { x: -5.2, z: 0.4, p: 0.5 }];
    root.rotation.set(0.04, 0, -0.03); ctx.far.rotation.copy(root.rotation); if (ctx.near) ctx.near.rotation.copy(root.rotation);
    heroMode(ctx);
  }
  function heroMode(ctx) {
    var tet = HM.tetra;
    HM.one.g.visible = !tet; HM.g4.visible = tet; HM.bil1.show(!tet); HM.bil4.show(tet);
    HM.lblKey = ''; heroLabels(ctx);
    if (ctx.invalidate) ctx.invalidate();
  }
  function heroLabels(ctx) {
    var T = ctx.THREE, root = ctx.root, tg = HM.tg || {};
    var t3 = (WP.ui && WP.ui.tier ? WP.ui.tier() : 2) >= 3;
    var key = (HM.tetra ? 't' : 'o') + (tg.phos1 ? 'p' : '') + (tg.ko ? 'k' : '') + (t3 ? '3' : '');
    if (key === HM.lblKey) return; HM.lblKey = key;
    function V(x, y, z) { return new T.Vector3(x, y, z); }
    var side = [{ id: 'apo', text: 'apoplast side', obj: root, pos: V(-6.4, 2.9, 1.6), narrow: false }, { id: 'cyt', text: 'cytosol side', obj: root, pos: V(-6.4, -3.3, 1.6), narrow: false }];
    if (HM.tetra) ctx.setLabels([{ id: 't4', text: 'four monomers, four pores', tier: 1, obj: root, pos: V(0, 2.3, 0) }, { id: 'tc', text: 'centre: not a water path', tier: 1, obj: root, pos: V(0, -1.9, 0.4) }].concat(side));
    else {
      var l = [{ id: 'pore', text: 'one water pore, cut open', tier: 1, obj: root, pos: V(0.1, 3.5, 0.5) },
        { id: 'sf', text: 'water in single file', tier: 1, obj: root, pos: V(0.35, 1.1, 0.3) },
        { id: 'his', text: 'His193 (SoPIP2;1)', obj: HM.one.his, pos: V(0, 0, 0), side: 'right' }];
      ctx.setLabels(l.concat(side));
    }
  }
  function wposHero(mo, s, i, out) {
    var y = 6.2 - s, d = Math.max(0, WS0 - s, s - WS1), a = i * 2.399 + mo.gi + mo.st.wraps[i] * 1.3, r = 0.5 * d;
    var x = mo.ox + Math.sin(a) * r + (d ? 0 : 0.035 * Math.sin(s * 3 + i)), z = mo.oz + Math.cos(a) * r * 0.8;
    var k = mo.g.parent === HM.g4 ? 0.56 : 1;
    out[0] = x * k; out[1] = y * k; out[2] = z * k; return out;
  }
  function mheroFrame(ctx, t, dt) {
    var T = ctx.THREE, tg = HM.tg;
    if (!tg) return;
    gsTick();
    heroLabels(ctx);
    var m4 = HM._m || (HM._m = new T.Matrix4()), q4 = HM._q || (HM._q = new T.Quaternion()), e = HM._e || (HM._e = new T.Euler()), p = HM._p || (HM._p = new T.Vector3()), sc = HM._s || (HM._s = new T.Vector3()), o3 = [0, 0, 0];
    var monos = HM.tetra ? HM.four : [HM.one], slot = 0, gl = 0;
    var HN = HM.hn || (HM.hn = WP.heroNames(ctx));
    HN.begin();
    var his0 = HM._h0 || (HM._h0 = new T.Color(0xb5532a).convertSRGBToLinear()), his1 = HM._h1 || (HM._h1 = new T.Color(0xff5a1f).convertSRGBToLinear());
    monos.forEach(function (mo, mi) {
      var gg = GS.g[mo.gi], x = gg.x, k = mo.g.parent === HM.g4 ? 0.56 : 1;
      mo.pivS.rotation.y = -2.0 * (1 - x); mo.pivZ.rotation.z = -0.6 * (1 - x); // swings well aside, clear of the pore mouth, and dips (FIX ROUND: wider swing)
      mo.hisM.color.copy(his0).lerp(his1, clamp(tg.prot, 0, 1));
      mo.hisM.emissive.setHex(tg.prot > 0.5 ? 0x9a2400 : 0x3a1004).convertSRGBToLinear();
      mo.hb.visible = tg.prot > 0.5;
      var ph = HM.tetra ? !!tg.phos[mo.gi] : tg.phos1;
      mo.ph[0].visible = mo.ph[1].visible = ph;
      mo.ca.visible = !!tg.ca; mo.bridge.visible = !!tg.ca && x > 0.75;
      var blocked = x > 0.5;
      if (dt > 0) mo.st.step(dt, blocked);
      var flowing = !blocked;
      mo.poreM.opacity = flowing ? 0.4 : 0.06;
      mo.st.p.forEach(function (s, i) {
        wposHero(mo, s, i, o3);
        var f = Math.max(0.001, Math.min(1, s / 1.2, (WL - s) / 1.2)) * k;
        e.set(0, s * 2 + i, Math.PI / 2 * (i % 2)); q4.setFromEuler(e);
        m4.compose(p.set(o3[0], o3[1], o3[2]), q4, sc.setScalar(f)); HM.molMesh.setMatrixAt(slot++, m4);
        var inP = s > WS0 && s < WS1;
        if (inP && flowing && gl < 40) HM.glow.set(gl++, o3[0], o3[1], o3[2]);
        if (inP && s > WS0 + 0.5 && s < WS1 - 0.5 && (mi === 0 || HM.tetra)) HN.add('pore', mo.keys[i], 'H₂O', o3[0], o3[1], o3[2], 0.25 * k, { q: 1, pri: mo.oz >= 0 ? 1 : 0 });
      });
      if (tg.ca && mi === 0) { mo.ca.getWorldPosition(p); ctx.root.worldToLocal(p); HN.add('Ca', mo.ca, 'Ca²⁺', p.x, p.y, p.z, 0.24 * k); }
      if (tg.prot > 0.5 && mi === 0) { mo.hb.getWorldPosition(p); ctx.root.worldToLocal(p); HN.add('H', mo.hb, 'H⁺', p.x, p.y, p.z, 0.12 * k, { pri: 2 }); }
    });
    for (; gl < 40; gl++) HM.glow.hide(gl);
    for (; slot < 40; slot++) { m4.makeScale(0.0001, 0.0001, 0.0001); HM.molMesh.setMatrixAt(slot, m4); }
    HM.bulk.forEach(function (b, j) {
      if (dt > 0) b.a += dt * b.s;
      var x = b.x + Math.sin(b.a * 1.3 + j) * 0.5, y = b.y + Math.cos(b.a + j) * 0.3, z = b.z + Math.sin(b.a * 0.7) * 0.4;
      e.set(b.a, b.a * 1.4, 0); q4.setFromEuler(e);
      m4.compose(p.set(x, y, z), q4, sc.setScalar(1)); HM.molMesh.setMatrixAt(40 + j, m4);
      if (!ctx.narrow && b.y > 0) HN.add('bulk', b, 'H₂O', x, y, z, 0.25, { q: 1 });
    });
    var lr = (WP.params.gate.PF_LIPID.v / WP.params.gate.PF_CH.v) * 0.05;
    HM.lip.forEach(function (w, j) {
      if (dt > 0) w.p = (w.p + dt * lr) % 1;
      e.set(w.p * 9, j, 0); q4.setFromEuler(e);
      m4.compose(p.set(w.x, 2.6 - w.p * 5.2, w.z), q4, sc.setScalar(0.85)); HM.molMesh.setMatrixAt(58 + j, m4);
    });
    for (var z0 = 60; z0 < 64; z0++) { m4.makeScale(0.0001, 0.0001, 0.0001); HM.molMesh.setMatrixAt(z0, m4); }
    HM.molMesh.instanceMatrix.needsUpdate = true; HM.glow.commit();
    var nH = Math.round(8 * clamp(tg.prot || 0, 0, 1));
    HM.hp.forEach(function (h, j) {
      h.on += ((j < nH ? 1 : 0) - h.on) * (dt > 0 ? Math.min(1, dt * 2) : 1);
      if (dt > 0) h.a += dt * 0.7;
      var x = h.x + Math.sin(h.a * 1.1 + j) * 0.45, y = h.y + Math.cos(h.a * 0.8 + j) * 0.3, z = h.z + Math.sin(h.a * 0.6) * 0.35;
      h.m.visible = h.on > 0.05; h.m.position.set(x, y, z); h.m.scale.setScalar(Math.max(0.01, h.on));
      if (h.on > 0.3) HM.hpGlow.set(j, x, y, z); else HM.hpGlow.hide(j);
      if (h.on > 0.6) HN.add('H', h, 'H⁺', x, y, z, 0.17);
    });
    HM.hpGlow.commit();
    HN.end();
    if (dt > 0) armIntro();
    gateCallout(ctx);
  }
  /* FIX ROUND (Q M1): the gate callout. The loop D tag sits beside the channel with a leader line to the lid, so the
     lid is never covered, and a stage word under the pore says OPEN or SHUT and flips with the gate. Both live in an
     overlay of the hero stage (class mh-tag, so molecule names keep clear of them). One channel view only. */
  function gateCallout(ctx) {
    var G = HM.gov; if (!G || !ctx.camera || !ctx.w) return;
    if (HM.tetra || !ctx.built) { G.root.style.display = 'none'; return; }
    G.root.style.display = '';
    var T = ctx.THREE, v = HM._gv || (HM._gv = new T.Vector3()), cam = ctx.camera;
    // frame runs before render: place the camera first (still frames too). LOOK CLOSER: while the user drives the
    // camera (or Reset view blends back), the camera already holds the user's view from the last render; keep it
    if (!(ctx.orbit && (ctx.orbit.engaged || ctx.orbit.moving()))) mheroCamera(ctx, ctx.t);
    cam.updateMatrixWorld();
    ctx.root.updateMatrixWorld();
    function scr(obj, x, y, z) { v.set(x, y, z); obj.localToWorld(v); v.project(cam); return [(v.x + 1) / 2 * ctx.w, (1 - v.y) / 2 * ctx.h]; }
    var mouth = scr(HM.one.g, 0, -3.3, 0), lid = scr(HM.one.lid, 0, 0, 0), x = GS.g[0].x, shut = x > 0.5;
    // LOOK CLOSER: a user's camera can put the gate out of frame or behind the camera; the callout then waits hidden
    v.set(0, 0, 0); HM.one.lid.localToWorld(v); v.project(cam);
    if (v.z > 1 || lid[0] < 0 || lid[0] > ctx.w || lid[1] < 0 || lid[1] > ctx.h) { G.root.style.display = 'none'; return; }
    var tw = G.tag.offsetWidth || 110, th = G.tag.offsetHeight || 22;
    var gap = ctx.narrow ? 46 : 92, tx = Math.max(8, mouth[0] - gap - tw), ty = Math.max(40, Math.min(ctx.h - th - 90, mouth[1] - (ctx.narrow ? 46 : 62) - th / 2)); // LOOK CLOSER: stays in frame when the user zooms in
    G.tag.style.left = tx.toFixed(1) + 'px'; G.tag.style.top = ty.toFixed(1) + 'px';
    var ax = tx + tw, ay = ty + th / 2;
    G.path.setAttribute('d', 'M' + ax.toFixed(1) + ',' + ay.toFixed(1) + ' L' + ((ax + lid[0]) / 2).toFixed(1) + ',' + ay.toFixed(1) + ' L' + lid[0].toFixed(1) + ',' + lid[1].toFixed(1));
    G.dot.setAttribute('cx', lid[0].toFixed(1)); G.dot.setAttribute('cy', lid[1].toFixed(1));
    // phosphate tag (tier 3, or Labels on): left of the bead with a leader, so it never sits on the lid
    var showP = !!(HM.tg && HM.tg.phos1) && ((WP.ui && WP.ui.tier ? WP.ui.tier() : 2) >= 3 || ctx.showAll);
    G.ptag.style.display = G.ppath.style.display = G.pdot.style.display = showP ? '' : 'none';
    if (showP) {
      var pb = scr(HM.one.ph[0], 0, 0, 0), pw = G.ptag.offsetWidth || 200, ph = G.ptag.offsetHeight || 22;
      var px = ctx.narrow ? 8 : Math.max(8, pb[0] - 40 - pw), py = ctx.narrow ? ty - ph - 10 : pb[1] - ph / 2;
      G.ptag.style.left = px.toFixed(1) + 'px'; G.ptag.style.top = py.toFixed(1) + 'px';
      var bx = ctx.narrow ? px + pw - 14 : Math.min(px + pw, pb[0] - 6), by = ctx.narrow ? py + ph : py + ph / 2;
      G.ppath.setAttribute('d', 'M' + bx.toFixed(1) + ',' + by.toFixed(1) + ' L' + pb[0].toFixed(1) + ',' + pb[1].toFixed(1));
      G.pdot.setAttribute('cx', pb[0].toFixed(1)); G.pdot.setAttribute('cy', pb[1].toFixed(1));
    }
    var ww = G.word.offsetWidth || 70;
    G.word.style.left = Math.max(ww / 2 + 6, Math.min(ctx.w - ww / 2 - 6, mouth[0])).toFixed(1) + 'px';
    G.word.style.top = Math.min(ctx.h - 76, mouth[1] + (ctx.narrow ? 54 : 62)).toFixed(1) + 'px'; // never over the credit line
    if (G.shut !== shut) {
      G.shut = shut; G.word.textContent = shut ? 'SHUT' : 'OPEN';
      G.word.classList.toggle('m5-shut', shut);
    }
  }
  function mheroCamera(ctx, t) {
    var cam = ctx.camera, asp = ctx.w / ctx.h, tv = Math.tan(cam.fov * Math.PI / 360);
    var halfW = ctx.narrow ? 3.0 : 6.2, halfH = ctx.narrow ? 7.0 : 5.25;
    var D = Math.max(halfW / (tv * asp), halfH / tv) + 1.0;
    var yaw = PHI_C + 0.2 * Math.sin(t * 0.09), pitch = 0.12 + 0.05 * Math.sin(t * 0.07 + 2);
    var off = ctx.narrow ? 0 : 2.1, ty = ctx.narrow ? -1.2 : -1.45; // FIX ROUND: target lowered so the gate sits above the hook card band
    var tx = -Math.cos(yaw) * off, tz = Math.sin(yaw) * off;
    cam.position.set(tx + Math.sin(yaw) * Math.cos(pitch) * D, ty + Math.sin(pitch) * D, tz + Math.cos(yaw) * Math.cos(pitch) * D);
    cam.lookAt(tx, ty, tz);
    ctx.scene.fog.near = D - 3; ctx.scene.fog.far = D + 14; ctx.farScene.fog.near = D - 3; ctx.farScene.fog.far = D + 10;
  }
  function mheroLive() {
    if (!HM.ctx || !HM.res || !HM.tg) return;
    var tg = HM.tg;
    HM.ctx.setLive((HM.tetra ? 'each of 4 gates' : 'this gate') + ' open about ' + num(100 * tg.act, 0) + ' % of the time · P<sub>f</sub> ' + num(HM.res.Pf, 0) + ' µm s⁻¹' + (tg.ko ? ' · knockout: drawn channel = other PIPs' : ''));
  }
  function mheroInit(host) {
    if (!host) return;
    ensureMacro(function () {
      if (HM.ctx) return;
      HM.ctx = WP.macro.hero(host, {
        id: 'm5-hero', seed: 23, fov: 30,
        palette: { light: { top: '#1f3346', mid: '#3d5a72', bot: '#6f8aa0', bokeh: ['#cfe3f5', '#8fb4d6', '#f2e6c8', '#a9c9e8'], fog: 0x3d5a72, fg: 'rgba(170,205,235,.5)' },
          dark: { top: '#05080d', mid: '#0c1824', bot: '#122434', bokeh: ['#2b5c86', '#1d3f5c', '#6a5a2c', '#2f6a8a'], fog: 0x0c1824, fg: 'rgba(60,110,160,.45)' } },
        label: 'Three dimensional model of one aquaporin water channel in a lipid bilayer, cut open along its pore: a glassy protein with amber cut faces and helices, water molecules passing in single file, and loop D, a lid on the cytosol side, that swings under the pore mouth to shut it and swings away to open it.',
        question: 'What opens and shuts one water channel?',
        answer: 'Loop D, a loop on the cytosol side, is the gate: it swings under the mouth of the pore and the single file of water stops. In this model a channel is either open or shut; the switches change how much of the time it stays open. Phosphates on two serines favour open; a proton on His193 (an acid cytosol) and, in purified membranes, Ca²⁺ favour shut (spinach SoPIP2;1 numbering). In many species light raises the leaf\'s conductance and water stress lowers it.',
        credit: { text: 'Törnroth-Horsefield et al. 2006 · Nature', doi: '10.1038/nature04316' },
        capAlign: 'left',
        height: function (w) { return w < 600 ? 540 : Math.round(Math.min(680, Math.max(460, w * 0.66))); },
        lift: function (ctx) { return ctx.narrow ? 70 : 40; },
        fallbackNote: 'This 3D channel needs WebGL, which this browser does not offer. The drawing below shows the same gate.',
        build: mheroBuild, frame: mheroFrame, camera: mheroCamera,
        /* LOOK CLOSER (14 Oct, controls engineer journey): zoom, pan and tilt from WP.macro.orbit, with no floor, so a
           user can swing under the membrane (cytosol side) or along it (side view). Chips fly to loop D seen from
           the cytosol side, down the cut pore, to the lipid bilayer beside the channel, and under the membrane. */
        focus: [
          { id: 'gate', label: 'The gate (loop D)', dist: 6, theta: PHI_C, phi: 2.05, target: function () { return { obj: HM.one.lid, pos: new HM.ctx.THREE.Vector3(0, 0, 0) }; } },
          { id: 'pore', label: 'The pore', dist: 6.2, theta: PHI_C, phi: 1.5, target: function () { return { obj: HM.one.g, pos: new HM.ctx.THREE.Vector3(0, 0.4, 0) }; } },
          { id: 'bil', label: 'Lipid bilayer', dist: 12, theta: PHI_C + 0.3, phi: 1.5, target: function () { return { obj: HM.ctx.root, pos: new HM.ctx.THREE.Vector3(3.8, 0, 1.2) }; } },
          { id: 'below', label: 'From below (cytosol)', dist: 13, theta: PHI_C, phi: 2.7, target: function () { return { obj: HM.ctx.root, pos: new HM.ctx.THREE.Vector3(0, -1.5, 0) }; } }
        ]
      });
      if (!HM.ctx.fallback) {
        var stg = HM.ctx.wrap.querySelector('.mh-stage'), ov = document.createElement('div');
        ov.className = 'm5-gov'; ov.setAttribute('aria-hidden', 'true');
        ov.innerHTML = '<svg class="m5-gld"><path fill="none"/><circle r="3.6"/><path fill="none" data-p="ser"/><circle r="3.2" data-p="ser"/></svg><span class="mh-tag m5-gtag">loop D, the gate</span><span class="mh-tag m5-gtag m5-ptag">phosphates on Ser115 and Ser274</span><span class="mh-tag m5-gword">OPEN</span>';
        stg.appendChild(ov);
        HM.gov = { root: ov, path: ov.querySelector('path'), dot: ov.querySelector('circle'), tag: ov.querySelector('.m5-gtag'), word: ov.querySelector('.m5-gword'), shut: null,
          ptag: ov.querySelector('.m5-ptag'), ppath: ov.querySelector('path[data-p]'), pdot: ov.querySelector('circle[data-p]') };
      }
      mheroLive(); HM.ctx.invalidate();
    });
  }
  function mheroUpd(st, res, tg) {
    HM.tg = tg; HM.res = res;
    if (HM.ctx) { mheroLive(); HM.ctx.invalidate(); }
  }

  WP._m5 = { GS: GS, anim: anim, HM: HM, refs: refs }; // read only test hook
  WP.levels.push({ id: 'membrane', n: 5, title: 'The Membrane', subtitle: 'the aquaporin gate', scale: '10 nm', mount: mount, update: update, unmount: unmount });
})();

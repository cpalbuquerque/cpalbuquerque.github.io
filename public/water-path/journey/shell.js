/* The Water Path v8: shell.js (shell owner)
   Exhibit frame, tabs, hash routing, dive transitions, scale bar, conditions strip,
   readout rail, footer, preferences, and the shared UI helpers under WP.ui.
   Loads after engine.js and before the level files. */
(function () {
  'use strict';
  var WP = window.WP = window.WP || {};
  WP.levels = WP.levels || [];
  var MINUS = '−';

  /* ------------------------------------------------------------ SPEC subset
     Generated from /home/claude/v8/build/SPEC.json (cur.stops, plus a curated
     source registry built only from DOIs present in sci.rows and con.conflicts). */
  WP.SPEC = {
 "stops": {
  "1a": {
   "id": "1a",
   "level": "1 Field",
   "title": "Demand: the sky pulls",
   "objective": "Calculate VPD from air temperature and RH, and predict how transpiration changes between a calm morning and a dry afternoon at the same stomatal conductance.",
   "misconception": "Wet soil protects the plant from a dry afternoon. In fact soil water sets the supply end of the path and the air sets the pull, and it is the air that changes most between 9 am and 3 pm: the drier and hotter the air, the harder the pull.",
   "question": "In a Salinas romaine bed at 9 am the air is 15 °C and 90 % RH. At 3 pm it is 24 °C and 45 % RH. Stomatal conductance is the same at both times and leaf temperature equals air temperature (all values illustrative). Roughly how many times faster is the plant losing water at 3 pm, and why would irrigating at noon not change that ratio?",
   "answer": "Saturation vapour pressure from the Tetens equation (FAO 56, Eq. 11): es(15 °C) ≈ 1.71 kPa, so VPD ≈ 0.17 kPa. es(24 °C) ≈ 2.98 kPa, so VPD ≈ 1.64 kPa. E = gs × VPD ÷ Patm, so at equal gs transpiration rises about tenfold (≈ 9.6). Irrigation raises soil water potential, which sets the supply end. The air sets the demand end, so the ratio stays the same. Wet soil only lets the plant meet that demand without its leaf water potential falling as far. (Inputs ILLUSTRATIVE; outputs DERIVED.)",
   "dois": []
  },
  "1b": {
   "id": "1b",
   "level": "1 Field",
   "title": "A season in one field",
   "objective": "Use daily ETo and a crop coefficient to estimate how long a soil water reserve lasts, and explain why actual water use falls below the potential rate before the reserve runs out.",
   "misconception": "A crop uses water at the full rate until the soil is empty, then stops. In fact transpiration falls off gradually. As soil water potential and root and soil conductance drop, midday leaf water potential becomes more negative and the stomata close earlier each afternoon.",
   "question": "A romaine bed holds 50 mm of plant available water. ETo is 4 mm per day and the crop coefficient is 1.0 (illustrative). Someone predicts \"12.5 days at full rate, then it stops.\" What is wrong with the shape of that prediction, and what would you expect to see at 3 pm on day 8?",
   "answer": "The arithmetic is fine but the shape is wrong. Uptake is not a full tank that drains at one rate and then empties. As the soil dries, supply conductance falls, so on high demand afternoons leaf water potential becomes more negative and the stomata partly close. Actual ET falls below ETo × Kc well before day 12.5, more on hot, dry afternoons than on calm ones. At 3 pm on day 8 expect partial stomatal closure and possible midday wilting while water is still in the profile, with recovery overnight. (All numbers ILLUSTRATIVE.)",
   "dois": []
  },
  "2a": {
   "id": "2a",
   "level": "2 Plant",
   "title": "The plant as a circuit: the water potential staircase and the series argument",
   "objective": "Predict which water potentials change when one resistance in the soil to leaf series changes at a fixed transpiration rate, and justify the prediction with E = ΔΨ ÷ R.",
   "misconception": "Double the leaf's resistance and the whole column gets more tense. In fact, at a fixed transpiration rate, only the water potentials downstream of the change move. A related idea is that more resistance raises the flow. In fact ΔΨ is the voltage and the flow is the current, so more resistance at the same pull means less flow (flow = ΔΨ ÷ R).",
   "question": "Soil water potential is 0 MPa and E is held at 5 mmol m−2 s−1. Four resistances sit in series: root 100, stem 100, leaf xylem 50 and leaf outside xylem 50 MPa m2 s mol−1. Work out the water potential at the root to stem junction, at the petiole base, in the leaf xylem and at the end of the outside xylem path. Then double the outside xylem resistance to 100 and say which values change. Finally, say what changes once the stomata are allowed to respond.",
   "answer": "Each point is the point upstream minus E × R, with E = 0.005 mol m−2 s−1. Root to stem junction: 0 − (0.005 × 100) = −0.50 MPa. Petiole base: −0.50 − (0.005 × 100) = −1.00 MPa. Leaf xylem: −1.00 − (0.005 × 50) = −1.25 MPa. End of the outside xylem path: −1.25 − (0.005 × 50) = −1.50 MPa. After doubling: −1.25 − (0.005 × 100) = −1.75 MPa, and every value upstream (root, stem, leaf xylem) is unchanged. Only water potential downstream of a resistance change moves, and only at a given transpiration rate. Once the more negative leaf water potential closes the stomata, E falls and every water potential in the plant becomes less negative. Values and units from Fig. 2 of Scoffoni, Albuquerque, Buckley and Sack 2023, New Phytologist 239: 2099 to 2107, doi 10.1111/nph.19069 (scenario C).",
   "dois": [
    "10.1111/nph.19069"
   ]
  },
  "3a": {
   "id": "3a",
   "level": "3 Organ",
   "title": "The root's gate: endodermis and Casparian strip",
   "objective": "Trace water from soil to root xylem along the wall route and the cell route, and identify where the Casparian strip forces it across a membrane.",
   "misconception": "The Casparian strip is a suberin wall that stops water. In fact the strip is mostly lignin: in Arabidopsis it is a lignin polymer made without suberin, and suberin lamellae are laid down later as a separate layer (Naseer et al. 2012, PNAS 109: 10101, doi 10.1073/pnas.1205726109). And the strip blocks the wall route, so water must cross a membrane there. It does not stop water.",
   "question": "A flooded root's cortical and endodermal aquaporins close. The wall route through the cortex is still wide open. Why does root conductance still fall sharply, and where exactly is the bottleneck?",
   "answer": "At the endodermis the Casparian strip blocks the wall route, so every water molecule entering the stele must cross at least one plasma membrane there. With the aquaporins closed, that membrane passes water only at the slow lipid background rate. The endodermis becomes the controlling resistance, and the open cortical wall route cannot bypass it, because the cortex and the endodermis are in series. Could the bundle sheath play the same role in the leaf? That is a hypothesis under test (stop 4b).",
   "dois": [
    "10.1073/pnas.1205726109"
   ]
  },
  "3b": {
   "id": "3b",
   "level": "3 Organ",
   "title": "Stomata close before the pipes break",
   "objective": "Place grapevine stomatal half closure and organ P50 values on one water potential axis, name the parameter, organ and method behind each number, and explain why their order protects the vine.",
   "misconception": "A stomatal threshold and a P50 are the same kind of number, so they should agree, or be averaged. In fact stomatal half closure, embolism onset, air entry and P50 are different quantities, measured on different tissues by different methods, and a number for one cannot stand in for another. A related idea: afternoon loss of transport is embolism. In fact, in a well watered leaf, most of the afternoon loss of conductance is outside the xylem (stop 4b).",
   "question": "In grapevine, stomatal conductance is half closed at a leaf water potential of −0.60 MPa (Albuquerque et al. 2020). Petiole P50 is −1.54 MPa and stem P50 is −1.90 MPa, both as xylem pressure (Hochberg, Albuquerque et al. 2016, MRI). Someone averages the three into one \"grapevine threshold.\" Explain what each number measures, and what is happening in the vine between −0.60 and −1.54 MPa.",
   "answer": "−0.60 MPa is the leaf water potential at which living guard cells have cut stomatal conductance to half its maximum. The P50 values are xylem pressures at which half the conductive xylem area of the petiole, or of the stem, was gas filled in MRI images. Different parameters, different organs, different methods: averaging them is meaningless. Between −0.60 and −1.54 MPa the stomata keep closing (gs was down 80 % by about −1.2 MPa), which limits transpiration and therefore tension, while the petiole and stem xylem are still mostly conducting. That gap is the safety margin. The numbers come from different studies, cultivars and methods (gs from Cabernet Sauvignon and Chardonnay, P50 by MRI), so the margin is a comparison across studies, not one experiment. With microCT, Charrier et al. 2016 put Cabernet Sauvignon petiole P50 near −1.0 MPa (doi 10.1104/pp.16.01079), so does the order hold in every cultivar and with every method? That is still a question. In dehydrating grapevine, complete stomatal closure preceded the appearance of embolism in leaves and stem by several days (Hochberg et al. 2017, Plant Physiology 174: 764, doi 10.1104/pp.16.01816). Sources: doi 10.1093/jxb/eraa392 and doi 10.1111/pce.12688.",
   "dois": [
    "10.1104/pp.16.01079",
    "10.1104/pp.16.01816",
    "10.1093/jxb/eraa392",
    "10.1111/pce.12688"
   ]
  },
  "3c": {
   "id": "3c",
   "level": "3 Organ",
   "title": "Do leaves break first? Vulnerability segmentation as an open question",
   "objective": "Evaluate the vulnerability segmentation hypothesis using two studies that disagree, and name the measurement that would make them comparable.",
   "misconception": "\"The petiole is a hydraulic fuse that blows to protect the stem,\" and \"segmentation is a general rule.\" In fact, Hochberg et al. 2016 reject the fuse reading in grapevine, because the stomata have closed at water potentials well before petiole embolism begins, and whether segmentation is general is still an open question.",
   "question": "Grapevine petioles reached P50 at a less negative pressure than stems in two imaging studies: Hochberg et al. 2016 (MRI; petiole −1.54, stem −1.90 MPa) and Charrier et al. 2016 (microCT on intact Cabernet Sauvignon; petiole about −1.0, stem about −1.7 MPa). Across 12 Australian tree species, Peters and Choat (2025) found no support for vulnerability segmentation: it was absent or negative in all 12. Does one study refute the other? Name one methodological difference you would remove before comparing them, and say why segmentation and \"fuse\" are not the same claim.",
   "answer": "Neither refutes the other. Two grapevine imaging studies find segmentation; twelve Australian trees do not. Is grapevine typical, or one of a few species where leaves are built to fail first? That is the open question. Before comparing, check how each organ was measured in each study: MRI and microCT score gas filled conduits in intact plants, while other methods measure lost flow in cut segments, and long grapevine vessels are prone to cutting artefacts (Choat et al. 2010, doi 10.1111/j.1365-3040.2010.02160.x). Measuring both organs of the same plants with the same method removes that mismatch. Segmentation only describes the order of P50 values. A fuse is a claim about function: that leaf embolism relieves tension before the stem is at risk. In grapevine the stomata have closed long before the petiole embolises (Hochberg et al. 2017), so the fuse function is not supported even where segmentation is seen. Sources: doi 10.1111/pce.12688, doi 10.1104/pp.16.01079, doi 10.1111/pce.15249 (Plant Cell and Environment 48: 2162 to 2177).",
   "dois": [
    "10.1111/pce.12688",
    "10.1104/pp.16.01079",
    "10.1111/pce.15249",
    "10.1111/j.1365-3040.2010.02160.x"
   ]
  },
  "4a": {
   "id": "4a",
   "level": "4 Tissue",
   "title": "Four routes past the vein",
   "objective": "Name and trace the four parallel routes from vein xylem to stoma (apoplastic, symplastic, transmembrane, vapour phase), identify which one the cell can shut and which one is not liquid, and say where the water turns into vapour.",
   "misconception": "Water evaporates at the stomatal pore. In fact it evaporates from wet cell walls lining the air spaces inside the leaf, and the vapour leaves through the pore. A second idea: evaporation releases energy. In fact evaporation absorbs latent heat, so it cools the leaf. A third idea: in leaf models the \"symplastic\" route means plasmodesmata. In fact in Buckley's model it is the transmembrane route; plasmodesmata are not resolved.",
   "question": "Models of the leaf beyond the bundle sheath put most of the flow through cell walls, little across membranes, and part as vapour (Buckley 2015). How much moves as vapour depends on temperature: with a 0.2 K gradient across the leaf, vapour could carry up to 44 % of vertical water transport in that model. (i) If the walls carry most of the water, how could aquaporins still control K-leaf? (ii) Where does the water turn into vapour, and does that step warm or cool the leaf?",
   "answer": "(i) The routes run in parallel beyond the bundle sheath. If the sheath forces water across membranes, as lignified sheath walls would (6 of 11 tree species in Ohtsuka et al. 2018) or as the band modelled in grapevine would (Albuquerque et al. 2020), that membrane step is in series with everything downstream. It could then limit total flow even though most water moves through walls once past it. Is the sheath the leaf's control point? That is being tested: another model puts the sheath at a minority of outside xylem resistance, with vapour up to two thirds of outside xylem conductance (Buckley et al. 2015, Plant Physiology). These shares are model outputs, not measurements, and they depend on poorly known wall properties. (ii) Water evaporates from wet cell walls lining the air spaces: the inner epidermis near the stomata, the mesophyll, even the bundle sheath. Where most of it evaporates shifts with light and humidity and is still debated: one model puts most evaporation at the epidermis at low light, and the sheath supplies 15 % in darkness and 18 % in high light (Buckley et al. 2017). Vapour then diffuses out through the stoma. Evaporation absorbs latent heat, so it cools the leaf. Sources: doi 10.1111/pce.12372, doi 10.1104/pp.15.00731, doi 10.1104/pp.16.01605.",
   "dois": [
    "10.1111/pce.12372",
    "10.1104/pp.15.00731",
    "10.1104/pp.16.01605",
    "10.1111/pce.13087",
    "10.1093/jxb/eraa392"
   ]
  },
  "4b": {
   "id": "4b",
   "level": "4 Tissue",
   "title": "Is the bundle sheath the leaf's endodermis? Loss before breakage",
   "objective": "Explain why most of the decline in K-leaf during drying happens before veins embolise, and locate a candidate control point at the bundle sheath.",
   "misconception": "When a leaf loses hydraulic conductance, its veins have embolised. In fact, across eight species, tissues outside the xylem explained 75 to 100 % of the decline as leaves dried (Scoffoni et al. 2017). A second idea: most of a leaf's resistance is in its veins. In fact a large share can sit outside the xylem; how large, and in which species, is still measured leaf by leaf.",
   "question": "A Cabernet Sauvignon leaf is green and flat at −1.2 MPa, and microCT shows no embolised minor veins, yet its K-leaf is a small fraction of its maximum. Where has the conductance gone? Why would a species with lignified bundle sheath walls depend even more on that tissue?",
   "answer": "The conductance has been lost outside the xylem (K-ox). In Cabernet Sauvignon and Chardonnay, K-leaf fell 80 % by −0.71 and −0.67 MPa, while leaf xylem embolism began only around −1.25 MPa in the midribs and little to none was seen in minor veins (Albuquerque et al. 2020, doi 10.1093/jxb/eraa392). Across eight species, outside xylem vulnerability explained 75 to 100 % of K-leaf decline (Scoffoni et al. 2017, doi 10.1104/pp.16.01643). Three candidate causes are being tested: cells shrink and lose contact as the leaf dries (Scoffoni et al. 2014, doi 10.1104/pp.113.221424); aquaporins are deactivated, including by ABA arriving in the xylem, which lowered bundle sheath Pf (Shatil-Cohen et al. 2011, doi 10.1111/j.1365-313x.2011.04576.x; Yaaran et al. 2023, doi 10.1093/plphys/kiad372); and, in grapevine, a model points to a low permeability band in the bundle sheath that works like a Casparian strip (Albuquerque et al. 2020). Lignified sheath walls block the wall route, so water must cross a membrane there; across 11 angiosperm tree species, those with lignified minor vein sheaths had lower xylem and outside xylem conductance and lower K-leaf (Ohtsuka et al. 2018, doi 10.1111/pce.13087). Caveat: in that study the light response of K-leaf was independent of lignification. A contrasting view: optical imaging in four species found vein embolism tracking K-leaf decline (Brodribb et al. 2016, doi 10.1111/nph.13846). Which holds in a given species is an open question.",
   "dois": [
    "10.1093/jxb/eraa392",
    "10.1104/pp.16.01643",
    "10.1104/pp.113.221424",
    "10.1111/j.1365-313x.2011.04576.x",
    "10.1093/plphys/kiad372",
    "10.1111/pce.13087",
    "10.1111/nph.13846"
   ]
  },
  "4c": {
   "id": "4c",
   "level": "4 Tissue",
   "title": "How a conduit fails: air through the pit, or a wall that buckles",
   "objective": "Distinguish air seeding through a pit membrane from wall collapse, and state which conduit state each one requires.",
   "misconception": "Cavitation is the water boiling. In fact no heat is involved: air is pulled into a conduit under tension through a pore in the pit membrane, from a neighbouring gas filled conduit (air seeding). A second idea: a bubble trapped in a wall defect expands. In fact the air that matters enters through the pit membrane. A third idea: a conduit is a rigid pipe of fixed diameter. In fact a thin walled conduit under strong tension can be pulled inward; how often this happens in intact plants is under study.",
   "question": "Two neighbouring conduits: A is gas filled, and B is water filled under strong tension. (i) By what route does B become embolised, and what sets the tension at which that happens? (ii) Could A collapse? Could B? (iii) In a conifer, where the conduits are tracheids, what does the torus do at step (i)?",
   "answer": "(i) Air is pulled from A into B through the largest pore of the pit membrane between them. This is air seeding. It happens when the pressure difference exceeds what the meniscus in that pore can hold, so the largest pore sets the threshold. It is not boiling and not heat. (ii) A cannot collapse: once air has diffused in it sits near atmospheric pressure, with no tension pulling its walls inward. B could, if its wall is thin relative to its lumen. How often does this happen in intact plants, and what does it do to flow? Those are questions under study, with no numbers on this page. (iii) The pressure difference pushes the pit membrane toward B, and the torus, a thickened central plug, seals the pit aperture on B's side and keeps A's air out. This is pit aspiration. The margo is the porous mesh around the torus.",
   "dois": []
  },
  "4d": {
   "id": "4d",
   "level": "4 Tissue",
   "title": "Turgor, the pressure volume curve and the turgor loss point",
   "objective": "Use Ψw = Ψs + Ψp to locate the turgor loss point on a pressure volume curve, and predict how wall stiffness and osmotic adjustment move it.",
   "misconception": "In the xylem Ψw = −Ψp. In fact the equation is the same everywhere, Ψw = Ψs + Ψp; in a conduit Ψs is close to zero and Ψp is negative (tension). A second idea: the turgor loss point predicts when embolism starts. In fact the turgor loss point belongs to living cells and embolism to dead conduits; across species the two are correlated, but their order varies. A third idea links the turgor loss point to salt. In fact it links to drought tolerance through osmotic adjustment.",
   "question": "Two leaf cells both lose 5 % of their water (illustrative). One has stiff walls and one has elastic walls. Which loses more turgor? Then one cell accumulates solutes over a week of drought. What happens to its turgor loss point, and does that tell you when its xylem will embolise?",
   "answer": "The stiff walled cell loses more turgor for the same water loss, because it has a higher elastic modulus. Accumulating solutes makes Ψs more negative, so Ψp stays positive down to a more negative Ψw: the turgor loss point moves more negative. That is osmotic adjustment, and in grapevine the turgor loss point falls through the season (Herrera et al. 2022, doi 10.1111/tpj.15591). It does not tell you when the xylem embolises. The turgor loss point is a property of living cells, while embolism is a property of dead conduits and their pit membranes. Across 262 angiosperm and 48 gymnosperm species, leaves on average lost turgor before stems lost half their conductivity, but the order varies with species (Bartlett et al. 2016, doi 10.1073/pnas.1604088113), so one does not tell you when the other happens in a given plant. At night, when transpiration stops and Ψp recovers, cells can expand, which is the growth stop's point.",
   "dois": [
    "10.1111/tpj.15591",
    "10.1073/pnas.1604088113"
   ]
  },
  "5a": {
   "id": "5a",
   "level": "5 Membrane",
   "title": "The aquaporin gate",
   "objective": "Describe one PIP aquaporin pore and its gate, loop D, and predict how phosphorylation, cytosolic pH and Ca2+ change how much of the time the gate is open, and so the membrane water permeability (Pf). Expert depth: a PIP is a tetramer of four such pores.",
   "misconception": "Aquaporins carry only water. In fact water moves fastest and protons are blocked, but some PIP isoforms also carry other small molecules: Arabidopsis PIP2;1 lets H2O2 into guard cells (Rodrigues et al. 2017, PNAS 114: 9200, doi 10.1073/pnas.1704754114). A second idea: a closed aquaporin makes the membrane watertight. In fact the lipid bilayer still passes water slowly.",
   "question": "A root is flooded. Its cells run short of oxygen and the cytosol acidifies. Using the structure of spinach SoPIP2;1, explain what happens to the channel, to root conductance and to the shoot, even though the soil is saturated.",
   "answer": "Low cytosolic pH protonates a conserved histidine on loop D (His193, SoPIP2;1 numbering). Loop D then caps the pore from the cytosolic side (each of the four monomers of a PIP has its own pore and its own loop D), and Pf falls toward the lipid background (Törnroth-Horsefield et al. 2006, Nature 439: 688 to 694, doi 10.1038/nature04316). At the endodermis, where the Casparian strip forces water across a membrane, root conductance drops. Leaf water potential becomes more negative and the plant can wilt in waterlogged soil. Phosphorylation of two conserved serines (Ser115 in loop B and Ser274 at the C terminus, SoPIP2;1) is thought to open the gate; dephosphorylation and raised Ca2+, which binds at an N terminal site that includes Glu31, favour closure (Nyblom et al. 2009, doi 10.1016/j.jmb.2009.01.065).",
   "dois": [
    "10.1073/pnas.1704754114",
    "10.1038/nature04316",
    "10.1016/j.jmb.2009.01.065"
   ]
  },
  "5b": {
   "id": "5b",
   "level": "5 Membrane",
   "title": "One step: an acid cytosol closes the gate",
   "objective": "Predict the direction of change in Pf, K-leaf, leaf water potential and stomatal conductance when the cytosol acidifies, and say which link in the chain is the gate.",
   "misconception": "Closing aquaporins in one leaf tissue cannot reach the stomata. In fact the bundle sheath sits in series with the path to the stomata, so a lower Pf there makes the leaf water potential downstream more negative.",
   "question": "Acid cytosol closes the gate. Which way do Pf, K-leaf, leaf water potential and stomatal conductance move? Commit to four arrows, then set cytosolic pH to 6.2 on this plate and check.",
   "answer": "Pf falls toward the lipid background, so R-ox rises and K-leaf falls. At the same transpiration rate the leaf water potential becomes more negative, and the stomata close further, which then lowers transpiration and gives back part of the drop. In the model this is the chain Pf → R-ox → K-leaf → leaf Ψ → gs (constants ILLUSTRATIVE). The structure behind the first step is the loop D cap of spinach SoPIP2;1 (Törnroth-Horsefield et al. 2006, doi 10.1038/nature04316).",
   "dois": [
    "10.1038/nature04316"
   ],
   "tier": 2
  },
  "5c": {
   "id": "5c",
   "level": "5 Membrane",
   "title": "Light and the valve: what is shown, what is open",
   "objective": "State what is shown about light and K-leaf (a rise in many species, not all; not yet tested in almond), then put the proposed Arabidopsis chain in order (phototropins, bundle sheath H+ ATPase, sap acidification, higher bundle sheath Pf, higher K-leaf) and name its open last step.",
   "misconception": "Light acts on leaves only through photosynthesis. In fact blue light also acts on the bundle sheath, through a proton pump. A second idea: light always raises K-leaf. In fact species differ: in Arabidopsis, rosette hydraulic conductivity was higher in darkness than in the day, through phosphorylation of PIP2;1 in the veins (Prado et al. 2013, Plant Cell 25: 1029, doi 10.1105/tpc.112.108456).",
   "question": "Low cytosolic pH closes PIP aquaporins, yet acidifying the xylem sap raises K-leaf. Propose a resolution of the apparent paradox. Then predict K-leaf under blue light if the xylem sap is buffered at pH 7.5.",
   "answer": "The bundle sheath H+ ATPase (AHA2) pumps protons from the cytosol out into the apoplast, so the sap acidifies while the cytosol does not; under blue light the bundle sheath cytosolic pH actually rose (Grunwald et al. 2022, Plant Cell 34: 2328, doi 10.1093/plcell/koac089). A gate that closes at low cytosolic pH can therefore open while the sap acidifies. Exactly how sap pH reaches the channel is still an open question: is it cytosolic pH, membrane voltage, or an effect of apoplastic pH itself? Buffering the sap at pH 7.5 lowered K-leaf, and raising external pH to 7.5 lowered the Pf of isolated bundle sheath protoplasts (Grunwald et al. 2021, Plant Journal 106: 301, doi 10.1111/tpj.15235). So blue light should fail to raise K-leaf when the sap is clamped there; this is a prediction, not a measured result. Without blue light, walnut K-leaf was about 60 % lower (Ben Baaziz et al. 2012, Tree Physiology 32: 423, doi 10.1093/treephys/tps022).",
   "dois": [
    "10.1105/tpc.112.108456",
    "10.1093/plcell/koac089",
    "10.1111/tpj.15235",
    "10.1093/treephys/tps022"
   ],
   "tier": 3
  },
  "5d": {
   "id": "5d",
   "level": "5 Membrane",
   "title": "From Pf to the stomata: one gene, one surprise",
   "objective": "Trace how a change in bundle sheath Pf works through R-ox, K-leaf and leaf water potential to stomatal conductance, and use the grapevine PIP2;1 knockout to test that chain.",
   "misconception": "Removing the leaf's main aquaporin must lower K-leaf, or one aquaporin has one job. In fact, in the grapevine PIP2;1 knockout, the K-leaf vulnerability curve matched the wild type (preprint), and the clearest change was at the stomata.",
   "question": "Using the chain Pf, then R-ox, then K-leaf, then leaf water potential, then stomata, predict what a PIP2;1 knockout should do in a grapevine leaf. The lab's preprint instead found K-leaf vulnerability unchanged, with the knockouts keeping their stomata open longer under moderate drought. Give two explanations consistent with both results, and say what a wheat study implies about how much K-leaf decline can drive stomatal closure at all.",
   "answer": "The naive prediction is: lower Pf, higher R-ox, lower K-leaf, more negative leaf water potential, earlier stomatal closure. The observation contradicts it. Explanation 1: the remaining capacity is enough. Other PIP isoforms already in the membrane, or the walls, carry the bundle sheath flow, so R-ox does not change; this is not compensation by upregulation, because no other aquaporin rose in the knockouts. Explanation 2: PIP2;1 acts on the stomata directly. In Arabidopsis guard cells PIP2;1 is needed for ABA driven closure and lets H2O2 in (Rodrigues et al. 2017, doi 10.1073/pnas.1704754114); whether the grapevine protein does the same is untested. Explanation 3: PIP1 and PIP2 proteins assemble together into mixed tetramers (Fetter et al. 2004, doi 10.1105/tpc.017194), so did losing PIP2;1 change how the other PIPs work? Either way, the wild type closes sooner and keeps its leaf less negative. Because the knockout keeps its stomata open longer, its leaf reaches a more negative Ψ, so its K-leaf reading is lower at the same moment on the same curve; that last step is a model prediction, not a preprint result. The amplifier idea is contested: in wheat, declining K-leaf explained at most 9.1 % of stomatal closure (Corso et al. 2020, Plant Cell and Environment 43: 854, doi 10.1111/pce.13722). In this explorable the knockout is enabled for grapevine only; it leaves Pf and the K-leaf vulnerability curve unchanged and shifts stomatal half closure (ILLUSTRATIVE size). Source: Albuquerque et al. 2026, bioRxiv preprint, not peer reviewed, doi 10.64898/2026.01.29.702672.",
   "dois": [
    "10.1073/pnas.1704754114",
    "10.1105/tpc.017194",
    "10.1111/pce.13722",
    "10.64898/2026.01.29.702672"
   ],
   "tier": 3
  },
  "6": {
   "id": "6",
   "level": "Closing",
   "title": "Your Salinas afternoon",
   "objective": "Run a VPD, wind and soil drying scenario and explain, from published evidence, why the enclosed inner leaves of a romaine head transpire less, and so receive less calcium in the xylem stream, than the outer leaves.",
   "misconception": "If the soil is wet, every leaf gets the same water and the same delivery. In fact delivery through the xylem follows transpiration, and enclosed inner leaves transpire little. A second idea: tipburn means the soil is short of calcium. In fact, in a Salinas Valley survey of commercial romaine fields, tipburn was unrelated to soil calcium or leaf calcium, and was worst where daytime marine fog cut transpiration in the final two weeks before harvest (Hartz et al. 2007, HortScience 42: 1681, doi 10.21273/hortsci.42.7.1681).",
   "question": "On a warm afternoon the outer leaves of a romaine head transpire hard, while the inner leaves, wrapped inside the head, transpire little. Calcium reaches leaves in the xylem stream. Using the explorable, which weather leaves the inner leaves with the least transpiration, and what did Barta and Tibbitts (1986) find when they enclosed young lettuce leaves?",
   "answer": "Still, humid or foggy air keeps inner leaf transpiration lowest; moving air into the head raises it. Calcium travels with the xylem stream, so low transpiration means low calcium delivery. Barta and Tibbitts (1986, J. Amer. Soc. Hort. Sci. 111: 413, doi 10.21273/JASHS.111.3.413) enclosed young lettuce leaves to cut their transpiration: their calcium fell and tipburn rose. In a Salinas Valley survey, tipburn was worst where daytime fog cut transpiration in the final two weeks before harvest (Hartz et al. 2007, HortScience 42: 1681).",
   "dois": [
    "10.21273/hortsci.42.7.1681",
    "10.21273/JASHS.111.3.413"
   ]
  }
 },
 "sources": {
  "10.1093/treephys/tps022": {
   "label": "Ben Baaziz et al. 2012, Tree Physiology 32: 423 to 434",
   "status": "VERIFIED"
  },
  "10.1111/nph.19069": {
   "label": "Scoffoni, Albuquerque, Buckley & Sack 2023, New Phytologist 239: 2099",
   "status": "VERIFIED"
  },
  "10.1073/pnas.1205726109": {
   "label": "Naseer et al. 2012, PNAS 109: 10101",
   "status": "VERIFIED"
  },
  "10.1104/pp.16.01079": {
   "label": "Charrier et al. 2016, Plant Physiology 172: 1657",
   "status": "VERIFIED"
  },
  "10.1104/pp.16.01816": {
   "label": "Hochberg et al. 2017, Plant Physiology 174: 764",
   "status": "VERIFIED"
  },
  "10.1093/jxb/eraa392": {
   "label": "Albuquerque et al. 2020, Journal of Experimental Botany 71: 7286",
   "status": "VERIFIED"
  },
  "10.1111/pce.12688": {
   "label": "Hochberg, Albuquerque et al. 2016, Plant, Cell and Environment 39: 1886",
   "status": "VERIFIED"
  },
  "10.1111/pce.15249": {
   "label": "Peters & Choat 2025, Plant, Cell and Environment 48: 2162",
   "status": "VERIFIED"
  },
  "10.1111/pce.12372": {
   "label": "Buckley 2015, Plant, Cell and Environment 38: 7",
   "status": "VERIFIED"
  },
  "10.1111/pce.13087": {
   "label": "Ohtsuka, Sack & Taneda 2018, Plant, Cell and Environment 41: 342",
   "status": "VERIFIED"
  },
  "10.1073/pnas.1704754114": {
   "label": "Rodrigues et al. 2017, PNAS 114: 9200",
   "status": "VERIFIED"
  },
  "10.1038/nature04316": {
   "label": "Törnroth-Horsefield et al. 2006, Nature 439: 688",
   "status": "VERIFIED"
  },
  "10.1105/tpc.112.108456": {
   "label": "Prado et al. 2013, Plant Cell 25: 1029",
   "status": "VERIFIED"
  },
  "10.1105/tpc.18.00804": {
   "label": "Prado et al. 2019, Plant Cell 31: 417",
   "status": "VERIFIED"
  },
  "10.1093/plcell/koac089": {
   "label": "Grunwald et al. 2022, Plant Cell 34: 2328",
   "status": "VERIFIED"
  },
  "10.1111/tpj.15235": {
   "label": "Grunwald et al. 2021, Plant Journal 106: 301",
   "status": "VERIFIED"
  },
  "10.1111/pce.13722": {
   "label": "Corso et al. 2020, Plant, Cell and Environment 43: 854",
   "status": "VERIFIED"
  },
  "10.64898/2026.01.29.702672": {
   "label": "Albuquerque, Momayyezi, Agüero et al. 2026, bioRxiv (not peer reviewed)",
   "status": "PREPRINT"
  },
  "10.21273/hortsci.42.7.1681": {
   "label": "Hartz et al. 2007, HortScience 42: 1681",
   "status": "VERIFIED"
  },
  "10.21273/JASHS.111.3.413": {
   "label": "Barta & Tibbitts 1986, Journal of the American Society for Horticultural Science 111: 413",
   "status": "VERIFIED"
  },
  "10.1093/jxb/ers165": {
   "label": "Maes & Steppe 2012, Journal of Experimental Botany 63: 4671",
   "status": "VERIFIED"
  },
  "10.1175/1520-0450(1967)006<0203:otcosv>2.0.co;2": {
   "label": "Murray 1967, Journal of Applied Meteorology 6: 203 (Tetens form; coefficients as FAO 56 Eq. 11)",
   "status": "VERIFIED"
  },
  "10.3389/fpls.2022.974050": {
   "label": "Álvarez-Maldini et al. 2022, Frontiers in Plant Science 13: 974050",
   "status": "VERIFIED"
  },
  "10.1039/df9480300146": {
   "label": "van den Honert 1948, Discussions of the Faraday Society 3: 146",
   "status": "VERIFIED"
  },
  "10.1016/j.febslet.2013.02.038": {
   "label": "Frick et al. 2013, FEBS Letters 587: 989",
   "status": "VERIFIED"
  },
  "10.1042/bj20080275": {
   "label": "Verdoucq et al. 2008, Biochemical Journal 415: 409",
   "status": "VERIFIED"
  },
  "10.1104/pp.114.248633": {
   "label": "Sade et al. 2014, Plant Physiology 166: 1609",
   "status": "VERIFIED"
  },
  "10.1093/treephys/18.8-9.589": {
   "label": "Pammenter & Vander Willigen 1998, Tree Physiology 18: 589",
   "status": "VERIFIED"
  },
  "10.1111/j.1461-0248.2012.01751.x": {
   "label": "Bartlett, Scoffoni & Sack 2012, Ecology Letters 15: 393",
   "status": "VERIFIED"
  },
  "10.1038/nature01853": {
   "label": "Tournaire-Roux et al. 2003, Nature 425: 393",
   "status": "VERIFIED"
  },
  "10.1104/pp.103.028357": {
   "label": "Cochard et al. 2004, Plant Physiology 134: 401",
   "status": "VERIFIED"
  },
  "10.1104/pp.16.01191": {
   "label": "Zhang et al. 2016, Plant Physiology 172: 2261",
   "status": "VERIFIED"
  },
  "10.1104/pp.126.1.27": {
   "label": "Holbrook et al. 2001, Plant Physiology 126: 27",
   "status": "VERIFIED"
  },
  "10.1093/plphys/kiac034": {
   "label": "Song et al. 2022, Plant Physiology 189: 204",
   "status": "VERIFIED"
  },
  "10.1111/pce.13397": {
   "label": "Johnson et al. 2018, Plant, Cell and Environment 41: 2704",
   "status": "VERIFIED"
  },
  "10.1104/pp.110.162396": {
   "label": "Brodersen et al. 2010, Plant Physiology 154: 1088",
   "status": "VERIFIED"
  },
  "10.1071/FP09103": {
   "label": "Salleo et al. 2009, Functional Plant Biology 36: 815",
   "status": "VERIFIED"
  },
  "10.1111/j.1469-8137.2009.02847.x": {
   "label": "Choat & Pittermann 2009, New Phytologist 182: 557",
   "status": "VERIFIED"
  },
  "10.1093/aob/mcu109": {
   "label": "Tixier et al. 2014, Annals of Botany 114: 325",
   "status": "VERIFIED"
  },
  "10.1126/science.1120479": {
   "label": "Pittermann et al. 2005, Science",
   "status": "VERIFIED"
  },
  "10.1111/nph.13646": {
   "label": "Gleason et al. 2016, New Phytologist 209: 123",
   "status": "VERIFIED"
  },
  "10.1104/pp.16.00923": {
   "label": "Cuneo et al. 2016, Plant Physiology 172: 1669",
   "status": "VERIFIED"
  },
  "10.1152/physrev.00008.2015": {
   "label": "Maurel et al. 2015, Physiological Reviews 95: 1321",
   "status": "VERIFIED"
  },
  "10.1105/tpc.15.00421": {
   "label": "Grondin et al. 2015, Plant Cell 27: 1945",
   "status": "VERIFIED"
  },
  "10.1093/jxb/erag008": {
   "label": "Worthington & Lee 2026, Journal of Experimental Botany 77: 2177",
   "status": "VERIFIED"
  },
  "10.1073/pnas.1308412110": {
   "label": "Hosmani et al. 2013, PNAS 110: 14498 (has a correction notice)",
   "status": "VERIFIED"
  },
  "10.1104/pp.41.1.119": {
   "label": "Dimond 1966, Plant Physiology 41: 119",
   "status": "VERIFIED"
  },
  "10.21273/horttech.11.4.609": {
   "label": "Fulton et al. 2001, HortTechnology 11: 609",
   "status": "VERIFIED"
  },
  "10.21273/jashs.117.4.607": {
   "label": "McCutchan & Shackel 1992, Journal of the American Society for Horticultural Science 117: 607",
   "status": "VERIFIED"
  },
  "10.20870/oeno-one.2009.43.3.798": {
   "label": "van Leeuwen et al. 2009, OENO One 43: 121",
   "status": "VERIFIED"
  },
  "10.1104/pp.18.00743": {
   "label": "Scoffoni et al. 2018, Plant Physiology",
   "status": "VERIFIED"
  },
  "10.2134/agronj1962.00021962005400050005x": {
   "label": "Denmead & Shaw 1962, Agronomy Journal",
   "status": "VERIFIED"
  },
  "10.2134/agronj1973.00021962006500060014x": {
   "label": "Ritchie 1973, Agronomy Journal",
   "status": "VERIFIED"
  },
  "10.1111/j.1469-8137.2009.02776.x": {
   "label": "Christman, Sperry & Adler 2009, New Phytologist",
   "status": "VERIFIED"
  },
  "10.1104/pp.112.212712": {
   "label": "Brodersen et al. 2013, Plant Physiology",
   "status": "VERIFIED"
  },
  "10.1111/pce.15538": {
   "label": "Schell et al. 2025, Plant Cell and Environment",
   "status": "VERIFIED"
  },
  "10.1016/j.tplants.2017.11.002": {
   "label": "Hochberg et al. 2018, Trends in Plant Science",
   "status": "VERIFIED"
  },
  "10.1104/pp.16.01643": {
   "label": "Scoffoni et al. 2017, Plant Physiology",
   "status": "VERIFIED"
  },
  "10.1111/nph.13846": {
   "label": "Brodribb et al. 2016, New Phytologist",
   "status": "VERIFIED"
  },
  "10.1104/pp.103.023879": {
   "label": "Brodribb & Holbrook 2003, Plant Physiology",
   "status": "VERIFIED"
  },
  "10.1146/annurev.arplant.56.032604.144141": {
   "label": "Sack & Holbrook 2006, Annual Review of Plant Biology",
   "status": "VERIFIED"
  },
  "10.1111/j.1365-3040.2010.02160.x": {
   "label": "Choat et al. 2010, Plant Cell and Environment",
   "status": "VERIFIED"
  },
  "10.1111/nph.15395": {
   "label": "Duursma et al. 2019, New Phytologist",
   "status": "VERIFIED"
  },
  "10.1093/jxb/47.12.1813": {
   "label": "Kerstiens 1996, Journal of Experimental Botany",
   "status": "VERIFIED"
  },
  "10.1111/nph.71166": {
   "label": "Trueba et al. 2026, New Phytologist",
   "status": "VERIFIED"
  },
  "10.1111/nph.20346": {
   "label": "Garen & Michaletz 2024, New Phytologist",
   "status": "VERIFIED"
  },
  "10.1111/j.1365-3040.2008.01884.x": {
   "label": "Scoffoni et al. 2008, Plant Cell and Environment",
   "status": "VERIFIED"
  },
  "10.1104/pp.106.090092": {
   "label": "Cochard et al. 2007, Plant Physiology",
   "status": "VERIFIED"
  },
  "10.1111/nph.19497": {
   "label": "Grunwald, Yaaran & Moshelion 2024, New Phytologist",
   "status": "VERIFIED"
  },
  "10.1104/pp.15.00731": {
   "label": "Buckley et al. 2015, Plant Physiology",
   "status": "VERIFIED"
  },
  "10.1104/pp.16.01605": {
   "label": "Buckley et al. 2017, Plant Physiology",
   "status": "VERIFIED"
  },
  "10.1104/pp.113.221424": {
   "label": "Scoffoni et al. 2014, Plant Physiology",
   "status": "VERIFIED"
  },
  "10.1111/j.1365-313x.2011.04576.x": {
   "label": "Shatil-Cohen, Attia & Moshelion 2011, Plant Journal",
   "status": "VERIFIED"
  },
  "10.1093/plphys/kiad372": {
   "label": "Yaaran et al. 2023, Plant Physiology",
   "status": "VERIFIED"
  },
  "10.1093/plphys/kiae226": {
   "label": "Torne-Srivastava et al. 2024, Plant Physiology",
   "status": "VERIFIED"
  },
  "10.1111/ppl.12253": {
   "label": "Martorell et al. 2015, Physiologia Plantarum",
   "status": "VERIFIED"
  },
  "10.1111/tpj.15591": {
   "label": "Herrera et al. 2022, Plant Journal",
   "status": "VERIFIED"
  },
  "10.1073/pnas.1604088113": {
   "label": "Bartlett et al. 2016, PNAS",
   "status": "VERIFIED"
  },
  "10.1093/jxb/erx252": {
   "label": "Scoffoni & Sack 2017, Journal of Experimental Botany",
   "status": "VERIFIED"
  },
  "10.1038/nature11688": {
   "label": "Choat et al. 2012, Nature",
   "status": "VERIFIED"
  },
  "10.1104/pp.16.00136": {
   "label": "Knipfer et al. 2016, Plant Physiology",
   "status": "VERIFIED"
  },
  "10.1111/nph.17282": {
   "label": "Kaack et al. 2021, New Phytologist",
   "status": "VERIFIED"
  },
  "10.1104/pp.16.01039": {
   "label": "Schenk et al. 2017, Plant Physiology",
   "status": "VERIFIED"
  },
  "10.1104/pp.88.3.581": {
   "label": "Sperry & Tyree 1988, Plant Physiology",
   "status": "VERIFIED"
  },
  "10.1016/j.jmb.2009.01.065": {
   "label": "Nyblom et al. 2009, Journal of Molecular Biology",
   "status": "VERIFIED"
  },
  "10.1093/jxb/erj046": {
   "label": "Alleva et al. 2006, Journal of Experimental Botany",
   "status": "VERIFIED"
  },
  "10.1105/tpc.017194": {
   "label": "Fetter et al. 2004, Plant Cell",
   "status": "VERIFIED"
  },
  "10.1038/35036519": {
   "label": "Murata et al. 2000, Nature",
   "status": "VERIFIED"
  },
  "10.1093/jxb/erf069": {
   "label": "Sack et al. 2002, Journal of Experimental Botany",
   "status": "VERIFIED"
  },
  "10.3791/4179": {
   "label": "Sack & Scoffoni 2012, Journal of Visualized Experiments",
   "status": "VERIFIED"
  },
  "10.1093/jxb/ert193": {
   "label": "Cochard et al. 2013, Journal of Experimental Botany",
   "status": "VERIFIED"
  },
  "10.1104/pp.15.00732": {
   "label": "Choat et al. 2016, Plant Physiology",
   "status": "VERIFIED"
  },
  "10.1111/pce.12139": {
   "label": "Wheeler et al. 2013, Plant Cell and Environment",
   "status": "VERIFIED"
  },
  "10.1006/anbo.2000.1361": {
   "label": "Choné et al. 2001, Annals of Botany",
   "status": "VERIFIED"
  },
  "10.21273/hortsci.38.4.547": {
   "label": "Naor & Cohen 2003, HortScience",
   "status": "VERIFIED"
  },
  "10.1111/nph.70052": {
   "label": "Burlett et al. 2025, New Phytologist",
   "status": "VERIFIED"
  },
  "10.1126/science.1197985": {
   "label": "Brodribb & McAdam 2011, Science",
   "status": "VERIFIED"
  },
  "10.1104/pp.16.00380": {
   "label": "McAdam & Brodribb 2016, Plant Physiology",
   "status": "VERIFIED"
  },
  "10.1111/nph.15899": {
   "label": "Buckley 2019, New Phytologist",
   "status": "VERIFIED"
  },
  "10.1104/pp.60.6.854": {
   "label": "Palzkill & Tibbitts 1977, Plant Physiology",
   "status": "VERIFIED"
  },
  "10.21273/hortsci.45.11.1597": {
   "label": "Bryla, Trout & Ayars 2010, HortScience",
   "status": "VERIFIED"
  },
  "10.1093/treephys/tpz134": {
   "label": "Paudel et al. 2020, Tree Physiology",
   "status": "VERIFIED"
  },
  "10.1093/treephys/tpz092": {
   "label": "Pratt et al. 2020, Tree Physiology",
   "status": "VERIFIED"
  },
  "10.3732/ajb.95.3.299": {
   "label": "Willson, Manos & Jackson 2008, American Journal of Botany",
   "status": "VERIFIED"
  }
 }
};

  /* ------------------------------------------------------------ small helpers */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function num(x, d) {
    if (WP.fmt && WP.fmt.num) return WP.fmt.num(x, d);
    if (x == null || !isFinite(x)) return 'n/a';
    var s = Math.abs(x).toFixed(d == null ? 2 : d);
    return (x < 0 && Number(s) !== 0 ? MINUS : '') + s;
  }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function lsGet(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { if (v == null) window.localStorage.removeItem(k); else window.localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } }

  var ui = WP.ui = WP.ui || {};
  ui.esc = esc;
  ui.num = num;

  /* ------------------------------------------------------------ preferences */
  var root = document.documentElement;
  var mqDark = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  var mqReduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var prefListeners = [];
  var storedTheme = lsGet('wp8-theme');
  if (storedTheme === 'light' || storedTheme === 'dark') root.setAttribute('data-theme', storedTheme);
  var storedMotion = lsGet('wp8-motion');
  if (storedMotion === 'reduce' || storedMotion === 'full') root.setAttribute('data-motion', storedMotion);

  ui.isDark = function () {
    var t = root.getAttribute('data-theme');
    if (t === 'dark') return true;
    if (t === 'light') return false;
    return !!(mqDark && mqDark.matches);
  };
  ui.theme = function () { return ui.isDark() ? 'dark' : 'light'; };
  ui.reducedMotion = function () {
    var m = root.getAttribute('data-motion');
    if (m === 'reduce') return true;
    if (m === 'full') return false;
    return !!(mqReduce && mqReduce.matches);
  };
  WP.prefs = { get dark() { return ui.isDark(); }, get reduceMotion() { return ui.reducedMotion(); } };
  ui.onPrefs = function (fn) {
    prefListeners.push(fn);
    return function () { var i = prefListeners.indexOf(fn); if (i >= 0) prefListeners.splice(i, 1); };
  };
  /* molecular theatre on any plate (W round 3): ui.molStage(host, 'scene', {height, label, prewarm, caption})
     returns the theatre with .scene; theme and reduce motion follow the page; a Pause button sits under the canvas */
  ui.molStage = function (host, name, o) {
    var M = window.MOL || WP.mol; o = o || {};
    if (!M || !M.scenes || !M.scenes[name] || !host) return null;
    host.classList.add('mol-host');
    var sc = M.scenes[name](), T;
    try { T = M.Theatre(host, sc, { height: o.height || 300, dark: ui.isDark(), reduce: ui.reducedMotion(), prewarm: o.prewarm || 6, label: o.label }); }
    catch (err) { console.error('molStage ' + name + ' failed', err); host.innerHTML = '<p class="cap">This animation could not start; the rest of the plate still works.</p>'; return null; }
    T.scene = sc;
    var bar = document.createElement('div'); bar.className = 'mol-bar';
    bar.innerHTML = '<button type="button" class="btn small mol-pause" aria-pressed="false">Pause</button>' + (o.extra || '') + (o.caption ? '<span class="mol-cap">' + o.caption + '</span>' : '');
    host.appendChild(bar);
    bar.querySelector('.mol-pause').addEventListener('click', function (e) { var pz = T.pause(); e.currentTarget.setAttribute('aria-pressed', pz ? 'true' : 'false'); e.currentTarget.textContent = pz ? 'Play' : 'Pause'; });
    ui.onPrefs(function () { T.setTheme(ui.isDark()); T.setReduce(ui.reducedMotion()); });
    return T;
  };
  function firePrefs() {
    var p = { dark: ui.isDark(), theme: ui.theme(), reduceMotion: ui.reducedMotion() };
    prefListeners.slice().forEach(function (fn) { try { fn(p); } catch (e) { console.error(e); } });
    try { window.dispatchEvent(new CustomEvent('wp:prefs', { detail: p })); } catch (e) { /* old browser */ }
  }
  if (mqDark && mqDark.addEventListener) mqDark.addEventListener('change', function () { syncPrefButtons(); firePrefs(); });
  if (mqReduce && mqReduce.addEventListener) mqReduce.addEventListener('change', function () { syncPrefButtons(); firePrefs(); });
  ui.setTheme = function (t) {
    if (t === 'light' || t === 'dark') root.setAttribute('data-theme', t); else root.removeAttribute('data-theme');
    lsSet('wp8-theme', t === 'light' || t === 'dark' ? t : null);
    syncPrefButtons(); firePrefs();
  };
  ui.setReducedMotion = function (on) {
    root.setAttribute('data-motion', on ? 'reduce' : 'full');
    lsSet('wp8-motion', on ? 'reduce' : 'full');
    syncPrefButtons(); firePrefs();
  };
  function syncPrefButtons() {
    var tb = document.getElementById('wp-theme'), mb = document.getElementById('wp-motion');
    if (tb) {
      var d = ui.isDark();
      tb.setAttribute('aria-pressed', d ? 'true' : 'false');
      tb.querySelector('span').textContent = 'Night theme';
      tb.title = 'Night theme: dark background. Press to turn it ' + (d ? 'off' : 'on') + '.';
    }
    if (mb) mb.setAttribute('aria-pressed', ui.reducedMotion() ? 'true' : 'false');
  }

  /* ---------- difficulty tier (ADDENDUM): 1 Explore, 2 Explain, 3 Expert ---------- */
  function tierRoot() {
    var r = document.getElementById('wp-root');
    if (!r) {
      var wp = document.getElementById('wp');
      r = document.createElement('div'); r.id = 'wp-root';
      if (wp && wp.parentNode) { wp.parentNode.insertBefore(r, wp); r.appendChild(wp); } else document.body.appendChild(r);
    }
    return r;
  }
  var storedTier = +lsGet('wp8-tier');
  if (WP.state) WP.state.tier = (storedTier === 1 || storedTier === 3) ? storedTier : 2;
  ui.tier = function () { return (WP.state && WP.state.tier) || 2; };
  function syncTier() {
    var t = ui.tier();
    tierRoot().setAttribute('data-tier', String(t));
    var g = document.getElementById('wp-tier');
    if (g) Array.prototype.forEach.call(g.querySelectorAll('[data-tier]'), function (b) {
      var on = +b.dataset.tier === t;
      b.setAttribute('aria-checked', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
    });
  }
  ui.setTier = function (t) {
    t = Math.round(+t); if (!(t >= 1 && t <= 3)) t = 2;
    lsSet('wp8-tier', String(t));
    if (typeof WP.set === 'function') WP.set({ tier: t }); else if (WP.state) WP.state.tier = t;
    syncTier();
    try { window.dispatchEvent(new CustomEvent('wp:tier', { detail: { tier: t } })); } catch (e) { /* old browser */ }
  };
  function buildTier() {
    var g = document.getElementById('wp-tier');
    if (!g) return;
    g.addEventListener('click', function (e) { var b = e.target.closest('[data-tier]'); if (b) ui.setTier(+b.dataset.tier); });
    g.addEventListener('keydown', function (e) {
      var d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!d) return;
      e.preventDefault();
      var t = ((ui.tier() - 1 + d + 3) % 3) + 1;
      ui.setTier(t);
      var b = g.querySelector('[data-tier="' + t + '"]'); if (b) b.focus();
    });
    syncTier();
  }

  /* theme aware water colour (engine owns the ramp) */
  ui.water = function (psi) { return WP.waterColor ? WP.waterColor(psi, ui.theme()) : '#2b5fa4'; };

  /* ------------------------------------------------------------ badges and sources */
  var BADGE_INFO = {
    VERIFIED: 'Checked against the published paper; DOI in the source list.',
    MEASURED: 'Published data: a value measured on real plants and reported in the paper named.',
    DERIVED: 'Calculated from other values by a stated equation.',
    ILLUSTRATIVE: 'Invented to show a shape or a direction. Not data.',
    PREPRINT: 'Posted, not yet peer reviewed.',
    PRELIMINARY: 'Unpublished lab value that may change.',
    UNVERIFIED: 'Published value; the source was retrieved but this number has not yet been matched in the text.',
    'OPEN QUESTION': 'Still under study. Treat it as a question, not a result.'
  };
  ui.BADGE_INFO = BADGE_INFO;
  ui.badge = function (kind, title) {
    var k = String(kind || 'ILLUSTRATIVE').toUpperCase();
    var cls = { VERIFIED: 'verified', MEASURED: 'verified', DERIVED: 'derived', ILLUSTRATIVE: 'illustrative', PREPRINT: 'preprint', PRELIMINARY: 'preliminary', UNVERIFIED: 'preliminary', 'OPEN QUESTION': 'preliminary' }[k] || 'illustrative';
    var t = title ? title + ' ' + (BADGE_INFO[k] || '') : (BADGE_INFO[k] || '');
    return '<span class="badge b-' + cls + '" title="' + esc(t) + '" role="img" aria-label="' + esc(k + ': ' + t) + '">' + esc(k) + '</span>';
  };

  var usedDois = {};
  ui.cite = function (doi) { if (doi) usedDois[doi] = true; };
  ui.source = function (doi) {
    var s = WP.SPEC.sources[doi];
    ui.cite(doi);
    if (!s) return '<span class="src-miss">doi ' + esc(doi) + '</span>';
    return esc(s.label) + '. ' + (s.status === 'PREPRINT' ? ui.badge('PREPRINT') + ' ' : '') +
      '<a href="https://doi.org/' + encodeURI(doi) + '" target="_blank" rel="noopener">doi ' + esc(doi) + '</a>';
  };
  /* WP.ui.sources(el, dois): writes a source list into el (or returns HTML if el is null).
     Only DOIs present in SPEC.json are allowed; unknown ones are flagged in the console. */
  ui.sources = function (el, dois, heading) {
    var list = (dois || []).filter(function (d, i, a) { return a.indexOf(d) === i; });
    list.forEach(function (d) { if (!WP.SPEC.sources[d]) console.warn('WP.ui.sources: DOI not in SPEC registry', d); });
    var html = (heading === false ? '' : '<p class="sc" style="margin:0 0 2px">' + esc(heading || 'Sources') + '</p>') +
      '<ul class="srclist">' + list.map(function (d) { return '<li>' + ui.source(d) + '</li>'; }).join('') + '</ul>';
    if (el) { el.innerHTML = html; return el; }
    return html;
  };

  /* prose: escape, then turn status words into badges and "doi 10.x" into links */
  var DOI_RX = /doi (10\.\d{4,5}\/[^\s,;]+?)(?=[.)]?(?:\s|,|;|$))/g;
  ui.prose = function (text) {
    var h = esc(text);
    h = h.replace(DOI_RX, function (m, d) {
      var raw = d.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
      ui.cite(raw);
      return '<a href="https://doi.org/' + encodeURI(raw) + '" target="_blank" rel="noopener">doi ' + d + '</a>';
    });
    h = h.replace(/\b(ILLUSTRATIVE|DERIVED|PREPRINT|PRELIMINARY|VERIFIED)\b/g, function (m) { return ui.badge(m); });
    return h;
  };

  /* ------------------------------------------------------------ curriculum stops */
  var stopSeq = 0;
  /* Reader facing text guards: superscripts and subscripts for units and ions, and a
     safety net that drops any authoring note left in stop text. */
  function sci(t) {
    return String(t == null ? '' : t)
      .replace(/Ca2\+/g, 'Ca²⁺').replace(/\bH\+/g, 'H⁺').replace(/\bH2O2\b/g, 'H₂O₂')
      .replace(/\bm−2\b/g, 'm⁻²').replace(/\bs−1\b/g, 's⁻¹').replace(/\bmol−1\b/g, 'mol⁻¹').replace(/\bMPa−1\b/g, 'MPa⁻¹')
      .replace(/\bm2\b/g, 'm²').replace(/\bm3\b/g, 'm³');
  }
  var NOTE_RX = /v7 stop|class record|design choice|hand(?:off)|spine (slot|number)|this session|, confirm\)|\(confirm\)/i;
  function clean(t) {
    var x = String(t == null ? '' : t);
    x = x.replace(/\s*\([^()]*\)/g, function (m) { return NOTE_RX.test(m) ? '' : m; });
    x = x.split(/(?<=[.!?])\s+/).filter(function (sn) { return !NOTE_RX.test(sn); }).join(' ');
    return sci(x);
  }
  ui.sci = sci;
  /* Shared evidence marker for levels without their own (Field, Afternoon).
     Registry: WP.evidence[key] = {claim, cite, doi, doi2, measured, fig, badge}. */
  WP.evidence = WP.evidence || {};
  ui.evButton = function (key) {
    return '<button type="button" class="wpev" data-wpev="' + esc(key) + '" aria-expanded="false" title="Show the evidence behind this claim">Evidence</button>';
  };
  /* How to measure cards (request 4). Registry WP.howto[key] = {title, what, steps:[...], watch, dois:[...], proto:{url,label}}.
     Protocol links are only PrometheusWiki pages verified to load during this build. */
  WP.howto = WP.howto || {};
  var howtoCSS = false;
  ui.howto = function (key) {
    var h = WP.howto[key]; if (!h) return '';
    if (!howtoCSS && document.head) {
      howtoCSS = true;
      var st = document.createElement('style');
      st.textContent = '.howto{border:1px solid var(--rule,#c9bfa8);border-left:3px solid var(--accent,#2b5fa4);background:var(--card,transparent);margin:10px 0;padding:0 12px;font-family:var(--ui,system-ui);font-size:13.5px;line-height:1.5}' +
        '.howto summary{cursor:pointer;padding:8px 0;font-weight:600;color:var(--ink,#222)}.howto summary small{font-weight:400;color:var(--ink2,#555)}' +
        '.howto ol{margin:4px 0 8px;padding-left:20px}.howto .hw-k{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink2,#555);margin:8px 0 2px}' +
        '.howto .srclist{margin:2px 0 10px;padding-left:18px}.howto p{margin:4px 0}';
      document.head.appendChild(st);
    }
    (h.dois || []).forEach(ui.cite);
    return '<details class="howto"><summary>How to measure: ' + esc(h.title) + (h.what ? ' <small>' + esc(h.what) + '</small>' : '') + '</summary>' +
      '<ol>' + h.steps.map(function (x) { return '<li>' + ui.prose(x) + '</li>'; }).join('') + '</ol>' +
      (h.watch ? '<p class="hw-k">Watch for</p><p>' + ui.prose(h.watch) + '</p>' : '') +
      (h.dois && h.dois.length ? '<p class="hw-k">Primary methods papers</p><ul class="srclist">' + h.dois.map(function (d) { return '<li>' + ui.source(d) + '</li>'; }).join('') + '</ul>' : '') +
      (h.proto ? '<p class="hw-k">Protocol</p><p><a href="' + esc(h.proto.url) + '" target="_blank" rel="noopener">' + esc(h.proto.label) + '</a> (PrometheusWiki)</p>' : '') +
      '</details>';
  };
  function evDrawerHTML(key) {
    var e = WP.evidence[key];
    if (!e) return '<p>No evidence entry.</p>';
    var src = [];
    if (e.doi) src.push(ui.source(e.doi));
    if (e.doi2) src.push(ui.source(e.doi2));
    return '<div>' + ui.badge(e.badge) + ' <b>' + esc(e.claim) + '</b></div>' +
      '<dl><dt>Paper</dt><dd>' + esc(e.cite) + '</dd><dt>What was measured</dt><dd>' + esc(e.measured) + '</dd>' +
      '<dt>Figure or table</dt><dd>' + esc(e.fig) + '</dd><dt>DOI</dt><dd>' + (src.length ? src.join('<br>') : 'none (physics or definition)') + '</dd></dl>';
  }
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest && ev.target.closest('button.wpev[data-wpev]');
    if (!b) return;
    var open = b.getAttribute('aria-expanded') === 'true';
    var id = b.getAttribute('aria-controls'), d = id ? document.getElementById(id) : null;
    if (!d) {
      d = document.createElement('div');
      d.className = 'wpev-drawer'; d.id = 'wpev-' + Math.random().toString(36).slice(2, 9);
      d.setAttribute('role', 'region'); d.setAttribute('aria-label', 'Evidence');
      b.setAttribute('aria-controls', d.id);
      var blk = b.closest('p, li, .card, .tile, figcaption, .ev-host') || b.parentNode;
      blk.parentNode.insertBefore(d, blk.nextSibling);
    }
    d.innerHTML = evDrawerHTML(b.getAttribute('data-wpev'));
    d.hidden = open;
    b.setAttribute('aria-expanded', open ? 'false' : 'true');
  });
  /* phones: the readout rail is one line of values; a tap opens the full readouts, a second tap closes them */
  (function () {
    function sync() { var r = document.querySelector('.wp-rail'); if (!r) return; if (window.innerWidth > 640) r.classList.remove('compact'); else if (!r.classList.contains('open')) r.classList.add('compact'); }
    document.addEventListener('click', function (e) {
      var r = e.target.closest && e.target.closest('.wp-rail'); if (!r || window.innerWidth > 640 || e.target.closest('.badge,button,a')) return;
      var o = !r.classList.contains('open'); r.classList.toggle('open', o); r.classList.toggle('compact', !o);
      var rl = r.querySelector('.rail'); if (rl) rl.setAttribute('aria-expanded', o ? 'true' : 'false');
    });
    window.addEventListener('resize', sync); setTimeout(sync, 0);
    /* phones and tablets: while a molecular theatre or canvas is at least 20 % in view the rail stops sticking,
       so it never covers the animation (same rule as the Light to sugar module) */
    var tq = 0;
    function tuck() {
      tq = 0; var r = document.querySelector('.wp-rail'); if (!r) return;
      if (window.innerWidth >= 1100) { r.classList.remove('tuck'); return; }
      var vh = window.innerHeight, on = false;
      Array.prototype.forEach.call(document.querySelectorAll('#wp-stage canvas, #wp-stage .mol-host, #wp-stage .tuck-me'), function (c) {
        if (on) return; var b = c.getBoundingClientRect(); if (!b.height) return;
        var vis = Math.min(b.bottom, vh) - Math.max(b.top, 0);
        if (vis > 0.2 * Math.min(b.height, vh)) on = true;
      });
      r.classList.toggle('tuck', on);
    }
    function q() { if (!tq) tq = requestAnimationFrame(tuck); }
    window.addEventListener('scroll', q, { passive: true }); window.addEventListener('resize', q); window.addEventListener('hashchange', function () { setTimeout(q, 700); });
    setTimeout(q, 400);
  })();
  /* phones: SVG labels never render below 11 px; wide tables fade at the edge when they scroll */
  function minText(root) {
    if (!root) return;
    Array.prototype.forEach.call(root.querySelectorAll('svg'), function (svg) {
      if (svg.classList.contains('sbar') || svg.closest('.chip,.btn,.t4-rchip,.o3-legend,.p2-legend')) return;
      var vb = svg.viewBox && svg.viewBox.baseVal, w = svg.getBoundingClientRect().width;
      if (!vb || !vb.width || !w) return;
      var k = w / vb.width, narrow = window.innerWidth < 560;
      /* round labels in circles (class mintag) grow as a whole so the text stays inside its ring */
      Array.prototype.forEach.call(svg.querySelectorAll('.mintag'), function (g) {
        var f0 = +(g.getAttribute('data-fs') || 12), sc = narrow && f0 * k < 11 ? 11 / (f0 * k) : 1;
        g.setAttribute('transform', sc === 1 ? '' : 'scale(' + sc.toFixed(2) + ')');
      });
      Array.prototype.forEach.call(svg.querySelectorAll('text'), function (t) {
        if (t.closest('.mintag')) return;
        if (t.dataset.fs0) { t.style.fontSize = ''; if (!narrow) delete t.dataset.fs0; }
        if (!narrow) return;
        var f = parseFloat(getComputedStyle(t).fontSize) || 12;
        if (f * k < 11) { t.dataset.fs0 = f; t.style.fontSize = (11 / k).toFixed(1) + 'px'; }
      });
    });
    Array.prototype.forEach.call(root.querySelectorAll('.p2-tw,.o3-tw,.lib-tw,.t4-tw'), function (x) { x.classList.toggle('ofl', x.scrollWidth > x.clientWidth + 2); });
  }
  ui.minText = minText;
  var mtT = 0;
  function scheduleMinText() { clearTimeout(mtT); mtT = setTimeout(function () { var sct = sections[current]; if (sct) minText(sct.sec); }, 60); }
  window.addEventListener('resize', scheduleMinText);
  /* One wording for stomata everywhere: conductance as a percent of its maximum, plus a
     plain word and, when asked, the cause (light or leaf tension). */
  ui.stomata = function (res) {
    var pct = res.gsMax ? 100 * res.gs / res.gsMax : 0;
    var dark = res.state && res.state.ppfd <= 0;
    var word = dark ? 'shut' : (pct >= 75 ? 'mostly open' : (pct >= 30 ? 'partly closed' : 'mostly closed'));
    var causes = [];
    if (dark) causes.push('it is dark');
    else {
      if (res.fLight < 0.6) causes.push('light is low');
      if (res.fPsi < 0.85) causes.push('the leaf is under tension');
    }
    return {
      pct: pct, word: word,
      psiClosed: 100 * (1 - (res.fPsi === undefined ? 1 : res.fPsi)),
      cause: causes.length ? 'because ' + causes.join(' and ') : '',
      text: 'stomatal conductance at ' + num(pct, 0) + ' % of its maximum (' + word + ')'
    };
  };
  ui.cleanText = clean;
  function stopHTML(s0) {
    var s = {}, k;
    for (k in s0) s[k] = (typeof s0[k] === 'string' && k !== 'id') ? clean(s0[k]) : s0[k];
    var id = 'stop-' + s.id + '-' + (++stopSeq);
    var tcls = s.tier === 3 ? ' tier-3' : (s.tier === 2 ? ' tier-2' : '');
    return '<article class="stop' + tcls + '" id="' + id + '" aria-labelledby="' + id + '-t">' +
      '<div class="stop-hd"><span class="stop-no" aria-hidden="true">' + esc(s.id) + '</span><div>' +
      '<h3 id="' + id + '-t"><span class="vh">Stop ' + esc(s.id) + '. </span>' + esc(s.title) + '</h3>' +
      '</div></div>' +
      '<dl><dt>You will be able to</dt><dd>' + ui.prose(s.objective) + '</dd>' +
      '<dt class="tier-2">A common idea</dt><dd class="tier-2">' + ui.prose(s.misconception) + '</dd></dl>' +
      '<p class="tier-1-only stop-more">The common idea and the check question for this stop are under <b>2 Explain</b>.</p>' +
      '<details class="qbox ptc-d tier-2"><summary><span class="ptc-k">Predict, then check</span> <span class="ptc-s">commit to an answer before you look</span></summary><p class="qt">' + ui.prose(s.question) + '</p>' +
      '<label class="vh" for="' + id + '-a">Your answer, kept on this page only</label>' +
      '<textarea id="' + id + '-a" placeholder="Commit to an answer first. Nothing you type is saved or sent."></textarea>' +
      '<div class="qrow"><button type="button" class="btn primary small" aria-expanded="false" aria-controls="' + id + '-r">Show the answer</button>' +
      '<span class="nudge" aria-live="polite"></span></div>' +
      '<div class="answer" id="' + id + '-r" hidden><p style="margin:0">' + ui.prose(s.answer) + '</p>' +
      (s.dois && s.dois.length ? '<div class="srcs">' + ui.sources(null, s.dois, 'Sources for this stop') + '</div>' : '') +
      '</div></details>' +
      '</article>';
  }
  /* WP.ui.stops(el, ids): renders the curriculum stops for a level into el. */
  ui.stops = function (el, ids) {
    var wrap = document.createElement('section');
    wrap.className = 'stops';
    wrap.setAttribute('aria-label', 'Stops on this plate');
    wrap.innerHTML = (ids || []).map(function (i) {
      var s = WP.SPEC.stops[i];
      if (!s) { console.warn('WP.ui.stops: unknown stop', i); return ''; }
      (s.dois || []).forEach(ui.cite);
      return stopHTML(s);
    }).join('');
    wrap.addEventListener('click', function (ev) {
      var b = ev.target.closest('button[aria-controls]');
      if (!b || !wrap.contains(b)) return;
      var box = b.closest('.qbox'), ans = document.getElementById(b.getAttribute('aria-controls'));
      var ta = box.querySelector('textarea'), nudge = box.querySelector('.nudge');
      var open = b.getAttribute('aria-expanded') === 'true';
      if (!open && !ta.value.trim() && !b.dataset.nudged) {
        b.dataset.nudged = '1';
        nudge.textContent = 'Write one line first: committing before you look is the point. Press again to see it anyway.';
        ta.focus();
        return;
      }
      ans.hidden = open;
      b.setAttribute('aria-expanded', open ? 'false' : 'true');
      b.textContent = open ? 'Show the answer' : 'Hide the answer';
      nudge.textContent = '';
    });
    if (el) el.appendChild(wrap);
    return wrap;
  };

  /* r5 (W): "Design it" cards (PhD panel item 3). One tier 3 card per plate that turns the plate's open question into a
     defensible experiment: question, treatment and control, what to measure (linked to a How to measure card), n,
     the model's expected effect at the two settings (badged), and the one confound to block.
     o = {q, treat, measure, howto:[keys], n, expect (html, may be a function returning html), badge, confound} */
  var DESIGNS = [];
  ui.design = function (o) {
    var ex = typeof o.expect === 'function' ? o.expect() : o.expect, did = '';
    if (typeof o.expect === 'function') { did = 'wpd-' + DESIGNS.length; DESIGNS.push({ id: did, fn: o.expect }); }
    return '<div class="card tier-3 wp-design"><h4 style="margin:0 0 6px">Design it: turn the question into an experiment ' + ui.badge('OPEN QUESTION') + '</h4>' +
      '<dl class="wp-dl">' +
      '<dt>Question</dt><dd>' + o.q + '</dd>' +
      '<dt>Treatment and control</dt><dd>' + o.treat + '</dd>' +
      '<dt>Measure</dt><dd>' + o.measure + (o.howto && o.howto.length ? ' <span class="wp-dl-k">(see the How to measure card' + (o.howto.length > 1 ? 's' : '') + ' on this plate)</span>' : '') + '</dd>' +
      '<dt>Replication</dt><dd>' + o.n + '</dd>' +
      '<dt>Expected effect</dt><dd class="wp-design-ex">' + (did ? '<span id="' + did + '">' + ex + '</span>' : ex) + ' ' + ui.badge(o.badge || 'ILLUSTRATIVE', o.badgeNote || 'From the model on this site at the two settings, not a measurement.') + '</dd>' +
      '<dt>The confound to block</dt><dd>' + o.confound + '</dd></dl></div>';
  };

  /* ------------------------------------------------------------ predict before reveal
     ui.predict(opts) -> element. opts: {q, choices, correct, answer, gate: [elements], cls}. Gated controls stay
     locked (clicks are caught, not disabled, so the level keeps its own disabled logic) until a choice is made;
     Check then opens the answer with a short reveal. Nothing is stored. */
  var LOCKED = [];
  document.addEventListener('click', function (e) {
    for (var i = 0; i < LOCKED.length; i++) {
      var L = LOCKED[i];
      if (!L.open && L.els.some(function (x) { return x === e.target || x.contains(e.target); })) {
        e.preventDefault(); e.stopPropagation();
        L.box.classList.remove('nudge'); void L.box.offsetWidth; L.box.classList.add('nudge');
        var n = L.box.querySelector('.ptc-lock'); if (n) n.textContent = 'Pick a prediction first, then the control unlocks.';
        try { L.box.scrollIntoView({ block: 'nearest', behavior: ui.reducedMotion() ? 'auto' : 'smooth' }); } catch (er) { /* old browser */ }
        return;
      }
    }
  }, true);
  ui.predict = function (o) {
    var box = document.createElement('div');
    box.className = 'ptc ptc-gate' + (o.cls ? ' ' + o.cls : '');
    box.innerHTML = '<p class="q"><span class="ptc-k">Predict, then check.</span> ' + o.q + '</p><div class="chips" role="radiogroup" aria-label="Your prediction">' +
      o.choices.map(function (c, i) { return '<button type="button" class="chip" role="radio" aria-checked="false" data-i="' + i + '">' + c + '</button>'; }).join('') +
      '</div><div class="qrow"><button type="button" class="btn small primary" disabled data-check>Check</button>' + (o.gate ? '<span class="ptc-lock" aria-live="polite">' + (o.lockText || 'The control below unlocks once you predict.') + '</span>' : '') + '</div>' +
      '<div class="ans reveal" hidden><p class="verdict"></p><p style="margin:0">' + o.answer + '</p></div>';
    var rec = { box: box, els: (o.gate || []).filter(Boolean), open: !o.gate };
    rec.els.forEach(function (x) { x.classList.add('ptc-locked'); x.setAttribute('aria-disabled', 'true'); });
    if (o.gate) LOCKED.push(rec);
    box.addEventListener('click', function (e) {
      var chip = e.target.closest('.chip');
      if (chip) {
        Array.prototype.forEach.call(box.querySelectorAll('.chip'), function (c) { c.setAttribute('aria-checked', c === chip ? 'true' : 'false'); });
        box.querySelector('[data-check]').disabled = false;
        if (!rec.open) { rec.open = true; rec.els.forEach(function (x) { x.classList.remove('ptc-locked'); x.removeAttribute('aria-disabled'); }); var n = box.querySelector('.ptc-lock'); if (n) n.textContent = 'Unlocked. Try it, then press Check.'; }
        return;
      }
      if (e.target.closest('[data-check]')) {
        var sel = box.querySelector('.chip[aria-checked="true"]'), ans = box.querySelector('.ans');
        ans.querySelector('.verdict').textContent = sel && +sel.dataset.i === o.correct ? 'Yes.' : 'Not quite. Here is the reasoning.';
        ans.hidden = false; ans.classList.remove('in'); void ans.offsetWidth; ans.classList.add('in');
      }
    });
    return box;
  };
  /* one line, tier 1 only, at the top of every plate */
  var QUICK = {
    1: ['On a hot, dry Salinas afternoon, which pulls harder on the water in a leaf?', ['The air', 'The soil', 'Neither'], 0, 'The air. Its water potential is far more negative than any field soil, so water leaves the leaf as vapour and the plant is pulled from above.'],
    2: ['Water flows from soil to leaf because the leaf water potential is…', ['more negative than the soil', 'less negative than the soil', 'the same as the soil'], 0, 'More negative. On the number line −0.57 sits below −0.10, so −0.57 MPa is the drier, lower value even though 0.57 looks bigger. Water only moves toward more negative water potential, so each step from soil to leaf is a step down in Ψ. <span class="wp-numline" aria-hidden="true"><span>wetter</span><b>0</b><i>−0.10 soil</i><i>−0.57 leaf</i><span>drier</span></span>'],
    3: ['As a grapevine dries out, which comes first?', ['The stomata close', 'The pipes fill with air', 'Both at once'], 0, 'The stomata close first. In grapevine, stomatal closure came well before the petiole or stem pipes lost much of their flow.'],
    4: ['Outside the vein, in one widely used leaf model, most water moves…', ['along the cell walls', 'through membranes', 'as vapour'], 0, 'Along the cell walls, in that model (Buckley 2015). It is a model result, and the paper itself shows the share can change a lot with its assumptions.'],
    5.5: ['Toyon, a chaparral shrub, and sunflower, a crop, were measured the same way. Which keeps its leaves turgid to the lower water potential?', ['toyon', 'sunflower', 'they are the same'], 0, 'Toyon. Its leaves lose turgor near −2.5 MPa, sunflower near −1.1 MPa (Scoffoni et al. 2011). Crops are mostly built for fast growth with water supplied.'],
    5: ['An aquaporin is…', ['a protein channel in a membrane', 'a hole in the cell wall', 'a pump that spends energy'], 0, 'A protein channel in the membrane. Water moves through it down its water potential gradient; the channel itself spends no energy.'],
    6: ['Inside a closed romaine head on a still, humid afternoon, the inner leaves transpire…', ['less than the outer leaves', 'more than the outer leaves', 'the same'], 0, 'Less. The air around them is still and humid. Calcium travels with that water, so they receive less of it (Barta and Tibbitts 1986).']
  };
  // r5: the opening prediction shows at every tier (tier 2 readers had no prediction on Organ and Tissue), and the plate's
  // first "What is happening" line stays veiled until Check, so the caption cannot answer the question before it is asked
  ui.quick = function (n) {
    var q = QUICK[n]; if (!q) return null;
    var b = ui.predict({ q: q[0], choices: q[1], correct: q[2], answer: q[3], cls: 'ptc-quick' });
    b.addEventListener('click', function (e) {
      if (!e.target.closest('[data-check]')) return;
      b.classList.add('done');
      var sec = b.parentNode; if (!sec) return;
      Array.prototype.forEach.call(sec.querySelectorAll('.wp-hold'), function (x) { x.classList.remove('wp-hold'); x.removeAttribute('aria-hidden'); var h = x.querySelector('.wp-hold-note'); if (h) h.parentNode.removeChild(h); });
    });
    return b;
  };
  ui.holdNow = function (sec) {
    var qk = sec && sec.querySelector('.ptc-quick'); if (!qk || qk.classList.contains('done')) return;
    // only where the caption answers the opening question (Field, Plant, Organ, Tissue)
    if (!/^lv-sec-[1-4]$/.test(sec.id || '')) return;
    var n = null, ps = sec.querySelectorAll('.level-body p, .level-body div');
    for (var i = 0; i < ps.length && !n; i++) if (/^\s*What is happening/.test(ps[i].textContent) && ps[i].children.length < 6 && !ps[i].querySelector('svg,canvas,img')) n = ps[i]; // r7 unifier: never veil a figure
    if (!n || n.classList.contains('wp-hold') || n.dataset.held) return;
    n.dataset.held = '1'; n.classList.add('wp-hold');
    var note = document.createElement('span'); note.className = 'wp-hold-note'; note.textContent = 'Answer the prediction above first: this line gives it away.';
    n.appendChild(note);
  };

  /* ------------------------------------------------------------ level table */
  var META = [
    { n: 1, hash: 'field', rn: 'I', name: 'Field', scale: '10 m', sp: 'Salinas Valley, a crop in its field' },
    { n: 2, hash: 'plant', rn: 'II', name: 'Plant', scale: '1 m', sp: 'the whole plant as one circuit' },
    { n: 3, hash: 'organ', rn: 'III', name: 'Organ', scale: '1 cm', sp: 'root, stem, petiole and veins' },
    { n: 4, hash: 'tissue', rn: 'IV', name: 'Tissue', scale: '100 µm', sp: 'outside the xylem' },
    { n: 5, hash: 'membrane', rn: 'V', name: 'Membrane', scale: '10 nm', sp: 'the aquaporin gate' },
    { n: 5.5, hash: 'species', rn: 'VI', name: 'Species', scale: '1000 km', sp: 'California and beyond: crops and wild plants on the same axes' },
    { n: 6, hash: 'afternoon', rn: '', name: 'Afternoon', scale: '10 cm', sp: 'your Salinas afternoon' },
    { n: 7, hash: 'library', rn: '', name: 'Library', scale: '1 m', sp: 'every plate from the original Water Path, under its old number' }
  ];
  ui.META = META;
  function metaOf(n) { for (var i = 0; i < META.length; i++) if (META[i].n === n) return META[i]; return null; }
  var V7ROUTES = /^#?\/(map|anatomy|turgor|growth|demand|embolism|fail|leaf|field|quiz|symbols|feedback|sources)(#|$)/i;
  function metaOfHash(h) {
    if (V7ROUTES.test(String(h || ''))) return metaOf(7);
    h = String(h || '').replace(/^#\/?/, '').toLowerCase();
    for (var i = 0; i < META.length; i++) if (META[i].hash === h) return META[i];
    if (h === 'closing') return metaOf(6);
    if (h === 'california' || h === 'beyond') return metaOf(5.5);
    if (/^library/.test(h) || (WP.LIB && WP.LIB.byAnchor(h))) return metaOf(7);
    return null;
  }
  function scaleMetres(s) {
    var m = /^([\d.]+)\s*(nm|µm|um|mm|cm|m)$/.exec(String(s || '').trim());
    if (!m) return 1;
    return parseFloat(m[1]) * { nm: 1e-9, 'µm': 1e-6, um: 1e-6, mm: 1e-3, cm: 1e-2, m: 1 }[m[2]];
  }

  /* ------------------------------------------------------------ shell build */
  var sections = {};        // n -> {sec, body, level, mounted, dirty}
  var current = 0;
  var shell = WP.shell = { sections: sections, meta: META };

  function buildTabs() {
    var tl = document.getElementById('wp-tabs');
    tl.innerHTML = META.map(function (m) {
      return '<button type="button" class="wp-tab' + (m.rn ? '' : ' keep') + '" role="tab" id="tab-' + m.hash + '" aria-controls="lv-sec-' + String(m.n).replace('.', '_') +
        '" aria-selected="false" tabindex="-1" data-n="' + m.n + '" aria-label="' + (m.rn ? 'Water ' + m.rn + ', ' : '') + m.name + '" title="' + (m.rn ? 'Water ' + m.rn + ', the ' : (m.hash === 'library' ? 'The ' : 'Your Salinas ')) + m.name.toLowerCase() + ': ' + m.sp + '">' + (m.rn ? '<span class="rn">' + m.rn + '</span>' : '') +
        '<span class="tl">' + m.name + '</span>' + (m.hash === 'library' ? '<span class="newdot" id="wp-newdot" hidden title="New entries in the last 14 days"></span>' : '') + '</button>';
    }).join('');
    tl.addEventListener('click', function (e) {
      var b = e.target.closest('.wp-tab'); if (!b) return;
      go(+b.dataset.n, true);
    });
    tl.addEventListener('keydown', function (e) {
      var b = e.target.closest('.wp-tab'); if (!b) return;
      var tabs = Array.prototype.slice.call(tl.querySelectorAll('.wp-tab')), i = tabs.indexOf(b), j = -1;
      if (e.key === 'ArrowRight') j = (i + 1) % tabs.length;
      else if (e.key === 'ArrowLeft') j = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') j = 0;
      else if (e.key === 'End') j = tabs.length - 1;
      if (j >= 0) { e.preventDefault(); tabs[j].focus(); go(+tabs[j].dataset.n, true); }
    });
    var lad = document.getElementById('wp-ladder');
    lad.innerHTML = META.slice(0, 5).map(function (m) { return '<span data-n="' + m.n + '">' + m.scale + '</span>'; }).join('');
  }

  /* ---------- scale bar ---------- */
  var sbarState = { label: null };
  function barGroup(label) {
    var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'sb-g');
    g.innerHTML = '<rect class="sb-fill" x="4" y="6" width="20" height="5"/><rect class="sb-hollow" x="24" y="6" width="20" height="5"/>' +
      '<rect class="sb-fill" x="44" y="6" width="20" height="5"/><rect class="sb-hollow" x="64" y="6" width="20" height="5"/>' +
      '<text x="4" y="24">0</text><text x="84" y="24" text-anchor="middle">' + esc(label) + '</text>';
    g.style.transformBox = 'view-box';
    g.style.transformOrigin = '4px 8px';
    return g;
  }
  function setScale(label, animate) {
    var svg = document.getElementById('wp-sbar');
    if (!svg) return;
    svg.setAttribute('aria-label', 'Scale bar ' + label);
    var old = svg.querySelector('.sb-g:not(.leaving)');
    var prev = sbarState.label;
    sbarState.label = label;
    var g = barGroup(label);
    svg.appendChild(g);
    var lad = document.getElementById('wp-ladder');
    if (lad) Array.prototype.forEach.call(lad.children, function (s) { s.classList.toggle('on', s.textContent === label); });
    if (!old) return;
    if (!animate || ui.reducedMotion() || !g.animate || prev === label) { old.remove(); return; }
    var k = scaleMetres(prev) / scaleMetres(label);       // >1 when diving in
    var f = Math.max(1 / 5, Math.min(5, k));
    old.classList.add('leaving');
    var a = old.animate([{ transform: 'scaleX(1)', opacity: 1 }, { transform: 'scaleX(' + f + ')', opacity: 0 }], { duration: 600, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'forwards' });
    a.onfinish = function () { old.remove(); };
    g.animate([{ transform: 'scaleX(' + (1 / f) + ')', opacity: 0 }, { transform: 'scaleX(1)', opacity: 1 }], { duration: 600, easing: 'cubic-bezier(.2,.7,.2,1)' });
    // a brief magnification note
    var note = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    note.setAttribute('x', '136'); note.setAttribute('y', '11'); note.setAttribute('text-anchor', 'end');
    note.setAttribute('class', 'sb-note');
    var times = k >= 1 ? k : 1 / k;
    var tStr = times >= 1e3 ? Math.round(times).toLocaleString('en-US').replace(/,/g, ' ') : String(Math.round(times));
    note.textContent = (k >= 1 ? '×' : '÷') + tStr;
    note.style.fontSize = '10px';
    svg.appendChild(note);
    var na = note.animate([{ opacity: 0 }, { opacity: 1, offset: 0.25 }, { opacity: 1, offset: 0.7 }, { opacity: 0 }], { duration: 1300 });
    na.onfinish = function () { note.remove(); };
  }

  /* ---------- conditions strip ---------- */
  var CTL = [
    { k: 'crop', type: 'select', label: 'Crop', opts: [['grape', 'Grapevine'], ['romaine', 'Romaine lettuce'], ['almond', 'Almond']] },
    { k: 'soilPsi', type: 'range', label: 'Soil Ψ', min: -2.0, max: -0.02, step: 0.02, fmt: function (v) { return WP.fmt.psi(v); }, hint: 'left dry, right wet' },
    { k: 'T', type: 'range', label: 'Air temperature', min: 5, max: 42, step: 0.5, fmt: function (v) { return num(v, 1) + ' °C'; } },
    { k: 'RH', type: 'range', label: 'Relative humidity', min: 10, max: 98, step: 1, fmt: function (v) { return num(v, 0) + ' %'; } },
    { k: 'wind', type: 'range', label: 'Wind', min: 0.2, max: 8, step: 0.1, fmt: function (v) { return num(v, 1) + ' m s⁻¹'; }, hint: 'boundary layer note only; not in E' },
    { k: 'ppfd', type: 'range', label: 'Light (PPFD)', min: 0, max: 2000, step: 10, fmt: function (v) { return num(v, 0) + ' µmol m⁻² s⁻¹'; } },
    { k: 'lightQ', type: 'select', label: 'Light quality', opts: [['rb', 'Red + blue'], ['red', 'Red only']] },
    { k: 'hour', type: 'time', label: 'Time of day', min: 5, max: 20, step: 0.25, fmt: function (v) { return WP.fmt.hour(v); } }
  ];
  var ctlEls = {};
  var playTimer = null;
  function buildConditions() {
    var grid = document.getElementById('wp-cond-grid');
    grid.innerHTML = CTL.map(function (c) {
      var id = 'ctl-' + c.k;
      if (c.type === 'select') {
        return '<div class="ctl"><label for="' + id + '">' + c.label + '</label><select id="' + id + '" data-k="' + c.k + '">' +
          c.opts.map(function (o) { return '<option value="' + o[0] + '">' + o[1] + '</option>'; }).join('') + '</select></div>';
      }
      if (c.type === 'time') {
        return '<div class="ctl time"><span class="ctl-l"><label for="' + id + '">' + c.label +
          ' <span style="text-transform:none;letter-spacing:0">(sets T, RH and light from an ' + ui.badge('ILLUSTRATIVE', 'Salinas diel preset per crop, a teaching preset, not a weather record.') + ' Salinas day)</span></label>' +
          '<output id="' + id + '-o" for="' + id + '"></output></span>' +
          '<span class="ctl-pp" style="display:inline-flex;gap:6px;align-items:center;flex-wrap:nowrap">' +
          '<button type="button" class="btn small" id="ctl-play" aria-pressed="false" aria-label="Play the day">' +
          '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5v11l9-5.5z" fill="currentColor"/></svg><span>Play</span></button></span>' +
          '<input type="range" id="' + id + '" data-k="' + c.k + '" min="' + c.min + '" max="' + c.max + '" step="' + c.step + '">' +
          '<div class="ticks" aria-hidden="true"><span>05:00</span><span>09:00</span><span>12:00</span><span>15:00</span><span>20:00</span></div></div>';
      }
      return '<div class="ctl"><label for="' + id + '">' + c.label + '<output id="' + id + '-o" for="' + id + '"></output></label>' +
        '<input type="range" id="' + id + '" data-k="' + c.k + '" min="' + c.min + '" max="' + c.max + '" step="' + c.step + '">' +
        (c.hint ? '<div class="hint">' + c.hint + '</div>' : '') + '</div>';
    }).join('');
    var defs = document.createElement('p');
    defs.className = 'cond-def';
    defs.innerHTML = '<b>Ψ</b> (psi), water potential in MPa: more negative means drier. <b>VPD</b>, vapour pressure deficit: how dry the air is, in kPa. <b>PPFD</b>: the light plants use for photosynthesis, in µmol m⁻² s⁻¹.';
    var condEl = document.getElementById('wp-cond'); condEl.parentNode.insertBefore(defs, condEl.nextSibling);
    CTL.forEach(function (c) { ctlEls[c.k] = { input: document.getElementById('ctl-' + c.k), out: document.getElementById('ctl-' + c.k + '-o'), c: c }; });
    grid.addEventListener('input', function (e) {
      var k = e.target.dataset && e.target.dataset.k; if (!k) return;
      if (k === 'hour') { stopPlay(); WP.applyHour(+e.target.value); return; }
      var p = {}; p[k] = e.target.tagName === 'SELECT' ? e.target.value : +e.target.value;
      WP.set(p);
    });
    grid.addEventListener('change', function (e) {
      var k = e.target.dataset && e.target.dataset.k; if (!k || e.target.tagName !== 'SELECT') return;
      var p = {}; p[k] = e.target.value;
      if (k === 'crop') { WP.set(p); WP.applyHour(WP.state.hour); } else WP.set(p);
    });
    // speed chip beside Play the day (13 Oct, slow and named): one tap steps the page speed down
    var cpb = document.getElementById('ctl-play');
    if (window.PlaySpeed && cpb && !cpb.parentNode.querySelector('[data-ps="chip"]')) cpb.insertAdjacentElement('afterend', window.PlaySpeed.chip('ps-light'));
    cpb.addEventListener('click', function () {
      if (playTimer) { stopPlay(); return; }
      var b = this;
      b.setAttribute('aria-pressed', 'true'); b.querySelector('span').textContent = 'Pause';
      if (WP.state.hour >= 19.9) WP.applyHour(5);
      // the same quarter hour steps, paced by PlaySpeed (the spdInterval pattern of app.js): at 1/4x a step every 880 ms
      var acc = 0;
      playTimer = setInterval(function () {
        acc += window.PlaySpeed ? window.PlaySpeed.get() : 1; if (acc < 0.999) return; acc -= 1;
        var h = WP.state.hour + 0.25;
        if (h > 20) { stopPlay(); return; }
        WP.applyHour(h);
      }, 220);
    });
    // collapse by default on small screens
    if (window.innerWidth < 700) document.getElementById('wp-cond').open = false;
  }
  function stopPlay() {
    if (playTimer) clearInterval(playTimer);
    playTimer = null;
    var b = document.getElementById('ctl-play');
    if (b) { b.setAttribute('aria-pressed', 'false'); b.querySelector('span').textContent = 'Play'; }
  }
  function syncConditions(st) {
    CTL.forEach(function (c) {
      var e = ctlEls[c.k]; if (!e || !e.input) return;
      var v = st[c.k];
      if (document.activeElement !== e.input || c.type === 'select') { if (String(e.input.value) !== String(v)) e.input.value = v; }
      if (e.out) e.out.textContent = c.fmt ? c.fmt(v) : v;
    });
    var cropName = { grape: 'grapevine', romaine: 'romaine', almond: 'almond' }[st.crop];
    $('#wp-cond-sum').textContent = cropName + ' · soil ' + WP.fmt.psi(st.soilPsi) + ' · ' + num(st.T, 1) + ' °C · ' + num(st.RH, 0) + ' % RH · ' + WP.fmt.hour(st.hour);
  }

  /* ---------- readout rail ---------- */
  function buildRail() {
    var r = document.getElementById('wp-rail');
    var ILL = 'Computed by the model from illustrative constants.';
    r.innerHTML = '<h2>Readouts</h2><p class="rail-sub">live, from the model</p>' +
      ro('psi', T2('Leaf Ψ', 'Leaf water potential'), ui.badge('ILLUSTRATIVE', ILL + ' End of the outside xylem path: the leaf Ψ the stomata sense.'),
        'Water potential (Ψ): how hard the leaf pulls on water. More negative means more tension.') +
      ro('gs', T2('g<sub>s</sub>', 'Stomata open'), ui.badge('ILLUSTRATIVE', ILL),
        'Stomatal conductance: how open the leaf pores are.') +
      ro('E', T2('E', 'Water loss'), ui.badge('ILLUSTRATIVE', ILL + ' E = (gs + gmin) × VPD ÷ Patm; gmin is the cuticle plus stomata that do not close fully.'),
        'Transpiration: water lost per square metre of leaf each second.') +
      ro('K', T2('K<sub>leaf</sub>', 'Leaf plumbing'), ui.badge('ILLUSTRATIVE', ILL + ' Kleaf = 1 ÷ (R leaf xylem + R outside xylem).'),
        'Leaf hydraulic conductance: how easily water crosses the leaf.') +
      ro('stem', T2('Stem Ψ, bagged leaf', 'Stem water potential'), ui.badge('ILLUSTRATIVE', ILL + ' Midday stem Ψ read in a pressure chamber on a bagged leaf equals the model stem node; this is the number growers and UCCE use.'),
        'Pressure chamber reading on a leaf bagged an hour before, so it matches the stem.') +
      '<p class="warn" id="ro-warn" hidden></p>' +
      '<div class="wp-pass" id="ro-pass" aria-live="off"></div>' +
      '<p class="note" id="ro-note"></p>';
    function T2(a, b) { return '<span class="tier-2">' + a + '</span><span class="tier-1-only">' + b + '</span>'; }
    function ro(id, k, b, def) {
      return '<div class="ro" id="ro-' + id + '"><span class="k">' + k + '</span><span class="v num" aria-live="off"></span>' +
        '<span class="bd"><span class="st"></span>' + b + '</span>' + (def ? '<span class="def">' + def + '</span>' : '') + '<span class="meter" aria-hidden="true"><i></i></span></div>';
    }
  }
  function syncRail(st, res) {
    if (!res) return;
    function set(id, html, status, frac, color) {
      var row = document.getElementById('ro-' + id); if (!row) return;
      row.querySelector('.v').innerHTML = html;
      row.querySelector('.st').innerHTML = status || '';
      var m = row.querySelector('.meter i');
      m.style.width = Math.max(0, Math.min(1, frac)) * 100 + '%';
      if (color) m.style.background = color;
    }
    var p = res.psi.leafOut;
    var pw = p > -0.5 ? 'little tension' : (p > -1.2 ? 'under tension' : 'strong tension');
    set('psi', num(p, 2) + ' <small>MPa</small>', '<span class="tier-1-only">the leaf is under ' + num(-p, 2) + ' MPa of tension (pulling); </span>' + pw,
      Math.min(1, -p / 3), ui.water(p));
    set('stem', num(res.psi.stem, 2) + ' <small>MPa</small>', 'leaf ' + num(Math.abs(Math.round(100 * res.psi.stem) - Math.round(100 * p)) / 100, 2) + ' MPa more negative than the stem', Math.min(1, -res.psi.stem / 3), ui.water(res.psi.stem));
    var sto = ui.stomata(res);
    set('gs', num(res.gs, 3) + ' <small>mol m⁻² s⁻¹</small>',
      num(sto.pct, 0) + ' % of its maximum (' + sto.word + ')',
      res.gsMax ? res.gs / res.gsMax : 0);
    set('E', num(res.E, 2) + ' <small>mmol m⁻² s⁻¹</small>', '<span class="tier-2">VPD ' + num(res.VPD, 2) + ' kPa; cuticle and leaky stomata ' + num(res.Emin === undefined ? 0 : res.Emin, 2) + ' mmol m⁻² s⁻¹</span><span class="tier-1-only">air dryness ' + num(res.VPD, 2) + ' kPa</span>', Math.min(1, res.E / 8));
    var kp = res.KleafPct === undefined ? 100 : Math.min(100, res.KleafPct);
    set('K', num(res.K.leaf, 1) + ' <small>mmol m⁻² s⁻¹ MPa⁻¹</small>', 'K<sub>leaf</sub> ' + num(kp, 0) + ' % of its maximum<br><span class="tier-2">Outside xylem pathway: ' + num(Math.min(100, 100 * (res.fKox === undefined ? 1 : res.fKox)), 0) + ' % of its maximum; P<sub>f</sub> ' + num(res.Pf, 0) + ' µm s⁻¹</span>', Math.min(1, kp / 100));
    // r5 (designer panel item 1): the passport of "your molecule", the gold one in every animation
    var pass = document.getElementById('ro-pass');
    if (pass) {
      var lv = st.level, here = { 1: 'leaf', 2: 'all', 3: 'stem', 4: 'leaf', 5: 'leaf', 5.5: 'all', 6: 'leaf' }[lv] || 'all';
      var stops = [['soil', res.psi.soil], ['root', res.psi.root], ['stem', res.psi.stem], ['leaf', res.psi.leafOut]];
      pass.innerHTML = '<p class="pk"><span class="dot" aria-hidden="true"></span>Your molecule <span class="tier-2">(gold in every animation)</span></p>' +
        '<p class="pv">' + stops.map(function (q) { return '<span class="' + (here === q[0] || here === 'all' || (here === 'stem' && q[0] === 'root') ? 'on' : '') + '">' + q[0] + ' ' + num(q[1], 2) + '</span>'; }).join(' <span aria-hidden="true">→</span> ') + ' MPa</p>' +
        '<p class="pe tier-2">Next: the air, at ' + num(res.psiAir, 0) + ' MPa. Most molecules leave through a stoma; about 1 in 60 to 1 in 100 is split in a chloroplast to feed photosynthesis instead ' + ui.badge('DERIVED', '2 water molecules split per CO2 fixed (4 electrons) against about 188 transpired per CO2 by the default leaf of Light to sugar, Light V: 2 ÷ 190 ≈ 1 in 100; counting the electrons photorespiration uses gives about 1 in 60, the live number on Light V.') + ' <a href="../light/index.html#thylakoid">Follow it into Light to sugar</a></p>';
    }
    var w = document.getElementById('ro-warn');
    var msgs = (res.warnings || []).slice();
    if (res.converged === false) msgs.unshift('The solver did not converge for these settings.');
    w.hidden = !msgs.length; w.textContent = msgs.join(' ');
    var n = document.getElementById('ro-note');
    if (n) n.innerHTML = 'Ψ<sub>air</sub> ' + WP.fmt.psi(res.psiAir, 1) + ' ' + ui.badge('DERIVED', 'Ψair = (R T ÷ Vw) ln(RH ÷ 100).') +
      '<br>Leaf temperature is held at air temperature, and wind does not enter E (perfect coupling). Both are model assumptions.';
  }

  /* ---------- footer ---------- */
  shell.renderFooter = function () {
    var f = document.getElementById('wp-foot');
    var dois = Object.keys(usedDois).filter(function (d) { return WP.SPEC.sources[d]; });
    dois.sort(function (a, b) { return WP.SPEC.sources[a].label.localeCompare(WP.SPEC.sources[b].label); });
    var B = ['VERIFIED', 'MEASURED', 'DERIVED', 'ILLUSTRATIVE', 'PREPRINT', 'PRELIMINARY', 'UNVERIFIED', 'OPEN QUESTION'];
    f.innerHTML =
      '<h2 id="wp-badges" tabindex="-1">How to read the badges</h2><ul class="legend">' +
      B.map(function (k) { return '<li>' + ui.badge(k) + ' ' + esc(BADGE_INFO[k]) + '</li>'; }).join('') + '</ul>' +
      '<p style="margin:10px 0 0">Every number on these plates carries one of these badges. Model outputs are computed from illustrative constants, so they show directions and shapes, not measurements of any field or vine. Claims still under study are written as questions.</p>' +
      '<details><summary><h2 style="margin:0">Sources cited on this page (' + dois.length + ')</h2></summary>' +
      '<ul class="srclist">' + dois.map(function (d) {
        var s = WP.SPEC.sources[d];
        return '<li>' + esc(s.label) + '. ' + ui.badge(s.status) + ' <a href="https://doi.org/' + encodeURI(d) + '" target="_blank" rel="noopener">doi ' + esc(d) + '</a></li>';
      }).join('') + '</ul></details>' +
      '<p class="draft">Private draft, not for distribution</p>' +
      '<p style="margin:10px 0 0">The Water Path v8, a plant physiology learning tool. © 2026 Dr Caetano Albuquerque · Albuquerque Lab. An independent teaching resource, not an official university publication. ' +
      'All drawings were made for this exhibit. No textbook figures and no BioRender elements are used.</p>';
  };

  /* ------------------------------------------------------------ sections and routing */
  shell.addSection = function (L) {
    var m = metaOf(L.n);
    var sec = document.createElement('section');
    sec.className = 'level';
    sec.id = 'lv-sec-' + String(L.n).replace('.', '_'); // 5.5 (species) becomes lv-sec-5_5, a valid selector
    sec.hidden = true;
    sec.setAttribute('role', 'tabpanel');
    sec.setAttribute('aria-labelledby', 'tab-' + (m ? m.hash : L.id));
    var inner = document.createElement('div');
    inner.id = 'lv-' + L.id;
    inner.className = 'level-body';
    var hd = document.createElement('header');
    hd.className = 'level-hd';
    var plateName = m && m.rn ? 'Water ' + m.rn + ' · ' : (m && m.hash === 'afternoon' ? 'Water · ' : '');   /* final fixer r9: module prefix, one separator (Q-visual R8 MAJOR 4) */
    hd.innerHTML = '<h2 class="level-no">' + esc(plateName + (L.title || (m && m.name) || '')) + '</h2>' +
      '<span class="level-sp">' + esc(L.subtitle || (m ? m.sp : '')) + ', scale ' + esc(L.scale || (m && m.scale) || '') + '</span>';
    sec.appendChild(hd);
    if (L.n <= 6) {
      var bh = document.createElement('p'); bh.className = 'badgehelp';
      bh.innerHTML = '<a href="#wp-badges">What do the badges mean?</a>';
      bh.firstChild.addEventListener('click', function (e) { e.preventDefault(); var t = document.getElementById('wp-badges'); if (t) { t.scrollIntoView({ block: 'start' }); t.focus({ preventScroll: true }); } });
      hd.appendChild(bh);
    }
    var qk = L.n <= 6 && ui.quick ? ui.quick(L.n) : null;
    if (qk) sec.appendChild(qk);
    sec.appendChild(inner);
    if (WP.LIB && L.n <= 6) sec.appendChild(WP.LIB.strip(L.n));
    // next plate in site order: Field, Plant, Organ, Tissue, Membrane, Species, Afternoon (then Light to sugar, or back to the Field)
    var ORDER = [1, 2, 3, 4, 5, 5.5, 6], oi = ORDER.indexOf(L.n);
    var nx = L.n === 7 || oi < 0 ? null : metaOf(ORDER[(oi + 1) % ORDER.length]);
    if (nx) {
      var nav = document.createElement('p');
      nav.className = 'wp-next';
      var lab = L.n === 5.5 ? 'Go to your Salinas afternoon' : (L.n === 6 ? 'Back to Water I, the Field' : (nx.n === 5.5 ? 'Next: Water VI, California and beyond' : 'Next: Water ' + nx.rn + ', the ' + nx.name));
      nav.innerHTML = '<a href="#' + nx.hash + '" data-next="' + nx.n + '">' + esc(lab) + ' <span aria-hidden="true">&#8594;</span></a>';
      nav.querySelector('a').addEventListener('click', function (e) {
        e.preventDefault(); go(nx.n, true);
        try { document.getElementById('wp-tabs').scrollIntoView({ block: 'start', behavior: ui.reducedMotion() ? 'auto' : 'smooth' }); } catch (er) { /* old browser */ }
      });
      sec.appendChild(nav);
      // r7 unifier, one site one order: after the Afternoon the site continues into Light to sugar
      if (L.n === 6) {
        nav.firstChild.textContent = 'Or start again at Water I, the Field ';
        var lt = document.createElement('p'); lt.className = 'wp-next';
        lt.innerHTML = '<a href="../light/index.html#sun">Next: Light to sugar, Light I, the Sun <span aria-hidden="true">&#8594;</span></a>';
        sec.insertBefore(lt, nav);
      }
    }
    document.getElementById('wp-stage').appendChild(sec);
    sections[L.n] = { sec: sec, body: inner, level: L, mounted: false, dirty: true };
    return sections[L.n];
  };
  shell.addPending = function (n) {
    var m = metaOf(n);
    var L = { id: m.hash, n: n, title: 'The ' + m.name, scale: m.scale, pending: true };
    var s = shell.addSection(L);
    s.body.innerHTML = '<p class="level-pending">This plate is still being engraved. Its file has not loaded yet.</p>';
    s.mounted = true; s.dirty = false;
    return s;
  };
  shell.update = function (st, res) {
    syncTier();
    DESIGNS.forEach(function (d) { var n = document.getElementById(d.id); if (n && n.offsetParent !== null) { try { n.innerHTML = d.fn(); } catch (e) { /* keep the last text */ } } });
    syncConditions(st);
    syncRail(st, res);
    Object.keys(sections).forEach(function (n) {
      var s = sections[n];
      if (!s.mounted || s.level.pending) return;
      if (+n === current) runUpdate(s, st, res); else s.dirty = true;
    });
    scheduleMinText();
  };
  function runUpdate(s, st, res) {
    if (typeof s.level.update !== 'function') return;
    try { s.level.update(st || WP.state, res || WP.result); s.dirty = false; }
    catch (e) { console.error('level ' + s.level.id + ' update failed', e); }
  }

  var animating = null;
  function go(n, pushHash) {
    var m = metaOf(n);
    if (!m) return;
    if (pushHash && m.hash === 'library' && /^#\//.test(location.hash)) pushHash = false;
    if (pushHash && location.hash.replace(/^#\/?/, '') !== m.hash) {
      if (history.pushState) history.pushState(null, '', '#' + m.hash); else location.hash = m.hash;
    }
    show(n);
  }
  shell.go = go;
  ui.go = function (hashOrN) { var m = typeof hashOrN === 'number' ? metaOf(hashOrN) : metaOfHash(hashOrN); if (m) go(m.n, true); };

  function show(n) {
    if (n === current) return;
    var inn = sections[n]; if (!inn) return;
    var out = sections[current];
    var prevN = current;
    current = n;
    // tabs
    Array.prototype.forEach.call(document.querySelectorAll('.wp-tab'), function (b) {
      var on = +b.dataset.n === n;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
    });
    var m = metaOf(n);
    document.title = 'The Water Path v8 · ' + (m.rn ? m.rn + ' ' : '') + m.name;
    setScale(inn.level.scale || m.scale, !!out);
    if (WP.state && WP.state.level !== n) WP.set({ level: n });
    if (inn.dirty) runUpdate(inn);
    if (typeof inn.level.show === 'function') { try { inn.level.show(); } catch (e) { console.error(e); } }
    if (out && typeof out.level.hide === 'function') { try { out.level.hide(); } catch (e) { console.error(e); } }
    if (CM.on) setTimeout(cmRebuild, 700);
    scheduleMinText(); setTimeout(scheduleMinText, 700);

    var stage = document.getElementById('wp-stage');
    // keep the stage top in view
    var bar = document.querySelector('.wp-bar');
    var top = stage.getBoundingClientRect().top + window.pageYOffset - (bar ? bar.offsetHeight : 0) - 8;
    if (window.pageYOffset > top) window.scrollTo(0, top);

    if (animating) { animating.forEach(function (a) { try { a.finish(); } catch (e) { /* done */ } }); animating = null; }
    if (!out || ui.reducedMotion() || !inn.sec.animate) {
      if (out) out.sec.hidden = true;
      inn.sec.hidden = false;
      return;
    }
    var dirIn = n > prevN;                // diving deeper
    var focusL = dirIn ? out.level : inn.level;
    var fx = (focusL.focus && focusL.focus[0] != null ? focusL.focus[0] : 50) + '%';
    var fy = (focusL.focus && focusL.focus[1] != null ? focusL.focus[1] : 30) + '%';
    var h0 = out.sec.offsetHeight;
    inn.sec.hidden = false;
    var h1 = inn.sec.offsetHeight;
    stage.classList.add('animating');
    stage.style.height = Math.max(h0, h1, 200) + 'px';
    out.sec.classList.add('anim');
    var D = 640, ease = 'cubic-bezier(.3,.6,.2,1)';
    out.sec.style.transformOrigin = fx + ' ' + fy;
    inn.sec.style.transformOrigin = fx + ' ' + fy;
    var a1 = out.sec.animate(dirIn ?
      [{ transform: 'scale(1)', opacity: 1, filter: 'blur(0px)' }, { transform: 'scale(2.4)', opacity: 0, filter: 'blur(8px)' }] :
      [{ transform: 'scale(1)', opacity: 1, filter: 'blur(0px)', clipPath: 'circle(120% at ' + fx + ' ' + fy + ')' },
       { transform: 'scale(0.55)', opacity: 0, filter: 'blur(6px)', clipPath: 'circle(18% at ' + fx + ' ' + fy + ')' }],
      { duration: D, easing: ease, fill: 'forwards' });
    var a2 = inn.sec.animate(dirIn ?
      [{ transform: 'scale(0.5)', opacity: 0, filter: 'blur(6px)', clipPath: 'circle(10% at ' + fx + ' ' + fy + ')' },
       { transform: 'scale(1)', opacity: 1, filter: 'blur(0px)', clipPath: 'circle(150% at ' + fx + ' ' + fy + ')' }] :
      [{ transform: 'scale(2.2)', opacity: 0, filter: 'blur(8px)' }, { transform: 'scale(1)', opacity: 1, filter: 'blur(0px)' }],
      { duration: D, easing: ease });
    animating = [a1, a2];
    a2.onfinish = a2.oncancel = function () {
      out.sec.hidden = true;
      out.sec.classList.remove('anim');
      try { a1.cancel(); } catch (e) { /* done */ }
      inn.sec.style.transformOrigin = '';
      stage.classList.remove('animating');
      stage.style.height = '';
      animating = null;
    };
  }
  function routeHash() { var m = metaOfHash(location.hash); if (m) { show(m.n); if (m.n === 7 && WP.LIB) WP.LIB.fromHash(location.hash); } }
  window.addEventListener('hashchange', routeHash);
  window.addEventListener('popstate', routeHash);
  shell.start = function () {
    Object.keys(sections).forEach(function (n) { if (+n <= 6) { try { glossify(sections[n].body); } catch (e) { console.error(e); } } });
    markEvidence(document);
    var m = metaOfHash(location.hash) || META[0];
    show(m.n);
    if (m.n === 7 && WP.LIB) WP.LIB.fromHash(location.hash);
  };


  /* ------------------------------------------------------------ Symbols (restored from the original site) and glossary terms
     SYMBOLS: the original Symbols table, with two leaf model percentages removed because Plate IV now uses the
     Buckley 2015 ranges; four entries added for v8 (gmin, Pf, pOpen, NDVI). GLOSS: the first use of each term on a
     plate becomes a focusable dfn that opens a short definition. */
  var SYMBOLS = {"psi": {"s": "Ψ<sub>w</sub>", "n": "water potential", "u": "MPa", "d": "Free energy of water per unit volume, relative to pure water at atmospheric pressure, which is 0. Water moves toward more negative values."}, "psis": {"s": "Ψ<sub>s</sub>", "n": "osmotic potential", "u": "MPa, always ≤ 0", "d": "The part of water potential set by dissolved solutes. More solute, more negative."}, "psip": {"s": "Ψ<sub>p</sub>", "n": "pressure potential, turgor", "u": "MPa", "d": "Positive inside a living cell pressing on its wall. Negative in xylem under tension."}, "po": {"s": "π<sub>o</sub>", "n": "osmotic potential at full turgor", "u": "MPa", "d": "Ψs of a fully hydrated cell. The main driver of the turgor loss point."}, "tlp": {"s": "π<sub>tlp</sub>", "n": "turgor loss point", "u": "MPa", "d": "The water potential at which turgor reaches zero. Wilting is a visible symptom that may or may not follow."}, "eps": {"s": "ε", "n": "bulk elastic modulus", "u": "MPa", "d": "Wall stiffness: turgor lost per unit fraction of cell water lost. Sets how much water a cell loses before turgor loss, and only nudges the potential."}, "rwc": {"s": "RWC", "n": "relative water content", "u": "%", "d": "Water held as a share of the water at full hydration."}, "es": {"s": "e<sub>s</sub>", "n": "saturation vapour pressure", "u": "kPa", "d": "The most water vapour air can hold at a given temperature. Roughly doubles every 11 to 12 °C."}, "ea": {"s": "e<sub>a</sub>", "n": "actual vapour pressure", "u": "kPa", "d": "How much vapour the air holds. Equals e<sub>s</sub> at the dew point."}, "vpd": {"s": "VPD", "n": "vapour pressure deficit", "u": "kPa", "d": "e<sub>s</sub> − e<sub>a</sub>. The drying power of the air. Leaf to air VPD uses e<sub>s</sub> at leaf temperature."}, "eto": {"s": "ETo", "n": "reference evapotranspiration", "u": "mm day⁻¹ or in month⁻¹", "d": "Water lost by a well-watered reference grass. Combines VPD, radiation, wind and temperature."}, "theta": {"s": "θ", "n": "volumetric soil water content", "u": "cm³ cm⁻³", "d": "Water volume per soil volume. The same θ can mean very different Ψ<sub>soil</sub> in sand and clay."}, "fc": {"s": "FC", "n": "field capacity", "u": "MPa", "d": "By convention −0.033 MPa (−0.01 for coarse soils): soil after free drainage."}, "pwp": {"s": "PWP", "n": "permanent wilting point", "u": "MPa", "d": "By convention −1.5 MPa, from sunflower wilting (Richards and Weaver 1944). A convention, not a crop threshold."}, "paw": {"s": "PAW", "n": "plant-available water", "u": "mm per m of soil", "d": "Water held between field capacity and the wilting point convention, as a depth of water per depth of soil. Multiply by rooting depth for the size of the store. It depends on which field capacity you use, so it is a property of the method as much as of the soil."}, "vg": {"s": "van Genuchten", "n": "soil water retention curve", "u": "θ against MPa", "d": "θ(Ψ) = θ<sub>r</sub> + (θ<sub>s</sub> − θ<sub>r</sub>) [1 + (αh)<sup>n</sup>]<sup>−m</sup>, m = 1 − 1/n. Four parameters per soil class. The same θ means very different Ψ in a sandy loam and a clay loam, and this equation is why."}, "lai": {"s": "LAI", "n": "leaf area index", "u": "m² leaf per m² ground", "d": "How much leaf a crop carries over each square metre of ground. It converts transpiration per unit leaf area into millimetres of water lost from the field."}, "gs": {"s": "g<sub>s</sub>", "n": "stomatal conductance", "u": "mol m⁻² s⁻¹", "d": "How open the stomata are, as a conductance to water vapour."}, "E": {"s": "E", "n": "transpiration rate", "u": "mmol m⁻² s⁻¹", "d": "Water vapour leaving per leaf area per second. Roughly g<sub>s</sub> × VPD ÷ air pressure."}, "K": {"s": "K", "n": "hydraulic conductance", "u": "mmol m⁻² s⁻¹ MPa⁻¹", "d": "Flow per unit driving force. Flow = K × ΔΨ."}, "bsheath": {"s": "bundle sheath", "n": "the layer around a vein", "u": "", "d": "One layer of cells wrapping each vein. Every molecule of water leaving the xylem crosses it, which makes it the gatekeeper between the vein and the mesophyll and the best current candidate for where leaf hydraulic conductance is controlled."}, "oxylem": {"s": "K<sub>ox</sub>", "n": "outside-xylem conductance", "u": "mmol m⁻² s⁻¹ MPa⁻¹", "d": "The part of leaf hydraulic conductance that is not the vein xylem: bundle sheath, living cells, walls and the air space. In many leaves it is the larger half, and it fails first."}, "apo": {"s": "apoplastic", "n": "through the walls", "u": "", "d": "Water moving in the cell walls and the spaces between cells, never crossing a membrane."}, "sym": {"s": "symplastic", "n": "cell to cell through plasmodesmata", "u": "", "d": "Water moving from one living cell to the next through the pores that join their cytoplasm, without crossing the plasma membrane."}, "trans": {"s": "transmembrane", "n": "across the membranes", "u": "", "d": "Water crossing plasma membranes cell by cell, largely through aquaporins. It is the route a plant can regulate fastest."}, "kleaf": {"s": "K<sub>leaf</sub>", "n": "leaf hydraulic conductance", "u": "mmol m⁻² s⁻¹ MPa⁻¹", "d": "Conductance from petiole to evaporating sites, through xylem and then living cells."}, "plc": {"s": "PLC", "n": "percent loss of conductivity", "u": "%", "d": "100 × (1 − K ÷ K<sub>max</sub>). What a vulnerability curve plots."}, "p50": {"s": "P<sub>12</sub> · P<sub>50</sub> · P<sub>88</sub>", "n": "vulnerability thresholds", "u": "MPa", "d": "Xylem water potential at 12, 50 and 88 % PLC. With slope s at P<sub>50</sub>: P<sub>12</sub> = P<sub>50</sub> + 50/s, P<sub>88</sub> = P<sub>50</sub> − 50/s."}, "hsm": {"s": "HSM", "n": "hydraulic safety margin", "u": "MPa", "d": "Seasonal minimum Ψ minus P<sub>50</sub> (or P<sub>88</sub>). Small or negative means living close to failure."}, "cav": {"s": "cavitation", "n": "the event", "u": "", "d": "Rapid formation of a gas void in water under tension."}, "emb": {"s": "embolism", "n": "the state", "u": "", "d": "A conduit filled with gas that no longer conducts water."}, "seed": {"s": "air seeding", "n": "mechanism", "u": "", "d": "Air pulled through a pit membrane pore from an embolised conduit into a water-filled one. ΔP = 4T/D."}, "pitmem": {"s": "pit membrane", "n": "the sheet between two conduits", "u": "", "d": "Where two conduits touch, the thick wall is missing and only a thin porous sheet is left. Water crosses it freely; air is meant not to."}, "pitap": {"s": "pit aperture", "n": "the mouth of a pit", "u": "", "d": "The opening on each side of a pit, where the wall arches over and leaves a gap into the conduit."}, "torus": {"s": "torus", "n": "the disc in a conifer pit", "u": "", "d": "A thick solid patch in the middle of a conifer pit membrane. It has no pores, so nothing goes through it."}, "margo": {"s": "margo", "n": "the web around the torus", "u": "", "d": "The open mesh of strands holding the torus in place, in conifers. Nearly all the water goes through this mesh, and the mesh also slows it down."}, "aspir": {"s": "aspiration", "n": "the valve closing", "u": "", "d": "When the pressure on one side of a conifer pit is much lower, the torus is pushed across and plugs the opening. The gas-filled tracheid is then shut off from its neighbour."}, "rarepit": {"s": "rare pit", "n": "hypothesis", "u": "", "d": "A conduit breaks at its single leakiest pore, so a conduit with more pit membrane has more chances of owning a bad one and fails sooner."}, "Y": {"s": "Y", "n": "yield threshold", "u": "MPa", "d": "The turgor a growing wall must exceed before it extends irreversibly. The cell can adjust it within minutes."}, "phi": {"s": "φ", "n": "wall extensibility", "u": "MPa⁻¹ h⁻¹", "d": "How fast the wall extends per MPa of turgor above Y."}, "oa": {"s": "OA", "n": "osmotic adjustment", "u": "MPa", "d": "Accumulating solutes so π<sub>o</sub> becomes more negative and turgor holds at more negative Ψ. In grapevine it follows the season."}, "cyto": {"s": "cytorrhysis", "n": "wall collapse", "u": "", "d": "A cell drying in air: wall and protoplast shrink together. Plasmolysis needs an outside solution: it happens in salt solutions and on slides, rarely in a drying leaf."}, "conduit": {"s": "conduit", "n": "a vessel or a tracheid", "u": "", "d": "One dead, hollow cell of the xylem that water moves through. In a grapevine petiole they are vessels. Dead is the normal state: it is what makes the tube."}, "lumen": {"s": "lumen", "n": "the space inside a conduit or cell", "u": "", "d": "The bore the wall encloses. The wall reads bright whatever the lumen holds; only the lumen's grey tells you water or gas."}, "pith": {"s": "pith", "n": "the centre of the petiole", "u": "", "d": "A lattice of large, thin-walled living cells inside the ring of vascular bundles. Not xylem, and it is a region of its own."}, "pithgas": {"s": "dry pith", "n": "gas-filled pith", "u": "", "d": "A pith cell whose lumen reads dark because it holds gas, not water."}, "fibrecap": {"s": "fibre cap", "n": "the bright block outboard of the phloem", "u": "", "d": "Thick-walled fibres on the outer face of each bundle. Bright and dense right through, with no lumen to call. Use it to find a bundle."}, "paren": {"s": "parenchyma", "n": "thin-walled ground tissue", "u": "", "d": "Living cells filling the space between bundles and between the bundles and the epidermis. Thin walls, irregular shapes, no bright ring."}, "phloem": {"s": "phloem", "n": "the sugar-conducting tissue", "u": "", "d": "Small, thin-walled cells on the outer side of each bundle, between the xylem and the fibre cap. It sits like an eyebrow above the eye."}, "gmin": {"s": "g<sub>min</sub>", "n": "minimum (cuticular) conductance", "u": "mol m⁻² s⁻¹", "d": "Water loss with the stomata as shut as they get: through the cuticle and leaky stomata. E = (g<sub>s</sub> + g<sub>min</sub>) × VPD ÷ P<sub>atm</sub>, so a leaf still loses water in the dark."}, "pf": {"s": "P<sub>f</sub>", "n": "osmotic water permeability of a membrane", "u": "µm s⁻¹", "d": "How easily water crosses a membrane under an osmotic gradient; aquaporins raise it."}, "popen": {"s": "p<sub>open</sub>", "n": "share of aquaporin gates open", "u": "0 to 1", "d": "In the model on this site: the product of phosphorylation, cytosolic pH and Ca²⁺ factors. A teaching form, not a measured number."}, "ndvi": {"s": "NDVI", "n": "normalized difference vegetation index", "u": "none", "d": "(NIR − red) ÷ (NIR + red) from a camera or satellite. Tracks greenness and leaf area, not the stomata on a given afternoon."}};
  var GLOSS = [
    [/Ψ/, 'psi'], [/\bVPD\b/, 'vpd'], [/\bP50\b/, 'p50'], [/\bPLC\b/, 'plc'], [/\bNDVI\b/, 'ndvi'], [/\bETo\b/, 'eto'],
    [/\bapoplast(?:ic)?\b/i, 'apo'], [/\bsymplast(?:ic)?\b/i, 'sym'], [/\btransmembrane\b/i, 'trans'], [/\bstomatal conductance\b/i, 'gs'],
    [/\bleaf hydraulic conductance\b/i, 'kleaf'], [/\btranspiration\b/i, 'E'], [/\bbundle sheath\b/i, 'bsheath'], [/\bturgor loss point\b/i, 'tlp'],
    [/\bembolism\b/i, 'emb'], [/\bair seeding\b/i, 'seed'], [/\bpit membrane\b/i, 'pitmem'], [/\bcuticle\b/i, 'gmin'], [/\bosmotic potential\b/i, 'psis'], [/\bturgor\b/i, 'psip']
  ];
  function glossify(root) {
    if (!root) return;
    var done = {}, SKIP = /^(SCRIPT|STYLE|BUTTON|H1|H2|H3|H4|H5|LABEL|OPTION|TEXTAREA|SELECT|A|DFN|SUMMARY|OUTPUT|CODE)$/;
    var tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: function (n) {
      for (var p = n.parentNode; p && p !== root; p = p.parentNode) {
        if (p.nodeType !== 1) continue;
        if (SKIP.test(p.tagName) || p.namespaceURI === 'http://www.w3.org/2000/svg' || (p.classList && (p.classList.contains('badge') || p.classList.contains('wpev') || p.classList.contains('ev') || p.classList.contains('eq') || p.classList.contains('wpev-drawer') || p.classList.contains('ev-drawer'))) || p.getAttribute('aria-live')) return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    } });
    var nodes = []; while (tw.nextNode()) nodes.push(tw.currentNode);
    GLOSS.forEach(function (g) {
      if (done[g[1]] || !SYMBOLS[g[1]]) return;
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i], m = g[0].exec(n.nodeValue);
        if (!m) continue;
        var after = n.splitText(m.index), rest = after.splitText(m[0].length);
        var d = document.createElement('dfn');
        d.className = 'wpdfn'; d.tabIndex = 0; d.setAttribute('role', 'button'); d.setAttribute('aria-expanded', 'false'); d.dataset.g = g[1];
        d.textContent = after.nodeValue; after.parentNode.replaceChild(d, after);
        nodes.splice(i, 1, n, rest);
        done[g[1]] = 1; break;
      }
    });
  }
  ui.glossify = glossify;
  /* one evidence chip style everywhere: every evidence button gets .evc and a dot in its badge colour */
  function markEvidence(root) {
    Array.prototype.forEach.call(root.querySelectorAll('button.ev,button.wpev,button.t4-evb,button.m5-evb'), function (b) {
      b.classList.add('evc');
      var k = b.getAttribute('data-ev') || b.getAttribute('data-wpev') || b.getAttribute('data-key');
      var e = k && WP.evidence ? WP.evidence[k] : null;
      if (e && e.badge) b.setAttribute('data-b', String(e.badge).toUpperCase());
    });
  }
  ui.markEvidence = markEvidence;
  var meT = 0;
  if (window.MutationObserver) new MutationObserver(function () { clearTimeout(meT); meT = setTimeout(function () { markEvidence(document); }, 120); }).observe(document.documentElement, { childList: true, subtree: true });
  var tipEl = null;
  function closeTip() { if (tipEl) { tipEl.remove(); tipEl = null; } Array.prototype.forEach.call(document.querySelectorAll('dfn.wpdfn[aria-expanded="true"]'), function (x) { x.setAttribute('aria-expanded', 'false'); }); }
  function openTip(d) {
    var g = SYMBOLS[d.dataset.g]; if (!g) return;
    closeTip();
    tipEl = document.createElement('div'); tipEl.className = 'wptip'; tipEl.setAttribute('role', 'note');
    tipEl.innerHTML = '<b>' + g.s + '</b> ' + g.n + (g.u ? ' <span class="u">' + g.u + '</span>' : '') + '<br>' + g.d;
    document.body.appendChild(tipEl);
    var r = d.getBoundingClientRect(), w = Math.min(320, window.innerWidth - 24);
    tipEl.style.width = w + 'px';
    tipEl.style.left = Math.max(12, Math.min(window.innerWidth - w - 12, r.left + window.pageXOffset)) + 'px';
    tipEl.style.top = (r.bottom + window.pageYOffset + 6) + 'px';
    d.setAttribute('aria-expanded', 'true');
  }
  document.addEventListener('click', function (e) {
    var d = e.target.closest && e.target.closest('dfn.wpdfn');
    if (d) { if (d.getAttribute('aria-expanded') === 'true') closeTip(); else openTip(d); return; }
    if (tipEl && !tipEl.contains(e.target)) closeTip();
  });
  document.addEventListener('keydown', function (e) {
    var d = e.target.closest && e.target.closest('dfn.wpdfn');
    if (d && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); if (d.getAttribute('aria-expanded') === 'true') closeTip(); else openTip(d); }
    else if (e.key === 'Escape' && tipEl) closeTip();
  });
  function symbolsTable() {
    return '<section class="lib-sym" aria-labelledby="lib-sym-h" id="symbols"><h3 id="lib-sym-h">Symbols and units</h3>' +
      '<p class="lib-note">Every symbol, its unit, and which way its sign runs. −1.5 is more negative than −0.5. Across a membrane, water moves toward more negative water potential; in the xylem it moves toward more negative pressure. 1 MPa = 10 bar = 1000 kPa.</p>' +
      '<div class="lib-tw"><table class="lib-ct"><thead><tr><th scope="col">Symbol</th><th scope="col">Name</th><th scope="col">Unit</th><th scope="col">Meaning</th></tr></thead><tbody>' +
      Object.keys(SYMBOLS).map(function (k) { var g = SYMBOLS[k]; return '<tr id="sym-' + k + '"><td style="font-weight:600;white-space:nowrap">' + g.s + '</td><td>' + g.n + '</td><td class="num" style="font-size:12px">' + (g.u || '') + '</td><td>' + g.d + '</td></tr>'; }).join('') +
      '</tbody></table></div></section>';
  }

  /* ------------------------------------------------------------ Library: the original Water Path (v7), ported whole
     The full Water Path (the main page one folder up, ../index.html) is mounted in a same origin frame, so its styles stay
     scoped and its own anchors (#/route#fig-id) still resolve. Old links to the live site keep working: any hash in the
     v7 form opens the Library at that plate. */
  var LIVE = '../index.html';
  var LIBCAT = [
    { g: 'Water potential, turgor and growth', items: [
      ['4.1', 'Lockhart, with one modelled day of turgor', 'growth', 'fig-growth-lockhart'],
      ['4.2', 'What stops first as a plant dries', 'growth', 'fig-growth-ladder'],
      ['', 'Water potential and turgor, the interactive page', 'turgor', ''] ] },
    { g: 'Demand: the sky pulls', items: [
      ['5.1', 'The VPD calculator', 'demand', 'fig-demand-vpd'],
      ['5.2', 'ETo by Salinas station: the towel on the line', 'demand', 'fig-demand-eto'],
      ['5.3', 'Denmead and Shaw 1962: the wilting point moves with the weather', 'demand', 'fig-demand-ds'],
      ['5.4', 'Two plants, one day', 'demand', 'fig-demand-day'] ] },
    { g: 'Embolism', items: [
      ['6.1', 'Vulnerability curves of a real grapevine', 'embolism', 'fig-embolism-curve'],
      ['6.2', 'The order of failure in a grapevine leaf', 'embolism', 'fig-embolism-seq'],
      ['6.3', 'The hydraulic safety margin', 'embolism', 'fig-embolism-hsm'],
      ['6.4', 'Why wide vessels matter most', 'embolism', 'fig-embolism-r4'],
      ['6.5', 'The pit membrane sets the breaking point', 'embolism', 'fig-embolism-seed'],
      ['', 'How do we know? Methods and fights (Go deeper, end of the embolism page)', 'embolism', ''] ] },
    { g: 'Enrichment: how a conduit fails', items: [
      ['E.1', 'Air seeding, live', 'fail', 'fig-fail-seeding'],
      ['E.2', 'Two ways to build a pit membrane', 'fail', 'fig-fail-pit'],
      ['E.3', 'The rare pit hypothesis', 'fail', 'fig-fail-rare'],
      ['E.4', 'Thirteen measured P50 values, one axis, by method', 'fail', 'fig-fail-curves'],
      ['E.5', 'One species, one lab, three methods', 'fail', 'fig-fail-method'],
      ['E.6', 'Embolism spreads in sectors, not at random', 'fail', 'fig-fail-sector'],
      ['E.7', 'Dry a stem and the curve draws itself', 'fail', 'fig-fail-dry'] ] },
    { g: 'Where water leaves', items: [
      ['L.1', 'Where does the water actually leave? Two readings of the same anatomy', 'leaf', 'fig-leaf-anatomy'],
      ['L.2', 'Dry a grapevine leaf: the veins go last', 'leaf', 'fig-leaf-dry'] ] },
    { g: 'A season in one field', items: [
      ['F.1', 'Run the season', 'field', 'fig-field-season'],
      ['F.2', 'The day inside the day', 'field', 'fig-field-day'],
      ['F.3', 'Does the same wet soil mean the same thing on every day?', 'field', 'fig-field-ds'] ] },
    { g: 'Practice and reference', items: [
      ['', 'Test yourself, three tiers', 'quiz', ''],
      ['', 'Symbols', 'symbols', ''],
      ['', 'Sources, and the colour vision check', 'sources', ''],
      ['', 'Tell us what is wrong with this: feedback form', 'feedback', ''],
      ['', 'Map', 'map', ''],
      ['', 'Read a section', 'anatomy', ''] ] }
  ];
  var LIBSTRIP = {
    1: ['5.1', '5.2', '5.3', 'F.1'],
    2: ['5.4', '4.2', '6.2'],
    3: ['6.1', 'E.4', 'E.5', 'E.6'],
    4: ['L.1', 'L.2', '4.1'],
    5: ['4.1', 'L.1', 'E.1'],
    6: ['F.1', 'F.2', 'F.3', '5.4']
  };
  /* What is new: newest first. Dates are ISO so the tab dot can test age. */
  var NEWS = [
    { d: '2026-10-07', t: 'Science and evidence pass: grapevine stomata now follow a curve that is fully open at 0 MPa; a well watered vine reads as unstressed; cuticular water loss (gmin) is separate from the stomata; blue light acts only when there is light; per organ vulnerability slopes and root xylem vulnerability for grapevine; new published points (Charrier 2016, Brodersen 2013, Cuneo 2016); How to measure cards with methods papers; open questions on models of the leaf, refilling, stomatal control and Ca²⁺; three mystery plants by depth; the MDPI secondary source replaced by primary structure papers.' },
    { d: '2026-10-07', t: 'The Water Path v8 draft: five plates (Field, Plant, Organ, Tissue, Membrane) and your Salinas afternoon, each at three depths. Water potential terraces now climb with the plant, soil at the bottom and air at the top. Leaf sections show palisade and spongy mesophyll, walls (apoplast) and plasma membranes as separate lines. A new trained grapevine, romaine head and open vase almond, with water moving through roots, trunk, shoots, petioles and veins. Every original plate now lives here in the Library under its old number.' },
    { d: '2026-09-25', t: 'Original Water Path: where water leaves the leaf (L.1, L.2) and the enrichment on how a conduit fails (E.1 to E.7).' },
    { d: '2026-09-24', t: 'Original Water Path: a season in one field (F.1 to F.3) and Denmead and Shaw 1962 (Fig. 5.3).' }
  ];
  var LIBIDX = {};
  LIBCAT.forEach(function (g) { g.items.forEach(function (it) { if (it[0]) LIBIDX[it[0]] = it; if (it[3]) LIBIDX['#' + it[3]] = it; }); });
  function libHref(it) { return '#/' + it[2] + (it[3] ? '#' + it[3] : ''); }
  function newestAgeDays() {
    var t = Date.parse(NEWS[0].d + 'T12:00:00');
    return (Date.now() - t) / 86400000;
  }
  var lib = { frame: null, host: null, pending: null };
  function libTheme() {
    try { var d = lib.frame && lib.frame.contentDocument; if (d && d.documentElement) d.documentElement.setAttribute('data-theme', ui.theme()); } catch (e) { /* cross origin */ }
  }
  function libFit() {
    try {
      var d = lib.frame.contentDocument; if (!d || !d.body) return;
      var h = Math.max(d.body.scrollHeight, d.documentElement.scrollHeight);
      if (h > 200) lib.frame.style.height = h + 'px';
    } catch (e) { /* keep the fixed height */ }
  }
  function libOpen(route, anchor, scroll) {
    var url = '../index.html#/' + route + (anchor ? '#' + anchor : '');
    if (!lib.frame) { lib.pending = [route, anchor]; return; }
    if (!lib.frame.getAttribute('src') || !lib.loaded) { lib.loaded = false; lib.frame.setAttribute('src', url); }
    else { try { lib.frame.contentWindow.location.hash = '#/' + route + (anchor ? '#' + anchor : ''); } catch (e) { lib.frame.setAttribute('src', url); } }
    var tries = 0;
    (function settle() {
      libFit(); libTheme();
      var target = null;
      try { var d = lib.frame.contentDocument; target = anchor ? d.getElementById(anchor) : null; } catch (e) { target = null; }
      if (scroll !== false) {
        var y = lib.frame.getBoundingClientRect().top + window.pageYOffset + (target ? target.getBoundingClientRect().top : 0) - 70;
        if (tries === 6 || (tries > 1 && target)) window.scrollTo({ top: Math.max(0, y), behavior: 'auto' });
      }
      if (++tries < 7) setTimeout(settle, 180);
    })();
    var cur = '#/' + route + (anchor ? '#' + anchor : '');
    if (location.hash !== cur && history.replaceState) history.replaceState(null, '', cur);
  }
  WP.LIB = {
    byAnchor: function (h) { return !!LIBIDX['#' + h]; },
    fromHash: function (h) {
      h = String(h || '').replace(/^#/, '');
      if (h.charAt(0) === '/') { var parts = h.slice(1).split('#'); libOpen(parts[0] || 'map', parts[1] || '', true); return; }
      if (LIBIDX['#' + h]) { var it = LIBIDX['#' + h]; libOpen(it[2], it[3], true); return; }
      if (lib.frame && !lib.frame.getAttribute('src')) libOpen('map', '', false);
    },
    strip: function (n) {
      var ids = LIBSTRIP[n] || [];
      var el = document.createElement('nav');
      el.className = 'libstrip';
      el.setAttribute('aria-label', 'From the library');
      el.innerHTML = '<span class="ls-k">From the library</span>' + ids.map(function (id) {
        var it = LIBIDX[id]; if (!it) return '';
        return '<a href="' + libHref(it) + '" data-lib="' + id + '"><b>' + esc(it[0]) + '</b> ' + esc(it[1]) + '</a>';
      }).join('');
      el.addEventListener('click', function (e) {
        var a = e.target.closest('a[data-lib]'); if (!a) return;
        e.preventDefault();
        var it = LIBIDX[a.getAttribute('data-lib')];
        go(7, false);
        if (history.pushState) history.pushState(null, '', libHref(it));
        libOpen(it[2], it[3], true);
      });
      return el;
    },
    news: NEWS
  };
  function libMount(el) {
    var age = newestAgeDays();
    var newsH = '<section class="lib-new" aria-labelledby="lib-new-h"><h3 id="lib-new-h">What is new</h3><ol class="lib-news">' +
      NEWS.map(function (n) {
        var dt = new Date(n.d + 'T12:00:00');
        var lab = dt.getDate() + ' ' + ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][dt.getMonth()] + ' ' + dt.getFullYear();
        var fresh = (Date.now() - dt.getTime()) / 86400000 < 14;
        return '<li><time datetime="' + n.d + '">' + lab + '</time>' + (fresh ? ' <span class="lib-fresh">new</span>' : '') + '<p>' + esc(n.t) + '</p></li>';
      }).join('') + '</ol>' +
      '</section>';
    var catH = '<section class="lib-cat" aria-labelledby="lib-cat-h"><h3 id="lib-cat-h">The original plates, by their old numbers</h3>' +
      '<p class="lib-note">Every figure, calculator, quiz and page of the original Water Path is here unchanged. Pick one to open it below, or open <a href="' + LIVE + '" target="_blank" rel="noopener">the full Water Path</a> on its own page.</p>' +
      '<div class="lib-groups">' + LIBCAT.map(function (g) {
        return '<div class="lib-g"><h4>' + esc(g.g) + '</h4><ul>' + g.items.map(function (it) {
          var key = it[0] || ('#' + it[2]);
          return '<li><a href="' + libHref(it) + '" data-open="' + esc(it[2]) + '" data-anchor="' + esc(it[3]) + '">' + (it[0] ? '<b>' + esc(it[0]) + '</b> ' : '') + esc(it[1]) + '</a></li>';
        }).join('') + '</ul></div>';
      }).join('') + '</div></section>';
    el.innerHTML = newsH + catH + symbolsTable() +
      '<div class="lib-frame-wrap"><p class="lib-bar"><span>The full Water Path, mounted whole</span><a href="' + LIVE + '" target="_blank" rel="noopener">Open the full Water Path in a new tab</a></p>' +
      '<iframe class="lib-frame" title="The full Water Path"></iframe></div>';
    lib.frame = el.querySelector('.lib-frame');
    lib.frame.addEventListener('load', function () {
      if (lib.frame.getAttribute('src')) lib.loaded = true;
      libTheme(); libFit();
      try {
        var d = lib.frame.contentDocument;
        if (window.ResizeObserver && d.body) new ResizeObserver(libFit).observe(d.body);
        d.addEventListener('click', function () { setTimeout(libFit, 60); setTimeout(libFit, 400); });
      } catch (e) { /* fixed height fallback */ }
    });
    el.querySelector('.lib-groups').addEventListener('click', function (e) {
      var a = e.target.closest('a[data-open]'); if (!a) return;
      e.preventDefault();
      if (history.pushState) history.pushState(null, '', a.getAttribute('href'));
      libOpen(a.getAttribute('data-open'), a.getAttribute('data-anchor'), true);
    });
    if (lib.pending) { var p = lib.pending; lib.pending = null; libOpen(p[0], p[1], true); }
    ui.onPrefs(libTheme);
    var dot = document.getElementById('wp-newdot');
    if (dot) dot.hidden = !(age < 14);
  }
  WP.levels.push({ id: 'library', n: 7, title: 'The Library', subtitle: 'every plate of the original Water Path under its old number', scale: '1 m', focus: [50, 20],
    mount: libMount, update: function () {}, show: function () { if (lib.frame && !lib.frame.getAttribute('src') && !V7ROUTES.test(location.hash)) libOpen('map', '', false); } });

  /* ------------------------------------------------------------ Presentation mode (projection)
     html[data-class]: rail, drawers, stops and sources hidden; Conditions collapsed; big type; arrow keys or
     PageDown step through the plate one block at a time with a short cross fade; Esc or the fixed button exits. */
  var CM = { on: false, steps: [], i: 0 };
  function cmSteps() {
    var sec = sections[current]; if (!sec) return [];
    var body = sec.body, kids = [];
    (function flat(list) { Array.prototype.forEach.call(list, function (x) { if (x.tagName === 'STYLE') return; if (x.tagName === 'DIV' && !x.className && x.children.length > 1) flat(x.children); else kids.push(x); }); })(body.children);
    var out = [];
    kids.forEach(function (k) {
      k.classList.remove('cm-off', 'cm-on');
      if (k.tagName === 'STYLE' || k.offsetHeight < 30) return;
      if (k.matches('.p2-grid,.o3-grid,.t4-grid,.c6-grid,.f1-grid') && k.children.length > 1) Array.prototype.forEach.call(k.children, function (c) { if (c.offsetHeight > 30) out.push(c); });
      else out.push(k);
    });
    out.forEach(function (x, i) { x.setAttribute('data-step', i + 1); });
    return out;
  }
  function cmShow(i, animate) {
    if (!CM.steps.length) return;
    CM.i = Math.max(0, Math.min(CM.steps.length - 1, i));
    CM.steps.forEach(function (x, j) { x.classList.toggle('cm-off', j !== CM.i); x.classList.toggle('cm-on', j === CM.i); });
    var cur = CM.steps[CM.i];
    if (animate && !ui.reducedMotion() && cur.animate) cur.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 550, easing: 'ease-out' });
    var c = document.getElementById('wp-cm-count'); if (c) c.textContent = (CM.i + 1) + ' of ' + CM.steps.length;
    try { window.scrollTo(0, Math.max(0, cur.getBoundingClientRect().top + window.pageYOffset - 140)); } catch (e) { /* ok */ }
  }
  function cmRebuild() {
    if (!CM.on) return;
    Array.prototype.forEach.call(document.querySelectorAll('.cm-off,.cm-on'), function (x) { x.classList.remove('cm-off', 'cm-on'); });
    CM.steps = cmSteps(); cmShow(0, false);
    var m = metaOf(current), big = document.getElementById('wp-cm-plate');
    if (big && m) big.textContent = m.rn ? 'Water ' + m.rn : m.name;
  }
  ui.setClass = function (on) {
    CM.on = !!on;
    var html = document.documentElement;
    if (CM.on) html.setAttribute('data-class', ''); else html.removeAttribute('data-class');
    var b = document.getElementById('wp-class'); if (b) b.setAttribute('aria-pressed', CM.on ? 'true' : 'false');
    var bar = document.getElementById('wp-cm-bar');
    if (CM.on) {
      var cond = document.getElementById('wp-cond'); if (cond) cond.open = false;
      if (!bar) {
        bar = document.createElement('div'); bar.id = 'wp-cm-bar'; bar.className = 'wp-cm-bar';
        bar.innerHTML = '<span class="cm-plate" id="wp-cm-plate"></span><span class="cm-count" id="wp-cm-count"></span>' +
          '<button type="button" class="btn small" data-cm="prev" aria-label="Previous step">&#8592;</button><button type="button" class="btn small" data-cm="next" aria-label="Next step">&#8594;</button>' +
          '<button type="button" class="btn small primary" data-cm="exit">Exit presentation mode</button>';
        bar.addEventListener('click', function (e) { var t = e.target.closest('[data-cm]'); if (!t) return; var a = t.dataset.cm; if (a === 'exit') ui.setClass(false); else cmShow(CM.i + (a === 'next' ? 1 : -1), true); });
        document.body.appendChild(bar);
      }
      bar.hidden = false;
      setTimeout(cmRebuild, 30);
    } else {
      if (bar) bar.hidden = true;
      Array.prototype.forEach.call(document.querySelectorAll('.cm-off,.cm-on'), function (x) { x.classList.remove('cm-off', 'cm-on'); });
    }
  };
  ui.classMode = function () { return CM.on; };
  document.addEventListener('keydown', function (e) {
    var t = e.target, typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
    if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'c' || e.key === 'C') { ui.setClass(!CM.on); e.preventDefault(); return; }
    if (!CM.on) return;
    if (e.key === 'Escape') { ui.setClass(false); return; }
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { if (t && t.closest && t.closest('[role="tablist"],[role="radiogroup"]')) return; e.preventDefault(); cmShow(CM.i + 1, true); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { if (t && t.closest && t.closest('[role="tablist"],[role="radiogroup"]')) return; e.preventDefault(); cmShow(CM.i - 1, true); }
  });

  /* ------------------------------------------------------------ build now (DOM is parsed: scripts sit at the end of the body) */
  function build() {
    buildTabs();
    buildConditions();
    // r5: Conditions start folded (the visitor meets the plate first); the reader's own choice is remembered
    (function () {
      var d = document.getElementById('wp-cond'); if (!d) return;
      try { if (localStorage.getItem('wp8-cond') === 'open') d.open = true; } catch (e) { /* storage blocked */ }
      d.addEventListener('toggle', function () { try { localStorage.setItem('wp8-cond', d.open ? 'open' : 'closed'); } catch (e) { /* storage blocked */ } });
    })();
    buildRail();
    buildTier();
    syncPrefButtons();
    document.getElementById('wp-theme').addEventListener('click', function () { ui.setTheme(ui.isDark() ? 'light' : 'dark'); });
    document.getElementById('wp-motion').addEventListener('click', function () { ui.setReducedMotion(!ui.reducedMotion()); });
    var cmb = document.getElementById('wp-class'); if (cmb) cmb.addEventListener('click', function () { ui.setClass(!CM.on); });
    ui.onPrefs(function () { syncRail(WP.state, WP.result); });
    setScale(META[0].scale, false);
    if (typeof WP.on === 'function') WP.on(function (st, res) { shell.update(st, res); });
    if (WP.state) { syncConditions(WP.state); syncRail(WP.state, WP.result); }
  }
  if (!WP.solve) console.error('engine.js did not load: the shell has no model to drive.');
  if (document.getElementById('wp-stage')) build();
  else document.addEventListener('DOMContentLoaded', build);
})();

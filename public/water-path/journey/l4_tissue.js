/* The Water Path v8: l4_tissue.js (tissue builder)
   Level IV, Tissue (100 µm). Stops 4a, 4b, 4c, 4d, in display order.
   Topic: outside the xylem.
   1. A leaf cross section, drawn for this exhibit, with the four routes outside the xylem
      (walls, plasmodesmata, membranes, vapour), animated particles, a lignified sheath what if
      and a callose gate.
   2. Loss before breakage: grapevine thresholds (Albuquerque et al. 2020) and the
      34 species compilation (Scoffoni et al. 2023 Table 1), numbers from SPEC rows only.
   3. Embolism versus collapse as a concept only (no numbers, Hard Rule 2).
   4. Turgor and the pressure volume curve driven by leaf Ψ (Bartlett et al. 2012). */
(function () {
  'use strict';
  var WP = window.WP = window.WP || {};
  WP.levels = WP.levels || [];
  var MINUS = '−';
  var ui, el, refs = {}, local = { routes: { apo: true, sym: true, tm: true, vap: true }, lig: false, callose: false, oa: false, eps: 10, pio: -1.5, pv: 'hofler' };
  var anim = { raf: 0, last: 0, phase: { apo: 0, sym: 0, tm: 0, vap: 0 }, timer: 0 };
  var lastRes = null, lastSt = null;

  function num(x, d) { return WP.fmt.num(x, d); }
  function clamp(x, a, b) { return x < a ? a : (x > b ? b : x); }
  function esc(s) { return ui && ui.esc ? ui.esc(s) : String(s); }
  var SEC_INFO = 'The figure is quoted in a later review, not read in the primary paper this session.';
  var DIRSEC_INFO = 'The primary abstract confirms the direction of the effect; the size of the effect is quoted in a later review.';
  function secInfo() { var u = WP.ui; if (u && u.BADGE_INFO && !u.BADGE_INFO.SECONDARY) { u.BADGE_INFO.SECONDARY = SEC_INFO; u.BADGE_INFO['MEASURED (DIRECTION), VALUE SECONDARY'] = DIRSEC_INFO; } }
  function badge(k, t) {
    secInfo();
    if (k === 'SECONDARY') return '<span class="badge b-illustrative" role="img" title="' + esc(SEC_INFO + ' ' + (t || '')) + '" aria-label="' + esc('SECONDARY: ' + SEC_INFO + ' ' + (t || '')) + '">SECONDARY</span>';
    if (k === 'MEASURED (direction), value secondary') return '<span class="badge b-verified t4-bm" role="img" title="' + esc(DIRSEC_INFO + ' ' + (t || '')) + '" aria-label="' + esc('MEASURED (direction), value secondary: ' + DIRSEC_INFO + ' ' + (t || '')) + '">MEASURED (direction), value secondary</span>';
    if (k === 'MEASURED') return '<span class="badge b-verified t4-bm" role="img" title="' + esc('Published data. ' + (t || '')) + '" aria-label="' + esc('MEASURED: published data. ' + (t || '')) + '">MEASURED</span>';
    if (k === 'OPEN QUESTION') return '<span class="badge t4-boq" role="img" title="' + esc('Under study; no settled answer. ' + (t || '')) + '" aria-label="' + esc('OPEN QUESTION. ' + (t || '')) + '">OPEN QUESTION</span>';
    return ui.badge(k, t);
  }

  /* ------------------------------------------------------------ evidence registry (DOIs only from SPEC.json) */
  WP.evidence = WP.evidence || {};
  var EV = {
    'l4-routes': {
      claim: 'Past the bundle sheath, most of the water moves through cell walls, a small share crosses membranes, and some moves as vapour through the air spaces. These shares are model outputs.',
      cite: 'Buckley 2015, Plant, Cell and Environment 38: 7',
      doi: '10.1111/pce.12372',
      measured: 'A physical model of the leaf outside the xylem, not a measurement. It does not resolve plasmodesmata: its "symplastic" path is the transmembrane route on this plate.',
      fig: 'Abstract (read): walls carry most of the conductance and symplastic paths little; vapour can carry up to 44 % of vertical transport, but only with a 0.2 K temperature gradient across the leaf. The isothermal ranges often quoted for Fig. 4 (walls 72 to 88 %, membranes 6 to 12 %, vapour 7 to 16 %; wall share 14 to 99.8 % across the sensitivity analysis) are stated in the Results text of the paper (PDF read); they are outputs of the model, MEASURED in that sense.',
      badge: 'DERIVED'
    },
    'l4-models': {
      claim: 'Models disagree on where the outside xylem resistance sits. Is the bundle sheath the control point? It is being tested.',
      cite: 'Buckley et al. 2015, Plant Physiology 168: 1616; Buckley 2015, Plant, Cell and Environment 38: 7; Albuquerque et al. 2020, Journal of Experimental Botany 71: 7286',
      doi: '10.1104/pp.15.00731', doi2: '10.1093/jxb/eraa392',
      measured: 'All three are model results. Buckley et al. 2015 (14 species, an areole model): the sheath is a minority of outside xylem resistance and vapour carries up to two thirds of K-ox. Buckley 2015: vapour 7 to 16 % when isothermal, up to 44 % with a 0.2 K gradient. Albuquerque et al. 2020: a Casparian like low permeability band fits the grapevine data.',
      fig: 'Abstracts. Ohtsuka et al. 2018 found lignified minor vein sheaths in 6 of 11 tree species (doi 10.1111/pce.13087).',
      badge: 'OPEN QUESTION'
    },
    'l4-evap': {
      claim: 'Water evaporates from wet cell walls lining the air spaces: inner epidermis near the stomata, mesophyll, even the bundle sheath. Where most of it evaporates shifts with light and humidity. Evaporation absorbs latent heat and cools the leaf.',
      cite: 'Buckley, John, Scoffoni & Sack 2017, Plant Physiology 173: 1763',
      doi: '10.1104/pp.16.01605', doi2: '10.1111/nph.19069',
      measured: 'Model of coupled water and heat transport (MOFLO 2.0) across leaf anatomies.',
      fig: 'Abstract: most evaporation from the epidermis at low light and moderate humidity; the sheath supplies 15 % in darkness and 18 % in high light; vertical temperature gradients reach 0.3 °C. Expert depth: are the airspaces even saturated? Scoffoni et al. 2023 discuss unsaturated airspaces.',
      badge: 'DERIVED'
    },
    'l4-oxv': {
      claim: 'Across eight species, vulnerability outside the xylem explained 75 to 100 % of the decline of K-leaf as leaves dried.',
      cite: 'Scoffoni, Albuquerque, Brodersen et al. 2017, Plant Physiology 173: 1197',
      doi: '10.1104/pp.16.01643',
      measured: 'In vivo microCT of four species plus hydraulic measurements in eight; spatially explicit modelling pointed to reduced membrane conductivity.',
      fig: 'Abstract.',
      badge: 'MEASURED'
    },
    'l4-optical': {
      claim: 'A contrasting view: optical imaging in four species found embolism in leaf veins tracking the decline of K-leaf.',
      cite: 'Brodribb, Skelton, McAdam et al. 2016, New Phytologist 209: 1403',
      doi: '10.1111/nph.13846',
      measured: 'Optical vulnerability method on dehydrating leaves of four angiosperms.',
      fig: 'Abstract. Which mechanism dominates may differ by species and by how fast leaves dry.',
      badge: 'OPEN QUESTION'
    },
    'l4-aba': {
      claim: 'ABA fed through the xylem lowered K-leaf and bundle sheath Pf, while ABA smeared on the blade closed stomata without lowering K-leaf within 2 to 3 h.',
      cite: 'Shatil-Cohen, Attia & Moshelion 2011, Plant Journal 67: 72; Yaaran et al. 2023, Plant Physiology 193: 1349',
      doi: '10.1111/j.1365-313x.2011.04576.x', doi2: '10.1093/plphys/kiad372',
      measured: 'Arabidopsis: K-leaf, protoplast Pf of sheath, spongy and palisade cells. Yaaran 2023: spongy mesophyll Pf fell with ABA, palisade stayed low (a buffer).',
      fig: 'Abstracts.',
      badge: 'MEASURED'
    },
    'l4-oa': {
      claim: 'In grapevine, osmotic adjustment through the season moves the turgor loss point more negative, and K-leaf vulnerability and stomatal closure move with it.',
      cite: 'Martorell et al. 2015, Physiologia Plantarum 153: 381; Herrera et al. 2022, Plant Journal 109: 804',
      doi: '10.1111/ppl.12253', doi2: '10.1111/tpj.15591',
      measured: 'Martorell: Tempranillo and Grenache, K-leaf P50 and P80 fell by more than 20 % through the season while osmotic potential and turgor loss point fell. Herrera: two cultivars droughted at three times in a season; the gs response to stem Ψ shifted with the turgor loss point.',
      fig: 'Abstracts. The ghost shift drawn on this plate is ILLUSTRATIVE.',
      badge: 'MEASURED'
    },
    'l4-shrink': {
      claim: 'As leaves dry, cells shrink and lose contact; across 14 species the early decline of K-leaf tracked leaf thickness shrinkage.',
      cite: 'Scoffoni, Vuong, Diep, Cochard & Sack 2014, Plant Physiology 164: 1772',
      doi: '10.1104/pp.113.221424',
      measured: 'Leaf, cell and airspace thickness and K-leaf at declining leaf Ψ in 14 species.',
      fig: 'Abstract.',
      badge: 'MEASURED'
    },
    'l4-callose': {
      claim: 'Plasmodesmata are not fixed open pores. Callose laid down at their necks narrows them, and its breakdown reopens them, in a signal specific way.',
      cite: 'Worthington & Lee 2026, Journal of Experimental Botany 77: 2177',
      doi: '10.1093/jxb/erag008',
      measured: 'Review of published work on plasmodesmal regulation.',
      fig: 'A common idea is that plasmodesmata are open, fixed channels; in fact callose regulates them. The Buckley model cannot give this route a share, so the plate draws it without one.',
      badge: 'MEASURED'
    },
    'l4-lignin': {
      claim: 'Species whose bundle sheath walls are lignified had more than 50 % lower K-ox and K-leaf.',
      cite: 'Ohtsuka, Sack & Taneda 2018, Plant, Cell and Environment 41: 342, as quoted in Scoffoni et al. 2023',
      doi: '10.1111/pce.13087',
      measured: '11 angiosperm tree species compared, with and without lignified minor vein bundle sheaths. A comparison between species, not a switch inside one leaf.',
      fig: 'The "more than 50 %" figure is quoted in Scoffoni et al. 2023 (doi 10.1111/nph.19069). Lignified minor vein sheaths were found in 6 of 11 species. The primary abstract confirms lower K-x, K-ox and K-leaf, and also says the light response of K-leaf did not depend on lignification. Direction measured; the size of the drop is secondary.',
      badge: 'MEASURED (direction), value secondary'
    },
    'l4-grape': {
      claim: 'In grapevine leaves (Cabernet Sauvignon), K-leaf fell 80 % by −0.71 MPa and stomatal conductance fell 80 % by −1.21 MPa (Table 2); turgor was lost at −1.37 MPa. Embolism appeared in midribs only from about −1.25 MPa, with little or none in minor veins.',
      cite: 'Albuquerque, Scoffoni, Brodersen, Buckley, Sack & McElrone 2020, Journal of Experimental Botany 71: 7286',
      doi: '10.1093/jxb/eraa392',
      measured: 'Cabernet Sauvignon and Chardonnay. K-leaf by evaporative flux; embolism imaged by synchrotron X-ray microCT.',
      fig: 'Table 2 values; the curves on this plate are the Fig. 6 legend fits redrawn from their equations (Kleaf = 0.071 + 14.453 e^(2.302 Ψ); gs = −0.061 + 0.334 e^(0.884 Ψ)). Chardonnay: P80 Kleaf −0.67, P80 gs −1.17, TLP −1.49 MPa. The paper\'s model points to a band in the bundle sheath that works like a Casparian strip; that band is a model suggestion and has not been imaged.',
      badge: 'MEASURED'
    },
    'l4-34': {
      claim: 'Before the first embolism, leaves had already lost 9 to 99 % of K-ox or K-leaf, 66 % on average.',
      cite: 'Scoffoni, Albuquerque, Buckley & Sack 2023, New Phytologist 239: 2099',
      doi: '10.1111/nph.19069',
      measured: 'Compilation of 11 studies and 34 species. The benchmark is the first embolism (Pe) or 12 % loss of xylem conductance (P12).',
      fig: 'Table 1. Lantana camara sits at the low end: 9 % of K-ox lost at P12. Open access, CC BY.',
      badge: 'MEASURED'
    },
    'l4-310': {
      claim: 'Across 56 studies and 310 species, K-leaf fell by 40 % on average before the leaf wilted (range 0 to 96 %).',
      cite: 'Scoffoni & Sack 2017, Journal of Experimental Botany 68: 4479 (database of 310 species); figures quoted via Scoffoni et al. 2023, New Phytologist 239: 2099',
      doi: '10.1093/jxb/erx252', doi2: '10.1111/nph.19069',
      measured: 'Compilation; the benchmark is wilting (turgor loss point), an easier test than the first embolism.',
      fig: 'The 40 % mean and 0 to 96 % range are quoted from Scoffoni et al. 2023; the 2017 abstract confirms the 310 species database. The 2017 paper also gives means by method at turgor loss: 57 to 80 % in flowering plants and 30 to 81 % in gymnosperms (Water III, section 3d). The summaries average the database in different ways, so read each with its definition. The 56 studies, 40 % and 0 to 96 % are secondary: not checked against the 2017 paper itself.',
      badge: 'SECONDARY'
    },
    'l4-ohm': {
      claim: 'Leaf resistances add in series: K-leaf = 1 ÷ (R-x + R-ox), and R-ox = R-bs + R-mes. A resistance change moves Ψ only downstream of itself at a given E.',
      cite: 'Scoffoni, Albuquerque, Buckley & Sack 2023, New Phytologist 239: 2099 (Fig. 2)',
      doi: '10.1111/nph.19069',
      measured: 'Physics of flow in series. The resistance values on this plate are teaching constants.',
      fig: 'Model split of 1 ÷ K-plant: leaf xylem 0.10, sheath 0.15, mesophyll 0.10 (ILLUSTRATIVE). R-bs scales as 1 ÷ Pf because water must cross membranes at the sheath.',
      badge: 'DERIVED'
    },
    'l4-tlp': {
      claim: 'The turgor loss point moves more negative mainly when the osmotic potential at full turgor falls (osmotic adjustment). Wall stiffness mainly changes how much water the leaf holds when it loses turgor.',
      cite: 'Bartlett, Scoffoni & Sack 2012, Ecology Letters 15: 393',
      doi: '10.1111/j.1461-0248.2012.01751.x',
      measured: 'Meta analysis of pressure volume curves across species and biomes.',
      fig: 'Curve form πtlp = πo ε ÷ (πo + ε), with πo negative, the equation is not in the abstract. The cell values on this plate are ILLUSTRATIVE, not a grapevine measurement. A common idea links the turgor loss point to salt; in fact it links to drought tolerance through osmotic adjustment.',
      badge: 'MEASURED'
    },
    'l4-psi': {
      claim: 'Ψw = Ψs + Ψp in every compartment. In a living cell Ψp is positive (turgor). In a xylem conduit Ψp is negative (tension) and Ψs is close to zero.',
      cite: 'Definition of water potential (house identity, Numbers Ledger)',
      doi: '',
      measured: 'Identity, no measurement needed.',
      fig: 'A common idea: in the xylem Ψw = −Ψp. In fact the same equation holds everywhere; in a conduit Ψs is near zero and Ψp is negative.',
      badge: 'DERIVED'
    },
    'l4-airseed': {
      claim: 'A conduit embolises mainly by air seeding: air is pulled from a gas filled neighbour through the largest pore of the pit membrane. In conifer pits a thickened torus can seal the aperture while the porous margo carries flow.',
      cite: 'Choat & Pittermann 2009, New Phytologist 182: 557; Pittermann et al. 2005, Science 310: 1924',
      doi: ['10.1111/j.1469-8137.2009.02847.x', '10.1126/science.1120479'],
      measured: 'Reviews and comparative measurements of pit structure and function.',
      fig: 'A common idea: cavitation is the water boiling. In fact no heat is involved; air is pulled through a pit membrane pore. Another: the torus is lignified. In fact it is a thickened plug of the pit membrane. Founding experiment: Sperry & Tyree 1988 (doi 10.1104/pp.88.3.581).',
      badge: 'MEASURED'
    },
    'l4-collapse': {
      claim: 'Can a water filled conduit buckle and recover? Reversible wall collapse has been reported in pine needle tracheids, red oak minor veins and wheat leaf vessels. How often it happens in intact crops, and what it does to flow, are questions under study.',
      cite: 'Cochard et al. 2004, Plant Physiology 134: 401; Zhang et al. 2016, Plant Physiology 172: 2261; Corso et al. 2020, Plant, Cell and Environment 43: 854',
      doi: ['10.1104/pp.103.028357', '10.1104/pp.16.01191', '10.1111/pce.13722'],
      measured: 'Published observations in other species. No lab numbers appear on this page.',
      fig: 'Concept drawing only.',
      badge: 'OPEN QUESTION'
    },
    'l4-order': {
      claim: 'Does wilting come before the first embolism? On average, yes: leaves lose turgor before stems lose half their conductivity. But the order varies with species and climate.',
      cite: 'Bartlett, Klein, Jansen, Choat & Sack 2016, PNAS 113: 13098; Peters & Choat 2025, Plant, Cell and Environment 48: 2162',
      doi: '10.1073/pnas.1604088113', doi2: '10.1111/pce.15249',
      measured: 'Bartlett 2016: published thresholds for 262 woody angiosperm and 48 gymnosperm species. Peters & Choat 2025: in 12 Australian tree species, leaf embolism began after turgor loss (a direct test).',
      fig: 'Abstracts. Two common ideas overreach: that the turgor loss point tells you when embolism starts, and that the two are unrelated. In fact they are correlated across species, but one does not time the other in a given plant.',
      badge: 'OPEN QUESTION'
    }
  };
  Object.keys(EV).forEach(function (k) { if (!WP.evidence[k]) WP.evidence[k] = EV[k]; });

  /* ------------------------------------------------------------ CSS (scoped) */
  var CSS = '\
#lv-tissue{--t4-apo:#9a5b17;--t4-sym:#7d3f98;--t4-tm:#1f5fb0;--t4-vap:#7c7266;--t4-cw:#efe3c4;--t4-cwl:#c9b48a;--t4-airfill:#e6dfcf;--t4-cut:#d7b45a;--t4-lig:#5a2d0c;--t4-callose:#c99a12;--t4-vasc:#e9e1cc;--t4-cyto:#cdd3b2;--t4-chl:#6f8a4a;--t4-vac:#dfe8f1;--t4-cut2:#b48c2c}\
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]) #lv-tissue{--t4-apo:#f0b45c;--t4-sym:#d6a2f0;--t4-tm:#7cb8ff;--t4-vap:#b9ad9d;--t4-cw:#2a2e2c;--t4-cwl:#5e5a49;--t4-airfill:#121a20;--t4-cut:#8d7330;--t4-lig:#e7a067;--t4-callose:#f0cc4a;--t4-vasc:#1c2427;--t4-cyto:#2c3a2c;--t4-chl:#6fa25a;--t4-vac:#1d2c3a;--t4-cut2:#c9a54f}}\
:root[data-theme="dark"] #lv-tissue{--t4-apo:#f0b45c;--t4-sym:#d6a2f0;--t4-tm:#7cb8ff;--t4-vap:#b9ad9d;--t4-cw:#2a2e2c;--t4-cwl:#5e5a49;--t4-airfill:#121a20;--t4-cut:#8d7330;--t4-lig:#e7a067;--t4-callose:#f0cc4a;--t4-vasc:#1c2427;--t4-cyto:#2c3a2c;--t4-chl:#6fa25a;--t4-vac:#1d2c3a;--t4-cut2:#c9a54f}\
[data-tier="1"] #lv-tissue .tier-2,[data-tier="1"] #lv-tissue .tier-3,[data-tier="2"] #lv-tissue .tier-3{display:none!important}\
#lv-tissue .tier-1-only{display:none}[data-tier="1"] #lv-tissue .tier-1-only{display:block}\
#lv-tissue .t4-lead{font-size:19px;font-style:italic;color:var(--ink2);margin:0 0 6px;max-width:46em}\
#lv-tissue .t4-now{font-family:var(--ui);font-size:15px;line-height:1.45;background:var(--card);border:1px solid var(--rule);border-left:4px solid var(--accent);padding:8px 12px;margin:0 0 16px;max-width:60em}\
#lv-tissue .t4-now b{font-weight:600}\
#lv-tissue .t4-mol{border:1px solid var(--rule2);border-left:3px solid var(--accent);background:var(--card);border-radius:6px;padding:10px 12px;margin:16px 0}\
#lv-tissue .t4-molh{font-family:var(--ui);font-size:15px;margin:0 0 4px}\
#lv-tissue .t4-molctl{display:grid;grid-template-columns:1fr 1fr;gap:4px 18px;margin:6px 0}\
@media (max-width:620px){#lv-tissue .t4-molctl{grid-template-columns:1fr}}\
#lv-tissue .t4-rng2{display:grid;grid-template-columns:1fr auto;gap:2px 10px;align-items:center;font-family:var(--ui);font-size:13.5px}\
#lv-tissue .t4-rng2 label small{display:block;color:var(--ink2);font-size:12px}\
#lv-tissue .t4-rng2 input{grid-column:1 / -1;width:100%;min-height:32px}\
#lv-tissue .t4-rng2 output{font-family:var(--mono);font-variant-numeric:tabular-nums}\
#lv-tissue .t4-molstage{margin:8px 0 0}\
#lv-tissue h3.t4-h{font-family:var(--disp);font-weight:400;font-size:24px;letter-spacing:.03em;margin:30px 0 2px}\
#lv-tissue .t4-sub{margin:0 0 10px;color:var(--ink2);font-style:italic}\
#lv-tissue .t4-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:16px;align-items:start}\
#lv-tissue .t4-side{display:grid;grid-template-columns:minmax(0,1fr);gap:12px;align-items:start}\
@media (min-width:700px){#lv-tissue .t4-side{grid-template-columns:minmax(0,1.1fr) minmax(0,1fr)}}\
#lv-tissue .t4-grid2{display:grid;grid-template-columns:minmax(0,1fr);gap:16px;align-items:start}\
#lv-tissue figure{margin:0}\
#lv-tissue .t4-frame{border:1px solid var(--rule);background:var(--wall);position:relative}\
#lv-tissue .t4-frame svg{display:block;width:100%;height:auto}\
#lv-tissue svg text{font-family:var(--ui);fill:var(--ink)}\
#lv-tissue svg .t4-t2{fill:var(--ink2)}\
#lv-tissue svg .t4-mono{font-family:var(--mono)}\
#lv-tissue .t4-key{display:flex;flex-wrap:wrap;gap:4px 14px;font-family:var(--ui);font-size:12.5px;color:var(--ink2);margin:8px 0 0;padding:0;list-style:none}\
#lv-tissue .t4-key b{display:inline-grid;place-items:center;min-width:22px;height:22px;padding:0 4px;border:1px solid var(--ink);border-radius:11px;font-size:10.5px;color:var(--ink);background:var(--paper);margin-right:4px;font-weight:600}\
#lv-tissue .t4-ctl h4{font-family:var(--ui);font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink2);margin:0 0 6px;font-weight:500}\
#lv-tissue .t4-rchips{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:6px}\
#lv-tissue .t4-rchip{font-family:var(--ui);font-size:14px;min-height:44px;padding:6px 10px;border:1px solid var(--rule);background:var(--paper);color:var(--ink);border-radius:3px;cursor:pointer;display:flex;align-items:center;gap:8px;text-align:left;line-height:1.2}\
#lv-tissue .t4-rchip[aria-pressed="false"]{opacity:.55;text-decoration:line-through;text-decoration-color:var(--ink3)}\
#lv-tissue .t4-rchip svg{width:30px;height:12px;flex:none}\
#lv-tissue .t4-rchip small{display:block;color:var(--ink2);font-size:11.5px}\
#lv-tissue .t4-sw{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 0;border-top:1px dotted var(--rule)}\
#lv-tissue .t4-sw:first-of-type{border-top:0}\
#lv-tissue .t4-sw p{margin:0;font-family:var(--ui);font-size:13.5px;line-height:1.35}\
#lv-tissue .t4-sw p small{display:block;color:var(--ink2);font-size:12px}\
#lv-tissue .t4-tog{flex:none;min-width:92px;justify-content:center}\
#lv-tissue .t4-tiles{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}\
#lv-tissue .t4-tiles .tile .v{font-size:19px}\
#lv-tissue .t4-tiles .tile .s{font-family:var(--ui);font-size:11.5px;color:var(--ink2);margin-top:2px}\
#lv-tissue .t4-tiles .tile.hi{border-color:var(--accent);box-shadow:inset 3px 0 0 var(--accent)}\
#lv-tissue .t4-bar{display:flex;height:22px;border:1px solid var(--ink);margin:6px 0 4px;overflow:hidden}\
#lv-tissue .t4-bar span{display:block;height:100%}\
#lv-tissue .t4-barlab{display:flex;flex-wrap:wrap;gap:4px 12px;font-family:var(--ui);font-size:12px;color:var(--ink2)}\
#lv-tissue .t4-barlab i{display:inline-block;width:10px;height:10px;margin-right:4px;vertical-align:-1px;border:1px solid var(--ink)}\
#lv-tissue .t4-small{font-family:var(--ui);font-size:12.5px;color:var(--ink2);margin:6px 0 0;line-height:1.45}\
#lv-tissue .t4-evrow{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:8px}\
#lv-tissue .t4-evd{flex-basis:100%;background:var(--paper);border:1px solid var(--rule);border-left:4px solid var(--rule);padding:10px 12px;font-size:15.5px}\
#lv-tissue .t4-evd p{margin:0 0 6px}\
#lv-tissue .t4-evd dl{display:grid;grid-template-columns:auto 1fr;gap:3px 10px;margin:0;font-size:14.5px}\
#lv-tissue .t4-evd dt{font-family:var(--ui);font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--ink2);padding-top:3px}\
#lv-tissue .t4-evd dd{margin:0}\
#lv-tissue .badge.t4-boq{color:var(--warm)}\
#lv-tissue .badge.t4-boq::before{content:"?\\00a0"}\
#lv-tissue .t4-strip text{font-size:12px}\
#lv-tissue input.t4-xtrap{background:linear-gradient(90deg,transparent 0 66.6%,rgba(128,128,128,.28) 66.6% 100%);border-radius:4px}\
#lv-tissue .t4-xt{display:flex;justify-content:space-between;font-family:var(--ui);font-size:11px;color:var(--ink3);grid-column:1/-1}\
#lv-tissue .t4-xt i{font-style:normal}\
#lv-tissue .t4-real{margin:16px 0 0;padding:12px;border:1px solid var(--rule2);border-radius:8px;background:var(--card)}\
#lv-tissue .t4-realhd h4{margin:0 0 4px;font-family:var(--ui);font-size:17px}\
#lv-tissue .t4-realhd p{margin:0 0 8px;font-family:var(--ui);font-size:13.5px;color:var(--ink2)}\
#lv-tissue .t4-realwrap{position:relative;border-radius:6px;overflow:hidden;--bands:.17;--hots:.6}\
#lv-tissue .t4-realwrap img{display:block;width:100%;height:auto}\
#lv-tissue .t4-realov{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}\
#lv-tissue .t4-bands{opacity:var(--bands);mix-blend-mode:multiply}\
#lv-tissue .t4-hot{position:absolute;transform:translate(-50%,-50%);opacity:var(--hots);border:1px solid rgba(0,0,0,.35);background:rgba(255,253,245,.92);color:#2a231c;border-radius:999px;padding:3px 9px;font-family:var(--ui);font-size:12px;font-weight:600;cursor:pointer;min-height:26px;box-shadow:0 2px 6px rgba(0,0,0,.18);white-space:nowrap}\
#lv-tissue .t4-hot.on{background:#2a231c;color:#fff}\
#lv-tissue .t4-realwrap.nohot .t4-hot{pointer-events:none}\
#lv-tissue .t4-realctl{display:flex;align-items:center;gap:10px;font-family:var(--ui);font-size:13px;margin:8px 0 2px}\
#lv-tissue .t4-realctl input{flex:1}\
#lv-tissue .t4-realkey{display:none}\
@media (max-width:560px){#lv-tissue .t4-hot{font-size:12px;padding:0;width:26px;height:26px;min-height:26px;display:flex;align-items:center;justify-content:center}#lv-tissue .t4-hot span{display:none}#lv-tissue .t4-hot::before{content:attr(data-n)}#lv-tissue .t4-realkey{display:block;margin:4px 0 0}}\
#lv-tissue .t4-chart text{font-size:12px;fill:var(--ink2)}\
#lv-tissue .t4-chart text{paint-order:stroke;stroke:var(--wall);stroke-width:3px;stroke-linejoin:round}\
#lv-tissue .t4-chart .ax{stroke:var(--ink);stroke-width:1;fill:none}\
#lv-tissue .t4-chart .gl{stroke:var(--rule2);stroke-width:1}\
#lv-tissue .t4-qbox{border-left:3px solid var(--warm);padding:6px 0 6px 12px;margin:12px 0 0}\
#lv-tissue .t4-qbox p{margin:0}\
#lv-tissue .t4-qbox .q{font-weight:600;font-size:18px}\
#lv-tissue .t4-cellgrid{display:grid;grid-template-columns:minmax(0,1fr);gap:14px;align-items:start}\
@media (min-width:700px){#lv-tissue .t4-cellgrid{grid-template-columns:minmax(200px,.8fr) minmax(0,1.4fr)}}\
#lv-tissue .t4-eqline{font-family:var(--mono);font-variant-numeric:tabular-nums;font-size:14px;line-height:1.7;overflow-wrap:anywhere}\
#lv-tissue .t4-eqline .w{color:var(--t4-tm);font-weight:600}\
#lv-tissue .t4-rng{display:grid;grid-template-columns:auto 1fr auto;gap:6px 10px;align-items:center;font-family:var(--ui);font-size:13px;margin-top:8px}\
#lv-tissue .t4-rng output{font-family:var(--mono);font-variant-numeric:tabular-nums;min-width:6.5em;text-align:right}\
#lv-tissue .t4-rng input{width:100%}\
#lv-tissue .t4-dive{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;margin:30px 0 8px;padding:14px 16px;background:var(--plaque);color:var(--plaque-ink);border-radius:2px}\
#lv-tissue .t4-dive p{margin:0;font-size:17px;max-width:40em}\
#lv-tissue .t4-dive .btn{background:var(--paper);color:var(--ink);border-color:var(--paper);font-weight:600}\
#lv-tissue .t4-route{fill:none;stroke-linecap:round;stroke-linejoin:round}\
#lv-tissue .t4-air{fill:var(--airsp)}\
#lv-tissue .t4-cuticle{fill:var(--cut);stroke:var(--ink);stroke-width:.8}\
#lv-tissue .t4-cwl{fill:var(--apo);stroke:var(--apo2);stroke-width:1.6}\
#lv-tissue .t4-cwf{fill:var(--apo)}\
#lv-tissue .t4-pml{fill:none;stroke:var(--pm);stroke-width:3}\
#lv-tissue .t4-cyf{fill:var(--cyto)}\
#lv-tissue .t4-tono{fill:none;stroke:var(--ink2);stroke-width:2;stroke-dasharray:3 2.4}\
#lv-tissue .t4-vacf{fill:var(--vac)}\
#lv-tissue .t4-chlo{fill:var(--chl)}\
#lv-tissue .t4-aqg{fill:var(--paper);stroke:var(--pm);stroke-width:1.1}\
#lv-tissue .t4-inset{max-width:420px;margin:10px 0 0;border:1px solid var(--rule);background:var(--wall);padding:6px}\
#lv-tissue .t4-inset svg{display:block;width:100%;height:auto}\
#lv-tissue .t4-inset figcaption{font-family:var(--ui);font-size:12.5px;color:var(--ink2);margin-top:4px}\
#lv-tissue .t4-pt{transition:opacity .3s}\
#lv-tissue .t4-hide{display:none}\
#lv-tissue .t4-legend{display:flex;flex-wrap:wrap;gap:4px 14px;font-family:var(--ui);font-size:12px;color:var(--ink2);margin:6px 0 0}\
#lv-tissue .t4-legend i{display:inline-block;width:16px;height:3px;vertical-align:3px;margin-right:5px}\
#lv-tissue .t4-stops{margin-top:12px}\
#lv-tissue .t4-sec{border-top:1px solid var(--rule);margin-top:26px}\
#lv-tissue .t4-sec:first-of-type{border-top:0;margin-top:0}\
@media (max-width:520px){#lv-tissue h3.t4-h{font-size:21px}#lv-tissue .t4-tiles .tile .v{font-size:17px}}\
';

  /* ------------------------------------------------------------ geometry helpers */
  function P(x, y) { return { x: x, y: y }; }
  function polyLen(pts) {
    var L = [0];
    for (var i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
    return L;
  }
  function at(route, s) {
    var pts = route.pts, L = route.L, n = pts.length;
    if (s <= 0) return pts[0];
    if (s >= L[n - 1]) return pts[n - 1];
    var lo = 0, hi = n - 1;
    while (hi - lo > 1) { var m = (lo + hi) >> 1; if (L[m] <= s) lo = m; else hi = m; }
    var t = (s - L[lo]) / (L[hi] - L[lo] || 1);
    return P(pts[lo].x + t * (pts[hi].x - pts[lo].x), pts[lo].y + t * (pts[hi].y - pts[lo].y));
  }
  function d(pts) { return 'M' + pts.map(function (p) { return p.x.toFixed(1) + ',' + p.y.toFixed(1); }).join(' L'); }
  function sector(cx, cy, r1, r2, a0, a1) {
    var c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
    var large = (a1 - a0) > Math.PI ? 1 : 0;
    return 'M' + (cx + r1 * c0).toFixed(1) + ',' + (cy + r1 * s0).toFixed(1) +
      ' L' + (cx + r2 * c0).toFixed(1) + ',' + (cy + r2 * s0).toFixed(1) +
      ' A' + r2 + ',' + r2 + ' 0 ' + large + ' 1 ' + (cx + r2 * c1).toFixed(1) + ',' + (cy + r2 * s1).toFixed(1) +
      ' L' + (cx + r1 * c1).toFixed(1) + ',' + (cy + r1 * s1).toFixed(1) +
      ' A' + r1 + ',' + r1 + ' 0 ' + large + ' 0 ' + (cx + r1 * c0).toFixed(1) + ',' + (cy + r1 * s0).toFixed(1) + ' Z';
  }

  /* ------------------------------------------------------------ the cross section, one cell recipe for every cell
     Each cell is a set of primitives (rect, ellipse, flat ended arm, sheath sector). Every cell is drawn the same way:
     wall = the apoplast band (--apo) whose outline is the middle lamella where two cells touch; plasma membrane =
     a distinct line 4.5 units inside (--pm); a parietal cytoplasm with chloroplasts; a vacuole with a dashed tonoplast.
     The routes run through these same cells. Grape bundle sheath extensions are not drawn (no retrieved source). */
  var VC = P(180, 300), R1 = 52, R2 = 86, NBS = 11;
  var TAIL = [P(526, 300), P(552, 334), P(604, 408), P(630, 452), P(630, 524)];
  var WALL = 4.5, VACI = 11;
  // chain of spongy cells the routes cross: A (300), B (400), C (492)
  var CHAIN = [
    { prims: [{ t: 'ell', cx: 300, cy: 300, rx: 32, ry: 30 }, { t: 'arm', x1: 300, y1: 300, x2: 266, y2: 300, w: 36 }, { t: 'arm', x1: 300, y1: 300, x2: 354, y2: 300, w: 36 }, { t: 'arm', x1: 300, y1: 300, x2: 305, y2: 357, w: 22 }], chl: 1 },
    { prims: [{ t: 'ell', cx: 400, cy: 300, rx: 32, ry: 30 }, { t: 'arm', x1: 400, y1: 300, x2: 354, y2: 300, w: 36 }, { t: 'arm', x1: 400, y1: 300, x2: 446, y2: 300, w: 36 }, { t: 'arm', x1: 400, y1: 300, x2: 390, y2: 362, w: 22 }], chl: 1 },
    { prims: [{ t: 'ell', cx: 492, cy: 300, rx: 34, ry: 26 }, { t: 'arm', x1: 492, y1: 300, x2: 446, y2: 300, w: 36 }, { t: 'arm', x1: 492, y1: 300, x2: 526, y2: 300, w: 30, free: 1 }, { t: 'arm', x1: 492, y1: 300, x2: 481, y2: 362, w: 22 }], chl: 1 }
  ];
  // the rest of the spongy mesophyll: lobed cells touching through flat ended arms, about 40 % air
  var SPN = [[40, 236, 30, 26], [52, 330, 28, 28], [50, 416, 30, 24], [135, 424, 30, 22], [228, 422, 28, 22], [310, 412, 28, 24], [384, 422, 28, 22], [470, 422, 26, 22],
    [508, 226, 28, 24], [588, 230, 30, 24], [684, 240, 30, 26], [716, 330, 28, 28], [724, 414, 26, 24], [140, 200, 24, 18], [336, 222, 30, 24], [430, 228, 30, 24], [262, 204, 22, 18]];
  var SPE = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [8, 9], [9, 10], [10, 11], [11, 12], [14, 15], [15, 8], [16, 14]];
  function spongyCells() {
    var cells = SPN.map(function (n) { return { prims: [{ t: 'ell', cx: n[0], cy: n[1], rx: n[2], ry: n[3] }], chl: 1 }; });
    function arm(i, x2, y2, w) { cells[i].prims.push({ t: 'arm', x1: SPN[i][0], y1: SPN[i][1], x2: x2, y2: y2, w: w || 20 }); }
    SPE.forEach(function (e) { var a = SPN[e[0]], b = SPN[e[1]], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2; arm(e[0], mx, my); arm(e[1], mx, my); });
    // to the palisade, the lower epidermis, the sheath and the chain
    arm(0, 40, 179); arm(8, 508, 179); arm(9, 588, 179); arm(10, 684, 179); arm(13, 140, 179); arm(14, 336, 179); arm(15, 430, 179); arm(16, 262, 179, 16);
    var bq = [VC.x + R2 * Math.cos(-0.95), VC.y + R2 * Math.sin(-0.95)]; arm(16, bq[0], bq[1], 16);
    arm(2, 50, 452); arm(4, 228, 452); arm(6, 380, 452); arm(12, 722, 452); arm(3, 135, 452);
    var bs = [VC.x + R2 * Math.cos(Math.PI * 0.92), VC.y + R2 * Math.sin(Math.PI * 0.92)]; arm(1, bs[0], bs[1]);
    var bt = [VC.x + R2 * Math.cos(-Math.PI * 0.62), VC.y + R2 * Math.sin(-Math.PI * 0.62)]; arm(13, bt[0], bt[1], 18);
    arm(5, 305, 357, 22); arm(6, 390, 362, 22); arm(7, 481, 362, 22);
    return cells;
  }
  function primD(p, d) {
    d = d || 0;
    if (p.t === 'rect') { var r = Math.max(0, p.r - d); return roundRect(p.x + d, p.y + d, p.w - 2 * d, p.h - 2 * d, r); }
    if (p.t === 'ell') { var rx = p.rx - d, ry = p.ry - d; if (rx <= 1 || ry <= 1) return ''; return 'M' + (p.cx - rx).toFixed(1) + ',' + p.cy + ' a' + rx + ',' + ry + ' 0 1 0 ' + (2 * rx) + ',0 a' + rx + ',' + ry + ' 0 1 0 ' + (-2 * rx) + ',0Z'; }
    if (p.t === 'arm') {
      var dx = p.x2 - p.x1, dy = p.y2 - p.y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = -uy, ny = ux, hw = p.w / 2 - d, L2 = L - (p.free ? d : d);
      if (hw <= 0.8) return '';
      var ex = p.x1 + ux * L2, ey = p.y1 + uy * L2;
      return 'M' + (p.x1 + nx * hw).toFixed(1) + ',' + (p.y1 + ny * hw).toFixed(1) + ' L' + (ex + nx * hw).toFixed(1) + ',' + (ey + ny * hw).toFixed(1) + ' L' + (ex - nx * hw).toFixed(1) + ',' + (ey - ny * hw).toFixed(1) + ' L' + (p.x1 - nx * hw).toFixed(1) + ',' + (p.y1 - ny * hw).toFixed(1) + 'Z';
    }
    if (p.t === 'sector') { var rm = (p.r1 + p.r2) / 2; return sector(p.cx, p.cy, p.r1 + d, p.r2 - d, p.a0 + d / rm, p.a1 - d / rm); }
    return '';
  }
  function roundRect(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    return 'M' + (x + r) + ',' + y + ' H' + (x + w - r) + ' Q' + (x + w) + ',' + y + ' ' + (x + w) + ',' + (y + r) + ' V' + (y + h - r) + ' Q' + (x + w) + ',' + (y + h) + ' ' + (x + w - r) + ',' + (y + h) + ' H' + (x + r) + ' Q' + x + ',' + (y + h) + ' ' + x + ',' + (y + h - r) + ' V' + (y + r) + ' Q' + x + ',' + y + ' ' + (x + r) + ',' + y + 'Z';
  }
  // the recipe: walls, then membranes and cytoplasm, then vacuoles, then chloroplasts
  function drawCells(cells, opt) {
    opt = opt || {};
    var w = [], m = [], v = [], c = [];
    cells.forEach(function (cell) {
      var ds = cell.prims.map(function (p) { return primD(p, 0); });
      w.push(ds.map(function (dd) { return '<path d="' + dd + '" class="t4-cwl"/>'; }).join('') + ds.map(function (dd) { return '<path d="' + dd + '" class="t4-cwf"/>'; }).join(''));
      var di = cell.prims.map(function (p) { return primD(p, WALL); }).filter(Boolean);
      m.push(di.map(function (dd) { return '<path d="' + dd + '" class="t4-pml"/>'; }).join('') + di.map(function (dd) { return '<path d="' + dd + '" class="t4-cyf"/>'; }).join(''));
      var dv = cell.prims.filter(function (p) { return p.t !== 'arm' || p.w > 30; }).map(function (p) { return primD(p, p.t === 'arm' ? 13 : VACI); }).filter(Boolean);
      if (!opt.noVac) v.push(dv.map(function (dd) { return '<path d="' + dd + '" class="t4-tono"/>'; }).join('') + dv.map(function (dd) { return '<path d="' + dd + '" class="t4-vacf"/>'; }).join(''));
      if (cell.chl) cell.prims.forEach(function (p) {
        if (p.t === 'ell') {
          var n = Math.max(3, Math.round((p.rx + p.ry) / 9));
          for (var k = 0; k < n; k++) { var a = (k + 0.3) / n * Math.PI * 2, rx = p.rx - 7.5, ry = p.ry - 7.5; c.push('<ellipse cx="' + (p.cx + rx * Math.cos(a)).toFixed(1) + '" cy="' + (p.cy + ry * Math.sin(a)).toFixed(1) + '" rx="3.6" ry="2.1" transform="rotate(' + (a * 180 / Math.PI + 90).toFixed(0) + ' ' + (p.cx + rx * Math.cos(a)).toFixed(1) + ' ' + (p.cy + ry * Math.sin(a)).toFixed(1) + ')" class="t4-chlo"/>'); }
        } else if (p.t === 'rect') {
          for (var j = 0; j < 5; j++) { var yy = p.y + 14 + j * (p.h - 28) / 4; c.push('<ellipse cx="' + (p.x + 7.6) + '" cy="' + yy.toFixed(1) + '" rx="2.1" ry="3.8" class="t4-chlo"/><ellipse cx="' + (p.x + p.w - 7.6) + '" cy="' + (yy + 7).toFixed(1) + '" rx="2.1" ry="3.8" class="t4-chlo"/>'); }
        } else if (p.t === 'sector') {
          var am = (p.a0 + p.a1) / 2, rr = p.r2 - 8;
          c.push('<ellipse cx="' + (p.cx + rr * Math.cos(am - 0.08)).toFixed(1) + '" cy="' + (p.cy + rr * Math.sin(am - 0.08)).toFixed(1) + '" rx="3.2" ry="2" class="t4-chlo"/><ellipse cx="' + (p.cx + (p.r1 + 8) * Math.cos(am + 0.05)).toFixed(1) + '" cy="' + (p.cy + (p.r1 + 8) * Math.sin(am + 0.05)).toFixed(1) + '" rx="2.6" ry="1.8" class="t4-chlo"/>');
        }
      });
    });
    return '<g class="t4-walls">' + w.join('') + '</g><g class="t4-protos">' + m.join('') + '</g><g>' + v.join('') + '</g><g>' + c.join('') + '</g>';
  }
  // the routes, traced through the chain cells
  function topWall(x) {
    var y = 282;
    CHAIN.forEach(function (cell) { var e = cell.prims[0]; var u = (x - e.cx) / e.rx; if (Math.abs(u) < 1) y = Math.min(y, e.cy - e.ry * Math.sqrt(1 - u * u)); });
    return y + 2.25;
  }
  var apoTop = []; (function () { for (var x = 266; x <= 522; x += 4) apoTop.push(P(x, topWall(x))); })();
  var ROUTE_PTS = {
    apo: [P(221, 281), P(230, 285), P(262, 284)].concat(apoTop).concat([P(524, 290), P(526, 300)]),
    apoLig: [P(221, 281), P(232, 288), P(249, 296), P(263, 288), P(266, 284.2)].concat(apoTop.slice(1)).concat([P(524, 290), P(526, 300)]),
    sym: [P(221, 287), P(237, 293), P(252, 292), P(266, 292), P(300, 292), P(354, 292), P(400, 292), P(446, 292), P(492, 292), P(517, 293), P(526, 300)],
    tm: [P(219, 286), P(229, 309), P(236.5, 310), P(261.5, 310), P(270.5, 310), P(349.5, 310), P(358.5, 310), P(441.5, 310), P(450.5, 310), P(521.5, 310), P(524, 306), P(526, 300)],
    vap: [P(514, 321), P(524, 340), P(570, 364), P(604, 408)]
  };
  var CROSS_TM = [P(236.5, 310), P(261.5, 310), P(270.5, 310), P(349.5, 310), P(358.5, 310), P(441.5, 310), P(450.5, 310), P(521.5, 310)];
  var CROSS_SYM_IN = [P(236.5, 293), P(521.5, 293)];
  var PDS = [P(266, 292), P(354, 292), P(446, 292)];
  var routes = {};
  function buildRoutes() {
    Object.keys(ROUTE_PTS).forEach(function (k) {
      var liquid = ROUTE_PTS[k], pts;
      if (k === 'vap') pts = liquid.concat(TAIL.slice(3));
      else pts = liquid.concat(TAIL.slice(1));
      var L = polyLen(pts);
      routes[k] = { pts: pts, L: L, total: L[L.length - 1], liquidLen: k === 'vap' ? 0 : polyLen(liquid)[liquid.length - 1] };
    });
  }
  buildRoutes();

  function crossSectionSVG() {
    var s = [], i;
    s.push('<svg viewBox="0 0 760 530" role="img" aria-labelledby="t4-xs-t t4-xs-d"><title id="t4-xs-t">Leaf cross section around a minor vein</title><desc id="t4-xs-d">Schematic leaf cross section drawn for this exhibit. Upper epidermis, then columnar palisade cells, then lobed spongy mesophyll cells touching through their arms around air spaces, and a minor vein inside a ring of bundle sheath cells. Every cell has a wall (the apoplast), a plasma membrane just inside it with aquaporins, a thin layer of cytoplasm with chloroplasts, and a vacuole. Water leaves the xylem and crosses the sheath and three spongy cells by four routes: along the walls, through plasmodesmata, across membranes through aquaporins, and as vapour through the air spaces, to a stoma over its substomatal cavity in the lower epidermis.</desc>');
    s.push('<defs><marker id="t4-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="var(--t4-vap)"/></marker></defs>');
    // air space (its own token) and cuticles
    s.push('<rect x="0" y="20" width="760" height="478" class="t4-air"/>');
    s.push('<rect x="0" y="13" width="760" height="8" class="t4-cuticle"/><rect x="0" y="494" width="760" height="7" class="t4-cuticle"/>');
    var cells = [];
    // upper epidermis
    for (i = 0; i < 13; i++) cells.push({ prims: [{ t: 'rect', x: i * 60 + 1, y: 21, w: 59, h: 43, r: 6 }] });
    // palisade: columnar, about 3.7 : 1
    for (i = 0; i < 23; i++) cells.push({ prims: [{ t: 'rect', x: 4 + i * 33, y: 66, w: 30, h: 111, r: 12 }], chl: 1 });
    // lower epidermis with the stomatal gap
    [[1, 59], [61, 59], [121, 59], [181, 59], [241, 59], [301, 59], [361, 59], [421, 59], [481, 59], [541, 47], [673, 46], [720, 40]].forEach(function (c) { cells.push({ prims: [{ t: 'rect', x: c[0], y: 452, w: c[1], h: 42, r: 6 }] }); });
    // bundle sheath ring
    var da = 2 * Math.PI / NBS, gap = 0.0;
    for (i = 0; i < NBS; i++) cells.push({ prims: [{ t: 'sector', cx: VC.x, cy: VC.y, r1: R1, r2: R2, a0: -da / 2 + i * da + gap, a1: da / 2 + i * da - gap }], chl: 1 });
    cells = cells.concat(spongyCells()).concat(CHAIN);
    s.push(drawCells(cells));
    // lignified or suberised band on every radial wall of the sheath (shown by the toggle)
    s.push('<g data-r="lig" class="t4-hide">');
    for (i = 0; i < NBS; i++) {
      var a = da / 2 + i * da, c = Math.cos(a), sn = Math.sin(a);
      s.push('<path d="M' + (VC.x + 60 * c).toFixed(1) + ',' + (VC.y + 60 * sn).toFixed(1) + ' L' + (VC.x + 78 * c).toFixed(1) + ',' + (VC.y + 78 * sn).toFixed(1) + '" stroke="var(--t4-lig)" stroke-width="6" stroke-linecap="round"/>');
    }
    s.push('</g>');
    // vascular tissue inside the sheath
    s.push('<circle cx="' + VC.x + '" cy="' + VC.y + '" r="' + (R1 - 1) + '" fill="var(--t4-vasc)" stroke="var(--ink)" stroke-width=".8"/>');
    [[166, 324, 7], [183, 330, 6], [200, 324, 7], [176, 312, 4.5], [214, 314, 5], [190, 342, 5], [158, 312, 4], [206, 338, 4]].forEach(function (p) {
      s.push('<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + p[2] + '" class="t4-cyf" stroke="var(--ink2)" stroke-width="1"/>');
    });
    s.push('<g data-r="xylem">');
    [[160, 272, 13], [186, 266, 14], [210, 279, 11], [170, 297, 9], [196, 294, 10], [146, 292, 7]].forEach(function (p) {
      s.push('<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + p[2] + '" fill="var(--w2)" stroke="var(--ink)" stroke-width="3" class="t4-xv"/>');
      s.push('<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (p[2] - 3.5) + '" fill="none" stroke="var(--paper)" stroke-opacity=".55" stroke-width="1" stroke-dasharray="2 3"/>');
    });
    s.push('</g>');
    // aquaporins wherever two membranes meet across a shared wall (outside the route chain too)
    var aq = [];
    SPE.forEach(function (e, j) {
      if (j % 2) return;
      var a2 = SPN[e[0]], b2 = SPN[e[1]], mx = (a2[0] + b2[0]) / 2, my = (a2[1] + b2[1]) / 2, ang = Math.atan2(b2[1] - a2[1], b2[0] - a2[0]);
      [-1, 1].forEach(function (sg) { var px = mx + Math.cos(ang) * WALL * sg, py = my + Math.sin(ang) * WALL * sg; aq.push('<g transform="translate(' + px.toFixed(1) + ',' + py.toFixed(1) + ') rotate(' + (ang * 180 / Math.PI).toFixed(0) + ')"><rect x="-1.8" y="-3.4" width="3.6" height="6.8" rx="1" class="t4-aqg"/></g>'); });
    });
    s.push('<g class="t4-aqbg">' + aq.join('') + '</g>');
    // guard cells (pore width set by gs) over the substomatal cavity
    s.push('<g data-r="guard"></g>');
    s.push('<g data-r="routes"></g>');
    // plasmodesmata and callose
    s.push('<g data-r="pd">');
    PDS.forEach(function (p) {
      s.push('<g transform="translate(' + p.x + ',' + p.y + ')"><path d="M-6,-2.4 H6 M-6,2.4 H6" stroke="var(--t4-sym)" stroke-width="1.6"/>' +
        '<g class="t4-cal t4-hide"><ellipse cx="-3.2" cy="0" rx="2.6" ry="4.4" fill="var(--t4-callose)" stroke="var(--ink)" stroke-width=".6"/><ellipse cx="3.2" cy="0" rx="2.6" ry="4.4" fill="var(--t4-callose)" stroke="var(--ink)" stroke-width=".6"/></g></g>');
    });
    s.push('</g>');
    // aquaporin glyphs at the membrane crossings of the routes
    s.push('<g data-r="aqp">');
    CROSS_TM.concat(CROSS_SYM_IN).forEach(function (p, j) {
      s.push('<g transform="translate(' + p.x + ',' + p.y + ')" class="' + (j < CROSS_TM.length ? 't4-aq-tm' : 't4-aq-sym') + '"><rect x="-3" y="-5" width="6" height="10" rx="1.5" fill="var(--paper)" stroke="var(--pm)" stroke-width="1.4"/><path d="M0,-4 V4" stroke="var(--pm)" stroke-width="1.2"/></g>');
    });
    s.push('</g>');
    s.push('<g data-r="block" class="t4-hide" transform="translate(246,280.5) rotate(-16)"><rect x="-3" y="-11" width="6" height="22" fill="var(--t4-lig)" stroke="var(--paper)" stroke-width="1"/></g>');
    // evaporation sites
    s.push('<g stroke="var(--t4-vap)" stroke-width="1.4" fill="none" data-r="evap">' +
      '<path d="M528,292 q4,-3 8,0 t8,0"/><path d="M528,307 q4,-3 8,0 t8,0"/><path d="M512,326 q3,-3 6,0 t6,0"/></g>');
    s.push('<g data-r="parts"></g>');
    s.push('<path d="M630,505 V526" stroke="var(--t4-vap)" stroke-width="1.6" marker-end="url(#t4-arr)" fill="none"/>');
    function tag(x, y, t, lx, ly) {
      return (lx !== undefined ? '<path d="M' + x + ',' + y + ' L' + lx + ',' + ly + '" stroke="var(--ink)" stroke-width="1"/>' : '') +
        '<g transform="translate(' + x + ',' + y + ')"><g class="mintag" data-fs="' + (t.length > 2 ? 11 : (t.length > 1 ? 12 : 13)) + '"><circle r="' + (t.length > 2 ? 17 : (t.length > 1 ? 15 : 12)) + '" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.2"/><text text-anchor="middle" dy="4.5" font-size="' + (t.length > 2 ? 11 : (t.length > 1 ? 12 : 13)) + '" font-weight="600">' + t + '</text></g></g>';
    }
    s.push(tag(730, 42, 'UE'), tag(730, 120, 'PAL'), tag(128, 236, 'X', 160, 266), tag(96, 360, 'BS', 122, 345), tag(250, 372, 'SP', 286, 326), tag(612, 290, 'AIR'), tag(660, 398, 'SSC', 632, 420), tag(686, 474, 'S', 652, 472), tag(730, 474, 'LE'));
    s.push('<g transform="translate(100,516)"><path d="M0,0 H200" stroke="var(--ink)" stroke-width="3"/><path d="M0,-5 V5 M200,-5 V5" stroke="var(--ink)" stroke-width="1.2"/><text x="208" y="4.5" font-size="13" class="t4-t2">100 µm, schematic</text></g>');
    s.push('</svg>');
    return s.join('');
  }
  /* inset: one wall, two cells */
  function insetSVG() {
    var s = ['<svg viewBox="0 0 380 190" role="img" aria-labelledby="t4-in-t"><title id="t4-in-t">One wall, two cells: the wall between two cells is the apoplast, shared by both, with the middle lamella at its centre. Each cell has its own plasma membrane with aquaporins, then cytoplasm with chloroplasts, then the vacuole. A plasmodesma crosses the wall and joins the two cytoplasms.</title>'];
    s.push('<rect x="0" y="20" width="380" height="140" class="t4-cyf"/>');
    s.push('<rect x="166" y="20" width="48" height="140" class="t4-cwf"/><path d="M190,20 V160" stroke="var(--apo2)" stroke-width="1.4"/>');
    s.push('<path d="M163,20 V160 M217,20 V160" stroke="var(--pm)" stroke-width="2.4"/>');
    s.push('<path d="M0,40 H120 A20,20 0 0 1 140,60 V122 A20,20 0 0 1 120,142 H0" class="t4-vacf"/><path d="M0,40 H120 A20,20 0 0 1 140,60 V122 A20,20 0 0 1 120,142 H0" class="t4-tono"/>');
    s.push('<path d="M380,40 H260 A20,20 0 0 0 240,60 V122 A20,20 0 0 0 260,142 H380" class="t4-vacf"/><path d="M380,40 H260 A20,20 0 0 0 240,60 V122 A20,20 0 0 0 260,142 H380" class="t4-tono"/>');
    [[152, 34], [152, 150], [228, 34], [228, 150]].forEach(function (c) { s.push('<ellipse cx="' + c[0] + '" cy="' + c[1] + '" rx="4" ry="7" class="t4-chlo"/>'); });
    // aquaporins on each membrane
    [[163, 60], [217, 60], [163, 100], [217, 100]].forEach(function (a) { s.push('<rect x="' + (a[0] - 3) + '" y="' + (a[1] - 6) + '" width="6" height="12" rx="1.5" fill="var(--paper)" stroke="var(--pm)" stroke-width="1.6"/>'); });
    // plasmodesma: a membrane lined channel through the wall
    s.push('<path d="M163,128 H217 M163,136 H217" stroke="var(--pm)" stroke-width="1.6"/><path d="M163,132 H217" stroke="var(--t4-sym)" stroke-width="2.6"/>');
    s.push('<text x="40" y="14" font-size="12.5" font-weight="600">cell 1</text><text x="340" y="14" font-size="12.5" font-weight="600" text-anchor="end">cell 2</text>');
    s.push('<text x="190" y="12" font-size="12" text-anchor="middle">wall: the apoplast</text>');
    s.push('<text x="190" y="178" font-size="11.5" text-anchor="middle" class="t4-t2">middle lamella</text><path d="M190,168 V160" stroke="var(--ink2)"/>');
    s.push('<text x="4" y="178" font-size="11.5" class="t4-t2">vacuole, tonoplast dashed</text>');
    s.push('<text x="300" y="178" font-size="11.5" text-anchor="middle" class="t4-t2">plasma membrane</text><path d="M260,168 L219,150" stroke="var(--ink2)"/>');
    s.push('<text x="296" y="84" font-size="11.5" class="t4-t2">aquaporin</text><path d="M294,81 L221,62" stroke="var(--ink2)"/>');
    s.push('<text x="296" y="118" font-size="11.5" class="t4-t2">plasmodesma</text><path d="M294,116 L214,130" stroke="var(--ink2)"/>');
    s.push('</svg>');
    return s.join('');
  }

  var ROUTE_META = {
    apo: { name: 'Apoplastic', sub: 'along cell walls', color: 'var(--t4-apo)', dash: '' },
    sym: { name: 'Symplastic', sub: 'through plasmodesmata', color: 'var(--t4-sym)', dash: '7 5' },
    tm: { name: 'Transmembrane', sub: 'across membranes, aquaporins', color: 'var(--t4-tm)', dash: '' },
    vap: { name: 'Vapour phase', sub: 'through the air spaces', color: 'var(--t4-vap)', dash: '1.5 5' }
  };
  function swatch(k) {
    var m = ROUTE_META[k];
    return '<svg viewBox="0 0 30 12" aria-hidden="true"><path d="M2,6 H28" stroke="' + m.color + '" stroke-width="' + (k === 'apo' ? 5 : 2.6) + '" stroke-linecap="round" ' + (m.dash ? 'stroke-dasharray="' + m.dash + '"' : '') + ' fill="none"/>' +
      (k === 'tm' ? '<rect x="12" y="2" width="5" height="8" rx="1" fill="var(--paper)" stroke="var(--t4-tm)" stroke-width="1.2"/>' : '') + '</svg>';
  }

  function drawRoutes(res) {
    var g = refs.xs.querySelector('[data-r="routes"]');
    var p = res.partition, h = [];
    function w(f) { return 2 + 7 * f; }
    var widths = { apo: w(p.apo), sym: 2.2, tm: w(p.tm), vap: w(p.vap) };
    ['vap', 'apo', 'sym', 'tm'].forEach(function (k) {
      if (!local.routes[k]) return;
      var key = (k === 'apo' && local.lig) ? 'apoLig' : k;
      var pts = ROUTE_PTS[key], m = ROUTE_META[k];
      if (k === 'sym' && local.callose) pts = pts.slice(0, 4).concat([P(264, 289)]);
      h.push('<path class="t4-route" d="' + d(pts) + '" stroke="' + m.color + '" stroke-opacity="' + (k === 'vap' ? .8 : .42) + '" stroke-width="' + widths[k] + '" ' + (m.dash ? 'stroke-dasharray="' + m.dash + '"' : '') + '/>');
      if (k === 'apo' && local.lig) h.push('<path class="t4-route" d="' + d(ROUTE_PTS.apo.slice(0, 3)) + '" stroke="' + m.color + '" stroke-opacity=".25" stroke-width="2" stroke-dasharray="2 3"/>');
    });
    // shared vapour tail to the pore
    var anyOn = local.routes.apo || local.routes.sym || local.routes.tm || local.routes.vap;
    if (anyOn) h.push('<path class="t4-route" d="' + d(TAIL) + '" stroke="var(--t4-vap)" stroke-opacity=".75" stroke-width="2.4" stroke-dasharray="1.5 5"/>');
    g.innerHTML = h.join('');
    refs.xs.querySelector('[data-r="lig"]').classList.toggle('t4-hide', !local.lig);
    refs.xs.querySelector('[data-r="block"]').classList.toggle('t4-hide', !(local.lig && local.routes.apo));
    Array.prototype.forEach.call(refs.xs.querySelectorAll('.t4-cal'), function (n) { n.classList.toggle('t4-hide', !local.callose); });
    Array.prototype.forEach.call(refs.xs.querySelectorAll('.t4-aq-tm'), function (n) { n.style.display = local.routes.tm ? '' : 'none'; });
    Array.prototype.forEach.call(refs.xs.querySelectorAll('.t4-aq-sym'), function (n) { n.style.display = local.routes.sym ? '' : 'none'; });
    buildParticles(res);
  }

  function drawGuard(res) {
    var open = clamp(res.gs / res.gsMax, 0, 1), g = 2 + 13 * open, cx = 630, h = [];
    // two kidney shaped guard cells, mirrored
    [-1, 1].forEach(function (sd) {
      var xi = cx + sd * g / 2, xo = cx + sd * (g / 2 + 30);
      h.push('<path d="M' + xi + ',458 C' + (xi + sd * 6) + ',468 ' + (xi + sd * 6) + ',482 ' + xi + ',492 C' + (xo - sd * 2) + ',494 ' + (xo + sd * 2) + ',480 ' + xo + ',474 C' + (xo + sd * 1) + ',462 ' + (xo - sd * 4) + ',454 ' + xi + ',458 Z" fill="var(--t4-cyto)" stroke="var(--ink)" stroke-width="1.4"/>');
      h.push('<path d="M' + (xi + sd * 1.5) + ',461 C' + (xi + sd * 6) + ',470 ' + (xi + sd * 6) + ',481 ' + (xi + sd * 1.5) + ',489" stroke="var(--ink)" stroke-width="3.2" fill="none" stroke-linecap="round"/>');
      h.push('<ellipse cx="' + (cx + sd * (g / 2 + 17)) + '" cy="469" rx="2.6" ry="4" fill="var(--t4-chl)"/><ellipse cx="' + (cx + sd * (g / 2 + 21)) + '" cy="481" rx="2.6" ry="4" fill="var(--t4-chl)"/>');
    });
    refs.xs.querySelector('[data-r="guard"]').innerHTML = h.join('');
  }

  /* ------------------------------------------------------------ particles */
  var parts = [];
  function buildParticles(res) {
    var g = refs.xs.querySelector('[data-r="parts"]'), h = [];
    parts = [];
    var p = res.partition, NT = 34;
    var counts = { apo: Math.max(1, Math.round(NT * p.apo)), tm: Math.max(1, Math.round(NT * p.tm)), vap: Math.max(1, Math.round(NT * p.vap)), sym: 2 };
    ['apo', 'sym', 'tm', 'vap'].forEach(function (k) {
      if (!local.routes[k]) return;
      var key = (k === 'apo' && local.lig) ? 'apoLig' : k;
      for (var i = 0; i < counts[k]; i++) {
        var jit = k === 'apo' ? ((i * 7919) % 11 - 5) * 0.55 : 0;
        parts.push({ k: k, key: key, f: i / counts[k], jit: jit, idx: parts.length });
        h.push('<circle class="t4-pt" r="' + (k === 'sym' ? 4.2 : 4) + '" fill="' + ROUTE_META[k].color + '" stroke="var(--paper)" stroke-width="1"' + (k === 'sym' ? ' fill-opacity=".35" stroke="var(--t4-sym)" stroke-width="1.4"' : '') + '/>');
      }
    });
    g.innerHTML = h.join('');
    var circles = g.querySelectorAll('circle');
    parts.forEach(function (q, i) { q.node = circles[i]; });
    placeParticles();
  }
  function placeParticles() {
    parts.forEach(function (q) {
      var r = routes[q.key], s;
      var ph = (anim.phase[q.k] + q.f) % 1;
      if (q.k === 'sym' && local.callose) {
        // held at the first plasmodesma: queue just before it
        var stopS = 70 + q.f * 0; s = Math.min(stopS - q.f * 14, r.total);
        var pt = at(routes.sym, 52 - q.f * 22);
        q.node.setAttribute('cx', pt.x.toFixed(1)); q.node.setAttribute('cy', pt.y.toFixed(1));
        q.node.style.opacity = 1; return;
      }
      s = ph * r.total;
      var pt2 = at(r, s), vap = s > r.liquidLen;
      var y = pt2.y + (vap ? 0 : q.jit);
      q.node.setAttribute('cx', pt2.x.toFixed(1)); q.node.setAttribute('cy', y.toFixed(1));
      if (vap && q.k !== 'vap') { q.node.setAttribute('fill', 'var(--t4-vap)'); q.node.setAttribute('r', '3.2'); }
      else if (q.k !== 'sym') { q.node.setAttribute('fill', ROUTE_META[q.k].color); q.node.setAttribute('r', '4'); }
      // fade at the start and at the exit
      var fade = Math.min(1, ph * 14, (1 - ph) * 10);
      q.node.style.opacity = fade.toFixed(2);
    });
  }
  function visible() { return el && el.offsetParent !== null && !document.hidden; }
  function tick(t) {
    anim.raf = 0;
    if (!visible() || ui.reducedMotion()) { anim.last = 0; return; }
    var dt = anim.last ? Math.min(0.1, (t - anim.last) / 1000) : 0; dt *= (window.PlaySpeed ? window.PlaySpeed.get() : 1);
    anim.last = t;
    var E = lastRes ? lastRes.E : 0;
    var v = clamp(14 * E, 0, 120);  // units per second, proportional to E
    ['apo', 'sym', 'tm', 'vap'].forEach(function (k) {
      var key = (k === 'apo' && local.lig) ? 'apoLig' : k;
      anim.phase[k] = (anim.phase[k] + v * dt / routes[key].total) % 1;
    });
    placeParticles();
    anim.raf = requestAnimationFrame(tick);
  }
  function startAnim() {
    if (anim.raf || !el) return;
    if (ui.reducedMotion()) { placeParticles(); return; }
    anim.last = 0;
    anim.raf = requestAnimationFrame(tick);
  }

  /* ------------------------------------------------------------ hydraulics readouts */
  var LIG_F = 1.6; // ILLUSTRATIVE: R-ox × (1 + 1.6) so K-ox and K-leaf both fall by more than half at the default settings
  function hyd(res, lig) {
    var Rbs = res.R.bs, Rmes = res.R.mes, Rx = res.R.leafX;
    if (lig) Rbs = Rbs + LIG_F * (res.R.bs + res.R.mes);
    var Rox = Rbs + Rmes;
    return { Rbs: Rbs, Rmes: Rmes, Rx: Rx, Rox: Rox, Kox: 1 / Rox, Kleaf: 1 / (Rx + Rox), share: Rox / (Rx + Rox) };
  }
  function Rfmt(r) { return num(r * 1000, 1); } // MPa m² s mmol⁻¹ to MPa m² s mol⁻¹

  function drawTiles(st, res) {
    var a = hyd(res, local.lig), o = hyd(res, false), h = [];
    function tile(k, v, unit, sub, hi) { return '<div class="tile' + (hi ? ' hi' : '') + '"><div class="k">' + k + '</div><div class="v">' + v + ' <small>' + unit + '</small></div>' + (sub ? '<div class="s">' + sub + '</div>' : '') + '</div>'; }
    var RU = 'MPa m² s mol⁻¹', KU = 'mmol m⁻² s⁻¹ MPa⁻¹';
    h.push(tile('R<sub>bs</sub> sheath', Rfmt(a.Rbs), RU, local.lig ? 'open walls: ' + Rfmt(o.Rbs) : 'membranes at the sheath, set by P<sub>f</sub> ' + num(res.Pf, 0) + ' µm s⁻¹', local.lig));
    h.push(tile('R<sub>mes</sub> mesophyll', Rfmt(a.Rmes), RU, 'rises as the leaf dries (f<sub>Kox</sub> ' + num(res.fKox, 2) + ')'));
    h.push(tile('K<sub>ox</sub> outside xylem', num(a.Kox, 1), KU, local.lig ? num(100 * (1 - a.Kox / o.Kox), 0) + ' % lower than open walls' : 'R<sub>ox</sub> is ' + num(100 * a.share, 0) + ' % of leaf resistance', local.lig));
    h.push(tile('K<sub>leaf</sub>', num(a.Kleaf, 1), KU, local.lig ? num(100 * (1 - a.Kleaf / o.Kleaf), 0) + ' % lower than open walls' : 'R<sub>x</sub> ' + Rfmt(a.Rx) + ' + R<sub>ox</sub> ' + Rfmt(a.Rox), local.lig));
    refs.tiles.innerHTML = h.join('');
    var E = res.E, base = res.psi.leafX;
    refs.eqs.innerHTML =
      '<div>K<sub>leaf</sub> = 1 ÷ (R<sub>x</sub> + R<sub>ox</sub>) = 1000 ÷ (' + Rfmt(a.Rx) + ' + ' + Rfmt(a.Rox) + ') = <span class="r">' + num(a.Kleaf, 2) + '</span> mmol m⁻² s⁻¹ MPa⁻¹</div>' +
      '<div>R<sub>ox</sub> = R<sub>bs</sub> + R<sub>mes</sub>; R<sub>bs</sub> = R<sub>bs,0</sub> × P<sub>f,ref</sub> ÷ P<sub>f</sub> ÷ f<sub>Kox</sub> = ' + Rfmt(WP.model.baseR(st.crop).bs) + ' × ' + num(WP.params.gate.PF_REF.v, 0) + ' ÷ ' + num(res.Pf, 0) + ' ÷ ' + num(res.fKox, 2) + ' = ' + Rfmt(res.R.bs) + '; R<sub>mes</sub> = R<sub>mes,0</sub> ÷ f<sub>Kox</sub>' + (local.lig ? ', then + 1.6 R<sub>ox</sub> for the lignified what if' : '') + '</div>' +
      '<div>Mesophyll split: R<sub>SP</sub> (spongy, in series from sheath to the lower stomata) = ' + Rfmt(res.R.spongy) + '; R<sub>PAL</sub> (palisade side branch, no net flow at steady state: a buffer) = ' + Rfmt(res.R.palisade) + ' ' + ui.badge('ILLUSTRATIVE', 'Most flow runs sheath to spongy mesophyll to the abaxial stomata (Buckley et al. 2015; Yaaran et al. 2023).') + '</div>' +
      '<div>Ψ<sub>end</sub> = Ψ<sub>leaf xylem</sub> − E × R<sub>ox</sub> = ' + WP.fmt.psi(base) + ' − ' + num(E / 1000, 5) + ' mol m⁻² s⁻¹ × ' + Rfmt(a.Rox) + ' = <span class="r">' + WP.fmt.psi(base - E * a.Rox) + '</span>' + (local.lig ? ' (same E, stomata held still; the model would then close them)' : '') + '</div>' +
      '<div style="font-family:var(--ui);font-size:12px;color:var(--ink2);margin-top:4px">R in MPa m² s mol⁻¹ (the engine works in mmol, × 1000). Split of 1 ÷ K<sub>plant</sub>: leaf xylem 0.10, sheath 0.15, mesophyll 0.10 ' + ui.badge('ILLUSTRATIVE', 'Teaching split, not data.') + '. Lignified multiplier 1.6 ' + ui.badge('ILLUSTRATIVE', 'Chosen so K-ox and K-leaf both fall by more than half, the size Ohtsuka et al. found between species.') + '</div>';
  }

  /* ------------------------------------------------------------ loss before breakage */
  /* Albuquerque et al. 2020 J Exp Bot 71: 7286, Fig. 6 legend fits (Cabernet Sauvignon), replotted from the equations:
     Kleaf = 0.071 + 14.453 e^(2.302 Ψ), gs = −0.061 + 0.334 e^(0.884 Ψ); maxima at Ψ = 0: 14.524 and 0.273.
     Table 2: Kleaf P50 −0.30, P80 −0.71; gs P50 −0.60, P80 −1.21; TLP −1.37 MPa. Phones get a narrower viewBox so text stays legible. */
  var ALB = {
    k: function (p) { return 100 * (0.071 + 14.453 * Math.exp(2.302 * p)) / 14.524; },
    g: function (p) { return Math.max(0, 100 * (-0.061 + 0.334 * Math.exp(0.884 * p)) / 0.273); },
    tlp: -1.37
  };
  var LW = { W: 640, l: 60, r: 22, t: 46, h: 196 };
  function lossGeom() { var ph = window.innerWidth < 600; LW.W = ph ? 420 : 640; LW.t = ph ? 52 : 46; LW.ph = ph; }
  var LX = function (psi) { return LW.l + (-psi / 2.0) * (LW.W - LW.l - LW.r); };
  var LY = function (pct) { return LW.t + (1 - pct / 100) * LW.h; };
  function lossChartStatic() {
    lossGeom();
    var s = [], W = LW.W, B = LW.t + LW.h, H = B + 52, ph = LW.ph;
    s.push('<svg viewBox="0 0 ' + W + ' ' + H + '" class="t4-chart" role="img" aria-labelledby="t4-lc-t t4-lc-d"><title id="t4-lc-t">Grapevine leaf: conductance is lost before the first embolism</title><desc id="t4-lc-d">Published fits for Cabernet Sauvignon replotted from their equations: leaf hydraulic conductance falls to 20 percent of its maximum by minus 0.71 MPa and stomatal conductance by minus 1.21 MPa. Turgor is lost at minus 1.37 MPa and the first midrib embolism appears near minus 1.25 MPa. The model curve and your leaf now are drawn on top.</desc>');
    s.push('<rect x="' + LX(0) + '" y="' + LW.t + '" width="' + (LX(-1.25) - LX(0)) + '" height="' + LW.h + '" fill="var(--t4-tm)" opacity=".11"/>');
    s.push('<text x="' + LX(0) + '" y="18" style="fill:var(--ink)">% of maximum remaining</text>');
    s.push('<text x="' + (LX(-0.62)) + '" y="' + (B - 10) + '" text-anchor="middle" style="font-style:italic;fill:var(--ink)">loss before breakage</text>');
    for (var i = 0; i <= 4; i++) {
      var x = LX(-i * 0.5);
      s.push('<path class="gl" d="M' + x + ',' + LW.t + ' V' + B + '"/><text x="' + x + '" y="' + (B + 18) + '" text-anchor="middle">' + (i ? MINUS + (i * 0.5).toFixed(1) : '0') + '</text>');
    }
    [0, 50, 100].forEach(function (p) { s.push('<path class="gl" d="M' + LW.l + ',' + LY(p) + ' H' + (W - LW.r) + '"/><text x="' + (LW.l - 6) + '" y="' + (LY(p) + 4) + '" text-anchor="end">' + p + ' %</text>'); });
    s.push('<path class="ax" d="M' + LW.l + ',' + LW.t + ' V' + B + ' H' + (W - LW.r) + '"/>');
    s.push('<text x="' + ((LW.l + W - LW.r) / 2) + '" y="' + (B + 40) + '" text-anchor="middle" style="fill:var(--ink)">leaf water potential, MPa</text>');
    // measured fits (Fig. 6), drawn as solid lines
    function fitPath(f, lo) { var d = []; for (var p = 0; p >= lo; p -= 0.02) d.push((d.length ? 'L' : 'M') + LX(p).toFixed(1) + ',' + LY(f(p)).toFixed(1)); return d.join(' '); }
    s.push('<path d="' + fitPath(ALB.k, -2) + '" stroke="var(--t4-tm)" stroke-width="3" fill="none"/>');
    // r5 (PhD panel 11): the gs fit heads to zero near −1.92 MPa. Solid down to 5 % of maximum (about −1.70), then thin and dotted,
    // labelled as extrapolated: a fitted exponential is not evidence that gs reaches 0.
    function fitSeg(f, hi, lo) { var d = []; for (var p = hi; p >= lo - 1e-9; p -= 0.02) d.push((d.length ? 'L' : 'M') + LX(p).toFixed(1) + ',' + LY(f(p)).toFixed(1)); return d.join(' '); }
    s.push('<path d="' + fitSeg(ALB.g, 0, -1.70) + '" stroke="var(--warm)" stroke-width="3" fill="none"/>');
    s.push('<path d="' + fitSeg(ALB.g, -1.70, -1.92) + '" stroke="var(--warm)" stroke-width="1.6" stroke-dasharray="2 4" fill="none" opacity=".75"/>');
    s.push('<text x="' + (LX(-1.80)) + '" y="' + (LY(4) - 10) + '" text-anchor="middle" style="fill:var(--ink2);font-size:' + (ph ? 13 : 11.5) + 'px;font-style:italic">extrapolated</text>');
    // turgor loss point
    s.push('<path d="M' + LX(ALB.tlp) + ',' + LW.t + ' V' + B + '" stroke="var(--ink2)" stroke-width="1.4" stroke-dasharray="1.5 3"/>');
    s.push('<text x="' + (LX(ALB.tlp) + 5) + '" y="' + (LW.t + LW.h * 0.42) + '" text-anchor="start" style="fill:var(--ink2)">TLP</text>');
    // embolism onset
    s.push('<path d="M' + LX(-1.25) + ',' + LW.t + ' V' + B + '" stroke="var(--ink3)" stroke-width="3.5"/>');
    s.push('<text x="' + LX(-1.25) + '" y="' + (LW.t - 8) + '" text-anchor="middle" style="fill:var(--ink);font-weight:600">first midrib embolism</text>');
    // published P80 points (Table 2)
    s.push('<circle cx="' + LX(-0.71) + '" cy="' + LY(20) + '" r="7" fill="var(--t4-tm)" stroke="var(--paper)" stroke-width="2"/>');
    s.push('<rect x="' + (LX(-1.21) - 6.5) + '" y="' + (LY(20) - 6.5) + '" width="13" height="13" fill="var(--warm)" stroke="var(--paper)" stroke-width="2"/>');
    s.push('<g data-r="now"></g>');
    s.push('</svg>');
    return s.join('');
  }
  // Model K-leaf against model leaf Ψ (end of the outside xylem path), from a soil sweep at today's weather.
  function modelCurve(st) {
    var pts = [], base = {}, k;
    for (k in st) base[k] = st[k];
    for (var sp = -0.02; sp >= -2.0; sp -= 0.04) {
      base.soilPsi = sp;
      var r = WP.solve(base);
      pts.push({ p: r.psi.leafOut, k: r.KleafPct, g: r.gsMax ? 100 * r.gs / (r.gsMax * Math.max(1e-6, r.fLight)) : 0 });
      if (r.psi.leafOut < -2.05) break;
    }
    return pts;
  }
  function lossNow(st, res) {
    var g = refs.loss.querySelector('[data-r="now"]');
    var p = res.psi.leafOut, x = LX(clamp(p, -2, 0));
    var off = p < -2;
    var lab = (st.crop === 'grape' ? 'your vine now ' : 'model ' + (st.crop === 'almond' ? 'almond' : 'romaine') + ' leaf, not grapevine, ') + WP.fmt.psi(p) + (off ? ' (off scale)' : '');
    var anchor = x > LW.W * 0.52 ? 'end' : 'start', tx = x + (anchor === 'end' ? -7 : 7);
    if (LW.ph) lab = (st.crop === 'grape' ? 'your vine ' : 'model leaf ') + WP.fmt.psi(p) + (off ? ' (off scale)' : '');
    var cv = modelCurve(st);
    var kpts = cv.filter(function (q) { return q.p >= -2; }).map(function (q) { return LX(q.p).toFixed(1) + ',' + LY(q.k).toFixed(1); });
    var ghost = '';
    if (local.oa && st.crop === 'grape') {
      // ILLUSTRATIVE: osmotic adjustment shifts K-leaf vulnerability and stomatal closure more negative (direction: Martorell 2015; Herrera 2022)
      var SH = -0.3;
      ghost = '<polyline points="' + cv.filter(function (q) { return q.p + SH >= -2; }).map(function (q) { return LX(q.p + SH).toFixed(1) + ',' + LY(q.k).toFixed(1); }).join(' ') + '" fill="none" stroke="var(--t4-tm)" stroke-width="1.6" stroke-dasharray="2 4" opacity=".7"/>' +
        '<path d="M' + LX(SH) + ',' + LY(100) + ' L' + LX(-1.2 + SH) + ',' + LY(20) + '" stroke="var(--warm)" stroke-width="1.4" stroke-dasharray="2 4" fill="none" opacity=".8"/>' +
        '<text x="' + LX(-1.98) + '" y="' + LY(36) + '" text-anchor="end" style="fill:var(--ink2);font-style:italic">' + (LW.ph ? 'adjusted (ghosts)' : 'after osmotic adjustment (ghosts)') + '</text>';
    }
    var ky = LY(res.KleafPct);
    g.innerHTML = ghost + '<polyline points="' + kpts.join(' ') + '" fill="none" stroke="var(--t4-tm)" stroke-width="1.5" stroke-dasharray="6 3" opacity=".75"/>' +
      '<path d="M' + x + ',' + LW.t + ' V' + (LW.t + LW.h) + '" stroke="var(--ink)" stroke-width="1.6" stroke-dasharray="5 3"/>' +
      (off ? '' : '<circle cx="' + x.toFixed(1) + '" cy="' + ky.toFixed(1) + '" r="5.5" fill="var(--wall)" stroke="var(--t4-tm)" stroke-width="2.6"/>') +
      '<text x="' + tx + '" y="' + (LW.t + 16) + '" text-anchor="' + anchor + '" style="fill:var(--ink);font-weight:600;paint-order:stroke;stroke:var(--wall);stroke-width:4px">' + esc(lab) + '</text>';
    var p80 = null;
    for (var i = 0; i < cv.length; i++) if (cv[i].k <= 20) { p80 = cv[i].p; break; }
    var kn = el && el.querySelector('[data-r="koxnow"]');
    if (kn) kn.innerHTML = 'Model K<sub>leaf</sub> now: ' + num(res.KleafPct, 0) + ' % of its maximum' + (st.crop === 'grape' ? '' : ' (model ' + (st.crop === 'almond' ? 'almond' : 'romaine') + ' curve, not grapevine data)') + '. ' +
      (st.crop === 'grape' && !st.koxLeaf ? 'Model shape ' + ui.badge('ILLUSTRATIVE', 'Logistic in vein Ψ, anchored to the published point.') + ': its 80 % loss falls near ' + (p80 !== null ? WP.fmt.psi(p80) : 'the end of the axis') + ', later than the measured P<sub>80</sub> of ' + MINUS + '0.71 MPa (Cabernet Sauvignon, Table 2). The model is an approximation; the two solid curves are the measured fits.' : '') +
      (st.koxLeaf ? ' Runaway what if is on: read at the leaf Ψ, the curve drags a well watered vine down to its floor.' : '') +
      '<span class="tier-3"> The model reads the outside xylem curve at the vein Ψ (now ' + WP.fmt.psi(res.psi.leafX) + '), ' + num(res.psi.leafX - res.psi.leafOut, 2) + ' MPa above the leaf Ψ.</span>';
  }
  function stripSVG() {
    var ph = window.innerWidth < 600, W = ph ? 420 : 640, X = function (p) { return 24 + p / 100 * (W - 48); }, s = [];
    s.push('<svg viewBox="0 0 ' + W + ' ' + (ph ? 196 : 170) + '" class="t4-chart t4-strip" role="img" aria-labelledby="t4-st-t t4-st-d"><title id="t4-st-t">Share of leaf conductance lost before a benchmark, published compilations</title><desc id="t4-st-d">Before the first embolism, 11 studies and 34 species: 9 to 99 percent, mean 66 percent. Before wilting, 56 studies and 310 species: 0 to 96 percent, mean 40 percent, figures quoted from Scoffoni et al. 2023 (secondary).</desc>');
    var g0 = 22, g1 = ph ? 164 : 138;
    for (var i = 0; i <= 10; i++) s.push('<path class="gl" d="M' + X(i * 10) + ',' + g0 + ' V' + g1 + '"/>');
    [0, 25, 50, 75, 100].forEach(function (p) { s.push('<text x="' + X(p) + '" y="' + (g1 + 18) + '" text-anchor="middle">' + p + ' %</text>'); });
    function row(y, lo, hi, mean, lab, note) {
      return '<text x="' + X(0) + '" y="' + (y - 13) + '" style="fill:var(--ink)">' + lab + '</text>' +
        '<rect x="' + X(lo) + '" y="' + (y - 7) + '" width="' + (X(hi) - X(lo)) + '" height="14" fill="var(--t4-tm)" fill-opacity=".28" stroke="var(--t4-tm)" stroke-width="1.2"/>' +
        '<path d="M' + X(mean) + ',' + (y - 12) + ' V' + (y + 12) + '" stroke="var(--ink)" stroke-width="3"/>' +
        '<text x="' + X(lo) + '" y="' + (y + 26) + '" text-anchor="start">' + lo + '</text><text x="' + X(hi) + '" y="' + (y + 26) + '" text-anchor="end">' + hi + '</text><text x="' + X(mean) + '" y="' + (y + 26) + '" text-anchor="middle" style="fill:var(--ink);font-weight:600">mean ' + mean + '</text>' +
        (note ? '<text x="' + X(lo) + '" y="' + (y + 41) + '" text-anchor="start" style="font-style:italic">' + note + '</text>' : '');
    }
    s.push(row(48, 9, 99, 66, ph ? 'before first embolism: 34 species' : 'before the first embolism: 11 studies, 34 species', '9: Lantana camara'));
    s.push(row(ph ? 124 : 112, 0, 96, 40, ph ? 'before wilting: 310 species (secondary)' : 'before wilting: 56 studies, 310 species (secondary)'));
    s.push('</svg>');
    return s.join('');
  }

  /* ------------------------------------------------------------ embolism versus collapse (concept only) */
  function failSVG() {
    var s = [], ph = window.innerWidth < 600;
    s.push('<svg viewBox="' + (ph ? '0 0 352 600' : '0 0 700 300') + '" role="img" aria-labelledby="t4-f-t t4-f-d"><title id="t4-f-t">Two ways a conduit can stop carrying water</title><desc id="t4-f-d">Concept drawing with no data. Left: a gas filled conduit next to a water filled conduit under tension; air is pulled through the largest pore of the pit membrane between them. Right: a water filled conduit holding its round shape next to one whose wall has buckled inward while it stays full of water.</desc>');
    s.push('<text x="175" y="22" text-anchor="middle" font-size="15" font-weight="600">Air seeding: the conduit fills with gas</text>');
    s.push(ph ? '<path d="M10,298 H342" stroke="var(--rule)" stroke-width="1" stroke-dasharray="3 4"/>' : '<path d="M352,36 V284" stroke="var(--rule)" stroke-width="1" stroke-dasharray="3 4"/>');
    // left: gas filled A, water B, pit between
    s.push('<circle cx="100" cy="150" r="62" fill="var(--emb)" stroke="var(--ink)" stroke-width="7"/>');
    s.push('<circle cx="246" cy="150" r="62" fill="var(--w2)" stroke="var(--ink)" stroke-width="7"/>');
    s.push('<rect x="160" y="134" width="28" height="32" fill="var(--wall)" stroke="var(--ink)" stroke-width="1.2"/>');
    s.push('<path d="M174,134 V166" stroke="var(--ink2)" stroke-width="2" stroke-dasharray="3 2.4"/>');
    s.push('<path d="M168,150 h14" stroke="var(--paper)" stroke-width="3"/><path d="M162,150 q14,-8 24,0" stroke="var(--t4-vap)" stroke-width="2" fill="none"/>');
    s.push('<path d="M190,150 C204,150 212,150 222,150" stroke="var(--paper)" stroke-width="2.4" fill="none" marker-end="url(#t4-arrf)"/>');
    s.push('<text x="100" y="236" text-anchor="middle" font-size="13">A, gas filled</text><text x="100" y="252" text-anchor="middle" font-size="12" class="t4-t2">near atmospheric pressure</text>');
    s.push('<text x="246" y="236" text-anchor="middle" font-size="13">B, water under tension</text><text x="246" y="252" text-anchor="middle" font-size="12" class="t4-t2">Ψp negative</text>');
    s.push('<path d="M174,132 V74" stroke="var(--ink)" stroke-width="1"/><text x="174" y="52" text-anchor="middle" font-size="12.5">pit membrane: its largest pore</text><text x="174" y="67" text-anchor="middle" font-size="12.5">sets the threshold</text>');
    s.push('<text x="175" y="280" text-anchor="middle" font-size="12" class="t4-t2">Not boiling and not heat: air is pulled in.</text>');
    // right: round water, buckled water (stacked under the left panel on phones)
    s.push('<g' + (ph ? ' transform="translate(-352,304)"' : '') + '>');
    s.push('<text x="530" y="22" text-anchor="middle" font-size="15" font-weight="600">Collapse: the wall buckles</text>');
    s.push('<circle cx="450" cy="150" r="56" fill="var(--w2)" stroke="var(--ink)" stroke-width="6"/>');
    s.push('<path d="M600,96 C640,96 664,120 664,150 C664,182 640,206 602,206 C566,206 548,190 556,170 C564,154 574,146 566,132 C556,114 566,96 600,96 Z" fill="var(--w2)" stroke="var(--ink)" stroke-width="6" stroke-linejoin="round"/>');
    [[574, 150], [584, 124], [584, 180]].forEach(function (a) { s.push('<path d="M' + (a[0] + 2) + ',' + a[1] + ' h14" stroke="var(--paper)" stroke-width="2" marker-end="url(#t4-arrf)"/>'); });
    s.push('<text x="606" y="78" text-anchor="middle" font-size="12">tension pulls the wall in</text>');
    s.push('<text x="450" y="236" text-anchor="middle" font-size="13">water filled, round</text><text x="450" y="252" text-anchor="middle" font-size="12" class="t4-t2">thick wall holds its shape</text>');
    s.push('<text x="606" y="236" text-anchor="middle" font-size="13">water filled, buckled</text><text x="606" y="252" text-anchor="middle" font-size="12" class="t4-t2">still blue: no gas inside</text>');
    s.push('<text x="530" y="276" text-anchor="middle" font-size="12" class="t4-t2">A gas filled conduit cannot collapse:</text><text x="530" y="291" text-anchor="middle" font-size="12" class="t4-t2">no tension pulls on its walls.</text>');
    s.push('</g>');
    s.push('<defs><marker id="t4-arrf" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="var(--paper)"/></marker>' +
      '<marker id="t4-arrk" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="var(--ink)"/></marker></defs>');
    s.push('</svg>');
    return s.join('');
  }
  function torusSVG() {
    var s = ['<svg viewBox="0 0 420 170" role="img" aria-label="Conifer bordered pit, face view and aspirated side view. Concept drawing."><text x="90" y="18" text-anchor="middle" font-size="13" font-weight="600">face view</text><text x="300" y="18" text-anchor="middle" font-size="13" font-weight="600">aspirated, side view</text>'];
    s.push('<circle cx="90" cy="92" r="62" fill="var(--wall)" stroke="var(--ink)" stroke-width="1.4"/>');
    for (var i = 0; i < 24; i++) { var a = i / 24 * 2 * Math.PI; s.push('<path d="M' + (90 + 24 * Math.cos(a)).toFixed(1) + ',' + (92 + 24 * Math.sin(a)).toFixed(1) + ' L' + (90 + 60 * Math.cos(a + .12)).toFixed(1) + ',' + (92 + 60 * Math.sin(a + .12)).toFixed(1) + '" stroke="var(--ink2)" stroke-width=".8"/>'); }
    s.push('<circle cx="90" cy="92" r="24" fill="var(--t4-cwl)" stroke="var(--ink)" stroke-width="1.4"/><text x="90" y="96" text-anchor="middle" font-size="11">torus</text><text x="90" y="166" text-anchor="middle" font-size="11" class="t4-t2">margo: porous mesh, carries flow</text>');
    // side view: two cells, pit chamber, membrane pressed to the right aperture
    s.push('<rect x="210" y="40" width="70" height="104" fill="var(--emb)"/><rect x="320" y="40" width="70" height="104" fill="var(--w2)"/>');
    s.push('<path d="M280,40 V74 L310,84 V100 L280,110 V144 M320,40 V74 L310,84 M310,100 L320,110 V144" stroke="var(--ink)" stroke-width="3" fill="none"/>');
    s.push('<path d="M282,58 C300,70 306,80 308,92 C306,104 300,114 282,126" stroke="var(--ink2)" stroke-width="1" fill="none"/><rect x="306" y="80" width="6" height="24" fill="var(--t4-cwl)" stroke="var(--ink)" stroke-width="1"/>');
    s.push('<text x="245" y="160" text-anchor="middle" font-size="11">gas</text><text x="355" y="160" text-anchor="middle" font-size="11">water</text><text x="300" y="36" text-anchor="middle" font-size="11">torus seals the aperture</text></svg>');
    return s.join('');
  }

  /* ------------------------------------------------------------ turgor and the pressure volume curve */
  function pv(pio, eps) {
    var Rt = 1 + pio / eps; // RWC at turgor loss
    function parts(R) {
      var ps = pio / R, pp = R >= Rt ? -pio + eps * (R - 1) : 0;
      return { s: ps, p: pp, w: ps + pp };
    }
    function Rof(psi) {
      // invert Ψw(R) = psi; Ψw increases with R
      if (psi >= 0) return 1;
      var tlp = pio / Rt;
      if (psi <= tlp) return clamp(pio / psi, 0.2, Rt);
      var lo = Rt, hi = 1;
      for (var i = 0; i < 60; i++) { var m = (lo + hi) / 2; if (parts(m).w > psi) hi = m; else lo = m; }
      return (lo + hi) / 2;
    }
    return { Rt: Rt, tlp: pio / Rt, parts: parts, Rof: Rof };
  }
  function cellParams() { return { pio: local.pio - (local.oa ? 0.5 : 0), eps: local.eps }; }

  function organelles(cx, cy, W, H) {
    var o = [], n = 12;
    for (var i = 0; i < n; i++) {
      var a = i / n * 2 * Math.PI + 0.2, x = cx + (W / 2 - 12) * Math.cos(a), y = cy + (H / 2 - 12) * Math.sin(a);
      o.push('<ellipse cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" rx="5" ry="3" transform="rotate(' + (a * 180 / Math.PI + 90).toFixed(0) + ' ' + x.toFixed(1) + ' ' + y.toFixed(1) + ')" fill="var(--t4-chl)"/>');
    }
    o.push('<circle cx="' + (cx - W / 2 + 22) + '" cy="' + (cy + H / 2 - 24) + '" r="9" fill="var(--t4-cwl)" stroke="var(--ink2)" stroke-width="1"/>');
    return o.join('');
  }
  function cellSVG(st, res) {
    var c = cellParams(), m = pv(c.pio, c.eps), psi = res.psi.leafOut, R = m.Rof(psi), q = m.parts(R);
    var sc = clamp(1 - 1.5 * (1 - R), 0.45, 1.03), W = 190 * sc, H = 150 * sc, cx = 130, cy = 120;
    var x0 = cx - W / 2, y0 = cy - H / 2, wilt = q.p <= 1e-6, h = [];
    h.push('<svg viewBox="0 0 260 250" role="img" aria-label="' + esc('A leaf cell at leaf water potential ' + WP.fmt.psi(psi) + '. ' + (wilt ? 'Turgor is lost: the wall has buckled inward.' : 'Turgor pressure ' + WP.fmt.psi(q.p) + ' pushes the membrane against the wall.')) + '">');
    if (!wilt) {
      h.push('<rect x="' + x0 + '" y="' + y0 + '" width="' + W + '" height="' + H + '" rx="26" fill="var(--t4-cw)" stroke="var(--ink)" stroke-width="5"/>');
      h.push('<rect x="' + (x0 + 6) + '" y="' + (y0 + 6) + '" width="' + (W - 12) + '" height="' + (H - 12) + '" rx="21" fill="var(--t4-cyto)" stroke="var(--t4-chl)" stroke-width="1.6"/>');
      h.push('<rect x="' + (x0 + 18) + '" y="' + (y0 + 18) + '" width="' + (W - 36) + '" height="' + (H - 36) + '" rx="16" fill="var(--t4-vac)" stroke="var(--t4-tm)" stroke-width="1"/>');
      h.push(organelles(cx, cy, W, H));
      var n = Math.round(clamp(q.p / 0.25, 1, 10)), L = 8 + 6 * clamp(q.p, 0, 2);
      for (var i = 0; i < n; i++) {
        var a = i / n * 2 * Math.PI + 0.3, rx = (W / 2 - 30), ry = (H / 2 - 30);
        var px = cx + rx * Math.cos(a), py = cy + ry * Math.sin(a);
        h.push('<path d="M' + px.toFixed(1) + ',' + py.toFixed(1) + ' l' + (L * Math.cos(a)).toFixed(1) + ',' + (L * Math.sin(a)).toFixed(1) + '" stroke="var(--warm)" stroke-width="2.2" marker-end="url(#t4-arrw)"/>');
      }
    } else {
      // wall follows the shrinking protoplast inward: buckled outline
      var pts = [], N = 28;
      for (var j = 0; j <= N; j++) {
        var b = j / N * 2 * Math.PI, wob = 1 - 0.07 * Math.abs(Math.sin(4 * b));
        pts.push(P(cx + (W / 2) * wob * Math.cos(b) * 0.98, cy + (H / 2) * wob * Math.sin(b)));
      }
      h.push('<path d="' + d(pts) + ' Z" fill="var(--t4-cw)" stroke="var(--ink)" stroke-width="5" stroke-linejoin="round"/>');
      h.push('<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + (W / 2 - 12) + '" ry="' + (H / 2 - 12) + '" fill="var(--t4-cyto)" stroke="var(--t4-chl)" stroke-width="1.6"/>');
      h.push('<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + (W / 2 - 26) + '" ry="' + (H / 2 - 26) + '" fill="var(--t4-vac)" stroke="var(--t4-tm)" stroke-width="1"/>');
      h.push(organelles(cx, cy, W - 14, H - 14));
    }
    h.push('<text x="130" y="232" text-anchor="middle" font-size="14" font-weight="600">' + (wilt ? 'Turgor lost: the leaf wilts' : 'Turgid: the leaf stays flat') + '</text>');
    h.push('<defs><marker id="t4-arrw" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="var(--warm)"/></marker></defs></svg>');
    refs.cell.innerHTML = h.join('');
    return { m: m, R: R, q: q, c: c };
  }

  function pvChart(st, res, cs) {
    var m = cs.m, h = [], c = cs.c;
    if (local.pv === 'classic') {
      // −1/Ψw against 1 − RWC
      var X = function (f) { return 56 + f / 0.4 * 500; }, Y = function (v) { return 30 + (1 - v / 2.5) * 210; };
      h.push('<svg viewBox="0 0 600 290" class="t4-chart" role="img" aria-label="Pressure volume curve: minus one over water potential against relative water deficit, with the turgor loss point marked">');
      for (var i = 0; i <= 4; i++) h.push('<path class="gl" d="M' + X(i * 0.1) + ',30 V240"/><text x="' + X(i * 0.1) + '" y="258" text-anchor="middle">' + (i * 0.1).toFixed(1) + '</text>');
      [0, 0.5, 1, 1.5, 2, 2.5].forEach(function (v) { h.push('<path class="gl" d="M56,' + Y(v) + ' H556"/><text x="50" y="' + (Y(v) + 4) + '" text-anchor="end">' + v.toFixed(1) + '</text>'); });
      h.push('<path class="ax" d="M56,30 V240 H556"/><text x="306" y="282" text-anchor="middle" style="fill:var(--ink)">1 − RWC, relative water deficit</text><text x="14" y="135" text-anchor="middle" transform="rotate(-90 14 135)">−1 ÷ Ψw, MPa⁻¹</text>');
      var pts = [];
      for (var f = 0.004; f <= 0.4; f += 0.004) { var w = m.parts(1 - f).w; if (w < 0) pts.push(P(X(f), Y(clamp(-1 / w, 0, 2.6)))); }
      h.push('<path d="' + d(pts) + '" stroke="var(--t4-tm)" stroke-width="2.4" fill="none"/>');
      // extrapolated straight line below TLP to the intercept −1/πo
      h.push('<path d="M' + X(0) + ',' + Y(-1 / c.pio) + ' L' + X(1 - m.Rt) + ',' + Y(-1 / m.tlp) + '" stroke="var(--t4-tm)" stroke-width="1.2" stroke-dasharray="4 4" fill="none"/>');
      h.push('<path d="M' + X(1 - m.Rt) + ',30 V240" stroke="var(--warm)" stroke-width="1.6" stroke-dasharray="5 3"/><text x="' + (X(1 - m.Rt) + 6) + '" y="44" style="fill:var(--warm);font-weight:600">turgor loss point</text>');
      var rf = 1 - cs.R; if (rf <= 0.4 && cs.q.w < 0) h.push('<circle cx="' + X(rf) + '" cy="' + Y(clamp(-1 / cs.q.w, 0, 2.6)) + '" r="6.5" fill="var(--ink)" stroke="var(--paper)" stroke-width="2"/>');
      h.push('<text x="' + (X(0) + 6) + '" y="' + (Y(-1 / c.pio) - 8) + '" font-size="11">intercept −1 ÷ πo</text></svg>');
    } else {
      // Höfler diagram: components against RWC
      var Xr = function (R) { return 56 + (1 - R) / 0.4 * 500; }, Yp = function (v) { return 30 + (2.5 - v) / 6 * 210; };
      h.push('<svg viewBox="0 0 600 290" class="t4-chart" role="img" aria-label="' + esc('Water potential components against relative water content. Turgor loss point at ' + WP.fmt.psi(m.tlp) + ' and relative water content ' + num(100 * m.Rt, 0) + ' %. Current leaf at ' + WP.fmt.psi(cs.q.w) + '.') + '">');
      [1, 0.9, 0.8, 0.7, 0.6].forEach(function (R) { h.push('<path class="gl" d="M' + Xr(R) + ',30 V240"/><text x="' + Xr(R) + '" y="258" text-anchor="middle">' + Math.round(R * 100) + ' %</text>'); });
      [2, 1, 0, -1, -2, -3].forEach(function (v) { h.push('<path class="gl" d="M56,' + Yp(v) + ' H556"' + (v === 0 ? ' style="stroke:var(--ink2)"' : '') + '/><text x="50" y="' + (Yp(v) + 4) + '" text-anchor="end">' + (v < 0 ? MINUS + (-v) : v) + '</text>'); });
      h.push('<path class="ax" d="M56,30 V240 H556"/><text x="306" y="282" text-anchor="middle" style="fill:var(--ink)">relative water content (drying to the right)</text><text x="14" y="135" text-anchor="middle" transform="rotate(-90 14 135)">MPa</text>');
      var pw = [], pp = [], ps = [];
      for (var R = 1; R >= 0.6 - 1e-9; R -= 0.005) { var q = m.parts(R); pw.push(P(Xr(R), Yp(clamp(q.w, -3.5, 2.5)))); pp.push(P(Xr(R), Yp(q.p))); ps.push(P(Xr(R), Yp(clamp(q.s, -3.5, 2.5)))); }
      h.push('<path d="' + d(pp) + '" stroke="var(--warm)" stroke-width="2.2" fill="none"/>');
      h.push('<path d="' + d(ps) + '" stroke="var(--t4-sym)" stroke-width="2.2" stroke-dasharray="7 4" fill="none"/>');
      h.push('<path d="' + d(pw) + '" stroke="var(--t4-tm)" stroke-width="3.2" fill="none"/>');
      var qe = m.parts(0.6), lx = Xr(0.6) - 4;
      h.push('<text x="' + lx + '" y="' + (Yp(qe.p) - 7) + '" text-anchor="end" style="fill:var(--warm);font-weight:600">Ψp</text>');
      h.push('<text x="' + lx + '" y="' + (Yp(clamp(qe.w, -3.5, 2.5)) + 18) + '" text-anchor="end" style="fill:var(--t4-tm);font-weight:600">Ψw = Ψs</text>');
      var q1 = m.parts(1);
      h.push('<text x="' + (Xr(1) + 6) + '" y="' + (Yp(q1.s) + 17) + '" style="fill:var(--t4-sym);font-weight:600">Ψs</text>');
      if (m.Rt >= 0.6) {
        h.push('<path d="M' + Xr(m.Rt) + ',30 V240" stroke="var(--warm)" stroke-width="1.6" stroke-dasharray="5 3"/>');
        var tx = Xr(m.Rt), an = tx > 430 ? 'end' : 'start';
        h.push('<text x="' + (tx + (an === 'end' ? -6 : 6)) + '" y="44" text-anchor="' + an + '" style="fill:var(--warm);font-weight:600">turgor loss point ' + esc(WP.fmt.psi(m.tlp)) + '</text>');
      }
      if (cs.R >= 0.6) h.push('<circle cx="' + Xr(cs.R) + '" cy="' + Yp(cs.q.w) + '" r="6.5" fill="var(--ink)" stroke="var(--paper)" stroke-width="2"/><text x="' + (Xr(cs.R) + 9) + '" y="' + (Yp(cs.q.w) + 18) + '" style="fill:var(--ink);font-weight:600">leaf now</text>');
      h.push('</svg>');
    }
    refs.pv.innerHTML = h.join('');
    refs.pvleg.hidden = local.pv === 'classic';
  }

  /* ------------------------------------------------------------ evidence markers */
  function evMarker(key, label) {
    if (ui.evidence && typeof ui.evidence === 'function') {
      try {
        var r = ui.evidence(key, label);
        if (typeof r === 'string' && r) return r;
        if (r && r.nodeType) { var tmp = document.createElement('div'); tmp.appendChild(r); return tmp.innerHTML; }
      } catch (e) { /* fall back */ }
    }
    return '<button type="button" class="t4-evb" aria-expanded="false" data-ev="' + key + '">' + esc(label || 'Evidence') + '</button>';
  }
  function evDrawer(key) {
    var e = WP.evidence[key] || EV[key]; if (!e) return '';
    var dois = Array.isArray(e.doi) ? e.doi.slice() : (e.doi ? [e.doi] : []);
    if (e.doi2) dois.push(e.doi2);
    dois.forEach(function (x) { if (ui.cite) ui.cite(x); });
    return '<p><b>' + esc(e.claim) + '</b></p><dl>' +
      '<dt>Paper</dt><dd>' + esc(e.cite) + '</dd>' +
      '<dt>What was measured</dt><dd>' + esc(e.measured) + '</dd>' +
      '<dt>Figure</dt><dd>' + ui.prose(e.fig) + '</dd>' +
      '<dt>DOI</dt><dd>' + (dois.length ? dois.map(function (x) { return '<a href="https://doi.org/' + encodeURI(x) + '" target="_blank" rel="noopener">doi ' + esc(x) + '</a>'; }).join('; ') : 'none needed') + '</dd>' +
      '<dt>Status</dt><dd>' + badge(e.badge) + '</dd></dl>';
  }
  function wireEvidence(root) {
    root.addEventListener('click', function (ev) {
      var b = ev.target.closest('.t4-evb'); if (!b || !root.contains(b)) return;
      var row = b.parentNode, key = b.getAttribute('data-ev');
      var dr = row.querySelector('.t4-evd[data-for="' + key + '"]');
      if (!dr) { dr = document.createElement('div'); dr.className = 't4-evd'; dr.setAttribute('data-for', key); dr.id = 't4-ev-' + key; dr.innerHTML = evDrawer(key); row.appendChild(dr); b.setAttribute('aria-controls', dr.id); dr.hidden = true; }
      var open = b.getAttribute('aria-expanded') === 'true';
      dr.hidden = open; b.setAttribute('aria-expanded', open ? 'false' : 'true');
    });
  }

  /* ------------------------------------------------------------ what is happening */
  function nowText(st, res, cs) {
    var p = res.psi, s = [];
    if (st.ppfd <= 0) s.push('It is dark, so the stomata are mostly shut. Water still leaves through the cuticle and through stomata that do not close fully, so a trickle still leaves the vein.');
    else s.push('Water leaves the vein at <b>' + WP.fmt.psi(p.leafX) + '</b> and reaches the evaporating cell walls at <b>' + WP.fmt.psi(p.leafOut) + '</b>, moving mostly along the cell walls. It evaporates from wet walls lining the air spaces, which cools the leaf, and the vapour leaves by the stoma.');
    if (local.lig) s.push('The sheath walls are sealed, so here every drop must cross a membrane.');
    if (local.callose) s.push('Callose has closed the plasmodesmata, so the cell to cell route is shut.');
    s.push(cs.q.p > 0 ? 'The leaf cells still push on their walls (turgor ' + WP.fmt.psi(cs.q.p) + ').' : 'The leaf cells have lost turgor, so the leaf wilts.');
    return s.join(' ');
  }

  /* ------------------------------------------------------------ mount */
  function mount(root) {
    ui = WP.ui; el = root;
    var st = document.createElement('style'); st.textContent = CSS; root.appendChild(st);
    var w = document.createElement('div');
    w.innerHTML =
      '<div class="t4-hero" data-r="hero"></div>' +
      '<p class="t4-lead">The water has reached the end of the vein. Four ways remain between it and the air. Which one can the leaf shut, and which one is not liquid at all?</p>' +
      '<p class="t4-now" aria-live="polite"><b>What is happening.</b> <span data-r="now"></span></p>' +

      // ---------------- 4c, four routes
      '<section class="t4-sec" aria-labelledby="t4-h1"><h3 class="t4-h" id="t4-h1">Four routes past the vein</h3>' +
      '<p class="t4-sub">A minor vein in cross section. Particles move at a speed set by transpiration; their number on each route follows a model partition.</p>' +
      '<div class="t4-grid">' +
      '<figure><div class="t4-frame" data-r="xs"></div>' +
      '<ul class="t4-key" aria-label="Key to the letters"><li><b>X</b>xylem</li><li><b>BS</b>bundle sheath</li><li><b>PAL</b>palisade mesophyll, columnar</li><li><b>SP</b>spongy mesophyll, lobed cells; the routes cross three of them</li><li><b>AIR</b>intercellular air space</li><li><b>SSC</b>substomatal cavity</li><li><b>S</b>stoma, two guard cells</li><li><b>UE</b>, <b>LE</b>upper, lower epidermis</li></ul>' +
      '<p class="t4-small">In every cell: the <span style="color:var(--apo2);font-weight:600">wall</span> is the apoplast, shared with the neighbour; a <span style="color:var(--pm);font-weight:600">plasma membrane</span> with aquaporins lines it on the inside; then cytoplasm with chloroplasts, and the vacuole inside a dashed tonoplast.</p>' +
      '<figure class="t4-inset">' + insetSVG() + '<figcaption>One wall, two cells. The wall belongs to neither cell alone: it is the continuous apoplast. Water in the wall has not crossed a membrane; water in the cytoplasm has.</figcaption></figure>' +
      '<figcaption class="cap">Drawn for this exhibit. Only the first step, inside the vein, is xylem. The stomatal pore opens and closes with the model g<sub>s</sub>.</figcaption></figure>' +
      '<figure class="t4-real" data-r="real"></figure>' +
      '<div class="t4-side">' +
      '<div class="card t4-ctl"><h4>Show a route</h4><div class="t4-rchips" data-r="rchips">' +
      ['apo', 'sym', 'tm', 'vap'].map(function (k) { var m = ROUTE_META[k]; return '<button type="button" class="t4-rchip" aria-pressed="true" data-route="' + k + '">' + swatch(k) + '<span>' + m.name + '<small>' + m.sub + '</small></span></button>'; }).join('') +
      '</div>' +
      '<div class="t4-sw" style="margin-top:8px"><p>Lignified sheath walls<small>the leaf\'s endodermis: the wall route is blocked</small></p><button type="button" class="btn small t4-tog" aria-pressed="false" data-act="lig">Off</button></div>' +
      '<div class="t4-sw tier-2"><p>Callose at the plasmodesmata<small>a gate on the cell to cell route</small></p><button type="button" class="btn small t4-tog" aria-pressed="false" data-act="callose">Low</button></div>' +
      '<div class="t4-evrow">' + evMarker('l4-routes', 'Evidence: routes') + evMarker('l4-lignin', 'Evidence: lignified sheath') + '<span class="tier-2" style="display:contents">' + evMarker('l4-callose', 'Evidence: callose') + '</span></div>' +
      '</div>' +
      '<div class="card tier-2"><h4 class="t4-ctl" style="margin:0 0 6px;font-family:var(--ui);font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink2);font-weight:500">Past the sheath, a model partition</h4>' +
      '<div class="t4-bar" data-r="bar" role="img"></div><div class="t4-barlab" data-r="barlab"></div>' +
      '<p class="t4-small">Buckley 2015 model: walls carry most of the conductance and membranes little ' + ui.badge('VERIFIED', 'Buckley 2015 abstract.') + '. Vapour can carry up to 44 % of vertical transport, but only with a 0.2 K temperature gradient across the leaf ' + ui.badge('VERIFIED', 'Buckley 2015 abstract.') + '. The isothermal ranges often quoted (walls 72 to 88 %, membranes 6 to 12 %, vapour 7 to 16 %) are model outputs stated in the Results text of the paper ' + ui.badge('MEASURED', 'Model output, stated in the Results text of Buckley 2015 (PDF read).') + '. Plasmodesmata are not resolved: Buckley\'s "symplastic" route is the transmembrane route here, so the purple route has no share.</p></div>' +
      '</div></div>' +
      '<div class="tier-2" style="margin-top:14px"><div class="t4-tiles" data-r="tiles"></div>' +
      '<div class="t4-evrow">' + evMarker('l4-ohm', 'Evidence: resistances in series') + '</div></div>' +
      '<div class="card tier-3" style="margin-top:12px"><div class="eq" data-r="eqs"></div></div>' +
      '<p class="cap tier-1-only">Most water slips along the cell walls. Switch on the lignified sheath: now the walls are sealed at the vein, and every drop has to pass through a living cell membrane. Could the sheath be where the leaf turns the flow up or down? It is being tested.</p>' +
      '<div class="tier-3 t4-qbox"><p class="q">Models disagree ' + badge('OPEN QUESTION', 'All three are model results.') + '</p><p>Buckley et al. 2015 (Plant Physiology, 14 species): the sheath is a minority of outside xylem resistance, and vapour carries up to two thirds of K<sub>ox</sub>. Buckley 2015 (Plant, Cell and Environment): vapour is small when the leaf is isothermal and up to 44 % with a 0.2 K gradient. Albuquerque et al. 2020: a low permeability band, like a Casparian strip, fits the grapevine data. This plate gives the sheath 0.15 and the mesophyll 0.10 of 1 ÷ K<sub>plant</sub>, chosen so the P<sub>f</sub> effect is visible; Buckley et al. 2015 put the sheath share lower.</p><div class="t4-evrow">' + evMarker('l4-models', 'Evidence: three models') + evMarker('l4-evap', 'Evidence: where water evaporates') + '</div></div>' +
      '<p class="cap tier-2">Goal: locate a candidate control point. If most water moves in the walls, how could aquaporins control K<sub>leaf</sub>? Switch on the lignified sheath: at the sheath every route must cross a membrane, and that step sits in series with everything after it. In the same set of species the light response of K<sub>leaf</sub> did not depend on lignification, so a sealed sheath is not the whole story of control. In grapevine, modelling suggests a band like a Casparian strip in the sheath; has anyone imaged it? Not yet.</p>' +
      // ---------------- W round 1: molecules on the routes, Buckley 2015 controls, sheath expression
      '<div class="t4-mol" role="group" aria-labelledby="t4-molh"><h4 class="t4-molh" id="t4-molh">Watch the molecules take the routes</h4>' +
      '<p class="t4-small">Every molecule leaves the vein through a bundle sheath membrane first, then follows the walls, the cell membranes or the air. The share on each route is the Buckley 2015 model, live. Stomata sit on the lower epidermis.</p>' +
      '<div class="chips" role="group" aria-label="Bundle sheath channels"><button type="button" class="chip" data-tx="def" aria-pressed="true">Default sheath</button><button type="button" class="chip" data-tx="sade" aria-pressed="false">Sheath PIP1 silenced</button><button type="button" class="chip" data-tx="abax" aria-pressed="false">ABA in the xylem</button><button type="button" class="btn small" data-act="tmpause" aria-pressed="false">Pause</button></div>' +
      '<div class="t4-molctl tier-2"><div class="t4-rng2"><label for="t4-bkpm">Membrane permeability, P<sub>m</sub><small>Buckley 2015: nominal 40, range 10 to 70 µm s⁻¹</small></label><output data-r="bkpmo"></output><input type="range" id="t4-bkpm" min="10" max="70" step="1"></div>' +
      '<div class="t4-rng2"><label for="t4-bkdt">Vein side warmer by ΔT<small>a vertical temperature gradient pushes vapour</small></label><output data-r="bkdto"></output><input type="range" id="t4-bkdt" class="t4-xtrap" min="0" max="0.3" step="0.01"><span class="t4-xt" aria-hidden="true"><i>Buckley 2015 range</i><i>beyond 0.2 K: extrapolation</i></span></div></div>' +
      '<div class="t4-molstage" data-r="routestage"></div>' +
      '<p class="t4-now" aria-live="polite" data-r="routetxt" style="margin-top:6px"></p>' +
      '<div class="t4-evrow">' + evMarker('l4-bk', 'Evidence: the Buckley partition') + evMarker('l5-expr', 'Evidence: channel number') + '<span class="tier-2" style="display:contents">' + evMarker('l5-bsq', 'Evidence: is the sheath the valve?') + '</span></div></div>' +
      '<div class="t4-stops" data-r="s4c"></div>' +
      '</section>' +

      // ---------------- 4d, loss before breakage
      '<section class="t4-sec" aria-labelledby="t4-h2"><h3 class="t4-h" id="t4-h2">Loss before breakage</h3>' +
      '<p class="t4-sub">A leaf can lose most of its conductance while every vein is still full of water.</p>' +
      '<div class="t4-grid2">' +
      '<figure><div class="t4-frame" data-r="loss" style="padding:6px"></div>' +
      '<div class="t4-legend"><span><i style="background:var(--t4-tm);height:4px;width:18px"></i>K<sub>leaf</sub> fit, dot = 80 % lost at ' + MINUS + '0.71 MPa ' + badge('MEASURED', 'Albuquerque et al. 2020, Fig. 6 legend fit and Table 2 P80, Cabernet Sauvignon, replotted from the equation') + '</span><span><i style="background:var(--warm);height:4px;width:18px"></i>g<sub>s</sub> fit, square = 80 % lost at ' + MINUS + '1.21 MPa ' + badge('MEASURED', 'Albuquerque et al. 2020, Fig. 6 legend fit and Table 2 P80, Cabernet Sauvignon') + '</span><span><i style="background:var(--ink3);height:10px;width:4px"></i>first midrib embolism, about ' + MINUS + '1.25 MPa; minor veins: little or none ' + badge('MEASURED', 'Albuquerque et al. 2020, microCT') + '</span><span><i style="border-left:2px dotted var(--ink2);height:10px;width:2px;background:none"></i>TLP ' + MINUS + '1.37 MPa ' + badge('MEASURED', 'Albuquerque et al. 2020, Table 2, Cabernet Sauvignon') + '</span><span><i style="border-top:2px dashed var(--t4-tm);height:0;width:18px;background:none"></i>thin dashed: the model ' + ui.badge('ILLUSTRATIVE', 'The engine curve, an approximation of the measured fit.') + '</span></div>' +
      '<figcaption class="cap">Grapevine, Cabernet Sauvignon (Albuquerque et al. 2020). The two thick curves are the paper\'s own exponential fits redrawn from their equations, not a reused figure; the marks are its Table 2 values. The thin curve is the model K<sub>leaf</sub> against the model leaf Ψ, from drying the soil at today\'s weather; the open circle and the dashed line are your leaf now. <span data-r="koxnow"></span></figcaption>' +
      '<div class="tier-3 card t4-run"><p style="margin:0 0 6px"><b>Why not anchor the model at the leaf?</b> Bench dehydration curves are not steady states: a detached leaf dries slowly with no flow through it. In a transpiring leaf the outside xylem loss feeds back on itself: less conductance, more negative leaf Ψ, more loss. Read at the leaf Ψ with the published anchor, the model runs away. Try it.</p>' +
      '<div class="t4-sw" style="border-top:0"><p>Read the curve at the leaf Ψ<small>runaway what if, grapevine only</small></p><button type="button" class="btn small t4-tog" aria-pressed="false" data-act="koxleaf">Off</button></div></div>' +
      '<div class="t4-evrow">' + evMarker('l4-grape', 'Evidence: grapevine') + evMarker('l4-oxv', 'Evidence: eight species') + '</div></figure>' +
      '<div><div class="tier-1-only card"><p style="margin:0">Most of what the leaf loses, it loses in the living cells outside the veins, before any vein fills with air. That is why this tissue matters.</p></div>' +
      '<figure class="tier-2"><div class="t4-frame" data-r="strip" style="padding:6px"></div>' +
      '<figcaption class="cap">Share of K<sub>ox</sub> or K<sub>leaf</sub> already lost at the benchmark, from published compilations. Before the first embolism ' + badge('MEASURED', 'Scoffoni et al. 2023 Table 1.') + '; before wilting ' + badge('SECONDARY', 'The 56 studies, 40 % mean and 0 to 96 % range are quoted from Scoffoni et al. 2023.') + '. Bars span the range; the thick tick is the mean. The spread between species is itself the open question.</figcaption>' +
      '<div class="t4-evrow">' + evMarker('l4-34', 'Evidence: 34 species') + evMarker('l4-310', 'Evidence: 310 species') + '</div></figure>' +
      '<div class="t4-qbox"><p class="q">Where has the conductance gone?</p><p>Outside the xylem, in the living tissue between the veins and the evaporating walls. If stomata sense Ψ beyond the xylem, a falling K<sub>ox</sub> could help close them while the veins are still full. Is that what happens?</p>' +
      '<p class="tier-2" style="margin-top:6px">Three candidate causes are being tested: cells shrink and lose contact (Scoffoni et al. 2014); aquaporins are switched off, including by ABA arriving in the xylem, which lowers bundle sheath P<sub>f</sub> (Shatil-Cohen et al. 2011; Yaaran et al. 2023); and, in grapevine, a modelled low permeability band in the sheath (Albuquerque et al. 2020).</p>' +
      '<div class="t4-evrow tier-2">' + evMarker('l4-shrink', 'Evidence: shrinkage') + evMarker('l4-aba', 'Evidence: ABA at the sheath') + evMarker('l4-optical', 'Evidence: a contrasting view') + '</div></div>' +
      '<div class="tier-3 t4-qbox"><p class="q">Outside the xylem, or embolism? ' + badge('OPEN QUESTION', 'Two methods, two readings.') + '</p><p>MicroCT and hydraulics in eight species: outside xylem vulnerability explained 75 to 100 % of the decline (Scoffoni et al. 2017). Optical imaging in four species: vein embolism tracked the decline (Brodribb et al. 2016). Different species, different methods, different drying rates. Which design would settle it for grapevine?</p></div>' +
      '</div></div>' +
      '<div class="t4-stops" data-r="s4d"></div>' +
      '</section>' +

      // ---------------- 4a, embolism versus collapse
      '<section class="t4-sec" aria-labelledby="t4-h3"><h3 class="t4-h" id="t4-h3">When a conduit does fail</h3>' +
      '<p class="t4-sub">Two different ways, and each needs a different conduit state. A concept drawing, no data.</p>' +
      '<figure><div class="t4-frame" data-r="fail"></div>' +
      '<figcaption class="cap">Embolised conduits are drawn charcoal, water filled ones blue. A collapsed conduit stays blue with a deformed outline.</figcaption></figure>' +
      '<section class="mol-sec" aria-labelledby="t4-ash"><h4 id="t4-ash">Air seeding, molecule by molecule</h4>' +
      '<p class="mol-try">Gas in conduit A, water under tension in conduit B, and between them one pit membrane. Its widest pore holds a curved air water surface, a meniscus. <b>Try this:</b> raise the tension slowly and watch the meniscus bulge, then snap through.</p>' +
      '<div class="mol-ctl"><label for="t4-ast">Tension in conduit B <output data-r="asto"></output></label><input type="range" id="t4-ast" min="0" max="4" step="0.05" value="1">' +
      '<span class="tier-2" style="display:contents"><label for="t4-asd">Widest pore diameter <output data-r="asdo"></output></label><input type="range" id="t4-asd" min="60" max="400" step="5" value="150"></span></div>' +
      '<div data-r="asmol"></div>' +
      '<p class="mol-now" aria-live="polite" data-r="astxt"></p>' +
      '<p class="cap tier-2">Physics ' + ui.badge('DERIVED', 'Young Laplace: a meniscus in a pore of diameter D holds ΔP = 4γ cos θ ÷ D; γ = 0.072 N m⁻¹ for pure water at 25 °C, θ = 0.') + ': the meniscus in a pore of diameter D holds a pressure difference of 4γ ÷ D, so a 150 nm pore holds about 1.9 MPa and a pore twice as wide only half as much. The gas side sits near atmospheric pressure (+0.1 MPa), so seeding starts when tension + 0.1 MPa reaches that limit. The pore is drawn about a hundred thousand times larger than life. Real pit membranes are thick meshes of fibrils coated with surfactants, so whether one widest pore sets the threshold is still debated: a question, not a rule.</p>' +
      '</section>' +
      '<div class="t4-qbox"><p class="q">Can a water filled conduit buckle and recover? ' + badge('OPEN QUESTION', 'No numbers are shown for collapse on this site.') + '</p>' +
      '<p>Reversible collapse has been reported in pine needles and red oak leaf veins; in wheat, vessels deformed gradually and explained under 5 % of the K<sub>leaf</sub> decline (Corso et al. 2020). How often it happens in our crops, and what it does to flow, are questions under study. This page shows no collapse or refilling numbers.</p></div>' +
      '<div class="t4-evrow">' + evMarker('l4-airseed', 'Evidence: air seeding') + evMarker('l4-collapse', 'Evidence: collapse') + '</div>' +
      '<figure class="tier-3 card" style="margin-top:12px"><div data-r="torus" style="max-width:460px;margin:0 auto"></div><figcaption class="cap">Conifer bordered pit (torus margo). The torus is a thickened plug; the margo is a porous mesh. When the neighbour fills with gas the pressure difference pushes the membrane over and the torus seals the aperture: pit aspiration. Concept drawing.</figcaption></figure>' +
      '<div class="t4-stops" data-r="s4a"></div>' +
      '</section>' +

      // ---------------- 4b, turgor
      '<section class="t4-sec" aria-labelledby="t4-h4"><h3 class="t4-h" id="t4-h4">Turgor, and the point where it is lost</h3>' +
      '<p class="t4-sub">The same leaf water potential, seen from inside one mesophyll cell.</p>' +
      '<div class="t4-cellgrid">' +
      '<div><div class="t4-frame" data-r="cell"></div>' +
      '<div class="t4-sw" style="border-top:0"><p>Osmotic adjustment<small>the cell builds up solutes over a dry week</small></p><button type="button" class="btn small t4-tog" aria-pressed="false" data-act="oa">Off</button></div>' +
      '<div class="tier-2"><p class="t4-small" style="margin:4px 0 6px">Cell wall</p><div class="chips" role="radiogroup" aria-label="Cell wall stiffness"><button type="button" class="chip" role="radio" aria-checked="true" data-eps="10">Elastic</button><button type="button" class="chip" role="radio" aria-checked="false" data-eps="25">Stiff</button></div></div>' +
      '</div>' +
      '<div>' +
      '<div class="card"><div class="t4-eqline tier-2" data-r="eqcell"></div><p class="tier-1-only" data-r="plain1" style="margin:0"></p>' +
      '<p class="t4-small tier-2" data-r="eqx"></p></div>' +
      '<div class="tier-2" style="margin-top:10px"><div class="t4-frame" data-r="pv" style="padding:6px"></div>' +
      '<div class="t4-legend" data-r="pvleg"><span><i style="background:var(--t4-tm);height:4px"></i>Ψw, water potential</span><span><i style="background:var(--warm)"></i>Ψp, turgor pressure</span><span><i style="background:var(--t4-sym)"></i>Ψs, osmotic potential (dashed)</span></div>' +
      '<div class="tier-3 chips" style="margin-top:8px" role="radiogroup" aria-label="Chart form"><button type="button" class="chip" role="radio" aria-checked="true" data-pv="hofler">Components</button><button type="button" class="chip" role="radio" aria-checked="false" data-pv="classic">Classic PV curve, −1 ÷ Ψ</button></div>' +
      '<div class="tier-3 t4-rng"><label for="t4-pio">πo, at full turgor</label><input type="range" id="t4-pio" min="-3" max="-0.8" step="0.05" value="-1.5"><output data-r="pio"></output>' +
      '<label for="t4-eps">ε, wall modulus</label><input type="range" id="t4-eps" min="3" max="40" step="1" value="10"><output data-r="eps"></output></div>' +
      '<p class="cap">Cell values (turgor loss point near ' + MINUS + '1.76 MPa with an elastic wall, ε 10, πo ' + MINUS + '1.5) ' + ui.badge('ILLUSTRATIVE', 'Teaching values, not a grapevine measurement.') + '. Osmotic adjustment lowers πo by 0.5 MPa. The leaf Ψ is the end of the outside xylem path from the model.</p>' +
      '<p class="cap">In grapevine the turgor loss point falls through the season, and K<sub>leaf</sub> vulnerability and stomatal closure shift with it (Martorell et al. 2015; Herrera et al. 2022). With osmotic adjustment on, the loss before breakage chart shows ghost K<sub>leaf</sub> and stomatal curves shifted more negative; the size of the shift is ' + ui.badge('ILLUSTRATIVE', 'The 0.3 MPa ghost shift is invented; the direction is published.') + '.</p></div>' +
      '<div class="t4-evrow">' + evMarker('l4-tlp', 'Evidence: turgor loss point') + evMarker('l4-psi', 'Evidence: Ψw = Ψs + Ψp') + evMarker('l4-order', 'Evidence: wilting before embolism?') + evMarker('l4-oa', 'Evidence: seasonal adjustment') + '</div>' +
      '</div></div>' +
      // ---------------- W round 1: osmotic adjustment in a real vine, drawn as molecules
      '<div class="t4-mol" role="group" aria-labelledby="t4-oah"><h4 class="t4-molh" id="t4-oah">Osmotic adjustment, molecule by molecule</h4>' +
      '<p class="t4-small"><b>The cell above is a teaching cell; this one is a real Merlot vine.</b> Merlot vines held at a water deficit for 39 days moved their turgor loss point from ' + MINUS + '1.08 to ' + MINUS + '1.31 MPa. Slide through the deficit: a few more sugars and ions build up in the vacuole (new ones glow), the wall turns softer, and at the same leaf water potential the cell keeps more of its turgor. Water molecules cross the membrane through aquaporins as the vacuole swells or shrinks; the magnifier shows one channel letting water through in single file while the solutes stay behind.</p>' +
      '<div data-r="oapred"></div>' +
      '<div class="t4-molctl"><div class="t4-rng2"><label for="t4-oad">Days of water deficit<small>Hochberg et al. 2017, Merlot on SO4</small></label><output data-r="oado"></output><input type="range" id="t4-oad" min="0" max="39" step="1" value="0"></div>' +
      '<div class="t4-rng2"><label for="t4-oap">Leaf water potential to test<small>the cell starts healthy; then try ' + MINUS + '1.2 MPa, between the two turgor loss points</small></label><output data-r="oapo"></output><input type="range" id="t4-oap" min="-2" max="-0.1" step="0.01" value="-0.6"></div></div>' +
      '<div class="t4-molstage" data-r="cellstage"></div>' +
      '<p class="t4-now" aria-live="polite" data-r="oatxt" style="margin-top:6px"></p>' +
      '<p class="t4-small tier-2">For scale: across 283 wild and crop species, drought lowered the turgor loss point by 0.44 MPa on average (Bartlett et al. 2014); six Southern California shrubs by 0.41 MPa, one by more than 2 MPa (Schönbeck et al. 2025). Does adjustment make the vine safer? Its petioles became more vulnerable to embolism after the same deficit, so the answer is a question for each organ.</p>' +
      '<p class="t4-small tier-3">Expert: π<sub>o</sub> ' + MINUS + '1.02 and ' + MINUS + '1.10 MPa, turgor loss points ' + MINUS + '1.08 and ' + MINUS + '1.31 MPa (VERIFIED). The bulk modulus is back calculated from TLP = π<sub>o</sub> ÷ (1 + π<sub>o</sub> ÷ ε): about 18 MPa well watered and 7 MPa after the deficit (DERIVED), so in this pair the walls also became more elastic. Values between day 0 and day 39 are a straight line ' + ui.badge('ILLUSTRATIVE') + '. Drawing scales ' + ui.badge('DERIVED') + ': one drawn solute is 0.025 MPa of osmotic potential at full turgor (41 at day 0, 44 at day 39: only about 8 % more solute, so most of this TLP shift comes from the softer wall); the vacuole volume change is drawn three times larger than the RWC change; water crossings follow the volume still to change plus a steady two way exchange.</p>' +
      '<div class="t4-evrow">' + evMarker('sp:sp.vitis_me.tlp_oa', 'Evidence: Merlot') + evMarker('sp:glob.tlp.plasticity', 'Evidence: global mean') + evMarker('sp:sp.socal.tlp_adjust', 'Evidence: Southern California shrubs') + evMarker('sp:sp.vitis_me.p50pet', 'Evidence: petioles after deficit') + '</div></div>' +
      '<div class="t4-qbox"><p class="q">Does wilting come before the first embolism? ' + badge('OPEN QUESTION', 'Order varies with species and climate.') + '</p><p>On average, yes: across 262 angiosperm and 48 gymnosperm species, leaves lost turgor before stems lost half their conductivity (Bartlett et al. 2016). The order varies with species and climate, so the turgor loss point does not tell you when a given plant\'s xylem will embolise. In 12 Australian trees, leaf embolism began only after turgor loss (Peters and Choat 2025).</p></div>' +
      '<div class="t4-stops" data-r="s4b"></div>' +
      '</section>' +

      '<div class="tier-3" data-r="t4meth" style="margin-top:14px"></div>' +
      '<div class="t4-dive"><p>Every R<sub>bs</sub> on this plate depends on one number, the membrane permeability P<sub>f</sub>. What sets it?</p><button type="button" class="btn" data-act="dive">Go to the membrane</button></div>' +
      '<div class="card" style="margin-top:14px" data-r="srcs"></div>';
    root.appendChild(w);
    refs = {};
    Array.prototype.forEach.call(w.querySelectorAll('[data-r]'), function (n) { if (!refs[n.getAttribute('data-r')]) refs[n.getAttribute('data-r')] = n; });
    refs.xs.innerHTML = crossSectionSVG();
    heroInit(refs.hero);
    refs.loss.innerHTML = lossChartStatic();
    refs.strip.innerHTML = stripSVG();
    refs.fail.innerHTML = failSVG();
    refs.torus.innerHTML = torusSVG();
    ui.stops(refs.s4c, ['4a']); ui.stops(refs.s4d, ['4b']); ui.stops(refs.s4a, ['4c']); ui.stops(refs.s4b, ['4d']);
    ui.sources(refs.srcs, ['10.1104/pp.15.00731', '10.1104/pp.16.01605', '10.1104/pp.16.01643', '10.1111/nph.13846', '10.1104/pp.113.221424', '10.1111/j.1365-313x.2011.04576.x', '10.1093/plphys/kiad372',
      '10.1111/ppl.12253', '10.1111/tpj.15591', '10.1073/pnas.1604088113', '10.1111/pce.15249', '10.1093/jxb/erx252', '10.1104/pp.88.3.581', '10.1111/nph.19069', '10.1111/pce.12372', '10.1111/pce.13087', '10.1093/jxb/eraa392', '10.1093/jxb/erag008',
      '10.1111/j.1461-0248.2012.01751.x', '10.1111/j.1469-8137.2009.02847.x', '10.1126/science.1120479', '10.1104/pp.103.028357', '10.1104/pp.16.01191', '10.1111/pce.13722',
      '10.1104/pp.18.00743', '10.1093/jxb/err270'], 'Sources for this plate');
    wireEvidence(w);
    w.addEventListener('click', onClick);
    w.querySelector('#t4-pio').addEventListener('input', function (e) { local.pio = +e.target.value; refresh(); });
    w.querySelector('#t4-eps').addEventListener('input', function (e) { local.eps = +e.target.value; syncEpsChips(); refresh(); });
    ui.onPrefs(function () { refresh(); if (!ui.reducedMotion()) startAnim(); molPrefs(); if (HT.ctx && HT.ctx.retheme) HT.ctx.retheme(); });
    mountMol(w);
    mountAirseed(w);
    mountOX(w); // 13 Oct: xylem only vs outside xylem, recovery, hydraulic signal
    mountReal(refs.real);
    window.addEventListener('resize', fitXS);
    var wasPh = window.innerWidth < 600;
    window.addEventListener('resize', function () {
      var ph = window.innerWidth < 600; if (ph === wasPh) return; wasPh = ph;
      refs.loss.innerHTML = lossChartStatic(); refs.strip.innerHTML = stripSVG(); refs.fail.innerHTML = failSVG();
      if (lastSt && lastRes) lossNow(lastSt, lastRes);
    });
    // restart the particles when the plate is shown again without a state change
    anim.timer = setInterval(function () { if (!anim.raf && visible() && !ui.reducedMotion()) startAnim(); }, 800);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) startAnim(); });
  }

  function syncEpsChips() {
    Array.prototype.forEach.call(el.querySelectorAll('[data-eps]'), function (c) { c.setAttribute('aria-checked', +c.dataset.eps === local.eps ? 'true' : 'false'); });
  }
  function setTog(act, on, onL, offL) {
    var b = el.querySelector('[data-act="' + act + '"]'); if (!b) return;
    b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.textContent = on ? onL : offL;
  }
  function onClick(e) {
    var t = e.target.closest('[data-route],[data-act],[data-eps],[data-pv]'); if (!t) return;
    if (t.dataset.route) {
      var k = t.dataset.route; local.routes[k] = !local.routes[k]; t.setAttribute('aria-pressed', local.routes[k] ? 'true' : 'false');
    } else if (t.dataset.act === 'lig') { local.lig = !local.lig; setTog('lig', local.lig, 'On', 'Off'); }
    else if (t.dataset.act === 'callose') { local.callose = !local.callose; setTog('callose', local.callose, 'High', 'Low'); }
    else if (t.dataset.act === 'oa') { local.oa = !local.oa; setTog('oa', local.oa, 'On', 'Off'); }
    else if (t.dataset.act === 'koxleaf') { if (WP.state.crop !== 'grape') return; WP.set({ koxLeaf: !WP.state.koxLeaf }); setTog('koxleaf', WP.state.koxLeaf, 'On', 'Off'); return; }
    else if (t.dataset.act === 'dive') { if (ui.go) ui.go('membrane'); else location.hash = 'membrane'; return; }
    else if (t.dataset.eps) { local.eps = +t.dataset.eps; syncEpsChips(); var r = el.querySelector('#t4-eps'); if (r) r.value = local.eps; }
    else if (t.dataset.pv) { local.pv = t.dataset.pv; Array.prototype.forEach.call(el.querySelectorAll('[data-pv]'), function (c) { c.setAttribute('aria-checked', c.dataset.pv === local.pv ? 'true' : 'false'); }); }
    refresh();
  }
  function refresh() { if (lastSt && lastRes) update(lastSt, lastRes); }

  /* ------------------------------------------------------------ W round 1: molecular theatres (mol.js) */
  WP.evidence['l4-bk'] = {
    claim: 'In a leaf model outside the bundle sheath, the walls (apoplast) carry 72 to 88 % of the conductance, the cell to cell route through membranes 5.9 to 11.6 %, and the air 7.3 to 16.2 % when the leaf is isothermal; with a 0.2 K vertical temperature gradient, vapour reaches up to 44 %. Across plausible parameters the wall share spans 14.0 to 99.8 %.',
    cite: 'Buckley 2015, Plant, Cell and Environment 38: 7', doi: '10.1111/pce.12372',
    measured: 'A model, not a measurement. Nominal membrane water permeability Pm 40 µm s⁻¹ (range 10 to 70), wall thickness 0.3 µm (Table 2).',
    fig: 'On this plate the shares follow the model at nominal values (VERIFIED ranges). Moving Pm scales the membrane route linearly and ΔT boosts vapour so it reaches 44 % at 0.2 K: that scaling is a teaching simplification (ILLUSTRATIVE, DERIVED from the verified endpoints). Buckley calls the membrane route symplastic; plasmodesmata are not resolved.',
    badge: 'MEASURED'
  };
  var MOLT = { R: null, C: null, oaDays: 0, oaPsi: -0.6 };
  var AS = { T: null, ten: 1, D: 150 };
  /* 13 Oct (slow and named): a speed chip beside each Pause button; one tap steps the drawn speed down (speed.js) */
  function spdChip(pb) {
    if (!pb || !window.PlaySpeed || pb.parentNode.querySelector('[data-ps]')) return;
    var ch = window.PlaySpeed.chip('ps-light'); ch.style.marginLeft = '6px'; ch.style.verticalAlign = 'middle';
    pb.parentNode.insertBefore(ch, pb.nextSibling);
  }
  function mountAirseed(w) {
    if (!ui.molStage) return;
    AS.T = ui.molStage(w.querySelector('[data-r="asmol"]'), 'airseed', { height: function (cw) { return cw < 560 ? 370 : 400; }, prewarm: 2,
      label: 'Animated pit membrane between a gas filled conduit and a water filled conduit under tension: the meniscus in the widest pore bulges and, past its limit, air is pulled through',
      extra: '<button type="button" class="btn small" data-as="vine">Use the vine\'s leaf xylem Ψ now</button><button type="button" class="btn small" data-as="reset">Refill B and start again</button>' });
    if (!AS.T) return;
    spdChip(w.querySelector('[data-r="asmol"] .mol-pause'));
    w.querySelector('#t4-ast').addEventListener('input', function (e) { AS.ten = +e.target.value; asSync(); });
    w.querySelector('#t4-asd').addEventListener('input', function (e) { AS.D = +e.target.value; asSync(); });
    w.querySelector('[data-r="asmol"]').addEventListener('click', function (e) {
      var b = e.target.closest('[data-as]'); if (!b) return;
      if (b.dataset.as === 'reset') { AS.T.scene.reset(); AS.ten = Math.min(AS.ten, 0.5); }
      if (b.dataset.as === 'vine' && WP.result) AS.ten = clamp(-WP.result.psi.leafX, 0, 4);
      asSync(); AS.T.redraw();
    });
    asSync();
    setInterval(function () { if (AS.T && AS.T.scene.state !== AS.last) { AS.last = AS.T.scene.state; asSync(); } }, 400);
  }
  /* ------------------------------------------------------------ the real leaf: a Cabernet Sauvignon lamina in light microscopy */
  var REAL = [
    { id: 'ue', x: 0.62, y: 0.07, t: 'upper epidermis', d: 'One layer of clear cells under the cuticle. No stomata on this upper (adaxial) surface in this section.' },
    { id: 'pal', x: 0.86, y: 0.32, t: 'palisade', d: 'Tall, tightly packed columns full of chloroplasts (the dark blue stain). Most of the light is absorbed here.' },
    { id: 'bs', x: 0.44, y: 0.33, t: 'bundle sheath', d: 'The ring of large cells around the minor vein. Every water molecule leaving the xylem must cross their membranes or slip along their walls: the control point of Plates IV and V.' },
    { id: 'x', x: 0.47, y: 0.47, t: 'minor vein (xylem and phloem)', d: 'Small cells at the centre of the ring: the xylem conduits and the phloem of a minor vein.' },
    { id: 'sp', x: 0.13, y: 0.6, t: 'spongy mesophyll', d: 'Loose, lobed cells with big air spaces between them. Vapour moves through these spaces toward the stomata.' },
    { id: 'le', x: 0.5, y: 0.89, t: 'lower epidermis', d: 'The lower (abaxial) surface. In grapevine the stomata sit on this side; none happens to be cut in this slice.' }
  ];
  function mountReal(host) {
    if (!host) return;
    var cred = 'Image: Albuquerque Lab (data of Albuquerque et al. 2020, J Exp Bot 71: 7286, doi 10.1093/jxb/eraa392)';
    host.innerHTML = '<div class="t4-realhd"><h4>The real leaf</h4><p>A grapevine leaf (Cabernet Sauvignon) cut across and stained with toluidine blue, rotated so the upper surface is on top. Slide from the bare photograph to the labelled tissues, or tap a label.</p></div>' +
      '<div class="t4-realwrap"><img src="img/lab/CS_1_lamina_mesophyll_minorveins_20X_rotated.jpg" alt="Light micrograph of a grapevine leaf cross section: upper epidermis, palisade columns, a minor vein with its bundle sheath, spongy mesophyll with air spaces and the lower epidermis" loading="lazy" width="1075" height="377">' +
      '<svg viewBox="0 0 1075 377" preserveAspectRatio="none" aria-hidden="true" class="t4-realov"><g class="t4-bands">' +
      '<path d="M0,98 C200,40 500,0 1075,40 L1075,0 L0,0Z" fill="#e8c35a"/>' +
      '<path d="M0,98 C200,40 500,0 1075,40 L1075,160 C900,170 700,150 650,150 L250,155 C150,160 60,170 0,175Z" fill="#7bbf5a"/>' +
      '<ellipse cx="470" cy="160" rx="210" ry="82" fill="#e0805a"/>' +
      '<path d="M0,175 C60,170 150,160 250,240 L650,240 C700,150 900,170 1075,160 L1075,300 C700,300 300,280 0,300Z" fill="#5aa0d8"/>' +
      '<path d="M0,300 C300,280 700,300 1075,300 L1075,377 L0,377Z" fill="#c9a0e0"/></g>' +
      '<g transform="translate(1035,355)"><rect x="-232" y="-5" width="232" height="6" fill="#111"/><text x="-116" y="-10" text-anchor="middle" font-size="22" fill="#111" style="paint-order:stroke;stroke:#fff;stroke-width:4px">100 µm</text></g></svg>' +
      REAL.map(function (h, i) { return '<button type="button" class="t4-hot" data-n="' + (i + 1) + '" data-hot="' + h.id + '" style="left:' + (h.x * 100) + '%;top:' + (h.y * 100) + '%" aria-label="' + esc(h.t) + '"><span>' + esc(h.t) + '</span></button>'; }).join('') +
      '</div>' +
      '<div class="t4-realctl"><label for="t4-realk">Photograph</label><input type="range" id="t4-realk" min="0" max="1" step="0.01" value="0.35"><label for="t4-realk">Labelled</label></div>' +
      '<p class="t4-small t4-realkey" aria-hidden="true">' + REAL.map(function (h, i) { return (i + 1) + ' ' + esc(h.t); }).join(' · ') + '</p>' +
      '<p class="t4-small" data-r="realtxt" aria-live="polite">Tap a label to read what that tissue does.</p>' +
      '<figcaption class="cap">' + cred + '. Light microscopy, July 2016; the 100 µm bar is redrawn from the bar burned into the original. The coloured bands are approximate, traced by eye for teaching. Compare with the drawing above: the drawing simplifies, the photograph does not.</figcaption>';
    var img = host.querySelector('.t4-realwrap'), k = host.querySelector('#t4-realk');
    function setK() { var v = +k.value; img.style.setProperty('--bands', (0.5 * v).toFixed(2)); img.style.setProperty('--hots', v < 0.15 ? 0 : Math.min(1, (v - 0.15) * 3).toFixed(2)); img.classList.toggle('nohot', v < 0.15); }
    k.addEventListener('input', setK); setK();
    host.addEventListener('click', function (e) {
      var b = e.target.closest('[data-hot]'); if (!b) return;
      var h = REAL.filter(function (q) { return q.id === b.dataset.hot; })[0];
      Array.prototype.forEach.call(host.querySelectorAll('[data-hot]'), function (x) { x.classList.toggle('on', x === b); });
      host.querySelector('[data-r="realtxt"]').innerHTML = '<b>' + esc(h.t) + '.</b> ' + esc(h.d);
    });
  }
  function asSync() {
    if (!AS.T) return;
    AS.T.set({ tension: AS.ten, poreD: AS.D });
    var thr = 4 * 0.072 / (AS.D * 1e-9) / 1e6, i1 = el.querySelector('#t4-ast'), i2 = el.querySelector('#t4-asd');
    if (i1 && document.activeElement !== i1) i1.value = AS.ten; if (i2 && document.activeElement !== i2) i2.value = AS.D;
    refs.asto.textContent = 'Ψ ' + WP.fmt.psi(-AS.ten); refs.asdo.textContent = Math.round(AS.D) + ' nm';
    var st = AS.T.scene.state;
    refs.astxt.innerHTML = st === 'hold' ? 'Pressure difference ' + num(0.1 + AS.ten, 2) + ' MPa; this pore holds up to ' + num(thr, 2) + ' MPa. The meniscus holds' + (0.1 + AS.ten > 0.8 * thr ? ', but it is close to its limit.' : '.') :
      '<b>Air seeded.</b> Once the tension pulled harder than the meniscus could hold (' + num(thr, 2) + ' MPa), air was pulled through the pore and conduit B filled with gas. Lowering the tension does not undo it here; press Refill B to start again.';
  }
  function mountMol(w) {
    var M = window.MOL || WP.mol; if (!M || !M.scenes.routes) return;
    var dark = ui.isDark(), rm = ui.reducedMotion();
    MOLT.R = M.Theatre(w.querySelector('[data-r="routestage"]'), M.scenes.routes(), { height: function (cw) { return cw < 560 ? 400 : 450; }, dark: dark, reduce: rm, prewarm: 24,
      label: 'Animated leaf section: water molecules leave a vein, cross the bundle sheath membranes through aquaporins, then travel along cell walls, across cell membranes or as vapour to a stoma on the lower epidermis' });
    MOLT.C = M.Theatre(w.querySelector('[data-r="cellstage"]'), M.scenes.cell(), { height: function (cw) { return cw < 560 ? 600 : 450; }, dark: dark, reduce: rm,
      label: 'Animated leaf cell: solutes accumulate in the vacuole during osmotic adjustment and water molecules cross the membrane as the vacuole swells or shrinks' });
    spdChip(w.querySelector('[data-act="tmpause"]'));
    w.querySelector('#t4-bkpm').addEventListener('input', function (e) { WP.set({ bkPm: +e.target.value }); });
    w.querySelector('#t4-bkdt').addEventListener('input', function (e) { WP.set({ bkDT: +e.target.value }); });
    w.querySelector('#t4-oad').addEventListener('input', function (e) { MOLT.oaDays = +e.target.value; refresh(); });
    // r5: methods on the plate that makes the claims (PhD panel items 3 and 4)
    WP.howto = WP.howto || {};
    if (!WP.howto.kox) WP.howto.kox = { title: 'how much of the Kleaf decline is outside the xylem', what: 'evaporative flux Kleaf plus microCT on the same veins', steps: [
      'Build a Kleaf vulnerability curve with the evaporative flux method on leaves dried on the bench to a range of Ψ.',
      'Image the veins of matching leaves (or the same leaves) with microCT at each Ψ and count embolised conduits; model the xylem conductance that is left.',
      'The outside xylem share of the decline is the Kleaf lost while the xylem is still full: 1 ÷ Kox = 1 ÷ Kleaf − 1 ÷ Kx at each Ψ.',
      'Scoffoni et al. 2017 did this on eight species and found the outside xylem pathway explained 75 to 100 % of the decline from mild stress to beyond turgor loss (doi 10.1104/pp.16.01643).'],
      watch: 'Each Ψ is usually a different leaf, so leaf to leaf variation sits inside the curve. Rehydrating leaves before measuring can refill or relax tissues and hide the decline. Kx from images is modelled, not measured.',
      dois: ['10.1104/pp.16.01643', '10.1093/jxb/eraa392'] };
    var meth = w.querySelector('[data-r="t4meth"]');
    if (meth && ui.howto) meth.innerHTML = ['pv', 'efm', 'kox', 'vacuum'].map(ui.howto).join('') + (ui.design ? ui.design({
      q: 'Does a grapevine leaf lose most of its hydraulic conductance outside the xylem before any vein embolises?',
      treat: 'Leaves dried on the bench to six target Ψ (−0.2 to −1.6 MPa) against fully hydrated controls. Same cultivar, same canopy position, sampled before dawn.',
      measure: 'Kleaf by the evaporative flux method; microCT of the midrib and minor veins on the same leaves; Ψ by pressure chamber; turgor loss point by PV curve on a separate set.',
      n: 'At least 5 leaves per 0.25 MPa bin (30 to 40 leaves per curve) from at least 4 vines, so vine is the replicate and leaf is the subsample. The number is a common choice, not taken from a paper.',
      expect: 'The measured Cabernet Sauvignon fit loses 80 % of Kleaf by −0.71 MPa, while midrib embolism starts only near −1.25 MPa (Albuquerque et al. 2020, MEASURED). If the outside xylem pathway carries the decline, most of the loss should sit between 0 and −0.7 MPa with clear xylem in the scans.',
      badge: 'MEASURED', badgeNote: 'Published fit, Albuquerque et al. 2020, doi 10.1093/jxb/eraa392.',
      confound: 'Leaf to leaf variation and rehydration: measure each leaf at the Ψ it was dried to, without rehydrating, and record leaf area and vein density so a bigger leaf is not read as a leakier one.'
    }) : '');
    var oaP = w.querySelector('[data-r="oapred"]');
    if (oaP && ui.predict) oaP.appendChild(ui.predict({
      q: 'Hold the leaf at ' + MINUS + '1.2 MPa. Day 0 cells have lost their turgor there. After 39 days of deficit, with a few more solutes and a softer wall, what happens at the same ' + MINUS + '1.2 MPa?',
      choices: ['The cell keeps a little turgor', 'Still no turgor', 'It bursts'], correct: 0,
      answer: 'It keeps a little turgor, about 0.09 MPa in this replot. The turgor loss point moved from ' + MINUS + '1.08 to ' + MINUS + '1.31 MPa (Hochberg et al. 2017, VERIFIED), so ' + MINUS + '1.2 MPa now sits on the turgid side. Set the test slider to ' + MINUS + '1.2 and drag the days from 0 to 39 to watch it happen.',
      gate: [w.querySelector('#t4-oad')], lockText: 'The days slider unlocks once you predict.' }));
    w.querySelector('#t4-oap').addEventListener('input', function (e) { MOLT.oaPsi = +e.target.value; refresh(); });
    w.addEventListener('click', function (e) {
      var b = e.target.closest('[data-tx]');
      if (b) { WP.set({ def: { expr: 1, aba: 'none' }, sade: { expr: 0.35, aba: 'none' }, abax: { expr: 1, aba: 'xylem' } }[b.dataset.tx]); return; }
      b = e.target.closest('[data-act="tmpause"]');
      if (b && MOLT.R) { var pz = MOLT.R.pause(); MOLT.C.pause(pz); b.setAttribute('aria-pressed', pz ? 'true' : 'false'); b.textContent = pz ? 'Play' : 'Pause'; }
    });
  }
  function molPrefs() { [MOLT.R, MOLT.C].forEach(function (T) { if (T) { T.setTheme(ui.isDark()); T.setReduce(ui.reducedMotion()); } }); }
  function updMol(st, res) {
    if (!MOLT.R) return;
    molPrefs();
    var p = res.partition, ex = st.expr == null ? 1 : st.expr;
    MOLT.R.set({ E: res.E, share: { apo: p.apo, tm: p.tm, vap: p.vap }, expr: ex, pm: st.bkPm, dT: st.bkDT, aba: st.aba === 'xylem', open: clamp(res.gs / Math.max(1e-6, res.gsMax), 0, 1) });
    var a = el.querySelector('#t4-bkpm'), b = el.querySelector('#t4-bkdt');
    if (a && document.activeElement !== a) a.value = st.bkPm;
    if (b && document.activeElement !== b) b.value = st.bkDT;
    refs.bkpmo.textContent = num(st.bkPm, 0) + ' µm s⁻¹'; refs.bkdto.textContent = num(st.bkDT, 2) + ' K';
    var pre = st.aba === 'xylem' ? 'abax' : (Math.abs(ex - 0.35) < 0.01 ? 'sade' : (Math.abs(ex - 1) < 0.01 && st.aba === 'none' ? 'def' : ''));
    Array.prototype.forEach.call(el.querySelectorAll('[data-tx]'), function (x) { x.setAttribute('aria-pressed', x.dataset.tx === pre ? 'true' : 'false'); });
    refs.routetxt.innerHTML = 'Past the sheath: walls <b>' + num(100 * p.apo, 0) + ' %</b>, membranes <b>' + num(100 * p.tm, 0) + ' %</b>, vapour <b>' + num(100 * p.vap, 0) + ' %</b> of the flow. ' +
      'E = ' + num(res.E, 2) + ' mmol m⁻² s⁻¹ (3 molecules per second per mmol m⁻² s⁻¹). ' +
      (ex < 0.9 ? 'The sheath carries fewer channels, so every molecule waits longer at the first membrane and K<sub>leaf</sub> falls to ' + num(res.K.leaf, 1) + ' mmol m⁻² s⁻¹ MPa⁻¹. ' : '') +
      (st.aba === 'xylem' ? 'ABA arriving in the xylem closes sheath channels: the queue at the first membrane grows. ' : '') +
      (st.bkDT > 0.05 ? 'With the vein side warmer, more water evaporates near the vein and travels as vapour. ' : '') +
      (st.bkDT > 0.2 ? '<b>Beyond 0.2 K the model extrapolates</b>: Buckley 2015 reported up to 44 % vapour at 0.2 K and went no further. ' : '');
    // osmotic adjustment cell (Merlot, Hochberg et al. 2017)
    var f = MOLT.oaDays / 39, pio = -1.02 + (-1.10 + 1.02) * f, tlp = -1.08 + (-1.31 + 1.08) * f;
    var eps = pio / (pio / tlp - 1), m = pv(pio, eps), R = m.Rof(MOLT.oaPsi), q = m.parts(R);
    MOLT.C.set({ solutes: f, psi: MOLT.oaPsi, tlp: tlp, pio: pio, rwc: R, turgor: q.p, eps: eps });
    var c1 = el.querySelector('#t4-oad'), c2 = el.querySelector('#t4-oap');
    if (c1 && document.activeElement !== c1) c1.value = MOLT.oaDays;
    if (c2 && document.activeElement !== c2) c2.value = MOLT.oaPsi;
    refs.oado.textContent = MOLT.oaDays + ' days'; refs.oapo.textContent = WP.fmt.psi(MOLT.oaPsi);
    refs.oatxt.innerHTML = 'After ' + MOLT.oaDays + ' days: turgor loss point <b>' + WP.fmt.psi(tlp) + '</b>. At ' + WP.fmt.psi(MOLT.oaPsi) + ' the cell ' +
      (q.p > 0.005 ? 'still pushes on its wall with <b>' + WP.fmt.psi(q.p) + '</b> of turgor.' : '<b>has lost its turgor</b>' + (MOLT.oaDays < 39 ? '; slide toward 39 days and watch it come back.' : '.'));
  }

  /* ------------------------------------------------------------ update */
  function fitXS() {
    var svg = refs.xs && refs.xs.querySelector('svg'); if (!svg) return;
    var narrow = refs.xs.clientWidth > 0 && refs.xs.clientWidth < 620;
    svg.setAttribute('viewBox', narrow ? '40 0 680 530' : '0 0 760 530');
  }
  function update(st, res) {
    if (!el) return;
    fitXS();
    lastSt = st; lastRes = res;
    // vein colour follows leaf xylem Ψ
    var wc = ui.water(res.psi.leafX);
    Array.prototype.forEach.call(refs.xs.querySelectorAll('.t4-xv'), function (n) { n.setAttribute('fill', wc); });
    drawGuard(res);
    drawRoutes(res);
    // partition bar
    var p = res.partition;
    refs.bar.innerHTML = '<span style="width:' + (100 * p.apo).toFixed(1) + '%;background:var(--t4-apo)"></span><span style="width:' + (100 * p.tm).toFixed(1) + '%;background:var(--t4-tm)"></span><span style="width:' + (100 * p.vap).toFixed(1) + '%;background:var(--t4-vap)"></span>';
    refs.bar.setAttribute('aria-label', 'Model partition past the sheath: walls ' + num(100 * p.apo, 0) + ' %, membranes ' + num(100 * p.tm, 0) + ' %, vapour ' + num(100 * p.vap, 0) + ' %');
    refs.barlab.innerHTML = '<span><i style="background:var(--t4-apo)"></i>walls ' + num(100 * p.apo, 0) + ' %</span><span><i style="background:var(--t4-tm)"></i>membranes ' + num(100 * p.tm, 0) + ' %</span><span><i style="background:var(--t4-vap)"></i>vapour ' + num(100 * p.vap, 0) + ' %</span><span>' + ui.badge('ILLUSTRATIVE', 'Midpoints used by the model, inside the Buckley ranges.') + '</span>';
    drawTiles(st, res);
    lossNow(st, res);
    setTog('koxleaf', !!st.koxLeaf, 'On', 'Off');
    // turgor
    var cs = cellSVG(st, res);
    pvChart(st, res, cs);
    var q = cs.q;
    refs.eqcell.innerHTML = '<div>cell: Ψw = Ψs + Ψp</div><div><span class="w">' + WP.fmt.psi(q.w) + '</span> = ' + '(' + WP.fmt.psi(q.s) + ') + ' + (q.p < 0 ? '(' + WP.fmt.psi(q.p) + ')' : WP.fmt.psi(q.p)) + '</div>' +
      '<div style="margin-top:6px">xylem next door: Ψw = Ψs + Ψp</div><div><span class="w">' + WP.fmt.psi(res.psi.leafX) + '</span> = 0.00 MPa + (' + WP.fmt.psi(res.psi.leafX) + ') <span style="font-family:var(--ui);font-size:12px;color:var(--ink2)">(tension)</span></div>';
    refs.eqx.innerHTML = 'Same equation in both places; only the sign of Ψp changes. Sap Ψs is taken as 0 (dilute sap, an assumption). Turgor loss point ' + WP.fmt.psi(cs.m.tlp) + ' at ' + num(100 * cs.m.Rt, 0) + ' % relative water content' + (local.oa ? ', moved more negative by osmotic adjustment' : '') + '. A stiff wall loses turgor faster for the same water loss and reaches the turgor loss point at a higher water content.';
    refs.plain1.innerHTML = q.p > 0 ? 'The cell pushes on its wall with a pressure of ' + WP.fmt.psi(q.p) + '. It would lose that push at a leaf water potential of ' + WP.fmt.psi(cs.m.tlp) + '.' : 'The cell has lost its push on the wall, so the leaf wilts. Try osmotic adjustment, or wet the soil.';
    refs.pio.textContent = WP.fmt.psi(cs.c.pio);
    refs.eps.textContent = num(local.eps, 0) + ' MPa';
    refs.now.innerHTML = nowText(st, res, cs);
    updMol(st, res);
    placeParticles();
    startAnim();
    heroUpd(res);
  }

  /* ------------------------------------------------------------ 13 Oct (journey builder): xylem only against outside xylem, and the hydraulic signal
     P50 values from Scoffoni et al. 2017 Table 1 (sheets/scoffoni_talk.json row p6.xylem.tlp). Nothing is fitted here. */
  var OX = [
    ['Salvia canariensis', 'Canary sage', -0.26, -0.09, -0.89],
    ['Magnolia grandiflora', 'magnolia', -0.42, -0.33, -3.3],
    ['Hedera canariensis', 'Canary ivy', -0.64, -0.58, -1.9],
    ['Malosma laurina', 'laurel sumac', -0.64, -0.35, -2.6],
    ['Lantana camara', 'lantana', -0.80, -0.79, -0.87],
    ['Quercus agrifolia', 'coast live oak', -2.4, -2.2, -5.4],
    ['Comarostaphylis diversifolia', 'summer holly', -2.8, -2.7, -5.6],
    ['Cercocarpus betuloides', 'mountain mahogany', -2.8, -2.8, -3.0]
  ];
  var OXS = { psi: -1.0, kx: 20, kox: 5 };
  function mountOX(w) {
    var LH = WP.lh; if (!LH) return;
    LH.css();
    var M = LH.M;
    var sec = document.createElement('section'); sec.className = 'lh-sec t4-sec'; sec.setAttribute('aria-labelledby', 't4-ox-h');
    sec.innerHTML = '<h3 id="t4-ox-h">Xylem only, or outside the xylem?</h3>' +
      '<p class="lh-q">When a leaf dries, which part of the path loses its flow first: the veins, or the living tissue between the veins and the air?</p>' +
      '<div class="lh-two">' +
        '<div><div data-r="oxch"></div>' +
          '<div class="lh-sl"><label for="t4-ox-psi">Dry the leaves</label><input type="range" id="t4-ox-psi" min="-6" max="0" step="0.05" value="-1"><output id="t4-ox-psio"></output></div>' +
          '<div class="lh-key"><span><svg viewBox="0 0 28 10"><circle cx="14" cy="5" r="4.5" fill="#D55E00"/></svg>outside the xylem, K<sub>ox</sub></span><span><svg viewBox="0 0 28 10"><circle cx="14" cy="5" r="4.5" fill="var(--ink)"/></svg>whole leaf, K<sub>leaf</sub></span><span><svg viewBox="0 0 28 10"><circle cx="14" cy="5" r="4.5" fill="#0072B2"/></svg>xylem only, K<sub>x</sub></span></div></div>' +
        '<div><p class="lh-read" data-r="oxread" aria-live="polite" style="margin-top:0"></p>' +
          '<p class="lh-cap">Each row is one species, each dot the leaf water potential at which that part of the path has lost half its conductance (its P50). Filled dots have been passed at the slider’s Ψ. In every species the orange dot sits to the left of the blue one, at a less negative Ψ (in lantana and mountain mahogany the two nearly touch): the tissue outside the veins loses half its conductance before the veins do ' + LH.ev('lh.p50table') + ' ' + LH.badge('MEASURED') + '.</p>' +
          '<p class="lh-cap tier-2">Across these eight species, the outside xylem pathway explained 75 to 100 % of the K<sub>leaf</sub> decline from mild stress to beyond turgor loss, and 86 to 100 % (mean 96 %) at turgor loss itself, when only 5 to 8.5 % of midrib conduits held air and no minor veins did ' + LH.ev('lh.ox8') + ' ' + LH.ev('lh.xtlp', 'Evidence: microCT') + '. A leaf model pointed to the cell membranes as the place where conductance falls ' + LH.ev('lh.membrane', 'Evidence: model') + '.</p></div>' +
      '</div>' +
      '<div class="lh-two even" style="margin-top:12px">' +
        '<div class="card"><h4 style="margin:0 0 6px">Two resistances in series</h4>' +
          '<p style="margin:0 0 6px">Water must cross the xylem <i>and then</i> the tissue outside it, so the resistances add: 1 ÷ K<sub>leaf</sub> = 1 ÷ K<sub>x</sub> + 1 ÷ K<sub>ox</sub>. The smaller conductance controls the leaf.</p>' +
          '<svg class="lh-svg" data-r="ser" viewBox="0 0 420 120" role="img" aria-label="Two pipes in series, xylem then outside xylem, with widths set by their conductances"></svg>' +
          '<div class="lh-sl"><label for="t4-kx">K<sub>x</sub></label><input type="range" id="t4-kx" min="1" max="40" step="0.5" value="20"><output id="t4-kxo"></output></div>' +
          '<div class="lh-sl"><label for="t4-kox">K<sub>ox</sub></label><input type="range" id="t4-kox" min="0.5" max="40" step="0.5" value="5"><output id="t4-koxo"></output></div>' +
          '<div class="chips"><button type="button" class="chip" data-ser="ox">Halve K<sub>ox</sub></button><button type="button" class="chip" data-ser="x">Halve K<sub>x</sub></button><button type="button" class="btn small" data-ser="reset">Reset</button></div>' +
          '<p class="lh-read" data-r="serread" aria-live="polite"></p>' +
          '<p class="lh-cap">Slider values are ' + LH.badge('ILLUSTRATIVE', 'Units mmol m⁻² s⁻¹ MPa⁻¹; chosen to show the arithmetic, not a species.') + '; the equation is ' + LH.badge('DERIVED', 'Conductances in series add as reciprocals.') + '.</p></div>' +
        '<div class="card"><h4 style="margin:0 0 6px">Does a falling K<sub>leaf</sub> come back?</h4>' +
          '<p style="margin:0">Leaves of ten species were dried past turgor loss, then given water for an hour. K<sub>leaf</sub> rose 2.2 to 2.8 fold in 4 of the 10 species, and came all the way back in only 2; the other 6 showed no significant recovery ' + LH.ev('lh.recovery') + '.</p>' +
          '<p style="margin:8px 0 0">So is the outside xylem decline a reversible valve, a sign of damage, or both, depending on the species and on how long the stress lasts? ' + LH.badge('OPEN QUESTION') + '</p>' +
          '<p class="lh-cap">And does leaf age change any of this? Very few studies have asked, so this page has no number for it.</p></div>' +
      '</div>' +
      '<div class="lh-oq"><span class="tag">Open question</span><h4>Is a falling K<sub>leaf</sub> a signal that closes the stomata?</h4>' +
        '<svg class="lh-svg" data-r="chain" viewBox="0 0 720 96" role="img" aria-label="The hypothesis as a chain: Kleaf falls, leaf water potential becomes more negative faster, ABA rises, stomata close earlier"></svg>' +
        '<p style="margin:6px 0 0">The idea: as K<sub>leaf</sub> falls, the same transpiration pulls leaf Ψ down faster, turgor drops, ABA is made, and the stomata close sooner, saving water before the xylem is at risk. Two studies give very different shares for that hydraulic route.</p>' +
        '<div class="lh-two even" style="margin-top:10px">' +
          '<div class="lh-side"><h5>Arabidopsis, Scoffoni et al. 2018</h5><p>For leaves dried to less than half stomatal closure, 40 to 65 % of the fall in g<sub>s</sub> was attributable to the fall in K<sub>leaf</sub> (a partition of fitted curves with soil Ψ and VPD held fixed). Modelling suggested a falling K<sub>leaf</sub> improves water use efficiency and survival in drought. ' + LH.ev('lh.arab') + ' ' + LH.ev('lh.arabmodel', 'Evidence: model') + '</p></div>' +
          '<div class="lh-side"><h5>Wheat, Corso et al. 2020</h5><p>The decline in K<sub>leaf</sub> explained at most 9.1 % of stomatal closure. ' + LH.ev('lh.corso') + '</p></div>' +
        '</div>' +
        '<p style="margin:10px 0 0"><b>Why not average them?</b> Different species, different methods, different ways of splitting the cause. What experiment would tell the two apart in the same plant? One idea: compare a plant whose K<sub>leaf</sub> falls with one whose K<sub>leaf</sub> is held up, at the same soil and air, and watch when the stomata close. The aquaporin knockout on Water V is one such test.</p>' +
      '</div>';
    var h2 = w.querySelector('#t4-h2'), after = h2 ? h2.closest('section') : null;
    if (after && after.parentNode) after.parentNode.insertBefore(sec, after.nextSibling); else w.appendChild(sec);
    var ps = sec.querySelector('#t4-ox-psi'); ps.addEventListener('input', function () { OXS.psi = +ps.value; oxDraw(sec); });
    var kx = sec.querySelector('#t4-kx'), ko = sec.querySelector('#t4-kox');
    function syncSer() { kx.value = OXS.kx; ko.value = OXS.kox; serDraw(sec); }
    kx.addEventListener('input', function () { OXS.kx = +kx.value; serDraw(sec); });
    ko.addEventListener('input', function () { OXS.kox = +ko.value; serDraw(sec); });
    sec.addEventListener('click', function (e) {
      var b = e.target.closest('[data-ser]'); if (!b) return;
      var k = b.getAttribute('data-ser');
      if (k === 'ox') OXS.kox = Math.max(0.5, OXS.kox / 2); else if (k === 'x') OXS.kx = Math.max(1, OXS.kx / 2); else { OXS.kx = 20; OXS.kox = 5; }
      OXS.last = k; syncSer();
    });
    chainDraw(sec);
    oxDraw(sec); syncSer();
    var tmr = 0; window.addEventListener('resize', function () { clearTimeout(tmr); tmr = setTimeout(function () { oxDraw(sec); chainDraw(sec); }, 160); });
  }
  function chainSVG(nar) {
    // QV13: two lines per pill so the words fit; 2 x 2 grid under 600 px so the text stays readable on a phone
    var box = [['K', 'leaf', 'falls'], ['leaf Ψ more', '', 'negative, faster'], ['turgor drops,', '', 'ABA rises'], ['stomata close', '', 'earlier']], s = '';
    var bw = nar ? 150 : 140, bh = 58, gap = nar ? 40 : 40, W = nar ? 360 : 720, H = nar ? 190 : 104;
    s += '<defs><marker id="t4-chA" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L8,4 L0,8z" fill="var(--b-pp)"/></marker></defs>';
    function pos(i) { return nar ? [10 + (i % 2) * (bw + gap), 8 + Math.floor(i / 2) * (bh + 38)] : [10 + i * (bw + gap), 14]; }
    box.forEach(function (b, i) {
      var p = pos(i), x = p[0], y = p[1];
      s += '<rect x="' + x + '" y="' + y + '" width="' + bw + '" height="' + bh + '" rx="26" fill="var(--paper)" stroke="var(--b-pp)" stroke-width="1.6"/>';
      if (b[1]) s += '<text x="' + (x + bw / 2) + '" y="' + (y + 34) + '" text-anchor="middle">' + b[0] + '<tspan baseline-shift="sub" font-size="11">' + b[1] + '</tspan> ' + b[2] + '</text>';
      else s += '<text x="' + (x + bw / 2) + '" y="' + (y + 25) + '" text-anchor="middle">' + b[0] + '</text><text x="' + (x + bw / 2) + '" y="' + (y + 45) + '" text-anchor="middle">' + b[2] + '</text>';
      if (i < 3) {
        var q = pos(i + 1);
        if (!nar || i !== 1) s += '<path d="M' + (x + bw + 4) + ',' + (y + bh / 2) + ' L' + (q[0] - 4) + ',' + (q[1] + bh / 2) + '" stroke="var(--b-pp)" stroke-width="2.2" marker-end="url(#t4-chA)"/>';
        else s += '<path d="M' + (x + bw / 2) + ',' + (y + bh + 3) + ' L' + (x + bw / 2) + ',' + (y + bh + 16) + ' L' + (q[0] + bw / 2) + ',' + (y + bh + 16) + ' L' + (q[0] + bw / 2) + ',' + (q[1] - 4) + '" fill="none" stroke="var(--b-pp)" stroke-width="2.2" marker-end="url(#t4-chA)"/>';
      }
    });
    return [W, H, s + '<text class="sm" x="' + (W / 2) + '" y="' + (H - 4) + '" text-anchor="middle">' + (nar ? 'each arrow is a step under study' : 'each arrow is a step under study, not a settled result') + '</text>'];
  }
  function chainDraw(sec) {
    var el = sec.querySelector('[data-r="chain"]'); if (!el) return;
    var c = chainSVG(WP.lh.narrow(el.parentNode)); el.setAttribute('viewBox', '0 0 ' + c[0] + ' ' + c[1]); el.innerHTML = c[2];
  }
  function oxDraw(sec) {
    var LH = WP.lh, M = LH.M, host = sec.querySelector('[data-r="oxch"]'), nar = LH.narrow(host);
    var W = nar ? 440 : 600, L = nar ? 150 : 210, R = 14, T = 14, rowH = 30, H = T + OX.length * rowH + 44, xmin = -6;
    function X(p) { return L + (W - L - R) * p / xmin; }
    var s = '<svg class="lh-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="P50 of outside xylem, whole leaf and xylem conductance for eight species">';
    for (var p = 0; p >= xmin; p--) s += '<line class="gr" x1="' + X(p) + '" x2="' + X(p) + '" y1="' + T + '" y2="' + (H - 40) + '"/><text class="sm" x="' + X(p) + '" y="' + (H - 24) + '" text-anchor="middle">' + (p ? M + (-p) : '0') + '</text>';
    s += '<text class="sm" x="' + ((L + W - R) / 2) + '" y="' + (H - 6) + '" text-anchor="middle">P50, MPa (drier →)</text>';
    var nOx = 0, nX = 0, nL = 0;
    OX.forEach(function (r, i) {
      var y = T + i * rowH + rowH / 2;
      s += '<text x="' + (L - 8) + '" y="' + (y + 5) + '" text-anchor="end"' + (nar ? '' : ' font-style="italic"') + '>' + (nar ? r[1] : r[0]) + '</text>';
      s += '<line x1="' + X(r[3]) + '" x2="' + X(r[4]) + '" y1="' + y + '" y2="' + y + '" stroke="var(--rule)" stroke-width="2"/>';
      [[r[3], '#D55E00'], [r[2], 'var(--ink)'], [r[4], '#0072B2']].forEach(function (d, j) {
        var past = OXS.psi <= d[0]; if (past) { if (j === 0) nOx++; else if (j === 1) nL++; else nX++; }
        s += '<circle cx="' + X(d[0]).toFixed(1) + '" cy="' + (y + (j - 1) * 0).toFixed(1) + '" r="' + (j === 1 ? 4.5 : 6.5) + '" fill="' + (past ? d[1] : 'var(--paper)') + '" stroke="' + d[1] + '" stroke-width="2.2"/>';
      });
    });
    s += '<line x1="' + X(OXS.psi) + '" x2="' + X(OXS.psi) + '" y1="' + T + '" y2="' + (H - 40) + '" stroke="var(--ink)" stroke-width="1.4"/>';
    host.innerHTML = s + '</svg>';
    sec.querySelector('#t4-ox-psio').textContent = LH.psi(OXS.psi);
    sec.querySelector('[data-r="oxread"]').innerHTML = 'At <b>' + LH.psi(OXS.psi) + '</b>, of the 8 species: <b>' + nOx + '</b> have lost half their outside xylem conductance, <b>' + nL + '</b> half their whole leaf conductance, and <b>' + nX + '</b> half their xylem conductance.';
  }
  function serDraw(sec) {
    var LH = WP.lh, kx = OXS.kx, ko = OXS.kox, kl = 1 / (1 / kx + 1 / ko), base = 1 / (1 / 20 + 1 / 5);
    sec.querySelector('#t4-kxo').textContent = LH.num(kx, 1);
    sec.querySelector('#t4-koxo').textContent = LH.num(ko, 1);
    var wx = 4 + 30 * kx / 40, wo = 4 + 30 * ko / 40;
    var s = '<path d="M10,60 L200,60" stroke="#0072B2" stroke-width="' + wx.toFixed(1) + '" stroke-linecap="round" opacity=".85"/>' +
      '<path d="M210,60 L410,60" stroke="#D55E00" stroke-width="' + wo.toFixed(1) + '" stroke-linecap="round" opacity=".85"/>' +
      '<text x="105" y="' + (60 - wx / 2 - 8).toFixed(0) + '" text-anchor="middle">xylem, K<tspan baseline-shift="sub" font-size="11">x</tspan></text>' +
      '<text x="310" y="' + (60 - Math.max(wo, 10) / 2 - 8).toFixed(0) + '" text-anchor="middle">outside the xylem, K<tspan baseline-shift="sub" font-size="11">ox</tspan></text>' +
      '<text class="sm" x="210" y="112" text-anchor="middle">the narrower pipe sets the flow</text>';
    sec.querySelector('[data-r="ser"]').innerHTML = s;
    var msg = 'K<sub>leaf</sub> = 1 ÷ (1 ÷ ' + LH.num(kx, 1) + ' + 1 ÷ ' + LH.num(ko, 1) + ') = <b>' + LH.num(kl, 2) + '</b> mmol m⁻² s⁻¹ MPa⁻¹, ' + LH.num(100 * kl / base, 0) + ' % of the starting leaf (4.0).';
    if (OXS.last === 'ox') msg += ' Halving the smaller conductance cuts the leaf hard.';
    if (OXS.last === 'x') msg += ' Halving the larger conductance barely moves the leaf.';
    sec.querySelector('[data-r="serread"]').innerHTML = msg;
  }

  /* ============================================================ TM14 (14 Oct): Water IV macro hero, a 3D leaf block
     Three.js r128 through WP.macro (macro.js). Upper epidermis with cuticle, columnar palisade, lobed spongy
     mesophyll with air spaces, a minor vein (xylem, phloem, bundle sheath), lower epidermis with ONE stoma.
     Water molecules flow along the vein, cross a bundle sheath membrane (aquaporin flash), then take the
     Buckley 2015 routes in the live model shares (walls, membranes, vapour), evaporate in the substomatal
     cavity and leave as vapour through the stoma on the LOWER side. Speed is proportional to the model E;
     the pore opens with gs. Scene geometry is drawn for teaching (1 unit about 10 µm), not traced. */
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
  var HT = { ctx: null, res: null, mols: [], N: 40 };
  var HV = { cx: -2.2, cy: -0.4, R: 0.78 };      // vein centre and sheath ring radius
  var HS = { x: 2.6, y: -2.02, z: 1.95 };         // the stoma
  var Z1T = 2.5;                                   // the cut face (Z1 in heroBuild), for the Look closer chips
  var SPONGY = [ // front layer cells [x, y, rx, ry]; the routes run between and through them
    [-0.45, -0.5, 0.42, 0.36], [0.45, -0.35, 0.4, 0.34], [1.3, -0.58, 0.36, 0.34], [-0.2, -1.42, 0.42, 0.33], [0.95, -1.45, 0.38, 0.32],
    [-1.35, -1.38, 0.36, 0.32], [-3.25, -1.3, 0.42, 0.34], [-4.15, -0.55, 0.4, 0.36], [-4.85, -1.35, 0.36, 0.32], [-3.0, 0.62 - 1.2, 0.0, 0.0],
    [3.75, -0.55, 0.42, 0.34], [4.6, -1.3, 0.4, 0.33], [3.55, -1.42, 0.3, 0.28], [4.75, -0.35, 0.3, 0.3]
  ].filter(function (c) { return c[2] > 0; });
  var ARMS = [[0, 1], [1, 2], [0, 3], [3, 4], [5, 3], [2, 4], [6, 7], [7, 8], [6, 8], [9, 10], [10, 11], [9, 11], [12, 10]];
  function heroRoutes() {
    // 2D waypoints at the front face; z is added per molecule
    return {
      apo: [[-1.1, -0.3], [-0.8, -0.18], [-0.45, -0.1], [-0.02, -0.28], [0.45, 0.02], [0.88, -0.32], [1.3, -0.22], [1.68, -0.5], [1.76, -0.9], [1.98, -1.08]],
      tm: [[-1.1, -0.42], [-0.86, -0.48], [-0.45, -0.52], [-0.05, -0.44], [0.45, -0.38], [0.86, -0.48], [1.3, -0.6], [1.66, -0.78], [1.98, -1.08]],
      vap: [[-1.25, -0.82], [-0.95, -1.0], [-0.25, -0.98], [0.5, -0.95], [1.3, -1.05], [1.98, -1.2]],
      tail: [[2.32, -1.42], [HS.x, -1.82], [HS.x, -2.25], [HS.x, -2.75]],
      flashTm: [[-0.86, -0.48], [-0.05, -0.44], [0.86, -0.48], [1.66, -0.78]]
    };
  }
  function heroBuild(ctx) {
    var T = ctx.THREE, M = WP.macro, root = ctx.root;
    var G = function (g) { ctx.disp.push(g); return g; };
    var mats = ctx.mats;
    mats.cut = M.glass(T, 0xe8b24a, { opacity: 0.3, roughness: 0.04, ccr: 0.02, emissive: 0x3a2400, ei: 0.4, rimColor: 0xffd27a, rimK: 1.0, rimPow: 3.2, env: 1.1 });
    mats.epi = M.glass(T, 0x9fd27a, { opacity: 0.34, emissive: 0x24520f, ei: 1, rimColor: 0xd6ffb0, rimK: 0.75 });
    mats.pal = M.glass(T, 0x3f8f22, { opacity: 0.36, emissive: 0x2a6a0e, ei: 1, rimColor: 0xb8f080, rimK: 0.75 });
    mats.spo = M.glass(T, 0x5aa632, { opacity: 0.33, emissive: 0x23600c, ei: 1, rimColor: 0xc4f090, rimK: 0.65 });
    mats.nuc = M.glass(T, 0xe8e2c0, { opacity: 0.55, emissive: 0x3a3418, ei: 0.7, rimColor: 0xfff6d0, rimK: 0.6 });
    mats.bs = M.glass(T, 0xd9d25a, { opacity: 0.42, emissive: 0x3a4208, ei: 1, rimColor: 0xfff0a0, rimK: 0.8 });
    mats.gc = M.glass(T, 0x6fb43e, { opacity: 0.45, emissive: 0x1d4a0c, ei: 1, rimColor: 0xd8ffb0, rimK: 0.9 });
    mats.xw = M.glass(T, 0xe8d9b0, { opacity: 0.4, side: T.DoubleSide, emissive: 0x2a2010, ei: 0.6, rimColor: 0xfff4d8, rimK: 0.5 });
    mats.xl = M.lin(new T.MeshPhysicalMaterial({ color: 0x5fb0ec, transparent: true, opacity: 0.45, roughness: 0.05, clearcoat: 1, emissive: 0x0c3a66, emissiveIntensity: 0.8, depthWrite: false }));
    mats.ph = M.glass(T, 0xd8bf88, { opacity: 0.4, emissive: 0x2a1c08, ei: 0.6 });
    mats.chl = M.lin(new T.MeshPhysicalMaterial({ color: 0x2f8a1a, roughness: 0.25, metalness: 0, clearcoat: 0.6, clearcoatRoughness: 0.2, emissive: 0x1d6a0a, emissiveIntensity: 0.85 }));
    mats.aqp = M.lin(new T.MeshStandardMaterial({ color: 0x8e6ee0, roughness: 0.3, emissive: 0x5a3ad0, emissiveIntensity: 0.9 }));
    mats.mol = new T.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08, emissive: 0x220806, emissiveIntensity: 0.4 });
    var mtx = new T.Matrix4(), q = new T.Quaternion(), e3 = new T.Euler(), v = new T.Vector3(), s3 = new T.Vector3();
    function inst(geo, mat, list, parent) {
      var m = new T.InstancedMesh(geo, mat, list.length);
      list.forEach(function (it, i) {
        e3.set(it.rx || 0, it.ry || 0, it.rz || 0); q.setFromEuler(e3);
        mtx.compose(v.set(it.x, it.y, it.z), q, s3.set(it.sx, it.sy, it.sz)); m.setMatrixAt(i, mtx);
      });
      m.instanceMatrix.needsUpdate = true; (parent || root).add(m); return m;
    }
    var Z0 = 0.35, Z1 = 2.5, X0 = -5.4, X1 = 5.4;
    // cuticle: a thin glossy sheet on top
    // upper and lower epidermis: pillow cells
    var pill = G(M.superEllipsoid(1, 1, 1, 0.42, 10, 6)), up = [], lo = [], upF = [], loF = [], tops = [];
    // each row tiles the whole block width (narrower end cells), so the cuticle never overhangs bare air
    for (var iz = 0; iz < 2; iz++) {
      var bnd = [X0], off = iz ? 0.45 : 0;
      for (var kb = 1; X0 + off + kb * 1.34 < X1 - 0.45; kb++) { var bx = X0 + off + kb * 1.34; if (bx - bnd[bnd.length - 1] > 0.5) bnd.push(bx); }
      bnd.push(X1);
      for (var ix = 0; ix < bnd.length - 1; ix++) {
        var x = (bnd[ix] + bnd[ix + 1]) / 2, hw = (bnd[ix + 1] - bnd[ix]) / 2 - 0.03, z = Z0 + 0.55 + iz * 1.1;
        (iz ? up : upF).push({ x: x, y: 2.0, z: z, sx: hw, sy: 0.3, sz: 0.52 });
        tops.push([x, z, hw]);
        if (!(Math.abs(x - HS.x) < 0.9 && z > 1.2)) (iz ? lo : loF).push({ x: x, y: -2.06, z: z, sx: hw, sy: 0.26, sz: 0.52 });
      }
    }
    // cuticle: a thin glossy film draped over the cell tops, dipping into the grooves between cells
    var cg = G(new T.PlaneGeometry(X1 - X0 - 0.06, Z1 - Z0 - 0.02, 72, 14)); cg.rotateX(-Math.PI / 2);
    var cp = cg.attributes.position;
    for (var ci = 0; ci < cp.count; ci++) {
      var px0 = cp.getX(ci), pz0 = cp.getZ(ci) + (Z0 + Z1) / 2, hy = 0;
      tops.forEach(function (tp) {
        var u = Math.abs(px0 - tp[0]) / (tp[2] + 0.04), w = Math.abs(pz0 - tp[1]) / 0.56;
        var f = 1 - Math.pow(u, 4) - Math.pow(w, 4); if (f > 0) hy = Math.max(hy, Math.pow(f, 0.32));
      });
      cp.setY(ci, 2.03 + 0.285 * hy);
      cp.setZ(ci, pz0);
    }
    cg.computeVertexNormals();
    var cut = new T.Mesh(cg, mats.cut); cut.renderOrder = 3; root.add(cut);
    inst(pill, mats.epi, up); inst(pill, mats.epi, lo); inst(pill, mats.epi, upF, ctx.far); inst(pill, mats.epi, loF, ctx.far);
    // palisade: columns, three rows deep
    var col = G(M.superEllipsoid(1, 1, 1, 0.55, 10, 8)), pal = [], palF = [], chl = [], nucs = [];
    for (var px = 0; px < 16; px++) for (var pz = 0; pz < 3; pz++) {
      var cx = X0 + 0.38 + px * 0.67 + (pz % 2 ? 0.3 : 0), cz = Z1 - 0.32 - pz * 0.62;
      if (cx > X1 - 0.3) continue;
      var hh = 0.7 + ((px * 7 + pz * 3) % 5) * 0.012;
      (pz < 2 ? pal : palF).push({ x: cx, y: 0.92, z: cz, sx: 0.28, sy: hh, sz: 0.26 });
      if (pz < 2) for (var k = 0; k < (pz ? 4 : 8); k++) { // chloroplasts line the walls (parietal), lens shaped
        var a = k * 2.4 + px * 1.7;
        chl.push({ x: cx + Math.cos(a) * 0.21, y: 0.36 + (k % 6) * 0.2 + (k > 5 ? 0.1 : 0), z: cz + Math.sin(a) * 0.19, sx: 0.1, sy: 0.12, sz: 0.045, ry: -a + Math.PI / 2 });
      }
      if (pz === 0 && px % 3 === 1) nucs.push({ x: cx + 0.06, y: 1.28, z: cz + 0.08, sx: 0.1, sy: 0.12, sz: 0.1 });
    }
    inst(col, mats.pal, pal); inst(col, mats.pal, palF, ctx.far);
    // spongy mesophyll: lobed cells (a core plus arms toward neighbours), two layers deep
    var lobe = G(M.superEllipsoid(1, 1, 1, 0.9, 8, 6)), spo = [], spoF = [];
    [[1.85, 0], [0.75, 0.25]].forEach(function (L, li) {
      var spo0 = spo; if (li) spo = spoF;
      SPONGY.forEach(function (c, i) {
        var dx = li ? ((i * 37) % 7 - 3) * 0.06 : 0;
        spo.push({ x: c[0] + dx, y: c[1] + L[1] * (i % 2 ? -0.4 : 0.3), z: L[0], sx: c[2], sy: c[3], sz: 0.36 });
        if (!li) for (var k2 = 0; k2 < 4; k2++) { var a2 = k2 * 1.7 + i; chl.push({ x: c[0] + Math.cos(a2) * c[2] * 0.72, y: c[1] + Math.sin(a2) * c[3] * 0.72, z: L[0] + 0.22, sx: 0.1, sy: 0.055, sz: 0.09, rz: a2 + Math.PI / 2 }); }
      });
      ARMS.forEach(function (ar) {
        var a = SPONGY[ar[0]], b = SPONGY[ar[1]]; if (!a || !b) return;
        var mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, ang = Math.atan2(b[1] - a[1], b[0] - a[0]), len = Math.hypot(b[0] - a[0], b[1] - a[1]);
        spo.push({ x: mx, y: my, z: L[0], sx: len * 0.42, sy: 0.15, sz: 0.24, rz: ang });
      });
      spo = spo0;
    });
    inst(lobe, mats.spo, spo); inst(lobe, mats.spo, spoF, ctx.far);
    // minor vein along z: bundle sheath ring, xylem conduits with annular thickenings, phloem
    var bsc = [], aq = [];
    for (var b = 0; b < 9; b++) {
      var ang = b / 9 * Math.PI * 2;
      for (var bz = 0; bz < 2; bz++) bsc.push({ x: HV.cx + Math.cos(ang) * HV.R, y: HV.cy + Math.sin(ang) * HV.R, z: Z0 + 0.55 + bz * 1.15, sx: 0.3, sy: 0.3, sz: 0.56, rz: ang });
      if (Math.cos(ang) > -0.2) aq.push({ x: HV.cx + Math.cos(ang) * (HV.R + 0.3), y: HV.cy + Math.sin(ang) * (HV.R + 0.3), z: 2.2, sx: 0.05, sy: 0.05, sz: 0.05 });
    }
    inst(lobe, mats.bs, bsc);
    inst(G(new T.SphereGeometry(1, 8, 6)), mats.aqp, aq);
    var xyl = [[-2.38, -0.2, 0.17], [-2.02, -0.16, 0.15], [-2.2, -0.5, 0.13]];
    var tube = G(new T.CylinderGeometry(1, 1, Z1 - Z0 - 0.05, 16, 1, true)), lum = G(new T.CylinderGeometry(1, 1, Z1 - Z0 - 0.1, 12, 1, false));
    var ring = G(new T.TorusGeometry(1, 0.13, 4, 12)), rings = [];
    xyl.forEach(function (c) {
      var w = new T.Mesh(tube, mats.xw); w.rotation.x = Math.PI / 2; w.scale.set(c[2], 1, c[2]); w.position.set(c[0], c[1], (Z0 + Z1) / 2); root.add(w);
      var l = new T.Mesh(lum, mats.xl); l.rotation.x = Math.PI / 2; l.scale.set(c[2] * 0.82, 1, c[2] * 0.82); l.position.set(c[0], c[1], (Z0 + Z1) / 2); root.add(l);
      for (var r = 0; r < 3; r++) rings.push({ x: c[0], y: c[1], z: Z0 + 0.5 + r * 0.7, sx: c[2] * 0.95, sy: c[2] * 0.95, sz: c[2] * 0.95 });
    });
    inst(ring, mats.xw, rings);
    var phl = [[-2.45, -0.78, 0.11], [-2.2, -0.86, 0.12], [-1.95, -0.76, 0.1]].map(function (c) { return { x: c[0], y: c[1], z: 1.4, sx: c[2], sy: c[2], sz: 1.0 }; });
    inst(lobe, mats.ph, phl);
    // guard cells: two plump kidneys along z, with chloroplasts
    var gcg = G(M.superEllipsoid(1, 1, 1, 0.8, 12, 9));
    HT.gc = [-1, 1].map(function (sd) {
      var m = new T.Mesh(gcg, mats.gc); m.scale.set(0.24, 0.27, 0.58); m.position.set(HS.x + sd * 0.34, HS.y, HS.z); root.add(m);
      for (var k3 = 0; k3 < 5; k3++) chl.push({ x: HS.x + sd * (0.4 + (k3 % 2) * 0.06), y: HS.y + ((k3 % 3) - 1) * 0.1, z: HS.z + 0.36 - k3 * 0.18, sx: 0.075, sy: 0.05, sz: 0.075 });
      return m;
    });
    inst(G(new T.SphereGeometry(1, 7, 5)), mats.chl, chl);
    inst(G(new T.SphereGeometry(1, 8, 6)), mats.nuc, nucs);
    // foreground, out of focus (ctx.near): two glassy cells and a few drifting vapour molecules close to the lens
    if (ctx.near) {
      inst(lobe, mats.spo, [{ x: -6.4, y: -2.9, z: 6.4, sx: 1.25, sy: 0.95, sz: 0.9 }, { x: 6.6, y: 3.0, z: 6.0, sx: 1.0, sy: 0.8, sz: 0.8 }], ctx.near);
      var vg = G(M.waterGeo(T, 0.12, true)), vlist = [];
      for (var vq = 0; vq < 7; vq++) vlist.push({ x: 4.2 + vq * 0.55, y: -3.6 + (vq % 3) * 0.5, z: 5.2 + (vq % 2) * 0.8, sx: 1, sy: 1, sz: 1, rx: vq, ry: vq * 1.3 });
      HT.nearV = inst(vg, mats.mol, vlist, ctx.near); HT.nearList = vlist;
    }
    // water molecules and glows
    // 13 Oct (slow and named): sap in the xylem glows softly, so the vein reads as the source (depth and glow, toward the light heroes)
    HT.sap = M.halos(T, 18, 0x7cc4ff, 0.7); root.add(HT.sap.obj); ctx.disp.push(HT.sap.geo, HT.sap.mat);
    xyl.forEach(function (c, ci) { for (var sq = 0; sq < 6; sq++) HT.sap.set(ci * 6 + sq, c[0], c[1], Z0 + 0.25 + sq * 0.36); });
    HT.sap.commit(); HT.sap.mat.opacity = 0.3;
    HT.molMesh = new T.InstancedMesh(G(M.waterGeo(T, 0.1, true)), mats.mol, HT.N); // molecules about 18 % larger HT.molMesh.frustumCulled = false; root.add(HT.molMesh);
    HT.glow = { apo: M.halos(T, HT.N, 0xffb444, 2.0), tm: M.halos(T, HT.N, 0x6fb0ff, 2.0), vap: M.halos(T, HT.N, 0xf1f6ff, 2.4), flash: M.halos(T, 24, 0xb58cff, 2.2) };
    Object.keys(HT.glow).forEach(function (k) { root.add(HT.glow[k].obj); ctx.disp.push(HT.glow[k].geo, HT.glow[k].mat); });
    HT._near = null;
    HT.cav = M.halos(T, 3, 0xe8f6ff, 3.2); root.add(HT.cav.obj); ctx.disp.push(HT.cav.geo, HT.cav.mat);
    HT.cav.set(0, HS.x, HS.y + 0.55, HS.z); HT.cav.set(1, HS.x - 0.35, HS.y + 0.75, HS.z - 0.2); HT.cav.set(2, HS.x + 0.3, HS.y + 0.7, HS.z + 0.2); HT.cav.commit();
    HT.flashes = [];
    var RT = heroRoutes();
    function line3(pts2, z) { return pts2.map(function (p) { return [p[0], p[1], z]; }); }
    HT.mkPath = function (route, z, jx, jy) {
      var pts = [[HV.cx + jx, HV.cy + 0.18 + jy, Z0 + 0.1], [HV.cx + jx, HV.cy + 0.18 + jy, z], [HV.cx + HV.R - 0.3, HV.cy + 0.05, z]];
      var mid = line3(RT[route], z), tail = line3(RT.tail, z).map(function (p, i) { return [p[0], p[1], z + (HS.z - z) * Math.min(1, (i + 1) / 2)]; });
      var all = pts.concat(mid);
      var liq = WP.macro.polyline(all).total;
      return { pl: WP.macro.polyline(all.concat(tail)), liquid: route === 'vap' ? WP.macro.polyline(pts.concat(mid.slice(0, 1))).total : liq, bsIn: WP.macro.polyline(pts.slice(0, 3)).total - 0.62, bsOut: WP.macro.polyline(pts.slice(0, 3)).total };
    };
    HT.flashTm = RT.flashTm;
    for (var i = 0; i < HT.N; i++) HT.mols.push(newMol(true));
    var L = [
      { id: 'bs', text: 'bundle sheath', tier: 1, pos: new T.Vector3(HV.cx, HV.cy + HV.R + 0.3, Z1) },
      { id: 'st', text: 'stoma, lower side', tier: 1, side: 'right', pos: new T.Vector3(HS.x + 0.5, HS.y - 0.05, HS.z + 0.45) },
      { id: 'xy', text: 'xylem', tier: 1, pos: new T.Vector3(HV.cx - 0.2, HV.cy - 0.25, Z1), narrow: false },
      { id: 'cut', text: 'cuticle', pos: new T.Vector3(-4.3, 2.4, Z1), narrow: false },
      { id: 'pal', text: 'palisade', pos: new T.Vector3(-4.6, 1.35, Z1) },
      { id: 'spo', text: 'spongy mesophyll', pos: new T.Vector3(4.2, -0.2, Z1) },
      { id: 'air', text: 'air space', pos: new T.Vector3(0.15, -0.95, Z1 + 0.1), narrow: false },
      { id: 'vap', text: 'water vapour out', pos: new T.Vector3(HS.x - 0.9, -2.85, HS.z), narrow: false }
    ];
    ctx.setLabels(L);
  }
  function pickRoute(r) {
    var p = HT.res ? HT.res.partition : { apo: 0.8, tm: 0.1, vap: 0.1 };
    return r < p.apo ? 'apo' : (r < p.apo + p.tm ? 'tm' : 'vap');
  }
  function newMol(scatter) {
    var r = Math.random(), route = pickRoute(r);
    var z = 2.12 + Math.random() * 0.3, jx = (Math.random() - 0.5) * 0.22, jy = (Math.random() - 0.5) * 0.12;
    var P = HT.mkPath(route, z, jx, jy);
    return { route: route, P: P, s: scatter ? Math.random() * P.pl.total : 0, spin: Math.random() * 6.28, dx: (Math.random() - 0.5) * 0.8, f: [0, 0, 0], flashed: 0 };
  }
  function heroFrame(ctx, t, dt) {
    var T = ctx.THREE, res = HT.res;
    var E = res ? res.E : 2, v = clamp(0.32 * E, 0, 2.2);   // world units per second, proportional to the model E
    var mtx = HT._m || (HT._m = new T.Matrix4()), q = HT._q || (HT._q = new T.Quaternion()), e = HT._e || (HT._e = new T.Euler()), pos = HT._p || (HT._p = new T.Vector3()), sc = HT._s || (HT._s = new T.Vector3());
    var gfl = HT.glow.flash;
    HT.flashes = HT.flashes.filter(function (f) { f.a -= dt * 2.2; return f.a > 0; });
    HT.mols.forEach(function (m, i) {
      var vap = m.s > m.P.liquid;
      m.s += dt * v * (vap ? 2.4 : 1);
      if (m.s >= m.P.pl.total + 1.6) { HT.mols[i] = m = newMol(false); vap = false; }
      var f = m.P.pl.at(Math.min(m.s, m.P.pl.total), m.f), x = f[0], y = f[1], z = f[2];
      if (m.s > m.P.pl.total) { var o = m.s - m.P.pl.total; x += m.dx * o; y -= o * 0.8; }
      // membrane crossings flash an aquaporin glow (bundle sheath for all, cells for the membrane route)
      if (dt > 0 && m.flashed === 0 && m.s > m.P.bsOut - 0.05) { m.flashed = 1; HT.flashes.push({ x: x, y: y, z: z + 0.05, a: 1 }); }
      if (dt > 0 && m.route === 'tm' && m.flashed >= 1 && m.flashed <= HT.flashTm.length) {
        var fp = HT.flashTm[m.flashed - 1];
        if (Math.abs(x - fp[0]) < 0.06 && Math.abs(y - fp[1]) < 0.1) { HT.flashes.push({ x: x, y: y, z: z + 0.05, a: 1 }); m.flashed++; }
      }
      m.spin += dt * (vap ? 3 : 1.2);
      e.set(m.spin * 0.7, m.spin, 0); q.setFromEuler(e);
      var fade = m.s > m.P.pl.total ? Math.max(0, 1 - (m.s - m.P.pl.total) / 1.6) : Math.min(1, m.s * 3 + 0.2);
      mtx.compose(pos.set(x, y, z), q, sc.setScalar(fade)); HT.molMesh.setMatrixAt(i, mtx);
      m.pp = m.pp || [0, 0, 0, 0]; m.pp[0] = x; m.pp[1] = y; m.pp[2] = z; m.pp[3] = fade;
      var k = vap ? 'vap' : m.route;
      var inVein = m.s < m.P.bsOut;
      ['apo', 'tm', 'vap'].forEach(function (g) { if (g === k && fade > 0.15 && !inVein) HT.glow[g].set(i, x, y, z); else HT.glow[g].hide(i); });
    });
    HT.molMesh.instanceMatrix.needsUpdate = true;
    // names (anti clutter rule): one water per route on desktop (walls, membranes, vapour), one liquid and one vapour on phones
    var HN = HT.hn || (HT.hn = WP.heroNames(ctx));
    HN.begin();
    HT.mols.forEach(function (m) {
      if (!m.pp || m.pp[3] < 0.7 || m.s < m.P.bsOut + 0.15 || m.s > m.P.pl.total) return;
      if (m.s > m.P.liquid) HN.add('vap', m, 'H₂O vapour', m.pp[0], m.pp[1], m.pp[2], 0.12, { q: 1 });
      else if (m.route !== 'vap') HN.add(ctx.narrow ? 'liq' : 'liq' + m.route, m, 'H₂O', m.pp[0], m.pp[1], m.pp[2], 0.12, { q: 1, pri: m.route === 'tm' ? 1 : 0 });
    });
    HN.end();
    if (HT.sap) HT.sap.mat.opacity = clamp(0.12 + 0.06 * E, 0.15, 0.4) * (0.85 + 0.15 * Math.sin(t * 1.3));
    for (var j = 0; j < 24; j++) { var fl = HT.flashes[HT.flashes.length - 1 - j]; if (fl) gfl.set(j, fl.x, fl.y, fl.z); else gfl.hide(j); }
    // FIX ROUND 1 (14 Oct): close up (the Bundle sheath chip, or a user zoom) the additive halos stacked into a white
    // hot spot over the sheath and xylem junction. Shrink the halos and dim the flashes in proportion to camera distance.
    var vc = HT._vc || (HT._vc = new T.Vector3());
    var near = clamp(ctx.camera.position.distanceTo(vc.set(HV.cx, HV.cy, Z1T)) / Math.max(4, HT.camD || 14), 0.28, 1);
    if (HT._near !== near) {
      HT._near = near;
      var GB = { apo: 2.0, tm: 2.0, vap: 2.4, flash: 2.2 };
      Object.keys(GB).forEach(function (g) { HT.glow[g].mat.size = GB[g] * near; HT.glow[g].mat.opacity = 0.9 * (0.45 + 0.55 * near); });
      if (HT.sap) HT.sap.mat.size = 0.7 * (0.5 + 0.5 * near);
    }
    ['apo', 'tm', 'vap', 'flash'].forEach(function (g) { HT.glow[g].commit(); });
    // the pore follows gs
    var open = res ? clamp(res.gs / (res.gsMax || 1), 0, 1) : 0.6;
    HT.gc.forEach(function (m, k) { var sd = k ? 1 : -1; m.position.x = HS.x + sd * (0.25 + 0.13 * open); m.scale.y = 0.25 + 0.04 * open; });
    if (HT.cav) HT.cav.mat.opacity = clamp(0.18 + 0.12 * E, 0.2, 0.75) * (0.5 + 0.5 * open);
    // out of focus vapour near the lens drifts away from the stoma side at a rate tied to E
    if (HT.nearV) {
      HT.nearList.forEach(function (it, j) {
        var ph = (t * (0.05 + 0.03 * E) + j / HT.nearList.length) % 1;
        e.set(it.rx + t * 0.4, it.ry + t * 0.3, 0); q.setFromEuler(e);
        mtx.compose(pos.set(it.x + ph * 1.6, it.y - 0.6 + ph * 2.2, it.z), q, sc.setScalar(Math.min(1, ph * 5, (1 - ph) * 5)));
        HT.nearV.setMatrixAt(j, mtx);
      });
      HT.nearV.instanceMatrix.needsUpdate = true;
    }
  }
  function heroTheme(ctx) {
    var m = ctx.mats, d = ctx.dark;
    if (!m.epi) return;
    // light theme: the pale epidermis needs more body against the bright bokeh (Q-visual 14 Oct)
    m.epi.opacity = d ? 0.3 : 0.42; m.epi.emissiveIntensity = d ? 1.1 : 0.75;
    m.cut.opacity = d ? 0.24 : 0.3;
    m.pal.emissiveIntensity = d ? 1.15 : 0.85; m.spo.emissiveIntensity = d ? 1.1 : 0.8;
    ctx.renderer.toneMappingExposure = d ? 1.02 : 0.92;
  }
  function heroCamera(ctx, t) {
    var cam = ctx.camera, asp = ctx.w / ctx.h, tv = Math.tan(cam.fov * Math.PI / 360);
    var halfW = ctx.narrow ? 3.75 : 5.9, halfH = 3.6; // 13 Oct: phones frame the vein to the stoma tighter (larger subject)
    var D = Math.max(halfW / (tv * asp), halfH / tv) + 2.2;
    HT.camD = D;
    var yaw = 0.2 + 0.1 * Math.sin(t * 0.11), pitch = 0.2 + 0.035 * Math.sin(t * 0.083 + 1), dol = 1 + 0.035 * Math.sin(t * 0.07);
    var tx = ctx.narrow ? 0.15 : 0, ty = 0.55 + (ctx.narrow ? 0.1 : 0), tz = 1.4;
    cam.position.set(tx + Math.sin(yaw) * Math.cos(pitch) * D * dol, ty + Math.sin(pitch) * D * dol, tz + Math.cos(yaw) * Math.cos(pitch) * D * dol);
    cam.lookAt(tx, ty, tz);
    ctx.scene.fog.near = D - 1; ctx.scene.fog.far = D + 16; ctx.farScene.fog.near = D - 2; ctx.farScene.fog.far = D + 9;
  }
  function heroLive(res) {
    if (!HT.ctx) return;
    var p = res.partition;
    var nb = function (x) { return num(100 * x, 0) + '\u00a0%'; };
    HT.ctx.setLive('<span style="white-space:nowrap">E ' + num(res.E, 1) + '\u00a0mmol\u00a0m⁻²\u00a0s⁻¹</span> · <span style="white-space:nowrap">walls ' + nb(p.apo) + '</span> · <span style="white-space:nowrap">membranes ' + nb(p.tm) + '</span> · <span style="white-space:nowrap">vapour ' + nb(p.vap) + '</span>');
  }
  function heroInit(host) {
    if (!host) return;
    ensureMacro(function () {
      if (HT.ctx) return;
      HT.ctx = WP.macro.hero(host, {
        id: 't4-hero', seed: 11, fov: 28, fogNear: 16, fogFar: 34,
        label: 'Three dimensional leaf block, cut open: cuticle and upper epidermis on top, columnar palisade cells, lobed spongy cells with air spaces, a minor vein with xylem and a bundle sheath, and a lower epidermis with one stoma. Water molecules leave the vein, cross the bundle sheath membrane, move along cell walls, through cells or as vapour, and leave as vapour through the stoma on the lower side.',
        question: 'How does water get out of a vein?',
        answer: 'In this model it first crosses a living membrane in the bundle sheath (violet flash, an aquaporin); whether all of it must is still debated. Then it mostly slides along wet cell walls (amber glow), partly passes cell to cell across membranes (blue), and partly travels as vapour through the air spaces (white). It evaporates inside the leaf and leaves through a stoma on the lower side.',
        credit: { text: 'Buckley 2015 · Plant, Cell & Environment', doi: '10.1111/pce.12372' },
        capAlign: 'left',
        height: function (w) { return w < 600 ? 480 : Math.round(Math.min(680, Math.max(460, w * 0.66))); }, // 13 Oct fix round (Q W3): 480 on phones, no empty top third
        lift: function (ctx) { return ctx.narrow ? 62 : 34; },
        fallbackNote: 'This 3D leaf needs WebGL, which this browser does not offer. The cross section below shows the same four routes.',
        build: heroBuild, frame: heroFrame, camera: heroCamera, theme: heroTheme,
        /* LOOK CLOSER (14 Oct, controls engineer journey): zoom, pan and tilt from WP.macro.orbit. Chips fly to the
           bundle sheath ring on the cut face, the palisade, the spongy cells, and the stoma seen from below the leaf
           (it opens on the lower side). World units as in heroBuild. */
        focus: [
          { id: 'bs', label: 'Bundle sheath', target: [HV.cx, HV.cy, Z1T], dist: 5.0, theta: 0.12, phi: 1.42 },
          { id: 'pal', label: 'Palisade', target: [-3.4, 1.3, Z1T], dist: 4.2, theta: 0.18, phi: 1.3 },
          { id: 'spo', label: 'Spongy cells', target: [2.4, -0.4, Z1T], dist: 4.2, theta: -0.15, phi: 1.45 },
          { id: 'st', label: 'Stoma (from below)', target: [HS.x, HS.y, HS.z], dist: 4.6, theta: 0.35, phi: 2.2 }
        ]
      });
      if (HT.res) heroLive(HT.res);
    });
  }
  function heroUpd(res) {
    HT.res = res;
    if (HT.ctx) { heroLive(res); HT.ctx.invalidate(); }
  }

  WP.levels.push({ id: 'tissue', n: 4, title: 'The Tissue', subtitle: 'outside the xylem', scale: '100 µm', focus: [30, 45], mount: mount, update: update });
})();

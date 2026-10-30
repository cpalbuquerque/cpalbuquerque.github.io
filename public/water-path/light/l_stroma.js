/* Light to Sugar: Plate IV, The Stroma (L2 owner, round 1, 11 Oct 2026).
   4.1 The Calvin Benson cycle, live: a canvas wheel with three stations (carboxylation at Rubisco, reduction, regeneration).
       CO2 and O2 arrive at Rubisco at the model rates vc and vo; each carboxylation makes two 3‑PGA that spend 2 ATP and
       2 NADPH at the reduction station; regeneration spends 1 ATP per RuBP; one G3P leaves for every 3 CO2 fixed. Each
       oxygenation sends 2 phosphoglycolate to the photorespiration loop, which costs ATP and NADPH and releases CO2
       (0.5 per oxygenation). One drawing scale for every molecule, so the ratios on screen are the model ratios.
   4.2 A versus Ci: Ac (Rubisco) and Aj (RuBP regeneration), the operating point and the stomatal supply line.
   4.3 Photorespiration map: share of fixed CO2 lost, temperature × CO2.
   4.4 The bill per G3P and per oxygenation. Cases, Expert, questions, Test yourself.
   Drawing kit: LP.mol (copied from journey/mol.js into l_thylakoid.js). Rates: LP.result (engine.js). */
(function () {
  'use strict';
  var LP = window.LP = window.LP || {};
  LP.panels = LP.panels || [];
  LP.evidence = LP.evidence || {};
  LP.howto = LP.howto || {};
  LP.sources = LP.sources || {};
  var TAU = Math.PI * 2;
  function clamp(x, a, b) { return x < a ? a : (x > b ? b : x); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { return t * t * (3 - 2 * t); }
  function rnd() { return Math.random(); }
  var ui = null;
  function U() { return (ui = LP.ui); }
  function num(x, d) { return U().num(x, d); }
  function R() { return LP.result || {}; }
  function M() { return LP.mol; }

  /* ================================================================== evidence (plate keys) */
  var EV = LP.evidence;
  EV['str.scale'] = { claim: 'In the cycle theatre one drawn carboxylation stands for 4 µmol of CO2 fixed per m2 of leaf per second, and every other molecule (O2, ATP, NADPH, the ADP and NADP+ they leave behind, 3‑PGA, G3P, phosphoglycolate, released CO2) is drawn on that same scale, so 3 ATP and 2 NADPH are spent per drawn CO2, and the O2 to CO2 ratio at Rubisco is the model vo/vc.', cite: 'Drawing convention of this page; rates from the engine (FvCB stoichiometry).', measured: 'none', value: '1 event = 4 µmol m−2 s−1', badge: 'DERIVED', note: 'Time is slowed. A Rubisco site at its in vitro maximum turns over about 3 times per second, but averaged over the land in the field it manages about 0.03 per second (Bar-On and Milo 2019, key rubisco_global), and a leaf holds billions of sites per mm2.' };
  EV['str.pr'] = { claim: 'Each oxygenation makes one 3‑PGA and one 2 phosphoglycolate. Two phosphoglycolates are salvaged through the chloroplast, peroxisome and mitochondrion into one 3‑PGA, releasing one CO2 and one NH3. In FvCB terms: 0.5 CO2 released, about 3.5 ATP and 2 NADPH equivalents spent per oxygenation.', cite: 'Farquhar, von Caemmerer and Berry (1980) stoichiometry.', doi: '10.1007/BF00386231', measured: 'model stoichiometry', value: '0.5 CO2; 3.5 ATP; 2 NADPH per oxygenation', badge: 'DERIVED', note: 'The NH3 must be refixed (GS/GOGAT), which is part of the ATP and reductant bill.' };
  EV['str.heat'] = { claim: 'Share of fixed CO2 lost again by photorespiration = 0.5 vo/vc = Γ*/Ci, with Γ* from the Bernacchi et al. (2001) temperature function and Ci = 0.7 × Ca as in the engine.', cite: 'FvCB definition of Γ*; temperature function of Bernacchi et al. (2001) (constants UNVERIFIED in this build).', doi: '10.1111/j.1365-3040.2001.00668.x', measured: 'calculation', value: '', badge: 'DERIVED', note: 'Real Cc is lower than Ci (finite mesophyll conductance), so the true loss is somewhat larger than this map.' };
  EV['str.south'] = { claim: 'Tobacco given synthetic glycolate pathways inside the chloroplast (and less glycolate export) raised photosynthetic quantum yield by about 20 % and biomass by more than 40 % in replicated field trials. The authors cite yield losses to photorespiration of 20 to 50 % in C3 crops depending on temperature.', cite: 'South PF, Cavanagh AP, Liu HW, Ort DR (2019) Science 363:eaat9077.', doi: '10.1126/science.aat9077', measured: 'Nicotiana tabacum, field trials, biomass', value: '+20 % quantum yield; > 40 % biomass', badge: 'VERIFIED', note: 'One crop, one set of field seasons. Whether food crops gain the same is being tested.' };
  EV['str.face'] = { claim: 'Free Air CO2 Enrichment (FACE) experiments show that elevated CO2 raises photosynthetic carbon gain over the long term despite some down regulation of Rubisco, lowers water use at leaf and canopy scale, and raises crop yield less than expected from chamber studies.', cite: 'Leakey ADB, Ainsworth EA, Bernacchi CJ, Rogers A, Long SP, Ort DR (2009) J Exp Bot 60:2859 to 2876.', doi: '10.1093/jxb/erp096', measured: 'review of FACE experiments', value: 'qualitative', badge: 'VERIFIED', note: '' };
  EV['str.c4what'] = { claim: 'The C4 button raises the CO2 Rubisco sees by raising the CO2 in the air. It only imitates what a C4 bundle sheath does to Rubisco (a high CO2 compartment); it does not model the C4 pump or its ATP cost.', cite: 'Teaching shortcut.', measured: 'none', value: '', badge: 'ILLUSTRATIVE', note: 'C4 photosynthesis brings PEP carboxylase, Kranz anatomy and an extra ATP cost per CO2 (about 2 ATP in the NADP malic enzyme type, a textbook value UNVERIFIED this run).' };
  /* r5: retrieved from PubMed on 12 Oct 2026 (abstract level, PMID 12481082) */
  EV['str.gm2002'] = { claim: 'In tobacco, mesophyll conductance (gm) rose with temperature with a Q10 of about 2.2 between 10 and 40 °C and peaked at 35 to 37.5 °C, suggesting a protein facilitated process. Its share of the total limitation to CO2 uptake inside the leaf rose from 0.10 at 10 °C to 0.22 at 40 °C.', cite: 'Bernacchi CJ, Portis AR, Nakano H, von Caemmerer S, Long SP (2002) Plant Physiol 130:1992 to 1998.', doi: '10.1104/pp.008250', measured: 'Nicotiana tabacum cv W38; gas exchange with modulated chlorophyll fluorescence, 10 to 40 °C', value: 'Q10 about 2.2; limitation share 0.10 (10 °C) to 0.22 (40 °C)', badge: 'VERIFIED', note: 'So the Ci = Cc shortcut of this page costs more at high temperature.' };
  EV['str.fit'] = { claim: 'The fit box finds Vcmax (from the points it assigns to Rubisco limitation), J (from the rest) and Rd by least squares on the FvCB equations on a Ci basis, using this plate’s Kc, Ko and Γ* at the leaf temperature you set.', cite: 'Teaching fit after the FvCB model; the full method (and its pitfalls) is in Sharkey et al. (2007), key fvcb_fitting.', measured: 'none', value: '', badge: 'ILLUSTRATIVE', note: 'No mesophyll conductance, no TPU, Rd searched from 0 to 3 µmol m−2 s−1. Use it to learn the logic, not to publish.' };
  /* 13 Oct 2026 (fixer): nitrogen bridge to the mineral nutrition sessions. Both papers retrieved from PubMed on 13 Oct 2026, abstract level
     (PMID 28311896, Evans 1989 Oecologia; PMID 30357381, Evans and Clarke 2019 J Exp Bot). Papers credited only. */
  EV['str.nitrogen'] = { claim: 'The photosynthetic capacity of leaves is related to their nitrogen content mainly because the proteins of the Calvin cycle and the thylakoids hold the majority of leaf nitrogen. Within species, nitrogen rises linearly with both Rubisco (RuBP carboxylase) and chlorophyll. To a first approximation thylakoid nitrogen is proportional to chlorophyll, about 50 mol thylakoid N per mol chlorophyll.', cite: 'Evans JR (1989) Photosynthesis and nitrogen relationships in leaves of C3 plants. Oecologia 78:9 to 19.', doi: '10.1007/BF00377192', measured: 'review of C3 species, leaf N, Rubisco and chlorophyll per leaf area', value: 'about 50 mol thylakoid N per mol chlorophyll', badge: 'VERIFIED', note: 'Abstract level (PubMed PMID 28311896). Shade species put relatively more nitrogen into the thylakoids, at a lower photosynthetic capacity per unit nitrogen.' };
  EV['str.nitrogen2'] = { claim: 'The many proteins of photosynthesis together account for the majority of the nitrogen in leaves, and the nitrogen removed with a harvest must be replaced by fertilizer or by biological nitrogen fixation.', cite: 'Evans JR, Clarke VC (2019) The nitrogen cost of photosynthesis. J Exp Bot 70:7 to 15.', doi: '10.1093/jxb/ery366', measured: 'review; generalised nitrogen budget of a C3 leaf cell', value: 'qualitative', badge: 'VERIFIED', note: 'Abstract level (PubMed PMID 30357381).' };
  EV['str.sugarN'] = { claim: 'Sugar is not a nutrient for the plant: a sugar such as glucose, C6H12O6, holds only carbon, hydrogen and oxygen, all of which the leaf takes from CO2 and water. Each chlorophyll a molecule, C55H72MgN4O5, carries four nitrogen atoms. Mineral nutrients are the elements a plant must take up from the soil (nitrogen among them).', cite: 'Chemical formulas; definition of a mineral nutrient.', measured: 'none', value: '0 N per glucose; 4 N per chlorophyll a', badge: 'DERIVED', note: 'Essentiality and uptake are the subject of mineral nutrition.' };
  LP.sources['10.1007/BF00377192'] = LP.sources['10.1007/BF00377192'] || 'Evans JR (1989) Oecologia 78:9 to 19';
  LP.sources['10.1093/jxb/ery366'] = LP.sources['10.1093/jxb/ery366'] || 'Evans JR, Clarke VC (2019) J Exp Bot 70:7 to 15';
  LP.sources['10.1104/pp.008250'] = 'Bernacchi CJ, Portis AR, Nakano H, von Caemmerer S, Long SP (2002) Plant Physiol 130:1992 to 1998';
  LP.sources['10.1126/science.aat9077'] = LP.sources['10.1126/science.aat9077'] || 'South PF, Cavanagh AP, Liu HW, Ort DR (2019) Science 363:eaat9077';
  LP.sources['10.1093/jxb/erp096'] = LP.sources['10.1093/jxb/erp096'] || 'Leakey ADB, Ainsworth EA, Bernacchi CJ, Rogers A, Long SP, Ort DR (2009) J Exp Bot 60:2859 to 2876';

  LP.howto['str.aci'] = {
    title: 'an A versus Ci curve with a gas exchange system', what: 'Vcmax, J and Rd from leaf CO2 responses (LI-6800 or similar)',
    steps: [
      'Clamp a mature, well lit leaf in the chamber at saturating light (for a sun leaf 1,500 to 1,800 µmol m⁻² s⁻¹), leaf temperature set (say 25 °C), VPD about 1 to 1.5 kPa. Wait for steady A and g<sub>s</sub>.',
      'Step the reference CO₂ down then up: for example 400, 300, 200, 100, 50, 400, 600, 800, 1,000, 1,200, 1,500, 2,000 µmol mol⁻¹, logging A and C<sub>i</sub> after 2 to 3 min at each step (or use a fast ramp, then correct for chamber dynamics).',
      'Plot A against C<sub>i</sub>. The low C<sub>i</sub> part is Rubisco limited (A<sub>c</sub>); the bend and the shoulder are RuBP regeneration limited (A<sub>j</sub>); a flat top at high C<sub>i</sub> can be triose phosphate use.',
      'Fit the FvCB model, assigning each point to a limitation, with Rubisco constants at the measured leaf temperature. Report Vcmax, J and Rd with the temperature and constants you used. Add mesophyll conductance if you want V<sub>cmax</sub> on a C<sub>c</sub> basis.',
      'Repeat at 2 % O₂ on a few leaves: the rise in A shows how much photorespiration was costing.'
    ],
    watch: 'Leaks around the gasket at high and low CO₂, stomata closing during long curves, and at least five points needed per limitation. Fitted Vcmax depends on the Kc, Ko and Γ* you assume.',
    dois: ['10.1111/j.1365-3040.2007.01710.x', '10.1007/BF00386231']
  };

  /* ================================================================== the cycle theatre */
  var K = 1 / 4;              /* drawn events per s per µmol m−2 s−1 */
  var ST = { tok: [], fly: [], fx: [], amb: [], acc: {}, clock: 0, laneT: {}, lay: null, rot: 0, g3pCount: 0, pgCount: 0, glyCount: 0, made: 0, prBox: 0, nid: 0, named: {}, drawn: [] };
  var STN = { rub: -Math.PI / 2, red: Math.PI / 6, reg: 5 * Math.PI / 6 };

  function layout(w, h) {
    var mob = w < 560;
    var L = { w: w, h: h, mob: mob };
    L.cx = w * (mob ? 0.56 : 0.5); L.cy = h * (mob ? 0.42 : 0.45);
    L.R = Math.min(w * (mob ? 0.29 : 0.24), h * (mob ? 0.3 : 0.33));
    L.strip = h * (mob ? 0.88 : 0.86);
    L.box = mob ? { x: w * 0.04, y: h * 0.69, w: w * 0.3, h: h * 0.12 } : { x: w * 0.07, y: h * 0.19, w: w * 0.21, h: h * 0.17 };
    L.perox = { x: L.box.x + L.box.w * 0.27, y: L.box.y + L.box.h * 0.55 };
    L.mito = { x: L.box.x + L.box.w * 0.73, y: L.box.y + L.box.h * 0.55 };
    L.co2In = { x: w * (mob ? 0.30 : 0.33), y: -10 };
    L.o2In = { x: w * (mob ? 0.80 : 0.67), y: -10 };
    L.out = { x: w * (mob ? 0.97 : 0.93), y: h * (mob ? 0.70 : 0.66) };
    /* supply ports on the thylakoid strip: an ATP synthase head and an FNR beside it, so ATP and NADPH
       visibly come from the membrane (Plate III) and travel fixed lanes to the station that spends them */
    var rdp = { x: L.cx + Math.cos(STN.red) * L.R, y: L.cy + Math.sin(STN.red) * L.R }, rgp = { x: L.cx + Math.cos(STN.reg) * L.R, y: L.cy + Math.sin(STN.reg) * L.R };
    L.syn = { x: L.cx - L.R * 0.18, y: L.strip - 2 };
    L.fnr = { x: L.cx + L.R * (mob ? 0.42 : 0.38), y: L.strip - 2 };
    /* fix round (Q S1): at desktop the photorespiration supply ports sit further left, so their lanes run clear of
       the '3 Regeneration' tag */
    L.prSyn = { x: L.box.x + L.box.w * (mob ? 0.3 : 0.16), y: L.strip - 2 };
    L.prFnr = { x: L.box.x + L.box.w * (mob ? 0.7 : 0.44), y: L.strip - 2 };
    L.ytop = Math.max(40, L.cy - L.R - Math.max(16, L.R * 0.2) - 18);
    L.lanes = {
      atpRed: [L.syn.x + 6, L.syn.y - 14, rdp.x - 18, L.strip - 30, rdp.x - 6, rdp.y + 14],
      atpReg: [L.syn.x - 6, L.syn.y - 14, rgp.x + 22, L.strip - 30, rgp.x + 6, rgp.y + 14],
      nadRed: [L.fnr.x, L.fnr.y - 12, rdp.x + 14, L.strip - 40, rdp.x + 6, rdp.y + 16],
      atpPR: [L.prSyn.x, L.prSyn.y - 14, L.prSyn.x - 4, (L.strip + L.box.y + L.box.h) / 2, L.box.x + L.box.w * 0.4, L.box.y + L.box.h * 1.05],
      nadPR: [L.prFnr.x, L.prFnr.y - 12, L.prFnr.x + 4, (L.strip + L.box.y + L.box.h) / 2, L.box.x + L.box.w * 0.6, L.box.y + L.box.h * 1.05]
    };
    return L;
  }
  function onRing(L, a, dr) { var r = L.R + (dr || 0); return { x: L.cx + Math.cos(a) * r, y: L.cy + Math.sin(a) * r }; }

  /* tokens on the wheel: kind 'rubp' | 'pga' | 'g3p'; travel from angle a0 to a1 clockwise over dur seconds */
  function token(kind, a0, a1, dur, delay, dr) { ST.tok.push({ id: ++ST.nid, k: kind, a0: a0, a1: a1 < a0 ? a1 + TAU : a1, p: -(delay || 0) / dur, dur: dur, dr: dr || 0 }); }
  /* free flyers: from (x0,y0) to (x1,y1) */
  function fly(kind, x0, y0, x1, y1, dur, delay, then) { ST.fly.push({ id: ++ST.nid, k: kind, x0: x0, y0: y0, x1: x1, y1: y1, p: -(delay || 0) / dur, dur: dur, then: then || null, ang: rnd() * TAU, wob: rnd() * TAU }); }
  /* along a lane (quadratic Bézier from a port to a station), with a small sideways jitter */
  /* arrivals spread over the station face (no stacking: designer panel 5) */
  /* fix round (Q S1): carriers on one lane leave the port at least LANEGAP s apart, so they queue along the lane
     instead of piling on each other at the station (a backlog of more than 1.2 s is allowed to overlap rather than
     drift away from the model rate); the station end is spread along the station face */
  var LANEGAP = 0.11;
  function lane(kind, ln, dur, delay, spread) {
    var key = kind + ':' + ln[0].toFixed(0), now = ST.clock || 0, go = now + (delay || 0), last = ST.laneT[key];
    if (last != null && go < last + LANEGAP && last + LANEGAP - go < 1.2) go = last + LANEGAP;
    ST.laneT[key] = Math.max(last == null ? -1e9 : last, go);
    var j = (rnd() - 0.5) * (spread || 6), sl = ((ST.nid % 5) - 2) / 2;
    ST.fly.push({ id: ++ST.nid, k: kind, x0: ln[0] + j, y0: ln[1], cx: ln[2] + j, cy: ln[3], x1: ln[4] + sl * 13 + (rnd() - 0.5) * 6, y1: ln[5] + sl * 5 + (rnd() - 0.5) * 4, p: -(go - now) / dur, dur: dur, then: null, ang: rnd() * TAU, wob: 0, lane: true });
  }

  function carboxylate() {
    var L = ST.lay, rp = onRing(L, STN.rub), rd = onRing(L, STN.red), rg = onRing(L, STN.reg);
    /* CO2 flies in from the air spaces to Rubisco */
    fly('co2', L.co2In.x + (rnd() - 0.5) * 40, L.co2In.y, rp.x - 8, rp.y + 4, 0.9, 0, function () {
      /* two 3 PGA travel to the reduction station */
      token('pga', STN.rub + 0.05, STN.red, 1.1, 0, -4); token('pga', STN.rub + 0.05, STN.red, 1.1, 0.18, 4);
      ST.fx.push({ k: 'ring', x: rp.x, y: rp.y, t: 0, dur: 0.6, col: 'co2' });
    });
    /* each 3 PGA: 1 ATP + 1 NADPH at reduction, timed to arrive with the 3 PGA */
    for (var i = 0; i < 2; i++) {
      lane('atp', L.lanes.atpRed, 1.1, 0.75 + i * 0.25);
      lane('nadph', L.lanes.nadRed, 1.15, 0.8 + i * 0.25);
    }
    /* regeneration: 1 ATP per CO2 fixed (3 per 3 RuBP) */
    lane('atp', L.lanes.atpReg, 1.1, 1.9);
  }
  function oxygenate() {
    var L = ST.lay, rp = onRing(L, STN.rub);
    fly('o2', L.o2In.x + (rnd() - 0.5) * 40, L.o2In.y, rp.x + 10, rp.y + 4, 0.9, 0, function () {
      token('pga', STN.rub + 0.05, STN.red, 1.1, 0, 0);
      ST.fx.push({ k: 'ring', x: rp.x, y: rp.y, t: 0, dur: 0.6, col: 'o2' });
      /* 2 phosphoglycolate leaves the chloroplast cycle; as glycolate it goes to the peroxisome, as glycine to the
         mitochondrion; two glycines make one serine + CO2 + NH3; serine returns via the peroxisome as glycerate, which
         re-enters the cycle as 3 PGA. One CO2 puff per two oxygenations, at the model rate. */
      fly('pg', rp.x - 10, rp.y + 2, L.box.x + L.box.w * 1.02, L.perox.y - 4, 1.0, 0, function () {
        fly('glyc', L.box.x + L.box.w * 1.02, L.perox.y - 4, L.perox.x + 4, L.perox.y, 0.6, 0, function () {
          ST.fx.push({ k: 'org', x: L.perox.x, y: L.perox.y, t: 0, dur: 0.5 });
          fly('gly', L.perox.x + 6, L.perox.y + 2, L.mito.x - 4, L.mito.y, 0.7, 0.15, function () {
            ST.fx.push({ k: 'org', x: L.mito.x, y: L.mito.y, t: 0, dur: 0.5 });
            ST.glyCount++;
            if (ST.glyCount >= 2) {
              ST.glyCount -= 2; ST.lost = (ST.lost || 0) + 1;
              fly('co2out', L.mito.x, L.mito.y - 6, L.mito.x + (rnd() - 0.5) * 30, -18, 2.2);
              if (ui.tier() > 1) fly('nh3', L.mito.x + 6, L.mito.y + 4, L.box.x + L.box.w * 1.0, L.box.y + L.box.h * 1.1, 1.2);
              fly('ser', L.mito.x - 6, L.mito.y + 4, L.perox.x + 6, L.perox.y + 4, 0.7, 0.2, function () {
                var back = onRing(L, STN.rub + 0.6);
                fly('pga', L.perox.x, L.perox.y - 6, back.x, back.y, 1.3, 0.1, function () { token('pga', STN.rub + 0.6, STN.red, 0.8, 0, 0); });
              });
            }
          });
        });
      });
    });
    /* photorespiration bill: 3.5 ATP and 2 NADPH per oxygenation; drawn as 1 ATP + 1 NADPH per 0.5 oxygenation is too busy:
       draw the 3.5 ATP and 2 NADPH on the same scale via accumulators */
    ST.acc.prAtp = (ST.acc.prAtp || 0) + 3.5; ST.acc.prNad = (ST.acc.prNad || 0) + 2;
    var di = 0;
    while (ST.acc.prAtp >= 1) { ST.acc.prAtp -= 1; lane('atp', L.lanes.atpPR, L.mob ? 0.8 : 1.4, 0.6 + 0.3 * di++, 18); }
    di = 0;
    while (ST.acc.prNad >= 1) { ST.acc.prNad -= 1; lane('nadph', L.lanes.nadPR, L.mob ? 0.8 : 1.4, 0.7 + 0.35 * di++, 18); }
  }

  function step(dt) {
    var L = ST.lay; if (!L) return;
    ST.clock += dt;
    var r = R(), vc = Math.max(0, r.vc || 0), vo = Math.max(0, r.vo || 0);
    ST.rot += dt * vc * 0.012;
    ST.acc.c = (ST.acc.c || 0) + vc * K * dt;
    var n = 0; while (ST.acc.c >= 1 && n < 4) { ST.acc.c -= 1; n++; carboxylate(); }
    if (ST.acc.c > 3) ST.acc.c = 3;
    ST.acc.o = (ST.acc.o || 0) + vo * K * dt;
    n = 0; while (ST.acc.o >= 1 && n < 3) { ST.acc.o -= 1; n++; oxygenate(); }
    if (ST.acc.o > 3) ST.acc.o = 3;
    /* the air spaces: CO2 above Rubisco drawn at a density ∝ Ci, O2 ∝ % O2 (designer panel 5: supply you can see) */
    var nC = Math.round(clamp((r.Ci || 0) / 30, 0, 40)), nO = Math.round(clamp((r.O2 == null ? 21 : r.O2) * 0.7, 0, 18));
    var cnt = { co2: 0, o2: 0 }; ST.amb.forEach(function (q) { if (!q.dying) cnt[q.k]++; });
    function addAmb(k) { var cx0 = k === 'co2' ? L.co2In.x : L.o2In.x, wd = L.w * (L.mob ? 0.13 : 0.11); ST.amb.push({ k: k, x: cx0 + (rnd() - 0.5) * 2 * wd, y: rnd() * L.ytop, cx: cx0, wd: wd, vx: (rnd() - 0.5) * 8, vy: 4 + rnd() * 8, a: 0, ang: rnd() * TAU, z: rnd() }); }
    while (cnt.co2 < nC) { addAmb('co2'); cnt.co2++; } while (cnt.o2 < nO) { addAmb('o2'); cnt.o2++; }
    var over = { co2: cnt.co2 - nC, o2: cnt.o2 - nO };
    ST.amb.forEach(function (q) { if (!q.dying && over[q.k] > 0) { q.dying = true; over[q.k]--; } });
    ST.amb = ST.amb.filter(function (q) {
      q.a = q.dying ? q.a - dt * 1.2 : Math.min(1, q.a + dt);
      q.x += q.vx * dt; q.y += q.vy * dt; q.ang += dt * 0.6;
      if (q.y > L.ytop) { q.y = 0; q.x = q.cx + (rnd() - 0.5) * 2 * q.wd; }
      if (Math.abs(q.x - q.cx) > q.wd) q.vx *= -1;
      return q.a > 0;
    });
    /* tokens around the wheel */
    var born = [];
    ST.tok = ST.tok.filter(function (q) {
      q.p += dt / q.dur;
      if (q.p < 1) return true;
      if (q.k === 'pga') {   /* reduced to G3P: on to regeneration; 1 in 6 G3P leaves as product */
        ST.g3pCount++;
        if (ST.g3pCount >= 6) { ST.g3pCount -= 6; var pr = onRing(L, STN.red + 0.9); born.push(['exit', pr]); }
        else born.push(['g3p']);
      } else if (q.k === 'g3p') { born.push(['rubp']); }
      return false;
    });
    born.forEach(function (b) {
      if (b[0] === 'g3p') token('g3p', STN.red + 0.05, STN.reg, 1.1, 0, (rnd() - 0.5) * 6);
      else if (b[0] === 'rubp') { if (rnd() < 0.6) token('rubp', STN.reg + 0.05, STN.rub + TAU, 1.3, 0, (rnd() - 0.5) * 5); }
      else if (b[0] === 'exit') { ST.made++; fly('g3pout', b[1].x, b[1].y, L.out.x, L.out.y, 1.6, 0); }
    });
    /* flyers */
    /* callbacks run AFTER the filter: a flyer spawned inside the filter would be dropped with the old array (this
       bug hid the whole photorespiration route before r5) */
    var thens = [];
    ST.fly = ST.fly.filter(function (f) {
      f.p += dt / f.dur; f.ang += dt * 1.4;
      if (f.p < 1) return true;
      if (f.then) thens.push(f.then);
      if (f.k === 'atp' || f.k === 'nadph') {
        ST.fx.push({ k: 'spent', x: f.x1, y: f.y1, t: 0, dur: 0.5, col: f.k });
        /* slow and named round (13 Oct): the spent carrier goes back to the membrane as ADP (+ Pi) or NADP+, on the same
           lane in reverse, one for one, so the recycling is visible; faint, so it never competes with the supply */
        if (f.lane && !(L.mob && ui.tier() < 2)) ST.fly.push({ id: ++ST.nid, k: f.k === 'atp' ? 'adp' : 'nadp', x0: f.x1, y0: f.y1, cx: f.cx, cy: f.cy, x1: f.x0, y1: f.y0, p: 0, dur: 1.5, then: null, ang: f.ang, wob: 0, lane: true, back: true });
      }
      return false;
    });
    thens.forEach(function (fn) { fn(); });
    ST.fx = ST.fx.filter(function (e) { e.t += dt; return e.t < e.dur; });
    if (ST.tok.length > 140) ST.tok.splice(0, ST.tok.length - 140);
    if (ST.fly.length > 300) ST.fly.splice(0, ST.fly.length - 300);
  }
  function prewarm(sec) { for (var i = 0, n = Math.round(sec / 0.05); i < n; i++) step(0.05); }

  function chain(c, P, x, y, nC, ang, r, phos, a) {
    /* a carbon skeleton: nC grey carbons in a short zig zag, phosphates as small violet beads with P */
    var m = M(), dx = Math.cos(ang) * r * 1.5, dy = Math.sin(ang) * r * 1.5, nx = -Math.sin(ang) * r * 0.5, ny = Math.cos(ang) * r * 0.5;
    var x0 = x - dx * (nC - 1) / 2, y0 = y - dy * (nC - 1) / 2;
    c.globalAlpha = a == null ? 1 : a; c.strokeStyle = P.dark ? 'rgba(220,220,220,.55)' : 'rgba(60,60,60,.55)'; c.lineWidth = 1.4;
    c.beginPath(); for (var i = 0; i < nC; i++) { var px = x0 + dx * i + (i % 2 ? nx : -nx), py = y0 + dy * i + (i % 2 ? ny : -ny); if (i) c.lineTo(px, py); else c.moveTo(px, py); } c.stroke(); c.globalAlpha = 1;
    var ends = [];
    for (var j = 0; j < nC; j++) {
      var qx = x0 + dx * j + (j % 2 ? nx : -nx), qy = y0 + dy * j + (j % 2 ? ny : -ny);
      m.ball(c, qx, qy, r, P.C, m.shade(P.C, 0.6), m.shade(P.C, -0.5), a);
      if (j === 0 || j === nC - 1) ends.push([qx, qy, j === 0 ? -1 : 1]);
    }
    for (var k = 0; k < phos && k < ends.length; k++) {
      var e = ends[phos === 1 ? ends.length - 1 : k];
      var px2 = e[0] + Math.cos(ang) * r * 1.6 * e[2], py2 = e[1] + Math.sin(ang) * r * 1.6 * e[2];
      m.ball(c, px2, py2, r * 0.9, P.phos, m.shade(P.phos, 0.6), m.shade(P.phos, -0.45), a);
      if (r >= 3.5) { c.globalAlpha = a == null ? 1 : a; c.fillStyle = '#fff'; c.font = '700 ' + Math.round(r * 1.1) + 'px system-ui,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('P', px2, py2 + 0.5); c.globalAlpha = 1; }
    }
  }
  function hexSugar(c, P, x, y, r, a) {
    c.globalAlpha = a == null ? 1 : a;
    if (P.glow) { c.save(); c.shadowColor = P.sugar; c.shadowBlur = P.glow; }
    c.beginPath(); for (var i = 0; i < 6; i++) { var t = i * TAU / 6 + Math.PI / 6; c[i ? 'lineTo' : 'moveTo'](x + Math.cos(t) * r, y + Math.sin(t) * r); } c.closePath();
    c.fillStyle = P.sugar; c.fill(); if (P.glow) c.restore();
    c.strokeStyle = M().shade(P.sugar, -0.4); c.lineWidth = 1; c.stroke(); c.globalAlpha = 1;
  }

  var cacheCv = null, cacheKey = '';
  function staticLayer(L, P, dpr, tier) {
    var key = [L.w, L.h, P.dark, dpr, tier].join('|');
    if (cacheCv && cacheKey === key) return cacheCv;
    var cv = cacheCv || document.createElement('canvas'); cv.width = Math.round(L.w * dpr); cv.height = Math.round(L.h * dpr);
    var c = cv.getContext('2d'), m = M(); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, L.w, L.h);
    var g = c.createLinearGradient(0, 0, 0, L.h); g.addColorStop(0, P.stroma2); g.addColorStop(1, P.stroma);
    c.fillStyle = g; c.fillRect(0, 0, L.w, L.h);
    /* thylakoid strip at the bottom: a granum seen side on (stacked membranes) */
    var y0 = L.strip;
    m.bilayer(c, P, 0, L.w, y0, y0 + Math.min(26, L.h * 0.055), []);
    c.fillStyle = P.dark ? 'rgba(90,150,110,.18)' : 'rgba(80,140,90,.12)'; c.fillRect(0, y0 + Math.min(26, L.h * 0.055), L.w, L.h - y0);
    /* the wheel track */
    c.strokeStyle = P.dark ? 'rgba(236,230,218,.16)' : 'rgba(42,35,28,.14)'; c.lineWidth = Math.max(16, L.R * 0.2); c.beginPath(); c.arc(L.cx, L.cy, L.R, 0, TAU); c.stroke();
    /* stage arcs */
    var arcs = [[STN.rub, STN.red, P.arcC], [STN.red, STN.reg, P.arcR], [STN.reg, STN.rub + TAU, P.arcG]];
    arcs.forEach(function (a) { c.strokeStyle = a[2]; c.lineWidth = 3; c.beginPath(); c.arc(L.cx, L.cy, L.R + Math.max(16, L.R * 0.2) / 2 + 3, a[0] + 0.18, a[1] - 0.18); c.stroke(); });
    /* stations */
    var rp = onRing(L, STN.rub), rd = onRing(L, STN.red), rg = onRing(L, STN.reg), s = Math.max(30, L.R * 0.36);
    m.protein(c, P, rp.x, rp.y - s * 0.55, rp.y + s * 0.55, s * 1.25, P.rub, { lobes: 4 });
    m.protein(c, P, rd.x, rd.y - s * 0.4, rd.y + s * 0.4, s * 0.85, P.redE, { lobes: 2 });
    m.protein(c, P, rg.x, rg.y - s * 0.4, rg.y + s * 0.4, s * 0.85, P.regE, { lobes: 3 });
    /* lanes (faint guides) and the supply ports on the membrane */
    c.setLineDash([2, 5]); c.lineWidth = 1.4;
    Object.keys(L.lanes).forEach(function (k) {
      var ln = L.lanes[k]; c.strokeStyle = /atp/.test(k) ? (P.dark ? 'rgba(255,173,58,.32)' : 'rgba(232,137,26,.35)') : (P.dark ? 'rgba(95,211,199,.32)' : 'rgba(31,158,147,.35)');
      c.beginPath(); c.moveTo(ln[0], ln[1]); c.quadraticCurveTo(ln[2], ln[3], ln[4], ln[5]); c.stroke();
    });
    c.setLineDash([]);
    [[L.syn, 'syn'], [L.prSyn, 'syn'], [L.fnr, 'fnr'], [L.prFnr, 'fnr']].forEach(function (q) {
      var x = q[0].x, y = q[0].y, rr = L.mob ? 6.5 : 8;
      if (q[1] === 'syn') {
        c.fillStyle = P.dark ? '#3d5c8f' : '#7f9cc9'; m.rrect(c, x - 2.5, y - rr * 1.6, 5, rr * 1.6, 2); c.fill();
        for (var k = 0; k < 6; k++) { var a = k * TAU / 6, col = k % 2 ? P.synA : P.synB; m.ball(c, x + Math.cos(a) * rr * 0.62, y - rr * 2.1 + Math.sin(a) * rr * 0.42, rr * 0.45, col, m.shade(col, 0.6), m.shade(col, -0.4)); }
      } else {
        m.protein(c, P, x, y - rr * 2.4, y + 2, rr * 2.2, P.fnr, { lobes: 2 });
      }
    });
    /* photorespiration box: peroxisome and mitochondrion drawn as two rounded organelles */
    var B = L.box;
    c.fillStyle = P.dark ? 'rgba(200,120,80,.16)' : 'rgba(210,120,60,.10)'; c.strokeStyle = P.dark ? 'rgba(240,160,110,.5)' : 'rgba(170,90,40,.45)'; c.lineWidth = 1.2; c.setLineDash([4, 3]);
    m.rrect(c, B.x - B.w * 0.08, B.y - B.h * 0.1, B.w * 1.16, B.h * 1.2, 12); c.fill(); c.stroke(); c.setLineDash([]);
    m.ball(c, L.perox.x, L.perox.y, B.h * 0.3, P.perox, m.shade(P.perox, 0.5), m.shade(P.perox, -0.4), 0.75);
    m.ball(c, L.mito.x, L.mito.y, B.h * 0.34, P.mito, m.shade(P.mito, 0.5), m.shade(P.mito, -0.4), 0.75);
    /* the route: chloroplast → peroxisome → mitochondrion and back (faint) */
    c.strokeStyle = P.dark ? 'rgba(255,190,140,.35)' : 'rgba(150,80,40,.35)'; c.setLineDash([2, 4]); c.lineWidth = 1.3;
    c.beginPath(); c.moveTo(B.x + B.w * 1.02, L.perox.y - 4); c.lineTo(L.perox.x, L.perox.y); c.lineTo(L.mito.x, L.mito.y); c.stroke(); c.setLineDash([]);
    cacheCv = cv; cacheKey = key;
    return cv;
  }

  function draw(c, w, h, t, dt, info) {
    if (!ST.lay || ST.lay.w !== w || ST.lay.h !== h) { ST.lay = layout(w, h); ST.tok = []; ST.fly = []; ST.fx = []; prewarm(5); }
    if (dt > 0) step(dt);
    var L = ST.lay, m = M(), r = R(), tier = ui.tier(), mob = L.mob;

    var P = Object.assign({}, m.palette(info.dark), info.dark ?
      { phos: '#b88cf0', sugar: '#5ccf6e', rub: '#4fae6a', redE: '#5d8fd0', regE: '#8a7ad8', arcC: '#5ccf6e', arcR: '#68b8ff', arcG: '#b39cf0', perox: '#d08a4a', mito: '#c86a6a' } :
      { phos: '#8a5cc4', sugar: '#3f9a4a', rub: '#3d8f5a', redE: '#4a7cc4', regE: '#7460c0', arcC: '#3f9a4a', arcR: '#2f7fd0', arcG: '#7460c0', perox: '#c97a36', mito: '#b5523a' });
    c.drawImage(staticLayer(L, P, info.dpr || 1, tier), 0, 0, w, h);
    ST.amb.forEach(function (q) { var sc = 0.6 + 0.4 * q.z, al = q.a * (0.3 + 0.4 * q.z); if (q.k === 'co2') m.co2(c, P, q.x, q.y, (mob ? 3.2 : 3.8) * sc, q.ang, al); else m.o2(c, P, q.x, q.y, (mob ? 3.2 : 3.6) * sc, q.ang, al); });
    /* turning dashes on the wheel at a speed ∝ vc */
    c.save(); c.translate(L.cx, L.cy); c.rotate(ST.rot);
    c.strokeStyle = P.dark ? 'rgba(236,230,218,.22)' : 'rgba(42,35,28,.18)'; c.lineWidth = 2; c.setLineDash([3, 11]);
    c.beginPath(); c.arc(0, 0, L.R, 0, TAU); c.stroke(); c.setLineDash([]); c.restore();
    /* slow and named (13 Oct): molecules 15 % larger; every drawn molecule that may carry a name is recorded in ST.drawn */
    var cr = mob ? 3.45 : 4.5, DR = ST.drawn = [];
    /* tokens */
    ST.tok.forEach(function (q) {
      if (q.p < 0) return;
      var a = lerp(q.a0, q.a1, ease(clamp(q.p, 0, 1))), pt = onRing(L, a, q.dr), tang = a + Math.PI / 2;
      if (q.k === 'rubp') chain(c, P, pt.x, pt.y, 5, tang, cr * 0.9, 2, 1);
      else if (q.k === 'pga') chain(c, P, pt.x, pt.y, 3, tang, cr, 1, 1);
      else chain(c, P, pt.x, pt.y, 3, tang, cr, 1, 1);
      DR.push({ id: q.id, k: q.k, x: pt.x, y: pt.y, r: cr * (q.k === 'rubp' ? 3.4 : 2.6), p: q.p, a: 1 });
    });
    /* flyers */
    ST.fly.forEach(function (f) {
      if (f.p < 0) return;
      var e = ease(clamp(f.p, 0, 1)), x, y;
      if (f.lane) { e = clamp(f.p, 0, 1); var u = 1 - e; x = u * u * f.x0 + 2 * u * e * f.cx + e * e * f.x1; y = u * u * f.y0 + 2 * u * e * f.cy + e * e * f.y1; }
      else { x = lerp(f.x0, f.x1, e) + Math.sin(f.wob + f.p * 6) * 3; y = lerp(f.y0, f.y1, e); }
      var fade = f.lane ? (f.p > 0.7 ? 1 - (f.p - 0.7) / 0.3 * 0.85 : 1) : (f.p > 0.85 ? 1 - (f.p - 0.85) / 0.15 * 0.5 : 1);
      if (f.back) fade = 0.5 * (f.p < 0.1 ? f.p / 0.1 : (f.p > 0.8 ? (1 - f.p) / 0.2 : 1));
      var rr = 0;
      if (f.k === 'co2') { rr = mob ? 4.1 : 5.1; m.co2(c, P, x, y, rr, f.ang, fade); rr *= 2.4; }
      else if (f.k === 'co2out') {
        /* the lost CO2: larger, with a soft halo, leaving the leaf */
        c.save(); c.globalAlpha = 0.25 * (1 - f.p); c.fillStyle = P.dark ? '#ff8a6a' : '#e0705a'; c.beginPath(); c.arc(x, y, (mob ? 12 : 16), 0, TAU); c.fill(); c.restore();
        m.co2(c, P, x, y, mob ? 5 : 6.2, f.ang, 1 - f.p * 0.5);
        if (f.p < 0.55 && !mob) m.tag(c, P, x + 14, y, 'CO₂ lost', { size: 10.5, align: 'left', alpha: 0.9 * (1 - f.p), ink: P.block });
      }
      else if (f.k === 'glyc' || f.k === 'gly') chain(c, P, x, y, 2, f.ang * 0.2, cr, f.k === 'glyc' ? 0 : 0, fade);
      else if (f.k === 'ser') chain(c, P, x, y, 3, f.ang * 0.2, cr * 0.9, 0, fade);
      else if (f.k === 'nh3') { m.ball(c, x, y, mob ? 4.1 : 5, '#4a74c8', '#cfe0ff', '#1d3a78', 1 - f.p * 0.7); [0, 2.1, 4.2].forEach(function (aa) { m.ball(c, x + Math.cos(aa + f.ang) * 5.6, y + Math.sin(aa + f.ang) * 5.6, 2.4, '#ffffff', '#ffffff', '#c9c2b6', 1 - f.p * 0.7); }); }
      else if (f.k === 'o2') { rr = mob ? 4.1 : 4.8; m.o2(c, P, x, y, rr, f.ang, fade); rr *= 1.9; }
      else if (f.k === 'atp') { rr = mob ? 6.9 : 8.6; m.atp(c, P, x, y, rr, f.ang, fade * 0.95); }
      else if (f.k === 'adp') { rr = mob ? 5.2 : 6.4; m.atp(c, P, x, y, rr, f.ang, fade); }
      /* fix round (Q S1): NADPH and NADP+ are molecules (the thylakoid glyph: two linked rings, NADPH with its extra
         H), named under the molecule by drawNames like every other carrier (at most 3 NADPH names), no longer pills
         that each carried a name */
      else if (f.k === 'nadph') { rr = mob ? 5.4 : 6.6; if (m.nadph) m.nadph(c, P, x, y, rr, fade * 0.95); else m.pill(c, P, x, y, '', P.nadph, fade * 0.95, mob ? 6 : 7); rr *= 1.0; }
      else if (f.k === 'nadp') { rr = mob ? 4.6 : 5.6; if (m.nadph) m.nadph(c, P, x, y, rr, fade, true); else m.pill(c, P, x, y, '', P.nadph, fade * 0.6, mob ? 5.5 : 6.5); }
      else if (f.k === 'pg') chain(c, P, x, y, 2, f.ang * 0.2, cr, 1, fade);
      else if (f.k === 'pga') chain(c, P, x, y, 3, f.ang * 0.2, cr, 1, 1);
      else if (f.k === 'g3pout') { rr = (mob ? 8 : 10.4) * (0.8 + 0.2 * e); hexSugar(c, P, x, y, rr, 1 - Math.max(0, f.p - 0.8) * 2); }
      if (rr) DR.push({ id: f.id, k: f.k, x: x, y: y, r: rr, p: f.p, a: fade });
    });
    ST.fx.forEach(function (e) {
      var k = e.t / e.dur;
      if (e.k === 'ring') { c.strokeStyle = e.col === 'o2' ? (m.atomColor ? m.atomColor('o2', 'O', P.dark) : P.O) : P.e; c.globalAlpha = 1 - k; c.lineWidth = 2.2; c.beginPath(); c.arc(e.x, e.y, 6 + 18 * k, 0, TAU); c.stroke(); c.globalAlpha = 1; }
      else if (e.k === 'org') { c.strokeStyle = P.dark ? '#ffc08a' : '#b5523a'; c.globalAlpha = 0.8 * (1 - k); c.lineWidth = 2; c.beginPath(); c.arc(e.x, e.y, 8 + 10 * k, 0, TAU); c.stroke(); c.globalAlpha = 1; }
      else { c.fillStyle = e.col === 'atp' ? P.atp : P.nadph; c.globalAlpha = 0.5 * (1 - k); c.beginPath(); c.arc(e.x, e.y, 3 + 6 * k, 0, TAU); c.fill(); c.globalAlpha = 1; }
    });
    var block = labels(c, P, L, r, tier);
    drawNames(c, P, L, block);
  }
  /* slow and named (13 Oct): molecule names under the molecules, ANTI CLUTTER RULE of the Lead note.
     Products and carriers (CO2 and O2 on their way into Rubisco, G3P leaving) are all named while 6 or fewer are on
     screen; the busy carriers and ring packets (ATP, ADP, RuBP, 3 PGA, G3P on the ring) get at most 2 named members at
     1200 px and 1 on phones. The choice is stable: a named molecule keeps its name until it leaves. A name is drawn only
     where it overlaps no other name and no label tag (it waits hidden, still chosen, while it would). NADPH and NADP+
     are drawn as pills that carry their own name. */
  var NAMEQ = { atp: { t: 'ATP' }, nadph: { t: 'NADPH', q: 3, qm: 2 }, co2: { t: 'CO₂', all: 1 }, o2: { t: 'O₂', all: 1 }, g3pout: { t: 'G3P', all: 1 }, rubp: { t: 'RuBP' }, pga: { t: '3‑PGA' }, g3p: { t: 'G3P' }, adp: { t: 'ADP', q: 1 }, nadp: { t: 'NADP⁺', q: 1 } };
  var NPRIO = ['atp', 'nadph', 'co2', 'o2', 'g3pout', 'rubp', 'pga', 'g3p', 'adp', 'nadp'];
  function hit(a, b) { return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h; }
  function drawNames(c, P, L, block) {
    var m = M();
    if (!m.namesOn || !m.name || !m.namesOn()) { ST.named = {}; return; }
    var fs = L.mob ? 9.5 : 10.5, placed = (block || []).slice(), by = {};
    c.font = '700 ' + fs + 'px system-ui,-apple-system,Segoe UI,sans-serif';
    ST.drawn.forEach(function (d) { if (NAMEQ[d.k]) (by[d.k] = by[d.k] || []).push(d); });
    function box(d) { var w = c.measureText(NAMEQ[d.k].t).width + 8, h = fs + 5; return { x: d.x - w / 2 - 2, y: d.y + d.r + 1, w: w + 4, h: h + 4 }; }
    function ok(d, bx) { if (bx.x < 2 || bx.x + bx.w > L.w - 2 || bx.y + bx.h > L.h - 2 || d.a < 0.4) return false; for (var i = 0; i < placed.length; i++) if (hit(bx, placed[i])) return false; return true; }
    var next = {};
    NPRIO.forEach(function (k) {
      var list = by[k] || [], cfg = NAMEQ[k];
      var quota = cfg.q ? (L.mob && cfg.qm ? cfg.qm : cfg.q) : (cfg.all && list.length <= 6 ? 6 : (L.mob ? 1 : 2));
      var chosen = [], ids = ST.named[k] || [];
      ids.forEach(function (id) { for (var i = 0; i < list.length; i++) if (list[i].id === id && chosen.length < quota) { chosen.push(list[i]); break; } });
      /* new picks: the freshest molecules first, so a name rides along for most of the trip */
      list.slice().sort(function (a, b) { return a.p - b.p; }).forEach(function (d) {
        if (chosen.length >= quota || chosen.indexOf(d) >= 0 || d.p > 0.45) return;
        /* spread: a second name of the same kind goes to a molecule well away from the first */
        if (!cfg.all) for (var i = 0; i < chosen.length; i++) if (Math.hypot(chosen[i].x - d.x, chosen[i].y - d.y) < (L.mob ? 70 : 110)) return;
        if (ok(d, box(d))) chosen.push(d);
      });
      next[k] = chosen.map(function (d) { return d.id; });
      chosen.forEach(function (d) {
        var bx = box(d); if (!ok(d, bx)) return;
        placed.push(bx);
        m.name(c, P, d.x, d.y, d.r, cfg.t, { size: fs, alpha: Math.min(1, d.a * 1.2) });
      });
    });
    ST.named = next;
  }
  function labels(c, P, L, r, tier) {
    var m0 = M(), mob = L.mob, fs = mob ? 9.5 : 11, out = [];
    /* every label tag drawn here is returned, so the molecule names keep clear of it */
    var m = Object.assign({}, m0, { tag: function (cc, PP, x, y, tx, o) { var rr = m0.tag(cc, PP, x, y, tx, o); if (rr) out.push({ x: rr.x - 2, y: rr.y - 2, w: rr.w + 4, h: rr.h + 4 }); return rr; } });
    function T(x, y, s, o) { return m.tag(c, P, x, y, s, Object.assign({ size: fs, align: 'center' }, o || {})); }
    var rp = onRing(L, STN.rub), rd = onRing(L, STN.red), rg = onRing(L, STN.reg), s = Math.max(30, L.R * 0.36);
    T(rp.x, rp.y - s * 0.55 - 14, tier === 1 ? 'Rubisco grabs CO₂' : (mob ? '1 Carboxylation: Rubisco' : '1 Carboxylation: Rubisco'));
    T(mob ? L.w - 6 : rd.x + 40, rd.y + s * 0.4 + 2, tier === 1 ? 'Spend ATP, NADPH' : '2 Reduction', { align: mob ? 'right' : 'left' });
    T(mob ? 6 : rg.x - 10, rg.y + s * 0.4 + 15, tier === 1 ? 'Rebuild RuBP' : '3 Regeneration', { align: mob ? 'left' : 'right' });
    var lostTxt = r.vc > 0 ? (tier === 1 || mob ? 'Photorespiration: ' + Math.round(100 * r.photorespiration / r.vc) + ' of 100 CO₂ lost' : 'Photorespiration: fixed ' + num(r.vc, 1) + ', lost ' + num(r.photorespiration, 1)) : 'Photorespiration: stopped';
    T(mob ? 4 : L.box.x + L.box.w * 0.5, L.box.y - L.box.h * 0.1 - (mob ? 10 : 12), mob ? lostTxt.replace('Photorespiration: ', 'Photoresp.: ') : lostTxt, { weight: 700, align: mob ? 'left' : 'center', ink: r.vc > 0 && r.photorespiration / r.vc > 0.25 ? P.block : P.ink });
    if (!mob && tier > 1) {
      m.tag(c, P, L.perox.x, L.box.y + L.box.h * 0.08, 'peroxisome', { size: 9.5, align: 'center', alpha: 0.85 });
      m.tag(c, P, L.mito.x, L.box.y + L.box.h * 0.08, 'mitochondrion', { size: 9.5, align: 'center', alpha: 0.85 });
    }
    m.tag(c, P, L.w - 8, L.strip + (mob ? 22 : 24), tier === 1 ? 'Thylakoid: makes ATP and NADPH' : (mob ? 'Thylakoid: ATP, NADPH in' : 'Thylakoid (Plate III): ATP, NADPH in'), { size: fs, alpha: 0.95, align: 'right' });
    if (tier === 3 && !mob) { T(L.syn.x, L.syn.y + 20, 'ATP synthase', { size: fs - 1.5 }); T(L.fnr.x, L.fnr.y + 20, 'FNR', { size: fs - 1.5 }); }
    T(L.out.x, L.out.y + 22, mob ? 'G3P out' : 'G3P → sucrose, starch', { align: 'right' });
    if (!mob || tier > 1) {
      T(L.co2In.x, 14, mob ? 'CO₂ in' : 'CO₂ from the air spaces', { size: fs - 0.5 });
      T(L.o2In.x, 14, mob ? 'O₂' : 'O₂ (21 % of air)'.replace('21', String(Math.round(r.O2 || 21))), { size: fs - 0.5 });
    }
    if (tier > 1) {
      var mid = 'Ci ' + num(r.Ci, 0) + ' ppm · ' + num(r.T, 0) + ' °C';
      c.font = '600 ' + (mob ? 10 : 12) + 'px system-ui,sans-serif'; c.fillStyle = P.ink2; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(mob ? 'Calvin Benson' : 'Calvin Benson cycle', L.cx, L.cy - (mob ? 16 : 20));
      c.fillStyle = P.ink; c.font = '700 ' + (mob ? 11 : 13.5) + 'px system-ui,sans-serif';
      c.fillText((r.vc > 0 ? 'O₂ : CO₂ = ' + num(r.phi, 2) : 'stopped'), L.cx, L.cy + 2);
      c.font = (mob ? 9.5 : 11.5) + 'px system-ui,sans-serif'; c.fillStyle = P.ink2; c.fillText(mid, L.cx, L.cy + (mob ? 17 : 21));
      out.push({ x: L.cx - (mob ? 55 : 80), y: L.cy - (mob ? 26 : 32), w: mob ? 110 : 160, h: mob ? 54 : 66 });
    } else {
      c.font = '600 ' + (mob ? 11 : 13) + 'px system-ui,sans-serif'; c.fillStyle = P.ink; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('3 CO₂ in,', L.cx, L.cy - 9); c.fillText('1 sugar unit out', L.cx, L.cy + 9);
      out.push({ x: L.cx - 60, y: L.cy - 20, w: 120, h: 40 });
    }
    return out;
  }

  /* ================================================================== A versus Ci (SVG) */
  function aciSVG(res, boxW) {
    /* drawn at the size it is shown: a phone viewBox below 560 px so text never shrinks under about 11 px */
    boxW = boxW > 40 ? boxW : 800;
    var dark = ui.isDark(), tier = ui.tier(), mob = boxW < 560;
    var W = mob ? 420 : Math.max(640, Math.min(900, boxW)), H = mob ? 330 : 340, l = mob ? 44 : 56, rr = 18, t = 30, b = 44, f = mob ? 12.5 : 13;
    var xmax = 1500, ymax = 45;
    var xs = LP.range(0, 100, 21).concat(LP.range(110, xmax, 70));   /* every 5 µmol mol⁻¹ below 100: the initial slope is what researchers read */
    function near(arr, x) { var b = 0; arr.forEach(function (p, i) { if (Math.abs(p.x - x) < Math.abs(arr[b].x - x)) b = i; }); return b; }
    var pts = LP.aci(xs);
    var lo = tier === 3 ? LP.aci(xs, { O2: 2 }) : null;
    function X(v) { return l + (W - l - rr) * clamp(v, 0, xmax) / xmax; }
    function Y(v) { return t + (H - t - b) * (1 - clamp(v, -5, ymax) / ymax); }
    function path(arr, key) { return arr.map(function (p, i) { return (i ? 'L' : 'M') + X(p.x).toFixed(1) + ' ' + Y(p.r[key]).toFixed(1); }).join(''); }
    function tx(x, y, txt, o) { o = o || {}; return '<text x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '"' + (o.a ? ' text-anchor="' + o.a + '"' : '') + ' font-size="' + (o.s || f) + '"' + (o.w ? ' font-weight="' + o.w + '"' : '') + ' fill="' + (o.c || ink) + '" font-family="system-ui,sans-serif"' + (o.halo ? ' stroke="' + bg + '" stroke-width="4" paint-order="stroke" stroke-linejoin="round"' : '') + '>' + txt + '</text>'; }
    var ink = dark ? '#b3aca0' : '#5e5141', grid = dark ? 'rgba(236,230,218,.14)' : 'rgba(42,35,28,.13)', main = dark ? '#ece6da' : '#2a231c', bg = dark ? '#121a22' : '#fbf8f1';
    var cA = dark ? '#ff9a4d' : '#b8530f', cJ = dark ? '#68b8ff' : '#2f6fb8', cS = dark ? '#8fd19e' : '#2f7a3a';
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Net CO2 uptake A versus intercellular CO2 Ci: Rubisco limited and RuBP regeneration limited curves, the current operating point and the stomatal supply line" style="width:100%;height:auto;display:block">';
    [0, 10, 20, 30, 40].forEach(function (v) { s += '<line x1="' + l + '" x2="' + (W - rr) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="' + grid + '"/>' + tx(l - 7, Y(v) + 4, v, { a: 'end' }); });
    (mob ? [0, 500, 1000, 1500] : [0, 250, 500, 750, 1000, 1250, 1500]).forEach(function (v, i, A) { s += tx(X(v), H - b + 17, v === 1500 || v === 1000 && mob ? v.toLocaleString('en-US') : v, { a: i === A.length - 1 ? 'end' : 'middle' }); });
    s += tx((l + W) / 2, H - 6, 'CO₂ inside the leaf, C<tspan font-size="' + (f - 3) + '" dy="2">i</tspan><tspan dy="-2"> (µmol mol⁻¹)</tspan>', { a: 'middle', s: f + 0.5 });
    s += '<text transform="translate(' + (mob ? 12 : 15) + ' ' + ((t + H - b) / 2) + ') rotate(-90)" text-anchor="middle" font-size="' + f + '" fill="' + ink + '" font-family="system-ui,sans-serif">Net CO₂ uptake A (µmol m⁻² s⁻¹)</text>';
    s += '<line x1="' + l + '" x2="' + (W - rr) + '" y1="' + Y(0) + '" y2="' + Y(0) + '" stroke="' + ink + '" stroke-opacity=".5"/>';
    /* limiting zones: where Ac < Aj; names sit in the top margin, off every line */
    var cross = null, gsx = (res.Gstar || 45) * 1.5; for (var i = 1; i < pts.length; i++) { if (pts[i].x > gsx && (pts[i - 1].r.Ac - pts[i - 1].r.Aj) * (pts[i].r.Ac - pts[i].r.Aj) <= 0 && pts[i].r.Ac !== pts[i].r.Aj) { cross = pts[i].x; break; } }
    if (cross != null && tier > 1) {
      s += '<rect x="' + l + '" y="' + t + '" width="' + (X(cross) - l) + '" height="' + (H - t - b) + '" fill="' + cA + '" fill-opacity=".07"/>';
      s += '<line x1="' + X(cross) + '" x2="' + X(cross) + '" y1="' + t + '" y2="' + (H - b) + '" stroke="' + ink + '" stroke-opacity=".35" stroke-dasharray="3 3"/>';
      s += tx(X(cross) - 6, t - 8, mob ? '← Rubisco limits' : '← Rubisco limits', { a: 'end', c: cA, w: 600 });
      s += tx(X(cross) + 6, t - 8, mob ? 'light limits →' : 'RuBP regeneration (light) limits →', { c: cJ, w: 600 });
    }
    if (lo) s += '<path d="' + path(lo, 'A') + '" fill="none" stroke="' + ink + '" stroke-width="1.6" stroke-dasharray="2 4"/>' + tx(X(1150), Y(lo[near(lo, 1150)].r.A) - 8, '2 % O₂', { s: f - 1, halo: 1 });
    if (tier > 1) {
      s += '<path d="' + path(pts, 'Ac') + '" fill="none" stroke="' + cA + '" stroke-width="1.8" stroke-dasharray="6 4"/>';
      s += '<path d="' + path(pts, 'Aj') + '" fill="none" stroke="' + cJ + '" stroke-width="1.8" stroke-dasharray="6 4"/>';
    }
    s += '<path d="' + path(pts, 'A') + '" fill="none" stroke="' + main + '" stroke-width="2.8"/>';
    if (tier > 1) {
      var ia = near(pts, 650), ij = pts.length - 4;
      s += tx(X(pts[ia].x) - 4, Y(pts[ia].r.Ac) - 9, 'A<tspan font-size="' + (f - 3) + '" dy="2">c</tspan><tspan dy="-2"> Rubisco</tspan>', { a: 'end', c: cA, w: 600, halo: 1 });
      s += tx(X(pts[ij].x), Y(pts[ij].r.Aj) + 20, 'A<tspan font-size="' + (f - 3) + '" dy="2">j</tspan><tspan dy="-2"> light</tspan>', { a: 'end', c: cJ, w: 600, halo: 1 });
    }
    /* supply line A = gs/1.6 (Ca − Ci) and the operating point */
    var gc = (res.gs || 0) / 1.6, Ca = res.Ca || LP.state.Ca;
    if (gc > 0 && tier > 1 && res.A > 0) {
      var x0 = Ca, x1 = Math.max(0, Ca - ymax / gc);
      s += '<line x1="' + X(x0) + '" y1="' + Y(0) + '" x2="' + X(x1) + '" y2="' + Y(gc * (Ca - x1)) + '" stroke="' + cS + '" stroke-width="2"/>';
      s += '<circle cx="' + X(Ca) + '" cy="' + Y(0) + '" r="4.5" fill="' + cS + '"/>' + tx(X(Ca) + 8, Y(0) - 7, 'C<tspan font-size="' + (f - 3) + '" dy="2">a</tspan><tspan dy="-2">, the air</tspan>', { w: 600, c: cS, halo: 1 });
      var xs1 = x0 - (x0 - x1) * 0.18;
      if (!mob) s += tx(X(xs1) + 10, Y(gc * (Ca - xs1)) + 4, 'supply through stomata', { c: cS, s: f - 0.5, halo: 1 });
    }
    /* your points and the teaching fit (tier 3) */
    if (tier === 3 && USER.pts.length) {
      var cU = dark ? '#d9a6ff' : '#7a3fb0';
      if (USER.fit) { var fp = LP.range(Math.max(USER.fit.Gstar + 2, 1), xmax, 120).map(function (x) { var F = USER.fit; return { x: x, y: Math.min(F.Vcmax * (x - F.Gstar) / (x + F.Km), F.J > 0 ? F.J * (x - F.Gstar) / (4 * x + 8 * F.Gstar) : Infinity) - F.Rd }; });
        s += '<path d="' + fp.map(function (p, i) { return (i ? 'L' : 'M') + X(p.x).toFixed(1) + ' ' + Y(p.y).toFixed(1); }).join('') + '" fill="none" stroke="' + cU + '" stroke-width="2" stroke-dasharray="1 4" stroke-linecap="round"/>'; }
      USER.pts.forEach(function (p) { s += '<rect x="' + (X(p.ci) - 4.5).toFixed(1) + '" y="' + (Y(p.a) - 4.5).toFixed(1) + '" width="9" height="9" transform="rotate(45 ' + X(p.ci).toFixed(1) + ' ' + Y(p.a).toFixed(1) + ')" fill="' + cU + '" stroke="' + bg + '" stroke-width="1.5"/>'; });
    }
    if (res.Ci != null) s += '<circle cx="' + X(res.Ci) + '" cy="' + Y(res.A) + '" r="6.5" fill="' + main + '" stroke="' + bg + '" stroke-width="2"/>' + tx(X(res.Ci) - 10, Y(res.A) - 12, 'this leaf now', { a: 'end', w: 700, c: main, halo: 1 });
    return s + '</svg>';
  }

  /* user A/Ci points (PhD panel 14) */
  var USER = { pts: [], fit: null };
  function parsePts(txt) {
    return String(txt || '').split(/\n|;/).map(function (l) { var m = l.replace(/[−–]/g, '-').match(/(-?\d+(?:\.\d+)?)[\s,\t]+(-?\d+(?:\.\d+)?)/); return m ? { ci: +m[1], a: +m[2] } : null; }).filter(function (p) { return p && isFinite(p.ci) && isFinite(p.a) && p.ci >= 0 && p.ci <= 3000; });
  }
  function fitText() {
    var F = USER.fit, st = LP.state;
    if (!USER.pts.length) return 'Paste Ci and A pairs, one per line (for example <span class="mono">200, 12.4</span>), then press Fit.';
    if (!F) return USER.pts.length + ' points read; at least 3 above Γ* are needed for a fit.';
    return '<b>Teaching fit</b> ' + ui.badge('ILLUSTRATIVE') + ' at ' + num(st.T, 1) + ' °C, ' + num(st.O2, 0) + ' % O₂, Ci basis: V<sub>cmax</sub> = ' + num(F.Vcmax, 1) + ', J = ' + (F.J > 0 ? num(F.J, 1) : 'n/a (no RuBP limited points)') + ', R<sub>d</sub> = ' + num(F.Rd, 1) + ' µmol m⁻² s⁻¹; ' + F.nRubisco + ' of ' + F.n + ' points Rubisco limited; RMSE ' + num(F.rmse, 2) + '. Set the leaf temperature slider to the temperature you measured at, or the Rubisco constants will be wrong. ' + ui.ev('str.fit', 'How it fits') + ' ' + ui.ev('str.gm2002', 'Why Cc matters');
  }

  /* ================================================================== photorespiration map (SVG heat map) */
  function heatSVG() {
    var dark = ui.isDark(), W = 640, H = 270, l = 52, rr = 74, t = 12, b = 38;
    var Ts = LP.range(5, 45, 17), Cs = LP.range(100, 1200, 12), O2 = LP.state.O2 == null ? 21 : LP.state.O2;
    var cw = (W - l - rr) / Ts.length, ch = (H - t - b) / Cs.length;
    var ink = dark ? '#b3aca0' : '#5e5141';
    function col(v) { /* 0 → pale, 0.5 → deep warm; colour blind safe sequential */
      var k = clamp(v / 0.45, 0, 1);
      var a = dark ? [24, 34, 44] : [250, 244, 226], z = dark ? [255, 150, 70] : [176, 58, 18];
      return 'rgb(' + a.map(function (q, i) { return Math.round(lerp(q, z[i], Math.pow(k, 0.8))); }).join(',') + ')';
    }
    var ratio = LP.P.ciRatio;
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Map of the share of fixed CO2 lost to photorespiration across leaf temperature and CO2 in the air" style="width:100%;height:auto;display:block">';
    Ts.forEach(function (T, i) {
      var g = LP.constants(T, O2).Gstar;
      Cs.forEach(function (Ca, j) {
        var loss = g / (ratio * Ca);
        s += '<rect x="' + (l + i * cw).toFixed(1) + '" y="' + (t + (Cs.length - 1 - j) * ch).toFixed(1) + '" width="' + (cw + 0.5).toFixed(1) + '" height="' + (ch + 0.5).toFixed(1) + '" fill="' + col(loss) + '"><title>' + num(T, 1) + ' °C, ' + num(Ca, 0) + ' ppm: ' + Math.round(100 * Math.min(loss, 1)) + ' % lost</title></rect>';
      });
    });
    [5, 15, 25, 35, 45].forEach(function (T) { var x = l + (T - 5) / 40 * (W - l - rr - cw) + cw / 2; s += '<text x="' + x + '" y="' + (H - b + 15) + '" text-anchor="middle" font-size="11" fill="' + ink + '" font-family="system-ui,sans-serif">' + T + '</text>'; });
    [100, 400, 700, 1000].forEach(function (C) { var j = Math.round((C - 100) / 100); var y = t + (Cs.length - 1 - j) * ch + ch / 2 + 4; s += '<text x="' + (l - 6) + '" y="' + y + '" text-anchor="end" font-size="11" fill="' + ink + '" font-family="system-ui,sans-serif">' + C + '</text>'; });
    s += '<text x="' + ((l + W - rr) / 2) + '" y="' + (H - 4) + '" text-anchor="middle" font-size="11.5" fill="' + ink + '" font-family="system-ui,sans-serif">Leaf temperature (°C)</text>';
    s += '<text transform="translate(13 ' + ((t + H - b) / 2) + ') rotate(-90)" text-anchor="middle" font-size="11.5" fill="' + ink + '" font-family="system-ui,sans-serif">CO₂ in the air (ppm)</text>';
    /* legend */
    var lx = W - rr + 16, lh = H - t - b;
    for (var k = 0; k <= 20; k++) s += '<rect x="' + lx + '" y="' + (t + lh * (1 - k / 20) - lh / 20) + '" width="14" height="' + (lh / 20 + 0.5) + '" fill="' + col(0.45 * k / 20) + '"/>';
    [0, 0.15, 0.3, 0.45].forEach(function (v) { s += '<text x="' + (lx + 18) + '" y="' + (t + lh * (1 - v / 0.45) + 4) + '" font-size="10.5" fill="' + ink + '" font-family="system-ui,sans-serif">' + Math.round(100 * v) + ' %' + (v === 0.45 ? '+' : '') + '</text>'; });
    /* the current leaf */
    var st = LP.state, cx = l + (clamp(st.T, 5, 45) - 5) / 40 * (W - l - rr - cw) + cw / 2, cy = t + (Cs.length - 1 - (clamp(st.Ca, 100, 1200) - 100) / 100) * ch + ch / 2;
    var stroke = dark ? '#ffffff' : '#1a140f';
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="7" fill="none" stroke="' + stroke + '" stroke-width="2.4"/><circle cx="' + cx + '" cy="' + cy + '" r="2.2" fill="' + stroke + '"/>';
    s += '<text x="' + (cx + (cx > W * 0.6 ? -11 : 11)) + '" y="' + (cy - 9) + '" text-anchor="' + (cx > W * 0.6 ? 'end' : 'start') + '" font-size="11.5" font-weight="700" fill="' + stroke + '" font-family="system-ui,sans-serif" paint-order="stroke" stroke="' + (dark ? '#0b1015' : '#fff') + '" stroke-width="3">this leaf</text>';
    return s + '</svg>';
  }

  /* ================================================================== markup */
  var CSS =
    '#lv-stroma .str-theatre{min-height:300px}#lv-stroma .str-ctrls .hint .ps-chip{margin-left:4px;vertical-align:middle}' +
    '#lv-stroma .str-ctrls{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:0;margin:12px 0 0;border-top:1px solid var(--rule2)}' +
    '#lv-stroma .str-sw{display:flex;flex-wrap:wrap;gap:6px;align-items:center}' +
    '#lv-stroma .str-legend{display:flex;flex-wrap:wrap;gap:4px 14px;font-family:var(--ui);font-size:12.5px;color:var(--ink2);margin:8px 0 0}' +
    '#lv-stroma .str-legend i{display:inline-block;width:11px;height:11px;border-radius:50%;margin-right:5px;vertical-align:-1px}' +
    '#lv-stroma .eq{font-family:var(--mono);font-size:13.5px;line-height:1.9;overflow-x:auto}' +
    '#lv-stroma .str-lim{font-family:var(--ui);font-weight:600}' +
    '#lv-stroma .tile.str-hot .v{color:var(--warm)}' +
    '#lv-stroma .str-bill td.mono,#lv-stroma .str-bill th{white-space:nowrap}' +
    '#lv-stroma .str-two{display:grid;grid-template-columns:1fr;gap:12px;align-items:start}' +
    '#lv-stroma .str-two>div:last-child{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:4px 18px}' +
    '#lv-stroma .str-two>div:last-child>p{grid-column:1/-1;margin:4px 0}' +
    '#lv-stroma .str-knote{font-family:var(--ui);font-size:12.5px;color:var(--ink2)}' +
    '#lv-stroma .str-two>div:last-child>.str-own{grid-column:1/-1}#lv-stroma .str-own textarea{max-width:560px}#lv-stroma .str-own .str-sw{gap:8px}';

  function tile(id, k, unit, cls) { return '<div class="tile' + (cls ? ' ' + cls : '') + '" id="' + id + '"><div class="k">' + k + '</div><div class="v"><span class="n">0</span> <small>' + (unit || '') + '</small></div></div>'; }
  function row(q, v, b, key) { return '<tr><td>' + q + '</td><td class="mono">' + v + '</td><td>' + ui.badge(b) + ' ' + (key ? ui.ev(key, 'Source') : '') + '</td></tr>'; }
  var A1 = null;

  function mount(el) {
    U();
    var E = ui.ev;
    var leg = function (col, tx) { return '<span><i style="background:' + col + '"></i>' + tx + '</span>'; };
    el.innerHTML = '<style>' + CSS + '</style>' +
      '<div class="str-hero" id="str-hero"></div>' +
      ui.now('<b>What is happening:</b> <span id="str-now"></span>', 'str-nowp') +

      /* 4.1 */
      '<figure class="fig lx-fig" id="str-live"><div class="fighead"><h3>4.1 The Calvin Benson cycle, live</h3><p>Fix, reduce, regenerate: three CO₂ in, one sugar unit out, paid for in ATP and NADPH.</p></div>' +
      '<div class="lx-frame str-theatre" id="str-th"></div>' +
      '<div class="str-legend" aria-hidden="true">' + leg('#4a4f57', 'carbon (grey) in RuBP, 3‑PGA, G3P') + leg('#8a5cc4', 'phosphate') + leg('#77797d', 'CO₂ (grey)') + leg('#981b30', 'O₂ (crimson)') + leg('#e8891a', 'ATP') + leg('#1f9e93', 'NADPH') + leg('#3f9a4a', 'G3P exported') + '</div>' +
      '<div class="str-ctrls">' +
      '<div class="ctl"><label for="str-T">Leaf temperature <output id="str-T-o"></output></label><input type="range" id="str-T" min="5" max="45" step="0.5"><div class="hint">heat favours O₂ at Rubisco</div></div>' +
      '<div class="ctl"><label for="str-Ca">CO₂ in the air <output id="str-Ca-o"></output></label><input type="range" id="str-Ca" min="100" max="1500" step="10"><div class="hint">today about 420 ppm</div></div>' +
      '<div class="ctl tier-2"><label for="str-ppfd">Light <output id="str-ppfd-o"></output></label><input type="range" id="str-ppfd" min="0" max="2000" step="10"><div class="hint">sets the ATP and NADPH supply</div></div>' +
      '<div class="ctl"><span class="ctl-l">O₂ in the air</span><div class="str-sw" role="group" aria-label="O2 in the air"><button type="button" class="chip" data-o2="21">21 %, today</button><button type="button" class="chip" data-o2="2">2 %, a lab trick</button></div><div class="hint"><button type="button" class="btn small" id="str-pause" aria-pressed="false">Pause</button> <button type="button" class="btn small" id="str-reset">Reset</button></div></div>' +
      '</div>' +
      '<figcaption class="cap" id="str-cap"></figcaption>' +
      '<p class="cap lx-row">Every molecule moves at a rate set by the model, on one scale: one drawn CO₂ is 4 µmol m⁻² s⁻¹. ' + E('str.scale', 'Drawing scale') + ' ' + E('atp_nadph_demand', '9 ATP + 6 NADPH per G3P') + ' ' + E('str.pr', 'Photorespiration loop') + '</p>' +
      '<p class="cap lx-row tier-2">Rubisco cannot tell CO₂ from O₂ perfectly. Every time it grabs O₂ instead, the leaf makes a two carbon waste product that costs ATP and NADPH to recycle and gives back only part of the carbon. ' + E('photorespiration_ratio', 'vo/vc = 2Γ*/C') + ' ' + E('photorespiration_cost', 'Cost per oxygenation') + ' ' + E('rubisco_global', 'Rubisco on Earth') + '</p>' +
      '</figure>' +

      '<div class="tiles lx-tiles" id="str-tiles">' +
      tile('st-A', 'Net CO₂ uptake, A', 'µmol m⁻² s⁻¹') +
      tile('st-vc', 'Carboxylation, vc', 'µmol m⁻² s⁻¹', 'tier-2') +
      tile('st-vo', 'Oxygenation, vo', 'µmol m⁻² s⁻¹', 'tier-2') +
      tile('st-pr', 'CO₂ lost to photorespiration', '% of fixed') +
      tile('st-atp', 'ATP spent', 'µmol m⁻² s⁻¹', 'tier-2') +
      tile('st-nadph', 'NADPH spent', 'µmol m⁻² s⁻¹', 'tier-2') +
      tile('st-g3p', 'G3P exported', 'µmol m⁻² s⁻¹') +
      tile('st-lim', 'What limits now', '') +
      tile('st-ci', 'CO₂ inside, Ci', 'µmol mol⁻¹', 'tier-2') +
      tile('st-gs', 'Γ*, CO₂ compensation without Rd', 'µmol mol⁻¹', 'tier-3') +
      '</div>' +

      /* 4.2 */
      '<figure class="fig lx-fig" id="str-aci"><div class="fighead"><h3>4.2 More CO₂, more sugar, until light runs out</h3><p>Net CO₂ uptake against the CO₂ inside the leaf: the curve every gas exchange lab measures.</p></div>' +
      '<div class="str-two"><div class="lx-frame" id="str-acibox" style="padding:8px"></div>' +
      '<div><div class="ctl tier-3"><label for="str-vc">Vcmax at 25 °C <output id="str-vc-o"></output></label><input type="range" id="str-vc" min="10" max="140" step="1"><div class="hint">Rubisco capacity ' + E('vcmax_jmax_illustrative', 'Teaching value') + '</div></div>' +
      '<div class="ctl tier-3"><label for="str-jm">Jmax at 25 °C <output id="str-jm-o"></output></label><input type="range" id="str-jm" min="20" max="260" step="1"><div class="hint">electron transport capacity</div></div>' +
      '<p class="cap" id="str-acicap"></p>' +
      '<p class="cap tier-2">Below the bend, adding CO₂ helps because Rubisco is the bottleneck. Above it, the leaf runs short of RuBP, which means short of ATP and NADPH from the light reactions. The green line is the supply side: CO₂ diffusing in through open stomata. Where supply meets demand is where the leaf sits. ' + E('fvcb_model', 'FvCB model') + ' ' + E('eng.gm', 'Ci = Cc here') + '</p>' +
      '<p class="cap tier-3">Fitting on a Ci basis underestimates Vcmax, and more so at high temperature, where mesophyll conductance takes a larger share of the limitation. ' + E('str.gm2002', 'Bernacchi 2002') + '</p>' +
      '<p><button type="button" class="btn small" data-str="greenhouse">Greenhouse at 1,000 ppm</button> <button type="button" class="btn small tier-2" data-str="c4like">If Rubisco saw C4 levels</button></p>' +
      '<div class="tier-3 str-own"><label for="str-pts" class="lbl-s" style="display:block;font-family:var(--ui);font-size:13px;font-weight:600;color:var(--ink2)">Your A versus Ci points (Ci, A per line)</label><textarea id="str-pts" rows="5" spellcheck="false" style="width:100%;font-family:var(--mono);font-size:13px"></textarea>' +
      '<p class="str-sw"><button type="button" class="btn small" id="str-fit">Fit my points</button><button type="button" class="btn small" id="str-ex">Example: this leaf, measured with noise</button><button type="button" class="btn small" id="str-clr">Clear</button></p><p class="cap" id="str-fitout" aria-live="polite"></p></div>' +
      '</div></div>' +
      '</figure>' +

      /* 4.3 */
      '<figure class="fig lx-fig" id="str-map"><div class="fighead"><h3>4.3 When does photorespiration bite?</h3><p>Share of each fixed CO₂ released again by photorespiration, for every leaf temperature and CO₂ level.</p></div>' +
      '<div class="lx-frame" id="str-heat" style="padding:8px"></div>' +
      '<figcaption class="cap" id="str-heatcap"></figcaption>' +
      '<p class="cap lx-row tier-2">Two things push toward O₂ as a leaf warms: Rubisco’s preference for CO₂ over O₂ falls, and CO₂ dissolves less well than O₂ in warm water. Both are inside Γ*, which rises from about 25 to 70 µmol mol⁻¹ between 15 and 35 °C. ' + E('bernacchi_T_examples', 'Γ* with temperature') + ' ' + E('str.heat', 'How the map is made') + '</p>' +
      '</figure>' +

      /* 4.4 */
      '<figure class="fig lx-fig tier-2" id="str-billf"><div class="fighead"><h3>4.4 The bill</h3><p>What the stroma spends, per sugar unit and per mistake.</p></div>' +
      '<div class="lx-tw"><table class="lx-tab str-bill"><thead><tr><th>Step</th><th>ATP</th><th>NADPH</th><th>Carbon</th><th>Status</th></tr></thead><tbody>' +
      '<tr><td>3 carboxylations: 3 RuBP + 3 CO₂ → 6 3‑PGA</td><td class="mono">0</td><td class="mono">0</td><td class="mono">+3 C</td><td>' + ui.badge('DERIVED') + '</td></tr>' +
      '<tr><td>Reduction: 6 3‑PGA → 6 G3P</td><td class="mono">6</td><td class="mono">6</td><td class="mono">0</td><td>' + ui.badge('DERIVED') + '</td></tr>' +
      '<tr><td>Regeneration: 5 G3P → 3 RuBP</td><td class="mono">3</td><td class="mono">0</td><td class="mono">0</td><td>' + ui.badge('DERIVED') + '</td></tr>' +
      '<tr><td><b>Net: 1 G3P exported</b></td><td class="mono"><b>9</b></td><td class="mono"><b>6</b></td><td class="mono"><b>3 C</b></td><td>' + ui.badge('DERIVED') + ' ' + E('atp_nadph_demand', 'Source') + '</td></tr>' +
      '<tr><td>Each oxygenation (photorespiration)</td><td class="mono">about 3.5</td><td class="mono">2</td><td class="mono">−0.5 C</td><td>' + ui.badge('DERIVED') + ' ' + E('photorespiration_cost', 'Source') + '</td></tr>' +
      '</tbody></table></div>' +
      '<p class="cap" id="str-billcap"></p>' +
      '</figure>' +

      /* cases */
      '<section class="lx-cases" aria-label="Real cases"><h3 class="lx-h3">Real cases to think with</h3><div class="lx-cardgrid">' +
      '<div class="card lx-case"><p class="lx-ck">Cool Salinas lettuce, hot valley lettuce</p><p>The same leaf at 16 °C on a foggy Salinas morning and at 38 °C on a hot inland afternoon. Watch the O₂ to CO₂ ratio at Rubisco in the wheel and the dot on the map. Lettuce Rubisco itself differs from other crops in how it responds to heat. ' + E('rubisco_rate_crops') + ' ' + E('photorespiration_ratio') + '</p><p><button type="button" class="btn small" data-str="cool">16 °C, foggy morning</button> <button type="button" class="btn small" data-str="hot">38 °C, hot afternoon</button></p></div>' +
      '<div class="card lx-case"><p class="lx-ck">Photorespiration costs real yield</p><p>Photorespiration lowers US soybean and wheat yields by about 36 % and 20 % in a regional model. Tobacco given a shortcut pathway for glycolate inside the chloroplast grew more than 40 % more biomass in field trials. ' + E('photorespiration_yield') + ' ' + E('str.south', 'Field trial') + '</p><p><button type="button" class="btn small" data-str="lowo2">What if there were no O₂? (2 %)</button></p></div>' +
      '<div class="card lx-case tier-2"><p class="lx-ck">CO₂ enrichment, in a greenhouse and in a field</p><p>Growers raise greenhouse CO₂ to about 1,000 ppm. Watch the operating point slide up the A versus Ci curve until it reaches the light limited shoulder. In open field FACE experiments, extra CO₂ raised carbon gain and cut water use, but crop yields rose less than chamber studies predicted. ' + E('str.face') + '</p><p><button type="button" class="btn small" data-str="greenhouse">1,000 ppm</button> <button type="button" class="btn small" data-str="today">Back to 420 ppm</button></p></div>' +
      '<div class="card lx-case tier-2"><p class="lx-ck">Chaparral at noon in August</p><p>A chamise or manzanita leaf on a south facing Santa Monica Mountains slope can sit well above 35 °C while its stomata are nearly shut. Low Ci and high temperature together put it in the darkest corner of the map. How would you test whether photorespiration also protects such a leaf, by keeping electrons flowing when CO₂ is scarce? ' + E('str.heat') + '</p><p><button type="button" class="btn small" data-str="chaparral">40 °C, Ci low</button></p></div>' +
            '<div class="card lx-case str-ncard" id="str-nitrogen"><p class="lx-ck">Sugar is not a nutrient: the nitrogen behind the cycle</p><p>The leaf makes its own sugar from CO₂ and water, so the G3P leaving this wheel holds only carbon, hydrogen and oxygen. ' + E('str.sugarN') + ' The machines that make it are another matter. Rubisco and the other Calvin cycle and thylakoid proteins hold most of a leaf’s nitrogen, and every chlorophyll carries four nitrogen atoms. Within a species, more leaf nitrogen means more Rubisco and more chlorophyll. ' + E('str.nitrogen') + ' ' + E('str.nitrogen2') + '</p>' +
      '<p class="tier-3">Expert: to a first approximation thylakoid nitrogen is proportional to chlorophyll, about 50 mol N per mol chlorophyll, and shade species put relatively more of their nitrogen into the thylakoids (Evans 1989, Oecologia, doi 10.1007/BF00377192). Question it: in a leaf short of nitrogen, which limb of the A versus Ci curve in 4.2 would you expect to fall first, the Rubisco limb or the light limb, and how would you test it?</p>' +
      '<p>Where the nitrogen comes from: mineral nutrition, taken up by the roots (<a href="../journey/index.html#organ">Water III, Organ</a>).</p></div>' +
'</div></section>' +

      /* expert */
      '<section class="tier-3 lx-expert" aria-label="Expert"><h3 class="lx-h3">Equations and constants</h3>' +
      '<div class="card eq">A = min(A<sub>c</sub>, A<sub>j</sub>) − R<sub>d</sub>    (Farquhar, von Caemmerer and Berry 1980)<br>' +
      'A<sub>c</sub> = V<sub>cmax</sub> (C − Γ*) / (C + K<sub>c</sub> (1 + O / K<sub>o</sub>))<br>' +
      'A<sub>j</sub> = J (C − Γ*) / (4 C + 8 Γ*)    (NADPH basis; 4.5 C + 10.5 Γ* on an ATP basis)<br>' +
      'φ = v<sub>o</sub> / v<sub>c</sub> = 2 Γ* / C    CO₂ released by photorespiration = 0.5 v<sub>o</sub><br>' +
      'ATP = v<sub>c</sub> (3 + 3.5 φ)    NADPH = v<sub>c</sub> (2 + 2 φ)    G3P exported = A / 3<br>' +
      'k(T) = exp(c − ΔH<sub>a</sub> / R T<sub>k</sub>)  for K<sub>c</sub>, K<sub>o</sub>, Γ*, V<sub>cmax</sub>, R<sub>d</sub> (Bernacchi et al. 2001)    C = C<sub>i</sub> (no g<sub>m</sub>)</div>' +
      '<div class="lx-tw"><table class="lx-tab"><thead><tr><th>Quantity</th><th>15 °C</th><th>25 °C</th><th>35 °C</th><th>Status</th></tr></thead><tbody id="str-ktab"></tbody></table></div>' +
      '<div class="lx-tw"><table class="lx-tab"><thead><tr><th>Quantity</th><th>Value</th><th>Status</th></tr></thead><tbody>' +
      LP.PARAMS.filter(function (p) { return /Vcmax|Jmax|Rd|Kc|k\(T\)|high T|Aj|Ci/.test(p.sym); }).map(function (p) { return row(p.sym + ', ' + p.what, p.v + (p.u ? ' ' + p.u : ''), p.badge, p.ev); }).join('') +
      '</tbody></table></div>' +
      '<div class="card lx-open"><p class="lx-ck">' + ui.badge('OPEN QUESTION') + ' How much CO₂ actually reaches Rubisco?</p><p>Real leaves have a mesophyll conductance, so CO₂ drops again on its way from the air spaces through cell walls, membranes and stroma, more in thick or tough leaves. This model now includes it (one fixed value, set and switched off on Plate V, 5.4), but the A versus Ci curve on this plate is still drawn against Ci, the way gas exchange systems report it. Fitting an A versus Ci curve without it makes Vcmax look smaller and photorespiration look smaller. In tobacco mesophyll conductance rose with temperature (Q10 about 2.2) but not fast enough: its share of the limitation inside the leaf grew from 0.10 at 10 °C to 0.22 at 40 °C, so assuming Ci = Cc is worst in heat, and a single fixed gm, as in this model, misses that. Do aquaporins in mesophyll membranes, the same family that carries water on the Membrane plate of The Water Path, also carry part of this CO₂? ' + E('str.gm2002') + ' ' + E('eng.gm') + ' ' + E('fvcb_fitting') + '</p></div>' +
      '<div class="card lx-open"><p class="lx-ck">' + ui.badge('OPEN QUESTION') + ' Is photorespiration only waste?</p><p>It loses carbon, yet it recovers three of every four carbons that oxygenation would otherwise throw away (two phosphoglycolates, four carbons, give back one 3‑PGA), and it keeps ATP and NADPH being used when stomata are shut. The engineered shortcut in tobacco says the native route can be beaten in a field. Would the same hold for a heat stressed lettuce bed or a chaparral shrub in drought? ' + E('str.south') + ' ' + E('photorespiration_yield') + '</p></div>' +
      ui.design({ title: 'heat, oxygen and lettuce', question: 'How much of the carbon a lettuce leaf loses in heat is photorespiration, and how much is something else (stomata, Rubisco activase)?',
        treat: 'Leaf temperature 20 and 35 °C in the gas exchange chamber, each at 21 % and 2 % O₂, on the same leaves (four combinations, order randomised), CO₂ and light held at 420 ppm and 1,500 µmol m⁻² s⁻¹.',
        measure: 'A, g<sub>s</sub> and Ci at each step; the O₂ effect (A at 2 % minus A at 21 %) is the photorespiration you can remove; an A versus Ci curve at each temperature if time allows.',
        howto: ['str.aci'], n: 'Plants are the replicates: 6 plants, one leaf each, measured on different days in random order of temperature.',
        expect: 'This page’s model predicts removing O₂ raises A by <span id="str-de20"></span> % at 20 °C and <span id="str-de35"></span> % at 35 °C ' + ui.badge('DERIVED') + ' (tobacco Rubisco constants, Ci = 0.7 Ca).',
        confound: 'At 35 °C stomata close and Ci falls, which itself raises photorespiration: compare at equal Ci (from the A versus Ci curves), and keep leaf to air VPD constant across temperatures.' }) +
      ui.howto('str.aci') +
      '</section>' +

      /* questions */
      '<section class="lx-qs" aria-label="Questions"><h3 class="lx-h3">Check yourself</h3>' +
      ui.reveal('Predict: you warm the leaf from 20 to 35 °C at today’s CO₂. Which rises faster, carboxylation or oxygenation? Then drag the temperature slider and watch the O₂ : CO₂ ratio in the wheel.',
        '<p>Oxygenation rises faster. Γ*, the CO₂ level at which Rubisco’s O₂ grabs exactly cancel its CO₂ gains, roughly doubles between 20 and 35 °C (about 2.1 times), so a larger share of each fixed CO₂ is released again. Net uptake peaks and then falls, even though Rubisco itself works faster when warm.</p><p class="tier-2">In symbols: vo/vc = 2Γ*/Ci, and the share lost is Γ*/Ci.</p>', { choices: [
          ['Oxygenation rises faster', true, 'Warmth lowers Rubisco’s preference for CO₂ and CO₂ dissolves less well than O₂.'],
          ['Carboxylation rises faster', false, 'Rubisco speeds up, but its O₂ reactions speed up more: watch O₂ : CO₂ in the wheel climb.'],
          ['They rise together, the ratio stays put', false, 'The ratio is set by Γ*, which roughly doubles from 20 to 35 °C.']] }) +
      '<div class="tier-2">' + ui.reveal('Count it: to export one G3P the cycle fixes 3 CO₂. How many ATP and NADPH does that cost, and where is each spent?',
        '<p>9 ATP and 6 NADPH. Reduction spends 6 ATP and 6 NADPH (one each per 3‑PGA, and 3 CO₂ make 6 3‑PGA). Regeneration of 3 RuBP spends 3 more ATP. That 9 : 6 = 1.5 ratio is why the thylakoid needs cyclic flow.</p>', { choices: [
          ['9 ATP and 6 NADPH', true, 'Reduction 6 + 6, regeneration 3 ATP.'],
          ['6 ATP and 6 NADPH', false, 'That is only the reduction step; regenerating 3 RuBP costs 3 more ATP.'],
          ['3 ATP and 2 NADPH', false, 'That is the bill per CO₂. One G3P needs three CO₂.']] }) + '</div>' +
      '<div class="tier-2">' + ui.reveal('Lower the O₂ to 2 % and compare A at 25 °C and at 38 °C. At which temperature does removing O₂ help more, and why?',
        '<p>At 38 °C. The gain from removing O₂ is the photorespiration that disappears, and that loss grows with temperature. At 25 °C and 420 ppm the model loses about 15 % of fixed CO₂; at 38 °C much more.</p>', { choices: [
          ['At 38 °C', true, 'More photorespiration to remove means a bigger gain.'],
          ['At 25 °C', false, 'Try it: the 2 % O₂ gain is larger in heat, because Γ* is larger.'],
          ['The same at both', false, 'The loss to photorespiration grows with temperature, so the gain does too.']] }) + '</div>' +
      '<div class="tier-3">' + ui.reveal('Your A versus Ci curve flattens at high Ci and even drops a little when O₂ is lowered. The FvCB model above cannot do that. What third limitation is missing, and what would you measure?',
        '<p>Triose phosphate use (TPU): the leaf cannot export or use G3P fast enough, so phosphate is locked in sugar phosphates and ATP synthesis slows. It shows as a flat A at high Ci that is insensitive (or reversed) to O₂. Measure A versus Ci to high CO₂ at 21 and 2 % O₂ and look for the plateau.</p>') + '</div>' +
      '</section>' + (ui.quiz ? ui.quiz('stroma') : '') +
      '<p class="lx-water">Where the sugar goes next: G3P leaves the chloroplast and the leaf exports it as sucrose (and, in almond and its family, sorbitol). <a href="../phloem/index.html#source">Sugar leaves the chloroplast: Sugar on the move</a></p>';  /* phloem builder A, 14 Oct 2026: one line link */

if (window.WPMolColor) { var mk0 = el.querySelector('#str-th'); if (mk0) mk0.insertAdjacentHTML('afterend', WPMolColor.key(['co2', 'o2'])); } // v19: the site wide molecule key
    A1 = ui.anim(el.querySelector('#str-th'), {
      height: function (w) { return w < 560 ? 540 : 590; },
      label: 'Calvin Benson cycle wheel: CO2 and O2 reach Rubisco, 3‑PGA is reduced with ATP and NADPH, RuBP is regenerated, G3P leaves; oxygenation sends phosphoglycolate to the photorespiration loop, which releases CO2',
      draw: draw,
      settle: function () { if (!ST.lay) return; ST.tok = []; ST.fly = []; ST.fx = []; prewarm(6); },
      resize: function () { ST.lay = null; cacheCv = null; }
    });
    function bind(id, key, f) { var e = el.querySelector('#' + id); e.addEventListener('input', function () { var p = {}; p[key] = f ? f(+e.value) : +e.value; LP.set(p); }); }
    bind('str-T', 'T'); bind('str-Ca', 'Ca'); bind('str-ppfd', 'ppfd'); bind('str-vc', 'Vcmax25'); bind('str-jm', 'Jmax25');
    var pb = el.querySelector('#str-pause');
    if (window.PlaySpeed) pb.parentNode.insertBefore(window.PlaySpeed.chip('ps-light'), pb.nextSibling);
    pb.addEventListener('click', function () { var p = !A1.paused(); A1.pause(p); pb.setAttribute('aria-pressed', p ? 'true' : 'false'); pb.textContent = p ? 'Play' : 'Pause'; });
    if (A1.freeze) A1.freeze.bind(pb); // v19: click the view to freeze, in step with Pause
    el.querySelector('#str-reset').addEventListener('click', function () { LP.set({ T: 25, Ca: 420, O2: 21, ppfd: 1500, Vcmax25: null, Jmax25: null }); });
    el.addEventListener('click', function (e) {
      var o = e.target.closest('[data-o2]'); if (o) { LP.set({ O2: +o.dataset.o2 }); return; }
      var b = e.target.closest('[data-str]'); if (!b) return;
      var k = b.dataset.str;
      var P = { cool: { T: 16, ppfd: 400, Ca: 420, O2: 21 }, hot: { T: 38, ppfd: 1800, Ca: 420, O2: 21 }, lowo2: { O2: 2 }, greenhouse: { Ca: 1000, O2: 21 }, today: { Ca: 420, O2: 21 },
        c4like: { Ca: 1500, O2: 21 }, chaparral: { T: 40, ppfd: 2000, Ca: 250, O2: 21 } }[k];
      if (P) LP.set(P);
      var tg = document.getElementById(k === 'greenhouse' || k === 'c4like' || k === 'today' ? 'str-aci' : 'str-live');
      if (tg && tg.scrollIntoView && b.closest('.lx-case')) tg.scrollIntoView({ behavior: ui.reducedMotion() ? 'auto' : 'smooth', block: 'start' });
    });
    var ta = el.querySelector('#str-pts'), fo = el.querySelector('#str-fitout');
    function doFit() { USER.pts = parsePts(ta.value); USER.fit = USER.pts.length >= 3 ? LP.fitAci(USER.pts) : null; fo.innerHTML = fitText(); renderPlots(LP.result, true); }
    el.querySelector('#str-fit').addEventListener('click', doFit);
    el.querySelector('#str-clr').addEventListener('click', function () { ta.value = ''; USER.pts = []; USER.fit = null; fo.innerHTML = fitText(); renderPlots(LP.result, true); });
    el.querySelector('#str-ex').addEventListener('click', function () {
      /* a measured looking curve from this model leaf: the usual LI-6800 CO2 steps, with ± 0.4 µmol noise (ILLUSTRATIVE) */
      var steps = [50, 100, 150, 200, 280, 350, 450, 600, 800, 1000, 1200, 1500];
      ta.value = LP.aci(steps).map(function (d) { var n = (Math.sin(d.x * 12.9898) * 43758.5453) % 1; return d.x + ', ' + (d.r.A + 0.8 * n).toFixed(1); }).join('\n');
      doFit();
    });
    fo.innerHTML = fitText();
    ui.onPrefs(function () { cacheCv = null; renderPlots(LP.result, true); });
    var rzT = 0, lastBW = 0; window.addEventListener('resize', function () { clearTimeout(rzT); rzT = setTimeout(function () { var b = document.getElementById('str-acibox'); var bw = b ? b.clientWidth : 0; if (bw && Math.abs(bw - lastBW) > 30) { lastBW = bw; renderPlots(LP.result, true); } }, 200); });
    window.addEventListener('lp:tier', function () { cacheCv = null; if (A1) A1.redraw(); renderPlots(LP.result, true); update(LP.state, LP.result); });
    try { h4Init(el.querySelector('#str-hero')); } catch (e) { console.error(e); }
  }

  var lastKey = '', lastHeat = '';
  function renderPlots(res, force) {
    var st = LP.state;
    var key = [st.T, st.Ca, st.O2, st.leaf, st.ppfd, JSON.stringify(st.spectrum), st.Vcmax25, st.Jmax25, st.dcmu, st.uncoupler, st.stomata, st.gs, st.ciRatio, st.cyclicScale, ui.isDark(), ui.tier()].join('|');
    if (force || key !== lastKey) { lastKey = key; var b = document.getElementById('str-acibox'); if (b) b.innerHTML = aciSVG(res, b.clientWidth - 16); }
    var hk = [st.T, st.Ca, st.O2, ui.isDark()].join('|');
    if (force || hk !== lastHeat) { lastHeat = hk; var h = document.getElementById('str-heat'); if (h) h.innerHTML = heatSVG(); }
  }
  function setT(id, v, hot) { var e = document.querySelector('#' + id + ' .n'); if (e) e.textContent = v; var t = document.getElementById(id); if (t) t.classList.toggle('str-hot', !!hot); }
  var LIMN = { Rubisco: 'Rubisco', 'RuBP regeneration': 'Light (RuBP)', ATP: 'ATP supply', dark: 'Darkness', blocked: 'Blocked' };

  function update(st, res) {
    if (!ui) return;
    if (H4.ctx) { h4Live(); H4.ctx.invalidate(); }
    function sync(id, v, txt) { var e = document.getElementById(id); if (e && document.activeElement !== e && v != null) e.value = v; var o = document.getElementById(id + '-o'); if (o) o.textContent = txt; }
    sync('str-T', st.T, num(st.T, 1) + ' °C'); sync('str-Ca', st.Ca, num(st.Ca, 0) + ' ppm'); sync('str-ppfd', st.ppfd, num(st.ppfd, 0) + ' µmol m⁻² s⁻¹');
    var V25 = st.Vcmax25 > 0 ? st.Vcmax25 : LP.P.Vcmax25[st.leaf === 'shade' ? 'shade' : 'sun'], J25 = st.Jmax25 > 0 ? st.Jmax25 : LP.P.JmaxRatio * V25;
    sync('str-vc', V25, num(V25, 0) + ' µmol m⁻² s⁻¹'); sync('str-jm', J25, num(J25, 0) + ' µmol m⁻² s⁻¹');
    Array.prototype.forEach.call(document.querySelectorAll('#lv-stroma [data-o2]'), function (b) { b.setAttribute('aria-pressed', Math.abs(+b.dataset.o2 - st.O2) < 0.5 ? 'true' : 'false'); });
    var loss = res.vc > 0 ? 100 * res.photorespiration / res.vc : 0;
    setT('st-A', num(res.A, 1)); setT('st-vc', num(res.vc, 1)); setT('st-vo', num(res.vo, 1)); setT('st-pr', num(loss, 0), loss > 25);
    setT('st-atp', num(res.atpDemand, 0)); setT('st-nadph', num(res.nadphDemand, 0)); setT('st-g3p', num(Math.max(0, res.A) / 3, 1));
    setT('st-lim', LIMN[res.limit] || res.limit || 'n/a', res.limit === 'ATP' || res.limit === 'blocked');
    setT('st-ci', num(res.Ci, 0)); setT('st-gs', num(res.Gstar, 1));
    var now = document.getElementById('str-now'); if (now) now.innerHTML = nowText(st, res, loss);
    var cap = document.getElementById('str-cap'); if (cap) cap.innerHTML = capText(st, res, loss);
    var ac = document.getElementById('str-acicap'); if (ac) ac.innerHTML = aciText(res);
    var hc = document.getElementById('str-heatcap'); if (hc) hc.innerHTML = 'At ' + num(st.T, 1) + ' °C and ' + num(st.Ca, 0) + ' ppm this leaf releases ' + num(loss, 0) + ' % of the CO₂ it fixes. Darker is worse. The dark corner, hot and low CO₂, is where C4 and CAM plants have the edge.';
    var bc = document.getElementById('str-billcap'); if (bc) bc.innerHTML = res.vc > 0 ? 'This leaf now: ' + num(res.vc, 1) + ' carboxylations and ' + num(res.vo, 1) + ' oxygenations per m² per second (µmol), spending ' + num(res.atpDemand, 0) + ' ATP and ' + num(res.nadphDemand, 0) + ' NADPH, a ratio of ' + num(res.atpPerNadph, 2) + ' ATP per NADPH (1.5 with no photorespiration).' : 'The cycle is stopped.';
    var kt = document.getElementById('str-ktab');
    if (kt && !kt.dataset.done) {
      kt.dataset.done = 1;
      var k = [15, 25, 35].map(function (T) { return LP.constants(T, 20.95); });
      kt.innerHTML = '<tr><td>K<sub>c</sub>, µmol mol⁻¹</td>' + k.map(function (q) { return '<td class="mono">' + num(q.Kc, 0) + '</td>'; }).join('') + '<td>' + ui.badge('UNVERIFIED') + ' ' + ui.ev('bernacchi_T_examples', 'Source') + '</td></tr>' +
        '<tr><td>K<sub>o</sub>, mmol mol⁻¹</td>' + k.map(function (q) { return '<td class="mono">' + num(q.Ko, 0) + '</td>'; }).join('') + '<td>' + ui.badge('UNVERIFIED') + '</td></tr>' +
        '<tr><td>Γ*, µmol mol⁻¹</td>' + k.map(function (q) { return '<td class="mono">' + num(q.Gstar, 1) + '</td>'; }).join('') + '<td>' + ui.badge('UNVERIFIED') + ' ' + ui.ev('bernacchi_25C', 'Constants') + '</td></tr>' +
        '<tr><td colspan="5" class="str-knote">Computed here from c and ΔH<sub>a</sub>, so the 25 °C column (' + num(k[1].Kc, 0) + ', ' + num(k[1].Ko, 0) + ', ' + num(k[1].Gstar, 1) + ') differs by under 1 % from the 25 °C values in the table below (404.9, 278.4, 42.75), because c and ΔH<sub>a</sub> are themselves rounded.</td></tr>';
    }
    var dk = [st.Ca, st.leaf, st.ppfd].join('|');
    if (dk !== update.dk) { update.dk = dk; var g = function (T, O) { return LP.solve(Object.assign({}, st, { T: T, O2: O, dcmu: false, uncoupler: false, ciFixed: 0 })).A; };
      var e20 = document.getElementById('str-de20'), e35 = document.getElementById('str-de35');
      if (e20) e20.textContent = num(100 * (g(20, 2) / g(20, 21) - 1), 0); if (e35) e35.textContent = num(100 * (g(35, 2) / g(35, 21) - 1), 0); }
    renderPlots(res);
    if (A1 && (ui.reducedMotion() || A1.paused())) { if (ui.reducedMotion() && ST.lay) { ST.tok = []; ST.fly = []; ST.fx = []; prewarm(6); } A1.redraw(); }
  }
  function nowText(st, r, loss) {
    if (r.limit === 'blocked') return st.dcmu ? 'DCMU on Plate III blocks the light reactions: no NADPH, so the cycle stops and the leaf only respires.' : 'The uncoupler on Plate III removes ATP: the cycle stops.';
    if (r.limit === 'dark') return 'Dark: no ATP or NADPH arrive from the thylakoid, so the cycle stops and the leaf only respires.';
    if (!(r.vc > 0)) return 'The cycle is stopped.';
    if (ui.tier() === 1) return 'Rubisco grabs about ' + Math.max(1, Math.round(r.vc / Math.max(0.01, r.vo))) + ' CO₂ for every O₂. Out of every 100 CO₂ it fixes, about ' + Math.round(loss) + ' leak out again through photorespiration.';
    return 'Rubisco fixes ' + num(r.vc, 1) + ' CO₂ and grabs ' + num(r.vo, 1) + ' O₂ per m² per second (µmol). Photorespiration gives back ' + num(loss, 0) + ' % of the fixed CO₂; net uptake is ' + num(r.A, 1) + ' µmol m⁻² s⁻¹.';
  }
  function capText(st, r, loss) {
    if (ui.tier() === 1) return 'Grey chains are carbon skeletons. Each CO₂ that joins at Rubisco makes two small pieces; ATP (stars) and NADPH (pills) turn them into sugar units; most are rebuilt into RuBP and one in six leaves. When an O₂ sneaks in instead (crimson pairs), a broken piece goes to the left and some carbon is lost.';
    var lim = r.limit === 'Rubisco' ? 'Rubisco limits now: more CO₂ would help at once.' : (r.limit === 'RuBP regeneration' ? 'Light limits now: RuBP is rebuilt only as fast as ATP and NADPH arrive.' : (r.limit === 'ATP' ? 'ATP limits now: cyclic flow on Plate III is set too low.' : ''));
    return lim + ' One G3P leaves for every three CO₂ fixed (net). ' + (loss > 25 ? 'With this much photorespiration the wheel spends a large part of its ATP recycling phosphoglycolate.' : '');
  }
  function aciText(r) {
    if (!(r.vc > 0)) return 'No light reactions, no curve to climb.';
    return 'The dot is this leaf: Ci = ' + num(r.Ci, 0) + ' µmol mol⁻¹, A = ' + num(r.A, 1) + ' µmol m⁻² s⁻¹, limited by ' + (r.limit === 'Rubisco' ? 'Rubisco' : (r.limit === 'ATP' ? 'ATP' : 'RuBP regeneration (light)')) + '.';
  }

  /* ================================================================== Test yourself: Plate IV (15 items) */
  LP.quiz = LP.quiz || {}; LP.quiz.items = LP.quiz.items || [];
  [
    { id: 'str-k-rubisco', t: 1, plate: 'stroma', b: 'VERIFIED', src: ['10.1007/BF00386231'],
      q: 'What does Rubisco do in the Calvin Benson cycle?',
      o: [['It attaches CO₂ to RuBP, a five carbon sugar, making two 3‑PGA', 'Right. Carboxylation is step one; everything after it spends ATP and NADPH.'],
        ['It splits water to release O₂', 'That is photosystem II in the thylakoid.'],
        ['It makes ATP from ADP', 'ATP synthase does that, in the thylakoid membrane.']], a: 0 },
    { id: 'str-k-cost', t: 1, plate: 'stroma', b: 'DERIVED', src: ['10.1007/BF00386231'],
      q: 'To export one G3P (three carbons), the cycle fixes 3 CO₂. What does that cost?',
      o: [['9 ATP and 6 NADPH', 'Right. 6 ATP and 6 NADPH in reduction, 3 ATP in regeneration.'],
        ['3 ATP and 3 NADPH', 'One of each per CO₂ would be cheap; the real bill is three times higher in ATP.'],
        ['6 ATP and 9 NADPH', 'The numbers are swapped. The cycle needs more ATP than NADPH, a ratio of 1.5.']], a: 0 },
    { id: 'str-k-oxy', t: 1, plate: 'stroma', b: 'DERIVED', src: ['10.1007/BF00386231'],
      q: 'What is photorespiration?',
      o: [['What follows when Rubisco grabs O₂ instead of CO₂: the leaf recycles the product, spending ATP and losing some CO₂', 'Right. It is a salvage pathway through chloroplast, peroxisome and mitochondrion.'],
        ['Respiration that happens only in the light, making ATP', 'Despite the name, it costs ATP rather than making it.'],
        ['The release of O₂ from water', 'That is water splitting at PSII.']], a: 0 },
    { id: 'str-k-temp', t: 1, plate: 'stroma', b: 'DERIVED', src: ['10.1111/j.1365-3040.2001.00668.x'],
      q: 'As a C3 leaf warms from 20 to 35 °C at today’s CO₂, the share of fixed CO₂ lost to photorespiration…',
      o: [['rises', 'Right. Γ* rises with temperature, so oxygenation gains on carboxylation.'],
        ['falls', 'Warmth favours O₂ at Rubisco, not CO₂.'],
        ['stays the same, because air is always 21 % O₂', 'The air does not change, but Rubisco’s preference and gas solubility do.']], a: 0 },
    { id: 'str-k-g3p', t: 1, plate: 'stroma', b: 'DERIVED', src: [],
      q: 'Of every six G3P made in the cycle, how many leave to become sucrose or starch?',
      o: [['One; the other five are rebuilt into three RuBP', 'Right. 5 × 3 carbons = 15 = 3 × 5 carbons. The wheel must keep turning.'],
        ['All six', 'Then no RuBP would be left and the cycle would stop after one turn.'],
        ['Three', 'Only the three carbons from three CO₂ are new; the rest must go back.']], a: 0 },
    { id: 'str-u-phi', t: 2, plate: 'stroma', b: 'DERIVED', src: ['10.1007/BF00386231'],
      q: 'With Γ* = 43 µmol mol⁻¹ and Ci = 290 µmol mol⁻¹, what is vo/vc, and what share of fixed CO₂ is released again?',
      o: [['vo/vc ≈ 0.30; about 15 % released', 'Right. φ = 2Γ*/Ci = 86/290 = 0.30, and 0.5 φ = 0.15.'],
        ['vo/vc ≈ 0.15; about 30 % released', 'The two are swapped: φ = 2Γ*/Ci and the CO₂ lost is half of φ.'],
        ['vo/vc ≈ 0.85; about 85 % released', 'That would mean O₂ almost wins at Rubisco; at today’s CO₂ and 25 °C it does not.']], a: 0 },
    { id: 'str-u-ratio', t: 2, plate: 'stroma', b: 'DERIVED', src: ['10.1007/BF00386231'],
      q: 'With φ = vo/vc = 0.3, the leaf needs 3 + 3.5φ ATP and 2 + 2φ NADPH per carboxylation. What ATP to NADPH ratio is that?',
      o: [['About 1.56', 'Right. 4.05 ÷ 2.6 = 1.56. Photorespiration raises the ATP share, so even more cyclic flow is needed.'],
        ['Exactly 1.5', '1.5 is the ratio with no photorespiration.'],
        ['About 1.29', '1.29 is what linear electron flow supplies, not what the stroma needs.']], a: 0 },
    { id: 'str-u-aci', t: 2, plate: 'stroma', b: 'VERIFIED', src: ['10.1007/BF00386231', '10.1111/j.1365-3040.2007.01710.x'],
      q: 'On an A versus Ci curve, A rises steeply at low Ci, then bends and rises slowly. What limits the leaf above the bend?',
      o: [['Regeneration of RuBP, that is, the supply of ATP and NADPH from electron transport', 'Right. Above the bend more CO₂ helps only a little, because RuBP comes back no faster than the light reactions allow.'],
        ['Rubisco capacity', 'Rubisco limits the steep, low Ci part.'],
        ['Stomata', 'Ci is already inside the leaf; the curve is drawn against Ci to take stomata out of the picture.']], a: 0 },
    { id: 'str-u-lowo2', t: 2, plate: 'stroma', b: 'VERIFIED', src: ['10.1104/pp.59.1.86'],
      q: 'C3 leaves at 30 °C had a quantum yield of 0.052 in 21 % O₂ and 0.073 in 2 % O₂. What does the difference tell you?',
      o: [['About 30 % of light limited carbon gain was lost to O₂ (photorespiration) in normal air', 'Right. 1 − 0.052/0.073 ≈ 0.29.'],
        ['O₂ is needed for photosynthesis', 'Less O₂ gave more CO₂ fixed per photon, the opposite.'],
        ['The light reactions work better in low O₂', 'The thylakoid is not the difference; Rubisco’s choice of gas is.']], a: 0 },
    { id: 'str-u-greenhouse', t: 2, plate: 'stroma', b: 'VERIFIED', src: ['10.1093/jxb/erp096'],
      q: 'A grower raises greenhouse CO₂ from 420 to 1,000 ppm in bright light. Which two things happen in the stroma?',
      o: [['Oxygenation falls and the leaf moves up the A versus Ci curve until light (RuBP regeneration) limits', 'Right. Less photorespiration and more carboxylation, but the gain levels off at the shoulder.'],
        ['Rubisco stops working because it is saturated', 'Saturation means it works at full speed; RuBP supply then becomes the limit.'],
        ['ATP demand per CO₂ rises', 'With less photorespiration, ATP per CO₂ falls toward 3.']], a: 0 },
    { id: 'str-q-gm', t: 3, plate: 'stroma', b: 'VERIFIED', src: ['10.1111/j.1365-3040.2007.01710.x'],
      q: 'You fit FvCB to an A versus Ci curve assuming CO₂ at Rubisco equals Ci. Mesophyll conductance in that leaf is actually low. How is your Vcmax biased?',
      o: [['Too low: Rubisco really saw less CO₂ than Ci, so it was working harder than you credit', 'Right. The same A at a lower true Cc requires a larger Vcmax.'],
        ['Too high', 'Ignoring the drop from Ci to Cc makes Rubisco look slower, not faster.'],
        ['Not at all, Vcmax is independent of CO₂', 'The fit infers Vcmax from how A responds to CO₂ at Rubisco, so the CO₂ value matters.']], a: 0 },
    { id: 'str-q-bernacchi', t: 3, plate: 'stroma', b: 'UNVERIFIED', src: ['10.1111/j.1365-3040.2001.00668.x', '10.1104/pp.16.01846'],
      q: 'The Rubisco constants in this model were measured in tobacco. Why should a lettuce physiologist be careful using them?',
      o: [['Rubisco kinetics and their temperature responses differ among crops, and lettuce Rubisco is among the less heat sensitive', 'Right. Species specific constants change fitted Vcmax and the predicted photorespiration in heat.'],
        ['Tobacco is not a C3 plant', 'Tobacco is C3; the issue is that Rubisco itself varies.'],
        ['Constants never depend on temperature', 'They depend strongly on temperature; that is the point of the Bernacchi functions.']], a: 0 },
    { id: 'str-q-south', t: 3, plate: 'stroma', b: 'VERIFIED', src: ['10.1126/science.aat9077'],
      q: 'Tobacco with a synthetic glycolate shortcut grew more than 40 % more biomass in the field. What would you want to know before predicting the same gain for lettuce in Salinas?',
      o: [['How much photorespiration costs at Salinas temperatures and CO₂, and whether yield there is limited by carbon at all', 'Right. Cool coastal days mean less photorespiration to save; the gain should be smaller there than in a hot valley.'],
        ['Nothing, the pathway is universal', 'The benefit scales with how much photorespiration there is to remove.'],
        ['Whether lettuce has Rubisco', 'Every C3 crop has Rubisco; the question is the size of the loss.']], a: 0 },
    { id: 'str-q-tpu', t: 3, plate: 'stroma', b: 'VERIFIED', src: ['10.1111/j.1365-3040.2007.01710.x'],
      q: 'At very high Ci, A stops rising and does not increase when O₂ is lowered. Which limitation fits, and why does O₂ insensitivity point to it?',
      o: [['Triose phosphate use: sugar phosphates back up, phosphate for ATP synthesis runs short, and less photorespiration cannot help', 'Right. Neither Rubisco nor RuBP supply is limiting, so removing the O₂ competitor changes nothing.'],
        ['Rubisco: it is saturated', 'A Rubisco limited leaf responds strongly to lower O₂.'],
        ['Stomatal closure', 'The curve is against Ci, so stomata are already accounted for.']], a: 0 },
    { id: 'str-q-chaparral', t: 3, plate: 'stroma', b: 'DERIVED', src: ['10.1007/BF00386231'],
      q: 'A chaparral shrub at 40 °C with stomata nearly shut has a low Ci. Photorespiration is high. Which reading is best supported?',
      o: [['It loses carbon, but it also consumes ATP and NADPH and keeps electrons moving when CO₂ is scarce; whether that protection matters in the field is a question to test', 'Right. That is the careful claim: the cost is certain, the protective benefit is a hypothesis.'],
        ['Photorespiration is pure waste, so the shrub would be better off without it', 'Without the salvage pathway the phosphoglycolate carbon would be lost entirely; the pathway recovers three carbons in four.'],
        ['High photorespiration proves the leaf is healthy', 'It shows Rubisco is short of CO₂, nothing more.']], a: 0 }
  ].forEach(function (it) { if (!LP.quiz.items.some(function (x) { return x.id === it.id; })) LP.quiz.items.push(it); });

  LP._st = ST;
  LP.showme = LP.showme || {};
  LP.showme.stroma = [
    { at: '#str-live', fn: function () { LP.set({ T: 25, Ca: 420, O2: 21, ppfd: 1500, dcmu: false, uncoupler: false }); }, say: 'A sun leaf at 25 °C: three CO₂ in, one sugar unit out. Every ATP and NADPH comes up from the thylakoid below.', wait: 7000 },
    { at: '#str-live', fn: function () { LP.set({ T: 38 }); }, say: 'Heat it to 38 °C. Rubisco grabs O₂ more often: watch the broken pieces run to the peroxisome and the CO₂ puffs leave.', wait: 8500 },
    { at: '#str-live', fn: function () { LP.set({ O2: 2 }); }, say: 'Same heat, 2 % O₂: the O₂ cloud thins, photorespiration almost stops, and net uptake jumps.', wait: 7500 },
    { at: '#str-aci', fn: function () { LP.set({ T: 25, O2: 21, Ca: 1000 }); }, say: 'Greenhouse CO₂ at 1,000 ppm: the leaf climbs the A versus Ci curve until light limits.', wait: 7500 },
    { at: '#str-live', fn: function () { LP.set({ Ca: 420 }); }, say: 'Back to today’s air. Your turn: find the corner where photorespiration bites hardest.', wait: 4500 }
  ];


  /* ================================================================== LB14 (14 Oct): Light IV macro hero, Rubisco and the cycle
     Three.js r128 through LP.macro (lmacro.js). A glassy Rubisco (8 large subunits in two rings, 4 small caps above and
     below) sits on a glowing Calvin Benson ring. CO2 (dark grey C, two light grey O) drifts in and is fixed at the model carboxylation
     rate vc; O2 (two crimson O) is taken at the model oxygenation rate vo and leaves as a red two carbon packet toward
     photorespiration; ATP (orange) and NADPH (teal) arrive from the thylakoids above; three carbon packets ride the top of
     the ring, five carbon RuBP the bottom, at a speed set by the model cycle turns; G3P (green hexagons) leaves at net A / 3.
     ONE drawing scale (KS per µmol m⁻² s⁻¹) for every flux, so on screen ratios are model ratios. */
  /* slow and named round (13 Oct 2026, light stroma and leaf builder): molecule names in a macro hero, after the
     ANTI CLUTTER RULE of the Lead note. Identical copy in l_stroma.js and l_leafoptics.js (first one loaded wins).
     Each frame the hero calls add(kind, key, text, x, y, z, r) for every molecule that may carry a name (freshest
     first), then end(). Per kind: all are named while 6 or fewer are listed (opts.all) or at most 2 (1 on phones);
     a named molecule keeps its name until it leaves (key = the molecule's own object); a second name of the same kind
     goes to a molecule well away from the first (o.keepOnly: may keep a name but never get a new one); a name is shown only where it overlaps no other name, no label tag,
     the hook caption, the credit or a button. Tags are LP.macro.nameTag sprites (hidden when MolNames is off), sized
     for a constant on screen font (about 11 px at 1200, 10 px on phones), drawn UNDER the molecule. */
  LP.heroNames = LP.heroNames || function (ctx) {
    var T = ctx.THREE, MM = LP.macro, pools = {}, live = new Map(), prev = {}, items = [], blk = [], blkT = -1e9, v = new T.Vector3();
    function take(text) {
      var p = pools[text] = pools[text] || [], s = p.pop();
      if (!s) { s = MM.nameTag(T, text, { h: 0.3, depthTest: false }); s.userData.asp = s.scale.x / s.scale.y; ctx.root.add(s); }
      s.userData.hideName = false; return s;
    }
    function give(s) { s.visible = false; s.userData.hideName = true; (pools[s.userData.molName] = pools[s.userData.molName] || []).push(s); }
    function blockers() {
      var now = performance.now(); if (now - blkT < 300) return blk; blkT = now; blk = [];
      var st = ctx.wrap.querySelector('.mh-stage'); if (!st) return blk; var wr = st.getBoundingClientRect();
      Array.prototype.forEach.call(ctx.wrap.querySelectorAll('.mh-tag:not(.mh-hide),.mh-cap,.mh-credit,.mh-lbtn,.mh-pause,.mh-spd,.mh-slow:not([hidden])'), function (e) {
        var r = e.getBoundingClientRect(); if (r.width > 0) blk.push({ x: r.left - wr.left - 3, y: r.top - wr.top - 3, w: r.width + 6, h: r.height + 6 });
      });
      return blk;
    }
    function hit(a, b) { return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h; }
    return {
      begin: function () { items = []; },
      add: function (kind, key, text, x, y, z, r, o) { items.push({ k: kind, key: key, t: text, x: x, y: y, z: z, r: r || 0.15, all: !(o && o.all === false), q: o && o.q, keep: !!(o && o.keepOnly) }); },
      end: function () {
        var cam = ctx.camera, on = MM.namesOn ? MM.namesOn() : true, used = new Set();
        if (cam && on && ctx.w) {
          var tv = Math.tan(cam.fov * Math.PI / 360), px = ctx.narrow ? 15.5 : 17, placed = blockers().slice(), kinds = [], by = {}, next = {};
          items.forEach(function (it) { if (!by[it.k]) { by[it.k] = []; kinds.push(it.k); } by[it.k].push(it); });
          kinds.forEach(function (k) {
            var L = by[k], q = L[0].q || (L[0].all && L.length <= 6 ? 6 : (ctx.narrow ? 1 : 2)), chosen = [], old = prev[k] || [];
            L.forEach(function (it) {
              var d = cam.position.distanceTo(v.set(it.x, it.y, it.z)), ppu = ctx.h / (2 * d * tv), hh = px / ppu;
              it.hh = hh; it.wy = it.y - it.r - hh * 0.62;
              v.set(it.x, it.wy, it.z).project(cam);
              var sx = (v.x + 1) / 2 * ctx.w, sy = (1 - v.y) / 2 * ctx.h, asp = (it.t.length * 27 + 36) / 66;
              it.front = v.z < 1; it.box = { x: sx - px * asp / 2 - 2, y: sy - px / 2 - 2, w: px * asp + 4, h: px + 4 }; it.sx = sx; it.sy = sy;
            });
            function fits(it) { var b = it.box; if (!it.front || b.x < 4 || b.y < 4 || b.x + b.w > ctx.w - 4 || b.y + b.h > ctx.h - 4) return false; for (var i = 0; i < placed.length; i++) if (hit(b, placed[i])) return false; return true; }
            L.forEach(function (it) { if (old.indexOf(it.key) >= 0 && chosen.length < q) chosen.push(it); });
            L.forEach(function (it) {
              if (chosen.length >= q || chosen.indexOf(it) >= 0 || it.keep) return;
              for (var i = 0; i < chosen.length; i++) if (Math.hypot(chosen[i].sx - it.sx, chosen[i].sy - it.sy) < (ctx.narrow ? 60 : 90)) return;
              if (fits(it)) chosen.push(it);
            });
            next[k] = chosen.map(function (it) { return it.key; });
            chosen.forEach(function (it) {
              if (!fits(it)) return;
              placed.push(it.box);
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
      }
    };
  };
  var H4 = { ctx: null, K: 0.1 };
  function h4R() { return LP.result || {}; }
  function h4Ring(th, out) {
    var S = H4, c = S.C, Rr = S.Rr, tl = S.tilt;
    out[0] = c[0] + Rr * Math.cos(th); out[1] = c[1] + Rr * Math.sin(th) * Math.cos(tl); out[2] = c[2] - Rr * Math.sin(th) * Math.sin(tl);
    return out;
  }
  function h4Build(ctx) {
    var T = ctx.THREE, MM = LP.macro, root = ctx.root, far = ctx.far, S = H4, se = MM.superEllipsoid;
    S.T = T; S.C = [1.9, 0.1, 0]; S.Rr = 2.9; S.tilt = 0.5; S.acc = { c: 0, o: 0, atp: 0, nad: 0, g: 0 };
    var rnd = (function (s) { return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; })(97);
    S.rnd = rnd;
    /* Rubisco: L8S8 */
    var rub = new T.Group(); var rp = h4Ring(Math.PI, [0, 0, 0]); rub.position.set(rp[0], rp[1], rp[2]); root.add(rub); S.rub = rub; rub.scale.setScalar(0.98);
    var Lg = se(0.56, 0.62, 0.5, 0.6, 16, 12), Sg = se(0.4, 0.26, 0.4, 0.65, 12, 8);
    for (var i = 0; i < 8; i++) {
      var ring = i < 4 ? 1 : -1, a = (i % 4) * Math.PI / 2 + (ring < 0 ? Math.PI / 4 : 0);
      var m = new T.Mesh(Lg, MM.glass(T, (i % 2) ? 0x4f9a5a : 0x7cc184, { opacity: 0.55 }));
      m.position.set(Math.cos(a) * 0.72, ring * 0.5, Math.sin(a) * 0.72); m.rotation.y = -a; m.renderOrder = 2; rub.add(m);
      var s2 = new T.Mesh(Sg, MM.glass(T, 0xdfe9b8, { opacity: 0.6 }));
      if (i < 4) { s2.position.set(Math.cos(a + 0.4) * 0.55, 1.18, Math.sin(a + 0.4) * 0.55); } else { s2.position.set(Math.cos(a + 0.4) * 0.55, -1.18, Math.sin(a + 0.4) * 0.55); }
      s2.renderOrder = 2; rub.add(s2);
    }
    S.sites = [];
    for (var k = 0; k < 8; k++) { var ak = k * Math.PI / 4 + Math.PI / 8, gb = new T.Mesh(new T.SphereGeometry(0.07, 8, 6), MM.lin(new T.MeshBasicMaterial({ color: 0xffe08a }))); gb.position.set(Math.cos(ak) * 0.98, (k % 2 ? 0.18 : -0.18), Math.sin(ak) * 0.98); rub.add(gb); S.sites.push(gb); }
    S.siteGlow = MM.halos(T, 2, 0xffd060, 2.2); root.add(S.siteGlow.obj); S.siteGlow.mat.depthTest = false;
    S.oxGlow = MM.halos(T, 2, 0xff4a3a, 2.2); root.add(S.oxGlow.obj); S.oxGlow.mat.depthTest = false;
    S.siteT = 9; S.oxT = 9;
    /* the cycle ring with arrow heads */
    var ringG = new T.TorusGeometry(S.Rr, 0.075, 8, 120);
    S.ringMat = MM.lin(new T.MeshBasicMaterial({ color: 0xfff0b0, transparent: true, opacity: 0.55, depthWrite: false }));
    /* polish 14 Oct: the ring is drawn through the glass so Rubisco visibly sits ON it, at the carboxylation step */
    var ringM = new T.Mesh(ringG, S.ringMat); ringM.position.set(S.C[0], S.C[1], S.C[2]); ringM.rotation.x = S.tilt; ringM.renderOrder = 5; S.ringMat.depthTest = false; root.add(ringM);
    S.ringGlow = MM.halos(T, 60, 0xffe7a0, 0.8); root.add(S.ringGlow.obj);
    var tmp = [0, 0, 0];
    for (var g = 0; g < 60; g++) { h4Ring(g / 60 * Math.PI * 2, tmp); S.ringGlow.set(g, tmp[0], tmp[1], tmp[2]); }
    S.ringGlow.commit(); S.ringGlow.mat.opacity = 0.35;
    var coneG = new T.ConeGeometry(0.13, 0.32, 10), coneM = MM.lin(new T.MeshBasicMaterial({ color: 0xffe7a0 }));
    [Math.PI * 0.72, Math.PI * 0.28, -Math.PI * 0.25, -Math.PI * 0.7].forEach(function (th) {
      var p = h4Ring(th, [0, 0, 0]), q = h4Ring(th - 0.05, [0, 0, 0]), cm = new T.Mesh(coneG, coneM);
      cm.position.set(p[0], p[1], p[2]); var dir = new T.Vector3(q[0] - p[0], q[1] - p[1], q[2] - p[2]).normalize();
      cm.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir); root.add(cm);
    });
    /* far layer: thylakoid grana above, a starch grain, crowds of other Rubiscos */
    var discG = se(2.4, 0.26, 2.4, 0.35, 24, 10), discM = MM.glass(T, 0x3f8a46, { opacity: 0.6 });
    [[-5, 4.6, -9], [-5, 5.2, -9], [-5, 5.8, -9], [-5, 6.4, -9], [5.5, 5.0, -10], [5.5, 5.6, -10], [5.5, 6.2, -10]].forEach(function (p) { var mm = new T.Mesh(discG, discM); mm.position.set(p[0], p[1], p[2]); far.add(mm); });
    /* starch grain: an ovoid with concentric growth rings (polish 14 Oct; the old box read as a rendering artifact) */
    var sc = document.createElement('canvas'); sc.width = sc.height = 128; var sx = sc.getContext('2d');
    sx.fillStyle = '#ecd9a6'; sx.fillRect(0, 0, 128, 128);
    for (var gr = 0; gr < 14; gr++) { sx.strokeStyle = gr % 2 ? 'rgba(170,150,105,.35)' : 'rgba(255,250,235,.5)'; sx.lineWidth = 2.2; sx.beginPath(); sx.ellipse(52, 60, 6 + gr * 5.2, 5 + gr * 4.4, 0.3, 0, Math.PI * 2); sx.stroke(); }
    var stx = new T.CanvasTexture(sc); stx.encoding = T.sRGBEncoding;
    var starch = new T.Mesh(se(1.7, 1.15, 1.2, 1, 22, 16), MM.lin(new T.MeshStandardMaterial({ map: stx, color: 0xffffff, roughness: 0.45, transparent: true, opacity: 0.9 })));
    starch.position.set(8.2, -3.1, -9); starch.rotation.set(0.3, -0.9, 0.35); far.add(starch);
    var crowdG = se(0.9, 1.0, 0.9, 0.7, 10, 8), crowdM = MM.glass(T, 0x6fb878, { opacity: 0.45 });
    for (var c = 0; c < 9; c++) { var cm2 = new T.Mesh(crowdG, crowdM); cm2.position.set(-9 + rnd() * 18, -4 + rnd() * 7, -7 - rnd() * 7); far.add(cm2); }
    /* molecules */
    var sphG = new T.SphereGeometry(1, 8, 6);
    S.dummy = new T.Object3D();
    /* v19: CO2 and O2 with their identity rings (lmacro co2Geo / o2Geo, colours from molcolor.js) */
    var co2G = MM.co2Geo ? MM.co2Geo(T, 0.155) : MM.merge(T, [{ geo: sphG, color: 0x4a4f57, pos: [0, 0, 0], scale: 0.16 }, { geo: sphG, color: 0xd9402f, pos: [0.26, 0, 0], scale: 0.14 }, { geo: sphG, color: 0xd9402f, pos: [-0.26, 0, 0], scale: 0.14 }]);
    var o2G = MM.o2Geo ? MM.o2Geo(T, 0.14) : MM.merge(T, [{ geo: sphG, color: 0xd9402f, pos: [0.11, 0, 0], scale: 0.14 }, { geo: sphG, color: 0xd9402f, pos: [-0.11, 0, 0], scale: 0.14 }]);
    var vmat = function () { return MM.lin(new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.3 })); };
    function im(geo, mat, n) { var x = new T.InstancedMesh(geo, mat, n); x.frustumCulled = false; root.add(x); return x; }
    S.co2M = im(co2G, vmat(), 16); S.o2M = im(o2G, vmat(), 12);
    S.atpM = im(new T.OctahedronGeometry(1, 0), MM.lin(new T.MeshStandardMaterial({ color: 0xffad3a, emissive: 0xe8891a, emissiveIntensity: 0.8, roughness: 0.3 })), 24);
    S.atpGlow = MM.halos(T, 24, 0xffad3a, 0.8); root.add(S.atpGlow.obj);
    S.nadM = im(sphG, MM.lin(new T.MeshStandardMaterial({ color: 0x5fd3c7, emissive: 0x1f9e93, emissiveIntensity: 0.6, roughness: 0.3 })), 20);
    S.g3pM = im(new T.CylinderGeometry(0.3, 0.3, 0.12, 6), MM.lin(new T.MeshStandardMaterial({ color: 0x4fbf5f, emissive: 0x1f7f2f, emissiveIntensity: 0.6, roughness: 0.35 })), 10);
    S.g3pGlow = MM.halos(T, 10, 0x7dff7a, 1.2); root.add(S.g3pGlow.obj);
    S.beadM = im(sphG, MM.lin(new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35 })), 40);
    S.prM = im(sphG, MM.lin(new T.MeshStandardMaterial({ color: 0xe0503a, emissive: 0x902010, emissiveIntensity: 0.7, roughness: 0.35 })), 12);
    S.cols = { C: new T.Color(0x3a3f47).convertSRGBToLinear(), G: new T.Color(0x2f9f4f).convertSRGBToLinear(), R: new T.Color(0x5a5f69).convertSRGBToLinear(), P: new T.Color(0xf0a020).convertSRGBToLinear() };
    /* slow and named: the spent carriers go back up to the thylakoids as ADP (paler, smaller) and NADP+ (paler), one
       for each ATP and NADPH spent, so the recycling shows on the same scale */
    S.adpM = im(new T.OctahedronGeometry(1, 0), MM.lin(new T.MeshStandardMaterial({ color: 0xf3d3a0, emissive: 0x8a5a1a, emissiveIntensity: 0.35, roughness: 0.45, transparent: true, opacity: 0.8 })), 24);
    S.nadpM = im(sphG, MM.lin(new T.MeshStandardMaterial({ color: 0xb4e6df, emissive: 0x2f6f69, emissiveIntensity: 0.3, roughness: 0.45, transparent: true, opacity: 0.8 })), 20);
    S.co2 = []; S.o2 = []; S.atp = []; S.nad = []; S.g3p = []; S.pr = []; S.adp = []; S.nadp = []; S.ang = 0;
    S.hn = LP.heroNames(ctx);
    for (var q = 0; q < 10; q++) S.co2.push(h4Free('c'));
    for (q = 0; q < 6; q++) S.o2.push(h4Free('o'));
    var V = function (x, y, z) { return new T.Vector3(x, y, z); };
    ctx.setLabels([
      { id: 'rub', text: 'Rubisco', pos: V(rp[0], rp[1] + 1.6, rp[2]), tier: 1 },
      { id: 'co2', text: 'CO₂ from the air', pos: V(-4.6, -1.3, 1.2), tier: 1 },
      { id: 'g3p', text: 'G3P out: sucrose, starch', pos: h4V(T, 0, 0.6), narrow: false, tier: 1 },
      { id: 'red', text: 'ATP and NADPH spent', pos: h4V(T, Math.PI * 0.5, 0.75) },
      { id: 'rubp', text: 'RuBP rebuilt', pos: h4V(T, -Math.PI * 0.5, -0.5) },
      { id: 'pr', text: 'O₂ taken: photorespiration', pos: V(-2.6, -2.9, 0.8), narrow: false }
    ]);
    for (var pw = 0; pw < 80; pw++) h4Frame(ctx, pw * 0.05, 0.05);
    h4Live();
  }
  function h4V(T, th, dy) { var p = h4Ring(th, [0, 0, 0]); return new T.Vector3(p[0], p[1] + dy, p[2]); }
  function h4Free(kind) {
    var r = H4.rnd;
    return { k: kind, st: 'free', x: -6.8 + r() * 4, y: -3 + r() * 5.5, z: -2 + r() * 4, vx: 0.15 + r() * 0.2, vy: (r() - 0.5) * 0.2, vz: (r() - 0.5) * 0.2, rx: r() * 6, ry: r() * 6, u: 0 };
  }
  function h4Frame(ctx, t, dt) {
    var S = H4, T = S.T, res = h4R(), K = S.K, r = S.rnd, A = S.acc, i;
    if (!T) return;
    S.ctxNarrow = !!ctx.narrow;
    var rpos = S.rub.position;
    if (dt > 0) {
      A.c += (+res.vc || 0) * K * dt; A.o += (+res.vo || 0) * K * dt; A.atp += (+res.atpRate || 0) * K * dt; A.nad += (+res.nadphRate || 0) * K * dt;
      A.g += Math.max(0, +res.A || 0) / 3 * K * dt;
      var grab = function (list) { var best = -1, bd = 1e9; for (var j = 0; j < list.length; j++) { var m = list[j]; if (m.st !== 'free') continue; var d = Math.hypot(m.x - rpos.x, m.y - rpos.y, m.z - rpos.z); if (d < bd) { bd = d; best = j; } } return best; };
      while (A.c >= 1) { A.c--; var j = grab(S.co2); if (j >= 0) { S.co2[j].st = 'go'; S.co2[j].u = 0; S.co2[j].sx = S.co2[j].x; S.co2[j].sy = S.co2[j].y; S.co2[j].sz = S.co2[j].z; } }
      while (A.o >= 1) { A.o--; var jo = grab(S.o2); if (jo >= 0) { S.o2[jo].st = 'go'; S.o2[jo].u = 0; S.o2[jo].sx = S.o2[jo].x; S.o2[jo].sy = S.o2[jo].y; S.o2[jo].sz = S.o2[jo].z; } }
      while (A.atp >= 1) { A.atp--; if (S.atp.length < 24) { var th = Math.PI * (0.15 + r() * 0.7) * (r() < 0.67 ? 1 : -1); var p = h4Ring(th, [0, 0, 0]); S.atp.push({ x: p[0] + (r() - 0.5) * 2, y: 5.2, z: p[2] + (r() - 0.5) * 1.5, tx: p[0], ty: p[1], tz: p[2], u: 0 }); } }
      while (A.nad >= 1) { A.nad--; if (S.nad.length < 20) { var th2 = Math.PI * (0.25 + r() * 0.5); var p2 = h4Ring(th2, [0, 0, 0]); S.nad.push({ x: p2[0] + (r() - 0.5) * 2, y: 5.2, z: p2[2] + (r() - 0.5) * 1.5, tx: p2[0], ty: p2[1], tz: p2[2], u: 0 }); } }
      while (A.g >= 1) { A.g--; if (S.g3p.length < 10) { var p3 = h4Ring(0, [0, 0, 0]); S.g3p.push({ x: p3[0], y: p3[1], z: p3[2], vx: 0.7 + r() * 0.3, vy: -0.25 + (r() - 0.5) * 0.3, vz: (r() - 0.5) * 0.4, u: 0 }); } }
      [S.co2, S.o2].forEach(function (L) {
        for (var j2 = L.length - 1; j2 >= 0; j2--) {
          var m = L[j2];
          m.rx += dt * 0.7; m.ry += dt * 0.5;
          if (m.st === 'free') {
            m.vx += (r() - 0.5) * dt * 0.3; m.vy += (r() - 0.5) * dt * 0.3; m.vz += (r() - 0.5) * dt * 0.3;
            m.vx = Math.max(-0.1, Math.min(0.4, m.vx)); m.vy *= 0.99; m.vz *= 0.99;
            m.x += m.vx * dt; m.y += m.vy * dt; m.z += m.vz * dt;
            if (m.y < -3.4 || m.y > 2.8) m.vy *= -1; if (m.z < -2.5 || m.z > 2.5) m.vz *= -1;
            if (m.x > rpos.x - 1.6) { m.vx = -Math.abs(m.vx); }
            if (m.x < -7) { m.x = -7; m.vx = Math.abs(m.vx); }
          } else if (m.st === 'go') {
            m.u += dt * 0.9; var e = m.u * m.u * (3 - 2 * m.u), ex = rpos.x - 0.55, ey = rpos.y + 0.15, ez = rpos.z + 0.75;
            m.x = m.sx + (ex - m.sx) * e; m.y = m.sy + (ey - m.sy) * e; m.z = m.sz + (ez - m.sz) * e;
            if (m.u >= 1) {
              L.splice(j2, 1); L.push(Object.assign(h4Free(m.k), { x: -7, a: 0 }));
              if (m.k === 'c') S.siteT = 0; else { S.oxT = 0; if (S.pr.length < 12) S.pr.push({ x: ex, y: ey - 0.3, z: ez, u: 0 }); }
            }
          }
        }
      });
      S.siteT += dt; S.oxT += dt;
      for (i = S.atp.length - 1; i >= 0; i--) { var at = S.atp[i]; at.u += dt * 0.45; if (at.u >= 1) { S.atp.splice(i, 1); if (S.adp.length < 24) S.adp.push({ x: at.tx, y: at.ty, z: at.tz, sx: at.tx, sz: at.tz, dx: (r() - 0.5) * 2, dz: (r() - 0.5) * 1.2, u: 0 }); } }
      for (i = S.nad.length - 1; i >= 0; i--) { var nd = S.nad[i]; nd.u += dt * 0.45; if (nd.u >= 1) { S.nad.splice(i, 1); if (S.nadp.length < 20) S.nadp.push({ x: nd.tx, y: nd.ty, z: nd.tz, sx: nd.tx, sz: nd.tz, dx: (r() - 0.5) * 2, dz: (r() - 0.5) * 1.2, u: 0 }); } }
      [S.adp, S.nadp].forEach(function (Lr) { for (var ib = Lr.length - 1; ib >= 0; ib--) { var bq = Lr[ib], ty0 = Lr === S.adp ? 0 : 0.2; bq.u += dt * 0.4; var eb = bq.u * bq.u * (3 - 2 * bq.u); bq.y = (bq.y0 == null ? (bq.y0 = bq.y) : bq.y0) + (5.4 - bq.y0) * eb + ty0 * Math.sin(bq.u * 3); bq.x = bq.sx + bq.dx * eb; bq.z = bq.sz + bq.dz * eb; if (bq.u >= 1) Lr.splice(ib, 1); } });
      for (i = S.g3p.length - 1; i >= 0; i--) { var gg = S.g3p[i]; gg.u += dt * 0.28; gg.x += gg.vx * dt; gg.y += gg.vy * dt; gg.z += gg.vz * dt; if (gg.u >= 1) S.g3p.splice(i, 1); }
      for (i = S.pr.length - 1; i >= 0; i--) { var pq = S.pr[i]; pq.u += dt * 0.3; pq.x -= 0.6 * dt; pq.y -= 0.7 * dt; if (pq.u >= 1) S.pr.splice(i, 1); }
      // packets: one RuBP passes Rubisco per CO2 fixed, at the same drawing scale (6 packets on the ring)
      S.ang += dt * (+res.vc || 0) * K * Math.PI * 2 / 6;
      S.rub.rotation.y += dt * 0.12;
    }
    /* write */
    var D = S.dummy, tmp = [0, 0, 0], tmp2 = [0, 0, 0], n;
    function put(mesh, list, N, f) { for (var q = 0; q < N; q++) { var o = list[q]; if (o) f(o); else D.scale.setScalar(0); D.updateMatrix(); mesh.setMatrixAt(q, D.matrix); } mesh.instanceMatrix.needsUpdate = true; D.rotation.set(0, 0, 0); }
    put(S.co2M, S.co2, 16, function (m) { D.position.set(m.x, m.y, m.z); D.rotation.set(m.rx, m.ry, 0); D.scale.setScalar(m.a == null ? 1 : (m.a = Math.min(1, m.a + 0.02))); });
    put(S.o2M, S.o2, 12, function (m) { D.position.set(m.x, m.y, m.z); D.rotation.set(m.rx, m.ry, 0); D.scale.setScalar(m.a == null ? 1 : (m.a = Math.min(1, m.a + 0.02))); });
    put(S.atpM, S.atp, 24, function (m) { var e = m.u; D.position.set(m.x + (m.tx - m.x) * e, m.y + (m.ty - m.y) * e, m.z + (m.tz - m.z) * e); D.rotation.set(t * 2, t, 0); D.scale.setScalar(0.15 * (1 - Math.max(0, e - 0.85) / 0.15)); });
    for (i = 0; i < 24; i++) { var aq = S.atp[i]; if (aq) { var e2 = aq.u; S.atpGlow.set(i, aq.x + (aq.tx - aq.x) * e2, aq.y + (aq.ty - aq.y) * e2, aq.z + (aq.tz - aq.z) * e2); } else S.atpGlow.hide(i); }
    S.atpGlow.commit();
    put(S.nadM, S.nad, 20, function (m) { var e = m.u; D.position.set(m.x + (m.tx - m.x) * e, m.y + (m.ty - m.y) * e, m.z + (m.tz - m.z) * e); D.scale.setScalar(0.14 * (1 - Math.max(0, e - 0.85) / 0.15)); });
    put(S.g3pM, S.g3p, 10, function (m) { D.position.set(m.x, m.y, m.z); D.rotation.set(1.2, t * 0.8, 0.3); D.scale.setScalar(1 - Math.max(0, m.u - 0.75) / 0.25); });
    for (i = 0; i < 10; i++) { var gq = S.g3p[i]; if (gq) S.g3pGlow.set(i, gq.x, gq.y, gq.z); else S.g3pGlow.hide(i); }
    S.g3pGlow.commit();
    put(S.prM, S.pr, 12, function (m) { D.position.set(m.x, m.y, m.z); D.scale.setScalar(0.13 * (1 - Math.max(0, m.u - 0.7) / 0.3)); });
    put(S.adpM, S.adp, 24, function (m) { D.position.set(m.x, m.y, m.z); D.rotation.set(t * 1.5, t * 0.8, 0); D.scale.setScalar(0.115 * Math.min(1, m.u * 6) * (1 - Math.max(0, m.u - 0.75) / 0.25)); });
    put(S.nadpM, S.nadp, 20, function (m) { D.position.set(m.x, m.y, m.z); D.scale.setScalar(0.11 * Math.min(1, m.u * 6) * (1 - Math.max(0, m.u - 0.75) / 0.25)); });
    // carbon packets: 6 on the ring; 3 carbons on top (3-PGA, then G3P after the reduction), 5 carbons (RuBP) below
    n = 0;
    var turning = (+res.vc || 0) > 0;
    for (var pk = 0; pk < 6; pk++) {
      var th0 = Math.PI - S.ang - pk * Math.PI / 3; th0 = ((th0 % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2) - Math.PI;
      var top = th0 > 0, nb = top ? 3 : 5, col = top ? (th0 < Math.PI * 0.5 ? S.cols.G : S.cols.C) : S.cols.R;
      for (var b = 0; b < 5; b++) {
        if (b < nb && turning) { h4Ring(th0 + b * 0.075, tmp); D.position.set(tmp[0], tmp[1], tmp[2]); D.scale.setScalar(b === 0 ? 0.15 : 0.13); S.beadM.setColorAt(n, b === 0 && !top ? S.cols.P : col); }
        else { D.scale.setScalar(0); S.beadM.setColorAt(n, col); }
        D.updateMatrix(); S.beadM.setMatrixAt(n++, D.matrix);
      }
    }
    S.beadM.instanceMatrix.needsUpdate = true; if (S.beadM.instanceColor) S.beadM.instanceColor.needsUpdate = true;
    h4Names(t);
    var site = [rpos.x - 0.55, rpos.y + 0.15, rpos.z + 0.75];
    if (S.siteT < 0.6) { S.siteGlow.set(0, site[0], site[1], site[2]); S.siteGlow.mat.opacity = 1 - S.siteT / 0.6; } else S.siteGlow.hide(0);
    if (S.oxT < 0.6) { S.oxGlow.set(0, site[0], site[1], site[2]); S.oxGlow.mat.opacity = 1 - S.oxT / 0.6; } else S.oxGlow.hide(0);
    S.siteGlow.commit(); S.oxGlow.commit();
    S.ringMat.opacity = turning ? 0.5 + 0.1 * Math.sin(t * 2) : 0.18;
    S.ringGlow.mat.opacity = turning ? 0.35 : 0.08;
    if (dt > 0 && ((t * 4) | 0) !== S.lastLive) { S.lastLive = (t * 4) | 0; h4Live(); }
  }
  /* names (slow and named round): priority ATP, NADPH, then CO2 and O2 docking at Rubisco, G3P leaving, the ring packets
     (3‑PGA before the reduction arc, G3P after it, RuBP below), then ADP and NADP+ going back up */
  function h4Names(t) {
    var S = H4, hn = S.hn, i, o, tmp = [0, 0, 0]; if (!hn) return;
    hn.begin();
    function lerpP(m) { var e = m.u; return [m.x + (m.tx - m.x) * e, m.y + (m.ty - m.y) * e, m.z + (m.tz - m.z) * e]; }
    for (i = S.atp.length - 1; i >= 0; i--) { o = S.atp[i]; if (o.u < 0.82) { var pa = lerpP(o); hn.add('atp', o, 'ATP', pa[0], pa[1], pa[2], 0.17); } }
    for (i = S.nad.length - 1; i >= 0; i--) { o = S.nad[i]; if (o.u < 0.82) { var pn = lerpP(o); hn.add('nad', o, 'NADPH', pn[0], pn[1], pn[2], 0.16); } }
    S.co2.forEach(function (m) { if (m.st === 'go' && m.u < 0.92) hn.add('co2', m, 'CO₂', m.x, m.y, m.z, 0.18); });
    S.o2.forEach(function (m) { if (m.st === 'go' && m.u < 0.92) hn.add('o2', m, 'O₂', m.x, m.y, m.z, 0.16); });
    S.g3p.forEach(function (m) { if (m.u < 0.7) hn.add('g3p', m, 'G3P', m.x, m.y, m.z, 0.3); });
    if ((+h4R().vc || 0) > 0) for (var pk = 0; pk < 6; pk++) {
      var th0 = Math.PI - S.ang - pk * Math.PI / 3; th0 = ((th0 % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2) - Math.PI;
      var top = th0 > 0; h4Ring(th0 + (top ? 0.075 : 0.15), tmp);
      var pkT = top ? (th0 < Math.PI * 0.5 ? 'G3P' : '3‑PGA') : 'RuBP';
      /* fix round (Q S2): on phones one name per ring packet species (kind per species, quota 1) */
      hn.add(S.ctxNarrow ? 'pk' + pkT : 'pk', 'pk' + pk, pkT, tmp[0], tmp[1], tmp[2], 0.16, { q: S.ctxNarrow ? 1 : 6 });
    }
    for (i = S.adp.length - 1; i >= 0; i--) { o = S.adp[i]; if (o.u > 0.08 && o.u < 0.7) hn.add('adp', o, 'ADP', o.x, o.y, o.z, 0.13, { all: false, q: 1 }); }
    for (i = S.nadp.length - 1; i >= 0; i--) { o = S.nadp[i]; if (o.u > 0.08 && o.u < 0.7) hn.add('nadp', o, 'NADP⁺', o.x, o.y, o.z, 0.12, { all: false, q: 1 }); }
    hn.end();
  }
  function h4Camera(ctx, t) {
    var cam = ctx.camera, asp = ctx.w / ctx.h, tv = Math.tan(cam.fov * Math.PI / 360);
    var halfW = ctx.narrow ? 4.3 : 6.9, halfH = ctx.narrow ? 5.0 : 4.6;
    var D = Math.max(halfW / (tv * asp), halfH / tv) + 2;
    var yaw = 0.3 * Math.sin(t * 0.06), pitch = 0.16 + 0.05 * Math.sin(t * 0.05 + 2);
    var tx = ctx.narrow ? -0.4 + 2.6 * Math.sin(t * 0.055 - 0.5) : -0.2, ty = ctx.narrow ? 1.0 : 0.85;
    cam.position.set(tx + Math.sin(yaw) * Math.cos(pitch) * D, ty + Math.sin(pitch) * D, Math.cos(yaw) * Math.cos(pitch) * D);
    cam.lookAt(tx, ty, 0);
    ctx.scene.fog.near = D - 2; ctx.scene.fog.far = D + 16; ctx.farScene.fog.near = D; ctx.farScene.fog.far = D + 20;
  }
  function h4Live() {
    if (!H4.ctx || !H4.ctx.setLive) return;
    var r = h4R(), lim = { Rubisco: 'Rubisco', 'RuBP regeneration': 'light (RuBP)', ATP: 'ATP supply', dark: 'darkness', blocked: 'blocked' }[r.limit] || r.limit || '';
    var s = 'CO₂ ' + num(+r.vc || 0, 1) + ' · O₂ ' + num(+r.vo || 0, 1) + ' · net A ' + num(+r.A || 0, 1) + ' µmol m⁻² s⁻¹' + (lim ? ' · ' + lim + ' limits' : '');
    if (!((+r.vc || 0) > 0)) s = 'The cycle has stopped: ' + (lim || 'no ATP or NADPH') + ' · net A ' + num(+r.A || 0, 1) + ' µmol m⁻² s⁻¹';
    H4.ctx.setLive(s);
  }
  function h4Init(host) {
    if (!host || H4.ctx || !LP.macro) return;
    H4.ctx = LP.macro.hero(host, {
      id: 'str-hero', seed: 59, fov: 30, exposure: 1.0,
      lift: function (ctx) { return ctx.narrow ? 64 : 46; },
      palette: { light: { top: '#22341c', mid: '#47643a', bot: '#7d9a5c', bokeh: ['#eef6c8', '#a7c46c', '#f6e7b0', '#cfe6a0'], fog: 0x47643a, fg: 'rgba(200,226,160,.5)' },
        dark: { top: '#05090a', mid: '#0e1d16', bot: '#15291e', bokeh: ['#2f6f43', '#305b2c', '#7a6a2c', '#3c7a4a'], fog: 0x0e1d16, fg: 'rgba(70,130,80,.45)' } },
      label: 'Three dimensional view of the chloroplast stroma: a glassy Rubisco made of eight large and eight small subunits sits on a glowing ring, the Calvin Benson cycle. Carbon dioxide molecules drift in and are joined to the cycle at Rubisco; now and then Rubisco takes an oxygen molecule instead and a red two carbon piece leaves for photorespiration. Orange ATP and teal NADPH arrive from the thylakoids above, and paler ADP and NADP⁺ rise back to them to be recharged. Three carbon pieces travel over the top of the ring and five carbon RuBP along the bottom; green G3P hexagons leave on the right.',
      question: 'How does a leaf build sugar out of air?',
      answer: 'Rubisco joins each CO<sub>2</sub> to a five carbon sugar, RuBP, and the product splits into two three carbon molecules. ATP and NADPH from the thylakoids turn those into G3P, and more ATP rebuilds RuBP so the ring keeps turning: <b>3 CO<sub>2</sub> in, 1 G3P out, for 9 ATP and 6 NADPH</b>. Sometimes Rubisco grabs O<sub>2</sub> instead (red flash), and that carbon goes to photorespiration. Warm the leaf or lower the CO<sub>2</sub> below and watch the red flashes grow; every flux in the scene is drawn at one scale from the model.',
      credit: { text: 'Farquhar, von Caemmerer & Berry · Planta 1980', doi: '10.1007/BF00386231' },
      height: function (w) { return w < 600 ? 530 : Math.round(Math.min(680, Math.max(460, w * 0.66))); },
      fallbackNote: 'This 3D scene needs WebGL, which this browser does not offer. The drawing in 4.1 below shows the same cycle at the same rates.',
      build: h4Build, frame: h4Frame, camera: h4Camera,
      /* LOOK CLOSER (controls engineer, 14 Oct 2026): Rubisco sits on the ring at angle pi, (−1.0, 0.1, 0); ring centre (1.9, 0.1, 0) */
      focus: [
        { id: 'rub', label: 'Rubisco', target: [-1.0, 0.3, 0], dist: 6, theta: -0.3, phi: 1.25 },
        { id: 'cyc', label: 'The cycle', target: [1.9, 0.1, 0], dist: 13, theta: 0.15, phi: 0.95 },
        { id: 'g3p', label: 'Sugar out (G3P)', target: [4.6, 0.4, 0], dist: 7, theta: 0.45, phi: 1.3 }
      ]
    });
    h4Live();
    U().onPrefs(function () { if (H4.ctx && H4.ctx.retheme) H4.ctx.retheme(); });
  }

  LP.panels.push({
    id: 'stroma', mount: mount, update: update,
    show: function () { if (A1) { A1.resize(); A1.kick(); } renderPlots(LP.result, true); if (H4.ctx) { h4Live(); H4.ctx.invalidate(); } },
    hide: function () {}
  });
})();

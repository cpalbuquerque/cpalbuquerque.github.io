/* Light to Sugar: "The chloroplast: one machine, two halves" (team chloro, v18). Opens Plate III.
   One three.js r128 chloroplast (one renderer): double envelope cut open, grana joined by stroma lamellae, starch, the
   Calvin cycle in the stroma. LIGHT / CARBON / BOTH light up one half or the whole machine. The SAME ATP and NADPH
   carrier objects loop membrane -> stroma -> Calvin cycle -> back as ADP and NADP+ (never spawned in the stroma).
   Linked panes: a live cross section of one granum (one continuous lumen filling with protons, lumen pH), a loop map
   that draws the very same carriers, a light response plot, counters. One light slider (LP.set ppfd, the Conditions
   light) moves every plate; the membrane slider is local to this workstation (LP.solve on a copy of LP.state).
   Mounts itself at the top of Plate III by wrapping the 'thylakoid' panel's mount (no edit to l_thylakoid.js) and adds
   one line to Plate IV the same way. Debug handle: window.CHL. */
(function () {
  'use strict';
  var LP = window.LP = window.LP || {};
  LP.evidence = LP.evidence || {}; LP.sources = LP.sources || {};
  var MINUS = '−', TAU = Math.PI * 2, Q = 16, NA = 15, NN = 10;
  function clamp(x, a, b) { return x < a ? a : (x > b ? b : x); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function U() { return LP.ui || {}; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fmt(x, d) {
    if (x == null || !isFinite(x)) return 'n/a';
    var s = Number(Math.abs(x).toFixed(d || 0)).toLocaleString('en-US', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
    return (x < 0 && +s.replace(/,/g, '') !== 0 ? MINUS : '') + s;
  }
  function hash(i) { var x = Math.sin(i * 12.9898 + 4.1) * 43758.5453; return x - Math.floor(x); }
  function badge(k) { return U().badge ? U().badge(k) : '<span class="badge">' + esc(k) + '</span>'; }
  function ev(k, l) { return U().ev ? U().ev(k, l) : ''; }
  function dark() { return U().isDark ? U().isDark() : false; }
  function reduced() { return U().reducedMotion ? U().reducedMotion() : false; }

  /* ------------------------------------------------------------ evidence (verified sources file, 28 Oct 2026) */
  var EV = {
    'chl.network': { claim: 'The thylakoids of one chloroplast form one interconnected membrane network that encloses a single continuous lumen; grana and stroma lamellae are joined, not separate sealed bags.', cite: 'Shimoni E, Rav-Hon O, Ohad I, Brumfeld V, Reich Z (2005) Plant Cell 17:2580 to 2586; Austin JR, Staehelin LA (2011) Plant Physiol 155:1601 to 1611', doi: '10.1105/tpc.105.035030', doi2: '10.1104/pp.110.170647', measured: 'electron tomography of chloroplast thylakoids', badge: 'VERIFIED', note: 'The two papers disagree on how the sheets join the stacks (bifurcations versus junctional slits), not on the single connected lumen.' },
    'chl.slits': { claim: 'Grana and stroma thylakoids are joined through junctional slits; the slit size may regulate the flow of ions between the two domains.', cite: 'Austin JR, Staehelin LA (2011) Plant Physiol 155:1601 to 1611', doi: '10.1104/pp.110.170647', measured: 'electron tomography', value: 'slits about 15 × 30 to 15 × 435 nm', badge: 'MEASURED', note: '' },
    'chl.wind': { claim: 'The stroma membranes wind around the granum; many textbook 3D models of the granum are erroneous.', cite: 'Mustárdy L, Garab G (2003) Trends Plant Sci 8:117 to 122', doi: '10.1016/S1360-1385(03)00015-3', measured: 'review of 3D models (abstract read)', badge: 'VERIFIED', note: 'This workstation draws the joins simply; the real sheets wind around each stack.' },
    'chl.width': { claim: 'The granal lumen is about 4.7 nm wide in the dark and about 9.2 nm after strong light.', cite: 'Kirchhoff H et al. (2011) Proc Natl Acad Sci USA 108:20248 to 20253', doi: '10.1073/pnas.1104141109', measured: 'Arabidopsis grana; dark adapted versus 500 µmol photons m−2 s−1 for 30 min', value: '4.7 ± 0.8 nm dark; 9.2 ± 0.6 nm light; grana 300 to 600 nm across', badge: 'MEASURED', note: 'The paper is about protein diffusion in the lumen, not pH. The drawing here widens the lumen with light as a sketch, not a measured curve.' },
    'chl.volarea': { claim: 'A flat lumen w wide between two membranes holds w/2 of volume per unit membrane area: little volume for a lot of membrane, so pumped protons change its pH quickly.', cite: 'Geometry (a model simplification; no paper states it in these words)', measured: 'none', value: '4.7 nm → about 2.4 µL per m² of membrane; 9.2 nm → about 4.6 µL per m²', badge: 'DERIVED', note: 'The pH change per proton also depends on buffering, which is large (Wille 1988).' },
    'chl.buffer': { claim: 'The lumen is strongly buffered: lumen proteins and other groups take up part of the pumped protons.', cite: 'Wille B (1988) Biochim Biophys Acta 936:513 to 530', doi: '10.1016/0005-2728(88)90028-X', measured: 'spin label techniques on isolated thylakoids (abstract read through an index)', value: 'buffering capacity about 100 mM in buffer impermeable thylakoids', badge: 'MEASURED', note: '' },
    'chl.granum': { claim: 'A granum holds about 5 to 15 thylakoids in plants grown in full sun and up to about 100 in deep shade plants.', cite: 'Austin JR, Staehelin LA (2011) Plant Physiol 155:1601 to 1611 (the shade value cites Anderson et al. 1973, Alocasia)', doi: '10.1104/pp.110.170647', measured: 'review statement inside a tomography paper', badge: 'SECONDARY', note: 'No source was found for the number of grana per chloroplast, so none is given here. The stacks drawn here are a sketch.' },
    'chl.hatp': { claim: 'The chloroplast ATP synthase rotor has 14 c subunits, so one turn moves 14 protons and makes 3 ATP: about 4.7 protons per ATP. Measurements give a slightly lower value, about 4.', cite: 'Vollmar M et al. (2009) J Biol Chem 284:18228 to 18235; Petersen J et al. (2012) Proc Natl Acad Sci USA 109:11150 to 11155', doi: '10.1074/jbc.M109.006916', doi2: '10.1073/pnas.1202799109', measured: 'spinach c ring by x ray (Vollmar); thermodynamic H+/ATP of the chloroplast enzyme (Petersen)', value: '14/3 = 4.67 (DERIVED); 3.9 ± 0.3 H+ per ATP (MEASURED)', badge: 'MEASURED', note: 'Seelert et al. 2000 (Nature 405:418) first counted 14 subunits. The engine uses 14/3 by default; Plate III Expert can switch it.' },
    'chl.calvin': { claim: 'Per 3 CO2: 3 RuBP + 3 CO2 give 6 PGA; reducing them uses 6 ATP and 6 NADPH and gives 6 triose P; 1 leaves; 5 are rebuilt into 3 RuBP using 3 ATP. Total 9 ATP and 6 NADPH per triose P exported.', cite: 'Stoichiometry of the Calvin Benson cycle; Raines CA (2003) Photosynth Res 75:1 to 10 reviews the cycle', doi: '10.1023/A:1022421515027', measured: 'stoichiometry', badge: 'DERIVED', note: 'Three turns fix three CO2; it is not six turns per triose.' },
    'chl.photoresp': { claim: 'Rubisco, the enzyme that fixes CO2, can also grab O2 instead. That side reaction uses O2 and makes a product the plant must recycle (photorespiration).', cite: 'Bauwe H, Hagemann M, Fernie AR (2010) Trends Plant Sci 15:330 to 336', doi: '10.1016/j.tplants.2010.03.006', measured: 'review (abstract read)', badge: 'VERIFIED', note: 'Plate IV models it. The O2 drawn here leaves; this scene does not show Rubisco taking it.' },
    'chl.perco2': { claim: 'ATP and NADPH per CO2 fixed by Rubisco = (3 + 3.5 φ) and (2 + 2 φ), where φ = O2 reactions per CO2 reaction (vo/vc). With φ = 0 this is the 3 ATP and 2 NADPH of the cycle alone; the extra pays for recycling the product of Rubisco reacting with O2.', cite: 'Farquhar GD, von Caemmerer S, Berry JA (1980) Planta 149:78 to 90 (stoichiometry used by the engine); Bauwe et al. (2010) for photorespiration', doi: '10.1007/BF00386231', doi2: '10.1016/j.tplants.2010.03.006', measured: 'stoichiometry; φ from the engine at the current conditions', badge: 'DERIVED', note: 'φ itself is a model value (Light IV shows it).' },
    'chl.membrane': { claim: 'Membrane amount here scales the photosystems (light caught) and the electron transport and ATP synthase capacity (Jmax, the top rate of electron transport) together; Rubisco in the stroma is unchanged. Only this workstation uses it; other plates keep the full membrane.', cite: 'Teaching model on the Plate engine (LP.solve on a copy of the leaf state)', measured: 'none', value: 'ppfd × f, Jmax25 × f', badge: 'ILLUSTRATIVE', note: '' },
    'chl.beads': { claim: 'Each bead stands for many molecules: one bead per second stands for 16 µmol m−2 s−1 of leaf. Bead speed follows the engine rates, so the bead counts keep the engine ratios: the cycle itself needs 3 ATP and 2 NADPH per CO2, and photorespiration adds more (about 4.2 ATP and 2.7 NADPH per CO2 at full sun in normal air in this model, with its mesophyll conductance).', cite: 'Drawing scale', measured: 'none', value: '16 µmol m−2 s−1 per bead s−1', badge: 'ILLUSTRATIVE', note: 'Not to scale: proteins are drawn hundreds of times larger than the chloroplast would allow, and one Rubisco stands for very many.' }
  };
  Object.keys(EV).forEach(function (k) { if (!LP.evidence[k]) LP.evidence[k] = EV[k]; });
  [['10.1105/tpc.105.035030', 'Shimoni et al. 2005, Plant Cell 17:2580'], ['10.1104/pp.110.170647', 'Austin and Staehelin 2011, Plant Physiol 155:1601'],
   ['10.1016/S1360-1385(03)00015-3', 'Mustárdy and Garab 2003, Trends Plant Sci 8:117'], ['10.1073/pnas.1104141109', 'Kirchhoff et al. 2011, PNAS 108:20248'],
   ['10.1016/0005-2728(88)90028-X', 'Wille 1988, Biochim Biophys Acta 936:513'], ['10.1074/jbc.M109.006916', 'Vollmar et al. 2009, J Biol Chem 284:18228'],
   ['10.1073/pnas.1202799109', 'Petersen et al. 2012, PNAS 109:11150'], ['10.1023/A:1022421515027', 'Raines 2003, Photosynth Res 75:1'],
   ['10.1016/j.tplants.2010.03.006', 'Bauwe et al. 2010, Trends Plant Sci 15:330']].forEach(function (s) { if (!LP.sources[s[0]]) LP.sources[s[0]] = s[1]; });

  /* ------------------------------------------------------------ the parts (about 40 words each) */
  var PARTS = {
    outer: ['Outer envelope', 'The outer skin of the chloroplast', 'The outer of two membranes wrapped around the chloroplast. It faces the watery cytosol of the leaf cell. Small molecules pass it fairly easily; the real gatekeeper is the inner envelope just inside it.'],
    inner: ['Inner envelope', 'Just inside the outer envelope', 'The inner of the two envelope membranes. Its transporters decide what enters and leaves the stroma: triose phosphate (a small three carbon sugar) made by the Calvin cycle leaves through it in exchange for phosphate. It is separate from the thylakoids inside.'],
    stroma: ['Stroma', 'The fluid filling the chloroplast', 'The watery space around the thylakoids. The Calvin cycle runs here: Rubisco fixes CO₂, and the ATP and NADPH made at the membranes are spent to turn it into sugar. Starch grains and the chloroplast’s own DNA sit here too.'],
    membrane: ['Thylakoid membrane', 'Inside the stroma, folded into stacks and sheets', 'One continuous folded membrane inside the chloroplast. It holds the light machines: photosystems (protein machines that catch light), cytochrome b₆f (a complex that passes electrons on and pumps protons) and ATP synthase. It wraps one shared inner space, the lumen. Folding packs a huge area of membrane around a very thin space.'],
    granum: ['Granum', 'A stack of thylakoid discs', 'A stack of flat thylakoid discs, like a pile of coins, about 300 to 600 nm across. Sun leaves have about 5 to 15 discs per stack, deep shade plants up to about 100. Flat sheets, the stroma lamellae (unstacked membrane sheets running through the stroma), join the stacks into one network.'],
    lumen: ['Lumen', 'Inside the thylakoid membrane', 'The thin space inside the thylakoid membrane, about 5 nm wide in the dark and about 9 nm in light. It is one continuous space. Pumped protons collect here, so its pH falls in light, and they leave through ATP synthase.'],
    psii: ['Photosystem II', 'In the membrane, mostly in the stacked grana', 'A protein complex that uses light to pull electrons from water. Water splits into O₂, which leaves, protons, which stay in the lumen, and electrons, which travel on through the membrane toward photosystem I.'],
    psi: ['Photosystem I', 'In the membrane, mostly where it faces the stroma', 'A protein complex that gives electrons a second push of light energy, high enough to make NADPH from NADP⁺ on the stroma side. It also runs cyclic flow (electrons sent back around photosystem I to pump extra protons), which tops up ATP.'],
    synthase: ['ATP synthase', 'In the membrane where it faces the stroma', 'A rotary motor. Protons flow from the lumen back out to the stroma through it and turn its rotor. One full turn moves 14 protons and makes 3 ATP from ADP and phosphate. The ATP is released into the stroma.'],
    rubisco: ['Rubisco', 'An enzyme in the stroma', 'The enzyme that fixes carbon: it joins CO₂ to RuBP, the first step of the Calvin cycle. It is a protein, not a sugar. It can also grab O₂ instead of CO₂, a costly side reaction called photorespiration (Light IV).'],
    rubp: ['RuBP', 'A sugar carried round the Calvin cycle', 'Ribulose bisphosphate, the five carbon sugar that accepts CO₂. It is not an enzyme: Rubisco is the enzyme that joins CO₂ to it. The cycle spends ATP to rebuild RuBP so it can take the next CO₂.'],
    starch: ['Starch grain', 'In the stroma', 'A store of starch built from part of the sugar the Calvin cycle makes by day. At night the chloroplast breaks it down and sends sugar out, so the leaf and the rest of the plant keep being fed in the dark.']
  };
  var PART_EV = { lumen: ['chl.width', 'chl.network'], granum: ['chl.granum', 'chl.width'], membrane: ['chl.network'], synthase: ['chl.hatp'], rubisco: ['chl.photoresp'], rubp: ['chl.calvin'] };

  /* ------------------------------------------------------------ state */
  var S = {
    mode: 'both', f: 1, frozen: false, names: true, tm: 0, res: null, rt: null, pick: -1, hl: null,
    cnt: { atp: 0, spent: 0, nadph: 0, co2: 0, turns: 0 }, rot: 0, ring: 0, acc: { o2: 0, e: 0, co2: 0, tri: 0 }, dirty: true
  };
  var C = [];  /* carriers: {type:'atp'|'nadph', k, ph, st} */
  (function () {
    var i;
    for (i = 0; i < NA; i++) C.push({ type: 'atp', k: i, ph: hash(i + 3), st: i % 3 === 2 ? 330 : 205 + (i % 3) * 8 });
    for (i = 0; i < NN; i++) C.push({ type: 'nadph', k: i, ph: hash(i + 40), st: 195 + (i % 2) * 14 });
  })();
  function charged(c) { return c.ph >= 0.1 && c.ph < 0.55; }
  function cname(c) { return c.type === 'atp' ? (charged(c) ? 'ATP' : 'ADP') : (charged(c) ? 'NADPH' : 'NADP⁺'); }

  function localState(st, f) {
    var o = JSON.parse(JSON.stringify(st || {})), P = LP.P || {};
    var V = +st.Vcmax25 > 0 ? +st.Vcmax25 : ((P.Vcmax25 || {})[st.leaf === 'shade' ? 'shade' : 'sun'] || 60);
    var J = +st.Jmax25 > 0 ? +st.Jmax25 : (P.JmaxRatio || 1.7) * V;
    o.Vcmax25 = V; o.Jmax25 = J * f; o.ppfd = Math.max(0, +st.ppfd || 0) * f;
    if (o.mix) Object.keys(o.mix).forEach(function (k) { o.mix[k] = (+o.mix[k] || 0) * f; });
    return o;
  }
  function model() {
    if (S.f >= 0.999 || !LP.solve) return LP.result || {};
    try { return LP.solve(localState(LP.state, S.f)); } catch (e) { return LP.result || {}; }
  }
  function rates(r) {
    r = r || {};
    var atp = Math.max(0, r.atpRate || 0), nad = Math.max(0, r.nadphRate || 0);
    return {
      atp: atp, spent: Math.min(atp, Math.max(0, r.atpDemand || 0)), nadph: nad, vc: Math.max(0, r.vc || 0), vo: Math.max(0, r.vo || 0),
      A: r.A || 0, o2: Math.max(0, r.o2Rate || 0), J: Math.max(0, r.Jused || 0), hp: Math.max(0, r.hPlus || 0),
      pH: isFinite(r.lumenPH) ? r.lumenPH : 7.2, spH: isFinite(r.stromaPH) ? r.stromaPH : 7.2, hz: r.rotorHz || 0,
      perCO2: r.vc > 0 ? r.atpDemand / r.vc : null
    };
  }
  function acid(pH) { return clamp((7.5 - pH) / 1.8, 0, 1); }
  function refresh() { S.res = model(); S.rt = rates(S.res); S.dirty = true; }

  /* ------------------------------------------------------------ CSS */
  var CSS = '\
.chl{margin:0 0 22px}\
.chl .chl-what{margin:0 0 6px;max-width:60em}\
.chl .chl-todo{font-family:var(--ui);font-size:14.5px;line-height:1.45;margin:0 0 10px;padding:7px 11px;background:var(--card);border-left:4px solid var(--accent);max-width:60em}\
.chl-grid{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(0,1fr);gap:12px;align-items:start}\
.chl-3d{min-width:0;border-radius:12px;overflow:hidden;background:#0d1610}\
.chl-stage{position:relative;height:500px;overflow:hidden;background:radial-gradient(120% 95% at 50% 38%,#29482f 0%,#13231a 55%,#0b130e 100%)}\
.chl-gl{position:absolute;inset:0;z-index:2}\
.chl-gl canvas{display:block;width:100%!important;height:100%!important}\
.chl-svg{position:absolute;inset:0;width:100%;height:100%;z-index:2}\
.chl-svg [data-part]{cursor:pointer}\
.chl-svg [data-part]:hover{filter:brightness(1.25)}\
.chl-tags{position:absolute;inset:0;pointer-events:none;z-index:5}\
.chl-tag{position:absolute;transform:translate(-50%,-100%);margin-top:-6px;font:500 11.5px/1.2 var(--ui);color:#f4f1e8;background:rgba(12,18,14,.78);border:1px solid rgba(255,255,255,.22);border-radius:999px;padding:2px 8px;white-space:nowrap}\
.chl-tag.pk{background:#ffd479;color:#1b1608;border-color:#fff2c8;font-weight:600;z-index:2}\
.chl-tag[hidden]{display:none}\
.chl-frz{position:absolute;z-index:6;top:10px;left:10px;font:600 12px/1.2 var(--ui);color:#1b1608;background:#ffd479;border-radius:999px;padding:5px 11px}\
.chl-key{position:absolute;z-index:6;left:10px;bottom:8px;font:500 11px/1.3 var(--ui);color:#dfe8d3;background:rgba(12,18,14,.7);border-radius:8px;padding:4px 8px;max-width:calc(100% - 20px)}\
.chl-key i{display:inline-block;width:9px;height:9px;margin:0 3px 0 8px;vertical-align:-1px}\
.chl-key i:first-child{margin-left:0}\
.chl-3d .wp-molkey{--mol-h2o:#80dfff;--mol-co2:#cfd3d8;--mol-o2:#dd3c3c;--mol-h2o-h:#b3e9ff;--mol-co2-c:#8a9098;--mol-co2-o:#d9dce0;--mol-rim:rgba(0,0,0,.55);margin:0;padding:2px 12px 10px;color:#dfe8d3}.chl-3d .wp-molkey b,.chl-3d .wp-molkey-l{color:#f4f1e8}\
.chl-panel{position:absolute;z-index:8;left:8px;right:8px;top:8px;max-height:30%;overflow:auto;background:#faf6ec;color:#2a231c;border:1px solid #c4b597;border-radius:10px;padding:10px 12px 11px;font:400 12.5px/1.38 var(--ui);box-shadow:0 10px 30px -12px rgba(0,0,0,.6)}\
.chl-panel h4{display:inline;margin:0 8px 0 0;font:600 14.5px/1.25 var(--ui)}\
.chl-panel.B{top:auto;bottom:8px}\
.chl-panel .wh{display:inline;margin:0;font-size:12px;color:#5e5141;font-style:italic}\
.chl-panel p{margin:0}.chl-panel p.tx{margin:3px 28px 0 0}\
.chl-panel .evs{margin-left:6px}\
.chl-panel .x{position:absolute;right:6px;top:6px;width:30px;height:30px;border:0;background:none;font:400 20px/1 var(--ui);color:#2a231c;cursor:pointer;border-radius:6px}\
.chl-panel .x:focus-visible{outline:2px solid #2b5fa4}\
.chl-bar{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:7px 10px;background:#141c16;border-top:1px solid rgba(214,232,190,.18)}\
.chl-bar .mh-ctl{padding:0;border:0;background:none;flex:1 1 100%}\
.chl-b{font:500 12.5px/1.2 var(--ui);color:#f4f1e8;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.34);border-radius:999px;padding:5px 12px;min-height:32px;cursor:pointer}\
.chl-b:hover{background:rgba(255,255,255,.14)}\
.chl-b[aria-pressed="true"]{background:#f4f1e8;color:#14201a;border-color:#f4f1e8}\
.chl-b:focus-visible{outline:2px solid #ffd479;outline-offset:2px}\
.chl-b[hidden]{display:none}\
.chl-side{display:flex;flex-direction:column;gap:8px;min-width:0;font-family:var(--ui)}\
.chl-modes{display:flex;border:1px solid var(--rule);border-radius:999px;overflow:hidden}\
.chl-modes button{flex:1;font:600 13px/1 var(--ui);letter-spacing:.06em;min-height:40px;border:0;background:var(--paper);color:var(--ink);cursor:pointer}\
.chl-modes button+button{border-left:1px solid var(--rule)}\
.chl-modes button[aria-pressed="true"]{background:var(--plaque);color:var(--plaque-ink)}\
.chl-modes button:focus-visible{outline:2px solid var(--accent);outline-offset:-3px}\
.chl-c{background:var(--card);border:1px solid var(--rule2);border-radius:6px;padding:6px 10px 8px}\
.chl-c label{display:flex;justify-content:space-between;gap:8px;font-size:12px;letter-spacing:.04em;text-transform:uppercase;color:var(--ink2)}\
.chl-c output{font:500 13px var(--mono);text-transform:none;letter-spacing:0;color:var(--ink);white-space:nowrap}\
.chl-c input[type=range]{width:100%;margin:6px 0 0}\
.chl-c .h{font-size:11.5px;color:var(--ink3);margin-top:2px;line-height:1.3}\
.chl-c select{width:100%;margin-top:5px;min-height:38px;font:14px var(--ui);background:var(--paper);color:var(--ink);border:1px solid var(--rule);border-radius:4px}\
.chl-now{margin:0;font-size:14px;line-height:1.45;padding:7px 10px;background:var(--card);border:1px solid var(--rule);border-left:4px solid var(--accent);border-radius:4px}\
.chl-cnt{display:grid;grid-template-columns:1fr 1fr;gap:6px}\
.chl-t{background:var(--wall);border:1px solid var(--rule2);border-radius:6px;padding:5px 8px 6px;min-width:0}\
.chl-t>span{display:block;font-size:11.5px;line-height:1.25;color:var(--ink2)}\
.chl-t b{display:block;font:500 17px/1.25 var(--mono);color:var(--ink)}\
.chl-t small{display:block;font:11px/1.25 var(--mono);color:var(--ink3)}\
.chl-ph{grid-column:1/-1}\
.chl-per{grid-column:1/-1;margin:0;font-size:12.5px;line-height:1.4;color:var(--ink2)}\
.chl-ph b{font-size:22px}\
.chl-cnth{display:flex;justify-content:space-between;align-items:center;gap:6px;font-size:12px;color:var(--ink2);flex-wrap:wrap}\
.chl-cnth button{font:12px var(--ui);min-height:30px;border:1px solid var(--rule);background:var(--paper);color:var(--ink);border-radius:999px;padding:3px 10px;cursor:pointer}\
.chl-row2{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(0,1fr);gap:12px;margin-top:12px;align-items:start}\
.chl-cv{display:block;width:100%;border:1px solid var(--rule);border-radius:6px;background:var(--wall);cursor:pointer}\
.chl-row2 .cap{font-size:14px;margin-top:5px}\
.chl-why{margin-top:12px;border:1px solid var(--rule);border-radius:6px;background:var(--card);padding:0 12px}\
.chl-why summary{cursor:pointer;font:600 15px/1.3 var(--ui);padding:10px 0;min-height:24px}\
.chl-why ul{margin:0 0 10px;padding-left:1.2em}\
.chl-why li{margin:0 0 7px}\
@media (max-width:760px){.chl-grid,.chl-row2{grid-template-columns:minmax(0,1fr)}.chl-stage{height:300px}\
.chl-panel{max-height:46%;font-size:12.5px;padding:7px 10px}.chl-panel.B{top:auto;bottom:8px}.chl-key{display:none}.chl-tag{font-size:10.5px;padding:2px 6px}\
.chl .chl-what,.chl .chl-todo,.chl-now,.chl-cnth,.chl-per,.chl-row2 .cap,.chl-why{margin-right:0;padding-right:58px}.chl{padding-bottom:64px}}\
';

  /* ------------------------------------------------------------ markup */
  function markup() {
    var parts = Object.keys(PARTS).map(function (k) { return '<option value="' + k + '">' + esc(PARTS[k][0]) + '</option>'; }).join('');
    return '<style>' + CSS + '</style>' +
      '<section class="fig lx-fig chl" id="chl-ws" aria-label="The chloroplast: one machine, two halves">' +
      '<div class="fighead"><h3>The chloroplast: one machine, two halves</h3><p>Light charges the carriers. The Calvin cycle spends them.</p></div>' +
      '<p class="chl-what">This is a <b>chloroplast</b>, the green part of a leaf cell where light becomes sugar. Its <b>thylakoid membranes</b> catch light and charge two carriers, <b>ATP</b> (the cell\'s energy currency) and <b>NADPH</b> (a carrier of energy rich electrons). The <b>stroma</b> around them spends those carriers to fix CO₂. The same carriers go round and round: spent ATP comes back as <b>ADP</b>, spent NADPH as <b>NADP⁺</b>, and both are charged again.</p>' +
      '<p class="chl-todo"><b>What to do:</b> the <b>LIGHT</b>, <b>CARBON</b> and <b>BOTH</b> buttons show one half of the machine or both. Press <b>BOTH</b>, then <b>Follow one ATP</b> and watch it go round. Then turn the light down. Click a part to read what it is. Click empty space to pause the motion; click again to restart.</p>' +
      '<div class="chl-grid">' +
      '<div class="chl-3d"><div class="chl-stage" id="chl-stage"><div class="chl-gl mh-gl" role="img" aria-label="A chloroplast cut open: grana stacks joined by sheets, starch grains and the Calvin cycle in the stroma"></div><div class="chl-tags" aria-hidden="true"></div>' +
      '<p class="chl-frz" hidden>Frozen · click the view to play</p>' +
      '<p class="chl-key" aria-hidden="true"><i style="background:#ffad3a;border-radius:50%"></i>ATP (big) / ADP (small, pale) <i style="background:#2fb3a6;transform:rotate(45deg)"></i>NADPH / NADP⁺ <i style="background:#dd3c3c;border-radius:50%"></i>O₂ from split water <i style="background:#cfd3d8;border-radius:50%"></i>CO₂ <i style="background:#ffe08a;border-radius:50%"></i>H⁺</p>' +
      '<div class="chl-panel" role="region" aria-live="polite" hidden></div></div>' +
      '<div class="chl-bar"><button type="button" class="chl-b" data-a="freeze" aria-pressed="false">Pause</button><button type="button" class="chl-b" data-a="step" hidden>Step</button>' +
      '<button type="button" class="chl-b" data-a="fatp" aria-pressed="false">Follow one ATP</button><button type="button" class="chl-b" data-a="fnad" aria-pressed="false">Follow one NADPH</button>' +
      '<button type="button" class="chl-b" data-a="names" aria-pressed="true">Names</button></div>' +
      (window.WPMolColor ? WPMolColor.key(['co2', 'o2']) : '') + '</div>' + // v19: the site wide molecule key
      '<div class="chl-side">' +
      '<div class="chl-modes" role="group" aria-label="Show which half"><button type="button" data-m="light" aria-pressed="false">LIGHT</button><button type="button" data-m="carbon" aria-pressed="false">CARBON</button><button type="button" data-m="both" aria-pressed="true">BOTH</button></div>' +
      '<div class="chl-c"><label for="chl-ppfd">Light on the leaf <output id="chl-ppfd-o"></output></label><input type="range" id="chl-ppfd" min="0" max="2000" step="10"><div class="h">Light, in µmol of photons per m² per second. This is the same light setting used across this page; changing it here changes it on every plate.</div></div>' +
      '<div class="chl-c"><label for="chl-mem">Thylakoid membrane <output id="chl-mem-o"></output></label><input type="range" id="chl-mem" min="25" max="100" step="5" value="100"><div class="h">less membrane, fewer photosystems (the light catching machines) and ATP synthases; this workstation only ' + ev('chl.membrane', 'Model') + '</div></div>' +
      '<p class="chl-now" aria-live="polite"><b>What just happened:</b> <span id="chl-now">The light half is charging carriers and the carbon half is spending them, at the same pace.</span></p>' +
      '<div class="chl-cnth"><span>Since you arrived, in µmol per m² of leaf; small numbers are rates, in µmol per m² per s ' + badge('ILLUSTRATIVE') + '</span><button type="button" data-a="zero">Start again</button></div>' +
      '<div class="chl-cnt">' +
      '<div class="chl-t"><span>ATP made</span><b id="chl-c-atp">0</b><small id="chl-r-atp"></small></div>' +
      '<div class="chl-t"><span>ATP spent</span><b id="chl-c-spent">0</b><small id="chl-r-spent"></small></div>' +
      '<div class="chl-t"><span>NADPH made</span><b id="chl-c-nad">0</b><small id="chl-r-nad"></small></div>' +
      '<div class="chl-t"><span>CO₂ fixed by Rubisco</span><b id="chl-c-co2">0</b><small id="chl-r-co2"></small></div>' +
      '<p class="chl-per" id="chl-per"></p>' +
      '<div class="chl-t chl-ph"><span>Lumen pH, live ' + badge('ILLUSTRATIVE') + ' ' + ev('lumen_ph', 'In vivo 5.7 to 7.5') + '</span><b id="chl-ph">7.2</b><small id="chl-ph-s"></small></div>' +
      '</div>' +
      '<div class="chl-c"><label for="chl-part">Name a part</label><select id="chl-part"><option value="">Pick a part to read about it</option>' + parts + '</select></div>' +
      '</div></div>' +
      '<div class="chl-row2">' +
      '<div><canvas class="chl-cv" id="chl-slice" height="300" role="img" aria-label="Live cross section of one granum and the carrier loop"></canvas>' +
      '<p class="cap">Left: a cut through one granum. The lumen is one connected space; protons (yellow) pile up in it and leave through ATP synthase. Right: the same carriers as in 3D, going round. Drawn simply ' + ev('chl.network', 'One lumen') + ' ' + ev('chl.wind', 'Real shape') + '</p></div>' +
      '<div><canvas class="chl-cv" id="chl-plot" height="230" role="img" aria-label="ATP made and CO2 fixed against light"></canvas>' +
      '<p class="cap">Turn the light down: ATP made and CO₂ fixed fall together, because the Calvin cycle runs on the carriers the membranes charge. Engine values ' + badge('ILLUSTRATIVE') + '</p></div>' +
      '</div>' +
      '<details class="chl-why"><summary>Why does this happen?</summary><ul>' +
      '<li><b>One machine, one pool of carriers.</b> ATP and NADPH are not made in the stroma. The membranes charge ADP (spent ATP) into ATP and NADP⁺ (spent NADPH) into NADPH; the Calvin cycle spends them and hands back ADP and NADP⁺. In a steady leaf, ATP made equals ATP spent, and in this model the two counters match. The exception is a leaf blocked with DCMU (Light III): the little cyclic flow left still makes some ATP, but no CO₂ is fixed, so the model counts that ATP as made and not spent. Per CO₂ the cycle alone needs 3 ATP and 2 NADPH; photorespiration adds more, which is why the counters show about 4.2 and 2.7 in full sun. Dim the light and fewer carriers are charged, so the cycle slows: it is starved, not broken. ' + ev('chl.beads', 'Bead scale') + '</li>' +
      '<li><b>A lot of membrane around one thin space.</b> A proton gradient needs a closed space. In the chloroplast that space is one continuous lumen inside a single folded membrane network; stacks (grana) and the sheets that join them are connected ' + ev('chl.network', 'Shimoni 2005; Austin 2011') + '. The lumen is only about 4.7 nm wide in the dark and about 9.2 nm in light ' + badge('MEASURED') + ' ' + ev('chl.width', 'Kirchhoff 2011') + '. Such a thin space holds little water per membrane area, so pumped protons change its pH quickly, although lumen proteins buffer part of the change ' + ev('chl.volarea', 'Geometry') + ' ' + ev('chl.buffer', 'Wille 1988') + '.</li>' +
      '<li><b>What pH means.</b> pH is a scale for how many free protons (H⁺) there are; each step down means ten times more. In light the lumen pH falls; the model keeps it inside the range measured in living leaves, about 7.5 to 5.7 ' + badge('MEASURED') + ' ' + ev('lumen_ph', 'Takizawa 2007') + '.</li>' +
      '<li><b>Less membrane, less ATP.</b> Fewer square metres of membrane hold fewer photosystems and ATP synthases, so less light is caught and fewer protons can be pumped and used. A granum holds about 5 to 15 discs in sun plants and up to about 100 in deep shade plants ' + badge('SECONDARY') + ' ' + ev('chl.granum', 'Austin 2011') + '.</li>' +
      '<li class="tier-2"><b>The motor.</b> The rotor has 14 subunits, so one turn moves 14 protons and makes 3 ATP, about 4.7 protons per ATP ' + badge('DERIVED') + '. Measurements give a slightly lower value, about 3.9 ± 0.3 ' + badge('MEASURED') + ' ' + ev('c_ring_14', 'Seelert 2000') + ' ' + ev('chl.hatp', 'Vollmar 2009; Petersen 2012') + '.</li>' +
      '<li class="tier-2"><b>Counting turns.</b> Three turns of the cycle fix 3 CO₂ onto 3 RuBP and make 6 triose P (a small three carbon sugar); 1 leaves the cycle and 5 are rebuilt into 3 RuBP. That costs 9 ATP and 6 NADPH ' + badge('DERIVED') + ' ' + ev('chl.calvin', 'Stoichiometry') + '. One triose P holds 3 carbons, one from each CO₂, so 9 ATP and 6 NADPH per triose P is the same as 3 ATP and 2 NADPH per CO₂. Rubisco is the enzyme; RuBP is the sugar it puts CO₂ on.</li>' +
      '<li class="tier-2"><b>The O₂ leaves.</b> The crimson O₂ beads come from splitting water at photosystem II; O₂ is a by-product and diffuses out of the leaf. Rubisco can also take up O₂ instead of CO₂ (photorespiration). The scene does not draw that use of O₂, but the counters include it, with its extra ATP and NADPH cost. <a href="#stroma">Light IV models it</a> ' + ev('chl.photoresp', 'Bauwe 2010') + '.</li>' +
      '<li class="tier-3">Model: ATP made = H⁺ into the lumen ÷ 4.67; ATP spent = min(ATP made, ATP the cycle and photorespiration demand); NADPH made = linear electrons ÷ 2; CO₂ fixed = Rubisco carboxylation v<sub>c</sub>. The membrane slider runs the same engine with light caught and J<sub>max</sub> (the top rate of electron transport) both × the membrane share. Grana and junctions are drawn as a sketch; there is no measured count of grana per chloroplast behind it. ' + ev('chl.slits', 'Junction slits') + '</li>' +
      '</ul></details>' +
      '</section>';
  }

  /* ------------------------------------------------------------ 3D geometry layout (world units, x long axis) */
  var A = 5.0, B = 1.8, Cz = 2.9, IN = 0.955, ZO = 0.8, ZI = 1.2, DR = 0.46, SP = 0.112, DH = 0.078;
  var GR = [[-2.7, -1.4, 9], [-0.9, -1.65, 12], [0.9, -1.65, 10], [2.7, -1.4, 8], [-3.45, 0.1, 7], [-1.8, 0.2, 11], [1.8, 0.2, 12], [3.45, 0.1, 6],
            [-2.75, 1.25, 8], [-1.1, 1.42, 10], [1.1, 1.42, 9], [2.75, 1.25, 7]];
  var RING = { x: 0, y: 0.05, z: 0.5, r: 0.52 };
  var STARCH = [[0.15, -0.3, -0.5, 0.62, 0.3, 0.38], [-4.05, -0.05, -0.65, 0.36, 0.22, 0.3], [3.9, 0.05, -0.8, 0.3, 0.18, 0.26]];
  var PAIRS = (function () {
    var p = [];
    for (var i = 0; i < GR.length; i++) for (var j = i + 1; j < GR.length; j++) {
      var d = Math.hypot(GR[i][0] - GR[j][0], GR[i][1] - GR[j][1]);
      if (d < 2.15 && !(Math.abs(GR[i][0]) < 1.3 && Math.abs(GR[j][0]) < 1.3 && GR[i][1] > 0 && GR[j][1] > 0)) p.push([i, j]);
    }
    return p;
  })();
  function nDisc(i) { return Math.max(2, Math.round(GR[i][2] * S.f)); }
  function discY(i, d) { var n = nDisc(i); return (d - (n - 1) / 2) * SP + (hash(i) - 0.5) * 0.12; }
  function ringPt(a, out) { var r = a * Math.PI / 180; out.set(RING.x + RING.r * Math.cos(r), RING.y + RING.r * Math.sin(r), RING.z + 0.04); return out; }

  /* ------------------------------------------------------------ 3D */
  var G = null;
  function build3D(stage, bar) {
    var T = window.THREE, glh = stage.querySelector('.chl-gl');
    var renderer;
    try { renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' }); } catch (e) { return null; }
    renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
    renderer.localClippingEnabled = true;
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
    renderer.setClearColor(0x000000, 0);
    glh.appendChild(renderer.domElement);
    var scene = new T.Scene(), cam = new T.PerspectiveCamera(32, 1, 0.1, 100);
    scene.add(new T.HemisphereLight(0xeaf6ff, 0x1a2a18, 0.55));
    var key = new T.DirectionalLight(0xfff2dc, 0.95); key.position.set(4, 8, 7); scene.add(key);
    var rim = new T.DirectionalLight(0x9fd0ff, 0.45); rim.position.set(-6, 2, -5); scene.add(rim);
    var root = new T.Group(); scene.add(root);
    var pO = new T.Plane(new T.Vector3(0, 0, -1), ZO), pI = new T.Plane(new T.Vector3(0, 0, -1), ZI);
    function std(col, o) {
      o = o || {};
      var m = new T.MeshStandardMaterial({ color: new T.Color(col).convertSRGBToLinear(), roughness: o.r != null ? o.r : 0.55, metalness: 0, transparent: !!o.op, opacity: o.op || 1, side: o.side || T.FrontSide, depthWrite: o.dw !== false, clippingPlanes: o.clip || null, emissive: new T.Color(o.em || 0x000000).convertSRGBToLinear(), emissiveIntensity: o.ei || 1 });
      m.userData.base = new T.Color(col).convertSRGBToLinear(); m.userData.op = o.op || 1;
      return m;
    }
    var sph = new T.SphereGeometry(1, 72, 44);
    /* envelopes: a glassy fresnel shell (bright at the rim, clear where you look straight through), clipped open at the front */
    function glass(col, a0, a1, plane) {
      var m = new T.ShaderMaterial({
        uniforms: { col: { value: new T.Color(col) }, a0: { value: a0 }, a1: { value: a1 } }, transparent: true, depthWrite: false, side: T.DoubleSide, clipping: true, clippingPlanes: [plane],
        vertexShader: '#include <clipping_planes_pars_vertex>\nvarying vec3 vN; varying vec3 vV;\nvoid main(){ vec4 mvPosition = modelViewMatrix * vec4(position,1.0);\n#include <clipping_planes_vertex>\nvN = normalize(normalMatrix * normal); vV = -mvPosition.xyz; gl_Position = projectionMatrix * mvPosition; }',
        fragmentShader: '#include <clipping_planes_pars_fragment>\nuniform vec3 col; uniform float a0; uniform float a1; varying vec3 vN; varying vec3 vV;\nvoid main(){\n#include <clipping_planes_fragment>\nfloat f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 3.0); gl_FragColor = vec4(col * (0.75 + 0.5 * f), a0 + a1 * f); }'
      });
      m.userData.base = new T.Color(col); m.isGlass = true; return m;
    }
    var mOuter = glass(0xd9f2b8, 0.035, 0.85, pO);
    var outer = new T.Mesh(sph, mOuter); outer.scale.set(A, B, Cz); outer.renderOrder = 4; outer.userData = { part: 'outer', clipZ: ZO }; root.add(outer);
    var mInner = glass(0x9ad870, 0.025, 0.5, pI);
    var inner = new T.Mesh(sph, mInner); inner.scale.set(A * IN, B * IN, Cz * IN); inner.renderOrder = 3; inner.userData = { part: 'inner', clipZ: ZI }; root.add(inner);
    var mBack = std(0x16301c, { clip: [pI], side: T.BackSide, r: 0.95 });
    var back = new T.Mesh(sph, mBack); back.scale.copy(inner.scale).multiplyScalar(0.999); back.userData = { part: 'stroma', clipZ: ZI }; root.add(back);
    /* cut rims: thin rings where the envelopes are cut, so the double membrane reads as two layers */
    function rimAt(sc, z, col) {
      var k = Math.sqrt(Math.max(0, 1 - (z / sc[2]) * (z / sc[2])));
      var g = new T.TorusGeometry(1, 0.022, 8, 120), m = new T.Mesh(g, std(col, { r: 0.4 }));
      m.scale.set(sc[0] * k, sc[1] * k, 1); m.position.z = z; m.userData = { part: col === 0xd6efb8 ? 'outer' : 'inner', clipZ: 99 }; root.add(m); return m;
    }
    var rimO = rimAt([A, B, Cz], ZO, 0xd6efb8), rimI = rimAt([A * IN, B * IN, Cz * IN], ZI, 0xa5dc80);
    /* grana: discs (membrane) with a lumen layer inside; both cut by the inner plane so the front stacks show their lumen */
    var maxD = GR.reduce(function (s, g) { return s + g[2]; }, 0);
    var mDisc = std(0x2f8a2c, { clip: [pI], side: T.DoubleSide, r: 0.5, em: 0x0e2a0a });
    var discs = new T.InstancedMesh(new T.CylinderGeometry(1, 1, DH, 44, 1), mDisc, maxD); discs.userData = { part: 'granum', clipZ: ZI };
    var mLum = std(0xe9dca6, { clip: [pI], side: T.DoubleSide, r: 0.6, em: 0xff9a2a, ei: 0.2 });
    var lums = new T.InstancedMesh(new T.CylinderGeometry(0.965, 0.965, DH * 0.42, 44, 1), mLum, maxD); lums.userData = { part: 'lumen', clipZ: ZI };
    var lams = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), std(0x2a7d28, { clip: [pI], r: 0.55, em: 0x0e2a0a }), PAIRS.length * 2); lams.userData = { part: 'membrane', clipZ: ZI };
    root.add(discs); root.add(lums); root.add(lams);
    var discG = [];
    /* machines (not to scale) */
    var MM = LP.macro;
    var psiiGeo = MM && MM.merge ? MM.merge(T, [{ geo: new T.SphereGeometry(1, 14, 10), pos: [-0.55, 0, 0], scale: [0.62, 0.8, 0.7], color: '#58d27a' }, { geo: new T.SphereGeometry(1, 14, 10), pos: [0.55, 0, 0], scale: [0.62, 0.8, 0.7], color: '#58d27a' }]) : new T.SphereGeometry(1, 14, 10);
    var mPSII = std(0xffffff, { r: 0.35, em: 0x0f3a18 }); if (MM && MM.merge) mPSII.vertexColors = true;
    var psii = new T.InstancedMesh(psiiGeo, mPSII, 80); psii.userData = { part: 'psii', clipZ: 99 };
    var mPSI = std(0x5b8fe0, { r: 0.35, em: 0x0c1d3a });
    var psi = new T.InstancedMesh(new T.SphereGeometry(1, 14, 10), mPSI, 80); psi.userData = { part: 'psi', clipZ: 99 };
    var headParts = [], hp;
    for (hp = 0; hp < 3; hp++) headParts.push({ geo: new T.SphereGeometry(1, 12, 9), pos: [Math.cos(hp * TAU / 3) * 0.55, 0, Math.sin(hp * TAU / 3) * 0.55], scale: 0.55, color: hp === 0 ? '#e2ecff' : '#86a8e0' });
    headParts.push({ geo: new T.CylinderGeometry(0.16, 0.16, 2.4, 8), pos: [0, -1.4, 0], scale: 1, color: '#7d8fb0' });
    var synGeo = MM && MM.merge ? MM.merge(T, headParts) : new T.SphereGeometry(1, 12, 9);
    var mSyn = std(0xffffff, { r: 0.35, em: 0x101a2e }); if (MM && MM.merge) mSyn.vertexColors = true;
    var syn = new T.InstancedMesh(synGeo, mSyn, 70); syn.userData = { part: 'synthase', clipZ: 99 };
    root.add(psii); root.add(psi); root.add(syn);
    /* Calvin cycle: ring, Rubisco (enzyme), RuBP tokens (the sugar) */
    var mRing = std(0xd8c27a, { r: 0.35, em: 0x3a2a08, op: 1 });
    var ring = new T.Mesh(new T.TorusGeometry(RING.r, 0.028, 10, 90), mRing); ring.position.set(RING.x, RING.y, RING.z); ring.userData = { part: 'rubp', clipZ: 99 }; root.add(ring);
    var rbParts = [];
    for (hp = 0; hp < 8; hp++) rbParts.push({ geo: new T.SphereGeometry(1, 10, 8), pos: [(hp & 1 ? 1 : -1) * 0.5, (hp & 2 ? 1 : -1) * 0.5, (hp & 4 ? 1 : -1) * 0.5], scale: 0.62, color: hp < 4 ? '#e09a3c' : '#c77c2a' });
    var mRub = std(0xffffff, { r: 0.4, em: 0x2a1404, op: 1 }); if (MM && MM.merge) mRub.vertexColors = true;
    var rub = new T.Mesh(MM && MM.merge ? MM.merge(T, rbParts) : new T.SphereGeometry(1, 12, 9), mRub); rub.scale.setScalar(0.12);
    var rv = ringPt(90, new T.Vector3()); rub.position.set(rv.x, rv.y + 0.07, rv.z + 0.05); rub.userData = { part: 'rubisco', clipZ: 99 }; root.add(rub);
    var mRuBP = std(0xf2e7c4, { r: 0.4, em: 0x2a2208, op: 1 });
    var rubps = [];
    for (hp = 0; hp < 3; hp++) { var tk = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, 0.045, 5), mRuBP); tk.rotation.x = Math.PI / 2; tk.userData = { part: 'rubp', clipZ: 99 }; root.add(tk); rubps.push(tk); }
    var mSt = std(0xf3ecd8, { r: 0.3, op: 1 });
    var starch = STARCH.map(function (s) { var m = new T.Mesh(new T.SphereGeometry(1, 28, 18), mSt); m.position.set(s[0], s[1], s[2]); m.scale.set(s[3], s[4], s[5]); m.userData = { part: 'starch', clipZ: 99 }; root.add(m); return m; });
    var mPg = std(0xe8c95a, { r: 0.4, op: 1 });
    [[-1.6, -0.75, -0.6], [2.3, 0.7, -0.3], [-0.6, 0.85, -0.9], [3.1, -0.6, 0.6]].forEach(function (p) { var m = new T.Mesh(new T.SphereGeometry(0.07, 10, 8), mPg); m.position.set(p[0], p[1], p[2]); m.userData = { part: 'stroma', clipZ: 99 }; root.add(m); });
    /* carriers: the same objects all the time */
    var mAtp = std(0xffffff, { r: 0.3, em: 0x000000, op: 1 }), mNad = std(0xffffff, { r: 0.3, em: 0x000000, op: 1 });
    var catp = new T.InstancedMesh(new T.SphereGeometry(0.085, 14, 10), mAtp, NA), cnad = new T.InstancedMesh(new T.OctahedronGeometry(0.1, 0), mNad, NN);
    catp.userData = { part: 'carrier', clipZ: 99 }; cnad.userData = { part: 'carrier', clipZ: 99 };
    catp.frustumCulled = cnad.frustumCulled = false;
    root.add(catp); root.add(cnad);
    for (hp = 0; hp < NA; hp++) catp.setColorAt(hp, new T.Color(0xffad3a));
    for (hp = 0; hp < NN; hp++) cnad.setColorAt(hp, new T.Color(0x2fb3a6));
    /* particles */
    var dot = (function () { var c = document.createElement('canvas'); c.width = c.height = 64; var x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 2, 32, 32, 30); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.45, 'rgba(255,255,255,.9)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); var t = new T.CanvasTexture(c); return t; })();
    function pool(n, col, size) {
      var g = new T.BufferGeometry(), pos = new Float32Array(n * 3), cl = new Float32Array(n * 3);
      for (var i = 0; i < n; i++) pos[i * 3 + 1] = 1e4;
      g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('color', new T.BufferAttribute(cl, 3));
      var m = new T.PointsMaterial({ size: size, map: dot, vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending, sizeAttenuation: true });
      var o = new T.Points(g, m); o.frustumCulled = false; o.renderOrder = 9; root.add(o);
      var P = []; for (i = 0; i < n; i++) P.push({ on: false });
      var base = new T.Color(col);
      return {
        obj: o, mat: m, P: P, base: base, k: 1,
        spawn: function (a, c, b, dur) { for (var i = 0; i < n; i++) if (!P[i].on) { P[i] = { on: true, a: a.clone(), c: c.clone(), b: b.clone(), t: 0, dur: dur }; return; } },
        step: function (dt) {
          var v = new T.Vector3();
          for (var i = 0; i < n; i++) {
            var p = P[i];
            if (!p.on) { pos[i * 3 + 1] = 1e4; continue; }
            p.t += dt / p.dur; if (p.t >= 1) { p.on = false; pos[i * 3 + 1] = 1e4; continue; }
            var u = p.t, w0 = (1 - u) * (1 - u), w1 = 2 * u * (1 - u), w2 = u * u;
            v.set(p.a.x * w0 + p.c.x * w1 + p.b.x * w2, p.a.y * w0 + p.c.y * w1 + p.b.y * w2, p.a.z * w0 + p.c.z * w1 + p.b.z * w2);
            pos[i * 3] = v.x; pos[i * 3 + 1] = v.y; pos[i * 3 + 2] = v.z;
            var al = Math.min(1, u * 6, (1 - u) * 4) * this.k;
            cl[i * 3] = base.r * al; cl[i * 3 + 1] = base.g * al; cl[i * 3 + 2] = base.b * al;
          }
          g.attributes.position.needsUpdate = true; g.attributes.color.needsUpdate = true;
        }
      };
    }
    var IDK = function (k, d) { return window.WPMolColor ? WPMolColor.int(k, true) : d; }; // v19: identity colours (molcolor.js, dark set: this stage is always dark)
    var PO = { o2: pool(40, IDK('o2', 0xdd3c3c), 0.2), e: pool(40, 0x9dff7a, 0.12), co2: pool(24, IDK('co2', 0xcfd3d8), 0.18), tri: pool(16, 0xffd98a, 0.2) };
    /* protons in the cut lumen faces (static positions, count follows lumen pH) */
    var HPN = 160, hpG = new T.BufferGeometry(), hpPos = new Float32Array(HPN * 3), hpCol = new Float32Array(HPN * 3);
    hpG.setAttribute('position', new T.BufferAttribute(hpPos, 3)); hpG.setAttribute('color', new T.BufferAttribute(hpCol, 3));
    var hpM = new T.PointsMaterial({ size: 0.075, map: dot, vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending });
    var hpts = new T.Points(hpG, hpM); hpts.frustumCulled = false; hpts.renderOrder = 9; root.add(hpts);
    var halo = new T.Points(new T.BufferGeometry().setAttribute('position', new T.BufferAttribute(new Float32Array(3), 3)), new T.PointsMaterial({ size: 0.55, map: dot, color: 0xffd479, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0.9 }));
    halo.frustumCulled = false; halo.renderOrder = 10; halo.visible = false; root.add(halo);

    var sites = { psi: [], syn: [], psii: [], hp: [] };
    var M4 = new T.Matrix4(), Qa = new T.Quaternion(), Qb = new T.Quaternion(), V = new T.Vector3(), V2 = new T.Vector3(), Y = new T.Vector3(0, 1, 0), SC = new T.Vector3();
    function layout() {
      var n = 0, i, d, k;
      discG.length = 0;
      for (i = 0; i < GR.length; i++) {
        var nd = nDisc(i), r = DR * (0.92 + 0.16 * hash(i + 7));
        for (d = 0; d < nd; d++) {
          M4.compose(V.set(GR[i][0], discY(i, d), GR[i][1]), Qa.identity(), SC.set(r, 1, r));
          discs.setMatrixAt(n, M4); lums.setMatrixAt(n, M4); discG[n] = i; n++;
        }
      }
      discs.count = lums.count = n; discs.instanceMatrix.needsUpdate = lums.instanceMatrix.needsUpdate = true;
      var L = 0; sites.psi = []; sites.syn = []; sites.psii = []; sites.hp = [];
      function keep(j) { return hash(j * 3.7 + 11) < S.f + 0.02; }
      for (k = 0; k < PAIRS.length; k++) for (var s = 0; s < 2; s++) {
        if (s === 1 && S.f < 0.6) continue;
        var a = PAIRS[k][0], b = PAIRS[k][1], na = nDisc(a), nb = nDisc(b);
        var da = Math.min(na - 1, Math.floor(na * (s ? 0.75 : 0.25 + 0.2 * hash(k)))), db = Math.min(nb - 1, Math.floor(nb * (s ? 0.2 + 0.2 * hash(k + 5) : 0.7)));
        var ax = GR[a][0], az = GR[a][1], bx = GR[b][0], bz = GR[b][1], dx = bx - ax, dz = bz - az, dl = Math.hypot(dx, dz), ux = dx / dl, uz = dz / dl;
        var p0 = new T.Vector3(ax + ux * DR * 0.9, discY(a, da), az + uz * DR * 0.9), p1 = new T.Vector3(bx - ux * DR * 0.9, discY(b, db), bz - uz * DR * 0.9);
        var dir = V2.copy(p1).sub(p0), len = dir.length(); dir.normalize();
        var zA = new T.Vector3().crossVectors(dir, Y).normalize(), yA = new T.Vector3().crossVectors(zA, dir);
        M4.makeBasis(dir, yA, zA); M4.scale(SC.set(len, 0.05, 0.36)); M4.setPosition(V.copy(p0).add(p1).multiplyScalar(0.5));
        lams.setMatrixAt(L++, M4);
        var mid = new T.Vector3().copy(p0).add(p1).multiplyScalar(0.5), nrm = yA.clone();
        if (mid.z < ZI - 0.1) {
          if (keep(L * 2)) sites.psi.push({ p: mid.clone().addScaledVector(dir, -0.18 * len).addScaledVector(nrm, 0.05), n: nrm.clone() });
          if (keep(L * 2 + 1)) sites.syn.push({ p: mid.clone().addScaledVector(dir, 0.16 * len).addScaledVector(nrm, 0.03), n: nrm.clone() });
        }
      }
      lams.count = L; lams.instanceMatrix.needsUpdate = true;
      for (i = 0; i < GR.length; i++) {
        var top = discY(i, nDisc(i) - 1) + DH / 2, bot = discY(i, 0) - DH / 2, cx = GR[i][0], cz = GR[i][1], ang = hash(i + 2) * TAU;
        var front = cz > 1;
        var zc = function (z) { return front ? Math.min(z, ZI - 0.16) : z; };
        if (keep(i * 7 + 1)) sites.psi.push({ p: new T.Vector3(cx + Math.cos(ang) * 0.24, top + 0.03, zc(cz + Math.sin(ang) * 0.24)), n: Y.clone() });
        if (keep(i * 7 + 2)) sites.psi.push({ p: new T.Vector3(cx - Math.cos(ang) * 0.2, bot - 0.03, zc(cz - Math.sin(ang) * 0.2)), n: Y.clone().negate() });
        if (keep(i * 7 + 3)) sites.syn.push({ p: new T.Vector3(cx - Math.cos(ang) * 0.2, top + 0.01, zc(cz - Math.sin(ang) * 0.2)), n: Y.clone() });
        if (keep(i * 7 + 4)) sites.syn.push({ p: new T.Vector3(cx + Math.cos(ang) * 0.24, bot - 0.01, zc(cz + Math.sin(ang) * 0.24)), n: Y.clone().negate() });
        if (front) {
          var half = Math.sqrt(Math.max(0, DR * DR - (ZI - cz) * (ZI - cz))) * 0.85;
          for (d = 0; d < nDisc(i); d++) {
            var y = discY(i, d);
            for (var q = -1; q <= 1; q += 2) if (keep(i * 31 + d * 2 + q)) sites.psii.push({ p: new T.Vector3(cx + q * half * 0.45, y + DH * 0.33, ZI - 0.02), n: Y.clone() });
            for (q = 0; q < 6; q++) sites.hp.push(new T.Vector3(cx + (hash(i * 50 + d * 7 + q) * 2 - 1) * half, y + (hash(i * 9 + d + q * 3) - 0.5) * DH * 0.32, ZI - 0.015));
          }
        }
      }
      function put(mesh, list, s, flat) {
        mesh.count = Math.min(list.length, mesh.instanceMatrix.count);
        for (var j = 0; j < mesh.count; j++) { Qa.setFromUnitVectors(Y, list[j].n); M4.compose(list[j].p, Qa, flat ? SC.set(s, s * 0.55, s * 0.7) : SC.set(s, s, s)); mesh.setMatrixAt(j, M4); }
        mesh.instanceMatrix.needsUpdate = true;
      }
      put(psi, sites.psi, 0.075); put(psii, sites.psii, 0.055, true);
      for (i = 0; i < HPN; i++) { var h = sites.hp[i]; if (h) { hpPos[i * 3] = h.x; hpPos[i * 3 + 1] = h.y; hpPos[i * 3 + 2] = h.z; } else hpPos[i * 3 + 1] = 1e4; }
      hpG.attributes.position.needsUpdate = true;
      posSyn(); S.dirty = true;
    }
    function posSyn() {
      syn.count = Math.min(sites.syn.length, 70);
      for (var j = 0; j < syn.count; j++) {
        var s = sites.syn[j];
        Qa.setFromUnitVectors(Y, s.n); Qb.setFromAxisAngle(Y, S.rot + j * 0.7); Qa.multiply(Qb);
        M4.compose(V.copy(s.p).addScaledVector(s.n, 0.1), Qa, SC.set(0.06, 0.06, 0.06)); syn.setMatrixAt(j, M4);
      }
      syn.instanceMatrix.needsUpdate = true;
    }
    /* carrier path */
    var cp = new T.Vector3(), cq = new T.Vector3(), cr = new T.Vector3();
    function site(c) { var L2 = c.type === 'atp' ? sites.syn : sites.psi; if (!L2.length) return null; return L2[(c.k * 5 + 3) % L2.length]; }
    function carrierPos(c, out) {
      var s = site(c);
      if (!s) { out.set(0, 1e4, 0); return out; }
      var m = cp.copy(s.p).addScaledVector(s.n, c.type === 'atp' ? 0.24 : 0.13), ph = c.ph, sa = c.st;
      if (ph < 0.1) { out.copy(m).addScaledVector(s.n, 0.03 * Math.sin(ph * 60)); return out; }
      if (ph < 0.42) {
        var u = (ph - 0.1) / 0.32; u = u * u * (3 - 2 * u); ringPt(sa, cq);
        cr.copy(m).add(cq).multiplyScalar(0.5); cr.y += 0.55; cr.z += 0.25;
        return bez(m, cr, cq, u, out);
      }
      if (ph < 0.55) { return ringPt(sa + (ph - 0.42) / 0.13 * 40, out); }
      var w = (ph - 0.55) / 0.45; w = w * w * (3 - 2 * w); ringPt(sa + 40, cq);
      cr.copy(m).add(cq).multiplyScalar(0.5); cr.y -= 0.45; cr.z += 0.3;
      return bez(cq, cr, m, w, out);
    }
    function bez(a, c, b, u, out) { var w0 = (1 - u) * (1 - u), w1 = 2 * u * (1 - u), w2 = u * u; out.set(a.x * w0 + c.x * w1 + b.x * w2, a.y * w0 + c.y * w1 + b.y * w2, a.z * w0 + c.z * w1 + b.z * w2); return out; }
    var colA = new T.Color(0xffad3a).convertSRGBToLinear(), colADP = new T.Color(0x9c8b70).convertSRGBToLinear(), colN = new T.Color(0x2fb3a6).convertSRGBToLinear(), colNP = new T.Color(0x5f8582).convertSRGBToLinear(), tmpC = new T.Color();
    function placeCarriers() {
      var ia = 0, inn = 0;
      for (var i = 0; i < C.length; i++) {
        var c = C[i], ch = charged(c), p = carrierPos(c, V), sc = ch ? 1 : 0.7;
        if (i === S.pick) sc *= 1.45;
        Qa.setFromAxisAngle(Y, S.tm * 1.3 + i);
        M4.compose(p, Qa, SC.set(sc, sc, sc));
        /* charge and spend blend the colour over a short stretch, so you see each carrier change */
        var b = c.ph < 0.1 ? c.ph / 0.1 : (c.ph < 0.42 ? 1 : (c.ph < 0.55 ? 1 - (c.ph - 0.42) / 0.13 : 0));
        if (c.type === 'atp') { tmpC.copy(colADP).lerp(colA, b); catp.setMatrixAt(ia, M4); catp.setColorAt(ia, tmpC); ia++; }
        else { tmpC.copy(colNP).lerp(colN, b); cnad.setMatrixAt(inn, M4); cnad.setColorAt(inn, tmpC); inn++; }
        if (i === S.pick) { halo.geometry.attributes.position.setXYZ(0, p.x, p.y, p.z); halo.geometry.attributes.position.needsUpdate = true; }
      }
      catp.instanceMatrix.needsUpdate = cnad.instanceMatrix.needsUpdate = true;
      if (catp.instanceColor) catp.instanceColor.needsUpdate = true; if (cnad.instanceColor) cnad.instanceColor.needsUpdate = true;
      halo.visible = S.pick >= 0;
    }
    /* modes: light the half that is working, dim the other */
    var GROUP = { light: [mDisc, mLum, lams.material, mPSII, mPSI, mSyn], carbon: [mRing, mRub, mRuBP, mSt] };
    function applyMode() {
      var m = S.mode;
      GROUP.light.forEach(function (mt) { var dim = m === 'carbon'; mt.color.copy(mt.userData.base).multiplyScalar(dim ? 0.38 : 1); mt.emissiveIntensity = m === 'light' ? 2.2 : 1; });
      GROUP.carbon.forEach(function (mt) { var dim = m === 'light'; mt.transparent = true; mt.opacity = dim ? 0.25 : 1; mt.depthWrite = !dim; mt.emissiveIntensity = m === 'carbon' ? 2.4 : 1; mt.needsUpdate = true; });
      mBack.color.copy(mBack.userData.base).multiplyScalar(m === 'carbon' ? 1.5 : (m === 'light' ? 0.75 : 1));
      var cOp = m === 'both' ? 1 : 0.35;
      [mAtp, mNad].forEach(function (mt) { mt.transparent = cOp < 1; mt.opacity = cOp; mt.needsUpdate = true; });
      PO.o2.k = PO.e.k = m === 'carbon' ? 0.25 : 1; PO.co2.k = PO.tri.k = m === 'light' ? 0.25 : 1;
      hpM.opacity = m === 'carbon' ? 0.3 : 1;
      S.dirty = true;
    }
    /* highlight a part (amber glow on every copy of it) */
    var HLM = { outer: [mOuter], inner: [mInner], stroma: [mBack], granum: [mDisc], membrane: [mDisc, lams.material], lumen: [mLum], psii: [mPSII], psi: [mPSI], synthase: [mSyn], rubisco: [mRub], rubp: [mRuBP, mRing], starch: [mSt] };
    var hlOld = [];
    function highlight(id) {
      hlOld.forEach(function (h) { h.m.emissive.copy(h.e); h.m.emissiveIntensity = h.i; }); hlOld = [];
      mOuter.uniforms.col.value.copy(mOuter.userData.base); mInner.uniforms.col.value.copy(mInner.userData.base);
      (HLM[id] || []).forEach(function (m) { if (m.isGlass) { m.uniforms.col.value.set(0xffc457); return; } hlOld.push({ m: m, e: m.emissive.clone(), i: m.emissiveIntensity }); m.emissive.set(0xffc457); m.emissiveIntensity = 0.55; });
      S.dirty = true;
    }
    /* labels */
    var tagHost = stage.querySelector('.chl-tags');
    var TAGS = [
      { id: 'outer', t: 'outer envelope', p: function (v) { return v.set(-2.3, 1.55, 0.6); }, m: 'lcb', pr: 1 },
      { id: 'inner', t: 'inner envelope', p: function (v) { return v.set(3.75, 0.85, 1.0); }, m: 'lcb', pr: 2 },
      { id: 'stroma', t: 'stroma', p: function (v) { return v.set(-0.55, -0.95, 0.75); }, m: 'cb', pr: 2 },
      { id: 'granum', t: 'granum', p: function (v) { return v.set(-2.75, discY(8, nDisc(8) - 1) + 0.1, 1.15); }, m: 'lcb', pr: 2 },
      { id: 'membrane', t: 'thylakoid membrane', p: function (v) { return v.set(-2.55, discY(4, nDisc(4) - 1), 0.75); }, m: 'lb', pr: 4 },
      { id: 'lumen', t: 'lumen', p: function (v) { return v.set(-1.1, discY(9, Math.floor(nDisc(9) / 2)), ZI - 0.02); }, m: 'lb', pr: 1, nar: 1 },
      { id: 'psii', t: 'PSII', p: function (v) { return sites.psii.length ? v.copy(sites.psii[Math.min(sites.psii.length - 1, 3)].p) : v.set(0, 1e4, 0); }, m: 'l', pr: 2 },
      { id: 'psi', t: 'PSI', p: function (v) { var s = sites.psi[1] || sites.psi[0]; return s ? v.copy(s.p) : v.set(0, 1e4, 0); }, m: 'l', pr: 3 },
      { id: 'synthase', t: 'ATP synthase', p: function (v) { var s = sites.syn[2] || sites.syn[0]; return s ? v.copy(s.p).addScaledVector(s.n, 0.18) : v.set(0, 1e4, 0); }, m: 'lb', pr: 2, nar: 1 },
      { id: 'rubisco', t: 'Rubisco (enzyme)', p: function (v) { return v.copy(rub.position).add(V2.set(0, 0.1, 0)); }, m: 'cb', pr: 1, nar: 1 },
      { id: 'rubp', t: 'RuBP (sugar that takes CO₂)', p: function (v) { return v.copy(rubps[1].position); }, m: 'cb', pr: 1, nar: 1 },
      { id: 'calvin', t: 'Calvin cycle', p: function (v) { return ringPt(250, v); }, m: 'cb', pr: 3 },
      { id: 'starch', t: 'starch grain', p: function (v) { return v.set(STARCH[0][0], STARCH[0][1] + 0.3, STARCH[0][2]); }, m: 'cb', pr: 3 },
      { id: 'o2', t: 'O₂ leaves', p: function (v) { return v.set(-1.7, 1.25, 2.2); }, m: 'lb', pr: 3 },
      { id: 'co2', t: 'CO₂ in', p: function (v) { return v.set(0.9, 1.45, 2.1); }, m: 'cb', pr: 3 },
      { id: 'tri', t: 'triose P out', p: function (v) { return v.set(2.0, -0.95, 2.0); }, m: 'cb', pr: 4 },
      { id: 'pick', t: '', p: function (v) { return S.pick >= 0 ? carrierPos(C[S.pick], v) : v.set(0, 1e4, 0); }, m: 'b', pr: 0, nar: 1 }
    ];
    TAGS.forEach(function (g) { g.el = document.createElement('span'); g.el.className = 'chl-tag' + (g.id === 'pick' ? ' pk' : ''); g.el.textContent = g.t; tagHost.appendChild(g.el); });
    var W = 1, H = 1, narrow = false;
    function drawTags() {
      var boxes = [], mk = S.mode === 'light' ? 'l' : (S.mode === 'carbon' ? 'c' : 'b');
      TAGS.slice().sort(function (a, b) { return a.pr - b.pr; }).forEach(function (g) {
        var show = (g.id === 'pick' ? S.pick >= 0 : S.names && g.m.indexOf(mk) >= 0) && (!narrow || g.nar || (g.pr <= 2 && g.id !== 'psii'));
        if (g.id === 'pick' && S.pick >= 0) g.el.textContent = 'your ' + cname(C[S.pick]);
        if (!show) { g.el.hidden = true; return; }
        g.p(V); V.project(cam);
        var x = (V.x + 1) / 2 * W, y = (1 - V.y) / 2 * H;
        if (V.z > 1 || x < 4 || x > W - 4 || y < 18 || y > H - 4) { g.el.hidden = true; return; }
        g.el.hidden = false;
        var w = g.el.offsetWidth || 60, h = 20, bx = { x: clamp(x, w / 2 + 2, W - w / 2 - 2) - w / 2, y: y - h - 6, w: w, h: h };
        if (g.id !== 'pick' && boxes.some(function (o) { return bx.x < o.x + o.w && bx.x + bx.w > o.x && bx.y < o.y + o.h && bx.y + bx.h > o.y; })) { g.el.hidden = true; return; }
        boxes.push(bx);
        g.el.style.left = (bx.x + w / 2).toFixed(1) + 'px'; g.el.style.top = y.toFixed(1) + 'px';
      });
    }
    /* camera and orbit (shared controls of the site) */
    var target = new T.Vector3(0, 0.1, 0.25);
    function autoCam() {
      var aspect = W / H, d = 10.2 * Math.max(1, 1.55 / aspect);
      cam.position.set(0.6, 0.38 * d, 0.92 * d); cam.lookAt(target);
    }
    var ctl = null;
    if (MM && MM.orbit) ctl = MM.orbit({ camera: cam, wrap: stage, w: W, h: H, invalidate: function () { kick(); } }, { surface: glh, shell: stage, bar: bar, camera: cam, reduced: reduced, minDist: 3.5, maxDist: 26, invalidate: function () { kick(); }, tagHost: stage });
    function resize() {
      var w = glh.clientWidth || 600, h = glh.clientHeight || 400;
      if (w === W && h === H) return;
      W = w; H = h; narrow = w < 560; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
      if (ctl && ctl.narrow) ctl.narrow(narrow);
      S.dirty = true;
    }
    /* picking: a click (not a drag) */
    var ray = new T.Raycaster(), ndc = new T.Vector2();
    var pickables = [outer, inner, back, discs, lums, lams, psii, psi, syn, ring, rub, catp, cnad, rimO, rimI].concat(rubps, starch);
    root.children.forEach(function (o) { if (o.userData && o.userData.part === 'stroma' && pickables.indexOf(o) < 0) pickables.push(o); });
    function pickAt(cx, cy) {
      var r = glh.getBoundingClientRect();
      ndc.set((cx - r.left) / r.width * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, cam);
      ray.params.Points = { threshold: 0.05 };
      var hits = ray.intersectObjects(pickables, false);
      for (var i = 0; i < hits.length; i++) {
        var h = hits[i], o = h.object, ud = o.userData || {};
        if (h.point.z > (ud.clipZ || 99) + 1e-3) continue;
        if (o === catp || o === cnad) {
          var idx = h.instanceId, n = -1, cnt = 0;
          for (var j = 0; j < C.length; j++) if (C[j].type === (o === catp ? 'atp' : 'nadph')) { if (cnt === idx) { n = j; break; } cnt++; }
          return { carrier: n };
        }
        if (o === inner && h.face && h.face.normal) { var nn = h.face.normal.clone().transformDirection(o.matrixWorld); if (nn.dot(ray.ray.direction) > 0) return { part: 'stroma' }; }
        if (o === discs) {
          /* the outer rim ring of a disc is membrane; its flat face is the granum */
          return { part: Math.abs(h.face && h.face.normal ? h.face.normal.y : 1) < 0.5 ? 'membrane' : 'granum' };
        }
        return { part: ud.part };
      }
      return null;
    }
    var running = false, raf = 0, visible = true, lastT = 0;
    function kick() { S.dirty = true; if (!running && visible && !document.hidden) { running = true; lastT = 0; raf = requestAnimationFrame(loop); } }
    function loop(ts) {
      raf = 0;
      if (!visible || document.hidden) { running = false; return; }
      var dt = lastT ? Math.min(0.05, (ts - lastT) / 1000) : 0; lastT = ts;
      resize();
      var moving = ctl && ctl.moving && ctl.moving();
      if (!S.frozen) advance(dt * (window.PlaySpeed ? window.PlaySpeed.get() : 1));
      if (!S.frozen || moving || S.dirty) { render(); S.dirty = false; }
      if (!S.frozen || moving) raf = requestAnimationFrame(loop); else running = false;
    }
    function render() {
      autoCam(); if (ctl) ctl.apply();
      var a = acid(S.rt ? S.rt.pH : 7.2), lit = S.mode !== 'carbon';
      mLum.emissiveIntensity = (lit ? 0.04 + 0.28 * a : 0.02) * (S.hl === 'lumen' ? 0 : 1) + (S.hl === 'lumen' ? 0.55 : 0);
      if (S.hl !== 'lumen') { var dm = lit ? 1 : 0.35; mLum.color.setRGB(lerp(0.6, 0.95, a) * dm, lerp(0.55, 0.3, a) * dm, lerp(0.32, 0.03, a) * dm); }
      var nh = Math.round(HPN * (lit ? a : 0.25 * a)), y = new T.Color(0xffe08a);
      for (var i = 0; i < HPN; i++) { var k = i < nh ? 0.9 : 0; hpCol[i * 3] = y.r * k; hpCol[i * 3 + 1] = y.g * k; hpCol[i * 3 + 2] = y.b * k; }
      hpG.attributes.color.needsUpdate = true;
      placeCarriers(); posSyn();
      RUBP();
      renderer.render(scene, cam);
      drawTags();
      if (S.after) S.after();
    }
    function RUBP() { for (var i = 0; i < 3; i++) { ringPt(90 + S.ring * 360 + i * 120 + 6, V); rubps[i].position.copy(V); rubps[i].rotation.z = S.ring * 4 + i; } }
    /* model time advance: everything moves at engine rates */
    function advance(dtm) {
      if (!(dtm > 0) || !S.rt) return;
      var r = S.rt, i;
      S.tm += dtm;
      S.cnt.atp += r.atp * dtm; S.cnt.spent += r.spent * dtm; S.cnt.nadph += r.nadph * dtm; S.cnt.co2 += r.vc * dtm;
      var wa = r.atp / Q / NA, wn = r.nadph / Q / NN;
      for (i = 0; i < C.length; i++) { var c = C[i]; c.ph += (c.type === 'atp' ? wa : wn) * dtm; if (c.ph >= 1) c.ph -= 1; }
      var before = S.ring;
      S.ring += r.vc / Q / 3 * dtm;
      S.cnt.turns += Math.floor(S.ring * 3) - Math.floor(before * 3);
      S.rot += TAU * 0.9 * (r.atp / 70) * dtm;
      advParticles(dtm, r);
    }
    var tv = new T.Vector3(), tc = new T.Vector3(), tb = new T.Vector3();
    function advParticles(dtm, r) {
      var A2 = S.acc;
      A2.o2 += r.o2 / Q * dtm; A2.e += r.J / Q * 0.5 * dtm; A2.co2 += r.vc / Q * dtm; A2.tri += Math.max(0, r.A) / 3 / Q * dtm;
      var j;
      while (A2.o2 >= 1) { A2.o2 -= 1; if (!sites.psii.length) continue; j = Math.floor(Math.random() * sites.psii.length); tv.copy(sites.psii[j].p); tb.set(tv.x + (Math.random() - 0.5) * 2.5, 1.6 + Math.random() * 1.2, 3.4 + Math.random()); tc.copy(tv).add(tb).multiplyScalar(0.5); tc.z += 0.6; PO.o2.spawn(tv, tc, tb, 2.2); }
      while (A2.e >= 1) { A2.e -= 1; if (!sites.psii.length || !sites.psi.length) continue; j = Math.floor(Math.random() * sites.psii.length); tv.copy(sites.psii[j].p); var best = null, bd = 1e9; sites.psi.forEach(function (s) { var d = s.p.distanceToSquared(tv); if (d < bd) { bd = d; best = s; } }); tb.copy(best.p); tc.copy(tv).add(tb).multiplyScalar(0.5); tc.z += 0.05; PO.e.spawn(tv, tc, tb, 0.7); }
      while (A2.co2 >= 1) { A2.co2 -= 1; tv.set(-1.5 + Math.random() * 3.4, 1.9 + Math.random(), 3.3 + Math.random()); tb.copy(rub.position); tc.copy(tv).add(tb).multiplyScalar(0.5); tc.y += 0.3; PO.co2.spawn(tv, tc, tb, 1.7); }
      while (A2.tri >= 1) { A2.tri -= 1; ringPt(20, tv); if (Math.random() < 0.25) tb.set(STARCH[0][0], STARCH[0][1], STARCH[0][2] + 0.3); else tb.set(1.8 + Math.random() * 1.5, -1.5 - Math.random() * 0.6, 3.0 + Math.random()); tc.copy(tv).add(tb).multiplyScalar(0.5); tc.y += 0.2; PO.tri.spawn(tv, tc, tb, 2.0); }
      Object.keys(PO).forEach(function (k) { PO[k].step(dtm); });
    }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) kick(); }, { rootMargin: '60px' }).observe(stage);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) kick(); });
    layout(); applyMode(); resize();
    function partXY(id) { var g = null; TAGS.forEach(function (t) { if (t.id === id) g = t; }); if (!g) return null; g.p(V); V.project(cam); return { x: (V.x + 1) / 2 * W, y: (1 - V.y) / 2 * H, w: W, h: H }; }
    return { partXY: partXY, kick: kick, layout: layout, applyMode: applyMode, highlight: highlight, pickAt: pickAt, render: render, advance: advance, ctl: ctl, surface: glh, renderer: renderer, sites: sites };
  }

  /* ------------------------------------------------------------ static 2D fallback (no WebGL, or ?ws=2d) */
  function buildSVG(stage) {
    var g = '', i, d;
    for (i = 0; i < GR.length; i++) {
      var x = 300 + GR[i][0] * 52, y = 168 + GR[i][1] * 30, n = nDisc(i);
      g += '<g data-part="granum">';
      for (d = 0; d < n; d++) g += '<rect x="' + (x - 22) + '" y="' + (y - n * 3.2 + d * 6.4) + '" width="44" height="4.6" rx="2.3" fill="#58a645" stroke="#2e6b25" stroke-width=".6"/>';
      g += '</g>';
    }
    var lam = '';
    PAIRS.forEach(function (p) { var a = GR[p[0]], b = GR[p[1]]; lam += '<line x1="' + (300 + a[0] * 52) + '" y1="' + (168 + a[1] * 30) + '" x2="' + (300 + b[0] * 52) + '" y2="' + (168 + b[1] * 30 + 4) + '"/>'; });
    var svg = '<svg class="chl-svg" viewBox="0 0 600 340" role="img" aria-label="A chloroplast drawn flat: double envelope, grana stacks joined by sheets, starch grains and the Calvin cycle"><g font-family="IBM Plex Sans,system-ui,sans-serif" font-size="12" fill="#f4f1e8">' +
      '<ellipse data-part="outer" cx="300" cy="168" rx="282" ry="140" fill="#2a4a2c" stroke="#c5e6a0" stroke-width="3"/>' +
      '<ellipse data-part="inner" cx="300" cy="168" rx="268" ry="128" fill="none" stroke="#8fcf6a" stroke-width="3"/>' +
      '<ellipse data-part="stroma" cx="300" cy="168" rx="264" ry="124" fill="#1d3a22"/>' +
      '<g data-part="membrane" stroke="#4f9a3e" stroke-width="3.2">' + lam + '</g>' + g +
      '<ellipse data-part="starch" cx="310" cy="152" rx="30" ry="15" fill="#f3ecd8"/><ellipse data-part="starch" cx="92" cy="166" rx="17" ry="11" fill="#f3ecd8"/>' +
      '<circle cx="300" cy="190" r="26" fill="none" stroke="#d8c27a" stroke-width="3" data-part="rubp"/>' +
      '<circle data-part="rubisco" cx="300" cy="163" r="8" fill="#e09a3c"/>' +
      '<polygon data-part="rubp" points="324,196 330,191 336,196 334,203 326,203" fill="#f2e7c4"/>' +
      '<text x="300" y="300" text-anchor="middle">Click a part to read about it. This is a flat drawing (no 3D here).</text>' +
      '<text x="24" y="30">outer and inner envelope</text><text x="370" y="232">Calvin cycle (Rubisco, RuBP)</text><text x="180" y="108">granum</text><text x="345" y="140">starch grain</text>' +
      '</g></svg>';
    stage.querySelector('.chl-gl').outerHTML = svg;
    return stage.querySelector('.chl-svg');
  }

  /* ------------------------------------------------------------ 2D panes: cross section + loop map, plot */
  function pal() {
    var P = LP.mol && LP.mol.palette ? LP.mol.palette(dark()) : null, dk = dark();
    return {
      dk: dk, ink: dk ? '#ece6da' : '#2a231c', ink2: dk ? '#b3aca0' : '#5e5141', bg: dk ? '#11161b' : '#faf6ec',
      stroma: P ? P.stroma : (dk ? '#0c1912' : '#eef1df'), mem: dk ? '#4f9a3e' : '#5c9a46', memD: dk ? '#2e5c24' : '#3d7a2e',
      lumen: P ? P.lumen : (dk ? '#0b1420' : '#eef0f3'), acid: P ? P.lumenAcid : (dk ? '#4a2a06' : '#f7dc94'),
      hp: P ? P.Hp : '#f2c230', hpInk: '#3a2a00', atp: P ? P.atp : '#e8891a', nad: P ? P.nadph : '#1f9e93', psii: P ? P.psii : '#3d8f7c', psi: P ? P.psi : '#4a7cc4',
      syn: P ? P.syn : '#6b8fc9', synA: P ? P.synA : '#a9c3ea', O: window.WPMolColor ? WPMolColor.atom('o2', 'O', dk) : (P ? P.O : '#d2392b'), /* v19: O2 crimson */ e: P ? P.e : '#3f9a2a', ring: dk ? '#d8c27a' : '#9a7a20', rub: dk ? '#e09a3c' : '#b8641a', pick: dk ? '#ffd479' : '#b07a00'
    };
  }
  function mixHex(a, b, t) {
    function h(c) { c = c.replace('#', ''); return [0, 2, 4].map(function (i) { return parseInt(c.substr(i, 2), 16); }); }
    var x = h(a), y = h(b); return 'rgb(' + x.map(function (v, i) { return Math.round(v + (y[i] - v) * t); }).join(',') + ')';
  }
  function fit(cv, hDesk, hPhone) {
    var w = cv.clientWidth || 600, h = w < 520 ? hPhone : hDesk, d = Math.min(2, window.devicePixelRatio || 1);
    if (cv.width !== Math.round(w * d) || cv.height !== Math.round(h * d)) { cv.width = Math.round(w * d); cv.height = Math.round(h * d); cv.style.height = h + 'px'; }
    var x = cv.getContext('2d'); x.setTransform(d, 0, 0, d, 0, 0); return { x: x, w: w, h: h };
  }
  var SL = { rects: [], hit: [] };
  function drawSlice(cv) {
    var F = fit(cv, 300, 500), x = F.x, w = F.w, h = F.h, p = pal(), r = S.rt || rates({}), t = S.tm;
    x.clearRect(0, 0, w, h); x.fillStyle = p.bg; x.fillRect(0, 0, w, h);
    var wide = w >= 520, sx = 0, sy = 0, sw = wide ? w * 0.56 : w, sh = wide ? h : 250;
    var mx = wide ? sw : 0, my = wide ? 0 : sh, mw = wide ? w - sw : w, mh = wide ? h : h - sh;
    var lit = S.mode !== 'carbon', cb = S.mode !== 'light';
    SL.hit = [];
    /* --- cross section --- */
    x.save(); x.globalAlpha = lit ? 1 : 0.4;
    x.fillStyle = p.stroma; x.fillRect(sx, sy, sw, sh);
    var a = acid(r.pH), light = clamp((LP.state ? LP.state.ppfd : 0) / 500, 0, 1);
    var n = Math.max(2, Math.round(9 * S.f)), top = sy + 66, avail = sh - 104, pitch = Math.min(26, avail / n), m = Math.max(2.4, pitch * 0.15);
    var lh = pitch * (0.2 + 0.16 * light), gw = sw * 0.46, gx = sx + sw * 0.15, gy = top + (avail - n * pitch) / 2;
    var chX = gx + gw - 2, chW = 9, lamY = gy + Math.floor(n / 2) * pitch + pitch / 2 - lh / 2, lamX1 = sx + sw - 4;
    var rects = [];
    for (var i = 0; i < n; i++) rects.push([gx, gy + i * pitch + (pitch - lh) / 2, gw, lh]);
    var chan = [chX, rects[0][1], chW, rects[n - 1][1] + lh - rects[0][1]], lam = [chX, lamY, lamX1 - chX, lh];
    function rr(R, g, fill) { x.beginPath(); var rad = Math.min((R[3] + 2 * g) / 2, 8); if (x.roundRect) x.roundRect(R[0] - g, R[1] - g, R[2] + 2 * g, R[3] + 2 * g, rad); else x.rect(R[0] - g, R[1] - g, R[2] + 2 * g, R[3] + 2 * g); x.fillStyle = fill; x.fill(); }
    var lumCol = mixHex(p.lumen.charAt(0) === '#' ? p.lumen : '#eef0f3', p.acid.charAt(0) === '#' ? p.acid : '#f7dc94', a);
    rects.concat([chan, lam]).forEach(function (R) { rr(R, m, p.mem); });
    rects.concat([chan, lam]).forEach(function (R) { rr(R, 0, lumCol); });
    SL.rects = rects.concat([chan, lam]);
    SL.hit.push({ part: 'lumen', test: function (X, Y) { return SL.rects.some(function (R) { return X >= R[0] && X <= R[0] + R[2] && Y >= R[1] && Y <= R[1] + R[3]; }); } });
    SL.hit.push({ part: 'membrane', test: function (X, Y) { return SL.rects.some(function (R) { return X >= R[0] - m - 1 && X <= R[0] + R[2] + m + 1 && Y >= R[1] - m - 1 && Y <= R[1] + R[3] + m + 1; }); } });
    /* protons: more of them as the lumen pH falls */
    var tot = 0; rects.forEach(function (R) { tot += R[2]; }); tot += lam[2];
    var nh = lit ? Math.round(4 + 80 * a) : Math.round(4 + 20 * a);
    for (i = 0; i < nh; i++) {
      var u = hash(i * 2.3 + 1) * tot, R = null;
      for (var j = 0; j < rects.length; j++) { if (u < rects[j][2]) { R = rects[j]; break; } u -= rects[j][2]; }
      if (!R) { R = lam; u = Math.min(u, lam[2] - 4); }
      var px = R[0] + clamp(u + Math.sin(t * 2 + i) * 2, 2, R[2] - 2), py = R[1] + R[3] / 2 + Math.sin(t * 3.1 + i * 1.7) * Math.max(0, R[3] / 2 - 2.5);
      x.fillStyle = p.hp; x.beginPath(); x.arc(px, py, Math.max(1.8, Math.min(3, lh * 0.3)), 0, TAU); x.fill();
    }
    /* machines: PSII in the stacked part, PSI and ATP synthase where the membrane faces the stroma */
    function blob(cx, cy, ww, hh, col, part) { x.fillStyle = col; x.beginPath(); if (x.roundRect) x.roundRect(cx - ww / 2, cy - hh / 2, ww, hh, 3); else x.rect(cx - ww / 2, cy - hh / 2, ww, hh); x.fill(); SL.hit.unshift({ part: part, test: function (X, Y) { return Math.abs(X - cx) <= ww / 2 + 2 && Math.abs(Y - cy) <= hh / 2 + 2; } }); }
    for (i = 1; i < n; i++) blob(gx + gw * 0.3, rects[i][1] - m / 2, 12, m + 4, p.psii, 'psii');
    blob(gx + gw * 0.55, rects[0][1] - m / 2, 12, m + 4, p.psi, 'psi');
    blob(lam[0] + lam[2] * 0.3, lamY + lh + m / 2, 12, m + 4, p.psi, 'psi');
    var sxp = lam[0] + lam[2] * 0.66, syp = lamY - m;
    x.strokeStyle = p.syn; x.lineWidth = 4; x.beginPath(); x.moveTo(sxp, lamY + lh); x.lineTo(sxp, syp - 12); x.stroke();
    var rot = S.rot;
    for (i = 0; i < 3; i++) { x.fillStyle = i ? p.syn : p.synA; x.beginPath(); x.arc(sxp + Math.cos(rot + i * TAU / 3) * 6, syp - 18 + Math.sin(rot + i * TAU / 3) * 6, 5.5, 0, TAU); x.fill(); }
    SL.hit.unshift({ part: 'synthase', test: function (X, Y) { return Math.abs(X - sxp) < 14 && Y > syp - 30 && Y < lamY + lh + 3; } });
    if (lit && r.atp > 0) {
      for (i = 0; i < 3; i++) { var q = (t * r.atp / 30 + i / 3) % 1; x.fillStyle = p.hp; x.beginPath(); x.arc(sxp, lamY + lh - q * (lh + m + 12), 2.2, 0, TAU); x.fill(); }
      for (i = 0; i < 2; i++) { var q2 = (t * r.atp / 50 + i / 2) % 1; x.fillStyle = p.atp; x.beginPath(); x.arc(sxp + 8 + q2 * (sw - (sxp - sx) - 14), syp - 18 - q2 * 14, 3.4, 0, TAU); x.fill(); }
      for (i = 0; i < 3; i++) { var q3 = (t * r.o2 / 18 + i / 3) % 1, ox = gx - 10 - q3 * (gx - sx - 18) * 0.5, oy = rects[n - 1][1] - q3 * (rects[n - 1][1] - top); x.globalAlpha = (lit ? 1 : 0.4) * Math.min(1, (1 - q3) * 4); x.fillStyle = p.O; x.beginPath(); x.arc(ox - 2.5, oy, 3, 0, TAU); x.arc(ox + 2.5, oy, 3, 0, TAU); x.fill(); x.globalAlpha = lit ? 1 : 0.4; }
      for (i = 0; i < 3; i++) { var q4 = (t * r.J / 40 + i / 3) % 1; x.fillStyle = p.e; x.beginPath(); x.arc(gx + gw * 0.3 + q4 * gw * 0.25, rects[0][1] - m / 2, 2.4, 0, TAU); x.fill(); }
    }
    x.restore();
    x.fillStyle = p.ink; x.font = '600 13px IBM Plex Sans, system-ui, sans-serif'; x.textBaseline = 'alphabetic';
    x.fillText('Lumen pH ' + fmt(r.pH, 2), sx + 10, sy + 18);
    x.font = '11.5px IBM Plex Sans, system-ui, sans-serif'; x.fillStyle = p.ink2;
    x.fillText('lower number, more H⁺; stroma pH ' + fmt(r.spH, 1), sx + 10, sy + 33);
    x.fillText('granum (' + n + ' discs)', gx, sh - 22);
    x.fillText('one lumen, joined at the edge', gx, sh - 8);
    x.fillText('PSII', gx + gw * 0.3 - 10, rects[0][1] - m - 5); x.fillText('O₂', sx + 6, top + 14);
    x.fillText('ATP synthase', Math.min(sxp - 30, sx + sw - 76), syp - 30);
    x.fillText('stroma lamella', lam[0] + 14, lamY + lh + m + 14);
    /* --- loop map: the same carriers --- */
    x.save(); x.globalAlpha = cb || S.mode === 'light' ? 1 : 1;
    x.fillStyle = p.bg; x.fillRect(mx, my, mw, mh);
    x.strokeStyle = p.dk ? '#3b4855' : '#c4b597'; x.lineWidth = 1; x.beginPath(); if (wide) { x.moveTo(mx + 0.5, 0); x.lineTo(mx + 0.5, h); } else { x.moveTo(0, my + 0.5); x.lineTo(w, my + 0.5); } x.stroke();
    var ccx = mx + mw - Math.min(70, mw * 0.3), ccy = my + mh * 0.5, cr2 = Math.min(42, mh * 0.24, mw * 0.2), memX = mx + 16;
    x.fillStyle = p.mem; x.fillRect(memX - 4, ccy - mh * 0.25, 8, mh * 0.5);
    x.fillStyle = p.ink; x.font = '600 12.5px IBM Plex Sans, system-ui, sans-serif'; x.fillText('Same carriers, round and round', mx + 10, my + 17);
    x.font = '11px IBM Plex Sans, system-ui, sans-serif'; x.fillStyle = p.ink2;
    var BX = [[mx, my, mw, 38]];
    function lbl(t2, X2, Y2, al) { var tw = x.measureText(t2).width, x0 = al === 'center' ? X2 - tw / 2 : X2; x.textAlign = al || 'left'; x.fillText(t2, X2, Y2); x.textAlign = 'left'; BX.push([x0 - 2, Y2 - 11, tw + 4, 15]); }
    lbl('membrane: charge', memX - 6, Math.min(ccy + mh * 0.25 + 14, my + mh - 44));
    x.strokeStyle = p.ring; x.lineWidth = 3; x.globalAlpha = cb ? 1 : 0.45; x.beginPath(); x.arc(ccx, ccy, cr2, 0, TAU); x.stroke();
    var rubA = -Math.PI / 2;
    x.fillStyle = p.rub; x.beginPath(); x.arc(ccx, ccy - cr2, 6, 0, TAU); x.fill();
    for (i = 0; i < 3; i++) { var aa = rubA + S.ring * TAU + i * TAU / 3 + 0.12, rx = ccx + Math.cos(aa) * cr2, ry = ccy + Math.sin(aa) * cr2; x.fillStyle = p.dk ? '#f2e7c4' : '#8a6d2a'; x.beginPath(); for (var k = 0; k < 5; k++) { var b = k * TAU / 5 - Math.PI / 2; x.lineTo(rx + Math.cos(b) * 4.5, ry + Math.sin(b) * 4.5); } x.fill(); }
    x.globalAlpha = 1; x.fillStyle = p.ink2;
    var rl = 'Rubisco puts CO₂ on RuBP', rlw = x.measureText(rl).width;
    lbl(rl, clamp(ccx, mx + 10 + rlw / 2, mx + mw - 6 - rlw / 2), ccy - cr2 - 10, 'center');
    lbl('turns: ' + fmt(S.cnt.turns, 0), ccx, ccy + 4, 'center');
    var noteY = my + mh - 24;
    lbl('3 turns fix 3 CO₂, make 6 triose P:', mx + 10, noteY); lbl('1 leaves, 5 rebuild 3 RuBP.', mx + 10, noteY + 13);
    /* map positions match the 3D phases */
    function mapPos(c) {
      var ph = c.ph, idx = (c.k % 6) / 5, mY = ccy - mh * 0.24 + idx * mh * 0.48, stA = -(c.st) * Math.PI / 180;
      var pS = [ccx + Math.cos(stA) * cr2, ccy + Math.sin(stA) * cr2];
      if (ph < 0.1) return [memX + (c.type === 'atp' ? 10 : 18), mY];
      if (ph < 0.42) { var u = (ph - 0.1) / 0.32; return qb([memX + 12, mY], [(memX + ccx) / 2, my + mh * 0.12], pS, u); }
      if (ph < 0.55) { var a2 = stA - (ph - 0.42) / 0.13 * 0.7; return [ccx + Math.cos(a2) * cr2, ccy + Math.sin(a2) * cr2]; }
      var e = stA - 0.7, pE = [ccx + Math.cos(e) * cr2, ccy + Math.sin(e) * cr2];
      return qb(pE, [(memX + ccx) / 2, my + mh * 0.9], [memX + 12, mY], (ph - 0.55) / 0.45);
    }
    function qb(a2, c2, b2, u) { return [(1 - u) * (1 - u) * a2[0] + 2 * u * (1 - u) * c2[0] + u * u * b2[0], (1 - u) * (1 - u) * a2[1] + 2 * u * (1 - u) * c2[1] + u * u * b2[1]]; }
    SL.map = []; var PICKTAG = null;
    C.forEach(function (c, ci) {
      var q5 = mapPos(c), ch = charged(c), rad = ch ? 5 : 3.6;
      x.fillStyle = c.type === 'atp' ? (ch ? p.atp : mixHex(p.atp.charAt(0) === '#' ? p.atp : '#e8891a', p.dk ? '#11161b' : '#faf6ec', 0.55)) : (ch ? p.nad : mixHex(p.nad.charAt(0) === '#' ? p.nad : '#1f9e93', p.dk ? '#11161b' : '#faf6ec', 0.55));
      x.beginPath();
      if (c.type === 'atp') x.arc(q5[0], q5[1], rad, 0, TAU); else { x.moveTo(q5[0], q5[1] - rad - 1); x.lineTo(q5[0] + rad + 1, q5[1]); x.lineTo(q5[0], q5[1] + rad + 1); x.lineTo(q5[0] - rad - 1, q5[1]); x.closePath(); }
      x.fill();
      if (!ch) { x.strokeStyle = c.type === 'atp' ? p.atp : p.nad; x.lineWidth = 1.2; x.stroke(); }
      SL.map.push([q5[0], q5[1], ci]);
      if (ci === S.pick) {
        x.strokeStyle = p.pick; x.lineWidth = 2.5; x.beginPath(); x.arc(q5[0], q5[1], rad + 5, 0, TAU); x.stroke();
        x.font = '600 11.5px IBM Plex Sans, system-ui, sans-serif';
        var pt = 'your ' + cname(c), pw = x.measureText(pt).width + 8, ph2 = 16, cand = [[12, -22], [12, 6], [-pw - 12, -22], [-pw - 12, 6], [-pw / 2, -32], [-pw / 2, 14]], spot = null;
        for (var ck = 0; ck < cand.length && !spot; ck++) {
          var bx = clamp(q5[0] + cand[ck][0], mx + 2, mx + mw - pw - 2), by = clamp(q5[1] + cand[ck][1], my + 2, my + mh - ph2 - 2);
          if (!BX.some(function (o) { return bx < o[0] + o[2] && bx + pw > o[0] && by < o[1] + o[3] && by + ph2 > o[1]; })) spot = [bx, by];
        }
        PICKTAG = { t: pt, b: spot || [clamp(q5[0] + 12, mx + 2, mx + mw - pw - 2), clamp(q5[1] - 22, my + 2, my + mh - ph2 - 2)], w: pw };
        x.font = '11px IBM Plex Sans, system-ui, sans-serif';
      }
    });
    if (PICKTAG) { x.font = '600 11.5px IBM Plex Sans, system-ui, sans-serif'; x.fillStyle = p.pick; x.beginPath(); if (x.roundRect) x.roundRect(PICKTAG.b[0], PICKTAG.b[1], PICKTAG.w, 16, 8); else x.rect(PICKTAG.b[0], PICKTAG.b[1], PICKTAG.w, 16); x.fill(); x.fillStyle = p.dk ? '#1b1608' : '#ffffff'; x.fillText(PICKTAG.t, PICKTAG.b[0] + 4, PICKTAG.b[1] + 12); x.font = '11px IBM Plex Sans, system-ui, sans-serif'; }
    x.fillStyle = p.ink2; x.fillText('● ATP  ○ ADP  ◆ NADPH  ◇ NADP⁺', mx + 10, my + 33);
    x.restore();
    SL.geom = { sw: sw, sh: sh, wide: wide };
  }
  var PLOT = { pts: null, pts1: null, key: '' };
  function plotData() {
    var st = LP.state || {}, key = JSON.stringify(st) + '|' + S.f;
    if (key === PLOT.key || !LP.solve) return;
    PLOT.key = key;
    var xs = []; for (var v = 0; v <= 2000; v += 80) xs.push(v);
    function run(f) { return xs.map(function (pp) { var o = JSON.parse(JSON.stringify(st)); o.ppfd = pp; var r = LP.solve(f < 0.999 ? localState(o, f) : o); return [pp, Math.max(0, r.atpRate || 0), Math.max(0, r.vc || 0)]; }); }
    PLOT.pts = run(S.f); PLOT.pts1 = S.f < 0.999 ? run(1) : null;
  }
  function drawPlot(cv) {
    plotData();
    var F = fit(cv, 230, 230), x = F.x, w = F.w, h = F.h, p = pal(), r = S.rt || rates({});
    x.clearRect(0, 0, w, h); x.fillStyle = p.bg; x.fillRect(0, 0, w, h);
    var L = 44, R = w - 86, T0 = 26, Bt = h - 34, ymax = 80;
    (PLOT.pts1 || PLOT.pts || []).forEach(function (q) { ymax = Math.max(ymax, q[1] * 1.08); });
    function X(v) { return L + v / 2000 * (R - L); } function Yv(v) { return Bt - v / ymax * (Bt - T0); }
    x.strokeStyle = p.dk ? '#3b4855' : '#c4b597'; x.lineWidth = 1; x.font = '11px IBM Plex Sans, system-ui, sans-serif'; x.fillStyle = p.ink2;
    for (var g = 0; g <= ymax; g += 20) { x.beginPath(); x.moveTo(L, Yv(g)); x.lineTo(R, Yv(g)); x.stroke(); x.fillText(String(g), L - 22, Yv(g) + 4); }
    [0, 500, 1000, 1500, 2000].forEach(function (v) { x.fillText(fmt(v, 0), X(v) - 12, Bt + 14); });
    var xl = 'light, µmol photons per m² per s'; x.fillText(xl, L + (R - L) / 2 - x.measureText(xl).width / 2, h - 6);
    x.save(); x.translate(11, (T0 + Bt) / 2 + 40); x.rotate(-Math.PI / 2); x.fillText('µmol per m² per s', 0, 0); x.restore();
    x.fillStyle = p.ink; x.font = '600 12.5px IBM Plex Sans, system-ui, sans-serif'; x.fillText('Less light: less ATP, slower cycle', L, 15);
    function line(pts, i, col, dash, wd) { if (!pts) return; x.strokeStyle = col; x.lineWidth = wd; x.setLineDash(dash); x.beginPath(); pts.forEach(function (q, k) { if (k) x.lineTo(X(q[0]), Yv(q[i])); else x.moveTo(X(q[0]), Yv(q[i])); }); x.stroke(); x.setLineDash([]); }
    line(PLOT.pts1, 1, p.atp, [4, 4], 1.2); line(PLOT.pts1, 2, p.psii, [4, 4], 1.2);
    line(PLOT.pts, 1, p.atp, [], 2.4); line(PLOT.pts, 2, p.psii, [], 2.4);
    var last = PLOT.pts ? PLOT.pts[PLOT.pts.length - 1] : [0, 0, 0];
    x.font = '11.5px IBM Plex Sans, system-ui, sans-serif';
    x.fillStyle = p.atp; x.fillText('ATP made', R + 6, Yv(last[1]) + 4);
    x.fillStyle = p.psii; x.fillText('CO₂ fixed', R + 6, Yv(last[2]) + 4);
    if (PLOT.pts1) { x.fillStyle = p.ink2; x.fillText('dashed: full', R + 6, T0 + 4); x.fillText('membrane', R + 6, T0 + 17); }
    var pp = LP.state ? LP.state.ppfd : 0;
    [[r.atp, p.atp], [r.vc, p.psii]].forEach(function (d) { x.fillStyle = d[1]; x.strokeStyle = p.bg; x.lineWidth = 2; x.beginPath(); x.arc(X(clamp(pp, 0, 2000)), Yv(d[0]), 5.5, 0, TAU); x.fill(); x.stroke(); });
  }

  /* ------------------------------------------------------------ mount */
  var EL = null;
  function mount(host) {
    host.innerHTML = markup();
    var root = host.querySelector('#chl-ws'), stage = root.querySelector('.chl-stage'), bar = root.querySelector('.chl-bar');
    EL = {
      root: root, stage: stage, panel: root.querySelector('.chl-panel'), frz: root.querySelector('.chl-frz'), now: root.querySelector('#chl-now'),
      ppfd: root.querySelector('#chl-ppfd'), ppfdO: root.querySelector('#chl-ppfd-o'), mem: root.querySelector('#chl-mem'), memO: root.querySelector('#chl-mem-o'),
      slice: root.querySelector('#chl-slice'), plot: root.querySelector('#chl-plot'), part: root.querySelector('#chl-part'), bar: bar
    };
    refresh();
    var force2d = /[?&]ws=2d\b/.test(location.search);
    var glOK = !force2d && window.THREE && (LP.macro && LP.macro.ok ? LP.macro.ok() : true);
    if (glOK) { try { G = build3D(stage, bar); } catch (e) { console.error('chloroplast 3D failed, using the flat drawing', e); G = null; } }
    if (!G) {
      var gl = stage.querySelector('.chl-gl canvas'); if (gl && gl.parentNode) gl.parentNode.removeChild(gl);
      var svg = buildSVG(stage);
      svg.addEventListener('click', function (e) { var t = e.target.closest('[data-part]'); if (t) openPart(t.getAttribute('data-part')); });
      stage.querySelector('.chl-key').hidden = true;
    } else {
      /* click versus drag on the 3D surface */
      var down = null, surf = G.surface;
      surf.addEventListener('pointerdown', function (e) { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
      surf.addEventListener('pointerup', function (e) {
        if (!down) return; var d = Math.hypot(e.clientX - down.x, e.clientY - down.y), dt = performance.now() - down.t; down = null;
        if (d > 6 || dt >= 450 || (e.button != null && e.button > 0) || e.isPrimary === false) return; // v19: the site wide still click rule (freeze.js)
        click3D(e.clientX, e.clientY);
      });
      surf.addEventListener('pointercancel', function () { down = null; });
      surf.addEventListener('keydown', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setFrozen(!S.frozen); } });
      S.after = function () { if (!S._last2d || performance.now() - S._last2d > 45) { S._last2d = performance.now(); draw2D(); } };
    }
    /* controls */
    root.querySelectorAll('.chl-modes button').forEach(function (b) { b.addEventListener('click', function () { setMode(b.getAttribute('data-m')); }); });
    var pp0 = null;
    EL.ppfd.addEventListener('input', function () { if (pp0 == null) pp0 = { p: LP.state.ppfd, r: S.rt }; LP.set({ ppfd: +EL.ppfd.value }); });
    EL.ppfd.addEventListener('change', function () { if (pp0) sayLight(pp0.p, pp0.r); pp0 = null; });
    var f0 = null;
    EL.mem.addEventListener('input', function () { if (f0 == null) f0 = { f: S.f, r: S.rt }; S.f = +EL.mem.value / 100; refresh(); if (G) G.layout(); syncUI(); kickAll(); });
    EL.mem.addEventListener('change', function () { if (f0) sayMem(f0.f, f0.r); f0 = null; });
    EL.part.addEventListener('change', function () { if (EL.part.value) openPart(EL.part.value); });
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('[data-a]'); if (!b) return; var a = b.getAttribute('data-a');
      if (a === 'freeze') setFrozen(!S.frozen);
      else if (a === 'step') step();
      else if (a === 'fatp' || a === 'fnad') follow(a === 'fatp' ? 'atp' : 'nadph');
      else if (a === 'names') { S.names = !S.names; b.setAttribute('aria-pressed', S.names ? 'true' : 'false'); kickAll(); }
    });
    root.querySelector('[data-a="zero"]').addEventListener('click', function () { S.cnt = { atp: 0, spent: 0, nadph: 0, co2: 0, turns: 0 }; S.tm0 = S.tm; syncCounters(true); say('Counters back to zero. Watch ATP made and ATP spent climb together.'); kickAll(); });
    EL.slice.addEventListener('click', function (e) {
      var rc = EL.slice.getBoundingClientRect(), X = e.clientX - rc.left, Y = e.clientY - rc.top;
      var best = -1, bd = 144; (SL.map || []).forEach(function (m) { var d = (m[0] - X) * (m[0] - X) + (m[1] - Y) * (m[1] - Y); if (d < bd) { bd = d; best = m[2]; } });
      if (best >= 0) { pickCarrier(best); return; }
      if (SL.geom && (SL.geom.wide ? X < SL.geom.sw : Y < SL.geom.sh)) {
        for (var i = 0; i < SL.hit.length; i++) if (SL.hit[i].test(X, Y)) { openPart(SL.hit[i].part); return; }
        openPart('stroma');
      }
    });
    if (U().onPrefs) U().onPrefs(function () { if (reduced() && !S.frozen) setFrozen(true); kickAll(); });
    if ('ResizeObserver' in window) new ResizeObserver(function () { kickAll(); }).observe(root);
    /* phones: the sticky readout rail tucks away while this workstation is on screen, as it does for the plate theatres */
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { var rl = document.querySelector('.wp-rail'); if (rl) rl.classList.toggle('tuck', es[0].intersectionRatio > 0.2); }, { threshold: [0, 0.2, 0.5] }).observe(stage.parentNode);
    if (reduced()) setFrozen(true, true);
    syncUI(); kickAll();
    if (!G) startLoop2D();
  }
  /* 2D only loop (fallback page): same clock */
  function startLoop2D() {
    var last = 0, vis = true;
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { vis = es[0].isIntersecting; if (vis) requestAnimationFrame(f); }, { rootMargin: '60px' }).observe(EL.root);
    function f(ts) {
      if (!vis || document.hidden) return;
      var dt = last ? Math.min(0.05, (ts - last) / 1000) : 0; last = ts;
      if (!S.frozen) advance2D(dt * (window.PlaySpeed ? window.PlaySpeed.get() : 1));
      draw2D(); if (!S.frozen) requestAnimationFrame(f); else last = 0;
    }
    S.kick2d = function () { requestAnimationFrame(f); };
    requestAnimationFrame(f);
  }
  function advance2D(dtm) {
    if (!(dtm > 0) || !S.rt) return;
    var r = S.rt; S.tm += dtm;
    S.cnt.atp += r.atp * dtm; S.cnt.spent += r.spent * dtm; S.cnt.nadph += r.nadph * dtm; S.cnt.co2 += r.vc * dtm;
    C.forEach(function (c) { c.ph += (c.type === 'atp' ? r.atp / Q / NA : r.nadph / Q / NN) * dtm; if (c.ph >= 1) c.ph -= 1; });
    var b = S.ring; S.ring += r.vc / Q / 3 * dtm; S.cnt.turns += Math.floor(S.ring * 3) - Math.floor(b * 3);
    S.rot += TAU * 0.9 * (r.atp / 70) * dtm;
  }
  function kickAll() { S.dirty = true; if (G) G.kick(); else if (S.kick2d) S.kick2d(); draw2D(); }
  function draw2D() { if (!EL) return; try { drawSlice(EL.slice); drawPlot(EL.plot); } catch (e) { console.error(e); } syncCounters(); }
  function step() { var n = 10; for (var i = 0; i < n; i++) { if (G) G.advance(0.05); else advance2D(0.05); } kickAll(); say('One step: half a second of model time.'); }
  function setFrozen(on, quiet) {
    S.frozen = !!on;
    var b = EL.bar.querySelector('[data-a="freeze"]'); b.setAttribute('aria-pressed', S.frozen ? 'true' : 'false'); b.textContent = S.frozen ? 'Play' : 'Pause'; // v19: the same Pause / Play label as every animated view
    EL.bar.querySelector('[data-a="step"]').hidden = !S.frozen;
    EL.frz.hidden = !S.frozen || !G;
    if (!quiet) say(S.frozen ? 'Frozen. You can still turn and zoom, and click parts to read about them.' : 'Running again.');
    kickAll();
  }
  function setMode(m) {
    S.mode = m;
    EL.root.querySelectorAll('.chl-modes button').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-m') === m ? 'true' : 'false'); });
    if (G) G.applyMode();
    var r = S.rt || {};
    say(m === 'light' ? 'LIGHT: the thylakoid membranes. Water is split, O₂ leaves, protons pile up in the lumen (pH ' + fmt(r.pH, 1) + '), and ATP synthase turns.' :
      m === 'carbon' ? 'CARBON: the stroma. CO₂ comes in, Rubisco fixes it onto RuBP, and triose P (a small three carbon sugar) leaves. It runs only on carriers the membranes charged.' :
      'BOTH: the same ATP and NADPH carriers leave the membranes, are spent by the Calvin cycle, and come back as ADP and NADP⁺ to be charged again.');
    kickAll();
  }
  function follow(type) {
    if (S.mode !== 'both') setMode('both');
    var best = -1, bd = 9;
    C.forEach(function (c, i) { if (c.type !== type) return; var d = (c.ph - 0.02 + 1) % 1; if (d < bd) { bd = d; best = i; } });
    pickCarrier(best);
  }
  function pickCarrier(i) {
    if (i < 0) return;
    if (S.mode !== 'both') setMode('both');
    S.pick = S.pick === i ? -1 : i;
    EL.bar.querySelector('[data-a="fatp"]').setAttribute('aria-pressed', S.pick >= 0 && C[S.pick].type === 'atp' ? 'true' : 'false');
    EL.bar.querySelector('[data-a="fnad"]').setAttribute('aria-pressed', S.pick >= 0 && C[S.pick].type === 'nadph' ? 'true' : 'false');
    if (S.pick >= 0) { var c = C[S.pick]; say('You picked one ' + (c.type === 'atp' ? 'ATP carrier' : 'NADPH carrier') + ' (ringed, in 3D and on the loop map). It is charged at the membrane, crosses the stroma, is spent in the Calvin cycle, and comes back as ' + (c.type === 'atp' ? 'ADP' : 'NADP⁺') + '. It is never replaced by a new one.'); }
    else say('Carrier released.');
    kickAll();
  }
  function click3D(cx, cy) {
    var h = G.pickAt(cx, cy);
    if (h && h.carrier != null && h.carrier >= 0) { pickCarrier(h.carrier); return; }
    if (h && h.part && PARTS[h.part]) { openPart(h.part); if (!S.frozen) setFrozen(true, true); return; }
    setFrozen(!S.frozen);
  }
  function openPart(id) {
    var P = PARTS[id]; if (!P) return;
    S.hl = id; if (G) G.highlight(id);
    var evs = (PART_EV[id] || []).map(function (k) { return ev(k); }).join(' ');
    EL.panel.innerHTML = '<button type="button" class="x" aria-label="Close">×</button><h4>' + esc(P[0]) + '</h4><p class="wh">' + esc(P[1]) + '</p><p class="tx">' + P[2] + (evs ? '<span class="evs">' + evs + '</span>' : '') + '</p>';
    EL.panel.hidden = false;
    var xy = G && G.partXY ? G.partXY(id) : null; EL.panel.classList.remove('L', 'B');
    if (xy && xy.y < xy.h * (xy.w < 560 ? 0.5 : 0.3)) EL.panel.classList.add('B');
    EL.panel.querySelector('.x').addEventListener('click', closePart);
    if (EL.part.value !== id) EL.part.value = id;
    kickAll();
  }
  function closePart() { EL.panel.hidden = true; S.hl = null; if (G) G.highlight(null); EL.part.value = ''; kickAll(); }
  function say(t) { if (EL && EL.now) EL.now.innerHTML = t; }
  function sayLight(p0, r0) {
    var r = S.rt, p1 = LP.state.ppfd;
    if (!r0 || Math.abs(p1 - p0) < 1) return;
    var dn = p1 < p0;
    say('Light ' + (dn ? 'down' : 'up') + ' from ' + fmt(p0, 0) + ' to ' + fmt(p1, 0) + ': ATP made went from ' + fmt(r0.atp, 0) + ' to ' + fmt(r.atp, 0) + ' µmol per m² per s, and the Calvin cycle ' + (r.vc < r0.vc - 0.05 ? 'slowed' : (r.vc > r0.vc + 0.05 ? 'sped up' : 'held')) + ' from ' + fmt(r0.vc, 1) + ' to ' + fmt(r.vc, 1) + ' µmol CO₂ per m² per s. ' +
      (dn ? 'Fewer carriers are charged, so the cycle is starved of ATP and NADPH.' : (Math.abs(r.vc - r0.vc) < 0.3 ? 'The cycle is already at its limit, so extra light changes little.' : 'More carriers are charged, so the cycle can run faster.')) + ' Lumen pH ' + fmt(r0.pH, 2) + ' → ' + fmt(r.pH, 2) + '.');
  }
  function sayMem(f0, r0) {
    var r = S.rt; if (!r0) return;
    say('Membrane ' + Math.round(f0 * 100) + ' % → ' + Math.round(S.f * 100) + ' %: ' + (S.f < f0 ? 'fewer' : 'more') + ' photosystems and ATP synthases. ATP made went from ' + fmt(r0.atp, 0) + ' to ' + fmt(r.atp, 0) + ' µmol per m² per s and CO₂ fixed from ' + fmt(r0.vc, 1) + ' to ' + fmt(r.vc, 1) + ' µmol per m² per s. The lumen stays one connected space, whatever its size.');
  }
  function syncUI() {
    var st = LP.state || {};
    EL.ppfd.value = st.ppfd; EL.ppfdO.textContent = fmt(st.ppfd, 0) + ' µmol per m² per s';
    EL.mem.value = Math.round(S.f * 100); EL.memO.textContent = Math.round(S.f * 100) + ' % of full';
    syncCounters(true);
  }
  var lastC = 0;
  function syncCounters(force) {
    if (!EL) return; var now = performance.now(); if (!force && now - lastC < 120) return; lastC = now;
    var r = S.rt || rates({}), c = S.cnt, q = function (id, v) { var e = EL.root.querySelector(id); if (e && e.textContent !== v) e.textContent = v; };
    q('#chl-c-atp', fmt(c.atp, 0)); q('#chl-c-spent', fmt(c.spent, 0)); q('#chl-c-nad', fmt(c.nadph, 0)); q('#chl-c-co2', fmt(c.co2, 0));
    q('#chl-r-atp', fmt(r.atp, 1) + ' per s'); q('#chl-r-spent', fmt(r.spent, 1) + ' per s'); q('#chl-r-nad', fmt(r.nadph, 1) + ' per s'); q('#chl-r-co2', fmt(r.vc, 1) + ' per s');
    q('#chl-ph', fmt(r.pH, 2));
    var per = EL.root.querySelector('#chl-per');
    if (per) { var pk = r.vc > 0.05 ? fmt(r.spent / r.vc, 1) + '|' + fmt(r.nadph / r.vc, 1) + '|' + fmt(r.vo / r.vc, 2) : 'none'; if (per._k !== pk) { per._k = pk; per.innerHTML = r.vc > 0.05 ? 'Per CO₂ fixed: ' + fmt(r.spent / r.vc, 1) + ' ATP spent and ' + fmt(r.nadph / r.vc, 1) + ' NADPH, not just 3 and 2. Rubisco also grabs O₂ (here ' + fmt(r.vo / r.vc, 2) + ' O₂ per CO₂, not drawn in the scene), and recycling that product, photorespiration, costs extra ATP and NADPH. <a href="#stroma">Light IV</a> ' + badge('DERIVED') + ' ' + ev('chl.perco2', 'How') : 'No CO₂ is being fixed, so no ATP or NADPH is spent.'; } }
    q('#chl-ph-s', 'stroma ' + fmt(r.spH, 1) + ' · ' + (r.pH < r.spH - 0.05 ? 'about ' + fmt(Math.pow(10, r.spH - r.pH), 0) + '× more H⁺ than the stroma' : 'no gradient'));
  }
  function update() {
    if (!EL) return;
    refresh(); syncUI(); kickAll();
  }

  /* ------------------------------------------------------------ hooks: top of Plate III, one line on Plate IV (no edits to their files) */
  function hook() {
    var ps = LP.panels || [], thy = null, str = null;
    ps.forEach(function (p) { if (p.id === 'thylakoid') thy = p; if (p.id === 'stroma') str = p; });
    if (thy && !thy._chl) {
      thy._chl = true;
      var m0 = thy.mount, u0 = thy.update;
      thy.mount = function (el) {
        m0.apply(this, arguments);
        try { var h = document.createElement('div'); h.className = 'chl-host'; var st = el.querySelector('style'); el.insertBefore(h, st ? st.nextSibling : el.firstChild); mount(h); }
        catch (e) { console.error('chloroplast workstation failed to mount', e); }
      };
      thy.update = function () { var r = u0 ? u0.apply(this, arguments) : undefined; try { update(); } catch (e) { console.error(e); } return r; };
    }
    if (str && !str._chl) {
      str._chl = true;
      var s0 = str.mount;
      str.mount = function (el) {
        s0.apply(this, arguments);
        try { var nw = el.querySelector('#str-nowp') || el.querySelector('.wp-now'); var pz = document.createElement('p'); pz.className = 'cap lx-row chl-back'; pz.innerHTML = 'The ATP and NADPH spent here are charged on the thylakoid membranes: see <a href="#thylakoid">the chloroplast, one machine with two halves</a>, at the top of Light III.'; if (nw && nw.parentNode) nw.parentNode.insertBefore(pz, nw.nextSibling); }
        catch (e) { console.error(e); }
      };
    }
  }
  hook();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hook);

  window.CHL = {
    debug: function () {
      var r = S.rt || {};
      return { mode: S.mode, f: S.f, frozen: S.frozen, pick: S.pick, picked: S.pick >= 0 ? { type: C[S.pick].type, ph: +C[S.pick].ph.toFixed(3), name: cname(C[S.pick]) } : null, tm: +S.tm.toFixed(2), cnt: S.cnt, gl: !!G, pH: r.pH, atp: r.atp, vc: r.vc, ring: S.ring, panel: EL && !EL.panel.hidden ? EL.panel.querySelector('h4').textContent : null, discs: GR.map(function (g, i) { return nDisc(i); }).reduce(function (a, b) { return a + b; }, 0), sites: G ? { psi: G.sites.psi.length, syn: G.sites.syn.length, psii: G.sites.psii.length } : null };
    },
    click: function (x, y) { if (G) click3D(x, y); }, open: openPart, mode: setMode, follow: follow, freeze: setFrozen, step: step,
    membrane: function (f) { S.f = clamp(f, 0.25, 1); refresh(); if (G) G.layout(); syncUI(); kickAll(); }
  };
})();

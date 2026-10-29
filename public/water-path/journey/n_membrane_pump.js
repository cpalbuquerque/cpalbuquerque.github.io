/* The Water Path v8: n_membrane_pump.js (nutrient path, Plate V): the pump and its riders.
   Loaded by n_membrane.js (WP.nutrient.load('membrane_pump')). Defines WPNM.pump(host, lib, wpState) -> {ws}.
   A patch of root cell plasma membrane with soil water above it. The P-type H+-ATPase spends ATP and throws H+ out;
   that makes the inside negative. K+ comes in by the channel AKT1 and the carrier HAK5 (overlapping, not a clean
   switch), nitrate rides in with protons, ammonium enters as a cation while the pump pushes a proton out.
   Controls: the pump (on or off), soil K+ (log scale), nitrate versus ammonium, and a pH probe that moves away from
   the root surface (a kit slice). Root surface pH above 7 locks up iron in the same scene (link to the iron workstation).
   Sources: V18_SOURCES_verified_2026-10-28.md. Every curve and rate is ILLUSTRATIVE; anchors with a source:
   Km HAK5 about 15 to 24 µM and AKT1 about 0.9 to 1 mM (MEASURED, apparent, Gierth et al. 2005), AKT1 works down to
   10 µM (MEASURED, Hirsch et al. 1998), soil solution 0.1 to 6 mM (SECONDARY, Ashley et al. 2006 citing Adams 1971),
   normal physiological range -250 to -100 mV (Meharg & Blatt 1995), root surface pH 1 to 2 units off (Nye 1981),
   1000 fold less Fe3+ per pH unit (DERIVED). */
(function () {
  'use strict';
  var NM = window.WPNM = window.WPNM || {};

  /* ---------------------------------------------------------------- the model (ILLUSTRATIVE shapes, sourced anchors) */
  var V_ON = -170, V_OFF = -45;          // mV, ILLUSTRATIVE: inside the -250 to -100 mV normal range when on; near zero pull when off
  var KM_HAK5 = 0.02, KM_AKT1 = 0.95;    // mM, MEASURED apparent Km (Gierth et al. 2005: 15 to 24 µM; 0.9 to 1 mM)
  var BULK = 6.5, SHIFT = 1.5, LAMBDA = 0.6;   // ILLUSTRATIVE: bulk soil pH, largest surface shift (Nye 1981: 1 to 2 units), decay length in mm
  var MM_MAX = 5, PY0 = 0.85, PY1 = 3.6;       // probe: 0 to 5 mm mapped onto the 3D height above the membrane (not to scale)

  function drive(v) { var d = (-v + V_OFF) / (-V_ON + V_OFF); return d < 0 ? 0 : (d > 1 ? 1 : d); }
  function vTarget(s) { return s.pump === 'on' ? V_ON + 10 * s.nf : V_OFF; }   // nitrate entry depolarises a little (McClure et al. 1990); size ILLUSTRATIVE
  function kmM(s) { return Math.pow(10, s.lk); }
  function induce(k) { return 0.15 + 0.85 / (1 + Math.pow(k / 0.3, 2)); }      // HAK5 made more when K+ is short (Gierth et al. 2005); shape ILLUSTRATIVE
  function fluxes(s, v) {
    var D = drive(v == null ? vTarget(s) : v), k = kmM(s);
    var jh = 0.35 * induce(k) * k / (k + KM_HAK5) * D, ja = k / (k + KM_AKT1) * D;
    return { D: D, hak: jh, akt: ja, k: jh + ja, no3: s.nf * D, nh4: (1 - s.nf) * D, pump: s.pump === 'on' ? 1 : 0 };
  }
  function surfShift(s) { return SHIFT * drive(vTarget(s)) * (2 * s.nf - 1); }
  function pHat(s, mm) { return BULK + surfShift(s) * Math.exp(-mm / LAMBDA); }
  function probeMM(s) { return (s.py - PY0) / (PY1 - PY0) * MM_MAX; }
  function feFold(s) { return Math.pow(10, 3 * surfShift(s)); }     // DERIVED: Fe(OH)3 + 3H+ = Fe3+ + 3H2O
  function fmtK(lk) {
    var c = Math.pow(10, lk);
    if (c < 0.00995) return String(Math.round(c * 1000)) + ' µM';
    if (c < 0.1) return String(Math.round(c * 1000)) + ' µM';
    if (c < 1) return String(+c.toPrecision(2)) + ' mM';
    return (c < 10 ? c.toFixed(1) : String(Math.round(c))) + ' mM';
  }
  function mV(v) { return (v < 0 ? '−' : '') + Math.abs(Math.round(v)) + ' mV'; }
  function fmtPH(v) { return 'pH ' + (+v).toFixed(1); }
  function pct(x) { return Math.round(100 * x) + ' %'; }
  function fold(f) {
    if (f < 1.5) return null;
    var p = Math.pow(10, Math.floor(Math.log10(f))), r = Math.round(f / p) * p;
    if (f < 10) r = Math.round(f);
    return r.toLocaleString('en-US');
  }
  function eK(s) { return 59 * Math.log10(kmM(s) / 100); }   // DERIVED: Nernst, 100 mM cytosolic K+ ILLUSTRATIVE (OPEN in the Why)
  function mixNf(nf) { var a = Math.round(nf * 100); return a + ' % nitrate · ' + (100 - a) + ' % ammonium'; }

  /* soil tint by pH: acid warm, neutral sand, alkaline blue (the same scale as the iron workstation; pH is always written too) */
  var PHC = [[4.5, [224, 122, 58]], [6.5, [207, 194, 122]], [8.5, [90, 138, 208]]];
  function phRGB(pH) {
    pH = Math.max(4.5, Math.min(8.5, pH));
    var a = PHC[0], b = PHC[1];
    if (pH > 6.5) { a = PHC[1]; b = PHC[2]; }
    var f = (pH - a[0]) / (b[0] - a[0]);
    return [0, 1, 2].map(function (k) { return a[1][k] + (b[1][k] - a[1][k]) * f; });
  }

  var CSS = '\
.npm-sub{font-size:13.5px;color:var(--ink2);margin:2px 0 6px;max-width:52em}\
.npm-ov{position:absolute;left:8px;top:8px;margin:0;padding:5px 8px;background:color-mix(in srgb,var(--wall) 88%,transparent);border:1px solid var(--rule2);border-radius:3px;font:12px/1.35 var(--ui);color:var(--ink);pointer-events:none;min-width:150px;z-index:2}\
.npm-ov b{font-family:var(--mono);font-weight:600}\
.npm-vbar{position:relative;height:9px;margin:3px 0 4px;border:1px solid var(--ink2);border-radius:2px;background:var(--card)}\
.npm-vbar i{position:absolute;top:0;bottom:0;background:var(--w4,#b9d3ee);opacity:.75}\
.npm-vbar u{position:absolute;top:-3px;bottom:-3px;width:3px;margin-left:-1px;background:var(--warm);text-decoration:none}\
.npm-up{display:grid;grid-template-columns:auto 1fr auto;gap:1px 6px;align-items:center}\
.npm-up s{display:block;height:6px;background:var(--accent);text-decoration:none;border-radius:1px}\
.npm-up span{white-space:nowrap}\
.npm-uph{font-size:11px;color:var(--ink2);margin-top:2px}\
.npm-guard{display:grid;grid-template-columns:150px minmax(0,1fr);gap:6px 16px;align-items:center;margin:-6px 0 18px;padding:10px 12px;border:1px solid var(--rule2);border-radius:4px;background:var(--wall);font:14px/1.45 var(--ui);color:var(--ink)}\
.npm-guard h4{font:600 15px var(--ui);margin:0 0 3px}\
.npm-guard p{margin:0 0 4px;max-width:48em}\
.npm-guard>svg{width:150px;height:auto;display:block}\
.npm-guard>svg text{font:11px var(--ui);fill:var(--ink)}\
.npm-gc{fill:var(--leaf2);stroke:var(--leaf3);stroke-width:2}\
.npm-gp{fill:var(--card2);stroke:var(--ink2);stroke-width:1}\
.npm-ga{stroke:var(--accent);stroke-width:1.8;fill:none}\
.npm-gk{fill:#7a4fd0}\
.ws .npm-band{fill:var(--w4,#b9d3ee);opacity:.35}\
.ws .npm-tot{stroke:var(--ink);stroke-width:1.6;fill:none}\
.ws .npm-why h4{font:600 14.5px var(--ui);margin:10px 0 4px}\
.ws .npm-why p{margin:0 0 8px}\
.ws .npm-why a{color:var(--accent)}\
.ws .npm-why ul{margin:2px 0 8px;padding-left:20px}\
.ws a.npm-go{color:var(--accent)}\
@media (max-width:699px){.npm-ov{font-size:11px;min-width:120px;padding:3px 6px}.npm-up,.npm-uph{display:none}.npm-guard{grid-template-columns:1fr}.npm-guard>svg{width:130px}}';

  NM.pump = function (host, L, wpState) {
    var WS = window.WS;
    if (!document.getElementById('npm-css')) { var sc = document.createElement('style'); sc.id = 'npm-css'; sc.textContent = CSS; document.head.appendChild(sc); }
    var DOI = function (d) { return '<a href="https://doi.org/' + d + '" target="_blank" rel="noopener">doi ' + d + '</a>'; };
    var B = WS.badge;
    var GO_IRON = '<a href="#membrane" class="npm-go" data-npm-go="nm-ws-iron">the iron workstation below</a>';
    var GO_NRT = '<a href="#membrane" class="npm-go" data-npm-go="nm-ws-nrt">the nitrate sensor workstation below (the transceptor)</a>';

    var why =
      '<div class="npm-why">' +
      '<h4>The pump</h4>' +
      '<p>The <b>plasma membrane H⁺-ATPase</b> splits ATP (the cell\'s energy currency) and throws protons (H⁺) out of the cell. "Most transport proteins in plant cells are energized by electrochemical gradients of protons across the plasma membrane", and those gradients are made by these ATP fuelled pumps (Palmgren 2001, Annu Rev Plant Physiol Plant Mol Biol 52: 817, ' + DOI('10.1146/annurev.arplant.52.1.817') + '). Note <b>most</b>, not all. The pump is a <b>P-type</b> ATPase, a pump that briefly ties a phosphate from ATP onto itself as it works. That makes it a different class of enzyme from the <b>V-ATPase</b>, the pump that acidifies the vacuole. It is not one protein but a family: Arabidopsis (a small lab plant) has <b>46</b> P-type ATPase genes in five subfamilies, the H⁺ pumps being one of them ' + B('MEASURED', 'Genome count, Baxter et al. 2003.') + ' (Baxter et al. 2003, Plant Physiol 132: 618, ' + DOI('10.1104/pp.103.021923') + '). The cell also turns the pumps up and down after they are made ' + B('SECONDARY', 'From reviews (Palmgren 2001; Sze, Li and Palmgren 1999, Plant Cell 11: 677). The regulatory detail was not checked for this page.') + '.</p>' +
      '<p><b>Not the only ATP user.</b> A few other carriers on this membrane use ATP directly: a Ca²⁺ pump, ACA8 (Bonza et al. 2000, Plant Physiol 123: 1495, ' + DOI('10.1104/pp.123.4.1495') + '), a zinc pump, HMA2 (Hussain et al. 2004, Plant Cell 16: 1327, ' + DOI('10.1105/tpc.020487') + '), and ABC transporters, a large family of carriers that use ATP (Kang et al. 2011, Arabidopsis Book 9: e0153, ' + DOI('10.1199/tab.0153') + '). The H⁺ pump is the main one, and the proton gradient it builds powers most other uptake.</p>' +
      '<h4>The voltage</h4>' +
      '<p>Pumping positive charge out leaves the inside <b>negative</b>. In Arabidopsis root hairs, Meharg &amp; Blatt (1995, J Membr Biol 145: 49, ' + DOI('10.1007/BF00233306') + ') describe the normal physiological range as <b>−250 to −100 mV</b> ' + B('MEASURED', 'Their description of the normal physiological range in which they recorded the nitrate current, not a set of resting voltages.') + '. The model sits at −170 mV with the pump on and about −45 mV with it off ' + B('ILLUSTRATIVE', 'Chosen to show the direction, not measured.') + '.</p>' +
      '<h4>Potassium: a channel and a carrier, overlapping</h4>' +
      '<p><b>AKT1</b> is a K⁺ <b>channel</b>: a gated pore. K⁺ flows through it with no ATP of its own, pulled by the negative inside. In Arabidopsis, AKT1 "mediates potassium uptake from solutions that contain as little as 10 micromolar potassium" (Hirsch et al. 1998, Science 280: 918, ' + DOI('10.1126/science.280.5365.918') + ') ' + B('MEASURED', 'Hirsch et al. 1998, akt1 mutant of Arabidopsis; the abstract says the results suggest this.') + '. <b>HAK5</b> is a <b>carrier</b> that the root makes more of when K⁺ is short. In K⁺ starved Arabidopsis roots the HAK5 dependent uptake has an apparent Km of about <b>15 to 24 µM</b>, and the AKT1 dependent uptake about <b>0.9 to 1 mM</b> (Gierth, Mäser &amp; Schroeder 2005, Plant Physiol 137: 1105, ' + DOI('10.1104/pp.104.057216') + ') ' + B('MEASURED', 'Apparent Km of whole root Rb+ (K+ tracer) uptake from mutant versus wild type comparisons, not of the purified proteins.') + '. <b>Km</b> is the concentration at which uptake runs at half its top speed: lower means better at grabbing scarce K⁺. So the two systems overlap over a wide range; they are not a clean low and high switch. The idea of two K⁺ uptake mechanisms goes back to barley roots (Epstein, Rains &amp; Elzam 1963, PNAS 49: 684, ' + DOI('10.1073/pnas.49.5.684') + ').</p>' +
      '<p>Soil solution K⁺ is typically <b>0.1 to 6 mM</b> ' + B('SECONDARY', 'Adams 1971, cited in Ashley, Grant and Grabov 2006, J Exp Bot 57: 425.') + ' (shaded on the plot). How much K⁺ the cytosol keeps is debated: often put at about 100 mM (Leigh &amp; Wyn Jones 1984, New Phytol 97: 1, ' + DOI('10.1111/j.1469-8137.1984.tb04103.x') + '), but in barley roots it shifts with K⁺ and NH₄⁺ supply (Kronzucker, Szczerba &amp; Britto 2003, Planta 217: 540, ' + DOI('10.1007/s00425-003-1032-5') + ') ' + B('OPEN', 'Contested: a fixed value against a flexible one.') + '. So the scene uses about 100 mM only as an illustrative figure, for the pump off check below.</p>' +
      '<p><b>Why the open channel stops.</b> A channel only lets K⁺ go where it is pulled. K⁺ is balanced, moving neither in nor out, at the voltage given by the Nernst equation: 59 mV for each tenfold difference in K⁺. With about 100 mM inside ' + B('ILLUSTRATIVE', 'Cytosolic K+ is OPEN, see above; 100 mM is used only for this check.') + ' and 0.5 mM outside, that balance point is about <b>−136 mV</b> ' + B('DERIVED', 'Nernst at about 25 °C: 59 mV × log10(0.5 / 100) = −136 mV.') + '. With the pump on, the inside (−170 mV) is more negative than that, so K⁺ is pulled in. With the pump off, the inside is only about −45 mV, less negative than the balance point, so K⁺ through an open channel would tend to leak <b>out</b>. The model holds AKT1 open on purpose, to show that an open door is not enough; it simply shows K⁺ uptake as zero and does not draw the leak. In the model HAK5 also stops with the pump off. How HAK5 is coupled to the proton gradient was not checked for this page, so the scene draws only K⁺ passing through HAK5, not the protons that may travel with it.</p>' +
      '<h4>Nitrate and ammonium</h4>' +
      '<p><b>Nitrate</b> (NO₃⁻) is negative, so the negative inside pushes it away. It enters together with protons. In maize roots nitrate causes "a rapid and transient depolarization": the inside briefly becomes less negative. So positive charge comes in with each nitrate, even though nitrate itself is negative. That fits protons riding in alongside it, a NO₃⁻/H⁺ <b>symport</b> (two things carried in together) (McClure et al. 1990, Plant Physiol 93: 281, ' + DOI('10.1104/pp.93.1.281') + '; and 93: 290, ' + DOI('10.1104/pp.93.1.290') + '). In Arabidopsis root hairs the data indicate <b>2 H⁺ per nitrate</b> (Meharg &amp; Blatt 1995) ' + B('OPEN', 'The consensus, but inferred from the voltage dependence of the current, not counted.') + '. That is why nitrate raises the pH at the root surface: each nitrate takes about two protons in with it, so the water at the root surface loses protons and its pH rises. One nitrate carrier, NRT1.1, is also a sensor: see ' + GO_NRT + '.</p>' +
      '<p><b>Ammonium</b> (NH₄⁺) is a cation (a positive ion), so the negative inside pulls it in, and the pump pushes protons out to balance the charge. At high ammonium, barley roots leak back up to 80 % of what they take in (Britto et al. 2001, PNAS 98: 4255, ' + DOI('10.1073/pnas.061034698') + '). Later work from the same lab found that most of this cycling is NH₃ gas moving through the membrane, so the energy cost first proposed is now in question (Coskun et al. 2013, Plant Physiol 163: 1859, ' + DOI('10.1104/pp.113.225961') + ') ' + B('OPEN', 'A model revised by its own authors.') + '.</p>' +
      '<h4>The root surface pH, and iron</h4>' +
      '<p>"Plants that absorb nitrogen as NO₃⁻ tend to raise the pH in the rhizosphere. Those absorbing nitrogen as NH₄⁺ or N₂ lower the pH" (the rhizosphere is the soil right around the root), and the pH at the root surface often differs from the pH a few mm away by <b>1 to 2 units</b> (Nye 1981, Plant Soil 61: 7, ' + DOI('10.1007/BF02277359') + ') ' + B('MEASURED', 'Nye 1981.') + '. The change is a steep gradient, not uniform: root driven pH changes reached about <b>2 mm</b> from the root in sand ' + B('SECONDARY', 'Rudolph et al. 2013, cited by York et al. 2016 (J Exp Bot 67: 3629), a review; the primary paper was not checked.') + '. Where you measure matters ' + B('OPEN', 'Contested: the size of the shift depends on where it is measured.') + ': in soil shaken off wheat and lupin roots, ammonium lowered pH by <b>0.16 to 0.38</b> units and nitrate raised it by <b>0.19 to 0.78</b> units (Wang &amp; Tang 2018, Ann Bot 121: 143, ' + DOI('10.1093/aob/mcx138') + ') ' + B('MEASURED', 'Bulk rhizosphere soil, wheat and white lupin.') + ', smaller than at the root surface itself.</p>' +
      '<p>For Fe(OH)₃ + 3H⁺ ⇌ Fe³⁺ + 3H₂O the free Fe³⁺ goes down about <b>1000 fold for each pH unit up</b> ' + B('DERIVED', 'Three protons per Fe3+, so log Fe3+ = log K minus 3 pH.') + '. So when nitrate feeding pushes the root surface above about pH 7 ' + B('ILLUSTRATIVE', 'The scene flags pH 7 as a teaching line, not a sourced threshold.') + ', iron at the surface becomes much harder to get. How roots fight back is in ' + GO_IRON + '.</p>' +
      '<h4>Expert depth</h4>' +
      '<p>Everything moving in the scene, the uptake curves, the voltages, the 1.5 unit largest surface shift, the 0.6 mm decay length, the bulk soil pH 6.5 and the HAK5 induction are ' + B('ILLUSTRATIVE', 'Shapes and directions only.') + '. The Km values used in the curves (20 µM and 0.95 mM) sit inside the measured apparent ranges above. Proteins are schematic shapes, not traced structures; the probe distance is not to scale with the membrane, which is only nanometres thick.</p>' +
      '</div>';

    var ws = WS.create(host, {
      title: 'The pump and its riders',
      badge: 'ILLUSTRATIVE',
      what: 'A patch of the plasma membrane of a root cell, with soil water above it. One pump spends ATP (the cell\'s energy currency) to throw protons out. Potassium, nitrate and ammonium ride the gradient it makes.',
      todo: 'Switch the <b>proton pump</b> off and watch the <b>membrane voltage</b> and the uptake. Slide <b>soil K⁺</b> and see two K⁺ systems share the work. Slide <b>nitrate versus ammonium</b>, then move the <b>pH probe</b> away from the root. Click a part to name it. Click empty space to pause the motion; click again to restart.',
      thing: 'A model membrane drawn for this page. Lavender: the <b>H⁺ pump</b>, fed by orange ATP. Blue staves: the <b>AKT1</b> channel; green: the <b>HAK5</b> carrier; gold: a <b>nitrate carrier</b>; grey: <b>ammonium entry</b>. Purple beads are K⁺, small yellow beads H⁺, blue and red clusters nitrate, blue and white clusters ammonium, rust lumps iron oxide. The glass needle is the pH probe.',
      scanCaption: '<b>The soil next to the root.</b> A model strip from the root surface (left) to 5 mm into the soil, drawn from the same model, not an image: colour and line show pH, dots free iron. ' + B('ILLUSTRATIVE', 'The 1.5 unit largest shift and the 0.6 mm decay length are invented, inside the 1 to 2 units of Nye 1981 and the about 2 mm reach cited by York et al. 2016.') + ' The fold drop in Fe³⁺ is ' + B('DERIVED', '1000 fold per pH unit, from the solubility reaction.'),
      plotCaption: '<b>K⁺ uptake against soil K⁺</b>, log scale. AKT1 and HAK5 overlap; the shaded band is typical soil solution. ' + B('ILLUSTRATIVE', 'Curve shapes invented, using Km 20 µM for HAK5 and 0.95 mM for AKT1, inside the apparent ranges of Gierth et al. 2005.') + ' ' + B('SECONDARY', 'Soil band 0.1 to 6 mM: Adams 1971, cited in Ashley et al. 2006.'),
      why: why,
      state: { pump: 'on', lk: Math.log10(0.5), nf: 0.6, py: PY0 + 0.1 * (PY1 - PY0) },
      camera: { dist: 11.2, theta: 0.3, phi: 1.36, target: [0, 0.35, 0], minDist: 3.5, maxDist: 21 }
    });
    var S = ws.state;
    var hd = ws.el.querySelector('.ws-hd');
    var quote = document.createElement('p'); quote.className = 'nm-quote';
    quote.textContent = 'Nitrate, potassium and phosphate have no ATP pump of their own here. One big ATP driven pump throws protons out, and these nutrients ride the gradient it makes.';
    hd.appendChild(quote);
    var sub = document.createElement('p'); sub.className = 'npm-sub';
    sub.innerHTML = 'It is the main ATP user of this membrane, not the only one: a few others, such as a Ca²⁺ pump, a zinc pump and ABC transporters (a large family of carriers), use ATP directly (see Why).';
    hd.appendChild(sub);

    ws.choice({ key: 'pump', label: 'Proton pump', options: [['on', 'Pump on'], ['off', 'Pump off']] });
    ws.range({ key: 'lk', label: 'Soil K⁺', min: -3, max: 1, step: 0.05, fmt: fmtK, hint: 'log scale: 1 µM to 10 mM; soil solution is often 0.1 to 6 mM' });
    ws.range({ key: 'nf', label: 'Nitrate versus ammonium', min: 0, max: 1, step: 0.05, fmt: mixNf, hint: 'left all ammonium, right all nitrate' });
    var probeApi = ws.slice({ key: 'py', axis: 'y', min: PY0, max: PY1, size: [0.7, 0.7], label: 'pH probe distance from the root', step: (PY1 - PY0) / 100,
      fmt: function (v) { return ((v - PY0) / (PY1 - PY0) * MM_MAX).toFixed(1) + ' mm'; }, hint: 'drag the square at the probe tip, or use this slider (distance not to scale)' });

    /* links to the other workstations on this plate */
    ws.el.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[data-npm-go]'); if (!a) return;
      var t = document.getElementById(a.getAttribute('data-npm-go'));
      if (t) { e.preventDefault(); t.scrollIntoView({ block: 'start', behavior: WS.reduced() ? 'auto' : 'smooth' }); }
    });

    /* ---- the voltage and uptake overlay (on the 3D or the flat drawing) */
    var glHost = ws.el.querySelector('.ws-gl');
    var ov = document.createElement('div'); ov.className = 'npm-ov'; ov.setAttribute('aria-hidden', 'true');
    ov.innerHTML = '<div>Membrane voltage <b data-o="v"></b></div><div class="npm-vbar"><i style="left:0;width:60%"></i><u data-o="m"></u></div>' +
      '<div class="npm-uph">uptake, % of top speed (model)</div><div class="npm-up"><span>K⁺ in</span><s data-o="k"></s><span data-o="kt"></span><span>NO₃⁻ in</span><s data-o="n"></s><span data-o="nt"></span><span>NH₄⁺ in</span><s data-o="a"></s><span data-o="at"></span></div>';
    glHost.appendChild(ov);
    function O(k) { return ov.querySelector('[data-o="' + k + '"]'); }
    var oV = O('v'), oM = O('m'), oK = O('k'), oKt = O('kt'), oN = O('n'), oNt = O('nt'), oA = O('a'), oAt = O('at');
    var lastOv = '';
    function paintOv(v) {
      var f = fluxes(S, v), key = Math.round(v) + '|' + Math.round(f.k * 100) + '|' + Math.round(f.no3 * 100) + '|' + Math.round(f.nh4 * 100);
      if (key === lastOv) return; lastOv = key;
      oV.textContent = mV(v);
      oM.style.left = (100 * (v + 250) / 250).toFixed(1) + '%';   // bar from -250 (left) to 0 mV (right); shaded part -250 to -100
      oK.style.width = (58 * f.k) + 'px'; oKt.textContent = pct(f.k);
      oN.style.width = (58 * f.no3) + 'px'; oNt.textContent = pct(f.no3);
      oA.style.width = (58 * f.nh4) + 'px'; oAt.textContent = pct(f.nh4);
    }
    var vAnim = vTarget(S);
    function paused() { var b = ws.el.querySelector('.ws-pause'); return b.hidden || b.getAttribute('aria-pressed') === 'true'; }

    /* ---- 3D */
    var g = ws.gl;
    if (g) (function () {
      var T = g.THREE, root = g.root, V = function (x, y, z) { return new T.Vector3(x, y, z); }, rr = L.rng(17);
      var X = { pump: -3.4, akt: -1.55, hak: 0.15, nrt: 1.85, amt: 3.55 };
      var bil = L.bilayer(T, { w: 10, d: 3.6, zc: 0, holes: [{ x: X.pump, r: 0.7 }, { x: X.akt, r: 0.5 }, { x: X.hak, r: 0.62 }, { x: X.nrt, r: 0.62 }, { x: X.amt, r: 0.5 }], seed: 21 });
      root.add(bil);
      var tintM = new T.MeshBasicMaterial({ color: 0xcfc27a, transparent: true, opacity: 0.08, depthWrite: false, side: T.BackSide });
      var tint = new T.Mesh(new T.BoxGeometry(10.2, 3.2, 3.8), tintM); tint.position.y = 0.7 + 1.6; tint.renderOrder = -1; root.add(tint);
      var cytoM = new T.MeshBasicMaterial({ color: 0x9fc58a, transparent: true, opacity: 0.07, depthWrite: false, side: T.BackSide });
      var cyto = new T.Mesh(new T.BoxGeometry(10.2, 1.9, 3.8), cytoM); cyto.position.y = -0.7 - 0.95; cyto.renderOrder = -1; root.add(cyto);
      /* the negative inside: a sheet under the membrane that fades as the membrane depolarises */
      var vM = new T.MeshBasicMaterial({ color: 0x2b5fa4, transparent: true, opacity: 0.2, depthWrite: false, side: T.DoubleSide });
      var vSheet = new T.Mesh(new T.PlaneGeometry(9.8, 3.5), vM); vSheet.rotation.x = -Math.PI / 2; vSheet.position.y = -0.78; vSheet.renderOrder = 1; root.add(vSheet);

      /* the pump: transmembrane body plus the big cytosolic head where ATP binds */
      var pump = new T.Group(); pump.position.x = X.pump; root.add(pump);
      var pBody = L.carrier(T, { r: 0.6, h: 1.85, color: 0x8f93d6 }); pump.add(pBody);
      var pHeadM = pBody.material;
      [[0, -1.2, 0, 0.46], [0.36, -1.02, 0.24, 0.3], [-0.34, -1.08, -0.2, 0.32]].forEach(function (b) { var m = new T.Mesh(new T.SphereGeometry(b[3], 18, 12), pHeadM); m.position.set(b[0], b[1], b[2]); pump.add(m); });
      /* AKT1: four staves round an open pore */
      var akt = new T.Group(); akt.position.x = X.akt; root.add(akt);
      var aktM = new T.MeshPhysicalMaterial({ color: 0x5b8fd6, roughness: 0.3, clearcoat: 0.6 });
      for (var i = 0; i < 4; i++) { var st = new T.Mesh(new T.CylinderGeometry(0.15, 0.17, 1.75, 14), aktM); var an = i * Math.PI / 2 + Math.PI / 4; st.position.set(Math.cos(an) * 0.29, 0, Math.sin(an) * 0.29); akt.add(st); }
      var poreM = new T.MeshBasicMaterial({ color: 0xc9b6ff, transparent: true, opacity: 0.35, depthWrite: false });
      var pore = new T.Mesh(new T.CylinderGeometry(0.09, 0.09, 1.8, 10, 1, true), poreM); akt.add(pore);
      /* HAK5, the nitrate carrier and ammonium entry: two rocking halves each */
      function rocker(x, color, r) {
        var grp = new T.Group(); grp.position.x = x; root.add(grp);
        var pl = new T.Group(), pr = new T.Group(); pl.position.x = -0.24; pr.position.x = 0.24; grp.add(pl); grp.add(pr);
        pl.add(L.carrier(T, { r: r, h: 1.8, color: color })); pr.add(L.carrier(T, { r: r, h: 1.8, color: color }));
        return { g: grp, l: pl, r: pr, rock: 1, to: 1 };
      }
      var hak = rocker(X.hak, 0x7fae5c, 0.32), nrt = rocker(X.nrt, 0xd2ae68, 0.32), amt = rocker(X.amt, 0xa3a3ad, 0.27);

      /* tags */
      function tag(text, x, y, z, o) { var t = L.tag(T, text, o); t.position.set(x, y, z || 0); root.add(t); return t; }
      tag('soil water, outside', -4.0, 2.45, 1.2);
      var tIn = tag('cytosol, inside', -2.6, -3.15, 0.9);
      tag('H⁺ pump', X.pump, -2.05, 0.6);
      var tAkt = tag('AKT1 channel, open', X.akt, -2.6, 0.6);
      tag('HAK5', X.hak, -2.05, 0.6);
      tag('nitrate carrier', X.nrt, -2.6, 0.6);
      tag('ammonium entry', X.amt, -2.05, 0.6);
      var tRust = tag('rust', 3.3, 2.95, 1.0);

      /* rust lumps and free iron near the surface */
      var rustM = new T.MeshStandardMaterial({ color: 0x8a3f1c, roughness: 0.95, flatShading: true });
      var rustG = new T.DodecahedronGeometry(1, 0);
      [[-2.4, 3.2, -1.2], [-0.4, 3.5, 1.0], [1.2, 3.1, -1.3], [2.9, 3.45, 0.7], [4.2, 3.0, -0.9], [-4.3, 3.1, 1.2]].forEach(function (p, k) {
        var m = new T.Mesh(rustG, rustM); m.position.set(p[0], p[1], p[2]); m.scale.setScalar(0.19 + (k % 3) * 0.05); m.rotation.set(k, k * 2, k * 3); root.add(m);
      });
      var feM = new T.MeshStandardMaterial({ color: 0xc8662a, roughness: 0.4, emissive: 0x3a1200, emissiveIntensity: 0.4 });
      var feG = new T.SphereGeometry(0.07, 10, 8), fes = [];
      for (i = 0; i < 10; i++) { var fm = new T.Mesh(feG, feM); fm.position.set(-4.5 + rr() * 9, 0.95 + rr() * 0.7, -1.5 + rr() * 3); root.add(fm); fes.push(fm); }

      /* the pH probe: a glass needle whose tip is the kit slice square */
      var needM = new T.MeshPhysicalMaterial({ color: 0xd8ecf5, roughness: 0.1, transparent: true, opacity: 0.55, clearcoat: 1, depthWrite: false });
      var PX = 0.95, PZ = 1.35;
      var needle = new T.Mesh(new T.CylinderGeometry(0.07, 0.035, 2.4, 14), needM); root.add(needle);
      var tipM = new T.MeshStandardMaterial({ color: 0x2b5fa4, roughness: 0.4 });
      var tip = new T.Mesh(new T.SphereGeometry(0.07, 12, 9), tipM); root.add(tip);
      var tProbe = tag('pH probe', PX, 0, PZ, { edge: 'accent' });
      if (probeApi.mesh) probeApi.mesh.children.forEach(function (c) { c.position.x += PX; c.position.y -= PZ; });

      /* particles */
      function mk(parts) { var grp = new T.Group(); parts.forEach(function (p) { var m = new T.Mesh(p[0], p[1]); m.position.set(p[2] || 0, p[3] || 0, p[4] || 0); grp.add(m); }); grp.visible = false; root.add(grp); return grp; }
      var hG = new T.SphereGeometry(0.06, 8, 6), hM = new T.MeshStandardMaterial({ color: 0xf2d23a, roughness: 0.3, emissive: 0x4a3c00, emissiveIntensity: 0.5 });
      var kG = new T.SphereGeometry(0.11, 12, 9), kM = new T.MeshStandardMaterial({ color: 0x7a4fd0, roughness: 0.35 });
      var nG = new T.SphereGeometry(0.075, 10, 8), oG = new T.SphereGeometry(0.066, 10, 8), wG = new T.SphereGeometry(0.045, 8, 6);
      var nM = new T.MeshStandardMaterial({ color: 0x3a6fd8, roughness: 0.35 }), oM = new T.MeshStandardMaterial({ color: 0xd8452e, roughness: 0.35 }), wM = new T.MeshStandardMaterial({ color: 0xf4f4f4, roughness: 0.35 });
      var atpM = new T.MeshStandardMaterial({ color: 0xf08a2a, roughness: 0.35 }), piM = new T.MeshStandardMaterial({ color: 0xffc070, roughness: 0.35 });
      var atpG = new T.SphereGeometry(0.11, 10, 8), piG = new T.SphereGeometry(0.06, 8, 6);
      var pools = { h: [], k: [], no3: [], nh4: [], atp: [] };
      function take(kind) {
        var P = pools[kind];
        for (var j = 0; j < P.length; j++) if (!P[j].busy) { P[j].busy = true; return P[j]; }
        var o;
        if (kind === 'h') o = mk([[hG, hM]]);
        else if (kind === 'k') o = mk([[kG, kM]]);
        else if (kind === 'no3') o = mk([[nG, nM], [oG, oM, 0.12, 0, 0], [oG, oM, -0.06, 0, 0.104], [oG, oM, -0.06, 0, -0.104]]);
        else if (kind === 'nh4') o = mk([[nG, nM], [wG, wM, 0.1, 0.06, 0], [wG, wM, -0.1, 0.06, 0], [wG, wM, 0, -0.08, 0.09], [wG, wM, 0, -0.08, -0.09]]);
        else o = mk([[atpG, atpM], [piG, piM, 0.13, 0.04, 0], [piG, piM, 0.23, 0.09, 0]]);
        var it = { o: o, busy: true }; P.push(it); return it;
      }
      function free(it) { it.busy = false; it.o.visible = false; it.o.scale.setScalar(1); }
      var movers = [];
      function run(it, start, legs) { it.o.position.copy(start); it.o.visible = true; it.o.scale.setScalar(1); it.o.children.forEach(function (c) { c.visible = true; }); movers.push(new L.Mover(it.o, legs)); }
      function shrink(it) { return { d: 0.5, each: function (o, u) { o.scale.setScalar(1 - u); }, fn: function () { free(it); } }; }
      function outside() { return V(-4.6 + rr() * 9.2, 1.0 + rr() * 1.6, -1.5 + rr() * 3); }
      function inside(x) { return V(x + (rr() - 0.5) * 1.6, -2.0 - rr() * 0.4, (rr() - 0.5) * 2.4); }

      var pumpKick = 0;
      function sendH(x0, y0) {
        var h = take('h');
        run(h, V(x0, y0, 0), [{ to: V(x0, 0.95, 0), d: 0.6, lin: true }, { to: outside(), d: 1.4 }, shrink(h)]);
      }
      function pumpEvent(extra) {
        var a = take('atp');
        run(a, inside(X.pump - 0.3), [
          { to: V(X.pump + 0.1, -1.55, 0.45), d: 0.9 },
          { d: 0.15, fn: function (o) { o.children[2].visible = false; pumpKick = 1; sendH(X.pump, -0.2); } },
          { to: inside(X.pump + 0.4), d: 1.0 }, shrink(a)
        ]);
        if (extra) sendH(X.pump + 0.12, -0.35);
      }
      function kIn(x, rk) {
        var k = take('k'), s0 = V(x + (rr() - 0.5) * 1.2, 1.9 + rr() * 0.6, (rr() - 0.5) * 1.6);
        run(k, s0, [{ to: V(x, 1.0, 0), d: 0.9 }, { to: V(x, -0.95, 0), d: 0.9, lin: true, each: rk ? function () { rk.to = -1; } : null, fn: rk ? function () { rk.to = 1; } : null }, { to: inside(x), d: 0.8 }, shrink(k)]);
      }
      function no3In() {
        var n = take('no3'), h1 = take('h'), h2 = take('h'), x = X.nrt;
        var s0 = V(x - 0.6 + rr() * 1.2, 1.9 + rr() * 0.5, (rr() - 0.5) * 1.4);
        run(n, s0, [{ to: V(x, 1.05, 0), d: 1.0 }, { to: V(x, -0.95, 0), d: 1.0, lin: true, each: function () { nrt.to = -1; }, fn: function () { nrt.to = 1; } }, { to: inside(x), d: 0.8 }, shrink(n)]);
        [[h1, -0.2], [h2, 0.2]].forEach(function (q) {
          run(q[0], V(s0.x + q[1] * 3, s0.y + 0.3, s0.z + 0.3), [{ to: V(x + q[1], 1.15, 0.12), d: 1.0 }, { to: V(x + q[1] * 0.6, -0.95, 0.12), d: 1.0, lin: true }, { to: inside(x), d: 0.8 }, shrink(q[0])]);
        });
      }
      function nh4In() {
        var n = take('nh4'), x = X.amt;
        run(n, V(x - 0.6 + rr() * 1.2, 1.9 + rr() * 0.5, (rr() - 0.5) * 1.4), [{ to: V(x, 1.05, 0), d: 1.0 }, { to: V(x, -0.95, 0), d: 0.9, lin: true, each: function () { amt.to = -1; }, fn: function () { amt.to = 1; } }, { to: inside(x), d: 0.8 }, shrink(n)]);
      }

      /* wandering clouds: H+ near the surface (more when acid) and K+ in the soil water (more at higher soil K+) */
      var cloudH = [], cloudK = [];
      for (i = 0; i < 22; i++) { var ch = mk([[hG, hM]]); ch.position.copy(outside()); cloudH.push({ o: ch, v: V(0, 0, 0) }); }
      for (i = 0; i < 16; i++) { var ck = mk([[kG, kM]]); ck.position.copy(outside()); ck.position.y += 0.4; cloudK.push({ o: ck, v: V(0, 0, 0) }); }
      var nH = 8, nK = 8, nFe = 4;
      function wander(arr, n, dt, y0, y1) {
        arr.forEach(function (c, j) {
          c.o.visible = j < n; if (j >= n) return;
          c.v.x += (rr() - 0.5) * dt * 1.4; c.v.y += (rr() - 0.5) * dt * 1.4; c.v.z += (rr() - 0.5) * dt * 1.4; c.v.multiplyScalar(0.96);
          var p = c.o.position; p.addScaledVector(c.v, dt);
          if (p.x < -4.8 || p.x > 4.8) c.v.x *= -1; if (p.y < y0 || p.y > y1) c.v.y *= -1; if (p.z < -1.7 || p.z > 1.7) c.v.z *= -1;
          p.x = L.clamp(p.x, -4.8, 4.8); p.y = L.clamp(p.y, y0, y1); p.z = L.clamp(p.z, -1.7, 1.7);
        });
      }

      var acc = { p: 0, ka: 0, kh: 0, n: 0, a: 0 }, lastTagV = null, tagT = 0;
      function sim(dt) {
        var s = ws.state, vt = vTarget(s);
        vAnim += (vt - vAnim) * Math.min(1, dt * 1.6);
        var f = fluxes(s, vAnim);
        acc.p += dt * (f.pump ? 1.1 + 1.4 * f.nh4 : 0);
        while (acc.p > 1) { acc.p -= 1; pumpEvent(f.nh4 > 0.25 && rr() < f.nh4); }
        acc.ka += dt * 2.4 * f.akt; while (acc.ka > 1) { acc.ka -= 1; kIn(X.akt, null); }
        acc.kh += dt * 4.0 * f.hak; while (acc.kh > 1) { acc.kh -= 1; kIn(X.hak, hak); }
        acc.n += dt * 1.6 * f.no3; while (acc.n > 1) { acc.n -= 1; no3In(); }
        acc.a += dt * 1.6 * f.nh4; while (acc.a > 1) { acc.a -= 1; nh4In(); }
        movers = movers.filter(function (mv) { return !mv.step(dt); });
        [hak, nrt, amt].forEach(function (r) { r.rock += (r.to - r.rock) * Math.min(1, dt * 5); r.l.rotation.z = 0.12 * r.rock; r.r.rotation.z = -0.12 * r.rock; });
        pumpKick = Math.max(0, pumpKick - dt * 2.5); pump.scale.set(1 + 0.05 * pumpKick, 1 - 0.04 * pumpKick, 1 + 0.05 * pumpKick);
        wander(cloudH, nH, dt, 0.8, 1.9); wander(cloudK, nK, dt, 1.4, 3.0);
        fes.forEach(function (m, j) { m.visible = j < nFe; if (m.visible) m.position.x += Math.sin(simT * 0.7 + j) * dt * 0.08; });
        simT += dt;
        var D = drive(vAnim);
        vM.opacity = (WS.isDark() ? 0.3 : 0.22) * D + 0.02;
        tagT += dt;
        if (tagT > 0.12 && (lastTagV == null || Math.abs(Math.round(vAnim) - lastTagV) >= 1)) { tagT = 0; lastTagV = Math.round(vAnim); tIn.userData.redraw('cytosol, inside: ' + mV(vAnim)); }
        paintOv(vAnim);
      }
      var simT = 0;
      ws.onFrame(function (t, dt) { sim(dt); });
      ws.onTheme(function (dark) {
        L.theme(root, dark); cytoM.opacity = dark ? 0.1 : 0.07; tintM.opacity = dark ? 0.1 : 0.08;
        vM.color.set(WS.token('accent')); tipM.color.set(WS.token('accent'));
      });
      ws.on(function (s) {
        var sh = surfShift(s), pHs = BULK + sh, mm = probeMM(s), ph = pHat(s, mm);
        nH = Math.round(L.clamp(8 - 5 * sh, 2, 22));
        nK = Math.round(2 + 14 * (s.lk + 3) / 4);
        nFe = pHs < 7 ? Math.round(3 + 7 * L.clamp((7 - pHs) / 1.5, 0, 1)) : 0;
        tRust.userData.redraw(pHs >= 7 ? 'iron locked in rust' : 'rust, some free iron');
        tAkt.userData.redraw(s.pump === 'on' ? 'AKT1 channel, open' : 'AKT1 open, no K⁺ in');
        needle.position.set(PX, s.py + 1.2, PZ); tip.position.set(PX, s.py, PZ);
        tProbe.position.set(PX + 1.25, s.py + 0.1, PZ);
        tProbe.userData.redraw(fmtPH(ph) + ' at ' + mm.toFixed(1) + ' mm');
        if (paused()) { vAnim = vTarget(s); tIn.userData.redraw('cytosol, inside: ' + mV(vAnim)); lastTagV = Math.round(vAnim); vM.opacity = (WS.isDark() ? 0.3 : 0.22) * drive(vAnim) + 0.02; paintOv(vAnim); for (var k2 = 0; k2 < 14; k2++) sim(0.12); }
      });
      for (var w0 = 0; w0 < 20; w0++) sim(0.1);

      /* clickable parts (kit hook) */
      if (ws.pick) {
        ws.pick(pump, { name: 'The proton pump (P-type H⁺-ATPase)', html: 'Splits ATP and throws protons (H⁺) out of the cell. That leaves the inside negative and the outside more acid: a store of energy most uptake carriers spend. A family of related genes, and a different class from the vacuole\'s V-ATPase.' });
        ws.pick(akt, { name: 'AKT1, a potassium channel', html: 'A gated pore: when open, K⁺ flows in, pulled by the negative inside, with no ATP of its own. Here it is held open, yet with the pump off K⁺ stops coming in; it would tend to leak out instead (see Why). In Arabidopsis (a small lab plant) it takes up K⁺ from as little as 10 µM ' + B('MEASURED', 'Hirsch et al. 1998.') + '.' });
        ws.pick(hak.g, { name: 'HAK5, a high affinity K⁺ carrier', html: 'A carrier that binds K⁺ and changes shape. The root makes more of it when K⁺ is short. Apparent Km about 15 to 24 µM in K⁺ starved Arabidopsis roots ' + B('MEASURED', 'Gierth et al. 2005, whole roots.') + ', so it grabs scarce K⁺. In the model it stops with the pump off too; how it uses the proton gradient was not checked for this page.' });
        ws.pick(nrt.g, { name: 'A nitrate carrier', html: 'Nitrate (NO₃⁻) is negative, and so is the inside, so it cannot just flow in. It rides in with protons, about two per nitrate ' + B('OPEN', 'Inferred from currents, not counted (Meharg and Blatt 1995).') + ', so each trip brings net positive charge in. Taking protons in raises the pH at the root surface. Pump off: it stops.' });
        ws.pick(amt.g, { name: 'Ammonium entry', html: 'Ammonium (NH₄⁺) is a cation (a positive ion), so the negative inside pulls it in. To balance the charge the pump pushes protons out, and the soil at the root surface turns more acid. The scene does not name one ammonium carrier.' });
        ws.pick(bil, { name: 'The plasma membrane', html: 'A thin double layer of lipids, drawn as blue beads with tails. Ions cannot cross its oily middle on their own: every ion here crosses through a protein. The voltage across it is the pump\'s work.', priority: -1 });
        ws.pick(needle, { name: 'The pH probe', html: 'A model pH electrode. Its reading depends on where it sits: the pH shift is largest at the root surface and fades within about 2 mm. Distance is not to scale: the membrane is nanometres thick, the probe millimetres away.' });
      }
    })();

    /* ---- the readout */
    ws.on(function (s) {
      var f = fluxes(s), v = vTarget(s), sh = surfShift(s), pHs = BULK + sh, mm = probeMM(s), ph = pHat(s, mm), msg;
      if (s.pump === 'on') msg = 'The pump is <b>on</b>: it spends ATP to throw protons out, and the inside sits at <b>' + mV(v) + '</b>. K⁺ is pulled in through AKT1 and HAK5, nitrate rides in with protons.';
      else msg = 'The pump is <b>off</b>. The membrane <b>depolarises</b> (the inside becomes less negative) to about <b>' + mV(v) + '</b>: the pull is gone, and K⁺ no longer moves in. AKT1 is <b>still open</b>, but with about 100 mM K⁺ inside ' + B('ILLUSTRATIVE', 'Cytosolic K+ is OPEN (see Why); 100 mM is used only for this check.') + ' and ' + fmtK(s.lk) + ' outside, K⁺ would be balanced only at about <b>' + mV(eK(s)) + '</b> ' + B('DERIVED', 'Nernst at about 25 °C: 59 mV per tenfold difference in K+.') + '. At ' + mV(v) + ', K⁺ through an open channel would tend to leak <b>out</b> instead; the model just shows its uptake as 0 %. Nitrate uptake stops too.';
      msg += ' Uptake, as a share of its top speed in this model: K⁺ <b>' + pct(f.k) + '</b>' + (f.k > 0.01 ? ' (HAK5 carries ' + pct(f.hak / f.k) + ' of it, AKT1 the rest)' : '') + ', nitrate <b>' + pct(f.no3) + '</b>, ammonium <b>' + pct(f.nh4) + '</b>.';
      msg += ' Root surface ' + fmtPH(pHs) + ', probe at ' + mm.toFixed(1) + ' mm: <b>' + fmtPH(ph) + '</b>.';
      if (pHs >= 7) msg += ' Above pH 7 at the surface: about <b>' + fold(feFold(s)) + ' times</b> less free Fe³⁺ than in the bulk soil, so iron is locked up.';
      ws.say(msg);
      if (!ws.gl) { vAnim = v; paintOv(v); }
      else if (paused()) paintOv(vAnim);
    });

    /* ---- the scan: the soil strip next to the root */
    var dots = (function () { var r = L.rng(41), a = []; for (var i = 0; i < 70; i++) a.push([r(), r(), r()]); return a; })();
    ws.paintScan(function (c, w, h, s) {
      var sh = surfShift(s), mm = probeMM(s), ink = WS.token('ink'), ink2 = WS.token('ink2'), ui = WS.token('ui');
      c.fillStyle = WS.token('card2'); c.fillRect(0, 0, w, h);
      var x0 = 30, x1 = w - 10, ys0 = 18, ys1 = Math.round(h * 0.42), yp0 = ys1 + 14, yp1 = h - 30;
      function X(m) { return x0 + (x1 - x0) * m / MM_MAX; }
      /* the strip, coloured by pH column by column */
      for (var px = x0; px < x1; px += 2) { var col = phRGB(pHat(s, (px - x0) / (x1 - x0) * MM_MAX)); c.fillStyle = 'rgba(' + col.map(Math.round).join(',') + ',0.6)'; c.fillRect(px, ys0, 2.5, ys1 - ys0); }
      c.fillStyle = WS.token('leaf3'); c.fillRect(x0 - 12, ys0, 12, yp1 - ys0);
      c.save(); c.translate(x0 - 3, (ys0 + yp1) / 2); c.rotate(-Math.PI / 2); c.fillStyle = WS.isDark() ? '#16200f' : '#ffffff'; c.font = '600 10px ' + ui; c.textAlign = 'center'; c.fillText('ROOT', 0, 0); c.restore();
      /* free iron dots: shown where the local pH leaves iron available (illustrative density) */
      dots.forEach(function (d) {
        var m = d[0] * MM_MAX, ph = pHat(s, m), avail = L.clamp((7.2 - ph) / 1.2, 0, 1);
        if (d[2] > avail) return;
        c.beginPath(); c.arc(X(m), ys0 + 5 + d[1] * (ys1 - ys0 - 10), 2.6, 0, 6.283); c.fillStyle = '#b5521f'; c.fill();
      });
      c.fillStyle = ink2; c.font = '11px ' + ui; c.fillText('model rendering, not an image', x0 + 2, 12);
      /* pH against distance */
      var pmin = 4.8, pmax = 8.2;
      function Y(p) { return yp1 - (p - pmin) / (pmax - pmin) * (yp1 - yp0); }
      c.strokeStyle = WS.token('rule2'); c.lineWidth = 1;
      [5, 6, 7, 8].forEach(function (p) { c.beginPath(); c.moveTo(x0, Y(p)); c.lineTo(x1, Y(p)); c.stroke(); c.fillStyle = ink2; c.font = '10px ' + ui; c.textAlign = 'right'; c.fillText(String(p), x0 - 14, Y(p) + 3); });
      c.textAlign = 'left';
      c.setLineDash([3, 3]); c.strokeStyle = ink2; c.beginPath(); c.moveTo(x0, Y(7)); c.lineTo(x1, Y(7)); c.stroke(); c.setLineDash([]);
      c.fillStyle = ink2; c.font = '10px ' + ui; c.textAlign = 'right'; c.fillText('pH 7: iron line', x1, Y(7) - 3); c.textAlign = 'left';
      c.strokeStyle = WS.token('accent'); c.lineWidth = 2.2; c.beginPath();
      for (var k = 0; k <= 60; k++) { var m2 = k / 60 * MM_MAX, xx = X(m2), yy = Y(pHat(s, m2)); if (k) c.lineTo(xx, yy); else c.moveTo(xx, yy); }
      c.stroke();
      /* the probe */
      var ph = pHat(s, mm), xp = X(mm);
      c.strokeStyle = WS.token('warm'); c.lineWidth = 2; c.setLineDash([4, 3]); c.beginPath(); c.moveTo(xp, ys0); c.lineTo(xp, yp1); c.stroke(); c.setLineDash([]);
      c.beginPath(); c.arc(xp, Y(ph), 4, 0, 6.283); c.fillStyle = WS.token('warm'); c.fill();
      var lab = 'probe ' + fmtPH(ph);
      c.font = '600 11px ' + ui; var lw = c.measureText(lab).width + 8, lx = Math.min(x1 - lw, Math.max(x0 + 2, xp + 6)), ly = Y(ph) + (Y(ph) < (yp0 + yp1) / 2 ? 16 : -8);
      c.fillStyle = WS.token('wall'); c.globalAlpha = 0.9; c.fillRect(lx - 2, ly - 11, lw, 15); c.globalAlpha = 1;
      c.fillStyle = ink; c.fillText(lab, lx + 2, ly);
      /* x axis */
      c.fillStyle = ink2; c.font = '10px ' + ui; c.textAlign = 'center';
      for (var t = 0; t <= MM_MAX; t++) c.fillText(t + (t === MM_MAX ? ' mm' : ''), X(t) - (t === MM_MAX ? 8 : 0), yp1 + 12);
      c.textAlign = 'left';
      var pHs = BULK + sh, ff = fold(feFold(s));
      c.fillStyle = ink; c.font = '600 11.5px ' + ui;
      var fm = fold(1 / feFold(s));
      c.fillText('surface ' + fmtPH(pHs) + (ff ? ' · free Fe³⁺ ' + ff + '× less than bulk' + (pHs >= 7 ? ', iron locked in rust' : '') : (fm ? ' · free Fe³⁺ ' + fm + '× more than bulk' : ' · free Fe³⁺ about as in bulk')), 6, h - 5);
    });

    /* ---- the plot: K+ uptake against soil K+ */
    ws.paintPlot(function (svg, s) {
      var x0 = -3, x1 = 1;
      var ax = WS.axes(svg, { w: 360, h: 214, pad: { l: 46, r: 12, t: 48, b: 38 }, x: [x0, x1], y: [0, 1], yticks: [0, 0.5, 1], xticks: [], xlabel: 'soil K⁺ (log scale)', ylabel: 'K⁺ uptake, share of top speed (model)' });
      var axg = svg.querySelector('.ws-ax');
      WS.svg('rect', { x: ax.x(-1), y: ax.box.y1, width: ax.x(Math.log10(6)) - ax.x(-1), height: ax.box.y0 - ax.box.y1, 'class': 'npm-band' }, ax.g);
      WS.svg('text', { x: (ax.x(-1) + ax.x(Math.log10(6))) / 2, y: ax.box.y1 - 3, 'text-anchor': 'middle', 'class': 'ws-lab' }, ax.g).textContent = 'soil solution';
      [[-3, '1 µM'], [-2, '10 µM'], [-1, '0.1 mM'], [0, '1 mM'], [1, '10 mM']].forEach(function (t) {
        WS.svg('line', { x1: ax.x(t[0]), x2: ax.x(t[0]), y1: ax.box.y0, y2: ax.box.y0 + 4, 'class': 'ws-tick' }, axg);
        WS.svg('text', { x: ax.x(t[0]), y: ax.box.y0 + 16, 'text-anchor': t[0] === -3 ? 'start' : (t[0] === 1 ? 'end' : 'middle') }, axg).textContent = t[1];
      });
      var st = { pump: 'on', nf: s.nf, lk: 0 }, A = [], H = [], Tt = [], O = [], i, f;
      for (i = 0; i <= 80; i++) {
        st.lk = x0 + (x1 - x0) * i / 80; st.pump = s.pump; f = fluxes(st);
        A.push([st.lk, f.akt]); H.push([st.lk, f.hak]); Tt.push([st.lk, f.k]);
        if (s.pump === 'off') { st.pump = 'on'; O.push([st.lk, fluxes(st).k]); }
      }
      if (O.length) ax.path(O, 'nm-l0');
      ax.path(H, 'nm-l2'); ax.path(A, 'nm-l1'); ax.path(Tt, 'npm-tot');
      WS.svg('line', { x1: ax.x(s.lk), x2: ax.x(s.lk), y1: ax.box.y0, y2: ax.y(0.9), 'class': 'ws-cursor', 'aria-hidden': 'true' }, ax.g);
      f = fluxes(s); ax.dot(s.lk, f.k);
      var lg = WS.svg('g', { 'class': 'nm-legend' }, svg);
      WS.svg('path', { d: 'M50 10h18', 'class': 'nm-l1' }, lg); WS.svg('text', { x: 72, y: 14, 'class': 'nm-leg' }, lg).textContent = 'AKT1 channel';
      WS.svg('path', { d: 'M160 10h18', 'class': 'nm-l2' }, lg); WS.svg('text', { x: 182, y: 14, 'class': 'nm-leg' }, lg).textContent = 'HAK5 carrier';
      WS.svg('path', { d: 'M262 10h18', 'class': 'npm-tot' }, lg); WS.svg('text', { x: 284, y: 14, 'class': 'nm-leg' }, lg).textContent = 'total';
      if (s.pump === 'off') { WS.svg('path', { d: 'M50 26h18', 'class': 'nm-l0' }, lg); WS.svg('text', { x: 72, y: 30, 'class': 'nm-leg' }, lg).textContent = 'total with the pump on, for comparison'; }
      else WS.svg('text', { x: 50, y: 30, 'class': 'nm-leg' }, lg).textContent = 'dot: your soil, ' + fmtK(s.lk) + ' K⁺';
    });

    /* ---- the flat drawing when WebGL is missing */
    ws.fallback(function (c, w, h, s) {
      var f = fluxes(s), my = h * 0.56, th = 24, ui = WS.token('ui'), ink = WS.token('ink');
      var col = phRGB(BULK + surfShift(s)); c.fillStyle = 'rgba(' + col.map(Math.round).join(',') + ',0.35)'; c.fillRect(0, 0, w, my - th / 2);
      c.fillStyle = WS.token('w4'); c.fillRect(0, my - th / 2, w, th);
      c.fillStyle = ink; c.font = '12px ' + ui;
      c.fillText('soil water, outside: surface ' + fmtPH(BULK + surfShift(s)), 8, h * 0.3);
      c.fillText('cytosol, inside: ' + mV(vTarget(s)), 8, h - 10);
      var items = [['H⁺ pump', 0.12, '#8f93d6', f.pump, 'out'], ['AKT1', 0.32, '#5b8fd6', f.akt, 'in'], ['HAK5', 0.5, '#7fae5c', f.hak * 2.5, 'in'], ['nitrate', 0.69, '#d2ae68', f.no3, 'in'], ['ammonium', 0.88, '#a3a3ad', f.nh4, 'in']];
      items.forEach(function (it, k) {
        var x = it[1] * w;
        L.rrect(c, x - 14, my - 28, 28, 56, 9); c.fillStyle = it[2]; c.fill(); c.strokeStyle = ink; c.lineWidth = 1; c.stroke();
        var lw = 1 + 6 * Math.min(1, it[3]);
        if (it[3] > 0.02) {
          c.strokeStyle = ink; c.lineWidth = lw; c.beginPath();
          if (it[4] === 'out') { c.moveTo(x, my - 30); c.lineTo(x, my - 62); c.stroke(); c.beginPath(); c.moveTo(x - 6, my - 54); c.lineTo(x, my - 64); c.lineTo(x + 6, my - 54); c.stroke(); }
          else { c.moveTo(x, my - 62); c.lineTo(x, my + 40); c.stroke(); c.beginPath(); c.moveTo(x - 6, my + 32); c.lineTo(x, my + 42); c.lineTo(x + 6, my + 32); c.stroke(); }
        }
        c.fillStyle = ink; c.textAlign = 'center'; c.font = '12px ' + ui; c.fillText(it[0], x, my + 56 + (k % 2) * 14); c.textAlign = 'left';
      });
      if (s.pump === 'off') { c.fillStyle = ink; c.font = '600 12px ' + ui; c.textAlign = 'right'; c.fillText('pump off: AKT1 open, but no K⁺ flows in', w - 8, 18); c.textAlign = 'left'; }
    });

    /* ---- K+ at work: the guard cell inset (linked note) */
    var gc = document.createElement('aside'); gc.className = 'npm-guard'; gc.setAttribute('aria-label', 'Potassium and the guard cell');
    gc.innerHTML = '<svg viewBox="0 0 150 122" role="img" aria-labelledby="npm-gc-t"><title id="npm-gc-t">Two guard cells round an open pore, K⁺ moving in, water following</title>' +
      '<path class="npm-gc" d="M75 10 C40 10 22 32 22 55 C22 78 40 100 75 100 C60 88 56 72 56 55 C56 38 60 22 75 10 Z"/>' +
      '<path class="npm-gc" d="M75 10 C110 10 128 32 128 55 C128 78 110 100 75 100 C90 88 94 72 94 55 C94 38 90 22 75 10 Z"/>' +
      '<path class="npm-gp" d="M75 16 C64 30 61 42 61 55 C61 68 64 80 75 94 C86 80 89 68 89 55 C89 42 86 30 75 16 Z"/>' +
      '<circle class="npm-gk" cx="8" cy="40" r="4"/><path class="npm-ga" d="M13 40h14M23 36l5 4l-5 4"/><text x="2" y="30">K⁺</text>' +
      '<circle class="npm-gk" cx="142" cy="70" r="4"/><path class="npm-ga" d="M137 70h-14M127 66l-5 4l5 4"/>' +
      '<text x="58" y="58">pore</text><text x="75" y="117" text-anchor="middle">water follows</text></svg>' +
      '<div><h4>Where K⁺ does a job: the guard cell</h4>' +
      '<p>One job of K⁺ is osmotic: where it collects, water follows and builds <b>turgor</b>, the water pressure that keeps cells firm. In the two guard cells round a leaf pore: <b>K⁺ in, water follows, the pore opens.</b> In broad bean, K⁺ uptake into guard cells accounts for opening from about <b>2 to 12 µm</b> ' + B('MEASURED', 'Humble and Raschke 1971, Vicia faba, electron probe analysis.') + '. Chloride did not rise, so the balancing anions were mainly organic, likely <b>malate</b> (Humble &amp; Raschke 1971, Plant Physiol 48: 447, ' + DOI('10.1104/pp.48.4.447') + ') ' + B('OPEN', 'An inference: the anions were not measured directly, and it holds for broad bean in their conditions.') + '.</p>' +
      '<p>To close, K⁺ leaves through <b>GORK</b>, the main outward K⁺ channel of guard cells; without it stomata close poorly (Hosy et al. 2003, PNAS 100: 5549, ' + DOI('10.1073/pnas.0733970100') + '). The water side of stomata is on the water path, Plate IV.</p></div>';
    host.appendChild(gc);

    var destroy0 = ws.destroy;
    ws.destroy = function () { if (gc.parentNode) gc.parentNode.removeChild(gc); destroy0(); };
    return { ws: ws };
  };
})();

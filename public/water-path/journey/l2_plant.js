/* The Water Path v8: l2_plant.js (Plant and Organ builder)
   Level II, Plant (1 m). Stop 2a.
   A hand drawn plant per crop as a living circuit: water particles at a speed set by E,
   resistor glyphs sized by R, the Ψ staircase from WP.result with a broken axis to the air,
   a stomata glyph that opens with gs, and the gravity term.
   Series experiment after Scoffoni et al. 2023 New Phytol Fig 2 (doi 10.1111/nph.19069).
   Flow = ΔΨ ÷ R on the page; Ψw = Ψs + Ψp everywhere. */
(function () {
  'use strict';
  var WP = window.WP = window.WP || {};
  WP.levels = WP.levels || [];
  var MINUS = '−';
  var ui, root, refs = {}, exp = 0, lastCrop = '', anim = { on: false, raf: 0, t0: 0, s: 0, pathEl: null, len: 0 }, lastRes = null;

  function num(x, d) { return WP.fmt.num(x, d); }
  function psi(x, d) { return WP.fmt.psi(x, d); }
  function clamp(x, a, b) { return x < a ? a : (x > b ? b : x); }
  function esc(s) { return ui.esc(s); }

  /* ------------------------------------------------------------ WP.art: leaf generators shared by Plates II, III and the afternoon
     All leaves have the petiole junction at (0,0) and the blade growing toward −y. Units: px at scale 1. */
  var ART = WP.art = WP.art || {};
  function mulberry(seed) { var a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  ART.rng = mulberry;
  function f1(x) { return (Math.round(x * 10) / 10).toString(); }
  function ptsD(P, close) { return 'M' + P.map(function (p) { return f1(p[0]) + ',' + f1(p[1]); }).join(' L') + (close ? 'Z' : ''); }
  ART.ptsD = ptsD;

  /* Grapevine: five lobes at 0, ±55 and ±118° from the midrib, an open U petiolar sinus between ±152°,
     serration from alternating 0.965 / 1.05 radii, per-leaf jitter. R is the blade radius in px. */
  ART.grapeLeaf = function (R, seed, opt) {
    opt = opt || {};
    var rnd = mulberry(seed || 1), j = function (a) { return (rnd() - 0.5) * 2 * a; };
    var lobes = [[0, 0.5 + j(0.05)], [55 + j(5), 0.47 + j(0.05)], [-55 + j(5), 0.47 + j(0.05)], [118 + j(6), 0.44 + j(0.05)], [-118 + j(6), 0.44 + j(0.05)]];
    var wid = 17 + j(2), base = 0.5 + j(0.03), cy = -0.12;
    function r(th) {
      var v = base;
      lobes.forEach(function (l) { var d = th - l[0]; v += l[1] * Math.exp(-(d * d) / (2 * wid * wid)); });
      return v;
    }
    var P = [], tips = [], k = 0, S = 5, i, th, rr;
    var r152 = r(152);
    for (th = -180 + S; th <= 180 - S + 1e-9; th += S) {
      var a = Math.abs(th);
      if (a > 152) { var u = (a - 152) / 28; rr = r152 * (1 - u) + 0.12 * u; }
      else { rr = r(th); rr *= (k++ % 2 ? 0.965 : 1.05); }
      var rad = th * Math.PI / 180;
      P.push([R * rr * Math.sin(rad), R * (cy - rr * Math.cos(rad))]);
    }
    P.unshift([0, 0]); P.push([0, 0]);
    lobes.forEach(function (l) { var rad = l[0] * Math.PI / 180, rr2 = r(l[0]) * 0.97; tips.push([R * rr2 * Math.sin(rad), R * (cy - rr2 * Math.cos(rad))]); });
    // veins: five primaries from the junction to the lobe tips; secondaries at 35 % and 65 %
    var prim = '', sec = '', minor = '';
    tips.forEach(function (t, n) {
      var mx = t[0] * 0.5 + (n === 0 ? 0 : t[1] * 0.04), my = t[1] * 0.5;
      prim += 'M0,0 Q' + f1(mx) + ',' + f1(my) + ' ' + f1(t[0]) + ',' + f1(t[1]) + ' ';
      [0.35, 0.65].forEach(function (f) {
        var bx = t[0] * f, by = t[1] * f, ang = Math.atan2(t[1], t[0]);
        [-1, 1].forEach(function (sg) {
          if (n >= 3 && sg === (t[0] > 0 ? 1 : -1) && f < 0.5) return;
          var a2 = ang + sg * 0.75, L = R * (0.32 - f * 0.18);
          sec += 'M' + f1(bx) + ',' + f1(by) + ' l' + f1(Math.cos(a2) * L) + ',' + f1(Math.sin(a2) * L) + ' ';
        });
      });
    });
    if (opt.minor) {
      // an areole mesh: jittered polygon net across the blade box, clipped by the caller
      var n2 = opt.minor, x0 = -R * 1.1, y0 = R * (cy - 1.1), step = (2.2 * R) / n2, gx, gy, G = [];
      for (gy = 0; gy <= n2; gy++) { G.push([]); for (gx = 0; gx <= n2; gx++) G[gy].push([x0 + gx * step + j(step * 0.3), y0 + gy * step + j(step * 0.3)]); }
      for (gy = 0; gy <= n2; gy++) for (gx = 0; gx <= n2; gx++) {
        var p = G[gy][gx];
        if (gx < n2) minor += 'M' + f1(p[0]) + ',' + f1(p[1]) + ' L' + f1(G[gy][gx + 1][0]) + ',' + f1(G[gy][gx + 1][1]) + ' ';
        if (gy < n2 && (gx + gy) % 2 === 0) minor += 'M' + f1(p[0]) + ',' + f1(p[1]) + ' L' + f1(G[gy + 1][gx][0]) + ',' + f1(G[gy + 1][gx][1]) + ' ';
      }
    }
    return { d: ptsD(P, true), pts: P, prim: prim, sec: sec, minor: minor, tips: tips, top: tips[0] };
  };

  ART.inPoly = function (x, y, P) {
    var c = false;
    for (var i = 0, j = P.length - 1; i < P.length; j = i++) {
      if (((P[i][1] > y) !== (P[j][1] > y)) && (x < (P[j][0] - P[i][0]) * (y - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0])) c = !c;
    }
    return c;
  };
  /* an areole mesh over a box: returns the path and the edge list (for flow) */
  ART.mesh = function (x0, y0, w, h, n, seed) {
    var rnd = mulberry(seed || 9), step = w / n, rows = Math.ceil(h / step), G = [], d = '', E = [], gx, gy;
    for (gy = 0; gy <= rows; gy++) { G.push([]); for (gx = 0; gx <= n; gx++) G[gy].push([x0 + gx * step + (rnd() - 0.5) * step * 0.6, y0 + gy * step + (rnd() - 0.5) * step * 0.6]); }
    for (gy = 0; gy <= rows; gy++) for (gx = 0; gx <= n; gx++) {
      var p = G[gy][gx];
      if (gx < n) { d += 'M' + f1(p[0]) + ',' + f1(p[1]) + ' L' + f1(G[gy][gx + 1][0]) + ',' + f1(G[gy][gx + 1][1]) + ' '; E.push([p, G[gy][gx + 1]]); }
      if (gy < rows && (gx + gy) % 2 === 0) { d += 'M' + f1(p[0]) + ',' + f1(p[1]) + ' L' + f1(G[gy + 1][gx][0]) + ',' + f1(G[gy + 1][gx][1]) + ' '; E.push([p, G[gy + 1][gx]]); }
    }
    return { d: d, edges: E };
  };

  /* Romaine: oblong obovate, savoyed margin, thick white midrib tapering to the apex. L length, W half width. */
  ART.romaineLeaf = function (L, W, seed, opt) {
    opt = opt || {};
    var rnd = mulberry(seed || 3), j = function (a) { return (rnd() - 0.5) * 2 * a; };
    var N = 44, Ls = [], Rs = [], i;
    for (i = 0; i <= N; i++) {
      var t = i / N;
      var w = W * Math.pow(Math.max(0, Math.sin(Math.PI * Math.pow(t, 1.45))), 0.55) * (t < 0.08 ? t / 0.08 * 0.6 + 0.4 : 1);
      if (t > 0.98) w *= 0.5;
      var sv = 1 + 0.045 * Math.sin(t * 46 + seed) + j(0.025);
      Rs.push([w * sv, -L * t]); Ls.push([-w * (2 - sv), -L * t]);
    }
    var P = Rs.concat(Ls.reverse());
    var rib = W * (opt.rib || 0.16);
    var ribD = 'M' + f1(-rib) + ',0 C' + f1(-rib * 0.9) + ',' + f1(-L * 0.4) + ' ' + f1(-rib * 0.35) + ',' + f1(-L * 0.75) + ' 0,' + f1(-L * 0.97) + ' C' + f1(rib * 0.35) + ',' + f1(-L * 0.75) + ' ' + f1(rib * 0.9) + ',' + f1(-L * 0.4) + ' ' + f1(rib) + ',0Z';
    var sec = '';
    for (i = 1; i <= 7; i++) {
      var tt = 0.1 + i * 0.11, y = -L * tt, ww = W * 0.85 * Math.pow(Math.sin(Math.PI * Math.pow(Math.min(tt, 0.97), 1.45)), 0.55);
      sec += 'M0,' + f1(y) + ' Q' + f1(ww * 0.45) + ',' + f1(y - L * 0.04) + ' ' + f1(ww) + ',' + f1(y - L * 0.1) + ' M0,' + f1(y) + ' Q' + f1(-ww * 0.45) + ',' + f1(y - L * 0.04) + ' ' + f1(-ww) + ',' + f1(y - L * 0.1) + ' ';
    }
    return { d: ptsD(P, true), pts: P, rib: ribD, sec: sec };
  };

  /* Almond: lanceolate, finely serrate, acuminate apex. L length, W half width. */
  ART.almondLeaf = function (L, W, seed) {
    var rnd = mulberry(seed || 5), Rs = [], Ls = [], N = Math.max(40, Math.round(L / 5)), i, big = L > 120;
    for (i = 0; i <= N; i++) {
      var t = i / N, w = W * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.72)), 1.1);
      var ser = big ? (i % 2 ? 0.975 : 1.02) : (i % 2 ? 0.93 : 1.04);
      if (t < 0.06 || t > 0.95) ser = 1;
      Rs.push([w * ser, -L * t]); Ls.push([-w * (big ? (i % 2 ? 1.02 : 0.975) : (i % 2 ? 1.04 : 0.93)), -L * t]);
    }
    var sec = '';
    for (i = 1; i <= 6; i++) { var y = -L * (0.12 + i * 0.12), ww = W * 0.8 * Math.sin(Math.PI * Math.pow(0.12 + i * 0.12, 0.72)); sec += 'M0,' + f1(y) + ' l' + f1(ww) + ',' + f1(-L * 0.08) + ' M0,' + f1(y) + ' l' + f1(-ww) + ',' + f1(-L * 0.08) + ' '; }
    var AP = Rs.concat(Ls.reverse());
    return { d: ptsD(AP, true), pts: AP, mid: 'M0,0 L0,' + f1(-L * 0.97), sec: sec, jitter: rnd() };
  };


  /* ------------------------------------------------------------ evidence registry (shared format, CONTRACT addendum) */
  WP.howto = WP.howto || {};
  var HT2 = {
    'pchamber': { title: 'stem and leaf water potential with a pressure chamber', what: 'Scholander type chamber', steps: [
      'Stem Ψ: an hour or more before the reading, enclose a shaded leaf near the trunk in a foil covered plastic bag so it stops transpiring and comes to equilibrium with the stem.',
      'Leaf Ψ: bag a sunlit transpiring leaf just before cutting it, to stop water loss during handling.',
      'Cut the petiole with a sharp blade, seal the leaf in the chamber with the cut end out, and raise the pressure slowly.',
      'Read the balance pressure when sap first wets the cut surface: Ψ = minus that pressure.'],
      watch: 'Midday stem Ψ is less variable than leaf Ψ and is the number growers and UCCE use for vines and orchards (Choné et al. 2001; Naor and Cohen 2003, apple). Leaf Ψ sits lower than stem Ψ by E × R of the leaf path.',
      dois: ['10.1006/anbo.2000.1361', '10.21273/hortsci.38.4.547'],
      proto: { url: 'https://prometheusprotocols.net/function/water-relations/measuring-plant-water-status/', label: 'Measuring plant water status (overview page)' } },
    'gmin': { title: 'minimum leaf conductance, gmin', what: 'detached leaf drying', steps: [
      'Rehydrate leaves, seal the cut petiole with wax, and let them dry in the dark at fixed temperature and humidity.',
      'Weigh them at regular intervals; after the stomata close, the weight loss rate becomes slow and steady.',
      'gmin = water loss rate ÷ (leaf area × VPD ÷ Patm), using both leaf surfaces if both lose water.'],
      watch: 'gmin is not steady: it keeps falling during dehydration, so state the water status window used (Burlett et al. 2025). Values from different methods differ (Kerstiens 1996).',
      dois: ['10.1111/nph.15395', '10.1093/jxb/47.12.1813', '10.1111/nph.70052'],
      proto: { url: 'https://prometheusprotocols.net/function/gas-exchange-and-chlorophyll-fluorescence/stomatal-and-non-stomatal-conductance-and-transpiration/minimum-epidermal-conductance-gmin-a-k-a-cuticular-conductance/', label: 'Minimum epidermal conductance (gmin, a.k.a. cuticular conductance)' } },
    'gsgas': { title: 'stomatal conductance from transpiration', what: 'gs = E ÷ (VPD ÷ Patm)', steps: [
      'Measure the transpiration rate E of a leaf: with a gas exchange system, a porometer, or the flowmeter of the evaporative flux method.',
      'Measure leaf temperature and air humidity to get the leaf to air VPD.',
      'Total vapour conductance g = E × Patm ÷ VPD. If the leaf is not well coupled to the air, take the boundary layer out as a resistance, not a conductance: 1 ÷ gs = VPD ÷ (E × Patm) − 1 ÷ gb. Conductances in series add as reciprocals, so they cannot simply be subtracted.',
      'Get gb from a wet filter paper replica of the leaf in the same air, or from the chamber specification of a gas exchange system.'],
      watch: 'A dedicated porometer methods paper has not been checked for this page yet. The evaporative flux rig gives gs and K-leaf on the same leaf (Sack and Scoffoni 2012).',
      dois: ['10.3791/4179'],
      proto: { url: 'https://prometheusprotocols.net/function/gas-exchange-and-chlorophyll-fluorescence/stomatal-and-non-stomatal-conductance-and-transpiration/gas-exchange-protocol-for-li-cor-6400/', label: 'Gas exchange protocol for LI-COR 6400 (transpiration and stomatal conductance)' } }
  };
  Object.keys(HT2).forEach(function (k) { if (!WP.howto[k]) WP.howto[k] = HT2[k]; });
  WP.evidence = WP.evidence || {};
  var EV = {
    'l2.series': { claim: 'At a fixed transpiration rate, changing one resistance moves water potential only downstream of that resistance.',
      cite: 'Scoffoni, Albuquerque, Buckley & Sack 2023, New Phytologist 239: 2099', doi: '10.1111/nph.19069',
      measured: 'A worked example drawn in the paper: soil 0 MPa, E 5 mmol m⁻² s⁻¹, resistances 100, 100, 50 and 50 MPa m² s mol⁻¹. The physics is the series rule, not a measurement.',
      fig: 'Fig. 2, scenarios A and C', badge: 'DERIVED' },
    'l2.ohm': { claim: 'Water flow is the current and the water potential difference is the voltage: flow = ΔΨ ÷ R. More resistance at the same pull means less flow.',
      cite: 'van den Honert 1948, Discussions of the Faraday Society 3: 146 (the catenary idea); Dimond 1966, Plant Physiology 41: 119 (Ohm analogy in tomato)', doi: '10.1039/df9480300146',
      doi2: '10.1104/pp.41.1.119',
      measured: 'A physical analogy. Dimond applied it to the tomato vascular network. The series form with gravity used here is the modern textbook form, not a quotation.',
      fig: 'Model equation', badge: 'DERIVED' },
    'l2.gravity': { claim: 'Holding water at height h needs a pressure term 0.0098 MPa more negative for every metre.',
      cite: 'Physics: ρ g h with ρ = 1000 kg m⁻³ and g = 9.8 m s⁻²', doi: '',
      measured: 'No measurement. Leaf heights per crop are teaching values (romaine 0.25 m, grapevine 1.5 m, almond 4 m).',
      fig: 'Model equation', badge: 'DERIVED' },
    'l2.air': { claim: 'Air at 40 % relative humidity sits near −126 MPa, so the step from leaf to air dwarfs every step inside the plant.',
      cite: 'Ψair = (R T ÷ Vw) ln(RH ÷ 100), the Kelvin relation', doi: '',
      measured: 'Calculated from air temperature and relative humidity in the conditions strip.', fig: 'Model equation', badge: 'DERIVED' },
    'l2.split': { claim: 'How the plant’s resistance is shared between root, stem, petiole, leaf xylem and the path outside the xylem.',
      cite: 'Teaching split. Calibration check: in wheat the leaf held less than 35 % of whole plant resistance (Corso et al. 2020, Plant, Cell and Environment 43: 854)', doi: '10.1111/pce.13722',
      measured: 'The crop splits are not measured. Only the wheat leaf share is data, and it is wheat, not a Salinas crop.', fig: 'Corso et al. 2020, results text', badge: 'ILLUSTRATIVE' },
    'l2.gsgrape': { claim: 'Grapevine stomatal conductance was down 80 % by a leaf water potential of about −1.2 MPa, with half closure at −0.60 MPa.',
      cite: 'Albuquerque, Scoffoni, Brodersen, Buckley, Sack & McElrone 2020, Journal of Experimental Botany 71: 7286', doi: '10.1093/jxb/eraa392',
      measured: 'Gas exchange against leaf water potential in Cabernet Sauvignon and Chardonnay. The 80 % by −1.2 MPa line is in the abstract. Table 2 gives half closure at −0.60 MPa (Cabernet Sauvignon; Chardonnay −0.53) and 80 % closure at −1.21 MPa.',
      fig: 'Table 2 and abstract. Both anchors MEASURED (Table 2). The curve on the page is a Weibull, fPsi = exp(−(−Ψ ÷ 0.81)^1.22), DERIVED from those two anchors; it is 1 at 0 MPa.', badge: 'MEASURED' },
    'l2.gsalmond': { claim: 'Almond stomata are 90 % closed between −1.72 and −2.25 MPa, depending on cultivar.',
      cite: 'Álvarez-Maldini et al. 2022, Frontiers in Plant Science 13: 974050', doi: '10.3389/fpls.2022.974050',
      measured: 'Ψgs90 from gs against midday Ψ in a pot dry down: Avijor −1.72, Isabelona −2.25, Soleta −2.14 MPa. The model puts half closure at −1.4 MPa so that its 90 % closure falls near −2.0 MPa, inside that range; both are ILLUSTRATIVE.',
      fig: 'Results text', badge: 'MEASURED' },
    'l2.gsromaine': { claim: 'Romaine stomatal closure curve.', cite: 'No published value found for Lactuca sativa', doi: '',
      measured: 'Nothing measured is plotted. The curve is a teaching shape only.', fig: 'none', badge: 'ILLUSTRATIVE' },
    'l2.psiw': { claim: 'Ψw = Ψs + Ψp everywhere. In a living cell Ψp is positive (turgor); in a xylem conduit it is negative (tension).',
      cite: 'Definition of water potential', doi: '',
      measured: 'A definition, not a measurement.', fig: 'A common idea: in the xylem Ψw = −Ψp. In fact the same equation holds everywhere; in a conduit Ψs is near zero and Ψp is negative.', badge: 'DERIVED' },
    'l2.leafshare': { claim: 'Leaves are a large part of the whole plant resistance: at least 30 %, and K-leaf varies more than 65 fold across species.',
      cite: 'Sack & Holbrook 2006, Annual Review of Plant Biology 57: 361', doi: '10.1146/annurev.arplant.56.032604.144141',
      measured: 'Review of published leaf and whole plant hydraulic measurements.', fig: 'Abstract. The model keeps the leaf at 0.35 of 1 ÷ K-plant.', badge: 'MEASURED' },
    'l2.iso': { claim: 'How far a vine lets its leaf Ψ fall depends on soil and weather, not only on the variety.',
      cite: 'Hochberg, Rockwell, Holbrook & Cochard 2018, Trends in Plant Science 23: 112', doi: '10.1016/j.tplants.2017.11.002',
      measured: 'A hydraulic model plus the grapevine literature on iso and anisohydric behaviour.', fig: 'Abstract; wording kept qualitative.', badge: 'MEASURED' },
    'l2.gmin': { claim: 'With stomata shut a leaf still loses water: through the cuticle and through stomata that do not close fully. Together these are the minimum conductance, gmin.',
      cite: 'Duursma et al. 2019, New Phytologist 221: 693; Kerstiens 1996, Journal of Experimental Botany 47: 1813; Trueba et al. 2026, New Phytologist 250: 3716', doi: '10.1111/nph.15395', doi2: '10.1093/jxb/47.12.1813',
      measured: 'Duursma: review and compilation of gmin from detached leaf weight loss; highly variable and responsive to growing conditions (soil water, temperature, humidity). Kerstiens: 313 values from 200 species; gmin was of little value as a predictor of crop drought resistance. Trueba (doi 10.1111/nph.71166): 101 species; annual herbs lose more than woody plants.',
      fig: 'Abstracts. The model value, 0.005 mol m⁻² s⁻¹, is ILLUSTRATIVE: no crop value and no compiled median was retrieved.', badge: 'ILLUSTRATIVE' },
    'l2.gminT': { claim: 'Expert depth: as leaves heat up, the share of gmin that goes through the cuticle rises.',
      cite: 'Garen & Michaletz 2024, New Phytologist 245: 1911', doi: '10.1111/nph.20346',
      measured: 'Gas exchange and bench drying across 20 to 50 °C in 11 broadleaf species.', fig: 'Abstract. Relevant to a 36 °C almond afternoon.', badge: 'MEASURED' },
    'l2.stomctl': { claim: 'What closes stomata: the water signal, the hormone, or both? Ferns and lycophytes close passively; seed plants added ABA; falling turgor triggers ABA in angiosperm leaves; hydroactive feedback is best supported, but where the leaf senses water status is unknown.',
      cite: 'Brodribb & McAdam 2011, Science 331: 582; McAdam & Brodribb 2016, Plant Physiology 171: 2008; Buckley 2019, New Phytologist 224: 21', doi: '10.1126/science.1197985', doi2: '10.1111/nph.15899',
      measured: 'Comparative physiology across land plant lineages (2011); leaf turgor manipulated with external pressure (2016, doi 10.1104/pp.16.00380); review (2019).',
      fig: 'Abstracts.', badge: 'OPEN QUESTION' },
    'l2.tombesi': { claim: 'In drought stressed grapevine, stomatal closure tracked hydraulic signals; foliar ABA rose only after closure was complete and kept the stomata shut after rewatering. One study, flagged.',
      cite: 'Tombesi, Nardini, Frioni et al. 2015, Scientific Reports 5: 12449', doi: '10.1038/srep12449',
      measured: 'Potted Vitis vinifera dried down: gas exchange, petiole embolism (loss of conductance), foliar ABA, then rewatering.', fig: 'Abstract (retrieved via PubMed, PMID 26207993). Included as one flagged study, not a settled answer.', badge: 'OPEN QUESTION' }
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
      '<dl><dt>Paper</dt><dd>' + esc(e.cite) + '</dd>' +
      '<dt>What was measured</dt><dd>' + esc(e.measured) + '</dd>' +
      '<dt>Figure or table</dt><dd>' + esc(e.fig) + '</dd>' +
      (src.length ? '<dt>DOI</dt><dd>' + src.join('<br>') + '</dd>' : '<dt>DOI</dt><dd>none (physics or definition)</dd>') + '</dl>';
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

  /* ------------------------------------------------------------ CSS (scoped) */
  var CSS = '\
[data-tier="1"] #lv-plant .tier-2,[data-tier="1"] #lv-plant .tier-3,[data-tier="2"] #lv-plant .tier-3{display:none}\
[data-tier="2"] #lv-plant .tier-1-only,[data-tier="3"] #lv-plant .tier-1-only{display:none}\
#lv-plant .p2-now{font-size:19px;line-height:1.45;margin:4px 0 14px;padding:10px 14px;border-left:4px solid var(--w2);background:var(--card)}\
#lv-plant .p2-now .k{display:block;font-family:var(--ui);font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink2);margin-bottom:2px}\
#lv-plant .p2-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:18px}\
@media (min-width:980px){#lv-plant .p2-grid{grid-template-columns:minmax(0,1fr) minmax(0,1.08fr)}}\
#lv-plant figure{margin:0}\
#lv-plant svg.p2-svg{display:block;width:100%;height:auto;border:1px solid var(--rule);background:var(--wall)}\
:root[data-theme="dark"] #lv-plant svg.p2-svg{background:var(--card)}\
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) #lv-plant svg.p2-svg{background:var(--card)}}\
#lv-plant svg text{fill:var(--ink);font-family:var(--text)}\
#lv-plant svg.p2-svg{--halo:var(--wall)}\
:root[data-theme="dark"] #lv-plant svg.p2-svg{--halo:var(--card)}\
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) #lv-plant svg.p2-svg{--halo:var(--card)}}\
#lv-plant svg .halo{paint-order:stroke;stroke:var(--halo);stroke-width:4px;stroke-linejoin:round}\
#lv-plant svg .t2{fill:var(--ink2)}\
#lv-plant svg .tui{font-family:var(--ui)}\
#lv-plant svg .tm{font-family:var(--mono)}\
#lv-plant svg .sc{font-variant-caps:all-small-caps;letter-spacing:.06em}\
#lv-plant .s-ink{stroke:var(--ink);fill:none}\
#lv-plant .s-ink2{stroke:var(--ink2);fill:none}\
#lv-plant .s-rule{stroke:var(--rule);fill:none}\
#lv-plant .f-paper{fill:var(--paper)}\
#lv-plant .f-wall{fill:var(--wall)}\
#lv-plant .f-ink{fill:var(--ink)}\
#lv-plant .f-ink2{fill:var(--ink2)}\
#lv-plant .f-leaf{fill:var(--leaf)}\
#lv-plant .f-leaf2{fill:var(--leaf2)}\
#lv-plant .f-leaf3{fill:var(--leaf3)}\
#lv-plant .f-bark{fill:var(--bark)}\
#lv-plant .f-soil{fill:var(--soil)}\
#lv-plant .f-soil2{fill:var(--soil2)}\
#lv-plant .f-sun{fill:var(--sun)}\
#lv-plant .f-air{fill:var(--air)}\
#lv-plant .x-bark{stroke:var(--bark);fill:none}\
#lv-plant .wline{fill:none;stroke-linecap:round;stroke-linejoin:round;filter:var(--glow)}\
#lv-plant .wcase{fill:none;stroke:var(--ink);stroke-linecap:round;stroke-linejoin:round}\
#lv-plant .ptc-dot{fill:var(--paper);stroke:var(--w0);stroke-width:1.2}\
:root[data-theme="dark"] #lv-plant .ptc-dot{fill:#eaf3ff;stroke:none;filter:drop-shadow(0 0 3px rgba(120,180,255,.9))}\
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) #lv-plant .ptc-dot{fill:#eaf3ff;stroke:none;filter:drop-shadow(0 0 3px rgba(120,180,255,.9))}}\
#lv-plant .res-body{fill:var(--paper);stroke:var(--ink);stroke-width:1.1}\
#lv-plant .res-zig{fill:none;stroke:var(--ink);stroke-width:1.3;stroke-linejoin:round}\
#lv-plant .res-ox .res-body{stroke:var(--warm);stroke-width:1.6}\
#lv-plant .res-ox .res-zig{stroke:var(--warm)}\
#lv-plant .lead{stroke:var(--ink2);stroke-width:.8;fill:none;stroke-dasharray:2 2}\
#lv-plant .vap{fill:none;stroke:var(--air);stroke-width:2;stroke-linecap:round}\
#lv-plant .tread{stroke:var(--ink);stroke-width:1}\
#lv-plant .tr-g{transition:transform .45s var(--ease)}\
:root[data-motion="reduce"] #lv-plant .tr-g{transition:none}\
@media (prefers-reduced-motion:reduce){:root:not([data-motion="full"]) #lv-plant .tr-g{transition:none}}\
#lv-plant .ghost{fill:none;stroke:var(--ink);stroke-width:1.3;stroke-dasharray:4 3}\
#lv-plant .mid{fill:none;stroke:var(--warm);stroke-width:1.5;stroke-dasharray:2 2}\
#lv-plant .mv{stroke:var(--warm);stroke-width:1.6;fill:none}\
#lv-plant .mvh{fill:var(--warm)}\
#lv-plant .axis{stroke:var(--ink);stroke-width:1.2;fill:none}\
#lv-plant .grid{stroke:var(--rule2);stroke-width:.8}\
#lv-plant .p2-cap{font-size:15px;color:var(--ink2);font-style:italic;margin:8px 0 0}\
#lv-plant .p2-cap b{font-style:normal;color:var(--ink)}\
#lv-plant .p2-legend{display:flex;flex-wrap:wrap;gap:6px 14px;font-family:var(--ui);font-size:12px;color:var(--ink2);margin:6px 0 0;align-items:center}\
#lv-plant .p2-legend i{display:inline-block;width:18px;height:10px;vertical-align:-1px;margin-right:5px;border:1px solid var(--ink)}\
#lv-plant .p2-legend i.g{background:transparent;border-style:dashed}\
#lv-plant .p2-legend i.m{background:transparent;border:1.5px dotted var(--warm)}\
#lv-plant .p2-exp{margin-top:18px;border:1px solid var(--rule);background:var(--card);padding:14px 16px}\
#lv-plant .p2-exp h3,#lv-plant h3.p2-h{font-family:var(--disp);font-weight:400;font-size:22px;letter-spacing:.03em;margin:0 0 4px}\
#lv-plant h3.p2-h{margin-top:22px}\
#lv-plant .p2-steps{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}\
#lv-plant .p2-steps .btn[aria-pressed="true"]{background:var(--plaque);color:var(--plaque-ink)}\
#lv-plant .p2-say{font-size:17px;margin:8px 0 0;min-height:3em}\
#lv-plant table.p2-t{border-collapse:collapse;width:100%;font-family:var(--ui);font-size:13px;margin-top:10px}\
#lv-plant table.p2-t th,#lv-plant table.p2-t td{padding:5px 8px;border-bottom:1px solid var(--rule2);text-align:right;white-space:nowrap}\
#lv-plant table.p2-t th:first-child,#lv-plant table.p2-t td:first-child{text-align:left}\
#lv-plant table.p2-t td{font-family:var(--mono);font-variant-numeric:tabular-nums}\
#lv-plant table.p2-t td.mvd{color:var(--warm);font-weight:600}\
#lv-plant .p2-tw{overflow-x:auto}\
#lv-plant .p2-two{display:grid;grid-template-columns:minmax(0,1fr);gap:14px;margin-top:14px}\
@media (min-width:860px){#lv-plant .p2-two{grid-template-columns:1fr 1fr}}\
#lv-plant .card p{margin:6px 0 0}\
#lv-plant .card h4{font-family:var(--disp);font-weight:400;font-size:19px;letter-spacing:.03em;margin:0}\
#lv-plant .ohm{font-family:var(--mono);font-size:15px;padding:8px 10px;background:var(--paper);border:1px solid var(--rule2);margin:8px 0;overflow-wrap:anywhere}\
#lv-plant .ev-drawer{font-family:var(--ui);font-size:13px;line-height:1.45;border:1px solid var(--rule);border-left:4px solid var(--accent);background:var(--paper);padding:8px 12px;margin:6px 0 10px}\
#lv-plant .ev-drawer dl{display:grid;grid-template-columns:minmax(0,9em) minmax(0,1fr);gap:3px 10px;margin:6px 0 0}\
#lv-plant .ev-drawer dt{color:var(--ink2)}\
#lv-plant .ev-drawer dd{margin:0;overflow-wrap:anywhere}\
@media (max-width:520px){#lv-plant .ev-drawer dl{grid-template-columns:minmax(0,1fr)}#lv-plant .ev-drawer dd{margin-bottom:4px}}\
#lv-plant .consts{width:100%;border-collapse:collapse;font-family:var(--ui);font-size:12.5px}\
#lv-plant .consts td{padding:4px 6px;border-bottom:1px dotted var(--rule2);vertical-align:top}\
#lv-plant .consts td.v{font-family:var(--mono);white-space:nowrap;text-align:right}\
#lv-plant .ans[hidden]{display:none}\
#lv-plant .vhatch{fill:none;stroke:var(--w3);stroke-width:.6;stroke-opacity:.55;stroke-dasharray:6 3}\
#lv-plant .p2-key{list-style:none;margin:8px 0 0;padding:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:2px 14px;font-family:var(--ui);font-size:13px}\
#lv-plant .p2-key li{display:flex;gap:6px;align-items:baseline;border-bottom:1px dotted var(--rule2);padding:2px 0}\
#lv-plant .p2-key b{display:inline-grid;place-items:center;width:20px;height:20px;border:1px solid var(--ink);border-radius:50%;font-size:11px;flex:none}\
#lv-plant .p2-key .num{margin-left:auto}\
#lv-plant .lf-blade{fill:url(#p2-lh);stroke:var(--ink);stroke-width:.8;stroke-linejoin:round}\
#lv-plant .lf.back .lf-blade{fill:var(--leaf3);stroke-opacity:.55}\
#lv-plant .lf.back .lf-v1,#lv-plant .lf.back .lf-v2{stroke-opacity:.35}\
#lv-plant .lf-v1{fill:none;stroke:var(--w2);stroke-width:.9;stroke-linecap:round}\
#lv-plant .lf-v2{fill:none;stroke:var(--w3);stroke-width:.55;stroke-linecap:round}\
#lv-plant .lf-v3{fill:none;stroke:var(--w3);stroke-width:.35;stroke-opacity:.7}\
#lv-plant .lf.follow .lf-blade{stroke-width:1.3}\
#lv-plant .lf.follow .lf-v1{stroke-width:1.5}\
#lv-plant .shoot{fill:none;stroke:var(--bark);stroke-linecap:round}\
#lv-plant .petiole{fill:none;stroke:var(--ink);stroke-width:1.1;stroke-linecap:round}\
#lv-plant .berry{fill:var(--leaf2);stroke:var(--ink);stroke-width:.6}\
#lv-plant .tendril{fill:none;stroke:var(--leaf3);stroke-width:.9;stroke-linecap:round}\
#lv-plant .hull{fill:var(--leaf2);stroke:var(--ink);stroke-width:.8}\
#lv-plant .rlf .lf-blade{fill:var(--leaf)}\
#lv-plant .rlf.heart .lf-blade{fill:var(--leaf2)}\
#lv-plant .rlf .lf-v2{stroke:var(--ink);stroke-opacity:.35;stroke-width:.7}\
#lv-plant .rib{fill:var(--rib);stroke:var(--ink);stroke-width:.5}\
#lv-plant .f-rib{fill:var(--rib)}\
#lv-plant .embseg{fill:none;stroke:var(--emb);stroke-width:2;stroke-linecap:round;opacity:.9}\
#lv-plant .ptc-dot.emb{fill:var(--emb);stroke:none;filter:none}\
#lv-plant use.ptc-dot{fill:none;stroke:none}\
#lv-plant .gmin{fill:none;stroke:var(--air);stroke-width:1;stroke-dasharray:1.5 2.5;opacity:.8}\
:root[data-theme="dark"] #lv-plant .lf-blade{stroke:var(--leaf3)}\
:root[data-theme="dark"] #lv-plant .lf.back .lf-blade{fill:var(--leaf2)}\
:root[data-theme="dark"] #lv-plant .lf.follow{filter:drop-shadow(0 0 3px rgba(169,184,160,.45))}\
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) #lv-plant .lf-blade{stroke:var(--leaf3)}:root:not([data-theme="light"]) #lv-plant .lf.back .lf-blade{fill:var(--leaf2)}:root:not([data-theme="light"]) #lv-plant .lf.follow{filter:drop-shadow(0 0 3px rgba(169,184,160,.45))}}\
';

  /* ------------------------------------------------------------ crop drawings (viewBox 0 0 520 600; ground at y 470)
     Each builder returns the art, the followed water path as five polylines (root, stem, petiole, leaf xylem,
     outside xylem), resistor glyph positions, the loupe, and a FLOW network: every conduit the drawing shows,
     with the leaf area it feeds, so particles can move at the local flux. */
  var GROUND = 470;
  function P2(x, y) { return [Math.round(x * 10) / 10, Math.round(y * 10) / 10]; }
  function rot(p, a) { var c = Math.cos(a), s = Math.sin(a); return [p[0] * c - p[1] * s, p[0] * s + p[1] * c]; }
  function along(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }

  /* roots: main roots, fine laterals and root hairs; every root a flow path toward the base */
  function rootSystem(cx, seed, spread) {
    var rnd = ART.rng(seed), s = '', flow = [], hairs = '';
    var mains = [
      [[cx, 472], [cx - 6, 500], [cx - 24, 524], [cx - 54, 546], [cx - 82, 564], [cx - 112 * spread, 584]],
      [[cx, 472], [cx + 6, 504], [cx + 26, 526], [cx + 52, 548], [cx + 80, 568], [cx + 114 * spread, 588]],
      [[cx - 2, 478], [cx - 6, 520], [cx - 4, 558], [cx - 10, 596]],
      [[cx + 2, 476], [cx + 22, 500], [cx + 38, 512], [cx + 58, 516]],
      [[cx - 2, 476], [cx - 22, 496], [cx - 44, 506], [cx - 70, 508]]
    ];
    mains.forEach(function (m, i) {
      s += '<path d="' + smoothD(m) + '" class="s-ink" stroke-width="' + (i < 3 ? 3 : 2.2) + '" stroke-linecap="round"/>';
      flow.push({ pts: m.slice().reverse(), flux: 0, w: i < 3 ? 3 : 2.2, kind: 'root', share: i < 3 ? 0.25 : 0.125 });
      // fine laterals off the main root, each with hairs
      for (var k = 1; k < m.length - 1; k++) {
        if (rnd() < 0.35) continue;
        var a = m[k], b = m[k + 1], dir = Math.atan2(b[1] - a[1], b[0] - a[0]) + (rnd() < 0.5 ? -1 : 1) * (0.7 + rnd() * 0.5);
        var L = 18 + rnd() * 16, mid = [a[0] + Math.cos(dir) * L * 0.5, a[1] + Math.sin(dir) * L * 0.5 + 2], tip = [a[0] + Math.cos(dir) * L, a[1] + Math.sin(dir) * L + 4];
        var fp = [P2(a[0], a[1]), P2(mid[0], mid[1]), P2(tip[0], tip[1])];
        s += '<path d="' + smoothD(fp) + '" class="s-ink" stroke-width="1.1" stroke-linecap="round"/>';
        flow.push({ pts: fp.slice().reverse(), flux: 0, w: 1.1, kind: 'fine', share: 0.02 });
        for (var h = 0; h < 6; h++) {
          var t = 0.45 + h * 0.09, q = along(fp[1], fp[2], (t - 0.45) / 0.55 * 1), hd = dir + (h % 2 ? 1.4 : -1.4);
          hairs += 'M' + f1(q[0]) + ',' + f1(q[1]) + ' l' + f1(Math.cos(hd) * 5) + ',' + f1(Math.sin(hd) * 5) + ' ';
        }
      }
    });
    s += '<path d="' + hairs + '" class="s-ink2" stroke-width=".55" stroke-linecap="round"/>';
    return { svg: s, flow: flow };
  }
  function soilBand() {
    return '<rect x="0" y="' + GROUND + '" width="520" height="130" fill="url(#p2-soil)"/>' +
      '<path d="M0,' + GROUND + ' C80,' + (GROUND - 5) + ' 140,' + (GROUND + 4) + ' 220,' + (GROUND - 2) + ' C300,' + (GROUND - 6) + ' 380,' + (GROUND + 4) + ' 520,' + (GROUND - 3) + '" class="s-ink" stroke-width="1.6"/>';
  }
  function leafUse(g, x, y, ang, cls, extra) {
    return '<g transform="translate(' + f1(x) + ',' + f1(y) + ') rotate(' + f1(ang) + ')"' + (cls ? ' class="' + cls + '"' : '') + '>' +
      '<path d="' + g.d + '" class="lf-blade"/>' + '<path d="' + g.prim + '" class="lf-v1"/>' + '<path d="' + g.sec + '" class="lf-v2"/>' + (extra || '') + '</g>';
  }
  function tf(pt, x, y, angDeg) { var q = rot(pt, angDeg * Math.PI / 180); return [x + q[0], y + q[1]]; }

  /* ---------- grapevine: VSP on a bilateral cordon ---------- */
  function buildGrape() {
    var rnd = ART.rng(41), s = '', back = '', front = '', flow = [], shootsSvg = '', fruit = '', tend = '';
    var cx = 259, headY = 300, cordY = 298;
    var R = rootSystem(cx, 11, 1);
    s += soilBand();
    var spurs = [214, 169, 124, 82, 304, 349, 394, 438];
    var NODE = 23, NN = 9, LR = 17;
    // posts, anchors and the fruiting wire (behind)
    s += '<g class="s-ink" stroke-width="1"><path d="M24,' + (GROUND + 8) + ' L54,126 M496,' + (GROUND + 8) + ' L468,126" stroke-dasharray="1 0"/></g>' +
      '<ellipse cx="24" cy="' + (GROUND + 12) + '" rx="7" ry="3" class="f-ink2"/><ellipse cx="496" cy="' + (GROUND + 12) + '" rx="7" ry="3" class="f-ink2"/>' +
      '<rect x="50" y="118" width="8" height="' + (GROUND + 6 - 118) + '" class="f-bark" stroke="var(--ink)" stroke-width="1"/>' +
      '<rect x="464" y="118" width="8" height="' + (GROUND + 6 - 118) + '" class="f-bark" stroke="var(--ink)" stroke-width="1"/>' +
      '<path d="M54,' + (cordY + 2) + ' H468" class="s-ink2" stroke-width="1"/>';
    // stake beside the trunk
    s += '<path d="M276,' + (GROUND + 8) + ' V128" stroke="var(--ink2)" stroke-width="2.4"/>';
    // trunk: tapered, graft union, head, bark fissures
    s += '<path d="M245,' + (GROUND + 2) + ' C246,440 243,410 247,380 C250,350 249,322 250,' + (headY + 2) + ' C253,' + (headY - 8) + ' 265,' + (headY - 8) + ' 268,' + (headY + 2) + ' C268,322 268,350 270,380 C273,410 271,440 273,' + (GROUND + 2) + ' Z" fill="url(#p2-bark)" stroke="var(--ink)" stroke-width="1.6"/>';
    s += '<path d="M244,446 C252,441 266,441 274,446 M244,452 C252,447 266,447 274,452" class="s-ink" stroke-width="1.3"/>';
    s += '<path d="M253,436 c1,-14 -2,-24 0,-40 M262,428 c-1,-12 2,-22 0,-34 M256,372 c1,-12 -1,-20 1,-32 M264,360 c-1,-10 1,-18 0,-28 M257,330 c1,-8 0,-14 1,-20" class="s-ink" stroke-width=".8" stroke-opacity=".6"/>';
    s += '<path d="M248,392 l30,0 M248,322 l30,0" stroke="var(--ink2)" stroke-width="1.4"/>';
    // vessel hatching: the trunk drawn as a bundle of conduits (concept A)
    s += '<path class="vhatch" d="M251,468 C250,420 252,360 253,306 M255,468 C254,420 256,360 256,304 M263,468 C264,420 262,360 262,304 M267,468 C268,420 266,360 265,306"/>';
    // cordon arms
    var armL = [[252, headY], [214, cordY + 1], [169, cordY], [124, cordY - 1], [80, cordY - 2]];
    var armR = [[266, headY], [304, cordY + 1], [349, cordY], [394, cordY - 1], [440, cordY - 2]];
    [armL, armR].forEach(function (a) {
      s += '<path d="' + smoothD(a) + '" class="s-ink" stroke-width="10" stroke-linecap="round"/><path d="' + smoothD(a) + '" class="x-bark" stroke-width="7" stroke-linecap="round"/>';
    });
    // trunk flow
    var totalLeaves = spurs.length * NN;
    flow.push({ pts: [[cx, GROUND + 2], [cx, 420], [cx, 360], [cx, headY + 4]], flux: totalLeaves, w: 20, kind: 'trunk' });
    // arm flow, segment by segment
    [armL, armR].forEach(function (a) {
      for (var k = 0; k < a.length - 1; k++) flow.push({ pts: [a[k], a[k + 1]], flux: (a.length - 1 - k) * NN, w: 7, kind: 'arm' });
    });
    var follow = null, fShoot = 5, fNode = 4;
    function isFn(si, n) { return si === fShoot && n === fNode; }
    spurs.forEach(function (sx, si) {
      var base = [sx, cordY - 4];
      s += '<path d="M' + (sx - 3) + ',' + (cordY - 2) + ' l1,-6 h4 l1,6" class="f-bark" stroke="var(--ink)" stroke-width=".9"/>';
      var amp = si === fShoot ? 0 : 2 + rnd() * 3, ph = rnd() * 6, flip = si % 2 ? 1 : -1;
      var nodes = [base];
      for (var n = 1; n <= NN; n++) nodes.push(P2(sx + amp * Math.sin(n * 0.6 + ph), cordY - 4 - NODE * n));
      var tip = P2(sx + amp * Math.sin((NN + 0.8) * 0.6 + ph), cordY - 4 - NODE * (NN + 0.8));
      shootsSvg += '<path d="' + smoothD(nodes.concat([tip])) + '" class="shoot" stroke-width="2.4"/>';
      shootsSvg += '<path d="M' + tip[0] + ',' + tip[1] + ' q-4,-6 0,-10 q5,4 0,10" class="f-leaf2" stroke="var(--ink)" stroke-width=".7"/>';
      for (n = 1; n <= NN; n++) {
        flow.push({ pts: [nodes[n - 1], nodes[n]], flux: NN - n + 1, w: 2.4, kind: 'shoot', shoot: si });
        var side = (n % 2 ? -1 : 1) * flip, nd = nodes[n];
        shootsSvg += '<circle cx="' + nd[0] + '" cy="' + nd[1] + '" r="1.7" class="f-ink"/>';
        var pl = isFn(si, n) ? 18 : 12 + rnd() * 6, pa = side * (55 + rnd() * 12) * Math.PI / 180;
        var pe = P2(nd[0] + Math.sin(pa) * pl, nd[1] - Math.cos(pa) * pl);
        var isF = si === fShoot && n === fNode;
        var lang = side * (24 + rnd() * 16);
        var layerBack = !isF && ((si + n) % 3 === 0);
        var g = ART.grapeLeaf(isF ? 40 : LR * (0.85 + rnd() * 0.3), 100 + si * 13 + n, isF ? { minor: 18 } : null);
        var pet = '<path d="M' + nd[0] + ',' + nd[1] + ' L' + pe[0] + ',' + pe[1] + '" class="petiole"/>';
        flow.push({ pts: [nd, pe], flux: 1, w: 1.2, kind: 'petiole', shoot: si, node: n });
        if (isF) {
          follow = { node: nd, pe: pe, g: g, ang: lang, pet: pet };
        } else if (layerBack) back += pet + leafUse(g, pe[0], pe[1], lang, 'lf back');
        else front += pet + leafUse(g, pe[0], pe[1], lang, 'lf');
        // opposite the leaf: clusters at nodes 3 and 4, tendrils two on one off above
        var os = -side;
        if (n === 3 || n === 4) {
          var c0 = [nd[0] + os * 5, nd[1] + 2], rx = c0[0] + os * 3;
          fruit += '<path d="M' + nd[0] + ',' + nd[1] + ' Q' + c0[0] + ',' + (nd[1] - 3) + ' ' + rx + ',' + (nd[1] + 6) + '" class="s-ink" stroke-width="1"/>';
          var rows = n === 3 ? 6 : 5;
          for (var r2 = 0; r2 < rows; r2++) {
            var cnt = Math.max(1, Math.round((rows - r2) * 0.8)), yy = nd[1] + 9 + r2 * 4.6;
            for (var b = 0; b < cnt; b++) fruit += '<circle cx="' + f1(rx + (b - (cnt - 1) / 2) * 4.4 + (r2 % 2) * 0.8) + '" cy="' + f1(yy) + '" r="2.6" class="berry"/>';
          }
        } else if (n === 6 || n === 7 || n === 9) {
          var t0 = [nd[0] + os * 3, nd[1] - 1];
          tend += '<path d="M' + nd[0] + ',' + nd[1] + ' q' + (os * 8) + ',-2 ' + (os * 12) + ',-9 q' + (os * 3) + ',-5 ' + (os * -1) + ',-7 q' + (os * -3) + ',1 ' + (os * -1) + ',4" class="tendril"/>';
        }
      }
    });
    // foliage wire pairs, drawn in front of the shoots
    var wires = '';
    [248, 192, 136].forEach(function (y) { wires += '<path d="M54,' + y + ' H468 M54,' + (y + 3) + ' H468" class="s-ink2" stroke-width=".8"/>'; });
    // the followed leaf: node 4 of the second right shoot, drawn large with every vein order
    var F = follow, fa = F.ang * Math.PI / 180;
    var Fsvg = F.pet + '<g transform="translate(' + F.pe[0] + ',' + F.pe[1] + ') rotate(' + f1(F.ang) + ')" class="lf follow"><clipPath id="p2-fclip"><path d="' + F.g.d + '"/></clipPath>' +
      '<path d="' + F.g.d + '" class="lf-blade"/><path d="' + F.g.minor + '" clip-path="url(#p2-fclip)" class="lf-v3"/><path d="' + F.g.sec + '" class="lf-v2"/><path d="' + F.g.prim + '" class="lf-v1"/></g>';
    // vein flow on the followed leaf: five primaries
    F.g.tips.forEach(function (t, i) {
      var q0 = F.pe, q1 = tf([t[0] * 0.5, t[1] * 0.5], F.pe[0], F.pe[1], F.ang), q2 = tf(t, F.pe[0], F.pe[1], F.ang);
      flow.push({ pts: [q0, P2(q1[0], q1[1]), P2(q2[0], q2[1])], flux: 0.2, w: 1, kind: 'vein' });
    });
    var top = tf(F.g.top, F.pe[0], F.pe[1], F.ang), lx = tf([F.g.top[0] * 0.62, F.g.top[1] * 0.62], F.pe[0], F.pe[1], F.ang);
    var side2 = tf(F.g.tips[1], F.pe[0], F.pe[1], F.ang);
    var oxEnd = along(lx, side2, 0.85);
    s += R.svg + back + shootsSvg + fruit + tend + wires + front + Fsvg;
    var segs = [
      [[176, 566], [204, 548], [232, 524], [252, 500], [259, 478]],
      [[259, 478], [259, 420], [259, 360], [260, 312], [270, 301], [304, 299], [340, 298], [F.node[0], cordY - 4]].concat([1, 2, 3, 4].map(function (n) { return [F.node[0], cordY - 4 - NODE * n]; })),
      [F.node, F.pe],
      [F.pe, P2(lx[0], lx[1])],
      [P2(lx[0], lx[1]), P2(oxEnd[0], oxEnd[1])]
    ];
    segs[1][segs[1].length - 1] = F.node;
    return { svg: s, flow: R.flow.concat(flow), segs: segs, rpos: [[150, 516], [196, 382], [440, 232], [300, 98], [470, 160]],
      loupe: [432, 398, 44], leafTop: Math.round(top[1]), gx: 14, gtx: 64, leaves: totalLeaves };
  }

  /* ---------- almond: open vase, three scaffolds that fork once, spur rosettes, hulls ---------- */
  function buildAlmond() {
    var rnd = ART.rng(77), s = soilBand(), flow = [], lv = '', hulls = '';
    var cx = 260, R = rootSystem(cx, 23, 1.15);
    var crotch = [cx, 372];
    var scaf = [
      { a: [[cx - 4, 372], [226, 330], [186, 284]], f: [[[186, 284], [156, 230], [124, 176]], [[186, 284], [196, 222], [204, 158]]] },
      { a: [[cx, 372], [262, 330], [258, 278]], f: [[[258, 278], [240, 214], [228, 132]], [[258, 278], [282, 214], [300, 128]]] },
      { a: [[cx + 4, 372], [300, 326], [340, 280]], f: [[[340, 280], [334, 214], [330, 150]], [[340, 280], [376, 226], [414, 172]]] }
    ];
    s += '<path d="M244,' + (GROUND + 2) + ' C247,440 246,400 248,372 L272,372 C274,400 273,440 276,' + (GROUND + 2) + ' Z" fill="url(#p2-bark)" stroke="var(--ink)" stroke-width="1.5"/>';
    s += '<path d="M252,450 c1,-14 -1,-26 0,-40 M266,446 c-1,-14 1,-24 0,-36" class="s-ink" stroke-width=".8" stroke-opacity=".6"/>';
    var wood = '', spurs = [], follow = null;
    var nSp = 0;
    scaf.forEach(function (sc, i) {
      wood += '<path d="' + smoothD(sc.a) + '" class="s-ink" stroke-width="12" stroke-linecap="round"/><path d="' + smoothD(sc.a) + '" class="x-bark" stroke-width="9" stroke-linecap="round"/>';
      sc.f.forEach(function (fk, j) {
        wood += '<path d="' + smoothD(fk) + '" class="s-ink" stroke-width="6.5" stroke-linecap="round"/><path d="' + smoothD(fk) + '" class="x-bark" stroke-width="4.2" stroke-linecap="round"/>';
        [0.35, 0.62, 0.86, 1].forEach(function (t, k) {
          var segA = t < 0.5 ? fk[0] : fk[1], segB = t < 0.5 ? fk[1] : fk[2], tt = t < 0.5 ? t / 0.5 : (t - 0.5) / 0.5;
          var p = along(segA, segB, tt);
          spurs.push({ p: P2(p[0], p[1]), fork: [i, j], k: k, n: 4 + Math.floor(rnd() * 4) });
        });
      });
    });
    // flow: trunk, scaffolds, forks (flux = spur leaves downstream)
    var leafCount = spurs.reduce(function (a, b) { return a + b.n; }, 0);
    flow.push({ pts: [[cx, GROUND + 2], [cx, 420], crotch], flux: leafCount, w: 22, kind: 'trunk' });
    scaf.forEach(function (sc, i) {
      var nS = spurs.filter(function (q) { return q.fork[0] === i; }).reduce(function (a, b) { return a + b.n; }, 0);
      flow.push({ pts: sc.a, flux: nS, w: 9, kind: 'arm' });
      sc.f.forEach(function (fk, j) {
        var nF = spurs.filter(function (q) { return q.fork[0] === i && q.fork[1] === j; }).reduce(function (a, b) { return a + b.n; }, 0);
        flow.push({ pts: fk, flux: nF, w: 4.5, kind: 'shoot', shoot: i * 2 + j });
      });
    });
    spurs.forEach(function (sp, idx) {
      var isF = sp.fork[0] === 2 && sp.fork[1] === 1 && sp.k === 1;
      var base = sp.p;
      lv += '<circle cx="' + base[0] + '" cy="' + base[1] + '" r="2.2" class="f-bark" stroke="var(--ink)" stroke-width=".7"/>';
      for (var m = 0; m < sp.n; m++) {
        var ang = -150 + (300 / (sp.n - 1)) * m + (rnd() - 0.5) * 16;
        if (isF && m === Math.floor(sp.n / 2)) { ang = 62; }
        var pl = (isF && m === Math.floor(sp.n / 2)) ? 12 : 5, a = ang * Math.PI / 180, pe = P2(base[0] + Math.sin(a) * pl, base[1] - Math.cos(a) * pl);
        var big = isF && m === Math.floor(sp.n / 2);
        var g = ART.almondLeaf(big ? 84 : 20 + rnd() * 8, big ? 9.5 : 3.4 + rnd() * 0.8, 300 + idx * 7 + m);
        var pet = '<path d="M' + base[0] + ',' + base[1] + ' L' + pe[0] + ',' + pe[1] + '" class="petiole"/>';
        flow.push({ pts: [base, pe], flux: 1, w: 1, kind: 'petiole', shoot: idx, node: m });
        var leaf = '<g transform="translate(' + pe[0] + ',' + pe[1] + ') rotate(' + f1(ang) + ')" class="lf' + (big ? ' follow' : '') + '"><path d="' + g.d + '" class="lf-blade"/><path d="' + g.mid + '" class="lf-v1"/>' + (big ? '<path d="' + g.sec + '" class="lf-v2"/>' : '') + '</g>';
        if (big) follow = { node: base, pe: pe, ang: ang, L: 84, svg: pet + leaf };
        else lv += pet + leaf;
      }
      if (sp.k === 1 || (sp.k === 2 && idx % 3 === 0)) {
        var hx = base[0] + (idx % 2 ? 5 : -5), hy = base[1] + 12;
        hulls += '<path d="M' + base[0] + ',' + base[1] + ' L' + hx + ',' + (hy - 6) + '" class="s-ink" stroke-width=".9"/>' +
          '<ellipse cx="' + hx + '" cy="' + hy + '" rx="5.6" ry="7.4" class="hull" transform="rotate(' + (idx % 2 ? -12 : 12) + ' ' + hx + ' ' + hy + ')"/>' +
          '<path d="M' + (hx - 0.5) + ',' + (hy - 6.5) + ' Q' + (hx + 2.4) + ',' + hy + ' ' + (hx - 0.5) + ',' + (hy + 6.8) + '" class="s-ink" stroke-width=".7"/>';
      }
    });
    var F = follow, fa = F.ang;
    var lx = tf([0, -F.L * 0.42], F.pe[0], F.pe[1], fa), tipp = tf([0, -F.L], F.pe[0], F.pe[1], fa), oxE = tf([10, -F.L * 0.78], F.pe[0], F.pe[1], fa);
    flow.push({ pts: [F.pe, P2(lx[0], lx[1]), P2(tipp[0], tipp[1])], flux: 0.5, w: 1, kind: 'vein' });
    s += R.svg + wood + lv + hulls + F.svg;
    var fk = scaf[2].f[1];
    var segs = [
      [[178, 568], [206, 550], [234, 526], [254, 500], [260, 478]],
      [[260, 478], [260, 420], [262, 372], [300, 326], [340, 280], F.node],
      [F.node, F.pe],
      [F.pe, P2(lx[0], lx[1])],
      [P2(lx[0], lx[1]), P2(oxE[0], oxE[1])]
    ];
    return { svg: s, flow: R.flow.concat(flow), segs: segs, rpos: [[150, 518], [196, 400], [474, 236], [330, 92], [476, 136]],
      loupe: [452, 330, 42], leafTop: Math.round(Math.min(tipp[1], 130)), gx: 28, leaves: leafCount };
  }

  /* ---------- romaine: an upright oblong head, savoyed obovate leaves, white midribs, short core ---------- */
  var ROM = [ // x of base, angle, length, half width, layer, seed
    [262, -2, 322, 28, 'heart', 1], [256, 3, 306, 27, 'heart', 2],
    [252, -5, 300, 38, 'mid', 3], [270, 6, 296, 38, 'mid', 4],
    [246, -8, 272, 42, 'outer', 5], [278, 9, 266, 42, 'outer', 6],
    [242, -11, 238, 42, 'outer', 7], [264, -3, 248, 40, 'outer', 8]
  ];
  var ROMF = [274, 9, 244, 42, 'follow', 9];
  function buildRomaine() {
    var s = soilBand(), flow = [], lv = '';
    var cx = 260, R = rootSystem(cx, 31, 0.9);
    var coreTop = [cx, 446];
    // short butt above the soil
    s += R.svg + '<path d="M250,' + (GROUND + 4) + ' L252,460 L268,460 L270,' + (GROUND + 4) + ' Z" class="f-rib" stroke="var(--ink)" stroke-width="1"/>';
    var total = 0;
    ROM.concat([ROMF]).forEach(function (r, ri) {
      var g = ART.romaineLeaf(r[2], r[3], r[5], { rib: r[4] === 'heart' ? 0.2 : 0.17 });
      var cls = r[4] === 'heart' ? 'rlf heart' : 'rlf';
      var area = r[2] * r[3] / 1000;
      total += area;
      var by = 464;
      var body = '<g transform="translate(' + r[0] + ',' + by + ') rotate(' + r[1] + ')" class="' + cls + (r[4] === 'follow' ? ' follow' : '') + '"><path d="' + g.d + '" class="lf-blade"/>' +
        '<path d="' + g.sec + '" class="lf-v2"/><path d="' + g.rib + '" class="rib"/></g>';
      lv += body;
      var a = r[1], tip = tf([0, -r[2] * 0.95], r[0], by, a), mid = tf([0, -r[2] * 0.5], r[0], by, a), b0 = tf([0, -r[2] * 0.08], r[0], by, a);
      flow.push({ pts: [coreTop, P2(b0[0], b0[1])], flux: area, w: 6, kind: 'petiole', shoot: r[5] });
      if (ri >= ROM.length - 1) flow.push({ pts: [P2(b0[0], b0[1]), P2(mid[0], mid[1]), P2(tip[0], tip[1])], flux: area * 0.8, w: r[3] * 0.17 * 2, kind: 'vein' });
      if (r[4] === 'follow') {
        for (var i = 2; i <= 6; i++) {
          var tt = 0.1 + i * 0.11, y = -r[2] * tt, ww = r[3] * 0.8;
          var q0 = tf([0, y], r[0], by, a), q1 = tf([ww, y - r[2] * 0.1], r[0], by, a);
          flow.push({ pts: [P2(q0[0], q0[1]), P2(q1[0], q1[1])], flux: area * 0.08, w: 1, kind: 'vein' });
        }
      }
    });
    flow.push({ pts: [[cx, GROUND + 4], coreTop], flux: total, w: 16, kind: 'trunk' });
    s += lv;
    var a = ROMF[1], x0 = ROMF[0], y0 = 464, L = ROMF[2];
    var p1 = tf([0, -L * 0.14], x0, y0, a), p2 = tf([0, -L * 0.58], x0, y0, a), p3 = tf([ROMF[3] * 0.85, -L * 0.7], x0, y0, a);
    var segs = [
      [[204, 560], [222, 540], [240, 516], [254, 494], [260, 478]],
      [[260, 478], [260, 462], coreTop],
      [coreTop, P2(p1[0], p1[1])],
      [P2(p1[0], p1[1]), P2(p2[0], p2[1])],
      [P2(p2[0], p2[1]), P2(p3[0], p3[1])]
    ];
    // inner leaves label outside the head, with a leader
    s += '<path d="M262,190 L180,128" class="lead"/><text x="176" y="122" text-anchor="end" font-size="12" class="t2 sc halo">inner leaves</text>';
    return { svg: s, flow: R.flow.concat(flow), segs: segs, rpos: [[150, 528], [170, 424], [404, 452], [420, 340], [430, 250]],
      loupe: [430, 140, 44], leafTop: Math.round(p2[1]), gx: 28, leaves: total };
  }
  var BUILD = { grape: buildGrape, almond: buildAlmond, romaine: buildRomaine };
  var GEO = {};
  function geo(crop) { if (!GEO[crop]) GEO[crop] = BUILD[crop](); return GEO[crop]; }
  var CROPLATIN = { grape: 'Vitis vinifera L., vertical shoot positioned on a bilateral cordon', almond: 'Prunus dulcis (Mill.) D.A. Webb, open vase', romaine: 'Lactuca sativa L., romaine type' };
  var SEGNAME = ['root', 'stem', 'petiole', 'leafX', 'ox'];
  var SEGLAB = { root: ['R', 'root'], stem: ['R', 'stem'], petiole: ['R', 'petiole'], leafX: ['R', 'leaf xylem'], ox: ['R', 'outside xylem'] };
  var SEGLAB_ROM = { stem: ['R', 'core'], petiole: ['R', 'midrib base'] };

  function defs() {
    return '<defs>' +
      '<pattern id="p2-soil" width="18" height="14" patternUnits="userSpaceOnUse"><rect width="18" height="14" class="f-soil"/><circle cx="3" cy="3" r="1" class="f-ink2"/><circle cx="12" cy="9" r="1.2" class="f-ink2"/><circle cx="8" cy="12" r=".8" class="f-ink2"/><path d="M0,7 h5 M10,4 h4" class="s-rule" stroke-width=".6"/></pattern>' +
      '<pattern id="p2-bark" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(80)"><rect width="6" height="6" class="f-bark"/><path d="M0,3 H6" stroke="var(--ink)" stroke-opacity=".35" stroke-width="1"/></pattern>' +
      '<pattern id="p2-lh" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)"><rect width="4" height="4" class="f-leaf"/><path d="M0,2 H4" stroke="var(--ink)" stroke-opacity=".3" stroke-width=".7"/></pattern>' +
      '<marker id="p2-ar" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L8,4 L0,8z" fill="var(--ink2)"/></marker>' +
      '<marker id="p2-arw" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L8,4 L0,8z" fill="var(--warm)"/></marker>' +
      '</defs>';
  }


  /* ------------------------------------------------------------ geometry helpers */
  function polyD(pts) { return 'M' + pts.map(function (p) { return p[0] + ',' + p[1]; }).join(' L'); }
  function smoothD(pts) {
    if (pts.length < 3) return polyD(pts);
    var d = 'M' + pts[0][0] + ',' + pts[0][1];
    for (var i = 1; i < pts.length - 1; i++) {
      var mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
      d += ' Q' + pts[i][0] + ',' + pts[i][1] + ' ' + mx + ',' + my;
    }
    var l = pts[pts.length - 1];
    return d + ' L' + l[0] + ',' + l[1];
  }
  function midPt(pts) {
    var L = 0, i, seg = [];
    for (i = 1; i < pts.length; i++) { var d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); L += d; }
    var h = L / 2;
    for (i = 0; i < seg.length; i++) {
      if (h <= seg[i]) { var t = h / seg[i]; return [pts[i][0] + t * (pts[i + 1][0] - pts[i][0]), pts[i][1] + t * (pts[i + 1][1] - pts[i][1])]; }
      h -= seg[i];
    }
    return pts[pts.length - 1];
  }
  function resistor(x, y, s, cls, label, sub) {
    var w = 30 * s, h = 12 * s, n = 6, zz = '';
    for (var i = 0; i <= n; i++) zz += (i ? ' L' : 'M') + (x - w / 2 + 3 + (w - 6) * i / n).toFixed(1) + ',' + (y + (i === 0 || i === n ? 0 : (i % 2 ? -h / 2 + 2 : h / 2 - 2))).toFixed(1);
    return '<g class="res ' + (cls || '') + '"><rect class="res-body" x="' + (x - w / 2).toFixed(1) + '" y="' + (y - h / 2).toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + h.toFixed(1) + '" rx="2"/>' +
      '<path class="res-zig" d="' + zz + '"/>' +
      '<text x="' + x + '" y="' + (y + h / 2 + 13).toFixed(1) + '" text-anchor="middle" font-size="15" font-style="italic" class="halo">' + label + '<tspan font-size="9" dy="3">' + sub + '</tspan></text></g>';
  }

  /* ------------------------------------------------------------ series experiment maths */
  function solveOver(st, over) {
    var M = WP.model, VPD = M.vpd(st.T, st.RH), c = WP.params.crops[st.crop];
    var grav = WP.params.phys.rhoG.v * c.height.v;
    function Eat(x) { return M.E(M.gs(st, x), VPD); }
    function F(x) { return x - M.chain(st, Eat(x), over).psi.leafOut; }
    var hi = st.soilPsi - grav, lo = -12, x, it = 0;
    if (F(hi) <= 1e-12) x = hi;
    else {
      while (hi - lo > 1e-6 && it < 200) { x = 0.5 * (lo + hi); it++; if (F(x) > 0) hi = x; else lo = x; }
      x = 0.5 * (lo + hi);
    }
    var E = Eat(x), ch = M.chain(st, E, over);
    return { psi: ch.psi, E: E, gs: M.gs(st, x), R: ch.R };
  }
  function expStates(st, res) {
    var over = { bs: 2 * res.R.bs, mes: 2 * res.R.mes };
    var fixed = WP.model.chain(st, res.E, over);
    var resp = solveOver(st, over);
    return {
      base: { psi: res.psi, E: res.E, gs: res.gs, R: res.R },
      fixed: { psi: fixed.psi, E: res.E, gs: res.gs, R: fixed.R },
      resp: resp
    };
  }

  /* ------------------------------------------------------------ plant SVG */
  function renderPlant(st, res, X) {
    var C = geo(st.crop), crop = st.crop;
    var R = (X && exp >= 1) ? X[exp === 1 ? 'fixed' : 'resp'].R : res.R;
    var P = (X && exp >= 1) ? X[exp === 1 ? 'fixed' : 'resp'].psi : res.psi;
    var E = (X && exp === 2) ? X.resp.E : res.E;
    var gs = (X && exp === 2) ? X.resp.gs : res.gs;
    var Rtot = R.root + R.stem + R.petiole + R.leafX + R.ox;
    var nodes = [P.soil, P.root, P.stem, P.petiole, P.leafX, P.leafOut];
    var s = '';
    // water path: ink casing then a segment per organ coloured by its mean Ψ
    var all = [];
    C.segs.forEach(function (seg, i) { all = all.concat(i ? seg.slice(1) : seg); });
    s += '<path class="wcase" d="' + smoothD(all) + '" stroke-width="7.5"/>';
    C.segs.forEach(function (seg, i) {
      var mean = (nodes[i] + nodes[i + 1]) / 2;
      s += '<path class="wline" d="' + smoothD(seg) + '" stroke="' + ui.water(mean) + '" stroke-width="5"/>';
    });
    s += '<g id="p2-ptc"></g>';
    // resistor glyphs, size by share of total resistance
    C.segs.forEach(function (seg, i) {
      var nm = SEGNAME[i], r = R[nm], m = midPt(seg), p = C.rpos[i];
      var sc = clamp(0.62 + 2.3 * r / Rtot, 0.62, 2.4);
      s += '<path class="lead" d="M' + m[0].toFixed(1) + ',' + m[1].toFixed(1) + ' L' + p[0] + ',' + p[1] + '"/>';
      var lab = (crop === 'romaine' && SEGLAB_ROM[nm]) || SEGLAB[nm];
      s += resistor(p[0], p[1], sc, nm === 'ox' ? 'res-ox' : '', lab[0], lab[1]);
    });
    // gravity bar
    var top = C.leafTop;
    var gx = C.gx || 28, gt = C.gtx || gx + 16;
    s += '<g class="tier-2"><path d="M' + gx + ',' + (GROUND - 2) + ' V' + (top + 4) + '" class="s-ink2" stroke-width="1" marker-start="url(#p2-ar)" marker-end="url(#p2-ar)"/>' +
      '<path d="M' + (gx - 6) + ',' + GROUND + ' H' + (gx + 6) + ' M' + (gx - 6) + ',' + top + ' H' + (gx + 6) + '" class="s-ink2" stroke-width="1"/>' +
      '<text x="' + gt + '" y="' + (GROUND - 46) + '" font-size="13" font-style="italic" class="halo">h ' + num(WP.params.crops[crop].height.v, 2) + ' m</text>' +
      '<text x="' + gt + '" y="' + (GROUND - 30) + '" font-size="12" class="t2 tm halo">ρ g h ' + num(res.grav, 3) + '</text>' +
      '<text x="' + gt + '" y="' + (GROUND - 16) + '" font-size="12" class="t2 tm halo">MPa</text></g>';
    // loupe on a stoma: aperture by gs ÷ gsMax
    var L = C.loupe, lx = L[0], ly = L[1], lr = L[2];
    var open = clamp(gs / res.gsMax, 0, 1);
    var ap = 1 + 7.5 * open;
    var tail = C.segs[4][C.segs[4].length - 1];
    s += '<path d="M' + tail[0] + ',' + tail[1] + ' L' + (lx + (tail[0] - lx) * (lr + 2) / Math.hypot(tail[0] - lx, tail[1] - ly)).toFixed(1) + ',' + (ly + (tail[1] - ly) * (lr + 2) / Math.hypot(tail[0] - lx, tail[1] - ly)).toFixed(1) + '" class="s-ink2" stroke-width=".9" stroke-dasharray="3 3"/>';
    s += '<circle cx="' + lx + '" cy="' + ly + '" r="' + (lr + 3) + '" class="f-ink"/><circle cx="' + lx + '" cy="' + ly + '" r="' + lr + '" class="f-wall" stroke="var(--paper)" stroke-width="1.5"/>';
    s += '<g stroke="var(--ink2)" stroke-width="1" fill="none"><path d="M' + (lx - 44) + ',' + (ly - 14) + ' C' + (lx - 30) + ',' + (ly - 22) + ' ' + (lx - 20) + ',' + (ly - 26) + ' ' + (lx - 10) + ',' + (ly - 16) + ' M' + (lx + 12) + ',' + (ly - 16) + ' C' + (lx + 22) + ',' + (ly - 26) + ' ' + (lx + 34) + ',' + (ly - 24) + ' ' + (lx + 44) + ',' + (ly - 12) + ' M' + (lx - 44) + ',' + (ly + 18) + ' C' + (lx - 30) + ',' + (ly + 26) + ' ' + (lx - 18) + ',' + (ly + 28) + ' ' + (lx - 10) + ',' + (ly + 18) + ' M' + (lx + 12) + ',' + (ly + 18) + ' C' + (lx + 22) + ',' + (ly + 30) + ' ' + (lx + 36) + ',' + (ly + 26) + ' ' + (lx + 44) + ',' + (ly + 14) + '"/></g>';
    var gy = 19;
    s += '<path d="M' + lx + ',' + (ly - gy) + ' C' + (lx - 18 - ap) + ',' + (ly - gy + 2) + ' ' + (lx - 18 - ap) + ',' + (ly + gy - 2) + ' ' + lx + ',' + (ly + gy) + ' C' + (lx - ap) + ',' + (ly + 8) + ' ' + (lx - ap) + ',' + (ly - 8) + ' ' + lx + ',' + (ly - gy) + 'Z" class="f-leaf2" stroke="var(--ink)" stroke-width="1.2"/>';
    s += '<path d="M' + lx + ',' + (ly - gy) + ' C' + (lx + 18 + ap) + ',' + (ly - gy + 2) + ' ' + (lx + 18 + ap) + ',' + (ly + gy - 2) + ' ' + lx + ',' + (ly + gy) + ' C' + (lx + ap) + ',' + (ly + 8) + ' ' + (lx + ap) + ',' + (ly - 8) + ' ' + lx + ',' + (ly - gy) + 'Z" class="f-leaf2" stroke="var(--ink)" stroke-width="1.2"/>';
    s += '<ellipse cx="' + lx + '" cy="' + ly + '" rx="' + Math.max(0.6, ap - 0.5).toFixed(2) + '" ry="' + (gy - 4) + '" class="f-air"/>';
    var nv = Math.round(clamp(E / 1.2, 0, 5));
    for (var v = 0; v < nv; v++) {
      var ox = lx + (v - (nv - 1) / 2) * 7, oy = ly - gy - 4;
      s += '<path class="vap" d="M' + ox + ',' + oy + ' c4,-5 -4,-9 0,-14 c4,-5 -4,-8 0,-12" opacity="' + (0.9 - v * 0.08) + '"/>';
    }
    // cuticular loss: faint wisps through the cuticle beside the pore, present even with the stoma shut
    var gmo = clamp(0.25 + res.VPD / 5, 0.25, 0.85).toFixed(2);
    [-30, 30].forEach(function (dx) { s += '<path class="gmin" opacity="' + gmo + '" d="M' + (lx + dx) + ',' + (ly - 24) + ' c3,-4 -3,-7 0,-11 c3,-4 -3,-6 0,-9"/>'; });
    s += '<text x="' + (lx + lr + 4) + '" y="' + (ly - lr + 10) + '" font-size="10.5" class="t2 tui halo tier-3">cuticle, g<tspan baseline-shift="sub" font-size="8">min</tspan></text>';
    s += '<text x="' + lx + '" y="' + (ly + lr + 18) + '" text-anchor="middle" font-size="12" class="t2 sc halo">stoma, g<tspan baseline-shift="sub" font-size="9">s</tspan> ' + Math.round(open * 100) + ' % of max</text>';
    // air label
    s += '<text x="' + (lx) + '" y="' + (ly - lr - 10) + '" text-anchor="middle" font-size="12" class="tm halo">Ψair ' + psi(res.psiAir, 0) + '</text>';
    // node numbers on the path
    var nodePts = [C.segs[0][0], C.segs[1][0], C.segs[2][0], C.segs[3][0], C.segs[4][0], C.segs[4][C.segs[4].length - 1]];
    nodePts.forEach(function (p, i) {
      s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="8.5" class="f-paper" stroke="var(--ink)" stroke-width="1"/><text x="' + p[0] + '" y="' + (p[1] + 4) + '" text-anchor="middle" font-size="11" class="tui" font-weight="600">' + (i + 1) + '</text>';
    });
    return s;
  }

  /* ------------------------------------------------------------ staircase SVG */
  var NODES = [['soil', 'soil'], ['root', 'root'], ['stem', 'stem'], ['petiole', 'petiole'], ['leafX', 'leaf xylem'], ['leafOut', 'outside xylem']];
  var RISER = ['root', 'stem', 'petiole', 'leafX', 'ox'];
  function niceStep(span) { return span <= 1.25 ? 0.25 : (span <= 3 ? 0.5 : 1); }
  /* Terraces climb with the plant: soil at the bottom left, air at the top right above an axis break.
     Y(ψ) = bot − ((−ψ) ÷ span) · H, so a more negative Ψ sits higher, the way water rises. */
  var STAIR = { W: 560, top: 132, bot: 380, x0: 74, tw: 54, step: 67, airY: 66 };
  function renderStair(st, res, X) {
    var W = STAIR.W, top = STAIR.top, bot = STAIR.bot, x0 = STAIR.x0, tw = STAIR.tw, step = STAIR.step;
    var cur = res.psi, ghost = null, mid = null;
    if (X && exp === 1) { cur = X.fixed.psi; ghost = X.base.psi; }
    if (X && exp === 2) { cur = X.resp.psi; ghost = X.base.psi; mid = X.fixed.psi; }
    var vals = [];
    [cur, ghost, mid].forEach(function (p) { if (p) NODES.forEach(function (n) { vals.push(p[n[0]]); }); });
    var lo = Math.min.apply(null, vals);
    var stp = niceStep(-lo * 1.1);
    var yMin = Math.min(-stp * 2, Math.floor(lo * 1.08 / stp) * stp);
    var span = -yMin, H = bot - top;
    function Y(v) { return bot - ((-v) / span) * H; }
    var s = '';
    s += '<text x="' + x0 + '" y="24" font-size="15" class="sc">Ψ terraces, MPa</text>';
    s += '<text x="' + (W - 10) + '" y="24" font-size="12" text-anchor="end" font-style="italic" class="t2">' + esc(WP.params.crops[st.crop].label) + ', ' + WP.fmt.hour(st.hour) + '</text>';
    // axis title, rotated, reading upward
    s += '<text x="4" y="44" font-size="12" class="t2 tui">Ψ in MPa: drier, more negative ↑</text>';
    // axis with a break between the plant scale and the air
    var ax0 = x0 - 14;
    s += '<path class="axis" d="M' + ax0 + ',' + (bot + 6) + ' V' + (top - 10) + ' M' + ax0 + ',' + (top - 30) + ' V' + (STAIR.airY - 12) + '"/>';
    s += '<path class="axis" d="M' + (ax0 - 8) + ',' + (top - 12) + ' L' + (ax0 + 8) + ',' + (top - 20) + ' M' + (ax0 - 8) + ',' + (top - 22) + ' L' + (ax0 + 8) + ',' + (top - 30) + '"/>';
    for (var v = 0; v >= yMin - 1e-9; v -= stp) {
      var y = Y(v);
      s += '<path class="grid" d="M' + ax0 + ',' + y.toFixed(1) + ' H' + (W - 40) + '"/>';
      s += '<path class="axis" d="M' + (ax0 - 6) + ',' + y.toFixed(1) + ' H' + ax0 + '"/>';
      s += '<text x="' + (ax0 - 8) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="end" font-size="12.5" class="tm t2">' + num(v, 2) + '</text>';
    }
    s += '<text x="' + (ax0 - 8) + '" y="' + (STAIR.airY + 4) + '" text-anchor="end" font-size="12.5" class="tm t2">' + num(res.psiAir, 0) + '</text>';
    s += '<path class="axis" d="M' + (ax0 - 6) + ',' + STAIR.airY + ' H' + ax0 + '"/>';
    // the upward arrow: water rises, Ψ falls
    var arX = W - 22;
    s += '<path d="M' + arX + ',' + (bot - 4) + ' V' + (top + 6) + '" stroke="var(--w2)" stroke-width="2.2" fill="none" marker-end="url(#p2-aru)"/>';
    s += '<text transform="translate(' + (arX + 14) + ',' + ((top + bot) / 2) + ') rotate(-90)" text-anchor="middle" font-size="12.5" class="tui"><tspan font-weight="600">water rises</tspan><tspan class="t2">  ·  Ψ more negative</tspan></text>';
    function treadsOutline(p, cls) {
      var o = '';
      NODES.forEach(function (n, i) { o += '<rect class="' + cls + '" x="' + (x0 + i * step) + '" y="' + (Y(p[n[0]]) - 6).toFixed(1) + '" width="' + tw + '" height="12"/>'; });
      return o;
    }
    // risers as resistors between treads: from the top of one tread up to the next
    var Rsrc = (X && exp === 1) ? X.fixed.R : ((X && exp === 2) ? X.resp.R : res.R);
    var Rtot = Rsrc.root + Rsrc.stem + Rsrc.petiole + Rsrc.leafX + Rsrc.ox;
    for (var i = 0; i < 5; i++) {
      var ya = Y(cur[NODES[i][0]]) - 6, yb = Y(cur[NODES[i + 1][0]]) + 6, xr = x0 + i * step + tw + 7;
      var amp = clamp(3 + 8 * Rsrc[RISER[i]] / Rtot, 3, 10);
      var d = 'M' + (x0 + i * step + tw) + ',' + (ya + 6).toFixed(1) + ' H' + xr;
      if (ya - yb > 18) {
        var z0 = ya - 4, z1 = yb + 4, nz = 6, zz = '';
        for (var k = 0; k <= nz; k++) zz += ' L' + (xr + (k === 0 || k === nz ? 0 : (k % 2 ? amp : -amp))).toFixed(1) + ',' + (z0 + (z1 - z0) * k / nz).toFixed(1);
        d += ' V' + z0.toFixed(1) + zz + ' V' + (yb - 6).toFixed(1);
      } else d += ' V' + (yb - 6).toFixed(1);
      d += ' H' + (x0 + (i + 1) * step);
      var hot = RISER[i] === 'ox' && exp >= 1;
      s += '<path class="riser" d="' + d + '" fill="none" stroke="' + (hot ? 'var(--warm)' : 'var(--ink)') + '" stroke-width="' + (hot ? 1.8 : 1.2) + '" stroke-linejoin="round"/>';
    }
    if (mid) s += treadsOutline(mid, 'mid');
    if (ghost) {
      s += treadsOutline(ghost, 'ghost');
      NODES.forEach(function (n, i) {
        var a = Y(ghost[n[0]]), b = Y(cur[n[0]]);
        if (Math.abs(a - b) > 20) s += '<path class="mv" d="M' + (x0 + i * step + tw / 2) + ',' + (a + (b > a ? 7 : -7)).toFixed(1) + ' V' + (b + (b > a ? -8 : 8)).toFixed(1) + '" marker-end="url(#p2-arw)"/>';
      });
    }
    // names under the floor, resistor labels between
    var NM = st.crop === 'romaine' ? ['soil', 'root', 'core', 'midrib base', 'leaf xylem', 'outside xylem'] : NODES.map(function (n) { return n[1]; });
    NODES.forEach(function (n, i) {
      var x = x0 + i * step + tw / 2, nm = NM[i];
      s += '<text x="' + x + '" y="' + (bot + 24) + '" text-anchor="middle" font-size="12.5" class="t2 sc"><tspan font-weight="700">' + (i + 1) + '</tspan> ' + esc(nm.split(' ')[0]) + '</text>';
      if (nm.indexOf(' ') > 0) s += '<text x="' + x + '" y="' + (bot + 38) + '" text-anchor="middle" font-size="12.5" class="t2 sc">' + esc(nm.split(' ').slice(1).join(' ')) + '</text>';
    });
    var RL = ['root', 'stem', 'pet', 'x', 'ox'];
    for (i = 0; i < 5; i++) {
      var xr2 = x0 + i * step + tw + 7;
      s += '<text x="' + xr2 + '" y="' + (bot + 58) + '" text-anchor="middle" font-size="13.5" font-style="italic"' + (RISER[i] === 'ox' && exp >= 1 ? ' style="fill:var(--warm)"' : '') + '>R<tspan font-size="8.5" dy="3">' + RL[i] + '</tspan></text>';
    }
    // air terrace at the top right, above the break
    var axL = x0 + 5 * step + tw + 14, ay = STAIR.airY;
    s += '<rect class="tread" x="' + axL + '" y="' + (ay - 6) + '" width="' + (W - 46 - axL) + '" height="12" style="fill:var(--air)"/>';
    s += '<text x="' + (axL + (W - 46 - axL) / 2) + '" y="' + (ay - 11) + '" text-anchor="middle" font-size="15" font-weight="600" class="tm">' + num(res.psiAir, 0) + '</text>';
    s += '<text x="' + (axL - 6) + '" y="' + (ay + 4) + '" text-anchor="end" font-size="12.5" class="t2 sc"><tspan font-weight="700">7</tspan> air</text>';
    s += '<path d="M' + (x0 + 5 * step + tw) + ',' + (Y(cur.leafOut) - 6).toFixed(1) + ' H' + (axL + 4) + ' V' + (ay + 6) + '" fill="none" stroke="var(--ink)" stroke-dasharray="2 3" stroke-width="1"/>';
    s += '<text x="' + x0 + '" y="' + (bot + 84) + '" font-size="13.5" font-style="italic" class="t2">The axis breaks: the climb from leaf to air is about ' + Math.round(res.airRatio) + ' times</text>';
    s += '<text x="' + x0 + '" y="' + (bot + 104) + '" font-size="13.5" font-style="italic" class="t2">all the steps inside the plant together. The stomata hold it back.</text>';
    // live treads, drawn into persistent groups so they glide (see placeTreads)
    var treads = NODES.map(function (n, i) {
      var val = cur[n[0]], y = Y(val), ly = y;
      if (ghost) ly = Math.min(ly, Y(ghost[n[0]]));
      if (mid) ly = Math.min(ly, Y(mid[n[0]]));
      return { x: x0 + i * step, y: y, ly: ly, val: val };
    });
    return { svg: s, h: bot + 110, treads: treads };
  }
  function placeTreads(host, treads) {
    var g = host.querySelector('#p2-treads');
    if (!g) return;
    if (g.childNodes.length !== treads.length) {
      g.innerHTML = treads.map(function () { return '<g class="tr-g"><rect class="tread" x="0" y="-6" width="' + STAIR.tw + '" height="12"/><text class="tm tr-v" x="' + (STAIR.tw / 2) + '" text-anchor="middle" font-size="15" font-weight="600"></text></g>'; }).join('');
    }
    treads.forEach(function (t, i) {
      var gi = g.childNodes[i];
      gi.style.transform = 'translate(' + t.x + 'px,' + t.y.toFixed(1) + 'px)';
      gi.firstChild.setAttribute('fill', ui.water(t.val));
      var tx = gi.lastChild;
      tx.setAttribute('y', (t.ly - t.y - 11).toFixed(1));
      tx.textContent = num(t.val, 2);
    });
    stairFlow(host, treads);
  }
  /* r7 unifier: water molecules walk the terraces (mol.js template): along each tread and up each resistor riser,
     at a speed set by the model E (10 viewBox units s⁻¹ per mmol m⁻² s⁻¹, drawing scale ILLUSTRATIVE). */
  var SF = null;
  function stairFlow(host, treads) {
    var MS = WP.molsvg, svg = host && (host.tagName === 'svg' ? host : host.querySelector('svg')); if (!MS || !MS.flow || !svg || !treads.length) return;
    var NSs = 'http://www.w3.org/2000/svg', pth = svg.querySelector('#p2-tpath');
    if (!SF) {
      pth = document.createElementNS(NSs, 'path'); pth.setAttribute('id', 'p2-tpath'); pth.setAttribute('fill', 'none'); pth.setAttribute('stroke', 'none');
      var g = document.createElementNS(NSs, 'g'); g.setAttribute('id', 'p2-smol'); g.setAttribute('pointer-events', 'none');
      svg.appendChild(pth); svg.appendChild(g); SF = MS.flow(svg, g, ui.reducedMotion);
      ui.onPrefs(function () { SF.run(); });
    }
    var tw = STAIR.tw, d = '';
    treads.forEach(function (t, i) { d += (i ? ' L' : 'M') + (t.x + 6) + ',' + (t.y).toFixed(1) + ' L' + (t.x + tw - 6) + ',' + (t.y).toFixed(1); });
    pth.setAttribute('d', d);
    var E = WP.result ? WP.result.E : 1;
    SF.set([{ el: pth, v: Math.max(2, Math.min(45, 10 * E)), gap: 34, s: 1.3 }]);
  }

  /* ------------------------------------------------------------ captions */
  function nowText(st, res, X) {
    var crop = WP.params.crops[st.crop].label.toLowerCase();
    var sto = ui.stomata(res);
    var t;
    if (exp === 1 && X) {
      t = 'You doubled the resistance outside the xylem and held the flow fixed. Only the last step got deeper: the leaf outside the xylem fell from ' + psi(X.base.psi.leafOut) + ' to ' + psi(X.fixed.psi.leafOut) + '. Root, stem and leaf xylem did not move.';
    } else if (exp === 2 && X) {
      t = 'The drier leaf told the stomata to close a little, so the flow fell from ' + WP.fmt.u(X.base.E, 2, 'mmol m⁻² s⁻¹') + ' to ' + WP.fmt.u(X.resp.E, 2, 'mmol m⁻² s⁻¹') + '. With less flow every step inside the plant got shallower: root, stem and leaf xylem all became less negative.';
    } else if (st.ppfd <= 0) {
      t = 'It is dark, so the stomata are mostly shut. Water still leaves through the cuticle and through stomata that do not close fully (' + WP.fmt.u(res.E, 2, 'mmol m⁻² s⁻¹') + '), so every part of the ' + crop + ' sits close to the soil value less the small gravity term.';
    } else {
      t = 'Water is climbing the ' + crop + ' at ' + WP.fmt.u(res.E, 2, 'mmol m⁻² s⁻¹') + ', pulled by air that is far drier than the leaf. Each organ sits one terrace higher, Ψ falling from ' + psi(res.psi.soil) + ' in the soil to ' + psi(res.psi.leafOut) + ' in the leaf, with ' + sto.text + (sto.cause ? ' ' + sto.cause : '') + '.';
    }
    return t;
  }

  /* ------------------------------------------------------------ mount */
  function stepBtn(n, label) { return '<button type="button" class="btn small" data-exp="' + n + '" aria-pressed="false">' + label + '</button>'; }

  function mount(el) {
    ui = WP.ui;
    root = el;
    var st0 = document.createElement('style'); st0.textContent = CSS; el.appendChild(st0);
    var wrap = document.createElement('div');
    wrap.innerHTML =
      '<div class="p2-hero" data-r="hero" style="min-height:440px"></div>' +
      '<p class="p2-now" aria-live="polite"><span class="k">What is happening</span><span id="p2-now"></span></p>' +
      '<div class="p2-grid">' +
        '<figure class="fig"><div class="fighead"><h3>The plant as one circuit</h3><p id="p2-latin"></p></div>' +
          '<svg class="p2-svg" id="p2-plant" viewBox="0 0 520 600" role="img" aria-labelledby="p2-plant-t"><title id="p2-plant-t">The plant drawn as a hydraulic circuit</title>' + defs() + '<g id="p2-art"></g><g id="p2-dyn"></g></svg>' +
          '<ol class="p2-key" id="p2-key" aria-label="Key to the plate"></ol>' +
          '<figcaption class="p2-cap ev-host"><b>Read the drawing.</b> The blue line is the water path, numbered 1 to 6 from soil to the end of the path outside the xylem; its ink darkens toward 0 MPa and pales as the tension rises. Water molecules (red oxygen, two white hydrogens) move through every root, shoot, petiole and vein at a speed set by the local flow (E × the leaf area that conduit feeds) ÷ its drawn width; they slow as the stomata close, and a conduit filled with air (charcoal) holds only gas bubbles. Faint wisps beside the pore are water leaving through the cuticle. Each box is a resistance, drawn larger when it holds a larger share of the total. ' + ev('l2.split') + '</figcaption>' +
        '</figure>' +
        '<figure class="fig"><div class="fighead"><h3>The water potential terraces</h3><p>Soil at the bottom, air at the top: each terrace is a place on the path, each riser a resistance</p></div>' +
          '<svg class="p2-svg" id="p2-stair" viewBox="0 0 560 490" role="img" aria-labelledby="p2-stair-t"><title id="p2-stair-t">Water potential terraces climbing from soil to air</title><defs><marker id="p2-arw2" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L8,4 L0,8z" fill="var(--warm)"/></marker><marker id="p2-aru" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto"><path d="M0,0 L8,4 L0,8z" fill="var(--w2)"/></marker></defs><g id="p2-st"></g><g id="p2-treads"></g></svg>' +
          '<div class="p2-legend tier-2" id="p2-leg"></div>' +
          '<figcaption class="p2-cap ev-host"><span class="tier-1-only">Water moves toward more negative Ψ, even while it climbs. The biggest drop by far is from the leaf into the air. ' + ev('l2.air') + '</span>' +
          '<span class="tier-2"><b>Ohm’s law for water.</b> Flow is the current and the drop in Ψ is the voltage: flow = ΔΨ ÷ R. More resistance at the same pull means less flow, not more. ' + ev('l2.ohm') + ' Gravity adds ' + '<span id="p2-grav"></span> of tension at the leaf. ' + ev('l2.gravity') + '</span></figcaption>' +
        '</figure>' +
      '</div>' +
      '<section class="mol-sec" aria-labelledby="p2-molh"><h3 id="p2-molh">The pull, molecule by molecule</h3>' +
        '<p class="mol-try">Water molecules cling to each other (hydrogen bonds, the dashes) and to the vessel walls. When water evaporates from the leaves, the whole column is pulled up from the soil: cohesion and tension. <b>Try this:</b> dry the soil, or turn the light off in the conditions strip, and watch the column slow and the bonds stretch.</p>' +
        '<div data-r="cohmol"></div>' +
        '<p class="cap tier-2">The Ψ beads on the right are this plant now, from the model ' + ui.badge('ILLUSTRATIVE', 'Model output from illustrative constants.') + '. Drawing scales ' + ui.badge('DERIVED', 'Molecules rise at 14 px per second per mmol m⁻² s⁻¹ of E; the dashes stretch as leaf Ψ becomes more negative, toward −2 MPa. Real sap moves about a millimetre to a few centimetres per second.') + ': speed follows E; how stretched the dashes look follows the leaf Ψ. A real vessel holds billions of molecules in this slice.</p>' +
      '</section>' +
      '<section class="p2-exp" aria-labelledby="p2-exp-h"><h3 id="p2-exp-h">The series experiment</h3>' +
        '<p style="margin:0" class="ev-host">Predict first: if the path outside the xylem gets twice as hard to cross, which treads move? ' + ev('l2.series') + '</p>' +
        '<div class="p2-steps" role="group" aria-label="Series experiment steps">' +
          stepBtn(1, '1. Double the outside xylem resistance, flow held fixed') +
          stepBtn(2, '2. Now let the stomata respond') +
          '<button type="button" class="btn small" data-exp="0">Reset</button>' +
        '</div>' +
        '<p class="p2-say" id="p2-say" aria-live="polite"></p>' +
        '<div class="tier-2 p2-tw" id="p2-tab"></div>' +
        '<p class="p2-cap tier-2">After Scoffoni, Albuquerque, Buckley and Sack 2023, New Phytologist, Fig. 2: at a given transpiration rate, a resistance change moves water potential only downstream of itself. Step 2 is the part the figure leaves to the reader: stomata respond, the flow falls, and every tread becomes less negative.</p>' +
        '<div class="tier-2" id="p2-fig2"></div>' +
      '</section>' +
      '<div class="p2-two">' +
        '<div class="card tier-2"><h4>Predict, then check</h4><p>Keep the same pull, ΔΨ, and double the total resistance R. What happens to the flow?</p>' +
          '<div class="ohm" id="p2-ohm"></div>' +
          '<button type="button" class="btn small" id="p2-ohm-b" aria-expanded="false" aria-controls="p2-ohm-a">Check</button>' +
          '<p class="ans" id="p2-ohm-a" hidden></p></div>' +
        '<div class="card tier-2"><h4>Stomata read the leaf</h4><p class="ev-host" id="p2-gsnote"></p></div>' +
        '<div class="card tier-3"><h4>One equation for every cell and conduit</h4><p class="ev-host">Ψw = Ψs + Ψp everywhere. In a turgid cell Ψp is positive; in a xylem conduit it is negative, a tension. The sign of Ψp switches, the equation does not. ' + ev('l2.psiw') + '</p>' +
          '<p><b>Try it.</b> A conduit at Ψp = −1.0 MPa (sap Ψs near 0) sits next to a cell at Ψp = +0.5 MPa. What must the cell’s Ψs be for no net flow?</p>' +
          '<button type="button" class="btn small" id="p2-psw-b" aria-expanded="false" aria-controls="p2-psw-a">Check</button>' +
          '<p class="ans" id="p2-psw-a" hidden>The conduit has Ψw = 0 + (−1.0) = −1.0 MPa. Equilibrium needs the cell at −1.0 MPa too, so Ψs = −1.0 − 0.5 = −1.5 MPa.</p></div>' +
        '<div class="card tier-3"><h4>The model on this plate</h4><div class="eq" id="p2-eq"></div><div class="p2-tw"><table class="consts" id="p2-consts"></table></div><p class="ev-host" style="margin-top:6px">Leaf share 0.35 of 1 ÷ K<sub>plant</sub> ' + ev('l2.leafshare') + '</p></div>' +
        '<div class="card tier-2"><h4>Stomata shut, water still leaves</h4><p class="ev-host">E = (g<sub>s</sub> + g<sub>min</sub>) × VPD ÷ P<sub>atm</sub>. With the stomata shut, water still leaves through the cuticle and through stomata that do not close fully: the minimum conductance, g<sub>min</sub>. It varies widely between species and with growing conditions, and annual herbs lose more than woody plants. ' + ev('l2.gmin') + '</p><p class="num" id="p2-gmin"></p><p class="tier-3 ev-host">At high leaf temperature the cuticle carries a larger share of g<sub>min</sub>, which matters on a 36 °C almond afternoon. ' + ev('l2.gminT') + '</p></div>' +
        '<div class="card tier-3"><h4>What closes stomata? ' + ui.badge('OPEN QUESTION') + '</h4><p class="ev-host">The water signal, the hormone, or both? Fern and lycophyte stomata close passively and lack ABA responses; seed plants added active, ABA based control (Brodribb and McAdam 2011). In angiosperm leaves, falling turgor triggers ABA synthesis within minutes (McAdam and Brodribb 2016). A metabolic feedback from leaf water status is best supported, but where in the leaf it is sensed is unknown (Buckley 2019). In this model g<sub>s</sub> responds to leaf Ψ only, a hydraulic shortcut. ' + ev('l2.stomctl') + '</p><p class="ev-host">One grapevine study, flagged as a single study: in potted vines under drought, foliar ABA rose only after the stomata had fully closed, and rewatering did not reopen them while ABA stayed high (Tombesi et al. 2015). Does the water signal start closure and ABA hold it? ' + ev('l2.tombesi') + '</p></div>' +
        '<div class="tier-3" id="p2-howto" style="grid-column:1/-1"></div>' +
      '</div>';
    el.appendChild(wrap);
    refs.now = el.querySelector('#p2-now');
    var ht2 = el.querySelector('#p2-howto'); if (ht2 && WP.ui.howto) ht2.innerHTML = ['pchamber', 'gmin', 'gsgas', 'drought'].map(WP.ui.howto).join('');
    refs.latin = el.querySelector('#p2-latin');
    refs.art = el.querySelector('#p2-art');
    refs.dyn = el.querySelector('#p2-dyn');
    refs.plant = el.querySelector('#p2-plant');
    refs.stair = el.querySelector('#p2-stair');
    refs.st = el.querySelector('#p2-st');
    refs.leg = el.querySelector('#p2-leg');
    refs.say = el.querySelector('#p2-say');
    refs.tab = el.querySelector('#p2-tab');
    refs.fig2 = el.querySelector('#p2-fig2');
    refs.grav = el.querySelector('#p2-grav');
    refs.ohm = el.querySelector('#p2-ohm');
    refs.gsnote = el.querySelector('#p2-gsnote');
    refs.eq = el.querySelector('#p2-eq');
    refs.consts = el.querySelector('#p2-consts');

    if (ui.predict) {
      var stepsEl = el.querySelector('.p2-steps');
      stepsEl.parentNode.insertBefore(ui.predict({ q: 'Double the resistance outside the xylem and hold the flow fixed. Which terraces move?', choices: ['Only the leaf terrace', 'Every terrace', 'None of them'], correct: 0,
        answer: 'Only the leaf terrace. Each Ψ is the one upstream minus E × R. With E held fixed, a resistance change moves only what lies downstream of it (Scoffoni et al. 2023, Fig. 2). Step 2 then lets the stomata respond.',
        gate: [stepsEl.querySelector('[data-exp="1"]'), stepsEl.querySelector('[data-exp="2"]')] }), stepsEl);
    }
    el.querySelector('.p2-steps').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-exp]'); if (!b) return;
      exp = +b.getAttribute('data-exp');
      update(WP.state, WP.result);
    });
    function toggler(bid, aid) {
      var b = el.querySelector('#' + bid), a = el.querySelector('#' + aid);
      b.addEventListener('click', function () { var o = b.getAttribute('aria-expanded') === 'true'; a.hidden = o; b.setAttribute('aria-expanded', o ? 'false' : 'true'); b.textContent = o ? 'Check' : 'Hide'; });
    }
    toggler('p2-ohm-b', 'p2-ohm-a');
    toggler('p2-psw-b', 'p2-psw-a');
    wireEvidence(el);
    mountWhy(el); // 13 Oct: why so much water, starve or thirst

    // Fig 2 table (published worked example, fixed numbers)
    var D = WP.seriesDemo();
    var rows = [['Root to stem junction', 'stem'], ['Petiole base', 'petioleBase'], ['Leaf xylem', 'leafX'], ['End of outside xylem path', 'outside']];
    refs.fig2.innerHTML = '<p class="sc" style="margin:12px 0 0;color:var(--ink2)">The published worked example, Fig. 2</p>' +
      '<p class="p2-cap" style="margin-top:2px">Soil 0 MPa, E 5 mmol m⁻² s⁻¹; root 100, stem 100, leaf xylem 50, outside xylem 50 MPa m² s mol⁻¹. Scenario C doubles the outside xylem resistance to 100.</p>' +
      '<div class="p2-tw"><table class="p2-t"><thead><tr><th>Place</th><th>Scenario A, MPa</th><th>Scenario C, MPa</th></tr></thead><tbody>' +
      rows.map(function (r) { var a = D.A[r[1]], c = D.C[r[1]]; return '<tr><th scope="row" style="font-weight:400">' + r[0] + '</th><td>' + num(a, 2) + '</td><td' + (Math.abs(a - c) > 1e-9 ? ' class="mvd"' : '') + '>' + num(c, 2) + '</td></tr>'; }).join('') +
      '</tbody></table></div><p class="p2-cap" style="font-size:13px">Values ' + ui.badge('VERIFIED', 'Matched in the Fig. 2 legend text.') + ' ' + ui.source('10.1111/nph.19069') + '</p>';

    var stops = document.createElement('div');
    stops.className = 'p2-stops';
    el.appendChild(stops);
    if (ui.stops) ui.stops(stops, ['2a']);
    if (ui.molStage) refs.cohT = ui.molStage(el.querySelector('[data-r="cohmol"]'), 'cohesion', { height: function (cw) { return cw < 560 ? 500 : 470; }, prewarm: 3, // 13 Oct: about 20 to 25 % taller
      label: 'Animated xylem vessel: a column of water molecules joined by hydrogen bonds rises from the soil to the leaves at a speed set by transpiration, with the water potential at each organ beside it' });
    wpSpeedChip(el.querySelector('[data-r="cohmol"]'));
    var src = document.createElement('div');
    src.className = 'tier-2 card';
    src.style.marginTop = '18px';
    el.appendChild(src);
    ui.sources(src, ['10.1111/nph.19069', '10.1039/df9480300146', '10.1104/pp.41.1.119', '10.1093/jxb/eraa392', '10.3389/fpls.2022.974050', '10.1111/pce.13722', '10.1146/annurev.arplant.56.032604.144141', '10.1016/j.tplants.2017.11.002',
      '10.1111/nph.15395', '10.1093/jxb/47.12.1813', '10.1111/nph.71166', '10.1111/nph.20346', '10.1126/science.1197985', '10.1104/pp.16.00380', '10.1111/nph.15899', '10.1006/anbo.2000.1361', '10.21273/hortsci.38.4.547', '10.1111/nph.70052', '10.3791/4179'], 'Sources for this plate');
    treeInit(el.querySelector('[data-r="hero"]')); // gate and tree, 13 Oct: the 3D almond tree is the hero; the glassy stem hero is the fallback
    ui.onPrefs(function () { if (WP.state) update(WP.state, WP.result); if (!ui.reducedMotion()) startAnim(); else stopAnim(true); if (PH.ctx && PH.ctx.retheme) PH.ctx.retheme(); if (T3C) T3C.retheme(); });
    document.addEventListener('visibilitychange', function () { if (document.hidden) stopAnim(); else if (anim.on) startAnim(); });
  }

  /* ------------------------------------------------------------ particles: water moving through every drawn conduit
     Flux in each conduit = E × the leaf area it feeds; dot speed ∝ flux ÷ drawn width, clamped. One rAF loop;
     every path is sampled once with getPointAtLength and cached. Dots park in embolised conduits.
     Under reduced motion the dots are static and their density follows the flux. */
  var NET = { crop: '', paths: [], dots: [], built: false };
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

  var MS = WP.molsvg || null;
  function buildNet(crop) {
    var G = geo(crop), svg = refs.plant, NS = 'http://www.w3.org/2000/svg';
    var probe = document.createElementNS(NS, 'path');
    probe.setAttribute('fill', 'none'); probe.setAttribute('stroke', 'none');
    svg.appendChild(probe);
    NET.paths = G.flow.map(function (f, i) {
      probe.setAttribute('d', f.pts.length > 2 ? smoothD(f.pts) : polyD(f.pts));
      var len = 0, S = [];
      try { len = probe.getTotalLength(); } catch (e) { len = 0; }
      var n = Math.max(2, Math.ceil(len / 2));
      for (var k = 0; k <= n; k++) { var p = probe.getPointAtLength(len * k / n); S.push([p.x, p.y]); }
      var share = f.kind === 'root' || f.kind === 'fine' ? f.share : f.flux / G.leaves;
      return { i: i, S: S, len: len, share: share, w: f.w, kind: f.kind, shoot: f.shoot, node: f.node, emb: false, v: 0 };
    });
    svg.removeChild(probe);
    NET.crop = crop; NET.built = true; NET.sig = '';
  }
  function hash2(a, b) { var x = Math.sin((a + 1) * 12.9898 + (b + 1) * 78.233) * 43758.5453; return x - Math.floor(x); }
  function netState(res, E) {
    var pP = res.PLC && res.PLC.petiole != null ? res.PLC.petiole / 100 : 0;
    var pS = res.PLC && res.PLC.stem != null ? res.PLC.stem / 100 : 0;
    var red = ui.reducedMotion();
    var sig = [];
    NET.paths.forEach(function (p) {
      if (p.kind === 'petiole') p.emb = hash2(p.shoot || 0, p.node || 0) < pP;
      else if (p.kind === 'shoot') p.emb = hash2(p.shoot || 0, 99) < pS;
      else p.emb = false;
      p.v = p.emb ? 0 : clamp(320 * E * p.share / p.w, 0, 70);
      var spacing = red ? clamp(36 / Math.max(0.05, Math.sqrt(p.v / 6)), 7, 90) : 22;
      p.n = p.len < 4 ? 0 : Math.max(1, Math.round(p.len / spacing));
      sig.push(p.n, p.emb ? 1 : 0);
    });
    var s = sig.join('');
    if (s !== NET.sig) {
      NET.sig = s;
      var h = '', emb = '';
      NET.dots = [];
      NET.paths.forEach(function (p, pi) {
        // r7: each dot is a water molecule (red O, two white H) in the mol.js template; gas bubbles park in embolised conduits
        for (var k = 0; k < p.n; k++) { NET.dots.push({ p: pi, o: (k + hash2(pi, k) * 0.6) / p.n * p.len, r: hash2(k, pi) * 360, s: p.w > 6 ? 1.05 : (p.w > 2 ? 0.85 : 0.65) }); h += MS ? MS.use(p.emb ? 'gas' : 'h2o', 'ptc-dot' + (p.emb ? ' emb' : '')) : '<circle class="ptc-dot' + (p.emb ? ' emb' : '') + '" r="' + (p.w > 6 ? 2.6 : (p.w > 2 ? 2 : 1.5)) + '"/>'; }
        if (p.emb) emb += 'M' + p.S.map(function (q) { return f1(q[0]) + ',' + f1(q[1]); }).join(' L') + ' ';
      });
      var g = refs.dyn.querySelector('#p2-ptc');
      if (g) g.innerHTML = '<path class="embseg" d="' + emb + '"/>' + h;
    }
  }
  function placeParticles(dt) {
    var g = refs.dyn && refs.dyn.querySelector('#p2-ptc');
    if (!g || !NET.dots.length) return;
    var cs = g.querySelectorAll('.ptc-dot');
    for (var j = 0; j < NET.dots.length && j < cs.length; j++) {
      var d = NET.dots[j], p = NET.paths[d.p];
      if (dt) { d.o = (d.o + p.v * dt) % p.len; d.r = (d.r + p.v * dt * 3) % 360; }
      var f = p.len ? d.o / p.len * (p.S.length - 1) : 0, k = Math.floor(f), t = f - k, a = p.S[k], b = p.S[Math.min(k + 1, p.S.length - 1)];
      var x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t;
      if (cs[j].tagName === 'use' && MS) MS.place(cs[j], x, y, p.emb ? 0 : d.r, d.s);
      else { cs[j].setAttribute('cx', x.toFixed(1)); cs[j].setAttribute('cy', y.toFixed(1)); }
      d.x = x; d.y = y;
    }
    netNames();
  }
  /* 13 Oct (slow and named): H₂O under one or two moving molecules (1 on phones), "air" under one gas bubble of an
     embolised conduit; WP.svgNames keeps them off every label of the figure */
  function netNames() {
    var g = refs.dyn && refs.dyn.querySelector('#p2-ptc'); if (!g || !WP.svgNames) return;
    var lay = refs.dyn.querySelector('#p2-pname');
    if (!lay) { lay = document.createElementNS('http://www.w3.org/2000/svg', 'g'); lay.setAttribute('id', 'p2-pname'); lay.setAttribute('pointer-events', 'none'); g.parentNode.insertBefore(lay, g.nextSibling); NET.nm = null; }
    var svg = lay.ownerSVGElement; if (!svg) return;
    if (!NET.nm || NET.nmLay !== lay) { NET.nm = WP.svgNames(svg, lay); NET.nmLay = lay; }
    var L = [], len = NET.dots.length;
    for (var i = 0; i < len; i++) {
      var d = NET.dots[i], p = NET.paths[d.p]; if (d.x == null || !p) continue;
      if (p.emb) L.push({ k: 'gas', key: d, x: d.x, y: d.y, r: 4.5 * d.s, t: 'air', q: 1 });
      else if (d.s >= 0.85 && d.o > p.len * 0.12 && d.o < p.len * 0.85) L.push({ k: 'w', key: d, x: d.x, y: d.y, r: 4.5 * d.s, t: 'H₂O' });
    }
    NET.nm.frame(L);
  }
  if (window.MolNames) window.MolNames.on(function () { if (NET.nm) { NET.nm.dirty(); placeParticles(0); } });
  function frame(t) {
    if (!anim.on) return;
    var dt = anim.t0 ? Math.min(0.1, (t - anim.t0) / 1000) : 0; dt *= (window.PlaySpeed ? window.PlaySpeed.get() : 1);
    anim.t0 = t;
    placeParticles(dt);
    anim.raf = requestAnimationFrame(frame);
  }
  function startAnim() {
    anim.on = true;
    if (ui.reducedMotion()) { stopAnim(true); return; }
    cancelAnimationFrame(anim.raf); anim.t0 = 0;
    anim.raf = requestAnimationFrame(frame);
  }
  function stopAnim(keep) {
    cancelAnimationFrame(anim.raf); anim.raf = 0;
    if (keep) placeParticles(0);
  }

  /* ------------------------------------------------------------ update */
  function update(st, res) {
    if (!refs.dyn) return;
    lastRes = res;
    phUpd(st, res);
    if (refs.cohT) refs.cohT.set({ E: res.E, psi: res.psi, hgt: 1 });
    var X = exp ? expStates(st, res) : null;
    anim.E = (X && exp === 2) ? X.resp.E : res.E;
    if (st.crop !== lastCrop) {
      refs.art.innerHTML = geo(st.crop).svg;
      buildNet(st.crop);
      refs.latin.innerHTML = '<i>' + esc(CROPLATIN[st.crop]) + '</i>, drawn as a hydraulic circuit. Not to scale.';
      lastCrop = st.crop;
    }
    refs.dyn.innerHTML = renderPlant(st, res, X);
    NET.sig = '';
    netState(res, anim.E);
    placeParticles(0);
    refs.plant.querySelector('title').textContent = 'The ' + WP.params.crops[st.crop].label.toLowerCase() + ' drawn as a hydraulic circuit: soil ' + psi(res.psi.soil) + ', leaf outside the xylem ' + psi(res.psi.leafOut) + ', ' + ui.stomata(res).text + '.';
    var S = renderStair(st, res, X);
    refs.st.innerHTML = S.svg.replace(/url\(#p2-arw\)/g, 'url(#p2-arw2)');
    placeTreads(refs.stair, S.treads);
    refs.stair.setAttribute('viewBox', '0 0 560 ' + S.h);
    var cur = X ? (exp === 1 ? X.fixed.psi : X.resp.psi) : res.psi;
    refs.stair.querySelector('title').textContent = 'Water potential staircase: ' + NODES.map(function (n) { return n[1] + ' ' + psi(cur[n[0]]); }).join(', ') + ', then a broken axis up to the air at ' + psi(res.psiAir, 0) + '.';
    refs.leg.innerHTML = exp ? '<span><i style="background:' + ui.water(-0.8) + '"></i>now</span><span><i class="g"></i>before the change</span>' + (exp === 2 ? '<span><i class="m"></i>step 1, flow held fixed</span>' : '') : '<span>Tread colour is the water ink for that Ψ.</span>';
    refs.now.textContent = nowText(st, res, X);
    var keyEl = root.querySelector('#p2-key');
    if (keyEl) { var Pk = X && exp >= 1 ? X[exp === 1 ? 'fixed' : 'resp'].psi : res.psi; var lab6 = st.crop === 'romaine' ? ['soil', 'root', 'core', 'midrib base', 'leaf xylem', 'outside xylem'] : ['soil', 'root', 'stem', 'petiole', 'leaf xylem', 'outside xylem'];
      keyEl.innerHTML = NODES.map(function (n, i) { return '<li><b>' + (i + 1) + '</b>' + lab6[i] + '<span class="num">' + psi(Pk[n[0]]) + '</span></li>'; }).join('') + '<li><b>7</b>air<span class="num">' + psi(res.psiAir, 0) + '</span></li>'; }
    refs.grav.textContent = psi(res.grav, 3);
    var gm = root.querySelector('#p2-gmin'); if (gm) gm.innerHTML = 'Now: g<sub>s</sub> ' + num(res.gs, 3) + ' + g<sub>min</sub> ' + num(res.gmin, 3) + ' mol m⁻² s⁻¹; the cuticle and leaky stomata alone would lose ' + num(res.Emin, 2) + ' mmol m⁻² s⁻¹ at this VPD ' + ui.badge('ILLUSTRATIVE', 'gmin is a teaching constant.') + '.';

    // experiment buttons and narrative
    Array.prototype.forEach.call(root.querySelectorAll('.p2-steps .btn[data-exp]'), function (b) { var n = +b.getAttribute('data-exp'); if (n) b.setAttribute('aria-pressed', n === exp ? 'true' : 'false'); });
    var say = '';
    if (!exp) say = 'Press step 1. Your current plant is the starting point, so the numbers follow the conditions strip.';
    else if (exp === 1) say = 'Only tread 6 moved. Upstream of the doubled resistance nothing changed, because each Ψ is the one upstream minus E × R, and neither E nor the upstream R changed.';
    else say = 'The deeper leaf Ψ closed the stomata a little, E fell, and every E × R drop shrank. All the treads became less negative, including the root and stem that the resistance change never touched. The leaf ends ' + (X.resp.psi.leafOut < X.base.psi.leafOut ? 'still a little more negative than' : 'less negative than') + ' where it started.';
    refs.say.textContent = say;
    if (X) {
      var rows = [['Flow E, mmol m⁻² s⁻¹', 'E']].concat(NODES.map(function (n, i) { return [(i + 1) + ' ' + n[1] + ', MPa', n[0]]; }));
      function g(o, k) { return k === 'E' ? o.E : o.psi[k]; }
      refs.tab.innerHTML = '<table class="p2-t"><thead><tr><th>Place</th><th>Before</th><th>1. R<sub>ox</sub> × 2, E fixed</th><th>2. Stomata respond</th></tr></thead><tbody>' +
        rows.map(function (r) {
          var a = g(X.base, r[1]), b = g(X.fixed, r[1]), c = g(X.resp, r[1]);
          return '<tr><th scope="row" style="font-weight:400">' + r[0] + '</th><td>' + num(a, 2) + '</td><td' + (Math.abs(b - a) > 0.005 ? ' class="mvd"' : '') + '>' + num(b, 2) + '</td><td' + (exp === 2 && Math.abs(c - a) > 0.005 ? ' class="mvd"' : '') + '>' + (exp === 2 ? num(c, 2) : '·') + '</td></tr>';
        }).join('') + '</tbody></table>';
    } else refs.tab.innerHTML = '';

    // Ohm predict and check, with today's numbers
    var dPsi = res.psi.soil - res.psi.leafOut - res.grav;
    refs.ohm.innerHTML = 'flow = ΔΨ ÷ R<br>ΔΨ = ' + num(res.psi.soil - res.psi.leafOut, 2) + ' MPa minus ' + num(res.grav, 3) + ' MPa for height = ' + num(dPsi, 2) + ' MPa<br>today: ' + num(dPsi, 2) + ' MPa ÷ ' + num(res.R.total, 3) + ' MPa m² s mmol⁻¹ = ' + num(res.E, 2) + ' mmol m⁻² s⁻¹';
    root.querySelector('#p2-ohm-a').textContent = 'The flow halves: ' + num(dPsi, 2) + ' ÷ ' + num(2 * res.R.total, 3) + ' = ' + num(res.E / 2, 2) + ' mmol m⁻² s⁻¹. Resistance never raises the current. In the plant the stomata would then respond and ΔΨ would change too, which is step 2 of the experiment.';

    // stomata note per crop
    var c = WP.params.crops[st.crop];
    var gsKey = { grape: 'l2.gsgrape', almond: 'l2.gsalmond', romaine: 'l2.gsromaine' }[st.crop];
    var gn = st.crop === 'grape' ? 'Grapevine stomatal conductance was down 80 % by a leaf Ψ near −1.2 MPa; half closure at −0.60 MPa (Table 2), a number about guard cells, not about pipes. How far a vine lets its leaf Ψ fall depends on soil and weather, not only on the variety.' :
      (st.crop === 'almond' ? 'Almond stomata reach 90 % closure between −1.72 and −2.25 MPa depending on cultivar; the model puts half closure at −1.4 MPa, so it reaches 90 % closure near −2.0 MPa, inside that window.' :
        'No published closure curve was found for romaine; the curve here is a teaching shape.');
    refs.gsnote.innerHTML = esc(gn) + ' ' + ev(gsKey) + (st.crop === 'grape' ? ' ' + ev('l2.iso') : '') + '<br>Leaf Ψ now: <b class="num">' + psi(res.psi.leafOut) + '</b>. Leaf Ψ alone would close them <b class="num">' + Math.round(100 * (1 - res.fPsi)) + ' %</b>; with light added they are at <b class="num">' + Math.round(100 * res.gs / res.gsMax) + ' %</b> of maximum' + (res.koActive ? ' (PIP2;1 knockout on: half closure shifted to ' + psi(res.psi50) + ')' : '') + '.';

    // tier 3: equations and constants
    refs.eq.innerHTML = 'E = (Ψ<sub>soil</sub> − Ψ<sub>leaf</sub> − ρgh) ÷ R<sub>total</sub><br>' +
      'R<sub>total</sub> = R<sub>root</sub> + R<sub>stem</sub>(PLC) + R<sub>petiole</sub>(PLC) + R<sub>x</sub> + R<sub>ox</sub><br>' +
      'Ψ<sub>downstream</sub> = Ψ<sub>upstream</sub> − E × R<br>' +
      'E = (g<sub>s</sub> + g<sub>min</sub>) × VPD ÷ P<sub>atm</sub> = (' + num(res.gs, 3) + ' + ' + num(res.gmin, 3) + ') × ' + num(res.VPD, 2) + ' ÷ 101.3 = ' + num(res.E, 2) + ' mmol m⁻² s⁻¹<br>' +
      'g<sub>s</sub> = g<sub>s,max</sub> × f<sub>light</sub> × f<sub>Ψ</sub>; ' + (st.crop === 'grape' ? 'f<sub>Ψ</sub> = exp(−(−Ψ ÷ 0.81)<sup>1.22</sup>)' : 'f<sub>Ψ</sub> = 1 ÷ (1 + e<sup>−k(Ψ − ψ<sub>50</sub>)</sup>)') + '. In this model g<sub>s</sub> responds to leaf Ψ only, a hydraulic shortcut.<br>' +
      'solved by bisection: ' + res.iters + ' steps, ' + (res.converged ? 'converged' : 'NOT converged') + (res.warnings.length ? '; ' + esc(res.warnings.join('; ')) : '');
    var K = c.Kplant.v, sp = WP.params.split;
    function row(lbl, val, p) { return '<tr><td>' + lbl + '</td><td class="v">' + val + '</td><td>' + ui.badge(p.badge, p.src) + '</td></tr>'; }
    refs.consts.innerHTML =
      row('K<sub>plant</sub> at reference', num(K, 0) + ' mmol m⁻² s⁻¹ MPa⁻¹', c.Kplant) +
      row('Split root, stem, petiole', num(sp.root.v, 2) + ', ' + num(sp.stem.v, 2) + ', ' + num(sp.petiole.v, 2), sp.root) +
      row('Split leaf xylem, sheath, mesophyll', num(sp.leafX.v, 2) + ', ' + num(sp.bs.v, 2) + ', ' + num(sp.mes.v, 2), sp.bs) +
      row('Leaf height h', num(c.height.v, 2) + ' m', c.height) +
      row('g<sub>s,max</sub>', num(c.gsMax.v, 2) + ' mol m⁻² s⁻¹', c.gsMax) +
      row('ψ<sub>50</sub> stomata', psi(c.psi50.v), c.psi50) +
      (c.form === 'weibull' ? row('Weibull b, c', num(c.wb.v, 2) + ' MPa, ' + num(c.wc.v, 2), c.wb) : row('k, closure steepness', num(c.k.v, 1) + ' MPa⁻¹', c.k)) +
      row('g<sub>min</sub>, cuticle plus leaky stomata', num(WP.params.stomata.gmin.v, 3) + ' mol m⁻² s⁻¹', WP.params.stomata.gmin) +
      row('R now: root, stem, petiole', num(res.R.root, 3) + ', ' + num(res.R.stem, 3) + ', ' + num(res.R.petiole, 3), WP.params.series.law) +
      row('R now: leaf xylem, outside xylem', num(res.R.leafX, 3) + ', ' + num(res.R.ox, 3), WP.params.series.law);
  }

  function show() { RT.on = true; railTag(); if (WP.state) { startAnim(); } }
  function hide() { anim.on = false; stopAnim(); RT.on = false; railTag(); }
  /* T3 (tree fix round, 13 Oct): the tree is always an almond (its own WP.solve, crop almond), while the side readouts follow
     the crop in Conditions. On this plate the rail subtitle names that crop, so a user never reads two leaf Ψ values
     without knowing which plant each belongs to. Restored on leaving the plate. */
  var RT = { on: false, orig: null };
  function railTag() {
    var e = document.querySelector('#wp-rail .rail-sub'); if (!e) return;
    if (RT.orig == null) RT.orig = e.innerHTML;
    var st = WP.state, nm = { grape: 'grapevine', romaine: 'romaine', almond: 'almond' }[st && st.crop];
    var want = (RT.on && T3C && nm && st.crop !== 'almond') ? 'live, from the model, for the <b>' + nm + '</b> chosen in Conditions (the tree above is an almond)' : RT.orig;
    if (e.innerHTML !== want) e.innerHTML = want;
  }

  /* ------------------------------------------------------------ 13 Oct (journey builder): why so much water, and starve or thirst
     A poll with reasons, then one stoma that has to choose between CO2 in and water out. E = gs × VPD ÷ Patm is the
     engine's own equation (DERIVED); A comes from a simple supply and demand toy with ILLUSTRATIVE constants. */
  var ST = { gs: 0.30, T: null, unsub: null };
  var STC = { Ca: 420, gam: 40, Vm: 30, Km: 300 }; // ILLUSTRATIVE: ppm, ppm, µmol m−2 s−1, ppm
  function stA(gs) { // supply gc (Ca − Ci) = demand Vm (Ci − Γ) ÷ (Ci + Km), solved for Ci by bisection
    var gc = gs / 1.6; if (gc <= 0) return { A: 0, Ci: STC.gam };
    var lo = STC.gam, hi = STC.Ca;
    for (var i = 0; i < 60; i++) { var ci = (lo + hi) / 2, f = gc * (STC.Ca - ci) - STC.Vm * (ci - STC.gam) / (ci + STC.Km); if (f > 0) lo = ci; else hi = ci; }
    var Ci = (lo + hi) / 2; return { A: gc * (STC.Ca - Ci), Ci: Ci };
  }
  function stE(gs, VPD) { return gs * VPD / 101.3 * 1000; }
  function mountWhy(el) {
    var LH = WP.lh; if (!LH) return;
    LH.css();
    var sec = document.createElement('section'); sec.className = 'lh-sec'; sec.setAttribute('aria-labelledby', 'p2-why-h');
    var CH = [
      ['To keep the stomata open, so CO₂ can get in', 'Yes, this is the big one. The pores that let CO₂ in are the same pores that let water vapour out, and the air outside is far drier than the leaf. Most of the water a plant moves is the price of an open door.'],
      ['To cool the leaf', 'Evaporation does cool a sunlit leaf, and that matters on hot days. But it is a side benefit of the open pores, not the reason they open: plants close stomata in heat when water runs short.'],
      ['To carry nutrients up from the soil', 'The transpiration stream does carry dissolved nutrients, and it helps. But nutrients still move with very little transpiration, so this is not why the flow is so large.'],
      ['Water is used up in photosynthesis', 'Photosynthesis splits some water at photosystem II, but only a very small share of what flows through the plant. Almost all of it leaves as vapour.'],
      ['To make new cells grow', 'Growing cells take up water to expand, and turgor drives that growth. It is a small share of the flow; most of the water passes straight through the leaf and out.']];
    sec.innerHTML = '<h3 id="p2-why-h">Why does a plant move so much water?</h3>' +
      '<p class="lh-q">Pick the reason you think matters most, then read why each answer is right or only part of the story.</p>' +
      '<div class="card lh-poll" role="group" aria-label="Poll: why does a plant move so much water?"><div class="chips lh-chips" role="radiogroup" aria-label="Your answer">' +
        CH.map(function (c, i) { return '<button type="button" class="chip" role="radio" aria-checked="false" data-why="' + i + '">' + c[0] + '</button>'; }).join('') + '</div>' +
        '<div data-r="whyans" aria-live="polite"></div></div>' +
      '<h4 style="margin:18px 0 4px">Starve or thirst: one pore, two jobs</h4>' +
      '<p class="lh-cap" style="margin-top:0">Open the stoma and CO₂ flows in for photosynthesis, but water flows out faster. Close it and the leaf saves water but starves of CO₂. Slide the opening and watch both streams.</p>' +
      '<div class="lh-two">' +
        '<div><div data-r="stmol" class="lh-mol"></div>' +
          '<div class="lh-sl"><label for="p2-st-gs">Stomatal opening, g<sub>s</sub></label><input type="range" id="p2-st-gs" min="0" max="0.6" step="0.01" value="0.30"><output id="p2-st-gso"></output></div>' +
          '<p class="lh-read" data-r="stread" aria-live="polite"></p></div>' +
        '<div><div class="tier-2" data-r="stchart"></div>' +
          '<p class="lh-cap tier-2">CO₂ in rises and then flattens as the chloroplasts, not the pore, become the limit; water out keeps rising in a straight line. So each extra bit of opening buys less carbon for more water. The weather sets the slope of the water line: try a hotter, drier afternoon in the conditions strip.</p>' +
          '<div class="card tier-3"><h4 style="margin:0 0 6px">The toy’s equations</h4><p style="margin:0">E = g<sub>s</sub> × VPD ÷ P<sub>atm</sub> ' + LH.badge('DERIVED', 'The same equation the plate model uses.') + '. CO₂ in: A = (g<sub>s</sub> ÷ 1.6) × (C<sub>a</sub> − C<sub>i</sub>), with 1.6 the ratio of the diffusivities of water vapour and CO₂ in air, solved against a simple demand A = V (C<sub>i</sub> − Γ) ÷ (C<sub>i</sub> + K) with C<sub>a</sub> 420 ppm, Γ 40 ppm, V 30 µmol m⁻² s⁻¹ and K 300 ppm ' + LH.badge('ILLUSTRATIVE', 'Constants chosen to give a plausible C3 leaf; not fitted to any species.') + '. Leaf Ψ = soil Ψ − E ÷ K<sub>plant</sub>, with K<sub>plant</sub> from the plate model.</p>' +
            '<p style="margin:8px 0 0">The full photosynthesis model, with Rubisco, light and temperature, is on <a href="../light/index.html#tradeoff">Light V · Water for carbon</a>.</p></div>' +
        '</div></div>' +
      LH.check('A Salinas morning turns into a hot, dry afternoon: VPD triples and the stoma does not move. What happens to water out, and to CO₂ in?',
        'Water out triples, because E = g<sub>s</sub> × VPD ÷ P<sub>atm</sub> and only VPD changed. CO₂ in hardly changes, because the CO₂ gradient into the leaf does not depend on the humidity of the air. So the water cost of each CO₂ triples too. That is why stomata partly close on dry afternoons.', 'tier-2');
    var exp = el.querySelector('.p2-exp');
    if (exp) exp.parentNode.insertBefore(sec, exp); else el.appendChild(sec);
    LH.toggle(sec);
    var ans = sec.querySelector('[data-r="whyans"]');
    sec.querySelector('.lh-poll').addEventListener('click', function (e) {
      var b = e.target.closest('[data-why]'); if (!b) return;
      Array.prototype.forEach.call(sec.querySelectorAll('[data-why]'), function (x) { x.setAttribute('aria-checked', x === b ? 'true' : 'false'); });
      var k = +b.getAttribute('data-why');
      ans.innerHTML = '<p class="lh-ans" style="margin-top:10px"><b>' + (k === 0 ? 'That is the main reason.' : 'Part of the story.') + '</b> ' + CH[k][1] + '</p>' +
        '<ul class="lh-cap" style="padding-left:18px;margin:8px 0 0">' + CH.map(function (c, i) { return i === k ? '' : '<li><b>' + c[0] + ':</b> ' + c[1] + '</li>'; }).join('') + '</ul>';
    });
    var gsIn = sec.querySelector('#p2-st-gs'), gsOut = sec.querySelector('#p2-st-gso');
    gsIn.addEventListener('input', function () { ST.gs = +gsIn.value; stUpdate(sec); });
    if (ui.molStage) ST.T = ui.molStage(sec.querySelector('[data-r="stmol"]'), 'stomagas', { height: function (cw) { return cw < 560 ? 380 : 400; }, prewarm: 5, // 13 Oct: 25 % taller
      caption: 'Drawing scale: CO₂ at 0.25 molecules per second per µmol m⁻² s⁻¹ taken up; water at 1.2 per second per mmol m⁻² s⁻¹ lost.',
      label: 'Animated stoma on the lower leaf surface: CO2 molecules drift in through the pore to the chloroplasts while water molecules leave through the same pore, at rates set by the opening slider' });
    wpSpeedChip(sec.querySelector('[data-r="stmol"]'));
    ST.out = gsOut;
    if (WP.on) ST.unsub = WP.on(function () { stUpdate(sec); });
    stUpdate(sec);
  }
  function stUpdate(sec) {
    var LH = WP.lh, res = WP.result; if (!LH || !res || !sec) return;
    var VPD = res.VPD, gs = ST.gs, a = stA(gs), E = stE(gs, VPD), ratio = a.A > 0.05 ? E * 1000 / a.A : null;
    var Kp = res.K && res.K.plant ? res.K.plant : null, soil = WP.state.soilPsi, leaf = Kp ? soil - E / Kp : null;
    if (ST.out) ST.out.textContent = LH.num(gs, 2) + ' mol m⁻² s⁻¹';
    var rd = sec.querySelector('[data-r="stread"]');
    var mood = gs < 0.06 ? 'Starving: almost no CO₂ gets in.' : (leaf !== null && leaf < -1.4 ? 'Thirsty: the leaf is being pulled hard.' : (gs > 0.4 ? 'Generous: lots of CO₂, but each one costs more water.' : 'A working compromise.'));
    rd.innerHTML = '<b>' + mood + '</b> CO₂ in <b>' + LH.num(a.A, 1) + '</b> µmol m⁻² s⁻¹; water out <b>' + LH.num(E, 1) + '</b> mmol m⁻² s⁻¹' +
      (ratio ? '; about <b>' + LH.num(Math.round(ratio / 10) * 10, 0) + '</b> water molecules lost per CO₂ taken in' : '') + ' ' + LH.badge('ILLUSTRATIVE', 'Toy model; E is DERIVED from the live VPD.') +
      '<span class="tier-2"> At this VPD (' + LH.num(VPD, 2) + ' kPa)' + (leaf !== null ? ' the leaf would sit near ' + LH.psi(leaf) + ' in this model' : '') + '.</span>';
    if (ST.T) ST.T.set({ open: Math.min(1, gs / 0.5), co2: 0.25 * a.A, h2o: 1.2 * E, ratio: ratio ? '≈ ' + Math.round(ratio / 10) * 10 + ' H₂O per CO₂' : 'no CO₂ in' });
    var ch = sec.querySelector('[data-r="stchart"]'); if (!ch) return;
    var W = LH.narrow(ch) ? 440 : 600, H = 306, L = 52, R = 52, T = 50, B = 44, n = 60, gmax = 0.6; /* QV13: legend and starve/thirst above the plot, no labels on the curves */
    var Emax = stE(gmax, VPD), Amax = stA(gmax).A, yE = Math.max(4, Math.ceil(Emax / 4) * 4), yA = Math.max(10, Math.ceil(Amax / 5) * 5);
    function X(g) { return L + (W - L - R) * g / gmax; }
    function YA(v) { return H - B - (H - B - T) * v / yA; }
    function YE(v) { return H - B - (H - B - T) * v / yE; }
    var dA = '', dE = '';
    for (var i = 0; i <= n; i++) { var g = gmax * i / n; dA += (i ? 'L' : 'M') + X(g).toFixed(1) + ',' + YA(stA(g).A).toFixed(1); dE += (i ? 'L' : 'M') + X(g).toFixed(1) + ',' + YE(stE(g, VPD)).toFixed(1); }
    var s = '<svg class="lh-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="CO2 uptake and water loss against stomatal conductance">';
    s += '<line class="ax" x1="' + L + '" x2="' + (W - R) + '" y1="' + (H - B) + '" y2="' + (H - B) + '"/><line x1="' + L + '" x2="' + L + '" y1="' + T + '" y2="' + (H - B) + '" stroke="#009E73" stroke-width="2"/><line x1="' + (W - R) + '" x2="' + (W - R) + '" y1="' + T + '" y2="' + (H - B) + '" stroke="var(--w2)" stroke-width="2" stroke-dasharray="5 3"/>';
    [0, 0.2, 0.4, 0.6].forEach(function (g) { s += '<text class="sm" x="' + X(g) + '" y="' + (H - B + 20) + '" text-anchor="middle">' + g.toFixed(1) + '</text>'; });
    [0, yA / 2, yA].forEach(function (v) { s += '<text class="sm" x="' + (L - 6) + '" y="' + (YA(v) + 4) + '" text-anchor="end">' + v + '</text>'; });
    [0, yE / 2, yE].forEach(function (v) { s += '<text class="sm" x="' + (W - R + 6) + '" y="' + (YE(v) + 4) + '">' + v + '</text>'; });
    s += '<text class="sm" x="' + ((L + W - R) / 2) + '" y="' + (H - 6) + '" text-anchor="middle">stomatal conductance g<tspan baseline-shift="sub" font-size="9">s</tspan>, mol m⁻² s⁻¹</text>';
    s += '<path d="' + dA + '" fill="none" stroke="#009E73" stroke-width="3"/><path d="' + dE + '" fill="none" stroke="var(--w2)" stroke-width="3" stroke-dasharray="7 4"/>';
    s += '<line x1="' + (L - 40) + '" x2="' + (L - 14) + '" y1="12" y2="12" stroke="#009E73" stroke-width="3"/><text class="sm" x="' + (L - 8) + '" y="16">CO₂ in, µmol (left)</text>';
    s += '<line x1="' + (W - R + 14) + '" x2="' + (W - R + 40) + '" y1="12" y2="12" stroke="var(--w2)" stroke-width="3" stroke-dasharray="7 4"/><text class="sm" x="' + (W - R + 8) + '" y="16" text-anchor="end">water out, mmol (right)</text>';
    s += '<line x1="' + X(gs) + '" x2="' + X(gs) + '" y1="' + T + '" y2="' + (H - B) + '" stroke="var(--ink)" stroke-width="1.4"/>';
    s += '<circle cx="' + X(gs) + '" cy="' + YA(a.A) + '" r="5.5" fill="#009E73"/><circle cx="' + X(gs) + '" cy="' + YE(E) + '" r="5.5" fill="var(--w2)"/>';
    s += '<text class="sm" x="' + (L + 2) + '" y="' + (T - 8) + '">← starve</text><text class="sm" x="' + (W - R - 2) + '" y="' + (T - 8) + '" text-anchor="end">thirst →</text>';
    ch.innerHTML = s + '</svg>';
  }


  /* ============================================================ FP14 (14 Oct 2026, field+plant builder): Water II macro hero
     A stem cut lengthwise: bark and phloem as a glassy shell, a soft pith, a ring of xylem vessels, and one vessel in
     front holding a column of water molecules joined by hydrogen bonds (white dashes). The column rises at a speed set
     by the model E (DERIVED drawing scale) with a parabolic profile (faster at the centre); the dashes stretch as stem Ψ
     falls. Vessel element end walls (simple perforation plates) and bordered pits on the wall. Three.js r128 through
     WP.macro (macro.js, tissue builder); helpers copied here, never edited there. 1 drawing unit is about 20 µm. */
  /* 13 Oct (slow and named): the speed chip beside the Pause button of a molecular theatre (ui.molStage puts Pause in .mol-bar) */
  function wpSpeedChip(host) {
    if (!host || !window.PlaySpeed) return;
    var pb = host.querySelector('.mol-pause, [data-ps-after]'); if (!pb || pb.parentNode.querySelector('[data-ps="chip"]')) return;
    pb.insertAdjacentElement('afterend', window.PlaySpeed.chip('ps-light'));
  }
  var PBASE = (document.currentScript && document.currentScript.src || '').replace(/[^\/]*$/, '');
  function phEnsure(cb) {
    if (WP.macro) return cb();
    var s = document.querySelector('script[data-macro]') || document.querySelector('script[src$="macro.js"]');
    if (!s) { s = document.createElement('script'); s.src = PBASE + 'macro.js'; s.setAttribute('data-macro', '1'); document.body.appendChild(s); }
    s.addEventListener('load', function () { cb(); });
    s.addEventListener('error', function () { cb(); });
  }
  function phLazy(host, fn) {
    var done = false;
    function go() { if (done) return; done = true; phEnsure(function () { if (WP.macro) fn(); else host.style.minHeight = ''; }); }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); go(); } }, { rootMargin: '240px 0px' });
      io.observe(host);
    } else go();
  }
  var PH = WP._whP = { ctx: null, host: null, st: null, res: null, strands: [], bonds: null, far: [], built: false };
  var PH_R = 0.62, PH_X = 0, PH_Z = 1.55, PH_Y0 = -6, PH_Y1 = 6, PH_LY = 0.5, PH_LR = 1.0;   // the hero vessel and the lens
  function phSpeed() { var E = PH.res ? Math.max(0, PH.res.E) : 2; return 0.3 * E; } // DERIVED: 0.3 units s-1 per mmol m-2 s-1
  function phStretch() { var p = PH.res ? PH.res.psi.stem : -0.5; return 1 + 0.07 * Math.min(2.5, Math.max(0, -p)); }
  function phBuild(ctx) {
    var T = ctx.THREE, M = WP.macro, mats = ctx.mats;
    var G = function (g) { ctx.disp.push(g); return g; };
    // bark and phloem: the back half of a cylinder shell, seen from inside
    mats.bark = M.glass(T, 0x4a3a1e, { opacity: 0.7, roughness: 0.6, ccr: 0.1, emissive: 0x140e04, ei: 0.6, rimColor: 0xc89a50, rimK: 0.5, side: T.DoubleSide, env: 0.15 });
    var bark = new T.Mesh(G(new T.CylinderGeometry(3.7, 3.7, 16, 36, 1, true, Math.PI / 2, Math.PI)), mats.bark); ctx.far.add(bark);
    mats.phl = M.glass(T, 0x355e22, { opacity: 0.45, roughness: 0.4, emissive: 0x0e2408, ei: 0.8, rimColor: 0x9cd870, rimK: 0.45, side: T.DoubleSide, env: 0.2 });
    var phl = new T.Mesh(G(new T.CylinderGeometry(3.25, 3.25, 16, 36, 1, true, Math.PI / 2, Math.PI)), mats.phl); ctx.far.add(phl);
    // pith: soft rounded cells stacked in the centre (behind the hero vessel)
    var pithG = G(M.superEllipsoid(0.62, 0.5, 0.55, 0.7, 10, 7));
    mats.pith = M.glass(T, 0xcfc49a, { opacity: 0.38, roughness: 0.25, emissive: 0x1c180a, ei: 0.4, rimColor: 0xf0e2b0, rimK: 0.45 });
    var pith = new T.InstancedMesh(pithG, mats.pith, 36), m4 = new T.Matrix4(), k = 0;
    for (var py = -6.5; py < 6.6 && k < 36; py += 1.05) for (var px = -0.6; px <= 0.61 && k < 36; px += 1.2) { m4.makeTranslation(px + (k % 3) * 0.05, py + (px > 0 ? 0.5 : 0), -1.1); pith.setMatrixAt(k++, m4); }
    pith.count = k; ctx.root.add(pith);
    // a ring of xylem vessels around the pith (back half and sides), water inside, far ones blurred
    mats.vw = M.glass(T, 0xdfeeff, { opacity: 0.22, roughness: 0.04, ccr: 0.02, emissive: 0x0a1622, ei: 0.5, rimColor: 0xcfe6ff, rimK: 1.1, env: 0.7 });
    mats.water = M.glass(T, 0x3f8fd8, { opacity: 0.3, roughness: 0.05, emissive: 0x0e3f78, ei: 1.0, rimColor: 0x7fc8ff, rimK: 0.6, rim: true });
    var ring = [[-2.15, 0.5, 0.42], [-1.85, -0.75, 0.36], [-1.0, -1.7, 0.4], [0.1, -2.05, 0.34], [1.15, -1.65, 0.42], [1.95, -0.7, 0.36], [2.2, 0.55, 0.44], [-2.55, -0.2, 0.26], [2.6, -0.1, 0.28]];
    var vG = G(new T.CylinderGeometry(1, 1, 16, 18, 1, true)), wG = G(new T.CylinderGeometry(1, 1, 16, 14, 1, true));
    PH.farDots = [];
    ring.forEach(function (v, i) {
      var g = new T.Group(); g.position.set(v[0], 0, v[1]);
      var wall = new T.Mesh(vG, mats.vw); wall.scale.set(v[2], 1, v[2]); g.add(wall);
      var wat = new T.Mesh(wG, mats.water); wat.scale.set(v[2] * 0.9, 1, v[2] * 0.9); g.add(wat);
      (v[1] < -1.2 ? ctx.far : ctx.root).add(g);
      for (var d = 0; d < 9; d++) PH.farDots.push({ x: v[0] + (Math.random() - 0.5) * v[2] * 0.8, z: v[1] + (Math.random() - 0.5) * v[2] * 0.6, y: PH_Y0 + Math.random() * (PH_Y1 - PH_Y0), r: v[2] });
    });
    // fibres between the vessels: thin glassy rods
    var fG = G(new T.CylinderGeometry(0.11, 0.11, 16, 6, 1, true));
    mats.fib = M.glass(T, 0x9c8a50, { opacity: 0.35, roughness: 0.3, emissive: 0x201a08, ei: 0.5, rimColor: 0xfff0c0, rimK: 0.5 });
    [[-1.45, 0.3], [-1.5, -1.1], [-0.35, -1.95], [0.7, -1.95], [1.65, -1.2], [1.6, 0.25], [-2.7, 0.7], [2.75, 0.75]].forEach(function (f) { var r = new T.Mesh(fG, mats.fib); r.position.set(f[0], 0, f[1]); ctx.root.add(r); });
    var dots = PH.farDots.map(function (d) { return [d.x, d.y, d.z]; });
    PH.dotPts = M.balls(T, dots, 0xd9402f, 0.16); ctx.root.add(PH.dotPts); ctx.disp.push(PH.dotPts.geometry, PH.dotPts.material);

    // the hero vessel: glass wall, end walls with an open ring (simple perforation plate), bordered pits
    mats.hv = M.glass(T, 0xf2f8ff, { opacity: 0.26, roughness: 0.02, ccr: 0.0, emissive: 0x10202e, ei: 0.5, rimColor: 0xeaf6ff, rimK: 1.7, rimPow: 3.2, env: 1.0 });
    var hv = new T.Mesh(G(new T.CylinderGeometry(PH_R, PH_R, 16, 32, 1, true)), mats.hv); hv.position.set(PH_X, 0, PH_Z); ctx.root.add(hv);
    mats.hw = M.glass(T, 0x4aa0ec, { opacity: 0.2, roughness: 0.04, emissive: 0x0d4a8a, ei: 1.1, rimColor: 0x9ad8ff, rimK: 0.6 });
    var hw = new T.Mesh(G(new T.CylinderGeometry(PH_R * 0.93, PH_R * 0.93, 16, 28, 1, true)), mats.hw); hw.position.copy(hv.position); ctx.root.add(hw);
    mats.plate = M.glass(T, 0xfff2d8, { opacity: 0.55, roughness: 0.2, emissive: 0x3a2a10, ei: 0.6, rimColor: 0xffe4b0, rimK: 0.8 });
    var plG = G(new T.TorusGeometry(PH_R * 0.94, 0.06, 6, 28)); plG.rotateX(Math.PI / 2);
    [-4.4, -0.6, 3.2].forEach(function (y) { var pl = new T.Mesh(plG, mats.plate); pl.position.set(PH_X, y, PH_Z); ctx.root.add(pl); });
    // bordered pits: a raised ring (the border) around a dark slit aperture, in rows on the vessel wall (FPP: larger, readable)
    mats.pit = M.glass(T, 0xffe2a8, { opacity: 0.85, roughness: 0.12, emissive: 0x4a3410, ei: 0.7, rimColor: 0xfff2d0, rimK: 0.9, depthWrite: true });
    mats.pitA = new T.MeshBasicMaterial({ color: 0x1a1206, transparent: true, opacity: 0.85 });
    var pitG = G(new T.SphereGeometry(1, 10, 3, 0, Math.PI * 2, 0, Math.PI / 2)), apG = G(new T.CircleGeometry(1, 12));
    pitG.rotateX(Math.PI / 2);   // a low dome facing outward (+z before the per pit rotation)
    var NP = 120, pits = new T.InstancedMesh(pitG, mats.pit, NP), aps = new T.InstancedMesh(apG, mats.pitA, NP), q = new T.Quaternion(), e = new T.Euler(), n = 0;
    for (var yy = -5.8; yy < 6 && n < NP; yy += 0.42) {
      [-1.25, -0.62, 0.62, 1.25].forEach(function (a0, ci) {
        if (n >= NP) return;
        var a = a0 + ((Math.round(yy / 0.42) % 2) ? 0.16 : -0.16), x = PH_X + Math.sin(a) * PH_R * 1.01, z = PH_Z + Math.cos(a) * PH_R * 1.01;
        q.setFromEuler(e.set(0, a, 0));
        m4.compose(new T.Vector3(x, yy, z), q, new T.Vector3(0.085, 0.06, 0.035)); pits.setMatrixAt(n, m4);
        m4.compose(new T.Vector3(x + Math.sin(a) * 0.037, yy, z + Math.cos(a) * 0.037), q, new T.Vector3(0.045, 0.011, 1)); aps.setMatrixAt(n, m4);
        n++;
      });
    }
    pits.count = n; aps.count = n; ctx.root.add(pits); ctx.root.add(aps);
    // the magnifying lens: molecules are drawn only inside it, about 20,000 times too large (FPP)
    mats.lens = M.glass(T, 0xffd27a, { opacity: 0.95, roughness: 0.08, ccr: 0.02, emissive: 0x5a3c08, ei: 0.8, rimColor: 0xfff0c0, rimK: 0.9, depthWrite: true, env: 0.9 });
    mats.lensG = M.glass(T, 0xeaf6ff, { opacity: 0.07, roughness: 0.02, emissive: 0x0a1420, ei: 0.4, rimColor: 0xffffff, rimK: 1.2 });
    PH.lens = new T.Group(); PH.lens.position.set(PH_X, PH_LY, PH_Z + 1.25);
    PH.lens.add(new T.Mesh(G(new T.TorusGeometry(PH_LR, 0.05, 10, 48)), mats.lens));
    PH.lens.add(new T.Mesh(G(new T.CircleGeometry(PH_LR, 40)), mats.lensG));
    ctx.root.add(PH.lens);
    // outside the lens the sap is drawn as faint drifting specks at the same model speed
    PH.specks = []; for (var sk = 0; sk < 26; sk++) PH.specks.push({ x: PH_X + (Math.random() - 0.5) * PH_R * 1.3, z: PH_Z + (Math.random() - 0.5) * PH_R * 0.8, y: PH_Y0 + Math.random() * (PH_Y1 - PH_Y0) });
    PH.speckPts = M.balls(T, PH.specks.map(function (d) { return [d.x, d.y, d.z]; }), 0xbfe4ff, 0.09); ctx.root.add(PH.speckPts); ctx.disp.push(PH.speckPts.geometry, PH.speckPts.material);
    // out of focus fibres in front of the lens (near layer) frame the vessel
    mats.fibN = M.glass(T, 0xb8a060, { opacity: 0.55, roughness: 0.3, emissive: 0x2a2008, ei: 0.6, rimColor: 0xfff0c0, rimK: 0.6 });
    [[-2.6, 4.2], [2.9, 3.9]].forEach(function (f) { var rr = new T.Mesh(G(new T.CylinderGeometry(0.3, 0.3, 16, 12, 1, true)), mats.fibN); rr.position.set(f[0], 0, f[1]); ctx.near.add(rr); });

    // the column: three strands of water molecules (centre faster), joined by hydrogen bond dashes
    mats.mol = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.28, emissive: 0x000000 });
    var offs = [[-0.27, 0.12, 0.82], [0, -0.05, 1.0], [0.27, 0.1, 0.82]];
    PH.strands = offs.map(function (o, si) { return { dx: o[0], dz: o[1], k: o[2], n: 0, s: si * 0.13 }; });
    PH.per = 30; PH.N = PH.per * 3;
    PH.mol = new T.InstancedMesh(G(M.waterGeo(T, 0.1, true)), mats.mol, PH.N); PH.mol.frustumCulled = false; ctx.root.add(PH.mol);
    var bg = new T.BufferGeometry(); PH.bondArr = new Float32Array(PH.N * 6); bg.setAttribute('position', new T.BufferAttribute(PH.bondArr, 3)); G(bg);
    mats.bond = new T.LineDashedMaterial({ color: 0xffffff, dashSize: 0.06, gapSize: 0.05, transparent: true, opacity: 0.8 });
    PH.bonds = new T.LineSegments(bg, mats.bond); PH.bonds.frustumCulled = false; ctx.root.add(PH.bonds);
    PH.glow = M.halos(T, PH.per, 0x9fdcff, 0.9); ctx.root.add(PH.glow.obj); ctx.disp.push(PH.glow.geo, PH.glow.mat);
    PH.dash = M.halos(T, PH.N * 2, 0xffffff, 0.16); PH.dash.mat.opacity = 1; ctx.root.add(PH.dash.obj); ctx.disp.push(PH.dash.geo, PH.dash.mat);
    PH.ph = 0;
    phLabels(ctx);
  }
  function phFrame(ctx, t, dt) {
    var T = ctx.THREE, v = phSpeed(), str = phStretch(), sp = 0.4 * str, span = PH_Y1 - PH_Y0;
    if (dt > 0) PH.ph += dt;
    var mtx = PH._m || (PH._m = new T.Matrix4()), q = PH._q || (PH._q = new T.Quaternion()), e = PH._e || (PH._e = new T.Euler()), p = PH._p || (PH._p = new T.Vector3()), one = PH._o || (PH._o = new T.Vector3(1, 1, 1));
    var bi = 0, A = PH.bondArr, prev = null, cam = ctx.camera;
    var HN = WP.heroNames ? (PH.hn || (PH.hn = WP.heroNames(ctx))) : null, keys = PH.keys || (PH.keys = []);
    if (HN) HN.begin();
    // the lens faces the camera; molecules show only inside its circle on screen
    PH.lens.lookAt(cam.position);
    cam.updateMatrixWorld(); cam.matrixWorldInverse.copy(cam.matrixWorld).invert();
    var c0 = (PH._c0 || (PH._c0 = new T.Vector3())).copy(PH.lens.position).project(cam);
    var rgt = (PH._rg || (PH._rg = new T.Vector3())).set(1, 0, 0).applyQuaternion(cam.quaternion).multiplyScalar(PH_LR).add(PH.lens.position).project(cam);
    var w2 = ctx.w / 2, h2 = ctx.h / 2, rpx = Math.hypot((rgt.x - c0.x) * w2, (rgt.y - c0.y) * h2) * 0.9, pv = PH._pv || (PH._pv = new T.Vector3());
    function inLens(x, y, z) { pv.set(x, y, z).project(cam); return Math.hypot((pv.x - c0.x) * w2, (pv.y - c0.y) * h2) < rpx; }
    PH.strands.forEach(function (S, si) {
      if (dt > 0) S.s += v * S.k * dt;
      prev = null;
      for (var j = 0; j < PH.per; j++) {
        var idx = si * PH.per + j;
        if (j * sp >= span) { mtx.makeScale(0, 0, 0); PH.mol.setMatrixAt(idx, mtx); if (si === 1) PH.glow.hide(j); PH.dash.hide(2 * idx); PH.dash.hide(2 * idx + 1); continue; }
        var y = PH_Y0 + (((j * sp + S.s) % span) + span) % span;
        var wob = 0.035 * Math.sin(j * 1.7 + si * 2 + PH.ph * 1.1);
        var x = PH_X + S.dx + wob, z = PH_Z + S.dz + 0.03 * Math.cos(j * 2.3 + si);
        if (!inLens(x, y, z)) { mtx.makeScale(0, 0, 0); PH.mol.setMatrixAt(idx, mtx); if (si === 1) PH.glow.hide(j); PH.dash.hide(2 * idx); PH.dash.hide(2 * idx + 1); prev = null; continue; }
        q.setFromEuler(e.set(0.4 * Math.sin(j + si), j * 0.9 + si, 0.3 * Math.cos(j * 1.3)));
        mtx.compose(p.set(x, y, z), q, one); PH.mol.setMatrixAt(idx, mtx);
        if (si === 1) PH.glow.set(j, x, y, z + 0.02);
        // 13 Oct (slow and named): H₂O under one or two molecules in the lens (1 on phones); the key is the slot, kept until it wraps
        if (HN && si !== 1) { var ky = keys[idx]; if (!ky || y < ky.y) ky = keys[idx] = {}; ky.y = y; HN.add('w', ky, 'H₂O', x, y, z + 0.06, 0.1); }
        if (prev && Math.abs(prev[1] - y) < sp * 1.5) { A[bi++] = prev[0]; A[bi++] = prev[1] + 0.09; A[bi++] = prev[2]; A[bi++] = x; A[bi++] = y - 0.09; A[bi++] = z;
          PH.dash.set(2 * idx, prev[0] + (x - prev[0]) * 0.36, prev[1] + (y - prev[1]) * 0.36, (prev[2] + z) / 2 + 0.06); PH.dash.set(2 * idx + 1, prev[0] + (x - prev[0]) * 0.64, prev[1] + (y - prev[1]) * 0.64, (prev[2] + z) / 2 + 0.06); }
        else { PH.dash.hide(2 * idx); PH.dash.hide(2 * idx + 1); }
        prev = [x, y, z];
      }
    });
    if (HN) HN.end();
    for (; bi < A.length; bi++) A[bi] = 0;
    PH.bonds.geometry.attributes.position.needsUpdate = true; PH.bonds.computeLineDistances();
    ctx.mats.bond.opacity = Math.max(0.35, 0.9 - 0.18 * (str - 1) / 0.07);
    PH.mol.instanceMatrix.needsUpdate = true; PH.glow.commit(); PH.dash.commit();
    PH.dash.mat.opacity = Math.max(0.3, 1 - 0.25 * (str - 1) / 0.07);
    // the other vessels: a sprinkle of molecules moving at the same model speed
    var pa = PH.dotPts.geometry.attributes.position;
    PH.farDots.forEach(function (d, i) { if (dt > 0) { d.y += v * 0.8 * dt; if (d.y > PH_Y1) d.y -= span; } pa.setY(i, d.y); });
    pa.needsUpdate = true;
    var sa = PH.speckPts.geometry.attributes.position;
    PH.specks.forEach(function (d, i) { if (dt > 0) { d.y += v * dt; if (d.y > PH_Y1) d.y -= span; } sa.setY(i, inLens(d.x, d.y, d.z) ? 1e4 : d.y); });
    sa.needsUpdate = true;
  }
  function phLabels(ctx) {
    var T = ctx.THREE;
    ctx.setLabels([
      { id: 'up', text: 'up to the leaves', tier: 1, pos: new T.Vector3(PH_X + 0.3, 3.2, PH_Z + 0.4) },
      { id: 'ln', text: 'lens: molecules about 20,000 times enlarged', tier: 1, side: 'right', pos: new T.Vector3(PH_X + PH_LR + 0.05, PH_LY + 0.9, PH_Z + 1.25) },
      { id: 'hv', text: 'xylem vessel, water under tension', tier: 1, pos: new T.Vector3(PH_X - PH_R * 0.7, -1.1, PH_Z + 0.45) },
      { id: 'pl', text: 'end wall, open (perforation plate)', tier: 2, pos: new T.Vector3(PH_X + 0.6, -4.4, PH_Z), narrow: false },
      { id: 'pt', text: 'bordered pits', tier: 2, pos: new T.Vector3(PH_X - 0.55, -3.6, PH_Z + 0.25), narrow: false },
      { id: 'ri', text: 'more vessels', tier: 2, pos: new T.Vector3(2.2, 2.0, 0.55), narrow: false },
      { id: 'ph', text: 'pith', tier: 3, pos: new T.Vector3(0.65, -1.9, -0.6), narrow: false },
      { id: 'bk', text: 'bark and phloem', tier: 2, pos: new T.Vector3(-3.3, 1.4, -1.2) }
    ]);
  }
  function phCamera(ctx, t) {
    var a = ctx.reduced ? 0.18 : 0.18 + 0.14 * Math.sin(t * 0.08), R = ctx.narrow ? 15 : 12.5 + 0.8 * Math.sin(t * 0.05);
    var lx = ctx.narrow ? 0 : -2.0;
    ctx.camera.position.set(lx + Math.sin(a) * R, 0.9 + 0.3 * Math.sin(t * 0.06), Math.cos(a) * R);
    ctx.camera.lookAt(lx, ctx.narrow ? 0.1 : 0.2, 0.4);
  }
  function phTheme(ctx) {
    var m = ctx.mats, d = ctx.dark;
    if (m.hw) { m.hw.emissiveIntensity = d ? 1.6 : 1.0; m.water.emissiveIntensity = d ? 1.5 : 0.9; m.hv.emissiveIntensity = d ? 0.9 : 0.5; }
    if (PH.glow) PH.glow.mat.opacity = d ? 0.95 : 0.6;
  }
  function phLive() {
    if (!PH.ctx || !PH.res) return;
    var res = PH.res, st = PH.st, nb = ' ';
    var where = ({ grape: 'grapevine stem', almond: 'almond trunk', romaine: 'romaine core' })[st && st.crop] || 'stem';
    var moving = res.E < 0.15 ? 'column nearly still' : 'column rising';
    PH.ctx.setLive('<span style="white-space:nowrap">' + where + '</span> · <span style="white-space:nowrap">E ' + num(res.E, 2) + nb + 'mmol' + nb + 'm⁻²' + nb + 's⁻¹</span> · <span style="white-space:nowrap">stem Ψ ' + WP.fmt.psi(res.psi.stem) + '</span> · <span style="white-space:nowrap">' + moving + '</span>');
  }
  function phInit(host) {
    PH.host = host;
    phLazy(host, function () {
      if (PH.ctx) return;
      host.style.minHeight = '';
      PH.ctx = WP.macro.hero(host, {
        id: 'p2-hero', seed: 17, fov: 30, fogNear: 12, fogFar: 26, exposure: 1.0,
        label: 'A stem cut lengthwise: a glassy shell of bark and phloem, a soft pith, a ring of xylem vessels and, in front, one vessel holding a column of water molecules joined by hydrogen bonds. The column rises toward the leaves at a speed set by transpiration; open end walls and small pits mark the vessel wall.',
        question: 'How does water climb a stem with no pump?',
        answer: 'It is pulled from the top. Water evaporates inside the leaves, and because water molecules cling to each other (cohesion, the hydrogen bonds drawn as dashes) and to the vessel walls (adhesion), the column follows from below, under tension: the sap here sits at a negative pressure. The open end walls let it pass from one vessel element to the next, and pits let it cross into neighbouring vessels. Close the stomata or turn off the light and the column slows almost to a stop. The lens is a reminder of scale: the molecules inside it are drawn about 20,000 times larger than real water molecules, which are about 0.3 nm across.',
        credit: { text: 'Venturas et al. · Journal of Integrative Plant Biology 2017', doi: '10.1111/jipb.12534' },
        capAlign: 'left', lift: function (ctx) { return ctx.narrow ? 80 : 0; },
        palette: { light: { top: '#1f2a14', mid: '#3e4a24', bot: '#6c5a32', bokeh: ['#f4e6b4', '#a9c87a', '#ffd98a', '#8fbfe0'], fog: 0x3e4a24, fg: 'rgba(220,200,140,.4)' } },
        height: function (w) { return w < 600 ? 520 : Math.round(Math.min(680, Math.max(460, w * 0.66))); }, // 13 Oct (slow and named): larger
        fallbackNote: 'This 3D stem needs WebGL, which this browser does not offer. The plant circuit and the cohesion theatre below show the same pull.',
        build: phBuild, frame: phFrame, camera: phCamera, theme: phTheme
      });
      phLive();
    });
  }
  /* gate and tree (13 Oct 2026, TREE BUILDER): the Plant plate hero is now WP.tree3d (journey/tree3d.js), a 3D almond tree with
     Water, + Sugars and + Signals layers. Without WebGL, or if tree3d.js is missing, the glassy stem hero above is used. */
  var T3C = null;
  function treeInit(host) {
    if (WP.tree3d && WP.tree3d.supported && WP.tree3d.supported()) {
      T3C = WP.tree3d.mount(host, { context: 'plant', onFail: function () { T3C = null; phInit(host); } });
      if (T3C) return;
    }
    phInit(host);
  }
  function phUpd(st, res) {
    if (T3C) T3C.update();
    if (!RT.on && /^#plant\b/.test(location.hash || '')) RT.on = true;
    railTag();
    PH.st = st; PH.res = res;
    if (PH.ctx) { phLive(); PH.ctx.invalidate(); }
  }

  WP.levels.push({ id: 'plant', n: 2, title: 'The Plant', subtitle: 'the whole plant as one circuit', scale: '1 m', focus: [72, 26], mount: mount, update: update, show: show, hide: hide });
})();

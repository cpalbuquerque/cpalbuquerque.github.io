/* The Water Path v8: lh_kit.js (journey builder, 13 Oct 2026)
   Shared pieces for the leaf hydraulics additions on Water II (Plant), III (Organ), IV (Tissue) and VI (Species):
   sources and evidence entries, two How to measure cards (imposing drought; the vacuum method), small SVG chart helpers
   and the CSS for the new blocks. Every number here comes from night/sheets/scoffoni_talk.json or water_species.json,
   or from PubMed records retrieved on 13 Oct; papers are credited by authors, year, journal and DOI only.
   Loaded after shell.js; the plate files call WP.lh at mount time. */
(function () {
  'use strict';
  var WP = window.WP = window.WP || {};
  var M = '−';
  var LH = WP.lh = WP.lh || {};
  LH.M = M;

  /* ------------------------------------------------------------ sources (only papers retrieved this build) */
  if (WP.SPEC) {
    WP.SPEC.sources = WP.SPEC.sources || {};
    var S = WP.SPEC.sources;
    var add = function (doi, label) { if (!S[doi]) S[doi] = { label: label, status: 'VERIFIED' }; };
    add('10.1111/nph.16845', 'Yao, Nie, Turner, Li, Gao, Fang & Scoffoni 2021, New Phytologist 229: 230');
    add('10.1073/pnas.1522569113', 'Brodribb, Bienaimé & Marmottant 2016, PNAS 113: 4865');
    add('10.1111/nph.13846', 'Brodribb et al. 2016, New Phytologist 209: 1403');
    add('10.1038/nplants.2016.72', 'Scoffoni et al. 2016, Nature Plants 2: 16072');
    add('10.1093/jxb/err270', 'Scoffoni et al. 2012 (online 2011), Journal of Experimental Botany 63: 643');
    add('10.1104/pp.16.01643', 'Scoffoni et al. 2017, Plant Physiology 173: 1197');
    add('10.1104/pp.18.00743', 'Scoffoni et al. 2018, Plant Physiology 178: 1584');
    add('10.1111/pce.13722', 'Corso et al. 2020, Plant, Cell and Environment 43: 854');
    add('10.1093/jxb/eraa392', 'Albuquerque et al. 2020, Journal of Experimental Botany 71: 7286');
    // two authors (Scoffoni & Sack), as printed by the journal; PubMed PMID 28981777 also lists the handling editor D. Ort
    S['10.1093/jxb/erx252'] = { label: 'Scoffoni & Sack 2017, Journal of Experimental Botany 68: 4479', status: 'VERIFIED' };
  }

  /* ------------------------------------------------------------ evidence entries (open with the shared Evidence button) */
  WP.evidence = WP.evidence || {};
  var EV = {
    'lh.ox8': { claim: 'In eight species, the decline of conductance outside the xylem explained 75 to 100 % of the fall in Kleaf from mild stress to beyond turgor loss; at turgor loss it explained 86 to 100 % (mean 96 %).',
      cite: 'Scoffoni et al. 2017, Plant Physiology 173: 1197', doi: '10.1104/pp.16.01643',
      measured: 'Cercocarpus betuloides, Comarostaphylis diversifolia, Hedera canariensis, Lantana camara, Magnolia grandiflora, Malosma laurina, Quercus agrifolia, Salvia canariensis. Kleaf by the evaporative flux method; xylem conductance Kx by the vacuum pump method; Kox from 1 ÷ Kox = 1 ÷ Kleaf − 1 ÷ Kx; microCT of veins in four species.',
      fig: 'Abstract and Table 1 (author PDF). Values replotted as numbers; no figure reused.', badge: 'MEASURED' },
    'lh.p50table': { claim: 'P50 of Kleaf, Kox and Kx for eight species (MPa).',
      cite: 'Scoffoni et al. 2017, Plant Physiology 173: 1197, Table 1', doi: '10.1104/pp.16.01643',
      measured: 'Each P50 is the leaf water potential at which that conductance has fallen by half. Kx was on average 1.6 MPa more negative than Kleaf.',
      fig: 'Table 1, read from the authors’ PDF. Two rows (Lantana camara, Quercus agrifolia) match Table 2 of Scoffoni et al. 2012; the other six rows were not checked against a second copy.', badge: 'MEASURED' },
    'lh.xtlp': { claim: 'At turgor loss only 5 to 8.5 % of midrib conduits were embolised on average, and none in the minor veins.',
      cite: 'Scoffoni et al. 2017, Plant Physiology 173: 1197', doi: '10.1104/pp.16.01643',
      measured: 'In vivo microCT of leaves of Comarostaphylis diversifolia, Hedera canariensis, Lantana camara and Magnolia grandiflora.', fig: 'Results text (author PDF).', badge: 'MEASURED' },
    'lh.membrane': { claim: 'A spatially explicit leaf model pointed to lower membrane permeability as the cause of the outside xylem decline.',
      cite: 'Scoffoni et al. 2017, Plant Physiology 173: 1197', doi: '10.1104/pp.16.01643',
      measured: 'Model inference, not a direct measurement of membranes or aquaporins.', fig: 'Abstract', badge: 'OPEN QUESTION' },
    'lh.recovery': { claim: 'After leaves were dried past turgor loss and rehydrated for one hour, Kleaf rose 2.2 to 2.8 fold in 4 of 10 species, and recovered fully in only 2 (Comarostaphylis diversifolia, Magnolia grandiflora); 6 species showed no significant recovery.',
      cite: 'Scoffoni et al. 2012, Journal of Experimental Botany 63: 643', doi: '10.1093/jxb/err270',
      measured: 'Evaporative flux method after 1 h of rehydration with the petiole under water.', fig: 'Results (PubMed Central full text).', badge: 'MEASURED' },
    'lh.arab': { claim: 'In Arabidopsis thaliana (Col-0), 40 to 65 % of the decline in stomatal conductance was attributable to the decline in Kleaf, for leaves dried to less than 50 % stomatal closure.',
      cite: 'Scoffoni et al. 2018, Plant Physiology 178: 1584', doi: '10.1104/pp.18.00743',
      measured: 'A partition of the fitted curves of gs and Kleaf against leaf Ψ, with soil Ψ and VPD held fixed. About 70 % at a 30 % fall in gs, and above 40 % until gs had fallen by half. Static fitted curves, not a time stepping model.',
      fig: 'Discussion and Results (eScholarship PDF).', badge: 'MEASURED' },
    'lh.arabmodel': { claim: 'Modelling indicated that a Kleaf that falls with dehydration contributes strongly to stomatal closure, and improves performance, survival and water use efficiency during drought.',
      cite: 'Scoffoni et al. 2018, Plant Physiology 178: 1584', doi: '10.1104/pp.18.00743',
      measured: 'Whole plant model output, Arabidopsis thaliana Col-0.', fig: 'Abstract', badge: 'OPEN QUESTION' },
    'lh.corso': { claim: 'In wheat, the decline in Kleaf explained at most 9.1 % of stomatal closure.',
      cite: 'Corso et al. 2020, Plant, Cell and Environment 43: 854', doi: '10.1111/pce.13722',
      measured: 'Wheat leaves; leaf hydraulics and gas exchange during dehydration.', fig: 'As quoted on Water V, the Membrane.', badge: 'MEASURED' },
    'lh.meta': { claim: 'By the turgor loss point, Kleaf had declined on average by 57 to 80 % in flowering plants (angiosperms) and by 30 to 81 % in gymnosperms; at −1 MPa, by 19 to 54 % in flowering plants.',
      cite: 'Scoffoni & Sack 2017, Journal of Experimental Botany 68: 4479', doi: '10.1093/jxb/erx252',
      measured: 'Meta analysis of a global database of 310 species. The ranges span the means of different methods (evaporative flux, rehydration kinetics and others).',
      fig: 'Results (Sack lab PDF). Lineage mean Kleaf P50: angiosperms −2.4, gymnosperms −2.9, pteridophytes −1.6 MPa.', badge: 'MEASURED' },
    'lh.lantana': { claim: 'Lantana camara: Kleaf falls by half at −0.80 MPa and by 80 % at −1.41 MPa; turgor loss point −1.37 MPa; maximum Kleaf 11.4 mmol m⁻² s⁻¹ MPa⁻¹.',
      cite: 'Scoffoni et al. 2012, Journal of Experimental Botany 63: 643, Table 2', doi: '10.1093/jxb/err270',
      measured: 'Evaporative flux method; maximum likelihood vulnerability function. The same P50 appears in Table 1 of Scoffoni et al. 2017.',
      fig: 'Table 2. The curve on this page is a Weibull drawn through the published P50 and P80, with no loss at 0 MPa (DERIVED), not the paper’s own fitted function.', badge: 'MEASURED' },
    'lh.oak': { claim: 'Coast live oak, Quercus agrifolia: Kleaf falls by half at −2.40 MPa and by 80 % at −3.83 MPa; turgor loss point −3.00 MPa; maximum Kleaf 3.96 mmol m⁻² s⁻¹ MPa⁻¹.',
      cite: 'Scoffoni et al. 2012, Journal of Experimental Botany 63: 643, Table 2', doi: '10.1093/jxb/err270',
      measured: 'Evaporative flux method; maximum likelihood vulnerability function.',
      fig: 'Table 2. The curve on this page is a Weibull drawn through the published P50 and P80, with no loss at 0 MPa (DERIVED).', badge: 'MEASURED' },
    'lh.grape': { claim: 'Cabernet Sauvignon: Kleaf = 0.071 + 14.453 e^(2.302 Ψ), maximum 14.52 mmol m⁻² s⁻¹ MPa⁻¹; Kleaf halves at −0.30 MPa and falls 80 % by −0.71 MPa; turgor loss point −1.37 MPa.',
      cite: 'Albuquerque et al. 2020, Journal of Experimental Botany 71: 7286', doi: '10.1093/jxb/eraa392',
      measured: 'Evaporative flux method on Cabernet Sauvignon leaves, with gas exchange and microCT of the same cultivars.', fig: 'Fig. 6 fit and Table 2, redrawn from the equation.', badge: 'MEASURED' },
    'lh.optical': { claim: 'Within a leaf, vulnerability to embolism rose with vein size: the first embolism always appeared in the largest vein (the midrib) and the minor veins failed last.',
      cite: 'Brodribb, Bienaimé & Marmottant 2016, PNAS 113: 4865', doi: '10.1073/pnas.1522569113',
      measured: 'Optical vulnerability method (light transmitted through the veins of drying leaves) in species with very different leaf architecture, a fern among them.', fig: 'Abstract', badge: 'MEASURED' },
    'lh.optical2': { claim: 'Embolism in the leaf veins tracked the decline of Kleaf and came after stomatal closure, under severe water stress.',
      cite: 'Brodribb et al. 2016, New Phytologist 209: 1403', doi: '10.1111/nph.13846',
      measured: 'Optical method in four angiosperm species.', fig: 'Abstract', badge: 'MEASURED' },
    'lh.caraganaopt': { claim: 'In six Caragana species, discrete midrib embolisms did not appear until leaf Ψ reached −4.0 MPa; thresholds were −4.0 to −4.6 MPa for the midrib and −4.5 to −5.2 MPa for second order veins.',
      cite: 'Yao, Nie, Turner, Li, Gao, Fang & Scoffoni 2021, New Phytologist 229: 230', doi: '10.1111/nph.16845',
      measured: 'Optical vulnerability method, leaves of six Caragana species in a common garden.', fig: 'Results (PubMed Central full text).', badge: 'MEASURED' },
    'lh.caragana': { claim: 'Across 10 Caragana species, those from drier places had a higher maximum Kleaf (16.5 against 4.2 mmol m⁻² s⁻¹ MPa⁻¹), a more negative Kleaf P50 and turgor loss point, and a higher ratio of maximum Kleaf to maximum stomatal conductance; their stomata closed more tightly, driven by more ABA, which raised water use efficiency.',
      cite: 'Yao, Nie, Turner, Li, Gao, Fang & Scoffoni 2021, New Phytologist 229: 230', doi: '10.1111/nph.16845',
      measured: 'Ten Caragana species from about 110 to 1,400 mm mean annual rainfall, grown in one common garden; Kleaf by the evaporative flux method, gas exchange, ABA, pressure volume curves and vein anatomy.', fig: 'Abstract (PubMed) and Results (PubMed Central full text).', badge: 'MEASURED' },
    'lh.viburnum': { claim: 'Across 30 Viburnum species in one garden, Kleaf varied 18 fold (0.48 to 8.9 mmol m⁻² s⁻¹ MPa⁻¹) and correlated with Amax (r = 0.53) and gs (r = 0.42); species from hotter, drier ranges had more Kleaf per unit gs (r = 0.39).',
      cite: 'Scoffoni et al. 2016, Nature Plants 2: 16072', doi: '10.1038/nplants.2016.72',
      measured: 'Phylogenetically independent contrasts; Kleaf by the evaporative flux method; gas exchange at saturating light. Species values were not retrieved, so no scatter is drawn.', fig: 'Results (authors’ prepublication PDF).', badge: 'MEASURED' },
    'lh.dryhab': { claim: 'Dry habitat species, mostly California chaparral, had a lower turgor loss point (mean −2.71 against −1.74 MPa) and a more negative Kleaf P50 (−2.24 against −0.78 MPa) than moist habitat species.',
      cite: 'Scoffoni et al. 2012, Journal of Experimental Botany 63: 643', doi: '10.1093/jxb/err270',
      measured: 'Ten species, five from dry and five from moist habitats; evaporative flux method and pressure volume curves.', fig: 'Results', badge: 'MEASURED' }
  };
  Object.keys(EV).forEach(function (k) { WP.evidence[k] = EV[k]; });

  /* ------------------------------------------------------------ How to measure: two new cards */
  WP.howto = WP.howto || {};
  WP.howto.drought = { title: 'imposing a drought', what: 'four ways to dry a plant, and what each one tests', steps: [
    'Greenhouse dry down: stop watering potted plants and weigh the pots daily, so you know how much water is left; or hold pots at a target weight to keep a steady, milder stress. Measure predawn and midday Ψ with the pressure chamber; report Ψ, not days without water.',
    'Bench dehydration: cut shoots or leaves and let them dry in the lab, measuring Ψ and the trait (Kleaf, embolism) at each step. Fast and good for vulnerability curves, but it is not a drought: no roots, no soil, no acclimation.',
    'Field deficit irrigation: give the crop a fraction of its estimated water use and follow stem Ψ through the season. Real soil, real weather, slow onset; less control, more replicates needed.',
    'Growth chambers: hold light, temperature and VPD fixed so soil water is the only thing changing. Pots dry fast in small volumes, so choose the pot size with the plant size.',
    'Osmotica and hydroponics: PEG or mannitol lower the water potential of a nutrient solution. Easier to control, but the solutes can enter roots or limit oxygen, and nutrients stay available, so growth responses can differ from drying soil.'],
    watch: 'The rate of drying changes the answer: a slow dry down gives time for osmotic adjustment and ABA signalling that a fast one does not. Report the Ψ reached, the time it took, the pot volume and the VPD.',
    dois: ['10.1093/jxb/err270', '10.1111/nph.16845'],
    proto: { url: 'https://prometheusprotocols.net/experimental-design-and-analysis/experimental-treatments/drought-treatments/', label: 'Drought treatments (overview of soil drying, osmotica and hydroponics)' } };
  WP.howto.vacuum = { title: 'xylem only conductance, Kx, by the vacuum method', what: 'a leaf with its minor veins cut, pulled by a partial vacuum', steps: [
    'Cut the leaf under water and connect its petiole to a water source on a balance or flowmeter, so the flow into the leaf can be read.',
    'Make many small cuts through the minor veins across the lamina, so water leaves the opened veins directly and skips the living tissues outside the xylem.',
    'Seal the leaf in a vacuum flask and apply a series of partial vacuums; record the steady flow at each one.',
    'Kx is the slope of flow against the applied pressure, per leaf area and corrected to 25 °C. Then 1 ÷ Kox = 1 ÷ Kleaf − 1 ÷ Kx gives the outside xylem part, with Kleaf from the evaporative flux method on matching leaves.'],
    watch: 'This is a summary of the method as used by Scoffoni et al. 2017; read their Methods for the cut pattern and the vacuum steps. The cuts must open enough veins that the remaining resistance is the xylem only. No PrometheusWiki protocol for this method was found; the flowmeter page below builds the meter.',
    dois: ['10.1104/pp.16.01643'],
    proto: { url: 'https://prometheusprotocols.net/function/water-relations/hydraulic-conductance-and-conductivity/constructing-and-operating-a-hydraulics-flow-meter/', label: 'Constructing and operating a hydraulics flow meter (states it can be used for leaf hydraulics)' } };

  /* ------------------------------------------------------------ CSS for the new blocks */
  var cssDone = false;
  LH.css = function () {
    if (cssDone || !document.head) return; cssDone = true;
    var st = document.createElement('style'); st.id = 'lh-css';
    st.textContent =
      '.lh-sec{margin:26px 0 8px;border-top:1px solid var(--rule2);padding-top:14px}' +
      '.lh-sec>h3{font-family:var(--disp);font-weight:400;font-size:24px;margin:0 0 4px;color:var(--ink)}' +
      '.lh-sec>h3 .no{font-family:var(--ui);font-size:12px;letter-spacing:.08em;color:var(--ink2);margin-right:8px}' +
      '.lh-q{font-family:var(--text);font-style:italic;font-size:19px;margin:0 0 10px;color:var(--ink2)}' +
      '.lh-two{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:14px;align-items:start}' +
      '.lh-two.even{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}' +
      '@media (max-width:760px){.lh-two,.lh-two.even{grid-template-columns:minmax(0,1fr)}}' +
      '.lh-svg{width:100%;height:auto;display:block;font-family:var(--ui)}' +
      '.lh-svg .ax{stroke:var(--ink2);stroke-width:1}.lh-svg .gr{stroke:var(--rule2);stroke-width:1}' +
      '.lh-sec .lh-svg text,.lh-svg text{fill:var(--ink);font-size:15px;font-family:var(--ui)!important;font-style:normal}.lh-sec .lh-svg text.sm,.lh-svg text.sm{font-size:13.5px;fill:var(--ink2)}' +
      '.lh-svg .halo{paint-order:stroke;stroke:var(--paper);stroke-width:4px;stroke-linejoin:round}' +
      '.lh-cap{font-family:var(--ui);font-size:13.5px;line-height:1.5;color:var(--ink2);margin:6px 0 0}' +
      '.lh-read{font-family:var(--ui);font-size:14.5px;line-height:1.5;margin:8px 0 0}' +
      '.lh-read b{font-family:var(--mono);font-variant-numeric:tabular-nums}' +
      '.lh-sl{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:10px;align-items:center;font-family:var(--ui);font-size:14px;margin:8px 0}' +
      '.lh-sl input{width:100%;min-height:36px}.lh-sl output{font-family:var(--mono);min-width:6.5em;text-align:right}' +
      '@media (max-width:520px){.lh-sl{grid-template-columns:minmax(0,1fr) auto;row-gap:0}.lh-sl label{grid-column:1 / -1}}' +
      '.lh-poll .chip{margin:0}.lh-poll .bar{height:8px;background:var(--rule2);border-radius:4px;overflow:hidden;margin:2px 0 8px}' +
      '.lh-poll .bar i{display:block;height:100%;background:var(--accent)}' +
      '.lh-oq{border:1px solid var(--rule);border-left:4px solid var(--b-pp);background:var(--card);padding:12px 14px;margin:12px 0}' +
      '.lh-oq .tag{font-family:var(--ui);font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--b-pp)}' +
      '.lh-oq h4{margin:4px 0 6px;font-size:19px}' +
      '.lh-side{border:1px solid var(--rule2);padding:8px 10px;background:var(--paper)}.lh-side h5{margin:0 0 4px;font-family:var(--ui);font-size:14px}' +
      '.lh-side p{margin:0;font-size:15.5px}' +
      '.lh-tw{overflow-x:auto;max-width:100%}.lh-t{border-collapse:collapse;font-family:var(--ui);font-size:13.5px;min-width:100%}' +
      '.lh-t th,.lh-t td{border-bottom:1px solid var(--rule2);padding:4px 8px;text-align:left;white-space:nowrap}.lh-t td.n{font-family:var(--mono);text-align:right}' +
      '.lh-chips{margin:6px 0}.lh-ans{margin:8px 0 0;padding:8px 10px;border-left:3px solid var(--accent);background:var(--paper);font-size:16px}' +
      '.lh-key{display:flex;flex-wrap:wrap;gap:6px 14px;font-family:var(--ui);font-size:13px;color:var(--ink2);margin:4px 0}' +
      '.lh-key span{display:inline-flex;align-items:center;gap:6px}.lh-key svg{width:28px;height:10px}' +
      '.lh-mol{margin-top:8px}';
    document.head.appendChild(st);
  };

  /* ------------------------------------------------------------ helpers */
  LH.badge = function (k, t) { return WP.ui.badge(k, t); };
  LH.ev = function (key, label) {
    return '<button type="button" class="wpev" data-wpev="' + key + '" aria-expanded="false" title="Show the evidence behind this claim">' + (label || 'Evidence') + '</button>';
  };
  LH.num = function (x, d) { return WP.fmt.num(x, d); };
  LH.psi = function (x, d) { return WP.fmt.psi(x, d == null ? 2 : d); };
  LH.toggle = function (host) {
    host.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-lh-check]'); if (!b || !host.contains(b)) return;
      var a = host.querySelector('#' + b.getAttribute('aria-controls')); if (!a) return;
      var o = b.getAttribute('aria-expanded') === 'true';
      a.hidden = o; b.setAttribute('aria-expanded', o ? 'false' : 'true'); b.textContent = o ? 'Check' : 'Hide';
    });
  };
  var uid = 0;
  LH.check = function (q, ans, cls) {
    var id = 'lh-a' + (++uid);
    return '<div class="card ' + (cls || '') + '"><h4 style="margin:0 0 6px">Predict, then check</h4><p style="margin:0 0 8px">' + q + '</p>' +
      '<button type="button" class="btn small" data-lh-check aria-expanded="false" aria-controls="' + id + '">Check</button>' +
      '<p class="lh-ans" id="' + id + '" hidden>' + ans + '</p></div>';
  };
  /* a percent lost chart on a water potential axis.
     o = {W, H, xmin (negative), ymax 100, ylab, series:[{fn(psi)->%, col, w, dash, lab, labPsi, dy}], vlines:[{x, col, lab, dash}],
          band:{y0, y1, lab}, pts:[{x, y, col, lab, anchor, dy, shape}], cursor: psi} */
  LH.chart = function (o) {
    var W = o.W || 680, H = o.H || 330, L = 54, R = 16, T = 16, B = 46, xmin = o.xmin;
    function X(p) { return L + (W - L - R) * (p / xmin); }
    function Y(v) { return H - B - (H - B - T) * v / (o.ymax || 100); }
    var s = '<svg class="lh-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + (o.aria || 'Chart') + '">';
    for (var v = 0; v <= 100; v += 25) s += '<line class="gr" x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '"/><text class="sm" x="' + (L - 6) + '" y="' + (Y(v) + 4).toFixed(1) + '" text-anchor="end">' + v + '</text>';
    var step = Math.abs(xmin) > 3 ? 1 : 0.5;
    for (var p = 0; p >= xmin - 1e-9; p -= step) s += '<line class="ax" x1="' + X(p).toFixed(1) + '" x2="' + X(p).toFixed(1) + '" y1="' + (H - B) + '" y2="' + (H - B + 5) + '"/><text class="sm" x="' + X(p).toFixed(1) + '" y="' + (H - B + 18) + '" text-anchor="middle">' + (p === 0 ? '0' : M + Math.abs(p).toFixed(step < 1 ? 1 : 0)) + '</text>';
    s += '<line class="ax" x1="' + L + '" x2="' + (W - R) + '" y1="' + (H - B) + '" y2="' + (H - B) + '"/><line class="ax" x1="' + L + '" x2="' + L + '" y1="' + T + '" y2="' + (H - B) + '"/>';
    s += '<text class="sm" x="' + ((L + W - R) / 2) + '" y="' + (H - 6) + '" text-anchor="middle">' + (o.xlab || 'leaf water potential, MPa (drier →)') + '</text>';
    s += '<text class="sm" transform="translate(14 ' + ((T + H - B) / 2) + ') rotate(-90)" text-anchor="middle">' + (o.ylab || '% of Kleaf lost') + '</text>';
    if (o.band) s += '<rect x="' + L + '" width="' + (W - L - R) + '" y="' + Y(o.band.y1).toFixed(1) + '" height="' + (Y(o.band.y0) - Y(o.band.y1)).toFixed(1) + '" fill="var(--b-pp)" opacity=".12"/>';
    (o.vlines || []).forEach(function (l) {
      s += '<line x1="' + X(l.x).toFixed(1) + '" x2="' + X(l.x).toFixed(1) + '" y1="' + T + '" y2="' + (H - B) + '" stroke="' + l.col + '" stroke-width="1.6" stroke-dasharray="' + (l.dash || '5 4') + '"/>' +
        (l.lab ? '<text class="sm halo" x="' + (X(l.x) + 4).toFixed(1) + '" y="' + (T + 12 + (l.dy || 0)) + '" fill="' + l.col + '" style="fill:' + l.col + '">' + l.lab + '</text>' : '');
    });
    (o.series || []).forEach(function (sr) {
      var d = '', n = 120;
      for (var i = 0; i <= n; i++) { var q = xmin * i / n, y = Math.max(0, Math.min(100, sr.fn(q))); d += (i ? 'L' : 'M') + X(q).toFixed(1) + ',' + Y(y).toFixed(1); }
      s += '<path d="' + d + '" fill="none" stroke="' + sr.col + '" stroke-width="' + (sr.w || 3) + '"' + (sr.dash ? ' stroke-dasharray="' + sr.dash + '"' : '') + ' opacity="' + (sr.op == null ? 1 : sr.op) + '"/>';
      if (sr.lab) { var lp = sr.labPsi, ly = Math.max(0, Math.min(100, sr.fn(lp))); s += '<text class="halo" x="' + (X(lp) + 6).toFixed(1) + '" y="' + (Y(ly) + (sr.dy || -6)).toFixed(1) + '" style="fill:var(--ink);font-weight:600"><tspan style="fill:' + sr.col + '">● </tspan>' + sr.lab + '</text>'; } /* QV13: ink text, coloured dot (orange text on cream was 1.9:1) */
    });
    (o.pts || []).forEach(function (pt) {
      var x = X(pt.x), y = Y(pt.y);
      s += pt.shape === 'sq' ? '<rect x="' + (x - 5).toFixed(1) + '" y="' + (y - 5).toFixed(1) + '" width="10" height="10" fill="' + pt.col + '" stroke="var(--paper)" stroke-width="1.5"/>' :
        '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="6" fill="' + (pt.hollow ? 'var(--paper)' : pt.col) + '" stroke="' + pt.col + '" stroke-width="2.4"/>';
      if (pt.lab) s += '<text class="sm halo" x="' + (x + (pt.anchor === 'end' ? -9 : 9)).toFixed(1) + '" y="' + (y + (pt.dy || 4)).toFixed(1) + '" text-anchor="' + (pt.anchor || 'start') + '">' + pt.lab + '</text>';
    });
    /* QV13: band label drawn after the curves so its halo keeps it readable */
    if (o.band && o.band.lab) s += '<text class="sm halo" x="' + (W - R - 6) + '" y="' + (Y(o.band.y1) + 14).toFixed(1) + '" text-anchor="end">' + o.band.lab + '</text>';
    if (o.cursor != null) s += '<line x1="' + X(o.cursor).toFixed(1) + '" x2="' + X(o.cursor).toFixed(1) + '" y1="' + T + '" y2="' + (H - B) + '" stroke="var(--ink)" stroke-width="1.4"/>';
    return s + '</svg>';
  };
  /* logistic through a measured P50 and P80: PLC = 100 ÷ (1 + exp(a (Ψ − P50))), a = ln(0.25) ÷ (P80 − P50) (DERIVED) */
  /* Weibull through a measured P50 and P80, with no loss at 0 MPa (Q-science 13 Oct: the logistic gave 9 to 13 % loss at 0 MPa):
     K ÷ Kmax = exp(−(Ψ ÷ b)^c), c = ln(ln 5 ÷ ln 2) ÷ ln(P80 ÷ P50), b = P50 ÷ (ln 2)^(1 ÷ c) (DERIVED) */
  LH.weibull = function (p50, p80) { var c = Math.log(Math.log(5) / Math.log(2)) / Math.log(p80 / p50), b = p50 / Math.pow(Math.log(2), 1 / c);
    return function (x) { return x >= 0 ? 0 : 100 * (1 - Math.exp(-Math.pow(x / b, c))); }; };
  LH.logistic = function (p50, p80) { var a = Math.log(0.25) / (p80 - p50); return function (x) { return 100 / (1 + Math.exp(a * (x - p50))); }; };
  /* Cabernet Sauvignon measured fit (Albuquerque et al. 2020): percent of Kleaf lost */
  LH.grapeLost = function (x) { return 100 * (1 - (0.071 + 14.453 * Math.exp(2.302 * x)) / 14.524); };
  LH.narrow = function (el) { var w = el && el.clientWidth ? el.clientWidth : (window.innerWidth || 1200) - 40; return w < 600; };
})();

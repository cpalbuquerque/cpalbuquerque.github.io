/* Light to Sugar, Plate II: The Leaf (L1 owner). Round 1.
   2.1 photons into a leaf cross section (collimated vs diffuse, sun vs shade, colour, drawing or the lab micrograph) with a Monte Carlo
       light model (window.LOSIM, node testable); 2.2 absorption with depth vs carbon fixation; 2.3 light response curve from the shared
       engine (LP) with compensation point, quantum efficiency and saturation, plus a gas exchange window; 2.4 blue dose data
       (Hogewoning et al. 2010 Table 1); cases, Expert, questions and the Test yourself set. */
/* Leaf optics Monte Carlo (shared with l_leafoptics.js). Units: µm. z = depth below the top of the cuticle. */
var LOSIM = (function () {
  'use strict';
  function rng(seed) { var s = seed >>> 0 || 1; return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
  /* in vivo absorption coefficient of chloroplast bearing cells, per µm (ILLUSTRATIVE shape of a green leaf) */
  var MU = [[380, .030], [400, .036], [430, .040], [450, .039], [480, .032], [500, .020], [520, .011], [550, .0066], [570, .0072], [590, .0095], [620, .0135], [645, .021], [670, .034], [685, .026], [695, .012], [705, .0045], [720, .0013], [740, .0006], [780, .0003]];
  var KMU = 1;
  function mu(l) {
    if (l <= MU[0][0]) return MU[0][1] * KMU;
    for (var i = 1; i < MU.length; i++) if (l <= MU[i][0]) { var a = MU[i - 1], b = MU[i], f = (l - a[0]) / (b[0] - a[0]); return KMU * (a[1] + f * (b[1] - a[1])); }
    return MU[MU.length - 1][1] * KMU;
  }
  /* anatomy, µm (ILLUSTRATIVE, typical proportions of a dicot leaf) */
  var KINDS = {
    sun: { ep: 16, pal: 92, spg: 104, lep: 14, cw: 13, gap: 4, rows: 1, chlS: 0.55 },
    shade: { ep: 14, pal: 38, spg: 80, lep: 12, cw: 22, gap: 3, rows: 1, chlS: 0.55 },
    grape: { ep: 26, pal: 42, spg: 64, lep: 14, cw: 10, gap: 3, rows: 1, chlS: 0.55 }
  };
  function build(kind, W, seed) {
    var K = KINDS[kind] || KINDS.sun, r = rng(seed || 7);
    var z0 = K.ep, z1 = K.ep + K.pal, z2 = z1 + K.spg, D = z2 + K.lep;
    var g = { kind: kind, W: W, D: D, ep: K.ep, pal0: z0, pal1: z1, spg1: z2, cw: K.cw, gap: K.gap, cols: [], circ: [], stomaX: W * 0.62, chl: [] };
    /* palisade columns: x ranges of cells, slight jitter in width; cells are rounded at the top and bottom */
    var x = r() * K.gap;
    while (x < W - 2) { var w = K.cw * (0.85 + 0.3 * r()); if (x + w > W) break; g.cols.push([x, x + w, z0 + 1 + r() * 3, z1 - 1 - r() * 4]); x += w + K.gap * (0.6 + 0.8 * r()); }
    /* spongy cells: random circles with air spaces; a substomatal cavity is kept clear above the stoma */
    var tries = 0, cav = { x: g.stomaX, z: z2 - 10, r: 20 };
    while (tries++ < 4000) {
      var rr = 7 + 7 * r(), cx = r() * W, cz = z1 + rr * 0.6 + r() * (K.spg - rr * 1.2);
      if (Math.hypot(cx - cav.x, cz - cav.z) < cav.r + rr) continue;
      var ok = true;
      for (var i = 0; i < g.circ.length && ok; i++) {
        var c = g.circ[i], dx = Math.abs(cx - c[0]); dx = Math.min(dx, W - dx);
        if (Math.hypot(dx, cz - c[1]) < rr + c[2] + 1.5) ok = false;
      }
      if (ok) g.circ.push([cx, cz, rr]);
    }
    /* chloroplasts (drawing only): along palisade walls and around spongy cells */
    g.cols.forEach(function (c) { for (var zz = c[2] + 6; zz < c[3] - 4; zz += 7) { g.chl.push([c[0] + 2.2, zz + r() * 2, 1]); g.chl.push([c[1] - 2.2, zz + 3 + r() * 2, 1]); } });
    g.circ.forEach(function (c) { var n = Math.max(3, Math.round(c[2] / 2.4)); for (var k = 0; k < n; k++) { var a = k / n * 6.283 + r(); g.chl.push([c[0] + (c[2] - 2.3) * Math.cos(a), c[1] + (c[2] - 2.3) * Math.sin(a), 0]); } });
    /* fast lookup of spongy circles by x bucket */
    g.bucket = []; var B = 20; g.B = B;
    for (var b = 0; b < Math.ceil(W / B); b++) g.bucket.push([]);
    g.circ.forEach(function (c, i) { var lo = Math.floor((c[0] - c[2]) / B), hi = Math.floor((c[0] + c[2]) / B); for (var b2 = lo; b2 <= hi; b2++) g.bucket[((b2 % g.bucket.length) + g.bucket.length) % g.bucket.length].push(i); });
    g.colAt = function (xx) { for (var i = 0; i < g.cols.length; i++) { var c = g.cols[i]; if (xx >= c[0] && xx <= c[1]) return c; } return null; };
    return g;
  }
  /* region at (x, z): 0 air above, 1 epidermis, 2 palisade cell, 3 palisade gap (air), 4 spongy cell, 5 spongy air, 6 lower epidermis, 7 below; stoma pore counts as air */
  function region(g, x, z) {
    if (z < 0) return 0;
    if (z < g.pal0) return 1;
    if (z < g.pal1) { var c = g.colAt(x); return (c && z >= c[2] && z <= c[3]) ? 2 : 3; }
    if (z < g.spg1) {
      var lst = g.bucket[Math.floor(x / g.B) % g.bucket.length];
      for (var i = 0; i < lst.length; i++) { var cc = g.circ[lst[i]], dx = Math.abs(x - cc[0]); dx = Math.min(dx, g.W - dx); if (dx * dx + (z - cc[1]) * (z - cc[1]) < cc[2] * cc[2]) return 4; }
      return 5;
    }
    if (z < g.D) return Math.abs(x - g.stomaX) < 3 ? 5 : 6;
    return 7;
  }
  var CHL = { 1: 0.02, 2: 1, 4: 0.62, 6: 0.02 };
  function cellish(k) { return k === 1 || k === 2 || k === 4 || k === 6; }
  /* one photon: state {x,z,dx,dz,l,alive,fate} */
  function launch(g, l, diffuse, r) {
    var s = diffuse ? (2 * r() - 1) * 0.985 : (2 * r() - 1) * 0.04;
    var p = { x: r() * g.W, z: -0.01, dx: s, dz: Math.sqrt(1 - s * s), l: l, mu: mu(l), alive: true, fate: null, k: 1, path: 0, az: null };
    /* surface reflection at the cuticle: a few % specular, more at grazing angles (ILLUSTRATIVE) */
    var rs = 0.04 + 0.25 * Math.pow(Math.abs(s), 6);
    if (r() < rs) { p.alive = false; p.fate = 'ref'; p.dz = -p.dz; p.spec = true; }
    p.k = region(g, p.x, 0.01);
    return p;
  }
  function stepP(g, p, ds, r) {
    if (!p.alive) return;
    var nx = p.x + p.dx * ds, nz = p.z + p.dz * ds;
    if (nx < 0) nx += g.W; else if (nx >= g.W) nx -= g.W;
    var k1 = region(g, nx, nz);
    if (k1 === 0) { p.alive = false; p.fate = 'ref'; p.x = nx; p.z = nz; return; }
    if (k1 === 7) { p.alive = false; p.fate = 'tra'; p.x = nx; p.z = nz; return; }
    var k0 = p.k;
    if (k1 !== k0) {
      /* crossing a wall or a cell to air interface */
      var intoAir = (k1 === 3 || k1 === 5) && cellish(k0);
      if (k0 === 2 && k1 === 3) {
        /* palisade side wall: total internal reflection for rays near the cell axis (light guide) */
        var cc0 = g.colAt(p.x);
        var side = cc0 && nz >= cc0[2] && nz <= cc0[3];
        if (side && Math.abs(p.dx) < 0.47) { p.dx = -p.dx; return; }
      }
      if (intoAir && (k0 === 4 || k0 === 2)) {
        /* cell to air: reflect back at steep angles, otherwise refract; spongy surfaces are rough */
        if (r() < (k0 === 4 ? 0.45 : 0.25)) { var a = r() * 6.2832; p.dx = Math.cos(a); p.dz = Math.sin(a); return; }
      }
      if ((k0 === 3 || k0 === 5) && cellish(k1) && k1 === 4) {
        if (r() < 0.5) { var b = r() * 6.2832; p.dx = Math.cos(b); p.dz = Math.sin(b); }
      }
    }
    p.x = nx; p.z = nz; p.k = k1; p.path += ds;
    var c = CHL[k1] || 0;
    if (c && r() < 1 - Math.exp(-p.mu * c * ds)) { p.alive = false; p.fate = 'abs'; p.az = nz; p.ak = k1; }
  }
  /* Monte Carlo statistics for a leaf, light geometry and wavelength */
  function stats(g, l, diffuse, n, seed) {
    var r = rng(seed || 11), NB = 14, bins = new Array(NB).fill(0), A = 0, R = 0, T = 0, pal = 0, spg = 0, other = 0, zs = 0;
    for (var i = 0; i < n; i++) {
      var p = launch(g, l, diffuse, r), guard = 0;
      while (p.alive && guard++ < 6000) stepP(g, p, 1, r);
      if (p.alive) { p.fate = 'abs'; p.az = p.z; p.ak = p.k; }
      if (p.fate === 'abs') { A++; zs += p.az; bins[Math.min(NB - 1, Math.max(0, Math.floor(p.az / g.D * NB)))]++; if (p.ak === 2) pal++; else if (p.ak === 4) spg++; else other++; }
      else if (p.fate === 'ref') R++; else T++;
    }
    return { abs: A / n, ref: R / n, tra: T / n, bins: bins.map(function (b) { return b / n; }), pal: A ? pal / A : 0, spg: A ? spg / A : 0, meanZ: A ? zs / A : 0, D: g.D, n: n };
  }
  return { rng: rng, mu: mu, MU: MU, setK: function (k) { KMU = k; }, KINDS: KINDS, build: build, region: region, launch: launch, step: stepP, stats: stats };
})();
if (typeof module !== 'undefined') module.exports = LOSIM;

/* ============================================================ Plate II: the leaf as an optical device */
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  var LP = window.LP = window.LP || {};
  var ui = LP.ui;
  if (!ui) { console.error('l_leafoptics.js: shell.js must load first'); return; }
  var S = window.LOSIM;
  var esc = ui.esc, num = ui.num, MINUS = '−';
  function sgn(x, d) { var s = num(Math.abs(x), d); return (x < 0 && Math.abs(x) >= Math.pow(10, -d) / 2 ? MINUS : '') + s; }
  function wl(l, dark) { return LP.optics && LP.optics.wlRGB ? LP.optics.wlRGB(l, dark) : (l < 500 ? '#3a5bd9' : l < 600 ? '#2f9e44' : l < 700 ? '#d8312a' : '#7a1020'); }

  /* ------------------------------------------------------------ evidence (plate keys; sheet keys come from evidence.js) */
  var EV = LP.evidence;
  if (!LP.sources['10.1093/jxb/eraa392']) LP.sources['10.1093/jxb/eraa392'] = 'Albuquerque C, Scoffoni C, Brodersen CR, Buckley TN, Sack L, McElrone AJ (2020) J Exp Bot 71:7286';
  EV['leaf.mc'] = { claim: 'The photon paths are a Monte Carlo model: each photon moves in 1 µm steps through a drawn leaf; inside cells with chloroplasts it can be absorbed with a probability set by its colour; palisade side walls reflect photons travelling close to the cell axis (light guides); cell to air surfaces in the spongy mesophyll scatter photons in new directions.', cite: 'Teaching model built for this site from the concepts of the leaf optics literature (light guides, sieve effect, scattering).', measured: 'none', value: 'absorption per µm: blue 0.039, green 0.0066, red 0.034, far red 0.0006 (palisade; spongy cells × 0.62)', badge: 'ILLUSTRATIVE', note: 'Coefficients were tuned so the whole leaf absorbs about 90 % of red and blue, about 65 to 75 % of green and well under 20 % of far red, the familiar shape of a green leaf. The depth profiles are the model’s, not measurements.' };
  EV['leaf.anat'] = { claim: 'Sun leaf: a palisade layer about 90 µm tall over about 100 µm of spongy mesophyll. Shade leaf: a palisade layer about 40 µm tall with wider cells, thinner overall. Stomata are drawn in the lower (abaxial) epidermis.', cite: 'Teaching anatomy with typical proportions; sun and shade differences follow the classic reviews.', doi: '10.1146/annurev.pp.28.060177.002035', measured: 'none', value: '', badge: 'ILLUSTRATIVE', note: 'Real thickness varies widely among species and with growth light.' };
  EV['leaf.photo'] = { claim: 'Toluidine blue light micrograph of a Cabernet Sauvignon leaf lamina: palisade on top, spongy mesophyll with air spaces below, a minor vein, lower epidermis at the bottom. Rotated so the upper surface faces up and cropped; the 100 µm bar is redrawn from the bar burned into the original image.', cite: 'Image: Albuquerque Lab (data of Albuquerque et al. 2020, J Exp Bot 71: 7286, doi 10.1093/jxb/eraa392).', doi: '10.1093/jxb/eraa392', measured: 'light microscopy, July 2016', value: '', badge: 'VERIFIED', note: 'The photon paths drawn on top are the model’s, not a measurement on this leaf.' };
  EV['leaf.hogTable'] = { claim: 'Cucumber grown at 100 µmol m⁻² s⁻¹ under seven red and blue LED mixes (0 to 100 % blue): dark adapted Fv/Fm, quantum yield for CO₂ fixation (α), dark respiration, the abaxial to adaxial stomatal conductance ratio, integrated leaf absorptance of the growth light and phytochrome PSS, as reported in Table 1.', cite: 'Hogewoning SW et al. (2010) J Exp Bot 61:3107 to 3117, Table 1 (read in PMC full text, PMC2892149).', doi: '10.1093/jxb/erq132', measured: 'gas exchange, PAM fluorescence, porometer, two integrating spheres', fig: 'Table 1', value: 'α 0.045, 0.052, 0.053, 0.053, 0.053, 0.048, 0.045; Fv/Fm 0.76 at 0 % blue, 0.80 to 0.81 otherwise; Rd 0.93 to 1.45 µmol m⁻² s⁻¹; absorptance 90.0 to 95.4 %; stomatal ratio 2.7 to 1.4', badge: 'VERIFIED', note: 'LMA, chlorophyll and N per area rose with blue up to 50 %, with the largest step from 0 to 7 % blue; those values are in a figure that was not read as numbers, so the site gives the direction only.' };
  EV['leaf.lrc'] = { claim: 'The light response curve is the site’s leaf model (Plate III and IV engine): electron transport as a non rectangular hyperbola of absorbed light feeding the Farquhar, von Caemmerer and Berry model, at the leaf temperature, CO₂ and O₂ set in Conditions.', cite: 'Farquhar, von Caemmerer and Berry (1980); parameters are teaching values.', doi: '10.1007/BF00386231', measured: 'model', value: 'Vcmax 60 sun, 30 shade µmol m⁻² s⁻¹ at 25 °C', badge: 'ILLUSTRATIVE', note: 'The compensation point, slope and saturation are read off the model curve, not measured.' };
  EV['leaf.gasScale'] = { claim: 'Drawing scale for the gas exchange window: molecules per second on screen = 0.6 × the model’s net CO₂ uptake in µmol m⁻² s⁻¹. One O₂ leaves for each net CO₂ fixed (a carbohydrate is made); a sugar appears for every six CO₂ fixed.', cite: 'Stoichiometry of CO₂ fixation into hexose.', measured: 'calculation', value: '0.6 molecules s⁻¹ per µmol m⁻² s⁻¹', badge: 'DERIVED' };
  EV['leaf.comstock1985'] = { claim: 'Two Santa Barbara chaparral Ceanothus species turned their leaves more vertical as the summer drought deepened (predawn Ψ fell from −0.1 to −7.8 MPa in C. megacarpus and −6.6 MPa in C. crassifolius, May to August 1981). The change was reversible. Simulations gave 6 % (C. megacarpus) and 20 % (C. crassifolius) less solar radiation absorbed in August, with slightly lower leaf temperature and transpiration from energy budgets.', cite: 'Comstock JP, Mahall BE (1985) Oecologia 65:531 to 535 (PubMed abstract read, PMID 28311861).', doi: '10.1007/BF00379668', measured: 'leaf inclination on marked leaves; pressure chamber; radiation interception simulated', value: '6 % and 20 % less radiation absorbed in August', badge: 'VERIFIED', note: 'The 6 and 20 % are modelled from measured angles, not measured absorptance.' };
  EV['leaf.bjorkman1987'] = { claim: 'Photon yield of O₂ evolution at saturating CO₂, per absorbed photon, in 37 unstressed C3 species: 0.106 ± 0.001 (mean ± SE); dark adapted Fv/Fm at 692 nm (77 K) 0.832 ± 0.004.', cite: 'Björkman O, Demmig B (1987) Planta 170:489 to 504 (PubMed abstract read, PMID 24233012).', doi: '10.1007/BF00402983', measured: 'O₂ electrode at saturating CO₂; 77 K fluorescence; 44 species', value: '0.106 O₂ per absorbed photon (C3)', badge: 'VERIFIED', note: 'Saturating CO₂ removes photorespiration, so 0.106 is the yield of the light reactions plus carbon reduction without the O₂ cost. It is an O₂ yield; CO₂ fixation yields at 21 % O₂ are lower.' };
  EV['leaf.oak'] = { claim: 'A coast live oak crown is drawn with sun leaves outside and shade leaves inside; the sun and shade leaf parameters are teaching values.', cite: 'No light response data for Quercus agrifolia were retrieved for this site.', measured: 'none', value: '', badge: 'ILLUSTRATIVE' };

  LP.howto['leaf.sphere'] = {
    title: 'leaf absorptance with an integrating sphere', what: 'reflectance, transmittance and absorptance, 400 to 800 nm',
    steps: [
      'Clamp a leaf disc over the port of an integrating sphere: a hollow ball coated inside with a white, almost perfectly scattering material.',
      'Shine a beam on the disc and read the light the sphere collects with a spectrometer: once with the disc on the entrance side (reflectance), once on the exit side (transmittance). Reference each against a white standard.',
      'Absorptance = 1 − reflectance − transmittance, wavelength by wavelength.',
      'Weight by the spectrum of the light you care about to get one number: for red and blue growth lights, cucumber leaves absorbed 90 to 95 %.'
    ],
    watch: 'Leaf discs that dry or curl, veins in the disc, and stray light at the port edges.',
    dois: ['10.1093/jxb/erq132']
  };
  LP.howto['leaf.lrc'] = {
    title: 'a light response curve with a gas exchange system (for example an LI-6800)', what: 'net CO₂ uptake A at a series of light levels',
    steps: [
      'Clamp a mature leaf in the chamber. Hold CO₂, temperature and humidity steady; start at high light and wait for A and stomatal conductance to settle.',
      'Step light down, for example 2000, 1500, 1000, 500, 200, 100, 50, 20, 0 µmol m⁻² s⁻¹, logging A once it is stable at each step (minutes, not seconds).',
      'Fit a curve: the x intercept is the light compensation point, the initial slope is the quantum yield, the plateau is light saturated photosynthesis.',
      'For the quantum yield on an absorbed basis, divide by the leaf’s absorptance, measured or assumed (0.84 is the common assumption).'
    ],
    watch: 'Stomata that close as you lower light, leaks in the gasket, and the chamber light spectrum being different from sunlight.',
    dois: ['10.1104/pp.59.1.86', '10.1093/jxb/erq132']
  };

  /* ------------------------------------------------------------ the theatre state */
  var COLS = [
    { k: 'blue', l: 450, name: 'Blue', t: 1 }, { k: 'green', l: 530, name: 'Green', t: 1 }, { k: 'red', l: 660, name: 'Red', t: 1 },
    { k: 'farred', l: 730, name: 'Far red', t: 2 }, { k: 'mix', l: null, name: 'Your light (Plate I)', t: 1 }
  ];
  var BANDL = { blue: 450, green: 530, red: 660, farred: 730 };
  var OP = { light: 'coll', kind: 'sun', col: 'mix', view: 'draw', paused: false };
  var TH = { ph: [], flashes: [], acc: 0, g: null, lay: null, key: '', stat: null, bg: null, bgKey: '', img: null, imgOK: false, hot: [] };
  var CACHE = {};
  function physKind() { return OP.view === 'photo' ? 'grape' : OP.kind; }
  function geomFor(kind) { var k = 'g:' + kind; if (!CACHE[k]) CACHE[k] = S.build(kind, 400, 7); return CACHE[k]; }
  function statFor(kind, light, l) {
    var key = kind + '|' + light + '|' + l;
    if (!CACHE[key]) CACHE[key] = S.stats(geomFor(kind), l, light === 'diff', 3200, 3);
    return CACHE[key];
  }
  function mixWeights() {
    var s = (LP.state && LP.state.spectrum) || { blue: 0.239, green: 0.297, red: 0.313, farred: 0.151 };
    var t = 0, w = {}; Object.keys(BANDL).forEach(function (b) { w[b] = Math.max(0, +s[b] || 0); t += w[b]; });
    if (!(t > 0)) return { blue: 0.25, green: 0.25, red: 0.25, farred: 0.25 };
    Object.keys(w).forEach(function (b) { w[b] /= t; });
    return w;
  }
  /* statistics for the current colour choice (mix = photon weighted average of the four bands) */
  function curStat(kind, light, col) {
    kind = kind || physKind(); light = light || OP.light; col = col || OP.col;
    if (col !== 'mix') return statFor(kind, light, BANDL[col]);
    var w = mixWeights(), out = null;
    Object.keys(BANDL).forEach(function (b) {
      if (!w[b]) return;
      var s = statFor(kind, light, BANDL[b]);
      if (!out) out = { abs: 0, ref: 0, tra: 0, bins: s.bins.map(function () { return 0; }), pal: 0, spg: 0, meanZ: 0, D: s.D, n: s.n };
      out.abs += w[b] * s.abs; out.ref += w[b] * s.ref; out.tra += w[b] * s.tra;
      s.bins.forEach(function (v, i) { out.bins[i] += w[b] * v; });
      out.pal += w[b] * s.abs * s.pal; out.spg += w[b] * s.abs * s.spg; out.meanZ += w[b] * s.abs * s.meanZ;
    });
    if (out && out.abs > 0) { out.pal /= out.abs; out.spg /= out.abs; out.meanZ /= out.abs; }
    return out || statFor(kind, light, 660);
  }
  function pickLam() {
    if (OP.col !== 'mix') return BANDL[OP.col];
    var w = mixWeights(), r = Math.random(), acc = 0, ks = Object.keys(BANDL);
    for (var i = 0; i < ks.length; i++) { acc += w[ks[i]]; if (r <= acc) return BANDL[ks[i]] + Math.round((Math.random() - 0.5) * (ks[i] === 'green' ? 60 : 30)); }
    return 660;
  }

  /* ------------------------------------------------------------ layout and static tissue */
  function layout(w, h) {
    var narrow = w < 560;
    var histW = narrow ? 58 : 118, top = narrow ? 50 : 58, bot = 38;
    var x0 = 8, x1 = w - histW - 16;
    var kind = physKind(), Dref = OP.view === 'photo' ? S.KINDS.grape : S.KINDS.sun;
    var Dsun = Dref.ep + Dref.pal + Dref.spg + Dref.lep;
    var s = (h - top - bot) / Dsun;
    var Wum = (x1 - x0) / s;
    var g = S.build(kind, Wum, 7);
    TH.g = g; TH.lay = { w: w, h: h, x0: x0, x1: x1, top: top, s: s, histX: x1 + 10, histW: histW, narrow: narrow, D: g.D, bottom: top + g.D * s };
    TH.key = kind + w + 'x' + h; TH.bgKey = '';
    TH.ph = []; TH.flashes = [];
  }
  function X(xu) { return TH.lay.x0 + xu * TH.lay.s; }
  function Y(zu) { return TH.lay.top + zu * TH.lay.s; }
  function rr(ctx, x, y, w, h, r) { r = Math.max(0, Math.min(r, w / 2, h / 2)); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  /* slow and named round (13 Oct 2026, light stroma and leaf builder): molecule names in a 2D theatre, after the ANTI
     CLUTTER RULE of the Lead note. Identical copy in l_leafoptics.js, l_sun.js and l_tradeoff.js (first one loaded wins).
     LP.names2d() makes one namer per theatre; call it each frame with the molecules that may carry a name:
     { k: kind, key: the molecule object, t: text, x, y, r (drawn radius), a (alpha), age (0 = just arrived) } and the
     rectangles of the label tags already drawn. Per kind: all are named while 6 or fewer are listed and o.all is set,
     else at most q (default 2 at 1200 px, 1 on phones). A named molecule keeps its name until it leaves; a second name
     of the same kind goes to a molecule well away from the first; a name is drawn only where it overlaps no other
     name or label tag and stays inside the canvas. Uses LP.mol.name (pill under the molecule; off with MolNames). */
  LP.names2d = LP.names2d || function () {
    var prev = {};
    function hit(a, b) { return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h; }
    return function (c, P, W, H, items, block, o) {
      o = o || {};
      var m = LP.mol;
      if (!m || !m.name || (m.namesOn && !m.namesOn())) { prev = {}; return; }
      var mob = W < 560, fs = o.size || (mob ? 9.5 : 10.5), placed = (block || []).slice(), by = {}, kinds = [], next = {};
      c.save(); c.font = '700 ' + fs + 'px system-ui,-apple-system,Segoe UI,sans-serif';
      items.forEach(function (d) { if (!by[d.k]) { by[d.k] = []; kinds.push(d.k); } by[d.k].push(d); });
      function box(d) { var w = c.measureText(d.t).width + 8, h = fs + 5; return { x: d.x - w / 2 - 2, y: d.y + d.r + 1, w: w + 4, h: h + 4 }; }
      function ok(d) { var b = box(d); if (b.x < 2 || b.x + b.w > W - 2 || b.y < 0 || b.y + b.h > H - 2 || !(d.a >= 0.4)) return false; for (var i = 0; i < placed.length; i++) if (hit(b, placed[i])) return false; return true; }
      kinds.forEach(function (k) {
        var L = by[k], cfg = (o.kinds && o.kinds[k]) || {}, q = cfg.q || (cfg.all && L.length <= 6 ? 6 : (mob ? 1 : 2));
        if (mob && cfg.qm) q = cfg.qm;
        var chosen = [], old = prev[k] || [];
        L.forEach(function (d) { if (old.indexOf(d.key) >= 0 && chosen.length < q) chosen.push(d); });
        L.slice().sort(function (a, b) { return (a.age || 0) - (b.age || 0); }).forEach(function (d) {
          if (chosen.length >= q || chosen.indexOf(d) >= 0 || (d.age || 0) > (cfg.maxAge == null ? 0.5 : cfg.maxAge)) return;
          for (var i = 0; i < chosen.length; i++) if (Math.hypot(chosen[i].x - d.x, chosen[i].y - d.y) < (mob ? 70 : 110)) return;
          if (ok(d)) chosen.push(d);
        });
        next[k] = chosen.map(function (d) { return d.key; });
        chosen.forEach(function (d) { if (!ok(d)) return; placed.push(box(d)); m.name(c, P, d.x, d.y, d.r, d.t, { size: fs, alpha: Math.min(1, d.a * 1.15) }); });
      });
      c.restore();
      prev = next;
    };
  };
  var TAGR = null; /* while set, every tag() drawn records its rectangle (molecule names keep clear of tags) */
  function tag(ctx, text, x, y, dark, align, o) {
    o = o || {};
    ctx.font = (o.strong ? '600 ' : '500 ') + (o.size || 11.5) + 'px "IBM Plex Sans", system-ui, sans-serif';
    var tw = ctx.measureText(text).width, px = align === 'center' ? x - tw / 2 : (align === 'right' ? x - tw : x);
    px = Math.max(3, Math.min(px, TH.lay ? TH.lay.w - tw - 11 : px));
    ctx.fillStyle = dark ? 'rgba(14,20,26,.88)' : 'rgba(250,246,236,.93)';
    rr(ctx, px - 5, y - 12, tw + 10, 17, 8); ctx.fill();
    ctx.strokeStyle = o.edge || (dark ? 'rgba(201,165,106,.55)' : 'rgba(90,75,55,.4)'); ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = dark ? '#ece6da' : '#2a231c'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(text, px, y);
    if (TAGR) TAGR.push({ x: px - 7, y: y - 14, w: tw + 14, h: 21 });
    return { x: px - 5, w: tw + 10 };
  }
  function leader(ctx, x0, y0, x1, y1, dark) { ctx.strokeStyle = dark ? 'rgba(236,230,218,.55)' : 'rgba(42,35,28,.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.fillStyle = ctx.strokeStyle; ctx.beginPath(); ctx.arc(x1, y1, 2, 0, 6.29); ctx.fill(); }
  function paintTissue(ctx, dark) {
    var g = TH.g, L = TH.lay, s = L.s;
    var air = dark ? '#0a1219' : '#eef1ee';
    ctx.fillStyle = air; ctx.fillRect(L.x0, Y(0), L.x1 - L.x0, g.D * s);
    if (OP.view === 'photo') {
      if (TH.img && TH.imgOK) {
        var im = TH.img, sy = im.naturalHeight * 0.03, sh = im.naturalHeight * 0.95, dh = g.D * s, k = dh / sh, sw = Math.min(im.naturalWidth, (L.x1 - L.x0) / k);
        var sx = Math.max(0, Math.min(im.naturalWidth - sw, im.naturalWidth * 0.62 - sw / 2));
        TH.photo = { sx: sx, sy: sy, k: k, sw: sw };
        ctx.drawImage(im, sx, sy, sw, sh, L.x0, Y(0), sw * k, dh);
        if (dark) { ctx.fillStyle = 'rgba(5,10,16,.28)'; ctx.fillRect(L.x0, Y(0), sw * k, dh); }
      } else {
        ctx.fillStyle = dark ? '#cfd6e6' : '#c9cbe0'; ctx.fillRect(L.x0, Y(0), L.x1 - L.x0, g.D * s);
        tag(ctx, 'loading the micrograph', (L.x0 + L.x1) / 2, Y(g.D / 2), dark, 'center');
      }
      return;
    }
    /* intercellular air of the mesophyll: faint blue grey */
    ctx.fillStyle = dark ? '#0d1820' : '#e5ecef'; ctx.fillRect(L.x0, Y(g.pal0), L.x1 - L.x0, (g.spg1 - g.pal0) * s);
    /* upper epidermis: clear cells, no chloroplasts, no stomata in this drawing */
    var epc = dark ? '#1c2a2e' : '#f6f7ee', eps = dark ? '#6f8f86' : '#7a8f73';
    for (var xu = 0; xu < g.W; xu += 21) { rr(ctx, X(xu) + 0.6, Y(0.5), 21 * s - 1.2, (g.ep - 1) * s, 4 * s); ctx.fillStyle = epc; ctx.fill(); ctx.strokeStyle = eps; ctx.lineWidth = 1; ctx.stroke(); }
    /* cuticle */
    ctx.fillStyle = dark ? '#c9a24f' : '#c9a845'; ctx.globalAlpha = 0.85; ctx.fillRect(L.x0, Y(0) - 2, L.x1 - L.x0, 3); ctx.globalAlpha = 1;
    /* palisade */
    g.cols.forEach(function (c) {
      var x = X(c[0]), y = Y(c[2]), w = (c[1] - c[0]) * s, hh = (c[3] - c[2]) * s;
      var gr = ctx.createLinearGradient(x, 0, x + w, 0);
      if (dark) { gr.addColorStop(0, '#1f3d22'); gr.addColorStop(0.5, '#2b5530'); gr.addColorStop(1, '#1f3d22'); }
      else { gr.addColorStop(0, '#cfe6bd'); gr.addColorStop(0.5, '#e4f1d7'); gr.addColorStop(1, '#cfe6bd'); }
      rr(ctx, x, y, w, hh, Math.min(w / 2, 6 * s)); ctx.fillStyle = gr; ctx.fill();
      ctx.strokeStyle = dark ? '#77b06a' : '#557a43'; ctx.lineWidth = 1.1; ctx.stroke();
    });
    /* spongy cells */
    g.circ.forEach(function (c) {
      [c[0], c[0] - g.W, c[0] + g.W].forEach(function (cx) {
        if (cx + c[2] < 0 || cx - c[2] > g.W) return;
        ctx.save(); ctx.beginPath(); ctx.rect(L.x0, Y(0), L.x1 - L.x0, g.D * s); ctx.clip();
        var gr = ctx.createRadialGradient(X(cx) - c[2] * s * 0.3, Y(c[1]) - c[2] * s * 0.3, 1, X(cx), Y(c[1]), c[2] * s);
        if (dark) { gr.addColorStop(0, '#2e5032'); gr.addColorStop(1, '#1c3420'); } else { gr.addColorStop(0, '#eef6e4'); gr.addColorStop(1, '#cfe3bd'); }
        ctx.beginPath(); ctx.arc(X(cx), Y(c[1]), c[2] * s, 0, 6.29); ctx.fillStyle = gr; ctx.fill();
        ctx.strokeStyle = dark ? '#6fa463' : '#5d8549'; ctx.lineWidth = 1; ctx.stroke();
        ctx.restore();
      });
    });
    /* chloroplasts */
    ctx.fillStyle = dark ? '#6fd36a' : '#3e8a36';
    g.chl.forEach(function (q) { var x = X((q[0] + g.W) % g.W); if (x < L.x0 || x > L.x1) return; ctx.beginPath(); ctx.ellipse(x, Y(q[1]), 1.7 * s + 0.6, 1.1 * s + 0.5, q[2] ? 1.57 : 0, 0, 6.29); ctx.fill(); });
    /* lower epidermis with one stoma and its substomatal cavity */
    var lz = g.spg1, lh = g.D - g.spg1;
    for (var xl = 0; xl < g.W; xl += 17) {
      if (Math.abs(xl + 8.5 - g.stomaX) < 21) continue;
      rr(ctx, X(xl) + 0.6, Y(lz) + 0.5, 17 * s - 1.2, lh * s - 1, 4 * s); ctx.fillStyle = epc; ctx.fill(); ctx.strokeStyle = eps; ctx.lineWidth = 1; ctx.stroke();
    }
    var gx = X(g.stomaX), gy = Y(lz + lh / 2);
    [-1, 1].forEach(function (sd) {
      ctx.beginPath(); ctx.ellipse(gx + sd * (5.5 * s + 2), gy, 5.5 * s, lh * s * 0.55, 0, 0, 6.29);
      ctx.fillStyle = dark ? '#2f6a3a' : '#a9d39a'; ctx.fill(); ctx.strokeStyle = dark ? '#8fd19e' : '#3d6b2f'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.fillStyle = dark ? '#7fe07a' : '#2f7a2a'; [-0.25, 0.2].forEach(function (f) { ctx.beginPath(); ctx.arc(gx + sd * (5.5 * s + 2), gy + f * lh * s, 1.3 * s, 0, 6.29); ctx.fill(); });
    });
    ctx.fillStyle = dark ? '#c9a24f' : '#c9a845'; ctx.globalAlpha = 0.6; ctx.fillRect(L.x0, Y(g.D) - 1, L.x1 - L.x0, 2); ctx.globalAlpha = 1;
  }
  function paintStatic(ctx, w, h, dark) {
    var L = TH.lay, g = TH.g;
    var bg = ctx.createLinearGradient(0, 0, 0, h);
    if (dark) { bg.addColorStop(0, '#05080d'); bg.addColorStop(1, '#0b1118'); } else { bg.addColorStop(0, '#f6f0e1'); bg.addColorStop(1, '#ece3cd'); }
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    /* the light above the leaf */
    var cx = (L.x0 + L.x1) / 2;
    if (OP.light === 'coll') {
      ctx.strokeStyle = dark ? 'rgba(255,214,120,.35)' : 'rgba(200,140,30,.35)'; ctx.lineWidth = 1;
      for (var x = L.x0 + 12; x < L.x1; x += 26) { ctx.beginPath(); ctx.moveTo(x, 6); ctx.lineTo(x, L.top - 6); ctx.stroke(); }
      tag(ctx, 'Direct sun: parallel (collimated) light', L.x0 + 4, 20, dark, 'left', { strong: true });
    } else {
      ctx.fillStyle = dark ? 'rgba(160,180,200,.18)' : 'rgba(255,255,255,.75)';
      for (var i = 0; i < 6; i++) { ctx.beginPath(); ctx.ellipse(L.x0 + (i + 0.5) * (L.x1 - L.x0) / 6, 16 + (i % 2) * 6, (L.x1 - L.x0) / 9, 9, 0, 0, 6.29); ctx.fill(); }
      ctx.strokeStyle = dark ? 'rgba(200,215,230,.28)' : 'rgba(110,120,130,.3)'; ctx.lineWidth = 1;
      for (var j = 0; j < 22; j++) { var x0 = L.x0 + (j + 0.5) * (L.x1 - L.x0) / 22, a = ((j * 0.618) % 1 - 0.5) * 2.2; ctx.beginPath(); ctx.moveTo(x0, 22); ctx.lineTo(x0 + Math.sin(a) * (L.top - 26), L.top - 4); ctx.stroke(); }
      tag(ctx, 'Diffuse: fog or cloud, light from every angle', L.x0 + 4, 20, dark, 'left', { strong: true });
    }
    paintTissue(ctx, dark);
    /* below the leaf */
    var yb = Math.min(h - 10, Y(g.D) + 44);
    if (OP.view !== 'photo' && OP.kind === 'shade') {
      var sk = S.KINDS.sun, sd = sk.ep + sk.pal + sk.spg + sk.lep;
      ctx.setLineDash([5, 5]); ctx.strokeStyle = dark ? 'rgba(201,165,106,.55)' : 'rgba(90,75,55,.45)'; ctx.lineWidth = 1.2;
      ctx.strokeRect(L.x0 + 0.5, Y(0), L.x1 - L.x0 - 1, sd * L.s); ctx.setLineDash([]);
      tag(ctx, 'a sun leaf would be this thick', L.x1 - 6, Y(sd) - 8, dark, 'right');
    }
    tag(ctx, 'light that passes through', L.x0 + 4, yb, dark, 'left');
    /* histogram frame */
    var hx = L.histX, hw = L.histW;
    ctx.fillStyle = dark ? 'rgba(255,255,255,.03)' : 'rgba(255,255,255,.45)'; ctx.fillRect(hx, Y(0), hw, g.D * L.s);
    ctx.strokeStyle = dark ? 'rgba(201,165,106,.45)' : 'rgba(90,75,55,.35)'; ctx.strokeRect(hx + 0.5, Y(0) + 0.5, hw - 1, g.D * L.s - 1);
    ctx.font = '600 11px "IBM Plex Sans", system-ui, sans-serif'; ctx.fillStyle = dark ? '#ece6da' : '#2a231c';
    var lab = L.narrow ? ['absorbed', 'by depth'] : ['absorbed at', 'each depth'];
    ctx.fillText(lab[0], hx + 2, L.top - 20); ctx.fillText(lab[1], hx + 2, L.top - 7);
    /* labels */
    if (OP.view === 'photo') labelsPhoto(ctx, dark); else labelsDraw(ctx, dark);
  }
  function labelsDraw(ctx, dark) {
    var g = TH.g, L = TH.lay, t = ui.tier(), nar = L.narrow;
    var lx = L.x0 + 6;
    var y1 = Y(g.ep * 0.6) + 4;
    if (!nar) tag(ctx, 'cuticle and upper epidermis (no stomata)', lx, y1, dark, 'left');
    tag(ctx, nar ? 'palisade: light guides' : 'palisade: columns guide light down', lx, Y((g.pal0 + g.pal1) / 2) + 4, dark, 'left');
    if (t >= 2 && !nar) tag(ctx, 'gaps between columns: the sieve effect', lx, Y(g.pal0 + (g.pal1 - g.pal0) * 0.8) + 4, dark, 'left');
    tag(ctx, nar ? 'spongy: scatters' : 'spongy mesophyll: cells and air scatter light', lx, Y((g.pal1 + g.spg1) / 2) + 4, dark, 'left');
    var sx = X(g.stomaX);
    var tg = tag(ctx, nar ? 'stoma (lower side)' : 'stoma on the lower (abaxial) side', Math.min(L.x1 - 4, sx + 18), Y(g.D) + 24, dark, 'left');
    leader(ctx, tg.x, Y(g.D) + 19, sx + 2, Y(g.D) - 1, dark);
    if (t >= 3 && !nar) { var tc = tag(ctx, 'substomatal cavity', sx + 26, Y(g.spg1 - 14), dark, 'left'); leader(ctx, tc.x, Y(g.spg1 - 14) - 4, sx + 4, Y(g.spg1 - 10), dark); }
  }
  function labelsPhoto(ctx, dark) {
    var g = TH.g, L = TH.lay, P = TH.photo;
    if (!P) return;
    var lx = L.x0 + 6;
    tag(ctx, 'upper epidermis', lx, Y(g.ep * 0.55) + 4, dark, 'left');
    tag(ctx, 'palisade', lx, Y((g.pal0 + g.pal1) / 2) + 4, dark, 'left');
    tag(ctx, 'spongy mesophyll and air spaces', lx, Y((g.pal1 + g.spg1) / 2 + 8) + 4, dark, 'left');
    tag(ctx, 'lower epidermis', lx, Y(g.D) - 8, dark, 'left');
    /* minor vein: at about 44 % across and 45 % down in the cropped image */
    var vx = L.x0 + (470 - P.sx) * P.k, vy = Y(0) + (160 - P.sy) * P.k;
    if (vx > L.x0 + 40 && vx < L.x1 - 20) { var tv = tag(ctx, 'minor vein', vx + 26, vy - 26, dark, 'left'); leader(ctx, tv.x, vy - 31, vx + 4, vy - 4, dark); }
    /* 100 µm bar from the bar burned into the original: 232 px per 100 µm */
    var bar = 232 * P.k, bx = L.x1 - bar - 10, by = Y(g.D) - 10;
    if (bar < (L.x1 - L.x0) * 0.6) {
      ctx.fillStyle = dark ? '#f2ede2' : '#111'; ctx.fillRect(bx, by, bar, 4);
      tag(ctx, '100 µm', bx + bar / 2, by - 6, dark, 'center', { size: 10.5 });
    }
  }
  function ensureBg(w, h, dark, dpr) {
    var key = TH.key + '|' + dark + '|' + OP.view + '|' + OP.light + '|' + ui.tier() + '|' + dpr + '|' + (TH.imgOK ? 1 : 0);
    if (TH.bg && TH.bgKey === key) return TH.bg;
    var c = TH.bg || document.createElement('canvas');
    c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    var x = c.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0);
    TAGR = []; try { paintStatic(x, w, h, dark); } finally { TH.bgTags = TAGR; TAGR = null; }
    TH.bg = c; TH.bgKey = key;
    return c;
  }

  /* ------------------------------------------------------------ photons in the theatre */
  var SPEED = 170; /* µm of path per second on screen (drawing scale, stated in tier 3) */
  function rate() { var p = +(LP.state && LP.state.ppfd); if (!isFinite(p)) p = 1500; return p <= 0 ? 0 : 4 + 32 * Math.min(1, p / 2000); }
  function spawn() {
    var g = TH.g, L = TH.lay; if (!g) return;
    var l = pickLam(), r = Math.random;
    var sx = OP.light === 'diff' ? (2 * r() - 1) * 0.985 : (2 * r() - 1) * 0.04;
    var dz = Math.sqrt(1 - sx * sx), x = r() * g.W;
    var preZ = -(L.top - 8) / L.s;
    var p = { x: x - sx / dz * (0 - preZ), z: preZ, dx: sx, dz: dz, l: l, mu: S.mu(l), alive: true, fate: null, k: 0, path: 0, phase: 'in', trail: [], a: 1, out: 0 };
    TH.ph.push(p);
  }
  function enter(p) {
    var g = TH.g, r = Math.random;
    var rs = 0.04 + 0.25 * Math.pow(Math.abs(p.dx), 6);
    p.x = ((p.x % g.W) + g.W) % g.W; p.z = 0.01;
    if (r() < rs) { p.phase = 'out'; p.dz = -p.dz; p.fate = 'ref'; return; }
    p.phase = 'leaf'; p.k = S.region(g, p.x, 0.01);
  }
  function stepPhotons(dt) {
    var g = TH.g, L = TH.lay; if (!g) return;
    var rt = rate();
    TH.acc += dt * rt * (L.narrow ? 0.7 : 1);
    while (TH.acc > 1) { TH.acc -= 1; if (TH.ph.length < 160) spawn(); }
    var n = SPEED * dt;
    for (var i = TH.ph.length - 1; i >= 0; i--) {
      var p = TH.ph[i];
      if (p.phase === 'in') {
        p.x += p.dx * n; p.z += p.dz * n;
        if (p.z >= 0) enter(p);
      } else if (p.phase === 'leaf') {
        var steps = Math.max(1, Math.round(n));
        for (var k = 0; k < steps && p.alive; k++) {
          S.step(g, p, n / steps, Math.random);
          if (k % 3 === 0) p.trail.push([p.x, p.z]);
        }
        if (!p.alive) {
          if (p.fate === 'abs') { TH.flashes.push({ x: p.x, z: p.z, l: p.l, t: 0 }); var bi = Math.min(13, Math.max(0, Math.floor(p.z / g.D * 14))); TH.hot[bi] = 1; p.phase = 'gone'; }
          else p.phase = 'out';
        }
        if (p.trail.length > 26) p.trail.splice(0, p.trail.length - 26);
      } else if (p.phase === 'out') {
        p.x += p.dx * n; p.z += p.dz * n; p.out += dt;
        if (p.trail.length) p.trail.shift();
        if (p.out > 0.9 || p.z < -(L.top) / L.s || p.z > g.D + 40 / L.s) p.phase = 'gone';
      }
      if (p.phase === 'gone' && !p.trail.length) TH.ph.splice(i, 1);
      else if (p.phase === 'gone') p.trail.shift();
    }
    for (var j = TH.flashes.length - 1; j >= 0; j--) { TH.flashes[j].t += dt; if (TH.flashes[j].t > 0.8) TH.flashes.splice(j, 1); }
    for (var b = 0; b < 14; b++) if (TH.hot[b]) TH.hot[b] = Math.max(0, TH.hot[b] - dt * 2.5);
  }
  function settle() {
    /* reduce motion: a still frame of paths that have been run part way */
    if (!TH.g) return;
    TH.ph = []; TH.flashes = [];
    var save = Math.random, seed = S.rng(5); Math.random = seed;
    try {
      for (var i = 0; i < 26; i++) { spawn(); }
      for (var t = 0; t < 70; t++) stepPhotons(1 / 60);
    } finally { Math.random = save; }
  }
  function drawTheatre(ctx, w, h, t, dt, info) {
    if (!TH.lay || TH.lay.w !== w || TH.lay.h !== h || TH.key.indexOf(physKind()) !== 0) layout(w, h);
    if (dt > 0 && !OP.paused) stepPhotons(dt);
    else if (!TH.ph.length && !dt) { if (info.reduce) settle(); else { for (var k = 0; k < 60; k++) stepPhotons(1 / 30); } }
    var dark = info.dark, L = TH.lay, g = TH.g;
    ctx.drawImage(ensureBg(w, h, dark, info.dpr), 0, 0, w, h);
    /* histogram bars from the Monte Carlo statistics (stable), with live flashes */
    var st = TH.stat || (TH.stat = curStat());
    var mx = Math.max.apply(null, st.bins) || 1, bh = g.D * L.s / st.bins.length;
    var col = OP.col === 'mix' ? (dark ? '#9fd38a' : '#3e8a36') : wl(BANDL[OP.col], dark);
    st.bins.forEach(function (v, i) {
      var bw = (L.histW - 8) * v / mx;
      ctx.fillStyle = col; ctx.globalAlpha = 0.75 + 0.25 * (TH.hot[i] || 0);
      ctx.fillRect(L.histX + 4, Y(0) + i * bh + 1, Math.max(1, bw), bh - 2);
      if (TH.hot[i]) { ctx.globalAlpha = 0.6 * TH.hot[i]; ctx.fillStyle = dark ? '#fff' : '#fffbe8'; ctx.fillRect(L.histX + 4, Y(0) + i * bh + 1, Math.max(1, bw), bh - 2); }
    });
    ctx.globalAlpha = 1;
    /* photons: a bead and a short trail */
    var clip = function () { ctx.save(); ctx.beginPath(); ctx.rect(L.x0 - 2, 0, L.x1 - L.x0 + 4, h); ctx.clip(); };
    clip();
    TH.ph.forEach(function (p) {
      var c = wl(p.l, dark);
      if (p.trail.length > 1) {
        ctx.strokeStyle = c; ctx.lineWidth = 2.4; ctx.globalAlpha = 0.6; if (dark) { ctx.shadowColor = c; ctx.shadowBlur = 4; }
        ctx.beginPath();
        for (var i = 0; i < p.trail.length; i++) {
          var q = p.trail[i], px = X(q[0]), pz = Y(q[1]);
          if (i && Math.abs(q[0] - p.trail[i - 1][0]) > g.W / 2) ctx.moveTo(px, pz); else if (i) ctx.lineTo(px, pz); else ctx.moveTo(px, pz);
        }
        ctx.stroke(); ctx.globalAlpha = 1; ctx.shadowBlur = 0;
      }
      if (p.phase === 'gone') return;
      var x = X(((p.x % g.W) + g.W) % g.W), y = Y(p.z);
      if (p.phase === 'out') ctx.globalAlpha = Math.max(0, 1 - p.out / 0.9);
      if (dark) { ctx.shadowColor = c; ctx.shadowBlur = 8; }
      ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, 3.6, 0, 6.29); ctx.fill();
      ctx.shadowBlur = 0;
      if (!dark) { ctx.strokeStyle = 'rgba(30,25,20,.55)'; ctx.lineWidth = 0.8; ctx.stroke(); }
      ctx.globalAlpha = 1;
    });
    TH.flashes.forEach(function (f) {
      var k = f.t / 0.8, x = X(f.x), y = Y(f.z);
      ctx.globalAlpha = (1 - k) * 0.9; ctx.strokeStyle = dark ? '#9dff8a' : '#2f7a2a'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(x, y, 2 + 9 * k, 0, 6.29); ctx.stroke();
      ctx.fillStyle = dark ? 'rgba(157,255,138,.5)' : 'rgba(62,138,54,.45)'; ctx.beginPath(); ctx.arc(x, y, 3 * (1 - k) + 1, 0, 6.29); ctx.fill();
      ctx.globalAlpha = 1;
    });
    ctx.restore();
    if (rate() === 0) tag(ctx, 'No light: set PPFD above zero', (L.x0 + L.x1) / 2, L.top - 18, dark, 'center', { strong: true });
    /* slow and named: at most one photon of each colour carries its name (blue, red, far red; none for green), chosen
       as it enters and kept until it is absorbed or leaves */
    var nm = [];
    TH.ph.forEach(function (p) {
      if (p.phase !== 'in' && p.phase !== 'leaf') return;
      var t = p.l < 500 ? 'blue photon' : (p.l >= 700 ? 'far red photon' : (p.l >= 600 ? 'red photon' : '')); if (!t) return;
      var x = X(((p.x % g.W) + g.W) % g.W), y = Y(p.z); if (x < L.x0 || x > L.x1) return;
      nm.push({ k: t, key: p, t: t, x: x, y: y, r: 4, a: 1, age: p.phase === 'in' ? 0 : 1 });
    });
    (TH.namer = TH.namer || LP.names2d())(ctx, { dark: dark }, w, h, nm, TH.bgTags, { kinds: { 'blue photon': { q: 1, maxAge: 0 }, 'red photon': { q: 1, maxAge: 0 }, 'far red photon': { q: 1, maxAge: 0 } } });
  }

  /* ------------------------------------------------------------ 2.2 depth chart (SVG) */
  var DC = {};
  function hostW(h) { var w = h.getBoundingClientRect().width; if (!w) { var st = document.getElementById('wp-stage'); w = (st && st.getBoundingClientRect().width) || window.innerWidth || 600; } return w; }
  var SVGNS = 'http://www.w3.org/2000/svg';
  function drawDepth() {
    var host = document.getElementById('lo-depth'); if (!host) return;
    var narrow = hostW(host) < 520;
    var W = narrow ? 380 : 640, H = narrow ? 330 : 300, ml = narrow ? 52 : 64, mr = narrow ? 112 : 190, mt = 26, mb = 38;
    var kind = OP.kind, light = OP.light;
    var t = ui.tier(), set = [['blue', 450], ['green', 530], ['red', 660]].concat(t >= 3 ? [['farred', 730]] : []);
    var stats = set.map(function (c) { return { k: c[0], l: c[1], s: statFor(kind, light, c[1]) }; });
    var D = stats[0].s.D, nb = stats[0].s.bins.length;
    var mx = 0; stats.forEach(function (q) { q.s.bins.forEach(function (v) { mx = Math.max(mx, v); }); });
    mx = Math.ceil(mx * 100 / 5) * 5 / 100 || 0.05;
    var x = function (v) { return ml + v / mx * (W - ml - mr); }, y = function (z) { return mt + z / D * (H - mt - mb); };
    var g = geomFor(kind), dark = ui.isDark();
    var band = function (z0, z1, cls, lab) { return '<rect class="dc-band ' + cls + '" x="' + ml + '" y="' + y(z0) + '" width="' + (W - ml - mr) + '" height="' + (y(z1) - y(z0)) + '"/><text class="dc-bl" x="' + (ml - 6) + '" y="' + ((y(z0) + y(z1)) / 2 + 4) + '" text-anchor="end">' + lab + '</text>'; };
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="lo-svg" role="img" aria-labelledby="dc-t"><title id="dc-t">Where in the leaf light of each colour is absorbed</title>' +
      band(0, g.pal0, 'ep', 'epid.') + band(g.pal0, g.pal1, 'pal', 'palisade') + band(g.pal1, g.spg1, 'spg', 'spongy') + band(g.spg1, D, 'ep', 'epid.');
    [0, mx / 2, mx].forEach(function (v) { s += '<line class="dc-grid" x1="' + x(v) + '" x2="' + x(v) + '" y1="' + mt + '" y2="' + (H - mb) + '"/><text class="dc-tk" x="' + x(v) + '" y="' + (H - mb + 15) + '" text-anchor="middle">' + num(100 * v, 0) + '</text>'; });
    s += '<text class="dc-tk" x="' + ((ml + W - mr) / 2) + '" y="' + (H - 6) + '" text-anchor="middle">% of incoming photons absorbed in each slice</text>';
    s += '<text class="dc-tk" x="' + ml + '" y="' + (mt - 10) + '">upper surface, light comes from here</text>';
    stats.forEach(function (q) {
      var d = '', bh = D / nb;
      q.s.bins.forEach(function (v, i) { d += (i ? 'L' : 'M') + x(v).toFixed(1) + ' ' + y((i + 0.5) * bh).toFixed(1); });
      s += '<path d="' + d + '" fill="none" stroke="' + wl(q.l, dark) + '" stroke-width="2.6" stroke-linejoin="round"/>';
      var last = q.s.bins.reduce(function (a, v, i) { return v > q.s.bins[a] ? i : a; }, 0);
      s += '<circle cx="' + x(q.s.bins[last]) + '" cy="' + y((last + 0.5) * bh) + '" r="3.5" fill="' + wl(q.l, dark) + '"/>';
      var li = stats.indexOf(q), lx = ml + (W - ml - mr) * 0.58, ly = H - mb - 14 - (stats.length - 1 - li) * 17;
      s += '<line x1="' + lx + '" x2="' + (lx + 22) + '" y1="' + (ly - 4) + '" y2="' + (ly - 4) + '" stroke="' + wl(q.l, dark) + '" stroke-width="3"/><text class="dc-cl" x="' + (lx + 28) + '" y="' + ly + '">' + ({ blue: 'blue, 450 nm', green: 'green, 530 nm', red: 'red, 660 nm', farred: 'far red, 730 nm' })[q.k] + '</text>';
    });
    /* right side: absorbed in palisade (model) vs carbon fixed in palisade (Nishio 1993, spinach) */
    var bx = W - mr + 18, bw = narrow ? 34 : 44, by0 = mt + 4, bh2 = H - mt - mb - 8;
    var red = stats.filter(function (q) { return q.k === 'red'; })[0].s;
    var col = function (xx, fr, lab1, lab2, c1) {
      return '<rect x="' + xx + '" y="' + by0 + '" width="' + bw + '" height="' + (bh2 * fr) + '" class="dc-pb" fill="' + c1 + '"/>' +
        '<rect x="' + xx + '" y="' + (by0 + bh2 * fr) + '" width="' + bw + '" height="' + (bh2 * (1 - fr)) + '" class="dc-sb"/>' +
        '<text class="dc-pc" x="' + (xx + bw / 2) + '" y="' + (by0 + 16) + '" text-anchor="middle">' + num(100 * fr, 0) + '</text>' +
        '<text class="dc-pc" x="' + (xx + bw / 2) + '" y="' + (by0 + bh2 - 6) + '" text-anchor="middle">' + num(100 * (1 - fr), 0) + '</text>' +
        '<text class="dc-tk" x="' + (xx + bw / 2) + '" y="' + (H - mb + 15) + '" text-anchor="middle">' + lab1 + '</text>' +
        '<text class="dc-tk" x="' + (xx + bw / 2) + '" y="' + (H - mb + 28) + '" text-anchor="middle">' + lab2 + '</text>';
    };
    var palR = red.pal / Math.max(1e-9, red.pal + red.spg);
    s += col(bx, palR, 'red light', 'absorbed', wl(660, dark));
    s += col(bx + bw + (narrow ? 10 : 30), 0.6, 'carbon', 'fixed', dark ? '#8fd19e' : '#2f6b3a');
    s += '<text class="dc-tk" x="' + (bx - 4) + '" y="' + (mt - 10) + '">% in palisade (top) and spongy</text>';
    s += '</svg>';
    host.innerHTML = s;
    var cap = document.getElementById('lo-depth-cap');
    if (cap) {
      var gr = stats.filter(function (q) { return q.k === 'green'; })[0].s, bl = stats[0].s;
      cap.innerHTML = 'In this ' + (kind === 'sun' ? 'sun' : 'shade') + ' leaf under ' + (light === 'coll' ? 'direct' : 'diffuse') + ' light, blue is absorbed on average ' + num(bl.meanZ, 0) + ' µm below the surface and green ' + num(gr.meanZ, 0) + ' µm: green reaches deeper. ' +
        'Red light is absorbed ' + num(100 * palR, 0) + ' % in the palisade here, yet in spinach leaves about 60 % of carbon was fixed in the palisade and 40 % in the spongy mesophyll, with fixation peaking in the middle of the leaf, where Rubisco is, not at the brightest top layer. ' + ui.ev('carbon_fixation_gradient', 'Nishio 1993') + ' ' + ui.ev('green_light_deep', 'Green goes deep') + ' ' + ui.ev('leaf.mc', 'Model');
    }
  }

  /* ------------------------------------------------------------ 2.3 light response curve (SVG) and the gas exchange window */
  var LR = { xs: null };
  function solveAt(over) { var st = Object.assign({}, LP.state, over || {}); return LP.solve ? LP.solve(st) : null; }
  function lrcPoints(leaf, extra) {
    var xs = [0, 5, 10, 15, 20, 30, 40, 60, 80, 100, 130, 160, 200, 250, 300, 400, 500, 600, 700, 800, 1000, 1200, 1400, 1600, 1800, 2000];
    return xs.map(function (p) { var r = solveAt(Object.assign({ ppfd: p, leaf: leaf }, extra || {})); return [p, r ? r.A : 0, r]; });
  }
  function lcp(leaf, extra) {
    var f = function (p) { var r = solveAt(Object.assign({ ppfd: p, leaf: leaf }, extra || {})); return r ? r.A : 0; };
    if (f(0) >= 0) return 0;
    var lo = 0, hi = 400; if (f(hi) < 0) return null;
    for (var i = 0; i < 40; i++) { var m = (lo + hi) / 2; if (f(m) < 0) lo = m; else hi = m; }
    return (lo + hi) / 2;
  }
  function lrcMetrics(leaf, extra) {
    var L0 = lcp(leaf, extra);
    var a = function (p) { var r = solveAt(Object.assign({ ppfd: p, leaf: leaf }, extra || {})); return r ? r.A : 0; };
    var p1 = Math.max(5, (L0 || 0) + 5), p2 = p1 + 30;
    var slope = (a(p2) - a(p1)) / (p2 - p1);
    var top = a(2000), sat = null;
    for (var p = 20; p <= 2000; p += 10) if (a(p) >= 0.9 * top) { sat = p; break; }
    var r0 = solveAt({ ppfd: 0, leaf: leaf });
    return { lcp: L0, alpha: slope, alphaAbs: slope / 0.84, Amax: top, sat: sat, Rd: r0 ? r0.Rd : null };
  }
  function drawLRC() {
    var host = document.getElementById('lo-lrc'); if (!host || !LP.solve) return;
    var narrow = hostW(host) < 520;
    var W = narrow ? 380 : 540, H = narrow ? 316 : 346, ml = 40, mr = 12, mt = 36, mb = 44;
    var st = LP.state || {}, leaf = st.leaf === 'shade' ? 'shade' : 'sun', other = leaf === 'sun' ? 'shade' : 'sun';
    var A1 = lrcPoints(leaf), A2 = lrcPoints(other);
    var lowO = ui.tier() >= 3 && +st.O2 > 5 ? lrcPoints(leaf, { O2: 2 }) : null;
    var ymax = 4; [A1, A2, lowO || []].forEach(function (a) { a.forEach(function (q) { ymax = Math.max(ymax, q[1]); }); });
    ymax = Math.ceil((ymax + 1) / 5) * 5; var ymin = -5;
    var x = function (p) { return ml + p / 2000 * (W - ml - mr); }, y = function (v) { return mt + (ymax - v) / (ymax - ymin) * (H - mt - mb); };
    var path = function (a) { return a.map(function (q, i) { return (i ? 'L' : 'M') + x(q[0]).toFixed(1) + ' ' + y(q[1]).toFixed(1); }).join(''); };
    var dark = ui.isDark();
    var m = lrcMetrics(leaf);
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="lo-svg" role="img" aria-labelledby="lr-t"><title id="lr-t">Net CO2 uptake against light for a sun and a shade leaf</title>';
    for (var v = ymin; v <= ymax; v += 5) s += '<line class="dc-grid" x1="' + ml + '" x2="' + (W - mr) + '" y1="' + y(v) + '" y2="' + y(v) + '"/><text class="dc-tk" x="' + (ml - 6) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + sgn(v, 0) + '</text>';
    s += '<line class="lr-zero" x1="' + ml + '" x2="' + (W - mr) + '" y1="' + y(0) + '" y2="' + y(0) + '"/>';
    [0, 500, 1000, 1500, 2000].forEach(function (p) { s += '<text class="dc-tk" x="' + x(p) + '" y="' + (H - mb + 16) + '" text-anchor="' + (p === 2000 ? 'end' : 'middle') + '">' + p + '</text>'; });
    s += '<text class="dc-tk" x="' + (W - mr) + '" y="' + (H - 8) + '" text-anchor="end">light, PPFD µmol m⁻² s⁻¹</text>';
    s += '<text class="dc-tk" x="' + 4 + '" y="14">net CO₂ uptake A, µmol m⁻² s⁻¹</text>';
    s += '<path d="' + path(A2) + '" class="lr-other"/>';
    if (lowO) s += '<path d="' + path(lowO) + '" class="lr-o2 tier-3"/>';
    s += '<path d="' + path(A1) + '" class="lr-main"/>';
    /* initial slope (quantum efficiency) */
    if (m.lcp != null) {
      var xe = Math.min(2000, m.lcp + (ymax * 0.55) / Math.max(1e-6, m.alpha));
      s += '<line class="lr-slope" x1="' + x(0) + '" y1="' + y(-m.alpha * m.lcp) + '" x2="' + x(xe) + '" y2="' + y(m.alpha * (xe - m.lcp)) + '"/>';
      s += '<line class="lr-mark" x1="' + x(m.lcp) + '" x2="' + x(m.lcp) + '" y1="' + (y(0) - 8) + '" y2="' + (y(0) + 8) + '"/>';
      s += '<text class="lr-lab" x="' + (x(m.lcp) + 6) + '" y="' + (y(0) + 20) + '">compensation ' + num(m.lcp, 0) + ' µmol m⁻² s⁻¹</text>';
      s += '<text class="lr-lab" x="' + Math.max(ml + 150, x(xe) - 6) + '" y="' + (y(m.alpha * (xe - m.lcp)) - 8) + '" text-anchor="end">slope = quantum efficiency</text>';
    }
    if (m.sat) s += '<line class="lr-sat" x1="' + x(m.sat) + '" x2="' + x(m.sat) + '" y1="' + y(0) + '" y2="' + y(m.Amax * 0.9) + '"/><text class="lr-lab" x="' + (x(m.sat) + 5) + '" y="' + (y(m.Amax * 0.22) + 4) + '">90 % of plateau at ' + num(m.sat, 0) + ' µmol m⁻² s⁻¹</text>';
    var cur0 = +((LP.state || {}).ppfd) || 0, kx = cur0 > 1150 ? 1000 : 2000, kA = A1.filter(function (q) { return q[0] <= kx; }).pop();
    s += '<text class="lr-key" x="' + (kx === 2000 ? W - mr - 4 : x(kx)) + '" y="' + (y(kA[1]) - 10) + '" text-anchor="end">' + (leaf === 'sun' ? 'sun leaf' : 'shade leaf') + '</text>';
    s += '<text class="lr-key2" x="' + (W - mr - 4) + '" y="' + (y(A2[A2.length - 1][1]) + 16) + '" text-anchor="end">' + (other === 'sun' ? 'sun leaf' : 'shade leaf') + ', for comparison</text>';
    if (lowO) s += '<text class="lr-key2 tier-3" x="' + (W - mr - 4) + '" y="' + (y(lowO[lowO.length - 1][1]) - 8) + '" text-anchor="end">same leaf at 2 % O₂</text>';
    var cur = LP.result, pp = Math.max(0, Math.min(2000, +st.ppfd || 0));
    if (cur) s += '<circle class="lr-now" cx="' + x(pp) + '" cy="' + y(cur.A) + '" r="6"/>';
    s += '</svg>';
    host.innerHTML = s;
    function setT(id, v) { var e = document.querySelector('#' + id + ' .n'); if (e) e.textContent = v; }
    if (cur) setT('lr-A', sgn(cur.A, 1));
    setT('lr-lcp', m.lcp == null ? 'n/a' : num(m.lcp, 0));
    setT('lr-a', num(m.alpha, 3)); setT('lr-aa', num(m.alphaAbs, 3));
    setT('lr-sat', m.sat ? num(m.sat, 0) : 'n/a'); setT('lr-rd', m.Rd == null ? 'n/a' : num(m.Rd, 2));
    var lim = document.querySelector('#lr-lim .n'); if (lim && cur) lim.textContent = cur.limit === 'Rubisco' ? 'Rubisco' : cur.limit === 'RuBP regeneration' ? 'light (electrons)' : cur.limit;
    var cap = document.getElementById('lo-lrc-cap');
    if (cap && cur) {
      var where = pp < (m.lcp || 0) ? 'below the compensation point: the leaf loses more CO₂ by respiration than it fixes' : (m.sat && pp < m.sat * 0.5 ? 'on the steep, light limited part: each extra photon adds carbon at the quantum efficiency' : (m.sat && pp >= m.sat ? 'on the plateau: more light adds little, Rubisco or electron transport capacity sets the rate' : 'on the bend, where light and capacity both matter'));
      cap.textContent = 'At ' + num(pp, 0) + ' µmol m⁻² s⁻¹ this ' + leaf + ' leaf fixes ' + sgn(cur.A, 1) + ' µmol CO₂ m⁻² s⁻¹, ' + where + '. ' +
        (leaf === 'sun' ? 'The shade leaf compensates at lower light, because it respires less, but saturates lower too.' : 'The sun leaf needs more light to break even, because it carries more Rubisco to maintain, and keeps climbing long after this one has flattened.');
    }
  }
  /* gas exchange window: CO2 in through the stoma, O2 out, sugars made, at the model rate */
  var GX = { mol: [], sug: [], acc: 0, accO: 0, fixed: 0 };
  function gxLay(w, h) { var ey = h - 66; return { ey: ey, stx: w * 0.46, sty: ey + 12, air: h - 4, chl: [[w * 0.16, h * 0.3], [w * 0.36, h * 0.2], [w * 0.58, h * 0.3], [w * 0.76, h * 0.17], [w * 0.27, h * 0.5]], vein: [w - 26, h * 0.42] }; }
  function drawGX(ctx, w, h, t, dt, info) {
    var dark = info.dark, Lg = gxLay(w, h), r = LP.result || {}, A = +r.A || 0, ey = Lg.ey;
    var bg = ctx.createLinearGradient(0, 0, 0, h);
    if (dark) { bg.addColorStop(0, '#0c1a14'); bg.addColorStop(1, '#0a1016'); } else { bg.addColorStop(0, '#eef5e6'); bg.addColorStop(1, '#f4eddc'); }
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, ey);
    /* air below the leaf */
    ctx.fillStyle = dark ? '#0b1626' : '#e6eef6'; ctx.fillRect(0, ey + 24, w, h - ey - 24);
    ctx.fillStyle = dark ? 'rgba(160,190,230,.55)' : 'rgba(60,80,110,.6)'; ctx.font = 'italic 11px ' + (getComputedStyle(document.body).fontFamily || 'serif'); ctx.textAlign = 'left'; ctx.fillText('air below the leaf', 8, h - 8);
    /* mesophyll cells (walls), so the chloroplasts sit inside cells */
    Lg.chl.forEach(function (c, i) {
      ctx.beginPath(); ctx.ellipse(c[0], c[1] + 4, 40, 30, 0, 0, 6.29);
      ctx.fillStyle = dark ? 'rgba(90,160,110,.10)' : 'rgba(120,170,100,.14)'; ctx.fill();
      ctx.strokeStyle = dark ? 'rgba(143,209,158,.35)' : 'rgba(61,107,47,.35)'; ctx.lineWidth = 2; ctx.stroke();
    });
    /* lower (abaxial) epidermis with a stoma; the gap is the pore */
    ctx.fillStyle = dark ? '#1c2a2e' : '#f6f7ee'; ctx.fillRect(0, ey, w, 24);
    ctx.strokeStyle = dark ? '#6f8f86' : '#7a8f73'; ctx.lineWidth = 1; ctx.strokeRect(0.5, ey, w - 1, 24);
    for (var ec = 0; ec < w; ec += 34) { ctx.beginPath(); ctx.moveTo(ec + 0.5, ey); ctx.lineTo(ec + 0.5, ey + 24); ctx.stroke(); }
    var gsO = Math.max(0.15, Math.min(1, (+r.gs || 0.3) / 0.4));
    ctx.fillStyle = dark ? '#0b1626' : '#e6eef6'; ctx.fillRect(Lg.stx - 22, ey, 44, 24);
    [-1, 1].forEach(function (sd) { ctx.beginPath(); ctx.ellipse(Lg.stx + sd * (8 + 3 * gsO), ey + 12, 8, 13, 0, 0, 6.29); ctx.fillStyle = dark ? '#2f6a3a' : '#a9d39a'; ctx.fill(); ctx.strokeStyle = dark ? '#8fd19e' : '#3d6b2f'; ctx.stroke(); });
    /* substomatal cavity */
    ctx.beginPath(); ctx.ellipse(Lg.stx, ey - 8, 26, 12, 0, Math.PI, 0); ctx.fillStyle = dark ? 'rgba(11,22,38,.8)' : 'rgba(230,238,246,.9)'; ctx.fill();
    /* chloroplasts */
    Lg.chl.forEach(function (c, i) {
      ctx.save(); ctx.translate(c[0], c[1]); ctx.rotate(0.3 * (i % 2 ? 1 : -1));
      var gr = ctx.createRadialGradient(-4, -3, 1, 0, 0, 18); gr.addColorStop(0, dark ? '#7fe07a' : '#8fcf72'); gr.addColorStop(1, dark ? '#2b6a2c' : '#3e8a36');
      ctx.beginPath(); ctx.ellipse(0, 0, 18, 9, 0, 0, 6.29); ctx.fillStyle = gr; ctx.fill();
      ctx.strokeStyle = dark ? 'rgba(200,255,200,.4)' : 'rgba(30,70,30,.5)'; ctx.lineWidth = 1;
      for (var k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(-10, k * 3); ctx.lineTo(10, k * 3); ctx.stroke(); }
      ctx.restore();
    });
    /* a minor vein on the right where sugar leaves */
    ctx.fillStyle = dark ? 'rgba(120,170,255,.18)' : 'rgba(43,95,164,.12)'; rr(ctx, w - 44, 26, 36, ey - 34, 14); ctx.fill();
    if (!(dt > 0) && !GX.mol.length && !GX.warm) { GX.warm = 1; for (var pw = 0; pw < 120; pw++) gxStep(1 / 30, Lg, h, A); }
    if (dt > 0) gxStep(dt, Lg, h, A);
    function gxStep(dt, Lg, h, A) {
      var k = 0.6;
      GX.acc += dt * k * Math.abs(A);
      while (GX.acc > 1) {
        GX.acc -= 1;
        if (A >= 0) { var tg = Lg.chl[Math.floor(Math.random() * Lg.chl.length)]; GX.mol.push({ t: 'co2', x: Lg.stx + (Math.random() - 0.5) * 30, y: h - 2, tx: tg[0], ty: tg[1], s: 0, o: tg, v: [Lg.stx, Lg.ey + 12], vf: 0.4 }); }
        else { var src = Lg.chl[Math.floor(Math.random() * Lg.chl.length)]; GX.mol.push({ t: 'co2out', x: src[0], y: src[1], tx: Lg.stx + (Math.random() - 0.5) * 30, ty: h + 10, s: 0, v: [Lg.stx, Lg.ey + 12], vf: 0.6 }); }
      }
      for (var i = GX.mol.length - 1; i >= 0; i--) {
        var m = GX.mol[i]; m.s += dt * (m.t === 'o2' ? 0.7 : 0.55);
        var e = Math.min(1, m.s);
        if (m.v) { var f0 = m.vf, a1 = e < f0, ea = a1 ? e / f0 : (e - f0) / (1 - f0), ax = a1 ? m.x : m.v[0], ay = a1 ? m.y : m.v[1], bx = a1 ? m.v[0] : m.tx, by = a1 ? m.v[1] : m.ty, wob = Math.min(1, Math.abs(e - f0) / 0.12); m.cx = ax + (bx - ax) * ea + Math.sin(m.s * 9 + i) * 3 * wob; m.cy = ay + (by - ay) * ea; }
        else { m.cx = m.x + (m.tx - m.x) * e + Math.sin(m.s * 9 + i) * 3; m.cy = m.y + (m.ty - m.y) * e; }
        if (m.s >= 1) {
          if (m.t === 'co2') { GX.fixed++; GX.mol.push({ t: 'o2', x: m.tx, y: m.ty, tx: Lg.stx + (Math.random() - 0.5) * 30, ty: h + 10, s: 0, v: [Lg.stx, Lg.ey + 12], vf: 0.6 }); if (GX.fixed % 6 === 0) GX.sug.push({ x: m.tx, y: m.ty, s: 0 }); }
          GX.mol.splice(i, 1);
        }
      }
      for (var j = GX.sug.length - 1; j >= 0; j--) { var sg = GX.sug[j]; sg.s += dt * 0.35; if (sg.s >= 1) GX.sug.splice(j, 1); }
    }
    GX.mol.forEach(function (m) {
      if (m.cx == null) return;
      if (m.t === 'o2') drawO2(ctx, m.cx, m.cy, dark); else drawCO2(ctx, m.cx, m.cy, dark);
    });
    GX.sug.forEach(function (sg) { var x = sg.x + (Lg.vein[0] - sg.x) * sg.s, y = sg.y + (Lg.vein[1] - sg.y) * sg.s; hexagon(ctx, x, y, 6, dark); });
    /* labels */
    TAGR = [];
    tag(ctx, 'CO₂ in ↑', Lg.stx - 30, h - 22, dark, 'right', { size: 10.5 });
    tag(ctx, '↓ O₂ out', Lg.stx + 30, h - 22, dark, 'left', { size: 10.5 });
    tag(ctx, 'stoma, lower surface', w - 52, ey + 12, dark, 'right', { size: 10 });
    tag(ctx, 'chloroplasts', 8, 14, dark, 'left', { size: 10.5 });
    tag(ctx, 'sugar to the vein', w - 8, 14, dark, 'right', { size: 10.5 });
    if (A < 0) tag(ctx, 'below compensation: CO₂ leaves', w / 2, h * 0.62, dark, 'center', { strong: true, size: 11 });
    var gxTags = TAGR; TAGR = null;
    /* slow and named: at most 2 named CO2 and 2 named O2 (1 each on phones), kept until they arrive */
    var nmg = [];
    GX.mol.forEach(function (m) { if (m.cx == null || m.s > 0.9) return; var k = m.t === 'o2' ? 'O₂' : 'CO₂'; nmg.push({ k: k, key: m, t: k, x: m.cx, y: m.cy, r: m.t === 'o2' ? 4 : 4.5, a: 1, age: m.s }); });
    (GX.namer = GX.namer || LP.names2d())(ctx, { dark: dark }, w, h, nmg, gxTags, { kinds: { 'CO₂': { maxAge: 0.35 }, 'O₂': { maxAge: 0.35 } } });
  }
  function ball(ctx, x, y, r, c, dark) {
    var gr = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
    gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.35, c); gr.addColorStop(1, c);
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.29); ctx.fill();
    ctx.strokeStyle = dark ? 'rgba(0,0,0,.4)' : 'rgba(0,0,0,.35)'; ctx.lineWidth = 0.7; ctx.stroke();
  }
  /* v19 identity colours (molcolor.js): atoms coloured by their molecule. CO2 a dark grey C between lighter grey O,
     O2 two crimson O */
  function idAtom(kind, el, dark) { var W = window.WPMolColor; return (W && W.atom && W.atom(kind, el, dark)) || ({ co2: dark ? { C: '#8a9098', O: '#d9dce0' } : { C: '#4f5359', O: '#a7aaaf' }, o2: { O: dark ? '#dd3c3c' : '#981b30' } }[kind][el]); }
  function drawCO2(ctx, x, y, dark) { ctx.strokeStyle = dark ? '#ccc' : '#555'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x - 6, y); ctx.lineTo(x + 6, y); ctx.stroke(); ball(ctx, x - 6, y, 3.2, idAtom('co2', 'O', dark), dark); ball(ctx, x + 6, y, 3.2, idAtom('co2', 'O', dark), dark); ball(ctx, x, y, 3.6, idAtom('co2', 'C', dark), dark); }
  function drawO2(ctx, x, y, dark) { ctx.strokeStyle = dark ? '#ccc' : '#555'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x - 3.5, y); ctx.lineTo(x + 3.5, y); ctx.stroke(); ball(ctx, x - 3.5, y, 3.2, idAtom('o2', 'O', dark), dark); ball(ctx, x + 3.5, y, 3.2, idAtom('o2', 'O', dark), dark); }
  function hexagon(ctx, x, y, r, dark) { ctx.beginPath(); for (var i = 0; i < 6; i++) { var a = Math.PI / 6 + i * Math.PI / 3; ctx[i ? 'lineTo' : 'moveTo'](x + r * Math.cos(a), y + r * Math.sin(a)); } ctx.closePath(); ctx.fillStyle = dark ? '#7fe07a' : '#3e9a3a'; ctx.fill(); ctx.strokeStyle = dark ? '#d6ffd0' : '#1f5a1c'; ctx.lineWidth = 1; ctx.stroke(); }

  /* ------------------------------------------------------------ 2.4 blue light and leaf build (Hogewoning et al. 2010, Table 1) */
  var HOG = {
    blue: [0, 7, 15, 22, 30, 50, 100],
    alpha: [0.045, 0.052, 0.053, 0.053, 0.053, 0.048, 0.045],
    fvfm: [0.76, 0.80, 0.80, 0.80, 0.81, 0.81, 0.81],
    rd: [0.93, 1.17, 1.29, 1.39, 1.27, 1.45, 1.33],
    absp: [90.0, 92.1, 92.4, 93.1, 94.0, 93.7, 95.4],
    ratio: [2.7, 2.6, 2.1, 1.7, 1.7, 1.4, 1.7],
    pss: [0.89, 0.89, 0.89, 0.89, 0.88, 0.87, 0.51],
    /* ΦPSII at the growth light (100 µmol m⁻² s⁻¹, same spectra), Table 1, read by the biophysicist panel 12 Oct (PMC2892149) */
    phi: [0.65, 0.74, 0.76, 0.76, 0.76, 0.77, 0.76]
  };
  var BL = { i: 3 };
  function drawBlue() {
    var host = document.getElementById('lo-blue'); if (!host) return;
    var panels = [
      { k: 'alpha', l: 'Light limited quantum yield', u: 'α, mol CO₂ per mol photon', d: 3, lo: 0.040, hi: 0.056 },
      { k: 'phi', l: 'ΦPSII at the growth light', u: 'PAM, 100 µmol m⁻² s⁻¹ (Plate III)', d: 2, lo: 0.60, hi: 0.80 },
      { k: 'fvfm', l: 'Fv/Fm, dark adapted', u: 'PSII health', d: 2, lo: 0.74, hi: 0.83 },
      { k: 'absp', l: 'Light absorbed', u: '% of the growth light', d: 1, lo: 88, hi: 96 },
      { k: 'ratio', l: 'Stomatal conductance ratio', u: 'lower : upper surface', d: 1, lo: 1, hi: 3 }
    ];
    if (ui.tier() >= 3) panels.push({ k: 'rd', l: 'Dark respiration', u: 'µmol m⁻² s⁻¹', d: 2, lo: 0.8, hi: 1.6 });
    var pw = 200, ph = 140;
    var dark = ui.isDark(), blueC = dark ? '#7f9cff' : '#2f4fc9';
    host.innerHTML = panels.map(function (P) {
      var ml = 36, mr = 16, mt = 42, mb = 26, n = HOG.blue.length;
      var x = function (i) { return ml + i / (n - 1) * (pw - ml - mr); }, y = function (v) { return mt + (P.hi - v) / (P.hi - P.lo) * (ph - mt - mb); };
      var d = HOG[P.k].map(function (v, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1); }).join('');
      var s = '<svg viewBox="0 0 ' + pw + ' ' + ph + '" class="lo-mini" role="img" aria-label="' + esc(P.l + ' against blue percentage, measured') + '">' +
        '<text class="mini-t" x="4" y="13">' + esc(P.l) + '</text><text class="mini-u" x="4" y="25">' + esc(P.u) + '</text>' +
        '<line class="dc-grid" x1="' + ml + '" x2="' + (pw - mr) + '" y1="' + (ph - mb) + '" y2="' + (ph - mb) + '"/>' +
        '<text class="dc-tk" x="' + (ml - 4) + '" y="' + (y(P.hi) + 4) + '" text-anchor="end">' + num(P.hi, P.d) + '</text>' +
        '<text class="dc-tk" x="' + (ml - 4) + '" y="' + (y(P.lo) + 2) + '" text-anchor="end">' + num(P.lo, P.d) + '</text>' +
        '<path d="' + d + '" fill="none" stroke="' + blueC + '" stroke-width="1.6" opacity=".7"/>' +
        HOG[P.k].map(function (v, i) { return '<circle cx="' + x(i) + '" cy="' + y(v) + '" r="' + (i === BL.i ? 5.5 : 3.2) + '" class="' + (i === BL.i ? 'mini-on' : 'mini-pt') + '"/>'; }).join('') +
        '<text class="mini-v" x="' + Math.min(pw - 40, Math.max(ml, x(BL.i) - 14)) + '" y="' + (y(HOG[P.k][BL.i]) - 9) + '">' + num(HOG[P.k][BL.i], P.d) + '</text>' +
        [0, 3, 6].map(function (i) { return '<text class="dc-tk" x="' + x(i) + '" y="' + (ph - 8) + '" text-anchor="' + (i === 6 ? 'end' : i === 0 ? 'start' : 'middle') + '"' + (i === 6 ? ' dx="8"' : i === 0 ? ' dx="-6"' : '') + '>' + HOG.blue[i] + ' %</text>'; }).join('') +
        '</svg>';
      return '<div class="lo-minibox">' + s + '</div>';
    }).join('') + '<div class="lo-minibox lo-stomata">' + stomataSVG(dark) + '</div>';
    var c = document.getElementById('lo-blue-cap');
    if (c) {
      var b = HOG.blue[BL.i];
      c.innerHTML = '<b>' + b + ' % blue</b> (the rest red, ' + '100 µmol m⁻² s⁻¹, cucumber): ' +
        (b === 0 ? 'with red light alone the leaves were damaged: Fv/Fm only 0.76 with patches between the veins, a low quantum yield, and stomata that did not respond to light. ' :
          b === 7 ? 'just 7 % blue was enough to restore normal photosynthesis, and light saturated photosynthesis was about twice that of the red only leaves. ' :
            b === 100 ? 'blue alone: photosynthesis worked normally, but the quantum yield fell back to 0.045 because a blue photon is used less efficiently than a red one, and PSS dropped to 0.51. ' :
              'leaf mass per area, chlorophyll and nitrogen per area kept rising with blue up to 50 %; above about 15 % blue the leaves looked like sun leaves grown in strong light. ') +
        'The upper surface gained stomata as blue rose; the lower to upper stomatal conductance ratio (porometer) was ' + num(HOG.ratio[BL.i], 1) + '. ' + ui.ev('leaf.hogTable', 'Table 1') + ' ' + ui.ev('blue_dose_amax', 'Amax');
    }
    Array.prototype.forEach.call(document.querySelectorAll('#lo-bluechips [data-i]'), function (x) { x.setAttribute('aria-pressed', +x.dataset.i === BL.i ? 'true' : 'false'); });
  }
  function stomataSVG(dark) {
    /* stomata drawn with the measured CONDUCTANCE ratio as a stand in for counts (Table 1 ratio is from a porometer; density only paralleled it): 12 on the lower surface, 12 / ratio on the upper; thickness for direction only */
    var ratio = HOG.ratio[BL.i], nLow = 12, nUp = Math.max(1, Math.round(nLow / ratio));
    var thick = [0.55, 0.72, 0.8, 0.86, 0.9, 1, 0.85][BL.i];
    var W = 200, H = 140, lt = 22 + 36 * thick, y0 = 82 - lt / 2;
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="lo-mini" role="img" aria-label="Leaf section with stomata on both surfaces, conductance ratio used as a stand in for counts">' +
      '<text class="mini-t" x="4" y="13">Stomata, both sides</text><text class="mini-u" x="4" y="25">spaced by the conductance ratio</text>' +
      '<rect x="10" y="' + y0 + '" width="' + (W - 20) + '" height="' + lt + '" rx="8" class="mini-leaf"/>';
    for (var i = 0; i < nUp; i++) { var x = 16 + (i + 0.5) * (W - 32) / nUp; s += '<ellipse cx="' + x + '" cy="' + y0 + '" rx="4" ry="2.4" class="mini-st"/>'; }
    for (var j = 0; j < nLow; j++) { var x2 = 16 + (j + 0.5) * (W - 32) / nLow; s += '<ellipse cx="' + x2 + '" cy="' + (y0 + lt) + '" rx="4" ry="2.4" class="mini-st"/>'; }
    s += '<text class="dc-tk" x="12" y="' + (y0 - 8) + '">upper surface ' + nUp + '</text><text class="dc-tk" x="12" y="' + (y0 + lt + 16) + '">lower surface ' + nLow + '</text>';
    s += '<text class="mini-u" x="4" y="' + (H - 4) + '">thickness drawn for direction only</text></svg>';
    return s;
  }

  /* ------------------------------------------------------------ markup */
  function chip(v, label, on, cls) { return '<button type="button" class="chip' + (cls ? ' ' + cls : '') + '" data-v="' + v + '" aria-pressed="' + (on ? 'true' : 'false') + '">' + label + '</button>'; }
  function tile(id, k, unit, cls) { return '<div class="tile' + (cls ? ' ' + cls : '') + '" id="' + id + '"><div class="k">' + k + '</div><div class="v"><span class="n">0</span> <small>' + (unit || '') + '</small></div></div>'; }
  function row(q, v, b, key) { return '<tr><td>' + esc(q) + '</td><td class="mono">' + esc(v) + '</td><td>' + ui.badge(b) + ' ' + ui.ev(key, 'Source') + '</td></tr>'; }
  /* L1 r5: model compensation points and A at 15 µmol, computed at the default leaf so the predict text always matches the engine */
  function modelLCP() {
    var D = LP.DEFAULTS || LP.state || {};
    var f = function (p, l) { var r = LP.solve ? LP.solve(Object.assign({}, D, { ppfd: p, leaf: l })) : null; return r ? r.A : 0; };
    var bis = function (l) { if (f(0, l) >= 0) return 0; var lo = 0, hi = 400; for (var i = 0; i < 40; i++) { var m = (lo + hi) / 2; if (f(m, l) < 0) lo = m; else hi = m; } return (lo + hi) / 2; };
    return { sun: num(bis('sun'), 0), shade: num(bis('shade'), 0), a15sun: sgn(f(15, 'sun'), 2), a15shade: sgn(f(15, 'shade'), 2) };
  }
  var MLCP = { sun: '19', shade: '10', a15sun: '−0.11', a15shade: '+0.24' };
  function mount(el) {
    var E = ui.ev;
    try { MLCP = modelLCP(); } catch (e) {}
    el.innerHTML =
      '<style>' + CSS + '</style>' +
      '<div class="lo-hero" id="lo-hero"></div>' +
      ui.now('<b>What is happening:</b> <span id="lo-now"></span>', 'lo-nowp') +

      '<figure class="fig lx-fig" id="lo-th-fig"><div class="fighead"><h3>2.1 Follow photons into a leaf</h3><p>A leaf is not a flat green film. Its cells guide, scatter and trap light. Switch the sky and watch the paths change.</p></div>' +
      '<div class="lx-frame lx-theatre" id="lo-th"></div>' +
      '<div class="lx-ctrls" role="group" aria-label="Leaf optics controls">' +
      '<div class="chips" role="group" aria-label="Sky" id="lo-light">' + chip('coll', 'Direct sun', true) + chip('diff', 'Fog or cloud (diffuse)', false) + '</div>' +
      '<div class="chips" role="group" aria-label="Leaf" id="lo-kind">' + chip('sun', 'Sun leaf', true) + chip('shade', 'Shade leaf', false) + '</div>' +
      '<div class="chips" role="group" aria-label="Colour of the photons" id="lo-col">' + COLS.map(function (c) { return chip(c.k, c.name, c.k === OP.col, c.t > 1 ? 'tier-2' : ''); }).join('') + '</div>' +
      '<div class="chips tier-2" role="group" aria-label="View" id="lo-view">' + chip('draw', 'Drawing', true) + chip('photo', 'Real grapevine leaf', false) + '</div>' +
      '<button type="button" class="btn small" id="lo-pause" aria-pressed="false">Pause</button></div>' +
      '<div class="tiles lo-tiles" id="lo-tiles">' + tile('lo-abs', 'Absorbed, 400 to 750 nm', '%') + tile('lo-ref', 'Reflected', '%') + tile('lo-tra', 'Passed through', '%') +
      tile('lo-pal', 'Of the absorbed, in palisade', '%', 'tier-2') + tile('lo-dep', 'Mean depth absorbed', 'µm, model', 'tier-3') + '</div>' +
      '<p class="cap lx-row" id="lo-th-cap"></p>' +
      '<p class="cap lx-row tier-2">Three things happen in every leaf. Palisade cells stand like columns and carry light that enters along their axis deep into the leaf: light guides. Light also slips through the gaps between columns without meeting a chloroplast: the sieve effect. In the spongy mesophyll, every wall between a cell and an air space bends and reflects light, so photons bounce around and travel further: more chances to be absorbed. ' + E('tissue_optics_review', 'Leaf optics review') + ' ' + E('leaf.mc', 'This model') + ' ' + E('leaf.anat', 'Anatomy') + '</p>' +
      '<p class="cap lx-row tier-2">Measured: sun leaves fixed 10 to 15 % more carbon in direct light than in diffuse light with the same absorbed photons; shade leaves did not care. ' + E('direct_vs_diffuse', 'Brodersen 2008') + '</p>' +
      '<p class="cap lx-row tier-2 lo-photocap" id="lo-photocap" hidden>Image: Albuquerque Lab (data of Albuquerque et al. 2020, J Exp Bot 71: 7286, doi 10.1093/jxb/eraa392). Cabernet Sauvignon lamina, toluidine blue, rotated and cropped. Photon paths are the model’s, drawn on top. The same leaf, with every tissue labelled, is on the Water Path journey: <a href="../journey/index.html#tissue">Water IV, the Tissue, “The real leaf”</a>. ' + E('leaf.photo', 'About the image') + '</p>' +
      '<p class="cap tier-3">Drawing scale: photons move ' + SPEED + ' µm of path per second on screen, about 10¹² times slower than light in water; the number launched per second follows PPFD (4 plus 32 × PPFD ÷ 2000). Stomata are drawn on the lower (abaxial) surface only. The bars on the right are the share of all incoming photons absorbed in each depth slice, from 3,200 model photons per setting.</p>' +
      '</figure>' +

      '<figure class="fig lx-fig tier-2" id="lo-depth-fig"><div class="fighead"><h3>2.2 Light is absorbed near the top, carbon is fixed deeper</h3><p>Each colour has its own light gradient. Use the sky and leaf buttons in 2.1 to change it.</p></div>' +
      '<div class="lx-frame lo-chart" id="lo-depth"></div><p class="cap lx-row" id="lo-depth-cap"></p></figure>' +

      '<figure class="fig lx-fig" id="lo-lrc-fig"><div class="fighead"><h3>2.3 The light response curve</h3><p>Turn up the light and read the leaf’s carbon balance: below the compensation point it loses carbon, then it climbs at the quantum efficiency, then it saturates.</p></div>' +
      '<div class="lo-lrcgrid"><div class="lx-frame lo-chart" id="lo-lrc"></div><div><div class="lx-frame lo-gx" id="lo-gx"></div><p class="cap">Gas exchange at one stoma on the lower surface, at the model rate. ' + E('leaf.gasScale', 'Scale') + '</p></div></div>' +
      '<div class="lx-ctrls"><div class="ctl lo-ctl"><label for="lo-ppfd">Light, PPFD <output id="lo-ppfd-o"></output></label><input type="range" id="lo-ppfd" min="0" max="2000" step="5"></div>' +
      '<div class="chips" role="group" aria-label="Leaf type" id="lo-leaf2">' + chip('sun', 'Sun leaf', true) + chip('shade', 'Shade leaf', false) + '</div></div>' +
      '<div class="tiles lo-tiles">' + tile('lr-A', 'Net CO₂ uptake', 'µmol m⁻² s⁻¹') + tile('lr-lcp', 'Compensation point', 'µmol m⁻² s⁻¹') +
      tile('lr-a', 'Quantum efficiency', 'mol CO₂ per mol incident photon', 'tier-2') + tile('lr-aa', 'Quantum efficiency, absorbed', 'mol per mol, ÷ 0.84', 'tier-3') +
      tile('lr-sat', 'Light for 90 % of the plateau', 'µmol m⁻² s⁻¹', 'tier-2') + tile('lr-rd', 'Dark respiration', 'µmol m⁻² s⁻¹', 'tier-3') + tile('lr-lim', 'What limits now', '', 'tier-3') + '</div>' +
      '<p class="cap lx-row" id="lo-lrc-cap"></p>' +
      '<p class="cap lx-row tier-2">Measured quantum yields for comparison: C3 leaves averaged 0.0524 mol CO₂ per mol absorbed photon at 30 °C in normal air and 0.0733 at 2 % O₂, because low O₂ stops photorespiration; cucumber grown with 7 to 30 % blue reached a light limited quantum yield of 0.052 to 0.053 (Table 1). Real lettuce breaks even higher than this model leaf: Salanova grown in a vertical farm had its compensation point near 50 µmol m⁻² s⁻¹. ' + E('lettuce_light_acclimation', 'Amitrano 2025') + ' The curve here is the site’s model, so read the shape, not the decimals. ' + E('quantum_yield_c3_c4', 'Ehleringer and Björkman 1977') + ' ' + E('leaf.hogTable', 'Hogewoning 2010') + ' ' + E('leaf.lrc', 'Model') + ' ' + E('light_response_illustrative', 'Sun and shade values') + '</p>' +
      '</figure>' +

      '<figure class="fig lx-fig" id="lo-blue-fig"><div class="fighead"><h3>2.4 Blue light builds a sun type leaf</h3><p>Cucumber grown under the same light level with different shares of blue. The points are the published measurements.</p></div>' +
      '<div class="chips" role="group" aria-label="Blue share of the growth light" id="lo-bluechips">' + HOG.blue.map(function (b, i) { return '<button type="button" class="chip" data-i="' + i + '" aria-pressed="' + (i === BL.i ? 'true' : 'false') + '">' + b + ' % blue</button>'; }).join('') + '</div>' +
      '<div class="lo-minis" id="lo-blue"></div>' +
      '<p class="cap lx-row" id="lo-blue-cap"></p>' +
      '<div class="lx-ctrls"><button type="button" class="btn small" id="lo-bluepush">Send this recipe to Plate I</button><span class="hint">Sets the shared light to this red and blue mix at 100 µmol m⁻² s⁻¹, the growth light of the study.</span></div>' +
      '<p class="cap lx-row tier-2">Strong light builds thicker leaves with more mass per area, more nitrogen and more Rubisco per area, and higher light saturated photosynthesis. Blue light pushes the same switches even at low light, through blue light receptors (cryptochromes and phototropins). How much of the sun leaf response is a blue light signal and how much is simply more photons is still being worked out. ' + E('sun_shade_review', 'Sun and shade review') + ' ' + E('sla_n_acclimation', 'Leaf mass and nitrogen') + ' ' + E('blue_dose_LMA_stomata', 'LMA and stomata') + '</p>' +
      '</figure>' +

      '<section class="lx-cases" aria-label="Real cases"><h3 class="lx-h3">Real cases to think with</h3><div class="lx-cardgrid">' +
      '<div class="card lx-case"><p class="lx-ck">Salinas lettuce, fog then sun</p><p>A summer morning under the marine layer gives diffuse light; by early afternoon the sky clears and light comes straight down. Sun type leaves use direct light 10 to 15 % better; under fog that advantage disappears, but diffuse light reaches the inner leaves of the head and the lower leaves of the bed. Light levels in the buttons are teaching values.</p><p>' + E('lettuce_fog_case', 'Scenario') + ' ' + E('direct_vs_diffuse', 'Brodersen 2008') + '</p><div class="chips"><button type="button" class="chip" data-case="fog">Fog morning</button><button type="button" class="chip" data-case="clear">Clear afternoon</button></div></div>' +
      '<div class="card lx-case"><p class="lx-ck">Coast live oak, sun and shade leaves on one tree</p><p>Leaves on the outside of a Quercus agrifolia crown and leaves deep inside grow in very different light. Compare the two curves in 2.3: the inside leaf breaks even in dim light but cannot use full sun. Which leaf would you expect to have more mass per area, and why might the tree build both?</p><p>' + E('leaf.oak', 'Teaching values') + ' ' + E('sun_shade_review', 'Sun and shade review') + '</p><div class="chips"><button type="button" class="chip" data-case="oakout">Outer crown leaf</button><button type="button" class="chip" data-case="oakin">Inner crown leaf</button></div></div>' +
      '<div class="card lx-case"><p class="lx-ck">A vertical farm recipe</p><p>Growers pick the blue share and the far red on purpose. About 7 % blue is enough to prevent the red only damage seen in cucumber; more blue gives thicker leaves with more mass per area; added far red expands leaves and raised lettuce dry weight 46 to 77 % in one study. What would you choose for a baby leaf crop sold by weight?</p><p>' + E('leaf.hogTable', 'Blue dose') + ' ' + E('farred_lettuce_vertical_farm', 'Far red, lettuce') + '</p><div class="chips"><button type="button" class="chip" data-case="farm">Load 15 % blue at 100</button></div></div>' +
      '<div class="card lx-case"><p class="lx-ck">Chaparral in full sun, Santa Monica Mountains</p><p>Midday on a south facing chaparral slope is about as bright as California gets. As the summer dries, Ceanothus leaves tilt toward vertical and absorb 6 to 20 % less August sunlight, which keeps them a little cooler and saves water (Comstock and Mahall 1985). Do steep leaves also light both faces, as in vertical Eucalyptus leaves 600 µm thick, where capacity peaked 75 µm under each surface and one sided gas exchange underestimated it by 21 %? For chaparral that is a question. The same slope at noon also costs water and heats Rubisco: follow it on <a href="#stroma">Light IV</a> and <a href="#tradeoff">Light V</a> (Santa Ana day).</p><p>' + E('leaf.comstock1985', 'Comstock 1985') + ' ' + E('isobilateral_eucalyptus', 'Evans and Vogelmann 2006') + '</p><div class="chips"><button type="button" class="chip" data-case="chap">Full sun, direct</button></div></div>' +
      '</div></section>' +

      '<section class="tier-3 lx-expert" aria-label="Expert"><h3 class="lx-h3">Equations, model rules and constants</h3>' +
      '<div class="card eq">Beer Lambert in a cuvette: I(z) = I₀ e<sup>−μz</sup>; a leaf departs from it because chlorophyll is packed into chloroplasts (sieve effect, flatter absorption) and because scattering lengthens the path (detour effect, steeper absorption).<br>' +
      'Model photon: step 1 µm; absorbed with p = 1 − e<sup>−μ(λ) c ds</sup> (c = 1 palisade, 0.62 spongy, 0.02 epidermis); palisade side wall reflects if |sin θ| &lt; 0.47; cell to air: spongy 45 %, palisade 25 % new random direction; cuticle reflection 0.04 + 0.25 |sin θ|⁶.<br>' +
      'Light response: J from θJ² − (I₂ + J<sub>max</sub>) J + I₂ J<sub>max</sub> = 0, I₂ = 0.80 × absorbed photons ÷ 2; A = min(A<sub>c</sub>, A<sub>j</sub>) − R<sub>d</sub>.<br>' +
      'Compensation point: A(I<sub>c</sub>) = 0, found by bisection. Quantum efficiency: slope of A between I<sub>c</sub> + 5 and I<sub>c</sub> + 35 µmol m⁻² s⁻¹; absorbed basis = slope ÷ 0.84.<br>' +
      'ETR = PPFD × ΦPSII × 0.84 × 0.5 assumes 84 % absorptance and an even split between the photosystems; cucumber leaves under red, blue or their mixes absorbed 90.0 to 95.4 %.</div>' +
      '<div class="lx-tw"><table class="lx-tab"><thead><tr><th>Quantity</th><th>Value</th><th>Status</th></tr></thead><tbody>' +
      row('Absorption per µm, palisade', 'blue 0.039, green 0.0066, red 0.034, far red 0.0006', 'ILLUSTRATIVE', 'leaf.mc') +
      row('Sun and shade leaf anatomy', 'palisade about 90 and 40 µm tall', 'ILLUSTRATIVE', 'leaf.anat') +
      row('Direct vs diffuse light, sun leaves', '10 to 15 % more A in direct', 'VERIFIED', 'direct_vs_diffuse') +
      row('Carboxylation, palisade : spongy', '60 : 40 (spinach)', 'VERIFIED', 'carbon_fixation_gradient') +
      row('Quantum yield, C3, 30 °C', '0.0524 (21 % O₂), 0.0733 (2 % O₂)', 'VERIFIED', 'quantum_yield_c3_c4') +
      row('Theoretical maximum quantum yield', '0.125 (8 photons per CO₂)', 'DERIVED', 'max_quantum_yield') +
      row('Measured O₂ yield, 37 C3 species, saturating CO₂', '0.106 ± 0.001 per absorbed photon; Fv/Fm 0.832', 'VERIFIED', 'leaf.bjorkman1987') +
      row('Cucumber, blue dose, Table 1', 'α 0.045 to 0.053; absorptance 90.0 to 95.4 %; ΦPSII at the growth light 0.65 to 0.77', 'VERIFIED', 'leaf.hogTable') +
      row('Vcmax at 25 °C, sun and shade', '60 and 30 µmol m⁻² s⁻¹', 'ILLUSTRATIVE', 'vcmax_jmax_illustrative') +
      row('Sun and shade compensation and saturation', '20 to 40 and 1000 to 1500; 5 to 10 and 200 to 400 (this model: sun leaf ' + MLCP.sun + ', shade leaf ' + MLCP.shade + ')', 'ILLUSTRATIVE', 'light_response_illustrative') +
      row('Lettuce (Salanova, vertical farm), compensation point', 'about 50 to 52 µmol m⁻² s⁻¹; 1,200 treated as saturating', 'VERIFIED', 'lettuce_light_acclimation') +
      '</tbody></table></div>' +
      '<div class="card lx-open"><p class="lx-ck">' + ui.badge('OPEN QUESTION') + ' Does a fluorometer on the leaf surface see the whole leaf?</p><p>PAM fluorometers read chlorophyll fluorescence from the surface, but the cells at the top and the bottom of a leaf sit in very different light. In optically dense tissue, surface quantum yields can under or overestimate the depth averaged value. How much this matters for thick sun leaves of crops is still open. ' + E('etr_gradient_caveat', 'Lichtenberg 2017') + '</p></div>' +
      '<div class="card lx-open"><p class="lx-ck">' + ui.badge('OPEN QUESTION') + ' Is diffuse light better or worse?</p><p>For a single sun leaf, direct light wins by 10 to 15 %. For a whole canopy, diffuse light spreads photons to shaded leaves that are far from saturation, so a hazy day can fix as much carbon as a clear one. Which effect wins in a Salinas lettuce bed under the marine layer? The leaf answer and the canopy answer differ. ' + E('direct_vs_diffuse', 'Brodersen 2008') + '</p></div>' +
      ui.howto('leaf.sphere') + ui.howto('leaf.lrc') +
      ui.design({ title: 'do fog grown lettuce leaves break even sooner?',
        question: 'Do lettuce leaves that grow under low, diffuse light (a Salinas marine layer, or shade cloth) acclimate like shade leaves: lower compensation point, lower light saturated rate, lower leaf mass per area?',
        treat: 'Shade cloth that cuts light to about a third (diffuse, low) against open sky, same field, same planting date, from transplant to the measurement.',
        measure: 'A light response curve on the youngest fully expanded leaf (compensation point, quantum efficiency, plateau); absorptance of the same leaf in an integrating sphere, so quantum efficiency can be put on an absorbed basis; leaf mass per area from discs.',
        howto: ['leaf.lrc', 'leaf.sphere'],
        n: 'Plots are the replicates: 4 shaded and 4 open plots in randomised blocks, 2 plants per plot, one curve per plant. Run curves from the two treatments alternately through the morning so time of day is balanced.',
        expect: 'This model gives a compensation point of ' + MLCP.sun + ' µmol m⁻² s⁻¹ for its sun leaf and ' + MLCP.shade + ' for its shade leaf (DERIVED, teaching parameters). Real lettuce from a vertical farm compensated near 50 µmol m⁻² s⁻¹ and built more leaf mass per area at more light, so expect a real difference in the same direction, larger in size. ' + E('lettuce_light_acclimation', 'Amitrano 2025') + ' ' + E('leaf.lrc', 'Model'),
        confound: 'Leaf age and position. Shaded plants develop more slowly, so the “youngest fully expanded leaf” is a different leaf on a different day. Match leaves by node number or by days since emergence, not by date, and measure every curve at the same leaf temperature.' }) +
      '</section>' +

      '<section class="lx-qs" aria-label="Questions"><h3 class="lx-h3">Predict, then check</h3>' +
      ui.reveal('A leaf absorbs about 90 % of red light but only about 70 % of green. Does that mean green light is useless for photosynthesis?',
        '<p>No. Most green photons are still absorbed, and because they are absorbed weakly they reach deeper cells that blue and red have not saturated. In strong white light, extra green drove sunflower photosynthesis more than extra red. Try it in 2.1: pick Green and watch the paths go deeper. ' + E('green_light_deep', 'Terashima 2009') + '</p>', { choices: [['No: green goes deeper and drives cells lower in the leaf', true, 'Weak absorption is a feature: green reaches cells that red and blue have already left behind.'], ['Yes: plants reflect green, so they cannot use it', false, 'They reflect some green, but most green photons are still absorbed.'], ['Yes: chlorophyll does not absorb green at all', false, 'Absorption is low in a cuvette, but a leaf’s scattering makes the path long, so most green is absorbed.']] }) +
      '<div class="tier-2">' + ui.reveal('Switch 2.1 from Direct sun to Fog. Predict what happens to how deep red light gets, and explain why a sun leaf cares more than a shade leaf.',
        '<p>Diffuse photons enter at steep angles, escape the palisade columns sideways and are absorbed nearer the top. A sun leaf has tall palisade columns built to carry collimated light deep, so it gains more from direct light (10 to 15 % in Brodersen et al. 2008); a shade leaf with short wide cells has little to lose. ' + E('direct_vs_diffuse', 'Brodersen 2008') + '</p>', { choices: [['Red gets less deep in fog; the sun leaf loses more', true, 'Diffuse photons escape the palisade light guides sideways, and the sun leaf is the one built to use them.'], ['Red goes deeper in fog', false, 'Diffuse light enters at steep angles and is absorbed nearer the top.'], ['No change: the colour is the same', false, 'Direction matters as much as colour inside a leaf.']] }) + '</div>' +
      '<div class="tier-2">' + ui.reveal('In 2.3, set the light to 15 µmol m⁻² s⁻¹, dim like the inside of a lettuce head. Which leaf, sun or shade, has positive net CO₂ uptake?',
        '<p>Only the shade leaf (this model: shade ' + MLCP.a15shade + ', sun ' + MLCP.a15sun + ' µmol m⁻² s⁻¹). Its compensation point is lower, ' + MLCP.shade + ' against ' + MLCP.sun + ' µmol m⁻² s⁻¹, because it has less Rubisco and protein to maintain, so its respiration is lower. The sun leaf is still respiring more than it fixes. Above a few hundred µmol m⁻² s⁻¹ the order flips. ' + E('leaf.lrc', 'Model') + '</p>',
        { choices: [['Only the shade leaf', true, 'Less protein to maintain means less respiration to pay back, so it breaks even sooner.'], ['Only the sun leaf', false, 'The sun leaf has more Rubisco, but that only pays off in bright light. In dim light its higher respiration wins.'], ['Both', false, 'At 15 µmol m⁻² s⁻¹ the sun leaf is still below its compensation point.'], ['Neither', false, 'The shade leaf is already above its compensation point here.']] }) + '</div>' +
      '<div class="tier-3">' + ui.reveal('Your model leaf has a quantum efficiency of about 0.053 per absorbed photon at 25 °C in air. The theoretical maximum is 0.125. Account for the gap.',
        '<p>Eight photons per CO₂ is the minimum for two NADPH; real leaves also need ATP beyond what linear flow supplies (cyclic flow uses extra photons), lose some energy as heat and fluorescence even in dim light, and at 21 % O₂ photorespiration spends part of the electrons on oxygenation. At 2 % O₂ measured yields rise to about 0.073. A measured anchor splits the gap: at saturating CO₂, where photorespiration is gone, 37 C3 species gave 0.106 O₂ per absorbed photon (Björkman and Demmig 1987). So 0.125 down to 0.106 is the cost the light reactions and carbon reduction always pay (extra ATP from cyclic flow, losses in the photosystems), and 0.106 down to about 0.05 in normal air is mostly photorespiration at 21 % O₂. ' + E('max_quantum_yield', 'Maximum') + ' ' + E('leaf.bjorkman1987', 'Björkman 1987') + ' ' + E('quantum_yield_c3_c4', 'Measured') + '</p>',
        { choices: [['Photorespiration alone', false, 'It is the biggest single cost in air, but even with photorespiration removed leaves stay below 0.125.'], ['Several costs: extra ATP, losses in the photosystems, and photorespiration', true, 'Measured yields at saturating CO₂ (0.106) and at 2 % O₂ (0.073) let you separate them.'], ['The leaf does not absorb all the light', false, 'This yield is already per ABSORBED photon, so absorptance is taken out.']] }) + '</div>' +
      '</section>' +
      (ui.quiz ? ui.quiz('leaf') : '');

    /* theatre */
    TH.anim = ui.anim(el.querySelector('#lo-th'), {
      height: function (w) { return w < 560 ? 460 : 540; }, label: 'Photons entering a leaf cross section: guided by palisade cells, scattered in the spongy mesophyll, absorbed, reflected or transmitted',
      draw: drawTheatre, settle: settle, resize: function () { TH.lay = null; TH.bg = null; TH.bgKey = ''; }
    });
    TH.img = new Image();
    TH.img.onload = function () { TH.imgOK = true; TH.bgKey = ''; if (TH.anim) TH.anim.redraw(); };
    TH.img.alt = 'Cabernet Sauvignon leaf lamina, light micrograph';
    group(el.querySelector('#lo-light'), function (v) { OP.light = v; changed(); });
    group(el.querySelector('#lo-kind'), function (v) { OP.kind = v; if (OP.view === 'photo' && v === 'shade') setView('draw'); changed(); if (LP.state.leaf !== v) LP.set({ leaf: v }); });
    group(el.querySelector('#lo-col'), function (v) { OP.col = v; changed(); });
    group(el.querySelector('#lo-view'), function (v) { setView(v); changed(); });
    var pb = el.querySelector('#lo-pause');
    if (window.PlaySpeed) pb.parentNode.insertBefore(window.PlaySpeed.chip('ps-light'), pb.nextSibling);
    pb.addEventListener('click', function () { var p = !TH.anim.paused(); TH.anim.pause(p); pb.setAttribute('aria-pressed', p ? 'true' : 'false'); pb.textContent = p ? 'Play' : 'Pause'; });
    if (TH.anim.freeze) TH.anim.freeze.bind(pb); // v19: click the view to freeze, in step with Pause

    /* light response */
    var sl = el.querySelector('#lo-ppfd');
    sl.value = Math.round(+LP.state.ppfd || 0);
    sl.addEventListener('input', function () { LP.set({ ppfd: +sl.value }); });
    group(el.querySelector('#lo-leaf2'), function (v) { LP.set({ leaf: v }); });
if (window.WPMolColor) { var mk3 = el.querySelector('#lo-gx'); if (mk3) mk3.insertAdjacentHTML('afterend', WPMolColor.key(['co2', 'o2'])); } // v19: the site wide molecule key
    GX.anim = ui.anim(el.querySelector('#lo-gx'), { height: function (w) { return w < 560 ? 300 : 320; }, label: 'CO2 entering a stoma on the lower surface, O2 leaving and sugars moving to a vein, at the model rate', draw: drawGX });

    /* blue */
    el.querySelector('#lo-bluechips').addEventListener('click', function (e) { var b = e.target.closest('[data-i]'); if (!b) return; BL.i = +b.dataset.i; drawBlue(); });
    el.querySelector('#lo-bluepush').addEventListener('click', function () {
      var b = HOG.blue[BL.i] / 100;
      LP.set({ ppfd: 100, spectrum: { blue: b, green: 0, red: 1 - b, farred: 0 } });
      var n = document.getElementById('lo-now'); if (n) n.textContent = 'The shared light is now ' + HOG.blue[BL.i] + ' % blue and ' + (100 - HOG.blue[BL.i]) + ' % red at 100 µmol m⁻² s⁻¹. Plate I shows its spectrum and colour.';
    });

    /* cases */
    el.addEventListener('click', function (e) {
      var b = e.target.closest('[data-case]'); if (!b) return;
      var c = b.dataset.case;
      if (c === 'fog') { setOP({ light: 'diff', kind: 'sun' }); LP.set({ ppfd: 300, leaf: 'sun' }); }
      else if (c === 'clear') { setOP({ light: 'coll', kind: 'sun' }); LP.set({ ppfd: 1800, leaf: 'sun' }); }
      else if (c === 'oakout') { setOP({ light: 'coll', kind: 'sun' }); LP.set({ ppfd: 1600, leaf: 'sun' }); }
      else if (c === 'oakin') { setOP({ light: 'diff', kind: 'shade' }); LP.set({ ppfd: 60, leaf: 'shade' }); }
      else if (c === 'farm') { BL.i = 2; drawBlue(); var bb = HOG.blue[BL.i] / 100; setOP({ light: 'coll', kind: 'sun' }); LP.set({ ppfd: 100, spectrum: { blue: bb, green: 0, red: 1 - bb, farred: 0 } }); }
      else if (c === 'chap') { setOP({ light: 'coll', kind: 'sun' }); LP.set({ ppfd: 2000, leaf: 'sun' }); }
      var f = document.getElementById(c === 'farm' ? 'lo-blue-fig' : 'lo-th-fig'); if (f && f.scrollIntoView) f.scrollIntoView({ behavior: ui.reducedMotion() ? 'auto' : 'smooth', block: 'start' });
    });
    ui.onPrefs(function () { drawDepth(); drawLRC(); drawBlue(); TH.bgKey = ''; });
    var tierObs = document.getElementById('wp-root');
    if (tierObs && 'MutationObserver' in window) new MutationObserver(function () { TH.bgKey = ''; drawDepth(); drawLRC(); drawBlue(); if (TH.anim) TH.anim.redraw(); }).observe(tierObs, { attributes: true, attributeFilter: ['data-tier'] });
    if ('ResizeObserver' in window) { var rzT = 0, lastW = 0; new ResizeObserver(function (es) { var w = Math.round(es[0].contentRect.width); if (Math.abs(w - lastW) < 30) return; lastW = w; clearTimeout(rzT); rzT = setTimeout(function () { drawDepth(); drawLRC(); }, 120); }).observe(el); }
    changed(); drawLRC(); drawBlue(); syncLRCControls(LP.state);
    try { h2Init(el.querySelector('#lo-hero')); } catch (e) { console.error(e); }
    el.addEventListener('click', function () { if (H2.ctx) setTimeout(function () { h2Live(); H2.ctx.invalidate(); }, 0); });
  }
  function setView(v) {
    OP.view = v;
    if (v === 'photo') { if (TH.img && !TH.img.src) TH.img.src = 'img/CS_1_lamina_20X_rotated.jpg'; if (OP.kind === 'shade') OP.kind = 'sun'; }
    var pc = document.getElementById('lo-photocap'); if (pc) pc.hidden = v !== 'photo';
    syncChips();
  }
  function setOP(o) { Object.keys(o).forEach(function (k) { OP[k] = o[k]; }); if (OP.view === 'photo' && OP.kind === 'shade') setView('draw'); changed(); }
  function syncChips() {
    [['lo-light', OP.light], ['lo-kind', OP.kind], ['lo-col', OP.col], ['lo-view', OP.view]].forEach(function (p) {
      var g = document.getElementById(p[0]); if (!g) return;
      Array.prototype.forEach.call(g.querySelectorAll('[data-v]'), function (x) { x.setAttribute('aria-pressed', x.dataset.v === p[1] ? 'true' : 'false'); });
    });
  }
  function group(g, fn) {
    g.addEventListener('click', function (e) {
      var b = e.target.closest('[data-v]'); if (!b) return;
      Array.prototype.forEach.call(g.querySelectorAll('[data-v]'), function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      fn(b.dataset.v);
    });
  }
  function changed() {
    syncChips();
    TH.stat = curStat(); TH.lay = null; TH.bgKey = ''; TH.ph = []; TH.flashes = [];
    if (TH.anim) { if (ui.reducedMotion()) { TH.anim.redraw(); } else TH.anim.redraw(); }
    var st = TH.stat;
    function setT(id, v) { var e = document.querySelector('#' + id + ' .n'); if (e) e.textContent = v; }
    setT('lo-abs', num(100 * st.abs, 0)); setT('lo-ref', num(100 * st.ref, 0)); setT('lo-tra', num(100 * st.tra, 0));
    setT('lo-pal', num(100 * st.pal / Math.max(1e-9, st.pal + st.spg), 0)); setT('lo-dep', num(st.meanZ, 0));
    var cn = OP.col === 'mix' ? 'the light mixed on Plate I' : COLS.filter(function (c) { return c.k === OP.col; })[0].name.toLowerCase() + ' light';
    var cap = document.getElementById('lo-th-cap');
    if (cap) cap.textContent = (OP.light === 'coll' ? 'Direct sun: photons arrive almost straight down, so many travel the length of a palisade column before a chloroplast catches them. ' : 'Diffuse light: photons arrive from every angle, leave the palisade columns sideways and are caught near the top; more bounce back off the cuticle. ') +
      'Of ' + cn + ', this ' + (OP.view === 'photo' ? 'grapevine' : OP.kind) + ' leaf absorbs ' + num(100 * st.abs, 0) + ' %, reflects ' + num(100 * st.ref, 0) + ' % and lets ' + num(100 * st.tra, 0) + ' % pass through.';
    var now = document.getElementById('lo-now');
    if (now) now.textContent = nowText(st);
    drawDepth();
  }
  function nowText(st) {
    var p = +(LP.state && LP.state.ppfd) || 0, r = LP.result;
    if (p <= 0) return 'No light reaches the leaf, so it only respires. Raise the light in 2.3 or on Plate I.';
    return num(p, 0) + ' µmol of photons per square metre each second land on a ' + (LP.state.leaf === 'shade' ? 'shade' : 'sun') + ' leaf. About ' + num(100 * st.abs, 0) + ' % are absorbed, mostly in the top layers' + (r ? ', and the leaf takes up ' + sgn(r.A, 1) + ' µmol of CO₂ per square metre each second.' : '.');
  }
  function syncLRCControls(st) {
    var sl = document.getElementById('lo-ppfd'), o = document.getElementById('lo-ppfd-o');
    if (sl && document.activeElement !== sl) sl.value = Math.round(+st.ppfd || 0);
    if (o) o.textContent = num(+st.ppfd || 0, 0) + ' µmol m⁻² s⁻¹';
    var g = document.getElementById('lo-leaf2');
    if (g) Array.prototype.forEach.call(g.querySelectorAll('[data-v]'), function (x) { x.setAttribute('aria-pressed', x.dataset.v === (st.leaf === 'shade' ? 'shade' : 'sun') ? 'true' : 'false'); });
  }
  var lastSpec = '';
  function update(st) {
    if (!st) return;
    if (H2.ctx) { h2Live(); H2.ctx.invalidate(); }
    syncLRCControls(st);
    var lf = st.leaf === 'shade' ? 'shade' : 'sun';
    if (lf !== OP.kind && !(OP.view === 'photo' && lf === 'shade')) { OP.kind = lf; changed(); }
    drawLRC();
    var sk = JSON.stringify(st.spectrum || {});
    if (OP.col === 'mix' && sk !== lastSpec) { lastSpec = sk; changed(); }
    else { var now = document.getElementById('lo-now'); if (now && TH.stat) now.textContent = nowText(TH.stat); }
  }

  var CSS =
    '#lv-leaf .lx-theatre{min-height:380px}' +
    '#lv-leaf .lx-ctrls{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;margin:10px 0 0}' +
    '#lv-leaf .lo-tiles{margin-top:10px}' +
    '#lv-leaf .lo-chart{background:var(--wall);padding:6px}' +
    '#lv-leaf .lo-svg{display:block;width:100%;height:auto}' +
    '#lv-leaf .dc-band.pal{fill:var(--chl);opacity:.14}#lv-leaf .dc-band.spg{fill:var(--chl);opacity:.07}#lv-leaf .dc-band.ep{fill:var(--cut);opacity:.12}' +
    '#lv-leaf .dc-bl,#lv-leaf .dc-tk{fill:var(--ink2);font-family:var(--ui);font-size:11px}' +
    '#lv-leaf .dc-grid{stroke:var(--rule2);stroke-width:1}' +
    '#lv-leaf .dc-sb{fill:var(--rule2)}#lv-leaf .dc-pb{opacity:.85}' +
    '#lv-leaf .dc-pc{fill:#fff;font-family:var(--mono);font-size:12px;font-weight:600;paint-order:stroke;stroke:rgba(0,0,0,.6);stroke-width:3px;stroke-linejoin:round}' +
    '#lv-leaf .lo-lrcgrid{display:grid;grid-template-columns:minmax(0,1fr);gap:12px}' +
    '@media (min-width:900px){#lv-leaf .lo-lrcgrid{grid-template-columns:minmax(0,3fr) minmax(0,2fr);align-items:start}}' +
    '#lv-leaf .lr-main{fill:none;stroke:var(--accent);stroke-width:3}#lv-leaf .lr-other{fill:none;stroke:var(--ink3);stroke-width:1.6;stroke-dasharray:6 4}' +
    '#lv-leaf .lr-o2{fill:none;stroke:var(--b-der);stroke-width:1.6;stroke-dasharray:2 3}' +
    '#lv-leaf .lr-zero{stroke:var(--ink);stroke-width:1}#lv-leaf .lr-slope{stroke:var(--warm);stroke-width:1.6;stroke-dasharray:5 4}' +
    '#lv-leaf .lr-mark,#lv-leaf .lr-sat{stroke:var(--warm);stroke-width:2}#lv-leaf .lr-sat{stroke-dasharray:3 3;stroke-width:1.4}' +
    '#lv-leaf .lr-lab{fill:var(--warm);font-family:var(--ui);font-size:11.5px;font-weight:600}' +
    '#lv-leaf .lr-key{fill:var(--accent);font-family:var(--ui);font-size:12px;font-weight:600}#lv-leaf .lr-key2{fill:var(--ink3);font-family:var(--ui);font-size:11px}' +
    '#lv-leaf .lr-now{fill:var(--accent);stroke:var(--paper);stroke-width:2.5}' +
    '#lv-leaf .lo-ctl{flex:1 1 260px;border:1px solid var(--rule2);background:var(--card)}' +
    '#lv-leaf .lo-minis{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-top:10px}#lv-leaf .lx-cardgrid{grid-template-columns:repeat(auto-fit,minmax(min(100%,380px),1fr))}#lv-leaf .dc-cl{font-family:var(--ui);font-size:12px;font-weight:600;fill:var(--ink)}' +
    '#lv-leaf .lo-minibox{background:var(--wall);border:1px solid var(--rule);border-radius:4px;padding:4px}' +
    '#lv-leaf .lo-mini{display:block;width:100%;height:auto}' +
    '#lv-leaf .mini-t{fill:var(--ink);font-family:var(--ui);font-size:12px;font-weight:600}#lv-leaf .mini-u{fill:var(--ink2);font-family:var(--ui);font-size:10.5px}' +
    '#lv-leaf .mini-pt{fill:var(--paper);stroke:#2f4fc9;stroke-width:1.6}#lv-leaf .mini-on{fill:#2f4fc9;stroke:var(--paper);stroke-width:2}' +
    ':root[data-theme="dark"] #lv-leaf .mini-pt{stroke:#7f9cff}:root[data-theme="dark"] #lv-leaf .mini-on{fill:#7f9cff}' +
    '@media (prefers-color-scheme: dark){:root:not([data-theme="light"]) #lv-leaf .mini-pt{stroke:#7f9cff}:root:not([data-theme="light"]) #lv-leaf .mini-on{fill:#7f9cff}}' +
    '#lv-leaf .mini-v{fill:var(--ink);font-family:var(--mono);font-size:11.5px;font-weight:600}' +
    '#lv-leaf .mini-leaf{fill:var(--chl);opacity:.35;stroke:var(--chl);stroke-width:1.5}#lv-leaf .mini-st{fill:var(--paper);stroke:var(--ink);stroke-width:1.2}' +
    '#lv-leaf .lo-gx{min-height:200px}' +
    '#lv-leaf .hint{font-family:var(--ui);font-size:12.5px;color:var(--ink2)}';

  /* L1 r5: Show me, about 40 s, for presentation (designer panel 14) */
  LP.showme = LP.showme || {};
  LP.showme.leaf = [
    { at: '#lo-th-fig', click: '#lo-light [data-v="coll"]', say: 'Direct sun: red photons run down the palisade cells like light guides and reach deep.', wait: 7000 },
    { at: '#lo-th-fig', click: '#lo-light [data-v="diff"]', say: 'Fog: the same photons arrive from every angle, escape the guides and are caught near the top.', wait: 7000 },
    { at: '#lo-th-fig', click: '#lo-col [data-v="green"]', say: 'Green is absorbed weakly, so it gets deeper than red or blue. Not useless: it feeds the lower cells.', wait: 7000 },
    { at: '#lo-th-fig', click: '#lo-kind [data-v="shade"]', say: 'A shade leaf is thinner, with short palisade cells: less leaf to build and to keep alive.', wait: 6500 },
    { at: '#lo-lrc', click: '#lo-leaf2 [data-v="shade"]', say: 'Its light response: breaks even in dim light, but cannot use full sun.', wait: 6500 },
    { at: '#lo-th-fig', fn: function () { var b = document.querySelector('#lo-light [data-v="coll"]'); if (b) b.click(); b = document.querySelector('#lo-col [data-v="red"]'); if (b) b.click(); b = document.querySelector('#lo-kind [data-v="sun"]'); if (b) b.click(); }, say: 'Back to a sun leaf in direct light. Your turn.', wait: 4000 }
  ];

  /* ================================================================== LB14 (14 Oct): Light II macro hero, light entering a leaf
     Three.js r128 through LP.macro (lmacro.js). A block of leaf cut open: glossy cuticle, pillow shaped upper epidermis
     cells, columnar palisade cells lined with chloroplasts (lit ball sprites), lobed spongy cells with air spaces, lower
     epidermis with one stoma. Sun leaf: two palisade layers; shade leaf: one shorter layer and more spongy tissue (follows
     the 2.1 switch and the Conditions leaf). Photons, coloured by the live spectrum, fall as nearly parallel rays (direct
     sun) or from every angle (diffuse, 2.1 switch), run straight down the palisade and scatter in the spongy mesophyll; each
     colour has its own mean path before a chloroplast takes it (blue and red short, green long, far red longest), so blue
     and red are taken near the top and green and far red reach deep or leave through the lower side. The path lengths are
     ILLUSTRATIVE (ordering from the plate's sources); the photon count follows the model PPFD. */
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
  var H2 = { ctx: null };
  var H2PATH = { blue: 1.1, red: 1.6, green: 5.0, farred: 14 };
  function h2Build(ctx) {
    var T = ctx.THREE, MM = LP.macro, root = ctx.root, far = ctx.far, S = H2, se = MM.superEllipsoid;
    S.T = T;
    var rnd = (function (s) { return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; })(211);
    S.rnd = rnd;
    var cellG = se(1, 1, 1, 0.55, 9, 6);
    function cells(list, col, o) {
      var g = MM.merge(T, list.map(function (c) { return { geo: cellG, color: c.col || col, pos: c.p, scale: c.s }; }));
      var m = MM.glass(T, 0xffffff, o || {}); m.vertexColors = true;
      var mesh = new T.Mesh(g, m); mesh.renderOrder = 2; return mesh;
    }
    var X0 = -6, X1 = 6, Z0 = -1.45, Z1 = 1.45;
    // cuticle and the two epidermes (shared by both leaf types)
    var cut = new T.Mesh(new T.BoxGeometry(X1 - X0 + 0.4, 0.07, Z1 - Z0 + 0.4), MM.glass(T, 0xf6f0d0, { opacity: 0.35, clearcoat: 1, ccr: 0.03, env: 1.2 }));
    cut.position.set(0, 2.66, 0); root.add(cut);
    var up = [], lo = [];
    for (var x = X0 + 0.55; x < X1; x += 1.1) for (var z = Z0 + 0.5; z < Z1; z += 1.05) {
      up.push({ p: [x + (rnd() - 0.5) * 0.1, 2.33, z], s: [0.55, 0.3, 0.52], col: 0xd6ecb4 });
      if (Math.abs(x - 2.2) > 0.9 || Math.abs(z) > 0.6) lo.push({ p: [x, -2.55, z], s: [0.55, 0.24, 0.52], col: 0xdfeac6 });
    }
    root.add(cells(up, 0xe8f2d0, { opacity: 0.34, env: 1 }));
    root.add(cells(lo, 0xdfeac6, { opacity: 0.32 }));
    // the stoma on the lower side: two guard cells
    [[-0.3], [0.3]].forEach(function (d) { var g = new T.Mesh(se(0.27, 0.26, 0.64, 0.6, 12, 8), MM.glass(T, 0x7fb24a, { opacity: 0.75 })); g.position.set(2.2 + d[0], -2.55, 0); root.add(g); });
    var slit = new T.Mesh(se(0.06, 0.2, 0.42, 0.7, 8, 6), MM.lin(new T.MeshBasicMaterial({ color: 0x24341a, transparent: true, opacity: 0.85 }))); slit.position.set(2.2, -2.55, 0); root.add(slit);
    S.stomaChl = MM.balls(T, [[1.88, -2.5, -0.25], [1.88, -2.5, 0.2], [2.52, -2.5, -0.2], [2.52, -2.5, 0.25]], 0x3f9a2a, 0.22); root.add(S.stomaChl);
    // two leaf types
    function leafType(kind) {
      var G = new T.Group(), pal = [], spg = [], chl = [];
      var rows = kind === 'sun' ? [{ y: 1.18, ry: 0.78 }, { y: -0.3, ry: 0.62 }] : [{ y: 1.45, ry: 0.5 }];
      var spTop = kind === 'sun' ? -1.0 : 0.85;
      rows.forEach(function (rw) {
        for (var px = X0 + 0.38; px < X1; px += 0.74) for (var pz = Z0 + 0.4; pz < Z1; pz += 0.84) {
          var cx = px + (rnd() - 0.5) * 0.12, cz = pz + (rnd() - 0.5) * 0.12, rx = kind === 'sun' ? 0.31 : 0.33;
          pal.push({ p: [cx, rw.y, cz], s: [rx, rw.ry, 0.33], col: 0x86c45a });
          for (var k = 0; k < 11; k++) { var a = rnd() * 6.283, yy = rw.y + (rnd() - 0.5) * rw.ry * 1.5; chl.push([cx + Math.cos(a) * rx * 0.92, yy, cz + Math.sin(a) * 0.3]); }
        }
      });
      /* polish 14 Oct (Q-visual, Q-science 8): spongy cells are small lobed cores with two or three arms that touch their
         neighbours, so wide air spaces open between them; scattering happens at those air and cell surfaces */
      for (var sx = X0 + 0.55; sx < X1; sx += 1.3) for (var sz = Z0 + 0.5; sz < Z1; sz += 1.35) {
        var layers = kind === 'sun' ? [-1.7] : [-1.7, -0.55, 0.4];
        layers.forEach(function (ly, li) {
          if (ly > spTop) return;
          var c0 = [sx + (li % 2) * 0.55 + (rnd() - 0.5) * 0.3, ly + (rnd() - 0.5) * 0.25, sz + (rnd() - 0.5) * 0.3];
          spg.push({ p: c0, s: [0.3, 0.27, 0.29], col: 0xa4d070 });
          var arms = [[0.42, 0, 0, [0.3, 0.1, 0.11]], [-0.42, 0, 0, [0.3, 0.1, 0.11]], [0, 0, 0.4, [0.11, 0.1, 0.29]], [0, 0, -0.4, [0.11, 0.1, 0.29]], [0, -0.36, 0, [0.1, 0.24, 0.1]]];
          var na = 2 + ((rnd() * 2) | 0);
          for (var ai = 0; ai < na; ai++) { var am = arms[(rnd() * arms.length) | 0]; spg.push({ p: [c0[0] + am[0], c0[1] + am[1] + (rnd() - 0.5) * 0.1, c0[2] + am[2]], s: am[3], col: 0xa4d070 }); }
          for (var k2 = 0; k2 < 5; k2++) { var a2 = rnd() * 6.283; chl.push([c0[0] + Math.cos(a2) * 0.27, c0[1] + (rnd() - 0.5) * 0.3, c0[2] + Math.sin(a2) * 0.26]); }
        });
      }
      G.add(cells(pal, 0x86c45a, { opacity: 0.42 }));
      G.add(cells(spg, 0xa4d070, { opacity: 0.4 }));
      G.add(MM.balls(T, chl, 0x2f8a2a, 0.34));
      return { g: G, rows: rows, spTop: spTop };
    }
    S.types = { sun: leafType('sun'), shade: leafType('shade') };
    root.add(S.types.sun.g); root.add(S.types.shade.g);
    // light shafts above the leaf (collimated sun); faded under diffuse sky
    S.shaftMat = new T.MeshBasicMaterial({ color: 0xfff1c8, transparent: true, opacity: 0.2, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide });
    S.shafts = [];
    [-4.2, -1.6, 0.9, 3.6].forEach(function (sx2, i) { var sh = new T.Mesh(new T.CylinderGeometry(0.45, 0.6, 5.5, 16, 1, true), S.shaftMat); sh.position.set(sx2, 5.4, (i % 2 ? -0.6 : 0.5)); root.add(sh); S.shafts.push(sh); });
    // where each shaft lands on the cuticle: a warm pool of light (direct sun only)
    S.sunPool = MM.halos(T, 4, 0xfff0b8, 2.4); [-4.2, -1.6, 0.9, 3.6].forEach(function (sx2, i) { S.sunPool.set(i, sx2, 2.72, (i % 2 ? -0.6 : 0.5)); }); S.sunPool.commit(); root.add(S.sunPool.obj);
    // far layer: the next leaf and a vein out of focus
    var fl = new T.Mesh(se(9, 0.5, 4, 0.5, 20, 8), MM.glass(T, 0x5f9a3c, { opacity: 0.6 })); fl.position.set(-3, -5.2, -10); fl.rotation.z = 0.2; far.add(fl);
    var vein = new T.Mesh(new T.CylinderGeometry(0.7, 0.7, 20, 12), MM.glass(T, 0xd8e6b0, { opacity: 0.5 })); vein.position.set(4, 4, -12); vein.rotation.z = 1.2; far.add(vein);
    // photons
    var N = 64, pg = new T.BufferGeometry(); S.pP = new Float32Array(N * 3); S.pC = new Float32Array(N * 3);
    for (var q = 0; q < N; q++) S.pP[q * 3 + 1] = 1e4;
    pg.setAttribute('position', new T.BufferAttribute(S.pP, 3)); pg.setAttribute('color', new T.BufferAttribute(S.pC, 3));
    S.pts = new T.Points(pg, new T.PointsMaterial({ size: 1.3, map: MM.glowTexture(T), vertexColors: true, transparent: true, depthWrite: false, depthTest: false, blending: T.AdditiveBlending }));
    S.pts.frustumCulled = false; S.pts.renderOrder = 12; root.add(S.pts);
    S.core = new T.Points(pg, new T.PointsMaterial({ size: 0.36, map: MM.glowTexture(T), vertexColors: true, transparent: true, depthWrite: false, depthTest: false }));
    S.core.frustumCulled = false; S.core.renderOrder = 13; root.add(S.core);
    /* polish 14 Oct (Q-visual): photons are streaks with fading trails, so the light path reads at a glance; one trail
       of TR points per photon, drawn as additive line segments plus a softer trail of glow dots */
    S.TR = 7; var trN = N * (S.TR - 1) * 2;
    S.tP = new Float32Array(trN * 3); S.tC = new Float32Array(trN * 3);
    var tg = new T.BufferGeometry(); tg.setAttribute('position', new T.BufferAttribute(S.tP, 3)); tg.setAttribute('color', new T.BufferAttribute(S.tC, 3));
    S.trail = new T.LineSegments(tg, new T.LineBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, depthTest: false, blending: T.AdditiveBlending }));
    S.trail.frustumCulled = false; S.trail.renderOrder = 12; root.add(S.trail);
    S.dP = new Float32Array(N * 3 * 3); S.dC = new Float32Array(N * 3 * 3);
    var dg = new T.BufferGeometry(); dg.setAttribute('position', new T.BufferAttribute(S.dP, 3)); dg.setAttribute('color', new T.BufferAttribute(S.dC, 3));
    S.dots = new T.Points(dg, new T.PointsMaterial({ size: 0.7, map: MM.glowTexture(T), vertexColors: true, transparent: true, depthWrite: false, depthTest: false, blending: T.AdditiveBlending }));
    S.dots.frustumCulled = false; S.dots.renderOrder = 12; root.add(S.dots);
    S.fl = MM.halos(T, 16, 0xd8ff9a, 1.1); S.fl.mat.depthTest = false; S.fl.obj.renderOrder = 11; root.add(S.fl.obj);
    S.ph = []; S.flashes = []; S.acc = 0; S.tally = { a: 0, t: 0, r: 0 };
    S.hn = LP.heroNames(ctx);
    var V = function (x2, y2, z2) { return new T.Vector3(x2, y2, z2); };
    ctx.setLabels([
      { id: 'pal', text: 'palisade: light guides', pos: V(-5.3, 1.9, 1.1), tier: 1 },
      { id: 'spg', text: 'spongy cells and air: scattering', pos: V(4.6, -1.5, 1.1), tier: 1 },
      { id: 'epi', text: 'epidermis: lenses', pos: V(4.95, 2.75, 1.0), tier: 1 },
      { id: 'sun', text: 'sunlight', pos: V(-4.2, 6.6, 0.5), narrow: false },
      { id: 'sto', text: 'stoma', pos: V(2.2, -2.5, 0.66), side: 'right', narrow: false }
    ]);
    for (var pw = 0; pw < 80; pw++) h2Frame(ctx, pw * 0.05, 0.05);
    h2Live();
  }
  function h2Kind() { var st = LP.state || {}; return OP.kind === 'shade' || (OP.kind !== 'sun' && st.leaf === 'shade') ? 'shade' : 'sun'; }
  function h2Frame(ctx, t, dt) {
    var S = H2, T = S.T, r = S.rnd, st = LP.state || {}, sp = st.spectrum || {}, kind = h2Kind(), L = S.types[kind], diff = OP.light === 'diff';
    if (!T) return;
    S.types.sun.g.visible = kind === 'sun'; S.types.shade.g.visible = kind === 'shade';
    S.shaftMat.opacity = diff ? 0.025 : (ctx.dark ? 0.16 : 0.24) * Math.min(1, (+st.ppfd || 0) / 800);
    if (S.sunPool) S.sunPool.mat.opacity = diff ? 0.05 : 0.7 * Math.min(1, (+st.ppfd || 0) / 800);
    if (dt > 0) {
      S.acc += Math.min(20, (+st.ppfd || 0) * 0.01) * dt;
      while (S.acc >= 1) {
        S.acc--; if (S.ph.length >= 64) continue;
        var tot = (sp.blue || 0) + (sp.green || 0) + (sp.red || 0) + (sp.farred || 0) || 1, pk = r() * tot, c, col;
        if ((pk -= sp.blue || 0) < 0) { c = 'blue'; col = [0.35, 0.6, 1]; } else if ((pk -= sp.green || 0) < 0) { c = 'green'; col = [0.4, 1, 0.4]; } else if ((pk -= sp.red || 0) < 0) { c = 'red'; col = [1, 0.3, 0.22]; } else { c = 'farred'; col = [0.8, 0.12, 0.25]; }
        var x0 = -5.6 + r() * 11.2, z0 = -1.2 + r() * 2.4, dx = 0, dz = 0;
        if (diff) { var an = r() * 6.283, tilt = 0.25 + r() * 0.75; dx = Math.cos(an) * tilt; dz = Math.sin(an) * tilt * 0.5; }
        var nrm = Math.hypot(dx, 1, dz);
        S.ph.push({ x: x0 - dx * 4, y: 6.8, z: z0 - dz * 4, dx: dx / nrm, dy: -1 / nrm, dz: dz / nrm, c: c, col: col, L: -Math.log(1 - r() * 0.999) * H2PATH[c], s: 0, seg: 0, a: 1 });
      }
      var v = 2.6;
      for (var i = S.ph.length - 1; i >= 0; i--) {
        var p = S.ph[i];
        if (p.dead) { p.a -= dt * 2; if (p.a <= 0) S.ph.splice(i, 1); continue; }
        var stp = v * dt;
        p.x += p.dx * stp; p.y += p.dy * stp; p.z += p.dz * stp;
        p.tr = p.tr || []; p.tk = (p.tk || 0) + dt; if (p.tk > 0.035 || !p.tr.length) { p.tk = 0; p.tr.unshift([p.x, p.y, p.z]); if (p.tr.length > S.TR) p.tr.length = S.TR; }
        var inLeaf = p.y < 2.6 && p.y > -2.75;
        if (p.y < 2.6 && p.y > 2.05 && p.dy < 0 && !diff) { var cxp = Math.round((p.x + 5.45) / 1.1) * 1.1 - 5.45; p.x += (cxp - p.x) * dt * 1.5; }
        if (inLeaf) {
          p.s += stp; p.seg += stp;
          if (p.y < L.spTop && p.seg > 0.4) {
            p.seg = 0; var u = r() * 2 - 1, ph = r() * 6.283, q2 = Math.sqrt(1 - u * u);
            p.dx = q2 * Math.cos(ph); p.dy = u; p.dz = q2 * Math.sin(ph) * 0.6;
          } else if (p.y >= L.spTop && p.y < 2.05 && Math.abs(p.dx) > 0.2 && p.seg > 0.5) {
            p.seg = 0; p.dx *= 0.5; p.dz *= 0.5; var n2 = Math.hypot(p.dx, p.dy, p.dz); p.dx /= n2; p.dy /= n2; p.dz /= n2; if (p.dy > -0.3) p.dy = -0.5;
          }
          if (p.s >= p.L && p.y < 2.1) { p.dead = true; p.a = 0.5; S.tally.a++; if (S.flashes.length < 16) S.flashes.push({ x: p.x, y: p.y, z: p.z, u: 0 }); }
        }
        if (Math.abs(p.z) > 1.45 && inLeaf) p.dz = -p.dz;
        if (p.y <= -2.75 || p.y > 7 || Math.abs(p.x) > 7) { if (p.y <= -2.75) S.tally.t++; else if (p.y > 2.6) S.tally.r++; p.dead = true; p.a = 0.6; }
      }
      for (i = S.flashes.length - 1; i >= 0; i--) { S.flashes[i].u += dt * 2.5; if (S.flashes[i].u >= 1) S.flashes.splice(i, 1); }
    }
    for (var j = 0; j < 64; j++) {
      var q = S.ph[j];
      if (q) { S.pP[j * 3] = q.x; S.pP[j * 3 + 1] = q.y; S.pP[j * 3 + 2] = q.z; S.pC[j * 3] = q.col[0] * q.a; S.pC[j * 3 + 1] = q.col[1] * q.a; S.pC[j * 3 + 2] = q.col[2] * q.a; }
      else S.pP[j * 3 + 1] = 1e4;
    }
    S.pts.geometry.attributes.position.needsUpdate = true; S.pts.geometry.attributes.color.needsUpdate = true;
    if (S.trail) {
      var TR = S.TR, si = 0, di = 0;
      for (j = 0; j < 64; j++) {
        var qq = S.ph[j], tr = qq && qq.tr;
        for (var k = 0; k < TR - 1; k++) {
          var o = (si++) * 6;
          if (tr && tr.length > k + 1) {
            var a0 = tr[k], a1 = tr[k + 1], f0 = qq.a * (1 - k / (TR - 1)), f1 = qq.a * (1 - (k + 1) / (TR - 1));
            if (k === 0) a0 = [qq.x, qq.y, qq.z];
            S.tP[o] = a0[0]; S.tP[o + 1] = a0[1]; S.tP[o + 2] = a0[2]; S.tP[o + 3] = a1[0]; S.tP[o + 4] = a1[1]; S.tP[o + 5] = a1[2];
            S.tC[o] = qq.col[0] * f0; S.tC[o + 1] = qq.col[1] * f0; S.tC[o + 2] = qq.col[2] * f0; S.tC[o + 3] = qq.col[0] * f1; S.tC[o + 4] = qq.col[1] * f1; S.tC[o + 5] = qq.col[2] * f1;
          } else { S.tP[o + 1] = S.tP[o + 4] = 1e4; S.tC[o] = S.tC[o + 1] = S.tC[o + 2] = S.tC[o + 3] = S.tC[o + 4] = S.tC[o + 5] = 0; }
        }
        for (var d2 = 1; d2 <= 3; d2++) {
          var od = (di++) * 3, pt = tr && tr[d2 * 2 - 1];
          if (pt) { var fd = qq.a * (0.75 - d2 * 0.2); S.dP[od] = pt[0]; S.dP[od + 1] = pt[1]; S.dP[od + 2] = pt[2]; S.dC[od] = qq.col[0] * fd; S.dC[od + 1] = qq.col[1] * fd; S.dC[od + 2] = qq.col[2] * fd; }
          else S.dP[od + 1] = 1e4;
        }
      }
      S.trail.geometry.attributes.position.needsUpdate = true; S.trail.geometry.attributes.color.needsUpdate = true;
      S.dots.geometry.attributes.position.needsUpdate = true; S.dots.geometry.attributes.color.needsUpdate = true;
    }
    for (j = 0; j < 16; j++) { var f = S.flashes[j]; if (f) S.fl.set(j, f.x, f.y, f.z); else S.fl.hide(j); }
    S.fl.mat.opacity = 0.8; S.fl.commit();
    S.shafts.forEach(function (sh, k) { sh.scale.x = sh.scale.z = 1 + 0.06 * Math.sin(t * 0.7 + k); });
    /* slow and named: at most one photon of each colour carries its name (blue, red, far red; green none), picked
       while it is still above the leaf and kept until it is absorbed or leaves */
    if (S.hn) {
      S.hn.begin();
      for (j = S.ph.length - 1; j >= 0; j--) {
        var pn = S.ph[j], nmT = pn.c === 'blue' ? 'blue photon' : pn.c === 'red' ? 'red photon' : pn.c === 'farred' ? 'far red photon' : '';
        if (!nmT || pn.dead || pn.y < -2.7 || pn.y > 6.5) continue;
        S.hn.add(nmT, pn, nmT, pn.x, pn.y, pn.z, 0.22, { q: 1, keepOnly: pn.y < 3.2 });
      }
      S.hn.end();
    }
    if (dt > 0 && ((t * 2) | 0) !== S.lastLive) { S.lastLive = (t * 2) | 0; h2Live(); }
  }
  function h2Camera(ctx, t) {
    var cam = ctx.camera, asp = ctx.w / ctx.h, tv = Math.tan(cam.fov * Math.PI / 360);
    /* polish 14 Oct: the block sits in the upper two thirds, above the hook caption (lower left) */
    var halfW = ctx.narrow ? 4.0 : 6.6, halfH = ctx.narrow ? 5.9 : 5.3;
    var D = (Math.max(halfW / (tv * asp), halfH / tv) + 2) * (1 - 0.035 * Math.sin(t * 0.08));
    var yaw = 0.3 + 0.2 * Math.sin(t * 0.06), pitch = 0.1 + 0.04 * Math.sin(t * 0.05 + 2);
    var tx = ctx.narrow ? 2.0 * Math.sin(t * 0.05) : 0.4, ty = ctx.narrow ? -0.6 : -0.55;
    cam.position.set(tx + Math.sin(yaw) * Math.cos(pitch) * D, ty + Math.sin(pitch) * D, Math.cos(yaw) * Math.cos(pitch) * D);
    cam.lookAt(tx, ty, 0);
    ctx.scene.fog.near = D - 2; ctx.scene.fog.far = D + 16; ctx.farScene.fog.near = D; ctx.farScene.fog.far = D + 20;
  }
  function h2Live() {
    if (!H2.ctx || !H2.ctx.setLive) return;
    var st = LP.state || {}, r = LP.result || {};
    var s = num(+st.ppfd || 0, 0) + ' in, ' + num(+r.absorbed || 0, 0) + ' absorbed µmol m⁻² s⁻¹ · ' + h2Kind() + ' leaf' + (OP.light === 'diff' ? ', diffuse sky' : '');
    if (!(+st.ppfd > 0)) s = 'Dark: no photons are arriving';
    H2.ctx.setLive(s);
  }
  function h2Init(host) {
    if (!host || H2.ctx || !LP.macro) return;
    H2.ctx = LP.macro.hero(host, {
      id: 'lo-hero', seed: 17, fov: 30, exposure: 1.0, capAlign: 'left',
      palette: { light: { top: '#3a5226', mid: '#6a8a40', bot: '#a9c06a', bokeh: ['#fff6d0', '#d8ec9c', '#f6e7b0', '#ffffff'], fog: 0x6a8a40, fg: 'rgba(230,240,180,.5)' },
        dark: { top: '#06090a', mid: '#0f1d14', bot: '#17291b', bokeh: ['#4f7a33', '#2f5b2c', '#8a7a3c', '#3c7a4a'], fog: 0x0f1d14, fg: 'rgba(90,140,80,.45)' } },
      label: 'Three dimensional block of a leaf cut open: a glossy cuticle on top, a row of rounded glassy epidermis cells, tall column shaped palisade cells lined with green chloroplasts, rounded spongy cells with air spaces between them, and a lower epidermis with one stoma. Coloured photons fall from above; blue and red ones are taken by chloroplasts near the top, green ones travel deeper and bounce around among the spongy cells, far red ones often pass right through.',
      question: 'Where does the light go inside a leaf?',
      answer: 'Direct sun arrives as nearly parallel rays. The rounded epidermis cells focus it, and the column shaped palisade cells pass much of it straight down, like light guides, so chloroplasts deep in the leaf still get some. In the spongy mesophyll the many air and water surfaces scatter it in all directions, which lengthens its path and raises the chance a chloroplast takes it. <b>Blue and red are absorbed near the top; green travels deeper; far red often passes through.</b> Switch the sky, the leaf type or the colour in 2.1 below; the path lengths in this scene are illustrative.',
      credit: { text: 'Brodersen et al. · Plant, Cell & Environment 2008', doi: '10.1111/j.1365-3040.2007.01751.x' },
      height: function (w) { return w < 600 ? 530 : Math.round(Math.min(680, Math.max(460, w * 0.66))); },
      fallbackNote: 'This 3D leaf needs WebGL, which this browser does not offer. The drawing in 2.1 below follows the same photons.',
      build: h2Build, frame: h2Frame, camera: h2Camera,
      /* LOOK CLOSER (controls engineer, 14 Oct 2026): palisade columns upper left, spongy cells lower right, the stoma at (2.2, −2.55, 0)
         seen from below so the pore between the two guard cells shows. FIX ROUND 1: the stoma chip now looks up at the
         lower epidermis from close under it (phi 2.3, 3 units, facing the pair), so the guard cells and the pore fill the frame */
      focus: [
        { id: 'pal', label: 'Palisade', target: [-3.2, 1.4, 0.4], dist: 8, theta: 0.25, phi: 1.35 },
        { id: 'spg', label: 'Spongy cells', target: [3.4, -1.1, 0.3], dist: 8, theta: 0.35, phi: 1.4 },
        { id: 'sto', label: 'Stoma', tag: 'stoma: guard cells and pore', target: [2.2, -2.6, 0], dist: 3, theta: 0, phi: 2.3 }
      ]
    });
    h2Live();
    ui.onPrefs(function () { if (H2.ctx && H2.ctx.retheme) H2.ctx.retheme(); });
  }

  LP.panels.push({ id: 'leaf', mount: mount, update: update, show: function () { if (TH.anim) TH.anim.kick(); if (GX.anim) GX.anim.kick(); if (H2.ctx) { h2Live(); H2.ctx.invalidate(); } }, hide: function () {} });
})();

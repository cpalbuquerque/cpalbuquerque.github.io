/* Light to Sugar, Plate I: The Sun (L1 owner).
   1. Eight minutes from the Sun: canvas theatre, photons as wave packets or particles travelling to a leaf, with a clock.
   2. Pick a photon: wavelength, frequency, energy per photon and per mole, photons per joule (all DERIVED from CODATA constants).
   3. Your light recipe: Sun, white, blue, green, red and far red channels; spectrum, PPFD, ePAR, far red share, phytochrome
      PSS, electricity for LED packages, illuminance and the colour a person sees; a night greenhouse that glows that colour.
   Pushes LP.set({ppfd, spectrum:{blue, green, red, farred}}) where spectrum = photon fractions of 400 to 750 nm in the bands
   400 to 500, 500 to 600, 600 to 700 and 700 to 750 nm, and ppfd = photons 400 to 700 nm. Exposes LP.optics for other plates. */
(function () {
  'use strict';
  var LP = window.LP = window.LP || {};
  var ui = LP.ui;
  if (!ui) { console.error('l_sun.js: shell.js must load first'); return; }
  var esc = ui.esc, num = ui.num, MINUS = '−';

  /* ------------------------------------------------------------ physics (DERIVED from exact SI constants) */
  var H = 6.62607015e-34, C = 299792458, NA = 6.02214076e23, QE = 1.602176634e-19, KB = 1.380649e-23, AU = 149597870700;
  var TRIP = AU / C; /* 499.0 s */
  function ePhotonJ(nm) { return H * C / (nm * 1e-9); }
  function kJmol(nm) { return ePhotonJ(nm) * NA / 1000; }
  function eV(nm) { return ePhotonJ(nm) / QE; }
  function umolPerJ(nm) { return 1e6 / (ePhotonJ(nm) * NA); }
  function THz(nm) { return C / (nm * 1e-9) / 1e12; }

  /* wavelength grid 380 to 780 nm, 1 nm */
  var L0 = 380, L1 = 780, NL = L1 - L0 + 1, LAM = [];
  for (var i = 0; i < NL; i++) LAM.push(L0 + i);
  function gauss(mu, fwhm) { var s = fwhm / 2.3548, a = []; for (var i = 0; i < NL; i++) a.push(Math.exp(-0.5 * Math.pow((LAM[i] - mu) / s, 2))); return a; }
  function norm(a, lo, hi) { var t = 0; for (var i = 0; i < NL; i++) if (LAM[i] >= lo && LAM[i] <= hi) t += a[i]; return a.map(function (x) { return x / t; }); }
  function addA(a, b, k) { return a.map(function (x, i) { return x + k * b[i]; }); }
  /* sunlike photon spectrum: 5772 K blackbody, photon units, normalised so photons 400 to 700 nm sum to 1 (top of atmosphere shape) */
  var SUN = (function () { var a = []; for (var i = 0; i < NL; i++) { var l = LAM[i] * 1e-9; a.push(1 / Math.pow(l, 4) / (Math.exp(H * C / (l * KB * 5772)) - 1)); } return norm(a, 400, 700); })();
  /* LED shapes: ILLUSTRATIVE peaks and widths; each normalised so the whole channel sums to 1 photon unit */
  function full(a) { return norm(a, L0, L1); }
  var SHAPE = {
    sun: SUN,
    white: full(addA(addA(gauss(450, 20).map(function (x) { return 1.3 * x; }), gauss(545, 90), 0.7), gauss(625, 80), 0.5)),
    blue: full(gauss(450, 20)),
    green: full(gauss(525, 35)),
    red: full(gauss(660, 20)),
    farred: full(gauss(730, 25))
  };
  /* the sun channel is set as PPFD (400 to 700 nm); LED channels are set as their total photon output */
  var CH = [
    { k: 'sun', name: 'Sunlight', sub: 'clear sky shape', max: 2200, step: 10, eff: null, col: '#d9a521' },
    { k: 'white', name: 'White LED', sub: 'blue chip + phosphor', max: 2000, step: 5, eff: 2.9, col: '#e8e2d0' },
    { k: 'blue', name: 'Blue LED', sub: '450 nm', max: 2000, step: 5, eff: 3.5, col: '#3a5bd9' },
    { k: 'green', name: 'Green LED', sub: '525 nm', max: 2000, step: 5, eff: 1.9, col: '#2f9e44' },
    { k: 'red', name: 'Red LED', sub: '660 nm', max: 2000, step: 5, eff: 4.5, col: '#d8312a' },
    { k: 'farred', name: 'Far red LED', sub: '730 nm', max: 600, step: 2, eff: +(0.77 * 730 / 119.627).toFixed(2), col: '#7a1020' }
  ];
  /* phytochrome: two pigment model. Pr and Pfr absorption shapes chosen so that PSS = 0.89 under 660 nm red, 0.51 under
     450 nm blue and 0.87 under a 50:50 blue:red mix (Hogewoning et al. 2010, Table 1), and about 0.7 for a sunlike
     spectrum (a commonly quoted value, not checked). Shapes ILLUSTRATIVE; not the Sager et al. 1988 spectra. */
  var EPS_R = addA(gauss(666, 50), gauss(400, 90), 0.0661);
  var EPS_FR = addA(addA(gauss(728, 55).map(function (x) { return 0.2659 * x; }), gauss(666, 50), 0.117), gauss(400, 90), 0.0635);
  /* CIE 1931 2 degree observer: multi lobe analytic fit (Wyman, Sloan and Shirley 2013) used only to render colour and lux */
  function g2(l, mu, s1, s2) { var t = (l - mu) / (l < mu ? s1 : s2); return Math.exp(-0.5 * t * t); }
  var XB = [], YB = [], ZB = [];
  LAM.forEach(function (l) {
    XB.push(1.056 * g2(l, 599.8, 37.9, 31.0) + 0.362 * g2(l, 442.0, 16.0, 26.7) - 0.065 * g2(l, 501.1, 20.4, 26.2));
    YB.push(0.821 * g2(l, 568.8, 46.9, 40.5) + 0.286 * g2(l, 530.9, 16.3, 31.1));
    ZB.push(1.217 * g2(l, 437.0, 11.8, 36.0) + 0.681 * g2(l, 459.0, 26.0, 13.8));
  });

  var WHITE = null;
  function mixSpectrum(m) {
    var phi = new Array(NL).fill(0);
    CH.forEach(function (c) { var v = +m[c.k] || 0; if (!v) return; var s = SHAPE[c.k]; for (var i = 0; i < NL; i++) phi[i] += v * s[i]; });
    return phi;
  }
  function band(phi, lo, hi) { var t = 0; for (var i = 0; i < NL; i++) if (LAM[i] >= lo && LAM[i] < hi) t += phi[i]; return t; }
  function srgb(u) { u = Math.max(0, Math.min(1, u)); return Math.round(255 * (u <= 0.0031308 ? 12.92 * u : 1.055 * Math.pow(u, 1 / 2.4) - 0.055)); }
  function analyse(m) {
    var phi = mixSpectrum(m);
    var ppfd = band(phi, 400, 700.5), epar = band(phi, 400, 750.5), fr = band(phi, 700.5, 750.5), blue = band(phi, 400, 500), green = band(phi, 500, 600), red = band(phi, 600, 700.5);
    var nr = 0, nf = 0, X = 0, Y = 0, Z = 0, W = 0, Wpar = 0;
    for (var i = 0; i < NL; i++) {
      nr += phi[i] * EPS_R[i]; nf += phi[i] * EPS_FR[i];
      var w = phi[i] * 1e-6 * NA * ePhotonJ(LAM[i]); /* W m-2 per nm */
      W += w; if (LAM[i] >= 400 && LAM[i] <= 700) Wpar += w;
      X += w * XB[i]; Y += w * YB[i]; Z += w * ZB[i];
    }
    var pss = (nr + nf) > 0 ? nr / (nr + nf) : null;
    var lux = 683 * Y;
    var elec = 0, ledPh = 0;
    CH.forEach(function (c) { if (c.eff && m[c.k]) { elec += m[c.k] / c.eff; ledPh += +m[c.k]; } });
    /* colour: linear sRGB from XYZ, hue kept, brightness normalised */
    var r = 3.2406 * X - 1.5372 * Y - 0.4986 * Z, g = -0.9689 * X + 1.8758 * Y + 0.0415 * Z, b = 0.0557 * X - 0.2040 * Y + 1.0570 * Z;
    /* von Kries style scaling so that sunlight renders white (an eye adapted to daylight) */
    if (WHITE) { r /= WHITE[0]; g /= WHITE[1]; b /= WHITE[2]; }
    var mn = Math.min(r, g, b); if (mn < 0) { r -= mn; g -= mn; b -= mn; }
    var mx = Math.max(r, g, b) || 1; r /= mx; g /= mx; b /= mx;
    var col = Y > 0 ? 'rgb(' + srgb(r) + ',' + srgb(g) + ',' + srgb(b) + ')' : 'rgb(0,0,0)';
    return {
      phi: phi, ppfd: ppfd, epar: epar, fr: fr, frShare: epar > 0 ? fr / epar : 0, blueShare: ppfd > 0 ? blue / ppfd : 0,
      bands: { blue: blue, green: green, red: red, farred: fr }, pss: pss, W: W, Wpar: Wpar, lux: lux, luxPerUmol: ppfd > 0 ? lux / ppfd : null,
      elec: elec, ledPh: ledPh, col: col, rgb: [r, g, b], lin: [r, g, b], name: Y > 0 ? colourName(r, g, b) : 'dark',
      engine: epar > 0 ? { blue: blue / epar, green: green / epar, red: red / epar, farred: fr / epar } : { blue: 0, green: 0, red: 0, farred: 0 }
    };
  }
  function colourName(r, g, b) {
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, s = mx ? d / mx : 0;
    if (s < 0.14) return 'white';
    var h;
    if (mx === r) h = 60 * (((g - b) / d) % 6); else if (mx === g) h = 60 * ((b - r) / d + 2); else h = 60 * ((r - g) / d + 4);
    if (h < 0) h += 360;
    if (s < 0.32) return h < 70 ? 'warm white' : (h < 200 ? 'greenish white' : (h < 290 ? 'cool white' : 'pinkish white'));
    var names = [[12, 'red'], [35, 'orange'], [50, 'amber'], [66, 'yellow'], [95, 'yellow green'], [150, 'green'], [175, 'teal'], [200, 'cyan'], [225, 'sky blue'], [255, 'blue'], [275, 'violet'], [300, 'purple'], [335, 'magenta'], [350, 'pink'], [361, 'red']];
    for (var i = 0; i < names.length; i++) if (h < names[i][0]) return names[i][1];
    return 'red';
  }
  /* wavelength to a display colour (classic piecewise approximation; display only). Far red kept visible. */
  function wlRGB(l, dark) {
    var r = 0, g = 0, b = 0;
    if (l < 440) { r = -(l - 440) / 60; b = 1; } else if (l < 490) { g = (l - 440) / 50; b = 1; } else if (l < 510) { g = 1; b = -(l - 510) / 20; }
    else if (l < 580) { r = (l - 510) / 70; g = 1; } else if (l < 645) { r = 1; g = -(l - 645) / 65; } else r = 1;
    if (l > 700) { var k = Math.min(1, (l - 700) / 60); return dark ? 'rgb(' + Math.round(225 - 40 * k) + ',' + Math.round(60 - 20 * k) + ',' + Math.round(120 + 10 * k) + ')' : 'rgb(' + Math.round(150 - 40 * k) + ',' + Math.round(20) + ',' + Math.round(70 + 10 * k) + ')'; }
    var f = l < 420 ? 0.35 + 0.65 * (l - 380) / 40 : (l > 700 ? Math.max(dark ? 0.62 : 0.45, 1 - 0.7 * (l - 700) / 80) : 1);
    function c(x) { return Math.round(255 * Math.pow(Math.max(0, x * f), 0.8)); }
    return 'rgb(' + c(r) + ',' + c(g) + ',' + c(b) + ')';
  }
  function colourWord(l) { return l < 450 ? 'violet' : l < 495 ? 'blue' : l < 520 ? 'cyan' : l < 565 ? 'green' : l < 590 ? 'yellow' : l < 625 ? 'orange' : l < 700 ? 'red' : 'far red'; }

  WHITE = (function () { var w = analyse({ sun: 1000 }).lin; return w; })();
  LP.optics = { LAM: LAM, SHAPE: SHAPE, CH: CH, analyse: analyse, mixSpectrum: mixSpectrum, wlRGB: wlRGB, kJmol: kJmol, eV: eV, umolPerJ: umolPerJ, EPS_R: EPS_R, EPS_FR: EPS_FR };

  /* ------------------------------------------------------------ plate evidence (sheet keys come from evidence.js) */
  var EV = LP.evidence;
  EV['sun.bay'] = { claim: 'Inside one greenhouse bay at night, photons leave the LED bar in your recipe’s colour shares at a rate proportional to the LED photon flux; most land on the lettuce, a few leave straight up through the glass, and some are reflected by the leaves (by colour, with the same odds as the Sun scene).', cite: 'Teaching scene built for this site.', measured: 'none', value: 'drawing rate 0.08 photons s⁻¹ per µmol m⁻² s⁻¹ (capped at 40 s⁻¹); 1 in 10 photons drawn leaving upward', badge: 'ILLUSTRATIVE', note: 'Real light loss to the sky depends on fixture optics, screens and glass. Many growers close blackout screens at night partly to keep light in.' };
  EV['sun.leafFate'] = { claim: 'In the scene, a photon that reaches the leaf is absorbed, reflected or transmitted with fixed odds by colour: violet and blue about 95 % absorbed, green about 75 %, red about 90 %, far red about 12 %.', cite: 'Red and blue odds anchored to measured cucumber leaves (Hogewoning et al. 2010, Table 1: 90.0 % under 638 nm red, 95.4 % under 450 nm blue); green and far red odds are teaching constants chosen to match the familiar shape of a green leaf absorptance spectrum.', measured: 'none', value: '', badge: 'ILLUSTRATIVE', note: 'Real leaves differ with thickness, chlorophyll content, surface hairs and wax. The Leaf plate shows why.' };
  EV['sun.ledShapes'] = { claim: 'LED channel shapes: blue 450 nm, green 525 nm, red 660 nm and far red 730 nm peaks with 20 to 35 nm widths; white is a 450 nm blue chip under a broad phosphor.', cite: 'Teaching shapes typical of horticultural LED packages.', measured: 'none', value: '', badge: 'ILLUSTRATIVE', note: 'Use a spectroradiometer to get the real spectrum of a fixture.' };
  EV['sun.sunShape'] = { claim: 'Sunlight channel: the photon spectrum of a 5772 K blackbody, scaled so the slider sets PPFD (photons 400 to 700 nm).', cite: 'Planck law with CODATA 2018 exact constants.', measured: 'calculation', value: 'T = 5772 K', badge: 'DERIVED', note: 'This is the shape above the atmosphere. At the ground, water vapour, ozone and scattering reshape it, so real sunlight differs, mostly in the far red and infrared.' };
  EV['sun.pssModel'] = { claim: 'The phytochrome photostationary state (PSS = Pfr / total phytochrome) is computed from the spectrum with a two pigment model whose shapes were chosen to give PSS 0.89 under red, 0.51 under blue and 0.87 under a 50:50 blue and red mix.', cite: 'Anchors from Hogewoning et al. (2010) J Exp Bot 61:3107, Table 1; method after Sager et al. (1988).', doi: '10.1093/jxb/erq132', doi2: '10.13031/2013.30952', measured: 'calculated PSS for LED growth spectra (cucumber study)', value: 'red 0.89, 50 % blue 0.87, blue 0.51', badge: 'DERIVED', note: 'Pigment shapes are ILLUSTRATIVE. The model also gives about 0.7 for a sunlike spectrum, a commonly quoted value that is not checked here.' };
  EV['sun.eye'] = { claim: 'The colour you would see and the illuminance in lux are computed from the spectrum with an analytic fit to the CIE 1931 standard observer and 683 lm per watt at 555 nm. Colours are scaled so that sunlight looks white, as it does to an eye adapted to daylight.', cite: 'Wyman, Sloan and Shirley (2013) multi lobe fit to the CIE 1931 colour matching functions; 683 lm W⁻¹ from the SI definition of the candela.', measured: 'calculation', value: '', badge: 'ILLUSTRATIVE', note: 'Screen colour is approximate: real LED colours can lie outside what a screen can show, and your screen is not calibrated.' };
  EV['sun.frEff'] = { claim: 'A far red LED package at 730 nm gives about 4.7 photons per joule: 77 % of the electrical energy leaves as light, and each joule of 730 nm light holds 6.10 µmol of photons.', cite: 'Efficiency from Kusuma, Pattison and Bugbee (2020) Hortic Res 7:56; photons per joule from E = hc/λ.', doi: '10.1038/s41438-020-0283-7', measured: 'calculation from a reviewed package efficiency', value: '0.77 × 6.10 = 4.70 µmol J⁻¹', badge: 'DERIVED' };
  EV['sun.presetLevels'] = { claim: 'Preset light levels for midday sun (2000), a foggy Salinas morning (300), a clear noon in inland Southern California (2100) and the greenhouse fixtures (300 µmol m⁻² s⁻¹) are round teaching numbers, not station data.', cite: 'Teaching values.', measured: 'none', value: '', badge: 'ILLUSTRATIVE' };

  LP.howto['sun.quantum'] = {
    title: 'photon flux with a quantum sensor', what: 'PPFD in µmol m⁻² s⁻¹',
    steps: [
      'Level the sensor where the leaf is, facing the light the leaf faces. The sensor is cosine corrected, so light from a low angle counts less, as it does for a flat leaf.',
      'Read the photon flux from 400 to 700 nm. A quantum sensor counts photons, not energy, which is what photosynthesis cares about.',
      'Under LEDs, check the sensor’s spectral response. Many sensors under read deep red and blue, and almost none count far red: to measure ePAR (400 to 750 nm) you need an extended range sensor or a spectroradiometer.',
      'Never use a lux meter for plants. Lux weighs light by the human eye, which peaks in the green, so a magenta fixture reads low in lux and high in photons.'
    ],
    watch: 'Shade from your own body, dust on the diffuser, and a sensor tilted away from the leaf angle.',
    dois: ['10.3389/fpls.2021.693445']
  };
  LP.howto['sun.spectro'] = {
    title: 'the spectrum with a spectroradiometer', what: 'photons per nm, 380 to 780 nm',
    steps: [
      'Point the cosine corrected input at the light from the leaf’s position; take a dark reading first.',
      'Record the spectral photon flux, µmol m⁻² s⁻¹ nm⁻¹, at 1 nm steps.',
      'Integrate the bands you need: 400 to 700 nm for PPFD, 400 to 750 nm for ePAR, 700 to 750 nm for far red.',
      'Weight the spectrum by the absorption of Pr and Pfr to get the phytochrome photostationary state.'
    ],
    watch: 'Stray light, saturation of the detector under bright LEDs, and old calibration files.',
    dois: ['10.13031/2013.30952', '10.1093/jxb/erq132']
  };

  /* ------------------------------------------------------------ presets */
  var PRESETS = [
    { id: 'sun', label: 'Midday sun', m: { sun: 2000 }, ev: 'sun.presetLevels', t: 1 },
    { id: 'fog', label: 'Salinas fog morning', m: { sun: 300 }, ev: 'sun.presetLevels', t: 1 },
    { id: 'socal', label: 'Inland Southern California, clear noon', m: { sun: 2100 }, ev: 'sun.presetLevels', t: 2 },
    { id: 'magenta', label: 'Grower’s magenta, B10:R90', m: { blue: 30, red: 270 }, ev: 'why_purple', t: 1 },
    { id: 'jin', label: 'Vertical farm lettuce + far red', m: { blue: 24, red: 194, farred: 52 }, ev: 'farred_lettuce_vertical_farm', t: 1 },
    { id: 'white', label: 'All white', m: { white: 300 }, ev: 'fixture_efficacy', t: 2 },
    { id: 'levine', label: 'White + far red plant factory', m: { white: 300, farred: 100 }, ev: 'farred_lettuce_plant_factory', t: 2 },
    { id: 'red', label: 'Red only', m: { red: 300 }, ev: 'pss_red_blue_leds', t: 2 },
    { id: 'blue', label: 'Blue only', m: { blue: 300 }, ev: 'pss_red_blue_leds', t: 2 }
  ];
  var mix = { sun: 2000, white: 0, blue: 0, green: 0, red: 0, farred: 0 };
  var A = analyse(mix);
  var preset = 'sun';

  /* ------------------------------------------------------------ the theatre: eight minutes from the Sun */
  var TH = {
    mode: 'both', source: 'sun', speed: 'fast', photons: [], acc: 0, tracked: null, flashes: [], stars: [], gran: [],
    lam: 660, crossS: 6, w: 0, h: 0, lay: null, arrived: 0, launchedAt: null
  };
  function layout(w, h) {
    var sunR = h * 0.78, cx = -sunR * 0.56, cy = h * 0.5;
    var lw = Math.max(46, Math.min(90, w * 0.1));
    var leafX = w - lw - Math.max(20, w * 0.035);
    TH.lay = { sunR: sunR, cx: cx, cy: cy, edge: cx + sunR, leafX: leafX, lw: lw, top: h * 0.22, bot: h * 0.82, lampX: Math.max(26, w * 0.06) };
    TH.w = w; TH.h = h;
    TH.stars = []; for (var i = 0; i < 70; i++) TH.stars.push([Math.random() * w, Math.random() * h, Math.random() * 1.2 + 0.2, Math.random() * 6.28]);
    TH.gran = []; for (var j = 0; j < 40; j++) TH.gran.push([Math.random(), Math.random(), Math.random() * 6.28]);
  }
  function startX(y) {
    var Ly = TH.lay;
    if (TH.source === 'lamp') return Ly.lampX + 14;
    var dy = y - Ly.cy; return Ly.cx + Math.sqrt(Math.max(0, Ly.sunR * Ly.sunR - dy * dy));
  }
  function leafEdge(y) {
    var Ly = TH.lay, my = (Ly.top + Ly.bot) / 2, ry = (Ly.bot - Ly.top) / 2 + 6, t = (y - my) / ry;
    if (Math.abs(t) >= 1) return Infinity;
    return Ly.leafX + Ly.lw * 0.5 * (1 - Math.sqrt(1 - t * t)) + Ly.lw * 0.08 * t;
  }
  function sampleLam() {
    var phi;
    if (TH.source === 'sun') phi = SUN;
    else { var m2 = {}; CH.forEach(function (c) { if (c.k !== 'sun') m2[c.k] = mix[c.k]; }); phi = mixSpectrum(m2); }
    var tot = 0; for (var i = 0; i < NL; i++) tot += phi[i];
    if (!(tot > 0)) return null;
    var r = Math.random() * tot;
    for (var k = 0; k < NL; k++) { r -= phi[k]; if (r <= 0) return LAM[k]; }
    return 700;
  }
  function fate(l) {
    var p = l < 500 ? [0.95, 0.03] : l < 600 ? [0.75, 0.13] : l < 680 ? [0.9, 0.06] : l < 700 ? [0.75, 0.12] : [0.12, 0.45];
    var r = Math.random();
    return r < p[0] ? 'abs' : (r < p[0] + p[1] ? 'ref' : 'tra');
  }
  function speedPx() {
    var Ly = TH.lay, D = Ly.leafX - (TH.source === 'sun' ? Ly.edge : Ly.lampX);
    return D / TH.crossS;
  }
  function spawn(tracked) {
    var Ly = TH.lay;
    var l = tracked ? TH.lam : sampleLam(); if (l == null) return null;
    var y = tracked ? (Ly.top + Ly.bot) / 2 + (Ly.bot - Ly.top) * 0.08 : Ly.top + Math.random() * (Ly.bot - Ly.top);
    var p = { x: startX(y), y: y, l: l, vx: speedPx(), vy: 0, st: 'fly', f: tracked ? 'abs' : fate(l), a: 1, tr: !!tracked, ph: Math.random() * 6.28, d: 0, x0: 0 };
    p.x0 = p.x;
    if (tracked) { p.f = fate(l); TH.tracked = p; TH.launchedAt = Date.now(); }
    TH.photons.push(p);
    return p;
  }
  function step(dt) {
    var Ly = TH.lay; if (!Ly) return;
    var real = TH.speed === 'real' && TH.source === 'sun';
    if (!real) {
      var cap = TH.w < 500 ? 30 : 60;
      TH.acc += dt * cap / Math.max(1, TH.crossS || 4) * 0.92;
      var live = 0; for (var q = 0; q < TH.photons.length; q++) if (!TH.photons[q].tr) live++;
      while (TH.acc > 1) { TH.acc -= 1; if (live < cap) { spawn(false); live++; } }
    }
    if (!TH.tracked) spawn(true);
    var v = speedPx(), vReal = (Ly.leafX - Ly.edge) / TRIP;
    for (var i = TH.photons.length - 1; i >= 0; i--) {
      var p = TH.photons[i];
      var sp = (p.tr && real) ? vReal : v;
      if (real && !p.tr) { TH.photons.splice(i, 1); continue; }
      if (p.st === 'fly') {
        p.x += sp * dt;
        var e = leafEdge(p.y);
        if (p.x >= e) {
          if (p.f === 'abs') { p.st = 'gone'; TH.flashes.push({ x: e + 6 + Math.random() * Ly.lw * 0.35, y: p.y, l: p.l, t: 0 }); if (p.tr) { TH.arrived++; TH.lastFate = 'absorbed'; } }
          else if (p.f === 'ref') { p.st = 'ref'; var an = (Math.random() - 0.5) * 1.8; p.vx = -v * 0.8 * Math.cos(an); p.vy = v * 0.8 * Math.sin(an); if (p.tr) { TH.arrived++; TH.lastFate = 'reflected'; } }
          else { p.st = 'tra'; p.vy = (Math.random() - 0.5) * v * 0.3; if (p.tr) { TH.arrived++; TH.lastFate = 'transmitted'; } }
          if (p.tr) { TH.tracked = null; }
        }
      } else if (p.st === 'ref') { p.x += p.vx * dt; p.y += p.vy * dt; p.a -= dt * 0.9; }
      else if (p.st === 'tra') { p.x += v * 0.9 * dt; p.y += p.vy * dt; p.a = Math.min(p.a, 0.45) - dt * 0.4; }
      if (p.st === 'gone' || p.a <= 0 || p.x > TH.w + 40 || p.x < -40) TH.photons.splice(i, 1);
    }
    for (var j = TH.flashes.length - 1; j >= 0; j--) { TH.flashes[j].t += dt; if (TH.flashes[j].t > 0.7) TH.flashes.splice(j, 1); }
  }
  function settle() {
    /* still frame for reduce motion: an even stream and the tracked photon half way */
    TH.photons = []; TH.flashes = []; TH.tracked = null;
    var Ly = TH.lay; if (!Ly) return;
    for (var i = 0; i < 46; i++) {
      var l = TH.source === 'sun' ? 400 + (i * 37) % 340 : sampleLam(); if (l == null) break;
      var y = Ly.top + ((0.5 + i * 0.7548777) % 1) * (Ly.bot - Ly.top), x0 = startX(y), e = leafEdge(y);
      TH.photons.push({ x: x0 + ((0.5 + i * 0.5698403) % 1) * (Math.min(e, TH.w) - x0 - 6), y: y, l: l, vx: 0, vy: 0, st: 'fly', f: 'abs', a: 1, tr: false, ph: i, x0: x0 });
    }
    var p = spawn(true); if (p) { p.x = p.x0 + 0.5 * (Ly.leafX - p.x0); }
  }

  function drawScene(ctx, w, h, t, dt, info) {
    if (!TH.lay || TH.w !== w || TH.h !== h) layout(w, h);
    /* slow and named (13 Oct): "Real time" is a wall clock demonstration (8 min 19 s), so the display speed setting
       does not slow it; every other mode slows with the speed dock */
    if (dt > 0 && TH.speed === 'real' && TH.source === 'sun' && window.PlaySpeed) dt /= window.PlaySpeed.get();
    TAGR = [];
    if (dt > 0) step(dt);
    else if (!TH.photons.length) { if (info.reduce) settle(); else { for (var pw = 0; pw < 140; pw++) step(0.05); } }
    var Ly = TH.lay, dark = info.dark;
    /* backdrop */
    var bg = ctx.createLinearGradient(0, 0, 0, h);
    if (dark) { bg.addColorStop(0, '#05080d'); bg.addColorStop(1, '#0b1118'); } else { bg.addColorStop(0, '#f6f0e1'); bg.addColorStop(1, '#ece3cd'); }
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    if (dark) TH.stars.forEach(function (s) { ctx.globalAlpha = 0.35 + 0.35 * Math.sin(t * 1.3 + s[3]); ctx.fillStyle = '#cfd8e6'; ctx.fillRect(s[0], s[1], s[2], s[2]); });
    ctx.globalAlpha = 1;
    /* source */
    if (TH.source === 'sun') {
      var halo = ctx.createRadialGradient(Ly.cx, Ly.cy, Ly.sunR * 0.9, Ly.cx, Ly.cy, Ly.sunR * 1.45);
      halo.addColorStop(0, dark ? 'rgba(255,190,90,0.55)' : 'rgba(240,170,60,0.45)'); halo.addColorStop(1, 'rgba(255,190,90,0)');
      ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(Ly.cx, Ly.cy, Ly.sunR * 1.45, 0, 6.29); ctx.fill();
      var disc = ctx.createRadialGradient(Ly.cx + Ly.sunR * 0.2, Ly.cy, Ly.sunR * 0.1, Ly.cx, Ly.cy, Ly.sunR);
      disc.addColorStop(0, '#fff7d6'); disc.addColorStop(0.65, '#ffd36b'); disc.addColorStop(0.93, '#f29a2e'); disc.addColorStop(1, '#d9661c');
      ctx.fillStyle = disc; ctx.beginPath(); ctx.arc(Ly.cx, Ly.cy, Ly.sunR, 0, 6.29); ctx.fill();
      /* granulation shimmer */
      ctx.save(); ctx.beginPath(); ctx.arc(Ly.cx, Ly.cy, Ly.sunR, 0, 6.29); ctx.clip();
      TH.gran.forEach(function (g) {
        var a = g[0] * 6.28, rr = Math.sqrt(g[1]) * Ly.sunR, gx = Ly.cx + rr * Math.cos(a), gy = Ly.cy + rr * Math.sin(a);
        ctx.globalAlpha = 0.10 + 0.08 * Math.sin(t * 2 + g[2]); ctx.fillStyle = '#fff2c0';
        ctx.beginPath(); ctx.arc(gx, gy, Ly.sunR * 0.09, 0, 6.29); ctx.fill();
      });
      ctx.restore(); ctx.globalAlpha = 1;
      tag(ctx, 'The Sun (not to scale)', Math.max(8, Ly.edge - 150), h - 12, dark, 'left');
    } else {
      /* LED fixture bar, diodes coloured by channel */
      var x = Ly.lampX, y0 = Ly.top - 6, y1 = Ly.bot + 6;
      ctx.fillStyle = dark ? '#2b3138' : '#5b5348'; roundRect(ctx, x - 12, y0, 22, y1 - y0, 5); ctx.fill();
      var on = CH.filter(function (c) { return c.k !== 'sun' && mix[c.k] > 0; });
      var n = Math.max(6, Math.round((y1 - y0) / 16));
      for (var i = 0; i < n; i++) {
        var c = on.length ? on[i % on.length] : null, yy = y0 + 8 + i * (y1 - y0 - 16) / (n - 1);
        ctx.fillStyle = c ? (c.k === 'white' ? '#fffbe8' : c.k === 'farred' ? '#a3172b' : c.col) : '#666';
        ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = c ? 10 : 0;
        ctx.beginPath(); ctx.arc(x + 4, yy, 4, 0, 6.29); ctx.fill();
      }
      ctx.shadowBlur = 0;
      tag(ctx, on.length ? 'LED fixture: your recipe' : 'LED fixture: all channels off', x - 10, h - 12, dark, 'left');
    }
    /* distance marks */
    var mx = (Ly.edge + Ly.leafX) / 2; if (TH.source === 'lamp') mx = (Ly.lampX + Ly.leafX) / 2;
    ctx.strokeStyle = dark ? 'rgba(220,210,190,.55)' : 'rgba(60,50,40,.55)'; ctx.lineWidth = 1.2;
    [Ly.bot + 16].forEach(function (yy) { ctx.beginPath(); ctx.moveTo(mx - 7, yy + 6); ctx.lineTo(mx - 1, yy - 6); ctx.moveTo(mx + 1, yy + 6); ctx.lineTo(mx + 7, yy - 6); ctx.stroke(); });
    tag(ctx, TH.source === 'sun' ? '149.6 million km' : '0.5 m', w < 500 ? mx + 22 : mx + 14, Ly.bot + 22, dark, w < 500 ? 'center' : 'left');
    /* leaf */
    drawLeaf(ctx, Ly, dark, t);
    /* photons */
    /* the crowd is drawn quieter so the tracked photon reads first; the tracked one is drawn last, on top */
    TH.photons.forEach(function (p) { if (!p.tr) drawPhoton(ctx, p, dark, t, 0.5); });
    TH.photons.forEach(function (p) { if (p.tr) drawPhoton(ctx, p, dark, t, 1); });
    /* slow and named: at most one photon of each colour in the crowd carries its name (blue, red, far red), picked
       just after it leaves the source and kept until it lands; the tracked photon already has its own tag */
    var nm = [], Lc = TH.lay;
    TH.photons.forEach(function (p) {
      if (p.tr || p.st !== 'fly') return;
      var tx = p.l < 500 ? 'blue photon' : (p.l >= 700 ? 'far red photon' : (p.l >= 600 ? 'red photon' : '')); if (!tx) return;
      var span = Math.max(1, Lc.leafX - p.x0);
      nm.push({ k: tx, key: p, t: tx, x: p.x, y: p.y, r: 4, a: 0.95, age: (p.x - p.x0) / span });
    });
    var blk = TAGR.slice(), cw = Math.min(280, w * 0.5) + 40; blk.push({ x: w / 2 - cw / 2 - 10, y: 0, w: cw + 20, h: 56 });
    (TH.namer = TH.namer || LP.names2d())(ctx, { dark: dark }, w, h, nm, blk, { kinds: { 'blue photon': { q: 1, maxAge: 0.35 }, 'red photon': { q: 1, maxAge: 0.35 }, 'far red photon': { q: 1, maxAge: 0.35 } } });
    TAGR = null;
    TH.flashes.forEach(function (f) {
      var k = f.t / 0.7; ctx.globalAlpha = (1 - k) * 0.9; ctx.strokeStyle = wlRGB(f.l, dark); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(f.x, f.y, 2 + 12 * k, 0, 6.29); ctx.stroke(); ctx.globalAlpha = 1;
    });
    /* clock */
    drawClock(ctx, w, h, dark);
  }
  function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
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
  var TAGR = null; /* while set, every tag() drawn records its rectangle (photon names keep clear of tags) */
  function tag(ctx, text, x, y, dark, align, strong) {
    ctx.font = (strong ? '600 ' : '500 ') + '11.5px "IBM Plex Sans", system-ui, sans-serif';
    var tw = ctx.measureText(text).width, px = align === 'center' ? x - tw / 2 : (align === 'right' ? x - tw : x);
    px = Math.max(4, Math.min(TH.w - tw - 12, px));
    ctx.fillStyle = dark ? 'rgba(17,22,27,.86)' : 'rgba(250,246,236,.92)';
    roundRect(ctx, px - 6, y - 12, tw + 12, 18, 9); ctx.fill();
    ctx.strokeStyle = dark ? 'rgba(201,165,106,.55)' : 'rgba(90,75,55,.4)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = dark ? '#ece6da' : '#2a231c'; ctx.textBaseline = 'alphabetic'; ctx.fillText(text, px, y + 1);
    if (TAGR) TAGR.push({ x: px - 8, y: y - 14, w: tw + 16, h: 22 });
  }
  function drawLeaf(ctx, Ly, dark, t) {
    var my = (Ly.top + Ly.bot) / 2, ry = (Ly.bot - Ly.top) / 2 + 6;
    ctx.save();
    ctx.beginPath();
    for (var k = 0; k <= 60; k++) { var yy = my - ry + (2 * ry) * k / 60; var e = leafEdge(Math.min(Ly.bot + 5.9, Math.max(Ly.top - 5.9, yy))); ctx.lineTo(isFinite(e) ? e : Ly.leafX + Ly.lw * 0.5, yy); }
    for (var k2 = 60; k2 >= 0; k2--) { var y2 = my - ry + (2 * ry) * k2 / 60, tt = (y2 - my) / ry; var back = Ly.leafX + Ly.lw * (0.55 + 0.45 * Math.sqrt(Math.max(0, 1 - tt * tt))) + Ly.lw * 0.08 * tt; ctx.lineTo(back, y2); }
    ctx.closePath();
    var g = ctx.createLinearGradient(Ly.leafX, 0, Ly.leafX + Ly.lw, 0);
    if (dark) { g.addColorStop(0, '#5fae4a'); g.addColorStop(0.5, '#3d7f34'); g.addColorStop(1, '#244f22'); } else { g.addColorStop(0, '#8fbf5a'); g.addColorStop(0.5, '#5f8a3c'); g.addColorStop(1, '#3f6a2a'); }
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = dark ? '#a8d88a' : '#2f4f1f'; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.clip();
    /* chloroplasts */
    for (var i = 0; i < 30; i++) {
      var cy = Ly.top + ((i * 0.618) % 1) * (Ly.bot - Ly.top), cx = Ly.leafX + Ly.lw * (0.2 + ((i * 0.381) % 1) * 0.65);
      ctx.fillStyle = dark ? 'rgba(160,230,120,.55)' : 'rgba(40,90,30,.45)';
      ctx.beginPath(); ctx.ellipse(cx, cy, 4.2, 2.4, 0.4, 0, 6.29); ctx.fill();
    }
    /* midrib */
    ctx.strokeStyle = dark ? 'rgba(220,240,200,.35)' : 'rgba(240,250,220,.6)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(Ly.leafX + Ly.lw * 0.62, Ly.top - 4); ctx.quadraticCurveTo(Ly.leafX + Ly.lw * 0.5, my, Ly.leafX + Ly.lw * 0.66, Ly.bot + 4); ctx.stroke();
    ctx.restore();
    tag(ctx, 'A leaf', Ly.leafX + Ly.lw / 2, Ly.bot + 26, dark, 'center');
  }
  function drawPhoton(ctx, p, dark, t, fade) {
    var col = wlRGB(p.l, dark), mode = TH.mode, quiet = (fade || 1) < 1;
    ctx.globalAlpha = Math.max(0, Math.min(1, p.a)) * (fade || 1);
    if (mode !== 'particle') {
      var lpx = p.l * 0.024, L = Math.max(48, lpx * 5), A = p.tr ? 7 : 5;
      var ang = Math.atan2(p.vy || 0, p.vx || 1);
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(ang);
      ctx.beginPath();
      for (var s = -L; s <= 4; s += 1) {
        var env = Math.exp(-Math.pow((s + L / 2) / (L / 3.2), 2));
        var yy = A * env * Math.sin(2 * Math.PI * s / lpx + p.ph);
        if (s === -L) ctx.moveTo(s, yy); else ctx.lineTo(s, yy);
      }
      if (!dark) { ctx.strokeStyle = 'rgba(40,30,20,.35)'; ctx.lineWidth = p.tr ? 4 : 3; ctx.stroke(); }
      ctx.strokeStyle = col; ctx.lineWidth = p.tr ? 2.4 : 1.6;
      if (dark && !quiet) { ctx.shadowColor = col; ctx.shadowBlur = 8; }
      ctx.stroke(); ctx.shadowBlur = 0;
      ctx.restore();
    }
    if (mode !== 'wave') {
      var r = p.tr ? 4.6 : 3.2;
      if (dark && !quiet) { var gl = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3.2); gl.addColorStop(0, col); gl.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(p.x, p.y, r * 3.2, 0, 6.29); ctx.fill(); }
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 6.29); ctx.fill();
      if (!dark) { ctx.strokeStyle = 'rgba(40,30,20,.55)'; ctx.lineWidth = 0.8; ctx.stroke(); }
    }
    if (p.tr && p.st === 'fly') {
      ctx.globalAlpha = 1; ctx.strokeStyle = dark ? '#f3e2b5' : '#2a231c'; ctx.lineWidth = 1.2; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.arc(p.x, p.y, 11, 0, 6.29); ctx.stroke(); ctx.setLineDash([]);
      tag(ctx, 'your photon, ' + Math.round(p.l) + ' nm', p.x, p.y - 18, dark, 'center', true);
    }
    ctx.globalAlpha = 1;
  }
  function fmtDur(s) {
    if (TH.source === 'lamp') return num(s * 1e9, 2) + ' ns';
    s = Math.max(0, s); var m = Math.floor(s / 60), r = Math.round(s - 60 * m); if (r === 60) { m++; r = 0; }
    return m + ' min ' + (r < 10 ? '0' : '') + r + ' s';
  }
  function drawClock(ctx, w, h, dark) {
    var p = TH.tracked, Ly = TH.lay;
    var total = TH.source === 'sun' ? TRIP : 0.5 / C;
    var frac = p ? Math.max(0, Math.min(1, (p.x - p.x0) / Math.max(1, Ly.leafX - p.x0))) : 1;
    ctx.font = '500 11.5px "IBM Plex Mono", ui-monospace, monospace';
    var txt = 'in flight ' + fmtDur(frac * total) + ' of ' + fmtDur(total);
    var bw = Math.max(ctx.measureText(txt).width, Math.min(260, w * 0.5)), bx = Math.max(10, Math.min(w - bw - 10, w / 2 - bw / 2)), by = 12;
    ctx.fillStyle = dark ? 'rgba(17,22,27,.9)' : 'rgba(250,246,236,.95)'; roundRect(ctx, bx - 8, by - 6, bw + 16, 40, 8); ctx.fill();
    ctx.strokeStyle = dark ? 'rgba(201,165,106,.6)' : 'rgba(90,75,55,.45)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = dark ? '#26313b' : '#d9cfb6'; roundRect(ctx, bx, by + 20, bw, 6, 3); ctx.fill();
    ctx.fillStyle = p ? wlRGB(p.l, dark) : (dark ? '#c9a56a' : '#2b5fa4'); roundRect(ctx, bx, by + 20, Math.max(6, bw * frac), 6, 3); ctx.fill();
    ctx.font = '500 11.5px "IBM Plex Mono", ui-monospace, monospace'; ctx.fillStyle = dark ? '#ece6da' : '#2a231c'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(txt, bx, by + 12);
  }

  /* ------------------------------------------------------------ markup */
  function chip(id, label, on) { return '<button type="button" class="chip" data-v="' + id + '" aria-pressed="' + (on ? 'true' : 'false') + '">' + label + '</button>'; }
  function tile(id, k, unit, extra) { return '<div class="tile" id="' + id + '"><div class="k">' + k + '</div><div class="v"><span class="n">0</span> <small>' + (unit || '') + '</small></div>' + (extra || '') + '</div>'; }
  function mount(el) {
    var EVb = ui.ev;
    var chMarkup = CH.map(function (c) {
      return '<div class="ctl lx-ch' + (c.k === 'green' || c.k === 'white' ? ' tier-2' : '') + '"><label for="mx-' + c.k + '"><span><i class="lx-dot" style="background:' + c.col + '"></i>' + esc(c.name) + ' <span class="lx-chsub">' + esc(c.sub) + '</span></span><output id="mx-' + c.k + '-o"></output></label>' +
        '<input type="range" id="mx-' + c.k + '" min="0" max="' + c.max + '" step="' + c.step + '" value="' + (mix[c.k] || 0) + '" aria-describedby="mx-' + c.k + '-h"><div class="hint" id="mx-' + c.k + '-h">' + (c.k === 'sun' ? 'sets PPFD, 400 to 700 nm' : 'photons from this channel') + '</div></div>';
    }).join('');
    el.innerHTML =
      '<style>' + CSS + '</style>' +
      ui.now('<b>What is happening:</b> <span id="sun-now"></span>', 'sun-nowp') +

      /* --- Fig 1.1 the trip --- */
      '<figure class="fig lx-fig" id="sun-trip"><div class="fighead"><h3>1.1 Eight minutes from the Sun</h3><p>Every photon travels at the same speed. Watch one cross 149.6 million km and land on a leaf.</p></div>' +
      '<div class="lx-frame lx-theatre" id="sun-th"></div>' +
      '<div class="lx-ctrls" role="group" aria-label="Photon display">' +
      '<div class="chips" role="group" aria-label="Show photons as" id="sun-mode">' + chip('wave', 'Waves', false) + chip('particle', 'Particles', false) + chip('both', 'Both', true) + '</div>' +
      '<div class="chips" role="group" aria-label="Light source" id="sun-src">' + chip('sun', 'The Sun', true) + chip('lamp', 'Your LED recipe', false) + '</div>' +
      '<div class="chips tier-2" role="group" aria-label="Clock speed" id="sun-speed">' + chip('fast', 'Fast forward', true) + chip('real', 'Real time', false) + '</div>' +
      '<button type="button" class="btn small" id="sun-pause" aria-pressed="false">Pause</button></div>' +
      '<figcaption class="cap" id="sun-trip-cap"></figcaption>' +
      '<p class="cap lx-row">Light covers 1 au (149,597,870,700 m) at 299,792,458 m s⁻¹: <b class="mono">' + num(TRIP, 1) + ' s</b>, about 8 min 19 s. The sunlight on a leaf right now left the Sun about eight minutes ago. ' + EVb('sun_travel_time') + '</p>' +
      '<p class="cap lx-row tier-2">At the leaf a photon is absorbed, reflected or passes through. Blue and red are mostly absorbed; more green is reflected or passes through, which is why leaves look green, yet most green photons are still absorbed and drive photosynthesis deeper in the leaf. ' + EVb('green_light_deep') + ' ' + EVb('sun.leafFate', 'Odds in this scene') + ' ' + EVb('hogewoning_absorptance', 'Red and blue measured') + '</p>' +
      '<p class="cap tier-3">Drawing scale: along each wave packet, 1 px stands for about 42 nm, so the wavelength you see is in proportion between colours. Packets are drawn a few cycles long; real photons are not little sine waves with edges, the packet is a picture of a quantum object that is detected as one particle and spreads as a wave.</p>' +
      '</figure>' +

      /* --- Fig 1.2 pick a photon --- */
      '<figure class="fig lx-fig" id="sun-pick"><div class="fighead"><h3>1.2 Pick a photon</h3><p>Shorter wave, more energy per photon. Same single electron moved.</p></div>' +
      '<div class="lx-pick"><div class="ctl lx-wide"><label for="sun-lam">Wavelength <output id="sun-lam-o"></output></label><input type="range" id="sun-lam" min="380" max="780" step="1" value="660"><div class="lx-rainbow" aria-hidden="true"></div></div>' +
      '<div class="lx-frame lx-wavebox" id="sun-wave"></div>' +
      '<div class="tiles" id="sun-ptiles">' +
      tile('pt-col', 'Colour', '') + tile('pt-e', 'Energy per photon', 'eV') +
      '<div class="tile tier-2" id="pt-j"><div class="k">Energy per photon</div><div class="v"><span class="n">0</span> <small>× 10⁻¹⁹ J</small></div></div>' +
      '<div class="tile tier-2" id="pt-mol"><div class="k">Per mole of photons</div><div class="v"><span class="n">0</span> <small>kJ mol⁻¹</small></div></div>' +
      '<div class="tile tier-2" id="pt-eff"><div class="k">Photons per joule, perfect lamp</div><div class="v"><span class="n">0</span> <small>µmol J⁻¹</small></div></div>' +
      '<div class="tile tier-3" id="pt-f"><div class="k">Frequency</div><div class="v"><span class="n">0</span> <small>THz</small></div></div>' +
      '</div></div>' +
      '<p class="cap lx-row" id="sun-pick-cap"></p>' +
      '<p class="cap lx-row tier-2">A photon is a particle and a wave at once: it is absorbed whole by one molecule, and its colour is set by its wavelength. Its energy is <span class="mono">E = hc/λ</span>. ' + EVb('photon_energy_450', 'Blue') + ' ' + EVb('photon_energy_660', 'Red') + ' ' + EVb('photon_energy_730', 'Far red') + '</p>' +
      '<p class="cap lx-row tier-2">Photosynthesis counts photons, not joules. An absorbed blue photon excites chlorophyll to a higher state that relaxes to the same lowest excited state a red photon reaches, and the difference leaves as heat. Per photon, red does slightly more work than blue at low light. ' + EVb('mccree_red_green_blue') + '</p>' +
      '</figure>' +

      /* --- Fig 1.3 recipe --- */
      '<figure class="fig lx-fig" id="sun-mix"><div class="fighead"><h3>1.3 Mix your own light</h3><p>Sunlight or a grower’s LEDs. What the plant counts, what your eye sees, and what the electricity bill sees.</p></div>' +
      '<div class="chips lx-presets" role="group" aria-label="Presets" id="sun-pre">' + PRESETS.map(function (p) { return '<button type="button" class="chip' + (p.t > 1 ? ' tier-2' : '') + '" data-p="' + p.id + '" aria-pressed="false">' + esc(p.label) + '</button>'; }).join('') + '</div>' +
      '<div class="lx-mixgrid"><div class="lx-chs cond-grid" id="sun-chs">' + chMarkup + '</div>' +
      '<div class="lx-frame lx-spec" id="sun-spec"></div></div>' +
      '<p class="cap lx-row">Shaded bands: PAR, 400 to 700 nm, and extended PAR to 750 nm. ' + EVb('par_definition', 'PAR') + ' ' + EVb('ePAR', 'ePAR') + ' ' + EVb('sun.ledShapes', 'LED shapes') + ' ' + EVb('sun.sunShape', 'Sun shape') + '</p>' +
      '<div class="tiles lx-tiles" id="sun-tiles">' +
      tile('mt-ppfd', 'PPFD, 400 to 700 nm', 'µmol m⁻² s⁻¹') +
      '<div class="tile tier-2" id="mt-epar"><div class="k">ePAR, 400 to 750 nm</div><div class="v"><span class="n">0</span> <small>µmol m⁻² s⁻¹</small></div></div>' +
      '<div class="tile" id="mt-fr"><div class="k">Far red share of ePAR</div><div class="v"><span class="n">0</span> <small>%</small></div><div class="lx-meter"><i></i><b style="left:30%"></b></div></div>' +
      '<div class="tile tier-2" id="mt-blue"><div class="k">Blue share of PPFD</div><div class="v"><span class="n">0</span> <small>%</small></div></div>' +
      '<div class="tile" id="mt-pss"><div class="k">Phytochrome, PSS</div><div class="v"><span class="n">0</span> <small>Pfr / total</small></div><div class="lx-meter lx-pssm"><i></i></div></div>' +
      '<div class="tile" id="mt-elec"><div class="k">Electricity, LED packages</div><div class="v"><span class="n">0</span> <small>W m⁻²</small></div></div>' +
      '<div class="tile tier-2" id="mt-lux"><div class="k">To your eye</div><div class="v"><span class="n">0</span> <small>lux</small></div></div>' +
      '<div class="tile tier-3" id="mt-w"><div class="k">Radiant energy, 400 to 700 nm</div><div class="v"><span class="n">0</span> <small>W m⁻²</small></div></div>' +
      '</div>' +
      '<p class="cap lx-row" id="sun-mix-cap"></p>' +
      '<p class="cap lx-row tier-2">PSS is the share of phytochrome in its active, far red absorbing form. Red pushes it up, far red pulls it down; low PSS, as in the shade of other leaves, tells a plant to stretch. ' + EVb('sun.pssModel', 'PSS model') + ' ' + EVb('shade_avoidance', 'Shade avoidance') + '</p>' +
      '<p class="cap lx-row tier-2">Electricity uses the best LED packages reviewed in 2020: red 4.5, blue 3.5, white 2.9, green 1.9 and far red about 4.7 µmol J⁻¹. Whole fixtures lose more in drivers and optics. ' + EVb('led_efficacy_packages', 'Packages') + ' ' + EVb('sun.frEff', 'Far red') + ' ' + EVb('fixture_efficacy', 'Fixtures') + '</p>' +
      '</figure>' +

      /* --- Fig 1.4 greenhouse at night --- */
      '<figure class="fig lx-fig" id="sun-gh"><div class="fighead"><h3>1.4 Why do greenhouses glow purple at night?</h3><p>The colour below is computed from the recipe above, as a person would see it.</p></div>' +
      '<div class="lx-ghrow"><div class="lx-frame lx-gh" id="sun-ghsvg"></div>' +
      '<div class="lx-ghside"><div class="lx-swatch" id="sun-sw" role="img" aria-label="Colour a person would see"></div><p class="lx-swname"><span id="sun-swn"></span></p>' +
      '<p class="lx-ghtxt" id="sun-ghtxt"></p><p class="lx-row">' + EVb('why_purple', 'Why magenta') + ' ' + EVb('sun.eye', 'How the colour is computed') + '</p></div></div>' +
      '<p class="cap lx-row">The dots rising from the glass are photons leaving the house at night, coloured by the recipe. That leak is the glow a driver sees; far red leaves too but is drawn faint, because the eye barely sees it. <span class="tier-3">Drawing scale: one dot per 25 µmol m⁻² s⁻¹ of LED photons inside ' + ui.badge('ILLUSTRATIVE') + '.</span></p>' +
      '<div class="chips lx-baysrc" id="sun-baysrc" role="group" aria-label="Recipe inside the bay" style="margin-top:12px"><span class="lab">Inside one bay tonight:</span>' +
        '<button type="button" class="chip" data-v="magenta" aria-pressed="true">Grower’s magenta</button>' +
        '<button type="button" class="chip" data-v="jin" aria-pressed="false">Vertical farm + far red</button>' +
        '<button type="button" class="chip" data-v="white" aria-pressed="false">All white</button>' +
        '<button type="button" class="chip" data-v="yours" aria-pressed="false">Your recipe above</button></div>' +
      '<div class="lx-frame lx-theatre" id="sun-bay"></div>' +
      '<p class="cap" id="sun-baycap"></p>' +
      '</figure>' +

      /* --- cases --- */
      '<section class="lx-cases" aria-label="Real cases"><h3 class="lx-h3">Real cases to think with</h3><div class="lx-cardgrid">' +
      '<div class="card lx-case"><p class="lx-ck">Vertical farm, lettuce</p><p>Adding 52 µmol m⁻² s⁻¹ of far red to 218 µmol m⁻² s⁻¹ of red and blue raised lettuce dry weight 46 to 77 % and leaf area 58 to 75 % in four weeks. Leaf photosynthesis per area did not change: the plants spread wider leaves and caught more light. A PPFD sensor would not see that far red at all. ' + EVb('farred_lettuce_vertical_farm') + '</p><p><button type="button" class="btn small" data-load="jin">Load this recipe</button></p></div>' +
      '<div class="card lx-case"><p class="lx-ck">Is far red photosynthetic?</p><p>Far red alone drives very little photosynthesis. Added to shorter wavelengths, far red photons up to about 30 % of the 400 to 750 nm total worked as well as PAR photons in 14 crop canopies, because they excite photosystem I and balance the two photosystems. Emerson saw the same enhancement in algae in 1957. ' + EVb('farred_equal_efficiency') + ' ' + EVb('emerson_enhancement') + '</p></div>' +
      '<div class="card lx-case tier-2"><p class="lx-ck">Blue light and the shape of a plant</p><p>Blue photons are about 20 % less efficient for photosynthesis than 660 nm red, yet growers add 5 to 30 % blue because blue keeps plants compact. In cucumber, 7 % blue doubled the light saturated rate of leaves compared with red alone. ' + EVb('blue_typical_fraction') + ' ' + EVb('blue_dose_amax') + '</p><p><button type="button" class="btn small" data-load="red">Load red only</button> <button type="button" class="btn small" data-load="blue">Load blue only</button></p></div>' +
      '<div class="card lx-case tier-2"><p class="lx-ck">A lux meter in a greenhouse</p><p>Load the magenta preset and then All white at the same PPFD. The plant gets the same photons; the eye, and a lux meter, see far less light from the magenta. Lux is weighted by human vision, which peaks near 555 nm. Plants are not people.</p><p><button type="button" class="btn small" data-load="magenta">Magenta</button> <button type="button" class="btn small" data-load="white">All white</button></p></div>' +
      '</div></section>' +

      /* --- expert --- */
      '<section class="tier-3 lx-expert" aria-label="Expert"><h3 class="lx-h3">Equations and constants</h3>' +
      '<div class="card eq">E = hc / λ  E<sub>mol</sub> = N<sub>A</sub> hc / λ = 119.63 / λ(nm) MJ mol⁻¹   photons per joule = λ(nm) / 119.63 µmol J⁻¹<br>' +
      't = 1 au / c = 149,597,870,700 m / 299,792,458 m s⁻¹ = 499.0 s<br>' +
      'PPFD = ∫<sub>400</sub><sup>700</sup> φ(λ) dλ  ePAR = ∫<sub>400</sub><sup>750</sup> φ(λ) dλ  far red share = ∫<sub>700</sub><sup>750</sup> φ / ePAR<br>' +
      'PSS = ∫ φ σ<sub>r</sub> dλ / ∫ φ (σ<sub>r</sub> + σ<sub>fr</sub>) dλ  (equal photoconversion yields assumed)<br>' +
      'electricity (W m⁻²) = Σ channel photons / channel efficacy  lux = 683 ∫ E<sub>e</sub>(λ) ȳ(λ) dλ</div>' +
      '<div class="lx-tw"><table class="lx-tab"><thead><tr><th>Quantity</th><th>Value</th><th>Status</th></tr></thead><tbody>' +
      row('Planck constant h', '6.62607015 × 10⁻³⁴ J s (exact)', 'DERIVED', 'blackbody_par_energy_fraction') +
      row('Speed of light c', '299,792,458 m s⁻¹ (exact)', 'DERIVED', 'sun_travel_time') +
      row('Astronomical unit', '149,597,870,700 m (exact, IAU 2012)', 'DERIVED', 'sun_travel_time') +
      row('Sunlike spectrum, PAR share of energy', '0.37 (above the atmosphere)', 'DERIVED', 'blackbody_par_energy_fraction') +
      row('Sunlike spectrum, photons per joule of PAR', '4.57 µmol J⁻¹', 'DERIVED', 'blackbody_photons_per_joule_par') +
      row('Sunlike spectrum, far red share of 400 to 750 nm', '0.15', 'DERIVED', 'blackbody_farred_fraction') +
      row('LED package efficiency, blue, red, white, far red', '93, 81, 76, 77 %', 'VERIFIED', 'led_efficiency') +
      row('LED package efficacy, red, blue, white, green', '4.5, 3.5, 2.9, 1.9 µmol J⁻¹', 'VERIFIED', 'led_efficacy_packages') +
      row('Far red package efficacy', '4.70 µmol J⁻¹', 'DERIVED', 'sun.frEff') +
      row('PSS anchors: red, 50 % blue, blue', '0.89, 0.87, 0.51', 'VERIFIED', 'pss_red_blue_leds') +
      row('Pr and Pfr absorption shapes', 'fitted to the anchors', 'ILLUSTRATIVE', 'sun.pssModel') +
      row('Far red ceiling for ePAR', 'about 30 % of 400 to 750 nm', 'VERIFIED', 'ePAR') +
      row('CIE 1931 observer', 'analytic fit', 'ILLUSTRATIVE', 'sun.eye') +
      '</tbody></table></div>' +
      '<div class="card lx-open"><p class="lx-ck">' + ui.badge('OPEN QUESTION') + ' Is 400 to 700 nm still the right definition of photosynthetic light?</p>' +
      '<p>McCree (1971/72) defined PAR as 400 to 700 nm from single leaves in monochromatic light, where far red alone does almost nothing. Zhen and Bugbee (2020) measured whole canopies under mixed light and found far red photons as effective as PAR photons, up to a ceiling. Both are right for what they measured: the disagreement is about which experiment matches a crop under a real light. Which definition should a grower’s sensor use, and how would you test it for lettuce in the Salinas Valley? ' + EVb('par_definition') + ' ' + EVb('farred_equal_efficiency') + '</p></div>' +
      ui.howto('sun.quantum') + ui.howto('sun.spectro') +
      ui.design({ title: 'far red and lettuce in a vertical farm',
        question: 'Does far red raise lettuce growth by making leaves bigger (more light caught) rather than by making each leaf photosynthesise faster? This is the open question above, asked of one crop.',
        treat: 'Red and blue at 218 µmol m⁻² s⁻¹ (89 % red, 11 % blue) as the control; the same plus 52 µmol m⁻² s⁻¹ of far red as the treatment (the Vertical farm preset). Keep PPFD equal, so the only change is photons above 700 nm.',
        measure: 'Spectrum and PSS at canopy height with a spectroradiometer (a PAR sensor cannot see the treatment); leaf area and dry weight at harvest; light interception by the canopy; leaf photosynthesis on a fully expanded leaf at the same PPFD in a gas exchange cuvette.',
        howto: ['sun.spectro', 'leaf.lrc'],
        n: 'Rooms or chambers are the replicates, not plants: at least 3 chambers per treatment, about 10 plants each, treatments swapped between chambers in a second run. Plants inside one chamber are subsamples.',
        expect: 'PSS falls from ' + num(analyse(PRESETS.filter(function (p) { return p.id === 'magenta'; })[0].m).pss, 2) + ' (red and blue) to ' + num(analyse(PRESETS.filter(function (p) { return p.id === 'jin'; })[0].m).pss, 2) + ' with far red (this page’s model, DERIVED). The published result to beat: dry weight +46 to 77 % and leaf area +58 to 75 % in four weeks, with leaf photosynthesis unchanged. ' + EVb('farred_lettuce_vertical_farm', 'Jin 2021') + ' ' + EVb('sun.pssModel', 'PSS model'),
        confound: 'Total photons. Adding far red on top adds photons; swapping some red for far red does not. Decide which question you are asking, and report photon flux from 400 to 750 nm as well as PPFD. Planting density also changes the effect (larger at low density), so fix it.' }) +
      '</section>' +

      /* --- questions --- */
      '<section class="lx-qs" aria-label="Questions"><h3 class="lx-h3">Check yourself</h3>' +
      ui.reveal('A grower swaps a white fixture for a magenta one that gives the same PPFD. At night, does the greenhouse look brighter or dimmer to a person driving past, and does the lettuce get more or fewer photons?',
        '<p>Dimmer to the person, and the same photons for the lettuce. PPFD counts photons from 400 to 700 nm equally; the eye weighs them by its sensitivity, which peaks near 555 nm where the magenta fixture emits almost nothing. Try it with the two presets in 1.3 and watch the lux tile.</p>', { choices: [['Dimmer to a person, same photons for the lettuce', true, 'The eye weighs photons by its own sensitivity, which peaks in the green; PPFD counts them all equally.'], ['Brighter to a person, more photons for the lettuce', false, 'Same PPFD means the same photon count by definition.'], ['Same brightness, same photons', false, 'The eye is not a photon counter: magenta light has little of the green the eye sees best.']] }) +
      '<div class="tier-2">' + ui.reveal('Compare one photon at 450 nm with one at 660 nm. Which carries more energy, by how much, and which colour gives more photons per joule from a perfect lamp?',
        '<p>The blue photon carries 1.47 times the energy (265.8 versus 181.3 kJ mol⁻¹). So a perfect lamp gives more red photons per joule: 5.52 versus 3.76 µmol J⁻¹. Since each absorbed photon moves at most one electron, red light is cheaper photosynthesis per joule, one reason fixtures are red heavy.</p>', { choices: [['Blue carries more energy; red gives more photons per joule', true, 'E = hc/λ: shorter wavelength, more energy per photon, so fewer photons per joule.'], ['Red carries more energy; red gives more photons per joule', false, 'Longer wavelength means LESS energy per photon.'], ['They carry the same energy', false, 'Photon energy depends on wavelength: E = hc/λ.']] }) + '</div>' +
      '<div class="tier-2">' + ui.reveal('You add far red to lettuce under red and blue LEDs. The PPFD sensor reading does not change. Predict what happens to PSS and to leaf area, and explain why the sensor misses it.',
        '<p>PSS falls (try it: the Vertical farm preset), the plants read it as neighbours nearby and expand their leaves; more leaf area catches more of the light, so growth rises (46 to 77 % more dry weight in Jin et al. 2021). The sensor misses it because PPFD stops at 700 nm and far red sits at 700 to 750 nm.</p>', { choices: [['PSS falls and leaves expand', true, 'Far red converts active phytochrome back to the inactive form; the plant reads neighbours and spreads its leaves.'], ['PSS rises and plants stay compact', false, 'That is what extra RED does. Far red pulls PSS down.'], ['Nothing changes, because PPFD did not change', false, 'PPFD stops at 700 nm, so the sensor is blind to the change, not the plant.']] }) + '</div>' +
      '<div class="tier-3">' + ui.reveal('Under red and blue LEDs with no far red, PSS is about 0.89; under sunlight it is lower. What would you predict for stem length and leaf angle of lettuce grown under each, and which receptor carries the signal?',
        '<p>High PSS keeps phytochrome B active, which holds PIF transcription factors in check, so plants stay compact with shorter petioles. Lower PSS under sunlight, and much lower in canopy shade, releases PIFs, raises auxin and stretches stems and petioles (Casal 2013). The blue photoreceptors add their own compacting effect, separate from phytochrome.</p>', { choices: [['Compact under the LEDs, more stretched under sunlight', true, 'High PSS keeps phytochrome B active, which holds the stretching PIF factors in check.'], ['Stretched under the LEDs, compact under sunlight', false, 'Higher PSS means MORE active phytochrome, which suppresses stretching.'], ['No difference: PSS only matters for flowering', false, 'Phytochrome also controls stem and petiole length through PIFs and auxin.']] }) + '</div>' +
      '</section>' + (ui.quiz ? ui.quiz('sun') : '');

    /* theatre */
    TH.anim = ui.anim(el.querySelector('#sun-th'), {
      height: function (w) { return w < 520 ? 310 : 410; }, label: 'Photons travelling from the Sun to a leaf, with a clock', draw: drawScene, settle: settle,
      resize: function () { TH.photons = []; TH.flashes = []; TH.tracked = null; TH.lay = null; }
    });
    chipGroup(el.querySelector('#sun-mode'), function (v) { TH.mode = v; TH.anim.redraw(); capTrip(); });
    chipGroup(el.querySelector('#sun-src'), function (v) { TH.source = v; TH.photons = []; TH.flashes = []; TH.tracked = null; if (ui.reducedMotion()) settle(); TH.anim.redraw(); capTrip(); });
    chipGroup(el.querySelector('#sun-speed'), function (v) { TH.speed = v; TH.photons = []; TH.tracked = null; if (ui.reducedMotion()) settle(); TH.anim.redraw(); capTrip(); });
    var pb = el.querySelector('#sun-pause');
    if (window.PlaySpeed) pb.parentNode.insertBefore(window.PlaySpeed.chip('ps-light'), pb.nextSibling);
    pb.addEventListener('click', function () { var p = !TH.anim.paused(); TH.anim.pause(p); pb.setAttribute('aria-pressed', p ? 'true' : 'false'); pb.textContent = p ? 'Play' : 'Pause'; });
    if (TH.anim.freeze) TH.anim.freeze.bind(pb); // v19: click the view to freeze, in step with Pause

    /* pick a photon */
    var lam = el.querySelector('#sun-lam');
    lam.addEventListener('input', function () { TH.lam = +lam.value; syncPick(); });
    WV.anim = ui.anim(el.querySelector('#sun-wave'), { height: function (w) { return w < 520 ? 120 : 140; }, label: 'The chosen wavelength drawn to scale beside 660 nm red', draw: drawWave });

    /* mixer */
    CH.forEach(function (c) {
      var s = el.querySelector('#mx-' + c.k);
      s.addEventListener('input', function () { mix[c.k] = +s.value; preset = null; syncMix(true); });
    });
    el.querySelector('#sun-pre').addEventListener('click', function (e) { var b = e.target.closest('[data-p]'); if (b) loadPreset(b.dataset.p); });
    el.addEventListener('click', function (e) { var b = e.target.closest('[data-load]'); if (b) { loadPreset(b.dataset.load); var f = document.getElementById('sun-mix'); if (f && f.scrollIntoView) f.scrollIntoView({ behavior: ui.reducedMotion() ? 'auto' : 'smooth', block: 'start' }); } });
    buildSpec(el.querySelector('#sun-spec'));
    buildGH(el.querySelector('#sun-ghsvg'));
    chipGroup(el.querySelector('#sun-baysrc'), function (v) { BAY.src = v; BAY.ph = []; BAY.fl = []; syncMix(false); });
    BAY.anim = ui.anim(el.querySelector('#sun-bay'), { height: function (w) { return w < 520 ? 220 : 250; }, label: 'Inside one greenhouse bay at night: photons from your LED recipe falling on lettuce, a few escaping through the roof', draw: drawBay });
    fromState(LP.state);
    syncPick(); syncMix(false); capTrip();
    ui.onPrefs(function () { syncMix(false); });
  }
  function row(q, v, b, key) { return '<tr><td>' + esc(q) + '</td><td class="mono">' + esc(v) + '</td><td>' + ui.badge(b) + ' ' + ui.ev(key, 'Source') + '</td></tr>'; }
  function chipGroup(g, fn) {
    g.addEventListener('click', function (e) {
      var b = e.target.closest('[data-v]'); if (!b) return;
      Array.prototype.forEach.call(g.querySelectorAll('[data-v]'), function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      fn(b.dataset.v);
    });
  }
  function capTrip() {
    var c = document.getElementById('sun-trip-cap'); if (!c) return;
    var s;
    if (TH.source === 'lamp') s = 'An LED half a metre above a crop: the same photons, the trip takes about 1.7 billionths of a second. Distance changes nothing about what a photon is; the recipe sets which colours arrive.';
    else if (TH.speed === 'real') s = 'Real time: your photon crawls across at the true pace and arrives 8 min 19 s after it leaves. Start it, come back in about eight minutes, and watch it land. (The speed setting does not slow real time.)';
    else s = 'Fast forward: one photon is followed with a ring; the clock converts its progress into the real 8 min 19 s trip. Sunlight carries every colour, with the most photons in the red.';
    if (TH.mode === 'wave') s += ' Shown as waves: longer wavelengths for red, shorter for blue.';
    else if (TH.mode === 'particle') s += ' Shown as particles: each dot is one photon that a single pigment molecule can absorb whole.';
    c.textContent = s;
  }

  /* ------------------------------------------------------------ wave panel */
  var WV = {};
  function drawWave(ctx, w, h, t, dt, info) {
    var dark = info.dark, lam = TH.lam;
    ctx.fillStyle = dark ? '#0b1015' : '#faf6ec'; ctx.fillRect(0, 0, w, h);
    var span = 2000, k = (w - 40) / span, x0 = 20, mid = h * 0.46;
    /* ruler */
    ctx.strokeStyle = dark ? 'rgba(200,190,170,.5)' : 'rgba(60,50,40,.5)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x0, h - 22); ctx.lineTo(x0 + span * k, h - 22); ctx.stroke();
    ctx.font = '11px "IBM Plex Mono", monospace'; ctx.fillStyle = dark ? '#b3aca0' : '#5e5141'; ctx.textAlign = 'center';
    for (var n = 0; n <= span; n += 500) { ctx.beginPath(); ctx.moveTo(x0 + n * k, h - 26); ctx.lineTo(x0 + n * k, h - 18); ctx.stroke(); ctx.fillText(n + ' nm', Math.min(w - 34, Math.max(24, x0 + n * k)), h - 6); }
    ctx.textAlign = 'left';
    /* reference red 660 */
    function wave(l, col, lw, dash, amp, ph) {
      ctx.beginPath();
      for (var x = 0; x <= span; x += 4) { var yy = mid - amp * Math.sin(2 * Math.PI * x / l - ph); if (x === 0) ctx.moveTo(x0 + x * k, yy); else ctx.lineTo(x0 + x * k, yy); }
      ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.setLineDash(dash || []); ctx.stroke(); ctx.setLineDash([]);
    }
    var ph = info.reduce ? 0 : t * 3;
    if (Math.abs(lam - 660) > 3) wave(660, dark ? 'rgba(240,120,110,.55)' : 'rgba(170,40,30,.5)', 1.4, [4, 4], h * 0.24, ph * 660 / 660);
    var col = wlRGB(lam, dark);
    if (!dark) wave(lam, 'rgba(40,30,20,.35)', 4.4, null, h * 0.3, ph);
    if (dark) { ctx.shadowColor = col; ctx.shadowBlur = 8; }
    wave(lam, col, 2.6, null, h * 0.3, ph);
    ctx.shadowBlur = 0;
    ctx.font = '500 11.5px "IBM Plex Sans", system-ui, sans-serif'; ctx.fillStyle = dark ? '#ece6da' : '#2a231c';
    ctx.fillText(Math.round(2000 / lam * 10) / 10 + ' waves in 2000 nm', x0, 14);
    if (Math.abs(lam - 660) > 3) { ctx.fillStyle = dark ? '#f0a59c' : '#8a2a20'; ctx.fillText('dashed: 660 nm red for comparison', Math.max(x0, w - 230), 14); }
  }
  function syncPick() {
    var l = TH.lam, d = ui.isDark();
    var o = document.getElementById('sun-lam-o'); if (!o) return;
    o.textContent = l + ' nm';
    function setT(id, v) { var e = document.querySelector('#' + id + ' .n'); if (e) e.textContent = v; }
    setT('pt-col', colourWord(l)); var sw = document.querySelector('#pt-col .v'); if (sw) sw.style.color = wlRGB(l, d);
    setT('pt-e', num(eV(l), 2)); setT('pt-j', num(ePhotonJ(l) * 1e19, 2)); setT('pt-mol', num(kJmol(l), 1)); setT('pt-eff', num(umolPerJ(l), 2)); setT('pt-f', num(THz(l), 0));
    var r = kJmol(l) / kJmol(660), ref = Math.abs(l - 660) < 2;
    var cap = document.getElementById('sun-pick-cap');
    if (cap) cap.textContent = l < 400 ? 'Below 400 nm is ultraviolet: outside PAR, energetic enough to damage DNA and proteins.' :
      (l > 750 ? 'Beyond 750 nm leaves absorb almost nothing; this light mostly passes through or reflects, which keeps leaves from overheating.' :
        (l > 700 ? 'Far red: outside the classic 400 to 700 nm PAR band, yet it drives photosystem I and tells phytochrome that neighbours are near. ' + 'A ' + l + ' nm photon carries ' + num(r, 2) + ' times the energy of a 660 nm photon.' :
          (ref ? 'This is the reference: a 660 nm red photon, near the red absorption peak of chlorophyll. Move the slider to compare other colours with it.' : 'A ' + l + ' nm photon carries ' + num(r, 2) + ' times the energy of a 660 nm red photon, but if absorbed it still moves one electron. The rest becomes heat.')));
    if (TH.anim) TH.anim.redraw();
    if (WV.anim) WV.anim.redraw();
  }

  /* ------------------------------------------------------------ spectrum chart (SVG) */
  var SP = {};
  var SVGNS = 'http://www.w3.org/2000/svg';
  function buildSpec(host) {
    var narrow = (host.getBoundingClientRect().width || 640) < 560;
    var W = narrow ? 400 : 640, Hh = narrow ? 290 : 250, ml = narrow ? 36 : 44, mr = 12, mt = 16, mb = 40;
    SP.W = W; SP.H = Hh; SP.ml = ml; SP.mr = mr; SP.mt = mt; SP.mb = mb;
    var stops = '';
    for (var l = 380; l <= 780; l += 10) stops += '<stop offset="' + ((l - 380) / 400).toFixed(3) + '" stop-color="' + wlRGB(l, false) + '"/>';
    var x = function (l) { return ml + (l - 380) / 400 * (W - ml - mr); };
    SP.x = x;
    host.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + Hh + '" class="lx-specsvg" role="img" aria-labelledby="spec-t"><title id="spec-t">Spectrum of the light you mixed</title>' +
      '<defs><linearGradient id="spec-g" x1="' + x(380) + '" x2="' + x(780) + '" gradientUnits="userSpaceOnUse">' + stops + '</linearGradient></defs>' +
      '<rect class="sp-par" x="' + x(400) + '" y="' + mt + '" width="' + (x(700) - x(400)) + '" height="' + (Hh - mt - mb) + '"/>' +
      '<rect class="sp-epar" x="' + x(700) + '" y="' + mt + '" width="' + (x(750) - x(700)) + '" height="' + (Hh - mt - mb) + '"/>' +
      '<text class="sp-lab" x="' + (x(550)) + '" y="' + (mt + 12) + '" text-anchor="middle">PAR</text><text class="sp-lab" x="' + x(725) + '" y="' + (mt + 12) + '" text-anchor="middle">ePAR</text>' +
      '<path id="sp-fill" fill="url(#spec-g)" fill-opacity=".85"/><path id="sp-line" class="sp-line"/>' +
      '<path id="sp-eye" class="sp-eye"/><text id="sp-eyel" class="sp-eyel">your eye</text>' +
      '<path id="sp-pr" class="sp-pr tier-3"/><path id="sp-pfr" class="sp-pfr tier-3"/>' +
      '<line class="sp-ax" x1="' + ml + '" x2="' + (W - mr) + '" y1="' + (Hh - mb) + '" y2="' + (Hh - mb) + '"/>' +
      '<rect x="' + x(380) + '" y="' + (Hh - mb + 3) + '" width="' + (x(780) - x(380)) + '" height="7" fill="url(#spec-g)"/>' +
      (narrow ? [400, 500, 600, 700] : [400, 500, 600, 700, 750]).map(function (l) { return '<text class="sp-tk" x="' + x(l) + '" y="' + (Hh - mb + 24) + '" text-anchor="middle">' + l + '</text>'; }).join('') +
      '<text class="sp-tk" x="' + (W - mr) + '" y="' + (Hh - 4) + '" text-anchor="end">wavelength, nm</text>' +
      '<g id="sp-y"></g>' +
      '<text class="sp-tk" x="4" y="' + (mt - 4) + '">µmol m⁻² s⁻¹ nm⁻¹</text>' +
      '<g class="tier-3"><text class="sp-tk sp-prl" id="sp-prl" x="' + x(690) + '" y="' + (mt + 40) + '">Pr</text><text class="sp-tk sp-pfrl" id="sp-pfrl" x="' + x(752) + '" y="' + (Hh - mb - 0.32 * (Hh - mt - mb)) + '">Pfr</text></g>' +
      '</svg>';
    SP.svg = host.querySelector('svg');
  }
  function drawSpec() {
    if (!SP.svg) return;
    var phi = A.phi, W = SP.W, Hh = SP.H, mt = SP.mt, mb = SP.mb, x = SP.x;
    var mx = 0; for (var i = 0; i < NL; i++) mx = Math.max(mx, phi[i]);
    var top = niceMax(mx || 1);
    var y = function (v) { return Hh - mb - (v / top) * (Hh - mt - mb - 16); };
    var d = 'M' + x(380) + ' ' + y(0), dl = '';
    for (var j = 0; j < NL; j += 2) { d += 'L' + x(LAM[j]).toFixed(1) + ' ' + y(phi[j]).toFixed(1); dl += (j ? 'L' : 'M') + x(LAM[j]).toFixed(1) + ' ' + y(phi[j]).toFixed(1); }
    d += 'L' + x(780) + ' ' + y(0) + 'Z';
    SP.svg.querySelector('#sp-fill').setAttribute('d', mx ? d : '');
    SP.svg.querySelector('#sp-line').setAttribute('d', mx ? dl : '');
    var de = '', dr = '', df = '', yb = Hh - mb, hh = (Hh - mt - mb - 16);
    for (var k = 0; k < NL; k += 3) {
      de += (k ? 'L' : 'M') + x(LAM[k]).toFixed(1) + ' ' + (yb - YB[k] * hh * 0.98).toFixed(1);
      dr += (k ? 'L' : 'M') + x(LAM[k]).toFixed(1) + ' ' + (yb - EPS_R[k] * hh * 0.9).toFixed(1);
      df += (k ? 'L' : 'M') + x(LAM[k]).toFixed(1) + ' ' + (yb - EPS_FR[k] / 0.3 * hh * 0.25).toFixed(1);
    }
    SP.svg.querySelector('#sp-eye').setAttribute('d', de);
    var el = SP.svg.querySelector('#sp-eyel'); el.setAttribute('x', x(598)); el.setAttribute('y', yb - hh * 0.98 + 10);
    SP.svg.querySelector('#sp-pr').setAttribute('d', dr);
    SP.svg.querySelector('#sp-pfr').setAttribute('d', df);
    var g = SP.svg.querySelector('#sp-y'), s = '';
    [0, 0.5, 1].forEach(function (f) { var v = top * f; s += '<line class="sp-grid" x1="' + SP.ml + '" x2="' + (W - SP.mr) + '" y1="' + y(v) + '" y2="' + y(v) + '"/><text class="sp-tk" x="' + (SP.ml - 5) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + fmtSmall(v) + '</text>'; });
    g.innerHTML = s;
  }
  function niceMax(v) { var p = Math.pow(10, Math.floor(Math.log10(v))), m = v / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p; }
  function fmtSmall(v) { if (!v) return '0'; return v >= 10 ? num(v, 0) : v >= 1 ? num(v, 1) : num(v, 2); }

  /* ------------------------------------------------------------ inside one bay at night (canvas, moves at a rate set by the LED flux) */
  var BAY = { ph: [], fl: [], acc: 0, src: 'magenta' };
  /* the bay is a night scene: it runs its own recipe (default grower's magenta) unless the visitor picks "Your recipe above" */
  function bayMix() {
    if (BAY.src === 'yours') { var m = {}; ['white', 'blue', 'green', 'red', 'farred'].forEach(function (k) { m[k] = +mix[k] || 0; }); return m; }
    var p = PRESETS.filter(function (x) { return x.id === BAY.src; })[0] || PRESETS[3], o = { white: 0, blue: 0, green: 0, red: 0, farred: 0 };
    Object.keys(p.m).forEach(function (k) { if (k in o) o[k] = p.m[k]; });
    return o;
  }
  var BAYL = { white: 0, blue: 450, green: 525, red: 660, farred: 730 };
  function bayPick() {
    var tot = 0, ks = ['white', 'blue', 'green', 'red', 'farred'], bm = bayMix();
    ks.forEach(function (k) { tot += +bm[k] || 0; });
    if (!(tot > 0)) return null;
    var r = Math.random() * tot;
    for (var i = 0; i < ks.length; i++) { r -= +bm[ks[i]] || 0; if (r <= 0) break; }
    var k = ks[Math.min(i, 4)];
    return k === 'white' ? [440, 455, 530, 560, 590, 610, 630][Math.floor(Math.random() * 7)] : BAYL[k];
  }
  function bayStep(dt, w, h) {
    var leds = 0, bm = bayMix(); ['white', 'blue', 'green', 'red', 'farred'].forEach(function (k) { leds += +bm[k] || 0; });
    var barY = 52, soil = h - 34;
    BAY.acc += dt * Math.min(40, leds * 0.08);
    while (BAY.acc > 1) {
      BAY.acc -= 1; var l = bayPick(); if (l == null) break;
      var x = w * 0.18 + Math.random() * w * 0.64, up = Math.random() < 0.1;
      BAY.ph.push({ x: x, y: barY + 6, vx: (Math.random() - 0.5) * 40, vy: up ? -120 : 150 + Math.random() * 40, l: l, a: 1, st: up ? 'up' : 'down' });
    }
    for (var i = BAY.ph.length - 1; i >= 0; i--) {
      var p = BAY.ph[i]; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.st === 'down' && p.y >= soil - 22) {
        var f = fate(p.l);
        if (f === 'abs') { BAY.fl.push({ x: p.x, y: soil - 22, l: p.l, t: 0 }); BAY.ph.splice(i, 1); continue; }
        if (f === 'ref') { p.st = 'up'; p.vy = -110; p.vx = (Math.random() - 0.5) * 80; } else { BAY.ph.splice(i, 1); continue; }
      }
      if (p.y < -10 || p.x < -10 || p.x > w + 10) BAY.ph.splice(i, 1);
    }
    for (var j = BAY.fl.length - 1; j >= 0; j--) { BAY.fl[j].t += dt; if (BAY.fl[j].t > 0.6) BAY.fl.splice(j, 1); }
  }
  function drawBay(ctx, w, h, t, dt, info) {
    var dark = info.dark;
    if (dt > 0) bayStep(dt, w, h); else if (!BAY.ph.length) for (var k = 0; k < 40; k++) bayStep(0.05, w, h);
    var bm = bayMix(), A = BAY.A || analyse(bm), glow = A.ledPh > 0 ? A.col : 'rgb(20,26,34)';
    var bg = ctx.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#070b12'); bg.addColorStop(1, '#0d1420'); ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    /* glow of the room in the recipe colour */
    if (A.ledPh > 0) { ctx.globalAlpha = Math.min(0.35, 0.08 + A.ledPh / 2000); var gg = ctx.createRadialGradient(w / 2, h * 0.55, 10, w / 2, h * 0.55, w * 0.6); gg.addColorStop(0, glow); gg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gg; ctx.fillRect(0, 0, w, h); ctx.globalAlpha = 1; }
    /* glass roof */
    ctx.strokeStyle = 'rgba(190,210,230,.55)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(w * 0.06, 44); ctx.lineTo(w * 0.5, 14); ctx.lineTo(w * 0.94, 44); ctx.lineTo(w * 0.94, h - 30); ctx.moveTo(w * 0.06, 44); ctx.lineTo(w * 0.06, h - 30); ctx.stroke();
    /* LED bar */
    ctx.fillStyle = '#2b3138'; roundRect(ctx, w * 0.16, 46, w * 0.68, 10, 4); ctx.fill();
    var on = ['white', 'blue', 'green', 'red', 'farred'].filter(function (k) { return bm[k] > 0; });
    for (var i = 0; i < 14; i++) { var kk = on.length ? on[i % on.length] : null, dx = w * 0.18 + i * w * 0.64 / 13; ctx.fillStyle = kk ? (kk === 'white' ? '#fffbe8' : wlRGB(BAYL[kk], true)) : '#555'; ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = kk ? 10 : 0; ctx.beginPath(); ctx.arc(dx, 56, 3, 0, 6.29); ctx.fill(); }
    ctx.shadowBlur = 0;
    /* soil and lettuce heads */
    var soil = h - 34; ctx.fillStyle = '#3a2a1c'; ctx.fillRect(0, soil, w, h - soil);
    var nh = w < 500 ? 5 : 7;
    for (var j = 0; j < nh; j++) {
      var cx = w * (0.14 + j * 0.72 / (nh - 1)), cy = soil - 10;
      [[-13, 3, 13], [13, 3, 13], [0, -7, 15], [-6, 5, 11], [7, 5, 11]].forEach(function (q, n) {
        var gr = ctx.createRadialGradient(cx + q[0] - 3, cy + q[1] - 3, 1, cx + q[0], cy + q[1], q[2]);
        gr.addColorStop(0, n === 2 ? '#c9f08a' : '#9fd36a'); gr.addColorStop(1, '#3f7a2a');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(cx + q[0], cy + q[1], q[2], 0, 6.29); ctx.fill();
      });
    }
    /* photons */
    BAY.ph.forEach(function (p) {
      var col = p.l === 730 ? '#c0304a' : wlRGB(p.l, true);
      ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 6; ctx.beginPath(); ctx.arc(p.x, p.y, p.st === 'up' ? 2.6 : 2.2, 0, 6.29); ctx.fill();
    });
    ctx.shadowBlur = 0;
    BAY.fl.forEach(function (f) { var k = f.t / 0.6; ctx.globalAlpha = (1 - k) * 0.8; ctx.strokeStyle = f.l === 730 ? '#c0304a' : wlRGB(f.l, true); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(f.x, f.y, 2 + 8 * k, 0, 6.29); ctx.stroke(); ctx.globalAlpha = 1; });
    var sv = TH.w; TH.w = w;
    tag(ctx, A.ledPh > 0 ? 'LED bar: ' + (BAY.src === 'yours' ? 'your recipe' : BAY.src === 'jin' ? 'red, blue and far red' : BAY.src === 'white' ? 'white' : 'red and blue') : 'LED bar: all channels off', w * 0.16, 76, true, 'left');
    tag(ctx, 'a few escape: this is what a driver sees', w - 8, 30, true, 'right');
    tag(ctx, 'lettuce absorbs most photons', w / 2, h - 10, true, 'center');
    TH.w = sv;
  }

  /* ------------------------------------------------------------ night greenhouse (SVG) */
  var GH = {};
  function buildGH(host) {
    var stars = '';
    for (var i = 0; i < 40; i++) stars += '<circle cx="' + ((i * 97.3) % 400).toFixed(1) + '" cy="' + ((i * 41.7) % 110).toFixed(1) + '" r="' + (0.5 + (i % 3) * 0.4) + '"/>';
    var houses = '';
    for (var h = 0; h < 4; h++) {
      var x0 = 60 + h * 72;
      houses += '<path class="gh-glass" d="M' + x0 + ' 205 L' + x0 + ' 168 L' + (x0 + 36) + ' 146 L' + (x0 + 72) + ' 168 L' + (x0 + 72) + ' 205 Z"/>' +
        '<path class="gh-frame" d="M' + x0 + ' 205 L' + x0 + ' 168 L' + (x0 + 36) + ' 146 L' + (x0 + 72) + ' 168 L' + (x0 + 72) + ' 205 M' + (x0 + 18) + ' 157 L' + (x0 + 18) + ' 205 M' + (x0 + 36) + ' 146 L' + (x0 + 36) + ' 205 M' + (x0 + 54) + ' 157 L' + (x0 + 54) + ' 205 M' + x0 + ' 184 L' + (x0 + 72) + ' 184"/>';
    }
    host.innerHTML = '<div class="gh-wrap"><svg viewBox="0 0 400 240" class="lx-ghsvg" role="img" aria-labelledby="gh-t"><title id="gh-t">A greenhouse lit by your recipe</title>' +
      '<defs><radialGradient id="gh-glow" cx="50%" cy="60%" r="55%"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="gh-sky" x1="0" x2="0" y1="0" y2="1"><stop id="gh-s0" offset="0"/><stop id="gh-s1" offset="1"/></linearGradient></defs>' +
      '<rect width="400" height="240" fill="url(#gh-sky)"/><g class="gh-stars" id="gh-stars">' + stars + '</g>' +
      '<ellipse id="gh-halo" cx="204" cy="170" rx="210" ry="110" fill="url(#gh-glow)"/>' +
      '<path class="gh-hill" d="M0 200 Q 70 170 140 190 T 280 186 T 400 192 V240 H0Z"/>' +
      houses +
      '<path class="gh-ground" d="M0 205 H400 V240 H0Z"/>' +
      '<text class="gh-lab" x="12" y="232" id="gh-lab"></text></svg><div class="gh-cv" aria-hidden="true"></div></div>';
    GH.svg = host.querySelector('svg');
    /* U7L (unifier r7): photons leaking out through the glass, coloured by the recipe's channels, at a rate set by the
       LED photon flux (1 drawn per 25 µmol m⁻² s⁻¹, ILLUSTRATIVE scale). Far red is drawn faint: the eye barely sees it. */
    GH.p = []; GH.acc = 0;
    GH.anim = ui.anim(host.querySelector('.gh-cv'), { freeze: false /* v19: the canvas lets clicks through; the wrap takes them, below */, height: function (w) { return Math.round(w * 0.6); }, label: 'Photons escaping through the greenhouse glass', draw: drawGHp, settle: function () { GH.p = []; } });
    var ghw = host.querySelector('.gh-wrap') || GH.svg.parentNode; // v19: click the greenhouse to freeze or play its photons
    if (window.WPFreeze && ghw) WPFreeze.attach(ghw, { paused: function () { return GH.anim.paused(); }, set: function (p) { GH.anim.pause(p); } });
  }
  var GH_COL = { white: ['#fff6dc', 1], blue: ['#4f74ff', 1], green: ['#3fd06a', 1], red: ['#ff3b30', 1], farred: ['#a0182c', 0.35] };
  function ghPick() {
    var m = GH.mix || {}, t = 0, k; for (k in GH_COL) t += m[k] || 0;
    if (!(t > 0)) return null;
    var u = Math.random() * t; for (k in GH_COL) { u -= m[k] || 0; if (u <= 0) return k; } return 'red';
  }
  function ghSpawn(p0) {
    var k = ghPick(); if (!k) return;
    var h = Math.floor(Math.random() * 4), x0 = 60 + h * 72, u = Math.random(), x, y;
    if (u < 0.6) { var s = Math.random(); x = x0 + 72 * s; y = s < 0.5 ? 168 - 44 * s : 146 + 44 * (s - 0.5); }
    else { x = Math.random() < 0.5 ? x0 + 1 : x0 + 71; y = 170 + Math.random() * 32; }
    var ang = -Math.PI / 2 + (Math.random() - 0.5) * 1.5 + (u >= 0.6 ? (x === x0 + 1 ? -0.6 : 0.6) : 0);
    GH.p.push({ k: k, x: x, y: y, vx: Math.cos(ang) * 60, vy: Math.sin(ang) * 60, a: p0 || 0 });
  }
  function drawGHp(c, w, h, t, dt, info) {
    c.clearRect(0, 0, w, h);
    if (!GH.svg || GH.day || !(GH.leds > 0)) { GH.p = []; return; }
    var k = w / 400, rate = Math.min(45, GH.leds / 25);
    if (dt > 0) {
      GH.acc += dt * rate; while (GH.acc >= 1) { GH.acc -= 1; ghSpawn(); }
      GH.p.forEach(function (q) { q.x += q.vx * dt; q.y += q.vy * dt; q.a += dt; });
      GH.p = GH.p.filter(function (q) { return q.a < 2.2 && q.y > -5 && q.x > -5 && q.x < 405; });
    } else if (!GH.p.length) { for (var i = 0; i < Math.min(40, rate * 1.2); i++) { ghSpawn(); var q = GH.p[GH.p.length - 1]; if (q) { var s = Math.random() * 1.8; q.x += q.vx * s; q.y += q.vy * s; q.a = s; } } }
    GH.p.forEach(function (q) {
      var col = GH_COL[q.k], fade = Math.max(0, 1 - q.a / 2.2) * col[1];
      c.save(); c.globalAlpha = fade; c.shadowColor = col[0]; c.shadowBlur = 6;
      c.fillStyle = col[0]; c.beginPath(); c.arc(q.x * k, q.y * k, 1.8 * Math.max(1, k * 0.8), 0, Math.PI * 2); c.fill(); c.restore();
    });
  }
  function drawGH() {
    if (!GH.svg) return;
    var leds = A.ledPh, sun = mix.sun || 0, day = sun > 0, borrowed = false;
    /* L1 r5: with no LED channels in the recipe above, show the night bay recipe instead of an empty daytime house */
    if (!(leds > 0)) { var bm0 = bayMix(), BA = analyse(bm0); if (BA.ledPh > 0) { leds = BA.ledPh; day = false; borrowed = true; } }
    var dark = ui.isDark();
    var s0 = GH.svg.querySelector('#gh-s0'), s1 = GH.svg.querySelector('#gh-s1');
    if (day) { s0.setAttribute('stop-color', '#7fb2e5'); s1.setAttribute('stop-color', '#d8e8f2'); }
    else { s0.setAttribute('stop-color', '#060a14'); s1.setAttribute('stop-color', '#1a2233'); }
    GH.svg.querySelector('#gh-stars').style.opacity = day ? 0 : 1;
    var ledMix = {}; CH.forEach(function (c) { if (c.k !== 'sun') ledMix[c.k] = mix[c.k]; });
    if (borrowed) ledMix = bayMix();
    GH.mix = ledMix; GH.day = day; GH.leds = leds;
    if (GH.anim) { if (ui.reducedMotion()) GH.p = []; GH.anim.kick(); GH.anim.redraw(); }
    var LA = analyse(ledMix);
    var glowCol = leds > 0 ? LA.col : '#000';
    var bright = leds > 0 ? Math.min(1, 0.25 + 0.25 * Math.log10(1 + LA.lux / 100)) : 0;
    var halo = GH.svg.querySelector('#gh-halo');
    halo.setAttribute('fill', 'url(#gh-glow)');
    GH.svg.querySelector('#gh-glow stop').setAttribute('stop-color', glowCol);
    halo.style.opacity = day ? 0 : bright;
    Array.prototype.forEach.call(GH.svg.querySelectorAll('.gh-glass'), function (g) { g.setAttribute('fill', day ? (dark ? '#9fb7c9' : '#c9dbe6') : (leds > 0 ? glowCol : '#1d2633')); g.style.opacity = day ? 0.8 : (leds > 0 ? 0.55 + 0.4 * bright : 1); });
    GH.svg.querySelector('#gh-lab').textContent = borrowed ? 'Night, the bay recipe below (your recipe has no LEDs)' : day ? (leds > 0 ? 'Daytime, with LEDs adding to the sun' : 'Daytime: sunlight only') : (leds > 0 ? 'Night, LEDs on' : 'Night, lights off');
  }

  /* ------------------------------------------------------------ mixer sync */
  function loadPreset(id) {
    var p = PRESETS.filter(function (x) { return x.id === id; })[0]; if (!p) return;
    CH.forEach(function (c) { mix[c.k] = p.m[c.k] || 0; });
    preset = id;
    syncMix(true);
  }
  function fromState(st) {
    if (!st || !st.spectrum) return;
    var s = st.spectrum, ppfd = +st.ppfd || 0;
    var sa = analyse({ sun: 1 });
    var sunF = sa.engine;
    var close = ['blue', 'green', 'red', 'farred'].every(function (k) { return Math.abs((s[k] || 0) - sunF[k]) < 0.03; });
    if (close) { CH.forEach(function (c) { mix[c.k] = 0; }); mix.sun = ppfd; preset = null; return; }
    /* map band fractions onto LED channels at the engine PPFD */
    var par = (s.blue || 0) + (s.green || 0) + (s.red || 0);
    if (!(par > 0) || !(ppfd > 0)) return;
    var epar = ppfd / par;
    CH.forEach(function (c) { mix[c.k] = 0; });
    mix.blue = Math.round(epar * (s.blue || 0)); mix.green = Math.round(epar * (s.green || 0)); mix.red = Math.round(epar * (s.red || 0)); mix.farred = Math.round(epar * (s.farred || 0));
    preset = null;
  }
  var pushing = false;
  function syncMix(push) {
    A = analyse(mix);
    CH.forEach(function (c) {
      var s = document.getElementById('mx-' + c.k), o = document.getElementById('mx-' + c.k + '-o');
      if (s && document.activeElement !== s) s.value = mix[c.k] || 0;
      if (o) o.textContent = num(mix[c.k] || 0, 0);
    });
    Array.prototype.forEach.call(document.querySelectorAll('#sun-pre [data-p]'), function (b) { b.setAttribute('aria-pressed', b.dataset.p === preset ? 'true' : 'false'); });
    function setT(id, v) { var e = document.querySelector('#' + id + ' .n'); if (e) e.textContent = v; }
    setT('mt-ppfd', num(A.ppfd, 0)); setT('mt-epar', num(A.epar, 0)); setT('mt-fr', num(100 * A.frShare, 1)); setT('mt-blue', num(100 * A.blueShare, 1));
    setT('mt-pss', A.pss == null ? 'n/a' : num(A.pss, 2)); setT('mt-elec', A.ledPh > 0 ? num(A.elec, 0) : '0'); setT('mt-lux', num(A.lux, 0)); setT('mt-w', num(A.Wpar, 0));
    var fm = document.querySelector('#mt-fr .lx-meter i'); if (fm) { fm.style.width = Math.min(100, 100 * A.frShare / 0.5) + '%'; fm.parentNode.parentNode.classList.toggle('lx-warn', A.frShare > 0.3); }
    var b30 = document.querySelector('#mt-fr .lx-meter b'); if (b30) b30.style.left = (0.3 / 0.5 * 100) + '%';
    var pm = document.querySelector('#mt-pss .lx-meter i'); if (pm) pm.style.width = (100 * (A.pss || 0)) + '%';
    var ec = document.querySelector('#mt-elec small'); if (ec) ec.textContent = A.ledPh > 0 ? 'W m⁻²' : 'W m⁻², sunlight is free';
    drawSpec(); drawGH();
    /* swatch and text */
    var GA = A.ledPh > 0 ? A : analyse(bayMix()); if (!(GA.ledPh > 0)) GA = A;
    var sw = document.getElementById('sun-sw'); if (sw) { sw.style.background = GA.col; sw.setAttribute('aria-label', 'Colour a person would see: ' + GA.name); }
    var swn = document.getElementById('sun-swn'); if (swn) swn.textContent = GA.name === 'dark' ? 'no light' : 'A person sees: ' + GA.name;
    var gt = document.getElementById('sun-ghtxt'); if (gt) gt.textContent = ghText();
    BAY.A = analyse(bayMix()); if (BAY.anim) BAY.anim.redraw();
    var bc = document.getElementById('sun-baycap');
    if (bc) bc.innerHTML = (BAY.A.ledPh > 0 ? 'Inside one bay with ' + (BAY.src === 'yours' ? 'your recipe' : 'this night recipe') + ': ' + num(BAY.A.ledPh, 0) + ' µmol m⁻² s⁻¹ of LED photons. Dots fall at a rate set by that flux; the lettuce absorbs most red and blue and reflects more green, and the photons that leave through the glass carry the colour the street sees. ' : 'Inside one bay: your recipe has every LED channel off, so no photons fall. Pick a night recipe above. ') + ui.ev('sun.bay', 'Drawing scale');
    var mc = document.getElementById('sun-mix-cap'); if (mc) mc.textContent = mixText();
    var now = document.getElementById('sun-now'); if (now) now.textContent = nowText();
    if (push && typeof LP.set === 'function') {
      pushing = true;
      try { LP.set({ ppfd: Math.round(A.ppfd), spectrum: A.engine }); } finally { pushing = false; }
    }
    if (TH.source === 'lamp' && TH.anim) TH.anim.redraw();
  }
  function ghText() {
    var ledMix = {}; CH.forEach(function (c) { if (c.k !== 'sun') ledMix[c.k] = mix[c.k]; });
    var LA = analyse(ledMix), pre = '';
    if (!(LA.ledPh > 0)) { LA = analyse(bayMix()); if (!(LA.ledPh > 0)) return 'All channels are off. Pick a preset.'; pre = 'Your recipe above has no LEDs, so this is the night recipe from the bay below. '; }
    return pre + ghCore(LA);
  }
  function ghCore(LA) {
    var b = LA.bands, g = b.green / Math.max(1e-9, LA.ppfd);
    if (LA.name === 'magenta' || LA.name === 'purple' || LA.name === 'pink' || LA.name === 'violet')
      return 'This mix looks ' + LA.name + ': red and blue diodes with almost no green (' + num(100 * g, 0) + ' % of PAR). Red and blue are the cheapest photons per joule and sit near the chlorophyll absorption peaks, so the most efficient fixtures look this way. Your eye is most sensitive near 555 nm, where this light has little, so it looks dimmer than its photon count.';
    if (LA.name.indexOf('white') >= 0) return 'This mix looks ' + LA.name + ': it covers the green your eye is most sensitive to. Pleasant to work under, and it shows plant colours and disease truly, but white LEDs give fewer photons per joule than red and blue.';
    return 'This mix looks ' + LA.name + ' to a person. The plant does not care about the colour you see; it counts photons and reads the red to far red balance.';
  }
  function mixText() {
    var w = [];
    if (A.ppfd <= 0 && A.epar <= 0) return 'No light: every slider is at zero.';
    w.push('PPFD ' + num(A.ppfd, 0) + ' µmol m⁻² s⁻¹');
    if (A.fr > Math.max(0.5, 0.02 * A.ppfd)) w.push('plus ' + num(A.fr, 0) + ' of far red that a PPFD sensor does not count');
    var s = w.join(', ') + '.';
    if (A.frShare > 0.3) s += ' Far red is above about 30 % of ePAR: beyond that, extra far red adds little photosynthesis and stretches stems.';
    if (A.pss != null) s += ' PSS ' + num(A.pss, 2) + (A.pss > 0.8 ? ': phytochrome more active than under open sky, plants stay compact.' : A.pss >= 0.65 ? ': about what open sky gives (sunlight is about 0.7).' : ': the plant reads the shade of other leaves, and stems and leaves stretch.');
    if (A.ledPh > 0) s += ' The LED packages draw about ' + num(A.elec, 0) + ' W m⁻² at best.';
    return s;
  }
  function nowText() {
    if (A.ppfd <= 0 && A.epar <= 0) return 'No light reaches the leaf. Pick a preset in 1.3.';
    var src = mix.sun > 0 && A.ledPh > 0 ? 'Sunlight and LEDs' : (mix.sun > 0 ? 'Sunlight' : 'LED light');
    return src + ' delivers ' + num(A.ppfd, 0) + ' µmol of photons per square metre each second. To a person it looks ' + A.name + '; to the plant, phytochrome reads ' + (A.pss > 0.8 ? 'more red than open sky gives, so plants stay compact' : A.pss >= 0.65 ? 'open sky (unfiltered sunlight is about 0.7)' : A.pss >= 0.5 ? 'the shade of neighbours, so stems start to stretch' : 'deep shade under other leaves') + '.';
  }
  function update(st) {
    if (pushing || !st) return;
    var p = +st.ppfd;
    if (isFinite(p) && Math.abs(p - A.ppfd) > 1) {
      if (A.ppfd > 0) { var f = p / A.ppfd; CH.forEach(function (c) { mix[c.k] = Math.round((mix[c.k] || 0) * f * 10) / 10; }); }
      else mix.sun = p;
      preset = null; syncMix(false);
    }
  }

  var CSS =
    '#lv-sun .lx-theatre{min-height:250px}' +
    '#lv-sun .lx-ctrls{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;margin:10px 0 0}' +
    '#lv-sun .lx-pick{display:grid;gap:10px}' +
    '#lv-sun .lx-wide{border:1px solid var(--rule2);background:var(--card)}' +
    '#lv-sun .lx-rainbow{height:8px;border-radius:4px;margin:2px 10px 0;background:linear-gradient(90deg,#610061,#7900c4 6%,#3d00ff 13%,#0077ff 26%,#00ff8c 33%,#a3ff00 43%,#ffef00 50%,#ff8a00 58%,#ff0000 72%,#c00000 83%,#730000 100%)}' +
    '#lv-sun #pt-col .v{font-family:var(--ui);font-weight:600}' +
    '#lv-sun .lx-mixgrid{display:grid;grid-template-columns:minmax(0,1fr);gap:12px;margin-top:10px}' +
    '@media (min-width:900px){#lv-sun .lx-mixgrid{grid-template-columns:minmax(0,5fr) minmax(0,7fr);align-items:start}}' +
    '#lv-sun .lx-chs{grid-template-columns:repeat(auto-fit,minmax(170px,1fr));border:1px solid var(--rule);background:var(--card)}' +
    '#lv-sun .lx-dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px;vertical-align:0;border:1px solid var(--rule)}' +
    '#lv-sun .lx-chsub{text-transform:none;letter-spacing:0;color:var(--ink3);font-size:11px}' +
    '#lv-sun .lx-meter{position:relative;height:6px;background:var(--rule2);border-radius:3px;margin-top:6px}' +
    '#lv-sun .lx-meter i{display:block;height:100%;background:var(--accent);border-radius:3px;transition:width .3s var(--ease)}' +
    '#lv-sun .lx-meter b{position:absolute;top:-3px;width:2px;height:12px;background:var(--ink)}' +
    '#lv-sun .lx-warn .lx-meter i{background:var(--warm)}#lv-sun .lx-warn .v{color:var(--warm)}' +
    '#lv-sun .lx-pssm{background:linear-gradient(90deg,#7a1020,#c7a0a6 50%,#d8312a)}#lv-sun .lx-pssm i{background:transparent;border-right:3px solid var(--ink);border-radius:0}' +
    '#lv-sun .lx-ghrow{display:grid;grid-template-columns:minmax(0,1fr);gap:14px}' +
    '@media (min-width:760px){#lv-sun .lx-ghrow{grid-template-columns:minmax(0,3fr) minmax(0,2fr);align-items:start}}' +
    '#lv-sun .lx-ghsvg{display:block;width:100%;height:auto}' +
    '#lv-sun #sun-ghsvg .gh-wrap{position:relative}#lv-sun #sun-ghsvg .gh-cv{position:absolute;inset:0;pointer-events:none}#lv-sun #sun-ghsvg .gh-cv canvas{display:block}' +
    '#lv-sun .gh-stars{fill:#dfe6f2;transition:opacity .4s}#lv-sun .gh-hill{fill:#141b24}#lv-sun .gh-ground{fill:#0e131a}' +
    '#lv-sun .gh-frame{fill:none;stroke:#0b0f14;stroke-width:1.6}#lv-sun .gh-glass{transition:fill .4s,opacity .4s}#lv-sun #gh-halo{transition:opacity .4s}' +
    '#lv-sun .gh-lab{fill:#e8e2d6;font-family:var(--ui);font-size:12px}' +
    '#lv-sun .lx-swatch{height:72px;border-radius:8px;border:1px solid var(--rule);box-shadow:inset 0 0 18px rgba(0,0,0,.18),0 0 24px -6px currentColor}' +
    '#lv-sun .lx-swname{font-family:var(--ui);font-weight:600;margin:6px 0 4px}' +
    '#lv-sun .lx-ghtxt{font-size:16px;margin:0 0 8px}' +
    '#lv-sun .lx-specsvg{display:block;width:100%;height:auto}' +
    ':root[data-theme="dark"] #lv-sun .sp-par{opacity:.12}#lv-sun .sp-par{fill:var(--w5);opacity:.45}#lv-sun .sp-epar{fill:var(--warm);opacity:.12}' +
    '#lv-sun .sp-line{fill:none;stroke:var(--ink);stroke-width:1.2}#lv-sun .sp-eye{fill:none;stroke:var(--ink2);stroke-width:1.3;stroke-dasharray:2 4}' +
    '#lv-sun .sp-eyel{fill:var(--ink2);font-family:var(--ui);font-size:11px}' +
    '#lv-sun .sp-pr{fill:none;stroke:#b5302a;stroke-width:1.2;stroke-dasharray:6 3}#lv-sun .sp-pfr{fill:none;stroke:#6a1530;stroke-width:1.2;stroke-dasharray:6 3}' +
    ':root[data-theme="dark"] #lv-sun .sp-pfr{stroke:#e48aa5}' +
    '#lv-sun .sp-ax{stroke:var(--ink);stroke-width:1}#lv-sun .sp-grid{stroke:var(--rule2);stroke-width:1}' +
    '#lv-sun .sp-tk,#lv-sun .sp-lab{fill:var(--ink2);font-family:var(--mono);font-size:11px}#lv-sun .sp-lab{font-family:var(--ui);letter-spacing:.08em}' +
    '#lv-sun .lx-presets{margin:4px 0 0}';

  /* L1 r5: Show me, about 40 s, for presentation (designer panel 14) */
  LP.showme = LP.showme || {};
  LP.showme.sun = [
    { at: '#sun-th', click: '#sun-mode [data-v="both"]', say: 'Light leaves the Sun and arrives 8 minutes 19 seconds later. The ring follows one photon.', wait: 7000 },
    { at: '#sun-th', click: '#sun-mode [data-v="particle"]', say: 'As particles: each dot is one photon, absorbed whole by one pigment molecule.', wait: 6000 },
    { at: '#sun-mix', click: '#sun-pre [data-p="magenta"]', say: 'Grower’s magenta: the same photon count for the plant, but it looks dim to us.', wait: 7000 },
    { at: '#sun-gh', click: '#sun-baysrc [data-v="magenta"]', say: 'At night the greenhouse glows magenta. Red and blue are the cheapest photons per joule.', wait: 7000 },
    { at: '#sun-mix', click: '#sun-pre [data-p="jin"]', say: 'Add far red: the PAR sensor does not see it, but phytochrome does. PSS falls and lettuce spreads its leaves.', wait: 7500 },
    { at: '#sun-th', click: '#sun-pre [data-p="sun"]', say: 'Back to the midday sun. Your turn: build a recipe and watch the plates answer.', wait: 4500 }
  ];
  LP.panels.push({ id: 'sun', mount: mount, update: update, show: function () { if (TH.anim) TH.anim.kick(); }, hide: function () {} });
})();

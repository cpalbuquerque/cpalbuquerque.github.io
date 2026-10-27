/* Light to Sugar: leaf light and carbon engine (L2 owner). window.LP (never overwritten; other files attach to it).

   One leaf, one state, one solve. Every plate reads the same result, so a slider on one plate moves all of them.

   STATE (LP.state; change it only through LP.set(patch))
     ppfd       photons 400 to 700 nm reaching the leaf, µmol m−2 s−1
     spectrum   photon fractions of 400 to 750 nm in four bands {blue 400 to 500, green 500 to 600, red 600 to 700,
                farred 700 to 750}; they sum to 1. Default = the sunlike spectrum of Plate I.
     mix        optional: the Plate I channel mix ({sun, white, blue, green, red, farred} in µmol m−2 s−1). If present and
                LP.optics is loaded, PSS is computed from it exactly; a patch that sets spectrum without mix clears it.
     T          leaf temperature, °C          Ca   CO2 in the air, ppm (µmol mol−1)       O2   O2 in the air, %
     leaf       'sun' | 'shade'               crop label (no parameters change with it; no crop values were retrieved)
     dcmu       true blocks QA to QB          uncoupler  true collapses the proton motive force
     stomata    'ratio' (Ci = ciRatio × Ca, default 0.7) | 'fixed' (gs given, Ci solved from supply = demand)
     gs         stomatal conductance to water, mol m−2 s−1 (used when stomata = 'fixed')
     vpd        leaf to air vapour pressure deficit, kPa (for transpiration and water use efficiency)
     Vcmax25, Jmax25  optional overrides, µmol m−2 s−1 at 25 °C (Expert sliders)

   RESULT (LP.result = LP.solve(state); pure function, no side effects)
     photons {par, farred, absorbedPAR, absorbedFR}, ypf, pss, absorbed (µmol m−2 s−1 absorbed photons, PAR + FR),
     balance {psii, psi, ratio, emerson}, phiPSII, etr (Genty estimate), J (light limited capacity), Jused (actual linear flow),
     Jmax, Vcmax, Rd, Kc, Ko, Gstar, Ac, Aj, A, Agross, limit 'Rubisco'|'RuBP regeneration'|'dark'|'blocked',
     vc, vo, phi (vo/vc), photorespiration (CO2 released, µmol m−2 s−1), Ci, gs, E (mmol m−2 s−1), wue (µmol mol−1),
     cyclic (cyclic electron flow), hPlus (H+ into lumen), atpRate, nadphRate, atpDemand, nadphDemand, atpPerNadph,
     pmf (mV), dpH, lumenPH, stromaPH, rotorTurns (µmol turns m−2 s−1), rotorHz (per synthase), calvinTurns,
     o2Rate, waterSplit, fluor (relative), npq (share of PSII excitation dissipated as heat), alpha (quantum yield), warnings[]

   MODEL (Expert tier shows all of this; badges in LP.PARAMS)
     FvCB: A = min(Ac, Aj) − Rd. Ac = Vcmax (C − Γ*) / (C + Kc (1 + O/Ko)); Aj = J (C − Γ*) / (4 C + 8 Γ*) (NADPH basis,
       Farquhar et al. 1980). C = Ci = Cc: no mesophyll conductance in this model (stated on the page).
     Temperature: Kc, Ko, Γ*, Vcmax, Rd from Bernacchi et al. 2001, k = exp(c − ΔHa / (R Tk)) (constants UNVERIFIED,
       self consistent). Vcmax and Jmax get a high temperature decline (peaked Arrhenius) that is ILLUSTRATIVE.
     J: non rectangular hyperbola θ J² − (I2 + Jmax) J + I2 Jmax = 0, θ = 0.8 (ILLUSTRATIVE).
       I2 = min(ΦPSII,max E_PSII, ΦPSI E_PSI / (1 + c)): an electron in linear flow needs one photon at PSII and one at PSI.
       ΦPSII,max = 0.80 (Fv/Fm of blue grown cucumber, Hogewoning et al. 2010), ΦPSI = 0.95 (ILLUSTRATIVE). r5: the PSII
       share s of absorbed PAR acclimates so both photosystems keep up (Hogewoning et al. 2012), clamped 0.40 to 0.55
       (ILLUSTRATIVE); far red excites PSI only. θ = 0.8. state.hPerATP switches 14/3 and 4.0 (Turina et al. 2016);
       state.ciFixed imposes Ci (A/Ci curves); in 'ratio' mode gs never falls below the 0.02 floor. PSI must also run the cyclic flow that tops up ATP, so with PAR
       alone PSI is the bottleneck. Far red adds electrons only when PAR is there, and the gain stops once PSI has
       enough light for linear plus cyclic flow: an Emerson enhancement with a built in ceiling (ILLUSTRATIVE).
     Spectral quality: PAR photons weighted red 1.0, green 0.9, blue 0.8 (Kusuma et al. 2020 ranking), normalised to the
       sunlike spectrum so sunlight = 1. Leaf absorptance 0.84 for PAR, 0.30 for far red (ILLUSTRATIVE).
     Electron budget: 3 H+ per linear electron (water + Q cycle), 14 c subunits so 14/3 = 4.67 H+ per ATP, 2 e− per NADPH.
       ATP demand 3 + 3.5 φ and NADPH demand 2 + 2 φ per carboxylation (φ = vo/vc). Cyclic flow (2 H+ per electron)
       fills the ATP gap.
     pmf, lumen pH: ILLUSTRATIVE saturating function of proton flux; lumen pH kept within 5.7 to 7.5, the in vivo range
       measured by Takizawa et al. 2007 (VERIFIED, key lumen_ph).
     qE: PsbS protonation (pKa 6.8, Hill 1) × zeaxanthin (pKa 6.8, Hill 4), both from Takizawa et al. 2007 (key
       psbs_zea_pka); multiplying the two is a teaching form (ILLUSTRATIVE).
     Uncoupler: in the first seconds electrons race (up to 1.6 × Jmax, as in isolated thylakoids given an acceptor);
       then, with no ATP, the Calvin Benson cycle stops, NADP+ runs out and linear flow falls to what O2 and other
       sinks accept (15 % of the coupled flow, ILLUSTRATIVE). res.Jtransient is the first value, res.Jused the second.
   Runs in the browser (window.LP) and in node (module.exports) for light/test_engine_light.js. */
(function (G) {
  'use strict';
  var LP = G.LP = G.LP || {};

  /* ------------------------------------------------------------------ constants */
  var R = 8.314;                     /* J mol−1 K−1 */
  var P_ATM = 101.325;               /* kPa */
  var H_PER_E_LINEAR = 3;            /* 1 from water + 2 via the Q cycle (UNVERIFIED key protons_per_electron) */
  var H_PER_E_CYCLIC = 2;            /* Q cycle only on the PGR5 route; NDH would pump 2 more (Strand et al. 2017) */
  var C_RING = 14;                   /* chloroplast c ring (Seelert et al. 2000) */
  var H_PER_ATP = C_RING / 3;        /* 4.67 */
  var ATP_PER_TURN = 3;              /* three catalytic beta sites per full turn */

  var P = LP.P = {
    absPAR: 0.84,                    /* leaf absorptance for PAR, as in the Genty ETR equation */
    absFR: 0.30,                     /* leaf absorptance for 700 to 750 nm, ILLUSTRATIVE */
    psiiShare: 0.50,                 /* the 0.5 of the Genty ETR equation; the model leaf uses the acclimated split instead */
    phi2max: 0.80,                   /* Fv/Fm, Hogewoning et al. 2010 */
    phi1: 0.95,                      /* PSI photochemical yield when its acceptors are free, ILLUSTRATIVE (close to 1) */
    splitMin: 0.40, splitMax: 0.55,  /* bounds of the acclimated PSII share, ILLUSTRATIVE */
    theta: 0.8,                      /* curvature of J vs light, ILLUSTRATIVE */
    wBlue: 0.8, wGreen: 0.9, wRed: 1.0,   /* relative quantum yield per incident photon, Kusuma 2020 ranking */
    sun: { blue: 0.239, green: 0.297, red: 0.313, farred: 0.151 },
    Vcmax25: { sun: 60, shade: 30 }, /* ILLUSTRATIVE */
    JmaxRatio: 1.7, RdRatio: 0.015,  /* ILLUSTRATIVE */
    /* Bernacchi et al. 2001 (UNVERIFIED): c, ΔHa (kJ mol−1) */
    bern: { Kc: [38.05, 79.43], Ko: [20.30, 36.38], Gstar: [19.02, 37.83], Vcmax: [26.35, 65.33], Rd: [18.72, 46.39] },
    /* high temperature decline, ILLUSTRATIVE: Hd (J mol−1), ΔS (J mol−1 K−1) */
    VcmaxHd: 200000, VcmaxS: 635,
    JmaxHa: 50000, JmaxHd: 200000, JmaxS: 650,
    ciRatio: 0.7,                    /* Ci/Ca for a well watered C3 leaf, ILLUSTRATIVE */
    synthasePerArea: 0.5,            /* µmol ATP synthase m−2 leaf, ILLUSTRATIVE (about 1 per 800 chlorophylls) */
    pmfMax: 200, pmfK: 150,          /* mV; µmol H+ m−2 s−1 at half of pmfMax, ILLUSTRATIVE */
    dpHshare: 0.6,                   /* share of pmf held as ΔpH, ILLUSTRATIVE */
    stromaPHlight: 7.9, stromaPHdark: 7.2,
    lumenMin: 5.7, lumenMax: 7.5,    /* Takizawa et al. 2007 in vivo range (VERIFIED) */
    qEpKa: 6.8, qEnPsbS: 1, qEnZea: 4, /* Takizawa et al. 2007 (VERIFIED); product form ILLUSTRATIVE */
    uncSink: 0.15,                   /* share of the coupled linear flow O2 and other sinks take once NADP+ is gone, ILLUSTRATIVE */
    O2ref: 20.95                     /* % O2 at which Bernacchi Γ* applies */
  };
  var SUNQ = (P.sun.blue * P.wBlue + P.sun.green * P.wGreen + P.sun.red * P.wRed) / (P.sun.blue + P.sun.green + P.sun.red);

  /* ------------------------------------------------------------------ helpers */
  function fin(x, d) { return (typeof x === 'number' && isFinite(x)) ? x : d; }
  function clamp(x, a, b) { return x < a ? a : (x > b ? b : x); }
  function arr(c, Ha, Tk) { return Math.exp(c - Ha * 1000 / (R * Tk)); }
  function peaked(Tk, Ha, Hd, S) {
    var T25 = 298.15;
    var f = Math.exp(Ha * (Tk - T25) / (R * T25 * Tk));
    return f * (1 + Math.exp((S * T25 - Hd) / (R * T25))) / (1 + Math.exp((S * Tk - Hd) / (R * Tk)));
  }
  function decline(Tk, Hd, S) {
    var T25 = 298.15;
    return (1 + Math.exp((S * T25 - Hd) / (R * T25))) / (1 + Math.exp((S * Tk - Hd) / (R * Tk)));
  }
  /* smaller root of θx² − (a + b)x + ab = 0, the non rectangular hyperbola */
  function nrh(a, b, theta) {
    if (a <= 0 || b <= 0) return 0;
    var s = a + b, d = s * s - 4 * theta * a * b;
    return (s - Math.sqrt(Math.max(0, d))) / (2 * theta);
  }
  function normSpectrum(s) {
    s = s || {};
    var o = { blue: Math.max(0, fin(+s.blue, 0)), green: Math.max(0, fin(+s.green, 0)), red: Math.max(0, fin(+s.red, 0)), farred: Math.max(0, fin(+s.farred, 0)) };
    var t = o.blue + o.green + o.red + o.farred;
    if (!(t > 0)) return { blue: P.sun.blue, green: P.sun.green, red: P.sun.red, farred: P.sun.farred };
    o.blue /= t; o.green /= t; o.red /= t; o.farred /= t;
    return o;
  }
  /* cyclic electrons per linear electron so that ATP/NADPH supply equals demand (3 + 3.5φ) ÷ (2 + 2φ) */
  function cyclicPerLinear(phi, h) {
    h = (h > 0) ? h : H_PER_ATP;
    var r = (3 + 3.5 * phi) / (2 + 2 * phi);
    var atpLin = H_PER_E_LINEAR / h;                               /* 0.643 ATP per linear electron at 14/3 */
    return Math.max(0, (0.5 * r - atpLin) * h / H_PER_E_CYCLIC);
  }
  /* acclimated excitation split: the share of absorbed PAR that goes to PSII is the one that lets PSII and PSI run the
     same linear flow while PSI also powers cyclic flow (state transitions and antenna size, Hogewoning et al. 2012).
     phi2 s ePAR (1 + c) = phi1 ((1 − s) ePAR + aFR). Clamped to 0.40 to 0.55 (ILLUSTRATIVE; 0.55 puts the far red ceiling near a third of the photons): the clamp is what gives
     the Emerson enhancement its ceiling and lets PSI run short under PAR that is poor in far red. */
  function psiiSplit(eP, aFR, c) {
    if (!(eP > 0)) return P.psiiShare;
    return clamp(P.phi1 * (eP + aFR) / (eP * (P.phi2max * (1 + c) + P.phi1)), P.splitMin, P.splitMax);
  }
  function isSunlike(s) {
    return ['blue', 'green', 'red', 'farred'].every(function (k) { return Math.abs(s[k] - P.sun[k]) < 0.03; });
  }

  /* temperature dependent constants at leaf T (°C) and O2 (%) */
  function constants(T, O2) {
    var Tk = T + 273.15, b = P.bern;
    return {
      Kc: arr(b.Kc[0], b.Kc[1], Tk),                                   /* µmol mol−1 */
      Ko: arr(b.Ko[0], b.Ko[1], Tk),                                   /* mmol mol−1 */
      Gstar: arr(b.Gstar[0], b.Gstar[1], Tk) * (O2 / P.O2ref),         /* µmol mol−1, scaled with O2 */
      fV: arr(b.Vcmax[0], b.Vcmax[1], Tk) * decline(Tk, P.VcmaxHd, P.VcmaxS),
      fJ: peaked(Tk, P.JmaxHa, P.JmaxHd, P.JmaxS),
      fR: arr(b.Rd[0], b.Rd[1], Tk)
    };
  }

  /* PSS from the Plate I two pigment model when it is loaded; otherwise an anchored band estimate (ILLUSTRATIVE) */
  var PSS_BAND = { blue: [0.52, 0.48], green: [0.30, 0.10], red: [1.0, 0.124], farred: [0.25, 1.0] };
  function pssOf(st, s) {
    var O = LP.optics;
    if (O && typeof O.analyse === 'function') {
      try {
        var m = st.mix;
        if (!m) {
          if (isSunlike(s)) m = { sun: Math.max(1, st.ppfd) };
          else {
            var par = s.blue + s.green + s.red, ep = par > 0 ? Math.max(1, st.ppfd) / par : 1;
            m = { blue: ep * s.blue, green: ep * s.green, red: ep * s.red, farred: ep * s.farred };
          }
        }
        var a = O.analyse(m);
        if (a && a.pss != null && isFinite(a.pss)) return a.pss;
      } catch (e) { /* fall through */ }
    }
    var nr = 0, nf = 0;
    Object.keys(PSS_BAND).forEach(function (k) { nr += s[k] * PSS_BAND[k][0]; nf += s[k] * PSS_BAND[k][1]; });
    return (nr + nf) > 0 ? nr / (nr + nf) : null;
  }

  /* ------------------------------------------------------------------ the solve */
  function solve(st0) {
    var st = st0 || LP.state || {};
    var warn = [];
    var ppfd = Math.max(0, fin(+st.ppfd, 0));
    var s = normSpectrum(st.spectrum);
    var T = clamp(fin(+st.T, 25), -10, 60);
    var Ca = Math.max(0, fin(+st.Ca, 420));
    var O2 = clamp(fin(+st.O2, 21), 0, 100);
    var leaf = st.leaf === 'shade' ? 'shade' : 'sun';
    var dcmu = !!st.dcmu, unc = !!st.uncoupler;
    /* Expert switches on Plate III: cyclicScale multiplies the cyclic flow the cycle needs (1 = automatic balance,
       0 = a pgr5 like leaf with almost no cyclic flow, 2 = twice what is needed); npqScale multiplies qE
       (0 = an npq4 like leaf without PsbS, 1 = normal, 1.5 = more PsbS). Both ILLUSTRATIVE sizes. */
    var fCyc = (st.cyclicScale == null || !isFinite(+st.cyclicScale)) ? 1 : clamp(+st.cyclicScale, 0, 3);
    var cycSet = fCyc !== 1;
    var fNPQ = (st.npqScale == null || !isFinite(+st.npqScale)) ? 1 : clamp(+st.npqScale, 0, 2);

    /* photons */
    var parFrac = s.blue + s.green + s.red;
    var fr = parFrac > 0 ? ppfd * s.farred / parFrac : 0;        /* far red photons, µmol m−2 s−1 */
    if (!(parFrac > 0) && st.ppfd > 0) { fr = Math.max(0, fin(+st.ppfd, 0)); ppfd = 0; }
    var q = parFrac > 0 ? (s.blue * P.wBlue + s.green * P.wGreen + s.red * P.wRed) / parFrac / SUNQ : 1;
    var absPAR = ppfd * P.absPAR, absFR = fr * P.absFR;
    var effPAR = absPAR * q;
    var hATP = (+st.hPerATP > 0) ? clamp(+st.hPerATP, 3, 6) : H_PER_ATP;   /* Expert: 14/3 structural or 4.0 thermodynamic */
    var frShare = (ppfd + fr) > 0 ? fr / (ppfd + fr) : 0;
    var ypf = ppfd * q * SUNQ;                                       /* yield photon flux, red = 1 basis */

    /* leaf capacity */
    var K = constants(T, O2);
    var V25 = fin(+st.Vcmax25, 0) > 0 ? +st.Vcmax25 : P.Vcmax25[leaf];
    var J25 = fin(+st.Jmax25, 0) > 0 ? +st.Jmax25 : P.JmaxRatio * V25;
    var Vcmax = V25 * K.fV, Jmax = J25 * K.fJ, Rd = P.RdRatio * V25 * K.fR;
    var Gs = K.Gstar, Kc = K.Kc, Ko = K.Ko, O = O2 * 10;             /* O in mmol mol−1 */
    var Km = Kc * (1 + O / Ko);

    /* cyclic electrons needed per linear electron to make up the ATP the Calvin Benson cycle and photorespiration want.
       Depends only on Ci (through φ = 2 Γ* ÷ Ci), so it is known before J. Both flows use PSI photons. */
    var Cguess = Ca * (st.stomata === 'fixed' ? 0.6 : clamp(fin(+st.ciRatio, P.ciRatio), 0.05, 1));
    if (+st.ciFixed > 0) Cguess = +st.ciFixed;
    var cPer = cyclicPerLinear(Cguess > 0 ? 2 * Gs / Cguess : 0, hATP);
    var split = psiiSplit(effPAR, absFR, Math.max(1, fCyc) * cPer);
    var E2 = split * effPAR, E1 = (1 - split) * effPAR + absFR;
    /* forcing extra cyclic flow steals PSI photons from linear flow; forcing less does not free them, because the extra
       NADPH would have nowhere to go (the acceptor side of PSI is already full) */
    var I2 = Math.min(P.phi2max * E2, P.phi1 * E1 / (1 + Math.max(1, fCyc) * cPer));   /* linear electrons per m2 s if nothing else limits */
    var J = dcmu ? 0 : nrh(I2, Jmax, P.theta);
    var Jtransient = J;
    if (unc && !dcmu) {
      /* first seconds: photosynthetic control released, electrons race (ILLUSTRATIVE 1.6 × Jmax);
         steady state: no ATP, no Calvin Benson cycle, NADP+ used up, so only O2 and minor sinks take electrons */
      Jtransient = nrh(Math.min(P.phi2max * E2, P.phi1 * E1), 1.6 * Jmax, P.theta);
      J = P.uncSink * J;
    }

    function rates(C) {
      C = Math.max(0, C);
      var Wc = Vcmax * C / (C + Km);
      var Wj = J * C / (4 * C + 8 * Gs);
      if (unc) Wj = 0;                                               /* no ATP: the cycle stops */
      var Wa = Infinity;                                              /* ATP limited carboxylation when cyclic flow is forced */
      if (cycSet && !unc && C > 0) { var pC = 2 * Gs / C; Wa = J * (H_PER_E_LINEAR + H_PER_E_CYCLIC * fCyc * cyclicPerLinear(pC, hATP)) / (hATP * (3 + 3.5 * pC)); }
      var W = Math.min(Wc, Wj, Wa);
      var Ag = C > 0 ? W * (1 - Gs / C) : -Infinity;
      return { Wc: Wc, Wj: Wj, Wa: Wa, W: W, Ac: (C > 0 ? Wc * (1 - Gs / C) : 0) - Rd, Aj: (C > 0 ? Wj * (1 - Gs / C) : 0) - Rd, A: (C > 0 ? Ag : 0) - Rd };
    }

    /* stomata */
    var mode = (+st.ciFixed > 0) ? 'ciFixed' : (st.stomata === 'fixed' ? 'fixed' : 'ratio');
    /* supply = demand at a given conductance: supply gc (Ca − Ci) minus demand A(Ci) falls as Ci rises, so bisect */
    function ciAtGs(g, hiMul) { var gcx = g / 1.6, a = 0, b = Math.max(Ca, 1) * hiMul; for (var k = 0; k < 60; k++) { var m = 0.5 * (a + b); if (gcx * (Ca - m) - rates(m).A > 0) a = m; else b = m; } return 0.5 * (a + b); }
    var GS_FLOOR = 0.02;                                             /* night floor, mol m−2 s−1, ILLUSTRATIVE */
    var vpd = clamp(fin(+st.vpd, 1.5), 0, 8);
    var Ci, gs, r;
    if (mode === 'ciFixed') {
      /* A versus Ci: Ci imposed directly (as a gas exchange system does by changing the reference CO2) */
      Ci = +st.ciFixed; r = rates(Ci);
      gs = (r.A > 0 && Ca > Ci) ? Math.max(GS_FLOOR, 1.6 * r.A / (Ca - Ci)) : GS_FLOOR;
    } else if (mode === 'ratio') {
      Ci = Ca * clamp(fin(+st.ciRatio, P.ciRatio), 0.05, 1);
      r = rates(Ci);
      gs = r.A > 0 && Ca > Ci ? 1.6 * r.A / (Ca - Ci) : 0;          /* mol H2O m−2 s−1 */
      if (!(gs >= GS_FLOOR)) {
        /* weak light, dark or blocked: stomata cannot close below their floor, so CO2 inside rises toward (and in the
           dark above) Ca; Ci comes from supply = demand at the floor. Continuous with the ratio rule where they meet. */
        gs = GS_FLOOR; Ci = ciAtGs(gs, 3); r = rates(Ci);
      }
    } else {
      gs = Math.max(0, fin(+st.gs, 0.3));
      Ci = ciAtGs(gs, 1.5);
      if (gs <= 0) Ci = Math.max(Ci, 0);
      r = rates(Ci);
    }
    var A = r.A;
    var lim = unc ? 'blocked' : (dcmu || ppfd + fr <= 0 ? (dcmu ? 'blocked' : 'dark') : (r.Wa < Math.min(r.Wc, r.Wj) - 1e-9 ? 'ATP' : (r.Wc <= r.Wj ? 'Rubisco' : 'RuBP regeneration')));
    var vc = Ci > 0 ? r.W : 0;
    var phi = Ci > 0 ? 2 * Gs / Ci : 0;
    if (!isFinite(phi)) phi = 0;
    var vo = phi * vc;
    var photoresp = 0.5 * vo;
    var Agross = vc - photoresp;

    /* electron and proton budget */
    var nadphDemand = vc * (2 + 2 * phi), atpDemand = vc * (3 + 3.5 * phi);
    var cNow = cyclicPerLinear(phi, hATP);
    var Jused = dcmu ? 0 : (unc ? J : Math.min(J, cycSet ? Math.max(2 * nadphDemand, atpDemand * hATP / (H_PER_E_LINEAR + H_PER_E_CYCLIC * fCyc * cNow)) : 2 * nadphDemand));
    var nadphRate = unc ? 0 : Jused / 2;                             /* uncoupled: electrons go to O2, NADP+ is all reduced */
    var hLin = H_PER_E_LINEAR * Jused;
    var atpFromLinear = hLin / hATP;
    var cyclic = 0;
    var psiSpare = Math.max(0, P.phi1 * E1 - Jused);             /* PSI excitations not used by linear flow */
    if (!unc && !dcmu && cycSet) {
      cyclic = Math.min(fCyc * cNow * Jused, psiSpare);
    } else if (!unc && !dcmu) {
      var gap = Math.max(0, atpDemand - atpFromLinear);
      cyclic = Math.min(gap * hATP / H_PER_E_CYCLIC, psiSpare);
    } else if (dcmu && !unc) {
      cyclic = 0.05 * psiSpare;                                     /* ILLUSTRATIVE: a little cyclic flow survives DCMU */
    }
    var hPlus = hLin + H_PER_E_CYCLIC * cyclic;
    var atpRate = unc ? 0 : (cycSet ? Math.min(hPlus / hATP, atpDemand + (dcmu ? hPlus / hATP : 0)) : hPlus / hATP);
    var protonSurplus = unc ? 0 : Math.max(0, hPlus - atpRate * hATP);   /* protons the synthase cannot use: they back up */
    /* excess light (light the Calvin Benson cycle cannot use) backs protons up in the lumen: photosynthetic control */
    var excess = I2 > 0 ? clamp(1 - Jused / I2, 0, 1) : 0;
    var pmf = unc ? 0 : Math.min(250, P.pmfMax * hPlus / (hPlus + P.pmfK) + 40 * excess * (hPlus > 0 ? 1 : 0) + (hPlus > 0 ? 40 * protonSurplus / hPlus : 0));
    var mVperPH = 2.303 * R * (T + 273.15) / 96485 * 1000;           /* about 59 mV per pH unit at 25 °C */
    var dpH = pmf * P.dpHshare / mVperPH;
    /* the stroma alkalises only as far as protons are actually pumped and held (Q-science R8): no gradient, no alkalisation,
       and with pmf 0 the lumen equals the stroma. Full light value from about 60 mV of pmf (ILLUSTRATIVE ramp). */
    var stromaPH = P.stromaPHdark + (P.stromaPHlight - P.stromaPHdark) * clamp(pmf / 60, 0, 1);
    var lumenPH = pmf > 0 ? clamp(stromaPH - dpH, P.lumenMin, Math.min(P.lumenMax, stromaPH)) : stromaPH;
    var rotorTurns = atpRate / ATP_PER_TURN;
    var rotorHz = rotorTurns / P.synthasePerArea;
    var calvinTurns = Math.max(0, A) / 3;                            /* net G3P exported per m2 per s (3 CO2 each) */

    /* PSII photon fate (shares of PSII excitations; ILLUSTRATIVE split of what photochemistry does not use).
       qE needs an acid lumen: PsbS protonation × zeaxanthin, both centred on pKa 6.8 (Takizawa et al. 2007), so an
       uncoupler or DCMU leaves the leaf unable to dump excess light as heat and fluorescence rises. */
    var phiPSII = E2 > 0 ? clamp(Jused / E2, 0, P.phi2max) : 0;
    var qEon = (hPlus > 0 && !unc) ? (1 / (1 + Math.pow(10, P.qEnPsbS * (lumenPH - P.qEpKa)))) * (1 / (1 + Math.pow(10, P.qEnZea * (lumenPH - P.qEpKa)))) : 0;
    var rest = 1 - phiPSII;
    var npq = E2 > 0 ? Math.min(rest * 0.95, rest * 0.85 * qEon * fNPQ) : 0;
    var fluor = E2 > 0 ? Math.min(rest - npq, 0.02 + 0.1 * (rest - npq)) : 0;
    var heat = E2 > 0 ? Math.max(0, 1 - phiPSII - npq - fluor) : 0;
    var etr = ppfd * phiPSII * P.absPAR * 0.5;                       /* the usual PAM estimate (ΦPSII from Genty et al. 1989; 0.84 and 0.5 are conventions) */

    /* quantum yield at this state (absorbed PAR basis), the low light slope of A */
    var I2c = Math.min(P.phi2max * E2, P.phi1 * E1 / (1 + cPer));
    var alpha = (absPAR > 0 && !dcmu && !unc && Ci > Gs) ? (I2c / absPAR) * (Ci - Gs) / (4 * Ci + 8 * Gs) : 0;
    /* Emerson enhancement: linear drive with this far red over the same PAR without it */
    var s0 = psiiSplit(effPAR, 0, cPer);
    var I2noFR = Math.min(P.phi2max * s0 * effPAR, P.phi1 * (1 - s0) * effPAR / (1 + cPer));
    var emerson = I2noFR > 0 ? I2c / I2noFR : 1;

    /* water */
    var E = gs * vpd / P_ATM * 1000;                                 /* mmol m−2 s−1 */
    var wue = E > 0 ? A / E : 0;                                      /* µmol CO2 per mmol H2O = mmol mol−1 */
    var iwue = gs > 0 ? A / gs : 0;                                   /* intrinsic WUE, µmol CO2 per mol H2O conductance */
    var nadphExcess = unc ? 0 : Math.max(0, Jused / 2 - nadphDemand);   /* uncoupled: the pool is simply full (nadphRate 0) */

    if (cycSet && fCyc < 1 && lim === 'ATP') warn.push('Too little cyclic flow: ATP runs short, NADPH piles up and the Calvin Benson cycle slows.');
    if (fNPQ < 0.5 && E2 > 0 && phiPSII < 0.4) warn.push('Little NPQ: excess excitation stays on PSII, the risk of photodamage rises.');
    if (dcmu) warn.push('DCMU blocks electrons at QB: no linear flow, no NADPH, no net carbon. In this model a little cyclic flow keeps running; in a leaf it fades as the chain oxidises.');
    if (unc) warn.push('Uncoupler: protons leak back, so the gradient and ATP vanish. Electrons race for a few seconds, then NADP+ runs out and flow falls to what O2 can take.');
    if (frShare > 0.3) warn.push('Far red is above 30 % of 400 to 750 nm photons, beyond the range tested by Zhen and Bugbee.');
    if (T > 40) warn.push('Above 40 °C the decline of Vcmax and Jmax in this model is illustrative.');
    if (T < 10) warn.push('Below 10 °C the temperature functions are extrapolated.');
    if (ppfd + fr <= 0) warn.push('Dark: the leaf only respires.');
    if (ppfd <= 0 && fr > 0) warn.push('Far red alone drives almost no linear flow: PSII is idle.');

    return {
      photons: { par: ppfd, farred: fr, absorbedPAR: absPAR, absorbedFR: absFR, frShare: frShare },
      spectrum: s, quality: q, ypf: ypf, pss: pssOf(st, s), absorbed: absPAR + absFR,
      balance: { psii: E2, psi: E1, ratio: E1 > 0 ? E2 / E1 : null, emerson: emerson, split: split },
      hPerATP: hATP, protonsPerTurn: hATP * ATP_PER_TURN, etrTrue: dcmu ? 0 : Jused,
      phiPSII: phiPSII, etr: etr, J: J, Jused: Jused, Jtransient: dcmu ? 0 : Jtransient, altSink: unc ? Jused : 0, I2: I2, Jmax: Jmax, Vcmax: Vcmax, Rd: Rd,
      Kc: Kc, Ko: Ko, Gstar: Gs, Km: Km,
      Ac: r.Ac, Aj: unc ? -Rd : r.Aj, A: A, Agross: Agross, limit: lim,
      vc: vc, vo: vo, phi: phi, photorespiration: photoresp,
      Ci: Ci, Ca: Ca, gs: gs, stomata: mode, vpd: vpd, E: E, wue: wue, iwue: iwue,
      Wc: r.Wc, Wj: r.Wj, Wa: isFinite(r.Wa) ? r.Wa : null, cyclicScale: fCyc, npqScale: fNPQ, nadphExcess: nadphExcess, protonSurplus: protonSurplus,
      pressure: E2 > 0 ? Math.max(0, 1 - phiPSII - npq) : 0,
      cyclic: cyclic, psiSpare: psiSpare, hPlus: hPlus, atpRate: atpRate, nadphRate: nadphRate,
      atpDemand: atpDemand, nadphDemand: nadphDemand, atpPerNadph: nadphDemand > 0 ? atpDemand / nadphDemand : null,
      atpFromLinear: atpFromLinear,
      pmf: pmf, dpH: dpH, lumenPH: lumenPH, stromaPH: stromaPH,
      rotorTurns: rotorTurns, rotorHz: rotorHz, calvinTurns: calvinTurns,
      o2Rate: Jused / 4, waterSplit: Jused / 2, excess: excess, cyclicPerLinear: cPer,
      fluor: fluor, npq: npq, heat: heat, qE: qEon, fate: { photochem: phiPSII, npq: npq, fluor: fluor, heat: heat }, alpha: alpha,
      T: T, O2: O2, leaf: leaf, dcmu: dcmu, uncoupler: unc,
      warnings: warn
    };
  }

  /* ------------------------------------------------------------------ state, set, on */
  var DEFAULTS = {
    ppfd: 1500, spectrum: { blue: P.sun.blue, green: P.sun.green, red: P.sun.red, farred: P.sun.farred },
    T: 25, Ca: 420, O2: 21, leaf: 'sun', dcmu: false, uncoupler: false, crop: 'lettuce',
    stomata: 'ratio', gs: 0.3, vpd: 1.5
  };
  function copyDefaults() { var o = JSON.parse(JSON.stringify(DEFAULTS)); return o; }
  LP.DEFAULTS = DEFAULTS;
  var prev = LP.state || {};
  LP.state = copyDefaults();
  Object.keys(prev).forEach(function (k) { LP.state[k] = prev[k]; });   /* keep anything a page set before us */
  var subs = (LP._subs = LP._subs || []);
  var batching = 0, dirty = false;

  function notify() {
    LP.result = solve(LP.state);
    subs.slice().forEach(function (fn) { try { fn(LP.state, LP.result); } catch (e) { if (G.console) console.error(e); } });
  }
  LP.solve = function (st) { return solve(st || LP.state); };
  LP.set = function (patch) {
    patch = patch || {};
    Object.keys(patch).forEach(function (k) {
      if (k === 'spectrum') LP.state.spectrum = normSpectrum(Object.assign({}, LP.state.spectrum, patch.spectrum));
      else LP.state[k] = patch[k];
    });
    if ('spectrum' in patch && !('mix' in patch)) delete LP.state.mix;
    if (batching) { dirty = true; return LP.result; }
    notify();
    return LP.result;
  };
  /* LP.batch(fn): several LP.set calls, one solve */
  LP.batch = function (fn) { batching++; try { fn(); } finally { batching--; if (!batching && dirty) { dirty = false; notify(); } } };
  LP.on = function (fn) { subs.push(fn); return function () { var i = subs.indexOf(fn); if (i >= 0) subs.splice(i, 1); }; };
  LP.reset = function () { var t = LP.state.tier; LP.state = copyDefaults(); if (t) LP.state.tier = t; notify(); };
  LP.result = solve(LP.state);
  LP.stub = false;
  /* plates loaded after us (l_sun.js exposes LP.optics for PSS): solve again once every script is in */
  if (typeof document !== 'undefined' && document.addEventListener) {
    var again = function () { LP.result = solve(LP.state); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', again); else setTimeout(again, 0);
  }

  /* ------------------------------------------------------------------ curves for plots (do not touch LP.state) */
  function withState(over) { var o = {}; Object.keys(LP.state).forEach(function (k) { o[k] = LP.state[k]; }); Object.keys(over || {}).forEach(function (k) { o[k] = over[k]; }); return o; }
  LP.curve = function (key, values, over) {
    return values.map(function (v) { var p = {}; p[key] = v; var o = withState(over); o[key] = v; return { x: v, r: solve(o) }; });
  };
  /* A versus Ci with the same leaf: Ci is imposed (Ca chosen so that Ci = x under ratio stomata) */
  LP.aci = function (cis, over) {
    return cis.map(function (c) { var o = withState(over); o.ciFixed = Math.max(1e-6, c); return { x: c, r: solve(o) }; });
  };
  /* Teaching fit of user A/Ci points (Ci basis, this plate's Kc, Ko, Γ*, Rd at leaf T): Vcmax from points below the
     transition, J from points above; the transition is chosen to minimise the squared error. pts = [{ci, a}] */
  LP.fitAci = function (pts, over) {
    var o = withState(over), K = constants(fin(+o.T, 25), fin(+o.O2, 21));
    var Km = K.Kc * (1 + fin(+o.O2, 21) * 10 / K.Ko), G = K.Gstar;
    var p = (pts || []).filter(function (d) { return isFinite(d.ci) && isFinite(d.a) && d.ci > G + 1; }).sort(function (a, b) { return a.ci - b.ci; });
    if (p.length < 3) return null;
    var fc = function (c) { return (c - G) / (c + Km); }, fj = function (c) { return (c - G) / (4 * c + 8 * G); };
    var best = null;
    for (var rd = 0; rd <= 3.0001; rd += 0.1) {
      for (var k = 1; k <= p.length; k++) {            /* first k points Rubisco limited, rest RuBP limited */
        var sxy = 0, sxx = 0, jxy = 0, jxx = 0;
        for (var i = 0; i < p.length; i++) { var y = p[i].a + rd; if (i < k) { var x = fc(p[i].ci); sxy += x * y; sxx += x * x; } else { var xj = fj(p[i].ci); jxy += xj * y; jxx += xj * xj; } }
        var V = sxx > 0 ? sxy / sxx : null, Jf = jxx > 0 ? jxy / jxx : null;
        if (!(V > 0)) continue;
        var sse = 0;
        for (var t = 0; t < p.length; t++) { var m = Math.min(V * fc(p[t].ci), Jf > 0 ? Jf * fj(p[t].ci) : Infinity) - rd; sse += (p[t].a - m) * (p[t].a - m); }
        if (!best || sse < best.sse) best = { Vcmax: V, J: Jf, Rd: rd, sse: sse, nRubisco: k, n: p.length };
      }
    }
    if (best) { best.rmse = Math.sqrt(best.sse / best.n); best.Km = Km; best.Gstar = G; }
    return best;
  };
  LP.range = function (a, b, n) { var o = []; for (var i = 0; i < n; i++) o.push(a + (b - a) * i / (n - 1)); return o; };
  LP.constants = constants;
  LP.cyclicPerLinear = cyclicPerLinear;
  LP.engine = { version: 'L2 r5, 12 Oct 2026', psiiSplit: psiiSplit, H_PER_E_LINEAR: H_PER_E_LINEAR, H_PER_E_CYCLIC: H_PER_E_CYCLIC, C_RING: C_RING, H_PER_ATP: H_PER_ATP, ATP_PER_TURN: ATP_PER_TURN, SUNQ: SUNQ, normSpectrum: normSpectrum };

  /* ------------------------------------------------------------------ parameter table for the Expert tier */
  LP.PARAMS = [
    { sym: 'Vcmax25', v: '60 sun, 30 shade', u: 'µmol m⁻² s⁻¹', badge: 'ILLUSTRATIVE', ev: 'vcmax_jmax_illustrative', what: 'Rubisco capacity at 25 °C' },
    { sym: 'Jmax25', v: '1.7 × Vcmax25', u: 'µmol m⁻² s⁻¹', badge: 'ILLUSTRATIVE', ev: 'vcmax_jmax_illustrative', what: 'electron transport capacity at 25 °C' },
    { sym: 'Rd25', v: '0.015 × Vcmax25', u: 'µmol m⁻² s⁻¹', badge: 'ILLUSTRATIVE', ev: 'vcmax_jmax_illustrative', what: 'respiration in the light' },
    { sym: 'Kc, Ko, Γ* at 25 °C', v: '404.9 µmol mol⁻¹, 278.4 mmol mol⁻¹, 42.75 µmol mol⁻¹', u: '', badge: 'UNVERIFIED', ev: 'bernacchi_25C', what: 'Rubisco kinetics in vivo, tobacco' },
    { sym: 'k(T)', v: 'exp(c − ΔHa / R T)', u: '', badge: 'UNVERIFIED', ev: 'bernacchi_25C', what: 'temperature functions for Kc, Ko, Γ*, Vcmax, Rd' },
    { sym: 'high T decline', v: 'Hd 200 kJ mol⁻¹; ΔS 0.635 (Vcmax), 0.650 (Jmax) kJ mol⁻¹ K⁻¹', u: '', badge: 'ILLUSTRATIVE', ev: 'eng.hiT', what: 'loss of capacity above about 35 °C' },
    { sym: 'θ', v: '0.8', u: '', badge: 'ILLUSTRATIVE', ev: 'eng.theta', what: 'curvature of J versus absorbed light' },
    { sym: 'ΦPSII,max', v: '0.80', u: '', badge: 'VERIFIED', ev: 'blue_dose_quantum_yield', what: 'Fv/Fm, the most a PSII photon can yield' },
    { sym: 'absorptance', v: '0.84 PAR, 0.30 far red', u: '', badge: 'ILLUSTRATIVE', ev: 'eng.abs', what: '0.84 is the Genty assumption; far red value chosen' },
    { sym: 'PSII share of absorbed PAR, s', v: 'acclimated, 0.40 to 0.55; far red to PSI only; ΦPSI 0.95', u: '', badge: 'ILLUSTRATIVE', ev: 'eng.balance', what: 'both photosystems keep up; far red lets PSII take more' },
    { sym: 'H⁺ per ATP, switch', v: '14/3 (structure) or 4.0 (thermodynamics)', u: '', badge: 'VERIFIED', ev: 'thy.turina', what: 'Expert toggle on Plate III' },
    { sym: 'spectral weights', v: 'red 1.0, green 0.9, blue 0.8', u: '', badge: 'VERIFIED', ev: 'mccree_red_green_blue', what: 'relative quantum yield per incident photon (ranking)' },
    { sym: 'Aj basis', v: 'J (C − Γ*) / (4 C + 8 Γ*)', u: '', badge: 'VERIFIED', ev: 'fvcb_model', what: 'NADPH limited form; 4.5 and 10.5 on an ATP basis' },
    { sym: 'Ci = Cc', v: 'no mesophyll conductance', u: '', badge: 'ILLUSTRATIVE', ev: 'eng.gm', what: 'Cc is lower than Ci in real leaves' },
    { sym: 'Ci / Ca', v: '0.7', u: '', badge: 'ILLUSTRATIVE', ev: 'eng.ci', what: 'a well watered C3 leaf' },
    { sym: 'H⁺ per e⁻', v: '3 linear, 2 cyclic', u: '', badge: 'VERIFIED', ev: 'thy.sacksteder', what: '3 per linear e⁻ in steady state (Sacksteder et al. 2000); 2 per cyclic e⁻ on the PGR5 route' },
    { sym: 'H⁺ per ATP', v: '14 / 3 = 4.67', u: '', badge: 'VERIFIED', ev: 'thy.turina', what: 'c14 ring, three ATP per turn (structural ratio)' },
    { sym: 'ATP synthase density', v: '0.5', u: 'µmol m⁻²', badge: 'ILLUSTRATIVE', ev: 'eng.synthase', what: 'sets the rotor speed per enzyme' },
    { sym: 'pmf', v: 'pmf = 200 H / (H + 150) mV; 60 % as ΔpH', u: '', badge: 'ILLUSTRATIVE', ev: 'eng.pmf', what: 'a shape, not a measurement; 60 % sits inside the measured 30 to 90 % ΔpH share' },
    { sym: 'lumen pH range', v: 'about 7.5 (weak light) to about 5.7 (low CO2, strong light), ± 0.5', u: '', badge: 'VERIFIED', ev: 'lumen_ph', what: 'Arabidopsis in vivo; the model is kept inside it' },
    { sym: 'qE switch', v: 'pKa 6.8; Hill 1 (PsbS), 4 (zeaxanthin)', u: '', badge: 'VERIFIED', ev: 'psbs_zea_pka', what: 'qE = product of the two (the product is a teaching form)' },
    { sym: 'uncoupled sink', v: '15 % of coupled linear flow', u: '', badge: 'ILLUSTRATIVE', ev: 'eng.unc', what: 'O2 and minor acceptors once NADP+ is used up' }
  ];

  /* ------------------------------------------------------------------ engine evidence (plates use LP.ui.ev(key)) */
  var EV = LP.evidence = LP.evidence || {};
  function ev(k, o) { if (!EV[k]) EV[k] = o; }
  ev('eng.hiT', { claim: 'Above about 35 °C the model lets Vcmax and Jmax fall (a peaked Arrhenius form), the way Rubisco activase and membranes fail in heat.', cite: 'Teaching constants: Hd 200 kJ mol−1 with ΔS 0.635 (Vcmax) and 0.650 (Jmax) kJ mol−1 K−1, chosen so Jmax peaks near 30 °C and Vcmax near 39 °C.', measured: 'none', value: '', badge: 'ILLUSTRATIVE', note: 'Bernacchi et al. 2001 give an exponential Vcmax with no decline; the decline here is added so the leaf does not get faster forever.' });
  ev('eng.theta', { claim: 'J rises with absorbed light along a non rectangular hyperbola with curvature θ = 0.8.', cite: 'A teaching value inside the usual fitted range.', measured: 'none', value: '0.8', badge: 'ILLUSTRATIVE', note: 'Fitted θ values for real leaves usually fall between about 0.7 and 0.9.' });
  ev('eng.abs', { claim: 'The model leaf absorbs 84 % of PAR photons and 30 % of far red photons.', cite: '0.84 is the assumption built into the Genty ETR equation; 0.30 for 700 to 750 nm is chosen to show that a single leaf absorbs little far red.', measured: 'none', value: '0.84; 0.30', badge: 'ILLUSTRATIVE', note: 'Real absorptance changes with chlorophyll, thickness and wavelength. Measure it with an integrating sphere.' });
  ev('eng.balance', { claim: 'Linear flow needs one photon at PSII and one at PSI per electron, and PSI also has to power the cyclic flow that tops up ATP. The model leaf splits absorbed PAR between the photosystems so both keep up (PSII share s between 0.40 and 0.55; about 0.50 in sunlight, 0.47 under red and blue LEDs); far red excites only PSI. PSI photochemistry runs at 0.95, PSII at most at Fv/Fm 0.80. Far red therefore lets PSII take a bigger share, and the gain stops when s reaches 0.55 (near a third of the photons as far red).', cite: 'Teaching model after Hogewoning et al. (2012), who showed that leaves acclimate their photosystem composition and excitation balance to the growth spectrum (key thy.hoge2012), and the Emerson enhancement (Emerson, Chalmers and Cederstrand 1957).', measured: 'none', value: 's = 0.40 to 0.55; ΦPSI 0.95', badge: 'ILLUSTRATIVE', note: 'With this split ΦPSII at 100 µmol m−2 s−1 red and blue light is 0.74, inside the 0.74 to 0.77 Hogewoning et al. (2010) measured; with a fixed 50:50 split it was 0.55.' });
  ev('eng.gm', { claim: 'The model treats CO2 at Rubisco (Cc) as equal to CO2 in the leaf air spaces (Ci).', cite: 'A simplification: real leaves have a finite mesophyll conductance, so Cc is lower than Ci.', measured: 'none', value: '', badge: 'ILLUSTRATIVE', note: 'Fitting FvCB to real A versus Ci curves without gm makes Vcmax look smaller than it is.' });
  ev('eng.ci', { claim: 'With "stomata follow the leaf", Ci stays at 0.7 of the CO2 in the air, a typical value for a well watered C3 leaf.', cite: 'Teaching value.', measured: 'none', value: '0.7', badge: 'ILLUSTRATIVE', note: 'Drought, high VPD and ABA lower Ci/Ca; switch to fixed conductance to see the leaf run short of CO2.' });
  ev('eng.synthase', { claim: 'Rotor speed per enzyme = ATP made per second ÷ 3 ATP per turn ÷ the number of ATP synthases (0.5 µmol per m2 of leaf in this model).', cite: 'The 3 ATP per turn follows from the three catalytic sites; the enzyme density is a teaching value.', measured: 'none', value: '0.5 µmol m−2', badge: 'ILLUSTRATIVE', note: 'Halve the density and each rotor must spin twice as fast for the same ATP.' });
  ev('eng.unc', { claim: 'With an uncoupler the leaf makes no ATP, so the Calvin Benson cycle stops and NADPH is not used. Within seconds NADP+ is all reduced and linear flow falls to what O2 (the Mehler reaction) and other minor sinks accept: 15 % of the coupled flow in this model.', cite: 'Teaching value. The classic speed up of electron flow by uncouplers was measured on isolated thylakoids given an artificial electron acceptor.', measured: 'none', value: '0.15', badge: 'ILLUSTRATIVE', note: 'res.Jtransient is the first few seconds; res.Jused is the steady state.' });
  ev('eng.pmf', { claim: 'Proton motive force rises with proton pumping and saturates; 60 % of it is held as ΔpH and the rest as a membrane voltage. Lumen pH = stroma pH − ΔpH, kept between 5.7 and 7.5.', cite: 'A shape chosen for teaching. The lumen pH it gives is kept inside the in vivo range measured in Arabidopsis, about 7.5 to about 5.7 (Takizawa et al. 2007, key lumen_ph).', measured: 'none', value: '', badge: 'ILLUSTRATIVE', note: 'Measured with electrochromic shift (ECS) and dark interval relaxation kinetics.' });
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
if (typeof module !== 'undefined' && module.exports) module.exports = (typeof window !== 'undefined' ? window : globalThis).LP;

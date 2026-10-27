/* The Water Path journey: Test yourself on every plate (W round 3, 11 Oct 2026).
   Same format as the site wide v7 quiz and the Light to sugar module: three tiers (1 Know it, 2 Use it, 3 Question it),
   five questions a round, a tier opens when the one below is cleared with 4 of 5 (or "Open it anyway"), scope toggle
   "This plate | The whole Water Path", every option carries its reason, badge and DOI links. Scores stay in this browser
   (localStorage key wp8-quiz); nothing is sent anywhere.
   Items: {id, t: 1|2|3, plate, b: badge, src: [doi], q, o: [[answer, why], ...], a: index of the right answer}.
   Numbers that matter are given in the question, never asked from memory. Exposed as window.WP_QUIZ_JOURNEY for the
   site wide Test yourself page (module 'journey', href and where on every item). */
(function () {
  'use strict';
  var WP = window.WP; if (!WP) return;
  var M = '−';
  var I = [
    /* ================================================================ Plate I, the Field */
    { id: 'f-k-vpd', t: 1, plate: 'field', b: 'DERIVED', src: ['10.1175/1520-0450(1967)006<0203:otcosv>2.0.co;2'],
      q: 'What is the vapour pressure deficit (VPD)?',
      o: [['How much more water vapour the air could hold at saturation than it holds now', 'Right. VPD = saturation vapour pressure at that temperature minus the actual vapour pressure. It sets how hard the air pulls water out of a leaf.'],
        ['The amount of rain the field is short of this week', 'That is a water balance deficit. VPD is about the air, right now.'],
        ['The water potential of the soil', 'Soil Ψ is the other end of the path. VPD describes the air.']], a: 0 },
    { id: 'f-k-psiair', t: 1, plate: 'field', b: 'DERIVED', src: [],
      q: 'Air at 25 °C and 50 % relative humidity has a water potential of about ' + M + '95 MPa. Compared with a leaf at ' + M + '1 MPa, the air is:',
      o: [['Pulling far harder: about a hundred times more negative', 'Right. Ψair = (RT ÷ Vw) ln(RH); at 50 % RH that is about ' + M + '95 MPa. The biggest drop on the whole path is from leaf to air.'],
        ['About the same as the leaf', 'Even moist air is far more negative than a leaf. Only near 100 % RH does the air approach leaf values.'],
        ['Less negative, so water would move into the leaf', 'Water moves toward more negative Ψ, and the air is far more negative.']], a: 0 },
    { id: 'f-k-thermal', t: 1, plate: 'field', b: 'DERIVED', src: ['10.1093/jxb/ers165'],
      q: 'A drone carries an NDVI camera and a thermal camera. Which one sees stomata closing within the day?',
      o: [['The thermal camera', 'Right. Evaporation cools the leaf; when stomata close, E falls and the canopy warms. NDVI reads greenness and leaf area, which change slowly.'],
        ['The NDVI camera', 'NDVI is a ratio of reflected near infrared and red. It tracks greenness, not the cooling that transpiration provides.'],
        ['Neither can', 'Leaf temperature is a well used signal of stomatal closure.']], a: 0 },
    { id: 'f-k-stem', t: 1, plate: 'field', b: 'ILLUSTRATIVE', src: [],
      q: 'Why do growers bag a leaf for an hour before reading midday stem Ψ in a pressure chamber?',
      o: [['A bagged leaf stops transpiring, so its Ψ comes to match the stem it hangs on', 'Right. With no flow through the leaf there is no drop across it, so the reading reports the stem.'],
        ['To keep the leaf from getting sunburnt', 'The bag is about stopping water flow, not about the sun.'],
        ['To make the leaf easier to cut', 'Cutting is the same. The point is to remove the drop that flow creates across the leaf.']], a: 0 },
    { id: 'f-k-bl', t: 1, plate: 'field', b: 'DERIVED', src: [],
      q: 'What does wind do to the thin layer of still air on a leaf, the boundary layer?',
      o: [['Thins it, so the leaf is coupled more tightly to the air around it', 'Right. A thinner boundary layer means vapour and heat leave the leaf surface more easily. This plate\'s model assumes perfect coupling, so it does not change E with wind.'],
        ['Thickens it', 'Moving air strips the still layer away.'],
        ['Nothing: the boundary layer is fixed by leaf size alone', 'Leaf size matters, and so does wind speed.']], a: 0 },
    { id: 'f-u-vpd', t: 2, plate: 'field', b: 'DERIVED', src: ['10.1175/1520-0450(1967)006<0203:otcosv>2.0.co;2'],
      q: 'At 30 °C the saturation vapour pressure is 4.24 kPa. The air is at 40 % relative humidity. What is the VPD?',
      o: [['About 2.5 kPa', 'Right. Actual vapour pressure = 0.40 × 4.24 = 1.70 kPa; VPD = 4.24 ' + M + ' 1.70 = 2.54 kPa.'],
        ['About 1.7 kPa', 'That is the actual vapour pressure, not the deficit.'],
        ['About 4.2 kPa', 'That would be the deficit of completely dry air.']], a: 0 },
    { id: 'f-u-santaana', t: 2, plate: 'field', b: 'ILLUSTRATIVE', src: [],
      q: 'Two afternoons: Salinas fog at 15 °C and 91 % humidity (VPD about 0.15 kPa), and a Santa Ana wind day at 33 °C and 10 % (VPD about 4.5 kPa). With the stomata equally open, how do the two pulls compare?',
      o: [['The Santa Ana air pulls about 30 times harder', 'Right. 4.5 ÷ 0.15 = 30. With the same conductance, transpiration scales with VPD, so the stomata are the only defence.'],
        ['About twice as hard, because it is about twice as warm', 'Temperature matters through the saturation vapour pressure, but the dryness of the Santa Ana air does most of the work.'],
        ['The same, because both are afternoons', 'Time of day sets the light. The pull depends on VPD.']], a: 0 },
    { id: 'f-u-E', t: 2, plate: 'field', b: 'DERIVED', src: [],
      q: 'A leaf has stomatal conductance 0.30 mol m⁻² s⁻¹. VPD is 2.0 kPa and air pressure 101 kPa. About how much water does it lose? (E = g × VPD ÷ P)',
      o: [['About 6 mmol m⁻² s⁻¹', 'Right. 0.30 × 2.0 ÷ 101 = 0.0059 mol m⁻² s⁻¹, about 5.9 mmol.'],
        ['About 0.6 mmol m⁻² s⁻¹', 'Check the units: 0.0059 mol is 5.9 mmol.'],
        ['About 60 mmol m⁻² s⁻¹', 'That is ten times too large; leaves rarely exceed about 10 to 15 mmol m⁻² s⁻¹.']], a: 0 },
    { id: 'f-u-gap', t: 2, plate: 'field', b: 'ILLUSTRATIVE', src: [],
      q: 'At 2 pm the stem reads ' + M + '0.40 MPa and a transpiring leaf ' + M + '0.60 MPa. Clouds halve transpiration while the stem stays at ' + M + '0.40. What should the leaf read?',
      o: [['About ' + M + '0.50 MPa', 'Right. The 0.20 MPa gap is E × R across the leaf path. Halve E and the gap halves, to 0.10 MPa.'],
        ['Still ' + M + '0.60 MPa', 'The gap exists only because water is flowing. Less flow, smaller gap.'],
        ['About ' + M + '0.80 MPa', 'Less flow does not make the leaf drier.']], a: 0 },
    { id: 'f-u-warm', t: 2, plate: 'field', b: 'DERIVED', src: ['10.1093/jxb/ers165'],
      q: 'Stomata close at noon in full sun. What happens to leaf temperature?',
      o: [['It rises', 'Right. Evaporation takes about 44 kJ per mole of water away as latent heat. Close the stomata and that cooling stops while the sun keeps heating the leaf.'],
        ['It falls', 'Closing stomata removes a cooling flux, not a heating one.'],
        ['No change, because the air temperature is unchanged', 'The leaf has its own energy budget, and transpiration is a large term in it.']], a: 0 },
    { id: 'f-q-wind', t: 3, plate: 'field', b: 'ILLUSTRATIVE', src: [],
      q: 'Someone moves the wind slider from 0.5 to 8 m s⁻¹, sees E unchanged, and writes "wind has no effect on transpiration". What is wrong?',
      o: [['The model assumes perfect coupling, so it cannot show a wind effect; a model assumption is not evidence', 'Right. The plate says so: wind changes the drawing, not E. In a real canopy wind thins the boundary layer and can change both leaf temperature and E.'],
        ['Nothing: wind never matters', 'In real leaves the boundary layer can be a large part of the resistance, especially for big leaves in still air.'],
        ['The slider is broken', 'It works. The model leaves wind out on purpose.']], a: 0 },
    { id: 'f-q-ndvi', t: 3, plate: 'field', b: 'ILLUSTRATIVE', src: [],
      q: 'Irrigation stopped a week ago. NDVI from the drone has not changed. A manager concludes the crop is not stressed. How far does that hold?',
      o: [['Not far: NDVI tracks greenness and leaf area, which lag behind stomatal closure by days', 'Right. Check canopy temperature or midday stem Ψ before deciding. Unchanged NDVI only says the leaves are still green.'],
        ['Fully: if the crop were stressed it would be less green', 'Leaves usually close stomata and warm long before they lose colour.'],
        ['It depends only on the soil type', 'Soil matters for how fast water runs out, but the sensor question is what NDVI can see.']], a: 0 },
    { id: 'f-q-coupled', t: 3, plate: 'field', b: 'DERIVED', src: [],
      q: 'The model computes VPD from air temperature, assuming the leaf is at air temperature. On a still, sunny afternoon the leaf is actually 4 °C warmer. The model\'s VPD is:',
      o: [['Too low, because a warmer leaf holds more vapour inside', 'Right. Saturation vapour pressure rises steeply with temperature, so the leaf to air gradient is larger than the model says.'],
        ['Too high', 'A warmer leaf has a higher internal vapour pressure, which widens the gap, not narrows it.'],
        ['Unaffected, because VPD is a property of the air only', 'The gradient that drives E is from the leaf interior to the air, and the interior follows leaf temperature.']], a: 0 },
    { id: 'f-q-preset', t: 3, plate: 'field', b: 'ILLUSTRATIVE', src: [],
      q: 'The inland Southern California preset (34 °C, 32 %) is labelled ILLUSTRATIVE. Someone uses it to schedule irrigation for a Riverside orchard. What is the problem?',
      o: [['The values are teaching numbers, not station records, so every downstream number inherits that guess', 'Right. Use measured weather (a CIMIS station, for example) for decisions; the preset is for comparing settings.'],
        ['None: 34 °C is a normal summer afternoon there', 'It may be plausible, but plausible is not measured, and irrigation needs the measured day.'],
        ['The preset is too dry to be real', 'The problem is not whether it is realistic but that it was not measured.']], a: 0 },
    { id: 'f-q-thermal', t: 3, plate: 'field', b: 'DERIVED', src: ['10.1093/jxb/ers165'],
      q: 'The canopy is 3 °C warmer at 2 pm today than yesterday. Is the crop water stressed?',
      o: [['Not necessarily: compare against a reference under the same weather, because sun, wind and humidity also move leaf temperature', 'Right. Thermal stress indices compare the canopy with wet and dry references measured at the same time.'],
        ['Yes: warmer leaves always mean closed stomata', 'A sunnier, stiller or more humid day can warm a fully transpiring canopy too.'],
        ['No: 3 °C is within measurement error', 'Good thermal cameras resolve much smaller differences. The issue is what else changed.']], a: 0 },

    /* ================================================================ Plate II, the Plant */
    { id: 'p-k-down', t: 1, plate: 'plant', b: 'DERIVED', src: ['10.1039/df9480300146'],
      q: 'Water climbs from the soil to the leaves. In which direction of water potential does it move?',
      o: [['Toward more negative Ψ, even while it climbs', 'Right. Each step up the plant is a step down in Ψ: soil, root, stem, petiole, leaf, then air.'],
        ['Toward less negative Ψ', 'Water moves down the Ψ gradient, from higher (less negative) to lower (more negative).'],
        ['It has no direction: water rises by capillarity alone', 'Capillarity cannot lift water metres high in xylem. The tension made at the leaf does.']], a: 0 },
    { id: 'p-k-biggest', t: 1, plate: 'plant', b: 'DERIVED', src: ['10.1039/df9480300146'],
      q: 'On the Ψ terraces, where is the largest drop on the whole path?',
      o: [['From the leaf into the air', 'Right. The air sits near ' + M + '100 MPa; every step inside the plant together is only a few tenths of an MPa. The stomata hold that drop back.'],
        ['From the soil into the root', 'That step is real but small next to the leaf to air step.'],
        ['Inside the stem', 'The stem carries water across a modest drop.']], a: 0 },
    { id: 'p-k-cohesion', t: 1, plate: 'plant', b: 'DERIVED', src: [],
      q: 'What holds the water column together as it is pulled up the xylem?',
      o: [['Hydrogen bonds between water molecules (cohesion) and to the walls (adhesion)', 'Right. That is why the column can be under tension without breaking, as the molecular theatre shows.'],
        ['Root pressure pushing from below', 'Root pressure exists at night in some plants, but transpiration pulls the column during the day.'],
        ['Air pressure on the soil', 'Atmospheric pressure could push water up only about 10 m, and xylem water is under tension, not pushed.']], a: 0 },
    { id: 'p-k-gravity', t: 1, plate: 'plant', b: 'DERIVED', src: [],
      q: 'How much does gravity add to the pull needed to lift water, per metre of height?',
      o: [['About 0.01 MPa per metre', 'Right. ρ g = 1000 kg m⁻³ × 9.8 m s⁻² ≈ 0.0098 MPa m⁻¹. Small for a lettuce, large for a tall tree.'],
        ['About 1 MPa per metre', 'That is a hundred times too large.'],
        ['Nothing: gravity does not act on xylem water', 'It acts on all water; it is simply small for short plants.']], a: 0 },
    { id: 'p-k-ohm', t: 1, plate: 'plant', b: 'DERIVED', src: ['10.1039/df9480300146'],
      q: 'In the Ohm analogy for water, flow = ΔΨ ÷ R. If the resistance doubles and the pull stays the same, the flow:',
      o: [['Halves', 'Right. More resistance at the same driving force means less flow.'],
        ['Doubles', 'That would be the case if R were a conductance.'],
        ['Stays the same', 'Only if the plant made the pull larger, which is what happens as Ψ becomes more negative.']], a: 0 },
    { id: 'p-u-height', t: 2, plate: 'plant', b: 'DERIVED', src: [],
      q: 'A romaine head is 0.25 m tall and an almond tree 4 m. How much more pull does gravity ask at the top of the almond?',
      o: [['About 0.04 MPa more', 'Right. (4 ' + M + ' 0.25) × 0.0098 ≈ 0.037 MPa.'],
        ['About 4 MPa more', 'That would need about 1 MPa per metre.'],
        ['None, because both are plants', 'Height matters through ρ g h.']], a: 0 },
    { id: 'p-u-kplant', t: 2, plate: 'plant', b: 'ILLUSTRATIVE', src: [],
      q: 'A vine transpires 3 mmol m⁻² s⁻¹ with whole plant conductance 8 mmol m⁻² s⁻¹ MPa⁻¹. The soil is at ' + M + '0.10 MPa. Ignoring gravity, what is leaf Ψ?',
      o: [['About ' + M + '0.48 MPa', 'Right. ΔΨ = E ÷ K = 3 ÷ 8 = 0.375 MPa below the soil.'],
        ['About ' + M + '0.38 MPa', 'That is the drop itself; add it to the soil value.'],
        ['About ' + M + '2.4 MPa', 'That multiplies E by K instead of dividing.']], a: 0 },
    { id: 'p-u-series', t: 2, plate: 'plant', b: 'DERIVED', src: [],
      q: 'Two resistances in series, 0.05 and 0.15 (same units), carry the same flow. What share of the total Ψ drop happens across the second?',
      o: [['75 %', 'Right. In series the drop splits in proportion to resistance: 0.15 ÷ 0.20.'],
        ['25 %', 'That is the share across the first.'],
        ['50 %, because they carry the same flow', 'Same flow, different resistances, so different drops.']], a: 0 },
    { id: 'p-u-close', t: 2, plate: 'plant', b: 'DERIVED', src: [],
      q: 'At noon the stomata close by half and E halves. With the soil unchanged, what happens to each step on the Ψ terraces inside the plant?',
      o: [['Each step shrinks by half, so the leaf moves back toward the soil value', 'Right. Each step is E × R; halve E and every step halves.'],
        ['Each step doubles', 'Less flow means smaller drops.'],
        ['Nothing changes until the soil dries', 'The steps depend on flow as well as on the soil.']], a: 0 },
    { id: 'p-u-bag', t: 2, plate: 'plant', b: 'ILLUSTRATIVE', src: [],
      q: 'A bagged leaf reads ' + M + '0.36 MPa and a transpiring leaf next to it ' + M + '0.57 MPa at E = 3.2 mmol m⁻² s⁻¹. What is the resistance from stem to leaf?',
      o: [['About 0.066 MPa per mmol m⁻² s⁻¹', 'Right. R = ΔΨ ÷ E = 0.21 ÷ 3.2.'],
        ['About 0.67', 'Check the arithmetic: 0.21 ÷ 3.2 is about 0.066.'],
        ['It cannot be found from two leaves', 'The bagged leaf reports the stem, so the pair gives the drop across the leaf path.']], a: 0 },
    { id: 'p-q-air', t: 3, plate: 'plant', b: 'DERIVED', src: [],
      q: 'The air is at ' + M + '126 MPa. Someone argues the leaf must therefore be near ' + M + '126 MPa too. What is wrong?',
      o: [['The drop happens across the stomata, where liquid water becomes vapour; the leaf liquid stays near ' + M + '1 MPa', 'Right. Stomatal and boundary layer conductance limit the vapour flux, so the leaf never equilibrates with the air while it lives.'],
        ['Nothing: water potential must be continuous', 'It is continuous along the liquid path. The phase change at the evaporating surfaces carries the big step.'],
        ['The air value is wrong', 'It follows from the humidity: (RT ÷ Vw) ln(RH).']], a: 0 },
    { id: 'p-q-metastable', t: 3, plate: 'plant', b: 'DERIVED', src: [],
      q: 'Someone says water under ' + M + '1 MPa of tension "should boil", so cohesion tension cannot be right. What is the best reply?',
      o: [['Water under tension is metastable; it breaks when air is pulled in through a pit, not by boiling', 'Right. Pure water can hold large tensions; failure comes from air seeding at the widest pit membrane pore (Plates III and IV).'],
        ['Tension in xylem is only an assumption', 'Pressure chambers and other methods measure it directly.'],
        ['Xylem water is warm enough to prevent boiling', 'Temperature is not what breaks the column.']], a: 0 },
    { id: 'p-q-model', t: 3, plate: 'plant', b: 'ILLUSTRATIVE', src: [],
      q: 'A report quotes "vine leaf Ψ ' + M + '0.57 MPa" from this plate as a measurement. What is the problem?',
      o: [['It is a model output from illustrative constants (Kplant, gsMax), not a reading from a vine', 'Right. The badge says ILLUSTRATIVE. Quote measured values from papers, with their method.'],
        ['None: the model is calibrated', 'Parts are anchored to papers, but the plant conductance and split are teaching values.'],
        ['The units are wrong', 'The units are fine. The source is the issue.']], a: 0 },
    { id: 'p-q-series', t: 3, plate: 'plant', b: 'MEASURED', src: ['10.1111/nph.19069'],
      q: 'In the series experiment the outside xylem path gets twice as hard to cross. Which statement follows from a series circuit?',
      o: [['At the same E, only the step across that path grows; but if the stomata respond, E falls and every step changes', 'Right. That is the point of the experiment: the series argument plus a stomatal response.'],
        ['Every step grows equally', 'At fixed flow only the resistance that changed adds drop.'],
        ['Nothing changes, because the xylem is the main resistance', 'The leaf outside the xylem is a large part of leaf resistance in many species.']], a: 0 },
    { id: 'p-q-root', t: 3, plate: 'plant', b: 'ILLUSTRATIVE', src: [],
      q: 'The model splits 1 ÷ Kplant as root 35 %, stem 25 %, petiole 5 %, leaf xylem 10 %, outside xylem 25 %. Can you use it to say roots are the main bottleneck in grapevine?',
      o: [['No: the split is a teaching value; it would need measured organ resistances in grapevine', 'Right. The badges say ILLUSTRATIVE. A claim about vines needs vine data.'],
        ['Yes: 35 % is the largest share', 'It is the largest share in the model, which was set by hand.'],
        ['Yes, because roots are always limiting', 'There is no "always": it depends on species, soil and stress.']], a: 0 },

    /* ================================================================ Plate III, the Organ */
    { id: 'o-k-casp', t: 1, plate: 'organ', b: 'DERIVED', src: [],
      q: 'What does the Casparian strip of the root endodermis do?',
      o: [['Seals the radial walls, so water and ions must cross a membrane to reach the xylem', 'Right. The strip is a band in the walls; it does not stop water, it forces it through living cells.'],
        ['Stops all water from entering the root', 'Water still enters, through the endodermal cells.'],
        ['Pumps water into the xylem', 'It is a wall seal, not a pump.']], a: 0 },
    { id: 'o-k-black', t: 1, plate: 'organ', b: 'MEASURED', src: ['10.1093/jxb/eraa392'],
      q: 'In the grapevine midrib microCT images, what does black mean?',
      o: [['Gas: an embolised conduit or an air space', 'Right. Gas absorbs few X rays and shows black; water and tissue are grey.'],
        ['Water under the most tension', 'Water shows grey whatever its tension.'],
        ['Lignin', 'Lignified walls are grey to bright, not black.']], a: 0 },
    { id: 'o-k-p50', t: 1, plate: 'organ', b: 'DERIVED', src: [],
      q: 'What is P50?',
      o: [['The water potential at which an organ has lost 50 % of its hydraulic conductance', 'Right. A more negative P50 means a more resistant organ.'],
        ['The pressure at which half the stomata close', 'That is a stomatal threshold, a different quantity (for grapevine about ' + M + '0.60 MPa).'],
        ['Half of the maximum transpiration', 'P50 refers to conductance loss.']], a: 0 },
    { id: 'o-k-airseed', t: 1, plate: 'organ', b: 'DERIVED', src: [],
      q: 'How does air usually get into a water filled conduit?',
      o: [['It is pulled from a gas filled neighbour through a pore in the pit membrane', 'Right. When tension exceeds what the meniscus in the widest pore can hold, air is seeded into the conduit.'],
        ['The water boils in the heat', 'Not boiling. Tension pulls air in.'],
        ['Air dissolves out of the sap in the leaves only', 'Seeding through pits is the leading mechanism shown here.']], a: 0 },
    { id: 'o-k-plc', t: 1, plate: 'organ', b: 'DERIVED', src: [],
      q: 'PLC stands for:',
      o: [['Percent loss of conductivity', 'Right. The share of maximum xylem conductivity lost, usually to embolism.'],
        ['Plant leaf conductance', 'That is a different quantity.'],
        ['Pressure limit of cavitation', 'Not a standard term.']], a: 0 },
    { id: 'o-u-pore', t: 2, plate: 'organ', b: 'DERIVED', src: [],
      q: 'A meniscus in a pore of diameter D holds ΔP = 4γ ÷ D. If the widest pore in a pit membrane were half as wide, the tension needed to seed air would:',
      o: [['Double', 'Right. ΔP scales as 1 ÷ D. Smaller pores hold more tension.'],
        ['Halve', 'That is the opposite relation.'],
        ['Not change', 'Pore size is the whole idea of the threshold.']], a: 0 },
    { id: 'o-u-hoch', t: 2, plate: 'organ', b: 'MEASURED', src: ['10.1111/pce.12688'],
      q: 'In Syrah vines measured by MRI, petiole P50 was ' + M + '1.54 MPa and stem P50 ' + M + '1.90 MPa. At ' + M + '1.70 MPa, which organ is past its P50?',
      o: [['The petiole only', 'Right. ' + M + '1.70 is beyond ' + M + '1.54 but not yet at ' + M + '1.90.'],
        ['The stem only', 'The stem holds until ' + M + '1.90.'],
        ['Both', 'The stem has not reached ' + M + '1.90.']], a: 0 },
    { id: 'o-u-order', t: 2, plate: 'organ', b: 'MEASURED', src: ['10.1093/jxb/eraa392'],
      q: 'In Cabernet Sauvignon, stomatal conductance had lost 80 % by ' + M + '1.21 MPa, and midrib embolism began near ' + M + '1.25 MPa. What does that order say?',
      o: [['Stomata were mostly closed before the first midrib conduits filled with gas', 'Right. Closure came first, so most of the water loss had been cut before the pipes broke.'],
        ['Embolism caused the stomata to close', 'The closure came first, so embolism cannot have caused it.'],
        ['The two happened at random', 'The thresholds were measured in the same leaves and are ordered.']], a: 0 },
    { id: 'o-u-flood', t: 2, plate: 'organ', b: 'MEASURED', src: ['10.1038/nature01853'],
      q: 'Roots in flooded soil run short of oxygen and their cytosol acidifies. What happens to root water uptake?',
      o: [['It falls: low pH closes root aquaporins', 'Right. Tournaire-Roux et al. 2003 tied the drop in root conductance under anoxia to aquaporin gating by cytosolic pH.'],
        ['It rises, because there is more water', 'More water outside does not help if the membranes close.'],
        ['Nothing changes, because water moves through walls', 'The endodermis forces water through membranes, so aquaporins matter.']], a: 0 },
    { id: 'o-u-roots', t: 2, plate: 'organ', b: 'MEASURED', src: ['10.1104/pp.16.00923'],
      q: 'Grapevine fine roots had xylem P50 about ' + M + '1.8 MPa and coarse roots about ' + M + '3.5 MPa. As soil dries, which fails first?',
      o: [['The fine roots', 'Right. ' + M + '1.8 is reached long before ' + M + '3.5. Losing cheap fine roots can disconnect the plant from drying soil.'],
        ['The coarse roots', 'Their P50 is far more negative.'],
        ['Both at once', 'Their P50s are about 1.7 MPa apart.']], a: 0 },
    { id: 'o-q-fuse', t: 3, plate: 'organ', b: 'MEASURED', src: ['10.1111/pce.12688', '10.1111/pce.15249'],
      q: 'Grapevine petiole P50 (' + M + '1.54 MPa) is less negative than stem P50 (' + M + '1.90 MPa). Does that make the petiole a hydraulic fuse that protects the stem?',
      o: [['Not on that evidence: the study itself did not support a fuse reading, and segmentation is an open question across species', 'Right. A difference in P50 alone does not show that petiole failure protects the stem; Peters and Choat 2025 found segmentation absent or negative in 12 trees.'],
        ['Yes: the weaker organ always protects the stronger', 'That is the hypothesis, not a result. It needs the dynamics, not just two thresholds.'],
        ['No: the stem fails first', 'The stem P50 is more negative, so the stem does not fail first by this measure.']], a: 0 },
    { id: 'o-q-ct3', t: 3, plate: 'organ', b: 'MEASURED', src: ['10.1093/jxb/eraa392'],
      q: 'The three microCT slices (about ' + M + '0.45, ' + M + '1.3 and ' + M + '2.1 MPa) come from three different leaves. Can you read them as a film of one leaf drying?',
      o: [['Only as a comparison: different leaves, and the control is a different cultivar, so the time course of one leaf is not shown', 'Right. The pattern is suggestive; the paper\'s curves come from many leaves.'],
        ['Yes, because they are from the same study', 'Same study, different leaves.'],
        ['No: microCT cannot see embolism', 'It can; that is why the images are black where gas is.']], a: 0 },
    { id: 'o-q-pore', t: 3, plate: 'organ', b: 'DERIVED', src: [],
      q: 'ΔP = 4γ ÷ D treats the pit membrane as a sheet with round holes. What is the main caution?',
      o: [['Real pit membranes are 3D meshes coated with surfactants, so the effective pore and surface tension may differ', 'Right. The equation sets the direction (smaller pores hold more); the exact threshold is debated.'],
        ['The equation is fine for any material', 'It assumes a simple cylindrical pore and pure water.'],
        ['Surface tension does not matter', 'γ sets the threshold directly.']], a: 0 },
    { id: 'o-q-method', t: 3, plate: 'organ', b: 'MEASURED', src: ['10.1104/pp.16.01079', '10.1111/pce.12688'],
      q: 'One study reports grapevine petiole P50 ' + M + '0.98 MPa (microCT, Cabernet Sauvignon), another ' + M + '1.54 MPa (MRI, Syrah). Which is right?',
      o: [['You cannot tell from the two numbers: method, cultivar and drying differ', 'Right. A P50 without its method, organ, cultivar and season is incomplete.'],
        ['' + M + '0.98, because microCT sees conduits directly', 'Both are imaging methods; the plants and conditions also differ.'],
        ['The average, ' + M + '1.26', 'Averaging numbers from different conditions gives a number nobody measured.']], a: 0 },
    { id: 'o-q-almond', t: 3, plate: 'organ', b: 'MEASURED', src: ['10.3389/fpls.2022.974050'],
      q: 'Almond stem P50 values on this plate come from air injection on excised stems. Why read them with care?',
      o: [['In species with long vessels, open vessels at the cut can make stems look more vulnerable than they are', 'Right. The method is part of the number; the plate flags it.'],
        ['Air injection cannot be used on trees', 'It is widely used; it has known artefacts.'],
        ['Almond has no vessels', 'Almond, like all angiosperms here, has vessels.']], a: 0 },

    /* ================================================================ Plate IV, the Tissue */
    { id: 't-k-psi', t: 1, plate: 'tissue', b: 'DERIVED', src: [],
      q: 'For a plant cell, Ψ = Ψs + Ψp. What is Ψp?',
      o: [['The pressure potential: turgor pushing on the wall', 'Right. Positive while the cell is turgid, zero at the turgor loss point.'],
        ['The osmotic potential of the vacuole', 'That is Ψs, made negative by solutes.'],
        ['The gravitational term', 'Gravity is small at the scale of a cell and is left out here.']], a: 0 },
    { id: 't-k-tlp', t: 1, plate: 'tissue', b: 'DERIVED', src: ['10.1111/j.1461-0248.2012.01751.x'],
      q: 'What is the turgor loss point (TLP)?',
      o: [['The leaf water potential at which turgor reaches zero and the leaf wilts', 'Right. A more negative TLP lets a leaf keep turgor in drier soil.'],
        ['The point at which every stoma closes', 'Stomata often close near TLP, but not always (some shrubs close below it).'],
        ['The point at which xylem embolises', 'That is a different threshold.']], a: 0 },
    { id: 't-k-apo', t: 1, plate: 'tissue', b: 'DERIVED', src: [],
      q: 'Water moving through the apoplast travels:',
      o: [['Along the cell walls and spaces between cells, without crossing a membrane', 'Right. The wall belongs to neither cell; it is a shared path.'],
        ['Through cytoplasm from cell to cell', 'That is the symplast.'],
        ['As vapour through air spaces', 'That is the vapour route.']], a: 0 },
    { id: 't-k-bs', t: 1, plate: 'tissue', b: 'MEASURED', src: ['10.1111/pce.13087'],
      q: 'Why is the bundle sheath called a control point?',
      o: [['Every molecule leaving the vein must pass its cells, so their walls and membranes set how easily water leaves', 'Right. Species with lignified sheath walls had lower outside xylem conductance (Ohtsuka et al. 2018).'],
        ['It makes the sugars', 'Photosynthesis happens mostly in the mesophyll.'],
        ['It opens and closes the stomata', 'Guard cells do that.']], a: 0 },
    { id: 't-k-kox', t: 1, plate: 'tissue', b: 'DERIVED', src: ['10.1111/nph.19069'],
      q: 'K<sub>ox</sub> is the conductance of:',
      o: [['The path outside the xylem, from the veins to where water evaporates', 'Right. Leaf conductance is xylem and outside xylem in series.'],
        ['The stomata', 'That is gs, a gas phase conductance.'],
        ['The xylem only', 'That is K<sub>x</sub>.']], a: 0 },
    { id: 't-u-turgor', t: 2, plate: 'tissue', b: 'DERIVED', src: [],
      q: 'A cell has Ψs ' + M + '1.30 MPa and Ψ ' + M + '1.00 MPa. What is its turgor?',
      o: [['+0.30 MPa', 'Right. Ψp = Ψ ' + M + ' Ψs = ' + M + '1.00 + 1.30.'],
        ['' + M + '0.30 MPa', 'Turgor in a living, turgid cell is positive.'],
        ['' + M + '2.30 MPa', 'That adds the two instead of subtracting.']], a: 0 },
    { id: 't-u-kvsg', t: 2, plate: 'tissue', b: 'MEASURED', src: ['10.1093/jxb/eraa392'],
      q: 'Cabernet Sauvignon: K<sub>leaf</sub> lost 80 % by ' + M + '0.71 MPa and gs 80 % by ' + M + '1.21 MPa. At ' + M + '0.90 MPa, which has lost more?',
      o: [['K<sub>leaf</sub>', 'Right. K<sub>leaf</sub> is already past 80 % loss; gs has not reached it.'],
        ['g<sub>s</sub>', 'gs reaches 80 % loss only at ' + M + '1.21.'],
        ['They have lost the same', 'Their curves are about 0.5 MPa apart at 80 %.']], a: 0 },
    { id: 't-u-merlot', t: 2, plate: 'tissue', b: 'MEASURED', src: ['10.1007/s00425-017-2662-3'],
      q: 'After 39 days of deficit, Merlot TLP moved from ' + M + '1.08 to ' + M + '1.31 MPa. A leaf sits at ' + M + '1.20 MPa. Before and after adjustment it is:',
      o: [['Wilted before, still turgid after', 'Right. ' + M + '1.20 is beyond ' + M + '1.08 but not yet at ' + M + '1.31.'],
        ['Turgid both times', 'Before adjustment ' + M + '1.20 is past the TLP of ' + M + '1.08.'],
        ['Wilted both times', 'After adjustment the TLP is ' + M + '1.31, beyond ' + M + '1.20.']], a: 0 },
    { id: 't-u-buckley', t: 2, plate: 'tissue', b: 'MEASURED', src: ['10.1111/pce.12372'],
      q: 'Buckley\'s 2015 model puts 72 to 88 % of outside xylem conductance in the walls when the leaf is isothermal. A 0.2 K vertical temperature gradient lets vapour carry up to:',
      o: [['44 %', 'Right. A small temperature difference makes vapour a large route; beyond 0.2 K the plate extrapolates.'],
        ['7 %', 'That is near the isothermal vapour share (7.3 to 16.2 %).'],
        ['100 %', 'Walls and membranes still carry most of the rest.']], a: 0 },
    { id: 't-u-merlot2', t: 2, plate: 'tissue', b: 'DERIVED', src: ['10.1007/s00425-017-2662-3'],
      q: 'In the same Merlot vines πo moved only from ' + M + '1.02 to ' + M + '1.10 MPa while TLP moved from ' + M + '1.08 to ' + M + '1.31. With TLP = πo ÷ (1 + πo ÷ ε), what else must have changed?',
      o: [['The wall became more elastic (ε fell, about 18 to 7 MPa, back calculated)', 'Right. A softer wall lets the cell lose more water before turgor reaches zero. The ε values are DERIVED, not measured.'],
        ['The cells made far more sugar', 'πo changed by only about 8 %.'],
        ['Nothing: the numbers are inconsistent', 'They are consistent once ε changes.']], a: 0 },
    { id: 't-q-mean', t: 3, plate: 'tissue', b: 'MEASURED', src: ['10.1111/nph.19069'],
      q: 'Across 34 species, leaves had lost 9 to 99 % of K<sub>ox</sub> or K<sub>leaf</sub> before the first embolism, 66 % on average. What does quoting only "66 %" hide?',
      o: [['The spread: some species lose almost nothing first, others almost everything, and why they differ is the open question', 'Right. The range is the finding; a mean of very different species describes none of them.'],
        ['Nothing: 66 % is the answer', 'It is the centre of a very wide range.'],
        ['That the measurements were wrong', 'The spread is between species, not measurement error.']], a: 0 },
    { id: 't-q-aqp', t: 3, plate: 'tissue', b: 'MEASURED', src: ['10.1111/pce.12372'],
      q: 'Walls carry most of the outside xylem flow in Buckley\'s model. Someone concludes aquaporins cannot matter for K<sub>leaf</sub>. What is the flaw?',
      o: [['The sheath forces water across membranes in series, and the wall share itself ranges from 14 to 99.8 % across plausible parameters', 'Right. A step in series can limit flow even if a parallel route carries most of it elsewhere.'],
        ['None: the walls win', 'The model is a range, not a verdict, and the sheath is in series.'],
        ['Aquaporins are only in roots', 'Leaves have plenty, especially in the bundle sheath.']], a: 0 },
    { id: 't-q-order', t: 3, plate: 'tissue', b: 'MEASURED', src: ['10.1073/pnas.1604088113', '10.1111/pce.15249'],
      q: 'On average leaves lose turgor before stems lose half their conductivity (Bartlett et al. 2016). Does TLP therefore tell you when a given plant\'s xylem will embolise?',
      o: [['No: the order varies with species and climate, so it needs that plant\'s own curves', 'Right. In 12 Australian trees leaf embolism began only after turgor loss (Peters and Choat 2025); other species differ.'],
        ['Yes, embolism always starts at TLP', 'The average order does not fix the threshold for one plant.'],
        ['Yes, if the plant is a crop', 'Crops differ too.']], a: 0 },
    { id: 't-q-oa', t: 3, plate: 'tissue', b: 'MEASURED', src: ['10.1007/s00425-017-2662-3'],
      q: 'Merlot adjusted its TLP by 0.23 MPa after a deficit, but its petioles became more vulnerable to embolism. Did adjustment make the vine safer?',
      o: [['It depends on the organ: the leaf held turgor longer while the petiole lost safety', 'Right. One trait moving in a helpful direction does not make the whole plant safer.'],
        ['Yes, always', 'The petiole result says otherwise for this vine.'],
        ['No, adjustment is always harmful', 'Leaves kept turgor at lower Ψ, which helps them.']], a: 0 },
    { id: 't-q-lignin', t: 3, plate: 'tissue', b: 'MEASURED', src: ['10.1111/pce.13087'],
      q: 'Species with lignified bundle sheath walls had more than 50 % lower K<sub>ox</sub>. Can you say lignifying a grapevine sheath would halve its K<sub>ox</sub>?',
      o: [['No: it is a comparison between 11 species, not a change inside one leaf', 'Right. Between species many traits differ at once; a within leaf effect needs a within leaf test.'],
        ['Yes, the effect size is known', 'It is known for the comparison, not for a switch in one plant.'],
        ['Yes, because grapevine has no lignin', 'Grapevine veins are lignified; the question is about the sheath and the design of the evidence.']], a: 0 },

    /* ================================================================ Plate V, the Membrane */
    { id: 'm-k-pores', t: 1, plate: 'membrane', b: 'MEASURED', src: ['10.1038/nature04316', '10.1038/35036519'],
      q: 'The plate cuts one aquaporin pore open. How does water pass through it?',
      o: [['In single file, one molecule behind the next', 'Right. The pore narrows to about 3 Å, so water lines up and protons are kept out.'],
        ['As a wide stream, many molecules side by side', 'The pore is too narrow for that.'],
        ['Together with protons', 'Protons are blocked; that is part of why the channel carries water so selectively.']], a: 0 },
    { id: 'm-k-gate', t: 1, plate: 'membrane', b: 'MEASURED', src: ['10.1038/nature04316'],
      q: 'What is loop D?',
      o: [['The gate: a loop on the cytosol side that swings under the pore mouth and shuts the channel', 'Right. In the spinach SoPIP2;1 structure it moves by up to 16 Å between the shut and the open state.'],
        ['A second pore beside the first', 'Each monomer has one pore; loop D closes it.'],
        ['A sugar carried through the channel', 'It is part of the protein itself.']], a: 0 },
    { id: 'm-k-ph', t: 1, plate: 'membrane', b: 'MEASURED', src: ['10.1038/nature04316'],
      q: 'In SoPIP2;1, what does a low cytosolic pH do to the gate?',
      o: [['Protonates His193 on loop D and closes the pore', 'Right. Loop D folds over the pore from the cytosolic side.'],
        ['Opens the pore wider', 'Acid closes it.'],
        ['Nothing: pH acts only outside', 'The sensing histidine faces the cytosol.']], a: 0 },
    { id: 'm-k-phos', t: 1, plate: 'membrane', b: 'MEASURED', src: ['10.1038/nature04316'],
      q: 'Which residues of SoPIP2;1 carry the phosphorylation sites on this plate?',
      o: [['Ser115 on loop B and Ser274 on the C terminus', 'Right. Phosphorylation is associated with the open state in the structure.'],
        ['His193 and Leu197', 'His193 senses pH; Leu197 forms the hydrophobic gate.'],
        ['Glu31 and Asp28', 'They form the N terminal cation site and the pH salt bridge partner.']], a: 0 },
    { id: 'm-k-pf', t: 1, plate: 'membrane', b: 'DERIVED', src: [],
      q: 'P<sub>f</sub>, the osmotic water permeability, describes:',
      o: [['How easily water crosses a membrane for a given driving force', 'Right. Channels add to the slow lipid path.'],
        ['How many stomata are open', 'That is stomatal conductance.'],
        ['The speed of sap in the xylem', 'Pf is a membrane property.']], a: 0 },
    { id: 'm-k-lipid', t: 1, plate: 'membrane', b: 'ILLUSTRATIVE', src: [],
      q: 'With every aquaporin gate shut, the membrane:',
      o: [['Still passes water slowly through the lipid bilayer', 'Right. A membrane is never watertight; the lipid term remains.'],
        ['Becomes completely watertight', 'Water diffuses through lipid, slowly.'],
        ['Passes water faster', 'Shutting channels cannot speed water up.']], a: 0 },
    { id: 'm-u-red', t: 2, plate: 'membrane', b: 'MEASURED', src: ['10.1093/treephys/tps022', '10.1093/plcell/koac089'],
      q: 'Walnut K<sub>leaf</sub> was about 60 % lower without blue light. Which chain has been proposed for blue light, in Arabidopsis?',
      o: [['Blue light drives the bundle sheath H⁺ pump, the xylem sap acidifies and sheath P<sub>f</sub> rises; how the sap signal reaches the gate is still open', 'Right. Shown in Arabidopsis by one lab (Grunwald et al.); the last step is a question.'],
        ['Red light damages the xylem', 'No damage is involved.'],
        ['Blue light opens the stomata, which pulls more water through', 'Stomata respond to blue light too, but K<sub>leaf</sub> is a hydraulic property measured on its own.']], a: 0 },
    { id: 'm-u-aba', t: 2, plate: 'membrane', b: 'MEASURED', src: ['10.1111/j.1365-313x.2011.04576.x'],
      q: 'ABA fed into the xylem lowered K<sub>leaf</sub>. On this plate, where does it act?',
      o: [['On the bundle sheath, lowering its membrane permeability', 'Right. The sheath is the first membrane water meets after the vein.'],
        ['On the guard cells only', 'ABA does close stomata, but the K<sub>leaf</sub> drop came from the sheath.'],
        ['On the cuticle', 'The cuticle is not on the liquid path.']], a: 0 },
    { id: 'm-u-ko', t: 2, plate: 'membrane', b: 'PREPRINT', src: ['10.64898/2026.01.29.702672'],
      q: 'In grapevine PIP2;1 knockouts (a preprint, not yet peer reviewed), what changed?',
      o: [['Stomata stayed more open as the leaf dried; the K<sub>leaf</sub> curve did not change', 'Right. The direction is from the preprint; the size used in the model is illustrative.'],
        ['K<sub>leaf</sub> halved', 'Not in this preprint.'],
        ['Nothing measurable', 'Stomatal behaviour changed.']], a: 0 },
    { id: 'm-u-flood', t: 2, plate: 'membrane', b: 'MEASURED', src: ['10.1038/nature01853'],
      q: 'Cytosolic pH falls from 7.2 to 6.4 in flooded roots. What do the gates do on this plate?',
      o: [['Close, as His193 is protonated', 'Right. That is the mechanism behind lower root conductance under anoxia.'],
        ['Open', 'Acid closes them.'],
        ['Nothing below pH 6', 'They respond in this range.']], a: 0 },
    { id: 'm-u-popen', t: 2, plate: 'membrane', b: 'ILLUSTRATIVE', src: [],
      q: 'On the plate one gate flicks open and shut. You lower the cytosolic pH. What changes for this one channel?',
      o: [['It spends less of its time open; each spell is still fully open or fully shut', 'Right. A single channel is open or shut; the switches change the share of time open, and across many channels the share open at once.'],
        ['It stays half open all the time', 'A single channel does not sit half open in this picture; the half is a share of time.'],
        ['Water flows faster through it while open', 'The switches act on whether it is open, not on how fast water passes when open.']], a: 0 },
    { id: 'm-u-almond', t: 2, plate: 'membrane', b: 'MEASURED', src: ['10.1104/pp.106.090092', '10.1093/jxb/eri045'],
      q: 'Light raised K<sub>leaf</sub> in walnut, bur oak and poplar, but 5 of 11 woody species in one test did not respond. What can you say about almond?',
      o: [['Nothing yet: no test in almond was found, so it is a question', 'Right. The plate says "not yet tested in almond".'],
        ['Almond must respond, like walnut', 'Species differ; one tree does not stand for another.'],
        ['Almond cannot respond', 'There is no evidence either way.']], a: 0 },
    { id: 'm-u-ca', t: 2, plate: 'membrane', b: 'MEASURED', src: ['10.1038/nature04316'],
      q: 'The divalent cation site at the N terminus of SoPIP2;1 is ligated by Glu31. What was seen in the crystal, and what is proposed in the cell?',
      o: [['Cd²⁺ in the crystal; Ca²⁺ proposed in the cell, anchoring loop D', 'Right. The Ca²⁺ role is a proposal from the structure, tested in purified membranes.'],
        ['Ca²⁺ in both', 'The crystal held Cd²⁺.'],
        ['K⁺ in both', 'Neither: it is a divalent site.']], a: 0 },
    { id: 'm-q-iso', t: 3, plate: 'membrane', b: 'MEASURED', src: ['10.1042/bj20080275', '10.1038/nature04316'],
      q: 'The pH histidine is His193 in spinach SoPIP2;1 and His199 in Arabidopsis AtPIP2;1. A report converts all residue numbers by +6. What is wrong?',
      o: [['Numbering differs between isoforms and is not a fixed offset; say which isoform every number belongs to', 'Right. Alignments shift differently along the sequence.'],
        ['Nothing: +6 works everywhere', 'It does not; the plate warns against it.'],
        ['The histidines are not homologous', 'They are; only the numbering differs.']], a: 0 },
    { id: 'm-q-light', t: 3, plate: 'membrane', b: 'MEASURED', src: ['10.1105/tpc.112.108456', '10.1093/jxb/eri045'],
      q: 'Someone writes "light phosphorylates aquaporins open". Prado et al. 2013 found Arabidopsis rosette conductance higher in darkness, with Ser280 and Ser283 phosphorylation needed. What follows?',
      o: [['The light rule is not general; phosphorylation and light interact differently by tissue and species', 'Right. Light raises K<sub>leaf</sub> in many species, not all (6 of 11 woody species in one test), and the plate never says that light phosphorylates the gate open.'],
        ['Prado must be wrong', 'A careful result that conflicts with a slogan is a reason to drop the slogan.'],
        ['Phosphorylation closes aquaporins', 'In that study it was needed for the higher conductance in darkness.']], a: 0 },
    { id: 'm-q-model', t: 3, plate: 'membrane', b: 'MEASURED', src: ['10.1093/treephys/tps022'],
      q: 'The model shows K<sub>leaf</sub> falling under red light. Can it be said to reproduce the 60 % drop measured in walnut?',
      o: [['No: the direction is published, the model\'s size is illustrative, and grapevine and almond were not measured', 'Right. The plate quotes the walnut number and does not claim a match.'],
        ['Yes, the numbers agree', 'They were not fitted to each other.'],
        ['Yes, all plants respond alike', 'Species differ.']], a: 0 },
    { id: 'm-q-sap', t: 3, plate: 'membrane', b: 'OPEN QUESTION', src: ['10.1111/tpj.15235', '10.1093/plcell/koac089', '10.1093/plphys/kiae226'],
      q: 'Acid xylem sap raises K<sub>leaf</sub> in Arabidopsis, yet an acid cytosol closes PIPs. Which statement fits the evidence best?',
      o: [['Part is explained, since the pump that acidifies the sap moves protons out of the cell, but raising only the outside pH still lowered P<sub>f</sub>, so the question is open', 'Right. It is on the plate as an open question, not as a control.'],
        ['The two results cancel, so one of them must be wrong', 'Both were measured; the gap is in the explanation.'],
        ['Sap pH and cytosolic pH are the same thing', 'They are separate compartments on either side of the membrane.']], a: 0 },
    { id: 'm-q-valve', t: 3, plate: 'membrane', b: 'MEASURED', src: ['10.1111/pce.12372', '10.1111/j.1365-313x.2011.04576.x'],
      q: 'Buckley\'s model puts most flow in walls; Moshelion\'s group shows sheath aquaporins changing K<sub>leaf</sub>. Is the bundle sheath "the valve"?',
      o: [['Open question: both lines of evidence fit if the sheath membranes are a series step; the size of that control is unsettled', 'Right. That is why it is posed as a question on the plate.'],
        ['Yes, proven', 'Neither line alone proves it.'],
        ['No, disproven by the model', 'A model range does not disprove measurements.']], a: 0 },
    { id: 'm-q-pf', t: 3, plate: 'membrane', b: 'ILLUSTRATIVE', src: [],
      q: 'In the "leaf right now" mode, closing gates does not cut the number of molecules crossing; it steepens the Ψ drop. Why?',
      o: [['At steady state the flow is set by transpiration; a lower membrane conductance needs a larger drop to carry the same flow', 'Right. ΔΨ = E × R. Only when stomata respond does E itself fall.'],
        ['The animation is wrong', 'It is the steady state logic, stated on the plate.'],
        ['Closed gates do not matter', 'They raise the resistance, which shows up as a steeper drop.']], a: 0 },

    /* ================================================================ Plate VI, California and beyond */
    { id: 's-k-hsm', t: 1, plate: 'species', b: 'MEASURED', src: ['10.1038/nature11688'],
      q: 'A hydraulic safety margin is:',
      o: [['The lowest water potential a plant reaches in the field minus its stem P50', 'Right. Positive means the plant stays short of P50; negative means it goes beyond.'],
        ['The difference between TLP and P50 in a lab', 'That is a different margin; this one uses field Ψmin.'],
        ['How much water a plant stores', 'That is capacitance.']], a: 0 },
    { id: 's-k-gmin', t: 1, plate: 'species', b: 'MEASURED', src: ['10.1111/nph.71166'],
      q: 'g<sub>min</sub> is:',
      o: [['The water a leaf still loses with its stomata shut, through the cuticle and leaky stomata', 'Right. It matters most in drought, when everything else is shut.'],
        ['The lowest stomatal opening during the day', 'It is measured with stomata shut.'],
        ['The minimum root conductance', 'It is a leaf property.']], a: 0 },
    { id: 's-k-agave', t: 1, plate: 'species', b: 'MEASURED', src: ['10.1046/j.1469-8137.1997.00620.x'],
      q: 'In drying soil, desert agave roots shrink and an air gap opens around them. What does the gap do?',
      o: [['Acts like a valve: it stops the root losing water back to the dry soil', 'Right. The root keeps its water at the cost of slower uptake when rain returns.'],
        ['Speeds water uptake', 'A gap cuts contact, so uptake falls.'],
        ['Kills the root', 'The roots survive; the gap protects them.']], a: 0 },
    { id: 's-k-root', t: 1, plate: 'species', b: 'MEASURED', src: ['10.1007/BF00379236'],
      q: 'How were the chaparral rooting depths on this plate estimated?',
      o: [['Inferred from predawn water potentials, not dug up', 'Right. "Apparent" rooting depth: the depth of soil water that matches the plant\'s predawn Ψ.'],
        ['By excavating whole root systems', 'Not for these shrubs.'],
        ['From satellite images', 'Roots cannot be seen from space.']], a: 0 },
    { id: 's-k-tlp', t: 1, plate: 'species', b: 'MEASURED', src: ['10.1093/jxb/err270'],
      q: 'On the leaf view, a species with a more negative TLP:',
      o: [['Keeps turgor down to drier conditions', 'Right. Dry habitat species sat further left on average.'],
        ['Loses turgor sooner', 'Sooner means less negative.'],
        ['Has larger leaves', 'TLP is about cell water relations, not size.']], a: 0 },
    { id: 's-u-oak', t: 2, plate: 'species', b: 'MEASURED', src: ['10.1371/journal.pone.0230868'],
      q: 'Coast live oak: centrifuge stem P50 ' + M + '1.79 MPa (25 cm stems) and minimum midday leaf Ψ ' + M + '2.5 MPa. What safety margin does that give?',
      o: [['' + M + '0.71 MPa: past its P50, on this method', 'Right. ' + M + '2.5 ' + M + ' (' + M + '1.79) = ' + M + '0.71. The trees showed no dieback, and the optical method puts oak stem P50 near ' + M + '4.45 MPa (quoted by Chacon et al. 2020), which would leave a margin near +2 MPa. Which is right is an open question.'],
        ['+0.71 MPa', 'Subtract in the right order: Ψmin minus P50.'],
        ['' + M + '4.29 MPa', 'That adds the two.']], a: 0 },
    { id: 's-u-madrone', t: 2, plate: 'species', b: 'MEASURED', src: ['10.1371/journal.pone.0230868'],
      q: 'Pacific madrone at the same site: stem P50 ' + M + '3.0 MPa, safety margin +1.13 MPa. What was its minimum field Ψ?',
      o: [['About ' + M + '1.87 MPa', 'Right. Ψmin = P50 + margin = ' + M + '3.0 + 1.13.'],
        ['About ' + M + '4.13 MPa', 'That subtracts the margin.'],
        ['About +1.13 MPa', 'The margin is not the water potential.']], a: 0 },
    { id: 's-u-gmin', t: 2, plate: 'species', b: 'MEASURED', src: ['10.1111/nph.71166'],
      q: 'Mean g<sub>min</sub>: annual herbs 9.92, woody evergreens 2.35 mmol m⁻² s⁻¹. With stomata shut, at the same VPD, how much faster does an annual herb leaf lose water?',
      o: [['About 4 times faster', 'Right. 9.92 ÷ 2.35 ≈ 4.2.'],
        ['About 7.6 times faster', 'That is the difference, not the ratio.'],
        ['The same: stomata are shut in both', 'Shut stomata leave the cuticle, which differs.']], a: 0 },
    { id: 's-u-choat', t: 2, plate: 'species', b: 'MEASURED', src: ['10.1038/nature11688'],
      q: 'Across 226 forest species, about 70 % had safety margins under 1 MPa. What does that suggest?',
      o: [['Many trees run close to their hydraulic limits, in wet and dry forests alike', 'Right. That is why droughts can kill trees across biomes.'],
        ['Most trees are very safe', 'Under 1 MPa is a narrow margin.'],
        ['Only desert plants are at risk', 'The pattern held across biomes.']], a: 0 },
    { id: 's-u-agave', t: 2, plate: 'species', b: 'MEASURED', src: ['10.1046/j.1469-8137.1997.00620.x'],
      q: 'Agave roots shrank 24 % after 7 dry days and 34 % after 14. On the plate the gap cuts inflow about 5 fold. After a long dry spell, rain returns. What should you expect first?',
      o: [['Slow uptake until the roots swell and regain contact', 'Right. The valve that saved water also slows recovery.'],
        ['Instant full uptake', 'The gap has to close first.'],
        ['No uptake ever again', 'The roots recover.']], a: 0 },
    { id: 's-q-oaktlp', t: 3, plate: 'species', b: 'MEASURED', src: ['10.1371/journal.pone.0230868'],
      q: 'Coast live oak TLP is ' + M + '2.58 MPa on the central coast and ' + M + '3.00 MPa in Los Angeles. Someone averages them to ' + M + '2.79 for "the species". What is lost?',
      o: [['The difference between populations, which may be adjustment to climate; the average was measured nowhere', 'Right. The plate shows the two populations apart for that reason.'],
        ['Nothing: averages are always better', 'Not when the difference is the point.'],
        ['The units', 'The units survive; the meaning does not.']], a: 0 },
    { id: 's-q-tlprule', t: 3, plate: 'species', b: 'MEASURED', src: ['10.1111/pce.15505'],
      q: 'The build a plant toy shuts the stomata exactly at TLP. In Southern California shrubs the stomata closed below TLP. What does that mean for the toy?',
      o: [['It closes stomata too early for those shrubs; it is a simplification, not a law', 'Right. The plate labels the line "model: stomata shut here".'],
        ['The shrubs are wrong', 'Data are not wrong for disagreeing with a toy.'],
        ['TLP has nothing to do with stomata', 'It is related on average, with exceptions.']], a: 0 },
    { id: 's-q-ceanothus', t: 3, plate: 'species', b: 'MEASURED', src: ['10.3732/ajb.89.5.820'],
      q: 'Ceanothus crassifolius branchlets reached ' + M + '11.2 MPa. Why is that number drawn as an arrow off the stem chart?',
      o: [['It is beyond the axis; plotting it would squash everyone else, and it is a branchlet minimum, not a stem P50', 'Right. Different quantities and an extreme value: shown, but not on the same scale.'],
        ['It is a typo', 'It was measured.'],
        ['Chaparral values cannot be compared with anything', 'They can, on the right axes.']], a: 0 },
    { id: 's-q-gminT', t: 3, plate: 'species', b: 'MEASURED', src: ['10.1093/plphys/kiae551', '10.1093/treephys/tpae027'],
      q: 'In 24 oaks g<sub>min</sub> fell toward 0.57 mmol m⁻² s⁻¹ at 45 °C; in nine European trees it rose 2 to 4 fold between 25 and 50 °C. How would you test which applies to chamise on a Santa Ana day?',
      o: [['Measure g<sub>min</sub> on chamise across temperature while holding VPD constant, since VPD alone can lower g<sub>min</sub>', 'Right. Separate temperature from VPD; then the species answers for itself.'],
        ['Average the two studies', 'Opposite responses do not average into a useful prediction.'],
        ['Assume oaks, because chamise grows near oaks', 'Neighbours are not the same species.']], a: 0 },
    { id: 's-q-lettuce', t: 3, plate: 'species', b: 'ILLUSTRATIVE', src: ['10.1111/nph.71166'],
      q: 'The romaine marker uses the annual herb g<sub>min</sub> mean because no lettuce value was found. Can you use the toy to say how long romaine survives without water?',
      o: [['Only as a what if: the lettuce traits are stand ins, so the answer is illustrative', 'Right. A survival time needs measured lettuce TLP, P50 and g<sub>min</sub>.'],
        ['Yes, the herb mean is close enough', 'Close enough for a sketch, not for a claim.'],
        ['Yes, lettuce is an annual herb', 'Being in a group does not give a species the group mean.']], a: 0 },

    /* ================================================================ Your Salinas afternoon */
    { id: 'a-k-ca', t: 1, plate: 'afternoon', b: 'MEASURED', src: ['10.21273/JASHS.111.3.413'],
      q: 'How does calcium reach a leaf?',
      o: [['Dissolved in the xylem water, carried by the transpiration stream', 'Right. Where water goes, calcium goes; when water evaporates, calcium stays.'],
        ['Through the phloem with sugars', 'Calcium moves mainly in the xylem.'],
        ['From the air', 'Leaves take calcium from the soil solution via the roots.']], a: 0 },
    { id: 'a-k-inner', t: 1, plate: 'afternoon', b: 'ILLUSTRATIVE', src: [],
      q: 'Inside a closed romaine head, the inner leaves transpire:',
      o: [['Less than the outer leaves, because the air around them is still and humid', 'Right. The plate uses an illustrative ratio (0.15 in still air) to show the direction.'],
        ['More than the outer leaves', 'They are enclosed, so less.'],
        ['The same', 'Their air is different.']], a: 0 },
    { id: 'a-k-fog', t: 1, plate: 'afternoon', b: 'MEASURED', src: ['10.21273/hortsci.42.7.1681'],
      q: 'What does daytime marine fog do to transpiration?',
      o: [['Cuts it for every leaf, outer and inner', 'Right. Near saturated air means a tiny VPD.'],
        ['Raises it', 'Fog makes the air wetter.'],
        ['Affects only the inner leaves', 'All leaves feel the same air outside the head.']], a: 0 },
    { id: 'a-k-model', t: 1, plate: 'afternoon', b: 'ILLUSTRATIVE', src: [],
      q: 'Which of these can the model on this plate NOT tell you?',
      o: [['Where, or whether, tipburn starts', 'Right. The model has transpiration, not calcium demand or tipburn.'],
        ['Outer leaf transpiration', 'That is a model output.'],
        ['VPD', 'That is computed from the conditions.']], a: 0 },
    { id: 'a-u-ratio', t: 2, plate: 'afternoon', b: 'ILLUSTRATIVE', src: [],
      q: 'Outer leaves transpire 3.0 mmol m⁻² s⁻¹. Inner leaves transpire 0.15 times as much in still air and 0.35 times with air moved into the head. What do the inner leaves gain from moving air?',
      o: [['From 0.45 to 1.05 mmol m⁻² s⁻¹, more than double', 'Right. 3.0 × 0.15 = 0.45; 3.0 × 0.35 = 1.05. The ratios are illustrative.'],
        ['Nothing: the outer leaves are unchanged', 'The inner leaves change.'],
        ['From 3.0 to 3.5', 'Those are outer leaf numbers plus a ratio.']], a: 0 },
    { id: 'a-u-barta', t: 2, plate: 'afternoon', b: 'MEASURED', src: ['10.21273/JASHS.111.3.413'],
      q: 'Barta and Tibbitts (1986) enclosed young lettuce leaves to cut their transpiration. What happened?',
      o: [['Their calcium fell and tipburn rose', 'Right. In Buttercrunch lettuce in solution culture.'],
        ['Their calcium rose', 'The opposite.'],
        ['Nothing changed', 'Calcium and tipburn both changed.']], a: 0 },
    { id: 'a-u-fert', t: 2, plate: 'afternoon', b: 'MEASURED', src: ['10.21273/hortsci.42.7.1681'],
      q: 'In three Salinas trials, calcium fertigation did not raise romaine leaf calcium. What should a grower take from that?',
      o: [['Adding calcium to the soil may not help if delivery to the leaves, not supply, is the limit', 'Right. The question is transport, which follows transpiration.'],
        ['Use twice as much calcium', 'More supply did not change leaf calcium.'],
        ['Calcium has nothing to do with lettuce', 'Calcium is essential for new cell walls.']], a: 0 },
    { id: 'a-u-fogtip', t: 2, plate: 'afternoon', b: 'MEASURED', src: ['10.21273/hortsci.42.7.1681'],
      q: 'In the Salinas field survey, when was tipburn worst?',
      o: [['Where daytime fog cut transpiration in the final two weeks before harvest', 'Right. And it was unrelated to soil or bulk leaf calcium.'],
        ['On the hottest, driest days', 'Not in that survey.'],
        ['At planting', 'The final two weeks mattered.']], a: 0 },
    { id: 'a-u-night', t: 2, plate: 'afternoon', b: 'MEASURED', src: ['10.1104/pp.60.6.854'],
      q: 'On a humid night transpiration is near zero. Which route could still move sap, and its calcium, toward enclosed leaves?',
      o: [['Root pressure', 'Right. Enclosed, non transpiring cabbage plants still moved calcium into their leaves through root pressure flow (Palzkill and Tibbitts 1977, controlled conditions); whether that happens in a romaine head in the field is a question.'],
        ['Stomatal opening in the dark', 'Stomata are mostly shut in the dark.'],
        ['Phloem unloading of calcium', 'Calcium moves mainly in xylem.']], a: 0 },
    { id: 'a-q-ratio', t: 3, plate: 'afternoon', b: 'ILLUSTRATIVE', src: [],
      q: 'The inner leaf bar on this plate is outer E × 0.15. Can you conclude from the bars that inner leaves transpire 85 % less?',
      o: [['No: the ratio is an invented teaching value; only the direction is supported', 'Right. A number you put in is not a number you found.'],
        ['Yes, the model computed it', 'The model multiplied by a chosen constant.'],
        ['Yes, because it matches intuition', 'Intuition is not a measurement.']], a: 0 },
    { id: 'a-q-air', t: 3, plate: 'afternoon', b: 'MEASURED', src: ['10.21273/hortsci.42.7.1681'],
      q: 'Blowing air onto developing leaves reduced tipburn in controlled studies. Does that prove low transpiration causes tipburn?',
      o: [['It supports it, but moving air also changes humidity and leaf temperature, so it is consistent rather than conclusive', 'Right. Interventions change more than one thing.'],
        ['Yes, it proves it', 'It is consistent, not conclusive.'],
        ['No, air is irrelevant', 'The result says air matters.']], a: 0 },
    { id: 'p-k-why', t: 1, plate: 'plant', b: 'ILLUSTRATIVE', src: [],
      q: 'Why does a plant move so much more water than it keeps?',
      o: [['Its stomata must be open to let CO₂ in, and water vapour leaves through the same pores', 'Right. Most of the water is the price of an open door for CO₂.'],
        ['Photosynthesis uses up most of it', 'Only a very small share is split in photosynthesis; almost all leaves as vapour.'],
        ['It needs the water mainly to carry nutrients', 'The stream carries nutrients and helps, but that is not why it is so large.']], a: 0 },
    { id: 'p-u-starve', t: 2, plate: 'plant', b: 'DERIVED', src: [],
      q: 'A stoma stays exactly as open while VPD doubles from 1.5 to 3.0 kPa. What happens to water lost per CO₂ taken in?',
      o: [['It roughly doubles: E doubles with VPD, while CO₂ uptake barely changes', 'Right. E = gs × VPD ÷ Patm; the CO₂ gradient does not depend on air humidity.'],
        ['It halves', 'Drier air pulls more water out, not less.'],
        ['It stays the same, because the pore did not change', 'The pore is the same, but the pull on the water side doubled.']], a: 0 },
    { id: 'p-q-drought', t: 3, plate: 'plant', b: 'ILLUSTRATIVE', src: ['10.1093/jxb/err270', '10.1111/nph.16845'],
      q: 'One study dries cut leaves on the bench for an afternoon; another withholds water from potted plants for weeks. Why might they disagree about stomatal sensitivity?',
      o: [['A slow drought allows osmotic adjustment, ABA signalling and acclimation that a bench dehydration cannot', 'Right. The rate and the setting of the drought are part of the treatment; report the Ψ reached and how long it took.'],
        ['They cannot disagree if both measure Ψ correctly', 'Correct Ψ readings do not make the plants the same.'],
        ['Bench drying is always wrong', 'It is the right tool for vulnerability curves; it is just not a drought.']], a: 0 },
    { id: 'o-k-p50', t: 1, plate: 'organ', b: 'MEASURED', src: ['10.1093/jxb/err270'],
      q: 'What is the P50 of K<sub>leaf</sub>?',
      o: [['The leaf water potential at which leaf hydraulic conductance has fallen by half', 'Right. For Lantana camara it is ' + M + '0.80 MPa; for coast live oak ' + M + '2.40 MPa.'],
        ['The water potential at which half the stomata close', 'That is a stomatal threshold, a different quantity.'],
        ['The water potential at which half the leaves die', 'P50 is about conductance, not death.']], a: 0 },
    { id: 'o-u-1mpa', t: 2, plate: 'organ', b: 'MEASURED', src: ['10.1093/jxb/err270', '10.1093/jxb/eraa392'],
      q: 'K<sub>leaf</sub> P50: Lantana ' + M + '0.80 MPa, coast live oak ' + M + '2.40 MPa, Cabernet Sauvignon ' + M + '0.30 MPa. At ' + M + '1.0 MPa, which leaves have lost more than half their K<sub>leaf</sub>?',
      o: [['Lantana and grapevine', 'Right. Both P50s are less negative than ' + M + '1.0 MPa; the oak has not reached its own.'],
        ['Only the oak', 'The oak halves only at ' + M + '2.40 MPa.'],
        ['All three', 'The oak is still above its P50 at ' + M + '1.0 MPa.']], a: 0 },
    { id: 'o-k-optical', t: 1, plate: 'organ', b: 'MEASURED', src: ['10.1073/pnas.1522569113'],
      q: 'With the optical method, where in a drying leaf does the first embolism appear?',
      o: [['In the largest vein, the midrib', 'Right. Vulnerability rose with vein size; minor veins failed last (Brodribb, Bienaimé & Marmottant 2016).'],
        ['In the smallest minor veins', 'They failed last.'],
        ['At random anywhere in the leaf', 'The order followed vein size.']], a: 0 },
    { id: 'o-q-tlpband', t: 3, plate: 'organ', b: 'MEASURED', src: ['10.1093/jxb/erx252'],
      q: 'A meta analysis found leaves had lost 57 to 80 % of K<sub>leaf</sub> by turgor loss in flowering plants, but 30 to 81 % in gymnosperms. Why might the number depend on the method?',
      o: [['Methods differ in how leaves are dried, cut and rehydrated, and in which part of the path they load', 'Right. Each range spans the means of different methods; compare like with like.'],
        ['Because gymnosperms are measured badly', 'The range reflects methods and lineages, not quality.'],
        ['It cannot: K<sub>leaf</sub> is K<sub>leaf</sub>', 'Different methods can give different K<sub>leaf</sub> for the same leaf.']], a: 0 },
    { id: 'o-q-caragana', t: 3, plate: 'organ', b: 'MEASURED', src: ['10.1111/nph.16845'],
      q: 'In six Caragana shrubs, midrib embolism began only at ' + M + '4.0 MPa, far below their turgor loss point. Irrigated lettuce is kept well watered. Is vein embolism likely to be the first limit for an irrigated lettuce leaf?',
      o: [['Probably not; loss outside the xylem and stomatal closure come first, though no lettuce leaf vulnerability curve was found for this site', 'Right. Keep the lettuce part a hypothesis: there is no lettuce curve to check it against.'],
        ['Yes, lettuce veins must embolise first', 'No data support that, and the order in other species says otherwise.'],
        ['Caragana and lettuce must behave the same', 'Different species, different thresholds.']], a: 0 },
    { id: 't-k-ox', t: 1, plate: 'tissue', b: 'MEASURED', src: ['10.1104/pp.16.01643'],
      q: 'In eight species, where did most of the early decline in K<sub>leaf</sub> happen?',
      o: [['Outside the xylem, in the living tissue between the veins and the air', 'Right. It explained 75 to 100 % of the decline, while the veins were still mostly full.'],
        ['In the midrib xylem', 'Only 5 to 8.5 % of midrib conduits held air at turgor loss.'],
        ['In the petiole', 'The study measured the leaf; the decline was outside the xylem.']], a: 0 },
    { id: 't-u-series', t: 2, plate: 'tissue', b: 'DERIVED', src: [],
      q: 'K<sub>x</sub> = 20 and K<sub>ox</sub> = 5 mmol m⁻² s⁻¹ MPa⁻¹ (illustrative). What is K<sub>leaf</sub>, and which term matters more?',
      o: [['4; the smaller one, K<sub>ox</sub>', 'Right. 1 ÷ (1 ÷ 20 + 1 ÷ 5) = 4. Halving K<sub>ox</sub> gives 2.2; halving K<sub>x</sub> gives 3.3.'],
        ['25; they add', 'Conductances in series add as reciprocals, not directly.'],
        ['12.5; the average', 'Averaging is not how series resistances combine.']], a: 0 },
    { id: 't-q-signal', t: 3, plate: 'tissue', b: 'MEASURED', src: ['10.1104/pp.18.00743', '10.1111/pce.13722'],
      q: 'In Arabidopsis 40 to 65 % of the fall in g<sub>s</sub> was attributable to falling K<sub>leaf</sub>; in wheat at most 9.1 % of stomatal closure was. What should you conclude?',
      o: [['That the share is an open question that may depend on species and method; do not average the two', 'Right. Different species, methods and ways of partitioning the cause.'],
        ['That the true value is about 37 %', 'Averaging two different measurements of different plants hides the question.'],
        ['That one of the studies must be wrong', 'Both can be right for their plants and methods.']], a: 0 },
    { id: 't-q-recover', t: 3, plate: 'tissue', b: 'MEASURED', src: ['10.1093/jxb/err270'],
      q: 'After an hour of rehydration, K<sub>leaf</sub> recovered significantly in 4 of 10 species and fully in 2. Is “K<sub>leaf</sub> recovers when the stress ends” a fair summary?',
      o: [['No; recovery depended on the species and was often partial, so reversibility is a question to test', 'Right. And an hour is one time point: longer rehydration might change the answer.'],
        ['Yes, it always recovers', 'Six of ten species showed no significant recovery.'],
        ['No; it never recovers', 'Four species did recover, two fully.']], a: 0 },
    { id: 't-q-leafage', t: 3, plate: 'tissue', b: 'ILLUSTRATIVE', src: [],
      q: 'Does a leaf’s vulnerability to K<sub>leaf</sub> decline change as it ages? How would you find out?',
      o: [['Few studies have asked; build vulnerability curves for young, mature and old leaves of the same plants with the same method', 'Right. Same plants and same method, so age is the only difference.'],
        ['Old leaves are always more vulnerable', 'No general answer has been established.'],
        ['Age cannot matter for hydraulics', 'Anatomy and membranes change with age, so it might.']], a: 0 },
    { id: 't-u-vacuum', t: 2, plate: 'tissue', b: 'ILLUSTRATIVE', src: ['10.1104/pp.16.01643'],
      q: 'In the vacuum method for xylem conductance, why are the minor veins cut?',
      o: [['So water leaves the opened veins directly and skips the tissue outside the xylem', 'Right. The remaining resistance is the xylem; then 1 ÷ K<sub>ox</sub> = 1 ÷ K<sub>leaf</sub> − 1 ÷ K<sub>x</sub>.'],
        ['To let air into the veins', 'Air would block flow; the cuts are made under water.'],
        ['To kill the leaf so it stops transpiring', 'The cuts open a shortcut for water; they are not about killing the leaf.']], a: 0 },
    { id: 's-k-supply', t: 1, plate: 'species', b: 'DERIVED', src: [],
      q: 'Two leaves have the same stomatal opening on the same afternoon. One has four times the K<sub>leaf</sub>. How does the drop in Ψ across that leaf compare?',
      o: [['It is four times smaller', 'Right. The drop is E ÷ K<sub>leaf</sub>, and E is the same.'],
        ['It is four times larger', 'More conductance means a smaller drop for the same flow.'],
        ['It is the same', 'Only if K<sub>leaf</sub> were the same.']], a: 0 },
    { id: 's-u-caragana', t: 2, plate: 'species', b: 'MEASURED', src: ['10.1111/nph.16845'],
      q: 'Dry habitat Caragana have a higher K<sub>leaf</sub> to g<sub>s</sub> ratio. How did their stomata behave as they dried?',
      o: [['They closed more tightly, driven by more ABA, and raised water use efficiency', 'Right. High supply came with sensitive stomata, not with stomata kept open.'],
        ['They kept their stomata open longer', 'The paper reports tighter control, not looser.'],
        ['They had no stomatal response', 'They responded strongly, through ABA.']], a: 0 },
    { id: 's-q-avoid', t: 3, plate: 'species', b: 'MEASURED', src: ['10.1111/nph.16845', '10.1093/jxb/err270'],
      q: 'Is closing the stomata early a way to tolerate drought or to avoid it?',
      o: [['It depends on what you measure: early closure avoids low Ψ, while resistant pipes and a low turgor loss point tolerate it; one species can do both', 'Right. Dry habitat Caragana combine both, so the labels describe traits, not species.'],
        ['Always tolerance', 'Closing early keeps Ψ from falling, which is avoidance.'],
        ['Always avoidance, so those plants cannot be tolerant', 'They can have tolerant pipes as well.']], a: 0 }
  ];

  var TIERS = [
    { n: 1, name: 'Know it', verb: 'Recall and recognise', d: 'The words and the definitions. If these slip, nothing else holds.' },
    { n: 2, name: 'Use it', verb: 'Apply and predict', d: 'Numbers given. Work out what happens before you look.' },
    { n: 3, name: 'Question it', verb: 'Evaluate and critique', d: 'Two claims, one dataset, or a conclusion somebody drew. Is it right, and how would you know?' }
  ];
  var PLATES = { field: 'Water I, the Field', plant: 'Water II, the Plant', organ: 'Water III, the Organ', tissue: 'Water IV, the Tissue', membrane: 'Water V, the Membrane', species: 'Water VI, California and beyond', afternoon: 'Water, your Salinas afternoon' };
  WP.quiz = { tiers: TIERS, items: I, plates: PLATES };
  // site wide bank (same shape as the v7 items plus module, href and where)
  /* 13 Oct (Lead): Zailaa et al. papers are held back for now */
  I = I.filter(function (it) { return (it.src || []).indexOf('10.1093/plphys/kiae551') < 0 && (it.src || []).indexOf('10.1111/pce.15208') < 0; });
  window.WP_QUIZ_JOURNEY = { tiers: TIERS, items: I.map(function (it) { var o = {}; for (var k in it) o[k] = it[k]; o.module = 'journey'; o.stop = 'journey'; o.href = 'journey/index.html#' + it.plate; o.where = PLATES[it.plate]; return o; }), plates: PLATES };

  /* ------------------------------------------------------------ engine */
  var PASS = 4, N = 5, KEY = 'wp8-quiz';
  function ui() { return WP.ui; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function load() { var d = null; try { d = JSON.parse(window.localStorage.getItem(KEY) || 'null'); } catch (e) { d = null; } if (!d || typeof d !== 'object') d = {}; d.best = d.best || {}; d.cleared = d.cleared || {}; d.last = d.last || {}; d.scope = d.scope || {}; return d; }
  function save(d) { try { window.localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { /* storage blocked: scores live for this visit only */ } }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  function scopeOf(d, plate) { return d.scope[plate] || 'plate'; }
  function pool(t, plate, scope) { return I.filter(function (i) { return i.t === t && (scope === 'all' || i.plate === plate); }); }
  function keyOf(plate, scope) { return scope === 'all' ? 'all' : plate; }
  function isOpen(t, d, k) { return t === 1 || d.cleared[k + ':' + (t - 1)] || d.cleared[k + ':force' + t]; }
  function shortSrc(doi) {
    var s = WP.SPEC && WP.SPEC.sources[doi] ? WP.SPEC.sources[doi].label : '';
    if (!s) return 'doi ' + doi;
    var m = s.match(/^(.*?)\s(\d{4})\b/); if (!m) return s.slice(0, 40);
    var au = m[1].replace(/,\s*$/, ''), parts = au.split(/\s*(?:,|&|\band\b)\s*/).filter(Boolean), first = /^[a-z]/.test(parts[0]) ? parts[0] : parts[0].split(/\s+/)[0];
    if (/et al/.test(au) || parts.length > 2) return first + ' et al. ' + m[2];
    if (parts.length === 2) return first + ' and ' + parts[1].split(/\s+/)[0] + ' ' + m[2];
    return first + ' ' + m[2];
  }
  function sectionHTML(plate) {
    return '<section class="jq card" data-quiz="' + esc(plate) + '" aria-label="Test yourself"><p class="jq-ck">Test yourself</p>' +
      '<h3 class="jq-h">Can you use it, or only say it?</h3>' +
      '<p class="jq-dek">Five questions a round, three tiers. Know it is the words. Use it is the numbers, given to you. Question it is what plant physiologists actually do: decide whether a claim holds, and say so when the data cannot tell. Clear a tier with 4 of 5 and the next one opens. Your scores stay in this browser; nobody else sees them.</p>' +
      '<fieldset class="chips jq-scope"><legend class="vh">Which questions?</legend>' +
      '<label class="chip"><input type="radio" name="jqs-' + esc(plate) + '" value="plate"><span>This plate</span></label>' +
      '<label class="chip"><input type="radio" name="jqs-' + esc(plate) + '" value="all"><span>The whole Water Path journey</span></label></fieldset>' +
      '<ol class="jq-tiers"></ol><div class="jq-round" hidden></div>' +
      '<p class="jq-prov">If you think an answer is wrong, you may be right: tell the site author through the feedback form. <button type="button" class="jq-link" data-jq-reset>Clear my scores</button></p></section>';
  }
  function render(box) {
    var plate = box.dataset.quiz, d = load(), scope = scopeOf(d, plate), k = keyOf(plate, scope);
    Array.prototype.forEach.call(box.querySelectorAll('.jq-scope input'), function (r) { r.checked = r.value === scope; });
    box.querySelector('.jq-tiers').innerHTML = TIERS.map(function (t) {
      var o = isOpen(t.n, d, k), b = d.best[k + ':' + t.n], c = d.cleared[k + ':' + t.n], n = pool(t.n, plate, scope).length;
      var status = c ? '<span class="qs ok">Cleared · best ' + b + ' of ' + N + '</span>' : (b != null ? '<span class="qs">Best so far ' + b + ' of ' + N + '</span>' : (o ? '<span class="qs">Open</span>' : '<span class="qs lock">Clear ' + TIERS[t.n - 2].name + ' with ' + PASS + ' of ' + N + ' to open</span>'));
      return '<li class="jq-tier' + (o ? '' : ' locked') + (c ? ' done' : '') + '"><div class="tn">' + t.n + '</div><div class="tb"><h4>' + t.name + '</h4><p class="tv">' + t.verb + '</p><p>' + t.d + '</p>' + status +
        '<div class="row">' + (o ? '<button class="btn small jq-go" type="button" data-jq-start="' + t.n + '">' + (b != null ? 'Another ' + N : 'Start: ' + N + ' questions') + '</button>' :
          '<button class="btn small" type="button" data-jq-force="' + t.n + '">Open it anyway</button>') + '<span class="qn">' + n + ' in the pool</span></div></div></li>';
    }).join('');
  }
  function start(box, t) {
    var plate = box.dataset.quiz, d = load(), scope = scopeOf(d, plate), k = keyOf(plate, scope), p = pool(t, plate, scope), last = d.last[k + ':' + t] || [];
    var pick = shuffle(p.filter(function (i) { return last.indexOf(i.id) < 0; })).concat(shuffle(p.filter(function (i) { return last.indexOf(i.id) >= 0; }))).slice(0, Math.min(N, p.length));
    d.last[k + ':' + t] = pick.map(function (i) { return i.id; }); save(d);
    box._q = { t: t, k: k, items: pick.map(function (i) { return { it: i, order: shuffle(i.o.map(function (_, j) { return j; })), pick: null }; }), i: 0 };
    box.querySelector('.jq-tiers').hidden = true; box.querySelector('.jq-scope').hidden = true; box.querySelector('.jq-round').hidden = false;
    item(box);
  }
  function item(box) {
    var R = box._q, X = R.items[R.i], it = X.it, T = TIERS[R.t - 1], nm = 'jq-' + box.dataset.quiz;
    var h = '<p class="qhead"><span>' + T.name + ' · ' + (R.i + 1) + ' of ' + R.items.length + '</span><a href="#' + esc(it.plate) + '">' + esc(PLATES[it.plate]) + '</a></p>' +
      '<div class="jq-q"><p class="q" tabindex="-1">' + it.q + '</p><fieldset class="chips stack"><legend class="vh">Your answer</legend>' +
      X.order.map(function (j) { return '<label class="chip"><input type="radio" name="' + nm + '" value="' + j + '"><span>' + it.o[j][0] + '</span></label>'; }).join('') +
      '</fieldset><div class="row"><button class="btn small jq-go" type="button" data-jq-check disabled>Check</button></div><div class="ans" hidden role="status"></div></div>' +
      '<div class="row"><button class="btn small" type="button" data-jq-quit>Leave this round</button></div>';
    var rd = box.querySelector('.jq-round'); rd.innerHTML = h;
    var q = rd.querySelector('.q'); if (q) try { q.focus({ preventScroll: true }); } catch (e) { /* ok */ }
  }
  function reveal(box) {
    var R = box._q, X = R.items[R.i], it = X.it, rd = box.querySelector('.jq-round');
    var v = rd.querySelector('input[type=radio]:checked'); if (!v) return;
    var k = +v.value, ok = k === it.a; X.pick = k;
    Array.prototype.forEach.call(rd.querySelectorAll('input[type=radio]'), function (r) { r.disabled = true; var lab = r.parentNode, j = +r.value; if (j === it.a) lab.classList.add('right'); else if (j === k) lab.classList.add('wrong'); });
    var why = function (i) { return it.o[i][1].replace(/^Right\.\s*/, ''); };
    var h = '<h4>' + (ok ? 'Right.' : 'Not this one.') + '</h4><p><b>' + (ok ? 'Why' : 'Your answer') + ':</b> ' + (ok ? why(k) : it.o[k][0] + '. ' + why(k)) + '</p>';
    if (!ok) h += '<p><b>The answer:</b> ' + it.o[it.a][0] + '. ' + why(it.a) + '</p>';
    h += '<p class="prov">' + ui().badge(it.b || 'ILLUSTRATIVE') + ' ' + (it.src || []).map(function (doi) { if (ui().cite) ui().cite(doi); return '<a class="cite" href="https://doi.org/' + esc(doi) + '" target="_blank" rel="noopener">' + esc(shortSrc(doi)) + '</a>'; }).join(' · ') + '</p>';
    h += '<div class="row"><button class="btn small jq-go" type="button" data-jq-next>' + (R.i < R.items.length - 1 ? 'Next question' : 'See how you did') + '</button></div>';
    var a = rd.querySelector('.ans'); a.innerHTML = h; a.hidden = false; rd.querySelector('[data-jq-check]').hidden = true;
  }
  function finish(box) {
    var R = box._q, d = load(), score = R.items.filter(function (X) { return X.pick === X.it.a; }).length, key = R.k + ':' + R.t;
    if (d.best[key] == null || score > d.best[key]) d.best[key] = score;
    var cleared = score >= PASS && R.items.length >= N; if (cleared) d.cleared[key] = 1; save(d);
    var nxt = TIERS[R.t];
    var h = '<div class="qend" role="status"><h4 tabindex="-1">' + score + ' of ' + R.items.length + '</h4><p>' +
      (cleared ? (nxt ? TIERS[R.t - 1].name + ' is cleared. ' + nxt.name + ' is open.' : 'All three tiers are cleared. The next thing to question is this site: tell the site author where it is wrong, through the feedback form.') :
        'Clearing this tier takes ' + PASS + ' of ' + N + '. Read the ones you missed, then try another five. The next round draws different questions where the pool allows.') + '</p></div>' +
      '<ol class="review">' + R.items.map(function (X) { var ok = X.pick === X.it.a; return '<li class="' + (ok ? 'ok' : 'no') + '"><span class="mk">' + (ok ? 'Right' : 'Missed') + '</span> ' + X.it.q + (ok ? '' : '<span class="why">The answer: ' + X.it.o[X.it.a][0] + '.</span>') + '</li>'; }).join('') + '</ol>' +
      '<div class="row"><button class="btn small jq-go" type="button" data-jq-again>Another ' + N + ' from ' + TIERS[R.t - 1].name + '</button>' + (cleared && nxt ? '<button class="btn small" type="button" data-jq-up>Go to ' + nxt.name + '</button>' : '') + '<button class="btn small" type="button" data-jq-quit>All tiers</button></div>';
    box.querySelector('.jq-round').innerHTML = h;
    var hh = box.querySelector('.qend h4'); if (hh) try { hh.focus({ preventScroll: true }); } catch (e) { /* ok */ }
  }
  function home(box) { box._q = null; var rd = box.querySelector('.jq-round'); rd.hidden = true; rd.innerHTML = ''; box.querySelector('.jq-tiers').hidden = false; box.querySelector('.jq-scope').hidden = false; render(box); }
  document.addEventListener('change', function (e) {
    var r = e.target; if (!r || !r.closest) return;
    var box = r.closest('.jq'); if (!box) return;
    if (r.closest('.jq-scope')) { var d = load(); d.scope[box.dataset.quiz] = r.value; save(d); render(box); }
    else if (r.type === 'radio') { var c = box.querySelector('[data-jq-check]'); if (c) c.disabled = false; }
  });
  document.addEventListener('click', function (e) {
    var t = e.target; if (!t || !t.closest) return;
    var box = t.closest('.jq'); if (!box) return;
    var b;
    if ((b = t.closest('[data-jq-start]'))) start(box, +b.dataset.jqStart);
    else if ((b = t.closest('[data-jq-force]'))) { var d = load(), k = keyOf(box.dataset.quiz, scopeOf(d, box.dataset.quiz)); d.cleared[k + ':force' + b.dataset.jqForce] = 1; save(d); render(box); }
    else if (t.closest('[data-jq-check]')) reveal(box);
    else if (t.closest('[data-jq-next]')) { if (box._q.i < box._q.items.length - 1) { box._q.i++; item(box); } else finish(box); }
    else if (t.closest('[data-jq-again]')) start(box, box._q.t);
    else if (t.closest('[data-jq-up]')) start(box, box._q.t + 1);
    else if (t.closest('[data-jq-quit]')) home(box);
    else if (t.closest('[data-jq-reset]')) { if (window.confirm('Clear every Test yourself score on this device?')) { save({}); Array.prototype.forEach.call(document.querySelectorAll('.jq[data-quiz]'), home); } }
  });

  var CSS = '\
.jq{margin:22px 0 8px;padding:14px 16px}\
.jq .jq-ck{margin:0;font-family:var(--ui);font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--accent);font-weight:600}\
.jq .jq-h{margin:2px 0 6px;font-family:var(--text);font-size:24px;font-weight:500}\
.jq .jq-dek{font-size:16px;color:var(--ink2);margin:0 0 10px;max-width:60em}\
.jq .jq-scope{border:0;padding:0;margin:0 0 12px;display:flex;flex-wrap:wrap;gap:6px}\
.jq .chip input{position:absolute;opacity:0;pointer-events:none}\
.jq .chip{position:relative;display:inline-flex;align-items:center}\
.jq .chip:has(input:checked){background:var(--ink);color:var(--paper);border-color:var(--ink)}\
.jq .chip:has(input:focus-visible){outline:2px solid var(--accent);outline-offset:2px}\
.jq .jq-tiers{list-style:none;margin:0;padding:0;display:grid;gap:10px}\
.jq .jq-tier{display:grid;grid-template-columns:44px minmax(0,1fr);gap:10px;background:var(--paper);border:1px solid var(--rule);border-radius:4px;padding:10px 12px}\
.jq .jq-tier .tn{font-family:var(--disp);font-size:30px;line-height:1;color:var(--accent);text-align:center}\
.jq .jq-tier h4{margin:0;font-family:var(--ui);font-size:16px}\
.jq .jq-tier .tv{margin:0;font-family:var(--ui);font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--ink2)}\
.jq .jq-tier p{margin:4px 0;font-size:15.5px}\
.jq .jq-tier.locked{opacity:.75}.jq .jq-tier.done{border-color:var(--b-ver,var(--accent))}\
.jq .qs{display:inline-block;font-family:var(--ui);font-size:12.5px;color:var(--ink2);margin:2px 0 6px}\
.jq .qs.ok{color:var(--b-ver,var(--accent));font-weight:600}.jq .qs.lock{font-style:italic}\
.jq .row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:6px}\
.jq .qn{font-family:var(--ui);font-size:12.5px;color:var(--ink2)}\
.jq .jq-go{background:var(--accent);color:var(--accent-ink);border-color:var(--accent)}\
.jq .qhead{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;font-family:var(--ui);font-size:13px;color:var(--ink2);margin:0 0 6px}\
.jq .jq-q{background:var(--paper);border:1px solid var(--rule);border-left:3px solid var(--accent);padding:10px 14px;border-radius:3px}\
.jq .jq-q .q{font-size:17px;font-weight:600;margin:0 0 10px;outline:none}\
.jq .chips.stack{display:grid;gap:6px;border:0;padding:0;margin:0}\
.jq .chips.stack .chip{border-radius:8px;text-align:left;justify-content:flex-start;padding:8px 12px;height:auto;line-height:1.35}\
.jq .chip.right{border-color:var(--b-ver,#2e7d32);box-shadow:inset 0 0 0 2px var(--b-ver,#2e7d32)}\
.jq .chip.wrong{border-color:var(--b-pre,#b3541e);box-shadow:inset 0 0 0 2px var(--b-pre,#b3541e)}\
.jq .ans{margin-top:10px;font-size:15.5px}.jq .ans h4{margin:0 0 4px;font-family:var(--ui)}\
.jq .prov{font-family:var(--ui);font-size:12.5px;display:flex;flex-wrap:wrap;gap:6px;align-items:center}\
.jq .qend h4{font-family:var(--disp);font-size:34px;margin:4px 0;outline:none}\
.jq .review{padding-left:18px;font-size:15px}.jq .review li{margin:4px 0}\
.jq .review .mk{font-family:var(--ui);font-size:11.5px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;margin-right:4px}\
.jq .review li.ok .mk{color:var(--b-ver,#2e7d32)}.jq .review li.no .mk{color:var(--b-pre,#b3541e)}\
.jq .review .why{display:block;color:var(--ink2);font-size:14px}\
.jq .jq-prov{font-family:var(--ui);font-size:12.5px;color:var(--ink2);margin:12px 0 0}\
.jq .jq-link{background:none;border:0;padding:0;color:var(--accent);text-decoration:underline;cursor:pointer;font:inherit;min-height:24px}\
html[data-class] .jq{display:none}';

  function mountAll() {
    if (!document.getElementById('jq-css')) { var st = document.createElement('style'); st.id = 'jq-css'; st.textContent = CSS; document.head.appendChild(st); }
    Object.keys(PLATES).forEach(function (p) {
      var body = document.getElementById('lv-' + p); if (!body || body.querySelector('.jq')) return;
      var w = document.createElement('div'); w.innerHTML = sectionHTML(p); var box = w.firstChild; body.appendChild(box); render(box);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountAll); else mountAll();
  setTimeout(mountAll, 0);
})();

/* The Water Path v8: l_species.js, Plate VI "California and beyond" (hash #species). W owner, round 1, 11 Oct 2026.
   Crops and wild California, desert and tropical species on the same axes, from published values only.
   - Explorer: leaf view (turgor loss point against Kleaf P50, Scoffoni et al. 2011 + Albuquerque et al. 2020) and stem view
     (minimum field Ψ against stem P50, with hydraulic safety margin bands). Filters by biome; every point opens its evidence.
   - Build a plant: set TLP, stem P50, gmin and rooting depth and watch it through a dry season in Salinas, an inland valley
     or the Santa Monica Mountains. The model is ILLUSTRATIVE; its trait presets carry their own badges.
   - Chaparral extremes gauge, rooting depth, gmin and the heat question, the Agave root gap (mol.js root scene).
   Data: the S-water sheet, injected by /home/claude/v8/night/tools/gen_species_data.py between the SHEET markers. Do not
   type numbers into this file by hand; every plotted value is read from SHEET by key. */
(function () {
  'use strict';
  var WP = window.WP = window.WP || {};
  WP.levels = WP.levels || [];
  var SHEET = /*SHEET-BEGIN*/{"sp.cerc_betu.kleafmax":{"claim":"Cercocarpus betuloides: maximum leaf hydraulic conductance 4.36 mmol m−2 s−1 MPa−1","value":4.36,"units":"mmol m−2 s−1 MPa−1","species":"Cercocarpus betuloides","trait":"Kleaf_max","organ":"leaf","group":"chaparral","method":"Kleaf by evaporative flux method (steady state, high irradiance), vulnerability by maximum likelihood on unbinned data; pressure volume curves","cite":"Scoffoni et al. 2012 (online 2011) J Exp Bot 63: 643 to 658, Table 2","doi":"10.1093/jxb/err270","journal":"J Exp Bot","badge":"VERIFIED"},"sp.cerc_betu.kleafp50":{"claim":"Cercocarpus betuloides: leaf hydraulic conductance falls by half at −2.76 MPa (P80 −5.25 MPa)","value":-2.76,"units":"MPa","species":"Cercocarpus betuloides","trait":"Kleaf_P50","organ":"leaf","group":"chaparral","method":"Kleaf by evaporative flux method (steady state, high irradiance), vulnerability by maximum likelihood on unbinned data; pressure volume curves","cite":"Scoffoni et al. 2012 (online 2011) J Exp Bot 63: 643 to 658, Table 2","doi":"10.1093/jxb/err270","journal":"J Exp Bot","badge":"VERIFIED","note":"P80 = −5.25 MPa"},"sp.cerc_betu.tlp":{"claim":"Cercocarpus betuloides: turgor loss point −2.59 MPa; osmotic potential at full turgor −1.64 MPa; bulk modulus 10.1 MPa","value":-2.59,"units":"MPa","species":"Cercocarpus betuloides","trait":"TLP","organ":"leaf","group":"chaparral","method":"pressure volume curves","cite":"Scoffoni et al. 2012 (online 2011) J Exp Bot 63: 643 to 658, Table 2","doi":"10.1093/jxb/err270","journal":"J Exp Bot","badge":"VERIFIED","note":"pi_o = −1.64 MPa; epsilon = 10.1 MPa"},"sp.coma_dive.kleafmax":{"claim":"Comarostaphylis diversifolia: maximum leaf hydraulic conductance 2.96 mmol m−2 s−1 MPa−1","value":2.96,"units":"mmol m−2 s−1 MPa−1","species":"Comarostaphylis diversifolia","trait":"Kleaf_max","organ":"leaf","group":"chaparral","method":"Kleaf by evaporative flux method (steady state, high irradiance), vulnerability by maximum likelihood on unbinned data; pressure volume curves","cite":"Scoffoni et al. 2012 (online 2011) J Exp Bot 63: 643 to 658, Table 2","doi":"10.1093/jxb/err270","journal":"J Exp Bot","badge":"VERIFIED"},"sp.coma_dive.kleafp50":{"claim":"Comarostaphylis diversifolia: leaf hydraulic conductance falls by half at −2.85 MPa (P80 −4.56 MPa)","value":-2.85,"units":"MPa","species":"Comarostaphylis diversifolia","trait":"Kleaf_P50","organ":"leaf","group":"chaparral","method":"Kleaf by evaporative flux method (steady state, high irradiance), vulnerability by maximum likelihood on unbinned data; pressure volume curves","cite":"Scoffoni et al. 2012 (online 2011) J Exp Bot 63: 643 to 658, Table 2","doi":"10.1093/jxb/err270","journal":"J Exp Bot","badge":"VERIFIED","note":"P80 = −4.56 MPa"},"sp.coma_dive.tlp":{"claim":"Comarostaphylis diversifolia: turgor loss point −3.45 MPa; osmotic potential at full turgor −2.51 MPa; bulk modulus 17.3 MPa","value":-3.45,"units":"MPa","species":"Comarostaphylis diversifolia","trait":"TLP","organ":"leaf","group":"chaparral","method":"pressure volume curves","cite":"Scoffoni et al. 2012 (online 2011) J Exp Bot 63: 643 to 658, Table 2","doi":"10.1093/jxb/err270","journal":"J Exp Bot","badge":"VERIFIED","note":"pi_o = −2.51 MPa; epsilon = 17.3 MPa"},"sp.hete_arbu.kleafmax":{"claim":"Heteromeles arbutifolia: maximum leaf hydraulic conductance 20.7 mmol m−2 s−1 MPa−1","value":20.7,"units":"mmol m−2 s−1 MPa−1","species":"Heteromeles arbutifolia","trait":"Kleaf_max","organ":"leaf","group":"chaparral","method":"Kleaf by evaporative flux method (steady state, high irradiance), vulnerability by maximum likelihood on unbinned data; pressure volume curves","cite":"Scoffoni et al. 2012 (online 2011) J Exp Bot 63: 643 to 658, Table 2","doi":"10.1093/jxb/err270","journal":"J Exp Bot","badge":"VERIFIED"},"sp.hete_arbu.kleafp50":{"claim":"Heteromeles arbutifolia: leaf hydraulic conductance falls by half at −2.57 MPa (P80 −4.12 MPa)","value":-2.57,"units":"MPa","species":"Heteromeles arbutifolia","trait":"Kleaf_P50","organ":"leaf","group":"chaparral","method":"Kleaf by evaporative flux method (steady state, high irradiance), vulnerability by maximum likelihood on unbinned data; pressure volume curves","cite":"Scoffoni et al. 2012 (online 2011) J Exp Bot 63: 643 to 658, Table 2","doi":"10.1093/jxb/err270","journal":"J Exp Bot","badge":"VERIFIED","note":"P80 = −4.12 MPa"},"sp.hete_arbu.tlp":{"claim":"Heteromeles arbutifolia: turgor loss point −2.53 MPa; osmotic potential at full turgor −2.08 MPa; bulk modulus 16.4 MPa","value":-2.53,"units":"MPa","species":"Heteromeles arbutifolia","trait":"TLP","organ":"leaf","group":"chaparral","method":"pressure volume curves","cite":"Scoffoni et al. 2012 (online 2011) J Exp Bot 63: 643 to 658, Table 2","doi":"10.1093/jxb/err270","journal":"J Exp Bot","badge":"VERIFIED","note":"pi_o = −2.08 MPa; epsilon = 16.4 MPa"},"sp.quer_agri.kleafmax":{"claim":"Quercus agrifolia: maximum leaf hydraulic conductance 3.96 mmol m−2 s−1 MPa−1","value":3.96,"units":"mmol m−2 s−1 MPa−1","species":"Quercus agrifolia","trait":"Kleaf_max","organ":"leaf","group":"California oak woodland","method":"Kleaf by evaporative flux method (steady state, high irradiance), vulnerability by maximum likelihood on unbinned data; pressure volume curves","cite":"Scoffoni et al. 2012 (online 2011) J Exp Bot 63: 643 to 658, Table 2","doi":"10.1093/jxb/err270","journal":"J Exp Bot","badge":"VERIFIED"},"sp.quer_agri.kleafp50":{"claim":"Quercus agrifolia: leaf hydraulic conductance falls by half at −2.40 MPa (P80 −3.83 MPa)","value":-2.4,"units":"MPa","species":"Quercus agrifolia","trait":"Kleaf_P50","organ":"leaf","group":"California oak woodland","method":"Kleaf by evaporative flux method (steady state, high irradiance), vulnerability by maximum likelihood on unbinned data; pressure volume curves","cite":"Scoffoni et al. 2012 (online 2011) J Exp Bot 63: 643 to 658, Table 2","doi":"10.1093/jxb/err270","journal":"J Exp Bot","badge":"VERIFIED","note":"P80 = −3.83 MPa"},"sp.quer_agri.tlp":{"claim":"Quercus agrifolia: turgor loss point −3.00 MPa; osmotic potential at full turgor −2.31 MPa; bulk modulus 12.8 MPa","value":-3.0,"units":"MPa","species":"Quercus agrifolia","trait":"TLP","organ":"leaf","group":"California oak woodland","method":"pressure volume curves","cite":"Scoffoni et al. 2012 (online 2011) J Exp Bot 63: 643 to 658, Table 2","doi":"10.1093/jxb/err270","journal":"J Exp Bot","badge":"VERIFIED","note":"pi_o = −2.31 MPa; epsilon = 12.8 MPa"},"sp.hede_cana.kleafmax":{"claim":"Hedera canariensis: maximum leaf hydraulic conductance 5.73 mmol m−2 s−1 MPa−1","value":5.73,"units":"mmol m−2 s−1 MPa−1","species":"Hedera canariensis","trait":"Kleaf_max","organ":"leaf","group":"garden (dry habitat origin, Canary Islands)","method":"Kleaf by evaporative flux method (steady state, high irradiance), vulnerability by maximum likelihood on unbinned data; pressure volume curves","cite":"Scoffoni et al. 2012 (online 2011) J Exp Bot 63: 643 to 658, Table 2","doi":"10.1093/jxb/err270","journal":"J Exp Bot","badge":"VERIFIED"},"sp.hede_cana.kleafp50":{"claim":"Hedera canariensis: leaf hydraulic conductance falls by half at −0.64 MPa (P80 −1.18 MPa)","value":-0.64,"units":"MPa","species":"Hedera canariensis","trait":"Kleaf_P50","organ":"leaf","group":"garden (dry habitat origin, Canary Islands)","method":"Kleaf by evaporative flux method (steady state, high irradiance), vulnerability by maximum likelihood on unbinned data; pressure volume curves","cite":"Scoffoni et al. 2012 (online 2011) J Exp Bot 63: 643 to 658, Table 2","doi":"10.1093/jxb/err270","journal":"J Exp Bot","badge":"VERIFIED","note":"P80 = −1.18 MPa"},"sp.hede_cana.tlp":{"claim":"Hedera canariensis: turgor loss point −1.98 MPa; osmotic potential at full turgor −1.49 MPa; bulk modulus 17.9 MPa","value":-1.98,"units":"MPa","species":"Hedera canariensis","trait":"TLP","organ":"leaf","group":"garden (dry habitat origin, Canary Islands)","method":"pressure volume curves","cite":"Scoffoni et al. 2012 (online 2011) J Exp Bot 63: 643 to 658, Table 2","doi":"10.1093/jxb/err270","journal":"J Exp Bot","badge":"VERIFIED","note":"pi_o = −1.49 MPa; epsilon = 17.9 MPa"},"sp.plat_race.kleafmax":{"claim":"Platanus racemosa: maximum leaf hydraulic conductance 34.1 mmol m−2 s−1 MPa−1","value":34.1,"units":"mmol m−2 s−1 MPa−1","species":"Platanus racemosa","trait":"Kleaf_max","organ":"leaf","group":"California riparian","method":"Kleaf by evaporative flux method (steady state, high irradiance), vulnerability by maximum likelihood on unbinned data; pressure volume curves","cite":"Scoffoni et al. 2012 (online 2011) J Exp Bot 63: 643 to 658, Table 2","doi":"10.1093/jxb/err270","journal":"J Exp Bot","badge":"VERIFIED"},"sp.plat_race.kleafp50":{"claim":"Platanus racemosa: leaf hydraulic conductance falls by half at −0.09 MPa (P80 −0.35 MPa)","value":-0.09,"units":"MPa","species":"Platanus racemosa","trait":"Kleaf_P50","organ":"leaf","group":"California riparian","method":"Kleaf by evaporative flux method (steady state, high irradiance), vulnerability by maximum likelihood on unbinned data; pressure volume curves","cite":"Scoffoni et al. 2012 (online 2011) J Exp Bot 63: 643 to 658, Table 2","doi":"10.1093/jxb/err270","journal":"J Exp Bot","badge":"VERIFIED","note":"P80 = −0.35 MPa"},"sp.plat_race.tlp":{"claim":"Platanus racemosa: turgor loss point −2.03 MPa; osmotic potential at full turgor −1.54 MPa; bulk modulus 4.85 MPa","value":-2.03,"units":"MPa","species":"Platanus racemosa","trait":"TLP","organ":"leaf","group":"California riparian","method":"pressure volume curves","cite":"Scoffoni et al. 2012 (online 2011) J Exp Bot 63: 643 to 658, Table 2","doi":"10.1093/jxb/err270","journal":"J Exp Bot","badge":"VERIFIED","note":"pi_o = −1.54 MPa; epsilon = 4.85 MPa"},"sp.came_sasa.kleafmax":{"claim":"Camellia sasanqua: maximum leaf hydraulic conductance 5.99 mmol m−2 s−1 MPa−1","value":5.99,"units":"mmol m−2 s−1 MPa−1","species":"Camellia sasanqua","trait":"Kleaf_max","organ":"leaf","group":"garden (moist habitat)","method":"Kleaf by evaporative flux method (steady state, high irradiance), vulnerability by maximum likelihood on unbinned data; pressure volume curves","cite":"Scoffoni et al. 2012 (online 2011) J Exp Bot 63: 643 to 658, Table 2","doi":"10.1093/jxb/err270","journal":"J Exp Bot","badge":"VERIFIED"},"sp.came_sasa.kleafp50":{"claim":"Camellia sasanqua: leaf hydraulic conductance falls by half at −1.78 MPa (P80 −2.84 MPa)","value":-1.78,"units":"MPa","species":"Camellia sasanqua","trait":"Kleaf_P50","organ":"leaf","group":"garden (moist habitat)","method":"Kleaf by evaporative flux method (steady state, high irradiance), vulnerability by maximum likelihood on unbinned data; pressure volume curves","cite":"Scoffoni et al. 2012 (online 2011) J Exp Bot 63: 643 to 658, Table 2","doi":"10.1093/jxb/err270","journal":"J Exp Bot","badge":"VERIFIED","note":"P80 = −2.84 MPa"},"sp.came_sasa.tlp":{"claim":"Camellia sasanqua: turgor loss point −2.12 MPa; osmotic potential at full turgor −1.61 MPa; bulk modulus 7.98 MPa","value":-2.12,"units":"MPa","species":"Camellia sasanqua","trait":"TLP","organ":"leaf","group":"garden (moist habitat)","method":"pressure volume curves","cite":"Scoffoni et al. 2012 (online 2011) J Exp Bot 63: 643 to 658, Table 2","doi":"10.1093/jxb/err270","journal":"J Exp Bot","badge":"VERIFIED","note":"pi_o = −1.61 MPa; epsilon = 7.98 MPa"},"sp.heli_annu.kleafmax":{"claim":"Helianthus annuus: maximum leaf hydraulic conductance 6.45 mmol m−2 s−1 MPa−1","value":6.45,"units":"mmol m−2 s−1 MPa−1","species":"Helianthus annuus","trait":"Kleaf_max","organ":"leaf","group":"crop","method":"Kleaf by evaporative flux method (steady state, high irradiance), vulnerability by maximum likelihood on unbinned data; pressure volume curves","cite":"Scoffoni et al. 2012 (online 2011) J Exp Bot 63: 643 to 658, Table 2","doi":"10.1093/jxb/err270","journal":"J Exp Bot","badge":"VERIFIED"},"sp.heli_annu.kleafp50":{"claim":"Helianthus annuus: leaf hydraulic conductance falls by half at −0.83 MPa (P80 −1.16 MPa)","value":-0.83,"units":"MPa","species":"Helianthus annuus","trait":"Kleaf_P50","organ":"leaf","group":"crop","method":"Kleaf by evaporative flux method (steady state, high irradiance), vulnerability by maximum likelihood on unbinned data; pressure volume curves","cite":"Scoffoni et al. 2012 (online 2011) J Exp Bot 63: 643 to 658, Table 2","doi":"10.1093/jxb/err270","journal":"J Exp Bot","badge":"VERIFIED","note":"P80 = −1.16 MPa"},"sp.heli_annu.tlp":{"claim":"Helianthus annuus: turgor loss point −1.09 MPa; osmotic potential at full turgor −0.875 MPa; bulk modulus 13.3 MPa","value":-1.09,"units":"MPa","species":"Helianthus annuus","trait":"TLP","organ":"leaf","group":"crop","method":"pressure volume curves","cite":"Scoffoni et al. 2012 (online 2011) J Exp Bot 63: 643 to 658, Table 2","doi":"10.1093/jxb/err270","journal":"J Exp Bot","badge":"VERIFIED","note":"pi_o = −0.875 MPa; epsilon = 13.3 MPa"},"sp.lant_cama.kleafmax":{"claim":"Lantana camara: maximum leaf hydraulic conductance 11.4 mmol m−2 s−1 MPa−1","value":11.4,"units":"mmol m−2 s−1 MPa−1","species":"Lantana camara","trait":"Kleaf_max","organ":"leaf","group":"tropical shrub (pantropical)","method":"Kleaf by evaporative flux method (steady state, high irradiance), vulnerability by maximum likelihood on unbinned data; pressure volume curves","cite":"Scoffoni et al. 2012 (online 2011) J Exp Bot 63: 643 to 658, Table 2","doi":"10.1093/jxb/err270","journal":"J Exp Bot","badge":"VERIFIED"},"sp.lant_cama.kleafp50":{"claim":"Lantana camara: leaf hydraulic conductance falls by half at −0.80 MPa (P80 −1.41 MPa)","value":-0.8,"units":"MPa","species":"Lantana camara","trait":"Kleaf_P50","organ":"leaf","group":"tropical shrub (pantropical)","method":"Kleaf by evaporative flux method (steady state, high irradiance), vulnerability by maximum likelihood on unbinned data; pressure volume curves","cite":"Scoffoni et al. 2012 (online 2011) J Exp Bot 63: 643 to 658, Table 2","doi":"10.1093/jxb/err270","journal":"J Exp Bot","badge":"VERIFIED","note":"P80 = −1.41 MPa"},"sp.lant_cama.tlp":{"claim":"Lantana camara: turgor loss point −1.37 MPa; osmotic potential at full turgor −1.1 MPa; bulk modulus 9.14 MPa","value":-1.37,"units":"MPa","species":"Lantana camara","trait":"TLP","organ":"leaf","group":"tropical shrub (pantropical)","method":"pressure volume curves","cite":"Scoffoni et al. 2012 (online 2011) J Exp Bot 63: 643 to 658, Table 2","doi":"10.1093/jxb/err270","journal":"J Exp Bot","badge":"VERIFIED","note":"pi_o = −1.1 MPa; epsilon = 9.14 MPa"},"sp.magn_gran.kleafmax":{"claim":"Magnolia grandiflora: maximum leaf hydraulic conductance 5.24 mmol m−2 s−1 MPa−1","value":5.24,"units":"mmol m−2 s−1 MPa−1","species":"Magnolia grandiflora","trait":"Kleaf_max","organ":"leaf","group":"garden (moist habitat)","method":"Kleaf by evaporative flux method (steady state, high irradiance), vulnerability by maximum likelihood on unbinned data; pressure volume curves","cite":"Scoffoni et al. 2012 (online 2011) J Exp Bot 63: 643 to 658, Table 2","doi":"10.1093/jxb/err270","journal":"J Exp Bot","badge":"VERIFIED"},"sp.magn_gran.kleafp50":{"claim":"Magnolia grandiflora: leaf hydraulic conductance falls by half at −0.42 MPa (P80 −2.06 MPa)","value":-0.42,"units":"MPa","species":"Magnolia grandiflora","trait":"Kleaf_P50","organ":"leaf","group":"garden (moist habitat)","method":"Kleaf by evaporative flux method (steady state, high irradiance), vulnerability by maximum likelihood on unbinned data; pressure volume curves","cite":"Scoffoni et al. 2012 (online 2011) J Exp Bot 63: 643 to 658, Table 2","doi":"10.1093/jxb/err270","journal":"J Exp Bot","badge":"VERIFIED","note":"P80 = −2.06 MPa"},"sp.magn_gran.tlp":{"claim":"Magnolia grandiflora: turgor loss point −2.06 MPa; osmotic potential at full turgor −1.43 MPa; bulk modulus 5.49 MPa","value":-2.06,"units":"MPa","species":"Magnolia grandiflora","trait":"TLP","organ":"leaf","group":"garden (moist habitat)","method":"pressure volume curves","cite":"Scoffoni et al. 2012 (online 2011) J Exp Bot 63: 643 to 658, Table 2","doi":"10.1093/jxb/err270","journal":"J Exp Bot","badge":"VERIFIED","note":"pi_o = −1.43 MPa; epsilon = 5.49 MPa"},"grp.scoffoni11.dry_vs_moist":{"claim":"Mean turgor loss point: dry habitat species −2.71 MPa, moist habitat species −1.74 MPa; Kleaf P50 −2.24 vs −0.78 MPa","value":{"TLP_dry":-2.71,"TLP_moist":-1.74,"P50_dry":-2.24,"P50_moist":-0.78},"units":"MPa","species":"10 species (5 dry habitat, mostly California chaparral; 5 moist habitat)","trait":"TLP, Kleaf_P50","organ":"leaf","group":"group mean","method":"Kleaf by evaporative flux method (steady state, high irradiance), vulnerability by maximum likelihood on unbinned data; pressure volume curves","cite":"Scoffoni et al. 2012 (online 2011) J Exp Bot 63: 643 to 658, Table 2","doi":"10.1093/jxb/err270","journal":"J Exp Bot","badge":"VERIFIED","note":"Use as the stand in for biome means until Bartlett et al. 2012 biome table is retrieved. P80 dry −3.79, moist −1.56 MPa."},"sp.quer_agri.p50stem":{"claim":"Coast live oak stem xylem loses half its conductivity at −1.96 MPa (14.2 cm stems); −1.79 MPa in 25.2 cm stems, not different","value":-1.96,"units":"MPa","species":"Quercus agrifolia","trait":"P50_stem","organ":"stem","group":"California oak woodland","method":"centrifuge, 14.2 cm segments; repeat with 25.2 cm rotor; native PLC checks","cite":"Chacon et al. 2020 PLoS One 15: e0230868, Table 1 and Results","doi":"10.1371/journal.pone.0230868","journal":"PLoS One","badge":"VERIFIED","journal_flag":"PLoS One: peer reviewed, broad scope; acceptable, not a top specialist journal","note":"Ring porous, max vessel length 0.89 m. Site: Santa Cruz, central California coast, summer 2014 drought."},"sp.quer_agri.tlp_cc":{"claim":"Coast live oak turgor loss point −2.58 ± 0.5 MPa; osmotic potential at full turgor −2.15 MPa; bulk modulus 30.6 MPa","value":-2.58,"units":"MPa","species":"Quercus agrifolia","trait":"TLP","organ":"leaf","group":"California oak woodland","method":"pressure volume curves, 2019","cite":"Chacon et al. 2020 PLoS One 15: e0230868, Table 1 and Results","doi":"10.1371/journal.pone.0230868","journal":"PLoS One","badge":"VERIFIED","journal_flag":"PLoS One: peer reviewed, broad scope; acceptable, not a top specialist journal","note":"Compare Scoffoni 2011 Los Angeles plants: −3.00 MPa. Population and method differences; show both."},"sp.quer_agri.psimin":{"claim":"Coast live oak minimum midday water potential in the 2014 drought −2.5 MPa","value":-2.5,"units":"MPa","species":"Quercus agrifolia","trait":"Psi_min","organ":"leaf","group":"California oak woodland","method":"pressure chamber, weekly middays April to November 2014","cite":"Chacon et al. 2020 PLoS One 15: e0230868, Table 1 and Results","doi":"10.1371/journal.pone.0230868","journal":"PLoS One","badge":"VERIFIED","journal_flag":"PLoS One: peer reviewed, broad scope; acceptable, not a top specialist journal"},"sp.quer_agri.hsm":{"claim":"Coast live oak operated beyond its stem P50: hydraulic safety margin about −0.71 MPa (Ψmin −2.5 vs P50 −1.79 MPa)","value":-0.71,"units":"MPa","species":"Quercus agrifolia","trait":"HSM","organ":"stem","group":"California oak woodland","method":"HSM = Ψmin − P50 as stated by the authors","cite":"Chacon et al. 2020 PLoS One 15: e0230868, Table 1 and Results","doi":"10.1371/journal.pone.0230868","journal":"PLoS One","badge":"VERIFIED","journal_flag":"PLoS One: peer reviewed, broad scope; acceptable, not a top specialist journal","note":"Authors predicted over 50 % stem embolism by end of summer, yet no dieback seen."},"sp.arbu_menz.p50stem":{"claim":"Pacific madrone stem P50 −3.0 ± 0.33 MPa","value":-3.0,"units":"MPa","species":"Arbutus menziesii","trait":"P50_stem","organ":"stem","group":"California mixed evergreen forest","method":"centrifuge, 14.2 cm segments","cite":"Chacon et al. 2020 PLoS One 15: e0230868, Table 1 and Results","doi":"10.1371/journal.pone.0230868","journal":"PLoS One","badge":"VERIFIED","journal_flag":"PLoS One: peer reviewed, broad scope; acceptable, not a top specialist journal","note":"Diffuse porous, max vessel length 0.29 m; deep roots (>3.5 m into bedrock, cited by the authors)."},"sp.arbu_menz.tlp":{"claim":"Pacific madrone turgor loss point −1.91 ± 0.57 MPa; osmotic potential at full turgor −1.26 MPa; bulk modulus 15.1 MPa","value":-1.91,"units":"MPa","species":"Arbutus menziesii","trait":"TLP","organ":"leaf","group":"California mixed evergreen forest","method":"pressure volume curves","cite":"Chacon et al. 2020 PLoS One 15: e0230868, Table 1 and Results","doi":"10.1371/journal.pone.0230868","journal":"PLoS One","badge":"VERIFIED","journal_flag":"PLoS One: peer reviewed, broad scope; acceptable, not a top specialist journal"},"sp.arbu_menz.psimin":{"claim":"Pacific madrone minimum water potential −1.87 MPa; hydraulic safety margin 1.13 MPa","value":{"Psi_min":-1.87,"HSM":1.13},"units":"MPa","species":"Arbutus menziesii","trait":"Psi_min, HSM","organ":"leaf/stem","group":"California mixed evergreen forest","method":"pressure chamber; HSM = Ψmin − P50","cite":"Chacon et al. 2020 PLoS One 15: e0230868, Table 1 and Results","doi":"10.1371/journal.pone.0230868","journal":"PLoS One","badge":"VERIFIED","journal_flag":"PLoS One: peer reviewed, broad scope; acceptable, not a top specialist journal"},"sp.vitis_cs.gsp50":{"claim":"Cabernet Sauvignon: stomatal conductance halves at −0.60 MPa leaf water potential (P80 −1.21 MPa)","value":-0.6,"units":"MPa","species":"Vitis vinifera cv. Cabernet Sauvignon","trait":"gs_P50","organ":"leaf","group":"crop","method":"Kleaf by evaporative flux method and gs by gas exchange vs Ψleaf; exponential fits; curves started at Ψ = 0","cite":"Albuquerque et al. 2020 J Exp Bot 71: 7286 to 7300, Table 2","doi":"10.1093/jxb/eraa392","journal":"J Exp Bot","badge":"VERIFIED","note":"Stomatal half closure, NOT stem or petiole P50 (HARD RULE 3). From Ψ = −0.3 MPa: CS −0.85, CH −0.81 MPa."},"sp.vitis_cs.kleafp50":{"claim":"Cabernet Sauvignon: Kleaf halves at −0.30 MPa (P80 −0.71 MPa); Kmax 14.52 mmol m−2 s−1 MPa−1","value":-0.3,"units":"MPa","species":"Vitis vinifera cv. Cabernet Sauvignon","trait":"Kleaf_P50","organ":"leaf","group":"crop","method":"Kleaf by evaporative flux method and gs by gas exchange vs Ψleaf; exponential fits; curves started at Ψ = 0","cite":"Albuquerque et al. 2020 J Exp Bot 71: 7286 to 7300, Table 2","doi":"10.1093/jxb/eraa392","journal":"J Exp Bot","badge":"VERIFIED","note":"Kleaf_max 14.52; gs_max 0.279 mol m−2 s−1"},"sp.vitis_cs.tlp":{"claim":"Cabernet Sauvignon: turgor loss point −1.37 MPa","value":-1.37,"units":"MPa","species":"Vitis vinifera cv. Cabernet Sauvignon","trait":"TLP","organ":"leaf","group":"crop","method":"pressure volume curves, n = 5","cite":"Albuquerque et al. 2020 J Exp Bot 71: 7286 to 7300, Table 2","doi":"10.1093/jxb/eraa392","journal":"J Exp Bot","badge":"VERIFIED"},"sp.vitis_ch.gsp50":{"claim":"Chardonnay: stomatal conductance halves at −0.53 MPa leaf water potential (P80 −1.17 MPa)","value":-0.53,"units":"MPa","species":"Vitis vinifera cv. Chardonnay","trait":"gs_P50","organ":"leaf","group":"crop","method":"Kleaf by evaporative flux method and gs by gas exchange vs Ψleaf; exponential fits; curves started at Ψ = 0","cite":"Albuquerque et al. 2020 J Exp Bot 71: 7286 to 7300, Table 2","doi":"10.1093/jxb/eraa392","journal":"J Exp Bot","badge":"VERIFIED","note":"Stomatal half closure, NOT stem or petiole P50 (HARD RULE 3). From Ψ = −0.3 MPa: CS −0.85, CH −0.81 MPa."},"sp.vitis_ch.kleafp50":{"claim":"Chardonnay: Kleaf halves at −0.29 MPa (P80 −0.67 MPa); Kmax 13.9 mmol m−2 s−1 MPa−1","value":-0.29,"units":"MPa","species":"Vitis vinifera cv. Chardonnay","trait":"Kleaf_P50","organ":"leaf","group":"crop","method":"Kleaf by evaporative flux method and gs by gas exchange vs Ψleaf; exponential fits; curves started at Ψ = 0","cite":"Albuquerque et al. 2020 J Exp Bot 71: 7286 to 7300, Table 2","doi":"10.1093/jxb/eraa392","journal":"J Exp Bot","badge":"VERIFIED","note":"Kleaf_max 13.9; gs_max 0.153 mol m−2 s−1"},"sp.vitis_ch.tlp":{"claim":"Chardonnay: turgor loss point −1.49 MPa","value":-1.49,"units":"MPa","species":"Vitis vinifera cv. Chardonnay","trait":"TLP","organ":"leaf","group":"crop","method":"pressure volume curves, n = 5","cite":"Albuquerque et al. 2020 J Exp Bot 71: 7286 to 7300, Table 2","doi":"10.1093/jxb/eraa392","journal":"J Exp Bot","badge":"VERIFIED"},"sp.vitis_cs.midrib_emb":{"claim":"Midrib embolism begins near −1.25 MPa; minor vein embolism rare; Kleaf and gs fell 80 % before embolism","value":-1.25,"units":"MPa","species":"Vitis vinifera cv. Cabernet Sauvignon and Chardonnay","trait":"embolism_onset_midrib","organ":"leaf","group":"crop","method":"microCT of intact leaves (1.27 µm voxel midrib scans)","cite":"Albuquerque et al. 2020 J Exp Bot 71: 7286 to 7300, Table 2","doi":"10.1093/jxb/eraa392","journal":"J Exp Bot","badge":"VERIFIED"},"sp.vitis_sy.p50":{"claim":"Syrah: petiole P50 −1.54 MPa, stem P50 −1.9 MPa (slopes 159 and 87 % MPa−1)","value":{"petiole":-1.54,"stem":-1.9},"units":"MPa","species":"Vitis vinifera cv. Syrah","trait":"P50_petiole, P50_stem","organ":"petiole/stem","group":"crop","method":"in vivo MRI confirmed by microCT","cite":"Hochberg, Albuquerque et al. 2016 Plant Cell Environ 39: 1886","doi":"10.1111/pce.12688","journal":"Plant Cell Environ","badge":"VERIFIED","note":"Different quantity from stomatal half closure; never merge. No petiole fuse."},"sp.vitis_me.tlp_oa":{"claim":"Merlot osmotic adjustment: turgor loss point −1.08 MPa well watered vs −1.31 MPa after 39 days of sustained deficit (adjustment 0.23 MPa); osmotic potential at full turgor −1.02 vs −1.10 MPa","value":{"WW":-1.08,"SD":-1.31,"TD":-1.17},"units":"MPa","species":"Vitis vinifera cv. Merlot on SO4","trait":"TLP, osmotic_adjustment","organ":"leaf","group":"crop","method":"pressure volume curves after a 39 day acclimation (WW, sustained deficit SD, transient deficit TD), potted vines","cite":"Hochberg et al. 2017 Planta 245: 1091 to 1104","doi":"10.1007/s00425-017-2662-3","journal":"Planta","badge":"VERIFIED","note":"Acclimated vines kept higher gs and Kleaf at low Ψstem."},"sp.vitis_me.p50pet":{"claim":"Merlot petiole P50 (PLC50): −1.31 MPa well watered, −1.09 MPa sustained deficit (drought acclimated vines were MORE vulnerable)","value":{"WW":-1.31,"SD":-1.09,"TD":-1.18},"units":"MPa","species":"Vitis vinifera cv. Merlot on SO4","trait":"P50_petiole","organ":"petiole","group":"crop","method":"excised shoots dehydrated, petiole PLC by Xyl'em","cite":"Hochberg et al. 2017 Planta 245: 1091 to 1104","doi":"10.1007/s00425-017-2662-3","journal":"Planta","badge":"VERIFIED","note":"Most Kleaf decline happened at Ψstem above −0.6 MPa (< 20 % PLC); 50 % Kleaf vs 50 % PLC differ by 0.4 to 0.8 MPa."},"sp.vitis.oa_seasonal":{"claim":"Grapevine leaf turgor loss point falls through the season by osmolyte accumulation, and stomata tolerate lower water potential as the season advances","species":"Vitis vinifera (two cultivars)","trait":"osmotic_adjustment","organ":"leaf","group":"crop","method":"seasonal drought trials + SurEau model","cite":"Herrera et al. 2021 Plant J 109: 804 to 815","doi":"10.1111/tpj.15591","journal":"Plant J","badge":"VERIFIED","note":"Qualitative; no number quoted in abstract."},"sp.vitis.kleaf_plastic":{"claim":"Tempranillo and Grenache: Kleaf P50, P80 and Kmax decreased seasonally by more than 20 %, Kleaf at −2 MPa rose threefold as osmotic potential and TLP decreased","species":"Vitis vinifera cv. Tempranillo and Grenache","trait":"osmotic_adjustment, Kleaf_P50","organ":"leaf","group":"crop","method":"Kleaf vulnerability + PV curves, two water treatments","cite":"Martorell et al. 2015 Physiol Plant 153: 381 to 391","doi":"10.1111/ppl.12253","journal":"Physiol Plant","badge":"VERIFIED"},"sp.cean_cras.pmin":{"claim":"Ceanothus crassifolius branchlets reached −11.2 MPa at the end of a drought of up to 9 months, with branchlet dieback; modelled critical leaf pressure −10 to −11 MPa","value":-11.2,"units":"MPa","species":"Ceanothus crassifolius","trait":"Psi_min","organ":"stem","group":"chaparral","method":"pressure chamber in the field (Santa Monica Mountains); centrifuge vulnerability curves for branchlets and roots; soil to leaf transport model","cite":"Davis et al. 2002 Am J Bot 89: 820 to 828","doi":"10.3732/ajb.89.5.820","journal":"Am J Bot","badge":"VERIFIED","note":"P_Lcrit −10 to −11 MPa. Fungal endophytes also present."},"sp.cean_cras.predawn":{"claim":"Predawn water potential fell from −0.1 to −6.6 MPa (C. crassifolius) and −7.8 MPa (C. megacarpus) between May and August 1981; leaves turned steeper, cutting midday light capture in August by 20 % and 6 %","value":{"C. crassifolius":-6.6,"C. megacarpus":-7.8},"units":"MPa","species":"Ceanothus crassifolius; Ceanothus megacarpus","trait":"Psi_predawn","organ":"leaf","group":"chaparral","method":"pressure chamber, predawn, Santa Barbara area","cite":"Comstock & Mahall 1985 Oecologia 65: 531","doi":"10.1007/BF00379668","journal":"Oecologia","badge":"VERIFIED"},"sp.cean_spin.freeze":{"claim":"Dehydrated to −5.0 MPa, a freeze thaw cycle embolised Ceanothus spinosus stems 96 % vs 61 % in C. crassifolius; leaf LT50 about −10 °C (C. spinosus) vs −18 °C (C. crassifolius)","value":{"PLC_spinosus":96,"PLC_crassifolius":61,"LT50_spinosus":-10,"LT50_crassifolius":-18},"units":"% and °C","species":"Ceanothus spinosus; Ceanothus crassifolius","trait":"freeze_thaw_PLC, LT50","organ":"stem/leaf","group":"chaparral","method":"freeze thaw of excised shoots at set water potentials","cite":"Ewers et al. 2003 Oecologia 136: 213 to 219","doi":"10.1007/s00442-003-1273-9","journal":"Oecologia","badge":"VERIFIED"},"sp.aden_fasc.vessel_lht":{"claim":"Adenostoma fasciculatum (chamise): maximum vessel length 0.29 m; fire life history R+S+","value":0.29,"units":"m","species":"Adenostoma fasciculatum","trait":"max_vessel_length, life_history","organ":"stem","group":"chaparral","method":"air injection vessel length; life history from the authors' table","cite":"Venturas et al. 2016 PLoS One 11: e0159145, Table 1 and Results","doi":"10.1371/journal.pone.0159145","journal":"PLoS One","badge":"VERIFIED","journal_flag":"PLoS One: peer reviewed, broad scope; acceptable, not a top specialist journal","note":"Species names reconstructed from code, authority and common name because italics were stripped in the retrieved text. R−S+ obligate seeder, R+S+ facultative seeder, R+S− obligate resprouter."},"sp.aden_spar.vessel_lht":{"claim":"Adenostoma sparsifolium (red shank): maximum vessel length 0.48 m; fire life history R+S+","value":0.48,"units":"m","species":"Adenostoma sparsifolium","trait":"max_vessel_length, life_history","organ":"stem","group":"chaparral","method":"air injection vessel length; life history from the authors' table","cite":"Venturas et al. 2016 PLoS One 11: e0159145, Table 1 and Results","doi":"10.1371/journal.pone.0159145","journal":"PLoS One","badge":"VERIFIED","journal_flag":"PLoS One: peer reviewed, broad scope; acceptable, not a top specialist journal","note":"Species names reconstructed from code, authority and common name because italics were stripped in the retrieved text. R−S+ obligate seeder, R+S+ facultative seeder, R+S− obligate resprouter."},"sp.arct_glau.vessel_lht":{"claim":"Arctostaphylos glauca (big berry manzanita): maximum vessel length 0.3 m; fire life history R−S+","value":0.3,"units":"m","species":"Arctostaphylos glauca","trait":"max_vessel_length, life_history","organ":"stem","group":"chaparral","method":"air injection vessel length; life history from the authors' table","cite":"Venturas et al. 2016 PLoS One 11: e0159145, Table 1 and Results","doi":"10.1371/journal.pone.0159145","journal":"PLoS One","badge":"VERIFIED","journal_flag":"PLoS One: peer reviewed, broad scope; acceptable, not a top specialist journal","note":"Species names reconstructed from code, authority and common name because italics were stripped in the retrieved text. R−S+ obligate seeder, R+S+ facultative seeder, R+S− obligate resprouter."},"sp.cean_cune.vessel_lht":{"claim":"Ceanothus cuneatus (buck brush): maximum vessel length 0.23 m; fire life history R−S+","value":0.23,"units":"m","species":"Ceanothus cuneatus","trait":"max_vessel_length, life_history","organ":"stem","group":"chaparral","method":"air injection vessel length; life history from the authors' table","cite":"Venturas et al. 2016 PLoS One 11: e0159145, Table 1 and Results","doi":"10.1371/journal.pone.0159145","journal":"PLoS One","badge":"VERIFIED","journal_flag":"PLoS One: peer reviewed, broad scope; acceptable, not a top specialist journal","note":"Species names reconstructed from code, authority and common name because italics were stripped in the retrieved text. R−S+ obligate seeder, R+S+ facultative seeder, R+S− obligate resprouter."},"sp.cean_spin.vessel_lht":{"claim":"Ceanothus spinosus (greenbark ceanothus): maximum vessel length 0.3 m; fire life history R+S+","value":0.3,"units":"m","species":"Ceanothus spinosus","trait":"max_vessel_length, life_history","organ":"stem","group":"chaparral","method":"air injection vessel length; life history from the authors' table","cite":"Venturas et al. 2016 PLoS One 11: e0159145, Table 1 and Results","doi":"10.1371/journal.pone.0159145","journal":"PLoS One","badge":"VERIFIED","journal_flag":"PLoS One: peer reviewed, broad scope; acceptable, not a top specialist journal","note":"Species names reconstructed from code, authority and common name because italics were stripped in the retrieved text. R−S+ obligate seeder, R+S+ facultative seeder, R+S− obligate resprouter."},"sp.cerc_betu.vessel_lht":{"claim":"Cercocarpus betuloides (mountain mahogany): maximum vessel length 1.04 m; fire life history R+S−","value":1.04,"units":"m","species":"Cercocarpus betuloides","trait":"max_vessel_length, life_history","organ":"stem","group":"chaparral","method":"air injection vessel length; life history from the authors' table","cite":"Venturas et al. 2016 PLoS One 11: e0159145, Table 1 and Results","doi":"10.1371/journal.pone.0159145","journal":"PLoS One","badge":"VERIFIED","journal_flag":"PLoS One: peer reviewed, broad scope; acceptable, not a top specialist journal","note":"Species names reconstructed from code, authority and common name because italics were stripped in the retrieved text. R−S+ obligate seeder, R+S+ facultative seeder, R+S− obligate resprouter."},"sp.hete_arbu.vessel_lht":{"claim":"Heteromeles arbutifolia (toyon, Christmas berry): maximum vessel length 0.86 m; fire life history R+S−","value":0.86,"units":"m","species":"Heteromeles arbutifolia","trait":"max_vessel_length, life_history","organ":"stem","group":"chaparral","method":"air injection vessel length; life history from the authors' table","cite":"Venturas et al. 2016 PLoS One 11: e0159145, Table 1 and Results","doi":"10.1371/journal.pone.0159145","journal":"PLoS One","badge":"VERIFIED","journal_flag":"PLoS One: peer reviewed, broad scope; acceptable, not a top specialist journal","note":"Species names reconstructed from code, authority and common name because italics were stripped in the retrieved text. R−S+ obligate seeder, R+S+ facultative seeder, R+S− obligate resprouter."},"sp.malo_laur.vessel_lht":{"claim":"Malosma laurina (laurel sumac): maximum vessel length 0.92 m; fire life history R+S+","value":0.92,"units":"m","species":"Malosma laurina","trait":"max_vessel_length, life_history","organ":"stem","group":"chaparral","method":"air injection vessel length; life history from the authors' table","cite":"Venturas et al. 2016 PLoS One 11: e0159145, Table 1 and Results","doi":"10.1371/journal.pone.0159145","journal":"PLoS One","badge":"VERIFIED","journal_flag":"PLoS One: peer reviewed, broad scope; acceptable, not a top specialist journal","note":"Species names reconstructed from code, authority and common name because italics were stripped in the retrieved text. R−S+ obligate seeder, R+S+ facultative seeder, R+S− obligate resprouter."},"sp.quer_berb.vessel_lht":{"claim":"Quercus berberidifolia (scrub oak): maximum vessel length 1.6 m; fire life history R+S−","value":1.6,"units":"m","species":"Quercus berberidifolia","trait":"max_vessel_length, life_history","organ":"stem","group":"chaparral","method":"air injection vessel length; life history from the authors' table","cite":"Venturas et al. 2016 PLoS One 11: e0159145, Table 1 and Results","doi":"10.1371/journal.pone.0159145","journal":"PLoS One","badge":"VERIFIED","journal_flag":"PLoS One: peer reviewed, broad scope; acceptable, not a top specialist journal","note":"Species names reconstructed from code, authority and common name because italics were stripped in the retrieved text. R−S+ obligate seeder, R+S+ facultative seeder, R+S− obligate resprouter."},"sp.rham_ilic.vessel_lht":{"claim":"Rhamnus ilicifolia (hollyleaf redberry): maximum vessel length 1.23 m; fire life history R+S−","value":1.23,"units":"m","species":"Rhamnus ilicifolia","trait":"max_vessel_length, life_history","organ":"stem","group":"chaparral","method":"air injection vessel length; life history from the authors' table","cite":"Venturas et al. 2016 PLoS One 11: e0159145, Table 1 and Results","doi":"10.1371/journal.pone.0159145","journal":"PLoS One","badge":"VERIFIED","journal_flag":"PLoS One: peer reviewed, broad scope; acceptable, not a top specialist journal","note":"Species names reconstructed from code, authority and common name because italics were stripped in the retrieved text. R−S+ obligate seeder, R+S+ facultative seeder, R+S− obligate resprouter."},"sp.rhus_ovat.vessel_lht":{"claim":"Rhus ovata (sugar bush): maximum vessel length 1.4 m; fire life history R+S+","value":1.4,"units":"m","species":"Rhus ovata","trait":"max_vessel_length, life_history","organ":"stem","group":"chaparral","method":"air injection vessel length; life history from the authors' table","cite":"Venturas et al. 2016 PLoS One 11: e0159145, Table 1 and Results","doi":"10.1371/journal.pone.0159145","journal":"PLoS One","badge":"VERIFIED","journal_flag":"PLoS One: peer reviewed, broad scope; acceptable, not a top specialist journal","note":"Species names reconstructed from code, authority and common name because italics were stripped in the retrieved text. R−S+ obligate seeder, R+S+ facultative seeder, R+S− obligate resprouter."},"site.coldcreek.2014":{"claim":"Santa Monica Mountains chaparral (Cold Creek Canyon, 350 m): mean 17.7 °C and 521.8 mm rain per year (1998 to 2014) vs 18.3 °C and 237.5 mm in drought years 2012 to 2014; only 51.6 mm fell in the 12 months before February 2014; stand density fell 63.4 %; mortality ranged 0 to 93 % among 11 species","value":{"T_mean":17.7,"P_mean":521.8,"T_drought":18.3,"P_drought":237.5,"P_12mo_to_Feb2014":51.6,"stand_loss_pct":63.4},"units":"°C, mm, %","species":"11 chaparral shrub species","trait":"site_climate, mortality","organ":"stand","group":"chaparral","method":"point quarter + systematic sampling; Malibu Hills station","cite":"Venturas et al. 2016 PLoS One 11: e0159145, Table 1 and Results","doi":"10.1371/journal.pone.0159145","journal":"PLoS One","badge":"VERIFIED","journal_flag":"PLoS One: peer reviewed, broad scope; acceptable, not a top specialist journal","note":"Good Southern California setting for the Lead's SoCal preset. Species level mortality not resolvable in retrieved text (names stripped). Fv/Fm correlated most strongly with mortality; a native Ks threshold near 0.2 kg m−1 s−1 MPa−1 (units per authors)."},"sp.malo_laur.dieback":{"claim":"Laurel sumac, normally drought resilient, died back over 60 % in low elevation coastal Santa Monica Mountains populations during the 2012 to 2018 megadrought; stem K fell 7 to 11 fold; 68 % of vessels solidly blocked","value":{"mortality_pct":60,"K_fold_reduction":"7 to 11","blockage_pct":68},"units":"% / fold","species":"Malosma laurina","trait":"mortality, stem_K","organ":"stem","group":"chaparral","method":"hydraulic conductance + vessel staining; fungal agent (biotic)","cite":"Aguirre et al. 2023 Plant Cell Environ 47: 1053 to 1069","doi":"10.1111/pce.14768","journal":"Plant Cell Environ","badge":"VERIFIED","note":"Deep rooted species: biotic agent, not drought alone. Year/vol per PubMed record date Nov 2023."},"sp.malo_rhus.freeze":{"claim":"Freeze to ≤ −6 °C: stem PLC 90 ± 4 % (Malosma laurina) and 92 ± 3 % (Rhus ovata); Rhus ovata survives by low minimum leaf conductance","value":{"PLC_Malosma":90,"PLC_Rhus":92},"units":"%","species":"Malosma laurina; Rhus ovata","trait":"freeze_thaw_PLC, gmin (qualitative)","organ":"stem/leaf","group":"chaparral","method":"laboratory and field freezing, 1996 and 2003 to 2004","cite":"Pratt et al. 2005 Am J Bot 92: 1102 to 1113","doi":"10.3732/ajb.92.7.1102","journal":"Am J Bot","badge":"VERIFIED","note":"Field and lab, adults and seedlings; Malosma seedlings died back at −7.2 °C."},"sp.rooting.davis_mooney":{"claim":"During peak drought, predawn water potential matched soil water at ≥ 2 m for scrub oak, about 0.75 m for toyon and chamise, about 0.5 m for redberry","value":{"Quercus":2.0,"Heteromeles":0.75,"Adenostoma":0.75,"Rhamnus":0.5},"units":"m (apparent rooting depth)","species":"Quercus dumosa (scrub oak), Heteromeles arbutifolia, Adenostoma fasciculatum, Rhamnus crocea","trait":"rooting_depth_apparent","organ":"root","group":"chaparral","method":"predawn Ψ matched to soil Ψ profiles (inference, not excavation)","cite":"Davis & Mooney 1986 Oecologia 70: 172 to 177","doi":"10.1007/BF00379236","journal":"Oecologia","badge":"VERIFIED","note":"Species epithets for Quercus and Rhamnus not in the abstract; confirm before printing epithets."},"comm.semiarid.psimin":{"claim":"Three southern California semi arid communities (coastal sage, chaparral, Mojave) reach a similar community minimum water potential of about −4.6 MPa; chaparral species are the most cavitation resistant of the three","value":-4.6,"units":"MPa","species":"28 evergreen shrubs","trait":"Psi_min (community)","organ":"stem","group":"chaparral / coastal sage / desert","method":"field Ψ, centrifuge Ψ50","cite":"Jacobsen et al. 2008 New Phytol 180: 100 to 113","doi":"10.1111/j.1469-8137.2008.02554.x","journal":"New Phytol","badge":"VERIFIED","note":"Second DOI: 10.1111/j.1365-3040.2007.01729.x (27 species, chaparral most resistant regardless of season)."},"sp.salvia.tlp":{"claim":"The two drought deciduous coastal sage species (Salvia mellifera, Salvia apiana) had the least negative turgor loss points, −2.2 and −2.0 MPa; the most negative among six species were −4.1 and −3.6 MPa","value":{"Salvia_pair":[-2.2,-2.0],"most_negative_pair":[-4.1,-3.6]},"units":"MPa","species":"Salvia mellifera and Salvia apiana (order not resolvable); six SoCal shrubs incl. Heteromeles, Quercus berberidifolia, Malosma, Ceanothus","trait":"TLP","organ":"leaf","group":"coastal sage scrub / chaparral","method":"osmometer on rehydrated discs, Bartlett regression; greenhouse 2022; Santa Margarita Ecological Reserve field","cite":"Schönbeck, Rasmussen & Santiago 2025 Plant Cell Environ 48: 5019","doi":"10.1111/pce.15505","journal":"Plant Cell Environ","badge":"VERIFIED","note":"Species names stripped in retrieved text; only genus level assignment is safe for the Salvia pair."},"sp.socal.tlp_adjust":{"claim":"Drought lowered turgor loss point by 0.41 ± 0.14 MPa (six SoCal shrubs pooled); in one species by more than 2 MPa; stomata closed BELOW turgor loss point, and field Ψ sat several MPa below TLP with no dieback","value":0.41,"units":"MPa","species":"six chaparral and coastal sage species","trait":"osmotic_adjustment","organ":"leaf","group":"chaparral / coastal sage","method":"greenhouse drought, osmometer","cite":"Schönbeck, Rasmussen & Santiago 2025 Plant Cell Environ 48: 5019","doi":"10.1111/pce.15505","journal":"Plant Cell Environ","badge":"VERIFIED","note":"Teaches that TLP is a moving target and not a death line."},"sp.salv_mell.irrig":{"claim":"Black sage: irrigation raised leaf specific hydraulic conductance 92 % and predawn Ψ 20 %; corollas used about 20 % of shoot water","value":{"KH_increase_pct":92,"flower_water_share_pct":20},"units":"%","species":"Salvia mellifera","trait":"K_shoot, flower_water_use","organ":"shoot","group":"coastal sage scrub","method":"field irrigation experiment","cite":"Lambrecht et al. 2011 Am J Bot 98: 1286 to 1292","doi":"10.3732/ajb.1000514","journal":"Am J Bot","badge":"VERIFIED","note":"Author list/volume from PubMed record PMID 21788533; verify pages before print."},"sp.arte_cali.fog":{"claim":"Drought deciduous coastal sage (Artemisia californica, Salvia leucophylla) took up fog through leaves and benefited more than evergreen chaparral (Adenostoma, Baccharis, Ceanothus megacarpus)","species":"Artemisia californica; Salvia leucophylla","trait":"foliar_water_uptake","organ":"leaf","group":"coastal sage scrub","method":"deuterium labelled fog, roots sealed","cite":"Emery 2016 Oecologia 182: 731","doi":"10.1007/s00442-016-3712-4","journal":"Oecologia","badge":"VERIFIED","note":"Nice link to Salinas fog."},"sp.agav_dese.rootshrink":{"claim":"Agave deserti roots shrank 24 % after 7 days and 34 % after 14 days of drought, opening root to soil air gaps that cut interface conductivity about 5 fold","value":{"7d":24,"14d":34,"interface_factor":5},"units":"% / fold","species":"Agave deserti","trait":"root_shrinkage","organ":"root","group":"desert succulent (CAM)","method":"resin casts in situ, containers and field; vibrated pots remove gaps","cite":"North & Nobel 1997 New Phytol 135: 21 to 29","doi":"10.1046/j.1469-8137.1997.00620.x","journal":"New Phytol","badge":"VERIFIED","note":"Gaps keep root water from leaking into dry soil: a one way valve at the root surface."},"sp.agav_dese.rectifier":{"claim":"Root to stem junctions of Agave deserti and Ferocactus acanthodes lose conductance by embolism as soil dries and recover on rewetting: they act as rectifiers","species":"Agave deserti; Ferocactus acanthodes","trait":"rectifier","organ":"root/stem junction","group":"desert succulent (CAM)","method":"axial conductance of junctions, roots and stems over 21 d drying","cite":"Ewers et al. 1992 New Phytol 121: 377 to 385","doi":"10.1111/j.1469-8137.1992.tb02937.x","journal":"New Phytol","badge":"VERIFIED"},"sp.agav_dese.rootp50":{"claim":"Agave deserti roots: mean cavitation pressure −0.93 ± 0.08 MPa; Opuntia ficus-indica −0.70 ± 0.02 MPa; predicted 69 % and 62 % loss after a 3 month drought","value":{"Agave_deserti":-0.93,"Opuntia_ficus_indica":-0.7},"units":"MPa","species":"Agave deserti; Opuntia ficus-indica","trait":"P50_root","organ":"root","group":"desert succulent (CAM)","method":"air injection and centrifuge on roots","cite":"Linton & Nobel 1999 Am J Bot 86: 1538","journal":"Am J Bot","badge":"UNVERIFIED","note":"Values seen in the retrieved abstract, but no DOI was returned, so badge stays UNVERIFIED until the DOI is retrieved. Author initials, volume and pages unconfirmed."},"sp.agav_dese.rocks":{"claim":"In rocky soil Agave deserti had half the root surface area, root to leaf area ratio and mean rooting depth of plants in sandier soil","value":2,"units":"fold","species":"Agave deserti","trait":"rooting_depth_plasticity","organ":"root","group":"desert succulent (CAM)","method":"field excavation, NW Sonoran Desert","cite":"Martre et al. 2002 Am J Bot 89: 1933 to 1939","doi":"10.3732/ajb.89.12.1933","journal":"Am J Bot","badge":"VERIFIED"},"sp.opun_acan.lp":{"claim":"Opuntia acanthocarpa root hydraulic conductance fell about 67 % over 45 days of drying and recovered to 60 % 8 days after rewetting; aquaporins (HgCl2 sensitive) explained about 38 % of the drop and 61 % of the recovery in distal roots, 74 % of stele changes","value":{"drop_pct":67,"recovery_pct":60,"AQP_share_drop":38,"AQP_share_recovery":61,"AQP_share_stele":74},"units":"%","species":"Opuntia acanthocarpa","trait":"root_Lp, aquaporin_share","organ":"root","group":"desert succulent (CAM)","method":"root Lp with HgCl2 and 2 mercaptoethanol reversal","cite":"Martre et al. 2001 Plant Physiol 126: 352 to 362","doi":"10.1104/pp.126.1.352","journal":"Plant Physiol","badge":"VERIFIED"},"grp.contractile_roots":{"claim":"Contractile roots occur in 55 % of 73 succulent monocots (64 % of agaves, 85 % of yuccas, no aloes); contraction increases as rainfall falls","value":{"all":55,"agaves":64,"yuccas":85,"aloes":0},"units":"%","species":"Agavaceae and Asphodelaceae","trait":"contractile_roots","organ":"root","group":"desert succulent","method":"glasshouse survey vs native rainfall","cite":"North et al. 2008 Plant Cell Environ 31: 1179 to 1189","doi":"10.1111/j.1365-3040.2008.01832.x","journal":"Plant Cell Environ","badge":"VERIFIED","note":"Ariocarpus fissuratus is pulled down 6 to 30 mm per year (Garrett et al. 2010 Am J Bot, doi 10.3732/ajb.1000286)."},"sp.anno_glab.p50":{"claim":"Pond apple (flood tolerant, Panama): stem P50 −3.3 MPa while field Ψ never fell below about −1.0 MPa (large safety margin)","value":{"P50":-3.3,"Psi_min":-1.0},"units":"MPa","species":"Annona glabra","trait":"P50_stem, Psi_min","organ":"stem","group":"tropical","method":"vulnerability curves; field Ψ, Barro Colorado Island","cite":"Zotz, Tyree & Patiño 1997 Tree Physiol 17: 359","doi":"10.1093/treephys/17.6.359","journal":"Tree Physiol","badge":"VERIFIED","note":"HSM about 2.3 MPa is DERIVED (−1.0 − (−3.3))."},"sp.clus_uvit.p50":{"claim":"Clusia uvitana (C3 to CAM hemiepiphyte, Panama): stem P50 −1.3 MPa; leaf Ψ only −0.7 to −0.9 MPa; CAM keeps water loss low","value":{"P50":-1.3,"Psi_leaf":[-0.7,-0.9]},"units":"MPa","species":"Clusia uvitana","trait":"P50_stem, Psi_leaf","organ":"stem","group":"tropical (CAM)","method":"vulnerability curves; field Ψ","cite":"Zotz, Tyree & Cochard 1994 New Phytol 127: 287","doi":"10.1111/j.1469-8137.1994.tb04279.x","journal":"New Phytol","badge":"VERIFIED"},"sp.lica_plat.wilt":{"claim":"Licania platypus seedlings wilted at −2.7 MPa (RWC 0.85) but died only at −7.5 MPa (RWC 0.14); stem conductance fell 70 to 85 %, roots about 50 %","value":{"wilt":-2.7,"death":-7.5,"RWC_wilt":0.85,"RWC_death":0.14},"units":"MPa","species":"Licania platypus","trait":"wilting_point, lethal_Psi","organ":"whole plant","group":"tropical","method":"potted dry down, high pressure flow meter","cite":"Tyree, Vargas, Engelbrecht & Kursar 2002 J Exp Bot 53: 2239","doi":"10.1093/jxb/erf078","journal":"J Exp Bot","badge":"VERIFIED"},"sp.heve_bras.p50":{"claim":"Rubber tree (PB260 clone, Sumatra): branch P50 −2.14 to −2.58 MPa across plantations; P50 fell and HSM rose with higher mean VPD","value":[-2.14,-2.58],"units":"MPa","species":"Hevea brasiliensis","trait":"P50_stem","organ":"stem","group":"tropical crop","method":"vulnerability curves on branches, 8 smallholder plots","cite":"Waite et al. 2023 Tree Physiol 43: 2131 to 2149","doi":"10.1093/treephys/tpad113","journal":"Tree Physiol","badge":"VERIFIED","note":"Volume/pages from PubMed date only; verify before print."},"comm.amazon.central":{"claim":"Central Amazon canopy trees in the 2015 El Niño: P50 −3.3 ± 0.8 MPa and HSM 2.12 ± 0.57 MPa (11 trees)","value":{"P50":-3.3,"HSM":2.12},"units":"MPa","species":"11 canopy tree species, central Amazon","trait":"P50_stem, HSM","organ":"stem","group":"tropical","method":"vulnerability curves + field Ψ","cite":"Garcia et al. 2021 Oecologia 197: 13","doi":"10.1007/s00442-021-04924-9","journal":"Oecologia","badge":"VERIFIED"},"comm.panama.hsm":{"claim":"Panama lowland trees: the margin between minimum branch Ψ and P50 rose from 0.4 MPa (least negative Ψ) to 1.2 MPa (most negative); larger sapwood capacitance, smaller margin","value":[0.4,1.2],"units":"MPa","species":"11 lowland tropical tree species","trait":"HSM","organ":"stem","group":"tropical","method":"branch vulnerability curves, PV curves of sapwood","cite":"Meinzer et al. 2008 Oecologia 156: 31","doi":"10.1007/s00442-008-0974-5","journal":"Oecologia","badge":"VERIFIED"},"comm.tropdry.p50range":{"claim":"Tropical dry forest saplings (13 species, Bolivia): P50 −0.8 to −6.2 MPa; pioneers 38 % more vulnerable than shade tolerants","value":[-0.8,-6.2],"units":"MPa","species":"13 tropical dry forest tree species","trait":"P50_stem","organ":"stem","group":"tropical","method":"vulnerability curves on saplings","cite":"Markesteijn et al. 2010 Plant Cell Environ 34: 137 to 148","doi":"10.1111/j.1365-3040.2010.02231.x","journal":"Plant Cell Environ","badge":"VERIFIED"},"comm.tropics.hsm_common":{"claim":"Across 30 tropical forest sites, TLP, P50 and HSM vary widely within sites and largely independently of water availability; species with HSM > 1 MPa and P50 < −2 MPa are common in wet and dry tropics","species":"30 tropical forest sites","trait":"TLP, P50, HSM","organ":"leaf/stem","group":"tropical","method":"synthesis","cite":"Smith-Martin et al. 2023 Ecol Lett 26: 1829 to 1839","doi":"10.1111/ele.14314","journal":"Ecol Lett","badge":"VERIFIED"},"comm.mangrove":{"claim":"Eight woody mangroves (Hainan): P50 −4.39 to −6.65 MPa, Ψmin −2.90 to −3.98 MPa, HSM 1.56 to 3.01 MPa","value":{"P50":[-4.39,-6.65],"Psi_min":[-2.9,-3.98],"HSM":[1.56,3.01]},"units":"MPa","species":"8 mangrove species","trait":"P50_stem, Psi_min, HSM","organ":"stem","group":"tropical (saline)","method":"vulnerability curves, field Ψ","cite":"Wei et al. 2026 Tree Physiol 46","doi":"10.1093/treephys/tpag049","journal":"Tree Physiol","badge":"VERIFIED"},"sp.amazon.santiago":{"claim":"Amazonian canopy trees (14 species, French Guiana): xylem efficiency linked to capacitance and TLP, not to P50; dense wood with low TLP vs light wood with high capacitance","species":"14 canopy tree species","trait":"TLP, P50, capacitance","organ":"stem","group":"tropical","method":"vulnerability curves, sapwood PV curves","cite":"Santiago, De Guzman, Baraloto et al. 2018 New Phytol 218: 1015","doi":"10.1111/nph.15058","journal":"New Phytol","badge":"VERIFIED","note":"Santiago lab. No species values in abstract; full text not reachable."},"sp.panama.santiago_liana":{"claim":"Panama canopy lianas carry more water per sapwood area than trees but lose conductivity at less negative Ψ (safety vs efficiency trade off)","species":"canopy lianas and trees","trait":"P50, Ks","organ":"stem","group":"tropical","method":"vulnerability curves","cite":"De Guzman, Santiago, Schnitzer & Álvarez-Cansino 2017 Tree Physiol 37: 1404","doi":"10.1093/treephys/tpw086","journal":"Tree Physiol","badge":"VERIFIED"},"sp.tropical.sack_kleaf":{"claim":"Panama rainforest trees: Kleaf varied 10 fold and was 3 fold higher in sun establishing species; on average 12 % of leaf resistance in the petiole, 25 % major veins, 25 % minor veins, 39 % outside the xylem","value":{"petiole":12,"major":25,"minor":25,"outside_xylem":39},"units":"% of leaf resistance","species":"10 lowland rainforest tree species","trait":"Kleaf partitioning","organ":"leaf","group":"tropical","method":"vein cutting partitioning, high pressure flow","cite":"Sack et al. 2005 New Phytol 167: 403 to 413","doi":"10.1111/j.1469-8137.2005.01432.x","journal":"New Phytol","badge":"VERIFIED","note":"Compare temperate: outside xylem 36 % sugar maple, 26 % red oak (Sack et al. 2004 Plant Physiol, doi 10.1104/pp.103.031203)."},"sp.temperate.sack2004":{"claim":"Sugar maple and red oak: 64 % and 74 % of leaf resistance inside the xylem; outside the veins only 36 % and 26 %; a temperature response beyond viscosity disappears when veins are cut, so water crosses membranes","value":{"Acer_saccharum_xylem":64,"Quercus_rubra_xylem":74},"units":"% of leaf resistance","species":"Acer saccharum; Quercus rubra","trait":"Kleaf partitioning","organ":"leaf","group":"temperate","method":"vein cutting","cite":"Sack et al. 2004 Plant Physiol 134: 1824 to 1833","doi":"10.1104/pp.103.031203","journal":"Plant Physiol","badge":"VERIFIED"},"glob.rooting.canadell":{"claim":"Maximum rooting depth by biome: desert 9.5, sclerophyllous shrubland and forest 5.2, tropical savanna 15.0, cropland 2.1, tundra 0.5 m; global mean 4.6 m; record 68 m (Boscia albitrunca)","value":{"desert":9.5,"sclerophyll_shrubland":5.2,"trop_savanna":15.0,"trop_evergreen":7.3,"trop_deciduous":3.7,"temp_conifer":3.9,"temp_deciduous":2.9,"temp_grassland":2.6,"boreal":2.0,"cropland":2.1,"tundra":0.5,"global":4.6,"trees":7.0,"shrubs":5.1,"herbs":2.6},"units":"m","species":"253 species, 290 observations","trait":"rooting_depth_max","organ":"root","group":"global","method":"literature compilation","cite":"Canadell et al. 1996 Oecologia 108: 583 to 595","doi":"10.1007/BF00329030","journal":"Oecologia","badge":"VERIFIED"},"glob.hsm.choat":{"claim":"70 % of 226 forest species operate with hydraulic safety margins under 1 MPa","value":70,"units":"% of species","species":"226 species, 81 sites","trait":"HSM","organ":"stem","group":"global","method":"synthesis of P50 and Ψmin","cite":"Choat et al. 2012 Nature 491: 752 to 755","doi":"10.1038/nature11688","journal":"Nature","badge":"VERIFIED"},"glob.mortality.anderegg":{"claim":"Across 475 species in 33 studies, low hydraulic safety margin and vulnerable xylem best predicted drought mortality","species":"475 tree species","trait":"HSM, P50","organ":"stem","group":"global","method":"meta analysis","cite":"Anderegg et al. 2016 Proc Natl Acad Sci U S A 113: 5024 to 5029","doi":"10.1073/pnas.1525678113","journal":"Proc Natl Acad Sci U S A","badge":"VERIFIED"},"glob.safety_eff.gleason":{"claim":"Safety vs efficiency: across 335 angiosperm and 89 gymnosperm species correlations were weak (r2 < 0.086) but no species was both very safe and very efficient","value":0.086,"units":"r2 (upper bound)","species":"424 species","trait":"P50 vs Ks","organ":"stem","group":"global","method":"synthesis","cite":"Gleason et al. 2015 New Phytol 209: 123 to 136","doi":"10.1111/nph.13646","journal":"New Phytol","badge":"VERIFIED"},"glob.sequence.bartlett":{"claim":"Across 310 species, the average angiosperm closes stomata and wilts before severe stem embolism","species":"262 angiosperms, 48 gymnosperms","trait":"gs closure, TLP, P50 sequence","organ":"leaf/stem","group":"global","method":"synthesis","cite":"Bartlett et al. 2016 Proc Natl Acad Sci U S A 113: 13098 to 13103","doi":"10.1073/pnas.1604088113","journal":"Proc Natl Acad Sci U S A","badge":"VERIFIED","note":"Mean thresholds not in abstract; full text not reachable this run."},"glob.tlp.bartlett2012":{"claim":"Turgor loss point tracks water availability within and across biomes (317 species, 72 studies); osmotic potential at full turgor, not elasticity, drives TLP","species":"317 species","trait":"TLP","organ":"leaf","group":"global","method":"meta analysis + new TLP equations","cite":"Bartlett et al. 2012 Ecol Lett 15: 393 to 405","doi":"10.1111/j.1461-0248.2012.01751.x","journal":"Ecol Lett","badge":"VERIFIED","note":"BIOME MEANS NOT RETRIEVED (table not in abstract, no PMC copy, Scite out). Do not print biome means; use grp.scoffoni11.dry_vs_moist instead."},"glob.tlp.plasticity":{"claim":"Osmotic adjustment of TLP is common but moderate: mean ΔTLP −0.44 MPa, 16 % of post drought TLP (283 wild and crop species); larger for some crop cultivars","value":-0.44,"units":"MPa","species":"283 wild and crop species","trait":"osmotic_adjustment","organ":"leaf","group":"global","method":"meta analysis","cite":"Bartlett et al. 2014 Ecol Lett 17: 1580 to 1590","doi":"10.1111/ele.12374","journal":"Ecol Lett","badge":"VERIFIED"},"glob.kleaf.scoffoni2017":{"claim":"Outside xylem vulnerability explained 75 to 100 % of Kleaf decline from mild stress to beyond TLP (8 species); at TLP only small fractions of vein conduits were embolised (microCT, 4 species)","value":[75,100],"units":"% of Kleaf decline","species":"8 angiosperms (4 imaged)","trait":"Kox share","organ":"leaf","group":"global","method":"microCT + rehydration kinetics + spatial model","cite":"Scoffoni et al. 2017 Plant Physiol 173: 1197 to 1210","doi":"10.1104/pp.16.01643","journal":"Plant Physiol","badge":"VERIFIED"},"glob.kleaf.range":{"claim":"Kleaf varies more than 65 fold across species; the leaf is at least 30 % of whole plant resistance","value":{"fold":65,"leaf_share_pct":30},"units":"fold / %","species":"many species","trait":"Kleaf","organ":"leaf","group":"global","method":"review","cite":"Sack & Holbrook 2006 Annu Rev Plant Biol 57: 361 to 381","doi":"10.1146/annurev.arplant.56.032604.144141","journal":"Annu Rev Plant Biol","badge":"VERIFIED"},"gmin.trueba.groups":{"claim":"Minimum leaf conductance by life form: annual herbs 9.92, perennial herbs 6.67, woody deciduous 5.62, woody evergreen 2.35 mmol m−2 s−1 (means ± SE 0.61, 0.42, 0.35, 0.13)","value":{"annual_herb":9.92,"perennial_herb":6.67,"woody_deciduous":5.62,"woody_evergreen":2.35},"units":"mmol m−2 s−1","species":"101 vascular plant species (ferns to angiosperms; 24 annual herbs)","trait":"gmin","organ":"leaf","group":"global","method":"detached leaf drying, gmin between 80 and 50 % RWC","cite":"Trueba et al. 2026 New Phytol 250: 3716 to 3731","doi":"10.1111/nph.71166","journal":"New Phytol","badge":"VERIFIED","note":"Use annual herb mean as the crop like default (lettuce has no retrieved gmin). Species range 0.66 to 32.06; species mean 6.37 ± 0.66; 50 fold range; weak phylogenetic signal."},"gmin.trueba.range":{"claim":"Species means of gmin ranged 50 fold, 0.66 to 32.06 mmol m−2 s−1","value":[0.66,32.06],"units":"mmol m−2 s−1","species":"101 species","trait":"gmin","organ":"leaf","group":"global","method":"detached leaf drying","cite":"Trueba et al. 2026 New Phytol 250: 3716 to 3731","doi":"10.1111/nph.71166","journal":"New Phytol","badge":"VERIFIED"},"gmin.quercus.T":{"claim":"24 Quercus species: gmin 1.19 to 8.09 mmol m−2 s−1 at 25 °C (VPD 2.2 kPa) converging to 0.57 ± 0.06 at 45 °C (VPD 6.6 kPa), driven by tighter stomatal closure","value":{"25C":[1.19,8.09],"45C":0.57},"units":"mmol m−2 s−1","species":"24 Quercus species (temperate and Mediterranean)","trait":"gmin","organ":"leaf","group":"global (oaks)","method":"bench drying at controlled T and VPD","cite":"Zailaa et al. 2024 Plant Physiol 197","doi":"10.1093/plphys/kiae551","journal":"Plant Physiol","badge":"VERIFIED","note":"Contrasts with Wang 2024 (gmin RISES 2 to 4 fold from 25 to 50 °C in European trees). Present as an OPEN QUESTION: does heat raise or lower gmin? Garen 2026 (doi 10.1093/plphys/kiag575) shows VPD itself lowers gmin by about 0.4 mmol m−2 s−1 per kPa."},"gmin.wang.T":{"claim":"Nine European trees: gmin 0.8 to 4.8 mmol m−2 s−1 at ambient temperature, rising 2 to 4 fold from 25 to 50 °C","value":{"ambient":[0.8,4.8],"fold_25_50C":[2,4]},"units":"mmol m−2 s−1","species":"9 temperate European tree species","trait":"gmin","organ":"leaf","group":"temperate","method":"bench drying + temperature response","cite":"Wang et al. 2024 Tree Physiol 44","doi":"10.1093/treephys/tpae027","journal":"Tree Physiol","badge":"VERIFIED"},"gmin.garen.vpd":{"claim":"gmin falls with VPD: about −0.43 (Banksia integrifolia) and −0.38 (Syncarpia glomulifera) mmol m−2 s−1 per kPa","value":{"Banksia":-0.43,"Syncarpia":-0.38},"units":"mmol m−2 s−1 kPa−1","species":"Banksia integrifolia; Syncarpia glomulifera","trait":"gmin_VPD_slope","organ":"leaf","group":"temperate (Australia)","method":"17 T × VPD combinations, 25 to 50 °C, 2.0 to 11.1 kPa","cite":"Garen et al. 2026 Plant Physiol 201","doi":"10.1093/plphys/kiag575","journal":"Plant Physiol","badge":"VERIFIED"},"gmin.review.duursma":{"claim":"gmin = cuticle plus leaky closed stomata; varies with growing conditions; no clear pattern by group, climate or leaf type in the compiled weight loss data","species":"literature compilation","trait":"gmin","organ":"leaf","group":"global","method":"review","cite":"Duursma et al. 2018 New Phytol 221: 693 to 705","doi":"10.1111/nph.15395","journal":"New Phytol","badge":"VERIFIED","note":"The compiled VALUES (by group) were NOT retrieved: abstract has none and no PMC copy. Do not quote Duursma numbers; use Trueba 2026 group means."},"gmin.grape.110R":{"claim":"Tempranillo grafted on 110R had higher leaf minimum conductance than on SO4 (rootstock effect on gmin)","species":"Vitis vinifera cv. Tempranillo","trait":"gmin","organ":"leaf","group":"crop","method":"dry down to leaf P12","cite":"Flor et al. 2025 J Exp Bot 76: 3141 to 3157","doi":"10.1093/jxb/eraf044","journal":"J Exp Bot","badge":"VERIFIED","note":"No number in abstract."},"gmin.ceanothus":{"claim":"California Ceanothus: steep Kleaf and gs declines with dehydration, combined with low minimum epidermal conductance and leaf water storage (subgenus Cerastes: stomatal crypts, hypodermis)","species":"7 Ceanothus species (common garden)","trait":"gmin, Kleaf, gs","organ":"leaf","group":"chaparral","method":"EFM Kleaf, gas exchange, anatomy","cite":"Zailaa et al. 2024 Plant Cell Environ 48: 1555 to 1573","doi":"10.1111/pce.15208","journal":"Plant Cell Environ","badge":"VERIFIED","note":"Values not in abstract. Fletcher et al. 2018 Am J Bot (doi 10.1002/ajb2.1164): TLP tracks aridity across 10 Ceanothus."},"aqp.buckley.pm":{"claim":"Membrane osmotic water permeability in the outside xylem model: nominal 40 × 10−6 m s−1, range 10 to 70 × 10−6 m s−1","value":{"nominal":4e-05,"range":[1e-05,7e-05]},"units":"m s−1","species":"generic C3 leaf (model)","trait":"Pm (model parameter)","organ":"leaf","group":"model","method":"sensitivity analysis parameter","cite":"Buckley 2015 Plant Cell Environ 38: 7, Table 2","doi":"10.1111/pce.12372","journal":"Plant Cell Environ","badge":"VERIFIED","note":"Other nominal values: cell wall thickness 0.3 µm (0.2 to 0.4), spongy porosity 0.39, palisade porosity 0.19, palisade cell radius 6.5 µm, spongy 12 µm, effective wall pore radius 3 nm."},"aqp.buckley.partition":{"claim":"Outside the bundle sheath: apoplast 72 to 88 %, symplast (transmembrane) 5.9 to 11.6 %, vapour 7.3 to 16.2 % of conductance; apoplast share spans 14.0 to 99.8 % across parameters; vapour up to 44 % with a 0.2 K gradient","value":{"apoplast":[72,88],"symplast":[5.9,11.6],"gas":[7.3,16.2]},"units":"% of outside BS conductance","species":"model","trait":"Kox partition","organ":"leaf","group":"model","method":"model","cite":"Buckley 2015 Plant Cell Environ 38: 7, Table 2","doi":"10.1111/pce.12372","journal":"Plant Cell Environ","badge":"VERIFIED","note":"MODEL OUTPUT, not measurement."},"aqp.buckley2015pp":{"claim":"Across 14 species, vein length per area is the strongest anatomical control of outside xylem conductance; the bundle sheath is a minority of outside xylem resistance; vapour can carry up to two thirds of Kox; veins close to the lower epidermis raise Kox; Kox falls with larger spongy cells and rises with airspace and wall thickness","species":"14 species (model + anatomy)","trait":"Kox determinants","organ":"leaf","group":"model","method":"spatially explicit areole model fed with measured anatomy","cite":"Buckley et al. 2015 Plant Physiol 168: 1616 to 1635","doi":"10.1104/pp.15.00731","journal":"Plant Physiol","badge":"VERIFIED","note":"Tension with Moshelion BSC valve view: Buckley's model puts most outside xylem resistance beyond the bundle sheath, while Moshelion's experiments show BSC Pf regulating Kleaf. Present as an OPEN QUESTION card."},"aqp.shatil2011":{"claim":"Xylem fed ABA lowered Kleaf and bundle sheath cell Pf (reversible with HgCl2); ABA smeared on the blade closed stomata but did not lower Kleaf within 2 to 3 h; mesophyll Pf did not respond","species":"Arabidopsis thaliana","trait":"BSC Pf, Kleaf, ABA","organ":"leaf (bundle sheath)","group":"model plant","method":"protoplast swelling (Pf) of GFP labelled BSCs; detached leaf Kleaf","cite":"Shatil-Cohen et al. 2011 Plant J 67: 72 to 80","doi":"10.1111/j.1365-313X.2011.04576.x","journal":"Plant J","badge":"VERIFIED"},"aqp.sade2014":{"claim":"Silencing all five PIP1 genes everywhere lowered BS and mesophyll Pf, mesophyll CO2 conductance, photosynthesis, Kleaf, transpiration and biomass; silencing PIP1 only in the bundle sheath (SCARECROW promoter) lowered Pf and Kleaf but not gm or photosynthesis, and biomass increased","species":"Arabidopsis thaliana","trait":"PIP1, Kleaf, gm","organ":"leaf","group":"model plant","method":"artificial microRNA, constitutive vs BS specific","cite":"Sade et al. 2014 Plant Physiol 166: 1609 to 1620","doi":"10.1104/pp.114.248633","journal":"Plant Physiol","badge":"VERIFIED"},"aqp.sade2015":{"claim":"Expressing tobacco NtAQP1 only in the bundle sheath restored Kleaf of PIP1 silenced plants to near wild type; ABA acts via aquaporins","species":"Arabidopsis thaliana","trait":"Kleaf rescue","organ":"leaf","group":"model plant","method":"BS targeted complementation","cite":"Sade et al. 2015 Plant Signal Behav 10: e1017177","doi":"10.1080/15592324.2015.1017177","journal":"Plant Signal Behav","badge":"VERIFIED","journal_flag":"Plant Signal Behav: short communication venue, weak; use only as support for Sade 2014"},"aqp.grunwald2021":{"claim":"Bundle sheath H+ ATPase AHA2 acidifies xylem sap (normally below pH 6); knocking it down or buffering sap to pH 7.5 lowered Kleaf, and pH 7.5 lowered BSC Pf","value":7.5,"units":"pH (test)","species":"Arabidopsis thaliana","trait":"xylem sap pH, Kleaf, BSC Pf","organ":"leaf (bundle sheath)","group":"model plant","method":"sap pH imaging, vanadate/fusicoccin, BS complemented aha2","cite":"Grunwald et al. 2021 Plant J 106: 301 to 313","doi":"10.1111/tpj.15235","journal":"Plant J","badge":"VERIFIED"},"aqp.grunwald2022":{"claim":"Blue light raises Kleaf through phototropins PHOT1/PHOT2 in the bundle sheath, which activate AHA2; phot and aha2 mutants lost the increase, BS only complementation restored it","species":"Arabidopsis thaliana","trait":"blue light, Kleaf","organ":"leaf (bundle sheath)","group":"model plant","method":"mutants, BS specific complementation and silencing, tyrphostin 9","cite":"Grunwald et al. 2022 Plant Cell 34: 2328 to 2342","doi":"10.1093/plcell/koac089","journal":"Plant Cell","badge":"VERIFIED"},"aqp.torne2024":{"claim":"ABA inhibits blue light activated BSC AHA2 (sap alkalinises) and stimulates the vacuolar H+ ATPase; both pumps need Ca2+: a Ca2+ dependent, pH mediated link from light and ABA to Kleaf","species":"Arabidopsis thaliana","trait":"ABA, blue light, BSC pumps","organ":"leaf (bundle sheath)","group":"model plant","method":"sap pH and membrane potential probes","cite":"Torne-Srivastava et al. 2024 Plant Physiol 195: 2635 to 2651","doi":"10.1093/plphys/kiae226","journal":"Plant Physiol","badge":"VERIFIED"},"aqp.moshelion2015":{"claim":"Review: vascular (BS) aquaporins regulate Kleaf and may set the isohydric threshold, growth and yield; tissue specific expression proposed to raise water use efficiency","species":"crops and models","trait":"review","organ":"leaf","group":"review","method":"review","cite":"Moshelion et al. 2014 Plant Cell Environ 38: 1785 to 1793","doi":"10.1111/pce.12410","journal":"Plant Cell Environ","badge":"VERIFIED"},"aqp.kelly2017":{"claim":"Glucose and hexokinase 1 repress 10 PIP aquaporins, lower mesophyll Pf and Kleaf","value":10,"units":"PIP genes repressed","species":"Arabidopsis thaliana","trait":"sugar signalling, PIP expression","organ":"leaf","group":"model plant","method":"expression + protoplast Pf + Kleaf","cite":"Kelly et al. 2017 Plant J 91: 325 to 339","doi":"10.1111/tpj.13568","journal":"Plant J","badge":"VERIFIED"},"aqp.martre2002":{"claim":"PIP1 and PIP2 double antisense Arabidopsis: protoplast osmotic conductivity down 5 to 30 fold and root conductivity down 3 fold, compensated by 2.5 fold more root mass; recovery after rewatering was slower","value":{"protoplast_fold":[5,30],"root_fold":3,"root_leaf_ratio_fold":2.5},"units":"fold","species":"Arabidopsis thaliana","trait":"PIP, root Lp, recovery","organ":"root/leaf","group":"model plant","method":"antisense lines","cite":"Martre et al. 2002 Plant Physiol 130: 2101 to 2110","doi":"10.1104/pp.009019","journal":"Plant Physiol","badge":"VERIFIED"},"aqp.vandeleur2008":{"claim":"Grape roots: VvPIP1;1 with VvPIP2;2 gives 3 fold higher water permeability in oocytes; cortex cell Lp doubles in drought stressed Chardonnay (anisohydric) but not Grenache (isohydric)","value":{"coexpression_fold":3,"Lpcell_fold_Chardonnay":2},"units":"fold","species":"Vitis vinifera cv. Chardonnay and Grenache","trait":"root aquaporins","organ":"root","group":"crop","method":"oocyte assays, root Lo, pressure probe, in situ","cite":"Vandeleur et al. 2008 Plant Physiol 149: 445 to 460","doi":"10.1104/pp.108.128645","journal":"Plant Physiol","badge":"VERIFIED","note":"PubMed record date Nov 2008 (epub); journal year 2009."},"aqp.volkov2006":{"claim":"Barley leaf: epidermal cell Lp 0.5 µm s−1 MPa−1 (Pf 65 µm s−1) in the growth zone vs 0.4 (Pf 50) in mature tissue; mesophyll protoplasts Pf 13 vs 8 µm s−1; putative bundle sheath protoplasts 3 fold higher","value":{"Pf_epid_growing":65,"Pf_epid_mature":50,"Pf_meso_growing":13,"Pf_meso_mature":8},"units":"µm s−1","species":"Hordeum vulgare","trait":"Pf","organ":"leaf","group":"crop","method":"pressure probe + protoplast swelling","cite":"Volkov et al. 2006 J Exp Bot 58: 377 to 390","doi":"10.1093/jxb/erl203","journal":"J Exp Bot","badge":"VERIFIED","note":"Real cell Pf values for the membrane plate scale (compare Buckley model Pm 40 µm s−1 nominal)."},"aqp.ma2015":{"claim":"Expressing maize ZmPIP2;4 raised tobacco protoplast Pf by 12 to 30 µm s−1 in PIPK cells vs 3 to 4 µm s−1 in controls; cytosol acidification lowered Pf","value":{"PIPK":[12,30],"control":[3,4]},"units":"µm s−1","species":"Nicotiana tabacum (cultured cells)","trait":"Pf","organ":"cell","group":"model","method":"protoplast swelling","cite":"Ma et al. 2014 Planta 241: 741 to 755","doi":"10.1007/s00425-014-2216-x","journal":"Planta","badge":"VERIFIED"},"aqp.sade2009":{"claim":"Tomato overexpressing tonoplast SlTIP2;2 behaved more anisohydric, transpired more under drought and yielded more fruit in 3 years of glasshouse trials","species":"Solanum lycopersicum","trait":"TIP, isohydry","organ":"whole plant","group":"crop","method":"transgenic lines, lysimeters, glasshouse trials","cite":"Sade et al. 2008 New Phytol 181: 651 to 661","doi":"10.1111/j.1469-8137.2008.02689.x","journal":"New Phytol","badge":"VERIFIED"},"gap.lettuce":{"claim":"No published lettuce TLP, gmin, Kleaf or P50 was found in PubMed this run","species":"Lactuca sativa","trait":"gap","group":"crop","badge":"UNVERIFIED","note":"Lettuce points on the explorer must be ILLUSTRATIVE or absent. Do not use lab data (HARD RULE 2)."},"gap.santiago_sack_species":{"claim":"Species level P50, TLP or gmin values for Santiago (Panama, Amazon) and Sack (Hawaii) species were not reachable: abstracts give no values and the tool returns no full text for Plant Physiol, Ecol Lett, Funct Ecol","trait":"gap","group":"tropical","badge":"UNVERIFIED"}}/*SHEET-END*/;
  // 13 Oct (Lead, binding): the Ceanothus study (Zailaa et al., PCE, doi 10.1111/pce.15208) is not shown anywhere yet.
  // The row stays in sheets/water_species.json; it is only held back from this page (table, CSV, evidence, sources).
  var HELD = {}; Object.keys(SHEET).forEach(function (k) { if (SHEET[k] && (SHEET[k].doi === '10.1111/pce.15208' || SHEET[k].doi === '10.1093/plphys/kiae551')) { HELD[k] = SHEET[k]; delete SHEET[k]; } });
  var ui = null, el = null, refs = {}, view = 'leaf', grapeFrom = 0, selected = null, toyonShown = false;
  var MINUS = '−';
  var FILTER = { chaparral: true, sage: true, woodland: true, garden: true, crop: true, tropical: true, desert: true };
  var GROUPS = {
    chaparral: { name: 'Chaparral', c: '#c8501a', d: '#ff8a5c' },
    sage: { name: 'Coastal sage scrub', c: '#8a6a00', d: '#e8c25a' },
    woodland: { name: 'California woodland and riparian', c: '#2a7a4a', d: '#6fd39a' },
    garden: { name: 'Garden species', c: '#a0457e', d: '#e59ac8' },
    crop: { name: 'Crops', c: '#a8600a', d: '#ffb347' },
    tropical: { name: 'Tropical', c: '#1f5f9e', d: '#7cb8ff' },
    desert: { name: 'Desert succulents', c: '#6b5a2a', d: '#cdb57a' }
  };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function clamp(x, a, b) { return x < a ? a : (x > b ? b : x); }
  function num(x, d) { return WP.fmt ? WP.fmt.num(x, d) : String(x); }
  function psi(x, d) { var s = Math.abs(x).toFixed(d == null ? 2 : d); return (x < 0 && +s !== 0 ? MINUS : '') + s + ' MPa'; }
  function V(k, sub) { var r = SHEET[k]; if (!r) return null; var v = r.value; return sub === undefined ? v : (v ? v[sub] : null); }
  function badge(k, t) {
    k = String(k || '').toUpperCase();
    if (k === 'OPEN QUESTION') return '<span class="badge b-preliminary" role="img" title="' + esc('Under study. ' + (t || '')) + '" aria-label="OPEN QUESTION">OPEN QUESTION</span>';
    if (k === 'MEASURED') return '<span class="badge b-verified" role="img" title="' + esc('Published data. ' + (t || '')) + '" aria-label="MEASURED">MEASURED</span>';
    return ui ? ui.badge(k, t) : k;
  }
  function ev(key, label) {
    return '<button type="button" class="wpev" data-wpev="sp:' + esc(key) + '" aria-expanded="false" title="Show the evidence behind this value">' + esc(label || 'Evidence') + '</button>';
  }
  function sci(t) { return ui && ui.sci ? ui.sci(t) : String(t); }
  function reduced() { return ui && ui.reducedMotion ? ui.reducedMotion() : false; }
  function isDark() { return ui && ui.isDark ? ui.isDark() : false; }
  function gcol(g) { var G = GROUPS[g] || GROUPS.garden; return isDark() ? G.d : G.c; }

  /* ------------------------------------------------------------ r5 (W): rows added on top of the generated sheet.
     They live OUTSIDE the SHEET markers so gen_species_data.py does not overwrite them; S-water may move them into
     water_species.json later. All retrieved this run via PubMed (abstracts; senior ecophysiologist panel, round 5, and W). */
  SHEET['x.oak.optical'] = { claim: 'Coast live oak by the optical method: stem P50 about −4.45 MPa (leaves −4.32 MPa), quoted by Chacon et al. 2020 from Skelton and colleagues; the Skelton et al. 2018 abstract gives stem air entry from −1.17 to −4.91 MPa across eight California oaks and says the plants always lost turgor before stem embolism',
    value: -4.45, units: 'MPa', species: 'Quercus agrifolia', method: 'optical vulnerability (light transmission through stems and leaves while drying)', cite: 'Skelton, Dawson, Thompson, Shen, Weitz and Ackerly 2018 Plant Physiol 177: 1066 to 1077 (oak values as quoted in Chacon et al. 2020)',
    doi: '10.1104/pp.18.00103', journal: 'Plant Physiol', badge: 'UNVERIFIED', note: 'Secondary: the −4.45 MPa species value was read in Chacon et al. 2020, not in Skelton Table 1. The eight oak range and the turgor before embolism statement are from the retrieved abstract.' };
  SHEET['x.oak.centrifuge'] = { claim: 'The centrifuge P50 of coast live oak (−1.96 MPa on 14.2 cm stems, −1.79 MPa on 25.2 cm) came from segments shorter than its vessels: maximum vessel length 0.89 ± 0.22 m. The minimum Ψ of −2.5 MPa is a midday LEAF value.',
    value: -1.79, units: 'MPa', species: 'Quercus agrifolia', method: 'centrifuge on segments shorter than the longest vessels; native PLC 19 to 64 % at −0.86 to −1.87 MPa supported the curve', cite: 'Chacon, Baer, Wheeler and Pittermann 2020 PLoS One 15: e0230868 (full text, PMC7117729)',
    doi: '10.1371/journal.pone.0230868', journal: 'PLoS One', badge: 'VERIFIED', journal_flag: 'PLoS One: peer reviewed, broad scope; acceptable, not a top specialist journal' };
  SHEET['x.chap.p50'] = { claim: 'Chaparral stem P50s exist for six co-occurring Southern California shrubs (Jacobsen et al. 2005, P50 strongly tied to the seasonal minimum Ψ) and as P75 for 29 shrubs (Pratt et al. 2021). Their species values were not retrievable in this build, so none are plotted.',
    units: 'MPa', species: 'Southern California chaparral shrubs', method: 'centrifuge; Pratt et al. 2021 report P75 on 14 cm stems, n = 6 per species', cite: 'Jacobsen, Ewers, Pratt, Paddock and Davis 2005 Plant Physiol 139: 546 to 556; Pratt et al. 2021 PNAS 118: e2104336118',
    doi: '10.1104/pp.104.058404', journal: 'Plant Physiol', badge: 'UNVERIFIED', note: 'Second source: doi 10.1073/pnas.2104336118.' };
  // Linton and Nobel 1999: abstract retrieved this run (PMID 10562245); PubMed returns no DOI, so the PMID is the identifier
  if (SHEET['sp.agav_dese.rootp50']) { var ag = SHEET['sp.agav_dese.rootp50']; ag.badge = 'VERIFIED'; ag.pmid = '10562245';
    ag.cite = 'Linton and Nobel 1999 Am J Bot 86: 1538 to 1543 (PMID 10562245; no DOI in PubMed)'; ag.claim = 'Roots of Agave deserti: mean cavitation pressure −0.93 ± 0.08 MPa (air injection and centrifuge); Opuntia ficus-indica −0.70 ± 0.02 MPa (centrifuge); 22 % and 32 % loss of conductance predicted at soil −0.25 MPa, 69 % and 62 % after a 3 month drought';
    ag.note = 'The paper calls it the mean cavitation pressure, not P50. Abstract read in PubMed this run.'; }

  /* ------------------------------------------------------------ sources and evidence from the sheet */
  function register() {
    if (!WP.SPEC) return;
    WP.SPEC.sources = WP.SPEC.sources || {};
    WP.evidence = WP.evidence || {};
    Object.keys(SHEET).forEach(function (k) {
      var r = SHEET[k];
      if (r.doi && !WP.SPEC.sources[r.doi]) WP.SPEC.sources[r.doi] = { label: r.cite || r.doi, status: r.badge === 'VERIFIED' ? 'VERIFIED' : 'UNVERIFIED' };
      if (k === 'x.chap.p50' && !WP.SPEC.sources['10.1073/pnas.2104336118']) WP.SPEC.sources['10.1073/pnas.2104336118'] = { label: 'Pratt et al. 2021 PNAS 118: e2104336118', status: 'UNVERIFIED' };
      WP.evidence['sp:' + k] = {
        claim: r.claim || '', cite: (r.cite || 'No source retrieved') + (r.journal_flag ? '. Journal note: ' + r.journal_flag : ''),
        doi: r.doi || null, measured: [r.species, r.method].filter(Boolean).join('. '), fig: r.note || '',
        badge: r.badge === 'VERIFIED' ? 'MEASURED' : (r.badge || 'UNVERIFIED')
      };
    });
  }
  register();

  WP.howto = WP.howto || {};
  if (!WP.howto.pv) WP.howto.pv = { title: 'turgor loss point from a pressure volume curve', what: 'one leaf, a pressure chamber and a balance', steps: [
    'Rehydrate a leaf fully (cut end in water, covered) and weigh it.',
    'Let it dry on the bench; at intervals, measure its water potential in the pressure chamber and weigh it again.',
    'Plot 1 ÷ (−Ψ) against relative water content lost. The curve turns into a straight line where turgor reaches zero: that point is the turgor loss point; the line extrapolated to full hydration gives the osmotic potential at full turgor.',
    'The bulk elastic modulus comes from the same curve: above the turgor loss point, ε = ΔΨp ÷ ΔRWC (turgor lost per fraction of water lost). The ε values printed on the Tissue plate are back calculated this way from published πo and TLP, so they are DERIVED.',
    'A faster route for the turgor loss point: measure the osmotic potential of a frozen and thawed leaf disc in an osmometer and use the πo to πtlp relation of Bartlett et al. 2012 (Ecol Lett, doi 10.1111/j.1461-0248.2012.01751.x). The osmometer protocol itself was published separately (Bartlett et al. 2012, Methods Ecol Evol), not retrieved here.'],
    watch: 'Over rehydration of some leaves gives a plateau at the start of the curve; drop those points. Osmometer estimates need the published conversion, and the conversion was built across many species.',
    dois: ['10.1111/j.1461-0248.2012.01751.x', '10.1093/jxb/err270'],
    proto: { url: 'https://prometheusprotocols.net/function/water-relations/pressure-volume-curves/leaf-pressure-volume-curve-parameters/', label: 'Leaf pressure volume curve parameters' } };
  if (!WP.howto.efm) WP.howto.efm = { title: 'leaf hydraulic conductance by the evaporative flux method', what: 'a leaf transpiring from a flowmeter', steps: [
    'Cut a leaf under water and connect its petiole to a tube of water on a balance or flowmeter.',
    'Let it transpire under strong light until the flow is steady; record the flow, E.',
    'Stop, and measure leaf Ψ in the pressure chamber. Kleaf = E ÷ (0 − Ψleaf), normalised by leaf area and corrected to 25 °C for viscosity.',
    'Repeat on leaves dried first to a range of Ψ to build a vulnerability curve; fit the curve and read P50 and P80.'],
    watch: 'Only steady flows count. Methods (evaporative flux, rehydration kinetics, vacuum) can give different Kleaf for the same leaf.',
    dois: ['10.1093/jxb/err270', '10.1093/jxb/eraa392'],
    proto: { url: 'https://prometheusprotocols.net/function/water-relations/hydraulic-conductance-and-conductivity/constructing-and-operating-a-hydraulics-flow-meter/', label: 'Constructing and operating a hydraulics flow meter (the page notes it can be used for the evaporative flux method); see also Non steady state rehydration to determine leaf hydraulic conductance, vulnerability and capacitance' } };

  /* ------------------------------------------------------------ points from the sheet */
  function grpOf(g) {
    g = String(g || '').toLowerCase();
    if (/coastal sage/.test(g)) return 'sage';
    if (/chaparral/.test(g)) return 'chaparral';
    if (/desert/.test(g)) return 'desert';
    if (/tropical/.test(g)) return 'tropical';
    if (/crop/.test(g)) return 'crop';
    if (/garden/.test(g)) return 'garden';
    return 'woodland';
  }
  var COMMON = { cerc_betu: 'mountain mahogany', coma_dive: 'summer holly', hete_arbu: 'toyon', quer_agri: 'coast live oak', hede_cana: 'Canary Island ivy',
    plat_race: 'western sycamore', came_sasa: 'sasanqua camellia', heli_annu: 'sunflower', lant_cama: 'lantana', magn_gran: 'southern magnolia' };
  function leafPoints() {
    var pts = [];
    Object.keys(COMMON).forEach(function (c) {
      var t = SHEET['sp.' + c + '.tlp'], p = SHEET['sp.' + c + '.kleafp50'], k = SHEET['sp.' + c + '.kleafmax'];
      if (!t || !p) return;
      pts.push({ id: c, sp: t.species, common: COMMON[c], g: grpOf(t.group), x: t.value, y: p.value, kmax: k ? k.value : null, keys: ['sp.' + c + '.tlp', 'sp.' + c + '.kleafp50', 'sp.' + c + '.kleafmax'], toyon: c === 'hete_arbu' });
    });
    // grapevine, Albuquerque et al. 2020 Table 2. Curves fitted from Ψ = 0 (sheet values) or from Ψ = −0.3 MPa
    // (Table 2 second set, from lead_verified_from_pdfs.json, grape_Kleaf_P50 note).
    var g0 = { cs: SHEET['sp.vitis_cs.kleafp50'], ch: SHEET['sp.vitis_ch.kleafp50'] }, g3 = { cs: -0.61, ch: -0.56 };
    [['cs', 'Cabernet Sauvignon', 14.52], ['ch', 'Chardonnay', 13.9]].forEach(function (a) {
      var t = SHEET['sp.vitis_' + a[0] + '.tlp'], p = g0[a[0]];
      if (!t || !p) return;
      pts.push({ id: 'vitis_' + a[0], sp: 'Vitis vinifera cv. ' + a[1], common: 'grapevine, ' + a[1], g: 'crop', x: t.value, y: grapeFrom ? g3[a[0]] : p.value, kmax: a[2],
        keys: ['sp.vitis_' + a[0] + '.tlp', 'sp.vitis_' + a[0] + '.kleafp50', 'sp.vitis_' + a[0] + '.gsp50'], grape: true });
    });
    return pts;
  }
  function tlpRug() {
    var r = [];
    var oak = SHEET['sp.quer_agri.tlp_cc']; if (oak) r.push({ x: oak.value, g: 'woodland', lab: 'coast live oak, central coast population', key: 'sp.quer_agri.tlp_cc' });
    var mad = SHEET['sp.arbu_menz.tlp']; if (mad) r.push({ x: mad.value, g: 'woodland', lab: 'Pacific madrone', key: 'sp.arbu_menz.tlp' });
    var sal = V('sp.salvia.tlp', 'Salvia_pair'); if (sal) sal.forEach(function (x, i) { r.push({ x: x, g: 'sage', lab: 'coastal sage, Salvia ' + (i + 1) + ' of 2', key: 'sp.salvia.tlp' }); });
    var mn = V('sp.salvia.tlp', 'most_negative_pair'); if (mn) mn.forEach(function (x) { r.push({ x: x, g: 'chaparral', lab: 'Southern California shrub (species not resolved)', key: 'sp.salvia.tlp' }); });
    var me = SHEET['sp.vitis_me.tlp_oa']; if (me) { r.push({ x: me.value.WW, g: 'crop', lab: 'Merlot, well watered', key: 'sp.vitis_me.tlp_oa' }); r.push({ x: me.value.SD, g: 'crop', lab: 'Merlot after 39 days of deficit', key: 'sp.vitis_me.tlp_oa', oa: me.value.WW }); }
    return r;
  }
  function stemPoints() {
    var p = [];
    var oakP = SHEET['sp.quer_agri.p50stem'], oakM = SHEET['sp.quer_agri.psimin'], oakH = SHEET['sp.quer_agri.hsm'];
    if (oakM && oakH) p.push({ id: 'oak', common: 'coast live oak, centrifuge', sp: 'Quercus agrifolia', g: 'woodland', x: oakM.value, y: oakM.value - oakH.value, leafPsi: true, keys: ['x.oak.centrifuge', 'sp.quer_agri.psimin', 'sp.quer_agri.hsm', 'sp.quer_agri.p50stem'],
      note: 'Filled point: centrifuge P50 ' + psi(oakM.value - oakH.value) + ' (25.2 cm stems; ' + (oakP ? psi(oakP.value) : 'similar') + ' on 14.2 cm stems), which puts the tree past its P50 (margin ' + psi(oakH.value) + ') with no dieback. Hollow point: the optical method, about −4.45 MPa, which would give a margin near +1.95 MPa. Which is right is an open question; see the card under the chart. The x value is a midday leaf Ψ.' });
    var oakO = SHEET['x.oak.optical'];
    if (oakM && oakO) p.push({ id: 'oak_opt', common: 'coast live oak, optical method', sp: 'Quercus agrifolia', g: 'woodland', x: oakM.value, y: oakO.value, hollow: true, link: 'oak', leafPsi: true, keys: ['x.oak.optical', 'sp.quer_agri.psimin'],
      note: 'Hollow point: optical vulnerability, as quoted by Chacon et al. 2020 (UNVERIFIED until Skelton Table 1 is read). Same tree species, same leaf Ψmin, a different method.' });
    var mP = SHEET['sp.arbu_menz.p50stem'], mM = SHEET['sp.arbu_menz.psimin'];
    if (mP && mM) p.push({ id: 'madrone', common: 'Pacific madrone', sp: 'Arbutus menziesii', g: 'woodland', x: mM.value.Psi_min, y: mP.value, leafPsi: true, keys: ['sp.arbu_menz.psimin', 'sp.arbu_menz.p50stem'] });
    var an = SHEET['sp.anno_glab.p50'];
    if (an) p.push({ id: 'annona', common: 'pond apple', sp: 'Annona glabra', g: 'tropical', x: an.value.Psi_min, y: an.value.P50, keys: ['sp.anno_glab.p50'], note: 'Margin about ' + num(an.value.Psi_min - an.value.P50, 1) + ' MPa (DERIVED).' });
    var cl = SHEET['sp.clus_uvit.p50'];
    if (cl) p.push({ id: 'clusia', common: 'Clusia, a C3 to CAM hemiepiphyte', sp: 'Clusia uvitana', g: 'tropical', x: (cl.value.Psi_leaf[0] + cl.value.Psi_leaf[1]) / 2, xr: cl.value.Psi_leaf, y: cl.value.P50, keys: ['sp.clus_uvit.p50'], leafPsi: true, note: 'The Ψ shown is leaf Ψ, not a seasonal stem minimum (bar = the reported range).' });
    var am = SHEET['comm.amazon.central'];
    if (am) p.push({ id: 'amazon', common: 'central Amazon canopy trees (mean of 11)', sp: '11 canopy species', g: 'tropical', x: am.value.P50 + am.value.HSM, y: am.value.P50, keys: ['comm.amazon.central'], note: 'Ψmin = P50 + margin, DERIVED from the two published means.' });
    var mg = SHEET['comm.mangrove'];
    if (mg) p.push({ id: 'mangrove', common: 'eight mangroves (ranges)', sp: '8 woody mangrove species', g: 'tropical', box: { x: mg.value.Psi_min, y: mg.value.P50 }, x: (mg.value.Psi_min[0] + mg.value.Psi_min[1]) / 2, y: (mg.value.P50[0] + mg.value.P50[1]) / 2, keys: ['comm.mangrove'], note: 'Drawn as the box of the reported ranges, not one species.' });
    return p;
  }
  function stemRugY() {
    var r = [];
    var sy = SHEET['sp.vitis_sy.p50']; if (sy) r.push({ y: sy.value.stem, g: 'crop', lab: 'grapevine (Syrah) stem P50, no field minimum on the sheet', key: 'sp.vitis_sy.p50' });
    var hv = SHEET['sp.heve_bras.p50']; if (hv) r.push({ y0: hv.value[0], y1: hv.value[1], g: 'tropical', lab: 'rubber tree plantations, branch P50 range', key: 'sp.heve_bras.p50' });
    var td = SHEET['comm.tropdry.p50range']; if (td) r.push({ y0: td.value[0], y1: td.value[1], g: 'tropical', lab: 'tropical dry forest saplings, 13 species, P50 range', key: 'comm.tropdry.p50range' });
    return r;
  }

  /* ------------------------------------------------------------ CSS */
  var CSS = '\
#lv-species{--sp-grid:rgba(90,80,70,.18);--sp-band:rgba(43,95,164,.10);--sp-band2:rgba(43,95,164,.05);--sp-neg:rgba(154,59,32,.08);--sp-line:#5e5141}\
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]) #lv-species{--sp-grid:rgba(200,210,225,.14);--sp-band:rgba(124,184,255,.13);--sp-band2:rgba(124,184,255,.06);--sp-neg:rgba(240,149,122,.10);--sp-line:#b3aca0}}\
:root[data-theme="dark"] #lv-species{--sp-grid:rgba(200,210,225,.14);--sp-band:rgba(124,184,255,.13);--sp-band2:rgba(124,184,255,.06);--sp-neg:rgba(240,149,122,.10);--sp-line:#b3aca0}\
#lv-species{font-family:var(--text);color:var(--ink)}\
#lv-species .sp-h{font-family:var(--disp);font-size:21px;margin:26px 0 4px;font-weight:400}\
#lv-species .sp-sub{font-family:var(--ui);font-size:14px;color:var(--ink2);margin:0 0 10px;line-height:1.5}\
#lv-species .sp-small{font-family:var(--ui);font-size:13px;color:var(--ink2);line-height:1.5}\
#lv-species .sp-now{font-family:var(--ui);font-size:14.5px;line-height:1.5;background:var(--card);border-left:3px solid var(--accent);padding:8px 12px;margin:8px 0 12px}\
#lv-species .sp-bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:6px 0 8px}\
#lv-species .sp-fil{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 8px}\
#lv-species .sp-fil .chip{display:inline-flex;align-items:center;gap:6px}\
#lv-species .sp-fil .chip i{width:11px;height:11px;border-radius:50%;display:inline-block;border:1px solid rgba(0,0,0,.25)}\
#lv-species .sp-fil .chip[aria-pressed="false"]{opacity:.55;text-decoration:line-through}\
#lv-species .sp-chart{width:100%;height:auto;display:block;background:var(--wall);border:1px solid var(--rule2);border-radius:6px;touch-action:manipulation}\
#lv-species .sp-chart text{font-family:var(--ui);font-size:12px;fill:var(--ink2)}\
#lv-species .sp-chart .ax{stroke:var(--sp-line);stroke-width:1.2}\
#lv-species .sp-chart .gl{stroke:var(--sp-grid);stroke-width:1}\
#lv-species .sp-chart .pt{cursor:pointer;stroke:var(--paper);stroke-width:1.5;transition:r .4s var(--ease),opacity .4s}\
#lv-species .sp-chart .pt:focus{outline:none;stroke:var(--ink);stroke-width:3}\
#lv-species details.sp-every>summary{cursor:pointer;font-family:var(--ui);font-size:14px;min-height:44px;display:flex;align-items:center;color:var(--accent)}\
#lv-species .sp-chart .pt:focus-visible{outline:2px solid var(--accent);outline-offset:3px;stroke:var(--accent);stroke-width:4}\
#lv-species .sp-chart .pt.sel{stroke:var(--ink);stroke-width:3}\
#lv-species .sp-chart .lbl{font-size:11.5px;fill:var(--ink);pointer-events:none}\
#lv-species .sp-chart .ttl{font-size:13px;fill:var(--ink);font-weight:600}\
#lv-species .sp-detail{border:1px solid var(--rule2);background:var(--card);border-radius:6px;padding:10px 12px;margin:10px 0;font-family:var(--ui);font-size:14px;line-height:1.5}\
#lv-species .sp-detail h4{margin:0 0 4px;font-size:15px}\
#lv-species .sp-detail dl{display:grid;grid-template-columns:max-content 1fr;gap:2px 12px;margin:6px 0}\
#lv-species .sp-detail dt{color:var(--ink2)}\
#lv-species .sp-detail dd{margin:0}\
#lv-species .sp-grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px}\
@media (max-width:760px){#lv-species .sp-grid2{grid-template-columns:1fr}}\
#lv-species .sp-card{border:1px solid var(--rule2);background:var(--card);border-radius:6px;padding:10px 12px}\
#lv-species .sp-rng{display:grid;grid-template-columns:1fr auto;gap:2px 10px;align-items:center;font-family:var(--ui);font-size:13.5px;margin:6px 0}\
#lv-species .sp-rng label small{display:block;color:var(--ink2);font-size:12px}\
#lv-species .sp-rng input{grid-column:1 / -1;width:100%;min-height:32px}\
#lv-species .sp-rng output{font-family:var(--mono);font-variant-numeric:tabular-nums}\
#lv-species .sp-oq{border:1px dashed var(--b-pre);background:var(--card);padding:10px 12px;margin:14px 0;border-radius:6px;font-family:var(--ui);font-size:14px;line-height:1.5}\
#lv-species .sp-oq h4{margin:0 0 6px;font-size:14.5px}\
#lv-species .sp-tw{overflow-x:auto;max-width:100%}\
#lv-species table.sp-t{border-collapse:collapse;font-family:var(--ui);font-size:12.5px;min-width:640px}\
#lv-species table.sp-t th,#lv-species table.sp-t td{border-bottom:1px solid var(--rule2);padding:4px 6px;text-align:left;vertical-align:top}\
#lv-species table.sp-t td.num{font-family:var(--mono);white-space:nowrap}\
#lv-species .sp-gauge{width:100%;max-width:520px;height:auto;display:block;margin:0 auto}\
#lv-species .sp-needle{transition:transform 1.4s cubic-bezier(.3,1.4,.4,1);transform-origin:260px 230px}\
#lv-species .sp-res{font-family:var(--ui);font-size:15px;line-height:1.5;margin:8px 0}\
#lv-species .sp-res b.ok{color:var(--b-ver)}#lv-species .sp-res b.bad{color:var(--b-pre)}\
#lv-species .sp-plant{width:110px;height:auto;flex:0 0 auto}\
#lv-species .sp-simrow{display:flex;gap:12px;align-items:flex-start}\
@media (max-width:560px){#lv-species .sp-simrow{flex-direction:column}#lv-species .sp-plant{width:90px;align-self:center}}\
@keyframes sp-grow{from{stroke-dashoffset:var(--len)}to{stroke-dashoffset:0}}\
#lv-species svg.grow .sp-root{animation:sp-grow 1.8s var(--ease) both}\
#lv-species .sp-simrow>div:first-child{flex:0 0 110px}\
#lv-species .sp-molstage{margin:6px 0}\
#lv-species .ptc{margin:8px 0}\
[data-tier="1"] #lv-species .tier-2,[data-tier="1"] #lv-species .tier-3,[data-tier="2"] #lv-species .tier-3{display:none!important}';
  function injectCSS() { if (document.getElementById('sp-css')) return; var s = document.createElement('style'); s.id = 'sp-css'; s.textContent = CSS; document.head.appendChild(s); }

  /* ------------------------------------------------------------ the explorer charts */
  var CH = { w: 640, h: 440, l: 64, r: 18, t: 34, b: 56 };
  function narrow() { return !!el && el.clientWidth > 0 && el.clientWidth < 560; }
  function sizeCH() { CH.w = narrow() ? 420 : 640; CH.h = narrow() ? 460 : 440; CH.l = narrow() ? 54 : 64; }
  function scale(min, max, a, b) { return function (v) { return a + (v - min) / (max - min) * (b - a); }; }
  function axes(X, Y, xmin, ymin, xlab, ylab, step) {
    var s = [];
    for (var v = 0; v >= xmin - 1e-9; v -= step) {
      s.push('<line class="gl" x1="' + X(v) + '" y1="' + CH.t + '" x2="' + X(v) + '" y2="' + (CH.h - CH.b) + '"/>');
      s.push('<text x="' + X(v) + '" y="' + (CH.h - CH.b + 18) + '" text-anchor="middle">' + (v === 0 ? '0' : MINUS + Math.abs(v)) + '</text>');
    }
    for (v = 0; v >= ymin - 1e-9; v -= step) {
      s.push('<line class="gl" x1="' + CH.l + '" y1="' + Y(v) + '" x2="' + (CH.w - CH.r) + '" y2="' + Y(v) + '"/>');
      s.push('<text x="' + (CH.l - 8) + '" y="' + (Y(v) + 4) + '" text-anchor="end">' + (v === 0 ? '0' : MINUS + Math.abs(v)) + '</text>');
    }
    s.push('<line class="ax" x1="' + CH.l + '" y1="' + (CH.h - CH.b) + '" x2="' + (CH.w - CH.r) + '" y2="' + (CH.h - CH.b) + '"/>');
    s.push('<line class="ax" x1="' + CH.l + '" y1="' + CH.t + '" x2="' + CH.l + '" y2="' + (CH.h - CH.b) + '"/>');
    s.push('<text x="' + ((CH.l + CH.w - CH.r) / 2) + '" y="' + (CH.h - 14) + '" text-anchor="middle" class="ttl">' + xlab + '</text>');
    s.push('<text transform="translate(16,' + ((CH.t + CH.h - CH.b) / 2) + ') rotate(-90)" text-anchor="middle" class="ttl">' + ylab + '</text>');
    return s.join('');
  }
  function pointSVG(p, X, Y, r) {
    var vis = FILTER[p.g];
    return '<circle class="pt' + (selected === p.id ? ' sel' : '') + '" data-pt="' + p.id + '" tabindex="' + (vis ? 0 : -1) + '" role="button" aria-label="' + esc(p.common + ', ' + p.sp) + '" cx="' + X(p.x).toFixed(1) + '" cy="' + Y(p.y).toFixed(1) + '" r="' + (vis ? r : 0) + '" fill="' + gcol(p.g) + '" style="opacity:' + (vis ? 1 : 0) + '"/>';
  }
  function leafChart() {
    sizeCH();
    var X = scale(0, -4, CH.l, CH.w - CH.r), Y = scale(0, -4, CH.t, CH.h - CH.b), s = [];
    s.push('<svg class="sp-chart" viewBox="0 0 ' + CH.w + ' ' + CH.h + '" role="img" aria-labelledby="sp-lc-t"><title id="sp-lc-t">Leaf view: turgor loss point against the water potential at which leaf hydraulic conductance halves, one point per species</title>');
    // regions either side of the 1:1 line
    s.push('<path d="M' + X(0) + ',' + Y(0) + ' L' + X(-4) + ',' + Y(-4) + ' L' + X(-4) + ',' + Y(0) + 'Z" fill="var(--sp-band2)"/>');
    s.push(axes(X, Y, -4, -4, 'Turgor loss point, MPa (drier →)', 'K<tspan baseline-shift="sub" font-size="9">leaf</tspan> P50, MPa (drier ↓)', 1));
    s.push('<line x1="' + X(0) + '" y1="' + Y(0) + '" x2="' + X(-4) + '" y2="' + Y(-4) + '" stroke="var(--sp-line)" stroke-dasharray="5 4" stroke-width="1.4"/>');
    s.push('<text x="' + X(-3.75) + '" y="' + Y(-1.0) + '" text-anchor="end" class="lbl">K<tspan baseline-shift="sub" font-size="8">leaf</tspan> halves before turgor is lost</text>');
    s.push('<text x="' + X(-0.25) + '" y="' + Y(-3.2) + '" class="lbl">turgor is lost first</text>');
    s.push('<text x="' + X(-3.05) + '" y="' + Y(-3.3) + '" class="lbl" transform="rotate(34 ' + X(-3.05) + ' ' + Y(-3.3) + ')">1 : 1</text>');
    // rug of species with a TLP but no Kleaf P50
    var rug = tlpRug(), yR = CH.h - CH.b - 6;
    rug.forEach(function (r) {
      if (!FILTER[r.g]) return;
      if (r.oa != null) s.push('<path d="M' + X(r.oa) + ',' + (yR - 9) + ' L' + X(r.x) + ',' + (yR - 9) + '" stroke="' + gcol(r.g) + '" stroke-width="1.6" marker-end="url(#sp-arr)"/>');
      if (r.x < -3.97) { s.push('<path d="M' + (X(-4) - 9) + ',' + (yR - 6) + ' L' + X(-4) + ',' + yR + ' L' + (X(-4) - 9) + ',' + (yR + 6) + 'Z" fill="' + gcol(r.g) + '"><title>' + esc(r.lab + ': TLP ' + psi(r.x) + ', beyond this axis') + '</title></path>'); return; }
      s.push('<rect x="' + (X(r.x) - 1.5) + '" y="' + (yR - 6) + '" width="3" height="12" fill="' + gcol(r.g) + '"><title>' + esc(r.lab + ': TLP ' + psi(r.x)) + '</title></rect>');
    });
    s.push('<defs><marker id="sp-arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10z" fill="var(--sp-line)"/></marker></defs>');
    var pts = leafPoints();
    pts.forEach(function (p) {
      var r = p.kmax ? clamp(3.5 + 1.6 * Math.sqrt(p.kmax), 5, 14) : 6;
      if (p.toyon && !toyonShown) {
        s.push('<g class="sp-q" aria-hidden="true"><circle cx="' + X(p.x) + '" cy="' + Y(p.y) + '" r="14" fill="none" stroke="var(--sp-line)" stroke-dasharray="3 3"/><text x="' + X(p.x) + '" y="' + (Y(p.y) + 5) + '" text-anchor="middle" class="ttl">?</text></g>');
        return;
      }
      s.push(pointSVG(p, X, Y, r));
    });
    // labels: greedy placement that avoids every dot, every placed label and the 1:1 line (wide screens label all)
    var placed = [], dots = [];
    // the two fixed region labels are obstacles too
    (function () { var w1 = 33 * 6.6, x1 = X(-3.75); placed.push({ x0: x1 - w1, x1: x1, y0: Y(-1.0) - 11, y1: Y(-1.0) + 3 }); var w2 = 21 * 6.6, x2 = X(-0.25); placed.push({ x0: x2, x1: x2 + w2, y0: Y(-3.2) - 11, y1: Y(-3.2) + 3 }); })();
    pts.forEach(function (p) { if (FILTER[p.g] && !(p.toyon && !toyonShown)) { var rr0 = p.kmax ? clamp(3.5 + 1.6 * Math.sqrt(p.kmax), 5, 14) : 6; dots.push({ x: X(p.x), y: Y(p.y), r: rr0 + 2 }); } });
    function hitBox(b) {
      var k = 0;
      dots.forEach(function (d) { var cx = clamp(d.x, b.x0, b.x1), cy = clamp(d.y, b.y0, b.y1); if ((cx - d.x) * (cx - d.x) + (cy - d.y) * (cy - d.y) < d.r * d.r) k += 4; });
      placed.forEach(function (q) { if (b.x0 < q.x1 && b.x1 > q.x0 && b.y0 < q.y1 && b.y1 > q.y0) k += 6; });
      if (b.x0 < CH.l + 2 || b.x1 > CH.w - 4 || b.y0 < CH.t - 2 || b.y1 > CH.h - CH.b - 14) k += 8;
      // the 1:1 line in pixel space: y − Y(0) = (x − X(0)) × slope
      var sl = (Y(-4) - Y(0)) / (X(-4) - X(0)), f = function (x, y) { return (y - Y(0)) - sl * (x - X(0)); };
      var sg = [f(b.x0, b.y0), f(b.x1, b.y0), f(b.x0, b.y1), f(b.x1, b.y1)];
      if (Math.min.apply(null, sg) < 0 && Math.max.apply(null, sg) > 0) k += 2;
      return k;
    }
    pts.forEach(function (p) {
      if (!FILTER[p.g] || (p.toyon && !toyonShown)) return;
      if (narrow() && !{ heli_annu: 1, vitis_cs: 1, quer_agri: 1, plat_race: 1, coma_dive: 1, hete_arbu: 1, came_sasa: 1, lant_cama: 1 }[p.id]) return;
      var short = { hete_arbu: 'toyon', heli_annu: 'sunflower', quer_agri: 'coast live oak', plat_race: 'sycamore', coma_dive: 'summer holly', vitis_cs: 'Cabernet', vitis_ch: 'Chardonnay', magn_gran: 'magnolia', hede_cana: 'ivy', lant_cama: 'lantana', came_sasa: 'camellia', cerc_betu: 'mountain mahogany' }[p.id] || p.common;
      var rr = p.kmax ? clamp(3.5 + 1.6 * Math.sqrt(p.kmax), 5, 14) : 6, px = X(p.x), py = Y(p.y), w = short.length * 6.6 + 2, h = 13;
      var C = [[rr + 5, 4, 'start'], [-(rr + 5), 4, 'end'], [0, -(rr + 6), 'middle'], [0, rr + 15, 'middle'], [rr + 3, -(rr + 3), 'start'], [-(rr + 3), -(rr + 3), 'end'], [rr + 3, rr + 13, 'start'], [-(rr + 3), rr + 13, 'end']];
      var best = null;
      C.forEach(function (c, i) {
        var x0 = c[2] === 'start' ? px + c[0] : (c[2] === 'end' ? px + c[0] - w : px - w / 2), b = { x0: x0, x1: x0 + w, y0: py + c[1] - 10, y1: py + c[1] + 3 };
        var sc = hitBox(b) + i * 0.05; if (!best || sc < best.sc) best = { sc: sc, c: c, b: b };
      });
      placed.push(best.b);
      s.push('<text class="lbl" x="' + (px + best.c[0]).toFixed(1) + '" y="' + (py + best.c[1]).toFixed(1) + '" text-anchor="' + best.c[2] + '">' + esc(short) + '</text>');
    });
    s.push('<text x="' + (CH.w - CH.r) + '" y="' + (CH.t - 12) + '" text-anchor="end">dot size: K<tspan baseline-shift="sub" font-size="8">leaf</tspan> max · ticks on the axis: TLP only</text>');
    s.push('</svg>');
    return s.join('');
  }
  function stemChart() {
    sizeCH();
    var X = scale(0, -7, CH.l, CH.w - CH.r), Y = scale(0, -7, CH.t, CH.h - CH.b), s = [];
    s.push('<svg class="sp-chart" viewBox="0 0 ' + CH.w + ' ' + CH.h + '" role="img" aria-labelledby="sp-sc-t"><title id="sp-sc-t">Stem view: minimum field water potential against stem P50, with hydraulic safety margin bands</title>');
    // bands: HSM < 0 above the line; 0 to 1 MPa; > 1 MPa
    s.push('<path d="M' + X(0) + ',' + Y(0) + ' L' + X(-7) + ',' + Y(-7) + ' L' + X(-7) + ',' + Y(0) + 'Z" fill="var(--sp-neg)"/>');
    s.push('<path d="M' + X(0) + ',' + Y(0) + ' L' + X(-7) + ',' + Y(-7) + ' L' + X(-6) + ',' + Y(-7) + ' L' + X(0) + ',' + Y(-1) + 'Z" fill="var(--sp-band)"/>');
    s.push(axes(X, Y, -7, -7, 'Lowest measured Ψ, leaf or stem: see each point (MPa, drier →)', 'Stem P50, MPa (drier ↓)', 1));
    s.push('<line x1="' + X(0) + '" y1="' + Y(0) + '" x2="' + X(-7) + '" y2="' + Y(-7) + '" stroke="var(--sp-line)" stroke-dasharray="5 4" stroke-width="1.4"/>');
    s.push('<text x="' + X(-6.7) + '" y="' + Y(-2.2) + '" text-anchor="end" class="lbl">beyond P50: negative margin</text>');
    s.push('<text x="' + X(-0.3) + '" y="' + Y(-1.55) + '" class="lbl" transform="rotate(34 ' + X(-0.3) + ' ' + Y(-1.55) + ')">margin 0 to 1 MPa</text>');
    s.push('<text x="' + X(-0.3) + '" y="' + Y(-5.8) + '" class="lbl">margin over 1 MPa</text>');
    var cs = SHEET['sp.cean_cras.pmin'], cm = SHEET['comm.semiarid.psimin'];
    if (cm && FILTER.chaparral) s.push('<rect x="' + (X(cm.value) - 1.5) + '" y="' + (CH.h - CH.b - 12) + '" width="3" height="12" fill="' + gcol('chaparral') + '"><title>' + esc('Southern California semi arid communities: Ψmin about ' + psi(cm.value, 1)) + '</title></rect><text class="lbl" x="' + (X(cm.value) + 5) + '" y="' + (CH.h - CH.b - 4) + '">chaparral community Ψmin</text>');
    if (cs && FILTER.chaparral) s.push('<g><path d="M' + X(-6.2) + ',' + (CH.t + 16) + ' H' + (X(-7) - 2) + '" stroke="' + gcol('chaparral') + '" stroke-width="2" marker-end="url(#sp-arr2)"/><text class="lbl" x="' + X(-6.25) + '" y="' + (CH.t + 12) + '" text-anchor="end">Ceanothus branchlets reach ' + psi(cs.value, 1) + ', off this scale</text></g>');
    s.push('<defs><marker id="sp-arr2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10z" fill="' + gcol('chaparral') + '"/></marker></defs>');
    stemRugY().forEach(function (r) {
      if (!FILTER[r.g]) return;
      if (r.y != null) s.push('<rect x="' + (CH.l + 1) + '" y="' + (Y(r.y) - 1.5) + '" width="12" height="3" fill="' + gcol(r.g) + '"><title>' + esc(r.lab + ': ' + psi(r.y)) + '</title></rect>');
      else s.push('<rect x="' + (CH.l + 3) + '" y="' + Y(r.y0) + '" width="6" height="' + (Y(r.y1) - Y(r.y0)) + '" fill="' + gcol(r.g) + '" opacity=".55"><title>' + esc(r.lab + ': ' + psi(r.y0) + ' to ' + psi(r.y1)) + '</title></rect>');
    });
    stemPoints().forEach(function (p) {
      if (p.box) {
        if (!FILTER[p.g]) return;
        s.push('<rect class="pt" data-pt="' + p.id + '" tabindex="0" role="button" aria-label="' + esc(p.common) + '" x="' + X(p.box.x[0]) + '" y="' + Y(p.box.y[0]) + '" width="' + (X(p.box.x[1]) - X(p.box.x[0])) + '" height="' + (Y(p.box.y[1]) - Y(p.box.y[0])) + '" fill="' + gcol(p.g) + '" fill-opacity=".35" stroke="' + gcol(p.g) + '"/>');
        s.push('<text class="lbl" x="' + (X(p.box.x[1]) + 6) + '" y="' + (Y(p.box.y[0]) + 12) + '">mangroves</text>');
        return;
      }
      if (p.xr && FILTER[p.g]) s.push('<line x1="' + X(p.xr[0]) + '" x2="' + X(p.xr[1]) + '" y1="' + Y(p.y) + '" y2="' + Y(p.y) + '" stroke="' + gcol(p.g) + '" stroke-width="2"/>');
      if (p.link && FILTER[p.g]) { var L0 = null; stemPoints().forEach(function (q) { if (q.id === p.link) L0 = q; }); if (L0) s.push('<line x1="' + X(L0.x) + '" y1="' + Y(L0.y) + '" x2="' + X(p.x) + '" y2="' + Y(p.y) + '" stroke="' + gcol(p.g) + '" stroke-width="1.4" stroke-dasharray="3 3"/>'); }
      if (p.leafPsi && FILTER[p.g]) s.push('<circle cx="' + X(p.x).toFixed(1) + '" cy="' + Y(p.y).toFixed(1) + '" r="13" fill="none" stroke="' + gcol(p.g) + '" stroke-width="1" stroke-dasharray="2 2" aria-hidden="true"/>');
      s.push(p.hollow ? pointSVG(p, X, Y, 8).replace('style="opacity:', 'style="fill:var(--paper);stroke:' + gcol(p.g) + ';stroke-width:3;opacity:') : pointSVG(p, X, Y, 8));
      if (FILTER[p.g]) {
        var lab = { oak: 'coast live oak, centrifuge', oak_opt: 'same oak, optical method', madrone: 'madrone', annona: 'pond apple', clusia: 'Clusia', amazon: 'Amazon mean' }[p.id];
        var lft = p.id === 'annona' || p.id === 'oak_opt';
        s.push('<text class="lbl" x="' + (X(p.x) + (lft ? -11 : 11)) + '" y="' + (Y(p.y) + (p.id === 'annona' ? 20 : 4)) + '" text-anchor="' + (lft ? 'end' : 'start') + '">' + esc(lab) + '</text>');
      }
    });
    s.push('<text x="' + (CH.w - CH.r) + '" y="' + (CH.t - 12) + '" text-anchor="end">bars on the left axis: P50 with no field minimum · dashed ring: Ψ measured on leaves</text>');
    s.push('</svg>');
    return s.join('');
  }
  function allPoints() { return leafPoints().concat(stemPoints()); }
  function detailHTML(id) {
    var p = null; allPoints().forEach(function (q) { if (q.id === id) p = q; });
    if (!p) return '<p class="sp-small">Tap or press Enter on a point to see its numbers, how they were measured and the paper.</p>';
    var rows = p.keys.map(function (k) { var r = SHEET[k]; if (!r) return ''; return '<dt>' + badge(r.badge === 'VERIFIED' ? 'MEASURED' : r.badge) + '</dt><dd>' + esc(sci(r.claim)) + ' ' + ev(k) + (r.journal_flag ? ' <span class="sp-small">(' + esc(r.journal_flag.split(':')[0]) + ' flagged)</span>' : '') + '</dd>'; }).join('');
    var first = SHEET[p.keys[0]] || {};
    return '<h4><i>' + esc(p.sp) + '</i>, ' + esc(p.common) + '</h4><p class="sp-small" style="margin:0">' + esc(GROUPS[p.g].name) + (first.method ? '. Method: ' + esc(first.method) : '') + '</p>' +
      (p.note ? '<p class="sp-small" style="margin:4px 0 0">' + esc(p.note) + '</p>' : '') +
      (p.grape ? '<p class="sp-small" style="margin:4px 0 0">Stomatal half closure (−0.60 MPa in Cabernet Sauvignon) is a different quantity from these leaf values and from stem P50; it is never plotted on the stem view.</p>' : '') +
      '<dl>' + rows + '</dl>';
  }

  /* r5 (PhD panel idea 13): every sheet row on this plate as a CSV, for a lab meeting or a proposal figure */
  function downloadCSV() {
    var cols = ['key', 'claim', 'value', 'units', 'species', 'trait', 'organ', 'method', 'cite', 'doi', 'pmid', 'journal', 'badge', 'note'];
    var q = function (v) { if (v == null) return ''; if (typeof v === 'object') v = JSON.stringify(v); v = String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    var rows = [cols.join(',')];
    Object.keys(SHEET).sort().forEach(function (k) { var r = SHEET[k]; rows.push(cols.map(function (c) { return q(c === 'key' ? k : r[c]); }).join(',')); });
    rows.push('');
    rows.push(q('Badges: VERIFIED = read in the retrieved paper this build; UNVERIFIED = secondary or not read. Values are as published; ranges and objects are JSON.'));
    try {
      var blob = new Blob(['\ufeff' + rows.join('\n')], { type: 'text/csv;charset=utf-8' }), a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'water-path-species-numbers.csv'; document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.parentNode.removeChild(a); }, 500);
    } catch (e) { /* download blocked: nothing else to do */ }
  }

  /* ------------------------------------------------------------ build a plant: an ILLUSTRATIVE dry season */
  var SITES = {
    salinas: { name: 'Salinas Valley, July normal days', Tmax: 21.5, Tmin: 12.8, RHd: 72, RHn: 92, ETo: 3.8, note: 'Air temperatures are the NOAA July normals used on Plate I; humidity and ETo are ILLUSTRATIVE.' },
    inland: { name: 'An inland valley in Southern California (Riverside area)', Tmax: 35, Tmin: 17, RHd: 28, RHn: 62, ETo: 6.5, note: 'Every value ILLUSTRATIVE: no climate normals were retrieved for this site.' },
    smm: { name: 'Santa Monica Mountains chaparral, a drought summer', Tmax: 29, Tmin: 15, RHd: 40, RHn: 75, ETo: 5.2, note: 'Summer values ILLUSTRATIVE. The drought itself is real: 237.5 mm of rain a year in 2012 to 2014 against a 521.8 mm mean, and 51.6 mm in the 12 months before February 2014 (Venturas et al. 2016).', key: 'site.coldcreek.2014' }
  };
  var PRESETS = {
    lettuce: { name: 'Romaine-like annual crop', tlp: -1.0, p50: -1.6, gmin: 9.92, root: 0.4, src: { tlp: 'ILLUSTRATIVE', p50: 'ILLUSTRATIVE', gmin: 'gmin.trueba.groups', root: 'ILLUSTRATIVE' },
      note: 'No lettuce turgor loss point, P50 or gmin was found in the literature. gmin is the mean of annual herbs (Trueba et al. 2026), a stand in.' },
    grape: { name: 'Grapevine', tlp: 'sp.vitis_cs.tlp', p50: ['sp.vitis_sy.p50', 'stem'], gmin: ['gmin.trueba.groups', 'woody_deciduous'], root: 1.5, src: { root: 'ILLUSTRATIVE' },
      note: 'TLP of Cabernet Sauvignon (Albuquerque et al. 2020), stem P50 of Syrah (Hochberg et al. 2016): two cultivars, two studies. gmin is the woody deciduous mean.' },
    oak: { name: 'Coast live oak, centrifuge P50', tlp: 'sp.quer_agri.tlp_cc', p50: 'sp.quer_agri.p50stem', gmin: ['gmin.trueba.groups', 'woody_evergreen'], root: 3, src: { root: 'ILLUSTRATIVE' },
      note: 'TLP and centrifuge stem P50 of the central coast population (Chacon et al. 2020). gmin is the woody evergreen mean. Rooting depth is a guess. Now try the optical P50 preset.' },
    oak_opt: { name: 'Coast live oak, optical P50', tlp: 'sp.quer_agri.tlp_cc', p50: 'x.oak.optical', gmin: ['gmin.trueba.groups', 'woody_evergreen'], root: 3, src: { root: 'ILLUSTRATIVE' },
      note: 'Same tree, stem P50 from the optical method (about −4.45 MPa, UNVERIFIED, quoted by Chacon et al. 2020). Same soil, same weather: does the toy tree survive now?' },
    madrone: { name: 'Pacific madrone', tlp: 'sp.arbu_menz.tlp', p50: 'sp.arbu_menz.p50stem', gmin: ['gmin.trueba.groups', 'woody_evergreen'], root: 3.5, src: { root: 'ILLUSTRATIVE' },
      note: 'TLP and P50 from Chacon et al. 2020. Roots more than 3.5 m into bedrock, as cited by Chacon et al. 2020 from another paper (ILLUSTRATIVE here). gmin is the woody evergreen mean.' },
    toyon: { name: 'Toyon (chaparral)', tlp: 'sp.hete_arbu.tlp', p50: -4.0, gmin: ['gmin.trueba.groups', 'woody_evergreen'], root: ['sp.rooting.davis_mooney', 'Heteromeles'], src: { p50: 'ILLUSTRATIVE' },
      note: 'TLP from Scoffoni et al. 2011. Rooting depth is the depth its predawn Ψ matched in the soil (Davis and Mooney 1986), inferred, not dug up. No toyon stem P50 was retrieved: −4 MPa is a guess.' }
  };
  var plant = { tlp: -1.37, p50: -1.9, gmin: 5.62, root: 1.5, site: 'salinas', santaAna: false, preset: 'grape', src: {} };
  function presetVal(v) {
    if (typeof v === 'number') return { v: v, from: null };
    if (typeof v === 'string') return { v: SHEET[v] ? SHEET[v].value : null, from: v };
    var r = SHEET[v[0]]; return { v: r && r.value ? r.value[v[1]] : null, from: v[0] };
  }
  function loadPreset(id) {
    var P = PRESETS[id]; if (!P) return;
    plant.preset = id; plant.src = {};
    ['tlp', 'p50', 'gmin', 'root'].forEach(function (k) {
      var pv = presetVal(P[k]);
      if (pv.v == null || typeof pv.v !== 'number') return;
      plant[k] = pv.v;
      plant.src[k] = P.src && P.src[k] ? P.src[k] : (pv.from || 'ILLUSTRATIVE');
    });
  }
  function es(T) { return 0.6108 * Math.exp(17.27 * T / (T + 237.3)); }
  var SOIL = { mmPerM: 160, psiFC: -0.033, b: 3, LAI: 3, days: 150 };
  function psiSoil(w) { return Math.max(-14, SOIL.psiFC * Math.pow(Math.max(1e-3, w), -SOIL.b)); }
  function simulate(pl) {
    var S0 = pl.root * SOIL.mmPerM, S = S0, site = SITES[pl.site], out = [], closeDay = null, failDay = null;
    var p88 = pl.p50 - 1;
    for (var d = 0; d <= SOIL.days; d++) {
      var sa = pl.santaAna && d >= 60 && d < 64;
      var Tx = sa ? site.Tmax + 6 : site.Tmax, Tn = sa ? site.Tmin + 6 : site.Tmin, RHd = sa ? 10 : site.RHd, RHn = sa ? 20 : site.RHn;
      var vpd24 = 0.5 * (es(Tx) * (1 - RHd / 100) + es(Tn) * (1 - RHn / 100));
      var eto = sa ? site.ETo * 1.6 : site.ETo;
      var w = S / S0, ps = psiSoil(w);
      var fs = clamp(1 - Math.pow(ps / pl.tlp, 2), 0, 1);
      if (ps <= pl.tlp && closeDay === null) closeDay = d;
      if (ps <= p88 && failDay === null) failDay = d;
      out.push({ d: d, psi: ps, fs: fs, w: w, sa: sa });
      if (failDay !== null) break;
      var Etr = eto * fs;
      var Emin = pl.gmin * vpd24 / 101.3 * 86400 * 18.015e-6 * SOIL.LAI;
      S = Math.max(S0 * 1e-3, S - Etr - Emin);
    }
    return { pts: out, closeDay: closeDay, failDay: failDay, p88: p88 };
  }
  var SIM = { W: 620, H: 260, l: 54, r: 14, t: 18, b: 40 };
  function simChart(res, upTo) {
    var ymin = Math.min(-2, plant.p50 - 1.6), X = scale(0, SOIL.days, SIM.l, SIM.W - SIM.r), Y = scale(0, ymin, SIM.t, SIM.H - SIM.b), s = [];
    s.push('<svg class="sp-chart" viewBox="0 0 ' + SIM.W + ' ' + SIM.H + '" role="img" aria-label="Predawn water potential through the dry season"><g>');
    for (var d = 0; d <= SOIL.days; d += 30) s.push('<line class="gl" x1="' + X(d) + '" x2="' + X(d) + '" y1="' + SIM.t + '" y2="' + (SIM.H - SIM.b) + '"/><text x="' + X(d) + '" y="' + (SIM.H - SIM.b + 16) + '" text-anchor="middle">' + d + '</text>');
    var step = ymin < -5 ? 2 : 1;
    for (var v = 0; v >= ymin; v -= step) s.push('<line class="gl" x1="' + SIM.l + '" x2="' + (SIM.W - SIM.r) + '" y1="' + Y(v) + '" y2="' + Y(v) + '"/><text x="' + (SIM.l - 6) + '" y="' + (Y(v) + 4) + '" text-anchor="end">' + (v === 0 ? '0' : MINUS + Math.abs(v)) + '</text>');
    s.push('<text x="' + ((SIM.l + SIM.W) / 2) + '" y="' + (SIM.H - 6) + '" text-anchor="middle" class="ttl">days without rain or irrigation</text>');
    s.push('<text transform="translate(14,' + ((SIM.t + SIM.H - SIM.b) / 2) + ') rotate(-90)" text-anchor="middle" class="ttl">predawn Ψ (MPa)</text>');
    s.push('<line x1="' + SIM.l + '" x2="' + (SIM.W - SIM.r) + '" y1="' + Y(plant.tlp) + '" y2="' + Y(plant.tlp) + '" stroke="var(--b-ill)" stroke-dasharray="6 4" stroke-width="1.5"/><text class="lbl" x="' + (SIM.W - SIM.r - 4) + '" y="' + (Y(plant.tlp) - 5) + '" text-anchor="end">turgor loss point (model: stomata shut here)</text>');
    s.push('<line x1="' + SIM.l + '" x2="' + (SIM.W - SIM.r) + '" y1="' + Y(res.p88) + '" y2="' + Y(res.p88) + '" stroke="var(--b-pre)" stroke-dasharray="2 3" stroke-width="1.8"/><text class="lbl" x="' + (SIM.W - SIM.r - 4) + '" y="' + (Y(res.p88) - 5) + '" text-anchor="end">failure line, P50 − 1 MPa</text>');
    if (plant.santaAna) s.push('<rect x="' + X(60) + '" y="' + SIM.t + '" width="' + (X(64) - X(60)) + '" height="' + (SIM.H - SIM.b - SIM.t) + '" fill="rgba(240,138,93,.18)"/><text class="lbl" x="' + (X(64) + 4) + '" y="' + (SIM.t + 12) + '">Santa Ana days</text>');
    var pts = res.pts.filter(function (q) { return q.d <= upTo; });
    if (pts.length) s.push('<polyline fill="none" stroke="var(--w2)" stroke-width="2.6" points="' + pts.map(function (q) { return X(q.d).toFixed(1) + ',' + Y(Math.max(ymin, q.psi)).toFixed(1); }).join(' ') + '"/>');
    var last = pts[pts.length - 1];
    if (last) s.push('<circle cx="' + X(last.d) + '" cy="' + Y(Math.max(ymin, last.psi)) + '" r="5" fill="var(--w2)" stroke="var(--paper)" stroke-width="1.5"/>');
    if (res.closeDay !== null && res.closeDay <= upTo) s.push('<line x1="' + X(res.closeDay) + '" x2="' + X(res.closeDay) + '" y1="' + SIM.t + '" y2="' + (SIM.H - SIM.b) + '" stroke="var(--b-ill)" stroke-width="1"/><text class="lbl" x="' + (X(res.closeDay) + 4) + '" y="' + (SIM.H - SIM.b - 6) + '">day ' + res.closeDay + '</text>');
    s.push('</g></svg>');
    return s.join('');
  }
  function plantSVG(fs, dead, w, shed) {
    // a small plant that droops as stomata shut and browns at failure; the soil bar drains with w
    var droop = (1 - fs) * 38, col = dead ? '#9a7a4a' : (isDark() ? '#7fb05a' : '#5f8a3c');
    var leaves = (shed && !dead ? [[-1, 0.9], [1, 0.7]] : [[-1, 0.9], [1, 0.7], [-1, 0.45], [1, 0.25]]).map(function (L) {
      var y = 120 - 70 * L[1], ang = L[0] * (-25 + droop), x2 = 55 + L[0] * 34;
      return '<g transform="rotate(' + ang.toFixed(1) + ' 55 ' + y + ')"><path d="M55,' + y + ' Q' + (55 + L[0] * 16) + ',' + (y - 14) + ' ' + x2 + ',' + (y - 4) + ' Q' + (55 + L[0] * 18) + ',' + (y + 6) + ' 55,' + y + 'Z" fill="' + col + '"/></g>';
    }).join('');
    var wb = clamp(w, 0, 1);
    return '<svg class="sp-plant" viewBox="0 0 110 170" role="img" aria-label="' + (dead ? 'Plant past the failure line' : (fs < 0.05 ? 'Plant with stomata shut' : 'Plant transpiring')) + '">' +
      '<rect x="4" y="128" width="102" height="38" rx="4" fill="var(--soil)"/><rect x="4" y="' + (128 + 38 * (1 - wb)) + '" width="102" height="' + (38 * wb) + '" rx="4" fill="var(--w4)" opacity=".75"/>' +
      '<path d="M55,128 V' + (40 + droop * 0.3) + '" stroke="' + col + '" stroke-width="4" fill="none"/>' + leaves +
      '<text x="55" y="160" text-anchor="middle" style="font-size:10px;fill:var(--ink)">soil water ' + Math.round(wb * 100) + ' %</text></svg>';
  }
  var simAnim = { raf: 0, day: SOIL.days, res: null };
  function srcBadge(k) {
    var s = plant.src[k];
    // gmin presets are life form means from other species (Trueba et al. 2026), never a measurement of this plant
    if (k === 'gmin' && s === 'gmin.trueba.groups') return badge('ILLUSTRATIVE', 'GROUP MEAN: the mean of a life form in Trueba et al. 2026, not measured on this species.') + ' <span class="sp-small">group mean</span> ' + ev(s);
    if (!s || s === 'ILLUSTRATIVE') return badge('ILLUSTRATIVE');
    var r = SHEET[s]; return r ? badge(r.badge === 'VERIFIED' ? 'MEASURED' : r.badge, r.cite) + ' ' + ev(s) : badge('ILLUSTRATIVE');
  }
  function renderSim(play) {
    if (!refs.sim) return;
    var res = simulate(plant); simAnim.res = res;
    ['tlp', 'p50', 'gmin', 'root'].forEach(function (k) {
      var inp = el.querySelector('#sp-' + k), o = el.querySelector('[data-o="' + k + '"]'), b = el.querySelector('[data-b="' + k + '"]');
      if (inp && document.activeElement !== inp) inp.value = plant[k];
      if (o) o.textContent = k === 'gmin' ? num(plant[k], 2) + ' mmol m⁻² s⁻¹' : (k === 'root' ? num(plant[k], 2) + ' m' : psi(plant[k]));
      if (b) b.innerHTML = srcBadge(k);
    });
    Array.prototype.forEach.call(el.querySelectorAll('[data-pre]'), function (b) { b.setAttribute('aria-pressed', b.dataset.pre === plant.preset ? 'true' : 'false'); });
    Array.prototype.forEach.call(el.querySelectorAll('[data-site]'), function (b) { b.setAttribute('aria-checked', b.dataset.site === plant.site ? 'true' : 'false'); });
    var sa = el.querySelector('[data-act="sa"]'); if (sa) { sa.setAttribute('aria-pressed', plant.santaAna ? 'true' : 'false'); }
    var pn = el.querySelector('[data-r="prenote"]'); if (pn) pn.textContent = PRESETS[plant.preset] ? PRESETS[plant.preset].note : 'Your own plant: every trait is yours.';
    var sn = el.querySelector('[data-r="sitenote"]'); if (sn) sn.innerHTML = esc(SITES[plant.site].note) + (SITES[plant.site].key ? ' ' + ev(SITES[plant.site].key) : '');
    if (simAnim.raf) { cancelAnimationFrame(simAnim.raf); simAnim.raf = 0; }
    if (play && !reduced()) {
      var t0 = 0, acc = 0, endDay = res.pts[res.pts.length - 1].d;
      var stepF = function (ts) {
        if (t0) acc += Math.min(0.1, (ts - t0) / 1000) * (window.PlaySpeed ? window.PlaySpeed.get() : 1);
        t0 = ts;
        var day = Math.min(endDay, Math.round(acc * 30));
        drawSim(res, day);
        if (day < endDay) simAnim.raf = requestAnimationFrame(stepF); else simAnim.raf = 0;
      };
      simAnim.raf = requestAnimationFrame(stepF);
    } else drawSim(res, SOIL.days);
  }
  function drawSim(res, upTo) {
    refs.sim.innerHTML = simChart(res, upTo);
    var pts = res.pts.filter(function (q) { return q.d <= upTo; }), last = pts[pts.length - 1];
    var dead = res.failDay !== null && upTo >= res.failDay;
    refs.plant.innerHTML = plantSVG(last ? last.fs : 1, dead, last ? last.w : 1, last ? last.psi < plant.tlp - 0.5 : false);
    var site = SITES[plant.site].name.split(',')[0].replace(/^An /, 'an ');
    var txt;
    if (upTo < (res.failDay !== null ? res.failDay : SOIL.days)) txt = 'Day ' + upTo + ' in ' + esc(site) + ': predawn Ψ ' + psi(last.psi) + ', stomata ' + Math.round(last.fs * 100) + ' % open.';
    else if (res.failDay !== null) txt = 'In ' + esc(site) + ' this plant shuts its stomata on <b>day ' + res.closeDay + '</b> and reaches the failure line on <b class="bad">day ' + res.failDay + '</b>, before the ' + SOIL.days + ' day dry season ends.';
    else {
      var endPsi = res.pts[res.pts.length - 1].psi, shed = endPsi < plant.tlp - 0.5;
      txt = 'In ' + esc(site) + ' this plant ' + (res.closeDay !== null ? 'shuts its stomata on <b>day ' + res.closeDay + '</b> and ' : 'never needs to shut its stomata and ') + (shed ? 'its <b class="ok">stems stay above the failure line</b> for the ' + SOIL.days + ' day dry season, ending at ' + psi(endPsi) + '. That is far past its turgor loss point, so most leaves would be shed by now: survival here means the stems, not the canopy. ' + badge('ILLUSTRATIVE', 'Leaf shedding drawn when predawn Ψ passes TLP − 0.5 MPa; a teaching rule.') : '<b class="ok">survives the ' + SOIL.days + ' day dry season</b>, ending at ' + psi(endPsi) + '.');
    }
    refs.simres.innerHTML = txt;
  }

  /* ------------------------------------------------------------ gauge, roots, gmin */
  var GAUGE = [
    ['sp.heli_annu.tlp', null, 'sunflower loses turgor'], ['sp.vitis_cs.tlp', null, 'grapevine loses turgor'], ['sp.hete_arbu.tlp', null, 'toyon loses turgor'],
    ['comm.semiarid.psimin', null, 'Southern California shrubland minimum'], ['sp.cean_cras.predawn', 'C. crassifolius', 'Ceanothus crassifolius before dawn'],
    ['sp.cean_cras.predawn', 'C. megacarpus', 'Ceanothus megacarpus before dawn'], ['sp.cean_cras.pmin', null, 'Ceanothus branchlets dying back']
  ];
  function gaugeSVG() {
    var s = ['<svg class="sp-gauge" viewBox="0 0 520 270" role="img" aria-label="A pressure gauge from 0 to −12 MPa">'];
    s.push('<path d="M60,230 A200,200 0 0 1 460,230" fill="none" stroke="var(--rule2)" stroke-width="22"/>');
    s.push('<path d="M60,230 A200,200 0 0 1 460,230" fill="none" stroke="url(#sp-gg)" stroke-width="22" opacity=".8"/>');
    s.push('<defs><linearGradient id="sp-gg" x1="0" x2="1"><stop offset="0" stop-color="var(--w2)"/><stop offset=".45" stop-color="var(--b-ill)"/><stop offset="1" stop-color="var(--b-pre)"/></linearGradient></defs>');
    for (var v = 0; v <= 12; v += 2) {
      var a = Math.PI * (1 - v / 12), x1 = 260 + Math.cos(a) * 178, y1 = 230 - Math.sin(a) * 178, x2 = 260 + Math.cos(a) * 216, y2 = 230 - Math.sin(a) * 216;
      s.push('<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" stroke="var(--ink2)" stroke-width="2"/>');
      s.push('<text x="' + (260 + Math.cos(a) * 160).toFixed(1) + '" y="' + (234 - Math.sin(a) * 160).toFixed(1) + '" text-anchor="middle" style="font-family:var(--ui);font-size:13px;fill:var(--ink2)">' + (v ? MINUS + v : '0') + '</text>');
    }
    s.push('<text x="260" y="262" text-anchor="middle" style="font-family:var(--ui);font-size:12px;fill:var(--ink2)">water potential, MPa</text>');
    s.push('<g class="sp-needle" data-r="needle"><line x1="260" y1="230" x2="80" y2="230" stroke="var(--ink)" stroke-width="4" stroke-linecap="round"/><circle cx="260" cy="230" r="11" fill="var(--ink)"/></g>');
    s.push('<text x="260" y="200" text-anchor="middle" data-r="gval" style="font-family:var(--mono);font-size:26px;fill:var(--ink)"></text></svg>');
    return s.join('');
  }
  function gaugeVal(i) {
    var g = GAUGE[i], r = SHEET[g[0]]; if (!r) return null;
    var v = g[1] ? r.value[g[1]] : r.value; return { v: v, key: g[0], lab: g[2] };
  }
  function setGauge(i) {
    var g = gaugeVal(i); if (!g) return;
    var deg = clamp(-g.v / 12, 0, 1) * 180;
    var nd = el.querySelector('[data-r="needle"]'), gv = el.querySelector('[data-r="gval"]');
    if (nd) { nd.style.transition = reduced() ? 'none' : ''; nd.style.transform = 'rotate(' + deg.toFixed(1) + 'deg)'; }
    if (gv) gv.textContent = psi(g.v, 1);
    Array.prototype.forEach.call(el.querySelectorAll('[data-g]'), function (b) { b.setAttribute('aria-pressed', +b.dataset.g === i ? 'true' : 'false'); });
    var gn = el.querySelector('[data-r="gnote"]');
    if (gn) gn.innerHTML = esc(sci(SHEET[g.key].claim)) + ' ' + ev(g.key);
  }
  function rootsSVG() {
    var cd = SHEET['glob.rooting.canadell'], dm = SHEET['sp.rooting.davis_mooney'];
    if (!cd) return '';
    if (narrow()) return rootsNarrow(cd, dm);
    var bars = [['desert', 'desert'], ['sclerophyll_shrubland', 'Mediterr. shrubland'], ['trop_savanna', 'tropical savanna'], ['trop_evergreen', 'tropical forest'], ['temp_deciduous', 'temperate forest'], ['cropland', 'cropland'], ['tundra', 'tundra']];
    var cha = dm ? [['Quercus', 'scrub oak (≥)'], ['Heteromeles', 'toyon'], ['Adenostoma', 'chamise'], ['Rhamnus', 'redberry']] : [];
    var W = 640, H = 380, top = 26, depthMax = 16, Y = scale(0, depthMax, top, H - 64), n = bars.length + cha.length, bw = (W - 80) / n, s = [];
    function lab2(x, y, name, val, col) {
      var w = name.split(' ');
      var l1 = w.length > 1 ? w.slice(0, Math.ceil(w.length / 2)).join(' ') : name, l2 = w.length > 1 ? w.slice(Math.ceil(w.length / 2)).join(' ') : '';
      return '<text x="' + x + '" y="' + (y + 16) + '" text-anchor="middle" style="font-size:11px' + (col ? ';fill:' + col : '') + '"><tspan x="' + x + '">' + esc(l1) + '</tspan>' + (l2 ? '<tspan x="' + x + '" dy="12">' + esc(l2) + '</tspan>' : '') + '<tspan x="' + x + '" dy="13" style="font-weight:600;fill:var(--ink)">' + val + '</tspan></text>';
    }
    s.push('<svg class="sp-chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Maximum rooting depth by biome and apparent rooting depth of four chaparral shrubs">');
    for (var d = 0; d <= depthMax; d += 4) s.push('<line class="gl" x1="56" x2="' + W + '" y1="' + Y(d) + '" y2="' + Y(d) + '"/><text x="50" y="' + (Y(d) + 4) + '" text-anchor="end">' + d + ' m</text>');
    s.push('<rect x="56" y="' + (top - 12) + '" width="' + (W - 56) + '" height="12" fill="var(--leaf2)" opacity=".7"/><text x="' + (W - 6) + '" y="' + (top - 15) + '" text-anchor="end" class="lbl">ground</text>');
    var i = 0;
    bars.forEach(function (b) {
      var v = cd.value[b[0]], x = 70 + bw * (i++) + bw / 2, y1 = Y(v), L = y1 - top;
      s.push('<path class="sp-root" d="M' + x + ',' + top + ' V' + y1.toFixed(1) + '" stroke="var(--bark)" stroke-width="' + Math.max(5, bw * 0.28) + '" stroke-linecap="round" style="--len:' + L.toFixed(1) + '" stroke-dasharray="' + L.toFixed(1) + ' 9999"/>');
      s.push(lab2(x, y1, b[1], num(v, 1) + ' m'));
    });
    cha.forEach(function (b) {
      var v = dm.value[b[0]], x = 70 + bw * (i++) + bw / 2, y1 = Y(v), L = Math.max(1, y1 - top);
      s.push('<path class="sp-root" d="M' + x + ',' + top + ' V' + y1.toFixed(1) + '" stroke="' + gcol('chaparral') + '" stroke-width="' + Math.max(5, bw * 0.28) + '" stroke-linecap="round" style="--len:' + L.toFixed(1) + '" stroke-dasharray="' + L.toFixed(1) + ' 9999"/>');
      s.push(lab2(x, y1, b[1], num(v, 2) + ' m', gcol('chaparral')));
    });
    s.push('<text x="' + (W - 6) + '" y="' + (H - 6) + '" text-anchor="end">brown: biome maxima · orange: chaparral, inferred from predawn Ψ: a lower bound, not the deepest root</text></svg>');
    return s.join('');
  }
  function rootsNarrow(cd, dm) {
    var rows = [['desert', 'desert', 0], ['sclerophyll_shrubland', 'Mediterranean shrubland', 0], ['trop_savanna', 'tropical savanna', 0], ['trop_evergreen', 'tropical forest', 0], ['temp_deciduous', 'temperate forest', 0], ['cropland', 'cropland', 0], ['tundra', 'tundra', 0]]
      .map(function (r) { return [r[1], cd.value[r[0]], 'var(--bark)', null]; });
    if (dm) [['Quercus', 'scrub oak, at least'], ['Heteromeles', 'toyon'], ['Adenostoma', 'chamise'], ['Rhamnus', 'redberry']].forEach(function (r) { rows.push([r[1], dm.value[r[0]], gcol('chaparral')]); });
    var W = 400, rh = 30, top = 22, H = top + rows.length * rh + 30, X = scale(0, 16, 12, W - 12), s = [];
    s.push('<svg class="sp-chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Maximum rooting depth by biome and apparent rooting depth of four chaparral shrubs">');
    for (var d = 0; d <= 16; d += 4) s.push('<line class="gl" x1="' + X(d) + '" x2="' + X(d) + '" y1="' + top + '" y2="' + (H - 24) + '"/><text x="' + X(d) + '" y="' + (H - 8) + '" text-anchor="middle">' + d + ' m</text>');
    s.push('<rect x="2" y="' + top + '" width="9" height="' + (H - 24 - top) + '" fill="var(--leaf2)" opacity=".8"/><text x="14" y="' + (top - 6) + '" class="lbl">ground at left, depth to the right</text>');
    rows.forEach(function (r, i) {
      var y = top + i * rh + 18, L = Math.max(1, X(r[1]) - X(0));
      s.push('<path class="sp-root" d="M' + X(0) + ',' + y + ' H' + X(r[1]).toFixed(1) + '" stroke="' + r[2] + '" stroke-width="8" stroke-linecap="round" style="--len:' + L.toFixed(1) + '" stroke-dasharray="' + L.toFixed(1) + ' 9999"/>');
      var tx = X(r[1]) + 8, right = tx > W - 150;
      s.push('<text class="lbl" x="' + (right ? X(r[1]) - 8 : tx) + '" y="' + (right ? y - 7 : y + 4) + '" text-anchor="' + (right ? 'end' : 'start') + '"' + (r[2] !== 'var(--bark)' ? ' style="fill:' + r[2] + '"' : '') + '>' + esc(r[0]) + ' ' + num(r[1], r[1] < 1 ? 2 : 1) + ' m</text>');
    });
    s.push('</svg>');
    return s.join('');
  }
  function growRoots() {
    if (reduced()) return;
    var svg = el.querySelector('[data-r="roots"] svg'); if (svg) { svg.classList.remove('grow'); void svg.getBoundingClientRect(); svg.classList.add('grow'); }
  }
  var gminT = 25;
  function gminSVG() {
    var tg = SHEET['gmin.trueba.groups'], oq = SHEET['gmin.quercus.T'], wg = SHEET['gmin.wang.T'];
    if (!tg) return '';
    var W = 640, H = 300, l = 60, X = scale(0, 22, l, W - 20), s = [], se = { annual_herb: 0.61, perennial_herb: 0.42, woody_deciduous: 0.35, woody_evergreen: 0.13 };
    // SE values are in the sheet claim text (Trueba et al. 2026); parsed here so they are not typed twice
    var m = /±\s*SE\s*([\d.]+),\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)/.exec(tg.claim || '');
    if (m) { se.annual_herb = +m[1]; se.perennial_herb = +m[2]; se.woody_deciduous = +m[3]; se.woody_evergreen = +m[4]; }
    var rows = [['annual_herb', 'annual herbs'], ['perennial_herb', 'perennial herbs'], ['woody_deciduous', 'woody deciduous'], ['woody_evergreen', 'woody evergreen']];
    s.push('<svg class="sp-chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Minimum leaf conductance by life form, and how two studies see heat change it">');
    for (var v = 0; v <= 20; v += 5) s.push('<line class="gl" x1="' + X(v) + '" x2="' + X(v) + '" y1="20" y2="' + (H - 40) + '"/><text x="' + X(v) + '" y="' + (H - 24) + '" text-anchor="middle">' + v + '</text>');
    s.push('<text x="' + ((l + W) / 2) + '" y="' + (H - 6) + '" text-anchor="middle" class="ttl">g<tspan baseline-shift="sub" font-size="9">min</tspan> (mmol m⁻² s⁻¹)</text>');
    rows.forEach(function (r, i) {
      var y = 30 + i * 30, val = tg.value[r[0]];
      s.push('<rect x="' + X(0) + '" y="' + y + '" width="' + (X(val) - X(0)) + '" height="18" fill="var(--leaf)" rx="3"/><line x1="' + X(val - se[r[0]]) + '" x2="' + X(val + se[r[0]]) + '" y1="' + (y + 9) + '" y2="' + (y + 9) + '" stroke="var(--ink)" stroke-width="1.5"/>');
      s.push('<text x="' + (X(val + se[r[0]]) + 7) + '" y="' + (y + 14) + '" class="lbl">' + esc(r[1]) + ' ' + num(val, 2) + '</text>');
    });
    var y0 = 30 + 4 * 30 + 8;
    s.push('<text x="' + X(0) + '" y="' + (y0 + 6) + '" class="ttl">at ' + gminT + ' °C:</text>');
    if (oq) { // oaks: 1.19 to 8.09 at 25 °C converging to 0.57 at 45 °C (linear between, ILLUSTRATIVE)
      var f = clamp((gminT - 25) / 20, 0, 1), lo = oq.value['25C'][0] + (oq.value['45C'] - oq.value['25C'][0]) * f, hi = oq.value['25C'][1] + (oq.value['45C'] - oq.value['25C'][1]) * f;
      var yy = y0 + 18;
      if (gminT <= 45) s.push('<rect x="' + X(lo) + '" y="' + yy + '" width="' + Math.max(3, X(hi) - X(lo)) + '" height="16" fill="' + gcol('woodland') + '" opacity=".75" rx="3"/><text x="' + (X(hi) + 8) + '" y="' + (yy + 12) + '" class="lbl">24 oaks: ' + num(lo, 2) + ' to ' + num(hi, 2) + '</text>');
      else s.push('<text x="' + X(0) + '" y="' + (yy + 12) + '" class="lbl">24 oaks: not measured above 45 °C</text>');
    }
    if (wg) { // European trees: 0.8 to 4.8 at ambient, rising 2 to 4 fold by 50 °C (linear between, ILLUSTRATIVE)
      var f2 = clamp((gminT - 25) / 25, 0, 1), lo2 = wg.value.ambient[0] * (1 + (wg.value.fold_25_50C[0] - 1) * f2), hi2 = wg.value.ambient[1] * (1 + (wg.value.fold_25_50C[1] - 1) * f2);
      var y2 = y0 + 42;
      s.push('<rect x="' + X(lo2) + '" y="' + y2 + '" width="' + Math.max(3, X(Math.min(22, hi2)) - X(lo2)) + '" height="16" fill="' + gcol('tropical') + '" opacity=".7" rx="3"/><text x="' + Math.min(W - 150, X(Math.min(22, hi2)) + 8) + '" y="' + (y2 + 12) + '" class="lbl">9 European trees: ' + num(lo2, 1) + ' to ' + num(hi2, 1) + '</text>');
    }
    s.push('<line x1="' + X(tg.value.annual_herb) + '" x2="' + X(tg.value.annual_herb) + '" y1="22" y2="' + (30 + 18 + 4) + '" stroke="var(--ink)" stroke-dasharray="3 3"/>');
    s.push('</svg>');
    return s.join('');
  }

  /* ------------------------------------------------------------ Agave root theatre */
  var RT = null, agaveDays = 0, agaveWet = true;
  function rootSet() {
    if (!RT) return;
    var shr = SHEET['sp.agav_dese.rootshrink'], v = shr ? shr.value : { '7d': 24, '14d': 34 };
    var shrink = agaveDays === 0 ? 0 : (agaveDays === 7 ? v['7d'] / 100 : v['14d'] / 100);
    if (agaveWet) shrink = 0;
    RT.setTheme(isDark()); RT.setReduce(reduced());
    RT.set({ mode: 'agave', shrink: shrink, soilWet: agaveWet ? 1 : 0.12, flux: agaveWet ? 6 : 1.5, leak: agaveWet ? 0 : 2.2, casparian: true, ions: false, aqp: agaveWet ? 1 : 0.5 });
    Array.prototype.forEach.call(el.querySelectorAll('[data-ag]'), function (b) { b.setAttribute('aria-checked', (!agaveWet && +b.dataset.ag === agaveDays) || (agaveWet && b.dataset.ag === 'wet') ? 'true' : 'false'); });
    var t = el.querySelector('[data-r="agtxt"]');
    if (t) t.innerHTML = agaveWet ? 'Wet soil: the root is full and touches the soil; water flows in.' :
      (agaveDays === 0 ? 'The soil has just dried. The root has not shrunk yet, so water that tries to leave the root can still escape into the dry soil.' :
        'After ' + agaveDays + ' days without rain the root has shrunk ' + Math.round(shrink * 100) + ' % and an air gap has opened. Water trying to leave the root stops at the gap: a one way valve. ' + (agaveDays === 14 ? 'The gap cuts the root to soil conductance about 5 fold.' : ''));
  }

  /* ------------------------------------------------------------ mount and update */
  function chipsFilters() {
    return Object.keys(GROUPS).map(function (g) { return '<button type="button" class="chip" data-fil="' + g + '" aria-pressed="true"><i style="background:' + gcol(g) + '"></i>' + esc(GROUPS[g].name) + '</button>'; }).join('');
  }
  function rngHTML(id, label, sub, min, max, step) {
    return '<div class="sp-rng"><label for="sp-' + id + '">' + label + ' <span data-b="' + id + '"></span><small>' + sub + '</small></label><output data-o="' + id + '" for="sp-' + id + '"></output><input type="range" id="sp-' + id + '" min="' + min + '" max="' + max + '" step="' + step + '"></div>';
  }
  function tableHTML() {
    var keys = Object.keys(SHEET).filter(function (k) { return /^(sp|comm|glob|gmin|grp|site|x)\./.test(k) && SHEET[k].doi; });
    return '<div class="sp-tw"><table class="sp-t"><thead><tr><th>Value</th><th>Species or group</th><th>Method</th><th>Source</th><th>Status</th></tr></thead><tbody>' +
      keys.map(function (k) {
        var r = SHEET[k];
        return '<tr><td>' + esc(sci(r.claim)) + '</td><td><i>' + esc(r.species || '') + '</i></td><td>' + esc(r.method || '') + '</td><td>' + esc(r.cite || '') + (r.journal_flag ? '<br><small>' + esc(r.journal_flag) + '</small>' : '') + '<br><a href="https://doi.org/' + encodeURI(r.doi) + '" target="_blank" rel="noopener">doi ' + esc(r.doi) + '</a></td><td>' + badge(r.badge === 'VERIFIED' ? 'MEASURED' : r.badge) + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }
  function mount(root) {
    ui = WP.ui; el = root; injectCSS(); register();
    loadPreset('grape');
    var oak = SHEET['sp.quer_agri.tlp'], oak2 = SHEET['sp.quer_agri.tlp_cc'];
    root.innerHTML =
      '<p class="sp-now" aria-live="polite" data-r="now"></p>' +
      '<p class="sp-sub">Crops sit beside the wild plants of California, the deserts and the tropics, on the same axes. Every point is a published value; tap one for its paper. <span class="tier-2">Methods differ between studies, so compare positions, not decimals.</span></p>' +

      // ---------- explorer
      '<h3 class="sp-h">Where does each plant break?</h3>' +
      '<div class="sp-bar"><div class="chips" role="radiogroup" aria-label="View">' +
      '<button type="button" class="chip" role="radio" data-view="leaf" aria-checked="true">Leaf view</button>' +
      '<button type="button" class="chip" role="radio" data-view="stem" aria-checked="false">Stem view</button></div>' +
      '<div class="chips tier-2" role="radiogroup" aria-label="Grapevine curves fitted from" data-r="gfrom">' +
      '<button type="button" class="chip" role="radio" data-gf="0" aria-checked="true">Grape curves from Ψ = 0</button>' +
      '<button type="button" class="chip" role="radio" data-gf="1" aria-checked="false">from −0.3 MPa</button></div></div>' +
      '<div class="sp-fil" role="group" aria-label="Show biomes">' + chipsFilters() + '</div>' +
      '<div data-r="ptc"></div>' +
      '<div data-r="chart"></div>' +
      '<div class="sp-detail" data-r="detail" aria-live="polite"></div>' +
      '<p class="sp-small tier-2" data-r="viewcap"></p>' +
      '<p class="sp-small tier-3">Two populations of coast live oak: turgor loss point ' + (oak ? psi(oak.value) : '') + ' in the Los Angeles plants of Scoffoni et al. 2011 and ' + (oak2 ? psi(oak2.value) : '') + ' on the central coast (Chacon et al. 2020). They are shown separately, never averaged. ' + ev('sp.quer_agri.tlp', 'Evidence: LA') + ' ' + ev('sp.quer_agri.tlp_cc', 'Evidence: central coast') + '</p>' +

      // ---------- build a plant
      '<h3 class="sp-h">Build a plant, then give it a summer</h3>' +
      '<p class="sp-sub">Choose where its leaves lose turgor, where its stems fail, how leaky its shut leaves are and how deep its roots go. Then run a dry season with no rain and no irrigation. ' + badge('ILLUSTRATIVE', 'A teaching model: one soil bucket, stomata that shut at the turgor loss point, then only gmin losses until the failure line.') + '</p>' +
      '<div class="chips" role="group" aria-label="Start from a plant">' + Object.keys(PRESETS).map(function (k) { return '<button type="button" class="chip" data-pre="' + k + '" aria-pressed="false">' + esc(PRESETS[k].name) + '</button>'; }).join('') + '</div>' +
      '<p class="sp-small" data-r="prenote"></p>' +
      '<div class="sp-grid2"><div class="sp-card">' +
      rngHTML('tlp', 'Turgor loss point', 'where the leaves lose turgor and, here, the stomata shut', -4, -0.6, 0.01) +
      rngHTML('p50', 'Stem P50', 'the failure line is P50 − 1 MPa', -7, -0.8, 0.01) +
      '<div class="tier-2">' + rngHTML('gmin', 'g<sub>min</sub>', 'water lost with the stomata shut', 0.5, 15, 0.05) + '</div>' +
      rngHTML('root', 'Rooting depth', 'sets how much soil water it can reach', 0.2, 6, 0.05) +
      '</div><div class="sp-card"><div class="chips" role="radiogroup" aria-label="Where">' +
      Object.keys(SITES).map(function (k) { return '<button type="button" class="chip" role="radio" data-site="' + k + '" aria-checked="false">' + esc(SITES[k].name.split(',')[0]) + '</button>'; }).join('') + '</div>' +
      '<p class="sp-small" data-r="sitenote"></p>' +
      '<div class="sp-bar"><button type="button" class="btn small" data-act="sa" aria-pressed="false">Add 4 Santa Ana wind days</button><button type="button" class="btn small primary" data-act="play">Play the summer</button></div>' +
      '<div class="sp-simrow"><div data-r="plant"></div><p class="sp-res" aria-live="polite" data-r="simres"></p></div></div></div>' +
      '<div data-r="sim"></div>' +
      '<details class="tier-3 sp-small"><summary>The model behind the toy</summary><p>One soil bucket per plant: water held = rooting depth × ' + SOIL.mmPerM + ' mm per m. Soil Ψ = −0.033 × (water ÷ full)<sup>−3</sup> MPa, a Campbell type curve with b = 3. Predawn Ψ equals soil Ψ. Open stomata take ETo × f<sub>s</sub> mm per day, with f<sub>s</sub> = 1 − (Ψ ÷ TLP)², which reaches 0 at the turgor loss point. Shut leaves still lose g<sub>min</sub> × VPD<sub>24h</sub> ÷ 101.3 kPa over 24 h, on a leaf area index of ' + SOIL.LAI + '. VPD from the Tetens equation (DERIVED). Failure line: P50 − 1 MPa, a teaching slope of 50 % per MPa. Every constant here is ' + badge('ILLUSTRATIVE') + '; the trait values loaded by a preset carry their own badges. Real shrubs do not all follow this rule: in Southern California species the stomata closed below the turgor loss point (Schönbeck et al. 2025), so the model shuts them too early for those plants.</p>' +
      '<p>What the toy leaves out: plant water storage, osmotic adjustment during the drought, roots that grow or die, rain and fog drip, and stomata that do not all shut at the turgor loss point. Chaparral shrubs, for example, can close below it (Schönbeck et al. 2025). ' + ev('sp.socal.tlp_adjust') + '</p></details>' +

      // ---------- chaparral extremes
      '<h3 class="sp-h">How far can a chaparral shrub go?</h3>' +
      '<p class="sp-sub">Press a value and watch the gauge. Crops lose turgor near the left of this dial; some Ceanothus live far to the right.</p>' +
      gaugeSVG() +
      '<div class="chips" role="group" aria-label="Water potentials">' + GAUGE.map(function (g, i) { return '<button type="button" class="chip" data-g="' + i + '" aria-pressed="false">' + esc(g[2]) + '</button>'; }).join('') + '</div>' +
      '<p class="sp-small" data-r="gnote" aria-live="polite"></p>' +
      '<p class="sp-small tier-2">Drought is not the only killer. During the 2012 to 2018 drought, laurel sumac, normally drought resilient, died back by more than 60 % in coastal Santa Monica Mountains populations, and most of its vessels were blocked: a fungal agent was involved. ' + ev('sp.malo_laur.dieback') + '</p>' +
      '<p class="sp-small tier-2">Turgor loss is not a death line here. Six Southern California shrubs closed their stomata below their turgor loss point and lived for months several MPa below it; drought lowered their turgor loss point by 0.41 MPa on average. ' + ev('sp.socal.tlp_adjust') + '</p>' +

      // ---------- roots
      '<h3 class="sp-h">Roots: deep, shallow, and the desert valve</h3>' +
      '<p class="sp-sub">Biome maxima from a global compilation, beside the depths four chaparral shrubs were drinking from in a dry summer.</p>' +
      '<div data-r="roots">' + rootsSVG() + '</div>' +
      '<p class="sp-small">' + ev('glob.rooting.canadell', 'Evidence: biome maxima') + ' ' + ev('sp.rooting.davis_mooney', 'Evidence: chaparral depths') + '</p>' +
      '<h4 class="sp-h" style="font-size:18px">An agave root in drying soil</h4>' +
      '<p class="sp-sub">Agave deserti roots shrink as the desert soil dries. The air gap that opens around them stops the root losing water back to the dry soil; rain closes it again.</p>' +
      '<div class="sp-bar"><div class="chips" role="radiogroup" aria-label="Soil">' +
      '<button type="button" class="chip" role="radio" data-ag="wet" aria-checked="true">Wet soil</button>' +
      '<button type="button" class="chip" role="radio" data-ag="0" aria-checked="false">Dry, day 0</button>' +
      '<button type="button" class="chip" role="radio" data-ag="7" aria-checked="false">7 days dry</button>' +
      '<button type="button" class="chip" role="radio" data-ag="14" aria-checked="false">14 days dry</button></div>' +
      '<button type="button" class="btn small" data-act="rpause" aria-pressed="false">Pause</button></div>' +
      '<div class="sp-molstage" data-r="rootstage"></div>' +
      '<p class="sp-small" aria-live="polite" data-r="agtxt"></p>' +
      '<p class="sp-small">' + ev('sp.agav_dese.rootshrink', 'Evidence: shrinkage and gaps') + ' ' + ev('sp.agav_dese.rectifier', 'Evidence: the rectifier') + ' <span class="tier-2">' + ev('sp.opun_acan.lp', 'Evidence: cactus root aquaporins') + ' ' + ev('grp.contractile_roots', 'Evidence: contractile roots') + '</span></p>' +
      '<p class="sp-small tier-2">In a cactus root, aquaporins explained about 38 % of the fall in root conductance as the soil dried and 61 % of the recovery after rain. Desert succulent roots are fragile pipes: the mean cavitation pressure of Agave deserti roots is −0.93 MPa and of Opuntia ficus-indica −0.70 MPa, so a three month drought was predicted to cost them 69 % and 62 % of their root conductance (Linton and Nobel 1999, PMID 10562245) ' + badge('MEASURED', 'Abstract retrieved in PubMed; the journal has no DOI in PubMed.') + ' ' + ev('sp.agav_dese.rootp50') + '. The air gap that opens around a shrinking root keeps water from leaking back into dry soil.</p>' +

      // ---------- gmin
      '<h3 class="sp-h">The leaky leaf: g<sub>min</sub></h3>' +
      '<p class="sp-sub">With the stomata shut, a leaf still loses water through its cuticle and leaky stomata. Herbs leak most, evergreen trees least. The dashed line is the annual herb mean, the closest stand in for a lettuce leaf: no lettuce value was found. ' + ev('gmin.trueba.groups') + '</p>' +
      '<div class="sp-rng tier-2" style="max-width:420px"><label for="sp-gT">Leaf temperature<small>what two studies found as leaves heat up</small></label><output data-o="gT">25 °C</output><input type="range" id="sp-gT" min="25" max="50" step="1" value="25"></div>' +
      '<div data-r="gmin">' + gminSVG() + '</div>' +
      '<div class="sp-oq tier-2"><h4>' + badge('OPEN QUESTION') + ' Does heat open or close the leaky leaf?</h4><p style="margin:0">In nine European trees g<sub>min</sub> rose 2 to 4 fold between 25 and 50 °C. VPD itself can lower g<sub>min</sub> by about 0.4 mmol m⁻² s⁻¹ per kPa. Which would you expect for a chaparral shrub on a Santa Ana afternoon, and how would you separate temperature from VPD in the measurement?</p>' +
      '<p class="sp-small" style="margin:6px 0 0">' + ev('gmin.wang.T', 'Evidence: European trees') + ' ' + ev('gmin.garen.vpd', 'Evidence: VPD') + ' The bands between the measured temperatures are straight lines ' + badge('ILLUSTRATIVE') + '.</p></div>' +

      // ---------- expert
      '<div class="tier-3"><h3 class="sp-h">Every value on this plate</h3>' +
      '<p class="sp-small">Methods differ: Kleaf by the evaporative flux method, stem P50 by centrifuge, MRI, air injection or bench drying, turgor loss point by pressure volume curves or osmometer. PLoS One rows carry a journal note. Values seen only in an abstract keep an UNVERIFIED badge until their DOI is retrieved.</p>' +
      (ui.howto ? ui.howto('pv') + ui.howto('efm') + ui.howto('vc-cavitron') + ui.howto('gmin') : '') +
      '<p style="margin:10px 0"><button type="button" class="btn small" data-act="csv">Download this plate\'s numbers (CSV)</button> <span class="sp-small">value, units, species, method, citation, DOI and badge for every row, from the evidence sheet</span></p>' +
      '<details class="sp-every"><summary>Every number on this plate, ' + Object.keys(SHEET).filter(function (k) { return /^(sp|comm|glob|gmin|grp|site|x)\./.test(k) && SHEET[k].doi; }).length + ' rows with a DOI</summary>' + tableHTML() + '</details></div>';

    mountSD(root); // 13 Oct: supply to demand
    refs.chart = root.querySelector('[data-r="chart"]'); refs.detail = root.querySelector('[data-r="detail"]');
    refs.sim = root.querySelector('[data-r="sim"]'); refs.simres = root.querySelector('[data-r="simres"]'); refs.plant = root.querySelector('[data-r="plant"]');
    // predict, then check: toyon
    var ptcHost = root.querySelector('[data-r="ptc"]');
    if (ui.predict) {
      var box = ui.predict({ q: 'Toyon is a chaparral shrub. Where will it sit: above the 1 : 1 line (its K<sub>leaf</sub> halves before it loses turgor), on the line, or below it?',
        choices: ['above the line', 'on the line', 'below the line'], correct: 1,
        answer: 'On the line, almost exactly: turgor loss point ' + psi(V('sp.hete_arbu.tlp')) + ', K<sub>leaf</sub> P50 ' + psi(V('sp.hete_arbu.kleafp50')) + '. The dashed circle now shows toyon. Most garden and crop leaves sit above the line: their conductance falls well before turgor is lost.', cls: 'tier-2' });
      box.addEventListener('click', function (e) { if (e.target.closest('[data-check]')) { toyonShown = true; drawChart(); } });
      ptcHost.appendChild(box);
    }
    // events
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-view]');
      if (b) { view = b.dataset.view; Array.prototype.forEach.call(root.querySelectorAll('[data-view]'), function (x) { x.setAttribute('aria-checked', x === b ? 'true' : 'false'); }); root.querySelector('[data-r="gfrom"]').style.display = view === 'leaf' ? '' : 'none'; drawChart(); return; }
      b = e.target.closest('[data-gf]');
      if (b) { grapeFrom = +b.dataset.gf; Array.prototype.forEach.call(root.querySelectorAll('[data-gf]'), function (x) { x.setAttribute('aria-checked', x === b ? 'true' : 'false'); }); drawChart(); return; }
      b = e.target.closest('[data-fil]');
      if (b) { var g = b.dataset.fil; FILTER[g] = !FILTER[g]; b.setAttribute('aria-pressed', FILTER[g] ? 'true' : 'false'); drawChart(); return; }
      b = e.target.closest('[data-pt]');
      if (b) { selected = b.getAttribute('data-pt'); drawChart(); refs.detail.innerHTML = detailHTML(selected); return; }
      b = e.target.closest('[data-pre]');
      if (b) { loadPreset(b.dataset.pre); renderSim(true); return; }
      b = e.target.closest('[data-site]');
      if (b) { plant.site = b.dataset.site; renderSim(true); return; }
      b = e.target.closest('[data-act="csv"]');
      if (b) { downloadCSV(); return; }
      b = e.target.closest('[data-act="sa"]');
      if (b) { plant.santaAna = !plant.santaAna; renderSim(true); return; }
      b = e.target.closest('[data-act="play"]');
      if (b) { renderSim(true); return; }
      b = e.target.closest('[data-g]');
      if (b) { setGauge(+b.dataset.g); return; }
      b = e.target.closest('[data-ag]');
      if (b) { if (b.dataset.ag === 'wet') agaveWet = true; else { agaveWet = false; agaveDays = +b.dataset.ag; } rootSet(); return; }
      b = e.target.closest('[data-act="rpause"]');
      if (b && RT) { var pz = RT.pause(); b.setAttribute('aria-pressed', pz ? 'true' : 'false'); b.textContent = pz ? 'Play' : 'Pause'; }
    });
    root.addEventListener('keydown', function (e) {
      var p = e.target.closest && e.target.closest('[data-pt]');
      if (p && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); selected = p.getAttribute('data-pt'); drawChart(); refs.detail.innerHTML = detailHTML(selected); var n = refs.chart.querySelector('[data-pt="' + selected + '"]'); if (n) n.focus(); }
    });
    ['tlp', 'p50', 'gmin', 'root'].forEach(function (k) {
      var inp = root.querySelector('#sp-' + k);
      inp.addEventListener('input', function () { plant[k] = +inp.value; plant.preset = ''; plant.src[k] = 'ILLUSTRATIVE'; renderSim(false); });
    });
    var gT = root.querySelector('#sp-gT');
    gT.addEventListener('input', function () { gminT = +gT.value; root.querySelector('[data-o="gT"]').textContent = gminT + ' °C'; root.querySelector('[data-r="gmin"]').innerHTML = gminSVG(); });
    // theatre
    var M = window.MOL || WP.mol;
    if (M && M.scenes.root) {
      RT = M.Theatre(root.querySelector('[data-r="rootstage"]'), M.scenes.root(), { height: function (cw) { return cw < 560 ? 310 : 360; }, dark: isDark(), reduce: reduced(), prewarm: 16, // 13 Oct: about 24 % taller (v19: dark and reduce were inside the comment)
        label: 'Animated agave root in soil: water molecules entering from wet soil, the root shrinking as the soil dries, an air gap opening, and water that tries to leave stopping at the gap' });
    }
    // 13 Oct (slow and named): the speed chip beside the root theatre Pause and beside "Play the summer"
    if (window.PlaySpeed) ['[data-act="rpause"]', '[data-act="play"]'].forEach(function (sel) { var pb = root.querySelector(sel); if (pb && !(pb.nextElementSibling && pb.nextElementSibling.getAttribute('data-ps') === 'chip')) pb.insertAdjacentElement('afterend', window.PlaySpeed.chip('ps-light')); });
    if (RT && window.WPFreeze) WPFreeze.attach(RT.canvas, { paused: function () { return RT.paused; }, button: root.querySelector('[data-act="rpause"]') }); // v19: click the view to freeze
    if (ui.onPrefs) ui.onPrefs(function () { if (RT) { RT.setTheme(isDark()); RT.setReduce(reduced()); } drawChart(); renderSim(false); root.querySelector('[data-r="gmin"]').innerHTML = gminSVG(); });
    // roots grow when the figure scrolls into view
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) { if (es.some(function (x) { return x.isIntersecting; })) { growRoots(); io.disconnect(); } });
      io.observe(root.querySelector('[data-r="roots"]'));
    } else growRoots();
    var wasN = narrow();
    window.addEventListener('resize', function () { var n = narrow(); if (n !== wasN) { wasN = n; drawChart(); root.querySelector('[data-r="roots"]').innerHTML = rootsSVG(); } });
    drawChart(); refs.detail.innerHTML = detailHTML(null); renderSim(false); setGauge(0); rootSet();
    if (narrow()) root.querySelector('[data-r="roots"]').innerHTML = rootsSVG();
  }
  function drawChart() {
    if (!refs.chart) return;
    refs.chart.innerHTML = view === 'leaf' ? leafChart() : stemChart();
    var cap = el.querySelector('[data-r="viewcap"]');
    if (cap) cap.innerHTML = view === 'leaf'
      ? 'Leaf view: ten species measured in one study with one method (Scoffoni et al. 2011) and two grapevine cultivars (Albuquerque et al. 2020). Points above the dashed line lose half their leaf conductance before turgor is lost. Dry habitat species averaged a turgor loss point of ' + psi(V('grp.scoffoni11.dry_vs_moist', 'TLP_dry')) + ' against ' + psi(V('grp.scoffoni11.dry_vs_moist', 'TLP_moist')) + ' in moist habitat species. Grapevine Kleaf was measured with the same evaporative flux method as the ten species (Albuquerque et al. 2020), so these points are comparable. ' + ev('grp.scoffoni11.dry_vs_moist')
      : 'Stem view: the hydraulic safety margin is Ψmin minus P50. Most of 226 forest species live in the band between 0 and 1 MPa (70 %, Choat et al. 2012). Points with a dashed ring use a leaf Ψ: a margin from leaf Ψ overstates the risk, because leaves run more negative than stems. Grapevine stomatal half closure is a leaf trait and is not drawn here. Chaparral stem P50s (Jacobsen et al. 2005, six shrubs; Pratt et al. 2021, 29 shrubs as P75) were not retrievable in this build, so the chaparral group has no stem points yet. ' + ev('glob.hsm.choat') + ' ' + ev('glob.mortality.anderegg', 'Evidence: margins and mortality') + ' ' + ev('x.chap.p50', 'Evidence: chaparral P50s') +
        '<div class="m5-oq sp-oq" style="margin-top:10px"><h4 style="margin:0 0 4px">' + badge('OPEN QUESTION') + ' Is coast live oak really living beyond its P50?</h4>' +
        '<p style="margin:0 0 4px">Centrifuge: P50 ' + psi(-1.96) + ' on short stems and ' + psi(-1.79) + ' on longer ones, with native embolism of 19 to 64 % measured in the field (Chacon et al. 2020) ' + ev('x.oak.centrifuge') + '. Optical method: about ' + psi(-4.45) + ' for stems (Skelton and colleagues, as quoted by Chacon et al. 2020, UNVERIFIED) ' + ev('x.oak.optical') + '. With the first, the oak sat 0.71 MPa beyond P50 in the 2014 drought and showed no dieback; with the second it kept a margin near 2 MPa.</p>' +
        '<p style="margin:0">Why the methods disagree is itself debated: oak vessels reach 0.89 m, longer than the 14 and 25 cm segments spun, so open vessels may have made the centrifuge curve look too vulnerable. Try both in Build a plant below: the method decides whether the toy tree survives.</p></div>';
    var now = el.querySelector('[data-r="now"]');
    var shown = Object.keys(FILTER).filter(function (g) { return FILTER[g]; }).length;
    if (now) now.innerHTML = (view === 'leaf' ? 'Leaf view: each dot is a species. Further right, the leaf keeps turgor to drier conditions; further down, the leaf keeps passing water to drier conditions.' : 'Stem view: dots below the dashed line keep a safety margin; dots above it have gone past the point where half their stem conductance is lost.') +
      (shown < 7 ? ' Showing ' + shown + ' of 7 groups.' : '');
  }
  function update() { /* this plate reads the sheet, not the afternoon conditions */ }
  function show() { if (RT) RT.kick(); setTimeout(function () { if (!el) return; drawChart(); var r = el.querySelector('[data-r="roots"]'); if (r) r.innerHTML = rootsSVG(); }, 0); }

  /* ------------------------------------------------------------ 13 Oct (journey builder): supply to demand
     Maximum Kleaf values: Yao et al. 2021 (Caragana), Scoffoni et al. 2012 Table 2 (Lantana, coast live oak, mountain mahogany),
     Albuquerque et al. 2020 (Cabernet Sauvignon). The leaf drop E ÷ Kleaf is DERIVED; the shared gs is ILLUSTRATIVE. */
  var SD = { gs: 0.25 };
  var SDL = [
    ['Caragana, dry end of the rainfall range', 16.5, '#D55E00', 'lh.caragana'],
    ['grapevine, Cabernet Sauvignon', 14.52, '#CC79A7', 'lh.grape'],
    ['Lantana camara', 11.4, '#E69F00', 'lh.lantana'],
    ['mountain mahogany (chaparral)', 4.36, '#56B4E9', 'sp:sp.cerc_betu.kleafmax'],
    ['Caragana, wet end of the rainfall range', 4.2, '#0072B2', 'lh.caragana'],
    ['coast live oak', 3.96, '#009E73', 'lh.oak']
  ];
  function mountSD(root) {
    var LH = WP.lh; if (!LH) return;
    LH.css();
    var M = LH.M;
    var sec = document.createElement('section'); sec.className = 'lh-sec'; sec.setAttribute('aria-labelledby', 'sp-sd-h');
    sec.innerHTML = '<h3 id="sp-sd-h" class="sp-h">Supply and demand: how much pipe for each open pore?</h3>' +
      '<p class="sp-sub">Stomata set the demand for water; the leaf’s plumbing, K<sub>leaf</sub>, sets the supply. Give every leaf the same stomatal opening on the same afternoon and see how hard each one has to pull: the drop in Ψ across the leaf is E ÷ K<sub>leaf</sub>.</p>' +
      '<div class="lh-two">' +
        '<div><div data-r="sdch"></div>' +
          '<div class="lh-sl"><label for="sp-sd-gs">Same stomatal opening</label><input type="range" id="sp-sd-gs" min="0.05" max="0.5" step="0.01" value="0.25"><output id="sp-sd-gso"></output></div>' +
          '<p class="lh-read" data-r="sdread" aria-live="polite"></p></div>' +
        '<div><p style="margin:0">A leaf with a high K<sub>leaf</sub> for its g<sub>s</sub> keeps its cells near the water potential of the stem while the stomata are wide open. That ratio, maximum K<sub>leaf</sub> to maximum g<sub>s</sub>, is the supply to demand ratio.</p>' +
          '<p class="sp-small" style="margin-top:8px">Maximum K<sub>leaf</sub> values are ' + LH.badge('MEASURED') + ' ' + LH.ev('lh.caragana', 'Evidence: Caragana') + ' ' + LH.ev('lh.lantana', 'Evidence: Lantana') + ' ' + LH.ev('lh.oak', 'Evidence: oak') + ' ' + LH.ev('lh.grape', 'Evidence: grapevine') + '. The shared g<sub>s</sub> is ' + LH.badge('ILLUSTRATIVE', 'Real species differ in maximum gs; this toy holds it equal to isolate the supply side.') + '; E uses the live VPD and the drop E ÷ K<sub>leaf</sub> is ' + LH.badge('DERIVED') + '.</p></div>' +
      '</div>' +
      '<div class="lh-two even" style="margin-top:12px">' +
        '<div class="card"><h4 style="margin:0 0 6px">High supply, tight control: Caragana</h4><p style="margin:0">Ten Caragana shrubs from about 110 to 1,400 mm of yearly rain grew side by side in one garden. The species from the driest places had about four times the maximum K<sub>leaf</sub> (16.5 against 4.2 mmol m⁻² s⁻¹ MPa⁻¹), more negative K<sub>leaf</sub> P50 and turgor loss point, and a higher K<sub>leaf</sub> to g<sub>s</sub> ratio. They did not keep their stomata wide open: they closed them <b>more tightly</b> as they dried, driven by more ABA, and gained water use efficiency ' + LH.ev('lh.caragana') + '.</p></div>' +
        '<div class="card"><h4 style="margin:0 0 6px">California chaparral: safety first</h4><p style="margin:0">In ten species measured with the same method, the five from dry habitats, mostly Southern California chaparral, lost turgor at a mean of ' + M + '2.71 MPa against ' + M + '1.74 MPa, and halved their K<sub>leaf</sub> at ' + M + '2.24 against ' + M + '0.78 MPa ' + LH.ev('lh.dryhab') + '. Coast live oak and mountain mahogany pair that safety with a modest supply (maximum K<sub>leaf</sub> near 4).</p>' +
          '<p class="tier-2" style="margin:8px 0 0">Across 30 Viburnum species, those from hotter, drier ranges had more K<sub>leaf</sub> per unit g<sub>s</sub> (r = 0.39) ' + LH.ev('lh.viburnum') + '.</p></div>' +
      '</div>' +
      '<div class="lh-oq"><span class="tag">Open question</span><h4>Is closing early a way to tolerate drought, or to avoid it?</h4><p style="margin:0">The dry habitat Caragana have both: pipes that resist failure and stomata that shut early. Do chaparral shrubs, which in Southern California can close their stomata below turgor loss (see the gauge below), sit at a different point on the same trade off? What would you need to measure, on the same plants, to place them?</p></div>';
    var anchor = null;
    Array.prototype.forEach.call(root.querySelectorAll('h3.sp-h'), function (h) { if (!anchor && /chaparral shrub go/.test(h.textContent)) anchor = h; });
    if (anchor) anchor.parentNode.insertBefore(sec, anchor); else root.appendChild(sec);
    var gs = sec.querySelector('#sp-sd-gs'); gs.addEventListener('input', function () { SD.gs = +gs.value; sdDraw(sec); });
    if (WP.on) WP.on(function () { sdDraw(sec); });
    sdDraw(sec);
  }
  function sdDraw(sec) {
    var LH = WP.lh, res = WP.result; if (!LH || !res) return;
    var VPD = res.VPD, E = SD.gs * VPD / 101.3 * 1000, host = sec.querySelector('[data-r="sdch"]'), nar = LH.narrow(host);
    var W = nar ? 440 : 600, L = nar ? 8 : 230, R = 70, T = 8, rowH = nar ? 46 : 32, H = T + SDL.length * rowH + 30;
    var dmax = Math.max(0.6, E / 3.96 * 1.05);
    function X(v) { return L + (W - L - R) * v / dmax; }
    var s = '<svg class="lh-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Drop in water potential across the leaf for each species at the same stomatal opening">';
    SDL.forEach(function (r, i) {
      var y = T + i * rowH, d = E / r[1], by = nar ? y + 20 : y + 6;
      s += '<text x="' + (nar ? L : L - 8) + '" y="' + (nar ? y + 14 : y + 19) + '"' + (nar ? '' : ' text-anchor="end"') + '>' + r[0] + '</text>';
      s += '<rect x="' + (nar ? L : L) + '" y="' + by + '" width="' + (X(d) - L).toFixed(1) + '" height="18" rx="3" fill="' + r[2] + '" opacity=".85"/>';
      s += '<text class="sm" x="' + (X(d) + 6).toFixed(1) + '" y="' + (by + 14) + '">' + LH.psi(-d) + '</text>';
    });
    s += '<text class="sm" x="' + (nar ? L : L) + '" y="' + (H - 6) + '">drop in Ψ across the leaf, E ÷ K<tspan baseline-shift="sub" font-size="10">leaf</tspan>, MPa</text>';
    host.innerHTML = s + '</svg>';
    sec.querySelector('#sp-sd-gso').textContent = LH.num(SD.gs, 2) + ' mol m⁻² s⁻¹';
    var hi = E / 16.5, lo = E / 3.96;
    sec.querySelector('[data-r="sdread"]').innerHTML = 'At VPD ' + LH.num(VPD, 2) + ' kPa every leaf loses <b>' + LH.num(E, 1) + '</b> mmol m⁻² s⁻¹. The dry end Caragana leaf drops only <b>' + LH.num(hi, 2) + '</b> MPa; coast live oak drops <b>' + LH.num(lo, 2) + '</b> MPa, about ' + LH.num(lo / hi, 0) + ' times more.';
  }

  WP.levels.push({ id: 'species', n: 5.5, title: 'California and beyond', subtitle: 'crops and wild plants on the same axes', scale: '1000 km', focus: [50, 30], mount: mount, update: update, show: show });
  WP.speciesSim = simulate; // exposed for checks
})();

// src/data/site.js
// Facts shown on the site. Names of people come only from content/people.txt.

export const person = {
  name: 'Caetano Albuquerque',
  role: 'Assistant Professor',
  unit: 'Agricultural Plant and Soil Sciences',
  institution: 'California State University, Monterey Bay',
  email: 'calbuquerque@csumb.edu',
  scholar: 'https://scholar.google.com/citations?user=FnRaXGoAAAAJ',
  orcid: 'https://orcid.org/0000-0001-6222-3996',
  orcidId: '0000-0001-6222-3996',
};

export const siteDescription =
  'Caetano Albuquerque, plant physiologist at CSU Monterey Bay: how plants respond to drought and recover from it, across scales, relating structure and function.';

// status: 'published' | 'accepted' | 'review'
// Student authors: * undergraduate mentee, ** co-mentored graduate student.
export const publications = [
  {
    status: 'review',
    authors: 'Albuquerque C, Momayyezi M, Arancibia C, Aguero CB, Stanfield R, Ron M, Walker MA, Bartlett MK, Scoffoni C, Kluepfel D, McElrone AJ.',
    title: 'PIP2;1 aquaporin promotes early stomatal closure in grapevine leaves during water stress.',
    venue: 'In review.',
    link: 'https://doi.org/10.64898/2026.01.29.702672',
    linkLabel: 'Preprint',
  },
  {
    status: 'review',
    authors: 'Hahn L, Brancher TL, Ogoshi C, Parent LE, Albuquerque C, Brunetto G.',
    title: 'Foliar nutrient imbalance and its association with European apple canker incidence.',
    venue: 'In review.',
  },
  {
    status: 'review',
    authors: 'Hahn L, Brancher TL, Argenta LC, Grando DL, Schmitt DE, Moura-Bueno JM, Albuquerque C, Parent LE, Brunetto G.',
    title: "Fertilization decisions in apple orchards integrating stakeholders' data, state guidelines and field trials.",
    venue: 'Submitted.',
  },
  {
    status: 'accepted',
    authors: 'Elavarthi P, Chong X, Abramov D, Clark EG, Koepp W, McReynolds D, Parkinson DY, Hammermeister A, Albuquerque C, McElrone AJ, Chavez T, Hexemer A, Zwart PH.',
    title: 'Synchrotron micro-CT time series of dehydrating grapevine petioles with a legacy semantic segmentation corpus.',
    journal: 'Scientific Data',
    venue: 'accepted.',
    link: 'https://doi.org/10.5281/zenodo.19476729',
    linkLabel: 'Dataset',
  },
  {
    status: 'published', year: 2026,
    authors: 'Boisseaux M, Nadal M, Albuquerque C, Gomez J**, Garcia L**, Amitrano C, Browne M, McElrone AJ, Sack L, Scoffoni C.',
    title: 'Stronger drought tolerance in C4 compared with C3 grass crops is achieved via both avoidance and resistance strategies.',
    journal: 'Journal of Experimental Botany', venue: 'erag393.',
    link: 'https://doi.org/10.1093/jxb/erag393',
  },
  {
    status: 'published', year: 2025,
    authors: 'Momayyezi M, Knipfer TM, Hernandez-Perez M, Kluepfel DA, Wakholi C, Rippner DA, Albuquerque C, Bambach NE, DeGrom J, McElrone AJ.',
    title: 'Differential impact of commercial rootstocks on the physiological response of a common walnut scion to drought stress.',
    journal: 'Physiologia Plantarum', venue: '177(2): e70188.',
    link: 'https://doi.org/10.1111/ppl.70188',
  },
  {
    status: 'published', year: 2023,
    authors: 'Scoffoni C, Albuquerque C, Buckley TN, Sack L.',
    title: 'The dynamic multi-functionality of leaf water transport outside the xylem.',
    journal: 'New Phytologist', venue: '239: 2099 to 2107.',
    link: 'https://doi.org/10.1111/nph.19069',
  },
  {
    status: 'published', year: 2020,
    authors: 'Albuquerque C, Scoffoni C, Brodersen CR, Buckley TN, Sack L, McElrone AJ.',
    title: 'Coordinated decline of leaf hydraulic and stomatal conductances under drought is not linked to leaf xylem embolism for different grapevine cultivars.',
    journal: 'Journal of Experimental Botany', venue: '71(22): 7286 to 7300.',
    link: 'https://doi.org/10.1093/jxb/eraa392',
    note: 'Journal cover.',
    cover: { src: '/img/jxb-2020-cover.webp', width: 240, height: 313, alt: 'Cover of Journal of Experimental Botany, volume 71, issue 22, 2020' },
  },
  {
    status: 'published', year: 2018,
    authors: 'Scoffoni C, Albuquerque C, Cochard H, Buckley TN, Fletcher LR, Caringella MA, Bartlett MK, Brodersen CR, Jansen S, McElrone AJ, Sack L.',
    title: 'The causes of leaf hydraulic vulnerability and its influence on gas exchange in Arabidopsis thaliana.',
    journal: 'Plant Physiology', venue: '178(4): 1584 to 1601.',
    link: 'https://doi.org/10.1104/pp.18.00743',
  },
  {
    status: 'published', year: 2018,
    authors: 'Knipfer T, Barrios-Masias FH, Cuneo IF, Bouda M, Albuquerque C, Brodersen CR, McElrone AJ.',
    title: 'Variations in xylem embolism susceptibility under drought between intact saplings of three walnut species.',
    journal: 'Tree Physiology', venue: '38(8): 1180 to 1192.',
    link: 'https://doi.org/10.1093/treephys/tpy049',
  },
  {
    status: 'published', year: 2018,
    authors: 'McElrone AJ, Earles JM, Knipfer TM, Albuquerque C, Brodersen CR, Cuneo IF.',
    title: 'Changes in xylem conducting capacity and water storage across species: how can variable air content of xylem cells affect sap flow?',
    journal: 'Acta Horticulturae', venue: '1222.',
    link: 'https://doi.org/10.17660/ActaHortic.2018.1222.2',
  },
  {
    status: 'published', year: 2017,
    authors: 'Scoffoni C, Albuquerque C, Brodersen CR, Townes SV, John GP, Bartlett MK, Buckley TN, McElrone AJ, Sack L.',
    title: 'Outside-xylem vulnerability, not xylem embolism, controls leaf hydraulic decline during dehydration.',
    journal: 'Plant Physiology', venue: '173(2): 1197 to 1210.',
    link: 'https://doi.org/10.1104/pp.16.01643',
  },
  {
    status: 'published', year: 2017,
    authors: 'Scoffoni C, Albuquerque C, Brodersen CR, Townes SV, John GP, Cochard H, Buckley TN, McElrone AJ, Sack L.',
    title: 'Leaf vein xylem conduit diameter influences susceptibility to embolism and hydraulic decline.',
    journal: 'New Phytologist', venue: '213(3): 1076 to 1092.',
    link: 'https://doi.org/10.1111/nph.14256',
  },
  {
    status: 'published', year: 2016,
    authors: 'Hochberg U, Albuquerque C, Rachmilevitch S, Cochard H, David-Schwartz R, Brodersen CR, Windt CW.',
    title: 'Grapevine petioles are more sensitive to drought induced embolism than stems: evidence from in vivo MRI and microCT observations of hydraulic vulnerability segmentation.',
    // Issue 9 per Crossref (confirmed with Caetano); an earlier prompt said 39(8).
    journal: 'Plant, Cell and Environment', venue: '39(9): 1886 to 1894.',
    link: 'https://doi.org/10.1111/pce.12688',
  },
  {
    status: 'published', year: 2011,
    authors: 'Macari S, Carvalho PCF, Oliveira L, Devincenzi T, Albuquerque C, Moraes A.',
    title: 'Rearing of lambs under different grazing methods on annual ryegrass in succession to crops.',
    journal: 'Pesquisa Agropecuária Brasileira', venue: '46: 1401 to 1408.',
  },
];

// Funding shown on Research, from CV v28. No dollar amounts on the site.
export const funding = {
  research: [
    { funder: 'CSU Agricultural Research Institute', title: 'Climate-Resilient Vineyards: Enhanced practices and sensing to improve water-use efficiency and soil carbon in the Central Coast', role: 'PI', years: '2026 to 2028' },
    { funder: 'CSU GUIDE', title: 'Establishing a High-Throughput Gravimetric Phenotyping Platform to Quantify Water-Use Efficiency and Nitrate Leaching in Romaine Lettuce', role: 'PI', years: '2026 to 2027' },
    { funder: 'California Institute for Water Resources and U.S. Geological Survey', title: 'Testing proximal sensors technology to improve irrigation use efficiency for vegetable production in the Salinas Valley', role: 'PI', years: '2026 to 2027' },
    { funder: 'CSU Monterey Bay Research, Scholarship and Creative Activity', title: 'Integrated Plant Sensing Technologies for Improved Water Use Efficiency and Reduced Production Losses in Salinas Valley Lettuce', role: 'PI', years: '2026 to 2027' },
    { funder: 'California Leafy Greens Research Board', title: 'USDA lettuce breeding for improved disease resistance', role: 'Co-PI, site PI at CSU Monterey Bay', years: '2025 to 2027' },
    { funder: 'CSU Agricultural Research Institute', title: 'Monitoring soil health, water conservation, and vegetable productivity on organic cropland amended with eucalyptus biochar', role: 'Co-PI', years: '2024 to 2026' },
    { funder: 'LI-COR Environmental Education Fund', title: 'Gas exchange instrumentation for plant ecophysiology teaching and undergraduate research', role: 'PI', years: '2023' },
  ],
  teaching: [
    { funder: 'CSU LIFT (Learning Innovation for Future-Forward Teaching)', title: 'Decision-Ready: Embedding Durable Skills Across Applied Agricultural and Plant Sciences Courses at CSUMB', role: 'PI', years: '2026 to 2027', note: 'One of 45 proposals funded from about 260 across the CSU system.' },
  ],
  beamtime: 'Advanced Light Source, beamline 8.3.2: 15 shifts across two proposals, 9 as PI and experiment leader.',
};

// Shown as a logo row on Research, in this order. Files come from content/logos/.
export const supporters = [
  'CSU Agricultural Research Institute',
  'California Institute for Water Resources',
  'CSU Chancellor’s Office',
  'U.S. Geological Survey',
  'California Leafy Greens Research Board',
  'LI-COR',
  'Advanced Light Source, Lawrence Berkeley National Laboratory',
];

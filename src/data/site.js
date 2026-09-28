// src/data/site.js
// Central content file for the website.
// Writing rules: short sentences, first person, no dashes in visible text.
// Anything marked TODO still needs Caetano's confirmation.

export const person = {
  name: 'Caetano Albuquerque',
  title: 'Assistant Professor, CSU Monterey Bay',
  focus: "Where a plant's water transport fails under drought and heat, and whether it recovers.",
  email: 'calbuquerque@csumb.edu',
  orcid: 'https://orcid.org/0000-0001-6222-3996',
  orcidId: '0000-0001-6222-3996',
  scholar: 'https://scholar.google.com/citations?user=FnRaXGoAAAAJ',
  researchgate: '', // TODO: ResearchGate profile URL
  linkedin: '', // TODO: LinkedIn profile URL
  github: 'https://github.com/cpalbuquerque',
};

// Grants since 2023, as PI or co-PI. Amounts are the CSUMB share where noted.
// Total $333,176 (research $323,266 plus the CSU LIFT teaching award).
export const fundingSummary =
  'About $333,000 as PI or co-PI since 2023, including a systemwide award for teaching innovation.';

export const grants = [
  {
    title: 'Climate-Resilient Vineyards: enhanced practices and sensing to improve water-use efficiency and soil carbon in the Central Coast',
    funder: 'CSU Agricultural Research Institute (ARI 27-99-187)',
    role: 'Principal Investigator (sole PI)',
    period: '2026 to 2028',
    amount: '$117,000',
    summary: 'A vineyard trial that pairs plant based water status sensing with soil carbon and irrigation practices, run with undergraduate researchers.',
  },
  {
    title: 'Establishing a high-throughput gravimetric phenotyping platform to quantify water-use efficiency and nitrate leaching in romaine lettuce',
    funder: 'CSU GUIDE, Track 1',
    role: 'Principal Investigator (co-PI: Christine Scoffoni, Cal State LA)',
    period: '2026 to 2027',
    amount: '$80,000',
    summary: 'Plants on balances, weighed continuously, to measure whole plant transpiration and water use.',
  },
  {
    title: 'Monitoring soil health, water conservation, and vegetable productivity on organic cropland amended with eucalyptus biochar',
    funder: 'CSU Agricultural Research Institute (ARI 25-07-101)',
    role: 'Co-Principal Investigator (with Arun Jani, CSUMB)',
    period: '2024 to 2026',
    amount: '$66,707',
    summary: 'Tests how biochar changes soil water and plant growth in organic vegetable systems.',
  },
  {
    title: 'Testing proximal sensor technology to improve irrigation use efficiency for vegetable production in the Salinas Valley',
    funder: 'California Institute for Water Resources / USGS 104(b)',
    role: 'Principal Investigator (co-PI: Prashanta Pokharel, CSUMB)',
    period: '2026 to 2027',
    amount: '$30,497',
    summary: 'Compares sensor readings with direct measures of plant water status in the field.',
  },
  {
    title: 'Integrated plant sensing technologies for improved water use efficiency in Salinas Valley lettuce',
    funder: 'CSUMB Research, Scholarship and Creative Activity Award',
    role: 'Principal Investigator',
    period: '2026 to 2027',
    amount: '$10,013',
    summary: 'One of seven campus awards.',
  },
  {
    title: 'USDA lettuce breeding for improved disease resistance (LGR-2025-01B and continuation LGR-2026-06B)',
    funder: 'California Leafy Greens Research Board',
    role: 'Co-Principal Investigator, site PI at CSUMB (lead PI: Kelley Richardson, USDA-ARS)',
    period: '2025 to 2027',
    amount: '$13,224 CSUMB share',
    summary: 'Links xylem anatomy and plant water relations to Fusarium wilt resistance in lettuce breeding lines.',
  },
  {
    title: 'LI-COR Environmental Education Fund',
    funder: 'LI-COR Biosciences',
    role: 'Principal Investigator',
    period: '2023',
    amount: '$5,825',
    summary: 'Gas exchange instruments for plant physiology teaching and undergraduate research.',
  },
  {
    title: 'Decision-Ready: embedding durable skills across applied agricultural and plant science courses',
    funder: 'CSU LIFT, Tier 2 (teaching innovation)',
    role: 'Principal Investigator',
    period: '2026 to 2027',
    amount: '$9,910',
    summary: 'One of 45 proposals funded from about 260 across the CSU system.',
  },
];

export const beamtime = {
  summary: 'Advanced Light Source, beamline 8.3.2: 15 shifts across two proposals, 9 of them as PI and experiment leader.',
  allocations: [
    {
      title: 'Investigating plant traits associated with disease resistance in lettuce',
      detail: 'RAPIDD allocation RA-00791. PI and experiment leader. 9 shifts, 2025 to 2026.',
    },
    {
      title: "Exploring the role of conduit implosion in plants' response to drought and disease",
      detail: 'General User Proposal ALS-13561 (proposal PI: Andrew McElrone). Experiment leader. 6 shifts, 2025 to 2026.',
    },
  ],
};

// Student author key: * undergraduate mentee, ** co-mentored graduate student.
export const publications = [
  {
    year: 2026,
    authors: 'Boisseaux M, Nadal M, Albuquerque C, Gomez J**, Garcia L**, Amitrano C, Browne M, McElrone AJ, Sack L, Scoffoni C.',
    title: 'Stronger drought tolerance in C4 compared with C3 grass crops is achieved via both avoidance and resistance strategies.',
    journal: 'Journal of Experimental Botany',
    volume: 'erag393',
    doi: 'https://doi.org/10.1093/jxb/erag393',
  },
  {
    year: 2025,
    authors: 'Momayyezi M, Knipfer TM, Hernandez-Perez M, Kluepfel DA, Wakholi C, Rippner DA, Albuquerque C, Bambach NE, DeGrom J, McElrone AJ.',
    title: 'Differential impact of commercial rootstocks on the physiological response of a common walnut scion to drought stress.',
    journal: 'Physiologia Plantarum',
    volume: '177(2), e70188',
    doi: 'https://doi.org/10.1111/ppl.70188',
  },
  {
    year: 2023,
    authors: 'Scoffoni C, Albuquerque C, Buckley TN, Sack L.',
    title: 'The dynamic multi-functionality of leaf water transport outside the xylem.',
    journal: 'New Phytologist',
    volume: '239, 2099-2107',
    doi: 'https://doi.org/10.1111/nph.19069',
  },
  {
    year: 2020,
    authors: 'Albuquerque C, Scoffoni C, Brodersen CR, Buckley TN, Sack L, McElrone AJ.',
    title: 'Coordinated decline of leaf hydraulic and stomatal conductances under drought is not linked to leaf xylem embolism for different grapevine cultivars.',
    journal: 'Journal of Experimental Botany',
    volume: '71(22), 7286-7300',
    doi: 'https://doi.org/10.1093/jxb/eraa392',
  },
  {
    year: 2018,
    authors: 'Scoffoni C, Albuquerque C, Cochard H, Buckley TN, Fletcher LR, Caringella MA, Bartlett MK, Brodersen CR, Jansen S, McElrone AJ, Sack L.',
    title: 'The causes of leaf hydraulic vulnerability and its influence on gas exchange in Arabidopsis thaliana.',
    journal: 'Plant Physiology',
    volume: '178(4), 1584-1601',
    doi: 'https://doi.org/10.1104/pp.18.00743',
  },
  {
    year: 2018,
    authors: 'Knipfer T, Barrios-Masias FH, Cuneo IF, Bouda M, Albuquerque C, Brodersen CR, McElrone AJ.',
    title: 'Variations in xylem embolism susceptibility under drought between intact saplings of three walnut species.',
    journal: 'Tree Physiology',
    volume: '38(8), 1180-1192',
    doi: 'https://doi.org/10.1093/treephys/tpy049',
  },
  {
    year: 2018,
    authors: 'McElrone AJ, Earles JM, Knipfer TM, Albuquerque C, Brodersen CR, Cuneo IF.',
    title: 'Changes in xylem conducting capacity and water storage across species: how can variable air content of xylem cells affect sap flow?',
    journal: 'Acta Horticulturae',
    volume: '1222',
    doi: 'https://doi.org/10.17660/ActaHortic.2018.1222.2',
  },
  {
    year: 2017,
    authors: 'Scoffoni C, Albuquerque C, Brodersen CR, Townes SV, John GP, Bartlett MK, Buckley TN, McElrone AJ, Sack L.',
    title: 'Outside-xylem vulnerability, not xylem embolism, controls leaf hydraulic decline during dehydration.',
    journal: 'Plant Physiology',
    volume: '173(2), 1197-1210',
    doi: 'https://doi.org/10.1104/pp.16.01643',
  },
  {
    year: 2016,
    authors: 'Scoffoni C, Albuquerque C, Brodersen CR, Townes SV, John GP, Cochard H, Buckley TN, McElrone AJ, Sack L.',
    title: 'Leaf vein xylem conduit diameter influences susceptibility to embolism and hydraulic decline.',
    journal: 'New Phytologist',
    volume: '213(3), 1076-1092',
    doi: 'https://doi.org/10.1111/nph.14256',
  },
  {
    year: 2016,
    authors: 'Hochberg U, Albuquerque C, Rachmilevitch S, Cochard H, David-Schwartz R, Brodersen CR, Windt CW.',
    title: 'Grapevine petioles are more sensitive to drought induced embolism than stems: evidence from in vivo MRI and microCT observations of hydraulic vulnerability segmentation.',
    journal: 'Plant, Cell & Environment',
    // Crossref lists issue 9; the round 2 spec said 39(8). TODO: confirm.
    volume: '39(9), 1886-1894',
    doi: 'https://doi.org/10.1111/pce.12688',
  },
  {
    year: 2011,
    authors: 'Macari S, Carvalho PCF, Oliveira L, Devincenzi T, Albuquerque C, Moraes A.',
    title: 'Rearing of lambs under different grazing methods on annual ryegrass in succession to crops.',
    journal: 'Pesquisa Agropecuária Brasileira',
    volume: '46, 1401-1408',
    doi: '',
  },
];

// Accepted, under review, submitted, and in preparation.
export const inPreparation = [
  {
    authors: 'Elavarthi P, Chong X, Abramov D, Clark EG, Koepp W, McReynolds D, Parkinson DY, Hammermeister A, Albuquerque C, McElrone AJ, Chavez T, Hexemer A, Zwart PH.',
    title: 'Synchrotron micro-CT time series of dehydrating grapevine petioles with a legacy semantic segmentation corpus.',
    status: 'Scientific Data, accepted.',
    link: 'https://doi.org/10.5281/zenodo.19476729',
    linkLabel: 'Dataset (Zenodo)',
  },
  {
    authors: 'Albuquerque C, Hammermeister A, Scoffoni C, Brodersen CR, Sack L, McElrone AJ.',
    title: 'Reversible collapse of water-filled xylem conduits precedes embolism in grapevine petioles under drought.',
    status: 'With co-authors, for submission to New Phytologist.',
  },
  {
    // Author list follows the CV. The bioRxiv record lists Aguero before Arancibia
    // and does not include Kluepfel. TODO: confirm the submitted author list.
    authors: 'Albuquerque C, Momayyezi M, Arancibia C, Aguero CB, Stanfield R, Ron M, Walker MA, Bartlett MK, Scoffoni C, Kluepfel D, McElrone AJ.',
    title: 'PIP2;1 aquaporin promotes early stomatal closure in grapevine leaves during water stress.',
    status: 'Invited submission, under review at Frontiers in Plant Science.',
    link: 'https://doi.org/10.64898/2026.01.29.702672',
    linkLabel: 'Preprint (bioRxiv)',
  },
  {
    // TODO: confirm Bragantia status.
    authors: 'Rech M, Hahn L, Wamser AF, Argenta LC, Albuquerque C, Lima-Rodrigues M, Grando DL, Kokkonen AA, Brunetto G.',
    title: 'Increasing soil Ca:Mg ratio improves tomato yield, quality, and resistance to rot.',
    status: 'Under review at Bragantia.',
  },
  {
    // Author list follows the CV. The site prompt listed "Scoffoni, Albuquerque, Sack". TODO: confirm order and Barragan's marker.
    authors: 'Albuquerque C, Barragan E**, Sack L, Scoffoni C.',
    title: 'A new method to quantify root hydraulic conductance vulnerability curves.',
    status: 'Invited contribution, Journal of Visualized Experiments.',
  },
  {
    authors: 'Albuquerque C, McElrone AJ.',
    title: 'Xylem collapse and recovery after rehydration confers resilience to water stress in lettuce (Lactuca sativa).',
    status: 'In preparation.',
  },
];


export const collaborators = [
  { name: 'Andrew McElrone', affiliation: 'USDA-ARS and UC Davis' },
  { name: 'Christine Scoffoni', affiliation: 'Cal State LA' },
  { name: 'Lawren Sack', affiliation: 'UCLA' },
  { name: 'Craig Brodersen', affiliation: 'Yale University' },
  { name: 'Tom Buckley', affiliation: 'UC Davis' },
  { name: 'Megan Bartlett', affiliation: 'UC Davis' },
  { name: 'Mina Momayyezi', affiliation: 'USDA-ARS and UC Davis' },
  { name: 'Peter Zwart', affiliation: 'Lawrence Berkeley National Laboratory' },
  { name: 'Dilworth Parkinson', affiliation: 'Advanced Light Source' },
  { name: 'Kelley Richardson', affiliation: 'USDA-ARS Salinas' },
  { name: 'Ivan Simko', affiliation: 'USDA-ARS Salinas' },
  { name: 'Michael Cahn', affiliation: 'UC ANR Monterey County' },
  { name: 'Thorsten Knipfer', affiliation: 'University of British Columbia' },
  { name: 'Italo Cuneo', affiliation: 'P. Universidad Católica de Valparaíso' },
  { name: 'Felipe Barrios-Masias', affiliation: 'University of Nevada, Reno' },
  { name: 'Leandro Hahn', affiliation: 'EPAGRI, Brazil' },
];

// News, newest and most relevant first. Dates left blank are TODO.
export const news = [
  {
    date: '', // TODO: month and year of the Berkeley Lab workshop
    type: 'Research',
    headline: 'Two lab students trained at a microCT annotation workshop at Berkeley Lab',
    body: 'Two students from my lab attended a workshop at Lawrence Berkeley National Laboratory on annotating synchrotron microCT scans. They now help lead the same work in Plant Physiology, where every student annotates real scans of grapevine petioles for SYNAPS-I.',
  },
  {
    date: '', // TODO: date of the high school visit
    type: 'Outreach',
    headline: 'High school students visit the lab',
    body: 'We hosted visiting high school students in the lab.', // TODO: add one sentence on what they did
  },
  {
    date: '2024 to 2026',
    type: 'Student News',
    headline: 'Sixteen student posters since 2024',
    body: 'Students from the lab have given 16 posters since 2024.',
  },
  {
    date: 'Spring 2026',
    type: 'Student News',
    headline: 'Joe Perez selected for a summer research internship at Stanford University',
    body: 'Joe joined a summer research program at Stanford University. Congratulations, Joe.',
  },
  {
    date: 'Spring 2026',
    type: 'Student News',
    headline: 'Melissa Martinez selected for a summer research internship at the University of Minnesota',
    body: 'Melissa joined a summer research program at the University of Minnesota. Congratulations, Melissa.',
  },
  {
    date: 'March 2026',
    type: 'Talk',
    headline: 'Invited talk at the International Microirrigation School for Crop Production',
    body: 'I spoke on plant based irrigation management and water stress diagnostics for vegetable crops at the California Agricultural Irrigation Institute school in Davis.',
    link: 'https://caii.org/international-micro-irrigation-school/',
    image: '/img/microirrigation-school-2026-banner.webp',
    imageWidth: 1200,
    imageHeight: 504,
  },
];

// Current group. Only names already on the site and still current; full roster comes in pass 2.
// TODO: confirm Melissa Martinez, Matthijs De Vries and Asamahan Murran are current.
export const currentStudents = [
  {
    name: 'Melissa Martinez',
    role: 'Undergraduate Researcher',
    year: '2023 to present',
    project: 'Plant water relations and field experiments in vegetable crops.',
    note: 'Summer 2026 research internship, University of Minnesota.',
  },
  {
    name: 'Matthijs De Vries',
    role: 'Undergraduate Researcher',
    year: '2024 to present',
    project: 'Research methods and plant ecophysiology in vegetable crops.',
  },
  {
    name: 'Asamahan Murran',
    role: 'Undergraduate Researcher',
    year: '2024 to present',
    project: 'Vegetable crop physiology and irrigation.',
  },
];

export const alumni = [
  {
    name: 'Joe Perez',
    role: 'Undergraduate Researcher',
    period: '2024 to 2026',
    outcome: 'Drought responses in almond: leaf hydraulic conductance, embolism and anatomy under water stress. Presented at the California Plant and Soil Conference and the USDA NIFA NextGen Internship Symposium. Apple Scholarship recipient.',
  },
  {
    name: 'Bella Hartman',
    role: 'Undergraduate Researcher',
    period: '2023 to 2026',
    outcome: 'Soil health and plant productivity in organic cropping systems amended with eucalyptus biochar. CSU ARI Undergraduate Research Scholar.',
  },
  {
    name: 'Angela Diaz',
    role: 'Undergraduate Researcher',
    period: '2024 to 2026',
    outcome: 'Structural and functional responses of lettuce leaves during progressive drought and rehydration. Summer research internship at Stanford University.',
  },
  {
    name: 'Dr. Leandro Hahn',
    role: 'Visiting Postdoctoral Scholar',
    period: 'January to July 2025',
    outcome: 'Researcher at EPAGRI, Brazil. Tools to improve water and nutrient use efficiency in vegetable crops, with Michael Cahn (UC ANR).',
  },
];

export const labStats = {
  current: 'Twelve undergraduates in the lab now. Of the 47 students I have mentored, 43 are the first in their families to attend college.',
  posters: 'Students have given 16 posters since 2024.',
};

export const alumniNote = 'Former mentees are now in PhD programs at UCLA, the University of Wisconsin-Madison and Texas A&M.';

export const courses = [
  { code: 'BIO 332', title: 'Plant Physiology' },
  { code: 'BIO 106', title: 'Introduction to Plant Sciences' },
  { code: 'AGPS 350', title: 'Research Methods for Crop and Soil Sciences' },
  { code: 'AGPS 415', title: 'Advanced Irrigation and Nutrient Management' },
  { code: 'AGPS 213', title: 'Principles of Viticulture' },
  // The round 2 spec gives this title; the CV says "Plants, Agriculture, and Climate Change". TODO: confirm.
  { code: 'AGPS 209', title: 'Plants, Agriculture, and Environment' },
  { code: 'AGPS 397', title: 'Independent Research in Agriculture' },
];

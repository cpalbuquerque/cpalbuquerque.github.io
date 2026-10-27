/* The Water Path v8: n_species.js (nutrient path, Plate VI Species)
   The plants on this site compared on nutrient strategy: mycorrhizal or not, Strategy I or Strategy II iron uptake,
   and C3, C4 or CAM (with what C4 would change for nitrogen). A 2D matrix (turning a camera would show nothing new).
   Every cell is either backed by a paper whose record and abstract were read for this page, or says "not verified".
   Registered with WP.nutrient.register('species', {mount, update, unmount}). */
(function () {
  'use strict';
  var WP = window.WP, N = WP && WP.nutrient;
  if (!N) return;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function B(t, s) { return window.WS ? WS.badge(t, s) : esc(t); }
  function doi(d) { return '<a href="https://doi.org/' + d + '" target="_blank" rel="noopener">doi ' + d + '</a>'; }

  /* ------------------------------------------------------------ the facts
     v: the short answer (null = not verified); g: the group it sorts into; tag: evidence tag; say: what the source
     shows, in plain words; src: citation; d: DOI. Group rule notes are kept apart from the verified answer. */
  var C4LIST = 'Sage, Christin and Edwards 2011 list every known C₄ lineage (J Exp Bot 62: 3155-3169, ' + doi('10.1093/jxb/err048') + '). This plant\'s family or genus is not among them';
  var SP = [
    { id: 'grape', name: 'Grapevine', sci: 'Vitis vinifera', where: 'crop on Plates I to V',
      myc: { v: 'arbuscular', g: 'AM', tag: 'MEASURED', say: 'Root colonisation by arbuscular mycorrhizal fungi was measured by microscopy in 10 rootstock and scion combinations; the rootstock, not the scion, shaped which fungi were there.', src: 'Lailheugue et al. 2024, Environ Microbiol Rep 16: e13318', d: '10.1111/1758-2229.13318' },
      fe: { v: 'Strategy I', g: 'I', tag: 'SECONDARY', say: 'The paper states that grapevine is described as meeting iron shortage with Strategy I: more H⁺ pushed out of the root and more ferric chelate reductase. Its own root exudates also held 3-hydroxymugineic acid, which the authors read as a sign that grapevine\'s responses are more varied than the usual Strategy I picture.', src: 'Marastoni et al. 2020, Sci Rep 10: 18839', d: '10.1038/s41598-020-75317-w' },
      ps: { v: 'C₃', g: 'C3', tag: 'DERIVED', say: C4LIST + ' (Vitaceae).' } },
    { id: 'lettuce', name: 'Romaine lettuce', sci: 'Lactuca sativa', where: 'crop on Plates I to V',
      myc: { v: 'arbuscular', g: 'AM', tag: 'MEASURED', say: 'Lettuce inoculated with arbuscular mycorrhizal fungi formed the symbiosis under three phosphorus sources, and the fungi improved growth and nutritional quality, depending on the phosphorus source and the cultivar.', src: 'Baslam et al. 2011, J Agric Food Chem 59: 11129-11140', d: '10.1021/jf202445y' },
      fe: { v: null, g: 'nv', rule: 'Lettuce is not a grass, so Strategy I is expected by the group rule of Römheld and Marschner 1986 ("most nongraminaceous species"). No study on lettuce itself was checked.' },
      ps: { v: 'C₃', g: 'C3', tag: 'DERIVED', say: C4LIST + ': in the daisy family (Asteraceae) the only C₄ lineages are Chrysanthellum with Isostigma, Flaveria and Pectis, not Lactuca.' },
      extra: 'Calcium link: tipburn of leafy vegetables is a calcium shortage in young expanding leaves, which transpire little (White and Broadley 2003, ' + doi('10.1093/aob/mcg164') + '). See Nutrient IV.' },
    { id: 'almond', name: 'Almond', sci: 'Prunus dulcis', where: 'crop on Plates I to V',
      myc: { v: 'arbuscular', g: 'AM', tag: 'MEASURED', say: 'Arbuscular mycorrhizal fungi were found by DNA sequencing in the roots of six commercial Prunus rootstocks in a 15 year old almond orchard in Spain. The roots of an orchard almond belong to its rootstock.', src: 'Vargas Ribera et al. 2025, BMC Plant Biol 25: 1786', d: '10.1186/s12870-025-07895-8' },
      fe: { v: 'Strategy I', g: 'I', tag: 'MEASURED', say: 'Two Prunus rootstocks, a Myrobalan plum and the peach almond hybrid Felinem, were studied without iron; the authors call both Strategy I genotypes: one raised its iron chelate reductase, the other acidified the solution first.', src: 'Gonzalo et al. 2011, J Plant Physiol 168: 887-893', d: '10.1016/j.jplph.2010.11.017' },
      ps: { v: 'C₃', g: 'C3', tag: 'DERIVED', say: C4LIST + ' (Rosaceae).' } },
    { id: 'barley', name: 'Barley', sci: 'Hordeum vulgare', where: 'crop on Plate VI',
      myc: { v: 'arbuscular', g: 'AM', tag: 'MEASURED', say: 'Barley is an arbuscular mycorrhizal plant that does not grow much better when colonised; in this study it even grew less. Yet one fungus supplied 48 % of the plant\'s total phosphorus.', num: '48 %', src: 'Grace et al. 2009, New Phytol 181: 938-949', d: '10.1111/j.1469-8137.2008.02720.x' },
      fe: { v: 'Strategy II', g: 'II', tag: 'MEASURED', say: 'Grass roots release phytosiderophores when short of iron. Barley took up iron from iron(III) phytosiderophores 100 to 1000 times faster than from synthetic chelates, without reducing the iron first. This is the paper that named Strategy I and Strategy II.', num: '100 to 1000 times', src: 'Römheld and Marschner 1986, Plant Physiol 80: 175-180', d: '10.1104/pp.80.1.175' },
      ps: { v: 'C₃', g: 'C3', tag: 'DERIVED', say: C4LIST + ': all C₄ grasses fall in the PACMAD clade, and barley is in the other large clade (BEP), which has no C₄ species.' },
      extra: 'Mobility twist: calcium and manganese, usually counted as hard to move in the phloem, were moved out of barley and wheat leaves in the field (Maillard et al. 2015, ' + doi('10.3389/fpls.2015.00317') + ').' },
    { id: 'tomato', name: 'Tomato', sci: 'Solanum lycopersicum', where: 'crop on Plate VI',
      myc: { v: 'arbuscular', g: 'AM', tag: 'MEASURED', say: 'Fungal hyphae carried radioactive phosphate into wild type tomato with all three arbuscular mycorrhizal fungi tested, and the mycorrhiza specific phosphate transporters were switched on.', src: 'Poulsen et al. 2005, New Phytol 168: 445-454', d: '10.1111/j.1469-8137.2005.01523.x' },
      fe: { v: 'Strategy I', g: 'I', tag: 'MEASURED', say: 'Without iron, tomato roots raised their iron(III) chelate reductase and iron uptake and switched on the genes for the reductase and the Fe²⁺ transporter; the authors call tomato a Strategy I plant.', src: 'Zuchi et al. 2009, Planta 230: 85-94', d: '10.1007/s00425-009-0919-1' },
      ps: { v: 'C₃', g: 'C3', tag: 'DERIVED', say: C4LIST + ' (Solanaceae).' } },
    { id: 'oak', name: 'Coast live oak', sci: 'Quercus agrifolia', where: 'wild plant on Plate VI',
      myc: { v: 'both: arbuscular and ecto', g: 'both', tag: 'MEASURED', say: 'Coast live oak forms both arbuscular and ectomycorrhizal associations. On dry hill sites, ectomycorrhizal colonisation of the upper roots fell below 1 % in a severe multi year drought and rose to 49 % in the next wet year; arbuscular colonisation did not track soil moisture.', num: 'below 1 %, 49 %', src: 'Querejeta et al. 2009, Ecology 90: 649-662', d: '10.1890/07-1696.1' },
      fe: { v: null, g: 'nv', rule: 'An oak is not a grass, so Strategy I is expected by the group rule. No study on this oak was checked.' },
      ps: { v: 'C₃', g: 'C3', tag: 'DERIVED', say: C4LIST + ' (Fagaceae).' } },
    { id: 'agave', name: 'Desert agave', sci: 'Agave deserti', where: 'wild plant on Plate VI',
      myc: { v: null, g: 'nv', rule: 'Not checked for this species. Two other agaves, A. tequilana and A. salmiana, carry arbuscular mycorrhizal fungi in arid soil (Chávez-González et al. 2024, Environ Microbiol Rep 16: e13300, ' + doi('10.1111/1758-2229.13300') + '), but that does not prove it for A. deserti.' },
      fe: { v: null, g: 'nv', rule: 'Not a grass, so Strategy I would be expected by the group rule, but the rule says "most", and nothing was checked for agaves.' },
      ps: { v: 'CAM', g: 'CAM', tag: 'MEASURED', say: 'A Crassulacean acid metabolism (CAM) plant: in the study it took up CO₂ at night, and raising the CO₂ in the air raised its daytime uptake.', src: 'Nobel and Hartsock 1986, Plant Physiol 82: 604-606', d: '10.1104/pp.82.2.604' } }
  ];
  var COLS = {
    myc: { name: 'Mycorrhiza', short: 'fungal partner on the roots', groups: [['AM', 'arbuscular'], ['both', 'arbuscular and ecto'], ['nv', 'not verified']] },
    fe: { name: 'Iron uptake', short: 'Strategy I or II', groups: [['I', 'Strategy I'], ['II', 'Strategy II'], ['nv', 'not verified']] },
    ps: { name: 'Carbon path', short: 'C₃, C₄ or CAM', groups: [['C3', 'C₃'], ['C4', 'C₄'], ['CAM', 'CAM'], ['nv', 'not verified']] }
  };
  var COLK = ['myc', 'fe', 'ps'];

  var root = null, state = { by: 'myc', pick: null };

  function cellHtml(sp, k) {
    var c = sp[k], on = state.pick && state.pick[0] === sp.id && state.pick[1] === k;
    var lab = esc(COLS[k].name) + ' for ' + esc(sp.name) + ': ' + (c.v ? esc(c.v) : 'not verified');
    return '<button type="button" class="nsp-cell' + (c.v ? '' : ' nv') + (k === state.by ? ' by' : '') + '" data-sp="' + sp.id + '" data-k="' + k + '" aria-pressed="' + (on ? 'true' : 'false') + '" aria-label="' + lab + '. Show the evidence.">' +
      '<span class="nsp-ck">' + esc(COLS[k].name) + '</span>' +
      '<span class="nsp-v">' + (c.v ? esc(c.v) : 'not verified') + '</span>' +
      (c.v ? '<span class="nsp-b">' + B(c.tag) + '</span>' : '<span class="nsp-b nsp-nvb">no source checked</span>') + '</button>';
  }

  function render() {
    var by = state.by, body = root.querySelector('.nsp-body');
    var det0 = root.querySelector('.nsp-det'); if (det0) root.querySelector('.nsp-side').appendChild(det0);   /* keep the evidence box out of the rows being rebuilt */
    var order = [];
    COLS[by].groups.forEach(function (gp) {
      var rows = SP.filter(function (s) { return s[by].g === gp[0]; });
      if (rows.length) order.push({ g: gp, rows: rows });
    });
    var html = '';
    order.forEach(function (o) {
      html += '<div class="nsp-grp" role="group" aria-label="' + esc(COLS[by].name + ': ' + o.g[1]) + '"><p class="nsp-gh"><b>' + esc(o.g[1]) + '</b> <span>' + o.rows.length + ' of ' + SP.length + '</span></p>';
      o.rows.forEach(function (sp) {
        html += '<article class="nsp-row" data-row="' + sp.id + '"><h4 class="nsp-name">' + esc(sp.name) + ' <i>' + esc(sp.sci) + '</i><span class="nsp-where">' + esc(sp.where) + '</span></h4>' +
          '<div class="nsp-cells">' + COLK.map(function (k) { return cellHtml(sp, k); }).join('') + '</div>' +
          '<div class="nsp-slot"></div></article>';
      });
      html += '</div>';
    });
    body.innerHTML = html;
    Array.prototype.forEach.call(root.querySelectorAll('.nsp-head [data-k]'), function (h) { h.classList.toggle('by', h.getAttribute('data-k') === by); });
    paintDetail();
  }

  function paintDetail() {
    var det = root.querySelector('.nsp-det'), live = root.querySelector('.nsp-live');
    var phone = window.matchMedia && matchMedia('(max-width: 699px)').matches;
    if (!state.pick) {
      det.innerHTML = '<p class="nsp-hint">Press any cell to see what the paper shows and where it comes from.</p>';
      root.querySelector('.nsp-side').appendChild(det);
      return;
    }
    var sp = SP.filter(function (s) { return s.id === state.pick[0]; })[0], k = state.pick[1], c = sp[k];
    var h = '<h4>' + esc(sp.name) + ', ' + esc(COLS[k].name.toLowerCase()) + ': ' + (c.v ? esc(c.v) + ' ' + B(c.tag) : 'not verified') + '</h4>';
    if (c.v) h += '<p>' + c.say + (c.num ? ' <span class="nsp-num">' + esc(c.num) + ' ' + B('MEASURED', 'Reported in the paper named.') + '</span>' : '') + '</p>' + (c.src ? '<p class="nsp-src">Source: ' + esc(c.src) + ', ' + doi(c.d) + '.</p>' : '');
    else h += '<p>' + c.rule + '</p><p class="nsp-src">Shown as <b>not verified</b> rather than guessed.</p>';
    if (sp.extra) h += '<p class="nsp-extra">' + sp.extra + '</p>';
    det.innerHTML = h;
    var slot = phone ? root.querySelector('[data-row="' + sp.id + '"] .nsp-slot') : null;
    (slot || root.querySelector('.nsp-side')).appendChild(det);
  }

  function groupWords(by) {
    var parts = COLS[by].groups.map(function (gp) {
      var rows = SP.filter(function (s) { return s[by].g === gp[0]; });
      return rows.length ? '<b>' + esc(gp[1]) + '</b>: ' + rows.map(function (s) { return esc(s.name.toLowerCase()); }).join(', ') : '';
    }).filter(Boolean);
    return 'Sorted by <b>' + esc(COLS[by].name.toLowerCase()) + '</b>. ' + parts.join('. ') + '.';
  }

  function build(host) {
    root = document.createElement('section');
    root.className = 'ws nsp'; root.setAttribute('aria-labelledby', 'nsp-t');
    root.innerHTML =
      '<header class="ws-hd">' +
        '<h3 class="ws-title" id="nsp-t">Nutrient strategies compared</h3>' +
        '<p data-ws-part="what"><b>What this is.</b> The crops and wild plants of this site side by side on three nutrient questions. <b>Mycorrhiza</b>: do fungi live in the roots and help bring in nutrients? <b>Iron uptake</b>: <b>Strategy I</b> plants pump acid out of the root and reduce iron at the root surface; <b>Strategy II</b> plants (the grasses) release iron grabbing molecules called phytosiderophores. <b>Carbon path</b>: C₃, C₄ or CAM photosynthesis, which changes how much nitrogen a leaf needs.</p>' +
        '<p data-ws-part="todo"><b>What to do.</b> Choose what to sort by. Press any cell to read what the paper shows. Cells marked <b>not verified</b> had no source checked for that plant.</p>' +
      '</header>' +
      '<div class="ws-pane nsp-ctl" role="group" aria-label="Controls"><div class="ws-c ws-choice"><span class="ws-c-l" id="nsp-byl">Sort by</span><div class="ws-seg nsp-seg" role="radiogroup" aria-labelledby="nsp-byl">' +
        COLK.map(function (k) { return '<button type="button" role="radio" data-by="' + k + '" aria-checked="false" tabindex="-1">' + esc(COLS[k].name) + '</button>'; }).join('') +
      '</div></div></div>' +
      '<div class="ws-pane ws-live nsp-livep" data-ws-part="happened"><p class="ws-k">What just happened</p><p class="ws-live-t nsp-live" aria-live="polite"></p></div>' +
      '<div class="nsp-wrap">' +
        '<div class="nsp-main" data-ws-part="thing">' +
          '<div class="nsp-head" aria-hidden="true"><span>Plant</span>' + COLK.map(function (k) { return '<span data-k="' + k + '">' + esc(COLS[k].name) + '<small>' + esc(COLS[k].short) + '</small></span>'; }).join('') + '</div>' +
          '<div class="nsp-body"></div>' +
        '</div>' +
        '<aside class="nsp-side ws-pane" aria-label="Evidence for the chosen cell"><p class="ws-k">The evidence</p><div class="nsp-det" aria-live="polite"></div></aside>' +
      '</div>' +
      '<figure class="ws-pane nsp-c4"><figcaption><b>No C₄ plant is on this site.</b> What C₄ would change for nitrogen, from one matched pair of weeds grown on the same nitrogen supplies:</figcaption>' + c4Svg() +
        '<p>At the same nitrogen supply, the C₃ <i>Chenopodium album</i> put 50 % more nitrogen into each unit of leaf area than the C₄ <i>Amaranthus retroflexus</i> ' + B('MEASURED', 'Sage and Pearcy 1987 I, abstract.') + ', and the C₄ leaf fixed more carbon for each unit of leaf nitrogen: a greater photosynthetic nitrogen use efficiency (Sage and Pearcy 1987 II). But at low nitrogen the C₃ plant grew better per unit of nitrogen, because the C₄ plant spread its nitrogen over too much leaf and lost leaf area to necrosis (Sage and Pearcy 1987 I). So C₄ saves nitrogen in the leaf, not always in the whole plant.</p>' +
        '<p class="nsp-src">Sage RF, Pearcy RW (1987) Plant Physiol 84: 954-958, ' + doi('10.1104/pp.84.3.954') + ', and 84: 959-963, ' + doi('10.1104/pp.84.3.959') + '.</p></figure>' +
      '<details class="ws-why" data-ws-part="why"><summary>Why does this happen?</summary><div class="ws-why-b">' + whyHtml() + '</div></details>';
    host.appendChild(root);

    var seg = root.querySelector('.nsp-seg');
    function paintSeg() { Array.prototype.forEach.call(seg.querySelectorAll('button'), function (b) { var on = b.getAttribute('data-by') === state.by; b.setAttribute('aria-checked', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1; }); }
    function setBy(k) { state.by = k; paintSeg(); render(); root.querySelector('.nsp-live').innerHTML = groupWords(k); }
    seg.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) setBy(b.getAttribute('data-by')); });
    seg.addEventListener('keydown', function (e) {
      var i = COLK.indexOf(state.by), j = -1;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % 3; else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i + 2) % 3;
      if (j < 0) return; e.preventDefault(); setBy(COLK[j]); seg.querySelector('[data-by="' + COLK[j] + '"]').focus();
    });
    root.querySelector('.nsp-body').addEventListener('click', function (e) {
      var b = e.target.closest('.nsp-cell'); if (!b) return;
      var p = [b.getAttribute('data-sp'), b.getAttribute('data-k')];
      state.pick = state.pick && state.pick[0] === p[0] && state.pick[1] === p[1] ? null : p;
      render();
      var nb = root.querySelector('.nsp-cell[data-sp="' + p[0] + '"][data-k="' + p[1] + '"]'); if (nb) nb.focus({ preventScroll: true });
      var sp = SP.filter(function (s) { return s.id === p[0]; })[0], c = sp[p[1]];
      root.querySelector('.nsp-live').innerHTML = state.pick ? ('You opened <b>' + esc(sp.name.toLowerCase()) + ', ' + esc(COLS[p[1]].name.toLowerCase()) + '</b>: ' + (c.v ? esc(c.v) + '. The evidence is ' + (window.matchMedia && matchMedia('(max-width: 699px)').matches ? 'just below the plant.' : 'on the right.') : 'not verified, so no answer is guessed.')) : 'Closed the evidence. ' + groupWords(state.by);
    });
    paintSeg(); render();
    root.querySelector('.nsp-live').innerHTML = groupWords(state.by);
  }

  /* a small original bar figure for the C3 and C4 pair: leaf N per area at the same supply (relative) */
  function c4Svg() {
    return '<svg class="nsp-c4s" width="480" height="128" style="width:480px;max-width:100%;height:auto" viewBox="0 0 360 96" role="img" aria-label="Leaf nitrogen per area at the same nitrogen supply: the C3 plant has 1.5 times the C4 plant">' +
      '<text x="4" y="30" class="nsp-t">C₃ Chenopodium</text><rect x="132" y="16" width="210" height="20" class="nsp-c3b"/><text x="337" y="31" text-anchor="end" class="nsp-tb">1.5</text>' +
      '<text x="4" y="64" class="nsp-t">C₄ Amaranthus</text><rect x="132" y="50" width="140" height="20" class="nsp-c4b"/><text x="267" y="65" text-anchor="end" class="nsp-tb">1</text>' +
      '<text x="4" y="90" class="nsp-s">leaf nitrogen per unit area at the same supply, C₄ = 1</text></svg>';
  }

  function whyHtml() {
    return '<p><b>Mycorrhiza.</b> Most crops here host <b>arbuscular</b> mycorrhizal fungi, which grow inside root cortex cells and reach into soil the root cannot. The fungus can deliver much of a plant\'s phosphorus even when the plant does not grow better: barley above is a measured case (48 %), and Smith, Smith and Jakobsen 2003 make the general point in their title, that mycorrhizal fungi can dominate phosphate supply to plants irrespective of growth responses (Plant Physiol 133: 16-20, ' + doi('10.1104/pp.103.024380') + '). Coast live oak hosts <b>ectomycorrhizal</b> fungi as well, a second kind of partner.</p>' +
      '<p><b>Iron.</b> Iron(III) gets far less soluble as the soil pH rises: for Fe³⁺ about 1000 fold less per pH unit, from the chemistry of iron(III) hydroxide ' + B('DERIVED', 'log activity of Fe3+ = log K minus 3 pH.') + '. Strategy I plants acidify the soil next to the root and reduce iron(III) to iron(II) at the root surface before taking it in; Strategy II plants, the grasses, release phytosiderophores that bind iron(III) and take up the whole complex. Römheld and Marschner 1986 noted that Strategy II is less inhibited by high pH, which matters on lime soils. The rule is for "most nongraminaceous species", so a plant that has not been tested is marked not verified here even when Strategy I is likely.</p>' +
      '<p><b>Carbon path and nitrogen.</b> In the matched pair above, the C₄ leaf fixed more carbon for each unit of its nitrogen, while the C₃ plant used nitrogen better for growth when nitrogen was scarce. CAM plants such as the desert agave take up CO₂ at night. Their nitrogen economics were not checked for this page.</p>' +
      '<p class="nt-refs">Each cell names its own source. "Not verified" means no paper on that plant was read for this page; it is not a claim that the answer is unknown to science.</p>';
  }

  var css = '\
.nsp .ws-hd p{max-width:64em}\
.nsp-ctl{margin:6px 0 10px}\
.nsp-livep{margin:0 0 10px}\
.nsp-wrap{display:grid;grid-template-columns:minmax(0,1fr) minmax(250px,.62fr);gap:12px;align-items:start}\
.nsp-side{position:sticky;top:calc(var(--nsp-top,0px) + 8px)}\
.nsp-head{display:grid;grid-template-columns:minmax(150px,1.1fr) repeat(3,minmax(0,1fr));gap:6px;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--ink2);padding:0 2px 4px;border-bottom:1px solid var(--rule)}\
.nsp-head span{display:flex;flex-direction:column}\
.nsp-head small{text-transform:none;letter-spacing:0;font-size:11.5px}\
.nsp-head .by{color:var(--ink);font-weight:700}\
.nsp-grp{margin:10px 0 4px}\
.nsp-gh{margin:0 0 4px;font-size:13px}\
.nsp-gh span{color:var(--ink2);margin-left:6px}\
.nsp-row{display:grid;grid-template-columns:minmax(150px,1.1fr) minmax(0,3fr);gap:6px;padding:6px 2px;border-top:1px solid var(--rule2)}\
.nsp-name{margin:0;font:600 14px var(--ui);display:flex;flex-direction:column}\
.nsp-name i{font-weight:400;color:var(--ink2)}\
.nsp-where{font-weight:400;font-size:12px;color:var(--ink2)}\
.nsp-cells{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}\
.nsp-slot{grid-column:1 / -1}\
.nsp-slot:empty{display:none}\
.nsp-cell{display:flex;flex-direction:column;align-items:flex-start;gap:2px;text-align:left;min-height:44px;padding:6px 8px;border:1px solid var(--rule2);border-radius:4px;background:var(--wall);color:var(--ink);font:500 13.5px var(--ui);cursor:pointer}\
.nsp-cell.by{border-color:var(--ink2);border-width:2px;padding:5px 7px}\
.nsp-cell[aria-pressed="true"]{outline:3px solid var(--accent);outline-offset:1px}\
.nsp-cell:focus-visible{outline:3px solid var(--accent);outline-offset:2px}\
.nsp-cell.nv{background:transparent;border-style:dashed;color:var(--ink2)}\
.nsp-ck{display:none;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--ink2)}\
.nsp-v{font-weight:600}\
.nsp-cell.nv .nsp-v{font-weight:500;font-style:italic}\
.nsp-b{font-size:11px}\
.nsp-nvb{color:var(--ink2)}\
.nsp-det h4{margin:0 0 6px;font:600 15px var(--ui)}\
.nsp-det p{margin:0 0 6px}\
.nsp-src,.nsp-hint{font-size:13px;color:var(--ink2)}\
.nsp-extra{font-size:13.5px;border-top:1px solid var(--rule2);padding-top:6px}\
.nsp-num{white-space:nowrap}\
.nsp-c4{margin:14px 0 0}\
.nsp-c4 p{margin:6px 0 0;max-width:62em}\
.nsp-c4s{display:block;width:100%;max-width:520px;height:auto;margin-top:6px}\
.ws .nsp-t{font-size:13px;fill:var(--ink)}\
.ws .nsp-tb{font-size:13px;font-weight:700;fill:var(--wall)}\
.ws .nsp-s{font-size:11px;fill:var(--ink2)}\
.nsp-c3b{fill:var(--leaf3)}.nsp-c4b{fill:var(--accent)}\
@media (max-width:699px){\
.nsp-wrap{grid-template-columns:minmax(0,1fr)}\
.nsp-head{display:none}\
.nsp-side{position:static}\
.nsp-row{grid-template-columns:minmax(0,1fr)}\
.nsp-cells{grid-template-columns:minmax(0,1fr) minmax(0,1fr) minmax(0,1fr);gap:4px}\
.nsp-cell{padding:5px 6px;font-size:12.5px}\
.nsp-ck{display:block;font-size:10px}\
.nsp-slot .nsp-det{border:1px solid var(--rule);border-radius:4px;background:var(--wall);padding:8px;margin-top:4px}\
}';
  if (!document.getElementById('nsp-css')) { var st = document.createElement('style'); st.id = 'nsp-css'; st.textContent = css; document.head.appendChild(st); }

  var onRs = null;
  N.register('species', {
    mount: function (host) {
      state = { by: 'myc', pick: null };
      build(host);
      onRs = function () { if (root) paintDetail(); };
      window.addEventListener('resize', onRs);
    },
    update: function () {},
    unmount: function () { if (onRs) window.removeEventListener('resize', onRs); onRs = null; root = null; }
  });
})();

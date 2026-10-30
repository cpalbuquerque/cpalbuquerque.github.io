// The Water Path: build search_index.json for the site search (search.js).
// Usage, from the site root:   node tools/build_search_index.js [port]
//   Serves the site on 127.0.0.1:<port> (default: any free port), opens every page and every plate,
//   journey plates in both WATER and NUTRIENT mode, with Playwright, and writes search_index.json at the site root.
//   Rebuild it after any content change: the index is a snapshot of what the pages render.
// Env: PLAYWRIGHT_CORE=<path to playwright-core> (default: the build_v14 tools_node copy), CHROME=<executable>.
// What it keeps: page, plate and stop titles; section, workstation and figure headings; How to measure folds;
// dotted glossary terms and short bold terms; the Symbols table; source citations (author, year, title).
// What it skips: quiz and Predict then check blocks (questions and answers), anything hidden or aria-hidden
// (tier 3 only material and the other mode's material stay out of that mode), and any entry with a course word.
'use strict';
const path = require('path'), fs = require('fs'), os = require('os'), http = require('http');
const ROOT = path.resolve(__dirname, '..');
let PORT = +(process.argv[2] || 0);   /* 0: any free port */
const PW = process.env.PLAYWRIGHT_CORE || path.join(os.homedir(), 'Claude/05_TEACHING/BIO332_Fall2026/Water_Path_site/build_v14/tools_node/node_modules/playwright-core');
const { chromium } = require(PW);
const EXE = process.env.CHROME || (() => {
  const b = path.join(os.homedir(), 'Library/Caches/ms-playwright');
  const c = fs.readdirSync(b).filter(d => d.startsWith('chromium-')).sort().pop();
  return path.join(b, c, 'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
})();
const OUT = path.join(ROOT, 'search_index.json');

/* ---- a small static server (Python's http.server drops connections under Playwright) ---- */
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json', '.webp': 'image/webp', '.woff2': 'font/woff2' };
function serve() {
  return new Promise(res => {
    const s = http.createServer((q, r) => {
      let u = decodeURIComponent(q.url.split('?')[0]); if (u.endsWith('/')) u += 'index.html';
      const f = path.join(ROOT, u);
      if (!f.startsWith(ROOT)) { r.writeHead(403); return r.end(); }
      fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); r.end(d); });
    }).listen(PORT, '127.0.0.1', () => { PORT = s.address().port; res(s); });
  });
}

/* ---- what to visit ---- */
const INDEX_ROUTES = ['map', 'anatomy', 'turgor', 'growth', 'demand', 'embolism', 'fail', 'leaf', 'field', 'quiz', 'symbols', 'feedback', 'sources'];
const TITLE_ONLY = { quiz: 1, feedback: 1 };
const JOURNEY = ['field', 'plant', 'organ', 'tissue', 'membrane', 'species', 'afternoon', 'library'];
const LIGHT = ['sun', 'leaf', 'thylakoid', 'stroma', 'tradeoff', 'c3c4cam'];
const PHLOEM = ['source', 'sieve', 'xylem', 'sinks', 'stress'];
const CURIOUS = ['index', 'resurrection', 'aerenchyma'];   /* curious/<page>.html, one page per plate */
const GROUPS = { m: 'The map and its stops', r: 'Symbols and sources', t: 'Turgor module', j: 'Water journey', n: 'Nutrient journey', l: 'Light to sugar', p: 'Sugar on the move', c: 'Curious things' };

/* Course and term words never ship in visible text; an entry that carries one is dropped. */
const COURSE = /\b(bio|332|csumb|class|classes|course|courses|semester|lecture|lectures|student|students|week|weeks|due|canvas)\b/i;

/* ---- runs inside the page: harvest one visible region ---- */
function harvest(opt) {
  var root = document.querySelector(opt.root); if (!root) return { items: [], where: '' };
  var SKIP = '.jq,.lx-quiz,.lx-qs,.qz,.ptc,.ans,.reveal,[class*="quiz"],[id*="quiz"],[id^="qz"],#qzRound,script,style,noscript,textarea,select,option,button,svg,canvas,[aria-hidden="true"],#wp-search-dlg,#wp-search-tab,#wp-fb-tab,.wp-next,nav.pager,.crumb';
  var GENERIC = /^(know it|use it|question it|predict,? then check\.?|check yourself|can you use it,? or only say it\??|why does this happen\??|what this is\.?|what to do\.?|the thing itself\.?|what just happened\.?|real cases to think with|what we know,? and how|sources for this plate.*|test yourself.*|how this works|next|previous|more|show|hide|step|play|pause|reset|back to the water path|check it\b.*|go deeper\b.*|read further\b.*)$/i;
  var TAGS = /\s*\b(MEASURED|DERIVED|SECONDARY|ILLUSTRATIVE|OPEN QUESTION|OPEN|PREPRINT|CONTESTED|MODEL)\b\s*$/;
  /* a fold that asks for a prediction holds its answer: leave it out whole */
  SKIP += ',[data-wps-skip]';
  Array.prototype.forEach.call(root.querySelectorAll('details'), function (d) { var sm = d.querySelector('summary');
    if (sm && /^\s*(predict|check yourself|test yourself|answer|show the answer|reveal)/i.test(sm.textContent)) d.setAttribute('data-wps-skip', ''); });
  /* open every closed fold so its content can be read; closed again at the end */
  var opened = [];
  Array.prototype.forEach.call(root.querySelectorAll('details:not([open])'), function (d) { if (!d.closest(SKIP)) { d.open = true; opened.push(d); } });
  function vis(e) { return !!(e.getClientRects().length) && getComputedStyle(e).visibility !== 'hidden'; }
  function inFold(e) { for (var i = 0; i < opened.length; i++) if (opened[i] !== e && opened[i].contains(e) && !opened[i].querySelector('summary').contains(e)) return true; return false; }
  /* text with a space at block and inline-block boundaries, none inside CO<sub>2</sub> */
  function txt(e) {
    var out = '';
    (function walk(n) {
      if (n.nodeType === 3) { out += n.nodeValue; return; }
      if (n.nodeType !== 1) return;
      if (n.matches && n.matches('script,style,svg,button,.badge,.jb,.tag,.chev,.wpev,.ev,[aria-hidden="true"]')) return;
      var d = getComputedStyle(n).display, sp = d !== 'inline' && d !== 'contents';
      if (sp) out += ' ';
      for (var c = n.firstChild; c; c = c.nextSibling) walk(c);
      if (sp) out += ' ';
    })(e);
    return out.replace(/\s+/g, ' ').trim();
  }
  function clean(s) { return s.replace(TAGS, '').replace(TAGS, '').replace(/\s*[▾▸►▼]\s*/g, ' ').replace(/\s+/g, ' ').trim(); }
  function cut(s, n) { s = s.replace(/\s+/g, ' ').trim(); if (s.length <= n) return s; var c = s.slice(0, n); var k = c.lastIndexOf(' '); return (k > n * 0.6 ? c.slice(0, k) : c).replace(/[,;:.\s]+$/, '') + '…'; }
  /* an id that jumps here: the element's own, or the first heading of an id'd box */
  function anchorOf(e) {
    if (e.id) return e.id;
    var p = e.parentElement;
    for (var depth = 0; p && p !== root && depth < 4; depth++, p = p.parentElement) {
      if (p.id) { var first = p.querySelector('h1,h2,h3,h4,h5'); if (first === e) return p.id; return null; }
    }
    return null;
  }
  function nextText(h) {
    /* the first paragraph after a heading, searching forward in document order inside the region */
    var tw = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, null); tw.currentNode = h; var n = 0, el;
    while ((el = tw.nextNode()) && n < 60) { n++;
      if (h.contains(el)) continue;
      if (/^H[1-4]$/.test(el.tagName)) break;
      if (el.closest(SKIP)) continue;
      if (/^(P|LI|FIGCAPTION|DD)$/.test(el.tagName) && vis(el)) { var t = txt(el); if (t.length > 30) return t; }
    }
    return '';
  }
  var items = [], seen = {}, where = '', bcount = 0;
  function around(p, term, n) { var i = p.toLowerCase().indexOf(term.toLowerCase()); if (i < 0 || p.length <= n) return cut(p, n);
    var a = Math.max(0, i - Math.round(n * 0.35)); if (a > 0) { var sp = p.indexOf(' ', a); a = sp > 0 && sp < i ? sp + 1 : a; }
    return (a > 0 ? '…' : '') + cut(p.slice(a), n); }
  var h2 = Array.prototype.filter.call(root.querySelectorAll(opt.whereSel || 'h2.level-no'), vis)[0];
  where = opt.where || (h2 ? txt(h2) : '');
  function add(o) { var key = o.k + '|' + o.t.toLowerCase(); if (seen[key]) return; seen[key] = 1; items.push(o); }
  /* section text bag: every visible word, credited to the heading above it */
  var heads = [], bag = {}, cur = '_page';
  var all = root.querySelectorAll('h1,h2,h3,h4,summary,dfn,b,strong,li');
  Array.prototype.forEach.call(all, function (e) {
    if (e.closest(SKIP) || !vis(e)) return;
    var tg = e.tagName, t;
    if (/^H[1-4]$/.test(tg) || tg === 'SUMMARY') {
      t = clean(txt(e)); if (!t || t.length < 3 || GENERIC.test(t) || t.length > 140) return;
      if (tg === 'H2' && e.classList.contains('level-no')) return;      /* the plate title, added once below */
      if (tg === 'H1' && opt.noH1) return;
      if (tg === 'SUMMARY' && !/^how to measure/i.test(t) && !e.closest('figure') && t.length < 6) return;
      if (tg === 'SUMMARY' && /^sources/i.test(t)) return;
      add({ k: tg === 'SUMMARY' ? 'f' : 'h', t: t, s: cut(nextText(e) || '', 90), id: anchorOf(e), fold: inFold(e), lvl: tg === 'SUMMARY' ? 5 : +tg[1] });
    } else if (tg === 'DFN') {
      t = clean(txt(e)); if (!t) return;
      var par = e.closest('p,li,dd,td,figcaption'); add({ k: 'd', t: t, s: par ? around(txt(par), t, 90) : '', id: null, fold: inFold(e), lvl: 9 });
    } else if (tg === 'B' || tg === 'STRONG') {
      t = clean(txt(e)); if (!t || t.length < 3 || t.length > 40 || /[.:!?;]/.test(t) || GENERIC.test(t) || t.split(' ').length > 4 || !/[A-Za-zΑ-ω]{3}/.test(t) || /^[\d.,−+\s%]/.test(t) || bcount >= 30) return;
      if (/^(Water|Nutrient|Light|Sugar) [IVX]+$/.test(t) || e.closest('.jplates,.trip-links,.tripstrip')) return;
      var par2 = e.closest('p,li,dd,td,figcaption'); if (!par2) return;
      bcount++;
      add({ k: 'b', t: t, s: around(txt(par2), t, 90), id: null, fold: inFold(e), lvl: 9 });
    } else if (tg === 'LI') {
      var list = e.closest('ol.srcs,ul.srcs,.lx-plsrc,.srcs,[id$="srclist"]');
      if (!list) return;
      t = txt(e);
      var doi = (/10\.\d{4,9}\/[^\s"<>]+/.exec(t) || [''])[0].replace(/[.,;]$/, '').toLowerCase();
      var body = t.replace(/doi:\s*\S+/ig, '').replace(/https?:\/\/\S+/g, '').replace(/\s+\./g, '.').replace(/\s+/g, ' ').trim();
      var au, yr, rest, m = /^(.{2,400}?)\s*\((\d{4}[a-z]?)\)[.,:]?\s*(.*)$/.exec(body);
      if (m) { au = m[1]; yr = m[2]; rest = m[3]; }
      else { m = /^(.{2,400}?)[\s,]+((?:1[89]|20)\d\d[a-z]?)\b[,.:]?\s*(.*)$/.exec(body); if (!m) return; au = m[1]; yr = m[2]; rest = m[3]; }
      var claim = '', parts = au.split(/:\s+|\.\s+(?=[A-ZÀ-Ý][a-zà-ÿ])/); if (parts.length > 1) { au = parts.pop(); claim = au && parts.join('. ').trim(); }
      if (au.lastIndexOf('(') >= 0) { claim = (claim ? claim + '. ' : '') + au.slice(0, au.lastIndexOf('(')).trim(); au = au.slice(au.lastIndexOf('(') + 1); }
      au = au.replace(/^as reviewed in\s+/i, '').replace(/^.*\bafter\s+(?=[A-Z])/, '').replace(/^.*\bfor\s+(?=[A-Z][a-zà-ÿ]+ [A-Z][a-zà-ÿ]+ \d)/, '').replace(/[,.\s]+$/, '');
      if (claim) rest = claim.replace(/[.\s]+$/, '') + '. ' + rest;
      var names = au.split(/,\s*|\s+&\s+|\s+and\s+/).map(function (x) { return x.replace(/\s+et al\.?$/i, '').split(/\s+/).filter(function (w) { return !/^[A-Z]{1,3}\.?(-[A-Z]\.?)?$/.test(w); }).join(' ').trim(); }).filter(function (x) { return x && !/^et al\.?$/i.test(x); });
      var short = !names.length ? au : names.length === 1 ? names[0] + (/et al/i.test(au) ? ' et al.' : '') : names.length === 2 && !/et al/i.test(au) ? names[0] + ' & ' + names[1] : names[0] + ' et al.';
      add({ k: 's', t: short + ' ' + yr, s: cut(rest.replace(/^[).,:\s]+/, '').replace(/\bdoi:?\s*10\.\S+/ig, '').trim(), 96), id: e.id || null, fold: inFold(e), lvl: 9, doi: doi, key: t.slice(0, 40), au: names.join(' ') });
    }
  });
  /* words per section, in document order */
  var tw2 = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), node, hset = new Set(items.filter(function (i) { return i.k === 'h' || i.k === 'f'; }).map(function (i) { return i.t; }));
  var lastHeadText = '_page';
  while ((node = tw2.nextNode())) {
    var pe = node.parentElement; if (!pe || pe.closest(SKIP)) continue;
    var hd = pe.closest('h1,h2,h3,h4,summary');
    if (hd) { var ht = clean(txt(hd)); if (hset.has(ht)) lastHeadText = ht; continue; }
    if (!vis(pe)) continue;
    (bag[lastHeadText] = bag[lastHeadText] || []).push(node.nodeValue);
  }
  items.forEach(function (i) { if ((i.k === 'h' || i.k === 'f') && bag[i.t]) i.bag = bag[i.t].join(' ').slice(0, 6000); });
  var pageBag = (bag._page || []).join(' ').slice(0, 4000);
  var intro = ''; var ps = root.querySelectorAll('p'); for (var q = 0; q < ps.length && q < 12; q++) { if (ps[q].closest(SKIP) || !vis(ps[q])) continue; var tq = txt(ps[q]); if (tq.length > 40) { intro = tq; break; } }
  opened.forEach(function (d) { d.open = false; });
  Array.prototype.forEach.call(root.querySelectorAll('[data-wps-skip]'), function (d) { d.removeAttribute('data-wps-skip'); });
  return { items: items, where: where, intro: cut(intro, 160), pageBag: pageBag };
}

/* ---- normalisation shared with search.js (keep the two copies identical) ---- */
var GREEK = { 'α': 'alpha', 'β': 'beta', 'γ': 'gamma', 'δ': 'delta', 'ε': 'epsilon', 'ζ': 'zeta', 'η': 'eta', 'θ': 'theta', 'κ': 'kappa', 'λ': 'lambda', 'μ': 'mu', 'ν': 'nu', 'ξ': 'xi', 'π': 'pi', 'ρ': 'rho', 'σ': 'sigma', 'ς': 'sigma', 'τ': 'tau', 'φ': 'phi', 'χ': 'chi', 'ψ': 'psi', 'ω': 'omega' };
function norm(s) {
  s = String(s || '').normalize('NFKD').toLowerCase().replace(/[̀-ͯ]/g, '');
  s = s.replace(/[α-ω]/g, function (c) { return ' ' + (GREEK[c] || c) + ' '; });
  return s.replace(/[^a-z0-9]+/g, ' ').trim();
}
const STOP = new Set(('the a an and or of to in on at by for from with without into onto over under than then that this these those it its is are was were be been being as not no but if so do does did can could will would should may might must has have had also more most less least very much many some any each every all one two three four five six seven eight nine ten which who whom what when where why how there here they them their you your we our us he she his her i me my about after before between through during while because only just same other such out up down off again further once both few own too s t per vs via e g ie eg et al').split(' '));

function cutN(s, n) { s = String(s || '').replace(/\s+/g, ' ').trim(); if (s.length <= n) return s; const c = s.slice(0, n), k = c.lastIndexOf(' '); return (k > n * 0.6 ? c.slice(0, k) : c).replace(/[,;:.\s…]+$/, '') + '…'; }
/* the URL of an entry (identical copy in search.js) */
function urlOf(base, a) {
  if (!a) return base;
  var c = a.charAt(0), v = a.slice(1), i = base.indexOf('#'), pre = i < 0 ? base : base.slice(0, i), h = i < 0 ? '' : base.slice(i);
  if (c === '/') return base + '/' + v;
  if (c === '@' && h.indexOf('#/') === 0) return base + '#' + v;
  return pre + (pre.indexOf('?') < 0 ? '?' : '&') + (c === '@' ? 'at=' : 'find=') + encodeURIComponent(v) + h;
}
function dashFree(s) { return String(s || '').replace(/\s+[–—]\s+/g, ', ').replace(/[–—]/g, ' to ').replace(/\s-\s/g, ', '); }

(async () => {
  const server = await serve();
  const browser = await chromium.launch({ executablePath: EXE, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  const base = `http://127.0.0.1:${PORT}/`;
  const raw = [];   /* {g, url, page, plate, where, res} */
  async function load(u) { await page.goto(base + u, { waitUntil: 'load' }); await page.waitForTimeout(2500); }
  async function hash(h, wait) { await page.evaluate(h => { location.hash = h; }, h); await page.waitForTimeout(wait || 1500); await page.evaluate(() => window.scrollTo(0, 0)); }

  /* the map and its stops */
  await load('index.html#/map');
  for (const r of INDEX_ROUTES) {
    await hash('#/' + r, 900);
    const res = await page.evaluate(harvest, { root: 'section.route.on', whereSel: 'p.eyebrow', noH1: true });
    const meta = await page.evaluate(() => { const s = document.querySelector('section.route.on'); const h1 = s.querySelector('h1'); const eb = s.querySelector('p.eyebrow');
      return { title: s.getAttribute('data-title'), h1: h1 ? h1.textContent.trim() : '', eb: eb ? eb.textContent.trim() : '', dek: (s.querySelector('p.dek') || {}).textContent || '' }; });
    if (TITLE_ONLY[r]) res.items = [];
    if (r === 'symbols') res.items = res.items.filter(i => i.k !== 'b');
    raw.push({ g: r === 'symbols' || r === 'sources' ? 'r' : 'm', site: 'index', route: r, meta, res });
  }
  /* symbols table rows */
  const syms = await page.evaluate(() => Array.prototype.map.call(document.querySelectorAll('#symtable tbody tr'), tr => {
    const c = tr.querySelectorAll('td'); return { id: tr.id, s: c[0].textContent.trim(), n: c[1].textContent.trim(), u: c[2].textContent.trim(), d: c[3].textContent.trim() }; }));

  /* turgor module */
  await load('turgor.html');
  raw.push({ g: 't', site: 'turgor', res: await page.evaluate(harvest, { root: 'body', where: 'Turgor module', noH1: true }), meta: await page.evaluate(() => ({ title: document.title, h1: (document.querySelector('h1') || {}).textContent || '' })) });

  /* journey, both cargos */
  for (const cargo of ['water', 'nutrient']) {
    await load('journey/index.html' + (cargo === 'nutrient' ? '?cargo=nutrient' : '') + '#field');
    for (const h of JOURNEY) {
      await hash('#' + h, 1800);
      const res = await page.evaluate(harvest, { root: '#wp-stage' });
      if (h === 'library') res.items = [];
      raw.push({ g: cargo === 'nutrient' ? 'n' : 'j', site: 'journey', plate: h, cargo, res });
    }
  }
  /* light and phloem */
  for (const [dir, list, g] of [['light', LIGHT, 'l'], ['phloem', PHLOEM, 'p']]) {
    await load(dir + '/index.html#' + list[0]);
    for (const h of list) { await hash('#' + h, 1600); raw.push({ g, site: dir, plate: h, res: await page.evaluate(harvest, { root: '#wp-stage' }) }); }
  }
  /* curious things: one page per plate */
  for (const pg of CURIOUS) {
    await load('curious/' + pg + '.html');
    raw.push({ g: 'c', site: 'curious', page: pg, res: await page.evaluate(harvest, { root: '#cq-main', whereSel: '#cq-main h2' }) });
  }
  await browser.close(); server.close();

  /* ---- assemble entries ---- */
  const entries = [], dropped = [], seenSrc = {}, seenKey = {}; let trimmed = 0;
  function urlFor(R, it) {
    const id = it && it.id, fk = it && !id ? norm(it.key || it.t).replace(/ /g, '').slice(0, 28) : '';
    const findQ = (q0) => (id ? 'at=' + encodeURIComponent(id) : fk ? 'find=' + encodeURIComponent(fk) : '');
    if (R.site === 'index') {
      if (id && /^fig-/.test(id)) { const m = new RegExp('^fig-' + R.route + '-(.+)$').exec(id); if (m) return 'index.html#/' + R.route + '/' + m[1]; }
      if (id) return 'index.html#/' + R.route + '#' + id;
      return 'index.html' + (fk ? '?find=' + encodeURIComponent(fk) : '') + '#/' + R.route;
    }
    if (R.site === 'turgor') { const q = it ? findQ() : ''; return 'turgor.html' + (q ? '?' + q : ''); }
    if (R.site === 'curious') { const q = it ? findQ() : ''; return 'curious/' + R.page + '.html' + (q ? '?' + q : ''); }
    const q = [R.cargo === 'nutrient' ? 'cargo=nutrient' : '', it ? findQ() : ''].filter(Boolean).join('&');
    return R.site + '/index.html' + (q ? '?' + q : '') + '#' + R.plate;
  }
  function push(e, R) {
    e.t = dashFree(e.t); e.s = dashFree(e.s); e.w = dashFree(e.w);
    if (COURSE.test(e.t + ' ' + e.w)) { dropped.push(e.t); return; }
    if (e.s && COURSE.test(e.s)) {   /* keep the entry, drop the sentence that carries the word */
      e.s = (e.s.match(/[^.!?]+[.!?…]*\s*/g) || []).filter(x => !COURSE.test(x)).join('').trim(); trimmed++; }
    if (e.bag) e.bag = e.bag.replace(new RegExp(COURSE.source, 'gi'), ' ');
    /* nutrient copies of water material: keep the water one */
    const dk = (R.site === 'journey' ? 'journey|' + R.plate : e.u.split('?')[0].split('#')[0] + '|' + (R.route || R.plate || '')) + '|' + e.k + '|' + e.t.toLowerCase();
    if (seenKey[dk]) return; seenKey[dk] = 1;
    entries.push(e);
  }
  for (const R of raw) {
    const res = R.res;
    let where;
    if (R.site === 'index') where = R.meta.eb && /^(Stop|Enrichment)/.test(R.meta.eb) ? R.meta.eb : R.meta.title;
    else if (R.site === 'turgor') where = 'Turgor module';
    else where = res.where || R.plate;
    /* the page or plate itself */
    const ptitle = R.site === 'index' ? (R.route === 'map' ? 'The Water Path map' : R.meta.title) : R.site === 'turgor' ? (R.meta.h1 || 'Turgor through a Salinas day').trim() : where;
    const pw = R.site === 'index' ? (R.route === 'map' || R.g === 'r' ? 'The map' : where) : R.site === 'journey' ? (R.cargo === 'nutrient' ? 'Journey, nutrient mode' : 'Journey, water mode') : R.site === 'light' ? 'Light to sugar' : R.site === 'phloem' ? 'Sugar on the move' : R.site === 'curious' ? 'Curious things' : 'Turgor module';
    push({ k: 'p', g: R.g, t: ptitle, w: pw, u: urlFor(R, null), s: cutN(R.meta && R.meta.dek ? R.meta.dek : res.intro, 120), bag: res.pageBag + ' ' + (R.meta ? R.meta.h1 : '') }, R);
    for (const it of res.items) {
      if (it.k === 's') { const sk = it.doi || norm(it.t); if (seenSrc[sk]) continue; seenSrc[sk] = 1; }
      push({ k: it.k, g: it.k === 's' ? 'r' : R.g, t: it.t, w: it.k === 's' ? (R.site === 'index' ? 'Sources' : 'Sources, ' + where) : where, u: urlFor(R, it), s: it.s, bag: it.k === 's' ? it.au : (it.bag || ''), fold: it.fold }, R);
    }
  }
  for (const y of syms) push({ k: 'y', g: 'r', t: y.s + ', ' + y.n, w: 'Symbols', u: 'index.html#/symbols#' + y.id, s: (y.u ? y.u + '. ' : '') + y.d, bag: '' }, { site: 'index', route: 'symbols' });

  /* keywords: the distinctive words of each section, not already in its title or snippet */
  /* ranked by tf idf: a word said often in this section and rarely elsewhere */
  const df = new Map();
  const toks = entries.map(e => { const tf = new Map(); norm(e.bag || '').split(' ').filter(w => (w.length >= 4 || (e.k === 's' && w.length >= 2)) && !STOP.has(w) && !/^\d+$/.test(w)).forEach(w => tf.set(w, (tf.get(w) || 0) + 1)); tf.forEach((v, w) => df.set(w, (df.get(w) || 0) + 1)); return tf; });
  const N = entries.length;
  entries.forEach((e, i) => {
    const own = new Set(norm(e.t + ' ' + e.s).split(' ')), tf = toks[i], wt = w => (1 + Math.log(tf.get(w))) * Math.log(N / df.get(w));
    let ks = [...tf.keys()].filter(w => !own.has(w) && (e.k === 's' || df.get(w) <= N * 0.08));
    ks.sort((a, b) => wt(b) - wt(a));
    ks = ks.slice(0, e.k === 'p' ? 24 : e.k === 's' ? 8 : 12);
    if (ks.length) e.x = ks.join(' ');
    delete e.bag; if (!e.fold) delete e.fold; else e.fold = 1;
  });
  /* compact form: places [group, where, base URL] and entries [kind, place, title, anchor, snippet, keywords].
     anchor: '' the place itself, '/slug' a map figure, '@id' an element id, '~key' a heading or term found by its text.
     search.js rebuilds the URL with urlOf(); the same function checks every URL here. */
  const places = [], pidx = {};
  const rows = entries.map(e => {
    let m, base, a = '';
    if ((m = /^(index\.html)\?find=([^#]*)(#\/[a-z]+)$/.exec(e.u))) { base = m[1] + m[3]; a = '~' + decodeURIComponent(m[2]); }
    else if ((m = /^(index\.html#\/[a-z]+)\/([a-z0-9-]+)$/.exec(e.u))) { base = m[1]; a = '/' + m[2]; }
    else if ((m = /^(index\.html#\/[a-z]+)#(.+)$/.exec(e.u))) { base = m[1]; a = '@' + m[2]; }
    else if ((m = /^([^?#]+)(?:\?([^#]*))?(#.*)?$/.exec(e.u))) {
      const qs = (m[2] || '').split('&').filter(Boolean), keep = [];
      qs.forEach(kv => { const [k, v] = kv.split('='); if (k === 'at') a = '@' + decodeURIComponent(v); else if (k === 'find') a = '~' + decodeURIComponent(v); else keep.push(kv); });
      base = m[1] + (keep.length ? '?' + keep.join('&') : '') + (m[3] || '');
    }
    if (urlOf(base, a) !== e.u) throw new Error('url round trip failed: ' + e.u + ' -> ' + urlOf(base, a));
    const pk = e.g + '|' + e.w + '|' + base;
    if (!(pk in pidx)) { pidx[pk] = places.length; places.push([e.g, e.w, base]); }
    const r = [e.k, pidx[pk], e.t, a, e.s || '', e.x || ''];
    while (r.length > 3 && !r[r.length - 1]) r.pop();
    return r;
  });
  const out = { v: 2, built: new Date().toISOString().slice(0, 10), groups: GROUPS, places, e: rows };
  const json = JSON.stringify(out);
  fs.writeFileSync(OUT, json);
  const byG = {}; entries.forEach(e => { byG[e.g] = (byG[e.g] || 0) + 1; });
  console.log(`search_index.json: ${rows.length} entries, ${places.length} places, ${(json.length / 1024).toFixed(1)} KB`, byG);
  if (dropped.length) console.log('dropped for course words:', dropped.length, dropped.slice(0, 20));
  if (trimmed) console.log('snippets trimmed of a course word sentence:', trimmed);
  if (errs.length) console.log('page errors while harvesting:', errs.slice(0, 10));
})().catch(e => { console.error(e); process.exit(1); });

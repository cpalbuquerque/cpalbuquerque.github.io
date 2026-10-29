/* The Water Path: one Search tab on every page (map, Journey, Light to Sugar, Sugar on the move, Turgor).
   Press "/" anywhere, or the Search tab above Feedback. Everything runs in this browser: the index
   (search_index.json, next to this script) is fetched once, on first open; nothing is sent anywhere and
   nothing is stored. Rebuild the index after any content change: node tools/build_search_index.js
   A result opens its page; ?at=<id> or ?find=<text key> in its URL tells this script what to scroll to. */
(function () {
  'use strict';
  if (window.WPSearch) return;
  var me = document.currentScript && document.currentScript.src;
  var BASE = me ? new URL('.', me).href : new URL('.', location.href).href;
  var INDEX_URL = new URL('search_index.json', BASE).href;

  /* inside a page of this site that already has search (turgor.html in the map's frame): no second tab */
  var framed = false;
  try { framed = window.self !== window.top && !!window.parent.document.querySelector('script[src*="search.js"]'); } catch (e) { framed = false; }

  /* ---- normalisation shared with tools/build_search_index.js (keep the two copies identical) ---- */
  var GREEK = { 'α': 'alpha', 'β': 'beta', 'γ': 'gamma', 'δ': 'delta', 'ε': 'epsilon', 'ζ': 'zeta', 'η': 'eta', 'θ': 'theta', 'κ': 'kappa', 'λ': 'lambda', 'μ': 'mu', 'ν': 'nu', 'ξ': 'xi', 'π': 'pi', 'ρ': 'rho', 'σ': 'sigma', 'ς': 'sigma', 'τ': 'tau', 'φ': 'phi', 'χ': 'chi', 'ψ': 'psi', 'ω': 'omega' };
  function norm(s) {
    s = String(s || '').normalize('NFKD').toLowerCase().replace(/[̀-ͯ]/g, '');
    s = s.replace(/[α-ω]/g, function (c) { return ' ' + (GREEK[c] || c) + ' '; });
    return s.replace(/[^a-z0-9]+/g, ' ').trim();
  }
  /* the URL of an entry (identical copy in tools/build_search_index.js) */
  function urlOf(base, a) {
    if (!a) return base;
    var c = a.charAt(0), v = a.slice(1), i = base.indexOf('#'), pre = i < 0 ? base : base.slice(0, i), h = i < 0 ? '' : base.slice(i);
    if (c === '/') return base + '/' + v;
    if (c === '@' && h.indexOf('#/') === 0) return base + '#' + v;
    return pre + (pre.indexOf('?') < 0 ? '?' : '&') + (c === '@' ? 'at=' : 'find=') + encodeURIComponent(v) + h;
  }
  function esc(s) { return String(s || '').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function reduced() { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }

  /* ---- the index ---- */
  var IDX = null, LOADING = null;
  function toks(s) { var t = norm(s); return t ? t.split(' ') : []; }
  function load() {
    if (IDX || LOADING) return LOADING;
    LOADING = fetch(INDEX_URL, { credentials: 'same-origin' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (j) {
      var P = j.places;
      IDX = { groups: j.groups, e: j.e.map(function (r, i) {
        var pl = P[r[1]] || ['m', '', 'index.html'];
        return { i: i, k: r[0], g: pl[0], w: pl[1], u: new URL(urlOf(pl[2], r[3] || ''), BASE).href, t: r[2], s: r[4] || '',
          tt: toks(r[2]), nt: norm(r[2]), wt: toks(pl[1]), st: toks(r[4] || ''), xt: toks(r[5] || ''), ot: toks((r[4] || '') + ' ' + (r[5] || '')) };
      }) };
      return IDX;
    });
    return LOADING;
  }

  /* bounded edit distance (adjacent swaps count as one) */
  function near(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return false;
    var prev2 = null, prev = [], cur, i, j;
    for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) {
      cur = [i]; var lo = i;
      for (j = 1; j <= b.length; j++) {
        var c = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
        var v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + c);
        if (prev2 && i > 1 && j > 1 && a.charAt(i - 1) === b.charAt(j - 2) && a.charAt(i - 2) === b.charAt(j - 1)) v = Math.min(v, prev2[j - 2] + 1);
        cur[j] = v; if (v < lo) lo = v;
      }
      if (lo > max) return false;
      prev2 = prev; prev = cur;
    }
    return prev[b.length] <= max;
  }
  var KW = { p: 6, h: 2, f: 1, y: 2, d: 1, b: 1, s: 0 };
  function tokScore(q, list, ex, pre, sub) {
    var best = 0;
    for (var i = 0; i < list.length; i++) {
      var t = list[i];
      if (t === q) return ex;
      if (q.length >= 2 && t.indexOf(q) === 0) best = Math.max(best, pre - Math.min(2, (t.length - q.length) * 0.15));
      else if (sub && q.length >= 4 && t.indexOf(q) > 0) best = Math.max(best, sub);
    }
    return best;
  }
  /* section keywords come most central first: an early one counts more */
  function kwScore(q, xt) {
    for (var i = 0; i < xt.length; i++) {
      var t = xt[i], f = 1 - 0.5 * i / Math.max(1, xt.length);
      if (t === q) return 3 * f;
      if (q.length >= 3 && t.indexOf(q) === 0) return 2 * f;
    }
    return 0;
  }
  function typoScore(q, list, v) {
    var max = q.length >= 8 ? 2 : q.length >= 4 ? 1 : 0; if (!max) return 0;
    for (var i = 0; i < list.length; i++) if (list[i].length >= 3 && near(q, list[i], max)) return v;
    return 0;
  }
  function rank(query) {
    if (!IDX) return [];
    var qp = norm(query), qs = qp ? qp.split(' ') : [];
    if (!qs.length) return [];
    var out = [];
    IDX.e.forEach(function (e) {
      var total = 0, inTitle = false;
      for (var n = 0; n < qs.length; n++) {
        var q = qs[n], b;
        if (q.length === 1) { b = e.tt.indexOf(q) >= 0 ? 8 : e.ot.indexOf(q) >= 0 ? 2 : 0; }
        else {
          b = tokScore(q, e.tt, 10, 7, 4); if (b) inTitle = true;
          if (b < 7) b = Math.max(b, tokScore(q, e.wt, 4, 3, 0));
          if (b < 4) b = Math.max(b, tokScore(q, e.st, 3, 2, 0));
          if (b < 3) b = Math.max(b, kwScore(q, e.xt));
          if (!b) b = typoScore(q, e.tt, 5) || typoScore(q, e.ot, 1.5);
        }
        if (!b) return;
        total += b;
      }
      /* a whole title match counts most for pages, sections, symbols and sources; a lone bold word is a weaker place to land */
      var term = e.k === 'd' || e.k === 'b';
      if (e.nt === qp) total += term ? 3 : 12; else if (e.nt.indexOf(qp) === 0) total += term ? 2 : 6; else if ((' ' + e.nt + ' ').indexOf(' ' + qp) >= 0) total += term ? 1 : 3;
      if (inTitle) total += KW[e.k] || 0;
      if (inTitle) total += 2 / (1 + e.tt.length / 4);
      out.push({ e: e, sc: total });
    });
    out.sort(function (a, b) { return b.sc - a.sc || a.e.i - b.e.i; });
    return out;
  }
  /* best first, grouped by part of the site; groups ordered by their best result */
  function grouped(list) {
    var top = list.slice(0, 60), gs = {}, order = [], shown = 0;
    var twins = {};
    top.forEach(function (r) {
      var g = r.e.g, term = r.e.k === 'd' || r.e.k === 'b';
      if (term) { var tk = g + '|' + r.e.nt; if (twins[tk]) return; twins[tk] = 1; }   /* the same term on three plates: show its best one */
      if (!gs[g]) { gs[g] = []; order.push(g); } if (gs[g].length < 8) gs[g].push(r);
    });
    var res = [];
    order.forEach(function (g) { var rows = gs[g].filter(function () { return shown++ < 30; }); if (rows.length) res.push({ g: g, label: IDX.groups[g] || g, rows: rows }); });
    return res;
  }

  /* ---- jumping to a result inside a page ---- */
  function compact(s) { return norm(s).replace(/ /g, ''); }
  function foldOf(el) {
    for (var p = el.parentElement; p; p = p.parentElement) {
      if (p.tagName === 'DETAILS' && !p.open) { var sm = p.querySelector('summary'); if (!sm || !sm.contains(el)) return p; }
    }
    return null;
  }
  function reachable(el) {
    if (!el) return false;
    if (el.getClientRects().length) return true;
    var d = foldOf(el); if (!d) return false;
    var x = d; while (x) { if (!x.getClientRects().length && !foldOf(x)) return false; x = foldOf(x) || null; if (x && x.getClientRects().length) return true; }
    return !!d.getClientRects().length;
  }
  function byText(key) {
    var c = document.querySelectorAll('h1,h2,h3,h4,h5,summary,dfn,b,strong,li,figcaption,th,td'), first = null, i, el, t;
    for (i = 0; i < c.length; i++) {
      el = c[i]; if (el.closest('#wp-search-dlg')) continue;
      t = compact(el.textContent); if (!t || t.indexOf(key) !== 0) continue;
      if (!reachable(el)) continue;
      if (t === key) return el;
      if (!first) first = el;
    }
    return first;
  }
  var hitEl = null, hitT = 0;
  function reveal(el) {
    var d; while ((d = foldOf(el))) d.open = true;
    if (hitEl) hitEl.classList.remove('wp-s-hit');
    hitEl = el; el.classList.add('wp-s-hit');
    if (!/^(A|BUTTON|INPUT|SELECT|TEXTAREA|SUMMARY)$/.test(el.tagName) && !el.hasAttribute('tabindex')) {
      el.setAttribute('tabindex', '-1');
      el.addEventListener('blur', function rm() { el.removeAttribute('tabindex'); el.removeEventListener('blur', rm); });
    }
    function put() { el.scrollIntoView({ block: el.getBoundingClientRect().height > innerHeight * 0.55 ? 'start' : 'center', behavior: 'auto' }); }
    put();
    try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); }
    /* plates that settle after load can scroll away; put it back if so */
    [700, 1600, 2600].forEach(function (ms) { setTimeout(function () { if (hitEl !== el) return; var r = el.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) put(); }, ms); });
    clearTimeout(hitT); hitT = setTimeout(function () { el.classList.remove('wp-s-hit'); }, 3200);
  }
  function locate(o) {
    if (!o || (!o.at && !o.find)) return;
    var t0 = Date.now();
    (function poll() {
      var el = o.at ? document.getElementById(o.at) : byText(o.find);
      if (el && reachable(el)) { setTimeout(function () { reveal(el); }, 120); return; }
      if (Date.now() - t0 < 8000) setTimeout(poll, 200);
    })();
  }
  function stripParams() {
    if (!history.replaceState || !/[?&](at|find)=/.test(location.search)) return;
    var q = location.search.replace(/^\?/, '').split('&').filter(function (kv) { return kv && !/^(at|find)=/.test(kv); }).join('&');
    try { history.replaceState(history.state, '', location.pathname + (q ? '?' + q : '') + location.hash); } catch (e) { /* file url */ }
  }
  function arrival() {
    var sp = new URLSearchParams(location.search), at = sp.get('at'), find = sp.get('find');
    var m = /^#\/[a-z]+#([A-Za-z][\w-]*)$/.exec(location.hash);   /* the map's own #/stop#element links */
    if (m && !at && !find) { at = m[1]; }
    if (!at && !find) return;
    locate({ at: at, find: find });
    setTimeout(stripParams, 9000);
  }
  function samePath(a, b) { return a.replace(/index\.html$/, '') === b.replace(/index\.html$/, ''); }
  function go(url) {
    var t = new URL(url, location.href), here = new URL(location.href);
    var same = t.origin === here.origin && samePath(t.pathname, here.pathname) && (t.searchParams.get('cargo') || 'water') === (here.searchParams.get('cargo') || 'water');
    if (!same) { location.href = t.href; return; }
    var at = t.searchParams.get('at'), find = t.searchParams.get('find'), h = t.hash;
    var m = /^#\/[a-z]+(?:\/[a-z0-9-]+)?#(.+)$/.exec(h); if (m && !at) at = m[1];
    var fm = /^#\/([a-z]+)\/([a-z0-9-]+)/.exec(h); if (fm && !at && !find) at = 'fig-' + fm[1] + '-' + fm[2];
    if (h && h !== location.hash) { location.hash = h.slice(1); setTimeout(function () { locate({ at: at, find: find }); }, 450); }   /* let the plate switch first */
    else locate({ at: at, find: find });
  }

  /* ---- the tab and the dialog ---- */
  var CSS =
    /* a small tab, icon only, sitting just above the Feedback tab (which is centred on the right edge) */
    '#wp-search-tab{position:fixed;right:0;bottom:calc(50% + 58px);z-index:60;display:flex;align-items:center;justify-content:center;' +
    'width:34px;height:44px;padding:0;margin:0;border:0;color:#fff;background:#1d4e89;' +
    'border-radius:6px 0 0 6px;box-shadow:0 2px 8px rgba(0,0,0,.3);cursor:pointer}' +
    '#wp-search-tab:hover{background:#163c6a}#wp-search-tab:focus-visible{outline:3px solid #f2a900;outline-offset:2px}' +
    '#wp-search-tab svg{display:block;width:17px;height:17px}' +
    '@media (max-width:520px){#wp-search-tab{width:30px;bottom:calc(50% + 52px)}}' +
    '@media print{#wp-search-tab,#wp-search-dlg{display:none!important}}' +
    '#wp-search-dlg{--s-bg:#FFFDFB;--s-ink:#2A211E;--s-mute:#5A4D45;--s-line:#8C7D73;--s-soft:#EDE6DF;--s-act:#DCE6F2;--s-acc:#1F4E8C;--s-mark:#F2E3CF;--s-shade:rgba(20,16,14,.5);' +
    'position:fixed;inset:0;z-index:2147483000;background:var(--s-shade);display:flex;align-items:flex-start;justify-content:center;padding:6vh 16px 16px;box-sizing:border-box;' +
    'font:400 15px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:var(--s-ink)}' +
    '#wp-search-dlg[hidden]{display:none}' +
    '#wp-search-dlg.wp-s-dark{--s-bg:#171B20;--s-ink:#ECE6E0;--s-mute:#BDB4AC;--s-line:#6F7B88;--s-soft:#222830;--s-act:#24395A;--s-acc:#9CC0F5;--s-mark:#4B3B17;--s-shade:rgba(0,0,0,.62)}' +
    '#wp-search-dlg *{box-sizing:border-box}' +
    '#wp-search-dlg .wp-s-panel{width:100%;max-width:680px;max-height:calc(100vh - 6vh - 16px);display:flex;flex-direction:column;background:var(--s-bg);color:var(--s-ink);border:1px solid var(--s-line);border-radius:10px;box-shadow:0 12px 40px rgba(0,0,0,.35);overflow:hidden}' +
    '#wp-search-dlg .wp-s-top{padding:14px 16px 10px;border-bottom:1px solid var(--s-line)}' +
    '#wp-search-dlg .wp-s-row{display:flex;align-items:center;gap:10px;justify-content:space-between}' +
    '#wp-search-dlg h2{font:600 16px/1.3 inherit;font-family:inherit;margin:0;color:var(--s-ink)}' +
    '#wp-search-dlg .wp-s-x{font:inherit;font-size:14px;min-height:40px;min-width:44px;padding:6px 12px;border:1px solid var(--s-line);border-radius:6px;background:transparent;color:var(--s-ink);cursor:pointer}' +
    '#wp-search-dlg .wp-s-x:focus-visible,#wp-search-dlg input:focus-visible{outline:3px solid var(--s-acc);outline-offset:2px}' +
    '#wp-search-dlg label{display:block;font-size:13px;color:var(--s-mute);margin:10px 0 4px}' +
    '#wp-search-dlg input{width:100%;font:inherit;font-size:17px;min-height:44px;padding:8px 12px;border:1px solid var(--s-line);border-radius:6px;background:var(--s-soft);color:var(--s-ink);-webkit-appearance:none;appearance:none}' +
    '#wp-search-dlg .wp-s-hint{font-size:13px;color:var(--s-mute);margin:6px 0 0}' +
    '#wp-search-dlg .wp-s-list{overflow-y:auto;overscroll-behavior:contain;padding:6px 0 10px;flex:1 1 auto}' +
    '#wp-search-dlg .wp-s-gh{font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--s-mute);padding:10px 16px 4px;margin:0}' +
    '#wp-search-dlg .wp-s-o{display:block;padding:8px 16px;text-decoration:none;color:var(--s-ink);border-left:4px solid transparent;cursor:pointer}' +
    '#wp-search-dlg .wp-s-o:hover{background:var(--s-soft)}' +
    '#wp-search-dlg .wp-s-o[aria-selected="true"]{background:var(--s-act);border-left-color:var(--s-acc)}' +
    '#wp-search-dlg .wp-s-t{display:block;font-weight:600;font-size:15px;overflow-wrap:anywhere}' +
    '#wp-search-dlg .wp-s-w{display:block;font-size:12.5px;color:var(--s-mute);margin-top:1px;overflow-wrap:anywhere}' +
    '#wp-search-dlg .wp-s-s{display:block;font-size:13.5px;color:var(--s-ink);margin-top:2px;overflow-wrap:anywhere}' +
    '#wp-search-dlg mark{background:var(--s-mark);color:inherit;border-radius:2px;padding:0 1px}' +
    '#wp-search-dlg .wp-s-empty{padding:12px 16px;color:var(--s-mute);margin:0}' +
    '#wp-search-dlg .wp-s-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}' +
    '.wp-s-hit{outline:3px solid #f2a900!important;outline-offset:4px;border-radius:2px;scroll-margin:96px}' +
    'tr.wp-s-hit{outline:0!important}tr.wp-s-hit>td,tr.wp-s-hit>th{background:rgba(242,169,0,.22)!important;box-shadow:inset 0 3px 0 #f2a900,inset 0 -3px 0 #f2a900}' +
    '@media (max-width:520px){#wp-search-dlg{padding:12px 8px 8px}#wp-search-dlg .wp-s-panel{max-height:calc(100vh - 20px)}#wp-search-dlg .wp-s-o{padding:8px 12px}#wp-search-dlg .wp-s-gh{padding:10px 12px 4px}}';

  var tab, dlg, panel, input, list, status, closeBtn, lastFocus = null, results = [], active = -1, prevOverflow = '';
  var KIND = { p: 'page', h: 'section', f: 'fold', d: 'term', b: 'term', y: 'symbol', s: 'source' };

  function isDark() {
    /* the colour actually behind the middle of the page, whatever theme switch set it */
    var el = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
    for (; el && el.nodeType === 1; el = el.parentElement) {
      var c = getComputedStyle(el).backgroundColor, m = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/.exec(c);
      if (m && (m[4] === undefined || +m[4] > 0.5)) return (0.2126 * m[1] + 0.7152 * m[2] + 0.0722 * m[3]) < 110;
    }
    try { return matchMedia('(prefers-color-scheme: dark)').matches; } catch (e) { return false; }
  }

  function build() {
    if (document.getElementById('wp-search-tab')) return;
    var st = document.createElement('style'); st.id = 'wp-search-css'; st.textContent = CSS; document.head.appendChild(st);
    tab = document.createElement('button');
    tab.type = 'button'; tab.id = 'wp-search-tab';
    tab.setAttribute('aria-haspopup', 'dialog'); tab.setAttribute('aria-keyshortcuts', '/');
    tab.title = 'Search the site (press /)'; tab.setAttribute('aria-label', 'Search the site');
    tab.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><circle cx="6.5" cy="6.5" r="4.6" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M10 10l4.3 4.3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
    tab.addEventListener('click', open);
    document.body.appendChild(tab);

    dlg = document.createElement('div'); dlg.id = 'wp-search-dlg'; dlg.hidden = true;
    dlg.innerHTML =
      '<div class="wp-s-panel" role="dialog" aria-modal="true" aria-labelledby="wp-s-h">' +
      '<div class="wp-s-top"><div class="wp-s-row"><h2 id="wp-s-h">Search the Water Path</h2><button type="button" class="wp-s-x" aria-label="Close search">Close</button></div>' +
      '<label for="wp-s-in">Find a word, a term, a symbol or an author</label>' +
      '<input id="wp-s-in" type="search" autocomplete="off" autocapitalize="off" spellcheck="false" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="wp-s-list" aria-describedby="wp-s-hint">' +
      '<p class="wp-s-hint" id="wp-s-hint">Try Casparian, aquaporin, CO2, psi or Cochard. Arrow keys move, Enter opens, Escape closes.</p>' +
      '<p class="wp-s-sr" id="wp-s-st" role="status" aria-live="polite"></p></div>' +
      '<div class="wp-s-list" id="wp-s-list" role="listbox" aria-label="Results"></div></div>';
    document.body.appendChild(dlg);
    panel = dlg.querySelector('.wp-s-panel'); input = dlg.querySelector('#wp-s-in'); list = dlg.querySelector('#wp-s-list');
    status = dlg.querySelector('#wp-s-st'); closeBtn = dlg.querySelector('.wp-s-x');
    closeBtn.addEventListener('click', function () { close(true); });
    dlg.addEventListener('mousedown', function (e) { if (e.target === dlg) close(true); });
    var tmr = 0;
    input.addEventListener('input', function () { clearTimeout(tmr); tmr = setTimeout(render, 60); });
    dlg.addEventListener('keydown', onKey);
    list.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a.wp-s-o'); if (!a) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;   /* new tab: let the browser do it */
      e.preventDefault(); pick(+a.getAttribute('data-n'));
    });
    list.addEventListener('mousemove', function (e) { var a = e.target.closest && e.target.closest('a.wp-s-o'); if (a) setActive(+a.getAttribute('data-n'), false); });
  }

  function hl(text, qs) {
    var s = esc(text);
    qs.filter(function (q) { return q.length >= 2; }).forEach(function (q) {
      s = s.replace(new RegExp('(^|[^&#\\w])(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '$1<mark>$2</mark>');
    });
    return s;
  }
  function render() {
    var q = input.value.trim();
    results = []; active = -1;
    if (!q) { list.innerHTML = ''; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); status.textContent = ''; return; }
    if (!IDX) { list.innerHTML = '<p class="wp-s-empty">Loading the index…</p>'; return; }
    var gs = grouped(rank(q)), raw = q.split(/\s+/), html = '', n = 0;
    gs.forEach(function (g, gi) {
      html += '<div role="group" aria-labelledby="wp-s-g' + gi + '"><p class="wp-s-gh" id="wp-s-g' + gi + '" role="presentation">' + esc(g.label) + '</p>';
      g.rows.forEach(function (r) {
        var e = r.e; results.push(e);
        html += '<a class="wp-s-o" role="option" aria-selected="false" tabindex="-1" id="wp-s-o' + n + '" data-n="' + n + '" href="' + esc(e.u) + '">' +
          '<span class="wp-s-t">' + hl(e.t, raw) + '</span><span class="wp-s-w">' + esc(KIND[e.k] || '') + (e.w ? ' · ' + esc(e.w) : '') + '</span>' +
          (e.s ? '<span class="wp-s-s">' + hl(e.s, raw) + '</span>' : '') + '</a>';
        n++;
      });
      html += '</div>';
    });
    list.innerHTML = html || '<p class="wp-s-empty">Nothing found for “' + esc(q) + '”. Try a shorter word, or a symbol name such as psi.</p>';
    input.setAttribute('aria-expanded', n ? 'true' : 'false');
    status.textContent = n ? n + (n === 1 ? ' result' : ' results') + ' in ' + gs.length + (gs.length === 1 ? ' part' : ' parts') + ' of the site.' : 'Nothing found.';
    if (n) setActive(0, false); else input.removeAttribute('aria-activedescendant');
  }
  function setActive(i, scroll) {
    if (!results.length) return;
    i = (i + results.length) % results.length;
    var old = list.querySelector('[aria-selected="true"]'); if (old) old.setAttribute('aria-selected', 'false');
    var o = document.getElementById('wp-s-o' + i); if (!o) return;
    o.setAttribute('aria-selected', 'true'); active = i;
    input.setAttribute('aria-activedescendant', o.id);
    if (scroll) {
      var lr = list.getBoundingClientRect(), or = o.getBoundingClientRect();
      if (or.top < lr.top) list.scrollTop -= (lr.top - or.top) + (i === 0 || o.previousElementSibling && o.previousElementSibling.tagName === 'P' ? 30 : 4);
      else if (or.bottom > lr.bottom) list.scrollTop += (or.bottom - lr.bottom) + 4;
    }
  }
  function pick(i) { var e = results[i]; if (!e) return; close(false); go(e.u); }
  function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(true); return; }
    if (e.key === 'Tab') {
      var f = [input, closeBtn], k = f.indexOf(document.activeElement);
      e.preventDefault(); f[(k + (e.shiftKey ? f.length - 1 : 1)) % f.length].focus(); return;
    }
    if (e.target !== input) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1, true); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1, true); }
    else if (e.key === 'Home' && e.ctrlKey) { e.preventDefault(); setActive(0, true); }
    else if (e.key === 'End' && e.ctrlKey) { e.preventDefault(); setActive(results.length - 1, true); }
    else if (e.key === 'Enter') { e.preventDefault(); if (active >= 0) pick(active); }
    e.stopPropagation();   /* page shortcuts (C, arrows in presentation mode) stay out of the search box */
  }
  function open() {
    if (!dlg) build();
    if (!dlg.hidden) { input.focus(); return; }
    lastFocus = document.activeElement;
    dlg.classList.toggle('wp-s-dark', isDark());
    dlg.hidden = false;
    prevOverflow = document.documentElement.style.overflow; document.documentElement.style.overflow = 'hidden';
    input.focus(); input.select();
    if (!IDX) {
      status.textContent = 'Loading the index.';
      load().then(function () { status.textContent = 'Index ready.'; render(); }, function () {
        list.innerHTML = '<p class="wp-s-empty">The search index could not be loaded. Opened straight from a file, the browser blocks it; it works on the web copy.</p>';
        LOADING = null;
      });
    } else render();
  }
  function close(restore) {
    if (!dlg || dlg.hidden) return;
    dlg.hidden = true;
    document.documentElement.style.overflow = prevOverflow;
    if (restore) { var t = lastFocus && document.contains(lastFocus) ? lastFocus : tab; try { t.focus(); } catch (e) { /* gone */ } }
  }
  document.addEventListener('keydown', function (e) {
    if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey || framed) return;
    var t = e.target, typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
    if (typing) return;
    e.preventDefault(); open();
  });

  function start() { if (!framed) build(); arrival(); }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
  window.WPSearch = { open: open, close: close, rank: function (q) { return rank(q).slice(0, 10).map(function (r) { return { t: r.e.t, w: r.e.w, k: r.e.k, u: r.e.u, sc: Math.round(r.sc * 10) / 10 }; }); }, load: load, locate: locate };
})();

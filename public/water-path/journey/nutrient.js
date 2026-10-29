/* The Water Path v8: nutrient.js (nutrient path core, v17)
   The CARGO switch: the same six plates follow either WATER or a NUTRIENT. Nav does not change.

   State   WP.state.cargo  'water' | 'nutrient'
           WP.state.solute 'nitrate' | 'phosphate' | 'potassium' | 'cadmium' | 'dye'
           Both live in engine.js DEFAULTS and normalize. They persist per browser in localStorage
           key 'wp-cargo' as JSON {"cargo":"nutrient","solute":"nitrate"} (try/catch), sync between tabs
           and pages with the storage event (the speed.js pattern), and can be set by a link with
           ?cargo=nutrient&solute=cadmium in the query string (the shell's hash is the plate route, so the
           query string is used instead; it is kept in step with the switch by history.replaceState).

   Modules (loaded only when a plate is first seen in nutrient mode, so water visitors load nothing more)
     WP.nutrient.load(name, cb)                inject journey/n_<name>.js once; cb(err) when it has run.
                                               Any name other than 'kit' loads n_kit.js first.
     WP.nutrient.register(levelId, {mount, update, unmount})
         mount(host, state)   build into host (an empty div.wp-nut-body); may return nothing
         update(state, res)   called on every WP.set while this plate is shown in nutrient mode
         unmount(host)        free WebGL contexts and listeners; the core empties host afterwards
     WP.nutrient.mount(levelId, host)          mount the module (loading it first if needed)
     WP.nutrient.update(levelId, state)        update a mounted module
     WP.nutrient.unmount(levelId)              unmount it
     WP.nutrient.host(levelId)                 the div.wp-nut-body the core inserted for that plate
     WP.nutrient.setCargo(c, announce) / setSolute(s, announce)
     WP.nutrient.LEVELS                        [{n, id, rn, name}] for plates I to VI
   The core does the dispatch itself on every WP.set, so the water plate files need no change: when cargo is
   'nutrient' the current plate's water content is hidden by CSS and its nutrient panel is mounted and updated;
   when cargo is 'water' every nutrient panel is unmounted and the water content shows again. */
(function () {
  'use strict';
  var WP = window.WP;
  if (!WP || !WP.set || !WP.on) { console.error('nutrient.js: engine.js did not load'); return; }
  var ui = WP.ui || {};

  var KEY = 'wp-cargo';
  var CARGOS = ['water', 'nutrient'];
  var SOLUTES = [
    ['nitrate', 'Nitrate', 'NO₃⁻'],
    ['phosphate', 'Phosphate', 'H₂PO₄⁻'],
    ['potassium', 'Potassium', 'K⁺'],
    ['cadmium', 'Cadmium, a toxic metal', 'Cd²⁺'],
    ['dye', 'Dye tracer', 'stays in the walls']
  ];
  var LEVELS = [
    { n: 1, id: 'field', rn: 'I', name: 'Field', sub: 'soil, roots and the groundwater below' },
    { n: 2, id: 'plant', rn: 'II', name: 'Plant', sub: 'roots and the fungi they feed' },
    { n: 3, id: 'organ', rn: 'III', name: 'Organ', sub: 'the root checkpoint' },
    { n: 4, id: 'tissue', rn: 'IV', name: 'Tissue', sub: 'where each element goes, and what it costs' },
    { n: 5, id: 'membrane', rn: 'V', name: 'Membrane', sub: 'the proton pump, iron uptake and the nitrate sensor' },
    { n: 5.5, id: 'species', rn: 'VI', name: 'Species', sub: 'nutrient strategies compared' }
  ];
  function levelOf(n) { for (var i = 0; i < LEVELS.length; i++) if (LEVELS[i].n === +n) return LEVELS[i]; return null; }
  function levelById(id) { for (var i = 0; i < LEVELS.length; i++) if (LEVELS[i].id === id) return LEVELS[i]; return null; }
  function soluteName(s) { for (var i = 0; i < SOLUTES.length; i++) if (SOLUTES[i][0] === s) return SOLUTES[i][1].split(',')[0].toLowerCase(); return s; }

  /* ------------------------------------------------------------ storage */
  function rd() {
    var v = null;
    try { v = window.localStorage.getItem(KEY); } catch (e) { return null; }
    return parse(v);
  }
  function parse(v) {
    if (v == null) return null;
    var o = null;
    try { o = JSON.parse(v); } catch (e) { o = null; }
    if (typeof o === 'string') o = { cargo: o };
    if (!o && CARGOS.indexOf(v) >= 0) o = { cargo: v };
    return o && typeof o === 'object' ? o : null;
  }
  function wr(c, s) { try { window.localStorage.setItem(KEY, JSON.stringify({ cargo: c, solute: s })); } catch (e) { /* private window */ } }
  function fromQuery() {
    var o = {}, q = String(location.search || '');
    var m = /[?&]cargo=([a-z]+)/i.exec(q); if (m && CARGOS.indexOf(m[1].toLowerCase()) >= 0) o.cargo = m[1].toLowerCase();
    m = /[?&]solute=([a-z]+)/i.exec(q); if (m) o.solute = m[1].toLowerCase();
    return o;
  }
  function syncQuery() {
    if (!/[?&](cargo|solute)=/.test(location.search) || !history.replaceState) return;
    var q = location.search.replace(/([?&])cargo=[^&]*/, '$1cargo=' + WP.state.cargo).replace(/([?&])solute=[^&]*/, '$1solute=' + WP.state.solute);
    try { history.replaceState(history.state, '', location.pathname + q + location.hash); } catch (e) { /* file url */ }
  }

  /* initial state: query string, then storage, then the engine default. Applied without notifying:
     boot.js sends the first WP.set({}) */
  (function () {
    var st = rd() || {}, q = fromQuery(), k;
    for (k in q) st[k] = q[k];
    var cur = {}; for (k in WP.state) cur[k] = WP.state[k];
    if (st.cargo) cur.cargo = st.cargo;
    if (st.solute) cur.solute = st.solute;
    var n = WP.model.normalize(cur);
    WP.state.cargo = n.cargo; WP.state.solute = n.solute;
    if (q.cargo || q.solute) wr(n.cargo, n.solute);
  })();

  /* ------------------------------------------------------------ live region */
  var live = document.createElement('p');
  live.className = 'vh'; live.id = 'wp-cargo-live';
  live.setAttribute('aria-live', 'polite'); live.setAttribute('role', 'status');
  document.body.appendChild(live);
  /* set at once; a repeated message gets a trailing no break space so screen readers announce it again */
  function say(msg) { live.textContent = live.textContent === msg ? msg + '\u00a0' : msg; }
  function cargoWords() {
    return WP.state.cargo === 'nutrient' ?
      'Following a nutrient: ' + soluteName(WP.state.solute) + '. Each plate now shows the nutrient path.' :
      'Following water. Each plate shows the water path.';
  }

  /* ------------------------------------------------------------ the switch, beside Depth */
  var ICON = {
    water: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.6C6 4.4 3.6 7 3.6 9.7a4.4 4.4 0 0 0 8.8 0C12.4 7 10 4.4 8 1.6Z" fill="currentColor"/></svg>',
    nutrient: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5.6" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M5.4 8h5.2M8 5.4v5.2" stroke="currentColor" stroke-width="1.6"/></svg>'
  };
  var sw = null;
  function buildSwitch() {
    var bar = document.querySelector('.wp-bar'); if (!bar || document.getElementById('wp-cargo')) return;
    sw = document.createElement('div');
    sw.className = 'wp-cargo'; sw.id = 'wp-cargo';
    sw.setAttribute('role', 'radiogroup'); sw.setAttribute('aria-label', 'Follow: water or a nutrient');
    sw.innerHTML = '<span class="wp-cargo-l" aria-hidden="true">Follow</span>' +
      '<button type="button" role="radio" data-cargo="water" aria-checked="false" tabindex="-1" title="Follow water from the soil to the air">' + ICON.water + '<span>Water</span></button>' +
      '<button type="button" role="radio" data-cargo="nutrient" aria-checked="false" tabindex="-1" title="Follow a mineral nutrient through the same six plates">' + ICON.nutrient + '<span>Nutrient</span></button>';
    var tier = document.getElementById('wp-tier');
    if (tier && tier.parentNode === bar) tier.insertAdjacentElement('afterend', sw); else bar.appendChild(sw);
    sw.addEventListener('click', function (e) { var b = e.target.closest('[data-cargo]'); if (b) setCargo(b.getAttribute('data-cargo'), true); });
    sw.addEventListener('keydown', function (e) {
      var i = CARGOS.indexOf(WP.state.cargo), j = -1;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % 2;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i + 1) % 2;
      else if (e.key === 'Home') j = 0; else if (e.key === 'End') j = 1;
      if (j < 0) return;
      e.preventDefault();
      setCargo(CARGOS[j], true);
      var b = sw.querySelector('[data-cargo="' + CARGOS[j] + '"]'); if (b) b.focus();
    });
  }
  function paintSwitch() {
    if (!sw) return;
    Array.prototype.forEach.call(sw.querySelectorAll('[data-cargo]'), function (b) {
      var on = b.getAttribute('data-cargo') === WP.state.cargo;
      b.setAttribute('aria-checked', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1;
    });
    document.documentElement.setAttribute('data-cargo', WP.state.cargo);
  }

  /* ------------------------------------------------------------ solute chooser, in Conditions */
  var solEl = null;
  function buildSolute() {
    var grid = document.getElementById('wp-cond-grid'); if (!grid || document.getElementById('ctl-solute')) return;
    solEl = document.createElement('div');
    solEl.className = 'ctl wp-solute';
    solEl.innerHTML = '<label for="ctl-solute">Nutrient followed</label><select id="ctl-solute">' +
      SOLUTES.map(function (s) { return '<option value="' + s[0] + '">' + s[1] + ' (' + s[2] + ')</option>'; }).join('') + '</select>' +
      '<div class="hint">shown while the switch says Nutrient</div>';
    grid.insertBefore(solEl, grid.firstChild);
    solEl.querySelector('select').addEventListener('change', function (e) { setSolute(e.target.value, true); });
  }
  function paintSolute() {
    if (!solEl) return;
    solEl.hidden = WP.state.cargo !== 'nutrient';
    var s = solEl.querySelector('select'); if (s.value !== WP.state.solute) s.value = WP.state.solute;
    var sum = document.getElementById('wp-cond-sum');
    if (sum) {
      var tag = sum.querySelector('.wp-cargo-sum');
      if (WP.state.cargo === 'nutrient') {
        if (!tag) { tag = document.createElement('span'); tag.className = 'wp-cargo-sum'; sum.appendChild(tag); }
        tag.textContent = ' · following ' + soluteName(WP.state.solute);
      } else if (tag) tag.parentNode.removeChild(tag);
    }
  }

  function setCargo(c, announce) {
    if (CARGOS.indexOf(c) < 0) return;
    if (c !== WP.state.cargo) { WP.set({ cargo: c }); wr(WP.state.cargo, WP.state.solute); syncQuery(); }
    if (announce) say(cargoWords());
  }
  function setSolute(s, announce) {
    if (s !== WP.state.solute) { WP.set({ solute: s }); wr(WP.state.cargo, WP.state.solute); syncQuery(); }
    if (announce) say('Following ' + soluteName(WP.state.solute) + '.');
  }
  window.addEventListener('storage', function (e) {
    if (e.key !== KEY) return;
    var o = parse(e.newValue) || { cargo: 'water' };
    var p = {};
    if (o.cargo && o.cargo !== WP.state.cargo) p.cargo = o.cargo;
    if (o.solute && o.solute !== WP.state.solute) p.solute = o.solute;
    if (p.cargo || p.solute) { WP.set(p); syncQuery(); say(cargoWords()); }
  });

  /* ------------------------------------------------------------ lazy loader */
  var base = (function () {
    var s = document.currentScript && document.currentScript.src;
    if (!s) { var all = document.querySelectorAll('script[src*="nutrient.js"]'); s = all.length ? all[all.length - 1].src : ''; }
    return s ? s.replace(/[^\/]*$/, '') : '';
  })();
  var loads = {};   // name -> {done, err, cbs}
  function inject(name, cb) {
    var L = loads[name];
    if (L) { if (L.done) setTimeout(function () { cb(L.err); }, 0); else L.cbs.push(cb); return; }
    L = loads[name] = { done: false, err: null, cbs: [cb] };
    var sc = document.createElement('script');
    sc.src = base + 'n_' + name + '.js';
    sc.async = false;
    sc.setAttribute('data-nutrient', name);
    function fin(err) { L.done = true; L.err = err || null; L.cbs.splice(0).forEach(function (f) { try { f(L.err); } catch (x) { console.error(x); } }); }
    sc.onload = function () { fin(null); };
    sc.onerror = function () { fin(new Error('could not load n_' + name + '.js')); };
    document.head.appendChild(sc);
  }
  function load(name, cb) {
    cb = cb || function () {};
    if (!/^[a-z0-9_]+$/.test(String(name))) { cb(new Error('bad module name')); return; }
    if (name === 'kit') { inject('kit', cb); return; }
    inject('kit', function (err) {
      if (err) console.warn('nutrient.js: the workstation kit did not load; ' + name + ' loads without it');
      inject(name, cb);
    });
  }

  /* ------------------------------------------------------------ registry and dispatch */
  var mods = {};      // levelId -> {mount, update, unmount}
  var mounted = {};   // levelId -> host
  var pendingMount = {};
  function register(id, mod) {
    if (!levelById(id)) console.warn('WP.nutrient.register: unknown level', id);
    mods[id] = mod || {};
  }
  function hostOf(id) {
    var L = levelById(id); if (!L || !WP.shell || !WP.shell.sections[L.n]) return null;
    return ensureHost(WP.shell.sections[L.n]);
  }
  function ensureHost(s) {
    var wrap = s.body.querySelector(':scope > .wp-nut');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'wp-nut';
      var body = document.createElement('div'); body.className = 'wp-nut-body';
      wrap.appendChild(body);
      s.body.insertBefore(wrap, s.body.firstChild);
    }
    return wrap.querySelector('.wp-nut-body');
  }
  function mount(id, host) {
    host = host || hostOf(id);
    if (!host || mounted[id]) return;
    var m = mods[id];
    if (!m) {
      if (pendingMount[id]) return;
      pendingMount[id] = true;
      host.innerHTML = '<p class="wp-nut-wait">Loading the nutrient panel…</p>';
      load(id, function (err) {
        pendingMount[id] = false;
        if (err || !mods[id]) { host.innerHTML = '<p class="wp-nut-wait">The nutrient panel for this plate could not load. The water plate still works: switch back to Water.</p>'; return; }
        if (WP.state.cargo === 'nutrient' && activeId() === id) { host.innerHTML = ''; mount(id, host); update(id, WP.state); }
        else host.innerHTML = '';
      });
      return;
    }
    host.innerHTML = '';
    mounted[id] = host;
    try { if (typeof m.mount === 'function') m.mount(host, WP.state); }
    catch (e) { console.error('nutrient ' + id + ' failed to mount', e); host.innerHTML = '<p class="wp-nut-wait">This nutrient panel failed to start.</p>'; }
  }
  function update(id, st) {
    var m = mods[id]; if (!m || !mounted[id] || typeof m.update !== 'function') return;
    try { m.update(st || WP.state, WP.result); } catch (e) { console.error('nutrient ' + id + ' update failed', e); }
  }
  function unmount(id) {
    var host = mounted[id]; if (!host) return;
    var m = mods[id];
    try { if (m && typeof m.unmount === 'function') m.unmount(host); } catch (e) { console.error(e); }
    host.innerHTML = '';
    delete mounted[id];
  }
  function activeId() { var L = levelOf(WP.state.level); return L ? L.id : null; }

  /* a short note for the Afternoon, which follows water only for now */
  function noteAfternoon(on) {
    var s = WP.shell && WP.shell.sections[6]; if (!s) return;
    var n = s.body.querySelector(':scope > .wp-nut-note');
    if (on && !n) {
      n = document.createElement('p'); n.className = 'wp-nut-note';
      n.textContent = 'The nutrient path runs through Plates I to VI. Your Salinas afternoon follows water only, so it is shown as before.';
      s.body.insertBefore(n, s.body.firstChild);
    } else if (!on && n) n.parentNode.removeChild(n);
  }

  var last = { cargo: null, level: null, solute: null };
  function sync(st) {
    if (!WP.shell || !WP.shell.sections) return;
    var nut = st.cargo === 'nutrient';
    LEVELS.forEach(function (L) {
      var s = WP.shell.sections[L.n]; if (!s) return;
      if (s.level && s.level.pending) return;
      ensureHost(s);
      s.sec.setAttribute('data-cargo', st.cargo);
      var h2 = s.sec.querySelector('.level-hd .level-no');
      if (h2) {
        if (!h2.hasAttribute('data-water')) h2.setAttribute('data-water', h2.textContent);
        var wt = h2.getAttribute('data-water');
        h2.textContent = nut ? wt.replace(/^Water /, 'Nutrient ') : wt;
      }
      var sp = s.sec.querySelector('.level-hd .level-sp');
      if (sp) {
        if (!sp.hasAttribute('data-water')) sp.setAttribute('data-water', sp.textContent);
        var ws = sp.getAttribute('data-water'), cut = ws.indexOf(', scale');
        sp.textContent = nut && L.sub && cut >= 0 ? L.sub + ws.slice(cut) : ws;
      }
      Array.prototype.forEach.call(s.sec.querySelectorAll(':scope > .wp-next a[data-next]'), function (a) {
        if (!a.hasAttribute('data-water')) a.setAttribute('data-water', a.innerHTML);
        var hw = a.getAttribute('data-water');
        a.innerHTML = nut ? hw.replace(/Water (I|II|III|IV|V|VI)\b/, 'Nutrient $1') : hw;
      });
      if (!nut) unmount(L.id);
    });
    noteAfternoon(nut);
    var id = activeId();
    document.documentElement.classList.toggle('wp-nut-on', !!(nut && id)); /* the water readouts and speed dock step aside while a workstation shows */
    if (nut && id) {
      if (!mounted[id]) mount(id);
      update(id, st);
    }
    if (st.cargo !== last.cargo || st.solute !== last.solute) { paintSwitch(); paintSolute(); }
    else paintSolute();
    last.cargo = st.cargo; last.level = st.level; last.solute = st.solute;
  }

  WP.nutrient = {
    LEVELS: LEVELS, SOLUTES: SOLUTES,
    load: load, register: register, mount: mount, update: update, unmount: unmount,
    host: hostOf, mounted: function (id) { return !!mounted[id]; },
    setCargo: setCargo, setSolute: setSolute, soluteName: soluteName, say: say,
    get cargo() { return WP.state.cargo; }
  };

  /* styles: the switch (AA in both themes, 44 px targets, checked state shown by weight and a bar, not colour alone) */
  var css = '\
.wp-cargo{display:inline-flex;align-items:center;border:1px solid var(--rule);border-radius:2px;background:var(--card)}\
.wp-cargo-l{font-family:var(--ui);font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink2);padding:0 8px}\
.wp-cargo button{display:inline-flex;align-items:center;gap:6px;font-family:var(--ui);font-size:13px;letter-spacing:.06em;text-transform:uppercase;min-height:44px;min-width:44px;padding:6px 11px;border:0;border-left:1px solid var(--rule);background:transparent;color:var(--ink);cursor:pointer;white-space:nowrap;box-shadow:inset 0 -3px 0 transparent}\
.wp-cargo button svg{width:15px;height:15px;flex:none}\
.wp-cargo button[aria-checked="true"]{background:var(--plaque);color:var(--plaque-ink);font-weight:600;box-shadow:inset 0 -4px 0 var(--plaque-ink)}\
.wp-cargo button[aria-checked="true"] span::after{content:" \\2713"}\
.wp-cargo button:focus-visible{outline:3px solid var(--accent);outline-offset:2px}\
@media (max-width:640px){.wp-cargo{order:3}.wp-cargo-l{display:none}.wp-cargo button{padding:6px 8px;font-size:12px;letter-spacing:.03em}.wp-cargo button:first-of-type{border-left:0}}\
.wp-solute[hidden]{display:none!important}\
.wp-nut{display:none}\
.level[data-cargo="nutrient"] .level-body > .wp-nut{display:block}\
.level[data-cargo="nutrient"] .level-body > :not(.wp-nut),.level[data-cargo="nutrient"] > .ptc-quick,.level[data-cargo="nutrient"] > .libstrip{display:none!important}\
html.wp-nut-on .wp-rail,html.wp-nut-on .ps-dock{display:none!important}html.wp-nut-on .wp-main{grid-template-columns:minmax(0,1fr)!important;padding-bottom:0}\
.wp-nut-wait,.wp-nut-note{font-family:var(--ui);font-size:14px;color:var(--ink2);border:1px dashed var(--rule);padding:10px 12px;margin:10px 0}\
@media print{.wp-cargo{display:none}}';
  var st = document.createElement('style'); st.id = 'wp-nutrient-css'; st.textContent = css; document.head.appendChild(st);

  function start() {
    buildSwitch(); buildSolute(); paintSwitch(); paintSolute();
    WP.on(function (s) { sync(s); });
    sync(WP.state);
  }
  if (document.getElementById('wp-stage')) start(); else document.addEventListener('DOMContentLoaded', start);
})();

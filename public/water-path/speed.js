/* The Water Path: speed.js (Lead, 13 Oct 2026). Shared playback speed and molecule name tags.
   ONE copy of this file lives in journey/ and one in light/ (pages may not load across folders); keep them identical.
   window.PlaySpeed: the display speed of every animated scene (1, 0.75, 0.5, 0.25, 0.1). It slows what is DRAWN only;
     model rates, readouts and numbers never change. Every animation loop multiplies its frame time by PlaySpeed.get().
   window.MolNames: whether molecules carry a small name tag under them (default on). Scenes read MolNames.get().
   Both persist per browser (localStorage, wrapped in try/catch) and sync between the two pages. */
(function () {
  'use strict';
  var LEVELS = [1, 0.75, 0.5, 0.25, 0.1];
  var KS = 'wp-speed', KN = 'wp-molnames';
  function rd(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
  function wr(k, v) { try { window.localStorage.setItem(k, String(v)); } catch (e) { /* private window */ } }
  var sp = parseFloat(rd(KS)); if (LEVELS.indexOf(sp) < 0) sp = 1;
  var nm = rd(KN); nm = nm == null ? true : nm === '1';
  var subs = [];
  function emit() { subs.forEach(function (f) { try { f(sp, nm); } catch (e) { console.error(e); } }); paintAll(); }
  function label(v) { return v === 1 ? '1×' : v === 0.75 ? '¾×' : v === 0.5 ? '½×' : v === 0.25 ? '¼×' : '⅒×'; }
  function words(v) { return v === 1 ? 'normal speed' : v === 0.1 ? 'one tenth speed' : (v === 0.75 ? 'three quarter' : v === 0.5 ? 'half' : 'quarter') + ' speed'; }

  var PS = window.PlaySpeed = {
    LEVELS: LEVELS,
    get: function () { return sp; },
    set: function (v) { v = +v; if (LEVELS.indexOf(v) < 0 || v === sp) return; sp = v; wr(KS, v); emit(); },
    next: function () { PS.set(LEVELS[(LEVELS.indexOf(sp) + 1) % LEVELS.length]); },
    label: label, words: words,
    on: function (f) { subs.push(f); },
    /* compact chip for a scene toolbar: one button that steps 1× → ¾× → ½× → ¼× → ⅒× → 1× */
    chip: function (cls) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'ps-chip' + (cls ? ' ' + cls : '');
      b.setAttribute('data-ps', 'chip');
      b.addEventListener('click', function (e) { e.stopPropagation(); PS.next(); });
      paint(b); return b;
    }
  };
  window.MolNames = {
    get: function () { return nm; },
    set: function (v) { v = !!v; if (v === nm) return; nm = v; wr(KN, v ? '1' : '0'); emit(); },
    on: function (f) { subs.push(f); }
  };
  function paint(b) {
    b.textContent = '';
    var s = document.createElement('span'); s.className = 'ps-k'; s.textContent = 'Speed';
    var v = document.createElement('b'); v.textContent = label(sp);
    b.appendChild(s); b.appendChild(v);
    b.setAttribute('aria-label', 'Animation speed: ' + words(sp) + '. Press to slow down further.');
    b.title = 'Slow the animations down (numbers do not change)';
    b.classList.toggle('ps-slow', sp < 1);
  }
  function paintAll() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-ps="chip"]'), paint);
    Array.prototype.forEach.call(document.querySelectorAll('.ps-dock [data-v]'), function (b) { b.setAttribute('aria-pressed', +b.getAttribute('data-v') === sp ? 'true' : 'false'); });
    var t = document.querySelector('.ps-dock .ps-names'); if (t) t.setAttribute('aria-pressed', nm ? 'true' : 'false');
    var o = document.querySelector('.ps-dock .ps-open b'); if (o) o.textContent = label(sp);
    var dk = document.querySelector('.ps-dock'); if (dk) dk.classList.toggle('ps-slow', sp < 1);
  }
  window.addEventListener('storage', function (e) {
    if (e.key === KS) { var v = parseFloat(e.newValue); if (LEVELS.indexOf(v) >= 0 && v !== sp) { sp = v; emit(); } }
    if (e.key === KN) { var n = e.newValue === '1'; if (n !== nm) { nm = n; emit(); } }
  });

  /* styles */
  var css = '\
.ps-chip{display:inline-flex;align-items:center;gap:6px;font:500 12px var(--ui,system-ui,sans-serif);color:#f4f1e8;background:rgba(14,20,16,.55);border:1px solid rgba(255,255,255,.3);border-radius:999px;padding:4px 11px;min-height:30px;cursor:pointer;-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px)}\
.ps-chip .ps-k{opacity:.82}.ps-chip b{font-weight:700;min-width:2.1em;text-align:left}\
.ps-chip.ps-slow{background:rgba(255,212,121,.92);color:#2a1d00;border-color:rgba(255,212,121,1)}\
.ps-chip:focus-visible,.ps-dock button:focus-visible{outline:2px solid #ffd479;outline-offset:2px}\
.ps-chip.ps-light{color:var(--ink,#1d2a22);background:var(--card,rgba(255,255,255,.85));border-color:var(--rule,rgba(0,0,0,.25))}\
.ps-chip.ps-light.ps-slow{background:#ffd479;color:#2a1d00;border-color:#e0b450}\
.ps-dock{position:fixed;right:12px;bottom:12px;z-index:70;font:500 13px var(--ui,system-ui,sans-serif);color:var(--ink,#1d2a22)}\
.ps-dock .ps-open{display:inline-flex;align-items:center;gap:7px;min-height:40px;padding:6px 14px;border-radius:999px;border:1px solid var(--rule,rgba(0,0,0,.25));background:var(--wall,#faf6ec);color:inherit;box-shadow:0 4px 14px rgba(0,0,0,.18);cursor:pointer;font:inherit}\
.ps-dock.ps-slow .ps-open{background:#ffd479;color:#2a1d00;border-color:#e0b450}\
.ps-dock .ps-open svg{width:16px;height:16px}\
.ps-dock .ps-pop{position:absolute;right:0;bottom:48px;width:min(300px,calc(100vw - 24px));padding:12px;border-radius:14px;border:1px solid var(--rule,rgba(0,0,0,.25));background:var(--wall,#faf6ec);box-shadow:0 10px 30px rgba(0,0,0,.25)}\
.ps-dock .ps-pop[hidden]{display:none}\
.ps-dock .ps-h{margin:0 0 6px;font-weight:700}.ps-dock .ps-note{margin:8px 0 0;font-size:12px;opacity:.8;line-height:1.35}\
.ps-dock .ps-row{display:flex;gap:6px;flex-wrap:wrap}\
.ps-dock .ps-row button{flex:1 1 0;min-width:44px;min-height:40px;border-radius:10px;border:1px solid var(--rule,rgba(0,0,0,.25));background:transparent;color:inherit;font:600 14px var(--ui,system-ui,sans-serif);cursor:pointer}\
.ps-dock .ps-row button[aria-pressed="true"]{background:#ffd479;color:#2a1d00;border-color:#e0b450}\
.ps-dock .ps-names{margin-top:10px;width:100%;min-height:40px;border-radius:10px;border:1px solid var(--rule,rgba(0,0,0,.25));background:transparent;color:inherit;font:inherit;cursor:pointer;text-align:left;padding:6px 10px}\
.ps-dock .ps-names[aria-pressed="true"]::before{content:"✓ "}\
.ps-dock .ps-names[aria-pressed="false"]::before{content:"○ "}\
@media (max-width:700px){.ps-dock{right:8px}.ps-dock .ps-open{min-height:44px;min-width:44px;padding:0 10px;gap:4px;font-size:12px;opacity:.94}.ps-dock .ps-open span{display:none}.ps-dock .ps-pop{bottom:52px}}\
@media print{.ps-dock,.ps-chip{display:none}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  /* the page wide dock (bottom right): five speeds plus the molecule names switch */
  function dock() {
    if (document.querySelector('.ps-dock')) return;
    var d = document.createElement('div'); d.className = 'ps-dock' + (sp < 1 ? ' ps-slow' : '');
    d.innerHTML = '<button type="button" class="ps-open" aria-expanded="false" aria-controls="ps-pop"><svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 4v4l2.6 1.6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg><span>Speed</span> <b>' + label(sp) + '</b></button>' +
      '<div class="ps-pop" id="ps-pop" role="group" aria-label="Animation speed" hidden><p class="ps-h">Animation speed</p><div class="ps-row">' +
      LEVELS.map(function (v) { return '<button type="button" data-v="' + v + '" aria-label="' + words(v) + '" aria-pressed="' + (v === sp) + '">' + label(v) + '</button>'; }).join('') +
      '</div><button type="button" class="ps-names" aria-pressed="' + nm + '">Molecule names under each molecule</button>' +
      '<p class="ps-note">Slows what is drawn on every scene on this page. The numbers and the model do not change.</p></div>';
    document.body.appendChild(d);
    /* sit above any fixed bottom bar (the main page tab bar on phones) */
    function lift() {
      var off = 12;
      Array.prototype.forEach.call(document.querySelectorAll('.tabbar,.wp-cm-bar,.wp-sm,.wp-rail'), function (b) {
        var cs = getComputedStyle(b); if ((cs.position !== 'fixed' && cs.position !== 'sticky') || cs.display === 'none' || cs.visibility === 'hidden') return;
        var r = b.getBoundingClientRect(); if (r.height && r.top > window.innerHeight * 0.6 && r.bottom >= window.innerHeight - 2 && r.left < window.innerWidth && r.right > window.innerWidth - 140) off = Math.max(off, window.innerHeight - r.top + 8);
      });
      d.style.bottom = off + 'px';
    }
    var lq = 0; function lq1() { if (!lq) lq = requestAnimationFrame(function () { lq = 0; lift(); }); }
    lift(); window.addEventListener('resize', lq1); window.addEventListener('scroll', lq1, { passive: true }); setInterval(lift, 1500);
    var open = d.querySelector('.ps-open'), pop = d.querySelector('.ps-pop');
    function show(on) { pop.hidden = !on; open.setAttribute('aria-expanded', on ? 'true' : 'false'); }
    open.addEventListener('click', function (e) { e.stopPropagation(); show(pop.hidden); });
    d.querySelectorAll('[data-v]').forEach(function (b) { b.addEventListener('click', function () { PS.set(+b.getAttribute('data-v')); }); });
    d.querySelector('.ps-names').addEventListener('click', function () { window.MolNames.set(!nm); });
    document.addEventListener('click', function (e) { if (!d.contains(e.target)) show(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !pop.hidden) { show(false); open.focus(); } });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', dock); else dock();
})();

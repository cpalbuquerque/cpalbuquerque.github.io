/* The Water Path v19: freeze.js, one click to freeze rule for every animated view on the site.
   The same behaviour as the WS workstations (journey/n_kit.js): a still click on the view (pointer moved 6 px or less,
   released within 450 ms, primary button, not on a control) toggles pause and play; the view's own Pause button stays
   in step (label Pause / Play, aria-pressed); a chip "Frozen · click the view to play" shows while frozen; Space or
   Enter on the focused view toggles; a drag never toggles, so turning a 3D camera stays live while frozen.
   Reduced motion: each view starts paused (the view code does that) and the chip says so; a click plays.
   Loaded by every page before its scene code (index.html, journey/, light/, phloem/, turgor.html).

   API
     WPFreeze.attach(el, opts) -> { sync(), el }       el: the element that takes clicks (a canvas, svg or stage)
       opts.paused()   required: true while the motion is stopped
       opts.button     optional: the view's own Pause / Play button; a click on the view clicks it, so every view the
                       button controls (two theatres on one button, for example) freezes together
       opts.set(p)     optional: used when there is no button; p true pauses
       opts.label      false: never rewrite the button's text (icon buttons that keep their own label)
       opts.chipHost   where the chip goes (default el, or its parent when el is a canvas or svg)
       opts.chip       'tr' (default), 'tl', 'tc' or 'bl': corner of the chip
       opts.keyEl      the element that takes Space / Enter (default el; made focusable when it is not)
       opts.keys       false: the view already handles Space / Enter itself
       opts.ignore(e)  true for a pointerdown that must not count (a drag handle, a pick target)
       opts.picked()   checked after a still click: true when the view used that click to pick a part (no toggle)
     view.bind(button)                                 keep a Pause button bound later in step
     WPFreeze.syncAll()                                 bring every chip and button back in step
     WPFreeze.text                                      the chip text, shared with the kit */
(function () {
  'use strict';
  if (window.WPFreeze) return;
  var TEXT = 'Frozen · click the view to play';
  var MOVE = 6, HOLD = 450;
  var views = [], live = null, timer = 0, descId = 'wp-frz-desc';
  var SKIP = 'button,a,input,select,textarea,label,summary,details,[contenteditable],[data-nofreeze],.mh-cap,.mh-credit,.mh-slow,.mh-ans,.ws-info,.chl-panel,.t3-card';

  function css() {
    if (document.getElementById('wp-frz-css')) return;
    var st = document.createElement('style'); st.id = 'wp-frz-css';
    st.textContent =
      '.wp-frz{position:absolute;z-index:8;top:8px;right:8px;margin:0;font:600 12px/1.3 var(--ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif);' +
      'color:var(--ink,#1c2420);background:var(--wall,var(--surface,#fbfaf6));border:1px solid var(--rule,var(--line,#9aa39c));padding:2px 8px;border-radius:10px;' +
      'pointer-events:none;opacity:.94;white-space:nowrap;max-width:calc(100% - 16px);overflow:hidden;text-overflow:ellipsis}' +
      '.wp-frz[hidden]{display:none}' +
      '.wp-frz-tl{left:8px;right:auto}.wp-frz-tc{left:50%;right:auto;transform:translateX(-50%)}.wp-frz-bl{top:auto;bottom:8px;left:8px;right:auto}' +
      '.wp-frz-host{position:relative}' +
      '.wp-frz-el:focus-visible{outline:3px solid var(--accent,var(--focus,#1d4e89));outline-offset:2px}' +
      '.wp-frz-vh{position:absolute!important;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}' +
      '@media (max-width:520px){.wp-frz{font-size:11px;padding:1px 6px}}';
    (document.head || document.documentElement).appendChild(st);
  }
  function shared() {
    if (live && live.isConnected) return;
    live = document.createElement('p'); live.className = 'wp-frz-vh'; live.setAttribute('aria-live', 'polite');
    var d = document.createElement('p'); d.className = 'wp-frz-vh'; d.id = descId;
    d.textContent = 'Click the view or press Space to freeze or play the motion. Dragging still turns or moves the view.';
    document.body.appendChild(live); document.body.appendChild(d);
  }
  function say(t) { if (!live) return; live.textContent = ''; setTimeout(function () { live.textContent = t; }, 30); }

  function attach(el, o) {
    if (!el || !o || typeof o.paused !== 'function') return null;
    if (el.__wpFreeze) return el.__wpFreeze;
    css(); if (document.body) shared();
    var tag = (el.tagName || '').toLowerCase();
    var host = o.chipHost || ((tag === 'canvas' || tag === 'svg') ? el.parentNode : el);
    if (host && getComputedStyle(host).position === 'static') host.classList.add('wp-frz-host');
    var chip = document.createElement('p');
    chip.className = 'wp-frz' + (o.chip && o.chip !== 'tr' ? ' wp-frz-' + o.chip : '');
    chip.setAttribute('aria-hidden', 'true'); chip.textContent = TEXT; chip.hidden = true;
    if (host) host.appendChild(chip);
    var v = { el: el, o: o, chip: chip, was: null };

    function isPaused() { try { return !!o.paused(); } catch (e) { return false; } }
    function sync() {
      var p = isPaused();
      chip.hidden = !p;
      var b = o.button;
      if (b && o.label !== false) {
        var t = (b.textContent || '').trim();
        if (t === 'Pause' || t === 'Play') { var want = p ? 'Play' : 'Pause'; if (t !== want) b.textContent = want; }
        b.setAttribute('aria-pressed', p ? 'true' : 'false');
      }
      v.was = p;
    }
    function toggle() {
      var before = isPaused();
      if (o.button && !o.button.disabled) o.button.click();
      else if (o.set) o.set(!before);
      sync();
      say(isPaused() ? 'Frozen. Click the view or press Space to play.' : 'Playing.');
    }
    v.sync = sync; v.toggle = toggle;
    v.bind = function (b) { if (!b || o.button === b) return v; o.button = b; b.addEventListener('click', function () { setTimeout(sync, 0); }); sync(); return v; };

    /* still click versus drag */
    var tap = null, ptrs = {};
    function count() { var k = 0; for (var id in ptrs) k++; return k; }
    function gone(e) { delete ptrs[e.pointerId]; }
    window.addEventListener('pointerup', gone, true); window.addEventListener('pointercancel', gone, true); // a pointer released anywhere is gone
    el.addEventListener('pointerdown', function (e) {
      ptrs[e.pointerId] = 1;
      if (count() > 1) { tap = null; return; }
      if (e.button !== 0 || e.isPrimary === false) { tap = null; return; }
      var t = e.target;
      if (t && t.closest && t !== el && t.closest(SKIP) && el.contains(t.closest(SKIP))) { tap = null; return; }
      if (o.ignore && o.ignore(e)) { tap = null; return; }
      tap = { id: e.pointerId, x: e.clientX, y: e.clientY, t: e.timeStamp || Date.now() }; /* event times, so a busy page does not stretch a click */
    }, true);
    el.addEventListener('pointermove', function (e) {
      if (tap && e.pointerId === tap.id && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) > MOVE) tap = null;
    }, true);
    function up(e) {
      var others = count() - (ptrs[e.pointerId] ? 1 : 0);
      var tp = tap; tap = null;
      if (!tp || e.type !== 'pointerup' || e.pointerId !== tp.id || others > 0) return;
      if ((e.timeStamp && tp.t < 1e12 ? e.timeStamp : Date.now()) - tp.t >= HOLD || Math.hypot(e.clientX - tp.x, e.clientY - tp.y) > MOVE) return;
      setTimeout(function () { if (o.picked && o.picked()) { sync(); return; } toggle(); }, 0); /* a tap that opened a part's note does not also toggle */
    }
    el.addEventListener('pointerup', up, true);
    el.addEventListener('pointercancel', up, true);

    /* keyboard: Space or Enter on the focused view */
    var kEl = o.keyEl || el;
    if (o.keys !== false && kEl) {
      if (!kEl.hasAttribute('tabindex') && !/^(a|button|input|select|textarea)$/i.test(kEl.tagName)) kEl.setAttribute('tabindex', '0');
      kEl.classList.add('wp-frz-el');
      var db = kEl.getAttribute('aria-describedby') || '';
      if (db.indexOf(descId) < 0) kEl.setAttribute('aria-describedby', (db ? db + ' ' : '') + descId);
      kEl.addEventListener('keydown', function (e) {
        if (e.target !== kEl || e.altKey || e.ctrlKey || e.metaKey) return;
        if (e.key === ' ' || e.key === 'Spacebar' || e.key === 'Enter') { e.preventDefault(); toggle(); }
      });
    }
    if (o.button) { var b0 = o.button; o.button = null; v.bind(b0); }
    el.__wpFreeze = v;
    views.push(v);
    sync();
    if (!timer) timer = setInterval(syncAll, 500);
    return v;
  }
  function syncAll() {
    for (var i = views.length - 1; i >= 0; i--) {
      var v = views[i];
      if (!v.el.isConnected) { if (v.chip.parentNode) v.chip.parentNode.removeChild(v.chip); views.splice(i, 1); continue; }
      var p; try { p = !!v.o.paused(); } catch (e) { p = false; }
      if (p !== v.was || (v.chip.hidden === p)) v.sync();
    }
    if (!views.length && timer) { clearInterval(timer); timer = 0; }
  }
  window.WPFreeze = { attach: attach, syncAll: syncAll, text: TEXT, move: MOVE, hold: HOLD, views: function () { return views.slice(); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', shared);
})();

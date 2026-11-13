/* =====================================================================
   Rentoule Projects - site behaviour (rp.js)
   Small, dependency-free. Every feature is optional: each block checks
   for its elements first, and all content is readable without JS.
   ===================================================================== */
(function () {
  'use strict';
  var d = document, w = window;
  var reduce = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function track(name) { if (w.clarity) { try { w.clarity('event', name); } catch (e) {} } }

  w.addEventListener('load', function () { d.documentElement.classList.add('loaded'); });

  /* ---- Header: solid after the dark hero, plus scroll progress ---- */
  var header = $('#rpHeader');
  var bar = $('.rp-progress');
  var heroEl = $('.hero__text') || $('.phero') || $('.gcover');
  function onScroll() {
    var y = w.scrollY;
    if (header) {
      var end = heroEl ? heroEl.offsetHeight - 80 : 10;
      header.classList.toggle('is-solid', y > end);
    }
    if (bar) {
      var max = d.documentElement.scrollHeight - w.innerHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
    }
  }
  w.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- Mobile menu (dialog) ---- */
  var menu = $('#rpMenu'), burger = $('#rpBurger'), closeBtn = $('#rpClose');
  if (menu && burger && closeBtn) {
    var openMenu = function () {
      menu.hidden = false; burger.setAttribute('aria-expanded', 'true'); d.body.style.overflow = 'hidden';
      requestAnimationFrame(function () { menu.classList.add('is-open'); setTimeout(function () { closeBtn.focus(); }, 30); });
    };
    var closeMenu = function () {
      if (menu.hidden) return;
      menu.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); d.body.style.overflow = '';
      setTimeout(function () { menu.hidden = true; }, 350); burger.focus();
    };
    burger.addEventListener('click', openMenu);
    closeBtn.addEventListener('click', closeMenu);
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) closeMenu(); });
    menu.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var f = $$('a, button', menu), first = f[0], last = f[f.length - 1];
      if (e.shiftKey && d.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && d.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', closeMenu); });
  }

  /* ---- Generic ARIA tabs ---- */
  function tabs(list, onSelect) {
    var t = $$('[role="tab"]', list);
    var p = t.map(function (x) { return d.getElementById(x.getAttribute('aria-controls')); });
    function select(i, focus) {
      t.forEach(function (x, j) { var on = i === j; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1; if (p[j]) p[j].hidden = !on; });
      if (focus) t[i].focus();
      if (list.scrollWidth > list.clientWidth) list.scrollTo({ left: t[i].offsetLeft - t[0].offsetLeft, behavior: reduce ? 'auto' : 'smooth' });
      if (onSelect) onSelect(i, t[i]);
    }
    t.forEach(function (x, i) {
      x.addEventListener('click', function () { select(i); });
      x.addEventListener('keydown', function (e) {
        var n = t.length, k = e.key, to = null;
        if (k === 'ArrowRight') to = (i + 1) % n; else if (k === 'ArrowLeft') to = (i - 1 + n) % n;
        else if (k === 'Home') to = 0; else if (k === 'End') to = n - 1;
        if (to !== null) { e.preventDefault(); select(to, true); }
      });
    });
    select(0);
    return { select: select, count: t.length };
  }

  /* Process stepper (How We Work) */
  var rail = $('#rail');
  if (rail) {
    var phases = $$('.phase'), current = 0, prev, next;
    var nav = d.createElement('div');
    nav.className = 'detail__nav';
    nav.innerHTML = '<button type="button" aria-label="Previous step"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M19 12H5M11 6l-6 6 6 6"/></svg></button><button type="button" aria-label="Next step"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>';
    prev = nav.children[0]; next = nav.children[1];
    var placeNav = function () { var panel = d.getElementById('p' + (current + 1)); if (panel) $('.detail__big', panel).appendChild(nav); };
    var steps = tabs(rail, function (i, tab) {
      current = i;
      var ph = tab.getAttribute('data-phase');
      phases.forEach(function (x) { x.classList.toggle('is-on', x.getAttribute('data-phase') === ph); });
      prev.disabled = i === 0; next.disabled = steps ? i === steps.count - 1 : false;
      placeNav();
      track('hww_step_' + (i + 1));
    });
    prev.addEventListener('click', function () { steps.select(Math.max(0, current - 1)); });
    next.addEventListener('click', function () { steps.select(Math.min(steps.count - 1, current + 1)); });
    steps.select(0);
  }

  /* Portal tabs (How We Work) */
  var ptabs = $('#ptabs');
  if (ptabs) {
    var cap = $('#pcap'), side = $$('.app [data-for]');
    tabs(ptabs, function (i, tab) {
      if (cap) cap.innerHTML = tab.getAttribute('data-cap');
      side.forEach(function (s) { s.classList.toggle('on', (' ' + s.getAttribute('data-for') + ' ').indexOf(' ' + tab.getAttribute('aria-controls') + ' ') > -1); });
      track('hww_portal_' + tab.id.replace('t-', ''));
    });
  }

  /* ---- Reveal on scroll + PSA lanes ---- */
  var rv = $$('.rv'), lanes = $('#lanes');
  if ('IntersectionObserver' in w && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add(e.target.id === 'lanes' ? 'go' : 'in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    rv.forEach(function (el) { io.observe(el); });
    if (lanes) io.observe(lanes);
  } else {
    rv.forEach(function (el) { el.classList.add('in'); });
    if (lanes) lanes.classList.add('go');
  }

  /* ---- Click-to-load video (no third-party request until asked) ---- */
  $$('[data-video]').forEach(function (box) {
    var btn = $('button', box);
    if (!btn) return;
    btn.addEventListener('click', function () {
      var f = d.createElement('iframe');
      f.src = box.getAttribute('data-video');
      f.title = box.getAttribute('data-title') || 'Video';
      f.allow = 'autoplay; fullscreen; picture-in-picture';
      f.setAttribute('allowfullscreen', '');
      box.innerHTML = ''; box.appendChild(f);
      track('video_play');
    });
  });

  /* ---- Journal filters ---- */
  var chips = $$('.chip[data-filter]');
  if (chips.length) {
    var cards = $$('[data-cat]');
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        var f = c.getAttribute('data-filter');
        chips.forEach(function (x) { x.setAttribute('aria-pressed', x === c ? 'true' : 'false'); });
        cards.forEach(function (card) { card.hidden = !(f === 'all' || card.getAttribute('data-cat') === f); });
        var live = $('#jcount'); if (live) live.textContent = cards.filter(function (x) { return !x.hidden; }).length + ' articles';
      });
    });
  }

  /* ---- Careers form (Netlify Forms). Same validation and POST as before the refresh. ---- */
  var cform = $('#career-form');
  if (cform) {
    var loaded = $('#career-form-loaded-at'); if (loaded) loaded.value = String(Date.now());
    var csuccess = $('#career-success');
    $$('[data-apply-role]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var role = btn.getAttribute('data-apply-role'), sel = $('#career-role', cform);
        if (sel && role) { Array.prototype.forEach.call(sel.options, function (o) { if (o.value === role) sel.value = role; }); }
        var target = $('#careers-apply'); if (target) target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      });
    });
    cform.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      $$('.form-group', cform).forEach(function (g) { g.classList.remove('error'); });
      ['#career-role', '#career-name', '#career-email', '#career-phone', '#career-experience', '#career-message', '#career-resume'].forEach(function (s) {
        var el = $(s, cform); if (!el) return;
        var val = el.type === 'file' ? el.files.length : el.value.trim();
        if (!val) { el.closest('.form-group').classList.add('error'); ok = false; }
      });
      var em = $('#career-email', cform);
      if (em.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.value.trim())) { em.closest('.form-group').classList.add('error'); ok = false; }
      if (!ok) { var firstErr = $('.form-group.error input, .form-group.error select, .form-group.error textarea', cform); if (firstErr) firstErr.focus(); return; }
      var btn = $('button[type="submit"]', cform), label = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Submitting...'; }
      fetch('/', { method: 'POST', body: new FormData(cform) })
        .then(function (r) { if (!r.ok) throw new Error('Submission failed'); cform.style.display = 'none'; if (csuccess) { csuccess.classList.add('show'); csuccess.focus(); } cform.reset(); })
        .catch(function () { if (btn) { btn.disabled = false; btn.textContent = label; } alert('Sorry, your submission could not be sent. Please email info@rentouleprojects.com directly.'); });
    });
  }

  /* ---- Guide: contents highlighting, progress, mobile contents sheet, sticky CTA ---- */
  var gbody = $('.gbody');
  if (gbody) {
    var chapters = $$('.gch', gbody);
    var tocLinks = $$('.gtoc a, .gsheet a');
    var meter = $('.gtoc__meter i'), mbar = $('.gmobile__bar'), mlabel = $('#gmobileLabel');
    var titles = {};
    chapters.forEach(function (c) { var h = $('h2', c); titles[c.id] = h ? h.textContent.trim() : ''; });
    if ('IntersectionObserver' in w) {
      var gio = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          var id = e.target.id;
          tocLinks.forEach(function (a) { if (a.getAttribute('href') === '#' + id) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
          if (mlabel) mlabel.textContent = titles[id];
        });
      }, { rootMargin: '-30% 0px -65% 0px' });
      chapters.forEach(function (c) { gio.observe(c); });
    }
    var sticky = $('.gsticky');
    var gProgress = function () {
      var r = gbody.getBoundingClientRect();
      var total = gbody.offsetHeight - w.innerHeight * 0.5;
      var pct = Math.max(0, Math.min(1, -r.top / (total > 0 ? total : 1)));
      if (meter) meter.style.width = (pct * 100) + '%';
      if (mbar) mbar.style.width = (pct * 100) + '%';
      if (sticky) sticky.classList.toggle('is-visible', r.top < 0 && r.bottom > w.innerHeight * 0.6);
    };
    w.addEventListener('scroll', gProgress, { passive: true }); gProgress();
    if (sticky) sticky.addEventListener('click', function () {
      if (w.fbq) { try { w.fbq('trackCustom', 'GuideGetInTouchClick'); } catch (e) {} }
      track('guide_sticky_get_in_touch');
    });

    var sheet = $('#gsheet'), scrim = $('#gscrim'), opener = $('#gsheetOpen'), shut = $('#gsheetClose');
    if (sheet && opener) {
      var openSheet = function () { sheet.classList.add('is-open'); scrim.classList.add('is-open'); opener.setAttribute('aria-expanded', 'true'); sheet.removeAttribute('inert'); setTimeout(function () { shut.focus(); }, 50); };
      var closeSheet = function () { sheet.classList.remove('is-open'); scrim.classList.remove('is-open'); opener.setAttribute('aria-expanded', 'false'); sheet.setAttribute('inert', ''); };
      sheet.setAttribute('inert', '');
      opener.addEventListener('click', openSheet);
      shut.addEventListener('click', function () { closeSheet(); opener.focus(); });
      scrim.addEventListener('click', closeSheet);
      $$('a', sheet).forEach(function (a) { a.addEventListener('click', closeSheet); });
      d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && sheet.classList.contains('is-open')) { closeSheet(); opener.focus(); } });
    }
  }
})();

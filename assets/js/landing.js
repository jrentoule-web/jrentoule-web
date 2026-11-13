/* Landing pages: section glide, big-logo-to-header, reviews carousel. Each part checks for its elements first. */
/* Section scrolling (homepage and Projects, mouse/trackpad only).
   The page takes charge of every wheel/trackpad signal from the first one, so the browser never adds
   its own movement on top (that caused an overshoot and bounce at the end of a glide).
   - Screen-sized sections: a small scroll glides (about 0.85s) to the next section and holds there.
   - Sections taller than the screen, and the reading area at the bottom: scroll smoothly under your
     fingers, stopping cleanly at their edge; the next fresh scroll carries on.
   - Leftover trackpad momentum is absorbed; a fresh scroll always gets through.
   Touch screens use soft CSS snapping. Keyboard and scrollbar settle onto the nearest section. */
(function () {
  var secs = [].slice.call(document.querySelectorAll('.hc-sec')), more = document.querySelector('.hc-more') || document.querySelector('.rp-footer');
  if (!document.body.classList.contains('hc-glide') || !secs.length || !more || !window.matchMedia('(pointer: fine)').matches) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var LEAD = 24, DUR = 850;
  var lastMag = 0, lastT = 0, lastDir = 0, acc = 0, lastWheel = 0;
  var animating = false, holdUntil = 0, holdSince = 0, holdEdge = false, timer = 0;
  var mTarget = null, mRaf = 0;                     /* free scrolling target, eased towards each frame */
  function vh() { return window.innerHeight; }
  function maxY() { return document.documentElement.scrollHeight - vh(); }
  function stops() { return secs.map(function (s) { return s.offsetTop; }).concat([more.offsetTop]); }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function stopFree() { if (mRaf) cancelAnimationFrame(mRaf); mRaf = 0; mTarget = null; }
  function glide(to, quick) {
    stopFree();
    var from = window.scrollY, dist = to - from, t0 = 0, dur = quick ? 320 : DUR;
    if (Math.abs(dist) < 1) return;
    animating = true; holdUntil = Date.now() + dur + 200; holdSince = Date.now(); holdEdge = false; to = Math.round(to);
    if (reduce) { window.scrollTo(0, to); animating = false; return; }
    (function step(ts) {
      if (!t0) t0 = ts; var k = Math.min(1, (ts - t0) / dur);
      window.scrollTo(0, k < 1 ? from + dist * ease(k) : to);
      if (k < 1) requestAnimationFrame(step); else animating = false;
    })(performance.now());
  }
  /* free scrolling: move towards a target, clamped to [lo, hi]; returns true if the clamp was hit */
  function freeScroll(delta, lo, hi) {
    var base = mTarget === null ? window.scrollY : mTarget, t = base + delta, hit = false;
    if (t <= lo) { t = lo; hit = delta < 0; } else if (t >= hi) { t = hi; hit = delta > 0; }
    mTarget = t;
    if (!mRaf) mRaf = requestAnimationFrame(function frame() {
      var y = window.scrollY, d = mTarget - y;
      if (Math.abs(d) < 0.6 || reduce) { window.scrollTo(0, mTarget); mRaf = 0; mTarget = null; return; }
      window.scrollTo(0, y + d * 0.3); mRaf = requestAnimationFrame(frame);
    });
    return hit;
  }
  /* where are we? the section containing y, and the free-scroll range for it */
  function zone(y) {
    var st = stops(), moreTop = st[st.length - 1], i = 0;
    if (y >= moreTop - 1) return { free: true, lo: moreTop, hi: maxY() };
    while (i < st.length - 2 && st[i + 1] <= y + 1) i++;
    var top = st[i], bottom = st[i + 1];
    return { tall: bottom - top > vh() + 4, top: top, bottom: bottom, lo: top, hi: bottom - vh() };
  }
  function targetFor(y, down) {
    var st = stops(), i;
    if (down) { for (i = 0; i < st.length; i++) if (st[i] > y + 1) return st[i]; return null; }
    for (i = st.length - 1; i >= 0; i--) if (st[i] < y - 1) { var c = y - vh(); return Math.round(c - st[i] < 4 ? st[i] : Math.max(st[i], c)); }   /* a tall section above: land on its lower part */
    return 0;
  }
  function nearest(y) { var st = stops(), b = st[0]; st.forEach(function (t) { if (Math.abs(t - y) < Math.abs(b - y)) b = t; }); return b; }

  window.addEventListener('wheel', function (e) {
    if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY) || document.documentElement.classList.contains('hc-lb-open')) return;
    e.preventDefault();                                   /* from the very first signal: no browser movement of its own */
    var now = Date.now(), down = e.deltaY > 0, delta = e.deltaY * (e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? vh() : 1);
    var mag = Math.abs(delta), dir = down ? 1 : -1;
    var gap = now - lastT, lastDirPrev = lastDir, fresh = gap > 120 || mag > lastMag * 1.4 + 2 || (lastDir && dir !== lastDir);
    lastMag = mag; lastT = now; lastDir = dir; lastWheel = now;
    if (animating) return;                                /* mid-glide: absorbed */
    /* after a glide or at an edge, leftover momentum is absorbed. At an edge only a pause or a change of
       direction releases it (the gesture that reached the edge is still strengthening at first). */
    if (now < holdUntil) {
      /* at an edge: a pause, a change of direction, or a new swipe that starts while the last one is still
         fading out (trackpads keep sending a decaying tail, so a pause may never come) */
      var held = now - holdSince;
      var release = holdEdge ? (gap > 120 || (lastDirPrev && dir !== lastDirPrev) || (fresh && held > 350) || held > 1200)
                             : (fresh && held > 150);
      if (!release) { holdUntil = now + 200; return; }
    }
    holdUntil = 0; holdEdge = false;
    var y = mTarget === null ? window.scrollY : mTarget, z = zone(y);
    /* reading area at the bottom, and sections taller than the screen: scroll freely within them */
    var inside = z.free ? (down || y > z.lo + 1) : (z.tall && (down ? y < z.hi - 1 : y > z.lo + 1));
    if (inside) {
      acc = 0;
      if (freeScroll(delta, z.lo, z.hi)) { holdUntil = now + 250; holdSince = now; holdEdge = true; }   /* reached the edge: stop cleanly, absorb the rest */
      return;
    }
    /* screen-sized sections: a small scroll is enough to glide to the next one */
    if (gap > 250 || (acc > 0) !== down) acc = 0;
    acc += delta;
    if (Math.abs(acc) >= LEAD) {
      acc = 0;
      var t = targetFor(window.scrollY, down);
      if (t !== null) glide(Math.min(t, maxY()));
    }
  }, { passive: false });

  /* keyboard, scrollbar and anything else: settle onto the nearest section once movement stops */
  window.addEventListener('scroll', function () {
    if (animating || mRaf || Date.now() - lastWheel < 400) return;
    clearTimeout(timer);
    timer = setTimeout(function () {
      var y = window.scrollY, z = zone(y), n = nearest(y);
      if (animating || mRaf || z.free || z.tall) return;
      if (Math.abs(n - y) > 1) glide(n, Math.abs(n - y) < 200);
    }, 160);
  }, { passive: true });
})();

/* Big hero logo that travels up and shrinks into the header logo as you leave the hero */
document.addEventListener('DOMContentLoaded', function () {
  var slot = document.querySelector('.hc-biglogo'), hero = document.querySelector('.hc-hero'),
      header = document.getElementById('rpHeader'), hlogo = header && header.querySelector('.rp-logo');
  if (!slot || !hero || !header || !hlogo || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var fly = slot.cloneNode(); fly.className = 'hc-fly'; fly.removeAttribute('loading'); document.body.appendChild(fly);
  document.documentElement.classList.add('hc-morph');
  var s0 = null, e0 = null;
  function measure() {
    var y = window.scrollY, r = slot.getBoundingClientRect(), h = hlogo.getBoundingClientRect();
    s0 = { x: r.left, y: r.top + y, w: r.width };
    var ar = slot.naturalWidth && slot.naturalHeight ? slot.naturalWidth / slot.naturalHeight : 3.3, ew = Math.min(h.width, h.height * ar);
    e0 = { x: h.left, y: h.top + (h.height - ew / ar) / 2, w: ew };
    fly.style.width = s0.w + 'px';
  }
  function frame() {
    if (!s0) measure();
    var y = window.scrollY, span = hero.offsetHeight * 0.85, t = Math.max(0, Math.min(1, y / span));
    /* straight path from its place in the hero (as first seen) to the header logo, shrinking as it goes */
    var x = s0.x + (e0.x - s0.x) * t, top = s0.y + (e0.y - s0.y) * t, sc = 1 + (e0.w / s0.w - 1) * t;
    fly.style.transform = 'translate(' + x + 'px,' + top + 'px) scale(' + sc + ')';
    var done = t >= 0.98;
    fly.style.opacity = done ? 0 : 1;
    hlogo.style.opacity = done ? 1 : 0;
    header.classList.toggle('is-solid', y > hero.offsetHeight - 90);  /* stay transparent over the hero */
  }
  window.addEventListener('scroll', frame, { passive: true });
  window.addEventListener('resize', function () { s0 = null; frame(); });
  if (slot.complete) frame(); else slot.addEventListener('load', frame);
  frame();
});

/* Reviews carousel: arrows, dots, swipe; slow auto-advance that pauses on hover/focus and stops once you interact */
document.addEventListener('DOMContentLoaded', function () {
  var car = document.querySelector('.hc-car'); if (!car) return;
  var track = car.querySelector('.hc-track'), slides = [].slice.call(track.children), dots = [].slice.call(car.querySelectorAll('.hc-dots button')),
      prev = car.querySelector('[data-dir="-1"]'), next = car.querySelector('[data-dir="1"]');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches, auto = !reduce, paused = false, timer;
  function perView() { return Math.max(1, Math.round(track.clientWidth / slides[0].getBoundingClientRect().width)); }
  function index() { var x = track.scrollLeft, b = 0; slides.forEach(function (s, i) { if (Math.abs(s.offsetLeft - track.offsetLeft - x) < Math.abs(slides[b].offsetLeft - track.offsetLeft - x)) b = i; }); return b; }
  function go(i) { var max = slides.length - perView(); i = Math.max(0, Math.min(max, i)); track.scrollTo({ left: slides[i].offsetLeft - track.offsetLeft, behavior: reduce ? 'auto' : 'smooth' }); }
  function update() {
    var i = index(), pv = perView(), max = slides.length - pv, pages = Math.ceil(slides.length / pv), cur = i >= max ? pages - 1 : Math.round(i / pv);
    dots.forEach(function (d, k) { d.hidden = k >= pages; d.setAttribute('aria-current', k === cur ? 'true' : 'false'); d.setAttribute('aria-label', 'Show reviews, page ' + (k + 1) + ' of ' + pages); });
    prev.disabled = i <= 0; next.disabled = i >= max;
  }
  function stopAuto() { auto = false; clearInterval(timer); }
  prev.addEventListener('click', function () { stopAuto(); go(index() - perView()); });
  next.addEventListener('click', function () { stopAuto(); go(index() + perView()); });
  dots.forEach(function (d, k) { d.addEventListener('click', function () { stopAuto(); go(k * perView()); }); });
  ['pointerdown', 'touchstart', 'keydown'].forEach(function (ev) { track.addEventListener(ev, stopAuto, { passive: true }); });
  car.addEventListener('mouseenter', function () { paused = true; }); car.addEventListener('mouseleave', function () { paused = false; });
  car.addEventListener('focusin', function () { paused = true; }); car.addEventListener('focusout', function () { paused = false; });
  var raf; track.addEventListener('scroll', function () { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); }, { passive: true });
  window.addEventListener('resize', update);
  if (auto) timer = setInterval(function () {
    if (!auto || paused || document.hidden) return;
    var r = car.getBoundingClientRect(); if (r.bottom < 0 || r.top > window.innerHeight) return;   /* only while on screen */
    var i = index(), max = slides.length - perView(); go(i >= max ? 0 : i + perView());
  }, 8000);
  update();
});

/* Pages with a full-screen photo hero but no big logo: keep the header see-through over the hero */
document.addEventListener('DOMContentLoaded', function () {
  var hero = document.querySelector('.hc-hero'), header = document.getElementById('rpHeader');
  if (!hero || !header || document.querySelector('.hc-biglogo')) return;
  function f() { header.classList.toggle('is-solid', window.scrollY > hero.offsetHeight - 90); }
  window.addEventListener('scroll', f, { passive: true }); f();
});

/* Photo viewer: small project photos open large. Arrow keys or buttons move within that project; Escape or a click outside closes. */
document.addEventListener('DOMContentLoaded', function () {
  var links = [].slice.call(document.querySelectorAll('a.hc-zoom'));
  if (!links.length || typeof HTMLDialogElement === 'undefined') return;   /* without support the links simply open the photo */
  var dlg = document.createElement('dialog');
  dlg.className = 'hc-lb';
  dlg.setAttribute('aria-label', 'Photo viewer');
  dlg.innerHTML = '<figure><img alt=""><figcaption></figcaption></figure>' +
    '<button type="button" class="hc-lb__btn hc-lb__close" aria-label="Close">&times;</button>' +
    '<button type="button" class="hc-lb__btn hc-lb__prev" aria-label="Previous photo">&#8249;</button>' +
    '<button type="button" class="hc-lb__btn hc-lb__next" aria-label="Next photo">&#8250;</button>';
  document.body.appendChild(dlg);
  var img = dlg.querySelector('img'), cap = dlg.querySelector('figcaption'), group = [], at = 0, opener = null;
  function show(i) {
    at = (i + group.length) % group.length;
    var a = group[at], t = a.querySelector('img');
    img.src = a.getAttribute('href'); img.alt = t ? t.alt : ''; cap.textContent = t ? t.alt : '';
    dlg.classList.toggle('hc-lb--single', group.length < 2);
  }
  links.forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
      e.preventDefault();
      var box = a.closest('.hc-thumbs') || a.parentNode;
      group = [].slice.call(box.querySelectorAll('a.hc-zoom'));
      opener = a; show(group.indexOf(a));
      dlg.showModal(); document.documentElement.classList.add('hc-lb-open');
    });
  });
  dlg.querySelector('.hc-lb__close').addEventListener('click', function () { dlg.close(); });
  dlg.querySelector('.hc-lb__prev').addEventListener('click', function () { show(at - 1); });
  dlg.querySelector('.hc-lb__next').addEventListener('click', function () { show(at + 1); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg || e.target.tagName === 'FIGURE') dlg.close(); });
  dlg.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); show(at + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(at - 1); }
  });
  dlg.addEventListener('close', function () { document.documentElement.classList.remove('hc-lb-open'); img.removeAttribute('src'); if (opener) opener.focus(); });
});

/* Phones and tablets: snapping applies to the full-screen sections only. Once the page comes to rest in the
   reading area at the bottom (FAQ, guides, footer), snapping is switched off so it scrolls like a normal page;
   coming back up into the sections switches it on again. */
document.addEventListener('DOMContentLoaded', function () {
  var more = document.querySelector('.hc-more') || document.querySelector('.rp-footer');   /* Projects: the footer is its reading area */
  if (!document.body.classList.contains('hc-glide') || !more || !window.matchMedia('(pointer: coarse)').matches) return;
  var root = document.documentElement, t = 0;
  function update() { root.classList.toggle('hc-free', window.scrollY >= more.offsetTop - 2); }
  window.addEventListener('scroll', function () {
    if (!root.classList.contains('hc-free') && window.scrollY >= more.offsetTop - 2) { root.classList.add('hc-free'); return; }   /* entering: release straight away */
    clearTimeout(t); t = setTimeout(update, 140);                                                                                /* leaving: once the page has settled */
  }, { passive: true });
  update();
});

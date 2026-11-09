/* Landing pages: section glide, big-logo-to-header, reviews carousel. Each part checks for its elements first. */
/* Section scrolling: a small scroll towards the next section is enough. The page then glides there
   (about 0.85s) and holds, absorbing leftover trackpad momentum, until you scroll again.
   Touch screens use soft CSS snapping. Keyboard and scrollbar settle onto the nearest section. */
(function () {
  var secs = [].slice.call(document.querySelectorAll('.hc-sec')), more = document.querySelector('.hc-more') || document.querySelector('.rp-footer');
  /* only pages that opt in (body.hc-glide): the homepage and Projects. Reading pages scroll normally. */
  if (!document.body.classList.contains('hc-glide') || !secs.length || !more || !window.matchMedia('(pointer: fine)').matches) return;
  var wasTall = false;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var LEAD = 24, DUR = 850, lastMag = 0, lastT = 0, lastDir = 0;
  var anim = 0, animating = false, holdUntil = 0, acc = 0, lastWheel = 0, timer = 0;
  function stops() { return secs.map(function (s) { return s.offsetTop; }).concat([more.offsetTop]); }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  var settling = false;
  function glide(to, settle) {
    var from = window.scrollY, dist = to - from, t0 = 0, dur = settle ? 320 : DUR;
    if (Math.abs(dist) < 2) return;
    settling = !!settle; animating = true; holdUntil = settle ? 0 : Date.now() + DUR + 200;
    if (reduce) { window.scrollTo(0, to); animating = false; return; }
    function step(ts) {
      if (!animating) return;
      if (!t0) t0 = ts; var k = Math.min(1, (ts - t0) / dur);
      window.scrollTo(0, Math.round(from + dist * ease(k)));
      if (k < 1) anim = requestAnimationFrame(step); else { animating = false; settling = false; }
    }
    anim = requestAnimationFrame(step);
  }
  function targetFor(y, down) {
    var st = stops(), last = st[st.length - 1], i;
    if (down) { for (i = 0; i < st.length; i++) if (st[i] > y + 2) return st[i]; return null; }
    for (i = st.length - 1; i >= 0; i--) if (st[i] < y - 2) return Math.max(st[i], y - window.innerHeight); return 0;
  }
  /* sections taller than the screen are read with normal scrolling until their edge is reached */
  function inTall(y, down) {
    var st = stops(), vh = window.innerHeight, i = 0;
    while (i < st.length - 2 && st[i + 1] <= y + 2) i++;
    var top = st[i], bottom = st[i + 1];
    if (bottom - top <= vh + 4) return false;
    return down ? y + vh < bottom - 2 : y > top + 2;
  }
  function nearest(y) { var st = stops(), b = st[0]; st.forEach(function (t) { if (Math.abs(t - y) < Math.abs(b - y)) b = t; }); return b; }
  window.addEventListener('wheel', function (e) {
    if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    var now = Date.now(), y = window.scrollY, moreTop = more.offsetTop, down = e.deltaY > 0;
    /* Tell leftover trackpad momentum (a fading tail of small signals) from a fresh scroll
       (signals getting stronger again, a short pause, or a change of direction). */
    var mag = Math.abs(e.deltaY), gap = now - lastT, dir = down ? 1 : -1;
    var fresh = gap > 120 || mag > lastMag * 1.4 + 2 || (lastDir && dir !== lastDir);
    lastMag = mag; lastT = now; lastDir = dir;
    if (y >= moreTop - 2 && (down || y > moreTop + 2)) return;            /* free reading in the final section */
    if (settling) { cancelAnimationFrame(anim); animating = false; settling = false; }   /* a small ease-back never blocks a real scroll */
    if (!animating && now < holdUntil && fresh) holdUntil = 0;          /* a new scroll is never ignored */
    if (animating || now < holdUntil) { e.preventDefault(); if (!animating) holdUntil = now + 200; return; }
    if (now - lastWheel > 250 || (acc > 0) !== down) acc = 0;
    lastWheel = now; acc += e.deltaY;
    clearTimeout(timer);
    if (inTall(y, down)) { acc = 0; wasTall = true; return; }   /* let a tall section scroll normally */
    if (wasTall) {                       /* just reached the edge of a long section: stop here and absorb the momentum */
      wasTall = false; e.preventDefault(); acc = 0; holdUntil = now + 250; return;
    }
    if (Math.abs(acc) >= LEAD) {
      e.preventDefault(); acc = 0;
      var t = targetFor(y, down); if (t !== null) glide(t);
      return;
    }
    timer = setTimeout(function () { var yy = window.scrollY; if (!animating && yy < more.offsetTop - 2 && !inTall(yy, true) && !inTall(yy, false)) glide(nearest(yy), true); }, 260);
  }, { passive: false });
  /* keyboard, scrollbar and anything else: settle onto the nearest section once movement stops */
  window.addEventListener('scroll', function () {
    if (animating || Date.now() - lastWheel < 300) return;
    clearTimeout(timer);
    timer = setTimeout(function () { var y = window.scrollY, n = nearest(y); if (!animating && y < more.offsetTop - 2 && !inTall(y, true) && !inTall(y, false)) glide(n, Math.abs(n - y) < 200); }, 140);
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

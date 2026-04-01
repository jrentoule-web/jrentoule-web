/* ============================================
   RENTOULE PROJECTS — App JS
   ============================================ */

(function () {
  'use strict';

  // --- Theme Toggle ---
  const toggle = document.querySelector('[data-theme-toggle]');
  const root = document.documentElement;
  let currentTheme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  root.setAttribute('data-theme', currentTheme);
  updateToggleIcon();

  if (toggle) {
    toggle.addEventListener('click', function () {
      currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', currentTheme);
      toggle.setAttribute('aria-label', 'Switch to ' + (currentTheme === 'dark' ? 'light' : 'dark') + ' mode');
      updateToggleIcon();
    });
  }

  function updateToggleIcon() {
    if (!toggle) return;
    toggle.innerHTML = currentTheme === 'dark'
      ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
      : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  }

  // --- Header Scroll ---
  const header = document.querySelector('.site-header');
  let lastScroll = 0;
  window.addEventListener('scroll', function () {
    const scrollY = window.scrollY;
    if (scrollY > 60) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    lastScroll = scrollY;
  }, { passive: true });

  // --- Mobile Nav ---
  const mobileToggle = document.querySelector('.mobile-toggle');
  const mobileNav = document.querySelector('.mobile-nav');

  if (mobileToggle) {
    mobileToggle.addEventListener('click', function () {
      const isOpen = mobileNav.classList.contains('open');
      mobileNav.classList.toggle('open');
      mobileToggle.classList.toggle('active');
      mobileToggle.setAttribute('aria-expanded', !isOpen);
      document.body.style.overflow = isOpen ? '' : 'hidden';
    });
  }

  // Close mobile nav on link click
  if (mobileNav) {
    mobileNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mobileNav.classList.remove('open');
        mobileToggle.classList.remove('active');
        mobileToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  // --- Hash-based Page Routing ---
  function showPage(pageId) {
    document.querySelectorAll('.page').forEach(function (p) {
      p.classList.remove('active');
    });
    var target = document.getElementById('page-' + pageId);
    if (target) {
      target.classList.add('active');
    } else {
      document.getElementById('page-home').classList.add('active');
    }

    // Update active nav
    document.querySelectorAll('.main-nav a:not(.theme-toggle)').forEach(function (a) {
      a.classList.remove('active');
      if (a.getAttribute('href') === '#' + pageId) {
        a.classList.add('active');
      }
    });

    // Scroll to top
    window.scrollTo(0, 0);

    // Re-trigger reveal animations
    setTimeout(initReveal, 100);

    // Update document title for SEO
    updateTitle(pageId);
  }

  function updateTitle(pageId) {
    var titles = {
      'home': 'Rentoule Projects | Premium Home Renovations, Extensions & New Builds in Canberra',
      'about': 'About Us | Rentoule Projects — Canberra Builder',
      'services': 'Our Services | Home Renovations, Extensions & New Builds | Rentoule Projects',
      'case-studies': 'Case Studies | Our Work | Rentoule Projects Canberra',
      'blog': 'Blog | Building & Renovation Insights | Rentoule Projects',
      'careers': 'Careers | Join Our Team | Rentoule Projects Canberra',
      'contact': 'Contact Us | Request a Consultation | Rentoule Projects'
    };
    document.title = titles[pageId] || titles['home'];
  }

  function handleHash() {
    var hash = window.location.hash.replace('#', '') || 'home';
    showPage(hash);
  }

  window.addEventListener('hashchange', handleHash);
  // Run on load
  handleHash();

  // --- Scroll Reveal ---
  function initReveal() {
    var reveals = document.querySelectorAll('.reveal:not(.visible)');
    if (!reveals.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    reveals.forEach(function (el) { observer.observe(el); });
  }
  initReveal();

  // --- FAQ Accordion ---
  document.querySelectorAll('.faq-question').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.faq-item');
      var isOpen = item.classList.contains('open');

      // Close all other items
      document.querySelectorAll('.faq-item.open').forEach(function (openItem) {
        if (openItem !== item) openItem.classList.remove('open');
      });

      item.classList.toggle('open');
      btn.setAttribute('aria-expanded', !isOpen);
    });
  });

  // --- Form Submit Handler ---
  window.handleFormSubmit = function (e) {
    e.preventDefault();
    var form = e.target;
    var btn = form.querySelector('button[type="submit"]');
    var originalText = btn.textContent;
    btn.textContent = 'Sending...';
    btn.disabled = true;

    // Simulate send (in production, this would POST to a server)
    setTimeout(function () {
      btn.textContent = 'Message Sent!';
      btn.style.background = '#3d7a2b';
      form.reset();
      setTimeout(function () {
        btn.textContent = originalText;
        btn.style.background = '';
        btn.disabled = false;
      }, 3000);
    }, 1000);
  };

  // --- Service Detail Navigation ---
  window.showServiceDetail = function (service) {
    setTimeout(function () {
      var el = document.getElementById('service-' + service);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 200);
  };

})();

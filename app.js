/* ========================================
   Rentoule Projects - App Logic
   ======================================== */

(function () {
  'use strict';

  // ============ ROUTER ============
  const pages = document.querySelectorAll('.page');
  const navLinks = document.querySelectorAll('[data-nav]');
  const mobileNav = document.querySelector('.nav__mobile');
  const hamburger = document.querySelector('.nav__hamburger');

  function getHash() {
    const hash = window.location.hash.replace('#', '') || 'home';
    return hash;
  }

  function navigateTo(pageId) {
    // Hide all pages
    pages.forEach(p => p.classList.remove('active'));

    // Show target page
    const target = document.getElementById('page-' + pageId);
    if (target) {
      target.classList.add('active');
    } else {
      // Fallback to home
      document.getElementById('page-home').classList.add('active');
      pageId = 'home';
    }

    // Update nav active state
    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('data-nav') === pageId);
    });

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Close mobile nav if open
    closeMobileNav();

    // Re-trigger scroll reveals for new page
    setTimeout(checkReveal, 100);

    // Re-initialise BA sliders when navigating to projects page
    if (pageId === 'projects') {
      setTimeout(resetBASliders, 150);
    }
  }

  // Listen for hash changes
  window.addEventListener('hashchange', () => {
    navigateTo(getHash());
  });

  // Initial load
  document.addEventListener('DOMContentLoaded', () => {
    navigateTo(getHash());
    initTestimonialSlider();
    initFAQ();
    initContactForm();
    initCareerForm();
    initScrollReveal();
    initBASliders();
  });

  // ============ MOBILE NAV ============
  function closeMobileNav() {
    if (mobileNav) mobileNav.classList.remove('open');
    if (hamburger) {
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    }
    if (mobileNav) mobileNav.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (hamburger) {
    hamburger.addEventListener('click', () => {
      const isOpen = mobileNav.classList.toggle('open');
      hamburger.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', isOpen);
      mobileNav.setAttribute('aria-hidden', !isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
  }

  // Close mobile nav on link click
  if (mobileNav) {
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMobileNav);
    });
  }

  // ============ TESTIMONIAL SLIDER ============
  function initTestimonialSlider() {
    const slider = document.querySelector('.testimonials-slider');
    if (!slider) return;

    const track = slider.querySelector('.testimonials-track');
    const slides = slider.querySelectorAll('.testimonial-slide');
    const dots = slider.querySelectorAll('.testimonials-dot');
    let currentSlide = 0;
    let autoPlayTimer;

    function goToSlide(index) {
      if (index < 0) index = slides.length - 1;
      if (index >= slides.length) index = 0;
      currentSlide = index;
      track.style.transform = `translateX(-${currentSlide * 100}%)`;
      dots.forEach((dot, i) => dot.classList.toggle('active', i === currentSlide));
    }

    // Dot clicks
    dots.forEach(dot => {
      dot.addEventListener('click', () => {
        goToSlide(parseInt(dot.getAttribute('data-slide')));
        resetAutoPlay();
      });
    });

    // Auto-play
    function startAutoPlay() {
      autoPlayTimer = setInterval(() => goToSlide(currentSlide + 1), 6000);
    }

    function resetAutoPlay() {
      clearInterval(autoPlayTimer);
      startAutoPlay();
    }

    startAutoPlay();

    // Touch support
    let touchStartX = 0;
    let touchEndX = 0;

    track.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    track.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          goToSlide(currentSlide + 1);
        } else {
          goToSlide(currentSlide - 1);
        }
        resetAutoPlay();
      }
    }, { passive: true });
  }

  // ============ FAQ ACCORDION ============
  function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
      const question = item.querySelector('.faq-question');
      question.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');

        // Close all
        faqItems.forEach(i => {
          i.classList.remove('open');
          i.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
        });

        // Open clicked (if wasn't open)
        if (!isOpen) {
          item.classList.add('open');
          question.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  // ============ CONTACT FORM VALIDATION ============
  function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    const successEl = document.getElementById('form-success');

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      let isValid = true;

      // Reset errors
      form.querySelectorAll('.form-group').forEach(g => g.classList.remove('error'));

      // Name
      const name = form.querySelector('#contact-name');
      if (!name.value.trim()) {
        name.closest('.form-group').classList.add('error');
        isValid = false;
      }

      // Email
      const email = form.querySelector('#contact-email');
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.value.trim())) {
        email.closest('.form-group').classList.add('error');
        isValid = false;
      }

      // Service
      const service = form.querySelector('#contact-service');
      if (!service.value) {
        service.closest('.form-group').classList.add('error');
        isValid = false;
      }

      // Message
      const message = form.querySelector('#contact-message');
      if (!message.value.trim()) {
        message.closest('.form-group').classList.add('error');
        isValid = false;
      }

      if (isValid) {
        submitNetlifyForm(form, successEl);
      }
    });
  }

  // ============ NETLIFY FORM SUBMISSION ============
  function submitNetlifyForm(form, successEl) {
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalLabel = submitBtn ? submitBtn.textContent : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';
    }

    const formData = new FormData(form);

    fetch('/', {
      method: 'POST',
      body: formData
    })
      .then((response) => {
        if (!response.ok) throw new Error('Submission failed');
        form.style.display = 'none';
        if (successEl) successEl.classList.add('show');
        form.reset();
      })
      .catch(() => {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalLabel;
        }
        alert('Sorry, your submission could not be sent. Please email info@rentouleprojects.com directly.');
      });
  }

  // ============ CAREER APPLICATION FORM ============
  function initCareerForm() {
    const form = document.getElementById('career-form');
    if (!form) return;

    const successEl = document.getElementById('career-success');

    // Apply button: scroll to form within careers page and pre-select role
    document.querySelectorAll('[data-apply-role]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const role = btn.getAttribute('data-apply-role');
        const select = form.querySelector('#career-role');
        if (select && role) {
          for (const opt of select.options) {
            if (opt.value === role) {
              select.value = role;
              break;
            }
          }
        }
        // Smooth scroll to the form
        const target = document.getElementById('careers-apply');
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let isValid = true;
      form.querySelectorAll('.form-group').forEach((g) => g.classList.remove('error'));

      const required = ['#career-role', '#career-name', '#career-email', '#career-phone', '#career-experience', '#career-message', '#career-resume'];
      required.forEach((sel) => {
        const el = form.querySelector(sel);
        if (!el) return;
        const val = el.type === 'file' ? el.files.length : el.value.trim();
        if (!val) {
          el.closest('.form-group').classList.add('error');
          isValid = false;
        }
      });

      // Email format
      const email = form.querySelector('#career-email');
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (email.value.trim() && !emailRegex.test(email.value.trim())) {
        email.closest('.form-group').classList.add('error');
        isValid = false;
      }

      if (isValid) {
        submitNetlifyForm(form, successEl);
      }
    });
  }

  // ============ BEFORE/AFTER SLIDER ============
  function resetBASliders() {
    document.querySelectorAll('.ba-slider').forEach(slider => {
      const handle = slider.querySelector('.ba-slider__handle');
      const before = slider.querySelector('.ba-slider__before');
      const rect = slider.getBoundingClientRect();
      if (rect.width === 0) return;
      handle.style.left = '50%';
      before.style.clipPath = 'inset(0 50% 0 0)';
    });
  }

  function initBASliders() {
    document.querySelectorAll('.ba-slider').forEach(slider => {
      const handle = slider.querySelector('.ba-slider__handle');
      const before = slider.querySelector('.ba-slider__before');
      let isDragging = false;

      function setPosition(x) {
        const rect = slider.getBoundingClientRect();
        let pos = (x - rect.left) / rect.width;
        pos = Math.max(0.05, Math.min(0.95, pos));
        handle.style.left = (pos * 100) + '%';
        before.style.clipPath = 'inset(0 ' + ((1 - pos) * 100) + '% 0 0)';
      }

      // Set initial position to 50%
      function initPosition() {
        const rect = slider.getBoundingClientRect();
        setPosition(rect.left + rect.width / 2);
      }

      // Initialise on load and on page show (rect may be zero when hidden)
      setTimeout(initPosition, 50);

      // Mouse events
      slider.addEventListener('mousedown', (e) => {
        isDragging = true;
        setPosition(e.clientX);
        e.preventDefault();
      });
      window.addEventListener('mousemove', (e) => {
        if (isDragging) setPosition(e.clientX);
      });
      window.addEventListener('mouseup', () => { isDragging = false; });

      // Touch events
      slider.addEventListener('touchstart', (e) => {
        isDragging = true;
        setPosition(e.touches[0].clientX);
      }, { passive: true });
      window.addEventListener('touchmove', (e) => {
        if (isDragging) setPosition(e.touches[0].clientX);
      }, { passive: true });
      window.addEventListener('touchend', () => { isDragging = false; });
    });
  }

  // ============ SCROLL REVEAL ============
  function initScrollReveal() {
    checkReveal();
    window.addEventListener('scroll', checkReveal, { passive: true });
  }

  function checkReveal() {
    const reveals = document.querySelectorAll('.reveal');
    const windowHeight = window.innerHeight;

    reveals.forEach(el => {
      const top = el.getBoundingClientRect().top;
      const threshold = windowHeight * 0.88;
      if (top < threshold) {
        el.classList.add('visible');
      }
    });
  }

})();

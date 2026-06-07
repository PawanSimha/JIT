document.addEventListener('DOMContentLoaded', () => {

  // ── Scroll to top on refresh ──
  window.scrollTo(0, 0);

  // ── FAQ accordion ──
  document.querySelectorAll('.faq-q').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(el => el.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });

  // ── Reveal on scroll ──
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('section, .ext-card, .contact-card, .about-art').forEach(el => {
    el.classList.add('reveal');
    observer.observe(el);
  });

  // ── Contact form ──
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      const btn = e.target.querySelector('button');
      btn.textContent = 'Sending...';
      btn.disabled = true;
    });
  }

  // ── Mobile menu toggle ──
  const headerToggle = document.getElementById('headerToggle');
  const headerNav = document.getElementById('headerNav');
  if (headerToggle && headerNav) {
    headerToggle.addEventListener('click', () => {
      headerToggle.classList.toggle('open');
      headerNav.classList.toggle('open');
    });
    headerNav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        headerToggle.classList.remove('open');
        headerNav.classList.remove('open');
      });
    });
  }

});

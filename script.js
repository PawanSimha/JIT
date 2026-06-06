document.addEventListener('DOMContentLoaded', () => {

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
      e.preventDefault();
      const btn = e.target.querySelector('button');
      const orig = btn.textContent;
      btn.textContent = 'Sent!';
      btn.style.opacity = '0.7';
      setTimeout(() => {
        e.target.reset();
        btn.textContent = orig;
        btn.style.opacity = '1';
      }, 2200);
    });
  }

});

/* JIT - Browser Extension Studio
 * Copyright (C) 2026  Pawan Simha R
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

(function () {
  'use strict';

  const doc = document;
  const win = window;

  /* ── Scroll to top on fresh page load ── */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  win.scrollTo(0, 0);

  /* ── Mobile menu toggle ── */
  const toggle = doc.getElementById('headerToggle');
  const nav = doc.getElementById('headerNav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      toggle.classList.toggle('open');
      nav.classList.toggle('open');
    });
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        toggle.setAttribute('aria-expanded', 'false');
        toggle.classList.remove('open');
        nav.classList.remove('open');
      });
    });
  }

  /* ── FAQ accordion ── */
  doc.querySelectorAll('.faq-q').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const item = btn.closest('.faq-item');
      const wasOpen = item.classList.contains('open');
      doc.querySelectorAll('.faq-item.open').forEach(function (el) {
        el.classList.remove('open');
        el.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
      });
      if (!wasOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ── Scroll reveal with IntersectionObserver ── */
  const revealTargets = doc.querySelectorAll('section, .ext-card, .contact-card, .about-art');
  if ('IntersectionObserver' in win && revealTargets.length) {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    revealTargets.forEach(function (el) {
      el.classList.add('reveal');
      observer.observe(el);
    });
  } else {
    revealTargets.forEach(function (el) { el.classList.add('visible'); });
  }

  /* ── Contact form ── */
  const form = doc.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      const btn = form.querySelector('button[type="submit"]');
      if (btn) {
        btn.textContent = 'Sending\u2026';
        btn.disabled = true;
      }
    });
  }

  /* ── Extension install modal ── */
  const installLinks = doc.querySelectorAll('.ext-link[download], .btn[download]');
  const installModal = doc.getElementById('installModal');
  const modalClose = doc.getElementById('modalClose');
  const modalIcon = doc.getElementById('modalIcon');
  const modalTitle = doc.getElementById('modalTitle');

  if (installLinks.length && installModal) {
    const extMap = {
      mutedhue: { name: 'MutedHue', icon: 'MutedHue/icons/MutedHue.png' },
      refreshner: { name: 'Refreshner', icon: 'Refreshner/icons/Refreshner.png' },
      goofanizer: { name: 'Goofanizer', icon: 'Goofanizer/assets/Icon.png' },
      imageination: { name: 'Imageination', icon: 'Imageination/icons/Imageination.png' }
    };

    function openInstallModal(ext) {
      const entry = extMap[ext] || { name: 'Extension', icon: 'Logo.webp' };
      if (modalIcon) { modalIcon.src = entry.icon; modalIcon.alt = entry.name; }
      if (modalTitle) modalTitle.textContent = 'Install ' + entry.name;
      installModal.classList.add('open');
      installModal.setAttribute('aria-hidden', 'false');
      doc.body.style.overflow = 'hidden';
    }

    function closeInstallModal() {
      installModal.classList.remove('open');
      installModal.setAttribute('aria-hidden', 'true');
      doc.body.style.overflow = '';
    }

    installLinks.forEach(function (link) {
      link.addEventListener('click', function (e) {
        const ext = this.getAttribute('data-ext');
        openInstallModal(ext);
      });
    });

    if (modalClose) modalClose.addEventListener('click', closeInstallModal);

    installModal.addEventListener('click', function (e) {
      if (e.target === installModal) closeInstallModal();
    });

    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && installModal.classList.contains('open')) closeInstallModal();
    });
  }

  /* ── Cookie Consent ── */
  (function() {
    const banner = document.getElementById('cookieBanner');
    if (!banner) return;
    const accept = document.getElementById('cookieAccept');
    const decline = document.getElementById('cookieDecline');
    const dismissed = localStorage.getItem('jit_cookie_consent');
    if (dismissed) return;
    requestAnimationFrame(function() { banner.classList.add('visible'); banner.setAttribute('aria-hidden', 'false'); });
    function dismiss(choice) {
      localStorage.setItem('jit_cookie_consent', choice);
      banner.classList.remove('visible');
      banner.setAttribute('aria-hidden', 'true');
      setTimeout(function() { banner.style.display = 'none'; }, 400);
    }
    if (accept) accept.addEventListener('click', function() { dismiss('accepted'); });
    if (decline) decline.addEventListener('click', function() { dismiss('declined'); });
  })();

})();

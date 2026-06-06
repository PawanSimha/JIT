document.addEventListener('DOMContentLoaded', async () => {

  // ── Load header ──
  const headerPlaceholder = document.getElementById('header-placeholder');
  if (headerPlaceholder) {
    const res = await fetch('header.html');
    const html = await res.text();
    headerPlaceholder.innerHTML = html;

    // Attach mobile menu toggle after header is injected
    const toggle = document.getElementById('headerToggle');
    const nav = document.getElementById('headerNav');
    if (toggle && nav) {
      toggle.addEventListener('click', () => {
        toggle.classList.toggle('open');
        nav.classList.toggle('open');
      });
      nav.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
          toggle.classList.remove('open');
          nav.classList.remove('open');
        });
      });
    }
  }

  // ── Load footer ──
  const footerPlaceholder = document.getElementById('footer-placeholder');
  if (footerPlaceholder) {
    const res = await fetch('footer.html');
    const html = await res.text();
    footerPlaceholder.innerHTML = html;
  }

});

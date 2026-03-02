(function () {
  const year = new Date().getFullYear();
  const path = window.location.pathname;
  const links = [
    { href: '/', label: 'Home' },
    { href: '/schedule.html', label: 'Schedule' },
    { href: '/about.html', label: 'About' },
  ];

  const active = (href) => (href === '/' ? path === '/' || path.endsWith('/index.html') : path.endsWith(href));

  const header = document.querySelector('[data-site-header]');
  if (header) {
    header.innerHTML = `
      <header class="site-header">
        <div class="container nav-wrap">
          <a class="brand" href="/">
  <img src="/assets/logo.png" alt="TB Logo" class="brand-logo">
  <span class="brand-text">TeAndrea Burnett Tutoring</span>
</a>
          <nav aria-label="Primary navigation">
            <ul class="nav-links">
              ${links.map((l) => `<li><a href="${l.href}" ${active(l.href) ? 'aria-current="page"' : ''}>${l.label}</a></li>`).join('')}
            </ul>
          </nav>
        </div>
      </header>`;
  }

  const footer = document.querySelector('[data-site-footer]');
  if (footer) {
    footer.innerHTML = `
      <footer class="site-footer">
        <div class="container footer-grid">
          <p>© ${year} TeAndrea Burnett Tutoring · Troy, Alabama</p>
          <ul>
            <li><a href="/terms.html">Terms</a></li>
            <li><a href="/privacy.html">Privacy</a></li>
            <li><a href="/refund-policy.html">Refund Policy</a></li>
            <li><a href="/contact.html">Contact</a></li>
          </ul>
        </div>
      </footer>`;
  }
})();

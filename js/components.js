(function () {
  const year = new Date().getFullYear();
  const path = window.location.pathname;
  const links = [
    { href: '/', label: 'Home' },
    { href: '/schedule', label: 'Schedule' },
  ];

  const active = (href) => (href === '/' ? path === '/' || path.endsWith('/index') : path.endsWith(href));

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
            <li><a href="/terms">Terms</a></li>
            <li><a href="/privacy">Privacy</a></li>
            <li><a href="/refund-policy">Refund Policy</a></li>
            <li><a href="/contact">Contact</a></li>
			<li><a href="/about">About</a></li>
          </ul>
        </div>
      </footer>`;
  }
})();

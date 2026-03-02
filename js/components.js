(function () {
  const currentYear = new Date().getFullYear();
  const path = window.location.pathname;

  const isActive = (href) => {
    if (href === '/') return path === '/' || path.endsWith('/index.html');
    return path === href || path.endsWith(`${href}/`);
  };

  const nav = [
    { href: '/', label: 'Home' },
    { href: '/schedule.html', label: 'Schedule' },
    { href: '/about.html', label: 'About' },
    { href: '/contact.html', label: 'Contact' }
  ];

  const headerHost = document.querySelector('[data-site-header]');
  if (headerHost) {
    const links = nav
      .map((item) => `<li><a href="${item.href}" ${isActive(item.href) ? 'aria-current="page"' : ''}>${item.label}</a></li>`)
      .join('');

    headerHost.innerHTML = `
      <header class="site-header">
        <div class="container nav-wrap">
          <a class="brand" href="/">TeAndrea Burnett Tutoring</a>
          <nav aria-label="Primary">
            <ul class="nav-links">${links}</ul>
          </nav>
        </div>
      </header>
    `;
  }

  const footerHost = document.querySelector('[data-site-footer]');
  if (footerHost) {
    footerHost.innerHTML = `
      <footer class="site-footer">
        <div class="container footer-grid">
          <p>© ${currentYear} TeAndrea Burnett Tutoring · Troy, Alabama</p>
          <ul>
            <li><a href="/terms.html">Terms</a></li>
            <li><a href="/privacy.html">Privacy</a></li>
            <li><a href="/refund-policy.html">Refund Policy</a></li>
            <li><a href="/contact.html">Contact</a></li>
          </ul>
        </div>
      </footer>
    `;
  }
})();

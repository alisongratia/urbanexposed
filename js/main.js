// Warehouse 317 — shared site behavior (mockup only, no backend)

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');
  if (toggle && links) {
    toggle.addEventListener('click', () => links.classList.toggle('open'));
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));
  }

  // Mark current page active in nav
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    if (a.getAttribute('href') === path) a.classList.add('active');
  });

  // Mock form submissions across the site
  document.querySelectorAll('form[data-mock]').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const successEl = form.querySelector('.form-success') || form.parentElement.querySelector('.form-success');
      form.style.display = 'none';
      if (successEl) successEl.style.display = 'block';
    });
  });
});

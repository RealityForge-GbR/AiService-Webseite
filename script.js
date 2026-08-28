const root = document.documentElement;
const toggle = document.querySelector('.theme-toggle');
const themeMeta = document.querySelector('meta[name="theme-color"]');

function updateThemeControl() {
  const isLight = root.dataset.theme === 'light';
  toggle.setAttribute('aria-pressed', String(isLight));
  toggle.setAttribute('aria-label', isLight ? 'Dark Mode aktivieren' : 'Light Mode aktivieren');
  themeMeta.setAttribute('content', isLight ? '#f4f1f7' : '#09080d');
}

toggle.addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
  localStorage.setItem('rf-theme', root.dataset.theme);
  updateThemeControl();
});

updateThemeControl();

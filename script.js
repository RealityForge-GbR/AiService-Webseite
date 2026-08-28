const root = document.documentElement;
const toggle = document.querySelector('.theme-toggle');
const themeMeta = document.querySelector('meta[name="theme-color"]');
const useCaseToggle = document.querySelector('[data-use-case-toggle]');
const extraUseCases = [...document.querySelectorAll('[data-extra-use-case]')];

function updateThemeControl() {
  const isLight = root.dataset.theme === 'light';
  toggle.setAttribute('aria-pressed', String(isLight));
  toggle.setAttribute('aria-label', isLight ? 'Dark Mode aktivieren' : 'Light Mode aktivieren');
  themeMeta.setAttribute('content', isLight ? '#f4f1f7' : '#09080d');
}

toggle.addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
  localStorage.setItem('realityforge-theme', root.dataset.theme);
  updateThemeControl();
});

updateThemeControl();

if (useCaseToggle && extraUseCases.length) {
  extraUseCases.forEach((card) => card.classList.add('is-collapsed'));
  useCaseToggle.hidden = false;

  useCaseToggle.addEventListener('click', () => {
    const isExpanded = useCaseToggle.getAttribute('aria-expanded') === 'true';
    extraUseCases.forEach((card) => card.classList.toggle('is-collapsed', isExpanded));
    useCaseToggle.setAttribute('aria-expanded', String(!isExpanded));
    useCaseToggle.innerHTML = isExpanded
      ? 'Weitere Beispiele <span aria-hidden="true">+</span>'
      : 'Weniger Beispiele <span aria-hidden="true">−</span>';
  });
}

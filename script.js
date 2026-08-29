const root = document.documentElement;
const toggle = document.querySelector('.theme-toggle');
const themeMeta = document.querySelector('meta[name="theme-color"]');
const useCaseSection = document.querySelector('#anwendungsbeispiele');
const useCaseToggle = document.querySelector('[data-use-case-toggle]');
const extraUseCases = [...document.querySelectorAll('[data-extra-use-case]')];
const useCaseTriggers = [...document.querySelectorAll('.use-case-trigger')];
const useCaseModal = document.querySelector('[data-use-case-modal]');
const useCaseDialog = document.querySelector('.use-case-dialog');
const useCaseModalTitle = document.querySelector('[data-use-case-modal-title]');
const useCaseModalBody = document.querySelector('[data-use-case-modal-body]');
const useCaseCloseButtons = [...document.querySelectorAll('[data-use-case-close]')];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

let collapseTimer;
let modalTimer;
let lastUseCaseTrigger;

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
  extraUseCases.forEach((card, index) => {
    card.style.setProperty('--reveal-order', index);
    card.classList.add('is-collapsed');
  });
  useCaseToggle.hidden = false;

  useCaseToggle.addEventListener('click', () => {
    const isExpanded = useCaseToggle.getAttribute('aria-expanded') === 'true';

    window.clearTimeout(collapseTimer);

    if (!isExpanded) {
      extraUseCases.forEach((card) => {
        card.classList.remove('is-collapsed', 'is-hiding');
        card.classList.add('is-revealing');
      });
      useCaseToggle.setAttribute('aria-expanded', 'true');
      useCaseToggle.innerHTML = 'Weniger Beispiele <span aria-hidden="true">−</span>';

      collapseTimer = window.setTimeout(() => {
        extraUseCases.forEach((card) => card.classList.remove('is-revealing'));
      }, reduceMotion.matches ? 0 : 1000);
      return;
    }

    useCaseToggle.disabled = true;
    extraUseCases.forEach((card) => {
      card.classList.remove('is-revealing');
      card.classList.add('is-hiding');
    });
    useCaseToggle.setAttribute('aria-expanded', 'false');
    useCaseToggle.innerHTML = 'Weitere Beispiele <span aria-hidden="true">+</span>';

    const collapseDuration = reduceMotion.matches ? 0 : 480;
    collapseTimer = window.setTimeout(() => {
      extraUseCases.forEach((card) => {
        card.classList.add('is-collapsed');
        card.classList.remove('is-hiding');
      });
      useCaseToggle.disabled = false;
      useCaseSection?.scrollIntoView({
        behavior: reduceMotion.matches ? 'auto' : 'smooth',
        block: 'start'
      });
    }, collapseDuration);
  });
}

function openUseCaseModal(trigger) {
  if (!useCaseModal || !useCaseDialog || !useCaseModalTitle || !useCaseModalBody) return;

  const bubble = trigger.closest('.use-case-bubble');
  const details = bubble?.querySelector('.use-case-details');
  const title = trigger.querySelector('span')?.textContent?.trim();

  if (!details || !title) return;

  window.clearTimeout(modalTimer);
  lastUseCaseTrigger = trigger;
  useCaseModalTitle.textContent = title;
  useCaseModalBody.innerHTML = details.innerHTML;
  useCaseDialog.scrollTop = 0;
  useCaseModal.hidden = false;
  document.body.classList.add('modal-open');

  window.requestAnimationFrame(() => {
    useCaseModal.classList.add('is-open');
    useCaseDialog.querySelector('.use-case-modal-close')?.focus({ preventScroll: true });
  });
}

function closeUseCaseModal() {
  if (!useCaseModal || useCaseModal.hidden) return;

  window.clearTimeout(modalTimer);
  useCaseModal.classList.remove('is-open');

  modalTimer = window.setTimeout(() => {
    useCaseModal.hidden = true;
    useCaseModalBody.innerHTML = '';
    document.body.classList.remove('modal-open');
    lastUseCaseTrigger?.focus({ preventScroll: true });
  }, reduceMotion.matches ? 0 : 320);
}

useCaseTriggers.forEach((trigger) => {
  trigger.addEventListener('click', () => openUseCaseModal(trigger));
});

useCaseCloseButtons.forEach((button) => {
  button.addEventListener('click', closeUseCaseModal);
});

document.addEventListener('keydown', (event) => {
  if (!useCaseModal || useCaseModal.hidden) return;

  if (event.key === 'Escape') {
    event.preventDefault();
    closeUseCaseModal();
    return;
  }

  if (event.key !== 'Tab') return;

  const focusable = [...useCaseDialog.querySelectorAll('button, [href], [tabindex]')]
    .filter((element) => element.tabIndex >= 0 && !element.disabled);

  if (!focusable.length) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

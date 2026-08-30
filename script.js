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
const systemFusion = document.querySelector('[data-system-fusion]');
const secureNetwork = document.querySelector('[data-secure-network]');
const localAiDialog = document.querySelector('[data-local-ai-dialog]');
const localAiDialogOpen = document.querySelector('[data-local-ai-open]');
const localAiDialogClose = document.querySelector('[data-local-ai-close]');
const aiTopicExplorer = document.querySelector('[data-ai-topic-explorer]');
const aiTopicButtons = [...document.querySelectorAll('[data-ai-topic]')];
const aiConversation = document.querySelector('[data-ai-conversation]');
const aiScrollSpace = document.querySelector('[data-ai-scroll-space]');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const heroWordmark = document.querySelector('#hero-wordmark');
const heroTitle = document.querySelector('#hero-title');
const heroTitleCopy = document.querySelector('.hero-main-title-copy');
const heroTerminalShell = document.querySelector('.hero-terminal-shell');
const heroCopy = document.querySelector('.hero-copy');
const heroIntro = document.querySelector('.hero-intro');
const heroMonitor = document.querySelector('.hero-monitor');
const economicsTitle = document.querySelector('#economics-title');
const economicsTitleCopy = economicsTitle?.querySelector('span');
const evidenceShowcase = document.querySelector('.evidence-showcase');
const evidenceChart = document.querySelector('[data-evidence-chart]');
const evidenceTriggers = [...document.querySelectorAll('[data-evidence-trigger]')];
const evidenceModal = document.querySelector('[data-evidence-modal]');
const evidenceDialog = evidenceModal?.querySelector('.use-case-dialog');
const evidenceModalTitle = document.querySelector('[data-evidence-modal-title]');
const evidenceModalBody = document.querySelector('[data-evidence-modal-body]');
const evidenceCloseButtons = [...document.querySelectorAll('[data-evidence-close]')];
const evidenceTeamType = document.querySelector('[data-evidence-team-type]');
const evidenceTeamCopy = document.querySelector('[data-evidence-team-copy]');
const strategySite = document.querySelector('.strategy-site');
const strategyLiftedBlock = document.querySelector('[data-strategy-lifted-block]');
const wordmarkSettings = window.RealityForgeLogoSettings;

let collapseTimer;
let modalTimer;
let lastUseCaseTrigger;
let aiTypingTimer;
let aiTypingDelayTimer;
let activeAiTyping;
let evidenceModalTimer;
let lastEvidenceTrigger;
let evidenceTypingTimer;

window.addEventListener('load', () => {
  window.scrollTo(0, 0);
});

function updateThemeControl() {
  const isLight = root.dataset.theme === 'light';
  toggle.setAttribute('aria-pressed', String(isLight));
  toggle.setAttribute('aria-label', isLight ? 'Dark Mode aktivieren' : 'Light Mode aktivieren');
  themeMeta.setAttribute('content', isLight ? '#f4f1f7' : '#09080d');
}

function fitSingleLine(element, copy, targetWidth) {
  if (!element || !copy || !Number.isFinite(targetWidth) || targetWidth <= 0) return;

  const measurementSize = 100;
  element.style.fontSize = `${measurementSize}px`;
  const naturalWidth = copy.getBoundingClientRect().width;

  if (Number.isFinite(naturalWidth) && naturalWidth > 0) {
    element.style.fontSize = `${(targetWidth / naturalWidth) * measurementSize}px`;
  }
}

function fitEconomicsTitle() {
  if (!economicsTitle || !economicsTitleCopy) return;
  fitSingleLine(economicsTitle, economicsTitleCopy, economicsTitle.parentElement.getBoundingClientRect().width);
}

toggle.addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
  localStorage.setItem('realityforge-theme', root.dataset.theme);
  updateThemeControl();
});

updateThemeControl();

if (heroWordmark && wordmarkSettings) {
  root.style.setProperty('--rf-logo-font-final', wordmarkSettings.fontFinal);
  root.style.setProperty('--rf-logo-font-code', wordmarkSettings.fontCode);

  customElements.whenDefined('reality-forge-logo').then(() => {
    heroWordmark.config = wordmarkSettings;

    const syncHeroTitleWidth = () => {
      if (!heroTitle || !heroTitleCopy || !heroWordmark.textHi || !heroWordmark.textB) return;

      if (heroTerminalShell && window.innerWidth > 760) {
        heroTerminalShell.style.setProperty('--hero-wordmark-balance-shift', '0px');
        heroCopy?.style.setProperty('--hero-copy-vertical-shift', '0px');
      }

      const realityBounds = heroWordmark.textHi.getBoundingClientRect();
      const forgeBounds = heroWordmark.textB.getBoundingClientRect();
      const wordmarkWidth = forgeBounds.right - realityBounds.left;

      if (Number.isFinite(wordmarkWidth) && wordmarkWidth > 0) {
        heroTitle.style.setProperty('--hero-title-width', `${wordmarkWidth}px`);
        heroTerminalShell?.style.setProperty('--hero-content-width', `${wordmarkWidth}px`);
        heroTerminalShell?.style.setProperty('--hero-content-half-width', `${wordmarkWidth / 2}px`);
        fitSingleLine(heroTitle, heroTitleCopy, wordmarkWidth);

        if (heroTerminalShell && window.innerWidth > 760) {
          const titleBounds = heroTitle.getBoundingClientRect();
          const shellBounds = heroTerminalShell.getBoundingClientRect();
          const copyBounds = heroCopy?.getBoundingClientRect();
          const logoTop = Math.min(realityBounds.top, forgeBounds.top);
          const logoBottom = Math.max(realityBounds.bottom, forgeBounds.bottom);
          const topGap = logoTop + window.scrollY;
          const titleGap = titleBounds.top - logoBottom;
          const unclampedShift = (titleGap - topGap) / 2;
          const balanceShift = Math.max(shellBounds.top - logoTop, unclampedShift);

          if (Number.isFinite(balanceShift)) {
            heroTerminalShell.style.setProperty('--hero-wordmark-balance-shift', `${balanceShift}px`);
          }

          if (copyBounds) {
            const copyAlignOffset = Math.max(0, titleBounds.left - copyBounds.left);

            if (Number.isFinite(copyAlignOffset)) {
              heroCopy.style.setProperty('--hero-copy-align-offset', `${copyAlignOffset}px`);
            }
          }

          const introBounds = heroIntro?.getBoundingClientRect();
          const monitorBounds = heroMonitor?.getBoundingClientRect();

          if (introBounds && monitorBounds) {
            const copyVerticalShift = monitorBounds.top - introBounds.top;

            if (Number.isFinite(copyVerticalShift)) {
              heroCopy.style.setProperty('--hero-copy-vertical-shift', `${copyVerticalShift}px`);
            }
          }
        }
      }
    };

    const titleWidthObserver = 'ResizeObserver' in window
      ? new ResizeObserver(syncHeroTitleWidth)
      : null;

    titleWidthObserver?.observe(heroWordmark);
    document.fonts?.ready.then(syncHeroTitleWidth);
    requestAnimationFrame(syncHeroTitleWidth);

    requestAnimationFrame(() => {
      if (wordmarkSettings.reducedMotion === 'static' && reduceMotion.matches) {
        heroWordmark.showFinal();
        return;
      }

      heroWordmark.restart();
    });
  });
}

document.fonts?.ready.then(fitEconomicsTitle);
requestAnimationFrame(fitEconomicsTitle);
window.addEventListener('resize', fitEconomicsTitle);

function revealEvidenceTeam() {
  if (!evidenceTeamType || !evidenceTeamCopy) return;
  const fullText = evidenceTeamType.dataset.text || '';

  if (reduceMotion.matches) {
    evidenceTeamType.textContent = fullText;
    evidenceTeamType.classList.remove('is-typing');
    evidenceTeamCopy.classList.add('is-visible');
    return;
  }

  let characterIndex = 0;
  evidenceTeamType.classList.add('is-typing');
  window.setTimeout(() => evidenceTeamCopy.classList.add('is-visible'), 360);
  evidenceTypingTimer = window.setInterval(() => {
    characterIndex += 1;
    evidenceTeamType.textContent = fullText.slice(0, characterIndex);

    if (characterIndex < fullText.length) return;
    window.clearInterval(evidenceTypingTimer);
    evidenceTypingTimer = undefined;
    evidenceTeamType.classList.remove('is-typing');
  }, 50);
}

function revealEvidenceShowcase() {
  evidenceChart?.classList.add('is-visible');
  revealEvidenceTeam();
}

if (evidenceShowcase) {
  if (reduceMotion.matches || !('IntersectionObserver' in window)) {
    revealEvidenceShowcase();
  } else {
    const evidenceShowcaseObserver = new IntersectionObserver((entries, observer) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      revealEvidenceShowcase();
      observer.disconnect();
    }, { threshold: 0.12, rootMargin: '0px 0px 14% 0px' });
    evidenceShowcaseObserver.observe(evidenceShowcase);
  }
}

function openEvidenceModal(trigger) {
  if (!evidenceModal || !evidenceDialog || !evidenceModalTitle || !evidenceModalBody) return;
  const key = trigger.dataset.evidenceTrigger;
  const template = document.querySelector(`template[data-evidence-detail="${key}"]`);
  if (!template) return;

  window.clearTimeout(evidenceModalTimer);
  lastEvidenceTrigger = trigger;
  evidenceModalTitle.textContent = template.dataset.evidenceTitle || '';
  evidenceModalBody.innerHTML = template.innerHTML;
  evidenceDialog.scrollTop = 0;
  evidenceModal.hidden = false;
  document.body.classList.add('modal-open');

  window.requestAnimationFrame(() => {
    evidenceModal.classList.add('is-open');
    evidenceDialog.querySelector('.use-case-modal-close')?.focus({ preventScroll: true });
  });
}

function closeEvidenceModal() {
  if (!evidenceModal || evidenceModal.hidden) return;
  window.clearTimeout(evidenceModalTimer);
  evidenceModal.classList.remove('is-open');

  evidenceModalTimer = window.setTimeout(() => {
    evidenceModal.hidden = true;
    evidenceModalBody.innerHTML = '';
    document.body.classList.remove('modal-open');
    lastEvidenceTrigger?.focus({ preventScroll: true });
  }, reduceMotion.matches ? 0 : 320);
}

evidenceTriggers.forEach((trigger) => trigger.addEventListener('click', () => openEvidenceModal(trigger)));
evidenceCloseButtons.forEach((button) => button.addEventListener('click', closeEvidenceModal));

document.addEventListener('keydown', (event) => {
  if (!evidenceModal || evidenceModal.hidden) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    closeEvidenceModal();
    return;
  }
  if (event.key !== 'Tab') return;

  const focusable = [...evidenceDialog.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')];
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

if (systemFusion && !reduceMotion.matches && 'IntersectionObserver' in window) {
  systemFusion.classList.add('is-animated');

  const fusionObserver = new IntersectionObserver((entries, observer) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;

    systemFusion.classList.add('is-visible');
    observer.disconnect();
  }, {
    threshold: 0.3,
    rootMargin: '0px 0px -10%'
  });

  fusionObserver.observe(systemFusion);
}

if (secureNetwork && !reduceMotion.matches && 'IntersectionObserver' in window) {
  secureNetwork.classList.add('is-animated');

  const secureNetworkObserver = new IntersectionObserver((entries, observer) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;

    secureNetwork.classList.add('is-visible');
    observer.disconnect();
  }, {
    threshold: 0.25,
    rootMargin: '0px 0px -8%'
  });

  secureNetworkObserver.observe(secureNetwork);
}

if (localAiDialog && localAiDialogOpen && localAiDialogClose) {
  localAiDialogOpen.addEventListener('click', () => {
    localAiDialog.showModal();
    document.body.classList.add('modal-open');
    localAiDialogClose.focus({ preventScroll: true });
  });

  localAiDialogClose.addEventListener('click', () => localAiDialog.close());

  localAiDialog.addEventListener('click', (event) => {
    if (event.target !== localAiDialog) return;
    const bounds = localAiDialog.getBoundingClientRect();
    const isInside = event.clientX >= bounds.left
      && event.clientX <= bounds.right
      && event.clientY >= bounds.top
      && event.clientY <= bounds.bottom;
    if (!isInside) localAiDialog.close();
  });

  localAiDialog.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    localAiDialogOpen.focus({ preventScroll: true });
  });
}

function finishAiTyping() {
  window.clearInterval(aiTypingTimer);
  window.clearTimeout(aiTypingDelayTimer);
  aiTypingTimer = undefined;
  aiTypingDelayTimer = undefined;

  if (!activeAiTyping) return;
  activeAiTyping.copy.textContent = activeAiTyping.fullText;
  activeAiTyping.cursor.remove();
  activeAiTyping = undefined;
}

function createAiMessage(kind, revealDelay = 0) {
  const message = document.createElement('div');
  message.className = `ai-chat-message ai-chat-message-${kind}`;

  if (kind === 'assistant') {
    const avatar = document.createElement('span');
    avatar.className = 'ai-chat-avatar';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = 'RF';
    message.appendChild(avatar);
  }

  const bubble = document.createElement('div');
  message.appendChild(bubble);
  aiConversation?.insertBefore(message, aiScrollSpace || null);
  window.setTimeout(() => message.classList.add('is-visible'), revealDelay);
  return { message, bubble };
}

if (aiTopicExplorer && aiConversation && aiTopicButtons.length) {
  aiTopicButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const topic = button.dataset.aiTopic;
      const question = button.dataset.aiQuestion;
      const template = aiTopicExplorer.querySelector(`template[data-ai-response="${topic}"]`);
      if (!topic || !question || !template) return;

      finishAiTyping();

      aiTopicButtons.forEach((topicButton) => {
        const isActive = topicButton === button;
        topicButton.classList.toggle('is-active', isActive);
        topicButton.setAttribute('aria-pressed', String(isActive));
      });
      aiTopicExplorer.querySelectorAll('[data-ai-connection]').forEach((connection) => {
        connection.classList.toggle('is-active', connection.dataset.aiConnection === topic);
      });

      const userMessage = createAiMessage('user', 110);
      const userCopy = document.createElement('p');
      userCopy.textContent = question;
      userMessage.bubble.appendChild(userCopy);

      window.setTimeout(() => {
        const conversationPadding = Number.parseFloat(window.getComputedStyle(aiConversation).paddingTop) || 0;
        aiConversation.scrollTo({
          top: Math.max(0, userMessage.message.offsetTop - conversationPadding),
          behavior: reduceMotion.matches ? 'auto' : 'smooth',
        });
      }, 150);

      const paragraphs = [...template.content.querySelectorAll('p')]
        .map((paragraph) => paragraph.textContent.trim())
        .filter(Boolean);
      const fullText = paragraphs.join('\n\n');
      const assistantMessage = createAiMessage('assistant', 560);
      const assistantCopy = document.createElement('p');
      assistantCopy.className = 'ai-chat-typed-copy';
      const cursor = document.createElement('span');
      cursor.className = 'ai-chat-cursor';
      cursor.setAttribute('aria-hidden', 'true');
      assistantMessage.bubble.append(assistantCopy, cursor);

      if (reduceMotion.matches) {
        assistantCopy.textContent = fullText;
        cursor.remove();
        return;
      }

      let characterIndex = 0;
      activeAiTyping = { copy: assistantCopy, cursor, fullText };
      aiTypingDelayTimer = window.setTimeout(() => {
        aiTypingDelayTimer = undefined;
        aiTypingTimer = window.setInterval(() => {
          characterIndex = Math.min(fullText.length, characterIndex + 3);
          assistantCopy.textContent = fullText.slice(0, characterIndex);

          if (characterIndex >= fullText.length) finishAiTyping();
        }, 18);
      }, 1050);
    });
  });
}

let strategyLiftFrame;

function updateStrategyLift() {
  strategyLiftFrame = undefined;
  if (!strategySite || !strategyLiftedBlock) return;

  if (reduceMotion.matches) {
    strategyLiftedBlock.style.setProperty('--strategy-lift-y', '0px');
    strategyLiftedBlock.style.setProperty('--strategy-lift-cable-height', window.innerWidth <= 760 ? '19rem' : '10.75rem');
    strategyLiftedBlock.classList.add('is-landed');
    return;
  }

  const panelBounds = strategySite.closest('.strategy-panel')?.getBoundingClientRect() || strategySite.getBoundingClientRect();
  const compactLayout = window.innerWidth <= 760;
  const travel = compactLayout ? 44 : 144;
  const loweringDistance = compactLayout ? window.innerHeight * 0.7 : window.innerHeight * 0.4;
  const startLine = window.innerHeight * 0.11;
  const progress = Math.min(1, Math.max(0, (startLine - panelBounds.top) / loweringDistance));
  const liftY = -travel + (progress * travel);
  const cableBase = compactLayout ? 258 : 28;
  const cableHeight = cableBase + (progress * travel);
  strategyLiftedBlock.style.setProperty('--strategy-lift-y', `${liftY.toFixed(1)}px`);
  strategyLiftedBlock.style.setProperty('--strategy-lift-cable-height', `${cableHeight.toFixed(1)}px`);
  strategyLiftedBlock.classList.toggle('is-landed', progress >= 0.995);
}

function requestStrategyLiftUpdate() {
  if (strategyLiftFrame) return;
  strategyLiftFrame = window.requestAnimationFrame(updateStrategyLift);
}

if (strategySite && strategyLiftedBlock) {
  window.addEventListener('scroll', requestStrategyLiftUpdate, { passive: true });
  window.addEventListener('resize', requestStrategyLiftUpdate);
  reduceMotion.addEventListener?.('change', requestStrategyLiftUpdate);
  requestStrategyLiftUpdate();
}

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

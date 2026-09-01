const root = document.documentElement;
const toggle = document.querySelector('.theme-toggle');
const themeMeta = document.querySelector('meta[name="theme-color"]');
const useCaseSection = document.querySelector('#anwendungsbeispiele');
const useCaseToggle = document.querySelector('[data-use-case-toggle]');
const extraUseCases = [...document.querySelectorAll('[data-extra-use-case]')];
const useCaseTriggers = [...document.querySelectorAll('.use-case-trigger, [data-service-trigger]')];
const useCaseModal = document.querySelector('[data-use-case-modal]');
const useCaseDialog = document.querySelector('#use-case-dialog');
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
const economicsTitle = document.querySelector('#economics-title');
const economicsTitleCopy = economicsTitle?.querySelector('span');
const viewPeopleLayout = document.querySelector('.view-people-layout');
const viewCopyColumn = document.querySelector('.view-copy-column');
const viewTitle = document.querySelector('#view-title');
const viewParagraph = document.querySelector('.view-copy p');
const viewPortraitFrames = [...document.querySelectorAll('.team-portrait-frame')];
const evidenceChart = document.querySelector('[data-evidence-chart]');
const evidenceTriggers = [...document.querySelectorAll('[data-evidence-trigger]')];
const evidenceModal = document.querySelector('[data-evidence-modal]');
const evidenceDialog = evidenceModal?.querySelector('.use-case-dialog');
const evidenceModalTitle = document.querySelector('[data-evidence-modal-title]');
const evidenceModalBody = document.querySelector('[data-evidence-modal-body]');
const evidenceCloseButtons = [...document.querySelectorAll('[data-evidence-close]')];
const businessProgress = document.querySelector('[data-business-progress]');
const businessStepTriggers = [...document.querySelectorAll('[data-business-step]')];
const businessStepModal = document.querySelector('[data-business-step-modal]');
const businessStepDialog = businessStepModal?.querySelector('.business-step-dialog');
const businessStepModalTitle = document.querySelector('[data-business-step-modal-title]');
const businessStepModalBody = document.querySelector('[data-business-step-modal-body]');
const businessStepModalMeta = document.querySelector('[data-business-step-meta]');
const businessStepCloseButtons = [...document.querySelectorAll('[data-business-step-close]')];
const strategySite = document.querySelector('.strategy-site');
const strategyLiftedBlock = document.querySelector('[data-strategy-lifted-block]');
const wordmarkSettings = window.RealityForgeLogoSettings;

let collapseTimer;
let modalTimer;
let lastUseCaseTrigger;
let aiTypingTimer;
let aiTypingDelayTimer;
let activeAiTyping;
let aiExchangeScrollTimer;
let evidenceModalTimer;
let lastEvidenceTrigger;
let businessStepModalTimer;
let lastBusinessStepTrigger;
let viewFitFrame;
let viewObservedWidth = 0;

window.addEventListener('load', () => {
  window.scrollTo(0, 0);
});

function updateThemeControl() {
  const isLight = root.dataset.theme === 'light';
  toggle.setAttribute('aria-pressed', String(isLight));
  toggle.setAttribute('aria-label', isLight ? 'Dark Mode aktivieren' : 'Light Mode aktivieren');
  themeMeta.setAttribute('content', isLight ? '#f4f1f7' : '#09080d');
}

function fitSingleLine(element, copy, targetWidth, readable = false) {
  if (!element || !copy || !Number.isFinite(targetWidth) || targetWidth <= 0) return;
  element.classList.remove('fitted-title-wrap');
  const measurementSize = 100;
  element.style.fontSize = `${measurementSize}px`;
  const naturalWidth = copy.getBoundingClientRect().width;

  if (Number.isFinite(naturalWidth) && naturalWidth > 0) {
    const size = (targetWidth / naturalWidth) * measurementSize;
    if (readable && size < (parseFloat(getComputedStyle(root).fontSize) || 16) * 1.5) {
      element.classList.add('fitted-title-wrap');
      element.style.removeProperty('font-size');
    } else element.style.fontSize = `${size}px`;
  } else element.style.removeProperty('font-size');
}

function fitEconomicsTitle() {
  if (!economicsTitle || !economicsTitleCopy) return;
  if (window.innerWidth <= 760) {
    economicsTitle.style.removeProperty('font-size');
    economicsTitle.classList.remove('fitted-title-wrap');
    document.querySelector('#services-overview-title')?.style.removeProperty('--reference-title-size');
    return;
  }
  fitSingleLine(economicsTitle, economicsTitleCopy, economicsTitle.parentElement.getBoundingClientRect().width, true);
  document.querySelector('#services-overview-title')?.style.setProperty('--reference-title-size', getComputedStyle(economicsTitle).fontSize);
}

function fitViewContent() {
  viewFitFrame = undefined;
  if (!viewPeopleLayout || !viewCopyColumn || !viewTitle || !viewParagraph) return;

  viewPeopleLayout.classList.remove('is-view-copy-stacked');
  viewCopyColumn.style.removeProperty('--view-title-size');
  viewCopyColumn.style.removeProperty('--view-copy-size');
  if (window.innerWidth <= 1100) return;

  const portraitHeight = Math.min(...viewPortraitFrames.map((frame) => frame.getBoundingClientRect().height));
  const baseTitleSize = Number.parseFloat(getComputedStyle(viewTitle).fontSize);
  const baseCopySize = Number.parseFloat(getComputedStyle(viewParagraph).fontSize);
  if (![portraitHeight, baseTitleSize, baseCopySize].every((value) => Number.isFinite(value) && value > 0)) return;
  if (viewCopyColumn.scrollHeight <= portraitHeight + 1) return;

  const rootSize = Number.parseFloat(getComputedStyle(root).fontSize) || 16;
  const minimumScale = Math.min(1, Math.max((rootSize * 1.5) / baseTitleSize, (rootSize * .74) / baseCopySize));
  const applyScale = (scale) => {
    viewCopyColumn.style.setProperty('--view-title-size', `${(baseTitleSize * scale).toFixed(3)}px`);
    viewCopyColumn.style.setProperty('--view-copy-size', `${(baseCopySize * scale).toFixed(3)}px`);
  };

  applyScale(minimumScale);
  if (viewCopyColumn.scrollHeight > portraitHeight + 1) {
    viewCopyColumn.style.removeProperty('--view-title-size');
    viewCopyColumn.style.removeProperty('--view-copy-size');
    viewPeopleLayout.classList.add('is-view-copy-stacked');
    return;
  }

  let low = minimumScale;
  let high = 1;
  for (let iteration = 0; iteration < 10; iteration += 1) {
    const candidate = (low + high) / 2;
    applyScale(candidate);
    if (viewCopyColumn.scrollHeight <= portraitHeight + 1) low = candidate;
    else high = candidate;
  }
  applyScale(low);
}

function requestViewContentFit() {
  if (viewFitFrame) return;
  viewFitFrame = window.requestAnimationFrame(fitViewContent);
}

document.fonts?.ready.then(requestViewContentFit);
document.fonts?.addEventListener('loadingdone', requestViewContentFit);
window.addEventListener('resize', requestViewContentFit);
if ('ResizeObserver' in window && viewPeopleLayout) {
  const viewFitObserver = new ResizeObserver((entries) => {
    const width = entries[0]?.contentRect?.width || viewPeopleLayout.getBoundingClientRect().width;
    if (!Number.isFinite(width) || Math.abs(width - viewObservedWidth) < .5) return;
    viewObservedWidth = width;
    requestViewContentFit();
  });
  viewFitObserver.observe(viewPeopleLayout);
}
requestViewContentFit();

// Only animate visible diagrams. Each signal ends exactly at its destination.
document.querySelectorAll('.local-network-impulses use').forEach((signal) => {
  const path = document.querySelector(signal.getAttribute('href'));
  if (!path?.getTotalLength) return;
  const length = path.getTotalLength();
  signal.style.setProperty('--flow-end', `${-length}`);
  signal.style.setProperty('--flow-gap', `${length + 48}`);
});
const activeDiagrams = [businessProgress, secureNetwork, systemFusion, aiTopicExplorer, evidenceChart,
  heroTerminalShell, document.querySelector('.strategy-panel')].filter(Boolean);
if ('IntersectionObserver' in window) {
  const motionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => entry.target.classList.toggle('is-in-view', entry.isIntersecting));
  }, { threshold: 0.05 });
  activeDiagrams.forEach((diagram) => motionObserver.observe(diagram));
} else activeDiagrams.forEach((diagram) => diagram.classList.add('is-in-view'));

toggle.addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
  localStorage.setItem('realityforge-theme', root.dataset.theme);
  updateThemeControl();
});

updateThemeControl();

const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const mainNavigation = document.querySelector('.main-nav');
function setMobileMenu(open) {
  mobileMenuToggle?.setAttribute('aria-expanded', String(open));
  mobileMenuToggle?.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
  mainNavigation?.classList.toggle('is-open', open);
}
mobileMenuToggle?.addEventListener('click', () => setMobileMenu(mobileMenuToggle.getAttribute('aria-expanded') !== 'true'));
mainNavigation?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMobileMenu(false)));
document.addEventListener('click', (event) => {
  if (!event.target.closest('.site-header')) setMobileMenu(false);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && mobileMenuToggle?.getAttribute('aria-expanded') === 'true') {
    setMobileMenu(false);
    mobileMenuToggle.focus();
  }
});
window.addEventListener('resize', () => { if (window.innerWidth > 760) setMobileMenu(false); });

if (heroWordmark && wordmarkSettings) {
  root.style.setProperty('--rf-logo-font-final', wordmarkSettings.fontFinal);
  root.style.setProperty('--rf-logo-font-code', wordmarkSettings.fontCode);

  customElements.whenDefined('reality-forge-logo').then(() => {
    heroWordmark.config = wordmarkSettings;

    const syncHeroTitleWidth = () => {
      if (!heroTitle || !heroTitleCopy || !heroCopy) return;
      const rail = heroCopy.getBoundingClientRect();
      if (!Number.isFinite(rail.width) || rail.width <= 0) return;
      window.RealityForgeHeroLayout?.alignWordmark(heroWordmark, rail);
      heroTerminalShell?.style.setProperty('--hero-content-width', `${rail.width}px`);
      heroTerminalShell?.style.setProperty('--hero-content-half-width', `${rail.width / 2}px`);
      heroTitle.classList.remove('hero-title-wrap');
      if (window.innerWidth <= 760) {
        heroTitle.style.removeProperty('font-size');
      } else {
        fitSingleLine(heroTitle, heroTitleCopy, rail.width);
        const readableMinimum = (parseFloat(getComputedStyle(root).fontSize) || 16) * 1.5;
        if (parseFloat(heroTitle.style.fontSize) < readableMinimum) {
          heroTitle.classList.add('hero-title-wrap');
          heroTitle.style.removeProperty('font-size');
        }
      }
      window.RealityForgeHeroLayout?.centerPortal(heroWordmark, heroTitleCopy);
    };

    const titleWidthObserver = 'ResizeObserver' in window
      ? new ResizeObserver(syncHeroTitleWidth)
      : null;

    titleWidthObserver?.observe(heroWordmark);
    if (heroTitle) titleWidthObserver?.observe(heroTitle);
    if (heroCopy) titleWidthObserver?.observe(heroCopy);
    window.addEventListener('resize', syncHeroTitleWidth);
    document.fonts?.ready.then(syncHeroTitleWidth);
    document.fonts?.addEventListener('loadingdone', syncHeroTitleWidth);
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
document.fonts?.addEventListener('loadingdone', fitEconomicsTitle);
requestAnimationFrame(fitEconomicsTitle);
window.addEventListener('resize', fitEconomicsTitle);

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

function openBusinessStepModal(trigger) {
  if (!businessStepModal || !businessStepDialog || !businessStepModalTitle || !businessStepModalBody) return;
  const step = trigger.closest('.business-step');
  const details = step?.querySelector('.business-step-details');
  const title = details?.dataset.businessStepTitle;
  if (!details || !title) return;

  window.clearTimeout(businessStepModalTimer);
  lastBusinessStepTrigger = trigger;
  businessStepModalTitle.textContent = title;
  businessStepModalBody.innerHTML = details.innerHTML;
  if (businessStepModalMeta) {
    const stepNumber = String(businessStepTriggers.indexOf(trigger) + 1).padStart(2, '0');
    businessStepModalMeta.textContent = `Schritt ${stepNumber} von 04`;
  }
  businessStepDialog.scrollTop = 0;
  businessStepModal.hidden = false;
  document.body.classList.add('modal-open');

  window.requestAnimationFrame(() => {
    businessStepModal.classList.add('is-open');
    businessStepDialog.querySelector('.use-case-modal-close')?.focus({ preventScroll: true });
  });
}

function closeBusinessStepModal() {
  if (!businessStepModal || businessStepModal.hidden) return;
  window.clearTimeout(businessStepModalTimer);
  businessStepModal.classList.remove('is-open');

  businessStepModalTimer = window.setTimeout(() => {
    businessStepModal.hidden = true;
    businessStepModalBody.innerHTML = '';
    document.body.classList.remove('modal-open');
    lastBusinessStepTrigger?.focus({ preventScroll: true });
  }, reduceMotion.matches ? 0 : 320);
}

businessStepTriggers.forEach((trigger) => trigger.addEventListener('click', () => openBusinessStepModal(trigger)));
businessStepCloseButtons.forEach((button) => button.addEventListener('click', closeBusinessStepModal));

document.addEventListener('keydown', (event) => {
  if (!businessStepModal || businessStepModal.hidden) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    closeBusinessStepModal();
    return;
  }
  if (event.key !== 'Tab') return;

  const focusable = [...businessStepDialog.querySelectorAll('button, [href], [tabindex]')]
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

function revealAiQuestion(userMessage) {
  if (!aiConversation || !userMessage?.isConnected) return;
  const conversationPadding = Number.parseFloat(window.getComputedStyle(aiConversation).paddingTop) || 0;
  const alignQuestion = () => aiConversation.scrollTo({
    top: Math.max(0, userMessage.offsetTop - conversationPadding),
    behavior: reduceMotion.matches ? 'auto' : 'smooth',
  });

  alignQuestion();

  const chatWindow = aiConversation.closest('.ai-chat-window');
  if (!chatWindow) return;
  const bounds = chatWindow.getBoundingClientRect();
  const viewportInset = Math.max(16, window.innerHeight * .08);
  if (bounds.top < viewportInset || bounds.bottom > window.innerHeight - viewportInset) {
    chatWindow.scrollIntoView({
      behavior: reduceMotion.matches ? 'auto' : 'smooth',
      block: 'center',
      inline: 'nearest',
    });
    window.requestAnimationFrame(alignQuestion);
  }
}

if (aiTopicExplorer && aiConversation && aiTopicButtons.length) {
  aiTopicButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const topic = button.dataset.aiTopic;
      const question = button.dataset.aiQuestion;
      const template = aiTopicExplorer.querySelector(`template[data-ai-response="${topic}"]`);
      if (!topic || !question || !template) return;

      finishAiTyping();
      window.clearTimeout(aiExchangeScrollTimer);

      // This is a topic explorer, not a chat history. Keep one complete answer in view.
      aiConversation.querySelectorAll('.ai-chat-message').forEach((message) => message.remove());
      aiConversation.scrollTop = 0;

      aiTopicButtons.forEach((topicButton) => {
        const isActive = topicButton === button;
        topicButton.classList.toggle('is-active', isActive);
        topicButton.setAttribute('aria-pressed', String(isActive));
      });
      aiTopicExplorer.querySelectorAll('[data-ai-connection]').forEach((connection) => {
        connection.classList.toggle('is-active', connection.dataset.aiConnection === topic);
      });

      const userMessage = createAiMessage('user', reduceMotion.matches ? 0 : 110);
      const userCopy = document.createElement('p');
      userCopy.textContent = question;
      userMessage.bubble.appendChild(userCopy);

      aiExchangeScrollTimer = window.setTimeout(() => {
        aiExchangeScrollTimer = undefined;
        revealAiQuestion(userMessage.message);
      }, reduceMotion.matches ? 0 : 150);

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

      if (reduceMotion.matches || window.innerWidth <= 760) {
        userMessage.message.classList.add('is-visible');
        assistantMessage.message.classList.add('is-visible');
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
let strategyLiftProgress = 0;

function updateStrategyLift() {
  strategyLiftFrame = undefined;
  if (!strategySite || !strategyLiftedBlock) return;

  if (reduceMotion.matches || window.innerWidth <= 1100) {
    strategyLiftProgress = 1;
    strategyLiftedBlock.style.setProperty('--strategy-lift-y', '0px');
    strategyLiftedBlock.style.setProperty('--strategy-lift-cable-height', window.innerWidth <= 760 ? '19rem' : '10.75rem');
    strategyLiftedBlock.classList.add('is-landed');
    return;
  }

  const panelBounds = strategySite.closest('.strategy-panel')?.getBoundingClientRect() || strategySite.getBoundingClientRect();
  const travel = 80;
  const loweringDistance = window.innerHeight * 0.35;
  const startLine = window.innerHeight * 0.42;
  const progress = Math.max(strategyLiftProgress, Math.min(1, Math.max(0, (startLine - panelBounds.top) / loweringDistance)));
  strategyLiftProgress = progress;
  const liftY = -travel + (progress * travel);
  const cableBase = 92; // Same final 172px cable; a shorter, once-only lowering.
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
  window.addEventListener('scroll', () => {
    if (strategyLiftProgress < 1) requestStrategyLiftUpdate();
  }, { passive: true });
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

  const bubble = trigger.closest('.use-case-bubble, .service-card');
  const details = bubble?.querySelector('.use-case-details');
  const title = trigger.querySelector('span')?.textContent?.trim();

  if (!details || !title) return;

  window.clearTimeout(modalTimer);
  useCaseDialog.classList.toggle('is-service-detail', trigger.matches('[data-service-trigger]'));
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

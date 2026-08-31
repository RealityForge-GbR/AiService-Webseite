/* Once-only, progressive scroll reveals. No scroll hijacking or hidden content
   when motion is reduced, APIs are unavailable, or the enhancement fails. */
(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement;
  const active = new Map();
  const targets = new Map();
  const pendingClass = 'scroll-reveal-pending';
  let observer;

  const syncVisibility = () => {
    root.classList.toggle('page-motion-paused', document.hidden);
    active.forEach((animation) => document.hidden ? animation.pause() : animation.play());
  };
  document.addEventListener('visibilitychange', syncVisibility);
  syncVisibility();

  if (reduced.matches || !('IntersectionObserver' in window) || !Element.prototype.animate) return;

  function finish(element) {
    const animation = active.get(element);
    if (animation) {
      active.delete(element);
      animation.onfinish = null;
      animation.oncancel = null;
      animation.cancel();
    }
    element.classList.remove(pendingClass);
    if (element.matches('[data-system-fusion]')) element.classList.remove('is-animated', 'is-visible');
    targets.delete(element);
    observer?.unobserve(element);
  }

  function reveal(element, delay) {
    const target = targets.get(element);
    if (!target || active.has(element)) return;
    if (reduced.matches || element.contains(document.activeElement)) return finish(element);
    const compact = window.innerWidth <= 760;
    const from = { opacity: 0 };
    const to = { opacity: 1 };
    if (target.effect === 'rise' || target.effect === 'pop') {
      from.translate = `0 ${target.effect === 'rise' ? (compact ? 16 : 28) : (compact ? 8 : 12)}px`;
      to.translate = '0 0';
    }
    if (target.effect === 'pop') {
      from.scale = compact ? '.98' : '.965';
      to.scale = '1';
    }
    try {
      const fusion = target.effect === 'fusion';
      if (fusion) element.classList.add('is-animated', 'is-visible');
      // Keep the sequence registered until its last caption is complete, so
      // reduced motion, tab suspension and anchor jumps finish every phase.
      const frames = fusion ? [{ opacity: 0 }, { opacity: 1, offset: .1 }, { opacity: 1 }] : [from, to];
      const animation = element.animate(frames, {
        duration: fusion ? 2100 : compact ? 440 : (target.effect === 'rise' ? 620 : 540),
        delay,
        easing: 'cubic-bezier(.2, .75, .2, 1)',
        fill: 'both'
      });
      active.set(element, animation);
      animation.onfinish = () => finish(element);
      animation.oncancel = () => finish(element);
      observer.unobserve(element);
      if (document.hidden) animation.pause();
    } catch {
      finish(element);
    }
  }

  const specs = [
    ['#services-overview-title', 'fade'],
    ['#leistungen .service-card', 'pop', 'services'],
    ['#economics-title', 'rise'],
    ['.evidence-bar', 'rise', 'evidence'],
    ['.evidence-team-terminal', 'fade'],
    ['.evidence-team-copy', 'fade'],
    ['.economics-bridge', 'fade'],
    ['.business-step > button', 'pop', 'steps'],
    ['.strategy-panel', 'fade'],
    ['#use-cases-title', 'fade'],
    ['.use-cases-intro', 'fade'],
    ['.use-case-bubble:not([data-extra-use-case])', 'pop', 'cases'],
    ['[data-use-case-toggle]', 'fade'],
    ['#modern-ai-title', 'fade'],
    ['.system-fusion', 'fusion'],
    ['.modern-ai-intro', 'fade'],
    ['.ai-topic-network', 'fade'],
    ['.ai-topic-node', 'fade', 'topics'],
    ['.ai-chat-window', 'pop'],
    ['#local-ai-title', 'fade'],
    ['.local-security-stage', 'fade'],
    ['.local-control-points', 'fade'],
    ['.local-ai-foot', 'fade'],
    ['#view-title', 'fade'],
    ['.team-portrait', 'fade', 'portraits'],
    ['.view-copy', 'fade'],
    ['.onsite-contact-panel', 'rise']
  ];

  try {
    observer = new IntersectionObserver((entries) => {
      const groupCounts = new Map();
      // Count only the peers entering together: a single mobile card never
      // waits for a stagger assigned to a previous, already offscreen row.
      entries.sort((a, b) => (targets.get(a.target)?.order || 0) - (targets.get(b.target)?.order || 0));
      entries.forEach((entry) => {
        const target = targets.get(entry.target);
        if (!target || active.has(entry.target)) return;
        if (entry.boundingClientRect.bottom <= 0) return finish(entry.target);
        if (!entry.isIntersecting) return;
        if (target.effect === 'fusion' && entry.intersectionRatio < (window.innerWidth <= 760 ? .2 : .4)) return;
        const index = target.group ? (groupCounts.get(target.group) || 0) : 0;
        if (target.group) groupCounts.set(target.group, index + 1);
        reveal(entry.target, Math.min(index * 80, 400));
      });
    }, { threshold: [0.08, 0.2, 0.4], rootMargin: '0px 0px -24px 0px' });

    specs.forEach(([selector, effect, group]) => {
      document.querySelectorAll(selector).forEach((element, order) => {
        if (element.contains(document.activeElement)) return;
        targets.set(element, { effect, group, order });
        element.classList.add(pendingClass);
        observer.observe(element);
      });
    });
  } catch {
    [...targets.keys()].forEach(finish);
    observer?.disconnect();
    return;
  }

  // Keyboard and anchor navigation never land on invisible content.
  document.addEventListener('focusin', (event) => {
    [...targets.keys()].forEach((element) => {
      if (element.contains(event.target)) finish(element);
    });
  });
  document.addEventListener('click', (event) => {
    // An explicit topic choice takes precedence over a still-running entrance.
    if (event.target.closest('[data-ai-topic]')) {
      const chat = document.querySelector('.ai-chat-window');
      if (chat && targets.has(chat)) finish(chat);
    }
    const anchor = event.target.closest('a[href^="#"]');
    const destination = anchor && document.getElementById(anchor.getAttribute('href').slice(1));
    if (!destination) return;
    [...targets.keys()].forEach((element) => {
      if (destination.contains(element)) finish(element);
    });
  });
  const stop = () => {
    if (!reduced.matches) return;
    [...targets.keys()].forEach(finish);
    observer.disconnect();
  };
  if (reduced.addEventListener) reduced.addEventListener('change', stop);
  else reduced.addListener?.(stop);
})();

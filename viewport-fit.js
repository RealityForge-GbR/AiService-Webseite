/* Fit the local scene, never shrink prose/controls or crop a whole chapter.
   Pure sizing arithmetic is exposed for non-rendering regression fixtures. */
(function (scope) {
  'use strict';
  function fitScene({ availableWidth, viewportHeight, outsideHeight, mobile, rem = 16 }) {
    if (![availableWidth, viewportHeight, outsideHeight, rem].every(Number.isFinite) || availableWidth <= 0 || viewportHeight <= 0 || rem <= 0) return null;
    const ratio = mobile ? 360 / 560 : 1200 / 800;
    const maximum = Math.min(availableWidth, (mobile ? 23 : 65) * rem);
    const minimum = Math.min(maximum, (mobile ? 15 : 40) * rem);
    const room = Math.max(0, viewportHeight - outsideHeight - rem);
    // Round down; never overflow a just-fitting height through pixel rounding.
    const width = Math.floor(Math.max(minimum, Math.min(maximum, room * ratio)) * 100) / 100;
    return { width, fits: width / ratio <= room + .01 };
  }
  scope.RealityForgeViewportFit = Object.freeze({ fitScene });
  const section = scope.document?.querySelector('#lokale-ki');
  const stage = section?.querySelector('.local-security-stage');
  const visual = section?.querySelector('.local-security-visual');
  if (!stage || !visual) return;
  let frame = 0;
  function render() {
    frame = 0;
    const view = scope.visualViewport;
    const result = fitScene({
      availableWidth: visual.clientWidth,
      // Pinch zoom must enlarge content, not trigger compensating shrinkage.
      viewportHeight: view && view.scale === 1 ? Math.min(scope.innerHeight, view.height) : scope.innerHeight,
      outsideHeight: section.offsetHeight - stage.offsetHeight,
      mobile: scope.matchMedia('(max-width: 760px)').matches,
      rem: parseFloat(scope.getComputedStyle(scope.document.documentElement).fontSize) || 16
    });
    if (!result) return;
    const value = `${result.width}px`;
    if (stage.style.getPropertyValue('--local-scene-width') !== value) stage.style.setProperty('--local-scene-width', value);
    // A too-short/zoomed screen keeps a natural scroll instead of tiny labels.
    section.dataset.viewportFit = result.fits ? 'fitted' : 'readable-scroll';
  }
  function schedule() { if (!frame) frame = scope.requestAnimationFrame(render); }
  scope.addEventListener('resize', schedule, { passive: true });
  scope.visualViewport?.addEventListener('resize', schedule, { passive: true });
  scope.document.fonts?.ready.then(schedule);
  scope.document.fonts?.addEventListener('loadingdone', schedule);
  if ('ResizeObserver' in scope) {
    const observer = new scope.ResizeObserver(schedule);
    observer.observe(section);
    observer.observe(visual);
  }
  schedule();
})(window);

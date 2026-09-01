/* Permanent approved layout. No editor, drag handlers or browser-stored drafts. */
(function () {
  'use strict';
  const core = window.RealityForgeLocalLayout;
  const stage = document.querySelector('.local-security-stage');
  const config = core?.validate(window.RealityForgeLocalLayoutConfig);
  if (!stage || !config) return;
  const nodes = Object.fromEntries([...stage.querySelectorAll('[data-layout-node]')].map(el => [el.dataset.layoutNode, el]));
  if (core.keys.some(key => !nodes[key])) return;
  const originalStyles = Object.fromEntries(core.keys.map(key => [key, nodes[key].getAttribute('style')]));
  const mobile = window.matchMedia('(max-width: 760px)');
  let frame = 0, currentVariant = null;

  function applyPositions() {
    const variant = mobile.matches ? 'mobile' : 'desktop';
    if (variant === currentVariant) return;
    currentVariant = variant;
    const positions = config.layouts[variant];
    for (const key of core.keys) {
      if (positions) Object.assign(nodes[key].style, { left: `${positions[key].x * 100}%`, top: `${positions[key].y * 100}%`, right: 'auto', bottom: 'auto', transform: 'translate(-50%, -50%)' });
      else if (originalStyles[key] === null) nodes[key].removeAttribute('style');
      else nodes[key].setAttribute('style', originalStyles[key]);
    }
  }
  function measure() {
    const r = stage.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    const width = mobile.matches ? 360 : 1200, height = mobile.matches ? 560 : 800;
    const rect = el => {
      const box = el.getBoundingClientRect();
      return { left: (box.left - r.left) / r.width * width, right: (box.right - r.left) / r.width * width, top: (box.top - r.top) / r.height * height, bottom: (box.bottom - r.top) / r.height * height };
    };
    const image = rect(nodes.building), iw = image.right - image.left, ih = image.bottom - image.top;
    // Visible bounds of the 1536×1024 building, excluding transparent margins.
    const building = { left: image.left + iw * 188 / 1536, right: image.left + iw * 1340 / 1536, top: image.top + ih * 60 / 1024, bottom: image.top + ih * 910 / 1024 };
    return { width, height, mobile: mobile.matches, rects: Object.fromEntries(['one', 'two', 'three', 'four'].map(key => [key, rect(nodes[key])])), circle: rect(stage.querySelector('.local-ai-node-icon')), copy: rect(stage.querySelector('.local-ai-node-copy')), building, roof: { x: (image.left + image.right) / 2, y: image.top + ih * 97 / 1024 } };
  }
  function render() {
    frame = 0;
    applyPositions();
    // Positions stay authored, including the separate mobile composition.
    // Paths follow the measured ports even when the height budget shrinks it.
    const scene = measure();
    if (!scene) return;
    const result = core.routeScene(scene);
    const prefix = mobile.matches ? 'local-mobile-' : 'local-route-';
    for (const [key, route] of Object.entries(result.routes)) {
      const path = stage.querySelector(`#${prefix}${key}`);
      path.setAttribute('d', route.d);
      const uses = stage.querySelectorAll(`use[href="#${prefix}${key}"]`);
      // Never replace the chosen layout with the old positions. In an extreme
      // text-zoom case, omit an impossible route instead of crossing an object.
      uses.forEach(el => { el.style.visibility = route.invalid ? 'hidden' : ''; });
      if (!path.getTotalLength) continue;
      const length = path.getTotalLength();
      const signal = stage.querySelector(`.local-network-impulses use[href="#${prefix}${key}"]`);
      signal.style.setProperty('--flow-end', String(-length));
      signal.style.setProperty('--flow-gap', String(length + 48));
    }
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(render); }
  applyPositions();
  schedule();
  window.addEventListener('resize', schedule, { passive: true });
  nodes.building.addEventListener('load', schedule);
  document.fonts?.ready.then(schedule);
  if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(stage);
})();

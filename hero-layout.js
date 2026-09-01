/* Fit the actual logo lettering to the shared content rail, not SVG gutters.
   Screen and headline use that same rail directly in CSS. No monitor scaling. */
(() => {
  function alignWordmark(logo, rail) {
    if (!logo?.textHi || !logo.textB || !Number.isFinite(rail?.width) || rail.width <= 0) return false;
    const measureInk = () => {
      const a = logo.textHi.getBoundingClientRect();
      const b = logo.textB.getBoundingClientRect();
      const left = Math.min(a.left, b.left);
      return { left, width: Math.max(a.right, b.right) - left };
    };
    const host = logo.getBoundingClientRect();
    let ink = measureInk();
    if (![host.width, ink.width].every(n => Number.isFinite(n) && n > 0)) return false;
    const width = Math.round(host.width * rail.width / ink.width * 100) / 100;
    if (Math.abs(width - host.width) > .05) logo.style.setProperty('--hero-wordmark-width', `${width}px`);
    // Re-measure after width changes: SVG side bearings scale with the host.
    ink = measureInk();
    const previous = parseFloat(logo.style.getPropertyValue('--hero-wordmark-offset')) || 0;
    const offset = Math.round((previous + rail.left - ink.left) * 100) / 100;
    if (Number.isFinite(offset) && Math.abs(offset - previous) > .05) {
      logo.style.setProperty('--hero-wordmark-offset', `${offset}px`);
    }
    return true;
  }
  function centerPortal(logo, title) {
    if (!logo?.textHi || !logo.textB || !logo.setLowerPortalY || !title) return false;
    const matrix = logo.word?.getScreenCTM?.();
    if (!matrix || !Number.isFinite(matrix.d) || matrix.d <= 0) return false;
    // SVG text bounds describe the lettering, not its oversized host box.
    // All measurements share viewport coordinates, so scrolling cancels out.
    const bottom = Math.max(logo.textHi.getBoundingClientRect().bottom, logo.textB.getBoundingClientRect().bottom);
    const top = title.getBoundingClientRect().top;
    if (![bottom, top, matrix.f].every(Number.isFinite) || top <= bottom) return false;
    logo.setLowerPortalY(((bottom + top) / 2 - matrix.f) / matrix.d);
    return true;
  }
  window.RealityForgeHeroLayout = Object.freeze({ alignWordmark, centerPortal });
})();

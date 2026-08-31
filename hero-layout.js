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
  window.RealityForgeHeroLayout = Object.freeze({ alignWordmark });
})();

// Non-rendering DOM and geometry fixtures, not a browser visual acceptance test.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require(path.join(process.env.RF_TEST_MODULES, 'jsdom'));
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const source = fs.readFileSync(path.join(root, 'hero-layout.js'), 'utf8');
const main = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'hero-copy-layout.css'), 'utf8');
const dom = new JSDOM(html, { url: 'https://test.invalid/', runScripts: 'outside-only', pretendToBeVisual: true });
const w = dom.window, d = w.document, q = s => d.querySelector(s);
const rect = (left, top, width, height) => ({ left, top, width, height, right: left + width, bottom: top + height });
const screen = q('.hero-system-screen'), copy = q('.hero-copy'), logo = q('#hero-wordmark'), title = q('#hero-title');
assert.equal(q('.hero-terminal-shell').classList.contains('hero-unified'), true);
assert(!q('.hero-intro'), 'The explanatory hero paragraph is removed');
assert.equal(screen.children.length, 1, 'Only the service overview remains between the racks');
assert(screen.contains(q('.monitor-service-list')));
const serverStage = q('.hero-server-stage');
assert.equal(screen.parentElement, serverStage);
assert.equal(serverStage.nextElementSibling, q('.hero-actions'));
assert.deepEqual([...serverStage.children].map(el => el.className), [
  'hero-server-rack hero-server-rack-left', 'hero-system-screen', 'hero-server-rack hero-server-rack-right'
]);
const rackImages = [...serverStage.querySelectorAll('.hero-server-rack img')];
assert.equal(rackImages.length, 2);
assert(rackImages.every(img => img.getAttribute('src') === 'assets/hero-server-matched-v3.png'), 'One source gives the pair identical optics');
for (const img of rackImages) {
  assert.equal(img.getAttribute('alt'), '');
  assert.equal(img.parentElement.getAttribute('aria-hidden'), 'true');
  assert.equal(img.getAttribute('width'), '901');
  assert.equal(img.getAttribute('height'), '1746');
  const png = fs.readFileSync(path.join(root, img.getAttribute('src')));
  assert.equal(png.readUInt32BE(16), img.width);
  assert.equal(png.readUInt32BE(20), img.height);
  assert.equal(png[25], 6, 'PNG has RGBA channels');
}
assert.match(css, /grid-template-columns: minmax\(0, 13%\) minmax\(0, 1fr\) minmax\(0, 13%\)/, 'Dedicated side columns keep racks outside the copy');
assert.match(css, /\.hero-server-rack-left \{ grid-column: 1; grid-row: 1; \}/);
assert.match(css, /\.hero-server-rack-right \{ grid-column: 3; grid-row: 1; \}/);
assert.match(css, /\.hero-server-rack img \{[^}]*width: auto;[^}]*max-width: none;[^}]*height: 98%;/s);
assert.match(css, /\.hero-server-rack img \{[^}]*top: 50%;[^}]*left: 50%;[^}]*transform: translate\(-50%, -50%\);/s);
assert.match(css, /\.hero-server-rack-right img \{ transform: translate\(-50%, -50%\) scaleX\(-1\); \}/);
assert.match(css, /\.hero-server-rack \{[^}]*aspect-ratio: 344 \/ 941;[^}]*pointer-events: none;/s);
assert.match(css, /\.hero-server-rack \{[^}]*overflow: visible;/s);
const rackImageRule = css.match(/\.hero-server-rack img \{[^}]+/)[0];
assert(!/clip-path|mask(?:-image)?\s*:/.test(rackImageRule), 'True source alpha keeps the complete cabinet visible');
assert.match(rackImageRule, /filter: brightness\(\.53\) contrast\(1\.08\) saturate\(\.82\)/, 'The photographic source receives the darker restrained treatment');
assert.match(css, /\.hero-server-rack::after \{[^}]*mask: url\("assets\/hero-server-matched-v3\.png"\)[^}]*mix-blend-mode: screen;[^}]*opacity: \.44;/s, 'A source-alpha-shaped violet wash styles the cabinet without tracing or altering it');
assert.match(css, /\.hero-server-rack-right::after \{ transform: scaleX\(-1\); \}/, 'The violet treatment mirrors with the identical right cabinet');
assert.match(css, /@media \(max-width: 760px\)[\s\S]*\.hero-server-rack \{ display: none; \}/, 'Phone copy has full width, never a narrow server gutter');
assert.equal(q('.hero-actions').children.length, 2);
assert.equal(q('.hero-actions a').getAttribute('href'), 'mailto:realityforgeeu@gmail.com?subject=Anfrage%20zu%20KI-Systemen');
assert.equal(q('.hero-actions a:last-child').getAttribute('href'), '#anwendungsbeispiele');
assert(!q('.hero-monitor, .hero-monitor-space, .monitor-size-editor'));
assert(!/desktopScale|fitText|alignCopy|localStorage/.test(source));
assert(!/hero-monitor-scale|hero-copy-stacked|hero-intro-shift|hero-actions-shift/.test(main));
assert.match(css, /\.hero-unified > \.section-shell\s*\{\s*width: min\(100%, var\(--max-width\)\)/, 'Both sections use one rail');
assert.match(css, /\.hero-terminal-shell\.hero-unified\s*\{[^}]*height: auto;/);
assert.match(css, /\.hero-system-screen \{[^}]*grid-template-columns: minmax\(0, 1fr\);[^}]*place-items: center;/s, 'One centered service column replaces the split layout');
assert(!/overflow:\s*hidden|aspect-ratio/.test(css.match(/\.hero-system-screen \{[^}]+/)[0]), 'Screen grows with text');
assert.match(css.match(/\.hero-system-screen \{[^}]+/)[0], /border: 0;/, 'The server racks replace the old monitor frame');
// Reserved-column budget checks, not browser geometry measurements.
for (const viewport of [761, 820, 992, 993, 1024, 1100, 1280, 1440, 1613, 1920, 2560, 3440]) {
  const padding = Math.max(16, Math.min(72, viewport * .04));
  const railWidth = Math.min(viewport, 1440) - padding * 2;
  const rackWidth = railWidth * .13;
  const outerGap = Math.max(12, Math.min(24, viewport * .016));
  const centerWidth = railWidth - 2 * rackWidth - 2 * outerGap;
  assert(centerWidth > 460, 'Center keeps a usable text width');
  assert(Math.abs(centerWidth + 2 * rackWidth + 2 * outerGap - railWidth) < .01);
  assert(centerWidth - 48 > 410, 'The full center width is available for single-line service names');
  const rackHeight = rackWidth * 941 / 344;
  const imageScale = rackHeight * .98 / 1746;
  const offsetX = (rackWidth - 901 * imageScale) / 2;
  const offsetY = (rackHeight - 1746 * imageScale) / 2;
  for (const side of ['left', 'right']) {
    // Bounds measured from the alpha>=128 silhouette of the actual PNG.
    for (const [x, y] of [[136, 23], [767, 23], [136, 1727], [767, 1727]]) {
      const px = offsetX + (side === 'left' ? x : 901 - x) * imageScale, py = offsetY + y * imageScale;
      assert(px > 0 && px < rackWidth && py > 0 && py < rackHeight, `${viewport}px: ${side} rear edge, top and feet fit fully inside their reserved slot`);
    }
  }
}
w.eval(source);
const { alignWordmark } = w.RealityForgeHeroLayout;
let rail = rect(80, 500, 1280, 300), inkRatio = .86, bearing = .035;
const value = name => parseFloat(logo.style.getPropertyValue(name)) || 0;
logo.getBoundingClientRect = () => rect(rail.left + value('--hero-wordmark-offset'), 150 - w.scrollY, value('--hero-wordmark-width') || rail.width, 200);
const ink = () => {
  const host = logo.getBoundingClientRect();
  return rect(host.left + bearing * host.width, host.top, host.width * inkRatio, 100);
};
logo.textHi = { getBoundingClientRect: () => { const r = ink(); return rect(r.left, r.top, r.width * .45, 100); } };
logo.textB = { getBoundingClientRect: () => { const r = ink(); return rect(r.left + r.width * .52, r.top, r.width * .48, 100); } };
for (const width of [320, 390, 760, 761, 992, 1100, 1613, 1920, 2560, 3440]) {
  const padding = Math.max(16, Math.min(72, width * .04));
  const outer = Math.min(width, 1440);
  rail = rect((width - outer) / 2 + padding, 500, outer - padding * 2, 300);
  for (const ratio of [.58, .86, 1.1]) {
    inkRatio = ratio;
    assert(alignWordmark(logo, rail));
    assert(Math.abs(ink().left - rail.left) < .1, 'Logo ink follows the left rail');
    assert(Math.abs(ink().right - rail.right) < .1, 'Logo ink follows the right rail');
    const style = logo.style.cssText;
    for (let i = 0; i < 5; i++) alignWordmark(logo, rail);
    assert.equal(logo.style.cssText, style, 'No compounded scale or offset');
  }
}
assert.equal(alignWordmark(logo, { width: 0 }), false);
assert.equal(alignWordmark(null, rail), false);
const saved = inkRatio; inkRatio = 0;
assert.equal(alignWordmark(logo, rail), false);
inkRatio = saved;

// Main-script integration: narrow/wide round trips, fonts, scroll and no
// content mutation. Bounds below are fixtures, not layout-engine measurements.
const pending = [];
w.requestAnimationFrame = cb => { pending.push(cb); return pending.length; };
const flush = () => { let limit = 100; while (pending.length && limit--) pending.shift()(); assert(limit > 0); };
w.matchMedia = () => ({ matches: true, addEventListener() {} });
w.scrollTo = () => {};
w.ResizeObserver = class { observe() {} };
w.IntersectionObserver = class { observe() {} };
w.RealityForgeLogoSettings = { fontFinal: 'sans-serif', fontCode: 'monospace', reducedMotion: 'static' };
w.customElements.define('reality-forge-logo', class extends w.HTMLElement {});
logo.restart = () => {}; logo.showFinal = () => {};
copy.getBoundingClientRect = () => rail;
q('.hero-main-title-copy').getBoundingClientRect = () => rect(rail.left, 0, (parseFloat(title.style.fontSize) || 30) * 20, 50);
d.documentElement.style.fontSize = '16px';
const content = screen.innerHTML;
w.eval(main);
(async () => {
  await Promise.resolve(); flush();
  for (const width of [1613, 390, 1024, 760, 2560, 1613]) {
    w.innerWidth = width;
    rail = rect(20, 500, Math.min(width - 40, 1300), 300);
    w.dispatchEvent(new w.Event('resize')); flush();
    assert(Math.abs(ink().width - rail.width) < .1);
    if (width <= 760) assert.equal(title.style.fontSize, '', 'Mobile title wraps at its CSS size');
    else assert(Math.abs(parseFloat(title.style.fontSize) * 20 - rail.width) < .1);
    for (const heading of screen.querySelectorAll('h2')) assert.equal(heading.style.fontSize, '', 'Never shrink service names to fit a bitmap');
    assert.equal(screen.innerHTML, content);
  }
  const beforeScroll = logo.style.cssText;
  w.scrollY = 240; w.dispatchEvent(new w.Event('resize')); flush();
  assert.equal(logo.style.cssText, beforeScroll);
  d.documentElement.style.fontSize = '48px';
  w.dispatchEvent(new w.Event('resize')); flush();
  assert(title.classList.contains('hero-title-wrap'), 'Large user fonts get wrapping, not a forced tiny title');
  assert.equal(title.style.fontSize, '');
  w.close();
  console.log('PASS: two decorative server racks in reserved columns, original image proportions, external CTAs, responsive text budgets, 30 logo-width/font fixtures, stable alignment, mobile/title zoom fallback and unchanged copy.');
})().catch(error => { w.close(); console.error(error); process.exitCode = 1; });

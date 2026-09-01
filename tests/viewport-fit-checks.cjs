// Source/DOM fixtures only. No browser rendering or screenshot assertions.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require(path.join(process.env.RF_TEST_MODULES, 'jsdom'));
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const html = read('index.html'), source = read('viewport-fit.js'), css = read('viewport-refinements.css');
const dom = new JSDOM(html, { runScripts: 'outside-only', pretendToBeVisual: true });
const w = dom.window, d = w.document;
const section = d.querySelector('#lokale-ki'), stage = section.querySelector('.local-security-stage');
const visual = section.querySelector('.local-security-visual');
const tasks = new Map(); let id = 0, width = 1280, outside = 260, small = false;
w.innerWidth = 1440; w.innerHeight = 900;
w.requestAnimationFrame = fn => { tasks.set(++id, fn); return id; };
w.matchMedia = () => ({ get matches() { return small; } });
let observeCallback;
w.ResizeObserver = class { constructor(fn) { observeCallback = fn; } observe() {} };
const sceneWidth = () => parseFloat(stage.style.getPropertyValue('--local-scene-width')) || width;
Object.defineProperty(visual, 'clientWidth', { get: () => width });
Object.defineProperty(stage, 'offsetHeight', { get: () => Math.round(sceneWidth() * (small ? 560 / 360 : 800 / 1200)) });
Object.defineProperty(section, 'offsetHeight', { get: () => stage.offsetHeight + outside });
const flush = () => { let count = 0; while (tasks.size) { assert(++count < 8, 'No resize feedback loop'); const batch = [...tasks.values()]; tasks.clear(); batch.forEach(fn => fn()); } };
w.eval(source); flush();
const fit = w.RealityForgeViewportFit.fitScene;
for (const [vw, vh, prose] of [[320, 568, 350], [390, 844, 350], [430, 932, 325], [760, 1024, 300], [761, 768, 250], [1024, 768, 250], [1366, 768, 255], [1440, 900, 260], [1613, 1168, 285], [1920, 1080, 280], [2560, 1440, 300], [3440, 1440, 300]]) {
  small = vw <= 760; width = Math.min(vw - 32, 1296); outside = prose; w.innerHeight = vh;
  w.dispatchEvent(new w.Event('resize')); flush();
  const result = fit({ availableWidth: width, viewportHeight: vh, outsideHeight: outside, mobile: small });
  assert.equal(sceneWidth(), result.width);
  assert(result.width <= width);
  assert(result.width >= Math.min(width, small ? 240 : 640) - .01);
  assert.equal(section.dataset.viewportFit, result.fits ? 'fitted' : 'readable-scroll');
  if (vw === 320) assert(!result.fits, 'Very short phone retains readable natural scroll');
  else assert(result.fits, `${vw}×${vh}: reference text and scene fit the height budget`);
  const previous = stage.style.cssText;
  for (let n = 0; n < 4; n++) { observeCallback(); flush(); }
  assert.equal(stage.style.cssText, previous, 'Stable through observer callbacks');
}
for (const rem of [16, 24, 32, 48]) {
  const result = fit({ availableWidth: 800, viewportHeight: 600, outsideHeight: 350, mobile: false, rem });
  assert.equal(result.width, Math.min(800, 40 * rem), 'Text enlargement preserves diagram readability instead of forcing a fit');
  assert(!result.fits);
}
assert.equal(fit({ availableWidth: 0, viewportHeight: 700, outsideHeight: 100 }), null);
assert.equal(fit({ availableWidth: 900, viewportHeight: NaN, outsideHeight: 100 }), null);
// Dynamic browser chrome can reduce room; pinch zoom must not counteract zoom.
width = 1000; outside = 200; small = false; w.innerHeight = 1000;
Object.defineProperty(w, 'visualViewport', { configurable: true, value: { height: 850, scale: 1 } });
observeCallback(); flush(); const unzoomed = sceneWidth();
w.visualViewport = { height: 500, scale: 2 };
observeCallback(); flush(); assert(sceneWidth() >= unzoomed);
assert.equal(d.querySelectorAll('.local-control-points li').length, 3);
assert(d.querySelector('[data-local-ai-open]'));
assert(!/\.local-ai-foot[^}]*display:\s*none|overflow:\s*hidden|transform:\s*scale/.test(css));
assert.match(css, /#wirtschaftlichkeit \.economics-bridge \.reference-intro \{[^}]*width: 100%;[^}]*max-width: none;[^}]*margin: 0 auto;[^}]*padding-inline: 0;/s);
assert.match(css, /@media \(min-width: 761px\) \{\s*#wirtschaftlichkeit \.business-grid\.business-progress \{\s*padding-block: clamp\(1\.5rem, 3vw, 2\.25rem\);/s);
assert.match(css, /#anwendungsbeispiele \.section-heading-copy \{\s*gap: clamp\(\.8rem, 1\.35vw, 1\.25rem\);/s);
assert.match(css, /#moderne-ki \.system-fusion \{ margin-bottom: 0; \}[\s\S]*#moderne-ki \.modern-ai-intro \{\s*margin: clamp\(2\.25rem, 4vw, 3\.5rem\) auto;/s);
assert.match(css, /#moderne-ki \.ai-chat-conversation \{[^}]*overflow-anchor: none;/s);
assert.match(css, /#unsere-sicht \.view-copy-column \{[^}]*grid-column: 2;[^}]*grid-row: 1;[^}]*justify-content: center;/s);
assert.match(css, /#unsere-sicht \.view-copy \{[^}]*columns: 2;/s);
assert.match(css, /@media \(max-width: 1100px\)[\s\S]*#unsere-sicht \.view-copy-column \{[^}]*grid-column: 1 \/ -1;[^}]*grid-row: 2;/s);
assert.match(css, /#kontakt \.onsite-contact-urgency \{[^}]*padding-left:[^}]*color:/s);
assert.match(read('refinements.css'), /\.view-people-layout \{[^}]*align-items: center;/s);
dom.window.close();

// Real custom-element renderer driven by synthetic layout measurements.
const logoDom = new JSDOM('<div id="title"></div>', { runScripts: 'outside-only', pretendToBeVisual: true });
const lw = logoDom.window;
lw.matchMedia = () => ({ matches: true });
lw.eval(read('assets/reality-forge-logo.js')); lw.eval(read('hero-layout.js'));
const logo = lw.document.createElement('reality-forge-logo'); lw.document.body.appendChild(logo);
const title = lw.document.querySelector('#title');
let inkBottom = 260, titleTop = 350, sy = 1.2, ty = -170;
logo.textHi.getBoundingClientRect = () => ({ bottom: inkBottom });
logo.textB.getBoundingClientRect = () => ({ bottom: inkBottom - 2 });
title.getBoundingClientRect = () => ({ top: titleTop });
logo.word.getScreenCTM = () => ({ a: sy, b: 0, c: 0, d: sy, e: 0, f: ty });
for (const scale of [.3, .6, 1, 1.5, 2]) for (const scroll of [0, 120, 650]) {
  sy = scale; ty = 40 - scroll; inkBottom = 260 - scroll; titleTop = 350 - scroll;
  assert(lw.RealityForgeHeroLayout.centerPortal(logo, title));
  const line = logo.lowerPortalLine;
  const y = (+line.getAttribute('y') + +line.getAttribute('height') / 2) * sy + ty;
  assert(Math.abs(y - (inkBottom + titleTop) / 2) < .01, 'Portal is at the exact midpoint, independent of scaling and scroll');
  const time = logo.currentTime;
  assert(lw.RealityForgeHeroLayout.centerPortal(logo, title));
  assert.equal(logo.currentTime, time, 'Position updates never restart the animation');
}
titleTop = inkBottom - 1;
assert.equal(lw.RealityForgeHeroLayout.centerPortal(logo, title), false);
assert.equal(lw.RealityForgeHeroLayout.centerPortal(null, title), false);
logoDom.window.close();
console.log('PASS: full chapter height budgets at 12 sizes, resize stability, readable short-screen/zoom fallback, text alignment and exact portal midpoint across 15 scale/scroll fixtures.');

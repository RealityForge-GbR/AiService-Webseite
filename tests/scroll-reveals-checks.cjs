// Logic/style regression checks, NOT browser-rendered visual or performance QA.
// RF_TEST_MODULES=/path/to/node_modules node tests/scroll-reveals-checks.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require(path.join(process.env.RF_TEST_MODULES, 'jsdom'));
const csstree = require(path.join(process.env.RF_TEST_MODULES, 'css-tree'));
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const source = fs.readFileSync(path.join(root, 'scroll-reveals.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'page-motion.css'), 'utf8');
const pending = 'scroll-reveal-pending';
const plain = value => JSON.parse(JSON.stringify(value));

function harness({ width = 1440, reduced = false, io = true, waapi = true, throws = false, observeThrows = false } = {}) {
  const dom = new JSDOM(html, { url: 'https://test.invalid/', runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window, doc = w.document, observers = [], animations = [], mediaListeners = [];
  w.innerWidth = width;
  let hidden = false;
  Object.defineProperty(doc, 'hidden', { get: () => hidden });
  const media = { matches: reduced, addEventListener: (_, fn) => mediaListeners.push(fn) };
  w.matchMedia = () => media;
  w.HTMLElement.prototype.scrollIntoView = () => {};
  w.scrollTo = () => {};
  if (io) w.IntersectionObserver = class {
    constructor(callback, options) { this.callback = callback; this.options = options; this.targets = new Set(); observers.push(this); }
    observe(el) { if (observeThrows) throw new Error('Observer failed'); this.targets.add(el); }
    unobserve(el) { this.targets.delete(el); }
    disconnect() { this.targets.clear(); }
  };
  if (waapi) w.Element.prototype.animate = function(frames, options) {
    if (throws) throw new Error('Animation failed');
    const a = { element: this, frames: plain(frames), options: plain(options), state: 'running',
      finish() { this.onfinish?.(); },
      cancel() { this.state = 'cancelled'; this.oncancel?.(); },
      pause() { this.state = 'paused'; },
      play() { this.state = 'running'; }
    };
    animations.push(a); return a;
  };
  w.eval(source);
  const select = selector => [...doc.querySelectorAll(selector)];
  const emit = (selector, { visible = true, bottom = 400, ratio = 1 } = {}) => {
    const observer = observers[0];
    observer.callback(select(selector).map(target => ({ target, isIntersecting: visible, intersectionRatio: ratio, boundingClientRect: { bottom } })));
  };
  const setReduced = matches => { media.matches = matches; mediaListeners.forEach(fn => fn({ matches })); };
  const setHidden = value => { hidden = value; doc.dispatchEvent(new w.Event('visibilitychange')); };
  return { w, doc, select, emit, animations, observers, setReduced, setHidden, close: () => w.close() };
}

for (const width of [390, 768, 1440, 2560]) {
  const h = harness({ width });
  assert.equal(h.observers.length, 1, 'A single entrance observer, not a scroll event handler');
  assert.equal(h.select('.' + pending).length, 45, 'Only explicitly chosen content is enhanced');
  for (const selector of ['#services-overview-title', '#economics-title', '.economics-bridge', '#use-cases-title', '.use-cases-intro', '#modern-ai-title', '.modern-ai-intro', '.ai-chat-window', '.local-security-stage', '#view-title', '.onsite-contact-panel']) {
    assert(h.doc.querySelector(selector).classList.contains(pending), selector);
  }
  assert.equal(h.select('main > section.' + pending + ', dialog.' + pending + ', [data-layout-node].' + pending + ', [data-extra-use-case].' + pending).length, 0, 'Do not move section/modal ancestors, approved nodes, or extra cards');
  assert.equal(h.select('.scroll-reveal-pending .scroll-reveal-pending').length, 0, 'No competing parent/child entrances');
  h.emit('#leistungen .service-card', { visible: false });
  assert.equal(h.animations.length, 0, 'No early animation while outside the viewport');
  h.emit('#leistungen .service-card');
  assert.deepEqual(h.animations.map(a => a.options.delay), [0, 80, 160]);
  assert(h.animations.every(a => a.frames[0].scale && a.frames[0].translate));
  h.animations.slice().forEach(a => a.finish());
  assert.equal(h.select('#leistungen .scroll-reveal-pending').length, 1, 'Cards clear their pending state, leaving only the heading');
  assert(h.animations.every(a => a.state === 'cancelled'), 'Remove finished WAAPI effects instead of permanent compositing');
  h.emit('#leistungen .service-card');
  assert.equal(h.animations.length, 3, 'Returning to the section never replays its entrance');

  h.emit('#economics-title');
  const title = h.animations.at(-1);
  assert.equal(title.frames[0].translate, width <= 760 ? '0 16px' : '0 28px');
  assert.equal(title.frames[1].translate, '0 0');
  assert(!('scale' in title.frames[0]), 'The economics title flies up without scaling');
  h.emit('.economics-bridge');
  assert.deepEqual(h.animations.at(-1).frames, [{ opacity: 0 }, { opacity: 1 }]);

  h.emit('.use-case-bubble:not([data-extra-use-case])');
  assert.deepEqual(h.animations.slice(-6).map(a => a.options.delay), [0, 80, 160, 240, 320, 400]);
  h.emit('.ai-chat-window');
  assert(h.animations.at(-1).frames[0].scale);
  assert(h.animations.every(a => a.frames.every(frame => !('transform' in frame))), 'Preserve authored centering and hover transforms');
  h.emit('.local-security-stage');
  assert.deepEqual(h.animations.at(-1).frames, [{ opacity: 0 }, { opacity: 1 }], 'Approved diagram only fades; geometry must not move');
  const fusion = h.doc.querySelector('.system-fusion');
  h.emit('.system-fusion', { ratio: .1 });
  assert(!fusion.classList.contains('is-animated'), 'Wait until the diagram, not just its upper border, is visible');
  h.emit('.system-fusion', { ratio: width <= 760 ? .2 : .4 });
  assert(fusion.classList.contains('is-animated') && fusion.classList.contains('is-visible'));
  assert.equal(h.animations.at(-1).options.duration, 2100, 'Retain cleanup control through the complete left-to-right sequence');
  assert(h.animations.at(-1).frames.every(frame => !frame.translate && !frame.scale), 'The diagram frame stays still as its contents progress');
  h.setHidden(true);
  assert(h.doc.documentElement.classList.contains('page-motion-paused'));
  assert(h.animations.filter(a => a.state !== 'cancelled').every(a => a.state === 'paused'));
  h.setHidden(false);
  assert(!h.doc.documentElement.classList.contains('page-motion-paused'));
  assert(h.animations.filter(a => a.state !== 'cancelled').every(a => a.state === 'running'));
  h.setReduced(true);
  assert.equal(h.select('.' + pending).length, 0, 'Changing accessibility preferences reveals all remaining content');
  assert(h.animations.every(a => a.state === 'cancelled'));
  assert(!fusion.classList.contains('is-animated') && !fusion.classList.contains('is-visible'), 'Motion reduction also cleans up all child animation states');
  assert.equal(h.observers[0].targets.size, 0);
  h.setReduced(false);
  assert.equal(h.select('.' + pending).length, 0, 'Never re-hide previously readable content');
  h.close();
}
console.log('PASS: one-time stagger, requested fade/rise/pop effects, stable transforms, pause/resume, reduced-motion changes at four widths.');

{
  const h = harness({ width: 390 });
  h.emit('.service-card:nth-child(3)');
  assert.equal(h.animations[0].options.delay, 0, 'An independently entering mobile card does not inherit the desktop delay');
  h.doc.querySelector('.service-card-trigger').focus();
  assert(!h.doc.querySelector('.service-card').classList.contains(pending), 'Keyboard focus reveals its pending card immediately');
  const third = h.doc.querySelector('.service-card:nth-child(3) .service-card-trigger');
  third.focus();
  assert.equal(h.animations[0].state, 'cancelled', 'Keyboard focus also finishes an active entrance');
  h.emit('#economics-title', { visible: false, bottom: -100 });
  assert(!h.doc.querySelector('#economics-title').classList.contains(pending), 'Fast-scrolled content above the viewport is ready on return');
  h.doc.querySelector('[data-ai-topic]').click();
  assert(!h.doc.querySelector('.ai-chat-window').classList.contains(pending), 'Explicit topic choices reveal the answer window immediately');
  h.doc.querySelector('a[href="#anwendungsbeispiele"]').click();
  assert.equal(h.select('#anwendungsbeispiele .' + pending).length, 0, 'Anchor jumps do not make readers wait');
  h.close();
}
for (const options of [{ reduced: true }, { io: false }, { waapi: false }, { observeThrows: true }]) {
  const h = harness(options);
  assert.equal(h.select('.' + pending).length, 0, 'No hidden content when the enhancement cannot run');
  assert.equal(h.animations.length, 0);
  h.close();
}
{
  const h = harness({ throws: true });
  h.emit('.service-card');
  assert.equal(h.select('.service-card.' + pending).length, 0, 'Thrown animation calls fail visibly');
  h.emit('.system-fusion');
  assert.equal(h.select('.system-fusion.is-animated, .system-fusion.' + pending).length, 0, 'Failed sequence cannot leave invisible child nodes');
  h.close();
}
{
  const h = harness();
  h.emit('.system-fusion');
  const sequence = h.animations.at(-1);
  sequence.finish();
  assert.equal(h.select('.system-fusion.is-animated, .system-fusion.is-visible, .system-fusion.' + pending).length, 0);
  h.emit('.system-fusion');
  assert.equal(h.animations.length, 1, 'The completed sequence does not replay on reverse scrolling');
  h.close();
}
console.log('PASS: keyboard/anchor access, fast scrolling, independent mobile reveal, unavailable/failed API fallbacks.');

// Inspect authored CSS (not computed browser geometry) and its rail arithmetic.
const rules = new Map();
csstree.walk(csstree.parse(css), node => {
  if (node.type !== 'Rule') return;
  const selector = csstree.generate(node.prelude);
  const declarations = {};
  node.block.children.forEach(d => { if (d.type === 'Declaration') declarations[d.property] = csstree.generate(d.value).trim(); });
  if (!rules.has(selector)) rules.set(selector, declarations);
});
const chapter = rules.get('main>.section-rule');
assert.equal(chapter.width, '100%');
assert.equal(chapter.border, '0');
assert.equal(chapter['padding-inline'], 'calc((100% - var(--section-frame))/2 + var(--page-padding))');
assert(!chapter.transform && !chapter.isolation && !chapter.overflow, 'No containing block or clipping around fixed dialogs');
assert.match(chapter['background-image'], /linear-gradient\(var\(--bg\),transparent 18%,transparent 82%,var\(--bg\)\)/);
assert.equal(rules.get('main>#leistungen')['--chapter-color'], '#141317');
assert.equal(rules.get('#use-cases-title')['text-align'], 'center');
for (const selector of ['.economics-bridge', '.business-grid.business-progress', '.modern-ai-intro,.reference-intro,.section-heading-copy>.reference-intro']) {
  assert.equal(rules.get(selector).border, '0', selector + ': no divider rules');
}
assert.match(css, /prefers-reduced-motion: reduce/);
assert.match(css, /scroll-behavior: auto !important/);
const phase = selector => rules.get('.system-fusion.is-animated.is-visible ' + selector).animation;
assert.equal(phase('.fusion-software'), 'fusion-step-enter 360ms ease-out both');
assert.equal(phase('.fusion-link-first i'), 'fusion-beam-travel 440ms ease-in-out 220ms both');
assert.equal(phase('.fusion-ai'), 'fusion-step-enter 360ms ease-out 660ms both');
assert.equal(phase('.fusion-link-second i'), 'fusion-beam-travel 440ms ease-in-out 880ms both');
assert.equal(phase('.fusion-system'), 'fusion-step-enter 440ms ease-out 1320ms both');
assert.equal(phase('.fusion-caption'), 'fusion-fade-in 300ms ease 1760ms both');
assert.match(css, /animation-name: fusion-beam-travel-vertical/);
assert.equal(rules.get('.system-fusion .fusion-link i').opacity, '0', 'The moving impulse is hidden in the final/static state');
console.log('PASS: ordered software → signal → AI → signal → system timeline, vertical mobile route, full-sequence cleanup and once-only playback.');
for (const vw of [320, 390, 760, 761, 1024, 1440, 1599, 1600, 1920, 2560, 3440]) {
  const pagePadding = Math.max(20, Math.min(vw * .04, 72));
  const oldFrame = vw >= 1600 ? Math.min(vw * .92, 1920) : Math.min(vw, 1440);
  const oldInnerWidth = vw <= 760 ? vw - 32 : oldFrame - 2 * pagePadding;
  const newPadding = vw <= 760 ? 16 : (vw - oldFrame) / 2 + pagePadding;
  assert(Math.abs((vw - 2 * newPadding) - oldInnerWidth) < 1e-9, vw + ': preserve the previous content rail / local diagram size');
}
console.log('PASS: soft full-width bands, divider removal, centered use-case title, unchanged content-rail arithmetic at 11 widths.');

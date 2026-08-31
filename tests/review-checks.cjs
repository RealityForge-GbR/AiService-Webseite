// Non-rendering regression checks. These do not replace browser/device visual QA.
// RF_TEST_MODULES=/path/to/node_modules node tests/review-checks.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const dependencyRoot = process.env.RF_TEST_MODULES;
if (!dependencyRoot) throw new Error('Set RF_TEST_MODULES to an isolated installation of jsdom and css-tree.');
const { JSDOM, VirtualConsole } = require(path.join(dependencyRoot, 'jsdom'));
const csstree = require(path.join(dependencyRoot, 'css-tree'));
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const reveals = fs.readFileSync(path.join(root, 'scroll-reveals.js'), 'utf8');
const baseline = execFileSync('git', ['show', 'f78df52:index.html'], { cwd: root, encoding: 'utf8' });
const document = new JSDOM(html).window.document;
const before = new JSDOM(baseline).window.document;
const refinements = csstree.parse(fs.readFileSync(path.join(root, 'refinements.css'), 'utf8'));
const normalize = (text) => text.replace(/\s+/g, ' ').trim();
const texts = (doc, selector) => [...doc.querySelectorAll(selector)].map((el) => normalize(el.textContent));
const ids = [...document.querySelectorAll('[id]')].map((el) => el.id);
assert.equal(ids.length, new Set(ids).size, 'IDs must be unique');
for (const el of document.querySelectorAll('[aria-controls], [aria-labelledby], [aria-describedby]')) {
  for (const attr of ['aria-controls', 'aria-labelledby', 'aria-describedby']) {
    for (const id of (el.getAttribute(attr) || '').split(/\s+/).filter(Boolean)) assert(document.getElementById(id), `Missing ${attr} target ${id}`);
  }
}
for (const el of document.querySelectorAll('[href^="#"]')) {
  assert(document.querySelector(el.getAttribute('href')), `Missing anchor or SVG reference ${el.getAttribute('href')}`);
}
for (const el of document.querySelectorAll('img[src], script[src], link[rel="stylesheet"][href]')) {
  const url = el.getAttribute('src') || el.getAttribute('href');
  if (!/^(https?:|data:)/.test(url)) assert(fs.existsSync(path.join(root, url.split('?')[0])), `Missing asset ${url}`);
}
assert.deepEqual(texts(document, '.business-step-details'), texts(before, '.business-step-details'), 'All four original step texts must be unchanged');
assert.deepEqual(texts(document, '.service-details > p'), texts(before, '.service-card > p'), 'All original service paragraphs remain in the dialogs');
assert.deepEqual(texts(document, '.service-context-detail p'), texts(before, '#leistungen .section-context p'), 'Restore both removed introduction paragraphs in the service details');
assert.deepEqual(texts(document, '.service-card h3'), texts(before, '.service-card h3'));
assert.equal(document.querySelectorAll('[data-service-trigger]').length, 3);
assert.equal(document.querySelectorAll('.service-details[hidden]').length, 3);
assert.equal(document.querySelector('#services-overview-title').textContent, 'Potenzial erkennen. Passende KI umsetzen.');
assert(!document.querySelector('.services-compact-intro span'));
assert.match(document.querySelectorAll('.service-card-trigger')[1].innerHTML, /&amp;\s*<br>On-Premises AI/);
assert.equal(document.querySelector('#economics-title').textContent, before.querySelector('#economics-title').textContent);
for (const summary of texts(document, '.service-summary')) assert(summary.split(/\s+/).length <= 15, 'Keep the visible service summaries brief');
assert.deepEqual(texts(document, '.evidence-bars .evidence-bar-copy > strong'), ['+17,5 %', '26 %', '50–130 %']);
for (const key of ['accuracy', 'tasks', 'productivity']) {
  assert.equal(document.querySelector(`template[data-evidence-detail="${key}"]`).innerHTML, before.querySelector(`template[data-evidence-detail="${key}"]`).innerHTML, `Preserve the ${key} study/source mapping`);
}
assert.deepEqual(texts(document, '.view-copy p'), texts(before, '.view-copy p'), 'Retain all team section paragraphs');
assert.deepEqual(texts(document, 'template[data-ai-response]'), texts(before, 'template[data-ai-response]'));
assert.equal(document.querySelectorAll('#leistungen .section-context, #services-title').length, 0);
assert.equal(document.querySelectorAll('.team-portrait').length, 2);
assert.equal(document.querySelectorAll('.team-portrait figcaption, .portrait-placeholder, .monitor-toolbar, .strategy-addon-block > small').length, 0);
assert(!document.querySelector('#unsere-sicht').textContent.includes('Porträt folgt'));
assert.deepEqual([...document.querySelectorAll('.team-portrait img')].map(img => [img.getAttribute('src'), img.alt]), [['assets/patrick.png', 'Patrick'], ['assets/evgeni.png', 'Evgeni']], 'Patrick belongs left, Evgeni right');
for (const img of document.querySelectorAll('.team-portrait img')) {
  const png = fs.readFileSync(path.join(root, img.getAttribute('src')));
  assert.equal(png.readUInt32BE(16), Number(img.width));
  assert.equal(png.readUInt32BE(20), Number(img.height));
  assert.equal(img.width / img.height, 3 / 4, 'Portraits fit their existing frames without cropping');
  assert.equal(img.getAttribute('loading'), 'lazy');
}
assert.deepEqual(texts(document, '.strategy-addon-block h3'), ['Praxis schafft Erfahrung.', 'Früher lernen.']);
assert.deepEqual(texts(document, '.strategy-addon-block p'), texts(before, '.strategy-addon-block p'), 'Only headings/labels change, not the explanatory copy');
assert.equal(document.querySelectorAll('.evidence-terminal-chrome small').length, 0);
assert.equal(document.querySelectorAll('.local-data-map animateMotion, .local-data-map circle').length, 0);
assert.equal(document.querySelectorAll('.step-open-badge').length, 4);
assert.equal(document.querySelectorAll('.monitor-service-list > li').length, 3);
assert.equal(document.querySelectorAll('.hero-monitor [hidden], [data-monitor-scene]').length, 0);
for (const file of ['styles.css', 'refinements.css', 'page-motion.css', 'monitor-services.css', 'hero-copy-layout.css']) {
  const parseErrors = [];
  const ast = csstree.parse(fs.readFileSync(path.join(root, file), 'utf8'), { positions: true, parseCustomProperty: true, onParseError: (error) => parseErrors.push(error.message) });
  assert.deepEqual(parseErrors, [], `${file}: CSS parse errors`);
  csstree.walk(ast, (node) => { assert.notEqual(node.type, 'Raw', `${file}: unparsed CSS at ${node.loc?.start.line}`); });
}
console.log('PASS: HTML/assets, unchanged paragraphs, four controls, mapped original portraits, shortened headings, removed labels, CSS parsing.');

// Sample the authored SVG geometry, not a browser rendering. Reject crossings
// and any data path entering the reserved building area before visual QA.
function samplePath(data) {
  const tokens = data.match(/[A-Za-z]|-?\d*\.?\d+/g);
  const points = [];
  let at = [0, 0];
  let i = 0;
  const n = () => Number(tokens[i++]);
  while (i < tokens.length) {
    const command = tokens[i++];
    const start = [...at];
    if (command === 'M') { at = [n(), n()]; points.push(at); }
    else if (command === 'L' || command === 'H' || command === 'V') {
      at = command === 'L' ? [n(), n()] : command === 'H' ? [n(), at[1]] : [at[0], n()];
      points.push(at);
    } else if (command === 'C' || command === 'Q') {
      const c1 = [n(), n()];
      const c2 = command === 'C' ? [n(), n()] : null;
      at = [n(), n()];
      for (let step = 1; step <= 100; step += 1) {
        const t = step / 100;
        const u = 1 - t;
        points.push(start.map((v, axis) => c2
          ? u ** 3 * v + 3 * u ** 2 * t * c1[axis] + 3 * u * t ** 2 * c2[axis] + t ** 3 * at[axis]
          : u ** 2 * v + 2 * u * t * c1[axis] + t ** 2 * at[axis]));
      }
    } else throw new Error(`Unsupported geometry command: ${command}`);
  }
  return points;
}
const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
const intersects = (a, b, c, d) => cross(a, b, c) * cross(a, b, d) < 0 && cross(c, d, a) * cross(c, d, b) < 0;
function distanceToSegment(point, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared ? Math.max(0, Math.min(1, ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / lengthSquared)) : 0;
  return Math.hypot(point[0] - a[0] - t * dx, point[1] - a[1] - t * dy);
}
// Read the explicitly authored component overrides, not computed browser layout.
function componentStyle(selector, viewportWidth) {
  const result = {};
  function visit(nodes) {
    nodes.forEach((node) => {
      if (node.type === 'Atrule' && node.name === 'media') {
        const condition = csstree.generate(node.prelude);
        if (/prefers-reduced-motion|max-height/.test(condition)) return;
        const min = condition.match(/min-width:\s*([\d.]+)px/);
        const max = condition.match(/max-width:\s*([\d.]+)px/);
        if ((!min || viewportWidth >= Number(min[1])) && (!max || viewportWidth <= Number(max[1]))) visit(node.block.children);
      } else if (node.type === 'Rule' && csstree.generate(node.prelude).split(',').includes(selector)) {
        node.block.children.forEach((declaration) => {
          if (declaration.type === 'Declaration') result[declaration.property] = csstree.generate(declaration.value);
        });
      }
    });
  }
  visit(refinements.children);
  return result;
}
const glow = componentStyle('.local-security-stage::before', 1571);
assert(/ellipse\s+50%\s*50%\s*at\s*50%\s*50%/.test(glow.background), 'The glow ellipse must fit its own paint box');
assert(glow.background.endsWith('rgba(var(--accent-rgb),0) 100%)'), 'The glow must reach zero alpha at every paint-box edge');
assert(glow.inset.includes('--local-glow-room'), 'Reserve actual space for the upper fade');
for (const viewportWidth of [320, 390, 760, 761, 1024, 1571, 2560]) {
  const variant = viewportWidth <= 760 ? 'mobile' : 'desktop';
  const svg = document.querySelector(`.local-data-map-${variant}`);
  const [, , width, height] = svg.getAttribute('viewBox').split(/\s+/).map(Number);
  const top = parseFloat(componentStyle('.local-security-stage .local-ai-node', viewportWidth).top) / 100 * height;
  const diameter = parseFloat(componentStyle('.local-ai-node .local-ai-node-icon', viewportWidth).width) / 100 * width;
  for (const route of svg.querySelectorAll('defs path:not([id$="output"])')) {
    const endpoint = samplePath(route.getAttribute('d')).at(-1);
    const radius = Math.hypot(endpoint[0] - width / 2, endpoint[1] - top - diameter / 2);
    assert(Math.abs(radius - diameter / 2) < .5, `${route.id}: the lowered line still connects to the icon at ${viewportWidth}px`);
  }
}
for (const [variant, buildingTop] of [['desktop', 400], ['mobile', 334.4]]) {
  const svg = document.querySelector(`.local-data-map-${variant}`);
  const routes = [...svg.querySelectorAll('defs path')].map((el) => ({ id: el.id, points: samplePath(el.getAttribute('d')) }));
  const [, , width, height] = svg.getAttribute('viewBox').split(/\s+/).map(Number);
  for (const route of routes) {
    for (const point of route.points) {
      assert(point[0] >= 0 && point[0] <= width && point[1] >= 0 && point[1] <= height, `${route.id} stays inside the diagram`);
      if (!route.id.endsWith('output')) assert(point[1] < buildingTop, `${route.id} stays above the building`);
    }
  }
  for (let a = 0; a < routes.length; a += 1) for (let b = a + 1; b < routes.length; b += 1) {
    const p = routes[a].points, q = routes[b].points;
    for (let i = 1; i < p.length; i += 1) for (let j = 1; j < q.length; j += 1) {
      assert(!intersects(p[i-1], p[i], q[j-1], q[j]), `${routes[a].id} must not cross ${routes[b].id}`);
      const clearance = Math.min(distanceToSegment(p[i-1], q[j-1], q[j]), distanceToSegment(p[i], q[j-1], q[j]), distanceToSegment(q[j-1], p[i-1], p[i]), distanceToSegment(q[j], p[i-1], p[i]));
      assert(clearance > 8, `${routes[a].id} and ${routes[b].id} need separate lanes, not touching/overlapping strokes`);
    }
  }
}
console.log('PASS: transparent glow edges, matching lowered icon ports, separate desktop/mobile routes outside the building area.');

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function checkInteractions(width, reducedMotion) {
  const errors = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', (error) => errors.push(error.message));
  const dom = new JSDOM(html, { url: 'https://test.invalid/', runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole });
  const { window } = dom;
  const doc = window.document;
  Object.defineProperty(window, 'innerWidth', { value: width, writable: true });
  window.matchMedia = () => ({ matches: reducedMotion, addEventListener() {} });
  window.scrollTo = () => {};
  window.HTMLElement.prototype.scrollTo = function(options) { this.scrollTop = options?.top || 0; };
  window.HTMLElement.prototype.scrollIntoView = () => {};
  // Native dialog layout/top-layer behavior requires a browser; test only our handlers here.
  window.HTMLDialogElement.prototype.showModal = function() { this.open = true; };
  window.HTMLDialogElement.prototype.close = function() { this.open = false; this.dispatchEvent(new window.Event('close')); };
  for (const route of doc.querySelectorAll('.local-data-map defs path')) {
    const points = samplePath(route.getAttribute('d'));
    route.getTotalLength = () => points.slice(1).reduce((sum, point, index) => sum + Math.hypot(point[0] - points[index][0], point[1] - points[index][1]), 0);
  }
  const observers = [];
  window.IntersectionObserver = class {
    constructor(callback) { this.callback = callback; this.targets = []; observers.push(this); }
    observe(target) { this.targets.push(target); }
    unobserve(target) { this.targets = this.targets.filter(item => item !== target); }
    disconnect() {}
  };
  window.Element.prototype.animate = function() { return { cancel() {}, pause() {}, play() {} }; };
  let strategyTop = window.innerHeight * 2;
  doc.querySelector('.strategy-panel').getBoundingClientRect = () => ({ top: strategyTop });
  window.eval(script);
  window.eval(reveals);
  await wait(30);
  const lifted = doc.querySelector('[data-strategy-lifted-block]');
  if (width > 1100 && !reducedMotion) {
    assert.equal(lifted.style.getPropertyValue('--strategy-lift-y'), '-80.0px');
    strategyTop = window.innerHeight * .245;
    window.dispatchEvent(new window.Event('scroll')); await wait(30);
    assert.equal(lifted.style.getPropertyValue('--strategy-lift-y'), '-40.0px');
    strategyTop = window.innerHeight;
    window.dispatchEvent(new window.Event('scroll')); await wait(30);
    assert.equal(lifted.style.getPropertyValue('--strategy-lift-y'), '-40.0px', 'Construction does not rewind when scrolling upward');
    strategyTop = -100;
    window.dispatchEvent(new window.Event('scroll')); await wait(30);
    assert.equal(lifted.style.getPropertyValue('--strategy-lift-y'), '0.0px');
    assert.equal(lifted.style.getPropertyValue('--strategy-lift-cable-height'), '172.0px', 'Keep the original landed cable length');
    strategyTop = window.innerHeight;
    window.dispatchEvent(new window.Event('scroll')); await wait(30);
    assert.equal(lifted.style.getPropertyValue('--strategy-lift-y'), '0.0px', 'Once landed, the construction stays still');
  } else assert.equal(lifted.style.getPropertyValue('--strategy-lift-y'), '0px');
  for (const signal of doc.querySelectorAll('.local-network-impulses use')) {
    const route = doc.querySelector(signal.getAttribute('href'));
    assert.equal(Number(signal.style.getPropertyValue('--flow-end')), -route.getTotalLength());
    assert.equal(Number(signal.style.getPropertyValue('--flow-gap')), route.getTotalLength() + 48);
  }
  const motion = observers.find((observer) => observer.targets.includes(doc.querySelector('[data-secure-network]')) && observer.targets.includes(doc.querySelector('[data-business-progress]')));
  assert(motion, 'Both diagrams have a visibility observer');
  motion.callback(motion.targets.map((target) => ({ target, isIntersecting: true })));
  assert(motion.targets.every((target) => target.classList.contains('is-in-view')));
  motion.callback(motion.targets.map((target) => ({ target, isIntersecting: false })));
  assert(motion.targets.every((target) => !target.classList.contains('is-in-view')));

  const menu = doc.querySelector('.mobile-menu-toggle');
  menu.click();
  assert.equal(menu.getAttribute('aria-expanded'), 'true');
  doc.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(menu.getAttribute('aria-expanded'), 'false');
  assert.equal(doc.activeElement, menu);
  menu.click(); doc.querySelector('.main-nav a').click();
  assert.equal(menu.getAttribute('aria-expanded'), 'false');
  doc.querySelector('.theme-toggle').click();
  assert.equal(doc.documentElement.dataset.theme, 'light');

  for (const trigger of doc.querySelectorAll('[data-service-trigger]')) {
    trigger.click(); await wait(30);
    const dialog = doc.querySelector('#use-case-dialog');
    assert(dialog.classList.contains('is-service-detail'));
    assert(!doc.querySelector('#evidence-dialog').classList.contains('is-service-detail'));
    assert.equal(doc.querySelector('[data-use-case-modal]').hidden, false);
    assert.equal(normalize(doc.querySelector('[data-use-case-modal-title]').textContent), normalize(trigger.textContent));
    assert.equal(normalize(doc.querySelector('[data-use-case-modal-body]').textContent), normalize(trigger.closest('.service-card').querySelector('.service-details').textContent));
    assert(doc.activeElement.matches('button[data-use-case-close]'), 'Focus must enter the visible service dialog, not a hidden study dialog');
    doc.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    assert(doc.activeElement.matches('button[data-use-case-close]'));
    doc.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }));
    assert(doc.activeElement.matches('button[data-use-case-close]'));
    doc.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await wait(reducedMotion ? 20 : 350);
    assert.equal(doc.querySelector('[data-use-case-modal]').hidden, true);
    assert.equal(doc.activeElement, trigger);
    assert(!doc.body.classList.contains('modal-open'));
  }
  for (const trigger of doc.querySelectorAll('[data-evidence-trigger]')) {
    trigger.click(); await wait(30);
    const template = doc.querySelector(`template[data-evidence-detail="${trigger.dataset.evidenceTrigger}"]`);
    assert.equal(doc.querySelector('[data-evidence-modal]').hidden, false);
    assert.equal(doc.querySelector('[data-evidence-modal-title]').textContent, template.dataset.evidenceTitle);
    assert.equal(doc.querySelector('[data-evidence-modal-body]').innerHTML, template.innerHTML);
    assert(doc.activeElement.matches('button[data-evidence-close]'));
    doc.querySelector('button[data-evidence-close]').click(); await wait(reducedMotion ? 20 : 350);
    assert.equal(doc.activeElement, trigger);
    assert.equal(doc.querySelector('[data-evidence-modal]').hidden, true);
  }

  for (const trigger of doc.querySelectorAll('[data-business-step]')) {
    trigger.click(); await wait(30);
    const expected = trigger.closest('.business-step').querySelector('.business-step-details');
    assert.equal(doc.querySelector('[data-business-step-modal]').hidden, false);
    assert.equal(normalize(doc.querySelector('[data-business-step-modal-body]').textContent), normalize(expected.textContent));
    assert.equal(doc.querySelector('[data-business-step-modal-title]').textContent, expected.dataset.businessStepTitle);
    assert(doc.activeElement.matches('button[data-business-step-close]'));
    doc.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    assert(doc.activeElement.matches('button[data-business-step-close]'));
    doc.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await wait(reducedMotion ? 20 : 350);
    assert.equal(doc.querySelector('[data-business-step-modal]').hidden, true);
    assert.equal(doc.activeElement, trigger);
    assert(!doc.body.classList.contains('modal-open'));
  }

  for (const topic of doc.querySelectorAll('[data-ai-topic]')) {
    topic.click(); await wait(30);
    assert.equal(doc.querySelectorAll('[data-ai-topic][aria-pressed="true"]').length, 1);
    assert.equal(doc.querySelectorAll('.ai-chat-message').length, 2, 'One question/answer pair, never accumulating scrollback');
    if (width <= 760 || reducedMotion) {
      const source = doc.querySelector(`template[data-ai-response="${topic.dataset.aiTopic}"]`).content.textContent;
      assert.equal(normalize(doc.querySelector('.ai-chat-typed-copy').textContent), normalize(source));
    }
  }
  doc.querySelector('[data-local-ai-open]').click();
  assert(doc.querySelector('[data-local-ai-dialog]').open);
  assert(doc.body.classList.contains('modal-open'));
  doc.querySelector('[data-local-ai-close]').click();
  assert(!doc.querySelector('[data-local-ai-dialog]').open);
  assert.equal(doc.activeElement, doc.querySelector('[data-local-ai-open]'));
  doc.querySelector('.use-case-trigger').click(); await wait(25);
  assert.equal(doc.querySelector('[data-use-case-modal]').hidden, false);
  assert(!doc.querySelector('#use-case-dialog').classList.contains('is-service-detail'), 'Normal use cases must not inherit the service layout');
  assert(doc.activeElement.matches('button[data-use-case-close]'));
  doc.querySelector('button[data-use-case-close]').click(); await wait(reducedMotion ? 20 : 350);
  assert.equal(doc.querySelector('[data-use-case-modal]').hidden, true);
  await wait(180);
  assert.deepEqual(errors, []);
  window.close();
  console.log(`PASS: simulated handlers at width ${width}, reduced motion ${reducedMotion}; menu, 3 services, 3 studies, 4 steps/focus, 6 topics, local dialog, use cases, signal lengths.`);
}
(async () => {
  await checkInteractions(390, false);
  await checkInteractions(1440, true);
  await checkInteractions(2560, false);
  console.log('All non-rendering checks passed. Browser/device visual QA remains required.');
})().catch((error) => { console.error(error); process.exitCode = 1; });

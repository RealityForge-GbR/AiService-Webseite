// Static content/geometry checks, not a browser-rendered visual acceptance test.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require(path.join(process.env.RF_TEST_MODULES, 'jsdom'));
const csstree = require(path.join(process.env.RF_TEST_MODULES, 'css-tree'));
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'monitor-services.css'), 'utf8');
const doc = new JSDOM(html).window.document;
const normalize = text => text.replace(/\s+/g, ' ').trim();
const monitor = doc.querySelector('.monitor-services');
const titles = [...monitor.querySelectorAll('h2')].map(el => normalize(el.textContent));
assert.deepEqual(titles, [
  'KI-Anwendungen & Automatisierung',
  'KI-Agenten & Systemintegration',
  'Lokale KI & On-Premises AI'
]);
assert.deepEqual([...titles].sort(), [...doc.querySelectorAll('.service-card h3')].map(el => normalize(el.textContent)).sort(), 'The monitor names the actual services');
assert.equal(monitor.querySelectorAll('li').length, 3);
assert.equal(monitor.querySelectorAll('h2 > span, h2 br').length, 0, 'No forced line breaks in the service names');
assert.equal(monitor.querySelectorAll('li > svg').length, 3, 'All three approved icons remain');
assert.equal(monitor.querySelectorAll('[hidden], [aria-hidden="true"]:not(svg), button, [aria-live], [aria-roledescription]').length, 0);
assert(!monitor.closest('[hidden]'));
assert(!doc.querySelector('[data-monitor-scene], [data-monitor-controls], [data-monitor-playback]'));
assert(!html.includes('monitor-showcase.js'));
assert(!html.includes('monitor-showcase.css'));
assert(!/Routine abgeben|Systeme verbinden|Daten bei Ihnen/.test(monitor.textContent));
assert(!doc.querySelector('.hero-intro'), 'Remove the explanatory paragraph to simplify the hero');
assert.match(css, /font-size: clamp\(1\.2rem, 2vw, 1\.75rem\)/, 'Readable centered service names without bitmap-relative scaling');
assert.match(css, /font-size: clamp\(1rem, 4\.1vw, 1\.4rem\)/, 'Mobile service names retain a readable minimum');
assert.match(css, /\.hero-system-screen \.monitor-services \{[^}]*text-align: center;/s);
assert.match(css, /\.hero-system-screen \.monitor-service-list > li \{[^}]*display: flex;[^}]*justify-content: center;/s, 'Each icon/title pair is individually centered');
assert.match(css, /overflow-wrap: anywhere;/, 'Long service names can wrap on small or zoomed screens');
const screen = doc.querySelector('.hero-system-screen');
assert.equal(screen.firstElementChild, monitor);
assert.equal(screen.children.length, 1, 'Only the service overview remains');
assert(!screen.contains(doc.querySelector('.hero-actions')), 'Actions are below the screen');
assert(!doc.querySelector('.hero-monitor, .hero-monitor-space'), 'No old monitor or independent scaling');
assert(!/Georgia|Times New Roman|monospace|italic|h2 > span:last-child/.test(css), 'One consistent typeface and treatment throughout the monitor');
assert.match(css, /border: 0;/, 'Reset the legacy monitor row separators');
assert(!/border-radius:|box-shadow:/.test(css), 'No extra card frames or icon badges');
const ast = csstree.parse(css);
csstree.walk(ast, node => {
  if (node.type === 'Declaration') assert(!['animation', 'opacity', 'visibility', 'transform', '--hero-monitor-scale', '--hero-title-balance-shift'].includes(node.property), 'No hiding, animation or changes to approved geometry');
});
assert(!/cqw|white-space:\s*nowrap|^\s*height:\s*\d[^;]*;/m.test(css.replace(/height: (2|1\.5)rem;/g, '')), 'Text is not locked into a fixed-height display or clipped when zoomed');
console.log('PASS: three complete centered icon/title rows, no forced line breaks or introductory paragraph; readable mobile fallback, one typeface, no new decoration; actions remain outside.');

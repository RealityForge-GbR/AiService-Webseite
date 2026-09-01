const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require(path.join(process.env.RF_TEST_MODULES, 'jsdom'));
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const home = read('index.html');
const legal = read('legal-notice/index.html');
const privacy = read('privacy-policy/index.html');
const css = read('legal.css');
const behavior = read('legal.js');

const homeDom = new JSDOM(home);
const hd = homeDom.window.document;
assert.equal(hd.querySelectorAll('.brand-wordmark').length, 2, 'Header and footer use the real static wordmark');
assert.equal(hd.querySelectorAll('.brand-mark').length, 0, 'No RF disc placeholder remains in site chrome');
assert.equal(hd.querySelector('.site-footer a[href="legal-notice/"]').textContent, 'Impressum');
assert.equal(hd.querySelector('.site-footer a[href="privacy-policy/"]').textContent, 'Datenschutz');
assert(hd.querySelector('.footer-contact[href^="mailto:"]'));
assert.match(home, /localStorage\.getItem\('realityforge-theme'\) === 'light'/, 'Homepage restores its saved theme before paint');
assert.match(css, /font-family: "acier-bat-noir", sans-serif;/, 'Legal chrome uses the installed RealityForge face');

for (const [source, current, counterpart] of [[legal, 'Impressum', '../privacy-policy/'], [privacy, 'Datenschutz', '../legal-notice/']]) {
  const dom = new JSDOM(source, { url: 'https://aiservice.realityforge.eu/', runScripts: 'outside-only' });
  const { window } = dom;
  const doc = window.document;
  assert(doc.querySelector('.brand-wordmark'));
  assert.equal(doc.querySelector('[aria-current="page"]').textContent, current);
  assert(doc.querySelector(`a[href="${counterpart}"]`));
  assert.equal(doc.querySelector('.legal-intro .eyebrow'), null, 'The redundant legal eyebrow is removed');
  window.localStorage.setItem('realityforge-theme', 'dark');
  doc.documentElement.dataset.theme = 'dark';
  window.eval(behavior);
  assert.equal(doc.documentElement.dataset.theme, 'dark');
  doc.querySelector('[data-theme-toggle]').click();
  assert.equal(doc.documentElement.dataset.theme, 'light');
  assert.equal(window.localStorage.getItem('realityforge-theme'), 'light');
  dom.window.close();
}

assert.match(privacy, /<h2>17\. Änderungen dieser Datenschutzerklärung<\/h2>/);
assert.match(legal, /Biberacher Weg 3/);
assert.match(legal, /USt-IdNr\.: DE464541470/);
assert.match(css, /--legal-reading-width: 52rem;/);
assert.match(css, /\.legal-intro \{[^}]*width: min\(100%, var\(--legal-reading-width\)\);[^}]*margin-left: auto;/s, 'Legal title and document share one left edge');
assert.match(css, /\.legal-document \{[^}]*width: min\(100%, var\(--legal-reading-width\)\);[^}]*margin:[^}]*auto;/s, 'Long legal copy follows the same responsive reading column');
homeDom.window.close();
console.log('PASS: static wordmarks, compact footer, working local legal routes and shared persisted theme.');

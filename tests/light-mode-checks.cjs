const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'light-mode.css'), 'utf8');
const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const legalNotice = fs.readFileSync(path.join(root, 'legal-notice/index.html'), 'utf8');
const privacyPolicy = fs.readFileSync(path.join(root, 'privacy-policy/index.html'), 'utf8');

const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
const rules = [...withoutComments.matchAll(/([^{}]+)\{([^{}]*)\}/g)];

assert.ok(rules.length > 0, 'light-mode.css must contain rules');
for (const [, selector] of rules) {
  assert.match(selector, /data-theme=["']light["']/, `Light-mode rule is not scoped: ${selector.trim()}`);
}

const forbiddenGeometry = new Set([
  'position', 'inset', 'inset-inline', 'inset-block', 'top', 'right', 'bottom', 'left',
  'width', 'height', 'min-width', 'max-width', 'min-height', 'max-height',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'margin-inline', 'margin-block',
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'padding-inline', 'padding-block',
  'display', 'grid', 'grid-template-columns', 'grid-template-rows', 'grid-column', 'grid-row',
  'flex', 'flex-direction', 'align-items', 'align-content', 'justify-content', 'justify-items',
  'gap', 'column-gap', 'row-gap', 'transform', 'translate', 'scale', 'rotate', 'overflow', 'order'
]);

for (const line of withoutComments.split('\n')) {
  const declaration = line.match(/^\s*([a-z-]+)\s*:/i);
  if (!declaration) continue;
  assert.ok(!forbiddenGeometry.has(declaration[1]), `Light mode must not change geometry: ${declaration[1]}`);
}

const viewportCssIndex = home.indexOf('viewport-refinements.css');
const lightCssIndex = home.indexOf('light-mode.css');
assert.ok(viewportCssIndex >= 0 && lightCssIndex > viewportCssIndex, 'Light-mode CSS must load after all layout CSS');
assert.match(legalNotice, /\.\.\/light-mode\.css\?v=1/);
assert.match(privacyPolicy, /\.\.\/light-mode\.css\?v=1/);

assert.match(home, /assets\/patrick\.png/);
assert.match(home, /assets\/evgeni\.png/);
assert.match(css, /#unsere-sicht \.view-people-layout::before/);
assert.match(css, /#unsere-sicht \.team-portrait-frame/);
assert.match(css, /\.hero-server-image-dark[\s\S]*opacity: 0/);
assert.match(css, /\.hero-server-image-light[\s\S]*opacity: 1/);
assert.match(css, /\.business-step-graphic \{[\s\S]*linear-gradient\(145deg, #ffffff, #eee5f2\)/);
assert.match(css, /\.strategy-crane \{[\s\S]*color: rgba\(255, 255, 255, 0\.94\)/);

console.log('Light-mode checks passed');

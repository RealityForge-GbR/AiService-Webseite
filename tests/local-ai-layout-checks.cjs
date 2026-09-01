// Permanent-layout regression tests. Explicit geometry fixtures, not browser rendering.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const core = require('../local-ai-layout-core.js');
const { JSDOM, VirtualConsole } = require(path.join(process.env.RF_TEST_MODULES, 'jsdom'));
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const runtime = fs.readFileSync(path.join(root, 'local-ai-layout.js'), 'utf8');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/local-ai-layout-config.js'), 'utf8'), context);
const config = core.validate(context.window.RealityForgeLocalLayoutConfig);
assert(config);
const approved = config.layouts.desktop;
const exported = {
  ai: { x: .5, y: .23681 }, one: { x: .185199, y: .294298 },
  two: { x: .121913, y: .819157 }, three: { x: .831764, y: .303106 },
  four: { x: .87874, y: .815243 }, building: { x: .5, y: .750004 }
};
for (const key of core.keys) assert.equal(approved[key].x, exported[key].x, key + ': preserve exported x');
for (const key of ['ai', 'building']) assert.deepEqual(approved[key], exported[key]);
for (const [a, b] of [['one', 'three'], ['two', 'four']]) {
  assert.equal(approved[a].y, approved[b].y);
  assert(Math.abs(approved[a].y - (exported[a].y + exported[b].y) / 2) < 1e-9);
}
assert.equal(config.layouts.mobile, null);
assert(!/local-ai-editor|data-layout-open|data-layout-lock|data-layout-label/.test(html));
assert(!/localStorage|sessionStorage|pointerdown|pointermove|data-layout-editor/.test(runtime));
assert(!fs.existsSync(path.join(root, 'local-ai-editor.js')));
assert(!fs.existsSync(path.join(root, 'local-ai-editor.css')));

function harness(width = 1440, url = 'file:///review/index.html', compactWidth = null) {
  const errors = [], results = [], virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', error => errors.push(error.message));
  const dom = new JSDOM(html, { url, runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole });
  const w = dom.window, doc = w.document;
  w.innerWidth = width;
  Object.defineProperty(w, 'localStorage', { get() { throw new Error('Permanent layout must ignore editor drafts'); } });
  w.matchMedia = () => ({ get matches() { return w.innerWidth <= 760; } });
  const frames = new Map(); let frameId = 0;
  w.requestAnimationFrame = fn => { frames.set(++frameId, fn); return frameId; };
  const flush = () => {
    for (let n = 0; frames.size && n < 10; n++) { const batch = [...frames.values()]; frames.clear(); batch.forEach(fn => fn()); }
    assert.equal(frames.size, 0, 'No permanent animation frame loop');
  };
  w.RealityForgeLocalLayout = { ...core, routeScene(scene) { const result = core.routeScene(scene); results.push(result); return result; } };
  w.RealityForgeLocalLayoutConfig = config;
  const stage = doc.querySelector('.local-security-stage');
  const nodes = Object.fromEntries([...stage.querySelectorAll('[data-layout-node]')].map(el => [el.dataset.layoutNode, el]));
  const bcr = (x, y, width, height) => ({ left: x, right: x + width, top: y, bottom: y + height, x, y, width, height, toJSON() { return this; } });
  const stageSize = () => { const mobile = w.innerWidth <= 760, width = compactWidth || (mobile ? Math.min(368, w.innerWidth - 32) : Math.min(1040, w.innerWidth * .84)); return { mobile, width, height: width * (mobile ? 560 / 360 : 800 / 1200) }; };
  stage.getBoundingClientRect = () => { const { width, height } = stageSize(); return bcr(20, 200, width, height); };
  function bounds(k) {
    const s = stageSize(), { width: sw, height: sh, mobile } = s;
    let width, height, x, y;
    if (k === 'ai') {
      width = sw * (mobile ? .58 : .24); height = sw * (mobile ? 64 / 360 : 100 / 1200) + Math.max(4.8, Math.min(10.4, sw * .0085)) + 34;
      x = sw / 2; y = sh * (mobile ? 69 / 560 : .14) + height / 2;
    } else if (k === 'building') { width = sw * (mobile ? .94 : .5); height = width * 2 / 3; x = sw / 2; y = sh - height / 2; }
    else {
      width = sw * (mobile ? .43 : .21); height = Math.max(sh * (mobile ? .075 : .065), mobile ? 32 : 35.2);
      const left = ['one', 'two'].includes(k), upper = ['one', 'three'].includes(k);
      x = sw * (left ? mobile ? .05 : .09 : mobile ? .95 : .91) + (left ? 1 : -1) * width / 2;
      y = sh * (upper ? mobile ? 209 / 560 : .3775 : mobile ? 269 / 560 : .4825) + (mobile ? height / 2 : 0);
    }
    if (nodes[k].style.left) { x = parseFloat(nodes[k].style.left) / 100 * sw; y = parseFloat(nodes[k].style.top) / 100 * sh; }
    return bcr(20 + x - width / 2, 200 + y - height / 2, width, height);
  }
  for (const k of core.keys) {
    nodes[k].getBoundingClientRect = () => bounds(k);
    nodes[k].setPointerCapture = () => {};
  }
  stage.querySelector('.local-ai-node-icon').getBoundingClientRect = () => { const s = stageSize(), a = bounds('ai'), size = s.width * (s.mobile ? 64 / 360 : 100 / 1200); return bcr(a.left + (a.width - size) / 2, a.top, size, size); };
  stage.querySelector('.local-ai-node-copy').getBoundingClientRect = () => { const s = stageSize(), a = bounds('ai'), width = s.mobile ? 100 : Math.max(100, s.width * .1), height = 34; return bcr(a.left + (a.width - width) / 2, a.bottom - height, width, height); };

  for (const p of stage.querySelectorAll('defs path')) p.getTotalLength = () => 321;
  const outside = [...doc.querySelectorAll('main > section')].filter(el => el.id !== 'lokale-ki').map(el => el.outerHTML);
  w.eval(runtime); flush();
  const resize = width => { w.innerWidth = width; w.dispatchEvent(new w.Event('resize')); flush(); };
  const check = () => {
    assert.equal(stage.getAttribute('aria-hidden'), 'true');
    assert.equal(stage.querySelectorAll('[tabindex], [role="button"], [draggable]').length, 0);
    if (w.innerWidth <= 760) {
      for (const key of core.keys) assert.equal(nodes[key].getAttribute('style'), null, 'Mobile positions are unchanged');
    } else {
      for (const key of core.keys) {
        assert(Math.abs(parseFloat(nodes[key].style.left) / 100 - approved[key].x) < 1e-9);
        assert(Math.abs(parseFloat(nodes[key].style.top) / 100 - approved[key].y) < 1e-9);
      }
      for (const [a, b] of [['one', 'three'], ['two', 'four']]) {
        const ra = bounds(a), rb = bounds(b);
        assert(Math.abs((ra.top + ra.height / 2) - (rb.top + rb.height / 2)) < 1e-6, 'Opposite pills stay level');
      }
    }
    const result = results.at(-1);
    assert(result?.valid, w.innerWidth + ': ' + result?.issues.join(', '));
    assert.equal(stage.querySelectorAll('use[style*="hidden"]').length, 0, 'Every connection remains visible');
    assert.deepEqual(errors, []);
  };
  const finish = () => {
    assert.deepEqual([...doc.querySelectorAll('main > section')].filter(el => el.id !== 'lokale-ki').map(el => el.outerHTML), outside, 'Only local-AI diagram changes');
    assert.deepEqual(errors, []); w.close();
  };
  return { w, doc, stage, nodes, resize, check, finish };
}

function sample(d) {
  const numbers = d.match(/[MLCQ]|-?\d+(?:\.\d+)?/g); let i = 0, at = { x: 0, y: 0 }; const points = [];
  const n = () => +numbers[i++], p = () => ({ x: n(), y: n() });
  while (i < numbers.length) {
    const command = numbers[i++];
    if (command === 'M' || command === 'L') { at = p(); points.push(at); }
    else {
      const a = at, b = p(), c = command === 'C' ? p() : null, end = p();
      for (let j = 1; j <= 60; j++) { const t = j / 60, u = 1 - t; points.push(Object.fromEntries(['x', 'y'].map(axis => [axis, c ? u ** 3 * a[axis] + 3 * u * u * t * b[axis] + 3 * u * t * t * c[axis] + t ** 3 * end[axis] : u * u * a[axis] + 2 * u * t * b[axis] + t * t * end[axis]]))); }
      at = end;
    }
  }
  return points;
}
function checkRoutes(h) {
  const mobile = h.w.innerWidth <= 760, prefix = mobile ? 'local-mobile-' : 'local-route-';
  const routes = ['one', 'two', 'three', 'four', 'output'].map(k => [k, sample(h.stage.querySelector(`#${prefix}${k}`).getAttribute('d'))]);
  const stage = h.stage.getBoundingClientRect(), image = h.nodes.building.getBoundingClientRect();
  const sx = (mobile ? 360 : 1200) / stage.width, sy = (mobile ? 560 : 800) / stage.height;
  const building = { left: (image.left - stage.left + image.width * 188 / 1536) * sx, right: (image.left - stage.left + image.width * 1340 / 1536) * sx, top: (image.top - stage.top + image.height * 60 / 1024) * sy, bottom: (image.top - stage.top + image.height * 910 / 1024) * sy };
  for (const [name, points] of routes) {
    if (name !== 'output') for (let n = 1; n < points.length; n++) assert(!core.segmentHitsRect(points[n - 1], points[n], building), `${name} must not run through the building`);
  }
  for (let i = 0; i < routes.length; i++) for (let j = i + 1; j < routes.length; j++) {
    const a = routes[i][1], b = routes[j][1];
    for (let x = 1; x < a.length; x++) for (let y = 1; y < b.length; y++) assert(core.segmentDistance(a[x - 1], a[x], b[y - 1], b[y]) > .1, `${routes[i][0]} crosses ${routes[j][0]}`);
  }
}


for (const width of [320, 390, 540, 760, 761, 820, 1024, 1100, 1280, 1440, 1613, 1920, 2560, 3440]) {
  const h = harness(width);
  h.check();
  checkRoutes(h);
  h.finish();
  console.log('PASS: ' + width + 'px fixture, approved position/row alignment, route visibility, no crossings/building intersections.');
}
const h = harness(1613, 'https://example.test/?edit-local-ai=1');
for (const width of [390, 2560, 760, 761, 1440, 320, 1920]) {
  h.resize(width); h.check(); checkRoutes(h);
}
h.finish();
for (const [viewport, compact] of [[320, 240], [390, 260], [760, 368], [761, 640], [1366, 680], [1920, 900]]) {
  const compactScene = harness(viewport, 'file:///review/index.html', compact);
  compactScene.check(); checkRoutes(compactScene); compactScene.finish();
}
console.log('PASS: local/public URLs use identical approved layout; old editor parameter/storage ignored; mobile/desktop resize round trips; no editor UI/handlers.');

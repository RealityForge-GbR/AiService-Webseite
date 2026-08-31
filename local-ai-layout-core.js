/* Pure layout validation and obstacle-aware routing. Shared with regression tests. */
(function (scope) {
  'use strict';
  const keys = ['ai', 'one', 'two', 'three', 'four', 'building'];
  const inputs = keys.slice(1, 5);
  const variants = ['desktop', 'mobile'];
  const eps = 0.001;
  const point = (x, y) => ({ x, y });
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const center = r => point((r.left + r.right) / 2, (r.top + r.bottom) / 2);
  const expand = (r, n) => ({ left: r.left - n, right: r.right + n, top: r.top - n, bottom: r.bottom + n });
  const inside = (p, r) => p.x > r.left + eps && p.x < r.right - eps && p.y > r.top + eps && p.y < r.bottom - eps;
  const overlap = (a, b) => a.left < b.right - eps && a.right > b.left + eps && a.top < b.bottom - eps && a.bottom > b.top + eps;
  function validPositions(value) {
    return value && typeof value === 'object' && Object.keys(value).length === keys.length && keys.every(key => {
      const p = value[key];
      return p && Object.keys(p).length === 2 && ['x', 'y'].every(axis => typeof p[axis] === 'number' && Number.isFinite(p[axis]) && p[axis] >= 0 && p[axis] <= 1);
    });
  }
  function validate(value) {
    if (!value || value.version !== 1 || Object.keys(value).sort().join() !== 'layouts,version' || !value.layouts || Object.keys(value.layouts).sort().join() !== 'desktop,mobile') return null;
    if (!variants.every(key => value.layouts[key] === null || validPositions(value.layouts[key]))) return null;
    return JSON.parse(JSON.stringify(value));
  }
  function inDome(p, scene) {
    const { width: w, height: h, mobile } = scene;
    const bottom = .99 * h;
    if (p.x < 2 || p.x > w - 2 || p.y < 2 || p.y > bottom - 2) return false;
    const rx = w * (mobile ? .45 : .5);
    const ry = bottom * (mobile ? .2 : .45);
    if (p.y >= ry || (p.x >= rx && p.x <= w - rx)) return true;
    const cx = p.x < rx ? rx : w - rx;
    return ((p.x - cx) / rx) ** 2 + ((p.y - ry) / ry) ** 2 <= .999;
  }
  function segmentHitsRect(a, b, r) {
    // Slab clipping works for diagonal connectors as well as orthogonal paths.
    let low = 0, high = 1;
    for (const [axis, min, max] of [['x', r.left + eps, r.right - eps], ['y', r.top + eps, r.bottom - eps]]) {
      const d = b[axis] - a[axis];
      if (Math.abs(d) < eps) { if (a[axis] <= min || a[axis] >= max) return false; }
      else {
        const t1 = (min - a[axis]) / d, t2 = (max - a[axis]) / d;
        low = Math.max(low, Math.min(t1, t2)); high = Math.min(high, Math.max(t1, t2));
        if (low > high) return false;
      }
    }
    return low <= high;
  }
  function segmentDistance(a, b, c, d) {
    const cross = (u, v, w) => (v.x - u.x) * (w.y - u.y) - (v.y - u.y) * (w.x - u.x);
    const ab1 = cross(a, b, c), ab2 = cross(a, b, d), cd1 = cross(c, d, a), cd2 = cross(c, d, b);
    if (ab1 * ab2 < 0 && cd1 * cd2 < 0) return 0;
    const toLine = (p, q, r) => {
      const dx = r.x - q.x, dy = r.y - q.y, len = dx * dx + dy * dy;
      const t = len ? Math.max(0, Math.min(1, ((p.x - q.x) * dx + (p.y - q.y) * dy) / len)) : 0;
      return distance(p, point(q.x + t * dx, q.y + t * dy));
    };
    return Math.min(toLine(a, c, d), toLine(b, c, d), toLine(c, a, b), toLine(d, a, b));
  }
  function clearSegment(a, b, obstacles, reserved, scene) {
    return inDome(a, scene) && inDome(b, scene) && !obstacles.some(r => segmentHitsRect(a, b, r)) && !reserved.some(([c, d]) => segmentDistance(a, b, c, d) < scene.gap * .7);
  }
  class Heap {
    constructor() { this.items = []; }
    push(item) {
      const a = this.items; a.push(item); let i = a.length - 1;
      while (i && a[(i - 1) >> 1].score > item.score) { a[i] = a[(i - 1) >> 1]; i = (i - 1) >> 1; }
      a[i] = item;
    }
    pop() {
      const a = this.items, first = a[0], last = a.pop();
      if (a.length) {
        let i = 0;
        while (i * 2 + 1 < a.length) {
          let c = i * 2 + 1;
          if (c + 1 < a.length && a[c + 1].score < a[c].score) c++;
          if (a[c].score >= last.score) break;
          a[i] = a[c]; i = c;
        }
        a[i] = last;
      }
      return first;
    }
  }
  function gridRoute(start, end, obstacles, reserved, scene) {
    const gap = scene.gap;
    const xs = [start.x, end.x, gap, scene.width - gap];
    const ys = [start.y, end.y, gap, scene.height * .99 - gap];
    obstacles.forEach(r => { xs.push(r.left, r.right); ys.push(r.top, r.bottom); });
    reserved.filter((_, i) => i % Math.max(1, Math.ceil(reserved.length / 20)) === 0).forEach(([a, b]) => {
      xs.push(a.x - gap, a.x + gap, b.x - gap, b.x + gap);
      ys.push(a.y - gap, a.y + gap, b.y - gap, b.y + gap);
    });
    const unique = (values, max) => [...new Set(values.filter(v => v >= 2 && v <= max - 2))].sort((a, b) => a - b);
    const x = unique(xs, scene.width), y = unique(ys, scene.height);
    const nx = x.length, count = nx * y.length;
    const nodes = Array.from({ length: count }, (_, i) => point(x[i % nx], y[Math.floor(i / nx)]));
    const valid = nodes.map(p => inDome(p, scene) && !obstacles.some(r => inside(p, r)));
    const startNode = y.indexOf(start.y) * nx + x.indexOf(start.x), endNode = y.indexOf(end.y) * nx + x.indexOf(end.x);
    if (!valid[startNode] || !valid[endNode]) return null;
    const costs = new Float64Array(count * 3).fill(Infinity), previous = new Int32Array(count * 3).fill(-1);
    const queue = new Heap(), first = startNode * 3;
    costs[first] = 0; queue.push({ state: first, cost: 0, score: distance(start, end) });
    const cache = new Map();
    while (queue.items.length) {
      const item = queue.pop(), state = item.state, at = Math.floor(state / 3), dir = state % 3;
      if (item.cost !== costs[state]) continue;
      if (at === endNode) {
        const points = []; let s = state;
        while (s !== -1) { points.push(nodes[Math.floor(s / 3)]); s = previous[s]; }
        return points.reverse();
      }
      for (const [next, nextDir] of [[at % nx ? at - 1 : -1, 1], [at % nx < nx - 1 ? at + 1 : -1, 1], [at - nx, 2], [at + nx, 2]]) {
        if (next < 0 || next >= count || !valid[next]) continue;
        const edgeKey = Math.min(at, next) * count + Math.max(at, next);
        if (!cache.has(edgeKey)) cache.set(edgeKey, clearSegment(nodes[at], nodes[next], obstacles, reserved, scene));
        if (!cache.get(edgeKey)) continue;
        const nextState = next * 3 + nextDir, cost = item.cost + distance(nodes[at], nodes[next]) + (dir && dir !== nextDir ? gap * 3 : 0);
        if (cost >= costs[nextState]) continue;
        costs[nextState] = cost; previous[nextState] = state;
        queue.push({ state: nextState, cost, score: cost + Math.abs(nodes[next].x - end.x) + Math.abs(nodes[next].y - end.y) });
      }
    }
    return null;
  }
  function simplify(points) {
    const result = [];
    for (const p of points) {
      if (result.length && distance(result.at(-1), p) < eps) continue;
      while (result.length > 1) {
        const a = result.at(-2), b = result.at(-1);
        if (Math.abs((b.x - a.x) * (p.y - b.y) - (b.y - a.y) * (p.x - b.x)) > eps) break;
        result.pop();
      }
      result.push(p);
    }
    return result;
  }
  function rounded(points, radius) {
    const f = n => +n.toFixed(2), xy = p => `${f(p.x)} ${f(p.y)}`;
    let d = `M${xy(points[0])}`;
    for (let i = 1; i < points.length - 1; i++) {
      const a = points[i - 1], b = points[i], c = points[i + 1];
      const r = Math.min(radius, distance(a, b) / 2, distance(b, c) / 2);
      const towards = p => point(b.x + (p.x - b.x) * r / distance(p, b), b.y + (p.y - b.y) * r / distance(p, b));
      d += `L${xy(towards(a))}Q${xy(b)} ${xy(towards(c))}`;
    }
    return d + `L${xy(points.at(-1))}`;
  }
  function ports(rect, gap) {
    const c = center(rect);
    return [[point(rect.left, c.y), point(rect.left - gap, c.y)], [point(rect.right, c.y), point(rect.right + gap, c.y)], [point(c.x, rect.top), point(c.x, rect.top - gap)], [point(c.x, rect.bottom), point(c.x, rect.bottom + gap)]];
  }
  function curve(start, end, obstacles, reserved, scene) {
    const a = start[0], b = end[0];
    const reach = Math.min(scene.mobile ? 65 : 145, distance(a, b) * .5);
    const control = (p, toward, amount = reach) => {
      const length = distance(p, toward);
      return point(p.x + (toward.x - p.x) / length * amount, p.y + (toward.y - p.y) / length * amount);
    };
    const c = control(a, start[1]), d = control(b, end[1]);
    if (end[1].y > b.y + 1) d.y = b.y + Math.min(end[1].y - b.y, (scene.circle.bottom - scene.circle.top) * .2);
    const points = Array.from({ length: 25 }, (_, i) => {
      const t = i / 24, u = 1 - t;
      return point(u ** 3 * a.x + 3 * u * u * t * c.x + 3 * u * t * t * d.x + t ** 3 * b.x, u ** 3 * a.y + 3 * u * u * t * c.y + 3 * u * t * t * d.y + t ** 3 * b.y);
    });
    const ai = center(scene.circle), radius = (scene.circle.right - scene.circle.left) / 2;
    if (points.slice(0, -1).some(p => distance(p, ai) < radius)) return null;
    for (let i = 1; i < points.length; i++) if (!clearSegment(points[i - 1], points[i], obstacles, reserved, scene)) return null;
    const xy = p => `${+p.x.toFixed(2)} ${+p.y.toFixed(2)}`;
    return { points, d: `M${xy(a)}C${xy(c)} ${xy(d)} ${xy(b)}` };
  }
  function routeScene(input) {
    const scene = { ...input, gap: input.mobile ? 3 : 9 };
    const { rects, circle, copy, building } = scene, gap = scene.gap;
    const all = { ...rects, circle, copy, building };
    const issues = [];
    for (const [name, r] of Object.entries(all)) {
      if (![point(r.left, r.top), point(r.right, r.top), point(r.left, r.bottom), point(r.right, r.bottom)].every(p => inDome(p, scene))) issues.push(`${name}:outside`);
    }
    const entries = Object.entries(all);
    for (let i = 0; i < entries.length; i++) for (let j = i + 1; j < entries.length; j++) {
      if (overlap(entries[i][1], entries[j][1])) issues.push(`${entries[i][0]}:${entries[j][0]}:overlap`);
    }
    const obstacles = Object.fromEntries(entries.map(([name, r]) => [name, expand(r, gap)]));
    const reserved = [], routes = {};
    const ai = center(circle), radius = (circle.right - circle.left) / 2;
    const usedPorts = new Set();
    const nearestOnSide = side => inputs.filter(key => (center(rects[key]).x < ai.x ? -1 : 1) === side).sort((a, b) => distance(center(rects[a]), ai) - distance(center(rects[b]), ai))[0];
    function connect(name, starts, ends, sourceName, destinationName) {
      const obs = Object.values(obstacles);
      function accept(route, end) {
        routes[name] = route;
        for (let i = 1; i < route.points.length; i++) reserved.push([route.points[i - 1], route.points[i]]);
        if (end.id) usedPorts.add(end.id);
      }
      // Prefer simple flowing curves. The visibility grid is only a fallback
      // when an element or an already-connected line occupies that corridor.
      if (destinationName === 'circle') {
        const curveObstacles = Object.entries(all).filter(([key]) => key !== 'circle').map(([key, r]) => key === sourceName ? r : expand(r, gap * .4));
        for (const end of ends) {
          if (usedPorts.has(end.id)) continue;
          for (const start of [...starts].sort((a, b) => distance(a[1], end[1]) - distance(b[1], end[1]))) {
            const route = curve(start, end, curveObstacles, reserved, scene);
            if (route) { accept(route, end); return; }
          }
        }
      }
      for (const end of ends) {
        if (usedPorts.has(end.id)) continue;
        if (!clearSegment(end[1], end[0], Object.entries(obstacles).filter(([key]) => key !== destinationName).map(([, r]) => r), reserved, scene)) continue;
        const ordered = [...starts].sort((a, b) => distance(a[1], end[1]) - distance(b[1], end[1]));
        for (const start of ordered) {
          if (!clearSegment(start[0], start[1], Object.entries(obstacles).filter(([key]) => key !== sourceName).map(([, r]) => r), reserved, scene)) continue;
          const middle = gridRoute(start[1], end[1], obs, reserved, scene);
          if (!middle) continue;
          const points = simplify([start[0], ...middle, end[0]]);
          accept({ d: rounded(points, gap), points }, end);
          return;
        }
      }
      issues.push(`${name}:route`);
      const points = [starts[0][0], ends[0][0]];
      routes[name] = { d: rounded(points, 0), points, invalid: true };
    }
    // The building connection has its own protected channel below the caption.
    const outputStart = point(center(copy).x, copy.bottom + 2);
    const roof = scene.roof || point(center(building).x, building.top);
    connect('output', [[outputStart, point(outputStart.x, copy.bottom + gap + 1)]], [[roof, point(roof.x, building.top - gap - 1)]], 'copy', 'building');
    // Nearby sources first: reserve distinct routes and distinct chip ports.
    for (const name of [...inputs].sort((a, b) => distance(center(rects[a]), ai) - distance(center(rects[b]), ai))) {
      const side = center(rects[name]).x < ai.x ? -1 : 1;
      const preferred = name === nearestOnSide(side) ? (side < 0 ? 181 : 1) : null;
      const targetPorts = [0, 30, 45, 135, 150, 180, 210, 225, 270, 315, 330].map(degrees => {
        const angle = degrees * Math.PI / 180, dx = Math.cos(angle), dy = Math.sin(angle);
        const outside = (radius + gap + 1) / Math.max(Math.abs(dx), Math.abs(dy));
        const port = [point(ai.x + dx * radius, ai.y + dy * radius), point(ai.x + dx * outside, ai.y + dy * outside)];
        port.id = degrees + 1; return port;
      }).sort((a, b) => (a.id === preferred ? -scene.width : distance(a[0], center(rects[name]))) - (b.id === preferred ? -scene.width : distance(b[0], center(rects[name]))));
      connect(name, ports(rects[name], gap + 1), targetPorts, name, 'circle');
    }
    return { routes, issues, valid: issues.length === 0 };
  }
  const api = { keys, validate, routeScene, inDome, segmentHitsRect, segmentDistance };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else scope.RealityForgeLocalLayout = api;
})(typeof window !== 'undefined' ? window : this);

/*
 * <reality-forge-logo> — animated Reality Forge wordmark
 * Vanilla custom element. No dependencies, no build step, no canvas.
 * SVG + requestAnimationFrame. Every value is configurable at runtime.
 *
 *   <script src="reality-forge-logo.js"></script>
 *   <reality-forge-logo autoplay></reality-forge-logo>
 *
 *   // full control from JS at any time:
 *   const logo = document.querySelector('reality-forge-logo');
 *   logo.config = { portalColor: '#7c6fff', pCount: 0, fontFinal: '"Söhne", sans-serif' };
 *   logo.play(); logo.pause(); logo.restart(); logo.seek(3.2); logo.showFinal();
 *
 * Attributes (all optional): autoplay, loop, speed, config='{"...":...}'
 * Events: "rf:complete" fires when the animation reaches its final frame.
 */
(function () {
  'use strict';

  var DEFAULTS = {
    /* timing — milliseconds */
    portalDraw: 600,      // vertical portal line draws in
    realityDelay: 0,      // wait after the portal is open
    realityDur: 900,      // "Reality" emerges and settles
    typeSpeed: 200,       // per character of "Forge"
    cursorPause: 300,     // beat + one cursor blink
    scanDelay: 0,         // wait before the scan starts
    scanDur: 1200,        // beam travels across the wordmark
    settleDur: 500,       // beam dissolves, logo settles
    holdDur: 1500,        // held final frame (also the loop tail)
    durMult: 1,           // global duration multiplier
    easing: 'expo',       // linear | sine | cubic | quint | expo | circ | soft

    /* portal & scanner */
    portalColor: '#6f8cff',
    lineWidth: 3,         // portal and scan line share one thickness
    portalH: 210,         // line height in SVG units (viewBox is 1600x900)
    portalBright: 1,
    glowIntensity: 0.5,
    glowRadius: 26,
    glowSpread: 190,      // rightward directional glow
    glowBalance: 0.18,    // after "Reality" exits: glow balances to this share, both sides
    scanSpeed: 1,
    scanBright: 1,
    scanTrail: 70,
    scanFade: 400,
    linkColors: true,
    scanColor: '#7c6fff', // used when linkColors is false
    dissolve: true,       // scanner breaks into motes after clearing "Forge"

    /* particles — emitted only at the portal / moving beam */
    pOn: true, pCount: 14, pColor: '#9fb0ff', pMin: 1, pMax: 2.6, pOpacity: 0.7,
    pSpeed: 60, pLife: 900, pSpread: 0.85, pDrift: 20, pTrail: 6,
    pPortal: true, pScan: true,

    /* typography — pass any CSS font-family string */
    fontFinal: '"Geist","Helvetica Neue",Arial,sans-serif',
    fontCode: '"Geist Mono",ui-monospace,SFMono-Regular,Menlo,monospace',
    fontSize: 112, weightFinal: 500, weightCode: 400,
    tracking: -1.5, wordGap: 34,
    textColor: '#eeece7', codeColor: '#9fb0e8',
    cursorColor: '#8ea3ff', cursorW: 3, blink: 520,
    markScale: 1, markX: 0, markY: 0,
    wordA: 'Reality', wordB: 'Forge',

    /* "Reality" entrance */
    entDist: 170, entSoft: 44, entOpacity: 0, entBlur: 6,
    entEasing: 'expo', entOvershoot: 0, entHighlight: 0.5,
    entStop: 26,          // final resting offset to the right of the portal

    /* canvas */
    bg: 'transparent',    // e.g. '#0b0d12'
    align: 'center',      // center | left | right
    loop: false, speed: 1
  };

  var EASE = {
    linear: function (p) { return p; },
    sine: function (p) { return 0.5 - Math.cos(p * Math.PI) / 2; },
    cubic: function (p) { return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; },
    quint: function (p) { return 1 - Math.pow(1 - p, 5); },
    expo: function (p) { return p >= 1 ? 1 : 1 - Math.pow(2, -10 * p); },
    circ: function (p) { return Math.sqrt(1 - Math.pow(p - 1, 2)); },
    soft: function (p) { return 1 - Math.pow(1 - p, 2.4); }
  };
  function ease(name, p) {
    p = Math.max(0, Math.min(1, p));
    return (EASE[name] || EASE.expo)(p);
  }
  var NS = 'http://www.w3.org/2000/svg';
  function el(name, attrs) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }

  var UID = 0;

  var Logo = function () {};
  Logo.prototype = Object.create(HTMLElement.prototype);

  class RealityForgeLogo extends HTMLElement {
    constructor() {
      super();
      this._cfg = Object.assign({}, DEFAULTS);
      this._t = 0;
      this._playing = false;
      this._burst = false;
      this._parts = [];
      this._pool = [];
      this._uid = ++UID;
    }

    /* ---------- public API ---------- */
    get config() { return Object.assign({}, this._cfg); }
    set config(patch) {
      Object.assign(this._cfg, patch || {});
      if (this._built) { this._applyStyles(); this._measure(); this._render(this._t); }
    }
    play() {
      if (this._t >= this._tl.total) this._t = 0;
      this._last = 0;
      this._playing = true;
      this._schedule();
    }
    pause() {
      this._playing = false;
      this._last = 0;
      cancelAnimationFrame(this._raf);
      this._raf = 0;
    }
    restart() {
      this._t = 0;
      this._last = 0;
      this._resetParticles();
      this._playing = true;
      this._schedule();
    }
    seek(seconds) {
      this._playing = false;
      this._resetParticles();
      this._t = Math.max(0, Math.min(this._tl.total, seconds * 1000));
      this._render(this._t);
    }
    /* static finished logo, no motion at all */
    showFinal() { this._playing = false; this._t = this._tl.total; this._render(this._t); }
    get duration() { return this._tl.total / 1000; }
    get currentTime() { return this._t / 1000; }

    /* ---------- lifecycle ---------- */
    connectedCallback() {
      if (this._built) return;
      this._built = true;
      if (this.hasAttribute('config')) {
        try { Object.assign(this._cfg, JSON.parse(this.getAttribute('config'))); } catch (e) {}
      }
      if (this.hasAttribute('loop')) this._cfg.loop = true;
      if (this.hasAttribute('speed')) this._cfg.speed = Number(this.getAttribute('speed')) || 1;
      this._build();
      this._applyStyles();
      this._measure();
      this._tl = this._timeline();

      this._loopFn = this._frame.bind(this);
      var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduced) { this.showFinal(); }
      else if (this.hasAttribute('autoplay')) { this.play(); }
      else { this._render(0); }

      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () { this._measure(); this._render(this._t); }.bind(this));
      }
      this._ro = window.ResizeObserver ? new ResizeObserver(function () {
        this._measure();
        this._render(this._t);
      }.bind(this)) : null;
      this._ro && this._ro.observe(this);
    }
    disconnectedCallback() {
      this.pause();
      this._ro && this._ro.disconnect();
      this._built = false;
    }

    /* ---------- DOM ---------- */
    _build() {
      var u = this._uid, id = function (n) { return 'rf' + u + '-' + n; };
      this.style.display = 'block';
      this.style.position = 'relative';

      var svg = el('svg', {
        viewBox: '0 0 1600 900',
        width: '100%',
        height: '100%',
        role: 'img',
        'aria-label': this._cfg.wordA + ' ' + this._cfg.wordB,
        preserveAspectRatio: 'xMidYMid meet'
      });
      svg.style.display = 'block';
      svg.style.overflow = 'visible';

      var defs = el('defs');
      function grad(gid, flip) {
        var g = el('linearGradient', { id: gid, gradientUnits: 'objectBoundingBox', x1: 0, y1: 0, x2: 1, y2: 0 });
        var a = el('stop', { offset: flip ? 1 : 0, 'stop-color': '#6f8cff', 'stop-opacity': 0.55 });
        var b = el('stop', { offset: flip ? 0 : 1, 'stop-color': '#6f8cff', 'stop-opacity': 0 });
        g.appendChild(flip ? b : a); g.appendChild(flip ? a : b);
        g._solid = a;
        return g;
      }
      this.gR = grad(id('glowR'), false);
      this.gL = grad(id('glowL'), true);
      this.gT = grad(id('trail'), true);
      defs.appendChild(this.gR); defs.appendChild(this.gL); defs.appendChild(this.gT);

      this.reveal = el('linearGradient', { id: id('reveal'), gradientUnits: 'userSpaceOnUse', x1: 0, y1: 0, x2: 40, y2: 0 });
      this.reveal.appendChild(el('stop', { offset: 0, 'stop-color': '#000' }));
      this.reveal.appendChild(el('stop', { offset: 1, 'stop-color': '#fff' }));
      defs.appendChild(this.reveal);

      var mk = function (mid, rectAttrs) {
        var m = el('mask', { id: mid, maskUnits: 'userSpaceOnUse', x: -2000, y: -2000, width: 6000, height: 5000 });
        var r = el('rect', rectAttrs);
        m.appendChild(r); defs.appendChild(m);
        return r;
      };
      this.rRev = mk(id('mRev'), { x: -2000, y: -2000, width: 6000, height: 5000, fill: 'url(#' + id('reveal') + ')' });
      this.rFin = mk(id('mFin'), { x: -2000, y: -2000, width: 0, height: 5000, fill: '#fff' });
      this.rMono = mk(id('mMono'), { x: -2000, y: -2000, width: 6000, height: 5000, fill: '#fff' });
      this.rBand = mk(id('mBand'), { x: 0, y: -2000, width: 0, height: 5000, fill: '#fff' });
      svg.appendChild(defs);

      this.word = el('g');
      this.glowL = el('rect', { x: 0, y: 0, width: 0, height: 0, fill: 'url(#' + id('glowL') + ')', opacity: 0 });
      this.glowR = el('rect', { x: 0, y: 0, width: 0, height: 0, fill: 'url(#' + id('glowR') + ')', opacity: 0 });
      this.trail = el('rect', { x: 0, y: 0, width: 0, height: 0, fill: 'url(#' + id('trail') + ')', opacity: 0 });
      this.word.appendChild(this.glowL); this.word.appendChild(this.glowR); this.word.appendChild(this.trail);

      var gRev = el('g', { mask: 'url(#' + id('mRev') + ')' });
      this.wrapA = el('g');
      this.textA = el('text', { x: 0, y: 0 });
      this.textA.textContent = this._cfg.wordA;
      this.wrapA.appendChild(this.textA); gRev.appendChild(this.wrapA); this.word.appendChild(gRev);

      var gBand = el('g', { mask: 'url(#' + id('mBand') + ')' });
      this.textHi = el('text', { x: 0, y: 0, fill: '#fff', opacity: 0 });
      this.textHi.textContent = this._cfg.wordA;
      gBand.appendChild(this.textHi); this.word.appendChild(gBand);

      var gFin = el('g', { mask: 'url(#' + id('mFin') + ')' });
      this.textB = el('text', { x: 0, y: 0 });
      this.textB.textContent = this._cfg.wordB;
      gFin.appendChild(this.textB); this.word.appendChild(gFin);

      var gMono = el('g', { mask: 'url(#' + id('mMono') + ')' });
      this.textMono = el('text', { x: 0, y: 0 });
      gMono.appendChild(this.textMono); this.word.appendChild(gMono);

      this.cursor = el('rect', { x: 0, y: 0, width: 0, height: 0, opacity: 0 });
      this.pGroup = el('g');
      this.beam = el('rect', { x: 0, y: 0, width: 0, height: 0, opacity: 0 });
      this.word.appendChild(this.cursor); this.word.appendChild(this.pGroup); this.word.appendChild(this.beam);
      svg.appendChild(this.word);
      this.svg = svg;
      this.appendChild(svg);

      for (var i = 0; i < 220; i++) {
        var p = el('rect', { opacity: 0, rx: 1 });
        this.pGroup.appendChild(p);
        this._pool.push(p);
        this._parts.push({ alive: false, x: 0, y: 0, vx: 0, vy: 0, age: 0, life: 1, size: 1 });
      }
    }

    _applyStyles() {
      var c = this._cfg;
      this.style.background = c.bg;
      var set = function (t, fam, w, fill) {
        t.style.fontFamily = fam;
        t.style.fontWeight = String(w);
        t.style.fontSize = c.fontSize + 'px';
        t.style.letterSpacing = c.tracking + 'px';
        t.style.whiteSpace = 'pre';
        t.setAttribute('fill', fill);
      };
      set(this.textA, c.fontFinal, c.weightFinal, c.textColor);
      set(this.textHi, c.fontFinal, c.weightFinal, '#ffffff');
      set(this.textB, c.fontFinal, c.weightFinal, c.textColor);
      set(this.textMono, c.fontCode, c.weightCode, c.codeColor);
      this.textA.textContent = c.wordA;
      this.textHi.textContent = c.wordA;
      this.textB.textContent = c.wordB;
      this.cursor.setAttribute('fill', c.cursorColor);
      this._tl = this._timeline();
    }

    _timeline() {
      var c = this._cfg, m = Math.max(0.05, c.durMult), t = {};
      t.portalEnd = c.portalDraw * m;
      t.realityStart = t.portalEnd + c.realityDelay * m;
      t.realityEnd = t.realityStart + c.realityDur * m;
      t.typeStart = t.realityEnd;
      t.typeEnd = t.typeStart + c.typeSpeed * c.wordB.length * m;
      t.pauseEnd = t.typeEnd + c.cursorPause * m;
      t.scanStart = t.pauseEnd + c.scanDelay * m;
      t.scanEnd = t.scanStart + (c.scanDur / Math.max(0.1, c.scanSpeed)) * m;
      t.settleEnd = t.scanEnd + c.settleDur * m;
      t.total = t.settleEnd + c.holdDur * m;
      return t;
    }

    _measure() {
      var c = this._cfg;
      var prev = this.textMono.textContent;
      this.textMono.textContent = c.wordB;
      var wA = 500, wM = 320, wB = 300;
      try {
        wA = this.textA.getBBox().width;
        wM = this.textMono.getBBox().width;
        wB = this.textB.getBBox().width;
      } catch (e) {}
      this.textMono.textContent = prev;
      var reserved = Math.max(wM, wB);
      var total = wA + c.wordGap + reserved;
      var cx = 800;
      if (c.align === 'left') cx = 100 + total / 2;
      if (c.align === 'right') cx = 1500 - total / 2;
      var x0 = cx - total / 2 + c.markX;
      var ox = x0 + (c.entStop || 0);
      var oy = 450 + c.fontSize * 0.34 + c.markY;
      var fx = ox + wA + c.wordGap;
      [[this.textA, ox], [this.textHi, ox], [this.textB, fx], [this.textMono, fx]].forEach(function (pair) {
        pair[0].setAttribute('x', String(pair[1]));
        pair[0].setAttribute('y', String(oy));
      });
      this.L = {
        originX: ox, originY: oy, forgeX: fx, adv: wM / Math.max(1, c.wordB.length),
        portalX: x0 - Math.max(10, c.fontSize * 0.14),
        endX: ox + wA + c.wordGap + reserved + Math.max(16, c.fontSize * 0.2),
        top: oy - c.fontSize * 0.78, bottom: oy + c.fontSize * 0.22
      };
      this.word.setAttribute('transform', 'translate(800,450) scale(' + c.markScale + ') translate(-800,-450)');
    }

    /* ---------- clock ---------- */
    _schedule() {
      if (!this._raf) this._raf = requestAnimationFrame(this._loopFn);
    }
    _frame(now) {
      this._raf = 0;
      var dt = Math.min(64, this._last ? now - this._last : 16);
      this._last = now;
      if (this._playing) {
        this._t += dt * (this._cfg.speed || 1);
        if (this._t >= this._tl.total) {
          if (this._cfg.loop) { this._t = this._t % this._tl.total; this._resetParticles(); }
          else {
            this._t = this._tl.total; this._playing = false;
            this.dispatchEvent(new CustomEvent('rf:complete'));
          }
        }
      }
      this._render(this._t, this._playing ? dt : 0);
      if (this._playing) this._schedule();
    }
    _resetParticles() {
      this._burst = false;
      for (var i = 0; i < this._parts.length; i++) {
        this._parts[i].alive = false;
        this._pool[i].setAttribute('opacity', '0');
      }
    }

    /* ---------- one frame ---------- */
    _render(t, dt) {
      var c = this._cfg, L = this.L, tl = this._tl;
      if (!L) return;
      var scanCol = c.linkColors ? c.portalColor : c.scanColor;
      var centerY = (L.top + L.bottom) / 2;

      var drawP = ease('soft', t / Math.max(1, tl.portalEnd));
      var h = c.portalH * drawP;
      var beamX = L.portalX, beamW = c.lineWidth;
      var opacity = Math.min(1, t / Math.max(1, tl.portalEnd * 0.35)) * c.portalBright;
      var scanning = false;
      if (t >= tl.scanStart) {
        scanning = t <= tl.scanEnd;
        var sp = Math.max(0, Math.min(1, (t - tl.scanStart) / Math.max(1, tl.scanEnd - tl.scanStart)));
        beamX = L.portalX + (L.endX - L.portalX) * ease(c.easing === 'linear' ? 'linear' : 'sine', sp);
        h = c.portalH;
        opacity = c.scanBright;
      }
      if (t > tl.scanEnd) {
        var fade = c.dissolve ? Math.max(90, c.scanFade * 0.45) : c.scanFade;
        var fp = Math.min(1, (t - tl.scanEnd) / Math.max(1, fade * c.durMult));
        opacity = c.scanBright * (1 - fp) * (c.dissolve ? (1 - fp) : 1);
        h = c.portalH * (1 - (c.dissolve ? 0.55 : 0.85) * fp);
      }
      if (t >= tl.settleEnd) opacity = 0;

      var bx = beamX - beamW / 2, by = centerY - h / 2;
      this.beam.setAttribute('x', bx); this.beam.setAttribute('y', by);
      this.beam.setAttribute('width', beamW); this.beam.setAttribute('height', Math.max(0, h));
      this.beam.setAttribute('fill', t >= tl.scanStart ? scanCol : c.portalColor);
      this.beam.setAttribute('opacity', Math.max(0, opacity));
      this.beam.style.filter = c.glowIntensity > 0
        ? 'drop-shadow(0 0 ' + (c.glowRadius * 0.45) + 'px ' + (scanning ? scanCol : c.portalColor) + ') drop-shadow(0 0 ' + c.glowRadius + 'px ' + (scanning ? scanCol : c.portalColor) + ')'
        : 'none';

      /* right-biased glow balances to a faint two-sided halo before the scan */
      var bal = ease('sine', (t - tl.realityEnd) / Math.max(1, tl.scanStart - tl.realityEnd));
      var symW = c.glowSpread * c.glowBalance;
      var rightW = c.glowSpread + (symW - c.glowSpread) * bal;
      var leftW = symW * bal;
      var glowCol = t >= tl.scanStart ? scanCol : c.portalColor;
      var glowO = Math.max(0, opacity) * c.glowIntensity;
      this.glowR.setAttribute('x', bx); this.glowR.setAttribute('y', by);
      this.glowR.setAttribute('width', Math.max(0, rightW)); this.glowR.setAttribute('height', Math.max(0, h));
      this.glowR.setAttribute('opacity', glowO);
      this.gR._solid.setAttribute('stop-color', glowCol);
      this.glowL.setAttribute('x', bx - Math.max(0, leftW)); this.glowL.setAttribute('y', by);
      this.glowL.setAttribute('width', Math.max(0, leftW)); this.glowL.setAttribute('height', Math.max(0, h));
      this.glowL.setAttribute('opacity', leftW > 0.5 ? glowO * 0.9 : 0);
      this.gL._solid.setAttribute('stop-color', glowCol);

      var trailOn = t >= tl.scanStart && c.scanTrail > 0 && t < tl.settleEnd;
      this.trail.setAttribute('x', bx - c.scanTrail); this.trail.setAttribute('y', by);
      this.trail.setAttribute('width', trailOn ? c.scanTrail : 0); this.trail.setAttribute('height', Math.max(0, h));
      this.trail.setAttribute('opacity', trailOn ? Math.max(0, opacity) * 0.8 : 0);
      this.gT._solid.setAttribute('stop-color', scanCol);

      /* word A entrance */
      var rp = Math.max(0, Math.min(1, (t - tl.realityStart) / Math.max(1, tl.realityEnd - tl.realityStart)));
      var re = ease(c.entEasing, rp);
      if (c.entOvershoot) re += c.entOvershoot * 0.01 * Math.sin(Math.PI * rp) * (1 - rp) * 3;
      this.wrapA.setAttribute('transform', 'translate(' + (-c.entDist * (1 - re)).toFixed(2) + ',0)');
      this.wrapA.style.opacity = String(c.entOpacity + (1 - c.entOpacity) * Math.min(1, rp * 1.6));
      this.wrapA.style.filter = (c.entBlur > 0 && rp < 1) ? 'blur(' + (c.entBlur * (1 - rp)).toFixed(2) + 'px)' : 'none';
      var revX = rp >= 1 ? -3000 : Math.max(L.portalX, beamX);
      this.reveal.setAttribute('x1', revX);
      this.reveal.setAttribute('x2', revX + Math.max(0.5, c.entSoft));

      /* word B typing */
      var n = c.wordB.length;
      var chars = t < tl.typeStart ? 0 : (t >= tl.typeEnd ? n : Math.max(0, Math.min(n, Math.floor((t - tl.typeStart) / Math.max(1, c.typeSpeed * c.durMult)))));
      var want = c.wordB.slice(0, chars);
      if (this.textMono.textContent !== want) this.textMono.textContent = want;

      var cursorLive = t >= tl.typeStart && t < tl.scanStart;
      var blinkOn = ((t / Math.max(60, c.blink)) % 1) < 0.55;
      this.cursor.setAttribute('x', L.forgeX + chars * L.adv + 2);
      this.cursor.setAttribute('y', L.top + c.fontSize * 0.08);
      this.cursor.setAttribute('width', c.cursorW);
      this.cursor.setAttribute('height', c.fontSize * 0.72);
      this.cursor.setAttribute('opacity', cursorLive && blinkOn ? 0.9 : 0);

      /* moving reveal: final letters behind the beam, mono letters in front of it */
      var revealTo = t >= tl.scanEnd ? 4000 : (t < tl.scanStart ? L.portalX : beamX);
      this.rFin.setAttribute('width', Math.max(0, revealTo + 2000));
      this.rMono.setAttribute('x', revealTo);
      this.rMono.setAttribute('width', t >= tl.scanEnd ? 0 : 6000);

      var bandW = Math.max(24, c.lineWidth * 14);
      var inA = beamX > L.originX - bandW && beamX < L.forgeX;
      this.rBand.setAttribute('x', beamX - bandW / 2);
      this.rBand.setAttribute('width', scanning ? bandW : 0);
      this.textHi.setAttribute('opacity', (scanning && inA) ? c.entHighlight : 0);

      this._particles(t, dt || 0, beamX, centerY, h, scanning);
    }

    _particles(t, dt, beamX, centerY, h, scanning) {
      var c = this._cfg, P = this._parts, pool = this._pool, tl = this._tl, i;
      if (t >= tl.settleEnd) {
        for (i = 0; i < P.length; i++) {
          P[i].alive = false;
          if (pool[i].getAttribute('opacity') !== '0') pool[i].setAttribute('opacity', '0');
        }
        return;
      }
      if (c.dissolve && c.pOn && dt > 0 && !this._burst && t >= tl.scanEnd) {
        this._burst = true;
        var life = Math.min(420, Math.max(160, c.settleDur * 0.7 * c.durMult));
        var want = Math.max(12, Math.min(48, c.pCount * 1.6)), made = 0;
        for (i = 0; i < P.length && made < want; i++) {
          var q = P[i], a = (Math.random() - 0.5) * 1.1, s = (c.pSpeed / 1000) * (0.5 + Math.random() * 1.6);
          q.alive = true; q.age = 0; q.life = life * (0.55 + Math.random() * 0.7);
          q.x = beamX + (Math.random() - 0.5) * 4;
          q.y = centerY + (Math.random() - 0.5) * h * 0.95;
          q.vx = Math.cos(a) * s * (Math.random() < 0.75 ? 1 : -0.5);
          q.vy = Math.sin(a) * s * 0.9;
          q.size = c.pMin + Math.random() * Math.max(0, c.pMax - c.pMin);
          made++;
        }
      }
      var emitting = c.pOn && c.pCount > 0 && !this._burst &&
        ((scanning && c.pScan) || (!scanning && t < tl.realityEnd && c.pPortal));
      if (emitting && dt > 0) {
        var alive = 0;
        for (i = 0; i < P.length; i++) if (P[i].alive) alive++;
        var spawn = Math.min(3, Math.max(0, Math.min(pool.length, c.pCount) - alive));
        for (i = 0; i < P.length && spawn > 0; i++) {
          var p = P[i];
          if (p.alive) continue;
          p.alive = true; p.age = 0;
          p.life = c.pLife * (0.6 + Math.random() * 0.7);
          p.x = beamX + (Math.random() - 0.5) * 6;
          p.y = centerY + (Math.random() - 0.5) * h * c.pSpread;
          p.vx = Math.max(0.014, (c.pSpeed / 1000) * (0.4 + Math.random() * 1.3) * (scanning ? 1.1 : 1));
          p.vy = ((Math.random() - 0.5) * c.pDrift) / 1000;
          p.size = c.pMin + Math.random() * Math.max(0, c.pMax - c.pMin);
          spawn--;
        }
      }
      for (i = 0; i < P.length; i++) {
        var pt = P[i], node = pool[i];
        if (!pt.alive) { if (node.getAttribute('opacity') !== '0') node.setAttribute('opacity', '0'); continue; }
        if (dt > 0) { pt.age += dt; pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.vy += 0.000012 * dt; }
        if (pt.age >= pt.life || pt.x > this.L.endX + 420 || pt.x < this.L.portalX - 300) {
          pt.alive = false; node.setAttribute('opacity', '0'); continue;
        }
        var k = pt.age / pt.life;
        var o = c.pOpacity * (1 - k) * (k < 0.12 ? k / 0.12 : 1);
        node.setAttribute('x', pt.x.toFixed(1));
        node.setAttribute('y', pt.y.toFixed(1));
        node.setAttribute('width', (pt.size + c.pTrail * (1 - k)).toFixed(1));
        node.setAttribute('height', pt.size.toFixed(1));
        node.setAttribute('fill', c.pColor);
        node.setAttribute('opacity', o.toFixed(3));
      }
    }
  }

  RealityForgeLogo.DEFAULTS = DEFAULTS;
  if (!window.customElements.get('reality-forge-logo')) {
    window.customElements.define('reality-forge-logo', RealityForgeLogo);
  }
  window.RealityForgeLogo = RealityForgeLogo;
})();

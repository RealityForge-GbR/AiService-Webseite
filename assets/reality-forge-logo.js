/*
 * <reality-forge-logo>
 * A dependency-free SVG wordmark. It deliberately uses no canvas or animation
 * library; each instance only schedules frames while it is actively animating.
 */
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var uid = 0;
  var DEFAULTS = {
    portalDraw: 600, realityDelay: 0, realityDur: 900, typeSpeed: 200,
    cursorPause: 300, scanDelay: 0, scanDur: 1200, settleDur: 500,
    holdDur: 1500, durMult: 1, easing: 'expo', speed: 1, loop: false,
    portalColor: '#6f8cff', lineWidth: 3, portalH: 210, portalBright: 1,
    glowIntensity: 0.5, glowRadius: 26, glowSpread: 190, glowBalance: 0.18,
    scanSpeed: 1, scanBright: 1, scanTrail: 70, scanFade: 400,
    linkColors: true, scanColor: '#7c6fff', dissolve: true,
    pOn: true, pCount: 14, pColor: '#9fb0ff', pMin: 1, pMax: 2.6,
    pOpacity: 0.7, pSpeed: 60, pLife: 900, pSpread: 0.85, pDrift: 20,
    pTrail: 6, pPortal: true, pScan: true,
    fontFinal: 'Inter, "Segoe UI", Helvetica, Arial, sans-serif',
    fontCode: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 112, weightFinal: 500, weightCode: 400, tracking: -1.5,
    wordGap: 34, textColor: '#eeece7', codeColor: '#9fb0e8',
    cursorColor: '#8ea3ff', cursorW: 3, blink: 520, wordA: 'Reality', wordB: 'Forge',
    entDist: 170, entSoft: 44, entOpacity: 0, entBlur: 6, entEasing: 'expo',
    entOvershoot: 0, entHighlight: 0.5, entStop: 26,
    markScale: 1, markX: 0, markY: 0, bg: 'transparent', align: 'center'
  };

  function node(name, attrs) {
    var element = document.createElementNS(NS, name);
    Object.keys(attrs || {}).forEach(function (key) { element.setAttribute(key, attrs[key]); });
    return element;
  }
  function clamp(value) { return Math.max(0, Math.min(1, value)); }
  function ease(name, value) {
    var p = clamp(value);
    if (name === 'linear') return p;
    if (name === 'sine') return 0.5 - Math.cos(p * Math.PI) / 2;
    if (name === 'soft') return 1 - Math.pow(1 - p, 2.4);
    return p >= 1 ? 1 : 1 - Math.pow(2, -10 * p);
  }

  class RealityForgeLogo extends HTMLElement {
    constructor() {
      super();
      this._config = Object.assign({}, DEFAULTS);
      this._time = 0;
      this._playing = false;
      this._frame = 0;
      this._last = 0;
      this._id = ++uid;
    }

    get config() { return Object.assign({}, this._config); }
    set config(patch) {
      Object.assign(this._config, patch || {});
      if (this._built) {
        this._applyConfig();
        this._measure();
        this._render(this._time);
      }
    }
    get duration() { return this._timeline().total / 1000; }
    get currentTime() { return this._time / 1000; }
    play() {
      if (this._time >= this._timeline().total) this._time = 0;
      this._playing = true;
      this._schedule();
    }
    pause() { this._playing = false; }
    restart() { this._time = 0; this._playing = true; this._schedule(); }
    seek(seconds) { this._time = Math.max(0, Math.min(this._timeline().total, seconds * 1000)); this.pause(); this._render(this._time); }
    showFinal() { this._time = this._timeline().total; this.pause(); this._render(this._time); }

    connectedCallback() {
      if (this._built) return;
      this._built = true;
      if (this.hasAttribute('config')) {
        try { Object.assign(this._config, JSON.parse(this.getAttribute('config'))); } catch (error) { /* Ignore malformed optional config. */ }
      }
      this._build();
      this._applyConfig();
      this._measure();
      var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduced) this.showFinal();
      else if (this.hasAttribute('autoplay')) this.play();
      else this._render(0);
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () { this._measure(); this._render(this._time); }.bind(this));
      }
    }
    disconnectedCallback() { cancelAnimationFrame(this._frame); this._frame = 0; this._playing = false; this._built = false; }

    _build() {
      var prefix = 'rf-logo-' + this._id;
      this.style.display = 'block';
      this.style.position = 'relative';
      this.svg = node('svg', { viewBox: '0 0 1600 900', width: '100%', height: '100%', role: 'img', 'aria-label': 'RealityForge' });
      this.svg.style.display = 'block';
      this.svg.style.overflow = 'visible';
      var defs = node('defs');
      this.finalClip = node('rect', { x: 0, y: 0, width: 0, height: 900 });
      this.codeClip = node('rect', { x: 0, y: 0, width: 0, height: 900 });
      var finalClipPath = node('clipPath', { id: prefix + '-final' });
      var codeClipPath = node('clipPath', { id: prefix + '-code' });
      finalClipPath.appendChild(this.finalClip); codeClipPath.appendChild(this.codeClip);
      this.glowGradient = node('linearGradient', { id: prefix + '-glow', x1: 0, y1: 0, x2: 1, y2: 0 });
      this.glowStop = node('stop', { offset: 0, 'stop-opacity': 0.55 });
      this.glowGradient.appendChild(this.glowStop);
      this.glowGradient.appendChild(node('stop', { offset: 1, 'stop-opacity': 0 }));
      defs.appendChild(finalClipPath); defs.appendChild(codeClipPath); defs.appendChild(this.glowGradient);
      this.svg.appendChild(defs);
      this.group = node('g');
      this.glow = node('rect', { opacity: 0, fill: 'url(#' + prefix + '-glow)' });
      this.trail = node('rect', { opacity: 0, fill: 'url(#' + prefix + '-glow)' });
      this.reality = node('text');
      this.final = node('text');
      this.code = node('text');
      this.cursor = node('rect', { opacity: 0 });
      this.beam = node('rect', { opacity: 0 });
      this.particles = node('g', { 'aria-hidden': 'true' });
      this.final.setAttribute('clip-path', 'url(#' + prefix + '-final)');
      this.code.setAttribute('clip-path', 'url(#' + prefix + '-code)');
      this.group.append(this.glow, this.trail, this.reality, this.final, this.code, this.cursor, this.particles, this.beam);
      this.svg.appendChild(this.group);
      this.appendChild(this.svg);
    }

    _applyText(text, family, weight, color) {
      text.style.fontFamily = family;
      text.style.fontWeight = String(weight);
      text.style.fontSize = this._config.fontSize + 'px';
      text.style.letterSpacing = this._config.tracking + 'px';
      text.setAttribute('fill', color);
    }
    _applyConfig() {
      var c = this._config;
      this.style.background = c.bg;
      this._applyText(this.reality, c.fontFinal, c.weightFinal, c.textColor);
      this._applyText(this.final, c.fontFinal, c.weightFinal, c.textColor);
      this._applyText(this.code, c.fontCode, c.weightCode, c.codeColor);
      this.reality.textContent = c.wordA;
      this.final.textContent = c.wordB;
      this.cursor.setAttribute('fill', c.cursorColor);
      this.glowStop.setAttribute('stop-color', c.portalColor);
    }
    _measure() {
      var c = this._config;
      try {
        var realWidth = this.reality.getComputedTextLength();
        var finalWidth = this.final.getComputedTextLength();
        var codeWidth = this.code.getComputedTextLength();
        var reserve = Math.max(finalWidth, codeWidth);
        var total = realWidth + c.wordGap + reserve;
        var centre = c.align === 'left' ? 150 + total / 2 : c.align === 'right' ? 1450 - total / 2 : 800;
        var start = centre - total / 2 + c.markX;
        this.layout = {
          realX: start + c.entStop,
          forgeX: start + c.entStop + realWidth + c.wordGap,
          endX: start + c.entStop + realWidth + c.wordGap + reserve + 48,
          portalX: start - Math.max(10, c.fontSize * 0.14),
          y: 450 + c.fontSize * 0.34 + c.markY,
          top: 450 - c.fontSize * 0.46 + c.markY,
          bottom: 450 + c.fontSize * 0.34 + c.markY,
          codeAdvance: codeWidth / Math.max(1, c.wordB.length)
        };
      } catch (error) {
        this.layout = { realX: 470, forgeX: 930, endX: 1260, portalX: 430, y: 488, top: 395, bottom: 488, codeAdvance: 64 };
      }
      this.group.setAttribute('transform', 'translate(800 450) scale(' + c.markScale + ') translate(-800 -450)');
      [this.reality, this.final, this.code].forEach(function (text) { text.setAttribute('y', this.layout.y); }.bind(this));
    }
    _timeline() {
      var c = this._config, multiplier = Math.max(0.05, c.durMult), t = {};
      t.portalEnd = c.portalDraw * multiplier;
      t.realityStart = t.portalEnd + c.realityDelay * multiplier;
      t.realityEnd = t.realityStart + c.realityDur * multiplier;
      t.typeStart = t.realityEnd;
      t.typeEnd = t.typeStart + c.typeSpeed * c.wordB.length * multiplier;
      t.scanStart = t.typeEnd + c.cursorPause * multiplier + c.scanDelay * multiplier;
      t.scanEnd = t.scanStart + (c.scanDur / Math.max(0.1, c.scanSpeed)) * multiplier;
      t.settleEnd = t.scanEnd + c.settleDur * multiplier;
      t.total = t.settleEnd + c.holdDur * multiplier;
      return t;
    }
    _schedule() { if (!this._frame) this._frame = requestAnimationFrame(this._tick.bind(this)); }
    _tick(now) {
      this._frame = 0;
      if (!this._playing) return;
      var dt = Math.min(64, this._last ? now - this._last : 16);
      this._last = now;
      this._time += dt * (this._config.speed || 1);
      var total = this._timeline().total;
      if (this._time >= total) {
        if (this._config.loop) this._time %= total;
        else { this._time = total; this._playing = false; this.dispatchEvent(new CustomEvent('rf:complete')); }
      }
      this._render(this._time);
      if (this._playing) this._schedule();
    }
    _render(time) {
      if (!this.layout) return;
      var c = this._config, l = this.layout, t = this._timeline();
      var realProgress = clamp((time - t.realityStart) / Math.max(1, t.realityEnd - t.realityStart));
      var scanProgress = clamp((time - t.scanStart) / Math.max(1, t.scanEnd - t.scanStart));
      var portalProgress = ease('soft', time / Math.max(1, t.portalEnd));
      var beamX = time < t.scanStart ? l.portalX : l.portalX + (l.endX - l.portalX) * ease(c.easing, scanProgress);
      var beamHeight = c.portalH * (time > t.scanEnd ? Math.max(0, 1 - clamp((time - t.scanEnd) / Math.max(1, c.scanFade))) : portalProgress || 1);
      var beamOpacity = time >= t.settleEnd ? 0 : (time > t.scanEnd ? Math.max(0, 1 - clamp((time - t.scanEnd) / Math.max(1, c.scanFade))) : 1);
      beamOpacity *= time < t.scanStart ? c.portalBright : c.scanBright;
      var scanColor = c.linkColors ? c.portalColor : c.scanColor;
      var entrance = ease(c.entEasing, realProgress);
      if (c.entOvershoot) entrance += c.entOvershoot * 0.01 * Math.sin(Math.PI * realProgress) * (1 - realProgress) * 3;
      this.reality.setAttribute('x', l.realX - c.entDist * (1 - entrance));
      this.reality.style.opacity = String(c.entOpacity + (1 - c.entOpacity) * clamp(realProgress * 1.6));
      this.reality.style.filter = realProgress < 1 && c.entBlur ? 'blur(' + (c.entBlur * (1 - realProgress)).toFixed(2) + 'px)' : 'none';
      this.final.setAttribute('x', l.forgeX);
      this.code.setAttribute('x', l.forgeX);
      var typed = time < t.typeStart ? 0 : Math.min(c.wordB.length, Math.floor((time - t.typeStart) / Math.max(1, c.typeSpeed * c.durMult)));
      this.code.textContent = c.wordB.slice(0, typed);
      this.finalClip.setAttribute('x', l.forgeX - 2);
      this.finalClip.setAttribute('width', Math.max(0, (time < t.scanStart ? 0 : beamX - l.forgeX + 4)));
      this.codeClip.setAttribute('x', time < t.scanStart ? l.forgeX - 2 : beamX);
      this.codeClip.setAttribute('width', Math.max(0, l.endX - beamX + 12));
      var cursorVisible = time >= t.typeStart && time < t.scanStart && ((time / Math.max(60, c.blink)) % 1) < 0.55;
      this.cursor.setAttribute('x', l.forgeX + typed * l.codeAdvance + 3);
      this.cursor.setAttribute('y', l.top);
      this.cursor.setAttribute('width', c.cursorW);
      this.cursor.setAttribute('height', c.fontSize * 0.75);
      this.cursor.setAttribute('opacity', cursorVisible ? 0.9 : 0);
      this.beam.setAttribute('x', beamX - c.lineWidth / 2);
      this.beam.setAttribute('y', (l.top + l.bottom) / 2 - beamHeight / 2);
      this.beam.setAttribute('width', c.lineWidth);
      this.beam.setAttribute('height', beamHeight);
      this.beam.setAttribute('fill', scanProgress > 0 ? scanColor : c.portalColor);
      this.beam.setAttribute('opacity', beamOpacity);
      this.beam.style.filter = c.glowIntensity ? 'drop-shadow(0 0 ' + c.glowRadius + 'px ' + scanColor + ')' : 'none';
      this.glow.setAttribute('x', beamX);
      this.glow.setAttribute('y', (l.top + l.bottom) / 2 - beamHeight / 2);
      this.glow.setAttribute('width', c.glowSpread);
      this.glow.setAttribute('height', beamHeight);
      var glowBalance = scanProgress > 0 ? 1 : c.glowBalance + (1 - c.glowBalance) * (1 - realProgress);
      this.glow.setAttribute('opacity', beamOpacity * c.glowIntensity * glowBalance);
      this.trail.setAttribute('x', beamX - c.scanTrail);
      this.trail.setAttribute('y', (l.top + l.bottom) / 2 - beamHeight / 2);
      this.trail.setAttribute('width', scanProgress > 0 ? c.scanTrail : 0);
      this.trail.setAttribute('height', beamHeight);
      this.trail.setAttribute('opacity', scanProgress > 0 ? beamOpacity * c.glowIntensity : 0);
      this._renderParticles(time, t, beamX, beamHeight, scanProgress);
    }
    _renderParticles(time, timeline, beamX, height, scanProgress) {
      var c = this._config;
      this.particles.replaceChildren();
      if (!c.pOn || !c.pCount || time >= timeline.settleEnd || (!c.dissolve && time > timeline.scanEnd)) return;
      var visible = scanProgress > 0 ? c.pScan : c.pPortal;
      if (!visible) return;
      var count = Math.min(28, c.pCount);
      for (var index = 0; index < count; index += 1) {
        var phase = (time / Math.max(1, c.pLife) + index * 0.618) % 1;
        var size = c.pMin + (c.pMax - c.pMin) * ((index % 7) / 6);
        var x = beamX + phase * c.pSpeed * (scanProgress > 0 ? 1 : 0.45);
        var y = (this.layout.top + this.layout.bottom) / 2 + Math.sin(index * 11.3 + time / 210) * height * c.pSpread * 0.45 + (phase - 0.5) * c.pDrift;
        var particle = node('rect', { x: x.toFixed(1), y: y.toFixed(1), width: (size + c.pTrail * (1 - phase)).toFixed(1), height: size.toFixed(1), rx: 1, fill: c.pColor, opacity: (c.pOpacity * (1 - phase)).toFixed(2) });
        this.particles.appendChild(particle);
      }
    }
  }

  RealityForgeLogo.DEFAULTS = DEFAULTS;
  if (!window.customElements.get('reality-forge-logo')) window.customElements.define('reality-forge-logo', RealityForgeLogo);
  window.RealityForgeLogo = RealityForgeLogo;
}());

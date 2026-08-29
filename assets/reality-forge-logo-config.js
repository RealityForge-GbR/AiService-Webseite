/*
 * RealityForge wordmark settings
 *
 * This is the single integration-level source of truth for the logo. Change
 * typefaces, colours, timing, glow, scan and particle values here rather than
 * editing the component itself.
 *
 * Adobe Fonts: after receiving the Web Project URL, add its stylesheet link in
 * index.html and replace `adobeFinalFamily` below with its published CSS family.
 * Do not add Adobe kit IDs or font files here.
 */
(function () {
  'use strict';

  var adobeFinalFamily = null; // Example when supplied: '"Your Adobe Family", sans-serif'
  var finalFallback = 'Inter, "Segoe UI", Helvetica, Arial, sans-serif';
  var codeFallback = '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace';

  window.RealityForgeLogoSettings = Object.freeze({
    /* Behaviour and accessibility */
    reducedMotion: 'static',

    /* Typography */
    fontFinal: adobeFinalFamily || finalFallback,
    fontCode: codeFallback,
    fontSize: 112,
    weightFinal: 650,
    weightCode: 500,
    tracking: -1.5,
    wordGap: 34,
    wordA: 'Reality',
    wordB: 'Forge',
    textColor: 'var(--text)',
    codeColor: 'var(--accent-soft)',
    cursorColor: 'var(--accent-soft)',
    cursorW: 3,
    blink: 520,

    /* Animation timing (milliseconds) */
    portalDraw: 600,
    realityDelay: 0,
    realityDur: 900,
    typeSpeed: 200,
    cursorPause: 300,
    scanDelay: 0,
    scanDur: 1200,
    settleDur: 500,
    holdDur: 1500,
    durMult: 1,
    easing: 'expo',
    speed: 1,
    loop: false,

    /* Portal, glow and scan */
    portalColor: 'var(--accent)',
    lineWidth: 3,
    portalH: 210,
    portalBright: 1,
    glowIntensity: 0.46,
    glowRadius: 26,
    glowSpread: 190,
    glowBalance: 0.18,
    scanSpeed: 1,
    scanBright: 1,
    scanTrail: 70,
    scanFade: 400,
    linkColors: true,
    scanColor: 'var(--accent)',
    dissolve: true,

    /* Particles: only portal/scan particles; never ambient */
    pOn: true,
    pCount: 14,
    pColor: 'var(--accent-soft)',
    pMin: 1,
    pMax: 2.6,
    pOpacity: 0.7,
    pSpeed: 60,
    pLife: 900,
    pSpread: 0.85,
    pDrift: 20,
    pTrail: 6,
    pPortal: true,
    pScan: true,

    /* Reality entrance and SVG placement */
    entDist: 170,
    entOpacity: 0,
    entBlur: 6,
    entEasing: 'expo',
    entOvershoot: 0,
    entStop: 26,
    markScale: 1.3,
    markX: -26,
    markY: 0,
    bg: 'transparent',
    align: 'center'
  });
}());

/*
 * RealityForge wordmark settings
 *
 * This is the single integration-level source of truth for the logo. Change
 * typefaces, colours, timing, glow, scan and particle values here rather than
 * editing the component itself.
 *
 * Adobe Fonts: the Web Project stylesheet is linked in index.html. Keep the
 * temporary code face and the final wordmark face independently configurable
 * through `adobeCodeFamily` and `adobeFinalFamily` below.
 */
(function () {
  'use strict';

  var adobeFinalFamily = '"acier-bat-noir", sans-serif'; // Adobe UI name: Acier BAT Text Noir
  var finalFallback = 'Inter, "Segoe UI", Helvetica, Arial, sans-serif';
  var adobeCodeFamily = '"bd-terminal-vf", monospace';
  var codeFallback = 'Monaco, Menlo, "Courier New", "SFMono-Regular", Consolas, "Liberation Mono", monospace';

  window.RealityForgeLogoSettings = Object.freeze({
    /* Behaviour and accessibility */
    reducedMotion: 'static',

    /* Typography */
    fontFinal: adobeFinalFamily || finalFallback,
    fontCode: adobeCodeFamily || codeFallback,
    fontSize: 112,
    fontSizeCode: 112,
    weightFinal: 400,
    weightCode: 800,
    widthCode: 225,
    tracking: -1.5,
    trackingCode: -1.5,
    matchCodeToFinal: true,
    wordGap: 34,
    wordA: 'Reality',
    wordB: 'FORGE',
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

    /* Lower portal divider after the wordmark scan */
    lowerPortalDelay: 120,
    lowerPortalDur: 920,
    lowerPortalLift: 26,
    lowerPortalGap: 30,
    lowerPortalGlowH: 76,
    lowerPortalLineWidth: 2,
    lowerParticleCount: 46,
    lowerParticleRate: 16,
    lowerParticleLife: 1350,
    lowerParticleSpeed: 52,
    lowerParticleMin: 0.7,
    lowerParticleMax: 1.9,
    lowerParticleOpacity: 0.5,

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

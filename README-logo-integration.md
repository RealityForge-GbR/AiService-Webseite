# RealityForge-Wortzeichen

Die wiederverwendbare SVG-Komponente liegt in `assets/reality-forge-logo.js`.
Ihre vollständige Konfiguration für diese Website steht in
`assets/reality-forge-logo-config.js`. Einstellungen dort ändern, nicht direkt
in der Komponente.

## Schriften

`fontFinal` steuert die fertige **RealityForge**-Wortmarke. `fontCode` steuert
die vorübergehende, monospaced gesetzte Eingabe von **Forge**. Die zugehörigen
Schriftschnitte sind `weightFinal` und `weightCode`.

Am Beginn von `assets/reality-forge-logo-config.js` befindet sich ein klar
markierter Adobe-Fonts-Platzhalter. Sobald eine Adobe-Web-Project-CSS-URL und
der veröffentlichte Familienname vorliegen:

1. Den gelieferten Stylesheet-`<link>` an der markierten Stelle in `index.html` einfügen.
2. `adobeFinalFamily` in der Konfigurationsdatei auf die gelieferte CSS-Familie setzen.

Es wird keine Adobe-Kit-ID vorausgesetzt und keine Adobe-Schriftdatei selbst
gehostet. Bis dahin verwendet das Wortzeichen robuste System-Fallbacks.

## Animation anpassen

Alle Einstellungen stehen im einen Objekt `RealityForgeLogoSettings`:

- Typografie: `fontFinal`, `fontCode`, Schriftschnitte, Größe, Laufweite und Farben.
- Zeitablauf: `portalDraw` bis `holdDur`, `durMult`, `speed` und `loop`.
- Portal und Scan: `portalColor`, `glow*`, `scan*`, `lineWidth` und `dissolve`.
- Partikel: `pOn`, `pCount`, `pColor` und die weiteren `p*`-Werte.
- Bewegung: `reducedMotion`.

`script.js` verwendet diese Einstellungen auf der Startseite. Die Animation
läuft bei jedem Neuladen erneut. Bei `prefers-reduced-motion: reduce` wird die
Endfassung sofort angezeigt.

## Statische Fallbacks

Kopf- und Fußzeile verwenden bewusst das statische Wortzeichen. Im Hero-Bereich
gibt es zusätzlich einen sichtbaren HTML-Fallback für Browser ohne JavaScript.
Für eine statische Darstellung per JavaScript nach dem Laden der Komponente:
`document.querySelector('reality-forge-logo').showFinal()`.

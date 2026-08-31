# Vollständige Header-Server – Generierungsprotokoll

Modus: integrierte Bildgenerierung (Imagegen), zwei einzelne Generierungen; kein CLI/API-Fallback.

Verwendete Dateien:

- [Linker Server](</Users/ericosterwald/Erics AI Space/RealityForge/AiService-Webseite/assets/hero-server-left-v2.png>) – 793 × 1983 Pixel
- [Rechter Server](</Users/ericosterwald/Erics AI Space/RealityForge/AiService-Webseite/assets/hero-server-right-v2.png>) – 793 × 1983 Pixel

Die PNGs sind unveränderte Generierungsergebnisse mit schwarzem Hintergrund, keine transparenten PNGs. Native CSS-Konturen blenden die Außenfläche auf der Website aus. Vollständige Gehäuse mit Rückkanten, Seitenwänden, Sockeln und Füßen; keine an den Bildrändern angeschnittenen Objekte. Die Vorlagengrafik `hero-server-racks.png` bleibt erhalten, ist aber nicht mehr im Header eingebunden.

## Linker Server – verwendeter Prompt

```text
Use case: product-mockup
Asset type: ONE standalone left-hand server cabinet bitmap for a premium dark AI-service website hero.
Input images: Image 1 is ONLY a style/material/lighting reference. Do not reuse its landscape layout, two-rack composition, cropping, or cut-off sidewalls.

Scene/backdrop: perfectly uniform pure-black (#000000) background throughout. No setting, no floor plane, no ground shadow, no reflected floor, no fog, no ambient haze, no light spill or glow outside the object. Do not simulate transparency and do not draw any checkerboard.

Subject: one complete freestanding full-height 42U server rack cabinet, matte-black/dark-charcoal metal, highly detailed realistic stacked server/drive bays and subtle vents. It must be a real fully enclosed deep rectangular 3D cabinet, not a front panel, thin facade or cutaway. Show its complete broad LEFT outer sidewall, complete rear-left vertical edge, complete top surface, full bottom plinth and small feet. The visible left sidewall occupies approximately 25–30 percent of the projected cabinet width, with unmistakable physical depth. The front occupies the right portion of the object and faces diagonally toward viewer-right, inward when placed on the LEFT side of a webpage. We are looking at its front and its LEFT side, not its right side. The far rear-left vertical edge must be fully inside the image and clearly delineated by a restrained dim violet rim.

Style/medium: premium photorealistic 3D product rendering. Preserve the reference's restrained dark charcoal materials, refined dim violet indicator LEDs and subtle purple edge highlights. No bright neon, no saturated luminous bars. Keep all physical outer edges discernible from the black background without becoming bright.

Composition/framing: tall portrait canvas, 2:5 aspect ratio, approximately 640 by 1600. Single cabinet centered horizontally and vertically, complete full-object catalogue framing. Cabinet occupies approximately 88 percent of the image height and width, with at least 6 percent empty black margin on ALL FOUR sides. Nothing may touch or be cropped by any canvas edge. Restrained three-quarter camera angle, straight verticals, slight view of the top. The entire top, sidewall, rear edge, front, plinth, and feet fit comfortably inside the frame.

Constraints: exactly one cabinet; no second rack; no surrounding objects; no environment; no text, labels, brands, logos, watermark, cables extending outside, checkerboard or border. MOST IMPORTANT: fully complete freestanding cabinet silhouette with substantial visible left-side depth, never clipped at the outer left or bottom.
```

## Rechter Server – verwendeter Prompt

```text
Use case: product-mockup.
Asset type: isolated full-height server-cabinet asset for the RIGHT side of a dark website hero.
Input image 1 is STYLE REFERENCE ONLY: match its sophisticated near-black charcoal metal, restrained dim violet highlights, and detailed server bays. Do not reproduce its two-rack composition or its cropped edges.
Create ONE complete freestanding 42U server cabinet. The entire cabinet must be visible: top surface, front frame, full broad RIGHT sidewall, back-right vertical edge, bottom plinth and feet. This is a genuinely deep solid 3D cuboid rack, never a flat facade or thin vertical slice.
Orientation: restrained three-quarter view, its FRONT faces diagonally toward viewer-LEFT, inward toward the website center. The cabinet's broad RIGHT outer side panel is visible on image-right and occupies approximately 25–30 percent of the projected cabinet width. The far rear-right edge of this full side panel must remain clearly defined from top to bottom. Straight verticals, slight top surface visible, natural tall 42U proportions, no exaggerated perspective.
Front details: realistic stacked black server units, drive bays, handles, ventilation grilles, a few tiny dim violet status LEDs, refined physical metal construction. Matte black/charcoal panels with subtle material texture.
Lighting: low-key violet rim lighting and gentle violet grazing light exactly in the reference's restrained mood, plus just enough neutral fill to read the complete sidewall, top and feet. All physical outer edges, including rear-right edge and bottom feet, must be visibly distinguishable from pure black. No bright neon.
Canvas/framing: portrait 2:5 aspect ratio, ideally 640 by 1600. Center the single cabinet with approximately 6 percent clear margin on EVERY canvas edge; total cabinet about 88 percent of canvas height and projected width. Do not crop any part. No object touching the canvas boundary. Camera pulled back to fit the whole object completely.
Backdrop: perfectly uniform solid pure BLACK RGB(0,0,0) everywhere outside the object. No floor, no environmental setting, no cast shadow, no glow or haze outside the cabinet, no gradient, no checkerboard.
No text, no logo, no watermark, no extra objects. Produce exactly ONE image.
```

## Sichtprüfung der erzeugten Grafiken

Beide Gehäuse sind vollständig und räumlich geschlossen, ihre Rückkanten und Füße klar sichtbar. Die Seitenflächen sind breiter als im Prompt angefragt (links etwa 48 %, rechts etwa 38 % der projizierten Gehäusebreite). Die Kameraposition zeigt jeweils die vollständige obere Rahmenkante, aber keine deutlich sichtbare Deckfläche. Diese Varianten werden wegen ihrer vollständigen Gehäusetiefe und passenden Ausrichtung verwendet.

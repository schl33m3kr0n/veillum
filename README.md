# Vellum

Vellum is a page studio for type, drawing, photographs, and motion. Open a spread, write on it, mark it up, develop a picture, then export a raster or SVG.

## Run locally

```bash
npm install
npm run dev
```

The app listens on [http://127.0.0.1:4781](http://127.0.0.1:4781).

## What you can do

**Type.** Cut, copy, paste, undo, and redo. Size, color, highlighter, orientation, headers and footers, line spacing, letter spacing, text-box anchoring, a bundled type library (including Avenir, Futura, Century Gothic, Calisto, Bodoni, Cooper Black, Montserrat, Oswald, Barlow Condensed, Impact, Campfire, and Flames), plus import of a .ttf/.otf/.woff you own. Bold/italic/underline/strikethrough, super/subscript, kerning, ligatures, bullets, numbered lists, and capitalization.

**Arrange.** Ruler, indent, page margins, and box alignment. Select any object for corner circles, edge stretch handles, and a pastel-red rotate handle. Drag to snap to page center, margins, and other objects. Align to the page, the margin box, or the selection, and distribute three or more objects. Square or triangle grid, plus perspective on a layer.

**Draw.** Pencil, pen, and highlighter, plus a Shapes window. Selected shapes keep yellow diamonds for corner radius, star inner radius, and arrowhead. Fill and stroke each have a no-color option.

**Photographs.** Drop a JPEG/PNG/WebP, or a camera RAW (DNG, CR2, NEF, ARW, and similar) — Vellum reads the embedded preview and opens a wider RAW workspace. Exposure, brightness, contrast, shadows, highlights, saturation, temperature, tint, sepia, sharpness, blur, warmth, and Instant Alpha (click a color to punch it out).

**Color.** Wheel, hex field, highlighter swatch, recent colors, and named palettes.

**Layers.** Order, lock, hide, blending modes, opacity, transparency, masks (paint a keep-region), borders.

**Motion.** Add keyframes for position, scale, rotation, and opacity. Play interpolates along the timeline.

**Output.** Export PNG, JPEG, WebP, SVG, or a Vellum JSON project. Rasterize flattens the page to a single bitmap layer.

## Shortcuts

| Key | Action |
| --- | --- |
| V | Select |
| T | Text |
| P / N / H | Pencil / Pen / Highlighter |
| S | Shape |
| B | Bezier |
| I | Eyedropper |
| M | Mask |
| Space | Pan |
| ⌘/Ctrl + scroll or pinch | Zoom toward the cursor |
| ⌘/Ctrl + / − | Zoom toward the pointer |
| ⌘/Ctrl Z | Undo |
| ⌘/Ctrl Shift Z or ⌘/Ctrl Y | Redo |
| ⌘/Ctrl C X V D | Copy / Cut / Paste / Duplicate |
| ⌘/Ctrl B I U | Bold / Italic / Underline |
| Delete | Remove layer |
| ] | Show / hide Inspect sidebar |

Double-click a text box to type. Drag images onto the page to place them.

**Symbol die.** Open [http://127.0.0.1:4781/die](http://127.0.0.1:4781/die) (or Die in the studio header). Faces: point (1), pair (2), triangle (3), square (4), star (5), hexagon (6). Click the cube to roll.



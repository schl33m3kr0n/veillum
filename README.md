# veillum

veillum is a page studio for type, drawing, photographs, and motion. Open a spread, write on it, mark it up, develop a picture, then export a raster or SVG.

## Run locally

```bash
npm install
npm run dev
```

The app listens on [http://127.0.0.1:4781](http://127.0.0.1:4781). A start screen asks for a blank size (print, screen, social) or a template. **New** in the header (⌘/Ctrl N) opens it again.

## What you can do

**Type.** Cut, copy, paste, undo, and redo. Select a text box for a floating bar above it: font, size, weight, decoration, alignment, and highlighter (toggle plus color). Double-click to edit in place. Size, color, orientation, headers and footers, line spacing, letter spacing, text-box anchoring, a bundled type library (including Avenir, Futura, Century Gothic, Calisto, Bodoni, Cooper Black, Montserrat, Oswald, Barlow Condensed, Impact, Campfire, and Flames), plus import of a .ttf/.otf/.woff you own. Bold/italic/underline/strikethrough, super/subscript, kerning, ligatures, bullets, numbered lists, and capitalization.

**Arrange.** Ruler, indent, page margins, and box alignment. Select any object for corner circles, edge stretch handles, and a pastel-red rotate handle. Drag to snap to page center, margins, other objects, and matching widths or heights. Moving or transforming an object records one undo step when you release the pointer. Align to the page, the margin box, or the selection, match width or height, and distribute three or more objects. Combine two or more filled shapes with Unite, Subtract, Intersect, or Exclude (Pathfinder-style) to make one fillable outline. Square, triangle, or radial grid, plus perspective on a layer.

**Draw.** Pencil, pen, and highlighter, plus an Elements library (circle, square, rectangle, ellipse, and other basics, frames, marks, badges, nature icons, and items you save). Path-based marks place as live SVG — fill, stroke, and SVG export stay vector. Click to place, or drag a basic onto the page. A pie chart in Basics has an adjustable wedge (slider or yellow handle). Selected shapes keep yellow diamonds for corner radius, star inner radius, arrowhead, and pie wedge. Fill and stroke each have a no-color option.

**Photographs.** Drop a JPEG/PNG/WebP, or a camera RAW (DNG, CR2, NEF, ARW, and similar) — veillum reads the embedded preview and opens a wider RAW workspace. Exposure, brightness, contrast, shadows, highlights, saturation, temperature, tint, sepia, sharpness, blur, warmth, and Instant Alpha (click a color to punch it out).

**Color.** I opens Color: a dark panel with the wheel, hex, highlighter, recent swatches, and grouped palettes. Hover the page for a pixel magnifier; click to sample. Shape fills include solid, linear, radial, diamond, angular, and reflect — shown as previews — with two to five gradient colors whose lengths you can adjust (even by default).

**Layers.** Order, lock, hide, blending modes, opacity, transparency, masks (paint a keep-region), borders.

**Motion.** Add keyframes for position, scale, rotation, and opacity. Play interpolates along the timeline.

**Output.** Export PNG, JPEG, WebP, SVG, or a veillum JSON project. Rasterize flattens the page to a single bitmap layer.

## Shortcuts

| Key | Action |
| --- | --- |
| V | Select |
| T | Text |
| P / N / H | Pencil / Pen / Highlighter |
| S | Elements |
| B | Bezier |
| I | Color |
| M | Mask |
| Space | Pan |
| F | Full screen |
| Scroll or pinch | Zoom toward the cursor |
| Shift-scroll | Pan |
| ⌘/Ctrl + / − | Zoom toward the pointer |
| ⌘/Ctrl N | New page / templates |
| ⌘/Ctrl Z | Undo |
| ⌘/Ctrl Shift Z or ⌘/Ctrl Y | Redo |
| ⌘/Ctrl C X V D | Copy / Cut / Paste / Duplicate |
| ⌘/Ctrl B I U | Bold / Italic / Underline (or Unite if two+ shapes are selected) |
| Delete | Remove layer |
| ] | Show / hide Inspect sidebar |
| [ | Show / hide Animation panel |

Double-click a text box to type. Drag images onto the page to place them. In Select, drag on empty canvas to draw a selection box; hold Shift to add to the current selection.

**Symbol die.** Open [http://127.0.0.1:4781/die](http://127.0.0.1:4781/die) (or Die in the studio header). Faces: point (1), pair (2), triangle (3), square (4), star (5), hexagon (6). Click the cube to roll.



# veillum

veillum is a page studio for type, drawing, photographs, and motion. Open a spread, write on it, mark it up, develop a picture, then export a raster or SVG.

## Run locally

```bash
npm install
npm run dev
```

The app listens on [http://127.0.0.1:4781](http://127.0.0.1:4781). **Save** (⌘/Ctrl S) stores the page on this site under New → On this site. **Save as file…** / ⌘⇧S writes a `.veillum` file on disk; **Open** reads one. Templates show a live thumbnail. The current page also autosaves in this browser.

## What you can do

**Type.** Cut, copy, paste, undo, and redo. Double-click a text box to edit, then select characters — font, size, color, weight, decoration, and highlighter apply only to that selection. Alignment stays on the whole box. A circular color chip sits between size and bold; hover the highlighter to pick a marker color.

**Arrange.** Ruler, indent, page margins you can hide, and box alignment. Flip a selection horizontally or vertically from the header. Select any object for corner circles, edge stretch handles, and a pastel-red rotate handle. Lines and arrows also have yellow start and end handles — drag a tip to aim them (Shift snaps to 22.5°). Drag to snap to page center, margins, other objects, and matching widths or heights. Moving or transforming an object records one undo step when you release the pointer. Align to the page, the margin box, or the selection, match width or height, and distribute three or more objects. Group objects so they select and move together (⌘/Ctrl G, ⌘/Ctrl Shift G to ungroup). Combine two or more filled shapes with Unite, Subtract, Intersect, or Exclude (Pathfinder-style) to make one filled outline with stroke. Square, triangle, or radial grid, plus perspective on a layer.

**Draw.** Pencil, pen, highlighter, and a compass that stays on the page: drag the needle to move it, drag the pencil to set the radius, press anywhere else and drag to mark an arc. An Elements library (circle, rectangle, and other basics, marks, badges, nature icons, and items you save). Selected elements have fill, stroke, and opacity in Inspect. Path-based marks place as live SVG — fill, stroke, and SVG export stay vector. Click to place, or drag a basic onto the page. A pie chart in Basics has an adjustable wedge (slider or yellow handle). Selected shapes keep yellow diamonds for corner radius, star inner radius, arrowhead, and pie wedge. Fill and stroke each have a no-color option.

**Photographs.** Drop a JPEG/PNG/WebP, or a camera RAW (DNG, CR2, NEF, ARW, and similar) — veillum reads the embedded preview and opens a wider RAW workspace. Exposure, brightness, contrast, shadows, highlights, saturation, temperature, tint, sepia, sharpness, blur, warmth, Remove background (cuts the subject free; restore or undo to reverse), and Instant Alpha (click a color to punch it out).

**Color.** I opens Color: a dark panel with the wheel, hex, highlighter, recent swatches, and grouped palettes. Hover the page for a pixel magnifier; click to sample. Shape fills include solid, linear, radial, diamond, angular, and reflect — shown as previews — with two to five gradient colors whose lengths you can adjust (even by default).

**Layers.** Order, lock, hide, opacity, blending modes, transparency, masks (paint a keep-region), borders.

**Motion.** Add keyframes for position, scale, rotation, and opacity. Play interpolates along the timeline.

**Output.** **Save** stores the page on this site (New → On this site). Save as file… writes a `.veillum` on disk. Export PNG, JPEG, WebP, or SVG. Rasterize flattens the page to a single bitmap layer.

## Shortcuts

| Key | Action |
| --- | --- |
| V | Select |
| T | Text |
| P / N / H | Pencil / Pen / Highlighter |
| S | Elements |
| C | Compass |
| B | Bezier |
| I | Color |
| M | Mask |
| Space | Pan |
| F | Full screen |
| Pinch or ⌘/Ctrl-scroll | Zoom toward the cursor |
| Two-finger drag | Pan |
| ⌘/Ctrl + / − | Zoom toward the pointer |
| ⌘/Ctrl N | New page / templates |
| ⌘/Ctrl O | Open .veillum file |
| ⌘/Ctrl S | Save on this site |
| ⌘/Ctrl Shift S | Save as a disk file |
| ⌘/Ctrl Z | Undo |
| ⌘/Ctrl Shift Z or ⌘/Ctrl Y | Redo |
| ⌘/Ctrl C X V D | Copy / Cut / Paste / Duplicate |
| ⌘/Ctrl G | Group |
| ⌘/Ctrl Shift G | Ungroup |
| ⌘/Ctrl B I U | Bold / Italic / Underline (or Unite if two+ shapes are selected) |
| Delete | Remove layer |
| ] | Show / hide Inspect sidebar |
| [ | Show / hide Animation panel |

Double-click a text box to type. Drag images onto the page to place them. In Select, drag on empty canvas to draw a selection box; hold Shift to add to the current selection.

**Symbol die.** Open [http://127.0.0.1:4781/die](http://127.0.0.1:4781/die) (or Die in the studio header). Faces: point (1), pair (2), triangle (3), square (4), star (5), hexagon (6). Click the cube to roll.



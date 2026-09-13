import { createId } from "./ids";
import { flipLayer, layerCenter, type BoxLayer } from "./transform";
import type { Layer, Page, SymmetryMode } from "./types";

export const SYMMETRY_FOLDS = [2, 3, 4, 5, 6, 8, 12] as const;

const SNAP = 14;

export function symmetryMode(page: Page): SymmetryMode {
  const mode = page.symmetry?.mode;
  if (
    mode === "horizontal" ||
    mode === "vertical" ||
    mode === "quad" ||
    mode === "radial"
  ) {
    return mode;
  }
  return "none";
}

export function symmetryFolds(page: Page): number {
  return Math.max(2, Math.round(page.symmetry?.folds ?? 6));
}

export function pageCenter(page: Pick<Page, "width" | "height">) {
  return { x: page.width / 2, y: page.height / 2 };
}

export function symmetryGuideLines(page: Page): number[][] {
  const mode = symmetryMode(page);
  if (mode === "none") return [];
  const { x: cx, y: cy } = pageCenter(page);
  const w = page.width;
  const h = page.height;
  if (mode === "horizontal") return [[cx, 0, cx, h]];
  if (mode === "vertical") return [[0, cy, w, cy]];
  if (mode === "quad") return [[cx, 0, cx, h], [0, cy, w, cy]];
  const n = symmetryFolds(page);
  const reach = Math.hypot(cx, cy);
  const lines: number[][] = [];
  const count = n % 2 === 0 ? n / 2 : n;
  for (let i = 0; i < count; i++) {
    const a = (i / n) * Math.PI * 2;
    lines.push([
      cx - Math.cos(a) * reach,
      cy - Math.sin(a) * reach,
      cx + Math.cos(a) * reach,
      cy + Math.sin(a) * reach,
    ]);
  }
  return lines;
}

function polar(cx: number, cy: number, angle: number, r: number) {
  return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
}

export type SymmetryHit = {
  x: number;
  y: number;
  guides: {
    axis: "x" | "y" | "radial" | "ring";
    pos: number;
    cx?: number;
    cy?: number;
  }[];
};

export function snapPointToSymmetry(
  x: number,
  y: number,
  page: Page,
): SymmetryHit | null {
  if (!page.symmetry?.snap) return null;
  const mode = symmetryMode(page);
  if (mode === "none") return null;
  const { x: cx, y: cy } = pageCenter(page);
  const cands: SymmetryHit[] = [
    {
      x: cx,
      y: cy,
      guides: [
        { axis: "x", pos: cx },
        { axis: "y", pos: cy },
      ],
    },
  ];
  if (mode === "horizontal" || mode === "quad") {
    cands.push({ x: cx, y, guides: [{ axis: "x", pos: cx }] });
  }
  if (mode === "vertical" || mode === "quad") {
    cands.push({ x, y: cy, guides: [{ axis: "y", pos: cy }] });
  }
  if (mode === "radial") {
    const dx = x - cx;
    const dy = y - cy;
    const r = Math.hypot(dx, dy);
    const a = r < 0.5 ? 0 : Math.atan2(dy, dx);
    const aStep = (Math.PI * 2) / symmetryFolds(page);
    const na = Math.round(a / aStep) * aStep;
    const onRay = polar(cx, cy, na, r);
    cands.push({
      x: onRay.x,
      y: onRay.y,
      guides: [{ axis: "radial", pos: na, cx, cy }],
    });
  }
  let best: SymmetryHit | null = null;
  let bestD = SNAP;
  for (const c of cands) {
    const d = Math.hypot(c.x - x, c.y - y);
    if (d <= bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
}

/** Other images of a point under the current symmetry (not including itself). */
export function symmetryMates(
  point: { x: number; y: number },
  page: Page,
): { x: number; y: number }[] {
  const mode = symmetryMode(page);
  if (mode === "none" || !page.symmetry?.snap) return [];
  const { x: cx, y: cy } = pageCenter(page);
  const { x, y } = point;
  if (mode === "horizontal") return [{ x: 2 * cx - x, y }];
  if (mode === "vertical") return [{ x, y: 2 * cy - y }];
  if (mode === "quad") {
    return [
      { x: 2 * cx - x, y },
      { x, y: 2 * cy - y },
      { x: 2 * cx - x, y: 2 * cy - y },
    ];
  }
  const n = symmetryFolds(page);
  const mates: { x: number; y: number }[] = [];
  for (let i = 1; i < n; i++) {
    const rad = ((i / n) * 360 * Math.PI) / 180;
    const dx = x - cx;
    const dy = y - cy;
    mates.push({
      x: cx + dx * Math.cos(rad) - dy * Math.sin(rad),
      y: cy + dx * Math.sin(rad) + dy * Math.cos(rad),
    });
  }
  return mates;
}

function placeCenter<T extends BoxLayer>(layer: T, nx: number, ny: number): T {
  const c = layerCenter(layer);
  return { ...layer, x: layer.x + (nx - c.x), y: layer.y + (ny - c.y) };
}

function freshCopy(layer: Layer, suffix: string): Layer {
  return {
    ...structuredClone(layer),
    id: createId(),
    name: `${layer.name} ${suffix}`,
    groupId: null,
  };
}

export function mirrorLayer<T extends Layer>(
  layer: T,
  page: Page,
  axis: "horizontal" | "vertical",
): T {
  const { x: cx, y: cy } = pageCenter(page);
  const c = layerCenter(layer);
  if (axis === "horizontal") {
    return placeCenter(flipLayer(layer, "horizontal"), 2 * cx - c.x, c.y);
  }
  return placeCenter(flipLayer(layer, "vertical"), c.x, 2 * cy - c.y);
}

export function mirrorCopy(layer: Layer, page: Page, axis: "horizontal" | "vertical"): Layer {
  const suffix = axis === "horizontal" ? "L–R" : "T–B";
  return mirrorLayer(freshCopy(layer, suffix), page, axis);
}
export function symmetricCopies(layer: Layer, page: Page): Layer[] {
  const mode = symmetryMode(page);
  if (mode === "none") return [];
  const { x: cx, y: cy } = pageCenter(page);
  const c = layerCenter(layer);
  const out: Layer[] = [];
  if (mode === "horizontal" || mode === "quad") {
    out.push(
      placeCenter(
        flipLayer(freshCopy(layer, "L–R"), "horizontal"),
        2 * cx - c.x,
        c.y,
      ),
    );
  }
  if (mode === "vertical" || mode === "quad") {
    out.push(
      placeCenter(
        flipLayer(freshCopy(layer, "T–B"), "vertical"),
        c.x,
        2 * cy - c.y,
      ),
    );
  }
  if (mode === "quad") {
    const both = flipLayer(
      flipLayer(freshCopy(layer, "180"), "horizontal"),
      "vertical",
    );
    out.push(placeCenter(both, 2 * cx - c.x, 2 * cy - c.y));
  }
  if (mode === "radial") {
    const n = symmetryFolds(page);
    for (let i = 1; i < n; i++) {
      const deg = (i / n) * 360;
      const rad = (deg * Math.PI) / 180;
      const nx = cx + (c.x - cx) * Math.cos(rad) - (c.y - cy) * Math.sin(rad);
      const ny = cy + (c.x - cx) * Math.sin(rad) + (c.y - cy) * Math.cos(rad);
      const copy = {
        ...freshCopy(layer, `·${i + 1}`),
        rotation: layer.rotation + deg,
      };
      out.push(placeCenter(copy, nx, ny));
    }
  }
  return out;
}

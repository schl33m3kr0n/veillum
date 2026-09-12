import type { Layer, Page } from "./types";
import { groupAabb, layerAabb } from "./transform";

export type SnapGuide = { axis: "x" | "y"; pos: number };

const THRESHOLD = 10;

function uniqueNear(values: number[], value: number, threshold: number): number | null {
  let best: number | null = null;
  let dist = threshold;
  for (const v of values) {
    const d = Math.abs(v - value);
    if (d <= dist) {
      dist = d;
      best = v;
    }
  }
  return best;
}

export function pageSnapLines(page: Page): { xs: number[]; ys: number[] } {
  const ml = page.margins.left;
  const mr = page.width - page.margins.right;
  const mt = page.margins.top;
  const mb = page.height - page.margins.bottom;
  return {
    xs: [0, page.width / 2, page.width, ml, (ml + mr) / 2, mr],
    ys: [0, page.height / 2, page.height, mt, (mt + mb) / 2, mb],
  };
}

export function snapDelta(
  moving: { left: number; right: number; top: number; bottom: number; cx: number; cy: number },
  others: Layer[],
  page: Page,
): { dx: number; dy: number; guides: SnapGuide[] } {
  const { xs, ys } = pageSnapLines(page);
  for (const layer of others) {
    const box = layerAabb(layer);
    xs.push(box.left, box.cx, box.right);
    ys.push(box.top, box.cy, box.bottom);
  }

  const movingXs = [
    { key: "left" as const, v: moving.left },
    { key: "cx" as const, v: moving.cx },
    { key: "right" as const, v: moving.right },
  ];
  const movingYs = [
    { key: "top" as const, v: moving.top },
    { key: "cy" as const, v: moving.cy },
    { key: "bottom" as const, v: moving.bottom },
  ];

  let dx = 0;
  let dy = 0;
  let bestX = THRESHOLD + 1;
  let bestY = THRESHOLD + 1;
  let gx: number | null = null;
  let gy: number | null = null;

  for (const edge of movingXs) {
    const hit = uniqueNear(xs, edge.v, THRESHOLD);
    if (hit === null) continue;
    const d = Math.abs(hit - edge.v);
    if (d < bestX) {
      bestX = d;
      dx = hit - edge.v;
      gx = hit;
    }
  }
  for (const edge of movingYs) {
    const hit = uniqueNear(ys, edge.v, THRESHOLD);
    if (hit === null) continue;
    const d = Math.abs(hit - edge.v);
    if (d < bestY) {
      bestY = d;
      dy = hit - edge.v;
      gy = hit;
    }
  }

  const guides: SnapGuide[] = [];
  if (gx !== null) guides.push({ axis: "x", pos: gx });
  if (gy !== null) guides.push({ axis: "y", pos: gy });
  return { dx, dy, guides };
}

export function snapMovingLayers(
  origins: { id: string; x: number; y: number }[],
  dx: number,
  dy: number,
  layers: Layer[],
  page: Page,
): { positions: Map<string, { x: number; y: number }>; guides: SnapGuide[] } {
  const proposed = origins.flatMap((o) => {
    const layer = layers.find((l) => l.id === o.id);
    return layer ? [{ ...layer, x: o.x + dx, y: o.y + dy }] : [];
  });
  const moving = groupAabb(proposed);
  const others = layers.filter((l) => !origins.some((o) => o.id === l.id) && l.visible);
  const snap = snapDelta(moving, others, page);
  const positions = new Map<string, { x: number; y: number }>();
  for (const o of origins) {
    positions.set(o.id, { x: o.x + dx + snap.dx, y: o.y + dy + snap.dy });
  }
  return { positions, guides: snap.guides };
}

import type { Layer, Page } from "./types";
import { groupAabb, layerAabb } from "./transform";

export type SnapGuide = {
  axis: "x" | "y";
  pos: number;
  span?: { start: number; end: number };
};

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

export function pageSizes(page: Page): { widths: number[]; heights: number[] } {
  const innerW = page.width - page.margins.left - page.margins.right;
  const innerH = page.height - page.margins.top - page.margins.bottom;
  return {
    widths: [page.width, innerW],
    heights: [page.height, innerH],
  };
}

function otherBoxes(others: Layer[]) {
  return others.map((layer) => {
    const box = layerAabb(layer);
    return {
      ...box,
      width: box.right - box.left,
      height: box.bottom - box.top,
    };
  });
}

function dimensionGuides(
  moving: { left: number; right: number; top: number; bottom: number },
  others: Layer[],
  page: Page,
): SnapGuide[] {
  const mw = moving.right - moving.left;
  const mh = moving.bottom - moving.top;
  const guides: SnapGuide[] = [];
  const sizes = pageSizes(page);
  const boxes = [
    ...otherBoxes(others),
    { left: 0, right: page.width, top: 0, bottom: page.height, width: page.width, height: page.height },
    {
      left: page.margins.left,
      right: page.width - page.margins.right,
      top: page.margins.top,
      bottom: page.height - page.margins.bottom,
      width: sizes.widths[1],
      height: sizes.heights[1],
    },
  ];

  const widthHits = boxes.filter((b) => Math.abs(b.width - mw) <= THRESHOLD);
  if (widthHits.length > 0) {
    guides.push({
      axis: "y",
      pos: moving.top - 12,
      span: { start: moving.left, end: moving.right },
    });
    for (const b of widthHits) {
      if (Math.abs(b.left - moving.left) < 0.5 && Math.abs(b.right - moving.right) < 0.5) {
        continue;
      }
      guides.push({
        axis: "y",
        pos: b.top - 12,
        span: { start: b.left, end: b.right },
      });
    }
  }

  const heightHits = boxes.filter((b) => Math.abs(b.height - mh) <= THRESHOLD);
  if (heightHits.length > 0) {
    guides.push({
      axis: "x",
      pos: moving.left - 12,
      span: { start: moving.top, end: moving.bottom },
    });
    for (const b of heightHits) {
      if (Math.abs(b.top - moving.top) < 0.5 && Math.abs(b.bottom - moving.bottom) < 0.5) {
        continue;
      }
      guides.push({
        axis: "x",
        pos: b.left - 12,
        span: { start: b.top, end: b.bottom },
      });
    }
  }

  return guides;
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
    { v: moving.left },
    { v: moving.cx },
    { v: moving.right },
  ];
  const movingYs = [
    { v: moving.top },
    { v: moving.cy },
    { v: moving.bottom },
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

  const snapped = {
    left: moving.left + dx,
    right: moving.right + dx,
    top: moving.top + dy,
    bottom: moving.bottom + dy,
    cx: moving.cx + dx,
    cy: moving.cy + dy,
  };
  const guides: SnapGuide[] = [];
  if (gx !== null) guides.push({ axis: "x", pos: gx });
  if (gy !== null) guides.push({ axis: "y", pos: gy });
  guides.push(...dimensionGuides(snapped, others, page));
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

export function snapAabbResize(
  box: { left: number; top: number; width: number; height: number },
  handle: string,
  others: Layer[],
  page: Page,
): { left: number; top: number; width: number; height: number; guides: SnapGuide[] } {
  const { xs, ys } = pageSnapLines(page);
  const sizes = pageSizes(page);
  const widths = [...sizes.widths];
  const heights = [...sizes.heights];
  for (const layer of others) {
    const b = layerAabb(layer);
    xs.push(b.left, b.cx, b.right);
    ys.push(b.top, b.cy, b.bottom);
    widths.push(b.right - b.left);
    heights.push(b.bottom - b.top);
  }

  let { left, top, width, height } = box;
  const right = left + width;
  const bottom = top + height;
  const moveW = handle.includes("e") || handle.includes("w");
  const moveH = handle.includes("n") || handle.includes("s");
  const guides: SnapGuide[] = [];

  if (moveW) {
    type Cand = { left: number; width: number; dist: number; edge?: number; size?: boolean };
    const cands: Cand[] = [];
    const sizeHit = uniqueNear(widths, width, THRESHOLD);
    if (sizeHit !== null) {
      const dist = Math.abs(sizeHit - width);
      if (handle.includes("e")) cands.push({ left, width: sizeHit, dist, size: true });
      else cands.push({ left: right - sizeHit, width: sizeHit, dist, size: true });
    }
    const edgePos = handle.includes("e") ? right : left;
    const edgeHit = uniqueNear(xs, edgePos, THRESHOLD);
    if (edgeHit !== null) {
      const dist = Math.abs(edgeHit - edgePos);
      if (handle.includes("e")) {
        cands.push({ left, width: Math.max(8, edgeHit - left), dist, edge: edgeHit });
      } else {
        cands.push({
          left: edgeHit,
          width: Math.max(8, right - edgeHit),
          dist,
          edge: edgeHit,
        });
      }
    }
    cands.sort((a, b) => {
      if (a.size !== b.size) return a.size ? -1 : 1;
      return a.dist - b.dist;
    });
    const best = cands[0];
    if (best) {
      left = best.left;
      width = best.width;
    }
    const newEdge = handle.includes("e") ? left + width : left;
    const aligned = uniqueNear(xs, newEdge, THRESHOLD);
    if (aligned !== null) guides.push({ axis: "x", pos: aligned });
  }

  if (moveH) {
    type Cand = { top: number; height: number; dist: number; edge?: number; size?: boolean };
    const cands: Cand[] = [];
    const sizeHit = uniqueNear(heights, height, THRESHOLD);
    if (sizeHit !== null) {
      const dist = Math.abs(sizeHit - height);
      if (handle.includes("s")) cands.push({ top, height: sizeHit, dist, size: true });
      else cands.push({ top: bottom - sizeHit, height: sizeHit, dist, size: true });
    }
    const edgePos = handle.includes("s") ? bottom : top;
    const edgeHit = uniqueNear(ys, edgePos, THRESHOLD);
    if (edgeHit !== null) {
      const dist = Math.abs(edgeHit - edgePos);
      if (handle.includes("s")) {
        cands.push({ top, height: Math.max(8, edgeHit - top), dist, edge: edgeHit });
      } else {
        cands.push({
          top: edgeHit,
          height: Math.max(8, bottom - edgeHit),
          dist,
          edge: edgeHit,
        });
      }
    }
    cands.sort((a, b) => {
      if (a.size !== b.size) return a.size ? -1 : 1;
      return a.dist - b.dist;
    });
    const best = cands[0];
    if (best) {
      top = best.top;
      height = best.height;
    }
    const newEdge = handle.includes("s") ? top + height : top;
    const aligned = uniqueNear(ys, newEdge, THRESHOLD);
    if (aligned !== null) guides.push({ axis: "y", pos: aligned });
  }

  guides.push(
    ...dimensionGuides(
      { left, right: left + width, top, bottom: top + height },
      others,
      page,
    ),
  );
  return { left, top, width, height, guides };
}

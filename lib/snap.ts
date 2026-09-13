import type { Layer, Page } from "./types";
import { gridLineCount, gridSpacing } from "./geometry";
import { groupAabb, layerAabb } from "./transform";

export type SnapGuide = {
  axis: "x" | "y" | "radial" | "ring";
  pos: number;
  span?: { start: number; end: number };
  cx?: number;
  cy?: number;
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
  const xs = [0, page.width / 2, page.width];
  const ys = [0, page.height / 2, page.height];
  if (page.marginsVisible !== false) {
    const ml = page.margins.left;
    const mr = page.width - page.margins.right;
    const mt = page.margins.top;
    const mb = page.height - page.margins.bottom;
    xs.push(ml, (ml + mr) / 2, mr);
    ys.push(mt, (mt + mb) / 2, mb);
  }
  if (page.grid.snap && page.grid.type === "square") {
    const step = gridSpacing(page.grid);
    for (let x = 0; x <= page.width; x += step) xs.push(x);
    for (let y = 0; y <= page.height; y += step) ys.push(y);
  }
  return { xs, ys };
}

function snapToTriangle(x: number, y: number, step: number) {
  const h = step * Math.sin(Math.PI / 3);
  const row = Math.round(y / h);
  const odd = Math.abs(row) % 2 === 1;
  const offset = odd ? step / 2 : 0;
  const col = Math.round((x - offset) / step);
  return { x: col * step + offset, y: row * h };
}

function polarPoint(cx: number, cy: number, angle: number, r: number) {
  return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
}

function snapToRadial(
  x: number,
  y: number,
  page: Page,
  threshold: number,
): { x: number; y: number; guides: SnapGuide[] } | null {
  const cx = page.width / 2;
  const cy = page.height / 2;
  const step = gridSpacing(page.grid);
  const spokes = gridLineCount(page.grid);
  const dx = x - cx;
  const dy = y - cy;
  const r = Math.hypot(dx, dy);
  const a = Math.atan2(dy, dx);
  const aStep = (Math.PI * 2) / spokes;
  const na = Math.round(a / aStep) * aStep;
  const nr = Math.round(r / step) * step;
  const spoke = polarPoint(cx, cy, na, r);
  const ring = polarPoint(cx, cy, a, nr);
  const both = polarPoint(cx, cy, na, nr);
  const cands = [
    { pt: both, spoke: true, ring: true },
    { pt: spoke, spoke: true, ring: false },
    { pt: ring, spoke: false, ring: true },
  ];
  let best: (typeof cands)[number] | null = null;
  let bestD = threshold;
  for (const c of cands) {
    const d = Math.hypot(c.pt.x - x, c.pt.y - y);
    if (d <= bestD) {
      bestD = d;
      best = c;
    }
  }
  if (!best) return null;
  const guides: SnapGuide[] = [];
  if (best.spoke) guides.push({ axis: "radial", pos: na, cx, cy });
  if (best.ring) guides.push({ axis: "ring", pos: nr, cx, cy });
  return { x: best.pt.x, y: best.pt.y, guides };
}

function snapCenterToGrid(
  x: number,
  y: number,
  page: Page,
): { x: number; y: number; guides: SnapGuide[] } | null {
  if (!page.grid.snap) return null;
  const step = gridSpacing(page.grid);
  if (page.grid.type === "triangle") {
    const pt = snapToTriangle(x, y, step);
    if (Math.hypot(pt.x - x, pt.y - y) > THRESHOLD) return null;
    return {
      ...pt,
      guides: [
        { axis: "x", pos: pt.x },
        { axis: "y", pos: pt.y },
      ],
    };
  }
  if (page.grid.type === "radial") return snapToRadial(x, y, page, THRESHOLD);
  return null;
}

/** Snap a free page point (line tips, compass, etc.) onto the active grid. */
export function snapPointToGrid(
  x: number,
  y: number,
  page: Page,
): { x: number; y: number; guides: SnapGuide[] } {
  if (!page.grid.snap) return { x, y, guides: [] };
  if (page.grid.type === "square") {
    const { xs, ys } = pageSnapLines(page);
    let nx = x;
    let ny = y;
    const guides: SnapGuide[] = [];
    const hx = uniqueNear(xs, x, THRESHOLD);
    const hy = uniqueNear(ys, y, THRESHOLD);
    if (hx !== null) {
      nx = hx;
      guides.push({ axis: "x", pos: hx });
    }
    if (hy !== null) {
      ny = hy;
      guides.push({ axis: "y", pos: hy });
    }
    return { x: nx, y: ny, guides };
  }
  const hit = snapCenterToGrid(x, y, page);
  return hit ?? { x, y, guides: [] };
}

export function pageSizes(page: Page): { widths: number[]; heights: number[] } {
  const widths = [page.width];
  const heights = [page.height];
  if (page.marginsVisible !== false) {
    widths.push(page.width - page.margins.left - page.margins.right);
    heights.push(page.height - page.margins.top - page.margins.bottom);
  }
  return { widths, heights };
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
  const boxes = [
    ...otherBoxes(others),
    { left: 0, right: page.width, top: 0, bottom: page.height, width: page.width, height: page.height },
  ];
  if (page.marginsVisible !== false) {
    boxes.push({
      left: page.margins.left,
      right: page.width - page.margins.right,
      top: page.margins.top,
      bottom: page.height - page.margins.bottom,
      width: page.width - page.margins.left - page.margins.right,
      height: page.height - page.margins.top - page.margins.bottom,
    });
  }

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

  const objectDist = gx !== null || gy !== null ? Math.hypot(dx, dy) : Infinity;
  const gridHit = snapCenterToGrid(moving.cx, moving.cy, page);
  const guides: SnapGuide[] = [];
  if (gridHit) {
    const gdx = gridHit.x - moving.cx;
    const gdy = gridHit.y - moving.cy;
    const gridDist = Math.hypot(gdx, gdy);
    if (gridDist <= objectDist) {
      dx = gdx;
      dy = gdy;
      guides.push(...gridHit.guides);
    }
  }
  if (guides.length === 0) {
    if (gx !== null) guides.push({ axis: "x", pos: gx });
    if (gy !== null) guides.push({ axis: "y", pos: gy });
  }

  const snapped = {
    left: moving.left + dx,
    right: moving.right + dx,
    top: moving.top + dy,
    bottom: moving.bottom + dy,
    cx: moving.cx + dx,
    cy: moving.cy + dy,
  };
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
  lockAspect = false,
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
    const sizeHit = lockAspect ? null : uniqueNear(widths, width, THRESHOLD);
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
    const sizeHit = lockAspect ? null : uniqueNear(heights, height, THRESHOLD);
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

  if (lockAspect && box.width > 0 && box.height > 0) {
    const ratio = box.width / box.height;
    const right = left + width;
    const bottom = top + height;
    const moveW = handle.includes("e") || handle.includes("w");
    const moveH = handle.includes("n") || handle.includes("s");
    if (moveW && !moveH) {
      height = Math.max(8, width / ratio);
      top = box.top + (box.height - height) / 2;
    } else if (moveH && !moveW) {
      width = Math.max(8, height * ratio);
      left = box.left + (box.width - width) / 2;
    } else if (Math.abs(width / Math.max(8, height) - ratio) > 0.002) {
      if (Math.abs(width - box.width) >= Math.abs(height - box.height)) {
        height = Math.max(8, width / ratio);
      } else {
        width = Math.max(8, height * ratio);
      }
      if (handle.includes("w")) left = right - width;
      if (handle.includes("n")) top = bottom - height;
    }
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

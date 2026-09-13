import type { Anchor, BezierPoint, DashStyle, Layer, Page } from "./types";
import { groupAabb, layerAabb } from "./transform";

export const ANCHOR_OFFSET: Record<Anchor, { x: number; y: number }> = {
  "top-left": { x: 0, y: 0 },
  "top-center": { x: 0.5, y: 0 },
  "top-right": { x: 1, y: 0 },
  "middle-left": { x: 0, y: 0.5 },
  center: { x: 0.5, y: 0.5 },
  "middle-right": { x: 1, y: 0.5 },
  "bottom-left": { x: 0, y: 1 },
  "bottom-center": { x: 0.5, y: 1 },
  "bottom-right": { x: 1, y: 1 },
};

export function resizeFromAnchor(
  layer: Layer,
  width: number,
  height: number,
  anchor: Anchor,
): { x: number; y: number; width: number; height: number } {
  const a = ANCHOR_OFFSET[anchor];
  return {
    x: layer.x - (width - layer.width) * a.x,
    y: layer.y - (height - layer.height) * a.y,
    width,
    height,
  };
}

export function dashArray(style: DashStyle, width: number): number[] {
  const w = Math.max(1, width);
  switch (style) {
    case "dash":
      return [w * 4, w * 2];
    case "dot":
      return [w, w * 1.8];
    case "dashdot":
      return [w * 4, w * 1.6, w, w * 1.6];
    default:
      return [];
  }
}

export function bezierPath(points: BezierPoint[], closed: boolean): string {
  if (points.length === 0) return "";
  const [first, ...rest] = points;
  let d = `M ${first.x} ${first.y}`;
  for (let i = 0; i < rest.length; i++) {
    const prev = i === 0 ? first : rest[i - 1];
    const curr = rest[i];
    d += ` C ${prev.x + prev.outX} ${prev.y + prev.outY} ${curr.x + curr.inX} ${curr.y + curr.inY} ${curr.x} ${curr.y}`;
  }
  if (closed && points.length >= 2) {
    const last = points[points.length - 1];
    d += ` C ${last.x + last.outX} ${last.y + last.outY} ${first.x + first.inX} ${first.y + first.inY} ${first.x} ${first.y} Z`;
  }
  return d;
}

export function boundsOfBezier(points: BezierPoint[], pad = 2): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  if (points.length === 0) return { x: 0, y: 0, width: 8, height: 1 };
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const add = (x: number, y: number) => {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  };
  for (const p of points) {
    add(p.x, p.y);
    add(p.x + p.inX, p.y + p.inY);
    add(p.x + p.outX, p.y + p.outY);
  }
  return {
    x: minX - pad,
    y: minY - pad,
    width: Math.max(8, maxX - minX + pad * 2),
    height: Math.max(8, maxY - minY + pad * 2),
  };
}

export function localizeBezier(points: BezierPoint[]): {
  points: BezierPoint[];
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const b = boundsOfBezier(points);
  return {
    x: b.x,
    y: b.y,
    width: b.width,
    height: b.height,
    points: points.map((p) => ({ ...p, x: p.x - b.x, y: p.y - b.y })),
  };
}

export function nearPoint(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  threshold = 12,
): boolean {
  return Math.hypot(ax - bx, ay - by) <= threshold;
}

export function boundsOfPoints(points: number[]): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  if (points.length < 2) return { x: 0, y: 0, width: 1, height: 1 };
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (let i = 0; i < points.length; i += 2) {
    minX = Math.min(minX, points[i]);
    maxX = Math.max(maxX, points[i]);
    minY = Math.min(minY, points[i + 1]);
    maxY = Math.max(maxY, points[i + 1]);
  }
  return {
    x: minX,
    y: minY,
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY),
  };
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function interpolatedLayer(
  layer: Layer,
  time: number,
  playing: boolean,
): Layer {
  if (!playing || layer.keyframes.length === 0) return layer;
  const frames = [...layer.keyframes].sort((a, b) => a.time - b.time);
  if (time <= frames[0].time) {
    const f = frames[0];
    return {
      ...layer,
      x: f.x,
      y: f.y,
      rotation: f.rotation,
      opacity: f.opacity,
      scaleX: f.scaleX,
      scaleY: f.scaleY,
    };
  }
  const last = frames[frames.length - 1];
  if (time >= last.time) {
    return {
      ...layer,
      x: last.x,
      y: last.y,
      rotation: last.rotation,
      opacity: last.opacity,
      scaleX: last.scaleX,
      scaleY: last.scaleY,
    };
  }
  let i = 0;
  while (i < frames.length - 1 && frames[i + 1].time < time) i++;
  const a = frames[i];
  const b = frames[i + 1];
  const t = (time - a.time) / Math.max(0.0001, b.time - a.time);
  const ease = t * t * (3 - 2 * t);
  return {
    ...layer,
    x: lerp(a.x, b.x, ease),
    y: lerp(a.y, b.y, ease),
    rotation: lerp(a.rotation, b.rotation, ease),
    opacity: lerp(a.opacity, b.opacity, ease),
    scaleX: lerp(a.scaleX, b.scaleX, ease),
    scaleY: lerp(a.scaleY, b.scaleY, ease),
  };
}

export type AlignMode =
  | "left"
  | "center"
  | "right"
  | "top"
  | "middle"
  | "bottom";

export type AlignTarget = "selection" | "page" | "margins";

export function alignFrame(
  page: { width: number; height: number; margins: { top: number; right: number; bottom: number; left: number } },
  layers: Layer[],
  target: AlignTarget,
): { left: number; right: number; top: number; bottom: number } {
  if (target === "page") {
    return { left: 0, right: page.width, top: 0, bottom: page.height };
  }
  if (target === "margins") {
    return {
      left: page.margins.left,
      right: page.width - page.margins.right,
      top: page.margins.top,
      bottom: page.height - page.margins.bottom,
    };
  }
  const box = groupAabb(layers);
  return { left: box.left, right: box.right, top: box.top, bottom: box.bottom };
}

export function alignLayers(
  layers: Layer[],
  mode: AlignMode,
  frame: { left: number; right: number; top: number; bottom: number },
): Layer[] {
  if (layers.length === 0) return layers;
  const cx = (frame.left + frame.right) / 2;
  const cy = (frame.top + frame.bottom) / 2;
  return layers.map((l) => {
    const box = layerAabb(l);
    switch (mode) {
      case "left":
        return { ...l, x: l.x + (frame.left - box.left) };
      case "right":
        return { ...l, x: l.x + (frame.right - box.right) };
      case "center":
        return { ...l, x: l.x + (cx - box.cx) };
      case "top":
        return { ...l, y: l.y + (frame.top - box.top) };
      case "bottom":
        return { ...l, y: l.y + (frame.bottom - box.bottom) };
      case "middle":
        return { ...l, y: l.y + (cy - box.cy) };
    }
  });
}

export function distributeLayers(layers: Layer[], axis: "horizontal" | "vertical"): Layer[] {
  if (layers.length < 3) return layers;
  const items = layers.map((l) => ({ layer: l, box: layerAabb(l) }));
  if (axis === "horizontal") {
    items.sort((a, b) => a.box.left - b.box.left);
    const first = items[0];
    const last = items[items.length - 1];
    const span = last.box.right - first.box.left;
    const total = items.reduce((sum, it) => sum + (it.box.right - it.box.left), 0);
    const gap = (span - total) / (items.length - 1);
    let cursor = first.box.left;
    return items.map((it, i) => {
      if (i === 0) {
        cursor = it.box.right + gap;
        return it.layer;
      }
      if (i === items.length - 1) return it.layer;
      const width = it.box.right - it.box.left;
      const next = { ...it.layer, x: it.layer.x + (cursor - it.box.left) };
      cursor += width + gap;
      return next;
    });
  }
  items.sort((a, b) => a.box.top - b.box.top);
  const first = items[0];
  const last = items[items.length - 1];
  const span = last.box.bottom - first.box.top;
  const total = items.reduce((sum, it) => sum + (it.box.bottom - it.box.top), 0);
  const gap = (span - total) / (items.length - 1);
  let cursor = first.box.top;
  return items.map((it, i) => {
    if (i === 0) {
      cursor = it.box.bottom + gap;
      return it.layer;
    }
    if (i === items.length - 1) return it.layer;
    const height = it.box.bottom - it.box.top;
    const next = { ...it.layer, y: it.layer.y + (cursor - it.box.top) };
    cursor += height + gap;
    return next;
  });
}

/** Density presets shared by square, triangle, and radial grids. */
export const GRID_LINE_COUNTS = [8, 12, 16, 18, 24, 36, 48, 72] as const;

export function gridLineCount(grid: Page["grid"] | undefined): number {
  const n = grid?.lines ?? 12;
  return Math.max(4, Math.round(n));
}

export function gridSpacing(grid: Page["grid"] | undefined): number {
  return Math.max(4, grid?.size ?? 24);
}

/** Cell size so `lines` divisions fit the shorter page edge. */
export function spacingFromLines(width: number, height: number, lines: number): number {
  const n = Math.max(4, Math.round(lines));
  return Math.max(4, Math.round(Math.min(width, height) / n));
}

export function squareGridLines(
  width: number,
  height: number,
  size: number,
): number[][] {
  const step = Math.max(4, size);
  const lines: number[][] = [];
  for (let x = 0; x <= width + 0.5; x += step) {
    lines.push([x, 0, x, height]);
  }
  for (let y = 0; y <= height + 0.5; y += step) {
    lines.push([0, y, width, y]);
  }
  return lines;
}

/** Liang–Barsky clip of a segment to [0,w] × [0,h]. */
function clipSegmentToRect(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  w: number,
  h: number,
): number[] | null {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let t0 = 0;
  let t1 = 1;
  const clip = (p: number, q: number) => {
    if (p === 0) return q >= 0;
    const r = q / p;
    if (p < 0) {
      if (r > t1) return false;
      if (r > t0) t0 = r;
    } else {
      if (r < t0) return false;
      if (r < t1) t1 = r;
    }
    return true;
  };
  if (
    clip(-dx, x1) &&
    clip(dx, w - x1) &&
    clip(-dy, y1) &&
    clip(dy, h - y1)
  ) {
    return [x1 + t0 * dx, y1 + t0 * dy, x1 + t1 * dx, y1 + t1 * dy];
  }
  return null;
}

export function triangleGridLines(
  width: number,
  height: number,
  size: number,
): number[][] {
  const step = Math.max(4, size);
  const row = (step * Math.sqrt(3)) / 2;
  const sqrt3 = Math.sqrt(3);
  const lines: number[][] = [];
  const add = (x1: number, y1: number, x2: number, y2: number) => {
    const clipped = clipSegmentToRect(x1, y1, x2, y2, width, height);
    if (clipped) lines.push(clipped);
  };

  for (let y = 0; y <= height + 0.5; y += row) {
    add(0, y, width, y);
  }

  const span = width + height * 2;
  for (let x0 = -span; x0 <= width + span; x0 += step) {
    add(x0 - span, -sqrt3 * span, x0 + span, sqrt3 * span);
    add(x0 - span, sqrt3 * span, x0 + span, -sqrt3 * span);
  }
  return lines;
}

export function radialGrid(
  width: number,
  height: number,
  size: number,
  lines = 12,
): { lines: number[][]; circles: { cx: number; cy: number; r: number }[] } {
  const cx = width / 2;
  const cy = height / 2;
  const maxR = Math.hypot(cx, cy);
  const step = Math.max(4, size);
  const circles: { cx: number; cy: number; r: number }[] = [];
  for (let r = step; r <= maxR + step; r += step) {
    circles.push({ cx, cy, r });
  }
  const spokes = Math.max(4, Math.round(lines));
  const rays: number[][] = [];
  for (let i = 0; i < spokes; i++) {
    const a = (i / spokes) * Math.PI * 2;
    rays.push([
      cx,
      cy,
      cx + Math.cos(a) * maxR,
      cy + Math.sin(a) * maxR,
    ]);
  }
  return { lines: rays, circles };
}

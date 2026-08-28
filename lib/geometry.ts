import type { Anchor, BezierPoint, DashStyle, Layer } from "./types";

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
  if (closed && points.length > 2) {
    const last = points[points.length - 1];
    d += ` C ${last.x + last.outX} ${last.y + last.outY} ${first.x + first.inX} ${first.y + first.inY} ${first.x} ${first.y} Z`;
  }
  return d;
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

export function alignLayers(layers: Layer[], mode: AlignMode): Layer[] {
  if (layers.length === 0) return layers;
  const xs = layers.map((l) => l.x);
  const ys = layers.map((l) => l.y);
  const rights = layers.map((l) => l.x + l.width * l.scaleX);
  const bottoms = layers.map((l) => l.y + l.height * l.scaleY);
  const minX = Math.min(...xs);
  const maxR = Math.max(...rights);
  const minY = Math.min(...ys);
  const maxB = Math.max(...bottoms);
  const cx = (minX + maxR) / 2;
  const cy = (minY + maxB) / 2;
  return layers.map((l) => {
    const w = l.width * l.scaleX;
    const h = l.height * l.scaleY;
    switch (mode) {
      case "left":
        return { ...l, x: minX };
      case "right":
        return { ...l, x: maxR - w };
      case "center":
        return { ...l, x: cx - w / 2 };
      case "top":
        return { ...l, y: minY };
      case "bottom":
        return { ...l, y: maxB - h };
      case "middle":
        return { ...l, y: cy - h / 2 };
    }
  });
}

export function triangleGridLines(
  width: number,
  height: number,
  size: number,
): number[][] {
  const lines: number[][] = [];
  const h = size * Math.sin(Math.PI / 3);
  for (let y = 0; y <= height + h; y += h) {
    lines.push([0, y, width, y]);
  }
  const angle = Math.PI / 3;
  const dx = size * Math.cos(angle);
  const dy = size * Math.sin(angle);
  const len = Math.hypot(width, height) * 2;
  for (let x = -height; x < width + height; x += size) {
    lines.push([x, 0, x + len * Math.cos(angle), len * Math.sin(angle)]);
    lines.push([x, 0, x + len * Math.cos(-angle), len * Math.sin(-angle)]);
  }
  void dx;
  void dy;
  return lines;
}

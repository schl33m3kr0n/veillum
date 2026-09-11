import type { ShapeKind, ShapeLayer } from "./types";

export const SHAPE_KINDS: { id: ShapeKind; label: string }[] = [
  { id: "rect", label: "Rectangle" },
  { id: "ellipse", label: "Ellipse" },
  { id: "triangle", label: "Triangle" },
  { id: "hexagon", label: "Polygon" },
  { id: "star", label: "Star" },
  { id: "line", label: "Line" },
  { id: "arrow", label: "Arrow" },
];

export function polygonPoints(
  w: number,
  h: number,
  sides: number,
  inset = 0,
): string {
  const n = Math.max(3, Math.round(sides));
  const cx = w / 2;
  const cy = h / 2;
  const rx = Math.max(1, w / 2 - inset);
  const ry = Math.max(1, h / 2 - inset);
  return Array.from({ length: n }, (_, i) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return `${cx + rx * Math.cos(a)},${cy + ry * Math.sin(a)}`;
  }).join(" ");
}

export function starPolygonPoints(
  w: number,
  h: number,
  points: number,
  innerRatio: number,
  inset = 0,
): string {
  const n = Math.max(3, Math.round(points));
  const cx = w / 2;
  const cy = h / 2;
  const outerX = Math.max(1, w / 2 - inset);
  const outerY = Math.max(1, h / 2 - inset);
  const ratio = Math.min(0.9, Math.max(0.08, innerRatio));
  const pts: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const a = -Math.PI / 2 + (Math.PI / n) * i;
    const outer = i % 2 === 0;
    const rx = outer ? outerX : outerX * ratio;
    const ry = outer ? outerY : outerY * ratio;
    pts.push(`${cx + rx * Math.cos(a)},${cy + ry * Math.sin(a)}`);
  }
  return pts.join(" ");
}

export function trianglePoints(w: number, h: number, inset = 0): string {
  return `${w / 2},${inset} ${w - inset},${h - inset} ${inset},${h - inset}`;
}

export function arrowGeometry(
  w: number,
  h: number,
  head: number,
): { x1: number; y1: number; x2: number; y2: number; points: string } {
  const size = Math.max(8, Math.min(head, w * 0.6, h));
  const y = h / 2;
  return {
    x1: 2,
    y1: y,
    x2: Math.max(4, w - size),
    y2: y,
    points: `${w - 1},${y} ${w - size},${y - size / 2} ${w - size},${y + size / 2}`,
  };
}

export function localToPage(
  layer: Pick<ShapeLayer, "x" | "y" | "rotation" | "scaleX" | "scaleY">,
  lx: number,
  ly: number,
): { x: number; y: number } {
  const rad = (layer.rotation * Math.PI) / 180;
  const x = lx * layer.scaleX;
  const y = ly * layer.scaleY;
  return {
    x: layer.x + x * Math.cos(rad) - y * Math.sin(rad),
    y: layer.y + x * Math.sin(rad) + y * Math.cos(rad),
  };
}

export function pageToLocal(
  layer: Pick<ShapeLayer, "x" | "y" | "rotation" | "scaleX" | "scaleY">,
  px: number,
  py: number,
): { x: number; y: number } {
  const dx = px - layer.x;
  const dy = py - layer.y;
  const rad = -(layer.rotation * Math.PI) / 180;
  const x = dx * Math.cos(rad) - dy * Math.sin(rad);
  const y = dx * Math.sin(rad) + dy * Math.cos(rad);
  return { x: x / (layer.scaleX || 1), y: y / (layer.scaleY || 1) };
}

export function rotateAroundCenter(
  layer: Pick<ShapeLayer, "x" | "y" | "width" | "height" | "rotation" | "scaleX" | "scaleY">,
  pageX: number,
  pageY: number,
): { x: number; y: number; rotation: number } {
  const cx = (layer.width * layer.scaleX) / 2;
  const cy = (layer.height * layer.scaleY) / 2;
  const old = (layer.rotation * Math.PI) / 180;
  const center = {
    x: layer.x + cx * Math.cos(old) - cy * Math.sin(old),
    y: layer.y + cx * Math.sin(old) + cy * Math.cos(old),
  };
  const deg = (Math.atan2(pageY - center.y, pageX - center.x) * 180) / Math.PI + 90;
  const neu = (deg * Math.PI) / 180;
  return {
    rotation: deg,
    x: center.x - (cx * Math.cos(neu) - cy * Math.sin(neu)),
    y: center.y - (cx * Math.sin(neu) + cy * Math.cos(neu)),
  };
}

export function resizeFromHandle(
  handle: "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w",
  localX: number,
  localY: number,
  origin: Pick<ShapeLayer, "x" | "y" | "width" | "height" | "rotation" | "scaleX" | "scaleY">,
  lockAspect: boolean,
): { x: number; y: number; width: number; height: number } {
  let width = origin.width;
  let height = origin.height;
  let ox = 0;
  let oy = 0;
  if (handle.includes("e")) width = Math.max(8, localX);
  if (handle.includes("s")) height = Math.max(8, localY);
  if (handle.includes("w")) {
    width = Math.max(8, origin.width - localX);
    ox = origin.width - width;
  }
  if (handle.includes("n")) {
    height = Math.max(8, origin.height - localY);
    oy = origin.height - height;
  }
  if (lockAspect && origin.width > 0 && origin.height > 0) {
    const ratio = origin.width / origin.height;
    const corner = handle.length === 2;
    if (corner) {
      if (width / height > ratio) height = width / ratio;
      else width = height * ratio;
      if (handle.includes("w")) ox = origin.width - width;
      if (handle.includes("n")) oy = origin.height - height;
    }
  }
  const page = localToPage(origin, ox, oy);
  return { x: page.x, y: page.y, width, height };
}

export function shapeSvgPoints(layer: Pick<ShapeLayer, "shape" | "width" | "height" | "strokeWidth" | "sides" | "starPoints" | "innerRatio" | "arrowHead">) {
  const w = Math.max(1, layer.width);
  const h = Math.max(1, layer.height);
  const pad = layer.strokeWidth / 2;
  const sides = layer.sides ?? 6;
  const starPts = layer.starPoints ?? 5;
  const inner = layer.innerRatio ?? 0.4;
  const head = layer.arrowHead ?? 16;
  return {
    w,
    h,
    pad,
    polygon:
      layer.shape === "hexagon"
        ? polygonPoints(w, h, sides, pad)
        : layer.shape === "star"
          ? starPolygonPoints(w, h, starPts, inner, pad)
          : layer.shape === "triangle"
            ? trianglePoints(w, h, pad)
            : null,
    arrow: layer.shape === "arrow" ? arrowGeometry(w, h, head) : null,
  };
}

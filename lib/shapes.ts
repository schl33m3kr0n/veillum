import type { ShapeKind, ShapeLayer } from "./types";
import {
  localToPage,
  pageToLocal,
  resizeFromHandle,
  rotateAroundCenter,
} from "./transform";

export { localToPage, pageToLocal, resizeFromHandle, rotateAroundCenter };

export const SHAPE_KINDS: { id: ShapeKind; label: string }[] = [
  { id: "rect", label: "Rectangle" },
  { id: "ellipse", label: "Ellipse" },
  { id: "triangle", label: "Triangle" },
  { id: "hexagon", label: "Polygon" },
  { id: "star", label: "Star" },
  { id: "line", label: "Line" },
  { id: "arrow", label: "Arrow" },
  { id: "pie", label: "Pie" },
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

/** Rebuild a line/arrow box so local (0, h/2)→(w, h/2) matches two page points. */
export function frameLineFromEndpoints(
  start: { x: number; y: number },
  end: { x: number; y: number },
  origin: Pick<ShapeLayer, "height" | "strokeWidth" | "arrowHead">,
  snapAngle = false,
): {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
} {
  let dx = end.x - start.x;
  let dy = end.y - start.y;
  let len = Math.hypot(dx, dy);
  if (snapAngle && len > 0.5) {
    const step = Math.PI / 8;
    const ang = Math.round(Math.atan2(dy, dx) / step) * step;
    dx = Math.cos(ang) * len;
    dy = Math.sin(ang) * len;
    len = Math.hypot(dx, dy);
  }
  const width = Math.max(8, len);
  const rotation = (Math.atan2(dy, dx) * 180) / Math.PI;
  const height = Math.max(
    origin.height,
    origin.strokeWidth + 8,
    (origin.arrowHead ?? 0) + 4,
    16,
  );
  const rad = (rotation * Math.PI) / 180;
  const hy = height / 2;
  return {
    x: start.x + hy * Math.sin(rad),
    y: start.y - hy * Math.cos(rad),
    width,
    height,
    rotation,
    scaleX: 1,
    scaleY: 1,
  };
}

export function clampWedge(value: number): number {
  if (!Number.isFinite(value)) return 0.38;
  return Math.min(0.98, Math.max(0.02, value));
}

export function pieGeometry(
  w: number,
  h: number,
  fraction: number,
  inset = 0,
): {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  d: string;
  handleX: number;
  handleY: number;
  full: boolean;
} {
  const cx = w / 2;
  const cy = h / 2;
  const rx = Math.max(1, w / 2 - inset);
  const ry = Math.max(1, h / 2 - inset);
  const wedge = clampWedge(fraction);
  const start = -Math.PI / 2;
  const sweep = wedge * Math.PI * 2;
  const end = start + sweep;
  const x0 = cx + rx * Math.cos(start);
  const y0 = cy + ry * Math.sin(start);
  const x1 = cx + rx * Math.cos(end);
  const y1 = cy + ry * Math.sin(end);
  const large = sweep > Math.PI ? 1 : 0;
  return {
    cx,
    cy,
    rx,
    ry,
    d: `M ${cx} ${cy} L ${x0} ${y0} A ${rx} ${ry} 0 ${large} 1 ${x1} ${y1} Z`,
    handleX: x1,
    handleY: y1,
    full: wedge >= 0.97,
  };
}

export function wedgeFromLocal(x: number, y: number, cx: number, cy: number): number {
  let ang = Math.atan2(y - cy, x - cx) + Math.PI / 2;
  if (ang < 0) ang += Math.PI * 2;
  if (ang >= Math.PI * 2) ang -= Math.PI * 2;
  return clampWedge(ang / (Math.PI * 2));
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

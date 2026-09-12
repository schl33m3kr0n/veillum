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

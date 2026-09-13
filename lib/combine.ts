import {
  difference,
  intersection,
  union,
  xor,
  type MultiPolygon,
  type Pair,
  type Polygon,
} from "polygon-clipping";
import { bezierPath } from "./geometry";
import { pieGeometry, shapeSvgPoints } from "./shapes";
import { localToPage } from "./transform";
import type { BezierLayer, Layer, ShapeLayer, SvgNode } from "./types";
import { svgMarkViewBox } from "./svg-mark";
import { createShapeLayer } from "./document";

export type CombineMode = "unite" | "subtract" | "intersect" | "exclude";

export function isCombinable(layer: Layer): layer is ShapeLayer | BezierLayer {
  if (layer.locked || !layer.visible) return false;
  if (layer.type === "bezier") return layer.fillEnabled && layer.closed;
  if (layer.type !== "shape") return false;
  if (layer.shape === "line" || layer.shape === "arrow") return false;
  return layer.fillEnabled !== false;
}

function closeRing(ring: Pair[]): Pair[] {
  if (ring.length < 3) return ring;
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] === last[0] && first[1] === last[1]) return ring;
  return [...ring, [first[0], first[1]]];
}

function parsePoints(s: string): Pair[] {
  const nums = s
    .trim()
    .split(/[\s,]+/)
    .map(Number)
    .filter((n) => Number.isFinite(n));
  const pts: Pair[] = [];
  for (let i = 0; i + 1 < nums.length; i += 2) {
    pts.push([nums[i], nums[i + 1]]);
  }
  return pts;
}

function ellipseRing(cx: number, cy: number, rx: number, ry: number, n = 64): Pair[] {
  return Array.from({ length: n }, (_, i) => {
    const a = -Math.PI / 2 + (Math.PI * 2 * i) / n;
    return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)] as Pair;
  });
}

function roundedRectRing(w: number, h: number, radius: number): Pair[] {
  const r = Math.max(0, Math.min(radius, w / 2, h / 2));
  if (r < 0.5) {
    return [
      [0, 0],
      [w, 0],
      [w, h],
      [0, h],
    ];
  }
  const steps = 8;
  const arc = (cx: number, cy: number, start: number, sweep: number): Pair[] =>
    Array.from({ length: steps + 1 }, (_, i) => {
      const a = start + (sweep * i) / steps;
      return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as Pair;
    });
  return [
    ...arc(r, r, -Math.PI, Math.PI / 2).slice(0, -1),
    ...arc(w - r, r, -Math.PI / 2, Math.PI / 2).slice(0, -1),
    ...arc(w - r, h - r, 0, Math.PI / 2).slice(0, -1),
    ...arc(r, h - r, Math.PI / 2, Math.PI / 2).slice(0, -1),
  ];
}

function samplePathD(d: string): Pair[] {
  if (typeof document === "undefined" || !d) return [];
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", d);
  const len = path.getTotalLength();
  if (len < 1) return [];
  const n = Math.max(24, Math.min(160, Math.ceil(len / 3)));
  const pts: Pair[] = [];
  for (let i = 0; i < n; i++) {
    const p = path.getPointAtLength((i / n) * len);
    pts.push([p.x, p.y]);
  }
  return pts;
}

function parseViewBox(vb: string): { x: number; y: number; w: number; h: number } {
  const p = vb.trim().split(/[\s,]+/).map(Number);
  return { x: p[0] || 0, y: p[1] || 0, w: p[2] || 64, h: p[3] || 64 };
}

function viewBoxToLocal(
  layer: ShapeLayer,
  vx: number,
  vy: number,
): Pair {
  const vb = parseViewBox(svgMarkViewBox(layer));
  const s = Math.min(layer.width / Math.max(1, vb.w), layer.height / Math.max(1, vb.h));
  const ox = (layer.width - vb.w * s) / 2;
  const oy = (layer.height - vb.h * s) / 2;
  return [ox + (vx - vb.x) * s, oy + (vy - vb.y) * s];
}

function svgNodeRing(layer: ShapeLayer, node: SvgNode): Pair[] | null {
  if (node.fill === "none") return null;
  if (node.tag === "circle") {
    return ellipseRing(node.cx, node.cy, node.r, node.r, 48).map(([x, y]) =>
      viewBoxToLocal(layer, x, y),
    );
  }
  const sampled = samplePathD(node.d);
  if (sampled.length < 3) return null;
  return sampled.map(([x, y]) => viewBoxToLocal(layer, x, y));
}

function localRings(layer: ShapeLayer | BezierLayer): Pair[][] {
  if (layer.type === "bezier") {
    const d = bezierPath(layer.points, true);
    const pts = samplePathD(d);
    return pts.length >= 3 ? [pts] : [];
  }
  const w = Math.max(1, layer.width);
  const h = Math.max(1, layer.height);
  if (layer.shape === "rect") {
    return [roundedRectRing(w, h, layer.cornerRadius ?? 0)];
  }
  if (layer.shape === "ellipse" || (layer.shape === "pie" && (layer.wedge ?? 0) >= 0.97)) {
    return [ellipseRing(w / 2, h / 2, w / 2, h / 2)];
  }
  if (layer.shape === "pie") {
    const pie = pieGeometry(w, h, layer.wedge ?? 0.38, 0);
    const n = 48;
    const start = -Math.PI / 2;
    const sweep = Math.max(0.02, layer.wedge ?? 0.38) * Math.PI * 2;
    const arc: Pair[] = Array.from({ length: n + 1 }, (_, i) => {
      const a = start + (sweep * i) / n;
      return [pie.cx + pie.rx * Math.cos(a), pie.cy + pie.ry * Math.sin(a)];
    });
    return [[[pie.cx, pie.cy], ...arc]];
  }
  if (layer.shape === "svg") {
    return (layer.svgNodes ?? [])
      .map((node) => svgNodeRing(layer, node))
      .filter((ring): ring is Pair[] => !!ring && ring.length >= 3);
  }
  const geo = shapeSvgPoints({ ...layer, strokeWidth: 0 });
  if (geo.polygon) {
    const pts = parsePoints(geo.polygon);
    return pts.length >= 3 ? [pts] : [];
  }
  return [];
}

function toPagePolygon(layer: ShapeLayer | BezierLayer, ring: Pair[]): Polygon {
  const mapped = ring.map(([x, y]) => {
    const p = localToPage(layer, x, y);
    return [p.x, p.y] as Pair;
  });
  return [closeRing(mapped)];
}

function layerGeom(layer: ShapeLayer | BezierLayer): MultiPolygon | null {
  const rings = localRings(layer);
  if (rings.length === 0) return null;
  const polys = rings.map((ring) => toPagePolygon(layer, ring));
  try {
    if (polys.length === 1) return [polys[0]];
    return union(polys[0], ...polys.slice(1));
  } catch {
    return [polys[0]];
  }
}

function combineGeoms(geoms: MultiPolygon[], mode: CombineMode): MultiPolygon {
  if (geoms.length === 0) return [];
  if (geoms.length === 1) return geoms[0];
  const rest = geoms.slice(1);
  try {
    if (mode === "unite") return union(geoms[0], ...rest);
    if (mode === "subtract") {
      const clip =
        rest.length === 1 ? rest[0] : union(rest[0], ...rest.slice(1));
      return difference(geoms[0], clip);
    }
    if (mode === "intersect") return intersection(geoms[0], ...rest);
    return xor(geoms[0], ...rest);
  } catch {
    return [];
  }
}

function boundsOf(mp: MultiPolygon): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const poly of mp) {
    for (const ring of poly) {
      for (const [x, y] of ring) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  return { minX, minY, maxX, maxY };
}

function pathFromMultiPolygon(mp: MultiPolygon, ox: number, oy: number): string {
  let d = "";
  for (const poly of mp) {
    for (const ring of poly) {
      if (ring.length < 4) continue;
      d += `M ${+(ring[0][0] - ox).toFixed(2)} ${+(ring[0][1] - oy).toFixed(2)}`;
      for (let i = 1; i < ring.length; i++) {
        d += ` L ${+(ring[i][0] - ox).toFixed(2)} ${+(ring[i][1] - oy).toFixed(2)}`;
      }
      d += " Z";
    }
  }
  return d;
}

export function combineLayers(layers: Layer[], mode: CombineMode): ShapeLayer | null {
  const targets = layers.filter(isCombinable);
  if (targets.length < 2) return null;
  const geoms = targets
    .map((layer) => layerGeom(layer))
    .filter((g): g is MultiPolygon => !!g && g.length > 0);
  if (geoms.length < 2) return null;
  const result = combineGeoms(geoms, mode);
  if (!result.length) return null;
  const box = boundsOf(result);
  if (!Number.isFinite(box.minX)) return null;
  const top = targets[targets.length - 1];
  const fill =
    top.type === "shape" || top.type === "bezier" ? top.fill : "#c45c26";
  const stroke = top.stroke || "#1c1916";
  const strokeWidth = top.strokeWidth > 0 ? top.strokeWidth : 2;
  const dash = top.type === "shape" ? top.dash : "solid";
  const pad = Math.max(2, Math.ceil(strokeWidth / 2) + 1);
  const x = box.minX - pad;
  const y = box.minY - pad;
  const width = Math.max(8, box.maxX - box.minX + pad * 2);
  const height = Math.max(8, box.maxY - box.minY + pad * 2);
  const d = pathFromMultiPolygon(result, x, y);
  if (!d) return null;
  return createShapeLayer("svg", {
    name: "Combined",
    x,
    y,
    width,
    height,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    fill,
    fillEnabled: true,
    fillStyle: "fillStyle" in top ? top.fillStyle : "solid",
    fillTo: "fillTo" in top ? top.fillTo : "#f4d8a8",
    fillAngle: "fillAngle" in top ? top.fillAngle : 0,
    fillStops: "fillStops" in top ? top.fillStops : undefined,
    stroke,
    strokeEnabled: true,
    strokeWidth,
    dash,
    opacity: top.opacity,
    blendMode: top.blendMode,
    svgViewBox: `0 0 ${width} ${height}`,
    svgNodes: [
      {
        tag: "path",
        d,
        fill: "fill",
        stroke: "stroke",
        strokeLinejoin: "round",
        strokeLinecap: "round",
      },
    ],
  });
}

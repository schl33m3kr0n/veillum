import { hexToRgb, rgbToHex } from "./colors";
import type { FillStyle } from "./types";

export const MAX_FILL_STOPS = 5;

export type FillStop = { color: string; pos: number };

export type Fillable = {
  id: string;
  fill: string;
  fillEnabled: boolean;
  fillStyle?: FillStyle;
  fillTo?: string;
  fillAngle?: number;
  fillStops?: FillStop[];
  width?: number;
  height?: number;
};

export const FILL_STYLES: {
  id: FillStyle;
  label: string;
}[] = [
  { id: "solid", label: "Solid" },
  { id: "linear", label: "Linear" },
  { id: "radial", label: "Radial" },
  { id: "diamond", label: "Diamond" },
  { id: "conic", label: "Angular" },
  { id: "reflected", label: "Reflect" },
];

export function resolveStops(layer: Pick<Fillable, "fill" | "fillTo" | "fillStops">): FillStop[] {
  if (layer.fillStops && layer.fillStops.length >= 2) {
    return [...layer.fillStops]
      .map((s) => ({
        color: s.color,
        pos: Math.max(0, Math.min(1, s.pos)),
      }))
      .sort((a, b) => a.pos - b.pos);
  }
  return [
    { color: layer.fill || "#c45c26", pos: 0 },
    { color: layer.fillTo || "#f4d8a8", pos: 1 },
  ];
}

export function evenStops(colors: string[]): FillStop[] {
  const list = colors.slice(0, MAX_FILL_STOPS);
  const n = Math.max(2, list.length);
  while (list.length < n) list.push(list[list.length - 1] ?? "#c45c26");
  return list.map((color, i) => ({
    color,
    pos: n === 1 ? 0 : i / (n - 1),
  }));
}

export function resizeStops(stops: FillStop[], count: number): FillStop[] {
  const n = Math.max(2, Math.min(MAX_FILL_STOPS, Math.round(count)));
  const colors = resolveStops({ fill: "#c45c26", fillStops: stops }).map((s) => s.color);
  if (colors.length >= n) return evenStops(colors.slice(0, n));
  const last = colors[colors.length - 1] ?? "#f4d8a8";
  while (colors.length < n) colors.push(last);
  return evenStops(colors);
}

export function setStopSpan(stops: FillStop[], index: number, span: number): FillStop[] {
  const sorted = resolveStops({ fill: "#000", fillStops: stops });
  const n = sorted.length;
  if (n < 2) return sorted;
  const spans = sorted.map((s, i) =>
    i === n - 1 ? 1 - s.pos : sorted[i + 1]!.pos - s.pos,
  );
  const next = Math.max(0.04, Math.min(0.84, span));
  spans[index] = next;
  const total = spans.reduce((a, b) => a + b, 0) || 1;
  const norm = spans.map((v) => v / total);
  let pos = 0;
  return sorted.map((s, i) => {
    const stop = { color: s.color, pos };
    pos += norm[i] ?? 0;
    return stop;
  });
}

export function stopSpans(stops: FillStop[]): number[] {
  const sorted = resolveStops({ fill: "#000", fillStops: stops });
  return sorted.map((s, i) =>
    i === sorted.length - 1 ? 1 - s.pos : (sorted[i + 1]?.pos ?? 1) - s.pos,
  );
}

export function cssFillPreview(
  style: FillStyle,
  stops: FillStop[],
  angle = 90,
): string {
  const sorted = resolveStops({ fill: "#c45c26", fillStops: stops });
  const list = sorted.map((s) => `${s.color} ${Math.round(s.pos * 100)}%`).join(", ");
  if (style === "solid") return sorted[0]?.color ?? "#c45c26";
  if (style === "radial") return `radial-gradient(circle at 50% 50%, ${list})`;
  if (style === "diamond" || style === "conic") {
    if (typeof document !== "undefined") {
      const url = rasterFillDataUrl(style, sorted, angle, 96, 48);
      if (url) return `center / 100% 100% no-repeat url("${url}")`;
    }
  }
  if (style === "conic") {
    const first = sorted[0]?.color;
    const closed =
      first && sorted[sorted.length - 1]?.color.toLowerCase() !== first.toLowerCase()
        ? `${list}, ${first}`
        : list;
    return `conic-gradient(from ${angle}deg at 50% 50%, ${closed})`;
  }
  if (style === "reflected") {
    const half = sorted
      .map((s) => `${s.color} ${Math.round(s.pos * 50)}%`)
      .join(", ");
    return `repeating-linear-gradient(${angle}deg, ${half})`;
  }
  return `linear-gradient(${angle}deg, ${list})`;
}

export function fillPaint(layer: Fillable): string {
  if (!layer.fillEnabled) return "none";
  const style = layer.fillStyle ?? "solid";
  if (style === "solid") return layer.fill;
  return `url(#${gradientId(layer.id)})`;
}

export function gradientId(layerId: string): string {
  return `fill_${layerId.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
}

export function usesSvgGradient(style: FillStyle | undefined): boolean {
  return style === "linear" || style === "radial" || style === "reflected";
}

export function usesRasterFill(style: FillStyle | undefined): boolean {
  return style === "conic" || style === "diamond";
}

function sampleStops(stops: FillStop[], t: number): { r: number; g: number; b: number } {
  const sorted = resolveStops({ fill: "#000", fillStops: stops });
  const x = Math.max(0, Math.min(1, t));
  if (x <= sorted[0]!.pos) return hexToRgb(sorted[0]!.color);
  const last = sorted[sorted.length - 1]!;
  if (x >= last.pos) return hexToRgb(last.color);
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i]!;
    const b = sorted[i + 1]!;
    if (x >= a.pos && x <= b.pos) {
      const u = (x - a.pos) / Math.max(0.0001, b.pos - a.pos);
      const A = hexToRgb(a.color);
      const B = hexToRgb(b.color);
      return {
        r: A.r + (B.r - A.r) * u,
        g: A.g + (B.g - A.g) * u,
        b: A.b + (B.b - A.b) * u,
      };
    }
  }
  return hexToRgb(last.color);
}

export function rasterFillDataUrl(
  style: FillStyle,
  stops: FillStop[],
  angle: number,
  width: number,
  height: number,
): string {
  const w = Math.max(8, Math.min(256, Math.round(width)));
  const h = Math.max(8, Math.min(256, Math.round(height)));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  const rad = (angle * Math.PI) / 180;
  const image = ctx.createImageData(w, h);
  const cx = (w - 1) / 2;
  const cy = (h - 1) / 2;
  const sorted = resolveStops({ fill: "#000", fillStops: stops });
  const sampleAt =
    style === "conic" ? conicStops(sorted) : sorted;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const nx = (x - cx) / Math.max(1, cx);
      const ny = (y - cy) / Math.max(1, cy);
      const rx = nx * Math.cos(-rad) - ny * Math.sin(-rad);
      const ry = nx * Math.sin(-rad) + ny * Math.cos(-rad);
      let t = 0;
      if (style === "diamond") {
        t = Math.min(1, (Math.abs(rx) + Math.abs(ry)) / 2);
      } else {
        const a = Math.atan2(ry, rx);
        t = (a / (Math.PI * 2) + 1) % 1;
      }
      const c = sampleStops(sampleAt, t);
      const i = (y * w + x) * 4;
      image.data[i] = c.r;
      image.data[i + 1] = c.g;
      image.data[i + 2] = c.b;
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  return canvas.toDataURL("image/png");
}

function conicStops(stops: FillStop[]): FillStop[] {
  const first = stops[0];
  if (!first) return stops;
  const next = stops.map((s, i) =>
    i === stops.length - 1 && s.pos >= 0.999 ? { ...s, pos: 0.999 } : s,
  );
  return [...next, { color: first.color, pos: 1 }];
}

export function fillDefsMarkup(layer: Fillable): string {
  if (!layer.fillEnabled) return "";
  const style = layer.fillStyle ?? "solid";
  if (style === "solid") return "";
  const id = gradientId(layer.id);
  const stops = resolveStops(layer);
  const angle = layer.fillAngle ?? 0;
  if (usesRasterFill(style)) {
    if (typeof document === "undefined") return "";
    const w = Math.max(8, Math.round(layer.width ?? 96));
    const h = Math.max(8, Math.round(layer.height ?? 96));
    const url = rasterFillDataUrl(style, stops, angle, w, h);
    if (!url) return "";
    return `<defs><pattern id="${id}" patternUnits="userSpaceOnUse" width="${w}" height="${h}"><image href="${url}" width="${w}" height="${h}" preserveAspectRatio="none"/></pattern></defs>`;
  }
  const stopXml = stops
    .map((s) => `<stop offset="${s.pos}" stop-color="${s.color}"/>`)
    .join("");
  if (style === "radial") {
    return `<defs><radialGradient id="${id}" cx="0.5" cy="0.5" r="0.75">${stopXml}</radialGradient></defs>`;
  }
  const rad = (angle * Math.PI) / 180;
  const span = style === "reflected" ? 0.28 : 0.5;
  const x1 = 0.5 - Math.cos(rad) * span;
  const y1 = 0.5 - Math.sin(rad) * span;
  const x2 = 0.5 + Math.cos(rad) * span;
  const y2 = 0.5 + Math.sin(rad) * span;
  const spread = style === "reflected" ? ` spreadMethod="reflect"` : "";
  return `<defs><linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"${spread}>${stopXml}</linearGradient></defs>`;
}

import { bezierPath } from "./geometry";
import { shapeSvgPoints } from "./shapes";
import type { BezierLayer, Layer, Page, PathLayer, ShapeLayer, TextLayer } from "./types";
import { displayText } from "./text";

export type ExportFormat = "png" | "jpeg" | "webp" | "svg" | "json";

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function dash(style: string, width: number): string {
  if (style === "dash") return `${width * 4},${width * 2}`;
  if (style === "dot") return `${width},${width * 1.8}`;
  if (style === "dashdot") return `${width * 4},${width * 1.6},${width},${width * 1.6}`;
  return "";
}

function layerToSvg(layer: Layer): string {
  const t = `transform="translate(${layer.x} ${layer.y}) rotate(${layer.rotation}) scale(${layer.scaleX} ${layer.scaleY})"`;
  const op = `opacity="${layer.opacity}"`;
  if (layer.type === "text") {
    const l = layer as TextLayer;
    const text = escapeXml(displayText(l));
    const weight = l.bold ? "700" : "400";
    const style = l.italic ? "italic" : "normal";
    const deco = [l.underline ? "underline" : "", l.strikethrough ? "line-through" : ""]
      .filter(Boolean)
      .join(" ");
    return `<text ${t} ${op} fill="${l.color}" font-family="${l.fontFamily}" font-size="${l.fontSize}" font-weight="${weight}" font-style="${style}" letter-spacing="${l.letterSpacing}" text-decoration="${deco}">${text}</text>`;
  }
  if (layer.type === "shape") {
    const s = layer as ShapeLayer;
    const fill = s.fillEnabled ? s.fill : "none";
    const strokeOn = s.strokeEnabled !== false && s.strokeWidth > 0;
    const strokePaint = strokeOn ? s.stroke : "none";
    const sw = strokeOn ? s.strokeWidth : 0;
    const dasharray = dash(s.dash, sw);
    const extra = dasharray ? `stroke-dasharray="${dasharray}"` : "";
    const geo = shapeSvgPoints(s);
    if (s.shape === "ellipse") {
      return `<ellipse ${t} ${op} cx="${s.width / 2}" cy="${s.height / 2}" rx="${s.width / 2}" ry="${s.height / 2}" fill="${fill}" stroke="${strokePaint}" stroke-width="${sw}" ${extra}/>`;
    }
    if (s.shape === "line") {
      return `<line ${t} ${op} x1="0" y1="${s.height / 2}" x2="${s.width}" y2="${s.height / 2}" stroke="${strokePaint}" stroke-width="${sw}" ${extra}/>`;
    }
    if (s.shape === "rect") {
      return `<rect ${t} ${op} width="${s.width}" height="${s.height}" rx="${s.cornerRadius}" fill="${fill}" stroke="${strokePaint}" stroke-width="${sw}" ${extra}/>`;
    }
    if (geo.arrow) {
      const a = geo.arrow;
      const head = strokeOn ? s.stroke : fill;
      return `<g ${t} ${op}><line x1="${a.x1}" y1="${a.y1}" x2="${a.x2}" y2="${a.y2}" stroke="${strokePaint}" stroke-width="${sw}" ${extra}/><polygon points="${a.points}" fill="${head}"/></g>`;
    }
    if (geo.polygon) {
      return `<polygon ${t} ${op} points="${geo.polygon}" fill="${fill}" stroke="${strokePaint}" stroke-width="${sw}" stroke-linejoin="round" ${extra}/>`;
    }
  }
  if (layer.type === "path") {
    const p = layer as PathLayer;
    const pts = [];
    for (let i = 0; i < p.points.length; i += 2) {
      pts.push(`${p.points[i]},${p.points[i + 1]}`);
    }
    return `<polyline ${t} ${op} fill="none" points="${pts.join(" ")}" stroke="${p.stroke}" stroke-width="${p.strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  if (layer.type === "bezier") {
    const b = layer as BezierLayer;
    const d = bezierPath(b.points, b.closed);
    const fill = b.fillEnabled ? b.fill : "none";
    return `<path ${t} ${op} d="${d}" fill="${fill}" stroke="${b.stroke}" stroke-width="${b.strokeWidth}" fill-rule="evenodd"/>`;
  }
  if (layer.type === "image") {
    return `<image ${t} ${op} href="${layer.src}" width="${layer.width}" height="${layer.height}" />`;
  }
  return "";
}

export function documentToSvg(page: Page, layers: Layer[]): string {
  const body = layers
    .filter((l) => l.visible)
    .map(layerToSvg)
    .join("\n  ");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${page.width}" height="${page.height}" viewBox="0 0 ${page.width} ${page.height}">
  <rect width="100%" height="100%" fill="${page.background}"/>
  ${body}
</svg>`;
}

export function projectJson(page: Page, layers: Layer[]): string {
  return JSON.stringify({ version: 1, page, layers }, null, 2);
}

import type { FillStyle } from "./types";

export type Fillable = {
  id: string;
  fill: string;
  fillEnabled: boolean;
  fillStyle?: FillStyle;
  fillTo?: string;
  fillAngle?: number;
};

export type GradientSpec = {
  id: string;
  kind: "linear" | "radial";
  from: string;
  to: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export function fillPaint(layer: Fillable): string {
  if (!layer.fillEnabled) return "none";
  const style = layer.fillStyle ?? "solid";
  if (style === "solid") return layer.fill;
  return `url(#${gradientId(layer.id)})`;
}

export function gradientId(layerId: string): string {
  return `fill_${layerId.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
}

export function gradientSpec(layer: Fillable): GradientSpec | null {
  if (!layer.fillEnabled) return null;
  const style = layer.fillStyle ?? "solid";
  if (style === "solid") return null;
  const angle = ((layer.fillAngle ?? 0) * Math.PI) / 180;
  return {
    id: gradientId(layer.id),
    kind: style === "radial" ? "radial" : "linear",
    from: layer.fill,
    to: layer.fillTo || "#f4d8a8",
    x1: 0.5 - Math.cos(angle) / 2,
    y1: 0.5 - Math.sin(angle) / 2,
    x2: 0.5 + Math.cos(angle) / 2,
    y2: 0.5 + Math.sin(angle) / 2,
  };
}

export function fillDefsMarkup(layer: Fillable): string {
  const spec = gradientSpec(layer);
  if (!spec) return "";
  const stops = `<stop offset="0" stop-color="${spec.from}"/><stop offset="1" stop-color="${spec.to}"/>`;
  if (spec.kind === "radial") {
    return `<defs><radialGradient id="${spec.id}" cx="0.5" cy="0.5" r="0.75">${stops}</radialGradient></defs>`;
  }
  return `<defs><linearGradient id="${spec.id}" x1="${spec.x1}" y1="${spec.y1}" x2="${spec.x2}" y2="${spec.y2}">${stops}</linearGradient></defs>`;
}

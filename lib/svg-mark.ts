import { fillDefsMarkup, fillPaint, type Fillable } from "./fill";
import { dashArray } from "./geometry";
import type { ShapeLayer, SvgNode, SvgPaint } from "./types";

const ACCENT = "#d4a054";

export function resolveSvgPaint(
  token: SvgPaint | undefined,
  layer: Pick<ShapeLayer, "fill" | "stroke" | "fillEnabled" | "strokeEnabled"> &
    Partial<Fillable>,
  fallback: SvgPaint = "fill",
): string {
  const paint = token ?? fallback;
  if (paint === "none") return "none";
  if (paint === "accent") return ACCENT;
  if (paint === "fill") {
    if (!layer.fillEnabled) return "none";
    if (layer.id && layer.fillStyle && layer.fillStyle !== "solid") {
      return fillPaint({
        id: layer.id,
        fill: layer.fill,
        fillEnabled: true,
        fillStyle: layer.fillStyle,
        fillTo: layer.fillTo,
        fillAngle: layer.fillAngle,
      });
    }
    return layer.fill;
  }
  if (paint === "stroke") return layer.strokeEnabled ? layer.stroke : "none";
  return "none";
}

export function svgNodeStrokeWidth(node: SvgNode, layer: Pick<ShapeLayer, "strokeWidth">): number {
  return layer.strokeWidth || node.strokeWidth || 0;
}

export function svgMarkViewBox(layer: Pick<ShapeLayer, "svgViewBox">): string {
  return layer.svgViewBox ?? "0 0 64 64";
}

export function svgNodesToMarkup(
  layer: Pick<
    ShapeLayer,
    | "svgNodes"
    | "svgViewBox"
    | "fill"
    | "stroke"
    | "fillEnabled"
    | "strokeEnabled"
    | "strokeWidth"
    | "dash"
    | "width"
    | "height"
    | "id"
    | "fillStyle"
    | "fillTo"
    | "fillAngle"
  >,
): string {
  const dash = dashArray(layer.dash, layer.strokeWidth).join(" ");
  const extra = dash ? ` stroke-dasharray="${dash}"` : "";
  const inner = (layer.svgNodes ?? [])
    .map((node) => {
      const fill = resolveSvgPaint(
        node.fill,
        layer,
        node.tag === "path" && node.stroke && node.stroke !== "none" ? "none" : "fill",
      );
      const stroke = resolveSvgPaint(node.stroke, layer, "none");
      const sw = svgNodeStrokeWidth(node, layer);
      if (node.tag === "circle") {
        return `<circle cx="${node.cx}" cy="${node.cy}" r="${node.r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${extra}/>`;
      }
      const cap = node.strokeLinecap ? ` stroke-linecap="${node.strokeLinecap}"` : "";
      const join = node.strokeLinejoin
        ? ` stroke-linejoin="${node.strokeLinejoin}"`
        : "";
      return `<path d="${node.d}" fill="${fill}" fill-rule="evenodd" stroke="${stroke}" stroke-width="${sw}"${cap}${join}${extra}/>`;
    })
    .join("");
  return `<svg width="${layer.width}" height="${layer.height}" viewBox="${svgMarkViewBox(layer)}" overflow="visible">${fillDefsMarkup(layer)}${inner}</svg>`;
}

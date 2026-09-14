import type { SvgNode, SvgPaint } from "./types";

const ALLOWED = new Set([
  "svg",
  "g",
  "path",
  "circle",
  "ellipse",
  "rect",
  "polygon",
  "polyline",
  "line",
]);

function attr(tag: string, name: string): string | undefined {
  const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i"));
  return m?.[2] ?? m?.[3];
}

function paintToken(value: string | undefined, fallback: SvgPaint): SvgPaint {
  if (!value || value === "inherit" || value === "currentColor") return fallback;
  if (value === "none") return "none";
  return fallback;
}

export function svgViewBox(svg: string): string {
  const root = svg.match(/<svg\b([^>]*)>/i)?.[1] ?? "";
  const vb = attr(root, "viewBox");
  if (vb) return vb;
  const w = Number(attr(root, "width")) || 24;
  const h = Number(attr(root, "height")) || 24;
  return `0 0 ${w} ${h}`;
}

/** Drop scripts and rewrite paints so Inspect fill/stroke can recolor the mark. */
export function prepareSvgMarkup(raw: string): string {
  let svg = raw
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, "")
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*')/gi, "");
  const root = svg.match(/<svg\b([^>]*)>/i);
  if (!root) return "";
  const vb = svgViewBox(svg);
  const inner = svg
    .replace(/^[\s\S]*?<svg\b[^>]*>/i, "")
    .replace(/<\/svg>\s*$/i, "");
  const cleaned = inner.replace(/<\/?([a-z0-9:-]+)\b[^>]*\/?>/gi, (tag, name) => {
    if (name.toLowerCase() === "svg") return "";
    if (!ALLOWED.has(name.toLowerCase())) return "";
    return tag
      .replace(/\s(width|height)\s*=\s*("1em"|'1em')/gi, "")
      .replace(/\sfill\s*=\s*("(?!none|currentColor)[^"]*"|'(?!none|currentColor)[^']*')/gi, ' fill="currentColor"')
      .replace(/\sstroke\s*=\s*("(?!none|currentColor)[^"]*"|'(?!none|currentColor)[^']*')/gi, ' stroke="currentColor"');
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" overflow="visible">${cleaned}</svg>`;
}

function num(tag: string, name: string, fallback = 0) {
  const n = Number(attr(tag, name));
  return Number.isFinite(n) ? n : fallback;
}

function pathNode(tag: string, d: string, fallbackFill: SvgPaint): SvgNode | null {
  if (!d.trim()) return null;
  const fill = paintToken(attr(tag, "fill"), fallbackFill);
  const stroke = paintToken(
    attr(tag, "stroke"),
    fill === "none" ? "stroke" : "none",
  );
  const cap = attr(tag, "stroke-linecap");
  const join = attr(tag, "stroke-linejoin");
  return {
    tag: "path",
    d,
    fill,
    stroke,
    strokeWidth: Number(attr(tag, "stroke-width")) || undefined,
    strokeLinecap:
      cap === "round" || cap === "square" || cap === "butt" ? cap : undefined,
    strokeLinejoin:
      join === "round" || join === "bevel" || join === "miter" ? join : undefined,
  };
}

function pointsPath(points: string, close: boolean) {
  const pairs = points
    .trim()
    .split(/[\s,]+/)
    .map(Number)
    .filter((n) => Number.isFinite(n));
  if (pairs.length < 4) return "";
  let d = `M${pairs[0]} ${pairs[1]}`;
  for (let i = 2; i < pairs.length; i += 2) {
    d += `L${pairs[i]} ${pairs[i + 1]}`;
  }
  return close ? `${d}Z` : d;
}

export function svgToNodes(raw: string): SvgNode[] {
  const nodes: SvgNode[] = [];
  const tags =
    raw.match(
      /<(path|circle|ellipse|rect|polygon|polyline|line)\b[^>]*\/?>(?:<\/\1>)?/gi,
    ) ?? [];
  for (const tag of tags) {
    const name = tag.match(/^<([a-z]+)/i)?.[1]?.toLowerCase();
    if (name === "path") {
      const node = pathNode(tag, attr(tag, "d") ?? "", "fill");
      if (node) nodes.push(node);
      continue;
    }
    if (name === "circle") {
      const cx = num(tag, "cx");
      const cy = num(tag, "cy");
      const r = num(tag, "r");
      if (!r) continue;
      nodes.push({
        tag: "circle",
        cx,
        cy,
        r,
        fill: paintToken(attr(tag, "fill"), "fill"),
        stroke: paintToken(attr(tag, "stroke"), "none"),
        strokeWidth: Number(attr(tag, "stroke-width")) || undefined,
      });
      continue;
    }
    if (name === "ellipse") {
      const cx = num(tag, "cx");
      const cy = num(tag, "cy");
      const rx = num(tag, "rx");
      const ry = num(tag, "ry");
      if (!rx || !ry) continue;
      const node = pathNode(
        tag,
        `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${rx * 2} 0a${rx} ${ry} 0 1 0 ${-rx * 2} 0Z`,
        "fill",
      );
      if (node) nodes.push(node);
      continue;
    }
    if (name === "rect") {
      const x = num(tag, "x");
      const y = num(tag, "y");
      const w = num(tag, "width");
      const h = num(tag, "height");
      if (!w || !h) continue;
      const rx = Math.min(w / 2, Math.max(0, num(tag, "rx", num(tag, "ry"))));
      const ry = Math.min(h / 2, Math.max(0, num(tag, "ry", rx)));
      const d =
        rx === 0 && ry === 0
          ? `M${x} ${y}h${w}v${h}h${-w}Z`
          : `M${x + rx} ${y}h${w - rx * 2}a${rx} ${ry} 0 0 1 ${rx} ${ry}v${h - ry * 2}a${rx} ${ry} 0 0 1 ${-rx} ${ry}h${-(w - rx * 2)}a${rx} ${ry} 0 0 1 ${-rx} ${-ry}v${-(h - ry * 2)}a${rx} ${ry} 0 0 1 ${rx} ${-ry}Z`;
      const node = pathNode(tag, d, "fill");
      if (node) nodes.push(node);
      continue;
    }
    if (name === "polygon" || name === "polyline") {
      const node = pathNode(
        tag,
        pointsPath(attr(tag, "points") ?? "", name === "polygon"),
        name === "polyline" ? "none" : "fill",
      );
      if (node) nodes.push(node);
      continue;
    }
    if (name === "line") {
      const node = pathNode(
        tag,
        `M${num(tag, "x1")} ${num(tag, "y1")}L${num(tag, "x2")} ${num(tag, "y2")}`,
        "none",
      );
      if (node) nodes.push(node);
    }
  }
  return nodes;
}

export function isSvgFile(file: File) {
  return file.type === "image/svg+xml" || /\.svg$/i.test(file.name);
}

export type SvgMarkSpec = {
  name: string;
  viewBox: string;
  nodes: SvgNode[];
  width: number;
  height: number;
  outlined: boolean;
};

export function svgMarkFromRaw(raw: string, name: string): SvgMarkSpec | null {
  const nodes = svgToNodes(raw);
  if (nodes.length === 0) return null;
  const viewBox = svgViewBox(raw);
  const parts = viewBox.split(/[\s,]+/).map(Number);
  const vw = parts[2] || 24;
  const vh = parts[3] || 24;
  const max = 160;
  const scale = max / Math.max(vw, vh, 1);
  return {
    name: name.replace(/\.svg$/i, "").replace(/[-_]+/g, " ").trim() || "Icon",
    viewBox,
    nodes,
    width: Math.max(48, Math.round(vw * scale)),
    height: Math.max(48, Math.round(vh * scale)),
    outlined: nodes.every((node) => node.fill === "none"),
  };
}

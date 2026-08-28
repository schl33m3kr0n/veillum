import type { Capitalization, ListType, TextLayer } from "./types";

export function applyCapitalization(
  text: string,
  mode: Capitalization,
): string {
  switch (mode) {
    case "uppercase":
      return text.toUpperCase();
    case "lowercase":
      return text.toLowerCase();
    case "title":
      return text.replace(
        /\w\S*/g,
        (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
      );
    case "small-caps":
      return text.toUpperCase();
    default:
      return text;
  }
}

export function applyList(text: string, listType: ListType): string {
  if (listType === "none") return text;
  const lines = text.split("\n");
  return lines
    .map((line, i) => {
      const stripped = line.replace(/^\s*(?:[-•]\s+|\d+\.\s+)/, "");
      if (listType === "bullet") return `•  ${stripped}`;
      return `${i + 1}.  ${stripped}`;
    })
    .join("\n");
}

export function displayText(layer: TextLayer): string {
  return applyList(
    applyCapitalization(layer.text, layer.capitalization),
    layer.listType,
  );
}

export function fontStyle(layer: TextLayer): string {
  const weight = layer.bold ? "bold" : "normal";
  const style = layer.italic ? "italic" : "normal";
  return `${style} ${weight}`;
}

export function textDecoration(layer: TextLayer): string {
  const parts: string[] = [];
  if (layer.underline) parts.push("underline");
  if (layer.strikethrough) parts.push("line-through");
  return parts.join(" ") || "";
}

export function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const paragraphs = text.split("\n");
  const lines: string[] = [];
  for (const para of paragraphs) {
    if (para.length === 0) {
      lines.push("");
      continue;
    }
    const words = para.split(" ");
    let current = "";
    for (const word of words) {
      const trial = current ? `${current} ${word}` : word;
      if (ctx.measureText(trial).width <= maxWidth || !current) {
        current = trial;
      } else {
        lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

export function justifyLine(
  ctx: CanvasRenderingContext2D,
  line: string,
  width: number,
): { text: string; extra: number } {
  const words = line.split(" ");
  if (words.length < 2) return { text: line, extra: 0 };
  const natural = ctx.measureText(line).width;
  const extra = Math.max(0, width - natural);
  return { text: line, extra: extra / (words.length - 1) };
}

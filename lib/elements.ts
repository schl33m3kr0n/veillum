import { createId } from "./ids";
import type { Layer, ShapeKind, ShapeLayer, SvgNode } from "./types";

export const ELEMENT_GROUPS = [
  "Basics",
  "Frames",
  "Marks",
  "Badges",
  "Nature",
  "Saved",
] as const;
export type ElementGroup = (typeof ELEMENT_GROUPS)[number];

export type ShapePreset = {
  id: string;
  label: string;
  group: Exclude<ElementGroup, "Saved">;
  kind: "shape";
  shape: ShapeKind;
  width: number;
  height: number;
  defaults?: Partial<ShapeLayer>;
};

export type CatalogElement = ShapePreset;

export type SavedElement = {
  id: string;
  name: string;
  layer: Layer;
};

const KEY = "veillum-elements";
const MAX_SAVED = 36;

let saved: SavedElement[] = [];
const listeners = new Set<() => void>();

function emit() {
  for (const fn of listeners) fn();
}

function mark(
  id: string,
  label: string,
  group: Exclude<ElementGroup, "Saved">,
  size: { width: number; height: number },
  nodes: SvgNode[],
  extra: Partial<ShapeLayer> = {},
): ShapePreset {
  return {
    id,
    label,
    group,
    kind: "shape",
    shape: "svg",
    width: size.width,
    height: size.height,
    defaults: {
      svgViewBox: "0 0 64 64",
      svgNodes: nodes,
      strokeEnabled: false,
      fillEnabled: true,
      ...extra,
    },
  };
}

export const ELEMENT_CATALOG: CatalogElement[] = [
  { id: "rect", label: "Rectangle", group: "Basics", kind: "shape", shape: "rect", width: 180, height: 120 },
  { id: "ellipse", label: "Ellipse", group: "Basics", kind: "shape", shape: "ellipse", width: 160, height: 120 },
  { id: "triangle", label: "Triangle", group: "Basics", kind: "shape", shape: "triangle", width: 140, height: 128 },
  { id: "diamond", label: "Diamond", group: "Basics", kind: "shape", shape: "hexagon", width: 120, height: 140, defaults: { sides: 4 } },
  { id: "polygon", label: "Hexagon", group: "Basics", kind: "shape", shape: "hexagon", width: 140, height: 140, defaults: { sides: 6 } },
  { id: "pentagon", label: "Pentagon", group: "Basics", kind: "shape", shape: "hexagon", width: 140, height: 140, defaults: { sides: 5 } },
  { id: "octagon", label: "Octagon", group: "Basics", kind: "shape", shape: "hexagon", width: 140, height: 140, defaults: { sides: 8 } },
  { id: "star", label: "Star", group: "Basics", kind: "shape", shape: "star", width: 140, height: 140, defaults: { starPoints: 5, innerRatio: 0.4 } },
  { id: "line", label: "Line", group: "Basics", kind: "shape", shape: "line", width: 200, height: 24 },
  { id: "arrow", label: "Arrow", group: "Basics", kind: "shape", shape: "arrow", width: 200, height: 48 },

  { id: "frame-rect", label: "Frame", group: "Frames", kind: "shape", shape: "rect", width: 200, height: 140, defaults: { fillEnabled: false, strokeEnabled: true, strokeWidth: 8, cornerRadius: 0 } },
  { id: "frame-round", label: "Round frame", group: "Frames", kind: "shape", shape: "rect", width: 200, height: 140, defaults: { fillEnabled: false, strokeEnabled: true, strokeWidth: 8, cornerRadius: 24 } },
  { id: "frame-circle", label: "Oval frame", group: "Frames", kind: "shape", shape: "ellipse", width: 160, height: 160, defaults: { fillEnabled: false, strokeEnabled: true, strokeWidth: 8 } },
  { id: "pill", label: "Pill", group: "Frames", kind: "shape", shape: "rect", width: 200, height: 56, defaults: { cornerRadius: 80 } },

  { id: "burst", label: "Burst", group: "Marks", kind: "shape", shape: "star", width: 160, height: 160, defaults: { starPoints: 12, innerRatio: 0.55 } },
  { id: "spark-star", label: "Spark", group: "Marks", kind: "shape", shape: "star", width: 120, height: 120, defaults: { starPoints: 4, innerRatio: 0.28 } },
  { id: "chevron", label: "Chevron", group: "Marks", kind: "shape", shape: "triangle", width: 120, height: 80 },
  { id: "rule", label: "Rule", group: "Marks", kind: "shape", shape: "line", width: 240, height: 16, defaults: { strokeWidth: 6, fillEnabled: false } },

  { id: "seal", label: "Seal", group: "Badges", kind: "shape", shape: "ellipse", width: 96, height: 96 },
  { id: "ticket", label: "Ticket", group: "Badges", kind: "shape", shape: "rect", width: 180, height: 72, defaults: { cornerRadius: 6 } },
  { id: "tag", label: "Tag", group: "Badges", kind: "shape", shape: "hexagon", width: 140, height: 72, defaults: { sides: 4 } },
  { id: "banner", label: "Banner", group: "Badges", kind: "shape", shape: "rect", width: 280, height: 56, defaults: { cornerRadius: 2 } },
  { id: "bookmark", label: "Bookmark", group: "Badges", kind: "shape", shape: "rect", width: 56, height: 140, defaults: { cornerRadius: 2 } },
  { id: "ring", label: "Ring", group: "Frames", kind: "shape", shape: "ellipse", width: 120, height: 120, defaults: { fillEnabled: false, strokeEnabled: true, strokeWidth: 10 } },
  { id: "plaque", label: "Plaque", group: "Frames", kind: "shape", shape: "rect", width: 220, height: 100, defaults: { cornerRadius: 4, strokeWidth: 3 } },

  mark("heart", "Heart", "Nature", { width: 120, height: 110 }, [
    { tag: "path", d: "M32 56S8 40 8 24a12 12 0 0 1 24-4 12 12 0 0 1 24 4c0 16-24 32-24 32Z" },
  ]),
  mark("sparkle", "Sparkle", "Nature", { width: 100, height: 100 }, [
    { tag: "path", d: "M32 4 36 24 56 28 36 32 32 52 28 32 8 28 28 24Z" },
  ]),
  mark("cloud", "Cloud", "Nature", { width: 150, height: 90 }, [
    { tag: "path", d: "M20 48h28a12 12 0 0 0 2-24 14 14 0 0 0-26-4A12 12 0 0 0 20 48Z" },
  ]),
  mark("leaf", "Leaf", "Nature", { width: 110, height: 140 }, [
    { tag: "path", d: "M48 8C28 8 12 28 12 48c0 14 10 24 24 24 20 0 28-20 28-36 0-8-2-16-6-20-8 10-18 16-28 18 12-8 18-18 18-26Z" },
    {
      tag: "path",
      d: "M24 52c8-4 16-12 22-22",
      fill: "none",
      stroke: "stroke",
      strokeWidth: 2,
    },
  ], { strokeEnabled: true, strokeWidth: 2 }),
  mark("drop", "Drop", "Nature", { width: 80, height: 120 }, [
    { tag: "path", d: "M32 6C32 6 12 30 12 42a20 20 0 0 0 40 0C52 30 32 6 32 6Z" },
  ]),
  mark("moon", "Moon", "Nature", { width: 100, height: 100 }, [
    { tag: "path", d: "M40 8a24 24 0 1 0 16 40A20 20 0 0 1 40 8Z" },
  ]),
  mark("flower", "Flower", "Nature", { width: 120, height: 120 }, [
    { tag: "circle", cx: 32, cy: 18, r: 10 },
    { tag: "circle", cx: 46, cy: 26, r: 10 },
    { tag: "circle", cx: 46, cy: 42, r: 10 },
    { tag: "circle", cx: 32, cy: 50, r: 10 },
    { tag: "circle", cx: 18, cy: 42, r: 10 },
    { tag: "circle", cx: 18, cy: 26, r: 10 },
    { tag: "circle", cx: 32, cy: 34, r: 7, fill: "accent" },
  ]),
  mark("quote", "Quote", "Marks", { width: 100, height: 80 }, [
    { tag: "path", d: "M12 44c0-12 8-20 16-24v8c-6 2-8 8-8 16h12v16H12V44Zm24 0c0-12 8-20 16-24v8c-6 2-8 8-8 16h12v16H36V44Z" },
  ]),
  mark("check", "Check", "Marks", { width: 110, height: 90 }, [
    {
      tag: "path",
      d: "M10 34 24 48 54 16",
      fill: "none",
      stroke: "stroke",
      strokeWidth: 6,
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
  ], { fillEnabled: false, strokeEnabled: true, strokeWidth: 6 }),
  mark("bolt", "Bolt", "Marks", { width: 80, height: 130 }, [
    { tag: "path", d: "M36 4 16 36h16L22 60 52 28H36L48 4Z" },
  ]),
  mark("sun", "Sun", "Nature", { width: 120, height: 120 }, [
    { tag: "circle", cx: 32, cy: 32, r: 12 },
    {
      tag: "path",
      d: "M32 6v8M32 50v8M6 32h8M50 32h8M12 12l6 6M46 46l6 6M52 12l-6 6M18 46l-6 6",
      fill: "none",
      stroke: "stroke",
      strokeWidth: 4,
      strokeLinecap: "round",
    },
  ], { strokeEnabled: true, strokeWidth: 4 }),
  mark("mountain", "Peak", "Nature", { width: 140, height: 90 }, [
    { tag: "path", d: "M4 52 22 22 32 36 44 16 60 52Z" },
  ]),
  mark("plus", "Plus", "Marks", { width: 88, height: 88 }, [
    { tag: "path", d: "M28 8h8v16h16v8H36v16h-8V32H12v-8h16Z" },
  ]),
];

export function catalogByGroup(group: Exclude<ElementGroup, "Saved">): CatalogElement[] {
  return ELEMENT_CATALOG.filter((item) => item.group === group);
}

export function getSavedElements(): SavedElement[] {
  return saved;
}

export function subscribeSavedElements(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(saved));
  } catch {
    /* quota */
  }
}

export function restoreSavedElements(): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as SavedElement[];
    if (!Array.isArray(parsed)) return;
    saved = parsed.filter((item) => item?.id && item.layer);
    emit();
  } catch {
    saved = [];
  }
}

export function saveLayerAsElement(layer: Layer): SavedElement {
  const item: SavedElement = {
    id: createId("el"),
    name: layer.name || "Element",
    layer: structuredClone({ ...layer, keyframes: [] }),
  };
  saved = [item, ...saved].slice(0, MAX_SAVED);
  persist();
  emit();
  return item;
}

export function deleteSavedElement(id: string): void {
  saved = saved.filter((item) => item.id !== id);
  persist();
  emit();
}

export function cloneLayerOntoPage(layer: Layer, pageWidth: number, pageHeight: number): Layer {
  const clone = structuredClone(layer) as Layer;
  clone.id = createId();
  clone.x = Math.round((pageWidth - clone.width) / 2);
  clone.y = Math.round((pageHeight - clone.height) / 2);
  clone.keyframes = [];
  return clone;
}

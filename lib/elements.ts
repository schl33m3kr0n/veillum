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
  { id: "circle", label: "Circle", group: "Basics", kind: "shape", shape: "ellipse", width: 140, height: 140 },
  { id: "triangle", label: "Triangle", group: "Basics", kind: "shape", shape: "triangle", width: 140, height: 128 },
  { id: "diamond", label: "Diamond", group: "Basics", kind: "shape", shape: "hexagon", width: 120, height: 140, defaults: { sides: 4 } },
  { id: "polygon", label: "Hexagon", group: "Basics", kind: "shape", shape: "hexagon", width: 140, height: 140, defaults: { sides: 6 } },
  { id: "pentagon", label: "Pentagon", group: "Basics", kind: "shape", shape: "hexagon", width: 140, height: 140, defaults: { sides: 5 } },
  { id: "octagon", label: "Octagon", group: "Basics", kind: "shape", shape: "hexagon", width: 140, height: 140, defaults: { sides: 8 } },
  { id: "star", label: "Star", group: "Basics", kind: "shape", shape: "star", width: 140, height: 140, defaults: { starPoints: 5, innerRatio: 0.4 } },
  { id: "line", label: "Line", group: "Basics", kind: "shape", shape: "line", width: 200, height: 24 },
  { id: "arrow", label: "Arrow", group: "Basics", kind: "shape", shape: "arrow", width: 200, height: 48 },
  { id: "pie", label: "Pie", group: "Basics", kind: "shape", shape: "pie", width: 160, height: 160, defaults: { wedge: 0.38, trackFill: "#efe6d8", strokeEnabled: true, strokeWidth: 1.5 } },

  { id: "chevron", label: "Chevron", group: "Marks", kind: "shape", shape: "triangle", width: 120, height: 80 },
  { id: "rule", label: "Rule", group: "Marks", kind: "shape", shape: "line", width: 240, height: 16, defaults: { strokeWidth: 6, fillEnabled: false } },

  { id: "tag", label: "Tag", group: "Badges", kind: "shape", shape: "hexagon", width: 140, height: 72, defaults: { sides: 4 } },

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
  mark("house", "House", "Marks", { width: 120, height: 110 }, [
    { tag: "path", d: "M8 30 32 10 56 30v26H38V40H26v16H8Z" },
  ]),
  mark("flag", "Flag", "Marks", { width: 110, height: 120 }, [
    { tag: "path", d: "M16 8v48M16 8h32l-8 12 8 12H16Z" },
  ]),
  mark("envelope", "Envelope", "Marks", { width: 130, height: 90 }, [
    { tag: "path", d: "M8 16h48v32H8Z" },
    { tag: "path", d: "M8 16 32 34 56 16" },
  ]),
  mark("crown", "Crown", "Marks", { width: 130, height: 90 }, [
    { tag: "path", d: "M8 44 16 20l16 14 16-18 8 28H8Zm4 6h40v6H12Z" },
  ]),
  mark("pin", "Pin", "Marks", { width: 90, height: 130 }, [
    { tag: "path", d: "M32 6a16 16 0 0 1 16 16c0 14-16 34-16 34S16 36 16 22A16 16 0 0 1 32 6Zm0 10a6 6 0 1 0 0 12 6 6 0 0 0 0-12Z" },
  ]),
  mark("bell", "Bell", "Marks", { width: 100, height: 110 }, [
    { tag: "path", d: "M32 8a14 14 0 0 1 14 14v12l6 10H12l6-10V22A14 14 0 0 1 32 8Zm-8 40a8 8 0 0 0 16 0" },
  ]),
  mark("book", "Book", "Marks", { width: 110, height: 120 }, [
    { tag: "path", d: "M12 10h18a12 12 0 0 1 12 0h10v44H42a12 12 0 0 0-12 0H12Z" },
    { tag: "path", d: "M32 10v44", fill: "none", stroke: "stroke", strokeWidth: 2 },
  ], { strokeEnabled: true, strokeWidth: 2 }),
  mark("key", "Key", "Marks", { width: 130, height: 70 }, [
    { tag: "path", d: "M22 20a12 12 0 1 1 8 16H56v8H48v-4h-6v4h-8V36A12 12 0 0 1 22 20Zm0 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" },
  ]),
  mark("shield", "Shield", "Marks", { width: 100, height: 120 }, [
    { tag: "path", d: "M32 6 52 14v18c0 14-10 24-20 28C22 56 12 46 12 32V14Z" },
  ]),
  mark("chat", "Chat", "Marks", { width: 130, height: 110 }, [
    { tag: "path", d: "M10 12h44v28H24L10 52Z" },
  ]),
  mark("user", "User", "Marks", { width: 100, height: 120 }, [
    { tag: "circle", cx: 32, cy: 20, r: 12 },
    { tag: "path", d: "M12 54c2-12 10-18 20-18s18 6 20 18" },
  ]),
  mark("tree", "Tree", "Nature", { width: 110, height: 140 }, [
    { tag: "path", d: "M32 6 12 34h12L10 54h18v8h8v-8h18L40 34h12Z" },
  ]),
  mark("bird", "Bird", "Nature", { width: 140, height: 90 }, [
    { tag: "path", d: "M8 36c12-4 20-16 28-16 4 0 6 2 10 2l10-12 4 8c8 2 12 10 4 18-10 10-28 8-40 4l-8 10-4-6 6-8Z" },
  ]),
  mark("fish", "Fish", "Nature", { width: 140, height: 80 }, [
    { tag: "path", d: "M8 32c10-16 28-20 40-12 6 4 10 10 10 12s-4 8-10 12C36 52 18 48 8 32Zm40 0 14-10v20Z" },
    { tag: "circle", cx: 20, cy: 30, r: 2, fill: "accent" },
  ]),
  mark("gift", "Gift", "Marks", { width: 110, height: 110 }, [
    { tag: "path", d: "M10 26h44v8H10Zm4 8h36v24H14ZM32 26v32M22 18c0-6 10-8 10 8 0-16 10-14 10-8" },
  ]),
  mark("rocket", "Rocket", "Marks", { width: 90, height: 140 }, [
    { tag: "path", d: "M32 4c12 12 12 28 8 40l10 10-8 4-6-8c-6 8-16 8-22 0l-6 8-8-4 10-10C20 32 20 16 32 4Zm0 20a6 6 0 1 0 0 12 6 6 0 0 0 0-12Z" },
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

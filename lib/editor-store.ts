"use client";

import { create } from "zustand";
import { temporal } from "zundo";
import { useStoreWithEqualityFn } from "zustand/traditional";
import type { TemporalState } from "zundo";
import { alignFrame, alignLayers, distributeLayers, type AlignMode, type AlignTarget, boundsOfBezier, boundsOfPoints, localizeBezier } from "./geometry";
import { layerAabb } from "./transform";
import type { SnapGuide } from "./snap";
import {
  createBezierLayer,
  createDefaultPage,
  createImageLayer,
  createPathLayer,
  createShapeLayer,
  createStarterLayers,
  createTextLayer,
} from "./document";
import type {
  Anchor,
  BezierPoint,
  Layer,
  Page,
  ShapeKind,
  TextAlign,
  Tool,
} from "./types";
import {
  cloneLayerOntoPage,
  ELEMENT_CATALOG,
  getSavedElements,
} from "./elements";

type Clipboard = Layer[] | null;

interface EditorState {
  page: Page;
  layers: Layer[];
  selectedIds: string[];
  tool: Tool;
  shapeKind: ShapeKind;
  shapeStroke: string;
  shapeFillEnabled: boolean;
  shapeStrokeEnabled: boolean;
  shapeStrokeWidth: number;
  shapeCornerRadius: number;
  shapeSides: number;
  shapeStarPoints: number;
  shapeInnerRatio: number;
  shapeArrowHead: number;
  color: string;
  highlight: string;
  zoom: number;
  panX: number;
  panY: number;
  editingTextId: string | null;
  playhead: number;
  duration: number;
  playing: boolean;
  clipboard: Clipboard;
  pointer: { x: number; y: number };
  recentColors: string[];
  sidebarOpen: boolean;
  timelineOpen: boolean;
  snapGuides: SnapGuide[];

  setTool: (tool: Tool) => void;
  setShapeKind: (kind: ShapeKind) => void;
  setShapeStroke: (color: string) => void;
  setShapeFillEnabled: (enabled: boolean) => void;
  setShapeStrokeEnabled: (enabled: boolean) => void;
  setShapeStrokeWidth: (width: number) => void;
  setShapeCornerRadius: (radius: number) => void;
  setShapeSides: (sides: number) => void;
  setShapeStarPoints: (points: number) => void;
  setShapeInnerRatio: (ratio: number) => void;
  setShapeArrowHead: (size: number) => void;
  setColor: (color: string) => void;
  setHighlight: (color: string) => void;
  setZoom: (zoom: number) => void;
  zoomToward: (zoom: number, screenX: number, screenY: number) => void;
  setPan: (x: number, y: number) => void;
  setPointer: (x: number, y: number) => void;
  setPlayhead: (t: number) => void;
  setDuration: (t: number) => void;
  setPlaying: (p: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  setTimelineOpen: (open: boolean) => void;
  setSnapGuides: (guides: SnapGuide[]) => void;
  select: (ids: string[], additive?: boolean) => void;
  clearSelection: () => void;
  setEditingText: (id: string | null) => void;

  updatePage: (partial: Partial<Page>) => void;
  addLayer: (layer: Layer, select?: boolean) => void;
  updateLayer: (id: string, partial: Partial<Layer>) => void;
  updateLayers: (ids: string[], partial: Partial<Layer>) => void;
  patchLayer: (id: string, fn: (layer: Layer) => Layer) => void;
  deleteSelected: () => void;
  duplicateSelected: () => void;
  reorderLayer: (id: string, dir: "up" | "down" | "top" | "bottom") => void;
  toggleVisible: (id: string) => void;
  toggleLocked: (id: string) => void;

  addTextAt: (x: number, y: number) => string;
  addShapeAt: (x: number, y: number, w: number, h: number) => string;
  addPath: (tool: "pencil" | "pen" | "highlighter", points: number[]) => string;
  addBezier: (points: BezierPoint[], closed: boolean) => string;
  setBezierPoints: (
    id: string,
    points: BezierPoint[],
    opts?: { normalize?: boolean },
  ) => void;
  addImageFromSrc: (
    src: string,
    opts?: {
      isRaw?: boolean;
      name?: string;
      width?: number;
      height?: number;
      x?: number;
      y?: number;
    },
  ) => string;
  placeCatalogItem: (id: string) => void;
  placeSavedElement: (id: string) => void;

  cut: () => void;
  copy: () => void;
  paste: () => void;

  alignSelected: (mode: AlignMode, target?: AlignTarget) => void;
  matchSelected: (dim: "width" | "height", target?: AlignTarget) => void;
  distributeSelected: (axis: "horizontal" | "vertical") => void;
  setTextAlign: (align: TextAlign) => void;
  nudge: (dx: number, dy: number) => void;
  applyAnchor: (anchor: Anchor) => void;
  addKeyframe: () => void;
  removeKeyframeAtPlayhead: () => void;
  rasterizeSelected: (dataUrl: string, width: number, height: number) => void;
  flattenPage: (dataUrl: string) => void;
}

function selected(state: EditorState): Layer[] {
  return state.layers.filter((l) => state.selectedIds.includes(l.id));
}

function rememberColor(recent: string[], color: string): string[] {
  return [color, ...recent.filter((c) => c !== color)].slice(0, 16);
}

export const useEditorStore = create<EditorState>()(
  temporal(
    (set, get) => ({
      page: createDefaultPage(),
      layers: [],
      selectedIds: [],
      tool: "select",
      shapeKind: "rect",
      shapeStroke: "#1c1916",
      shapeFillEnabled: true,
      shapeStrokeEnabled: true,
      shapeStrokeWidth: 2,
      shapeCornerRadius: 8,
      shapeSides: 6,
      shapeStarPoints: 5,
      shapeInnerRatio: 0.4,
      shapeArrowHead: 16,
      color: "#1c1916",
      highlight: "#f5d76e",
      zoom: 1,
      panX: 0,
      panY: 0,
      editingTextId: null,
      playhead: 0,
      duration: 4,
      playing: false,
      clipboard: null,
      pointer: { x: 0, y: 0 },
      recentColors: ["#1c1916", "#c45c26", "#d4a054", "#f7f1e6", "#8aa39b"],
      sidebarOpen: true,
      timelineOpen: true,
      snapGuides: [],

      setTool: (tool) => set({ tool, editingTextId: null }),
      setShapeKind: (shapeKind) => set({ shapeKind }),
      setShapeStroke: (shapeStroke) => set({ shapeStroke }),
      setShapeFillEnabled: (shapeFillEnabled) => set({ shapeFillEnabled }),
      setShapeStrokeEnabled: (shapeStrokeEnabled) => set({ shapeStrokeEnabled }),
      setShapeStrokeWidth: (shapeStrokeWidth) => set({ shapeStrokeWidth }),
      setShapeCornerRadius: (shapeCornerRadius) => set({ shapeCornerRadius }),
      setShapeSides: (shapeSides) => set({ shapeSides }),
      setShapeStarPoints: (shapeStarPoints) => set({ shapeStarPoints }),
      setShapeInnerRatio: (shapeInnerRatio) => set({ shapeInnerRatio }),
      setShapeArrowHead: (shapeArrowHead) => set({ shapeArrowHead }),
      setColor: (color) =>
        set((s) => ({ color, recentColors: rememberColor(s.recentColors, color) })),
      setHighlight: (highlight) => set({ highlight }),
      setZoom: (zoom) => set({ zoom: Math.max(0.15, Math.min(4, zoom)) }),
      zoomToward: (zoom, screenX, screenY) =>
        set((s) => {
          const next = Math.max(0.15, Math.min(4, zoom));
          const lx = (screenX - s.panX) / s.zoom;
          const ly = (screenY - s.panY) / s.zoom;
          return {
            zoom: next,
            panX: screenX - lx * next,
            panY: screenY - ly * next,
          };
        }),
      setPan: (panX, panY) => set({ panX, panY }),
      setPointer: (x, y) => set({ pointer: { x, y } }),
      setPlayhead: (playhead) => set({ playhead }),
      setDuration: (duration) => set({ duration }),
      setPlaying: (playing) => set({ playing }),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      setTimelineOpen: (timelineOpen) => set({ timelineOpen }),
      setSnapGuides: (snapGuides) => set({ snapGuides }),
      select: (ids, additive) =>
        set((s) => ({
          selectedIds: additive
            ? Array.from(new Set([...s.selectedIds, ...ids]))
            : ids,
        })),
      clearSelection: () => set({ selectedIds: [], editingTextId: null }),
      setEditingText: (editingTextId) => set({ editingTextId }),

      updatePage: (partial) =>
        set((s) => ({ page: { ...s.page, ...partial } })),

      addLayer: (layer, select = true) =>
        set((s) => ({
          layers: [...s.layers, layer],
          selectedIds: select ? [layer.id] : s.selectedIds,
        })),

      updateLayer: (id, partial) =>
        set((s) => ({
          layers: s.layers.map((l) =>
            l.id === id ? ({ ...l, ...partial } as Layer) : l,
          ),
        })),

      updateLayers: (ids, partial) =>
        set((s) => ({
          layers: s.layers.map((l) =>
            ids.includes(l.id) ? ({ ...l, ...partial } as Layer) : l,
          ),
        })),

      patchLayer: (id, fn) =>
        set((s) => ({
          layers: s.layers.map((l) => (l.id === id ? fn(l) : l)),
        })),

      deleteSelected: () =>
        set((s) => ({
          layers: s.layers.filter((l) => !s.selectedIds.includes(l.id) || l.locked),
          selectedIds: [],
          editingTextId: null,
        })),

      duplicateSelected: () =>
        set((s) => {
          const copies: Layer[] = selected(s).map((l) => ({
            ...structuredClone(l),
            id: `l_${Math.random().toString(36).slice(2, 12)}`,
            name: `${l.name} copy`,
            x: l.x + 16,
            y: l.y + 16,
          }));
          return {
            layers: [...s.layers, ...copies],
            selectedIds: copies.map((c) => c.id),
          };
        }),

      reorderLayer: (id, dir) =>
        set((s) => {
          const i = s.layers.findIndex((l) => l.id === id);
          if (i < 0) return s;
          const next = [...s.layers];
          const [item] = next.splice(i, 1);
          let j = i;
          if (dir === "up") j = Math.min(next.length, i + 1);
          if (dir === "down") j = Math.max(0, i - 1);
          if (dir === "top") j = next.length;
          if (dir === "bottom") j = 0;
          next.splice(j, 0, item);
          return { layers: next };
        }),

      toggleVisible: (id) =>
        set((s) => ({
          layers: s.layers.map((l) =>
            l.id === id ? { ...l, visible: !l.visible } : l,
          ),
        })),

      toggleLocked: (id) =>
        set((s) => ({
          layers: s.layers.map((l) =>
            l.id === id ? { ...l, locked: !l.locked } : l,
          ),
        })),

      addTextAt: (x, y) => {
        const layer = createTextLayer({ x, y });
        get().addLayer(layer);
        set({ editingTextId: layer.id, tool: "select" });
        return layer.id;
      },

      addShapeAt: (x, y, w, h) => {
        const s = get();
        const layer = createShapeLayer(s.shapeKind, {
          x,
          y,
          width: Math.max(8, w),
          height: Math.max(8, h),
          fill: s.color,
          stroke: s.shapeStroke,
          fillEnabled: s.shapeFillEnabled,
          strokeEnabled: s.shapeStrokeEnabled,
          strokeWidth: s.shapeStrokeWidth,
          cornerRadius: s.shapeKind === "rect" ? s.shapeCornerRadius : 0,
          sides: s.shapeSides,
          starPoints: s.shapeStarPoints,
          innerRatio: s.shapeInnerRatio,
          arrowHead: s.shapeArrowHead,
        });
        get().addLayer(layer);
        return layer.id;
      },

      addPath: (tool, points) => {
        const b = boundsOfPoints(points);
        const local = points.map((v, i) => (i % 2 === 0 ? v - b.x : v - b.y));
        const layer = createPathLayer(tool, local, {
          x: b.x,
          y: b.y,
          width: b.width,
          height: b.height,
          stroke: tool === "highlighter" ? get().highlight : get().color,
        });
        get().addLayer(layer);
        return layer.id;
      },

      addBezier: (points, closed) => {
        const geo = localizeBezier(points);
        const layer = createBezierLayer({
          points: geo.points,
          closed,
          x: geo.x,
          y: geo.y,
          width: geo.width,
          height: geo.height,
          stroke: get().color,
        });
        get().addLayer(layer);
        return layer.id;
      },

      setBezierPoints: (id, points, opts) => {
        set((s) => ({
          layers: s.layers.map((l) => {
            if (l.id !== id || l.type !== "bezier") return l;
            if (opts?.normalize) {
              const geo = localizeBezier(points);
              return {
                ...l,
                points: geo.points,
                x: l.x + geo.x,
                y: l.y + geo.y,
                width: geo.width,
                height: geo.height,
              };
            }
            const b = boundsOfBezier(points);
            return {
              ...l,
              points,
              width: Math.max(l.width, b.x + b.width),
              height: Math.max(l.height, b.y + b.height),
            };
          }),
        }));
      },

      addImageFromSrc: (src, opts) => {
        const page = get().page;
        const width = opts?.width ?? 360;
        const height = opts?.height ?? 240;
        const layer = createImageLayer(src, {
          isRaw: opts?.isRaw ?? false,
          name: opts?.name ?? "Image",
          width,
          height,
          x: opts?.x ?? Math.round((page.width - width) / 2),
          y: opts?.y ?? Math.round((page.height - height) / 2),
          adjustments: {
            ...createImageLayer(src).adjustments,
            raw: opts?.isRaw ?? false,
          },
        });
        get().addLayer(layer);
        return layer.id;
      },

      placeCatalogItem: (id) => {
        const item = ELEMENT_CATALOG.find((entry) => entry.id === id);
        if (!item) return;
        const s = get();
        const x = Math.round((s.page.width - item.width) / 2);
        const y = Math.round((s.page.height - item.height) / 2);
        if (item.kind === "stamp") {
          get().addImageFromSrc(item.src, {
            name: item.label,
            width: item.width,
            height: item.height,
            x,
            y,
          });
          return;
        }
        const defaults = item.defaults ?? {};
        const layer = createShapeLayer(item.shape, {
          name: item.label,
          x,
          y,
          width: item.width,
          height: item.height,
          fill: s.color,
          stroke: s.shapeStroke,
          fillEnabled: s.shapeFillEnabled,
          strokeEnabled: s.shapeStrokeEnabled,
          strokeWidth: s.shapeStrokeWidth,
          cornerRadius: s.shapeKind === "rect" ? s.shapeCornerRadius : 0,
          sides: s.shapeSides,
          starPoints: s.shapeStarPoints,
          innerRatio: s.shapeInnerRatio,
          arrowHead: s.shapeArrowHead,
          ...defaults,
        });
        get().addLayer(layer);
        set({
          shapeKind: item.shape,
          shapeCornerRadius: layer.cornerRadius,
          shapeSides: layer.sides,
          shapeStarPoints: layer.starPoints,
          shapeInnerRatio: layer.innerRatio,
          shapeArrowHead: layer.arrowHead,
          shapeFillEnabled: layer.fillEnabled,
          shapeStrokeEnabled: layer.strokeEnabled,
          shapeStrokeWidth: layer.strokeWidth,
        });
      },

      placeSavedElement: (id) => {
        const item = getSavedElements().find((entry) => entry.id === id);
        if (!item) return;
        const page = get().page;
        get().addLayer(cloneLayerOntoPage(item.layer, page.width, page.height));
      },

      cut: () => {
        const s = get();
        const clip = selected(s).filter((l) => !l.locked);
        set({
          clipboard: clip.map((l) => structuredClone(l)),
          layers: s.layers.filter((l) => !clip.some((c) => c.id === l.id)),
          selectedIds: [],
        });
      },

      copy: () => {
        const clip = selected(get()).map((l) => structuredClone(l));
        set({ clipboard: clip });
      },

      paste: () => {
        const clip = get().clipboard;
        if (!clip || clip.length === 0) return;
        const copies = clip.map((l) => ({
          ...structuredClone(l),
          id: `l_${Math.random().toString(36).slice(2, 12)}`,
          x: l.x + 24,
          y: l.y + 24,
        }));
        set((s) => ({
          layers: [...s.layers, ...copies],
          selectedIds: copies.map((c) => c.id),
        }));
      },

      alignSelected: (mode, target = "selection") =>
        set((s) => {
          const ids = new Set(s.selectedIds);
          const targets = s.layers.filter((l) => ids.has(l.id) && !l.locked);
          const resolved =
            targets.length < 2 && target === "selection" ? "page" : target;
          const frame = alignFrame(s.page, targets, resolved);
          const aligned = alignLayers(targets, mode, frame);
          const map = new Map(aligned.map((l) => [l.id, l]));
          return {
            layers: s.layers.map((l) => map.get(l.id) ?? l),
          };
        }),

      matchSelected: (dim, target = "selection") =>
        set((s) => {
          const order = s.selectedIds
            .map((id) => s.layers.find((l) => l.id === id))
            .filter((l): l is Layer => !!l && !l.locked);
          if (order.length === 0) return s;
          const resolved =
            order.length < 2 && target === "selection" ? "page" : target;
          let width = 0;
          let height = 0;
          let apply = order;
          if (resolved === "selection") {
            if (order.length < 2) return s;
            const key = layerAabb(order[0]);
            width = key.right - key.left;
            height = key.bottom - key.top;
            apply = order.slice(1);
          } else {
            const frame = alignFrame(s.page, order, resolved);
            width = frame.right - frame.left;
            height = frame.bottom - frame.top;
          }
          const ids = new Set(apply.map((l) => l.id));
          return {
            layers: s.layers.map((l) => {
              if (!ids.has(l.id)) return l;
              const box = layerAabb(l);
              const bw = Math.max(1, box.right - box.left);
              const bh = Math.max(1, box.bottom - box.top);
              return {
                ...l,
                width:
                  dim === "width"
                    ? Math.max(8, l.width * (width / bw))
                    : l.width,
                height:
                  dim === "height"
                    ? Math.max(8, l.height * (height / bh))
                    : l.height,
              };
            }),
          };
        }),

      distributeSelected: (axis) =>
        set((s) => {
          const ids = new Set(s.selectedIds);
          const targets = s.layers.filter((l) => ids.has(l.id) && !l.locked);
          const next = distributeLayers(targets, axis);
          const map = new Map(next.map((l) => [l.id, l]));
          return {
            layers: s.layers.map((l) => map.get(l.id) ?? l),
          };
        }),

      setTextAlign: (align) =>
        set((s) => ({
          layers: s.layers.map((l) =>
            s.selectedIds.includes(l.id) && l.type === "text"
              ? { ...l, align }
              : l,
          ),
        })),

      nudge: (dx, dy) =>
        set((s) => ({
          layers: s.layers.map((l) =>
            s.selectedIds.includes(l.id) && !l.locked
              ? { ...l, x: l.x + dx, y: l.y + dy }
              : l,
          ),
        })),

      applyAnchor: (anchor) =>
        set((s) => ({
          layers: s.layers.map((l) => {
            if (!s.selectedIds.includes(l.id) || l.type !== "text") return l;
            return { ...l, anchor };
          }),
        })),

      addKeyframe: () => {
        const t = get().playhead;
        set((s) => ({
          layers: s.layers.map((l) => {
            if (!s.selectedIds.includes(l.id)) return l;
            const rest = l.keyframes.filter((k) => Math.abs(k.time - t) > 0.04);
            return {
              ...l,
              keyframes: [
                ...rest,
                {
                  time: t,
                  x: l.x,
                  y: l.y,
                  rotation: l.rotation,
                  opacity: l.opacity,
                  scaleX: l.scaleX,
                  scaleY: l.scaleY,
                },
              ].sort((a, b) => a.time - b.time),
            };
          }),
        }));
      },

      removeKeyframeAtPlayhead: () => {
        const t = get().playhead;
        set((s) => ({
          layers: s.layers.map((l) =>
            s.selectedIds.includes(l.id)
              ? {
                  ...l,
                  keyframes: l.keyframes.filter((k) => Math.abs(k.time - t) > 0.04),
                }
              : l,
          ),
        }));
      },

      rasterizeSelected: (dataUrl, width, height) => {
        const s = get();
        const targets = selected(s);
        if (targets.length === 0) return;
        const minX = Math.min(...targets.map((l) => l.x));
        const minY = Math.min(...targets.map((l) => l.y));
        const image = createImageLayer(dataUrl, {
          name: "Raster",
          x: minX,
          y: minY,
          width,
          height,
        });
        const ids = new Set(s.selectedIds);
        set({
          layers: [...s.layers.filter((l) => !ids.has(l.id) || l.locked), image],
          selectedIds: [image.id],
        });
      },

      flattenPage: (dataUrl) => {
        const { page } = get();
        const image = createImageLayer(dataUrl, {
          name: "Flattened page",
          x: 0,
          y: 0,
          width: page.width,
          height: page.height,
        });
        set({ layers: [image], selectedIds: [image.id] });
      },
    }),
    {
      limit: 80,
      partialize: (s) =>
        ({
          page: s.page,
          layers: s.layers,
        }) as unknown as EditorState,
      equality: (a, b) => a.page === b.page && a.layers === b.layers,
    },
  ),
);

export function useTemporalStore(): TemporalState<EditorState>;
export function useTemporalStore<T>(
  selector: (state: TemporalState<EditorState>) => T,
): T;
export function useTemporalStore<T>(
  selector?: (state: TemporalState<EditorState>) => T,
) {
  return useStoreWithEqualityFn(
    useEditorStore.temporal,
    selector ?? ((s) => s as T),
  );
}

export function pauseHistory() {
  useEditorStore.temporal.getState().pause();
}

export function resumeHistory() {
  useEditorStore.temporal.getState().resume();
}

export function seedDocument() {
  try {
    const s = useEditorStore.getState();
    if (s.layers.length > 0) return;
    useEditorStore.setState({
      page: createDefaultPage(),
      layers: createStarterLayers(),
    });
    useEditorStore.temporal.getState().clear();
  } catch (err) {
    console.error("Could not seed the starter page", err);
  }
}

export function primarySelected(): Layer | undefined {
  const { layers, selectedIds } = useEditorStore.getState();
  return layers.find((l) => l.id === selectedIds[0]);
}

export function getSelectedLayers(): Layer[] {
  const { layers, selectedIds } = useEditorStore.getState();
  return layers.filter((l) => selectedIds.includes(l.id));
}

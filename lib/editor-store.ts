"use client";

import { create } from "zustand";
import { temporal } from "zundo";
import { useStoreWithEqualityFn } from "zustand/traditional";
import type { TemporalState } from "zundo";
import { alignLayers, type AlignMode, boundsOfPoints } from "./geometry";
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

type Clipboard = Layer[] | null;

interface EditorState {
  page: Page;
  layers: Layer[];
  selectedIds: string[];
  tool: Tool;
  shapeKind: ShapeKind;
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

  setTool: (tool: Tool) => void;
  setShapeKind: (kind: ShapeKind) => void;
  setColor: (color: string) => void;
  setHighlight: (color: string) => void;
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  setPointer: (x: number, y: number) => void;
  setPlayhead: (t: number) => void;
  setDuration: (t: number) => void;
  setPlaying: (p: boolean) => void;
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
  addImageFromSrc: (
    src: string,
    opts?: { isRaw?: boolean; name?: string; width?: number; height?: number },
  ) => string;

  cut: () => void;
  copy: () => void;
  paste: () => void;

  alignSelected: (mode: AlignMode) => void;
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

      setTool: (tool) => set({ tool, editingTextId: null }),
      setShapeKind: (shapeKind) => set({ shapeKind }),
      setColor: (color) =>
        set((s) => ({ color, recentColors: rememberColor(s.recentColors, color) })),
      setHighlight: (highlight) => set({ highlight }),
      setZoom: (zoom) => set({ zoom: Math.max(0.15, Math.min(4, zoom)) }),
      setPan: (panX, panY) => set({ panX, panY }),
      setPointer: (x, y) => set({ pointer: { x, y } }),
      setPlayhead: (playhead) => set({ playhead }),
      setDuration: (duration) => set({ duration }),
      setPlaying: (playing) => set({ playing }),
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
        const layer = createShapeLayer(get().shapeKind, {
          x,
          y,
          width: Math.max(8, w),
          height: Math.max(8, h),
          fill: get().color,
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
        const xs = points.map((p) => p.x);
        const ys = points.map((p) => p.y);
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        const maxX = Math.max(...xs);
        const maxY = Math.max(...ys);
        const local = points.map((p) => ({
          ...p,
          x: p.x - minX,
          y: p.y - minY,
        }));
        const layer = createBezierLayer({
          points: local,
          closed,
          x: minX,
          y: minY,
          width: Math.max(8, maxX - minX),
          height: Math.max(8, maxY - minY),
          stroke: get().color,
        });
        get().addLayer(layer);
        return layer.id;
      },

      addImageFromSrc: (src, opts) => {
        const layer = createImageLayer(src, {
          isRaw: opts?.isRaw ?? false,
          name: opts?.name ?? "Image",
          width: opts?.width ?? 360,
          height: opts?.height ?? 240,
          adjustments: {
            ...createImageLayer(src).adjustments,
            raw: opts?.isRaw ?? false,
          },
        });
        get().addLayer(layer);
        return layer.id;
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

      alignSelected: (mode) =>
        set((s) => {
          const ids = new Set(s.selectedIds);
          const targets = s.layers.filter((l) => ids.has(l.id) && !l.locked);
          const aligned = alignLayers(targets, mode);
          const map = new Map(aligned.map((l) => [l.id, l]));
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
      limit: 60,
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
    selector!,
  );
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

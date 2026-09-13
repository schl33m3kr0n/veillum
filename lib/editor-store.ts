"use client";

import { create } from "zustand";
import { temporal } from "zundo";
import { useStoreWithEqualityFn } from "zustand/traditional";
import type { TemporalState } from "zundo";
import { sampleCompassArc } from "./compass";
import { alignFrame, alignLayers, distributeLayers, type AlignMode, type AlignTarget, boundsOfBezier, boundsOfPoints, localizeBezier } from "./geometry";
import { flipLayer, layerAabb } from "./transform";
import { clampWedge } from "./shapes";
import { combineLayers, isCombinable, type CombineMode } from "./combine";
import { applyGroup, applyUngroup, expandSelection, remapGroupIds } from "./groups";
import { mirrorCopy, mirrorLayer, symmetricCopies } from "./symmetry";
import type { SnapGuide } from "./snap";
import {
  createBezierLayer,
  createDefaultPage,
  createImageLayer,
  createPathLayer,
  createShapeLayer,
  createTextLayer,
  migrateDocument,
} from "./document";
import type {
  Anchor,
  BezierPoint,
  FillStyle,
  FillStop,
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
import { pageFromSize, type PageSizePreset } from "./page-sizes";
import { framePage } from "./stage";
import { templateById } from "./templates";
import { clearFileHandle } from "./project-file";

type Clipboard = Layer[] | null;

interface EditorState {
  page: Page;
  layers: Layer[];
  selectedIds: string[];
  tool: Tool;
  shapeKind: ShapeKind;
  shapeStroke: string;
  shapeFillEnabled: boolean;
  shapeFillStyle: FillStyle;
  shapeFillTo: string;
  shapeFillStops: FillStop[];
  shapeFillAngle: number;
  shapeStrokeEnabled: boolean;
  shapeStrokeWidth: number;
  shapeCornerRadius: number;
  shapeSides: number;
  shapeStarPoints: number;
  shapeInnerRatio: number;
  shapeArrowHead: number;
  shapeWedge: number;
  shapeTrackFill: string;
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
  colorLoupe: boolean;
  sidebarOpen: boolean;
  sidebarTab: "properties" | "layers";
  timelineOpen: boolean;
  snapGuides: SnapGuide[];
  startOpen: boolean;
  sessionReady: boolean;
  hasDocument: boolean;
  saveStatus: "idle" | "saving" | "saved" | "error";
  savedAt: number | null;
  fileName: string | null;
  siteId: string | null;
  fileError: string | null;
  bgBusyId: string | null;
  bgBusyNote: string;

  setTool: (tool: Tool) => void;
  setStartOpen: (open: boolean) => void;
  startBlank: (preset: PageSizePreset) => void;
  loadTemplate: (id: string) => void;
  setShapeKind: (kind: ShapeKind) => void;
  setShapeStroke: (color: string) => void;
  setShapeFillEnabled: (enabled: boolean) => void;
  setShapeFillStyle: (style: FillStyle) => void;
  setShapeFillTo: (color: string) => void;
  setShapeFillStops: (stops: FillStop[]) => void;
  setShapeFillAngle: (angle: number) => void;
  setShapeStrokeEnabled: (enabled: boolean) => void;
  setShapeStrokeWidth: (width: number) => void;
  setShapeCornerRadius: (radius: number) => void;
  setShapeSides: (sides: number) => void;
  setShapeStarPoints: (points: number) => void;
  setShapeInnerRatio: (ratio: number) => void;
  setShapeArrowHead: (size: number) => void;
  setShapeWedge: (wedge: number) => void;
  setShapeTrackFill: (color: string) => void;
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
  setSidebarTab: (tab: "properties" | "layers") => void;
  setTimelineOpen: (open: boolean) => void;
  setSnapGuides: (guides: SnapGuide[]) => void;
  select: (ids: string[], additive?: boolean) => void;
  clearSelection: () => void;
  setEditingText: (id: string | null) => void;

  updatePage: (partial: Partial<Page>) => void;
  addLayer: (layer: Layer, select?: boolean) => void;
  updateLayer: (id: string, partial: Partial<Layer>) => void;
  updateLayers: (ids: string[], partial: Partial<Layer>) => void;
  patchSelected: (fn: (layer: Layer) => Partial<Layer> | null) => void;
  patchLayer: (id: string, fn: (layer: Layer) => Layer) => void;
  deleteSelected: () => void;
  duplicateSelected: () => void;
  reorderLayer: (id: string, dir: "up" | "down" | "top" | "bottom") => void;
  reorderSelected: (dir: "up" | "down" | "top" | "bottom") => void;
  toggleVisible: (id: string) => void;
  toggleLocked: (id: string) => void;

  addTextAt: (x: number, y: number) => string;
  addShapeAt: (x: number, y: number, w: number, h: number) => string;
  addCompassCircle: (cx: number, cy: number, r: number) => string;
  addCompassArc: (
    cx: number,
    cy: number,
    r: number,
    start: number,
    sweep: number,
  ) => string;
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
  combineSelected: (mode: CombineMode) => void;
  groupSelected: () => void;
  ungroupSelected: () => void;
  distributeSelected: (axis: "horizontal" | "vertical") => void;
  flipSelected: (axis: "horizontal" | "vertical") => void;
  mirrorSelected: (axis: "horizontal" | "vertical", copy?: boolean) => void;
  duplicateSymmetric: () => void;
  setTextAlign: (align: TextAlign) => void;
  nudge: (dx: number, dy: number) => void;
  applyAnchor: (anchor: Anchor) => void;
  addKeyframe: () => void;
  removeKeyframeAtPlayhead: () => void;
  rasterizeSelected: (dataUrl: string, width: number, height: number) => void;
  flattenPage: (dataUrl: string) => void;
  setBgBusy: (id: string | null, note?: string) => void;
  setSessionReady: (ready: boolean) => void;
  setSaveStatus: (
    status: EditorState["saveStatus"],
    savedAt?: number | null,
  ) => void;
  hydrateDraft: (draft: {
    page: Page;
    layers: Layer[];
    recentColors?: string[];
    duration?: number;
    zoom?: number;
    panX?: number;
    panY?: number;
    sidebarOpen?: boolean;
    timelineOpen?: boolean;
    fileName?: string | null;
    siteId?: string | null;
  }) => void;
  setFileName: (fileName: string | null) => void;
  setSiteId: (siteId: string | null) => void;
  setFileError: (fileError: string | null) => void;
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
      shapeFillStyle: "solid" as FillStyle,
      shapeFillTo: "#f4d8a8",
      shapeFillStops: [
        { color: "#c45c26", pos: 0 },
        { color: "#f4d8a8", pos: 1 },
      ],
      shapeFillAngle: 0,
      shapeStrokeEnabled: true,
      shapeStrokeWidth: 2,
      shapeCornerRadius: 8,
      shapeSides: 6,
      shapeStarPoints: 5,
      shapeInnerRatio: 0.4,
      shapeArrowHead: 16,
      shapeWedge: 0.38,
      shapeTrackFill: "#efe6d8",
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
      colorLoupe: false,
      sidebarOpen: true,
      sidebarTab: "properties",
      timelineOpen: true,
      snapGuides: [],
      startOpen: true,
      sessionReady: false,
      hasDocument: false,
      saveStatus: "idle",
      savedAt: null,
      fileName: null,
      siteId: null,
      fileError: null,
      bgBusyId: null,
      bgBusyNote: "",

      setTool: (tool) =>
        set({ tool, editingTextId: null, colorLoupe: tool === "eyedropper" }),
      setBgBusy: (bgBusyId, note) =>
        set({ bgBusyId, bgBusyNote: note ?? (bgBusyId ? "Cutting out…" : "") }),
      setSessionReady: (sessionReady) => set({ sessionReady }),
      setSaveStatus: (saveStatus, savedAt) =>
        set({
          saveStatus,
          savedAt: savedAt === undefined ? get().savedAt : savedAt,
        }),
      setFileName: (fileName) => set({ fileName, fileError: null }),
      setSiteId: (siteId) => set({ siteId }),
      setFileError: (fileError) => set({ fileError }),
      hydrateDraft: (draft) => {
        const migrated = migrateDocument(draft.page, draft.layers);
        const framed = draft.zoom == null ? framePage(migrated.page) : null;
        useEditorStore.temporal.getState().pause();
        set({
          page: migrated.page,
          layers: migrated.layers,
          recentColors: draft.recentColors ?? get().recentColors,
          duration: draft.duration ?? get().duration,
          zoom: framed ? framed.zoom : (draft.zoom as number),
          panX: framed ? framed.panX : (draft.panX ?? 0),
          panY: framed ? framed.panY : (draft.panY ?? 0),
          sidebarOpen: draft.sidebarOpen ?? true,
          timelineOpen: draft.timelineOpen ?? true,
          selectedIds: [],
          editingTextId: null,
          startOpen: false,
          hasDocument: true,
          sessionReady: true,
          playing: false,
          playhead: 0,
          tool: "select",
          snapGuides: [],
          fileName: draft.fileName === undefined ? get().fileName : draft.fileName,
          siteId: draft.siteId === undefined ? get().siteId : draft.siteId,
          fileError: null,
        });
        useEditorStore.temporal.getState().clear();
        useEditorStore.temporal.getState().resume();
      },
      setStartOpen: (startOpen) => set({ startOpen }),
      startBlank: (preset) => {
        const page = pageFromSize(preset);
        clearFileHandle();
        set({
          page,
          layers: [],
          selectedIds: [],
          editingTextId: null,
          startOpen: false,
          hasDocument: true,
          fileName: null,
          siteId: null,
          fileError: null,
          tool: "select",
          playhead: 0,
          playing: false,
          snapGuides: [],
          ...framePage(page),
        });
        useEditorStore.temporal.getState().clear();
      },
      loadTemplate: (id) => {
        const item = templateById(id);
        if (!item) return;
        const page = item.page();
        clearFileHandle();
        set({
          page,
          layers: item.layers(),
          selectedIds: [],
          editingTextId: null,
          startOpen: false,
          hasDocument: true,
          fileName: null,
          siteId: null,
          fileError: null,
          tool: "select",
          playhead: 0,
          playing: false,
          snapGuides: [],
          ...framePage(page),
        });
        useEditorStore.temporal.getState().clear();
      },
      setShapeKind: (shapeKind) => set({ shapeKind }),
      setShapeStroke: (shapeStroke) => set({ shapeStroke }),
      setShapeFillEnabled: (shapeFillEnabled) => set({ shapeFillEnabled }),
      setShapeFillStyle: (shapeFillStyle) => set({ shapeFillStyle }),
      setShapeFillTo: (shapeFillTo) => set({ shapeFillTo }),
      setShapeFillStops: (shapeFillStops) => set({ shapeFillStops }),
      setShapeFillAngle: (shapeFillAngle) => set({ shapeFillAngle }),
      setShapeStrokeEnabled: (shapeStrokeEnabled) => set({ shapeStrokeEnabled }),
      setShapeStrokeWidth: (shapeStrokeWidth) => set({ shapeStrokeWidth }),
      setShapeCornerRadius: (shapeCornerRadius) => set({ shapeCornerRadius }),
      setShapeSides: (shapeSides) => set({ shapeSides }),
      setShapeStarPoints: (shapeStarPoints) => set({ shapeStarPoints }),
      setShapeInnerRatio: (shapeInnerRatio) => set({ shapeInnerRatio }),
      setShapeArrowHead: (shapeArrowHead) => set({ shapeArrowHead }),
      setShapeWedge: (shapeWedge) => set({ shapeWedge: clampWedge(shapeWedge) }),
      setShapeTrackFill: (shapeTrackFill) => set({ shapeTrackFill }),
      setColor: (color) =>
        set((s) => ({
          color,
          recentColors: rememberColor(s.recentColors, color),
          colorLoupe: s.tool === "eyedropper" ? false : s.colorLoupe,
        })),
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
      setDuration: (duration) =>
        set((s) => {
          const next = Math.max(0.5, Math.min(600, duration));
          return {
            duration: next,
            playhead: Math.min(s.playhead, next),
          };
        }),
      setPlaying: (playing) => set({ playing }),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      setSidebarTab: (sidebarTab) => set({ sidebarTab }),
      setTimelineOpen: (timelineOpen) => set({ timelineOpen }),
      setSnapGuides: (snapGuides) => set({ snapGuides }),
      select: (ids, additive) =>
        set((s) => {
          const expanded = expandSelection(s.layers, ids);
          return {
            selectedIds: additive
              ? Array.from(new Set([...s.selectedIds, ...expanded]))
              : expanded,
          };
        }),
      clearSelection: () => set({ selectedIds: [], editingTextId: null }),
      setEditingText: (editingTextId) => set({ editingTextId }),

      updatePage: (partial) =>
        set((s) => ({ page: { ...s.page, ...partial } })),

      addLayer: (layer, select = true) =>
        set((s) => ({
          layers: [...s.layers, layer],
          selectedIds: select ? [layer.id] : s.selectedIds,
          hasDocument: true,
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

      patchSelected: (fn) =>
        set((s) => {
          const ids = new Set(expandSelection(s.layers, s.selectedIds));
          return {
            layers: s.layers.map((l) => {
              if (!ids.has(l.id) || l.locked) return l;
              const partial = fn(l);
              return partial ? ({ ...l, ...partial } as Layer) : l;
            }),
          };
        }),

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
          const copies = remapGroupIds(
            selected(s).map((l) => ({
              ...structuredClone(l),
              id: `l_${Math.random().toString(36).slice(2, 12)}`,
              name: `${l.name} copy`,
              x: l.x + 16,
              y: l.y + 16,
            })),
          );
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

      reorderSelected: (dir) =>
        set((s) => {
          const ids = new Set(s.selectedIds);
          if (ids.size === 0) return s;
          const moving = s.layers.filter((l) => ids.has(l.id));
          const keep = s.layers.filter((l) => !ids.has(l.id));
          if (moving.length === 0) return s;
          if (dir === "top") return { layers: [...keep, ...moving] };
          if (dir === "bottom") return { layers: [...moving, ...keep] };
          const indices = s.layers
            .map((l, i) => (ids.has(l.id) ? i : -1))
            .filter((i) => i >= 0);
          const minI = Math.min(...indices);
          const maxI = Math.max(...indices);
          const next = [...s.layers];
          if (dir === "up") {
            if (maxI >= next.length - 1) return s;
            const [above] = next.splice(maxI + 1, 1);
            next.splice(minI, 0, above);
            return { layers: next };
          }
          if (minI <= 0) return s;
          const [below] = next.splice(minI - 1, 1);
          next.splice(maxI, 0, below);
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
          fillStyle: s.shapeFillStyle,
          fillTo: s.shapeFillTo,
          fillStops: s.shapeFillStops,
          fillAngle: s.shapeFillAngle,
          strokeEnabled: s.shapeStrokeEnabled,
          strokeWidth: s.shapeStrokeWidth,
          cornerRadius: s.shapeKind === "rect" ? s.shapeCornerRadius : 0,
          sides: s.shapeSides,
          starPoints: s.shapeStarPoints,
          innerRatio: s.shapeInnerRatio,
          arrowHead: s.shapeArrowHead,
          wedge: s.shapeWedge,
          trackFill: s.shapeTrackFill,
        });
        get().addLayer(layer);
        return layer.id;
      },

      addCompassCircle: (cx, cy, r) => {
        const s = get();
        const d = Math.max(8, r * 2);
        const layer = createShapeLayer("ellipse", {
          name: "Compass",
          x: cx - d / 2,
          y: cy - d / 2,
          width: d,
          height: d,
          lockProportions: true,
          fill: s.color,
          stroke: s.color,
          fillEnabled: false,
          strokeEnabled: true,
          strokeWidth: Math.max(1.25, s.shapeStrokeWidth),
          fillStyle: s.shapeFillStyle,
          fillTo: s.shapeFillTo,
          fillStops: s.shapeFillStops,
          fillAngle: s.shapeFillAngle,
        });
        get().addLayer(layer);
        return layer.id;
      },

      addCompassArc: (cx, cy, r, start, sweep) => {
        if (Math.abs(sweep) >= Math.PI * 2 - 0.02) {
          return get().addCompassCircle(cx, cy, r);
        }
        const s = get();
        const points = sampleCompassArc(cx, cy, r, start, sweep);
        const b = boundsOfPoints(points);
        const local = points.map((v, i) => (i % 2 === 0 ? v - b.x : v - b.y));
        const layer = createPathLayer("pen", local, {
          name: "Arc",
          x: b.x,
          y: b.y,
          width: Math.max(1, b.width),
          height: Math.max(1, b.height),
          stroke: s.color,
          strokeWidth: Math.max(1.25, s.shapeStrokeWidth),
          tension: 0,
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
          fillStyle: s.shapeFillStyle,
          fillTo: s.shapeFillTo,
          fillStops: s.shapeFillStops,
          fillAngle: s.shapeFillAngle,
          strokeEnabled: s.shapeStrokeEnabled,
          strokeWidth: s.shapeStrokeWidth,
          cornerRadius: s.shapeKind === "rect" ? s.shapeCornerRadius : 0,
          sides: s.shapeSides,
          starPoints: s.shapeStarPoints,
          innerRatio: s.shapeInnerRatio,
          arrowHead: s.shapeArrowHead,
          wedge: s.shapeWedge,
          trackFill: s.shapeTrackFill,
          ...defaults,
        });
        get().addLayer(layer);
        if (item.shape === "svg") return;
        set({
          shapeKind: item.shape,
          shapeCornerRadius: layer.cornerRadius,
          shapeSides: layer.sides,
          shapeStarPoints: layer.starPoints,
          shapeInnerRatio: layer.innerRatio,
          shapeArrowHead: layer.arrowHead,
          shapeWedge: layer.wedge,
          shapeTrackFill: layer.trackFill,
          shapeFillEnabled: layer.fillEnabled,
          shapeFillStyle: layer.fillStyle,
          shapeFillTo: layer.fillTo,
          shapeFillStops: layer.fillStops,
          shapeFillAngle: layer.fillAngle,
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
        const copies = remapGroupIds(
          clip.map((l) => ({
            ...structuredClone(l),
            id: `l_${Math.random().toString(36).slice(2, 12)}`,
            x: l.x + 24,
            y: l.y + 24,
          })),
        );
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

      combineSelected: (mode) => {
        const s = get();
        const picked = s.layers.filter(
          (l) => s.selectedIds.includes(l.id) && !l.locked,
        );
        const combined = combineLayers(picked, mode);
        if (!combined) return;
        const ids = new Set(picked.filter(isCombinable).map((l) => l.id));
        const last = s.layers.reduce((acc, l, i) => (ids.has(l.id) ? i : acc), 0);
        const next = s.layers.filter((l) => !ids.has(l.id));
        const at = Math.min(last - (s.layers.length - next.length) + 1, next.length);
        next.splice(Math.max(0, at), 0, combined);
        set({ layers: next, selectedIds: [combined.id], tool: "select" });
      },

      groupSelected: () =>
        set((s) => {
          const next = applyGroup(s.layers, s.selectedIds);
          if (!next) return s;
          return {
            layers: next,
            selectedIds: expandSelection(
              next,
              s.selectedIds.filter((id) =>
                next.some((l) => l.id === id && !l.locked),
              ),
            ),
          };
        }),

      ungroupSelected: () =>
        set((s) => {
          if (!s.selectedIds.some((id) => s.layers.find((l) => l.id === id)?.groupId)) {
            return s;
          }
          return { layers: applyUngroup(s.layers, s.selectedIds) };
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

      flipSelected: (axis) =>
        set((s) => {
          const ids = new Set(s.selectedIds);
          return {
            layers: s.layers.map((l) =>
              ids.has(l.id) && !l.locked ? flipLayer(l, axis) : l,
            ),
          };
        }),

      mirrorSelected: (axis, copy = true) =>
        set((s) => {
          const ids = new Set(s.selectedIds);
          const sources = s.layers.filter((l) => ids.has(l.id) && !l.locked);
          if (sources.length === 0) return s;
          if (copy) {
            const copies = remapGroupIds(
              sources.map((l) => mirrorCopy(l, s.page, axis)),
            );
            return {
              layers: [...s.layers, ...copies],
              selectedIds: copies.map((c) => c.id),
            };
          }
          const mapped = new Map(
            sources.map((l) => [l.id, mirrorLayer(l, s.page, axis)]),
          );
          return {
            layers: s.layers.map((l) => mapped.get(l.id) ?? l),
          };
        }),

      duplicateSymmetric: () =>
        set((s) => {
          if (s.page.symmetry?.mode === "none" || !s.page.symmetry?.mode) return s;
          const sources = selected(s).filter((l) => !l.locked);
          if (sources.length === 0) return s;
          const copies = remapGroupIds(
            sources.flatMap((l) => symmetricCopies(l, s.page)),
          );
          if (copies.length === 0) return s;
          return {
            layers: [...s.layers, ...copies],
            selectedIds: copies.map((c) => c.id),
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

type HistorySlice = { page: Page; layers: Layer[] };

let gestureDepth = 0;
let gestureSnapshot: HistorySlice | null = null;

function historySlice(s: { page: Page; layers: Layer[] }): HistorySlice {
  return { page: s.page, layers: s.layers };
}

/** Pause undo while a pointer drag is in progress. Nested calls share one snapshot. */
export function beginHistoryGesture() {
  if (gestureDepth === 0) {
    gestureSnapshot = historySlice(useEditorStore.getState());
    useEditorStore.temporal.getState().pause();
  }
  gestureDepth += 1;
}

/** Resume undo and record a single step from the gesture start to the live page. */
export function endHistoryGesture() {
  if (gestureDepth === 0) {
    useEditorStore.temporal.getState().resume();
    return;
  }
  gestureDepth -= 1;
  if (gestureDepth > 0) return;
  const snap = gestureSnapshot;
  gestureSnapshot = null;
  const temporal = useEditorStore.temporal.getState() as TemporalState<EditorState> & {
    _handleSet: (
      pastState: HistorySlice,
      replace: undefined,
      currentState: HistorySlice,
    ) => void;
  };
  temporal.resume();
  if (!snap) return;
  const current = historySlice(useEditorStore.getState());
  if (snap.page === current.page && snap.layers === current.layers) return;
  temporal._handleSet(snap, undefined, current);
}

export function pauseHistory() {
  beginHistoryGesture();
}

export function resumeHistory() {
  if (gestureDepth > 0) {
    gestureDepth = 1;
    endHistoryGesture();
    return;
  }
  gestureSnapshot = null;
  useEditorStore.temporal.getState().resume();
}

export function primarySelected(): Layer | undefined {
  const { layers, selectedIds } = useEditorStore.getState();
  return layers.find((l) => l.id === selectedIds[0]);
}

export function getSelectedLayers(): Layer[] {
  const { layers, selectedIds } = useEditorStore.getState();
  return layers.filter((l) => selectedIds.includes(l.id));
}

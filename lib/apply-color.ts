import { useEditorStore } from "./editor-store";
import type { Layer } from "./types";
import {
  applyRangeMarks,
  getApplyTextRange,
  normalizeSpans,
  spansToText,
} from "./text-spans";

function paintOne(layer: Layer, next: string): Partial<Layer> | null {
  if (layer.type === "text") {
    const live = getApplyTextRange(layer.id);
    if (live) {
      const spans = applyRangeMarks(normalizeSpans(layer), live, { color: next });
      return { spans, text: spansToText(spans) };
    }
    return { color: next };
  }
  if (layer.type === "shape") {
    if (layer.fillEnabled === false && layer.strokeEnabled) {
      return { stroke: next, strokeEnabled: true };
    }
    const stops = layer.fillStops?.map((s, i) =>
      i === 0 ? { ...s, color: next } : s,
    );
    return { fill: next, fillEnabled: true, fillStops: stops };
  }
  if (layer.type === "path") return { stroke: next };
  if (layer.type === "bezier") {
    if (layer.fillEnabled) {
      const stops = layer.fillStops?.map((s, i) =>
        i === 0 ? { ...s, color: next } : s,
      );
      return { fill: next, fillStops: stops };
    }
    return { stroke: next };
  }
  return null;
}

/** Apply a picked color to the studio swatch and every selected layer. */
export function applyStudioColor(next: string) {
  const store = useEditorStore.getState();
  store.setColor(next);
  const ids = store.selectedIds;
  if (ids.length === 0) return;
  const first = store.layers.find((l) => l.id === ids[0]);
  if (first?.type === "shape" && !(first.fillEnabled === false && first.strokeEnabled)) {
    store.setShapeFillEnabled(true);
  }
  store.patchSelected((layer) => paintOne(layer, next));
}

/** Clear fill, or stroke if fill is already off, on every selected layer. */
export function applyStudioNone() {
  const store = useEditorStore.getState();
  const ids = store.selectedIds;
  if (ids.length === 0) {
    store.setShapeFillEnabled(false);
    return;
  }
  let clearedFill = false;
  let clearedStroke = false;
  store.patchSelected((layer) => {
    if (layer.type === "shape") {
      if (layer.fillEnabled !== false) {
        clearedFill = true;
        return { fillEnabled: false };
      }
      if (layer.strokeEnabled !== false) {
        clearedStroke = true;
        return { strokeEnabled: false };
      }
      return null;
    }
    if (layer.type === "bezier" && layer.fillEnabled) {
      clearedFill = true;
      return { fillEnabled: false };
    }
    return null;
  });
  if (clearedFill) store.setShapeFillEnabled(false);
  if (clearedStroke) store.setShapeStrokeEnabled(false);
}

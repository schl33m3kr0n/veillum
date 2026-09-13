import { useEditorStore } from "./editor-store";
import {
  applyRangeMarks,
  getApplyTextRange,
  normalizeSpans,
  spansToText,
} from "./text-spans";

/** Apply a picked color to the studio swatch and the primary selection. */
export function applyStudioColor(next: string) {
  const store = useEditorStore.getState();
  store.setColor(next);
  const selected = store.layers.find((l) => store.selectedIds.includes(l.id));
  if (!selected) return;
  if (selected.type === "text") {
    const live = getApplyTextRange(selected.id);
    if (live) {
      const spans = applyRangeMarks(normalizeSpans(selected), live, {
        color: next,
      });
      store.updateLayer(selected.id, { spans, text: spansToText(spans) });
    } else {
      store.updateLayer(selected.id, { color: next });
    }
    return;
  }
  if (selected.type === "shape") {
    if (selected.fillEnabled === false && selected.strokeEnabled) {
      store.updateLayer(selected.id, { stroke: next, strokeEnabled: true });
    } else {
      const stops = selected.fillStops?.map((s, i) =>
        i === 0 ? { ...s, color: next } : s,
      );
      store.updateLayer(selected.id, {
        fill: next,
        fillEnabled: true,
        fillStops: stops,
      });
      store.setShapeFillEnabled(true);
    }
    return;
  }
  if (selected.type === "path" || selected.type === "bezier") {
    if (selected.type === "bezier" && selected.fillEnabled) {
      const stops = selected.fillStops?.map((s, i) =>
        i === 0 ? { ...s, color: next } : s,
      );
      store.updateLayer(selected.id, { fill: next, fillStops: stops });
    } else {
      store.updateLayer(selected.id, { stroke: next });
    }
  }
}

/** Clear fill, or stroke if fill is already off. */
export function applyStudioNone() {
  const store = useEditorStore.getState();
  const selected = store.layers.find((l) => store.selectedIds.includes(l.id));
  if (!selected) {
    store.setShapeFillEnabled(false);
    return;
  }
  if (selected.type === "shape") {
    if (selected.fillEnabled !== false) {
      store.updateLayer(selected.id, { fillEnabled: false });
      store.setShapeFillEnabled(false);
    } else if (selected.strokeEnabled !== false) {
      store.updateLayer(selected.id, { strokeEnabled: false });
      store.setShapeStrokeEnabled(false);
    }
    return;
  }
  if (selected.type === "bezier" && selected.fillEnabled) {
    store.updateLayer(selected.id, { fillEnabled: false });
  }
}

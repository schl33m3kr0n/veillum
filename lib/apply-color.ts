import { useEditorStore } from "./editor-store";

/** Apply a picked color to the studio swatch and the primary selection. */
export function applyStudioColor(next: string) {
  const store = useEditorStore.getState();
  store.setColor(next);
  const selected = store.layers.find((l) => store.selectedIds.includes(l.id));
  if (!selected) return;
  if (selected.type === "text") {
    store.updateLayer(selected.id, { color: next });
  } else if (selected.type === "shape") {
    if (selected.fillEnabled === false && selected.strokeEnabled) {
      store.updateLayer(selected.id, { stroke: next });
    } else {
      const stops = selected.fillStops?.map((s, i) =>
        i === 0 ? { ...s, color: next } : s,
      );
      store.updateLayer(selected.id, {
        fill: next,
        fillStops: stops,
      });
    }
  } else if (selected.type === "path" || selected.type === "bezier") {
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

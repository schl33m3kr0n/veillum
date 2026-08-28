"use client";

import { useEditorStore } from "@/lib/editor-store";
import type { TextLayer } from "@/lib/types";

export function TextOverlay() {
  const editingTextId = useEditorStore((s) => s.editingTextId);
  const layers = useEditorStore((s) => s.layers);
  const zoom = useEditorStore((s) => s.zoom);
  const panX = useEditorStore((s) => s.panX);
  const panY = useEditorStore((s) => s.panY);
  const layer = layers.find(
    (l): l is TextLayer => l.id === editingTextId && l.type === "text",
  );

  if (!layer) return null;

  const left = panX + (80 + layer.x) * zoom;
  const top = panY + (60 + layer.y) * zoom;

  return (
    <textarea
      autoFocus
      value={layer.text}
      onChange={(e) =>
        useEditorStore.getState().updateLayer(layer.id, { text: e.target.value })
      }
      onBlur={() => useEditorStore.getState().setEditingText(null)}
      className="absolute z-20 resize-none border border-primary bg-[#f7f1e6]/95 p-2 shadow-lg outline-none"
      style={{
        left,
        top,
        width: layer.width * zoom,
        height: Math.max(40, layer.height * zoom),
        fontFamily: layer.fontFamily,
        fontSize: layer.fontSize * zoom,
        fontWeight: layer.bold ? 700 : 400,
        fontStyle: layer.italic ? "italic" : "normal",
        color: layer.color,
        lineHeight: layer.lineHeight,
        letterSpacing: layer.letterSpacing,
        textAlign: layer.align === "justify" ? "justify" : layer.align,
      }}
    />
  );
}

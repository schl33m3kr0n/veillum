"use client";

import { useEditorStore } from "@/lib/editor-store";
import { PAGE_PAD_X, PAGE_PAD_Y } from "@/lib/stage";
import type { TextLayer } from "@/lib/types";
import { layerAabb } from "@/lib/transform";
import { TextFormatControls } from "./text-toolbar";
import { offsetsFromRoot, setLiveTextRange } from "@/lib/text-spans";

export function TextFormatBar() {
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const layers = useEditorStore((s) => s.layers);
  const zoom = useEditorStore((s) => s.zoom);
  const panX = useEditorStore((s) => s.panX);
  const panY = useEditorStore((s) => s.panY);
  const editingTextId = useEditorStore((s) => s.editingTextId);
  const tool = useEditorStore((s) => s.tool);

  const id = editingTextId ?? (selectedIds.length === 1 ? selectedIds[0] : null);
  const layer = layers.find((l): l is TextLayer => l.id === id && l.type === "text");
  if (!layer) return null;
  if (!editingTextId && tool !== "select") return null;

  const box = layerAabb(layer);
  const screen = {
    left: panX + (PAGE_PAD_X + box.left) * zoom,
    top: panY + (PAGE_PAD_Y + box.top) * zoom,
    width: (box.right - box.left) * zoom,
    height: (box.bottom - box.top) * zoom,
  };
  const barHeight = 44;
  const placeAbove = screen.top - barHeight - 8 >= 8;
  const top = placeAbove ? screen.top - 8 : screen.top + screen.height + 8;
  const center = screen.left + screen.width / 2;

  return (
    <div
      data-text-format-bar
      className="pointer-events-auto absolute z-30 max-w-[min(calc(100%-16px),720px)] rounded-xl border border-border/80 bg-card/95 px-1 py-1 shadow-lg backdrop-blur-sm"
      style={{
        left: center,
        top,
        transform: placeAbove ? "translate(-50%, -100%)" : "translate(-50%, 0)",
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        const editor = document.querySelector("[data-text-editor]");
        const editingId = useEditorStore.getState().editingTextId;
        if (editor instanceof HTMLElement && editingId) {
          const r = offsetsFromRoot(editor);
          setLiveTextRange({ id: editingId, ...r });
        }
        const target = e.target as HTMLElement;
        if (!target.closest("input, textarea, [contenteditable]")) {
          e.preventDefault();
        }
      }}
    >
      <TextFormatControls layer={layer} compact />
    </div>
  );
}

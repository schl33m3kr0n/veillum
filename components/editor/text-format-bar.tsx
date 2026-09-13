"use client";

import { useEditorStore } from "@/lib/editor-store";
import { PAGE_PAD_X, PAGE_PAD_Y, RULER_SIZE } from "@/lib/stage";
import type { TextLayer } from "@/lib/types";
import { layerAabb } from "@/lib/transform";
import { TextFormatControls } from "./text-toolbar";
import { pinTextFormatRange } from "@/lib/text-spans";

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
  const minTop = RULER_SIZE + 8;
  const aboveTop = screen.top - 8 - barHeight;
  const placeAbove = aboveTop >= minTop;
  const top = placeAbove
    ? screen.top - 8
    : Math.max(minTop, screen.top + screen.height + 8);
  const center = screen.left + screen.width / 2;

  return (
    <div
      data-text-format-bar
      className="pointer-events-auto absolute z-40 max-w-[min(calc(100%-24px),720px)] rounded-xl border border-border/80 bg-card px-1 py-1 shadow-lg"
      style={{
        left: `clamp(12px, ${center}px, calc(100% - 12px))`,
        top,
        transform: placeAbove ? "translate(-50%, -100%)" : "translate(-50%, 0)",
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        e.preventDefault();
        pinTextFormatRange(useEditorStore.getState().editingTextId);
      }}
    >
      <TextFormatControls layer={layer} compact />
    </div>
  );
}

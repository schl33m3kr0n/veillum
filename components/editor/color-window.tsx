"use client";

import { useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/lib/editor-store";
import { ColorPanel } from "./color-panel";

export function ColorWindow() {
  const tool = useEditorStore((s) => s.tool);
  const [pos, setPos] = useState({ x: 16, y: 16 });
  const drag = useRef<{ ox: number; oy: number; px: number; py: number } | null>(
    null,
  );

  if (tool !== "eyedropper") return null;

  const onTitleDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    drag.current = { ox: e.clientX, oy: e.clientY, px: pos.x, py: pos.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onTitleMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    setPos({
      x: Math.max(8, drag.current.px + (e.clientX - drag.current.ox)),
      y: Math.max(8, drag.current.py + (e.clientY - drag.current.oy)),
    });
  };

  return (
    <div
      className="absolute z-40 w-80 overflow-hidden rounded-xl border border-border/70 bg-card shadow-xl"
      style={{ left: pos.x, top: pos.y }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div
        className="flex cursor-grab items-center justify-between border-b border-border/60 bg-[#161310] px-3 py-1.5 active:cursor-grabbing"
        onPointerDown={onTitleDown}
        onPointerMove={onTitleMove}
        onPointerUp={() => {
          drag.current = null;
        }}
      >
        <span className="text-xs font-medium">Color</span>
        <Button
          size="icon-xs"
          variant="ghost"
          aria-label="Close color"
          onClick={() => useEditorStore.getState().setTool("select")}
        >
          <X />
        </Button>
      </div>
      <div className="max-h-[min(70vh,560px)] overflow-y-auto p-3">
        <ColorPanel />
      </div>
    </div>
  );
}

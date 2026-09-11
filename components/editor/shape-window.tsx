"use client";

import { useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/lib/editor-store";
import type { ShapeKind, ShapeLayer } from "@/lib/types";
import { SHAPE_KINDS } from "@/lib/shapes";
import { cn } from "@/lib/utils";
import { ShapeAdjustments } from "./shape-adjustments";

export function ShapeWindow() {
  const tool = useEditorStore((s) => s.tool);
  const shapeKind = useEditorStore((s) => s.shapeKind);
  const setShapeKind = useEditorStore((s) => s.setShapeKind);
  const color = useEditorStore((s) => s.color);
  const shapeStroke = useEditorStore((s) => s.shapeStroke);
  const fillEnabled = useEditorStore((s) => s.shapeFillEnabled);
  const setTool = useEditorStore((s) => s.setTool);
  const clearSelection = useEditorStore((s) => s.clearSelection);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const layers = useEditorStore((s) => s.layers);
  const selected = layers.find((l) => l.id === selectedIds[0]);
  const editing = selected?.type === "shape" ? selected : null;

  const [pos, setPos] = useState({ x: 16, y: 16 });
  const drag = useRef<{
    ox: number;
    oy: number;
    px: number;
    py: number;
  } | null>(null);

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

  const onTitleUp = () => {
    drag.current = null;
  };

  const pickKind = (id: ShapeKind) => {
    setShapeKind(id);
    if (editing) {
      useEditorStore.getState().updateLayer(editing.id, { shape: id });
    }
  };

  return (
    <div
      className="absolute z-30 w-[248px] overflow-hidden rounded-xl border border-border/80 bg-card shadow-2xl"
      style={{ left: pos.x, top: pos.y }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div
        className="flex h-8 cursor-grab items-center justify-between border-b border-border/70 bg-[#2a2622] px-2.5 text-[11px] font-medium text-white/85 active:cursor-grabbing"
        onPointerDown={onTitleDown}
        onPointerMove={onTitleMove}
        onPointerUp={onTitleUp}
      >
        <span>{editing ? "Adjust shape" : "Shapes"}</span>
        <Button
          size="icon-xs"
          variant="ghost"
          className="size-6 text-white/70 hover:bg-white/10 hover:text-white"
          aria-label="Close shapes"
          onClick={() => {
            if (tool === "shape") setTool("select");
            else clearSelection();
          }}
        >
          <X />
        </Button>
      </div>
      <div className="max-h-[min(70vh,520px)] space-y-3 overflow-y-auto p-3">
        <div className="grid grid-cols-4 gap-1.5">
          {SHAPE_KINDS.map((shape) => (
            <button
              key={shape.id}
              type="button"
              title={shape.label}
              onClick={() => pickKind(shape.id)}
              className={cn(
                "flex aspect-square items-center justify-center rounded-lg border bg-[#f7f1e6] transition-colors",
                (editing?.shape ?? shapeKind) === shape.id
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-border/70 hover:border-primary/50",
              )}
            >
              <ShapePreview
                kind={shape.id}
                fill={fillEnabled ? (editing?.fill ?? color) : "none"}
                stroke={editing?.stroke ?? shapeStroke}
              />
            </button>
          ))}
        </div>
        <p className="text-[11px] leading-snug text-muted-foreground">
          {editing
            ? "Sliders rewrite the selected shape. Change kind, fill, geometry, and size here."
            : `${SHAPE_KINDS.find((s) => s.id === shapeKind)?.label}. Drag on the page to draw it.`}
        </p>
        <ShapeAdjustments layer={editing} compact />
      </div>
    </div>
  );
}

function ShapePreview({
  kind,
  fill,
  stroke,
}: {
  kind: ShapeKind;
  fill: string;
  stroke: string;
}) {
  const w = 40;
  const h = 40;
  const sw = 1.75;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden>
      {kind === "rect" && (
        <rect x={6} y={8} width={28} height={24} rx={3} fill={fill} stroke={stroke} strokeWidth={sw} />
      )}
      {kind === "ellipse" && (
        <ellipse cx={20} cy={20} rx={14} ry={11} fill={fill} stroke={stroke} strokeWidth={sw} />
      )}
      {kind === "triangle" && (
        <polygon points="20,6 34,34 6,34" fill={fill} stroke={stroke} strokeWidth={sw} />
      )}
      {kind === "hexagon" && (
        <polygon
          points="20,6 32,13 32,27 20,34 8,27 8,13"
          fill={fill}
          stroke={stroke}
          strokeWidth={sw}
        />
      )}
      {kind === "star" && (
        <polygon
          points="20,6 23,16 34,16 25,22 28,33 20,26 12,33 15,22 6,16 17,16"
          fill={fill}
          stroke={stroke}
          strokeWidth={sw}
        />
      )}
      {kind === "line" && (
        <line x1={6} y1={20} x2={34} y2={20} stroke={stroke} strokeWidth={2.5} strokeLinecap="round" />
      )}
      {kind === "arrow" && (
        <>
          <line x1={6} y1={20} x2={26} y2={20} stroke={stroke} strokeWidth={2.5} />
          <polygon points="34,20 24,14 24,26" fill={stroke} />
        </>
      )}
    </svg>
  );
}

export type { ShapeLayer };

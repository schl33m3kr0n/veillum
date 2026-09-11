"use client";

import { useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useEditorStore } from "@/lib/editor-store";
import type { ShapeKind } from "@/lib/types";
import { cn } from "@/lib/utils";

const SHAPES: { id: ShapeKind; label: string }[] = [
  { id: "rect", label: "Rectangle" },
  { id: "ellipse", label: "Ellipse" },
  { id: "triangle", label: "Triangle" },
  { id: "hexagon", label: "Hexagon" },
  { id: "star", label: "Star" },
  { id: "line", label: "Line" },
  { id: "arrow", label: "Arrow" },
];

export function ShapeWindow() {
  const shapeKind = useEditorStore((s) => s.shapeKind);
  const setShapeKind = useEditorStore((s) => s.setShapeKind);
  const color = useEditorStore((s) => s.color);
  const setColor = useEditorStore((s) => s.setColor);
  const shapeStroke = useEditorStore((s) => s.shapeStroke);
  const setShapeStroke = useEditorStore((s) => s.setShapeStroke);
  const fillEnabled = useEditorStore((s) => s.shapeFillEnabled);
  const setFillEnabled = useEditorStore((s) => s.setShapeFillEnabled);
  const setTool = useEditorStore((s) => s.setTool);

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

  return (
    <div
      className="absolute z-30 w-[232px] overflow-hidden rounded-xl border border-border/80 bg-card shadow-2xl"
      style={{ left: pos.x, top: pos.y }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div
        className="flex h-8 cursor-grab items-center justify-between border-b border-border/70 bg-[#2a2622] px-2.5 text-[11px] font-medium text-white/85 active:cursor-grabbing"
        onPointerDown={onTitleDown}
        onPointerMove={onTitleMove}
        onPointerUp={onTitleUp}
      >
        <span>Shapes</span>
        <Button
          size="icon-xs"
          variant="ghost"
          className="size-6 text-white/70 hover:bg-white/10 hover:text-white"
          aria-label="Close shapes"
          onClick={() => setTool("select")}
        >
          <X />
        </Button>
      </div>
      <div className="space-y-3 p-3">
        <div className="grid grid-cols-4 gap-1.5">
          {SHAPES.map((shape) => (
            <button
              key={shape.id}
              type="button"
              title={shape.label}
              onClick={() => setShapeKind(shape.id)}
              className={cn(
                "flex aspect-square items-center justify-center rounded-lg border bg-[#f7f1e6] transition-colors",
                shapeKind === shape.id
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-border/70 hover:border-primary/50",
              )}
            >
              <ShapePreview
                kind={shape.id}
                fill={fillEnabled ? color : "none"}
                stroke={shapeStroke}
              />
            </button>
          ))}
        </div>
        <p className="text-[11px] leading-snug text-muted-foreground">
          {SHAPES.find((s) => s.id === shapeKind)?.label}. Drag on the page to
          draw it.
        </p>
        <div className="flex items-center justify-between">
          <Label className="text-[11px]">Fill</Label>
          <Switch
            size="sm"
            checked={fillEnabled}
            onCheckedChange={setFillEnabled}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1">
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Fill
            </span>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              disabled={!fillEnabled}
              className="h-8 w-full cursor-pointer rounded-md border border-border bg-background p-0.5 disabled:opacity-40"
            />
          </label>
          <label className="space-y-1">
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Stroke
            </span>
            <input
              type="color"
              value={shapeStroke}
              onChange={(e) => setShapeStroke(e.target.value)}
              className="h-8 w-full cursor-pointer rounded-md border border-border bg-background p-0.5"
            />
          </label>
        </div>
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
        <rect
          x={6}
          y={8}
          width={28}
          height={24}
          rx={3}
          fill={fill}
          stroke={stroke}
          strokeWidth={sw}
        />
      )}
      {kind === "ellipse" && (
        <ellipse
          cx={20}
          cy={20}
          rx={14}
          ry={11}
          fill={fill}
          stroke={stroke}
          strokeWidth={sw}
        />
      )}
      {kind === "triangle" && (
        <polygon
          points="20,6 34,34 6,34"
          fill={fill}
          stroke={stroke}
          strokeWidth={sw}
        />
      )}
      {kind === "hexagon" && (
        <polygon
          points={hexPoints(20, 20, 15, 13)}
          fill={fill}
          stroke={stroke}
          strokeWidth={sw}
        />
      )}
      {kind === "star" && (
        <polygon
          points={starPoints(20, 20, 15, 6)}
          fill={fill}
          stroke={stroke}
          strokeWidth={sw}
        />
      )}
      {kind === "line" && (
        <line
          x1={6}
          y1={20}
          x2={34}
          y2={20}
          stroke={stroke}
          strokeWidth={2.5}
          strokeLinecap="round"
        />
      )}
      {kind === "arrow" && (
        <>
          <line
            x1={6}
            y1={20}
            x2={26}
            y2={20}
            stroke={stroke}
            strokeWidth={2.5}
          />
          <polygon points="34,20 24,14 24,26" fill={stroke} />
        </>
      )}
    </svg>
  );
}

function hexPoints(cx: number, cy: number, rx: number, ry: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    return `${cx + rx * Math.cos(a)},${cy + ry * Math.sin(a)}`;
  }).join(" ");
}

function starPoints(cx: number, cy: number, outer: number, inner: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
  }
  return pts.join(" ");
}

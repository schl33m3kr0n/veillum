"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { BookmarkPlus, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ELEMENT_CATALOG,
  ELEMENT_GROUPS,
  deleteSavedElement,
  getSavedElements,
  saveLayerAsElement,
  subscribeSavedElements,
  type CatalogElement,
  type SavedElement,
} from "@/lib/elements";
import { useEditorStore } from "@/lib/editor-store";
import type { ShapeKind } from "@/lib/types";
import { SvgMarkContent } from "./html-layer";
import { ShapeAdjustments } from "./shape-adjustments";

export function ShapeWindow() {
  const tool = useEditorStore((s) => s.tool);
  const color = useEditorStore((s) => s.color);
  const shapeStroke = useEditorStore((s) => s.shapeStroke);
  const fillEnabled = useEditorStore((s) => s.shapeFillEnabled);
  const strokeEnabled = useEditorStore((s) => s.shapeStrokeEnabled);
  const setTool = useEditorStore((s) => s.setTool);
  const clearSelection = useEditorStore((s) => s.clearSelection);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const layers = useEditorStore((s) => s.layers);
  const selected = layers.find((l) => l.id === selectedIds[0]);
  const editing = selected?.type === "shape" ? selected : null;
  const saved = useSyncExternalStore(
    subscribeSavedElements,
    getSavedElements,
    getSavedElements,
  );

  const [query, setQuery] = useState("");
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

  const q = query.trim().toLowerCase();
  const matches = (label: string) => !q || label.toLowerCase().includes(q);
  const catalog = ELEMENT_CATALOG.filter((item) => matches(item.label));
  const savedVisible = saved.filter((item) => matches(item.name));

  const place = (item: CatalogElement) => {
    useEditorStore.getState().placeCatalogItem(item.id);
  };

  const saveSelection = () => {
    if (!selected) return;
    saveLayerAsElement(selected);
  };

  return (
    <div
      className="absolute z-30 w-[280px] overflow-hidden rounded-xl border border-border/80 bg-card shadow-2xl"
      style={{ left: pos.x, top: pos.y }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div
        className="flex h-8 cursor-grab items-center justify-between border-b border-border/70 bg-[#2a2622] px-2.5 text-[11px] font-medium text-white/85 active:cursor-grabbing"
        onPointerDown={onTitleDown}
        onPointerMove={onTitleMove}
        onPointerUp={onTitleUp}
      >
        <span>{editing ? "Adjust element" : "Elements"}</span>
        <Button
          size="icon-xs"
          variant="ghost"
          className="size-6 text-white/70 hover:bg-white/10 hover:text-white"
          aria-label="Close elements"
          onClick={() => {
            if (tool === "shape") setTool("select");
            else clearSelection();
          }}
        >
          <X />
        </Button>
      </div>
      <div className="max-h-[min(74vh,580px)] space-y-3 overflow-y-auto p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the library"
            className="h-8 pl-7 text-xs"
            aria-label="Search elements"
          />
        </div>
        <div className="flex gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="h-7 flex-1 text-[11px]"
            disabled={!selected}
            onClick={saveSelection}
          >
            <BookmarkPlus className="size-3.5" />
            Save selection
          </Button>
        </div>

        {ELEMENT_GROUPS.map((group) => {
          if (group === "Saved") {
            if (q && savedVisible.length === 0) return null;
            return (
              <section key={group} className="space-y-1.5">
                <h3 className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Saved
                </h3>
                {savedVisible.length === 0 ? (
                  <p className="text-[11px] leading-snug text-muted-foreground">
                    Nothing stored yet. Select a layer and save it here to reuse
                    on other pages.
                  </p>
                ) : (
                  <div className="grid grid-cols-4 gap-1.5">
                    {savedVisible.map((item) => (
                      <SavedTile key={item.id} item={item} />
                    ))}
                  </div>
                )}
              </section>
            );
          }

          const items = catalog.filter((item) => item.group === group);
          if (items.length === 0) return null;
          return (
            <section key={group} className="space-y-1.5">
              <h3 className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {group}
              </h3>
              <div className="grid grid-cols-4 gap-1.5">
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    title={item.label}
                    onClick={() => place(item)}
                    className="flex aspect-square flex-col items-center justify-center rounded-lg border border-border/70 bg-[#f7f1e6] px-0.5 transition-colors hover:border-primary/50"
                  >
                    <ElementPreview
                      item={item}
                      fill={
                        (editing?.fillEnabled ?? fillEnabled)
                          ? (editing?.fill ?? color)
                          : "none"
                      }
                      stroke={
                        (editing?.strokeEnabled ?? strokeEnabled)
                          ? (editing?.stroke ?? shapeStroke)
                          : "none"
                      }
                    />
                  </button>
                ))}
              </div>
            </section>
          );
        })}

        {catalog.length === 0 && savedVisible.length === 0 ? (
          <p className="text-[11px] text-muted-foreground">
            No elements match “{query}”.
          </p>
        ) : null}

        <p className="text-[11px] leading-snug text-muted-foreground">
          {editing
            ? "Sliders rewrite the selected element. Click a library item to place another copy."
            : "Click to place on the page. Basics can also be dragged out after you pick them."}
        </p>
        <ShapeAdjustments layer={editing} compact />
      </div>
    </div>
  );
}

function SavedTile({ item }: { item: SavedElement }) {
  return (
    <div className="relative">
      <button
        type="button"
        title={item.name}
        onClick={() => useEditorStore.getState().placeSavedElement(item.id)}
        className="flex aspect-square w-full items-center justify-center rounded-lg border border-border/70 bg-[#f7f1e6] hover:border-primary/50"
      >
        <span className="line-clamp-2 px-1 text-center text-[9px] leading-tight text-[#1a1612]">
          {item.name}
        </span>
      </button>
      <button
        type="button"
        aria-label={`Delete ${item.name}`}
        className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-[#2a2622] text-white/80 hover:text-white"
        onClick={(e) => {
          e.stopPropagation();
          deleteSavedElement(item.id);
        }}
      >
        <Trash2 className="size-2.5" />
      </button>
    </div>
  );
}

function ElementPreview({
  item,
  fill,
  stroke,
}: {
  item: CatalogElement;
  fill: string;
  stroke: string;
}) {
  if (item.shape === "svg") {
    return (
      <SvgMarkContent
        className="size-8"
        layer={{
          svgNodes: item.defaults?.svgNodes ?? [],
          svgViewBox: item.defaults?.svgViewBox ?? "0 0 64 64",
          fill,
          stroke,
          fillEnabled: item.defaults?.fillEnabled !== false,
          strokeEnabled: item.defaults?.strokeEnabled === true,
          strokeWidth: item.defaults?.strokeWidth ?? 2,
          dash: "solid",
        }}
      />
    );
  }
  return (
    <ShapePreview
      kind={item.shape}
      fill={item.defaults?.fillEnabled === false ? "none" : fill}
      stroke={item.defaults?.strokeEnabled === false ? "none" : stroke}
      sides={item.defaults?.sides}
    />
  );
}

function ShapePreview({
  kind,
  fill,
  stroke,
  sides,
}: {
  kind: ShapeKind;
  fill: string;
  stroke: string;
  sides?: number;
}) {
  const w = 40;
  const h = 40;
  const sw = 1.75;
  const n = sides ?? 6;
  const poly = Array.from({ length: n }, (_, i) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return `${20 + 13 * Math.cos(a)},${20 + 13 * Math.sin(a)}`;
  }).join(" ");
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
        <polygon points={poly} fill={fill} stroke={stroke} strokeWidth={sw} />
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
      {kind === "pie" && (
        <>
          <circle cx={20} cy={20} r={13} fill="#efe6d8" stroke={stroke} strokeWidth={sw} />
          <path d="M20 20 L20 7 A13 13 0 0 1 31.5 27 Z" fill={fill} />
        </>
      )}
    </svg>
  );
}

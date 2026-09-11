"use client";

import { useEffect, useRef } from "react";
import { useEditorStore } from "@/lib/editor-store";
import type { ShapeLayer } from "@/lib/types";
import { localToPage, pageToLocal, resizeFromHandle, rotateAroundCenter } from "@/lib/shapes";

const BOX = "#3b82f6";
const YELLOW = "#e8b923";

type BoxHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";
type AdjHandle = "radius" | "inner" | "head";
type Gizmo = BoxHandle | "rotate" | AdjHandle;

const BOX_HANDLES: { id: BoxHandle; x: number; y: number; cursor: string }[] = [
  { id: "nw", x: 0, y: 0, cursor: "nwse-resize" },
  { id: "n", x: 0.5, y: 0, cursor: "ns-resize" },
  { id: "ne", x: 1, y: 0, cursor: "nesw-resize" },
  { id: "e", x: 1, y: 0.5, cursor: "ew-resize" },
  { id: "se", x: 1, y: 1, cursor: "nwse-resize" },
  { id: "s", x: 0.5, y: 1, cursor: "ns-resize" },
  { id: "sw", x: 0, y: 1, cursor: "nesw-resize" },
  { id: "w", x: 0, y: 0.5, cursor: "ew-resize" },
];

export function ShapeGizmos({ layer }: { layer: ShapeLayer }) {
  const drag = useRef<{
    kind: Gizmo;
    origin: ShapeLayer;
    shift: boolean;
  } | null>(null);
  const layerRef = useRef(layer);
  layerRef.current = layer;

  const clientToPage = (clientX: number, clientY: number) => {
    const pageEl = document.querySelector("[data-vellum-page]");
    if (!pageEl) return null;
    const zoom = useEditorStore.getState().zoom;
    const rect = pageEl.getBoundingClientRect();
    return {
      x: (clientX - rect.left) / zoom,
      y: (clientY - rect.top) / zoom,
    };
  };

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!drag.current) return;
      const page = clientToPage(e.clientX, e.clientY);
      if (!page) return;
      const { kind, origin } = drag.current;
      const shift = e.shiftKey || drag.current.shift;
      const local = pageToLocal(origin, page.x, page.y);
      const s = useEditorStore.getState();

      if (kind === "rotate") {
        const next = rotateAroundCenter(origin, page.x, page.y);
        s.updateLayer(origin.id, { x: next.x, y: next.y, rotation: next.rotation });
        return;
      }
      if (kind === "radius") {
        const r = Math.max(0, Math.min(origin.width - local.x, Math.min(origin.width, origin.height) / 2));
        s.updateLayer(origin.id, { cornerRadius: r });
        return;
      }
      if (kind === "inner") {
        const cx = origin.width / 2;
        const cy = origin.height / 2;
        const n = Math.max(3, Math.round(origin.starPoints ?? 5));
        const a = -Math.PI / 2 + Math.PI / n;
        const outer = Math.hypot(
          (origin.width / 2) * Math.cos(a),
          (origin.height / 2) * Math.sin(a),
        );
        const dist = Math.hypot(local.x - cx, local.y - cy);
        s.updateLayer(origin.id, {
          innerRatio: Math.min(0.85, Math.max(0.12, dist / Math.max(1, outer))),
        });
        return;
      }
      if (kind === "head") {
        s.updateLayer(origin.id, {
          arrowHead: Math.max(8, Math.min(origin.width * 0.6, origin.width - local.x)),
        });
        return;
      }
      const next = resizeFromHandle(kind, local.x, local.y, origin, shift);
      s.updateLayer(origin.id, next);
    };

    const onUp = () => {
      if (!drag.current) return;
      drag.current = null;
      useEditorStore.temporal.getState().resume();
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [layer.id]);

  const start = (e: React.PointerEvent, kind: Gizmo) => {
    e.stopPropagation();
    e.preventDefault();
    drag.current = {
      kind,
      origin: { ...layerRef.current },
      shift: e.shiftKey,
    };
    useEditorStore.temporal.getState().pause();
  };

  const w = layer.width;
  const h = layer.height;
  const radiusX = w - Math.max(layer.cornerRadius ?? 0, 14);
  const inner = (() => {
    const n = Math.max(3, Math.round(layer.starPoints ?? 5));
    const a = -Math.PI / 2 + Math.PI / n;
    const ratio = layer.innerRatio ?? 0.4;
    return {
      x: w / 2 + (w / 2) * ratio * Math.cos(a),
      y: h / 2 + (h / 2) * ratio * Math.sin(a),
    };
  })();
  const headX = w - (layer.arrowHead ?? 16);

  const box = [
    localToPage(layer, 0, 0),
    localToPage(layer, w, 0),
    localToPage(layer, w, h),
    localToPage(layer, 0, h),
  ];
  const topMid = localToPage(layer, w / 2, 0);
  const rotPt = localToPage(layer, w / 2, -28);

  return (
    <svg
      className="absolute inset-0 h-full w-full overflow-visible"
      style={{ pointerEvents: "none", zIndex: 18 }}
    >
      <polygon
        points={box.map((p) => `${p.x},${p.y}`).join(" ")}
        fill="none"
        stroke={BOX}
        strokeWidth={1}
      />
      <line
        x1={topMid.x}
        y1={topMid.y}
        x2={rotPt.x}
        y2={rotPt.y}
        stroke={BOX}
        strokeWidth={1}
      />
      <circle
        cx={rotPt.x}
        cy={rotPt.y}
        r={12}
        fill="transparent"
        style={{ cursor: "grab", pointerEvents: "auto" }}
        onPointerDown={(e) => start(e, "rotate")}
      />
      <circle
        cx={rotPt.x}
        cy={rotPt.y}
        r={5.5}
        fill="#fff"
        stroke={BOX}
        strokeWidth={1.5}
        pointerEvents="none"
      />
      {BOX_HANDLES.map((handle) => {
        const p = localToPage(layer, handle.x * w, handle.y * h);
        return (
          <g key={handle.id}>
            <rect
              x={p.x - 8}
              y={p.y - 8}
              width={16}
              height={16}
              fill="transparent"
              style={{ cursor: handle.cursor, pointerEvents: "auto" }}
              onPointerDown={(e) => start(e, handle.id)}
            />
            <rect
              x={p.x - 4}
              y={p.y - 4}
              width={8}
              height={8}
              fill="#fff"
              stroke={BOX}
              strokeWidth={1.25}
              pointerEvents="none"
            />
          </g>
        );
      })}
      {layer.shape === "rect" && (
        <YellowHandle
          layer={layer}
          lx={radiusX}
          ly={0}
          title="Corner radius"
          onPointerDown={(e) => start(e, "radius")}
        />
      )}
      {layer.shape === "star" && (
        <YellowHandle
          layer={layer}
          lx={inner.x}
          ly={inner.y}
          title="Inner radius"
          onPointerDown={(e) => start(e, "inner")}
        />
      )}
      {layer.shape === "arrow" && (
        <YellowHandle
          layer={layer}
          lx={headX}
          ly={h / 2}
          title="Arrowhead"
          onPointerDown={(e) => start(e, "head")}
        />
      )}
    </svg>
  );
}

function YellowHandle({
  layer,
  lx,
  ly,
  title,
  onPointerDown,
}: {
  layer: ShapeLayer;
  lx: number;
  ly: number;
  title: string;
  onPointerDown: (e: React.PointerEvent) => void;
}) {
  const p = localToPage(layer, lx, ly);
  return (
    <g>
      <circle
        cx={p.x}
        cy={p.y}
        r={12}
        fill="transparent"
        style={{ cursor: "grab", pointerEvents: "auto" }}
        onPointerDown={onPointerDown}
      >
        <title>{title}</title>
      </circle>
      <circle
        cx={p.x}
        cy={p.y}
        r={5}
        fill={YELLOW}
        stroke="#8a6a10"
        strokeWidth={1.15}
        pointerEvents="none"
      />
    </g>
  );
}

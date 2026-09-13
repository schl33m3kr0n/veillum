"use client";

import { useEffect, useRef } from "react";
import { beginHistoryGesture, endHistoryGesture, useEditorStore } from "@/lib/editor-store";
import type { ShapeLayer } from "@/lib/types";
import { pieGeometry, wedgeFromLocal, frameLineFromEndpoints } from "@/lib/shapes";
import { localToPage, pageToLocal } from "@/lib/transform";
import { clientToLocal } from "@/lib/pointer-space";
import { snapPointToGrid } from "@/lib/snap";
import { symmetryMates } from "@/lib/symmetry";

const YELLOW = "#e8b923";

type AdjHandle = "radius" | "inner" | "head" | "wedge" | "start" | "end";

export function ShapeAdjustGizmos({ layer }: { layer: ShapeLayer }) {
  const drag = useRef<{ kind: AdjHandle; origin: ShapeLayer } | null>(null);
  const layerRef = useRef(layer);
  layerRef.current = layer;

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!drag.current) return;
      const pageEl = document.querySelector("[data-veillum-page]");
      if (!(pageEl instanceof HTMLElement)) return;
      const page = clientToLocal(pageEl, e.clientX, e.clientY);
      const { kind, origin } = drag.current;
      const local = pageToLocal(origin, page.x, page.y);
      const s = useEditorStore.getState();
      if (kind === "start" || kind === "end") {
        const midY = origin.height / 2;
        const fixed = localToPage(
          origin,
          kind === "start" ? origin.width : 0,
          midY,
        );
        const snappedMove = (() => {
          let moving = { x: page.x, y: page.y };
          if (e.shiftKey) {
            const dx = moving.x - fixed.x;
            const dy = moving.y - fixed.y;
            const len = Math.hypot(dx, dy);
            if (len > 0.5) {
              const step =
                s.page.grid.snap && s.page.grid.type === "radial"
                  ? (Math.PI * 2) / Math.max(4, s.page.grid.lines ?? 12)
                  : Math.PI / 8;
              const ang = Math.round(Math.atan2(dy, dx) / step) * step;
              moving = {
                x: fixed.x + Math.cos(ang) * len,
                y: fixed.y + Math.sin(ang) * len,
              };
            }
          }
          return snapPointToGrid(
            moving.x,
            moving.y,
            s.page,
            symmetryMates(fixed, s.page),
          );
        })();
        const moving = { x: snappedMove.x, y: snappedMove.y };
        const start = kind === "start" ? moving : fixed;
        const end = kind === "end" ? moving : fixed;
        s.updateLayer(origin.id, frameLineFromEndpoints(start, end, origin));
        s.setSnapGuides(snappedMove.guides);
        return;
      }
      if (kind === "radius") {
        const r = Math.max(
          0,
          Math.min(origin.width - local.x, Math.min(origin.width, origin.height) / 2),
        );
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
      if (kind === "wedge") {
        s.updateLayer(origin.id, {
          wedge: wedgeFromLocal(
            local.x,
            local.y,
            origin.width / 2,
            origin.height / 2,
          ),
        });
        return;
      }
      s.updateLayer(origin.id, {
        arrowHead: Math.max(8, Math.min(origin.width * 0.6, origin.width - local.x)),
      });
    };
    const onUp = () => {
      if (!drag.current) return;
      drag.current = null;
      useEditorStore.getState().setSnapGuides([]);
      endHistoryGesture();
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [layer.id]);

  const start = (e: React.PointerEvent, kind: AdjHandle) => {
    e.stopPropagation();
    if (e.cancelable) e.preventDefault();
    drag.current = { kind, origin: { ...layerRef.current } };
    beginHistoryGesture();
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
  const pie = pieGeometry(w, h, layer.wedge ?? 0.38, 0);
  const show =
    layer.shape === "rect" ||
    layer.shape === "star" ||
    layer.shape === "arrow" ||
    layer.shape === "line" ||
    layer.shape === "pie";
  if (!show) return null;

  return (
    <svg
      className="absolute inset-0 h-full w-full overflow-visible"
      style={{ pointerEvents: "none", zIndex: 21 }}
    >
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
      {(layer.shape === "line" || layer.shape === "arrow") && (
        <>
          <YellowHandle
            layer={layer}
            lx={0}
            ly={h / 2}
            title="Start"
            onPointerDown={(e) => start(e, "start")}
          />
          <YellowHandle
            layer={layer}
            lx={w}
            ly={h / 2}
            title="End"
            onPointerDown={(e) => start(e, "end")}
          />
        </>
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
      {layer.shape === "pie" && (
        <YellowHandle
          layer={layer}
          lx={pie.handleX}
          ly={pie.handleY}
          title="Wedge"
          onPointerDown={(e) => start(e, "wedge")}
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

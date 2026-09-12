"use client";

import { useEffect, useRef } from "react";
import { useEditorStore } from "@/lib/editor-store";
import type { Layer } from "@/lib/types";
import { snapAabbResize } from "@/lib/snap";
import {
  groupAabb,
  localToPage,
  pageToLocal,
  resizeFromHandle,
  resizeGroupFromHandle,
  rotateLayerAround,
  type HandleId,
} from "@/lib/transform";

const STROKE = "#6ea8ff";
const ROTATE = "#f5b4c0";
const ROTATE_STROKE = "#e0899a";

const HANDLES: { id: HandleId; x: number; y: number; cursor: string; kind: "corner" | "edge" }[] =
  [
    { id: "nw", x: 0, y: 0, cursor: "nwse-resize", kind: "corner" },
    { id: "n", x: 0.5, y: 0, cursor: "ns-resize", kind: "edge" },
    { id: "ne", x: 1, y: 0, cursor: "nesw-resize", kind: "corner" },
    { id: "e", x: 1, y: 0.5, cursor: "ew-resize", kind: "edge" },
    { id: "se", x: 1, y: 1, cursor: "nwse-resize", kind: "corner" },
    { id: "s", x: 0.5, y: 1, cursor: "ns-resize", kind: "edge" },
    { id: "sw", x: 0, y: 1, cursor: "nesw-resize", kind: "corner" },
    { id: "w", x: 0, y: 0.5, cursor: "ew-resize", kind: "edge" },
  ];

function clientToPage(clientX: number, clientY: number) {
  const pageEl = document.querySelector("[data-veillum-page]");
  if (!pageEl) return null;
  const zoom = useEditorStore.getState().zoom;
  const rect = pageEl.getBoundingClientRect();
  return {
    x: (clientX - rect.left) / zoom,
    y: (clientY - rect.top) / zoom,
  };
}

export function TransformGizmos({ layers }: { layers: Layer[] }) {
  if (layers.length === 1) return <SingleGizmo layer={layers[0]} />;
  if (layers.length > 1) return <GroupGizmo layers={layers} />;
  return null;
}

function SingleGizmo({ layer }: { layer: Layer }) {
  const drag = useRef<{
    kind: HandleId | "rotate";
    origin: Layer;
    startAngle: number;
    shift: boolean;
  } | null>(null);
  const layerRef = useRef(layer);
  layerRef.current = layer;

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!drag.current) return;
      const page = clientToPage(e.clientX, e.clientY);
      if (!page) return;
      const { kind, origin, startAngle } = drag.current;
      const shift = e.shiftKey || drag.current.shift;
      const s = useEditorStore.getState();
      if (kind === "rotate") {
        const center = {
          x: origin.x + ((origin.width * origin.scaleX) / 2) * Math.cos((origin.rotation * Math.PI) / 180) - ((origin.height * origin.scaleY) / 2) * Math.sin((origin.rotation * Math.PI) / 180),
          y: origin.y + ((origin.width * origin.scaleX) / 2) * Math.sin((origin.rotation * Math.PI) / 180) + ((origin.height * origin.scaleY) / 2) * Math.cos((origin.rotation * Math.PI) / 180),
        };
        let deg =
          (Math.atan2(page.y - center.y, page.x - center.x) * 180) / Math.PI +
          90 -
          startAngle;
        if (shift) deg = Math.round(deg / 15) * 15;
        const next = rotateLayerAround(origin, center, deg);
        s.updateLayer(origin.id, next);
        return;
      }
      const local = pageToLocal(origin, page.x, page.y);
      const next = resizeFromHandle(kind, local.x, local.y, origin, shift);
      const others = s.layers.filter((l) => l.id !== origin.id && l.visible);
      const snapped = snapAabbResize(
        { left: next.x, top: next.y, width: next.width, height: next.height },
        kind,
        others,
        s.page,
      );
      s.updateLayer(origin.id, {
        x: snapped.left,
        y: snapped.top,
        width: snapped.width,
        height: snapped.height,
      });
      s.setSnapGuides(snapped.guides);
    };
    const onUp = () => {
      if (!drag.current) return;
      drag.current = null;
      useEditorStore.getState().setSnapGuides([]);
      useEditorStore.temporal.getState().resume();
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [layer.id]);

  const start = (e: React.PointerEvent, kind: HandleId | "rotate") => {
    e.stopPropagation();
    e.preventDefault();
    const origin = { ...layerRef.current };
    const page = clientToPage(e.clientX, e.clientY);
    const cx = (origin.width * origin.scaleX) / 2;
    const cy = (origin.height * origin.scaleY) / 2;
    const old = (origin.rotation * Math.PI) / 180;
    const center = {
      x: origin.x + cx * Math.cos(old) - cy * Math.sin(old),
      y: origin.y + cx * Math.sin(old) + cy * Math.cos(old),
    };
    const startAngle = page
      ? (Math.atan2(page.y - center.y, page.x - center.x) * 180) / Math.PI + 90
      : 0;
    drag.current = { kind, origin, startAngle, shift: e.shiftKey };
    useEditorStore.temporal.getState().pause();
  };

  return (
    <GizmoSvg
      box={layer}
      rotation={layer.rotation}
      onStart={start}
    />
  );
}

function GroupGizmo({ layers }: { layers: Layer[] }) {
  const drag = useRef<{
    kind: HandleId | "rotate";
    origins: Layer[];
    box: { left: number; top: number; width: number; height: number };
    startAngle: number;
    shift: boolean;
  } | null>(null);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!drag.current) return;
      const page = clientToPage(e.clientX, e.clientY);
      if (!page) return;
      const { kind, origins, box, startAngle, shift } = drag.current;
      const lock = e.shiftKey || shift;
      const s = useEditorStore.getState();
      if (kind === "rotate") {
        const cx = box.left + box.width / 2;
        const cy = box.top + box.height / 2;
        let deg = (Math.atan2(page.y - cy, page.x - cx) * 180) / Math.PI + 90 - startAngle;
        if (lock) deg = Math.round(deg / 15) * 15;
        for (const origin of origins) {
          s.updateLayer(origin.id, rotateLayerAround(origin, { x: cx, y: cy }, deg));
        }
        return;
      }
      const nextBox = resizeGroupFromHandle(kind, page.x, page.y, box, lock);
      const others = s.layers.filter(
        (l) => !origins.some((o) => o.id === l.id) && l.visible,
      );
      const snapped = snapAabbResize(
        {
          left: nextBox.left,
          top: nextBox.top,
          width: nextBox.width,
          height: nextBox.height,
        },
        kind,
        others,
        s.page,
      );
      const sx = snapped.width / Math.max(1, box.width);
      const sy = snapped.height / Math.max(1, box.height);
      for (const origin of origins) {
        s.updateLayer(origin.id, {
          x: snapped.left + (origin.x - box.left) * sx,
          y: snapped.top + (origin.y - box.top) * sy,
          width: Math.max(8, origin.width * sx),
          height: Math.max(8, origin.height * sy),
        });
      }
      s.setSnapGuides(snapped.guides);
    };
    const onUp = () => {
      if (!drag.current) return;
      drag.current = null;
      useEditorStore.getState().setSnapGuides([]);
      useEditorStore.temporal.getState().resume();
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [layers.map((l) => l.id).join(",")]);

  const aabb = groupAabb(layers);
  const box = {
    x: aabb.left,
    y: aabb.top,
    width: aabb.width,
    height: aabb.height,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
  };

  const start = (e: React.PointerEvent, kind: HandleId | "rotate") => {
    e.stopPropagation();
    e.preventDefault();
    const page = clientToPage(e.clientX, e.clientY);
    const cx = aabb.left + aabb.width / 2;
    const cy = aabb.top + aabb.height / 2;
    const startAngle = page
      ? (Math.atan2(page.y - cy, page.x - cx) * 180) / Math.PI + 90
      : 0;
    drag.current = {
      kind,
      origins: layers.map((l) => ({ ...l })),
      box: { left: aabb.left, top: aabb.top, width: aabb.width, height: aabb.height },
      startAngle,
      shift: e.shiftKey,
    };
    useEditorStore.temporal.getState().pause();
  };

  return <GizmoSvg box={box} rotation={0} onStart={start} />;
}

function GizmoSvg({
  box,
  rotation,
  onStart,
}: {
  box: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    scaleX: number;
    scaleY: number;
  };
  rotation: number;
  onStart: (e: React.PointerEvent, kind: HandleId | "rotate") => void;
}) {
  const w = box.width;
  const h = box.height;
  const poly = [
    localToPage(box, 0, 0),
    localToPage(box, w, 0),
    localToPage(box, w, h),
    localToPage(box, 0, h),
  ];
  const topMid = localToPage(box, w / 2, 0);
  const rotPt = localToPage(box, w / 2, -28);
  void rotation;

  return (
    <svg
      className="absolute inset-0 h-full w-full overflow-visible"
      style={{ pointerEvents: "none", zIndex: 18 }}
    >
      <polygon
        points={poly.map((p) => `${p.x},${p.y}`).join(" ")}
        fill="none"
        stroke={STROKE}
        strokeWidth={1}
      />
      <line
        x1={topMid.x}
        y1={topMid.y}
        x2={rotPt.x}
        y2={rotPt.y}
        stroke={ROTATE}
        strokeWidth={1.25}
      />
      <circle
        cx={rotPt.x}
        cy={rotPt.y}
        r={14}
        fill="transparent"
        style={{ cursor: "grab", pointerEvents: "auto" }}
        onPointerDown={(e) => onStart(e, "rotate")}
      />
      <circle
        cx={rotPt.x}
        cy={rotPt.y}
        r={6}
        fill={ROTATE}
        stroke={ROTATE_STROKE}
        strokeWidth={1.25}
        pointerEvents="none"
      />
      {HANDLES.map((handle) => {
        const p = localToPage(box, handle.x * w, handle.y * h);
        const edge = handle.kind === "edge";
        const horizontal = handle.id === "n" || handle.id === "s";
        return (
          <g key={handle.id}>
            <rect
              x={p.x - (edge && !horizontal ? 10 : 12)}
              y={p.y - (edge && horizontal ? 10 : 12)}
              width={edge && horizontal ? 28 : 20}
              height={edge && !horizontal ? 28 : 20}
              fill="transparent"
              style={{ cursor: handle.cursor, pointerEvents: "auto" }}
              onPointerDown={(e) => onStart(e, handle.id)}
            />
            {edge ? (
              <rect
                x={p.x - (horizontal ? 9 : 3)}
                y={p.y - (horizontal ? 3 : 9)}
                width={horizontal ? 18 : 6}
                height={horizontal ? 6 : 18}
                rx={3}
                fill="#fff"
                stroke={STROKE}
                strokeWidth={1.25}
                pointerEvents="none"
              />
            ) : (
              <circle
                cx={p.x}
                cy={p.y}
                r={5.5}
                fill="#fff"
                stroke={STROKE}
                strokeWidth={1.35}
                pointerEvents="none"
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}

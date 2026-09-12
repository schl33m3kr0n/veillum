"use client";

import { useEffect, useRef } from "react";
import { bezierPath, nearPoint } from "@/lib/geometry";
import { useEditorStore } from "@/lib/editor-store";
import type { BezierLayer, BezierPoint } from "@/lib/types";

const HANDLE = "#c45c26";
const CLOSE_THRESHOLD = 12;

export function BezierDraftOverlay({
  points,
  color,
  pointer,
  dragging,
}: {
  points: BezierPoint[];
  color: string;
  pointer: { x: number; y: number } | null;
  dragging: boolean;
}) {
  if (points.length === 0) return null;
  const first = points[0];
  const last = points[points.length - 1];
  const closeHover =
    !dragging &&
    points.length >= 2 &&
    pointer != null &&
    nearPoint(pointer.x, pointer.y, first.x, first.y, CLOSE_THRESHOLD);

  const d = bezierPath(points, closeHover);

  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
      <path
        d={d}
        fill={closeHover ? `${color}22` : "none"}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {pointer && !dragging && !closeHover && (
        <path
          d={`M ${last.x} ${last.y} C ${last.x + last.outX} ${last.y + last.outY} ${pointer.x} ${pointer.y} ${pointer.x} ${pointer.y}`}
          fill="none"
          stroke={color}
          strokeWidth={1.25}
          strokeDasharray="5 4"
          opacity={0.7}
        />
      )}
      {points.map((p, i) => (
        <BezierNode
          key={i}
          point={p}
          active={i === points.length - 1}
          close={i === 0 && closeHover}
        />
      ))}
    </svg>
  );
}

function BezierNode({
  point,
  active,
  close,
}: {
  point: BezierPoint;
  active?: boolean;
  close?: boolean;
}) {
  const hasIn = point.inX !== 0 || point.inY !== 0;
  const hasOut = point.outX !== 0 || point.outY !== 0;
  return (
    <g>
      {(hasIn || hasOut) && (
        <line
          x1={point.x + point.inX}
          y1={point.y + point.inY}
          x2={point.x + point.outX}
          y2={point.y + point.outY}
          stroke={HANDLE}
          strokeWidth={1}
        />
      )}
      {hasIn && (
        <circle
          cx={point.x + point.inX}
          cy={point.y + point.inY}
          r={3.5}
          fill="#fff"
          stroke={HANDLE}
          strokeWidth={1.25}
        />
      )}
      {hasOut && (
        <circle
          cx={point.x + point.outX}
          cy={point.y + point.outY}
          r={3.5}
          fill="#fff"
          stroke={HANDLE}
          strokeWidth={1.25}
        />
      )}
      <rect
        x={point.x - 4}
        y={point.y - 4}
        width={8}
        height={8}
        fill={close ? HANDLE : "#fff"}
        stroke={HANDLE}
        strokeWidth={close || active ? 2 : 1.25}
        transform={`rotate(45 ${point.x} ${point.y})`}
      />
    </g>
  );
}

export function BezierEditOverlay({ layer }: { layer: BezierLayer }) {
  const drag = useRef<{
    index: number;
    kind: "anchor" | "in" | "out";
    origin: BezierPoint;
    alt: boolean;
  } | null>(null);
  const layerRef = useRef(layer);
  layerRef.current = layer;
  const ox = layer.x;
  const oy = layer.y;

  const clientToLocal = (clientX: number, clientY: number) => {
    const pageEl = document.querySelector("[data-veillum-page]");
    if (!pageEl) return null;
    const zoom = useEditorStore.getState().zoom;
    const rect = pageEl.getBoundingClientRect();
    const current = layerRef.current;
    return {
      x: (clientX - rect.left) / zoom - current.x,
      y: (clientY - rect.top) / zoom - current.y,
    };
  };

  const commit = (points: BezierPoint[], normalize: boolean) => {
    useEditorStore.getState().setBezierPoints(layer.id, points, { normalize });
  };

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!drag.current) return;
      const local = clientToLocal(e.clientX, e.clientY);
      if (!local) return;
      const current = layerRef.current;
      const { index, kind, origin } = drag.current;
      const alt = e.altKey || drag.current.alt;
      const next = current.points.map((pt, i) => {
        if (i !== index) return pt;
        if (kind === "anchor") {
          if (alt) {
            const outX = local.x - origin.x;
            const outY = local.y - origin.y;
            return { ...pt, x: origin.x, y: origin.y, outX, outY, inX: -outX, inY: -outY };
          }
          return { ...pt, x: local.x, y: local.y };
        }
        if (kind === "out") {
          const outX = local.x - origin.x;
          const outY = local.y - origin.y;
          return {
            ...pt,
            outX,
            outY,
            inX: alt ? pt.inX : -outX,
            inY: alt ? pt.inY : -outY,
          };
        }
        const inX = local.x - origin.x;
        const inY = local.y - origin.y;
        return {
          ...pt,
          inX,
          inY,
          outX: alt ? pt.outX : -inX,
          outY: alt ? pt.outY : -inY,
        };
      });
      commit(next, false);
    };

    const onUp = () => {
      if (!drag.current) return;
      drag.current = null;
      useEditorStore.temporal.getState().resume();
      const current = useEditorStore
        .getState()
        .layers.find((l) => l.id === layer.id);
      if (current?.type === "bezier") {
        commit(current.points, true);
      }
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [layer.id]);

  const onHandleDown = (
    e: React.PointerEvent,
    index: number,
    kind: "anchor" | "in" | "out",
  ) => {
    e.stopPropagation();
    e.preventDefault();
    const p = layer.points[index];
    drag.current = {
      index,
      kind,
      origin: { ...p },
      alt: e.altKey,
    };
    useEditorStore.temporal.getState().pause();
  };

  const onAnchorClick = (e: React.MouseEvent, index: number) => {
    if (!e.altKey) return;
    e.stopPropagation();
    const points = layer.points.map((p, i) =>
      i === index ? { ...p, inX: 0, inY: 0, outX: 0, outY: 0 } : p,
    );
    commit(points, true);
  };

  return (
    <svg
      className="absolute inset-0 h-full w-full overflow-visible"
      style={{ pointerEvents: "none", zIndex: 20 }}
    >
      {layer.points.map((p, i) => {
        const ax = ox + p.x;
        const ay = oy + p.y;
        const inX = ax + p.inX;
        const inY = ay + p.inY;
        const outX = ax + p.outX;
        const outY = ay + p.outY;
        const hasIn = p.inX !== 0 || p.inY !== 0;
        const hasOut = p.outX !== 0 || p.outY !== 0;
        return (
          <g key={i}>
            {(hasIn || hasOut) && (
              <line
                x1={inX}
                y1={inY}
                x2={outX}
                y2={outY}
                stroke={HANDLE}
                strokeWidth={1}
                pointerEvents="none"
              />
            )}
            {hasIn && (
              <>
                <circle
                  cx={inX}
                  cy={inY}
                  r={11}
                  fill="transparent"
                  style={{ cursor: "crosshair", pointerEvents: "auto" }}
                  onPointerDown={(e) => onHandleDown(e, i, "in")}
                />
                <circle
                  cx={inX}
                  cy={inY}
                  r={5}
                  fill="#fff"
                  stroke={HANDLE}
                  strokeWidth={1.5}
                  pointerEvents="none"
                />
              </>
            )}
            {hasOut && (
              <>
                <circle
                  cx={outX}
                  cy={outY}
                  r={11}
                  fill="transparent"
                  style={{ cursor: "crosshair", pointerEvents: "auto" }}
                  onPointerDown={(e) => onHandleDown(e, i, "out")}
                />
                <circle
                  cx={outX}
                  cy={outY}
                  r={5}
                  fill="#fff"
                  stroke={HANDLE}
                  strokeWidth={1.5}
                  pointerEvents="none"
                />
              </>
            )}
            <rect
              x={ax - 8}
              y={ay - 8}
              width={16}
              height={16}
              fill="transparent"
              transform={`rotate(45 ${ax} ${ay})`}
              style={{ cursor: "move", pointerEvents: "auto" }}
              onPointerDown={(e) => onHandleDown(e, i, "anchor")}
              onClick={(e) => onAnchorClick(e, i)}
            />
            <rect
              x={ax - 5}
              y={ay - 5}
              width={10}
              height={10}
              fill="#fff"
              stroke={HANDLE}
              strokeWidth={1.75}
              transform={`rotate(45 ${ax} ${ay})`}
              pointerEvents="none"
            />
          </g>
        );
      })}
    </svg>
  );
}

export { CLOSE_THRESHOLD };

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useEditorStore } from "@/lib/editor-store";
import { interpolatedLayer, triangleGridLines } from "@/lib/geometry";
import { rgbToHex } from "@/lib/colors";
import { extractRawPreview } from "@/lib/raw";
import { samplePixel } from "@/lib/filters";
import type { BezierPoint, Tool } from "@/lib/types";
import { HtmlLayer } from "./html-layer";

const PAGE_X = 80;
const PAGE_Y = 60;

export default function HtmlStage({
  width,
  height,
}: {
  width: number;
  height: number;
}) {
  const page = useEditorStore((s) => s.page);
  const layers = useEditorStore((s) => s.layers);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const tool = useEditorStore((s) => s.tool);
  const zoom = useEditorStore((s) => s.zoom);
  const panX = useEditorStore((s) => s.panX);
  const panY = useEditorStore((s) => s.panY);
  const editingTextId = useEditorStore((s) => s.editingTextId);
  const playhead = useEditorStore((s) => s.playhead);
  const playing = useEditorStore((s) => s.playing);
  const color = useEditorStore((s) => s.color);
  const highlight = useEditorStore((s) => s.highlight);
  const shapeKind = useEditorStore((s) => s.shapeKind);

  const boardRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const drawing = useRef(false);
  const spacePan = useRef(false);
  const drag = useRef<{
    id: string;
    ox: number;
    oy: number;
    lx: number;
    ly: number;
  } | null>(null);

  const [draftPts, setDraftPts] = useState<number[] | null>(null);
  const [shapeDraft, setShapeDraft] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const [bezierDraft, setBezierDraft] = useState<BezierPoint[]>([]);
  const [maskPts, setMaskPts] = useState<number[] | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") spacePan.current = e.type === "keydown";
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
    };
  }, []);

  const pagePoint = useCallback(
    (clientX: number, clientY: number) => {
      const el = pageRef.current;
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return {
        x: (clientX - rect.left) / zoom,
        y: (clientY - rect.top) / zoom,
      };
    },
    [zoom],
  );

  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const store = useEditorStore.getState();
      if (e.ctrlKey || e.metaKey) {
        store.setZoom(store.zoom * (e.deltaY > 0 ? 0.92 : 1.08));
      } else {
        store.setPan(store.panX - e.deltaX, store.panY - e.deltaY);
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const finishBezier = useCallback(() => {
    if (bezierDraft.length >= 2) {
      useEditorStore.getState().addBezier(bezierDraft, false);
    }
    setBezierDraft([]);
  }, [bezierDraft]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (tool !== "bezier") return;
      if (e.key === "Enter") finishBezier();
      if (e.key === "Escape") setBezierDraft([]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tool, finishBezier]);

  const onBoardPointerDown = (e: React.PointerEvent) => {
    const store = useEditorStore.getState();
    const current: Tool = spacePan.current ? "pan" : store.tool;
    if (current === "pan" || e.button === 1) {
      drawing.current = true;
      drag.current = {
        id: "__pan",
        ox: e.clientX,
        oy: e.clientY,
        lx: store.panX,
        ly: store.panY,
      };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      return;
    }
  };

  const onPagePointerDown = async (e: React.PointerEvent) => {
    const p = pagePoint(e.clientX, e.clientY);
    if (!p) return;
    const store = useEditorStore.getState();
    const current: Tool = spacePan.current ? "pan" : store.tool;
    useEditorStore.getState().setPointer(p.x, p.y);

    if (current === "pan") return;

    if (current === "eyedropper") {
      const pageEl = pageRef.current;
      if (pageEl) {
        const { toCanvas } = await import("html-to-image");
        const snap = await toCanvas(pageEl, { pixelRatio: 1, cacheBust: true });
        const ctx = snap.getContext("2d");
        if (ctx) {
          const pix = ctx.getImageData(
            Math.max(0, Math.round(p.x)),
            Math.max(0, Math.round(p.y)),
            1,
            1,
          ).data;
          store.setColor(rgbToHex(pix[0], pix[1], pix[2]));
        }
      }
      store.setTool("select");
      e.stopPropagation();
      return;
    }

    if (current === "text") {
      store.addTextAt(p.x, p.y);
      e.stopPropagation();
      return;
    }

    if (current === "pencil" || current === "pen" || current === "highlighter") {
      drawing.current = true;
      setDraftPts([p.x, p.y]);
      e.stopPropagation();
      return;
    }

    if (current === "shape") {
      drawing.current = true;
      setShapeDraft({ x: p.x, y: p.y, w: 0, h: 0 });
      e.stopPropagation();
      return;
    }

    if (current === "bezier") {
      setBezierDraft((d) => [
        ...d,
        { x: p.x, y: p.y, inX: -30, inY: 0, outX: 30, outY: 0 },
      ]);
      e.stopPropagation();
      return;
    }

    if (current === "mask") {
      drawing.current = true;
      setMaskPts([p.x, p.y]);
      e.stopPropagation();
      return;
    }

    if (e.target === e.currentTarget) {
      if (!e.shiftKey) store.clearSelection();
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const p = pagePoint(e.clientX, e.clientY);
    if (p) useEditorStore.getState().setPointer(p.x, p.y);
    const store = useEditorStore.getState();

    if (drag.current?.id === "__pan") {
      store.setPan(
        drag.current.lx + (e.clientX - drag.current.ox),
        drag.current.ly + (e.clientY - drag.current.oy),
      );
      return;
    }

    if (drag.current && drag.current.id !== "__pan") {
      const dx = p ? p.x - drag.current.ox : 0;
      const dy = p ? p.y - drag.current.oy : 0;
      store.updateLayer(drag.current.id, {
        x: drag.current.lx + dx,
        y: drag.current.ly + dy,
      });
      return;
    }

    if (!drawing.current || !p) return;
    if (draftPts) setDraftPts((pts) => (pts ? [...pts, p.x, p.y] : pts));
    if (shapeDraft) {
      setShapeDraft((d) => (d ? { ...d, w: p.x - d.x, h: p.y - d.y } : d));
    }
    if (maskPts) setMaskPts((pts) => (pts ? [...pts, p.x, p.y] : pts));
  };

  const onPointerUp = () => {
    useEditorStore.temporal.getState().resume();
    const store = useEditorStore.getState();
    if (draftPts && draftPts.length >= 4) {
      const t = store.tool;
      if (t === "pencil" || t === "pen" || t === "highlighter") {
        store.addPath(t, draftPts);
      }
    }
    if (shapeDraft) {
      const x = Math.min(shapeDraft.x, shapeDraft.x + shapeDraft.w);
      const y = Math.min(shapeDraft.y, shapeDraft.y + shapeDraft.h);
      const w = Math.abs(shapeDraft.w);
      const h = Math.abs(shapeDraft.h);
      if (w > 4 && h > 4) store.addShapeAt(x, y, w, h);
    }
    if (maskPts && maskPts.length > 4) {
      const id = store.selectedIds[0];
      const layer = store.layers.find((l) => l.id === id);
      if (layer) {
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(layer.width));
        canvas.height = Math.max(1, Math.round(layer.height));
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#000";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = 28;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.beginPath();
          for (let i = 0; i < maskPts.length; i += 2) {
            const mx = maskPts[i] - layer.x;
            const my = maskPts[i + 1] - layer.y;
            if (i === 0) ctx.moveTo(mx, my);
            else ctx.lineTo(mx, my);
          }
          ctx.stroke();
          store.updateLayer(layer.id, {
            maskEnabled: true,
            maskSrc: canvas.toDataURL("image/png"),
          });
        }
      }
    }
    drawing.current = false;
    drag.current = null;
    setDraftPts(null);
    setShapeDraft(null);
    setMaskPts(null);
  };

  const onLayerPointerDown = async (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    const store = useEditorStore.getState();
    const p = pagePoint(e.clientX, e.clientY);
    const layer = store.layers.find((l) => l.id === id);
    if (!layer) return;

    if (store.tool === "instant-alpha" && layer.type === "image" && p) {
      const nx = (p.x - layer.x) / Math.max(1, layer.width);
      const ny = (p.y - layer.y) / Math.max(1, layer.height);
      const rgb = await samplePixel(layer.originalSrc, nx, ny);
      store.updateLayer(layer.id, {
        instantAlpha: { ...layer.instantAlpha, ...rgb, enabled: true },
      });
      return;
    }

    if (store.tool !== "select") return;
    store.select([id], e.shiftKey);
    if (layer.locked || !p) return;
    drag.current = { id, ox: p.x, oy: p.y, lx: layer.x, ly: layer.y };
    useEditorStore.temporal.getState().pause();
    if (e.detail === 2 && layer.type === "text") {
      store.setEditingText(layer.id);
    }
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    try {
      const { dataUrl, isRaw } = await extractRawPreview(file);
      const img = new window.Image();
      img.onload = () => {
        const maxW = 420;
        const scale = Math.min(1, maxW / img.width);
        useEditorStore.getState().addImageFromSrc(dataUrl, {
          isRaw,
          name: file.name,
          width: img.width * scale,
          height: img.height * scale,
        });
      };
      img.src = dataUrl;
    } catch (err) {
      console.error(err);
    }
  };

  const visible = layers.map((l) =>
    interpolatedLayer(l, playhead, playing || (l.keyframes.length > 0 && playhead > 0)),
  );

  const gridLines: number[][] = [];
  if (page.grid.visible && page.grid.type === "square") {
    for (let x = 0; x <= page.width; x += page.grid.size) {
      gridLines.push([x, 0, x, page.height]);
    }
    for (let y = 0; y <= page.height; y += page.grid.size) {
      gridLines.push([0, y, page.width, y]);
    }
  } else if (page.grid.visible && page.grid.type === "triangle") {
    gridLines.push(
      ...triangleGridLines(page.width, page.height, page.grid.size),
    );
  }

  const draftStroke =
    tool === "highlighter" ? highlight : color;
  const draftWidth =
    tool === "highlighter" ? 18 : tool === "pen" ? 3 : 2;

  return (
    <div
      ref={boardRef}
      className="relative h-full w-full overflow-hidden bg-[#2a2622]"
      style={{ width, height }}
      onPointerDown={onBoardPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      <div
        style={{
          transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
          transformOrigin: "0 0",
          width: page.width + PAGE_X * 2,
          height: page.height + PAGE_Y * 2,
        }}
      >
        <div
          ref={pageRef}
          data-vellum-page
          onPointerDown={onPagePointerDown}
          style={{
            position: "absolute",
            left: PAGE_X,
            top: PAGE_Y,
            width: page.width,
            height: page.height,
            background: page.background,
            boxShadow: "0 18px 40px rgba(0,0,0,0.45)",
            overflow: "hidden",
            cursor:
              tool === "text"
                ? "text"
                : tool === "pan"
                  ? "grab"
                  : tool === "select"
                    ? "default"
                    : "crosshair",
          }}
        >
          {page.header.enabled && (
            <div
              className="pointer-events-none absolute"
              style={{
                left: page.margins.left,
                top: 14,
                width: page.width - page.margins.left - page.margins.right,
                color: page.header.color,
                fontFamily: page.header.fontFamily,
                fontSize: page.header.fontSize,
              }}
            >
              {page.header.text}
            </div>
          )}
          {page.footer.enabled && (
            <div
              className="pointer-events-none absolute"
              style={{
                left: page.margins.left,
                bottom: 12,
                width: page.width - page.margins.left - page.margins.right,
                color: page.footer.color,
                fontFamily: page.footer.fontFamily,
                fontSize: page.footer.fontSize,
              }}
            >
              {page.footer.text}
            </div>
          )}
          <svg className="pointer-events-none absolute inset-0 h-full w-full">
            {gridLines.map((pts, i) => (
              <line
                key={i}
                x1={pts[0]}
                y1={pts[1]}
                x2={pts[2]}
                y2={pts[3]}
                stroke="rgba(28,25,22,0.12)"
              />
            ))}
            <rect
              x={page.margins.left}
              y={page.margins.top}
              width={page.width - page.margins.left - page.margins.right}
              height={page.height - page.margins.top - page.margins.bottom}
              fill="none"
              stroke="rgba(196,92,38,0.35)"
              strokeDasharray="6 4"
            />
          </svg>
          {visible.map((layer) =>
            editingTextId === layer.id ? null : (
              <HtmlLayer
                key={layer.id}
                layer={layer}
                selected={selectedIds.includes(layer.id) && tool === "select"}
                tool={tool}
                onPointerDown={onLayerPointerDown}
              />
            ),
          )}
          {draftPts && (
            <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
              <polyline
                points={toPairs(draftPts)}
                fill="none"
                stroke={draftStroke}
                strokeWidth={draftWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={tool === "highlighter" ? 0.45 : 1}
              />
            </svg>
          )}
          {shapeDraft && (
            <div
              className="pointer-events-none absolute border border-dashed"
              style={{
                left: Math.min(shapeDraft.x, shapeDraft.x + shapeDraft.w),
                top: Math.min(shapeDraft.y, shapeDraft.y + shapeDraft.h),
                width: Math.abs(shapeDraft.w),
                height: Math.abs(shapeDraft.h),
                borderColor: color,
              }}
            />
          )}
          {bezierDraft.length > 0 && (
            <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
              <polyline
                points={bezierDraft.map((b) => `${b.x},${b.y}`).join(" ")}
                fill="none"
                stroke={color}
                strokeWidth={2}
              />
              {bezierDraft.map((b, i) => (
                <circle key={i} cx={b.x} cy={b.y} r={4} fill="#c45c26" />
              ))}
            </svg>
          )}
          {maskPts && (
            <svg className="pointer-events-none absolute inset-0 h-full w-full">
              <polyline
                points={toPairs(maskPts)}
                fill="none"
                stroke="#fff"
                strokeWidth={22}
                opacity={0.5}
                strokeLinecap="round"
              />
            </svg>
          )}
        </div>
      </div>
      <span className="sr-only">{shapeKind}</span>
    </div>
  );
}

function toPairs(pts: number[]): string {
  const out: string[] = [];
  for (let i = 0; i < pts.length; i += 2) out.push(`${pts[i]},${pts[i + 1]}`);
  return out.join(" ");
}

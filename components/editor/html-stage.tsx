"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { beginHistoryGesture, endHistoryGesture, useEditorStore } from "@/lib/editor-store";
import { interpolatedLayer, nearPoint, radialGrid, triangleGridLines } from "@/lib/geometry";
import { rgbToHex } from "@/lib/colors";
import { extractRawPreview } from "@/lib/raw";
import { samplePixel } from "@/lib/filters";
import { cssFontFamily } from "@/lib/fonts";
import type { BezierPoint, Tool } from "@/lib/types";
import { HtmlLayer } from "./html-layer";
import { BezierDraftOverlay, BezierEditOverlay, CLOSE_THRESHOLD } from "./bezier-overlay";
import { ShapeAdjustGizmos } from "./shape-gizmos";
import { TransformGizmos } from "./transform-gizmos";
import { snapMovingLayers } from "@/lib/snap";
import { PAGE_PAD_X, PAGE_PAD_Y } from "@/lib/stage";
import { layerAabb } from "@/lib/transform";
import { ColorLoupe, sampleCanvasHex } from "./color-loupe";
import { applyStudioColor } from "@/lib/apply-color";

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
  const guides = useEditorStore((s) => s.snapGuides);
  const colorSnap = useRef<HTMLCanvasElement | null>(null);
  const [colorShot, setColorShot] = useState<HTMLCanvasElement | null>(null);
  const [loupe, setLoupe] = useState<{
    pageX: number;
    pageY: number;
    screenX: number;
    screenY: number;
  } | null>(null);

  const boardRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const drawing = useRef(false);
  const spacePan = useRef(false);
  const drag = useRef<{
    id: string;
    ox: number;
    oy: number;
    origins: { id: string; x: number; y: number }[];
  } | null>(null);

  const [draftPts, setDraftPts] = useState<number[] | null>(null);
  const [shapeDraft, setShapeDraft] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const [bezierDraft, setBezierDraft] = useState<BezierPoint[]>([]);
  const [bezierDragging, setBezierDragging] = useState(false);
  const [maskPts, setMaskPts] = useState<number[] | null>(null);
  const [marquee, setMarquee] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const marqueeOrigin = useRef<{
    additive: boolean;
    originIds: string[];
  } | null>(null);
  const marqueeRef = useRef(marquee);
  marqueeRef.current = marquee;
  const bezierHandleDrag = useRef(false);
  const bezierDraftRef = useRef<BezierPoint[]>([]);
  bezierDraftRef.current = bezierDraft;
  const pointer = useEditorStore((s) => s.pointer);

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

  useEffect(() => {
    if (tool !== "eyedropper") {
      colorSnap.current = null;
      setColorShot(null);
      setLoupe(null);
      return;
    }
    let live = true;
    const capture = async () => {
      const el = pageRef.current;
      if (!el) return;
      try {
        const { toCanvas } = await import("html-to-image");
        const canvas = await toCanvas(el, { pixelRatio: 1, cacheBust: true });
        if (live) {
          colorSnap.current = canvas;
          setColorShot(canvas);
        }
      } catch (err) {
        console.error(err);
      }
    };
    void capture();
    return () => {
      live = false;
    };
  }, [tool]);

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

  const beginMarquee = (e: React.PointerEvent, p: { x: number; y: number }) => {
    drawing.current = true;
    marqueeOrigin.current = {
      additive: e.shiftKey,
      originIds: useEditorStore.getState().selectedIds,
    };
    const start = { x: p.x, y: p.y, w: 0, h: 0 };
    marqueeRef.current = start;
    setMarquee(start);
    boardRef.current?.setPointerCapture(e.pointerId);
  };

  const idsInMarquee = (
    x: number,
    y: number,
    w: number,
    h: number,
  ): string[] => {
    const left = Math.min(x, x + w);
    const top = Math.min(y, y + h);
    const right = Math.max(x, x + w);
    const bottom = Math.max(y, y + h);
    return useEditorStore
      .getState()
      .layers.filter((layer) => {
        if (!layer.visible || layer.locked) return false;
        const box = layerAabb(layer);
        return box.left < right && box.right > left && box.top < bottom && box.bottom > top;
      })
      .map((layer) => layer.id);
  };

  const applyMarquee = (draft: { x: number; y: number; w: number; h: number }) => {
    const origin = marqueeOrigin.current;
    const hit = idsInMarquee(draft.x, draft.y, draft.w, draft.h);
    if (origin?.additive) {
      useEditorStore
        .getState()
        .select(Array.from(new Set([...origin.originIds, ...hit])));
    } else {
      useEditorStore.getState().select(hit);
    }
  };

  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const store = useEditorStore.getState();
      const rect = el.getBoundingClientRect();
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? rect.height : 1;
      const dx = e.deltaX * unit;
      const dy = e.deltaY * unit;
      const pinch = e.ctrlKey || e.metaKey;
      if (pinch) {
        const factor = Math.exp(-dy * 0.012);
        store.zoomToward(
          store.zoom * factor,
          e.clientX - rect.left,
          e.clientY - rect.top,
        );
        return;
      }
      store.setPan(store.panX - dx, store.panY - dy);
    };
    el.addEventListener("wheel", onWheel, { passive: false });

    let gestureStartZoom = 1;
    const onGestureStart = (e: Event) => {
      e.preventDefault();
      gestureStartZoom = useEditorStore.getState().zoom;
    };
    const onGestureChange = (e: Event) => {
      e.preventDefault();
      const ge = e as Event & { scale: number; clientX: number; clientY: number };
      const store = useEditorStore.getState();
      const rect = el.getBoundingClientRect();
      store.zoomToward(
        gestureStartZoom * (ge.scale || 1),
        ge.clientX - rect.left,
        ge.clientY - rect.top,
      );
    };
    el.addEventListener("gesturestart", onGestureStart);
    el.addEventListener("gesturechange", onGestureChange);
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("gesturestart", onGestureStart);
      el.removeEventListener("gesturechange", onGestureChange);
    };
  }, [width, height]);

  const finishBezier = useCallback((closed = false) => {
    const draft = bezierDraftRef.current;
    bezierHandleDrag.current = false;
    setBezierDragging(false);
    setBezierDraft([]);
    if (draft.length < 2) return;
    const store = useEditorStore.getState();
    store.addBezier(draft, closed);
    store.setTool("select");
  }, []);

  useEffect(() => {
    if (tool !== "bezier") {
      setBezierDraft([]);
      bezierHandleDrag.current = false;
      setBezierDragging(false);
    }
  }, [tool]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (tool !== "bezier") return;
      if (e.key === "Enter") {
        e.preventDefault();
        finishBezier(false);
      }
      if (e.key === "Escape") {
        setBezierDraft([]);
        bezierHandleDrag.current = false;
        setBezierDragging(false);
      }
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
        origins: [{ id: "__pan", x: store.panX, y: store.panY }],
      };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      return;
    }
    if (store.tool === "select" && e.button === 0 && e.target === e.currentTarget) {
      const p = pagePoint(e.clientX, e.clientY);
      if (p) beginMarquee(e, p);
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
      const snap = colorSnap.current;
      const hex = snap && p ? sampleCanvasHex(snap, p.x, p.y) : null;
      if (hex) {
        applyStudioColor(hex);
      } else {
        const pageEl = pageRef.current;
        if (pageEl) {
          const { toCanvas } = await import("html-to-image");
          const shot = await toCanvas(pageEl, { pixelRatio: 1, cacheBust: true });
          const ctx = shot.getContext("2d");
          if (ctx) {
            const pix = ctx.getImageData(
              Math.max(0, Math.round(p.x)),
              Math.max(0, Math.round(p.y)),
              1,
              1,
            ).data;
            applyStudioColor(rgbToHex(pix[0], pix[1], pix[2]));
          }
        }
      }
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
      e.stopPropagation();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      if (e.detail >= 2) {
        finishBezier(false);
        return;
      }
      if (
        bezierDraft.length >= 2 &&
        nearPoint(p.x, p.y, bezierDraft[0].x, bezierDraft[0].y, CLOSE_THRESHOLD)
      ) {
        finishBezier(true);
        return;
      }
      drawing.current = true;
      bezierHandleDrag.current = true;
      setBezierDragging(true);
      setBezierDraft((d) => [
        ...d,
        { x: p.x, y: p.y, inX: 0, inY: 0, outX: 0, outY: 0 },
      ]);
      return;
    }

    if (current === "mask") {
      drawing.current = true;
      setMaskPts([p.x, p.y]);
      e.stopPropagation();
      return;
    }

    if (e.target === e.currentTarget && current === "select") {
      beginMarquee(e, p);
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

    if (store.tool === "eyedropper") {
      const board = boardRef.current;
      if (p && board) {
        const rect = board.getBoundingClientRect();
        setLoupe({
          pageX: p.x,
          pageY: p.y,
          screenX: e.clientX - rect.left,
          screenY: e.clientY - rect.top,
        });
      } else {
        setLoupe(null);
      }
    }

    if (drag.current?.id === "__pan") {
      const origin = drag.current.origins[0];
      store.setPan(
        origin.x + (e.clientX - drag.current.ox),
        origin.y + (e.clientY - drag.current.oy),
      );
      return;
    }

    if (drag.current && drag.current.id !== "__pan") {
      const dx = p ? p.x - drag.current.ox : 0;
      const dy = p ? p.y - drag.current.oy : 0;
      const { positions, guides: nextGuides } = snapMovingLayers(
        drag.current.origins,
        dx,
        dy,
        store.layers,
        store.page,
      );
      for (const [id, pos] of positions) {
        store.updateLayer(id, pos);
      }
      store.setSnapGuides(nextGuides);
      return;
    }

    if (bezierHandleDrag.current && p) {
      setBezierDraft((d) => {
        if (d.length === 0) return d;
        const last = d[d.length - 1];
        const outX = p.x - last.x;
        const outY = p.y - last.y;
        const next = { ...last, outX, outY, inX: -outX, inY: -outY };
        return [...d.slice(0, -1), next];
      });
      return;
    }

    if (!drawing.current || !p) return;
    if (draftPts) setDraftPts((pts) => (pts ? [...pts, p.x, p.y] : pts));
    if (shapeDraft) {
      setShapeDraft((d) => (d ? { ...d, w: p.x - d.x, h: p.y - d.y } : d));
    }
    if (marqueeRef.current) {
      const origin = marqueeRef.current;
      const next = { ...origin, w: p.x - origin.x, h: p.y - origin.y };
      marqueeRef.current = next;
      setMarquee(next);
      if (Math.abs(next.w) > 3 || Math.abs(next.h) > 3) applyMarquee(next);
    }
    if (maskPts) setMaskPts((pts) => (pts ? [...pts, p.x, p.y] : pts));
  };

  const onPointerUp = () => {
    if (drag.current && drag.current.id !== "__pan") {
      endHistoryGesture();
    }
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
    const box = marqueeRef.current;
    if (box) {
      if (Math.abs(box.w) <= 3 && Math.abs(box.h) <= 3) {
        if (!marqueeOrigin.current?.additive) store.clearSelection();
      } else {
        applyMarquee(box);
      }
    }
    drawing.current = false;
    drag.current = null;
    marqueeOrigin.current = null;
    store.setSnapGuides([]);
    bezierHandleDrag.current = false;
    setBezierDragging(false);
    setBezierDraft((d) => {
      if (d.length === 0) return d;
      const last = d[d.length - 1];
      if (Math.hypot(last.outX, last.outY) < 4) {
        return [
          ...d.slice(0, -1),
          { ...last, inX: 0, inY: 0, outX: 0, outY: 0 },
        ];
      }
      return d;
    });
    setDraftPts(null);
    setShapeDraft(null);
    setMarquee(null);
    marqueeRef.current = null;
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
    if (e.detail >= 2 && layer.type === "text") {
      store.setEditingText(layer.id);
      return;
    }
    if (layer.locked || !p) return;
    const nextIds = useEditorStore.getState().selectedIds;
    const moving = store.layers.filter(
      (l) => nextIds.includes(l.id) && !l.locked,
    );
    drag.current = {
      id,
      ox: p.x,
      oy: p.y,
      origins: moving.map((l) => ({ id: l.id, x: l.x, y: l.y })),
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    beginHistoryGesture();
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
  const gridCircles: { cx: number; cy: number; r: number }[] = [];
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
  } else if (page.grid.visible && page.grid.type === "radial") {
    const radial = radialGrid(page.width, page.height, page.grid.size);
    gridLines.push(...radial.lines);
    gridCircles.push(...radial.circles);
  }

  const draftStroke =
    tool === "highlighter" ? highlight : color;
  const draftWidth =
    tool === "highlighter" ? 18 : tool === "pen" ? 3 : 2;

  const selectedLayer =
    tool === "select" && selectedIds.length === 1
      ? layers.find((l) => l.id === selectedIds[0])
      : undefined;
  const editBezier =
    selectedLayer?.type === "bezier" && !selectedLayer.locked
      ? selectedLayer
      : null;
  const editShape =
    selectedLayer?.type === "shape" && !selectedLayer.locked
      ? selectedLayer
      : null;
  const gizmoLayers =
    !playing && tool === "select"
      ? layers.filter(
          (l) =>
            selectedIds.includes(l.id) &&
            !l.locked &&
            editingTextId !== l.id,
        )
      : [];

  return (
    <div
      ref={boardRef}
      className="relative h-full w-full overflow-hidden bg-[#2a2622]"
      style={{ width, height }}
      onPointerDown={onBoardPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      <div
        style={{
          transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
          transformOrigin: "0 0",
          width: page.width + PAGE_PAD_X * 2,
          height: page.height + PAGE_PAD_Y * 2,
        }}
      >
        <div
          ref={pageRef}
          data-veillum-page
          onPointerDown={onPagePointerDown}
          style={{
            position: "absolute",
            left: PAGE_PAD_X,
            top: PAGE_PAD_Y,
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
                fontFamily: cssFontFamily(page.header.fontFamily),
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
                fontFamily: cssFontFamily(page.footer.fontFamily),
                fontSize: page.footer.fontSize,
              }}
            >
              {page.footer.text}
            </div>
          )}
          <svg className="pointer-events-none absolute inset-0 h-full w-full">
            {gridLines.map((pts, i) => (
              <line
                key={`l-${i}`}
                x1={pts[0]}
                y1={pts[1]}
                x2={pts[2]}
                y2={pts[3]}
                stroke="rgba(28,25,22,0.12)"
              />
            ))}
            {gridCircles.map((c, i) => (
              <circle
                key={`c-${i}`}
                cx={c.cx}
                cy={c.cy}
                r={c.r}
                fill="none"
                stroke="rgba(28,25,22,0.12)"
              />
            ))}
            {page.marginsVisible !== false && (
              <rect
                x={page.margins.left}
                y={page.margins.top}
                width={page.width - page.margins.left - page.margins.right}
                height={page.height - page.margins.top - page.margins.bottom}
                fill="none"
                stroke="rgba(196,92,38,0.35)"
                strokeDasharray="6 4"
              />
            )}
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
            <BezierDraftOverlay
              points={bezierDraft}
              color={color}
              pointer={pointer}
              dragging={bezierDragging}
            />
          )}
          {editBezier && <BezierEditOverlay layer={editBezier} />}
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
        <div
          className="pointer-events-none absolute overflow-visible"
          style={{
            left: PAGE_PAD_X,
            top: PAGE_PAD_Y,
            width: page.width,
            height: page.height,
            zIndex: 22,
          }}
        >
          {gizmoLayers.length > 0 && <TransformGizmos layers={gizmoLayers} />}
          {editShape && <ShapeAdjustGizmos layer={editShape} />}
          {marquee && (Math.abs(marquee.w) > 2 || Math.abs(marquee.h) > 2) && (
            <div
              className="pointer-events-none absolute"
              style={{
                left: Math.min(marquee.x, marquee.x + marquee.w),
                top: Math.min(marquee.y, marquee.y + marquee.h),
                width: Math.abs(marquee.w),
                height: Math.abs(marquee.h),
                border: "1px solid #c45c26",
                background: "rgba(196,92,38,0.12)",
              }}
            />
          )}
          {guides.length > 0 && (
            <svg className="absolute inset-0 h-full w-full overflow-visible">
              {guides.map((guide, i) => {
                if (guide.span) {
                  const a = guide.span.start;
                  const b = guide.span.end;
                  if (guide.axis === "y") {
                    return (
                      <g key={`span-${i}`}>
                        <line x1={a} y1={guide.pos} x2={b} y2={guide.pos} stroke="#fff" strokeWidth={4} />
                        <line x1={a} y1={guide.pos - 5} x2={a} y2={guide.pos + 5} stroke="#fff" strokeWidth={4} />
                        <line x1={b} y1={guide.pos - 5} x2={b} y2={guide.pos + 5} stroke="#fff" strokeWidth={4} />
                        <line x1={a} y1={guide.pos} x2={b} y2={guide.pos} stroke="#ff4fa3" strokeWidth={2} />
                        <line x1={a} y1={guide.pos - 5} x2={a} y2={guide.pos + 5} stroke="#ff4fa3" strokeWidth={2} />
                        <line x1={b} y1={guide.pos - 5} x2={b} y2={guide.pos + 5} stroke="#ff4fa3" strokeWidth={2} />
                      </g>
                    );
                  }
                  return (
                    <g key={`span-${i}`}>
                      <line x1={guide.pos} y1={a} x2={guide.pos} y2={b} stroke="#fff" strokeWidth={4} />
                      <line x1={guide.pos - 5} y1={a} x2={guide.pos + 5} y2={a} stroke="#fff" strokeWidth={4} />
                      <line x1={guide.pos - 5} y1={b} x2={guide.pos + 5} y2={b} stroke="#fff" strokeWidth={4} />
                      <line x1={guide.pos} y1={a} x2={guide.pos} y2={b} stroke="#ff4fa3" strokeWidth={2} />
                      <line x1={guide.pos - 5} y1={a} x2={guide.pos + 5} y2={a} stroke="#ff4fa3" strokeWidth={2} />
                      <line x1={guide.pos - 5} y1={b} x2={guide.pos + 5} y2={b} stroke="#ff4fa3" strokeWidth={2} />
                    </g>
                  );
                }
                return guide.axis === "x" ? (
                  <g key={`x-${i}`}>
                    <line
                      x1={guide.pos}
                      y1={-48}
                      x2={guide.pos}
                      y2={page.height + 48}
                      stroke="#fff"
                      strokeWidth={4}
                    />
                    <line
                      x1={guide.pos}
                      y1={-48}
                      x2={guide.pos}
                      y2={page.height + 48}
                      stroke="#ff4fa3"
                      strokeWidth={2}
                    />
                  </g>
                ) : (
                  <g key={`y-${i}`}>
                    <line
                      x1={-48}
                      y1={guide.pos}
                      x2={page.width + 48}
                      y2={guide.pos}
                      stroke="#fff"
                      strokeWidth={4}
                    />
                    <line
                      x1={-48}
                      y1={guide.pos}
                      x2={page.width + 48}
                      y2={guide.pos}
                      stroke="#ff4fa3"
                      strokeWidth={2}
                    />
                  </g>
                );
              })}
            </svg>
          )}
        </div>
      </div>
      {tool === "eyedropper" && loupe && (
        <ColorLoupe
          snapshot={colorShot}
          pageX={loupe.pageX}
          pageY={loupe.pageY}
          screenX={loupe.screenX}
          screenY={loupe.screenY}
        />
      )}
      <span className="sr-only">{shapeKind}</span>
    </div>
  );
}

function toPairs(pts: number[]): string {
  const out: string[] = [];
  for (let i = 0; i < pts.length; i += 2) out.push(`${pts[i]},${pts[i + 1]}`);
  return out.join(" ");
}

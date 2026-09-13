"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { beginHistoryGesture, endHistoryGesture, useEditorStore } from "@/lib/editor-store";
import { interpolatedLayer, nearPoint, radialGrid, triangleGridLines } from "@/lib/geometry";
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
import { ColorLoupe } from "./color-loupe";
import { applyStudioColor } from "@/lib/apply-color";
import {
  capturePageSnapshot,
  snapshotHex,
  snapshotPixelFromPage,
} from "@/lib/color-loupe";
import { clientToLocal, localToPage } from "@/lib/pointer-space";
import {
  CompassOverlay,
  hitCompass,
  type CompassDraft,
  type CompassHit,
} from "./compass-overlay";
import { shortestAngleDelta } from "@/lib/compass";

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
  const colorLoupe = useEditorStore((s) => s.colorLoupe);
  const color = useEditorStore((s) => s.color);
  const highlight = useEditorStore((s) => s.highlight);
  const shapeKind = useEditorStore((s) => s.shapeKind);
  const guides = useEditorStore((s) => s.snapGuides);
  const colorSnap = useRef<HTMLCanvasElement | null>(null);
  const [colorShot, setColorShot] = useState<HTMLCanvasElement | null>(null);
  const [loupe, setLoupe] = useState<{
    snapX: number;
    snapY: number;
    clientX: number;
    clientY: number;
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
  const [compassDraft, setCompassDraft] = useState<CompassDraft | null>(null);
  const compassDraftRef = useRef(compassDraft);
  compassDraftRef.current = compassDraft;
  const compassGesture = useRef<{
    mode: "place" | "needle" | "pencil" | "arc";
    ox: number;
    oy: number;
    startCx: number;
    startCy: number;
    startAngle: number;
    lastAngle: number;
    sweep: number;
  } | null>(null);
  const [compassDrag, setCompassDrag] = useState<
    "place" | "needle" | "pencil" | "arc" | null
  >(null);
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
    if (tool !== "compass") {
      compassGesture.current = null;
      setCompassDrag(null);
      setCompassDraft(null);
    }
  }, [tool]);

  useEffect(() => {
    if (tool !== "eyedropper") {
      colorSnap.current = null;
      setColorShot(null);
      setLoupe(null);
      return;
    }
    let live = true;
    const capture = async () => {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
      const el = pageRef.current;
      if (!el || !live) return;
      try {
        const canvas = await capturePageSnapshot(el, page.width, page.height);
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
  }, [tool, page.width, page.height]);

  useEffect(() => {
    if (!colorLoupe) setLoupe(null);
  }, [colorLoupe]);

  const pagePoint = useCallback(
    (clientX: number, clientY: number) => {
      const board = boardRef.current;
      if (!board) return null;
      const local = clientToLocal(board, clientX, clientY);
      return localToPage(
        local.x,
        local.y,
        panX,
        panY,
        zoom,
        PAGE_PAD_X,
        PAGE_PAD_Y,
      );
    },
    [panX, panY, zoom],
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
        const local = clientToLocal(el, e.clientX, e.clientY);
        store.zoomToward(store.zoom * factor, local.x, local.y);
        return;
      }
      store.setPan(store.panX - dx, store.panY - dy);
    };
    el.addEventListener("wheel", onWheel, { passive: false });

    let gestureStartZoom = 1;
    const onGestureStart = (e: Event) => {
      if (e.cancelable) e.preventDefault();
      gestureStartZoom = useEditorStore.getState().zoom;
    };
    const onGestureChange = (e: Event) => {
      if (e.cancelable) e.preventDefault();
      const ge = e as Event & { scale: number; clientX: number; clientY: number };
      const store = useEditorStore.getState();
      const local = clientToLocal(el, ge.clientX, ge.clientY);
      store.zoomToward(gestureStartZoom * (ge.scale || 1), local.x, local.y);
    };
    el.addEventListener("gesturestart", onGestureStart, { passive: false });
    el.addEventListener("gesturechange", onGestureChange, { passive: false });
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
      const pageEl = pageRef.current;
      if (snap && pageEl) {
        applyStudioColor(snapshotHex(snap, Math.floor(p.x), Math.floor(p.y)));
        setLoupe(null);
      } else if (pageEl) {
        const shot = await capturePageSnapshot(
          pageEl,
          store.page.width,
          store.page.height,
        );
        applyStudioColor(snapshotHex(shot, Math.floor(p.x), Math.floor(p.y)));
        setLoupe(null);
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

    if (current === "compass") {
      drawing.current = true;
      const existing = compassDraftRef.current;
      if (!existing) {
        compassGesture.current = {
          mode: "place",
          ox: p.x,
          oy: p.y,
          startCx: p.x,
          startCy: p.y,
          startAngle: -Math.PI / 2,
          lastAngle: -Math.PI / 2,
          sweep: 0,
        };
        setCompassDrag("place");
        setCompassDraft({ cx: p.x, cy: p.y, r: 0, angle: -Math.PI / 2 });
      } else {
        const hit = hitCompass(existing, p);
        if (hit === "needle" || hit === "pencil") {
          compassGesture.current = {
            mode: hit,
            ox: p.x,
            oy: p.y,
            startCx: existing.cx,
            startCy: existing.cy,
            startAngle: existing.angle,
            lastAngle: existing.angle,
            sweep: 0,
          };
          setCompassDrag(hit);
        } else if (existing.r > 4) {
          const startAngle = Math.atan2(p.y - existing.cy, p.x - existing.cx);
          compassGesture.current = {
            mode: "arc",
            ox: p.x,
            oy: p.y,
            startCx: existing.cx,
            startCy: existing.cy,
            startAngle,
            lastAngle: startAngle,
            sweep: 0,
          };
          setCompassDrag("arc");
          setCompassDraft({
            ...existing,
            angle: startAngle,
            arcStart: startAngle,
            arcSweep: 0,
          });
        }
      }
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
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

    if (store.tool === "eyedropper" && store.colorLoupe) {
      const snap = colorSnap.current;
      if (p && snap) {
        const at = snapshotPixelFromPage(snap, p.x, p.y);
        setLoupe({
          snapX: at.x,
          snapY: at.y,
          clientX: e.clientX,
          clientY: e.clientY,
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

    const compassG = compassGesture.current;
    if (compassG && p) {
      if (compassG.mode === "place" || compassG.mode === "pencil") {
        setCompassDraft((d) => {
          if (!d) return d;
          let r = Math.hypot(p.x - d.cx, p.y - d.cy);
          if (e.shiftKey) r = Math.round(r / 8) * 8;
          return {
            ...d,
            r,
            angle: Math.atan2(p.y - d.cy, p.x - d.cx),
          };
        });
      } else if (compassG.mode === "needle") {
        setCompassDraft((d) =>
          d
            ? {
                ...d,
                cx: compassG.startCx + (p.x - compassG.ox),
                cy: compassG.startCy + (p.y - compassG.oy),
              }
            : d,
        );
      } else if (compassG.mode === "arc") {
        const d = compassDraftRef.current;
        if (d && d.r > 4) {
          const ang = Math.atan2(p.y - d.cy, p.x - d.cx);
          const nextSweep = compassG.sweep + shortestAngleDelta(compassG.lastAngle, ang);
          const clamped =
            Math.abs(nextSweep) > Math.PI * 2
              ? Math.sign(nextSweep) * Math.PI * 2
              : nextSweep;
          compassG.lastAngle = ang;
          compassG.sweep = clamped;
          let sweep = clamped;
          if (e.shiftKey) {
            const snap = Math.PI / 12;
            sweep = Math.round(sweep / snap) * snap;
          }
          setCompassDraft({
            ...d,
            angle: compassG.startAngle + sweep,
            arcStart: compassG.startAngle,
            arcSweep: sweep,
          });
        }
      }
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
    const compassG = compassGesture.current;
    const compass = compassDraftRef.current;
    if (compassG && store.tool === "compass" && compass) {
      if (compassG.mode === "place" && compass.r < 8) {
        setCompassDraft({
          ...compass,
          r: 80,
          angle: compass.r < 1 ? -Math.PI / 2 : compass.angle,
        });
      } else if (compassG.mode === "arc" && compass.r > 4) {
        let sweep = compass.arcSweep ?? compassG.sweep;
        const minSweep = 8 / Math.max(compass.r, 1);
        if (Math.abs(sweep) < minSweep) {
          sweep = minSweep * (sweep < 0 ? -1 : 1);
        }
        store.addCompassArc(compass.cx, compass.cy, compass.r, compassG.startAngle, sweep);
        setCompassDraft({
          cx: compass.cx,
          cy: compass.cy,
          r: compass.r,
          angle: compassG.startAngle + sweep,
        });
      }
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
    compassGesture.current = null;
    setCompassDrag(null);
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

  const compassFocus: CompassHit | null =
    compassDrag === "arc"
      ? null
      : compassDrag === "needle" || compassDrag === "pencil"
        ? compassDrag
        : compassDrag === "place"
          ? "pencil"
          : compassDraft && tool === "compass"
            ? hitCompass(compassDraft, pointer)
            : null;
  const compassCursor =
    compassFocus === "needle" || compassFocus === "pencil"
      ? compassDrag
        ? "grabbing"
        : "grab"
      : "crosshair";

  return (
    <div
      ref={boardRef}
      className="relative h-full w-full overflow-hidden bg-[#2a2622] [&[data-color-sampling]_*]:cursor-none"
      data-color-sampling={tool === "eyedropper" && colorLoupe ? "" : undefined}
      style={{
        width,
        height,
        cursor: tool === "eyedropper" && colorLoupe ? "none" : undefined,
      }}
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
              tool === "eyedropper" && colorLoupe
                ? "none"
                : tool === "text"
                ? "text"
                : tool === "pan"
                  ? "grab"
                  : tool === "select"
                    ? "default"
                    : tool === "compass"
                      ? compassCursor
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
          {compassDraft && (
            <CompassOverlay
              cx={compassDraft.cx}
              cy={compassDraft.cy}
              r={compassDraft.r}
              angle={compassDraft.angle}
              color={color}
              focus={compassFocus}
              arcStart={compassDraft.arcStart}
              arcSweep={compassDraft.arcSweep ?? 0}
            />
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
      {tool === "eyedropper" && colorLoupe && loupe && colorShot && (
        <ColorLoupe
          snapshot={colorShot}
          snapX={loupe.snapX}
          snapY={loupe.snapY}
          clientX={loupe.clientX}
          clientY={loupe.clientY}
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

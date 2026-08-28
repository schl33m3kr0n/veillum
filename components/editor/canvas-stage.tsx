"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Layer, Line, Rect, Stage, Circle } from "react-konva";
import type Konva from "konva";
import { useEditorStore } from "@/lib/editor-store";
import { interpolatedLayer, triangleGridLines } from "@/lib/geometry";
import { rgbToHex } from "@/lib/colors";
import { extractRawPreview } from "@/lib/raw";
import type { BezierPoint, Layer as DocLayer, Tool } from "@/lib/types";
import { HeaderFooter, LayerView, TransformerHost } from "./layer-view";

const RULER = 28;

function pageToLocal(
  stage: Konva.Stage,
  pageOffset: { x: number; y: number },
) {
  const pos = stage.getPointerPosition();
  if (!pos) return null;
  const scale = stage.scaleX();
  return {
    x: (pos.x - stage.x()) / scale - pageOffset.x,
    y: (pos.y - stage.y()) / scale - pageOffset.y,
  };
}

export default function CanvasStage({
  width,
  height,
}: {
  width: number;
  height: number;
}) {
  const stageRef = useRef<Konva.Stage>(null);
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

  const [draftPts, setDraftPts] = useState<number[] | null>(null);
  const [shapeDraft, setShapeDraft] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const [bezierDraft, setBezierDraft] = useState<BezierPoint[]>([]);
  const [maskPts, setMaskPts] = useState<number[] | null>(null);
  const drawing = useRef(false);
  const spacePan = useRef(false);

  const pageX = 80;
  const pageY = 60;

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

  const onWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const store = useEditorStore.getState();
    if (e.evt.ctrlKey || e.evt.metaKey) {
      const factor = e.evt.deltaY > 0 ? 0.92 : 1.08;
      store.setZoom(store.zoom * factor);
    } else {
      store.setPan(store.panX - e.evt.deltaX, store.panY - e.evt.deltaY);
    }
  };

  const pointer = useCallback((stage: Konva.Stage) => {
    return pageToLocal(stage, { x: pageX, y: pageY });
  }, []);

  const finishBezier = useCallback(() => {
    if (bezierDraft.length >= 2) {
      useEditorStore.getState().addBezier(bezierDraft, false);
    }
    setBezierDraft([]);
  }, [bezierDraft]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (tool === "bezier" && (e.key === "Enter" || e.key === "Escape")) {
        if (e.key === "Enter") finishBezier();
        else setBezierDraft([]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tool, finishBezier]);

  const onDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;
    const p = pointer(stage);
    if (!p) return;
    const store = useEditorStore.getState();
    const currentTool: Tool = spacePan.current ? "pan" : store.tool;

    if (currentTool === "pan" || e.evt instanceof MouseEvent && e.evt.button === 1) {
      drawing.current = true;
      stage.container().style.cursor = "grabbing";
      return;
    }

    if (currentTool === "eyedropper") {
      const canvas = stage.toCanvas({ pixelRatio: 1 });
      const ctx = canvas.getContext("2d");
      const pos = stage.getPointerPosition();
      if (ctx && pos) {
        const pix = ctx.getImageData(pos.x, pos.y, 1, 1).data;
        store.setColor(rgbToHex(pix[0], pix[1], pix[2]));
      }
      store.setTool("select");
      return;
    }

    if (currentTool === "instant-alpha") {
      const id = store.selectedIds[0];
      const layer = store.layers.find((l) => l.id === id);
      if (layer?.type === "image") {
        const nx = (p.x - layer.x) / Math.max(1, layer.width);
        const ny = (p.y - layer.y) / Math.max(1, layer.height);
        import("@/lib/filters").then(({ samplePixel }) => {
          samplePixel(layer.originalSrc, nx, ny).then((rgb) => {
            useEditorStore.getState().updateLayer(layer.id, {
              instantAlpha: {
                ...layer.instantAlpha,
                ...rgb,
                enabled: true,
              },
            });
          });
        });
      }
      return;
    }

    if (currentTool === "text") {
      store.addTextAt(p.x, p.y);
      return;
    }

    if (currentTool === "pencil" || currentTool === "pen" || currentTool === "highlighter") {
      drawing.current = true;
      setDraftPts([p.x, p.y]);
      return;
    }

    if (currentTool === "shape") {
      drawing.current = true;
      setShapeDraft({ x: p.x, y: p.y, w: 0, h: 0 });
      return;
    }

    if (currentTool === "bezier") {
      const last = bezierDraft[bezierDraft.length - 1];
      const handle = last
        ? { inX: -40, inY: 0, outX: 40, outY: 0 }
        : { inX: 0, inY: 0, outX: 40, outY: 0 };
      setBezierDraft([...bezierDraft, { x: p.x, y: p.y, ...handle }]);
      return;
    }

    if (currentTool === "mask") {
      drawing.current = true;
      setMaskPts([p.x, p.y]);
      return;
    }

    const clickedId = e.target.getParent()?.id() || e.target.id();
    const isStage = e.target === stage || e.target.name() === "page-bg" || e.target.name() === "board";
    if (isStage || !clickedId) {
      if (!e.evt.shiftKey) store.clearSelection();
      return;
    }
    const node = e.target.findAncestor((n: Konva.Node) =>
      store.layers.some((l) => l.id === n.id()),
    );
    const id = node?.id() || clickedId;
    if (store.layers.some((l) => l.id === id)) {
      store.select([id], e.evt.shiftKey);
    }
  };

  const onMove = () => {
    const stage = stageRef.current;
    if (!stage) return;
    const p = pointer(stage);
    if (!p) return;
    useEditorStore.getState().setPointer(p.x, p.y);

    if (!drawing.current) return;
    const store = useEditorStore.getState();
    const currentTool: Tool = spacePan.current ? "pan" : store.tool;

    if (currentTool === "pan") {
      const ev = stage.getPointerPosition();
      if (!ev) return;
      return;
    }

    if (draftPts) setDraftPts([...draftPts, p.x, p.y]);
    if (shapeDraft) {
      setShapeDraft({
        ...shapeDraft,
        w: p.x - shapeDraft.x,
        h: p.y - shapeDraft.y,
      });
    }
    if (maskPts) setMaskPts([...maskPts, p.x, p.y]);
  };

  const onPanDrag = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!(spacePan.current || useEditorStore.getState().tool === "pan")) return;
    if (!drawing.current) return;
    const store = useEditorStore.getState();
    store.setPan(store.panX + e.evt.movementX, store.panY + e.evt.movementY);
  };

  const onUp = () => {
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
    setDraftPts(null);
    setShapeDraft(null);
    setMaskPts(null);
    const el = stageRef.current?.container();
    if (el) el.style.cursor = cursorFor(store.tool);
  };

  const onDblClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const store = useEditorStore.getState();
    const node = e.target.findAncestor((n: Konva.Node) =>
      store.layers.some((l) => l.id === n.id()),
    );
    const id = node?.id();
    const layer = store.layers.find((l) => l.id === id);
    if (layer?.type === "text") {
      store.select([layer.id]);
      store.setEditingText(layer.id);
    }
  };

  const onDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const id = e.target.id();
    if (!id) return;
    useEditorStore.getState().updateLayer(id, {
      x: e.target.x(),
      y: e.target.y(),
    });
  };

  const onTransformEnd = (e: Konva.KonvaEventObject<Event>) => {
    const node = e.target;
    const id = node.id();
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);
    useEditorStore.getState().updateLayer(id, {
      x: node.x(),
      y: node.y(),
      rotation: node.rotation(),
      width: Math.max(8, node.width() * scaleX),
      height: Math.max(8, node.height() * scaleY),
    });
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

  const visibleLayers: DocLayer[] = layers.map((l) =>
    interpolatedLayer(l, playhead, playing || l.keyframes.length > 0 && playhead > 0),
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
    gridLines.push(...triangleGridLines(page.width, page.height, page.grid.size));
  }

  return (
    <div
      className="relative h-full w-full overflow-hidden bg-[#2a2622]"
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        x={panX}
        y={panY}
        scaleX={zoom}
        scaleY={zoom}
        onWheel={onWheel}
        onMouseDown={onDown}
        onTouchStart={onDown}
        onMouseMove={(e) => {
          onMove();
          onPanDrag(e);
        }}
        onMouseUp={onUp}
        onTouchEnd={onUp}
        onDblClick={onDblClick}
        onDragEnd={onDragEnd}
      >
        <Layer name="board">
          <Rect
            name="board"
            x={-4000}
            y={-4000}
            width={8000}
            height={8000}
            fill="#2a2622"
            listening
          />
          <Rect
            name="page-bg"
            x={pageX}
            y={pageY}
            width={page.width}
            height={page.height}
            fill={page.background}
            shadowColor="rgba(0,0,0,0.45)"
            shadowBlur={32}
            shadowOffsetY={14}
          />
          {gridLines.map((pts, i) => (
            <Line
              key={i}
              x={pageX}
              y={pageY}
              points={pts}
              stroke="rgba(28,25,22,0.12)"
              strokeWidth={1}
              listening={false}
            />
          ))}
          <Line
            x={pageX}
            y={pageY}
            points={[
              page.margins.left,
              page.margins.top,
              page.width - page.margins.right,
              page.margins.top,
              page.width - page.margins.right,
              page.height - page.margins.bottom,
              page.margins.left,
              page.height - page.margins.bottom,
              page.margins.left,
              page.margins.top,
            ]}
            stroke="rgba(196,92,38,0.35)"
            dash={[6, 4]}
            listening={false}
          />
          {page.header.enabled && (
            <HeaderFooter
              x={pageX + page.margins.left}
              y={pageY + 14}
              width={page.width - page.margins.left - page.margins.right}
              text={page.header.text}
              fontFamily={page.header.fontFamily}
              fontSize={page.header.fontSize}
              color={page.header.color}
            />
          )}
          {page.footer.enabled && (
            <HeaderFooter
              x={pageX + page.margins.left}
              y={pageY + page.height - 28}
              width={page.width - page.margins.left - page.margins.right}
              text={page.footer.text}
              fontFamily={page.footer.fontFamily}
              fontSize={page.footer.fontSize}
              color={page.footer.color}
            />
          )}
        </Layer>
        <Layer
          x={pageX}
          y={pageY}
          onTransformEnd={onTransformEnd}
        >
          {visibleLayers.map((layer) => (
            <LayerView
              key={layer.id}
              layer={layer}
              editing={editingTextId === layer.id}
            />
          ))}
          {draftPts && (
            <Line
              points={draftPts}
              stroke={tool === "highlighter" ? highlight : color}
              strokeWidth={tool === "highlighter" ? 18 : tool === "pen" ? 3 : 2}
              opacity={tool === "highlighter" ? 0.45 : 1}
              lineCap="round"
              lineJoin="round"
              tension={0.3}
            />
          )}
          {shapeDraft && (
            <Rect
              x={Math.min(shapeDraft.x, shapeDraft.x + shapeDraft.w)}
              y={Math.min(shapeDraft.y, shapeDraft.y + shapeDraft.h)}
              width={Math.abs(shapeDraft.w)}
              height={Math.abs(shapeDraft.h)}
              stroke={color}
              dash={[4, 4]}
            />
          )}
          {bezierDraft.map((pt, i) => (
            <Circle key={i} x={pt.x} y={pt.y} radius={4} fill="#c45c26" />
          ))}
          {bezierDraft.length > 1 && (
            <Line
              points={bezierDraft.flatMap((p) => [p.x, p.y])}
              stroke={color}
              strokeWidth={2}
              tension={0.4}
            />
          )}
          {maskPts && (
            <Line
              points={maskPts}
              stroke="#ffffff"
              strokeWidth={22}
              opacity={0.5}
              lineCap="round"
            />
          )}
          {tool === "select" && (
            <TransformerHost selectedIds={selectedIds} stageRef={stageRef} />
          )}
        </Layer>
      </Stage>
      <span className="sr-only">{RULER}</span>
    </div>
  );
}

function cursorFor(tool: Tool): string {
  switch (tool) {
    case "pan":
      return "grab";
    case "text":
      return "text";
    case "eyedropper":
    case "instant-alpha":
      return "crosshair";
    default:
      return "default";
  }
}

export { pageToLocal };

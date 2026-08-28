"use client";

import { useEffect, useRef } from "react";
import {
  Arrow,
  Ellipse,
  Group,
  Line,
  Path,
  Rect,
  RegularPolygon,
  Shape,
  Star,
  Image as KonvaImage,
  Text,
  Transformer,
} from "react-konva";
import type Konva from "konva";
import { bezierPath, dashArray } from "@/lib/geometry";
import { displayText, wrapLines } from "@/lib/text";
import { useEditorStore } from "@/lib/editor-store";
import type {
  BezierLayer,
  ImageLayer,
  Layer,
  PathLayer,
  ShapeLayer,
  TextLayer,
} from "@/lib/types";
import { useProcessedImage } from "./use-processed-image";

function common(layer: Layer, tool: string) {
  const drawing =
    tool === "pencil" ||
    tool === "pen" ||
    tool === "highlighter" ||
    tool === "shape" ||
    tool === "bezier" ||
    tool === "text" ||
    tool === "pan";
  return {
    id: layer.id,
    name: "layer",
    x: layer.x,
    y: layer.y,
    width: layer.width,
    height: layer.height,
    rotation: layer.rotation,
    scaleX: layer.scaleX,
    scaleY: layer.scaleY,
    opacity: layer.opacity,
    globalCompositeOperation: layer.blendMode,
    listening: layer.visible && !layer.locked && !drawing,
    visible: layer.visible,
    draggable: !layer.locked && tool === "select",
    onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => {
      useEditorStore.getState().updateLayer(layer.id, {
        x: e.target.x(),
        y: e.target.y(),
      });
    },
    onTransformEnd: (e: Konva.KonvaEventObject<Event>) => {
      const node = e.target;
      const sx = node.scaleX();
      const sy = node.scaleY();
      if (layer.type === "path" || layer.type === "bezier") {
        useEditorStore.getState().updateLayer(layer.id, {
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
          scaleX: sx,
          scaleY: sy,
        });
        return;
      }
      node.scaleX(1);
      node.scaleY(1);
      useEditorStore.getState().updateLayer(layer.id, {
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
        width: Math.max(8, (node.width() || layer.width) * sx),
        height: Math.max(8, (node.height() || layer.height) * sy),
        scaleX: 1,
        scaleY: 1,
      });
    },
  };
}

function Border({ layer }: { layer: Layer }) {
  if (!layer.borderEnabled || layer.borderWidth <= 0) return null;
  return (
    <Rect
      width={layer.width}
      height={layer.height}
      stroke={layer.borderColor}
      strokeWidth={layer.borderWidth}
      dash={dashArray(layer.borderDash, layer.borderWidth)}
      listening={false}
    />
  );
}

function drawTextLayer(ctx: Konva.Context, layer: TextLayer) {
  const c = ctx._context;
  const size =
    layer.superscript || layer.subscript
      ? layer.fontSize * 0.62
      : layer.capitalization === "small-caps"
        ? layer.fontSize * 0.78
        : layer.fontSize;
  const font = `${layer.italic ? "italic" : "normal"} ${layer.bold ? "700" : "400"} ${size}px "${layer.fontFamily}", serif`;
  c.font = font;
  c.fillStyle = layer.color;
  c.textBaseline = "top";
  const tracking = layer.letterSpacing + layer.kerning * 0.4;
  try {
    (c as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing =
      `${tracking}px`;
    (
      c as CanvasRenderingContext2D & { fontKerning: string }
    ).fontKerning = layer.kerning !== 0 ? "normal" : "none";
    (
      c as CanvasRenderingContext2D & { fontVariantCaps: string }
    ).fontVariantCaps =
      layer.capitalization === "small-caps" ? "small-caps" : "normal";
  } catch {
    /* canvas font features vary by browser */
  }

  const pad = layer.padding;
  const maxW = Math.max(20, layer.width - pad * 2 - layer.indent);
  const text = displayText(layer);
  const lines =
    layer.orientation === "vertical"
      ? text.split("").map((ch) => (ch === "\n" ? "" : ch))
      : wrapLines(c, text, maxW);
  const lh = size * layer.lineHeight;
  const startY =
    pad +
    (layer.superscript ? -size * 0.25 : layer.subscript ? size * 0.28 : 0);

  lines.forEach((line, i) => {
    let x = pad + layer.indent + (i === 0 ? layer.firstLineIndent : 0);
    const y = startY + i * lh;
    const lineW = c.measureText(line).width;
    if (layer.align === "center") x += (maxW - lineW) / 2;
    if (layer.align === "right") x += maxW - lineW;

    if (layer.highlight) {
      c.fillStyle = layer.highlight;
      c.fillRect(x - 3, y - 1, Math.max(lineW, 4) + 6, lh);
      c.fillStyle = layer.color;
    }

    if (!layer.ligatures) {
      let cx = x;
      for (const ch of line) {
        c.fillText(ch, cx, y);
        cx += c.measureText(ch).width + tracking;
      }
    } else if (layer.align === "justify" && i < lines.length - 1) {
      const words = line.split(" ");
      const space = c.measureText(" ").width;
      const extra =
        words.length > 1 ? (maxW - lineW) / (words.length - 1) : 0;
      let cx = pad + layer.indent;
      words.forEach((word) => {
        c.fillText(word, cx, y);
        cx += c.measureText(word).width + space + extra;
      });
    } else {
      c.fillText(line, x, y);
    }

    if (layer.underline || layer.strikethrough) {
      c.strokeStyle = layer.color;
      c.lineWidth = Math.max(1, size / 14);
      const w = Math.max(lineW, 4);
      if (layer.underline) {
        c.beginPath();
        c.moveTo(x, y + size + 2);
        c.lineTo(x + w, y + size + 2);
        c.stroke();
      }
      if (layer.strikethrough) {
        c.beginPath();
        c.moveTo(x, y + size * 0.55);
        c.lineTo(x + w, y + size * 0.55);
        c.stroke();
      }
    }
  });
}

function TextView({
  layer,
  hidden,
  tool,
}: {
  layer: TextLayer;
  hidden?: boolean;
  tool: string;
}) {
  const extra =
    typeof layer.orientation === "number" ? layer.orientation : 0;
  return (
    <Group {...common(layer, tool)} rotation={layer.rotation + extra} opacity={hidden ? 0 : layer.opacity}>
      <Rect width={layer.width} height={layer.height} fill="rgba(0,0,0,0)" />
      <Shape
        width={layer.width}
        height={layer.height}
        sceneFunc={(ctx, shape) => {
          drawTextLayer(ctx, layer);
          ctx.fillStrokeShape(shape);
        }}
        hitFunc={(ctx, shape) => {
          ctx.beginPath();
          ctx.rect(0, 0, layer.width, layer.height);
          ctx.closePath();
          ctx.fillStrokeShape(shape);
        }}
        listening={false}
      />
      <Border layer={layer} />
    </Group>
  );
}

function ImageView({ layer, tool }: { layer: ImageLayer; tool: string }) {
  const image = useProcessedImage(layer);
  return (
    <Group {...common(layer, tool)}>
      {image && (
        <KonvaImage image={image} width={layer.width} height={layer.height} />
      )}
      <Border layer={layer} />
    </Group>
  );
}

function ShapeView({ layer, tool }: { layer: ShapeLayer; tool: string }) {
  const dash = dashArray(layer.dash, layer.strokeWidth);
  const fill = layer.fillEnabled ? layer.fill : "transparent";
  const stroke = layer.strokeWidth > 0 ? layer.stroke : undefined;
  const w = layer.width;
  const h = layer.height;
  const shared = {
    fill,
    stroke,
    strokeWidth: layer.strokeWidth,
    dash,
  };
  return (
    <Group {...common(layer, tool)}>
      {layer.shape === "rect" && (
        <Rect width={w} height={h} cornerRadius={layer.cornerRadius} {...shared} />
      )}
      {layer.shape === "ellipse" && (
        <Ellipse x={w / 2} y={h / 2} radiusX={w / 2} radiusY={h / 2} {...shared} />
      )}
      {layer.shape === "triangle" && (
        <RegularPolygon
          x={w / 2}
          y={h / 2}
          sides={3}
          radius={Math.min(w, h) / 2}
          {...shared}
        />
      )}
      {layer.shape === "hexagon" && (
        <RegularPolygon
          x={w / 2}
          y={h / 2}
          sides={6}
          radius={Math.min(w, h) / 2}
          {...shared}
        />
      )}
      {layer.shape === "star" && (
        <Star
          x={w / 2}
          y={h / 2}
          numPoints={5}
          innerRadius={Math.min(w, h) / 5}
          outerRadius={Math.min(w, h) / 2}
          {...shared}
        />
      )}
      {layer.shape === "line" && (
        <Line points={[0, h / 2, w, h / 2]} stroke={layer.stroke} strokeWidth={layer.strokeWidth} dash={dash} lineCap="round" />
      )}
      {layer.shape === "arrow" && (
        <Arrow
          points={[4, h / 2, w - 4, h / 2]}
          stroke={layer.stroke}
          fill={layer.stroke}
          strokeWidth={layer.strokeWidth}
          pointerLength={12}
          pointerWidth={12}
          dash={dash}
        />
      )}
      <Border layer={layer} />
    </Group>
  );
}

function PathView({ layer, tool }: { layer: PathLayer; tool: string }) {
  return (
    <Group {...common(layer, tool)}>
      <Line
        points={layer.points}
        stroke={layer.stroke}
        strokeWidth={layer.strokeWidth}
        tension={layer.tension}
        lineCap="round"
        lineJoin="round"
        globalCompositeOperation={
          layer.tool === "highlighter" ? "multiply" : layer.blendMode
        }
      />
      <Border layer={layer} />
    </Group>
  );
}

function BezierView({ layer, tool }: { layer: BezierLayer; tool: string }) {
  const d = bezierPath(layer.points, layer.closed);
  return (
    <Group {...common(layer, tool)}>
      <Path
        data={d}
        stroke={layer.stroke}
        strokeWidth={layer.strokeWidth}
        fill={layer.fillEnabled ? layer.fill : "transparent"}
        lineCap="round"
        lineJoin="round"
      />
      <Border layer={layer} />
    </Group>
  );
}

export function LayerView({
  layer,
  editing,
}: {
  layer: Layer;
  editing?: boolean;
}) {
  const tool = useEditorStore((s) => s.tool);
  if (layer.type === "text") return <TextView layer={layer} hidden={editing} tool={tool} />;
  if (layer.type === "image") return <ImageView layer={layer} tool={tool} />;
  if (layer.type === "shape") return <ShapeView layer={layer} tool={tool} />;
  if (layer.type === "path") return <PathView layer={layer} tool={tool} />;
  return <BezierView layer={layer} tool={tool} />;
}

export function TransformerHost({
  selectedIds,
  stageRef,
}: {
  selectedIds: string[];
  stageRef: React.RefObject<Konva.Stage | null>;
}) {
  const trRef = useRef<Konva.Transformer>(null);
  useEffect(() => {
    const stage = stageRef.current;
    const tr = trRef.current;
    if (!stage || !tr) return;
    const nodes = selectedIds
      .map((id) => stage.findOne(`#${id}`))
      .filter((n): n is Konva.Node => Boolean(n));
    tr.nodes(nodes);
    tr.getLayer()?.batchDraw();
  }, [selectedIds, stageRef]);
  return (
    <Transformer
      ref={trRef}
      rotateEnabled
      boundBoxFunc={(oldBox, newBox) => {
        if (newBox.width < 8 || newBox.height < 8) return oldBox;
        return newBox;
      }}
      anchorStroke="#c45c26"
      anchorFill="#f7f1e6"
      borderStroke="#c45c26"
    />
  );
}

export function HeaderFooter({
  text,
  x,
  y,
  width,
  fontFamily,
  fontSize,
  color,
}: {
  text: string;
  x: number;
  y: number;
  width: number;
  fontFamily: string;
  fontSize: number;
  color: string;
}) {
  return (
    <Text
      x={x}
      y={y}
      width={width}
      text={text}
      fontFamily={fontFamily}
      fontSize={fontSize}
      fill={color}
      listening={false}
    />
  );
}

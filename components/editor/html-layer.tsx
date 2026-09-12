"use client";

import type { CSSProperties } from "react";
import { bezierPath, dashArray } from "@/lib/geometry";
import { fillPaint } from "@/lib/fill";
import { pieGeometry, shapeSvgPoints } from "@/lib/shapes";
import { resolveSvgPaint, svgMarkViewBox, svgNodeStrokeWidth } from "@/lib/svg-mark";
import { displayText, textDecoration } from "@/lib/text";
import { useEditorStore } from "@/lib/editor-store";
import { cssFontFamily, cssFontWeight } from "@/lib/fonts";
import type { BezierLayer, ImageLayer, Layer, PathLayer, ShapeLayer, TextLayer } from "@/lib/types";
import { FillDefs } from "./fill-defs";
import { useProcessedImage } from "./use-processed-image";

function cssBlend(mode: Layer["blendMode"]): CSSProperties["mixBlendMode"] {
  if (mode === "source-over") return "normal";
  return mode as CSSProperties["mixBlendMode"];
}

export { SvgMarkContent };

export function HtmlLayer({
  layer,
  selected,
  tool,
  onPointerDown,
}: {
  layer: Layer;
  selected: boolean;
  tool: string;
  onPointerDown: (e: React.PointerEvent, id: string) => void;
}) {
  const extra =
    layer.type === "text" && typeof layer.orientation === "number"
      ? layer.orientation
      : 0;
  const interactive = tool === "select" || tool === "instant-alpha";
  const style: CSSProperties = {
    position: "absolute",
    left: layer.x,
    top: layer.y,
    width: layer.width,
    height: layer.height,
    transform: `rotate(${layer.rotation + extra}deg) scale(${layer.scaleX}, ${layer.scaleY})`,
    transformOrigin: "top left",
    opacity: layer.opacity,
    mixBlendMode: cssBlend(layer.blendMode),
    visibility: layer.visible ? "visible" : "hidden",
    pointerEvents: interactive && !layer.locked ? "auto" : "none",
    cursor: interactive && !layer.locked ? "move" : "default",
    outline: selected && layer.locked ? "1.5px solid #c45c26" : undefined,
    outlineOffset: 2,
    boxSizing: "border-box",
    overflow: layer.type === "path" || layer.type === "bezier" || (layer.type === "shape" && layer.shape === "svg") ? "visible" : "hidden",
    WebkitMaskImage:
      layer.maskEnabled && layer.maskSrc ? `url(${layer.maskSrc})` : undefined,
    maskImage:
      layer.maskEnabled && layer.maskSrc ? `url(${layer.maskSrc})` : undefined,
    WebkitMaskSize: "100% 100%",
    maskSize: "100% 100%",
  };

  return (
    <div
      data-layer-id={layer.id}
      style={style}
      onPointerDown={(e) => onPointerDown(e, layer.id)}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (layer.type !== "text" || layer.locked || tool !== "select") return;
        useEditorStore.getState().select([layer.id]);
        useEditorStore.getState().setEditingText(layer.id);
      }}
    >
      {layer.type === "text" && <TextContent layer={layer} />}
      {layer.type === "image" && <ImageContent layer={layer} />}
      {layer.type === "shape" && <ShapeContent layer={layer} />}
      {layer.type === "path" && <PathContent layer={layer} />}
      {layer.type === "bezier" && <BezierContent layer={layer} />}
      {layer.borderEnabled && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            border: `${layer.borderWidth}px ${layer.borderDash === "solid" ? "solid" : layer.borderDash === "dot" ? "dotted" : "dashed"} ${layer.borderColor}`,
          }}
        />
      )}
    </div>
  );
}

function TextContent({ layer }: { layer: TextLayer }) {
  const size =
    layer.superscript || layer.subscript
      ? layer.fontSize * 0.62
      : layer.fontSize;
  const tracking = layer.letterSpacing + layer.kerning * 0.4;
  const whiteSpace =
    layer.orientation === "vertical" ? "pre-wrap" : "pre-wrap";
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        padding: layer.padding,
        paddingLeft: layer.padding + layer.indent,
        color: layer.color,
        background: layer.highlight ?? "transparent",
        boxDecorationBreak: "clone",
        WebkitBoxDecorationBreak: "clone",
        fontFamily: cssFontFamily(layer.fontFamily),
        fontSize: size,
        fontStyle: layer.italic ? "italic" : "normal",
        fontWeight: cssFontWeight(layer.fontFamily, layer.bold),
        lineHeight: layer.lineHeight,
        letterSpacing: tracking,
        textAlign: layer.align,
        textDecoration: textDecoration(layer) || undefined,
        fontVariantLigatures: layer.ligatures ? "common-ligatures" : "none",
        fontKerning: layer.kerning !== 0 ? "normal" : "none",
        fontVariantCaps:
          layer.capitalization === "small-caps" ? "small-caps" : "normal",
        verticalAlign: layer.superscript
          ? "super"
          : layer.subscript
            ? "sub"
            : undefined,
        writingMode:
          layer.orientation === "vertical" ? "vertical-rl" : "horizontal-tb",
        textIndent: layer.firstLineIndent,
        whiteSpace,
        overflow: "hidden",
        userSelect: "none",
      }}
    >
      {displayText(layer)}
    </div>
  );
}

function ImageContent({ layer }: { layer: ImageLayer }) {
  const image = useProcessedImage(layer);
  if (!image) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#ddd6c8] text-[11px] text-[#7a7268]">
        Developing…
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={image.src}
      alt={layer.name}
      draggable={false}
      className="h-full w-full object-cover"
    />
  );
}

function SvgMarkContent({
  layer,
  className,
}: {
  layer: Pick<
    ShapeLayer,
    | "svgNodes"
    | "svgViewBox"
    | "fill"
    | "stroke"
    | "fillEnabled"
    | "strokeEnabled"
    | "strokeWidth"
    | "dash"
    | "fillStyle"
    | "fillTo"
    | "fillAngle"
  > & { id?: string };
  className?: string;
}) {
  const dash = dashArray(layer.dash, layer.strokeWidth).join(" ");
  return (
    <svg
      className={className}
      width="100%"
      height="100%"
      viewBox={svgMarkViewBox(layer)}
      preserveAspectRatio="xMidYMid meet"
      overflow="visible"
    >
      {layer.id ? <FillDefs layer={layer as ShapeLayer} /> : null}
      {(layer.svgNodes ?? []).map((node, i) => {
        const fallback =
          node.tag === "path" && node.stroke && node.stroke !== "none"
            ? "none"
            : "fill";
        const fill = resolveSvgPaint(node.fill, layer, fallback);
        const stroke = resolveSvgPaint(node.stroke, layer, "none");
        const sw = svgNodeStrokeWidth(node, layer);
        if (node.tag === "circle") {
          return (
            <circle
              key={i}
              cx={node.cx}
              cy={node.cy}
              r={node.r}
              fill={fill}
              stroke={stroke}
              strokeWidth={sw}
              strokeDasharray={dash || undefined}
            />
          );
        }
        return (
          <path
            key={i}
            d={node.d}
            fill={fill}
            fillRule="evenodd"
            stroke={stroke}
            strokeWidth={sw}
            strokeLinecap={node.strokeLinecap}
            strokeLinejoin={node.strokeLinejoin}
            strokeDasharray={dash || undefined}
          />
        );
      })}
    </svg>
  );
}

function ShapeContent({ layer }: { layer: ShapeLayer }) {
  const dash = dashArray(layer.dash, layer.strokeWidth).join(" ");
  const fill = fillPaint(layer);
  const w = Math.max(1, layer.width);
  const h = Math.max(1, layer.height);
  const strokeOn = layer.strokeEnabled !== false && layer.strokeWidth > 0;
  const stroke = strokeOn ? layer.stroke : "none";
  const geo = shapeSvgPoints(layer);
  if (layer.shape === "svg") {
    return <SvgMarkContent layer={layer} />;
  }
  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <FillDefs layer={layer} />
      {layer.shape === "rect" && (
        <rect
          x={layer.strokeWidth / 2}
          y={layer.strokeWidth / 2}
          width={Math.max(0, w - layer.strokeWidth)}
          height={Math.max(0, h - layer.strokeWidth)}
          rx={layer.cornerRadius}
          fill={fill}
          stroke={stroke}
          strokeWidth={layer.strokeWidth}
          strokeDasharray={dash || undefined}
        />
      )}
      {layer.shape === "ellipse" && (
        <ellipse
          cx={w / 2}
          cy={h / 2}
          rx={Math.max(1, w / 2 - layer.strokeWidth / 2)}
          ry={Math.max(1, h / 2 - layer.strokeWidth / 2)}
          fill={fill}
          stroke={stroke}
          strokeWidth={layer.strokeWidth}
          strokeDasharray={dash || undefined}
        />
      )}
      {layer.shape === "pie" && (() => {
        const pad = layer.strokeWidth / 2;
        const pie = pieGeometry(w, h, layer.wedge ?? 0.38, pad);
        return (
          <>
            <ellipse
              cx={pie.cx}
              cy={pie.cy}
              rx={pie.rx}
              ry={pie.ry}
              fill={layer.trackFill || "#efe6d8"}
              stroke="none"
            />
            {layer.fillEnabled && (
              pie.full ? (
                <ellipse
                  cx={pie.cx}
                  cy={pie.cy}
                  rx={pie.rx}
                  ry={pie.ry}
                  fill={fill}
                  stroke="none"
                />
              ) : (
                <path d={pie.d} fill={fill} stroke="none" />
              )
            )}
            {strokeOn && (
              <ellipse
                cx={pie.cx}
                cy={pie.cy}
                rx={pie.rx}
                ry={pie.ry}
                fill="none"
                stroke={stroke}
                strokeWidth={layer.strokeWidth}
                strokeDasharray={dash || undefined}
              />
            )}
          </>
        );
      })()}
      {geo.polygon && (
        <polygon
          points={geo.polygon}
          fill={fill}
          stroke={stroke}
          strokeWidth={layer.strokeWidth}
          strokeDasharray={dash || undefined}
          strokeLinejoin="round"
        />
      )}
      {layer.shape === "line" && (
        <line
          x1={0}
          y1={h / 2}
          x2={w}
          y2={h / 2}
          stroke={strokeOn ? layer.stroke : "transparent"}
          strokeWidth={strokeOn ? layer.strokeWidth : 12}
          strokeDasharray={dash || undefined}
          strokeLinecap="round"
        />
      )}
      {geo.arrow && (
        <>
          <line
            x1={geo.arrow.x1}
            y1={geo.arrow.y1}
            x2={geo.arrow.x2}
            y2={geo.arrow.y2}
            stroke={strokeOn ? layer.stroke : "transparent"}
            strokeWidth={strokeOn ? layer.strokeWidth : 12}
            strokeDasharray={dash || undefined}
          />
          <polygon
            points={geo.arrow.points}
            fill={
              strokeOn
                ? layer.stroke
                : layer.fillEnabled
                  ? layer.fill
                  : "transparent"
            }
          />
        </>
      )}
    </svg>
  );
}

function PathContent({ layer }: { layer: PathLayer }) {
  const pts: string[] = [];
  for (let i = 0; i < layer.points.length; i += 2) {
    pts.push(`${layer.points[i]},${layer.points[i + 1]}`);
  }
  const w = Math.max(layer.width, 1);
  const h = Math.max(layer.height, 1);
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      overflow="visible"
      className="overflow-visible"
    >
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={layer.stroke}
        strokeWidth={layer.strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={layer.tool === "highlighter" ? 0.85 : 1}
      />
    </svg>
  );
}

function BezierContent({ layer }: { layer: BezierLayer }) {
  const d = bezierPath(layer.points, layer.closed);
  const w = Math.max(layer.width, 1);
  const h = Math.max(layer.height, 1);
  const hit = Math.max(16, layer.strokeWidth + 12);
  return (
    <svg width={w} height={h} overflow="visible">
      <FillDefs layer={layer} />
      <path
        d={d}
        fill="none"
        stroke="transparent"
        strokeWidth={hit}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={d}
        fill={fillPaint(layer)}
        stroke={layer.stroke}
        strokeWidth={layer.strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}


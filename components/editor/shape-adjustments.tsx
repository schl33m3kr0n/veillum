"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEditorStore } from "@/lib/editor-store";
import type { DashStyle, FillStyle, ShapeKind, ShapeLayer } from "@/lib/types";
import { SHAPE_KINDS } from "@/lib/shapes";
import { cn } from "@/lib/utils";
import { Field, SliderField } from "./fields";

export function ShapeAdjustments({
  layer,
  compact = false,
}: {
  layer: ShapeLayer | null;
  compact?: boolean;
}) {
  const shapeKind = useEditorStore((s) => s.shapeKind);
  const shapeFillEnabled = useEditorStore((s) => s.shapeFillEnabled);
  const shapeFillStyle = useEditorStore((s) => s.shapeFillStyle);
  const shapeFillTo = useEditorStore((s) => s.shapeFillTo);
  const shapeFillAngle = useEditorStore((s) => s.shapeFillAngle);
  const shapeStrokeEnabled = useEditorStore((s) => s.shapeStrokeEnabled);
  const color = useEditorStore((s) => s.color);
  const shapeStroke = useEditorStore((s) => s.shapeStroke);
  const shapeStrokeWidth = useEditorStore((s) => s.shapeStrokeWidth);
  const shapeCornerRadius = useEditorStore((s) => s.shapeCornerRadius);
  const shapeSides = useEditorStore((s) => s.shapeSides);
  const shapeStarPoints = useEditorStore((s) => s.shapeStarPoints);
  const shapeInnerRatio = useEditorStore((s) => s.shapeInnerRatio);
  const shapeArrowHead = useEditorStore((s) => s.shapeArrowHead);
  const shapeWedge = useEditorStore((s) => s.shapeWedge);
  const shapeTrackFill = useEditorStore((s) => s.shapeTrackFill);

  const kind = layer?.shape ?? shapeKind;
  const fillEnabled = layer?.fillEnabled ?? shapeFillEnabled;
  const fillStyle = layer?.fillStyle ?? shapeFillStyle;
  const fillTo = layer?.fillTo ?? shapeFillTo;
  const fillAngle = layer?.fillAngle ?? shapeFillAngle;
  const strokeEnabled = layer?.strokeEnabled ?? shapeStrokeEnabled;
  const fill = layer?.fill ?? color;
  const stroke = layer?.stroke ?? shapeStroke;
  const strokeWidth = layer?.strokeWidth ?? shapeStrokeWidth;
  const dash = layer?.dash ?? "solid";
  const cornerRadius = layer?.cornerRadius ?? shapeCornerRadius;
  const sides = layer?.sides ?? shapeSides;
  const starPoints = layer?.starPoints ?? shapeStarPoints;
  const innerRatio = layer?.innerRatio ?? shapeInnerRatio;
  const arrowHead = layer?.arrowHead ?? shapeArrowHead;
  const wedge = layer?.wedge ?? shapeWedge;
  const trackFill = layer?.trackFill ?? shapeTrackFill;

  const patch = (partial: Partial<ShapeLayer>) => {
    const s = useEditorStore.getState();
    if (layer) {
      s.updateLayer(layer.id, partial);
    }
    if (partial.shape) s.setShapeKind(partial.shape);
    if (partial.fill) s.setColor(partial.fill);
    if (partial.stroke) s.setShapeStroke(partial.stroke);
    if (partial.fillEnabled != null) s.setShapeFillEnabled(partial.fillEnabled);
    if (partial.fillStyle) s.setShapeFillStyle(partial.fillStyle);
    if (partial.fillTo) s.setShapeFillTo(partial.fillTo);
    if (partial.fillAngle != null) s.setShapeFillAngle(partial.fillAngle);
    if (partial.strokeEnabled != null) s.setShapeStrokeEnabled(partial.strokeEnabled);
    if (partial.strokeWidth != null) s.setShapeStrokeWidth(partial.strokeWidth);
    if (partial.cornerRadius != null) s.setShapeCornerRadius(partial.cornerRadius);
    if (partial.sides != null) s.setShapeSides(partial.sides);
    if (partial.starPoints != null) s.setShapeStarPoints(partial.starPoints);
    if (partial.innerRatio != null) s.setShapeInnerRatio(partial.innerRatio);
    if (partial.arrowHead != null) s.setShapeArrowHead(partial.arrowHead);
    if (partial.wedge != null) s.setShapeWedge(partial.wedge);
    if (partial.trackFill != null) s.setShapeTrackFill(partial.trackFill);
  };

  return (
    <div className="space-y-2">
      {!compact && kind !== "svg" && (
        <Field label="Kind">
          <Select
            value={kind}
            onValueChange={(shape) => patch({ shape: shape as ShapeKind })}
          >
            <SelectTrigger size="sm" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SHAPE_KINDS.filter((k) => k.id !== "svg").map((k) => (
                <SelectItem key={k.id} value={k.id}>
                  {k.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      )}
      <div className="grid grid-cols-2 gap-2">
        <PaintField
          label="Fill"
          enabled={fillEnabled}
          color={fill}
          onEnabled={(enabled) => patch({ fillEnabled: enabled })}
          onColor={(value) => patch({ fill: value, fillEnabled: true })}
        />
        <PaintField
          label="Stroke"
          enabled={strokeEnabled}
          color={stroke}
          onEnabled={(enabled) => patch({ strokeEnabled: enabled })}
          onColor={(value) => patch({ stroke: value, strokeEnabled: true })}
        />
      </div>
      {fillEnabled && (
        <>
          <Field label="Fill style">
            <Select
              value={fillStyle}
              onValueChange={(value) =>
                patch({ fillStyle: value as FillStyle, fillEnabled: true })
              }
            >
              <SelectTrigger size="sm" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="solid">Solid</SelectItem>
                <SelectItem value="linear">Lateral</SelectItem>
                <SelectItem value="radial">Radial</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          {fillStyle !== "solid" && (
            <div className={fillStyle === "linear" ? "grid grid-cols-2 gap-2" : ""}>
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  To
                </span>
                <input
                  type="color"
                  value={fillTo}
                  title="Gradient end"
                  onChange={(e) => patch({ fillTo: e.target.value, fillEnabled: true })}
                  className="h-8 w-full cursor-pointer rounded-md border border-border bg-background p-0.5"
                />
              </div>
              {fillStyle === "linear" && (
                <SliderField
                  label="Angle"
                  value={fillAngle}
                  min={0}
                  max={180}
                  step={1}
                  onChange={(value) => patch({ fillAngle: value })}
                  format={(v) => `${Math.round(v)}°`}
                />
              )}
            </div>
          )}
        </>
      )}
      {strokeEnabled && (
        <SliderField
          label="Stroke width"
          value={strokeWidth}
          min={0.5}
          max={24}
          step={0.5}
          onChange={(value) => patch({ strokeWidth: value })}
        />
      )}
      {strokeEnabled && !compact && (
        <Field label="Stroke style">
          <Select
            value={dash}
            onValueChange={(value) => patch({ dash: value as DashStyle })}
          >
            <SelectTrigger size="sm" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="solid">Solid</SelectItem>
              <SelectItem value="dash">Dash</SelectItem>
              <SelectItem value="dot">Dot</SelectItem>
              <SelectItem value="dashdot">Dash-dot</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      )}
      {kind === "rect" && (
        <SliderField
          label="Corners"
          value={cornerRadius}
          min={0}
          max={120}
          step={1}
          onChange={(value) => patch({ cornerRadius: value })}
          format={(v) => `${Math.round(v)}`}
        />
      )}
      {kind === "hexagon" && (
        <SliderField
          label="Sides"
          value={sides}
          min={3}
          max={12}
          step={1}
          onChange={(value) => patch({ sides: Math.round(value) })}
          format={(v) => `${Math.round(v)}`}
        />
      )}
      {kind === "star" && (
        <>
          <SliderField
            label="Points"
            value={starPoints}
            min={3}
            max={12}
            step={1}
            onChange={(value) => patch({ starPoints: Math.round(value) })}
            format={(v) => `${Math.round(v)}`}
          />
          <SliderField
            label="Inner radius"
            value={innerRatio}
            min={0.12}
            max={0.85}
            step={0.01}
            onChange={(value) => patch({ innerRatio: value })}
            format={(v) => `${Math.round(v * 100)}%`}
          />
        </>
      )}
      {kind === "pie" && (
        <>
          <SliderField
            label="Wedge"
            value={wedge * 100}
            min={2}
            max={98}
            step={1}
            onChange={(value) => patch({ wedge: value / 100 })}
            format={(v) => `${Math.round(v)}%`}
          />
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Rest
            </span>
            <input
              type="color"
              value={trackFill}
              title="Rest"
              onChange={(e) => patch({ trackFill: e.target.value })}
              className="h-8 w-full cursor-pointer rounded-md border border-border bg-background p-0.5"
            />
          </div>
        </>
      )}
      {kind === "arrow" && (
        <SliderField
          label="Arrowhead"
          value={arrowHead}
          min={8}
          max={64}
          step={1}
          onChange={(value) => patch({ arrowHead: value })}
          format={(v) => `${Math.round(v)}`}
        />
      )}
      {layer && (
        <>
          <SliderField
            label="Width"
            value={layer.width}
            min={8}
            max={960}
            step={1}
            onChange={(width) => patch({ width })}
            format={(v) => `${Math.round(v)}`}
          />
          <SliderField
            label="Height"
            value={layer.height}
            min={8}
            max={960}
            step={1}
            onChange={(height) => patch({ height })}
            format={(v) => `${Math.round(v)}`}
          />
          <SliderField
            label="Rotation"
            value={layer.rotation}
            min={-180}
            max={180}
            step={1}
            onChange={(rotation) => patch({ rotation })}
            format={(v) => `${Math.round(v)}°`}
          />
        </>
      )}
    </div>
  );
}

function PaintField({
  label,
  enabled,
  color,
  onEnabled,
  onColor,
}: {
  label: string;
  enabled: boolean;
  color: string;
  onEnabled: (enabled: boolean) => void;
  onColor: (color: string) => void;
}) {
  return (
    <div className="space-y-1">
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div className="flex gap-1">
        <button
          type="button"
          title={`No ${label.toLowerCase()}`}
          aria-pressed={!enabled}
          onClick={() => onEnabled(false)}
          className={cn(
            "relative size-8 shrink-0 overflow-hidden rounded-md border",
            !enabled
              ? "border-primary ring-2 ring-primary/35"
              : "border-border hover:border-primary/50",
          )}
        >
          <span
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(45deg,#c8c2b6 25%,transparent 25%,transparent 75%,#c8c2b6 75%),linear-gradient(45deg,#c8c2b6 25%,#f7f1e6 25%,#f7f1e6 75%,#c8c2b6 75%)",
              backgroundSize: "8px 8px",
              backgroundPosition: "0 0, 4px 4px",
            }}
          />
          <span className="absolute inset-[-20%] rotate-45 border-t-2 border-[#c45c26]" />
        </button>
        <input
          type="color"
          value={color}
          title={label}
          onChange={(e) => onColor(e.target.value)}
          className={cn(
            "h-8 min-w-0 flex-1 cursor-pointer rounded-md border bg-background p-0.5",
            enabled
              ? "border-primary ring-2 ring-primary/30"
              : "border-border opacity-70",
          )}
        />
      </div>
    </div>
  );
}

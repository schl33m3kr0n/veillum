"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEditorStore } from "@/lib/editor-store";
import type { DashStyle, ShapeKind, ShapeLayer } from "@/lib/types";
import { SHAPE_KINDS } from "@/lib/shapes";
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
  const color = useEditorStore((s) => s.color);
  const shapeStroke = useEditorStore((s) => s.shapeStroke);
  const shapeStrokeWidth = useEditorStore((s) => s.shapeStrokeWidth);
  const shapeCornerRadius = useEditorStore((s) => s.shapeCornerRadius);
  const shapeSides = useEditorStore((s) => s.shapeSides);
  const shapeStarPoints = useEditorStore((s) => s.shapeStarPoints);
  const shapeInnerRatio = useEditorStore((s) => s.shapeInnerRatio);
  const shapeArrowHead = useEditorStore((s) => s.shapeArrowHead);

  const kind = layer?.shape ?? shapeKind;
  const fillEnabled = layer?.fillEnabled ?? shapeFillEnabled;
  const fill = layer?.fill ?? color;
  const stroke = layer?.stroke ?? shapeStroke;
  const strokeWidth = layer?.strokeWidth ?? shapeStrokeWidth;
  const dash = layer?.dash ?? "solid";
  const cornerRadius = layer?.cornerRadius ?? shapeCornerRadius;
  const sides = layer?.sides ?? shapeSides;
  const starPoints = layer?.starPoints ?? shapeStarPoints;
  const innerRatio = layer?.innerRatio ?? shapeInnerRatio;
  const arrowHead = layer?.arrowHead ?? shapeArrowHead;

  const patch = (partial: Partial<ShapeLayer>) => {
    const s = useEditorStore.getState();
    if (layer) {
      s.updateLayer(layer.id, partial);
    }
    if (partial.shape) s.setShapeKind(partial.shape);
    if (partial.fill) s.setColor(partial.fill);
    if (partial.stroke) s.setShapeStroke(partial.stroke);
    if (partial.fillEnabled != null) s.setShapeFillEnabled(partial.fillEnabled);
    if (partial.strokeWidth != null) s.setShapeStrokeWidth(partial.strokeWidth);
    if (partial.cornerRadius != null) s.setShapeCornerRadius(partial.cornerRadius);
    if (partial.sides != null) s.setShapeSides(partial.sides);
    if (partial.starPoints != null) s.setShapeStarPoints(partial.starPoints);
    if (partial.innerRatio != null) s.setShapeInnerRatio(partial.innerRatio);
    if (partial.arrowHead != null) s.setShapeArrowHead(partial.arrowHead);
  };

  return (
    <div className="space-y-2">
      {!compact && (
        <Field label="Kind">
          <Select
            value={kind}
            onValueChange={(shape) => patch({ shape: shape as ShapeKind })}
          >
            <SelectTrigger size="sm" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SHAPE_KINDS.map((k) => (
                <SelectItem key={k.id} value={k.id}>
                  {k.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      )}
      <div className="flex items-center justify-between">
        <Label className="text-[11px]">Fill</Label>
        <Switch
          size="sm"
          checked={fillEnabled}
          onCheckedChange={(enabled) => patch({ fillEnabled: enabled })}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="space-y-1">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Fill
          </span>
          <input
            type="color"
            value={fill}
            disabled={!fillEnabled}
            onChange={(e) => patch({ fill: e.target.value })}
            className="h-8 w-full cursor-pointer rounded-md border border-border bg-background p-0.5 disabled:opacity-40"
          />
        </label>
        <label className="space-y-1">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Stroke
          </span>
          <input
            type="color"
            value={stroke}
            onChange={(e) => patch({ stroke: e.target.value })}
            className="h-8 w-full cursor-pointer rounded-md border border-border bg-background p-0.5"
          />
        </label>
      </div>
      <SliderField
        label="Stroke width"
        value={strokeWidth}
        min={0}
        max={24}
        step={0.5}
        onChange={(value) => patch({ strokeWidth: value })}
      />
      {!compact && (
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

"use client";

import { useRef, useState } from "react";
import { Link2, Link2Off } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEditorStore } from "@/lib/editor-store";
import {
  BLEND_MODES,
  type Anchor,
  type Capitalization,
  type DashStyle,
  type ImageLayer,
  type Layer,
  type ListType,
  type Orientation,
  type TextLayer,
} from "@/lib/types";
import { Field, NumberField, OpacityField, Section, SliderField, historyFieldProps } from "./fields";
import { FillStylePicker } from "./fill-style-picker";
import { GradientStopsEditor } from "./gradient-stops";
import { FontSelect } from "./font-select";
import { AlignTools } from "./align-tools";
import { CombineTools } from "./combine-tools";
import { GroupTools } from "./group-tools";
import { SymmetryTools } from "./symmetry-tools";
import { ShapeAdjustments } from "./shape-adjustments";
import { removeImageBackground } from "@/lib/remove-background";

export function PropertiesPanel() {
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const layers = useEditorStore((s) => s.layers);
  const layer = layers.find((l) => l.id === selectedIds[0]);

  return (
    <div>
      {selectedIds.length > 0 && (
        <div className="space-y-2 px-3 py-2">
          <AlignTools />
          <GroupTools />
          <SymmetryTools />
          <CombineTools />
        </div>
      )}

      {layer ? (
        <>
          <CommonFields layer={layer} />
          {layer.type === "text" && <TextFields layer={layer} />}
          {layer.type === "image" && <ImageFields layer={layer} />}
          {layer.type === "shape" && <ShapeFields layer={layer} />}
          {(layer.type === "path" || layer.type === "bezier") && (
            <StrokeFields layer={layer} />
          )}
        </>
      ) : (
        <p className="px-3 py-6 text-sm text-muted-foreground">
          Select a layer to edit type, color, image, or element.
        </p>
      )}
    </div>
  );
}

function CommonFields({ layer }: { layer: Layer }) {
  const update = useEditorStore((s) => s.updateLayer);
  const locked = !!layer.lockProportions;
  const ratioRef = useRef(layer.width / Math.max(1, layer.height));
  const captureRatio = () => {
    ratioRef.current = layer.width / Math.max(1, layer.height);
  };
  const applyWidth = (width: number) => {
    if (!locked) {
      update(layer.id, { width });
      return;
    }
    const ratio = ratioRef.current > 0 ? ratioRef.current : layer.width / Math.max(1, layer.height);
    update(layer.id, { width, height: Math.max(8, width / ratio) });
  };
  const applyHeight = (height: number) => {
    if (!locked) {
      update(layer.id, { height });
      return;
    }
    const ratio = ratioRef.current > 0 ? ratioRef.current : layer.width / Math.max(1, layer.height);
    update(layer.id, { height, width: Math.max(8, height * ratio) });
  };
  return (
    <Section title="Transform">
      <div className="grid grid-cols-2 gap-2">
        <Field label="X">
          <NumberField value={Math.round(layer.x)} onChange={(x) => update(layer.id, { x })} />
        </Field>
        <Field label="Y">
          <NumberField value={Math.round(layer.y)} onChange={(y) => update(layer.id, { y })} />
        </Field>
        <Field label="W">
          <NumberField
            value={Math.round(layer.width)}
            onEditStart={captureRatio}
            onChange={applyWidth}
          />
        </Field>
        <Field label="H">
          <NumberField
            value={Math.round(layer.height)}
            onEditStart={captureRatio}
            onChange={applyHeight}
          />
        </Field>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <label htmlFor="lock-proportions" className="text-xs">
          Lock proportions
        </label>
        <div className="flex items-center gap-1.5">
          {locked ? (
            <Link2 className="size-3.5 text-muted-foreground" aria-hidden />
          ) : (
            <Link2Off className="size-3.5 text-muted-foreground" aria-hidden />
          )}
          <Switch
            id="lock-proportions"
            checked={locked}
            onCheckedChange={(lockProportions) => {
              if (lockProportions) captureRatio();
              update(layer.id, { lockProportions });
            }}
          />
        </div>
      </div>
      <SliderField
        label="Rotation"
        value={layer.rotation}
        min={-180}
        max={180}
        step={1}
        onChange={(rotation) => update(layer.id, { rotation })}
        format={(v) => `${Math.round(v)}°`}
      />
      <OpacityField
        value={layer.opacity}
        onChange={(opacity) => {
          const ids = useEditorStore.getState().selectedIds;
          if (ids.length > 1) useEditorStore.getState().updateLayers(ids, { opacity });
          else update(layer.id, { opacity });
        }}
      />
      <SliderField
        label="Perspective"
        value={layer.perspective}
        min={-1}
        max={1}
        onChange={(perspective) => update(layer.id, { perspective })}
      />
      <Field label="Blend">
        <Select
          value={layer.blendMode}
          onValueChange={(blendMode) =>
            update(layer.id, { blendMode: blendMode as Layer["blendMode"] })
          }
        >
          <SelectTrigger size="sm" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BLEND_MODES.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs">Border</span>
        <Switch
          checked={layer.borderEnabled}
          onCheckedChange={(borderEnabled) => update(layer.id, { borderEnabled })}
        />
      </div>
      {layer.borderEnabled && (
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="color"
            value={layer.borderColor}
            onChange={(e) => update(layer.id, { borderColor: e.target.value })}
            className="h-7 p-1"
          />
          <NumberField
            value={layer.borderWidth}
            onChange={(borderWidth) => update(layer.id, { borderWidth })}
          />
        </div>
      )}
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs">Mask</span>
        <Switch
          checked={layer.maskEnabled}
          onCheckedChange={(maskEnabled) => update(layer.id, { maskEnabled })}
        />
      </div>
      {layer.maskEnabled && (
        <div className="flex items-center justify-between">
          <span className="text-xs">Invert mask</span>
          <Switch
            checked={layer.maskInverted}
            onCheckedChange={(maskInverted) => update(layer.id, { maskInverted })}
          />
        </div>
      )}
    </Section>
  );
}

function TextFields({ layer }: { layer: TextLayer }) {
  const update = useEditorStore((s) => s.updateLayer);
  return (
    <>
      <Section title="Type">
        <textarea
          value={layer.text}
          onChange={(e) => update(layer.id, { text: e.target.value })}
          className="min-h-24 w-full rounded-md border border-input bg-transparent p-2 text-sm"
          {...historyFieldProps<HTMLTextAreaElement>({ commitOnEnter: false })}
        />
        <Field label="Font">
          <FontSelect
            value={layer.fontFamily}
            onValueChange={(fontFamily) => update(layer.id, { fontFamily })}
            className="w-full"
          />
        </Field>
        <SliderField
          label="Size"
          value={layer.fontSize}
          min={8}
          max={128}
          step={1}
          onChange={(fontSize) => update(layer.id, { fontSize })}
          format={(v) => `${v}pt`}
        />
        <Field label="Color">
          <Input
            type="color"
            value={layer.color}
            onChange={(e) => update(layer.id, { color: e.target.value })}
            className="h-7 p-1"
          />
        </Field>
        <div className="flex items-center justify-between">
          <span className="text-xs">Highlighter</span>
          <Switch
            checked={!!layer.highlight}
            onCheckedChange={(on) =>
              update(layer.id, { highlight: on ? "#f5d76e" : null })
            }
          />
        </div>
        {layer.highlight && (
          <Input
            type="color"
            value={layer.highlight}
            onChange={(e) => update(layer.id, { highlight: e.target.value })}
            className="h-7 p-1"
          />
        )}
        <SliderField
          label="Line spacing"
          value={layer.lineHeight}
          min={0.8}
          max={2.4}
          onChange={(lineHeight) => update(layer.id, { lineHeight })}
        />
        <SliderField
          label="Letter spacing"
          value={layer.letterSpacing}
          min={-4}
          max={20}
          step={0.1}
          onChange={(letterSpacing) => update(layer.id, { letterSpacing })}
        />
        <SliderField
          label="Kerning"
          value={layer.kerning}
          min={-4}
          max={8}
          step={0.1}
          onChange={(kerning) => update(layer.id, { kerning })}
        />
        <div className="flex items-center justify-between py-1">
          <span className="text-xs">Ligatures</span>
          <Switch
            checked={layer.ligatures}
            onCheckedChange={(ligatures) => update(layer.id, { ligatures })}
          />
        </div>
        <Field label="List">
          <Select
            value={layer.listType}
            onValueChange={(listType) =>
              update(layer.id, { listType: listType as ListType })
            }
          >
            <SelectTrigger size="sm" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="bullet">Bullets</SelectItem>
              <SelectItem value="number">Numbers</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Capitals">
          <Select
            value={layer.capitalization}
            onValueChange={(capitalization) =>
              update(layer.id, {
                capitalization: capitalization as Capitalization,
              })
            }
          >
            <SelectTrigger size="sm" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">As typed</SelectItem>
              <SelectItem value="uppercase">Uppercase</SelectItem>
              <SelectItem value="lowercase">Lowercase</SelectItem>
              <SelectItem value="title">Title Case</SelectItem>
              <SelectItem value="small-caps">Small caps</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Orientation">
          <Select
            value={String(layer.orientation)}
            onValueChange={(v) =>
              update(layer.id, {
                orientation: (v === "vertical" ? "vertical" : Number(v)) as Orientation,
              })
            }
          >
            <SelectTrigger size="sm" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Horizontal</SelectItem>
              <SelectItem value="90">90°</SelectItem>
              <SelectItem value="180">180°</SelectItem>
              <SelectItem value="270">270°</SelectItem>
              <SelectItem value="vertical">Stacked</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Anchor">
          <div className="grid grid-cols-3 gap-1">
            {(
              [
                "top-left",
                "top-center",
                "top-right",
                "middle-left",
                "center",
                "middle-right",
                "bottom-left",
                "bottom-center",
                "bottom-right",
              ] as Anchor[]
            ).map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => useEditorStore.getState().applyAnchor(a)}
                className={`h-6 rounded-sm border ${layer.anchor === a ? "border-primary bg-primary/20" : "border-border"}`}
                aria-label={a}
              />
            ))}
          </div>
        </Field>
        <SliderField
          label="Indent"
          value={layer.indent}
          min={0}
          max={80}
          step={1}
          onChange={(indent) => update(layer.id, { indent })}
          format={(v) => `${v}px`}
        />
        <SliderField
          label="First line"
          value={layer.firstLineIndent}
          min={-40}
          max={80}
          step={1}
          onChange={(firstLineIndent) => update(layer.id, { firstLineIndent })}
          format={(v) => `${v}px`}
        />
      </Section>
    </>
  );
}

function ImageFields({ layer }: { layer: ImageLayer }) {
  const update = useEditorStore((s) => s.updateLayer);
  const setBgBusy = useEditorStore((s) => s.setBgBusy);
  const bgBusyId = useEditorStore((s) => s.bgBusyId);
  const bgBusyNote = useEditorStore((s) => s.bgBusyNote);
  const [bgError, setBgError] = useState<string | null>(null);
  const busy = bgBusyId === layer.id;
  const adj = layer.adjustments;
  const raw = adj.raw || layer.isRaw;
  const range = raw ? 2 : 1;
  const setAdj = (partial: Partial<typeof adj>) =>
    update(layer.id, { adjustments: { ...adj, ...partial } });
  const cutOut = async () => {
    setBgError(null);
    setBgBusy(layer.id, "Cutting out…");
    try {
      const src = await removeImageBackground(layer.originalSrc, (note) =>
        setBgBusy(layer.id, note),
      );
      update(layer.id, { src });
    } catch (err) {
      setBgError(
        err instanceof Error ? err.message : "Could not remove the background.",
      );
    } finally {
      setBgBusy(null);
    }
  };

  return (
    <Section title={raw ? "RAW develop" : "Image"}>
      <div className="mb-2 flex flex-col gap-1.5">
        <Button size="sm" disabled={busy} onClick={() => void cutOut()}>
          {busy ? bgBusyNote || "Cutting out…" : "Remove background"}
        </Button>
        {layer.src !== layer.originalSrc && (
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => update(layer.id, { src: layer.originalSrc })}
          >
            Restore original
          </Button>
        )}
        {bgError && (
          <p className="text-[11px] leading-relaxed text-destructive">{bgError}</p>
        )}
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Cuts the subject free of its backdrop. First run may download a model.
          Undo or restore brings the original back.
        </p>
      </div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs">RAW workspace</span>
        <Switch
          checked={adj.raw}
          onCheckedChange={(on) => setAdj({ raw: on })}
        />
      </div>
      <SliderField label="Exposure" value={adj.exposure} min={-range * 2} max={range * 2} onChange={(exposure) => setAdj({ exposure })} />
      <SliderField label="Brightness" value={adj.brightness} min={-1} max={1} onChange={(brightness) => setAdj({ brightness })} />
      <SliderField label="Contrast" value={adj.contrast} min={-1} max={1} onChange={(contrast) => setAdj({ contrast })} />
      <SliderField label="Shadows" value={adj.shadows} min={-1} max={1} onChange={(shadows) => setAdj({ shadows })} />
      <SliderField label="Highlights" value={adj.highlights} min={-1} max={1} onChange={(highlights) => setAdj({ highlights })} />
      <SliderField label="Saturation" value={adj.saturation} min={-1} max={1} onChange={(saturation) => setAdj({ saturation })} />
      <SliderField label="Temperature" value={adj.temperature} min={-1} max={1} onChange={(temperature) => setAdj({ temperature })} />
      <SliderField label="Tint" value={adj.tint} min={-1} max={1} onChange={(tint) => setAdj({ tint })} />
      <SliderField label="Warmth" value={adj.warmth} min={-1} max={1} onChange={(warmth) => setAdj({ warmth })} />
      <SliderField label="Sepia" value={adj.sepia} min={0} max={1} onChange={(sepia) => setAdj({ sepia })} />
      <SliderField label="Sharpness" value={adj.sharpness} min={0} max={1} onChange={(sharpness) => setAdj({ sharpness })} />
      <SliderField label="Blur" value={adj.blur} min={0} max={1} onChange={(blur) => setAdj({ blur })} />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs">Instant Alpha</span>
        <Switch
          checked={layer.instantAlpha.enabled}
          onCheckedChange={(enabled) =>
            update(layer.id, {
              instantAlpha: { ...layer.instantAlpha, enabled },
            })
          }
        />
      </div>
      {layer.instantAlpha.enabled && (
        <SliderField
          label="Tolerance"
          value={layer.instantAlpha.tolerance}
          min={4}
          max={120}
          step={1}
          onChange={(tolerance) =>
            update(layer.id, {
              instantAlpha: { ...layer.instantAlpha, tolerance },
            })
          }
          format={(v) => `${v}`}
        />
      )}
      <p className="pt-1 text-[11px] leading-relaxed text-muted-foreground">
        Choose Instant Alpha in the tool rail, then click a color in the photo to punch it out.
      </p>
    </Section>
  );
}

function ShapeFields({ layer }: { layer: Extract<Layer, { type: "shape" }> }) {
  return (
    <Section title="Element">
      <ShapeAdjustments layer={layer} />
    </Section>
  );
}

function StrokeFields({
  layer,
}: {
  layer: Extract<Layer, { type: "path" | "bezier" }>;
}) {
  const update = useEditorStore((s) => s.updateLayer);
  return (
    <Section title="Stroke">
      <Input
        type="color"
        value={layer.stroke}
        onChange={(e) => update(layer.id, { stroke: e.target.value })}
        className="h-7 p-1"
      />
      <SliderField
        label="Width"
        value={layer.strokeWidth}
        min={0.5}
        max={40}
        step={0.5}
        onChange={(strokeWidth) => update(layer.id, { strokeWidth })}
      />
          {layer.type === "bezier" && (
        <>
          <div className="flex items-center justify-between">
            <span className="text-xs">Fill curve</span>
            <Switch
              checked={layer.fillEnabled}
              onCheckedChange={(fillEnabled) => update(layer.id, { fillEnabled })}
            />
          </div>
          {layer.fillEnabled && (
            <>
              <Field label="Fill style">
                <FillStylePicker
                  value={layer.fillStyle}
                  stops={layer.fillStops}
                  angle={layer.fillAngle}
                  onChange={(fillStyle) => update(layer.id, { fillStyle })}
                />
              </Field>
              {layer.fillStyle !== "solid" && (
                <GradientStopsEditor
                  fill={layer.fill}
                  fillTo={layer.fillTo}
                  fillStops={layer.fillStops}
                  onChange={(next) => update(layer.id, next)}
                />
              )}
            </>
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs">Closed</span>
            <Switch
              checked={layer.closed}
              onCheckedChange={(closed) => update(layer.id, { closed })}
            />
          </div>
          <p className="text-[11px] leading-snug text-muted-foreground">
            Drag diamond anchors and circular handles on the page. Alt-drag a handle to break the smooth pair. Alt-drag an anchor to pull new handles; Alt-click an anchor to make a corner.
          </p>
        </>
      )}
    </Section>
  );
}

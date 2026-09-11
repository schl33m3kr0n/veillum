"use client";

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
  FONT_OPTIONS,
  type Anchor,
  type Capitalization,
  type DashStyle,
  type ImageLayer,
  type Layer,
  type ListType,
  type Orientation,
  type ShapeKind,
  type TextLayer,
} from "@/lib/types";
import { AlignCenter, AlignHorizontalJustifyCenter, AlignLeft, AlignRight, AlignVerticalJustifyCenter } from "lucide-react";
import { Field, NumberField, Section, SliderField } from "./fields";

export function PropertiesPanel() {
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const layers = useEditorStore((s) => s.layers);
  const page = useEditorStore((s) => s.page);
  const layer = layers.find((l) => l.id === selectedIds[0]);
  const updatePage = useEditorStore((s) => s.updatePage);

  return (
    <div>
      <Section title="Page">
        <div className="grid grid-cols-2 gap-2">
          <Field label="Width">
            <NumberField value={page.width} onChange={(width) => updatePage({ width })} />
          </Field>
          <Field label="Height">
            <NumberField value={page.height} onChange={(height) => updatePage({ height })} />
          </Field>
        </div>
        <div className="mt-2 flex gap-1">
          <Button
            size="xs"
            variant="outline"
            onClick={() => updatePage({ width: 960, height: 720 })}
          >
            Landscape
          </Button>
          <Button
            size="xs"
            variant="outline"
            onClick={() => updatePage({ width: 720, height: 960 })}
          >
            Portrait
          </Button>
        </div>
        <Field label="Paper" className="mt-2">
          <Input
            type="color"
            value={page.background}
            onChange={(e) => updatePage({ background: e.target.value })}
            className="h-7 p-1"
          />
        </Field>
        <p className="mt-2 text-[10px] uppercase tracking-wide text-muted-foreground">
          Margins
        </p>
        <div className="grid grid-cols-2 gap-2">
          {(["top", "right", "bottom", "left"] as const).map((side) => (
            <Field key={side} label={side}>
              <NumberField
                value={page.margins[side]}
                onChange={(v) =>
                  updatePage({ margins: { ...page.margins, [side]: v } })
                }
              />
            </Field>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs">Ruler</span>
          <Switch
            checked={page.ruler}
            onCheckedChange={(ruler) => updatePage({ ruler })}
          />
        </div>
        <Field label="Grid">
          <Select
            value={page.grid.visible ? page.grid.type : "none"}
            onValueChange={(v) =>
              updatePage({
                grid: {
                  ...page.grid,
                  type: v === "none" ? "square" : (v as "square" | "triangle"),
                  visible: v !== "none",
                },
              })
            }
          >
            <SelectTrigger size="sm" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Hidden</SelectItem>
              <SelectItem value="square">Square</SelectItem>
              <SelectItem value="triangle">Triangle</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <SliderField
          label="Grid size"
          value={page.grid.size}
          min={8}
          max={64}
          step={1}
          onChange={(size) => updatePage({ grid: { ...page.grid, size } })}
          format={(v) => `${v}px`}
        />
        <HeaderFooterFields />
      </Section>

      {selectedIds.length > 1 && (
        <Section title="Align objects">
          <AlignButtons />
        </Section>
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
          Select a layer to edit type, color, image, or shape.
        </p>
      )}
    </div>
  );
}

function HeaderFooterFields() {
  const page = useEditorStore((s) => s.page);
  const updatePage = useEditorStore((s) => s.updatePage);
  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs">Header</span>
        <Switch
          checked={page.header.enabled}
          onCheckedChange={(enabled) =>
            updatePage({ header: { ...page.header, enabled } })
          }
        />
      </div>
      <Input
        value={page.header.text}
        onChange={(e) =>
          updatePage({ header: { ...page.header, text: e.target.value } })
        }
        className="h-7 text-xs"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs">Footer</span>
        <Switch
          checked={page.footer.enabled}
          onCheckedChange={(enabled) =>
            updatePage({ footer: { ...page.footer, enabled } })
          }
        />
      </div>
      <Input
        value={page.footer.text}
        onChange={(e) =>
          updatePage({ footer: { ...page.footer, text: e.target.value } })
        }
        className="h-7 text-xs"
      />
    </div>
  );
}

function AlignButtons() {
  const align = useEditorStore((s) => s.alignSelected);
  return (
    <div className="flex flex-wrap gap-1">
      <Button size="icon-xs" variant="outline" onClick={() => align("left")}>
        <AlignLeft />
      </Button>
      <Button size="icon-xs" variant="outline" onClick={() => align("center")}>
        <AlignHorizontalJustifyCenter />
      </Button>
      <Button size="icon-xs" variant="outline" onClick={() => align("right")}>
        <AlignRight />
      </Button>
      <Button size="icon-xs" variant="outline" onClick={() => align("top")}>
        <AlignVerticalJustifyCenter className="rotate-180" />
      </Button>
      <Button size="icon-xs" variant="outline" onClick={() => align("middle")}>
        <AlignCenter />
      </Button>
      <Button size="icon-xs" variant="outline" onClick={() => align("bottom")}>
        <AlignVerticalJustifyCenter />
      </Button>
    </div>
  );
}

function CommonFields({ layer }: { layer: Layer }) {
  const update = useEditorStore((s) => s.updateLayer);
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
          <NumberField value={Math.round(layer.width)} onChange={(width) => update(layer.id, { width })} />
        </Field>
        <Field label="H">
          <NumberField value={Math.round(layer.height)} onChange={(height) => update(layer.id, { height })} />
        </Field>
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
      <SliderField
        label="Opacity"
        value={layer.opacity}
        min={0}
        max={1}
        onChange={(opacity) => update(layer.id, { opacity })}
        format={(v) => `${Math.round(v * 100)}%`}
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
        />
        <Field label="Font">
          <Select
            value={layer.fontFamily}
            onValueChange={(fontFamily) =>
              update(layer.id, {
                fontFamily: fontFamily as TextLayer["fontFamily"],
              })
            }
          >
            <SelectTrigger size="sm" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_OPTIONS.map((f) => (
                <SelectItem key={f.family} value={f.family}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
  const adj = layer.adjustments;
  const raw = adj.raw || layer.isRaw;
  const range = raw ? 2 : 1;
  const setAdj = (partial: Partial<typeof adj>) =>
    update(layer.id, { adjustments: { ...adj, ...partial } });

  return (
    <Section title={raw ? "RAW develop" : "Image"}>
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
  const update = useEditorStore((s) => s.updateLayer);
  const setShapeKind = useEditorStore((s) => s.setShapeKind);
  return (
    <Section title="Shape style">
      <Field label="Kind">
        <Select
          value={layer.shape}
          onValueChange={(shape) => {
            update(layer.id, { shape: shape as ShapeKind });
            setShapeKind(shape as ShapeKind);
          }}
        >
          <SelectTrigger size="sm" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {["rect", "ellipse", "triangle", "line", "hexagon", "star", "arrow"].map(
              (k) => (
                <SelectItem key={k} value={k}>
                  {k}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
      </Field>
      <div className="flex items-center justify-between">
        <span className="text-xs">Fill</span>
        <Switch
          checked={layer.fillEnabled}
          onCheckedChange={(fillEnabled) => update(layer.id, { fillEnabled })}
        />
      </div>
      <Input
        type="color"
        value={layer.fill}
        onChange={(e) => update(layer.id, { fill: e.target.value })}
        className="h-7 p-1"
      />
      <Field label="Stroke">
        <Input
          type="color"
          value={layer.stroke}
          onChange={(e) => update(layer.id, { stroke: e.target.value })}
          className="h-7 p-1"
        />
      </Field>
      <SliderField
        label="Stroke width"
        value={layer.strokeWidth}
        min={0}
        max={24}
        step={0.5}
        onChange={(strokeWidth) => update(layer.id, { strokeWidth })}
      />
      <Field label="Stroke style">
        <Select
          value={layer.dash}
          onValueChange={(dash) => update(layer.id, { dash: dash as DashStyle })}
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
      {layer.shape === "rect" && (
        <SliderField
          label="Corners"
          value={layer.cornerRadius}
          min={0}
          max={80}
          step={1}
          onChange={(cornerRadius) => update(layer.id, { cornerRadius })}
        />
      )}
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

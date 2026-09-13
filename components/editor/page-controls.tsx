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
import { Field, NumberField, SliderField, historyFieldProps } from "./fields";

export function PageControls() {
  const page = useEditorStore((s) => s.page);
  const updatePage = useEditorStore((s) => s.updatePage);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <Field label="Width">
          <NumberField value={page.width} onChange={(width) => updatePage({ width })} />
        </Field>
        <Field label="Height">
          <NumberField value={page.height} onChange={(height) => updatePage({ height })} />
        </Field>
      </div>
      <div className="flex gap-1">
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
      <Field label="Paper">
        <Input
          type="color"
          value={page.background}
          onChange={(e) => updatePage({ background: e.target.value })}
          className="h-7 p-1"
        />
      </Field>
      <div className="flex items-center justify-between">
        <label htmlFor="margins-visible" className="text-xs">
          Margins
        </label>
        <Switch
          id="margins-visible"
          checked={page.marginsVisible !== false}
          onCheckedChange={(marginsVisible) => updatePage({ marginsVisible })}
        />
      </div>
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
      <div className="flex items-center justify-between">
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
                type: v === "none" ? "square" : (v as "square" | "triangle" | "radial"),
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
            <SelectItem value="radial">Radial</SelectItem>
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
      <div className="space-y-2 border-t border-border/50 pt-2">
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
          {...historyFieldProps<HTMLInputElement>()}
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
          {...historyFieldProps<HTMLInputElement>()}
        />
      </div>
    </div>
  );
}

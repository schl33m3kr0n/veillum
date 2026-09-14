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
  GRID_LINE_COUNTS,
  gridLineCount,
  spacingFromLines,
} from "@/lib/geometry";
import { SYMMETRY_FOLDS, symmetryMode } from "@/lib/symmetry";
import type { GridType, SymmetryMode } from "@/lib/types";
import { Field, NumberField, SliderField, historyFieldProps } from "./fields";
import { ColorInputCircle } from "./paint-swatch";

export function PageControls() {
  const page = useEditorStore((s) => s.page);
  const updatePage = useEditorStore((s) => s.updatePage);
  const hasSelection = useEditorStore((s) => s.selectedIds.length > 0);

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
        <ColorInputCircle
          value={page.background}
          title="Page color"
          onChange={(background) => updatePage({ background })}
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
                snap: page.grid.snap ?? false,
                lines: gridLineCount(page.grid),
                type: v === "none" ? page.grid.type : (v as GridType),
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
      <div className="flex items-center justify-between">
        <label htmlFor="grid-snap" className="text-xs">
          Snap to grid
        </label>
        <Switch
          id="grid-snap"
          checked={!!page.grid.snap}
          onCheckedChange={(snap) =>
            updatePage({
              grid: {
                ...page.grid,
                snap,
                lines: gridLineCount(page.grid),
              },
            })
          }
        />
      </div>
      <Field label="Lines">
        <Select
          value={String(gridLineCount(page.grid))}
          onValueChange={(v) => {
            const lines = Number(v);
            const next = { ...page.grid, lines, snap: page.grid.snap ?? false };
            if (page.grid.type !== "radial") {
              next.size = spacingFromLines(page.width, page.height, lines);
            }
            updatePage({ grid: next });
          }}
        >
          <SelectTrigger size="sm" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {GRID_LINE_COUNTS.map((n) => {
              const deg = 360 / n;
              const cell = spacingFromLines(page.width, page.height, n);
              const label =
                page.grid.type === "radial"
                  ? `${n} · ${deg % 1 === 0 ? deg : deg.toFixed(1)}°`
                  : `${n} · ${cell}px`;
              return (
                <SelectItem key={n} value={String(n)}>
                  {label}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </Field>
      <SliderField
        label={page.grid.type === "radial" ? "Ring spacing" : "Grid size"}
        value={page.grid.size}
        min={4}
        max={96}
        step={1}
        onChange={(size) =>
          updatePage({
            grid: {
              ...page.grid,
              size,
              snap: page.grid.snap ?? false,
              lines: gridLineCount(page.grid),
            },
          })
        }
        format={(v) => `${v}px`}
      />
      <Field label="Symmetry">
        <Select
          value={symmetryMode(page)}
          onValueChange={(v) => {
            const mode = v as SymmetryMode;
            updatePage({
              symmetry: {
                mode,
                folds: Math.max(2, page.symmetry?.folds ?? 6),
                snap:
                  mode === "none"
                    ? false
                    : symmetryMode(page) === "none"
                      ? true
                      : !!page.symmetry?.snap,
              },
            });
          }}
        >
          <SelectTrigger size="sm" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Off</SelectItem>
            <SelectItem value="horizontal">Left–right</SelectItem>
            <SelectItem value="vertical">Top–bottom</SelectItem>
            <SelectItem value="quad">Quad</SelectItem>
            <SelectItem value="radial">Radial</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      {symmetryMode(page) !== "none" && (
        <>
          <div className="flex items-center justify-between">
            <label htmlFor="symmetry-snap" className="text-xs">
              Snap to symmetry
            </label>
            <Switch
              id="symmetry-snap"
              checked={!!page.symmetry?.snap}
              onCheckedChange={(snap) =>
                updatePage({
                  symmetry: {
                    mode: symmetryMode(page),
                    folds: Math.max(2, page.symmetry?.folds ?? 6),
                    snap,
                  },
                })
              }
            />
          </div>
          {symmetryMode(page) === "radial" && (
            <Field label="Folds">
              <Select
                value={String(Math.max(2, page.symmetry?.folds ?? 6))}
                onValueChange={(v) =>
                  updatePage({
                    symmetry: {
                      mode: "radial",
                      folds: Number(v),
                      snap: page.symmetry?.snap ?? true,
                    },
                  })
                }
              >
                <SelectTrigger size="sm" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SYMMETRY_FOLDS.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}-fold · {360 / n}°
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
          <Button
            size="xs"
            variant="outline"
            className="w-full"
            disabled={!hasSelection}
            onClick={() => useEditorStore.getState().duplicateSymmetric()}
          >
            Repeat around symmetry
          </Button>
        </>
      )}
      <div className="space-y-2 border-t border-border/50 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-xs">Header title</span>
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
          placeholder="Title"
          aria-label="Header title"
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

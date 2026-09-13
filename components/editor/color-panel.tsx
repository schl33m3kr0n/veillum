"use client";

import { useEffect, useRef, useState } from "react";
import { Pipette, Search } from "lucide-react";
import { hexToHsv, hsvToHex } from "@/lib/colors";
import { PALETTE_GROUPS, PALETTES } from "@/lib/palettes";
import { applyStudioColor, applyStudioNone } from "@/lib/apply-color";
import { useEditorStore } from "@/lib/editor-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ColorCircle, NoneSwatch } from "./paint-swatch";
import { historyFieldProps } from "./fields";

export function ColorPanel() {
  const color = useEditorStore((s) => s.color);
  const highlight = useEditorStore((s) => s.highlight);
  const setHighlight = useEditorStore((s) => s.setHighlight);
  const recent = useEditorStore((s) => s.recentColors);
  const tool = useEditorStore((s) => s.tool);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const layers = useEditorStore((s) => s.layers);
  const shapeFillEnabled = useEditorStore((s) => s.shapeFillEnabled);
  const [query, setQuery] = useState("");

  const selected = layers.find((l) => selectedIds.includes(l.id));
  const fillIsNone =
    selected?.type === "shape"
      ? selected.fillEnabled === false
      : !shapeFillEnabled;

  const apply = (next: string) => applyStudioColor(next);
  const q = query.trim().toLowerCase();
  const palettes = PALETTES.filter(
    (p) =>
      !q ||
      p.name.toLowerCase().includes(q) ||
      (p.group ?? "").toLowerCase().includes(q),
  );

  return (
    <div className="space-y-3 text-card-foreground">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Color
        </p>
        <Button
          type="button"
          size="sm"
          variant={tool === "eyedropper" ? "default" : "secondary"}
          onClick={() => useEditorStore.getState().setTool("eyedropper")}
        >
          <Pipette />
          Sample
        </Button>
      </div>
      <ColorWheel color={color} onChange={apply} />
      <div className="grid grid-cols-2 gap-2">
        <label className="space-y-1">
          <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Hex
          </Label>
          <Input
            value={color}
            onChange={(e) => apply(e.target.value)}
            className="h-7 bg-secondary font-mono text-xs"
            {...historyFieldProps<HTMLInputElement>()}
          />
        </label>
        <label className="space-y-1">
          <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Highlighter
          </Label>
          <div className="relative h-7 overflow-hidden rounded-md border border-input bg-secondary">
            <span
              className="absolute inset-0.5 rounded-sm"
              style={{ background: highlight }}
            />
            <input
              type="color"
              value={highlight}
              onChange={(e) => setHighlight(e.target.value)}
              className="absolute inset-0 cursor-pointer opacity-0"
              aria-label="Highlighter color"
            />
          </div>
        </label>
      </div>
      <div>
        <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Recent
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          <NoneSwatch
            size="sm"
            title="No fill"
            selected={fillIsNone}
            onClick={() => applyStudioNone()}
          />
          <Swatches colors={recent} onPick={apply} active={color} />
        </div>
      </div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-2 top-1.5 size-3.5 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search palettes"
          className="h-7 bg-secondary pl-7 text-xs"
        />
      </div>
      <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
        {PALETTE_GROUPS.map((group) => {
          const items = palettes.filter((p) => (p.group ?? "Studio") === group);
          if (items.length === 0) return null;
          return (
            <div key={group}>
              <p className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground/80">
                {group}
              </p>
              {items.map((p) => (
                <div key={p.name} className="mb-2">
                  <p className="mb-1 text-[11px] text-foreground/80">{p.name}</p>
                  <Swatches colors={p.colors} onPick={apply} active={color} />
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Swatches({
  colors,
  onPick,
  active,
}: {
  colors: string[];
  onPick: (c: string) => void;
  active: string;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {colors.map((c) => (
        <ColorCircle
          key={c}
          color={c}
          size="sm"
          selected={active.toLowerCase() === c.toLowerCase()}
          onClick={() => onPick(c)}
        />
      ))}
    </div>
  );
}

function ColorWheel({
  color,
  onChange,
}: {
  color: string;
  onChange: (c: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hsv = hexToHsv(color);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const size = canvas.width;
    const r = size / 2;
    const image = ctx.createImageData(size, size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - r;
        const dy = y - r;
        const dist = Math.sqrt(dx * dx + dy * dy) / r;
        const i = (y * size + x) * 4;
        if (dist > 1) {
          image.data[i + 3] = 0;
          continue;
        }
        let h = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
        if (h < 0) h += 360;
        const { r: rr, g, b } = hsvToRgbLocal(h, dist, hsv.v);
        image.data[i] = rr;
        image.data[i + 1] = g;
        image.data[i + 2] = b;
        image.data[i + 3] = 255;
      }
    }
    ctx.putImageData(image, 0, 0);
  }, [hsv.v]);

  const pick = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    const r = canvas.width / 2;
    const dx = x - r;
    const dy = y - r;
    const dist = Math.min(1, Math.sqrt(dx * dx + dy * dy) / r);
    let h = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    if (h < 0) h += 360;
    onChange(hsvToHex(h, dist, hsv.v));
  };

  return (
    <div className="flex items-center gap-3 rounded-xl bg-[#161310] p-3">
      <canvas
        ref={canvasRef}
        width={160}
        height={160}
        className="size-36 cursor-crosshair rounded-full"
        onPointerDown={pick}
        onPointerMove={(e) => e.buttons === 1 && pick(e)}
      />
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={hsv.v}
        onChange={(e) => {
          const v = Number(e.target.value);
          onChange(hsvToHex(hsv.h, hsv.s, v));
        }}
        className="h-36 w-6 appearance-none rounded-full"
        style={{
          writingMode: "vertical-lr",
          direction: "rtl",
          background: `linear-gradient(#fff, ${hsvToHex(hsv.h, hsv.s, 1)}, #000)`,
        }}
        aria-label="Value"
      />
    </div>
  );
}

function hsvToRgbLocal(h: number, s: number, v: number) {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0,
    g = 0,
    b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

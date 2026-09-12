"use client";

import { FILL_STYLES, cssFillPreview, resolveStops, type FillStop } from "@/lib/fill";
import type { FillStyle } from "@/lib/types";
import { cn } from "@/lib/utils";

export function FillStylePicker({
  value,
  stops,
  angle,
  onChange,
}: {
  value: FillStyle;
  stops: FillStop[];
  angle?: number;
  onChange: (style: FillStyle) => void;
}) {
  const resolved = resolveStops({ fill: "#c45c26", fillStops: stops });
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {FILL_STYLES.map((item) => (
        <button
          key={item.id}
          type="button"
          title={item.label}
          aria-label={item.label}
          aria-pressed={value === item.id}
          onClick={() => onChange(item.id)}
          className={cn(
            "overflow-hidden rounded-md border",
            value === item.id
              ? "border-primary ring-2 ring-primary/35"
              : "border-border hover:border-primary/40",
          )}
        >
          <span
            className="block h-8 w-full"
            style={{ background: cssFillPreview(item.id, resolved, angle ?? 90) }}
          />
        </button>
      ))}
    </div>
  );
}

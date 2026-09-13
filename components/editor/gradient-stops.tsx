"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  MAX_FILL_STOPS,
  resizeStops,
  resolveStops,
  setStopSpan,
  stopSpans,
  type FillStop,
} from "@/lib/fill";
import { cn } from "@/lib/utils";
import { beginHistoryGesture, endHistoryGesture } from "@/lib/editor-store";

export function GradientStopsEditor({
  fill,
  fillTo,
  fillStops,
  onChange,
}: {
  fill: string;
  fillTo: string;
  fillStops?: FillStop[];
  onChange: (next: { fill: string; fillTo: string; fillStops: FillStop[] }) => void;
}) {
  const stops = resolveStops({ fill, fillTo, fillStops });
  const spans = stopSpans(stops);

  const commit = (next: FillStop[]) => {
    onChange({
      fill: next[0]?.color ?? fill,
      fillTo: next[next.length - 1]?.color ?? fillTo,
      fillStops: next,
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Colors
        </span>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            aria-label="Fewer colors"
            disabled={stops.length <= 2}
            onClick={() => commit(resizeStops(stops, stops.length - 1))}
          >
            <Minus />
          </Button>
          <span className="w-4 text-center text-xs tabular-nums">{stops.length}</span>
          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            aria-label="More colors"
            disabled={stops.length >= MAX_FILL_STOPS}
            onClick={() => commit(resizeStops(stops, stops.length + 1))}
          >
            <Plus />
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        {stops.map((stop, i) => (
          <div key={i} className="flex items-center gap-2">
            <label
              className={cn(
                "relative size-7 shrink-0 overflow-hidden rounded-md border border-border",
              )}
            >
              <span
                className="absolute inset-0.5 rounded-sm"
                style={{ background: stop.color }}
              />
              <input
                type="color"
                value={stop.color}
                aria-label={`Stop ${i + 1} color`}
                className="absolute inset-0 cursor-pointer opacity-0"
                onChange={(e) => {
                  const next = stops.map((s, j) =>
                    j === i ? { ...s, color: e.target.value } : s,
                  );
                  commit(next);
                }}
              />
            </label>
            <div className="min-w-0 flex-1">
              <div className="mb-0.5 flex justify-between text-[10px] text-muted-foreground">
                <span>Length</span>
                <span className="tabular-nums">{Math.round((spans[i] ?? 0) * 100)}%</span>
              </div>
              <input
                type="range"
                min={4}
                max={84}
                step={1}
                value={Math.round((spans[i] ?? 0) * 100)}
                aria-label={`Stop ${i + 1} length`}
                className="h-1.5 w-full accent-primary"
                onPointerDown={() => beginHistoryGesture()}
                onPointerUp={() => endHistoryGesture()}
                onChange={(e) =>
                  commit(setStopSpan(stops, i, Number(e.target.value) / 100))
                }
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

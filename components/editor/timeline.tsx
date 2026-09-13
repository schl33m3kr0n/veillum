"use client";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEditorStore } from "@/lib/editor-store";
import { Diamond, PanelBottomClose, Plus, Square as SquareIcon, Play, Trash2 } from "lucide-react";

export function Timeline() {
  const playhead = useEditorStore((s) => s.playhead);
  const duration = useEditorStore((s) => s.duration);
  const playing = useEditorStore((s) => s.playing);
  const layers = useEditorStore((s) => s.layers);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const open = useEditorStore((s) => s.timelineOpen);
  const selected = layers.filter((l) => selectedIds.includes(l.id));

  if (!open) return null;

  return (
    <div className="flex h-36 shrink-0 flex-col border-t border-border/70 bg-card">
      <div className="flex h-9 items-center gap-2 border-b border-border/60 px-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Animation
        </span>
        <span className="text-xs tabular-nums text-muted-foreground">
          {playhead.toFixed(2)}s / {duration.toFixed(1)}s
        </span>
        <Button
          size="xs"
          variant="ghost"
          onClick={() => useEditorStore.getState().setPlaying(!playing)}
        >
          {playing ? <SquareIcon /> : <Play />}
          {playing ? "Stop" : "Play"}
        </Button>
        <div className="ml-auto flex items-center gap-1">
          <Button
            size="xs"
            variant="outline"
            onClick={() => useEditorStore.getState().addKeyframe()}
            disabled={selected.length === 0}
          >
            <Plus />
            Keyframe
          </Button>
          <Button
            size="xs"
            variant="ghost"
            onClick={() => useEditorStore.getState().removeKeyframeAtPlayhead()}
            disabled={selected.length === 0}
          >
            <Trash2 />
          </Button>
          <CollapseButton />
        </div>
      </div>
      <div className="flex min-h-0 flex-1 gap-3 px-3 py-2">
        <div className="w-36 shrink-0 space-y-1 overflow-auto text-[11px]">
          {layers
            .filter((l) => l.keyframes.length > 0)
            .map((l) => (
              <div key={l.id} className="truncate text-muted-foreground">
                {l.name} · {l.keyframes.length}
              </div>
            ))}
          {layers.every((l) => l.keyframes.length === 0) && (
            <p className="text-muted-foreground">
              Move a layer, then add a keyframe. Play interpolates position, scale, rotation, and opacity.
            </p>
          )}
        </div>
        <div className="relative min-w-0 flex-1">
          <Slider
            value={[playhead]}
            min={0}
            max={duration}
            step={0.01}
            onValueChange={(v) => useEditorStore.getState().setPlayhead(v[0] ?? 0)}
          />
          <div className="relative mt-3 h-12 rounded-md bg-muted/60">
            {layers.flatMap((l) =>
              l.keyframes.map((k) => (
                <button
                  key={`${l.id}-${k.time}`}
                  type="button"
                  title={`${l.name} @ ${k.time.toFixed(2)}s`}
                  className="absolute top-2 text-primary"
                  style={{ left: `${(k.time / duration) * 100}%` }}
                  onClick={() => useEditorStore.getState().setPlayhead(k.time)}
                >
                  <Diamond className="size-3 fill-current" />
                </button>
              )),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CollapseButton() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label="Hide animation"
          onClick={() => useEditorStore.getState().setTimelineOpen(false)}
        >
          <PanelBottomClose />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">Hide animation [</TooltipContent>
    </Tooltip>
  );
}

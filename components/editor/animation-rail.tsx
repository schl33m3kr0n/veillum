"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEditorStore } from "@/lib/editor-store";
import { Diamond, Play, Square as SquareIcon } from "lucide-react";

export function AnimationRail() {
  const playhead = useEditorStore((s) => s.playhead);
  const duration = useEditorStore((s) => s.duration);
  const playing = useEditorStore((s) => s.playing);
  const open = useEditorStore((s) => s.timelineOpen);
  const layers = useEditorStore((s) => s.layers);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const setPlaying = useEditorStore((s) => s.setPlaying);
  const setPlayhead = useEditorStore((s) => s.setPlayhead);
  const setDuration = useEditorStore((s) => s.setDuration);
  const setTimelineOpen = useEditorStore((s) => s.setTimelineOpen);
  const addKeyframe = useEditorStore((s) => s.addKeyframe);
  const selected = layers.filter((l) => selectedIds.includes(l.id));
  const nKeys = selected.reduce((n, l) => n + l.keyframes.length, 0);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      const store = useEditorStore.getState();
      let t = store.playhead + dt;
      if (t > store.duration) t = 0;
      store.setPlayhead(t);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  return (
    <div className="flex w-full flex-col items-center gap-1 border-t border-border/70 pt-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            size="icon"
            variant={open ? "secondary" : "ghost"}
            className="size-9"
            aria-label={open ? "Hide animation timeline" : "Show animation timeline"}
            aria-pressed={open}
            onClick={() => setTimelineOpen(!open)}
          >
            <Diamond className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Animation ([)</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-8"
            aria-label={playing ? "Stop" : "Play"}
            onClick={() => setPlaying(!playing)}
          >
            {playing ? (
              <SquareIcon className="size-3.5" />
            ) : (
              <Play className="size-3.5" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">{playing ? "Stop" : "Play"}</TooltipContent>
      </Tooltip>
      <label className="flex w-full flex-col items-center gap-0.5 px-0.5">
        <span className="text-[8px] font-medium uppercase tracking-wide text-muted-foreground">
          Time
        </span>
        <Input
          type="number"
          min={0}
          step={0.1}
          value={playhead.toFixed(1)}
          onChange={(e) => setPlayhead(Number(e.target.value) || 0)}
          className="h-6 px-1 text-center text-[10px] tabular-nums"
          aria-label="Playhead seconds"
        />
      </label>
      <label className="flex w-full flex-col items-center gap-0.5 px-0.5">
        <span className="text-[8px] font-medium uppercase tracking-wide text-muted-foreground">
          Dur
        </span>
        <Input
          type="number"
          min={0.5}
          step={0.5}
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value) || 1)}
          className="h-6 px-1 text-center text-[10px] tabular-nums"
          aria-label="Duration seconds"
        />
      </label>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-8"
            disabled={selected.length === 0}
            aria-label="Add keyframe to selection"
            onClick={() => addKeyframe()}
          >
            <Diamond className="size-3.5 fill-current" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          {selected.length === 0
            ? "Select objects to keyframe"
            : nKeys
              ? `Add keyframe (${nKeys} on selection)`
              : "Add keyframe"}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

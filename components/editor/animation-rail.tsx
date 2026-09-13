"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEditorStore } from "@/lib/editor-store";
import { Diamond } from "lucide-react";

export function AnimationRail() {
  const playing = useEditorStore((s) => s.playing);
  const open = useEditorStore((s) => s.timelineOpen);
  const setTimelineOpen = useEditorStore((s) => s.setTimelineOpen);

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
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          className="size-9"
          aria-label={open ? "Hide animation timeline" : "Show animation timeline"}
          aria-pressed={open}
          onClick={() => setTimelineOpen(!open)}
        >
          <Diamond className={open ? "size-4 fill-current" : "size-4"} />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">Animation ([)</TooltipContent>
    </Tooltip>
  );
}

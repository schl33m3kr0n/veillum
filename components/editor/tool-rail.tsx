"use client";

import { useRef } from "react";
import {
  MousePointer2,
  Type,
  Pencil,
  PenTool,
  Highlighter,
  Square,
  Spline,
  Pipette,
  WandSparkles,
  Lasso,
  Hand,
  ImagePlus,
  DraftingCompass,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEditorStore } from "@/lib/editor-store";
import { extractRawPreview } from "@/lib/raw";
import type { Tool } from "@/lib/types";
import { cn } from "@/lib/utils";

const TOOLS: { id: Tool; label: string; shortcut: string; icon: typeof Type }[] = [
  { id: "select", label: "Select", shortcut: "V", icon: MousePointer2 },
  { id: "pan", label: "Pan", shortcut: "Space", icon: Hand },
  { id: "text", label: "Text", shortcut: "T", icon: Type },
  { id: "pencil", label: "Pencil", shortcut: "P", icon: Pencil },
  { id: "pen", label: "Pen", shortcut: "N", icon: PenTool },
  { id: "highlighter", label: "Highlighter", shortcut: "H", icon: Highlighter },
  { id: "shape", label: "Elements", shortcut: "S", icon: Square },
  { id: "compass", label: "Compass", shortcut: "C", icon: DraftingCompass },
  { id: "bezier", label: "Bezier curve", shortcut: "B", icon: Spline },
  { id: "eyedropper", label: "Color", shortcut: "I", icon: Pipette },
  { id: "instant-alpha", label: "Instant Alpha", shortcut: "A", icon: WandSparkles },
  { id: "mask", label: "Mask brush", shortcut: "M", icon: Lasso },
];

export function ToolRail() {
  const tool = useEditorStore((s) => s.tool);
  const setTool = useEditorStore((s) => s.setTool);
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <aside className="flex w-12 shrink-0 flex-col items-center gap-1 border-r border-border/70 bg-card py-2">
      {TOOLS.map((t) => {
        const Icon = t.icon;
        return (
          <Tooltip key={t.id}>
            <TooltipTrigger asChild>
              <Button
                size="icon-sm"
                variant="ghost"
                className={cn(
                  "size-9",
                  tool === t.id && "bg-primary/15 text-primary",
                )}
                onClick={() => setTool(t.id)}
                aria-label={t.label}
              >
                <Icon />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {t.label}{" "}
              <span className="ml-1 opacity-60">{t.shortcut}</span>
            </TooltipContent>
          </Tooltip>
        );
      })}
      <div className="mt-auto flex flex-col items-center gap-1 pb-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*,.dng,.cr2,.cr3,.nef,.arw,.orf,.rw2,.raf,.raw,.pef"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            const { dataUrl, isRaw } = await extractRawPreview(file);
            const img = new window.Image();
            img.onload = () => {
              const maxW = 420;
              const scale = Math.min(1, maxW / img.width);
              useEditorStore.getState().addImageFromSrc(dataUrl, {
                isRaw,
                name: file.name,
                width: img.width * scale,
                height: img.height * scale,
              });
            };
            img.src = dataUrl;
          }}
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon-sm"
              variant="ghost"
              className="size-9"
              onClick={() => fileRef.current?.click()}
              aria-label="Place image or RAW"
            >
              <ImagePlus />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Place image / RAW</TooltipContent>
        </Tooltip>
      </div>
    </aside>
  );
}

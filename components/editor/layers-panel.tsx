"use client";

import {
  Eye,
  EyeOff,
  Group,
  Lock,
  Unlock,
  ChevronUp,
  ChevronDown,
  Copy,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEditorStore } from "@/lib/editor-store";
import { cn } from "@/lib/utils";

export function LayersPanel() {
  const layers = useEditorStore((s) => s.layers);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const select = useEditorStore((s) => s.select);
  const reversed = [...layers].reverse();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-1 border-b border-border/60 px-2 py-1.5">
        <Button
          size="icon-xs"
          variant="ghost"
          onClick={() => useEditorStore.getState().duplicateSelected()}
        >
          <Copy />
        </Button>
        <Button
          size="icon-xs"
          variant="ghost"
          onClick={() => useEditorStore.getState().deleteSelected()}
        >
          <Trash2 />
        </Button>
        <Button
          size="icon-xs"
          variant="ghost"
          onClick={() => {
            const id = selectedIds[0];
            if (id) useEditorStore.getState().reorderLayer(id, "up");
          }}
        >
          <ChevronUp />
        </Button>
        <Button
          size="icon-xs"
          variant="ghost"
          onClick={() => {
            const id = selectedIds[0];
            if (id) useEditorStore.getState().reorderLayer(id, "down");
          }}
        >
          <ChevronDown />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <ul className="p-1">
          {reversed.length === 0 && (
            <p className="px-3 py-6 text-sm text-muted-foreground">
              No layers yet. Draw or place type on the page.
            </p>
          )}
          {reversed.map((layer) => (
            <li key={layer.id}>
              <button
                type="button"
                onClick={(e) => select([layer.id], e.shiftKey)}
                className={cn(
                  "flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted",
                  selectedIds.includes(layer.id) && "bg-primary/15",
                )}
              >
                <span className="w-10 shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground">
                  {layer.type}
                </span>
                <span className="min-w-0 flex-1 truncate">{layer.name}</span>
                {layer.groupId ? (
                  <Group className="size-3 shrink-0 text-muted-foreground" aria-label="Grouped" />
                ) : null}
                <span className="w-8 shrink-0 text-right tabular-nums text-[10px] text-muted-foreground">
                  {Math.round(layer.opacity * 100)}%
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  className="text-muted-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    useEditorStore.getState().toggleVisible(layer.id);
                  }}
                >
                  {layer.visible ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  className="text-muted-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    useEditorStore.getState().toggleLocked(layer.id);
                  }}
                >
                  {layer.locked ? <Lock className="size-3.5" /> : <Unlock className="size-3.5" />}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </div>
  );
}

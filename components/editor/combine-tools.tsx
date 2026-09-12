"use client";

import {
  Circle,
  Combine,
  Minus,
  SplitSquareHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { isCombinable, type CombineMode } from "@/lib/combine";
import { useEditorStore } from "@/lib/editor-store";

export function CombineTools({ compact = false }: { compact?: boolean }) {
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const layers = useEditorStore((s) => s.layers);
  const count = layers.filter(
    (l) => selectedIds.includes(l.id) && isCombinable(l),
  ).length;
  if (selectedIds.length === 0) return null;

  const run = (mode: CombineMode) =>
    useEditorStore.getState().combineSelected(mode);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {compact ? (
          <Button
            size="sm"
            variant="ghost"
            aria-label="Combine"
            title="Combine"
            className="px-2"
          >
            <Combine />
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="w-full justify-start gap-1.5"
          >
            <Combine />
            Combine
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-52">
        <DropdownMenuItem disabled={count < 2} onSelect={() => run("unite")}>
          <Combine />
          Unite
        </DropdownMenuItem>
        <DropdownMenuItem disabled={count < 2} onSelect={() => run("subtract")}>
          <Minus />
          Subtract
        </DropdownMenuItem>
        <DropdownMenuItem disabled={count < 2} onSelect={() => run("intersect")}>
          <Circle />
          Intersect
        </DropdownMenuItem>
        <DropdownMenuItem disabled={count < 2} onSelect={() => run("exclude")}>
          <SplitSquareHorizontal />
          Exclude
        </DropdownMenuItem>
        <p className="px-2 pb-1.5 pt-1 text-[11px] leading-snug text-muted-foreground">
          Select two or more overlapping filled shapes, then Unite to make one
          fillable outline. ⌘/Ctrl U.
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

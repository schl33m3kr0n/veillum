"use client";

import {
  CopyPlus,
  FlipHorizontal2,
  FlipVertical2,
  UnfoldHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEditorStore } from "@/lib/editor-store";
import { symmetryMode } from "@/lib/symmetry";

export function SymmetryTools({ compact = false }: { compact?: boolean }) {
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const mode = useEditorStore((s) => symmetryMode(s.page));
  if (selectedIds.length === 0) return null;

  const mirror = (axis: "horizontal" | "vertical", copy: boolean) =>
    useEditorStore.getState().mirrorSelected(axis, copy);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {compact ? (
          <Button
            size="sm"
            variant="ghost"
            aria-label="Mirror"
            title="Mirror"
            className="px-2"
          >
            <UnfoldHorizontal />
          </Button>
        ) : (
          <Button size="sm" variant="outline" className="w-full justify-between">
            <span className="flex items-center gap-1.5">
              <UnfoldHorizontal />
              Mirror
            </span>
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-52">
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={() => mirror("horizontal", true)}>
            <FlipHorizontal2 />
            Copy left–right
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => mirror("vertical", true)}>
            <FlipVertical2 />
            Copy top–bottom
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={() => mirror("horizontal", false)}>
            <FlipHorizontal2 />
            Move left–right
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => mirror("vertical", false)}>
            <FlipVertical2 />
            Move top–bottom
          </DropdownMenuItem>
        </DropdownMenuGroup>
        {mode !== "none" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => useEditorStore.getState().duplicateSymmetric()}
            >
              <CopyPlus />
              Repeat around symmetry
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

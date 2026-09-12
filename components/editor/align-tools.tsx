"use client";

import { useState } from "react";
import {
  AlignCenter,
  AlignHorizontalJustifyCenter,
  AlignHorizontalSpaceAround,
  AlignLeft,
  AlignRight,
  AlignVerticalJustifyCenter,
  AlignVerticalSpaceAround,
  ChevronDown,
  UnfoldHorizontal,
  UnfoldVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEditorStore } from "@/lib/editor-store";
import type { AlignMode, AlignTarget } from "@/lib/geometry";

export function AlignTools({ compact = false }: { compact?: boolean }) {
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const [target, setTarget] = useState<AlignTarget>("selection");
  if (selectedIds.length === 0) return null;

  const resolved: AlignTarget =
    selectedIds.length < 2 && target === "selection" ? "page" : target;
  const align = (mode: AlignMode) =>
    useEditorStore.getState().alignSelected(mode, resolved);
  const distribute = (axis: "horizontal" | "vertical") =>
    useEditorStore.getState().distributeSelected(axis);
  const match = (dim: "width" | "height") =>
    useEditorStore.getState().matchSelected(dim, resolved);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {compact ? (
          <Button
            size="sm"
            variant="ghost"
            aria-label="Align"
            title="Align"
            className="gap-0.5 px-2"
          >
            <AlignHorizontalJustifyCenter />
            <ChevronDown className="size-3" />
          </Button>
        ) : (
          <Button size="sm" variant="outline" className="w-full justify-between">
            <span className="flex items-center gap-1.5">
              <AlignHorizontalJustifyCenter />
              Align
            </span>
            <ChevronDown />
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-52">
        <DropdownMenuGroup>
          <AlignItem
            label="Align left"
            onSelect={() => align("left")}
          >
            <AlignLeft />
          </AlignItem>
          <AlignItem
            label="Center horizontally"
            onSelect={() => align("center")}
          >
            <AlignHorizontalJustifyCenter />
          </AlignItem>
          <AlignItem
            label="Align right"
            onSelect={() => align("right")}
          >
            <AlignRight />
          </AlignItem>
          <AlignItem
            label="Align top"
            onSelect={() => align("top")}
          >
            <AlignVerticalJustifyCenter className="rotate-180" />
          </AlignItem>
          <AlignItem
            label="Center vertically"
            onSelect={() => align("middle")}
          >
            <AlignCenter />
          </AlignItem>
          <AlignItem
            label="Align bottom"
            onSelect={() => align("bottom")}
          >
            <AlignVerticalJustifyCenter />
          </AlignItem>
        </DropdownMenuGroup>
        {selectedIds.length >= 3 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <AlignItem
                label="Distribute horizontally"
                onSelect={() => distribute("horizontal")}
              >
                <AlignHorizontalSpaceAround />
              </AlignItem>
              <AlignItem
                label="Distribute vertically"
                onSelect={() => distribute("vertical")}
              >
                <AlignVerticalSpaceAround />
              </AlignItem>
            </DropdownMenuGroup>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <AlignItem
            label="Match width"
            onSelect={() => match("width")}
          >
            <UnfoldHorizontal />
          </AlignItem>
          <AlignItem
            label="Match height"
            onSelect={() => match("height")}
          >
            <UnfoldVertical />
          </AlignItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Align to</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={resolved}
          onValueChange={(value) => setTarget(value as AlignTarget)}
        >
          <DropdownMenuRadioItem
            value="page"
            onSelect={(event) => event.preventDefault()}
          >
            Page
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem
            value="margins"
            onSelect={(event) => event.preventDefault()}
          >
            Margins
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem
            value="selection"
            disabled={selectedIds.length < 2}
            onSelect={(event) => event.preventDefault()}
          >
            Selection
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AlignItem({
  label,
  onSelect,
  children,
}: {
  label: string;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  return (
    <DropdownMenuItem onSelect={onSelect}>
      {children}
      {label}
    </DropdownMenuItem>
  );
}

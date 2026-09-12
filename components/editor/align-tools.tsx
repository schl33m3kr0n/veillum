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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/lib/editor-store";
import type { AlignMode, AlignTarget } from "@/lib/geometry";
import { cn } from "@/lib/utils";

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

  return (
    <div className={cn("space-y-2", compact && "flex items-center gap-1 space-y-0")}>
      <div className="flex flex-wrap gap-1">
        <AlignBtn title="Align left" onClick={() => align("left")}>
          <AlignLeft />
        </AlignBtn>
        <AlignBtn title="Center horizontally" onClick={() => align("center")}>
          <AlignHorizontalJustifyCenter />
        </AlignBtn>
        <AlignBtn title="Align right" onClick={() => align("right")}>
          <AlignRight />
        </AlignBtn>
        <AlignBtn title="Align top" onClick={() => align("top")}>
          <AlignVerticalJustifyCenter className="rotate-180" />
        </AlignBtn>
        <AlignBtn title="Center vertically" onClick={() => align("middle")}>
          <AlignCenter />
        </AlignBtn>
        <AlignBtn title="Align bottom" onClick={() => align("bottom")}>
          <AlignVerticalJustifyCenter />
        </AlignBtn>
        {selectedIds.length >= 3 && (
          <>
            <AlignBtn title="Distribute horizontally" onClick={() => distribute("horizontal")}>
              <AlignHorizontalSpaceAround />
            </AlignBtn>
            <AlignBtn title="Distribute vertically" onClick={() => distribute("vertical")}>
              <AlignVerticalSpaceAround />
            </AlignBtn>
          </>
        )}
      </div>
      {!compact && (
        <div className="flex flex-wrap gap-1">
          {(["page", "margins", "selection"] as const).map((value) => (
            <Button
              key={value}
              size="xs"
              variant={resolved === value ? "default" : "outline"}
              disabled={value === "selection" && selectedIds.length < 2}
              onClick={() => setTarget(value)}
            >
              {value === "page" ? "Page" : value === "margins" ? "Margins" : "Selection"}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

function AlignBtn({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button size="icon-xs" variant="outline" title={title} aria-label={title} onClick={onClick}>
      {children}
    </Button>
  );
}

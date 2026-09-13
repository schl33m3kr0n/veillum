"use client";

import { CopyPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/lib/editor-store";
import { symmetryMode } from "@/lib/symmetry";

export function SymmetryTools() {
  const mode = useEditorStore((s) => symmetryMode(s.page));
  const selectedIds = useEditorStore((s) => s.selectedIds);
  if (mode === "none" || selectedIds.length === 0) return null;
  return (
    <Button
      size="sm"
      variant="outline"
      className="w-full justify-between"
      onClick={() => useEditorStore.getState().duplicateSymmetric()}
    >
      <span className="flex items-center gap-1.5">
        <CopyPlus />
        Repeat around symmetry
      </span>
    </Button>
  );
}

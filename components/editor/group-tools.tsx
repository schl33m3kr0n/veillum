"use client";

import { Group, Ungroup } from "lucide-react";
import { Button } from "@/components/ui/button";
import { canGroup, canUngroup } from "@/lib/groups";
import { useEditorStore } from "@/lib/editor-store";

export function GroupTools({ compact = false }: { compact?: boolean }) {
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const layers = useEditorStore((s) => s.layers);
  if (selectedIds.length === 0) return null;

  const groupOk = canGroup(layers, selectedIds);
  const ungroupOk = canUngroup(layers, selectedIds);

  return (
    <div className={compact ? "flex items-center" : "flex gap-1"}>
      <Button
        size="sm"
        variant={compact ? "ghost" : "outline"}
        className={compact ? "px-2" : "flex-1 justify-start gap-1.5"}
        disabled={!groupOk}
        title="Group ⌘/Ctrl G"
        aria-label="Group"
        onClick={() => useEditorStore.getState().groupSelected()}
      >
        <Group />
        {compact ? null : "Group"}
      </Button>
      <Button
        size="sm"
        variant={compact ? "ghost" : "outline"}
        className={compact ? "px-2" : "flex-1 justify-start gap-1.5"}
        disabled={!ungroupOk}
        title="Ungroup ⌘/Ctrl Shift G"
        aria-label="Ungroup"
        onClick={() => useEditorStore.getState().ungroupSelected()}
      >
        <Ungroup />
        {compact ? null : "Ungroup"}
      </Button>
    </div>
  );
}

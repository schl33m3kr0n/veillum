"use client";

import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
} from "@/components/ui/context-menu";
import { canGroup, canUngroup } from "@/lib/groups";
import { useEditorStore } from "@/lib/editor-store";
import { hitLayerAt } from "@/lib/hit-layer";
import type { Layer } from "@/lib/types";

export function prepareLayerContext(
  hitId: string | null,
  additive: boolean,
) {
  const store = useEditorStore.getState();
  store.setTool("select");
  store.setEditingText(null);
  store.setSidebarOpen(true);
  store.setSidebarTab("layers");
  if (hitId) {
    if (!store.selectedIds.includes(hitId)) {
      store.select([hitId], additive);
    } else if (additive) {
      store.select([hitId], true);
    }
  } else if (!additive) {
    store.clearSelection();
  }
}

export function prepareLayerContextAtPage(
  x: number,
  y: number,
  additive: boolean,
  layers: Layer[],
) {
  const hit = hitLayerAt(layers, x, y);
  prepareLayerContext(hit?.id ?? null, additive);
}

export function LayerContextItems() {
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const layers = useEditorStore((s) => s.layers);
  const clipboard = useEditorStore((s) => s.clipboard);
  const n = selectedIds.length;
  const selected = layers.filter((l) => selectedIds.includes(l.id));
  const primary = selected[0];
  const groupOk = canGroup(layers, selectedIds);
  const ungroupOk = canUngroup(layers, selectedIds);
  const hidden = selected.some((l) => !l.visible);
  const locked = selected.some((l) => l.locked);
  const label =
    n === 0
      ? "Page"
      : n === 1
        ? primary?.name ?? "Layer"
        : `${n} layers`;

  return (
    <ContextMenuContent>
      <ContextMenuLabel>{label}</ContextMenuLabel>
      <ContextMenuItem
        disabled={!clipboard?.length}
        onSelect={() => useEditorStore.getState().paste()}
      >
        Paste
        <ContextMenuShortcut>⌘V</ContextMenuShortcut>
      </ContextMenuItem>
      <ContextMenuItem
        disabled={n === 0}
        onSelect={() => useEditorStore.getState().cut()}
      >
        Cut
        <ContextMenuShortcut>⌘X</ContextMenuShortcut>
      </ContextMenuItem>
      <ContextMenuItem
        disabled={n === 0}
        onSelect={() => useEditorStore.getState().copy()}
      >
        Copy
        <ContextMenuShortcut>⌘C</ContextMenuShortcut>
      </ContextMenuItem>
      <ContextMenuItem
        disabled={n === 0}
        onSelect={() => useEditorStore.getState().duplicateSelected()}
      >
        Duplicate
        <ContextMenuShortcut>⌘D</ContextMenuShortcut>
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem
        disabled={!groupOk}
        onSelect={() => useEditorStore.getState().groupSelected()}
      >
        Group
        <ContextMenuShortcut>⌘G</ContextMenuShortcut>
      </ContextMenuItem>
      <ContextMenuItem
        disabled={!ungroupOk}
        onSelect={() => useEditorStore.getState().ungroupSelected()}
      >
        Ungroup
        <ContextMenuShortcut>⇧⌘G</ContextMenuShortcut>
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem
        disabled={n === 0}
        onSelect={() =>
          useEditorStore.getState().updateLayers(selectedIds, {
            visible: hidden,
          })
        }
      >
        {hidden ? "Show" : "Hide"}
      </ContextMenuItem>
      <ContextMenuItem
        disabled={n === 0}
        onSelect={() =>
          useEditorStore.getState().updateLayers(selectedIds, {
            locked: !locked,
          })
        }
      >
        {locked ? "Unlock" : "Lock"}
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem
        disabled={n === 0}
        onSelect={() => useEditorStore.getState().reorderSelected("up")}
      >
        Bring forward
      </ContextMenuItem>
      <ContextMenuItem
        disabled={n === 0}
        onSelect={() => useEditorStore.getState().reorderSelected("down")}
      >
        Send backward
      </ContextMenuItem>
      <ContextMenuItem
        disabled={n === 0}
        onSelect={() => useEditorStore.getState().reorderSelected("top")}
      >
        Bring to front
      </ContextMenuItem>
      <ContextMenuItem
        disabled={n === 0}
        onSelect={() => useEditorStore.getState().reorderSelected("bottom")}
      >
        Send to back
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem
        variant="destructive"
        disabled={n === 0 || selected.every((l) => l.locked)}
        onSelect={() => useEditorStore.getState().deleteSelected()}
      >
        Delete
        <ContextMenuShortcut>⌫</ContextMenuShortcut>
      </ContextMenuItem>
    </ContextMenuContent>
  );
}

"use client";

import { useEffect } from "react";
import { useEditorStore, useTemporalStore, resumeHistory } from "@/lib/editor-store";
import { isCombinable } from "@/lib/combine";
import { PAGE_PAD_X, PAGE_PAD_Y } from "@/lib/stage";

export function useEditorHotkeys() {
  const undo = useTemporalStore((s) => s.undo);
  const redo = useTemporalStore((s) => s.redo);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      const meta = e.metaKey || e.ctrlKey;
      const store = useEditorStore.getState();

      if (meta && e.key.toLowerCase() === "z") {
        e.preventDefault();
        resumeHistory();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (meta && e.key.toLowerCase() === "y") {
        e.preventDefault();
        resumeHistory();
        redo();
        return;
      }
      if (typing) return;

      if (meta && e.key.toLowerCase() === "c") {
        e.preventDefault();
        store.copy();
      } else if (meta && e.key.toLowerCase() === "x") {
        e.preventDefault();
        store.cut();
      } else if (meta && e.key.toLowerCase() === "v") {
        e.preventDefault();
        store.paste();
      } else if (meta && e.key.toLowerCase() === "d") {
        e.preventDefault();
        store.duplicateSelected();
      } else if (meta && e.key.toLowerCase() === "b") {
        e.preventDefault();
        store.layers.forEach((l) => {
          if (store.selectedIds.includes(l.id) && l.type === "text") {
            store.updateLayer(l.id, { bold: !l.bold });
          }
        });
      } else if (meta && e.key.toLowerCase() === "i") {
        e.preventDefault();
        store.layers.forEach((l) => {
          if (store.selectedIds.includes(l.id) && l.type === "text") {
            store.updateLayer(l.id, { italic: !l.italic });
          }
        });
      } else if (meta && e.key.toLowerCase() === "u") {
        e.preventDefault();
        const combinable = store.layers.filter(
          (l) => store.selectedIds.includes(l.id) && isCombinable(l),
        );
        if (combinable.length >= 2) {
          store.combineSelected("unite");
          return;
        }
        store.layers.forEach((l) => {
          if (store.selectedIds.includes(l.id) && l.type === "text") {
            store.updateLayer(l.id, { underline: !l.underline });
          }
        });
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        store.deleteSelected();
      } else if (e.key === "Escape") {
        store.clearSelection();
        store.setEditingText(null);
        store.setTool("select");
      } else if (e.key === "v" || e.key === "V") store.setTool("select");
      else if (e.key === "t" || e.key === "T") store.setTool("text");
      else if (e.key === "p" || e.key === "P") store.setTool("pencil");
      else if (e.key === "n" || e.key === "N") store.setTool("pen");
      else if (e.key === "h" || e.key === "H") store.setTool("highlighter");
      else if (e.key === "s" || e.key === "S") store.setTool("shape");
      else if (e.key === "b" || e.key === "B") store.setTool("bezier");
      else if (e.key === "i" || e.key === "I") store.setTool("eyedropper");
      else if (e.key === "m" || e.key === "M") store.setTool("mask");
      else if (e.key === " ") {
        e.preventDefault();
        store.setTool(store.tool === "pan" ? "select" : "pan");
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        store.nudge(e.shiftKey ? -10 : -1, 0);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        store.nudge(e.shiftKey ? 10 : 1, 0);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        store.nudge(0, e.shiftKey ? -10 : -1);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        store.nudge(0, e.shiftKey ? 10 : 1);
      } else if (e.key === "]") {
        e.preventDefault();
        store.setSidebarOpen(!store.sidebarOpen);
      } else if (e.key === "[") {
        e.preventDefault();
        store.setTimelineOpen(!store.timelineOpen);
      } else if (meta && e.key === "0") {
        e.preventDefault();
        store.setZoom(1);
        store.setPan(0, 0);
      } else if (meta && (e.key === "=" || e.key === "+")) {
        e.preventDefault();
        store.zoomToward(
          store.zoom * 1.15,
          store.panX + (PAGE_PAD_X + store.pointer.x) * store.zoom,
          store.panY + (PAGE_PAD_Y + store.pointer.y) * store.zoom,
        );
      } else if (meta && e.key === "-") {
        e.preventDefault();
        store.zoomToward(
          store.zoom / 1.15,
          store.panX + (PAGE_PAD_X + store.pointer.x) * store.zoom,
          store.panY + (PAGE_PAD_Y + store.pointer.y) * store.zoom,
        );
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);
}

"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TooltipProvider } from "@/components/ui/tooltip";
import { seedDocument, useEditorStore } from "@/lib/editor-store";
import { TopBar } from "./top-bar";
import { ToolRail } from "./tool-rail";
import { PropertiesPanel } from "./properties-panel";
import { LayersPanel } from "./layers-panel";
import { ColorStudio } from "./color-studio";
import { Timeline } from "./timeline";
import { Rulers } from "./rulers";
import { TextOverlay } from "./text-overlay";
import { useEditorHotkeys } from "./use-hotkeys";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ShapeKind } from "@/lib/types";

const CanvasStage = dynamic(() => import("./canvas-stage"), { ssr: false });

export function Studio() {
  useEditorHotkeys();
  const workspaceRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 800, height: 600 });
  const tool = useEditorStore((s) => s.tool);
  const shapeKind = useEditorStore((s) => s.shapeKind);
  const zoom = useEditorStore((s) => s.zoom);
  const pointer = useEditorStore((s) => s.pointer);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const layers = useEditorStore((s) => s.layers);
  const selected = layers.find((l) => l.id === selectedIds[0]);

  useEffect(() => {
    seedDocument();
  }, []);

  useEffect(() => {
    const el = workspaceRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setSize({ width: el.clientWidth, height: el.clientHeight });
    });
    ro.observe(el);
    setSize({ width: el.clientWidth, height: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
        <TopBar />
        {tool === "shape" && (
          <div className="flex h-9 items-center gap-2 border-b border-border/60 bg-card px-3 text-xs">
            <span className="text-muted-foreground">Shape</span>
            <Select
              value={shapeKind}
              onValueChange={(v) =>
                useEditorStore.getState().setShapeKind(v as ShapeKind)
              }
            >
              <SelectTrigger size="sm" className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["rect", "ellipse", "triangle", "line", "hexagon", "star", "arrow"].map(
                  (k) => (
                    <SelectItem key={k} value={k}>
                      {k}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
            <span className="text-muted-foreground">
              Drag on the page to draw. Style it in Properties.
            </span>
          </div>
        )}
        {tool === "bezier" && (
          <div className="flex h-9 items-center border-b border-border/60 bg-card px-3 text-xs text-muted-foreground">
            Click to drop anchors. Press Enter to commit the curve, Escape to cancel.
          </div>
        )}
        {tool === "mask" && (
          <div className="flex h-9 items-center border-b border-border/60 bg-card px-3 text-xs text-muted-foreground">
            Select a layer, then paint the area to keep. Invert the mask in Properties.
          </div>
        )}
        <div className="flex min-h-0 flex-1">
          <ToolRail />
          <div className="flex min-w-0 flex-1 flex-col">
            <div ref={workspaceRef} className="relative min-h-0 flex-1">
              {size.width > 0 && (
                <CanvasStage width={size.width} height={size.height} />
              )}
              <Rulers width={size.width} height={size.height} />
              <TextOverlay />
            </div>
            <Timeline />
          </div>
          <aside className="flex w-80 shrink-0 flex-col border-l border-border/70 bg-card">
            <Tabs defaultValue="properties" className="flex min-h-0 flex-1 flex-col">
              <TabsList className="mx-2 mt-2 grid grid-cols-3">
                <TabsTrigger value="properties">Inspect</TabsTrigger>
                <TabsTrigger value="layers">Layers</TabsTrigger>
                <TabsTrigger value="color">Color</TabsTrigger>
              </TabsList>
              <TabsContent value="properties" className="min-h-0 flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <PropertiesPanel />
                </ScrollArea>
              </TabsContent>
              <TabsContent value="layers" className="min-h-0 flex-1 overflow-hidden">
                <LayersPanel />
              </TabsContent>
              <TabsContent value="color" className="min-h-0 flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <ColorStudio />
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </aside>
        </div>
        <footer className="flex h-7 items-center justify-between border-t border-border/70 bg-[#1f1c19] px-3 text-[11px] text-white/60">
          <span>
            {selected ? selected.name : "No selection"} · {Math.round(zoom * 100)}%
          </span>
          <span className="tabular-nums">
            x {Math.round(pointer.x)} · y {Math.round(pointer.y)}
          </span>
        </footer>
      </div>
    </TooltipProvider>
  );
}

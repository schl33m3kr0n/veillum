"use client";

import { useEffect, useRef, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { ShapeWindow } from "./shape-window";
import HtmlStage from "./html-stage";

export function Studio() {
  useEditorHotkeys();
  const workspaceRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 800, height: 600 });
  const [tab, setTab] = useState("properties");
  const tool = useEditorStore((s) => s.tool);
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
          <div className="flex h-9 items-center border-b border-border/60 bg-card px-3 text-xs text-muted-foreground">
            Choose a shape in the Shapes window, then drag on the page to draw it.
          </div>
        )}
        {tool === "bezier" && (
          <div className="flex h-9 items-center border-b border-border/60 bg-card px-3 text-xs text-muted-foreground">
            Click to place an anchor; drag to pull smooth handles. Click the first point to close. Enter finishes an open curve, Escape cancels. With Select, drag handles — hold Alt to break symmetry.
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
                <HtmlStage width={size.width} height={size.height} />
              )}
              <Rulers width={size.width} height={size.height} />
              <TextOverlay />
              {tool === "shape" && <ShapeWindow />}
            </div>
            <Timeline />
          </div>
          <aside className="flex w-80 shrink-0 flex-col border-l border-border/70 bg-card">
            <Tabs
              value={tab}
              onValueChange={setTab}
              className="flex min-h-0 flex-1 flex-col"
            >
              <TabsList className="mx-2 mt-2 grid w-auto grid-cols-3">
                <TabsTrigger value="properties">Inspect</TabsTrigger>
                <TabsTrigger value="layers">Layers</TabsTrigger>
                <TabsTrigger value="color">Color</TabsTrigger>
              </TabsList>
              <div className="min-h-0 flex-1 overflow-y-auto">
                {tab === "properties" && <PropertiesPanel />}
                {tab === "layers" && <LayersPanel />}
                {tab === "color" && <ColorStudio />}
              </div>
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

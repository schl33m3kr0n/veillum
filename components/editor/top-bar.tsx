"use client";

import {
  Undo2,
  Redo2,
  Copy,
  ClipboardPaste,
  Scissors,
  Download,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEditorStore, useTemporalStore, resumeHistory } from "@/lib/editor-store";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  documentToSvg,
  downloadBlob,
  projectJson,
} from "@/lib/export";
import { AlignTools } from "./align-tools";
import { CombineTools } from "./combine-tools";
import { isFullscreen, toggleFullscreen } from "@/lib/fullscreen";
import Link from "next/link";

export function TopBar() {
  const undo = useTemporalStore((s) => s.undo);
  const redo = useTemporalStore((s) => s.redo);
  const canUndo = useTemporalStore((s) => s.pastStates.length > 0);
  const canRedo = useTemporalStore((s) => s.futureStates.length > 0);
  const [full, setFull] = useState(false);

  useEffect(() => {
    const sync = () => setFull(isFullscreen());
    sync();
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  return (
    <header className="flex h-11 shrink-0 items-center gap-1 border-b border-border/70 bg-card px-2">
      <div className="flex items-center gap-1 pr-2">
        <span className="px-2 font-[family-name:var(--font-fraunces)] text-base tracking-tight">
          veillum
        </span>
        <Button size="sm" variant="ghost" asChild>
          <Link href="/die">Die</Link>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => useEditorStore.getState().setStartOpen(true)}
        >
          New
        </Button>
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon-sm"
            variant="ghost"
            disabled={!canUndo}
            aria-label="Undo"
            onClick={() => {
              resumeHistory();
              undo();
            }}
          >
            <Undo2 />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Undo ⌘Z</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon-sm"
            variant="ghost"
            disabled={!canRedo}
            aria-label="Redo"
            onClick={() => {
              resumeHistory();
              redo();
            }}
          >
            <Redo2 />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Redo ⌘⇧Z</TooltipContent>
      </Tooltip>
      <Separator orientation="vertical" className="mx-1 h-6" />
      <Button size="icon-sm" variant="ghost" onClick={() => useEditorStore.getState().cut()}>
        <Scissors />
      </Button>
      <Button size="icon-sm" variant="ghost" onClick={() => useEditorStore.getState().copy()}>
        <Copy />
      </Button>
      <Button size="icon-sm" variant="ghost" onClick={() => useEditorStore.getState().paste()}>
        <ClipboardPaste />
      </Button>
      <Separator orientation="vertical" className="mx-1 h-6" />
      <AlignTools compact />
      <CombineTools compact />
      <div className="ml-auto flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label={full ? "Exit full screen" : "Full screen"}
              onClick={() => void toggleFullscreen()}
            >
              {full ? <Minimize2 /> : <Maximize2 />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{full ? "Exit full screen F" : "Full screen F"}</TooltipContent>
        </Tooltip>
        <ExportMenu />
      </div>
    </header>
  );
}

function ExportMenu() {
  const pageElement = () =>
    document.querySelector("[data-veillum-page]") as HTMLElement | null;

  const exportDoc = async (format: "png" | "jpeg" | "webp" | "svg" | "json") => {
    const { page, layers } = useEditorStore.getState();
    if (format === "json") {
      downloadBlob(
        new Blob([projectJson(page, layers)], { type: "application/json" }),
        "veillum.json",
      );
      return;
    }
    if (format === "svg") {
      downloadBlob(
        new Blob([documentToSvg(page, layers)], { type: "image/svg+xml" }),
        "veillum.svg",
      );
      return;
    }
    const el = pageElement();
    if (!el) return;
    const { toCanvas } = await import("html-to-image");
    const canvas = await toCanvas(el, { pixelRatio: 2, cacheBust: true });
    const mime =
      format === "png"
        ? "image/png"
        : format === "jpeg"
          ? "image/jpeg"
          : "image/webp";
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, mime, 0.92),
    );
    if (blob) downloadBlob(blob, `veillum.${format === "jpeg" ? "jpg" : format}`);
  };

  const flatten = async () => {
    const el = pageElement();
    if (!el) return;
    const { toPng } = await import("html-to-image");
    const dataUrl = await toPng(el, { pixelRatio: 2, cacheBust: true });
    useEditorStore.getState().flattenPage(dataUrl);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline">
          <Download />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => exportDoc("png")}>PNG</DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportDoc("jpeg")}>JPEG</DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportDoc("webp")}>WebP</DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportDoc("svg")}>SVG</DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportDoc("json")}>
          veillum JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={flatten}>Rasterize page</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

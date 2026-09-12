"use client";

import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Superscript,
  Subscript,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Undo2,
  Redo2,
  Copy,
  ClipboardPaste,
  Scissors,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Toggle } from "@/components/ui/toggle";
import { useEditorStore, useTemporalStore, resumeHistory } from "@/lib/editor-store";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { type TextAlign, type TextLayer } from "@/lib/types";
import {
  documentToSvg,
  downloadBlob,
  projectJson,
} from "@/lib/export";
import { NumberField } from "./fields";
import { FontSelect } from "./font-select";
import { AlignTools } from "./align-tools";
import Link from "next/link";

export function TopBar() {
  const undo = useTemporalStore((s) => s.undo);
  const redo = useTemporalStore((s) => s.redo);
  const canUndo = useTemporalStore((s) => s.pastStates.length > 0);
  const canRedo = useTemporalStore((s) => s.futureStates.length > 0);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const layers = useEditorStore((s) => s.layers);
  const text = layers.find(
    (l): l is TextLayer => l.id === selectedIds[0] && l.type === "text",
  );
  const update = useEditorStore((s) => s.updateLayer);

  const patchText = (partial: Partial<TextLayer>) => {
    if (text) update(text.id, partial);
  };

  return (
    <header className="flex h-11 shrink-0 items-center gap-1 border-b border-border/70 bg-card px-2">
      <div className="flex items-center gap-1 pr-2">
        <span className="px-2 font-[family-name:var(--font-fraunces)] text-base tracking-tight">
          veillum
        </span>
        <Button size="sm" variant="ghost" asChild>
          <Link href="/die">Die</Link>
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
      <FontSelect
        value={text?.fontFamily ?? "Newsreader"}
        onValueChange={(fontFamily) => patchText({ fontFamily })}
        disabled={!text}
        className="w-44"
      />
      <NumberField
        value={text?.fontSize ?? 16}
        onChange={(v) => patchText({ fontSize: v })}
        className="w-16"
        steppers={false}
      />
      <Toggle
        size="sm"
        pressed={!!text?.bold}
        disabled={!text}
        onPressedChange={(v) => patchText({ bold: v })}
        aria-label="Bold"
      >
        <Bold />
      </Toggle>
      <Toggle
        size="sm"
        pressed={!!text?.italic}
        disabled={!text}
        onPressedChange={(v) => patchText({ italic: v })}
        aria-label="Italic"
      >
        <Italic />
      </Toggle>
      <Toggle
        size="sm"
        pressed={!!text?.underline}
        disabled={!text}
        onPressedChange={(v) => patchText({ underline: v })}
        aria-label="Underline"
      >
        <Underline />
      </Toggle>
      <Toggle
        size="sm"
        pressed={!!text?.strikethrough}
        disabled={!text}
        onPressedChange={(v) => patchText({ strikethrough: v })}
        aria-label="Strikethrough"
      >
        <Strikethrough />
      </Toggle>
      <Toggle
        size="sm"
        pressed={!!text?.superscript}
        disabled={!text}
        onPressedChange={(v) => patchText({ superscript: v, subscript: v ? false : text?.subscript })}
        aria-label="Superscript"
      >
        <Superscript />
      </Toggle>
      <Toggle
        size="sm"
        pressed={!!text?.subscript}
        disabled={!text}
        onPressedChange={(v) => patchText({ subscript: v, superscript: v ? false : text?.superscript })}
        aria-label="Subscript"
      >
        <Subscript />
      </Toggle>
      <Separator orientation="vertical" className="mx-1 h-6" />
      {(
        [
          ["left", AlignLeft],
          ["center", AlignCenter],
          ["right", AlignRight],
          ["justify", AlignJustify],
        ] as const
      ).map(([align, Icon]) => (
        <Toggle
          key={align}
          size="sm"
          pressed={text?.align === align}
          disabled={!text}
          onPressedChange={() =>
            useEditorStore.getState().setTextAlign(align as TextAlign)
          }
          aria-label={align}
        >
          <Icon />
        </Toggle>
      ))}
      <Separator orientation="vertical" className="mx-1 h-6" />
      <AlignTools compact />
      <div className="ml-auto flex items-center gap-1">
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

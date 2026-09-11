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
  Play,
  Square as SquareIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Toggle } from "@/components/ui/toggle";
import { useEditorStore, useTemporalStore } from "@/lib/editor-store";
import { FONT_OPTIONS, type TextAlign, type TextLayer } from "@/lib/types";
import {
  documentToSvg,
  downloadBlob,
  projectJson,
} from "@/lib/export";
import { NumberField } from "./fields";
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
          Vellum
        </span>
        <Button size="sm" variant="ghost" asChild>
          <Link href="/die">Die</Link>
        </Button>
      </div>
      <Button size="icon-sm" variant="ghost" disabled={!canUndo} onClick={() => undo()}>
        <Undo2 />
      </Button>
      <Button size="icon-sm" variant="ghost" disabled={!canRedo} onClick={() => redo()}>
        <Redo2 />
      </Button>
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
      <Select
        value={text?.fontFamily ?? "Newsreader"}
        onValueChange={(v) => patchText({ fontFamily: v as TextLayer["fontFamily"] })}
        disabled={!text}
      >
        <SelectTrigger size="sm" className="w-40">
          <SelectValue placeholder="Font" />
        </SelectTrigger>
        <SelectContent>
          {FONT_OPTIONS.map((f) => (
            <SelectItem key={f.family} value={f.family}>
              {f.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <NumberField
        value={text?.fontSize ?? 16}
        onChange={(v) => patchText({ fontSize: v })}
        className="w-16"
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
      <div className="ml-auto flex items-center gap-1">
        <PlayPause />
        <ExportMenu />
      </div>
    </header>
  );
}

function PlayPause() {
  const playing = useEditorStore((s) => s.playing);
  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={() => useEditorStore.getState().setPlaying(!playing)}
    >
      {playing ? <SquareIcon /> : <Play />}
      {playing ? "Stop" : "Play"}
    </Button>
  );
}

function ExportMenu() {
  const pageElement = () =>
    document.querySelector("[data-vellum-page]") as HTMLElement | null;

  const exportDoc = async (format: "png" | "jpeg" | "webp" | "svg" | "json") => {
    const { page, layers } = useEditorStore.getState();
    if (format === "json") {
      downloadBlob(
        new Blob([projectJson(page, layers)], { type: "application/json" }),
        "vellum.json",
      );
      return;
    }
    if (format === "svg") {
      downloadBlob(
        new Blob([documentToSvg(page, layers)], { type: "image/svg+xml" }),
        "vellum.svg",
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
    if (blob) downloadBlob(blob, `vellum.${format === "jpeg" ? "jpg" : format}`);
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
          Vellum JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={flatten}>Rasterize page</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

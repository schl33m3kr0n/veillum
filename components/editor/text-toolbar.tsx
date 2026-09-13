"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  Subscript,
  Superscript,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
} from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { useEditorStore } from "@/lib/editor-store";
import { type TextAlign, type TextLayer } from "@/lib/types";
import {
  applyRangeMarks,
  getApplyTextRange,
  getLiveTextRange,
  normalizeSpans,
  rangeMarks,
  setOffsetsOnRoot,
  pinTextFormatRange,
  spansToText,
  subscribeLiveTextRange,
  type TextMark,
} from "@/lib/text-spans";
import { NumberField } from "./fields";
import { FontSelect } from "./font-select";
import { HighlighterIcon } from "./highlighter-icon";
import { ColorCircleLook } from "./paint-swatch";
import { cn } from "@/lib/utils";

const DEFAULT_HIGHLIGHT = "#f5d76e";

function asHex(color: string, fallback: string) {
  if (/^#[0-9a-fA-F]{6}$/.test(color)) return color;
  if (/^#[0-9a-fA-F]{3}$/.test(color)) {
    const s = color.slice(1);
    return `#${s[0]}${s[0]}${s[1]}${s[1]}${s[2]}${s[2]}`;
  }
  return fallback;
}

function pinColorRange() {
  pinTextFormatRange(useEditorStore.getState().editingTextId);
}

function ColorCirclePicker({
  color,
  title,
  onChange,
}: {
  color: string;
  title: string;
  onChange: (color: string) => void;
}) {
  const hex = asHex(color, "#1c1916");
  return (
    <label
      className="relative flex size-6 shrink-0 cursor-pointer items-center justify-center"
      title={title}
      onPointerDown={pinColorRange}
    >
      <ColorCircleLook color={hex} size="sm" />
      <input
        type="color"
        value={hex}
        aria-label={title}
        className="absolute inset-0 cursor-pointer opacity-0"
        onPointerDown={(e) => {
          if (e.cancelable) e.preventDefault();
          pinColorRange();
          try {
            e.currentTarget.showPicker();
          } catch {
            /* showPicker needs a user gesture in some browsers */
          }
        }}
        onFocus={pinColorRange}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function HighlightHoverPicker({
  color,
  onChange,
  children,
}: {
  color: string;
  onChange: (color: string) => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const leave = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hex = asHex(color, DEFAULT_HIGHLIGHT);

  const show = () => {
    pinColorRange();
    if (leave.current) clearTimeout(leave.current);
    setOpen(true);
  };
  const hide = () => {
    if (leave.current) clearTimeout(leave.current);
    leave.current = setTimeout(() => setOpen(false), 160);
  };

  useEffect(() => () => {
    if (leave.current) clearTimeout(leave.current);
  }, []);

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => {
      try {
        inputRef.current?.showPicker?.();
      } catch {
        /* showPicker needs a user gesture in some browsers */
      }
    }, 40);
    return () => window.clearTimeout(id);
  }, [open]);

  return (
    <Popover open={open}>
      <PopoverAnchor asChild>
        <div onMouseEnter={show} onMouseLeave={hide} className="relative">
          {children}
        </div>
      </PopoverAnchor>
      <PopoverContent
        side="bottom"
        align="center"
        sideOffset={6}
        data-text-format-ui
        className="w-auto p-1.5"
        onMouseEnter={show}
        onMouseLeave={hide}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <label
          className="relative flex size-8 cursor-pointer items-center justify-center"
          title="Highlight color"
        >
          <ColorCircleLook color={hex} size="md" />
          <input
            ref={inputRef}
            type="color"
            value={hex}
            aria-label="Highlight color"
            className="absolute inset-0 cursor-pointer opacity-0"
            onPointerDown={(e) => {
              if (e.cancelable) e.preventDefault();
              pinColorRange();
              show();
              try {
                e.currentTarget.showPicker();
              } catch {
                /* showPicker needs a user gesture in some browsers */
              }
            }}
            onFocus={pinColorRange}
            onChange={(e) => onChange(e.target.value)}
          />
        </label>
      </PopoverContent>
    </Popover>
  );
}

export function TextFormatControls({
  layer,
  compact,
}: {
  layer: TextLayer;
  compact?: boolean;
}) {
  const update = useEditorStore((s) => s.updateLayer);
  const swatch = useEditorStore((s) => s.highlight);
  useSyncExternalStore(
    subscribeLiveTextRange,
    getLiveTextRange,
    getLiveTextRange,
  );
  const range = getApplyTextRange(layer.id);
  const mixed = range ? rangeMarks(layer, range) : null;

  const applyMarks = (marks: TextMark) => {
    const target = getApplyTextRange(layer.id);
    if (!target) return;
    const spans = applyRangeMarks(normalizeSpans(layer), target, marks);
    update(layer.id, { spans, text: spansToText(spans) });
    const editor = document.querySelector("[data-text-editor]");
    if (editor instanceof HTMLElement) {
      editor.focus();
      setOffsetsOnRoot(editor, target.start, target.end);
    }
  };

  const flag = (key: "bold" | "italic" | "underline" | "strikethrough" | "superscript" | "subscript") => {
    if (mixed) return !!mixed[key];
    return !!layer[key];
  };

  const highlightOn = mixed
    ? mixed.highlight !== undefined
      ? !!mixed.highlight
      : false
    : !!layer.highlight;
  const highlightColor =
    (mixed?.highlight !== undefined ? mixed.highlight : null) ??
    layer.highlight ??
    swatch ??
    DEFAULT_HIGHLIGHT;
  const textColor = mixed?.color ?? layer.color;
  const fontFamily = mixed?.fontFamily ?? layer.fontFamily;
  const fontSize = mixed?.fontSize ?? layer.fontSize;

  return (
    <div
      className={cn(
        "flex items-center gap-0.5",
        compact && "overflow-x-auto",
      )}
    >
      <FontSelect
        value={fontFamily}
        onValueChange={(family) => applyMarks({ fontFamily: family })}
        className={compact ? "w-36 shrink-0" : "w-44"}
      />
      <NumberField
        value={fontSize}
        onChange={(v) => applyMarks({ fontSize: v })}
        onEditStart={pinColorRange}
        className="w-[4.25rem] shrink-0"
      />
      <ColorCirclePicker
        color={textColor}
        title="Text color"
        onChange={(color) => {
          useEditorStore.getState().setColor(color);
          applyMarks({ color });
        }}
      />
      <Separator orientation="vertical" className="mx-0.5 h-6" />
      <Toggle
        size="sm"
        pressed={flag("bold")}
        onPressedChange={(v) => applyMarks({ bold: v })}
        aria-label="Bold"
      >
        <Bold />
      </Toggle>
      <Toggle
        size="sm"
        pressed={flag("italic")}
        onPressedChange={(v) => applyMarks({ italic: v })}
        aria-label="Italic"
      >
        <Italic />
      </Toggle>
      <Toggle
        size="sm"
        pressed={flag("underline")}
        onPressedChange={(v) => applyMarks({ underline: v })}
        aria-label="Underline"
      >
        <Underline />
      </Toggle>
      <Toggle
        size="sm"
        pressed={flag("strikethrough")}
        onPressedChange={(v) => applyMarks({ strikethrough: v })}
        aria-label="Strikethrough"
      >
        <Strikethrough />
      </Toggle>
      <Toggle
        size="sm"
        pressed={flag("superscript")}
        onPressedChange={(v) =>
          applyMarks({ superscript: v, subscript: v ? false : undefined })
        }
        aria-label="Superscript"
      >
        <Superscript />
      </Toggle>
      <Toggle
        size="sm"
        pressed={flag("subscript")}
        onPressedChange={(v) =>
          applyMarks({ subscript: v, superscript: v ? false : undefined })
        }
        aria-label="Subscript"
      >
        <Subscript />
      </Toggle>
      <Separator orientation="vertical" className="mx-0.5 h-6" />
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
          pressed={layer.align === align}
          onPressedChange={() =>
            useEditorStore.getState().setTextAlign(align as TextAlign)
          }
          aria-label={align}
        >
          <Icon />
        </Toggle>
      ))}
      <Separator orientation="vertical" className="mx-0.5 h-6" />
      <HighlightHoverPicker
        color={highlightColor || DEFAULT_HIGHLIGHT}
        onChange={(highlight) => {
          useEditorStore.getState().setHighlight(highlight);
          applyMarks({ highlight });
        }}
      >
        <Toggle
          size="sm"
          pressed={highlightOn}
          onPressedChange={(on) =>
            applyMarks({ highlight: on ? highlightColor : null })
          }
          aria-label="Highlight"
          title="Highlight"
        >
          <HighlighterIcon color={highlightColor} />
        </Toggle>
      </HighlightHoverPicker>
    </div>
  );
}

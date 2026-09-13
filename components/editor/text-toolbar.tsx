"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
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
    >
      <ColorCircleLook color={hex} size="sm" />
      <input
        type="color"
        value={hex}
        aria-label={title}
        className="absolute inset-0 cursor-pointer opacity-0"
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
  const patch = (partial: Partial<TextLayer>) => update(layer.id, partial);
  const highlightOn = !!layer.highlight;
  const highlightColor = layer.highlight ?? swatch ?? DEFAULT_HIGHLIGHT;

  const setTextColor = (color: string) => {
    patch({ color });
    useEditorStore.getState().setColor(color);
  };

  const setHighlightColor = (highlight: string) => {
    useEditorStore.getState().setHighlight(highlight);
    patch({ highlight });
  };

  return (
    <div
      className={cn(
        "flex items-center gap-0.5",
        compact && "overflow-x-auto",
      )}
    >
      <FontSelect
        value={layer.fontFamily}
        onValueChange={(fontFamily) => patch({ fontFamily })}
        className={compact ? "w-36 shrink-0" : "w-44"}
      />
      <NumberField
        value={layer.fontSize}
        onChange={(v) => patch({ fontSize: v })}
        className="w-14 shrink-0"
        steppers={false}
      />
      <ColorCirclePicker
        color={layer.color}
        title="Text color"
        onChange={setTextColor}
      />
      <Separator orientation="vertical" className="mx-0.5 h-6" />
      <Toggle
        size="sm"
        pressed={!!layer.bold}
        onPressedChange={(v) => patch({ bold: v })}
        aria-label="Bold"
      >
        <Bold />
      </Toggle>
      <Toggle
        size="sm"
        pressed={!!layer.italic}
        onPressedChange={(v) => patch({ italic: v })}
        aria-label="Italic"
      >
        <Italic />
      </Toggle>
      <Toggle
        size="sm"
        pressed={!!layer.underline}
        onPressedChange={(v) => patch({ underline: v })}
        aria-label="Underline"
      >
        <Underline />
      </Toggle>
      <Toggle
        size="sm"
        pressed={!!layer.strikethrough}
        onPressedChange={(v) => patch({ strikethrough: v })}
        aria-label="Strikethrough"
      >
        <Strikethrough />
      </Toggle>
      <Toggle
        size="sm"
        pressed={!!layer.superscript}
        onPressedChange={(v) =>
          patch({ superscript: v, subscript: v ? false : layer.subscript })
        }
        aria-label="Superscript"
      >
        <Superscript />
      </Toggle>
      <Toggle
        size="sm"
        pressed={!!layer.subscript}
        onPressedChange={(v) =>
          patch({ subscript: v, superscript: v ? false : layer.superscript })
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
        color={highlightColor}
        onChange={setHighlightColor}
      >
        <Toggle
          size="sm"
          pressed={highlightOn}
          onPressedChange={(on) =>
            patch({ highlight: on ? highlightColor : null })
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

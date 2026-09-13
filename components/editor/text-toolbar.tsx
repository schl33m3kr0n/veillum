"use client";

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
import { useEditorStore } from "@/lib/editor-store";
import { type TextAlign, type TextLayer } from "@/lib/types";
import { NumberField } from "./fields";
import { FontSelect } from "./font-select";
import { HighlighterIcon } from "./highlighter-icon";
import { cn } from "@/lib/utils";

const DEFAULT_HIGHLIGHT = "#f5d76e";

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
      <label
        className="relative flex size-7 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-md border border-input"
        title="Highlight color"
      >
        <span
          className="absolute inset-0.5 rounded-sm"
          style={{ background: highlightColor }}
          aria-hidden
        />
        <input
          type="color"
          value={highlightColor}
          aria-label="Highlight color"
          className="absolute inset-0 cursor-pointer opacity-0"
          onChange={(e) => {
            const highlight = e.target.value;
            useEditorStore.getState().setHighlight(highlight);
            patch({ highlight });
          }}
        />
      </label>
    </div>
  );
}

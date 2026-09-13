"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { beginHistoryGesture, endHistoryGesture, useEditorStore } from "@/lib/editor-store";
import { cssFontFamily, cssFontWeight } from "@/lib/fonts";
import { PAGE_PAD_X, PAGE_PAD_Y } from "@/lib/stage";
import type { TextLayer } from "@/lib/types";
import {
  applyRangeMarks,
  getLiveTextRange,
  marksAttr,
  normalizeSpans,
  offsetsFromRoot,
  parseEditorSpans,
  resolvedSpan,
  setLiveTextRange,
  setOffsetsOnRoot,
  spansToText,
  type TextMark,
} from "@/lib/text-spans";

export function TextOverlay() {
  const ref = useRef<HTMLDivElement>(null);
  const skip = useRef(false);
  const fromEditor = useRef(false);
  const blurGen = useRef(0);
  const editingTextId = useEditorStore((s) => s.editingTextId);
  const layers = useEditorStore((s) => s.layers);
  const zoom = useEditorStore((s) => s.zoom);
  const panX = useEditorStore((s) => s.panX);
  const panY = useEditorStore((s) => s.panY);
  const layer = layers.find(
    (l): l is TextLayer => l.id === editingTextId && l.type === "text",
  );

  useEffect(() => {
    if (!editingTextId) {
      setLiveTextRange(null);
      return;
    }
    beginHistoryGesture();
    const el = ref.current;
    el?.focus();
    const gen = blurGen.current;
    return () => {
      blurGen.current = gen + 1;
      endHistoryGesture();
      setLiveTextRange(null);
    };
  }, [editingTextId]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !layer) return;
    if (fromEditor.current) {
      fromEditor.current = false;
      return;
    }
    const saved = getLiveTextRange();
    skip.current = true;
    el.replaceChildren();
    for (const span of normalizeSpans(layer)) {
      const s = resolvedSpan(layer, span);
      const node = document.createElement("span");
      node.setAttribute("data-marks", marksAttr(span));
      const size = s.superscript || s.subscript ? s.fontSize * 0.62 : s.fontSize;
      node.style.color = s.color;
      node.style.background = s.highlight ?? "transparent";
      node.style.fontFamily = cssFontFamily(s.fontFamily);
      node.style.fontSize = `${size * zoom}px`;
      node.style.fontStyle = s.italic ? "italic" : "normal";
      node.style.fontWeight = String(cssFontWeight(s.fontFamily, s.bold));
      node.style.textDecoration = [
        s.underline ? "underline" : "",
        s.strikethrough ? "line-through" : "",
      ]
        .filter(Boolean)
        .join(" ");
      node.style.verticalAlign = s.superscript
        ? "super"
        : s.subscript
          ? "sub"
          : "";
      node.textContent = span.text;
      el.appendChild(node);
    }
    if (saved && saved.id === layer.id) {
      setOffsetsOnRoot(el, saved.start, saved.end);
    }
    skip.current = false;
  }, [
    layer?.id,
    layer?.text,
    layer?.spans,
    layer?.fontFamily,
    layer?.fontSize,
    layer?.bold,
    layer?.italic,
    layer?.underline,
    layer?.strikethrough,
    layer?.color,
    layer?.highlight,
    layer?.superscript,
    layer?.subscript,
    zoom,
  ]);

  if (!layer) return null;

  const remember = () => {
    const el = ref.current;
    if (!el) return;
    const next = offsetsFromRoot(el);
    setLiveTextRange({ id: layer.id, ...next });
  };

  const left = panX + (PAGE_PAD_X + layer.x) * zoom;
  const top = panY + (PAGE_PAD_Y + layer.y) * zoom;

  return (
    <div
      ref={ref}
      data-text-editor
      contentEditable
      suppressContentEditableWarning
      autoFocus
      onPointerDown={(e) => e.stopPropagation()}
      onKeyUp={remember}
      onMouseUp={remember}
      onSelect={remember}
      onInput={() => {
        if (skip.current || !ref.current) return;
        fromEditor.current = true;
        const spans = parseEditorSpans(ref.current);
        remember();
        useEditorStore.getState().updateLayer(layer.id, {
          spans,
          text: spansToText(spans),
        });
      }}
      onKeyDown={(e) => {
        const meta = e.metaKey || e.ctrlKey;
        if (e.key === "Escape") {
          e.preventDefault();
          useEditorStore.getState().setEditingText(null);
          return;
        }
        if (meta && (e.key === "b" || e.key === "i" || e.key === "u")) {
          e.preventDefault();
          remember();
          const live = offsetsFromRoot(ref.current!);
          if (live.end <= live.start) return;
          const from = rangeToggle(layer, live, e.key);
          const spans = applyRangeMarks(normalizeSpans(layer), live, from);
          useEditorStore.getState().updateLayer(layer.id, {
            spans,
            text: spansToText(spans),
          });
        }
      }}
      onBlur={(e) => {
        if (!e.currentTarget.isConnected) return;
        const next = e.relatedTarget as HTMLElement | null;
        if (next?.closest("[data-text-format-bar], [data-text-editor]")) return;
        const gen = ++blurGen.current;
        const id = layer.id;
        window.setTimeout(() => {
          if (gen !== blurGen.current) return;
          if (!ref.current?.isConnected) return;
          const active = document.activeElement as HTMLElement | null;
          if (active?.closest("[data-text-format-bar], [data-text-editor]")) return;
          if (useEditorStore.getState().editingTextId === id) {
            useEditorStore.getState().setEditingText(null);
          }
        }, 120);
      }}
      className="absolute z-20 overflow-hidden border border-primary bg-[#f7f1e6]/95 shadow-lg outline-none"
      style={{
        left,
        top,
        width: layer.width * zoom,
        height: Math.max(40, layer.height * zoom),
        padding: layer.padding * zoom,
        paddingLeft: (layer.padding + layer.indent) * zoom,
        fontFamily: cssFontFamily(layer.fontFamily),
        fontSize: layer.fontSize * zoom,
        fontWeight: cssFontWeight(layer.fontFamily, layer.bold),
        fontStyle: layer.italic ? "italic" : "normal",
        color: layer.color,
        lineHeight: layer.lineHeight,
        letterSpacing: layer.letterSpacing,
        textAlign: layer.align === "justify" ? "justify" : layer.align,
        whiteSpace: "pre-wrap",
      }}
    />
  );
}

function rangeToggle(
  layer: TextLayer,
  live: { start: number; end: number },
  key: string,
): TextMark {
  const spans = normalizeSpans(layer);
  let i = 0;
  let bold = true;
  let italic = true;
  let underline = true;
  for (const span of spans) {
    const from = i;
    const to = i + span.text.length;
    i = to;
    if (to <= live.start || from >= live.end) continue;
    const s = resolvedSpan(layer, span);
    if (!s.bold) bold = false;
    if (!s.italic) italic = false;
    if (!s.underline) underline = false;
  }
  if (key === "b") return { bold: !bold };
  if (key === "i") return { italic: !italic };
  return { underline: !underline };
}

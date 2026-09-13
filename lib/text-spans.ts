import type { FontFamily, TextLayer, TextSpan } from "./types";

export type TextMark = Omit<TextSpan, "text">;

export type TextRange = { start: number; end: number };

export function spansToText(spans: TextSpan[]): string {
  return spans.map((s) => s.text).join("");
}

export function normalizeSpans(layer: TextLayer): TextSpan[] {
  const raw =
    layer.spans && layer.spans.length > 0
      ? layer.spans
      : [{ text: layer.text ?? "" }];
  const joined = spansToText(raw);
  if (joined !== (layer.text ?? "")) {
    if ((layer.text ?? "").length === 0) return [{ text: "" }];
    return [{ text: layer.text }];
  }
  return mergeSpans(raw);
}

export function mergeSpans(spans: TextSpan[]): TextSpan[] {
  const out: TextSpan[] = [];
  for (const span of spans) {
    if (span.text.length === 0 && out.length > 0) continue;
    const prev = out[out.length - 1];
    if (prev && sameMarks(prev, span)) {
      prev.text += span.text;
    } else {
      out.push({ ...span });
    }
  }
  if (out.length === 0) out.push({ text: "" });
  return out;
}

function sameMarks(a: TextSpan, b: TextSpan) {
  return (
    a.fontFamily === b.fontFamily &&
    a.fontSize === b.fontSize &&
    a.bold === b.bold &&
    a.italic === b.italic &&
    a.underline === b.underline &&
    a.strikethrough === b.strikethrough &&
    a.superscript === b.superscript &&
    a.subscript === b.subscript &&
    a.color === b.color &&
    a.highlight === b.highlight
  );
}

export function splitSpans(spans: TextSpan[], at: number): TextSpan[] {
  const next: TextSpan[] = [];
  let i = 0;
  for (const span of spans) {
    const end = i + span.text.length;
    if (at <= i || at >= end) {
      next.push({ ...span });
    } else {
      const off = at - i;
      next.push({ ...span, text: span.text.slice(0, off) });
      next.push({ ...span, text: span.text.slice(off) });
    }
    i = end;
  }
  return next;
}

export function applyRangeMarks(
  spans: TextSpan[],
  range: TextRange,
  marks: TextMark,
): TextSpan[] {
  const start = Math.max(0, Math.min(range.start, range.end));
  const end = Math.max(range.start, range.end);
  if (end <= start) return mergeSpans(spans);
  let next = splitSpans(spans, start);
  next = splitSpans(next, end);
  let i = 0;
  next = next.map((span) => {
    const from = i;
    i += span.text.length;
    if (from >= start && i <= end && span.text.length > 0) {
      return { ...span, ...marks };
    }
    return span;
  });
  return mergeSpans(next);
}

export function rangeMarks(
  layer: TextLayer,
  range: TextRange,
): TextMark | null {
  const spans = normalizeSpans(layer);
  const start = Math.max(0, Math.min(range.start, range.end));
  const end = Math.max(range.start, range.end);
  if (end <= start) return null;
  const picked: TextSpan[] = [];
  let i = 0;
  for (const span of spans) {
    const from = i;
    const to = i + span.text.length;
    i = to;
    if (to <= start || from >= end) continue;
    picked.push(span);
  }
  if (picked.length === 0) return null;
  const first = picked[0]!;
  const mark = (key: keyof TextMark) => {
    const val = first[key];
    return picked.every((s) => s[key] === val) ? val : undefined;
  };
  return {
    fontFamily: mark("fontFamily") as FontFamily | undefined,
    fontSize: mark("fontSize") as number | undefined,
    bold: mark("bold") as boolean | undefined,
    italic: mark("italic") as boolean | undefined,
    underline: mark("underline") as boolean | undefined,
    strikethrough: mark("strikethrough") as boolean | undefined,
    superscript: mark("superscript") as boolean | undefined,
    subscript: mark("subscript") as boolean | undefined,
    color: mark("color") as string | undefined,
    highlight: mark("highlight") as string | null | undefined,
  };
}

export function resolvedSpan(layer: TextLayer, span: TextSpan) {
  return {
    fontFamily: span.fontFamily ?? layer.fontFamily,
    fontSize: span.fontSize ?? layer.fontSize,
    bold: span.bold ?? layer.bold,
    italic: span.italic ?? layer.italic,
    underline: span.underline ?? layer.underline,
    strikethrough: span.strikethrough ?? layer.strikethrough,
    superscript: span.superscript ?? layer.superscript,
    subscript: span.subscript ?? layer.subscript,
    color: span.color ?? layer.color,
    highlight: span.highlight !== undefined ? span.highlight : layer.highlight,
  };
}

let live: { id: string; start: number; end: number } | null = null;
const listeners = new Set<() => void>();

export function setLiveTextRange(next: { id: string; start: number; end: number } | null) {
  live = next;
  listeners.forEach((fn) => fn());
}

export function getLiveTextRange() {
  return live;
}

export function subscribeLiveTextRange(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function offsetsFromRoot(root: HTMLElement): TextRange {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return { start: 0, end: 0 };
  const range = sel.getRangeAt(0);
  if (!root.contains(range.commonAncestorContainer)) return { start: 0, end: 0 };
  const start = pointOffset(root, range.startContainer, range.startOffset);
  const end = pointOffset(root, range.endContainer, range.endOffset);
  return start <= end ? { start, end } : { start: end, end: start };
}

function pointOffset(root: HTMLElement, node: Node, offset: number): number {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let count = 0;
  let current: Node | null = walker.currentNode;
  while (current) {
    if (current === node) {
      if (current.nodeType === Node.TEXT_NODE) return count + offset;
      return count;
    }
    if (current.nodeType === Node.TEXT_NODE) {
      count += current.textContent?.length ?? 0;
    } else if (current.nodeName === "BR") {
      count += 1;
    }
    current = walker.nextNode();
  }
  return count;
}

export function setOffsetsOnRoot(root: HTMLElement, start: number, end: number) {
  const sel = window.getSelection();
  if (!sel) return;
  const a = locate(root, start);
  const b = locate(root, end);
  if (!a || !b) return;
  const range = document.createRange();
  range.setStart(a.node, a.offset);
  range.setEnd(b.node, b.offset);
  sel.removeAllRanges();
  sel.addRange(range);
}

function locate(
  root: HTMLElement,
  index: number,
): { node: Node; offset: number } | null {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let count = 0;
  let current: Node | null = walker.currentNode === root ? walker.nextNode() : walker.currentNode;
  let lastText: Text | null = null;
  while (current) {
    if (current.nodeType === Node.TEXT_NODE) {
      const len = current.textContent?.length ?? 0;
      if (index <= count + len) {
        return { node: current, offset: index - count };
      }
      count += len;
      lastText = current as Text;
    } else if (current.nodeName === "BR") {
      if (index <= count + 1) {
        const next = current.nextSibling;
        if (next?.nodeType === Node.TEXT_NODE) return { node: next, offset: 0 };
        return { node: current.parentNode ?? root, offset: 0 };
      }
      count += 1;
    }
    current = walker.nextNode();
  }
  if (lastText) return { node: lastText, offset: lastText.textContent?.length ?? 0 };
  return { node: root, offset: 0 };
}

export function parseEditorSpans(root: HTMLElement): TextSpan[] {
  const spans: TextSpan[] = [];
  const walk = (node: Node, marks: TextMark) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? "";
      if (text.length) spans.push({ text, ...marks });
      return;
    }
    if (!(node instanceof HTMLElement)) return;
    if (node.nodeName === "BR") {
      spans.push({ text: "\n", ...marks });
      return;
    }
    const next = { ...marks, ...marksFromElement(node) };
    if (node.childNodes.length === 0 && node !== root) return;
    node.childNodes.forEach((child) => walk(child, next));
  };
  walk(root, {});
  return mergeSpans(spans.length ? spans : [{ text: "" }]);
}

function marksFromElement(el: HTMLElement): TextMark {
  const raw = el.getAttribute("data-marks");
  if (raw) {
    try {
      return JSON.parse(raw) as TextMark;
    } catch {
      /* ignore */
    }
  }
  const marks: TextMark = {};
  const tag = el.tagName;
  if (tag === "B" || tag === "STRONG") marks.bold = true;
  if (tag === "I" || tag === "EM") marks.italic = true;
  if (tag === "U") marks.underline = true;
  if (tag === "S" || tag === "STRIKE") marks.strikethrough = true;
  if (el.style.color) marks.color = el.style.color;
  if (el.style.backgroundColor && el.style.backgroundColor !== "transparent") {
    marks.highlight = el.style.backgroundColor;
  }
  return marks;
}

export function marksAttr(span: TextSpan): string {
  const { text: _t, ...marks } = span;
  return JSON.stringify(marks);
}

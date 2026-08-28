"use client";

import { useEditorStore } from "@/lib/editor-store";

const SIZE = 24;

export function Rulers({
  width,
  height,
}: {
  width: number;
  height: number;
}) {
  const page = useEditorStore((s) => s.page);
  const zoom = useEditorStore((s) => s.zoom);
  const panX = useEditorStore((s) => s.panX);
  const panY = useEditorStore((s) => s.panY);
  const pointer = useEditorStore((s) => s.pointer);

  if (!page.ruler) return null;

  const originX = panX + 80 * zoom;
  const originY = panY + 60 * zoom;

  const hTicks = [];
  for (let x = 0; x <= page.width; x += 50) {
    const left = originX + x * zoom;
    if (left < SIZE || left > width) continue;
    hTicks.push(
      <span
        key={x}
        className="absolute top-0 h-full border-l border-white/20 text-[9px] text-white/50"
        style={{ left }}
      >
        <span className="pl-0.5">{x}</span>
      </span>,
    );
  }
  const vTicks = [];
  for (let y = 0; y <= page.height; y += 50) {
    const top = originY + y * zoom;
    if (top < SIZE || top > height) continue;
    vTicks.push(
      <span
        key={y}
        className="absolute left-0 w-full border-t border-white/20 text-[9px] text-white/50"
        style={{ top }}
      >
        <span className="pl-0.5">{y}</span>
      </span>,
    );
  }

  const px = originX + pointer.x * zoom;
  const py = originY + pointer.y * zoom;

  return (
    <>
      <div className="pointer-events-none absolute top-0 right-0 left-6 h-6 overflow-hidden bg-[#1f1c19] text-white">
        {hTicks}
        <div
          className="absolute top-0 h-full w-px bg-primary"
          style={{ left: px }}
        />
      </div>
      <div className="pointer-events-none absolute top-6 bottom-0 left-0 w-6 overflow-hidden bg-[#1f1c19] text-white">
        {vTicks}
        <div
          className="absolute left-0 h-px w-full bg-primary"
          style={{ top: py - SIZE }}
        />
      </div>
      <div className="absolute top-0 left-0 z-10 size-6 bg-[#1f1c19]" />
    </>
  );
}

"use client";

import { useEditorStore } from "@/lib/editor-store";
import { PAGE_PAD_X, PAGE_PAD_Y, RULER_SIZE } from "@/lib/stage";

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

  const originX = panX + PAGE_PAD_X * zoom;
  const originY = panY + PAGE_PAD_Y * zoom;

  const hTicks = [];
  for (let x = 0; x <= page.width; x += 50) {
    const left = originX + x * zoom;
    if (left < RULER_SIZE || left > width) continue;
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
    if (top < RULER_SIZE || top > height) continue;
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
      <div
        className="pointer-events-none absolute top-0 right-0 left-0 overflow-hidden bg-[#1f1c19] text-white"
        style={{ height: RULER_SIZE }}
      >
        {hTicks}
        <div
          className="absolute top-0 h-full w-px bg-primary"
          style={{ left: px }}
        />
      </div>
      <div
        className="pointer-events-none absolute top-0 bottom-0 left-0 overflow-hidden bg-[#1f1c19] text-white"
        style={{ width: RULER_SIZE }}
      >
        {vTicks}
        <div
          className="absolute left-0 h-px w-full bg-primary"
          style={{ top: py }}
        />
      </div>
      <div
        className="absolute top-0 left-0 z-10 bg-[#1f1c19]"
        style={{ width: RULER_SIZE, height: RULER_SIZE }}
      />
    </>
  );
}

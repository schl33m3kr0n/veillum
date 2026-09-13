"use client";

import { useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  LOUPE_PX,
  paintLoupe,
  snapshotHex,
} from "@/lib/color-loupe";

export function ColorLoupe({
  snapshot,
  snapX,
  snapY,
  clientX,
  clientY,
}: {
  snapshot: HTMLCanvasElement;
  snapX: number;
  snapY: number;
  clientX: number;
  clientY: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hex = snapshotHex(snapshot, snapX, snapY);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    paintLoupe(canvas, snapshot, snapX, snapY);
  }, [snapshot, snapX, snapY]);

  return createPortal(
    <div
      className="pointer-events-none z-50"
      style={{
        position: "fixed",
        left: clientX - LOUPE_PX / 2,
        top: clientY - LOUPE_PX / 2,
        width: LOUPE_PX,
        height: LOUPE_PX,
      }}
    >
      <canvas
        ref={canvasRef}
        width={LOUPE_PX}
        height={LOUPE_PX}
        className="block rounded-full"
        style={{
          width: `${LOUPE_PX}px`,
          height: `${LOUPE_PX}px`,
          maxWidth: `${LOUPE_PX}px`,
          maxHeight: `${LOUPE_PX}px`,
          boxShadow: "0 0 0 2px #161310, 0 12px 28px rgba(0,0,0,0.45)",
        }}
      />
      <div className="absolute top-full left-1/2 mt-1 flex -translate-x-1/2 items-center gap-1 rounded-md bg-[#161310]/90 px-1.5 py-0.5 text-[10px] text-[#f7f1e6]">
        <span
          className="size-2.5 rounded-sm border border-white/20"
          style={{ background: hex }}
        />
        <span className="font-mono">{hex}</span>
      </div>
    </div>,
    document.body,
  );
}

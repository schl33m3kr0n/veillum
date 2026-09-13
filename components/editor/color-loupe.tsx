"use client";

import { useLayoutEffect, useRef } from "react";
import {
  LOUPE_PX,
  paintLoupe,
  snapshotHex,
} from "@/lib/color-loupe";

export function ColorLoupe({
  snapshot,
  snapX,
  snapY,
  boardX,
  boardY,
}: {
  snapshot: HTMLCanvasElement;
  snapX: number;
  snapY: number;
  boardX: number;
  boardY: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hex = snapshotHex(snapshot, snapX, snapY);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    paintLoupe(canvas, snapshot, snapX, snapY);
  }, [snapshot, snapX, snapY]);

  return (
    <div
      className="pointer-events-none absolute z-50"
      style={{
        left: boardX,
        top: boardY,
        width: LOUPE_PX,
        height: LOUPE_PX,
        marginLeft: -LOUPE_PX / 2,
        marginTop: -LOUPE_PX / 2,
      }}
    >
      <canvas
        ref={canvasRef}
        width={LOUPE_PX}
        height={LOUPE_PX}
        className="block rounded-full"
        style={{
          width: LOUPE_PX,
          height: LOUPE_PX,
          imageRendering: "pixelated",
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
    </div>
  );
}

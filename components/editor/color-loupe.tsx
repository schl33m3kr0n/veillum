"use client";

import { useEffect, useRef } from "react";
import { rgbToHex } from "@/lib/colors";

const SIZE = 11;
const CELL = 10;

export function ColorLoupe({
  snapshot,
  pageX,
  pageY,
  screenX,
  screenY,
}: {
  snapshot: HTMLCanvasElement | null;
  pageX: number;
  pageY: number;
  screenX: number;
  screenY: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hex =
    snapshot &&
    sampleHex(snapshot, Math.round(pageX), Math.round(pageY));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !snapshot) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    const px = Math.round(pageX);
    const py = Math.round(pageY);
    const half = Math.floor(SIZE / 2);
    ctx.clearRect(0, 0, SIZE * CELL, SIZE * CELL);
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const sx = px + x - half;
        const sy = py + y - half;
        ctx.fillStyle = sampleHex(snapshot, sx, sy) ?? "#000";
        ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
      }
    }
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(half * CELL + 0.5, half * CELL + 0.5, CELL - 1, CELL - 1);
    ctx.strokeStyle = "rgba(0,0,0,0.7)";
    ctx.strokeRect(half * CELL + 2, half * CELL + 2, CELL - 4, CELL - 4);
  }, [snapshot, pageX, pageY]);

  if (!snapshot || hex == null) return null;

  return (
    <div
      className="pointer-events-none absolute z-50"
      style={{ left: screenX + 18, top: screenY + 18 }}
    >
      <canvas
        ref={canvasRef}
        width={SIZE * CELL}
        height={SIZE * CELL}
        className="rounded-full border-2 border-[#161310] shadow-xl"
        style={{ imageRendering: "pixelated" }}
      />
      <div className="mt-1 flex items-center gap-1.5 rounded-md bg-[#161310] px-2 py-1 text-[11px] text-[#f7f1e6] shadow-md">
        <span
          className="size-3 rounded-sm border border-white/20"
          style={{ background: hex }}
        />
        <span className="font-mono">{hex}</span>
      </div>
    </div>
  );
}

function sampleHex(canvas: HTMLCanvasElement, x: number, y: number): string | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const sx = Math.max(0, Math.min(canvas.width - 1, x));
  const sy = Math.max(0, Math.min(canvas.height - 1, y));
  const pix = ctx.getImageData(sx, sy, 1, 1).data;
  if (pix[3] === 0) return "#ffffff";
  return rgbToHex(pix[0], pix[1], pix[2]);
}

export function sampleCanvasHex(
  canvas: HTMLCanvasElement,
  x: number,
  y: number,
): string | null {
  return sampleHex(canvas, Math.round(x), Math.round(y));
}

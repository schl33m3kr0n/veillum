"use client";

import { useEffect, useRef } from "react";
import { rgbToHex } from "@/lib/colors";

const SIZE = 11;
const CELL = 10;
const MAG = SIZE * CELL;
const HALF = Math.floor(SIZE / 2);

export function ColorLoupe({
  snapshot,
  snapX,
  snapY,
  screenX,
  screenY,
}: {
  snapshot: HTMLCanvasElement | null;
  snapX: number;
  snapY: number;
  screenX: number;
  screenY: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hex = snapshot ? sampleHex(snapshot, snapX, snapY) : null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !snapshot) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, MAG, MAG);
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        ctx.fillStyle = sampleHex(snapshot, snapX + x - HALF, snapY + y - HALF) ?? "#000";
        ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
      }
    }
    const cell = HALF * CELL;
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cell + 0.5, cell + 0.5, CELL - 1, CELL - 1);
    ctx.strokeStyle = "rgba(0,0,0,0.75)";
    ctx.lineWidth = 1;
    ctx.strokeRect(cell + 2, cell + 2, CELL - 4, CELL - 4);
  }, [snapshot, snapX, snapY]);

  return (
    <div
      className="pointer-events-none absolute z-50"
      style={{
        left: screenX - MAG / 2,
        top: screenY - MAG / 2,
        width: MAG,
        height: MAG,
      }}
    >
      <canvas
        ref={canvasRef}
        width={MAG}
        height={MAG}
        className="block rounded-full shadow-[0_0_0_2px_#161310,0_10px_24px_rgba(0,0,0,0.45)]"
        style={{ imageRendering: "pixelated" }}
      />
      {hex ? (
        <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-md bg-[#161310]/90 px-1.5 py-0.5 text-[10px] text-[#f7f1e6]">
          <span
            className="size-2.5 rounded-sm border border-white/20"
            style={{ background: hex }}
          />
          <span className="font-mono">{hex}</span>
        </div>
      ) : null}
    </div>
  );
}

function sampleHex(canvas: HTMLCanvasElement, x: number, y: number): string | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const sx = Math.max(0, Math.min(canvas.width - 1, Math.floor(x)));
  const sy = Math.max(0, Math.min(canvas.height - 1, Math.floor(y)));
  const pix = ctx.getImageData(sx, sy, 1, 1).data;
  if (pix[3] === 0) return "#ffffff";
  return rgbToHex(pix[0], pix[1], pix[2]);
}

export function sampleCanvasHex(
  canvas: HTMLCanvasElement,
  x: number,
  y: number,
): string | null {
  return sampleHex(canvas, x, y);
}

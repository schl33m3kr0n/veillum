import { rgbToHex } from "./colors";

export const LOUPE_GRID = 11;
export const LOUPE_CELL = 10;
export const LOUPE_PX = LOUPE_GRID * LOUPE_CELL;
export const LOUPE_MID = Math.floor(LOUPE_GRID / 2);

export async function capturePageSnapshot(
  pageEl: HTMLElement,
  pageWidth: number,
  pageHeight: number,
): Promise<HTMLCanvasElement> {
  const { toCanvas } = await import("html-to-image");
  return toCanvas(pageEl, {
    pixelRatio: 1,
    cacheBust: true,
    width: pageWidth,
    height: pageHeight,
    canvasWidth: pageWidth,
    canvasHeight: pageHeight,
    style: {
      boxShadow: "none",
      transform: "none",
      left: "0",
      top: "0",
      zoom: "1",
    },
  });
}

export function pageToSnapshotPixel(
  snapshot: HTMLCanvasElement,
  pageWidth: number,
  pageHeight: number,
  pageX: number,
  pageY: number,
): { x: number; y: number } {
  if (pageWidth <= 0 || pageHeight <= 0) return { x: 0, y: 0 };
  return {
    x: clamp(
      Math.floor((pageX / pageWidth) * snapshot.width),
      0,
      snapshot.width - 1,
    ),
    y: clamp(
      Math.floor((pageY / pageHeight) * snapshot.height),
      0,
      snapshot.height - 1,
    ),
  };
}

export function snapshotHex(
  snapshot: HTMLCanvasElement,
  x: number,
  y: number,
): string {
  const ctx = snapshot.getContext("2d", { willReadFrequently: true });
  if (!ctx) return "#ffffff";
  const px = clamp(Math.floor(x), 0, snapshot.width - 1);
  const py = clamp(Math.floor(y), 0, snapshot.height - 1);
  const pix = ctx.getImageData(px, py, 1, 1).data;
  if (pix[3] === 0) return "#ffffff";
  return rgbToHex(pix[0], pix[1], pix[2]);
}

export function pickColorAtPage(
  snapshot: HTMLCanvasElement,
  pageWidth: number,
  pageHeight: number,
  pageX: number,
  pageY: number,
): string {
  const at = pageToSnapshotPixel(snapshot, pageWidth, pageHeight, pageX, pageY);
  return snapshotHex(snapshot, at.x, at.y);
}

export function paintLoupe(
  dest: HTMLCanvasElement,
  snapshot: HTMLCanvasElement,
  snapX: number,
  snapY: number,
) {
  dest.width = LOUPE_PX;
  dest.height = LOUPE_PX;
  dest.style.width = `${LOUPE_PX}px`;
  dest.style.height = `${LOUPE_PX}px`;
  const ctx = dest.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, LOUPE_PX, LOUPE_PX);

  ctx.save();
  ctx.beginPath();
  ctx.arc(LOUPE_PX / 2, LOUPE_PX / 2, LOUPE_PX / 2 - 1, 0, Math.PI * 2);
  ctx.clip();

  const srcX = snapX - LOUPE_MID;
  const srcY = snapY - LOUPE_MID;
  for (let y = 0; y < LOUPE_GRID; y++) {
    for (let x = 0; x < LOUPE_GRID; x++) {
      ctx.fillStyle = snapshotHex(snapshot, srcX + x, srcY + y);
      ctx.fillRect(x * LOUPE_CELL, y * LOUPE_CELL, LOUPE_CELL, LOUPE_CELL);
    }
  }

  const hole = LOUPE_MID * LOUPE_CELL;
  ctx.strokeStyle = "rgba(255,255,255,0.95)";
  ctx.lineWidth = 2;
  ctx.strokeRect(hole + 1, hole + 1, LOUPE_CELL - 2, LOUPE_CELL - 2);
  ctx.strokeStyle = "rgba(0,0,0,0.85)";
  ctx.lineWidth = 1;
  ctx.strokeRect(hole + 3, hole + 3, LOUPE_CELL - 6, LOUPE_CELL - 6);
  ctx.restore();
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

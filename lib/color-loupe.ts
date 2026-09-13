import { rgbToHex } from "./colors";
import { clientToLocal } from "./pointer-space";

export const LOUPE_GRID = 11;
export const LOUPE_CELL = 10;
export const LOUPE_PX = LOUPE_GRID * LOUPE_CELL;
export const LOUPE_MID = Math.floor(LOUPE_GRID / 2);

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image load failed"));
    img.src = src;
  });
}

function coverSource(
  nw: number,
  nh: number,
  dw: number,
  dh: number,
): { sx: number; sy: number; sw: number; sh: number } {
  const scale = Math.max(dw / Math.max(1, nw), dh / Math.max(1, nh));
  const sw = dw / scale;
  const sh = dh / scale;
  return {
    sx: (nw - sw) / 2,
    sy: (nh - sh) / 2,
    sw,
    sh,
  };
}

function applyLayerTransform(
  ctx: CanvasRenderingContext2D,
  layerEl: HTMLElement,
) {
  ctx.translate(layerEl.offsetLeft, layerEl.offsetTop);
  const ox = layerEl.offsetWidth / 2;
  const oy = layerEl.offsetHeight / 2;
  ctx.translate(ox, oy);
  const t = getComputedStyle(layerEl).transform;
  if (t && t !== "none") {
    const m = new DOMMatrix(t);
    ctx.transform(m.a, m.b, m.c, m.d, m.e, m.f);
  }
  ctx.translate(-ox, -oy);
  const opacity = Number(getComputedStyle(layerEl).opacity);
  if (Number.isFinite(opacity)) ctx.globalAlpha *= opacity;
  const blend = getComputedStyle(layerEl).mixBlendMode;
  if (blend && blend !== "normal") {
    ctx.globalCompositeOperation = blend as GlobalCompositeOperation;
  }
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource & { naturalWidth?: number; naturalHeight?: number; width: number; height: number },
  w: number,
  h: number,
) {
  const nw = img.naturalWidth || img.width;
  const nh = img.naturalHeight || img.height;
  const s = coverSource(nw, nh, w, h);
  ctx.drawImage(img, s.sx, s.sy, s.sw, s.sh, 0, 0, w, h);
}

async function svgDataUrl(svg: SVGSVGElement, w: number, h: number): Promise<string> {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", `${w}`);
  clone.setAttribute("height", `${h}`);
  const xml = new XMLSerializer().serializeToString(clone);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
}

async function paintLayer(
  ctx: CanvasRenderingContext2D,
  layerEl: HTMLElement,
) {
  const cs = getComputedStyle(layerEl);
  if (cs.visibility === "hidden" || cs.display === "none") return;

  const w = layerEl.offsetWidth;
  const h = layerEl.offsetHeight;
  if (w < 1 || h < 1) return;

  ctx.save();
  applyLayerTransform(ctx, layerEl);

  const img = layerEl.querySelector("img");
  if (img && img.complete && img.naturalWidth > 0) {
    try {
      drawCoverImage(ctx, img, w, h);
    } catch {
      /* tainted */
    }
    ctx.restore();
    return;
  }

  const svg = layerEl.querySelector("svg");
  if (svg) {
    try {
      const url = await svgDataUrl(svg, w, h);
      const drawn = await loadImage(url);
      ctx.drawImage(drawn, 0, 0, w, h);
    } catch {
      /* skip */
    }
    ctx.restore();
    return;
  }

  const color = cs.color;
  if (color && color !== "rgba(0, 0, 0, 0)") {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.restore();
}

/** Raster the live page. Avoid html-to-image: Chromium draws that SVG
foreignObject at the wrong size, so sampled pixels drift from the pointer. */
export async function capturePageSnapshot(
  pageEl: HTMLElement,
  pageWidth: number,
  pageHeight: number,
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = pageWidth;
  canvas.height = pageHeight;
  canvas.style.width = `${pageWidth}px`;
  canvas.style.height = `${pageHeight}px`;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return canvas;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = getComputedStyle(pageEl).backgroundColor || "#ffffff";
  ctx.fillRect(0, 0, pageWidth, pageHeight);

  const layers = pageEl.querySelectorAll<HTMLElement>("[data-layer-id]");
  for (const layerEl of layers) {
    await paintLayer(ctx, layerEl);
  }
  return canvas;
}

export function snapshotPixelFromPage(
  snapshot: HTMLCanvasElement,
  pageX: number,
  pageY: number,
): { x: number; y: number } {
  return {
    x: clamp(Math.floor(pageX), 0, snapshot.width - 1),
    y: clamp(Math.floor(pageY), 0, snapshot.height - 1),
  };
}

export function snapshotPixelFromClient(
  snapshot: HTMLCanvasElement,
  pageEl: HTMLElement,
  clientX: number,
  clientY: number,
): { x: number; y: number } {
  const local = clientToLocal(pageEl, clientX, clientY);
  return snapshotPixelFromPage(snapshot, local.x, local.y);
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

export function pickColorAtClient(
  snapshot: HTMLCanvasElement,
  pageEl: HTMLElement,
  clientX: number,
  clientY: number,
): string {
  const at = snapshotPixelFromClient(snapshot, pageEl, clientX, clientY);
  return snapshotHex(snapshot, at.x, at.y);
}

export function paintLoupe(
  dest: HTMLCanvasElement,
  snapshot: HTMLCanvasElement,
  snapX: number,
  snapY: number,
) {
  if (dest.width !== LOUPE_PX) dest.width = LOUPE_PX;
  if (dest.height !== LOUPE_PX) dest.height = LOUPE_PX;
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
  ctx.strokeStyle = "rgba(0, 0, 0, 0.85)";
  ctx.lineWidth = 1;
  ctx.strokeRect(hole + 3, hole + 3, LOUPE_CELL - 6, LOUPE_CELL - 6);
  ctx.restore();
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

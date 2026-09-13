export function pageSnapshotOptions(width: number, height: number) {
  return {
    pixelRatio: 1 as const,
    cacheBust: true,
    width,
    height,
    canvasWidth: width,
    canvasHeight: height,
    style: {
      boxShadow: "none",
      transform: "none",
      left: "0",
      top: "0",
    },
  };
}

/** Integer page pixel shown in the status bar. */
export function statusPagePixel(pageX: number, pageY: number) {
  return { x: Math.round(pageX), y: Math.round(pageY) };
}

/** Viewport location of the center of a page pixel. */
export function pagePixelClientCenter(
  pageEl: HTMLElement,
  pageWidth: number,
  pageHeight: number,
  pageX: number,
  pageY: number,
): { clientX: number; clientY: number } {
  const rect = pageEl.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) {
    return { clientX: rect.left, clientY: rect.top };
  }
  return {
    clientX: rect.left + (pageX + 0.5) * (rect.width / pageWidth),
    clientY: rect.top + (pageY + 0.5) * (rect.height / pageHeight),
  };
}

/** Map a client point onto the snapshot bitmap (pixel that contains the point). */
export function snapshotPixelAt(
  snapshot: HTMLCanvasElement,
  pageEl: HTMLElement,
  clientX: number,
  clientY: number,
): { x: number; y: number } {
  const rect = pageEl.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return { x: 0, y: 0 };
  const x = ((clientX - rect.left) / rect.width) * snapshot.width;
  const y = ((clientY - rect.top) / rect.height) * snapshot.height;
  return {
    x: Math.min(snapshot.width - 1, Math.max(0, Math.floor(x))),
    y: Math.min(snapshot.height - 1, Math.max(0, Math.floor(y))),
  };
}

export function snapshotPixelForPage(
  snapshot: HTMLCanvasElement,
  pageWidth: number,
  pageHeight: number,
  pageX: number,
  pageY: number,
): { x: number; y: number } {
  if (pageWidth <= 0 || pageHeight <= 0) return { x: 0, y: 0 };
  return {
    x: Math.min(
      snapshot.width - 1,
      Math.max(0, Math.floor(((pageX + 0.5) / pageWidth) * snapshot.width)),
    ),
    y: Math.min(
      snapshot.height - 1,
      Math.max(0, Math.floor(((pageY + 0.5) / pageHeight) * snapshot.height)),
    ),
  };
}

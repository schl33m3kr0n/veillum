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
      zoom: "1",
    },
  };
}

/** Map a page-space point onto the snapshot bitmap. */
export function snapshotPixelFromPage(
  snapshot: HTMLCanvasElement,
  pageWidth: number,
  pageHeight: number,
  pageX: number,
  pageY: number,
): { x: number; y: number } {
  if (pageWidth <= 0 || pageHeight <= 0) return { x: 0, y: 0 };
  const x = (pageX / pageWidth) * snapshot.width;
  const y = (pageY / pageHeight) * snapshot.height;
  return {
    x: Math.min(snapshot.width - 1, Math.max(0, Math.floor(x))),
    y: Math.min(snapshot.height - 1, Math.max(0, Math.floor(y))),
  };
}

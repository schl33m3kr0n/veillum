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

/** Map a viewport point onto the snapshot bitmap (pixel under that point). */
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

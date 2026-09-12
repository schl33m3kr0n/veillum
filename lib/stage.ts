export const PAGE_PAD_X = 80;
export const PAGE_PAD_Y = 60;
export const RULER_SIZE = 24;

/** Center a page in the studio workspace at a zoom that fits. */
export function framePage(page: { width: number; height: number }) {
  const rail = 56;
  const sidebar = 320;
  const chrome = 120;
  const availW =
    typeof window === "undefined" ? 900 : Math.max(360, window.innerWidth - rail - sidebar);
  const availH =
    typeof window === "undefined" ? 560 : Math.max(280, window.innerHeight - chrome);
  const zoom = Math.max(
    0.12,
    Math.min(
      1.25,
      (availW - 40) / (page.width + PAGE_PAD_X * 2),
      (availH - 40) / (page.height + PAGE_PAD_Y * 2),
    ),
  );
  return {
    zoom,
    panX: Math.max(8, (availW - (page.width + PAGE_PAD_X * 2) * zoom) / 2),
    panY: Math.max(8, (availH - (page.height + PAGE_PAD_Y * 2) * zoom) / 2),
  };
}

/** Map a viewport point into an element's layout coordinates.

Chromium previews often wrap the app in a CSS scale, so getBoundingClientRect
does not match offsetWidth. Firefox usually has scale 1. Dividing by that
ratio puts the pointer in the same space as position:absolute children. */
export function clientToLocal(
  el: HTMLElement,
  clientX: number,
  clientY: number,
): { x: number; y: number } {
  const rect = el.getBoundingClientRect();
  const sx = rect.width / Math.max(1, el.offsetWidth);
  const sy = rect.height / Math.max(1, el.offsetHeight);
  return {
    x: (clientX - rect.left) / (sx || 1),
    y: (clientY - rect.top) / (sy || 1),
  };
}

export function localToPage(
  localX: number,
  localY: number,
  panX: number,
  panY: number,
  zoom: number,
  padX: number,
  padY: number,
): { x: number; y: number } {
  return {
    x: (localX - panX) / zoom - padX,
    y: (localY - panY) / zoom - padY,
  };
}

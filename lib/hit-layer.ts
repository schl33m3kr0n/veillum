import { pageToLocal } from "./transform";
import type { Layer } from "./types";

/** Topmost visible layer whose rotated box contains the page point. */
export function hitLayerAt(
  layers: Layer[],
  x: number,
  y: number,
): Layer | null {
  for (let i = layers.length - 1; i >= 0; i--) {
    const layer = layers[i];
    if (layer.visible === false) continue;
    const local = pageToLocal(layer, x, y);
    if (
      local.x >= 0 &&
      local.y >= 0 &&
      local.x <= layer.width &&
      local.y <= layer.height
    ) {
      return layer;
    }
  }
  return null;
}

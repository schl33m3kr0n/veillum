export type HandleId = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

export type BoxLayer = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
};

/** Map a local point through scale then rotate, both around the box center. */
export function localToPage(
  layer: BoxLayer,
  lx: number,
  ly: number,
): { x: number; y: number } {
  const rad = (layer.rotation * Math.PI) / 180;
  const ox = layer.width / 2;
  const oy = layer.height / 2;
  const sx = (lx - ox) * layer.scaleX;
  const sy = (ly - oy) * layer.scaleY;
  return {
    x: layer.x + ox + sx * Math.cos(rad) - sy * Math.sin(rad),
    y: layer.y + oy + sx * Math.sin(rad) + sy * Math.cos(rad),
  };
}

export function pageToLocal(
  layer: BoxLayer,
  px: number,
  py: number,
): { x: number; y: number } {
  const ox = layer.width / 2;
  const oy = layer.height / 2;
  const dx = px - layer.x - ox;
  const dy = py - layer.y - oy;
  const rad = -(layer.rotation * Math.PI) / 180;
  const x = dx * Math.cos(rad) - dy * Math.sin(rad);
  const y = dx * Math.sin(rad) + dy * Math.cos(rad);
  return {
    x: x / (layer.scaleX || 1) + ox,
    y: y / (layer.scaleY || 1) + oy,
  };
}

export function layerCenter(layer: BoxLayer): { x: number; y: number } {
  return {
    x: layer.x + layer.width / 2,
    y: layer.y + layer.height / 2,
  };
}

/** Place the layer so local (lx, ly) sits on a page point. */
export function placeLocalAt(
  layer: BoxLayer,
  lx: number,
  ly: number,
  page: { x: number; y: number },
): { x: number; y: number } {
  const origin = localToPage({ ...layer, x: 0, y: 0 }, lx, ly);
  return { x: page.x - origin.x, y: page.y - origin.y };
}

/** Convert a top-left-origin box so it looks the same with center rotation. */
export function migrateLayerFromTopLeftOrigin<T extends BoxLayer>(layer: T): T {
  const next = migrateBoxFromTopLeftOrigin(layer);
  const keyframes = (layer as T & { keyframes?: { x: number; y: number; rotation: number; scaleX: number; scaleY: number }[] }).keyframes;
  if (!keyframes?.length) return next;
  return {
    ...next,
    keyframes: keyframes.map((k) => {
      const box = migrateBoxFromTopLeftOrigin({
        x: k.x,
        y: k.y,
        width: layer.width,
        height: layer.height,
        rotation: k.rotation,
        scaleX: k.scaleX,
        scaleY: k.scaleY,
      });
      return { ...k, x: box.x, y: box.y };
    }),
  } as T;
}

function migrateBoxFromTopLeftOrigin<T extends BoxLayer>(layer: T): T {
  const ox = layer.width / 2;
  const oy = layer.height / 2;
  const hw = ox * layer.scaleX;
  const hh = oy * layer.scaleY;
  const rad = (layer.rotation * Math.PI) / 180;
  return {
    ...layer,
    x: layer.x - ox + hw * Math.cos(rad) - hh * Math.sin(rad),
    y: layer.y - oy + hw * Math.sin(rad) + hh * Math.cos(rad),
  };
}

export function layerAabb(layer: BoxLayer): {
  left: number;
  right: number;
  top: number;
  bottom: number;
  cx: number;
  cy: number;
} {
  const pts = [
    localToPage(layer, 0, 0),
    localToPage(layer, layer.width, 0),
    localToPage(layer, layer.width, layer.height),
    localToPage(layer, 0, layer.height),
  ];
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const left = Math.min(...xs);
  const right = Math.max(...xs);
  const top = Math.min(...ys);
  const bottom = Math.max(...ys);
  return {
    left,
    right,
    top,
    bottom,
    cx: (left + right) / 2,
    cy: (top + bottom) / 2,
  };
}

/** Mirror in place so the AABB center stays put. */
export function flipLayer<T extends BoxLayer>(
  layer: T,
  axis: "horizontal" | "vertical",
): T {
  const before = layerAabb(layer);
  const next = {
    ...layer,
    scaleX: axis === "horizontal" ? -layer.scaleX : layer.scaleX,
    scaleY: axis === "vertical" ? -layer.scaleY : layer.scaleY,
  };
  const after = layerAabb(next);
  return {
    ...next,
    x: layer.x + (before.cx - after.cx),
    y: layer.y + (before.cy - after.cy),
  };
}

export function groupAabb(layers: BoxLayer[]): {
  left: number;
  right: number;
  top: number;
  bottom: number;
  cx: number;
  cy: number;
  width: number;
  height: number;
} {
  if (layers.length === 0) {
    return { left: 0, right: 0, top: 0, bottom: 0, cx: 0, cy: 0, width: 0, height: 0 };
  }
  const boxes = layers.map(layerAabb);
  const left = Math.min(...boxes.map((b) => b.left));
  const right = Math.max(...boxes.map((b) => b.right));
  const top = Math.min(...boxes.map((b) => b.top));
  const bottom = Math.max(...boxes.map((b) => b.bottom));
  return {
    left,
    right,
    top,
    bottom,
    cx: (left + right) / 2,
    cy: (top + bottom) / 2,
    width: right - left,
    height: bottom - top,
  };
}

export function rotateAroundCenter(
  layer: BoxLayer,
  pageX: number,
  pageY: number,
  snap = false,
): { x: number; y: number; rotation: number } {
  const center = layerCenter(layer);
  let deg = (Math.atan2(pageY - center.y, pageX - center.x) * 180) / Math.PI + 90;
  if (snap) deg = Math.round(deg / 15) * 15;
  return { rotation: deg, x: layer.x, y: layer.y };
}

export function rotateLayerAround(
  layer: BoxLayer,
  origin: { x: number; y: number },
  deltaDeg: number,
): { x: number; y: number; rotation: number } {
  const center = layerCenter(layer);
  const rad = (deltaDeg * Math.PI) / 180;
  const dx = center.x - origin.x;
  const dy = center.y - origin.y;
  const nx = origin.x + dx * Math.cos(rad) - dy * Math.sin(rad);
  const ny = origin.y + dx * Math.sin(rad) + dy * Math.cos(rad);
  const rotation = layer.rotation + deltaDeg;
  const pos = placeLocalAt(
    { ...layer, rotation },
    layer.width / 2,
    layer.height / 2,
    { x: nx, y: ny },
  );
  return { rotation, x: pos.x, y: pos.y };
}

export function resizeFromHandle(
  handle: HandleId,
  localX: number,
  localY: number,
  origin: BoxLayer,
  lockAspect: boolean,
): { x: number; y: number; width: number; height: number } {
  let width = origin.width;
  let height = origin.height;
  let ox = 0;
  let oy = 0;
  if (handle.includes("e")) width = Math.max(8, localX);
  if (handle.includes("s")) height = Math.max(8, localY);
  if (handle.includes("w")) {
    width = Math.max(8, origin.width - localX);
    ox = origin.width - width;
  }
  if (handle.includes("n")) {
    height = Math.max(8, origin.height - localY);
    oy = origin.height - height;
  }
  if (lockAspect && origin.width > 0 && origin.height > 0) {
    const ratio = origin.width / origin.height;
    if (handle.length === 2) {
      if (width / height > ratio) height = width / ratio;
      else width = height * ratio;
    } else if (handle === "e" || handle === "w") {
      height = Math.max(8, width / ratio);
      oy = (origin.height - height) / 2;
    } else if (handle === "n" || handle === "s") {
      width = Math.max(8, height * ratio);
      ox = (origin.width - width) / 2;
    }
    if (handle.includes("w")) ox = origin.width - width;
    if (handle.includes("n")) oy = origin.height - height;
  }
  const fixed = localToPage(origin, ox, oy);
  const pos = placeLocalAt({ ...origin, width, height }, 0, 0, fixed);
  return { x: pos.x, y: pos.y, width, height };
}

export function resizeGroupFromHandle(
  handle: HandleId,
  pageX: number,
  pageY: number,
  origin: { left: number; top: number; width: number; height: number },
  lockAspect: boolean,
): { left: number; top: number; width: number; height: number } {
  let { left, top, width, height } = origin;
  const right = origin.left + origin.width;
  const bottom = origin.top + origin.height;
  if (handle.includes("e")) width = Math.max(8, pageX - left);
  if (handle.includes("s")) height = Math.max(8, pageY - top);
  if (handle.includes("w")) {
    width = Math.max(8, right - pageX);
    left = right - width;
  }
  if (handle.includes("n")) {
    height = Math.max(8, bottom - pageY);
    top = bottom - height;
  }
  if (lockAspect && origin.width > 0 && origin.height > 0) {
    const ratio = origin.width / origin.height;
    if (handle.length === 2) {
      if (width / height > ratio) height = width / ratio;
      else width = height * ratio;
    } else if (handle === "e" || handle === "w") {
      height = Math.max(8, width / ratio);
      top = origin.top + (origin.height - height) / 2;
    } else if (handle === "n" || handle === "s") {
      width = Math.max(8, height * ratio);
      left = origin.left + (origin.width - width) / 2;
    }
    if (handle.includes("w")) left = right - width;
    if (handle.includes("n")) top = bottom - height;
  }
  return { left, top, width, height };
}

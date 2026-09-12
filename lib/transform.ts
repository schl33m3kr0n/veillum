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

export function localToPage(
  layer: BoxLayer,
  lx: number,
  ly: number,
): { x: number; y: number } {
  const rad = (layer.rotation * Math.PI) / 180;
  const x = lx * layer.scaleX;
  const y = ly * layer.scaleY;
  return {
    x: layer.x + x * Math.cos(rad) - y * Math.sin(rad),
    y: layer.y + x * Math.sin(rad) + y * Math.cos(rad),
  };
}

export function pageToLocal(
  layer: BoxLayer,
  px: number,
  py: number,
): { x: number; y: number } {
  const dx = px - layer.x;
  const dy = py - layer.y;
  const rad = -(layer.rotation * Math.PI) / 180;
  const x = dx * Math.cos(rad) - dy * Math.sin(rad);
  const y = dx * Math.sin(rad) + dy * Math.cos(rad);
  return { x: x / (layer.scaleX || 1), y: y / (layer.scaleY || 1) };
}

export function layerCenter(layer: BoxLayer): { x: number; y: number } {
  return localToPage(layer, layer.width / 2, layer.height / 2);
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
  const cx = (layer.width * layer.scaleX) / 2;
  const cy = (layer.height * layer.scaleY) / 2;
  const old = (layer.rotation * Math.PI) / 180;
  const center = {
    x: layer.x + cx * Math.cos(old) - cy * Math.sin(old),
    y: layer.y + cx * Math.sin(old) + cy * Math.cos(old),
  };
  let deg = (Math.atan2(pageY - center.y, pageX - center.x) * 180) / Math.PI + 90;
  if (snap) deg = Math.round(deg / 15) * 15;
  const neu = (deg * Math.PI) / 180;
  return {
    rotation: deg,
    x: center.x - (cx * Math.cos(neu) - cy * Math.sin(neu)),
    y: center.y - (cx * Math.sin(neu) + cy * Math.cos(neu)),
  };
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
  const hw = (layer.width * layer.scaleX) / 2;
  const hh = (layer.height * layer.scaleY) / 2;
  const r = (rotation * Math.PI) / 180;
  return {
    rotation,
    x: nx - (hw * Math.cos(r) - hh * Math.sin(r)),
    y: ny - (hw * Math.sin(r) + hh * Math.cos(r)),
  };
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
    const corner = handle.length === 2;
    if (corner) {
      if (width / height > ratio) height = width / ratio;
      else width = height * ratio;
      if (handle.includes("w")) ox = origin.width - width;
      if (handle.includes("n")) oy = origin.height - height;
    }
  }
  const page = localToPage(origin, ox, oy);
  return { x: page.x, y: page.y, width, height };
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
      if (handle.includes("w")) left = right - width;
      if (handle.includes("n")) top = bottom - height;
    }
  }
  return { left, top, width, height };
}

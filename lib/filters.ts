import type { ImageAdjustments, InstantAlpha } from "./types";

function clamp(v: number, min = 0, max = 255): number {
  return v < min ? min : v > max ? max : v;
}

function luma(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function convolve3(
  src: Uint8ClampedArray,
  dst: Uint8ClampedArray,
  w: number,
  h: number,
  kernel: number[],
  amount: number,
) {
  const k = kernel;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      let r = 0,
        g = 0,
        b = 0;
      let ki = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const i = ((y + ky) * w + (x + kx)) * 4;
          const kv = k[ki++];
          r += src[i] * kv;
          g += src[i + 1] * kv;
          b += src[i + 2] * kv;
        }
      }
      const i = (y * w + x) * 4;
      dst[i] = clamp(src[i] * (1 - amount) + r * amount);
      dst[i + 1] = clamp(src[i + 1] * (1 - amount) + g * amount);
      dst[i + 2] = clamp(src[i + 2] * (1 - amount) + b * amount);
      dst[i + 3] = src[i + 3];
    }
  }
}

export function applyAdjustments(
  imageData: ImageData,
  adj: ImageAdjustments,
  alpha: InstantAlpha | null,
  perspective: number,
) {
  const { data, width, height } = imageData;
  const src = perspective !== 0 ? new Uint8ClampedArray(data) : null;

  const exp = Math.pow(2, adj.exposure);
  const bright = adj.brightness * (adj.raw ? 80 : 50);
  const contrast = 1 + adj.contrast * (adj.raw ? 1.4 : 1);
  const sat = 1 + adj.saturation;
  const temp = adj.temperature * (adj.raw ? 40 : 28);
  const tint = adj.tint * 22;
  const warmth = adj.warmth * 18;
  const sh = adj.shadows;
  const hi = adj.highlights;
  const sepiaAmt = Math.max(0, Math.min(1, adj.sepia));
  const range = adj.raw ? 1.35 : 1;

  for (let y = 0; y < height; y++) {
    let srcScale = 1;
    if (src && perspective !== 0) {
      srcScale = 1 - perspective * (y / height) * 0.85;
    }
    for (let x = 0; x < width; x++) {
      let sx = x;
      let sy = y;
      if (src && perspective !== 0) {
        const cx = width / 2;
        sx = cx + (x - cx) / Math.max(0.15, srcScale);
        sy = y;
        if (sx < 0 || sx >= width - 1) {
          const i = (y * width + x) * 4;
          data[i] = 0;
          data[i + 1] = 0;
          data[i + 2] = 0;
          data[i + 3] = 0;
          continue;
        }
      }
      const read = src ?? data;
      const si =
        src && perspective !== 0
          ? (sy * width + Math.max(0, Math.min(width - 1, sx | 0))) * 4
          : (y * width + x) * 4;
      let r = read[si] * exp;
      let g = read[si + 1] * exp;
      let b = read[si + 2] * exp;
      let a = read[si + 3];

      if (alpha?.enabled) {
        const dr = r - alpha.r;
        const dg = g - alpha.g;
        const db = b - alpha.b;
        const dist = Math.sqrt(dr * dr + dg * dg + db * db);
        if (dist < alpha.tolerance * 2.2) {
          a = clamp(a * (dist / (alpha.tolerance * 2.2)), 0, 255);
        }
      }

      r += temp + warmth;
      b -= temp + warmth * 0.6;
      g += tint;
      r -= tint * 0.35;
      b -= tint * 0.35;

      r += bright;
      g += bright;
      b += bright;

      r = (r - 128) * contrast * range + 128;
      g = (g - 128) * contrast * range + 128;
      b = (b - 128) * contrast * range + 128;

      const Y = luma(r, g, b) / 255;
      if (Y < 0.45) {
        const t = (0.45 - Y) / 0.45;
        const lift = sh * 55 * t;
        r += lift;
        g += lift;
        b += lift;
      } else if (Y > 0.55) {
        const t = (Y - 0.55) / 0.45;
        const crush = hi * 55 * t;
        r -= crush;
        g -= crush;
        b -= crush;
      }

      if (adj.raw && Y > 0.78) {
        const t = (Y - 0.78) / 0.22;
        r = r - (r - 245) * t * 0.45;
        g = g - (g - 245) * t * 0.45;
        b = b - (b - 245) * t * 0.45;
      }

      if (sat !== 1) {
        const yy = luma(r, g, b);
        r = yy + (r - yy) * sat;
        g = yy + (g - yy) * sat;
        b = yy + (b - yy) * sat;
      }

      if (sepiaAmt > 0) {
        const sr = 0.393 * r + 0.769 * g + 0.189 * b;
        const sg = 0.349 * r + 0.686 * g + 0.168 * b;
        const sb = 0.272 * r + 0.534 * g + 0.131 * b;
        r = r + (sr - r) * sepiaAmt;
        g = g + (sg - g) * sepiaAmt;
        b = b + (sb - b) * sepiaAmt;
      }

      const i = (y * width + x) * 4;
      data[i] = clamp(r);
      data[i + 1] = clamp(g);
      data[i + 2] = clamp(b);
      data[i + 3] = a;
    }
  }

  if (adj.sharpness > 0.01) {
    const copy = new Uint8ClampedArray(data);
    const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
    convolve3(copy, data, width, height, kernel, Math.min(1, adj.sharpness));
  }

  if (adj.blur > 0.15) {
    boxBlur(imageData, adj.blur * 8);
  }
}

function boxBlur(imageData: ImageData, radius: number) {
  const r = Math.max(1, Math.round(radius));
  const { width: w, height: h, data } = imageData;
  const src = new Uint8ClampedArray(data);
  const tmp = new Uint8ClampedArray(data.length);
  const div = r * 2 + 1;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let rSum = 0,
        gSum = 0,
        bSum = 0,
        aSum = 0;
      for (let k = -r; k <= r; k++) {
        const xx = Math.min(w - 1, Math.max(0, x + k));
        const i = (y * w + xx) * 4;
        rSum += src[i];
        gSum += src[i + 1];
        bSum += src[i + 2];
        aSum += src[i + 3];
      }
      const i = (y * w + x) * 4;
      tmp[i] = rSum / div;
      tmp[i + 1] = gSum / div;
      tmp[i + 2] = bSum / div;
      tmp[i + 3] = aSum / div;
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let rSum = 0,
        gSum = 0,
        bSum = 0,
        aSum = 0;
      for (let k = -r; k <= r; k++) {
        const yy = Math.min(h - 1, Math.max(0, y + k));
        const i = (yy * w + x) * 4;
        rSum += tmp[i];
        gSum += tmp[i + 1];
        bSum += tmp[i + 2];
        aSum += tmp[i + 3];
      }
      const i = (y * w + x) * 4;
      data[i] = rSum / div;
      data[i + 1] = gSum / div;
      data[i + 2] = bSum / div;
      data[i + 3] = aSum / div;
    }
  }
}

export function samplePixel(
  src: string,
  nx: number,
  ny: number,
): Promise<{ r: number; g: number; b: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("no ctx"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      const x = Math.max(0, Math.min(img.width - 1, Math.round(nx * img.width)));
      const y = Math.max(
        0,
        Math.min(img.height - 1, Math.round(ny * img.height)),
      );
      const p = ctx.getImageData(x, y, 1, 1).data;
      resolve({ r: p[0], g: p[1], b: p[2] });
    };
    img.onerror = reject;
    img.src = src;
  });
}

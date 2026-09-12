export type BgProgress = (note: string) => void;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read this picture."));
    img.src = src;
  });
}

function canvasToPng(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL("image/png");
}

function dist2(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number) {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return dr * dr + dg * dg + db * db;
}

function borderStats(data: Uint8ClampedArray, width: number, height: number) {
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  const sample = (x: number, y: number) => {
    const i = (y * width + x) * 4;
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    n += 1;
  };
  for (let x = 0; x < width; x++) {
    sample(x, 0);
    sample(x, height - 1);
  }
  for (let y = 1; y < height - 1; y++) {
    sample(0, y);
    sample(width - 1, y);
  }
  const mean = { r: r / n, g: g / n, b: b / n };
  let varSum = 0;
  const acc = (x: number, y: number) => {
    const i = (y * width + x) * 4;
    varSum += dist2(data[i], data[i + 1], data[i + 2], mean.r, mean.g, mean.b);
  };
  for (let x = 0; x < width; x++) {
    acc(x, 0);
    acc(x, height - 1);
  }
  for (let y = 1; y < height - 1; y++) {
    acc(0, y);
    acc(width - 1, y);
  }
  return { mean, std: Math.sqrt(varSum / n) };
}

function knockOutEdges(image: ImageData) {
  const { data, width, height } = image;
  const n = width * height;
  const mark = new Uint8Array(n);
  const queue = new Int32Array(n);
  let qh = 0;
  let qt = 0;
  const { mean, std } = borderStats(data, width, height);
  const studio = std < 28;
  const neighborThresh = studio ? 48 * 48 : 36 * 36;
  const chromaThresh = studio ? Math.max(38, std * 2.4) ** 2 : -1;

  const push = (idx: number) => {
    if (mark[idx]) return;
    mark[idx] = 1;
    queue[qt++] = idx;
  };

  for (let x = 0; x < width; x++) {
    push(x);
    push((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    push(y * width);
    push(y * width + width - 1);
  }

  while (qh < qt) {
    const i = queue[qh++];
    const x = i % width;
    const y = (i / width) | 0;
    const o = i * 4;
    const r = data[o];
    const g = data[o + 1];
    const b = data[o + 2];
    const tryN = (nx: number, ny: number) => {
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) return;
      const j = ny * width + nx;
      if (mark[j]) return;
      const p = j * 4;
      if (dist2(r, g, b, data[p], data[p + 1], data[p + 2]) <= neighborThresh) {
        push(j);
      }
    };
    tryN(x - 1, y);
    tryN(x + 1, y);
    tryN(x, y - 1);
    tryN(x, y + 1);
  }

  if (chromaThresh > 0) {
    for (let i = 0; i < n; i++) {
      if (mark[i]) continue;
      const o = i * 4;
      if (dist2(data[o], data[o + 1], data[o + 2], mean.r, mean.g, mean.b) <= chromaThresh) {
        mark[i] = 1;
      }
    }
  }

  const kept = n - mark.reduce((a, v) => a + v, 0);
  const ratio = kept / n;
  if (ratio < 0.04 || ratio > 0.97) {
    return false;
  }

  const alpha = new Uint8ClampedArray(n);
  for (let i = 0; i < n; i++) alpha[i] = mark[i] ? 0 : 255;

  for (let pass = 0; pass < 2; pass++) {
    const next = new Uint8ClampedArray(alpha);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const i = y * width + x;
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            sum += alpha[(y + ky) * width + (x + kx)];
          }
        }
        next[i] = Math.round(sum / 9);
      }
    }
    alpha.set(next);
  }

  for (let i = 0; i < n; i++) {
    data[i * 4 + 3] = Math.min(data[i * 4 + 3], alpha[i]);
  }
  return true;
}

async function removeByEdges(src: string): Promise<string> {
  const img = await loadImage(src);
  const maxEdge = 960;
  const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
  const w = Math.max(2, Math.round(img.width * scale));
  const h = Math.max(2, Math.round(img.height * scale));
  const work = document.createElement("canvas");
  work.width = w;
  work.height = h;
  const wctx = work.getContext("2d");
  if (!wctx) throw new Error("Could not cut this picture.");
  wctx.drawImage(img, 0, 0, w, h);
  const sample = wctx.getImageData(0, 0, w, h);
  const ok = knockOutEdges(sample);
  if (!ok) throw new Error("Nothing clear to punch out. Try Instant Alpha and click the backdrop.");
  wctx.putImageData(sample, 0, 0);

  const out = document.createElement("canvas");
  out.width = img.width;
  out.height = img.height;
  const octx = out.getContext("2d");
  if (!octx) throw new Error("Could not cut this picture.");
  octx.imageSmoothingEnabled = true;
  octx.drawImage(work, 0, 0, img.width, img.height);
  return canvasToPng(out);
}

async function removeWithModel(src: string, progress: BgProgress): Promise<string> {
  progress("Downloading cutout model…");
  const { removeBackground } = await import("@imgly/background-removal");
  progress("Cutting out the subject…");
  const blob = await removeBackground(src, {
    model: "isnet_quint8",
    device: "cpu",
    proxyToWorker: false,
    output: { format: "image/png", quality: 0.92 },
    progress: (key: string, current: number, total: number) => {
      if (!total) return;
      const pct = Math.round((current / total) * 100);
      progress(
        key.includes("fetch") || key.includes("download")
          ? `Downloading model ${pct}%`
          : `Cutting out ${pct}%`,
      );
    },
  });
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () =>
      reject(reader.error ?? new Error("Could not encode the cutout."));
    reader.readAsDataURL(blob);
  });
}

export async function removeImageBackground(
  src: string,
  progress: BgProgress = () => {},
): Promise<string> {
  try {
    return await removeWithModel(src, progress);
  } catch {
    progress("Punching out the backdrop…");
    return await removeByEdges(src);
  }
}

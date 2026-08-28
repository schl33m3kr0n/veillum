const JPEG_SOI = [0xff, 0xd8];
const JPEG_EOI = [0xff, 0xd9];

function findJpeg(bytes: Uint8Array): Uint8Array | null {
  for (let i = 0; i < bytes.length - 1; i++) {
    if (bytes[i] === JPEG_SOI[0] && bytes[i + 1] === JPEG_SOI[1]) {
      for (let j = i + 2; j < bytes.length - 1; j++) {
        if (bytes[j] === JPEG_EOI[0] && bytes[j + 1] === JPEG_EOI[1]) {
          const slice = bytes.slice(i, j + 2);
          if (slice.length > 8_000) return slice;
          break;
        }
      }
    }
  }
  return null;
}

export function isRawFilename(name: string): boolean {
  return /\.(dng|cr2|cr3|nef|arw|orf|rw2|raf|pef|srw|raw)$/i.test(name);
}

export async function extractRawPreview(
  file: File,
): Promise<{ dataUrl: string; isRaw: boolean }> {
  const raw = isRawFilename(file.name);
  if (!raw && file.type.startsWith("image/")) {
    const dataUrl = await readAsDataUrl(file);
    return { dataUrl, isRaw: false };
  }
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const jpeg = findJpeg(bytes);
  if (jpeg) {
    const copy = new ArrayBuffer(jpeg.byteLength);
    new Uint8Array(copy).set(jpeg);
    const blob = new Blob([copy], { type: "image/jpeg" });
    const dataUrl = await readAsDataUrl(blob);
    return { dataUrl, isRaw: true };
  }
  if (file.type.startsWith("image/")) {
    return { dataUrl: await readAsDataUrl(file), isRaw: raw };
  }
  throw new Error(
    "Could not read a preview from this RAW file. Try a DNG or a camera RAW with an embedded JPEG.",
  );
}

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function createDemoPhoto(): string {
  const canvas = document.createElement("canvas");
  canvas.width = 720;
  canvas.height = 480;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const sky = ctx.createLinearGradient(0, 0, 0, 280);
  sky.addColorStop(0, "#1b3a5c");
  sky.addColorStop(0.45, "#d9894b");
  sky.addColorStop(1, "#f2c988");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 720, 480);

  ctx.fillStyle = "#ffe08a";
  ctx.beginPath();
  ctx.arc(560, 128, 52, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255, 224, 138, 0.25)";
  ctx.beginPath();
  ctx.arc(560, 128, 92, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#2d4030";
  ctx.beginPath();
  ctx.moveTo(0, 310);
  ctx.quadraticCurveTo(180, 210, 360, 300);
  ctx.quadraticCurveTo(520, 370, 720, 250);
  ctx.lineTo(720, 480);
  ctx.lineTo(0, 480);
  ctx.fill();

  ctx.fillStyle = "#1f2e22";
  ctx.beginPath();
  ctx.moveTo(0, 380);
  ctx.quadraticCurveTo(240, 320, 480, 400);
  ctx.quadraticCurveTo(600, 440, 720, 360);
  ctx.lineTo(720, 480);
  ctx.lineTo(0, 480);
  ctx.fill();

  const img = ctx.getImageData(0, 0, 720, 480);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 18;
    img.data[i] = Math.max(0, Math.min(255, img.data[i] + n));
    img.data[i + 1] = Math.max(0, Math.min(255, img.data[i + 1] + n));
    img.data[i + 2] = Math.max(0, Math.min(255, img.data[i + 2] + n));
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL("image/jpeg", 0.88);
}

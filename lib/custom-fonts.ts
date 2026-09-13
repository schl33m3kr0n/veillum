export type CustomFont = {
  family: string;
  format: "truetype" | "opentype" | "woff" | "woff2";
  mime: string;
  weight: string;
  style: string;
  bytes: ArrayBuffer;
};

const LEGACY_KEY = "veillum-custom-fonts";
const DB_NAME = "veillum-fonts";
const STORE = "faces";
const MAX_FONTS = 24;
const MAX_BYTES = 8_000_000;

type StoredFont = {
  family: string;
  format: CustomFont["format"];
  mime: string;
  weight: string;
  style: string;
  bytes: ArrayBuffer;
};

let fonts: CustomFont[] = [];
const listeners = new Set<() => void>();
const faces = new Map<string, FontFace>();
const objectUrls = new Map<string, string>();

function emit() {
  for (const fn of listeners) fn();
}

function faceKey(font: Pick<CustomFont, "family" | "weight" | "style">) {
  return `${font.family}::${font.weight}::${font.style}`;
}

function familyFromFilename(name: string): string {
  return (
    name
      .replace(/\.(ttf|otf|woff2?)$/i, "")
      .replace(/[-_]+/g, " ")
      .replace(
        /\s+(variable|regular|italic|oblique|thin|hairline|extra\s*light|ultra\s*light|light|book|medium|semibold|semi\s*bold|demibold|demi\s*bold|bold|extra\s*bold|ultra\s*bold|black|heavy|w\d{3})$/gi,
        "",
      )
      .replace(/\s+/g, " ")
      .trim() || "Imported"
  );
}

function descriptorsFromFilename(name: string): { weight: string; style: string } {
  const n = name.toLowerCase();
  const style = /italic|oblique/.test(n) ? "italic" : "normal";
  let weight = "400";
  if (/thin|hairline/.test(n)) weight = "100";
  else if (/extra\s*light|ultra\s*light/.test(n)) weight = "200";
  else if (/\blight\b/.test(n)) weight = "300";
  else if (/\bmedium\b/.test(n)) weight = "500";
  else if (/semibold|semi\s*bold|demibold|demi\s*bold/.test(n)) weight = "600";
  else if (/extra\s*bold|ultra\s*bold/.test(n)) weight = "800";
  else if (/\b(black|heavy)\b/.test(n)) weight = "900";
  else if (/\bbold\b/.test(n)) weight = "700";
  const w = n.match(/\bw([1-9]00)\b/);
  if (w?.[1]) weight = w[1];
  return { weight, style };
}

function formatFromName(name: string): CustomFont["format"] {
  if (/\.woff2$/i.test(name)) return "woff2";
  if (/\.woff$/i.test(name)) return "woff";
  if (/\.otf$/i.test(name)) return "opentype";
  return "truetype";
}

function mimeForFormat(format: CustomFont["format"]): string {
  switch (format) {
    case "woff2":
      return "font/woff2";
    case "woff":
      return "font/woff";
    case "opentype":
      return "font/otf";
    default:
      return "font/ttf";
  }
}

function tagAt(view: DataView, offset: number): string {
  return String.fromCharCode(
    view.getUint8(offset),
    view.getUint8(offset + 1),
    view.getUint8(offset + 2),
    view.getUint8(offset + 3),
  );
}

function decodeNameBytes(bytes: Uint8Array, platform: number, encoding: number) {
  if (platform === 3 || encoding === 1 || encoding === 10) {
    const units: number[] = [];
    for (let i = 0; i + 1 < bytes.length; i += 2) {
      units.push((bytes[i] << 8) | bytes[i + 1]);
    }
    return String.fromCharCode(...units);
  }
  return new TextDecoder("latin1").decode(bytes);
}

/** Read the family name from a TrueType / OpenType name table. */
export function familyFromSfnt(buffer: ArrayBuffer): string | null {
  const view = new DataView(buffer);
  if (view.byteLength < 12) return null;
  const magic = view.getUint32(0);
  if (magic === 0x774f4646 || magic === 0x774f4632) return null;
  const numTables = view.getUint16(4);
  let nameOffset = 0;
  for (let i = 0; i < numTables; i++) {
    const o = 12 + i * 16;
    if (o + 16 > view.byteLength) return null;
    if (tagAt(view, o) === "name") {
      nameOffset = view.getUint32(o + 8);
      break;
    }
  }
  if (!nameOffset || nameOffset + 6 > view.byteLength) return null;
  const count = view.getUint16(nameOffset + 2);
  const stringOffset = view.getUint16(nameOffset + 4);
  type Rec = {
    platform: number;
    encoding: number;
    language: number;
    id: number;
    length: number;
    offset: number;
  };
  const records: Rec[] = [];
  for (let i = 0; i < count; i++) {
    const o = nameOffset + 6 + i * 12;
    if (o + 12 > view.byteLength) break;
    records.push({
      platform: view.getUint16(o),
      encoding: view.getUint16(o + 2),
      language: view.getUint16(o + 4),
      id: view.getUint16(o + 6),
      length: view.getUint16(o + 8),
      offset: view.getUint16(o + 10),
    });
  }
  const read = (rec: Rec) => {
    const start = nameOffset + stringOffset + rec.offset;
    if (start < 0 || start + rec.length > view.byteLength) return "";
    return decodeNameBytes(
      new Uint8Array(buffer, start, rec.length),
      rec.platform,
      rec.encoding,
    ).replace(/\0/g, "").trim();
  };
  const pick = (id: number) =>
    records.find(
      (r) => r.id === id && r.platform === 3 && (r.language === 0x0409 || (r.language & 0xff) === 0x09),
    ) ??
    records.find((r) => r.id === id && r.platform === 3) ??
    records.find((r) => r.id === id && r.platform === 0) ??
    records.find((r) => r.id === id && r.platform === 1) ??
    records.find((r) => r.id === id);
  const rec = pick(16) ?? pick(1) ?? pick(4);
  if (!rec) return null;
  const name = read(rec);
  return name || null;
}

export function getCustomFonts(): CustomFont[] {
  return fonts;
}

export function subscribeCustomFonts(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function hasCustomFont(family: string): boolean {
  return fonts.some((f) => f.family === family);
}

function uniqueFamilies(): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const font of fonts) {
    if (seen.has(font.family)) continue;
    seen.add(font.family);
    names.push(font.family);
  }
  return names;
}

export function getCustomFontFamilies(): string[] {
  return uniqueFamilies();
}

async function registerFace(font: CustomFont) {
  if (typeof document === "undefined") return;
  const key = faceKey(font);
  const previous = faces.get(key);
  if (previous) {
    document.fonts.delete(previous);
    const oldUrl = objectUrls.get(key);
    if (oldUrl) URL.revokeObjectURL(oldUrl);
  }
  const blob = new Blob([font.bytes], { type: font.mime });
  const url = URL.createObjectURL(blob);
  objectUrls.set(key, url);
  const face = new FontFace(font.family, `url(${url}) format('${font.format}')`, {
    weight: font.weight,
    style: font.style,
    display: "swap",
  });
  await face.load();
  document.fonts.add(face);
  faces.set(key, face);
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function persist() {
  if (typeof indexedDB === "undefined") return;
  const payload: StoredFont[] = fonts.map((f) => ({
    family: f.family,
    format: f.format,
    mime: f.mime,
    weight: f.weight,
    style: f.style,
    bytes: f.bytes,
  }));
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(payload, "all");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
    try {
      localStorage.removeItem(LEGACY_KEY);
    } catch {
      /* ignore */
    }
  } catch {
    /* quota */
  }
}

async function loadStored(): Promise<CustomFont[]> {
  if (typeof indexedDB === "undefined") return [];
  try {
    const db = await openDb();
    const rows = await new Promise<StoredFont[] | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get("all");
      req.onsuccess = () => resolve(req.result as StoredFont[] | undefined);
      req.onerror = () => reject(req.error);
    });
    db.close();
    if (!Array.isArray(rows)) return [];
    return rows.filter((f) => f?.family && f.bytes);
  } catch {
    return [];
  }
}

async function loadLegacy(): Promise<CustomFont[]> {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { family: string; dataUrl: string }[];
    if (!Array.isArray(parsed)) return [];
    const next: CustomFont[] = [];
    for (const item of parsed) {
      if (!item?.family || !item?.dataUrl) continue;
      const res = await fetch(item.dataUrl);
      const bytes = await res.arrayBuffer();
      next.push({
        family: item.family,
        format: "truetype",
        mime: "font/ttf",
        weight: "400",
        style: "normal",
        bytes,
      });
    }
    return next;
  } catch {
    return [];
  }
}

export async function restoreCustomFonts(): Promise<void> {
  if (typeof window === "undefined") return;
  let stored = await loadStored();
  if (stored.length === 0) {
    stored = await loadLegacy();
    if (stored.length) fonts = stored;
    if (stored.length) await persist();
  } else {
    fonts = stored;
  }
  await Promise.all(fonts.map((f) => registerFace(f).catch(() => undefined)));
  emit();
}

function isFontFile(file: File): boolean {
  return /\.(ttf|otf|woff2?)$/i.test(file.name) || file.type.startsWith("font/");
}

export function isLocalFontFile(file: File): boolean {
  return isFontFile(file);
}

export async function importFontFile(file: File): Promise<string> {
  const [family] = await importFontFiles([file]);
  if (!family) throw new Error("Could not read that font.");
  return family;
}

export async function importFontFiles(files: File[]): Promise<string[]> {
  const accepted = files.filter(isFontFile);
  if (accepted.length === 0) {
    throw new Error("Use a .ttf, .otf, .woff, or .woff2 file.");
  }
  const families: string[] = [];
  for (const file of accepted) {
    if (file.size > MAX_BYTES) {
      throw new Error(`${file.name} is larger than 8 MB.`);
    }
    const bytes = await file.arrayBuffer();
    const format = formatFromName(file.name);
    const mime = file.type.startsWith("font/") ? file.type : mimeForFormat(format);
    const fromTable = format === "truetype" || format === "opentype"
      ? familyFromSfnt(bytes)
      : null;
    const family = fromTable || familyFromFilename(file.name);
    const { weight, style } = descriptorsFromFilename(file.name);
    const font: CustomFont = {
      family,
      format,
      mime,
      weight,
      style,
      bytes,
    };
    await registerFace(font);
    const key = faceKey(font);
    fonts = [
      font,
      ...fonts.filter((f) => faceKey(f) !== key),
    ].slice(0, MAX_FONTS);
    families.push(family);
  }
  await persist();
  emit();
  return [...new Set(families)];
}

export async function removeCustomFont(family: string) {
  const removed = fonts.filter((f) => f.family === family);
  fonts = fonts.filter((f) => f.family !== family);
  for (const font of removed) {
    const key = faceKey(font);
    const face = faces.get(key);
    if (face && typeof document !== "undefined") document.fonts.delete(face);
    faces.delete(key);
    const url = objectUrls.get(key);
    if (url) URL.revokeObjectURL(url);
    objectUrls.delete(key);
  }
  await persist();
  emit();
}

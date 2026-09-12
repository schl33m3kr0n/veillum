export type CustomFont = {
  family: string;
  dataUrl: string;
};

const KEY = "vellum-custom-fonts";
const MAX_FONTS = 12;
const MAX_BYTES = 2_500_000;

let fonts: CustomFont[] = [];
const listeners = new Set<() => void>();
const loaded = new Set<string>();

function emit() {
  for (const fn of listeners) fn();
}

function familyFromFilename(name: string): string {
  return (
    name
      .replace(/\.(ttf|otf|woff2?)$/i, "")
      .replace(/[-_]+/g, " ")
      .replace(/\s+(regular|bold|italic|light|medium|semibold|black)$/i, "")
      .trim() || "Imported"
  );
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

async function registerFace(font: CustomFont) {
  if (typeof document === "undefined" || loaded.has(font.family)) return;
  const face = new FontFace(font.family, `url(${font.dataUrl})`);
  await face.load();
  document.fonts.add(face);
  loaded.add(font.family);
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(fonts));
  } catch {
    /* quota */
  }
}

export async function restoreCustomFonts(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as CustomFont[];
    if (!Array.isArray(parsed)) return;
    fonts = parsed.filter((f) => f?.family && f?.dataUrl);
    await Promise.all(fonts.map((f) => registerFace(f).catch(() => undefined)));
    emit();
  } catch {
    fonts = [];
  }
}

export async function importFontFile(file: File): Promise<string> {
  if (file.size > MAX_BYTES) {
    throw new Error("Font files need to be under 2.5 MB.");
  }
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  const family = familyFromFilename(file.name);
  await registerFace({ family, dataUrl });
  fonts = [
    { family, dataUrl },
    ...fonts.filter((f) => f.family !== family),
  ].slice(0, MAX_FONTS);
  persist();
  emit();
  return family;
}

export function removeCustomFont(family: string) {
  fonts = fonts.filter((f) => f.family !== family);
  persist();
  emit();
}

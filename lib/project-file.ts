import { downloadBlob, projectJson } from "./export";
import { normalizePage } from "./document";
import type { Layer, Page } from "./types";

export const PROJECT_ACCEPT = ".veillum,.json,application/json";
export const DEFAULT_PROJECT_NAME = "untitled.veillum";

const FILE_PICKER_TYPES: {
  description: string;
  accept: Record<string, string[]>;
}[] = [
  {
    description: "veillum page",
    accept: { "application/json": [".veillum", ".json"] },
  },
];

let fileHandle: FileSystemFileHandle | null = null;

export function clearFileHandle() {
  fileHandle = null;
}

export function parseProjectJson(text: string): { page: Page; layers: Layer[] } {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("This file is not valid JSON.");
  }
  if (!data || typeof data !== "object") {
    throw new Error("This file is not a veillum page.");
  }
  const rec = data as { page?: Page; layers?: Layer[] };
  if (!rec.page || typeof rec.page !== "object" || !Array.isArray(rec.layers)) {
    throw new Error("This file is not a veillum page.");
  }
  return { page: normalizePage(rec.page), layers: rec.layers };
}

function isAbort(err: unknown) {
  return err instanceof DOMException && err.name === "AbortError";
}

async function ensureWrite(handle: FileSystemFileHandle) {
  try {
    const withPerm = handle as FileSystemFileHandle & {
      queryPermission?: (d: { mode: "readwrite" }) => Promise<PermissionState>;
      requestPermission?: (d: { mode: "readwrite" }) => Promise<PermissionState>;
    };
    if (typeof withPerm.queryPermission === "function") {
      const q = await withPerm.queryPermission({ mode: "readwrite" });
      if (q === "granted") return true;
      if (q === "denied") return false;
    }
    if (typeof withPerm.requestPermission === "function") {
      return (await withPerm.requestPermission({ mode: "readwrite" })) === "granted";
    }
    return true;
  } catch {
    return false;
  }
}

async function writeHandle(handle: FileSystemFileHandle, text: string) {
  const writable = await handle.createWritable();
  await writable.write(text);
  await writable.close();
}

async function tryWriteExisting(text: string) {
  if (!fileHandle) return false;
  try {
    if (!(await ensureWrite(fileHandle))) {
      fileHandle = null;
      return false;
    }
    await writeHandle(fileHandle, text);
    return true;
  } catch {
    fileHandle = null;
    return false;
  }
}

function normalizeName(name: string) {
  const trimmed = name.trim() || DEFAULT_PROJECT_NAME;
  if (/\.(veillum|json)$/i.test(trimmed)) return trimmed;
  return `${trimmed}.veillum`;
}

function pickWithInput(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = PROJECT_ACCEPT;
    input.addEventListener("change", () => resolve(input.files?.[0] ?? null), {
      once: true,
    });
    input.addEventListener("cancel", () => resolve(null), { once: true });
    input.click();
  });
}

export async function readProjectFromDisk(): Promise<{
  page: Page;
  layers: Layer[];
  fileName: string;
} | null> {
  const picker = window as Window & {
    showOpenFilePicker?: (opts: {
      multiple?: boolean;
      types?: { description: string; accept: Record<string, string[]> }[];
    }) => Promise<FileSystemFileHandle[]>;
  };
  if (typeof picker.showOpenFilePicker === "function") {
    try {
      const [handle] = await picker.showOpenFilePicker({
        multiple: false,
        types: FILE_PICKER_TYPES,
      });
      const file = await handle.getFile();
      const parsed = parseProjectJson(await file.text());
      fileHandle = (await ensureWrite(handle)) ? handle : null;
      return { ...parsed, fileName: file.name || DEFAULT_PROJECT_NAME };
    } catch (err) {
      if (isAbort(err)) return null;
      throw err;
    }
  }
  const file = await pickWithInput();
  if (!file) return null;
  const parsed = parseProjectJson(await file.text());
  fileHandle = null;
  return { ...parsed, fileName: file.name || DEFAULT_PROJECT_NAME };
}

export async function writeProjectToDisk(
  page: Page,
  layers: Layer[],
  currentName: string | null,
  saveAs = false,
): Promise<string | null> {
  const text = projectJson(page, layers);
  const suggested = normalizeName(currentName || DEFAULT_PROJECT_NAME);
  const picker = window as Window & {
    showSaveFilePicker?: (opts: {
      suggestedName?: string;
      types?: { description: string; accept: Record<string, string[]> }[];
    }) => Promise<FileSystemFileHandle>;
  };

  if (!saveAs && (await tryWriteExisting(text))) {
    return suggested;
  }
  if (!saveAs) {
    return null;
  }

  if (typeof picker.showSaveFilePicker === "function") {
    try {
      const handle = await picker.showSaveFilePicker({
        suggestedName: suggested,
        types: FILE_PICKER_TYPES,
      });
      try {
        await writeHandle(handle, text);
        fileHandle = handle;
        return handle.name || suggested;
      } catch {
        fileHandle = null;
        downloadBlob(new Blob([text], { type: "application/json" }), handle.name || suggested);
        return handle.name || suggested;
      }
    } catch (err) {
      if (isAbort(err)) return null;
      downloadBlob(new Blob([text], { type: "application/json" }), suggested);
      return suggested;
    }
  }

  downloadBlob(new Blob([text], { type: "application/json" }), suggested);
  return suggested;
}

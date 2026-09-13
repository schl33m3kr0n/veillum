import type { Layer, Page } from "./types";

const DB_NAME = "veillum";
const DB_VERSION = 1;
const STORE = "kv";
const DRAFT_KEY = "draft";

export type AutosaveDraft = {
  version: 1;
  savedAt: number;
  page: Page;
  layers: Layer[];
  recentColors: string[];
  duration: number;
  zoom: number;
  panX: number;
  panY: number;
  sidebarOpen: boolean;
  timelineOpen: boolean;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Could not open autosave."));
  });
}

function reqToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Autosave failed."));
  });
}

export async function loadDraft(): Promise<AutosaveDraft | null> {
  if (typeof indexedDB === "undefined") return null;
  try {
    const db = await openDb();
    try {
      const raw = await reqToPromise(
        db.transaction(STORE, "readonly").objectStore(STORE).get(DRAFT_KEY),
      );
      if (!raw || typeof raw !== "object") return null;
      const draft = raw as AutosaveDraft;
      if (draft.version !== 1 || !draft.page || !Array.isArray(draft.layers)) {
        return null;
      }
      return draft;
    } finally {
      db.close();
    }
  } catch {
    return null;
  }
}

export async function saveDraft(draft: AutosaveDraft): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  const db = await openDb();
  try {
    await reqToPromise(
      db.transaction(STORE, "readwrite").objectStore(STORE).put(draft, DRAFT_KEY),
    );
  } finally {
    db.close();
  }
}

export function draftFromState(s: {
  page: Page;
  layers: Layer[];
  recentColors: string[];
  duration: number;
  zoom: number;
  panX: number;
  panY: number;
  sidebarOpen: boolean;
  timelineOpen: boolean;
}): AutosaveDraft {
  return {
    version: 1,
    savedAt: Date.now(),
    page: s.page,
    layers: s.layers,
    recentColors: s.recentColors,
    duration: s.duration,
    zoom: s.zoom,
    panX: s.panX,
    panY: s.panY,
    sidebarOpen: s.sidebarOpen,
    timelineOpen: s.timelineOpen,
  };
}

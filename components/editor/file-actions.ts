"use client";

import { useEditorStore } from "@/lib/editor-store";
import { fetchSitePage, putSitePage } from "@/lib/site-library";
import { displayPageName } from "@/lib/site-pages";
import { readProjectFromDisk, writeProjectToDisk } from "@/lib/project-file";

function humanFileError(err: unknown, fallback: string) {
  const msg = err instanceof Error ? err.message : "";
  if (/getFile|createWritable|NotAllowedError|NotFoundError|user agent or the platform|security/i.test(msg)) {
    return "Could not use the system file picker here. Try again, or use Save as file…";
  }
  return err instanceof Error && err.message ? err.message : fallback;
}

export async function openProjectFile() {
  const store = useEditorStore.getState();
  store.setFileError(null);
  try {
    const result = await readProjectFromDisk();
    if (!result) return;
    store.hydrateDraft({
      page: result.page,
      layers: result.layers,
      fileName: result.fileName,
      siteId: null,
    });
  } catch (err) {
    store.setFileError(humanFileError(err, "Could not open that file."));
  }
}

export async function openSitePage(id: string) {
  const store = useEditorStore.getState();
  store.setFileError(null);
  try {
    const record = await fetchSitePage(id);
    store.hydrateDraft({
      page: record.page,
      layers: record.layers,
      fileName: record.name,
      siteId: record.id,
    });
  } catch (err) {
    store.setFileError(humanFileError(err, "Could not open that page."));
  }
}

export async function saveProjectFile(saveAs = false) {
  const store = useEditorStore.getState();
  if (!store.hasDocument) {
    store.setStartOpen(true);
    return;
  }
  store.setFileError(null);
  try {
    const name = displayPageName(store.fileName || "Untitled");
    const record = await putSitePage({
      id: store.siteId,
      name,
      page: store.page,
      layers: store.layers,
    });
    store.setSiteId(record.id);
    store.setFileName(record.name);
    const diskName = await writeProjectToDisk(
      store.page,
      store.layers,
      store.fileName,
      saveAs,
    );
    if (diskName) store.setFileName(diskName);
  } catch (err) {
    store.setFileError(humanFileError(err, "Could not save that page."));
  }
}

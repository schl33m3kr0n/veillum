"use client";

import { useEditorStore } from "@/lib/editor-store";
import { readProjectFromDisk, writeProjectToDisk } from "@/lib/project-file";

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
    });
  } catch (err) {
    store.setFileError(
      err instanceof Error ? err.message : "Could not open that file.",
    );
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
    const name = await writeProjectToDisk(
      store.page,
      store.layers,
      store.fileName,
      saveAs,
    );
    if (!name) return;
    store.setFileName(name);
  } catch (err) {
    store.setFileError(
      err instanceof Error ? err.message : "Could not save that file.",
    );
  }
}

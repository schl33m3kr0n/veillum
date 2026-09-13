"use client";

import { useEditorStore } from "@/lib/editor-store";
import { readProjectFromDisk, writeProjectToDisk } from "@/lib/project-file";

function humanFileError(err: unknown, fallback: string) {
  const msg = err instanceof Error ? err.message : "";
  if (/createWritable|NotAllowedError|NotFoundError|security/i.test(msg)) {
    return "Could not write that file. Try Save as…";
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
    });
  } catch (err) {
    store.setFileError(humanFileError(err, "Could not open that file."));
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
    store.setFileError(humanFileError(err, "Could not save that file."));
  }
}

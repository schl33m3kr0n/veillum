"use client";

import { useEffect } from "react";
import { draftFromState, loadDraft, saveDraft } from "@/lib/autosave";
import { useEditorStore } from "@/lib/editor-store";

export function useAutosave() {
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let writing = false;
    let queued = false;

    async function restore() {
      const draft = await loadDraft();
      if (cancelled) return;
      if (draft) {
        useEditorStore.getState().hydrateDraft(draft);
        useEditorStore.getState().setSaveStatus("saved", draft.savedAt);
      } else {
        useEditorStore.getState().setSessionReady(true);
      }
    }

    async function flush() {
      const s = useEditorStore.getState();
      if (!s.sessionReady || !s.hasDocument) return;
      writing = true;
      s.setSaveStatus("saving");
      try {
        const draft = draftFromState(s);
        await saveDraft(draft);
        if (!cancelled) {
          useEditorStore.getState().setSaveStatus("saved", draft.savedAt);
        }
      } catch {
        if (!cancelled) useEditorStore.getState().setSaveStatus("error");
      } finally {
        writing = false;
        if (queued && !cancelled) {
          queued = false;
          void flush();
        }
      }
    }

    function schedule() {
      const s = useEditorStore.getState();
      if (!s.sessionReady || !s.hasDocument) return;
      if (timer != null) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        if (writing) queued = true;
        else void flush();
      }, 700);
    }

    const unsub = useEditorStore.subscribe((state, prev) => {
      if (
        state.page === prev.page &&
        state.layers === prev.layers &&
        state.recentColors === prev.recentColors &&
        state.duration === prev.duration &&
        state.fileName === prev.fileName
      ) {
        return;
      }
      if (!prev.hasDocument && state.hasDocument) {
        void flush();
        return;
      }
      schedule();
    });

    const onHide = () => {
      if (timer != null) {
        clearTimeout(timer);
        timer = null;
      }
      void flush();
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") onHide();
    };

    void restore();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onHide);

    return () => {
      cancelled = true;
      unsub();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onHide);
      if (timer != null) clearTimeout(timer);
    };
  }, []);
}

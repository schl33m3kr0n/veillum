"use client";

import { useEffect } from "react";
import { endHistoryGesture } from "@/lib/editor-store";

/** Commit a paused drag if the pointer was cancelled or the window lost focus. */
export function HistoryGuard() {
  useEffect(() => {
    const end = () => endHistoryGesture();
    window.addEventListener("pointercancel", end);
    window.addEventListener("blur", end);
    return () => {
      window.removeEventListener("pointercancel", end);
      window.removeEventListener("blur", end);
    };
  }, []);
  return null;
}

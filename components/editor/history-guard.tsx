"use client";

import { useEffect } from "react";
import { resumeHistory } from "@/lib/editor-store";

/** Resume history if a drag ended without the original pointerup (lost capture). */
export function HistoryGuard() {
  useEffect(() => {
    const resume = () => resumeHistory();
    window.addEventListener("pointerup", resume);
    window.addEventListener("pointercancel", resume);
    window.addEventListener("blur", resume);
    return () => {
      window.removeEventListener("pointerup", resume);
      window.removeEventListener("pointercancel", resume);
      window.removeEventListener("blur", resume);
    };
  }, []);
  return null;
}

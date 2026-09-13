"use client";

import { Highlighter } from "lucide-react";
import { cn } from "@/lib/utils";

export function HighlighterIcon({
  color,
  className,
}: {
  color: string;
  className?: string;
}) {
  return (
    <Highlighter
      className={cn("shrink-0", className)}
      style={{
        color,
        filter: "drop-shadow(0 0 0.55px #1c1916)",
      }}
    />
  );
}

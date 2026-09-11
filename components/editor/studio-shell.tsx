"use client";

import dynamic from "next/dynamic";

const Studio = dynamic(
  () => import("./studio").then((m) => m.Studio),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-dvh items-center justify-center bg-background text-sm text-muted-foreground">
        Opening the studio…
      </div>
    ),
  },
);

export function StudioShell() {
  return <Studio />;
}

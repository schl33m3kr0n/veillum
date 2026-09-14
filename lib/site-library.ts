import type { Layer, Page } from "./types";
import type { SitePageMeta, SitePageRecord } from "./site-pages";

export async function fetchSitePages(): Promise<SitePageMeta[]> {
  const res = await fetch("/api/pages", { cache: "no-store" });
  if (!res.ok) throw new Error("Could not list pages on this site.");
  const data = (await res.json()) as { pages: SitePageMeta[] };
  return data.pages ?? [];
}

export async function fetchSitePage(id: string): Promise<SitePageRecord> {
  const res = await fetch(`/api/pages/${encodeURIComponent(id)}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Could not open that page.");
  return (await res.json()) as SitePageRecord;
}

export async function putSitePage(input: {
  id?: string | null;
  name: string;
  page: Page;
  layers: Layer[];
}): Promise<{ id: string; name: string; savedAt: number }> {
  const res = await fetch("/api/pages", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(err?.error || "Could not save on this site.");
  }
  return (await res.json()) as { id: string; name: string; savedAt: number };
}

export async function removeSitePage(id: string) {
  const res = await fetch(`/api/pages?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Could not remove that page.");
}

export async function renameSitePage(id: string, name: string) {
  const res = await fetch(`/api/pages?id=${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(err?.error || "Could not rename that page.");
  }
  return (await res.json()) as { id: string; name: string; savedAt: number };
}

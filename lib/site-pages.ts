import type { Layer, Page } from "./types";

export type SitePageMeta = {
  id: string;
  name: string;
  savedAt: number;
  width: number;
  height: number;
};

export type SitePageRecord = SitePageMeta & {
  version: 1;
  page: Page;
  layers: Layer[];
};

export function slugifyPageName(name: string) {
  const s = name
    .replace(/\.(veillum|json)$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return s || "untitled";
}

export function displayPageName(name: string) {
  return name.replace(/\.(veillum|json)$/i, "").trim() || "Untitled";
}

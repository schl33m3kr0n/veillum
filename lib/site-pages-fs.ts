import { promises as fs } from "fs";
import path from "path";
import { nanoid } from "nanoid";
import type { Layer, Page } from "./types";
import {
  displayPageName,
  slugifyPageName,
  type SitePageMeta,
  type SitePageRecord,
} from "./site-pages";

const DIR = path.join(process.cwd(), "data", "pages");

async function ensureDir() {
  await fs.mkdir(DIR, { recursive: true });
}

function filePath(id: string) {
  if (!/^[a-z0-9-]{1,64}$/.test(id)) {
    throw new Error("Invalid page id.");
  }
  return path.join(DIR, `${id}.json`);
}

export async function listSitePages(): Promise<SitePageMeta[]> {
  await ensureDir();
  const names = await fs.readdir(DIR);
  const pages: SitePageMeta[] = [];
  for (const name of names) {
    if (!name.endsWith(".json")) continue;
    try {
      const raw = JSON.parse(await fs.readFile(path.join(DIR, name), "utf8")) as SitePageRecord;
      if (!raw?.id || !raw.page) continue;
      pages.push({
        id: raw.id,
        name: raw.name,
        savedAt: raw.savedAt,
        width: raw.page.width,
        height: raw.page.height,
      });
    } catch {
      /* skip bad files */
    }
  }
  pages.sort((a, b) => b.savedAt - a.savedAt);
  return pages;
}

export async function readSitePage(id: string): Promise<SitePageRecord | null> {
  try {
    const raw = JSON.parse(await fs.readFile(filePath(id), "utf8")) as SitePageRecord;
    if (!raw?.page || !Array.isArray(raw.layers)) return null;
    return raw;
  } catch {
    return null;
  }
}

export async function writeSitePage(input: {
  id?: string | null;
  name: string;
  page: Page;
  layers: Layer[];
}): Promise<SitePageRecord> {
  await ensureDir();
  const title = displayPageName(input.name);
  let id = input.id && /^[a-z0-9-]{1,64}$/.test(input.id) ? input.id : slugifyPageName(title);
  if (!input.id) {
    const existing = await readSitePage(id);
    if (existing) id = `${slugifyPageName(title)}-${nanoid(5).toLowerCase()}`;
  }
  const record: SitePageRecord = {
    version: 1,
    id,
    name: title,
    savedAt: Date.now(),
    width: input.page.width,
    height: input.page.height,
    page: input.page,
    layers: input.layers,
  };
  await fs.writeFile(filePath(id), JSON.stringify(record), "utf8");
  return record;
}

export async function renameSitePage(id: string, name: string): Promise<SitePageRecord | null> {
  const existing = await readSitePage(id);
  if (!existing) return null;
  const title = displayPageName(name);
  if (!title) return existing;
  const record: SitePageRecord = {
    ...existing,
    name: title,
    savedAt: Date.now(),
  };
  await fs.writeFile(filePath(id), JSON.stringify(record), "utf8");
  return record;
}

export async function deleteSitePage(id: string) {
  try {
    await fs.unlink(filePath(id));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }
}

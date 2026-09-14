import { createHmac, randomBytes } from "crypto";
import { svgToNodes, svgViewBox } from "./svg-import";
import type { SvgNode } from "./types";

export type IconHit = {
  id: string;
  name: string;
  source: "svgrepo" | "noun" | "open";
  viewBox: string;
  nodes: SvgNode[];
  attribution?: string;
};

const OPEN_PREFIX =
  /^(tabler|mdi|lucide|ph|solar|heroicons|heroicons-outline|heroicons-solid|bi|bx|iconoir|jam|carbon|teenyicons):/;

const FEATURED: { id: string; name: string }[] = [
  { id: "tabler:heart", name: "Heart" },
  { id: "tabler:leaf", name: "Leaf" },
  { id: "tabler:sun", name: "Sun" },
  { id: "tabler:moon", name: "Moon" },
  { id: "tabler:cloud", name: "Cloud" },
  { id: "tabler:mountain", name: "Peak" },
  { id: "tabler:tree", name: "Tree" },
  { id: "mdi:bird", name: "Bird" },
  { id: "tabler:fish", name: "Fish" },
  { id: "tabler:droplet", name: "Drop" },
  { id: "tabler:flower", name: "Flower" },
  { id: "tabler:sparkles", name: "Sparkle" },
  { id: "tabler:bolt", name: "Bolt" },
  { id: "tabler:check", name: "Check" },
  { id: "tabler:plus", name: "Plus" },
  { id: "tabler:home", name: "House" },
  { id: "tabler:flag", name: "Flag" },
  { id: "tabler:mail", name: "Envelope" },
  { id: "tabler:crown", name: "Crown" },
  { id: "tabler:map-pin", name: "Pin" },
  { id: "tabler:bell", name: "Bell" },
  { id: "tabler:book", name: "Book" },
  { id: "tabler:key", name: "Key" },
  { id: "tabler:shield", name: "Shield" },
  { id: "tabler:message-circle", name: "Chat" },
  { id: "tabler:user", name: "User" },
  { id: "tabler:gift", name: "Gift" },
  { id: "tabler:rocket", name: "Rocket" },
  { id: "tabler:star", name: "Star" },
  { id: "tabler:quote", name: "Quote" },
];

function titleCase(value: string) {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function hitFromSvg(
  id: string,
  name: string,
  source: IconHit["source"],
  raw: string,
  attribution?: string,
): IconHit | null {
  const nodes = svgToNodes(raw);
  if (nodes.length === 0) return null;
  return {
    id,
    name,
    source,
    viewBox: svgViewBox(raw),
    nodes,
    attribution,
  };
}

async function fetchIconifySvg(id: string): Promise<string | null> {
  const [prefix, ...rest] = id.split(":");
  const name = rest.join(":");
  if (!prefix || !name) return null;
  const res = await fetch(
    `https://api.iconify.design/${encodeURIComponent(prefix)}/${encodeURIComponent(name)}.svg`,
  );
  if (!res.ok) return null;
  const text = await res.text();
  if (!text.includes("<svg")) return null;
  return text;
}

async function searchIconify(term: string, limit = 32): Promise<IconHit[]> {
  const res = await fetch(
    `https://api.iconify.design/search?query=${encodeURIComponent(term)}&limit=${limit * 3}`,
  );
  if (!res.ok) return [];
  const data = (await res.json()) as { icons?: string[] };
  const ids = (data.icons ?? []).filter((id) => OPEN_PREFIX.test(id)).slice(0, limit);
  const hits = await Promise.all(
    ids.map(async (id) => {
      const raw = await fetchIconifySvg(id);
      if (!raw) return null;
      const name = titleCase(id.split(":")[1] ?? id);
      return hitFromSvg(id, name, "open", raw);
    }),
  );
  return hits.filter((h): h is IconHit => !!h);
}

function svgRepoParts(input: string) {
  const m = input
    .trim()
    .match(/svgrepo\.com\/(?:svg|download|show)\/(\d+)\/([A-Za-z0-9_-]+)/i);
  if (!m) return null;
  return { id: m[1]!, slug: m[2]!.replace(/\.svg$/i, "") };
}

async function fetchSvgRepo(input: string): Promise<IconHit | null> {
  const parts = svgRepoParts(input);
  if (!parts) return null;
  const urls = [
    `https://www.svgrepo.com/download/${parts.id}/${parts.slug}.svg`,
    `https://www.svgrepo.com/show/${parts.id}/${parts.slug}.svg`,
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { Accept: "image/svg+xml,text/plain,*/*" },
        redirect: "follow",
      });
      if (!res.ok) continue;
      const text = await res.text();
      if (!text.includes("<svg")) continue;
      return hitFromSvg(
        `svgrepo:${parts.id}`,
        titleCase(parts.slug),
        "svgrepo",
        text,
        "SVG Repo",
      );
    } catch {
      continue;
    }
  }
  return null;
}

function oauthHeader(
  method: string,
  url: string,
  params: Record<string, string>,
  key: string,
  secret: string,
) {
  const nonce = randomBytes(12).toString("hex");
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const oauth: Record<string, string> = {
    oauth_consumer_key: key,
    oauth_nonce: nonce,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: timestamp,
    oauth_version: "1.0",
  };
  const all = { ...params, ...oauth };
  const base = Object.keys(all)
    .sort()
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(all[k]!)}`)
    .join("&");
  const sigBase = [method.toUpperCase(), encodeURIComponent(url), encodeURIComponent(base)].join(
    "&",
  );
  const sig = createHmac("sha1", `${encodeURIComponent(secret)}&`)
    .update(sigBase)
    .digest("base64");
  const header = Object.entries({ ...oauth, oauth_signature: sig })
    .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`)
    .join(", ");
  return `OAuth ${header}`;
}

async function searchNoun(term: string, limit = 24): Promise<IconHit[]> {
  const key = process.env.NOUN_PROJECT_KEY;
  const secret = process.env.NOUN_PROJECT_SECRET;
  if (!key || !secret) return [];
  const url = "https://api.thenounproject.com/v2/icon";
  const params = {
    query: term,
    limit: String(limit),
    include_svg: "1",
    limit_to_public_domain: "1",
    thumbnail_size: "84",
  };
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${url}?${qs}`, {
    headers: { Authorization: oauthHeader("GET", url, params, key, secret) },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as {
    icons?: {
      id?: number;
      term?: string;
      attribution?: string;
      icon_url?: string;
      svg?: { raw?: string };
    }[];
  };
  const hits: IconHit[] = [];
  for (const icon of data.icons ?? []) {
    let raw = icon.svg?.raw ?? "";
    if (!raw && icon.icon_url) {
      const file = await fetch(icon.icon_url);
      if (file.ok) raw = await file.text();
    }
    if (!raw) continue;
    const hit = hitFromSvg(
      `noun:${icon.id ?? icon.term}`,
      icon.term || "Icon",
      "noun",
      raw,
      icon.attribution,
    );
    if (hit) hits.push(hit);
  }
  return hits;
}

export async function searchIcons(
  term: string,
): Promise<{ source: string; icons: IconHit[]; note: string }> {
  const q = term.trim();
  if (!q) {
    const featured = await Promise.all(
      FEATURED.map(async (item) => {
        const raw = await fetchIconifySvg(item.id);
        if (!raw) return null;
        return hitFromSvg(item.id, item.name, "open", raw);
      }),
    );
    return {
      source: "open",
      icons: featured.filter((h): h is IconHit => !!h),
      note: iconNote(),
    };
  }

  const fromRepo = await fetchSvgRepo(q);
  if (fromRepo) {
    return {
      source: "svgrepo",
      icons: [fromRepo],
      note: "Downloaded from SVG Repo.",
    };
  }

  const slug = svgRepoParts(q)?.slug.replace(/-/g, " ");
  const noun = await searchNoun(slug || q);
  if (noun.length) {
    return {
      source: "noun",
      icons: noun,
      note: "Public-domain icons from The Noun Project.",
    };
  }

  const open = await searchIconify(slug || q);
  return {
    source: "open",
    icons: open,
    note: svgRepoParts(q)
      ? "SVG Repo blocked the automated download. These are matching open-license SVGs, or drop the .svg you saved from their site."
      : iconNote(),
  };
}

function iconNote(): string {
  return "Open-license SVG icons (Tabler, MDI, Lucide, Solar, Phosphor — the same kind of packs SVG Repo hosts). SVG Repo’s site blocks automated downloads; paste an SVG Repo URL to try, or drop a saved .svg onto the page.";
}

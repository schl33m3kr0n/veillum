import { deleteSitePage, listSitePages, writeSitePage } from "@/lib/site-pages-fs";
import type { Layer, Page } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const pages = await listSitePages();
  return Response.json({ pages });
}

export async function POST(request: Request) {
  let body: {
    id?: string | null;
    name?: string;
    page?: Page;
    layers?: Layer[];
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }
  if (!body.page || !Array.isArray(body.layers)) {
    return Response.json({ error: "Missing page." }, { status: 400 });
  }
  const record = await writeSitePage({
    id: body.id,
    name: body.name || "Untitled",
    page: body.page,
    layers: body.layers,
  });
  return Response.json({
    id: record.id,
    name: record.name,
    savedAt: record.savedAt,
  });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return Response.json({ error: "Missing id." }, { status: 400 });
  await deleteSitePage(id);
  return Response.json({ ok: true });
}

import { readSitePage } from "@/lib/site-pages-fs";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const record = await readSitePage(id);
  if (!record) {
    return Response.json({ error: "Page not found." }, { status: 404 });
  }
  return Response.json(record);
}

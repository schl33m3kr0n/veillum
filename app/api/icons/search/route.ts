import { searchIcons } from "@/lib/icon-search";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  try {
    const result = await searchIcons(q);
    return Response.json(result);
  } catch (err) {
    console.error(err);
    return Response.json(
      { source: "open", icons: [], note: "Could not load the icon library." },
      { status: 502 },
    );
  }
}

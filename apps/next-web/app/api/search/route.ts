import { NextRequest, NextResponse } from "next/server";
import { searchMeili } from "@/lib/search-client";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ results: [] });
  }

  const results = await searchMeili(q);
  return NextResponse.json({
    query: q,
    source: results.length > 0 && "score" in results[0] ? "meilisearch" : "local",
    results,
  });
}

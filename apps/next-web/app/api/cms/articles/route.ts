import { NextResponse } from "next/server";
import {
  assertSameOrigin,
  clientIpFromRequest,
  frappeRequest,
  jsonFromFrappe,
  requireCmsSession,
  routeError,
  sanitizeArticle,
} from "@/lib/server/frappe-cms";
import { assertArticlePolicy, loadCmsProfile } from "@/lib/server/cms-policy";

const ARTICLE_FIELDS = [
  "name",
  "title",
  "slug",
  "excerpt",
  "status",
  "content_type",
  "publication",
  "language",
  "featured_image",
  "published_at",
  "modified",
];

export async function GET(request: Request) {
  try {
    const sessionId = await requireCmsSession();
    const search = new URL(request.url).searchParams.get("search")?.trim();
    const params = new URLSearchParams({
      fields: JSON.stringify(ARTICLE_FIELDS),
      order_by: "modified desc",
      limit_page_length: "100",
    });
    if (search) params.set("filters", JSON.stringify([["title", "like", `%${search}%`]]));

    const upstream = await frappeRequest(
      `/api/resource/Content%20Article?${params}`,
      {},
      sessionId,
      clientIpFromRequest(request)
    );
    const payload = await jsonFromFrappe(upstream);
    return NextResponse.json({ articles: payload.data || [] });
  } catch (error) {
    return routeError(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const sessionId = await requireCmsSession();
    const clientIp = clientIpFromRequest(request);
    const article = sanitizeArticle(await request.json()) as Record<string, unknown>;

    const profile = await loadCmsProfile(sessionId, clientIp);
    if (!profile.capabilities.create) {
      throw new Response("Your role cannot create articles.", { status: 403 });
    }
    assertArticlePolicy(profile, article, null);

    const upstream = await frappeRequest(
      "/api/resource/Content%20Article",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(article),
      },
      sessionId,
      clientIp
    );
    const payload = await jsonFromFrappe(upstream);
    return NextResponse.json({ article: payload.data }, { status: 201 });
  } catch (error) {
    return routeError(error);
  }
}

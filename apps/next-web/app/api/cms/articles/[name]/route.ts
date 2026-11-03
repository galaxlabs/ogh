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

type ArticleRouteContext = { params: Promise<{ name: string }> };

function articlePath(name: string) {
  return `/api/resource/Content%20Article/${encodeURIComponent(name)}`;
}

export async function GET(request: Request, context: ArticleRouteContext) {
  try {
    const sessionId = await requireCmsSession();
    const { name } = await context.params;
    const upstream = await frappeRequest(
      articlePath(name),
      {},
      sessionId,
      clientIpFromRequest(request)
    );
    const payload = await jsonFromFrappe(upstream);
    return NextResponse.json({ article: payload.data });
  } catch (error) {
    return routeError(error);
  }
}

export async function PUT(request: Request, context: ArticleRouteContext) {
  try {
    assertSameOrigin(request);
    const sessionId = await requireCmsSession();
    const clientIp = clientIpFromRequest(request);
    const { name } = await context.params;
    const article = sanitizeArticle(await request.json()) as Record<string, unknown>;

    const profile = await loadCmsProfile(sessionId, clientIp);
    if (!profile.capabilities.write) {
      throw new Response("Your role cannot edit articles.", { status: 403 });
    }

    const currentResponse = await frappeRequest(
      articlePath(name),
      {},
      sessionId,
      clientIp
    );
    const current = await jsonFromFrappe(currentResponse);
    const currentDoc = (current.data || {}) as Record<string, unknown>;
    assertArticlePolicy(profile, article, currentDoc);

    const upstream = await frappeRequest(
      articlePath(name),
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(article),
      },
      sessionId,
      clientIp
    );
    const payload = await jsonFromFrappe(upstream);
    return NextResponse.json({ article: payload.data });
  } catch (error) {
    return routeError(error);
  }
}

export async function DELETE(request: Request, context: ArticleRouteContext) {
  try {
    assertSameOrigin(request);
    const sessionId = await requireCmsSession();
    const clientIp = clientIpFromRequest(request);
    const { name } = await context.params;

    const profile = await loadCmsProfile(sessionId, clientIp);
    if (!profile.capabilities.delete) {
      throw new Response("Your role cannot delete articles.", { status: 403 });
    }

    const upstream = await frappeRequest(
      articlePath(name),
      { method: "DELETE" },
      sessionId,
      clientIp
    );
    await jsonFromFrappe(upstream);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return routeError(error);
  }
}

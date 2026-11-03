import { NextResponse } from "next/server";
import {
  assertSameOrigin,
  clientIpFromRequest,
  frappeRequest,
  jsonFromFrappe,
  requireCmsSession,
  routeError,
} from "@/lib/server/frappe-cms";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const sessionId = await requireCmsSession();
    const body = (await request.json()) as Record<string, unknown>;

    const params = new URLSearchParams({
      count: String(body.count ?? 6),
    });
    if (body.category) params.set("category", String(body.category));
    if (body.brand) params.set("brand", String(body.brand));
    if (body.language) params.set("language", String(body.language));

    const upstream = await frappeRequest(
      `/api/method/gop.content_intel.agents.api.suggest_content_topics?${params.toString()}`,
      {},
      sessionId,
      clientIpFromRequest(request)
    );
    const payload = await jsonFromFrappe(upstream);
    return NextResponse.json((payload.message as Record<string, unknown>) || payload);
  } catch (error) {
    return routeError(error);
  }
}

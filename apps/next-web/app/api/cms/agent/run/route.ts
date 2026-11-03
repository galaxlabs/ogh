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

    const topic = String(body.topic || "").trim();
    if (!topic) {
      throw new Response("A topic is required.", { status: 400 });
    }

    const params = new URLSearchParams({
      topic,
      publish: body.publish ? "1" : "0",
      dry_run: body.publish ? "0" : "1",
    });
    if (body.brand) params.set("brand", String(body.brand));
    if (body.category) params.set("category", String(body.category));
    if (body.language) params.set("language", String(body.language));
    if (body.contentType) params.set("content_type", String(body.contentType));
    if (body.preferProvider) params.set("prefer_provider", String(body.preferProvider));

    const upstream = await frappeRequest(
      `/api/method/gop.content_intel.agents.api.run_content_agent?${params.toString()}`,
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

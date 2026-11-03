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
      message: String(body.message ?? ""),
      brand: String(body.brand ?? "editorial"),
      language: String(body.language ?? "English"),
      count: String(body.count ?? 3),
      publish: body.publish ? "1" : "0",
      interval_hours: String(body.intervalHours ?? 0),
    });
    if (body.seedUrl) params.set("seed_url", String(body.seedUrl));
    if (body.seedText) params.set("seed_text", String(body.seedText));
    if (body.session) params.set("session", String(body.session));

    const upstream = await frappeRequest(
      `/api/method/gop.content_intel.agents.api.agent_chat?${params.toString()}`,
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

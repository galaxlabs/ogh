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
    const items = Array.isArray(body.items) ? body.items : [];

    if (!items.length) {
      throw new Response("A blast needs at least one topic.", { status: 400 });
    }

    const params = new URLSearchParams({
      items: JSON.stringify(items),
      publish: body.publish ? "1" : "0",
      dry_run: body.publish ? "0" : "1",
      interval_hours: String(body.intervalHours ?? 0),
    });
    if (body.brand) params.set("brand", String(body.brand));
    if (body.language) params.set("language", String(body.language));
    if (body.publication) params.set("publication", String(body.publication));

    const upstream = await frappeRequest(
      `/api/method/gop.content_intel.agents.api.blast_publish?${params.toString()}`,
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

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

    const action = String(body.action || "scan");

    // the payloads go in the body, the query string is too small for a plan
    const form = new URLSearchParams();
    if (action === "write") {
      form.set("picks", JSON.stringify(body.picks || []));
      form.set("publish", body.publish ? "1" : "0");
      form.set("interval_hours", String(body.intervalHours ?? 0));
      form.set("language", String(body.language ?? "English"));
      if (body.brand) form.set("brand", String(body.brand));
      if (body.category) form.set("category", String(body.category));
    } else {
      form.set("queries", JSON.stringify(body.queries || []));
      form.set("limit", String(body.limit ?? 20));
      form.set("language", String(body.language ?? "English"));
      form.set("enrich", body.enrich === false ? "0" : "1");
      if (body.brand) form.set("brand", String(body.brand));
      const sources = Array.isArray(body.sources) ? (body.sources as string[]) : [];
      if (sources.length) form.set("sources", JSON.stringify(sources));
    }

    const method = action === "write" ? "agent_demand_write" : "agent_demand_scan";
    const upstream = await frappeRequest(
      `/api/method/gop.content_intel.agents.api.${method}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form.toString(),
      },
      sessionId,
      clientIpFromRequest(request)
    );
    const payload = await jsonFromFrappe(upstream);
    return NextResponse.json((payload.message as Record<string, unknown>) || payload);
  } catch (error) {
    return routeError(error);
  }
}

import { NextResponse } from "next/server";
import { aiStatus } from "@/lib/server/ai-provider";
import {
  clientIpFromRequest,
  frappeRequest,
  jsonFromFrappe,
  requireCmsSession,
  routeError,
} from "@/lib/server/frappe-cms";

export async function GET(request: Request) {
  try {
    const sessionId = await requireCmsSession();
    const upstream = await frappeRequest(
      "/api/method/gop.content_intel.agents.api.content_agent_status",
      {},
      sessionId,
      clientIpFromRequest(request)
    );
    const payload = await jsonFromFrappe(upstream);
    const message = (payload.message as Record<string, unknown>) || payload;
    return NextResponse.json({
      ok: true,
      providers: message.providers || {},
      provider_sources: message.provider_sources || {},
      workerProviders: aiStatus(),
      voices: message.voices || [],
      categories: message.categories || [],
      agent: message.agent || null,
    });
  } catch (error) {
    return routeError(error);
  }
}

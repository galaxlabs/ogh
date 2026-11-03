import { NextResponse } from "next/server";
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
      "/api/method/gop.api.cms_site_stats",
      {},
      sessionId,
      clientIpFromRequest(request)
    );
    const payload = await jsonFromFrappe(upstream);
    return NextResponse.json(payload.message || {});
  } catch (error) {
    return routeError(error);
  }
}

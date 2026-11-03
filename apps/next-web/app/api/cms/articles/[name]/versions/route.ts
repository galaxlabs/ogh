import { NextResponse } from "next/server";
import {
  clientIpFromRequest,
  frappeRequest,
  jsonFromFrappe,
  requireCmsSession,
  routeError,
} from "@/lib/server/frappe-cms";

type VersionRouteContext = { params: Promise<{ name: string }> };

export async function GET(request: Request, context: VersionRouteContext) {
  try {
    const sessionId = await requireCmsSession();
    const { name } = await context.params;
    const upstream = await frappeRequest(
      `/api/method/gop.api.cms_article_versions?article=${encodeURIComponent(name)}`,
      {},
      sessionId,
      clientIpFromRequest(request)
    );
    const payload = await jsonFromFrappe(upstream);
    return NextResponse.json(payload.message || { versions: [] });
  } catch (error) {
    return routeError(error);
  }
}

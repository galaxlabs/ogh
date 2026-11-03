import { NextResponse } from "next/server";
import { clientIpFromRequest, requireCmsSession, routeError } from "@/lib/server/frappe-cms";
import { loadCmsProfile } from "@/lib/server/cms-policy";

export async function GET(request: Request) {
  try {
    const sessionId = await requireCmsSession();
    const profile = await loadCmsProfile(sessionId, clientIpFromRequest(request));
    return NextResponse.json(profile);
  } catch (error) {
    return routeError(error);
  }
}

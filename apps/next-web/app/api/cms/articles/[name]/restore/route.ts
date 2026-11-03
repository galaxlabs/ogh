import { NextResponse } from "next/server";
import {
  assertSameOrigin,
  clientIpFromRequest,
  frappeRequest,
  jsonFromFrappe,
  requireCmsSession,
  routeError,
} from "@/lib/server/frappe-cms";

type RestoreRouteContext = { params: Promise<{ name: string }> };

export async function POST(request: Request, context: RestoreRouteContext) {
  try {
    assertSameOrigin(request);
    const sessionId = await requireCmsSession();
    const { name } = await context.params;
    const { version } = (await request.json()) as { version?: string };

    if (!version) {
      return NextResponse.json({ message: "A revision is required." }, { status: 400 });
    }

    const upstream = await frappeRequest(
      "/api/method/gop.api.cms_restore_version",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ article: name, version }),
      },
      sessionId,
      clientIpFromRequest(request)
    );
    const payload = await jsonFromFrappe(upstream);
    return NextResponse.json(payload.message || { ok: true });
  } catch (error) {
    return routeError(error);
  }
}

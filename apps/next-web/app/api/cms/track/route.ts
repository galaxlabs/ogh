import { NextResponse } from "next/server";
import {
  assertSameOrigin,
  clientIpFromRequest,
  frappeRequest,
  jsonFromFrappe,
  routeError,
} from "@/lib/server/frappe-cms";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const body = (await request.json().catch(() => ({}))) as { slug?: string };
    const slug = String(body.slug || "").trim();
    if (!/^[a-z0-9-]{3,120}$/i.test(slug)) {
      return NextResponse.json({ ok: true });
    }

    const upstream = await frappeRequest(
      "/api/method/gop.api.cms_record_article_view",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      },
      null,
      clientIpFromRequest(request)
    );
    await jsonFromFrappe(upstream);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return routeError(error);
  }
}

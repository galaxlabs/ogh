import { NextResponse } from "next/server";
import {
  assertSameOrigin,
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
      "/api/method/gop.api.cms_media_list",
      {},
      sessionId,
      clientIpFromRequest(request)
    );
    const payload = await jsonFromFrappe(upstream);
    return NextResponse.json(payload.message || { files: [] });
  } catch (error) {
    return routeError(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const sessionId = await requireCmsSession();
    const body = (await request.json()) as {
      fileName?: string;
      content?: string;
      article?: string;
    };

    if (!body.fileName?.trim() || !body.content) {
      return NextResponse.json(
        { message: "A file name and file content are required." },
        { status: 400 }
      );
    }

    const upstream = await frappeRequest(
      "/api/method/gop.api.cms_media_upload",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_name: body.fileName.trim(),
          content: body.content,
          article: body.article || "",
        }),
      },
      sessionId,
      clientIpFromRequest(request)
    );
    const payload = await jsonFromFrappe(upstream);
    return NextResponse.json(payload.message || {}, { status: 201 });
  } catch (error) {
    return routeError(error);
  }
}

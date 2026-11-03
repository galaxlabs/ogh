import { NextResponse } from "next/server";
import {
  clientIpFromRequest,
  frappeRequest,
  jsonFromFrappe,
  requireCmsSession,
  routeError,
} from "@/lib/server/frappe-cms";

async function listOptions(
  sessionId: string,
  doctype: string,
  fields: string[],
  orderBy: string,
  clientIp?: string | null
) {
  const params = new URLSearchParams({
    fields: JSON.stringify(fields),
    order_by: orderBy,
    limit_page_length: "200",
  });

  try {
    const response = await frappeRequest(
      `/api/resource/${encodeURIComponent(doctype)}?${params}`,
      {},
      sessionId,
      clientIp
    );
    const payload = await jsonFromFrappe(response);
    return payload.data || [];
  } catch (error) {
    // A role may read articles without reading every supporting doctype.
    if (error instanceof Response && error.status === 403) return [];
    throw error;
  }
}

export async function GET(request: Request) {
  try {
    const sessionId = await requireCmsSession();
    const clientIp = clientIpFromRequest(request);
    const [publications, languages] = await Promise.all([
      listOptions(
        sessionId,
        "Publication",
        ["name", "publication_name", "code"],
        "publication_name asc",
        clientIp
      ),
      listOptions(
        sessionId,
        "Publication Language",
        ["name"],
        "name asc",
        clientIp
      ),
    ]);
    return NextResponse.json({ publications, languages });
  } catch (error) {
    return routeError(error);
  }
}

import { NextResponse } from "next/server";
import { clientIpFromRequest, frappeRequest, jsonFromFrappe, routeError } from "@/lib/server/frappe-cms";

export async function GET(request: Request) {
  try {
    const upstream = await frappeRequest(
      "/api/method/gop.api.list_content_categories",
      {},
      null,
      clientIpFromRequest(request)
    );
    const payload = await jsonFromFrappe(upstream);
    return NextResponse.json(payload.message || { categories: [] });
  } catch (error) {
    return routeError(error);
  }
}

import { NextRequest, NextResponse } from "next/server";

// Publication subdomains resolved by GalaxyOps. The middleware passes the host
// to the app via a request header; publication-specific data is resolved by
// pages (optionally from the GalaxyOps API) when configured.
export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const host = request.headers.get("host") || "";
  const hostname = host.split(":")[0].toLowerCase();

  // Skip internal paths.
  if (url.pathname.startsWith("/_next") || url.pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  response.headers.set("x-ogh-host", hostname);

  const isPublicationSubdomain =
    hostname.endsWith(".openguidehub.org") && hostname !== "www.openguidehub.org";

  if (isPublicationSubdomain) {
    const sub = hostname.replace(/\.openguidehub\.org$/, "");
    response.headers.set("x-ogh-publication", sub);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)"],
};

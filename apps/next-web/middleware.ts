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

  // Baseline security headers for every page response.
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'self'",
      "form-action 'self'",
      "img-src 'self' data: blob: https: https://www.cloudflareinsights.com",
      "font-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com",
      "connect-src 'self' https: https://cloudflareinsights.com",
    ].join("; ")
  );

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

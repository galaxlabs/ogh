import { cookies } from "next/headers";

export const CMS_SESSION_COOKIE = "ogh_cms_sid";

const EDITABLE_ARTICLE_FIELDS = new Set([
  "title",
  "slug",
  "excerpt",
  "body",
  "status",
  "content_type",
  "publication",
  "language",
  "niche",
  "story_cluster",
  "primary_keyword",
  "seo_title",
  "meta_description",
  "canonical_url",
  "featured_image",
  "noindex",
  "value_type",
  "human_reviewed",
  "notes",
  "category",
  "published_at",
]);

const FALLBACK_FRAPPE_URL = "https://pf.digigalaxy.cloud";

const CLIENT_IP_TOKEN_HEADER = "x-ogh-token";
const CLIENT_IP_VALUE_HEADER = "x-ogh-client-ip";

function frappeBaseUrl() {
  return (process.env.FRAPPE_API_URL || process.env.NEXT_PUBLIC_ADMIN_API_URL || FALLBACK_FRAPPE_URL)
    .trim()
    .replace(/\/+$/, "");
}

function clientIpSecret() {
  // bracket access keeps the secret a runtime lookup instead of a build-time inlining
  const value = process.env["OGH_CMS_CLIENT_IP_SECRET"];
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

export function clientIpFromRequest(request: Request) {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    null
  );
}

function clientIpHeaders(clientIp?: string | null) {
  const secret = clientIpSecret();
  if (!secret || !clientIp) return {};
  return {
    [CLIENT_IP_TOKEN_HEADER]: secret,
    [CLIENT_IP_VALUE_HEADER]: clientIp,
  };
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    throw new Response("Cross-origin request rejected.", { status: 403 });
  }
}

export async function getCmsSessionId() {
  return (await cookies()).get(CMS_SESSION_COOKIE)?.value || null;
}

export function sessionCookieOptions(maxAge = 60 * 60 * 12) {
  return {
    httpOnly: true,
    sameSite: "strict" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/api/cms",
    maxAge,
  };
}

export async function frappeRequest(
  path: string,
  init: RequestInit = {},
  sessionId?: string | null,
  clientIp?: string | null
) {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (sessionId) headers.set("Cookie", `sid=${sessionId}`);
  for (const [key, value] of Object.entries(clientIpHeaders(clientIp))) {
    headers.set(key, value);
  }

  return fetch(`${frappeBaseUrl()}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
}

export async function requireCmsSession() {
  const sessionId = await getCmsSessionId();
  if (!sessionId) throw new Response("Authentication required.", { status: 401 });
  return sessionId;
}

export function sanitizeArticle(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Response("Invalid article payload.", { status: 400 });
  }

  return Object.fromEntries(
    Object.entries(input).filter(([key]) => EDITABLE_ARTICLE_FIELDS.has(key))
  );
}

export async function jsonFromFrappe(response: Response) {
  let payload: Record<string, unknown> = {};
  try {
    payload = (await response.json()) as Record<string, unknown>;
  } catch {
    // Frappe can return an HTML error page during an upstream failure.
  }

  if (!response.ok) {
    const message = extractFrappeMessage(payload) || "Frappe rejected the request.";
    const status =
      response.status === 403
        ? 403
        : response.status === 401
          ? 401
          : response.status >= 500
            ? 502
            : 400;

    // Frappe dropped the session (cache cleared, session expired, user signed
    // out elsewhere). Clear the stale cookie so the studio shows the sign in
    // form instead of failing every request.
    if (payload.session_expired === 1 || payload.session_expired === "1") {
      const response = new Response("Your session expired. Please sign in again.", { status: 401 });
      response.headers.append(
        "Set-Cookie",
        `${CMS_SESSION_COOKIE}=; Path=/api/cms; Max-Age=0; HttpOnly; SameSite=Strict; Secure`
      );
      throw response;
    }

    throw new Response(message, { status });
  }

  return payload;
}

function extractFrappeMessage(payload: Record<string, unknown>) {
  const direct = payload.message;
  if (typeof direct === "string") return direct;

  const serverMessages = payload._server_messages;
  if (typeof serverMessages === "string") {
    try {
      const messages = JSON.parse(serverMessages) as string[];
      const parsed = JSON.parse(messages[0] || "{}") as { message?: string };
      if (parsed.message) return parsed.message;
    } catch {
      // Fall through to the generic exception text.
    }
  }

  return typeof payload.exception === "string" ? payload.exception : null;
}

export function routeError(error: unknown) {
  if (error instanceof Response) return error;
  console.error("CMS route failed", error);
  return Response.json({ message: "The CMS service is temporarily unavailable." }, { status: 500 });
}

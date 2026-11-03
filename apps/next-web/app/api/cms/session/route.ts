import { NextResponse } from "next/server";
import {
  assertSameOrigin,
  clientIpFromRequest,
  CMS_SESSION_COOKIE,
  frappeRequest,
  getCmsSessionId,
  jsonFromFrappe,
  routeError,
  sessionCookieOptions,
} from "@/lib/server/frappe-cms";

async function currentUser(sessionId: string, clientIp?: string | null) {
  const response = await frappeRequest(
    "/api/method/frappe.auth.get_logged_user",
    {},
    sessionId,
    clientIp
  );
  const payload = await jsonFromFrappe(response);
  return String(payload.message || "");
}

export async function GET(request: Request) {
  const sessionId = await getCmsSessionId();
  if (!sessionId) return NextResponse.json({ authenticated: false });

  try {
    const user = await currentUser(sessionId, clientIpFromRequest(request));
    return NextResponse.json({ authenticated: true, user });
  } catch {
    const response = NextResponse.json({ authenticated: false });
    response.cookies.set(CMS_SESSION_COOKIE, "", sessionCookieOptions(0));
    return response;
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const { username, password } = (await request.json()) as {
      username?: string;
      password?: string;
    };
    if (!username?.trim() || !password) {
      return NextResponse.json({ message: "Email and password are required." }, { status: 400 });
    }

    const clientIp = clientIpFromRequest(request);
    const body = new URLSearchParams({ usr: username.trim(), pwd: password });
    const loginResponse = await frappeRequest(
      "/api/method/login",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      },
      null,
      clientIp
    );
    await jsonFromFrappe(loginResponse);

    const setCookie = loginResponse.headers.get("set-cookie") || "";
    const sessionId = setCookie.match(/(?:^|[,;]\s*)sid=([^;,"]+)/i)?.[1];
    if (!sessionId || sessionId === "Guest") {
      return NextResponse.json({ message: "Frappe did not create an authenticated session." }, { status: 502 });
    }

    const user = await currentUser(sessionId, clientIp);
    const response = NextResponse.json({ authenticated: true, user });
    response.cookies.set(CMS_SESSION_COOKIE, sessionId, sessionCookieOptions());
    return response;
  } catch (error) {
    return routeError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    const sessionId = await getCmsSessionId();
    if (sessionId) {
      await frappeRequest(
        "/api/method/logout",
        { method: "POST" },
        sessionId,
        clientIpFromRequest(request)
      );
    }
    const response = NextResponse.json({ authenticated: false });
    response.cookies.set(CMS_SESSION_COOKIE, "", sessionCookieOptions(0));
    return response;
  } catch (error) {
    return routeError(error);
  }
}

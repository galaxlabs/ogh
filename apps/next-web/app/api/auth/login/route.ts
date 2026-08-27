import { NextResponse } from "next/server";
import { isAdminConfigured, signToken, validateCredentials } from "@/lib/server/admin-auth";

export async function POST(request: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Admin authentication is not configured. Set ADMIN_EMAIL, ADMIN_PASSWORD, and AUTH_SECRET on the server.",
      },
      { status: 503 }
    );
  }

  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ ok: false, message: "Email and password are required." }, { status: 400 });
    }

    if (!validateCredentials(String(email), String(password))) {
      return NextResponse.json({ ok: false, message: "Invalid credentials." }, { status: 401 });
    }

    const token = signToken(String(email));

    const response = NextResponse.json({ ok: true, email, token });
    response.cookies.set("ogh_admin_session", token, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    return response;
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON body." }, { status: 400 });
  }
}

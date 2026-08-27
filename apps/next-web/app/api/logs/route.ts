import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/server/admin-auth";

export async function GET(request: Request) {
  const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  const session = verifyToken(token || "");

  if (!session) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  return NextResponse.json({ ok: true, email: session.email });
}

export async function POST(request: Request) {
  const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  const session = verifyToken(token || "");

  if (!session) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  try {
    await request.json();
    return NextResponse.json({ ok: true, message: "Log received." });
  } catch {
    return NextResponse.json({ ok: true, message: "Log received." });
  }
}

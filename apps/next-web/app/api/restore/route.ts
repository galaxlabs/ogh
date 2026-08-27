import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/server/admin-auth";

export async function POST(request: Request) {
  const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  const session = verifyToken(token || "");

  if (!session) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  try {
    const payload = await request.json();
    if (!Array.isArray(payload?.posts) || !Array.isArray(payload?.downloads)) {
      return NextResponse.json({ ok: false, message: "Invalid backup payload." }, { status: 400 });
    }
    return NextResponse.json({ ok: true, message: "Backup restore acknowledged." });
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON body." }, { status: 400 });
  }
}

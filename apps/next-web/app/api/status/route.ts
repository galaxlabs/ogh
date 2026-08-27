import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/server/admin-auth";
import { aiStatus } from "@/lib/server/ai-provider";

export async function GET(request: Request) {
  const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  const session = verifyToken(token || "");

  if (!session) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const now = new Date().toISOString();
  return NextResponse.json({
    ok: true,
    timestamp: now,
    services: [
      { name: "Frontend UI", status: "running", details: "Next.js" },
      {
        name: "Admin API",
        status: "running",
        details: process.env.NEXT_PUBLIC_SITE_URL || "https://openguidehub.org",
      },
      { name: "AI service", status: aiStatus().configured ? "running" : "standby", details: aiStatus().model },
      {
        name: "Database",
        status: "ready",
        details: `${process.env.NEXT_PUBLIC_DATABASE_PROVIDER || "postgresql"} | server-managed connection`,
      },
    ],
    databases: [
      {
        provider: process.env.NEXT_PUBLIC_DATABASE_PROVIDER || "postgresql",
        enabled: true,
        url: "server-managed",
      },
    ],
  });
}

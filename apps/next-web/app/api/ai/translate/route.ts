import { NextResponse } from "next/server";
import { translateArticle } from "@/lib/server/ai-provider";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    return await translateArticle(payload);
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON body." }, { status: 400 });
  }
}

import { NextResponse } from "next/server";
import { explainArticle } from "@/lib/server/ai-provider";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    return await explainArticle(payload);
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON body." }, { status: 400 });
  }
}

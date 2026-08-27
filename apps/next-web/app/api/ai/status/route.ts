import { NextResponse } from "next/server";
import { aiStatus } from "@/lib/server/ai-provider";

export async function GET() {
  return NextResponse.json(aiStatus());
}

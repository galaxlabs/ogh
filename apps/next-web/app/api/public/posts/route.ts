import { NextResponse } from "next/server";
import { articles } from "@/lib/data";

export async function GET() {
  return NextResponse.json(articles);
}

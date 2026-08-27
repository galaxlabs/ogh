import { NextResponse, type NextRequest } from "next/server";
import { articles } from "@/lib/data";

export async function GET(_request: NextRequest, ctx: RouteContext<"/api/public/posts/[slug]">) {
  const { slug } = await ctx.params;
  const article = articles.find((a) => a.slug === slug);

  if (!article) {
    return NextResponse.json({ ok: false, message: "Article not found." }, { status: 404 });
  }

  return NextResponse.json(article);
}

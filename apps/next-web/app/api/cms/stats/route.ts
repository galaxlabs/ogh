import { NextResponse } from "next/server";
import {
  clientIpFromRequest,
  frappeRequest,
  jsonFromFrappe,
  requireCmsSession,
  routeError,
} from "@/lib/server/frappe-cms";
import { analyzeArticle } from "@/lib/cms/article-template";

const LIST_FIELDS = [
  "name",
  "title",
  "slug",
  "status",
  "excerpt",
  "published_at",
  "modified",
  "publication",
  "content_type",
];

const MAX_DETAIL = 30;

export async function GET(request: Request) {
  try {
    const sessionId = await requireCmsSession();
    const clientIp = clientIpFromRequest(request);

    const listParams = new URLSearchParams({
      fields: JSON.stringify(LIST_FIELDS),
      order_by: "modified desc",
      limit_page_length: "60",
    });
    const listResponse = await frappeRequest(
      `/api/resource/Content%20Article?${listParams}`,
      {},
      sessionId,
      clientIp
    );
    const list = await jsonFromFrappe(listResponse);
    const articles = (list.data || []) as Record<string, string>[];

    const detailed = await Promise.all(
      articles.slice(0, MAX_DETAIL).map(async (item) => {
        try {
          const response = await frappeRequest(
            `/api/resource/Content%20Article/${encodeURIComponent(item.name)}`,
            {},
            sessionId,
            clientIp
          );
          const payload = await jsonFromFrappe(response);
          return (payload.data || {}) as Record<string, unknown>;
        } catch {
          return {} as Record<string, unknown>;
        }
      })
    );

    const viewsResponse = await frappeRequest(
      "/api/method/gop.api.cms_article_views",
      {},
      sessionId,
      clientIp
    );
    const viewsPayload = await jsonFromFrappe(viewsResponse);
    const views = ((viewsPayload.message || {}) as { totals?: Record<string, number> })
      .totals || {};

    const rows = articles.map((item, index) => {
      const detail = detailed[index] || {};
      const analysis = analyzeArticle({
        title: (detail.title as string) || item.title,
        body: (detail.body as string) || "",
        excerpt: (detail.excerpt as string) || item.excerpt,
        seo_title: detail.seo_title as string,
        meta_description: detail.meta_description as string,
        canonical_url: detail.canonical_url as string,
        featured_image: detail.featured_image as string,
        status: item.status,
        primary_keyword: detail.primary_keyword as string,
        human_reviewed: detail.human_reviewed as number,
      });

      return {
        name: item.name,
        title: item.title,
        slug: item.slug,
        status: item.status,
        excerpt: item.excerpt,
        publication: item.publication,
        content_type: item.content_type,
        published_at: item.published_at,
        modified: item.modified,
        views: views[item.slug] || 0,
        words: analysis.wordCount,
        readingMinutes: analysis.readingMinutes,
        score: analysis.score,
        faqCount: analysis.faq.length,
      };
    });

    return NextResponse.json({ articles: rows });
  } catch (error) {
    return routeError(error);
  }
}

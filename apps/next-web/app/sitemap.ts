import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { fetchPublishedArticles } from "@/lib/galaxy-ops-api";
import { publishedArticleToArticle } from "@/lib/cms";
import { isSitemapIndexable } from "@/lib/sitemap-indexability";

// Generate from current CMS data rather than freezing the list at build time.
export const dynamic = "force-dynamic";

const STATIC_ROUTES = [
  "",
  "/articles",
  "/categories",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/disclaimer",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries = STATIC_ROUTES.map((route) => ({
    url: `${SITE.url}${route}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : 0.7,
  }));

  // Only published CMS articles; static seed data omitted.
  let articleEntries: MetadataRoute.Sitemap[number][] = [];
  try {
    const firstPage = await fetchPublishedArticles({ page: 1 });
    if (!firstPage) throw new Error("Published articles unavailable");
    const items = [...firstPage.items];
    for (let page = 2; items.length < firstPage.total; page += 1) {
      const response = await fetchPublishedArticles({ page });
      if (!response || response.items.length === 0) {
        throw new Error("Published article pagination incomplete");
      }
      items.push(...response.items);
    }
    // Include only articles whose indexability was explicitly supplied by the CMS.
    const indexable = items.filter(isSitemapIndexable);
    const uniqueArticles = [...new Map(indexable.map((item) => [item.slug, item])).values()];
    articleEntries = uniqueArticles.map(publishedArticleToArticle).map((article) => ({
      url: `${SITE.url}/articles/${article.slug}`,
      lastModified: article.publishDate ? new Date(article.publishDate) : now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }));
  } catch {
    // Keep static entries on error.
  }

  return [...staticEntries, ...articleEntries];
}

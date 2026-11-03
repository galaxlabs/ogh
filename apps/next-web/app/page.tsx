import type { Metadata } from "next";
import { headers } from "next/headers";
import { SiteShell } from "@/components/site-shell";
import { HomeClient } from "@/components/home-client";
import { buildCategoryStats } from "@/lib/data";
import type { Article } from "@/lib/data";
import {
  getPublicationBySubdomain,
  filterArticlesForPublication,
  mergePublicationConfig,
} from "@/lib/publications";
import { fetchPublicationConfig, fetchPublishedArticles } from "@/lib/galaxy-ops-api";
import { loadCategoryTree, flattenCategoryTree, categoryNodeToStats } from "@/lib/cms";
import type { CategoryNode } from "@/lib/cms";

export const metadata: Metadata = {
  title: "OpenGuideHub",
  description:
    "OpenGuideHub brings organized AI, FOSS, tutorials, and multilingual explainers into one searchable knowledge hub.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "OpenGuideHub",
    description:
      "OpenGuideHub brings organized AI, FOSS, tutorials, and multilingual explainers into one searchable knowledge hub.",
    images: [
      {
        url: "https://pf.digigalaxy.cloud/files/og-image.png",
        width: 1200,
        height: 630,
        alt: "OpenGuideHub - guides, tutorials, and practical knowledge",
      },
    ],
  },
};

export default async function HomePage() {
  const headerStore = await headers();
  const publication = getPublicationBySubdomain(headerStore.get("x-ogh-publication"));

  // Dynamic publication config from GalaxyOps backend (falls back to local).
  let dynamicConfig = null;
  if (publication) {
    dynamicConfig = await fetchPublicationConfig(publication.code);
  }
  const resolvedPub = publication ? mergePublicationConfig(publication, dynamicConfig) : null;

  // the live content is the source, the static list only fills the gap
  const liveArticles = await fetchPublishedArticles({
    publication: publication?.code,
    page: 1,
  });
  const scopedArticles = liveArticles?.items?.length
    ? mergeLiveArticles(liveArticles.items, filterArticlesForPublication(resolvedPub))
    : filterArticlesForPublication(resolvedPub);

  // CMS category tree (API-driven, falls back to static categories).
  const tree = await loadCategoryTree(publication ? { code: publication.code } : {});
  const flat = flattenCategoryTree(tree);
  const baseStats = buildCategoryStats([], scopedArticles);
  const categoryStats = flat.map((node: CategoryNode) => {
    const count =
      baseStats.find((s) => s.slug === node.slug)?.count ||
      scopedArticles.filter((a) => a.category === node.name).length;
    return categoryNodeToStats(node, count);
  });

  return (
    <SiteShell>
      <HomeClient
        articles={scopedArticles}
        categoryStats={categoryStats}
        categoryTree={tree}
        currentSubdomain={publication?.subdomain ?? null}
        publication={resolvedPub}
        heroImage={dynamicConfig?.hero_image}
        heroImageAlt={dynamicConfig?.hero_image_alt}
      />
    </SiteShell>
  );
}


/** Put the live articles first and keep the static ones that are still missing. */
function mergeLiveArticles(
  live: {
    name: string;
    title: string;
    slug: string;
    excerpt?: string;
    content_type?: string;
    featured_image?: string;
    published_at?: string;
    primary_keyword?: string;
    language?: string;
  }[],
  fallback: Article[]
): Article[] {
  const known = new Set(fallback.map((article) => article.slug));
  const merged: Article[] = [];

  for (const item of live) {
    const existing = fallback.find((article) => article.slug === item.slug);
    merged.push(
      existing
        ? { ...existing, title: item.title || existing.title, excerpt: item.excerpt || existing.excerpt }
        : ({
            id: item.name,
            slug: item.slug,
            title: item.title,
            excerpt: item.excerpt || "",
            category: item.content_type || "Article",
            topic: item.content_type || "Article",
            image: item.featured_image || "/images/article-placeholder.svg",
            readTime: 5,
            publishDate: item.published_at || new Date().toISOString(),
            author: "OpenGuideHub Editorial",
            featured: false,
            language: item.language,
            primaryKeyword: item.primary_keyword,
            body: "",
          } as unknown as Article)
    );
  }

  for (const article of fallback) {
    if (!known.has(article.slug)) continue;
    if (!merged.some((item) => item.slug === article.slug)) merged.push(article);
  }

  return merged;
}

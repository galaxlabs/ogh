import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { ArticleDetailClient } from "@/components/article-detail-client";
import { articles, categories, buildCategoryStats, type Article } from "@/lib/data";
import { publishedArticleToArticle } from "@/lib/cms";
import { fetchArticleBySlug, fetchPublishedArticles } from "@/lib/galaxy-ops-api";
import { getPublicationBySubdomain } from "@/lib/publications";

interface ArticleDetailPageProps {
  params: Promise<{ slug: string }>;
}

// Articles are API/CMS-driven; render dynamically rather than static export.
export const dynamic = "force-dynamic";

async function loadArticle(slug: string) {
  const headerStore = await headers();
  const publication = getPublicationBySubdomain(headerStore.get("x-ogh-publication"));
  const cmsArticle = await fetchArticleBySlug(slug, publication?.code);
  return cmsArticle
    ? publishedArticleToArticle(cmsArticle)
    : articles.find((article) => article.slug === slug);
}

function buildSeoKeywords(article: Article) {
  const values = [
    article?.title,
    article?.category,
    `${article?.category || "technology"} guide`,
    `${article?.category || "technology"} article`,
    ...(article?.tags || []),
  ];

  const keywords: string[] = [];
  values.forEach((value) => {
    String(value || "")
      .split(/[,\n]/)
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((item) => {
        if (!keywords.some((existing) => existing.toLowerCase() === item.toLowerCase())) {
          keywords.push(item);
        }
      });
  });

  return keywords.slice(0, 12);
}

export async function generateMetadata({
  params,
}: ArticleDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await loadArticle(slug);

  if (!article) return {};

  const articleUrl = `/articles/${article.slug}`;
  const seoKeywords = buildSeoKeywords(article);

  return {
    title: article.title,
    description: article.excerpt,
    keywords: seoKeywords,
    alternates: { canonical: articleUrl },
    openGraph: {
      type: "article",
      url: articleUrl,
      title: article.title,
      description: article.excerpt,
      images: [article.image],
      siteName: "OpenGuideHub",
      publishedTime: article.publishDate,
      modifiedTime: article.publishDate,
      section: article.category,
      authors: [article.author?.name || "OpenGuideHub"],
      tags: article.tags || [],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.excerpt,
      images: [article.image],
    },
    authors: [{ name: article.author?.name || "OpenGuideHub" }],
  };
}

export default async function ArticleDetailPage({ params }: ArticleDetailPageProps) {
  const { slug } = await params;
  const headerStore = await headers();
  const publication = getPublicationBySubdomain(headerStore.get("x-ogh-publication"));
  const cmsArticle = await fetchArticleBySlug(slug, publication?.code);
  const article = cmsArticle
    ? publishedArticleToArticle(cmsArticle)
    : articles.find((item) => item.slug === slug);

  if (!article) notFound();

  const response = await fetchPublishedArticles({ publication: publication?.code });
  const cmsArticles = (response?.items || []).map(publishedArticleToArticle);
  const cmsSlugs = new Set(cmsArticles.map((item) => item.slug));
  const allArticles = [
    ...cmsArticles,
    ...articles.filter((item) => !cmsSlugs.has(item.slug)),
  ];
  const categoryStats = buildCategoryStats(categories, allArticles);

  return (
    <SiteShell>
      <ArticleDetailClient
        article={article}
        allArticles={allArticles}
        categoryStats={categoryStats}
      />
    </SiteShell>
  );
}

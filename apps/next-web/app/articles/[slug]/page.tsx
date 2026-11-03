import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { ArticleDetailClient } from "@/components/article-detail-client";
import { articles, categories, buildCategoryStats, type Article } from "@/lib/data";
import { publishedArticleToArticle } from "@/lib/cms";
import { fetchArticleBySlug, fetchPublishedArticles } from "@/lib/galaxy-ops-api";
import { getPublicationBySubdomain } from "@/lib/publications";
import { extractFaq } from "@/lib/cms/article-template";

interface ArticleDetailPageProps {
  params: Promise<{ slug: string }>;
}

// Articles are API/CMS-driven; render dynamically rather than static export.
export const dynamic = "force-dynamic";

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://openguidehub.org").replace(/\/+$/, "");
}

// Structured data so search engines and AI assistants can quote and rank the guide.
function buildJsonLd(article: Article) {
  const url = `${siteUrl()}/articles/${article.slug}`;
  const faq = extractFaq(article.content || "");

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: article.title,
    description: article.excerpt,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    datePublished: article.publishDate,
    dateModified: article.publishDate,
    author: { "@type": "Organization", name: "OpenGuideHub", url: siteUrl() },
    publisher: {
      "@type": "Organization",
      name: "OpenGuideHub",
      url: siteUrl(),
      logo: { "@type": "ImageObject", url: `${siteUrl()}/icon.svg` },
    },
    image: article.image,
    articleSection: article.category,
    keywords: (article.tags || []).join(", "),
    inLanguage: "en",
    isAccessibleForFree: true,
  };

  const faqLd = faq.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      }
    : null;

  return [articleLd, faqLd].filter(Boolean);
}

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
      {buildJsonLd(article).map((data, index) => (
        <script
          key={`jsonld-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
      ))}
      <ArticleDetailClient
        article={article}
        allArticles={allArticles}
        categoryStats={categoryStats}
      />
    </SiteShell>
  );
}

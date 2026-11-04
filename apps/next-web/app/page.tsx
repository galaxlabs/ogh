import type { Metadata } from "next";
import { headers } from "next/headers";
import { SiteShell } from "@/components/site-shell";
import { HomeClient } from "@/components/home-client";
import { buildCategoryStats } from "@/lib/data";
import {
  getPublicationBySubdomain,
  mergePublicationConfig,
} from "@/lib/publications";
import { fetchPublicationConfig, fetchPublishedArticles } from "@/lib/galaxy-ops-api";
import { loadCategoryTree, flattenCategoryTree, categoryNodeToStats, publishedArticleToArticle } from "@/lib/cms";
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

  // Published CMS articles are the source of truth for the public site.
  const liveArticles = await fetchPublishedArticles({
    publication: publication?.code,
    page: 1,
  });
  const scopedArticles = (liveArticles?.items || []).map(publishedArticleToArticle);

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

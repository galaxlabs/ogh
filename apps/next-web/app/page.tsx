import type { Metadata } from "next";
import { headers } from "next/headers";
import { SiteShell } from "@/components/site-shell";
import { HomeClient } from "@/components/home-client";
import { buildCategoryStats } from "@/lib/data";
import {
  getPublicationBySubdomain,
  filterArticlesForPublication,
  mergePublicationConfig,
} from "@/lib/publications";
import { fetchPublicationConfig } from "@/lib/galaxy-ops-api";
import { loadCategoryTree, flattenCategoryTree, categoryNodeToStats } from "@/lib/cms";
import type { CategoryNode } from "@/lib/cms";

export const metadata: Metadata = {
  title: "OpenGuideHub",
  description:
    "OpenGuideHub brings organized AI, FOSS, tutorials, and multilingual explainers into one searchable knowledge hub.",
  alternates: { canonical: "/" },
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

  const scopedArticles = filterArticlesForPublication(resolvedPub);

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

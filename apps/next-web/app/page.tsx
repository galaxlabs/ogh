import type { Metadata } from "next";
import { headers } from "next/headers";
import { SiteShell } from "@/components/site-shell";
import { HomeClient } from "@/components/home-client";
import { categories, buildCategoryStats } from "@/lib/data";
import {
  getPublicationBySubdomain,
  filterArticlesForPublication,
  mergePublicationConfig,
} from "@/lib/publications";
import { fetchPublicationConfig } from "@/lib/galaxy-ops-api";

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
  const categoryStats = buildCategoryStats(categories, scopedArticles);

  return (
    <SiteShell>
      <HomeClient
        articles={scopedArticles}
        categoryStats={categoryStats}
        publication={resolvedPub}
        heroImage={dynamicConfig?.hero_image}
        heroImageAlt={dynamicConfig?.hero_image_alt}
      />
    </SiteShell>
  );
}

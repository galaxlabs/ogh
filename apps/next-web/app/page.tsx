import type { Metadata } from "next";
import { headers } from "next/headers";
import { SiteShell } from "@/components/site-shell";
import { HomeClient } from "@/components/home-client";
import { categories, buildCategoryStats } from "@/lib/data";
import { getPublicationBySubdomain, filterArticlesForPublication } from "@/lib/publications";

export const metadata: Metadata = {
  title: "OpenGuideHub",
  description:
    "OpenGuideHub brings organized AI, FOSS, tutorials, and multilingual explainers into one searchable knowledge hub.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const headerStore = await headers();
  const publication = getPublicationBySubdomain(headerStore.get("x-ogh-publication"));
  const scopedArticles = filterArticlesForPublication(publication);
  const categoryStats = buildCategoryStats(categories, scopedArticles);

  return (
    <SiteShell>
      <HomeClient articles={scopedArticles} categoryStats={categoryStats} publication={publication} />
    </SiteShell>
  );
}

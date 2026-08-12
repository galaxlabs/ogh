import type { Metadata } from "next";
import { Suspense } from "react";
import { headers } from "next/headers";
import { SiteShell } from "@/components/site-shell";
import { ArticlesExplorer } from "@/components/articles-explorer";
import { Breadcrumb } from "@/components/breadcrumb";
import { CategoryLinkNetwork } from "@/components/category-link-network";
import { categories, buildCategoryStats } from "@/lib/data";
import { getPublicationBySubdomain, filterArticlesForPublication } from "@/lib/publications";

export const metadata: Metadata = {
  title: "Articles",
  description: "Browse all articles and guides on OpenGuideHub",
  alternates: { canonical: "/articles" },
};

export default async function ArticlesPage() {
  const headerStore = await headers();
  const publication = getPublicationBySubdomain(headerStore.get("x-ogh-publication"));
  const scopedArticles = filterArticlesForPublication(publication);
  const categoryStats = buildCategoryStats(categories, scopedArticles);

  return (
    <SiteShell>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: "Articles" }]} />

        <div className="mb-8">
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">
            {publication ? publication.name : "All Articles"}
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            {publication
              ? publication.tagline
              : "Discover in-depth articles, guides, and tutorials on science, technology, and more"}
          </p>
        </div>

        <Suspense
          fallback={
            <div className="grid gap-12 lg:grid-cols-3">
              <div className="space-y-4 lg:col-span-2">
                <div className="h-10 w-full animate-pulse rounded-lg bg-muted" />
                <div className="h-10 w-full animate-pulse rounded-lg bg-muted" />
                <div className="h-40 w-full animate-pulse rounded-xl bg-muted" />
              </div>
              <div className="h-64 animate-pulse rounded-xl bg-muted lg:col-span-1" />
            </div>
          }
        >
          <ArticlesExplorer articles={scopedArticles} categoryStats={categoryStats} />
        </Suspense>

        {publication && <CategoryLinkNetwork />}
      </div>
    </SiteShell>
  );
}

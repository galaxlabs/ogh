import type { Metadata } from "next";
import { headers } from "next/headers";
import { SiteShell } from "@/components/site-shell";
import { CategoriesExplorer } from "@/components/categories-explorer";
import { Breadcrumb } from "@/components/breadcrumb";
import { loadCategoryTree, flattenCategoryTree, categoryNodeToStats } from "@/lib/cms";
import { buildCategoryStats } from "@/lib/data";
import { getPublicationBySubdomain, filterArticlesForPublication, publicationVisualTheme } from "@/lib/publications";

export const metadata: Metadata = {
  title: "Categories",
  description: "Browse all categories and topics on OpenGuideHub",
  alternates: { canonical: "/categories" },
};

export default async function CategoriesPage() {
  const headerStore = await headers();
  const publication = getPublicationBySubdomain(headerStore.get("x-ogh-publication"));
  const theme = publicationVisualTheme(publication);
  const scopedArticles = filterArticlesForPublication(publication);
  const tree = await loadCategoryTree(publication ? { code: publication.code } : {});
  const nodes = flattenCategoryTree(tree);

  // Merge CMS nodes with static article counts (fallback-friendly).
  const baseStats = buildCategoryStats([], scopedArticles);
  const stats = nodes.map((node) => {
    const count =
      baseStats.find((s) => s.slug === node.slug)?.count ||
      scopedArticles.filter((a) => a.category === node.name).length;
    return categoryNodeToStats(node, count);
  });

  return (
    <SiteShell>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: "Categories" }]} />

        <div className={`mb-8 overflow-hidden rounded-[2rem] border p-8 md:p-10 ${theme.hero}`}>
          <div className="mb-4 flex flex-wrap gap-2">
            {publication?.categories.slice(0, 6).map((category) => (
              <span key={category} className={`rounded-full px-3 py-1 text-xs font-medium ${theme.badge}`}>
                {category}
              </span>
            ))}
          </div>
          <h1 className="mb-4 max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">
            {publication ? `${publication.name} Categories` : "All Categories"}
          </h1>
          <p className="max-w-3xl text-lg text-muted-foreground md:text-xl">
            {publication
              ? publication.tagline
              : "Explore our comprehensive collection of topics covering science, technology, and more"}
          </p>
        </div>

        <CategoriesExplorer categories={stats} nodes={tree} currentSubdomain={publication?.subdomain ?? null} />
      </div>
    </SiteShell>
  );
}

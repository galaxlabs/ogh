import type { Metadata } from "next";
import { headers } from "next/headers";
import { SiteShell } from "@/components/site-shell";
import { Breadcrumb } from "@/components/breadcrumb";
import { CategoryTree } from "@/components/cms/category-tree";
import { loadCategoryTree } from "@/lib/cms";
import { getPublicationBySubdomain, publicationVisualTheme } from "@/lib/publications";

export const metadata: Metadata = {
  title: "Categories",
  description:
    "Browse every OpenGuideHub main group, sub topic, and leaf category, each routed to its own publication.",
  alternates: { canonical: "/categories" },
};

export default async function CategoriesPage() {
  const headerStore = await headers();
  const publication = getPublicationBySubdomain(headerStore.get("x-ogh-publication"));
  const theme = publicationVisualTheme(publication);
  const tree = await loadCategoryTree(publication ? { code: publication.code } : {});

  // On a publication subdomain only that group is shown, with its own tree.
  const groups = publication
    ? tree.filter(
        (node) =>
          node.subdomain === publication.subdomain ||
          node.publication_code === publication.key
      )
    : tree;

  const totalArticles = groups.reduce(
    (sum, group) => sum + (group.article_count || 0),
    0
  );

  return (
    <SiteShell>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: "Categories" }]} />

        <div className={`mb-8 overflow-hidden rounded-[2rem] border p-8 md:p-10 ${theme.hero}`}>
          <h1 className="mb-4 max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">
            {publication ? `${publication.name} Categories` : "All Categories"}
          </h1>
          <p className="max-w-3xl text-lg text-muted-foreground md:text-xl">
            {publication
              ? publication.tagline
              : "Every main group, sub topic, and leaf category on OpenGuideHub. Each group has its own publication, and every leaf links across the network."}
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-background/70 px-3 py-1">
              {groups.length} main group{groups.length === 1 ? "" : "s"}
            </span>
            <span className="rounded-full bg-background/70 px-3 py-1">
              {totalArticles} published article{totalArticles === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        <CategoryTree groups={groups} currentSubdomain={publication?.subdomain ?? null} />
      </div>
    </SiteShell>
  );
}

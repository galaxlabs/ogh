import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { Breadcrumb } from "@/components/breadcrumb";
import { ArticleCard } from "@/components/article-card";
import { findCategoryNode, flattenCategoryTree, loadCategoryTree } from "@/lib/cms";
import { fetchAllPublishedArticles } from "@/lib/galaxy-ops-api";
import { publishedArticleToArticle } from "@/lib/cms";
import { getPublicationBySubdomain, publicationVisualTheme } from "@/lib/publications";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tree = await loadCategoryTree({});
  const node = findCategoryNode(tree, slug);
  if (!node) return {};

  return {
    title: node.name,
    description: node.description || `Browse ${node.name} guides on OpenGuideHub`,
    alternates: { canonical: `/categories/${node.slug}` },
    openGraph: {
      title: `${node.name} - OpenGuideHub`,
      description: node.description || `Browse ${node.name} guides on OpenGuideHub`,
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const headerStore = await headers();
  const publication = getPublicationBySubdomain(headerStore.get("x-ogh-publication"));
  const theme = publicationVisualTheme(publication);

  const tree = await loadCategoryTree({});
  const node = findCategoryNode(tree, slug);
  if (!node) notFound();

  const flat = flattenCategoryTree(tree);
  const parent = flat.find((item) => item.children.some((child) => child.slug === node.slug));

  // Articles filed under this category or any of its children.
  const childSlugs = new Set(flattenCategoryTree([node]).map((item) => item.slug));
  const response = await fetchAllPublishedArticles({ publication: publication?.code });
  const cmsArticles = (response || []).map(publishedArticleToArticle);
  const articles = cmsArticles.filter((article) => article.topic && childSlugs.has(article.topic));

  // Cross links: siblings inside the same group, plus groups with content.
  const siblings = (parent?.children || []).filter((item) => item.slug !== node.slug);
  const otherGroups = tree.filter(
    (group) => group.slug !== node.slug && (group.article_count || 0) > 0
  );

  const breadcrumb = parent && parent.slug !== node.slug
    ? [
        { label: "Categories", href: "/categories" },
        { label: parent.name, href: `/categories/${parent.slug}` },
        { label: node.name },
      ]
    : [{ label: "Categories", href: "/categories" }, { label: node.name }];

  return (
    <SiteShell>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Breadcrumb items={breadcrumb} />

        <div className={`mb-8 overflow-hidden rounded-[2rem] border p-8 md:p-10 ${theme.hero}`}>
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
            {parent && parent.slug !== node.slug && <span>{parent.name}</span>}
            {node.subdomain && (
              <a
                href={`https://${node.subdomain}.openguidehub.org/`}
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                {node.subdomain}.openguidehub.org <ArrowUpRight className="size-3.5" />
              </a>
            )}
          </div>
          <h1 className="mb-4 max-w-4xl text-4xl font-bold tracking-tight md:text-5xl">
            {node.name}
          </h1>
          {node.description && (
            <p className="max-w-3xl text-lg text-muted-foreground">{node.description}</p>
          )}
          <div className="mt-5 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-background/70 px-3 py-1">
              {node.article_count} article{node.article_count === 1 ? "" : "s"} in this topic
            </span>
            {node.content_types?.map((type) => (
              <span key={type} className="rounded-full bg-background/70 px-3 py-1">
                {type}
              </span>
            ))}
          </div>
        </div>

        {node.children?.length ? (
          <section className="mb-10">
            <h2 className="mb-4 text-xl font-semibold">Sub topics</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {node.children.map((child) => (
                <Link
                  key={child.slug}
                  href={`/categories/${child.slug}`}
                  className="rounded-xl border border-black/10 bg-card/60 p-4 transition hover:border-primary dark:border-white/10"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{child.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {child.article_count}
                    </span>
                  </div>
                  {child.description && (
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                      {child.description}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mb-10">
          <h2 className="mb-4 text-xl font-semibold">
            Articles{articles.length ? ` (${articles.length})` : ""}
          </h2>
          {articles.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((article, index) => (
                <ArticleCard key={article.id} article={article} index={index} />
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              No published article sits in this topic yet. Pick a sibling topic below.
            </p>
          )}
        </section>

        <div className="grid gap-8 lg:grid-cols-2">
          {siblings.length > 0 && (
            <section className="rounded-2xl border border-black/10 p-6 dark:border-white/10">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Related topics
              </h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {siblings.map((sibling) => (
                  <li key={sibling.slug}>
                    <Link
                      href={`/categories/${sibling.slug}`}
                      className="flex items-center justify-between gap-2 rounded-lg border border-black/10 px-3 py-2 text-sm transition hover:border-primary dark:border-white/10"
                    >
                      <span>{sibling.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {sibling.article_count}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="rounded-2xl border border-black/10 p-6 dark:border-white/10">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Across the network
            </h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {otherGroups.map((group) => (
                <li key={group.slug}>
                  <a
                    href={
                      group.subdomain
                        ? `https://${group.subdomain}.openguidehub.org/`
                        : `/categories/${group.slug}`
                    }
                    className="flex items-center justify-between gap-2 rounded-lg border border-black/10 px-3 py-2 text-sm transition hover:border-primary dark:border-white/10"
                  >
                    <span>{group.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {group.article_count}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </SiteShell>
  );
}

import type { CategoryNode, PublishedArticle, PublishedArticleDetail } from "@/lib/galaxy-ops-api";
import { fetchAllPublishedArticles, fetchCategories, fetchContentCategories, type ContentCategoryNode } from "@/lib/galaxy-ops-api";
import { categories as staticCategories } from "@/lib/data";
import { slugifyCategoryName } from "@/lib/data";
import type { Article, CategoryStats } from "@/lib/data";
import { PUBLICATIONS } from "@/lib/publications";
import { cmsMediaUrl } from "@/lib/cms/media-url";

export type { CategoryNode };

// Fallback: build a flat node list from the static categories when the API is
// unreachable (e.g. local dev or DNS not propagated yet).
function staticCategoryNodes(opts: { code?: string } = {}): CategoryNode[] {
  const publication = opts.code
    ? Object.values(PUBLICATIONS).find((pub) => pub.code === opts.code)
    : null;
  const allowed = publication ? new Set(publication.categories) : null;
  const knownCategories = staticCategories
    .filter((cat: { name: string }) => !allowed || allowed.has(cat.name))
    .map((cat: { id: number; name: string; slug: string; description: string; icon: string }) => {
    return {
      name: cat.name,
      code: cat.slug.toUpperCase().replace(/-/g, "_"),
      slug: cat.slug,
      description: cat.description,
      icon: cat.icon,
      publication_code: null,
      subdomain: null,
      hostname: null,
      is_global: true,
      sort_order: 100,
      featured: false,
      content_types: ["Article"],
      children: [],
    };
  });
  if (!publication) return knownCategories;

  const knownNames = new Set(knownCategories.map((category) => category.name));
  const publicationCategories = publication.categories
    .filter((name) => !knownNames.has(name))
    .map((name, index) => ({
      name,
      code: name.toUpperCase().replace(/[^A-Z0-9]+/g, "_"),
      slug: slugifyCategoryName(name),
      description: `${name} guides and practical reference material.`,
      icon: "BookOpen",
      publication_code: publication.code,
      subdomain: publication.subdomain,
      hostname: publication.primaryHostname,
      is_global: false,
      sort_order: knownCategories.length + index,
      featured: index < 3,
      content_types: ["Article", "Guide", "Tutorial"],
      children: [],
    }));
  return [...knownCategories, ...publicationCategories];
}

// Map the backend category tree onto the frontend node contract.
function contentTreeToNodes(nodes: ContentCategoryNode[]): CategoryNode[] {
  return nodes.map((node) => ({
    name: node.name,
    code: node.code || node.slug.toUpperCase().replace(/-/g, "_"),
    slug: node.slug,
    description: node.description,
    icon: node.icon || "BookOpen",
    publication_code: (node.niche || "").toLowerCase().replace(/\s+/g, "-") || null,
    subdomain: node.subdomain || null,
    hostname: node.subdomain ? `${node.subdomain}.openguidehub.org` : null,
    is_global: node.level === 1,
    sort_order: 100,
    featured: node.featured,
    content_types: node.content_types?.length ? node.content_types : ["Article"],
    article_count: node.article_count || 0,
    children: contentTreeToNodes(node.children || []),
  }));
}

// The backend category endpoint is shared with the stories feature and can
// return a different node shape (category_name, category_slug, image). Only
// nodes that carry the article category contract are usable here.
function isArticleCategoryNode(node: Partial<CategoryNode>) {
  return (
    typeof node?.code === "string" &&
    node.code.length > 0 &&
    Array.isArray(node?.content_types)
  );
}

export async function loadCategoryTree(opts: { code?: string; host?: string } = {}): Promise<CategoryNode[]> {
  const fallback = staticCategoryNodes(opts);
  if (opts.code && fallback.length > 0) {
    // GOP currently returns content types (Article/Tutorial) for publication categories.
    // For subdomains, the publication map is the authoritative topic taxonomy.
    return fallback;
  }

  try {
    const tree = await fetchContentCategories(opts.code ? undefined : undefined);
    if (tree && tree.length > 0) {
      return contentTreeToNodes(tree);
    }
  } catch {
    // fall through to the legacy endpoint
  }

  try {
    const api = await fetchCategories(opts);
    if (api && api.length > 0 && api.every((node) => isArticleCategoryNode(node))) {
      return api;
    }
  } catch {
    // fall through to static
  }
  return fallback;
}

// Find one node anywhere in the tree by slug.
export function findCategoryNode(
  nodes: CategoryNode[],
  slug: string
): CategoryNode | null {
  for (const node of nodes) {
    if (node.slug === slug) return node;
    const found = findCategoryNode(node.children || [], slug);
    if (found) return found;
  }
  return null;
}

// Flatten a tree into a list (roots + children), preserving order.
export function flattenCategoryTree(nodes: CategoryNode[]): CategoryNode[] {
  const flat: CategoryNode[] = [];
  const walk = (list: CategoryNode[]) => {
    for (const node of list) {
      flat.push(node);
      if (node.children && node.children.length) walk(node.children);
    }
  };
  walk(nodes);
  return flat;
}

/** Published CMS articles whose topic is within any requested category subtree. */
export async function loadArticlesByTopics(slugs: string[]): Promise<Article[]> {
  const [items, tree] = await Promise.all([fetchAllPublishedArticles(), loadCategoryTree()]);
  const allowed = new Set(slugs);
  for (const slug of slugs) {
    const node = findCategoryNode(tree, slug);
    if (node) for (const child of flattenCategoryTree([node])) allowed.add(child.slug);
  }
  return (items || []).filter((article) => article.category && allowed.has(article.category)).map(publishedArticleToArticle);
}

// Convert a CMS node into the CategoryStats shape used by the frontend cards.
export function categoryNodeToStats(node: CategoryNode, count: number): CategoryStats {
  return {
    id: hashString(node.code),
    name: node.name,
    slug: node.slug,
    description: node.description,
    icon: node.icon,
    count,
  };
}

export function hashString(value: string): number {
  const text = typeof value === "string" ? value : String(value ?? "");
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
  }
  hash |= 0;
  return Math.abs(hash);
}

const DEFAULT_ARTICLE_IMAGE = "/images/article-placeholder.svg";

export function publishedArticleToArticle(
  article: PublishedArticle | PublishedArticleDetail
): Article {
  const detail = article as PublishedArticleDetail;
  const keyword = article.primary_keyword?.trim();
  return {
    id: hashString(article.name || article.slug),
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt || article.meta_description || "OpenGuideHub article",
    content: detail.body || "",
    image: article.featured_image ? cmsMediaUrl(article.featured_image) : DEFAULT_ARTICLE_IMAGE,
    category: article.content_type || "Guides",
    topic: article.category || "",
    language: article.language,
    translations: detail.translations || [],
    tags: keyword ? [keyword] : [],
    readingTime: Math.max(1, Math.ceil((detail.body || "").split(/\s+/).filter(Boolean).length / 220)),
    publishDate: article.published_at || article.updated_at || new Date().toISOString(),
    author: {
      name: "OpenGuideHub",
      avatar: "OG",
      bio: "Practical guides published by the OpenGuideHub editorial team.",
    },
    featured: false,
  };
}

// Build the href for a category: same-subdomain -> internal; otherwise subdomain URL.
export function categoryHref(node: CategoryNode, currentSubdomain?: string | null): string {
  const base = `/articles?category=${encodeURIComponent(node.slug)}`;
  if (!node.subdomain) return base;
  const current = (currentSubdomain || "").replace(/\.openguidehub\.org$/, "");
  if (current && node.subdomain === current) return base;
  return `https://${node.subdomain}.openguidehub.org/articles?category=${encodeURIComponent(node.slug)}`;
}

// Content-type helpers used for gating sections (tutorials/downloads/etc.).
export function categoryHasContentType(node: CategoryNode, contentType: string): boolean {
  return (node.content_types || []).includes(contentType);
}

export function treeHasContentType(nodes: CategoryNode[], contentType: string): boolean {
  return flattenCategoryTree(nodes).some((n) => categoryHasContentType(n, contentType));
}

// Convenience: does any category in the tree support a given content type?
export function slugifyNode(name: string): string {
  return slugifyCategoryName(name);
}

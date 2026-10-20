import type { CategoryNode, PublishedArticle, PublishedArticleDetail } from "@/lib/galaxy-ops-api";
import { fetchCategories } from "@/lib/galaxy-ops-api";
import { categories as staticCategories } from "@/lib/data";
import { slugifyCategoryName } from "@/lib/data";
import type { Article, CategoryStats } from "@/lib/data";
import { PUBLICATIONS } from "@/lib/publications";

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

export async function loadCategoryTree(opts: { code?: string; host?: string } = {}): Promise<CategoryNode[]> {
  const fallback = staticCategoryNodes(opts);
  if (opts.code && fallback.length > 0) {
    // GOP currently returns content types (Article/Tutorial) for publication categories.
    // For subdomains, the publication map is the authoritative topic taxonomy.
    return fallback;
  }

  try {
    const api = await fetchCategories(opts);
    if (api && api.length > 0) return api;
  } catch {
    // fall through to static
  }
  return fallback;
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
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

const DEFAULT_ARTICLE_IMAGE = "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb";

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
    image: article.featured_image || DEFAULT_ARTICLE_IMAGE,
    category: article.content_type || "Guides",
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

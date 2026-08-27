import type { CategoryNode } from "@/lib/galaxy-ops-api";
import { fetchCategories } from "@/lib/galaxy-ops-api";
import { categories as staticCategories } from "@/lib/data";
import { slugifyCategoryName } from "@/lib/data";
import type { CategoryStats } from "@/lib/data";

export type { CategoryNode };

// Fallback: build a flat node list from the static categories when the API is
// unreachable (e.g. local dev or DNS not propagated yet).
function staticCategoryNodes(): CategoryNode[] {
  return staticCategories.map((cat: { id: number; name: string; slug: string; description: string; icon: string }) => {
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
}

export async function loadCategoryTree(opts: { code?: string; host?: string } = {}): Promise<CategoryNode[]> {
  try {
    const api = await fetchCategories(opts);
    if (api && api.length > 0) return api;
  } catch {
    // fall through to static
  }
  return staticCategoryNodes();
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

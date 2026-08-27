export interface PublicationConfig {
  publication: string;
  name: string;
  site_title?: string;
  site_tagline?: string;
  hero_image?: string;
  hero_image_alt?: string;
  logo_image?: string;
  hero_overlay_color?: string;
  default_language?: string;
  languages?: string[];
  categories?: string[];
  content_profile?: string;
  internal_link_profile?: string;
  agent_posting_enabled?: boolean;
  agent_languages?: string[];
}

export interface PublishedArticle {
  name: string;
  title: string;
  slug: string;
  excerpt?: string;
  content_type?: string;
  language?: string;
  featured_image?: string;
  published_at?: string;
  updated_at?: string;
  seo_title?: string;
  meta_description?: string;
  primary_keyword?: string;
}

export interface PublishedArticleDetail extends PublishedArticle {
  body?: string;
  canonical_url?: string;
  value_type?: string;
  related?: PublishedArticle[];
}

export interface CategoryNode {
  name: string;
  code: string;
  slug: string;
  description: string;
  icon: string;
  publication_code: string | null;
  subdomain: string | null;
  hostname: string | null;
  is_global: boolean;
  sort_order: number;
  featured: boolean;
  content_types: string[];
  children: CategoryNode[];
}

const FALLBACK_API = "https://api.openguidehub.org";

function apiBase(): string {
  const configured = process.env.NEXT_PUBLIC_ADMIN_API_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  return FALLBACK_API;
}

async function getJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${apiBase()}/api/method/open_guide_hub.api.galaxy_ops.${path}`, {
      next: { revalidate: 60 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.message ?? null;
  } catch {
    return null;
  }
}

export async function fetchPublicationConfig(code?: string, host?: string): Promise<PublicationConfig | null> {
  const params = new URLSearchParams();
  if (code) params.set("code", code);
  if (host) params.set("host", host);
  const qs = params.toString() ? `?${params.toString()}` : "";
  return getJson<PublicationConfig>(`publication_config${qs}`);
}

export async function fetchPublishedArticles(opts: {
  publication: string;
  language?: string;
  category?: string;
  page?: number;
}): Promise<{ items: PublishedArticle[]; total: number; page: number } | null> {
  const params = new URLSearchParams({
    publication: opts.publication,
    page: String(opts.page || 1),
    page_size: "50",
  });
  if (opts.language) params.set("language", opts.language);
  if (opts.category) params.set("category", opts.category);
  return getJson(`list_published?${params.toString()}`);
}

export async function fetchArticleBySlug(
  slug: string,
  publication?: string
): Promise<PublishedArticleDetail | null> {
  const params = new URLSearchParams({ slug });
  if (publication) params.set("publication", publication);
  return getJson<PublishedArticleDetail>(`get_by_slug?${params.toString()}`);
}

export async function fetchCategories(opts: {
  code?: string;
  host?: string;
}): Promise<CategoryNode[] | null> {
  const params = new URLSearchParams();
  if (opts.code) params.set("code", opts.code);
  if (opts.host) params.set("host", opts.host);
  const qs = params.toString() ? `?${params.toString()}` : "";
  const data = await getJson<{ categories: CategoryNode[] }>(`list_categories${qs}`);
  return data?.categories ?? null;
}

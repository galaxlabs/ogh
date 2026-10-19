import { Meilisearch } from "meilisearch";
import { articles } from "@/lib/data";

export interface SearchResult {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  image: string;
  readingTime: number;
  publishDate: string;
  author: string;
  score?: number;
}

const MEILI_HOST = process.env.MEILI_HOST || "";
const MEILI_KEY = process.env.MEILI_KEY || "";
const MEILI_INDEX = "articles";
const FALLBACK_API = process.env.NEXT_PUBLIC_ADMIN_API_URL || "https://pf.digigalaxy.cloud";

let meiliClient: Meilisearch | null = null;

function getClient(): Meilisearch | null {
  if (!MEILI_HOST) return null;
  if (!meiliClient) {
    meiliClient = new Meilisearch({ host: MEILI_HOST, apiKey: MEILI_KEY || undefined });
  }
  return meiliClient;
}

export async function searchMeili(query: string, limit = 20): Promise<SearchResult[]> {
  const client = getClient();
  if (!client) return searchViaFrappe(query, limit);

  try {
    const index = client.index(MEILI_INDEX);
    const result = await index.search(query, { limit });
    return (result.hits || []).map((hit: Record<string, unknown>) => ({
      slug: String(hit.slug || ""),
      title: String(hit.title || ""),
      excerpt: String(hit.excerpt || ""),
      category: String(hit.category || ""),
      image: String(hit.image || ""),
      readingTime: Number(hit.readingTime) || 1,
      publishDate: String(hit.publishDate || ""),
      author: String(hit.author || ""),
      score: hit._rankingScore as number | undefined,
    }));
  } catch {
    return searchViaFrappe(query, limit);
  }
}

export async function searchViaFrappe(query: string, limit = 20): Promise<SearchResult[]> {
  try {
    const url = `${FALLBACK_API.replace(/\/+$/, "")}/api/method/gop.api.search`;
    const res = await fetch(`${url}?q=${encodeURIComponent(query)}&limit=${limit}`, {
      next: { revalidate: 60 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return fallbackSearch(query, limit);
    const data = await res.json();
    const results = data?.message?.results;
    if (results && Array.isArray(results)) return results;
    return fallbackSearch(query, limit);
  } catch {
    return fallbackSearch(query, limit);
  }
}

export function fallbackSearch(query: string, limit = 20): SearchResult[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  return articles
    .filter((a) => {
      const haystack = `${a.title} ${a.excerpt} ${a.category} ${(a.tags || []).join(" ")}`.toLowerCase();
      return haystack.includes(q);
    })
    .slice(0, limit)
    .map((a) => ({
      slug: a.slug,
      title: a.title,
      excerpt: a.excerpt,
      category: a.category,
      image: a.image,
      readingTime: a.readingTime,
      publishDate: a.publishDate,
      author: a.author?.name || "OpenGuideHub",
    }));
}

export async function indexArticle(doc: Record<string, unknown>): Promise<boolean> {
  const client = getClient();
  if (!client) return false;
  try {
    const index = client.index(MEILI_INDEX);
    await index.addDocuments([doc], { primaryKey: "slug" });
    return true;
  } catch {
    return false;
  }
}

export async function removeArticle(slug: string): Promise<boolean> {
  const client = getClient();
  if (!client) return false;
  try {
    const index = client.index(MEILI_INDEX);
    await index.deleteDocument(slug);
    return true;
  } catch {
    return false;
  }
}

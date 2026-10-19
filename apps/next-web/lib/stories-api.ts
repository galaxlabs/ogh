export interface StoryResult {
  slug: string;
  title: string;
  author_name: string;
  excerpt: string;
  cover_image: string;
  price: number;
  reading_time: number;
  historical_period: string;
}

export interface StoryDetail extends StoryResult {
  author_bio: string;
  category: string;
  currency: string;
  published_date: string;
  tags: string;
  has_purchased: boolean;
  body: string | null;
}

export interface StoryCategory {
  name: string;
  category_name: string;
  category_slug: string;
  description: string;
  image: string | null;
}

const API = process.env.NEXT_PUBLIC_ADMIN_API_URL || "https://pf.digigalaxy.cloud";

async function getJson<T>(endpoint: string): Promise<T | null> {
  try {
    const url = `${API.replace(/\/+$/, "")}/api/method/gop.api.${endpoint}`;
    const res = await fetch(url, { cache: "no-store", headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.message ?? null;
  } catch {
    return null;
  }
}

export async function listStories(category?: string, limit = 20, start = 0): Promise<StoryResult[]> {
  const params = new URLSearchParams({ limit: String(limit), start: String(start) });
  if (category) params.set("category", category);
  const data = await getJson<{ stories: StoryResult[] }>(`list_stories?${params.toString()}`);
  return data?.stories ?? [];
}

export async function getStory(slug: string): Promise<StoryDetail | null> {
  return getJson<StoryDetail>(`get_story?slug=${encodeURIComponent(slug)}`);
}

export async function listCategories(): Promise<StoryCategory[]> {
  const data = await getJson<{ categories: StoryCategory[] }>("list_categories");
  return data?.categories ?? [];
}

export async function searchStories(q: string, limit = 20): Promise<StoryResult[]> {
  const data = await getJson<{ results: StoryResult[] }>(`search_stories?q=${encodeURIComponent(q)}&limit=${limit}`);
  return data?.results ?? [];
}

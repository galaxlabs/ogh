import type { Article } from "@/lib/data";
import { articles } from "@/lib/data";
import type { PublicationConfig } from "@/lib/galaxy-ops-api";

export type PublicationKey =
  | "news"
  | "science"
  | "tech"
  | "ai"
  | "jobs"
  | "health"
  | "markets"
  | "knowledge";

export interface Publication {
  key: PublicationKey;
  code: string;
  name: string;
  subdomain: string;
  primaryHostname: string;
  tagline: string;
  defaultLanguage: string;
  // Category names (from Article.category) that this publication shows.
  categories: string[];
}

export interface PublicationVisualTheme {
  shell: string;
  hero: string;
  panel: string;
  card: string;
  badge: string;
}

// Map publication subdomain -> categories. Derived from the GalaxyOps niche
// model (spec 06) so it can later be served from the API instead.
export const PUBLICATIONS: Record<PublicationKey, Publication> = {
  news: {
    key: "news",
    code: "NEWS",
    name: "OpenGuideHub News",
    subdomain: "news",
    primaryHostname: "news.openguidehub.org",
    tagline: "Latest news and updates across technology and open source.",
    defaultLanguage: "en",
    categories: ["Open Source", "Repo Reviews"],
  },
  science: {
    key: "science",
    code: "SCIENCE",
    name: "OpenGuideHub Science",
    subdomain: "science",
    primaryHostname: "science.openguidehub.org",
    tagline: "Physics, chemistry, and the world of scientific discovery.",
    defaultLanguage: "en",
    categories: ["Physics", "Chemistry", "Biology", "Earth Science", "Space & Astronomy", "Environmental Science"],
  },
  tech: {
    key: "tech",
    code: "TECH",
    name: "OpenGuideHub Tech",
    subdomain: "tech",
    primaryHostname: "tech.openguidehub.org",
    tagline: "Programming, cloud, devops, and developer tools.",
    defaultLanguage: "en",
    categories: ["Programming", "Cloud & DevOps", "Computer Science", "Software", "Web Development", "Cybersecurity", "Data Science"],
  },
  ai: {
    key: "ai",
    code: "AI_TOOLS",
    name: "OpenGuideHub AI",
    subdomain: "ai",
    primaryHostname: "ai.openguidehub.org",
    tagline: "Artificial intelligence, agents, and AI tooling.",
    defaultLanguage: "en",
    categories: ["Artificial Intelligence", "AI Agents", "AI Tools", "Machine Learning"],
  },
  jobs: {
    key: "jobs",
    code: "JOBS",
    name: "OpenGuideHub Jobs",
    subdomain: "jobs",
    primaryHostname: "jobs.openguidehub.org",
    tagline: "Career guidance and jobs in tech and beyond.",
    defaultLanguage: "en",
    categories: [],
  },
  health: {
    key: "health",
    code: "HEALTH",
    name: "OpenGuideHub Health",
    subdomain: "health",
    primaryHostname: "health.openguidehub.org",
    tagline: "Health, wellness, and medical knowledge.",
    defaultLanguage: "en",
    categories: [],
  },
  markets: {
    key: "markets",
    code: "MARKETS",
    name: "OpenGuideHub Markets",
    subdomain: "markets",
    primaryHostname: "markets.openguidehub.org",
    tagline: "Markets and financial intelligence.",
    defaultLanguage: "en",
    categories: [],
  },
  knowledge: {
    key: "knowledge",
    code: "KNOWLEDGE",
    name: "OpenGuideHub Knowledge",
    subdomain: "knowledge",
    primaryHostname: "knowledge.openguidehub.org",
    tagline: "Guides, tutorials, and evergreen knowledge.",
    defaultLanguage: "en",
    categories: [],
  },
};

export function getPublicationBySubdomain(sub: string | null | undefined): Publication | null {
  if (!sub) return null;
  const key = sub.toLowerCase().replace(/\.openguidehub\.org$/, "") as PublicationKey;
  return PUBLICATIONS[key] || null;
}

// Merge a dynamic API publication config (hero/tagline/languages from Frappe)
// with the static fallback, so a subdomain shows backend-configured branding.
export function mergePublicationConfig(
  pub: Publication,
  config: PublicationConfig | null
): Publication {
  if (!config) return pub;
  return {
    ...pub,
    name: config.site_title || config.name || pub.name,
    tagline: config.site_tagline || pub.tagline,
    defaultLanguage: config.default_language || pub.defaultLanguage,
  };
}

export function filterArticlesForPublication(
  pub: Publication | null,
  all: Article[] = articles
): Article[] {
  if (!pub || pub.categories.length === 0) return all;
  return all.filter((a) => pub.categories.includes(a.category));
}

export function publicationVisualTheme(pub: Publication | null): PublicationVisualTheme {
  if (!pub) {
    return {
      shell: "bg-background",
      hero: "border bg-muted/30",
      panel: "bg-background",
      card: "bg-card",
      badge: "bg-primary/10 text-primary",
    };
  }

  if (pub.key === "science") {
    return {
      shell: "bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.16),transparent_34%),linear-gradient(180deg,rgba(236,253,245,0.9),rgba(255,255,255,1)_42%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.22),transparent_34%),linear-gradient(180deg,rgba(4,47,46,0.85),rgba(2,6,23,1)_46%)]",
      hero: "border-emerald-200 bg-emerald-50/80 dark:border-emerald-900/70 dark:bg-emerald-950/30",
      panel: "bg-white/80 backdrop-blur dark:bg-slate-950/70",
      card: "border-emerald-200 bg-white/90 hover:border-emerald-500 dark:border-emerald-900 dark:bg-slate-950/80",
      badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
    };
  }

  if (pub.key === "tech") {
    return {
      shell: "bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_34%),linear-gradient(180deg,rgba(239,246,255,0.95),rgba(255,255,255,1)_42%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.24),transparent_34%),linear-gradient(180deg,rgba(15,23,42,1),rgba(2,6,23,1)_48%)]",
      hero: "border-blue-200 bg-blue-50/80 dark:border-blue-900/70 dark:bg-blue-950/30",
      panel: "bg-white/80 backdrop-blur dark:bg-slate-950/70",
      card: "border-blue-200 bg-white/90 hover:border-blue-500 dark:border-blue-900 dark:bg-slate-950/80",
      badge: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
    };
  }

  if (pub.key === "ai") {
    return {
      shell: "bg-[radial-gradient(circle_at_top,rgba(217,70,239,0.2),transparent_35%),linear-gradient(180deg,rgba(250,245,255,0.95),rgba(255,255,255,1)_42%)] dark:bg-[radial-gradient(circle_at_top,rgba(217,70,239,0.25),transparent_35%),linear-gradient(180deg,rgba(46,16,101,0.7),rgba(2,6,23,1)_46%)]",
      hero: "border-fuchsia-200 bg-fuchsia-50/80 dark:border-fuchsia-900/70 dark:bg-fuchsia-950/30",
      panel: "bg-white/80 backdrop-blur dark:bg-slate-950/70",
      card: "border-fuchsia-200 bg-white/90 hover:border-fuchsia-500 dark:border-fuchsia-900 dark:bg-slate-950/80",
      badge: "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950 dark:text-fuchsia-200",
    };
  }

  return publicationVisualTheme(null);
}

// ---- PBN internal-linking network ----
//
// Each category links to related categories across publications. Niche
// categories stay isolated to their own publication; news flows everywhere.
// This builds the inter-publication link network for SEO authority transfer.

export interface CategoryLink {
  name: string;
  publication: string; // publication key (subdomain)
  url: string; // /articles?category=...
}

// Category -> which publication subdomain owns it (primary home).
const CATEGORY_HOME: Record<string, string> = {
  Physics: "science",
  Chemistry: "science",
  Biology: "science",
  "Artificial Intelligence": "ai",
  "AI Tools": "ai",
  "Machine Learning": "ai",
  Programming: "tech",
  "Cloud & DevOps": "tech",
  Cybersecurity: "tech",
  "Repo Reviews": "news",
  "Open Source": "news",
  "FOSS Updates": "news",
  Tutorials: "knowledge",
  Guides: "knowledge",
  Reviews: "news",
  News: "news",
};

// Categories that appear on EVERY publication (news is global per spec).
const GLOBAL_CATEGORIES = ["News", "Open Source", "Repo Reviews"];

// Per-category related categories for cross-linking.
const CATEGORY_RELATED: Record<string, string[]> = {
  Physics: ["Chemistry", "Tutorials", "Artificial Intelligence"],
  Chemistry: ["Physics", "Tutorials", "Cloud & DevOps"],
  "Artificial Intelligence": ["Machine Learning", "Tutorials", "Programming"],
  Programming: ["Tutorials", "Cloud & DevOps", "Artificial Intelligence"],
  "Cloud & DevOps": ["Programming", "Cybersecurity", "Tutorials"],
  "Open Source": ["Repo Reviews", "Programming", "FOSS Updates"],
  Tutorials: ["Guides", "Programming", "Physics"],
  Guides: ["Tutorials", "Open Source"],
  "Repo Reviews": ["Open Source", "FOSS Updates", "Programming"],
};

// Get the categories a publication should show: its own niche categories
// plus the global (news) categories that appear everywhere.
export function publicationCategories(pub: Publication | null): string[] {
  if (!pub) return [];
  const owned = pub.categories;
  const globalOnes = GLOBAL_CATEGORIES.filter((c) => !owned.includes(c));
  return [...owned, ...globalOnes];
}

// Build the category link network for a publication's article page.
export function categoryLinkNetwork(pub: Publication | null): CategoryLink[] {
  if (!pub) return [];
  const visible = publicationCategories(pub);
  const links: CategoryLink[] = [];
  for (const cat of visible) {
    const homePub = CATEGORY_HOME[cat] || pub.key;
    links.push({
      name: cat,
      publication: homePub,
      url: homePub === pub.key ? `/articles?category=${encodeURIComponent(cat.toLowerCase().replace(/\s+/g, "-"))}` : `https://${homePub}.openguidehub.org/articles?category=${encodeURIComponent(cat.toLowerCase().replace(/\s+/g, "-"))}`,
    });
  }
  return links;
}

// Related categories for the article detail "related" block.
export function relatedCategoriesFor(category: string): CategoryLink[] {
  const related = CATEGORY_RELATED[category] || [];
  return related.map((name) => {
    const homePub = CATEGORY_HOME[name] || "knowledge";
    return {
      name,
      publication: homePub,
      url: `https://${homePub}.openguidehub.org/articles?category=${encodeURIComponent(name.toLowerCase().replace(/\s+/g, "-"))}`,
    };
  });
}

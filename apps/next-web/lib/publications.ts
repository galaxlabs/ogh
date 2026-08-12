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
    categories: ["Physics", "Chemistry"],
  },
  tech: {
    key: "tech",
    code: "TECH",
    name: "OpenGuideHub Tech",
    subdomain: "tech",
    primaryHostname: "tech.openguidehub.org",
    tagline: "Programming, cloud, devops, and developer tools.",
    defaultLanguage: "en",
    categories: ["Programming", "Cloud & DevOps"],
  },
  ai: {
    key: "ai",
    code: "AI_TOOLS",
    name: "OpenGuideHub AI",
    subdomain: "ai",
    primaryHostname: "ai.openguidehub.org",
    tagline: "Artificial intelligence, agents, and AI tooling.",
    defaultLanguage: "en",
    categories: ["Artificial Intelligence"],
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

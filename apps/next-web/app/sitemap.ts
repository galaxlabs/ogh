import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { articles, categories } from "@/lib/data";

const STATIC_ROUTES = [
  "",
  "/articles",
  "/categories",
  "/tutorials",
  "/reviews",
  "/science",
  "/technology",
  "/open-source",
  "/downloads",
  "/roadmap.sh",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/disclaimer",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticEntries = STATIC_ROUTES.map((route) => ({
    url: `${SITE.url}${route}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : 0.7,
  }));

  const articleEntries = articles.map((article) => ({
    url: `${SITE.url}/articles/${article.slug}`,
    lastModified: article.publishDate ? new Date(article.publishDate) : now,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const categoryEntries = categories.map((category) => ({
    url: `${SITE.url}/categories#${category.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticEntries, ...articleEntries, ...categoryEntries];
}

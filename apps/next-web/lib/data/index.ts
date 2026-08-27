import type { Article, Category, DownloadResource, DownloadCategory } from "./types";

// The raw JS data files are imported directly (Next.js supports ESM .js imports).
// Re-export with types for a typed surface across the app.
import { articles as rawArticles } from "./articles.js";
import { categories as rawCategories } from "./articles.js";
import { downloadResources as rawDownloads } from "./downloads.js";
import { downloadCategories as rawDownloadCategories } from "./downloads.js";
import { translations as rawTranslations, getTranslation as rawGetTranslation } from "./i18n.js";

export const articles = rawArticles as Article[];
export const categories = rawCategories as Category[];
export const downloadResources = rawDownloads as DownloadResource[];
export const downloadCategories = rawDownloadCategories as DownloadCategory[];
export const translations = rawTranslations;
export const getTranslation = rawGetTranslation;

export type { Article, Category, DownloadResource, DownloadCategory, Author } from "./types";

export function slugifyCategoryName(name: string): string {
	return name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function slugifyCategory(value: string): string {
	return slugifyCategoryName(value);
}

export interface CategoryStats extends Category {
	count: number;
}

export function buildCategoryStats(baseCategories: Category[], articleList: Article[]): CategoryStats[] {
	return baseCategories.map((cat) => ({
		...cat,
		count: articleList.filter(
			(a) => slugifyCategoryName(a.category) === cat.slug
		).length,
	}));
}

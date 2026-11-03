export interface Author {
	name: string;
	avatar: string;
	bio: string;
}

export interface Article {
	id: number;
	slug: string;
	title: string;
	excerpt: string;
	content: string;
	image: string;
	category: string;
	/** Topic slug from the Content Category tree, empty for legacy entries. */
	topic?: string;
	/** Language of this version, for example English, Arabic, or Urdu. */
	language?: string;
	/** Other language versions of the same article. */
	translations?: { name: string; title: string; slug: string; language?: string }[];
	tags: string[];
	readingTime: number;
	publishDate: string;
	author: Author;
	featured: boolean;
}

export interface Category {
	id: number;
	name: string;
	slug: string;
	description: string;
	icon: string;
}

export interface DownloadResource {
	id: number;
	category: string;
	title: string;
	type: string;
	description: string;
	format: string;
	size: string;
	href: string;
}

export interface DownloadCategory {
	title: string;
	description: string;
}

export interface LanguageSwitcherProps {
	currentLanguage: string;
	onLanguageChange: (lang: string) => void;
}

export interface Translation {
	[key: string]: unknown;
}

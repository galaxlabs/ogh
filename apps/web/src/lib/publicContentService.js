const PUBLIC_API_BASE = import.meta.env.VITE_PUBLIC_CONTENT_API_URL || '';
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80';

export function normalizePublicArticle(article) {
  const content = String(article?.content || '');
  const authorName = article?.author?.name || article?.author || 'OpenClaw Agent';

  return {
    id: article?.id || `remote-${article?.slug || Date.now()}`,
    slug: article?.slug,
    title: article?.title || 'Untitled Post',
    excerpt: article?.excerpt || 'Imported content from the publishing pipeline.',
    content,
    image: article?.image || FALLBACK_IMAGE,
    category: article?.category || 'Imported',
    tags: Array.isArray(article?.tags)
      ? article.tags
      : String(article?.tags || '')
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
    readingTime: article?.readingTime || Math.max(1, Math.ceil(content.split(/\s+/).filter(Boolean).length / 200)),
    publishDate: article?.publishDate || new Date().toISOString(),
    author: {
      name: authorName,
      avatar: authorName.slice(0, 2).toUpperCase(),
      bio: article?.author?.bio || 'Auto-published content from connected channels.',
    },
    featured: Boolean(article?.featured),
  };
}

export async function fetchPublicPosts() {
  try {
    const response = await fetch(`${PUBLIC_API_BASE}/api/public/posts`);
    if (!response.ok) {
      return [];
    }
    const data = await response.json();
    return Array.isArray(data) ? data.map(normalizePublicArticle) : [];
  } catch {
    return [];
  }
}

export async function fetchPublicPostBySlug(slug) {
  if (!slug) return null;

  try {
    const response = await fetch(`${PUBLIC_API_BASE}/api/public/posts?slug=${encodeURIComponent(slug)}`);
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return normalizePublicArticle(data);
  } catch {
    return null;
  }
}

export function mergeArticles(staticArticles = [], remoteArticles = []) {
  const merged = new Map();

  [...remoteArticles, ...staticArticles].forEach((article) => {
    if (article?.slug && !merged.has(article.slug)) {
      merged.set(article.slug, article);
    }
  });

  return Array.from(merged.values());
}

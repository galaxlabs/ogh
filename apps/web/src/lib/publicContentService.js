function sanitizeCoverText(value = '', maxLength = 56) {
  return Array.from(String(value || '').replace(/[\uD800-\uDFFF]/g, ''))
    .join('')
    .replace(/[<&>]/g, '')
    .slice(0, maxLength) || 'OpenGuideHub';
}

function buildGeneratedCover(title = 'OpenGuideHub', category = 'Technology') {
  const safeTitle = sanitizeCoverText(title, 56);
  const safeCategory = sanitizeCoverText(category, 24);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="#0f172a"/><stop offset="100%" stop-color="#2563eb"/></linearGradient></defs><rect width="1200" height="630" fill="url(#g)"/><text x="72" y="130" fill="#cbd5e1" font-size="28" font-family="Arial, Helvetica, sans-serif">OpenGuideHub</text><text x="72" y="220" fill="#fff" font-size="52" font-weight="700" font-family="Arial, Helvetica, sans-serif">${safeTitle}</text><text x="72" y="290" fill="#e2e8f0" font-size="28" font-family="Arial, Helvetica, sans-serif">${safeCategory}</text></svg>`;
  try {
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  } catch {
    return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjAwIiBoZWlnaHQ9IjYzMCI+PHJlY3Qgd2lkdGg9IjEyMDAiIGhlaWdodD0iNjMwIiBmaWxsPSIjMGYxNzJhIi8+PHRleHQgeD0iNzAiIHk9IjE0MCIgZmlsbD0iI2ZmZiIgZm9udC1zaXplPSI1MiI+T3Blbkd1aWRlSHViPC90ZXh0Pjwvc3ZnPg==';
  }
}

function normalizeBase(base = '') {
  return String(base || '').trim().replace(/\/+$/, '');
}

function getCandidateBases() {
  const configured = normalizeBase(import.meta.env.VITE_PUBLIC_CONTENT_API_URL || '');
  const bases = [];

  if (configured) {
    bases.push(configured);
  }

  if (typeof window !== 'undefined') {
    const { hostname, origin } = window.location;

    if (/localhost|127\.0\.0\.1/.test(hostname)) {
      bases.push(normalizeBase(origin), 'http://127.0.0.1:3100', '');
    } else {
      bases.push(normalizeBase(origin), 'https://api.openguidehub.org');
    }
  }

  return [...new Set(bases.filter(Boolean))];
}

export function normalizePublicArticle(article) {
  const content = String(article?.content || '');
  const authorName = article?.author?.name || article?.author || 'OpenClaw Agent';

  return {
    id: article?.id || `remote-${article?.slug || Date.now()}`,
    slug: article?.slug,
    title: article?.title || 'Untitled Post',
    excerpt: article?.excerpt || 'Imported content from the publishing pipeline.',
    content,
    image: article?.image || buildGeneratedCover(article?.title, article?.category || 'Imported'),
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
  for (const base of getCandidateBases()) {
    try {
      const response = await fetch(`${base}/api/public/posts`, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        continue;
      }
      const data = await response.json();
      return Array.isArray(data) ? data.map(normalizePublicArticle) : [];
    } catch {
      continue;
    }
  }

  return [];
}

export async function fetchPublicPostBySlug(slug) {
  if (!slug) return null;

  for (const base of getCandidateBases()) {
    try {
      const response = await fetch(`${base}/api/public/posts/${encodeURIComponent(slug)}`, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        continue;
      }
      const data = await response.json();
      return normalizePublicArticle(data);
    } catch {
      continue;
    }
  }

  return null;
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

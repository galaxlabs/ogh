function slugifyCategoryName(value = '') {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function titleCase(value = '') {
  return String(value)
    .split(/[-\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function inferCategoryIcon(name = '') {
  const raw = String(name).toLowerCase();
  if (raw.includes('ai') || raw.includes('intelligence')) return 'Brain';
  if (raw.includes('security') || raw.includes('cyber')) return 'Shield';
  if (raw.includes('open source') || raw.includes('foss') || raw.includes('repo')) return 'GitBranch';
  if (raw.includes('tool') || raw.includes('software')) return 'Package';
  if (raw.includes('cloud') || raw.includes('devops')) return 'Cloud';
  if (raw.includes('program') || raw.includes('web')) return 'Code';
  if (raw.includes('tutorial') || raw.includes('guide')) return 'BookOpen';
  return 'Code';
}

export function buildCategoryStats(baseCategories = [], articles = []) {
  const counts = new Map();
  const categoryMap = new Map();

  baseCategories.forEach((category) => {
    categoryMap.set(category.slug, { ...category });
  });

  articles.forEach((article) => {
    const rawCategory = String(article?.category || '').trim();
    const slug = slugifyCategoryName(rawCategory);
    if (!slug) return;
    counts.set(slug, (counts.get(slug) || 0) + 1);

    if (!categoryMap.has(slug)) {
      categoryMap.set(slug, {
        id: `dynamic-${slug}`,
        name: rawCategory || titleCase(slug),
        slug,
        description: `Latest posts about ${rawCategory || titleCase(slug)}.`,
        icon: inferCategoryIcon(rawCategory || slug),
      });
    }
  });

  return Array.from(categoryMap.values())
    .map((category) => ({
      ...category,
      count: counts.get(category.slug) || 0,
    }))
    .filter((category) => category.count > 0 || baseCategories.some((item) => item.slug === category.slug))
    .sort((a, b) => (b.count - a.count) || a.name.localeCompare(b.name));
}

export function buildSubcategoryStats(articles = [], limit = 18) {
  const counts = new Map();

  articles.forEach((article) => {
    (article?.tags || []).forEach((tag) => {
      const clean = String(tag || '').trim();
      if (!clean) return;
      counts.set(clean, (counts.get(clean) || 0) + 1);
    });
  });

  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, slug: slugifyCategoryName(name), count }))
    .sort((a, b) => (b.count - a.count) || a.name.localeCompare(b.name))
    .slice(0, limit);
}

export function slugifyCategory(value = '') {
  return slugifyCategoryName(value);
}

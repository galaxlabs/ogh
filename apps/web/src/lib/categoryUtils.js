function slugifyCategoryName(value = '') {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function buildCategoryStats(baseCategories = [], articles = []) {
  const counts = new Map();

  articles.forEach((article) => {
    const slug = slugifyCategoryName(article?.category || '');
    if (!slug) return;
    counts.set(slug, (counts.get(slug) || 0) + 1);
  });

  return baseCategories.map((category) => ({
    ...category,
    count: counts.get(category.slug) || 0,
  }));
}

export function slugifyCategory(value = '') {
  return slugifyCategoryName(value);
}

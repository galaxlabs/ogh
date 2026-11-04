/** Exclude articles when indexability is unknown or explicitly disabled. */
export function isSitemapIndexable(article: { noindex?: number | null }): boolean {
  return article.noindex === 0;
}

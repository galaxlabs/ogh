"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArticleCard } from "@/components/article-card";
import { SearchBar } from "@/components/search-bar";
import { CategoryFilter } from "@/components/category-filter";
import { Sidebar } from "@/components/sidebar";
import { useLanguage } from "@/components/language-provider";
import { useViewMode, ViewModeToggle } from "@/components/view-mode-toggle";
import type { Article, CategoryStats } from "@/lib/data";
import type { CategoryNode } from "@/lib/galaxy-ops-api";
import { findCategoryNode, flattenCategoryTree } from "@/lib/cms";

const PAGE_SIZE = 12;

function slugifyCategoryName(value: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function ArticlesExplorer({
  articles,
  categoryStats,
  categoryTree,
}: {
  articles: Article[];
  categoryStats: CategoryStats[];
  categoryTree: CategoryNode[];
}) {
  const searchParams = useSearchParams();
  const { translations } = useLanguage();
  const common = translations?.common || {};

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || "all"
  );
  const [viewMode, setViewMode] = useViewMode("grid");
  const [page, setPage] = useState(1);

  const matchingTopics = useMemo(() => {
    const node = findCategoryNode(categoryTree, selectedCategory);
    return node ? new Set(flattenCategoryTree([node]).map((item) => item.slug)) : new Set([selectedCategory]);
  }, [categoryTree, selectedCategory]);

  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      const matchesSearch =
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" ||
        matchingTopics.has(article.topic || slugifyCategoryName(article.category));
      return matchesSearch && matchesCategory;
    });
  }, [articles, searchQuery, selectedCategory, matchingTopics]);

  const sortedArticles = useMemo(
    () =>
      [...filteredArticles].sort(
        (a, b) =>
          new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
      ),
    [filteredArticles]
  );
  const totalPages = Math.max(1, Math.ceil(sortedArticles.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleArticles = sortedArticles.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="grid gap-12 lg:grid-cols-3">
      <div className="space-y-8 lg:col-span-2">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <SearchBar
                value={searchQuery}
                onChange={(value) => { setSearchQuery(value); setPage(1); }}
                placeholder={common.search}
                onSearch={(q) => { setSearchQuery(q); setPage(1); }}
              />
            </div>
            <ViewModeToggle mode={viewMode} onChange={setViewMode} />
          </div>
          <CategoryFilter
            categories={categoryStats.filter((category) => category.count > 0).slice(0, 12)}
            selectedCategory={selectedCategory}
            onCategoryChange={(value) => { setSelectedCategory(value); setPage(1); }}
            allLabel={common.all || "All"}
          />
        </div>

        {sortedArticles.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-lg text-muted-foreground">
              {common.noResults || "No articles found"}
            </p>
          </div>
        ) : (
          <>
            <div className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, sortedArticles.length)} of {sortedArticles.length} articles
            </div>
            {viewMode === "grid" ? (
              <div className="grid gap-6 sm:grid-cols-2">
                {visibleArticles.map((article, index) => (
                  <ArticleCard key={article.id} article={article} index={index} />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {visibleArticles.map((article, index) => (
                  <ArticleCard key={article.id} article={article} index={index} variant="list" />
                ))}
              </div>
            )}
            {totalPages > 1 && (
              <nav aria-label="Article pages" className="flex flex-wrap items-center gap-2">
                <button type="button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} className="rounded-md border px-3 py-2 text-sm disabled:opacity-40">Previous</button>
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => (
                  <button key={number} type="button" aria-current={number === currentPage ? "page" : undefined} onClick={() => setPage(number)} className={`rounded-md border px-3 py-2 text-sm ${number === currentPage ? "bg-primary text-primary-foreground" : ""}`}>{number}</button>
                ))}
                <button type="button" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)} className="rounded-md border px-3 py-2 text-sm disabled:opacity-40">Next</button>
              </nav>
            )}
          </>
        )}
      </div>

      <div className="lg:col-span-1">
        <Sidebar popularPosts={articles} categories={categoryStats} />
      </div>
    </div>
  );
}

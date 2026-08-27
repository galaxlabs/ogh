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

function slugifyCategoryName(value: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function ArticlesExplorer({
  articles,
  categoryStats,
}: {
  articles: Article[];
  categoryStats: CategoryStats[];
}) {
  const searchParams = useSearchParams();
  const { translations } = useLanguage();
  const common = translations?.common || {};

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || "all"
  );
  const [viewMode, setViewMode] = useViewMode("grid");

  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      const matchesSearch =
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" ||
        slugifyCategoryName(article.category) === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [articles, searchQuery, selectedCategory]);

  const sortedArticles = useMemo(
    () =>
      [...filteredArticles].sort(
        (a, b) =>
          new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
      ),
    [filteredArticles]
  );

  return (
    <div className="grid gap-12 lg:grid-cols-3">
      <div className="space-y-8 lg:col-span-2">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder={common.search}
                onSearch={(q) => setSearchQuery(q)}
              />
            </div>
            <ViewModeToggle mode={viewMode} onChange={setViewMode} />
          </div>
          <CategoryFilter
            categories={categoryStats.slice(0, 12)}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
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
              Showing {sortedArticles.length}{" "}
              {sortedArticles.length === 1 ? "article" : "articles"}
            </div>
            {viewMode === "grid" ? (
              <div className="grid gap-6 sm:grid-cols-2">
                {sortedArticles.map((article, index) => (
                  <ArticleCard key={article.id} article={article} index={index} />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {sortedArticles.map((article, index) => (
                  <ArticleCard key={article.id} article={article} index={index} variant="list" />
                ))}
              </div>
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

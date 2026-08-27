"use client";

import { useMemo, useState } from "react";
import { ArticleCard } from "@/components/article-card";
import { SearchBar } from "@/components/search-bar";
import { useLanguage } from "@/components/language-provider";
import type { Article } from "@/lib/data";

export function TopicExplorer({
  articles,
}: {
  articles: Article[];
}) {
  const { translations } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(
    () =>
      articles.filter(
        (article) =>
          article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [articles, searchQuery]
  );

  return (
    <>
      <div className="mb-8 max-w-xl">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search..."
          onSearch={(q) => setSearchQuery(q)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-lg text-muted-foreground">
            {translations?.common?.noResults || "No articles found"}
          </p>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((article, index) => (
            <ArticleCard key={article.id} article={article} index={index} />
          ))}
        </div>
      )}
    </>
  );
}

export function TopicPageShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="mb-4 text-4xl font-bold md:text-5xl">{title}</h1>
        <p className="max-w-2xl text-lg text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}

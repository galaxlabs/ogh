"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { ArticleCard } from "@/components/article-card";
import { SearchBar } from "@/components/search-bar";
import type { SearchResult } from "@/lib/search-client";

export function SearchResults() {
  const searchParams = useSearchParams();

  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<string>("");
  const [searched, setSearched] = useState(false);
  const scheduled = useRef(false);

  const doSearch = async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results || []);
      setSource(data.source || "local");
    } catch {
      setResults([]);
      setSource("error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery && !scheduled.current) {
      scheduled.current = true;
      const timer = setTimeout(() => doSearch(initialQuery), 0);
      return () => clearTimeout(timer);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (q: string) => {
    setQuery(q);
    doSearch(q);
  };

  return (
    <div className="space-y-8">
      <div className="max-w-xl">
        <SearchBar
          value={query}
          onChange={setQuery}
          onSearch={handleSearch}
          placeholder={"Search articles..."}
        />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {!loading && searched && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {results.length === 0
                ? `No results for "${query}"`
                : `Found ${results.length} result${results.length === 1 ? "" : "s"} for "${query}"`}
            </p>
            {source === "meilisearch" && (
              <span className="text-xs text-muted-foreground">Powered by MeiliSearch</span>
            )}
          </div>

          {results.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((result, index) => (
                <ArticleCard
                  key={result.slug}
                  article={{
                    id: 0,
                    slug: result.slug,
                    title: result.title,
                    excerpt: result.excerpt,
                    category: result.category,
                    image: result.image,
                    readingTime: result.readingTime || 1,
                    publishDate: result.publishDate,
                    featured: false,
                    tags: [],
                    author: { name: result.author, avatar: "", bio: "" },
                    content: result.excerpt,
                  }}
                  index={index}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

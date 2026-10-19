"use client";

import { useState, useEffect } from "react";
import { StoryCard } from "@/components/story-card";
import { listStories, searchStories } from "@/lib/stories-api";
import type { StoryResult, StoryCategory } from "@/lib/stories-api";

interface StoriesExplorerProps {
  categories: StoryCategory[];
}

export function StoriesExplorer({ categories }: StoriesExplorerProps) {
  const [stories, setStories] = useState<StoryResult[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | undefined>();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const selectCategory = (category?: string) => {
    if (category === activeCategory) return;
    setLoading(true);
    setQuery("");
    setActiveCategory(category);
  };

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      const request = query.trim() ? searchStories(query.trim()) : listStories(activeCategory);
      request.then((data) => {
        if (!cancelled) {
          setStories(data);
          setLoading(false);
        }
      });
    }, query.trim() ? 250 : 0);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [activeCategory, query]);

  return (
    <div>
      <label htmlFor="story-search" className="mb-2 block text-sm font-medium">Search stories</label>
      <input
        id="story-search"
        type="search"
        value={query}
        onChange={(event) => { setLoading(true); setActiveCategory(undefined); setQuery(event.target.value); }}
        placeholder="Search titles, authors and historical periods"
        className="mb-6 w-full rounded-md border bg-background px-4 py-3"
      />
      {categories.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <button
            onClick={() => selectCategory(undefined)}
            className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
              !activeCategory ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => selectCategory(cat.name)}
              className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                activeCategory === cat.name
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              {cat.category_name}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : stories.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-lg text-muted-foreground">No stories yet. Check back soon!</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((story, i) => (
            <StoryCard key={story.slug} story={story} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

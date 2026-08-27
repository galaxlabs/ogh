"use client";

import { useState } from "react";
import { CategoryCard } from "@/components/category-card";
import { SearchBar } from "@/components/search-bar";
import { useLanguage } from "@/components/language-provider";
import { useViewMode, ViewModeToggle } from "@/components/view-mode-toggle";
import { categoryHref } from "@/lib/cms";
import type { CategoryNode } from "@/lib/cms";
import type { CategoryStats } from "@/lib/data";

interface CategoriesExplorerProps {
  categories: CategoryStats[];
  nodes?: CategoryNode[];
  currentSubdomain?: string | null;
}

export function CategoriesExplorer({
  categories,
  nodes = [],
  currentSubdomain = null,
}: CategoriesExplorerProps) {
  const { translations } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useViewMode("grid");

  // Map node slug -> node for href/subdomain lookups.
  const nodeBySlug = new Map<string, CategoryNode>();
  const walk = (list: CategoryNode[]) => {
    for (const n of list) {
      nodeBySlug.set(n.slug, n);
      if (n.children && n.children.length) walk(n.children);
    }
  };
  walk(nodes);

  const filteredCategories = categories.filter(
    (category) =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="max-w-xl flex-1">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search categories..."
            onSearch={(q) => setSearchQuery(q)}
          />
        </div>
        <ViewModeToggle mode={viewMode} onChange={setViewMode} />
      </div>

      {filteredCategories.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-lg text-muted-foreground">
            {translations?.common?.noResults || "No categories found"}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredCategories.map((category, index) => {
            const node = nodeBySlug.get(category.slug);
            const href = node ? categoryHref(node, currentSubdomain) : undefined;
            const external = Boolean(node?.subdomain && node.subdomain !== currentSubdomain);
            const childCount = node?.children?.length || 0;
            return (
              <CategoryCard
                key={category.id}
                category={category}
                index={index}
                href={href}
                external={external}
                childCount={childCount}
              />
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCategories.map((category, index) => {
            const node = nodeBySlug.get(category.slug);
            const href = node ? categoryHref(node, currentSubdomain) : undefined;
            const external = Boolean(node?.subdomain && node.subdomain !== currentSubdomain);
            const childCount = node?.children?.length || 0;
            return (
              <CategoryCard
                key={category.id}
                category={category}
                index={index}
                href={href}
                external={external}
                childCount={childCount}
              />
            );
          })}
        </div>
      )}
    </>
  );
}

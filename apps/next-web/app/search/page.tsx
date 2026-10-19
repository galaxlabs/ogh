import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteShell } from "@/components/site-shell";
import { SearchResults } from "@/components/search-results";

export const metadata: Metadata = {
  title: "Search",
  description: "Search articles across OpenGuideHub",
  alternates: { canonical: "/search" },
};

export default function SearchPage() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="mb-2 text-4xl font-bold md:text-5xl">Search</h1>
        <p className="mb-8 max-w-2xl text-lg text-muted-foreground">
          Find articles, guides, and tutorials across all publications.
        </p>
        <Suspense fallback={<div className="py-12 text-center text-muted-foreground">Loading search...</div>}>
          <SearchResults />
        </Suspense>
      </div>
    </SiteShell>
  );
}

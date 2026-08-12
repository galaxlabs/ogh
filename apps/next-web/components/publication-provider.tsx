"use client";

import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import type { Publication } from "@/lib/publications";
import { filterArticlesForPublication } from "@/lib/publications";
import type { Article } from "@/lib/data";

interface PublicationContextValue {
  publication: Publication | null;
  isPublicationSubdomain: boolean;
  filteredArticles: (articles?: Article[]) => Article[];
}

const PublicationContext = createContext<PublicationContextValue | null>(null);

export function PublicationProvider({
  publication,
  children,
}: {
  publication: Publication | null;
  children: ReactNode;
}) {
  const value = useMemo<PublicationContextValue>(
    () => ({
      publication,
      isPublicationSubdomain: Boolean(publication),
      filteredArticles: (articles) => filterArticlesForPublication(publication, articles),
    }),
    [publication]
  );

  return <PublicationContext.Provider value={value}>{children}</PublicationContext.Provider>;
}

export function usePublication() {
  const context = useContext(PublicationContext);
  if (!context) {
    throw new Error("usePublication must be used within a PublicationProvider");
  }
  return context;
}

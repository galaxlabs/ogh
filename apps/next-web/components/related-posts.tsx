"use client";

import { ArticleCard } from "@/components/article-card";
import type { Article } from "@/lib/data";
import { useLanguage } from "@/components/language-provider";

interface RelatedPostsProps {
  articles: Article[];
  currentArticleId: number;
  title?: string;
}

export function RelatedPosts({ articles, currentArticleId, title }: RelatedPostsProps) {
  const { translations } = useLanguage();
  const relatedArticles = articles
    .filter((article) => article.id !== currentArticleId)
    .slice(0, 3);

  if (relatedArticles.length === 0) return null;

  return (
    <section className="mt-16">
      <h2 className="mb-8 text-3xl font-bold">
        {title || translations?.common?.relatedPosts || "Related Posts"}
      </h2>
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {relatedArticles.map((article, index) => (
          <ArticleCard key={article.id} article={article} index={index} />
        ))}
      </div>
    </section>
  );
}

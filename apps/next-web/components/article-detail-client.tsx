"use client";

import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, Calendar } from "lucide-react";
import { Breadcrumb } from "@/components/breadcrumb";
import { AuthorBox } from "@/components/author-box";
import { RelatedPosts } from "@/components/related-posts";
import { Sidebar } from "@/components/sidebar";
import { AiReader } from "@/components/ai-reader";
import { MarkdownArticle, stripRepeatedTitleFromContent } from "@/components/markdown-article";
import { useLanguage } from "@/components/language-provider";
import { useReadability, ReadabilityToggle, readabilityClasses } from "@/components/readability-toggle";
import { formatFullDate } from "@/lib/date";
import type { Article, CategoryStats } from "@/lib/data";

export function ArticleDetailClient({
  article,
  allArticles,
  categoryStats,
}: {
  article: Article;
  allArticles: Article[];
  categoryStats: CategoryStats[];
}) {
  const { currentLanguage, translations } = useLanguage();
  const [readability, setReadability] = useReadability();

  const locale = currentLanguage === "ur" ? "ur-PK" : currentLanguage === "ar" ? "ar-SA" : "en-US";
  const relatedArticles = allArticles
    .filter((a) => a.category === article.category && a.id !== article.id)
    .slice(0, 3);

  const articleContent = stripRepeatedTitleFromContent(article.content, article.title);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <article>
        <div className="grid gap-12 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Breadcrumb
              items={[
                { label: translations?.nav?.articles || "Articles", href: "/articles" },
                { label: article.title },
              ]}
            />

            <div className="mb-8">
              <Badge className="mb-4">{article.category}</Badge>
              <h1 className="mb-6 text-4xl font-bold md:text-5xl">{article.title}</h1>

              <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{article.readingTime} min read</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{formatFullDate(article.publishDate, locale)}</span>
                </div>
                <div className="ml-auto">
                  <ReadabilityToggle level={readability} onChange={setReadability} />
                </div>
              </div>
            </div>

            <Image
              src={article.image}
              alt={article.title}
              width={1200}
              height={675}
              priority
              className="mb-8 aspect-video w-full rounded-2xl object-cover"
            />

            <div className="mb-8">
              <AiReader article={article} />
            </div>

            <div className={`prose-article mb-12 ${readabilityClasses(readability)}`}>
              <MarkdownArticle content={articleContent} />
            </div>

            {article.tags && article.tags.length > 0 && (
              <div className="mb-8 flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/articles?tag=${encodeURIComponent(
                      tag.toLowerCase().replace(/[^a-z0-9]+/g, "-")
                    )}`}
                  >
                    <Badge
                      variant="secondary"
                      className="transition-colors hover:bg-primary hover:text-primary-foreground"
                    >
                      {tag}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}

            <Separator className="my-12" />

            <AuthorBox author={article.author} />

            <Separator className="my-12" />

            {relatedArticles.length > 0 && (
              <RelatedPosts articles={relatedArticles} currentArticleId={article.id} />
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Sidebar popularPosts={allArticles} categories={categoryStats} />
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { formatDate } from "@/lib/date";
import type { Article } from "@/lib/data";

interface ArticleCardProps {
  article: Article;
  index?: number;
  locale?: string;
  variant?: "grid" | "list";
}

export function ArticleCard({ article, index = 0, locale = "en-US", variant = "grid" }: ArticleCardProps) {
  if (variant === "list") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.04 }}
      >
        <Card className="transition-all duration-200 hover:border-primary/40 hover:shadow-md">
          <Link href={`/articles/${article.slug}`} className="flex gap-4 p-4 sm:gap-5">
            <Image
              src={article.image}
              alt={article.title}
              width={240}
              height={135}
              className="h-24 w-36 shrink-0 rounded-lg object-cover sm:h-28 sm:w-44"
            />
            <div className="flex flex-1 flex-col justify-center">
              <div className="mb-1.5 flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px]">
                  {article.category}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{article.readingTime} min read</span>
                </div>
              </div>
              <h3 className="mb-1 line-clamp-2 text-base font-semibold transition-colors hover:text-primary sm:text-lg">
                {article.title}
              </h3>
              <p className="mb-1.5 line-clamp-2 text-sm text-muted-foreground">{article.excerpt}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{formatDate(article.publishDate, locale)}</span>
                <span className="inline-flex items-center gap-1 text-primary">
                  Read
                  <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          </Link>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="h-full"
    >
      <Card className="flex h-full flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
        <Link href={`/articles/${article.slug}`} className="block">
          <Image
            src={article.image}
            alt={article.title}
            width={800}
            height={450}
            className="aspect-video w-full rounded-t-xl object-cover"
          />
        </Link>
        <CardContent className="flex flex-1 flex-col p-6">
          <div className="mb-3 flex items-center gap-2">
            <Badge variant="secondary">{article.category}</Badge>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{article.readingTime} min read</span>
            </div>
          </div>
          <Link href={`/articles/${article.slug}`}>
            <h3 className="mb-2 line-clamp-2 text-xl font-semibold transition-colors hover:text-primary">
              {article.title}
            </h3>
          </Link>
          <p className="mb-3 line-clamp-3 flex-1 text-sm text-muted-foreground">{article.excerpt}</p>
          {Array.isArray(article.tags) && article.tags.length > 0 ? (
            <div className="mb-4 flex flex-wrap gap-1">
              {article.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="outline" className="text-[10px]">
                  {tag}
                </Badge>
              ))}
            </div>
          ) : null}
          <div className="mt-auto text-xs text-muted-foreground">
            {formatDate(article.publishDate, locale)}
          </div>
        </CardContent>
        <CardFooter className="p-6 pt-0">
          <Link href={`/articles/${article.slug}`} className="w-full">
            <Button variant="ghost" className="w-full gap-2 group">
              Read More
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

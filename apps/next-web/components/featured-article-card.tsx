import Link from "next/link";
import Image from "next/image";
import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/date";
import type { Article } from "@/lib/data";

interface FeaturedArticleCardProps {
  article: Article;
  large?: boolean;
  locale?: string;
}

export function FeaturedArticleCard({ article, large = false, locale = "en-US" }: FeaturedArticleCardProps) {
  return (
    <Link href={`/articles/${article.slug}`} className="block h-full">
      <Card className="group h-full overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-xl">
        <div className={`relative ${large ? "aspect-[4/3]" : "aspect-video"}`}>
          <Image
            src={article.image}
            alt={article.title}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          {article.featured && (
            <Badge className="absolute left-4 top-4 bg-primary text-primary-foreground">
              Featured
            </Badge>
          )}
        </div>
        <CardContent className="p-6">
          <div className="mb-3 flex items-center gap-2">
            <Badge variant="secondary">{article.category}</Badge>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{article.readingTime} min read</span>
            </div>
          </div>
          <h3
            className={`mb-2 line-clamp-2 font-bold transition-colors group-hover:text-primary ${
              large ? "text-2xl md:text-3xl" : "text-xl"
            }`}
          >
            {article.title}
          </h3>
          <p className={`line-clamp-2 text-muted-foreground ${large ? "text-base" : "text-sm"}`}>
            {article.excerpt}
          </p>
          {Array.isArray(article.tags) && article.tags.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-1">
              {article.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-[10px]">
                  {tag}
                </Badge>
              ))}
            </div>
          ) : null}
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium">{article.author.name}</span>
            <span>•</span>
            <span>{formatDate(article.publishDate, locale, { month: "short", day: "numeric" })}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

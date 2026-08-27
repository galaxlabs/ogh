import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Article } from "@/lib/data";

export function TrendingCard({ article, rank }: { article: Article; rank: number }) {
  return (
    <Link href={`/articles/${article.slug}`} className="group block">
      <div className="flex gap-4 rounded-xl p-4 transition-all duration-200 hover:bg-muted/50">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 font-bold text-primary">
          {rank}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">{article.category}</Badge>
            <TrendingUp className="h-3 w-3 text-muted-foreground" />
          </div>
          <h4 className="line-clamp-2 font-semibold transition-colors group-hover:text-primary">
            {article.title}
          </h4>
          <p className="mt-1 text-xs text-muted-foreground">{article.readingTime} min read</p>
        </div>
      </div>
    </Link>
  );
}

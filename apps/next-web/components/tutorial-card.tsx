import Link from "next/link";
import { BookOpen, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Article } from "@/lib/data";

export function TutorialCard({ article }: { article: Article }) {
  return (
    <Link href={`/articles/${article.slug}`} className="block h-full">
      <Card className="group h-full transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-secondary/10 p-3 transition-colors group-hover:bg-secondary/20">
              <BookOpen className="h-6 w-6 text-secondary" />
            </div>
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">{article.category}</Badge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{article.readingTime} min</span>
                </div>
              </div>
              <h3 className="mb-2 line-clamp-2 font-semibold transition-colors group-hover:text-primary">
                {article.title}
              </h3>
              <p className="line-clamp-2 text-sm text-muted-foreground">{article.excerpt}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

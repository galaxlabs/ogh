import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Article } from "@/lib/data";

const RATING = 4.5;

export function ReviewCard({ article }: { article: Article }) {
  return (
    <Link href={`/articles/${article.slug}`} className="block h-full">
      <Card className="group h-full transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
        <Image
          src={article.image}
          alt={article.title}
          width={640}
          height={400}
          className="aspect-[16/10] w-full rounded-t-xl object-cover"
        />
        <CardContent className="p-6">
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="secondary">{article.category}</Badge>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < Math.floor(RATING) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                  }`}
                />
              ))}
              <span className="ms-1 text-xs text-muted-foreground">{RATING}</span>
            </div>
          </div>
          <h3 className="mb-2 line-clamp-2 font-semibold transition-colors group-hover:text-primary">
            {article.title}
          </h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">{article.excerpt}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

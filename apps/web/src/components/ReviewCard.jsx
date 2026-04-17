
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';

function ReviewCard({ article }) {
  const rating = 4.5;

  return (
    <Link to={`/articles/${article.slug}`}>
      <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1 h-full group">
        <img
          src={article.image}
          alt={article.title}
          className="w-full aspect-[16/10] object-cover rounded-t-xl"
        />
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary">{article.category}</Badge>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                />
              ))}
              <span className="text-xs text-muted-foreground ml-1">{rating}</span>
            </div>
          </div>
          <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {article.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {article.excerpt}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

export default ReviewCard;

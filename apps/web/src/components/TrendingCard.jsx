
import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { TrendingUp } from 'lucide-react';

function TrendingCard({ article, rank }) {
  return (
    <Link to={`/articles/${article.slug}`} className="block group">
      <div className="flex gap-4 p-4 rounded-xl hover:bg-muted/50 transition-all duration-200">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary">
          {rank}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="secondary" className="text-xs">{article.category}</Badge>
            <TrendingUp className="h-3 w-3 text-muted-foreground" />
          </div>
          <h4 className="font-semibold group-hover:text-primary transition-colors line-clamp-2">
            {article.title}
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            {article.readingTime} min read
          </p>
        </div>
      </div>
    </Link>
  );
}

export default TrendingCard;

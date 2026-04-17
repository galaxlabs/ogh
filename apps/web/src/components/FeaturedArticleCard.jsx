
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

function FeaturedArticleCard({ article, large = false }) {
  return (
    <Link to={`/articles/${article.slug}`}>
      <Card className={`hover:shadow-xl transition-all duration-200 hover:-translate-y-1 h-full overflow-hidden group ${large ? 'lg:h-full' : ''}`}>
        <div className={`relative ${large ? 'aspect-[4/3]' : 'aspect-video'}`}>
          <img
            src={article.image}
            alt={article.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          {article.featured && (
            <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground">
              Featured
            </Badge>
          )}
        </div>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="secondary">{article.category}</Badge>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{article.readingTime} min read</span>
            </div>
          </div>
          <h3 className={`font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2 ${large ? 'text-2xl md:text-3xl' : 'text-xl'}`}>
            {article.title}
          </h3>
          <p className={`text-muted-foreground line-clamp-2 ${large ? 'text-base' : 'text-sm'}`}>
            {article.excerpt}
          </p>
          <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
            <span className="font-medium">{article.author.name}</span>
            <span>•</span>
            <span>{new Date(article.publishDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default FeaturedArticleCard;


import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Clock } from 'lucide-react';

function TutorialCard({ article }) {
  return (
    <Link to={`/articles/${article.slug}`}>
      <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1 h-full group">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-secondary/10 group-hover:bg-secondary/20 transition-colors">
              <BookOpen className="h-6 w-6 text-secondary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="text-xs">{article.category}</Badge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{article.readingTime} min</span>
                </div>
              </div>
              <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                {article.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {article.excerpt}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default TutorialCard;

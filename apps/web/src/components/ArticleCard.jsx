
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

function ArticleCard({ article, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="h-full"
    >
      <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1 h-full flex flex-col">
        <Link to={`/articles/${article.slug}`}>
          <img
            src={article.image}
            alt={article.title}
            className="w-full aspect-video object-cover rounded-t-xl"
          />
        </Link>
        <CardContent className="p-6 flex-1 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="secondary">{article.category}</Badge>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{article.readingTime} min read</span>
            </div>
          </div>
          <Link to={`/articles/${article.slug}`}>
            <h3 className="text-xl font-semibold mb-2 hover:text-primary transition-colors line-clamp-2">
              {article.title}
            </h3>
          </Link>
          <p className="text-sm text-muted-foreground line-clamp-3 flex-1 mb-3">
            {article.excerpt}
          </p>
          {Array.isArray(article.tags) && article.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1 mb-4">
              {article.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="outline" className="text-[10px]">
                  {tag}
                </Badge>
              ))}
            </div>
          ) : null}
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto">
            <span>{new Date(article.publishDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </CardContent>
        <CardFooter className="p-6 pt-0">
          <Link to={`/articles/${article.slug}`} className="w-full">
            <Button variant="ghost" className="w-full gap-2 group">
              Read More
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

export default ArticleCard;

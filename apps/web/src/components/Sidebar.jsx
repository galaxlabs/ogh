
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import NewsletterSignup from './NewsletterSignup.jsx';

function Sidebar({ popularPosts = [], categories = [] }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Popular Posts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {popularPosts.slice(0, 5).map((post, index) => (
            <Link key={post.id} to={`/articles/${post.slug}`} className="block group">
              <div className="flex gap-3">
                <span className="text-2xl font-bold text-primary/20">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {post.readingTime} min read
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {categories.slice(0, 10).map((category) => (
              <Link key={category.slug} to={`/categories#${category.slug}`}>
                <Badge variant="secondary" className="hover:bg-primary hover:text-primary-foreground transition-colors">
                  {category.name} ({category.count})
                </Badge>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Newsletter</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Get the latest articles delivered to your inbox
          </p>
          <NewsletterSignup compact />
        </CardContent>
      </Card>
    </div>
  );
}

export default Sidebar;

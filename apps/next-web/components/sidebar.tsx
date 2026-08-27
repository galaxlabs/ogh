"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NewsletterSignup } from "@/components/newsletter-signup";
import { useLanguage } from "@/components/language-provider";
import type { Article, CategoryStats } from "@/lib/data";

interface SidebarProps {
  popularPosts: Article[];
  categories: CategoryStats[];
}

export function Sidebar({ popularPosts = [], categories = [] }: SidebarProps) {
  const { translations } = useLanguage();
  const t = translations?.sidebar || {};
  const common = translations?.common || {};

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t.popular || "Popular Posts"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {popularPosts.slice(0, 5).map((post, index) => (
            <Link key={post.id} href={`/articles/${post.slug}`} className="group block">
              <div className="flex gap-3">
                <span className="text-2xl font-bold text-primary/20">{index + 1}</span>
                <div className="flex-1">
                  <h4 className="line-clamp-2 text-sm font-semibold transition-colors group-hover:text-primary">
                    {post.title}
                  </h4>
                  <p className="mt-1 text-xs text-muted-foreground">{post.readingTime} min read</p>
                </div>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t.categories || "Categories"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {categories.slice(0, 10).map((category) => (
              <Link key={category.slug} href={`/categories#${category.slug}`}>
                <Badge
                  variant="secondary"
                  className="transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  {category.name}
                  {category.count > 0 ? ` (${category.count})` : ""}
                </Badge>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t.newsletter || "Newsletter"}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            {common.newsletterDescription || "Get the latest articles delivered to your inbox"}
          </p>
          <NewsletterSignup compact />
        </CardContent>
      </Card>
    </div>
  );
}

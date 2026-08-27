"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CategoryIcon } from "@/components/icon-mapper";
import type { CategoryStats } from "@/lib/data";

interface CategoryCardProps {
  category: CategoryStats;
  index?: number;
  href?: string;
  external?: boolean;
  childCount?: number;
}

export function CategoryCard({
  category,
  index = 0,
  href,
  external = false,
  childCount = 0,
}: CategoryCardProps) {
  const target = href || `/articles?category=${encodeURIComponent(category.slug || category.name)}`;

  const content = (
    <Card className="group h-full transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-primary/10 p-3 transition-colors group-hover:bg-primary/20">
            <CategoryIcon name={category.icon} className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <div className="mb-2 flex items-start justify-between gap-3">
              <h3 className="font-semibold transition-colors group-hover:text-primary">
                {category.name}
              </h3>
              {category.count > 0 && (
                <Badge variant="secondary" className="text-xs whitespace-nowrap">
                  {category.count}
                </Badge>
              )}
            </div>
            <p className="line-clamp-2 text-sm text-muted-foreground">{category.description}</p>
            {(external || childCount > 0) && (
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                {external && (
                  <span className="inline-flex items-center gap-1 text-primary">
                    <ExternalLink className="h-3 w-3" />
                    Open subdomain
                  </span>
                )}
                {childCount > 0 && <span>{childCount} subcategories</span>}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (external) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.03 }}
      >
        <a href={target} target="_blank" rel="noopener noreferrer" className="block h-full">
          {content}
        </a>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
    >
      <Link href={target} className="block h-full">
        {content}
      </Link>
    </motion.div>
  );
}

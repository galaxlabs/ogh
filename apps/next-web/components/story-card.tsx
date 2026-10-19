"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Clock, BookOpen, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import type { StoryResult } from "@/lib/stories-api";

interface StoryCardProps {
  story: StoryResult;
  index?: number;
}

export function StoryCard({ story, index = 0 }: StoryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
    >
      <Link href={`/stories/${story.slug}`}>
        <Card className="group h-full overflow-hidden transition-all duration-200 hover:border-primary/40 hover:shadow-md">
          <div className="relative aspect-[16/9] overflow-hidden">
            {story.cover_image ? (
              <Image
                src={story.cover_image}
                alt={story.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-muted">
                <BookOpen className="h-12 w-12 text-muted-foreground/40" />
              </div>
            )}
          </div>
          <CardContent className="p-4">
            <h3 className="mb-2 line-clamp-2 text-lg font-semibold">{story.title}</h3>
            <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{story.excerpt}</p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {story.reading_time} min
              </span>
              {story.historical_period && (
                <span className="flex items-center gap-1">
                  <History className="h-3 w-3" />
                  {story.historical_period}
                </span>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-between border-t px-4 py-3">
            <span className="text-sm font-medium">{story.author_name}</span>
            {story.price > 0 ? (
              <Badge variant="secondary">&pound;{story.price.toFixed(2)}</Badge>
            ) : (
              <Badge variant="outline">Free</Badge>
            )}
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  );
}

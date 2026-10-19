"use client";

import Link from "next/link";
import Image from "next/image";
import { Clock, History, Lock, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/breadcrumb";
import type { StoryDetail } from "@/lib/stories-api";

interface StoryDetailClientProps {
  story: StoryDetail;
}

export function StoryDetailClient({ story }: StoryDetailClientProps) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <Breadcrumb items={[{ label: "Stories", href: "/stories" }, { label: story.title }]} />

      {story.cover_image && (
        <div className="relative mb-8 aspect-[21/9] overflow-hidden rounded-lg">
          <Image src={story.cover_image} alt={story.title} fill className="object-cover" priority />
        </div>
      )}

      <h1 className="mb-2 text-4xl font-bold">{story.title}</h1>

      <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <span>By {story.author_name}</span>
        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{story.reading_time} min read</span>
        {story.historical_period && (
          <span className="flex items-center gap-1"><History className="h-3.5 w-3.5" />{story.historical_period}</span>
        )}
        {story.price > 0 ? (
          <Badge>&pound;{story.price.toFixed(2)} lifetime access</Badge>
        ) : (
          <Badge variant="outline">Free</Badge>
        )}
      </div>

      {story.tags && (
        <div className="mb-6 flex flex-wrap gap-2">
          {story.tags.split(",").map((tag) => (
            <Badge key={tag.trim()} variant="secondary">{tag.trim()}</Badge>
          ))}
        </div>
      )}

      <div className="mb-8 rounded-lg border bg-card p-6">
        <p className="text-lg leading-relaxed text-muted-foreground">{story.excerpt}</p>
      </div>

      {story.author_bio && (
        <div className="mb-8 rounded-lg bg-muted/50 p-4">
          <p className="text-sm italic text-muted-foreground">&mdash; {story.author_bio}</p>
        </div>
      )}

      {story.has_purchased && story.body ? (
        <div className="text-center">
          <Button asChild size="lg">
            <Link href={`/stories/${story.slug}/read`}>
              <BookOpen className="mr-2 h-5 w-5" />Start Reading
            </Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border bg-muted/30 p-8 text-center">
          <Lock className="mx-auto mb-4 h-8 w-8 text-muted-foreground" />
          <p className="mb-2 text-lg font-medium">Account-based story reading is coming soon.</p>
          <p className="text-sm text-muted-foreground">One-time lifetime access per story will be available after account sign-in and paid checkout are connected.</p>
        </div>
      )}
    </div>
  );
}

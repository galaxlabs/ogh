"use client";

import Link from "next/link";
import { ArrowLeft, Clock, History } from "lucide-react";
import { ContentProtection } from "@/components/content-protection";
import type { StoryDetail } from "@/lib/stories-api";

interface StoryReaderProps {
  story: StoryDetail;
}

export function StoryReader({ story }: StoryReaderProps) {
  return (
    <ContentProtection>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href={`/stories/${story.slug}`}
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to story
        </Link>

        <h1 className="mb-2 text-3xl font-bold">{story.title}</h1>
        <p className="mb-1 text-muted-foreground">By {story.author_name}</p>
        <div className="mb-8 flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{story.reading_time} min read</span>
          {story.historical_period && (
            <span className="flex items-center gap-1"><History className="h-3.5 w-3.5" />{story.historical_period}</span>
          )}
        </div>

        <div
          className="prose prose-lg max-w-none dark:prose-invert"
          style={{ userSelect: "none", WebkitUserSelect: "none" }}
        >
          {story.body?.split("\n").map((paragraph, i) => (
            paragraph.trim() ? (
              <p key={i} className="mb-4 leading-relaxed">{paragraph}</p>
            ) : null
          ))}
        </div>
      </div>
    </ContentProtection>
  );
}

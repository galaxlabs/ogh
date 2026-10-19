import { notFound } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { StoryDetailClient } from "@/components/story-detail-client";
import { getStory } from "@/lib/stories-api";

interface StoryDetailPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export default async function StoryDetailPage({ params }: StoryDetailPageProps) {
  const { slug } = await params;
  const story = await getStory(slug);
  if (!story) notFound();

  return (
    <SiteShell>
      <StoryDetailClient story={story} />
    </SiteShell>
  );
}

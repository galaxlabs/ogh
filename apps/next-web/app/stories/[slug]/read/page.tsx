import { notFound, redirect } from "next/navigation";
import { getStory } from "@/lib/stories-api";
import { StoryReader } from "@/components/story-reader";

interface StoryReaderPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export default async function StoryReaderPage({ params }: StoryReaderPageProps) {
  const { slug } = await params;
  const story = await getStory(slug);
  if (!story) notFound();
  if (!story.has_purchased && !story.body) redirect(`/stories/${slug}`);

  return <StoryReader story={story} />;
}

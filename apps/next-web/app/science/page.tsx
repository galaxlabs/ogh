import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
import { TopicExplorer, TopicPageShell } from "@/components/topic-explorer";
import { Breadcrumb } from "@/components/breadcrumb";
import { loadArticlesByTopics } from "@/lib/cms";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Science",
  description: "Explore physics, chemistry, biology, and more on OpenGuideHub",
  alternates: { canonical: "/science" },
};

export default async function SciencePage() {
  const scienceArticles = await loadArticlesByTopics(["science"]);

  return (
    <SiteShell>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: "Science" }]} />
        <TopicPageShell
          title="Science"
          description="Explore the wonders of physics, chemistry, biology, and the natural world"
        >
          <TopicExplorer articles={scienceArticles} />
        </TopicPageShell>
      </div>
    </SiteShell>
  );
}

import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
import { TopicExplorer, TopicPageShell } from "@/components/topic-explorer";
import { Breadcrumb } from "@/components/breadcrumb";
import { articles } from "@/lib/data";

export const metadata: Metadata = {
  title: "Science",
  description: "Explore physics, chemistry, biology, and more on OpenGuideHub",
  alternates: { canonical: "/science" },
};

export default function SciencePage() {
  const scienceArticles = articles.filter((article) =>
    [
      "Physics",
      "Chemistry",
      "Biology",
      "Mathematics",
      "Earth Science",
      "Space & Astronomy",
      "Environmental Science",
    ].includes(article.category)
  );

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

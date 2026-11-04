import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
import { TopicExplorer, TopicPageShell } from "@/components/topic-explorer";
import { Breadcrumb } from "@/components/breadcrumb";
import { loadArticlesByTopics } from "@/lib/cms";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Technology",
  description: "Latest technology articles, AI guides, and software development topics",
  alternates: { canonical: "/technology" },
};

export default async function TechnologyPage() {
  const technologyArticles = await loadArticlesByTopics(["technology", "artificial-intelligence"]);

  return (
    <SiteShell>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: "Technology" }]} />
        <TopicPageShell
          title="Technology"
          description="Latest technology articles, AI guides, and software development topics"
        >
          <TopicExplorer articles={technologyArticles} />
        </TopicPageShell>
      </div>
    </SiteShell>
  );
}

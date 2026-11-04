import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
import { TopicExplorer, TopicPageShell } from "@/components/topic-explorer";
import { Breadcrumb } from "@/components/breadcrumb";
import { loadArticlesByTopics } from "@/lib/cms";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Open Source",
  description: "Open source software news, repository reviews, and community discoveries",
  alternates: { canonical: "/open-source" },
};

export default async function OpenSourcePage() {
  const openSourceArticles = await loadArticlesByTopics(["open-source", "repo-reviews"]);

  return (
    <SiteShell>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: "Open Source" }]} />
        <TopicPageShell
          title="Open Source"
          description="Open source software news, repository reviews, and community discoveries"
        >
          <TopicExplorer articles={openSourceArticles} />
        </TopicPageShell>
      </div>
    </SiteShell>
  );
}

import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
import { TopicExplorer, TopicPageShell } from "@/components/topic-explorer";
import { Breadcrumb } from "@/components/breadcrumb";
import { fetchAllPublishedArticles } from "@/lib/galaxy-ops-api";
import { publishedArticleToArticle } from "@/lib/cms";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tutorials",
  description: "Step-by-step tutorials and learning guides on OpenGuideHub",
  alternates: { canonical: "/tutorials" },
};

export default async function TutorialsPage() {
  const tutorialArticles = (await fetchAllPublishedArticles() || [])
    .filter((article) => article.content_type === "Tutorial" || article.category === "programming" || article.category === "how-to-guides")
    .map(publishedArticleToArticle);

  return (
    <SiteShell>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: "Tutorials" }]} />
        <TopicPageShell
          title="Tutorials"
          description="Step-by-step guides to help you learn new skills and technologies"
        >
          <TopicExplorer articles={tutorialArticles} />
        </TopicPageShell>
      </div>
    </SiteShell>
  );
}

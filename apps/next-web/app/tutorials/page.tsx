import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
import { TopicExplorer, TopicPageShell } from "@/components/topic-explorer";
import { Breadcrumb } from "@/components/breadcrumb";
import { articles } from "@/lib/data";

export const metadata: Metadata = {
  title: "Tutorials",
  description: "Step-by-step tutorials and learning guides on OpenGuideHub",
  alternates: { canonical: "/tutorials" },
};

export default function TutorialsPage() {
  const tutorialArticles = articles.filter(
    (article) =>
      article.category.includes("Tutorial") ||
      article.category === "Programming" ||
      article.category === "How-To Guides"
  );

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

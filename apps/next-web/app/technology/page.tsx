import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
import { TopicExplorer, TopicPageShell } from "@/components/topic-explorer";
import { Breadcrumb } from "@/components/breadcrumb";
import { articles } from "@/lib/data";

export const metadata: Metadata = {
  title: "Technology",
  description: "Latest technology articles, AI guides, and software development topics",
  alternates: { canonical: "/technology" },
};

export default function TechnologyPage() {
  const technologyArticles = articles.filter((article) =>
    [
      "Artificial Intelligence",
      "Computer Science",
      "Programming",
      "Software",
      "Cybersecurity",
      "Data Science",
      "Cloud & DevOps",
      "Web Development",
      "Mobile Development",
      "Gadgets",
      "Robotics",
      "Electronics",
      "Internet",
    ].includes(article.category)
  );

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

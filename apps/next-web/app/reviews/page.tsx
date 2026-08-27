import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
import { TopicExplorer, TopicPageShell } from "@/components/topic-explorer";
import { Breadcrumb } from "@/components/breadcrumb";
import { articles } from "@/lib/data";

export const metadata: Metadata = {
  title: "Reviews",
  description: "In-depth reviews of software, tools, and technology products",
  alternates: { canonical: "/reviews" },
};

export default function ReviewsPage() {
  const reviewArticles = articles.filter((article) =>
    article.category.includes("Review")
  );

  return (
    <SiteShell>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: "Reviews" }]} />
        <TopicPageShell
          title="Reviews"
          description="In-depth reviews and comparisons of software, tools, and technology"
        >
          <TopicExplorer articles={reviewArticles} />
        </TopicPageShell>
      </div>
    </SiteShell>
  );
}

import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
import { TopicExplorer, TopicPageShell } from "@/components/topic-explorer";
import { Breadcrumb } from "@/components/breadcrumb";
import { fetchAllPublishedArticles } from "@/lib/galaxy-ops-api";
import { publishedArticleToArticle } from "@/lib/cms";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reviews",
  description: "In-depth reviews of software, tools, and technology products",
  alternates: { canonical: "/reviews" },
};

export default async function ReviewsPage() {
  const reviewArticles = (await fetchAllPublishedArticles() || [])
    .filter((article) => article.content_type === "Review" || article.category === "repo-reviews")
    .map(publishedArticleToArticle);

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

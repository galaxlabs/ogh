import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
import { StoriesExplorer } from "@/components/stories-explorer";
import { Breadcrumb } from "@/components/breadcrumb";
import { listCategories } from "@/lib/stories-api";

export const metadata: Metadata = {
  title: "Stories & Fiction",
  description: "Historical fiction, ancient tales, and stories from around the world",
  alternates: { canonical: "/stories" },
};

export default async function StoriesPage() {
  const categories = await listCategories();

  return (
    <SiteShell>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: "Stories" }]} />
        <div className="mb-8">
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">Stories & Fiction</h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Historical fiction, ancient tales, and stories from around the world.
            Unlock lifetime access to every story you purchase.
          </p>
        </div>
        <StoriesExplorer categories={categories} />
      </div>
    </SiteShell>
  );
}

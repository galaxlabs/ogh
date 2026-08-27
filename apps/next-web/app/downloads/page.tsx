import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { ArrowRight, Download, FileText, LayoutDashboard, Package } from "lucide-react";
import { downloadCategories, downloadResources } from "@/lib/data";

export const metadata: Metadata = {
  title: "Downloads",
  description:
    "Browse categorized software, AI tool, security, and Urdu tutorial downloads on OpenGuideHub.",
  alternates: { canonical: "/downloads" },
};

export default function DownloadsPage() {
  return (
    <SiteShell>
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background/80 px-4 py-2 text-sm font-medium">
            <LayoutDashboard className="h-4 w-4 text-primary" />
            Categorized Software Downloads
          </div>
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">
            Software and Tutorial Download Center
          </h1>
          <p className="mx-auto mb-8 max-w-3xl text-lg text-muted-foreground">
            Browse clean, categorized download resources for software posts, AI tools, programming
            guides, and Urdu-first tutorials without cluttered external links inside articles.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <a href="#downloads-list">
              <Button size="lg" className="gap-2">
                Explore Downloads
                <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
            <Link href="/articles">
              <Button size="lg" variant="outline">
                Browse Articles
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            {downloadCategories.map((item) => (
              <div key={item.title} className="rounded-2xl border bg-card p-6 shadow-sm">
                <Package className="mb-4 h-8 w-8 text-primary" />
                <h2 className="mb-2 text-xl font-semibold">{item.title}</h2>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="downloads-list" className="bg-muted/30 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="mb-3 text-3xl font-bold">Download Library</h2>
            <p className="text-muted-foreground">
              Resources are grouped by software category so articles can stay readable while
              downloads stay organized.
            </p>
          </div>

          <div className="space-y-10">
            {downloadCategories.map((category) => {
              const resources = downloadResources.filter(
                (resource) => resource.category === category.title
              );
              if (!resources.length) return null;

              return (
                <section key={category.title} className="space-y-4">
                  <div>
                    <h3 className="text-2xl font-semibold">{category.title}</h3>
                    <p className="text-muted-foreground">{category.description}</p>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {resources.map((resource) => (
                      <div
                        key={resource.id}
                        className="flex flex-col rounded-2xl border bg-background p-6 shadow-sm"
                      >
                        <FileText className="mb-4 h-10 w-10 text-primary" />
                        <div className="flex-1">
                          <p className="mb-2 text-sm font-medium text-primary">{resource.type}</p>
                          <h4 className="mb-2 text-xl font-semibold">{resource.title}</h4>
                          <p className="mb-4 text-muted-foreground">{resource.description}</p>
                          <div className="mb-4 text-sm text-muted-foreground">
                            Format: {resource.format} • Size: {resource.size}
                          </div>
                        </div>
                        <a href={resource.href} download>
                          <Button className="w-full gap-2">
                            <Download className="h-4 w-4" />
                            Download
                          </Button>
                        </a>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}

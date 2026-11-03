import { SITE } from "@/lib/site";
import { articles, categories, downloadResources } from "@/lib/data";
import { fetchPublishedArticles } from "@/lib/galaxy-ops-api";

export const dynamic = "force-dynamic";

export async function GET() {
  let liveArticles: { slug: string; title: string; excerpt?: string; content_type?: string }[] = [];

  try {
    const response = await fetchPublishedArticles({});
    liveArticles = (response?.items || []).map((item) => ({
      slug: item.slug,
      title: item.title,
      excerpt: item.excerpt,
      content_type: item.content_type,
    }));
  } catch {
    liveArticles = [];
  }

  const seen = new Set<string>();
  const articleLines: string[] = [];

  for (const item of liveArticles) {
    if (!item.slug || seen.has(item.slug)) continue;
    seen.add(item.slug);
    articleLines.push(
      `- ${SITE.url}/articles/${item.slug} — ${item.title}${
        item.excerpt ? ` — ${item.excerpt}` : ""
      }`
    );
  }

  for (const item of articles) {
    if (seen.has(item.slug)) continue;
    seen.add(item.slug);
    articleLines.push(`- ${SITE.url}/articles/${item.slug} — ${item.title}`);
  }

  const lines = [
    `# ${SITE.name}`,
    "",
    "> " + SITE.description,
    "",
    "## How to use this file",
    "",
    `- Every guide is a single self-contained page with a quick answer, numbered steps, troubleshooting, and an FAQ.`,
    `- Article pages also expose Schema.org TechArticle and FAQPage JSON-LD, so answers can be quoted with attribution.`,
    "",
    "## Site",
    "",
    "- " + SITE.url,
    "- /articles — All articles",
    "- /categories — Browse by topic",
    "- /downloads — Free resources and tools",
    "",
    "## Articles",
    "",
    ...(articleLines.length ? articleLines : ["- No published articles yet."]),
    "",
    "## Categories",
    "",
    ...categories.map((c) => `- ${SITE.url}/categories#${c.slug} — ${c.name}`),
    "",
    "## Downloads",
    "",
    ...downloadResources.map((d) => `- ${d.title} (${d.category})`),
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

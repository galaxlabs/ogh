import { SITE } from "@/lib/site";
import { articles, categories, downloadResources } from "@/lib/data";

export async function GET() {
  const lines = [
    `# ${SITE.name}`,
    "",
    "> " + SITE.description,
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
    ...articles.map((a) => `- ${SITE.url}/articles/${a.slug} — ${a.title}`),
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

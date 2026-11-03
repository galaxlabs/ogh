export interface MarkdownFileMeta {
  title?: string;
  slug?: string;
  excerpt?: string;
  status?: string;
  content_type?: string;
  publication?: string;
  language?: string;
  primary_keyword?: string;
  seo_title?: string;
  meta_description?: string;
  canonical_url?: string;
  featured_image?: string;
  value_type?: string;
  notes?: string;
}

export interface ParsedMarkdownFile {
  meta: MarkdownFileMeta;
  body: string;
}

const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

const META_FIELDS: (keyof MarkdownFileMeta)[] = [
  "title",
  "slug",
  "excerpt",
  "status",
  "content_type",
  "publication",
  "language",
  "primary_keyword",
  "seo_title",
  "meta_description",
  "canonical_url",
  "featured_image",
  "value_type",
  "notes",
];

function unquote(value: string) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

/**
 * Parse a markdown file that starts with a YAML style front matter block.
 * Unknown keys are ignored so a file written for another tool still loads.
 */
export function parseMarkdownFile(content: string): ParsedMarkdownFile {
  const text = String(content || "");
  const match = text.match(FRONT_MATTER);
  const meta: MarkdownFileMeta = {};

  if (match) {
    for (const line of match[1].split(/\r?\n/)) {
      const separator = line.indexOf(":");
      if (separator === -1) continue;
      const key = line.slice(0, separator).trim().toLowerCase();
      const value = unquote(line.slice(separator + 1));
      if (!key || !value) continue;
      if (META_FIELDS.includes(key as keyof MarkdownFileMeta)) {
        (meta as Record<string, unknown>)[key] = value;
      }
    }
  }

  return { meta, body: text.replace(FRONT_MATTER, "") };
}

export interface MarkdownExportSource {
  title?: string;
  slug?: string;
  excerpt?: string;
  status?: string;
  content_type?: string;
  publication?: string;
  language?: string;
  primary_keyword?: string;
  seo_title?: string;
  meta_description?: string;
  canonical_url?: string;
  featured_image?: string;
  value_type?: string;
  notes?: string;
  body?: string;
}

/**
 * Render an article as a markdown file with front matter so it can be edited
 * outside the CMS and imported again.
 */
export function toMarkdownFile(article: MarkdownExportSource): string {
  const order: [keyof MarkdownExportSource, string][] = [
    ["title", "title"],
    ["slug", "slug"],
    ["status", "status"],
    ["content_type", "content_type"],
    ["publication", "publication"],
    ["language", "language"],
    ["excerpt", "excerpt"],
    ["primary_keyword", "primary_keyword"],
    ["seo_title", "seo_title"],
    ["meta_description", "meta_description"],
    ["canonical_url", "canonical_url"],
    ["featured_image", "featured_image"],
    ["value_type", "value_type"],
    ["notes", "notes"],
  ];

  const lines = ["---"];
  for (const [key, label] of order) {
    const value = article[key];
    if (value === undefined || value === null || value === "") continue;
    lines.push(`${label}: ${String(value).replace(/\r?\n/g, " ")}`);
  }
  lines.push("---", "");
  lines.push(String(article.body || "").trim(), "");

  return lines.join("\n");
}

export function slugFromFilename(filename: string) {
  return String(filename || "")
    .replace(/\.mdx?$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

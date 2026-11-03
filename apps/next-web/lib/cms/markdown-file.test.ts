import assert from "node:assert/strict";
import {
  parseMarkdownFile,
  slugFromFilename,
  toMarkdownFile,
} from "./markdown-file.ts";

let checks = 0;
function check(name: string, fn: () => void) {
  fn();
  checks += 1;
  console.log("ok  " + name);
}

check("parses front matter and body", () => {
  const file = [
    "---",
    "title: Install ERPNext v16",
    "slug: install-erpnext-v16",
    "status: Published",
    "---",
    "",
    "# Install ERPNext v16",
    "",
    "Body text.",
  ].join("\n");

  const parsed = parseMarkdownFile(file);
  assert.equal(parsed.meta.title, "Install ERPNext v16");
  assert.equal(parsed.meta.slug, "install-erpnext-v16");
  assert.equal(parsed.meta.status, "Published");
  assert.ok(parsed.body.includes("# Install ERPNext v16"));
  assert.ok(parsed.body.includes("Body text."));
  assert.ok(!parsed.body.includes("---"));
});

check("parses a file without front matter", () => {
  const parsed = parseMarkdownFile("# Just a body\n\nText.");
  assert.deepEqual(parsed.meta, {});
  assert.equal(parsed.body, "# Just a body\n\nText.");
});

check("ignores unknown front matter keys", () => {
  const parsed = parseMarkdownFile("---\ntitle: T\nauthor: Someone\n---\n\nBody");
  assert.equal(parsed.meta.title, "T");
  assert.equal((parsed.meta as Record<string, unknown>).author, undefined);
});

check("strips quotes from values", () => {
  const parsed = parseMarkdownFile('---\ntitle: "Quoted title"\n---\n\nBody');
  assert.equal(parsed.meta.title, "Quoted title");
});

check("exports an article as a markdown file", () => {
  const file = toMarkdownFile({
    title: "Install ERPNext v16",
    slug: "install-erpnext-v16",
    status: "Published",
    content_type: "Tutorial",
    publication: "7j2a5lpk20",
    body: "# Heading\n\nBody.",
  });

  assert.ok(file.startsWith("---\n"));
  assert.ok(file.includes("title: Install ERPNext v16"));
  assert.ok(file.includes("status: Published"));
  assert.ok(file.includes("# Heading"));
});

check("export omits empty fields", () => {
  const file = toMarkdownFile({ title: "Only title", body: "Body" });
  assert.ok(!file.includes("slug:"));
  assert.ok(!file.includes("seo_title:"));
});

check("export and import round trip", () => {
  const source = {
    title: "Round Trip",
    slug: "round-trip",
    status: "Draft",
    excerpt: "An excerpt.",
    body: "# Round Trip\n\nBody with **bold**.",
  };
  const parsed = parseMarkdownFile(toMarkdownFile(source));
  assert.equal(parsed.meta.title, source.title);
  assert.equal(parsed.meta.slug, source.slug);
  assert.equal(parsed.meta.excerpt, source.excerpt);
  assert.equal(parsed.body.trim(), source.body.trim());
});

check("slugifies a filename", () => {
  assert.equal(slugFromFilename("Install ERPNext v16.md"), "install-erpnext-v16");
  assert.equal(slugFromFilename("notes.mdx"), "notes");
});

console.log(`\n${checks} markdown file checks passed`);

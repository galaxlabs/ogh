import assert from "node:assert/strict";
import {
  analyzeArticle,
  buildArticleTemplate,
  extractFaq,
} from "./article-template.ts";

let checks = 0;
function check(name: string, fn: () => void) {
  fn();
  checks += 1;
  console.log("ok  " + name);
}

check("template contains every canonical section", () => {
  const template = buildArticleTemplate({ title: "Install Thing", keyword: "install thing" });
  for (const heading of [
    "Quick answer",
    "What you will learn",
    "Before you start",
    "Step-by-step",
    "Troubleshooting",
    "Key takeaways",
    "Frequently asked questions",
    "Sources and verification",
  ]) {
    assert.ok(template.includes(heading), "missing section: " + heading);
  }
  assert.ok(template.startsWith("# Install Thing"));
  assert.ok(template.includes("> **Quick answer:**"));
});

check("template uses the supplied quick answer", () => {
  const template = buildArticleTemplate({ title: "T", quickAnswer: "It takes ten minutes." });
  assert.ok(template.includes("It takes ten minutes."));
});

check("extractFaq reads question and answer pairs", () => {
  const body = [
    "## Frequently asked questions",
    "",
    "### Does it work?",
    "",
    "Yes, on a fresh server.",
    "",
    "### Can I upgrade later?",
    "",
    "You can, with a backup.",
    "",
    "## Sources",
    "",
    "Not a question.",
  ].join("\n");
  const faq = extractFaq(body);
  assert.equal(faq.length, 2);
  assert.equal(faq[0].question, "Does it work?");
  assert.equal(faq[0].answer, "Yes, on a fresh server.");
  assert.equal(faq[1].answer, "You can, with a backup.");
});

check("extractFaq ignores questions outside the FAQ section", () => {
  const faq = extractFaq("### Not an faq\n\nSome text.");
  assert.equal(faq.length, 0);
});

check("analyzer scores an empty article low", () => {
  const analysis = analyzeArticle({});
  assert.ok(analysis.score < 20, "expected a low score, got " + analysis.score);
  assert.equal(analysis.faq.length, 0);
  assert.equal(analysis.wordCount, 0);
});

check("analyzer rewards a complete article", () => {
  const body = [
    "> **Quick answer:** Install it with bench in about ten minutes.",
    "",
    "## What you will learn",
    "",
    "- How to install",
    "",
    "## Before you start",
    "",
    "- Ubuntu 24.04",
    "",
    "## Step-by-step",
    "",
    "### 1. Update packages",
    "",
    "```bash",
    "sudo apt update",
    "```",
    "",
    "### 2. Install bench",
    "",
    "```bash",
    "pip install frappe-bench",
    "```",
    "",
    "### 3. Create the site",
    "",
    "```bash",
    "bench new-site demo",
    "```",
    "",
    "## Troubleshooting",
    "",
    "### Internal Server Error",
    "",
    "```bash",
    "bench migrate",
    "```",
    "",
    "## Key takeaways",
    "",
    "- Update packages first",
    "",
    "## Frequently asked questions",
    "",
    "### Does it work on a fresh server?",
    "",
    "Yes it does.",
    "",
    "### Can I upgrade later?",
    "",
    "Yes you can.",
    "",
    "## Sources and verification",
    "",
    "- Official docs",
  ].join("\n");

  const analysis = analyzeArticle({
    title: "Install ERPNext",
    body,
    excerpt: "A complete terminal guide to install ERPNext beta on Ubuntu 24.04 and set up production services.",
    seo_title: "Install ERPNext on Ubuntu 24.04",
    meta_description: "A complete terminal guide to install ERPNext beta on Ubuntu 24.04 and configure production services for a real deployment.",
    canonical_url: "https://openguidehub.org/articles/install-erpnext",
    featured_image: "https://example.com/image.png",
    human_reviewed: 1,
  });

  assert.ok(analysis.score >= 80, "expected a high score, got " + analysis.score);
  assert.equal(analysis.faq.length, 2);
  const failing = analysis.checks.filter((item) => !item.ok).map((item) => item.id);
  // the sample body is deliberately short, so only the length check should fail
  assert.deepEqual(failing, ["length"]);
});

check("analyzer flags missing pieces with hints", () => {
  const analysis = analyzeArticle({ body: "short text" });
  const quickAnswer = analysis.checks.find((item) => item.id === "quick_answer");
  assert.ok(quickAnswer);
  assert.equal(quickAnswer.ok, false);
  assert.ok(quickAnswer.hint.length > 10);
});

console.log(`\n${checks} article template checks passed`);

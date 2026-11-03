export interface ArticleAnalysisInput {
  title?: string;
  body?: string;
  excerpt?: string;
  seo_title?: string;
  meta_description?: string;
  canonical_url?: string;
  featured_image?: string;
  noindex?: number;
  status?: string;
  primary_keyword?: string;
  human_reviewed?: number;
  value_type?: string;
}

export interface ArticleCheck {
  id: string;
  label: string;
  hint: string;
  weight: number;
  ok: boolean;
  group: "Structure" | "Search" | "Trust";
}

export interface ArticleAnalysis {
  score: number;
  checks: ArticleCheck[];
  faq: FaqEntry[];
  wordCount: number;
  readingMinutes: number;
}

export interface FaqEntry {
  question: string;
  answer: string;
}

export const TEMPLATE_SECTIONS = [
  { heading: "Quick answer", body: "One or two sentences that answer the question directly." },
  { heading: "What you will learn", body: "- The outcome of reading this guide" },
  { heading: "Before you start", body: "- Prerequisites, versions, and hardware" },
  { heading: "Step-by-step", body: "### 1. First step\n\n```bash\ncommand\n```" },
  { heading: "Troubleshooting", body: "### Symptom\n\nWhat to run and what it means." },
  { heading: "Key takeaways", body: "- The points a reader should remember" },
  { heading: "Frequently asked questions", body: "### Question?\n\nAnswer." },
  { heading: "Sources and verification", body: "- Official documentation link" },
];

export function buildArticleTemplate(options: {
  title?: string;
  keyword?: string;
  quickAnswer?: string;
}): string {
  const title = (options.title || "Article title").trim();
  const keyword = (options.keyword || "").trim();
  const quickAnswer =
    options.quickAnswer?.trim() ||
    `One sentence that answers "${title}" in the first 25 words.`;

  return [
    `# ${title}`,
    "",
    `> **Quick answer:** ${quickAnswer}`,
    "",
    "## What you will learn",
    "",
    `- What ${keyword || title} does and when to use it`,
    "- The exact steps required, in order",
    "- How to verify the result and fix common failures",
    "",
    "## Before you start",
    "",
    "- Operating system, versions, and access level",
    "- Any accounts, keys, or hardware you need",
    "- Estimated time and impact on existing systems",
    "",
    "## Step-by-step",
    "",
    "### 1. First step",
    "",
    "Explain the goal of this step in one line.",
    "",
    "```bash",
    "# commands a reader can copy",
    "```",
    "",
    "### 2. Second step",
    "",
    "```bash",
    "# next commands",
    "```",
    "",
    "## Troubleshooting",
    "",
    "### Symptom you will see",
    "",
    "What went wrong, and the exact command that fixes it.",
    "",
    "```bash",
    "# diagnostic or fix command",
    "```",
    "",
    "## Key takeaways",
    "",
    "- The one thing a reader must not skip",
    "- The command that solves the problem fastest",
    "- The version caveat to remember",
    "",
    "## Frequently asked questions",
    "",
    "### Does this work on a fresh server?",
    "",
    "Answer the question in one or two sentences.",
    "",
    "### Can I run this on an existing install?",
    "",
    "Answer the question in one or two sentences.",
    "",
    "## Sources and verification",
    "",
    "- Official documentation, checked on this date",
    "- Release notes for the version used in this guide",
  ].join("\n");
}

function headingSet(body: string) {
  const headings = new Set<string>();
  for (const line of String(body || "").split("\n")) {
    const match = line.match(/^\s{0,3}#{2,6}\s+(.+?)\s*$/);
    if (match) headings.add(match[1].replace(/[*_`]/g, "").toLowerCase());
  }
  return headings;
}

export function extractFaq(body: string): FaqEntry[] {
  const lines = String(body || "").split("\n");
  const entries: FaqEntry[] = [];
  let inFaq = false;
  let current: FaqEntry | null = null;

  for (const line of lines) {
    const heading = line.match(/^\s{0,3}(#{2,6})\s+(.+?)\s*$/);
    if (heading) {
      const level = heading[1].length;
      const title = heading[2].replace(/[*_`]/g, "").trim();
      if (level === 2) {
        if (current && current.answer) entries.push(current);
        current = null;
        inFaq = /frequently asked questions|faq/i.test(title);
        continue;
      }
      if (inFaq && level === 3) {
        if (current && current.answer) entries.push(current);
        current = { question: title, answer: "" };
        continue;
      }
    }
    if (inFaq && current) {
      const text = line.trim();
      if (!text) continue;
      if (/^[-*+]\s+/.test(text) || /^```/.test(text)) continue;
      current.answer = current.answer ? `${current.answer} ${text}` : text;
    }
  }

  if (current && current.answer) entries.push(current);
  return entries;
}

export function analyzeArticle(input: ArticleAnalysisInput): ArticleAnalysis {
  const body = String(input.body || "");
  const headings = headingSet(body);
  const faq = extractFaq(body);
  const words = body.trim() ? body.trim().split(/\s+/).length : 0;
  const readingMinutes = Math.max(1, Math.round(words / 220));

  const hasHeading = (pattern: RegExp) =>
    Array.from(headings).some((heading) => pattern.test(heading));

  const codeBlocks = (body.match(/```[a-zA-Z0-9+#.-]*\r?\n[\s\S]*?```/g) || []).length;
  const languageFences = (body.match(/```[a-zA-Z0-9+#.-]+/g) || []).length;
  const numberedSteps = (body.match(/^###\s+\d+\./gm) || []).length;
  const quickAnswer = />\s*\*\*quick answer:\*\*/i.test(body);

  const checks: ArticleCheck[] = [
    {
      id: "quick_answer",
      group: "Structure",
      label: "Quick answer in the first lines",
      hint: "Open with a blockquote that answers the question in one sentence.",
      weight: 12,
      ok: quickAnswer,
    },
    {
      id: "sections",
      group: "Structure",
      label: "Standard section structure",
      hint: "Include What you will learn, Before you start, Step-by-step, Troubleshooting, Key takeaways, FAQ.",
      weight: 10,
      ok:
        hasHeading(/what you will learn|what you'll learn/) &&
        hasHeading(/before you start|prerequisite/) &&
        hasHeading(/step.by.step|installation|how to/) &&
        hasHeading(/troubleshoot|common problem|error/),
    },
    {
      id: "steps",
      group: "Structure",
      label: "Numbered steps",
      hint: "Use ### 1., ### 2. headings so a reader can follow and cite each step.",
      weight: 8,
      ok: numberedSteps >= 3,
    },
    {
      id: "code_language",
      group: "Structure",
      label: "Code blocks declare a language",
      hint: "Use ```bash, ```ini, ```python so readers and tools know how to run each block.",
      weight: 8,
      ok: codeBlocks > 0 && languageFences >= codeBlocks,
    },
    {
      id: "troubleshooting",
      group: "Structure",
      label: "Troubleshooting section with fixes",
      hint: "List the exact error text a reader will see and the command that fixes it.",
      weight: 10,
      ok: hasHeading(/troubleshoot|common problem|error/) && /```/.test(body),
    },
    {
      id: "faq",
      group: "Structure",
      label: "FAQ with at least 2 questions",
      hint: "Add ## Frequently asked questions with short question and answer pairs.",
      weight: 12,
      ok: faq.length >= 2,
    },
    {
      id: "takeaways",
      group: "Structure",
      label: "Key takeaways",
      hint: "End with ## Key takeaways so an assistant can quote the essentials.",
      weight: 8,
      ok: hasHeading(/key takeaways|takeaways|key points/),
    },
    {
      id: "sources",
      group: "Structure",
      label: "Sources and verification",
      hint: "Link the official documentation you used so the article can be re-verified.",
      weight: 6,
      ok: hasHeading(/source|reference|verification/),
    },
    {
      id: "length",
      group: "Structure",
      label: "Substantive length",
      hint: "Aim for 600 words or more so the guide can answer real questions.",
      weight: 6,
      ok: words >= 600,
    },
    {
      id: "excerpt",
      group: "Search",
      label: "Excerpt for cards and search",
      hint: "Write a 120 to 180 character summary in the excerpt field.",
      weight: 6,
      ok: (input.excerpt || "").trim().length >= 60,
    },
    {
      id: "seo_title",
      group: "Search",
      label: "SEO title within 60 characters",
      hint: "Keep the search title short enough to display without truncation.",
      weight: 4,
      ok: Boolean(input.seo_title?.trim()) && (input.seo_title || "").length <= 60,
    },
    {
      id: "meta_description",
      group: "Search",
      label: "Meta description within 158 characters",
      hint: "Summarise the page for the search snippet.",
      weight: 4,
      ok:
        Boolean(input.meta_description?.trim()) &&
        (input.meta_description || "").length <= 158 &&
        (input.meta_description || "").length > 0,
    },
    {
      id: "canonical",
      group: "Search",
      label: "Canonical URL set",
      hint: "Set the canonical URL so search engines and assistants use one address.",
      weight: 3,
      ok: Boolean(input.canonical_url?.trim()),
    },
    {
      id: "featured_image",
      group: "Trust",
      label: "Featured image",
      hint: "Add a featured image so the article ranks with a rich preview card.",
      weight: 2,
      ok: Boolean(input.featured_image?.trim()),
    },
    {
      id: "human_reviewed",
      group: "Trust",
      label: "Marked as human reviewed",
      hint: "Confirm a person checked the content before it is published.",
      weight: 1,
      ok: Boolean(input.human_reviewed),
    },
  ];

  const totalWeight = checks.reduce((sum, check) => sum + check.weight, 0);
  const earned = checks.reduce((sum, check) => sum + (check.ok ? check.weight : 0), 0);
  const score = totalWeight ? Math.round((earned / totalWeight) * 100) : 0;

  return {
    score,
    checks,
    faq,
    wordCount: words,
    readingMinutes,
  };
}

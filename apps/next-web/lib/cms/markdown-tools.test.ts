import assert from "node:assert/strict";
import {
  buildTable,
  codeBlockToLink,
  extractExcerpt,
  findCodeBlocks,
  indentListItem,
  insertBlock,
  normalizeMarkdown,
  prefixLines,
  readingMinutes,
  slugify,
  suggestMetaDescription,
  suggestSeoTitle,
  toHyperlink,
  toPlainText,
  wordCount,
  wrapSelection,
} from "./markdown-tools.ts";

let checks = 0;
function check(name: string, fn: () => void) {
  fn();
  checks += 1;
  console.log("ok  " + name);
}

check("slugify", () => {
  assert.equal(slugify("Install ERPNext v16 on Ubuntu 24.04!"), "install-erpnext-v16-on-ubuntu-24-04");
  assert.equal(slugify("  Urdu  ٹیوٹوریل  "), "urdu");
});

check("wordCount and readingMinutes", () => {
  assert.equal(wordCount("one two three"), 3);
  assert.equal(wordCount(""), 0);
  assert.equal(readingMinutes("word ".repeat(220)), 1);
  assert.equal(readingMinutes("word ".repeat(440)), 2);
});

check("toPlainText strips markup", () => {
  const plain = toPlainText("# Title\n\nSome **bold** and [link](https://x.dev) and `code`.\n\n```js\nconst a = 1;\n```\n");
  assert.ok(plain.includes("Some bold and link and code"));
  assert.ok(!plain.includes("const a"));
});

check("wrapSelection toggles bold", () => {
  const edit = wrapSelection("hello world", 0, 5, "**");
  assert.equal(edit.text, "**hello** world");
  assert.equal(edit.selectionStart, 2);
  assert.equal(edit.selectionEnd, 7);
  const back = wrapSelection(edit.text, 2, 7, "**");
  assert.equal(back.text, "hello world");
});

check("wrapSelection toggles inline code", () => {
  const edit = wrapSelection("run ls now", 4, 6, "`");
  assert.equal(edit.text, "run `ls` now");
});

check("prefixLines applies heading to every line", () => {
  const edit = prefixLines("alpha\nbeta", 0, 10, "## ");
  assert.equal(edit.text, "## alpha\n## beta");
});

check("prefixLines adds list bullets", () => {
  const edit = prefixLines("one\ntwo", 0, 7, "- ");
  assert.equal(edit.text, "- one\n- two");
});

check("insertBlock adds fenced code block", () => {
  const edit = insertBlock("Intro text", 10, "```bash\nls -la\n```");
  assert.ok(edit.text.includes("Intro text\n```bash\nls -la\n```"));
});

check("toHyperlink converts selected text", () => {
  const edit = toHyperlink("see the docs here", 8, 12, "https://docs.dev", undefined);
  assert.equal(edit.text, "see the [docs](https://docs.dev) here");
});

check("toHyperlink keeps an empty label for typing", () => {
  const edit = toHyperlink("start ", 6, 6, "https://docs.dev");
  assert.equal(edit.text, "start [](https://docs.dev)");
  assert.equal(edit.selectionStart, 7);
});

check("toHyperlink rewrites an existing link url", () => {
  const text = "see [docs](https://old.dev)";
  const start = text.indexOf("[");
  const edit = toHyperlink(text, start, text.length, "https://new.dev");
  assert.equal(edit.text, "see [docs](https://new.dev)");
});

check("findCodeBlocks locates fences", () => {
  const text = "intro\n\n```python\nprint(1)\n```\n\noutro\n\n```\nplain\n```";
  const blocks = findCodeBlocks(text);
  assert.equal(blocks.length, 2);
  assert.equal(blocks[0].lang, "python");
  assert.equal(blocks[0].content.trim(), "print(1)");
});

check("codeBlockToLink converts the selected code block into a link", () => {
  const text = "Before\n\n```bash\nls -la\n```\n\nAfter";
  const blocks = findCodeBlocks(text);
  const selectionStart = blocks[0].start + 5;
  const edit = codeBlockToLink(text, selectionStart, selectionStart, "https://example.com/docs");
  assert.ok(edit.text.includes("[ls -la](https://example.com/docs)"));
  assert.ok(!edit.text.includes("```"));
  assert.ok(edit.text.startsWith("Before"));
  assert.ok(edit.text.endsWith("After"));
});

check("codeBlockToLink uses the url as label when the code has no text", () => {
  const text = "```\nhttps://example.com/x\n```";
  const edit = codeBlockToLink(text, 2, 2, "https://example.com/x");
  assert.equal(edit.text, "[https://example.com/x](https://example.com/x)");
});

check("extractExcerpt skips headings and lists", () => {
  const markdown = "# Title\n\n- item one\n\nThe first real paragraph explains the idea clearly.\n\nSecond paragraph.";
  const excerpt = extractExcerpt(markdown);
  assert.equal(excerpt, "The first real paragraph explains the idea clearly.");
});

check("extractExcerpt clips on a word boundary", () => {
  const markdown = "word ".repeat(80).trim();
  const excerpt = extractExcerpt(markdown, 40);
  assert.ok(excerpt.length <= 41);
  assert.ok(excerpt.endsWith("…"));
});

check("suggestSeoTitle appends the keyword only when it is missing", () => {
  assert.equal(suggestSeoTitle("Install ERPNext", "erpnext"), "Install ERPNext");
  assert.equal(suggestSeoTitle("Install Guide", "erpnext"), "Install Guide | erpnext");
  assert.ok(suggestSeoTitle("A very long title that keeps going and going past the limit", "guide").length <= 60);
});

check("suggestMetaDescription comes from the body", () => {
  assert.equal(
    suggestMetaDescription("# T\n\nA short summary of the article for search engines."),
    "A short summary of the article for search engines."
  );
});

check("normalizeMarkdown fixes spacing", () => {
  const messy = "Intro\n###Heading\n\n\n\nEnd   ";
  const clean = normalizeMarkdown(messy);
  assert.ok(clean.includes("### Heading"));
  assert.ok(!clean.includes("\n\n\n"));
  assert.ok(!clean.includes("End   "));
});

check("buildTable renders a markdown table", () => {
  const table = buildTable(["Step", "Command"], [["Install", "apt install"]]);
  assert.equal(
    table,
    "| Step | Command |\n| --- | --- |\n| Install | apt install |"
  );
});

check("indentListItem indents and outdents", () => {
  const edit = indentListItem("- one\n- two", 0, 11);
  assert.equal(edit.text, "  - one\n  - two");
  const back = indentListItem(edit.text, 0, 13);
  assert.equal(back.text, "- one\n- two");
});

console.log(`\n${checks} markdown tool checks passed`);

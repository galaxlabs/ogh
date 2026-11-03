export interface TextEdit {
  text: string;
  selectionStart: number;
  selectionEnd: number;
}

export interface CodeBlock {
  start: number;
  end: number;
  lang: string;
  content: string;
}

const WORD_PATTERN = /[A-Za-z0-9\u00C0-\u024F\u0600-\u06FF\uFB50-\uFDFF\u0900-\u097F]+/g;

export function slugify(value: string): string {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

export function wordCount(text: string): number {
  const matches = String(text || "").match(WORD_PATTERN);
  return matches ? matches.length : 0;
}

export function readingMinutes(text: string): number {
  return Math.max(1, Math.round(wordCount(text) / 220));
}

export function toPlainText(markdown: string): string {
  return String(markdown || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/^\s*\|.*\|\s*$/gm, " ")
    .replace(/[*_~]{1,3}/g, "")
    .replace(/==/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function wrapSelection(
  text: string,
  start: number,
  end: number,
  marker: string
): TextEdit {
  const value = String(text || "");
  const from = Math.max(0, Math.min(start, value.length));
  const to = Math.max(from, Math.min(end, value.length));
  const selected = value.slice(from, to);

  // The selection itself already carries the markers.
  if (
    selected.length >= marker.length * 2 &&
    selected.startsWith(marker) &&
    selected.endsWith(marker)
  ) {
    const inner = selected.slice(marker.length, selected.length - marker.length);
    return {
      text: value.slice(0, from) + inner + value.slice(to),
      selectionStart: from,
      selectionEnd: from + inner.length,
    };
  }

  // The markers sit directly around the selection.
  const before = value.slice(Math.max(0, from - marker.length), from);
  const after = value.slice(to, to + marker.length);
  if (before === marker && after === marker) {
    const unwrappedFrom = from - marker.length;
    return {
      text: value.slice(0, unwrappedFrom) + selected + value.slice(to + marker.length),
      selectionStart: unwrappedFrom,
      selectionEnd: unwrappedFrom + selected.length,
    };
  }

  const wrapped = `${marker}${selected}${marker}`;
  return {
    text: value.slice(0, from) + wrapped + value.slice(to),
    selectionStart: from + marker.length,
    selectionEnd: from + marker.length + selected.length,
  };
}

export function prefixLines(
  text: string,
  start: number,
  end: number,
  prefix: string
): TextEdit {
  const value = String(text || "");
  const from = Math.max(0, Math.min(start, value.length));
  const to = Math.max(from, Math.min(end, value.length));
  const lineStart = value.lastIndexOf("\n", from - 1) + 1;
  const lineEndBreak = value.indexOf("\n", to);
  const lineEnd = lineEndBreak === -1 ? value.length : lineEndBreak;

  const block = value.slice(lineStart, lineEnd);
  const prefixed = block
    .split("\n")
    .map((line) => (prefix && !line.startsWith(prefix) ? `${prefix}${line}` : line))
    .join("\n");

  return {
    text: value.slice(0, lineStart) + prefixed + value.slice(lineEnd),
    selectionStart: lineStart,
    selectionEnd: lineStart + prefixed.length,
  };
}

export function insertBlock(text: string, cursor: number, block: string): TextEdit {
  const value = String(text || "");
  const at = Math.max(0, Math.min(cursor, value.length));
  const before = value.slice(0, at);
  const after = value.slice(at);
  const needsLeadingBreak = before.length > 0 && !before.endsWith("\n");
  const needsTrailingBreak = after.length > 0 && !after.startsWith("\n");
  const inserted = `${needsLeadingBreak ? "\n" : ""}${block}${needsTrailingBreak ? "\n" : ""}`;

  return {
    text: before + inserted + after,
    selectionStart: at + inserted.length,
    selectionEnd: at + inserted.length,
  };
}

export function toHyperlink(
  text: string,
  start: number,
  end: number,
  url: string,
  label?: string
): TextEdit {
  const value = String(text || "");
  const from = Math.max(0, Math.min(start, value.length));
  const to = Math.max(from, Math.min(end, value.length));
  const selected = value.slice(from, to);
  const target = String(url || "").trim();

  if (!target) {
    return { text: value, selectionStart: from, selectionEnd: to };
  }

  const existingLink = selected.match(/^\[([^\]]*)\]\(([^)]*)\)$/);
  if (existingLink) {
    const nextLabel = (label || existingLink[1] || target).trim();
    const replaced = `[${nextLabel}](${target})`;
    return {
      text: value.slice(0, from) + replaced + value.slice(to),
      selectionStart: from,
      selectionEnd: from + replaced.length,
    };
  }

  const explicitLabel = label?.trim();
  const nextLabel = explicitLabel || selected.trim() || target;

  if (!selected) {
    const replaced = `[${explicitLabel || ""}](${target})`;
    const caret = from + 1 + (explicitLabel ? explicitLabel.length : 0);
    return {
      text: value.slice(0, from) + replaced + value.slice(to),
      selectionStart: caret,
      selectionEnd: caret,
    };
  }

  const replaced = `[${nextLabel}](${target})`;
  return {
    text: value.slice(0, from) + replaced + value.slice(to),
    selectionStart: from + replaced.length,
    selectionEnd: from + replaced.length,
  };
}

export function findCodeBlocks(text: string): CodeBlock[] {
  const value = String(text || "");
  const blocks: CodeBlock[] = [];
  const pattern = /```([A-Za-z0-9+#.-]*)\r?\n([\s\S]*?)```/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(value)) !== null) {
    blocks.push({
      start: match.index,
      end: match.index + match[0].length,
      lang: match[1] || "",
      content: match[2] || "",
    });
  }

  return blocks;
}

export function codeBlockToLink(
  text: string,
  start: number,
  end: number,
  url: string,
  label?: string
): TextEdit {
  const value = String(text || "");
  const target = String(url || "").trim();
  if (!target) return { text: value, selectionStart: start, selectionEnd: end };

  const blocks = findCodeBlocks(value);
  const block =
    blocks.find((item) => start >= item.start && end <= item.end) ||
    blocks.find((item) => item.start <= start && item.end >= start) ||
    blocks.find((item) => Math.abs(item.start - start) < 400);

  if (!block) {
    return toHyperlink(value, start, end, target, label);
  }

  const firstLine =
    block.content
      .split("\n")
      .map((line) => line.trim())
      .find(Boolean) || "";
  const fallbackLabel = label?.trim() || firstLine || target;

  const replaced = `[${fallbackLabel}](${target})`;
  const nextText = value.slice(0, block.start) + replaced + value.slice(block.end);

  return {
    text: nextText,
    selectionStart: block.start,
    selectionEnd: block.start + replaced.length,
  };
}

export function extractExcerpt(markdown: string, maxLength = 180): string {
  const withoutCode = String(markdown || "").replace(/```[\s\S]*?```/g, " ");
  const lines = withoutCode.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("#")) continue;
    if (/^[-*+]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed)) continue;
    if (/^\|/.test(trimmed)) continue;

    const plain = toPlainText(trimmed);
    if (!plain) continue;

    if (plain.length <= maxLength) return plain;
    const clipped = plain.slice(0, maxLength);
    const lastSpace = clipped.lastIndexOf(" ");
    return `${(lastSpace > 40 ? clipped.slice(0, lastSpace) : clipped).trim()}…`;
  }

  return "";
}

export function suggestSeoTitle(title: string, keyword?: string): string {
  const base = String(title || "").trim();
  const key = String(keyword || "").trim();
  const candidate = key && !base.toLowerCase().includes(key.toLowerCase())
    ? `${base} | ${key}`
    : base;
  return candidate.length > 60 ? `${candidate.slice(0, 57).trim()}…` : candidate;
}

export function suggestMetaDescription(markdown: string, maxLength = 158): string {
  const excerpt = extractExcerpt(markdown, maxLength);
  return excerpt.replace(/…$/, "").trim();
}

export function normalizeMarkdown(markdown: string): string {
  return String(markdown || "")
    .replace(/\r\n/g, "\n")
    .replace(/\t/g, "  ")
    .replace(/[ \t]+$/gm, "")
    .replace(/^([ \t]*)(#{1,6})[ \t]*(\S)/gm, "$1$2 $3")
    .replace(/```(\S*)\n/g, "```$1\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/([^\n])\n(#{1,6}[ \t])/g, "$1\n\n$2")
    .trim();
}

export function buildTable(headers: string[], rows: string[][]): string {
  const head = `| ${headers.join(" | ")} |`;
  const divider = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((row) => `| ${row.join(" | ")} |`).join("\n");
  return `${head}\n${divider}${body ? `\n${body}` : ""}`;
}

export function indentListItem(text: string, start: number, end: number): TextEdit {
  const value = String(text || "");
  const from = Math.max(0, Math.min(start, value.length));
  const to = Math.max(from, Math.min(end, value.length));
  const lineStart = value.lastIndexOf("\n", from - 1) + 1;
  const lineEndBreak = value.indexOf("\n", to);
  const lineEnd = lineEndBreak === -1 ? value.length : lineEndBreak;
  const block = value.slice(lineStart, lineEnd);
  const next = block
    .split("\n")
    .map((line) => (line.startsWith("  ") ? line.slice(2) : `  ${line}`))
    .join("\n");

  return {
    text: value.slice(0, lineStart) + next + value.slice(lineEnd),
    selectionStart: lineStart,
    selectionEnd: lineStart + next.length,
  };
}

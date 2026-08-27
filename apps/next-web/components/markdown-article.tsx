import { Fragment, type ReactNode } from "react";
import Link from "next/link";

function renderStyledSegment(segment = "", keyPrefix = "segment") {
  return String(segment || "")
    .split(/(\*\*[^*]+\*\*|==[^=]+==)/g)
    .filter(Boolean)
    .map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={`${keyPrefix}-bold-${index}`}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("==") && part.endsWith("==")) {
        return <mark key={`${keyPrefix}-mark-${index}`}>{part.slice(2, -2)}</mark>;
      }
      return <Fragment key={`${keyPrefix}-text-${index}`}>{part}</Fragment>;
    });
}

function renderInlineContent(text = ""): ReactNode[] {
  const value = String(text || "");
  const regex =
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]+)\)|(https?:\/\/[^\s]+)|((?:www\.)?[a-z0-9.-]+\.[a-z]{2,}(?:\/[^\s]*)?)|(\/articles\?[^\s]+)/gi;
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(value)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(...renderStyledSegment(value.slice(lastIndex, match.index), `text-${match.index}`));
    }

    const rawHref = match[2] || match[3] || match[4] || match[5] || "";
    const href =
      rawHref.startsWith("http") || rawHref.startsWith("/") ? rawHref : `https://${rawHref}`;
    const label = match[1] || rawHref.replace(/^https?:\/\/(www\.)?/, "");

    if (href.startsWith("/")) {
      nodes.push(
        <Link
          key={`${href}-${match.index}`}
          href={href}
          className="font-medium text-primary hover:underline"
        >
          {label}
        </Link>
      );
    } else {
      nodes.push(
        <a
          key={`${href}-${match.index}`}
          href={href}
          target="_blank"
          rel="noreferrer"
          className="break-all font-medium text-primary hover:underline"
        >
          {label}
        </a>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < value.length) {
    nodes.push(...renderStyledSegment(value.slice(lastIndex), `tail-${lastIndex}`));
  }

  return nodes;
}

function normalizeStructuredContent(content = "") {
  return String(content || "")
    .replace(/\r\n/g, "\n")
    .replace(/(^|\n)\s*##\s*(?=\n)/g, "$1")
    .replace(/([.!?])\s+(TL;DR|What happened|What this AI update says|Steps to know|Risk to know|Project snapshot|Software snapshot|Research goal|Context to understand|How it works|Key points|Key findings|Why it matters|Why it matters for builders|Why it matters for safety|Why it matters for the community|Limits and caution|Continue exploring|Download section|Free tools and downloads|Sources and further reading|یہ ٹیوٹوریل کس بارے میں ہے|مرحلہ وار رہنمائی|اہم نکات|یہ کیوں اہم ہے|ڈاؤن لوڈ سیکشن|ماخذ اور مزید مطالعہ)\s*:?\s*/gi, "$1\n\n## $2\n")
    .replace(/##\s*\n+\s*(TL;DR|What happened|What this AI update says|Steps to know|Risk to know|Project snapshot|Software snapshot|Research goal|Context to understand|How it works|Key points|Key findings|Why it matters|Why it matters for builders|Why it matters for safety|Why it matters for the community|Limits and caution|Continue exploring|Download section|Free tools and downloads|Sources and further reading|یہ ٹیوٹوریل کس بارے میں ہے|مرحلہ وار رہنمائی|اہم نکات|یہ کیوں اہم ہے|ڈاؤن لوڈ سیکشن|ماخذ اور مزید مطالعہ)\b/gi, "## $1")
    .replace(/(^|\n)\s*(TL;DR)\s*:?\s*(?!\n)/gi, "$1## TL;DR\n")
    .replace(/(^|\n)\s*(What happened|What this AI update says|Steps to know|Risk to know|Project snapshot|Software snapshot|Research goal|Context to understand|How it works|یہ ٹیوٹوریل کس بارے میں ہے|مرحلہ وار رہنمائی)\s*:?\s*(?!\n)/gi, "$1## $2\n")
    .replace(/(^|\n)\s*(Key points|Key findings|اہم نکات)\s*[-:]?\s*/gi, "$1## $2\n- ")
    .replace(/(^|\n)\s*(Why it matters|Why it matters for builders|Why it matters for safety|Why it matters for the community|Limits and caution|یہ کیوں اہم ہے)\s*:?\s*(?!\n)/gi, "$1## $2\n")
    .replace(/(^|\n)\s*(Continue exploring|ڈاؤن لوڈ سیکشن|Download section)\s*:?\s*(?!\n)/gi, "$1## $2\n")
    .replace(/(^|\n)\s*(Free tools and downloads)\s*[-:]?\s*/gi, "$1## Free tools and downloads\n- ")
    .replace(/(^|\n)\s*(Sources and further reading|ماخذ اور مزید مطالعہ)\s*[-:]?\s*/gi, "$1## $2\n- ")
    .replace(/\s+- \[/g, "\n- [")
    .replace(/\s+- Source report:/g, "\n- Source report:")
    .replace(/\n-\s*-\s+/g, "\n- ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function slugifyHeading(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function stripRepeatedTitleFromContent(content = "", title = "") {
  const normalizedTitle = String(title || "").replace(/\s+/g, " ").trim().toLowerCase();
  if (!normalizedTitle) {
    return String(content || "");
  }

  const cleanedLines: string[] = [];
  let removedTitle = false;

  String(content || "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .forEach((line) => {
      const normalizedLine = String(line || "")
        .replace(/^#+\s*/, "")
        .replace(/\*\*/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();

      if (!removedTitle && normalizedLine === normalizedTitle) {
        removedTitle = true;
        return;
      }

      cleanedLines.push(line);
    });

  return cleanedLines.join("\n").replace(/^\s+/, "");
}

export function renderArticleBody(content = ""): ReactNode[] {
  const lines = normalizeStructuredContent(content).split("\n");
  const elements: ReactNode[] = [];
  let paragraphLines: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let listItems: string[] = [];

  const flushParagraph = () => {
    if (!paragraphLines.length) return;
    const text = paragraphLines.join(" ").trim();
    if (text) {
      elements.push(
        <p key={`p-${elements.length}`} className="mb-4 leading-8 text-foreground/90">
          {renderInlineContent(text)}
        </p>
      );
    }
    paragraphLines = [];
  };

  const flushList = () => {
    if (!listItems.length) return;
    const Tag = listType === "ol" ? "ol" : "ul";
    const className =
      listType === "ol"
        ? "mb-5 ms-6 list-decimal space-y-2"
        : "mb-5 ms-6 list-disc space-y-2";

    elements.push(
      <Tag key={`list-${elements.length}`} className={className}>
        {listItems.map((item, index) => (
          <li key={`item-${index}`}>{renderInlineContent(item)}</li>
        ))}
      </Tag>
    );

    listItems = [];
    listType = null;
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      return;
    }

    const headingMatch = line.match(/^(#{2,4})\s+(.*)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();
      const headingClass =
        level === 2
          ? "mt-10 mb-4 inline-flex rounded-full bg-primary/10 px-4 py-1.5 text-lg font-semibold text-primary"
          : level === 3
            ? "mt-8 mb-3 text-2xl font-semibold"
            : "mt-6 mb-2 text-xl font-semibold";
      const HeadingTag = level === 2 ? "h2" : level === 3 ? "h3" : "h4";
      const headingId = slugifyHeading(text) || `section-${elements.length}`;
      elements.push(
        <HeadingTag key={`h-${elements.length}`} id={headingId} className={headingClass}>
          {renderInlineContent(text)}
        </HeadingTag>
      );
      return;
    }

    if (/^[-*]\s+/.test(line)) {
      flushParagraph();
      if (listType && listType !== "ul") {
        flushList();
      }
      listType = "ul";
      listItems.push(line.replace(/^[-*]\s+/, "").trim());
      return;
    }

    if (/^\d+\.\s+/.test(line)) {
      flushParagraph();
      if (listType && listType !== "ol") {
        flushList();
      }
      listType = "ol";
      listItems.push(line.replace(/^\d+\.\s+/, "").trim());
      return;
    }

    if (listItems.length) {
      flushList();
    }

    paragraphLines.push(line);
  });

  flushParagraph();
  flushList();

  return elements;
}

export function MarkdownArticle({ content, title }: { content: string; title?: string }) {
  const cleaned = title ? stripRepeatedTitleFromContent(content, title) : content;
  return <div className="prose-article">{renderArticleBody(cleaned)}</div>;
}

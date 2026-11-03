"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bold,
  Code,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Strikethrough,
  Table as TableIcon,
  WrapText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { renderArticleBody } from "@/components/markdown-article";
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
  suggestMetaDescription,
  suggestSeoTitle,
  toHyperlink,
  wordCount,
  wrapSelection,
  type TextEdit,
} from "@/lib/cms/markdown-tools";

export interface EditorArticle {
  name: string;
  title: string;
  slug?: string;
  status?: string;
}

type LinkMode = "link" | "image" | "codeBlock";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  articles?: EditorArticle[];
  onExcerptSuggestion?: (excerpt: string) => void;
  onSeoSuggestion?: (seoTitle: string, metaDescription: string) => void;
}

const CODE_LANGUAGES = [
  "bash",
  "python",
  "javascript",
  "typescript",
  "sql",
  "yaml",
  "json",
  "html",
  "css",
  "text",
];

function ToolbarButton({
  label,
  onClick,
  children,
  active,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`grid size-8 place-items-center rounded-lg border transition ${
        active
          ? "border-amber-400 bg-amber-400/20 text-amber-700 dark:text-amber-300"
          : "border-transparent text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

export function MarkdownEditor({
  value,
  onChange,
  articles = [],
  onExcerptSuggestion,
  onSeoSuggestion,
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pendingSelection = useRef<{ start: number; end: number } | null>(null);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [codeLanguage, setCodeLanguage] = useState("bash");
  const [linkMode, setLinkMode] = useState<LinkMode | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [linkSearch, setLinkSearch] = useState("");
  const [linkSelection, setLinkSelection] = useState({ start: 0, end: 0 });

  useEffect(() => {
    const pending = pendingSelection.current;
    if (!pending) return;
    pendingSelection.current = null;
    const element = textareaRef.current;
    if (!element) return;
    element.focus();
    element.setSelectionRange(pending.start, pending.end);
  }, [value]);

  const selection = () => {
    const element = textareaRef.current;
    if (!element) return { start: 0, end: 0 };
    return { start: element.selectionStart, end: element.selectionEnd };
  };

  const applyEdit = (edit: TextEdit) => {
    pendingSelection.current = { start: edit.selectionStart, end: edit.selectionEnd };
    onChange(edit.text);
  };

  const editWithSelection = (transform: (start: number, end: number) => TextEdit) => {
    const current = selection();
    applyEdit(transform(current.start, current.end));
  };

  const codeBlocks = useMemo(() => findCodeBlocks(value), [value]);
  const words = useMemo(() => wordCount(value), [value]);
  const minutes = useMemo(() => readingMinutes(value), [value]);

  const filteredArticles = useMemo(() => {
    const query = linkSearch.trim().toLowerCase();
    const pool = articles.filter((article) => article.slug);
    if (!query) return pool.slice(0, 6);
    return pool
      .filter(
        (article) =>
          article.title.toLowerCase().includes(query) ||
          (article.slug || "").toLowerCase().includes(query)
      )
      .slice(0, 6);
  }, [articles, linkSearch]);

  function openLinkDialog(mode: LinkMode) {
    const current = selection();
    setLinkSelection(current);
    setLinkMode(mode);
    setLinkUrl("");
    setLinkSearch("");
    const selectedText = value.slice(current.start, current.end).trim();
    setLinkLabel(mode === "image" ? "" : selectedText);
  }

  function applyLink() {
    if (!linkMode) return;
    const url = linkUrl.trim();
    if (!url) return;

    let edit: TextEdit;
    if (linkMode === "image") {
      const alt = linkLabel.trim() || "image";
      const replaced = `![${alt}](${url})`;
      edit = {
        text:
          value.slice(0, linkSelection.start) +
          replaced +
          value.slice(linkSelection.end),
        selectionStart: linkSelection.start + replaced.length,
        selectionEnd: linkSelection.start + replaced.length,
      };
    } else if (linkMode === "codeBlock") {
      edit = codeBlockToLink(
        value,
        linkSelection.start,
        linkSelection.end,
        url,
        linkLabel.trim() || undefined
      );
    } else {
      edit = toHyperlink(
        value,
        linkSelection.start,
        linkSelection.end,
        url,
        linkLabel.trim() || undefined
      );
    }

    applyEdit(edit);
    setLinkMode(null);
  }

  function pickInternalArticle(article: EditorArticle) {
    if (!article.slug) return;
    setLinkUrl(`/articles/${article.slug}`);
    if (!linkLabel.trim()) setLinkLabel(article.title);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-black/10 bg-white dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex flex-wrap items-center gap-1 border-b border-black/10 bg-slate-50 px-2 py-1.5 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="mr-1 flex overflow-hidden rounded-lg border border-black/10 dark:border-white/10">
          {(["write", "preview"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setTab(mode)}
              className={`px-3 py-1 text-xs font-semibold capitalize transition ${
                tab === mode
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        <ToolbarButton label="Heading 2" onClick={() => editWithSelection((start, end) => prefixLines(value, start, end, "## "))}>
          <Heading2 />
        </ToolbarButton>
        <ToolbarButton label="Heading 3" onClick={() => editWithSelection((start, end) => prefixLines(value, start, end, "### "))}>
          <Heading3 />
        </ToolbarButton>
        <ToolbarButton label="Bold (Ctrl+B)" onClick={() => editWithSelection((start, end) => wrapSelection(value, start, end, "**"))}>
          <Bold />
        </ToolbarButton>
        <ToolbarButton label="Italic (Ctrl+I)" onClick={() => editWithSelection((start, end) => wrapSelection(value, start, end, "_"))}>
          <Italic />
        </ToolbarButton>
        <ToolbarButton label="Strikethrough" onClick={() => editWithSelection((start, end) => wrapSelection(value, start, end, "~~"))}>
          <Strikethrough />
        </ToolbarButton>
        <ToolbarButton label="Inline code" onClick={() => editWithSelection((start, end) => wrapSelection(value, start, end, "`"))}>
          <Code />
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-black/10 dark:bg-white/10" />

        <ToolbarButton label="Quote" onClick={() => editWithSelection((start, end) => prefixLines(value, start, end, "> "))}>
          <Quote />
        </ToolbarButton>
        <ToolbarButton label="Bullet list" onClick={() => editWithSelection((start, end) => prefixLines(value, start, end, "- "))}>
          <List />
        </ToolbarButton>
        <ToolbarButton label="Numbered list" onClick={() => editWithSelection((start, end) => prefixLines(value, start, end, "1. "))}>
          <ListOrdered />
        </ToolbarButton>
        <ToolbarButton label="Indent list" onClick={() => editWithSelection((start, end) => indentListItem(value, start, end))}>
          <WrapText />
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-black/10 dark:bg-white/10" />

        <select
          value={codeLanguage}
          onChange={(event) => setCodeLanguage(event.target.value)}
          aria-label="Code block language"
          className="h-8 rounded-lg border border-black/10 bg-white px-1.5 text-xs dark:border-white/10 dark:bg-slate-900"
        >
          {CODE_LANGUAGES.map((language) => (
            <option key={language} value={language}>
              {language}
            </option>
          ))}
        </select>
        <ToolbarButton
          label="Code block"
          onClick={() =>
            applyEdit(insertBlock(value, selection().start, `\`\`\`${codeLanguage}\n\n\`\`\``))
          }
        >
          <Code />
        </ToolbarButton>
        <ToolbarButton
          label="Table"
          onClick={() =>
            applyEdit(
              insertBlock(
                value,
                selection().start,
                buildTable(
                  ["Column 1", "Column 2"],
                  [["", ""], ["", ""]]
                )
              )
            )
          }
        >
          <TableIcon />
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-black/10 dark:bg-white/10" />

        <ToolbarButton label="Link (Ctrl+K)" onClick={() => openLinkDialog("link")}>
          <Link2 />
        </ToolbarButton>
        <ToolbarButton label="Image" onClick={() => openLinkDialog("image")}>
          <ImageIcon />
        </ToolbarButton>
        <ToolbarButton
          label="Convert code block to hyperlink"
          onClick={() => openLinkDialog("codeBlock")}
        >
          <WrapText />
        </ToolbarButton>
      </div>

      {linkMode && (
        <div className="border-b border-amber-300/60 bg-amber-50 p-4 dark:border-amber-400/30 dark:bg-amber-400/10">
          <div className="mb-3 text-sm font-semibold text-amber-900 dark:text-amber-200">
            {linkMode === "image"
              ? "Insert image"
              : linkMode === "codeBlock"
                ? "Convert code block to a hyperlink"
                : "Insert hyperlink"}
          </div>

          {linkMode === "codeBlock" && (
            <p className="mb-3 text-xs text-amber-800 dark:text-amber-300/90">
              {codeBlocks.length
                ? `${codeBlocks.length} code block${codeBlocks.length > 1 ? "s" : ""} in this article. The block under the cursor is replaced by a link.`
                : "No code block found near the cursor, so the current selection becomes the link text."}
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cms-link-url" className="text-xs">
                URL
              </Label>
              <Input
                id="cms-link-url"
                value={linkUrl}
                onChange={(event) => setLinkUrl(event.target.value)}
                placeholder="https://example.com/docs"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cms-link-label" className="text-xs">
                Link text
              </Label>
              <Input
                id="cms-link-label"
                value={linkLabel}
                onChange={(event) => setLinkLabel(event.target.value)}
                placeholder="Visible link text"
              />
            </div>
          </div>

          <div className="mt-3 space-y-1.5">
            <Label htmlFor="cms-link-search" className="text-xs">
              Link an existing article
            </Label>
            <Input
              id="cms-link-search"
              value={linkSearch}
              onChange={(event) => setLinkSearch(event.target.value)}
              placeholder="Search published articles…"
            />
            {filteredArticles.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1.5">
                {filteredArticles.map((article) => (
                  <button
                    key={article.name}
                    type="button"
                    onClick={() => pickInternalArticle(article)}
                    className="rounded-full border border-amber-400/50 bg-white px-2.5 py-1 text-xs text-slate-700 transition hover:bg-amber-100 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    {article.title}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={applyLink} className="bg-amber-500 text-slate-950 hover:bg-amber-400">
              Apply link
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setLinkMode(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {tab === "write" ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (!(event.ctrlKey || event.metaKey)) return;
            const key = event.key.toLowerCase();
            if (key === "b") {
              event.preventDefault();
              editWithSelection((start, end) => wrapSelection(value, start, end, "**"));
            } else if (key === "i") {
              event.preventDefault();
              editWithSelection((start, end) => wrapSelection(value, start, end, "_"));
            } else if (key === "k") {
              event.preventDefault();
              openLinkDialog("link");
            }
          }}
          spellCheck
          placeholder="# Start writing…"
          className="min-h-[440px] w-full resize-y bg-white px-4 py-3 font-mono text-[15px] leading-7 text-slate-900 outline-none dark:bg-transparent dark:text-slate-100"
        />
      ) : (
        <div className="min-h-[440px] px-4 py-3">
          {value.trim() ? (
            <div className="prose-article">{renderArticleBody(value)}</div>
          ) : (
            <p className="text-sm text-slate-400">Nothing to preview yet.</p>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-black/10 bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400">
        <span>
          {words} words · {value.length} characters · {minutes} min read
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onExcerptSuggestion?.(extractExcerpt(value))}
            className="rounded-md border border-black/10 px-2 py-1 transition hover:bg-white dark:border-white/10 dark:hover:bg-white/10"
          >
            Suggest excerpt
          </button>
          <button
            type="button"
            onClick={() =>
              onSeoSuggestion?.(
                suggestSeoTitle("", ""),
                suggestMetaDescription(value)
              )
            }
            className="rounded-md border border-black/10 px-2 py-1 transition hover:bg-white dark:border-white/10 dark:hover:bg-white/10"
          >
            Suggest meta description
          </button>
          <button
            type="button"
            onClick={() => applyEdit({ text: normalizeMarkdown(value), selectionStart: 0, selectionEnd: 0 })}
            className="rounded-md border border-black/10 px-2 py-1 transition hover:bg-white dark:border-white/10 dark:hover:bg-white/10"
          >
            Tidy formatting
          </button>
        </div>
      </div>
    </div>
  );
}

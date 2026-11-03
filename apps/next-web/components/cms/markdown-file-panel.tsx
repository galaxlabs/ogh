"use client";

import { useRef, useState } from "react";
import { ClipboardCopy, Download, FileDown, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  parseMarkdownFile,
  slugFromFilename,
  toMarkdownFile,
  type MarkdownExportSource,
} from "@/lib/cms/markdown-file";

export function MarkdownFilePanel({
  article,
  onImport,
}: {
  article: MarkdownExportSource;
  onImport: (meta: Record<string, string>, body: string) => void;
}) {
  const [fileName, setFileName] = useState("article.md");
  const inputRef = useRef<HTMLInputElement>(null);

  function buildFile() {
    return toMarkdownFile(article);
  }

  function download() {
    const blob = new Blob([buildFile()], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName || `${article.slug || "article"}.md`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Markdown file downloaded.");
  }

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(buildFile());
      toast.success("Markdown copied to the clipboard.");
    } catch {
      toast.error("The browser blocked clipboard access.");
    }
  }

  async function importFile(file: File) {
    const text = await file.text();
    const parsed = parseMarkdownFile(text);
    const meta = { ...parsed.meta } as Record<string, string>;
    if (!meta.slug) meta.slug = slugFromFilename(file.name);
    onImport(meta, parsed.body);
    toast.success("Markdown file loaded. Review it, then save.");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
          <FileDown className="size-4" /> Markdown file workflow
        </h2>
        <p className="mt-2 text-xs leading-5 text-slate-500">
          Write or edit an article in any markdown editor as a local{" "}
          <code className="rounded bg-muted px-1 font-mono">.md</code> file, then import it here.
          The front matter at the top of the file fills the article fields, and the rest becomes
          the body. Exporting produces the same format, so a round trip keeps everything.
        </p>
      </div>

      <div className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
        <div className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
          Export
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={fileName}
            onChange={(event) => setFileName(event.target.value)}
            aria-label="File name"
            className="h-9 w-full max-w-[220px] rounded-lg border border-input bg-transparent px-2.5 text-sm dark:bg-white/5"
          />
          <Button size="sm" onClick={download}>
            <Download /> Download .md
          </Button>
          <Button size="sm" variant="outline" onClick={copyToClipboard}>
            <ClipboardCopy /> Copy
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
        <div className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
          Import
        </div>
        <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
          <Upload /> Choose a .md file
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".md,.markdown,.mdx,text/markdown"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) importFile(file);
          }}
        />
        <p className="mt-2 text-xs text-slate-500">
          Front matter keys: title, slug, excerpt, status, content_type, publication, language,
          primary_keyword, seo_title, meta_description, canonical_url, featured_image, value_type,
          notes.
        </p>
      </div>
    </div>
  );
}

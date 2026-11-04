"use client";

import { useState } from "react";
import { Copy, Image as ImageIcon, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cmsMediaUrl } from "@/lib/cms/media-url";

export interface SocialPostSource {
  title?: string;
  slug?: string;
  excerpt?: string;
  primary_keyword?: string;
  topic?: string;
  featured_image?: string;
  status?: string;
}

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://openguidehub.org";

function buildPost(source: SocialPostSource) {
  const url = `${SITE}/articles/${source.slug || ""}`;
  const summary = (source.excerpt || "").trim();
  const tags = [source.primary_keyword, source.topic]
    .filter(Boolean)
    .map((tag) => `#${String(tag).replace(/[^a-zA-Z0-9]/g, "")}`)
    .filter((tag) => tag.length > 1)
    .slice(0, 3)
    .join(" ");

  return [
    source.title || "New guide",
    "",
    summary,
    "",
    url,
    tags,
  ]
    .filter((line) => line !== undefined)
    .join("\n")
    .trim();
}

export function SocialPostPanel({ article }: { article: SocialPostSource }) {
  const [post, setPost] = useState(() => buildPost(article));
  const [copied, setCopied] = useState(false);

  async function copy(text: string, message: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast.success(message);
    } catch {
      toast.error("The browser blocked clipboard access.");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          <Share2 className="size-4" /> Social post
        </h2>
        <Button size="xs" variant="ghost" onClick={() => setPost(buildPost(article))}>
          Rebuild
        </Button>
      </div>

      <p className="text-[11px] leading-4 text-slate-400">
        Ready made copy for sharing after you publish. Edit anything, then copy it into the
        network you want.
      </p>

      <Textarea
        value={post}
        onChange={(event) => setPost(event.target.value)}
        rows={7}
        aria-label="Social post text"
        className="text-xs"
      />

      <div className="flex flex-wrap gap-2">
        <Button size="xs" onClick={() => copy(post, "Post copied.")}>
          <Copy /> {copied ? "Copied" : "Copy post"}
        </Button>
        {article.featured_image && (
          <Button
            size="xs"
            variant="outline"
            onClick={() => copy(cmsMediaUrl(article.featured_image || ""), "Image URL copied.")}
          >
            <ImageIcon /> Copy image URL
          </Button>
        )}
      </div>

      {article.featured_image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={cmsMediaUrl(article.featured_image)}
          alt="Social preview"
          className="h-28 w-full rounded-lg border border-black/10 object-cover dark:border-white/10"
        />
      ) : (
        <p className="rounded-lg border border-dashed p-2.5 text-[11px] text-slate-400">
          No featured image yet. Pick one in the Media tab so the link shows a rich preview card.
        </p>
      )}

      {article.status !== "Published" && (
        <p className="text-[11px] text-amber-700 dark:text-amber-400">
          This article is not published yet, so the link will show a 404 until you publish it.
        </p>
      )}
    </div>
  );
}

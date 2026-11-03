"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Globe,
  PenLine,
  Type,
} from "lucide-react";

export interface DashboardArticle {
  name: string;
  title: string;
  status?: string;
  human_reviewed?: number;
  modified?: string;
}

interface SiteStats {
  articles?: number;
  words?: number;
  published_words?: number;
  average_words?: number;
  partial?: boolean;
}

export function DashboardPanel({
  articles,
  onOpen,
}: {
  articles: DashboardArticle[];
  onOpen: (name: string) => void;
}) {
  const [site, setSite] = useState<SiteStats>({});

  useEffect(() => {
    const timer = setTimeout(() => {
      fetch("/api/cms/site-stats", { cache: "no-store" })
        .then((response) => response.json())
        .then((data) => setSite(data || {}))
        .catch(() => undefined);
    }, 0);
    return () => clearTimeout(timer);
  }, []);
  const counts = articles.reduce<Record<string, number>>((acc, item) => {
    const status = item.status || "Draft";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const published = counts.Published || 0;
  const inReview = (counts.Review || 0) + (counts.QA || 0);
  const drafts = (counts.Draft || 0) + (counts.Idea || 0) + (counts.Research || 0);
  const needsWork = articles.filter(
    (item) =>
      item.status !== "Published" &&
      item.status !== "Retired" &&
      item.status !== "Rejected"
  );

  const cards = [
    { label: "Total", value: articles.length, icon: FileText, tone: "text-slate-700 dark:text-slate-200" },
    { label: "Live", value: published, icon: Globe, tone: "text-emerald-600 dark:text-emerald-400" },
    { label: "In review", value: inReview, icon: CheckCircle2, tone: "text-amber-600 dark:text-amber-400" },
    { label: "Drafts", value: drafts, icon: PenLine, tone: "text-slate-500" },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
        Dashboard
      </h2>

      <div className="rounded-xl border border-amber-300/60 bg-amber-50 p-3 dark:border-amber-400/30 dark:bg-amber-400/10">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-amber-800 dark:text-amber-300">
          <Type className="size-3.5" /> Whole site
        </div>
        <div className="mt-1 text-2xl font-semibold text-amber-950 dark:text-amber-100">
          {(site.words ?? 0).toLocaleString()}
        </div>
        <div className="text-xs text-amber-800/90 dark:text-amber-200/90">
          words across {site.articles ?? articles.length} articles ·{" "}
          {(site.published_words ?? 0).toLocaleString()} live · average{" "}
          {site.average_words ?? 0} words
          {site.partial ? " (counted the first 200 articles)" : ""}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-xl border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-white/[0.03]"
            >
              <div className={`flex items-center gap-1.5 text-xs ${card.tone}`}>
                <Icon className="size-3.5" /> {card.label}
              </div>
              <div className="mt-1 text-2xl font-semibold">{card.value}</div>
            </div>
          );
        })}
      </div>

      {needsWork.length > 0 && (
        <div className="rounded-xl border border-amber-300/60 bg-amber-50 p-3 dark:border-amber-400/30 dark:bg-amber-400/10">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
            <AlertTriangle className="size-3.5" /> Needs work ({needsWork.length})
          </div>
          <div className="space-y-1">
            {needsWork.slice(0, 5).map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => onOpen(item.name)}
                className="block w-full truncate text-left text-xs text-amber-900 underline-offset-2 hover:underline dark:text-amber-200"
              >
                {item.title}
                <span className="ms-2 opacity-70">{item.status}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowDownUp,
  BarChart3,
  Eye,
  FileText,
  LoaderCircle,
  RefreshCw,
  Search,
  Timer,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface StatsRow {
  name: string;
  title: string;
  slug: string;
  status: string;
  views: number;
  words: number;
  readingMinutes: number;
  score: number;
  faqCount: number;
  published_at?: string;
  modified?: string;
  content_type?: string;
}

type SortKey = "views" | "score" | "words" | "modified";

export function ArticleStats({ onOpen }: { onOpen: (name: string) => void }) {
  const [rows, setRows] = useState<StatsRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("views");
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/cms/stats", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not load statistics.");
      setRows(data.articles || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const visible = rows
    .filter((row) => row.title.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => {
      if (sortKey === "modified") {
        return String(b.modified || "").localeCompare(String(a.modified || ""));
      }
      return Number(b[sortKey] || 0) - Number(a[sortKey] || 0);
    });

  const mostRead = visible.reduce<StatsRow | null>(
    (best, row) => (!best || row.views > best.views ? row : best),
    null
  );
  const leastRead = visible.reduce<StatsRow | null>(
    (worst, row) => (!worst || row.views < worst.views ? row : worst),
    null
  );
  const totalViews = visible.reduce((sum, row) => sum + row.views, 0);
  const totalWords = visible.reduce((sum, row) => sum + row.words, 0);
  const averageScore = visible.length
    ? Math.round(visible.reduce((sum, row) => sum + row.score, 0) / visible.length)
    : 0;

  const sortButton = (key: SortKey, label: string) => (
    <Button
      size="xs"
      variant={sortKey === key ? "default" : "ghost"}
      onClick={() => setSortKey(key)}
    >
      <ArrowDownUp /> {label}
    </Button>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
          <BarChart3 className="size-4" /> Article statistics
        </h2>
        <div className="flex flex-wrap items-center gap-1.5">
          {sortButton("views", "Reads")}
          {sortButton("score", "Readiness")}
          {sortButton("words", "Words")}
          {sortButton("modified", "Recent")}
          <Button size="xs" variant="ghost" onClick={load} disabled={loading}>
            {loading ? <LoaderCircle className="animate-spin" /> : <RefreshCw />} Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <div className="rounded-xl border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Eye className="size-3.5" /> Total reads
          </div>
          <div className="mt-1 text-2xl font-semibold">{totalViews}</div>
        </div>
        <div className="rounded-xl border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <FileText className="size-3.5" /> Articles
          </div>
          <div className="mt-1 text-2xl font-semibold">{visible.length}</div>
        </div>
        <div className="rounded-xl border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Timer className="size-3.5" /> Words written
          </div>
          <div className="mt-1 text-2xl font-semibold">{totalWords}</div>
        </div>
        <div className="rounded-xl border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <BarChart3 className="size-3.5" /> Average readiness
          </div>
          <div className="mt-1 text-2xl font-semibold">{averageScore}</div>
        </div>
      </div>

      {mostRead && leastRead && visible.length > 1 && (
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-300/60 bg-emerald-50 p-3 text-sm dark:border-emerald-400/30 dark:bg-emerald-400/10">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800 dark:text-emerald-300">
              Most read
            </div>
            <div className="mt-1 font-medium text-emerald-950 dark:text-emerald-100">
              {mostRead.title}
            </div>
            <div className="text-xs text-emerald-800/80 dark:text-emerald-300/80">
              {mostRead.views} reads
            </div>
          </div>
          <div className="rounded-xl border border-amber-300/60 bg-amber-50 p-3 text-sm dark:border-amber-400/30 dark:bg-amber-400/10">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-800 dark:text-amber-300">
              Least read
            </div>
            <div className="mt-1 font-medium text-amber-950 dark:text-amber-100">
              {leastRead.title}
            </div>
            <div className="text-xs text-amber-800/80 dark:text-amber-300/80">
              {leastRead.views} reads
              {leastRead.status !== "Published" ? " (not live yet)" : ""}
            </div>
          </div>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search articles"
          className="h-9 bg-white pl-9 dark:bg-white/5"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-black/10 dark:border-white/10">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500 dark:bg-white/[0.04]">
            <tr>
              <th className="px-3 py-2 font-semibold">Article</th>
              <th className="px-3 py-2 font-semibold">Status</th>
              <th className="px-3 py-2 text-right font-semibold">Reads</th>
              <th className="px-3 py-2 text-right font-semibold">Words</th>
              <th className="px-3 py-2 text-right font-semibold">Readiness</th>
              <th className="px-3 py-2 text-right font-semibold">FAQ</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => {
              const max = Math.max(1, ...visible.map((item) => item.views));
              return (
                <tr
                  key={row.name}
                  className="border-t border-black/5 transition hover:bg-amber-50/60 dark:border-white/5 dark:hover:bg-white/[0.04]"
                >
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => onOpen(row.name)}
                      className="text-left font-medium hover:underline"
                    >
                      {row.title}
                    </button>
                    {row.views > 0 && (
                      <div className="mt-1 h-1 w-24 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                        <div
                          className="h-full rounded-full bg-amber-500"
                          style={{ width: `${Math.round((row.views / max) * 100)}%` }}
                        />
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <Badge variant="outline" className="text-[11px]">
                      {row.status}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{row.views}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{row.words}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    <span
                      className={
                        row.score >= 80
                          ? "text-emerald-600 dark:text-emerald-400"
                          : row.score >= 50
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-slate-400"
                      }
                    >
                      {row.score}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{row.faqCount}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs leading-5 text-slate-400">
        Reads are counted when a published article page is opened. The counter starts from the
        day tracking was enabled, so compare articles with each other rather than with an
        absolute number.
      </p>
    </div>
  );
}

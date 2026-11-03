"use client";

import { useCallback, useState } from "react";
import { BarChart3, Check, Loader2, Radar, Rocket, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Thread {
  url: string;
  title: string;
  source: string;
  score: number;
  solved?: boolean;
  signals?: { votes?: number; comments?: number; views?: number };
}

interface Pick {
  source_url: string;
  source_title: string;
  source: string;
  signals?: { votes?: number; comments?: number; views?: number };
  solved?: boolean;
  demand_score: number;
  title: string;
  topic: string;
  category_slug: string;
  angle: string;
  reason: string;
}

const VOICES = [
  { key: "zara", label: "Fashion editorial" },
  { key: "galaxy", label: "Deep tech review" },
  { key: "nike", label: "Sport performance" },
  { key: "editorial", label: "General editorial" },
];

export function DemandPanel() {
  const [queries, setQueries] = useState("how to style oversized shirt in summer\nnodejs memory leak debugging");
  const [brand, setBrand] = useState("galaxy");
  const [language, setLanguage] = useState("English");
  const [limit, setLimit] = useState(12);
  const [intervalHours, setIntervalHours] = useState(0);
  const [publish, setPublish] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reply, setReply] = useState("");
  const [threads, setThreads] = useState<Thread[]>([]);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [selected, setSelected] = useState<string[]>([]);

  const scan = useCallback(async () => {
    const list = queries
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (!list.length) {
      toast.error("Add at least one question or topic to look for.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/cms/agent/demand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "scan", queries: list, brand, language, limit }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.exception || "The scan failed.");
      if (data.available === false) {
        toast.error(data.message || "The web intelligence service is not reachable.");
        return;
      }
      setReply(data.reply || "");
      setThreads(data.threads || []);
      setPicks(data.picks || []);
      setSelected((data.picks || []).map((pick: Pick) => pick.source_url));
      toast.success(`Found ${(data.threads || []).length} threads, ${(data.picks || []).length} worth writing.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The scan failed.");
    } finally {
      setBusy(false);
    }
  }, [queries, brand, language, limit]);

  const write = useCallback(async () => {
    const chosen = picks.filter((pick) => selected.includes(pick.source_url));
    if (!chosen.length) {
      toast.error("Pick at least one thread to write.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/cms/agent/demand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "write",
          picks: chosen,
          brand,
          language,
          publish,
          intervalHours,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.exception || "The write failed.");
      toast.success(`${data.count} article(s) ${publish ? "published" : "written"}.`);
      if (publish) {
        setPicks([]);
        setSelected([]);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The write failed.");
    } finally {
      setBusy(false);
    }
  }, [picks, selected, brand, language, publish, intervalHours]);

  function toggle(url: string) {
    setSelected((current) =>
      current.includes(url) ? current.filter((item) => item !== url) : [...current, url]
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <section className="space-y-4 rounded-2xl border border-white/10 bg-[#0f172a]/80 p-5">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-white">
            <Radar className="size-4 text-amber-300" /> Demand scan
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            One question or topic per line. The agent searches the forums and the technical
            communities, scores the real demand and picks what is worth answering.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="demand-queries">Questions to look for</Label>
          <Textarea
            id="demand-queries"
            value={queries}
            onChange={(event) => setQueries(event.target.value)}
            className="min-h-28 bg-white/5"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="demand-brand">Brand voice</Label>
            <select
              id="demand-brand"
              value={brand}
              onChange={(event) => setBrand(event.target.value)}
              className="h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-slate-100"
            >
              {VOICES.map((voice) => (
                <option key={voice.key} value={voice.key} className="bg-slate-900">
                  {voice.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="demand-language">Language</Label>
            <select
              id="demand-language"
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className="h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-slate-100"
            >
              {["English", "Arabic", "Urdu"].map((item) => (
                <option key={item} value={item} className="bg-slate-900">
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="demand-limit">Threads</Label>
            <Input
              id="demand-limit"
              type="number"
              min={4}
              max={40}
              value={limit}
              onChange={(event) => setLimit(Number(event.target.value) || 12)}
              className="bg-white/5"
            />
          </div>
        </div>

        <Button onClick={scan} disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
          Scan for demand
        </Button>

        {reply ? (
          <p className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-slate-300">
            {reply}
          </p>
        ) : null}
      </section>

      <section className="space-y-3 rounded-2xl border border-white/10 bg-[#0f172a]/80 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-base font-semibold text-white">
            <BarChart3 className="size-4 text-amber-300" /> What the audience asks
          </h2>
          <Badge variant="outline" className="border-white/20 bg-white/5 text-slate-200">
            {threads.length} threads · {picks.length} picked
          </Badge>
        </div>

        {!threads.length ? (
          <p className="text-sm text-slate-400">
            Run a scan to see the questions with real demand behind them, the discussion numbers and
            the solved ones.
          </p>
        ) : (
          <ul className="space-y-2">
            {threads.map((thread) => {
              const pick = picks.find((item) => item.source_url === thread.url);
              const isSelected = selected.includes(thread.url);
              return (
                <li
                  key={thread.url}
                  className={`rounded-xl border p-3 text-sm transition ${
                    isSelected
                      ? "border-amber-400/50 bg-amber-400/10"
                      : "border-white/10 bg-black/20"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <button
                      type="button"
                      onClick={() => pick && toggle(thread.url)}
                      className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded border ${
                        isSelected ? "border-amber-300 bg-amber-300 text-slate-950" : "border-white/30"
                      }`}
                      aria-label="Select this thread"
                    >
                      {isSelected ? <Check className="size-3" /> : null}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-white">{pick?.title || thread.title}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {thread.source} · demand {thread.score.toFixed(2)}
                        {thread.solved ? " · solved" : ""}
                        {thread.signals?.votes ? ` · ${thread.signals.votes} votes` : ""}
                        {thread.signals?.views ? ` · ${thread.signals.views} views` : ""}
                      </p>
                      {pick?.reason ? (
                        <p className="mt-1 text-xs text-slate-500">{pick.reason}</p>
                      ) : null}
                      <a
                        href={thread.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-block text-xs text-sky-300 underline"
                      >
                        source thread
                      </a>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex flex-wrap items-center gap-3 border-t border-white/10 pt-3">
          <label className="flex items-center gap-2 text-xs text-slate-300">
            <input
              type="checkbox"
              checked={publish}
              onChange={(event) => setPublish(event.target.checked)}
              className="size-4"
            />
            Publish the articles
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-300">
            Hours apart
            <Input
              type="number"
              min={0}
              value={intervalHours}
              onChange={(event) => setIntervalHours(Number(event.target.value) || 0)}
              className="h-8 w-20 bg-white/5"
            />
          </label>
          <Button onClick={write} disabled={busy || !selected.length} className="ml-auto">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Rocket className="size-4" />}
            Write {selected.length || ""} article(s)
          </Button>
        </div>
      </section>
    </div>
  );
}

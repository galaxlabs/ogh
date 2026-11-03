"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bot, Layers, Loader2, Rocket, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Voice {
  key: string;
  label: string;
  tone?: string;
  keywords?: string[];
}

interface Category {
  name: string;
  slug: string;
  category_name: string;
  level: number;
  niche?: string;
}

interface AgentPackage {
  title?: string;
  slug?: string;
  excerpt?: string;
  meta_description?: string;
  primary_keyword?: string;
  secondary_keywords?: string[];
  search_intent?: string;
  content_type?: string;
  body_markdown?: string;
  faq?: { question?: string; answer?: string }[];
  simulated?: boolean;
  provider?: string | null;
  model?: string | null;
  provider_errors?: string[];
}

interface BlastRow {
  topic: string;
  category?: string | null;
  category_name?: string | null;
  title?: string | null;
  slug?: string | null;
  primary_keyword?: string | null;
  status?: string;
  article?: string | null;
  article_slug?: string | null;
  provider?: string | null;
  simulated?: boolean;
}

const CONTENT_TYPES = ["Article", "Guide", "Tutorial", "Review", "Explainer", "News"];
const LANGUAGES = ["English", "Arabic", "Urdu"];

export function AgentPanel() {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [providers, setProviders] = useState<Record<string, boolean>>({});
  const [providerSources, setProviderSources] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const [topic, setTopic] = useState("");
  const [brand, setBrand] = useState("zara");
  const [category, setCategory] = useState("");
  const [language, setLanguage] = useState("English");
  const [contentType, setContentType] = useState("Guide");
  const [busy, setBusy] = useState(false);
  const [packageResult, setPackageResult] = useState<AgentPackage | null>(null);

  const [blastTopics, setBlastTopics] = useState("");
  const [blastBrand, setBlastBrand] = useState("zara");
  const [blastLanguage, setBlastLanguage] = useState("English");
  const [blastInterval, setBlastInterval] = useState(0);
  const [blastBusy, setBlastBusy] = useState(false);
  const [blastRows, setBlastRows] = useState<BlastRow[]>([]);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/cms/agent/status", { cache: "no-store" });
      if (!response.ok) throw new Error("Could not load the agent status.");
      const data = await response.json();
      setVoices(data.voices || []);
      setCategories(data.categories || []);
      setProviders(data.providers || {});
      setProviderSources(data.provider_sources || {});
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load the agent.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const categoryOptions = useMemo(
    () =>
      categories
        .filter((item) => !item.slug.startsWith("shop-") && (item.level || 0) <= 4)
        .sort((a, b) => (a.level || 0) - (b.level || 0) || a.category_name.localeCompare(b.category_name)),
    [categories]
  );

  async function runAgent(publish: boolean) {
    if (!topic.trim()) {
      toast.error("Enter a topic first.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/cms/agent/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, brand, category, language, contentType, publish }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.exception || "The agent failed.");
      setPackageResult(data.package || null);
      if (data.article) {
        toast.success(`Published: ${data.article.title}`);
        setTopic("");
        setPackageResult(null);
      } else {
        toast.success("Package ready. Review it, then publish.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The agent failed.");
    } finally {
      setBusy(false);
    }
  }

  async function runBlast(publish: boolean) {
    const items = blastTopics
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [text, cat] = line.split("|").map((part) => part.trim());
        return cat ? { topic: text, category: cat } : { topic: text };
      });

    if (!items.length) {
      toast.error("Add at least one topic.");
      return;
    }

    setBlastBusy(true);
    try {
      const response = await fetch("/api/cms/agent/blast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          brand: blastBrand,
          language: blastLanguage,
          publish,
          intervalHours: blastInterval,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.exception || "The blast failed.");
      setBlastRows(data.results || []);
      toast.success(
        publish ? `Blast published: ${data.count} articles.` : `Plan ready: ${data.count} articles.`
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The blast failed.");
    } finally {
      setBlastBusy(false);
    }
  }

  const providerChips = (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="outline" className="border-white/20 bg-white/5 text-slate-200">
        <Bot className="mr-1 size-3" /> Content agent
      </Badge>
      {["openai", "cloud", "claude", "gemini", "cloudflare"].map((name) => (
        <Badge
          key={name}
          variant="outline"
          title={
            providerSources[`${name}_api_key`] ||
            providerSources[`${name}_ai_token`] ||
            "not configured"
          }
          className={
            providers[name]
              ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
              : "border-white/10 bg-white/5 text-slate-400"
          }
        >
          {name}
        </Badge>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/10 bg-[#0f172a]/80 p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold text-white">
              <Wand2 className="size-4 text-amber-300" /> Publish with the agent
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Write one article for the right category with search keywords, meta data and FAQ.
            </p>
          </div>
          {providerChips}
        </div>

        <p className="mb-4 text-xs text-slate-500">
          Keys are read from the Frappe single <span className="text-slate-400">Content AI Settings</span>{" "}
          (and then <span className="text-slate-400">Appointment Book Settings</span>). Without a key
          the agent still returns a structured simulated draft.
        </p>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="agent-topic">Topic</Label>
              <Input
                id="agent-topic"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder="How to style oversized shirts in Pakistan"
                className="bg-white/5"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="agent-brand">Brand voice</Label>
                <select
                  id="agent-brand"
                  value={brand}
                  onChange={(event) => setBrand(event.target.value)}
                  className="h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-slate-100"
                >
                  {voices.map((voice) => (
                    <option key={voice.key} value={voice.key} className="bg-slate-900">
                      {voice.label}
                    </option>
                  ))}
                  {!voices.length && <option value="zara">Fashion editorial</option>}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="agent-language">Language</Label>
                <select
                  id="agent-language"
                  value={language}
                  onChange={(event) => setLanguage(event.target.value)}
                  className="h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-slate-100"
                >
                  {LANGUAGES.map((item) => (
                    <option key={item} value={item} className="bg-slate-900">
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="agent-category">Target category</Label>
                <select
                  id="agent-category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-slate-100"
                >
                  <option value="" className="bg-slate-900">
                    Let the agent choose
                  </option>
                  {categoryOptions.map((item) => (
                    <option key={item.slug} value={item.slug} className="bg-slate-900">
                      {item.level ? "· ".repeat(Math.max(0, item.level - 1)) : ""}
                      {item.category_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="agent-type">Content type</Label>
                <select
                  id="agent-type"
                  value={contentType}
                  onChange={(event) => setContentType(event.target.value)}
                  className="h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-slate-100"
                >
                  {CONTENT_TYPES.map((item) => (
                    <option key={item} value={item} className="bg-slate-900">
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => runAgent(false)} disabled={busy || loading}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                Preview package
              </Button>
              <Button
                onClick={() => runAgent(true)}
                disabled={busy || loading}
                className="bg-amber-400 text-slate-950 hover:bg-amber-300"
              >
                <Rocket className="size-4" /> Publish now
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            {!packageResult ? (
              <p className="text-sm text-slate-400">
                The package preview shows the title, slug, keywords, meta description, FAQ and the
                generated body before anything is written.
              </p>
            ) : (
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Title</p>
                  <p className="mt-1 font-semibold text-white">{packageResult.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">/{packageResult.slug}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Primary keyword</p>
                  <p className="mt-1 text-amber-200">{packageResult.primary_keyword}</p>
                </div>
                {packageResult.secondary_keywords?.length ? (
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      Secondary keywords
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {packageResult.secondary_keywords.map((keyword) => (
                        <Badge
                          key={keyword}
                          variant="outline"
                          className="border-white/15 bg-white/5 text-slate-300"
                        >
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Meta description</p>
                  <p className="mt-1 text-slate-300">{packageResult.meta_description}</p>
                </div>
                {packageResult.faq?.length ? (
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">FAQ</p>
                    <ul className="mt-1 space-y-1 text-slate-300">
                      {packageResult.faq.map((entry, index) => (
                        <li key={`${entry.question}-${index}`}>
                          <span className="text-white">{entry.question}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {packageResult.body_markdown ? (
                  <details className="rounded-lg border border-white/10 bg-black/20 p-3">
                    <summary className="cursor-pointer text-xs uppercase tracking-[0.18em] text-slate-500">
                      Body preview
                    </summary>
                    <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap text-xs text-slate-300">
                      {packageResult.body_markdown.slice(0, 2400)}
                    </pre>
                  </details>
                ) : null}
                <p className="text-xs text-slate-500">
                  {packageResult.simulated
                    ? "Simulated draft: no AI provider answered, so the template was used."
                    : `Written by ${packageResult.provider} (${packageResult.model}).`}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#0f172a]/80 p-5">
        <div className="mb-4">
          <h2 className="flex items-center gap-2 text-base font-semibold text-white">
            <Layers className="size-4 text-amber-300" /> Blast publish
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            One topic per line. Add a category after a pipe to target it, for example
            {" `Erlang in production | technology`"}.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="space-y-3">
            <Textarea
              value={blastTopics}
              onChange={(event) => setBlastTopics(event.target.value)}
              placeholder={"How to style oversized shirts in Pakistan | womens-fashion\nErlang and Elixir in production | technology"}
              className="min-h-40 bg-white/5"
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="blast-brand">Brand voice</Label>
                <select
                  id="blast-brand"
                  value={blastBrand}
                  onChange={(event) => setBlastBrand(event.target.value)}
                  className="h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-slate-100"
                >
                  {voices.map((voice) => (
                    <option key={voice.key} value={voice.key} className="bg-slate-900">
                      {voice.label}
                    </option>
                  ))}
                  {!voices.length && <option value="zara">Fashion editorial</option>}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="blast-language">Language</Label>
                <select
                  id="blast-language"
                  value={blastLanguage}
                  onChange={(event) => setBlastLanguage(event.target.value)}
                  className="h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-slate-100"
                >
                  {LANGUAGES.map((item) => (
                    <option key={item} value={item} className="bg-slate-900">
                      {item}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="blast-interval">Hours between posts</Label>
                <Input
                  id="blast-interval"
                  type="number"
                  min={0}
                  value={blastInterval}
                  onChange={(event) => setBlastInterval(Number(event.target.value) || 0)}
                  className="bg-white/5"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => runBlast(false)} disabled={blastBusy}>
                {blastBusy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                Plan blast
              </Button>
              <Button
                onClick={() => runBlast(true)}
                disabled={blastBusy}
                className="bg-amber-400 text-slate-950 hover:bg-amber-300"
              >
                <Rocket className="size-4" /> Publish blast
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Plan</p>
            {!blastRows.length ? (
              <p className="mt-2 text-sm text-slate-400">
                Plan the blast first to see which category each topic lands in and which keyword it
                targets.
              </p>
            ) : (
              <ul className="mt-2 space-y-2 text-sm">
                {blastRows.map((row, index) => (
                  <li key={`${row.topic}-${index}`} className="rounded-lg bg-white/5 p-2.5">
                    <p className="font-medium text-white">{row.title || row.topic}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {row.category_name || "unassigned"} · {row.primary_keyword || "no keyword"}
                      {row.simulated ? " · simulated" : ""}
                    </p>
                    {row.article_slug ? (
                      <p className="mt-0.5 text-xs text-emerald-300">/{row.article_slug}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

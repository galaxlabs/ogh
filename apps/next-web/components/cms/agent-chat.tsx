"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, Link2, Send, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface AgentArticle {
  title?: string;
  slug?: string;
  category?: string | null;
  category_name?: string | null;
  primary_keyword?: string | null;
  secondary_keywords?: string[] | null;
  reason?: string;
  status?: string;
  article_slug?: string | null;
  published_at?: string | null;
  simulated?: boolean;
  provider?: string | null;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  articles?: AgentArticle[];
  seed_source?: string;
}

const VOICES = [
  { key: "zara", label: "Fashion editorial" },
  { key: "galaxy", label: "Deep tech review" },
  { key: "nike", label: "Sport performance" },
  { key: "editorial", label: "General editorial" },
];

export function AgentChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [session, setSession] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [seedUrl, setSeedUrl] = useState("");
  const [seedText, setSeedText] = useState("");
  const [brand, setBrand] = useState("zara");
  const [count, setCount] = useState(3);
  const [intervalHours, setIntervalHours] = useState(0);
  const [publish, setPublish] = useState(false);
  const [busy, setBusy] = useState(false);
  const logRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = useCallback(async () => {
    if (!message.trim() && !seedUrl.trim() && !seedText.trim()) {
      toast.error("Give the agent a topic, a URL or some text to work from.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/cms/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          seedUrl,
          seedText,
          brand,
          count,
          publish,
          intervalHours,
          session,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.exception || "The agent failed.");

      setMessages((current) => [
        ...current,
        { role: "user", content: message || seedUrl || seedText },
        { role: "assistant", content: data.reply || "", articles: data.articles || [] },
      ]);
      setSession(data.session ?? null);
      setMessage("");
      setSeedText("");
      if (publish) {
        const published = ((data.articles || []) as AgentArticle[]).filter(
          (item) => item.status !== "planned"
        ).length;
        toast.success(`Agent finished: ${published} article(s) written.`);
      } else {
        toast.success("Plan ready. Review it, then publish.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The agent failed.");
    } finally {
      setBusy(false);
    }
  }, [message, seedUrl, seedText, brand, count, publish, intervalHours, session]);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <section className="flex min-h-[520px] flex-col rounded-2xl border border-white/10 bg-[#0f172a]/80">
        <header className="flex items-center justify-between gap-3 border-b border-white/10 p-4">
          <h2 className="flex items-center gap-2 text-base font-semibold text-white">
            <Bot className="size-4 text-amber-300" /> Agent chat
          </h2>
          <Badge variant="outline" className="border-white/20 bg-white/5 text-slate-200">
            {messages.length ? `${messages.length} turns` : "new session"}
          </Badge>
        </header>

        <div ref={logRef} className="flex-1 space-y-3 overflow-y-auto p-4">
          {!messages.length ? (
            <p className="text-sm text-slate-400">
              Paste a URL, some text or a topic. The agent reads it, plans the articles that are
              worth writing next, files every one under the right category and can publish them
              straight away or on a schedule.
            </p>
          ) : null}

          {messages.map((entry, index) =>
            entry.role === "user" ? (
              <div key={`u-${index}`} className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-amber-400 px-4 py-2.5 text-sm text-slate-950">
                {entry.content}
              </div>
            ) : (
              <div key={`a-${index}`} className="max-w-[92%] space-y-2">
                <div className="rounded-2xl rounded-bl-sm bg-white/5 px-4 py-2.5 text-sm text-slate-100">
                  {entry.content}
                </div>
                {(entry.articles ?? []).length ? (
                  <ul className="space-y-2">
                    {(entry.articles ?? []).map((article, articleIndex) => (
                      <li key={`${article.title}-${articleIndex}`} className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <strong className="text-white">{article.title}</strong>
                          <Badge
                            variant="outline"
                            className={
                              article.status === "published"
                                ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
                                : article.status === "scheduled"
                                  ? "border-sky-400/40 bg-sky-400/10 text-sky-200"
                                  : "border-white/15 bg-white/5 text-slate-300"
                            }
                          >
                            {article.status}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-slate-400">
                          {article.category_name || article.category || "unassigned"} ·{" "}
                          {article.primary_keyword || "no keyword"}
                          {article.simulated ? " · simulated" : ""}
                        </p>
                        {article.reason ? (
                          <p className="mt-1 text-xs text-slate-500">{article.reason}</p>
                        ) : null}
                        {article.article_slug ? (
                          <p className="mt-1 text-xs text-emerald-300">/articles/{article.article_slug}</p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            )
          )}

          {busy ? (
            <div className="text-sm text-slate-400">
              <Wand2 className="mr-2 inline size-4 animate-pulse" />
              The agent is reading the seed and planning articles…
            </div>
          ) : null}
        </div>

        <div className="space-y-2 border-t border-white/10 p-4">
          <Textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="What should the agent write about?"
            className="min-h-20 bg-white/5"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={send} disabled={busy}>
              <Send className="size-4" /> Send to the agent
            </Button>
            <label className="flex items-center gap-2 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={publish}
                onChange={(event) => setPublish(event.target.checked)}
                className="size-4"
              />
              Publish the result
            </label>
          </div>
        </div>
      </section>

      <aside className="space-y-4">
        <section className="space-y-3 rounded-2xl border border-white/10 bg-[#0f172a]/80 p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
            <Sparkles className="size-4 text-amber-300" /> Seed material
          </h3>
          <div className="space-y-1.5">
            <Label htmlFor="chat-url">Source URL</Label>
            <div className="relative">
              <Link2 className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="chat-url"
                value={seedUrl}
                onChange={(event) => setSeedUrl(event.target.value)}
                placeholder="https://example.com/article"
                className="bg-white/5 pl-9"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="chat-seed">Or paste the content</Label>
            <Textarea
              id="chat-seed"
              value={seedText}
              onChange={(event) => setSeedText(event.target.value)}
              placeholder="Paste an article, a brief or a set of notes…"
              className="min-h-28 bg-white/5"
            />
          </div>
        </section>

        <section className="space-y-3 rounded-2xl border border-white/10 bg-[#0f172a]/80 p-4">
          <h3 className="text-sm font-semibold text-white">Campaign settings</h3>
          <div className="space-y-1.5">
            <Label htmlFor="chat-brand">Brand voice</Label>
            <select
              id="chat-brand"
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
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="chat-count">Articles</Label>
              <Input
                id="chat-count"
                type="number"
                min={1}
                max={12}
                value={count}
                onChange={(event) => setCount(Number(event.target.value) || 1)}
                className="bg-white/5"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="chat-interval">Hours apart</Label>
              <Input
                id="chat-interval"
                type="number"
                min={0}
                value={intervalHours}
                onChange={(event) => setIntervalHours(Number(event.target.value) || 0)}
                className="bg-white/5"
              />
            </div>
          </div>
          <p className="text-xs text-slate-500">
            With an interval the articles are scheduled and the bot publishes them automatically.
          </p>
        </section>
      </aside>
    </div>
  );
}

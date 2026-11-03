"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  Radar,
  Clock,
  Cloud,
  ExternalLink,
  FileText,
  LoaderCircle,
  LogOut,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownEditor } from "@/components/cms/markdown-editor";
import { DashboardPanel } from "@/components/cms/dashboard-panel";
import { MediaLibrary } from "@/components/cms/media-library";
import { RevisionHistory } from "@/components/cms/revision-history";
import { ArticleStats } from "@/components/cms/article-stats";
import { MarkdownFilePanel } from "@/components/cms/markdown-file-panel";
import { CategoryPicker, type CategoryOption } from "@/components/cms/category-picker";
import { SocialPostPanel } from "@/components/cms/social-post-panel";
import { slugify, suggestSeoTitle } from "@/lib/cms/markdown-tools";
import { analyzeArticle, buildArticleTemplate } from "@/lib/cms/article-template";
import type { CmsCapabilities, CmsProfile } from "@/lib/server/cms-policy";

type SessionState = "loading" | "guest" | "authenticated";

interface ArticleSummary {
  name: string;
  title: string;
  slug?: string;
  excerpt?: string;
  status?: string;
  content_type?: string;
  publication?: string;
  language?: string;
  featured_image?: string;
  published_at?: string;
  modified?: string;
}

interface Article extends ArticleSummary {
  body?: string;
  /** Topic slug from the Content Category tree. */
  category?: string;
  /** When the article goes live. A future value schedules it. */
  published_at?: string;
  niche?: string;
  story_cluster?: string;
  primary_keyword?: string;
  seo_title?: string;
  meta_description?: string;
  canonical_url?: string;
  noindex?: number;
  value_type?: string;
  human_reviewed?: number;
  notes?: string;
}

interface PublicationOption {
  name: string;
  publication_name?: string;
  code?: string;
}

const EMPTY_ARTICLE: Article = {
  name: "",
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  status: "Draft",
  content_type: "Guide",
  publication: "",
  language: "",
  featured_image: "",
  primary_keyword: "",
  seo_title: "",
  meta_description: "",
  canonical_url: "",
  noindex: 0,
  value_type: "Explainer",
  human_reviewed: 0,
  notes: "",
};

const STATUSES = [
  "Idea",
  "Draft",
  "Research",
  "QA",
  "Review",
  "Scheduled",
  "Published",
  "Updating",
  "Retired",
  "Rejected",
];

const CONTENT_TYPES = ["Article", "News", "Tutorial", "Review", "Guide", "Explainer", "Research", "Translation"];

const NO_CAPABILITIES: CmsCapabilities = {
  read: false,
  create: false,
  write: false,
  delete: false,
  publish: false,
  unpublish: false,
  review: false,
  manage_seo: false,
  bulk_actions: false,
  use_editor_tools: false,
};

const EDITORIAL_ROLES = [
  "System Manager",
  "Galaxy Publication Manager",
  "Galaxy Editor",
  "Galaxy Reviewer",
  "Galaxy SEO Manager",
  "Galaxy Agent Operator",
];

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  const text = await response.text();
  let payload: { message?: string } & T;
  try {
    payload = JSON.parse(text) as { message?: string } & T;
  } catch {
    payload = { message: text } as { message?: string } & T;
  }
  if (!response.ok) {
    const error = new Error(payload.message || "The request failed.") as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  return payload;
}

function formatDate(value?: string) {
  if (!value) return "Not saved yet";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value.replace(" ", "T") + (value.includes("Z") ? "" : "Z"))
  );
}

function statusTone(status?: string) {
  if (status === "Published") return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";
  if (status === "Review" || status === "QA") return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300";
  if (status === "Rejected" || status === "Retired") return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300";
  return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
}

export function ContentStudio() {
  const [session, setSession] = useState<SessionState>("loading");
  const [user, setUser] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [publications, setPublications] = useState<PublicationOption[]>([]);
  const [languages, setLanguages] = useState<{ name: string }[]>([]);
  const [article, setArticle] = useState<Article>(EMPTY_ARTICLE);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadingArticle, setLoadingArticle] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [profile, setProfile] = useState<CmsProfile | null>(null);
  const [view, setView] = useState<"content" | "markdown" | "revisions" | "media" | "stats">("content");
  const [selected, setSelected] = useState<string[]>([]);
  const [mediaTarget, setMediaTarget] = useState<"body" | "featured">("body");
  const [showAllChecks, setShowAllChecks] = useState(false);
  const [categoryTree, setCategoryTree] = useState<CategoryOption[]>([]);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const capabilities = profile?.capabilities ?? NO_CAPABILITIES;

  const editorialRoles = useMemo(
    () =>
      (profile?.roles ?? []).filter((role) =>
        EDITORIAL_ROLES.includes(role)
      ),
    [profile?.roles]
  );

  const allowedStatuses = useMemo(
    () =>
      STATUSES.filter((status) => {
        if (status === "Published") return capabilities.publish;
        if (status === "Review" || status === "QA") return capabilities.review;
        if (status === "Retired" || status === "Rejected") return capabilities.unpublish;
        return true;
      }),
    [capabilities.publish, capabilities.review, capabilities.unpublish]
  );

  const analysis = useMemo(
    () =>
      analyzeArticle({
        title: article.title,
        body: article.body,
        excerpt: article.excerpt,
        seo_title: article.seo_title,
        meta_description: article.meta_description,
        canonical_url: article.canonical_url,
        featured_image: article.featured_image,
        noindex: article.noindex,
        status: article.status,
        primary_keyword: article.primary_keyword,
        human_reviewed: article.human_reviewed,
        value_type: article.value_type,
      }),
    [article]
  );

  const nextActions = useMemo(
    () =>
      analysis.checks
        .filter((check) => !check.ok)
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 3),
    [analysis.checks]
  );

  useEffect(() => {
    if (session !== "authenticated") return;
    function onKeyDown(event: KeyboardEvent) {
      if (!(event.ctrlKey || event.metaKey)) return;
      if (event.key.toLowerCase() !== "s") return;
      event.preventDefault();
      if (!busy && dirty && capabilities.write) {
        saveArticle();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  useEffect(() => {
    async function restoreSession() {
      try {
        const data = await requestJson<{ authenticated: boolean; user: string }>("/api/cms/session");
        setUser(data.user);
        setSession("authenticated");
      } catch {
        setSession("guest");
      }
    }
    restoreSession();
  }, []);

  useEffect(() => {
    if (session !== "authenticated") return;
    refreshWorkspace();
    requestJson<CmsProfile>("/api/cms/profile")
      .then(setProfile)
      .catch((error) => toast.error((error as Error).message));
  }, [session]);

  useEffect(() => {
    function warnBeforeLeaving(event: BeforeUnloadEvent) {
      if (!dirty) return;
      event.preventDefault();
    }
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [dirty]);

  async function refreshWorkspace() {
    setBusy(true);
    try {
      const [articleData, optionData, categoryData] = await Promise.all([
        requestJson<{ articles: ArticleSummary[] }>("/api/cms/articles"),
        requestJson<{ publications: PublicationOption[]; languages: { name: string }[] }>("/api/cms/options"),
        requestJson<{ categories: CategoryOption[] }>("/api/cms/categories").catch(() => ({
          categories: [],
        })),
      ]);
      setCategoryTree(categoryData.categories || []);
      setArticles(articleData.articles);
      setPublications(optionData.publications);
      setLanguages(optionData.languages);
    } catch (error) {
      const status = (error as Error & { status?: number }).status;
      if (status === 401) {
        setSession("guest");
        setUser("");
        toast.error("Your session expired. Please sign in again.");
      } else {
        toast.error((error as Error).message);
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const data = await requestJson<{ authenticated: boolean; user: string }>("/api/cms/session", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      setUser(data.user);
      setPassword("");
      setSession("authenticated");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    if (dirty && !window.confirm("Discard your unsaved changes and sign out?")) return;
    setBusy(true);
    try {
      await requestJson("/api/cms/session", { method: "DELETE" });
    } finally {
      setArticle(EMPTY_ARTICLE);
      setArticles([]);
      setUser("");
      setDirty(false);
      setBusy(false);
      setSession("guest");
    }
  }

  function confirmDiscard() {
    return !dirty || window.confirm("Discard your unsaved changes?");
  }

  function toggleSelected(name: string) {
    setSelected((current) =>
      current.includes(name)
        ? current.filter((item) => item !== name)
        : [...current, name]
    );
  }

  async function bulkStatus(status: string) {
    if (!selected.length) return;
    const targets = articles.filter((item) => selected.includes(item.name));
    setBusy(true);
    let updated = 0;
    let failed = 0;
    for (const target of targets) {
      try {
        await requestJson(`/api/cms/articles/${encodeURIComponent(target.name)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: target.title, status }),
        });
        updated += 1;
      } catch {
        failed += 1;
      }
    }
    setBusy(false);
    setSelected([]);
    await refreshWorkspace();
    if (failed) {
      toast.error(`${updated} updated, ${failed} blocked by your role.`);
    } else {
      toast.success(`${updated} article${updated === 1 ? "" : "s"} moved to ${status}.`);
    }
  }

  function pickMedia(url: string) {
    if (mediaTarget === "featured") {
      updateArticle("featured_image", url);
      setView("content");
      toast.success("Featured image updated.");
      return;
    }
    const current = article.body || "";
    const separator = current.endsWith("\n") || current === "" ? "" : "\n\n";
    updateArticle("body", `${current}${separator}![image](${url})`);
    toast.success("Image inserted into the body.");
  }

  function createArticle() {
    if (!confirmDiscard()) return;
    setArticle({ ...EMPTY_ARTICLE, publication: publications[0]?.name || "" });
    setDirty(false);
  }

  async function openArticle(name: string) {
    if (!confirmDiscard()) return;
    setLoadingArticle(true);
    try {
      const data = await requestJson<{ article: Article }>(`/api/cms/articles/${encodeURIComponent(name)}`);
      setArticle({ ...EMPTY_ARTICLE, ...data.article });
      setDirty(false);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoadingArticle(false);
    }
  }

  function updateArticle<K extends keyof Article>(key: K, value: Article[K]) {
    setArticle((current) => ({ ...current, [key]: value }));
    setDirty(true);
  }

  function updateTitle(title: string) {
    setArticle((current) => ({
      ...current,
      title,
      slug: current.slug || slugify(title),
    }));
    setDirty(true);
  }

  const persistArticle = useCallback(async (options: { silent?: boolean; overrides?: Partial<Article> } = {}) => {
    const payload = { ...article, ...(options.overrides || {}) };
    if (!payload.title?.trim()) {
      if (!options.silent) toast.error("Add an article title before saving.");
      return null;
    }
    if (!payload.publication) {
      if (!options.silent) toast.error("Select a publication before saving.");
      return null;
    }

    const path = article.name
      ? `/api/cms/articles/${encodeURIComponent(article.name)}`
      : "/api/cms/articles";
    const data = await requestJson<{ article: Article }>(path, {
      method: article.name ? "PUT" : "POST",
      body: JSON.stringify(payload),
    });
    setArticle({ ...EMPTY_ARTICLE, ...data.article });
    setDirty(false);
    return data.article;
  }, [article]);

  async function saveArticle() {
    setBusy(true);
    try {
      const saved = await persistArticle();
      if (!saved) return;
      await refreshWorkspace();
      toast.success(article.name ? "Article updated in Frappe." : "Article created in Frappe.");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function publishArticle() {
    if (!capabilities.publish) {
      toast.error("Your role cannot publish articles.");
      return;
    }
    setBusy(true);
    try {
      const saved = await persistArticle({
        overrides: { status: "Published", published_at: new Date().toISOString().slice(0, 19).replace("T", " ") },
      });
      if (!saved) return;
      await refreshWorkspace();
      toast.success("Article published.");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function scheduleArticle() {
    if (!capabilities.publish) {
      toast.error("Your role cannot publish articles.");
      return;
    }
    const chosen = window.prompt(
      "Publish date and time (YYYY-MM-DD HH:MM). Leave empty to cancel.",
      (article.published_at || "").slice(0, 16)
    );
    if (!chosen) return;
    const when = chosen.trim().replace("T", " ");
    if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(when)) {
      toast.error("Use the format YYYY-MM-DD HH:MM.");
      return;
    }
    setBusy(true);
    try {
      const saved = await persistArticle({
        overrides: { status: "Published", published_at: when },
      });
      if (!saved) return;
      await refreshWorkspace();
      toast.success(`Article scheduled for ${when}.`);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function insertTemplate() {
    if (!capabilities.use_editor_tools) return;
    const existing = (article.body || "").trim();
    if (existing && !window.confirm("Replace the current body with the article template?")) {
      return;
    }
    updateArticle(
      "body",
      buildArticleTemplate({
        title: article.title,
        keyword: article.primary_keyword,
      })
    );
    toast.success("Template inserted. Fill in each section.");
  }

  useEffect(() => {
    if (!dirty || !article.name || !capabilities.write) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      setSaveState("saving");
      persistArticle({ silent: true })
        .then((saved) => setSaveState(saved ? "saved" : "idle"))
        .catch((error) => {
          setSaveState("error");
          toast.error((error as Error).message);
        });
    }, 3000);

    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, [dirty, article, capabilities.write, persistArticle]);

  async function deleteArticle() {
    if (!article.name || !window.confirm(`Permanently delete “${article.title}”?`)) return;
    setBusy(true);
    try {
      await requestJson(`/api/cms/articles/${encodeURIComponent(article.name)}`, { method: "DELETE" });
      setArticle({ ...EMPTY_ARTICLE, publication: publications[0]?.name || "" });
      setDirty(false);
      await refreshWorkspace();
      toast.success("Article deleted.");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const filteredArticles = articles.filter((item) => {
    const haystack = `${item.title} ${item.slug || ""} ${item.status || ""}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  if (session === "loading") {
    return (
      <main className="grid min-h-screen place-items-center bg-[#111827] text-white">
        <LoaderCircle className="size-8 animate-spin text-amber-400" aria-label="Loading Content Studio" />
      </main>
    );
  }

  if (session === "guest") {
    return (
      <main className="min-h-screen bg-[#111827] px-5 py-12 text-slate-100 sm:py-20">
        <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#172033] shadow-2xl shadow-black/30 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="relative hidden min-h-[620px] overflow-hidden border-r border-white/10 p-12 lg:block">
            <div className="absolute -left-20 top-44 size-80 rounded-full bg-amber-400/10 blur-3xl" />
            <div className="relative flex h-full flex-col justify-between">
              <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">
                <span className="grid size-9 place-items-center rounded-xl bg-amber-400 text-slate-950">OG</span>
                OpenGuideHub
              </div>
              <div>
                <div className="mb-5 h-1 w-14 bg-amber-400" />
                <h1 className="max-w-lg text-5xl font-semibold leading-[1.05] tracking-tight">
                  Publish useful knowledge, not dashboard clutter.
                </h1>
                <p className="mt-6 max-w-md text-lg leading-8 text-slate-300">
                  Content Studio is the editorial surface for articles stored and permissioned by Galaxy Ops Platform.
                </p>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <ShieldCheck className="size-5 text-emerald-400" />
                Frappe roles and permissions enforced
              </div>
            </div>
          </section>

          <section className="flex min-h-[620px] items-center p-7 sm:p-12">
            <form onSubmit={handleLogin} className="w-full space-y-7">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">Content Studio</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight">Sign in with Frappe</h2>
                <p className="mt-3 leading-7 text-slate-400">
                  Use an account with Content Article access. Credentials are never stored by OpenGuideHub.
                </p>
              </div>
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="cms-username" className="text-slate-200">Email or username</Label>
                  <Input
                    id="cms-username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    autoComplete="username"
                    className="h-11 border-white/15 bg-white/5 text-white placeholder:text-slate-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cms-password" className="text-slate-200">Password</Label>
                  <Input
                    id="cms-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    className="h-11 border-white/15 bg-white/5 text-white"
                    required
                  />
                </div>
              </div>
              <Button type="submit" disabled={busy} className="h-11 w-full bg-amber-400 text-slate-950 hover:bg-amber-300">
                {busy ? <LoaderCircle className="animate-spin" /> : <ShieldCheck />}
                Enter Content Studio
              </Button>
            </form>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f3f1eb] text-slate-950 dark:bg-[#0e1524] dark:text-slate-100">
      <header className="border-b border-black/10 bg-[#172033] text-white dark:border-white/10">
        <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-amber-400 text-xs font-black text-slate-950">OG</span>
            <div>
              <div className="font-semibold tracking-tight">Content Studio</div>
              <div className="text-xs text-slate-400">OpenGuideHub editorial workspace</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 pr-3 text-xs text-slate-400 md:flex">
              <Cloud className="size-4 text-emerald-400" />
              {user}
            </div>
            {editorialRoles.length > 0 && (
              <div className="hidden items-center gap-1.5 lg:flex">
                {editorialRoles.map((role) => (
                  <Badge
                    key={role}
                    variant="outline"
                    className="border-white/20 bg-white/5 text-slate-200"
                  >
                    {role}
                  </Badge>
                ))}
              </div>
            )}
            {saveState !== "idle" && (
              <div className="hidden text-xs text-slate-400 sm:block">
                {saveState === "saving"
                  ? "Saving…"
                  : saveState === "saved"
                    ? "Saved automatically"
                    : "Autosave failed"}
              </div>
            )}
            <Link
              href="/admin/agent/demand"
              className="hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white md:flex"
            >
              <Radar className="size-4 text-amber-300" /> Demand
            </Link>
            <Link
              href="/admin/agent/chat"
              className="hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white md:flex"
            >
              <Bot className="size-4 text-amber-300" /> Chat
            </Link>
            <Link
              href="/admin/agent"
              className="hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white sm:flex"
            >
              <Sparkles className="size-4 text-amber-300" /> Agent
            </Link>
            <Button variant="ghost" size="icon" onClick={refreshWorkspace} disabled={busy} className="text-slate-300 hover:bg-white/10 hover:text-white" aria-label="Refresh">
              <RefreshCw className={busy ? "animate-spin" : ""} />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-300 hover:bg-white/10 hover:text-white" aria-label="Sign out">
              <LogOut />
            </Button>
          </div>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-4rem)] xl:grid-cols-[340px_minmax(0,1fr)_320px]">
        <aside className="border-b border-black/10 bg-white/70 p-4 dark:border-white/10 dark:bg-[#111a2b] xl:border-b-0 xl:border-r">
          <div className="mb-5">
            <DashboardPanel articles={articles} onOpen={openArticle} />
          </div>

          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Library</div>
              <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">{articles.length} articles</div>
            </div>
            <Button onClick={createArticle} size="sm" disabled={!capabilities.create} title={capabilities.create ? "Create a new article" : "Your role cannot create articles"} className="bg-amber-400 text-slate-950 hover:bg-amber-300">
              <Plus /> New
            </Button>
          </div>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title or status" className="h-10 bg-white pl-9 dark:bg-white/5" />
          </div>
          {selected.length > 0 && (
            <div className="mb-3 rounded-xl border border-amber-300/60 bg-amber-50 p-2.5 dark:border-amber-400/30 dark:bg-amber-400/10">
              <div className="mb-2 text-xs font-semibold text-amber-900 dark:text-amber-200">
                {selected.length} selected
              </div>
              <div className="flex flex-wrap gap-1.5">
                {capabilities.publish && (
                  <Button size="xs" variant="outline" disabled={busy} onClick={() => bulkStatus("Published")}>
                    Publish
                  </Button>
                )}
                {capabilities.review && (
                  <Button size="xs" variant="outline" disabled={busy} onClick={() => bulkStatus("Review")}>
                    Send to review
                  </Button>
                )}
                {capabilities.unpublish && (
                  <Button size="xs" variant="outline" disabled={busy} onClick={() => bulkStatus("Draft")}>
                    Move to draft
                  </Button>
                )}
                <Button size="xs" variant="ghost" disabled={busy} onClick={() => setSelected([])}>
                  Clear
                </Button>
              </div>
            </div>
          )}

          <div className="grid max-h-[420px] gap-2 overflow-y-auto pr-1 xl:max-h-[calc(100vh-26rem)]">
            {filteredArticles.map((item) => (
              <div
                key={item.name}
                className={`flex items-start gap-2 rounded-xl border p-3 text-left transition ${article.name === item.name ? "border-amber-400 bg-amber-50 shadow-sm dark:bg-amber-400/10" : "border-black/8 bg-white hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-white/20"}`}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(item.name)}
                  onChange={() => toggleSelected(item.name)}
                  aria-label={`Select ${item.title}`}
                  className="mt-1 size-4 shrink-0 accent-amber-500"
                />
                <button
                  type="button"
                  onClick={() => openArticle(item.name)}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="line-clamp-2 font-medium leading-5">{item.title}</div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusTone(item.status)}`}>{item.status || "Draft"}</span>
                    <span className="truncate text-[11px] text-slate-400">{item.content_type || "Article"}</span>
                  </div>
                </button>
              </div>
            ))}
            {!filteredArticles.length && !busy && (
              <div className="rounded-xl border border-dashed p-8 text-center text-sm text-slate-500">No matching articles.</div>
            )}
          </div>
        </aside>

        <section className="min-w-0 border-b border-black/10 p-4 dark:border-white/10 sm:p-7 xl:border-b-0 xl:border-r">
          {loadingArticle ? (
            <div className="grid min-h-[60vh] place-items-center"><LoaderCircle className="size-7 animate-spin text-amber-500" /></div>
          ) : (
            <div className="mx-auto max-w-4xl space-y-6">
              <div className="flex flex-wrap gap-1 border-b border-black/10 pb-2 dark:border-white/10">
                {([
                  ["content", "Content"],
                  ["markdown", "Markdown file"],
                  ["stats", "Statistics"],
                  ["revisions", "Revisions"],
                  ["media", "Media"],
                ] as const).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setView(key)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      view === key
                        ? "bg-[#172033] text-white dark:bg-amber-400 dark:text-slate-950"
                        : "text-slate-500 hover:bg-black/5 dark:hover:bg-white/10"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-4 border-b border-black/10 pb-5 dark:border-white/10 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    <FileText className="size-4" /> {article.name ? "Editing article" : "New article"}
                  </div>
                  <div className="mt-2 text-sm text-slate-500">{formatDate(article.modified)}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {article.status === "Published" && article.slug && (
                    <Button asChild variant="outline">
                      <a href={`/articles/${article.slug}`} target="_blank" rel="noreferrer"><ExternalLink /> Preview</a>
                    </Button>
                  )}
                  <Button
                    onClick={saveArticle}
                    disabled={busy || !dirty || !capabilities.write}
                    title={capabilities.write ? "Save to Frappe (Ctrl+S)" : "Your role cannot edit articles"}
                    className="bg-[#172033] text-white hover:bg-[#26344d] dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300"
                  >
                    {busy ? <LoaderCircle className="animate-spin" /> : <Save />} Save
                  </Button>
                  <Button
                    onClick={publishArticle}
                    disabled={busy || !capabilities.write || !capabilities.publish}
                    title={
                      capabilities.publish
                        ? "Save and publish this article now"
                        : "Your role cannot publish articles"
                    }
                    className="bg-emerald-600 text-white hover:bg-emerald-500"
                  >
                    <Sparkles /> {article.status === "Published" ? "Update live" : "Publish"}
                  </Button>
                  <Button
                    onClick={scheduleArticle}
                    disabled={busy || !capabilities.write || !capabilities.publish}
                    title={
                      capabilities.publish
                        ? "Publish automatically at a date and time you choose"
                        : "Your role cannot publish articles"
                    }
                    variant="outline"
                  >
                    <Clock /> Schedule
                  </Button>
                </div>
              </div>

              {view === "content" ? (
                <>
              {article.status === "Published" && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-300/60 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-200">
                  <span>
                    This article is live. Your edits go straight to the published page when you
                    save.
                  </span>
                  {capabilities.unpublish && (
                    <Button
                      size="xs"
                      variant="outline"
                      disabled={busy}
                      onClick={async () => {
                        setBusy(true);
                        try {
                          await persistArticle({ overrides: { status: "Draft" } });
                          await refreshWorkspace();
                          toast.success("Article moved back to draft.");
                        } catch (error) {
                          toast.error((error as Error).message);
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      Move to draft
                    </Button>
                  )}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="article-title">Title</Label>
                <Input id="article-title" value={article.title} onChange={(event) => updateTitle(event.target.value)} placeholder="A clear, useful title" className="h-auto border-0 border-b border-black/15 bg-transparent px-0 py-3 text-3xl font-semibold tracking-tight shadow-none focus-visible:ring-0 dark:border-white/15" />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="article-slug">URL slug</Label>
                  <Input id="article-slug" value={article.slug || ""} onChange={(event) => updateArticle("slug", slugify(event.target.value))} placeholder="article-url-slug" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="article-keyword">Primary keyword</Label>
                  <Input id="article-keyword" value={article.primary_keyword || ""} onChange={(event) => updateArticle("primary_keyword", event.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="article-excerpt">Excerpt</Label>
                <Textarea id="article-excerpt" value={article.excerpt || ""} onChange={(event) => updateArticle("excerpt", event.target.value)} rows={3} placeholder="A concise summary for cards, search, and social previews." />
                <div className="text-right text-xs text-slate-400">{article.excerpt?.length || 0} characters</div>
              </div>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label htmlFor="article-body">Article body</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Markdown with editor tools</span>
                    {capabilities.use_editor_tools && (
                      <button
                        type="button"
                        onClick={insertTemplate}
                        className="inline-flex items-center gap-1 rounded-md border border-black/10 px-2 py-1 text-xs text-amber-700 transition hover:bg-amber-50 dark:border-white/10 dark:text-amber-400 dark:hover:bg-white/10"
                      >
                        <Sparkles className="size-3.5" /> Insert template
                      </button>
                    )}
                  </div>
                </div>
                <MarkdownEditor
                  value={article.body || ""}
                  onChange={(value) => updateArticle("body", value)}
                  articles={articles}
                  onExcerptSuggestion={(excerpt) => {
                    updateArticle("excerpt", excerpt);
                    toast.success("Excerpt generated from the body.");
                  }}
                  onSeoSuggestion={(_seoTitle, metaDescription) => {
                    updateArticle("meta_description", metaDescription);
                    toast.success("Meta description generated from the body.");
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="article-notes">Internal editorial notes</Label>
                <Textarea id="article-notes" value={article.notes || ""} onChange={(event) => updateArticle("notes", event.target.value)} rows={3} />
              </div>
                </>
              ) : view === "revisions" ? (
                <RevisionHistory
                  articleName={article.name}
                  onRestored={async () => {
                    if (article.name) await openArticle(article.name);
                    await refreshWorkspace();
                  }}
                />
              ) : view === "media" ? (
                <MediaLibrary articleName={article.name} onPick={pickMedia} />
              ) : view === "markdown" ? (
                <MarkdownFilePanel
                  article={{
                    title: article.title,
                    slug: article.slug,
                    excerpt: article.excerpt,
                    status: article.status,
                    content_type: article.content_type,
                    publication: article.publication,
                    language: article.language,
                    primary_keyword: article.primary_keyword,
                    seo_title: article.seo_title,
                    meta_description: article.meta_description,
                    canonical_url: article.canonical_url,
                    featured_image: article.featured_image,
                    value_type: article.value_type,
                    notes: article.notes,
                    body: article.body,
                  }}
                  onImport={(meta, body) => {
                    setArticle((current) => ({
                      ...current,
                      ...meta,
                      body,
                    }));
                    setDirty(true);
                    setView("content");
                  }}
                />
              ) : (
                <ArticleStats onOpen={openArticle} />
              )}
            </div>
          )}
        </section>

        <aside className="space-y-7 bg-white/50 p-5 dark:bg-[#111a2b]">
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                AI and search readiness
              </h2>
              <Badge
                className={
                  analysis.score >= 80
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                    : analysis.score >= 50
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                }
              >
                {analysis.score}
              </Badge>
            </div>

            <p className="mb-3 text-xs leading-5 text-slate-500">
              Purpose: this score shows how easily a search engine or an AI assistant can read,
              quote, and rank this article. A high score means the answer is easy to extract.
            </p>

            <div className="mb-3 h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
              <div
                className={`h-full rounded-full ${
                  analysis.score >= 80
                    ? "bg-emerald-500"
                    : analysis.score >= 50
                      ? "bg-amber-500"
                      : "bg-red-500"
                }`}
                style={{ width: `${analysis.score}%` }}
              />
            </div>

            <p className="mb-3 text-xs text-slate-500">
              {analysis.wordCount} words · {analysis.readingMinutes} min read ·{" "}
              {analysis.faq.length} FAQ entries
            </p>

            {nextActions.length > 0 && (
              <div className="mb-3 rounded-lg border border-amber-300/60 bg-amber-50 p-2.5 text-xs dark:border-amber-400/30 dark:bg-amber-400/10">
                <div className="mb-1 font-semibold text-amber-900 dark:text-amber-200">
                  Do these next
                </div>
                <ol className="list-inside list-decimal space-y-1 text-amber-900/90 dark:text-amber-100/90">
                  {nextActions.map((check) => (
                    <li key={check.id}>{check.hint}</li>
                  ))}
                </ol>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowAllChecks((current) => !current)}
              className="mb-2 text-xs font-semibold text-amber-700 hover:underline dark:text-amber-400"
            >
              {showAllChecks ? "Hide full checklist" : "Show full checklist"}
            </button>

            {showAllChecks && (
              <div className="space-y-3">
                {(["Structure", "Search", "Trust"] as const).map((group) => (
                  <div key={group}>
                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      {group}
                    </div>
                    <div className="space-y-1">
                      {analysis.checks
                        .filter((check) => check.group === group)
                        .map((check) => (
                          <div
                            key={check.id}
                            className="flex items-start gap-2 rounded-lg border border-black/5 bg-white p-2 text-xs dark:border-white/10 dark:bg-white/[0.03]"
                          >
                            <span
                              className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded-full text-[10px] font-bold ${
                                check.ok
                                  ? "bg-emerald-500 text-white"
                                  : "bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-300"
                              }`}
                            >
                              {check.ok ? "✓" : "•"}
                            </span>
                            <span
                              className={
                                check.ok
                                  ? "text-slate-600 dark:text-slate-300"
                                  : "text-slate-500"
                              }
                            >
                              {check.label}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="border-t border-black/10 pt-6 dark:border-white/10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Publishing</h2>
              <Badge className={statusTone(article.status)}>{article.status}</Badge>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="article-status">Status</Label>
                <select id="article-status" value={article.status || "Draft"} onChange={(event) => updateArticle("status", event.target.value)} className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm dark:bg-white/5">
                  {allowedStatuses.map((status) => <option key={status}>{status}</option>)}
                  {!allowedStatuses.includes(article.status || "Draft") && (
                    <option value={article.status}>{article.status}</option>
                  )}
                </select>
                {!capabilities.publish && (
                  <p className="text-xs text-amber-700 dark:text-amber-400">Your role cannot publish or retire articles.</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Topic category</Label>
                <CategoryPicker
                  groups={categoryTree}
                  value={article.category || ""}
                  disabled={!capabilities.write}
                  onChange={(slug) => {
                    const group = categoryTree.find((node) => node.slug === slug);
                    const groupSlug = group?.slug || slug;
                    setArticle((current) => ({
                      ...current,
                      category: slug,
                      publication: current.publication || "",
                      subdomain: groupSlug,
                    }));
                    setDirty(true);
                  }}
                />
                <p className="text-[11px] leading-4 text-slate-400">
                  The topic decides which main group the article belongs to and where it appears
                  in the category tree.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="article-published-at">Publish date</Label>
                <Input
                  id="article-published-at"
                  type="datetime-local"
                  disabled={!capabilities.publish}
                  value={(article.published_at || "").slice(0, 16).replace(" ", "T")}
                  onChange={(event) =>
                    updateArticle(
                      "published_at",
                      event.target.value ? event.target.value.replace("T", " ") : ""
                    )
                  }
                />
                <p className="text-[11px] leading-4 text-slate-400">
                  A future date means the article stays hidden until that moment, then it goes
                  live on its own.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="article-publication">Publication</Label>
                <select id="article-publication" value={article.publication || ""} onChange={(event) => updateArticle("publication", event.target.value)} className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm dark:bg-white/5">
                  <option value="">Select publication</option>
                  {publications.map((publication) => <option key={publication.name} value={publication.name}>{publication.publication_name || publication.code || publication.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="article-type">Content type</Label>
                <select id="article-type" value={article.content_type || "Guide"} onChange={(event) => updateArticle("content_type", event.target.value)} className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm dark:bg-white/5">
                  {CONTENT_TYPES.map((type) => <option key={type}>{type}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="article-language">Language</Label>
                <select id="article-language" value={article.language || ""} onChange={(event) => updateArticle("language", event.target.value)} className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm dark:bg-white/5">
                  <option value="">Publication default</option>
                  {languages.map((language) => <option key={language.name}>{language.name}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-3 rounded-lg border border-black/10 p-3 text-sm dark:border-white/10">
                <input type="checkbox" checked={Boolean(article.human_reviewed)} onChange={(event) => updateArticle("human_reviewed", event.target.checked ? 1 : 0)} className="size-4 accent-amber-500" />
                Human reviewed
              </label>
            </div>
          </section>

          <section className="border-t border-black/10 pt-6 dark:border-white/10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">SEO and media</h2>
              {!capabilities.manage_seo && (
                <span className="text-[11px] text-amber-700 dark:text-amber-400">Read only for your role</span>
              )}
            </div>
            <fieldset disabled={!capabilities.manage_seo} className="space-y-4 disabled:opacity-60">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="seo-title">SEO title</Label>
                  <button
                    type="button"
                    onClick={() => {
                      updateArticle("seo_title", suggestSeoTitle(article.title, article.primary_keyword));
                      toast.success("SEO title suggested.");
                    }}
                    className="inline-flex items-center gap-1 text-xs text-amber-700 hover:underline dark:text-amber-400"
                  >
                    <Sparkles className="size-3.5" /> Suggest
                  </button>
                </div>
                <Input id="seo-title" value={article.seo_title || ""} onChange={(event) => updateArticle("seo_title", event.target.value)} />
                <div className="text-right text-xs text-slate-400">{(article.seo_title || "").length} / 60</div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="meta-description">Meta description</Label>
                <Textarea id="meta-description" value={article.meta_description || ""} onChange={(event) => updateArticle("meta_description", event.target.value)} rows={4} />
                <div className="text-right text-xs text-slate-400">{(article.meta_description || "").length} / 158</div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="featured-image">Featured image URL</Label>
                  <button
                    type="button"
                    onClick={() => {
                      setMediaTarget("featured");
                      setView("media");
                    }}
                    className="inline-flex items-center gap-1 text-xs text-amber-700 hover:underline dark:text-amber-400"
                  >
                    <Sparkles className="size-3.5" /> Choose from library
                  </button>
                </div>
                <Input id="featured-image" value={article.featured_image || ""} onChange={(event) => updateArticle("featured_image", event.target.value)} />
                {article.featured_image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={article.featured_image}
                    alt="Featured preview"
                    className="mt-2 h-28 w-full rounded-lg border border-black/10 object-cover dark:border-white/10"
                  />
                )}
              </div>
              <div className="space-y-2"><Label htmlFor="canonical-url">Canonical URL</Label><Input id="canonical-url" value={article.canonical_url || ""} onChange={(event) => updateArticle("canonical_url", event.target.value)} /></div>
              <label className="flex items-center gap-3 rounded-lg border border-black/10 p-3 text-sm dark:border-white/10">
                <input type="checkbox" checked={Boolean(article.noindex)} onChange={(event) => updateArticle("noindex", event.target.checked ? 1 : 0)} className="size-4 accent-amber-500" />
                Keep out of search engines
              </label>
            </fieldset>
            {capabilities.manage_seo && (
              <div className="mt-4 rounded-lg border border-black/10 bg-white p-3 text-xs dark:border-white/10 dark:bg-white/[0.03]">
                <div className="mb-1 font-semibold text-slate-600 dark:text-slate-300">Search preview</div>
                <div className="truncate text-blue-700 dark:text-blue-400">
                  {(article.seo_title || article.title || "Untitled article").slice(0, 60)}
                </div>
                <div className="truncate text-xs text-emerald-700 dark:text-emerald-500">
                  openguidehub.org/articles/{article.slug || "slug"}
                </div>
                <p className="mt-1 line-clamp-2 text-slate-500">
                  {article.meta_description || "No meta description yet. Add one for a clearer search snippet."}
                </p>
              </div>
            )}
          </section>

          <section className="border-t border-black/10 pt-6 dark:border-white/10">
            <SocialPostPanel
              article={{
                title: article.title,
                slug: article.slug,
                excerpt: article.excerpt,
                primary_keyword: article.primary_keyword,
                topic: article.category,
                featured_image: article.featured_image,
                status: article.status,
              }}
            />
          </section>

          {article.name && (
            <section className="border-t border-black/10 pt-6 dark:border-white/10">
              <Button variant="destructive" onClick={deleteArticle} disabled={busy || !capabilities.delete} className="w-full"><Trash2 /> Delete article</Button>
              <p className="mt-2 text-xs leading-5 text-slate-400">
                {capabilities.delete
                  ? "Deletion is permanent and requires Frappe delete permission."
                  : "Your role cannot delete articles."}
              </p>
            </section>
          )}
        </aside>
      </div>
    </main>
  );
}

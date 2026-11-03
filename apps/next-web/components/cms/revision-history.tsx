"use client";

import { useCallback, useEffect, useState } from "react";
import { History, LoaderCircle, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface Revision {
  name: string;
  creation: string;
  owner: string;
}

export function RevisionHistory({
  articleName,
  onRestored,
}: {
  articleName: string;
  onRestored: () => void | Promise<void>;
}) {
  const [versions, setVersions] = useState<Revision[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!articleName) {
      setVersions([]);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/cms/articles/${encodeURIComponent(articleName)}/versions`, {
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not load revisions.");
      setVersions(data.versions || []);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [articleName]);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  async function restore(version: Revision) {
    if (!window.confirm("Restore this revision? The current version is kept in history.")) {
      return;
    }
    setRestoring(version.name);
    try {
      const response = await fetch(
        `/api/cms/articles/${encodeURIComponent(articleName)}/restore`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ version: version.name }),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not restore the revision.");
      toast.success("Revision restored.");
      await load();
      await onRestored();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setRestoring(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
          <History className="size-4" /> Revision history
        </h2>
        <Button size="sm" variant="ghost" onClick={load} disabled={loading}>
          {loading ? <LoaderCircle className="animate-spin" /> : null} Refresh
        </Button>
      </div>

      {!articleName && (
        <p className="rounded-lg border border-dashed p-4 text-sm text-slate-500">
          Save the article once and its history appears here.
        </p>
      )}

      {articleName && !versions.length && !loading && (
        <p className="rounded-lg border border-dashed p-4 text-sm text-slate-500">
          No earlier revisions yet.
        </p>
      )}

      <div className="space-y-2">
        {versions.map((version) => (
          <div
            key={version.name}
            className="flex items-center justify-between gap-3 rounded-lg border border-black/10 bg-white p-3 text-sm dark:border-white/10 dark:bg-white/[0.03]"
          >
            <div className="min-w-0">
              <div className="truncate font-medium">
                {new Intl.DateTimeFormat("en", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(version.creation.replace(" ", "T") + "Z"))}
              </div>
              <div className="truncate text-xs text-slate-500">by {version.owner}</div>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={restoring === version.name}
              onClick={() => restore(version)}
            >
              {restoring === version.name ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <RotateCcw />
              )}
              Restore
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

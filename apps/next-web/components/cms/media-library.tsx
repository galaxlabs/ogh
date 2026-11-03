"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Image as ImageIcon, LoaderCircle, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface MediaFile {
  name: string;
  file_name: string;
  file_url: string;
  file_size?: number;
  creation: string;
  owner: string;
}

export function MediaLibrary({
  articleName,
  onPick,
}: {
  articleName?: string;
  onPick: (url: string) => void;
}) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/cms/media", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not load the media library.");
      setFiles(data.files || []);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  async function upload(file: File) {
    if (file.size > 6 * 1024 * 1024) {
      toast.error("Images must be smaller than 6 MB.");
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Could not read the file."));
        reader.readAsDataURL(file);
      });
      const content = dataUrl.split(",")[1] || "";
      const response = await fetch("/api/cms/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, content, article: articleName || "" }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || "Upload failed.");
      toast.success("Image uploaded.");
      await load();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const visible = files.filter((file) =>
    (file.file_name || "").toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
          <ImageIcon className="size-4" /> Media library
        </h2>
        <Button size="sm" variant="ghost" onClick={load} disabled={loading}>
          {loading ? <LoaderCircle className="animate-spin" /> : null} Refresh
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search images"
          className="h-9 flex-1"
        />
        <Button
          size="sm"
          variant="outline"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? <LoaderCircle className="animate-spin" /> : <Upload />} Upload
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) upload(file);
          }}
        />
      </div>

      {!visible.length && !loading && (
        <p className="rounded-lg border border-dashed p-4 text-sm text-slate-500">
          No images yet. Upload one to use as a featured image.
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        {visible.map((file) => (
          <button
            key={file.name}
            type="button"
            onClick={() => onPick(file.file_url)}
            className="group overflow-hidden rounded-lg border border-black/10 text-left transition hover:border-amber-400 dark:border-white/10"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={file.file_url}
              alt={file.file_name}
              className="h-24 w-full bg-muted object-cover"
            />
            <div className="truncate px-2 py-1 text-[11px] text-slate-500">
              {file.file_name}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useSyncExternalStore } from "react";
import { LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ViewMode = "grid" | "list";

const STORAGE_KEY = "ogh-view-mode";
const CHANGE_EVENT = "ogh-view-mode-change";
let transientMode: ViewMode | null = null;

function subscribe(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener(CHANGE_EVENT, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(CHANGE_EVENT, listener);
  };
}

function readStoredMode(defaultMode: ViewMode): ViewMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "grid" || stored === "list") return stored;
  } catch {
    return transientMode || defaultMode;
  }
  return defaultMode;
}

export function useViewMode(defaultMode: ViewMode = "grid"): [ViewMode, (mode: ViewMode) => void] {
  const mode = useSyncExternalStore(
    subscribe,
    () => readStoredMode(defaultMode),
    () => defaultMode,
  );

  const setAndStore = (next: ViewMode) => {
    transientMode = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore storage errors
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  };

  return [mode, setAndStore];
}

export function ViewModeToggle({
  mode,
  onChange,
}: {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}) {
  return (
    <div className="inline-flex items-center rounded-md border bg-background p-1">
      <Button
        variant={mode === "grid" ? "secondary" : "ghost"}
        size="sm"
        className="h-7 gap-1.5 px-2 text-xs"
        onClick={() => onChange("grid")}
        aria-label="Grid view"
        title="Grid view"
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Grid</span>
      </Button>
      <Button
        variant={mode === "list" ? "secondary" : "ghost"}
        size="sm"
        className="h-7 gap-1.5 px-2 text-xs"
        onClick={() => onChange("list")}
        aria-label="List view"
        title="List view"
      >
        <List className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">List</span>
      </Button>
    </div>
  );
}

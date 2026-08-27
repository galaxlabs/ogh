"use client";

import { useState } from "react";
import { AlignLeft, Type } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ReadabilityLevel = "comfortable" | "relaxed" | "large";

const STORAGE_KEY = "ogh-readability";

const LEVELS: { key: ReadabilityLevel; label: string; icon: "text" | "align" }[] = [
  { key: "comfortable", label: "Comfortable", icon: "text" },
  { key: "relaxed", label: "Relaxed", icon: "align" },
  { key: "large", label: "Large", icon: "text" },
];

// Maps a readability level to CSS classes applied to the article content.
export function readabilityClasses(level: ReadabilityLevel): string {
  switch (level) {
    case "large":
      return "text-lg leading-8";
    case "relaxed":
      return "text-base leading-8";
    default:
      return "text-base leading-7";
  }
}

function readStoredLevel(): ReadabilityLevel {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as ReadabilityLevel | null;
    if (stored && LEVELS.some((l) => l.key === stored)) return stored;
  } catch {
    // ignore storage errors
  }
  return "comfortable";
}

export function useReadability(): [
  ReadabilityLevel,
  (level: ReadabilityLevel) => void
] {
  const [level, setLevel] = useState<ReadabilityLevel>(() => readStoredLevel());

  const setAndStore = (next: ReadabilityLevel) => {
    setLevel(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore storage errors
    }
  };

  return [level, setAndStore];
}

export function ReadabilityToggle({
  level,
  onChange,
}: {
  level: ReadabilityLevel;
  onChange: (level: ReadabilityLevel) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-md border bg-background p-1">
      {LEVELS.map((item) => (
        <Button
          key={item.key}
          variant={level === item.key ? "secondary" : "ghost"}
          size="sm"
          className="h-7 gap-1 px-2 text-xs"
          onClick={() => onChange(item.key)}
          aria-label={item.label}
          title={item.label}
        >
          {item.icon === "align" ? (
            <AlignLeft className="h-3.5 w-3.5" />
          ) : (
            <Type className="h-3.5 w-3.5" />
          )}
          <span className="hidden sm:inline">{item.label}</span>
        </Button>
      ))}
    </div>
  );
}

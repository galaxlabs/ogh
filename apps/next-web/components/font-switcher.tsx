"use client";

import { useState, useRef, useEffect } from "react";
import { useFont } from "@/components/font-provider";
import { Button } from "@/components/ui/button";
import { Type } from "lucide-react";

export function FontSwitcher() {
  const { font, fontOptions, setFont } = useFont();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 px-2 text-xs"
        onClick={() => setOpen((v) => !v)}
        title="Choose font"
      >
        <Type className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Font</span>
      </Button>
      {open && (
        <div className="absolute right-0 z-50 mt-1 w-60 rounded-md border bg-popover p-1 shadow-md">
          {fontOptions.map((option) => (
            <button
              key={option.label}
              onClick={() => {
                setFont(option.label);
                setOpen(false);
              }}
              className={`w-full rounded px-3 py-2 text-left text-sm transition-colors hover:bg-accent ${
                font.label === option.label ? "bg-primary/10 font-medium text-primary" : ""
              }`}
              style={{ fontFamily: option.family }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

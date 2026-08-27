"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface SearchBarProps {
  placeholder?: string;
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (query: string) => void;
}

export function SearchBar({
  placeholder,
  className,
  value: controlledValue,
  onChange,
  onSearch,
}: SearchBarProps) {
  const router = useRouter();
  const [internalQuery, setInternalQuery] = useState("");
  const query = controlledValue ?? internalQuery;

  const setQuery = (next: string) => {
    if (onChange) {
      onChange(next);
    } else {
      setInternalQuery(next);
    }
  };

  const submitSearch = () => {
    const q = query.trim();
    if (!q) return;
    if (onSearch) {
      onSearch(q);
    } else {
      router.push(`/articles?q=${encodeURIComponent(q)}`);
    }
  };

  return (
    <div className={`relative ${className || ""}`}>
      <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") submitSearch();
        }}
        placeholder={placeholder || "Search articles..."}
        className="ps-9 pe-3"
        aria-label="Search"
      />
    </div>
  );
}

export function SearchButton({ onOpen }: { onOpen?: () => void }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label="Search"
      onClick={onOpen}
      className="text-muted-foreground hover:text-foreground"
    >
      <Search className="h-5 w-5" />
    </Button>
  );
}

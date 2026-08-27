"use client";

import { useLanguage, type Language } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

const OPTIONS: { value: Language; label: string }[] = [
  { value: "en", label: "English" },
  { value: "ur", label: "اردو" },
  { value: "ar", label: "العربية" },
];

export function LanguageSwitcher() {
  const { currentLanguage, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1 rounded-md border bg-background px-1 py-0.5">
      <Globe className="h-4 w-4 text-muted-foreground ms-1" />
      {OPTIONS.map((option) => (
        <Button
          key={option.value}
          variant="ghost"
          size="sm"
          onClick={() => setLanguage(option.value)}
          className={`h-7 px-2 text-xs transition-all duration-200 ${
            currentLanguage === option.value
              ? "bg-primary/10 text-primary font-medium"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}

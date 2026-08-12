"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { LANGUAGE_FONTS, type FontChoice } from "@/lib/fonts";
import { useLanguage } from "@/components/language-provider";

interface FontContextValue {
  font: FontChoice;
  fontOptions: FontChoice[];
  setFont: (label: string) => void;
}

const FontContext = createContext<FontContextValue | null>(null);

const FONT_KEY = "ogh-font";

function readStoredFont(lang: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem(FONT_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    if (parsed && parsed.lang === lang && typeof parsed.label === "string") {
      return parsed.label;
    }
  } catch {
    // ignore corrupt storage
  }
  return null;
}

export function FontProvider({ children }: { children: ReactNode }) {
  const { currentLanguage } = useLanguage();
  const langConfig = LANGUAGE_FONTS[currentLanguage] || LANGUAGE_FONTS.en;
  const fontOptions = langConfig.options;

  const [fontLabel, setFontLabel] = useState<string | null>(() =>
    readStoredFont(currentLanguage)
  );

  const font = useMemo(() => {
    const match = fontOptions.find((f) => f.label === fontLabel);
    return match || langConfig.default;
  }, [fontOptions, fontLabel, langConfig]);

  const setFont = (label: string) => {
    setFontLabel(label);
    try {
      localStorage.setItem(FONT_KEY, JSON.stringify({ lang: currentLanguage, label }));
    } catch {
      // ignore storage failures
    }
  };

  useEffect(() => {
    // Apply chosen font to the document body via a font-family override.
    const family = font.family;
    document.documentElement.style.setProperty("--ogh-active-font", family);
    if (font.variable && font.variable !== "--font-ubuntu") {
      document.body.setAttribute("data-ogh-font", font.variable);
    } else {
      document.body.removeAttribute("data-ogh-font");
    }
  }, [font]);

  return (
    <FontContext.Provider value={{ font, fontOptions, setFont }}>
      {children}
    </FontContext.Provider>
  );
}

export function useFont() {
  const context = useContext(FontContext);
  if (!context) {
    throw new Error("useFont must be used within a FontProvider");
  }
  return context;
}

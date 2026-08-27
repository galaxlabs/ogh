"use client";

import { createContext, useContext, useEffect, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { translations } from "@/lib/data";

export type Language = "en" | "ur" | "ar";

type TranslationKey = typeof translations;

interface LanguageContextValue {
  currentLanguage: Language;
  setLanguage: (lang: Language) => void;
  translations: TranslationKey[Language];
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const LANGUAGE_KEY = "language";
const RTL_LANGUAGES: Language[] = ["ur", "ar"];

const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", emitChange);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", emitChange);
  };
}

function getSnapshot(): Language {
  const saved = typeof window === "undefined" ? null : localStorage.getItem(LANGUAGE_KEY);
  if (saved === "en" || saved === "ur" || saved === "ar") {
    return saved;
  }
  return "en";
}

function getServerSnapshot(): Language {
  return "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const currentLanguage = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    document.documentElement.lang = currentLanguage;
    document.documentElement.dir = RTL_LANGUAGES.includes(currentLanguage) ? "rtl" : "ltr";
  }, [currentLanguage]);

  const setLanguage = (lang: Language) => {
    localStorage.setItem(LANGUAGE_KEY, lang);
    emitChange();
  };

  return (
    <LanguageContext.Provider
      value={{ currentLanguage, setLanguage, translations: translations[currentLanguage] }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

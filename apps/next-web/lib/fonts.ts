import { Ubuntu, Noto_Naskh_Arabic, Noto_Nastaliq_Urdu, Amiri, Scheherazade_New, Lateef, Reem_Kufi, Aref_Ruqaa, Gulzar } from "next/font/google";

// Latin / default
export const ubuntu = Ubuntu({
  variable: "--font-ubuntu",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

// Arabic — modern Naskh (default Arabic body)
export const notoNaskh = Noto_Naskh_Arabic({
  variable: "--font-noto-naskh",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

// Urdu — Nastaliq (classic calligraphic script, used for headlines/titles)
export const notoNastaliq = Noto_Nastaliq_Urdu({
  variable: "--font-noto-nastaliq",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

// Urdu — Gulzar (Nastaliq-inspired display)
export const gulzar = Gulzar({
  variable: "--font-gulzar",
  subsets: ["arabic"],
  weight: ["400"],
});

// Arabic — traditional Naskh (Amiri)
export const amiri = Amiri({
  variable: "--font-amiri",
  subsets: ["arabic"],
  weight: ["400", "700"],
});

// Arabic — traditional Naskh (Scheherazade)
export const scheherazade = Scheherazade_New({
  variable: "--font-scheherazade",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

// Arabic / Urdu — Lateef (Naskh, comfortable long-form reading)
export const lateef = Lateef({
  variable: "--font-lateef",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

// Arabic — Reem Kufi (Kufi geometric)
export const reemKufi = Reem_Kufi({
  variable: "--font-reem-kufi",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

// Arabic — Aref Ruqaa (Ruqaa calligraphic)
export const arefRuqaa = Aref_Ruqaa({
  variable: "--font-aref-ruqaa",
  subsets: ["arabic"],
  weight: ["400", "700"],
});

export const FONT_VARIABLES = `${ubuntu.variable} ${notoNaskh.variable} ${notoNastaliq.variable} ${gulzar.variable} ${amiri.variable} ${scheherazade.variable} ${lateef.variable} ${reemKufi.variable} ${arefRuqaa.variable}`;

export type FontCategory = "naskh" | "nastaliq" | "kufi" | "ruqaa";

export interface FontChoice {
  label: string;
  variable: string;
  family: string;
}

// Font options per language. `variable` names map to CSS vars defined in
// globals.css (e.g. --font-amiri) that set the font-family for the chosen style.
export const LANGUAGE_FONTS: Record<string, { default: FontChoice; options: FontChoice[] }> = {
  en: {
    default: { label: "Ubuntu", variable: "--font-ubuntu", family: "Ubuntu, system-ui, sans-serif" },
    options: [
      { label: "Ubuntu", variable: "--font-ubuntu", family: "Ubuntu, system-ui, sans-serif" },
    ],
  },
  ur: {
    default: { label: "Noto Naskh Urdu", variable: "--font-noto-naskh", family: "var(--font-noto-naskh)" },
    options: [
      { label: "Noto Naskh Urdu (Web Naskh)", variable: "--font-noto-naskh", family: "var(--font-noto-naskh)" },
      { label: "Noto Nastaliq Urdu (Nastaliq)", variable: "--font-noto-nastaliq", family: "var(--font-noto-nastaliq)" },
      { label: "Gulzar (Nastaliq Display)", variable: "--font-gulzar", family: "var(--font-gulzar)" },
      { label: "Lateef (Naskh Long-form)", variable: "--font-lateef", family: "var(--font-lateef)" },
    ],
  },
  ar: {
    default: { label: "Noto Naskh Arabic", variable: "--font-noto-naskh", family: "var(--font-noto-naskh)" },
    options: [
      { label: "Noto Naskh Arabic (Modern)", variable: "--font-noto-naskh", family: "var(--font-noto-naskh)" },
      { label: "Amiri (Traditional Naskh)", variable: "--font-amiri", family: "var(--font-amiri)" },
      { label: "Scheherazade New (Classical)", variable: "--font-scheherazade", family: "var(--font-scheherazade)" },
      { label: "Lateef (Long-form Naskh)", variable: "--font-lateef", family: "var(--font-lateef)" },
      { label: "Reem Kufi (Kufi)", variable: "--font-reem-kufi", family: "var(--font-reem-kufi)" },
      { label: "Aref Ruqaa (Ruqaa)", variable: "--font-aref-ruqaa", family: "var(--font-aref-ruqaa)" },
    ],
  },
};

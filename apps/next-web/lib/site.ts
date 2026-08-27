export const SITE = {
  name: "OpenGuideHub",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://openguidehub.org",
  description:
    "OpenGuideHub brings organized AI, FOSS, tutorials, and multilingual explainers into one searchable knowledge hub.",
  gaMeasurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-NCP1VFEKRR",
  adminApiUrl: process.env.NEXT_PUBLIC_ADMIN_API_URL || "",
  databaseProvider: process.env.NEXT_PUBLIC_DATABASE_PROVIDER || "postgresql",
} as const;

export const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  ur: "Urdu",
  ar: "Arabic",
};

export const TRANSLATION_TARGETS = [
  "Urdu",
  "Arabic",
  "English",
  "Hindi",
  "Turkish",
  "French",
  "Spanish",
  "German",
] as const;

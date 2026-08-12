import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/components/language-provider";
import { FontProvider } from "@/components/font-provider";
import { Toaster } from "@/components/ui/sonner";
import { FONT_VARIABLES } from "@/lib/fonts";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://openguidehub.org"),
  title: {
    default: "OpenGuideHub",
    template: "%s - OpenGuideHub",
  },
  description:
    "OpenGuideHub brings organized AI, FOSS, tutorials, and multilingual explainers into one searchable knowledge hub.",
  keywords: [
    "OpenGuideHub",
    "open source",
    "AI",
    "tutorials",
    "technology",
    "science",
    "open guide hub",
    "Urdu tutorials",
    "Arabic tutorials",
  ],
  authors: [{ name: "OpenGuideHub" }],
  creator: "OpenGuideHub",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://openguidehub.org",
    siteName: "OpenGuideHub",
    title: "OpenGuideHub",
    description:
      "OpenGuideHub brings organized AI, FOSS, tutorials, and multilingual explainers into one searchable knowledge hub.",
  },
  twitter: {
    card: "summary_large_image",
    title: "OpenGuideHub",
    description:
      "Organized AI, FOSS, tutorials, and multilingual explainers in one searchable knowledge hub.",
  },
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${FONT_VARIABLES} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-[family-name:var(--font-ubuntu)]">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
            <FontProvider>{children}</FontProvider>
          </LanguageProvider>
        </ThemeProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}

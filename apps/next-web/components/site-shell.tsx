"use client";

import type { ReactNode } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { usePublication } from "@/components/publication-provider";
import { publicationVisualTheme } from "@/lib/publications";

export function SiteShell({ children }: { children: ReactNode }) {
  const { publication } = usePublication();
  const theme = publicationVisualTheme(publication);

  return (
    <div className={`flex min-h-screen flex-col ${theme.shell}`} data-publication={publication?.key || "main"}>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

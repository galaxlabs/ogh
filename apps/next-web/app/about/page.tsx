import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
import { AboutClient } from "@/components/about-client";

export const metadata: Metadata = {
  title: "About",
  description: "Learn about OpenGuideHub, our mission, vision, and values",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <SiteShell>
      <AboutClient />
    </SiteShell>
  );
}

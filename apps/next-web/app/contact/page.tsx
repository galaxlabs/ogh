import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
import { ContactClient } from "@/components/contact-client";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the OpenGuideHub team",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <SiteShell>
      <ContactClient />
    </SiteShell>
  );
}

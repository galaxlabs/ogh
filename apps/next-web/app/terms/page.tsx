import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "OpenGuideHub Terms of Service",
  alternates: { canonical: "/terms" },
};

const sections = [
  {
    heading: "Agreement to Terms",
    body: "By accessing OpenGuideHub, you agree to be bound by these Terms of Service and all applicable laws and regulations.",
  },
  {
    heading: "Use License",
    body: "Permission is granted to temporarily access the materials on OpenGuideHub for personal, non-commercial use only. This is the grant of a license, not a transfer of title.",
  },
  {
    heading: "User Content",
    body: "When you submit content to OpenGuideHub (such as comments or contributions), you grant us a non-exclusive, worldwide license to use, reproduce, and distribute that content.",
  },
  {
    heading: "Acceptable Use",
    body: "You agree not to:",
    bullets: [
      "Use the website for any unlawful purpose",
      "Attempt to gain unauthorized access to our systems",
      "Interfere with or disrupt the website",
      "Violate any intellectual property rights",
    ],
  },
  {
    heading: "Intellectual Property",
    body: "All content on OpenGuideHub, including text, graphics, logos, and images, is the property of OpenGuideHub or its content suppliers and is protected by copyright laws.",
  },
  {
    heading: "Disclaimer",
    body: "The materials on OpenGuideHub are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim all other warranties.",
  },
  {
    heading: "Limitations",
    body: "In no event shall OpenGuideHub or its suppliers be liable for any damages arising out of the use or inability to use the materials on our website.",
  },
  {
    heading: "Revisions",
    body: "We may revise these Terms of Service at any time without notice. By using this website, you agree to be bound by the current version of these Terms.",
  },
  {
    heading: "Governing Law",
    body: "These terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law provisions.",
  },
  {
    heading: "Contact Information",
    body: "If you have any questions about these Terms, please contact us at contact@openguidehub.org",
  },
];

export default function TermsPage() {
  return (
    <SiteShell>
      <LegalPage title="Terms of Service" sections={sections} />
    </SiteShell>
  );
}

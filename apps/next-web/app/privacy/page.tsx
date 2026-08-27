import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "OpenGuideHub Privacy Policy",
  alternates: { canonical: "/privacy" },
};

const sections = [
  {
    heading: "Introduction",
    body: "OpenGuideHub is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our website.",
  },
  {
    heading: "Information We Collect",
    body: "We collect information that you provide directly to us, including:",
    bullets: [
      "Name and email address when you subscribe to our newsletter",
      "Contact information when you fill out our contact form",
      "Usage data and analytics to improve our services",
    ],
  },
  {
    heading: "How We Use Your Information",
    body: "We use the information we collect to:",
    bullets: [
      "Send you newsletters and updates",
      "Respond to your inquiries and requests",
      "Improve our website and content",
      "Analyze usage patterns and trends",
    ],
  },
  {
    heading: "Data Storage",
    body: "Currently, submitted information (newsletter subscriptions and contact messages) is stored locally in your browser's localStorage. We do not store this data on external servers.",
  },
  {
    heading: "Cookies",
    body: "We use cookies and similar technologies to enhance your experience on our website. You can control cookies through your browser settings.",
  },
  {
    heading: "Third-Party Services",
    body: "We may use third-party services for analytics and other purposes. These services have their own privacy policies.",
  },
  {
    heading: "Your Rights",
    body: "You have the right to:",
    bullets: [
      "Access your personal data",
      "Request correction of your data",
      "Request deletion of your data",
      "Opt-out of communications",
    ],
  },
  {
    heading: "Children's Privacy",
    body: "Our website is not intended for children under 13. We do not knowingly collect information from children.",
  },
  {
    heading: "Changes to This Policy",
    body: "We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated revision date.",
  },
  {
    heading: "Contact Us",
    body: "If you have questions about this Privacy Policy, please contact us at contact@openguidehub.org",
  },
];

export default function PrivacyPage() {
  return (
    <SiteShell>
      <LegalPage title="Privacy Policy" sections={sections} />
    </SiteShell>
  );
}

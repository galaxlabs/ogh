import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Disclaimer",
  description: "OpenGuideHub Disclaimer",
  alternates: { canonical: "/disclaimer" },
};

const sections = [
  {
    heading: "General Information",
    body: "The information provided on OpenGuideHub is for general informational and educational purposes only. While we strive to keep the information accurate and up-to-date, we make no representations or warranties of any kind about the completeness, accuracy, reliability, or suitability of the information.",
  },
  {
    heading: "Educational Content",
    body: "All content on OpenGuideHub, including articles, tutorials, and guides, is intended for educational purposes. This content should not be considered professional advice in any field.",
  },
  {
    heading: "No Professional Advice",
    body: "The content on this website does not constitute professional advice. For specific advice related to your situation, please consult with qualified professionals in the relevant field.",
  },
  {
    heading: "External Links",
    body: "OpenGuideHub may contain links to external websites. We have no control over the content and nature of these sites and are not responsible for their content or privacy practices.",
  },
  {
    heading: "Accuracy of Information",
    body: "While we make every effort to ensure that the information on OpenGuideHub is correct, we do not warrant its completeness or accuracy. Technology and science are rapidly evolving fields, and information may become outdated.",
  },
  {
    heading: "Use at Your Own Risk",
    body: "Any reliance you place on information from OpenGuideHub is strictly at your own risk. We will not be liable for any losses or damages in connection with the use of our website.",
  },
  {
    heading: "Technical Information",
    body: "Technical tutorials and guides are provided for educational purposes. Always test in safe environments and understand the implications before implementing any technical procedures.",
  },
  {
    heading: "Scientific Content",
    body: "Scientific information is simplified for general understanding. For detailed or critical applications, please refer to peer-reviewed sources and scientific literature.",
  },
  {
    heading: "Changes to Content",
    body: "We reserve the right to modify, update, or remove any content on OpenGuideHub without prior notice.",
  },
  {
    heading: "Contact",
    body: "If you have concerns about any content on our website, please contact us at contact@openguidehub.org",
  },
];

export default function DisclaimerPage() {
  return (
    <SiteShell>
      <LegalPage title="Disclaimer" sections={sections} />
    </SiteShell>
  );
}

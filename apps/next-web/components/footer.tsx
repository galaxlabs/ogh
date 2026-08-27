"use client";

import Link from "next/link";
import { useLanguage } from "@/components/language-provider";
import { Facebook, Github, Linkedin, Mail, Twitter } from "lucide-react";

const socialLinks = [
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Github, href: "#", label: "GitHub" },
  { icon: Mail, href: "#", label: "Email" },
];

export function Footer() {
  const { translations } = useLanguage();
  const t = translations || {};
  const nav = t.nav || {};
  const footer = t.footer || {};

  const footerLinks = {
    categories: [
      { label: nav.science || "Science", path: "/science" },
      { label: nav.technology || "Technology", path: "/technology" },
      { label: nav.openSource || "Open Source", path: "/open-source" },
      { label: nav.tutorials || "Tutorials", path: "/tutorials" },
    ],
    resources: [
      { label: nav.articles || "Articles", path: "/articles" },
      { label: nav.downloads || "Downloads", path: "/downloads" },
      { label: nav.reviews || "Reviews", path: "/reviews" },
      { label: nav.categories || "Categories", path: "/categories" },
    ],
    company: [
      { label: nav.about || "About", path: "/about" },
      { label: nav.contact || "Contact", path: "/contact" },
    ],
    legal: [
      { label: "Privacy Policy", path: "/privacy" },
      { label: "Terms of Service", path: "/terms" },
      { label: "Disclaimer", path: "/disclaimer" },
    ],
  };

  return (
    <footer className="border-t bg-muted/50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Link href="/" className="mb-4 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary">
                <span className="text-xl font-bold text-white">O</span>
              </div>
              <span className="text-xl font-bold">OpenGuideHub</span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed">{footer.description}</p>
          </div>

          {[
            { title: footer.categoriesTitle || "Categories", links: footerLinks.categories },
            { title: footer.resourcesTitle || "Resources", links: footerLinks.resources },
            { title: footer.companyTitle || "Company", links: footerLinks.company },
            { title: footer.legalTitle || "Legal", links: footerLinks.legal },
          ].map((section) => (
            <div key={section.title}>
              <h3 className="mb-4 font-semibold">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.path}>
                    <Link href={link.path} className="text-sm transition-colors hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t pt-8 md:flex-row">
          <p className="text-sm">
            © {new Date().getFullYear()} OpenGuideHub.org. {footer.allRights || "All rights reserved."}
          </p>
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className="transition-colors hover:text-foreground"
              >
                <social.icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

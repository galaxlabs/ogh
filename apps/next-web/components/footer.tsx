"use client";

import Link from "next/link";
import { useLanguage } from "@/components/language-provider";
import { usePublication } from "@/components/publication-provider";
import { PUBLICATIONS } from "@/lib/publications";
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
  const { publication } = usePublication();
  const t = translations || {};
  const nav = t.nav || {};
  const footer = t.footer || {};

  const publicationLinks = Object.values(PUBLICATIONS)
    .filter((item) => item.categories.length > 0)
    .map((item) => ({
      label: item.name.replace("OpenGuideHub ", ""),
      path: `https://${item.subdomain}.openguidehub.org/`,
      description: item.tagline,
    }));

  const footerLinks = {
    categories: publication
      ? publication.categories.map((category) => ({
          label: category,
          path: `/articles?category=${encodeURIComponent(category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""))}`,
        }))
      : [
          { label: nav.science || "Science", path: "https://science.openguidehub.org/" },
          { label: nav.technology || "Technology", path: "https://tech.openguidehub.org/" },
          { label: "AI", path: "https://ai.openguidehub.org/" },
          { label: "News", path: "https://news.openguidehub.org/" },
        ],
    resources: [
      { label: nav.articles || "Articles", path: "/articles" },
      ...(!publication ? [{ label: nav.downloads || "Downloads", path: "/downloads" }] : []),
      ...(!publication ? [{ label: nav.reviews || "Reviews", path: "/reviews" }] : []),
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
            <p className="max-w-xs text-sm leading-relaxed">{publication?.tagline || footer.description}</p>
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

        <div className="mb-8 rounded-2xl border bg-background/70 p-5">
          <h3 className="mb-3 font-semibold">OpenGuideHub Publication Network</h3>
          <p className="mb-4 max-w-3xl text-sm text-muted-foreground">
            Explore related OpenGuideHub publications. These cross-links connect each topic site into one blogging network.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {publicationLinks.map((link) => (
              <a
                key={link.path}
                href={link.path}
                className="rounded-xl border bg-muted/30 p-3 transition-colors hover:border-primary hover:bg-primary/10"
              >
                <div className="font-medium">{link.label}</div>
                <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{link.description}</div>
              </a>
            ))}
          </div>
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

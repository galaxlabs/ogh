"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { usePublication } from "@/components/publication-provider";
import { Facebook, Github, Linkedin, Mail, Twitter } from "lucide-react";

const socialLinks = [
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Github, href: "#", label: "GitHub" },
  { icon: Mail, href: "#", label: "Email" },
];

interface GroupLink {
  name: string;
  slug: string;
  subdomain: string;
  description: string;
  articleCount: number;
  children: { name: string; slug: string; articleCount: number }[];
}

export function Footer() {
  const { translations } = useLanguage();
  const { publication } = usePublication();
  const t = translations || {};
  const nav = t.nav || {};
  const footer = t.footer || {};
  const [groups, setGroups] = useState<GroupLink[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/cms/categories", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (cancelled) return;
        const roots = (data?.categories || []) as {
          name: string;
          slug: string;
          subdomain: string;
          description: string;
          article_count: number;
          children: { name: string; slug: string; article_count: number }[];
        }[];
        setGroups(
          roots.map((root) => ({
            name: root.name,
            slug: root.slug,
            subdomain: root.subdomain,
            description: root.description,
            articleCount: root.article_count || 0,
            children: (root.children || []).map((child) => ({
              name: child.name,
              slug: child.slug,
              articleCount: child.article_count || 0,
            })),
          }))
        );
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const groupLinks = groups.length
    ? groups
    : [
        { name: "Science", slug: "science", subdomain: "science", description: "", articleCount: 0, children: [] },
        { name: "Technology", slug: "technology", subdomain: "tech", description: "", articleCount: 0, children: [] },
        { name: "AI Tools", slug: "ai-tools", subdomain: "ai", description: "", articleCount: 0, children: [] },
        { name: "Health", slug: "health", subdomain: "health", description: "", articleCount: 0, children: [] },
      ];

  const footerLinks = {
    categories: publication
      ? groupLinks
          .filter((group) => group.subdomain === publication.subdomain)
          .flatMap((group) =>
            group.children.map((child) => ({
              label: child.name,
              path: `/categories/${child.slug}`,
            }))
          )
      : groupLinks.map((group) => ({
          label: group.name,
          path: group.subdomain
            ? `https://${group.subdomain}.openguidehub.org/`
            : `/categories/${group.slug}`,
        })),
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
                    {link.path.startsWith("http") ? (
                      <a
                        href={link.path}
                        className="text-sm transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.path}
                        className="text-sm transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mb-8 rounded-2xl border bg-background/70 p-5">
          <h3 className="mb-3 font-semibold">OpenGuideHub Publication Network</h3>
          <p className="mb-4 max-w-3xl text-sm text-muted-foreground">
            Every main group lives on its own subdomain, and each one links back into the others.
            Pick a group to browse it, then move sideways through the related topics.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {groupLinks.map((group) => (
              <a
                key={group.slug}
                href={
                  group.subdomain
                    ? `https://${group.subdomain}.openguidehub.org/`
                    : `/categories/${group.slug}`
                }
                className="rounded-xl border bg-muted/30 p-3 transition-colors hover:border-primary hover:bg-primary/10"
              >
                <div className="flex items-center justify-between gap-2 font-medium">
                  {group.name}
                  <span className="text-xs text-muted-foreground">
                    {group.articleCount}
                  </span>
                </div>
                {group.description && (
                  <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {group.description}
                  </div>
                )}
                {group.children.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {group.children.slice(0, 4).map((child) => (
                      <span
                        key={child.slug}
                        className="rounded-full bg-background/70 px-2 py-0.5 text-[11px] text-muted-foreground"
                      >
                        {child.name}
                      </span>
                    ))}
                  </div>
                )}
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

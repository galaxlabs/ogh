"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { FeaturedArticleCard } from "@/components/featured-article-card";
import { ArticleCard } from "@/components/article-card";
import { SearchBar } from "@/components/search-bar";
import { TrendingCard } from "@/components/trending-card";
import { TutorialCard } from "@/components/tutorial-card";
import { ReviewCard } from "@/components/review-card";
import { CategoryCard } from "@/components/category-card";
import { NewsletterSignup } from "@/components/newsletter-signup";
import { useLanguage } from "@/components/language-provider";
import type { Article, CategoryStats } from "@/lib/data";

const DISCOVERY_LANES = [
  { label: "All", value: "all" },
  { label: "AI", value: "artificial-intelligence" },
  { label: "AI Tools", value: "ai-tools" },
  { label: "FOSS", value: "foss-updates" },
  { label: "Tutorials", value: "tutorials" },
  { label: "Security", value: "cybersecurity" },
];

const AI_FOCUS_AREAS = [
  {
    title: "AI Agents",
    text: "Autonomous research, publishing, and workflow assistants for your content stack.",
  },
  {
    title: "AI Tools",
    text: "Practical explainers, summarizers, translators, and productivity helpers for readers.",
  },
  {
    title: "FOSS Updates",
    text: "Fresh open source news, releases, and community discoveries published into your site.",
  },
  {
    title: "Read in Any Language",
    text: "Each article can now be translated on demand into Urdu, Arabic, and other languages.",
  },
];

export function HomeClient({
  articles,
  categoryStats,
  publication = null,
  heroImage,
  heroImageAlt,
}: {
  articles: Article[];
  categoryStats: CategoryStats[];
  publication?: { name: string; tagline: string } | null;
  heroImage?: string;
  heroImageAlt?: string;
}) {
  const { translations } = useLanguage();
  const home = translations?.home || {};
  const common = translations?.common || {};

  const [discoverQuery, setDiscoverQuery] = useState("");
  const [activeLane, setActiveLane] = useState("all");

  const featuredArticles = articles.filter((a) => a.featured);
  const latestArticles = articles.slice(0, 4);
  const trendingArticles = articles.slice(0, 4);
  const tutorialArticles = articles
    .filter((a) => a.category.includes("Tutorial") || a.category === "Programming")
    .slice(0, 2);
  const reviewArticles = articles.filter((a) => a.category.includes("Review")).slice(0, 2);
  const scienceArticles = articles
    .filter((a) => ["Physics", "Chemistry", "Biology"].includes(a.category))
    .slice(0, 2);

  const spotlightRows = [
    {
      title: "For AI builders",
      items: articles
        .filter((article) => ["Artificial Intelligence", "AI Tools", "AI Agents"].includes(article.category))
        .slice(0, 3),
    },
    {
      title: "For learners",
      items: articles
        .filter((article) => ["Tutorials", "Programming", "Science"].includes(article.category))
        .slice(0, 3),
    },
    {
      title: "Open source radar",
      items: articles
        .filter((article) => ["FOSS Updates", "Open Source", "Technology"].includes(article.category))
        .slice(0, 3),
    },
  ];

  const slugify = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  const quickDiscovery = articles
    .filter((article) => {
      const matchesLane =
        activeLane === "all" || slugify(article.category) === activeLane;
      const haystack =
        `${article.title} ${article.excerpt} ${article.category} ${(article.tags || []).join(" ")}`.toLowerCase();
      const matchesQuery =
        !discoverQuery.trim() || haystack.includes(discoverQuery.trim().toLowerCase());
      return matchesLane && matchesQuery;
    })
    .slice(0, 4);

  return (
    <>
      <section className="relative flex min-h-[90vh] items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={
              heroImage ||
              "https://images.unsplash.com/photo-1699100329878-7f28bb780787"
            }
            alt={heroImageAlt || "Hero background"}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary backdrop-blur-sm">
              <Sparkles className="h-4 w-4" />
              <span>{publication ? publication.name : "Your Knowledge Hub"}</span>
            </div>
            <h1 className="mb-6 text-5xl font-bold leading-tight text-white md:text-6xl lg:text-7xl">
              {publication ? publication.tagline : home.heroTitle}
            </h1>
            <p className="mx-auto mb-8 max-w-3xl text-xl leading-relaxed text-white/90">
              {publication ? home.heroSubtitle : home.heroSubtitle}
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link href="/articles">
                <Button size="lg" className="group gap-2 transition-all duration-200">
                  {home.startReading}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:rotate-180" />
                </Button>
              </Link>
              <Link href="/categories">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/20 bg-white/10 text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/20"
                >
                  {home.browseCategories}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="border-b bg-background py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border bg-muted/30 p-6 md:p-8">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="mb-2 text-2xl font-bold md:text-3xl">Find the right post fast</h2>
                <p className="text-muted-foreground">
                  Pick a theme, search once, and jump to the most relevant guides without deep scrolling.
                </p>
              </div>
              <div className="w-full lg:w-[360px]">
                <SearchBar value={discoverQuery} onChange={setDiscoverQuery} placeholder="Search AI, FOSS, tools, security..." />
              </div>
            </div>

            <div className="mb-6 flex flex-wrap gap-2">
              {DISCOVERY_LANES.map((lane) => (
                <Button
                  key={lane.value}
                  variant={activeLane === lane.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveLane(lane.value)}
                >
                  {lane.label}
                </Button>
              ))}
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {quickDiscovery.map((article, index) => (
                <ArticleCard key={article.id} article={article} index={index} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b bg-muted/20 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="mb-2 text-2xl font-bold md:text-3xl">Magazine briefing</h2>
              <p className="text-muted-foreground">Fast reading lanes for builders, learners, and open-source readers.</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {spotlightRows.map((row) => (
              <div key={row.title} className="rounded-2xl border bg-background p-5">
                <h3 className="mb-4 text-lg font-semibold">{row.title}</h3>
                <div className="space-y-4">
                  {row.items.map((article) => (
                    <Link key={article.id} href={`/articles/${article.slug}`} className="group block">
                      <div className="line-clamp-2 text-sm font-medium transition-colors group-hover:text-primary">
                        {article.title}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {article.category} • {article.readingTime} min read
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">{home.featuredContent}</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Handpicked articles and guides to help you learn and grow
            </p>
          </div>

          <div className="mb-8 grid gap-8 lg:grid-cols-2">
            <div className="lg:row-span-2">
              {featuredArticles[0] && <FeaturedArticleCard article={featuredArticles[0]} large />}
            </div>
            <div className="grid gap-8">
              {featuredArticles.slice(1, 3).map((article) => (
                <FeaturedArticleCard key={article.id} article={article} />
              ))}
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {featuredArticles.slice(3, 5).map((article) => (
              <FeaturedArticleCard key={article.id} article={article} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">{home.mainCategories}</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Explore our diverse range of topics and find what interests you
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {categoryStats.map((category, index) => (
              <CategoryCard key={category.id} category={category} index={index} />
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link href="/categories">
              <Button variant="outline" size="lg" className="gap-2">
                {common.viewAll} {common.categories}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-primary/5 to-secondary/10 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              AI readers, tools, and FOSS updates
            </h2>
            <p className="mx-auto max-w-3xl text-muted-foreground">
              The platform is now structured for multilingual reading, AI-assisted explanations,
              agent workflows, and open source update publishing.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {AI_FOCUS_AREAS.map((item) => (
              <div key={item.title} className="rounded-2xl border bg-background p-6 shadow-sm">
                <h3 className="mb-2 text-xl font-semibold">{item.title}</h3>
                <p className="text-sm leading-6 text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex items-end justify-between">
            <div>
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">{home.latestArticles}</h2>
              <p className="text-muted-foreground">Fresh content to keep you informed and inspired</p>
            </div>
            <Link href="/articles" className="hidden md:block">
              <Button variant="ghost" className="gap-2">
                {common.viewAll}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {latestArticles.map((article, index) => (
              <ArticleCard key={article.id} article={article} index={index} />
            ))}
          </div>

          <div className="mt-8 text-center md:hidden">
            <Link href="/articles">
              <Button variant="outline" className="gap-2">
                {common.viewAll}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <h2 className="mb-8 text-3xl font-bold md:text-4xl">{home.trendingTopics}</h2>
              <div className="space-y-2">
                {trendingArticles.map((article, index) => (
                  <TrendingCard key={article.id} article={article} rank={index + 1} />
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-6 text-2xl font-bold">{home.tutorialsGuides}</h3>
              <div className="space-y-4">
                {tutorialArticles.map((article) => (
                  <TutorialCard key={article.id} article={article} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-3xl font-bold md:text-4xl">{home.reviewsSection}</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {reviewArticles.map((article) => (
              <ReviewCard key={article.id} article={article} />
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/reviews">
              <Button variant="outline" className="gap-2">
                {common.viewAll}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-3xl font-bold md:text-4xl">{home.scienceSection}</h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {scienceArticles.map((article, index) => (
              <ArticleCard key={article.id} article={article} index={index} />
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/science">
              <Button variant="outline" className="gap-2">
                {common.viewAll}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-muted/30 py-20">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">Categorized software downloads</h2>
          <p className="mb-8 text-lg text-muted-foreground">
            Find organized download resources for AI tools, programming guides, security software,
            and Urdu-first tutorials.
          </p>
          <Link href="/downloads">
            <Button size="lg" className="gap-2">
              Explore Downloads
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <section className="bg-gradient-to-br from-primary/10 to-secondary/10 py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">{home.newsletter}</h2>
          <p className="mb-8 text-lg text-muted-foreground">{home.newsletterDesc}</p>
          <NewsletterSignup />
        </div>
      </section>
    </>
  );
}

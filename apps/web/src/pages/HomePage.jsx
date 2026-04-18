
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import FeaturedArticleCard from '@/components/FeaturedArticleCard.jsx';
import CategoryCard from '@/components/CategoryCard.jsx';
import ArticleCard from '@/components/ArticleCard.jsx';
import TrendingCard from '@/components/TrendingCard.jsx';
import TutorialCard from '@/components/TutorialCard.jsx';
import ReviewCard from '@/components/ReviewCard.jsx';
import NewsletterSignup from '@/components/NewsletterSignup.jsx';
import { articles, categories } from '@/data/articles.js';
import { getTranslation } from '@/data/i18n.js';
import { fetchPublicPosts, mergeArticles } from '@/lib/publicContentService.js';
import { buildCategoryStats } from '@/lib/categoryUtils.js';

function HomePage() {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [allArticles, setAllArticles] = useState(articles);
  const translations = getTranslation(currentLanguage);

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'en';
    setCurrentLanguage(savedLanguage);

    fetchPublicPosts()
      .then((remoteArticles) => setAllArticles(mergeArticles(articles, remoteArticles)))
      .catch(() => setAllArticles(articles));
  }, []);

  const handleLanguageChange = (lang) => {
    setCurrentLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const featuredArticles = allArticles.filter(a => a.featured);
  const latestArticles = allArticles.slice(0, 6);
  const trendingArticles = allArticles.slice(0, 5);
  const tutorialArticles = allArticles.filter(a => a.category.includes('Tutorial') || a.category === 'Programming').slice(0, 3);
  const reviewArticles = allArticles.filter(a => a.category.includes('Review')).slice(0, 3);
  const scienceArticles = allArticles.filter(a => ['Physics', 'Chemistry', 'Biology'].includes(a.category)).slice(0, 4);
  const categoryStats = buildCategoryStats(categories, allArticles);
  const aiFocusAreas = [
    {
      title: 'AI Agents',
      text: 'Autonomous research, publishing, and workflow assistants for your content stack.',
    },
    {
      title: 'AI Tools',
      text: 'Practical explainers, summarizers, translators, and productivity helpers for readers.',
    },
    {
      title: 'FOSS Updates',
      text: 'Fresh open source news, releases, and community discoveries published into your site.',
    },
    {
      title: 'Read in Any Language',
      text: 'Each article can now be translated on demand into Urdu, Arabic, and other languages.',
    },
  ];
  const siteUrl = 'https://openguidehub.org';
  const seoKeywords = ['OpenGuideHub', 'AI guides', 'AI tools', 'FOSS updates', 'science tutorials', 'technology articles', 'multilingual learning'].join(', ');
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'OpenGuideHub',
    url: siteUrl,
    description: translations.home.heroSubtitle,
    inLanguage: ['en', 'ur', 'ar'],
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteUrl}/articles`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <>
      <Helmet>
        <title>{`OpenGuideHub - ${translations.home.heroTitle}`}</title>
        <meta name="description" content={translations.home.heroSubtitle} />
        <link rel="canonical" href={siteUrl} />
        <meta property="og:title" content={`OpenGuideHub - ${translations.home.heroTitle}`} />
        <meta property="og:description" content={translations.home.heroSubtitle} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={siteUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="keywords" content={seoKeywords} />
        <script type="application/ld+json">{JSON.stringify(websiteSchema)}</script>
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header
          currentLanguage={currentLanguage}
          onLanguageChange={handleLanguageChange}
          translations={translations}
        />

        <main className="flex-1">
          <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0">
              <img
                src="https://images.unsplash.com/photo-1699100329878-7f28bb780787"
                alt="Hero background"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70" />
            </div>
            
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 backdrop-blur-sm text-primary text-sm font-medium mb-6">
                  <Sparkles className="h-4 w-4" />
                  <span>Your Knowledge Hub</span>
                </div>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight text-white">
                  {translations.home.heroTitle}
                </h1>
                <p className="text-xl text-white/90 max-w-3xl mx-auto mb-8 leading-relaxed">
                  {translations.home.heroSubtitle}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to="/articles">
                    <Button size="lg" className="gap-2 group transition-all duration-200">
                      {translations.home.startReading}
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Link to="/categories">
                    <Button size="lg" variant="outline" className="transition-all duration-200 bg-white/10 backdrop-blur-sm text-white border-white/20 hover:bg-white/20">
                      {translations.home.browseCategories}
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </div>
          </section>

          <section className="py-20 bg-muted/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">{translations.home.featuredContent}</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Handpicked articles and guides to help you learn and grow
                </p>
              </div>

              <div className="grid lg:grid-cols-2 gap-8 mb-8">
                <div className="lg:row-span-2">
                  {featuredArticles[0] && <FeaturedArticleCard article={featuredArticles[0]} large />}
                </div>
                <div className="grid gap-8">
                  {featuredArticles.slice(1, 3).map((article) => (
                    <FeaturedArticleCard key={article.id} article={article} />
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {featuredArticles.slice(3, 5).map((article) => (
                  <FeaturedArticleCard key={article.id} article={article} />
                ))}
              </div>
            </div>
          </section>

          <section className="py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">{translations.home.mainCategories}</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Explore our diverse range of topics and find what interests you
                </p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {categoryStats.map((category, index) => (
                  <CategoryCard key={category.id} category={category} index={index} />
                ))}
              </div>

              <div className="text-center mt-8">
                <Link to="/categories">
                  <Button variant="outline" size="lg" className="gap-2">
                    {translations.common.viewAll} {translations.common.categories}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </section>

          <section className="py-20 bg-gradient-to-br from-primary/5 to-secondary/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">AI readers, tools, and FOSS updates</h2>
                <p className="text-muted-foreground max-w-3xl mx-auto">
                  The platform is now structured for multilingual reading, AI-assisted explanations, agent workflows, and open source update publishing.
                </p>
              </div>

              <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
                {aiFocusAreas.map((item) => (
                  <div key={item.title} className="rounded-2xl border bg-background p-6 shadow-sm">
                    <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-6">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="py-20 bg-muted/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-end mb-12">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">{translations.home.latestArticles}</h2>
                  <p className="text-muted-foreground">
                    Fresh content to keep you informed and inspired
                  </p>
                </div>
                <Link to="/articles" className="hidden md:block">
                  <Button variant="ghost" className="gap-2">
                    {translations.common.viewAll}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {latestArticles.map((article, index) => (
                  <ArticleCard key={article.id} article={article} index={index} />
                ))}
              </div>

              <div className="text-center mt-8 md:hidden">
                <Link to="/articles">
                  <Button variant="outline" className="gap-2">
                    {translations.common.viewAll}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </section>

          <section className="py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2">
                  <h2 className="text-3xl md:text-4xl font-bold mb-8">{translations.home.trendingTopics}</h2>
                  <div className="space-y-2">
                    {trendingArticles.map((article, index) => (
                      <TrendingCard key={article.id} article={article} rank={index + 1} />
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-6">{translations.home.tutorialsGuides}</h3>
                  <div className="space-y-4">
                    {tutorialArticles.map((article) => (
                      <TutorialCard key={article.id} article={article} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="py-20 bg-muted/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl md:text-4xl font-bold mb-8">{translations.home.reviewsSection}</h2>
              <div className="grid md:grid-cols-3 gap-8">
                {reviewArticles.map((article) => (
                  <ReviewCard key={article.id} article={article} />
                ))}
              </div>
              <div className="text-center mt-8">
                <Link to="/reviews">
                  <Button variant="outline" className="gap-2">
                    {translations.common.viewAll}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </section>

          <section className="py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl md:text-4xl font-bold mb-8">{translations.home.scienceSection}</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {scienceArticles.map((article, index) => (
                  <ArticleCard key={article.id} article={article} index={index} />
                ))}
              </div>
              <div className="text-center mt-8">
                <Link to="/science">
                  <Button variant="outline" className="gap-2">
                    {translations.common.viewAll}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </section>

          <section className="py-20 bg-muted/30">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">WordPress-style downloadable CMS</h2>
              <p className="text-muted-foreground mb-8 text-lg">
                Manage articles, pages, categories, and downloadable files in one content workflow.
              </p>
              <Link to="/downloads">
                <Button size="lg" className="gap-2">
                  Explore Downloads
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </section>

          <section className="py-20 bg-gradient-to-br from-primary/10 to-secondary/10">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{translations.home.newsletter}</h2>
              <p className="text-muted-foreground mb-8 text-lg">
                {translations.home.newsletterDesc}
              </p>
              <NewsletterSignup translations={translations.home} />
            </div>
          </section>
        </main>

        <Footer translations={translations} />
      </div>
    </>
  );
}

export default HomePage;

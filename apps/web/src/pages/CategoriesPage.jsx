
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import Breadcrumb from '@/components/Breadcrumb.jsx';
import CategoryCard from '@/components/CategoryCard.jsx';
import SearchBar from '@/components/SearchBar.jsx';
import { articles, categories } from '@/data/articles.js';
import { getTranslation } from '@/data/i18n.js';
import { fetchPublicPosts, mergeArticles } from '@/lib/publicContentService.js';
import { buildCategoryStats } from '@/lib/categoryUtils.js';

function CategoriesPage() {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [searchQuery, setSearchQuery] = useState('');
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

  const categoryStats = buildCategoryStats(categories, allArticles);

  const filteredCategories = categoryStats.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const pageUrl = 'https://openguidehub.org/categories';
  const categorySchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'OpenGuideHub Categories',
    url: pageUrl,
    description: 'Browse all categories and topics on OpenGuideHub',
    keywords: filteredCategories.map((category) => category.name).join(', '),
  };

  return (
    <>
      <Helmet>
        <title>{`Categories - OpenGuideHub`}</title>
        <meta name="description" content="Browse all categories and topics on OpenGuideHub" />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:title" content="Categories - OpenGuideHub" />
        <meta property="og:description" content="Browse all categories and topics on OpenGuideHub" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
        <meta name="keywords" content={filteredCategories.map((category) => category.name).join(', ')} />
        <script type="application/ld+json">{JSON.stringify(categorySchema)}</script>
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header
          currentLanguage={currentLanguage}
          onLanguageChange={handleLanguageChange}
          translations={translations}
        />

        <main className="flex-1 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Breadcrumb items={[{ label: translations.nav.categories }]} />

            <div className="mb-8">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">All Categories</h1>
              <p className="text-lg text-muted-foreground max-w-2xl">
                Explore our comprehensive collection of topics covering science, technology, and more
              </p>
            </div>

            <div className="mb-8 max-w-xl">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search categories..."
              />
            </div>

            {filteredCategories.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-lg text-muted-foreground">{translations.common.noResults}</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredCategories.map((category, index) => (
                  <CategoryCard key={category.id} category={category} index={index} />
                ))}
              </div>
            )}
          </div>
        </main>

        <Footer translations={translations} />
      </div>
    </>
  );
}

export default CategoriesPage;

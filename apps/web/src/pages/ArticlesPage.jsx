
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import Breadcrumb from '@/components/Breadcrumb.jsx';
import ArticleCard from '@/components/ArticleCard.jsx';
import SearchBar from '@/components/SearchBar.jsx';
import CategoryFilter from '@/components/CategoryFilter.jsx';
import Sidebar from '@/components/Sidebar.jsx';
import { articles, categories } from '@/data/articles.js';
import { getTranslation } from '@/data/i18n.js';

function ArticlesPage() {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const translations = getTranslation(currentLanguage);

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'en';
    setCurrentLanguage(savedLanguage);
  }, []);

  const handleLanguageChange = (lang) => {
    setCurrentLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
                           article.category.toLowerCase().replace(/\s+/g, '-') === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedArticles = [...filteredArticles].sort((a, b) => 
    new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
  );

  return (
    <>
      <Helmet>
        <title>{`Articles - OpenGuideHub`}</title>
        <meta name="description" content="Browse all articles and guides on OpenGuideHub" />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header
          currentLanguage={currentLanguage}
          onLanguageChange={handleLanguageChange}
          translations={translations}
        />

        <main className="flex-1 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Breadcrumb items={[{ label: translations.nav.articles }]} />

            <div className="mb-8">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">All Articles</h1>
              <p className="text-lg text-muted-foreground max-w-2xl">
                Discover in-depth articles, guides, and tutorials on science, technology, and more
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2 space-y-8">
                <div className="space-y-4">
                  <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder={translations.common.search}
                  />
                  <CategoryFilter
                    categories={categories.slice(0, 12)}
                    selectedCategory={selectedCategory}
                    onCategoryChange={setSelectedCategory}
                  />
                </div>

                {sortedArticles.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-lg text-muted-foreground">{translations.common.noResults}</p>
                  </div>
                ) : (
                  <>
                    <div className="text-sm text-muted-foreground">
                      Showing {sortedArticles.length} {sortedArticles.length === 1 ? 'article' : 'articles'}
                    </div>
                    <div className="grid gap-8">
                      {sortedArticles.map((article, index) => (
                        <ArticleCard key={article.id} article={article} index={index} />
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="lg:col-span-1">
                <Sidebar popularPosts={articles} categories={categories} />
              </div>
            </div>
          </div>
        </main>

        <Footer translations={translations} />
      </div>
    </>
  );
}

export default ArticlesPage;

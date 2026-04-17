
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import Breadcrumb from '@/components/Breadcrumb.jsx';
import ArticleCard from '@/components/ArticleCard.jsx';
import SearchBar from '@/components/SearchBar.jsx';
import { articles } from '@/data/articles.js';
import { getTranslation } from '@/data/i18n.js';

function OpenSourcePage() {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [searchQuery, setSearchQuery] = useState('');
  const translations = getTranslation(currentLanguage);

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'en';
    setCurrentLanguage(savedLanguage);
  }, []);

  const handleLanguageChange = (lang) => {
    setCurrentLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const openSourceArticles = articles.filter(article => 
    article.category === 'Open Source' || article.category === 'Repo Reviews'
  );

  const filteredArticles = openSourceArticles.filter(article =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Helmet>
        <title>{`Open Source - OpenGuideHub`}</title>
        <meta name="description" content="Learn about open source software, tools, and communities" />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header
          currentLanguage={currentLanguage}
          onLanguageChange={handleLanguageChange}
          translations={translations}
        />

        <main className="flex-1 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Breadcrumb items={[{ label: translations.nav.openSource }]} />

            <div className="mb-8">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Open Source</h1>
              <p className="text-lg text-muted-foreground max-w-2xl">
                Discover open source projects, tools, and learn how to contribute to the community
              </p>
            </div>

            <div className="mb-8 max-w-xl">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search open source content..."
              />
            </div>

            {filteredArticles.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-lg text-muted-foreground">{translations.common.noResults}</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredArticles.map((article, index) => (
                  <ArticleCard key={article.id} article={article} index={index} />
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

export default OpenSourcePage;

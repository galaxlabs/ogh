
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import Breadcrumb from '@/components/Breadcrumb.jsx';
import ReviewCard from '@/components/ReviewCard.jsx';
import SearchBar from '@/components/SearchBar.jsx';
import { articles } from '@/data/articles.js';
import { getTranslation } from '@/data/i18n.js';

function ReviewsPage() {
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

  const reviewArticles = articles.filter(article => 
    article.category.includes('Review')
  );

  const filteredReviews = reviewArticles.filter(article =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Helmet>
        <title>{`Reviews - OpenGuideHub`}</title>
        <meta name="description" content="In-depth reviews of tools, software, and technologies" />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header
          currentLanguage={currentLanguage}
          onLanguageChange={handleLanguageChange}
          translations={translations}
        />

        <main className="flex-1 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Breadcrumb items={[{ label: translations.nav.reviews }]} />

            <div className="mb-8">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Reviews</h1>
              <p className="text-lg text-muted-foreground max-w-2xl">
                In-depth reviews and analyses of tools, software, and technologies
              </p>
            </div>

            <div className="mb-8 max-w-xl">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search reviews..."
              />
            </div>

            {filteredReviews.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-lg text-muted-foreground">{translations.common.noResults}</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredReviews.map((article) => (
                  <ReviewCard key={article.id} article={article} />
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

export default ReviewsPage;

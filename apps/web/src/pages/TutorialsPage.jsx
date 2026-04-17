
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import Breadcrumb from '@/components/Breadcrumb.jsx';
import TutorialCard from '@/components/TutorialCard.jsx';
import SearchBar from '@/components/SearchBar.jsx';
import { articles } from '@/data/articles.js';
import { getTranslation } from '@/data/i18n.js';

function TutorialsPage() {
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

  const tutorialArticles = articles.filter(article => 
    article.category.includes('Tutorial') || 
    article.category === 'Programming' ||
    article.category === 'How-To Guides'
  );

  const filteredTutorials = tutorialArticles.filter(article =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Helmet>
        <title>{`Tutorials - OpenGuideHub`}</title>
        <meta name="description" content="Browse step-by-step tutorials and learning guides" />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header
          currentLanguage={currentLanguage}
          onLanguageChange={handleLanguageChange}
          translations={translations}
        />

        <main className="flex-1 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Breadcrumb items={[{ label: translations.nav.tutorials }]} />

            <div className="mb-8">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Tutorials & Guides</h1>
              <p className="text-lg text-muted-foreground max-w-2xl">
                Step-by-step tutorials to help you learn and master new skills
              </p>
            </div>

            <div className="mb-8 max-w-xl">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search tutorials..."
              />
            </div>

            {filteredTutorials.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-lg text-muted-foreground">{translations.common.noResults}</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTutorials.map((article) => (
                  <TutorialCard key={article.id} article={article} />
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

export default TutorialsPage;

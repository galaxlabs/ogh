
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { useSearchParams } from 'react-router-dom';
import Breadcrumb from '@/components/Breadcrumb.jsx';
import ArticleCard from '@/components/ArticleCard.jsx';
import SearchBar from '@/components/SearchBar.jsx';
import CategoryFilter from '@/components/CategoryFilter.jsx';
import Sidebar from '@/components/Sidebar.jsx';
import { articles, categories } from '@/data/articles.js';
import { getTranslation } from '@/data/i18n.js';
import { fetchPublicPosts, mergeArticles } from '@/lib/publicContentService.js';
import { buildCategoryStats, buildSubcategoryStats, slugifyCategory } from '@/lib/categoryUtils.js';

function ArticlesPage() {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [selectedTag, setSelectedTag] = useState(searchParams.get('tag') || 'all');
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

  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '');
    setSelectedCategory(searchParams.get('category') || 'all');
    setSelectedTag(searchParams.get('tag') || 'all');
  }, [searchParams]);

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    const next = new URLSearchParams(searchParams);
    if (value.trim()) {
      next.set('q', value);
    } else {
      next.delete('q');
    }
    setSearchParams(next, { replace: true });
  };

  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
    const next = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      next.set('category', value);
    } else {
      next.delete('category');
    }
    setSearchParams(next, { replace: true });
  };

  const categoryStats = buildCategoryStats(categories, allArticles);
  const subcategoryStats = buildSubcategoryStats(allArticles, 20);

  const handleTagChange = (value) => {
    setSelectedTag(value);
    const next = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      next.set('tag', value);
    } else {
      next.delete('tag');
    }
    setSearchParams(next, { replace: true });
  };

  const filteredArticles = allArticles.filter(article => {
    const haystack = `${article.title} ${article.excerpt} ${(article.tags || []).join(' ')}`.toLowerCase();
    const matchesSearch = haystack.includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || slugifyCategory(article.category) === selectedCategory;
    const matchesTag = selectedTag === 'all' || (article.tags || []).some((tag) => slugifyCategory(tag) === selectedTag);
    return matchesSearch && matchesCategory && matchesTag;
  });

  const sortedArticles = [...filteredArticles].sort((a, b) => 
    new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
  );
  const pageUrl = 'https://openguidehub.org/articles';
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'OpenGuideHub Articles',
    url: pageUrl,
    description: 'Browse all articles and guides on OpenGuideHub',
    about: categoryStats.slice(0, 12).map((category) => category.name),
  };

  return (
    <>
      <Helmet>
        <title>{`Articles - OpenGuideHub`}</title>
        <meta name="description" content="Browse all articles and guides on OpenGuideHub" />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:title" content="Articles - OpenGuideHub" />
        <meta property="og:description" content="Browse all articles and guides on OpenGuideHub" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
        <meta name="keywords" content={categoryStats.map((category) => category.name).slice(0, 12).join(', ')} />
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
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
                    onChange={handleSearchChange}
                    placeholder={translations.common.search}
                  />
                  <CategoryFilter
                    categories={categoryStats.slice(0, 24)}
                    selectedCategory={selectedCategory}
                    onCategoryChange={handleCategoryChange}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleTagChange('all')}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${selectedTag === 'all' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}
                    >
                      All subtopics
                    </button>
                    {subcategoryStats.map((tag) => (
                      <button
                        key={tag.slug}
                        type="button"
                        onClick={() => handleTagChange(tag.slug)}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${selectedTag === tag.slug ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}
                      >
                        {tag.name} ({tag.count})
                      </button>
                    ))}
                  </div>
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
                    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {sortedArticles.map((article, index) => (
                        <ArticleCard key={article.id} article={article} index={index} />
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="lg:col-span-1">
                <Sidebar popularPosts={allArticles} categories={categoryStats} />
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

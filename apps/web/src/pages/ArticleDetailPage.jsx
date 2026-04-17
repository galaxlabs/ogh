
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, Navigate, Link } from 'react-router-dom';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import Breadcrumb from '@/components/Breadcrumb.jsx';
import AuthorBox from '@/components/AuthorBox.jsx';
import RelatedPosts from '@/components/RelatedPosts.jsx';
import Sidebar from '@/components/Sidebar.jsx';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Clock, Calendar, Share2, Bookmark, Facebook, Twitter, Linkedin } from 'lucide-react';
import { articles, categories } from '@/data/articles.js';
import { getTranslation } from '@/data/i18n.js';

function ArticleDetailPage() {
  const { slug } = useParams();
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const translations = getTranslation(currentLanguage);

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'en';
    setCurrentLanguage(savedLanguage);
  }, []);

  const handleLanguageChange = (lang) => {
    setCurrentLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const article = articles.find(a => a.slug === slug);

  if (!article) {
    return <Navigate to="/articles" replace />;
  }

  const relatedArticles = articles.filter(a => a.category === article.category && a.id !== article.id).slice(0, 3);

  return (
    <>
      <Helmet>
        <title>{`${article.title} - OpenGuideHub`}</title>
        <meta name="description" content={article.excerpt} />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header
          currentLanguage={currentLanguage}
          onLanguageChange={handleLanguageChange}
          translations={translations}
        />

        <main className="flex-1 py-12">
          <article className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2">
                <Breadcrumb
                  items={[
                    { label: translations.nav.articles, href: '/articles' },
                    { label: article.title },
                  ]}
                />

                <div className="mb-8">
                  <Badge className="mb-4">{article.category}</Badge>
                  <h1 className="text-4xl md:text-5xl font-bold mb-6">{article.title}</h1>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{article.readingTime} min read</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(article.publishDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mb-8">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Share2 className="h-4 w-4" />
                      Share
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Bookmark className="h-4 w-4" />
                      Save
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Twitter className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Facebook className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Linkedin className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full aspect-video object-cover rounded-2xl mb-8"
                />

                <div className="prose prose-lg max-w-none mb-12">
                  {article.content.split('\n\n').map((paragraph, index) => {
                    if (paragraph.startsWith('## ')) {
                      return <h2 key={index} className="text-3xl font-bold mt-12 mb-4">{paragraph.replace('## ', '')}</h2>;
                    } else if (paragraph.startsWith('### ')) {
                      return <h3 key={index} className="text-2xl font-semibold mt-8 mb-3">{paragraph.replace('### ', '')}</h3>;
                    } else if (paragraph.startsWith('#### ')) {
                      return <h4 key={index} className="text-xl font-semibold mt-6 mb-2">{paragraph.replace('#### ', '')}</h4>;
                    } else if (paragraph.startsWith('- ') || paragraph.startsWith('* ')) {
                      return <li key={index} className="ml-6">{paragraph.substring(2)}</li>;
                    } else {
                      return <p key={index} className="mb-4 leading-relaxed">{paragraph}</p>;
                    }
                  })}
                </div>

                {article.tags && article.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-8">
                    {article.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                )}

                <Separator className="my-12" />

                <AuthorBox author={article.author} />

                <Separator className="my-12" />

                {relatedArticles.length > 0 && (
                  <RelatedPosts articles={relatedArticles} currentArticleId={article.id} />
                )}
              </div>

              <div className="lg:col-span-1">
                <div className="sticky top-24">
                  <Sidebar popularPosts={articles} categories={categories} />
                </div>
              </div>
            </div>
          </article>
        </main>

        <Footer translations={translations} />
      </div>
    </>
  );
}

export default ArticleDetailPage;

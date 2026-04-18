
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
import { Textarea } from '@/components/ui/textarea';
import { Clock, Calendar, Share2, Bookmark, Facebook, Twitter, Linkedin, Languages, Bot, Loader2 } from 'lucide-react';
import { articles, categories } from '@/data/articles.js';
import { getTranslation } from '@/data/i18n.js';
import { fetchPublicPostBySlug, fetchPublicPosts, mergeArticles } from '@/lib/publicContentService.js';
import { buildCategoryStats } from '@/lib/categoryUtils.js';
import { explainArticle, translateArticle } from '@/lib/aiReaderService.js';

function ArticleDetailPage() {
  const { slug } = useParams();
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [allArticles, setAllArticles] = useState(articles);
  const [loading, setLoading] = useState(true);
  const [targetLanguage, setTargetLanguage] = useState('Urdu');
  const [translatedContent, setTranslatedContent] = useState('');
  const [translationNotice, setTranslationNotice] = useState('');
  const [translationLoading, setTranslationLoading] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('Explain this post in simple terms with practical examples.');
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const translations = getTranslation(currentLanguage);

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'en';
    setCurrentLanguage(savedLanguage);
    setTranslatedContent('');
    setTranslationNotice('');
    setAiAnswer('');

    Promise.all([fetchPublicPosts(), fetchPublicPostBySlug(slug)])
      .then(([remoteArticles, remoteArticle]) => {
        const merged = mergeArticles(articles, remoteArticles);
        if (remoteArticle) {
          setAllArticles(mergeArticles(merged, [remoteArticle]));
        } else {
          setAllArticles(merged);
        }
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const handleLanguageChange = (lang) => {
    setCurrentLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const handleTranslate = async (article) => {
    setTranslationLoading(true);
    setTranslationNotice('');

    try {
      const result = await translateArticle({
        title: article.title,
        text: article.content,
        targetLanguage,
      });
      setTranslatedContent(result.content || '');
      setTranslationNotice(`Translated with ${result.provider} into ${targetLanguage}.`);
    } catch (error) {
      setTranslationNotice(error.message || 'Translation is not available yet.');
    } finally {
      setTranslationLoading(false);
    }
  };

  const handleAskAi = async (article) => {
    setAiLoading(true);
    setAiAnswer('');

    try {
      const result = await explainArticle({
        title: article.title,
        content: article.content,
        question: aiQuestion,
        language: currentLanguage === 'ur' ? 'Urdu' : currentLanguage === 'ar' ? 'Arabic' : 'English',
      });
      setAiAnswer(result.answer || 'No answer returned.');
    } catch (error) {
      setAiAnswer(error.message || 'AI explanation is not available yet.');
    } finally {
      setAiLoading(false);
    }
  };

  const article = allArticles.find(a => a.slug === slug);

  if (!article && loading) {
    return null;
  }

  if (!article) {
    return <Navigate to="/articles" replace />;
  }

  const relatedArticles = allArticles.filter(a => a.category === article.category && a.id !== article.id).slice(0, 3);
  const categoryStats = buildCategoryStats(categories, allArticles);
  const articleUrl = `https://openguidehub.org/articles/${article.slug}`;
  const articleContent = translatedContent || article.content;

  return (
    <>
      <Helmet>
        <title>{`${article.title} - OpenGuideHub`}</title>
        <meta name="description" content={article.excerpt} />
        <link rel="canonical" href={articleUrl} />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={article.excerpt} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={articleUrl} />
        <meta property="og:image" content={article.image} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="keywords" content={[article.category, ...(article.tags || [])].join(', ')} />
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

                <div className="rounded-2xl border bg-muted/30 p-6 mb-8 space-y-5">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Languages className="h-5 w-5 text-primary" />
                        Read this post in any language
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Translate into Urdu, Arabic, or other languages, and ask the AI reader to explain the article.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <select
                        value={targetLanguage}
                        onChange={(event) => setTargetLanguage(event.target.value)}
                        className="h-10 rounded-md border bg-background px-3 text-sm"
                      >
                        {['Urdu', 'Arabic', 'English', 'Hindi', 'Turkish', 'French', 'Spanish', 'German'].map((language) => (
                          <option key={language} value={language}>{language}</option>
                        ))}
                      </select>
                      <Button onClick={() => handleTranslate(article)} disabled={translationLoading} className="gap-2">
                        {translationLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Languages className="h-4 w-4" />}
                        Translate
                      </Button>
                    </div>
                  </div>

                  {translationNotice && (
                    <p className="text-sm text-muted-foreground">{translationNotice}</p>
                  )}

                  <div className="grid gap-3">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Bot className="h-4 w-4 text-primary" />
                      Ask the article assistant
                    </label>
                    <Textarea
                      value={aiQuestion}
                      onChange={(event) => setAiQuestion(event.target.value)}
                      rows={3}
                      placeholder="Ask for examples, simpler wording, or a quick summary"
                    />
                    <div>
                      <Button onClick={() => handleAskAi(article)} disabled={aiLoading} variant="outline" className="gap-2">
                        {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
                        Explain this post
                      </Button>
                    </div>
                    {aiAnswer && (
                      <div className="rounded-xl bg-background p-4 text-sm leading-6 whitespace-pre-wrap border">
                        {aiAnswer}
                      </div>
                    )}
                  </div>
                </div>

                <div className="prose prose-lg max-w-none mb-12">
                  {articleContent.split('\n\n').map((paragraph, index) => {
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
                  <Sidebar popularPosts={allArticles} categories={categoryStats} />
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


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

function renderStyledSegment(segment = '', keyPrefix = 'segment') {
  return String(segment || '')
    .split(/(\*\*[^*]+\*\*|==[^=]+==)/g)
    .filter(Boolean)
    .map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={`${keyPrefix}-bold-${index}`}>{part.slice(2, -2)}</strong>;
      }

      if (part.startsWith('==') && part.endsWith('==')) {
        return <mark key={`${keyPrefix}-mark-${index}`}>{part.slice(2, -2)}</mark>;
      }

      return <React.Fragment key={`${keyPrefix}-text-${index}`}>{part}</React.Fragment>;
    });
}

function renderInlineContent(text = '') {
  const value = String(text || '');
  const regex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]+)\)|(https?:\/\/[^\s]+)|((?:www\.)?[a-z0-9.-]+\.[a-z]{2,}(?:\/[^\s]*)?)|(\/articles\?[^\s]+)/gi;
  const nodes = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(value)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(...renderStyledSegment(value.slice(lastIndex, match.index), `text-${match.index}`));
    }

    const rawHref = match[2] || match[3] || match[4] || match[5] || '';
    const href = rawHref.startsWith('http') || rawHref.startsWith('/') ? rawHref : `https://${rawHref}`;
    const label = match[1] || rawHref.replace(/^https?:\/\/(www\.)?/, '');

    if (href.startsWith('/')) {
      nodes.push(
        <Link key={`${href}-${match.index}`} to={href} className="text-primary font-medium hover:underline">
          {label}
        </Link>
      );
    } else {
      nodes.push(
        <a key={`${href}-${match.index}`} href={href} target="_blank" rel="noreferrer" className="text-primary font-medium hover:underline break-all">
          {label}
        </a>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < value.length) {
    nodes.push(...renderStyledSegment(value.slice(lastIndex), `tail-${lastIndex}`));
  }

  return nodes;
}

function normalizeStructuredContent(content = '') {
  return String(content || '')
    .replace(/\r\n/g, '\n')
    .replace(/(^|\n)\s*##\s*(?=\n)/g, '$1')
    .replace(/([.!?])\s+(TL;DR|What happened|What this AI update says|Steps to know|Risk to know|Project snapshot|Key points|Why it matters|Continue exploring|Free tools and downloads|Sources and further reading)\s*:?\s*/gi, '$1\n\n## $2\n')
    .replace(/##\s*\n+\s*(TL;DR|What happened|What this AI update says|Steps to know|Risk to know|Project snapshot|Key points|Why it matters|Continue exploring|Free tools and downloads|Sources and further reading)\b/gi, '## $1')
    .replace(/(^|\n)\s*(TL;DR)\s*:?\s*(?!\n)/gi, '$1## TL;DR\n')
    .replace(/(^|\n)\s*(What happened|What this AI update says|Steps to know|Risk to know|Project snapshot)\s*:?\s*(?!\n)/gi, '$1## $2\n')
    .replace(/(^|\n)\s*(Key points)\s*[-:]?\s*/gi, '$1## Key points\n- ')
    .replace(/(^|\n)\s*(Why it matters)\s*:?\s*(?!\n)/gi, '$1## Why it matters\n')
    .replace(/(^|\n)\s*(Continue exploring)\s*:?\s*(?!\n)/gi, '$1## Continue exploring\n')
    .replace(/(^|\n)\s*(Free tools and downloads)\s*[-:]?\s*/gi, '$1## Free tools and downloads\n- ')
    .replace(/(^|\n)\s*(Sources and further reading)\s*[-:]?\s*/gi, '$1## Sources and further reading\n- ')
    .replace(/\s+- \[/g, '\n- [')
    .replace(/\s+- Source report:/g, '\n- Source report:')
    .replace(/\n-\s*-\s+/g, '\n- ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function slugifyHeading(value = '') {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function buildSeoKeywords(article) {
  const values = [
    article?.title,
    article?.category,
    `${article?.category || 'technology'} guide`,
    `${article?.category || 'technology'} article`,
    ...(article?.tags || []),
  ];

  const keywords = [];
  values.forEach((value) => {
    String(value || '')
      .split(/[,\n]/)
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((item) => {
        if (!keywords.some((existing) => existing.toLowerCase() === item.toLowerCase())) {
          keywords.push(item);
        }
      });
  });

  return keywords.slice(0, 12);
}

function renderArticleBody(content = '') {
  const lines = normalizeStructuredContent(content).split('\n');
  const elements = [];
  let paragraphLines = [];
  let listType = null;
  let listItems = [];

  const flushParagraph = () => {
    if (!paragraphLines.length) return;
    const text = paragraphLines.join(' ').trim();
    if (text) {
      elements.push(
        <p key={`p-${elements.length}`} className="mb-4 leading-8 text-foreground/90">
          {renderInlineContent(text)}
        </p>
      );
    }
    paragraphLines = [];
  };

  const flushList = () => {
    if (!listItems.length) return;
    const Tag = listType === 'ol' ? 'ol' : 'ul';
    const className = listType === 'ol'
      ? 'mb-5 ml-6 list-decimal space-y-2'
      : 'mb-5 ml-6 list-disc space-y-2';

    elements.push(
      <Tag key={`list-${elements.length}`} className={className}>
        {listItems.map((item, index) => (
          <li key={`item-${index}`}>{renderInlineContent(item)}</li>
        ))}
      </Tag>
    );

    listItems = [];
    listType = null;
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      return;
    }

    const headingMatch = line.match(/^(#{2,4})\s+(.*)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();
      const headingClass = level === 2
        ? 'inline-flex rounded-full bg-primary/10 px-4 py-1.5 text-lg font-semibold text-primary mt-10 mb-4'
        : level === 3
          ? 'text-2xl font-semibold mt-8 mb-3'
          : 'text-xl font-semibold mt-6 mb-2';
      const HeadingTag = level === 2 ? 'h2' : level === 3 ? 'h3' : 'h4';
      const headingId = slugifyHeading(text) || `section-${elements.length}`;
      elements.push(<HeadingTag key={`h-${elements.length}`} id={headingId} className={headingClass}>{renderInlineContent(text)}</HeadingTag>);
      return;
    }

    if (/^[-*]\s+/.test(line)) {
      flushParagraph();
      if (listType && listType !== 'ul') {
        flushList();
      }
      listType = 'ul';
      listItems.push(line.replace(/^[-*]\s+/, '').trim());
      return;
    }

    if (/^\d+\.\s+/.test(line)) {
      flushParagraph();
      if (listType && listType !== 'ol') {
        flushList();
      }
      listType = 'ol';
      listItems.push(line.replace(/^\d+\.\s+/, '').trim());
      return;
    }

    if (listItems.length) {
      flushList();
    }

    paragraphLines.push(line);
  });

  flushParagraph();
  flushList();

  return elements;
}

function ArticleDetailPage() {
  const { slug } = useParams();
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [allArticles, setAllArticles] = useState(articles);
  const [loading, setLoading] = useState(true);
  const [targetLanguage, setTargetLanguage] = useState('Urdu');
  const [translatedContent, setTranslatedContent] = useState('');
  const [translationNotice, setTranslationNotice] = useState('');
  const [translationLoading, setTranslationLoading] = useState(false);
  const [autoTranslatedKey, setAutoTranslatedKey] = useState('');
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

  const handleTranslate = async (article, desiredLanguage = targetLanguage) => {
    setTranslationLoading(true);
    setTranslationNotice('');

    try {
      const result = await translateArticle({
        title: article.title,
        text: article.content,
        targetLanguage: desiredLanguage,
      });
      setTranslatedContent(result.content || '');
      setTranslationNotice(`Translated with ${result.provider} into ${desiredLanguage}.`);
      setAutoTranslatedKey(`${article.slug}:${desiredLanguage}`);
    } catch (error) {
      setTranslationNotice(error.message || 'Translation is not available yet.');
      setAutoTranslatedKey(`${article.slug}:${desiredLanguage}`);
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

  useEffect(() => {
    if (currentLanguage === 'ur') {
      setTargetLanguage('Urdu');
    } else if (currentLanguage === 'ar') {
      setTargetLanguage('Arabic');
    } else if (currentLanguage === 'en') {
      setTargetLanguage('English');
      setTranslatedContent('');
      setTranslationNotice('');
      setAutoTranslatedKey('');
    }
  }, [currentLanguage]);

  useEffect(() => {
    if (!article) return;
    const researchHint = /arxiv|llm|large language model|transformer|neural|diffusion|artificial intelligence|machine learning/i.test(`${article.title} ${article.category} ${article.excerpt}`);
    if (researchHint) {
      setAiQuestion('Explain this AI research article in simple language: what problem it solves, how it works, the key result, and why it matters.');
    }
  }, [article]);

  useEffect(() => {
    if (!article) return;
    const desiredLanguage = currentLanguage === 'ur' ? 'Urdu' : currentLanguage === 'ar' ? 'Arabic' : '';
    if (!desiredLanguage) return;
    const key = `${article.slug}:${desiredLanguage}`;
    if (autoTranslatedKey === key || translationLoading) return;
    handleTranslate(article, desiredLanguage);
  }, [article, currentLanguage]);

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
  const seoKeywords = buildSeoKeywords(article);
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    image: [article.image],
    datePublished: article.publishDate,
    dateModified: article.publishDate,
    author: {
      '@type': 'Person',
      name: article.author?.name || 'OpenGuideHub',
    },
    publisher: {
      '@type': 'Organization',
      name: 'OpenGuideHub',
      url: 'https://openguidehub.org',
    },
    mainEntityOfPage: articleUrl,
    url: articleUrl,
    articleSection: article.category,
    keywords: seoKeywords.join(', '),
    articleBody: String(article.content || '').replace(/\s+/g, ' ').trim().slice(0, 5000),
  };

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
        <meta property="og:site_name" content="OpenGuideHub" />
        <meta property="article:section" content={article.category} />
        <meta property="article:published_time" content={article.publishDate} />
        <meta property="article:modified_time" content={article.publishDate} />
        <meta name="author" content={article.author?.name || 'OpenGuideHub'} />
        <meta name="robots" content="index,follow,max-image-preview:large" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={article.title} />
        <meta name="twitter:description" content={article.excerpt} />
        <meta name="twitter:image" content={article.image} />
        <meta name="keywords" content={seoKeywords.join(', ')} />
        {(article.tags || []).map((tag) => (
          <meta key={tag} property="article:tag" content={tag} />
        ))}
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
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

                <div className="article-reading prose prose-lg max-w-none mb-12">
                  {renderArticleBody(articleContent)}
                </div>

                {article.tags && article.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-8">
                    {article.tags.map((tag) => (
                      <Link key={tag} to={`/articles?tag=${encodeURIComponent(tag.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}`}>
                        <Badge variant="secondary" className="hover:bg-primary hover:text-primary-foreground transition-colors">{tag}</Badge>
                      </Link>
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

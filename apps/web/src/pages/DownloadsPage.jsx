import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Download, FileText, LayoutDashboard, Package, ArrowRight } from 'lucide-react';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { getTranslation } from '@/data/i18n.js';
import { downloadResources, cmsHighlights } from '@/data/downloads.js';

function DownloadsPage() {
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

  return (
    <>
      <Helmet>
        <title>Downloads | OpenGuideHub</title>
        <meta
          name="description"
          content="Download templates, guides, and CMS starter resources from OpenGuideHub."
        />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header
          currentLanguage={currentLanguage}
          onLanguageChange={handleLanguageChange}
          translations={translations}
        />

        <main className="flex-1">
          <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium mb-6 bg-background/80">
                <LayoutDashboard className="h-4 w-4 text-primary" />
                WordPress-like CMS Mode
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Downloadable CMS Resource Center</h1>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
                This project now supports a WordPress-style content model with downloadable resources,
                guides, templates, and admin-managed content workflows.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="#downloads-list">
                  <Button size="lg" className="gap-2">
                    Explore Downloads
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </a>
                <Link to="/admin">
                  <Button size="lg" variant="outline">Open Admin Dashboard</Button>
                </Link>
              </div>
            </div>
          </section>

          <section className="py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid md:grid-cols-3 gap-6">
                {cmsHighlights.map((item) => (
                  <div key={item.title} className="rounded-2xl border bg-card p-6 shadow-sm">
                    <Package className="h-8 w-8 text-primary mb-4" />
                    <h2 className="text-xl font-semibold mb-2">{item.title}</h2>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="downloads-list" className="py-16 bg-muted/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mb-10 text-center">
                <h2 className="text-3xl font-bold mb-3">Starter Downloads</h2>
                <p className="text-muted-foreground">
                  Download working content resources and use them as the foundation for your CMS workflow.
                </p>
              </div>

              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {downloadResources.map((resource) => (
                  <div key={resource.id} className="rounded-2xl border bg-background p-6 shadow-sm flex flex-col">
                    <FileText className="h-10 w-10 text-primary mb-4" />
                    <div className="flex-1">
                      <p className="text-sm text-primary font-medium mb-2">{resource.type}</p>
                      <h3 className="text-xl font-semibold mb-2">{resource.title}</h3>
                      <p className="text-muted-foreground mb-4">{resource.description}</p>
                      <div className="text-sm text-muted-foreground mb-4">
                        Format: {resource.format} • Size: {resource.size}
                      </div>
                    </div>
                    <a href={resource.href} download>
                      <Button className="w-full gap-2">
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>

        <Footer translations={translations} />
      </div>
    </>
  );
}

export default DownloadsPage;

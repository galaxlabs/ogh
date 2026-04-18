import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { ArrowRight, Bot, CheckCircle2, Database, FolderKanban, Globe, Languages, Shield, TerminalSquare } from 'lucide-react';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getTranslation } from '@/data/i18n.js';

const roadmapItems = [
  {
    title: 'Phase 1 — Publishing foundation',
    text: 'Channel imports, article publishing, downloads, backup and restore, and the internal operations dashboard.',
  },
  {
    title: 'Phase 2 — Multilingual reading',
    text: 'Readers can open one article and read it in Urdu, Arabic, or other languages with AI-assisted translation.',
  },
  {
    title: 'Phase 3 — AI agents and tools',
    text: 'Reader explainers, research helpers, automated channel ingestion, and tool-focused content pipelines.',
  },
  {
    title: 'Phase 4 — SEO and domain split',
    text: 'Separate public site, admin, API, and health subdomains with strong metadata, clean routing, and production monitoring.',
  },
];

const pocketbaseBenefits = [
  'Visual dashboard for collections and content records',
  'Built-in authentication and user management',
  'File uploads and media handling',
  'Simple REST API for records and assets',
  'Access rules for public, editor, and admin workflows',
  'Fast lightweight CMS for internal operations',
];

const pocketbaseAreas = [
  {
    title: 'Collections',
    text: 'Create tables for posts, downloads, settings, signups, and any custom content types.',
  },
  {
    title: 'Records',
    text: 'View, edit, publish, unpublish, or remove entries directly from the dashboard.',
  },
  {
    title: 'Files',
    text: 'Upload images, documents, and downloadable assets for your website content.',
  },
  {
    title: 'Users and auth',
    text: 'Manage admin users and secure access for backend operations.',
  },
];

function RoadmapPage() {
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
        <title>roadmap.sh — OpenGuideHub</title>
        <meta name="description" content="Platform roadmap, deployment guide, and PocketBase usage overview for OpenGuideHub." />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
        <Header
          currentLanguage={currentLanguage}
          onLanguageChange={handleLanguageChange}
          translations={translations}
        />

        <main className="flex-1">
          <section className="border-b border-slate-800 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.15),_transparent_40%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.18),_transparent_35%)]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
              <div className="max-w-4xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200 mb-6">
                  <TerminalSquare className="h-4 w-4" />
                  roadmap.sh style overview
                </div>
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                  Product roadmap, AI stack, and PocketBase guide
                </h1>
                <p className="text-slate-300 text-lg md:text-xl leading-8 max-w-3xl">
                  This page shows where the platform is heading, how the public site and backend fit together, and what you can manage from PocketBase.
                </p>
                <div className="flex flex-wrap gap-3 mt-8">
                  <Button className="gap-2">
                    Platform overview
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </section>

          <section className="py-14">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid lg:grid-cols-2 gap-6">
                {roadmapItems.map((item) => (
                  <Card key={item.title} className="border-slate-800 bg-slate-900/80 text-slate-100">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 mt-1 text-emerald-400" />
                        <div>
                          <h2 className="text-xl font-semibold mb-2">{item.title}</h2>
                          <p className="text-slate-300 leading-7">{item.text}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          <section className="py-14 border-t border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid xl:grid-cols-2 gap-8">
                <Card className="border-slate-800 bg-slate-900/80 text-slate-100">
                  <CardContent className="p-7 space-y-4">
                    <div className="flex items-center gap-3">
                      <Database className="h-5 w-5 text-cyan-300" />
                      <h2 className="text-2xl font-semibold">What PocketBase is for</h2>
                    </div>
                    <p className="text-slate-300 leading-7">
                      PocketBase is your lightweight backend control panel. It gives you a database-like CMS, media storage, and admin interface without the weight of a large platform.
                    </p>
                    <div className="space-y-2">
                      {pocketbaseBenefits.map((benefit) => (
                        <div key={benefit} className="flex items-start gap-2 text-slate-300">
                          <CheckCircle2 className="h-4 w-4 mt-1 text-emerald-400" />
                          <span>{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-800 bg-slate-900/80 text-slate-100">
                  <CardContent className="p-7 space-y-4">
                    <div className="flex items-center gap-3">
                      <Bot className="h-5 w-5 text-violet-300" />
                      <h2 className="text-2xl font-semibold">AI and agent stack</h2>
                    </div>
                    <div className="grid gap-3 text-slate-300">
                      <div className="rounded-xl border border-slate-800 p-4">
                        <div className="font-medium mb-1">Local first</div>
                        <div>Ollama with Qwen is the preferred local path for lower token cost.</div>
                      </div>
                      <div className="rounded-xl border border-slate-800 p-4">
                        <div className="font-medium mb-1">Fallback providers</div>
                        <div>OpenRouter can be used for DeepSeek, GLM, and other remote models when needed.</div>
                      </div>
                      <div className="rounded-xl border border-slate-800 p-4">
                        <div className="font-medium mb-1">Agent doctor</div>
                        <div>The repo includes a doctor script to check PM2, API health, PocketBase, and the public site quickly.</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          <section className="py-14 border-t border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-3">What you can find inside PocketBase</h2>
                <p className="text-slate-300 max-w-3xl">
                  Once you log in, the dashboard gives you the core backend controls for content, files, and users.
                </p>
              </div>
              <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
                {pocketbaseAreas.map((area) => (
                  <Card key={area.title} className="border-slate-800 bg-slate-900/80 text-slate-100">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <FolderKanban className="h-4 w-4 text-cyan-300" />
                        <h3 className="font-semibold">{area.title}</h3>
                      </div>
                      <p className="text-sm text-slate-300 leading-6">{area.text}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          <section className="py-14 border-t border-slate-800">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid md:grid-cols-3 gap-5">
                <Card className="border-slate-800 bg-slate-900/80 text-slate-100">
                  <CardContent className="p-5">
                    <Shield className="h-5 w-5 text-amber-300 mb-3" />
                    <h3 className="font-semibold mb-2">Security</h3>
                    <p className="text-sm text-slate-300">Keep PocketBase and the Admin API on the server. Only the public site should stay on Vercel.</p>
                  </CardContent>
                </Card>
                <Card className="border-slate-800 bg-slate-900/80 text-slate-100">
                  <CardContent className="p-5">
                    <Languages className="h-5 w-5 text-emerald-300 mb-3" />
                    <h3 className="font-semibold mb-2">Languages</h3>
                    <p className="text-sm text-slate-300">Readers can translate posts into Urdu, Arabic, and other supported languages from the article page.</p>
                  </CardContent>
                </Card>
                <Card className="border-slate-800 bg-slate-900/80 text-slate-100">
                  <CardContent className="p-5">
                    <Globe className="h-5 w-5 text-fuchsia-300 mb-3" />
                    <h3 className="font-semibold mb-2">Domains</h3>
                    <p className="text-sm text-slate-300">Main site stays on Vercel. Admin, API, and health subdomains should point to your server IP.</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
        </main>

        <Footer translations={translations} />
      </div>
    </>
  );
}

export default RoadmapPage;

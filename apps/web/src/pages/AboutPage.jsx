
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent } from '@/components/ui/card';
import { Target, Eye, Heart, Users, Globe, Zap } from 'lucide-react';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import Breadcrumb from '@/components/Breadcrumb.jsx';
import { getTranslation } from '@/data/i18n.js';

function AboutPage() {
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

  const values = [
    { icon: Heart, title: 'Quality Content', description: 'We create well-researched, accurate content that helps you learn effectively' },
    { icon: Users, title: 'Community First', description: 'Building a global community of learners and knowledge sharers' },
    { icon: Globe, title: 'Accessibility', description: 'Making knowledge available in multiple languages for everyone' },
    { icon: Zap, title: 'Practical Learning', description: 'Focus on actionable insights and real-world applications' },
  ];

  return (
    <>
      <Helmet>
        <title>{`About - OpenGuideHub`}</title>
        <meta name="description" content="Learn about OpenGuideHub's mission to make science and technology knowledge accessible to everyone" />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header
          currentLanguage={currentLanguage}
          onLanguageChange={handleLanguageChange}
          translations={translations}
        />

        <main className="flex-1 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Breadcrumb items={[{ label: translations.nav.about }]} />

            <div className="mb-12 text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">{translations.about.title}</h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                {translations.about.subtitle}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 mb-16">
              <Card>
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <Target className="h-6 w-6 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold">{translations.about.mission}</h2>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {translations.about.missionDesc}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-xl bg-secondary/10">
                      <Eye className="h-6 w-6 text-secondary" />
                    </div>
                    <h2 className="text-2xl font-bold">{translations.about.vision}</h2>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {translations.about.visionDesc}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="mb-12">
              <h2 className="text-3xl font-bold text-center mb-8">{translations.about.values}</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {values.map((value, index) => (
                  <Card key={index} className="hover:shadow-lg transition-all duration-200">
                    <CardContent className="p-6 text-center">
                      <div className="inline-flex p-4 rounded-xl bg-primary/10 mb-4">
                        <value.icon className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="font-semibold mb-2">{value.title}</h3>
                      <p className="text-sm text-muted-foreground">{value.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Card className="bg-gradient-to-br from-primary/10 to-secondary/10">
              <CardContent className="p-12 text-center">
                <h2 className="text-3xl font-bold mb-4">Our Story</h2>
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-6">
                  OpenGuideHub was founded with a simple belief: knowledge should be accessible to everyone, everywhere. We started by creating high-quality educational content in science and technology, and have grown into a platform serving learners worldwide.
                </p>
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  Today, we offer content in multiple languages, covering topics from quantum physics to artificial intelligence, from programming basics to advanced cybersecurity. Our community continues to grow, and we remain committed to our mission of democratizing knowledge.
                </p>
              </CardContent>
            </Card>
          </div>
        </main>

        <Footer translations={translations} />
      </div>
    </>
  );
}

export default AboutPage;

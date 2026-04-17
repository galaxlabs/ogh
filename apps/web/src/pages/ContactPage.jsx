
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail, MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import Breadcrumb from '@/components/Breadcrumb.jsx';
import { getTranslation } from '@/data/i18n.js';

function ContactPage() {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);
  const translations = getTranslation(currentLanguage);

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'en';
    setCurrentLanguage(savedLanguage);
  }, []);

  const handleLanguageChange = (lang) => {
    setCurrentLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);

    const messages = JSON.parse(localStorage.getItem('contact_messages') || '[]');
    messages.push({ ...formData, timestamp: new Date().toISOString() });
    localStorage.setItem('contact_messages', JSON.stringify(messages));

    setTimeout(() => {
      setIsLoading(false);
      toast.success(translations.contact.success);
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 500);
  };

  return (
    <>
      <Helmet>
        <title>{`Contact - OpenGuideHub`}</title>
        <meta name="description" content="Get in touch with OpenGuideHub team" />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header
          currentLanguage={currentLanguage}
          onLanguageChange={handleLanguageChange}
          translations={translations}
        />

        <main className="flex-1 py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Breadcrumb items={[{ label: translations.nav.contact }]} />

            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">{translations.contact.title}</h1>
              <p className="text-xl text-muted-foreground">
                {translations.contact.subtitle}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="inline-flex p-3 rounded-xl bg-primary/10 mb-4">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Email Us</h3>
                  <p className="text-sm text-muted-foreground">contact@openguidehub.org</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="inline-flex p-3 rounded-xl bg-secondary/10 mb-4">
                    <MessageSquare className="h-6 w-6 text-secondary" />
                  </div>
                  <h3 className="font-semibold mb-2">Live Chat</h3>
                  <p className="text-sm text-muted-foreground">Available 24/7</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="inline-flex p-3 rounded-xl bg-accent/10 mb-4">
                    <Send className="h-6 w-6 text-accent" />
                  </div>
                  <h3 className="font-semibold mb-2">Social Media</h3>
                  <p className="text-sm text-muted-foreground">Follow us online</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">{translations.contact.name}</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder={translations.contact.namePlaceholder}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="text-foreground bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">{translations.contact.email}</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder={translations.contact.emailPlaceholder}
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        className="text-foreground bg-background"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">{translations.contact.subject}</Label>
                    <Input
                      id="subject"
                      type="text"
                      placeholder={translations.contact.subjectPlaceholder}
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      required
                      className="text-foreground bg-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">{translations.contact.message}</Label>
                    <Textarea
                      id="message"
                      placeholder={translations.contact.messagePlaceholder}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                      rows={6}
                      className="text-foreground bg-background"
                    />
                  </div>

                  <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Sending...' : translations.contact.send}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>

        <Footer translations={translations} />
      </div>
    </>
  );
}

export default ContactPage;

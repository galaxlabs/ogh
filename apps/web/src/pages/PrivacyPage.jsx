
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import Breadcrumb from '@/components/Breadcrumb.jsx';
import { getTranslation } from '@/data/i18n.js';

function PrivacyPage() {
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
        <title>{`Privacy Policy - OpenGuideHub`}</title>
        <meta name="description" content="OpenGuideHub Privacy Policy" />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header
          currentLanguage={currentLanguage}
          onLanguageChange={handleLanguageChange}
          translations={translations}
        />

        <main className="flex-1 py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Breadcrumb items={[{ label: 'Privacy Policy' }]} />

            <h1 className="text-4xl md:text-5xl font-bold mb-8">Privacy Policy</h1>

            <div className="prose prose-lg max-w-none">
              <p className="text-muted-foreground mb-6">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

              <h2>Introduction</h2>
              <p>
                OpenGuideHub is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our website.
              </p>

              <h2>Information We Collect</h2>
              <p>We collect information that you provide directly to us, including:</p>
              <ul>
                <li>Name and email address when you subscribe to our newsletter</li>
                <li>Contact information when you fill out our contact form</li>
                <li>Usage data and analytics to improve our services</li>
              </ul>

              <h2>How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul>
                <li>Send you newsletters and updates</li>
                <li>Respond to your inquiries and requests</li>
                <li>Improve our website and content</li>
                <li>Analyze usage patterns and trends</li>
              </ul>

              <h2>Data Storage</h2>
              <p>
                Currently, submitted information (newsletter subscriptions and contact messages) is stored locally in your browser's localStorage. We do not store this data on external servers.
              </p>

              <h2>Cookies</h2>
              <p>
                We use cookies and similar technologies to enhance your experience on our website. You can control cookies through your browser settings.
              </p>

              <h2>Third-Party Services</h2>
              <p>
                We may use third-party services for analytics and other purposes. These services have their own privacy policies.
              </p>

              <h2>Your Rights</h2>
              <p>You have the right to:</p>
              <ul>
                <li>Access your personal data</li>
                <li>Request correction of your data</li>
                <li>Request deletion of your data</li>
                <li>Opt-out of communications</li>
              </ul>

              <h2>Children's Privacy</h2>
              <p>
                Our website is not intended for children under 13. We do not knowingly collect information from children.
              </p>

              <h2>Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated revision date.
              </p>

              <h2>Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy, please contact us at contact@openguidehub.org
              </p>
            </div>
          </div>
        </main>

        <Footer translations={translations} />
      </div>
    </>
  );
}

export default PrivacyPage;

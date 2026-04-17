
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import Breadcrumb from '@/components/Breadcrumb.jsx';
import { getTranslation } from '@/data/i18n.js';

function TermsPage() {
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
        <title>{`Terms of Service - OpenGuideHub`}</title>
        <meta name="description" content="OpenGuideHub Terms of Service" />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header
          currentLanguage={currentLanguage}
          onLanguageChange={handleLanguageChange}
          translations={translations}
        />

        <main className="flex-1 py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Breadcrumb items={[{ label: 'Terms of Service' }]} />

            <h1 className="text-4xl md:text-5xl font-bold mb-8">Terms of Service</h1>

            <div className="prose prose-lg max-w-none">
              <p className="text-muted-foreground mb-6">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

              <h2>Agreement to Terms</h2>
              <p>
                By accessing OpenGuideHub, you agree to be bound by these Terms of Service and all applicable laws and regulations.
              </p>

              <h2>Use License</h2>
              <p>
                Permission is granted to temporarily access the materials on OpenGuideHub for personal, non-commercial use only. This is the grant of a license, not a transfer of title.
              </p>

              <h2>User Content</h2>
              <p>
                When you submit content to OpenGuideHub (such as comments or contributions), you grant us a non-exclusive, worldwide license to use, reproduce, and distribute that content.
              </p>

              <h2>Acceptable Use</h2>
              <p>You agree not to:</p>
              <ul>
                <li>Use the website for any unlawful purpose</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with or disrupt the website</li>
                <li>Violate any intellectual property rights</li>
              </ul>

              <h2>Intellectual Property</h2>
              <p>
                All content on OpenGuideHub, including text, graphics, logos, and images, is the property of OpenGuideHub or its content suppliers and is protected by copyright laws.
              </p>

              <h2>Disclaimer</h2>
              <p>
                The materials on OpenGuideHub are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim all other warranties.
              </p>

              <h2>Limitations</h2>
              <p>
                In no event shall OpenGuideHub or its suppliers be liable for any damages arising out of the use or inability to use the materials on our website.
              </p>

              <h2>Revisions</h2>
              <p>
                We may revise these Terms of Service at any time without notice. By using this website, you agree to be bound by the current version of these Terms.
              </p>

              <h2>Governing Law</h2>
              <p>
                These terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law provisions.
              </p>

              <h2>Contact Information</h2>
              <p>
                If you have any questions about these Terms, please contact us at contact@openguidehub.org
              </p>
            </div>
          </div>
        </main>

        <Footer translations={translations} />
      </div>
    </>
  );
}

export default TermsPage;

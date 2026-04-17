
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import Breadcrumb from '@/components/Breadcrumb.jsx';
import { getTranslation } from '@/data/i18n.js';

function DisclaimerPage() {
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
        <title>{`Disclaimer - OpenGuideHub`}</title>
        <meta name="description" content="OpenGuideHub Disclaimer" />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header
          currentLanguage={currentLanguage}
          onLanguageChange={handleLanguageChange}
          translations={translations}
        />

        <main className="flex-1 py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Breadcrumb items={[{ label: 'Disclaimer' }]} />

            <h1 className="text-4xl md:text-5xl font-bold mb-8">Disclaimer</h1>

            <div className="prose prose-lg max-w-none">
              <p className="text-muted-foreground mb-6">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

              <h2>General Information</h2>
              <p>
                The information provided on OpenGuideHub is for general informational and educational purposes only. While we strive to keep the information accurate and up-to-date, we make no representations or warranties of any kind about the completeness, accuracy, reliability, or suitability of the information.
              </p>

              <h2>Educational Content</h2>
              <p>
                All content on OpenGuideHub, including articles, tutorials, and guides, is intended for educational purposes. This content should not be considered professional advice in any field.
              </p>

              <h2>No Professional Advice</h2>
              <p>
                The content on this website does not constitute professional advice. For specific advice related to your situation, please consult with qualified professionals in the relevant field.
              </p>

              <h2>External Links</h2>
              <p>
                OpenGuideHub may contain links to external websites. We have no control over the content and nature of these sites and are not responsible for their content or privacy practices.
              </p>

              <h2>Accuracy of Information</h2>
              <p>
                While we make every effort to ensure that the information on OpenGuideHub is correct, we do not warrant its completeness or accuracy. Technology and science are rapidly evolving fields, and information may become outdated.
              </p>

              <h2>Use at Your Own Risk</h2>
              <p>
                Any reliance you place on information from OpenGuideHub is strictly at your own risk. We will not be liable for any losses or damages in connection with the use of our website.
              </p>

              <h2>Technical Information</h2>
              <p>
                Technical tutorials and guides are provided for educational purposes. Always test in safe environments and understand the implications before implementing any technical procedures.
              </p>

              <h2>Scientific Content</h2>
              <p>
                Scientific information is simplified for general understanding. For detailed or critical applications, please refer to peer-reviewed sources and scientific literature.
              </p>

              <h2>Changes to Content</h2>
              <p>
                We reserve the right to modify, update, or remove any content on OpenGuideHub without prior notice.
              </p>

              <h2>Contact</h2>
              <p>
                If you have concerns about any content on our website, please contact us at contact@openguidehub.org
              </p>
            </div>
          </div>
        </main>

        <Footer translations={translations} />
      </div>
    </>
  );
}

export default DisclaimerPage;

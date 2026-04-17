
import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Linkedin, Github, Mail } from 'lucide-react';

function Footer({ translations }) {
  const footerLinks = {
    categories: [
      { label: translations.nav.science, path: '/science' },
      { label: translations.nav.technology, path: '/technology' },
      { label: translations.nav.openSource, path: '/open-source' },
      { label: translations.nav.tutorials, path: '/tutorials' },
    ],
    resources: [
      { label: translations.nav.articles, path: '/articles' },
      { label: translations.nav.reviews, path: '/reviews' },
      { label: translations.nav.categories, path: '/categories' },
    ],
    company: [
      { label: translations.nav.about, path: '/about' },
      { label: translations.nav.contact, path: '/contact' },
    ],
    legal: [
      { label: 'Privacy Policy', path: '/privacy' },
      { label: 'Terms of Service', path: '/terms' },
      { label: 'Disclaimer', path: '/disclaimer' },
    ],
  };

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
    { icon: Github, href: '#', label: 'GitHub' },
    { icon: Mail, href: '#', label: 'Email' },
  ];

  return (
    <footer className="bg-muted/50 border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-8">
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <span className="text-white font-bold text-xl">O</span>
              </div>
              <span className="font-bold text-xl">OpenGuideHub</span>
            </Link>
            <p className="text-sm leading-relaxed max-w-xs">
              {translations.footer.description}
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">{translations.footer.categoriesTitle}</h3>
            <ul className="space-y-2">
              {footerLinks.categories.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="text-sm hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">{translations.footer.resourcesTitle}</h3>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="text-sm hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">{translations.footer.companyTitle}</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="text-sm hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">{translations.footer.legalTitle}</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="text-sm hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm">
            © {new Date().getFullYear()} OpenGuideHub.org. {translations.footer.allRights}
          </p>
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className="hover:text-foreground transition-colors"
              >
                <social.icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

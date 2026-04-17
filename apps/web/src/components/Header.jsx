
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Search } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher.jsx';
import SearchBar from './SearchBar.jsx';

function Header({ currentLanguage, onLanguageChange, translations }) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navigationItems = [
    { label: translations.nav.home, path: '/' },
    { label: translations.nav.categories, path: '/categories' },
    { label: translations.nav.articles, path: '/articles' },
    { label: translations.nav.downloads, path: '/downloads' },
    { label: translations.nav.tutorials, path: '/tutorials' },
    { label: translations.nav.reviews, path: '/reviews' },
    { label: translations.nav.science, path: '/science' },
    { label: translations.nav.technology, path: '/technology' },
    { label: translations.nav.openSource, path: '/open-source' },
    { label: translations.nav.admin, path: '/admin' },
    { label: translations.nav.about, path: '/about' },
    { label: translations.nav.contact, path: '/contact' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <span className="text-white font-bold text-lg">O</span>
              </div>
              <span className="font-bold text-xl hidden md:inline">OpenGuideHub</span>
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              {navigationItems.slice(0, 5).map((item) => (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`transition-all duration-200 ${
                      isActive(item.path)
                        ? 'text-primary font-medium bg-primary/10'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {item.label}
                  </Button>
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:block w-64">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder={translations.common.search}
              />
            </div>

            <Button variant="ghost" size="sm" className="md:hidden">
              <Search className="h-5 w-5" />
            </Button>

            <LanguageSwitcher
              currentLanguage={currentLanguage}
              onLanguageChange={onLanguageChange}
            />

            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px]">
                <nav className="flex flex-col gap-2 mt-8">
                  {navigationItems.map((item) => (
                    <Link key={item.path} to={item.path} onClick={() => setIsOpen(false)}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`w-full justify-start transition-all duration-200 ${
                          isActive(item.path)
                            ? 'text-primary font-medium bg-primary/10'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {item.label}
                      </Button>
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;

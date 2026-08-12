"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { LanguageSwitcher } from "@/components/language-switcher";
import { FontSwitcher } from "@/components/font-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { SearchBar, SearchButton } from "@/components/search-bar";

export function Header() {
  const pathname = usePathname();
  const { translations } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const nav = translations?.nav || {};

  const navigationItems = [
    { label: nav.home || "Home", path: "/" },
    { label: nav.categories || "Categories", path: "/categories" },
    { label: nav.articles || "Articles", path: "/articles" },
    { label: nav.downloads || "Downloads", path: "/downloads" },
    { label: nav.tutorials || "Tutorials", path: "/tutorials" },
    { label: nav.reviews || "Reviews", path: "/reviews" },
    { label: nav.science || "Science", path: "/science" },
    { label: nav.technology || "Technology", path: "/technology" },
    { label: nav.openSource || "Open Source", path: "/open-source" },
    { label: nav.about || "About", path: "/about" },
    { label: nav.contact || "Contact", path: "/contact" },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary">
                <span className="text-lg font-bold text-white">O</span>
              </div>
              <span className="hidden text-xl font-bold md:inline">OpenGuideHub</span>
            </Link>

            <nav className="hidden items-center gap-1 lg:flex">
              {navigationItems.slice(0, 5).map((item) => (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`transition-all duration-200 ${
                      isActive(item.path)
                        ? "bg-primary/10 font-medium text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </Button>
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden w-56 md:block">
              <SearchBar placeholder={translations?.common?.search || "Search"} />
            </div>
            <SearchButton />

            <LanguageSwitcher />
            <FontSwitcher />
            <ThemeToggle />

            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px]">
                <nav className="mt-8 flex flex-col gap-2">
                  {navigationItems.map((item) => (
                    <Link key={item.path} href={item.path} onClick={() => setIsOpen(false)}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`w-full justify-start transition-all duration-200 ${
                          isActive(item.path)
                            ? "bg-primary/10 font-medium text-primary"
                            : "text-muted-foreground hover:text-foreground"
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


import React from 'react';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import ScrollToTop from './components/ScrollToTop.jsx';
import HomePage from './pages/HomePage.jsx';
import CategoriesPage from './pages/CategoriesPage.jsx';
import ArticlesPage from './pages/ArticlesPage.jsx';
import ArticleDetailPage from './pages/ArticleDetailPage.jsx';
import TutorialsPage from './pages/TutorialsPage.jsx';
import ReviewsPage from './pages/ReviewsPage.jsx';
import SciencePage from './pages/SciencePage.jsx';
import TechnologyPage from './pages/TechnologyPage.jsx';
import OpenSourcePage from './pages/OpenSourcePage.jsx';
import DownloadsPage from './pages/DownloadsPage.jsx';
import AdminDashboardPage from './pages/AdminDashboardPage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import ContactPage from './pages/ContactPage.jsx';
import PrivacyPage from './pages/PrivacyPage.jsx';
import TermsPage from './pages/TermsPage.jsx';
import DisclaimerPage from './pages/DisclaimerPage.jsx';

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/articles" element={<ArticlesPage />} />
        <Route path="/articles/:slug" element={<ArticleDetailPage />} />
        <Route path="/tutorials" element={<TutorialsPage />} />
        <Route path="/reviews" element={<ReviewsPage />} />
        <Route path="/science" element={<SciencePage />} />
        <Route path="/technology" element={<TechnologyPage />} />
        <Route path="/open-source" element={<OpenSourcePage />} />
        <Route path="/downloads" element={<DownloadsPage />} />
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/disclaimer" element={<DisclaimerPage />} />
      </Routes>
      <Toaster position="top-right" />
    </Router>
  );
}

export default App;

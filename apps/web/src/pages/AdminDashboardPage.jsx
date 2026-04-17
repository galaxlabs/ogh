import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileText, LayoutDashboard, LogOut, RefreshCw, ShieldCheck } from 'lucide-react';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { getTranslation } from '@/data/i18n.js';
import pocketbaseClient from '@/lib/pocketbaseClient.js';

const emptyPostForm = {
  title: '',
  excerpt: '',
  content: '',
  author: '',
  status: 'draft',
};

const emptyDownloadForm = {
  title: '',
  summary: '',
  externalUrl: '',
  status: 'draft',
};

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function AdminDashboardPage() {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const translations = getTranslation(currentLanguage);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(pocketbaseClient.authStore.isValid);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [posts, setPosts] = useState([]);
  const [downloads, setDownloads] = useState([]);
  const [postForm, setPostForm] = useState(emptyPostForm);
  const [downloadForm, setDownloadForm] = useState(emptyDownloadForm);

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'en';
    setCurrentLanguage(savedLanguage);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      void loadDashboardData();
    }
  }, [isAuthenticated]);

  const handleLanguageChange = (lang) => {
    setCurrentLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const stats = useMemo(() => {
    const publishedPosts = posts.filter((item) => item.status === 'published').length;
    const publishedDownloads = downloads.filter((item) => item.status === 'published').length;

    return {
      postCount: posts.length,
      publishedPosts,
      downloadCount: downloads.length,
      publishedDownloads,
    };
  }, [posts, downloads]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setStatusMessage('Refreshing dashboard data...');

    try {
      const [postList, downloadList] = await Promise.all([
        pocketbaseClient.collection('posts').getList(1, 20, { sort: '-created' }),
        pocketbaseClient.collection('downloads').getList(1, 20, { sort: '-created' }),
      ]);

      setPosts(postList.items);
      setDownloads(downloadList.items);
      setStatusMessage('Dashboard synced successfully.');
    } catch (error) {
      setStatusMessage(error?.message || 'Unable to load dashboard data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setStatusMessage('Signing in...');

    try {
      try {
        await pocketbaseClient.collection('admins').authWithPassword(email, password);
      } catch {
        await pocketbaseClient.collection('_superusers').authWithPassword(email, password);
      }

      setIsAuthenticated(true);
      setStatusMessage('Signed in successfully.');
    } catch (error) {
      setStatusMessage(error?.message || 'Login failed.');
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    pocketbaseClient.authStore.clear();
    setIsAuthenticated(false);
    setPosts([]);
    setDownloads([]);
    setStatusMessage('You have been signed out.');
  };

  const handleCreatePost = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setStatusMessage('Creating post...');

    try {
      await pocketbaseClient.collection('posts').create({
        title: postForm.title,
        excerpt: postForm.excerpt,
        content: postForm.content,
        contentType: 'markdown',
        author: postForm.author || 'Admin',
        status: postForm.status,
        readingTime: Math.max(1, Math.ceil(postForm.content.split(/\s+/).length / 180)),
        publishedAt: postForm.status === 'published' ? new Date().toISOString() : null,
      });

      setPostForm(emptyPostForm);
      await loadDashboardData();
      setStatusMessage('Post created successfully.');
    } catch (error) {
      setStatusMessage(error?.message || 'Could not create the post.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDownload = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setStatusMessage('Creating download...');

    try {
      await pocketbaseClient.collection('downloads').create({
        title: downloadForm.title,
        slug: slugify(downloadForm.title),
        summary: downloadForm.summary,
        externalUrl: downloadForm.externalUrl || null,
        status: downloadForm.status,
      });

      setDownloadForm(emptyDownloadForm);
      await loadDashboardData();
      setStatusMessage('Download created successfully.');
    } catch (error) {
      setStatusMessage(error?.message || 'Could not create the download item.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Admin Dashboard | OpenGuideHub</title>
        <meta
          name="description"
          content="Manage posts and downloadable resources for the OpenGuideHub CMS."
        />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-muted/20">
        <Header
          currentLanguage={currentLanguage}
          onLanguageChange={handleLanguageChange}
          translations={translations}
        />

        <main className="flex-1 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm font-medium mb-3">
                  <LayoutDashboard className="h-4 w-4 text-primary" />
                  CMS Admin Area
                </div>
                <h1 className="text-3xl md:text-4xl font-bold">Manage posts and downloads</h1>
                <p className="text-muted-foreground mt-2">
                  A lightweight WordPress-style control panel powered by PocketBase.
                </p>
              </div>

              {isAuthenticated ? (
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" className="gap-2" onClick={() => void loadDashboardData()}>
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </Button>
                  <Button variant="destructive" className="gap-2" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                </div>
              ) : null}
            </div>

            {statusMessage ? (
              <div className="rounded-lg border bg-background px-4 py-3 text-sm mb-6">
                {statusMessage}
              </div>
            ) : null}

            {!isAuthenticated ? (
              <Card className="max-w-xl mx-auto">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    Admin sign in
                  </CardTitle>
                  <CardDescription>
                    Sign in with your admins or PocketBase superuser account.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4" onSubmit={handleLogin}>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="admin@example.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="••••••••"
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Please wait...' : 'Sign in'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
                <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader>
                      <CardDescription>Total posts</CardDescription>
                      <CardTitle className="text-3xl">{stats.postCount}</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardDescription>Published posts</CardDescription>
                      <CardTitle className="text-3xl">{stats.publishedPosts}</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardDescription>Total downloads</CardDescription>
                      <CardTitle className="text-3xl">{stats.downloadCount}</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardDescription>Published downloads</CardDescription>
                      <CardTitle className="text-3xl">{stats.publishedDownloads}</CardTitle>
                    </CardHeader>
                  </Card>
                </div>

                <div className="grid xl:grid-cols-2 gap-8">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Create post
                      </CardTitle>
                      <CardDescription>Add a new article or guide to the CMS.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form className="space-y-4" onSubmit={handleCreatePost}>
                        <Input
                          placeholder="Post title"
                          value={postForm.title}
                          onChange={(event) => setPostForm((prev) => ({ ...prev, title: event.target.value }))}
                          required
                        />
                        <Input
                          placeholder="Author name"
                          value={postForm.author}
                          onChange={(event) => setPostForm((prev) => ({ ...prev, author: event.target.value }))}
                        />
                        <Textarea
                          placeholder="Short excerpt"
                          value={postForm.excerpt}
                          onChange={(event) => setPostForm((prev) => ({ ...prev, excerpt: event.target.value }))}
                        />
                        <Textarea
                          className="min-h-[180px]"
                          placeholder="Write your full content here"
                          value={postForm.content}
                          onChange={(event) => setPostForm((prev) => ({ ...prev, content: event.target.value }))}
                          required
                        />
                        <select
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                          value={postForm.status}
                          onChange={(event) => setPostForm((prev) => ({ ...prev, status: event.target.value }))}
                        >
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                        </select>
                        <Button type="submit" disabled={isLoading}>Save post</Button>
                      </form>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Download className="h-5 w-5 text-primary" />
                        Create download
                      </CardTitle>
                      <CardDescription>Add a file resource or external download link.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form className="space-y-4" onSubmit={handleCreateDownload}>
                        <Input
                          placeholder="Download title"
                          value={downloadForm.title}
                          onChange={(event) => setDownloadForm((prev) => ({ ...prev, title: event.target.value }))}
                          required
                        />
                        <Textarea
                          placeholder="Short summary"
                          value={downloadForm.summary}
                          onChange={(event) => setDownloadForm((prev) => ({ ...prev, summary: event.target.value }))}
                        />
                        <Input
                          type="url"
                          placeholder="https://example.com/file.pdf"
                          value={downloadForm.externalUrl}
                          onChange={(event) => setDownloadForm((prev) => ({ ...prev, externalUrl: event.target.value }))}
                        />
                        <select
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                          value={downloadForm.status}
                          onChange={(event) => setDownloadForm((prev) => ({ ...prev, status: event.target.value }))}
                        >
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                        </select>
                        <Button type="submit" disabled={isLoading}>Save download</Button>
                      </form>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid xl:grid-cols-2 gap-8">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent posts</CardTitle>
                      <CardDescription>Latest content items from the CMS.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {posts.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No posts found yet.</p>
                        ) : (
                          posts.map((item) => (
                            <div key={item.id} className="rounded-lg border p-3">
                              <div className="font-medium">{item.title}</div>
                              <div className="text-sm text-muted-foreground">
                                Status: {item.status || 'draft'}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Recent downloads</CardTitle>
                      <CardDescription>Latest downloadable resources and assets.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {downloads.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No download items found yet.</p>
                        ) : (
                          downloads.map((item) => (
                            <div key={item.id} className="rounded-lg border p-3">
                              <div className="font-medium">{item.title}</div>
                              <div className="text-sm text-muted-foreground">
                                Status: {item.status || 'draft'}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </main>

        <Footer translations={translations} />
      </div>
    </>
  );
}

export default AdminDashboardPage;

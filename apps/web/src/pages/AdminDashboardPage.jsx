import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Shield, Database, Download, RefreshCcw, FileText, AlertTriangle, LogOut, PlusCircle } from 'lucide-react';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { getTranslation } from '@/data/i18n.js';
import {
  seedAdminData,
  loginAdmin,
  logoutAdmin,
  isAdminAuthenticated,
  getPosts,
  savePost,
  deletePost,
  getDownloads,
  saveDownload,
  deleteDownload,
  getLogs,
  getServiceStatus,
  createBackupPayload,
  restoreBackupPayload,
  appendLog,
} from '@/lib/adminCmsService.js';

const emptyPost = { title: '', slug: '', excerpt: '', category: '', author: 'Admin', status: 'draft' };
const emptyDownload = { title: '', type: '', description: '', format: 'PDF', href: '' };

function AdminDashboardPage() {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [posts, setPosts] = useState([]);
  const [downloads, setDownloads] = useState([]);
  const [logs, setLogs] = useState([]);
  const [services, setServices] = useState([]);
  const [postForm, setPostForm] = useState(emptyPost);
  const [downloadForm, setDownloadForm] = useState(emptyDownload);
  const translations = getTranslation(currentLanguage);

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'en';
    setCurrentLanguage(savedLanguage);
    seedAdminData();
    setAuthenticated(isAdminAuthenticated());
    refreshDashboard();
  }, []);

  useEffect(() => {
    const onError = (event) => {
      appendLog('error', event.message || 'Window error', { source: event.filename });
      setLogs(getLogs());
    };

    const onRejection = (event) => {
      appendLog('error', 'Unhandled promise rejection', { reason: String(event.reason) });
      setLogs(getLogs());
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  const handleLanguageChange = (lang) => {
    setCurrentLanguage(lang);
    localStorage.setItem('language', lang);
  };

  async function refreshDashboard() {
    setPosts(getPosts());
    setDownloads(getDownloads());
    setLogs(getLogs());
    setServices(await getServiceStatus());
  }

  async function handleLogin(e) {
    e.preventDefault();
    const ok = await loginAdmin(email, password);
    if (!ok) {
      toast.error('Access denied');
      setLogs(getLogs());
      return;
    }
    setAuthenticated(true);
    setEmail('');
    setPassword('');
    refreshDashboard();
    toast.success('Signed in');
  }

  async function handleLogout() {
    await logoutAdmin();
    setAuthenticated(false);
    refreshDashboard();
    toast.success('Logged out');
  }

  function handlePostSubmit(e) {
    e.preventDefault();
    if (!postForm.title || !postForm.slug) {
      toast.error('Title and slug are required');
      return;
    }
    savePost(postForm);
    setPostForm(emptyPost);
    refreshDashboard();
    toast.success('Post saved');
  }

  function handleDownloadSubmit(e) {
    e.preventDefault();
    if (!downloadForm.title || !downloadForm.href) {
      toast.error('Download title and link are required');
      return;
    }
    saveDownload(downloadForm);
    setDownloadForm(emptyDownload);
    refreshDashboard();
    toast.success('Download saved');
  }

  function handleBackup() {
    const payload = createBackupPayload();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ogh-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    refreshDashboard();
    toast.success('Backup created and downloaded');
  }

  function handleRestore(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const payload = JSON.parse(String(reader.result));
        restoreBackupPayload(payload);
        refreshDashboard();
        toast.success('Backup restored');
      } catch (error) {
        appendLog('error', 'Restore failed', { reason: String(error) });
        setLogs(getLogs());
        toast.error('Invalid backup file');
      }
    };
    reader.readAsText(file);
  }

  return (
    <>
      <Helmet>
        <title>Restricted Area</title>
        <meta name="description" content="Restricted internal operations page." />
        <meta name="robots" content="noindex,nofollow,noarchive" />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header
          currentLanguage={currentLanguage}
          onLanguageChange={handleLanguageChange}
          translations={translations}
        />

        <main className="flex-1 py-12 bg-muted/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {!authenticated ? (
              <div className="max-w-xl mx-auto">
                <Card>
                  <CardContent className="p-8 space-y-6">
                    <div className="text-center">
                      <div className="inline-flex p-3 rounded-2xl bg-primary/10 mb-4">
                        <Shield className="h-8 w-8 text-primary" />
                      </div>
                      <h1 className="text-3xl font-bold mb-2">Restricted Area</h1>
                      <p className="text-muted-foreground">Authorized operators only.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="admin-email">Email</Label>
                        <Input id="admin-email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" autoComplete="username" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="admin-password">Password</Label>
                        <Input id="admin-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" autoComplete="current-password" />
                      </div>
                      <Button type="submit" className="w-full">Sign In</Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <h1 className="text-4xl font-bold">CMS Admin Dashboard</h1>
                    <p className="text-muted-foreground mt-2">Manage posts, downloads, logs, backups, and multi-database status from one panel.</p>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={refreshDashboard} className="gap-2">
                      <RefreshCcw className="h-4 w-4" />
                      Refresh Status
                    </Button>
                    <Button variant="destructive" onClick={handleLogout} className="gap-2">
                      <LogOut className="h-4 w-4" />
                      Logout
                    </Button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
                  {services.map((service) => (
                    <Card key={service.name}>
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold">{service.name}</span>
                          <Database className="h-4 w-4 text-primary" />
                        </div>
                        <div className="text-sm font-medium capitalize">Status: {service.status}</div>
                        <div className="text-xs text-muted-foreground mt-2 break-all">{service.details}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="grid xl:grid-cols-2 gap-8">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <FileText className="h-5 w-5 text-primary" />
                        <h2 className="text-2xl font-semibold">Manage Posts</h2>
                      </div>

                      <form onSubmit={handlePostSubmit} className="space-y-3 mb-6">
                        <Input placeholder="Post title" value={postForm.title} onChange={(e) => setPostForm({ ...postForm, title: e.target.value })} />
                        <Input placeholder="Slug" value={postForm.slug} onChange={(e) => setPostForm({ ...postForm, slug: e.target.value })} />
                        <Input placeholder="Category" value={postForm.category} onChange={(e) => setPostForm({ ...postForm, category: e.target.value })} />
                        <Input placeholder="Author" value={postForm.author} onChange={(e) => setPostForm({ ...postForm, author: e.target.value })} />
                        <Input placeholder="Status: draft or published" value={postForm.status} onChange={(e) => setPostForm({ ...postForm, status: e.target.value })} />
                        <Textarea placeholder="Short excerpt" value={postForm.excerpt} onChange={(e) => setPostForm({ ...postForm, excerpt: e.target.value })} rows={3} />
                        <Button type="submit" className="gap-2">
                          <PlusCircle className="h-4 w-4" />
                          Save Post
                        </Button>
                      </form>

                      <div className="space-y-3 max-h-[420px] overflow-auto">
                        {posts.map((post) => (
                          <div key={post.id} className="rounded-xl border p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <div className="font-semibold">{post.title}</div>
                                <div className="text-sm text-muted-foreground">{post.slug} • {post.category || 'General'} • {post.status}</div>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => setPostForm(post)}>Edit</Button>
                                <Button size="sm" variant="destructive" onClick={() => { deletePost(post.id); refreshDashboard(); }}>Delete</Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Download className="h-5 w-5 text-primary" />
                        <h2 className="text-2xl font-semibold">Manage Downloads</h2>
                      </div>

                      <form onSubmit={handleDownloadSubmit} className="space-y-3 mb-6">
                        <Input placeholder="Download title" value={downloadForm.title} onChange={(e) => setDownloadForm({ ...downloadForm, title: e.target.value })} />
                        <Input placeholder="Type" value={downloadForm.type} onChange={(e) => setDownloadForm({ ...downloadForm, type: e.target.value })} />
                        <Input placeholder="Format" value={downloadForm.format} onChange={(e) => setDownloadForm({ ...downloadForm, format: e.target.value })} />
                        <Input placeholder="File or external URL" value={downloadForm.href} onChange={(e) => setDownloadForm({ ...downloadForm, href: e.target.value })} />
                        <Textarea placeholder="Description" value={downloadForm.description} onChange={(e) => setDownloadForm({ ...downloadForm, description: e.target.value })} rows={3} />
                        <Button type="submit" className="gap-2">
                          <PlusCircle className="h-4 w-4" />
                          Save Download
                        </Button>
                      </form>

                      <div className="space-y-3 max-h-[420px] overflow-auto">
                        {downloads.map((item) => (
                          <div key={item.id} className="rounded-xl border p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <div className="font-semibold">{item.title}</div>
                                <div className="text-sm text-muted-foreground">{item.format || 'File'} • {item.href}</div>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => setDownloadForm(item)}>Edit</Button>
                                <Button size="sm" variant="destructive" onClick={() => { deleteDownload(item.id); refreshDashboard(); }}>Delete</Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid xl:grid-cols-2 gap-8">
                  <Card>
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-center gap-2">
                        <RefreshCcw className="h-5 w-5 text-primary" />
                        <h2 className="text-2xl font-semibold">Backup and Restore</h2>
                      </div>
                      <p className="text-muted-foreground">Create downloadable JSON backups and restore the dashboard content from a previous snapshot.</p>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button onClick={handleBackup}>Take Backup</Button>
                        <Label className="inline-flex items-center justify-center rounded-md border px-4 py-2 cursor-pointer">
                          Restore Backup
                          <input type="file" accept="application/json" className="hidden" onChange={handleRestore} />
                        </Label>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-primary" />
                        <h2 className="text-2xl font-semibold">Console Status and Error Logs</h2>
                      </div>
                      <div className="space-y-2 max-h-[300px] overflow-auto">
                        {logs.map((log) => (
                          <div key={log.id} className="rounded-lg border p-3 text-sm">
                            <div className="font-medium uppercase">{log.level}</div>
                            <div>{log.message}</div>
                            <div className="text-xs text-muted-foreground">{log.timestamp}</div>
                          </div>
                        ))}
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

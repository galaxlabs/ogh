"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  Database,
  Download,
  FileText,
  LogOut,
  PlusCircle,
  RefreshCcw,
  Shield,
} from "lucide-react";
import {
  appendLog,
  createBackupPayload,
  deleteDownload,
  deletePost,
  getDownloads,
  getLogs,
  getPosts,
  getServiceStatus,
  isAdminAuthenticated,
  loginAdmin,
  logoutAdmin,
  restoreBackupPayload,
  saveDownload,
  savePost,
  seedAdminData,
  type AdminDownload,
  type AdminLog,
  type AdminPost,
} from "@/lib/admin-cms-service";

const emptyPost: Partial<AdminPost> = {
  slug: "",
  title: "",
  excerpt: "",
  status: "draft",
  author: "",
  category: "",
};
const emptyDownload: Omit<AdminDownload, "id"> = {
  title: "",
  type: "",
  description: "",
  format: "",
  href: "",
};

interface ServiceStatus {
  name: string;
  status: string;
  details: string;
}

export function AdminDashboard() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return isAdminAuthenticated();
  });
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState("");
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [downloads, setDownloads] = useState<AdminDownload[]>([]);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [postForm, setPostForm] = useState<Partial<AdminPost>>(emptyPost);
  const [downloadForm, setDownloadForm] = useState<Omit<AdminDownload, "id">>(emptyDownload);

  useEffect(() => {
    seedAdminData();
    if (authenticated) {
      refreshDashboard();
    }
  }, [authenticated]);

  async function refreshDashboard() {
    setPosts(getPosts());
    setDownloads(getDownloads());
    setLogs(getLogs());
    setServices(await getServiceStatus());
  }

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setIsSigningIn(true);
    setAuthError("");

    const result = await loginAdmin(email, password);
    setIsSigningIn(false);

    if (result.ok) {
      setAuthenticated(true);
      setLogs(getLogs());
      refreshDashboard();
    } else {
      setAuthError(result.message);
    }
  }

  async function handleLogout() {
    await logoutAdmin();
    setAuthenticated(false);
    setPosts([]);
    setDownloads([]);
    setLogs([]);
  }

  function handlePostSubmit(event: React.FormEvent) {
    event.preventDefault();
    savePost(postForm);
    setPostForm(emptyPost);
    refreshDashboard();
  }

  function handleDownloadSubmit(event: React.FormEvent) {
    event.preventDefault();
    saveDownload(downloadForm);
    setDownloadForm(emptyDownload);
    refreshDashboard();
  }

  function handleBackup() {
    const payload = createBackupPayload();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ogh-backup-${payload.createdAt.slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    refreshDashboard();
    toast.success("Backup created and downloaded");
  }

  function handleRestore(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const payload = JSON.parse(String(reader.result));
        restoreBackupPayload(payload);
        refreshDashboard();
        toast.success("Backup restored");
      } catch (error) {
        appendLog("error", "Restore failed", { reason: String(error) });
        setLogs(getLogs());
        toast.error("Invalid backup file");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {!authenticated ? (
        <div className="mx-auto max-w-xl">
          <Card>
            <CardContent className="space-y-6 p-8">
              <div className="text-center">
                <div className="mb-4 inline-flex rounded-2xl bg-primary/10 p-3">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h1 className="mb-2 text-3xl font-bold">Restricted Area</h1>
                <p className="text-muted-foreground">Authorized operators only.</p>
              </div>

              <div className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
                <div className="mb-1 font-medium text-foreground">Access note</div>
                <p>
                  Use your operator email and password. If you recently changed credentials, wait a
                  few seconds and try again.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Email</Label>
                  <Input
                    id="admin-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    autoComplete="username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Password</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    autoComplete="current-password"
                  />
                </div>
                {authError && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                    {authError}
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={isSigningIn}>
                  {isSigningIn ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-4xl font-bold">CMS Admin Dashboard</h1>
              <p className="mt-2 text-muted-foreground">
                Manage posts, downloads, logs, backups, and multi-database status from one panel.
              </p>
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

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {services.map((service) => (
              <Card key={service.name}>
                <CardContent className="p-5">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-semibold">{service.name}</span>
                    <Database className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-sm font-medium capitalize">Status: {service.status}</div>
                  <div className="mt-2 break-all text-xs text-muted-foreground">{service.details}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-8 xl:grid-cols-2">
            <Card>
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <h2 className="text-2xl font-semibold">Manage Posts</h2>
                </div>

                <form onSubmit={handlePostSubmit} className="mb-6 space-y-3">
                  <Input
                    placeholder="Post title"
                    value={postForm.title}
                    onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                  />
                  <Input
                    placeholder="Slug"
                    value={postForm.slug}
                    onChange={(e) => setPostForm({ ...postForm, slug: e.target.value })}
                  />
                  <Input
                    placeholder="Category"
                    value={postForm.category}
                    onChange={(e) => setPostForm({ ...postForm, category: e.target.value })}
                  />
                  <Input
                    placeholder="Author"
                    value={postForm.author}
                    onChange={(e) => setPostForm({ ...postForm, author: e.target.value })}
                  />
                  <Input
                    placeholder="Status: draft or published"
                    value={postForm.status}
                    onChange={(e) => setPostForm({ ...postForm, status: e.target.value })}
                  />
                  <Textarea
                    placeholder="Short excerpt"
                    value={postForm.excerpt}
                    onChange={(e) => setPostForm({ ...postForm, excerpt: e.target.value })}
                    rows={3}
                  />
                  <Button type="submit" className="gap-2">
                    <PlusCircle className="h-4 w-4" />
                    Save Post
                  </Button>
                </form>

                <div className="max-h-[420px] space-y-3 overflow-auto">
                  {posts.map((post) => (
                    <div key={post.id} className="rounded-xl border p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="font-semibold">{post.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {post.slug} • {post.category || "General"} • {post.status}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setPostForm({
                                id: post.id,
                                slug: post.slug,
                                title: post.title,
                                excerpt: post.excerpt,
                                status: post.status,
                                author: post.author,
                                category: post.category,
                              })
                            }
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              deletePost(post.id);
                              refreshDashboard();
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Download className="h-5 w-5 text-primary" />
                  <h2 className="text-2xl font-semibold">Manage Downloads</h2>
                </div>

                <form onSubmit={handleDownloadSubmit} className="mb-6 space-y-3">
                  <Input
                    placeholder="Download title"
                    value={downloadForm.title}
                    onChange={(e) => setDownloadForm({ ...downloadForm, title: e.target.value })}
                  />
                  <Input
                    placeholder="Type"
                    value={downloadForm.type}
                    onChange={(e) => setDownloadForm({ ...downloadForm, type: e.target.value })}
                  />
                  <Input
                    placeholder="Format"
                    value={downloadForm.format}
                    onChange={(e) => setDownloadForm({ ...downloadForm, format: e.target.value })}
                  />
                  <Input
                    placeholder="File or external URL"
                    value={downloadForm.href}
                    onChange={(e) => setDownloadForm({ ...downloadForm, href: e.target.value })}
                  />
                  <Textarea
                    placeholder="Description"
                    value={downloadForm.description}
                    onChange={(e) =>
                      setDownloadForm({ ...downloadForm, description: e.target.value })
                    }
                    rows={3}
                  />
                  <Button type="submit" className="gap-2">
                    <PlusCircle className="h-4 w-4" />
                    Save Download
                  </Button>
                </form>

                <div className="max-h-[420px] space-y-3 overflow-auto">
                  {downloads.map((item) => (
                    <div key={item.id} className="rounded-xl border p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="font-semibold">{item.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.format || "File"} • {item.href}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => setDownloadForm(item)}>
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              deleteDownload(item.id);
                              refreshDashboard();
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-8 xl:grid-cols-2">
            <Card>
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center gap-2">
                  <RefreshCcw className="h-5 w-5 text-primary" />
                  <h2 className="text-2xl font-semibold">Backup and Restore</h2>
                </div>
                <p className="text-muted-foreground">
                  Create downloadable JSON backups and restore the dashboard content from a previous
                  snapshot.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button onClick={handleBackup}>Take Backup</Button>
                  <Label className="inline-flex cursor-pointer items-center justify-center rounded-md border px-4 py-2">
                    Restore Backup
                    <input
                      type="file"
                      accept="application/json"
                      className="hidden"
                      onChange={handleRestore}
                    />
                  </Label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-primary" />
                  <h2 className="text-2xl font-semibold">Console Status and Error Logs</h2>
                </div>
                <div className="max-h-[300px] space-y-2 overflow-auto">
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
  );
}

import { articles as defaultArticles } from '@/data/articles.js';
import { downloadResources as defaultDownloads } from '@/data/downloads.js';

const STORAGE_KEYS = {
  auth: 'ogh_admin_session',
  posts: 'ogh_admin_posts',
  downloads: 'ogh_admin_downloads',
  logs: 'ogh_admin_logs',
  backups: 'ogh_admin_backups',
};

const ADMIN_API_URL = import.meta.env.VITE_ADMIN_API_URL || '';
const DB_PROVIDER = import.meta.env.VITE_DATABASE_PROVIDER || 'postgresql';

function normalizeBase(base = '') {
  return String(base || '').trim().replace(/\/+$/, '');
}

function getAdminApiBases() {
  const candidates = new Set();
  const configured = normalizeBase(ADMIN_API_URL);

  if (configured) {
    candidates.add(configured);
  }

  if (typeof window !== 'undefined') {
    const { hostname, origin } = window.location;

    if (/localhost|127\.0\.0\.1/.test(hostname)) {
      candidates.add('http://localhost:3100');
      candidates.add('http://127.0.0.1:3100');
    } else {
      candidates.add(origin);
    }
  }

  return Array.from(candidates).map(normalizeBase).filter(Boolean);
}

async function requestAdminApi(path, init = {}) {
  let lastResponse = null;
  let lastError = null;

  for (const base of getAdminApiBases()) {
    try {
      const response = await fetch(`${base}${path}`, init);

      if (response.ok || [401, 403, 429].includes(response.status)) {
        return response;
      }

      lastResponse = response;
    } catch (error) {
      lastError = error;
    }
  }

  if (lastResponse) {
    return lastResponse;
  }

  throw lastError || new Error('Admin API is not reachable');
}

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function seedAdminData() {
  if (!localStorage.getItem(STORAGE_KEYS.posts)) {
    const seededPosts = defaultArticles.map((article) => ({
      id: article.id,
      slug: article.slug,
      title: article.title,
      excerpt: article.excerpt,
      status: article.featured ? 'published' : 'draft',
      author: article.author?.name || 'Admin',
      category: article.category,
      updatedAt: article.publishDate,
    }));
    write(STORAGE_KEYS.posts, seededPosts);
  }

  if (!localStorage.getItem(STORAGE_KEYS.downloads)) {
    write(STORAGE_KEYS.downloads, defaultDownloads);
  }

  if (!localStorage.getItem(STORAGE_KEYS.logs)) {
    write(STORAGE_KEYS.logs, [
      {
        id: Date.now(),
        level: 'info',
        message: 'Admin dashboard initialized',
        timestamp: new Date().toISOString(),
      },
    ]);
  }
}

function getAuthSession() {
  return read(STORAGE_KEYS.auth, null);
}

function getAuthHeaders() {
  const session = getAuthSession();
  return session?.token
    ? { Authorization: `Bearer ${session.token}` }
    : {};
}

export async function loginAdmin(email, password) {
  try {
    const response = await requestAdminApi('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    let data = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      const message = data?.message || 'Access denied. Please use your configured admin email or owner alias and password.';
      appendLog('error', 'Failed admin login attempt', { message });
      return { ok: false, message };
    }

    write(STORAGE_KEYS.auth, {
      email: data.email,
      token: data.token,
      loggedInAt: new Date().toISOString(),
    });
    appendLog('info', 'Admin login successful');
    return { ok: true, email: data.email };
  } catch (error) {
    const message = 'Admin API is temporarily unreachable. Please try again in a few seconds.';
    appendLog('error', 'Admin API login request failed', { error: error.message });
    return { ok: false, message };
  }
}

export async function logoutAdmin() {
  const headers = getAuthHeaders();
  localStorage.removeItem(STORAGE_KEYS.auth);

  try {
    await requestAdminApi('/api/auth/logout', {
      method: 'POST',
      headers,
    });
  } catch {
    // ignore logout transport errors
  }

  appendLog('info', 'Admin logged out');
}

export function isAdminAuthenticated() {
  return Boolean(getAuthSession()?.token);
}

export function getPosts() {
  return read(STORAGE_KEYS.posts, []);
}

export function savePost(post) {
  const posts = getPosts();
  const record = {
    ...post,
    id: post.id || Date.now(),
    updatedAt: new Date().toISOString(),
  };

  const index = posts.findIndex((item) => item.id === record.id);
  if (index >= 0) {
    posts[index] = record;
    appendLog('info', `Post updated: ${record.title}`);
  } else {
    posts.unshift(record);
    appendLog('info', `Post created: ${record.title}`);
  }

  write(STORAGE_KEYS.posts, posts);
  return record;
}

export function deletePost(id) {
  const posts = getPosts().filter((item) => item.id !== id);
  write(STORAGE_KEYS.posts, posts);
  appendLog('warn', `Post deleted: ${id}`);
}

export function getDownloads() {
  return read(STORAGE_KEYS.downloads, []);
}

export function saveDownload(download) {
  const items = getDownloads();
  const record = {
    ...download,
    id: download.id || Date.now(),
  };
  const index = items.findIndex((item) => item.id === record.id);
  if (index >= 0) {
    items[index] = record;
    appendLog('info', `Download updated: ${record.title}`);
  } else {
    items.unshift(record);
    appendLog('info', `Download created: ${record.title}`);
  }
  write(STORAGE_KEYS.downloads, items);
  return record;
}

export function deleteDownload(id) {
  const items = getDownloads().filter((item) => item.id !== id);
  write(STORAGE_KEYS.downloads, items);
  appendLog('warn', `Download deleted: ${id}`);
}

export function appendLog(level, message, meta = {}) {
  const logs = read(STORAGE_KEYS.logs, []);
  const entry = {
    id: Date.now() + Math.random(),
    level,
    message,
    meta,
    timestamp: new Date().toISOString(),
  };
  logs.unshift(entry);
  write(STORAGE_KEYS.logs, logs.slice(0, 200));

  requestAdminApi('/api/logs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(entry),
  }).catch(() => null);

  return entry;
}

export function getLogs() {
  return read(STORAGE_KEYS.logs, []);
}

export async function getServiceStatus() {
  let apiStatus = 'offline';
  let services = [];
  let databases = [];

  try {
    const healthResponse = await requestAdminApi('/health');
    if (healthResponse.ok) {
      apiStatus = 'running';
    }

    const protectedResponse = await requestAdminApi('/api/status', {
      headers: getAuthHeaders(),
    });

    if (protectedResponse.ok) {
      const data = await protectedResponse.json();
      services = data.services || [];
      databases = data.databases || [];
    }
  } catch {
    apiStatus = 'offline';
  }

  return [
    ...(services.length ? services : [
      { name: 'Frontend UI', status: navigator.onLine ? 'running' : 'offline', details: 'React + Vite interface' },
      { name: 'PocketBase CMS', status: 'configured', details: import.meta.env.VITE_POCKETBASE_URL || 'http://localhost:8090' },
      { name: 'Admin API', status: apiStatus, details: ADMIN_API_URL },
    ]),
    ...(databases.length ? databases.map((db) => ({ name: `${db.provider} database`, status: db.enabled ? 'active' : 'standby', details: db.url })) : [
      { name: 'Prisma Database', status: 'ready', details: `${DB_PROVIDER} | server-managed connection` },
    ]),
  ];
}

export function createBackupPayload() {
  const payload = {
    createdAt: new Date().toISOString(),
    posts: getPosts(),
    downloads: getDownloads(),
    logs: getLogs(),
    config: {
      dbProvider: DB_PROVIDER,
    },
  };
  const backups = read(STORAGE_KEYS.backups, []);
  backups.unshift(payload);
  write(STORAGE_KEYS.backups, backups.slice(0, 20));
  appendLog('info', 'Backup created from dashboard');

  requestAdminApi('/api/backup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(payload),
  }).catch(() => null);

  return payload;
}

export function restoreBackupPayload(payload) {
  if (!payload || !Array.isArray(payload.posts) || !Array.isArray(payload.downloads)) {
    appendLog('error', 'Invalid backup restore payload');
    throw new Error('Invalid backup file');
  }

  write(STORAGE_KEYS.posts, payload.posts);
  write(STORAGE_KEYS.downloads, payload.downloads);
  if (Array.isArray(payload.logs)) {
    write(STORAGE_KEYS.logs, payload.logs);
  }
  appendLog('warn', 'Backup restored from dashboard');

  requestAdminApi('/api/restore', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(payload),
  }).catch(() => null);
}

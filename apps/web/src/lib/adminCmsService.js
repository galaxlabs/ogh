import { articles as defaultArticles } from '@/data/articles.js';
import { downloadResources as defaultDownloads } from '@/data/downloads.js';

const STORAGE_KEYS = {
  auth: 'ogh_admin_session',
  posts: 'ogh_admin_posts',
  downloads: 'ogh_admin_downloads',
  logs: 'ogh_admin_logs',
  backups: 'ogh_admin_backups',
};

const DEV_CREDENTIALS = {
  email: import.meta.env.VITE_ADMIN_EMAIL || 'admin@openguidehub.local',
  password: import.meta.env.VITE_ADMIN_PASSWORD || 'Admin@12345',
};

const ADMIN_API_URL = import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:3100';
const DB_PROVIDER = import.meta.env.VITE_DATABASE_PROVIDER || 'postgresql';
const DB_URL = import.meta.env.VITE_DATABASE_URL || 'postgresql://user:password@localhost:5432/ogh_admin';
const MYSQL_URL = import.meta.env.VITE_MYSQL_DATABASE_URL || 'mysql://user:password@localhost:3306/ogh_admin';

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

export function getAdminCredentials() {
  return DEV_CREDENTIALS;
}

export function loginAdmin(email, password) {
  const ok = email === DEV_CREDENTIALS.email && password === DEV_CREDENTIALS.password;
  if (ok) {
    write(STORAGE_KEYS.auth, { email, loggedInAt: new Date().toISOString() });
    appendLog('info', 'Admin login successful');
    return true;
  }
  appendLog('error', 'Failed admin login attempt');
  return false;
}

export function logoutAdmin() {
  localStorage.removeItem(STORAGE_KEYS.auth);
  appendLog('info', 'Admin logged out');
}

export function isAdminAuthenticated() {
  return Boolean(read(STORAGE_KEYS.auth, null));
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

  fetch(`${ADMIN_API_URL}/api/logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  }).catch(() => null);

  return entry;
}

export function getLogs() {
  return read(STORAGE_KEYS.logs, []);
}

export async function getServiceStatus() {
  let apiStatus = 'offline';
  try {
    const response = await fetch(`${ADMIN_API_URL}/health`);
    if (response.ok) {
      apiStatus = 'running';
    }
  } catch {
    apiStatus = 'offline';
  }

  return [
    { name: 'Frontend UI', status: navigator.onLine ? 'running' : 'offline', details: 'React + Vite admin panel' },
    { name: 'PocketBase CMS', status: import.meta.env.VITE_POCKETBASE_URL ? 'configured' : 'local', details: import.meta.env.VITE_POCKETBASE_URL || 'http://localhost:8090' },
    { name: 'Admin API', status: apiStatus, details: ADMIN_API_URL },
    { name: 'Prisma Database', status: 'ready', details: `${DB_PROVIDER} | ${DB_PROVIDER === 'mysql' ? MYSQL_URL : DB_URL}` },
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
      adminEmail: DEV_CREDENTIALS.email,
    },
  };
  const backups = read(STORAGE_KEYS.backups, []);
  backups.unshift(payload);
  write(STORAGE_KEYS.backups, backups.slice(0, 20));
  appendLog('info', 'Backup created from dashboard');

  fetch(`${ADMIN_API_URL}/api/backup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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

  fetch(`${ADMIN_API_URL}/api/restore`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => null);
}

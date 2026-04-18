import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number(process.env.ADMIN_API_PORT || 3100);
const logDir = path.join(__dirname, 'runtime');
const logFile = path.join(logDir, 'admin-service.log');
const backupDir = path.join(logDir, 'backups');

fs.mkdirSync(logDir, { recursive: true });
fs.mkdirSync(backupDir, { recursive: true });

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const sessions = new Map();
const loginAttempts = new Map();

const serviceState = {
  startedAt: new Date().toISOString(),
  dbProvider: process.env.DATABASE_PROVIDER || 'postgresql',
  databaseUrl: process.env.DATABASE_URL || '',
  mysqlUrl: process.env.MYSQL_DATABASE_URL || '',
  adminEmail: process.env.ADMIN_EMAIL || '',
  adminPassword: process.env.ADMIN_PASSWORD || '',
  jwtSecret: process.env.JWT_SECRET || '',
  openClawPublishToken: process.env.OPENCLAW_PUBLISH_TOKEN || '',
  publicSiteUrl: process.env.PUBLIC_SITE_URL || 'https://openguidehub.org',
  aiProvider: process.env.AI_PROVIDER || 'ollama',
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434',
  ollamaModel: process.env.OLLAMA_MODEL || 'qwen3:8b',
  openRouterApiKey: process.env.OPENROUTER_API_KEY || '',
  openRouterModel: process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat-v3-0324',
};

const prisma = serviceState.databaseUrl ? new PrismaClient() : null;
let prismaState = {
  configured: Boolean(serviceState.databaseUrl),
  connected: false,
  message: serviceState.databaseUrl ? 'Pending connection test' : 'DATABASE_URL not configured',
};

function log(level, message, meta = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    meta,
  };
  fs.appendFileSync(logFile, JSON.stringify(entry) + '\n');
  console.log(`[${entry.timestamp}] [${level.toUpperCase()}] ${message}`);
  return entry;
}

function slugify(value = '') {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'post';
}

async function verifyPrismaConnection() {
  if (!prisma) {
    prismaState = {
      configured: false,
      connected: false,
      message: 'DATABASE_URL not configured',
    };
    return prismaState;
  }

  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    prismaState = {
      configured: true,
      connected: true,
      message: `Connected to ${serviceState.dbProvider}`,
    };
    log('info', 'Prisma database connection established', { provider: serviceState.dbProvider });
  } catch (error) {
    prismaState = {
      configured: true,
      connected: false,
      message: `Database connection failed: ${error.message}`,
    };
    log('warn', 'Prisma database connection failed', { provider: serviceState.dbProvider, error: error.message });
  }

  return prismaState;
}

function getAiProviderOrder() {
  const preferred = serviceState.aiProvider === 'openrouter'
    ? ['openrouter', 'ollama']
    : ['ollama', 'openrouter'];

  return [...new Set(preferred)];
}

async function callOllamaChat(messages, temperature = 0.2) {
  const response = await fetch(`${serviceState.ollamaBaseUrl}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      model: serviceState.ollamaModel,
      messages,
      stream: false,
      options: { temperature },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Ollama request failed: ${text || response.status}`);
  }

  const data = await response.json();
  return {
    provider: 'ollama',
    content: data?.message?.content || data?.response || '',
  };
}

async function callOpenRouterChat(messages, temperature = 0.2, maxTokens = 1200) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${serviceState.openRouterApiKey}`,
      'HTTP-Referer': serviceState.publicSiteUrl,
      'X-Title': 'OpenGuideHub',
    },
    body: JSON.stringify({
      model: serviceState.openRouterModel,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenRouter request failed: ${text || response.status}`);
  }

  const data = await response.json();
  return {
    provider: 'openrouter',
    content: data?.choices?.[0]?.message?.content || '',
  };
}

async function generateAiText({ systemPrompt, userPrompt, temperature = 0.2, maxTokens = 1200 }) {
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  const errors = [];

  for (const provider of getAiProviderOrder()) {
    try {
      if (provider === 'ollama' && serviceState.ollamaBaseUrl && serviceState.ollamaModel) {
        return await callOllamaChat(messages, temperature);
      }

      if (provider === 'openrouter' && serviceState.openRouterApiKey) {
        return await callOpenRouterChat(messages, temperature, maxTokens);
      }
    } catch (error) {
      errors.push(error.message);
      log('warn', 'AI provider attempt failed', { provider, error: error.message });
    }
  }

  throw new Error(errors[0] || 'No AI provider is configured yet');
}

function buildFallbackExplanation(title = '', content = '', question = '') {
  const cleaned = String(content || '').replace(/\s+/g, ' ').trim();
  const preview = cleaned.split(/(?<=[.!?])\s+/).slice(0, 3).join(' ');

  if (question) {
    return `This article is about ${title || 'the requested topic'}. Based on the locally available content, here is the most relevant explanation: ${preview}`;
  }

  return `Quick overview: ${preview || String(title || 'This post is ready for AI explanation once the model is connected.')}`;
}

function readToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : '';
}

function createSignedJwt(payload, expiresInSeconds = 7 * 24 * 60 * 60) {
  if (!serviceState.jwtSecret) {
    return crypto.randomUUID();
  }

  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({
    ...payload,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  })).toString('base64url');
  const signature = crypto.createHmac('sha256', serviceState.jwtSecret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifySignedJwt(token) {
  if (!serviceState.jwtSecret) {
    return null;
  }

  const [header, body, signature] = String(token || '').split('.');
  if (!header || !body || !signature) {
    throw new Error('Malformed token');
  }

  const expected = crypto.createHmac('sha256', serviceState.jwtSecret).update(`${header}.${body}`).digest('base64url');
  if (expected !== signature) {
    throw new Error('Invalid token signature');
  }

  const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  if (payload?.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Token expired');
  }

  return payload;
}

function checkRateLimit(email) {
  const now = Date.now();
  const record = loginAttempts.get(email) || { count: 0, firstAttemptAt: now };

  if (now - record.firstAttemptAt > 15 * 60 * 1000) {
    loginAttempts.set(email, { count: 0, firstAttemptAt: now });
    return false;
  }

  return record.count >= 5;
}

function registerFailedAttempt(email) {
  const now = Date.now();
  const record = loginAttempts.get(email) || { count: 0, firstAttemptAt: now };
  if (now - record.firstAttemptAt > 15 * 60 * 1000) {
    loginAttempts.set(email, { count: 1, firstAttemptAt: now });
    return;
  }
  record.count += 1;
  loginAttempts.set(email, record);
}

function requireAuth(req, res, next) {
  const token = readToken(req);

  if (!token) {
    return res.status(401).json({ ok: false, message: 'Unauthorized' });
  }

  if (serviceState.jwtSecret) {
    try {
      req.adminSession = verifySignedJwt(token);
      return next();
    } catch (error) {
      return res.status(401).json({ ok: false, message: error.message || 'Unauthorized' });
    }
  }

  if (!sessions.has(token)) {
    return res.status(401).json({ ok: false, message: 'Unauthorized' });
  }

  req.adminSession = sessions.get(token);
  next();
}

function requireOpenClawToken(req, res, next) {
  const token = readToken(req);

  if (!serviceState.openClawPublishToken) {
    return res.status(503).json({ ok: false, message: 'OpenClaw publishing is not configured on the server' });
  }

  if (!token || token !== serviceState.openClawPublishToken) {
    return res.status(401).json({ ok: false, message: 'Unauthorized' });
  }

  next();
}

function mapPublicPost(post) {
  const content = String(post.content || '');
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt || '',
    content,
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
    category: post.category || 'Imported',
    tags: String(post.tags || '').split(',').map((tag) => tag.trim()).filter(Boolean),
    readingTime: Math.max(1, Math.ceil(content.split(/\s+/).filter(Boolean).length / 200)),
    publishDate: post.updatedAt || post.createdAt,
    author: {
      name: post.author || 'OpenClaw Agent',
      avatar: 'OG',
      bio: 'Auto-published content from integrated channels.',
    },
    featured: false,
  };
}

app.get('/health', (req, res) => {
  const health = {
    ok: true,
    service: 'admin-api',
    uptimeSeconds: Math.round(process.uptime()),
    startedAt: serviceState.startedAt,
    dbProvider: serviceState.dbProvider,
    database: prismaState,
  };
  log('info', 'Health check requested', health);
  res.json(health);
});

app.get('/api/public/posts', async (req, res) => {
  if (!prisma || !prismaState.connected) {
    return res.json([]);
  }

  const posts = await prisma.post.findMany({
    where: { status: 'published' },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  });

  return res.json(posts.map(mapPublicPost));
});

app.get('/api/public/posts/:slug', async (req, res) => {
  if (!prisma || !prismaState.connected) {
    return res.status(503).json({ ok: false, message: 'Database is not ready' });
  }

  const post = await prisma.post.findUnique({ where: { slug: req.params.slug } });
  if (!post || post.status !== 'published') {
    return res.status(404).json({ ok: false, message: 'Post not found' });
  }

  return res.json(mapPublicPost(post));
});

app.post('/api/auth/login', (req, res) => {
  const { email = '', password = '' } = req.body || {};

  if (checkRateLimit(email)) {
    log('warn', 'Blocked admin login attempt due to rate limit', { email });
    return res.status(429).json({ ok: false, message: 'Too many failed attempts. Try again later.' });
  }

  if (!serviceState.adminEmail || !serviceState.adminPassword) {
    log('warn', 'Admin auth requested before credentials were configured');
    return res.status(503).json({ ok: false, message: 'Admin credentials are not configured on the server' });
  }

  if (email !== serviceState.adminEmail || password !== serviceState.adminPassword) {
    registerFailedAttempt(email);
    log('warn', 'Failed admin login attempt', { email });
    return res.status(401).json({ ok: false, message: 'Invalid credentials' });
  }

  loginAttempts.delete(email);

  const session = { email, createdAt: new Date().toISOString(), role: 'admin' };
  const token = serviceState.jwtSecret
    ? createSignedJwt(session)
    : crypto.randomUUID();

  sessions.set(token, session);
  log('info', 'Admin login successful', { email, authMode: serviceState.jwtSecret ? 'jwt' : 'session' });
  return res.json({ ok: true, token, email });
});

app.post('/api/auth/logout', requireAuth, (req, res) => {
  const token = readToken(req);
  sessions.delete(token);
  log('info', 'Admin logout successful', { email: req.adminSession?.email });
  res.json({ ok: true });
});

app.get('/api/status', requireAuth, (req, res) => {
  res.json({
    services: [
      { name: 'Web Frontend', status: 'running', url: 'http://localhost:3000' },
      { name: 'PocketBase CMS', status: 'expected', url: process.env.VITE_POCKETBASE_URL || 'http://localhost:8090' },
      { name: 'Admin API', status: 'running', url: `http://localhost:${port}` },
    ],
    databases: [
      { provider: 'postgresql', enabled: serviceState.dbProvider === 'postgresql', url: 'server-managed connection' },
      { provider: 'mysql', enabled: serviceState.dbProvider === 'mysql', url: 'server-managed connection' },
    ],
  });
});

app.get('/api/logs', requireAuth, (req, res) => {
  if (!fs.existsSync(logFile)) {
    return res.json([]);
  }
  const lines = fs.readFileSync(logFile, 'utf8').trim().split('\n').filter(Boolean).slice(-200);
  const logs = lines.map((line) => {
    try {
      return JSON.parse(line);
    } catch {
      return { timestamp: new Date().toISOString(), level: 'error', message: 'Invalid log line', meta: { line } };
    }
  });
  res.json(logs.reverse());
});

app.post('/api/logs', requireAuth, (req, res) => {
  const { level = 'info', message = 'Manual log', meta = {} } = req.body || {};
  const entry = log(level, message, meta);
  res.status(201).json(entry);
});

app.post('/api/backup', requireAuth, (req, res) => {
  const snapshot = {
    createdAt: new Date().toISOString(),
    source: 'admin-dashboard',
    data: req.body || {},
  };
  const fileName = `backup-${Date.now()}.json`;
  const filePath = path.join(backupDir, fileName);
  fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2));
  log('info', 'Backup created', { fileName });
  res.status(201).json({ ok: true, fileName, filePath, snapshot });
});

app.post('/api/restore', requireAuth, (req, res) => {
  const payload = req.body || {};
  log('warn', 'Restore requested', { keys: Object.keys(payload) });
  res.json({ ok: true, restoredAt: new Date().toISOString(), payload });
});

app.post('/api/openclaw/publish', requireOpenClawToken, async (req, res) => {
  if (!prisma || !prismaState.connected) {
    return res.status(503).json({ ok: false, message: 'Database is not ready' });
  }

  try {
    const {
      item_id,
      title = '',
      url = '',
      note = '',
      category = 'LINK',
      source_domain = '',
      formatted_text = '',
    } = req.body || {};

    const normalizedTitle = String(title || source_domain || 'Imported post').trim();
    const normalizedUrl = String(url || '').trim();
    const normalizedContent = String(
      formatted_text || [normalizedTitle, normalizedUrl, note].filter(Boolean).join('\n\n')
    ).trim();

    if (!normalizedTitle && !normalizedUrl && !normalizedContent) {
      return res.status(400).json({ ok: false, message: 'Missing publish content' });
    }

    const suffixSource = String(item_id || normalizedUrl || normalizedContent);
    const suffix = crypto.createHash('sha1').update(suffixSource).digest('hex').slice(0, 10);
    const slug = `${slugify(normalizedTitle)}-${suffix}`;

    const saved = await prisma.post.upsert({
      where: { slug },
      update: {
        title: normalizedTitle,
        excerpt: String(note || '').trim().slice(0, 500) || null,
        content: normalizedContent,
        status: 'published',
        author: 'OpenClaw Agent',
        category: String(category || 'LINK'),
        tags: [category, source_domain].filter(Boolean).join(','),
      },
      create: {
        slug,
        title: normalizedTitle,
        excerpt: String(note || '').trim().slice(0, 500) || null,
        content: normalizedContent,
        status: 'published',
        author: 'OpenClaw Agent',
        category: String(category || 'LINK'),
        tags: [category, source_domain].filter(Boolean).join(','),
      },
    });

    log('info', 'OpenClaw content published', {
      slug,
      category,
      itemId: item_id,
    });

    return res.status(201).json({ ok: true, slug, id: saved.id });
  } catch (error) {
    log('error', 'OpenClaw publish failed', { error: error.message });
    return res.status(500).json({ ok: false, message: error.message });
  }
});

app.get('/api/ai/status', (req, res) => {
  res.json({
    ok: true,
    primaryProvider: serviceState.aiProvider,
    ollamaConfigured: Boolean(serviceState.ollamaBaseUrl && serviceState.ollamaModel),
    openRouterConfigured: Boolean(serviceState.openRouterApiKey),
    publicSiteUrl: serviceState.publicSiteUrl,
  });
});

app.post('/api/ai/translate', async (req, res) => {
  const { title = '', text = '', targetLanguage = 'Urdu' } = req.body || {};
  const normalizedText = String(text || '').trim();

  if (!normalizedText) {
    return res.status(400).json({ ok: false, message: 'Text is required for translation' });
  }

  if (normalizedText.length > 15000) {
    return res.status(413).json({ ok: false, message: 'Text is too large for one translation request' });
  }

  try {
    const result = await generateAiText({
      systemPrompt: `You are a precise multilingual translator for OpenGuideHub. Translate the provided article into ${targetLanguage}. Preserve headings, bullets, and structure. Do not add commentary or extra notes.`,
      userPrompt: `Title: ${title}\n\nContent:\n${normalizedText}`,
      temperature: 0.2,
      maxTokens: 2200,
    });

    return res.json({
      ok: true,
      provider: result.provider,
      targetLanguage,
      content: result.content,
    });
  } catch (error) {
    log('warn', 'AI translation unavailable', { error: error.message, targetLanguage });
    return res.status(503).json({
      ok: false,
      message: `Translation is unavailable until Ollama or OpenRouter is configured: ${error.message}`,
    });
  }
});

app.post('/api/ai/explain', async (req, res) => {
  const { title = '', content = '', question = '', language = 'English' } = req.body || {};
  const normalizedContent = String(content || '').trim();

  if (!normalizedContent) {
    return res.status(400).json({ ok: false, message: 'Post content is required' });
  }

  if (normalizedContent.length > 18000) {
    return res.status(413).json({ ok: false, message: 'Post content is too large for one AI request' });
  }

  try {
    const result = await generateAiText({
      systemPrompt: `You are the OpenGuideHub reading assistant. Answer clearly in ${language}. Use only the provided article context, explain difficult ideas simply, and avoid making up facts.`,
      userPrompt: `Article title: ${title}\n\nReader question: ${question || 'Give me a simple explanation and key takeaways.'}\n\nArticle content:\n${normalizedContent}`,
      temperature: 0.3,
      maxTokens: 1400,
    });

    return res.json({
      ok: true,
      provider: result.provider,
      answer: result.content,
    });
  } catch (error) {
    log('warn', 'AI explanation fallback used', { error: error.message });
    return res.json({
      ok: true,
      provider: 'local-fallback',
      answer: buildFallbackExplanation(title, normalizedContent, question),
      warning: error.message,
    });
  }
});

app.listen(port, async () => {
  await verifyPrismaConnection();
  log('info', `Admin API listening on port ${port}`, { port, dbProvider: serviceState.dbProvider, database: prismaState.message, aiProvider: serviceState.aiProvider });
});

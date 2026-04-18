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
  adminEmailAliases: String(process.env.ADMIN_EMAIL_ALIASES || 'admin@openguidehub.org,owner@openguidehub.org,admin').split(',').map((value) => value.trim()).filter(Boolean),
  jwtSecret: process.env.JWT_SECRET || '',
  openClawPublishToken: process.env.OPENCLAW_PUBLISH_TOKEN || '',
  publicSiteUrl: process.env.PUBLIC_SITE_URL || 'https://openguidehub.org',
  aiRewriteOnPublish: String(process.env.AI_REWRITE_ON_PUBLISH || '1') === '1',
  multiAgentPipeline: String(process.env.ENABLE_MULTI_AGENT_PIPELINE || '1') === '1',
  aiProvider: process.env.AI_PROVIDER || 'ollama',
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434',
  ollamaModel: process.env.OLLAMA_MODEL || 'qwen3:8b',
  ollamaAnalyzerModel: process.env.OLLAMA_ANALYZER_MODEL || process.env.OLLAMA_HERMES_MODEL || 'hermes3:8b',
  ollamaRewriterModel: process.env.OLLAMA_REWRITER_MODEL || process.env.OLLAMA_MODEL || 'qwen3:8b',
  ollamaHermesModel: process.env.OLLAMA_HERMES_MODEL || 'hermes3:8b',
  openRouterApiKey: process.env.OPENROUTER_API_KEY || '',
  openRouterModel: process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat-v3-0324',
};

const prisma = serviceState.databaseUrl ? new PrismaClient() : null;
let prismaState = {
  configured: Boolean(serviceState.databaseUrl),
  connected: false,
  message: serviceState.databaseUrl ? 'Pending connection test' : 'DATABASE_URL not configured',
};

function getAllowedAdminEmails() {
  return new Set(
    [serviceState.adminEmail, ...(serviceState.adminEmailAliases || [])]
      .map((value) => String(value || '').trim().toLowerCase())
      .filter(Boolean)
  );
}

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

async function callOllamaChat(messages, temperature = 0.2, model = serviceState.ollamaModel) {
  const response = await fetch(`${serviceState.ollamaBaseUrl}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      model,
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

async function generateAiText({ systemPrompt, userPrompt, temperature = 0.2, maxTokens = 1200, model }) {
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  const errors = [];

  for (const provider of getAiProviderOrder()) {
    try {
      if (provider === 'ollama' && serviceState.ollamaBaseUrl && serviceState.ollamaModel) {
        return await callOllamaChat(messages, temperature, model || serviceState.ollamaModel);
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

const DEFAULT_CONTENT_CATEGORIES = [
  'Artificial Intelligence',
  'AI Agents',
  'AI Tools',
  'FOSS Updates',
  'Cybersecurity',
  'Tutorials',
  'Programming',
  'Open Source',
  'Science',
  'Technology',
  'Repo Reviews',
  'Article',
];

const EDITORIAL_AUTHOR_POOL = [
  'OpenGuide Admin',
  'OGH Editorial Desk',
  'Knowledge Curator',
  'Insight Writer',
  'Guide Studio',
];

function buildFallbackExplanation(title = '', content = '', question = '') {
  const cleaned = String(content || '').replace(/\s+/g, ' ').trim();
  const parts = cleaned.split(/(?<=[.!?])\s+/).filter(Boolean);
  const preview = parts.slice(0, 2).join(' ');
  const takeaways = parts.slice(2, 5).map((line) => `- ${line}`).join('\n');

  if (question) {
    return `## Simple explanation\n${preview || title || 'This topic is being prepared.'}\n\n## Key takeaways\n${takeaways || '- More details will appear here once the model responds.'}`;
  }

  return `## TL;DR\n${preview || String(title || 'This post is ready for AI explanation once the model is connected.')}\n\n## Key takeaways\n${takeaways || '- Summary is currently limited in fallback mode.'}`;
}

function extractJsonObject(text = '') {
  const match = String(text || '').match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

async function analyzeContentMetadata({ title = '', url = '', note = '', formattedText = '', fallbackCategory = 'Technology', sourceDomain = '' }) {
  const fallback = {
    category: String(fallbackCategory || 'Technology'),
    excerpt: String(note || '').trim().slice(0, 220) || String(title || '').trim(),
    tags: [fallbackCategory, sourceDomain].filter(Boolean),
  };

  if (!serviceState.multiAgentPipeline) {
    return fallback;
  }

  const sample = String(formattedText || note || title || '').slice(0, 2400);
  if (!sample) {
    return fallback;
  }

  try {
    const result = await Promise.race([
      generateAiText({
        systemPrompt: `You are the OpenGuideHub analyzer+categorizor agent. Classify the content into exactly one category from: ${DEFAULT_CONTENT_CATEGORIES.join(', ')}. Return strict JSON with keys: category, excerpt, tags. Keep excerpt under 180 characters and make tags an array of 3 to 6 short phrases that act like subcategories or topic labels.`,
        userPrompt: `Title: ${title}\nSource: ${url || sourceDomain || 'N/A'}\n\nContent sample:\n${sample}`,
        temperature: 0.1,
        maxTokens: 220,
        model: serviceState.ollamaAnalyzerModel,
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('AI metadata timeout')), 3500)),
    ]);

    const parsed = extractJsonObject(result?.content || '');
    if (!parsed) {
      return fallback;
    }

    const category = DEFAULT_CONTENT_CATEGORIES.includes(parsed.category) ? parsed.category : fallback.category;
    const excerpt = String(parsed.excerpt || fallback.excerpt).trim().slice(0, 220) || fallback.excerpt;
    const tags = Array.isArray(parsed.tags)
      ? parsed.tags.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 6)
      : fallback.tags;

    return { category, excerpt, tags };
  } catch (error) {
    log('warn', 'AI metadata analysis failed, using fallback metadata', { error: error.message, title });
    return fallback;
  }
}

function pickEditorialAuthor(seed = '') {
  const normalized = String(seed || 'OpenGuideHub');
  const hash = crypto.createHash('sha1').update(normalized).digest('hex');
  return EDITORIAL_AUTHOR_POOL[parseInt(hash.slice(0, 8), 16) % EDITORIAL_AUTHOR_POOL.length];
}

function buildStructuredFallbackContent({ title = '', url = '', note = '', formattedText = '', category = 'Article', sourceDomain = '' }) {
  const baseText = String(formattedText || note || title).replace(/\s+/g, ' ').trim();
  const sentences = baseText.split(/(?<=[.!?])\s+/).filter(Boolean);
  const tldr = sentences.slice(0, 2).join(' ').slice(0, 360) || title;
  const bullets = sentences.slice(0, 4).map((line) => `- ${line.slice(0, 180)}`).join('\n');
  const sourceLabel = sourceDomain || (url ? new URL(url).hostname.replace(/^www\./, '') : 'reference source');
  const internalLink = `https://openguidehub.org/articles?category=${slugify(category || 'technology')}`;
  const sourceLine = url ? `Read full original article here: ${url}` : 'Source reference will be added when available.';

  return `## TL;DR\n${tldr}\n\n## Summary\n${bullets || '- This article has been archived and summarized for easier reading.'}\n\n## Why it matters\nThis post was reorganized into a cleaner editorial format by OpenGuideHub for faster reading and easier reference.\n\n## Continue exploring\n- More ${category || 'technology'} posts on OpenGuideHub: ${internalLink}\n- Source report: ${sourceLabel}\n- ${sourceLine}`.trim();
}

async function buildPublishedArticleContent({ title = '', url = '', note = '', formattedText = '', category = 'ARTICLE', sourceDomain = '' }) {
  const sourceLine = url ? `Read full original article here: ${url}` : '';
  const baseText = String(formattedText || [title, note].filter(Boolean).join('\n\n')).trim();
  const fallback = buildStructuredFallbackContent({ title, url, note, formattedText: baseText, category, sourceDomain });

  if (!serviceState.aiRewriteOnPublish || !baseText) {
    return fallback;
  }

  if (baseText.length > 7000) {
    return fallback;
  }

  try {
    const internalLink = `https://openguidehub.org/articles?category=${slugify(category || 'technology')}`;

    const result = await Promise.race([
      generateAiText({
        systemPrompt: 'You are the OpenGuideHub editorial rewrite agent. Rewrite source material into an original, professional magazine-style knowledge post. Use clean Markdown with sections titled TL;DR, Summary, Why it matters, and Continue exploring. Keep paragraphs short, use bullet points where useful, keep facts intact, avoid plagiarism, do not fabricate details, include one internal OpenGuideHub reading link when relevant, and keep the exact external source attribution line at the end when a URL is provided.',
        userPrompt: `Title: ${title}\nCategory: ${category}\nSource domain: ${sourceDomain || 'N/A'}\nInternal reading link: ${internalLink}\n\nSource material:\n${baseText}\n\nRequired ending line: ${sourceLine || 'No backlink line needed.'}`,
        temperature: 0.35,
        maxTokens: 900,
        model: serviceState.ollamaRewriterModel,
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('AI rewrite timeout')), 9000)),
    ]);

    return String(result.content || fallback).trim();
  } catch (error) {
    log('warn', 'AI rewrite on publish failed, using fallback content', { error: error.message, title });
    return fallback;
  }
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

function sanitizeCoverText(value = '', maxLength = 60) {
  return Array.from(String(value || '').replace(/[\uD800-\uDFFF]/g, ''))
    .join('')
    .replace(/[<&>]/g, '')
    .slice(0, maxLength) || 'OpenGuideHub';
}

function createGeneratedCover(title = 'OpenGuideHub', category = 'Technology') {
  const safeTitle = sanitizeCoverText(title, 60);
  const safeCategory = sanitizeCoverText(category, 28);
  const palette = [
    ['#0f172a', '#2563eb'],
    ['#1f2937', '#7c3aed'],
    ['#052e16', '#16a34a'],
    ['#3f1d2e', '#db2777'],
    ['#172554', '#0891b2'],
  ];
  const seed = (safeTitle + safeCategory).split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const [bg1, bg2] = palette[seed % palette.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="${bg1}"/><stop offset="100%" stop-color="${bg2}"/></linearGradient></defs><rect width="1200" height="630" fill="url(#g)" rx="36"/><circle cx="1040" cy="120" r="90" fill="rgba(255,255,255,0.08)"/><circle cx="160" cy="520" r="120" fill="rgba(255,255,255,0.06)"/><text x="80" y="140" fill="#cbd5e1" font-size="28" font-family="Arial, Helvetica, sans-serif">OpenGuideHub</text><text x="80" y="230" fill="#ffffff" font-size="54" font-weight="700" font-family="Arial, Helvetica, sans-serif">${safeTitle}</text><text x="80" y="305" fill="#e2e8f0" font-size="30" font-family="Arial, Helvetica, sans-serif">${safeCategory}</text></svg>`;
  try {
    return `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`;
  } catch {
    return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjAwIiBoZWlnaHQ9IjYzMCI+PHJlY3Qgd2lkdGg9IjEyMDAiIGhlaWdodD0iNjMwIiBmaWxsPSIjMGYxNzJhIi8+PHRleHQgeD0iNzAiIHk9IjE0MCIgZmlsbD0iI2ZmZiIgZm9udC1zaXplPSI1MiI+T3Blbkd1aWRlSHViPC90ZXh0Pjwvc3ZnPg==';
  }
}

function mapPublicPost(post, { includeContent = true } = {}) {
  const content = String(post.content || '');
  const previewContent = includeContent ? content : String(post.excerpt || '').trim();
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt || '',
    content: previewContent,
    image: post.image || createGeneratedCover(post.title, post.category || 'Technology'),
    category: post.category || 'Imported',
    tags: String(post.tags || '').split(',').map((tag) => tag.trim()).filter(Boolean),
    readingTime: Math.max(1, Math.ceil((content || previewContent).split(/\s+/).filter(Boolean).length / 200)),
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
    take: 120,
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      category: true,
      tags: true,
      author: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  res.set('Cache-Control', 'public, max-age=120, stale-while-revalidate=300');
  return res.json(posts.map((post) => mapPublicPost(post, { includeContent: false })));
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
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (checkRateLimit(normalizedEmail)) {
    log('warn', 'Blocked admin login attempt due to rate limit', { email: normalizedEmail });
    return res.status(429).json({ ok: false, message: 'Too many failed attempts. Try again later.' });
  }

  if (!serviceState.adminEmail || !serviceState.adminPassword) {
    log('warn', 'Admin auth requested before credentials were configured');
    return res.status(503).json({ ok: false, message: 'Admin credentials are not configured on the server' });
  }

  if (!getAllowedAdminEmails().has(normalizedEmail) || password !== serviceState.adminPassword) {
    registerFailedAttempt(normalizedEmail);
    log('warn', 'Failed admin login attempt', { email: normalizedEmail });
    return res.status(401).json({ ok: false, message: 'Invalid credentials' });
  }

  loginAttempts.delete(normalizedEmail);

  const session = { email: normalizedEmail, createdAt: new Date().toISOString(), role: 'admin' };
  const token = serviceState.jwtSecret
    ? createSignedJwt(session)
    : crypto.randomUUID();

  sessions.set(token, session);
  log('info', 'Admin login successful', { email: normalizedEmail, authMode: serviceState.jwtSecret ? 'jwt' : 'session' });
  return res.json({ ok: true, token, email: normalizedEmail });
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
      source_excerpt = '',
      source_image = '',
      author_name = '',
      formatted_text = '',
    } = req.body || {};

    const normalizedTitle = String(title || source_domain || 'Imported post').trim();
    const normalizedUrl = String(url || '').trim();
    const metadata = await analyzeContentMetadata({
      title: normalizedTitle,
      url: normalizedUrl,
      note: String(note || '').trim(),
      formattedText: String(formatted_text || ''),
      fallbackCategory: String(category || 'Technology'),
      sourceDomain: String(source_domain || ''),
    });
    const normalizedContent = await buildPublishedArticleContent({
      title: normalizedTitle,
      url: normalizedUrl,
      note: String(source_excerpt || note || '').trim(),
      formattedText: String(formatted_text || source_excerpt || ''),
      category: metadata.category,
      sourceDomain: String(source_domain || ''),
    });

    const selectedAuthor = String(author_name || '').trim() || pickEditorialAuthor(`${normalizedTitle}|${normalizedUrl}`);

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
        excerpt: String(metadata.excerpt || source_excerpt || note || '').trim().slice(0, 500) || null,
        content: normalizedContent,
        status: 'published',
        author: selectedAuthor,
        category: metadata.category,
        tags: metadata.tags.filter(Boolean).join(','),
      },
      create: {
        slug,
        title: normalizedTitle,
        excerpt: String(metadata.excerpt || source_excerpt || note || '').trim().slice(0, 500) || null,
        content: normalizedContent,
        status: 'published',
        author: selectedAuthor,
        category: metadata.category,
        tags: metadata.tags.filter(Boolean).join(','),
      },
    });

    log('info', 'OpenClaw content published', {
      slug,
      category: metadata.category,
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
    hermesModel: serviceState.ollamaHermesModel,
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
    const result = await Promise.race([
      generateAiText({
        systemPrompt: `You are a precise multilingual translator for OpenGuideHub. Translate the provided article into ${targetLanguage}. Preserve headings, bullets, and structure. Do not add commentary or extra notes.`,
        userPrompt: `Title: ${title}\n\nContent:\n${normalizedText}`,
        temperature: 0.2,
        maxTokens: 2200,
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('AI translation timeout')), 10000)),
    ]);

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
    const result = await Promise.race([
      generateAiText({
        systemPrompt: `You are the OpenGuideHub reading assistant. Answer clearly in ${language}. Use only the provided article context, explain difficult ideas simply, and avoid making up facts. Prefer a short TL;DR first, then 3 key takeaways.`,
        userPrompt: `Article title: ${title}\n\nReader question: ${question || 'Give me a simple explanation and key takeaways.'}\n\nArticle content:\n${normalizedContent}`,
        temperature: 0.3,
        maxTokens: 1200,
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('AI explain timeout')), 9000)),
    ]);

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

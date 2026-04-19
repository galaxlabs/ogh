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
const editorialStyleFile = path.join(__dirname, 'editorial-style-guide.md');
const researchExplainerFile = path.join(__dirname, 'ai-research-explainer-skill.md');
const multilingualReaderFile = path.join(__dirname, 'multilingual-reader-skill.md');
const boilerplateTemplatesFile = path.join(__dirname, 'content-boilerplates.md');
const repoReviewSkillFile = path.join(__dirname, 'github-repo-review-skill.md');
const dailyScoutSkillFile = path.join(__dirname, 'daily-awesome-foss-scout-skill.md');
const qualityValidatorSkillFile = path.join(__dirname, 'article-quality-validator-skill.md');
const publishingStandardFile = path.join(__dirname, 'publishing-standard.md');

fs.mkdirSync(logDir, { recursive: true });
fs.mkdirSync(backupDir, { recursive: true });

function loadGuideFile(filePath, fallbackText) {
  try {
    return fs.readFileSync(filePath, 'utf8').trim();
  } catch {
    return fallbackText;
  }
}

const EDITORIAL_STYLE_GUIDE = loadGuideFile(
  editorialStyleFile,
  'Use Markdown sections named TL;DR, What happened, Key points, Why it matters, and Sources and further reading. Keep paragraphs short, avoid repeated labels, and include one internal link plus one source backlink when relevant.'
);

const AI_RESEARCH_EXPLAINER_GUIDE = loadGuideFile(
  researchExplainerFile,
  'Explain AI and arXiv articles in simple language with sections for TL;DR, Research goal, How it works, Key findings, Why it matters, and Limits and caution.'
);

const MULTILINGUAL_READER_GUIDE = loadGuideFile(
  multilingualReaderFile,
  'Translate website and article text clearly for Urdu, Arabic, and English readers while preserving headings, bullets, and links.'
);

const CONTENT_BOILERPLATES_GUIDE = loadGuideFile(
  boilerplateTemplatesFile,
  'Use category-aware templates with clean headings, bold key ideas, free tool links, and wrapped internal/external links.'
);

const GITHUB_REPO_REVIEW_GUIDE = loadGuideFile(
  repoReviewSkillFile,
  'Review repository pages by explaining what the project is, what problem it solves, how the workflow works, and where readers can learn more.'
);

const DAILY_AWESOME_FOSS_SCOUT_GUIDE = loadGuideFile(
  dailyScoutSkillFile,
  'Prefer practical free and open-source tools, AI agents, bots, and releases with real user value and clear source attribution.'
);

const ARTICLE_QUALITY_VALIDATOR_GUIDE = loadGuideFile(
  qualityValidatorSkillFile,
  'Ensure the article does not repeat itself, explains what the topic is and why it matters, and keeps readable wrapped links plus source attribution.'
);

const PUBLISHING_STANDARD_GUIDE = loadGuideFile(
  publishingStandardFile,
  'Write complete articles with clear context, short paragraphs, useful headings, clean Markdown, and natural rewritten wording.'
);

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
  aiProvider: process.env.AI_PROVIDER || (process.env.OPENROUTER_API_KEY ? 'openrouter' : 'ollama'),
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434',
  ollamaModel: process.env.OLLAMA_MODEL || 'qwen3:8b',
  ollamaAnalyzerModel: process.env.OLLAMA_ANALYZER_MODEL || process.env.OLLAMA_HERMES_MODEL || 'hermes3:8b',
  ollamaRewriterModel: process.env.OLLAMA_REWRITER_MODEL || process.env.OLLAMA_MODEL || 'qwen3:8b',
  ollamaHermesModel: process.env.OLLAMA_HERMES_MODEL || 'hermes3:8b',
  openRouterApiKey: process.env.OPENROUTER_API_KEY || '',
  openRouterModel: process.env.OPENROUTER_MODEL || 'qwen/qwen3-235b-a22b:free',
  openRouterResearchModel: process.env.OPENROUTER_RESEARCH_MODEL || process.env.OPENROUTER_MODEL || 'qwen/qwen3-235b-a22b:free',
  openRouterTranslateModel: process.env.OPENROUTER_TRANSLATE_MODEL || process.env.OPENROUTER_MODEL || 'qwen/qwen3-235b-a22b:free',
  openRouterFallbackModel: process.env.OPENROUTER_FALLBACK_MODEL || 'openrouter/auto',
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

async function callOpenRouterChat(messages, temperature = 0.2, maxTokens = 1200, model = serviceState.openRouterModel) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${serviceState.openRouterApiKey}`,
      'HTTP-Referer': serviceState.publicSiteUrl,
      'X-Title': 'OpenGuideHub',
    },
    body: JSON.stringify({
      model,
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
  const looksLikeOpenRouterModel = (value = '') => String(value || '').includes('/');

  for (const provider of getAiProviderOrder()) {
    try {
      if (provider === 'ollama' && serviceState.ollamaBaseUrl && serviceState.ollamaModel) {
        const ollamaModel = looksLikeOpenRouterModel(model) ? serviceState.ollamaModel : (model || serviceState.ollamaModel);
        return await callOllamaChat(messages, temperature, ollamaModel);
      }

      if (provider === 'openrouter' && serviceState.openRouterApiKey) {
        const preferredModel = looksLikeOpenRouterModel(model) ? model : serviceState.openRouterModel;
        const candidateModels = [...new Set([preferredModel, serviceState.openRouterFallbackModel, 'openrouter/auto'])].filter(Boolean);

        for (const candidate of candidateModels) {
          try {
            const candidateMaxTokens = candidate === 'openrouter/auto'
              ? Math.min(maxTokens, 180)
              : maxTokens;
            return await callOpenRouterChat(messages, temperature, candidateMaxTokens, candidate);
          } catch (error) {
            errors.push(error.message);
            log('warn', 'AI provider attempt failed', { provider, model: candidate, error: error.message });
          }
        }
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

function isAiResearchContent(title = '', content = '') {
  const sample = `${title} ${content}`.toLowerCase();
  return /(arxiv|llm|large language model|transformer|neural network|diffusion|benchmark|fine-tun|agentic|artificial intelligence|machine learning)/i.test(sample);
}

function isRepoLikeContent({ title = '', url = '', category = '', sourceDomain = '', formattedText = '' } = {}) {
  const sample = `${title} ${url} ${category} ${sourceDomain} ${formattedText}`.toLowerCase();
  return /(github\.com|gitlab\.com|repository|repo\b|release\b|changelog|readme|package|pip install|npm install|cargo install|go install|brew install|docker)/i.test(sample);
}

function isDailyScoutContent({ category = '', url = '', sourceDomain = '', formattedText = '' } = {}) {
  const sample = `${category} ${url} ${sourceDomain} ${formattedText}`.toLowerCase();
  return /(artificial intelligence|ai agents|ai tools|foss|open source|repo review|github\.com|gitlab\.com|release\b)/i.test(sample);
}

function buildActiveGuides({ title = '', url = '', category = '', sourceDomain = '', formattedText = '' } = {}) {
  const guides = [
    PUBLISHING_STANDARD_GUIDE,
    EDITORIAL_STYLE_GUIDE,
    CONTENT_BOILERPLATES_GUIDE,
    ARTICLE_QUALITY_VALIDATOR_GUIDE,
    MULTILINGUAL_READER_GUIDE,
  ];

  if (isDailyScoutContent({ category, url, sourceDomain, formattedText })) {
    guides.push(DAILY_AWESOME_FOSS_SCOUT_GUIDE);
  }

  if (isRepoLikeContent({ title, url, category, sourceDomain, formattedText })) {
    guides.push(GITHUB_REPO_REVIEW_GUIDE);
  }

  if (isAiResearchContent(title, formattedText)) {
    guides.push(AI_RESEARCH_EXPLAINER_GUIDE);
  }

  return guides.join('\n\n');
}

function buildFallbackTranslation(title = '', text = '', targetLanguage = 'Urdu') {
  const content = String(text || '').trim();
  const cleanedTitle = String(title || 'OpenGuideHub').trim();

  if (/urdu/i.test(targetLanguage)) {
    const localized = content
      .replace(/##\s*TL;DR/gi, '## خلاصہ')
      .replace(/##\s*What happened/gi, '## کیا ہوا')
      .replace(/##\s*Key points/gi, '## اہم نکات')
      .replace(/##\s*Why it matters/gi, '## یہ کیوں اہم ہے')
      .replace(/##\s*Free tools and downloads/gi, '## مفت اوپن سورس ٹولز')
      .replace(/##\s*Sources and further reading/gi, '## ذرائع اور مزید مطالعہ');

    return `## اردو مطالعہ\n**عنوان:** ${cleanedTitle}\n\n${localized}\n\nنوٹ: خودکار ترجمہ عارضی طور پر محدود ہے، اس لیے اصل متن برقرار رکھا گیا ہے تاکہ آپ مطالعہ جاری رکھ سکیں۔`.trim();
  }

  if (/arabic/i.test(targetLanguage)) {
    const localized = content
      .replace(/##\s*TL;DR/gi, '## الخلاصة')
      .replace(/##\s*What happened/gi, '## ماذا حدث')
      .replace(/##\s*Key points/gi, '## النقاط الأساسية')
      .replace(/##\s*Why it matters/gi, '## لماذا هذا مهم')
      .replace(/##\s*Free tools and downloads/gi, '## أدوات مفتوحة المصدر مجانية')
      .replace(/##\s*Sources and further reading/gi, '## المصادر والقراءة الإضافية');

    return `## قراءة بالعربية\n**العنوان:** ${cleanedTitle}\n\n${localized}\n\nملاحظة: الترجمة التلقائية محدودة مؤقتاً، لذلك تم الإبقاء على النص الأصلي حتى يتمكن القارئ من المتابعة.`.trim();
  }

  return content;
}

function buildFallbackExplanation(title = '', content = '', question = '') {
  const cleaned = String(content || '').replace(/\s+/g, ' ').trim();
  const parts = cleaned.split(/(?<=[.!?])\s+/).filter(Boolean);
  const preview = parts.slice(0, 2).join(' ');
  const takeaways = parts.slice(2, 6).map((line) => `- ${line}`).join('\n');
  const researchMode = isAiResearchContent(title, content);

  if (researchMode) {
    return `## TL;DR\n${preview || title || 'This AI research article is being prepared.'}\n\n## Research goal\n${parts[1] || 'The paper explores a technical problem and proposes a method to improve results.'}\n\n## Key findings\n${takeaways || '- A clearer research summary will appear here when the model responds.'}\n\n## Why it matters\nThis explanation is simplified so readers can understand the paper without reading every technical detail.`;
  }

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
  const fallbackExcerpt = extractMeaningfulContext([
    ...String(formattedText || '').split(/\n+/),
    ...String(note || '').split(/\n+/),
    title,
  ], title)[0] || cleanEditorialLine(note) || cleanEditorialLine(title) || 'OpenGuideHub article';

  const fallback = {
    category: String(fallbackCategory || 'Technology'),
    excerpt: fallbackExcerpt.slice(0, 220),
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
    const activeGuides = buildActiveGuides({
      title,
      url,
      category: fallbackCategory,
      sourceDomain,
      formattedText: sample,
    });
    const result = await Promise.race([
      generateAiText({
        systemPrompt: `You are the OpenGuideHub analyzer+categorizor agent. Classify the content into exactly one category from: ${DEFAULT_CONTENT_CATEGORIES.join(', ')}. Return strict JSON with keys: category, excerpt, tags. Keep excerpt under 180 characters and tags as an array of 3 to 6 short phrases.\n\nFollow these editorial and content-recognition guides when choosing tags and excerpt quality:\n\n${activeGuides}`,
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

function normalizeKeywordList(items = []) {
  const normalized = [];

  for (const item of items) {
    const clean = cleanEditorialLine(item).slice(0, 48);
    if (!clean || clean.length < 3) {
      continue;
    }
    if (!normalized.some((entry) => entry.toLowerCase() === clean.toLowerCase())) {
      normalized.push(clean);
    }
    if (normalized.length === 8) {
      break;
    }
  }

  return normalized;
}

function pickEditorialAuthor(seed = '') {
  const normalized = String(seed || 'OpenGuideHub');
  const hash = crypto.createHash('sha1').update(normalized).digest('hex');
  return EDITORIAL_AUTHOR_POOL[parseInt(hash.slice(0, 8), 16) % EDITORIAL_AUTHOR_POOL.length];
}

function normalizePublicUrl(value = '') {
  const raw = String(value || '').trim();
  if (!raw) {
    return '';
  }
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw.replace(/^\/+/, '')}`;
}

function cleanEditorialLine(value = '') {
  return String(value || '')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]+)\)/gi, '$1')
    .replace(/https?:\/\/\S+/gi, ' ')
    .replace(/\bwww\.\S+/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\b[a-z0-9.-]+\.(?:com|org|net|io|dev|app|ai|co|me)\b/gi, ' ')
    .replace(/\*\*/g, '')
    .replace(/^[#>*\-\d.\s]+/, '')
    .replace(/^(tl;dr|summary|what happened|what this ai update says|steps to know|risk to know|project snapshot|software snapshot|research goal|context to understand|key points|key findings|why it matters|why it matters for builders|why it matters for safety|why it matters for the community|how it works|limits and caution|continue exploring|sources and further reading|free tools and downloads|category|source report|read full original article here|original source|quick take|key idea|why now|main detail|what to watch)\s*:?\s*/i, '')
    .replace(/\b(tl;dr|rss|type|category|source|source report|original article|read here|read full original article here|read full|read more|original source|continue exploring|quick take|key idea|why now|main detail|what to watch|what this ai update says|steps to know|risk to know|project snapshot|software snapshot|research goal|context to understand|key findings|how it works|limits and caution)\s*:?/gi, ' ')
    .replace(/[\[\]()|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isNonContentLine(value = '') {
  const clean = cleanEditorialLine(value).toLowerCase();
  if (!clean) {
    return true;
  }

  return /^(rss|share|save|translate|english)$/.test(clean)
    || /read this post in any language|ask the article assistant|translate into|explain this (ai research )?article|explain this post/.test(clean)
    || /source context|this archived article was refreshed|this archived post has been reorganized|this article has been reorganized|this article is now available|this topic matters because|this matters for readers because|this matters for builders and researchers because|openguidehub condensed this|brief roundup of the day's top ai stories|free tools and downloads|continue exploring|sources and further reading|read here\b/.test(clean)
    || /more .* (guides|articles) on openguidehub/.test(clean)
    || /original .* article on |original source from|source report/.test(clean);
}

function isWeakSummaryLine(value = '') {
  const clean = cleanEditorialLine(value).toLowerCase();
  if (!clean) {
    return true;
  }
  if (/^(artificial intelligence|technology|science|article|open source|programming)( \1)+$/.test(clean)) {
    return true;
  }
  if (/^(artificial intelligence|technology|science|article|open source|programming)$/.test(clean)) {
    return true;
  }
  const words = clean.split(/\s+/).filter(Boolean);
  const uniqueCount = new Set(words).size;
  return words.length < 5 || uniqueCount <= Math.max(2, Math.floor(words.length / 2));
}

function uniqueLines(items = []) {
  const seen = [];
  const normalized = [];

  items.forEach((item) => {
    const clean = cleanEditorialLine(item);
    const lowered = clean.toLowerCase();
    if (!clean || isNonContentLine(clean) || isWeakSummaryLine(clean)) {
      return;
    }
    if (seen.some((existing) => existing === lowered || existing.includes(lowered) || lowered.includes(existing))) {
      return;
    }
    seen.push(lowered);
    normalized.push(clean);
  });

  return normalized;
}

function sanitizeStructuredMarkdown(content = '', title = '') {
  const titleClean = cleanEditorialLine(title).toLowerCase();
  const seen = new Set();
  const lines = [];
  let previousBlank = true;

  String(content || '')
    .split(/<!--\s*source context\s*-->/i)[0]
    .replace(/\r\n/g, '\n')
    .split('\n')
    .forEach((rawLine) => {
      const line = rawLine.trimEnd();
      const trimmed = line.trim();

      if (!trimmed) {
        if (!previousBlank && lines.length) {
          lines.push('');
        }
        previousBlank = true;
        return;
      }

      previousBlank = false;
      const clean = cleanEditorialLine(trimmed).toLowerCase();

      if (titleClean && clean === titleClean) {
        return;
      }
      if (/^(rss|share|save|translate|english)$/i.test(trimmed)) {
        return;
      }
      if (/read this post in any language|ask the article assistant|translate into|explain this (ai research )?article|explain this post/i.test(clean)) {
        return;
      }

      const dedupeKey = /^#+\s/.test(trimmed) ? `heading:${trimmed.toLowerCase()}` : clean;
      if (dedupeKey && seen.has(dedupeKey)) {
        return;
      }

      seen.add(dedupeKey);
      lines.push(trimmed);
    });

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function hasStructuredMarkdown(content = '') {
  return /##\s*TL;DR/i.test(content)
    && /##\s*(Context to understand|Key points|Key findings|Why it matters|What happened|What this AI update says|Steps to know|Risk to know|Project snapshot|Software snapshot|Research goal)/i.test(content);
}

function extractMeaningfulContext(items = [], title = '') {
  const titleClean = cleanEditorialLine(title).toLowerCase();
  return uniqueLines(items).filter((item) => {
    const clean = cleanEditorialLine(item).toLowerCase();
    return Boolean(clean) && clean.length > 24 && (!titleClean || clean !== titleClean);
  });
}

function toSentenceList(value = '') {
  return String(value || '')
    .split(/(?<=[.!?])\s+|\n+/)
    .map((item) => cleanEditorialLine(item))
    .filter(Boolean);
}

function isTutorialCategory(category = '', title = '', note = '') {
  const sample = `${category} ${title} ${note}`.toLowerCase();
  return /(tutorial|programming|how-to|web development|\bhow to\b|\bhow\b|\binstall\b|\bsetup\b|set up|\bguide\b|step-by-step|running on)/.test(sample);
}

function needsDownloadSection(category = '') {
  return /(artificial intelligence|ai agents|ai tools|tutorial|programming|web development|foss|open source|repo review|technology|article)/.test(String(category || '').toLowerCase());
}

function getDownloadCategorySlug(category = '') {
  const key = String(category || '').toLowerCase();
  if (/(artificial intelligence|ai agents|ai tools)/.test(key)) return 'ai-tools';
  if (/(tutorial|programming|how-to|web development)/.test(key)) return 'programming';
  if (/(cyber|security)/.test(key)) return 'security';
  if (/(foss|open source|repo review)/.test(key)) return 'open-source';
  return 'featured';
}

function buildDownloadLinksMarkdown(category = '', absolute = false) {
  const slug = getDownloadCategorySlug(category);
  const baseUrl = absolute ? `${serviceState.publicSiteUrl}` : '';
  const href = `${baseUrl}/downloads?category=${slug}`;
  const labelMap = {
    'ai-tools': 'Open the AI tools download section',
    'programming': 'Open the programming download section',
    'security': 'Open the security download section',
    'open-source': 'Open the open-source download section',
    featured: 'Open the featured download section',
  };
  return [`- [${labelMap[slug] || 'Open the download section on OpenGuideHub'}](${href})`].join('\n');
}

function getCategoryTemplate(category = '') {
  const key = String(category || '').toLowerCase();

  if (/(science|research|arxiv)/.test(key)) {
    return {
      summaryHeading: 'Research goal',
      whyText: 'This helps readers understand the research in plain language without overstating early results.',
    };
  }

  if (/(artificial intelligence|ai agents|ai tools)/.test(key)) {
    return {
      summaryHeading: 'What this AI update says',
      whyText: 'This helps readers understand what the tool does, where it fits, and what practical benefit it offers.',
    };
  }

  if (isTutorialCategory(category)) {
    return {
      summaryHeading: 'یہ ٹیوٹوریل کس بارے میں ہے',
      whyText: 'یہ حصہ قارئین کو آسان الفاظ میں سمجھاتا ہے کہ یہ گائیڈ کیوں مفید ہے اور عملی طور پر آگے کیا کرنا ہے۔',
    };
  }

  if (/(cyber|security)/.test(key)) {
    return {
      summaryHeading: 'Risk to know',
      whyText: 'This matters for safety-minded readers because it explains the risk, the signal to watch, and the safer next move.',
    };
  }

  if (/(foss|open source|repo review)/.test(key)) {
    return {
      summaryHeading: 'Software snapshot',
      whyText: 'This gives a clearer picture of the software, its use case, and where readers can explore related downloads safely.',
    };
  }

  return {
    summaryHeading: 'What happened',
    whyText: 'This matters for readers because it surfaces the key idea quickly and keeps the original source available for deeper reading.',
  };
}

function extractFocusPhrase(title = '', note = '', category = '') {
  const stopwords = new Set([
    'the', 'and', 'for', 'with', 'this', 'that', 'from', 'into', 'over', 'your', 'about',
    'have', 'has', 'using', 'used', 'guide', 'news', 'update', 'article', 'brief', 'quick',
    'take', 'what', 'why', 'more', 'read', 'full', 'here', 'been', 'than', 'they', 'them',
    'their', 'main', 'next', 'step', 'just', 'when', 'where', 'build', 'built', 'all', 'need',
    'looking', 'collaborators', 'collaboration', 'agnostic',
  ]);
  const genericWords = new Set([
    'useful', 'helpful', 'simple', 'easier', 'easy', 'official', 'example', 'examples',
    'developer', 'developers', 'project', 'projects', 'platform', 'library', 'libraries',
    'tools', 'source', 'sources', 'download', 'downloads', 'free', 'research', 'paper', 'foundational',
  ]);
  const shortTerms = new Set(['ai', 'ml', 'llm', 'api', 'sdk', 'cli', 'gpu', 'cpu', 'ui', 'ux', 'sql', 'rag']);
  const words = [];
  const seen = new Set();

  const collect = (source) => {
    String(source || '')
      .match(/[a-z0-9][a-z0-9+.#-]*/gi)
      ?.forEach((token) => {
        const normalized = token.trim();
        const lowered = normalized.toLowerCase();
        if (!lowered) {
          return;
        }
        if (stopwords.has(lowered) || genericWords.has(lowered)) {
          return;
        }
        if (lowered.length < 4 && !shortTerms.has(lowered)) {
          return;
        }
        if (seen.has(lowered)) {
          return;
        }
        seen.add(lowered);
        if (shortTerms.has(lowered)) {
          words.push(lowered.toUpperCase());
          return;
        }
        words.push(/[A-Z]/.test(normalized) ? normalized : lowered);
      });
  };

  if (/(science|research|arxiv)/i.test(String(category || ''))) {
    const researchTerms = (String(note || title || '').match(/[a-z0-9][a-z0-9+.#-]*/gi) || [])
      .map((token) => token.toLowerCase())
      .filter((token) => !stopwords.has(token) && !genericWords.has(token))
      .filter((token) => ['transformer', 'diffusion', 'reasoning', 'inference', 'attention', 'benchmark', 'alignment'].includes(token));

    if (researchTerms.length) {
      return researchTerms.slice(0, 2).join(' ');
    }
  }

  [title, note, category].forEach((source) => {
    if (words.length < 3) {
      collect(source);
    }
  });

  if (!words.length) {
    return cleanEditorialLine(category || title || 'technology');
  }

  return words.slice(0, 2).join(' ');
}

function highlightPhrase(text = '', phrase = '') {
  if (!text || !phrase) {
    return text;
  }
  const candidates = [phrase, ...phrase.split(/\s+/).filter((part) => part.length >= 4)];

  for (const candidate of candidates) {
    const escaped = candidate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const updated = String(text).replace(new RegExp(`\\b(${escaped})\\b`, 'i'), '==$1==');
    if (updated !== text) {
      return updated;
    }
  }

  return text;
}

function buildStructuredFallbackContent({ title = '', url = '', note = '', formattedText = '', category = 'Article', sourceDomain = '' }) {
  const sourceUrl = normalizePublicUrl(url);
  const sourceLabel = sourceDomain || (sourceUrl ? new URL(sourceUrl).hostname.replace(/^www\./, '') : 'original source');
  const internalLink = `${serviceState.publicSiteUrl}/articles?category=${slugify(category || 'technology')}`;
  const normalizedTitle = cleanEditorialLine(title).toLowerCase();
  const titleLead = normalizedTitle.split(/\s+/).slice(0, 6).join(' ');
  const tutorialMode = isTutorialCategory(category, title, note);
  const scienceMode = /(science|research|arxiv)/i.test(String(category || ''));
  const template = getCategoryTemplate(tutorialMode ? 'Tutorials' : (scienceMode ? 'Science' : category));
  const focusPhrase = extractFocusPhrase(title, note, category);
  const sentences = extractMeaningfulContext([
    ...toSentenceList(formattedText),
    ...toSentenceList(note),
    cleanEditorialLine(title),
  ], title).filter((item) => !titleLead || !item.toLowerCase().includes(titleLead));

  const tldrSource = sentences[0]?.slice(0, 260) || cleanEditorialLine(note) || cleanEditorialLine(title) || 'A concise brief is being prepared for this article.';
  const tldr = highlightPhrase(tldrSource, focusPhrase);
  const overviewLead = tutorialMode
    ? 'یہ گائیڈ موضوع کو آسان اور مرحلہ وار انداز میں سمجھانے کے لیے تیار کی گئی ہے۔'
    : `This section introduces ${focusPhrase || cleanEditorialLine(title) || String(category || 'technology').toLowerCase()} in plain language so the reader can quickly understand the topic.`;
  let overviewText = sentences.slice(1, 3).join(' ') || cleanEditorialLine(note) || '';
  if (!overviewText || cleanEditorialLine(overviewText).toLowerCase() === cleanEditorialLine(tldrSource).toLowerCase()) {
    overviewText = tutorialMode
      ? `یہ خلاصہ ${focusPhrase || 'موضوع'} کے بنیادی مقصد، استعمال، اور اگلے قدم کو مختصر انداز میں پیش کرتا ہے۔`
      : `The update focuses on ${focusPhrase || cleanEditorialLine(title) || 'this topic'} and gives useful context about what it is, where it fits, and why readers may care.`;
  }
  const overviewDetail = highlightPhrase(overviewText, focusPhrase);
  const labels = tutorialMode
    ? ['پہلا نکتہ', 'اگلا مرحلہ', 'اہم تفصیل', 'نوٹ']
    : ['Key idea', 'Why now', 'Main detail', 'What to watch'];
  const bullets = sentences.slice(0, 4).map((line, index) => `- **${labels[index] || 'Note'}:** ${line.slice(0, 180)}`).join('\n');
  const sourceLinks = [
    `- [More ${focusPhrase || category || 'technology'} guides on OpenGuideHub](${internalLink})`,
    sourceUrl ? `- [Original ${sourceLabel} article on ${focusPhrase || 'this topic'}](${sourceUrl})` : `- Source report: ${sourceLabel}`,
  ].filter(Boolean).join('\n');

  if (tutorialMode) {
    return `## TL;DR\n**Quick take:** ${tldr}\n\n## ${template.summaryHeading}\n${overviewLead}\n\n${overviewDetail}\n\n## مرحلہ وار رہنمائی\n1. پہلے موضوع یا ٹول کا مقصد سمجھیں۔\n2. پھر بنیادی مراحل ایک ایک کر کے فالو کریں اور اہم پوائنٹس نوٹ کریں۔\n3. آخر میں متعلقہ ڈاؤن لوڈ سیکشن اور اصل سورس سے اگلا قدم لیں۔\n\n## اہم نکات\n${bullets || '- **خلاصہ:** یہ ٹیوٹوریل اب زیادہ واضح انداز میں پیش کیا گیا ہے۔'}\n\n## یہ کیوں اہم ہے\n${template.whyText}\n\n## ڈاؤن لوڈ سیکشن\n${buildDownloadLinksMarkdown(category)}\n\n## ماخذ اور مزید مطالعہ\n${sourceLinks}`.trim();
  }

  if (scienceMode) {
    return `## TL;DR\n**Quick take:** ${tldr}\n\n## ${template.summaryHeading}\n${overviewLead}\n\n${overviewDetail}\n\n## Context to understand\nThis gives readers a clearer explanation of ${focusPhrase || cleanEditorialLine(title) || 'the research topic'}, including the problem being explored and the practical idea behind the work.\n\n## Key findings\n${bullets || '- **Summary:** This research brief keeps the main takeaway readable for non-specialist readers.'}\n\n## Why it matters\n${template.whyText}\n\n## Limits and caution\nResearch summaries should be read with care, especially when the source is an early paper or preprint.\n\n## Sources and further reading\n${sourceLinks}`.trim();
  }

  const downloadSection = needsDownloadSection(category)
    ? `\n\n## Download section\n${buildDownloadLinksMarkdown(category)}`
    : '';

  return `## TL;DR\n**Quick take:** ${tldr}\n\n## ${template.summaryHeading}\n${overviewLead}\n\n${overviewDetail}\n\n## Context to understand\nThis gives readers a clearer explanation of ${focusPhrase || cleanEditorialLine(title) || 'the topic'}, including what it is, who it may help, and the practical angle behind the update.\n\n## Key points\n${bullets || '- **Summary:** The article now focuses on the main takeaway and useful context for readers.'}\n\n## Why it matters\n${template.whyText}${downloadSection}\n\n## Sources and further reading\n${sourceLinks}`.trim();
}

async function buildPublishedArticleContent({ title = '', url = '', note = '', formattedText = '', category = 'ARTICLE', sourceDomain = '' }) {
  const sourceUrl = normalizePublicUrl(url);
  const sourceLine = sourceUrl ? `Original source: ${sourceUrl}` : 'No external backlink available.';
  const internalLink = `${serviceState.publicSiteUrl}/articles?category=${slugify(category || 'technology')}`;
  const rawFormattedText = String(formattedText || '');
  const activeGuides = buildActiveGuides({ title, url: sourceUrl, category, sourceDomain, formattedText: rawFormattedText });
  const sanitizedFormattedText = sanitizeStructuredMarkdown(rawFormattedText, title);
  const baseText = extractMeaningfulContext([
    ...rawFormattedText.split(/\n+/),
    ...String(note || '').split(/\n+/),
  ], title).join('\n').trim();
  const fallback = hasStructuredMarkdown(sanitizedFormattedText) && extractMeaningfulContext(rawFormattedText.split(/\n+/), title).length >= 2
    ? sanitizedFormattedText
    : buildStructuredFallbackContent({ title, url: sourceUrl, note, formattedText: `${sanitizedFormattedText}\n${baseText}`.trim(), category, sourceDomain });
  const rewriteSource = baseText || sanitizedFormattedText;

  if (!serviceState.aiRewriteOnPublish || !rewriteSource) {
    return fallback;
  }

  if (rewriteSource.length > 7000) {
    return fallback;
  }

  try {
    const result = await Promise.race([
      generateAiText({
        systemPrompt: `You are the OpenGuideHub editorial formatter agent. Follow this exact publishing stack of guides:\n\n${activeGuides}`,
        userPrompt: `Create a polished article from this source material.\n\nTitle: ${title}\nCategory: ${category}\nSource domain: ${sourceDomain || 'N/A'}\nInternal reading link: ${internalLink}\nExternal source line: ${sourceLine}\n\nRules:\n- choose the best category boilerplate\n- output only Markdown\n- use clear paragraph spacing under each heading\n- make the writing detailed, human-readable, and easy to understand\n- do not repeat the title or the same sentence across sections\n- keep hyperlinks wrapped in readable anchor text and never leave naked URLs in the body\n- never place direct software download URLs inside the article body; use an internal Download section linking to /downloads?category=<category-slug> instead\n- for Tutorials or Programming posts, write the main body in simple Urdu while keeping technical terms in English when needed\n- if the source is a repository or release page, explain what the project does, who it helps, and any install or release cues only when the source supports them\n- if the source is research or arXiv-like, explain the problem in plain language and note when it should be treated as early or preprint work\n- use clear tutorial sections when the post is a how-to guide\n- use 2 to 4 ==highlighted phrases== for the most important terms\n- strengthen SEO naturally with heading language, source-aware anchor text, and keyword variations from the title\n- bold important words and ideas\n\nSource material:\n${rewriteSource}`,
        temperature: 0.3,
        maxTokens: 900,
        model: serviceState.ollamaRewriterModel,
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('AI rewrite timeout')), 9000)),
    ]);

    const rewritten = String(result.content || '').trim();
    return rewritten.includes('## TL;DR') ? rewritten : fallback;
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

function wrapCoverTitleLines(value = '', maxLineLength = 28, maxLines = 3) {
  const words = String(value || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxLineLength || !current) {
      current = next;
      continue;
    }

    lines.push(current);
    current = word;

    if (lines.length === maxLines - 1) {
      break;
    }
  }

  if (current) {
    const remainder = words.slice(lines.join(' ').split(/\s+/).filter(Boolean).length).join(' ');
    const finalLine = remainder ? `${current}…` : current;
    lines.push(finalLine);
  }

  return lines.slice(0, maxLines);
}

function createGeneratedCover(title = 'OpenGuideHub', category = 'Technology') {
  const safeTitle = sanitizeCoverText(title, 90);
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
  const titleLines = wrapCoverTitleLines(safeTitle, 30, 3);
  const titleY = 210;
  const titleTspans = titleLines.map((line, index) => `<tspan x="80" dy="${index === 0 ? 0 : 62}">${line}</tspan>`).join('');
  const categoryY = titleY + (titleLines.length * 62) + 28;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="${bg1}"/><stop offset="100%" stop-color="${bg2}"/></linearGradient></defs><rect width="1200" height="630" fill="url(#g)" rx="36"/><circle cx="1040" cy="120" r="90" fill="rgba(255,255,255,0.08)"/><circle cx="160" cy="520" r="120" fill="rgba(255,255,255,0.06)"/><text x="80" y="140" fill="#cbd5e1" font-size="28" font-family="Arial, Helvetica, sans-serif">OpenGuideHub</text><text x="80" y="${titleY}" fill="#ffffff" font-size="54" font-weight="700" font-family="Arial, Helvetica, sans-serif">${titleTspans}</text><text x="80" y="${categoryY}" fill="#e2e8f0" font-size="30" font-family="Arial, Helvetica, sans-serif">${safeCategory}</text></svg>`;
  try {
    return `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`;
  } catch {
    return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjAwIiBoZWlnaHQ9IjYzMCI+PHJlY3Qgd2lkdGg9IjEyMDAiIGhlaWdodD0iNjMwIiBmaWxsPSIjMGYxNzJhIi8+PHRleHQgeD0iNzAiIHk9IjE0MCIgZmlsbD0iI2ZmZiIgZm9udC1zaXplPSI1MiI+T3Blbkd1aWRlSHViPC90ZXh0Pjwvc3ZnPg==';
  }
}

function stripInlineFormatting(value = '') {
  return String(value || '')
    .replace(/==([^=]+)==/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]+)\)/gi, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function mapPublicPost(post, { includeContent = true } = {}) {
  const content = String(post.content || '');
  const safeExcerpt = stripInlineFormatting(post.excerpt || '');
  const previewContent = includeContent ? content : safeExcerpt;
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: safeExcerpt,
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
    take: 36,
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
      seo_keywords = [],
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
    const mergedTags = normalizeKeywordList([
      ...metadata.tags,
      ...(Array.isArray(seo_keywords) ? seo_keywords : String(seo_keywords || '').split(',')),
      metadata.category,
      source_domain,
    ]);

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
        tags: mergedTags.join(','),
      },
      create: {
        slug,
        title: normalizedTitle,
        excerpt: String(metadata.excerpt || source_excerpt || note || '').trim().slice(0, 500) || null,
        content: normalizedContent,
        status: 'published',
        author: selectedAuthor,
        category: metadata.category,
        tags: mergedTags.join(','),
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
    ollamaModel: serviceState.ollamaModel,
    hermesModel: serviceState.ollamaHermesModel,
    openRouterConfigured: Boolean(serviceState.openRouterApiKey),
    openRouterModel: serviceState.openRouterModel,
    openRouterResearchModel: serviceState.openRouterResearchModel,
    openRouterTranslateModel: serviceState.openRouterTranslateModel,
    openRouterFallbackModel: serviceState.openRouterFallbackModel,
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
    const translationGuides = [
      PUBLISHING_STANDARD_GUIDE,
      MULTILINGUAL_READER_GUIDE,
      ARTICLE_QUALITY_VALIDATOR_GUIDE,
    ].join('\n\n');
    const result = await Promise.race([
      generateAiText({
        systemPrompt: `You are a precise multilingual translator for OpenGuideHub. Follow these guides:\n\n${translationGuides}\n\nTranslate the provided website or article text into ${targetLanguage} using natural, reader-friendly language. Preserve headings, bullets, links, and structure. When translating into Urdu or Arabic, use fluent right-to-left friendly phrasing. Do not add commentary or extra notes.`,
        userPrompt: `Title: ${title}\n\nContent:\n${normalizedText}`,
        temperature: 0.2,
        maxTokens: 2200,
        model: serviceState.openRouterTranslateModel,
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('AI translation timeout')), 10000)),
    ]);

    const translatedContent = String(result.content || '').trim();
    const looksTruncated = (
      (normalizedText.length > 400 && translatedContent.length < 160) ||
      (normalizedText.length > 1200 && translatedContent.length < normalizedText.length * 0.3)
    );

    if (looksTruncated) {
      return res.json({
        ok: true,
        provider: 'local-fallback',
        targetLanguage,
        content: buildFallbackTranslation(title, normalizedText, targetLanguage),
        warning: 'AI translation returned partial content, so the full reading fallback was used.',
      });
    }

    return res.json({
      ok: true,
      provider: result.provider,
      targetLanguage,
      content: translatedContent,
    });
  } catch (error) {
    log('warn', 'AI translation fallback used', { error: error.message, targetLanguage });
    return res.json({
      ok: true,
      provider: 'local-fallback',
      targetLanguage,
      content: buildFallbackTranslation(title, normalizedText, targetLanguage),
      warning: error.message,
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
    const researchMode = isAiResearchContent(title, normalizedContent);
    const repoMode = isRepoLikeContent({ title, formattedText: normalizedContent });
    const systemPrompt = researchMode
      ? `You are the OpenGuideHub AI research explainer. Answer in ${language}. Follow these guides exactly:\n\n${PUBLISHING_STANDARD_GUIDE}\n\n${AI_RESEARCH_EXPLAINER_GUIDE}\n\n${ARTICLE_QUALITY_VALIDATOR_GUIDE}`
      : repoMode
        ? `You are the OpenGuideHub repository explainer. Answer in ${language}. Use only the provided article context. Explain what the project is, what problem it solves, how the workflow works, who it helps, and why it matters. Follow these guides:\n\n${PUBLISHING_STANDARD_GUIDE}\n\n${GITHUB_REPO_REVIEW_GUIDE}\n\n${ARTICLE_QUALITY_VALIDATOR_GUIDE}`
        : `You are the OpenGuideHub reading assistant. Answer clearly in ${language}. Use only the provided article context, explain difficult ideas simply, and avoid making up facts. Prefer a short TL;DR first, then 3 key takeaways. Follow these guides:\n\n${PUBLISHING_STANDARD_GUIDE}\n\n${ARTICLE_QUALITY_VALIDATOR_GUIDE}`;

    const readerPrompt = researchMode
      ? (question || 'Explain this AI or arXiv article in simple language: what problem it solves, how it works, the key result, and why it matters.')
      : (question || 'Give me a simple explanation and key takeaways.');

    const result = await Promise.race([
      generateAiText({
        systemPrompt,
        userPrompt: `Article title: ${title}\n\nReader question: ${readerPrompt}\n\nArticle content:\n${normalizedContent}`,
        temperature: 0.3,
        maxTokens: researchMode ? 180 : 220,
        model: researchMode ? serviceState.openRouterResearchModel : serviceState.openRouterModel,
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

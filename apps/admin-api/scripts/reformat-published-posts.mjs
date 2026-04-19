import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const SITE_URL = process.env.PUBLIC_SITE_URL || 'https://openguidehub.org';

function slugify(value = '') {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'technology';
}

function normalizePublicUrl(value = '') {
  const raw = String(value || '').trim();
  if (!raw) return '';
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw.replace(/^\/+/, '')}`;
}

function cleanLine(value = '') {
  return String(value || '')
    .replace(/https?:\/\/\S+/gi, ' ')
    .replace(/\bwww\.\S+/gi, ' ')
    .replace(/^#+\s*/, '')
    .replace(/^[>*\-\d.\s]+/, '')
    .replace(/^(tl;dr|summary|what happened|key points|why it matters|continue exploring|sources and further reading|category|source report|read full original article here|original source)\s*:?\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function uniqueLines(items = []) {
  const seen = [];
  return items.filter((item) => {
    const clean = cleanLine(item).toLowerCase();
    if (!clean) return false;
    if (/this archived article was refreshed|this topic matters because|more .* articles on openguidehub|original source from/.test(clean)) return false;
    if (seen.some((existing) => existing === clean || existing.includes(clean) || clean.includes(existing))) return false;
    seen.push(clean);
    return true;
  });
}

function toSentenceList(value = '') {
  return String(value || '')
    .split(/(?<=[.!?])\s+|\n+/)
    .map((item) => cleanLine(item))
    .filter(Boolean);
}

function extractSourceUrl(text = '') {
  const matches = String(text || '').match(/https?:\/\/[^\s)]+/gi) || [];
  const external = matches.find((url) => !/openguidehub\.org/i.test(url));
  return external ? normalizePublicUrl(external) : '';
}

function buildCleanContent(post) {
  const title = cleanLine(post.title || 'OpenGuideHub article');
  const category = cleanLine(post.category || 'Technology') || 'Technology';
  const sourceUrl = extractSourceUrl(post.content || '');
  const sourceLabel = sourceUrl ? new URL(sourceUrl).hostname.replace(/^www\./, '') : 'OpenGuideHub archive';
  const internalLink = `${SITE_URL}/articles?category=${slugify(category)}`;
  const titleLead = title.toLowerCase().split(/\s+/).slice(0, 6).join(' ');
  const sentences = uniqueLines([
    ...toSentenceList(post.excerpt || ''),
    ...toSentenceList(post.content || ''),
    title,
  ]).filter((item) => item.length > 20 && (!titleLead || !item.toLowerCase().includes(titleLead)));

  const tldr = (sentences[0] || title || 'A short summary is being prepared.').slice(0, 260);
  const overview = (sentences.slice(1, 3).join(' ') || 'This archived post has been reorganized into a clean editorial brief for easier reading.').slice(0, 420);
  const bullets = sentences.slice(0, 4).map((line) => `- ${line.slice(0, 180)}`).join('\n');
  const sources = [
    `- [More ${category} articles on OpenGuideHub](${internalLink})`,
    sourceUrl ? `- [Original source from ${sourceLabel}](${sourceUrl})` : `- Source report: ${sourceLabel}`,
  ].join('\n');

  return {
    title,
    excerpt: tldr.slice(0, 220),
    content: `## TL;DR\n${tldr}\n\n## What happened\n${overview}\n\n## Key points\n${bullets || '- This article is now available in a cleaner, easier-to-read structure.'}\n\n## Why it matters\nThis archived article was refreshed so readers can understand the main idea quickly and continue exploring in their own language.\n\n## Sources and further reading\n${sources}`.trim(),
  };
}

async function main() {
  const posts = await prisma.post.findMany({
    where: { status: 'published' },
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      content: true,
      category: true,
    },
  });

  let updated = 0;

  for (const post of posts) {
    const next = buildCleanContent(post);
    if (next.content !== String(post.content || '').trim() || next.excerpt !== String(post.excerpt || '').trim() || next.title !== String(post.title || '').trim()) {
      await prisma.post.update({
        where: { id: post.id },
        data: {
          title: next.title,
          excerpt: next.excerpt,
          content: next.content,
        },
      });
      updated += 1;
    }
  }

  const sample = await prisma.post.findFirst({
    where: { status: 'published' },
    orderBy: { updatedAt: 'desc' },
    select: { slug: true, title: true, content: true },
  });

  console.log(`UPDATED_POSTS ${updated}`);
  if (sample) {
    console.log(`SAMPLE_SLUG ${sample.slug}`);
    console.log(sample.content.split('\n').slice(0, 16).join('\n'));
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

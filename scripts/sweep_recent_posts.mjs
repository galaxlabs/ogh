import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const limitArg = process.argv.find((arg) => arg.startsWith('--limit='));
const limit = Number(limitArg?.split('=')[1] || 25);

function cleanText(value = '') {
  return String(value || '')
    .replace(/==([^=]+)==/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]+)\)/gi, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(value = '') {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function isTutorialCategory(category = '', title = '') {
  return /(tutorial|programming|how-to|web development|\bhow to\b|\bhow\b|\binstall\b|\bsetup\b|set up|\bguide\b|step-by-step|running on)/i.test(`${category} ${title}`);
}

function needsDownloadSection(category = '') {
  return /(artificial intelligence|ai agents|ai tools|tutorial|programming|web development|foss|open source|repo review|technology)/i.test(String(category || ''));
}

function getDownloadCategorySlug(category = '') {
  const key = String(category || '').toLowerCase();
  if (/(artificial intelligence|ai agents|ai tools)/.test(key)) return 'ai-tools';
  if (/(tutorial|programming|how-to|web development)/.test(key)) return 'programming';
  if (/(cyber|security)/.test(key)) return 'security';
  if (/(foss|open source|repo review)/.test(key)) return 'open-source';
  return 'featured';
}

function findSourceUrl(content = '') {
  const matches = String(content || '').match(/https?:\/\/[^\s)]+/g) || [];
  return matches[matches.length - 1] || '';
}

function needsSweep(post) {
  const body = String(post.content || '');
  const excerpt = String(post.excerpt || '');
  return /RSS:|Free tools and downloads|source context|Original source from|More .* guides on OpenGuideHub|Original .* article on/i.test(body)
    || /==|\*\*/.test(excerpt)
    || body.split(/\s+/).filter(Boolean).length < 110;
}

function buildContent(post) {
  const title = cleanText(post.title || 'OpenGuideHub post');
  const excerpt = cleanText(post.excerpt || '');
  const category = cleanText(post.category || 'Technology');
  const sourceUrl = findSourceUrl(post.content || '');
  const downloadLink = `/downloads?category=${getDownloadCategorySlug(category)}`;
  const quickTake = excerpt && excerpt.toLowerCase() !== title.toLowerCase()
    ? excerpt
    : `This post explains ${title} in a clearer and more useful way for readers.`;

  if (isTutorialCategory(category, title)) {
    return `## TL;DR\n**Quick take:** ${quickTake}\n\n## یہ ٹیوٹوریل کس بارے میں ہے\nیہ گائیڈ ${title} کو آسان زبان اور واضح انداز میں سمجھانے کے لیے ترتیب دی گئی ہے۔\n\n## مرحلہ وار رہنمائی\n1. پہلے مقصد اور استعمال کو سمجھیں۔\n2. پھر ضروری مرحلے ترتیب سے فالو کریں۔\n3. آخر میں نتیجہ چیک کریں اور متعلقہ ڈاؤن لوڈ سیکشن دیکھیں۔\n\n## اہم نکات\n- **پہلا نکتہ:** ${quickTake}\n- **اگلا مرحلہ:** اصل مثال یا سورس کو دیکھ کر عمل مکمل کریں۔\n\n## یہ کیوں اہم ہے\nیہ ٹیوٹوریل نئے اور درمیانی درجے کے قارئین کے لیے زیادہ واضح اور عملی رہنمائی فراہم کرتی ہے۔\n\n## ڈاؤن لوڈ سیکشن\n- [Browse programming downloads](${downloadLink})\n\n## ماخذ اور مزید مطالعہ\n${sourceUrl ? `- [Original source article](${sourceUrl})` : '- Source link not available.'}`.trim();
  }

  const sections = [
    '## TL;DR',
    `**Quick take:** ${quickTake}`,
    '',
    '## What this update says',
    `${title} has been rewritten into a clearer summary so readers can understand the main point quickly.`,
    '',
    '## Key points',
    `- **Main idea:** ${quickTake}`,
    '- **Reader value:** The article now focuses on the useful takeaway instead of filler text.',
    '',
    '## Why it matters',
    'This version is easier to scan, easier to understand, and more useful for readers who want the point quickly.',
  ];

  if (needsDownloadSection(category)) {
    sections.push('', '## Download section', `- [Browse ${category} downloads](${downloadLink})`);
  }

  sections.push('', '## Sources and further reading', sourceUrl ? `- [Original source article](${sourceUrl})` : '- Source link not available.');
  return sections.join('\n').trim();
}

async function main() {
  const posts = await prisma.post.findMany({
    where: { status: 'published' },
    orderBy: { updatedAt: 'desc' },
    take: limit,
  });

  let updated = 0;
  for (const post of posts) {
    if (!needsSweep(post)) continue;

    const cleanExcerpt = cleanText(post.excerpt || post.title || '').slice(0, 240);
    const content = buildContent(post);

    await prisma.post.update({
      where: { id: post.id },
      data: {
        excerpt: cleanExcerpt,
        content,
        updatedAt: new Date(),
      },
    });

    updated += 1;
    console.log(`updated: ${post.slug}`);
  }

  console.log(JSON.stringify({ scanned: posts.length, updated }, null, 2));
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});

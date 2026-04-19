import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const limitArg = process.argv.find((arg) => arg.startsWith('--limit='));
const limit = Number(limitArg?.split('=')[1] || 25);
const force = process.argv.includes('--force');

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

function topicLabel(title = '') {
  const clean = cleanText(title || '');
  if (!clean) return 'this topic';
  if (/\b(how|install|setup|set up|guide|running on)\b/i.test(clean)) {
    return clean.split(':')[0].trim();
  }
  if (clean.includes(':')) {
    return clean.split(':').slice(1).join(':').trim() || clean.split(':')[0].trim();
  }
  return clean.split(' - ')[0].trim();
}

function isTutorialCategory(category = '', title = '') {
  return /(tutorial|programming|how-to|web development|\bhow to\b|\bhow\b|\binstall\b|\bsetup\b|set up|\bguide\b|step-by-step|running on)/i.test(`${category} ${title}`);
}

function needsDownloadSection(category = '') {
  return /(artificial intelligence|ai agents|ai tools|tutorial|programming|web development|foss|open source|repo review|technology|article)/i.test(String(category || ''));
}

function getDownloadCategorySlug(category = '') {
  const key = String(category || '').toLowerCase();
  if (/(artificial intelligence|ai agents|ai tools)/.test(key)) return 'ai-tools';
  if (/(tutorial|programming|how-to|web development)/.test(key)) return 'programming';
  if (/(cyber|security)/.test(key)) return 'security';
  if (/(foss|open source|repo review)/.test(key)) return 'open-source';
  return 'featured';
}

function downloadSectionLabel(category = '') {
  const slug = getDownloadCategorySlug(category);
  const labels = {
    'ai-tools': 'Open the AI tools download section',
    'programming': 'Open the programming download section',
    'security': 'Open the security download section',
    'open-source': 'Open the open-source download section',
    featured: 'Open the featured download section',
  };
  return labels[slug] || 'Open the download section';
}

function findSourceUrl(content = '') {
  const matches = String(content || '').match(/https?:\/\/[^\s)]+/g) || [];
  return matches[matches.length - 1] || '';
}

function needsSweep(post) {
  if (force) return true;
  const body = String(post.content || '');
  const excerpt = String(post.excerpt || '');
  return /RSS:|Free tools and downloads|source context|Original source from|More .* guides on OpenGuideHub|Original .* article on|has been rewritten into a clearer summary|this post explains/i.test(body)
    || /==|\*\*/.test(excerpt)
    || body.split(/\s+/).filter(Boolean).length < 140;
}

function buildContextLine(title = '', category = '') {
  const sample = `${title} ${category}`.toLowerCase();
  const topic = topicLabel(title);

  if (isTutorialCategory(category, title)) {
    return `یہ گائیڈ ${topic} کے بنیادی مقصد، ضروری مرحلوں، اور عملی نتیجے کو آسان انداز میں واضح کرتی ہے تاکہ قاری الجھن کے بغیر موضوع سمجھ سکے۔`;
  }
  if (/looking for collaborators|collaborators/i.test(sample)) {
    return `This post is essentially a collaboration call around ${topic}. It is most relevant to developers who care about flexible editor-based AI tooling and want to help shape the project.`;
  }
  if (/launch|launches|released|release/i.test(sample)) {
    return `The story centers on ${topic} as a newly announced or newly highlighted development, with a practical focus on where it may fit in real-world work.`;
  }
  if (/prompts?/i.test(sample)) {
    return `This article is about prompt ideas and applied usage around ${topic}, with an emphasis on practical day-to-day benefit.`;
  }
  if (/(artificial intelligence|ai agents|ai tools)/i.test(sample)) {
    return `This update helps readers understand ${topic}, including what the tool, model, or workflow does in practice and why people are paying attention to it.`;
  }
  if (/(cyber|security)/i.test(sample)) {
    return `This article gives context around ${topic}, including what readers should notice and why the issue is important.`;
  }
  if (/(foss|open source|repo review)/i.test(sample)) {
    return `This post gives a clearer snapshot of ${topic}, helping readers understand the software or project and its likely audience.`;
  }
  return `This article gives readers the background needed to understand ${topic} in clear and direct language.`;
}

function buildWhyItMatters(category = '', title = '') {
  const sample = `${title} ${category}`.toLowerCase();

  if (isTutorialCategory(category, title)) {
    return 'یہ گائیڈ خاص طور پر ان قارئین کے لیے مفید ہے جو مرحلہ وار انداز میں سیکھنا چاہتے ہیں اور عملی نتیجہ جلد حاصل کرنا چاہتے ہیں۔';
  }
  if (/(artificial intelligence|ai agents|ai tools)/i.test(sample)) {
    return 'This matters because it helps builders, teams, and curious readers understand the practical value of the AI update instead of only seeing the headline.';
  }
  if (/(cyber|security)/i.test(sample)) {
    return 'This matters because readers need a clear explanation of the risk, the likely impact, and the safer next move.';
  }
  if (/(foss|open source|repo review)/i.test(sample)) {
    return 'This matters because open-source readers usually need quick clarity about purpose, usefulness, and where the project fits.';
  }
  return 'This matters because a clearer explanation helps readers understand the topic faster and decide whether they want to explore it further.';
}

function buildContent(post) {
  const title = cleanText(post.title || 'OpenGuideHub post');
  const excerpt = cleanText(post.excerpt || '');
  const category = cleanText(post.category || 'Technology');
  const effectiveCategory = isTutorialCategory(category, title) ? 'Programming' : category;
  const sourceUrl = findSourceUrl(post.content || '');
  const downloadLink = `/downloads?category=${getDownloadCategorySlug(effectiveCategory)}`;
  const topic = topicLabel(title);
  const quickTake = excerpt && excerpt.toLowerCase() !== title.toLowerCase()
    ? excerpt
    : isTutorialCategory(category, title)
      ? `یہ گائیڈ ${topic} کو آسان اور قابلِ عمل انداز میں سمجھاتی ہے۔`
      : /(artificial intelligence|ai agents|ai tools)/i.test(category)
        ? /launch|launches|released|release/i.test(title)
          ? `A practical look at ${topic} and why it may matter for real-world AI deployment.`
          : `A practical update about ${topic}, with a focus on what it does and why it matters for real-world use.`
        : /looking for collaborators|collaborators/i.test(title)
          ? `A collaboration call built around ${topic}, aimed at developers interested in the project.`
          : `A clear and readable explanation of ${topic} for readers who want the main idea quickly.`;
  const contextLine = buildContextLine(title, category);
  const whyItMatters = buildWhyItMatters(category, title);

  if (isTutorialCategory(category, title)) {
    return `## TL;DR\n**Quick take:** ${quickTake}\n\n## یہ ٹیوٹوریل کس بارے میں ہے\n${contextLine}\n\n## مرحلہ وار رہنمائی\n1. پہلے موضوع اور مقصد کو سمجھیں۔\n2. پھر ضروری مراحل ترتیب سے فالو کریں اور اہم کمانڈز یا نکات نوٹ کریں۔\n3. آخر میں نتیجہ چیک کریں اور متعلقہ ڈاؤن لوڈ سیکشن سے اگلا قدم لیں۔\n\n## اہم نکات\n- **پہلا نکتہ:** ${quickTake}\n- **اگلا مرحلہ:** یہ گائیڈ عملی انداز میں آگے بڑھنے میں مدد دیتی ہے۔\n- **مزید سمجھ:** اصل سورس کے ذریعے تفصیل دیکھی جا سکتی ہے۔\n\n## یہ کیوں اہم ہے\n${whyItMatters}\n\n## ڈاؤن لوڈ سیکشن\n- [Open the programming download section](${downloadLink})\n\n## ماخذ اور مزید مطالعہ\n${sourceUrl ? `- [Original source article](${sourceUrl})` : '- Source link not available.'}`.trim();
  }

  const sectionTitle = /(artificial intelligence|ai agents|ai tools)/i.test(category)
    ? 'What this AI update says'
    : /(foss|open source|repo review)/i.test(category)
      ? 'Software snapshot'
      : /(cyber|security)/i.test(category)
        ? 'Risk to know'
        : 'What this update says';

  const sections = [
    '## TL;DR',
    `**Quick take:** ${quickTake}`,
    '',
    `## ${sectionTitle}`,
    contextLine,
    '',
    '## Context to understand',
    `For readers new to the topic, the core value here is understanding what ${topic} refers to, where it fits, and why the update is useful or relevant now.`,
    '',
    '## Key points',
    `- **Main idea:** ${quickTake}`,
    `- **Context:** ${contextLine}`,
    `- **Reader value:** This helps readers decide whether ${topic} is relevant to their own work or interests.`,
    '',
    '## Why it matters',
    whyItMatters,
  ];

  if (needsDownloadSection(category)) {
    sections.push('', '## Download section', `- [${downloadSectionLabel(effectiveCategory)}](${downloadLink})`);
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

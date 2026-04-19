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
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]+)\)/gi, '$1')
    .replace(/https?:\/\/\S+/gi, ' ')
    .replace(/\bwww\.\S+/gi, ' ')
    .replace(/\b[a-z0-9.-]+\.(?:com|org|net|io|dev|app|ai|co|me)\b/gi, ' ')
    .replace(/\*\*/g, '')
    .replace(/^#+\s*/, '')
    .replace(/^[>*\-\d.\s]+/, '')
    .replace(/^(tl;dr|summary|what happened|what this ai update says|steps to know|risk to know|project snapshot|key points|why it matters|continue exploring|sources and further reading|free tools and downloads|category|source report|read full original article here|original source|quick take|key idea|why now|main detail|what to watch)\s*:?\s*/i, '')
    .replace(/\b(tl;dr|rss|type|category|source|source report|original article|read here|read full original article here|read full|read more|original source|continue exploring|quick take|key idea|why now|main detail|what to watch|what this ai update says|steps to know|risk to know|project snapshot)\s*:?/gi, ' ')
    .replace(/[\[\]()|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isWeakSummaryLine(value = '') {
  const clean = cleanLine(value).toLowerCase();
  if (!clean) return true;
  if (/^(artificial intelligence|technology|science|article|open source|programming)( \1)+$/.test(clean)) return true;
  if (/^(artificial intelligence|technology|science|article|open source|programming)$/.test(clean)) return true;
  const words = clean.split(/\s+/).filter(Boolean);
  const uniqueCount = new Set(words).size;
  return words.length < 5 || uniqueCount <= Math.max(2, Math.floor(words.length / 2));
}

function uniqueLines(items = []) {
  const seen = [];
  return items.filter((item) => {
    const clean = cleanLine(item).toLowerCase();
    if (!clean) return false;
    if (/this archived article was refreshed|this archived post has been reorganized|this article has been reorganized|this article is now available|this topic matters because|this matters for readers because|this matters for builders and researchers because|openguidehub condensed this|brief roundup of the day's top ai stories|free tools and downloads|more .* articles on openguidehub|original source from|rss\b|source report|original article|read full original article here|read here\b|^artificial intelligence$/.test(clean) || isWeakSummaryLine(clean)) return false;
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

function getCategoryTemplate(category = '') {
  const key = String(category || '').toLowerCase();

  if (/(artificial intelligence|ai agents|ai tools)/.test(key)) {
    return {
      summaryHeading: 'What this AI update says',
      whyText: 'This matters for builders and researchers because it highlights the main model idea, trade-offs, and next practical step quickly.',
      tools: [
        { label: 'Ollama download', url: 'https://ollama.com/download' },
        { label: 'Open WebUI project', url: 'https://github.com/open-webui/open-webui' },
        { label: 'JupyterLab', url: 'https://jupyter.org/install' },
      ],
    };
  }

  if (/(tutorial|programming|how-to|web development)/.test(key)) {
    return {
      summaryHeading: 'Steps to know',
      whyText: 'This helps learners move from theory to practice faster with a clearer step-by-step reading flow.',
      tools: [
        { label: 'Visual Studio Code', url: 'https://code.visualstudio.com/Download' },
        { label: 'Git downloads', url: 'https://git-scm.com/downloads' },
        { label: 'Node.js', url: 'https://nodejs.org/en/download' },
      ],
    };
  }

  if (/(cyber|security)/.test(key)) {
    return {
      summaryHeading: 'Risk to know',
      whyText: 'This matters for safety-minded readers because it explains the risk, the signal to watch, and the safer next move.',
      tools: [
        { label: 'Wireshark', url: 'https://www.wireshark.org/download.html' },
        { label: 'KeePassXC', url: 'https://keepassxc.org/download/' },
        { label: 'ClamAV', url: 'https://www.clamav.net/downloads' },
      ],
    };
  }

  if (/(foss|open source|repo review)/.test(key)) {
    return {
      summaryHeading: 'Project snapshot',
      whyText: 'This matters for the open-source community because it highlights practical value, adoption signals, and where to explore next.',
      tools: [
        { label: 'GitHub Desktop', url: 'https://desktop.github.com/download/' },
        { label: 'LibreOffice', url: 'https://www.libreoffice.org/download/download-libreoffice/' },
        { label: 'GIMP', url: 'https://www.gimp.org/downloads/' },
      ],
    };
  }

  return {
    summaryHeading: 'What happened',
    whyText: 'This matters for readers because it surfaces the key idea quickly and keeps the original source available for deeper reading.',
    tools: [
      { label: 'Firefox browser', url: 'https://www.mozilla.org/firefox/new/' },
      { label: 'LibreOffice', url: 'https://www.libreoffice.org/download/download-libreoffice/' },
      { label: 'VLC media player', url: 'https://www.videolan.org/vlc/' },
    ],
  };
}

function buildToolLinksMarkdown(category = '') {
  const template = getCategoryTemplate(category);
  return template.tools.map((tool) => `- [${tool.label}](${tool.url})`).join('\n');
}

function buildCleanContent(post) {
  const title = cleanLine(post.title || 'OpenGuideHub article');
  const category = cleanLine(post.category || 'Technology') || 'Technology';
  const template = getCategoryTemplate(category);
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
  const overview = (sentences.slice(1, 3).join(' ') || `OpenGuideHub condensed this ${String(category || 'technology').toLowerCase()} update into a shorter brief for easier reading.`).slice(0, 420);
  const labels = ['Key idea', 'Why now', 'Main detail', 'What to watch'];
  const bullets = sentences.slice(0, 4).map((line, index) => `- **${labels[index] || 'Note'}:** ${line.slice(0, 180)}`).join('\n');
  const tools = buildToolLinksMarkdown(category);
  const sources = [
    `- [More ${category} articles on OpenGuideHub](${internalLink})`,
    sourceUrl ? `- [Original source from ${sourceLabel}](${sourceUrl})` : `- Source report: ${sourceLabel}`,
  ].join('\n');

  return {
    title,
    excerpt: tldr.slice(0, 220),
    content: `## TL;DR\n**Quick take:** ${tldr}\n\n## ${template.summaryHeading}\n${overview}\n\n## Key points\n${bullets || '- **Summary:** This article is now available in a cleaner, easier-to-read structure.'}\n\n## Why it matters\n${template.whyText}\n\n## Free tools and downloads\n${tools}\n\n## Sources and further reading\n${sources}`.trim(),
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

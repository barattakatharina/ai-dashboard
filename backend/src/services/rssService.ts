import Parser from 'rss-parser';
import crypto from 'crypto';
import { ContentItem, RssSource } from '../types/index.js';

type RssFeedItem = {
  title?: string;
  link?: string;
  contentSnippet?: string;
  content?: string;
  pubDate?: string;
  isoDate?: string;
  creator?: string;
  author?: string;
  enclosure?: { url?: string; type?: string };
  mediaContent?: { $?: { url?: string } };
  mediaThumbnail?: { $?: { url?: string } };
  itunesImage?: { $?: { href?: string } } | string;
  itunesDuration?: string;
  itunesSummary?: string;
};

const parser = new Parser<object, RssFeedItem>({
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; AI-Dashboard/1.0)',
    Accept: 'application/rss+xml, application/xml, text/xml, */*',
  },
  customFields: {
    item: [
      ['media:content', 'mediaContent', { keepArray: false }],
      ['media:thumbnail', 'mediaThumbnail', { keepArray: false }],
      ['enclosure', 'enclosure', { keepArray: false }],
      ['itunes:image', 'itunesImage', { keepArray: false }],
      ['itunes:duration', 'itunesDuration'],
      ['itunes:summary', 'itunesSummary'],
    ],
  },
});

export const RSS_SOURCES: RssSource[] = [
  // News
  { url: 'https://techcrunch.com/category/artificial-intelligence/feed/', source: 'TechCrunch', type: 'article', category: 'top-stories' },
  { url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml', source: 'The Verge', type: 'article', category: 'top-stories' },
  { url: 'https://venturebeat.com/ai/feed/', source: 'VentureBeat', type: 'article', category: 'top-stories' },
  { url: 'https://feeds.arstechnica.com/arstechnica/technology-lab', source: 'Ars Technica', type: 'article', category: 'top-stories', filterAI: true },
  { url: 'https://www.wired.com/feed/tag/artificial-intelligence/rss', source: 'Wired', type: 'article', category: 'top-stories' },
  { url: 'https://feeds.feedburner.com/AITopics-AllArticles', source: 'AI Topics', type: 'article', category: 'top-stories' },

  // Newsletters / Substacks
  { url: 'https://importai.substack.com/feed', source: 'Import AI', type: 'newsletter', category: 'newsletters' },
  { url: 'https://aisupremacy.substack.com/feed', source: 'AI Supremacy', type: 'newsletter', category: 'newsletters' },
  { url: 'https://thealgorithmicbridge.substack.com/feed', source: 'The Algorithmic Bridge', type: 'newsletter', category: 'newsletters' },
  { url: 'https://magazine.sebastianraschka.com/feed', source: 'Ahead of AI', type: 'newsletter', category: 'newsletters' },
  { url: 'https://www.deeplearning.ai/the-batch/feed/', source: 'The Batch (DeepLearning.AI)', type: 'newsletter', category: 'newsletters' },
  { url: 'https://lastweeklyai.substack.com/feed', source: 'Last Week in AI', type: 'newsletter', category: 'newsletters' },

  // Podcasts
  { url: 'https://lexfridman.com/feed/podcast/', source: 'Lex Fridman Podcast', type: 'podcast', category: 'podcasts' },
  { url: 'https://changelog.com/practicalai/feed', source: 'Practical AI', type: 'podcast', category: 'podcasts' },
  { url: 'https://feeds.megaphone.fm/MLN2155636141', source: 'TWIML AI Podcast', type: 'podcast', category: 'podcasts' },
  { url: 'https://thegradientpub.substack.com/feed', source: 'The Gradient', type: 'podcast', category: 'podcasts' },
  { url: 'https://feeds.simplecast.com/dLRotFGk', source: 'Latent Space', type: 'podcast', category: 'podcasts' },
  { url: 'https://darknetdiaries.com/feed.xml', source: 'Hard Fork (NYT)', type: 'podcast', category: 'podcasts' },
];

const AI_KEYWORDS = [
  'ai', 'artificial intelligence', 'machine learning', 'deep learning',
  'neural network', 'llm', 'large language model', 'gpt', 'claude',
  'gemini', 'openai', 'anthropic', 'mistral', 'llama', 'transformer',
  'diffusion', 'generative', 'chatgpt', 'copilot', 'agent', 'rag',
  'embeddings', 'fine-tun', 'inference', 'model', 'computer vision',
  'natural language', 'nlp', 'robotics', 'automation', 'sora', 'midjourney',
];

function isAIRelated(text: string): boolean {
  const lower = text.toLowerCase();
  return AI_KEYWORDS.some(kw => lower.includes(kw));
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function extractImage(item: RssFeedItem): string | undefined {
  if (item.mediaContent?.$?.url) return item.mediaContent.$.url;
  if (item.mediaThumbnail?.$?.url) return item.mediaThumbnail.$.url;
  if (item.enclosure?.url && item.enclosure.type?.startsWith('image')) return item.enclosure.url;
  if (typeof item.itunesImage === 'object' && item.itunesImage?.$?.href) return item.itunesImage.$.href;

  // Try to extract first image from HTML content
  const html = item.content || '';
  const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch) return imgMatch[1];

  return undefined;
}

function getDescription(item: RssFeedItem): string {
  const raw = item.itunesSummary || item.contentSnippet || item.content || '';
  const stripped = stripHtml(raw);
  return stripped.slice(0, 400) + (stripped.length > 400 ? '…' : '');
}

async function fetchFeed(source: RssSource): Promise<ContentItem[]> {
  try {
    const feed = await parser.parseURL(source.url);
    const items: ContentItem[] = [];

    for (const item of feed.items.slice(0, 15)) {
      if (!item.title || !item.link) continue;

      if (source.filterAI && !isAIRelated(item.title + ' ' + (item.contentSnippet || ''))) {
        continue;
      }

      const url = item.link;
      const id = crypto.createHash('md5').update(url).digest('hex');
      const description = getDescription(item);

      items.push({
        id,
        type: source.type,
        category: source.category,
        title: item.title.trim(),
        description: description || 'No description available.',
        url,
        imageUrl: extractImage(item),
        source: source.source,
        author: item.creator || item.author,
        publishedAt: item.isoDate || item.pubDate || new Date().toISOString(),
        duration: item.itunesDuration,
      });
    }

    return items;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[RSS] Failed to fetch ${source.source}: ${message}`);
    return [];
  }
}

export async function fetchAllRssFeeds(): Promise<ContentItem[]> {
  const results = await Promise.allSettled(RSS_SOURCES.map(fetchFeed));
  const items: ContentItem[] = [];

  for (const result of results) {
    if (result.status === 'fulfilled') {
      items.push(...result.value);
    }
  }

  return items;
}

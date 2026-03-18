import { cache } from '../db/database.js';
import { fetchAllRssFeeds } from './rssService.js';
import { fetchHackerNews } from './hackerNewsService.js';
import { fetchYouTubeVideos } from './youtubeService.js';
import { fetchNewsApiArticles } from './newsApiService.js';
import { CategoryId, ContentItem, DashboardResponse } from '../types/index.js';

const CATEGORY_CONFIG: Record<CategoryId, { label: string; emoji: string; limit: number }> = {
  'top-stories': { label: 'Top Stories', emoji: '🔥', limit: 20 },
  newsletters: { label: 'Newsletter Highlights', emoji: '📰', limit: 12 },
  videos: { label: 'Videos', emoji: '▶️', limit: 12 },
  podcasts: { label: 'Podcasts', emoji: '🎧', limit: 10 },
  tools: { label: 'AI Tools & Products', emoji: '🛠️', limit: 12 },
};

function deduplicateById(items: ContentItem[]): ContentItem[] {
  const seen = new Map<string, ContentItem>();
  for (const item of items) {
    if (!seen.has(item.id)) {
      seen.set(item.id, item);
    } else {
      // Keep the one with more info
      const existing = seen.get(item.id)!;
      if (!existing.imageUrl && item.imageUrl) seen.set(item.id, item);
    }
  }
  return Array.from(seen.values());
}

function scoreItem(item: ContentItem): number {
  const ageMs = Date.now() - new Date(item.publishedAt).getTime();
  const ageHours = ageMs / (1000 * 60 * 60);

  // Recency score: decay over 7 days
  const recencyScore = Math.max(0, 1 - ageHours / (7 * 24));

  // Engagement score
  const engagementScore = item.score ? Math.min(item.score / 500, 1) : 0.3;

  return recencyScore * 0.6 + engagementScore * 0.4;
}

async function fetchAllContent(): Promise<ContentItem[]> {
  const sources: Promise<ContentItem[]>[] = [
    fetchAllRssFeeds(),
    fetchHackerNews(),
  ];

  if (process.env.YOUTUBE_API_KEY) {
    sources.push(fetchYouTubeVideos(process.env.YOUTUBE_API_KEY));
  }
  if (process.env.NEWS_API_KEY) {
    sources.push(fetchNewsApiArticles(process.env.NEWS_API_KEY));
  }

  const results = await Promise.allSettled(sources);
  const allItems: ContentItem[] = [];

  for (const result of results) {
    if (result.status === 'fulfilled') {
      allItems.push(...result.value);
    } else {
      console.error('[Aggregator] Source failed:', result.reason);
    }
  }

  return deduplicateById(allItems);
}

function buildDashboard(items: ContentItem[]): DashboardResponse {
  const now = new Date();
  const nextRefreshHour = now.getHours() < 6 ? 6 : now.getHours() < 18 ? 18 : 30;
  const nextRefresh = new Date(now);
  nextRefresh.setHours(nextRefreshHour % 24, 0, 0, 0);
  if (nextRefreshHour === 30) nextRefresh.setDate(nextRefresh.getDate() + 1);

  const activeSources = [...new Set(items.map(i => i.source))];

  const categories = (Object.entries(CATEGORY_CONFIG) as [CategoryId, { label: string; emoji: string; limit: number }][])
    .map(([id, config]) => {
      const categoryItems = items
        .filter(item => item.category === id)
        .sort((a, b) => scoreItem(b) - scoreItem(a))
        .slice(0, config.limit);

      return {
        id,
        label: config.label,
        emoji: config.emoji,
        items: categoryItems,
      };
    })
    .filter(cat => cat.items.length > 0);

  return {
    lastRefreshed: now.toISOString(),
    nextRefresh: nextRefresh.toISOString(),
    isStale: false,
    categories,
    totalItems: categories.reduce((sum, c) => sum + c.items.length, 0),
    activeSources,
  };
}

let isRefreshing = false;

export async function getDashboard(): Promise<DashboardResponse> {
  const cached = cache.get();

  if (cached && !cache.isStale()) {
    const data = JSON.parse(cached.data) as DashboardResponse;
    data.isStale = false;
    return data;
  }

  if (isRefreshing && cached) {
    const data = JSON.parse(cached.data) as DashboardResponse;
    data.isStale = true;
    return data;
  }

  return refreshDashboard();
}

export async function refreshDashboard(): Promise<DashboardResponse> {
  if (isRefreshing) {
    const cached = cache.get();
    if (cached) {
      const data = JSON.parse(cached.data) as DashboardResponse;
      data.isStale = true;
      return data;
    }
  }

  isRefreshing = true;
  console.log('[Aggregator] Starting content refresh...');

  try {
    const items = await fetchAllContent();
    console.log(`[Aggregator] Fetched ${items.length} total items`);

    const dashboard = buildDashboard(items);
    cache.set(JSON.stringify(dashboard));

    console.log(`[Aggregator] Refresh complete. ${dashboard.totalItems} items across ${dashboard.categories.length} categories.`);
    return dashboard;
  } finally {
    isRefreshing = false;
  }
}

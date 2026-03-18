import axios from 'axios';
import crypto from 'crypto';
import { ContentItem } from '../types/index.js';

const NEWS_API_BASE = 'https://newsapi.org/v2';

interface NewsArticle {
  title: string;
  description?: string;
  url: string;
  urlToImage?: string;
  source: { name: string };
  author?: string;
  publishedAt: string;
}

export async function fetchNewsApiArticles(apiKey: string): Promise<ContentItem[]> {
  try {
    const res = await axios.get(`${NEWS_API_BASE}/everything`, {
      params: {
        apiKey,
        q: '"artificial intelligence" OR "machine learning" OR "large language model" OR "generative AI"',
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: 30,
        from: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      timeout: 10000,
    });

    return (res.data.articles as NewsArticle[])
      .filter(a => a.title && a.url && !a.title.includes('[Removed]'))
      .map(article => {
        const id = crypto.createHash('md5').update(article.url).digest('hex');
        return {
          id,
          type: 'article' as const,
          category: 'top-stories' as const,
          title: article.title,
          description: article.description?.slice(0, 400) || 'No description available.',
          url: article.url,
          imageUrl: article.urlToImage || undefined,
          source: article.source.name,
          author: article.author || undefined,
          publishedAt: article.publishedAt,
        };
      });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[NewsAPI] Failed: ${message}`);
    return [];
  }
}

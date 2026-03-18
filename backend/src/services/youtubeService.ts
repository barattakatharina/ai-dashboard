import axios from 'axios';
import crypto from 'crypto';
import { ContentItem } from '../types/index.js';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

interface YouTubeVideo {
  id: { videoId: string };
  snippet: {
    title: string;
    description: string;
    channelTitle: string;
    publishedAt: string;
    thumbnails: { high?: { url: string }; medium?: { url: string } };
  };
}

export async function fetchYouTubeVideos(apiKey: string): Promise<ContentItem[]> {
  const queries = [
    'artificial intelligence news this week',
    'AI tools new release 2025',
    'large language models explained',
  ];

  const allVideos: YouTubeVideo[] = [];
  const seenIds = new Set<string>();

  for (const q of queries) {
    try {
      const res = await axios.get(`${YOUTUBE_API_BASE}/search`, {
        params: {
          key: apiKey,
          q,
          part: 'snippet',
          type: 'video',
          maxResults: 10,
          order: 'date',
          publishedAfter: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          videoDuration: 'medium',
          relevanceLanguage: 'en',
        },
        timeout: 10000,
      });

      for (const item of res.data.items as YouTubeVideo[]) {
        if (!seenIds.has(item.id.videoId)) {
          seenIds.add(item.id.videoId);
          allVideos.push(item);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`[YouTube] Query "${q}" failed: ${message}`);
    }
  }

  return allVideos.map(video => {
    const url = `https://www.youtube.com/watch?v=${video.id.videoId}`;
    const id = crypto.createHash('md5').update(url).digest('hex');
    const thumbnail =
      video.snippet.thumbnails.high?.url ||
      video.snippet.thumbnails.medium?.url ||
      `https://img.youtube.com/vi/${video.id.videoId}/hqdefault.jpg`;

    return {
      id,
      type: 'video' as const,
      category: 'videos' as const,
      title: video.snippet.title,
      description: video.snippet.description.slice(0, 400) || 'No description available.',
      url,
      imageUrl: thumbnail,
      source: video.snippet.channelTitle,
      publishedAt: video.snippet.publishedAt,
    };
  });
}

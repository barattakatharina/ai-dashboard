import axios from 'axios';
import crypto from 'crypto';
import { ContentItem } from '../types/index.js';

const HN_BASE = 'https://hacker-news.firebaseio.com/v0';

const AI_KEYWORDS = [
  'ai', 'gpt', 'llm', 'llama', 'claude', 'gemini', 'openai', 'anthropic',
  'mistral', 'machine learning', 'deep learning', 'neural', 'transformer',
  'diffusion', 'generative', 'chatgpt', 'copilot', 'stable diffusion',
  'midjourney', 'rag', 'embedding', 'inference', 'fine-tun', 'computer vision',
  'nlp', 'natural language', 'sora', 'agent', 'retrieval', 'hugging face',
];

interface HNStory {
  id: number;
  title: string;
  url?: string;
  text?: string;
  score: number;
  by: string;
  time: number;
  type: string;
}

function isAIRelated(title: string): boolean {
  const lower = title.toLowerCase();
  return AI_KEYWORDS.some(kw => lower.includes(kw));
}

async function fetchStory(id: number): Promise<HNStory | null> {
  try {
    const res = await axios.get(`${HN_BASE}/item/${id}.json`, { timeout: 5000 });
    return res.data;
  } catch {
    return null;
  }
}

async function fetchTopIds(endpoint: string, limit = 200): Promise<number[]> {
  try {
    const res = await axios.get(`${HN_BASE}/${endpoint}.json`, { timeout: 8000 });
    return (res.data as number[]).slice(0, limit);
  } catch {
    return [];
  }
}

async function processStories(
  ids: number[],
  category: 'top-stories' | 'tools',
  limit: number,
): Promise<ContentItem[]> {
  const batchSize = 20;
  const stories: HNStory[] = [];

  for (let i = 0; i < Math.min(ids.length, 100); i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    const results = await Promise.allSettled(batch.map(fetchStory));
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value && r.value.url && isAIRelated(r.value.title)) {
        stories.push(r.value);
      }
    }
    if (stories.length >= limit * 3) break;
  }

  // Sort by score, take top N
  stories.sort((a, b) => b.score - a.score);

  return stories.slice(0, limit).map(story => {
    const url = story.url || `https://news.ycombinator.com/item?id=${story.id}`;
    const id = crypto.createHash('md5').update(url).digest('hex');

    return {
      id,
      type: category === 'tools' ? ('tool' as const) : ('article' as const),
      category,
      title: story.title,
      description: story.text
        ? story.text.replace(/<[^>]*>/g, ' ').slice(0, 400)
        : `Hacker News discussion with ${story.score} points by ${story.by}.`,
      url,
      source: 'Hacker News',
      author: story.by,
      publishedAt: new Date(story.time * 1000).toISOString(),
      score: story.score,
    };
  });
}

export async function fetchHackerNews(): Promise<ContentItem[]> {
  const [topIds, showIds] = await Promise.all([
    fetchTopIds('topstories', 150),
    fetchTopIds('showstories', 100),
  ]);

  const [topStories, showStories] = await Promise.all([
    processStories(topIds, 'top-stories', 15),
    processStories(showIds, 'tools', 10),
  ]);

  return [...topStories, ...showStories];
}

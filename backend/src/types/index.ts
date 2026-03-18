export type ContentType = 'article' | 'video' | 'podcast' | 'newsletter' | 'tool';
export type CategoryId = 'top-stories' | 'newsletters' | 'videos' | 'podcasts' | 'tools';

export interface ContentItem {
  id: string;
  type: ContentType;
  category: CategoryId;
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  source: string;
  author?: string;
  publishedAt: string;
  duration?: string;
  score?: number;
}

export interface Category {
  id: CategoryId;
  label: string;
  emoji: string;
  items: ContentItem[];
}

export interface DashboardResponse {
  lastRefreshed: string;
  nextRefresh: string;
  isStale: boolean;
  categories: Category[];
  totalItems: number;
  activeSources: string[];
}

export interface SavedItem extends ContentItem {
  savedAt: string;
}

export interface RssSource {
  url: string;
  source: string;
  type: ContentType;
  category: CategoryId;
  filterAI?: boolean;
}

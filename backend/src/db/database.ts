import fs from 'fs';
import path from 'path';
import { ContentItem, CategoryId, ContentType } from '../types/index.js';

const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const CACHE_FILE = path.join(DATA_DIR, 'cache.json');
const SAVED_FILE = path.join(DATA_DIR, 'saved.json');

function readJson<T>(file: string, fallback: T): T {
  try {
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as T;
  } catch {
    return fallback;
  }
}

function writeJson(file: string, data: unknown): void {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

interface CacheEntry {
  data: string;
  fetchedAt: string;
}

interface SavedRecord {
  id: string;
  title: string;
  url: string;
  description?: string;
  source?: string;
  type?: string;
  category?: string;
  image_url?: string;
  author?: string;
  published_at?: string;
  duration?: string;
  saved_at: string;
}

export const cache = {
  get(): { data: string; fetchedAt: string } | null {
    const entry = readJson<CacheEntry | null>(CACHE_FILE, null);
    return entry;
  },

  set(data: string): void {
    const entry: CacheEntry = { data, fetchedAt: new Date().toISOString() };
    writeJson(CACHE_FILE, entry);
  },

  isStale(maxAgeHours = 12): boolean {
    const entry = readJson<CacheEntry | null>(CACHE_FILE, null);
    if (!entry) return true;
    const age = Date.now() - new Date(entry.fetchedAt).getTime();
    return age > maxAgeHours * 60 * 60 * 1000;
  },
};

export const saved = {
  getAll(): SavedRecord[] {
    const items = readJson<SavedRecord[]>(SAVED_FILE, []);
    return items.sort((a, b) =>
      new Date(b.saved_at).getTime() - new Date(a.saved_at).getTime()
    );
  },

  add(item: {
    id: string; title: string; url: string; description?: string;
    source?: string; type?: string; category?: string; image_url?: string;
    author?: string; published_at?: string; duration?: string;
  }): void {
    const items = readJson<SavedRecord[]>(SAVED_FILE, []);
    if (!items.find(i => i.id === item.id)) {
      items.push({ ...item, saved_at: new Date().toISOString() });
      writeJson(SAVED_FILE, items);
    }
  },

  remove(id: string): void {
    const items = readJson<SavedRecord[]>(SAVED_FILE, []);
    writeJson(SAVED_FILE, items.filter(i => i.id !== id));
  },

  exists(id: string): boolean {
    const items = readJson<SavedRecord[]>(SAVED_FILE, []);
    return items.some(i => i.id === id);
  },
};

// Re-export types to avoid breaking imports
export type { ContentItem, CategoryId, ContentType };

import { Router, Request, Response } from 'express';
import { saved } from '../db/database.js';
import { ContentItem } from '../types/index.js';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  try {
    const items = saved.getAll() as (ContentItem & { saved_at: string })[];
    const mapped = items.map(item => ({
      id: item.id,
      title: item.title,
      url: item.url,
      description: item.description,
      source: item.source,
      type: item.type,
      category: item.category,
      imageUrl: (item as unknown as { image_url?: string }).image_url,
      author: item.author,
      publishedAt: (item as unknown as { published_at?: string }).published_at,
      duration: item.duration,
      savedAt: item.saved_at,
      saved: true,
    }));
    res.json(mapped);
  } catch (err) {
    console.error('[Saved] GET error:', err);
    res.status(500).json({ error: 'Failed to load saved items' });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const item = req.body as ContentItem;
    if (!item.id || !item.title || !item.url) {
      res.status(400).json({ error: 'Missing required fields: id, title, url' });
      return;
    }

    saved.add({
      id: item.id,
      title: item.title,
      url: item.url,
      description: item.description,
      source: item.source,
      type: item.type,
      category: item.category,
      image_url: item.imageUrl,
      author: item.author,
      published_at: item.publishedAt,
      duration: item.duration,
    });

    res.json({ success: true, saved: true });
  } catch (err) {
    console.error('[Saved] POST error:', err);
    res.status(500).json({ error: 'Failed to save item' });
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  try {
    saved.remove(req.params.id);
    res.json({ success: true, saved: false });
  } catch (err) {
    console.error('[Saved] DELETE error:', err);
    res.status(500).json({ error: 'Failed to remove saved item' });
  }
});

export default router;

import { Router, Request, Response } from 'express';
import { getDashboard, refreshDashboard } from '../services/aggregator.js';
import { saved } from '../db/database.js';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const dashboard = await getDashboard();
    // Annotate items with saved status
    const savedIds = new Set((saved.getAll() as { id: string }[]).map(s => s.id));
    for (const cat of dashboard.categories) {
      for (const item of cat.items) {
        (item as { saved?: boolean }).saved = savedIds.has(item.id);
      }
    }
    res.json(dashboard);
  } catch (err) {
    console.error('[Content] GET error:', err);
    res.status(500).json({ error: 'Failed to load dashboard content' });
  }
});

router.post('/refresh', async (_req: Request, res: Response) => {
  try {
    console.log('[Content] Manual refresh triggered');
    const dashboard = await refreshDashboard();
    const savedIds = new Set((saved.getAll() as { id: string }[]).map(s => s.id));
    for (const cat of dashboard.categories) {
      for (const item of cat.items) {
        (item as { saved?: boolean }).saved = savedIds.has(item.id);
      }
    }
    res.json(dashboard);
  } catch (err) {
    console.error('[Content] Refresh error:', err);
    res.status(500).json({ error: 'Refresh failed' });
  }
});

export default router;

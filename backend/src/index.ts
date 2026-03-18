import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import path from 'path';
import fs from 'fs';
import contentRouter from './routes/content.js';
import savedRouter from './routes/saved.js';
import { refreshDashboard } from './services/aggregator.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'] }));
app.use(express.json());

// Serve built frontend in production
const frontendDist = path.join(process.cwd(), '..', 'frontend', 'dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
}

app.use('/api/content', contentRouter);
app.use('/api/saved', savedRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Schedule refreshes at 6:00 AM and 6:00 PM
cron.schedule('0 6,18 * * *', async () => {
  console.log('[Cron] Scheduled refresh triggered');
  try {
    await refreshDashboard();
  } catch (err) {
    console.error('[Cron] Refresh failed:', err);
  }
});

// SPA fallback — serve index.html for all non-API routes
if (fs.existsSync(frontendDist)) {
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`\n🚀 AI Dashboard backend running on http://localhost:${PORT}`);
  console.log('📋 API endpoints:');
  console.log('   GET  /api/content        - Get dashboard content');
  console.log('   POST /api/content/refresh - Trigger manual refresh');
  console.log('   GET  /api/saved          - Get saved items');
  console.log('   POST /api/saved          - Save an item');
  console.log('   DELETE /api/saved/:id    - Remove saved item');
  console.log('\n📡 Scheduled refreshes at 6:00 AM and 6:00 PM daily\n');
});

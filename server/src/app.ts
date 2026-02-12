import cors from 'cors';
import express from 'express';
import { testConnection } from './db.js';
import authRoutes from './routes/auth.js';
import occasionsRoutes from './routes/occasions.js';
import peopleRoutes from './routes/people.js';
import giftsRoutes from './routes/gifts.js';
import adminRoutes from './routes/admin.js';
import aiRoutes from './routes/ai.js';

export function createApp() {
  const app = express();

  app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  }));
  app.use(express.json());

  app.use('/api/auth', authRoutes);
  app.use('/api/occasions', occasionsRoutes);
  app.use('/api/people', peopleRoutes);
  app.use('/api/gifts', giftsRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/ai', aiRoutes);

  app.get('/api/health', async (_req, res) => {
    const dbOk = await testConnection();
    res.json({
      status: dbOk ? 'ok' : 'degraded',
      db: dbOk ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    });
  });

  return app;
}

import express from 'express';
import cors from 'cors';
import { testConnection } from './db.js';
import { connectRedis } from './redis.js';
import authRoutes from './routes/auth.js';
import occasionsRoutes from './routes/occasions.js';
import peopleRoutes from './routes/people.js';
import giftsRoutes from './routes/gifts.js';

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/occasions', occasionsRoutes);
app.use('/api/people', peopleRoutes);
app.use('/api/gifts', giftsRoutes);

// Health check
app.get('/api/health', async (_req, res) => {
  const dbOk = await testConnection();
  res.json({
    status: dbOk ? 'ok' : 'degraded',
    db: dbOk ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// Startup
async function start() {
  // Connect Redis (non-blocking — app works without it, just no caching)
  await connectRedis();

  // Wait for DB
  let dbReady = false;
  for (let i = 0; i < 30; i++) {
    dbReady = await testConnection();
    if (dbReady) break;
    console.log(`Waiting for database... (attempt ${i + 1}/30)`);
    await new Promise(r => setTimeout(r, 2000));
  }

  if (!dbReady) {
    console.error('Could not connect to database after 30 attempts');
    process.exit(1);
  }

  console.log('Database connected');

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Giftable API running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

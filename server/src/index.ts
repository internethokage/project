import { connectRedis } from './redis.js';
import { createApp } from './app.js';
import { runMigrations, waitForDatabase } from './bootstrap.js';

const PORT = Number(process.env.PORT) || 3001;

export async function start(): Promise<void> {
  const app = createApp();

  await connectRedis();

  const dbReady = await waitForDatabase();
  if (!dbReady) {
    console.error('Could not connect to database after 30 attempts');
    process.exit(1);
  }

  await runMigrations();
  console.log('Database connected and migrations complete');

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Giftable API running on port ${PORT}`);
  });
}

if (process.env.NODE_ENV !== 'test') {
  start().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

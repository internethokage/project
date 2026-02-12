import { query, testConnection } from './db.js';

export async function runMigrations(): Promise<void> {
  await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE');
}

export async function waitForDatabase(maxAttempts = 30, delayMs = 2000): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    const connected = await testConnection();
    if (connected) {
      return true;
    }

    console.log(`Waiting for database... (attempt ${i + 1}/${maxAttempts})`);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  return false;
}

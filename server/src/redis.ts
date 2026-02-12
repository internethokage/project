import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';
const DEFAULT_TTL = Number(process.env.CACHE_TTL) || 300; // 5 minutes
const RESET_TOKEN_TTL_SECONDS = 3600;

const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 200, 2000);
    return delay;
  },
  lazyConnect: true,
});

let redisAvailable = false;
const inMemoryStore = new Map<string, { value: string; expiresAt: number }>();

function nowMs(): number {
  return Date.now();
}

function setInMemory(key: string, value: string, ttlSeconds: number): void {
  inMemoryStore.set(key, {
    value,
    expiresAt: nowMs() + ttlSeconds * 1000,
  });
}

function getInMemory(key: string): string | null {
  const entry = inMemoryStore.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= nowMs()) {
    inMemoryStore.delete(key);
    return null;
  }
  return entry.value;
}

function deleteInMemory(...keys: string[]): void {
  keys.forEach((key) => inMemoryStore.delete(key));
}

function getInMemoryByPrefix(prefix: string): string[] {
  const keys: string[] = [];
  for (const [key, entry] of inMemoryStore.entries()) {
    if (entry.expiresAt <= nowMs()) {
      inMemoryStore.delete(key);
      continue;
    }
    if (key.startsWith(prefix)) {
      keys.push(key);
    }
  }
  return keys;
}

function sessionKey(token: string): string {
  return `session:${token}`;
}

function resetKey(token: string): string {
  return `reset:${token}`;
}

redis.on('error', (err) => {
  console.error('Redis error:', err.message);
});

redis.on('connect', () => {
  redisAvailable = true;
  console.log('Redis connected');
});

redis.on('end', () => {
  redisAvailable = false;
});

export async function connectRedis(): Promise<void> {
  try {
    await redis.connect();
  } catch (err) {
    redisAvailable = false;
    console.error('Failed to connect to Redis:', err);
  }
}

export function isRedisAvailable(): boolean {
  return redisAvailable;
}

function userKey(userId: string, resource: string): string {
  return `user:${userId}:${resource}`;
}

export async function getCached<T>(userId: string, resource: string): Promise<T | null> {
  const key = userKey(userId, resource);
  try {
    if (redisAvailable) {
      const data = await redis.get(key);
      if (data) return JSON.parse(data) as T;
    }
  } catch {
    // fall back to in-memory
  }

  const fallback = getInMemory(key);
  return fallback ? (JSON.parse(fallback) as T) : null;
}

export async function setCache(userId: string, resource: string, data: unknown, ttl = DEFAULT_TTL): Promise<void> {
  const key = userKey(userId, resource);
  const serialized = JSON.stringify(data);
  try {
    if (redisAvailable) {
      await redis.set(key, serialized, 'EX', ttl);
      return;
    }
  } catch {
    // fall back to in-memory
  }

  setInMemory(key, serialized, ttl);
}

export async function invalidateCache(userId: string, resource: string): Promise<void> {
  const key = userKey(userId, resource);
  try {
    if (redisAvailable) {
      await redis.del(key);
    }
  } catch {
    // cache failures are non-fatal
  }
  deleteInMemory(key);
}

export async function invalidateUserCache(userId: string): Promise<void> {
  const prefix = `user:${userId}:`;
  try {
    if (redisAvailable) {
      const keys = await redis.keys(`${prefix}*`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    }
  } catch {
    // cache failures are non-fatal
  }

  const memoryKeys = getInMemoryByPrefix(prefix);
  if (memoryKeys.length > 0) {
    deleteInMemory(...memoryKeys);
  }
}

export async function setSession(token: string, userId: string, ttl: number): Promise<void> {
  const key = sessionKey(token);
  try {
    if (redisAvailable) {
      await redis.set(key, userId, 'EX', ttl);
      return;
    }
  } catch {
    // fall back to in-memory
  }

  setInMemory(key, userId, ttl);
}

export async function getSession(token: string): Promise<string | null> {
  const key = sessionKey(token);
  try {
    if (redisAvailable) {
      const value = await redis.get(key);
      if (value) return value;
    }
  } catch {
    // fall back to in-memory
  }

  return getInMemory(key);
}

export async function deleteSession(token: string): Promise<void> {
  const key = sessionKey(token);
  try {
    if (redisAvailable) {
      await redis.del(key);
    }
  } catch {
    // non-fatal
  }
  deleteInMemory(key);
}

export async function setResetToken(token: string, userId: string, ttl = RESET_TOKEN_TTL_SECONDS): Promise<void> {
  const key = resetKey(token);
  try {
    if (redisAvailable) {
      await redis.set(key, userId, 'EX', ttl);
      return;
    }
  } catch {
    // fall back to in-memory
  }

  setInMemory(key, userId, ttl);
}

export async function consumeResetToken(token: string): Promise<string | null> {
  const key = resetKey(token);

  try {
    if (redisAvailable) {
      const userId = await redis.get(key);
      if (userId) {
        await redis.del(key);
      }
      if (userId) return userId;
    }
  } catch {
    // fall back to in-memory
  }

  const fallbackUserId = getInMemory(key);
  deleteInMemory(key);
  return fallbackUserId;
}

export default redis;

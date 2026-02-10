import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';
const DEFAULT_TTL = Number(process.env.CACHE_TTL) || 300; // 5 minutes

const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 200, 2000);
    return delay;
  },
  lazyConnect: true,
});

let redisAvailable = false;

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
  try {
    const data = await redis.get(userKey(userId, resource));
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export async function setCache(userId: string, resource: string, data: unknown, ttl = DEFAULT_TTL): Promise<void> {
  try {
    await redis.set(userKey(userId, resource), JSON.stringify(data), 'EX', ttl);
  } catch {
    // cache failures are non-fatal
  }
}

export async function invalidateCache(userId: string, resource: string): Promise<void> {
  try {
    await redis.del(userKey(userId, resource));
  } catch {
    // cache failures are non-fatal
  }
}

export async function invalidateUserCache(userId: string): Promise<void> {
  try {
    const keys = await redis.keys(`user:${userId}:*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch {
    // cache failures are non-fatal
  }
}

export async function setSession(token: string, userId: string, ttl: number): Promise<void> {
  try {
    if (!redisAvailable) return;
    await redis.set(`session:${token}`, userId, 'EX', ttl);
  } catch {
    // session store failures are non-fatal since JWT is self-contained
  }
}

export async function getSession(token: string): Promise<string | null> {
  try {
    if (!redisAvailable) return null;
    return await redis.get(`session:${token}`);
  } catch {
    return null;
  }
}

export async function deleteSession(token: string): Promise<void> {
  try {
    if (!redisAvailable) return;
    await redis.del(`session:${token}`);
  } catch {
    // non-fatal
  }
}

export default redis;

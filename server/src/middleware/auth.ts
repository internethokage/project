import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getSession } from '../redis.js';

const JWT_SECRET = process.env.JWT_SECRET || 'giftable-dev-secret-change-in-production';

export interface AuthRequest extends Request {
  userId?: string;
  isAdmin?: boolean;
}

export interface JwtPayload {
  userId: string;
  email: string;
  isAdmin: boolean;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

/**
 * requireAuth middleware
 *
 * Design: Redis is a SESSION BLACKLIST, not the source of truth.
 *
 * A valid JWT is trusted unless it appears in Redis as 'revoked'.
 * This prevents unexpected logouts when Redis is unavailable or
 * a session entry hasn't been written yet (e.g. login race condition,
 * Redis restart, cluster failover).
 *
 * Flow:
 *  1. Verify JWT signature & expiry first.
 *  2. Check Redis for explicit revocation ('revoked' = logged out/banned).
 *  3. If Redis has a session entry, sanity-check userId matches JWT.
 *  4. If Redis is down or entry not found → TRUST the JWT (it's valid).
 */
export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing authorization header' });
    return;
  }

  const token = header.slice(7);

  try {
    // Step 1: JWT is the source of truth — verify signature & expiry first
    const payload = verifyToken(token);

    // Step 2: Check Redis blacklist (non-fatal if Redis is unavailable)
    try {
      const session = await getSession(token);

      if (session === 'revoked') {
        res.status(401).json({ error: 'Session revoked' });
        return;
      }

      if (session && session !== payload.userId) {
        res.status(401).json({ error: 'Invalid session' });
        return;
      }
      // session === null → Redis has no entry, but JWT is valid → allow through
    } catch {
      // Redis unavailable — JWT is sufficient, continue
    }

    req.userId = payload.userId;
    req.isAdmin = Boolean(payload.isAdmin);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (!req.isAdmin) {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }

  next();
}

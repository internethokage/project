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

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing authorization header' });
    return;
  }

  const token = header.slice(7);

  try {
    // Check if session was revoked (logout)
    const session = await getSession(token);
    if (session === 'revoked') {
      res.status(401).json({ error: 'Session expired' });
      return;
    }

    const payload = verifyToken(token);
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

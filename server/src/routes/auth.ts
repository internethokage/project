import { Request, RequestHandler, Response, Router } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { query } from '../db.js';
import { signToken, requireAuth, AuthRequest, verifyToken } from '../middleware/auth.js';
import {
  setSession,
  deleteSession,
  getSession,
  isRedisAvailable,
  setResetToken,
  consumeResetToken,
} from '../redis.js';
import { sendPasswordResetEmail } from '../email.js';

const router = Router();
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;
const requireAuthHandler = requireAuth as RequestHandler;

function normalizeEmail(email: unknown): string | null {
  if (typeof email !== 'string') return null;
  const normalized = email.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

function parsePassword(password: unknown): string | null {
  if (typeof password !== 'string') return null;
  return password;
}

function getBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice(7);
}

async function shouldAssignAdmin(email: string): Promise<boolean> {
  const configured = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  if (configured.includes(email)) return true;

  const admins = await query<{ count: number }>('SELECT COUNT(*)::int AS count FROM users WHERE is_admin = true');
  return admins.rows[0]?.count === 0;
}

router.post('/register', async (req: Request, res: Response) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = parsePassword(req.body?.password);

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    const existing = await query<{ id: string }>('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'An account with this email already exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const isAdmin = await shouldAssignAdmin(email);
    const result = await query<{ id: string; email: string; is_admin: boolean }>(
      'INSERT INTO users (email, password_hash, is_admin) VALUES ($1, $2, $3) RETURNING id, email, is_admin',
      [email, passwordHash, isAdmin]
    );

    const user = result.rows[0];
    const token = signToken({ userId: user.id, email: user.email, isAdmin: user.is_admin });
    await setSession(token, user.id, SESSION_TTL_SECONDS);

    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, isAdmin: user.is_admin },
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = parsePassword(req.body?.password);

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const result = await query<{ id: string; email: string; password_hash: string; is_admin: boolean }>(
      'SELECT id, email, password_hash, is_admin FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = signToken({ userId: user.id, email: user.email, isAdmin: user.is_admin });
    await setSession(token, user.id, SESSION_TTL_SECONDS);

    res.json({
      token,
      user: { id: user.id, email: user.email, isAdmin: user.is_admin },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/logout', requireAuthHandler, async (req: AuthRequest, res: Response) => {
  try {
    const token = getBearerToken(req);
    if (token) {
      await deleteSession(token);
      await setSession(token, 'revoked', SESSION_TTL_SECONDS);
    }

    res.json({ message: 'Logged out' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Logout failed' });
  }
});

router.get('/me', requireAuthHandler, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query<{ id: string; email: string; is_admin: boolean; created_at: string }>(
      'SELECT id, email, is_admin, created_at FROM users WHERE id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const user = result.rows[0];
    res.json({ user: { id: user.id, email: user.email, created_at: user.created_at, isAdmin: user.is_admin } });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const email = normalizeEmail(req.body?.email);

    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    const result = await query<{ id: string; email: string }>('SELECT id, email FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
      return;
    }

    const user = result.rows[0];
    const resetToken = crypto.randomBytes(32).toString('hex');
    await setResetToken(resetToken, user.id);

    const appUrl = process.env.APP_URL || 'http://localhost';
    const previewResetUrl = `${appUrl}/reset-password?token=${resetToken}`;
    const mailboxPreviewUrl = process.env.MAILHOG_UI_URL || 'http://localhost:8025';

    try {
      await sendPasswordResetEmail(user.email, resetToken);
    } catch (emailErr) {
      console.error('Failed to send reset email:', emailErr);
      console.log(`Password reset token for ${user.email}: ${resetToken}`);
    }

    res.json({
      message: 'If an account with that email exists, a password reset link has been sent.',
      previewResetUrl: process.env.NODE_ENV === 'production' ? undefined : previewResetUrl,
      mailboxPreviewUrl: process.env.NODE_ENV === 'production' ? undefined : mailboxPreviewUrl,
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const token = typeof req.body?.token === 'string' ? req.body.token : null;
    const password = parsePassword(req.body?.password);

    if (!token || !password) {
      res.status(400).json({ error: 'Token and new password are required' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    const userId = await consumeResetToken(token);
    if (!userId) {
      res.status(400).json({ error: 'Invalid or expired reset token' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, userId]);

    res.json({ message: 'Password has been reset successfully. You can now sign in.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

router.get('/verify', async (req: Request, res: Response) => {
  const token = getBearerToken(req);
  if (!token) {
    res.status(401).json({ valid: false });
    return;
  }

  try {
    const session = await getSession(token);
    if (session === 'revoked') {
      res.status(401).json({ valid: false });
      return;
    }

    const payload = verifyToken(token);

    if (session && session !== payload.userId) {
      res.status(401).json({ valid: false });
      return;
    }

    if (isRedisAvailable() && !session) {
      res.status(401).json({ valid: false });
      return;
    }

    res.json({ valid: true, user: { id: payload.userId, email: payload.email, isAdmin: payload.isAdmin } });
  } catch {
    res.status(401).json({ valid: false });
  }
});

export default router;

import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { query } from '../db.js';
import { signToken, requireAuth, AuthRequest, verifyToken } from '../middleware/auth.js';
import { setSession, deleteSession, getSession, isRedisAvailable } from '../redis.js';
import { setSession, deleteSession, getSession } from '../redis.js';
import { sendPasswordResetEmail } from '../email.js';
import redis from '../redis.js';

const router = Router();
const resetTokenFallback = new Map<string, { userId: string; expiresAt: number }>();

async function shouldAssignAdmin(email: string): Promise<boolean> {
  const configured = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  if (configured.includes(email.toLowerCase())) return true;

  const admins = await query('SELECT COUNT(*)::int AS count FROM users WHERE is_admin = true');
  return admins.rows[0]?.count === 0;
}

async function storeResetToken(token: string, userId: string): Promise<void> {
  const expirySeconds = 3600;
  if (isRedisAvailable()) {
    await redis.set(`reset:${token}`, userId, 'EX', expirySeconds);
    return;
  }
  resetTokenFallback.set(token, { userId, expiresAt: Date.now() + expirySeconds * 1000 });
}

async function consumeResetToken(token: string): Promise<string | null> {
  if (isRedisAvailable()) {
    const userId = await redis.get(`reset:${token}`);
    if (userId) {
      await redis.del(`reset:${token}`);
    }
    return userId;
  }

  const record = resetTokenFallback.get(token);
  if (!record) return null;
  if (record.expiresAt < Date.now()) {
    resetTokenFallback.delete(token);
    return null;
  }
  resetTokenFallback.delete(token);
  return record.userId;
}

async function shouldAssignAdmin(email: string): Promise<boolean> {
  const configured = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  if (configured.includes(email.toLowerCase())) return true;

  const admins = await query('SELECT COUNT(*)::int AS count FROM users WHERE is_admin = true');
  return admins.rows[0]?.count === 0;
}

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    const normalizedEmail = email.toLowerCase();
    const existing = await query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'An account with this email already exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const isAdmin = await shouldAssignAdmin(normalizedEmail);
    const result = await query(
      'INSERT INTO users (email, password_hash, is_admin) VALUES ($1, $2, $3) RETURNING id, email, is_admin, created_at',
      [normalizedEmail, passwordHash, isAdmin]
    );

    const user = result.rows[0];
    const token = signToken({ userId: user.id, email: user.email, isAdmin: user.is_admin });
    await setSession(token, user.id, 7 * 24 * 60 * 60);

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
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const result = await query(
      'SELECT id, email, password_hash, is_admin FROM users WHERE email = $1',
      [email.toLowerCase()]
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
    await setSession(token, user.id, 7 * 24 * 60 * 60);

    res.json({
      token,
      user: { id: user.id, email: user.email, isAdmin: user.is_admin },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/logout', requireAuth as any, async (req: AuthRequest, res: Response) => {
  try {
    const token = req.headers.authorization?.slice(7);
    if (token) {
      await deleteSession(token);
      await setSession(token, 'revoked', 7 * 24 * 60 * 60);
    }
    res.json({ message: 'Logged out' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Logout failed' });
  }
});

router.get('/me', requireAuth as any, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      'SELECT id, email, is_admin, created_at FROM users WHERE id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const user = result.rows[0];
    res.json({ user: { ...user, isAdmin: user.is_admin } });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    const result = await query('SELECT id, email FROM users WHERE email = $1', [email.toLowerCase()]);

    if (result.rows.length === 0) {
      res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
      return;
    }

    const user = result.rows[0];
    const resetToken = crypto.randomBytes(32).toString('hex');
    await storeResetToken(resetToken, user.id);

    const appUrl = process.env.APP_URL || 'http://localhost';
    const previewResetUrl = `${appUrl}/reset-password?token=${resetToken}`;
    const mailboxPreviewUrl = process.env.MAILHOG_UI_URL || 'http://localhost:8025';
    await redis.set(`reset:${resetToken}`, user.id, 'EX', 3600);

    const previewResetUrl = `${process.env.APP_URL || 'http://localhost'}/reset-password?token=${resetToken}`;

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
    const { token, password } = req.body;

    if (!token || !password) {
      res.status(400).json({ error: 'Token and new password are required' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    const userId = await consumeResetToken(token);
    const userId = await redis.get(`reset:${token}`);

    if (!userId) {
      res.status(400).json({ error: 'Invalid or expired reset token' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, userId]);
    await redis.del(`reset:${token}`);

    res.json({ message: 'Password has been reset successfully. You can now sign in.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

router.get('/verify', async (req: Request, res: Response) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ valid: false });
    return;
  }

  const token = header.slice(7);

  try {
    if (isRedisAvailable()) {
      const session = await getSession(token);
      if (session === 'revoked') {
        res.status(401).json({ valid: false });
        return;
      }
    const session = await getSession(token);
    if (session === 'revoked') {
      res.status(401).json({ valid: false });
      return;
    }

    const payload = verifyToken(token);
    res.json({ valid: true, user: { id: payload.userId, email: payload.email, isAdmin: payload.isAdmin } });
  } catch {
    res.status(401).json({ valid: false });
  }
});

export default router;

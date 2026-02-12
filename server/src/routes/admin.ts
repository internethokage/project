import { RequestHandler, Router, Response } from 'express';
import crypto from 'crypto';
import { query } from '../db.js';
import { AuthRequest, requireAdmin, requireAuth } from '../middleware/auth.js';
import { setResetToken } from '../redis.js';

const router = Router();
const requireAuthHandler = requireAuth as RequestHandler;
const requireAdminHandler = requireAdmin as RequestHandler;

router.use(requireAuthHandler, requireAdminHandler);

router.get('/users', async (_req: AuthRequest, res: Response) => {
  try {
    const users = await query(
      `SELECT
        u.id,
        u.email,
        u.is_admin,
        u.created_at,
        COALESCE(o.occasion_count, 0) AS occasion_count,
        COALESCE(p.people_count, 0) AS people_count,
        COALESCE(g.gift_count, 0) AS gift_count
      FROM users u
      LEFT JOIN (
        SELECT user_id, COUNT(*)::int AS occasion_count
        FROM occasions
        GROUP BY user_id
      ) o ON o.user_id = u.id
      LEFT JOIN (
        SELECT user_id, COUNT(*)::int AS people_count
        FROM people
        GROUP BY user_id
      ) p ON p.user_id = u.id
      LEFT JOIN (
        SELECT user_id, COUNT(*)::int AS gift_count
        FROM gifts
        GROUP BY user_id
      ) g ON g.user_id = u.id
      ORDER BY u.created_at DESC`
    );

    res.json({ users: users.rows });
  } catch (error) {
    console.error('Admin users list error:', error);
    res.status(500).json({ error: 'Failed to load users' });
  }
});

router.patch('/users/:id/admin', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { isAdmin } = req.body as { isAdmin?: boolean };

    if (typeof isAdmin !== 'boolean') {
      res.status(400).json({ error: 'isAdmin boolean is required' });
      return;
    }

    if (req.userId === id && !isAdmin) {
      const otherAdmins = await query('SELECT COUNT(*)::int AS count FROM users WHERE is_admin = true AND id <> $1', [id]);
      if (otherAdmins.rows[0].count === 0) {
        res.status(400).json({ error: 'At least one admin account must remain' });
        return;
      }
    }

    const result = await query('UPDATE users SET is_admin = $1 WHERE id = $2 RETURNING id, email, is_admin, created_at', [isAdmin, id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Admin update role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

router.delete('/users/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (req.userId === id) {
      res.status(400).json({ error: 'You cannot delete your own account from admin panel' });
      return;
    }

    const user = await query('SELECT id, is_admin FROM users WHERE id = $1', [id]);
    if (user.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (user.rows[0].is_admin) {
      const otherAdmins = await query('SELECT COUNT(*)::int AS count FROM users WHERE is_admin = true AND id <> $1', [id]);
      if (otherAdmins.rows[0].count === 0) {
        res.status(400).json({ error: 'At least one admin account must remain' });
        return;
      }
    }

    await query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'User deleted' });
  } catch (error) {
    console.error('Admin delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

router.post('/users/:id/reset-link', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = await query('SELECT id FROM users WHERE id = $1', [id]);
    if (user.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    await setResetToken(resetToken, id, 3600);
    const resetUrl = `${process.env.APP_URL || 'http://localhost'}/reset-password?token=${resetToken}`;

    res.json({ resetUrl });
  } catch (error) {
    console.error('Admin create reset link error:', error);
    res.status(500).json({ error: 'Failed to create reset link' });
  }
});

export default router;

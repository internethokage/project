import { Router, Response } from 'express';
import { query } from '../db.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { getCached, setCache, invalidateCache } from '../redis.js';

const router = Router();
router.use(requireAuth as any);

const CACHE_KEY = 'people';

// GET /api/people
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const cached = await getCached(userId, CACHE_KEY);
    if (cached) {
      res.json(cached);
      return;
    }

    const result = await query(
      'SELECT * FROM people WHERE user_id = $1 ORDER BY name ASC',
      [userId]
    );

    await setCache(userId, CACHE_KEY, result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error('Get people error:', err);
    res.status(500).json({ error: 'Failed to fetch people' });
  }
});

// POST /api/people
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { name, relationship, budget } = req.body;

    if (!name || !relationship) {
      res.status(400).json({ error: 'Name and relationship are required' });
      return;
    }

    const result = await query(
      'INSERT INTO people (name, relationship, budget, user_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, relationship, budget || 0, userId]
    );

    await invalidateCache(userId, CACHE_KEY);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Add person error:', err);
    res.status(500).json({ error: 'Failed to add person' });
  }
});

// DELETE /api/people/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const result = await query(
      'DELETE FROM people WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Person not found' });
      return;
    }

    await invalidateCache(userId, CACHE_KEY);
    // Also invalidate gifts since cascade delete removes related gifts
    await invalidateCache(userId, 'gifts');
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('Delete person error:', err);
    res.status(500).json({ error: 'Failed to delete person' });
  }
});

export default router;

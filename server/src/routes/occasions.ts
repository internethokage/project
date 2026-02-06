import { Router, Response } from 'express';
import { query } from '../db.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { getCached, setCache, invalidateCache } from '../redis.js';

const router = Router();
router.use(requireAuth as any);

const CACHE_KEY = 'occasions';

// GET /api/occasions
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    // Check cache
    const cached = await getCached(userId, CACHE_KEY);
    if (cached) {
      res.json(cached);
      return;
    }

    const result = await query(
      'SELECT * FROM occasions WHERE user_id = $1 ORDER BY date ASC',
      [userId]
    );

    await setCache(userId, CACHE_KEY, result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error('Get occasions error:', err);
    res.status(500).json({ error: 'Failed to fetch occasions' });
  }
});

// POST /api/occasions
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { type, date, budget } = req.body;

    if (!type || !date) {
      res.status(400).json({ error: 'Type and date are required' });
      return;
    }

    const result = await query(
      'INSERT INTO occasions (type, date, budget, user_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [type, date, budget || 0, userId]
    );

    await invalidateCache(userId, CACHE_KEY);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Add occasion error:', err);
    res.status(500).json({ error: 'Failed to add occasion' });
  }
});

// DELETE /api/occasions/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const result = await query(
      'DELETE FROM occasions WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Occasion not found' });
      return;
    }

    await invalidateCache(userId, CACHE_KEY);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('Delete occasion error:', err);
    res.status(500).json({ error: 'Failed to delete occasion' });
  }
});

export default router;

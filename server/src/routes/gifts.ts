import { RequestHandler, Router, Response } from 'express';
import { query } from '../db.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { getCached, setCache, invalidateCache } from '../redis.js';

const router = Router();
const requireAuthHandler = requireAuth as RequestHandler;
router.use(requireAuthHandler);

const CACHE_KEY = 'gifts';

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const cached = await getCached(userId, CACHE_KEY);
    if (cached) {
      res.json(cached);
      return;
    }

    const result = await query(
      'SELECT * FROM gifts WHERE user_id = $1 ORDER BY date_added DESC',
      [userId]
    );

    await setCache(userId, CACHE_KEY, result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error('Get gifts error:', err);
    res.status(500).json({ error: 'Failed to fetch gifts' });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { person_id, title, price, url, notes, status } = req.body;

    if (!person_id || !title) {
      res.status(400).json({ error: 'person_id and title are required' });
      return;
    }

    const personCheck = await query(
      'SELECT id FROM people WHERE id = $1 AND user_id = $2',
      [person_id, userId]
    );
    if (personCheck.rows.length === 0) {
      res.status(404).json({ error: 'Person not found' });
      return;
    }

    const result = await query(
      `INSERT INTO gifts (person_id, title, price, url, notes, status, user_id, date_added)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING *`,
      [person_id, title, price || 0, url || null, notes || null, status || 'idea', userId]
    );

    await invalidateCache(userId, CACHE_KEY);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Add gift error:', err);
    res.status(500).json({ error: 'Failed to add gift' });
  }
});

router.patch('/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['idea', 'purchased', 'given'].includes(status)) {
      res.status(400).json({ error: 'Valid status required (idea, purchased, given)' });
      return;
    }

    let extraFields = '';
    const params: [string, string, string] = [status, id, userId];

    if (status === 'purchased') {
      extraFields = ', date_purchased = NOW()';
    } else if (status === 'given') {
      extraFields = ', date_given = NOW()';
    }

    const result = await query(
      `UPDATE gifts SET status = $1${extraFields} WHERE id = $2 AND user_id = $3 RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Gift not found' });
      return;
    }

    await invalidateCache(userId, CACHE_KEY);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update gift status error:', err);
    res.status(500).json({ error: 'Failed to update gift status' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const result = await query(
      'DELETE FROM gifts WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Gift not found' });
      return;
    }

    await invalidateCache(userId, CACHE_KEY);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('Delete gift error:', err);
    res.status(500).json({ error: 'Failed to delete gift' });
  }
});

export default router;

import { RequestHandler, Router, Response } from 'express';
import { query } from '../db.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { getCached, setCache, invalidateCache } from '../redis.js';

const router = Router();
const requireAuthHandler = requireAuth as RequestHandler;
router.use(requireAuthHandler);

const CACHE_KEY = 'people';

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

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { name, relationship, budget, notes } = req.body;

    if (!name || !relationship) {
      res.status(400).json({ error: 'Name and relationship are required' });
      return;
    }

    const result = await query(
      'INSERT INTO people (name, relationship, budget, notes, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, relationship, budget || 0, notes ?? null, userId]
    );

    await invalidateCache(userId, CACHE_KEY);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Add person error:', err);
    res.status(500).json({ error: 'Failed to add person' });
  }
});

router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { name, relationship, budget, notes } = req.body;

    // Build dynamic SET clause for only provided fields
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (name !== undefined) { fields.push(`name = $${idx++}`); values.push(name); }
    if (relationship !== undefined) { fields.push(`relationship = $${idx++}`); values.push(relationship); }
    if (budget !== undefined) { fields.push(`budget = $${idx++}`); values.push(budget); }
    if (notes !== undefined) { fields.push(`notes = $${idx++}`); values.push(notes); }

    if (fields.length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }

    values.push(id, userId);
    const result = await query(
      `UPDATE people SET ${fields.join(', ')} WHERE id = $${idx++} AND user_id = $${idx} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Person not found' });
      return;
    }

    await invalidateCache(userId, CACHE_KEY);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update person error:', err);
    res.status(500).json({ error: 'Failed to update person' });
  }
});

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
    await invalidateCache(userId, 'gifts');
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('Delete person error:', err);
    res.status(500).json({ error: 'Failed to delete person' });
  }
});

export default router;

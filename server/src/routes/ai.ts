/**
 * Server-side AI suggestions endpoint.
 *
 * Uses AI_API_KEY, AI_BASE_URL, AI_MODEL from server .env.
 * The client never needs to configure or store LLM credentials.
 *
 * POST /api/ai/suggestions
 * Body: { personName, relationship, budget, notes?, existingGifts? }
 * Response: { suggestions: GiftSuggestion[] }
 *
 * Returns 503 if the server has no AI config (client should fall back to local config).
 */
import { RequestHandler, Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();
const requireAuthHandler = requireAuth as RequestHandler;
router.use(requireAuthHandler);

interface ExistingGift {
  title: string;
  price?: number;
  status?: string;
  notes?: string | null;
  description?: string;
}

interface SuggestionsRequestBody {
  personName: string;
  relationship: string;
  budget: number;
  notes?: string | null;
  existingGifts?: ExistingGift[];
}

interface GiftSuggestion {
  title: string;
  description: string;
  estimatedPrice: number;
  reason: string;
}

router.post('/suggestions', async (req: AuthRequest, res: Response) => {
  const AI_API_KEY = process.env.AI_API_KEY;
  const AI_BASE_URL = process.env.AI_BASE_URL;
  const AI_MODEL = process.env.AI_MODEL;

  // If not configured, tell the client to fall back to its local config
  if (!AI_API_KEY || !AI_BASE_URL || !AI_MODEL) {
    res.status(503).json({ error: 'Server AI not configured' });
    return;
  }

  const {
    personName,
    relationship,
    budget,
    notes,
    existingGifts = [],
  }: SuggestionsRequestBody = req.body;

  if (!personName || !relationship) {
    res.status(400).json({ error: 'personName and relationship are required' });
    return;
  }

  // Build rich gift history text with full context
  const giftHistoryText = existingGifts.length > 0
    ? existingGifts.map(g => {
        const parts = [`- ${g.title}`];
        if (g.price) parts.push(`($${g.price})`);
        if (g.status) parts.push(`[${g.status}]`);
        if (g.notes) parts.push(`— note: ${g.notes}`);
        return parts.join(' ');
      }).join('\n')
    : 'None yet.';

  const personContext = notes
    ? `\nAbout them: ${notes}`
    : '';

  const budgetSpent = existingGifts
    .filter(g => g.status === 'purchased' || g.status === 'given')
    .reduce((sum, g) => sum + (g.price || 0), 0);

  const url = `${AI_BASE_URL.replace(/\/$/, '')}/chat/completions`;

  const messages = [
    {
      role: 'system',
      content: 'You are a thoughtful gift suggestion assistant for an app called Giftable. You suggest creative, personalized gift ideas. Always respond with valid JSON only, no markdown formatting, no code fences.',
    },
    {
      role: 'user',
      content: `Suggest 4 gift ideas for ${personName} (my ${relationship}).${personContext}

Budget remaining: $${budget}${budgetSpent > 0 ? ` (already spent $${budgetSpent})` : ''}

Their gift history:
${giftHistoryText}

Guidelines:
- Don't repeat gifts they already have
- Use their notes and gift history to make truly personalized suggestions
- Keep prices within the remaining budget
- Be creative and specific — avoid generic gifts

Respond with a JSON array only. Each item must have:
- title: gift name (string)
- description: brief description (string)
- estimatedPrice: cost in dollars (number)
- reason: why this fits them specifically (string)

Return ONLY the JSON array, no other text.`,
    },
  ];

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('AI API error:', response.status, errText);
      res.status(502).json({ error: 'AI request failed', details: errText });
      return;
    }

    const data = await response.json() as {
      choices?: { message?: { content?: string } }[];
    };

    const content = data.choices?.[0]?.message?.content ?? '';

    // Extract JSON array from response (handle any surrounding whitespace/text)
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('AI returned unexpected format:', content);
      res.status(502).json({ error: 'AI returned unexpected format', raw: content });
      return;
    }

    const suggestions: GiftSuggestion[] = JSON.parse(jsonMatch[0]);
    const validated = suggestions.filter(
      s => s.title && typeof s.estimatedPrice === 'number'
    );

    res.json({ suggestions: validated });
  } catch (err) {
    console.error('AI suggestions error:', err);
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
});

export default router;

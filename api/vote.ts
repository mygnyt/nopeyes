import type { VercelRequest, VercelResponse } from '@vercel/node';
import { validateTelegramInitData, TelegramUser } from './_auth.js';
import {
  getOrCreateUser,
  recordUserVote,
} from './_db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Telegram-Init-Data');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const botToken = process.env.BOT_TOKEN || '';
    const initData = (req.headers['x-telegram-init-data'] as string) || (req.body?.initData as string) || '';

    let user: TelegramUser | null = null;

    if (initData) {
      const validation = validateTelegramInitData(initData, botToken);
      if (validation.valid && validation.user) {
        user = validation.user;
      } else {
        console.warn('InitData validation failed on vote:', validation.error);
      }
    }

    // Dev/browser demo fallback
    if (!user && (process.env.NODE_ENV !== 'production' || !botToken || req.body?.demo === true)) {
      user = {
        id: 999999999,
        first_name: 'Гость',
        username: 'guest_user',
      };
    }

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: Telegram initData invalid or missing' });
    }

    const { questionId, choice } = req.body || {};

    if (!questionId || (choice !== 'A' && choice !== 'B')) {
      return res.status(400).json({ error: 'Invalid request: questionId and choice (A or B) required' });
    }

    const dbUser = await getOrCreateUser(user);
    const result = await recordUserVote(dbUser.id, Number(questionId), choice);

    return res.status(200).json({
      success: result.success,
      alreadyVoted: result.alreadyVoted || false,
      choice,
      newStreak: result.newStreak,
      stats: result.stats,
    });
  } catch (error: any) {
    console.error('Error in /api/vote:', error);
    return res.status(500).json({ error: error?.message || 'Internal server error' });
  }
}

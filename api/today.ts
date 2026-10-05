import type { VercelRequest, VercelResponse } from '@vercel/node';
import { validateTelegramInitData, TelegramUser } from './_auth.js';
import {
  getTodayQuestion,
  getOrCreateUser,
  getUserVoteForQuestion,
  getQuestionStats,
} from './_db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Telegram-Init-Data');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const botToken = process.env.BOT_TOKEN || '';
    const initData = (req.headers['x-telegram-init-data'] as string) || (req.query.initData as string) || '';

    let user: TelegramUser | null = null;

    if (initData) {
      const validation = validateTelegramInitData(initData, botToken);
      if (validation.valid && validation.user) {
        user = validation.user;
      } else {
        console.warn('InitData validation failed:', validation.error);
      }
    }

    // In non-production or for browser test without Telegram:
    if (!user && (process.env.NODE_ENV !== 'production' || !botToken || req.query.demo === 'true')) {
      user = {
        id: 999999999,
        first_name: 'Гость',
        username: 'guest_user',
      };
    }

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: Telegram initData invalid or missing' });
    }

    const dbUser = await getOrCreateUser(user);
    const question = await getTodayQuestion();
    const existingVote = await getUserVoteForQuestion(dbUser.id, question.id);

    let stats = null;
    if (existingVote) {
      stats = await getQuestionStats(question.id);
    }

    return res.status(200).json({
      question: {
        id: question.id,
        text: question.text,
        option_a: question.option_a,
        option_b: question.option_b,
        date: question.date,
      },
      user: {
        id: dbUser.id,
        first_name: dbUser.first_name || user.first_name,
        streak: dbUser.streak || 0,
      },
      hasVoted: Boolean(existingVote),
      userChoice: existingVote,
      stats,
    });
  } catch (error: any) {
    console.error('Error in /api/today:', error);
    return res.status(500).json({ error: error?.message || 'Internal server error' });
  }
}

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initDatabase, getDbPool } from './_db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const hasDb = Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL);
    if (!hasDb) {
      return res.status(200).json({
        success: false,
        message: 'DATABASE_URL is not configured. Running in in-memory fallback mode.',
      });
    }

    const success = await initDatabase();
    return res.status(200).json({
      success,
      message: success
        ? 'Postgres database initialized and 30 questions seeded successfully!'
        : 'Failed to initialize database. Check logs.',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Seed error' });
  }
}

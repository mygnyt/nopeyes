import pg from 'pg';
import { SEED_QUESTIONS } from './_questions_data.js';

const { Pool } = pg;

let pool: pg.Pool | null = null;
let initialized = false;

// Fallback in-memory store if DATABASE_URL is not yet provided
interface MemoryUser {
  id: number;
  telegram_id: number;
  username?: string;
  first_name?: string;
  streak: number;
  last_vote_date?: string;
}

interface MemoryVote {
  user_id: number;
  question_id: number;
  choice: string;
}

const memoryStore = {
  users: new Map<number, MemoryUser>(), // key: telegram_id
  votes: new Map<string, MemoryVote>(), // key: `${user_id}_${question_id}`
  questionSeedVotes: new Map<number, { a: number; b: number }>(),
};

export function getDbPool(): pg.Pool | null {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) {
    return null;
  }

  if (!pool) {
    pool = new Pool({
      connectionString,
      ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
    });
  }
  return pool;
}

export async function initDatabase(): Promise<boolean> {
  const db = getDbPool();
  if (!db) {
    console.warn('DATABASE_URL not set. Operating in in-memory fallback mode.');
    return false;
  }

  if (initialized) {
    return true;
  }

  try {
    const client = await db.connect();
    try {
      // 1. Create users table
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          telegram_id BIGINT UNIQUE NOT NULL,
          username VARCHAR(255),
          first_name VARCHAR(255),
          streak INT DEFAULT 0,
          last_vote_date DATE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);

      // 2. Create questions table
      await client.query(`
        CREATE TABLE IF NOT EXISTS questions (
          id SERIAL PRIMARY KEY,
          text TEXT NOT NULL,
          option_a TEXT NOT NULL,
          option_b TEXT NOT NULL,
          date DATE UNIQUE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);

      // 3. Create votes table
      await client.query(`
        CREATE TABLE IF NOT EXISTS votes (
          id SERIAL PRIMARY KEY,
          user_id INT REFERENCES users(id) ON DELETE CASCADE,
          question_id INT REFERENCES questions(id) ON DELETE CASCADE,
          choice VARCHAR(1) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          CONSTRAINT unique_user_question UNIQUE (user_id, question_id)
        );
      `);

      // 4. Seed 30 questions if not populated
      const { rows } = await client.query('SELECT COUNT(*) as count FROM questions');
      const count = parseInt(rows[0].count, 10);

      if (count < SEED_QUESTIONS.length) {
        console.log(`Seeding ${SEED_QUESTIONS.length} moral dilemmas...`);
        // We anchor dates starting from today minus 2 days so today is day #3
        const today = new Date();
        for (let i = 0; i < SEED_QUESTIONS.length; i++) {
          const item = SEED_QUESTIONS[i];
          const qDate = new Date(today);
          qDate.setDate(today.getDate() - 2 + i);
          const dateStr = qDate.toISOString().split('T')[0];

          await client.query(
            `INSERT INTO questions (text, option_a, option_b, date)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (date) DO UPDATE 
             SET text = EXCLUDED.text, option_a = EXCLUDED.option_a, option_b = EXCLUDED.option_b`,
            [item.text, item.option_a, item.option_b, dateStr]
          );
        }
      }

      initialized = true;
      return true;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Failed to init PostgreSQL database:', err);
    return false;
  }
}

export interface QuestionRecord {
  id: number;
  text: string;
  option_a: string;
  option_b: string;
  date: string;
}

export interface VoteStats {
  countA: number;
  countB: number;
  percentA: number;
  percentB: number;
  total: number;
}

export async function getTodayQuestion(): Promise<QuestionRecord> {
  const db = getDbPool();
  const todayStr = new Date().toISOString().split('T')[0];

  if (db) {
    await initDatabase();
    // Try exact date
    const res = await db.query(
      'SELECT id, text, option_a, option_b, to_char(date, \'YYYY-MM-DD\') as date FROM questions WHERE date = $1 LIMIT 1',
      [todayStr]
    );

    if (res.rows.length > 0) {
      return res.rows[0];
    }

    // Fallback: pick today by day of year modulo total questions
    const all = await db.query(
      'SELECT id, text, option_a, option_b, to_char(date, \'YYYY-MM-DD\') as date FROM questions ORDER BY id ASC'
    );
    if (all.rows.length > 0) {
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 0);
      const diff = now.getTime() - start.getTime();
      const oneDay = 1000 * 60 * 60 * 24;
      const dayOfYear = Math.floor(diff / oneDay);
      const index = dayOfYear % all.rows.length;
      return all.rows[index];
    }
  }

  // In-memory fallback
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  const idx = dayOfYear % SEED_QUESTIONS.length;
  const q = SEED_QUESTIONS[idx];

  return {
    id: idx + 1,
    text: q.text,
    option_a: q.option_a,
    option_b: q.option_b,
    date: todayStr,
  };
}

export async function getOrCreateUser(telegramUser: {
  id: number;
  username?: string;
  first_name?: string;
}) {
  const db = getDbPool();

  if (db) {
    await initDatabase();
    const query = `
      INSERT INTO users (telegram_id, username, first_name)
      VALUES ($1, $2, $3)
      ON CONFLICT (telegram_id) DO UPDATE
      SET username = COALESCE(EXCLUDED.username, users.username),
          first_name = COALESCE(EXCLUDED.first_name, users.first_name)
      RETURNING id, telegram_id, username, first_name, streak, to_char(last_vote_date, 'YYYY-MM-DD') as last_vote_date;
    `;
    const res = await db.query(query, [
      telegramUser.id,
      telegramUser.username || null,
      telegramUser.first_name || 'Anonymous',
    ]);
    return res.rows[0];
  }

  // Memory fallback
  let user = memoryStore.users.get(telegramUser.id);
  if (!user) {
    user = {
      id: memoryStore.users.size + 1,
      telegram_id: telegramUser.id,
      username: telegramUser.username,
      first_name: telegramUser.first_name || 'Anonymous',
      streak: 0,
    };
    memoryStore.users.set(telegramUser.id, user);
  }
  return user;
}

export async function getUserVoteForQuestion(userId: number, questionId: number): Promise<string | null> {
  const db = getDbPool();
  if (db) {
    const res = await db.query(
      'SELECT choice FROM votes WHERE user_id = $1 AND question_id = $2 LIMIT 1',
      [userId, questionId]
    );
    if (res.rows.length > 0) {
      return res.rows[0].choice;
    }
    return null;
  }

  const voteKey = `${userId}_${questionId}`;
  const v = memoryStore.votes.get(voteKey);
  return v ? v.choice : null;
}

export async function getQuestionStats(questionId: number): Promise<VoteStats> {
  const db = getDbPool();

  // Baseline community votes for organic feeling
  // Seeded deterministic numbers based on questionId
  const baseA = ((questionId * 47) % 31) + 24;
  const baseB = ((questionId * 83) % 33) + 21;

  if (db) {
    const res = await db.query(
      `SELECT 
        COUNT(CASE WHEN choice = 'A' THEN 1 END) as count_a,
        COUNT(CASE WHEN choice = 'B' THEN 1 END) as count_b
       FROM votes WHERE question_id = $1`,
      [questionId]
    );
    const countA = parseInt(res.rows[0]?.count_a || '0', 10) + baseA;
    const countB = parseInt(res.rows[0]?.count_b || '0', 10) + baseB;
    const total = countA + countB;
    const percentA = total > 0 ? Math.round((countA / total) * 100) : 50;
    const percentB = 100 - percentA;

    return { countA, countB, percentA, percentB, total };
  }

  // Memory fallback stats
  let voteCountA = 0;
  let voteCountB = 0;
  memoryStore.votes.forEach((v) => {
    if (v.question_id === questionId) {
      if (v.choice === 'A') voteCountA++;
      if (v.choice === 'B') voteCountB++;
    }
  });

  const totalA = voteCountA + baseA;
  const totalB = voteCountB + baseB;
  const total = totalA + totalB;
  const percentA = Math.round((totalA / total) * 100);
  const percentB = 100 - percentA;

  return {
    countA: totalA,
    countB: totalB,
    percentA,
    percentB,
    total,
  };
}

export async function recordUserVote(userId: number, questionId: number, choice: 'A' | 'B'): Promise<{
  success: boolean;
  newStreak: number;
  stats: VoteStats;
  alreadyVoted?: boolean;
}> {
  const db = getDbPool();
  const todayStr = new Date().toISOString().split('T')[0];

  if (db) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      // Check if already voted
      const existing = await client.query(
        'SELECT choice FROM votes WHERE user_id = $1 AND question_id = $2',
        [userId, questionId]
      );

      if (existing.rows.length > 0) {
        await client.query('ROLLBACK');
        const userRes = await client.query('SELECT streak FROM users WHERE id = $1', [userId]);
        const stats = await getQuestionStats(questionId);
        return {
          success: false,
          alreadyVoted: true,
          newStreak: userRes.rows[0]?.streak || 1,
          stats,
        };
      }

      // Record vote
      await client.query(
        'INSERT INTO votes (user_id, question_id, choice) VALUES ($1, $2, $3)',
        [userId, questionId, choice]
      );

      // Calculate streak
      const userRes = await client.query(
        'SELECT streak, to_char(last_vote_date, \'YYYY-MM-DD\') as last_vote_date FROM users WHERE id = $1',
        [userId]
      );
      const user = userRes.rows[0];
      let newStreak = 1;

      if (user && user.last_vote_date) {
        const lastVote = new Date(user.last_vote_date);
        const today = new Date(todayStr);
        const diffDays = Math.round((today.getTime() - lastVote.getTime()) / (1000 * 3600 * 24));

        if (diffDays === 1) {
          // Consecutive day!
          newStreak = (user.streak || 0) + 1;
        } else if (diffDays === 0) {
          newStreak = user.streak || 1;
        } else {
          // Streak broken
          newStreak = 1;
        }
      }

      await client.query(
        'UPDATE users SET streak = $1, last_vote_date = $2 WHERE id = $3',
        [newStreak, todayStr, userId]
      );

      await client.query('COMMIT');
      const stats = await getQuestionStats(questionId);

      return {
        success: true,
        newStreak,
        stats,
      };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  // Memory fallback
  const voteKey = `${userId}_${questionId}`;
  if (memoryStore.votes.has(voteKey)) {
    const stats = await getQuestionStats(questionId);
    let u: MemoryUser | undefined;
    memoryStore.users.forEach(user => { if (user.id === userId) u = user; });
    return {
      success: false,
      alreadyVoted: true,
      newStreak: u?.streak || 1,
      stats,
    };
  }

  memoryStore.votes.set(voteKey, { user_id: userId, question_id: questionId, choice });

  let user: MemoryUser | undefined;
  memoryStore.users.forEach(u => { if (u.id === userId) user = u; });
  let newStreak = 1;

  if (user) {
    if (user.last_vote_date) {
      const lastVote = new Date(user.last_vote_date);
      const today = new Date(todayStr);
      const diffDays = Math.round((today.getTime() - lastVote.getTime()) / (1000 * 3600 * 24));
      if (diffDays === 1) {
        newStreak = user.streak + 1;
      } else if (diffDays === 0) {
        newStreak = user.streak;
      } else {
        newStreak = 1;
      }
    }
    user.streak = newStreak;
    user.last_vote_date = todayStr;
  }

  const stats = await getQuestionStats(questionId);
  return {
    success: true,
    newStreak,
    stats,
  };
}

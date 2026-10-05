import pg from 'pg';
import dotenv from 'dotenv';
import { SEED_QUESTIONS } from '../api/_questions_data.js';

dotenv.config();

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  console.log('DATABASE_URL is not set in environment.');
  process.exit(0);
}

const pool = new pg.Pool({
  connectionString,
  ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
});

async function run() {
  console.log('Connecting to Postgres...');
  const client = await pool.connect();
  try {
    console.log('Creating tables...');
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

      CREATE TABLE IF NOT EXISTS questions (
        id SERIAL PRIMARY KEY,
        text TEXT NOT NULL,
        option_a TEXT NOT NULL,
        option_b TEXT NOT NULL,
        date DATE UNIQUE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS votes (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        question_id INT REFERENCES questions(id) ON DELETE CASCADE,
        choice VARCHAR(1) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT unique_user_question UNIQUE (user_id, question_id)
      );
    `);

    console.log(`Seeding ${SEED_QUESTIONS.length} moral dilemmas...`);
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

    console.log('Successfully seeded database!');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

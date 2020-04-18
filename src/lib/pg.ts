import postgres from 'pg';

export const db = new postgres.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

db.connect();

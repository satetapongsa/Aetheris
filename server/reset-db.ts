import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

const databaseUrl = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_b4xYDG9yopsf@ep-purple-wind-b3sup1zb-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const sql = neon(databaseUrl);

async function resetDb() {
  console.log('[Reset DB] Connecting to Neon Database...');
  
  console.log('[Reset DB] Dropping old tables...');
  await sql`DROP TABLE IF EXISTS messages CASCADE;`;
  await sql`DROP TABLE IF EXISTS sessions CASCADE;`;
  await sql`DROP TABLE IF EXISTS users CASCADE;`;

  console.log('[Reset DB] Creating fresh users table...');
  await sql`
    CREATE TABLE users (
      id VARCHAR(64) PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      password_hash TEXT NOT NULL,
      tier VARCHAR(32) DEFAULT 'FREE',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  console.log('[Reset DB] Creating fresh sessions table...');
  await sql`
    CREATE TABLE sessions (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL,
      title VARCHAR(255) NOT NULL,
      topic TEXT,
      category VARCHAR(32) DEFAULT 'today',
      icon VARCHAR(64) DEFAULT 'chat_bubble',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  console.log('[Reset DB] Creating fresh messages table...');
  await sql`
    CREATE TABLE messages (
      id SERIAL PRIMARY KEY,
      session_id VARCHAR(64) NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      sender VARCHAR(16) NOT NULL,
      content TEXT,
      model_name VARCHAR(64),
      duration VARCHAR(32),
      thought_summary TEXT,
      thought_details TEXT,
      paragraphs JSONB,
      feature_cards JSONB,
      code_block JSONB,
      suggestions JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  console.log('[Reset DB] Neon Database tables created successfully!');
}

resetDb().catch(err => {
  console.error('[Reset DB Error]:', err);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * Check actual schema columns
 */

const { Pool } = require('pg');

const pool = new Pool({
  host: 'db.vhqzmunorymtoisijiqb.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Vertrouwen17#',
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkSchema() {
  const client = await pool.connect();

  try {
    const tables = ['profiles', 'guides', 'agencies', 'availability_slots', 'conversations', 'conversation_participants'];

    for (const table of tables) {
      console.log(`\n${table} columns:`);
      console.log('='.repeat(80));

      const result = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position;
      `, [table]);

      console.table(result.rows);
    }

  } finally {
    client.release();
    await pool.end();
  }
}

checkSchema().catch(console.error);

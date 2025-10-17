#!/usr/bin/env node
import pg from 'pg';

const { Client } = pg;

async function checkStructures() {
  const connectionString = "postgresql://postgres:Vertrouwen17%23@db.vhqzmunorymtoisijiqb.supabase.co:5432/postgres";
  const client = new Client({ connectionString });

  try {
    await client.connect();

    const tables = ['countries', 'regions', 'cities'];

    for (const table of tables) {
      console.log(`\n📋 Table: ${table}`);
      console.log('═'.repeat(50));

      const columns = await client.query(`
        SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position;
      `, [table]);

      columns.rows.forEach(row => {
        const nullable = row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const length = row.character_maximum_length ? `(${row.character_maximum_length})` : '';
        const def = row.column_default ? ` DEFAULT ${row.column_default}` : '';
        console.log(`  ${row.column_name.padEnd(20)} ${row.data_type}${length.padEnd(10)} ${nullable}${def}`);
      });

      // Check row count
      const count = await client.query(`SELECT COUNT(*) FROM public.${table}`);
      console.log(`\n  📊 Rows: ${count.rows[0].count}`);
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkStructures();

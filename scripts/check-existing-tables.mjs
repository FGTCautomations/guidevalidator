#!/usr/bin/env node
import pg from 'pg';

const { Client } = pg;

async function checkTables() {
  const connectionString = "postgresql://postgres:Vertrouwen17%23@db.vhqzmunorymtoisijiqb.supabase.co:5432/postgres";
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('✅ Connected\n');

    // Check for countries table
    const countriesCheck = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'countries'
      ORDER BY ordinal_position;
    `);

    if (countriesCheck.rows.length > 0) {
      console.log('📊 Existing countries table columns:');
      countriesCheck.rows.forEach(row => {
        console.log(`   - ${row.column_name}: ${row.data_type}`);
      });
    } else {
      console.log('❌ No countries table found');
    }

    // Check for other location tables
    const tables = ['regions', 'cities', 'national_parks', 'tourist_attractions'];
    console.log('\n📋 Checking other location tables:');
    for (const table of tables) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = $1
        );
      `, [table]);
      console.log(`   - ${table}: ${result.rows[0].exists ? '✅ Exists' : '❌ Missing'}`);
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkTables();

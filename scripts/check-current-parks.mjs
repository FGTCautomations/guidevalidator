#!/usr/bin/env node
import pg from 'pg';
const { Client } = pg;

const connectionString = "postgresql://postgres:Vertrouwen17%23@db.vhqzmunorymtoisijiqb.supabase.co:5432/postgres";

async function checkCurrentParks() {
  const client = new Client({ connectionString });

  try {
    await client.connect();

    console.log('🔍 Checking current national_parks table...\n');

    // Check if table exists and its schema
    const schema = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'national_parks'
      ORDER BY ordinal_position;
    `);

    if (schema.rows.length === 0) {
      console.log('❌ Table "national_parks" does not exist or is empty\n');
      return;
    }

    console.log('📋 Current schema:');
    schema.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(required)' : '(optional)'}`);
    });

    // Check current data
    const count = await client.query('SELECT COUNT(*) FROM public.national_parks');
    console.log(`\n📊 Current data: ${count.rows[0].count} parks\n`);

    if (parseInt(count.rows[0].count) > 0) {
      const sample = await client.query(`
        SELECT id, name, country_code, region_id, unesco_site
        FROM public.national_parks
        LIMIT 10;
      `);

      console.log('Sample parks:');
      sample.rows.forEach((park, i) => {
        const linked = park.region_id ? '🔗' : '❌';
        const unesco = park.unesco_site ? '🌍' : '  ';
        console.log(`   ${i + 1}. ${linked} ${unesco} ${park.name} (${park.country_code})`);
      });
    }

    // Check stage table
    console.log('\n' + '═'.repeat(60));
    console.log('\n🔍 Checking national_parks_stage table...\n');

    const stageCount = await client.query('SELECT COUNT(*) FROM public.national_parks_stage');
    console.log(`📊 Stage table data: ${stageCount.rows[0].count} parks\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

checkCurrentParks();

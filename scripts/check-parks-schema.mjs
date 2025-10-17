#!/usr/bin/env node
import pg from 'pg';
const { Client } = pg;

const connectionString = "postgresql://postgres:Vertrouwen17%23@db.vhqzmunorymtoisijiqb.supabase.co:5432/postgres";

async function checkSchema() {
  const client = new Client({ connectionString });

  try {
    await client.connect();

    console.log('🔍 Checking national_parks table schema...\n');

    const schema = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'national_parks'
      ORDER BY ordinal_position;
    `);

    console.log('📋 Columns in national_parks table:');
    schema.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(required)' : '(optional)'}`);
    });

    console.log('\n🔍 Checking national_parks_stage table schema...\n');

    const stageSchema = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'national_parks_stage'
      ORDER BY ordinal_position;
    `);

    console.log('📋 Columns in national_parks_stage table:');
    stageSchema.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(required)' : '(optional)'}`);
    });

    // Get sample data from stage
    console.log('\n🔍 Sample data from national_parks_stage (first 5 rows):\n');

    const sample = await client.query(`
      SELECT * FROM public.national_parks_stage
      LIMIT 5;
    `);

    sample.rows.forEach((row, i) => {
      console.log(`\n${i + 1}. ${row.name}`);
      Object.entries(row).forEach(([key, value]) => {
        if (value !== null && key !== 'name') {
          console.log(`   ${key}: ${value}`);
        }
      });
    });

    // Check how many have country_code
    const withCountry = await client.query(`
      SELECT COUNT(*) FROM public.national_parks_stage
      WHERE country_code IS NOT NULL;
    `);

    const total = await client.query(`
      SELECT COUNT(*) FROM public.national_parks_stage;
    `);

    console.log(`\n📊 Statistics:`);
    console.log(`   Total parks: ${total.rows[0].count}`);
    console.log(`   With country_code: ${withCountry.rows[0].count}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkSchema();

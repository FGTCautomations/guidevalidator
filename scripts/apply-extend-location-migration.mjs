#!/usr/bin/env node
import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function applyMigration() {
  const connectionString = "postgresql://postgres:Vertrouwen17%23@db.vhqzmunorymtoisijiqb.supabase.co:5432/postgres";
  const client = new Client({ connectionString });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully\n');

    // Read migration file
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20251017000001_extend_location_tables.sql');
    console.log(`📖 Reading migration: 20251017000001_extend_location_tables.sql`);
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    console.log('🚀 Applying migration...\n');
    await client.query(migrationSQL);

    console.log('✅ Migration applied successfully!\n');

    // Verify tables
    console.log('🔍 Verifying tables...');
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('countries', 'regions', 'cities', 'national_parks', 'tourist_attractions', 'guide_countries', 'guide_regions', 'guide_cities', 'guide_parks', 'guide_attractions')
      ORDER BY table_name;
    `);

    console.log(`\n✅ Found ${result.rows.length}/10 location tables:`);
    result.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });

    // Check for new columns in countries
    const countriesColumns = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'countries'
      ORDER BY ordinal_position;
    `);

    console.log(`\n✅ Countries table has ${countriesColumns.rows.length} columns:`);
    console.log(`   ${countriesColumns.rows.map(r => r.column_name).join(', ')}`);

    console.log('\n🎉 Extended location database schema ready!');
    console.log('\n📊 Next steps:');
    console.log('   1. Run populate-all-countries.mjs to populate all 195 countries');
    console.log('   2. Run populate-regions.mjs to add regions/provinces');
    console.log('   3. Run populate-cities.mjs to add major cities');
    console.log('   4. Run populate-parks.mjs to add national parks');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration();

#!/usr/bin/env node
import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function applyMigration() {
  // Use direct connection string with URL-encoded password
  const connectionString = "postgresql://postgres:Vertrouwen17%23@db.vhqzmunorymtoisijiqb.supabase.co:5432/postgres";

  const client = new Client({ connectionString });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully\n');

    // Read migration file
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20251017000000_comprehensive_location_tables.sql');
    console.log(`📖 Reading migration: ${migrationPath}`);
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    console.log('🚀 Applying migration...\n');
    await client.query(migrationSQL);

    console.log('✅ Migration applied successfully!\n');

    // Verify tables created
    console.log('🔍 Verifying tables...');
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('countries', 'regions', 'cities', 'national_parks', 'tourist_attractions', 'guide_countries', 'guide_regions', 'guide_cities', 'guide_parks', 'guide_attractions')
      ORDER BY table_name;
    `);

    console.log(`\n✅ Found ${result.rows.length} location tables:`);
    result.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

    // Check policies
    const policiesResult = await client.query(`
      SELECT schemaname, tablename, policyname
      FROM pg_policies
      WHERE tablename IN ('countries', 'regions', 'cities', 'national_parks', 'tourist_attractions')
      ORDER BY tablename, policyname;
    `);

    console.log(`\n✅ Found ${policiesResult.rows.length} RLS policies:`);
    policiesResult.rows.forEach(row => {
      console.log(`   - ${row.tablename}.${row.policyname}`);
    });

    console.log('\n🎉 Location database schema ready!');
    console.log('\n📊 Next steps:');
    console.log('   1. Run populate-countries.mjs to add all 195 countries');
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

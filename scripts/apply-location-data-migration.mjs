#!/usr/bin/env node

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_URL = process.env.SUPABASE_DB_URL || "postgresql://postgres:Vertrouwen17%23@db.vhqzmunorymtoisijiqb.supabase.co:5432/postgres";

async function applyMigration() {
  const client = new Client({
    connectionString: DB_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully');

    console.log('📝 Reading migration file...');
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20251016100000_add_location_data_to_applications.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    console.log('🚀 Applying location_data columns migration...');
    await client.query(migrationSQL);

    console.log('✅ Migration applied successfully!');
    console.log('✅ Added location_data column to guide_applications');
    console.log('✅ Added location_data column to agency_applications');
    console.log('✅ Added location_data column to dmc_applications');
    console.log('✅ Added location_data column to transport_applications');
    console.log('✅ Created GIN indexes for fast JSON queries');

  } catch (err) {
    console.error('❌ Error applying migration:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration();

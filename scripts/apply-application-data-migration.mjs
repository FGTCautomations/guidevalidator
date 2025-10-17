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
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20251016000000_application_data_storage.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    console.log('🚀 Applying application_data storage migration...');
    await client.query(migrationSQL);

    console.log('✅ Migration applied successfully!');
    console.log('✅ Added application_data JSONB column');
    console.log('✅ Added profile completion tracking');
    console.log('✅ Created completion calculation functions');
    console.log('✅ Set up automatic completion updates');

  } catch (err) {
    console.error('❌ Error applying migration:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration();

#!/usr/bin/env node

/**
 * Script to add the missing DELETE policy for the profiles table
 * This allows admins to delete user profiles from the admin panel
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variable - URL encode the password
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
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20251007000000_add_profiles_delete_policy.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    console.log('🚀 Applying migration to add profiles DELETE policy...');
    await client.query(migrationSQL);

    console.log('✅ Migration applied successfully!');
    console.log('✅ Admins can now delete profiles from the admin panel');

  } catch (err) {
    console.error('❌ Error applying migration:', err.message);
    console.log('\n⚠️  Please apply this migration manually in the Supabase SQL Editor:');
    console.log('\n' + readFileSync(join(__dirname, '..', 'supabase', 'migrations', '20251007000000_add_profiles_delete_policy.sql'), 'utf8'));
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration();

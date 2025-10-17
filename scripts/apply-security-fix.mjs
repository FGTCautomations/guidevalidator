#!/usr/bin/env node
import { Client } from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const client = new Client({
  host: 'db.vhqzmunorymtoisijiqb.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Vertrouwen17#',
  ssl: { rejectUnauthorized: false }
});

async function applyMigration() {
  try {
    console.log('🔌 Connecting to Supabase database...');
    await client.connect();
    console.log('✅ Connected successfully\n');

    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20251001000003_fix_function_security.sql');
    console.log('📄 Reading migration:', migrationPath);
    const migration = readFileSync(migrationPath, 'utf-8');

    console.log('🚀 Applying SECURITY DEFINER fix...');
    await client.query(migration);
    console.log('✅ Migration applied successfully!\n');

    // Verify function
    console.log('📊 Verifying function...');
    const { rows } = await client.query(`
      SELECT
        p.proname as function_name,
        CASE p.prosecdef
          WHEN true THEN 'SECURITY DEFINER'
          ELSE 'SECURITY INVOKER'
        END as security_type
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
      AND p.proname = 'is_conversation_participant'
    `);

    if (rows.length > 0) {
      console.log(`✅ Function: ${rows[0].function_name}`);
      console.log(`✅ Security: ${rows[0].security_type}`);
    }

    console.log('\n✅ Security fix complete! RLS recursion should be resolved.');
  } catch (error) {
    console.error('❌ Error applying migration:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

applyMigration();

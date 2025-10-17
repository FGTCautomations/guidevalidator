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

    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20251001000002_fix_rls_recursion.sql');
    console.log('📄 Reading migration:', migrationPath);
    const migration = readFileSync(migrationPath, 'utf-8');

    console.log('🚀 Applying recursion fix migration...');
    await client.query(migration);
    console.log('✅ Migration applied successfully!\n');

    // Verify policies
    console.log('📊 Verifying RLS policies...');
    const { rows: policies } = await client.query(`
      SELECT schemaname, tablename, policyname
      FROM pg_policies
      WHERE tablename = 'conversation_participants'
      ORDER BY policyname
    `);

    console.log('✅ RLS Policies for conversation_participants:');
    policies.forEach(p => {
      console.log(`   - ${p.policyname}`);
    });

    console.log('\n✅ Recursion fix complete! Stack depth error should be resolved.');
  } catch (error) {
    console.error('❌ Error applying migration:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

applyMigration();

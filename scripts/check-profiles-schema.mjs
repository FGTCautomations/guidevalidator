#!/usr/bin/env node
import { Client } from 'pg';

const client = new Client({
  host: 'db.vhqzmunorymtoisijiqb.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Vertrouwen17#',
  ssl: { rejectUnauthorized: false }
});

async function checkSchema() {
  try {
    console.log('🔌 Connecting to Supabase database...');
    await client.connect();
    console.log('✅ Connected successfully\n');

    // Get profiles table columns
    console.log('📊 Checking profiles table schema...');
    const { rows: columns } = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'profiles'
      ORDER BY ordinal_position
    `);

    console.log('\n✅ Profiles table columns:');
    columns.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });

    // Check if onboarded exists
    const hasOnboarded = columns.some(col => col.column_name === 'onboarded');
    console.log(`\n${hasOnboarded ? '✅' : '❌'} onboarded column exists: ${hasOnboarded}`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

checkSchema();

#!/usr/bin/env node

/**
 * Script to verify the DELETE policy exists for the profiles table
 */

import pg from 'pg';
const { Client } = pg;

const DB_URL = process.env.SUPABASE_DB_URL || "postgresql://postgres:Vertrouwen17%23@db.vhqzmunorymtoisijiqb.supabase.co:5432/postgres";

async function verifyPolicy() {
  const client = new Client({
    connectionString: DB_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully\n');

    console.log('🔍 Checking for profiles DELETE policy...');
    const result = await client.query(`
      SELECT
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'profiles'
        AND cmd = 'DELETE'
    `);

    if (result.rows.length === 0) {
      console.log('❌ No DELETE policy found for profiles table');
      console.log('⚠️  The admin delete function will not work!');
      process.exit(1);
    }

    console.log('✅ Found DELETE policy for profiles table:\n');
    result.rows.forEach((row) => {
      console.log(`  Policy Name: ${row.policyname}`);
      console.log(`  Permissive: ${row.permissive}`);
      console.log(`  Roles: ${row.roles}`);
      console.log(`  Command: ${row.cmd}`);
      console.log(`  Using: ${row.qual || 'N/A'}`);
      console.log(`  With Check: ${row.with_check || 'N/A'}`);
      console.log('');
    });

    console.log('✅ DELETE policy verification successful!');
    console.log('✅ Admin users can now delete profiles');

  } catch (err) {
    console.error('❌ Error verifying policy:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

verifyPolicy();

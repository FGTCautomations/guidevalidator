import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Client } = pg;

// Read from .env.local or use environment variable
let DB_URL = process.env.SUPABASE_DB_URL;

if (!DB_URL) {
  // Try reading from .env.local
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/SUPABASE_DB_URL="(.+)"/);
    if (match) {
      DB_URL = match[1];
    }
  }
}

if (!DB_URL) {
  console.error('❌ SUPABASE_DB_URL not found in environment or .env.local');
  process.exit(1);
}

async function applyMigration() {
  // Parse and reconstruct connection string to handle special characters
  const client = new Client({
    host: 'db.vhqzmunorymtoisijiqb.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'Vertrouwen17#',
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to Supabase database...');
    await client.connect();
    console.log('✅ Connected successfully');

    // Read migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20251001000000_abuse_reports.sql');
    console.log(`📄 Reading migration: ${migrationPath}`);

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('🚀 Applying migration...');
    await client.query(migrationSQL);

    console.log('✅ Migration applied successfully!');

    // Verify tables were created
    console.log('\n📊 Verifying tables...');

    const verifyAbuse = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'abuse_reports'
      );
    `);

    const verifyStrikes = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'user_strikes'
      );
    `);

    if (verifyAbuse.rows[0].exists && verifyStrikes.rows[0].exists) {
      console.log('✅ abuse_reports table exists');
      console.log('✅ user_strikes table exists');

      // Check policies
      const policies = await client.query(`
        SELECT tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename IN ('abuse_reports', 'user_strikes')
        ORDER BY tablename, policyname;
      `);

      console.log('\n🔒 RLS Policies created:');
      policies.rows.forEach(row => {
        console.log(`   - ${row.tablename}.${row.policyname}`);
      });

      console.log('\n✅ Migration complete! Chat abuse reporting is ready.');
    } else {
      console.warn('⚠️  Tables may not have been created. Check the migration output above.');
    }

  } catch (error) {
    console.error('❌ Error applying migration:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

applyMigration();

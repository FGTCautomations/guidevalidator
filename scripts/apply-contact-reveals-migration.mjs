import postgres from 'postgres';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sql = postgres('postgresql://postgres:Vertrouwen17%23@db.vhqzmunorymtoisijiqb.supabase.co:5432/postgres', {
  ssl: 'require'
});

async function applyMigration() {
  try {
    console.log('Reading migration file...');
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20251001000005_contact_reveals.sql');
    const migration = readFileSync(migrationPath, 'utf8');

    console.log('Applying contact reveals migration...');
    await sql.unsafe(migration);

    console.log('✅ Migration applied successfully');

    // Verify tables exist
    console.log('\nVerifying tables...');
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('contact_reveals', 'contact_reveal_settings')
      ORDER BY table_name
    `;
    console.log('Created tables:', tables.map(t => t.table_name));

    // Check default settings
    const settings = await sql`
      SELECT * FROM public.contact_reveal_settings
    `;
    console.log('\nDefault settings:', settings);

  } catch (error) {
    console.error('❌ Error applying migration:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

applyMigration();

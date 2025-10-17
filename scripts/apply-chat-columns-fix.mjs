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
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20251001000004_ensure_chat_columns.sql');
    const migration = readFileSync(migrationPath, 'utf8');

    console.log('Applying migration...');
    await sql.unsafe(migration);

    console.log('✅ Migration applied successfully');

    // Verify columns exist
    console.log('\nVerifying columns...');
    const messagesColumns = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'messages'
      ORDER BY ordinal_position
    `;
    console.log('Messages columns:', messagesColumns.map(c => c.column_name));

    const participantsColumns = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'conversation_participants'
      ORDER BY ordinal_position
    `;
    console.log('Conversation_participants columns:', participantsColumns.map(c => c.column_name));

    const attachmentsColumns = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'message_attachments'
      ORDER BY ordinal_position
    `;
    console.log('Message_attachments columns:', attachmentsColumns.map(c => c.column_name));

  } catch (error) {
    console.error('❌ Error applying migration:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

applyMigration();

const { Pool } = require('pg');

const pool = new Pool({
  host: 'db.vhqzmunorymtoisijiqb.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Vertrouwen17#',
  ssl: { rejectUnauthorized: false }
});

async function phase1() {
  const client = await pool.connect();

  try {
    console.log('================================================================================');
    console.log('PHASE 1: ADD STATUS COLUMNS TO MASTER TABLES');
    console.log('This phase adds application workflow columns (non-breaking changes)');
    console.log('================================================================================\n');

    await client.query('BEGIN');

    // 1. Add application status columns to profiles table
    console.log('[1/4] Adding application workflow columns to profiles...');

    await client.query(`
      ALTER TABLE profiles
      ADD COLUMN IF NOT EXISTS application_status text DEFAULT 'approved',
      ADD COLUMN IF NOT EXISTS application_submitted_at timestamptz,
      ADD COLUMN IF NOT EXISTS application_reviewed_at timestamptz,
      ADD COLUMN IF NOT EXISTS application_reviewed_by uuid REFERENCES profiles(id),
      ADD COLUMN IF NOT EXISTS rejection_reason text;
    `);

    console.log('✓ Added: application_status, application_submitted_at, application_reviewed_at, application_reviewed_by, rejection_reason');

    // 2. Add missing columns to guides table
    console.log('\n[2/4] Adding missing columns to guides table...');

    await client.query(`
      ALTER TABLE guides
      ADD COLUMN IF NOT EXISTS professional_intro text,
      ADD COLUMN IF NOT EXISTS profile_photo_url text,
      ADD COLUMN IF NOT EXISTS location_data jsonb,
      ADD COLUMN IF NOT EXISTS application_data jsonb;
    `);

    console.log('✓ Added: professional_intro, profile_photo_url, location_data, application_data');

    // 3. Add application workflow columns to agencies table
    console.log('\n[3/4] Adding application workflow columns to agencies...');

    await client.query(`
      ALTER TABLE agencies
      ADD COLUMN IF NOT EXISTS application_status text DEFAULT 'approved',
      ADD COLUMN IF NOT EXISTS application_submitted_at timestamptz,
      ADD COLUMN IF NOT EXISTS application_reviewed_at timestamptz,
      ADD COLUMN IF NOT EXISTS application_reviewed_by uuid REFERENCES profiles(id),
      ADD COLUMN IF NOT EXISTS application_data jsonb,
      ADD COLUMN IF NOT EXISTS rejection_reason text,
      ADD COLUMN IF NOT EXISTS location_data jsonb,
      ADD COLUMN IF NOT EXISTS fleet_data jsonb,
      ADD COLUMN IF NOT EXISTS contact_email text,
      ADD COLUMN IF NOT EXISTS contact_phone text;
    `);

    console.log('✓ Added: application_status, application_submitted_at, application_reviewed_at, application_reviewed_by, application_data, rejection_reason, location_data, fleet_data, contact_email, contact_phone');

    // 4. Create indexes for new columns
    console.log('\n[4/4] Creating indexes for new columns...');

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_profiles_application_status ON profiles(application_status);
      CREATE INDEX IF NOT EXISTS idx_agencies_application_status ON agencies(application_status);
      CREATE INDEX IF NOT EXISTS idx_guides_location_data ON guides USING GIN(location_data);
      CREATE INDEX IF NOT EXISTS idx_agencies_location_data ON agencies USING GIN(location_data);
    `);

    console.log('✓ Created indexes on application_status and location_data columns');

    await client.query('COMMIT');

    console.log('\n================================================================================');
    console.log('PHASE 1 COMPLETE!');
    console.log('================================================================================');
    console.log('Summary:');
    console.log('  - Added application workflow columns to profiles');
    console.log('  - Added missing columns to guides');
    console.log('  - Added application workflow columns to agencies');
    console.log('  - Created performance indexes');
    console.log('\nAll existing data is preserved. No breaking changes.');
    console.log('================================================================================\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n✗ Error during Phase 1:', error.message);
    console.error('Transaction rolled back. No changes made.');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

phase1().catch(err => {
  console.error('Phase 1 failed:', err);
  process.exit(1);
});

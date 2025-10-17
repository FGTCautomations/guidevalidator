/**
 * Check Foreign Key Constraint
 * Run with: node scripts/check-fk-constraint.mjs
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkConstraint() {
  console.log('🔍 Checking foreign key constraints...\n');

  // Query the information schema to see FK constraints
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.delete_rule
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      JOIN information_schema.referential_constraints AS rc
        ON rc.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name LIKE '%_applications'
        AND kcu.column_name = 'user_id';
    `
  });

  if (error) {
    console.log('❌ RPC not available, trying direct query...\n');

    // Try to test the constraint directly by inserting with null user_id
    const testInsert = await supabase
      .from('guide_applications')
      .insert({
        locale: 'en',
        full_name: 'FK Test',
        contact_email: 'fktest@test.com',
        user_id: null, // Test with null
        timezone: 'UTC',
        availability_timezone: 'UTC',
      })
      .select();

    if (testInsert.error) {
      console.error('❌ Error with NULL user_id:', testInsert.error.message);
    } else {
      console.log('✅ NULL user_id works fine');
      // Clean up
      await supabase
        .from('guide_applications')
        .delete()
        .eq('contact_email', 'fktest@test.com');
    }

    // Test with fake UUID
    const testInsert2 = await supabase
      .from('guide_applications')
      .insert({
        locale: 'en',
        full_name: 'FK Test 2',
        contact_email: 'fktest2@test.com',
        user_id: '00000000-0000-0000-0000-000000000000', // Fake UUID
        timezone: 'UTC',
        availability_timezone: 'UTC',
      })
      .select();

    if (testInsert2.error) {
      console.error('❌ Error with fake user_id:', testInsert2.error.message);
      console.log('This is expected - the user_id must exist in auth.users');
    } else {
      console.log('⚠️ Fake user_id accepted (unexpected)');
      await supabase
        .from('guide_applications')
        .delete()
        .eq('contact_email', 'fktest2@test.com');
    }
  } else {
    console.log('✅ FK constraints:', JSON.stringify(data, null, 2));
  }
}

checkConstraint().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});

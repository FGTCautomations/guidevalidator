/**
 * Check if auth user exists
 * Run with: node scripts/check-auth-user.mjs <user_id>
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vhqzmunorymtoisijiqb.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZocXptdW5vcnltdG9pc2lqaXFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODc5NzgzNywiZXhwIjoyMDc0MzczODM3fQ.pMvefo6M7SBF9jaf0B-LZDu9VmQtIpz9tXzgIFnzYno';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const userId = process.argv[2] || '95c2563b-a5e5-4ca1-97be-49becd6a1a86';

console.log(`🔍 Checking if user exists: ${userId}\n`);

// Try to get the user via admin API
const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);

if (userError) {
  console.error('❌ Error fetching user:', userError.message);
} else {
  console.log('✅ User found via admin API:', {
    id: userData.user?.id,
    email: userData.user?.email,
    created_at: userData.user?.created_at,
  });
}

// Try to query auth.users directly (this might not work with RLS)
const { data: directData, error: directError } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .maybeSingle();

if (directError) {
  console.log('\n⚠️ Cannot query auth.users directly:', directError.message);
  console.log('(This is expected - auth.users is in the auth schema)');
} else if (directData) {
  console.log('\n✅ User found in users table:', directData);
} else {
  console.log('\n❌ User NOT found in users table');
}

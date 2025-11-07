/**
 * List Recent Auth Users
 *
 * Shows all auth users sorted by creation date
 *
 * Usage:
 *   npx tsx scripts/list-recent-auth-users.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// Create service client directly
const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

async function listRecentAuthUsers() {
  console.log('🔍 Fetching all auth users...\n');

  // Get all auth users
  const { data: authData, error: authError } = await serviceClient.auth.admin.listUsers();

  if (authError) {
    console.error('❌ Error listing auth users:', authError.message);
    process.exit(1);
  }

  const users = authData.users.sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  console.log(`Total auth users: ${users.length}\n`);
  console.log('═══════════════════════════════════════════════════════');
  console.log('ALL AUTH USERS (newest first):');
  console.log('═══════════════════════════════════════════════════════\n');

  // Get all profiles
  const { data: profiles } = await serviceClient
    .from('profiles')
    .select('id, full_name, role');

  const profilesMap = new Map((profiles || []).map(p => [p.id, p]));

  users.forEach((user, index) => {
    const profile = profilesMap.get(user.id);
    const hasProfile = profile ? '✅ Has profile' : '❌ NO PROFILE';
    const profileInfo = profile ? ` (${profile.full_name} - ${profile.role})` : '';

    console.log(`${index + 1}. ${user.email}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`);
    console.log(`   ${hasProfile}${profileInfo}`);
    console.log();
  });

  // Summary
  const usersWithoutProfiles = users.filter(u => !profilesMap.has(u.id));
  if (usersWithoutProfiles.length > 0) {
    console.log('═══════════════════════════════════════════════════════');
    console.log('⚠️  AUTH USERS WITHOUT PROFILES (NEED TO DELETE):');
    console.log('═══════════════════════════════════════════════════════\n');
    usersWithoutProfiles.forEach(user => {
      console.log(`  📧 ${user.email}`);
      console.log(`     ID: ${user.id}\n`);
    });
  }
}

// Run the script
listRecentAuthUsers()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

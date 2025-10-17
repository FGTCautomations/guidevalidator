import pg from 'pg';

const { Client } = pg;

async function verifySetup() {
  const client = new Client({
    host: 'db.vhqzmunorymtoisijiqb.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'Vertrouwen17#',
    ssl: { rejectUnauthorized: false }
  });

  let allPassed = true;

  try {
    console.log('🔍 Guide Validator Chat System - Setup Verification\n');
    console.log('='.repeat(60) + '\n');

    await client.connect();

    // 1. Check core chat tables
    console.log('📋 1. Checking Core Chat Tables...');
    const coreTables = ['conversations', 'messages', 'message_attachments', 'conversation_participants'];
    for (const table of coreTables) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = $1
        );
      `, [table]);

      if (result.rows[0].exists) {
        console.log(`   ✅ ${table}`);
      } else {
        console.log(`   ❌ ${table} - MISSING`);
        allPassed = false;
      }
    }

    // 2. Check abuse reporting tables
    console.log('\n📋 2. Checking Abuse Reporting Tables...');
    const abuseTables = ['abuse_reports', 'user_strikes'];
    for (const table of abuseTables) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = $1
        );
      `, [table]);

      if (result.rows[0].exists) {
        console.log(`   ✅ ${table}`);
      } else {
        console.log(`   ❌ ${table} - MISSING`);
        allPassed = false;
      }
    }

    // 3. Check RLS policies
    console.log('\n🔒 3. Checking RLS Policies...');
    const policies = await client.query(`
      SELECT tablename, COUNT(*) as policy_count
      FROM pg_policies
      WHERE schemaname = 'public'
      AND tablename IN (
        'conversations',
        'messages',
        'message_attachments',
        'conversation_participants',
        'abuse_reports',
        'user_strikes'
      )
      GROUP BY tablename
      ORDER BY tablename;
    `);

    const expectedPolicies = {
      conversations: 3,
      conversation_participants: 2,
      messages: 4,
      message_attachments: 1,
      abuse_reports: 3,
      user_strikes: 2
    };

    for (const [table, expected] of Object.entries(expectedPolicies)) {
      const found = policies.rows.find(r => r.tablename === table);
      const count = found ? parseInt(found.policy_count) : 0;

      if (count >= expected) {
        console.log(`   ✅ ${table}: ${count} policies`);
      } else {
        console.log(`   ⚠️  ${table}: ${count} policies (expected ${expected})`);
      }
    }

    // 4. Check storage bucket
    console.log('\n📦 4. Checking Storage Bucket...');
    const bucket = await client.query(`
      SELECT
        name,
        public,
        file_size_limit,
        allowed_mime_types
      FROM storage.buckets
      WHERE name = 'message-attachments';
    `);

    if (bucket.rows.length > 0) {
      const b = bucket.rows[0];
      console.log(`   ✅ Bucket exists: ${b.name}`);
      console.log(`   ✅ Privacy: ${b.public ? 'Public' : 'Private'} (should be Private)`);
      console.log(`   ✅ Size limit: ${(b.file_size_limit / 1024 / 1024).toFixed(1)} MB`);
      console.log(`   ✅ Allowed types: ${b.allowed_mime_types?.length || 0} MIME types`);

      if (b.public) {
        console.log(`   ⚠️  WARNING: Bucket should be PRIVATE, not public!`);
      }
    } else {
      console.log(`   ❌ message-attachments bucket - MISSING`);
      allPassed = false;
    }

    // 5. Check storage policies
    console.log('\n🔒 5. Checking Storage RLS Policies...');
    const storagePolicies = await client.query(`
      SELECT policyname, cmd
      FROM pg_policies
      WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname LIKE '%attachment%'
      ORDER BY policyname;
    `);

    const expectedStoragePolicies = ['upload', 'read', 'delete'];
    if (storagePolicies.rows.length >= 3) {
      storagePolicies.rows.forEach(p => {
        console.log(`   ✅ ${p.policyname} (${p.cmd})`);
      });
    } else {
      console.log(`   ⚠️  Found ${storagePolicies.rows.length} policies (expected 3)`);
    }

    // 6. Check Realtime configuration
    console.log('\n🔴 6. Checking Realtime Configuration...');
    const realtime = await client.query(`
      SELECT tablename
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename IN ('conversations', 'messages', 'message_attachments', 'conversation_participants')
      ORDER BY tablename;
    `);

    const realtimeTables = ['conversations', 'messages', 'message_attachments', 'conversation_participants'];
    for (const table of realtimeTables) {
      const enabled = realtime.rows.find(r => r.tablename === table);
      if (enabled) {
        console.log(`   ✅ ${table}`);
      } else {
        console.log(`   ❌ ${table} - NOT IN PUBLICATION`);
        allPassed = false;
      }
    }

    // 7. Check replica identity
    console.log('\n🔄 7. Checking Replica Identity (for Realtime updates/deletes)...');
    const replicaIdentity = await client.query(`
      SELECT
        relname AS table_name,
        CASE relreplident
          WHEN 'd' THEN 'default'
          WHEN 'n' THEN 'nothing'
          WHEN 'f' THEN 'full'
          WHEN 'i' THEN 'index'
        END AS replica_identity
      FROM pg_class
      WHERE relnamespace = 'public'::regnamespace
      AND relname IN ('conversations', 'messages', 'message_attachments', 'conversation_participants');
    `);

    for (const row of replicaIdentity.rows) {
      if (row.replica_identity === 'full') {
        console.log(`   ✅ ${row.table_name}: ${row.replica_identity}`);
      } else {
        console.log(`   ⚠️  ${row.table_name}: ${row.replica_identity} (should be 'full')`);
      }
    }

    // 8. Test data check (optional)
    console.log('\n📊 8. Database Statistics...');
    const stats = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM public.conversations) as conversations,
        (SELECT COUNT(*) FROM public.messages) as messages,
        (SELECT COUNT(*) FROM public.message_attachments) as attachments,
        (SELECT COUNT(*) FROM public.abuse_reports) as abuse_reports;
    `);

    if (stats.rows.length > 0) {
      const s = stats.rows[0];
      console.log(`   📈 Conversations: ${s.conversations}`);
      console.log(`   📈 Messages: ${s.messages}`);
      console.log(`   📈 Attachments: ${s.attachments}`);
      console.log(`   📈 Abuse Reports: ${s.abuse_reports}`);
    }

    // Final result
    console.log('\n' + '='.repeat(60));
    if (allPassed) {
      console.log('✅ ALL CHECKS PASSED - Chat system is ready!');
      console.log('\n🚀 Next Steps:');
      console.log('   1. Start dev server: npm run dev');
      console.log('   2. Navigate to: http://localhost:3000/en/chat');
      console.log('   3. Create test conversation (see docs/CHAT_SETUP.md)');
      console.log('   4. Test real-time messaging in two browser tabs');
    } else {
      console.log('⚠️  SOME CHECKS FAILED - Review output above');
      console.log('\nℹ️  See docs/CHAT_SETUP.md for troubleshooting');
    }
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Verification error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

verifySetup();

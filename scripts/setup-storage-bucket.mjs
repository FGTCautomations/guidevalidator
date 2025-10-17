import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Client } = pg;

async function setupStorageBucket() {
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
    console.log('✅ Connected successfully\n');

    // Check if bucket already exists
    console.log('📦 Checking if message-attachments bucket exists...');
    const bucketCheck = await client.query(`
      SELECT id, name, public
      FROM storage.buckets
      WHERE name = 'message-attachments';
    `);

    if (bucketCheck.rows.length > 0) {
      console.log('ℹ️  Bucket already exists:', bucketCheck.rows[0]);
      console.log('⚠️  Skipping bucket creation (already exists)');
    } else {
      console.log('🚀 Creating message-attachments bucket...');
      await client.query(`
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
          'message-attachments',
          'message-attachments',
          false,
          10485760,  -- 10 MB in bytes
          ARRAY[
            'image/jpeg',
            'image/png',
            'image/gif',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          ]
        );
      `);
      console.log('✅ Bucket created successfully');
    }

    // Apply storage policies
    console.log('\n🔒 Setting up storage RLS policies...');

    // Drop existing policies if any
    const dropPolicies = [
      `DROP POLICY IF EXISTS "Users can upload attachments" ON storage.objects;`,
      `DROP POLICY IF EXISTS "Users can read their conversation attachments" ON storage.objects;`,
      `DROP POLICY IF EXISTS "Users can delete their own attachments" ON storage.objects;`
    ];

    for (const dropSql of dropPolicies) {
      try {
        await client.query(dropSql);
      } catch (err) {
        // Ignore errors for non-existent policies
      }
    }

    // Create upload policy
    console.log('  📝 Creating upload policy...');
    await client.query(`
      CREATE POLICY "Users can upload attachments"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'message-attachments'
        AND (storage.foldername(name))[1] = 'attachments'
      );
    `);
    console.log('  ✅ Upload policy created');

    // Create read policy
    console.log('  📝 Creating read policy...');
    await client.query(`
      CREATE POLICY "Users can read their conversation attachments"
      ON storage.objects FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'message-attachments'
        AND EXISTS (
          SELECT 1 FROM public.message_attachments ma
          INNER JOIN public.messages m ON m.id = ma.message_id
          INNER JOIN public.conversation_participants cp ON cp.conversation_id = m.conversation_id
          WHERE ma.storage_path = name
          AND cp.profile_id = auth.uid()
        )
      );
    `);
    console.log('  ✅ Read policy created');

    // Create delete policy
    console.log('  📝 Creating delete policy...');
    await client.query(`
      CREATE POLICY "Users can delete their own attachments"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'message-attachments'
        AND EXISTS (
          SELECT 1 FROM public.message_attachments ma
          INNER JOIN public.messages m ON m.id = ma.message_id
          WHERE ma.storage_path = name
          AND m.sender_id = auth.uid()
        )
      );
    `);
    console.log('  ✅ Delete policy created');

    // Verify policies
    console.log('\n📊 Verifying storage policies...');
    const policies = await client.query(`
      SELECT policyname, cmd, qual
      FROM pg_policies
      WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname LIKE '%attachment%'
      ORDER BY policyname;
    `);

    if (policies.rows.length >= 3) {
      console.log('✅ All storage policies verified:');
      policies.rows.forEach(row => {
        console.log(`   - ${row.policyname} (${row.cmd})`);
      });
    } else {
      console.warn('⚠️  Some policies may be missing. Expected 3, found:', policies.rows.length);
    }

    // Verify bucket configuration
    console.log('\n📦 Final bucket configuration:');
    const finalBucket = await client.query(`
      SELECT
        name,
        public,
        file_size_limit,
        allowed_mime_types
      FROM storage.buckets
      WHERE name = 'message-attachments';
    `);

    if (finalBucket.rows.length > 0) {
      const bucket = finalBucket.rows[0];
      console.log('  Name:', bucket.name);
      console.log('  Public:', bucket.public);
      console.log('  File size limit:', bucket.file_size_limit, 'bytes (', (bucket.file_size_limit / 1024 / 1024).toFixed(1), 'MB)');
      console.log('  Allowed MIME types:', bucket.allowed_mime_types?.length || 0, 'types');
    }

    console.log('\n✅ Storage bucket setup complete!');

  } catch (error) {
    console.error('\n❌ Error setting up storage bucket:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

setupStorageBucket();

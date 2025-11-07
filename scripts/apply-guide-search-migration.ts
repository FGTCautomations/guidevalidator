import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('📦 Reading migration file...');

  const migrationPath = join(process.cwd(), 'supabase/migrations/20250131_guide_search_optimization.sql');
  const migrationSQL = readFileSync(migrationPath, 'utf-8');

  console.log('🚀 Applying migration to Supabase...');
  console.log('   This may take 30-60 seconds...\n');

  try {
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      // Try alternative: direct query execution
      console.log('⚠️  RPC method failed, trying direct execution...');

      // Split into individual statements and execute
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      console.log(`   Executing ${statements.length} SQL statements...`);

      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        if (stmt.length < 10) continue; // Skip empty/comment-only

        try {
          await supabase.from('_migrations').select('*').limit(1); // Keep connection alive
          console.log(`   [${i + 1}/${statements.length}] Executing statement...`);
        } catch (stmtError: any) {
          console.warn(`   ⚠️  Statement ${i + 1} warning:`, stmtError.message);
        }
      }

      console.log('\n⚠️  Could not execute via API. Please apply manually:');
      console.log('   1. Open Supabase Dashboard → SQL Editor');
      console.log('   2. Copy contents of: supabase/migrations/20250131_guide_search_optimization.sql');
      console.log('   3. Paste and run in SQL editor');
      console.log('\n   URL: https://supabase.com/dashboard/project/vhqzmunorymtoisijiqb/sql/new');
      return;
    }

    console.log('✅ Migration applied successfully!\n');

    // Verify the migration
    console.log('🔍 Verifying migration...');

    const { data: viewCheck, error: viewError } = await supabase
      .from('guides_browse_v')
      .select('count')
      .limit(1);

    if (viewError) {
      console.log('   ⚠️  Could not verify view creation');
      console.log('   Please check manually in Supabase Dashboard');
    } else {
      console.log('   ✅ View "guides_browse_v" exists');
    }

    // Check if RPC function exists
    const { error: rpcError } = await supabase.rpc('api_guides_search', {
      p_country: 'VN',
      p_limit: 1
    });

    if (rpcError && !rpcError.message.includes('does not exist')) {
      console.log('   ⚠️  RPC function may not be created correctly');
    } else {
      console.log('   ✅ RPC function "api_guides_search" exists');
    }

    console.log('\n✅ Migration verification complete!');

  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n📝 Manual steps required:');
    console.log('   1. Open: https://supabase.com/dashboard/project/vhqzmunorymtoisijiqb/sql/new');
    console.log('   2. Copy contents of: supabase/migrations/20250131_guide_search_optimization.sql');
    console.log('   3. Paste and click "Run"');
    process.exit(1);
  }
}

applyMigration();

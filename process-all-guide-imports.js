const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key
const supabaseUrl = 'https://vhqzmunorymtoisijiqb.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZocXptdW5vcnltdG9pc2lqaXFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODc5NzgzNywiZXhwIjoyMDc0MzczODM3fQ.pMvefo6M7SBF9jaf0B-LZDu9VmQtIpz9tXzgIFnzYno';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Generate a random claim token
function generateClaimToken() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return token;
}

async function processGuideImportsBatch(batchNumber) {
  console.log(`\n========================================`);
  console.log(`BATCH ${batchNumber} - Starting...`);
  console.log(`========================================\n`);

  // Get next 1000 unclaimed guide imports
  const { data: imports, error: fetchError } = await supabase
    .from('guide_imports')
    .select('*')
    .eq('claimed', false)
    .order('created_at', { ascending: true })
    .limit(1000);

  if (fetchError) {
    console.error('❌ Error fetching guide imports:', fetchError);
    return { success: false, processed: 0 };
  }

  if (!imports || imports.length === 0) {
    console.log('✅ No unclaimed guide imports to process.');
    return { success: true, processed: 0, done: true };
  }

  console.log(`Found ${imports.length} guide imports to process in batch ${batchNumber}\n`);

  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  // Process in sub-batches of 50
  const subBatchSize = 50;

  for (let i = 0; i < imports.length; i += subBatchSize) {
    const batch = imports.slice(i, i + subBatchSize);

    for (const importRecord of batch) {
      try {
        // Step 1: Create profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            full_name: importRecord.full_name,
            country_code: 'VN',
            role: 'guide',
            application_status: 'pending',
            verified: false,
            license_verified: false
          })
          .select()
          .single();

        if (profileError) {
          throw new Error(`Profile creation failed: ${profileError.message}`);
        }

        // Step 2: Create guide record
        const { error: guideError } = await supabase
          .from('guides')
          .insert({
            profile_id: profile.id,
            headline: 'Licensed Tour Guide',
            bio: null,
            spoken_languages: importRecord.spoken_languages || [],
            years_experience: importRecord.years_experience || 0,
            license_number: importRecord.license_number,
            license_authority: importRecord.license_authority,
            specialties: ['cultural-tours'],
            currency: 'USD',
            has_liability_insurance: false,
            // CSV import fields
            name: importRecord.full_name,
            card_number: importRecord.license_number,
            expiry_date: importRecord.license_expiry_date,
            province_issue: importRecord.license_authority,
            card_type: importRecord.license_card_type,
            language: importRecord.spoken_languages ? importRecord.spoken_languages.join(', ') : null,
            experience: importRecord.experience_text,
            image_url: importRecord.image_url,
            source_url: importRecord.source_url
          });

        if (guideError) {
          throw new Error(`Guide creation failed: ${guideError.message}`);
        }

        // Step 3: Create claim token
        const claimToken = generateClaimToken();
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 year from now

        const { error: tokenError } = await supabase
          .from('profile_claim_tokens')
          .insert({
            profile_id: profile.id,
            license_number: importRecord.license_number,
            token: claimToken,
            expires_at: expiresAt.toISOString()
          });

        if (tokenError) {
          throw new Error(`Token creation failed: ${tokenError.message}`);
        }

        // Step 4: Mark import as claimed
        const { error: updateError } = await supabase
          .from('guide_imports')
          .update({
            claimed: true,
            claimed_by_profile_id: profile.id,
            claimed_at: new Date().toISOString()
          })
          .eq('id', importRecord.id);

        if (updateError) {
          console.warn(`⚠️  Warning: Could not mark import as claimed: ${updateError.message}`);
        }

        successCount++;

        if (successCount % 100 === 0) {
          console.log(`✅ Batch ${batchNumber}: Processed ${successCount}/${imports.length} guides...`);
        }

      } catch (error) {
        errorCount++;
        errors.push({
          name: importRecord.full_name,
          license: importRecord.license_number,
          error: error.message
        });

        if (errorCount <= 5) {
          console.error(`❌ Error processing ${importRecord.full_name} (${importRecord.license_number}): ${error.message}`);
        }
      }
    }
  }

  console.log(`\nBatch ${batchNumber} Complete: ✅ ${successCount} success, ❌ ${errorCount} errors`);

  return { success: true, processed: successCount, errors: errorCount };
}

async function processAllImports() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   PROCESSING ALL GUIDE IMPORTS         ║');
  console.log('╔════════════════════════════════════════╗\n');

  let batchNumber = 1;
  let totalProcessed = 0;
  let totalErrors = 0;

  while (true) {
    const result = await processGuideImportsBatch(batchNumber);

    if (!result.success) {
      console.error('\n❌ Batch processing failed. Stopping.');
      break;
    }

    totalProcessed += result.processed;
    totalErrors += result.errors || 0;

    if (result.done || result.processed === 0) {
      console.log('\n✅ All guide imports have been processed!');
      break;
    }

    batchNumber++;

    // Small delay between batches to avoid rate limiting
    console.log('\n⏳ Waiting 5 seconds before next batch...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  // Final stats
  const { count: profileCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'guide');

  const { count: claimTokenCount } = await supabase
    .from('profile_claim_tokens')
    .select('*', { count: 'exact', head: true })
    .is('claimed_at', null);

  const { count: remainingImports } = await supabase
    .from('guide_imports')
    .select('*', { count: 'exact', head: true })
    .eq('claimed', false);

  console.log('\n╔════════════════════════════════════════╗');
  console.log('║        FINAL SUMMARY                   ║');
  console.log('╔════════════════════════════════════════╗');
  console.log(`Total batches processed: ${batchNumber}`);
  console.log(`Total guides processed: ${totalProcessed}`);
  console.log(`Total errors: ${totalErrors}`);
  console.log(`\n📊 Database Stats:`);
  console.log(`   Total guide profiles: ${profileCount}`);
  console.log(`   Unclaimed tokens: ${claimTokenCount}`);
  console.log(`   Remaining imports: ${remainingImports}`);
}

// Run processing
processAllImports().catch(console.error);

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

async function backfillGuideFields() {
  console.log('Starting backfill of guide CSV fields...\n');

  // Get all guides that are missing CSV fields (where card_type is null)
  const { data: guides, error: fetchError } = await supabase
    .from('guides')
    .select('id, profile_id, license_number, card_type')
    .is('card_type', null)
    .not('license_number', 'is', null);

  if (fetchError) {
    console.error('❌ Error fetching guides:', fetchError);
    return;
  }

  if (!guides || guides.length === 0) {
    console.log('✅ No guides need backfilling.');
    return;
  }

  console.log(`Found ${guides.length} guides to backfill\n`);

  let successCount = 0;
  let errorCount = 0;
  let notFoundCount = 0;

  for (const guide of guides) {
    try {
      // Find corresponding guide_import by license_number
      const { data: importRecord, error: importError } = await supabase
        .from('guide_imports')
        .select('*')
        .eq('license_number', guide.license_number)
        .single();

      if (importError || !importRecord) {
        notFoundCount++;
        if (notFoundCount <= 10) {
          console.warn(`⚠️  No import found for license: ${guide.license_number}`);
        }
        continue;
      }

      // Update guide with CSV fields
      const { error: updateError } = await supabase
        .from('guides')
        .update({
          name: importRecord.full_name,
          card_number: importRecord.license_number,
          expiry_date: importRecord.license_expiry_date,
          province_issue: importRecord.license_authority,
          card_type: importRecord.license_card_type,
          language: importRecord.spoken_languages ? importRecord.spoken_languages.join(', ') : null,
          experience: importRecord.experience_text,
          image_url: importRecord.image_url,
          source_url: importRecord.source_url
        })
        .eq('id', guide.id);

      if (updateError) {
        throw new Error(`Update failed: ${updateError.message}`);
      }

      successCount++;

      if (successCount % 100 === 0) {
        console.log(`✅ Backfilled ${successCount}/${guides.length} guides...`);
      }

    } catch (error) {
      errorCount++;
      if (errorCount <= 10) {
        console.error(`❌ Error backfilling guide ${guide.license_number}: ${error.message}`);
      }
    }
  }

  console.log('\n========================================');
  console.log('BACKFILL COMPLETE');
  console.log('========================================');
  console.log(`✅ Successfully backfilled: ${successCount}`);
  console.log(`⚠️  Not found in imports: ${notFoundCount}`);
  console.log(`❌ Errors: ${errorCount}`);
}

// Run backfill
backfillGuideFields().catch(console.error);

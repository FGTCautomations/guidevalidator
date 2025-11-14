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

async function processGuideImports() {
  console.log('Starting guide imports processing...\n');

  // Get all unclaimed guide imports (remove default 1000 limit)
  const { data: imports, error: fetchError } = await supabase
    .from('guide_imports')
    .select('*')
    .eq('claimed', false)
    .order('created_at', { ascending: true })
    .range(0, 100000);  // Fetch all records (removes default limit)

  if (fetchError) {
    console.error('❌ Error fetching guide imports:', fetchError);
    return;
  }

  if (!imports || imports.length === 0) {
    console.log('✅ No unclaimed guide imports to process.');
    return;
  }

  console.log(`Found ${imports.length} guide imports to process\n`);

  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  // Process in batches of 50
  const batchSize = 50;

  for (let i = 0; i < imports.length; i += batchSize) {
    const batch = imports.slice(i, i + batchSize);

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
          console.log(`✅ Processed ${successCount}/${imports.length} guides...`);
        }

      } catch (error) {
        errorCount++;
        errors.push({
          name: importRecord.full_name,
          license: importRecord.license_number,
          error: error.message
        });

        if (errorCount <= 10) {
          console.error(`❌ Error processing ${importRecord.full_name} (${importRecord.license_number}): ${error.message}`);
        }
      }
    }
  }

  console.log('\n========================================');
  console.log('PROCESSING COMPLETE');
  console.log('========================================');
  console.log(`✅ Successfully processed: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);

  if (errorCount > 10) {
    console.log(`\n⚠️  Showing first 10 errors (${errorCount} total):`);
    errors.slice(0, 10).forEach((err, idx) => {
      console.log(`  ${idx + 1}. ${err.name} (${err.license}): ${err.error}`);
    });
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

  console.log(`\n📊 Database Stats:`);
  console.log(`   Total guide profiles: ${profileCount}`);
  console.log(`   Unclaimed tokens: ${claimTokenCount}`);
}

// Run processing
processGuideImports().catch(console.error);

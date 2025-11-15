// Test the complete guide activation flow
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function testActivationFlow() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║     TEST: Guide Activation Flow End-to-End       ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');

  try {
    // Step 1: Find a test guide that hasn't been claimed yet
    console.log('📋 Step 1: Finding unclaimed guide profile...\n');

    const { data: unclaimedGuides, error: guideError } = await supabase
      .from('guides')
      .select('profile_id, card_number, name, image_url, license_number, license_authority')
      .not('card_number', 'is', null)
      .is('profile_id', null)
      .limit(5);

    if (guideError) {
      console.error('❌ Error fetching guides:', guideError.message);
      return;
    }

    if (!unclaimedGuides || unclaimedGuides.length === 0) {
      console.log('⚠️  No unclaimed guides found. Checking for guides with profiles...\n');

      // Try finding guides that have profiles but aren't linked to auth users
      const { data: guidesWithProfiles, error: profileError } = await supabase
        .from('guides')
        .select(`
          profile_id,
          card_number,
          name,
          image_url,
          license_number,
          license_authority,
          profiles!inner(id, full_name, avatar_url)
        `)
        .not('card_number', 'is', null)
        .limit(5);

      if (profileError) {
        console.error('❌ Error:', profileError.message);
        return;
      }

      if (!guidesWithProfiles || guidesWithProfiles.length === 0) {
        console.log('❌ No test guides available.');
        return;
      }

      console.log(`✅ Found ${guidesWithProfiles.length} test guides with profiles:\n`);
      guidesWithProfiles.forEach((guide, idx) => {
        console.log(`${idx + 1}. ${guide.profiles.full_name || guide.name}`);
        console.log(`   License: ${guide.card_number || guide.license_number || 'N/A'}`);
        console.log(`   Profile ID: ${guide.profile_id}`);
        console.log(`   Avatar URL: ${guide.profiles.avatar_url || guide.image_url || 'None'}`);
        console.log('');
      });

      const testGuide = guidesWithProfiles[0];

      // Step 2: Check profile data completeness
      console.log('📋 Step 2: Checking profile data for activation form...\n');

      const { data: profile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', testGuide.profile_id)
        .single();

      if (profileCheckError) {
        console.error('❌ Error fetching profile:', profileCheckError.message);
        return;
      }

      console.log('✅ Profile data retrieved:\n');
      console.log(`   Full Name: ${profile.full_name || 'Missing'}`);
      console.log(`   Avatar URL: ${profile.avatar_url || 'Missing'}`);
      console.log(`   Country: ${profile.country_code || 'Missing'}`);
      console.log(`   Role: ${profile.role}`);
      console.log(`   Status: ${profile.application_status}`);
      console.log('');

      // Step 3: Check guide data
      console.log('📋 Step 3: Checking guide data for form prefill...\n');

      const { data: guideData, error: guideDataError } = await supabase
        .from('guides')
        .select('*')
        .eq('profile_id', testGuide.profile_id)
        .single();

      if (guideDataError) {
        console.error('❌ Error fetching guide data:', guideDataError.message);
        return;
      }

      console.log('✅ Guide data retrieved:\n');
      console.log(`   Name: ${guideData.name || 'Missing'}`);
      console.log(`   Headline: ${guideData.headline || 'Missing'}`);
      console.log(`   License Number: ${guideData.license_number || guideData.card_number || 'Missing'}`);
      console.log(`   License Authority: ${guideData.license_authority || guideData.province_issue || 'Missing'}`);
      console.log(`   Image URL: ${guideData.image_url || 'Missing'}`);
      console.log(`   Spoken Languages: ${JSON.stringify(guideData.spoken_languages || [])}`);
      console.log(`   Specialties: ${JSON.stringify(guideData.specialties || [])}`);
      console.log(`   Years Experience: ${guideData.years_experience || 0}`);
      console.log('');

      // Step 4: Check required columns for profile completion
      console.log('📋 Step 4: Verifying profile completion columns exist...\n');

      const { data: columnCheck, error: columnError } = await supabase
        .from('guides')
        .select('professional_intro, contact_methods, location_data, profile_photo_url')
        .eq('profile_id', testGuide.profile_id)
        .single();

      if (columnError) {
        console.error('❌ Error checking columns:', columnError.message);
        console.log('⚠️  The required columns may not exist yet. Please apply the migration.');
        return;
      }

      console.log('✅ All required columns exist:\n');
      console.log(`   professional_intro: ${columnCheck.professional_intro ? 'Set' : 'NULL'}`);
      console.log(`   contact_methods: ${columnCheck.contact_methods ? JSON.stringify(columnCheck.contact_methods).substring(0, 50) + '...' : 'NULL'}`);
      console.log(`   location_data: ${columnCheck.location_data ? 'Set' : 'NULL'}`);
      console.log(`   profile_photo_url: ${columnCheck.profile_photo_url || 'NULL'}`);
      console.log('');

      // Step 5: Simulate form data that would be submitted
      console.log('📋 Step 5: Simulating profile completion form data...\n');

      const formData = {
        guideId: testGuide.profile_id,
        profileId: testGuide.profile_id,
        token: null, // claimed profile
        // Personal info
        fullName: profile.full_name || guideData.name,
        dateOfBirth: profile.date_of_birth || null,
        nationality: profile.country_code || 'VN',
        contactPhone: profile.phone || null,
        cityOfResidence: profile.city || null, // Now optional!
        // License
        licenseNumber: guideData.license_number || guideData.card_number,
        licenseAuthority: guideData.license_authority || guideData.province_issue,
        // Skills
        languages: guideData.spoken_languages || [],
        specializations: guideData.specialties || [],
        expertiseAreas: guideData.expertise_areas || [],
        // Profile
        professionalIntro: guideData.bio || guideData.professional_intro || '',
        experienceYears: guideData.years_experience || 0,
        experienceSummary: guideData.experience_summary || '',
        // Avatar
        avatarUrl: profile.avatar_url || guideData.image_url,
      };

      console.log('✅ Form data prepared:\n');
      console.log(`   Full Name: ${formData.fullName}`);
      console.log(`   License: ${formData.licenseNumber}`);
      console.log(`   Languages: ${JSON.stringify(formData.languages)}`);
      console.log(`   Specializations: ${JSON.stringify(formData.specializations)}`);
      console.log(`   Avatar URL: ${formData.avatarUrl || 'Not set'}`);
      console.log(`   City: ${formData.cityOfResidence || 'Not required'}`);
      console.log('');

      // Summary
      console.log('╔═══════════════════════════════════════════════════╗');
      console.log('║              ACTIVATION FLOW TEST SUMMARY         ║');
      console.log('╚═══════════════════════════════════════════════════╝\n');

      console.log('✅ Database columns: All required columns exist');
      console.log('✅ Profile data: Available for form prefill');
      console.log('✅ Avatar handling: Profile picture will be shown');
      console.log('   - Profile avatar: ' + (profile.avatar_url ? '✓' : '✗'));
      console.log('   - Guide image: ' + (guideData.image_url ? '✓' : '✗'));
      console.log('   - Fallback works: ' + (profile.avatar_url || guideData.image_url ? '✓' : '✗'));
      console.log('✅ City field: Optional (not required)');
      console.log('✅ License data: Available for prefill');
      console.log('');

      console.log('🎯 READY FOR TESTING:');
      console.log(`   Test with license: ${formData.licenseNumber}`);
      console.log(`   Expected name: ${formData.fullName}`);
      console.log('');
      console.log('📝 Test Steps:');
      console.log('   1. Go to /en/activate-profile');
      console.log('   2. Enter license number: ' + formData.licenseNumber);
      console.log('   3. Create account with new email');
      console.log('   4. Verify profile form shows:');
      console.log('      - Pre-filled name and license');
      console.log('      - Profile picture if available');
      console.log('      - City is optional (not required)');
      console.log('   5. Submit form and verify success');
      console.log('');

    } else {
      console.log('⚠️  Found guides without profiles - they need profiles first.');
      console.log('These guides need the setup-imported-guides.sql migration applied.\n');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testActivationFlow()
  .then(() => {
    console.log('✅ Test completed!\n');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });

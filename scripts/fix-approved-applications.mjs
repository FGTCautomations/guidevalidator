#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vhqzmunorymtoisijiqb.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZocXptdW5vcnltdG9pc2lqaXFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODc5NzgzNywiZXhwIjoyMDc0MzczODM3fQ.pMvefo6M7SBF9jaf0B-LZDu9VmQtIpz9tXzgIFnzYno';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixApprovedApplications() {
  try {
    console.log('🚀 Starting fix for approved applications...\n');

    // Get all approved guide applications
    const { data: applications, error: appsError } = await supabase
      .from('guide_applications')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (appsError) throw appsError;

    console.log(`Found ${applications.length} approved applications\n`);

    for (const app of applications) {
      console.log(`\n📝 Processing: ${app.full_name} (${app.contact_email})`);

      // Check if user exists
      const { data: { users }, error: userSearchError } = await supabase.auth.admin.listUsers();
      const existingUser = users.find(u => u.email === app.contact_email);

      let userId;

      if (!existingUser) {
        console.log('  Creating new auth user...');
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: app.contact_email,
          password: 'TempPassword123!',
          email_confirm: true,
          user_metadata: {
            full_name: app.full_name,
            role: 'guide'
          }
        });

        if (authError) {
          console.error('  ❌ Error creating user:', authError.message);
          continue;
        }

        userId = authData.user.id;
        console.log('  ✅ User created');

        // Wait for trigger
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        userId = existingUser.id;
        console.log(`  ℹ️  User already exists (ID: ${userId})`);
      }

      // Update profile to guide role
      console.log('  Updating profile...');
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          role: 'guide',
          full_name: app.full_name,
          country_code: app.country_code || null,
          verified: true,
          license_verified: true,
          onboarding_completed: true
        })
        .eq('id', userId);

      if (profileError) {
        console.error('  ❌ Error updating profile:', profileError.message);
        continue;
      }

      console.log('  ✅ Profile updated');

      // Check if guide record exists
      const { data: existingGuide } = await supabase
        .from('guides')
        .select('profile_id')
        .eq('profile_id', userId)
        .single();

      if (!existingGuide) {
        console.log('  Creating guide record...');
        const { error: guideError } = await supabase
          .from('guides')
          .insert({
            profile_id: userId,
            headline: app.professional_intro || `${app.full_name} - Licensed Tour Guide`,
            bio: app.professional_intro || `Experienced tour guide offering professional services.`,
            specialties: app.specializations || [],
            spoken_languages: app.languages || ['en'],
            years_experience: app.experience_years || 0,
            hourly_rate_cents: null,
            currency: 'USD',
            gender: null,
            has_liability_insurance: false,
            response_time_minutes: 240,
            owns_vehicle: false
          });

        if (guideError) {
          console.error('  ❌ Error creating guide record:', guideError.message);
          continue;
        }

        console.log('  ✅ Guide record created');
      } else {
        console.log('  ℹ️  Guide record already exists');
      }

      console.log(`  ✅ ${app.full_name} is now ready!`);
    }

    console.log('\n✅ All approved applications have been processed!');
    console.log('\n🌐 Check the directory at: http://localhost:3000/en/directory/guides');

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

fixApprovedApplications();

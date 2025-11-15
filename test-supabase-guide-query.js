// Test Supabase guide query (like the profile page does)
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testSupabaseQuery() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║  Test Supabase Guide Query                        ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local\n');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // First, get a sample guide ID
    console.log('Fetching sample guide ID...\n');
    const { data: sampleGuides, error: sampleError } = await supabase
      .from('guides')
      .select('id, profile_id, name')
      .limit(1);

    if (sampleError) {
      console.error('❌ Error fetching sample:', sampleError);
      return;
    }

    if (!sampleGuides || sampleGuides.length === 0) {
      console.log('❌ No guides found\n');
      return;
    }

    const sampleGuide = sampleGuides[0];
    console.log('Sample guide:');
    console.log(`  ID: ${sampleGuide.id}`);
    console.log(`  Profile ID: ${sampleGuide.profile_id}`);
    console.log(`  Name: ${sampleGuide.name}\n`);

    // Now try to fetch this guide like the profile page does
    console.log('Fetching guide profile (like profile page)...\n');
    const { data, error } = await supabase
      .from('guides')
      .select(`id, profile_id, name, headline, bio, specialties, spoken_languages, hourly_rate_cents, currency, years_experience, response_time_minutes, experience_summary, sample_itineraries, media_gallery, availability_notes, avatar_url, image_url, license_number, profiles!inner(id, full_name, country_code, verified, avatar_url)`)
      .eq('id', sampleGuide.id)
      .maybeSingle();

    if (error) {
      console.error('❌ Error fetching guide profile:');
      console.error(JSON.stringify(error, null, 2));
      console.log('');
      return;
    }

    if (!data) {
      console.log('❌ No data returned (but no error either)\n');
      return;
    }

    console.log('✅ Successfully fetched guide profile!');
    console.log(`  Guide ID: ${data.id}`);
    console.log(`  Profile ID: ${data.profile_id}`);
    console.log(`  Name: ${data.name}`);
    console.log(`  Profile Name: ${data.profiles?.full_name || '(none)'}`);
    console.log(`  Country: ${data.profiles?.country_code || '(none)'}\n`);

  } catch (err) {
    console.error('❌ Exception:', err.message);
  }
}

testSupabaseQuery().catch(console.error);

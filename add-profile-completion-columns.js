// Simple script to add missing columns for profile completion
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  db: { schema: 'public' }
});

async function addColumns() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║  ADD MISSING COLUMNS FOR PROFILE COMPLETION      ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');

  console.log('The following SQL needs to be executed in Supabase SQL Editor:\n');
  console.log('────────────────────────────────────────────────────────');
  console.log(`-- Add missing columns for profile completion
ALTER TABLE guides
ADD COLUMN IF NOT EXISTS professional_intro TEXT,
ADD COLUMN IF NOT EXISTS contact_methods JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS location_data JSONB,
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

-- Add comments
COMMENT ON COLUMN guides.professional_intro IS 'Professional introduction/bio for the guide';
COMMENT ON COLUMN guides.contact_methods IS 'Array of contact methods (channel, value)';
COMMENT ON COLUMN guides.location_data IS 'Location/region data for the guide';
COMMENT ON COLUMN guides.profile_photo_url IS 'URL to the guide profile photo';
`);
  console.log('────────────────────────────────────────────────────────\n');

  console.log('📋 Instructions:');
  console.log('1. Go to https://supabase.com/dashboard');
  console.log('2. Select your project');
  console.log('3. Go to SQL Editor');
  console.log('4. Paste the SQL above and click RUN\n');

  console.log('🔍 Attempting to verify if columns already exist...\n');

  try {
    // Try to select the columns to see if they exist
    const { data, error } = await supabase
      .from('guides')
      .select('professional_intro, contact_methods, location_data, profile_photo_url')
      .limit(1);

    if (error) {
      if (error.message.includes('does not exist')) {
        console.log('❌ Columns do NOT exist yet. Please run the SQL above.\n');
        console.log('Error:', error.message, '\n');
      } else {
        console.log('⚠️  Cannot verify columns:', error.message, '\n');
      }
    } else {
      console.log('✅ All columns already exist! No action needed.\n');
      console.log('   ✓ professional_intro');
      console.log('   ✓ contact_methods');
      console.log('   ✓ location_data');
      console.log('   ✓ profile_photo_url\n');
    }
  } catch (err) {
    console.log('⚠️  Error:', err.message, '\n');
  }
}

addColumns()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });

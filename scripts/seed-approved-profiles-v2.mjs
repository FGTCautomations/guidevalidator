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

// Sample data for approved profiles
const guides = [
  {
    email: 'maria.garcia@example.com',
    full_name: 'Maria Garcia',
    role: 'guide',
    country_code: 'ES',
    verified: true,
    license_verified: true,
    guide_data: {
      business_name: 'Maria Garcia Tours',
      headline: 'Expert Barcelona & Catalonia Guide - 15 Years Experience',
      bio: 'Licensed tour guide specializing in Barcelona architecture, Gaudi tours, and Catalan culture. Fluent in Spanish, English, French, and Catalan.',
      specialties: ['architecture', 'history', 'gaudi', 'food-tours', 'family-friendly'],
      spoken_languages: ['es', 'en', 'fr', 'ca'],
      years_experience: 15,
      hourly_rate_cents: 8000,
      currency: 'EUR',
      gender: 'female',
      has_liability_insurance: true,
      response_time_minutes: 120
    }
  },
  {
    email: 'john.smith@example.com',
    full_name: 'John Smith',
    role: 'guide',
    country_code: 'GB',
    verified: true,
    license_verified: true,
    guide_data: {
      business_name: 'London Heritage Tours',
      headline: 'London Blue Badge Guide - History & Royal London Specialist',
      bio: 'Official Blue Badge guide with expertise in British royal history, Westminster, Tower of London, and British Museum. Family-friendly tours available.',
      specialties: ['history', 'royal-london', 'museums', 'family-friendly'],
      spoken_languages: ['en', 'de', 'es'],
      years_experience: 10,
      hourly_rate_cents: 12000,
      currency: 'GBP',
      gender: 'male',
      has_liability_insurance: true,
      response_time_minutes: 60
    }
  },
  {
    email: 'sophie.dubois@example.com',
    full_name: 'Sophie Dubois',
    role: 'guide',
    country_code: 'FR',
    verified: true,
    license_verified: true,
    guide_data: {
      business_name: 'Paris Art & Culture',
      headline: 'Paris Licensed Guide - Louvre, Orsay & Impressionist Art Expert',
      bio: 'Art historian and licensed guide specializing in French art, Louvre Museum, Musée d\'Orsay, and Impressionism. Walking tours of Montmartre and Left Bank.',
      specialties: ['art', 'museums', 'history', 'walking-tours'],
      spoken_languages: ['fr', 'en', 'it'],
      years_experience: 8,
      hourly_rate_cents: 9500,
      currency: 'EUR',
      gender: 'female',
      has_liability_insurance: true,
      response_time_minutes: 180
    }
  },
  {
    email: 'kenji.tanaka@example.com',
    full_name: 'Kenji Tanaka',
    role: 'guide',
    country_code: 'JP',
    verified: true,
    license_verified: true,
    guide_data: {
      business_name: 'Tokyo Discovery Tours',
      headline: 'Tokyo National Guide - Traditional & Modern Japan Specialist',
      bio: 'National licensed guide offering tours of Tokyo, Kyoto, and surrounding areas. Specializing in Japanese culture, temples, shrines, and food experiences.',
      specialties: ['culture', 'temples', 'food-tours', 'history', 'family-friendly'],
      spoken_languages: ['ja', 'en', 'zh'],
      years_experience: 12,
      hourly_rate_cents: 10000,
      currency: 'JPY',
      gender: 'male',
      has_liability_insurance: true,
      response_time_minutes: 240
    }
  }
];

const agencies = [
  {
    email: 'contact@mediterranean-travel.example.com',
    name: 'Mediterranean Travel Experts',
    agency_type: 'agency',
    bio: 'Full-service travel agency specializing in Mediterranean destinations. We arrange guided tours, accommodations, and complete travel packages across Spain, Italy, Greece, and southern France.',
    country_code: 'ES',
    verified: true,
    featured: true,
    languages: ['es', 'en', 'fr', 'de'],
    specialties: ['mediterranean', 'cruise-tours', 'group-travel', 'luxury-travel'],
    website_url: 'https://example.com/mediterranean-travel'
  },
  {
    email: 'info@uk-heritage.example.com',
    name: 'UK Heritage Travel',
    agency_type: 'agency',
    bio: 'Premier UK travel agency focusing on historical and cultural tours across England, Scotland, Wales, and Ireland. Specializing in customized itineraries for international visitors.',
    country_code: 'GB',
    verified: true,
    featured: false,
    languages: ['en', 'es', 'fr'],
    specialties: ['heritage', 'castles', 'historical-tours', 'custom-itineraries'],
    website_url: 'https://example.com/uk-heritage'
  }
];

const dmcs = [
  {
    email: 'operations@paris-premier.example.com',
    name: 'Paris Premier DMC',
    agency_type: 'dmc',
    bio: 'Leading destination management company in Paris and Île-de-France. We handle ground services, event management, and VIP experiences for travel agencies and corporate clients.',
    country_code: 'FR',
    verified: true,
    featured: true,
    languages: ['fr', 'en', 'es', 'de', 'it'],
    specialties: ['events', 'vip-services', 'corporate-travel', 'logistics'],
    website_url: 'https://example.com/paris-premier-dmc'
  },
  {
    email: 'service@tokyo-ground.example.com',
    name: 'Tokyo Ground Services',
    agency_type: 'dmc',
    bio: 'Professional DMC providing comprehensive ground services throughout Japan. Specializing in FIT and group arrangements, with 24/7 support for international tour operators.',
    country_code: 'JP',
    verified: true,
    featured: false,
    languages: ['ja', 'en', 'zh', 'ko'],
    specialties: ['ground-services', 'logistics', 'group-travel', 'fit-arrangements'],
    website_url: 'https://example.com/tokyo-ground'
  }
];

const transport = [
  {
    email: 'booking@barcelona-transport.example.com',
    name: 'Barcelona Premium Transport',
    agency_type: 'transport',
    bio: 'Professional transportation services in Barcelona and Catalonia. Fleet includes luxury sedans, vans, and coaches. Licensed for airport transfers, day trips, and multi-day tours.',
    country_code: 'ES',
    verified: true,
    featured: true,
    languages: ['es', 'en', 'fr', 'ca'],
    specialties: ['airport-transfers', 'luxury-transport', 'day-trips', 'multi-day-tours'],
    website_url: 'https://example.com/barcelona-transport'
  },
  {
    email: 'reservations@london-executive.example.com',
    name: 'London Executive Cars',
    agency_type: 'transport',
    bio: 'Executive car and coach hire service operating across London and the UK. Professional chauffeurs, modern fleet, full insurance coverage.',
    country_code: 'GB',
    verified: true,
    featured: false,
    languages: ['en'],
    specialties: ['executive-cars', 'chauffeur-service', 'airport-transfers', 'corporate-transport'],
    website_url: 'https://example.com/london-executive'
  }
];

async function createAuthUser(email, full_name, role) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: 'TempPassword123!',
    email_confirm: true,
    user_metadata: {
      full_name,
      role
    }
  });

  if (error) {
    console.error(`Error creating auth user for ${email}:`, error);
    throw error;
  }

  return data.user.id;
}

async function updateProfile(userId, profileData) {
  const { error } = await supabase
    .from('profiles')
    .update({
      role: profileData.role,
      country_code: profileData.country_code,
      verified: profileData.verified,
      license_verified: profileData.license_verified,
      onboarding_completed: true
    })
    .eq('id', userId);

  if (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
}

async function createGuide(userId, guideData) {
  const { error } = await supabase
    .from('guides')
    .insert({
      profile_id: userId,
      headline: guideData.headline,
      bio: guideData.bio,
      specialties: guideData.specialties,
      spoken_languages: guideData.spoken_languages,
      years_experience: guideData.years_experience,
      hourly_rate_cents: guideData.hourly_rate_cents,
      currency: guideData.currency,
      gender: guideData.gender,
      has_liability_insurance: guideData.has_liability_insurance,
      response_time_minutes: guideData.response_time_minutes,
      owns_vehicle: false
    });

  if (error) {
    console.error('Error creating guide:', error);
    throw error;
  }
}

async function createAgency(orgData, ownerProfileId) {
  const { data: agency, error: agencyError} = await supabase
    .from('agencies')
    .insert({
      type: orgData.agency_type,
      name: orgData.name,
      description: orgData.bio,
      country_code: orgData.country_code,
      verified: orgData.verified,
      featured: orgData.featured,
      languages: orgData.languages,
      specialties: orgData.specialties,
      website: orgData.website_url
    })
    .select()
    .single();

  if (agencyError) {
    console.error('Error creating agency:', agencyError);
    throw agencyError;
  }

  // Link profile to agency
  await supabase
    .from('profiles')
    .update({ organization_id: agency.id })
    .eq('id', ownerProfileId);

  // Create agency member
  await supabase
    .from('agency_members')
    .insert({
      agency_id: agency.id,
      profile_id: ownerProfileId,
      role: 'owner'
    });

  return agency.id;
}

async function seedProfiles() {
  try {
    console.log('🚀 Starting profile seeding...\n');

    console.log('📝 Creating guide profiles...');
    for (const guide of guides) {
      try {
        // Create auth user (this will trigger profile creation)
        const userId = await createAuthUser(guide.email, guide.full_name, guide.role);

        // Wait for trigger
        await new Promise(resolve => setTimeout(resolve, 500));

        // Update profile with additional data
        await updateProfile(userId, guide);

        // Create guide record
        await createGuide(userId, guide.guide_data);

        console.log(`✅ Created guide: ${guide.full_name}`);
      } catch (error) {
        if (error.message?.includes('already registered') || error.code === 'email_exists' || error.code === 'email_exists') {
          console.log(`⚠️  Skipped ${guide.full_name} (already exists)`);
        } else {
          throw error;
        }
      }
    }

    console.log('\n📝 Creating agency profiles...');
    for (const agency of agencies) {
      try {
        const userId = await createAuthUser(agency.email, agency.name, 'agency');
        await new Promise(resolve => setTimeout(resolve, 500));
        await updateProfile(userId, {
          role: 'agency',
          country_code: agency.country_code,
          verified: agency.verified,
          license_verified: false
        });
        await createAgency(agency, userId);
        console.log(`✅ Created agency: ${agency.name}`);
      } catch (error) {
        if (error.message?.includes('already registered') || error.code === 'email_exists') {
          console.log(`⚠️  Skipped ${agency.name} (already exists)`);
        } else {
          throw error;
        }
      }
    }

    console.log('\n📝 Creating DMC profiles...');
    for (const dmc of dmcs) {
      try {
        const userId = await createAuthUser(dmc.email, dmc.name, 'dmc');
        await new Promise(resolve => setTimeout(resolve, 500));
        await updateProfile(userId, {
          role: 'dmc',
          country_code: dmc.country_code,
          verified: dmc.verified,
          license_verified: false
        });
        await createAgency(dmc, userId);
        console.log(`✅ Created DMC: ${dmc.name}`);
      } catch (error) {
        if (error.message?.includes('already registered') || error.code === 'email_exists') {
          console.log(`⚠️  Skipped ${dmc.name} (already exists)`);
        } else {
          throw error;
        }
      }
    }

    console.log('\n📝 Creating transport company profiles...');
    for (const trans of transport) {
      try {
        const userId = await createAuthUser(trans.email, trans.name, 'transport');
        await new Promise(resolve => setTimeout(resolve, 500));
        await updateProfile(userId, {
          role: 'transport',
          country_code: trans.country_code,
          verified: trans.verified,
          license_verified: false
        });
        await createAgency(trans, userId);
        console.log(`✅ Created transport: ${trans.name}`);
      } catch (error) {
        if (error.message?.includes('already registered') || error.code === 'email_exists') {
          console.log(`⚠️  Skipped ${trans.name} (already exists)`);
        } else {
          throw error;
        }
      }
    }

    console.log('\n✅ All profiles seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - ${guides.length} guides`);
    console.log(`   - ${agencies.length} agencies`);
    console.log(`   - ${dmcs.length} DMCs`);
    console.log(`   - ${transport.length} transport companies`);
    console.log('\n🌐 Check the directory at: http://localhost:3000/en/directory/guides');

  } catch (error) {
    console.error('\n❌ Error seeding profiles:', error);
    process.exit(1);
  }
}

seedProfiles();

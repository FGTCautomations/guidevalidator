#!/usr/bin/env node
import { Client } from 'pg';

const client = new Client({
  host: 'db.vhqzmunorymtoisijiqb.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Vertrouwen17#',
  ssl: { rejectUnauthorized: false }
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

async function createProfile(profile) {
  try {
    // Create auth user
    const userId = `00000000-0000-4000-8000-${Math.random().toString(16).substr(2, 12)}`;

    // Insert profile
    await client.query(`
      INSERT INTO profiles (id, role, full_name, country_code, verified, license_verified, locale, onboarding_completed)
      VALUES ($1, $2, $3, $4, $5, $6, 'en', true)
      ON CONFLICT (id) DO NOTHING
    `, [userId, profile.role, profile.full_name, profile.country_code, profile.verified, profile.license_verified]);

    return userId;
  } catch (error) {
    console.error('Error creating profile:', error);
    throw error;
  }
}

async function createGuide(userId, guideData) {
  try {
    await client.query(`
      INSERT INTO guides (
        profile_id, business_name, headline, bio, specialties, spoken_languages,
        years_experience, hourly_rate_cents, currency, gender, has_liability_insurance,
        response_time_minutes, verified
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true)
      ON CONFLICT (profile_id) DO NOTHING
    `, [
      userId,
      guideData.business_name,
      guideData.headline,
      guideData.bio,
      guideData.specialties,
      guideData.spoken_languages,
      guideData.years_experience,
      guideData.hourly_rate_cents,
      guideData.currency,
      guideData.gender,
      guideData.has_liability_insurance,
      guideData.response_time_minutes
    ]);
  } catch (error) {
    console.error('Error creating guide:', error);
    throw error;
  }
}

async function createAgency(orgData, ownerProfileId = null) {
  try {
    const { rows } = await client.query(`
      INSERT INTO agencies (
        agency_type, name, bio, country_code, verified, featured, languages, specialties, website_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
      ON CONFLICT DO NOTHING
    `, [
      orgData.agency_type,
      orgData.name,
      orgData.bio,
      orgData.country_code,
      orgData.verified,
      orgData.featured,
      orgData.languages,
      orgData.specialties,
      orgData.website_url
    ]);

    if (rows.length > 0 && ownerProfileId) {
      const agencyId = rows[0].id;

      // Link profile to agency
      await client.query(`
        UPDATE profiles SET organization_id = $1 WHERE id = $2
      `, [agencyId, ownerProfileId]);

      // Create agency member
      await client.query(`
        INSERT INTO agency_members (agency_id, profile_id, role)
        VALUES ($1, $2, 'owner')
        ON CONFLICT DO NOTHING
      `, [agencyId, ownerProfileId]);
    }

    return rows.length > 0 ? rows[0].id : null;
  } catch (error) {
    console.error('Error creating agency:', error);
    throw error;
  }
}

async function seedProfiles() {
  try {
    console.log('🔌 Connecting to Supabase database...');
    await client.connect();
    console.log('✅ Connected successfully\n');

    console.log('📝 Creating guide profiles...');
    for (const guide of guides) {
      const userId = await createProfile(guide);
      await createGuide(userId, guide.guide_data);
      console.log(`✅ Created guide: ${guide.full_name}`);
    }

    console.log('\n📝 Creating agency profiles...');
    for (const agency of agencies) {
      const userId = await createProfile({
        role: 'agency',
        full_name: agency.name,
        country_code: agency.country_code,
        verified: agency.verified,
        license_verified: false
      });
      await createAgency(agency, userId);
      console.log(`✅ Created agency: ${agency.name}`);
    }

    console.log('\n📝 Creating DMC profiles...');
    for (const dmc of dmcs) {
      const userId = await createProfile({
        role: 'dmc',
        full_name: dmc.name,
        country_code: dmc.country_code,
        verified: dmc.verified,
        license_verified: false
      });
      await createAgency(dmc, userId);
      console.log(`✅ Created DMC: ${dmc.name}`);
    }

    console.log('\n📝 Creating transport company profiles...');
    for (const trans of transport) {
      const userId = await createProfile({
        role: 'transport',
        full_name: trans.name,
        country_code: trans.country_code,
        verified: trans.verified,
        license_verified: false
      });
      await createAgency(trans, userId);
      console.log(`✅ Created transport: ${trans.name}`);
    }

    console.log('\n✅ All profiles seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - ${guides.length} guides`);
    console.log(`   - ${agencies.length} agencies`);
    console.log(`   - ${dmcs.length} DMCs`);
    console.log(`   - ${transport.length} transport companies`);
    console.log('\n🌐 Check the directory at: /en/directory/guides');

  } catch (error) {
    console.error('❌ Error seeding profiles:', error);
    throw error;
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

seedProfiles();

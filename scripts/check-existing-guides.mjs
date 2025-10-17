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

async function checkGuides() {
  try {
    await client.connect();
    console.log('🔌 Connected to database\n');

    // Check all profiles with guide role
    console.log('📊 Checking profiles with guide role...');
    const { rows: profiles } = await client.query(`
      SELECT id, full_name, role, country_code, verified, license_verified, onboarding_completed
      FROM profiles
      WHERE role = 'guide'
      ORDER BY full_name
    `);

    console.log(`Found ${profiles.length} profiles with guide role:\n`);
    profiles.forEach(p => {
      console.log(`- ${p.full_name} (${p.country_code || 'No country'})`);
      console.log(`  ID: ${p.id}`);
      console.log(`  Verified: ${p.verified}, License: ${p.license_verified}, Onboarded: ${p.onboarding_completed}`);
    });

    // Check guides table
    console.log('\n📊 Checking guides table...');
    const { rows: guides } = await client.query(`
      SELECT g.profile_id, p.full_name, g.headline, g.bio, g.specialties, g.spoken_languages
      FROM guides g
      LEFT JOIN profiles p ON p.id = g.profile_id
      ORDER BY p.full_name
    `);

    console.log(`\nFound ${guides.length} records in guides table:\n`);
    guides.forEach(g => {
      console.log(`- ${g.full_name || 'NO NAME'}`);
      console.log(`  Profile ID: ${g.profile_id}`);
      console.log(`  Headline: ${g.headline || 'NO HEADLINE'}`);
      console.log(`  Has bio: ${!!g.bio}`);
      console.log(`  Languages: ${g.spoken_languages?.join(', ') || 'none'}`);
      console.log(`  Specialties: ${g.specialties?.join(', ') || 'none'}\n`);
    });

    // Check for Oscar specifically
    console.log('\n🔍 Searching for Oscar de Vlaam...');
    const { rows: oscar } = await client.query(`
      SELECT p.*, g.headline, g.bio, g.specialties, g.spoken_languages, g.hourly_rate_cents
      FROM profiles p
      LEFT JOIN guides g ON g.profile_id = p.id
      WHERE p.full_name ILIKE '%Oscar%' OR p.full_name ILIKE '%Vlaam%'
    `);

    if (oscar.length > 0) {
      console.log('✅ Found Oscar:');
      console.log(JSON.stringify(oscar[0], null, 2));
    } else {
      console.log('❌ Oscar de Vlaam not found in database');
    }

    // Check guide_applications
    console.log('\n📊 Checking guide applications...');
    const { rows: apps } = await client.query(`
      SELECT id, full_name, status, contact_email, created_at
      FROM guide_applications
      ORDER BY created_at DESC
      LIMIT 10
    `);

    console.log(`\nFound ${apps.length} recent guide applications:\n`);
    apps.forEach(app => {
      console.log(`- ${app.full_name} (${app.status})`);
      console.log(`  Email: ${app.contact_email}`);
      console.log(`  Created: ${app.created_at}\n`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

checkGuides();

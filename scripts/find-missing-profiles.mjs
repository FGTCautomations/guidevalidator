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

async function findMissing() {
  try {
    await client.connect();

    // Get all approved applications
    const { rows: approvedApps } = await client.query(`
      SELECT id, full_name, contact_email, status
      FROM guide_applications
      WHERE status = 'approved'
      ORDER BY created_at DESC
    `);

    console.log(`Found ${approvedApps.length} approved guide applications:\n`);

    for (const app of approvedApps) {
      // Check if profile exists with this email
      const { rows: profiles } = await client.query(`
        SELECT p.id, p.full_name, p.role, g.profile_id as has_guide_record
        FROM auth.users u
        LEFT JOIN profiles p ON p.id = u.id
        LEFT JOIN guides g ON g.profile_id = p.id
        WHERE u.email = $1
      `, [app.contact_email]);

      if (profiles.length === 0) {
        console.log(`❌ ${app.full_name} (${app.contact_email})`);
        console.log(`   No user account found\n`);
      } else {
        const profile = profiles[0];
        if (profile.role !== 'guide') {
          console.log(`⚠️  ${app.full_name} (${app.contact_email})`);
          console.log(`   User exists but role is: ${profile.role} (should be guide)`);
          console.log(`   Profile ID: ${profile.id}\n`);
        } else if (!profile.has_guide_record) {
          console.log(`⚠️  ${app.full_name} (${app.contact_email})`);
          console.log(`   Profile exists with guide role but NO guide record`);
          console.log(`   Profile ID: ${profile.id}\n`);
        } else {
          console.log(`✅ ${app.full_name} (${app.contact_email})`);
          console.log(`   Profile and guide record exist\n`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

findMissing();

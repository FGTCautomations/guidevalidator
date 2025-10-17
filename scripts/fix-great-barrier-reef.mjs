#!/usr/bin/env node
import pg from 'pg';
const { Client } = pg;

const connectionString = "postgresql://postgres:Vertrouwen17%23@db.vhqzmunorymtoisijiqb.supabase.co:5432/postgres";

async function fixGreatBarrierReef() {
  const client = new Client({ connectionString });

  try {
    await client.connect();

    console.log('🔧 Fixing Great Barrier Reef region link...\n');

    // Get Queensland region ID
    const queensland = await client.query(`
      SELECT id, name FROM public.regions
      WHERE country_code = 'AU' AND name = 'Queensland'
      LIMIT 1;
    `);

    if (queensland.rows.length === 0) {
      console.log('❌ Queensland region not found');
      return;
    }

    const regionId = queensland.rows[0].id;
    console.log(`✓ Found Queensland region: ${regionId}`);

    // Update Great Barrier Reef
    const result = await client.query(`
      UPDATE public.national_parks
      SET region_id = $1, updated_at = NOW()
      WHERE country_code = 'AU'
      AND name ILIKE '%Great Barrier Reef%'
      RETURNING name, type, unesco_site;
    `, [regionId]);

    if (result.rows.length > 0) {
      const park = result.rows[0];
      const unesco = park.unesco_site ? '🌍 UNESCO' : '';
      console.log(`✅ Updated: ${park.name} ${unesco}`);
      console.log(`   → Now linked to Queensland\n`);
    } else {
      console.log('⚠️  Great Barrier Reef not found in database\n');
    }

    // Verify the fix
    const verification = await client.query(`
      SELECT name, region_id FROM public.national_parks
      WHERE country_code = 'AU' AND name ILIKE '%Great Barrier Reef%';
    `);

    if (verification.rows.length > 0 && verification.rows[0].region_id) {
      console.log('✅ Verification: Great Barrier Reef is now linked to Queensland');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

fixGreatBarrierReef();

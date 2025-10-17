#!/usr/bin/env node
import pg from 'pg';
const { Client } = pg;

const connectionString = "postgresql://postgres:Vertrouwen17%23@db.vhqzmunorymtoisijiqb.supabase.co:5432/postgres";

async function migrateParksFromStage() {
  const client = new Client({ connectionString });

  try {
    console.log('🌳 Fetching national parks from national_parks_stage table...\n');
    await client.connect();

    // First, check if the stage table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'national_parks_stage'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('❌ Table "national_parks_stage" does not exist.');
      console.log('   Available tables:');

      const tables = await client.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `);

      tables.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });

      return;
    }

    // Fetch all parks from stage table
    const stageParks = await client.query(`
      SELECT * FROM public.national_parks_stage
      ORDER BY country_code, name;
    `);

    console.log(`📊 Found ${stageParks.rows.length} parks in stage table\n`);

    if (stageParks.rows.length === 0) {
      console.log('⚠️  No parks found in stage table. Nothing to migrate.');
      return;
    }

    // Show first few parks as preview
    console.log('🔍 Preview of parks to migrate:');
    stageParks.rows.slice(0, 5).forEach(park => {
      console.log(`   - ${park.name} (${park.country_code})`);
    });
    if (stageParks.rows.length > 5) {
      console.log(`   ... and ${stageParks.rows.length - 5} more\n`);
    }

    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    let linkedToRegion = 0;

    console.log('\n🚀 Starting migration...\n');

    for (const stagePark of stageParks.rows) {
      try {
        // Try to find matching region for this park
        let regionId = null;

        // If stage table has region info, try to match it
        if (stagePark.region_name) {
          const regionMatch = await client.query(`
            SELECT id FROM public.regions
            WHERE country_code = $1
            AND (name = $2 OR name ILIKE $2)
            LIMIT 1;
          `, [stagePark.country_code, stagePark.region_name]);

          if (regionMatch.rows.length > 0) {
            regionId = regionMatch.rows[0].id;
            linkedToRegion++;
          }
        }

        // Check if park already exists in destination table
        const existing = await client.query(`
          SELECT id, region_id FROM public.national_parks
          WHERE country_code = $1 AND name = $2;
        `, [stagePark.country_code, stagePark.name]);

        if (existing.rows.length > 0) {
          // Update existing park with region if found
          if (regionId && !existing.rows[0].region_id) {
            await client.query(`
              UPDATE public.national_parks
              SET region_id = $1, updated_at = NOW()
              WHERE id = $2;
            `, [regionId, existing.rows[0].id]);

            updated++;
            console.log(`   ✏️  Updated: ${stagePark.name} (${stagePark.country_code}) - linked to region`);
          } else {
            skipped++;
            console.log(`   - Skipped: ${stagePark.name} (${stagePark.country_code}) - already exists`);
          }
        } else {
          // Insert new park
          await client.query(`
            INSERT INTO public.national_parks (
              country_code,
              region_id,
              name,
              type,
              unesco_site,
              description,
              area_km2,
              established_year,
              website,
              created_at,
              updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW());
          `, [
            stagePark.country_code,
            regionId,
            stagePark.name,
            stagePark.type || 'National Park',
            stagePark.unesco_site || false,
            stagePark.description || null,
            stagePark.area_km2 || null,
            stagePark.established_year || null,
            stagePark.website || null
          ]);

          inserted++;
          const regionNote = regionId ? '🔗 with region' : '';
          const unescoNote = stagePark.unesco_site ? '🌍 UNESCO' : '';
          console.log(`   ✓ Inserted: ${stagePark.name} (${stagePark.country_code}) ${regionNote} ${unescoNote}`);
        }

      } catch (error) {
        console.error(`   ✗ Error processing ${stagePark.name}: ${error.message}`);
      }
    }

    console.log('\n✅ Migration complete!\n');
    console.log('📊 Results:');
    console.log(`   ✓ Inserted: ${inserted}`);
    console.log(`   ✏️  Updated: ${updated}`);
    console.log(`   - Skipped: ${skipped}`);
    console.log(`   🔗 Linked to regions: ${linkedToRegion}`);

    // Final stats
    const totalParks = await client.query('SELECT COUNT(*) FROM public.national_parks');
    const withRegions = await client.query('SELECT COUNT(*) FROM public.national_parks WHERE region_id IS NOT NULL');
    const unescoSites = await client.query('SELECT COUNT(*) FROM public.national_parks WHERE unesco_site = true');

    console.log('\n📊 Database totals:');
    console.log(`   Total parks: ${totalParks.rows[0].count}`);
    console.log(`   With regions: ${withRegions.rows[0].count}`);
    console.log(`   UNESCO sites: ${unescoSites.rows[0].count}`);

    // Show parks by country
    const byCountry = await client.query(`
      SELECT country_code, COUNT(*) as count
      FROM public.national_parks
      GROUP BY country_code
      ORDER BY count DESC
      LIMIT 10;
    `);

    console.log('\n🌍 Top 10 countries by park count:');
    byCountry.rows.forEach(row => {
      console.log(`   ${row.country_code}: ${row.count} parks`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrateParksFromStage();

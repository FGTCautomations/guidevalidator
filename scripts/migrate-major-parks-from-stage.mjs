#!/usr/bin/env node
import pg from 'pg';
const { Client } = pg;

const connectionString = "postgresql://postgres:Vertrouwen17%23@db.vhqzmunorymtoisijiqb.supabase.co:5432/postgres";

async function migrateMajorParks() {
  const client = new Client({ connectionString });

  try {
    console.log('🌳 Migrating major parks from national_parks_stage...\n');
    await client.connect();

    // Get count
    const totalStage = await client.query('SELECT COUNT(*) FROM public.national_parks_stage');
    console.log(`📊 Total parks in stage: ${totalStage.rows[0].count}`);

    // Filter for major/important parks only:
    // 1. UNESCO sites
    // 2. National Parks (not small reserves)
    // 3. Large parks (> 100 km²)
    // 4. Parks with "National Park" in the name
    const majorParks = await client.query(`
      SELECT *
      FROM public.national_parks_stage
      WHERE
        unesco_site = true
        OR type ILIKE '%National Park%'
        OR type ILIKE '%Marine Park%'
        OR type ILIKE '%Nature Reserve%'
        OR type ILIKE '%Wildlife Sanctuary%'
        OR area_km2 > 100
        OR name ILIKE '%National Park%'
        OR name ILIKE '%Marine Park%'
      ORDER BY
        unesco_site DESC,
        area_km2 DESC NULLS LAST,
        name
      LIMIT 5000;
    `);

    console.log(`📊 Filtered to ${majorParks.rows.length} major parks\n`);

    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    let linkedToRegion = 0;

    console.log('🚀 Starting migration...\n');

    for (const stagePark of majorParks.rows) {
      try {
        // Try to find matching region for this park
        let regionId = stagePark.region_id; // Use existing if present

        // If no region_id, try to match by country and area
        if (!regionId) {
          // For parks, try to match regions by checking if park location matches region
          // This is basic matching - could be improved with coordinate-based matching
          const regionMatch = await client.query(`
            SELECT id FROM public.regions
            WHERE country_code = $1
            LIMIT 1;
          `, [stagePark.country_code]);

          if (regionMatch.rows.length > 0) {
            // For now, don't auto-link - better to leave null than link incorrectly
            // regionId = regionMatch.rows[0].id;
          }
        }

        if (regionId) {
          linkedToRegion++;
        }

        // Check if park already exists in destination table
        const existing = await client.query(`
          SELECT id, region_id FROM public.national_parks
          WHERE country_code = $1 AND name = $2;
        `, [stagePark.country_code, stagePark.name]);

        if (existing.rows.length > 0) {
          // Update existing park with better data
          await client.query(`
            UPDATE public.national_parks
            SET
              region_id = COALESCE($1, region_id),
              official_name = COALESCE($2, official_name),
              type = COALESCE($3, type),
              area_km2 = COALESCE($4, area_km2),
              established_year = COALESCE($5, established_year),
              unesco_site = COALESCE($6, unesco_site),
              latitude = COALESCE($7, latitude),
              longitude = COALESCE($8, longitude),
              description = COALESCE($9, description),
              updated_at = NOW()
            WHERE id = $10;
          `, [
            regionId,
            stagePark.official_name,
            stagePark.type,
            stagePark.area_km2,
            stagePark.established_year,
            stagePark.unesco_site,
            stagePark.latitude,
            stagePark.longitude,
            stagePark.description,
            existing.rows[0].id
          ]);

          updated++;
          if (updated % 100 === 0) {
            console.log(`   📝 Updated ${updated} parks...`);
          }
        } else {
          // Insert new park
          await client.query(`
            INSERT INTO public.national_parks (
              country_code,
              region_id,
              name,
              official_name,
              type,
              area_km2,
              established_year,
              unesco_site,
              latitude,
              longitude,
              description,
              created_at,
              updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW());
          `, [
            stagePark.country_code,
            regionId,
            stagePark.name,
            stagePark.official_name,
            stagePark.type,
            stagePark.area_km2,
            stagePark.established_year,
            stagePark.unesco_site,
            stagePark.latitude,
            stagePark.longitude,
            stagePark.description
          ]);

          inserted++;
          if (inserted % 100 === 0) {
            console.log(`   ✓ Inserted ${inserted} parks...`);
          }
        }

      } catch (error) {
        console.error(`   ✗ Error processing ${stagePark.name}: ${error.message}`);
        skipped++;
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

    // Show parks by country (top 15)
    const byCountry = await client.query(`
      SELECT
        c.name as country_name,
        np.country_code,
        COUNT(*) as count,
        COUNT(*) FILTER (WHERE np.unesco_site = true) as unesco_count
      FROM public.national_parks np
      JOIN public.countries c ON c.code = np.country_code
      GROUP BY c.name, np.country_code
      ORDER BY count DESC
      LIMIT 15;
    `);

    console.log('\n🌍 Top 15 countries by park count:');
    byCountry.rows.forEach(row => {
      const unescoNote = row.unesco_count > 0 ? ` (${row.unesco_count} UNESCO)` : '';
      console.log(`   ${row.country_name} (${row.country_code}): ${row.count} parks${unescoNote}`);
    });

    // Show some notable UNESCO sites
    const unescoSamples = await client.query(`
      SELECT name, country_code, type
      FROM public.national_parks
      WHERE unesco_site = true
      ORDER BY name
      LIMIT 10;
    `);

    console.log('\n🌍 Sample UNESCO World Heritage Sites:');
    unescoSamples.rows.forEach(park => {
      console.log(`   - ${park.name} (${park.country_code})`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrateMajorParks();

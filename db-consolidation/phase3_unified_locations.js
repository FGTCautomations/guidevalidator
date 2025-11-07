const { Pool } = require('pg');

const pool = new Pool({
  host: 'db.vhqzmunorymtoisijiqb.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Vertrouwen17#',
  ssl: { rejectUnauthorized: false }
});

async function phase3() {
  const client = await pool.connect();

  try {
    console.log('================================================================================');
    console.log('PHASE 3: CREATE UNIFIED ENTITY_LOCATIONS TABLE');
    console.log('This phase consolidates 11 location junction tables into 1');
    console.log('================================================================================\n');

    await client.query('BEGIN');

    // ============================================================================
    // 1. CREATE UNIFIED ENTITY_LOCATIONS TABLE
    // ============================================================================
    console.log('[1/5] Creating entity_locations table...\n');

    await client.query(`
      CREATE TABLE IF NOT EXISTS entity_locations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        entity_type text NOT NULL,  -- 'guide', 'agency', 'dmc', 'transport'
        entity_id uuid NOT NULL,
        location_type text NOT NULL,  -- 'country', 'region', 'city', 'park', 'attraction'
        location_id text NOT NULL,  -- FK to various location tables (country_code, region.id, city.id, etc)
        location_name text,  -- Denormalized for quick display
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now(),

        UNIQUE(entity_type, entity_id, location_type, location_id)
      );

      -- Create indexes for performance
      CREATE INDEX IF NOT EXISTS idx_entity_locations_entity ON entity_locations(entity_type, entity_id);
      CREATE INDEX IF NOT EXISTS idx_entity_locations_location ON entity_locations(location_type, location_id);
      CREATE INDEX IF NOT EXISTS idx_entity_locations_lookup ON entity_locations(entity_type, location_type, location_id);
    `);

    console.log('✓ Created entity_locations table with 3 indexes');

    // ============================================================================
    // 2. MIGRATE GUIDE LOCATION DATA
    // ============================================================================
    console.log('\n[2/5] Migrating guide location data...\n');

    // Migrate guide countries
    const { rows: guideCountries } = await client.query(`
      INSERT INTO entity_locations (entity_type, entity_id, location_type, location_id, location_name)
      SELECT
        'guide' as entity_type,
        guide_id as entity_id,
        'country' as location_type,
        country_code as location_id,
        c.name as location_name
      FROM guide_countries gc
      LEFT JOIN countries c ON c.code = gc.country_code
      ON CONFLICT (entity_type, entity_id, location_type, location_id) DO NOTHING
      RETURNING id;
    `);
    console.log(`✓ Migrated ${guideCountries.length} guide countries`);

    // Migrate guide regions
    const { rows: guideRegions } = await client.query(`
      INSERT INTO entity_locations (entity_type, entity_id, location_type, location_id, location_name)
      SELECT
        'guide' as entity_type,
        guide_id as entity_id,
        'region' as location_type,
        region_id as location_id,
        r.name as location_name
      FROM guide_regions gr
      LEFT JOIN regions r ON r.id = gr.region_id
      ON CONFLICT (entity_type, entity_id, location_type, location_id) DO NOTHING
      RETURNING id;
    `);
    console.log(`✓ Migrated ${guideRegions.length} guide regions`);

    // Migrate guide cities
    const { rows: guideCities } = await client.query(`
      INSERT INTO entity_locations (entity_type, entity_id, location_type, location_id, location_name)
      SELECT
        'guide' as entity_type,
        guide_id as entity_id,
        'city' as location_type,
        city_id as location_id,
        c.name as location_name
      FROM guide_cities gc
      LEFT JOIN cities c ON c.id = gc.city_id
      ON CONFLICT (entity_type, entity_id, location_type, location_id) DO NOTHING
      RETURNING id;
    `);
    console.log(`✓ Migrated ${guideCities.length} guide cities`);

    // Migrate guide parks
    const { rows: guideParks } = await client.query(`
      INSERT INTO entity_locations (entity_type, entity_id, location_type, location_id, location_name)
      SELECT
        'guide' as entity_type,
        guide_id as entity_id,
        'park' as location_type,
        park_id as location_id,
        np.name as location_name
      FROM guide_parks gp
      LEFT JOIN national_parks np ON np.id = gp.park_id
      ON CONFLICT (entity_type, entity_id, location_type, location_id) DO NOTHING
      RETURNING id;
    `);
    console.log(`✓ Migrated ${guideParks.length} guide parks`);

    // Migrate guide attractions
    const { rows: guideAttractions } = await client.query(`
      INSERT INTO entity_locations (entity_type, entity_id, location_type, location_id, location_name)
      SELECT
        'guide' as entity_type,
        guide_id as entity_id,
        'attraction' as location_type,
        attraction_id as location_id,
        ta.name as location_name
      FROM guide_attractions ga
      LEFT JOIN tourist_attractions ta ON ta.id = ga.attraction_id
      ON CONFLICT (entity_type, entity_id, location_type, location_id) DO NOTHING
      RETURNING id;
    `);
    console.log(`✓ Migrated ${guideAttractions.length} guide attractions`);

    // ============================================================================
    // 3. MIGRATE DMC LOCATION DATA
    // ============================================================================
    console.log('\n[3/5] Migrating DMC location data...\n');

    // Migrate DMC countries
    const { rows: dmcCountries } = await client.query(`
      INSERT INTO entity_locations (entity_type, entity_id, location_type, location_id, location_name)
      SELECT
        'dmc' as entity_type,
        dc.agency_id as entity_id,
        'country' as location_type,
        dc.country_code as location_id,
        c.name as location_name
      FROM dmc_countries dc
      LEFT JOIN countries c ON c.code = dc.country_code
      LEFT JOIN agencies a ON a.id = dc.agency_id AND a.type = 'dmc'
      WHERE a.id IS NOT NULL
      ON CONFLICT (entity_type, entity_id, location_type, location_id) DO NOTHING
      RETURNING id;
    `);
    console.log(`✓ Migrated ${dmcCountries.length} DMC countries`);

    // Migrate DMC regions
    const { rows: dmcRegions } = await client.query(`
      INSERT INTO entity_locations (entity_type, entity_id, location_type, location_id, location_name)
      SELECT
        'dmc' as entity_type,
        dr.agency_id as entity_id,
        'region' as location_type,
        dr.region_id as location_id,
        r.name as location_name
      FROM dmc_regions dr
      LEFT JOIN regions r ON r.id = dr.region_id
      LEFT JOIN agencies a ON a.id = dr.agency_id AND a.type = 'dmc'
      WHERE a.id IS NOT NULL
      ON CONFLICT (entity_type, entity_id, location_type, location_id) DO NOTHING
      RETURNING id;
    `);
    console.log(`✓ Migrated ${dmcRegions.length} DMC regions`);

    // Migrate DMC cities
    const { rows: dmcCities } = await client.query(`
      INSERT INTO entity_locations (entity_type, entity_id, location_type, location_id, location_name)
      SELECT
        'dmc' as entity_type,
        dc.agency_id as entity_id,
        'city' as location_type,
        dc.city_id as location_id,
        c.name as location_name
      FROM dmc_cities dc
      LEFT JOIN cities c ON c.id = dc.city_id
      LEFT JOIN agencies a ON a.id = dc.agency_id AND a.type = 'dmc'
      WHERE a.id IS NOT NULL
      ON CONFLICT (entity_type, entity_id, location_type, location_id) DO NOTHING
      RETURNING id;
    `);
    console.log(`✓ Migrated ${dmcCities.length} DMC cities`);

    // ============================================================================
    // 4. MIGRATE TRANSPORT LOCATION DATA
    // ============================================================================
    console.log('\n[4/5] Migrating transport location data...\n');

    // Migrate transport countries
    const { rows: transportCountries } = await client.query(`
      INSERT INTO entity_locations (entity_type, entity_id, location_type, location_id, location_name)
      SELECT
        'transport' as entity_type,
        tc.transport_agency_id as entity_id,
        'country' as location_type,
        tc.country_code as location_id,
        c.name as location_name
      FROM transport_countries tc
      LEFT JOIN countries c ON c.code = tc.country_code
      LEFT JOIN agencies a ON a.id = tc.transport_agency_id AND a.type = 'transport'
      WHERE a.id IS NOT NULL
      ON CONFLICT (entity_type, entity_id, location_type, location_id) DO NOTHING
      RETURNING id;
    `);
    console.log(`✓ Migrated ${transportCountries.length} transport countries`);

    // Migrate transport regions
    const { rows: transportRegions } = await client.query(`
      INSERT INTO entity_locations (entity_type, entity_id, location_type, location_id, location_name)
      SELECT
        'transport' as entity_type,
        tr.transport_agency_id as entity_id,
        'region' as location_type,
        tr.region_id as location_id,
        r.name as location_name
      FROM transport_regions tr
      LEFT JOIN regions r ON r.id = tr.region_id
      LEFT JOIN agencies a ON a.id = tr.transport_agency_id AND a.type = 'transport'
      WHERE a.id IS NOT NULL
      ON CONFLICT (entity_type, entity_id, location_type, location_id) DO NOTHING
      RETURNING id;
    `);
    console.log(`✓ Migrated ${transportRegions.length} transport regions`);

    // Migrate transport cities
    const { rows: transportCities } = await client.query(`
      INSERT INTO entity_locations (entity_type, entity_id, location_type, location_id, location_name)
      SELECT
        'transport' as entity_type,
        tc.transport_agency_id as entity_id,
        'city' as location_type,
        tc.city_id as location_id,
        c.name as location_name
      FROM transport_cities tc
      LEFT JOIN cities c ON c.id = tc.city_id
      LEFT JOIN agencies a ON a.id = tc.transport_agency_id AND a.type = 'transport'
      WHERE a.id IS NOT NULL
      ON CONFLICT (entity_type, entity_id, location_type, location_id) DO NOTHING
      RETURNING id;
    `);
    console.log(`✓ Migrated ${transportCities.length} transport cities`);

    // ============================================================================
    // 5. VERIFICATION
    // ============================================================================
    console.log('\n[5/5] Verifying migration...\n');

    const { rows: totalLocations } = await client.query('SELECT COUNT(*) as count FROM entity_locations;');
    const { rows: byType } = await client.query(`
      SELECT entity_type, location_type, COUNT(*) as count
      FROM entity_locations
      GROUP BY entity_type, location_type
      ORDER BY entity_type, location_type;
    `);

    console.log(`Total location relationships: ${totalLocations[0].count}`);
    console.log('\nBreakdown by entity and location type:');
    byType.forEach(row => {
      console.log(`  - ${row.entity_type} → ${row.location_type}: ${row.count}`);
    });

    // Calculate expected totals from old tables
    const totalGuideLocations =
      guideCountries.length + guideRegions.length + guideCities.length +
      guideParks.length + guideAttractions.length;
    const totalDmcLocations = dmcCountries.length + dmcRegions.length + dmcCities.length;
    const totalTransportLocations = transportCountries.length + transportRegions.length + transportCities.length;
    const expectedTotal = totalGuideLocations + totalDmcLocations + totalTransportLocations;

    console.log(`\nExpected total from old tables: ${expectedTotal}`);
    console.log(`Actual total in entity_locations: ${totalLocations[0].count}`);

    if (parseInt(totalLocations[0].count) === expectedTotal) {
      console.log('✓ Verification passed: Row counts match!');
    } else {
      console.log('⚠ Warning: Row count mismatch - please review data');
    }

    await client.query('COMMIT');

    console.log('\n================================================================================');
    console.log('PHASE 3 COMPLETE!');
    console.log('================================================================================');
    console.log('Summary:');
    console.log(`  - Created unified entity_locations table`);
    console.log(`  - Migrated ${totalGuideLocations} guide location relationships`);
    console.log(`  - Migrated ${totalDmcLocations} DMC location relationships`);
    console.log(`  - Migrated ${totalTransportLocations} transport location relationships`);
    console.log(`  - Total: ${totalLocations[0].count} location relationships`);
    console.log('  - Old junction tables remain untouched (will be removed in Phase 5)');
    console.log('================================================================================\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n✗ Error during Phase 3:', error.message);
    console.error('Transaction rolled back. No changes made.');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

phase3().catch(err => {
  console.error('Phase 3 failed:', err);
  process.exit(1);
});

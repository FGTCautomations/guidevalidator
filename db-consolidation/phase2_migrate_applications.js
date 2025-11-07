const { Pool } = require('pg');

const pool = new Pool({
  host: 'db.vhqzmunorymtoisijiqb.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Vertrouwen17#',
  ssl: { rejectUnauthorized: false }
});

async function phase2() {
  const client = await pool.connect();

  try {
    console.log('================================================================================');
    console.log('PHASE 2: MIGRATE APPLICATION DATA TO MASTER TABLES');
    console.log('This phase moves application data into guides and agencies tables');
    console.log('================================================================================\n');

    await client.query('BEGIN');

    // ============================================================================
    // 1. MIGRATE GUIDE APPLICATIONS
    // ============================================================================
    console.log('[1/3] Migrating guide_applications to guides table...\n');

    // Check how many guide applications exist
    const { rows: guideApps } = await client.query(`
      SELECT COUNT(*) as count FROM guide_applications;
    `);
    console.log(`Found ${guideApps[0].count} guide applications to migrate`);

    if (parseInt(guideApps[0].count) > 0) {
      // Migrate guide applications to guides table and create/update profiles
      const { rows: migratedGuides } = await client.query(`
        WITH application_data AS (
          SELECT
            ga.id,
            ga.user_id,
            ga.full_name,
            ga.contact_email as login_email,
            ga.locale,
            ga.nationality as country_code,
            ga.timezone,
            ga.avatar_url,
            ga.profile_photo_url,
            ga.status,
            ga.created_at,
            ga.updated_at,
            ga.professional_intro,
            ga.headline,
            ga.bio,
            ga.specializations,
            ga.expertise_areas,
            ga.languages_spoken,
            ga.experience_years,
            ga.experience_summary,
            ga.license_number,
            ga.license_authority,
            ga.license_proof_url,
            ga.id_document_url,
            ga.sample_itineraries,
            ga.media_gallery,
            ga.availability,
            ga.availability_timezone,
            ga.working_hours,
            ga.location_data,
            ga.subscription_plan,
            ga.billing_details,
            to_jsonb(ga.*) as original_application
          FROM guide_applications ga
        ),
        upserted_profiles AS (
          INSERT INTO profiles (
            id,
            role,
            full_name,
            locale,
            country_code,
            timezone,
            avatar_url,
            application_status,
            application_submitted_at,
            created_at,
            updated_at
          )
          SELECT
            COALESCE(ad.user_id, gen_random_uuid()),
            'guide'::user_role,
            ad.full_name,
            ad.locale,
            ad.country_code,
            ad.timezone,
            COALESCE(ad.avatar_url, ad.profile_photo_url),
            CASE
              WHEN ad.status = 'approved' THEN 'approved'
              WHEN ad.status = 'rejected' THEN 'rejected'
              ELSE 'pending'
            END,
            ad.created_at,
            ad.created_at,
            ad.updated_at
          FROM application_data ad
          ON CONFLICT (id) DO UPDATE SET
            application_status = EXCLUDED.application_status,
            application_submitted_at = EXCLUDED.application_submitted_at,
            updated_at = EXCLUDED.updated_at
          RETURNING id, full_name, application_status
        )
        INSERT INTO guides (
          profile_id,
          headline,
          bio,
          professional_intro,
          specialties,
          expertise_areas,
          spoken_languages,
          years_experience,
          experience_summary,
          license_number,
          license_authority,
          license_proof_url,
          id_document_url,
          avatar_url,
          profile_photo_url,
          sample_itineraries,
          media_gallery,
          timezone,
          availability_timezone,
          working_hours,
          location_data,
          application_data,
          created_at,
          updated_at
        )
        SELECT
          up.id,
          ad.professional_intro,  -- Use professional_intro as headline if no headline
          ad.bio,
          ad.professional_intro,
          ad.specializations,
          ad.expertise_areas,
          COALESCE(
            (SELECT array_agg(lang->>'code')
             FROM jsonb_array_elements(ad.languages_spoken) lang),
            ARRAY[]::text[]
          ),
          ad.experience_years,
          ad.experience_summary,
          ad.license_number,
          ad.license_authority,
          ad.license_proof_url,
          ad.id_document_url,
          ad.avatar_url,
          ad.profile_photo_url,
          ad.sample_itineraries,
          ad.media_gallery,
          ad.timezone,
          ad.availability_timezone,
          ad.working_hours,
          ad.location_data,
          ad.original_application,
          ad.created_at,
          ad.updated_at
        FROM application_data ad
        INNER JOIN upserted_profiles up ON (up.id = COALESCE(ad.user_id, up.id))
        ON CONFLICT (profile_id) DO UPDATE SET
          professional_intro = EXCLUDED.professional_intro,
          sample_itineraries = EXCLUDED.sample_itineraries,
          media_gallery = EXCLUDED.media_gallery,
          location_data = EXCLUDED.location_data,
          application_data = EXCLUDED.application_data,
          updated_at = EXCLUDED.updated_at
        RETURNING profile_id;
      `);

      console.log(`✓ Migrated ${migratedGuides.length} guide applications to guides table`);
    } else {
      console.log('✓ No guide applications to migrate');
    }

    // ============================================================================
    // 2. MIGRATE AGENCY/DMC/TRANSPORT APPLICATIONS
    // ============================================================================
    console.log('\n[2/3] Migrating agency/dmc/transport applications to agencies table...\n');

    // Check agency applications
    const { rows: agencyApps } = await client.query(`
      SELECT COUNT(*) as count FROM agency_applications;
    `);
    console.log(`Found ${agencyApps[0].count} agency applications`);

    const { rows: dmcApps } = await client.query(`
      SELECT COUNT(*) as count FROM dmc_applications;
    `);
    console.log(`Found ${dmcApps[0].count} DMC applications`);

    const { rows: transportApps } = await client.query(`
      SELECT COUNT(*) as count FROM transport_applications;
    `);
    console.log(`Found ${transportApps[0].count} transport applications`);

    let totalAgencyMigrations = 0;

    // Migrate agency applications
    if (parseInt(agencyApps[0].count) > 0) {
      const { rows: migratedAgencies } = await client.query(`
        INSERT INTO agencies (
          id,
          type,
          name,
          slug,
          country_code,
          description,
          registration_number,
          vat_id,
          website,
          logo_url,
          languages,
          specialties,
          contact_email,
          contact_phone,
          location_data,
          application_status,
          application_submitted_at,
          application_data,
          created_at,
          updated_at
        )
        SELECT
          COALESCE(id, gen_random_uuid()),
          'agency'::agency_type,
          legal_company_name,
          lower(regexp_replace(legal_company_name, '[^a-zA-Z0-9]+', '-', 'g')),
          registration_country,
          company_description,
          registration_number,
          tax_id,
          website_url,
          logo_url,
          COALESCE(languages_spoken, ARRAY[]::text[]),
          COALESCE(services_offered, ARRAY[]::text[]),
          contact_email,
          contact_phone,
          COALESCE(location_data, jsonb_build_object('countries', ARRAY[]::text[])),
          CASE
            WHEN status = 'approved' THEN 'approved'
            WHEN status = 'rejected' THEN 'rejected'
            ELSE 'pending'
          END,
          created_at,
          to_jsonb(agency_applications.*),
          created_at,
          updated_at
        FROM agency_applications
        ON CONFLICT (id) DO UPDATE SET
          application_status = EXCLUDED.application_status,
          application_data = EXCLUDED.application_data,
          updated_at = EXCLUDED.updated_at
        RETURNING id;
      `);
      totalAgencyMigrations += migratedAgencies.length;
      console.log(`✓ Migrated ${migratedAgencies.length} agency applications`);
    }

    // Migrate DMC applications
    if (parseInt(dmcApps[0].count) > 0) {
      const { rows: migratedDMCs } = await client.query(`
        INSERT INTO agencies (
          id,
          type,
          name,
          slug,
          country_code,
          description,
          registration_number,
          vat_id,
          website,
          logo_url,
          languages,
          specialties,
          contact_email,
          contact_phone,
          location_data,
          application_status,
          application_submitted_at,
          application_data,
          created_at,
          updated_at
        )
        SELECT
          COALESCE(id, gen_random_uuid()),
          'dmc'::agency_type,
          legal_entity_name,
          lower(regexp_replace(legal_entity_name, '[^a-zA-Z0-9]+', '-', 'g')),
          registration_country,
          company_overview,
          registration_number,
          tax_id,
          website_url,
          logo_url,
          COALESCE(languages_spoken, ARRAY[]::text[]),
          COALESCE(services_offered, ARRAY[]::text[]),
          contact_email,
          contact_phone,
          COALESCE(location_data, jsonb_build_object('countries', ARRAY[]::text[])),
          CASE
            WHEN status = 'approved' THEN 'approved'
            WHEN status = 'rejected' THEN 'rejected'
            ELSE 'pending'
          END,
          created_at,
          to_jsonb(dmc_applications.*),
          created_at,
          updated_at
        FROM dmc_applications
        ON CONFLICT (id) DO UPDATE SET
          application_status = EXCLUDED.application_status,
          application_data = EXCLUDED.application_data,
          updated_at = EXCLUDED.updated_at
        RETURNING id;
      `);
      totalAgencyMigrations += migratedDMCs.length;
      console.log(`✓ Migrated ${migratedDMCs.length} DMC applications`);
    }

    // Migrate transport applications
    if (parseInt(transportApps[0].count) > 0) {
      const { rows: migratedTransport } = await client.query(`
        INSERT INTO agencies (
          id,
          type,
          name,
          slug,
          country_code,
          description,
          registration_number,
          website,
          logo_url,
          languages,
          specialties,
          contact_email,
          contact_phone,
          location_data,
          fleet_data,
          application_status,
          application_submitted_at,
          application_data,
          created_at,
          updated_at
        )
        SELECT
          COALESCE(id, gen_random_uuid()),
          'transport'::agency_type,
          legal_entity_name,
          lower(regexp_replace(legal_entity_name, '[^a-zA-Z0-9]+', '-', 'g')),
          registration_country,
          short_description,
          registration_number,
          website_url,
          logo_url,
          COALESCE(languages_spoken, ARRAY[]::text[]),
          COALESCE(service_types, ARRAY[]::text[]),
          contact_email,
          contact_phone,
          COALESCE(location_data, jsonb_build_object('countries', ARRAY[registration_country])),
          fleet_overview,
          CASE
            WHEN status = 'approved' THEN 'approved'
            WHEN status = 'rejected' THEN 'rejected'
            ELSE 'pending'
          END,
          created_at,
          to_jsonb(transport_applications.*),
          created_at,
          updated_at
        FROM transport_applications
        ON CONFLICT (id) DO UPDATE SET
          application_status = EXCLUDED.application_status,
          application_data = EXCLUDED.application_data,
          fleet_data = EXCLUDED.fleet_data,
          updated_at = EXCLUDED.updated_at
        RETURNING id;
      `);
      totalAgencyMigrations += migratedTransport.length;
      console.log(`✓ Migrated ${migratedTransport.length} transport applications`);
    }

    // ============================================================================
    // 3. VERIFICATION
    // ============================================================================
    console.log('\n[3/3] Verifying migration...\n');

    const { rows: guideCount } = await client.query('SELECT COUNT(*) FROM guides;');
    const { rows: agencyCount } = await client.query('SELECT COUNT(*) FROM agencies;');
    const { rows: profileCount } = await client.query(`SELECT COUNT(*) FROM profiles WHERE role IN ('guide', 'agency', 'dmc', 'transport');`);

    console.log(`Total guides in master table: ${guideCount[0].count}`);
    console.log(`Total agencies/DMCs/transport in master table: ${agencyCount[0].count}`);
    console.log(`Total service provider profiles: ${profileCount[0].count}`);

    await client.query('COMMIT');

    console.log('\n================================================================================');
    console.log('PHASE 2 COMPLETE!');
    console.log('================================================================================');
    console.log('Summary:');
    console.log(`  - Migrated guide applications: ${guideApps[0].count}`);
    console.log(`  - Migrated agency/DMC/transport applications: ${totalAgencyMigrations}`);
    console.log('  - All application data preserved in application_data column');
    console.log('  - Original application tables remain untouched (will be removed in Phase 5)');
    console.log('================================================================================\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n✗ Error during Phase 2:', error.message);
    console.error('Transaction rolled back. No changes made.');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

phase2().catch(err => {
  console.error('Phase 2 failed:', err);
  process.exit(1);
});

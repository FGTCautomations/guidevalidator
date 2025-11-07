-- Create 3 test profiles for DMC, Agency, and Transport segments
-- Run this in Supabase SQL Editor

-- ===================================
-- 1. CREATE TEST AGENCY PROFILE
-- ===================================

-- Insert profile for agency
DO $$
DECLARE
  v_agency_id UUID := gen_random_uuid();
BEGIN
  -- Create profile
  INSERT INTO profiles (
    id,
    full_name,
    role,
    country_code,
    application_status,
    verified,
    profile_completed,
    profile_completion_percentage,
    application_data,
    created_at,
    updated_at
  )
  VALUES (
    v_agency_id,
    'Sunrise Travel Agency',
    'agency',
    'VN',
    'approved',
    true,
    true,
    100,
    jsonb_build_object(
      'websiteUrl', 'https://sunrisetravelagency.com',
      'logoUrl', 'https://via.placeholder.com/150/FF6B6B/FFFFFF?text=STA',
      'registrationCountry', 'VN',
      'companyDescription', 'Leading travel agency specializing in Southeast Asian tours'
    ),
    NOW(),
    NOW()
  );

  -- Insert into agencies table
  INSERT INTO agencies (
    id,
    languages,
    specialties,
    niche_focus,
    created_at,
    updated_at
  )
  VALUES (
    v_agency_id,
    ARRAY['en', 'vi', 'fr']::text[],
    ARRAY['Cultural Tours', 'Adventure Travel', 'Beach Holidays']::text[],
    ARRAY['Family Travel', 'Luxury Tours']::text[],
    NOW(),
    NOW()
  );

  RAISE NOTICE 'Created Agency Profile: %', v_agency_id;
END $$;

-- ===================================
-- 2. CREATE TEST DMC PROFILE
-- ===================================

DO $$
DECLARE
  v_dmc_id UUID := gen_random_uuid();
BEGIN
  -- Create profile
  INSERT INTO profiles (
    id,
    full_name,
    role,
    country_code,
    application_status,
    verified,
    profile_completed,
    profile_completion_percentage,
    application_data,
    created_at,
    updated_at
  )
  VALUES (
    v_dmc_id,
    'Thailand DMC Services',
    'dmc',
    'TH',
    'approved',
    true,
    true,
    100,
    jsonb_build_object(
      'websiteUrl', 'https://thailanddmc.com',
      'logoUrl', 'https://via.placeholder.com/150/4ECDC4/FFFFFF?text=TDMC',
      'registrationCountry', 'TH',
      'companyDescription', 'Premier destination management company in Thailand'
    ),
    NOW(),
    NOW()
  );

  -- Insert into agencies table (DMCs also use agencies table)
  INSERT INTO agencies (
    id,
    languages,
    specialties,
    niche_focus,
    created_at,
    updated_at
  )
  VALUES (
    v_dmc_id,
    ARRAY['en', 'th', 'zh']::text[],
    ARRAY['Ground Transportation', 'Hotel Bookings', 'Event Management', 'MICE Services']::text[],
    ARRAY['Corporate Events', 'Incentive Travel']::text[],
    NOW(),
    NOW()
  );

  RAISE NOTICE 'Created DMC Profile: %', v_dmc_id;
END $$;

-- ===================================
-- 3. CREATE TEST TRANSPORT PROFILE
-- ===================================

DO $$
DECLARE
  v_transport_id UUID := gen_random_uuid();
BEGIN
  -- Create profile (Transport profiles only go in profiles table)
  INSERT INTO profiles (
    id,
    full_name,
    role,
    country_code,
    application_status,
    verified,
    profile_completed,
    profile_completion_percentage,
    application_data,
    created_at,
    updated_at
  )
  VALUES (
    v_transport_id,
    'Manila Express Transport',
    'transport',
    'PH',
    'approved',
    true,
    true,
    100,
    jsonb_build_object(
      'websiteUrl', 'https://manilaexpress.ph',
      'logoUrl', 'https://via.placeholder.com/150/95E1D3/000000?text=MET',
      'registrationCountry', 'PH',
      'companyDescription', 'Reliable transport services across the Philippines',
      'languages', ARRAY['en', 'tl', 'zh'],
      'serviceTypes', ARRAY['Airport Transfers', 'Private Car Hire', 'Bus Services', 'Van Rentals']
    ),
    NOW(),
    NOW()
  );

  RAISE NOTICE 'Created Transport Profile: %', v_transport_id;
END $$;

-- ===================================
-- VERIFY THE PROFILES WERE CREATED
-- ===================================

SELECT
  p.id,
  p.full_name,
  p.role,
  p.country_code,
  p.application_status,
  p.verified,
  a.languages as agency_languages,
  a.specialties as agency_specialties,
  p.application_data->>'languages' as transport_languages,
  p.application_data->>'serviceTypes' as transport_service_types
FROM profiles p
LEFT JOIN agencies a ON a.id = p.id
WHERE p.role IN ('agency', 'dmc', 'transport')
  AND p.full_name IN ('Sunrise Travel Agency', 'Thailand DMC Services', 'Manila Express Transport')
ORDER BY p.role, p.created_at DESC;

-- ===================================
-- REFRESH MATERIALIZED VIEWS
-- ===================================

REFRESH MATERIALIZED VIEW CONCURRENTLY agencies_browse_v;
REFRESH MATERIALIZED VIEW CONCURRENTLY dmcs_browse_v;
REFRESH MATERIALIZED VIEW CONCURRENTLY transport_browse_v;

-- ===================================
-- VERIFY DATA IN MATERIALIZED VIEWS
-- ===================================

SELECT 'agencies_browse_v' as view_name, COUNT(*) as row_count FROM agencies_browse_v
UNION ALL
SELECT 'dmcs_browse_v', COUNT(*) FROM dmcs_browse_v
UNION ALL
SELECT 'transport_browse_v', COUNT(*) FROM transport_browse_v;

-- View the actual data
SELECT 
  'AGENCIES' as type,
  id,
  name,
  country_code,
  array_to_string(languages, ', ') as languages,
  array_to_string(specialties, ', ') as specialties
FROM agencies_browse_v;

SELECT 
  'DMCS' as type,
  id,
  name,
  country_code,
  array_to_string(languages, ', ') as languages,
  array_to_string(specialties, ', ') as specialties
FROM dmcs_browse_v;

SELECT 
  'TRANSPORT' as type,
  id,
  name,
  country_code,
  array_to_string(languages, ', ') as languages,
  array_to_string(service_types, ', ') as service_types
FROM transport_browse_v;

-- ===================================
-- TEST THE RPC FUNCTIONS
-- ===================================

-- Test agency search
SELECT 'Testing api_agencies_search' as test;
SELECT api_agencies_search(
  p_country := 'VN',
  p_languages := NULL,
  p_specialties := NULL,
  p_niche_focus := NULL,
  p_q := NULL,
  p_min_rating := NULL,
  p_license_only := false,
  p_sort := 'featured',
  p_cursor := NULL,
  p_limit := 24
);

-- Test DMC search
SELECT 'Testing api_dmcs_search' as test;
SELECT api_dmcs_search(
  p_country := 'TH',
  p_languages := NULL,
  p_specializations := NULL,
  p_services := NULL,
  p_q := NULL,
  p_min_rating := NULL,
  p_license_only := false,
  p_sort := 'featured',
  p_cursor := NULL,
  p_limit := 24
);

-- Test Transport search
SELECT 'Testing api_transport_search' as test;
SELECT api_transport_search(
  p_country := 'PH',
  p_languages := NULL,
  p_service_types := NULL,
  p_q := NULL,
  p_min_rating := NULL,
  p_license_only := false,
  p_sort := 'featured',
  p_cursor := NULL,
  p_limit := 24
);


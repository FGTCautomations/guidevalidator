-- Create 3 test profiles for DMC, Agency, and Transport segments
-- WITH auth users (required for foreign key constraint)
-- Run this in Supabase SQL Editor

-- ===================================
-- 1. CREATE TEST AGENCY PROFILE
-- ===================================

DO $$
DECLARE
  v_agency_id UUID := gen_random_uuid();
BEGIN
  -- Create auth user first
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    confirmation_sent_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    confirmation_token,
    recovery_token
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_agency_id,
    'authenticated',
    'authenticated',
    'test-agency-' || substr(v_agency_id::text, 1, 8) || '@example.com',
    crypt('TestPassword123!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    NOW(),
    jsonb_build_object('provider', 'email', 'providers', array['email']),
    jsonb_build_object('full_name', 'Sunrise Travel Agency'),
    false,
    encode(gen_random_bytes(32), 'hex'),
    encode(gen_random_bytes(32), 'hex')
  );

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

  RAISE NOTICE 'Created Agency Profile: % - Sunrise Travel Agency (VN)', v_agency_id;
END $$;

-- ===================================
-- 2. CREATE TEST DMC PROFILE
-- ===================================

DO $$
DECLARE
  v_dmc_id UUID := gen_random_uuid();
BEGIN
  -- Create auth user first
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    confirmation_sent_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    confirmation_token,
    recovery_token
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_dmc_id,
    'authenticated',
    'authenticated',
    'test-dmc-' || substr(v_dmc_id::text, 1, 8) || '@example.com',
    crypt('TestPassword123!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    NOW(),
    jsonb_build_object('provider', 'email', 'providers', array['email']),
    jsonb_build_object('full_name', 'Thailand DMC Services'),
    false,
    encode(gen_random_bytes(32), 'hex'),
    encode(gen_random_bytes(32), 'hex')
  );

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
    v_dmc_id,
    ARRAY['en', 'th', 'zh']::text[],
    ARRAY['Ground Transportation', 'Hotel Bookings', 'Event Management', 'MICE Services']::text[],
    ARRAY['Corporate Events', 'Incentive Travel']::text[],
    NOW(),
    NOW()
  );

  RAISE NOTICE 'Created DMC Profile: % - Thailand DMC Services (TH)', v_dmc_id;
END $$;

-- ===================================
-- 3. CREATE TEST TRANSPORT PROFILE
-- ===================================

DO $$
DECLARE
  v_transport_id UUID := gen_random_uuid();
BEGIN
  -- Create auth user first
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    confirmation_sent_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    confirmation_token,
    recovery_token
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_transport_id,
    'authenticated',
    'authenticated',
    'test-transport-' || substr(v_transport_id::text, 1, 8) || '@example.com',
    crypt('TestPassword123!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    NOW(),
    jsonb_build_object('provider', 'email', 'providers', array['email']),
    jsonb_build_object('full_name', 'Manila Express Transport'),
    false,
    encode(gen_random_bytes(32), 'hex'),
    encode(gen_random_bytes(32), 'hex')
  );

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

  RAISE NOTICE 'Created Transport Profile: % - Manila Express Transport (PH)', v_transport_id;
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
  p.application_data->>'languages' as transport_languages
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

-- View actual data
SELECT 'AGENCIES' as type, id, name, country_code FROM agencies_browse_v;
SELECT 'DMCS' as type, id, name, country_code FROM dmcs_browse_v;
SELECT 'TRANSPORT' as type, id, name, country_code FROM transport_browse_v;

-- ===================================
-- SUCCESS MESSAGE
-- ===================================

SELECT '✅ All test profiles created successfully!' as status;
SELECT 'Test URLs:' as next_step;
SELECT '  - http://localhost:3000/en/directory/agencies?country=VN' as agencies_url;
SELECT '  - http://localhost:3000/en/directory/dmcs?country=TH' as dmcs_url;
SELECT '  - http://localhost:3000/en/directory/transport?country=PH' as transport_url;

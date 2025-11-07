-- Verify test profiles and materialized views
-- Run this in Supabase SQL Editor

-- ===================================
-- CHECK EXISTING TEST PROFILES
-- ===================================

SELECT
  '=== EXISTING TEST PROFILES ===' as info;

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
ORDER BY p.role, p.created_at DESC;

-- ===================================
-- REFRESH MATERIALIZED VIEWS
-- ===================================

SELECT '=== REFRESHING MATERIALIZED VIEWS ===' as info;

REFRESH MATERIALIZED VIEW CONCURRENTLY agencies_browse_v;
REFRESH MATERIALIZED VIEW CONCURRENTLY dmcs_browse_v;
REFRESH MATERIALIZED VIEW CONCURRENTLY transport_browse_v;

-- ===================================
-- CHECK MATERIALIZED VIEWS ROW COUNTS
-- ===================================

SELECT '=== MATERIALIZED VIEW ROW COUNTS ===' as info;

SELECT 'agencies_browse_v' as view_name, COUNT(*) as row_count FROM agencies_browse_v
UNION ALL
SELECT 'dmcs_browse_v', COUNT(*) FROM dmcs_browse_v
UNION ALL
SELECT 'transport_browse_v', COUNT(*) FROM transport_browse_v;

-- ===================================
-- VIEW DATA IN MATERIALIZED VIEWS
-- ===================================

SELECT '=== AGENCIES DATA ===' as info;
SELECT id, name, country_code,
       array_to_string(languages, ', ') as languages,
       array_to_string(specialties, ', ') as specialties
FROM agencies_browse_v;

SELECT '=== DMCS DATA ===' as info;
SELECT id, name, country_code,
       array_to_string(languages, ', ') as languages,
       array_to_string(specialties, ', ') as specialties
FROM dmcs_browse_v;

SELECT '=== TRANSPORT DATA ===' as info;
SELECT id, name, country_code,
       array_to_string(languages, ', ') as languages,
       array_to_string(service_types, ', ') as service_types
FROM transport_browse_v;

-- ===================================
-- TEST RPC FUNCTIONS
-- ===================================

SELECT '=== TESTING RPC FUNCTIONS ===' as info;

-- Test agencies search
SELECT 'Testing agencies search for VN' as test;
SELECT jsonb_pretty(api_agencies_search(
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
));

-- Test DMCs search
SELECT 'Testing DMCs search for TH' as test;
SELECT jsonb_pretty(api_dmcs_search(
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
));

-- Test Transport search
SELECT 'Testing transport search for PH' as test;
SELECT jsonb_pretty(api_transport_search(
  p_country := 'PH',
  p_languages := NULL,
  p_service_types := NULL,
  p_q := NULL,
  p_min_rating := NULL,
  p_license_only := false,
  p_sort := 'featured',
  p_cursor := NULL,
  p_limit := 24
));

-- ===================================
-- SUCCESS MESSAGE
-- ===================================

SELECT '✅ Verification complete!' as status;
SELECT 'If you see data above, test in browser:' as next_step;
SELECT '  - http://localhost:3000/en/directory/agencies?country=VN' as agencies_url;
SELECT '  - http://localhost:3000/en/directory/dmcs?country=TH' as dmcs_url;
SELECT '  - http://localhost:3000/en/directory/transport?country=PH' as transport_url;

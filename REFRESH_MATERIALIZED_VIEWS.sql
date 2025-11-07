-- Refresh all materialized views for directory search
-- Run this in Supabase SQL Editor after applying the migration

-- Check if views exist first
SELECT 
  schemaname, 
  matviewname, 
  hasindexes, 
  ispopulated 
FROM pg_matviews 
WHERE matviewname IN ('agencies_browse_v', 'dmcs_browse_v', 'transport_browse_v');

-- Refresh materialized views (this will populate them with data)
REFRESH MATERIALIZED VIEW CONCURRENTLY agencies_browse_v;
REFRESH MATERIALIZED VIEW CONCURRENTLY dmcs_browse_v;
REFRESH MATERIALIZED VIEW CONCURRENTLY transport_browse_v;

-- Check row counts
SELECT 'agencies_browse_v' as view_name, COUNT(*) as row_count FROM agencies_browse_v
UNION ALL
SELECT 'dmcs_browse_v', COUNT(*) FROM dmcs_browse_v
UNION ALL
SELECT 'transport_browse_v', COUNT(*) FROM transport_browse_v;

-- Check if we have any approved agencies/DMCs/transport in the database
SELECT 
  'agencies' as table_name,
  COUNT(*) FILTER (WHERE role = 'agency' AND application_status = 'approved') as approved_agencies,
  COUNT(*) FILTER (WHERE role = 'dmc' AND application_status = 'approved') as approved_dmcs
FROM profiles;

SELECT 
  'Total profiles by role' as info,
  role,
  application_status,
  COUNT(*) as count
FROM profiles
WHERE role IN ('agency', 'dmc', 'transport')
GROUP BY role, application_status
ORDER BY role, application_status;

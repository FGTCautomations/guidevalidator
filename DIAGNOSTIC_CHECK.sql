-- ============================================================================
-- DIAGNOSTIC: Check what columns exist in guides table
-- Run this in Supabase SQL Editor to see current schema
-- ============================================================================

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'guides'
ORDER BY ordinal_position;

-- ============================================================================
-- This will show you exactly what columns exist in your guides table
-- Look for: avatar_url, business_name, timezone, availability_timezone, working_hours
-- ============================================================================

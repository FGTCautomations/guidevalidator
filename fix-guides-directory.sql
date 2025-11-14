-- ================================================
-- FIX GUIDES DIRECTORY AND ADMIN PANEL
-- ================================================

-- Step 1: Check current state of materialized view
SELECT COUNT(*) as current_count FROM guides_browse_v;

-- Step 2: Refresh the materialized view to populate it with guides
REFRESH MATERIALIZED VIEW CONCURRENTLY guides_browse_v;

-- Step 3: Verify it's populated
SELECT COUNT(*) as new_count FROM guides_browse_v;

-- Step 4: Check sample of guides with avatar_url
SELECT
  profile_id,
  full_name,
  avatar_url,
  license_number,
  country_code
FROM guides_browse_v
LIMIT 10;

-- Step 5: Check profiles table for avatar_url column
SELECT
  p.id,
  p.full_name,
  p.avatar_url,
  p.role
FROM profiles p
WHERE p.role = 'guide'
LIMIT 5;

-- Step 6: Verify guides table has avatar_url
SELECT
  g.profile_id,
  g.avatar_url,
  g.license_number
FROM guides g
LIMIT 5;

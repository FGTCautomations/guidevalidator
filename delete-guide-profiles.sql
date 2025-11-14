-- Delete all guide profiles from profiles table
-- Run this in Supabase SQL Editor

-- First, check how many guide profiles exist
SELECT COUNT(*) as total_guide_profiles
FROM profiles
WHERE role = 'guide';

-- Delete guide profiles in batches to avoid timeout
-- You may need to run this multiple times until it returns 0 rows affected

DELETE FROM profiles
WHERE id IN (
  SELECT id
  FROM profiles
  WHERE role = 'guide'
  LIMIT 1000
);

-- Check remaining count
SELECT COUNT(*) as remaining_guide_profiles
FROM profiles
WHERE role = 'guide';

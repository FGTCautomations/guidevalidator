-- Delete all guide profiles and their related records
-- Run this in Supabase SQL Editor

-- Step 1: Check how many guide profiles exist
SELECT COUNT(*) as total_guide_profiles
FROM profiles
WHERE role = 'guide';

-- Step 2: Delete audit logs for guide profiles first (in batches)
-- Run this multiple times until it returns 0
DELETE FROM audit_logs
WHERE actor_id IN (
  SELECT id
  FROM profiles
  WHERE role = 'guide'
  LIMIT 1000
);

-- Step 3: Check remaining audit logs
SELECT COUNT(*) as remaining_audit_logs_for_guides
FROM audit_logs
WHERE actor_id IN (
  SELECT id
  FROM profiles
  WHERE role = 'guide'
);

-- Step 4: After audit logs are cleared, delete guide profiles in batches
-- Run this multiple times until it returns 0
DELETE FROM profiles
WHERE id IN (
  SELECT id
  FROM profiles
  WHERE role = 'guide'
  LIMIT 1000
);

-- Step 5: Check remaining guide profiles
SELECT COUNT(*) as remaining_guide_profiles
FROM profiles
WHERE role = 'guide';

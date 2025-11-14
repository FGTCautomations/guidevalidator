-- ============================================================================
-- DEBUG: Find all agencies including "Leo Loves Travel"
-- ============================================================================

-- Show ALL agencies regardless of status
SELECT
  id,
  name,
  type,
  application_status,
  application_submitted_at,
  created_at,
  verified
FROM agencies
ORDER BY created_at DESC;

-- Search for agencies with "Leo" in the name
SELECT
  id,
  name,
  type,
  application_status,
  application_submitted_at,
  created_at,
  verified
FROM agencies
WHERE name ILIKE '%Leo%'
   OR name ILIKE '%Loves%'
   OR name ILIKE '%Travel%';

-- Check if there are any auth users without corresponding agencies
SELECT
  u.id,
  u.email,
  u.created_at,
  u.banned_until,
  u.raw_user_meta_data->>'full_name' as name,
  u.raw_user_meta_data->>'role' as role,
  a.id as agency_id,
  a.name as agency_name,
  a.application_status
FROM auth.users u
LEFT JOIN agencies a ON a.id = u.id
WHERE u.raw_user_meta_data->>'role' = 'agency'
ORDER BY u.created_at DESC
LIMIT 10;

-- Check profiles table for agency users
SELECT
  p.id,
  p.full_name,
  p.role,
  p.created_at,
  p.organization_id,
  a.name as agency_name,
  a.application_status as agency_status
FROM profiles p
LEFT JOIN agencies a ON a.id = p.organization_id OR a.id = p.id
WHERE p.role = 'agency'
ORDER BY p.created_at DESC
LIMIT 10;

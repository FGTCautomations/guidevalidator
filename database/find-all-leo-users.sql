-- ============================================================================
-- FIND ALL USERS/AGENCIES WITH "LEO" IN NAME
-- ============================================================================

-- Check auth.users for Leo
SELECT
  id,
  email,
  created_at,
  banned_until,
  raw_user_meta_data->>'full_name' as full_name,
  raw_user_meta_data->>'role' as role,
  raw_user_meta_data->>'pending_approval' as pending_approval
FROM auth.users
WHERE
  email ILIKE '%leo%'
  OR raw_user_meta_data->>'full_name' ILIKE '%leo%'
ORDER BY created_at DESC;

-- Check profiles for Leo
SELECT
  id,
  full_name,
  role,
  created_at,
  organization_id,
  application_status
FROM profiles
WHERE full_name ILIKE '%leo%'
ORDER BY created_at DESC;

-- Check agencies for Leo
SELECT
  id,
  name,
  type,
  contact_email,
  application_status,
  application_submitted_at,
  created_at,
  verified
FROM agencies
WHERE name ILIKE '%leo%'
ORDER BY created_at DESC;

-- Show the complete picture: auth + profile + agency
SELECT
  u.id as user_id,
  u.email,
  u.created_at as user_created,
  u.banned_until,
  u.raw_user_meta_data->>'full_name' as auth_name,
  p.full_name as profile_name,
  p.role,
  p.organization_id,
  a.name as agency_name,
  a.application_status,
  a.created_at as agency_created
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
LEFT JOIN agencies a ON a.id = u.id OR a.id = p.organization_id
WHERE
  u.email ILIKE '%leo%'
  OR u.raw_user_meta_data->>'full_name' ILIKE '%leo%'
  OR p.full_name ILIKE '%leo%'
ORDER BY u.created_at DESC;

-- ============================================================================
-- CHECK STATUS OF NEWLY CREATED AGENCY
-- ============================================================================
-- Check the most recent agency to see its status
--
-- Date: 2025-11-10
-- ============================================================================

-- Get the most recent agency
SELECT
  id,
  name,
  type,
  contact_email,
  application_status,
  application_submitted_at,
  created_at,
  verified,
  featured
FROM agencies
ORDER BY created_at DESC
LIMIT 5;

-- Check the auth user status
SELECT
  u.id,
  u.email,
  u.banned_until,
  u.created_at,
  u.raw_user_meta_data->>'pending_approval' as pending_approval,
  p.full_name,
  p.role,
  p.application_status as profile_application_status,
  a.application_status as agency_application_status
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
LEFT JOIN agencies a ON a.id = u.id
WHERE u.raw_user_meta_data->>'role' = 'agency'
ORDER BY u.created_at DESC
LIMIT 5;
